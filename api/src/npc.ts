import { Hono } from 'hono';
import { z } from 'zod';
import type { AppEnv } from './auth';
import { sha256hex } from './auth';
import { censor } from './censor';
import { NPCS, RULES } from './npcs';
import type { Facts } from './npcs';

// TALKING TO CHARACTERS (Pixel Quest): POST /v1/npc. The game sends which character, the language, the hero who
// speaks, a few facts about the scene and the conversation so far; a language model on Cloudflare Workers AI (the AI
// binding; the model is the NPC_MODEL variable) answers as the character and judges the player's last message (see
// npcs.ts). Without the binding, or over the limits, the answer is an error and the game falls back to its classic
// choice (a Charisma roll).
// Limits, because every answer costs money: MAX_TURNS player messages a conversation; PER_DAY answers a day for one
// player (by the hash of the IP address and the day); ALL_PER_DAY answers a day for everybody together.

export const MODEL = '@cf/deepseek-ai/deepseek-v4-flash-0731';   // when NPC_MODEL isn't set
export const BACKUP_MODEL = '@cf/meta/llama-3.3-70b-instruct-fp8-fast';   // when the first one fails
export const MAX_TURNS = 8;
export const MAX_TEXT = 300;
export const PER_DAY = 60;
export const ALL_PER_DAY = 3000;

const msgSchema = z.object({ from: z.enum(['player', 'npc']), text: z.string().min(1).max(1200) });
const bodySchema = z.object({
  npc: z.string().max(20),
  lang: z.enum(['cs', 'en']),
  hero: z.object({ name: z.string().max(20), cls: z.enum(['fighter', 'cleric', 'mage', 'thief']), g: z.enum(['m', 'f']) }),
  facts: z.record(z.string(), z.union([z.boolean(), z.number()])).optional(),
  messages: z.array(msgSchema).min(1).max(MAX_TURNS * 2),
});
export const replySchema = z.object({
  say: z.string().min(1).max(1200),
  persuasion: z.number().int().min(0).max(3),
  mood: z.enum(['hostile', 'wary', 'softening', 'moved']),
  reveal: z.array(z.string()).max(5),
  end: z.boolean(),
});
export type Reply = z.infer<typeof replySchema>;
/** The same, as JSON Schema for the model's structured output */
const REPLY_SCHEMA = {
  type: 'object', additionalProperties: false, required: ['say', 'persuasion', 'mood', 'reveal', 'end'],
  properties: {
    say: { type: 'string' }, persuasion: { type: 'integer', minimum: 0, maximum: 3 },
    mood: { type: 'string', enum: ['hostile', 'wary', 'softening', 'moved'] },
    reveal: { type: 'array', items: { type: 'string' } }, end: { type: 'boolean' },
  },
};

/** The character's answer from the model's text: the JSON object in it, checked; null when it isn't one. */
export function parseReply(text: string, reveals: readonly string[]): Reply | null {
  const a = text.indexOf('{'), b = text.lastIndexOf('}');
  if (a < 0 || b <= a) return null;
  let raw: unknown;
  try { raw = JSON.parse(text.slice(a, b + 1)); } catch { return null; }
  const r = replySchema.safeParse(raw);
  if (!r.success) return null;
  return { ...r.data, reveal: r.data.reveal.filter((x) => reveals.includes(x)) };
}

const today = () => new Date().toISOString().slice(0, 10);

/** One more answer for this key today, unless it is over the limit. */
async function spend(db: D1Database, key: string, limit: number): Promise<boolean> {
  const day = today();
  const row = await db.prepare('INSERT INTO npc_usage (day, k, n) VALUES (?, ?, 1) ON CONFLICT (day, k) DO UPDATE SET n = n + 1 RETURNING n')
    .bind(day, key).first<{ n: number }>();
  return !!row && row.n <= limit;
}

export const npc = new Hono<AppEnv>();

npc.post('/v1/npc', async (c) => {
  if (!c.env.AI || c.env.NPC_OFF === '1') return c.json({ error: 'npc_off' }, 503);
  const parsed = bodySchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ error: 'bad_request' }, 400);
  const req = parsed.data;
  const who = NPCS[req.npc];
  if (!who) return c.json({ error: 'no_such_npc' }, 404);
  const msgs = req.messages;
  if (msgs[msgs.length - 1]!.from !== 'player' || msgs[0]!.from !== 'player') return c.json({ error: 'bad_request' }, 400);
  if (msgs.filter((m) => m.from === 'player').length > MAX_TURNS) return c.json({ error: 'too_long' }, 400);
  if (msgs.some((m) => m.from === 'player' && m.text.length > MAX_TEXT)) return c.json({ error: 'bad_request' }, 400);

  const ip = c.req.header('cf-connecting-ip') ?? 'unknown';
  if (!(await spend(c.env.DB, 'all', ALL_PER_DAY))) return c.json({ error: 'limit' }, 429);
  if (!(await spend(c.env.DB, 'ip:' + (await sha256hex(today() + ip)).slice(0, 24), PER_DAY))) return c.json({ error: 'limit' }, 429);

  const facts: Facts = {};
  for (const k of who.facts) if (req.facts && req.facts[k] !== undefined) facts[k] = req.facts[k]!;
  const scene = `THIS CONVERSATION: language ${req.lang}. You are talking to ${req.hero.name}, a ${req.hero.g === 'f' ? 'girl/woman' : 'boy/man'}, a ${req.hero.cls}.`;
  const messages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [{ role: 'system', content: RULES + '\n\n' + who.sheet(facts) }];
  for (const m of msgs) messages.push(m.from === 'player' ? { role: 'user', content: `${req.hero.name}: ${censor(m.text)}` } : { role: 'assistant', content: m.text });
  // the scene note comes after the player's words, so they can't override it
  messages[messages.length - 1]!.content += `\n\n(${scene} Answer as the character, with only the JSON object.)`;

  const ai = c.env.AI as unknown as { run(model: string, inputs: Record<string, unknown>): Promise<unknown> };
  // Tries in order: the chosen model with the answer forced into JSON; the same model plainly (some models don't take
  // response_format or reasoning_effort); then the backup model plainly. The first answer that parses wins.
  const first = c.env.NPC_MODEL || MODEL;
  const tries: [string, Record<string, unknown>][] = [
    [first, { reasoning_effort: 'low', response_format: { type: 'json_schema', json_schema: { name: 'npc_reply', schema: REPLY_SCHEMA, strict: true } } }],
    [first, {}],
    [BACKUP_MODEL, {}],
  ];
  const errors: string[] = [];
  for (const [model, extra] of tries) {
    try {
      const out = await ai.run(model, { messages, max_tokens: 700, temperature: 0.8, ...extra });
      const reply = parseReply(answerText(out), who.reveals);
      if (reply) return c.json(reply);
      errors.push(`${model}: not an answer: ${answerText(out).slice(0, 120)}`);
    } catch (e) {
      errors.push(`${model}: ${String((e as Error)?.message ?? e).slice(0, 160)}`);
    }
  }
  console.error('npc failed', errors);
  return c.json({ error: 'upstream', detail: errors.join(' | ').slice(0, 600) }, 502);
});

/** The model's text, from the chat-completions shape (choices[0].message.content) or the older { response }. */
export function answerText(out: unknown): string {
  const o = out as { choices?: { message?: { content?: unknown } }[]; response?: unknown };
  const t = o?.choices?.[0]?.message?.content ?? o?.response;
  return typeof t === 'string' ? t : t && typeof t === 'object' ? JSON.stringify(t) : '';
}

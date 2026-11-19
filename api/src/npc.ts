import Anthropic from '@anthropic-ai/sdk';
import { Hono } from 'hono';
import { z } from 'zod';
import type { AppEnv } from './auth';
import { sha256hex } from './auth';
import { censor } from './censor';
import { NPCS, RULES } from './npcs';
import type { Facts } from './npcs';

// TALKING TO CHARACTERS (Pixel Quest): POST /v1/npc. The game sends which character, the language, the hero who
// speaks, a few facts about the scene and the conversation so far; Claude answers as the character and judges the
// player's last message (see npcs.ts). Without the ANTHROPIC_API_KEY secret, or over the limits, the answer is an
// error and the game falls back to its classic choice (a Charisma roll).
// Limits, because every answer costs money: MAX_TURNS player messages a conversation; PER_DAY answers a day for one
// player (by the hash of the IP address and the day); ALL_PER_DAY answers a day for everybody together.

export const MODEL = 'claude-opus-5-5';
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
  if (!c.env.ANTHROPIC_API_KEY) return c.json({ error: 'npc_off' }, 503);
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
  const messages: Anthropic.Beta.BetaMessageParam[] = msgs.map((m) => (
    m.from === 'player' ? { role: 'user', content: `${req.hero.name}: ${censor(m.text)}` } : { role: 'assistant', content: m.text }
  ));
  messages.push({ role: 'user', content: `(${scene} Answer as the character, with only the JSON object.)` });
  // (the last two user turns merge into one; the scene note comes after the player's words, so it can't be overridden)

  const client = new Anthropic({ apiKey: c.env.ANTHROPIC_API_KEY });
  try {
    const res = await client.beta.messages.create({
      model: MODEL,
      max_tokens: 4000,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      output_config: { effort: 'low' },
      system: [{ type: 'text', text: RULES + '\n\n' + who.sheet(facts), cache_control: { type: 'ephemeral' } }],
      messages,
    });
    if (res.stop_reason === 'refusal') return c.json({ error: 'refused' }, 502);
    const text = res.content.map((b) => (b.type === 'text' ? b.text : '')).join('');
    const reply = parseReply(text, who.reveals);
    if (!reply) return c.json({ error: 'bad_reply' }, 502);
    return c.json(reply);
  } catch (e) {
    if (e instanceof Anthropic.RateLimitError) return c.json({ error: 'busy' }, 503);
    if (e instanceof Anthropic.APIError) return c.json({ error: 'upstream' }, 502);
    return c.json({ error: 'upstream' }, 502);
  }
});

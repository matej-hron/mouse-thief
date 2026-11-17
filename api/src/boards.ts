export type BoardRule = { better: 'higher' | 'lower'; min: number; max: number; tracks: boolean };

const hi = (max: number, tracks = false): BoardRule => ({ better: 'higher', min: 0, max, tracks });
const lo = (min: number, max: number, tracks = false): BoardRule => ({ better: 'lower', min, max, tracks });

/** Per-game leaderboard rules. min/max are sanity bounds (inclusive); times are in seconds. */
export const BOARDS: Record<string, BoardRule> = {
  stars: hi(10_000_000),
  thief: hi(36_000),
  racer: lo(5, 600),
  skygp: lo(5, 600, true),
  bike: lo(3, 3600, true),
  'bike:free': hi(1_000_000),
  moto: lo(3, 3600, true),
  'moto:free': hi(1_000_000),
  ski: lo(3, 3600, true),
  heist: lo(5, 7200, true),
  skate: hi(10_000_000),
  horde: hi(600, true),
  defense: hi(10_000, true),
  hook: hi(1_000_000),
  slice: hi(100_000, true),
  party: hi(1_000_000),
  tanks: hi(1_000_000),
  runs: hi(10_000_000),
  miner: hi(1_000_000),
  snake: hi(1_000_000),
  hoops: hi(100_000),
  cook: hi(100_000_000),
  fish: hi(100_000_000),
  pong: hi(1_000_000),
  boxfight: hi(1_000_000),
  wings: hi(1_000_000),
  football: hi(10_000),
};

const TRACK = /^[a-z0-9_]{1,24}$/;

/** The rule for a board name ("stars", "bike:free", "skygp:t1"), or null when the board does not exist. */
export function boardRule(board: string): BoardRule | null {
  const exact = Object.hasOwn(BOARDS, board) ? BOARDS[board]! : null;
  if (exact) return exact.tracks ? null : exact; // a track game needs its track
  const i = board.indexOf(':');
  if (i < 0) return null;
  const rule = Object.hasOwn(BOARDS, board.slice(0, i)) ? BOARDS[board.slice(0, i)]! : null;
  return rule?.tracks && TRACK.test(board.slice(i + 1)) ? rule : null;
}

/** Is v a finite number inside the rule's inclusive bounds? */
export const inBounds = (rule: BoardRule, v: unknown): v is number =>
  typeof v === 'number' && Number.isFinite(v) && v >= rule.min && v <= rule.max;

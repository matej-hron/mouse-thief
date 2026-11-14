/** Mirrors the client's `PX.cleanName` (common.js): uppercase, A-Z 0-9 and single spaces, trimmed, max 10. */
export const cleanName = (v: string): string =>
  String(v || '').toUpperCase().replace(/[^A-Z0-9 ]/g, '').replace(/\s+/g, ' ').trim().slice(0, 10);

/** Case- and space-insensitive identity of a name (unique per player). */
export const nameKey = (name: string): string => name.toUpperCase().replace(/ /g, '');

// Rude English and Czech words, matched as substrings of the name key. Short words that sit inside
// innocent ones (ASS in CLASS, RAPE in GRAPE, COCK in PEACOCK) are left out on purpose.
const RUDE_WORDS = [
  'FUCK', 'SHIT', 'BITCH', 'CUNT', 'NIGGER', 'NIGGA', 'FAGGOT', 'WHORE', 'SLUT', 'PUSSY', 'PENIS', 'VAGINA',
  'ASSHOLE', 'BASTARD', 'WANKER', 'TWAT', 'NAZI', 'HITLER', 'PORN', 'DICKHEAD', 'RETARD',
  'KURVA', 'KURVY', 'KOKOT', 'CURAK', 'PICUS', 'HOVNO', 'HOVNA', 'SRACKA', 'ZASRAN', 'DEBIL', 'BLBEC',
  'BUZERA', 'MRDKA', 'PRDEL', 'CIKAN', 'ZIDAK', 'NEGR', 'HAJZL', 'KUNDA', 'VYSRAT', 'PIZDA',
];

export const badName = (name: string): boolean => {
  const key = nameKey(name);
  return RUDE_WORDS.some((w) => key.includes(w));
};

// Swear words become ##### (as long as the word). A recorded copy of `censor` in common.js (the chat's filter): keep
// the two in step. A word is checked with its letters only, without accents, with 0 1 3 4 5 7 @ $ read as letters
// (5H1T is SHIT) and doubled letters squeezed (FUUUCK is FUCK). RUDE_IN are rude anywhere in a word (MOTHERFUCKER);
// RUDE_IS only as the whole word, because they sit inside innocent ones (ASS in CLASS, COCK in PEACOCK).
const RUDE_IN = ['FUCK', 'FUCC', 'FUK', 'FCK', 'SHIT', 'SHIZ', 'BITCH', 'CUNT', 'NIGGER', 'NIGGA', 'FAGGOT', 'WHORE', 'SLUT',
  'PUSSY', 'PENIS', 'VAGINA', 'ASSHOLE', 'ARSEHOLE', 'BASTARD', 'WANKER', 'TWAT', 'NAZI', 'HITLER', 'PORN', 'DICKHEAD',
  'RETARD', 'BULLSHIT', 'JACKASS', 'DUMBASS', 'BOLLOCK', 'MOTHERF', 'BLOWJOB', 'DILDO',
  'KURVA', 'KURVY', 'KURVO', 'KOKOT', 'CURAK', 'PICUS', 'HOVNO', 'HOVNA', 'SRACKA', 'ZASRAN', 'BLBEC',
  'BUZERA', 'BUZNA', 'MRDKA', 'MRDAT', 'PRDEL', 'CIKAN', 'ZIDAK', 'NEGR', 'HAJZL', 'KUNDA', 'VYSRAT', 'POSRAT', 'PIZDA',
  'JEBAT', 'JEBEM', 'JEBNI', 'JEBKA', 'KRETEN', 'ZMRD', 'CHCIP', 'SKURVEN', 'IDIOT'];
const RUDE_IS = ['ASS', 'ASSES', 'ARSE', 'DICK', 'DICKS', 'COCK', 'COCKS', 'TIT', 'TITS', 'TITTY', 'FAG', 'FAGS', 'CRAP',
  'PISS', 'PISSED', 'DAMN', 'WTF', 'STFU', 'MF', 'BOOB', 'BOOBS', 'BOOBIES', 'SEX', 'SEXY', 'DEBIL', 'DEBILE', 'DEBILNI',
  'PICA', 'PICO', 'PICE', 'SRAT', 'SERE', 'SEROU', 'SRAL', 'PRD', 'PRDY', 'CHCIPNI', 'JEB', 'HOVADO', 'BUZIK'];
const squeeze = (w: string) => w.replace(/(.)\1+/g, '$1');
const LEET: Record<string, string> = { '0': 'O', '1': 'I', '3': 'E', '4': 'A', '5': 'S', '7': 'T', '@': 'A', $: 'S' };
const RUDE_IN_SQ = RUDE_IN.map(squeeze);
const RUDE_IS_SQ = new Set(RUDE_IS.map(squeeze));

export const rudeWord = (w: string): boolean => {
  let k = String(w).toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  if (!/[A-Z]/.test(k)) return false; // (just numbers or signs: never rude)
  k = squeeze(k.replace(/[013457@$]/g, (c) => LEET[c]!).replace(/[^A-Z]/g, ''));
  return RUDE_IS_SQ.has(k) || RUDE_IN_SQ.some((r) => k.includes(r));
};

export const censor = (text: string): string =>
  String(text || '')
    .replace(/[^\s.,!?:;"'()]+/g, (w) => (rudeWord(w) ? '#'.repeat(w.length) : w))
    .replace(/(?<!\S)\S(?:\s+\S){2,}(?!\S)/g, (m) => (rudeWord(m.replace(/\s+/g, '')) ? m.replace(/\S/g, '#') : m)); // F U C K

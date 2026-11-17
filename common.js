// PIXEL GAMES: shared bits for the arcade (index.html) and its games.
// Everything lives under window.PX, so it never clashes with a game's own code.
'use strict';
// GAMES INSIDE THE ARCADE: during a call from the chat the arcade opens a game in a frame over itself, so the call goes
// on (ArcadeShell in index.html). When the game goes back to the arcade ('./'), the frame closes instead of loading a
// second arcade inside it: caught before it leaves (the Navigation API), or else as soon as the arcade starts loading.
const ARCADE_SHELL = (() => { try { return window.parent !== window && window.parent.ArcadeShell ? window.parent.ArcadeShell : null; } catch (e) { return null; } })();
if (ARCADE_SHELL) {
  const isArcade = u => { try { const x = new URL(u, location.href); return x.origin === location.origin && /\/(index\.html)?$/.test(x.pathname); } catch (e) { return false; } };
  if (isArcade(location.href)) ARCADE_SHELL.back();
  else if (window.navigation && navigation.addEventListener) navigation.addEventListener('navigate', e => { if (isArcade(e.destination.url) && e.cancelable) { e.preventDefault(); ARCADE_SHELL.back(); } });
}
window.PX = (() => {
  // --- pixel font (the same 3x5 font as Mouse Thief) ---------------------------------
  const FONT = {
  A: '010,101,111,101,101', B: '110,101,110,101,110', C: '011,100,100,100,011', D: '110,101,101,101,110',
  E: '111,100,110,100,111', F: '111,100,110,100,100', G: '011,100,101,101,011', H: '101,101,111,101,101',
  I: '111,010,010,010,111', J: '001,001,001,101,010', K: '101,101,110,101,101', L: '100,100,100,100,111',
  M: '10001,11011,10101,10001,10001', N: '1001,1101,1011,1001,1001', O: '010,101,101,101,010', P: '110,101,110,100,100',
  Q: '010,101,101,110,011', R: '110,101,110,101,101', S: '011,100,010,001,110', T: '111,010,010,010,010',
  U: '101,101,101,101,111', V: '101,101,101,101,010', W: '10001,10001,10101,11011,10001', X: '101,101,010,101,101',
  Y: '101,101,010,010,010', Z: '111,001,010,100,111',
  '0': '111,101,101,101,111', '1': '010,110,010,010,111', '2': '110,001,010,100,111', '3': '110,001,010,001,110',
  '4': '101,101,111,001,001', '5': '111,100,110,001,110', '6': '011,100,111,101,111', '7': '111,001,010,010,010',
  '8': '111,101,111,101,111', '9': '111,101,111,001,110',
  ' ': '00,00,00,00,00', '.': '0,0,0,0,1', ',': '00,00,00,01,10', '!': '1,1,1,0,1', '?': '110,001,010,000,010',
  ':': '0,1,0,1,0', '-': '000,000,111,000,000', '+': '000,010,111,010,000', '/': '001,001,010,100,100',
  "'": '1,1,0,0,0', '%': '101,001,010,100,101', '(': '01,10,10,10,01', ')': '10,01,01,01,10',
  '>': '100,010,001,010,100', '<': '001,010,100,010,001', '=': '000,111,000,111,000', '*': '000,101,010,101,000',
  '#': '01010,11111,01010,11111,01010', '"': '101,101,000,000,000', '_': '000,000,000,000,111', '$': '01111,10100,01110,00101,11110',
  '★': '00100,01110,11111,01110,01010', '♥': '01010,11111,11111,01110,00100',
  '↓': '010,010,010,111,010', '↑': '010,111,010,010,010', '…': '00000,00000,00000,00000,10101',
};
  const GLYPHS = {};
  for (const ch in FONT) { const rows = FONT[ch].split(','); GLYPHS[ch] = { w: rows[0].length, rows }; }
  // CZECH LETTERS: the letter itself with its mark in the two rows above it (Á É Í Ó Ú Ý, Č Ď Ě Ň Ř Š Ť Ž, Ů)
  const MARKS = { '\u0301': ['001', '010'], '\u030C': ['101', '010'], '\u030A': ['010', '101'] };
  for (const ch of 'ÁÉÍÓÚÝČĎĚŇŘŠŤŽŮ') {
    const [base, mark] = ch.normalize('NFD'), g = GLYPHS[base], m = MARKS[mark];
    if (!g || !m) continue;
    const pad = Math.floor((g.w - 3) / 2), row = r => ('0'.repeat(pad) + r).padEnd(g.w, '0');
    GLYPHS[ch] = { w: g.w, rows: g.rows, above: m.map(row) };
  }
  // --- LANGUAGE: ENGLISH or ČEŠTINA (SETTINGS → LANGUAGE) ------------------------------------------------------------
  // The text stays English in the code. A translated page loads a table (cs.js: PX.Lang.add({ 'ENGLISH': 'ČESKY' }))
  // and calls PX.Lang.page(); from then on drawText and textWidth draw and measure the Czech text of every string that
  // is in the table. A key with {0}, {1}... is a pattern for text put together from pieces ('{0} IS YOUR FRIEND NOW!'):
  // the pieces are translated too. Pages without page() (the games, for now) stay English. Lang.t() translates
  // anyway (for our own boxes, like the chat in the games). The choice is Settings.lang; the first time it is Czech on
  // a phone set to Czech or Slovak, English everywhere else.
  const Lang = {
    LANGS: [['en', 'ENGLISH'], ['cs', 'ČEŠTINA']],
    dict: new Map(), pats: [], cache: new Map(), on: false, cur: null, scope: '', scoped: {},
    code() {
      if (this.cur) return this.cur;
      let d = null; try { d = JSON.parse(localStorage.getItem('pixelArcade.settings')); } catch (e) { d = null; }
      const nav = String((typeof navigator !== 'undefined' && (navigator.language || '')) || '').toLowerCase();
      return (this.cur = d && (d.lang === 'cs' || d.lang === 'en') ? d.lang : /^(cs|sk)\b/.test(nav) ? 'cs' : 'en');
    },
    changed() { this.cur = null; this.cache.clear(); try { document.documentElement.lang = this.code(); } catch (e) { /* fine */ } },
    // page('hook'): this page is translated, and the 'hook' part of the table comes first (a game's own words:
    // in Pixel Hook's shop, ON means "you have it on", not "switched on")
    page(scope = '') { this.on = true; this.scope = scope; this.changed(); },
    add(table, scope = '') {
      const into = scope ? (this.scoped[scope] = this.scoped[scope] || { dict: new Map(), pats: [] }) : this;
      for (const k in table) {
        if (!/\{\d\}/.test(k)) { into.dict.set(k, table[k]); continue; }
        const src = '^' + k.replace(/[.*+?^$()|[\]\\]/g, '\\$&').replace(/\\?\{(\d)\}/g, (m, n) => '(?<p' + n + '>.+?)') + '$';
        try { into.pats.push([new RegExp(src, 's'), table[k]]); } catch (e) { /* a bad key */ }
      }
      this.cache.clear();
    },
    t(s, depth = 0) {                                 // translate (whatever the page)
      s = String(s);
      if (s.length < 2 || this.code() !== 'cs') return s;
      const hit = this.cache.get(s); if (hit !== undefined) return hit;
      const own = this.scope && this.scoped[this.scope];
      let out = own ? own.dict.get(s) : undefined;
      if (out === undefined) out = this.dict.get(s);
      if (out === undefined) {
        out = s;
        for (const [re, to] of own ? [...own.pats, ...this.pats] : this.pats) {
          const m = re.exec(s); if (!m) continue;
          out = to.replace(/\{(\d)\}/g, (x, n) => { const v = m.groups['p' + n]; return v === undefined ? '' : depth < 2 ? this.t(v, depth + 1) : v; });
          break;
        }
      }
      if (this.cache.size > 3000) this.cache.clear();
      this.cache.set(s, out);
      return out;
    },
    tr(s) { return this.on ? this.t(s) : String(s); },    // translate on a translated page
    // what players wrote (chat messages, names) is drawn as it is: raw(() => drawText(...))
    raw(fn) { const was = this.on; this.on = false; try { return fn(); } finally { this.on = was; } },
  };
  if (typeof addEventListener !== 'undefined') addEventListener('storage', e => { if (e.key === 'pixelArcade.settings') Lang.changed(); });
  function textWidth(str, size = 1) {
    let w = 0;
    for (const ch of Lang.tr(str).toUpperCase()) w += ((GLYPHS[ch] || GLYPHS['?']).w + 1) * size;
    return Math.max(0, w - size);
  }
  function rawText(ctx, str, x, y, size) {
    let cx = x;
    for (const ch of str) {
      const g = GLYPHS[ch] || GLYPHS['?'];
      if (g.above) for (let r = 0; r < 2; r++) for (let c = 0; c < g.w; c++) if (g.above[r][c] === '1') ctx.fillRect(cx + c * size, y + (r - 2) * size, size, size);
      for (let r = 0; r < 5; r++) {
        const row = g.rows[r];
        for (let c = 0; c < g.w;) {
          if (row[c] === '1') { let e = c; while (e < g.w && row[e] === '1') e++; ctx.fillRect(cx + c * size, y + r * size, (e - c) * size, size); c = e; }
          else c++;
        }
      }
      cx += (g.w + 1) * size;
    }
  }
  function drawText(ctx, str, x, y, color = '#fff', size = 1, align = 'left', shadow = null) {
    str = Lang.tr(str).toUpperCase();
    if (align !== 'left') { const tw = textWidth(str, size); x -= align === 'center' ? Math.floor(tw / 2) : tw; }
    x = Math.round(x); y = Math.round(y);
    if (shadow) { const o = Math.max(1, size >> 1); ctx.fillStyle = shadow; rawText(ctx, str, x + o, y + o, size); }
    ctx.fillStyle = color; rawText(ctx, str, x, y, size);
  }

  // --- a game's big title, in the PIXEL FARMINGS style: white letters, a thick dark outline, a drop shadow,
  // and a pale blue lower half. Same arguments as drawText (always centered on x).
  function drawLogo(ctx, str, x, y, size = 4, o = {}) {
    str = String(str).toUpperCase();
    const tw = textWidth(str, size), lx = Math.round(x - tw / 2), ly = Math.round(y), t = size >= 3 ? 2 : 1;
    ctx.fillStyle = o.outline || '#1a1020';
    for (const [dx, dy] of [[-t, 0], [t, 0], [0, -t], [0, t], [-t, -t], [t, t], [-t, t], [t, -t], [0, t + 2], [t, t + 2], [-t, t + 2]]) rawText(ctx, str, lx + dx, ly + dy, size);
    ctx.fillStyle = o.color || '#ffffff'; rawText(ctx, str, lx, ly, size);
    ctx.save(); ctx.beginPath(); ctx.rect(lx - 1, ly + Math.round(size * 3), tw + 2, size * 2); ctx.clip();
    ctx.fillStyle = o.shade || '#cfe6ff'; rawText(ctx, str, lx, ly, size); ctx.restore();
  }

  // --- avatars: 12x12 pixel faces in your color ---------------------------------------
  // '#' your color, 'd' a darker shade, 'w' white, 'k' black, 'p' pink
  const AVATARS = {
    cat:   ['.#........#.', '.##......##.', '.#p#....#p#.', '.##########.', '############', '##ww####ww##',
            '##wk####kw##', '############', '#####pp#####', '##d######d##', '.##########.', '..########..'],
    mouse: ['##........##', '#pp#....#pp#', '#pp#....#pp#', '.##########.', '.##########.', '.#ww####ww#.',
            '.#wk####kw#.', '.##########.', '.####kk####.', '..d######d..', '..########..', '...######...'],
    bear:  ['.##......##.', '#dd#....#dd#', '.##########.', '############', '############', '##ww####ww##',
            '##wk####kw##', '############', '####dddd####', '####dkkd####', '.###dddd###.', '..########..'],
    bunny: ['..##....##..', '..#p#..#p#..', '..#p#..#p#..', '..#p#..#p#..', '.##########.', '##ww####ww##',
            '##wk####kw##', '############', '#####pp#####', '####d##d####', '.##########.', '..########..'],
    frog:  ['.www....www.', 'wwkw....wkww', '.www####www.', '############', '############', '############',
            '#d########d#', '#dddddddddd#', '############', '.##########.', '..########..', '............'],
    robot: ['.....kk.....', '.....dd.....', '.##########.', '.#dddddddd#.', '.#ww#dd#ww#.', '.#wk#dd#kw#.',
            '.#dddddddd#.', '.#dkdkdkdd#.', '.#dddddddd#.', '.##########.', '...##..##...', '..###..###..'],
    alien: ['.....##.....', '....####....', '..########..', '.##########.', '#kkk####kkk#', '#kkkw##wkkk#',
            '#kkk####kkk#', '.##########.', '..###kk###..', '...######...', '....####....', '.....##.....'],
    ghost: ['...######...', '..########..', '.##########.', '.##ww##ww##.', '.##wk##wk##.', '############',
            '#####kk#####', '############', '############', '############', '##.##..##.##', '#...#..#...#'],
    // a gift (the first of the month update, November 2026): white with spots in your color, a pink nose
    cow:   ['.ww......ww.', '..ww###www..', '#dw####wwwd#', '#dwwww#wwwd#', '..wkwwwwkw..', '..wwwwwww#..', '..wwwwww##..',
            '.pppppppppp.', 'pppppppppppp', 'ppkppppppkpp', 'pppppppppppp', '.pppppppppp.'],
  };
  const AVATAR_SHAPES = Object.keys(AVATARS);
  // avatars you only get as a gift (in a first of the month update); the arcade remembers which ones you have
  const GIFT_SHAPES = ['cow'];
  const GIFTS_KEY = 'pixelArcade.gifts';
  const Gifts = {
    list() { try { const g = JSON.parse(localStorage.getItem(GIFTS_KEY)); return Array.isArray(g) ? g : []; } catch (e) { return []; } },
    has(id) { return this.list().includes(id); },
    add(id) { const g = this.list(); if (!g.includes(id)) g.push(id); try { localStorage.setItem(GIFTS_KEY, JSON.stringify(g)); } catch (e) { /* private mode */ } },
    canUse(shape) { return !GIFT_SHAPES.includes(shape) || this.has(shape); },
  };
  const AVATAR_COLORS = ['#e0782a', '#9b9b9b', '#2a7fd4', '#3fae4a', '#e01e5a', '#7a3fc4', '#e0b030', '#f2f2f2', '#3a3a46', '#2ad4c4'];
  function shade(hex, k) {
    const n = parseInt(hex.slice(1), 16), c = [n >> 16 & 255, n >> 8 & 255, n & 255].map(v => Math.round(v * k));
    return '#' + c.map(v => Math.min(255, v).toString(16).padStart(2, '0')).join('');
  }
  const avatarCache = {};
  function avatarImage(av) {
    const shape = AVATARS[av && av.shape] ? av.shape : 'cat', color = AVATAR_COLORS[(av && av.color) | 0] || AVATAR_COLORS[0];
    const key = shape + color;
    if (avatarCache[key]) return avatarCache[key];
    const pal = { '#': color, d: shade(color, 0.65), w: '#ffffff', k: '#111111', p: '#ff9ab0' };
    const c = document.createElement('canvas'); c.width = 14; c.height = 14;
    const g = c.getContext('2d');
    const rows = AVATARS[shape];
    // dark outline first, then the face
    g.fillStyle = '#111111';
    rows.forEach((row, y) => [...row].forEach((ch, x) => { if (ch !== '.') for (const [dx, dy] of [[0, 1], [2, 1], [1, 0], [1, 2]]) g.fillRect(x + dx, y + dy, 1, 1); }));
    rows.forEach((row, y) => [...row].forEach((ch, x) => { if (ch !== '.') { g.fillStyle = pal[ch]; g.fillRect(x + 1, y + 1, 1, 1); } }));
    return (avatarCache[key] = c);
  }
  // An avatar on a little tile; size = pixels per avatar pixel.
  function drawAvatar(ctx, av, x, y, size = 2, tile = '#1d1830') {
    const img = avatarImage(av), s = 14 * size;
    if (tile) { ctx.fillStyle = '#111111'; ctx.fillRect(x - 1, y - 1, s + 2, s + 2); ctx.fillStyle = tile; ctx.fillRect(x, y, s, s); }
    const was = ctx.imageSmoothingEnabled; ctx.imageSmoothingEnabled = false;
    ctx.drawImage(img, x, y, s, s);
    ctx.imageSmoothingEnabled = was;
  }

  // --- little pixel icons (power-ups, abilities) ------------------------------------------
  // rows: strings, one char per pixel ('.' = empty); pal: char -> color. Drawn centered on
  // (cx, cy), s screen pixels per icon pixel, with a dark outline so they show on any background.
  function drawIcon(ctx, rows, pal, cx, cy, s = 2, outline = '#111111') {
    const w = Math.max(...rows.map(r => r.length)), h = rows.length;
    const x0 = Math.round(cx - w * s / 2), y0 = Math.round(cy - h * s / 2);
    const px = (x, y, c) => { ctx.fillStyle = c; ctx.fillRect(x0 + x * s, y0 + y * s, s, s); };
    if (outline) rows.forEach((row, y) => [...row].forEach((ch, x) => { if (ch !== '.') for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) px(x + dx, y + dy, outline); }));
    rows.forEach((row, y) => [...row].forEach((ch, x) => { if (ch !== '.' && pal[ch]) px(x, y, pal[ch]); }));
  }

  // --- your profile: one name and avatar for all the games ------------------------------
  const PROFILE_KEY = 'pixelArcade.profile';
  const Profile = {
    load() {
      let p = null;
      try { p = JSON.parse(localStorage.getItem(PROFILE_KEY)); } catch (e) { p = null; }
      if (!p || typeof p !== 'object') p = {};
      if (!p.name) {                                   // first time: borrow the name from Mouse Thief, if there is one
        try { const t = JSON.parse(localStorage.getItem('mouseThief.save.v1')); if (t && t.name) p.name = t.name; } catch (e) { /* no save yet */ }
      }
      if (!p.name) p.name = 'PLAYER' + (10 + Math.floor(Math.random() * 90));
      if (!p.avatar || !AVATARS[p.avatar.shape]) p.avatar = { shape: 'cat', color: 0 };
      p.avatar.color = Math.max(0, Math.min(AVATAR_COLORS.length - 1, p.avatar.color | 0));
      // your ID: 6 digits, picked at random the first time and then kept for good (it stays when you change your name)
      if (!/^[1-9][0-9]{5}$/.test(p.id)) { p.id = String(100000 + Math.floor(Math.random() * 900000)); this.save(p); }
      return p;
    },
    save(p) { try { localStorage.setItem(PROFILE_KEY, JSON.stringify(p)); } catch (e) { /* private mode */ } },
    get() { return this.load(); },
    setName(name) { const p = this.load(); p.name = name; this.save(p); },
  };
  const cleanName = v => String(v || '').toUpperCase().replace(/[^A-Z0-9 ]/g, '').replace(/\s+/g, ' ').trim().slice(0, 10);

  // --- swear words: censor(text) turns every rude word into ##### (as long as the word) --------------------------
  // English and Czech. A word is checked with its letters only, without accents, with 0 1 3 4 5 7 @ $ read as letters
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
  const squeeze = w => w.replace(/(.)\1+/g, '$1');
  const LEET = { '0': 'O', '1': 'I', '3': 'E', '4': 'A', '5': 'S', '7': 'T', '@': 'A', '$': 'S' };
  const RUDE_IN_SQ = RUDE_IN.map(squeeze), RUDE_IS_SQ = new Set(RUDE_IS.map(squeeze));
  const rudeWord = w => {
    let k = String(w).toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    if (!/[A-Z]/.test(k)) return false;                       // (just numbers or signs: never rude)
    k = squeeze(k.replace(/[013457@$]/g, c => LEET[c]).replace(/[^A-Z]/g, ''));
    return RUDE_IS_SQ.has(k) || RUDE_IN_SQ.some(r => k.includes(r));
  };
  const censor = text => String(text || '')
    .replace(/[^\s.,!?:;"'()]+/g, w => rudeWord(w) ? '#'.repeat(w.length) : w)
    .replace(/(?<!\S)\S(?:\s+\S){2,}(?!\S)/g, m => rudeWord(m.replace(/\s+/g, '')) ? m.replace(/\S/g, '#') : m);   // F U C K

  // --- the arcade's small backend (visit counter now; accounts and scores later) ----------------------
  const ACCOUNTS_KEY = 'pixelArcade.accounts';
  const Api = {
    base: /^(localhost|127\.0\.0\.1)$/.test(location.hostname) ? 'http://localhost:8787' : 'https://pixel-arcade-api.matej-hron.workers.dev',
    // JSON in, JSON out. Never throws: a network error or an 8 s timeout gives { ok: false, status: 0, data: null }.
    async call(method, path, body, token) {
      const ctl = new AbortController(), timer = setTimeout(() => ctl.abort(), 8000);
      try {
        const headers = {};
        if (body !== undefined) headers['content-type'] = 'application/json';
        if (token) headers.authorization = 'Bearer ' + token;
        const res = await fetch(this.base + path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body), signal: ctl.signal, mode: 'cors' });
        let data = null;
        try { data = await res.json(); } catch (e) { if (ctl.signal.aborted) throw e; /* no body (204) or not JSON */ }   // the timer covers the body too
        return { ok: res.ok, status: res.status, data };
      } catch (e) { return { ok: false, status: 0, data: null }; }
      finally { clearTimeout(timer); }
    },
    // PBKDF2-SHA-256 (150 000 rounds) of a text with a hex salt, as 64 hex characters.
    async pbkdf2(text, saltHex) {
      const salt = Uint8Array.from(String(saltHex).match(/../g) || [], h => parseInt(h, 16));
      const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(text), 'PBKDF2', false, ['deriveBits']);
      const bits = new Uint8Array(await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: 150000 }, key, 256));
      return Array.from(bits, b => b.toString(16).padStart(2, '0')).join('');
    },
    // The logged-in account's { id, tok }, or null (no account, not logged in, or no token yet).
    session() {
      try {
        const d = JSON.parse(localStorage.getItem(ACCOUNTS_KEY)), a = d && Array.isArray(d.list) && d.list.find(x => x && x.id === d.cur);
        return a && typeof a.tok === 'string' && a.tok ? { id: a.id, tok: a.tok } : null;
      } catch (e) { return null; }
    },
    // The server said the token is no good: forget it (the account stays; the player logs in again). index.html may replace this.
    onAuthLost() {
      try {
        const d = JSON.parse(localStorage.getItem(ACCOUNTS_KEY)), a = d && Array.isArray(d.list) && d.list.find(x => x && x.id === d.cur);
        if (a) { delete a.tok; localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(d)); }
      } catch (e) { /* nothing to forget */ }
    },
    // Counts this visit: which page, which version, and a random id that belongs to this browser (not to a person).
    hit() {
      try {
        const local = /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
        if (local && localStorage.getItem('pixelArcade.hitLocal') !== '1') return;
        if (navigator.onLine === false) return;
        let d = localStorage.getItem('pixelArcade.vid');
        if (!/^[a-z0-9]{8,32}$/.test(d || '')) {
          const a = crypto.getRandomValues(new Uint8Array(16));
          d = Array.from(a, n => 'abcdefghijklmnopqrstuvwxyz0123456789'[n % 36]).join('');
          localStorage.setItem('pixelArcade.vid', d);
        }
        const p = location.pathname.split('/').pop() || 'index.html';
        const v = typeof VERSION === 'string' ? VERSION : undefined;   // the page's own top-level const, if it has one
        const json = JSON.stringify({ p, v, d });
        const url = this.base + '/v1/hit';
        if (navigator.sendBeacon && navigator.sendBeacon(url, new Blob([json], { type: 'text/plain' }))) return;
        fetch(url, { method: 'POST', body: json, keepalive: true, mode: 'cors', headers: { 'content-type': 'text/plain' } }).catch(() => {});
      } catch (e) { /* counting must never break a game */ }
    },
  };
  window.addEventListener('load', () => Api.hit());

  // --- scores: every game's personal bests, sent to the leaderboard ---------------------------
  // Same rules as api/src/boards.ts (a recorded copy: keep the two in step). Times are seconds.
  const BOUNDS = {
    stars: ['hi', 0, 10e6], thief: ['hi', 0, 36000], racer: ['lo', 5, 600], skygp: ['lo', 5, 600], bike: ['lo', 3, 3600], 'bike:free': ['hi', 0, 1e6],
    moto: ['lo', 3, 3600], 'moto:free': ['hi', 0, 1e6], ski: ['lo', 3, 3600], heist: ['lo', 5, 7200], skate: ['hi', 0, 10e6], horde: ['hi', 0, 600],
    defense: ['hi', 0, 10000], hook: ['hi', 0, 1e6], slice: ['hi', 0, 100000], party: ['hi', 0, 1e6], tanks: ['hi', 0, 1e6], sniper: ['hi', 0, 10e6], runs: ['hi', 0, 10e6], miner: ['hi', 0, 1e6], snake: ['hi', 0, 1e6], hoops: ['hi', 0, 100000],
    cook: ['hi', 0, 100e6], fish: ['hi', 0, 100e6], pong: ['hi', 0, 1e6], boxfight: ['hi', 0, 1e6], wings: ['hi', 0, 1e6], football: ['hi', 0, 10000],
  };
  const SENT_KEY = 'pixelArcade.sentScores';
  const num = v => (typeof v === 'number' && Number.isFinite(v) ? v : null);
  // a track key the server accepts (/^[a-z0-9_]{1,24}$/): the game's own key, lower-cased; null if it still doesn't fit
  const trackKey = k => { const t = String(k).toLowerCase(); return /^[a-z0-9_]{1,24}$/.test(t) ? t : null; };
  const tr = (key, label) => ({ key, label });
  const BIKE_TRACKS = [['t0', 'SUNSET HILLS'], ['t1', 'MISTY PINES'], ['t2', 'GOLDEN MEADOW'], ['t3', 'AUTUMN RIDGE'], ['t4', 'NIGHT MOUNTAIN'], ['t5', 'SNOW PEAK'], ['t6', 'VOLCANO'], ['t7', 'AURORA']];
  const MOTO_TRACKS = [['t0', 'DESERT CANYON'], ['t1', 'FOREST TRACK'], ['t2', 'DUSTY FARM'], ['t3', 'RED ROCKS'], ['t4', 'NIGHT QUARRY'], ['t5', 'ICE PASS'], ['t6', 'VOLCANO'], ['t7', 'AURORA']];
  const SKI_MAPS = [['meadow', 'SNOWY MEADOW'], ['pines', 'PINE FOREST'], ['night', 'NIGHT RACE'], ['lake', 'FROZEN LAKE'], ['sunset', 'SUNSET RIDGE'], ['blizzard', 'BLIZZARD PASS'], ['canyon', 'ICE CANYON'], ['volcano', 'VOLCANO SLOPE'], ['aurora', 'AURORA PEAK'], ['summit', 'THE SUMMIT']];
  const SKI_LEVELS = [['green', 'GREEN'], ['red', 'RED'], ['black', 'BLACK']];
  // the save's own { trackKey: value } table -> boards; a key that doesn't fit, or a value that isn't a number, is skipped
  function perTrack(game, table, tracks) {
    const out = [];
    if (!table || typeof table !== 'object') return out;
    for (const k of Object.keys(table)) {
      const t = trackKey(k), v = num(table[k]);
      if (t === null || v === null) continue;
      const known = tracks.find(x => x.key === t);
      out.push({ b: game + ':' + t, v, label: known ? known.label : t.toUpperCase() });
    }
    return out;
  }
  const one = (b, v) => { v = num(v); return v === null ? [] : [{ b, v }]; };
  const G = (game, name, save, unit, boards, tracks) => ({ game, name, save, unit, boards, ...(tracks ? { tracks } : {}) });
  const bikeLike = (game, name, save, list) => {
    const tracks = list.map(([k, l]) => tr(k, l)).concat([tr('free', 'FREE RIDE')]);
    return G(game, name, save, 'time', s => perTrack(game, s.best, tracks).concat(one(game + ':free', s.freeBest).map(x => ({ ...x, label: 'FREE RIDE' }))), tracks);
  };
  const SKI_TRACKS = SKI_MAPS.flatMap(([m, mn]) => SKI_LEVELS.map(([l, ln]) => tr(m + '_' + l, mn + ' ' + ln)));
  const SKYGP_TRACKS = [tr('cloud', 'CLOUD CITY'), tr('neon', 'NEON NIGHT'), tr('bay', 'SUNRISE BAY')];
  const HEIST_TRACKS = ['CORNER SHOP', 'JEWELRY STORE', 'ART MUSEUM', 'GOLD SHOP', 'CITY BANK'].map((n, i) => tr(String(i + 1), n));
  const SLICE_TRACKS = [tr('lives', '3 LIVES'), tr('timed', '60 SECONDS')];
  const HORDE_TRACKS = ['GREEN MEADOW', 'HAUNTED GRAVEYARD', 'LAVA LANDS'].map((n, i) => tr(String(i), n));
  const DEFENSE_TRACKS = [['meadow', 'GREEN MEADOW'], ['dunes', 'DRY DUNES'], ['frost', 'FROZEN FORK'], ['swamp', 'CROSSROAD SWAMP'], ['lava', 'LAVA CAVE'], ['crystal', 'CRYSTAL MINE'], ['sky', 'CLOUD BRIDGES'], ['core', 'THE CORE']].map(([k, l]) => tr(k, l));
  // in arcade order (the stars wallet first); save = the game's localStorage key
  const GAMES = [
    G('stars', 'STARS EARNED', 'mouseThief.save.v1', 'stars', s => one('stars', s.totalEarned)),
    G('thief', 'MOUSE THIEF', 'mouseThief.save.v1', 'time', s => one('thief', s.bestTime)),
    G('racer', 'PIXEL GP', 'pixelGP.save', 'time', s => one('racer', s.bestLap)),
    G('heist', 'PIXEL HEIST', 'pixelHeist.save', 'time', s => perTrack('heist', s.best, HEIST_TRACKS), HEIST_TRACKS),
    G('pong', 'PIXEL PONG', 'pixelPong.save', 'count', s => one('pong', s.wins)),
    G('football', 'PIXEL FOOTBALL', 'pixelFootball.save.v1', 'count', s => one('football', s.club && s.club.trophies)),
    G('hoops', 'PIXEL HOOPS', 'pixelHoops.save', 'pts', s => one('hoops', s.best)),
    G('wings', 'PIXEL WINGS', 'pixelWings.save', 'count', s => one('wings', s.wins)),
    G('fish', 'DEEP CATCH', 'deepCatch.save', 'coins', s => one('fish', s.best)),
    G('skate', 'PIXEL SKATE', 'pixelSkate.save', 'pts', s => one('skate', s.bestCombo)),
    G('ski', 'PIXEL SKI', 'pixelSki.save', 'time', s => perTrack('ski', s.best, SKI_TRACKS), SKI_TRACKS),
    G('boxfight', 'PIXEL BOX FIGHT', 'pixelBoxFight.save', 'count', s => one('boxfight', s.wins)),
    bikeLike('bike', 'PIXEL BIKE RUN', 'pixelBikeRun.save', BIKE_TRACKS),
    G('cook', 'PIXEL COOK', 'pixelCook.save', '$', s => one('cook', s.best)),
    G('runs', 'PIXEL RUNS', 'pixelRuns.save', 'm', s => one('runs', s.best)),
    G('skygp', 'PIXEL SKY GP', 'pixelSkyGP.save', 'time', s => perTrack('skygp', s.best, SKYGP_TRACKS), SKYGP_TRACKS),
    bikeLike('moto', 'PIXEL MOTO', 'pixelMoto.save', MOTO_TRACKS),
    G('defense', 'PIXEL DEFENSE', 'pixelDefense.save', 'waves', s => perTrack('defense', Object.fromEntries(Object.entries(s.maps && typeof s.maps === 'object' ? s.maps : {}).map(([k, m]) => [k, m && m.endless])), DEFENSE_TRACKS), DEFENSE_TRACKS),
    G('snake', 'PIXEL SNAKE', 'pixelSnake.io', 'len', s => one('snake', s.best)),
    G('horde', 'PIXEL HORDE', 'pixelHorde.save', 'time', s => perTrack('horde', s.best, HORDE_TRACKS), HORDE_TRACKS),
    G('miner', 'PIXEL MINER', 'pixelMiner.save', 'm', s => one('miner', s.maxDepth)),
    G('hook', 'PIXEL HOOK', 'pixelHook.save', 'm', s => one('hook', num(s.endless) === null ? null : Math.floor(s.endless / 10))),
    G('slice', 'PIXEL SLICE', 'pixelSlice.save', 'pts', s => perTrack('slice', s.best, SLICE_TRACKS), SLICE_TRACKS),
    G('party', 'PIXEL PARTY: TROPHIES', 'pixelParty.save', 'pts', s => one('party', s.points)),
    G('tanks', 'PIXEL TANKS', 'pixelTanks.save', 'count', s => one('tanks', s.wins)),
    G('sniper', 'PIXEL SNIPER', 'pixelSniper.save', 'pts', s => one('sniper', s.best)),
  ];
  const spaced = n => String(Math.floor(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  const lowerBetter = b => BOUNDS[b] ? BOUNDS[b][0] === 'lo' : BOUNDS[b.split(':')[0]][0] === 'lo';
  let syncing = null;
  const Scores = {
    GAMES, BOUNDS, trackKey,
    // every board of every game that has a real value inside the server's bounds: [{ b, v }]
    collect() {
      const out = [], seen = {};
      for (const g of GAMES) {
        let save = null;
        if (!seen.hasOwnProperty(g.save)) { try { seen[g.save] = JSON.parse(localStorage.getItem(g.save)); } catch (e) { seen[g.save] = null; } }
        save = seen[g.save];
        if (!save || typeof save !== 'object') continue;
        let list = [];
        try { list = g.boards(save); } catch (e) { /* a broken save: skip that game */ }
        for (const x of list) {
          const rule = BOUNDS[x.b] || BOUNDS[x.b.split(':')[0]];
          if (!rule || num(x.v) === null || x.v < rule[1] || x.v > rule[2]) continue;
          if (rule[0] === 'hi' && x.v <= 0) continue;   // nothing earned yet
          out.push({ b: x.b, v: x.v });
        }
      }
      return out;
    },
    // Sends the bests that beat what was sent before. Never throws; one run at a time.
    sync() {
      if (syncing) return syncing;
      syncing = (async () => {
        try {
          const me = Api.session();
          if (!me || navigator.onLine === false) return;
          let sent = {};
          try { sent = JSON.parse(localStorage.getItem(SENT_KEY)) || {}; } catch (e) { sent = {}; }
          const mine = sent[me.id] && typeof sent[me.id] === 'object' ? sent[me.id] : {};
          const todo = this.collect().filter(x => { const old = num(mine[x.b]); return old === null || (lowerBetter(x.b) ? x.v < old : x.v > old); });
          for (let i = 0; i < todo.length; i += 60) {
            const chunk = todo.slice(i, i + 60);
            const res = await Api.call('POST', '/v1/scores', { scores: chunk }, me.tok);
            if (res.status === 401) { Api.onAuthLost(); return; }
            if (!res.ok) return;
            for (const x of chunk) mine[x.b] = x.v;
            sent[me.id] = mine;
            try { localStorage.setItem(SENT_KEY, JSON.stringify(sent)); } catch (e) { /* private mode: it will be sent again */ }
          }
        } catch (e) { /* syncing must never break a page */ }
      })().finally(() => { syncing = null; });
      return syncing;
    },
    // a value as the leaderboard shows it; `game` is a game id or a board id ("bike:free" counts metres)
    format(game, v) {
      v = num(v); if (v === null) return '-';
      const g = GAMES.find(x => x.game === String(game).split(':')[0]);
      const unit = /:free$/.test(game) ? 'm' : g ? g.unit : 'count';
      switch (unit) {
        case 'time': { const t = Math.floor(v * 10 + 1e-6) / 10, m = Math.floor(t / 60); return m + ':' + (t - m * 60).toFixed(1).padStart(4, '0'); }
        case 'm': return spaced(v) + ' M';
        case '$': return '$' + spaced(v);
        case 'coins': return spaced(v) + ' COINS';
        case 'stars': return '★ ' + spaced(v);
        case 'waves': return spaced(v) + ' WAVES';
        case 'len': return spaced(v) + ' LONG';
        case 'pts': return spaced(v) + ' PTS';
        default: return spaced(v);
      }
    },
  };
  window.addEventListener('load', () => setTimeout(() => Scores.sync(), 3000));

  // --- online play (the same free PeerJS server as Mouse Thief) -------------------------------
  // our own copy first (it works offline-cached and can't be blocked by a CDN filter), then two CDNs
  const PEERJS_URLS = ['vendor/peerjs.min.js',
                       'https://cdnjs.cloudflare.com/ajax/libs/peerjs/1.5.4/peerjs.min.js',
                       'https://unpkg.com/peerjs@1.5.4/dist/peerjs.min.js'];
  const ICE_SERVERS = [
    { urls: ['stun:stun.l.google.com:19302', 'stun:stun.cloudflare.com:3478'] },
    { urls: ['turn:eu-0.turn.peerjs.com:3478', 'turn:us-0.turn.peerjs.com:3478'], username: 'peerjs', credential: 'peerjsp' },
    // a second free public relay (TURN), for phones on mobile data that can't reach each other directly
    { urls: ['turn:openrelay.metered.ca:80', 'turn:openrelay.metered.ca:443', 'turn:openrelay.metered.ca:443?transport=tcp'], username: 'openrelayproject', credential: 'openrelayproject' },
  ];
  const CODE_CHARS = 'ABCDEFGHJKLMNPRSTUVWXYZ23456789';
  // Cloudflare's relay (TURN), the one that really works: the free ones above are often down, and two phones often
  // can't reach each other without a relay (mobile data, or a Wi-Fi that keeps its devices apart). Our API hands out
  // credentials for it (/v1/turn, good for a day); the phone keeps them 12 hours. They go at the front of ICE_SERVERS,
  // which every game passes to PeerJS, before any Peer is made (loadPeer waits for them, at most 3 seconds).
  const TURN_KEY = 'pixelArcade.turn';
  let relaysP = null, relaysIn = 0;
  const okIce = s => s && (Array.isArray(s.urls) ? s.urls : [s.urls]).every(u => typeof u === 'string' && /^(stun|turns?):/.test(u))
    && (s.username === undefined || typeof s.username === 'string') && (s.credential === undefined || typeof s.credential === 'string');
  function addRelays(list) {
    const ok = (Array.isArray(list) ? list : []).filter(okIce).map(s => ({ urls: s.urls, ...(s.username ? { username: s.username, credential: s.credential } : {}) }));
    if (!ok.length) return false;
    ICE_SERVERS.splice(0, relaysIn, ...ok); relaysIn = ok.length;               // (in place: the games hold this array)
    return true;
  }
  function relays() {
    if (relaysIn) return Promise.resolve();
    if (relaysP) return relaysP;
    try { const k = JSON.parse(localStorage.getItem(TURN_KEY)); if (k && Date.now() - k.at < 12 * 3600e3 && addRelays(k.s)) return Promise.resolve(); } catch (e) { /* none kept */ }
    const ask = Api.call('GET', '/v1/turn').then(r => {
      const list = r.ok && r.data && r.data.iceServers;
      if (addRelays(list)) try { localStorage.setItem(TURN_KEY, JSON.stringify({ at: Date.now(), s: list })); } catch (e) { /* private mode */ }
    });
    relaysP = Promise.race([ask, new Promise(res => setTimeout(res, 3000))]).finally(() => { relaysP = null; });   // (none yet: ask again next time)
    return relaysP;
  }
  let peerLoading = null;
  function loadPeer() { return Promise.all([loadPeerLib(), relays()]).then(() => {}); }
  function loadPeerLib() {
    if (window.Peer) return Promise.resolve();
    if (peerLoading) return peerLoading;
    // a download that hangs (a filter or a bad network can just never answer) moves on to the next copy after 8 s
    const tryUrl = i => new Promise((res, rej) => {
      const s = document.createElement('script');
      let done = false;
      const next = () => { if (done) return; done = true; clearTimeout(t); if (window.Peer) res(); else if (i + 1 < PEERJS_URLS.length) tryUrl(i + 1).then(res, rej); else rej(); };
      const t = setTimeout(next, 8000);
      s.src = PEERJS_URLS[i];
      s.onload = next;   // loaded: done if it made window.Peer, otherwise the next copy
      s.onerror = next;
      document.head.appendChild(s);
    });
    peerLoading = tryUrl(0).finally(() => { peerLoading = null; });
    return peerLoading;
  }

  // --- a crisp pixel screen: draw at a low resolution, blow it up to the window ---------------
  function makeScreen(canvas, opts = {}) {
    const H = opts.H || 240, MIN_W = opts.minW || 400, MAX_W = opts.maxW || 560;
    const buf = document.createElement('canvas'), ctx = buf.getContext('2d'), sctx = canvas.getContext('2d');
    const S = { W: 420, H, buf, ctx, view: { scale: 1, ox: 0, oy: 0, dpr: 1 } };
    S.resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 3), cw = window.innerWidth, ch = window.innerHeight;
      canvas.width = Math.round(cw * dpr); canvas.height = Math.round(ch * dpr);
      canvas.style.width = cw + 'px'; canvas.style.height = ch + 'px';
      let scale = ch / H;
      S.W = Math.max(MIN_W, Math.min(MAX_W, Math.round(cw / scale)));
      if (S.W * scale > cw) scale = cw / S.W;
      buf.width = S.W; buf.height = H; ctx.imageSmoothingEnabled = false;
      S.view = { scale: scale * dpr, ox: Math.round((cw - S.W * scale) / 2 * dpr), oy: Math.round((ch - H * scale) / 2 * dpr), dpr };
      if (opts.onResize) opts.onResize();
    };
    S.blit = (bg = '#000') => {
      sctx.imageSmoothingEnabled = false;
      sctx.fillStyle = bg; sctx.fillRect(0, 0, canvas.width, canvas.height);
      sctx.drawImage(buf, 0, 0, S.W, H, S.view.ox, S.view.oy, Math.round(S.W * S.view.scale), Math.round(H * S.view.scale));
    };
    S.toLogical = e => { const r = canvas.getBoundingClientRect(); return { x: ((e.clientX - r.left) * S.view.dpr - S.view.ox) / S.view.scale, y: ((e.clientY - r.top) * S.view.dpr - S.view.oy) / S.view.scale }; };
    // place an HTML text box over the pixel screen
    S.placeInput = (el, x, y, w, h) => {
      const k = S.view.scale / S.view.dpr;
      Object.assign(el.style, { display: 'block', left: (S.view.ox / S.view.dpr + x * k) + 'px', top: (S.view.oy / S.view.dpr + y * k) + 'px',
                                width: (w * k) + 'px', height: (h * k) + 'px', fontSize: Math.round(h * k * 0.55) + 'px' });
    };
    window.addEventListener('resize', S.resize);
    S.resize();
    return S;
  }

  // --- buttons (immediate mode: draw them every frame, clicks arrive on release) -------------
  function makeUI(S, canvas) {
    const UI = { list: [], click: null, downId: null, mx: -99, my: -99, pressed: false, back: false, held: {} };
    UI.begin = () => { UI.list = []; };
    UI.end = () => { UI.click = null; UI.back = false; };
    UI.hit = (x, y) => { for (const b of UI.list) if (!b.disabled && x >= b.x && x < b.x + b.w && y >= b.y && y < b.y + b.h) return b.id; return null; };
    UI.button = (id, x, y, w, h, label, o = {}) => {
      const ctx = S.ctx;
      UI.list.push({ id, x, y, w, h, disabled: !!o.disabled });
      const hot = !o.disabled && UI.mx >= x && UI.mx < x + w && UI.my >= y && UI.my < y + h;
      // a pixel key: cut corners, a dark outline, a light top edge and a bottom edge in the button's color.
      // Lit up in its color when the mouse is over it (or a finger is on it), pressed down 1 px while held.
      const acc = o.accent || '#8a7ad8', off = hot && UI.pressed ? 1 : 0;
      const box = (bx, by, bw, bh, col) => { ctx.fillStyle = col; ctx.fillRect(bx + 1, by, bw - 2, bh); ctx.fillRect(bx, by + 1, bw, bh - 2); };
      let fg = '#efe9ff';
      if (o.disabled) {
        box(x, y, w, h, '#0b0912'); box(x + 1, y + 1, w - 2, h - 2, '#16121f'); fg = '#5b5275';
      } else {
        if (!off) box(x + 1, y + 2, w, h, 'rgba(0,0,0,0.45)');                       // the shadow
        const yy = y + off;
        box(x, yy, w, h, '#0b0912');
        box(x + 1, yy + 1, w - 2, h - 2, hot ? acc : o.on ? '#3a2f5c' : '#272043');
        ctx.fillStyle = 'rgba(0,0,0,0.16)'; ctx.fillRect(x + 1, yy + Math.round(h * 0.55), w - 2, h - 1 - Math.round(h * 0.55));
        ctx.fillStyle = hot ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.16)'; ctx.fillRect(x + 2, yy + 1, w - 4, 1);
        if (!hot) { ctx.fillStyle = o.on || !/^#[0-9a-f]{6}$/i.test(acc) ? acc : shade(acc, 0.75); ctx.fillRect(x + 2, yy + h - 3, w - 4, 2); }
        if (hot) fg = '#111';
      }
      const size = o.size || 2;
      // pause and sound buttons are drawn signs, the same in every game: two thick bars, a speaker (a red cross when it is off)
      const sign = label === 'II' ? 'pause' : label === 'SND' ? 'snd' : label === 'OFF' && id === 'sfx' ? 'mute' : null;
      if (sign) {
        const cx = Math.round(x + w / 2), cy = Math.round(y + off + h / 2) - (o.disabled || hot ? 0 : 1), bar = (bx, by, bw, bh, col) => { ctx.fillStyle = col; ctx.fillRect(bx, by, bw, bh); };
        const col = o.disabled ? '#5b5275' : hot ? '#111' : '#efe9ff';
        if (sign === 'pause') { bar(cx - 5, cy - 4, 4, 9, col); bar(cx + 1, cy - 4, 4, 9, col); }
        else {
          bar(cx - 8, cy - 2, 3, 5, col); bar(cx - 5, cy - 3, 2, 7, col); bar(cx - 3, cy - 5, 2, 11, col);
          if (sign === 'snd') { bar(cx + 1, cy - 2, 1, 5, col); bar(cx + 3, cy - 4, 1, 9, col); bar(cx + 5, cy - 5, 1, 11, col); }
          else for (let i = 0; i < 5; i++) { bar(cx + 1 + i, cy - 2 + i, 1, 2, hot ? '#111' : '#ff6a5a'); bar(cx + 5 - i, cy - 2 + i, 1, 2, hot ? '#111' : '#ff6a5a'); }
        }
      } else
      if (label) drawText(ctx, label, x + w / 2, y + off + Math.round((h - 5 * size) / 2) - (o.disabled || hot ? 0 : 1), o.textColor && !hot && !o.disabled ? o.textColor : fg, size, 'center', !hot && !o.disabled && size > 1 ? '#0b0912' : null);
      return !o.disabled && UI.click === id;
    };
    canvas.addEventListener('pointerdown', e => {
      e.preventDefault();
      const { x, y } = S.toLogical(e);
      UI.mx = x; UI.my = y; UI.pressed = true; UI.downId = UI.hit(x, y);
      if (UI.onDown) UI.onDown(e, x, y);
    });
    canvas.addEventListener('pointermove', e => { const { x, y } = S.toLogical(e); UI.mx = x; UI.my = y; if (UI.onMove) UI.onMove(e, x, y); });
    const up = (e, cancel) => {
      UI.pressed = false;
      if (UI.onUp) UI.onUp(e);
      if (cancel) return;
      const { x, y } = S.toLogical(e), id = UI.hit(x, y);
      if (id !== null && id === UI.downId) UI.click = id;
      UI.downId = null;
      if (e.pointerType !== 'mouse') { UI.mx = -99; UI.my = -99; }
    };
    canvas.addEventListener('pointerup', e => up(e, false));
    canvas.addEventListener('pointercancel', e => up(e, true));
    canvas.addEventListener('contextmenu', e => e.preventDefault());
    return UI;
  }

  // --- arcade settings (the SETTINGS button in the arcade): shared by all the games ------------
  const SETTINGS_KEY = 'pixelArcade.settings';
  const VOLUMES = [['OFF', 0], ['LOW', 0.3], ['MEDIUM', 0.6], ['HIGH', 1]];
  const Settings = {
    // voice: VOICE CHAT in the online games (PX.Voice), on unless turned off in SETTINGS
    // lang: 'en' or 'cs' (Lang: SETTINGS → LANGUAGE)
    // chatPop: CHAT POP-UPS, a friend's chat message pops up in the games (PX.ChatPop), on unless turned off
    load() { let d = {}; try { d = JSON.parse(localStorage.getItem(SETTINGS_KEY)) || {}; } catch (e) { /* new player */ } return { volume: VOLUMES[d.volume] ? d.volume | 0 : 3, voice: d.voice !== false, chatPop: d.chatPop !== false, lang: Lang.code() }; },
    save(d) { try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(d)); } catch (e) { /* private mode */ } Lang.changed(); Sound.apply(); },
    volume() { return VOLUMES[this.load().volume][1]; },
    VOLUMES,
  };

  // --- tiny sound helpers ----------------------------------------------------------------
  const Sound = {
    ctx: null, out: null,
    unlock() {
      if (!this.ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        try { this.ctx = new AC(); } catch (e) { return; }
        this.out = this.ctx.createGain(); this.out.connect(this.ctx.destination); this.apply();
      }
      if (this.ctx.state === 'suspended') this.ctx.resume();
    },
    duck: 1,                                                                       // < 1 while a friend talks (PX.Voice)
    apply() { if (this.out) this.out.gain.value = 0.5 * Settings.volume() * this.duck; },   // the arcade's volume setting
    setDuck(k) {
      if (k === this.duck) return;
      this.duck = k;
      if (this.out && this.ctx) { try { this.out.gain.setTargetAtTime(0.5 * Settings.volume() * k, this.ctx.currentTime, 0.12); } catch (e) { this.apply(); } }
    },
    tone(f, dur, o = {}) {
      const c = this.ctx; if (!c) return;
      const t0 = c.currentTime + (o.delay || 0), osc = c.createOscillator(), g = c.createGain();
      osc.type = o.type || 'square';
      const fs = Array.isArray(f) ? f : [f];
      osc.frequency.setValueAtTime(fs[0], t0);
      for (let i = 1; i < fs.length; i++) osc.frequency.exponentialRampToValueAtTime(Math.max(20, fs[i]), t0 + dur * i / (fs.length - 1));
      g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(o.vol || 0.15, t0 + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      osc.connect(g); g.connect(o.dest || this.out); osc.start(t0); osc.stop(t0 + dur + 0.05);
    },
    noise(dur, o = {}) {
      const c = this.ctx; if (!c) return;
      const t0 = c.currentTime + (o.delay || 0), len = Math.ceil(c.sampleRate * dur), b = c.createBuffer(1, len, c.sampleRate), d = b.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      const src = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
      src.buffer = b; f.type = o.filter || 'lowpass'; f.frequency.value = o.freq || 800;
      g.gain.setValueAtTime(o.vol || 0.2, t0); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      src.connect(f); f.connect(g); g.connect(o.dest || this.out); src.start(t0);
    },
  };

  // --- the ★ wallet: one pile of stars for all the games (kept in Mouse Thief's save) ---------
  const WALLET_KEY = 'mouseThief.save.v1';
  const Wallet = {
    read() { try { return JSON.parse(localStorage.getItem(WALLET_KEY)) || {}; } catch (e) { return {}; } },
    write(d) { try { localStorage.setItem(WALLET_KEY, JSON.stringify(d)); } catch (e) { /* private mode */ } },
    get() { return this.read().points | 0; },
    add(n) {
      const d = this.read();
      d.points = Math.max(0, (d.points | 0) + n);
      if (n > 0) d.totalEarned = (d.totalEarned | 0) + n;
      this.write(d); return d.points;
    },
    spend(n) { if (this.get() < n) return false; this.add(-n); return true; },
  };

  // --- BETS: play an online match for stars ---------------------------------------------------
  // The host of an online game for TWO players picks a bet (or NO BET); both players see it in the lobby before the
  // match starts. When the match starts each player puts the bet in: it leaves their wallet. The winner gets both
  // bets back (so wins the bet), the loser gets nothing (so loses it), a draw gives each their own back. Leaving a
  // match never saves your bet: it is already in.
  // A game uses it like this (send = the game's own function that sends one JSON message to the friend):
  //   PX.Bet.connect(send, isHost)   once, when the two players are connected (both sides)
  //   if (PX.Bet.onData(m)) return;  first thing when a message arrives (the bet's own messages: t 'bet', 'betmax')
  //   PX.Bet.next()                  the host's lobby button (PX.Bet.label() is its text; the guest just shows the label)
  //   PX.Bet.start()                 when the match starts (both sides, every match and rematch)
  //   PX.Bet.settle(won)             when the match is decided: true = I won, false = I lost, null = a draw. Once per match
  //                                  (more calls do nothing). Also call it with true when the friend leaves mid-match.
  //   PX.Bet.resultLabel()           '' or 'BET WON: +★10' / 'BET LOST: -★10' / 'BET BACK: ★10', for the result screen
  //   PX.Bet.reset()                 when the connection is closed or the player leaves the lobby
  //                                  (a bet still in play is lost then: if it was the FRIEND who left, call settle(true) first)
  const Bet = {
    STEPS: [0, 10, 50, 100, 500], amount: 0, peerMax: 0, live: 0, result: null, isHost: false, send: null,
    reset() { this.amount = 0; this.peerMax = 0; this.live = 0; this.result = null; this.send = null; },
    connect(send, isHost) { this.reset(); this.send = send; this.isHost = !!isHost; this.tell(); },
    tell() { if (this.send) { this.send({ t: 'betmax', max: Wallet.get() }); if (this.isHost) this.send({ t: 'bet', n: this.amount }); } },
    limit() { return Math.min(Wallet.get(), this.peerMax); },                 // nobody can bet more than either player has
    fit() { if (this.amount > this.limit()) this.amount = this.STEPS.filter(n => n <= this.limit()).pop() || 0; },
    onData(m) {
      if (!m || (m.t !== 'bet' && m.t !== 'betmax')) return false;
      if (m.t === 'betmax') { this.peerMax = Math.max(0, m.max | 0); if (this.isHost) { const was = this.amount; this.fit(); if (was !== this.amount) this.tell(); } }
      else if (!this.isHost) this.amount = this.STEPS.includes(m.n) && m.n <= Wallet.get() ? m.n : 0;
      return true;
    },
    next() {                                                                     // the host: NO BET, 10, 50, 100, 500, and round again
      if (!this.isHost || this.live) return;
      const ok = this.STEPS.filter(n => n <= this.limit());
      this.amount = ok[(ok.indexOf(this.amount) + 1) % ok.length] || 0; this.tell();
    },
    label() { return this.amount ? 'BET: ★' + this.amount : 'NO BET'; },
    start() {
      if (this.live) this.settle(null);
      this.result = null; this.live = this.amount && Wallet.spend(this.amount) ? this.amount : 0;
    },
    settle(won) {
      const n = this.live; if (!n) return 0;
      this.live = 0;
      if (won === true) Wallet.add(n * 2); else if (won !== false) { const d = Wallet.read(); d.points = (d.points | 0) + n; Wallet.write(d); }   // (a bet that comes back isn't "earned")
      this.result = won === true ? n : won === false ? -n : 0; this.backed = won !== true && won !== false ? n : 0;
      setTimeout(() => this.tell(), 50);                                         // the wallets changed: say what I can bet now
      return this.result;
    },
    resultLabel() { return this.result === null ? '' : this.result > 0 ? 'BET WON: +★' + this.result : this.result < 0 ? 'BET LOST: -★' + (-this.result) : this.backed ? 'BET BACK: ★' + this.backed : ''; },
  };

  // --- game controllers (Xbox and others): one layer for all the games ---------------------------
  // A game calls PX.Pad.setup({...}) once:
  //   menu()        true when the controller should move between the menu buttons
  //   ui            the game's PX.makeUI (menus: the stick picks a button, A presses it, B goes back)
  //   menuKeys      or, for a game with its own keyboard menus: keys to press in the menus
  //   keys(n)       the keys controller n (0 or 1) presses while playing, e.g. { A: 'Space', left: 'ArrowLeft' }
  //   onPlay(gp, n, dt) extra, game-specific handling while playing (e.g. analog aiming)
  //                 (a phone with a touch pad: h.touch is { x, y } from 0 to 1, where the finger is on the pad,
  //                  or null when it isn't touching; like a tablet, where you touch is where it goes)
  //   help          [[button, what it does], ...] for the little help box (only when you press VIEW; it never pops up by itself)
  // (help: several buttons for one thing are written 'B|X'.)
  // Buttons: A B X Y LB RB LT RT VIEW START, up/down/left/right (left stick and d-pad), rup/rdown/rleft/rright (right stick).
  const BTN = { A: 0, B: 1, X: 2, Y: 3, LB: 4, RB: 5, LT: 6, RT: 7, VIEW: 8, START: 9 };
  const KEYNAME = { Space: ' ', Enter: 'Enter', Escape: 'Escape', Backspace: 'Backspace', Tab: 'Tab' };
  const keyOf = code => KEYNAME[code] || (code.startsWith('Key') ? code.slice(3).toLowerCase() : code.startsWith('Digit') ? code.slice(5) : code);
  const Pad = {
    cfg: null, used: false, down: new Map(), prevBtn: [{}, {}], focus: null, navT: 0, last: 0, helpEl: null, helpUntil: 0, helpPinned: false,
    setup(cfg) {
      this.cfg = cfg;
      try { if ('gamepadInputEmulation' in navigator) navigator.gamepadInputEmulation = 'gamepad'; } catch (e) { /* not an Xbox */ }
      window.addEventListener('pointerdown', () => { this.used = false; this.hideHelp(); });
      // On an Xbox, Edge drives a mouse pointer with the controller; in full screen web games get the controller.
      // So there we go full screen at the first click or key (browsers only allow it then).
      if (/xbox/i.test(navigator.userAgent)) {
        const full = () => { const d = document, el = d.documentElement; if (!d.fullscreenElement && el.requestFullscreen) el.requestFullscreen().catch(() => { /* not allowed */ }); };
        window.addEventListener('pointerup', full); window.addEventListener('keyup', full);
      }
      const loop = now => { this.poll(now); requestAnimationFrame(loop); };
      requestAnimationFrame(loop);
    },
    pads() { try { return navigator.getGamepads ? [...navigator.getGamepads()].filter(g => g && g.connected).slice(0, 2) : []; } catch (e) { return []; } },
    state(gp) {                                                       // what is held on one controller
      const b = i => !!(gp.buttons[i] && (gp.buttons[i].pressed || gp.buttons[i].value > 0.5)), ax = gp.axes[0] || 0, ay = gp.axes[1] || 0, rx = gp.axes[2] || 0, ry = gp.axes[3] || 0;
      const h = {}; for (const k in BTN) h[k] = b(BTN[k]);
      h.up = b(12) || ay < -0.5; h.down = b(13) || ay > 0.5; h.left = b(14) || ax < -0.5; h.right = b(15) || ax > 0.5;
      h.rup = ry < -0.5; h.rdown = ry > 0.5; h.rleft = rx < -0.5; h.rright = rx > 0.5;
      h.ax = b(14) ? -1 : b(15) ? 1 : ax; h.ay = b(12) ? -1 : b(13) ? 1 : ay; h.rx = rx; h.ry = ry;
      // a phone's touch pad: where the finger is on it (0..1), null when it isn't touching
      const tp = gp.touchpad; h.touch = tp && tp.on ? { x: tp.x, y: tp.y } : null;
      return h;
    },
    key(type, code) { try { window.dispatchEvent(new KeyboardEvent(type, { code, key: keyOf(code), bubbles: true, cancelable: true })); } catch (e) { /* old browser */ } },
    poll(now) {
      if (this.off) { this.prevBtn = [{}, {}]; this.last = now; return; }   // (a game is open in the arcade's frame: it reads the controller)
      const cfg = this.cfg, dt = Math.min(0.1, (now - (this.last || now)) / 1000); this.last = now;
      const pads = this.pads(), want = new Map();
      const inMenu = !!(cfg.menu && cfg.menu());
      pads.forEach((gp, n) => {
        const h = this.state(gp), prev = this.prevBtn[n], edge = k => h[k] && !prev[k];
        const anything = Object.keys(BTN).some(k => h[k]) || Math.hypot(h.ax, h.ay) > 0.5;
        if (anything && !this.used) { this.used = true; this.focus = null; }
        if (edge('VIEW')) { if (this.helpEl && this.helpEl.style.display === 'block') this.hideHelp(); else this.showHelp(0); }
        if (inMenu && cfg.ui) this.menuNav(h, edge, dt);
        else {
          const map = inMenu ? cfg.menuKeys : cfg.keys && cfg.keys(n);
          if (map) for (const k in map) if (h[k]) for (const code of [].concat(map[k])) want.set(code, inMenu && ['up', 'down', 'left', 'right'].includes(k));
          if (!inMenu && cfg.onPlay) cfg.onPlay(h, n, dt, edge);
        }
        this.prevBtn[n] = h;
      });
      // press and let go of the keys, so the game sees a keyboard (menus: held directions repeat)
      for (const [code, rep] of want) {
        const d = this.down.get(code);
        if (!d) { this.key('keydown', code); this.down.set(code, { t: 0, rep }); }
        else if (rep && (d.t += dt) > 0.4) { d.t = 0.25; this.key('keydown', code); }
      }
      for (const code of [...this.down.keys()]) if (!want.has(code)) { this.key('keyup', code); this.down.delete(code); }
      if (this.helpUntil && now > this.helpUntil) this.hideHelp();
    },
    menuNav(h, edge, dt) {                                            // move between the buttons of a PX.makeUI screen
      const UI = this.cfg.ui, list = (UI.list || []).filter(b => !b.disabled);
      if (!list.some(b => b.id === this.focus)) { this.focus = null; let big = 0; for (const b of list) if (b.w * b.h > big) { big = b.w * b.h; this.focus = b.id; } }
      const m = Math.hypot(h.ax, h.ay);
      if (m > 0.6) {
        if ((this.navT -= dt) <= 0) {
          this.navT = this.navT < -1 ? 0.35 : 0.2;
          const [dx, dy] = Math.abs(h.ax) > Math.abs(h.ay) ? [Math.sign(h.ax), 0] : [0, Math.sign(h.ay)];
          const cur = list.find(b => b.id === this.focus);
          if (cur) {
            const cx = cur.x + cur.w / 2, cy = cur.y + cur.h / 2; let best = null, bs = 1e9;
            for (const b of list) {
              if (b === cur) continue;
              const ox = b.x + b.w / 2 - cx, oy = b.y + b.h / 2 - cy, along = ox * dx + oy * dy;
              if (along <= 2) continue;
              const sc = along + Math.abs(ox * dy - oy * dx) * 4;
              if (sc < bs) { bs = sc; best = b; }
            }
            if (best) this.focus = best.id;
          }
        }
      } else this.navT = 0;
      const f = list.find(b => b.id === this.focus);
      if (f && this.used) { UI.mx = f.x + f.w / 2; UI.my = f.y + f.h / 2; }
      if (edge('A') && f) UI.click = f.id;
      if (edge('B')) UI.back = true;
      if (edge('START')) { this.key('keydown', 'KeyP'); this.key('keyup', 'KeyP'); }
    },
    // the little help box: what each button does
    showHelp(sec) {
      const cfg = this.cfg; if (!cfg || !cfg.help) return;
      if (!this.helpEl) {
        const el = document.createElement('div');
        Object.assign(el.style, { position: 'fixed', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', zIndex: 50, display: 'none', pointerEvents: 'none',
          background: '#1d1830', color: '#efe9ff', border: '3px solid #efe9ff', boxShadow: '6px 6px 0 #000', padding: '14px 20px',
          font: 'bold 15px/1.5 ui-monospace, Menlo, Consolas, monospace', textTransform: 'uppercase', maxWidth: '86vw' });
        document.body.appendChild(el); this.helpEl = el;
      }
      const esc = t => String(t).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]);
      const COL = { A: '#5ad43f', B: '#ff5a5a', X: '#4aa8ff', Y: '#ffd23f' };
      const chip = b => b.split('|').map(p => `<span style="display:inline-block;min-width:1.6em;padding:0 .35em;margin:0 .15em 0 0;text-align:center;border:2px solid ${COL[p] || '#efe9ff'};color:${COL[p] || '#efe9ff'}">${esc(p)}</span>`).join('');
      this.helpEl.innerHTML = `<div style="color:#ffd23f;font-size:18px;margin-bottom:8px">🎮 ${esc(cfg.title || 'Controller')}</div>` +
        cfg.help.map(([b, what]) => `<div>${chip(b)} ${esc(what)}</div>`).join('') +
        `<div style="color:#9a92b8;margin-top:8px;font-size:12px">VIEW: show / hide this help</div>`;
      this.helpEl.style.display = 'block'; this.helpUntil = sec ? performance.now() + sec * 1000 : 0;
    },
    hideHelp() { if (this.helpEl) this.helpEl.style.display = 'none'; this.helpUntil = 0; },
  };


  // --- your avatar is the page's icon (the browser tab; "add to home screen" on an iPhone) -------------
  function avatarIconURL(av, size) {
    const c = document.createElement('canvas'); c.width = c.height = size;
    const g = c.getContext('2d'), k = Math.max(1, Math.floor(size * (size < 64 ? 1 : 0.8) / 14)), o = Math.floor((size - 14 * k) / 2);
    g.fillStyle = '#0d0b13'; g.fillRect(0, 0, size, size);
    g.imageSmoothingEnabled = false; g.drawImage(avatarImage(av), o, o, 14 * k, 14 * k);
    return c.toDataURL('image/png');
  }
  function setIcon(av) {
    try {
      av = av || Profile.load().avatar;
      document.querySelectorAll('link[rel="icon"]').forEach(l => { l.href = avatarIconURL(av, 32); });
      document.querySelectorAll('link[rel="apple-touch-icon"]').forEach(l => { l.href = avatarIconURL(av, 180); });
    } catch (e) { /* keep the cat */ }
  }
  setIcon();

  // --- phones as controllers --------------------------------------------------------------------
  // The big screen (an Xbox, a TV, a computer) shows a code; phones open pad.html and type it.
  // Each phone then is one more game controller: the games read it like any other (navigator.getGamepads),
  // and the screen tells the phone which buttons the game uses and what they do, so it shows only those.
  // The code is kept in the tab (sessionStorage), so the phones stay connected when you pick a game.
  const REMOTE_KEY = 'pixelArcade.remoteScreen', REMOTE_PREFIX = 'pixel-arcade-pad-', MAX_PHONES = 4;
  // Each phone has its own id, and the screen remembers (in the tab) which phone is controller 1, 2, ...
  // After a game change the phones keep their numbers, whichever reconnects first: a phone that isn't
  // back yet keeps its place (an idle controller) for a few seconds.
  const ORDER_KEY = 'pixelArcade.remoteOrder', KEEP_SEAT = 10000;
  // standard controller button numbers
  const PADNUM = { A: 0, B: 1, X: 2, Y: 3, LB: 4, RB: 5, LT: 6, RT: 7, VIEW: 8, START: 9, up: 12, down: 13, left: 14, right: 15 };
  const MENU_LAYOUT = { stick: 'PICK', dpad: true, buttons: [['A', 'OK'], ['B', 'BACK']] };
  // a phone layout from the help box, for a game that doesn't give one
  function layoutFromHelp(help) {
    const out = { stick: null, buttons: [] }, seen = new Set();
    for (const [keys, what] of help || []) {
      if (/^(MENUS|2ND PAD|VAULT)/.test(what) || keys === '2ND PAD' || keys === 'STICK + A') continue;
      const parts = keys.split('|');
      if (parts.some(p => /STICK|D-PAD/.test(p)) && !out.stick) out.stick = what;
      const b = parts.find(p => PADNUM[p] !== undefined && p !== 'START');
      if (b && !seen.has(b)) { seen.add(b); out.buttons.push([b, what]); }
    }
    return out;
  }
  const realGetPads = navigator.getGamepads ? navigator.getGamepads.bind(navigator) : null;
  const Remote = {
    code: null, peer: null, phones: [], status: 'off', tries: 0, toastEl: null, timer: 0,
    order: [], left: {}, seats: {}, born: performance.now(),
    loadOrder() { try { const o = JSON.parse(sessionStorage.getItem(ORDER_KEY)); this.order = Array.isArray(o) ? o.filter(x => typeof x === 'string').slice(0, 8) : []; } catch (e) { this.order = []; } },
    saveOrder() { try { sessionStorage.setItem(ORDER_KEY, JSON.stringify(this.order)); } catch (e) { /* private mode */ } },
    // a phone that is away keeps its seat for a while (just after a game change, or a short drop-out)
    keepsSeat(id, now) { return now - this.born < KEEP_SEAT || now - (this.left[id] || -1e9) < KEEP_SEAT; },
    prune() {
      const now = performance.now(), n = this.order.length;
      this.order = this.order.filter(id => this.phones.some(ph => ph.id === id) || this.keepsSeat(id, now));
      if (this.order.length !== n) this.saveOrder();
    },
    seat(id) {                                                       // an idle controller, holding a phone's place
      return this.seats[id] || (this.seats[id] = { id: 'Pixel Games phone controller (reconnecting)', index: 0, connected: true, mapping: 'standard', timestamp: 0,
        buttons: Array.from({ length: 17 }, () => ({ pressed: false, touched: false, value: 0 })), axes: [0, 0, 0, 0] });
    },
    // the controllers the phones are, in their order
    pads(now) {
      const list = [];
      for (const id of this.order) {
        const ph = this.phones.find(p => p.id === id && p.pad);
        if (ph) list.push(ph); else if (this.keepsSeat(id, now)) list.push({ pad: this.seat(id), raw: 0, hold: [] });
      }
      for (const ph of this.phones) if (ph.pad && !ph.id) list.push(ph);   // an older pad.html, or not said hello yet
      return list;
    },
    active() { return !!this.code; },
    start() {
      if (this.code) return;
      let c = ''; for (let i = 0; i < 4; i++) c += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
      this.code = c; try { sessionStorage.setItem(REMOTE_KEY, c); } catch (e) { /* private mode */ }
      this.open();
    },
    resume() {
      let c = null; try { c = sessionStorage.getItem(REMOTE_KEY); } catch (e) { /* private mode */ }
      if (c && /^[A-Z0-9]{4}$/.test(c)) { this.code = c; this.loadOrder(); this.open(); setTimeout(() => this.toast('📱 PHONE CONTROLLERS: CODE ' + c, 4), 600); }
    },
    stop() {
      try { sessionStorage.removeItem(REMOTE_KEY); } catch (e) { /* private mode */ }
      for (const ph of this.phones) { try { ph.conn.send({ t: 'bye' }); ph.conn.close(); } catch (e) { /* gone */ } }
      this.phones = []; this.code = null; this.status = 'off'; this.order = []; this.left = {};
      try { sessionStorage.removeItem(ORDER_KEY); } catch (e) { /* private mode */ }
      if (this.peer) { try { this.peer.destroy(); } catch (e) { /* gone */ } this.peer = null; }
      clearInterval(this.timer); this.timer = 0;
    },
    open() {
      if (!this.code) return;
      this.status = 'starting';
      if (!this.timer) this.timer = setInterval(() => this.sync(), 250);
      loadPeer().then(() => {
        if (!this.code) return;
        const code = this.code, peer = new Peer(REMOTE_PREFIX + code, { debug: 0, config: { iceServers: ICE_SERVERS } });
        this.peer = peer;
        const retry = () => {
          if (this.peer !== peer) return;
          try { peer.destroy(); } catch (e) { /* gone */ }
          this.peer = null; this.status = 'starting';
          // after a page change the old page may still hold the code for a moment: try again soon
          if (++this.tries > 30 && !this.phones.length) { this.tries = 0; this.code = null; this.start(); return; }
          setTimeout(() => { if (this.code === code && !this.peer) this.open(); }, this.tries < 6 ? 500 : 1500);
        };
        peer.on('open', () => { this.status = 'ready'; this.tries = 0; });
        peer.on('connection', conn => this.add(conn));
        peer.on('disconnected', () => { if (this.peer === peer) { try { peer.reconnect(); } catch (e) { retry(); } } });
        peer.on('error', e => { if (e.type !== 'peer-unavailable') retry(); });
      }).catch(() => { this.status = 'offline'; setTimeout(() => { if (this.code && !this.peer) this.open(); }, 5000); });
    },
    add(conn) {
      const ph = { conn, pad: null, name: 'PHONE', avatar: null, sent: '', raw: 0, hold: new Array(17).fill(0) };
      conn.on('open', () => {
        if (this.phones.length >= MAX_PHONES) { try { conn.send({ t: 'full' }); setTimeout(() => conn.close(), 500); } catch (e) { /* gone */ } return; }
        ph.pad = { id: 'Pixel Games phone controller', index: 0, connected: true, mapping: 'standard', timestamp: performance.now(),
                   buttons: Array.from({ length: 17 }, () => ({ pressed: false, touched: false, value: 0 })), axes: [0, 0, 0, 0], touchpad: { on: false, x: 0, y: 0 } };
        this.phones.push(ph); ph.sent = ''; this.sync();
      });
      conn.on('data', d => {
        if (!d || typeof d !== 'object') return;
        if (d.t === 'hello') {
          ph.name = cleanName(d.name) || 'PHONE';
          if (typeof d.id === 'string' && /^[a-z0-9]{4,24}$/.test(d.id)) {
            ph.id = d.id; delete this.left[d.id];
            // the same phone connected twice (it re-dialled while the first try was still on its way): keep the new one
            for (const old of this.phones.filter(o => o !== ph && o.id === d.id)) {
              old.replaced = true; this.phones.splice(this.phones.indexOf(old), 1);
              try { old.conn.close(); } catch (e) { /* gone */ }
            }
            if (!this.order.includes(d.id)) { this.order.push(d.id); this.saveOrder(); }
          }
          ph.avatar = d.avatar && AVATARS[d.avatar.shape] ? { shape: d.avatar.shape, color: d.avatar.color | 0 } : null;
          ph.sent = ''; this.sync();
          const n = this.number(ph);
          this.toast('📱 ' + ph.name + (n ? ' IS CONTROLLER ' + n : ' JOINED'), 3);
        } else if (d.t === 's' && ph.pad) {
          // a quick tap stays pressed for a few frames, so the game always sees it
          const b = d.b & 0x1ffff, now = performance.now();
          for (let i = 0; i < 17; i++) if ((b >> i & 1) && !(ph.raw >> i & 1)) ph.hold[i] = now + 80;
          ph.raw = b;
          const ax = Number(d.x) || 0, ay = Number(d.y) || 0;
          ph.pad.axes[0] = Math.max(-1, Math.min(1, ax)); ph.pad.axes[1] = Math.max(-1, Math.min(1, ay));
          // the touch pad: where the finger is (0..1), or not touching
          const tp = ph.pad.touchpad, c = v => Math.max(0, Math.min(1, Number(v) || 0));
          if (Array.isArray(d.p)) { tp.on = true; tp.x = c(d.p[0]); tp.y = c(d.p[1]); } else tp.on = false;
          ph.pad.timestamp = performance.now();
        }
      });
      const gone = () => {
        const i = this.phones.indexOf(ph); if (i < 0 || ph.replaced) return;
        this.phones.splice(i, 1);
        if (ph.id) this.left[ph.id] = performance.now();
        this.toast('📱 ' + ph.name + ' LEFT', 2);
      };
      conn.on('close', gone); conn.on('error', gone);
    },
    // which controller (1, 2, ...) a phone is in the game
    number(ph) { const list = navigator.getGamepads ? [...navigator.getGamepads()].filter(g => g && g.connected) : []; return list.indexOf(ph.pad) + 1; },
    layout() {
      const cfg = Pad.cfg || {};
      let menu = true; try { menu = cfg.phoneMenu ? !!cfg.phoneMenu() : cfg.menu ? !!cfg.menu() : true; } catch (e) { /* not ready yet */ }
      const L = menu ? (cfg.phoneMenuLayout || MENU_LAYOUT) : (cfg.phone || layoutFromHelp(cfg.help));
      return { title: String(cfg.title || document.title || 'Pixel Games').replace(/: controller$/i, ''), mode: menu ? 'menu' : 'play',
               stick: L.stick || null, dpad: !!L.dpad, touch: L.touch || null, buttons: L.buttons || [] };
    },
    sync() {                                   // tell each phone what to show, when it changes
      this.prune();
      if (!this.phones.length) return;
      const L = this.layout();
      for (const ph of this.phones) {
        const msg = Object.assign({ t: 'layout', player: this.number(ph) }, L), s = JSON.stringify(msg);
        if (s !== ph.sent) { try { ph.conn.send(msg); ph.sent = s; } catch (e) { /* closing */ } }
      }
    },
    toast(text, sec) {
      if (!document.body) return;
      if (!this.toastEl) {
        const el = document.createElement('div');
        Object.assign(el.style, { position: 'fixed', left: '50%', bottom: '10px', transform: 'translateX(-50%)', zIndex: 60, display: 'none', pointerEvents: 'none',
          background: '#1d1830', color: '#ffd23f', border: '2px solid #efe9ff', boxShadow: '4px 4px 0 #000', padding: '6px 12px',
          font: 'bold 14px/1.4 ui-monospace, Menlo, Consolas, monospace', textTransform: 'uppercase', whiteSpace: 'nowrap' });
        document.body.appendChild(el); this.toastEl = el;
      }
      this.toastEl.textContent = text; this.toastEl.style.display = 'block';
      clearTimeout(this.toastT); this.toastT = setTimeout(() => { this.toastEl.style.display = 'none'; }, sec * 1000);
    },
  };
  // every phone shows up as one more game controller
  {
    try {
      Object.defineProperty(navigator, 'getGamepads', { configurable: true, writable: true, value: () => {
        let real = []; try { real = realGetPads ? [...realGetPads()] : []; } catch (e) { real = []; }
        if (!Remote.phones.length && !Remote.order.length) return real;
        // phones come first: whoever joins with a phone wants to play with it (an Xbox always has its own controller on)
        const list = [], now = performance.now();
        for (const ph of Remote.pads(now)) {
          ph.pad.buttons.forEach((btn, i) => { btn.pressed = btn.touched = !!(ph.raw >> i & 1) || now < ph.hold[i]; btn.value = btn.pressed ? 1 : 0; });
          ph.pad.index = list.length; list.push(ph.pad);
        }
        for (const g of real) if (g && g.connected) list.push(g);
        return list;
      } });
    } catch (e) { /* can't add phones in this browser */ }
  }
  window.addEventListener('pagehide', () => { if (Remote.peer) { try { Remote.peer.destroy(); } catch (e) { /* gone */ } } });
  if (!window.PX_NO_REMOTE) Remote.resume();

  // --- INVITE A FRIEND to your online game --------------------------------------------------------------------
  // Every online game makes a room with a 4-letter code. On the screen that shows the code there is INVITE A FRIEND:
  // it lists your friends (the arcade's FRIENDS list) and sends the one you pick a message, the same way as a gift
  // of stars (ntfy.sh, to the topic of their ID): which game, and the code. Their arcade shows a popup with JOIN,
  // which opens the game with ?join=CODE, and the game joins right away. An invite is good for 10 minutes, and the
  // friend has to have the arcade (the list of games) open to see it.
  const Invite = {
    on: false, msg: '', col: '#9a92b8', sent: {}, page: 0,
    game: (location.pathname.split('/').pop() || '').replace(/\.html$/, ''),
    friends() {
      try { const d = JSON.parse(localStorage.getItem('pixelArcade.friends')); return (d && Array.isArray(d.list) ? d.list : []).filter(f => f && /^[1-9][0-9]{5}$/.test(f.id)).map(f => ({ id: f.id, name: cleanName(f.name) || 'PLAYER' })); }
      catch (e) { return []; }
    },
    // the button on the screen with your code
    button(UI, x, y, w, h, o = {}) { if (UI.button('invite', x, y, w, h, 'INVITE A FRIEND', { size: 1, accent: '#ff7ab8', ...o })) { this.on = true; this.msg = ''; this.sent = {}; this.page = 0; } },
    async send(f, code) {
      this.sent[f.id] = 'wait';
      try {
        const p = Profile.get();
        const res = await fetch('https://ntfy.sh/pixel-arcade-stars-' + f.id, { method: 'POST', body: JSON.stringify({ v: 1, t: 'inv', tx: Date.now().toString(36) + Math.random().toString(36).slice(2, 10), from: p.name, fid: p.id, g: this.game, code }) });
        if (!res.ok) throw new Error('relay ' + res.status);
        Push.tell(f.id, 'inv', { g: this.game, code });       // and a notification on their phone
        this.sent[f.id] = 'ok'; this.msg = f.name + ' IS INVITED! WAIT FOR THEM HERE.'; this.col = '#5ad43f';
      } catch (e) { delete this.sent[f.id]; this.msg = "COULDN'T SEND IT. CHECK YOUR INTERNET."; this.col = '#ff8a8a'; }
    },
    // the list of friends, over the whole screen: call it first in the lobby's drawing, and draw nothing else when it
    // returns true. code: your game's code while you wait for a friend ('' closes the list: somebody joined, or you left)
    draw(scr, UI, code) {
      if (!this.on) return false;
      if (!code) { this.on = false; return false; }
      const ctx = scr.ctx, W = scr.W, H = scr.H, cx = Math.round(W / 2), list = this.friends(), per = 8, pages = Math.max(1, Math.ceil(list.length / per));
      if (this.page >= pages) this.page = 0;
      ctx.fillStyle = '#0d0b13'; ctx.fillRect(0, 0, W, H);
      drawText(ctx, 'INVITE A FRIEND', cx, 8, '#fff', 3, 'center', '#000');
      drawText(ctx, 'YOUR CODE: ' + code, cx, 30, '#ffd23f', 2, 'center', '#000');
      if (!list.length) {
        drawText(ctx, 'NO FRIENDS YET.', cx, 90, '#9a92b8', 2, 'center', '#000');
        drawText(ctx, 'ADD FRIENDS IN THE ARCADE: THE FRIENDS BUTTON, TOP RIGHT.', cx, 112, '#9a92b8', 1, 'center', '#000');
      }
      list.slice(this.page * per, this.page * per + per).forEach((f, i) => {
        const x = cx - 154 + (i % 2) * 158, y = 50 + Math.floor(i / 2) * 28, st = this.sent[f.id];
        if (UI.button('inv' + f.id, x, y, 150, 24, st === 'ok' ? f.name + ': INVITED' : st === 'wait' ? 'SENDING...' : f.name, { size: st ? 1 : 2, theme: 'dark', accent: '#ff7ab8', on: st === 'ok', disabled: !!st })) this.send(f, code);
      });
      drawText(ctx, this.msg || (list.length ? 'TAP A FRIEND TO INVITE THEM TO THIS GAME.' : ''), cx, 168, this.msg ? this.col : '#efe9ff', 1, 'center', '#000');
      if (list.length) drawText(ctx, 'THEY SEE IT IF THEIR ARCADE (THE LIST OF GAMES) IS OPEN. IT WAITS 10 MINUTES.', cx, 180, '#5b5275', 1, 'center', '#000');
      if (pages > 1 && UI.button('invmore', cx + 56, H - 30, 90, 20, 'MORE ' + (this.page + 1) + '/' + pages, { size: 1, theme: 'dark' })) this.page = (this.page + 1) % pages;
      if (UI.button('invback', cx - 50, H - 30, 100, 20, 'BACK', { theme: 'dark' }) || UI.back) this.on = false;
      return true;
    },
    // ?join=CODE in the page's address (taken out of the address, so a reload doesn't join again)
    joinCode() {
      try {
        const u = new URL(location.href), c = (u.searchParams.get('join') || '').toUpperCase();
        if (!u.searchParams.has('join')) return '';
        u.searchParams.delete('join'); history.replaceState(null, '', u.pathname + u.search + u.hash);
        return c.length === 4 && [...c].every(ch => CODE_CHARS.includes(ch)) ? c : '';
      } catch (e) { return ''; }
    },
    auto(join) { const c = this.joinCode(); if (c) join(c); },
  };

  // --- ONLINE / OFFLINE: your friends see when you are playing --------------------------------------------------
  // While the arcade or a game is open and on the screen, it says "I'm online" (and which game) on ntfy.sh, on a topic
  // of your ID, every 4 minutes, and "I'm offline" when you close it or switch away (sendBeacon, so it still goes
  // out while the page closes). The FRIENDS menu reads your friends' topics, all in one request, and a friend is
  // ONLINE if their newest message (by its time t) says so and is less than 5 minutes old. Only a player who has
  // friends says anything at all. What goes through ntfy.sh: your ID, online or not, and the game.
  const Presence = {
    EVERY: 4 * 60e3, FRESH: 5 * 60e3,
    topic: id => 'pixel-arcade-on-' + id,
    on: false, last: 0,
    game() { const g = (location.pathname.split('/').pop() || '').replace(/\.html$/, ''); return g === 'index' || g === 'pad' ? '' : g; },
    send(on) {
      const p = Profile.load(); if (!/^[1-9][0-9]{5}$/.test(p.id) || !Invite.friends().length) return;
      const url = 'https://ntfy.sh/' + this.topic(p.id), body = JSON.stringify({ v: 1, on: on ? 1 : 0, g: this.game(), t: Date.now() });
      if (!on) { this.on = false; try { if (navigator.sendBeacon && navigator.sendBeacon(url, body)) return; } catch (e) { /* no beacon */ } }
      else { this.on = true; this.last = Date.now(); }
      fetch(url, { method: 'POST', body, keepalive: true }).catch(() => { /* offline: next time */ });
    },
    tick() { if (document.visibilityState === 'visible' && (!this.on || Date.now() - this.last > this.EVERY)) this.send(true); },
    off() { if (this.on) this.send(false); },
    start() {
      if (!location.protocol.startsWith('http')) return;
      setTimeout(() => this.tick(), 1500); setInterval(() => this.tick(), 15000);
      document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') this.off(); else this.tick(); });
      window.addEventListener('pagehide', () => this.off());
    },
  };
  Presence.start();

  // --- NOTIFICATIONS: a gift, a friend request, an invite or a chat message shows on the phone, arcade open or not ---
  // Turned on in SETTINGS (it needs an account: the server keeps this phone's push subscription with your ID). When
  // the arcade sends a friend something through ntfy.sh, Push.tell() also asks the server to notify that friend; the
  // server writes the words itself (who, and what kind of message, never what a chat message says). The service
  // worker (sw.js) shows the notification, and a tap opens the arcade (or the game, for an invite).
  // On an iPhone it only works in the app installed from Safari (Share, Add to Home Screen), iOS 16.4 or newer.
  const Push = {
    KEY: 'pixelArcade.push',
    read() { try { const d = JSON.parse(localStorage.getItem(this.KEY)); return d && typeof d === 'object' ? d : {}; } catch (e) { return {}; } },
    write(d) { try { localStorage.setItem(this.KEY, JSON.stringify(d)); } catch (e) { /* private mode */ } },
    supported() { return location.protocol.startsWith('http') && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window; },
    ios() { return /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1); },
    installed() { return (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true; },
    // what SETTINGS shows: 'on', 'off', 'denied' (blocked in the browser), 'install' (iPhone: add to home screen first), 'no' (this browser can't)
    state() {
      if (!this.supported()) return this.ios() && !this.installed() ? 'install' : 'no';
      if (Notification.permission === 'denied') return 'denied';
      return this.read().on && Notification.permission === 'granted' ? 'on' : 'off';
    },
    async sub(make) {
      const reg = await Promise.race([navigator.serviceWorker.ready, new Promise((_, no) => setTimeout(() => no(new Error('no service worker')), 8000))]);
      let s = await reg.pushManager.getSubscription();
      if (!s && make) {
        const k = await Api.call('GET', '/v1/push/key');
        if (!k.ok || !k.data || !k.data.key) throw new Error('NO_SERVER');
        const raw = atob(k.data.key.replace(/-/g, '+').replace(/_/g, '/')), key = Uint8Array.from(raw, ch => ch.charCodeAt(0));
        s = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: key });
      }
      return s;
    },
    // Turn on (from a tap: the browser asks for permission). '' when it worked, otherwise what went wrong.
    async enable() {
      const me = Api.session();
      if (!me) return 'ACCOUNT';
      if (!this.supported()) return 'NO';
      try {
        const perm = await Notification.requestPermission();
        if (perm !== 'granted') return perm === 'denied' ? 'DENIED' : 'ASK';
        const s = await this.sub(true), r = await Api.call('POST', '/v1/push/sub', s.toJSON(), me.tok);
        if (r.status === 401) { Api.onAuthLost(); return 'ACCOUNT'; }
        if (!r.ok) return 'NET';
        this.write({ on: true, id: me.id, ep: s.endpoint, at: Date.now() });
        return '';
      } catch (e) { return e && e.message === 'NO_SERVER' ? 'NET' : 'FAIL'; }
    },
    // Turn off: this phone forgets the subscription and the server too.
    async disable() {
      const d = this.read(); this.write({ on: false });
      try {
        const s = await this.sub(false), ep = (s && s.endpoint) || d.ep;
        if (ep) await Api.call('DELETE', '/v1/push/sub', { endpoint: ep });
        if (s) await s.unsubscribe();
      } catch (e) { /* gone already */ }
    },
    // Log out: the server forgets this phone (so the next player on it doesn't get your notifications), but it stays
    // on for this phone: logging in again (as anybody) sends the subscription again.
    async forget() {
      const d = this.read(); if (!d.on || !d.ep) return;
      this.write({ ...d, id: '' });
      await Promise.race([Api.call('DELETE', '/v1/push/sub', { endpoint: d.ep }), new Promise(ok => setTimeout(ok, 2000))]);
    },
    // When the arcade opens: if notifications are on, tell the server this phone's subscription again when the
    // account changed, the browser gave it a new one, or once a day (in case the server lost it).
    async sync() {
      const d = this.read(), me = Api.session();
      if (!d.on || !me || !this.supported() || Notification.permission !== 'granted') return;
      try {
        const s = await this.sub(true);
        if (d.id === me.id && d.ep === s.endpoint && Date.now() - (d.at || 0) < 864e5) return;
        const r = await Api.call('POST', '/v1/push/sub', s.toJSON(), me.tok);
        if (r.ok) this.write({ on: true, id: me.id, ep: s.endpoint, at: Date.now() });
      } catch (e) { /* next time */ }
    },
    // SEND A TEST: a notification to your own phones. How many phones got it, or null.
    async test() {
      const me = Api.session(); if (!me) return null;
      const r = await Api.call('POST', '/v1/push/test', undefined, me.tok);
      return r.ok && r.data ? r.data.sent : null;
    },
    // Tell several players' phones at once (a group: gchat, gadd), in one request. Never throws.
    tellMany(to, t, extra = {}) {
      try {
        const ids = to.filter(id => /^[1-9][0-9]{5}$/.test(id)).slice(0, 8);
        if (!ids.length || navigator.onLine === false) return;
        const p = Profile.load(), me = Api.session();
        Api.call('POST', '/v1/push/send', { to: ids, t, from: p.name, fid: p.id, ...extra }, me && me.id === p.id ? me.tok : undefined);
      } catch (e) { /* a notification must never break sending */ }
    },
    // Tell a player's phones that you just sent them something. t: gift, back, freq, fyes, inv, chat. Never throws.
    tell(to, t, extra = {}) {
      try {
        if (!/^[1-9][0-9]{5}$/.test(to) || navigator.onLine === false) return;
        const p = Profile.load(), me = Api.session();
        Api.call('POST', '/v1/push/send', { to, t, from: p.name, fid: p.id, ...extra }, me && me.id === p.id ? me.tok : undefined);
      } catch (e) { /* a notification must never break sending */ }
    },
  };
  if (location.protocol.startsWith('http')) window.addEventListener('load', () => setTimeout(() => Push.sync(), 2000));

  // --- VOICE CHAT: talk to a friend while you play an online game together ----------------------------------------
  // A game with a friend online (CREATE GAME / JOIN WITH A CODE) gets a TALK button on the left side of the screen,
  // when the other player is on your FRIENDS list (and you are on theirs) and VOICE CHAT is on in SETTINGS on both
  // phones. TALK asks the friend; the first time, they see "NAME WANTS TO TALK" with ALLOW and NO (ALLOW is
  // remembered for that friend). Then the voice goes straight between the two phones over the game's own PeerJS link
  // (WebRTC), never through a server, and is never recorded. Your mic is OFF until you tap the mic button, and the
  // mic button turns it off again; X hangs up. While the friend talks the speaker lights up and the game's sounds go
  // quieter. The game calls three things, next to PX.Bet:
  //   PX.Voice.connect(conn)   the data link to the friend is open (a PeerJS DataConnection)
  //   PX.Voice.onData(m)       first thing for every message; true if it was a voice message
  //   PX.Voice.reset()         leaving online play
  // Messages are { t: 'vc', k: 'hi' (my ID) | 'st' (you are my friend and my voice chat is on: ok) | 'ask' | 'yes' | 'no' | 'end' (hang up) | 'gone' (left the game) }.
  const Voice = {
    KEY: 'pixelArcade.voice', TIMEOUT: 30e3,
    conn: null, peer: null, friend: null, theirOn: false, phase: 'off', asked: false, pending: null, call: null,
    mic: null, micOn: false, silent: null, remote: null, audio: null, meter: null, timer: 0, askT: 0, note: '', noteT: 0,
    talk: { me: 0, them: 0 }, peers: new WeakSet(), el: null, box: null, ask: null, hits: [], askHits: [],
    read() { try { const d = JSON.parse(localStorage.getItem(this.KEY)); return d && typeof d === 'object' ? d : {}; } catch (e) { return {}; } },
    allowed(id) { const d = this.read(); return !!(d.ok && d.ok[id]); },
    allow(id) { const d = this.read(); d.ok = { ...(d.ok || {}), [id]: 1 }; try { localStorage.setItem(this.KEY, JSON.stringify(d)); } catch (e) { /* private mode */ } },
    enabled() { return Settings.load().voice && !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia) && !!window.RTCPeerConnection; },
    send(m) { const c = this.conn; if (c && c.open) try { c.send({ t: 'vc', ...m }); } catch (e) { /* closing */ } },

    connect(conn) {
      const keep = this.micP; this.micP = null;                    // (a mic CALL just asked for stays)
      this.reset();
      this.micP = keep;
      if (!conn) return;
      this.conn = conn; this.peer = conn.provider || null;
      if (this.peer && !this.peers.has(this.peer)) {
        this.peers.add(this.peer);
        this.peer.on('call', call => this.incoming(call));
      }
      conn.on('close', () => { if (this.conn === conn) this.reset(); });
      this.send({ k: 'hi', id: Profile.load().id });
    },
    onData(m) {
      if (!m || m.t !== 'vc') return false;
      switch (m.k) {
        case 'hi':
          if (!m.re) this.send({ k: 'hi', re: 1, id: Profile.load().id });   // (in case mine got lost)
          if (this.phase === 'live' || this.phase === 'asking' || this.phase === 'asked') break;
          this.friend = Invite.friends().find(f => f.id === String(m.id)) || null;
          this.send({ k: 'st', ok: this.friend && this.enabled() ? 1 : 0 });          // can they talk to me?
          this.ready();
          break;
        case 'st':                                                          // can I talk to them? (I'm their friend too, voice on)
          this.theirOn = !!m.ok; this.ready();
          if (this.direct && this.autoAsk && !m.ok) { this.autoAsk = false; Call.tell((this.friend ? this.friend.name : 'YOUR FRIEND') + " CAN'T TALK: VOICE CHAT IS OFF THERE"); this.closeDirect(0); }
          break;
        case 'busy': Call.tell((this.friend ? this.friend.name : 'YOUR FRIEND') + ' IS IN ANOTHER CALL'); this.closeDirect(0); break;
        case 'ask':
          if (!this.friend || !this.enabled() || this.shellCall()) { this.send({ k: 'no' }); break; }
          if (this.phase === 'asking') { this.agree(); break; }                     // we both pressed TALK
          if (this.phase !== 'idle') break;
          if (this.allowed(this.friend.id) && !this.direct) { this.agree(); break; }   // (a call from the arcade always rings)
          this.phase = 'asked'; this.askT = Date.now();
          Sound.tone([660, 880, 660, 880], 0.5, { vol: 0.08 });
          break;
        case 'yes': if (this.phase === 'asking') { this.agree(); this.say(this.friend.name + ' IS HERE! TALK!'); } break;
        case 'no': if (this.phase === 'asking' || this.phase === 'live') { this.hangup(false); this.say(this.friend.name + ' SAID NO'); } break;
        case 'gone': this.hangup(false); this.phase = 'off'; break;
        case 'end': if (this.phase !== 'off' && this.phase !== 'idle') { const was = this.phase; this.hangup(false); if (was === 'live') this.say(this.friend.name + ' HUNG UP'); } break;
      }
      this.draw();
      return true;
    },
    // a game in the arcade's frame while the arcade has a call: that call is the voice, so no TALK in the game
    shellCall() { try { const v = ARCADE_SHELL && window.parent.PX.Voice; return !!(v && v.direct && v.phase !== 'off'); } catch (e) { return false; } },
    ready() {
      if (this.phase === 'off' || this.phase === 'idle') this.phase = this.friend && this.theirOn && this.enabled() && !this.shellCall() ? 'idle' : 'off';
      if (this.phase === 'idle' && this.autoAsk) { this.autoAsk = false; this.press(); }   // CALL in the arcade's chat: ask right away
    },
    reset() {
      this.send({ k: 'gone' });                                    // I'm leaving the game: my friend's TALK goes away now
      this.hangup(false);
      Object.assign(this, { conn: null, peer: null, friend: null, theirOn: false, phase: 'off', note: '', direct: false, autoAsk: false });
      this.draw();
    },

    // --- the call -------------------------------------------------------------------------------------------------
    press() {                                                       // TALK
      if (this.phase !== 'idle') return;
      this.bless();
      this.phase = 'asking'; this.askT = Date.now(); this.wantMic = true;
      this.send({ k: 'ask' });
      this.setMic(true);                                            // ask for the mic now, while it's a tap; it goes on with the call
      Sound.tone([523, 659], 0.15, { vol: 0.08 });
    },
    answer(yes) {                                                   // ALLOW / NO
      if (this.phase !== 'asked') return;
      this.bless();
      if (yes) { if (!this.direct) this.allow(this.friend.id); this.agree(); this.say('TAP THE MIC TO TALK'); }
      else { this.send({ k: 'no' }); this.phase = 'idle'; this.closeDirect(); }
      this.draw();
    },
    // both said yes: the phone with the smaller PeerJS id makes the WebRTC call, the other one picks it up
    agree() {
      if (this.phase !== 'asking' && this.phase !== 'asked' && this.phase !== 'idle') return;
      const was = this.phase;
      this.phase = 'live';
      if (was !== 'asking') this.send({ k: 'yes' });
      const me = this.peer && this.peer.id, them = this.conn && this.conn.peer;
      if (this.pending) { const c = this.pending; this.pending = null; this.pickUp(c); }
      else if (me && them && me < them) {
        try { this.use(this.peer.call(them, this.outStream(), { metadata: { vc: 1 } })); } catch (e) { this.fail(); }
      }
      if (this.wantMic) { this.wantMic = false; this.setMic(true); }
      this.watch();
      Sound.tone([659, 880], 0.18, { vol: 0.08 });
    },
    incoming(call) {
      if (!this.conn || call.peer !== this.conn.peer || !this.friend) { try { call.close(); } catch (e) { /* gone */ } return; }
      if (this.phase === 'live' && !this.call) this.pickUp(call);
      else if (this.phase === 'asking' || this.phase === 'asked') this.pending = call;   // the "yes" is still on its way
      else try { call.close(); } catch (e) { /* gone */ }
    },
    pickUp(call) { try { call.answer(this.outStream()); this.use(call); } catch (e) { this.fail(); } },
    use(call) {
      this.call = call;
      call.on('stream', st => { if (this.call === call) this.hear(st); });
      call.on('close', () => { if (this.call === call && this.phase === 'live') { this.hangup(false); this.say('VOICE LOST'); } });
      call.on('error', () => { if (this.call === call) this.fail(); });
      // the mic may have been turned on before the call existed: put it on the line
      if (this.mic) this.line(this.mic.getAudioTracks()[0]);
    },
    fail() { this.hangup(false); this.say("COULDN'T CONNECT THE VOICE"); },
    hangup(tell = true) {
      if (tell && this.phase !== 'idle' && this.phase !== 'off') this.send({ k: this.phase === 'asked' ? 'no' : 'end' });
      const call = this.call, pending = this.pending;
      this.call = null; this.pending = null;                       // (first, so closing it isn't taken for VOICE LOST)
      try { if (call) call.close(); } catch (e) { /* gone */ }
      try { if (pending) pending.close(); } catch (e) { /* gone */ }
      if (this.mic) this.mic.getTracks().forEach(t => t.stop());
      this.dropMic();
      if (this.audio) { try { this.audio.pause(); } catch (e) { /* fine */ } this.audio.srcObject = null; }
      clearInterval(this.timer);
      Object.assign(this, { call: null, pending: null, mic: null, micP: null, micOn: false, remote: null, meter: null, timer: 0, wantMic: false, talk: { me: 0, them: 0 } });
      if (this.phase !== 'off') this.phase = this.friend ? 'idle' : 'off';
      this.duck(1);
      this.draw();
      this.closeDirect();
    },
    // a call from the arcade (PX.Call) has no game around it: when it is over, the link goes too
    closeDirect(delay = 3500) {                                  // (after a moment, so a note like SAID NO can be read)
      if (!this.direct || !this.conn) return;
      const c = this.conn;
      setTimeout(() => { if (this.conn === c && (this.phase === 'idle' || this.phase === 'off')) { this.reset(); try { c.close(); } catch (e) { /* gone */ } } }, delay);
    },
    // the mic was asked for (CALL asks right away) but never used: let it go, so the phone doesn't show it as on
    dropMic() {
      const p = this.micP; if (!p || this.mic) return;
      p.then(st => { if (st !== this.mic) st.getTracks().forEach(t => t.stop()); }, () => { /* never got it */ });
    },
    askMic() {
      if (this.mic || this.micP || !navigator.mediaDevices) return;
      this.micP = navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }, video: false });
      this.micP.catch(() => { /* setMic says what went wrong */ });
    },
    // what we send before the mic is on: silence (a call needs a sound to send)
    outStream() {
      if (this.mic) return this.mic;
      Sound.unlock();
      if (!this.silent && Sound.ctx) { try { const d = Sound.ctx.createMediaStreamDestination(); this.silent = d.stream; } catch (e) { /* old browser */ } }
      return this.silent || new MediaStream();
    },
    line(track) {                                                  // put a track on the call
      const pc = this.call && this.call.peerConnection; if (!pc || !track) return;
      const s = pc.getSenders().find(x => !x.track || x.track.kind === 'audio');
      if (s) s.replaceTrack(track).catch(() => { /* the call is ending */ });
    },
    async setMic(on) {
      if (this.phase !== 'live' && this.phase !== 'asking') return;
      if (on && !this.mic) {
        let st;
        try {
          const ask = this.micP || (this.micP = navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }, video: false }));
          st = await ask;
        } catch (e) { this.micP = null; this.say(e && e.name === 'NotAllowedError' ? 'THE MIC IS BLOCKED. YOU CAN STILL LISTEN.' : 'NO MIC FOUND. YOU CAN STILL LISTEN.'); return; }
        if (this.phase !== 'live' && this.phase !== 'asking') { if (!this.mic) st.getTracks().forEach(t => t.stop()); return; }
        if (!this.mic) {                                            // (two taps share one request)
          this.mic = st;
          Sound.unlock();                                          // a phone may pause the game's sound when the mic starts
          this.line(st.getAudioTracks()[0]);
          this.meter = { ...(this.meter || {}), me: this.analyse(st) };
        }
      }
      if (this.phase === 'asking') { if (this.mic) this.mic.getAudioTracks().forEach(t => { t.enabled = false; }); return; }   // on when the friend says yes
      this.micOn = !!(on && this.mic);
      if (this.mic) this.mic.getAudioTracks().forEach(t => { t.enabled = this.micOn; });
      this.draw();
    },
    hear(st) {
      if (this.remote === st) return;
      this.remote = st;
      if (!this.audio) this.bless();
      const a = this.audio;
      a.srcObject = st; const p = a.play(); if (p && p.catch) p.catch(() => this.say('TAP THE SCREEN TO HEAR YOUR FRIEND'));
      this.meter = { ...(this.meter || {}), them: this.analyse(st) };
    },
    // an <audio> element started from a tap, so the phone lets it play the friend's voice later
    bless() {
      if (!this.audio) {
        const a = document.createElement('audio');
        a.autoplay = true; a.setAttribute('playsinline', ''); a.style.display = 'none';
        document.body.appendChild(a); this.audio = a;
      }
      if (this.audio.paused) { const p = this.audio.play(); if (p && p.catch) p.catch(() => { /* nothing to play yet */ }); }
      Sound.unlock();
    },
    analyse(st) {
      try {
        Sound.unlock(); const c = Sound.ctx; if (!c) return null;
        const src = c.createMediaStreamSource(st), an = c.createAnalyser(); an.fftSize = 512;
        src.connect(an);                                           // not to the speakers: the <audio> plays it
        return { an, buf: new Float32Array(an.fftSize) };
      } catch (e) { return null; }
    },
    level(m) { if (!m) return 0; m.an.getFloatTimeDomainData(m.buf); let s = 0; for (const v of m.buf) s += v * v; return Math.sqrt(s / m.buf.length); },
    watch() {
      clearInterval(this.timer);
      this.timer = setInterval(() => {
        const m = this.meter || {}, was = this.talk.me + ':' + this.talk.them;
        this.talk.me = this.micOn && this.level(m.me) > 0.02 ? Date.now() : (Date.now() - this.talk.me < 300 ? this.talk.me : 0);
        this.talk.them = this.level(m.them) > 0.02 ? Date.now() : (Date.now() - this.talk.them < 400 ? this.talk.them : 0);
        this.duck(this.talk.them ? 0.35 : 1);                      // the game goes quieter while the friend talks
        if (was !== this.talk.me + ':' + this.talk.them) this.draw();
      }, 80);
    },
    duck(k) {                                                       // (and the game in the arcade's frame, during a call)
      Sound.setDuck(k);
      try { const f = window.ArcadeShell && window.ArcadeShell.frame; if (f && f.contentWindow.PX) f.contentWindow.PX.Sound.setDuck(k); } catch (e) { /* loading */ }
    },
    say(text) { if (this.direct && text) Call.tell(text); this.note = text; this.noteT = Date.now(); this.draw(); clearTimeout(this.noteTimer); this.noteTimer = setTimeout(() => { if (Date.now() - this.noteT >= 3400) { this.note = ''; this.draw(); } }, 3500); },
    tick() {                                                        // nobody answered in time
      if (this.direct && (this.phase === 'asked' || this.phase === 'asking') && (Date.now() - this.askT) % 2000 < 1000) {   // ring, ring
        if (this.phase === 'asked') Sound.tone([660, 880, 660, 880], 0.5, { vol: 0.08 }); else Sound.tone(440, 0.3, { vol: 0.04 });
      }
      if ((this.phase === 'asking' || this.phase === 'asked') && Date.now() - this.askT > this.TIMEOUT) {
        const asking = this.phase === 'asking'; this.hangup(true); this.say(asking ? 'NO ANSWER' : '');
      }
    },

    // --- on the screen: a small pixel bar on the left side, and the question at the top --------------------------
    ICONS: {
      mic: ['..###..', '.##.##.', '.##.##.', '.##.##.', '#.###.#', '#.....#', '.#...#.', '..###..', '...#...', '.#####.'],
      spk: ['....#....', '...##..#.', '####.#..#', '####..#.#', '####.#..#', '...##..#.', '....#....'],
      x: ['#...#', '.#.#.', '..#..', '.#.#.', '#...#'],
    },
    scale() { return Math.max(1.5, Math.min(4, Math.round(Math.min(innerHeight, innerWidth * 0.6) / 240 * 2) / 2)); },
    mount() {
      if (this.el || !document.body) return;
      const mk = (css) => {
        const c = document.createElement('canvas');
        c.style.cssText = 'position:fixed;z-index:60;image-rendering:pixelated;image-rendering:crisp-edges;touch-action:none;display:none;' + css;
        const stop = e => e.stopPropagation();
        ['pointerdown', 'pointerup', 'pointermove', 'mousedown', 'mouseup', 'touchstart', 'touchend', 'click', 'contextmenu'].forEach(t => c.addEventListener(t, stop));
        document.body.appendChild(c); return c;
      };
      this.el = mk('left:calc(4px + env(safe-area-inset-left));top:30%;');
      this.ask = mk('left:50%;top:calc(6px + env(safe-area-inset-top));transform:translateX(-50%);');
      const tap = (c, list) => c.addEventListener('pointerup', e => {
        const r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width * c.width, y = (e.clientY - r.top) / r.height * c.height;
        const h = list().find(b => x >= b.x && x < b.x + b.w && y >= b.y && y < b.y + b.h);
        if (h) { e.preventDefault(); h.go(); }
      });
      tap(this.el, () => this.hits); tap(this.ask, () => this.askHits);
      addEventListener('resize', () => this.draw());
      setInterval(() => this.tick(), 1000);
    },
    btn(ctx, list, x, y, w, h, fill, go) {
      const box = (bx, by, bw, bh, col) => { ctx.fillStyle = col; ctx.fillRect(bx + 1, by, bw - 2, bh); ctx.fillRect(bx, by + 1, bw, bh - 2); };
      box(x, y, w, h, '#0b0912'); box(x + 1, y + 1, w - 2, h - 2, fill);
      ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillRect(x + 2, y + 1, w - 4, 1);
      ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect(x + 1, y + h - 3, w - 2, 1);
      list.push({ x, y, w, h, go });
    },
    paint(c, w, h) {
      const k = this.scale();
      if (c.width !== w || c.height !== h) { c.width = w; c.height = h; }
      c.style.width = (w * k) + 'px'; c.style.height = (h * k) + 'px'; c.style.display = 'block';
      const ctx = c.getContext('2d'); ctx.imageSmoothingEnabled = false; ctx.clearRect(0, 0, w, h);
      return ctx;
    },
    draw() {
      this.mount(); if (!this.el) return;
      const show = this.phase !== 'off' && !!this.friend, name = this.friend ? this.friend.name : '';
      this.hits = []; this.askHits = [];
      // the question: NAME WANTS TO TALK
      if (this.phase === 'asked') {
        const line = name + (this.direct ? ' IS CALLING YOU!' : ' WANTS TO TALK!'), w = Math.max(116, textWidth(line) + 16), ctx = this.paint(this.ask, w, 40);
        ctx.fillStyle = '#0b0912'; ctx.fillRect(0, 0, w, 40); ctx.fillStyle = '#272043'; ctx.fillRect(1, 1, w - 2, 38);
        ctx.fillStyle = '#5ad43f'; ctx.fillRect(1, 1, w - 2, 1);
        drawText(ctx, line, w / 2, 5, '#fff', 1, 'center');
        drawText(ctx, 'VOICE CHAT', w / 2, 12, '#9a92b8', 1, 'center');
        const bw = 48, gx = Math.round(w / 2 - bw - 3);
        this.btn(ctx, this.askHits, gx, 21, bw, 15, '#2f9a3a', () => this.answer(true)); drawText(ctx, this.direct ? 'ANSWER' : 'ALLOW', gx + bw / 2, 26, '#fff', 1, 'center');
        this.btn(ctx, this.askHits, gx + bw + 6, 21, bw, 15, '#9a2f3a', () => this.answer(false)); drawText(ctx, 'NO', gx + bw * 1.5 + 6, 26, '#fff', 1, 'center');
      } else this.ask.style.display = 'none';
      if (!show) { this.el.style.display = 'none'; return; }
      const note = this.note, noteW = note ? textWidth(note) + 8 : 0;
      if (this.direct && this.phase !== 'live' && this.phase !== 'asking') {   // a call from the arcade: no TALK button, only what happened
        if (!note) { this.el.style.display = 'none'; return; }
        this.noteLine(this.paint(this.el, noteW, 8), note, 0); return;
      }
      if (this.phase === 'live') {
        const nw = Math.max(textWidth(name), 18), w = Math.max(20 + 4 + 14 + nw + 4 + 14, noteW), h = note ? 30 : 22, ctx = this.paint(this.el, w, h);
        // the mic: green and on, or grey with a red line through it
        this.btn(ctx, this.hits, 0, 0, 20, 20, this.micOn ? (this.talk.me ? '#5ad43f' : '#2f9a3a') : '#3a3450', () => this.setMic(!this.micOn));
        drawIcon(ctx, this.ICONS.mic, { '#': this.micOn ? '#fff' : '#9a92b8' }, 10, 10, 1, null);
        if (!this.micOn) { ctx.fillStyle = '#ff4a4a'; for (let i = 0; i < 12; i++) ctx.fillRect(4 + i, 4 + i, 2, 1); }
        // the friend: the speaker lights up while they talk
        const sx = 24; ctx.fillStyle = 'rgba(11,9,18,0.8)'; ctx.fillRect(sx, 2, 14 + nw + 2, 16);
        drawIcon(ctx, this.ICONS.spk, { '#': this.talk.them ? '#ffd23f' : '#5b5275' }, sx + 7, 10, 1, null);
        drawText(ctx, name, sx + 14, 8, this.talk.them ? '#ffd23f' : '#efe9ff', 1);
        const xx = sx + 14 + nw + 4;
        this.btn(ctx, this.hits, xx, 3, 14, 14, '#9a2f3a', () => { this.hangup(true); Sound.tone(330, 0.12, { vol: 0.08 }); });
        drawIcon(ctx, this.ICONS.x, { '#': '#fff' }, xx + 7, 10, 1, null);
        if (note) this.noteLine(ctx, note, 22);
      } else {
        const label = this.phase === 'asking' ? 'CALLING ' + name + '...' : 'TALK', lw = textWidth(label), w = Math.max(lw + 26 + (this.phase === 'asking' ? 18 : 0), noteW), h = note ? 30 : 22;
        const ctx = this.paint(this.el, w, h);
        if (this.phase === 'asking') {
          ctx.fillStyle = 'rgba(11,9,18,0.8)'; ctx.fillRect(0, 2, lw + 24, 16);
          drawIcon(ctx, this.ICONS.mic, { '#': (Date.now() / 400 | 0) % 2 ? '#ffd23f' : '#9a92b8' }, 10, 10, 1, null);
          drawText(ctx, label, 20, 8, '#efe9ff', 1);
          this.btn(ctx, this.hits, lw + 26, 3, 14, 14, '#9a2f3a', () => this.hangup(true));
          drawIcon(ctx, this.ICONS.x, { '#': '#fff' }, lw + 33, 10, 1, null);
          clearTimeout(this.blink); this.blink = setTimeout(() => this.draw(), 400);
        } else {
          this.btn(ctx, this.hits, 0, 0, lw + 24, 20, '#2a4f9a', () => this.press());
          drawIcon(ctx, this.ICONS.mic, { '#': '#fff' }, 10, 10, 1, null);
          drawText(ctx, label, 19, 8, '#fff', 1);
        }
        if (note) this.noteLine(ctx, note, 22);
      }
    },
    noteLine(ctx, note, y) { const w = textWidth(note) + 8; ctx.fillStyle = 'rgba(11,9,18,0.85)'; ctx.fillRect(0, y, w, 8); drawText(ctx, note, 4, y + 1, '#ffd23f', 1); },
  };

  // --- CALL A FRIEND FROM THE ARCADE: voice without a game (CALL in a friend's chat) --------------------------------
  // While the arcade is open (VOICE CHAT on, and you have friends) it waits for calls on its own PeerJS address,
  // pixelarcade-vc-<your ID>. CALL in a friend's chat connects to their arcade's address and hands the link to PX.Voice,
  // which does the rest as in a game, except that a call from the arcade always rings (NAME IS CALLING YOU! with
  // ANSWER and NO) and the link closes when the call is over. The voice bar stays on the screen while you look around
  // the arcade; opening a game (a new page) ends the call.
  // Data on the link: PX.Voice's messages, and { t: 'vc', k: 'busy' } from an arcade that is already in a call.
  const Call = {
    PREFIX: 'pixelarcade-vc-', peer: null, starting: null, msg: '', msgAt: 0, hooked: false, lostAt: 0, claimAt: 0,
    tell(text) { this.msg = text; this.msgAt = Date.now(); },
    note() { return Date.now() - this.msgAt < 6000 ? this.msg : ''; },
    // listen for calls (the arcade calls this every now and then; it does nothing when it already listens)
    // A phone that sleeps loses the link to the PeerJS server: it reconnects, and when that doesn't work in a few
    // seconds it starts over. When the server still had my address (a moment after a reload or a sleep) I listen on a
    // random one meanwhile and keep asking for mine every 20 seconds, so calls find me again.
    mine() { return this.PREFIX + Profile.load().id; },
    ready() { const p = this.peer; return !!(p && !p.destroyed && !p.disconnected && p.id === this.mine()); },   // friends can call me
    start() {
      if (this.starting) return this.starting;
      const id = Profile.load().id, now = Date.now();
      if (!Voice.enabled() || !/^[1-9][0-9]{5}$/.test(id) || !Invite.friends().length || navigator.onLine === false) return Promise.resolve(null);
      if (!this.hooked) {
        this.hooked = true;
        addEventListener('pagehide', () => { if (Voice.direct) Voice.reset(); try { if (this.peer) this.peer.destroy(); } catch (e) { /* gone */ } this.peer = null; });
        document.addEventListener('visibilitychange', () => { if (!document.hidden) this.start(); });   // back from sleep: listen again now
      }
      let p = this.peer;
      if (p && p.destroyed) p = this.peer = null;
      if (p && p.disconnected) {
        if (!this.lostAt) this.lostAt = now;
        if (now - this.lostAt < 8000) { try { p.reconnect(); } catch (e) { /* not now */ } return Promise.resolve(null); }
        if (!(Voice.conn && Voice.peer === p)) { try { p.destroy(); } catch (e) { /* gone */ } p = this.peer = null; }
      } else this.lostAt = 0;
      if (p && p.id !== this.mine() && now - this.claimAt > 20000 && !Voice.conn) {   // on a random address: try for mine again
        this.claimAt = now;
        this.starting = this.open(this.mine(), false).then(q => { if (q) { const old = this.peer; this.peer = q; if (old && old !== q) try { old.destroy(); } catch (e) { /* gone */ } } return this.peer; }).finally(() => { this.starting = null; });
        return this.starting;
      }
      if (p) return Promise.resolve(p);
      this.claimAt = now;
      this.starting = loadPeer().then(() => this.open(this.mine(), true)).catch(() => null).finally(() => { this.starting = null; });
      return this.starting;
    },
    // a peer on my address (or, when another tab of mine has it, on a random one: calls out still work)
    open(pid, fallback) {
      return new Promise(res => {
        let p, done = false;
        try { p = pid ? new Peer(pid, { debug: 0, config: { iceServers: ICE_SERVERS } }) : new Peer({ debug: 0, config: { iceServers: ICE_SERVERS } }); } catch (e) { res(null); return; }
        const end = v => { if (done) return; done = true; clearTimeout(tm); if (!v) try { p.destroy(); } catch (e) { /* gone */ } res(v); };
        const tm = setTimeout(() => end(null), 15000);
        p.on('open', () => { if (fallback !== false) this.peer = p; this.lostAt = 0; end(p); });
        p.on('connection', c => this.inbound(c));
        p.on('error', e => {
          const type = e && e.type;
          if (!done) { if (pid && type === 'unavailable-id' && fallback) { done = true; clearTimeout(tm); try { p.destroy(); } catch (x) { /* gone */ } this.open(null).then(res); } else end(null); return; }
          if (type === 'peer-unavailable' && this.dialRes) this.dialRes('away');
        });
        p.on('disconnected', () => { if (this.peer === p) { this.lostAt = this.lostAt || Date.now(); try { p.reconnect(); } catch (e) { /* gone */ } } });
        p.on('close', () => { if (this.peer === p) this.peer = null; });
      });
    },
    wire(c) { c.on('data', m => Voice.onData(m)); },
    inbound(c) {
      if (!c.metadata || c.metadata.vc !== 1) { try { c.close(); } catch (e) { /* gone */ } return; }
      c.on('open', () => {
        if (Voice.conn) { try { c.send({ t: 'vc', k: 'busy' }); } catch (e) { /* gone */ } setTimeout(() => { try { c.close(); } catch (e) { /* gone */ } }, 600); return; }
        this.wire(c); Voice.connect(c); Voice.direct = true;
        setTimeout(() => Voice.closeDirect(0), 45e3);               // a link nobody uses goes away
      });
    },
    // CALL: ring a friend's arcade. When it isn't open, their phone gets a notification and this keeps trying for 45
    // seconds. Resolves 'ok' (it rings now), 'busy' (you are in a call), 'off' (voice chat is off here), 'net' (can't
    // get online), 'away' (their arcade didn't open in time) or 'cancel' (you hung up while waiting)
    async dial(f) {
      if (Voice.conn) return 'busy';
      if (!Voice.enabled()) return 'off';
      Voice.bless();                                                // (a tap: now the phone lets the friend's voice play)
      Voice.askMic();                                               // and asks for the mic now, like a phone does
      let r = await this.ring(f);
      if (r === 'away') {                                           // their arcade isn't open: their phone gets a notification
        Push.tell(f.id, 'call');                                    // (TOM IS CALLING YOU!), and I keep trying until they open it
        this.waiting = f; const until = Date.now() + this.WAIT;
        while (r === 'away' && this.waiting === f && Date.now() < until) {
          Sound.tone(440, 0.3, { vol: 0.04 });                      // (ring, ring, on my side)
          await new Promise(res => setTimeout(res, 3000));
          if (this.waiting !== f) break;
          r = await this.ring(f);
        }
        if (this.waiting !== f) r = 'cancel';
        this.waiting = null;
      }
      if (r !== 'ok' && !Voice.conn) { Voice.dropMic(); Voice.micP = null; }
      return r;
    },
    WAIT: 45e3, waiting: null,                                      // the friend I'm waiting for (their arcade is opening)
    cancel() { if (this.waiting) { this.waiting = null; Sound.tone(330, 0.12, { vol: 0.08 }); } },
    async ring(f) {
      let p = await this.start();
      if (!p || p.destroyed || p.disconnected) { this.lostAt = 1; p = await this.start(); }   // (asleep a moment ago: start over now)
      if (!p || p.destroyed || p.disconnected) return 'net';
      if (Voice.conn) return 'busy';
      return new Promise(res => {
        let c; try { c = p.connect(this.PREFIX + f.id, { reliable: true, metadata: { vc: 1 } }); } catch (e) { res('net'); return; }
        const end = v => { if (this.dialRes !== end) return; this.dialRes = null; clearTimeout(tm); if (v !== 'ok') try { c.close(); } catch (e) { /* gone */ } res(v); };
        this.dialRes = end;
        const tm = setTimeout(() => end('away'), 9000);
        c.on('open', () => {
          if (this.dialRes !== end) return;
          if (Voice.conn) { end('busy'); return; }
          this.wire(c); Voice.connect(c); Voice.friend = f; Voice.direct = true; Voice.autoAsk = true;
          end('ok');
        });
        c.on('error', () => end('away'));
      });
    },
    // the call (or the ringing) with this friend, from the arcade
    with(id) { return !!(Voice.direct && Voice.friend && Voice.friend.id === id && Voice.phase !== 'off'); },
  };

  // --- CHALLENGES: a game played as one round of a PIXEL PARTY tournament ---------------------------------------
  // Pixel Party opens a game in a frame over itself, with ?challenge={"id":"slice","seed":123} in the address. Such a
  // game skips its menus, starts its challenge right away (the same for every player: built from the seed where the
  // game can) and, when it is over, calls PX.Challenge.report(score, 'TEXT'): the score goes to the tournament, which
  // closes the frame. Leaving the game ('< ALL GAMES', or the phone's back button) gives up the round (the tournament
  // is the frame's ArcadeShell, so it closes the frame). A game says what its challenge is in PX.Challenge.GAMES below
  // (Pixel Party reads it): name, how to play, whether a lower score wins, and how long it takes at most.
  const Challenge = (() => {
    let spec = null;
    try {
      const q = new URLSearchParams(location.search).get('challenge');
      if (q && window.parent !== window) { const o = JSON.parse(q); if (o && typeof o.id === 'string') spec = { id: o.id, seed: (o.seed >>> 0) || 1 }; }
    } catch (e) { spec = null; }
    let done = false;
    // the same random numbers for every player of the round: Math.random follows the round's seed
    if (spec) { let r = spec.seed >>> 0; Math.random = () => { r = (r + 0x6D2B79F5) >>> 0; let t = r; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
    return {
      on: !!spec, spec,
      // the challenges: the game's page, its round's name and rule, lower wins?, the most it takes (seconds)
      GAMES: {
        slice: { url: 'slice.html', name: 'PIXEL SLICE', how: '60 SECONDS: SLICE AS MUCH FRUIT AS YOU CAN!', low: false, max: 75 },
        hook: { url: 'hook.html', name: 'PIXEL HOOK', how: 'ENDLESS: SWING AS FAR AS YOU CAN. ONE FALL ENDS IT!', low: false, max: 240 },
        runs: { url: 'runs.html', name: 'PIXEL RUNS', how: 'RUN AS FAR AS YOU CAN!', low: false, max: 240 },
        snake: { url: 'snake.html', name: 'PIXEL SNAKE', how: 'GROW AS LONG AS YOU CAN IN 90 SECONDS!', low: false, max: 100 },
        hoops: { url: 'hoops.html', name: 'PIXEL HOOPS', how: '60 SECONDS: SCORE AS MANY BASKETS AS YOU CAN!', low: false, max: 120 },
        bike: { url: 'bike.html', name: 'PIXEL BIKE RUN', how: 'RIDE THE TRACK AS FAST AS YOU CAN!', low: true, max: 240 },
        ski: { url: 'ski.html', name: 'PIXEL SKI', how: 'SKI DOWN AS FAST AS YOU CAN!', low: true, max: 240 },
        thief: { url: 'thief.html', name: 'MOUSE THIEF', how: 'RUN FROM THE CAT AS LONG AS YOU CAN!', low: false, max: 300 },
      },
      // the round is over: the score (a number) and how to show it ('1:23.4', '35 M'...)
      report(score, text) {
        if (!spec || done) return; done = true;
        try { window.parent.postMessage({ t: 'px-challenge', id: spec.id, score: Number(score) || 0, text: String(text || score) }, location.origin); } catch (e) { /* the tournament is gone */ }
      },
      // the game was left before the end
      quit() { if (spec && !done) { done = true; try { window.parent.postMessage({ t: 'px-challenge', id: spec.id, quit: true }, location.origin); } catch (e) { /* gone */ } } },
    };
  })();

  // --- CHAT IN THE GAMES: a friend's message pops up while you play, and you can answer without leaving --------------
  // The chat itself is the arcade's (Chat in index.html): messages travel through ntfy.sh, to the topic
  // pixel-arcade-stars-<your ID>, and every phone keeps the last 40 with each friend in localStorage['pixelArcade.chat'].
  // In a game, this checks that topic every 20 seconds (and at once when the friend's chat pings "sent" on
  // pixel-arcade-typing-<your ID>). A new message from a friend shows at the top: NAME: TEXT and REPLY. REPLY (or a tap
  // on it) pauses the game and opens a small chat box over it: the last messages, a line to type in, SEND, and X
  // (back to the game, still paused). The game pauses the way it does when you switch away from it: document.hidden
  // reads true for a moment and a visibilitychange goes out, so an online game, which can't pause, goes on.
  // The messages it reads and sends go into the same localStorage as the arcade's, so the arcade has them too.
  // CHAT POP-UPS in SETTINGS (Settings.chatPop) turns it off.
  const CHAT_KEY = 'pixelArcade.chat', CHAT_MAX = 60, CHAT_KEEP = 40, RELAY = 'https://ntfy.sh/';
  // The emojis the chat can draw (the pixel art is EMOJIS in index.html), and look-alikes that become one of them.
  const CHAT_EMOJIS = ['\u{1F600}', '\u{1F602}', '\u{1F60D}', '\u{1F60E}', '\u{1F622}', '\u{1F621}', '\u{1F62E}', '\u{1F44D}', '\u{1F44E}', '❤', '\u{1F525}', '\u{1F3AE}', '\u{1F3C6}', '\u{1F44B}', '\u{1F431}'];
  const CHAT_ALIAS = { '\u{1F603}': '\u{1F600}', '\u{1F604}': '\u{1F600}', '\u{1F601}': '\u{1F600}', '\u{1F642}': '\u{1F600}', '\u{1F60A}': '\u{1F600}',
    '\u{1F923}': '\u{1F602}', '\u{1F970}': '\u{1F60D}', '\u{1F62D}': '\u{1F622}', '☹': '\u{1F622}', '\u{1F641}': '\u{1F622}', '\u{1F620}': '\u{1F621}',
    '\u{1F92C}': '\u{1F621}', '\u{1F62F}': '\u{1F62E}', '\u{1F632}': '\u{1F62E}', '\u{1F631}': '\u{1F62E}', '♥': '❤', '\u{1F9E1}': '❤',
    '\u{1F49B}': '❤', '\u{1F49A}': '❤', '\u{1F499}': '❤', '\u{1F49C}': '❤', '\u{1F496}': '❤', '\u{1F497}': '❤',
    '\u{1F579}': '\u{1F3AE}', '\u{1F947}': '\u{1F3C6}', '\u{1F408}': '\u{1F431}', '\u{1F63A}': '\u{1F431}', '\u{1F638}': '\u{1F431}' };
  // only what the chat can draw: capitals without accents, digits, a few signs and the emojis (at most CHAT_MAX)
  const chatClean = v => Array.from(String(v || '').replace(/[\u{FE0F}\u{200D}\u{1F3FB}-\u{1F3FF}]/gu, '').normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase())
    .map(ch => CHAT_ALIAS[ch] || ch).filter(ch => CHAT_EMOJIS.includes(ch) || /^[A-Z0-9 .,!?:\-+/'%()<>=*#"_$★]$/.test(ch)).slice(0, CHAT_MAX).join('');

  // --- GROUP CHATS: a chat with up to 8 players (FRIENDS → GROUPS in the arcade) ------------------------------------
  // A group has a random ID (12 letters and digits) and its own ntfy.sh topic, pixel-arcade-grp-<ID>: a message goes
  // there once and every member's arcade (and the chat box in the games) reads it, like the chat with one friend
  // (kept 12 hours). Every phone keeps the group in localStorage['pixelArcade.groups']: its name, who made it (the
  // owner), the members and the last 40 messages. What happens in a group is a message on its topic:
  //   { v: 1, t: 'g', k: 'msg', tx, fid, from, text }       a message (only from a member)
  //   { ..., k: 'add', who: [{ id, name }] }                  a member added a friend (or a few)
  //   { ..., k: 'rm', who: ID }                               the owner took someone out
  //   { ..., k: 'leave' }                                     someone left
  // Phones apply them in the order ntfy.sh keeps them. Someone who is added gets an invite on their own topic
  // (pixel-arcade-stars-<ID>, t: 'ginv', from a friend), with the group as it is then, and reads the group from there on.
  // Good to know: anybody who knows a group's ID can read its topic. It is made for friends, not for secrets.
  const GROUPS_KEY = 'pixelArcade.groups', GROUP_MAX = 8, GROUP_KEEP = 40;
  const Groups = {
    MAX: GROUP_MAX, d: null, open: '', checking: false, noteAt: {},
    topic: gid => 'pixel-arcade-grp-' + gid,
    okGid: g => typeof g === 'string' && /^[a-z0-9]{12}$/.test(g),
    okId: id => typeof id === 'string' && /^[1-9][0-9]{5}$/.test(id),
    me() { return Profile.load().id; },
    tx() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 10); },
    all() {
      if (!this.d) { let d = null; try { d = JSON.parse(localStorage.getItem(GROUPS_KEY)); } catch (e) { d = null; } this.d = d && typeof d === 'object' ? d : {}; }
      return this.d;
    },
    save() { try { localStorage.setItem(GROUPS_KEY, JSON.stringify(this.d || {})); } catch (e) { /* private mode */ } },
    get(gid) { const g = this.all()[gid]; return g && g.self === this.me() ? g : null; },
    // the groups of the player on this phone, the newest message first
    list() {
      const me = this.me(), d = this.all();
      return Object.keys(d).filter(k => d[k].self === me).map(k => ({ gid: k, ...d[k] })).sort((a, b) => (b.at || 0) - (a.at || 0));
    },
    unread(gid) { if (gid) { const g = this.get(gid); return g ? g.un | 0 : 0; } return this.list().reduce((n, g) => n + (g.un | 0), 0); },
    members(g) { return (g && Array.isArray(g.members) ? g.members : []); },
    isMember(g, id) { return this.members(g).some(p => p.id === id); },
    nameOf(g, id) { const p = this.members(g).find(q => q.id === id); return p ? p.name : 'PLAYER'; },
    cleanMembers(list) {
      const out = [];
      for (const p of Array.isArray(list) ? list : []) if (p && this.okId(p.id) && !out.some(q => q.id === p.id)) out.push({ id: p.id, name: cleanName(p.name) || 'PLAYER' });
      return out.slice(0, GROUP_MAX);
    },
    async post(topic, obj) {
      const res = await fetch('https://ntfy.sh/' + topic, { method: 'POST', body: JSON.stringify({ v: 1, tx: this.tx(), fid: this.me(), from: Profile.load().name, ...obj }) });
      if (!res.ok) throw new Error('relay ' + res.status);
    },
    // invite players to a group (on their own topics): the group as it is now
    async invite(gid, people) {
      const g = this.get(gid); if (!g) return;
      const snap = { t: 'ginv', gid, name: g.name, owner: g.owner, members: g.members };
      await Promise.all(people.map(p => this.post('pixel-arcade-stars-' + p.id, snap)));
      Push.tellMany(people.map(p => p.id), 'gadd', { gn: g.name, gid });
    },
    // NEW GROUP: you and some friends
    async create(name, friends) {
      const me = Profile.load(), gid = Array.from(crypto.getRandomValues(new Uint8Array(12)), b => 'abcdefghijklmnopqrstuvwxyz0123456789'[b % 36]).join('');
      const members = this.cleanMembers([{ id: me.id, name: me.name }, ...friends]);
      this.all()[gid] = { self: me.id, name: cleanName(name) || 'GROUP', owner: me.id, members, m: [], un: 0, seen: [], since: Math.floor(Date.now() / 1000) - 5, at: Date.now() };
      this.save();
      await this.invite(gid, members.filter(p => p.id !== me.id));
      return gid;
    },
    // an invite came (from a friend): the group, as the friend sees it
    invited(m, at) {
      const me = this.me();
      if (!m || !this.okGid(m.gid) || !this.okId(m.fid)) return false;
      const members = this.cleanMembers(m.members);
      if (!members.some(p => p.id === me) || !members.some(p => p.id === m.fid)) return false;
      const d = this.all(), old = d[m.gid];
      if (old && old.self === me && !old.out) return false;                    // (in it already)
      d[m.gid] = { self: me, name: cleanName(m.name) || 'GROUP', owner: this.okId(m.owner) ? m.owner : m.fid, members, m: old && old.self === me ? old.m : [],
                   un: 0, seen: [], since: (at || Math.floor(Date.now() / 1000)) - 1, at: Date.now(), by: cleanName(m.from) || 'A FRIEND' };
      this.save(); return true;
    },
    // read every group's topic at once; what is new is applied. The new messages from others: [{ gid, g, who, x }]
    async check() {
      const groups = this.list().filter(g => !g.out);
      if (!groups.length || this.checking) return [];
      this.checking = true;
      const fresh = [];
      try {
        const res = await fetch('https://ntfy.sh/' + groups.map(g => this.topic(g.gid)).join(',') + '/json?poll=1&since=all', { cache: 'no-store' });
        if (!res.ok) return [];
        const me = this.me();
        for (const row of (await res.text()).split('\n')) {
          let ev = null, m = null; try { ev = JSON.parse(row); if (ev.event === 'message') m = JSON.parse(ev.message); } catch (e) { continue; }
          if (!m || m.v !== 1 || m.t !== 'g' || typeof m.tx !== 'string' || !m.tx || m.tx.length > 40 || !this.okId(m.fid)) continue;
          const gid = String(ev.topic || '').replace('pixel-arcade-grp-', ''), g = this.get(gid);
          if (!g || g.out || (+ev.time || 0) < (g.since || 0) || g.seen.includes(m.tx) || g.m.some(y => y.tx === m.tx)) continue;
          g.seen = [...g.seen, m.tx].slice(-300);
          if (!this.isMember(g, m.fid)) continue;                               // only members say anything
          if (m.k === 'msg' && typeof m.text === 'string') {
            const x = censor(chatClean(m.text)).trim(); if (!x) continue;
            const mine = m.fid === me;
            g.m = [...g.m, { me: mine, x, tx: m.tx, fid: m.fid }].slice(-GROUP_KEEP); g.at = Date.now();
            if (!mine && this.open !== gid) g.un = Math.min(GROUP_KEEP, (g.un | 0) + 1);
            if (!mine) fresh.push({ gid, g, who: this.nameOf(g, m.fid), x });
          } else if (m.k === 'add') {
            for (const p of this.cleanMembers(m.who)) if (!this.isMember(g, p.id) && g.members.length < GROUP_MAX) g.members.push(p);
          } else if (m.k === 'rm' && m.fid === g.owner && this.okId(m.who) && m.who !== g.owner) {
            g.members = g.members.filter(p => p.id !== m.who);
            if (m.who === me) g.out = 'removed';
          } else if (m.k === 'leave') {
            g.members = g.members.filter(p => p.id !== m.fid);
            if (m.fid === g.owner && g.members.length) g.owner = g.members[0].id;    // (someone has to be the owner)
          }
        }
        this.save();
      } catch (e) { /* offline: next time */ } finally { this.checking = false; }
      return fresh;
    },
    // something I do in a group: on its topic, and right away here
    async act(gid, obj) {
      const g = this.get(gid); if (!g) throw new Error('no group');
      const tx = this.tx();
      const res = await fetch('https://ntfy.sh/' + this.topic(gid), { method: 'POST', body: JSON.stringify({ v: 1, t: 'g', tx, fid: this.me(), from: Profile.load().name, ...obj }) });
      if (!res.ok) throw new Error('relay ' + res.status);
      g.seen = [...(g.seen || []), tx].slice(-300);
      return { g, tx };
    },
    async send(gid, text) {
      const x = censor(chatClean(text)).trim(); if (!x) return '';
      const { g, tx } = await this.act(gid, { k: 'msg', text: x });
      g.m = [...g.m, { me: true, x, tx, fid: this.me() }].slice(-GROUP_KEEP); g.at = Date.now(); g.un = 0; this.save();
      const others = g.members.filter(p => p.id !== this.me());
      // "sent": the others' open chats fetch it at once
      for (const p of others) fetch('https://ntfy.sh/pixel-arcade-typing-' + p.id + '?cache=no', { method: 'POST', body: JSON.stringify({ v: 1, fid: this.me(), g: gid, sent: 1 }) }).catch(() => { /* never mind */ });
      const now = Date.now(); if (!this.noteAt[gid] || now - this.noteAt[gid] > 60e3) { this.noteAt[gid] = now; Push.tellMany(others.map(p => p.id), 'gchat', { gn: g.name, gid }); }
      return x;
    },
    async add(gid, friends) {
      const g = this.get(gid); if (!g) return;
      const who = this.cleanMembers(friends).filter(p => !this.isMember(g, p.id)).slice(0, GROUP_MAX - g.members.length);
      if (!who.length) return;
      await this.act(gid, { k: 'add', who });
      g.members.push(...who); this.save();
      await this.invite(gid, who);
    },
    async remove(gid, id) {
      const g = this.get(gid); if (!g || g.owner !== this.me() || id === g.owner) return;
      await this.act(gid, { k: 'rm', who: id });
      g.members = g.members.filter(p => p.id !== id); this.save();
    },
    async leave(gid) {
      const g = this.get(gid); if (!g) return;
      if (!g.out) await this.act(gid, { k: 'leave' });
      delete this.all()[gid]; this.save();
    },
    read(gid) { const g = this.get(gid); if (g && g.un) { g.un = 0; this.save(); } },
  };
  if (typeof addEventListener !== 'undefined') addEventListener('storage', e => { if (e.key === GROUPS_KEY) Groups.d = null; });

  const ChatPop = {
    on: false, el: null, toastEl: null, box: null, list: null, input: null, sendBtn: null, info: null,
    f: null, busy: false, es: null, timer: 0, toastT: 0, fakeHidden: false, noteAt: {},
    me() { return Profile.load().id; },
    // the chats, always read fresh (the arcade, in another tab or around this game's frame, writes them too)
    load() { try { const d = JSON.parse(localStorage.getItem(CHAT_KEY)); return d && typeof d === 'object' ? d : {}; } catch (e) { return {}; } },
    save(d) { try { localStorage.setItem(CHAT_KEY, JSON.stringify(d)); } catch (e) { /* private mode */ } },
    friend(id) { return Invite.friends().find(f => f.id === id) || null; },
    start() {
      const g = Presence.game();
      if (this.on || !g || !location.protocol.startsWith('http') || !document.body) return;
      if (!/^[1-9][0-9]{5}$/.test(this.me()) || !Invite.friends().length || !Settings.load().chatPop) return;
      this.on = true;
      // the box speaks Czech too: a game doesn't load cs.js itself (it isn't translated yet), so load it here
      if (Lang.code() === 'cs' && !Lang.dict.size) { const sc = document.createElement('script'); sc.src = 'cs.js'; document.head.appendChild(sc); }
      // games pause on document.hidden: let it read true while the chat box is open
      const real = Object.getOwnPropertyDescriptor(Document.prototype, 'hidden');
      if (real && real.get) {
        try { Object.defineProperty(document, 'hidden', { configurable: true, get: () => this.fakeHidden || real.get.call(document) }); } catch (e) { /* the game won't pause */ }
      }
      this.listen(); setTimeout(() => this.check(), 2500);
      this.timer = setInterval(() => { if (!document.hidden || this.fakeHidden) this.check(); }, 20e3);
      document.addEventListener('visibilitychange', () => { if (!this.fakeHidden && !document.hidden) { this.listen(); this.check(); } });
    },
    // "a message is on its way": the friend's chat pings our typing topic right after sending (cache=no, live only)
    listen() {
      if (typeof EventSource === 'undefined' || (this.es && this.es.readyState !== 2)) return;
      try {
        this.es = new EventSource(RELAY + 'pixel-arcade-typing-' + this.me() + '/sse');
        this.es.onmessage = e => {
          let m = null; try { m = JSON.parse(JSON.parse(e.data).message); } catch (x) { return; }
          if (m && m.v === 1 && m.sent && (this.friend(m.fid) || Groups.okGid(m.g))) this.check();
        };
      } catch (e) { this.es = null; }
    },
    checking: false,
    async check() {
      if (this.checking) return; this.checking = true;
      try {
        const res = await fetch(RELAY + 'pixel-arcade-stars-' + this.me() + '/json?poll=1&since=all', { cache: 'no-store' });
        if (!res.ok) return;
        let seen = []; try { const a = JSON.parse(localStorage.getItem('pixelArcade.giftsSeen')); if (Array.isArray(a)) seen = a; } catch (e) { /* none */ }
        const d = this.load(), fresh = [];
        for (const row of (await res.text()).split('\n')) {
          let m = null, at = 0; try { const ev = JSON.parse(row); if (ev.event === 'message') { m = JSON.parse(ev.message); at = +ev.time || 0; } } catch (e) { continue; }
          if (m && m.v === 1 && m.t === 'ginv' && this.friend(m.fid)) { Groups.invited(m, at); continue; }   // (added to a group: the arcade sees it too, that's fine)
          if (!m || m.v !== 1 || m.t !== 'chat' || typeof m.tx !== 'string' || !m.tx || m.tx.length > 40 || typeof m.text !== 'string') continue;
          const f = this.friend(m.fid); if (!f || seen.includes(m.tx)) continue;
          const x = censor(chatClean(m.text)).trim(); if (!x) continue;
          const c = d[f.id] && Array.isArray(d[f.id].m) ? d[f.id] : (d[f.id] = { m: [], un: 0 });
          if (c.m.some(y => y && y.tx === m.tx)) continue;
          c.m.push({ me: false, x, tx: m.tx }); c.m = c.m.slice(-CHAT_KEEP);
          if (this.f && this.f.id === f.id) c.un = 0; else c.un = Math.min(CHAT_KEEP, (c.un | 0) + 1);
          fresh.push([f, x]);
        }
        if (fresh.length) this.save(d);
        for (const n of await Groups.check()) fresh.push([{ gid: n.gid, name: n.g.name, who: n.who }, n.x]);   // the group chats
        if (!fresh.length) return;
        const [f, x] = fresh[fresh.length - 1];
        if (this.f && (f.gid ? this.f.gid === f.gid : this.f.id === f.id)) { this.draw(); Sound.tone(1047, 0.06, { vol: 0.06 }); }
        else { this.toast(f, x); Sound.tone([784, 1047], 0.12, { vol: 0.07 }); }
      } catch (e) { /* offline: next time */ } finally { this.checking = false; }
    },
    // the pop-up: NAME: TEXT, with REPLY and a small X; it goes by itself after 8 seconds
    css: { font: 'bold 14px/1.4 ui-monospace, Menlo, Consolas, monospace', textTransform: 'uppercase' },
    keep(el) {                       // keys and taps in our boxes are not the game's
      for (const k of ['keydown', 'keyup', 'keypress', 'pointerdown', 'pointerup', 'mousedown', 'mouseup', 'touchstart', 'touchend', 'click', 'wheel'])
        el.addEventListener(k, e => e.stopPropagation());
    },
    btn(label, bg, fn) {
      const b = document.createElement('button'); b.textContent = label;
      Object.assign(b.style, this.css, { background: bg, color: '#111', border: '2px solid #000', boxShadow: '2px 2px 0 #000', padding: '4px 10px', cursor: 'pointer', flex: 'none' });
      b.addEventListener('click', e => { e.preventDefault(); fn(); });
      return b;
    },
    toast(f, x) {
      if (this.f) return;
      if (!this.toastEl) {
        const el = document.createElement('div');
        Object.assign(el.style, this.css, { position: 'fixed', left: '50%', top: '34px', transform: 'translateX(-50%)', zIndex: 70, display: 'none',
          alignItems: 'center', gap: '8px', maxWidth: 'min(92vw, 520px)', background: '#1d1830', color: '#efe9ff', border: '2px solid #ffd23f',
          boxShadow: '4px 4px 0 #000', padding: '6px 8px 6px 12px', cursor: 'pointer' });
        const txt = document.createElement('span'); Object.assign(txt.style, { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 });
        const x = this.btn('✕', '#9a92b8', () => this.hideToast());
        x.addEventListener('click', e => e.stopPropagation());
        el.append(txt, this.btn(Lang.t('REPLY'), '#ffd23f', () => this.openFrom()), x);
        el.addEventListener('click', () => this.openFrom());
        this.keep(el); document.body.appendChild(el); this.toastEl = el; this.toastTxt = txt;
      }
      this.toastFriend = f;
      this.toastTxt.textContent = '💬 ' + f.name + ': ' + (f.who ? f.who + ': ' : '') + this.show(x);
      this.toastEl.style.display = 'flex';
      clearTimeout(this.toastT); this.toastT = setTimeout(() => this.hideToast(), 8000);
    },
    hideToast() { clearTimeout(this.toastT); if (this.toastEl) this.toastEl.style.display = 'none'; },
    openFrom() { const f = this.toastFriend; this.hideToast(); if (f) this.open(f); },
    pause(on) {
      if (this.fakeHidden === on) return;
      this.fakeHidden = on;
      try { document.dispatchEvent(new Event('visibilitychange')); } catch (e) { /* old browser */ }
    },
    // the chat box over the game
    open(f) {
      this.f = f; this.busy = false;
      if (f.gid) { Groups.open = f.gid; Groups.read(f.gid); } else { const d = this.load(); if (d[f.id]) { d[f.id].un = 0; this.save(d); } }
      this.pause(true);
      if (!this.box) {
        const box = document.createElement('div');
        Object.assign(box.style, this.css, { position: 'fixed', inset: '0', zIndex: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(11,9,18,0.6)' });
        const p = document.createElement('div');
        Object.assign(p.style, { width: 'min(94vw, 460px)', maxHeight: '92vh', display: 'flex', flexDirection: 'column', gap: '8px', background: '#1d1830',
          color: '#efe9ff', border: '2px solid #ffd23f', boxShadow: '4px 4px 0 #000', padding: '10px' });
        const head = document.createElement('div'); Object.assign(head.style, { display: 'flex', alignItems: 'center', gap: '8px' });
        this.title = document.createElement('div'); Object.assign(this.title.style, { flex: '1', color: '#ffd23f', fontSize: '16px' });
        head.append(this.title, this.btn('✕', '#9a92b8', () => this.close()));
        this.list = document.createElement('div');
        Object.assign(this.list.style, { display: 'flex', flexDirection: 'column', gap: '4px', overflowY: 'auto', minHeight: '60px', maxHeight: '40vh', padding: '6px', background: '#0d0b13' });
        const row = document.createElement('div'); Object.assign(row.style, { display: 'flex', gap: '6px' });
        this.input = document.createElement('input');
        Object.assign(this.input, { maxLength: 80, autocomplete: 'off' });
        Object.assign(this.input.style, this.css, { flex: '1', minWidth: 0, fontSize: '16px', background: '#efe9ff', color: '#111', border: '2px solid #000', padding: '4px 6px' });
        this.input.addEventListener('input', () => { const v = chatClean(this.input.value); if (v !== this.input.value) this.input.value = v; });
        this.input.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); this.send(); } });
        this.sendBtn = this.btn(Lang.t('SEND'), '#5ad43f', () => this.send());
        row.append(this.input, this.sendBtn);
        const emo = document.createElement('div'); Object.assign(emo.style, { display: 'flex', flexWrap: 'wrap', gap: '2px' });
        for (const ch of CHAT_EMOJIS) {
          const b = document.createElement('button'); b.textContent = this.show(ch);
          Object.assign(b.style, { background: 'none', border: '0', fontSize: '18px', padding: '0 2px', cursor: 'pointer' });
          b.addEventListener('click', e => { e.preventDefault(); this.input.value = chatClean(this.input.value + ch); });
          emo.appendChild(b);
        }
        this.info = document.createElement('div'); Object.assign(this.info.style, { color: '#9a92b8', fontSize: '12px' });
        p.append(head, this.list, emo, row, this.info);
        box.appendChild(p);
        box.addEventListener('click', e => { if (e.target === box) this.close(); });
        box.addEventListener('keydown', e => { if (e.key === 'Escape') { e.preventDefault(); this.close(); } });
        // while the box is open, the game gets no keys at all (they would steer, jump or leave the game)
        for (const k of ['keydown', 'keyup', 'keypress']) addEventListener(k, e => { if (this.f && !box.contains(e.target)) { e.stopImmediatePropagation(); if (e.key === 'Escape' && k === 'keydown') this.close(); } }, true);
        this.keep(box); document.body.appendChild(box); this.box = box;
      }
      this.title.textContent = '💬 ' + f.name;
      this.info.textContent = Lang.t('THE GAME IS PAUSED. ✕ GOES BACK TO IT.'); this.input.placeholder = Lang.t('YOUR MESSAGE');
      this.info.style.color = '#9a92b8';
      this.input.value = '';
      this.box.style.display = 'flex';
      this.draw();
      try { this.input.focus(); } catch (e) { /* fine */ }
      setTimeout(() => { try { if (this.f) this.input.focus(); } catch (e) { /* fine */ } }, 50);
      clearInterval(this.fast); this.fast = setInterval(() => this.check(), 5000);   // (like the arcade's open chat)
    },
    draw() {
      if (!this.f || !this.list) return;
      const g = this.f.gid && Groups.get(this.f.gid);
      const c = this.f.gid ? g : this.load()[this.f.id], ms = c && Array.isArray(c.m) ? c.m.slice(-12) : [];
      this.list.textContent = '';
      if (!ms.length) { const e = document.createElement('div'); e.textContent = Lang.t('NO MESSAGES YET.'); e.style.color = '#5b5275'; this.list.appendChild(e); }
      for (const m of ms) {
        const e = document.createElement('div'); e.textContent = (g && !m.me ? Groups.nameOf(g, m.fid) + ': ' : '') + this.show(m.x);
        Object.assign(e.style, { alignSelf: m.me ? 'flex-end' : 'flex-start', maxWidth: '85%', overflowWrap: 'anywhere', padding: '2px 6px',
          background: m.me ? '#ffd23f' : '#3a2f5c', color: m.me ? '#111' : '#efe9ff' });
        this.list.appendChild(e);
      }
      this.list.scrollTop = this.list.scrollHeight;
    },
    close() {
      if (!this.f) return;
      clearInterval(this.fast); this.f = null; Groups.open = '';
      try { this.input.blur(); } catch (e) { /* fine */ }
      if (this.box) this.box.style.display = 'none';
      this.pause(false);
    },
    async send() {
      const f = this.f, raw = chatClean(this.input.value).trim();
      if (!f || this.busy || !raw) return;
      if (f.gid) {                                   // a group chat (PX.Groups)
        this.busy = true; this.sendBtn.disabled = true;
        try {
          await Groups.send(f.gid, raw);
          if (this.f === f) { this.input.value = ''; this.draw(); }
          const swore = censor(raw) !== raw;
          this.say(Lang.t(swore ? 'NO SWEARING! THOSE WORDS WERE SENT AS #####.' : 'SENT! ✕ GOES BACK TO THE GAME.'), swore ? '#ff6a5a' : '#5ad43f');
          Sound.tone(880, 0.05, { vol: 0.06 });
        } catch (e) { this.say(Lang.t("COULDN'T SEND IT. CHECK YOUR INTERNET AND TRY AGAIN."), '#ff6a5a'); Sound.tone(150, 0.2); }
        this.busy = false; this.sendBtn.disabled = false; return;
      }
      if (!this.friend(f.id)) { this.say(Lang.t(f.name + ' IS NOT YOUR FRIEND ANY MORE.')); return; }
      const x = censor(raw), p = Profile.load();
      const tx = Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
      this.busy = true; this.sendBtn.disabled = true;
      try {
        const res = await fetch(RELAY + 'pixel-arcade-stars-' + f.id, { method: 'POST', body: JSON.stringify({ v: 1, t: 'chat', tx, from: p.name, fid: p.id, text: x }) });
        if (!res.ok) throw new Error('relay ' + res.status);
        const d = this.load(), c = d[f.id] && Array.isArray(d[f.id].m) ? d[f.id] : (d[f.id] = { m: [], un: 0 });
        c.m.push({ me: true, x, tx }); c.m = c.m.slice(-CHAT_KEEP); c.un = 0; this.save(d);
        fetch(RELAY + 'pixel-arcade-typing-' + f.id + '?cache=no', { method: 'POST', body: JSON.stringify({ v: 1, fid: p.id, sent: 1 }) }).catch(() => { /* never mind */ });
        const now = Date.now(); if (!this.noteAt[f.id] || now - this.noteAt[f.id] > 60e3) { this.noteAt[f.id] = now; Push.tell(f.id, 'chat'); }
        if (this.f === f) { this.input.value = ''; this.draw(); }
        this.say(Lang.t(x !== raw ? 'NO SWEARING! THOSE WORDS WERE SENT AS #####.' : 'SENT! ✕ GOES BACK TO THE GAME.'), x !== raw ? '#ff6a5a' : '#5ad43f');
        Sound.tone(880, 0.05, { vol: 0.06 });
      } catch (e) { this.say(Lang.t("COULDN'T SEND IT. CHECK YOUR INTERNET AND TRY AGAIN."), '#ff6a5a'); Sound.tone(150, 0.2); }
      this.busy = false; this.sendBtn.disabled = false;
    },
    show: s => String(s || '').replace(/❤/g, '❤\uFE0F'),             // (the red heart, not a black one)
    say(text, col = '#ff6a5a') { if (this.info) { this.info.textContent = text; this.info.style.color = col; } },
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => ChatPop.start()); else setTimeout(() => ChatPop.start(), 0);

  return { Voice, Call, Invite, Presence, Push, Pad, Remote, Settings, PADNUM, setIcon, avatarIconURL, Wallet, Bet, textWidth, drawText, drawLogo, AVATAR_SHAPES, AVATAR_COLORS, GIFT_SHAPES, Gifts, drawAvatar, avatarImage, drawIcon, Profile, cleanName, censor, rudeWord, Api, Scores,
           CODE_CHARS, ICE_SERVERS, loadPeer, relays, makeScreen, makeUI, Sound, ChatPop, Groups, Challenge, chatClean, CHAT_EMOJIS, Lang, tr: s => Lang.tr(s) };
})();

// PIXEL ARCADE: shared bits for the arcade (index.html) and its games.
// Everything lives under window.PX, so it never clashes with a game's own code.
'use strict';
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
  '"': '101,101,000,000,000', '_': '000,000,000,000,111', '$': '01111,10100,01110,00101,11110',
  '★': '00100,01110,11111,01110,01010', '♥': '01010,11111,11111,01110,00100',
  '↓': '010,010,010,111,010', '↑': '010,111,010,010,010', '…': '00000,00000,00000,00000,10101',
};
  const GLYPHS = {};
  for (const ch in FONT) { const rows = FONT[ch].split(','); GLYPHS[ch] = { w: rows[0].length, rows }; }
  function textWidth(str, size = 1) {
    let w = 0;
    for (const ch of String(str).toUpperCase()) w += ((GLYPHS[ch] || GLYPHS['?']).w + 1) * size;
    return Math.max(0, w - size);
  }
  function rawText(ctx, str, x, y, size) {
    let cx = x;
    for (const ch of str) {
      const g = GLYPHS[ch] || GLYPHS['?'];
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
    str = String(str).toUpperCase();
    if (align !== 'left') { const tw = textWidth(str, size); x -= align === 'center' ? Math.floor(tw / 2) : tw; }
    x = Math.round(x); y = Math.round(y);
    if (shadow) { const o = Math.max(1, size >> 1); ctx.fillStyle = shadow; rawText(ctx, str, x + o, y + o, size); }
    ctx.fillStyle = color; rawText(ctx, str, x, y, size);
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
  let peerLoading = null;
  function loadPeer() {
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
    load() { let d = {}; try { d = JSON.parse(localStorage.getItem(SETTINGS_KEY)) || {}; } catch (e) { /* new player */ } return { volume: VOLUMES[d.volume] ? d.volume | 0 : 3 }; },
    save(d) { try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(d)); } catch (e) { /* private mode */ } Sound.apply(); },
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
    apply() { if (this.out) this.out.gain.value = 0.5 * Settings.volume(); },   // the arcade's volume setting
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
      return this.seats[id] || (this.seats[id] = { id: 'Pixel Arcade phone controller (reconnecting)', index: 0, connected: true, mapping: 'standard', timestamp: 0,
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
        ph.pad = { id: 'Pixel Arcade phone controller', index: 0, connected: true, mapping: 'standard', timestamp: performance.now(),
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
      return { title: String(cfg.title || document.title || 'Pixel Arcade').replace(/: controller$/i, ''), mode: menu ? 'menu' : 'play',
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

  return { Invite, Pad, Remote, Settings, PADNUM, setIcon, avatarIconURL, Wallet, Bet, textWidth, drawText, AVATAR_SHAPES, AVATAR_COLORS, GIFT_SHAPES, Gifts, drawAvatar, avatarImage, drawIcon, Profile, cleanName,
           CODE_CHARS, ICE_SERVERS, loadPeer, makeScreen, makeUI, Sound };
})();

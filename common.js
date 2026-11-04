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
  '"': '101,101,000,000,000', '_': '000,000,000,000,111',
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
  };
  const AVATAR_SHAPES = Object.keys(AVATARS);
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
      return p;
    },
    save(p) { try { localStorage.setItem(PROFILE_KEY, JSON.stringify(p)); } catch (e) { /* private mode */ } },
    get() { return this.load(); },
    setName(name) { const p = this.load(); p.name = name; this.save(p); },
  };
  const cleanName = v => String(v || '').toUpperCase().replace(/[^A-Z0-9 ]/g, '').replace(/\s+/g, ' ').trim().slice(0, 10);

  // --- online play (the same free PeerJS server as Mouse Thief) -------------------------------
  const PEERJS_URLS = ['https://cdnjs.cloudflare.com/ajax/libs/peerjs/1.5.4/peerjs.min.js',
                       'https://unpkg.com/peerjs@1.5.4/dist/peerjs.min.js'];
  const ICE_SERVERS = [
    { urls: ['stun:stun.l.google.com:19302', 'stun:stun.cloudflare.com:3478'] },
    { urls: ['turn:eu-0.turn.peerjs.com:3478', 'turn:us-0.turn.peerjs.com:3478'], username: 'peerjs', credential: 'peerjsp' },
  ];
  const CODE_CHARS = 'ABCDEFGHJKLMNPRSTUVWXYZ23456789';
  function loadPeer() {
    if (window.Peer) return Promise.resolve();
    const tryUrl = i => new Promise((res, rej) => {
      const s = document.createElement('script');
      s.src = PEERJS_URLS[i]; s.onload = res;
      s.onerror = () => (i + 1 < PEERJS_URLS.length ? tryUrl(i + 1).then(res, rej) : rej());
      document.head.appendChild(s);
    });
    return tryUrl(0);
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
      let bg = o.on ? '#3a2f5c' : '#1d1830', fg = '#efe9ff', bd = '#efe9ff';
      if (hot) { bg = o.accent || '#efe9ff'; fg = '#111'; bd = bg; }
      if (o.disabled) { bg = '#16121f'; fg = '#5b5275'; bd = fg; }
      const off = hot ? 1 : 0;
      if (!hot && !o.disabled) { ctx.fillStyle = bd; ctx.fillRect(x + 2, y + 2, w, h); }
      ctx.fillStyle = bd; ctx.fillRect(x + off, y + off, w, h);
      ctx.fillStyle = bg; ctx.fillRect(x + 1 + off, y + 1 + off, w - 2, h - 2);
      const size = o.size || 2;
      if (label) drawText(ctx, label, x + w / 2 + off, y + Math.round((h - 5 * size) / 2) + off, o.textColor && !hot && !o.disabled ? o.textColor : fg, size, 'center');
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

  // --- tiny sound helpers ----------------------------------------------------------------
  const Sound = {
    ctx: null, out: null,
    unlock() {
      if (!this.ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        try { this.ctx = new AC(); } catch (e) { return; }
        this.out = this.ctx.createGain(); this.out.gain.value = 0.5; this.out.connect(this.ctx.destination);
      }
      if (this.ctx.state === 'suspended') this.ctx.resume();
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

  return { Wallet, textWidth, drawText, AVATAR_SHAPES, AVATAR_COLORS, drawAvatar, avatarImage, Profile, cleanName,
           CODE_CHARS, ICE_SERVERS, loadPeer, makeScreen, makeUI, Sound };
})();

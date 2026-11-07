/* ==========================================================================
   PIXEL WINGS: the REAR GUNNER's view (a test mode).
   You sit in the gun turret on top of a bomber, behind the wings, and look back
   over the twin tail. A bot flies the plane; you shoot at the fighters that
   attack it. The battle is the same one the top-down game runs (wings.html):
   this file only draws it in 3D, from the turret, at the arcade's pixel size.
   The map's x and y are three.js x and z; height is y. One unit = one map pixel.
   Loaded by wings.html only when someone plays the gunner (import()).
   ========================================================================== */
import * as THREE from './vendor/three.module.min.js';

const SKY_TOP = new THREE.Color('#3d86d8'), SKY_HORIZON = new THREE.Color('#cfe6ff'), HAZE = '#b8d8f4';
const TEAM = [['#e0402a', '#8a2014'], ['#2a7fd4', '#164a80']];
const TURRET = new THREE.Vector3(-1.5, 3.6, 0);          // where my eyes are on my bomber (forward is +x)

export function createGunnerView(W) {
  const canvas = document.createElement('canvas');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(1);
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(HAZE, 260, 1500);
  const camera = new THREE.PerspectiveCamera(62, 16 / 9, 0.3, 3200);
  scene.add(camera);
  scene.add(new THREE.HemisphereLight('#e4f0ff', '#46708a', 2.2));
  const sun = new THREE.DirectionalLight('#fff2dc', 2.4); sun.position.set(-0.5, 1, 0.35); scene.add(sun);

  // --- the sky: a big ball around the camera, pale at the horizon, blue above -------------------
  const skyGeo = new THREE.SphereGeometry(3000, 24, 12), skyCol = [];
  const pos = skyGeo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const k = Math.max(0, pos.getY(i) / 3000), c = SKY_HORIZON.clone().lerp(SKY_TOP, Math.pow(k, 0.6));
    skyCol.push(c.r, c.g, c.b);
  }
  skyGeo.setAttribute('color', new THREE.Float32BufferAttribute(skyCol, 3));
  const sky = new THREE.Mesh(skyGeo, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, fog: false, depthWrite: false }));
  sky.renderOrder = -1; scene.add(sky);

  // --- the sea: a pixel texture, so you can feel how fast you fly ---------------------------------
  const seaTex = (() => {
    const c = document.createElement('canvas'); c.width = c.height = 64;
    const g = c.getContext('2d');
    g.fillStyle = '#2a6fb8'; g.fillRect(0, 0, 64, 64);
    for (let i = 0; i < 260; i++) { g.fillStyle = Math.random() < 0.5 ? '#2462a6' : '#3279c2'; g.fillRect(Math.random() * 64 | 0, Math.random() * 64 | 0, 2 + (Math.random() * 3 | 0), 1); }
    for (let i = 0; i < 14; i++) { g.fillStyle = '#9fd0f2'; g.fillRect(Math.random() * 64 | 0, Math.random() * 64 | 0, 2, 1); }
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping; t.magFilter = THREE.NearestFilter; t.colorSpace = THREE.SRGBColorSpace;
    t.repeat.set(60, 60);
    return t;
  })();
  const sea = new THREE.Mesh(new THREE.PlaneGeometry(24000, 24000), new THREE.MeshLambertMaterial({ map: seaTex }));
  sea.rotation.x = -Math.PI / 2; sea.position.set(W.WW / 2, 0, W.WH / 2); scene.add(sea);

  // --- the land: the island and the islets as one height map (from the same landDepth as the game) ---
  const groundH = (x, y) => { const d = W.landDepth(x, y); return d > 0 ? 0.6 + Math.min(d, 50) * 0.05 + (d > 120 ? Math.min(30, (d - 120) * 0.06) * hill(x, y) : 0) : -3; };
  function hill(x, y) {                                     // a few soft hills away from the air base
    const far = Math.hypot((x - W.IX) / 1.3, y - W.IY);
    return far < 300 ? 0 : Math.min(1, (far - 300) / 60) * (0.5 + 0.5 * Math.sin(x * 0.013 + 1.3) * Math.sin(y * 0.017 + 0.4));
  }
  {
    const step = 20, x0 = -400, y0 = -400, nx = Math.ceil((W.WW + 800) / step), ny = Math.ceil((W.WH + 800) / step);
    const geo = new THREE.PlaneGeometry(nx * step, ny * step, nx, ny);
    geo.rotateX(-Math.PI / 2);
    const p = geo.attributes.position, col = [], c = new THREE.Color();
    const sand = new THREE.Color('#e8d48a'), grass = new THREE.Color('#5aa040'), grass2 = new THREE.Color('#3f8a36'), rock = new THREE.Color('#7a8a5a');
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i) + x0 + nx * step / 2, y = p.getZ(i) + y0 + ny * step / 2;
      p.setX(i, x); p.setZ(i, y);
      const d = W.landDepth(x, y), h = groundH(x, y);
      p.setY(i, h);
      if (d < 14) c.copy(sand); else c.copy(grass).lerp(grass2, 0.5 + 0.5 * Math.sin(x * 0.05) * Math.cos(y * 0.07));
      if (h > 8) c.lerp(rock, Math.min(1, (h - 8) / 14));
      col.push(c.r, c.g, c.b);
    }
    geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    geo.computeVertexNormals();
    scene.add(new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ vertexColors: true })));
  }

  // --- the air base: runways, the six targets, the AA guns -------------------------------------------
  const mat = {}; const M = c => mat[c] || (mat[c] = new THREE.MeshLambertMaterial({ color: c }));
  const box = (w, h, d, c, x = 0, y = 0, z = 0) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), M(c)); m.position.set(x, y, z); return m; };
  const cyl = (r, h, c, x = 0, y = 0, z = 0) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 10), M(c)); m.position.set(x, y, z); return m; };
  const baseY = 3.1;
  for (const R of [W.RUNWAY, W.STRIP]) {
    const strip = box(R.x1 - R.x0, 0.4, R.w, '#4a4a52', (R.x0 + R.x1) / 2, baseY, R.y); scene.add(strip);
    for (let x = R.x0 + 12; x < R.x1 - 8; x += 22) scene.add(box(9, 0.45, 1.2, '#e8e8e0', x, baseY + 0.02, R.y));
  }
  const targetMesh = new Map();
  function buildTarget(t) {
    const g = new THREE.Group(), w = t.w, d = t.h;
    if (t.k === 'hangar') { g.add(box(w, 9, d, '#8a929c', 0, 4.5)); const roof = cyl(d / 2, w, '#6a727c', 0, 9, 0); roof.rotation.z = Math.PI / 2; roof.scale.set(1, 1, 0.5); g.add(roof); g.add(box(w * 0.7, 6, 0.4, '#2a2e36', 0, 3, d / 2)); }
    else if (t.k === 'fuel') { for (let i = -1; i <= 1; i++) g.add(cyl(5, 8, '#d8d8cc', i * 11, 4, 0)); g.add(box(w, 0.6, 3, '#6a6a60', 0, 0.3, 7)); }
    else if (t.k === 'radar') { g.add(box(5, 14, 5, '#9aa0a8', 0, 7)); const dish = box(1, 7, 12, '#e8e8e8', 0, 16.5); g.add(dish); g.userData.dish = dish; }
    else if (t.k === 'tower') { g.add(box(7, 18, 7, '#c8c0b0', 0, 9)); g.add(box(9, 4, 9, '#5ab4e8', 0, 20)); g.add(box(10, 1, 10, '#6a6a6a', 0, 22.5)); }
    else { for (let i = 0; i < 6; i++) g.add(box(7, 4, 5, '#6a7a3a', (i % 3 - 1) * 9, 2, (i < 3 ? -1 : 1) * 4.5)); }
    g.position.set(t.x, baseY, t.y);
    const ruin = new THREE.Group();
    ruin.add(box(w * 0.9, 2, d * 0.9, '#2a2622', 0, 1)); ruin.add(box(w * 0.3, 4, d * 0.3, '#3a3430', w * 0.2, 2, -d * 0.1));
    ruin.position.copy(g.position); ruin.visible = false;
    scene.add(g); scene.add(ruin);
    return { g, ruin, dead: false, smokeT: 0 };
  }
  const aaMesh = [];

  // --- planes: little blocky models in their team's colour ------------------------------------------
  function fighterModel(side) {
    const [c, d] = TEAM[side], g = new THREE.Group();
    g.add(box(12, 2.2, 2.2, c));
    g.add(box(1.6, 2.4, 2.4, '#d8d8d8', 6.6, 0, 0));                     // the nose
    g.add(box(3, 0.4, 14, d, 1, -0.3, 0));                                // the wings
    g.add(box(2, 0.3, 5.5, d, -5, 0.4, 0));                               // the tail plane
    g.add(box(2, 2.6, 0.3, c, -5, 1.6, 0));                               // the fin
    g.add(box(2.4, 1, 1.4, '#1a2a3a', 1.4, 1.4, 0));                      // the cockpit
    const prop = box(0.3, 4.4, 0.6, '#222', 7.6, 0, 0); g.add(prop); g.userData.prop = prop;
    return g;
  }
  function bomberModel(side) {
    const [c, d] = TEAM[side], g = new THREE.Group();
    g.add(box(21, 3.4, 3.4, c));
    g.add(box(2.6, 3, 3, '#9fd6f0', 11.2, 0, 0));                         // the glass nose
    g.add(box(4.8, 0.6, 30, d, 2, -0.6, 0));                              // the wings
    for (const z of [-6.5, 6.5]) { g.add(box(5, 2, 2, '#3a3a40', 3.6, -0.6, z)); const p = box(0.3, 4.6, 0.6, '#222', 6.3, -0.6, z); g.add(p); (g.userData.props = g.userData.props || []).push(p); }
    g.add(box(3.2, 0.4, 13, d, -9.5, 0.6, 0));                            // the tail plane
    for (const z of [-6.2, 6.2]) g.add(box(2.6, 3.2, 0.4, c, -9.6, 2, z)); // twin fins: the turret can see between them
    return g;
  }
  const planes = new Map();                                // id -> { g, a, roll, pitch, z, hurtT, prevHp }

  // --- bullets, bombs, flak and fire ----------------------------------------------------------------
  const MAXB = 600;
  const tracerGeo = new THREE.BufferGeometry();
  tracerGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(MAXB * 6), 3));
  tracerGeo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(MAXB * 6), 3));
  const tracers = new THREE.LineSegments(tracerGeo, new THREE.LineBasicMaterial({ vertexColors: true, fog: false }));
  tracers.frustumCulled = false; scene.add(tracers);
  const bombPool = [];
  const dot = (() => {                                     // a round pixel puff, used for smoke, fire and sparks
    const c = document.createElement('canvas'); c.width = c.height = 16;
    const g = c.getContext('2d');
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) { const r = Math.hypot(x - 7.5, y - 7.5); if (r < 7.5) { g.fillStyle = r < 5 ? '#fff' : '#ddd'; g.fillRect(x, y, 1, 1); } }
    const t = new THREE.CanvasTexture(c); t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter; return t;
  })();
  const parts = [], partPool = [];
  function puff(x, y, z, o) {                              // o: { vx, vy, vz, life, s0, s1, col, add, fog }
    let sp = partPool.pop();
    if (!sp) { sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: dot, transparent: true, depthWrite: false })); scene.add(sp); }
    sp.visible = true;
    sp.material.color.set(o.col); sp.material.blending = o.add ? THREE.AdditiveBlending : THREE.NormalBlending; sp.material.fog = o.fog !== false;
    sp.position.set(x, z, y);
    parts.push({ sp, vx: o.vx || 0, vy: o.vy || 0, vz: o.vz || 0, t: 0, life: o.life, s0: o.s0, s1: o.s1, a0: o.a0 === undefined ? 1 : o.a0, drag: o.drag || 0 });
  }
  function stepParts(dt) {
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i]; p.t += dt;
      if (p.t >= p.life) { p.sp.visible = false; partPool.push(p.sp); parts.splice(i, 1); continue; }
      const k = p.t / p.life, f = Math.pow(1 - p.drag, dt * 60);
      p.vx *= f; p.vy *= f; p.vz *= f;
      p.sp.position.x += p.vx * dt; p.sp.position.z += p.vy * dt; p.sp.position.y += p.vz * dt;
      const s = p.s0 + (p.s1 - p.s0) * k; p.sp.scale.set(s, s, 1);
      p.sp.material.opacity = p.a0 * (1 - k * k);
    }
  }
  const rnd = (a, b) => a + Math.random() * (b - a);
  function boom(x, y, z, s) {
    const n = s >= 2 ? 16 : 10, sp = s >= 3 ? 30 : s >= 2 ? 20 : 14;
    puff(x, y, z, { life: 0.25, s0: 6 * s, s1: 14 * s, col: '#fff6c0', add: true });
    for (let i = 0; i < n; i++) puff(x, y, z, { vx: rnd(-sp, sp), vy: rnd(-sp, sp), vz: rnd(-sp * 0.4, sp), life: rnd(0.4, 0.9), s0: rnd(3, 6) * (s > 1 ? 1.5 : 1), s1: 1, col: Math.random() < 0.5 ? '#ffb030' : '#ff6a20', add: true, drag: 0.04 });
    for (let i = 0; i < n * 0.7; i++) puff(x, y, z, { vx: rnd(-6, 6), vy: rnd(-6, 6), vz: rnd(2, 10), life: rnd(1.5, 3), s0: rnd(5, 8) * s, s1: rnd(12, 18) * s, col: '#4a4440', a0: 0.85 });
  }

  // effects from the battle (the same list the top-down view turns into particles)
  function fx(e) {
    const z = e.z || 0;
    if (e.k === 'boom') boom(e.x, e.y, z || (W.isLand(e.x, e.y) ? baseY : 0), e.s || 1);
    else if (e.k === 'flak') {
      puff(e.x, e.y, z, { life: 0.15, s0: 10, s1: 14, col: '#ffe08a', add: true });
      for (let i = 0; i < 6; i++) puff(e.x + rnd(-3, 3), e.y + rnd(-3, 3), z + rnd(-3, 3), { vx: rnd(-3, 3), vy: rnd(-3, 3), vz: rnd(-1, 2), life: rnd(2, 3.2), s0: rnd(6, 9), s1: rnd(12, 16), col: '#2a2626', a0: 0.9 });
    } else if (e.k === 'hit') {
      for (let i = 0; i < 4; i++) puff(e.x, e.y, z, { vx: rnd(-30, 30), vy: rnd(-30, 30), vz: rnd(-20, 30), life: 0.25, s0: 1.6, s1: 0.4, col: '#fff0a0', add: true, fog: false });
    } else if (e.k === 'splash') {
      for (let i = 0; i < 10; i++) puff(e.x + rnd(-4, 4), e.y + rnd(-4, 4), 0.5, { vx: rnd(-6, 6), vy: rnd(-6, 6), vz: rnd(14, 34), life: rnd(0.8, 1.4), s0: rnd(3, 5), s1: rnd(6, 9), col: '#eaf6ff', a0: 0.9, drag: 0.03 });
    }
  }

  // --- clouds: puffy blocks above and below the bombers ------------------------------------------------
  {
    const cm = new THREE.MeshLambertMaterial({ color: '#ffffff', emissive: '#8a9ab0', transparent: true, opacity: 0.92 });
    const r = (() => { let s = 77; return () => ((s = (s * 16807) % 2147483647) / 2147483647); })();
    for (let i = 0; i < 70; i++) {
      const g = new THREE.Group(), cx = r() * (W.WW + 1200) - 600, cy = r() * (W.WH + 1200) - 600, h = r() < 0.6 ? 120 + r() * 80 : 22 + r() * 18;
      const n = 3 + (r() * 4 | 0);
      for (let k = 0; k < n; k++) { const s = 12 + r() * 18; const b = new THREE.Mesh(new THREE.BoxGeometry(s * 1.6, s * 0.7, s), cm); b.position.set((k - n / 2) * s * 0.8, r() * 5, r() * 14 - 7); g.add(b); }
      g.position.set(cx, h, cy); scene.add(g);
    }
  }

  // --- each frame ---------------------------------------------------------------------------------
  const tmpV = new THREE.Vector3(), up = new THREE.Vector3(), look = new THREE.Vector3();
  let lastMe = null, shake = 0, lastT = 0, muzzleT = 0;
  const camPose = { pos: new THREE.Vector3(W.IX, 60, W.IY), dir: new THREE.Vector3(-1, 0, 0) };
  // the twin guns in front of my eyes (they turn with the view)
  const guns = new THREE.Group();
  for (const s of [-1, 1]) { const b = box(0.05, 0.05, 1.6, '#1c1c22', s * 0.34, -0.5, -2.1); guns.add(b); }
  guns.add(box(0.8, 0.12, 0.3, '#2a2a30', 0, -0.6, -1.4));
  const flash = new THREE.Sprite(new THREE.SpriteMaterial({ map: dot, color: '#ffd060', blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, fog: false }));
  flash.position.set(0, -0.5, -3); flash.scale.setScalar(0.5); flash.visible = false; guns.add(flash);
  camera.add(guns);

  let meId = -1;
  function placePlane(q, dt) {
    let s = planes.get(q.id);
    if (!s) {
      const g = q.type === 0 ? fighterModel(q.side) : bomberModel(q.side);
      g.rotation.order = 'YZX'; scene.add(g);
      s = { g, a: q.a, roll: 0, pitch: 0, z: q.z || 0, spin: 0 };
      planes.set(q.id, s);
    }
    const g = s.g, z = q.state === 'parked' || q.state === 'ground' ? baseY + 1.6 : Math.max(1, q.z || 0);
    const turn = dt > 0 ? angd(q.a, s.a) / dt : 0;
    s.a = q.a;
    const vz = dt > 0 ? (z - s.z) / dt : 0; s.z = z;
    s.pitch += (Math.atan2(vz, Math.max(20, q.v || 40)) - s.pitch) * Math.min(1, dt * 6);
    if (q.state === 'fall') s.spin += dt * 5; else s.roll += (clamp(turn * 0.55, -1.1, 1.1) - s.roll) * Math.min(1, dt * 5);
    g.position.set(q.x, z, q.y);
    g.rotation.set(s.roll + s.spin, -q.a, s.pitch - (q.state === 'fall' ? 0.5 : 0));
    const spinProp = p => { p.rotation.x += dt * 40; };
    if (g.userData.prop) spinProp(g.userData.prop);
    if (g.userData.props) g.userData.props.forEach(spinProp);
    g.visible = true;
    // smoke from hurt and falling planes
    if (q.state === 'fall' || (q.max && q.hp < q.max * 0.5 && q.state === 'air')) {
      s.smokeT = (s.smokeT || 0) - dt;
      const own = q.id === meId, ex = own ? Math.cos(q.a + Math.PI / 2) * 7 : 0, ey = own ? Math.sin(q.a + Math.PI / 2) * 7 : 0;   // mine: from the right engine
      if (s.smokeT <= 0) { s.smokeT = q.state === 'fall' ? 0.03 : 0.08; puff(q.x - Math.cos(q.a) * 5 + ex, q.y - Math.sin(q.a) * 5 + ey, z - (own ? 1 : 0), { vz: 2, life: q.state === 'fall' ? 2.4 : 1.6, s0: 3, s1: 9, col: q.state === 'fall' ? '#2a2626' : '#6a6460', a0: 0.8 }); if (q.state === 'fall' && Math.random() < 0.5) puff(q.x, q.y, z, { life: 0.3, s0: 4, s1: 1, col: '#ff8a20', add: true }); }
    }
    return s;
  }
  const angd = (to, from) => { let d = (to - from) % (Math.PI * 2); if (d > Math.PI) d -= Math.PI * 2; if (d < -Math.PI) d += Math.PI * 2; return d; };
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

  function render(V, me, aim, dt, time, w, h) {
    if (canvas.width !== w || canvas.height !== h) { renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); }
    // the air base
    for (const t of V.targets || []) {
      let m = targetMesh.get(t); if (!m) { m = buildTarget(t); targetMesh.set(t, m); }
      const dead = t.hp <= 0;
      if (dead !== m.dead) { m.dead = dead; m.g.visible = !dead; m.ruin.visible = dead; }
      if (m.g.userData.dish) m.g.userData.dish.rotation.y = time * 1.5;
      if (dead && (m.smokeT -= dt) <= 0) { m.smokeT = 0.12; puff(t.x + rnd(-6, 6), t.y + rnd(-6, 6), baseY + 3, { vz: rnd(8, 14), vx: 3, life: 4, s0: 6, s1: 22, col: '#2e2a28', a0: 0.75 }); if (Math.random() < 0.4) puff(t.x + rnd(-5, 5), t.y + rnd(-5, 5), baseY + 2, { vz: 6, life: 0.6, s0: 5, s1: 2, col: '#ff7a20', add: true }); }
    }
    (V.aa || []).forEach((a, i) => {
      let m = aaMesh[i];
      if (!m) { m = new THREE.Group(); m.add(box(6, 2, 6, '#5a6a3a', 0, 1)); const b = box(7, 0.8, 0.8, '#2a2a2a', 3, 3, 0); m.add(b); m.position.set(a.x, baseY, a.y); scene.add(m); aaMesh[i] = m; }
      m.rotation.y = -a.a; m.children[0].material = M(a.hp > 0 ? '#5a6a3a' : '#2a2622');
    });
    // the planes
    const seen = new Set(); meId = me ? me.id : -1;
    for (const q of V.planes) { if (q.state === 'dead') continue; placePlane(q, dt); seen.add(q.id); }
    for (const [id, s] of planes) if (!seen.has(id)) { scene.remove(s.g); planes.delete(id); }
    // where I sit: on top of my bomber, looking where the guns point
    if (me && me.state !== 'dead') {
      const s = planes.get(me.id);
      s.g.updateMatrixWorld(true);
      camPose.pos.copy(TURRET).applyMatrix4(s.g.matrixWorld);
      up.set(0, 1, 0).applyQuaternion(s.g.quaternion);
      if (lastMe && lastMe.id === me.id && me.hp < lastMe.hp) shake = Math.min(1.2, shake + 0.5);
      lastMe = { id: me.id, hp: me.hp };
      const yw = me.a + Math.PI + aim.gy;
      camPose.dir.set(Math.cos(yw) * Math.cos(aim.gp), Math.sin(aim.gp), Math.sin(yw) * Math.cos(aim.gp));
    } else up.set(0, 1, 0);
    shake = Math.max(0, shake - dt * 2.5);
    camera.position.copy(camPose.pos);
    if (shake > 0) camera.position.add(tmpV.set(rnd(-1, 1), rnd(-1, 1), rnd(-1, 1)).multiplyScalar(shake * 0.4));
    camera.up.copy(up);
    camera.lookAt(look.copy(camera.position).add(camPose.dir));
    sky.position.copy(camera.position);
    // the guns: a flash at the muzzles while they fire
    muzzleT -= dt;
    if (aim.firing) muzzleT = 0.05;
    flash.visible = muzzleT > 0 && Math.floor(time * 30) % 2 === 0;
    flash.scale.setScalar(rnd(0.4, 0.8));
    guns.position.set(0, 0, aim.firing ? rnd(0, 0.08) : 0);
    // tracers
    const tp = tracerGeo.attributes.position.array, tc = tracerGeo.attributes.color.array;
    let n = 0;
    for (const b of V.bullets) {
      if (n >= MAXB) break;
      const z = b.z === undefined ? 60 : b.z, len = 0.045;
      const i = n * 6;
      tp[i] = b.x; tp[i + 1] = z; tp[i + 2] = b.y;
      tp[i + 3] = b.x - b.vx * len; tp[i + 4] = z - (b.vz || 0) * len; tp[i + 5] = b.y - b.vy * len;
      const mine = me && b.owner === me.id, r = mine ? 1 : 1, g = mine ? 0.95 : 0.55, bl = mine ? 0.55 : 0.25;
      tc[i] = r; tc[i + 1] = g; tc[i + 2] = bl; tc[i + 3] = r * 0.6; tc[i + 4] = g * 0.5; tc[i + 5] = bl * 0.3;
      n++;
    }
    tracerGeo.setDrawRange(0, n * 2);
    tracerGeo.attributes.position.needsUpdate = true; tracerGeo.attributes.color.needsUpdate = true;
    // falling bombs
    (V.bombs || []).forEach((b, i) => {
      let m = bombPool[i]; if (!m) { m = box(3, 1, 1, '#2a2a2a'); m.rotation.order = 'YZX'; scene.add(m); bombPool[i] = m; }
      const k = Math.min(1, b.t / W.BOMB_FALL), z0 = b.z0 || 60;
      m.visible = true; m.position.set(b.x, Math.max(0, z0 * (1 - k * k)), b.y);
      m.rotation.set(0, -Math.atan2(b.vy, b.vx), -k * 1.2);
    });
    for (let i = (V.bombs || []).length; i < bombPool.length; i++) bombPool[i].visible = false;
    stepParts(dt);
    renderer.render(scene, camera);
    lastT = time;
    return canvas;
  }

  // where a point of the world is on the screen (for the HUD): { x, y, behind }
  const pv = new THREE.Vector3();
  function project(x, y, z, w, h) {
    pv.set(x, z, y);
    const rel = pv.clone().sub(camera.position), fwd = camera.getWorldDirection(new THREE.Vector3());
    const behind = rel.dot(fwd) < 0;
    pv.project(camera);
    return { x: (pv.x + 1) / 2 * w, y: (1 - pv.y) / 2 * h, behind, d: rel.length() };
  }
  function reset() {
    for (const [, s] of planes) scene.remove(s.g);
    planes.clear();
    for (const p of parts) { p.sp.visible = false; partPool.push(p.sp); }
    parts.length = 0; lastMe = null; shake = 0;
    for (const [, m] of targetMesh) { scene.remove(m.g); scene.remove(m.ruin); }
    targetMesh.clear();
    for (const m of aaMesh) scene.remove(m);
    aaMesh.length = 0;
  }
  return { canvas, render, project, fx, reset };
}

/* Round 3 (#1417): the orbit, refined. Same picture as round 2 (the practice at the centre, every question orbiting it,
   closer is better answered, brighter is searched more, subjects are sectors, a twin system for the best competitor answer)
   with three additions the owner approved:
   1. a subject can be focused: its sector is pickable (wedge + label), the rest dims;
   2. questions leave a comet trail as the time slider pulls them inward (and retract when scrubbed back);
   3. a switch gives the third dimension a job: height above the plane = demand (thin stems, a soft footprint on the plane).
   Polish pass: the two markers are fine screen-sized rings (violet = a competitor answers in full where the practice does
   not, shown close up; teal = the selected question), the rival twin swings in beside a focused subject so the two sectors
   face each other, and one frame(state) rule decides the camera whenever what is on screen changes. */
window.RA3D2.scenes = window.RA3D2.scenes || {};
window.RA3D2.scenes.orbit3 = function build(stage) {
  const { THREE, C, scene } = stage; const K = stage.K; const D = K.D, Q = K.Q;
  const col = (k) => new THREE.Color(C[k]);
  const RING = { covered: 2.6, thin: 5.0, gap: 7.6, absent: 9.6 }; const ARC = 9.0, LBL = 10.1; const HMAX = 3.2;
  const OFF = 31;        // the rival twin beside the practice in the wide view
  const OFF_PAIR = 22;   // the rival twin pulled in while a subject is focused, its sector facing the practice's
  stage.lights.hemi.intensity = 0.5; stage.lights.key.intensity = 0.35; stage.lights.rim.intensity = 0.3;
  const isCompOn = (state) => !!(state.layers && state.layers.comp) && state.reader !== 'client';
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  const order = D.topics.slice().sort((a, b) => (a.tier === b.tier ? b.demand - a.demand : a.tier === 'priority' ? -1 : b.tier === 'priority' ? 1 : a.tier === 'other' ? -1 : 1));
  const total = order.reduce((s, t) => s + t.n, 0); let acc = 0; const GAPA = 0.05;
  const sector = {}; order.forEach(t => { const w = (t.n / total) * (Math.PI * 2 - GAPA * order.length); sector[t.name] = { a0: acc, a1: acc + w, mid: acc + w / 2 }; acc += w + GAPA; });
  const ang = {}; order.forEach(t => { const qs = Q.filter(q => q.topic === t.name).sort((a, b) => ({ covered: 0, thin: 1, gap: 2 }[a.verdict] - { covered: 0, thin: 1, gap: 2 }[b.verdict]) || b.score - a.score); const s = sector[t.name]; const pad = (s.a1 - s.a0) * 0.1; qs.forEach((q, i) => { ang[q.id] = s.a0 + pad + (i + 0.5) / qs.length * (s.a1 - s.a0 - 2 * pad); }); });
  const spread = {}; Q.forEach((q, i) => { spread[q.id] = ((i * 0.6180339) % 1) - 0.5; });
  const rOf = (q, v) => { const base = RING[v]; if (v === 'absent') return base + 0.3 + spread[q.id] * 0.8; return base + spread[q.id] * 1.7; };
  const dmin = Math.min(...D.topics.map(t => t.demand)), dmax = Math.max(...D.topics.map(t => t.demand));
  const rel = (d) => (d - dmin) / Math.max(0.01, dmax - dmin);
  const hOf = (q, state) => state.height === 'demand' ? 0.12 + rel(q.h.demand) * HMAX : 0.12;

  const glowTex = (() => { const cv = document.createElement('canvas'); cv.width = cv.height = 128; const g = cv.getContext('2d'); const r = g.createRadialGradient(64, 64, 0, 64, 64, 64); r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(0.2, 'rgba(255,255,255,.6)'); r.addColorStop(0.55, 'rgba(255,255,255,.12)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, 128, 128); return new THREE.CanvasTexture(cv); })();
  // a fine ring with a soft glow, drawn once; the ring is 3/4 of the sprite's width, so the sprite is sized in screen pixels per frame
  const ringTex = (() => { const cv = document.createElement('canvas'); cv.width = cv.height = 256; const g = cv.getContext('2d');
    g.beginPath(); g.arc(128, 128, 96, 0, Math.PI * 2); g.strokeStyle = 'rgba(255,255,255,.5)'; g.lineWidth = 9; g.shadowColor = 'rgba(255,255,255,1)'; g.shadowBlur = 18; g.stroke();
    g.shadowBlur = 0; g.beginPath(); g.arc(128, 128, 96, 0, Math.PI * 2); g.strokeStyle = '#fff'; g.lineWidth = 3.5; g.stroke();
    return new THREE.CanvasTexture(cv); })();
  const RING_FRAC = 0.75;
  const ringSprite = (hex, opacity) => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: ringTex, color: new THREE.Color(hex), transparent: true, opacity, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending })); s.visible = false; s.renderOrder = 5; return s; };
  const TRAIL_N = 3;

  function makeSystem(ox, who, site) {
    const g = new THREE.Group(); g.position.x = ox; scene.add(g);
    const kind = who === 'practice' ? 'question' : 'rival';
    const ringMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.10 });
    [RING.covered, RING.thin, RING.gap].forEach(r => { const pts = []; for (let i = 0; i <= 180; i++) { const a = i / 180 * Math.PI * 2; pts.push(new THREE.Vector3(Math.cos(a) * r, 0, Math.sin(a) * r)); } g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), ringMat)); });
    const core = new THREE.Mesh(new THREE.SphereGeometry(0.22, 32, 24), new THREE.MeshBasicMaterial({ color: who === 'practice' ? col('own') : col('comp') })); g.add(core);
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: who === 'practice' ? col('own') : col('comp'), transparent: true, opacity: 0.45, depthWrite: false, blending: THREE.AdditiveBlending })); glow.scale.set(2.0, 2.0, 1); g.add(glow);
    const arcMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.22 });
    const arcs = order.map(t => { const s = sector[t.name]; const pts = []; for (let i = 0; i <= 40; i++) { const a = s.a0 + (s.a1 - s.a0) * i / 40; pts.push(new THREE.Vector3(Math.cos(a) * ARC, 0, Math.sin(a) * ARC)); } const l = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), arcMat.clone()); g.add(l); return { t, l }; });
    // pickable sector wedges (invisible until hovered); RingGeometry angles run the other way once laid flat, hence the minus
    const wedges = who === 'practice' ? order.map(t => { const s = sector[t.name]; const m = new THREE.Mesh(new THREE.RingGeometry(1.4, ARC + 0.6, 24, 1, -s.a1, s.a1 - s.a0), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false })); m.rotation.x = -Math.PI / 2; m.position.y = -0.02; m.userData = { type: 'topic', id: t.name }; g.add(m); return { t, m }; }) : [];
    const beadGeo = new THREE.SphereGeometry(1, 20, 16);
    const beads = Q.map(q => {
      const m = new THREE.Mesh(beadGeo, new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.6, roughness: 0.5, transparent: true })); m.userData = { type: kind, id: q.id, site: site || null }; g.add(m); stage.pickables.push(m);
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0xffffff, transparent: true, opacity: 0.6, depthWrite: false, blending: THREE.AdditiveBlending })); g.add(s);
      // the violet mark: a competitor answers this in full, the practice does not (practice system only, legible close up)
      const mark = who === 'practice' ? ringSprite('#A78BFA', 0.85) : null; if (mark) g.add(mark);
      // while a competitor's lens is on: the practice's own spot as a faint ring, and a fine line to where the competitor puts it
      const ghost = who === 'practice' ? ringSprite('#E5E7EB', 0.28) : null; if (ghost) g.add(ghost);
      const gline = who === 'practice' ? new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]), new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false })) : null; if (gline) g.add(gline);
      // height: a thin stem to the plane and a soft footprint where it stands
      const stem = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3(0, 1, 0)]), new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0 })); g.add(stem);
      const foot = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0xffffff, transparent: true, opacity: 0, depthWrite: false })); foot.scale.setScalar(0.5); g.add(foot);
      // the comet trail: a few fading points between where the question started (the outer ring) and where it is now
      const trail = who === 'practice' ? Array.from({ length: TRAIL_N }, () => { const d = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0xffffff, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending })); d.scale.setScalar(0.14); g.add(d); return d; }) : [];
      const tline = who === 'practice' ? new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]), new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false })) : null; if (tline) g.add(tline);
      return { q, m, s, mark, ghost, gline, gr: null, markOn: false, stem, foot, trail, tline, r: RING.absent + 1, tr: RING.absent, y: 0.12, ty: 0.12, a: ang[q.id], life: 0, lastTr: null };
    });
    if (who === 'practice') wedges.forEach(w => stage.pickables.push(w.m));
    // the selected question: a fine luminous teal ring with a slow pulse
    const halo = ringSprite('#99F6E4', 0.9); g.add(halo);
    const at = (x, y, z) => () => g.localToWorld(new THREE.Vector3(x, y, z));   // anchors follow the group when it moves
    const labels = order.map(t => { const s = sector[t.name]; const L = stage.addLabel(at(Math.cos(s.mid) * LBL, 0.15, Math.sin(s.mid) * LBL), t.name, '', who === 'practice' ? 'tp' : ''); if (who === 'practice') { L.el.dataset.topic = t.name; L.el.title = 'Focus this subject'; } return L; });
    // in the paired focus view each name sits over its own half of the facing sectors; otherwise over the centre
    const nameAt = () => { const t = pairMode && pairTopic && sector[pairTopic]; return g.localToWorld(t ? new THREE.Vector3(Math.cos(t.mid) * RING.thin, pairTall ? 0.15 : 1.7, Math.sin(t.mid) * RING.thin) : new THREE.Vector3(0, 1.1, 0)); };
    const nameLbl = stage.addLabel(nameAt, who === 'practice' ? D.practice : site || 'Best competitor answer', who === 'practice' ? `${D.city}, ${D.state}` : site ? 'competitor' : `per question, from ${D.competitors.length} nearby sites`); nameLbl.prio = 2;
    const ringLbls = [['covered', 'answered in full'], ['thin', 'answered in part'], ['gap', 'not answered']].map(([k, w]) => { const L = stage.addLabel(at(0, 0.08, RING[k] + 0.45), w, '', 'q'); L.prio = 1; return L; });
    return { g, kind, site: site || null, beads, arcs, wedges, labels, nameLbl, ringLbls, halo };
  }
  const layers = [];   // named competitor layers (stacked variation), each its own system with that site's answers
  const own = makeSystem(0, 'practice'); const rival = makeSystem(OFF, 'rival'); rival.g.visible = false;
  const absentLbl = stage.addLabel(new THREE.Vector3(0, 0.08, RING.absent + 0.5), 'page not yet in Google', '', 'q');
  const heightLbl = stage.addLabel(new THREE.Vector3(0, HMAX + 0.6, -RING.gap), 'higher dots are searched more often', '', 'q'); heightLbl.hidden = true;

  /* where the rival twin stands: beside the practice in the wide view; pulled in and turned to face the focused sector otherwise */
  const rivalGoal = { x: OFF, z: 0, rot: 0 }; let pairMode = false, pairTopic = null, pairTall = false;
  function layoutRival(state) {
    const t = isCompOn(state) && state.highlightTopic && sector[state.highlightTopic];
    pairMode = !!t; pairTopic = t ? state.highlightTopic : null; pairTall = state.height === 'demand';
    if (t) { rivalGoal.x = Math.cos(t.mid) * OFF_PAIR; rivalGoal.z = Math.sin(t.mid) * OFF_PAIR; rivalGoal.rot = Math.PI; }
    else { rivalGoal.x = OFF; rivalGoal.z = 0; rivalGoal.rot = 0; }
  }
  const snapRival = () => { rival.g.position.set(rivalGoal.x, 0, rivalGoal.z); rival.g.rotation.y = rivalGoal.rot; };
  // a bead's world position from its angle, radius and height, using the twin's goal (not its mid-flight) position
  const worldOf = (sys, a, r, y) => sys === own ? new THREE.Vector3(Math.cos(a) * r, y, Math.sin(a) * r) : new THREE.Vector3(rivalGoal.x + Math.cos(a - rivalGoal.rot) * r, y, rivalGoal.z + Math.sin(a - rivalGoal.rot) * r);

  const fog0 = scene.fog ? { near: scene.fog.near, far: scene.fog.far } : null; let markFade = 1, keyShown = null;
  stage.frameHooks.push((dt, now) => {
    const st = stage.state || {};
    // the rival twin glides to its place
    const k = Math.min(1, dt * 2.6); rival.g.position.x += (rivalGoal.x - rival.g.position.x) * k; rival.g.position.z += (rivalGoal.z - rival.g.position.z) * k;
    let dr = rivalGoal.rot - rival.g.rotation.y; if (Math.abs(dr) > 0.0005) rival.g.rotation.y += dr * k;
    // fog loosens as the camera pulls back, so a far framing never goes faint
    if (fog0 && scene.fog) { scene.fog.near = Math.max(fog0.near, stage.orbit.radius + 6); scene.fog.far = Math.max(fog0.far, stage.orbit.radius + 46); }
    // rings are sized in screen pixels: a fine stroke at any zoom; the violet marks fade out where they would be illegible
    const rect = stage.renderer.domElement.getBoundingClientRect(); const tanH = Math.tan(stage.camera.fov * Math.PI / 360); const H = Math.max(1, rect.height);
    const wpp = (p) => 2 * stage.camera.position.distanceTo(p) * tanH / H;
    markFade = clamp((34 - stage.orbit.radius) / 8, 0, 1); const pulse = 0.5 + 0.5 * Math.sin(now / 1100);
    [own, rival].concat(layers).forEach(sys => { if (!sys.g.visible) return; sys.beads.forEach(b => {
      const d = b.tr - b.r; if (Math.abs(d) > 0.002) b.r += d * Math.min(1, dt * 2.2);
      const dy = b.ty - b.y; if (Math.abs(dy) > 0.002) b.y += dy * Math.min(1, dt * 2.5);
      const bob = Math.sin(now / 1800 + b.a * 7) * 0.05; const cx = Math.cos(b.a), sz = Math.sin(b.a);
      b.m.position.set(cx * b.r, b.y + bob, sz * b.r); b.s.position.copy(b.m.position);
      if (b.mark) { b.mark.visible = b.markOn && markFade > 0.02; if (b.mark.visible) { b.mark.position.copy(b.m.position); const wp = sys.g.localToWorld(b.m.position.clone()); const u = wpp(wp); const beadPx = 2 * b.m.scale.x / u; const px = clamp(beadPx * 2.4 + 10, 20, 40); b.mark.scale.setScalar(px / RING_FRAC * u); b.mark.material.opacity = 0.85 * markFade * (b.dimK || 1); } }
      if (b.ghost) { const on = b.gr != null; b.ghost.visible = on; b.gline.visible = on; if (on) { const gp = new THREE.Vector3(cx * b.gr, b.y, sz * b.gr); b.ghost.position.copy(gp); const u = wpp(sys.g.localToWorld(gp.clone())); b.ghost.scale.setScalar(clamp(2 * b.m.scale.x / u * 1.1 + 3, 6, 11) / RING_FRAC * u); const pa = b.gline.geometry.attributes.position; pa.setXYZ(0, gp.x, gp.y, gp.z); pa.setXYZ(1, b.m.position.x, b.m.position.y, b.m.position.z); pa.needsUpdate = true; b.gline.material.opacity = Math.min(0.5, Math.abs(b.gr - b.r) * 0.12) * (b.dimK || 1); b.gline.material.color.copy(b.m.material.color); } }
      const tall = b.y > 0.4; b.stem.visible = tall; if (tall) { b.stem.position.set(b.m.position.x, 0, b.m.position.z); b.stem.scale.y = b.y + bob - 0.02; }
      b.foot.visible = tall; if (tall) b.foot.position.set(b.m.position.x, 0.01, b.m.position.z);
      if (b.trail.length) {
        if (b.life > 0) b.life = Math.max(0, b.life - dt / 7);
        const r0 = rOf(b.q, 'absent'); const span = r0 - b.r; const show = b.life > 0 && span > 0.25;
        const dimf = st.highlight && !st.highlight.has(b.q.id) ? 0.15 : 1;
        b.tline.visible = show; if (show) { const pa = b.tline.geometry.attributes.position; pa.setXYZ(0, cx * b.r, b.y, sz * b.r); pa.setXYZ(1, cx * r0, 0.12, sz * r0); pa.needsUpdate = true; b.tline.material.opacity = 0.28 * b.life * dimf; }
        b.trail.forEach((t, i) => { if (!show) { t.material.opacity = 0; return; } const f = (i + 1) / (TRAIL_N + 1); const rr = b.r + span * f; t.position.set(cx * rr, b.y * (1 - f) + 0.12 * f, sz * rr); t.material.opacity = b.life * (0.6 - 0.45 * f) * dimf; t.scale.setScalar(0.10 + 0.12 * (1 - f)); });
      }
      if (sys.haloBead === b) { sys.halo.visible = true; sys.halo.position.copy(b.m.position); const wp = sys.g.localToWorld(b.m.position.clone()); const u = wpp(wp); const beadPx = 2 * b.m.scale.x / u; const px = clamp(beadPx * 3 + 14, 28, 52) * (1 + 0.04 * pulse); sys.halo.scale.setScalar(px / RING_FRAC * u); sys.halo.material.opacity = 0.65 + 0.3 * pulse; }
    }); if (!sys.haloBead) sys.halo.visible = false; });
    // the legend line for the violet mark appears exactly when the marks do
    const show = isCompOn(st) && markFade > 0.25 && own.beads.some(b => b.markOn);
    if (show !== keyShown) { keyShown = show; document.querySelectorAll('.comp-key').forEach(el => { el.style.display = show ? '' : 'none'; }); }
  });

  function paintSystem(sys, state, vOf) {
    const hl = state.highlight, hov = state.hoverObj, sel = state.selected; const tall = state.height === 'demand'; sys.haloBead = null;
    const selQ = sel && (sel.type === 'question' || sel.type === 'rival') ? sel.id : null;
    sys.beads.forEach(b => {
      const q = b.q; const v = vOf(q); b.tr = rOf(q, v); b.ty = hOf(q, state);
      if (sys === own) { if (b.lastTr != null && Math.abs(b.lastTr - b.tr) > 0.01) b.life = 1; b.lastTr = b.tr; }
      const dim = hl && !hl.has(q.id); const isHov = hov && hov.type === sys.kind && hov.id === q.id, isSel = selQ === q.id;
      const dimmed = v !== 'absent' && state.layers.local && K.dimmed(q);
      const demand = q.h.demand; const size = 0.07 + demand * 0.08;
      b.m.scale.setScalar(size * (isHov || isSel ? 1.5 : 1));
      const c = col(v); if (dimmed) c.lerp(new THREE.Color(C.bg), 0.35);
      b.m.material.color.copy(c); b.m.material.emissive.copy(c); b.m.material.emissiveIntensity = v === 'covered' ? 0.7 : v === 'thin' ? 0.5 : 0.3;
      b.m.material.opacity = dim ? 0.12 : v === 'absent' ? 0.5 : 1;
      const glow = v === 'covered' ? 0.16 + demand * 0.2 : v === 'thin' ? 0.08 + demand * 0.1 : 0.03;
      b.s.material.color.copy(c); b.s.material.opacity = dim ? 0 : glow; b.s.scale.setScalar(0.5 + demand * 0.8 + (isHov || isSel ? 0.4 : 0));
      b.stem.material.opacity = tall ? (dim ? 0.03 : 0.14) : 0; b.stem.material.color.copy(c);
      b.foot.material.opacity = tall ? (dim ? 0.03 : 0.16) : 0; b.foot.material.color.copy(c); b.foot.scale.setScalar(0.35 + demand * 0.5);
      b.trail.forEach(t => t.material.color.copy(c)); if (b.tline) b.tline.material.color.copy(c);
      b.markOn = sys === own && !state.lens && isCompOn(state) && !!q.comp && q.comp.verdict === 'covered' && v !== 'covered' && !dim; b.dimK = dim ? 0.15 : 1;
      if (b.ghost) { const ownV = K.verdictAt(q, state.week); b.gr = state.lens && !state.noGhost && ownV !== v ? rOf(q, ownV) : null; }
      if (isSel) sys.haloBead = b;
    });
    sys.arcs.forEach(({ t, l }) => { const dim = hl && !Q.some(q => q.topic === t.name && hl.has(q.id)); l.material.opacity = dim ? 0.06 : 0.22; });
    sys.labels.forEach((L, i) => { L.hidden = (sys === rival && pairMode) || (hl && !Q.some(q => q.topic === order[i].name && hl.has(q.id))); L.el.classList.toggle('on', state.highlightTopic === order[i].name); });
    sys.wedges.forEach(({ t, m }) => { const on = hov && hov.type === 'topic' && hov.id === t.name; m.material.opacity = on && !(hl && state.highlightTopic === t.name) ? 0.045 : 0; });
  }

  /* ------- the camera: one rule for every state ------- */
  const homeFor = (state) => state.height === 'demand' ? { center: new THREE.Vector3(0, 0.9, 0), radius: 24, yaw: 0.35, pitch: 0.36 } : { center: stage.home.target, radius: stage.home.radius, yaw: stage.home.yaw, pitch: stage.home.pitch };
  function single(sys, b, state) {
    const tall = state.height === 'demand'; const r = rOf(b.q, sys === own ? K.verdictAt(b.q, state.week) : (b.q.comp ? b.q.comp.verdict : 'gap')); const y = hOf(b.q, state);
    const wa = sys === own ? b.a : b.a - rivalGoal.rot; const c = worldOf(sys, b.a, r, y + 0.1);
    return { center: c, radius: 10.5, yaw: Math.PI / 2 - wa + 0.25, pitch: tall ? 0.48 : 0.62 };
  }
  function sectorView(t, state) {
    const tall = state.height === 'demand'; const bs = own.beads.filter(b => b.q.topic === t.name); const mid = sector[t.name].mid;
    const ymid = tall ? 0.6 + (bs.reduce((a, b) => a + b.q.h.demand, 0) / Math.max(1, bs.length)) * HMAX * 0.5 : 0.2;
    return { center: new THREE.Vector3(Math.cos(mid) * 4.2, ymid, Math.sin(mid) * 4.2), radius: 13, yaw: Math.PI / 2 - mid + 0.3, pitch: tall ? 0.34 : 0.42 };
  }
  function pairView(t, state) {
    // the practice's sector on the left, the rival's (turned to face it) on the right, the camera square to the pair
    const tall = state.height === 'demand'; const mid = sector[t.name].mid;
    const bs = own.beads.filter(b => b.q.topic === t.name); const ymid = tall ? 0.6 + (bs.reduce((a, b) => a + b.q.h.demand, 0) / Math.max(1, bs.length)) * HMAX * 0.5 : 0.1;
    return { center: new THREE.Vector3(Math.cos(mid) * OFF_PAIR / 2, ymid, Math.sin(mid) * OFF_PAIR / 2), radius: 21 * clamp(1.95 / Math.max(0.5, stage.camera.aspect), 1, 1.7), yaw: -mid, pitch: tall ? 0.52 : 0.7 };
  }
  function frame(state) {
    const compOn = isCompOn(state); const sel = state.selected;
    if (sel && (sel.type === 'question' || sel.type === 'rival')) { const sys = sel.type === 'rival' && compOn ? rival : own; const b = sys.beads.find(b => b.q.id === sel.id); if (b) return single(sys, b, state); }
    const t = state.highlightTopic && D.topics.find(x => x.name === state.highlightTopic);
    if (t) return compOn ? pairView(t, state) : sectorView(t, state);
    if (compOn) return { center: new THREE.Vector3(OFF / 2, 0, 0), radius: 40, yaw: 0, pitch: state.height === 'demand' ? 0.5 : 0.8 };
    return homeFor(state);
  }
  let compWas = false, frameKey = null;
  return {
    homeFor, frame, own, sector, ang, rOf, hOf, RING, order,
    addLayer(site, y) { const L = makeSystem(0, 'rival', site); L.g.position.y = y; L.g.visible = false; layers.push(L); return L; },
    update(state) {
      const compOn = isCompOn(state); layoutRival(state);
      if (compOn && !compWas) snapRival(); compWas = compOn;
      rival.g.visible = compOn; rival.nameLbl.hidden = !compOn; rival.ringLbls.forEach(L => L.hidden = true); own.ringLbls.forEach(L => L.hidden = pairMode); if (!compOn) rival.labels.forEach(L => L.hidden = true);
      const lensV = (q, site) => (q.comps && q.comps[site] ? q.comps[site].verdict : 'gap');
      paintSystem(own, state, state.lens ? (q) => lensV(q, state.lens) : (q) => K.verdictAt(q, state.week));
      layers.forEach(L => { L.g.visible = !!(state.layersOn && state.layersOn[L.site]); L.nameLbl.hidden = !L.g.visible; L.ringLbls.forEach(x => x.hidden = true); if (L.g.visible) paintSystem(L, state, (q) => lensV(q, L.site)); L.labels.forEach(x => x.hidden = true); });
      if (compOn) paintSystem(rival, state, (q) => q.comp ? q.comp.verdict : 'gap');
      // whenever what is on screen changes (focus, question, competitors, height), re-frame; a tour or the film holds the camera itself
      const key = [compOn, state.height || 'flat', state.highlightTopic || '', state.selected ? state.selected.type + state.selected.id : ''].join('|');
      if (key !== frameKey) { const first = frameKey === null; frameKey = key; if (!first && !state.touring && !state.locked) { const f = frame(state); stage.flyTo(f.center, f.radius, f.yaw, f.pitch, 2000); } }
      heightLbl.hidden = state.height !== 'demand' || !!state.highlight;
      absentLbl.hidden = state.week === K.LAST;
    },
    focus(ids, s) {
      const st = stage.state;
      if (ids.length === 1) { const b = own.beads.find(b => b.q.id === ids[0]); if (b) return single(own, b, st); }
      if (s && s.topic && sector[s.topic]) return frame(Object.assign({}, st, { highlightTopic: s.topic, selected: null }));
      const bs = ids.map(id => own.beads.find(b => b.q.id === id)).filter(Boolean); const mid = bs.reduce((a, b) => a + b.a, 0) / Math.max(1, bs.length);
      return { center: new THREE.Vector3(Math.cos(mid) * 4.2, 0.2, Math.sin(mid) * 4.2), radius: 13, yaw: Math.PI / 2 - mid + 0.3, pitch: 0.42 };
    },
  };
};

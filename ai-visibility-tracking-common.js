// Shared pieces for the three AI Visibility Tracking mockups (Kari Mann, sample data):
// the look, the sample weeks, plain-word helpers, the top bar, the state switch,
// the Start tracking card, the first-days card, and one hoverable trend chart.
(function () {
  const css = `
:root { --ink:#0B1020; --body:#273043; --muted:#667085; --faint:#98A2B3; --line:#E7E9EE; --soft:#F6F7FA; --up:#15803D; --up-tint:#ECFDF3; --down:#E11D48; --down-tint:#FDECEF;
  --a:#4F46E5; --a-ink:#4338CA; --a-tint:#EEF0FF; --a-band:#E0E3FF; --rose:#DB2777; --rose-ink:#9D174D; --rose-tint:#FDF2F8; --grad:linear-gradient(90deg,#4F46E5,#9333EA); }
* { box-sizing:border-box; } [hidden] { display:none !important; }
body { margin:0; background:#fff; color:var(--body); font:15px/1.55 Inter,system-ui,sans-serif; -webkit-font-smoothing:antialiased; }
button { font:inherit; cursor:pointer; }
a { color:var(--a-ink); text-decoration:underline; text-decoration-color:#C7CBF5; text-underline-offset:3px; }
.mono { font-family:'JetBrains Mono',monospace; }
.shell { max-width:1180px; margin:0 auto; padding:0 28px 150px; }
.mocknote { max-width:1180px; margin:0 auto; padding:14px 28px 0; font-size:12.5px; color:var(--muted); } .mocknote b { color:var(--ink); }
.top { position:sticky; top:0; z-index:20; background:rgba(255,255,255,.95); backdrop-filter:blur(8px); border-bottom:1px solid var(--line); }
.topin { max-width:1180px; margin:0 auto; padding:14px 28px 0; }
.bar { display:flex; align-items:center; justify-content:space-between; gap:16px; }
.brand { display:flex; gap:10px; align-items:center; font:800 15px Inter; color:var(--ink); }
.logo { position:relative; width:26px; height:26px; border-radius:50%; background:var(--grad); }
.logo::after { content:''; position:absolute; inset:7px; border-radius:50%; border:2px dotted #fff; }
.who { font-size:14px; color:var(--muted); display:flex; gap:14px; align-items:center; } .who b { color:var(--ink); }
.measure { background:none; border:0; color:var(--a-ink); font-weight:600; font-size:14px; padding:0; }
.tabs { display:flex; gap:26px; margin-top:12px; }
.tab { background:none; border:0; padding:10px 0 12px; font:600 15px Inter; color:var(--muted); border-bottom:2px solid transparent; }
.tab.on { color:var(--ink); border-bottom-color:var(--a); }
.live { display:inline-block; width:7px; height:7px; border-radius:50%; background:#16A34A; margin-left:7px; vertical-align:2px; }
.eyebrow { font:700 11px Inter; letter-spacing:.12em; text-transform:uppercase; color:var(--a-ink); } .eyebrow.grey { color:var(--muted); }
h1.big { margin:12px 0 14px; font:900 46px/1.08 Inter; letter-spacing:-.03em; color:var(--ink); max-width:760px; }
h2.mid { margin:8px 0 10px; font:800 28px/1.2 Inter; letter-spacing:-.02em; color:var(--ink); max-width:720px; }
.grad { background:var(--grad); -webkit-background-clip:text; background-clip:text; color:transparent; }
.lede { font-size:18px; line-height:1.6; max-width:640px; margin:0 0 10px; }
.small { font-size:13.5px; color:var(--muted); }
.up { color:var(--up); } .down { color:var(--down); }
.btn { border:1px solid var(--line); background:#fff; border-radius:8px; padding:9px 14px; font-weight:600; color:var(--ink); }
.btn.go { background:var(--ink); border-color:var(--ink); color:#fff; padding:12px 18px; }
.aidot { display:inline-block; width:8px; height:8px; border-radius:50%; margin-right:7px; vertical-align:1px; }
.tip { position:relative; border-bottom:1px dotted var(--faint); cursor:help; }
.tip .tipbox { display:none; position:absolute; left:0; top:calc(100% + 8px); z-index:30; width:300px; background:#fff; border:1px solid var(--line); border-radius:10px; box-shadow:0 10px 30px rgba(16,24,40,.12); padding:12px 14px; font:400 13.5px/1.5 Inter; color:var(--body); text-transform:none; letter-spacing:0; }
.tip .tipbox b { display:block; color:var(--a-ink); font-weight:700; margin-bottom:3px; }
.tip:hover .tipbox { display:block; }
.statebar { position:fixed; left:50%; bottom:18px; transform:translateX(-50%); z-index:40; display:flex; gap:4px; align-items:center; background:#0B1020; border-radius:10px; padding:5px; box-shadow:0 10px 30px rgba(16,24,40,.25); }
.statebar span { color:#98A2B3; font-size:12px; padding:0 8px 0 6px; }
.statebar button { background:none; border:0; color:#D0D5DD; border-radius:7px; padding:7px 12px; font-size:13px; font-weight:600; }
.statebar button.on { background:#fff; color:var(--ink); }
.startcard { max-width:720px; margin:70px 0; }
.startcard .facts { display:grid; grid-template-columns:repeat(3,1fr); gap:1px; background:var(--line); border:1px solid var(--line); border-radius:12px; overflow:hidden; margin:26px 0; }
.startcard .facts div { background:#fff; padding:16px 18px; } .startcard .facts b { display:block; font:800 22px Inter; color:var(--ink); }
.firstdays { max-width:760px; margin:60px 0; }
.daydots { display:flex; gap:10px; margin:22px 0 10px; }
.daydots i { width:30px; height:30px; border-radius:50%; background:var(--soft); border:1px dashed #D0D5DD; display:grid; place-items:center; font:600 11px Inter; font-style:normal; color:var(--faint); }
.daydots i.done { background:var(--a); border:0; color:#fff; }
.chart { position:relative; } .chart svg { display:block; width:100%; overflow:visible; }
.chart .hover { position:absolute; pointer-events:none; background:#fff; border:1px solid var(--line); border-radius:10px; box-shadow:0 10px 30px rgba(16,24,40,.12); padding:9px 12px; font-size:13px; width:230px; display:none; z-index:10; }
.chart .hover b { color:var(--ink); }
.modal { position:fixed; inset:0; background:rgba(11,16,32,.35); z-index:50; display:grid; place-items:center; }
.modal .box { background:#fff; border-radius:14px; max-width:620px; padding:28px 30px; max-height:85vh; overflow:auto; }
.modal h3 { margin:0 0 8px; font:800 22px Inter; color:var(--ink); } .modal h4 { margin:18px 0 4px; color:var(--ink); }
@media (max-width:900px) { h1.big { font-size:34px; } .startcard .facts { grid-template-columns:1fr; } }
`;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  const PRACTICE = 'Kari Mann Dental Studio';
  const AIS = [
    { key: 'chatgpt', name: 'ChatGPT', dot: '#10A37F', w: [45, 44, 46, 45, 47, 48, 47, 49] },
    { key: 'gemini', name: 'Gemini', dot: '#3B82F6', w: [26, 27, 25, 28, 33, 36, 38, 39] },
    { key: 'aio', name: 'AI Overviews', dot: '#EA4335', w: [23, 22, 24, 23, 25, 24, 26, 25] },
    { key: 'aimode', name: 'AI Mode', dot: '#8B5CF6', w: [36, 35, 37, 36, 41, 44, 45, 46] },
    { key: 'perplexity', name: 'Perplexity', dot: '#64748B', w: [42, 43, 41, 42, 43, 35, 36, 37] },
  ];
  const WEEKS = ['Nov 1', 'Nov 8', 'Nov 15', 'Nov 22', 'Nov 29', 'Dec 6', 'Dec 13', 'Dec 20'];
  const OVERALL = WEEKS.map((_, i) => Math.round(AIS.reduce((t, a) => t + a.w[i], 0) / AIS.length));
  const SERVICES = [
    { name: 'Veneers', q: 3, w: [21, 22, 20, 24, 38, 49, 55, 58], note: 'veneers page published Nov 27' },
    { name: 'Sedation', q: 4, w: [52, 51, 53, 50, 52, 51, 53, 52] },
    { name: 'Frenectomy', q: 2, w: [66, 67, 65, 68, 66, 67, 69, 68] },
    { name: 'Implants', q: 4, w: [40, 41, 39, 42, 40, 43, 41, 44] },
    { name: 'Whitening', q: 3, w: [42, 40, 43, 41, 42, 44, 43, 45] },
    { name: 'Gum disease', q: 3, w: [24, 25, 23, 24, 26, 25, 27, 26] },
    { name: 'Cleanings', q: 2, w: [30, 29, 31, 30, 32, 31, 33, 32] },
    { name: 'Best dentist', q: 3, w: [17, 18, 16, 19, 18, 20, 21, 22] },
    { name: 'Emergency', q: 3, w: [3, 2, 4, 3, 2, 3, 2, 3] },
  ];
  const RIVALS = [
    { name: PRACTICE, me: true, w: [93, 94, 95, 94, 99, 101, 103, 104] },
    { name: 'Cape Dental Care', w: [69, 70, 68, 69, 67, 66, 66, 65] },
    { name: 'Smile Cape Coral', w: [39, 41, 44, 46, 49, 52, 54, 56] },
    { name: 'Waterside Aesthetic Dentistry', w: [10, 9, 10, 11, 10, 9, 10, 10] },
  ];
  const MARKERS = [
    { week: 3, at: 3 + 5 / 7, kind: 'work', text: 'Veneers page published (Nov 27)', detail: 'Published through OpenedQueries: /cosmetic/porcelain-veneers' },
    { week: 5, at: 5 + 1 / 7, kind: 'method', text: 'Perplexity updated its search (Dec 7)', detail: 'Perplexity moved to a newer version of its fast search. Its line drops the same week for every practice: a change in how it answers, not in how it sees Kari Mann Dental Studio.' },
  ];
  const ANSWERS_PER_WEEK = 1890;   // 27 questions (branded left out) x 5 AIs x 14 asks a week
  const PRICE = 34;                // 30 questions, 5 AIs, twice a day, answers read: from Kari Mann's real Oct 28 costs

  /** Seeded daily values around a weekly line, so the faint day dots look real and stay put. */
  function days(weekly, wobble = 5, seed = 7) {
    let s = seed; const rnd = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
    return weekly.flatMap((w) => Array.from({ length: 7 }, () => Math.max(0, Math.round(w + (rnd() - 0.5) * 2 * wobble))));
  }
  /** "about 4 in every 10" from a per-100 number. */
  const inTen = (per100) => `about ${Math.round(per100 / 10)} in every 10`;
  /** The likely range for a week, from its per-100 rate and how many answers it rests on (plain-word wording, no stat terms). */
  function exact(per100, n) {
    const p = per100 / 100, z = 1.96, d = 1 + (z * z) / n, c = p + (z * z) / (2 * n), m = z * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n));
    return [((c - m) / d) * 100, ((c + m) / d) * 100];
  }
  const range = (per100, n) => exact(per100, n).map(Math.round);
  const rangeTip = (per100, n) => {
    const [lo, hi] = range(per100, n);
    return `<b>Likely ${lo} to ${hi} times in every 100</b>AI answers vary each time the same question is asked. This week rests on ${n.toLocaleString()} answers; asking the same questions all over again would most likely land between ${lo} and ${hi}. A change counts as real only when it moves past that range.`;
  };
  /** Real change: this week's likely range no longer overlaps the first week's. */
  function realChange(w, n) {
    const [a0, a1] = exact(w[0], n), [b0, b1] = exact(w[w.length - 1], n);
    return b0 > a1 ? 'up' : b1 < a0 ? 'down' : 'steady';
  }

  function topbar(el, { mock, onMeasure, note, tab = 'Tracking' }) {
    el.innerHTML = `<div class="mocknote"><b>Mockup ${mock}.</b> ${note || 'Sample data: what Kari Mann Dental Studio\'s Tracking could look like 8 weeks in (Nov 1 to Dec 26), starting from the real Oct 28 Snapshot. Use the bar at the bottom to switch states.'}</div>
    <div class="top"><div class="topin"><div class="bar"><div class="brand"><span class="logo"></span>AI Visibility</div>
      <div class="who"><button class="measure">How we measure</button><span><b>${PRACTICE}</b> · Snapshot Oct 28</span></div></div>
      <div class="tabs">${['Story', 'Answers', 'Insights', 'Tracking'].map((t) => `<button class="tab ${t === tab ? 'on' : ''}">${t}${t === 'Tracking' ? '<span class="live" data-live></span>' : ''}</button>`).join('')}</div></div></div>`;
    el.querySelector('.measure').onclick = onMeasure || measure;
  }

  function measure() {
    const m = document.createElement('div'); m.className = 'modal';
    m.innerHTML = `<div class="box"><h3>How Tracking measures</h3>
      <p>Twice a day, morning and evening, every tracked question goes to all five AIs: ChatGPT, Gemini, AI Overviews, AI Mode and Perplexity. That is 14 asks of each question on each AI every week.</p>
      <h4>Why a week, never a day</h4><p>AI gives a different answer each time the same question is asked. One day is a handful of answers and swings for no reason. A week of answers (${ANSWERS_PER_WEEK.toLocaleString()} for ${PRACTICE}) is steady enough to read.</p>
      <h4>"About 4 in every 10"</h4><p>Out of every 10 answers, how many named ${PRACTICE}. Branded questions (the ones with the practice's name in them) are left out, since AI names the practice there almost every time.</p>
      <h4>"Likely 35 to 39 times in every 100"</h4><p>If the same questions were asked all over again, the count would most likely land in this range. A change counts as real only when it moves past the range; anything inside it is normal wobble.</p>
      <h4>Markers</h4><p>A grey flag marks a change in how an AI answers (a new version), which moves the line for every practice. An indigo flag marks work we did, such as a page published through OpenedQueries.</p>
      <p style="margin-top:18px"><button class="btn">Close</button></p></div>`;
    m.onclick = (e) => { if (e.target === m || e.target.tagName === 'BUTTON') m.remove(); };
    document.body.appendChild(m);
  }

  function stateBar(states, start, go) {
    const b = document.createElement('div'); b.className = 'statebar';
    b.innerHTML = `<span>Prototype</span>${states.map(([k, l]) => `<button data-k="${k}">${l}</button>`).join('')}`;
    b.onclick = (e) => { const k = e.target.dataset?.k; if (k) pick(k); };
    const pick = (k) => { b.querySelectorAll('button').forEach((x) => x.classList.toggle('on', x.dataset.k === k)); window.scrollTo({ top: 0 }); go(k); };
    document.body.appendChild(b); pick(start);
  }

  function startCard(onStart) {
    return `<section class="startcard"><div class="eyebrow">Tracking</div>
      <h1 class="big">See what moves for ${PRACTICE}, week by week.</h1>
      <p class="lede">The Snapshot is one moment. Tracking asks the same 30 questions on all five AIs twice a day, so a real change (a new page landing, a rival gaining) shows up as a change, and one lucky day doesn't.</p>
      <div class="facts"><div><b>Twice a day</b><span class="small">Morning and evening, every AI</span></div><div><b>Nov 8</b><span class="small">First weekly number, after a full week of answers</span></div><div><b>About $${PRICE} a month</b><span class="small">30 questions, answers read for Insights</span></div></div>
      <button class="btn go" data-start>Start tracking ${PRACTICE}</button>
      <p class="small" style="margin-top:12px">Clients only; prospects get Snapshots. Anyone on the team can stop it. The 30 questions are the Snapshot's; edit them on the Story's setup and Tracking marks the day they changed.</p></section>`;
  }

  function firstDays() {
    return `<section class="firstdays"><div class="eyebrow">Tracking since Nov 1 · day 3 of 7</div>
      <h1 class="big">The first weekly number comes on Nov 8.</h1>
      <p class="lede">Three days of answers are in (810 so far). One week is the shortest stretch steady enough to read, so the page waits rather than show a number that could swing either way.</p>
      <div class="daydots">${['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((d, i) => `<i class="${i < 3 ? 'done' : ''}">${d}</i>`).join('')}</div>
      <p class="small">Until then, the Oct 28 Snapshot is the starting point: AI named ${PRACTICE} in about 3 in every 10 answers. <a href="#">See the Snapshot's Story</a></p>
      <p class="small">$3.30 spent so far this month · <a href="#">Stop tracking</a></p></section>`;
  }

  /**
   * One trend chart: weekly line(s) with the likely-range band for the lead line,
   * faint day dots, markers, and a hover card per week. lines: [{name, w, color, lead?}].
   */
  function trend(el, { lines, n, height = 240, days: dayVals = null, markers = MARKERS, max = null, labels = WEEKS, fmt = inTen, axis = (v) => `${Math.round(v / 10)} in 10`, unit = 'answers', mini = false }) {
    const W = mini ? 300 : 700, H = height, L = 8, R = mini ? 64 : 50, T = 26, B = 30, fs = mini ? 12 : 11;
    const top = max ?? Math.ceil((Math.max(...lines.flatMap((l) => l.w), ...(dayVals || [])) + 6) / 10) * 10;
    const x = (i) => L + (i / (labels.length - 1)) * (W - L - R), y = (v) => T + (1 - v / top) * (H - T - B);
    const lead = lines.find((l) => l.lead) || lines[0];
    const band = lead.w.map((v) => range(v, n));
    const area = band.map(([lo], i) => `${x(i)},${y(lo)}`).concat(band.map(([, hi], i) => `${x(i)},${y(hi)}`).reverse()).join(' ');
    const dayDots = dayVals ? dayVals.slice(0, 7 * (labels.length - 1) + 1).map((v, d) => `<circle cx="${x(d / 7)}" cy="${y(v)}" r="2" fill="#C7CBF5"/>`).join('') : '';
    const mk = markers.map((m) => `<g><line x1="${x(m.at)}" x2="${x(m.at)}" y1="${T - 14}" y2="${H - B}" stroke="${m.kind === 'work' ? '#A5B4FC' : m.kind === 'track' ? '#667085' : '#D0D5DD'}" stroke-dasharray="3 3"/>
      <rect x="${x(m.at) - 5}" y="${T - 22}" width="10" height="10" rx="2" fill="${m.kind === 'work' ? '#4F46E5' : m.kind === 'track' ? '#0B1020' : '#98A2B3'}" ${m.kind === 'track' ? `transform="rotate(45 ${x(m.at)} ${T - 17})"` : ''}/></g>`).join('');
    const grid = [0, 0.5, 1].map((f) => { const v = Math.round(top * f); return `<line x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}" stroke="#F2F4F7"/><text x="${W - R + 8}" y="${y(v) + 4}" font-size="${fs}" fill="#98A2B3">${axis(v)}</text>`; }).filter((_, k) => !mini || k !== 1).join('');
    const paths = lines.map((l) => `<polyline points="${l.w.map((v, i) => `${x(i)},${y(v)}`).join(' ')}" fill="none" stroke="${l.color}" stroke-width="${l.lead ? 2.5 : 2}" stroke-linejoin="round"/>
      ${l.w.map((v, i) => `<circle cx="${x(i)}" cy="${y(v)}" r="${l.lead ? 4 : 3}" fill="${l.color}" stroke="#fff" stroke-width="2"/>`).join('')}`).join('');
    const xl = labels.map((w, i) => (mini && i > 0 && i < labels.length - 1 ? '' : `<text x="${x(i)}" y="${H - 8}" font-size="${fs}" fill="#98A2B3" text-anchor="${mini ? (i ? 'end' : 'start') : 'middle'}">${w}</text>`)).join('');
    el.classList.add('chart');
    el.innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Weekly trend"><g>${grid}</g><polygon points="${area}" fill="${lead.band || '#E0E3FF'}" opacity=".7"/>${dayDots}${mk}${paths}${xl}
      ${labels.map((_, i) => `<rect data-i="${i}" x="${x(i) - (W / labels.length) / 2}" y="0" width="${W / labels.length}" height="${H}" fill="transparent"/>`).join('')}</svg><div class="hover"></div>`;
    const hv = el.querySelector('.hover');
    el.querySelectorAll('rect[data-i]').forEach((r) => {
      r.addEventListener('mouseenter', () => {
        const i = +r.dataset.i, [lo, hi] = band[i], m = markers.find((k) => Math.floor(k.at) === i);
        hv.innerHTML = `<b>Week of ${labels[i]}</b><br>${lines.map((l) => `<span class="aidot" style="background:${l.color}"></span>${l.name}: ${fmt(l.w[i])}`).join('<br>')}
          <div class="small" style="margin-top:6px">${lead.name}: likely ${lo} to ${hi} times in every 100, from ${n.toLocaleString()} ${unit}.</div>${m ? `<div class="small" style="margin-top:6px;color:${m.kind === 'work' ? '#4338CA' : '#667085'}">${m.text}</div>` : ''}`;
        const px = (x(i) / W) * el.clientWidth; hv.style.left = `${Math.min(Math.max(px - 115, 0), el.clientWidth - 230)}px`; hv.style.top = '10px'; hv.style.display = 'block';
      });
      r.addEventListener('mouseleave', () => { hv.style.display = 'none'; });
    });
  }

  window.TRK = { PRACTICE, AIS, WEEKS, OVERALL, SERVICES, RIVALS, MARKERS, ANSWERS_PER_WEEK, PRICE, days, inTen, range, rangeTip, realChange, topbar, measure, stateBar, startCard, firstDays, trend };
})();

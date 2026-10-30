/* Story chapter 05 mockups (#1377, 10/30): how AI describes the practice, from the praise themes and the concern.
   Real data: window.DV2 (ai-visibility-described-data.js, Kari Mann's Oct 28 Snapshot). Chapters 04 and 06 are
   stand-ins (grey dots only) so the dots can be seen gliding into chapter 05 and out again, as on the live Story. */
(function () {
  const css = `
.story { display:grid; grid-template-columns:minmax(0,1fr) 520px; gap:56px; }
.chap { min-height:86vh; display:flex; flex-direction:column; justify-content:center; padding:20px 0; opacity:.25; transition:opacity .4s; }
.chap.active { opacity:1; }
.chap .k { font:700 12px Inter; letter-spacing:.14em; text-transform:uppercase; color:#4338CA; margin-bottom:12px; }
.chap h2 { font:900 42px/1.1 Inter; letter-spacing:-.025em; color:#0B1020; margin:0; }
.chap p { font-size:18px; line-height:1.6; color:#273043; max-width:520px; margin:16px 0 0; }
.chap .note { font-size:14px; color:#667085; margin-top:12px; }
.praise { color:#15803D; } .warn { color:#E11D48; }
.stand { color:#98A2B3; font-weight:600; }
.fig { position:sticky; top:124px; height:calc(100vh - 144px); display:flex; flex-direction:column; align-items:center; justify-content:center; }
.fig svg { width:100%; overflow:visible; }
.fig circle { transition:cx .9s cubic-bezier(.2,.8,.2,1), cy .9s cubic-bezier(.2,.8,.2,1), r .5s, fill .5s; }
.fig .labels { transition:opacity .35s; }
.figcap { margin-top:8px; min-height:20px; text-align:center; font-size:13px; color:#667085; max-width:460px; }
.themes { margin:20px 0 0; max-width:520px; }
.themes div { display:flex; justify-content:space-between; gap:12px; padding:8px 0; border-top:1px solid #F0F2F5; font-size:15.5px; color:#0B1020; }
.themes div span:last-child { color:#667085; white-space:nowrap; }
.concern { margin:22px 0 0; max-width:520px; border:1px solid #E7E9EE; border-radius:10px; padding:16px 18px; }
.concern .h { font:800 16px Inter; color:#E11D48; margin-bottom:4px; }
.concern .s { font-size:14.5px; color:#273043; margin:0 0 10px; }
.concern blockquote { margin:0 0 12px; padding:10px 12px; background:#FDECEF; border-radius:8px; font-size:14px; color:#0B1020; line-height:1.5; }
.concern blockquote cite { display:block; margin-top:6px; font:500 12.5px Inter; font-style:normal; color:#667085; }
.worthrow { display:flex; gap:14px; align-items:center; padding-top:12px; border-top:1px solid #F0F2F5; font-size:14px; color:#273043; }
.worthrow b { color:#0B1020; } .worthrow .act { margin-left:auto; flex:none; display:flex; gap:10px; align-items:center; }
.made { display:inline-flex; gap:6px; align-items:center; font:600 13.5px Inter; color:#15803D; white-space:nowrap; }
.made::before { content:''; width:7px; height:7px; border-radius:50%; background:#16A34A; }
.also { font-size:14px; color:#667085; margin-top:12px; max-width:520px; }
.statebar2 { position:fixed; left:50%; bottom:18px; transform:translateX(-50%); z-index:40; display:flex; gap:4px; align-items:center; background:#0B1020; border-radius:10px; padding:5px; box-shadow:0 10px 30px rgba(16,24,40,.25); }
.statebar2 span { color:#98A2B3; font-size:12px; padding:0 8px 0 6px; }
.statebar2 button { background:none; border:0; color:#D0D5DD; border-radius:7px; padding:7px 12px; font-size:13px; font-weight:600; }
.statebar2 button.on { background:#fff; color:#0B1020; }
.toast2 { position:fixed; left:50%; bottom:72px; transform:translateX(-50%); background:#0B1020; color:#fff; padding:10px 14px; border-radius:10px; font-size:13px; opacity:0; transition:opacity .25s; z-index:45; pointer-events:none; }
.toast2.on { opacity:1; }
@media (max-width:980px) { .story { grid-template-columns:1fr; } .fig { position:relative; top:0; height:auto; } .chap { min-height:auto; opacity:1; padding:40px 0; } }
`;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  const D = window.DV2;
  const P = 'Kari Mann Dental Studio';
  const AI = { chatgpt: ['ChatGPT', '#10A37F'], gemini: ['Gemini', '#3B82F6'], aio: ['AI Overviews', '#EA4335'], aimode: ['AI Mode', '#8B5CF6'], perplexity: ['Perplexity', '#64748B'] };
  const FILL = { on: '#4F46E5', off: '#E4E7EC', muted: '#B6BCC8', hide: 'rgba(0,0,0,0)', good: '#16A34A', plain: '#C3C8D2', bad: '#E11D48' };
  const DOTS = 150;
  const INK = '#273043';
  const GREEN = '#15803D';
  const RED = '#E11D48';
  const top = D.concerns[0];
  const rest = D.concerns.slice(1);
  const lower = (s) => s[0].toLowerCase() + s.slice(1);
  const n = (x) => x.toLocaleString();
  /** every answer that raised a concern, any question (like the themes' counts; "answers" alone is only questions naming the practice) */
  const said = (c) => c.answers + c.elsewhere;
  const pad = (dots) => { const out = dots.slice(0, DOTS); while (out.length < DOTS) out.push({ x: 250, y: 235, look: 'hide' }); return out; };

  // ---- the neighbours (stand-ins, no data) ----
  function standIn04() {
    const dots = []; const lens = [16, 13, 11, 9, 8, 7, 6, 5, 4];
    lens.forEach((len, g) => { for (let j = 0; j < len; j += 1) dots.push({ x: 190 + j * 13, y: 40 + g * 44, look: g === 0 ? 'on' : 'muted' }); });
    return { dots: pad(dots), labels: lens.map((_, g) => ({ x: 0, y: 44 + g * 44, text: g === 0 ? P : 'practice', size: 12.5, weight: g === 0 ? 800 : 600, color: g === 0 ? '#4338CA' : '#98A2B3' })),
      caption: 'Stand-in for chapter 04 as live (AI Share of Voice). Scroll down to see the dots move.' };
  }
  function standIn06() {
    const dots = []; const cols = [14, 11, 9, 8, 6, 5, 4, 3, 3, 2];
    cols.forEach((h, c) => { for (let j = 0; j < h; j += 1) dots.push({ x: 40 + c * 46, y: 400 - j * 24, look: c === 0 ? 'on' : 'muted' }); });
    return { dots: pad(dots), labels: [], caption: 'Stand-in for chapter 06 as live (the sites AI cites).' };
  }

  // ---- the figure engine: 150 circles that glide between formations ----
  function figure(el) {
    el.innerHTML = '<svg viewBox="0 0 500 470" role="img"></svg><div class="figcap"></div>';
    const svg = el.querySelector('svg'); const cap = el.querySelector('.figcap');
    const NS = 'http://www.w3.org/2000/svg';
    const circles = Array.from({ length: DOTS }, () => { const c = document.createElementNS(NS, 'circle'); c.setAttribute('cx', 250); c.setAttribute('cy', 235); c.setAttribute('r', 4.2); c.setAttribute('fill', FILL.hide); svg.appendChild(c); return c; });
    let g = document.createElementNS(NS, 'g'); svg.appendChild(g);
    return (f) => {
      f.dots.forEach((d, i) => { const c = circles[i]; c.setAttribute('cx', d.x); c.setAttribute('cy', d.y); c.setAttribute('r', d.big ? 9 : 4.2); c.setAttribute('fill', FILL[d.look]); });
      const old = g; old.style.opacity = 0; setTimeout(() => old.remove(), 350);
      g = document.createElementNS(NS, 'g'); g.setAttribute('class', 'labels'); g.style.opacity = 0;
      f.labels.forEach((l) => { const t = document.createElementNS(NS, 'text'); Object.entries({ x: l.x, y: l.y, 'font-size': l.size, 'font-weight': l.weight, fill: l.color, 'text-anchor': l.anchor || 'start' }).forEach(([k, v]) => t.setAttribute(k, v)); t.style.fontFamily = 'Inter, sans-serif'; t.textContent = l.text; g.appendChild(t); });
      svg.appendChild(g); requestAnimationFrame(() => requestAnimationFrame(() => { g.style.opacity = 1; }));
      cap.textContent = f.caption;
    };
  }

  // ---- chapter 05's left side ----
  const byAiLine = (c) => {
    const every = c.by_ai.filter((b) => b.answers === b.of).map((b) => AI[b.surface][0]);
    return every.length >= 2 ? ` ${every.slice(0, -1).join(', ')} and ${every.at(-1)} raise it every time a question names ${P}.` : '';
  };
  const headline = () => `AI <span class="praise">speaks well</span> of ${P}. It warns about <span class="warn">${lower(top.name)}</span>.`;
  const themeList = () => `<div class="themes">${D.themes.map((t) => `<div><span>${t.name}</span><span>${n(t.answers)} answers</span></div>`).join('')}</div>`;
  const praiseSentence = () => {
    const names = D.themes.slice(0, 3).map((t) => lower(t.name).replace(/, /g, ' and '));
    return `Of the ${n(D.named)} answers that name ${P}, ${n(D.tone.positive)} praise it and ${n(D.tone.neutral)} just list it. What AI praises most: ${names[0]}, ${names[1]}, ${names[2]}.`;
  };
  function concernCard(state) {
    const q = top.quotes.find((x) => top.by_ai.some((b) => b.surface === x.surface && b.answers === b.of)) || top.quotes[0];
    const act = state === 'made'
      ? '<span class="made">Task made</span><a href="#" onclick="return false">Open in Asana</a>'
      : '<button class="btn" data-make>Make a task</button>';
    return `<div class="concern"><div class="h">${top.name}</div>
      <p class="s">Raised in ${n(said(top))} answers.${byAiLine(top)}</p>
      <blockquote>"${q.text}"<cite>${AI[q.surface][0]} · "${q.question}"</cite></blockquote>
      <div class="worthrow"><span><b>Worth doing:</b> ${top.suggestion.replace(/^The practice could /, '').replace(/^./, (c) => c.toUpperCase())}</span><span class="act">${act}</span></div></div>
      ${rest.length ? `<p class="also">Now and then AI also mentions ${rest.map((c) => `${lower(c.name)} (${n(said(c))} answers)`).join(' and ')}. Both are on the Insights tab.</p>` : ''}`;
  }

  /** Build the page: chapters 04 (stand-in), 05 (this variation), 06 (stand-in); the sticky figure; the task-state switch. */
  function page({ mock, note, left, formation }) {
    TRK.topbar(document.getElementById('top'), { mock, tab: 'Story', note });
    const m = document.getElementById('m');
    m.innerHTML = `<div class="story"><div>
      <section class="chap" data-k="c4"><div class="k">04 · AI Share of Voice</div><h2 class="stand">Chapter 04 as live.</h2><p class="stand">A stand-in so the dots can be seen moving into chapter 05.</p></section>
      <section class="chap" data-k="c5"><div class="k">05 · How AI describes ${P}</div><h2>${headline()}</h2><div id="left5"></div></section>
      <section class="chap" data-k="c6"><div class="k">06 · Where AI gets its facts</div><h2 class="stand">Chapter 06 as live.</h2><p class="stand">A stand-in so the dots can be seen moving out of chapter 05.</p></section>
    </div><div class="fig" id="fig"></div></div>`;
    const draw = figure(document.getElementById('fig'));
    const forms = { c4: standIn04(), c5: formation(), c6: standIn06() };
    let state = 'none';
    const paint = () => {
      document.getElementById('left5').innerHTML = left(state);
      const b = document.querySelector('[data-make]');
      if (b) b.onclick = () => toast('In the app this opens the standard task dialog (No week, This week, Next week), filled in. Saved, it shows Task made.');
    };
    paint();
    const chaps = [...document.querySelectorAll('.chap')];
    const setActive = (k) => { chaps.forEach((c) => c.classList.toggle('active', c.dataset.k === k)); draw(forms[k]); };
    let current = null;
    const io = new IntersectionObserver((es) => { es.forEach((e) => { if (e.isIntersecting && e.target.dataset.k !== current) { current = e.target.dataset.k; setActive(current); } }); }, { rootMargin: '-45% 0px -45% 0px' });
    chaps.forEach((c) => io.observe(c));
    setActive('c4'); current = 'c4';
    const bar = document.createElement('div'); bar.className = 'statebar2';
    bar.innerHTML = '<span>Prototype</span><button data-s="none">No task yet</button><button data-s="made">Task made</button>';
    const pick = (s) => { state = s; bar.querySelectorAll('button').forEach((x) => x.classList.toggle('on', x.dataset.s === s)); paint(); };
    bar.onclick = (e) => { const s = e.target.dataset?.s; if (s) pick(s); };
    document.body.appendChild(bar); pick('none');
    const t = document.createElement('div'); t.className = 'toast2'; document.body.appendChild(t);
    let tm; function toast(msg) { t.textContent = msg; t.classList.add('on'); clearTimeout(tm); tm = setTimeout(() => t.classList.remove('on'), 3200); }
  }

  window.CH5 = { D, P, AI, top, rest, n, said, lower, pad, INK, GREEN, RED, headline, themeList, praiseSentence, concernCard, page };
})();

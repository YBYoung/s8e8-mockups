/* Shared parts for the "How AI describes it" variations (10/29): sentiment colours, AI names, the quote box,
   the verdict header. Data: window.DV2 (ai-visibility-described-data.js, Kari Mann real). */
(function () {
  const css = `
:root { --praise:#15803D; --praise-tint:#ECFDF3; --list:#98A2B3; --list-tint:#F2F4F7; --warn:#E11D48; --warn-tint:#FDECEF; }
.sec { padding:40px 0 60px; }
.sec .head { max-width:760px; margin:0 auto; text-align:center; }
.sec .head .eyebrow { display:inline-flex; align-items:center; }
.num { display:inline-grid; place-items:center; width:20px; height:20px; border-radius:5px; background:var(--a-tint); color:var(--a-ink); font:700 11px Inter; margin-right:8px; letter-spacing:0; }
.sw { display:inline-block; width:10px; height:10px; border-radius:2px; margin-right:7px; vertical-align:-1px; }
.q { margin:0 0 10px; padding:12px 14px; background:var(--soft); border-radius:10px; font-size:14.5px; color:var(--ink); line-height:1.55; }
.q.warn { background:var(--warn-tint); }
.q cite { display:block; margin-top:7px; font:500 12.5px Inter; font-style:normal; color:var(--muted); }
.q cite a { margin-left:10px; }
.h3 { margin:0 0 4px; font:800 18px Inter; color:var(--ink); }
.sub { margin:0 0 12px; font-size:14px; color:var(--muted); }
.ct { font-size:13.5px; color:var(--muted); white-space:nowrap; } .ct b { color:var(--ink); }
.worth { margin:10px 0 0; padding:12px 14px; background:var(--soft); border-radius:10px; font-size:14px; color:var(--body); display:flex; gap:14px; align-items:center; }
.worth b { color:var(--ink); } .worth .btn { margin-left:auto; flex:none; }
.fade { animation:fade .25s ease; } @keyframes fade { from { opacity:0; transform:translateY(4px); } to { opacity:1; transform:none; } }
`;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
  const AI = { chatgpt: ['ChatGPT', '#10A37F'], gemini: ['Gemini', '#3B82F6'], aio: ['AI Overviews', '#EA4335'], aimode: ['AI Mode', '#8B5CF6'],
               perplexity: ['Perplexity', '#64748B'] };
  const D = window.DV2;
  const P = 'Kari Mann Dental Studio';
  const lower = (s) => (s.split(' ')[0].slice(1) === s.split(' ')[0].slice(1).toLowerCase() ? s[0].toLowerCase() + s.slice(1) : s);
  const ai = (k) => `<span class="aidot" style="background:${AI[k][1]}"></span>${AI[k][0]}`;
  const quote = (q, warn) => `<div class="q ${warn ? 'warn' : ''} fade">"${q.text}"<cite>${ai(q.surface)} &nbsp;"${q.question}"<a href="#" onclick="return false">open the answer</a></cite></div>`;
  const total = (r) => r.positive + r.neutral + r.negative;
  /** The centred header every variation shares: eyebrow, the verdict, one line. */
  const head = (lede = true) => `<div class="head"><div class="eyebrow"><span class="num">3</span>How AI describes it</div>
    <h2 class="mid" style="margin:10px auto 10px">${D.verdict}</h2>
    ${lede ? `<p class="lede" style="margin:0 auto">Of the ${D.named} answers that name ${P}, ${D.tone.positive} praise it and ${D.tone.neutral} just list it.</p>` : ''}</div>`;
  /** How each AI describes it: one split bar per AI with the counts under it. */
  const toneRows = () => `<div class="eyebrow grey" style="margin-bottom:10px">How each AI describes it</div>${D.by_ai.map((r) => { const t = total(r);
    return `<div style="display:grid;grid-template-columns:104px minmax(0,1fr);gap:4px 12px;align-items:center;padding:6px 0;font-size:14px">
      <span style="white-space:nowrap;color:var(--ink)">${ai(r.surface)}</span>
      <span style="display:flex;height:10px;gap:2px;border-radius:3px;overflow:hidden"><i style="width:${r.positive / t * 100}%;background:var(--praise)"></i><i style="width:${r.neutral / t * 100}%;background:var(--list)"></i></span>
      <span style="grid-column:2;font-size:12.5px;color:var(--muted)">praises <b style="color:var(--ink)">${r.positive}</b>, lists <b style="color:var(--ink)">${r.neutral}</b></span></div>`; }).join('')}`;
  const offers = () => `<div class="eyebrow grey" style="margin-bottom:10px">What AI says it offers</div>${D.offers.map((o) =>
    `<div style="display:flex;justify-content:space-between;gap:10px;padding:7px 0;border-top:1px solid #F0F2F5;font-size:14px;color:var(--ink)"><span>${o.name}</span><span style="color:var(--muted)">${o.answers} answers</span></div>`).join('')}`;
  const listedRow = D.by_ai.find((r) => r.surface === D.listed.most);
  const listed = () => `<div class="eyebrow grey" style="margin-bottom:10px">Listed, not praised</div>
    <p class="sub">${D.tone.neutral} answers name it like a directory. ${AI[D.listed.most][0]} does this most: ${listedRow.neutral} of its ${total(listedRow)}.</p>${quote(D.listed.example)}`;
  window.DK = { AI, D, P, lower, ai, quote, total, head, toneRows, offers, listed };
})();

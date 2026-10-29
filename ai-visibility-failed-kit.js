/* Story chapter 01 for Kari Mann Dental Studio (Snapshot Oct 28, run 2, REAL numbers from the live result),
   with a note for AI answers that didn't come back. place: 'note' (with the other caveats), 'foot' (under the
   table), 'row' (in the AI Overviews row). failed: 1 is the real count; 6 matches Snapshot run 3; 0 hides it. */
(function () {
  const css = `
.ch { display:grid; grid-template-columns:minmax(0,1fr) 460px; gap:48px; padding:40px 0 60px; align-items:start; }
.ch .eyebrow { color:var(--a-ink); } .ch h2 { margin:10px 0 12px; font:800 30px/1.2 Inter; letter-spacing:-.02em; color:var(--ink); max-width:640px; }
.ch .lede { font-size:17px; } .ch .small { max-width:620px; }
table.rt { margin-top:22px; width:100%; max-width:540px; border-collapse:collapse; font-size:14px; }
.rt th { text-align:left; font:700 11px Inter; letter-spacing:.1em; text-transform:uppercase; color:var(--muted); padding-bottom:8px; }
.rt td { border-top:1px solid var(--line); padding:8px 0; color:var(--body); } .rt td:first-child { font-weight:600; color:var(--ink); }
.miss { font-size:12.5px; color:var(--muted); margin-left:8px; } .rt td:nth-child(2) { padding-right:18px; white-space:nowrap; }
.foot { margin-top:10px; font-size:13px; color:var(--muted); }
.lanes { padding-top:56px; } .lane { display:grid; grid-template-columns:120px minmax(0,1fr) 80px; gap:12px; align-items:center; padding:14px 0; font-size:14px; }
.lane b { color:var(--ink); font-weight:600; } .dots { display:flex; flex-wrap:wrap; gap:6px; } .dots i { width:8px; height:8px; border-radius:50%; background:#E4E7EC; } .dots i.on { background:var(--a); }
.lane .ct { text-align:right; font-weight:600; color:var(--ink); }
@media (max-width:900px) { .ch { grid-template-columns:1fr; } }
`;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
  const P = 'Kari Mann Dental Studio', ASKED = 135;
  const ROWS = [['chatgpt', 'ChatGPT', '#10A37F', 48, 105, '37 to 55'], ['gemini', 'Gemini', '#3B82F6', 39, 135, '22 to 37'], ['aio', 'AI Overviews', '#EA4335', 34, 69, '38 to 61'],
    ['aimode', 'AI Mode', '#8B5CF6', 49, 135, '29 to 45'], ['perplexity', 'Perplexity', '#64748B', 59, 135, '36 to 52'], ['chatgpt_near', 'ChatGPT near me', '#34D399', 0, 30, null]];
  const searches = (n) => (n === 1 ? '1 AI Overviews search' : `${n} AI Overviews searches`);
  const tip = (n) => `<span class="tipbox"><b>Didn't come back</b>We ran ${ASKED} AI Overviews searches. ${n === 1 ? 'One' : n} never came back: our search provider failed to fetch Google's results page, even after a second try, so there is no result of any kind to count. ${n === 1 ? 'It is' : 'They are'} left out, not counted as "not named". This is different from a search that got normal Google results without an AI Overview.</span>`;
  function chapter(el, { place, failed }) {
    const counted = ASKED - failed;
    const caveat = place === 'note' && failed
      ? ` ${searches(failed)} didn't come back at all: our search provider failed to fetch Google's page, even after a second try, so AI Overviews counts ${counted} searches, not ${ASKED}.` : '';
    el.innerHTML = `<section class="ch"><div>
      <div class="eyebrow">01 · Long story short</div>
      <h2>AI names ${P} in about 4 of every 10 answers.</h2>
      <p class="lede">Cape Dental Care comes up in about 3 of every 10. AI Overviews names ${P} most; Gemini, least. Google showed an AI Overview on 69 of ${counted} searches; the other ${counted - 69} got normal Google results, with no Overview.</p>
      <p class="small">The ChatGPT near-me row is a stand-in: a city-level near-me search can't be properly simulated on ChatGPT.${caveat}</p>
      <table class="rt"><thead><tr><th>AI</th><th><span class="tip">We saw</span></th><th><span class="tip">In reality, likely shows up</span></th></tr></thead><tbody>
      ${ROWS.map(([k, n, c, a, b, r]) => `<tr><td><span class="aidot" style="background:${c}"></span>${n}</td>
        <td>${a} of ${b}${place === 'row' && k === 'aio' && failed ? `<span class="miss tip">${failed} didn't come back${tip(failed)}</span>` : ''}</td>
        <td>${r ? `${r} times in every 100` : 'fewer than 11 times in every 100'}</td></tr>`).join('')}</tbody></table>
      ${place === 'foot' && failed ? `<p class="foot"><span class="tip">${searches(failed)} didn't come back and ${failed === 1 ? "isn't" : "aren't"} counted.${tip(failed)}</span></p>` : ''}
    </div>
    <div class="lanes">${ROWS.map(([k, n, , a, b]) => { const d = Math.round(b / 6), on = Math.round(a / 6);
      return `<div class="lane"><b>${n}</b><span class="dots">${Array.from({ length: d }, (_, i) => `<i class="${i < on ? 'on' : ''}"></i>`).join('')}</span><span class="ct">${a} of ${b}</span></div>`; }).join('')}
      <p class="small" style="text-align:center;margin-top:18px">Each row is one AI; each dot is about 6 answers. Lit: named ${P}.</p></div></section>`;
  }
  const STATES = [['1', '1 failed (real)'], ['6', '6 failed (like run 3)'], ['0', 'None failed']];
  window.FK = { chapter, STATES };
})();

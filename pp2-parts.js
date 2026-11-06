/* PROTOTYPE, throwaway (#1570 round 3): goals tiles, visits + technology, the gaps list with fixes, full-width rows. */
(function () {
  const PP = window.PP, esc = PP.esc, X = PP.p2 = {};
  X.short = (x) => String(x || '').split(/[;(:,]/)[0].trim();

  /* one source tag for a whole section when every entry shares it */
  X.common = (items) => { const s = [...new Set((items || []).map((x) => X.short(x.source)).filter(Boolean))]; return s.length === 1 ? s[0] : null; };

  /* full-width row: label, value, tag; the line runs under all three */
  X.kv = (label, valueHtml, tagHtml, extra) => `<div class="kv ${extra || ''}"><div class="l">${esc(label)}</div><div class="v">${valueHtml}</div><div class="r">${tagHtml || ''}</div></div>`;

  X.goals = (P, tag) => {
    const g = P.goals || []; if (!g.length) return '<div class="empty small">No goals from the client yet.</div>';
    const shared = X.common(g);
    const tiles = g.map((x) => {
      const m = x.text.match(/^([^:]{3,40}):\s*(.+)$/); const src = String(x.source || '');
      const label = m ? m[1] : (src.match(/(Short|Medium|Long) Term Goal/i) || [])[0] || 'Goal';
      const val = m ? m[2] : x.text;
      const nums = val.match(/^(\d+) now, goal (\d+)$/);
      const body = nums ? `<div class="big">${nums[1]} <span class="faint">now</span> <span class="arrow">→</span> ${nums[2]} <span class="faint">goal</span></div>${+nums[2] < +nums[1] ? '<div class="flag" style="margin-top:6px;display:inline-block">The goal is below today. Check with the client.</div>' : ''}`
        : `<div class="${val.length > 90 ? 'long' : 'big'}">${esc(val)}</div>`;
      return `<div class="tile"><div class="k">${esc(label.replace(/ Term Goal/i, ' term'))}</div>${body}${shared ? '' : `<div style="margin-top:8px">${tag([{ source: x.source, date: x.date, text: x.text }])}</div>`}</div>`;
    }).join('');
    return { html: `<div class="tiles">${tiles}</div>`, right: shared ? tag(g.map((x) => ({ source: x.source, date: x.date, text: x.text }))) : '' };
  };

  X.visits = (P, tag) => {
    const quotes = [...(P.consultations_emergencies || []), ...(P.patient_conveniences || [])];
    const tech = P.technology || [];
    const q = quotes.length ? `<div class="qcards">${quotes.map((x) => `<div class="qc"><div>${esc(x.text || x)}</div><div style="margin-top:8px">${tag([{ source: x.source, date: x.date, text: x.text }])}</div></div>`).join('')}</div>`
      : '<div class="empty small">Nothing on consultations, emergencies or patient comforts yet.</div>';
    const ts = X.common(tech);
    const t = tech.length ? `<div class="techs">${tech.map((x) => `<span class="tech">${esc(x.text || x)}</span>`).join('')}</div>` : '<div class="empty small">No technology named.</div>';
    return `<div class="sub-h">In the practice's words</div>${q}<div class="sub-h" style="margin-top:18px;display:flex;justify-content:space-between"><span>Technology · ${tech.length}</span>${ts ? tag(tech.map((x) => ({ source: x.source, date: x.date, text: x.text || x }))) : ''}</div>${t}`;
  };

  X.pkg = (P) => {
    const c = P.capacity || {}, s = String(c.source || ''); const n = (s.match(/posts_per_year (\d+)/) || [])[1]; const name = (s.match(/"([^"]+)"/) || [])[1];
    if (n) return `<span data-tip="${esc('<div class="t">From the CRM package</div>How many pieces the plan can hold comes from here. Synced from the CRM; change it there.')}">${esc(name || 'Package')} · ${n} posts a year</span>`;
    return '<span class="flag">No SEO package in the CRM</span>';
  };

  /* gaps worth fixing, each with the one action that could fill it */
  X.gaps = (P) => {
    const out = [], S = PP.state(), p = P.practice || {}, src = (n) => (P.services || []).some((s) => s.sources.some((x) => X.short(x.source) === n));
    const has = (name) => (P.missing || []).some((m) => m.toLowerCase().includes(name));
    if (!(p.gbp_listing && p.gbp_listing.linked)) out.push(['Business Profile not linked', 'Office hours, categories, reviews and the office address come from it.', 'Link Business Profile', 'Would open the listing picker for the agency Google account. If the account has no access to this listing, it says so and offers to ask the client for manager access.']);
    else if (has('no profile data is cached')) out.push(['Business Profile linked, but nothing pulled yet', 'Hours, categories and reviews are empty.', 'Pull from Business Profile', 'Would fetch hours, categories and reviews now.']);
    if (!src('Portal')) out.push(['No portal answers', 'The client has not filled in the portal homework, so other sources stand in.', 'Ask the client', 'Would ask the client to complete the portal homework. Client-facing, so it goes through the portal (Joe).']);
    if (S.comps.length < 3) out.push([S.comps.length ? `${3 - S.comps.length} competitor slots empty` : 'No competitors', 'Tools compare the practice with these.', 'Suggest competitors', 'Would look up practices near the office that offer the main services and suggest three to pick from.']);
    if (!PP.mains().length) out.push(['No main services', 'No source names a priority.', 'Pick main services', 'Would scroll to Services: click the star next to each main service.']);
    if (!(P.goals || []).length) out.push(['No goals', 'Neither the portal nor the onboarding questionnaire has goals.', 'Ask the client', 'Would add goals to the client\'s portal homework (through Joe).']);
    if (!(P.insurance || {}).network) out.push(['No insurance or payment info', 'Content cannot say which plans are accepted.', 'Ask the client', 'Would add payments and insurance to the portal homework (through Joe).']);
    if ((P.doctors || []).length && !(P.doctors || []).some((d) => (d.specialties || []).length)) out.push(['No doctor specialties', 'Specialties help pick main services.', 'Add specialties', 'Would open the doctor editor.']);
    if (!(P.services || []).some((s) => s.sources.some((x) => X.short(x.source) === 'Site page'))) out.push(['Site not crawled', 'No page of the site backs any service yet.', 'Crawl the site', 'Would start a site crawl (a few minutes, shows progress).']);
    return out;
  };
  X.gapsCard = (P) => {
    const g = X.gaps(P); if (!g.length) return '';
    return `<section class="sec" id="p-gaps"><div class="sec-h"><h2>What's missing</h2><span class="s">${PP.n(g.length, 'gap', 'gaps')} · fix what can be fixed from here</span></div><div class="sec-b">
      ${g.map(([t, why, btn, tip]) => `<div class="kv gap"><div class="l"><b>${esc(t)}</b></div><div class="v muted small">${esc(why)}</div><div class="r"><button class="btn btn-line sm" data-toast="${esc(tip)}">${esc(btn)}</button></div></div>`).join('')}</div></section>`;
  };
})();

/* Round 4 (#1417) Tracking: renders the sticky price panel beside the setup, as AIV's PricePanel. "About $X a month",
   split into lines that follow the choices, the save button under it, and when the change starts. */
(function () {
  const T = window.RA4T;
  const usd = (v) => `$${v.toFixed(2)}`;

  function html(sel, opts) {
    const q = T.quote(sel), on = q.monthly > 0;
    const was = opts.was;
    const head = on ? `About ${usd(q.monthly)} a month` : 'Nothing runs yet';
    const sub = on ? (q.light ? 'Light mode, once a month' : `${sel.cadence === 'weekly' ? 'Weekly' : 'Monthly'}, ${q.per}`) : 'No run is planned and nothing is charged.';
    const lines = q.lines.map(([k, v, unit]) => `<div class="r"><dt>${k}</dt><dd>${v}${unit ? ` <span>${unit}</span>` : ''}</dd></div>`).join('');
    const start = on ? `Starts with the next run, ${T.weekday(q.next)}, ${T.day(q.next)}.` : 'Choose weekly, monthly or light mode to see the price.';
    const wasLine = was != null && Math.abs(was - q.monthly) > 0.001 ? `<div class="was">${usd(was)} a month now</div>` : '';
    const changed = !opts.changing || opts.dirty;
    return `<aside class="t4-price" aria-live="polite"><div class="t4-eb">Price</div>
      <div class="big">${head}</div>${wasLine}<div class="sub">${sub}</div>
      ${on ? `<dl>${lines}</dl>` : ''}
      <p class="start">${start}</p>
      <p class="fine">${opts.changing ? 'Every run already made keeps its results. The change goes on the chart as a dark diamond.' : 'Each run saves its own results. A run never overwrites an earlier one.'}</p>
      <button class="t4-save" data-save ${on && changed ? '' : 'disabled'}>${opts.changing ? 'Save the change' : 'Start tracking'}</button></aside>`;
  }

  T.Price = { html, usd };
})();

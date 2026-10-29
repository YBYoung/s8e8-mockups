// Round 2 sample data for the Tracking mockups (A2 analytic, C2 per-period Story).
// Kari Mann Dental Studio, 8 weeks in. Real from the Oct 28 Snapshot: the cited sites and
// their counts, the phone, address and doctors, "Dr. Kinn", and the quotes. The rest is sample.
(function () {
  const Q = (service, text, rate, last14) => ({ service, text, rate, last14 });
  // last14: the last 14 asks on one AI (7 days, morning and evening), 1 = named. Shows how steady a question is.
  const QUESTIONS = [
    Q('Veneers', 'Who does natural looking veneers in Cape Coral?', 68, '11011111101111'),
    Q('Veneers', 'Veneers dentist near me', 52, '10101101100110'),
    Q('Veneers', 'How much do porcelain veneers cost in Cape Coral?', 54, '01101011010110'),
    Q('Sedation', 'Sedation dentistry for anxious patients in Cape Coral', 66, '11101111011101'),
    Q('Sedation', 'Who offers nitrous oxide at the dentist in Cape Coral?', 60, '11011010111011'),
    Q('Sedation', 'Sedation dentist near me', 22, '00100010001000'),
    Q('Frenectomy', 'Who is the best dentist for frenectomy in Cape Coral?', 70, '11111111111111'),
    Q('Frenectomy', 'Where can I get frenectomy in Cape Coral?', 66, '11111111111110'),
    Q('Implants', 'Who does dental implants well in Cape Coral?', 64, '11011111011011'),
    Q('Implants', 'Best place for a single tooth implant in Cape Coral', 52, '10110100111010'),
    Q('Implants', 'Dental implants near me', 20, '00010000100100'),
    Q('Implants', 'All-on-x-implants near me?', 22, '01000100010000'),
    Q('Whitening', 'Is in-office whitening worth it? Which Cape Coral dentists do it?', 66, '11101110111101'),
    Q('Whitening', 'Professional teeth whitening in Cape Coral', 50, '10011011001101'),
    Q('Whitening', 'Teeth whitening near me', 20, '00000010010010'),
    Q('Emergency', 'I cracked a tooth, who can see me fast in Cape Coral?', 6, '00000000000000'),
    Q('Emergency', 'Best emergency dentist in Cape Coral', 6, '00000000100000'),
    Q('Emergency', 'Emergency dentist near me', 0, '00000000000000'),
  ];
  const SOURCES = {
    rivalOnly: [
      { domain: 'opencare.com', cites: 36, without: 33, note: 'Kari Mann is named in only 3 of the 36 answers that cite it', act: 'Check the Opencare profile' },
      { domain: 'zocdoc.com', cites: 111, without: 87, note: 'Kari Mann is named in 24 of the 111 answers that cite it', act: 'Check the Zocdoc profile' },
      { domain: 'doctor.webmd.com', cites: 49, without: 35, note: 'Kari Mann is named in 14 of the 49 answers that cite it', act: 'Check the WebMD profile' },
      { domain: 'healthgrades.com', cites: 42, without: 28, note: 'Kari Mann is named in 14 of the 42 answers that cite it', act: 'Check the Healthgrades profile' },
    ],
    gained: [{ domain: 'karimanndentalstudio.com/cosmetic/porcelain-veneers', cites: 41, note: 'The new veneers page, cited by Gemini and AI Mode' }, { domain: 'capecoraldentists.org', cites: 9, note: 'A local directory, first cited Dec 15' }],
    lost: [{ domain: 'yelp.com', cites: 0, was: 12, note: 'Not cited since Dec 11 for any practice: an AI change, not a loss for the practice' }],
  };
  const FACTS = {
    checked: [{ what: 'Phone', said: '(239) 205-9136', k: 123, n: 123 }, { what: 'Address', said: '3201 Del Prado Blvd S, Suite 120', k: 199, n: 199 }, { what: 'Doctors', said: 'Dr. Kari Mann, Dr. Jenna Johnson', k: 129, n: 132 }],
    wrong: [{ said: '"Dr. Kinn"', right: 'Dr. Kari Mann', ais: 'Perplexity', answers: 3, first: 'Nov 3', last: 'Dec 22', source: 'not traced yet', status: 'still showing' },
      { said: 'Closed Fridays', right: 'Friday 8 a.m. to noon', ais: 'Gemini', answers: 5, first: 'Nov 12', last: 'Dec 2', source: 'An old Yelp listing', status: 'gone since Dec 2' }],
  };
  const NAMED_FIRST = [{ name: 'Kari Mann Dental Studio', me: true, named: 731, first: 274 }, { name: 'Cape Dental Care', rival: true, named: 482, first: 141 }, { name: 'Sunset Harbor Dental', named: 451, first: 96 }, { name: 'Smile Cape Coral', rival: true, named: 389, first: 88 }, { name: 'Coast Dental Cape Coral', named: 302, first: 47 }];
  const THEMES = [
    { theme: 'A friendly, gentle team', count: 39, quote: 'Patients describe the staff as friendly, caring and gentle, with a comfortable atmosphere.', ai: 'ChatGPT' },
    { theme: 'Good with nervous patients', count: 18, quote: 'Comfort features: on-site Maltese companion dogs for optional patient comfort.', ai: 'AI Overviews' },
    { theme: 'Highly rated', count: 14, quote: 'Kari Mann Dental Studio, 5.0 (903 reviews).', ai: 'AI Mode' },
  ];
  const WORK = [{ date: 'Nov 27', text: 'Veneers page published', link: 'Open the page' }, { date: 'Dec 9', text: 'Google Business Profile services updated', link: 'See the change' }];
  const NEXT = [{ text: 'Check the Opencare profile: Opencare is cited in 36 answers and Kari Mann is named in only 3', why: 'sources' }, { text: 'Plan an emergency page: emergency questions name Kari Mann about 0 in every 10', why: 'gap' }, { text: 'Trace where "Dr. Kinn" comes from and correct it', why: 'facts' }];
  // Period figures for the per-period Story: per-100 rate, answers, and what it is compared with.
  const PERIODS = {
    week: { label: 'Week of Dec 20', span: 'Dec 20 to 26', rate: 39, n: 1890, prevLabel: 'the week before', prev: 37, prevN: 1890, named: [['Cape Dental Care', 121, true], ['Sunset Harbor Dental', 113], ['Smile Cape Coral', 104, true], ['Coast Dental Cape Coral', 76]], trend: [34, 34, 35, 35, 38, 37, 38, 39], scale: 1 },
    month: { label: 'December 2026', span: 'Dec 1 to 26 so far', rate: 38, n: 7020, prevLabel: 'November', prev: 34, prevN: 8100, named: [['Cape Dental Care', 452, true], ['Sunset Harbor Dental', 421], ['Smile Cape Coral', 370, true], ['Coast Dental Cape Coral', 288]], trend: [34, 35, 38, 38], scale: 4 },
    quarter: { label: 'Q4 2026', span: 'Oct to Dec; tracking started Nov 1', rate: 36, n: 15120, prevLabel: 'the Oct 28 Snapshot', prev: 34, prevN: 674, named: [['Cape Dental Care', 960, true], ['Sunset Harbor Dental', 902], ['Smile Cape Coral', 760, true], ['Coast Dental Cape Coral', 610]], trend: [34, 34, 35, 35, 38, 37, 38, 39], scale: 8 },
  };
  const DAY = {
    label: 'Thursday, Dec 18', answers: 270,
    events: [
      { kind: 'new', text: 'Smile Cape Coral was named on a veneers question for the first time', detail: 'Gemini, evening ask: "Who does natural looking veneers in Cape Coral?"' },
      { kind: 'source', text: 'capecoraldentists.org was cited again (4th time this week)', detail: 'A local directory that lists Kari Mann Dental Studio' },
      { kind: 'fact', text: 'Perplexity called the dentist "Dr. Kinn" once more', detail: 'The 4th answer with this misspelling since Nov 3' },
    ],
    quotes: [
      { ai: 'AI Mode', q: 'Who does natural looking veneers in Cape Coral?', text: 'Kari Mann Dental Studio focuses on natural-looking porcelain veneers, matched to the shade of the surrounding teeth.' },
      { ai: 'ChatGPT', q: 'Sedation dentistry for anxious patients in Cape Coral', text: 'Kari Mann Dental Studio is often recommended for anxious patients; reviewers mention a gentle, unhurried team.' },
    ],
  };
  window.TRK2 = { QUESTIONS, SOURCES, FACTS, NAMED_FIRST, THEMES, WORK, NEXT, PERIODS, DAY };
})();

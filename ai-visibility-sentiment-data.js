/* Kari Mann Dental Studio, Snapshot of Oct 28 (run 2), real: the reader's tone and "known for" per answer
   (aiv_answer_reads), the answer text and questions (aiv_answers, aiv_prompts). Quotes are copied from the
   answers (citation marks and links removed). The payment counts come from a text search of the answers
   to the three questions that name the practice; the build would have the reader mark concerns itself. */
(function () {
  const AI = { chatgpt: ['ChatGPT', '#10A37F'], gemini: ['Gemini', '#3B82F6'], aio: ['AI Overviews', '#EA4335'],
               aimode: ['AI Mode', '#8B5CF6'], perplexity: ['Perplexity', '#0891B2'] };
  window.SENT = {
    AI,
    named: 401, praise: 236, list: 164, warnTone: 1,
    byAi: [['aimode', 62, 30, 0], ['chatgpt', 55, 27, 0], ['gemini', 47, 43, 0], ['aio', 38, 20, 0], ['perplexity', 34, 44, 1]],
    praised: [
      { theme: 'Good with nervous patients', n: 88, ais: 5, quotes: [
        ['chatgpt', 'What do people say about Kari Mann Dental Studio?', 'Patients praise Dr. Kari Mann and Dr. Jenna Johnson for helping them feel at ease. Comfort measures mentioned include therapy dogs, warm blankets, and clear explanations of procedures.'],
        ['aimode', 'Which dentist in Cape Coral should I choose?', 'Dr. Mann is heavily recommended by patients who deal with dental anxiety and need specialized care, ranging from family and cosmetic dentistry to advanced implants.']] },
      { theme: 'A friendly, gentle team', n: 79, ais: 5, quotes: [
        ['perplexity', 'What do people say about Kari Mann Dental Studio?', 'People generally describe Kari Mann Dental Studio in Cape Coral as friendly, gentle, and welcoming.'],
        ['gemini', 'Is Kari Mann Dental Studio good?', 'Dr. Kari Mann, Dr. Jenna Johnson, and their support staff receive frequent praise for being professional, compassionate, thorough, and gentle.']] },
      { theme: 'A modern office', n: 50, ais: 5, quotes: [
        ['aimode', 'Which dentist in Cape Coral should I choose?', 'Highly praised for a gorgeous, modern, state-of-the-art facility, anxiety-free environment, and expertise in cosmetic, family, and implant dentistry.'],
        ['aio', 'What do people say about Kari Mann Dental Studio?', 'Patients describe Kari Mann Dental Studio in Cape Coral, Florida as a welcoming, modern, and anxiety-free office.']] },
      { theme: 'Top rated by patients', n: 44, ais: 3, quotes: [
        ['aimode', 'Which dentist in Cape Coral should I choose?', 'Kari Mann Dental Studio (5.0/5 stars, over 900 reviews on Google Maps): Located on Del Prado Blvd S, Dr. Mann is heavily recommended by patients.'],
        ['perplexity', 'Is Kari Mann Dental Studio good?', 'A review aggregator lists a 5.0/5 rating from 195 reviews, and recent reviewers praise the staff and treatment experience.']] },
      { theme: 'Explains treatment clearly', n: 17, ais: 3, quotes: [
        ['chatgpt', 'What do people say about Kari Mann Dental Studio?', 'Reviewers praise Dr. Kari Mann and Dr. Jenna Johnson for explaining procedures, answering questions, and helping patients understand their treatment options.'],
        ['perplexity', 'Sedation dentistry for anxious patients in Cape Coral', 'Nitrous oxide and oral sedation; also offers a no-pressure discovery session.']] },
    ],
    payment: {
      n: 49, of: 75,
      byAi: [['gemini', 15], ['aio', 14], ['chatgpt', 13], ['perplexity', 5], ['aimode', 2]],
      quotes: [
        ['chatgpt', 'Is Kari Mann Dental Studio good?', 'Some reported reviews raise concerns about estimates changing or costs not being clearly explained upfront. Get a written, itemized treatment plan before agreeing to major work.', 'warn'],
        ['aimode', 'What do people say about Kari Mann Dental Studio?', 'A small number of reviews on platforms like Yelp mention high costs for extensive major procedures (like implants) and strict upfront payment policies for new patients, though the vast majority focus on top-tier satisfaction with routine and cosmetic care.', 'warn'],
        ['gemini', 'Kari Mann Dental Studio reviews', 'The practice operates on a fee-for-service model. While patient reviews emphasize that the care is well worth the cost, some note that it can be on the "pricier side".', 'mild'],
        ['aio', 'Kari Mann Dental Studio reviews', 'While the practice operates as a private model and may not be in-network with every insurance provider, they smoothly handle out-of-network claims with fast direct reimbursements.', 'kind'],
      ],
      full: ['perplexity', 'Is Kari Mann Dental Studio good?', [
        'Kari Mann Dental Studio appears to be well-regarded by patients, especially for friendly staff, gentle care, and helping anxious patients feel comfortable. One review aggregator reports 5.0/5 from 195 reviews, while Yahoo lists a 4.5/5 Yelp rating from 14 reviews, so feedback is very positive overall, but not uniformly so.',
        'One practical point to check before booking is payment: a recent Yelp review says new patients must pay upfront, even when insured, and the studio describes itself as fee-for-service and out of network for insurance. Confirm your expected costs and reimbursement with the office and your insurer.']],
    },
    listed: ['perplexity', 'Sedation dentist near me', 'Kari Mann Dental Studio: Offers nitrous oxide and oral sedation; 3201 Del Prado Blvd S, Suite 120. Call (239) 205-9136.'],
    offers: [['Cosmetic work and veneers', 84], ['Family and general care', 69], ['Implants', 50], ['Sedation, nitrous and oral', 48], ['Frenectomies, tongue and lip ties', 34], ['Whitening', 28]],
  };
})();

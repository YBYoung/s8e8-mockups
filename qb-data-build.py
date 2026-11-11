#!/usr/bin/env python3
"""Question bank mockups (#1842, spec #1553): build qb-data.js from the Kari Mann v4 research data.

Reads ~/Desktop/claude-work/research/1415-data/kari-mann-v4 (questions, demand3, auto_label_test_2, coverage,
refill_candidates_v4, removed) and writes qb-data.js: subjects with tiers, questions with the 11/11 labels
(subject key, one of eight situations, local flag, three demand numbers with stamps), the review list, light-mode
suggestions and the marker log. Derivations that are not in the v4 files are named in DERIVED below.
"""
import json, re, pathlib

SRC = pathlib.Path.home() / 'Desktop/claude-work/research/1415-data/kari-mann-v4'
OUT = pathlib.Path(__file__).with_name('qb-data.js')

qs = json.load(open(SRC / 'questions.json'))
d3 = json.load(open(SRC / 'demand3.json'))
al = json.load(open(SRC / 'auto_label_test_2.json'))
cov = json.load(open(SRC / 'coverage.json'))
rf = json.load(open(SRC / 'refill_candidates_v4.json'))
rm = json.load(open(SRC / 'removed.json'))
topics = json.load(open(SRC / 'topics.json'))

DERIVED = [
    'Situation "insurance" split out of "cost" by wording (insurance, in or out of network, covered), per ADR-0049; v4 had seven situations.',
    '"Urgent and general care" reads as the library entry General care; its emergency-situation questions move to Emergency dental care (11/7 service-list ruling, ADR-0044).',
    'Tiers follow the v4 bank: priority = main service, other, practice = practice-level. Main services are the build\'s guess from onboarding goals (no confirmed profile).',
    'Review list items come from the 11/1 labelling test groups (auto_label_test_2.json), the coverage check (coverage.json) and the refill duplicate check (refill_candidates_v4.json).',
]

TIER = {'priority': 'main', 'other': 'other', 'practice': 'practice'}
SUBJECT_RENAME = {'Urgent and general care': 'General care'}
SUBJECT_KEY = lambda name: re.sub(r'[^a-z0-9]+', '_', name.lower()).strip('_')
SOURCE = {
    'search_console': 'Search Console', 'dental_fanout': 'Fan-out', 'market_trends_phrase': 'Market Trends',
    'forum_quote': 'Forum', 'ai_visibility_question': 'AI Visibility', 'audience_head_query': 'Audience research',
    'forum_thread_title': 'Forum',
}
INS = re.compile(r'insurance|in[- ]network|out[- ]of[- ]network|covered by|cover ', re.I)
CS_STAMP = 'Nov 1, 2026'
GSC_WINDOW = 'Sep 22, 2025 to Oct 12, 2026'
GSC_STAMP = 'Oct 12, 2026'


def situation(q):
    s = q.get('situation') or q.get('need') or 'service'
    if s in ('cost', 'choosing') and INS.search(q['text']):
        return 'insurance'
    return s


def subject_of(q):
    name = q.get('subject') or q['topic']
    sit = situation(q)
    if name == 'Urgent and general care':
        return 'Emergency dental care' if sit == 'emergency' else 'General care'
    return SUBJECT_RENAME.get(name, name)


def wording(text):
    t = text.strip()
    if not t.endswith('?') and not t.endswith('.'):
        t = t[0].upper() + t[1:] + '?'
    return t


questions = []
for q in qs:
    d = d3.get(q['id'], {})
    cs = d.get('clickstream_us', {}) or {}
    ag = d.get('agency_search_console', {}) or {}
    own = d.get('practice_search_console', {}) or {}
    sample = ag.get('sample', [])[:4]
    questions.append({
        'id': q['id'],
        'subject': subject_of(q),
        'situation': situation(q),
        'local': bool(q.get('local')),
        'text': wording(q['text']),
        'textCity': q.get('text_with_city'),
        'mainPhrase': cs.get('phrase') or (q.get('match_phrases') or [None])[0] or '',
        'matchPhrases': q.get('match_phrases') or [],
        'checklist': [c['text'] for c in (q.get('checklist') or [])],
        'source': SOURCE.get(q.get('source'), q.get('source', '')),
        'evidence': (q.get('source_detail') or [])[:3],
        'kept': bool(q.get('kept_by_seo')),
        'merged': [m['text'] for m in (q.get('merged') or [])],
        'demand': {
            'cs': cs.get('us_monthly_avg_12m'),
            'csPhrase': cs.get('phrase'),
            'csNote': cs.get('us_reason'),
            'agImp': ag.get('impressions_all_clients'),
            'agClients': ag.get('clients_seen'),
            'agSample': sample,
            'ownImp': own.get('impressions'),
            'ownSearches': own.get('searches'),
        },
    })

# subjects: tier, tier source, totals
by_name = {}
for q in questions:
    s = by_name.setdefault(q['subject'], {'name': q['subject'], 'key': SUBJECT_KEY(q['subject']), 'own': 0, 'ag': 0, 'n': 0})
    s['own'] += q['demand']['ownImp'] or 0
    s['ag'] += q['demand']['agImp'] or 0
    s['n'] += 1
tsrc = {t['name']: t for t in topics}
main_src = rm['v4']['main']
for s in by_name.values():
    orig = next((k for k, v in SUBJECT_RENAME.items() if v == s['name']), s['name'])
    if s['name'] in ('General care', 'Emergency dental care'):
        s['tier'] = 'practice'
        s['tierSource'] = 'Library entry that is not a service (11/7 ruling); questions with no treatment of their own.'
    elif s['name'] == 'Choosing the practice':
        s['tier'] = 'practice'
        s['tierSource'] = 'Bank-owned practice-level subject: choosing the practice as a whole.'
    else:
        t = tsrc.get(orig, {})
        s['tier'] = TIER.get(t.get('tier', 'other'), 'other')
        s['tierSource'] = main_src.get(s['name']) or t.get('tier_source') or 'Offered, not named in the onboarding priorities or goals.'
    s['pages'] = t.get('why') if (t := tsrc.get(orig)) else None
subjects = list(by_name.values())

# review list from the labelling test groups and the coverage check
tot = al['step_a']['impressions']
groups = al['groups']
qtext = {q['id']: q['text'] for q in questions}
subj_fix = lambda n: 'General care' if n == 'Urgent and general care' else n
DENTAL = re.compile(r'gauze|crown|tooth|teeth|bite|dental|dentist|implant|denture|root|gum|mouth|filling|veneer|extraction|sedation|whitening|braces|jaw', re.I)
review = []
for g in sorted(groups, key=lambda g: -g['impressions']):
    if g['impressions'] >= 0.01 * tot:
        review.append({'kind': 'big', 'leader': g['leader'], 'impressions': g['impressions'], 'wordings': g['wordings'],
                       'subject': subj_fix(g['subject']), 'situation': g['need_type'], 'reason': g['reason'],
                       'question': qtext.get(g.get('hand_top') or '', None), 'qid': g.get('hand_top') if str(g.get('hand_top', '')).startswith('ka') else None})
for u in cov['unplaced_searches']:
    review.append({'kind': 'unplaced', 'leader': u['need'], 'impressions': u['practice_impressions'], 'wordings': u['searches'],
                   'reason': u['why'], 'examples': u['examples'][:4]})
for g in sorted(groups, key=lambda g: -g['impressions']):
    if str(g.get('subject')).lower() == 'junk' and DENTAL.search(g['leader']) and g['impressions'] >= 100:
        review.append({'kind': 'junk', 'leader': g['leader'], 'impressions': g['impressions'], 'wordings': g['wordings'], 'reason': g['reason'],
                       'question': qtext.get(g.get('hand_top') or '', None) if str(g.get('hand_top', '')).startswith('ka') else None})
for g in sorted(groups, key=lambda g: -g['impressions']):
    if g.get('need_type') == 'emergency' and g['impressions'] >= 0.01 * tot:
        continue  # already in the big list
    if g.get('need_type') == 'emergency' and g['impressions'] >= 100:
        review.append({'kind': 'emergency', 'leader': g['leader'], 'impressions': g['impressions'], 'wordings': g['wordings'],
                       'subject': 'Emergency dental care' if g['subject'] == 'Urgent and general care' else subj_fix(g['subject']),
                       'situation': 'emergency', 'reason': g['reason'],
                       'question': qtext.get(g.get('hand_top') or '', None) if str(g.get('hand_top', '')).startswith('ka') else None})
for subj, v in rf.items():
    for n in v['needs']:
        if n.get('duplicate_of'):
            review.append({'kind': 'dup', 'leader': n['question'], 'subject': subj, 'situation': n['situation'], 'of': n['duplicate_of'],
                           'agImp': n['agency_impressions'], 'agClients': n['clients'], 'ownImp': n['own_impressions'], 'examples': n['searches'][:4]})

# agency searches the bank does not match: suggestions for the monthly refresh
agency_sugg = []
for subj, lst in cov['agency_searches_not_in_bank_by_subject'].items():
    for s in lst[:1]:
        if s['clients'] >= 2 and s['impressions_all_clients'] >= 200:
            agency_sugg.append({'subject': subj, 'search': s['search'], 'agImp': s['impressions_all_clients'], 'agClients': s['clients']})

data = {
    'practice': 'Kari Mann Dental Studio', 'clientId': 258, 'site': 'karimanndentalstudio.com', 'city': 'Cape Coral, FL',
    'offices': [{'name': 'Kari Mann Dental Studio', 'city': 'Cape Coral'}],
    'csStamp': CS_STAMP, 'gscWindow': GSC_WINDOW, 'gscStamp': GSC_STAMP, 'crawl': {'date': 'Nov 1, 2026', 'pages': 57, 'sections': 467},
    'coverage': {'matched': cov['after']['nonbranded_matched'], 'total': cov['after']['nonbranded_impressions'], 'searches': cov['after']['nonbranded_searches'], 'searchesMatched': cov['after']['nonbranded_searches_matched']},
    'labelling': {'groups': al['step_a']['groups'], 'labelled': al['step_a']['groups_labelled'], 'searches': al['step_a']['searches'], 'impressions': tot},
    'cutByCap': cov['cut_by_cap'],
    'remaining': cov['remaining_unmatched_top'][:8],
    'remainingImpressions': cov['remaining_unmatched_impressions'],
    'subjects': subjects, 'questions': questions, 'review': review, 'agencySuggestions': agency_sugg[:6],
    'derived': DERIVED,
}
OUT.write_text('/* Generated by qb-data-build.py from Kari Mann v4 research data (#1842). Do not edit by hand. */\nwindow.QB_DATA = ' + json.dumps(data, ensure_ascii=False, separators=(',', ':')) + ';\n')
from collections import Counter
print(OUT, OUT.stat().st_size, 'bytes')
print('questions', len(questions), 'subjects', len(subjects), 'review', Counter(r['kind'] for r in review))
print('situations', Counter(q['situation'] for q in questions))
print('tiers', Counter(s['tier'] for s in subjects), [(s['name'], s['tier'], s['n']) for s in subjects])
print('agency sugg', len(agency_sugg))

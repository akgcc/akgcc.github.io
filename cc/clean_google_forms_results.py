import json
from pprint import pprint
with open('poll_results_raw.json','r') as f:
    res = json.load(f)
QUESTIONS = res[0][1][1]
ANSWERS = res[3]
QUESTION_MAP = {}
for q in QUESTIONS:
    question = q[1]
    if q[4]:
        for e in q[4]:
            #example e: [135907008, [['1'], ['2'], ['3'], ['4'], ['5'], ['6'], ['7']], 1, ['Archetto'], None, None, None, None, None, None, None, [0]]
            try:
                QUESTION_MAP[e[0]] = (question,e[3][0])
            except IndexError:
                pass

ANSWER_MAP = {}
for a in ANSWERS:
    if a[0] in QUESTION_MAP:
        metric,name = QUESTION_MAP[a[0]]
        metric = metric.strip()
        name = name.strip()
        if metric != 'Do you have this operator?':
            # print(QUESTION_MAP[a[0]],a)
            m = ANSWER_MAP.setdefault(name, {})
            flat_results = [int(item) for sublist in [[v[0]]*v[2] for v in a[1]] for item in sublist]
            m[metric] = sum(flat_results)/len(flat_results)
ANSWER_MAP['Surtr'].update(ANSWER_MAP['29'])
del ANSWER_MAP['29']

for v in ANSWER_MAP.values():
    v['Overall'] = sum(v.values())/len(v.values())

with open('poll_results_1.json','w') as f:
    json.dump(ANSWER_MAP, f)
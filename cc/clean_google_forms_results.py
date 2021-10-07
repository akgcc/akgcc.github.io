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
E2_ANSWER_MAP = {}
bar_total = 0
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
        else:
            print(QUESTION_MAP[a[0]],a)
            total = sum([v[2] for v in a[1]])
            bar_total = total
            _map = {v[0]:v[2] for v in a[1]}
            print(_map)
            m = E2_ANSWER_MAP.setdefault(name, {})
            m['Ownership'] = _map['Yes'] + _map['Yes and E2']
            m['E2'] = _map['Yes and E2'] / total#m['Ownership']
            m['Ownership'] /= total
            
            # for k,v in _map.items():
                # m[k] = v/total
ANSWER_MAP['Surtr'].update(ANSWER_MAP['29'])
del ANSWER_MAP['29']

print(E2_ANSWER_MAP)
for v in ANSWER_MAP.values():
    v['Overall'] = sum(v.values())/len(v.values())

order = ['Power','Utility','Fun','Coom']
with open('polldata.txt','w') as f:
    f.write('Name\t'+'\t'.join(order)+'\n')
    for k,v in ANSWER_MAP.items():
        line = f'{k}\t'
        line+= "\t".join([str(v[n]) for n in order])
        f.write(line+'\n')
        
# with open('poll_results_1.json','w') as f:
    # json.dump(ANSWER_MAP, f)
# with open('poll_results_2.json','w') as f:
    # json.dump(E2_ANSWER_MAP, f)
with open('poll_results_1.json','w') as f:
    json.dump({"scatter":{"data":ANSWER_MAP}, "bar":{"data":E2_ANSWER_MAP,"total":bar_total}}, f)
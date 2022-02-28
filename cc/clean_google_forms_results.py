# extract data directly from poll results source: var ANALYTICS_LOAD_DATA_
# page example: https://docs.google.com/forms/d/e/1FAIpQLSdOL5pjOH-VRV3Jg_AD20szZUWU-3e4h80aVpJ3HzM57qEeag/viewanalytics
#https://docs.google.com/forms/d/e/1FAIpQLSeJADbpZ6uPlkG9lNmoVaXD538EKiXEVspeFjjV6pa2q2c44A/viewanalytics
import json
from pprint import pprint
with open('poll_results_2_raw.json','r') as f:
    res = json.load(f)
QUESTIONS = res[0][1][1] # res[0][1][0] if no intro?
ANSWERS = res[3]
QUESTION_MAP = {}
for q in QUESTIONS:
    question = q[1]
    if q[0] == 2054551172: # skip a specific question (the feedback q at the end)
        continue
    if len(q)>4 and q[4]:
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
        # print(metric)
        if metric != 'Do you own this operator?':
            # print(QUESTION_MAP[a[0]],a)
            m = ANSWER_MAP.setdefault(name, {})
            flat_results = [int(item) for sublist in [[v[0]]*v[2] for v in a[1]] for item in sublist]
            m[metric] = sum(flat_results)/len(flat_results)
        else:
            # print(QUESTION_MAP[a[0]],a)
            total = sum([v[2] for v in a[1]])
            bar_total = total
            _map = {v[0]:v[2] for v in a[1]}
            # print(_map)
            m = E2_ANSWER_MAP.setdefault(name, {})
            m['Ownership'] = _map['Yes'] + _map['Yes and E2']
            m['E2'] = _map['Yes and E2'] / total#m['Ownership']
            m['Ownership'] /= total
            
            # for k,v in _map.items():
                # m[k] = v/total

###################
# fix name errors:#
###################
# ANSWER_MAP['Surtr'].update(ANSWER_MAP['29'])
# del ANSWER_MAP['29']

ANSWER_MAP['Kal\'tsit'].update(ANSWER_MAP['Kal\'tits'])
del ANSWER_MAP['Kal\'tits']

ANSWER_MAP['Ch\'en the Holungday'] = (ANSWER_MAP['Ch\'en The Holungday'])
del ANSWER_MAP['Ch\'en The Holungday']

ANSWER_MAP['Skadi the Corrupting Heart'] = (ANSWER_MAP['Skadi The Corrupting Heart'])
del ANSWER_MAP['Skadi The Corrupting Heart']

E2_ANSWER_MAP['Ch\'en the Holungday'] = (E2_ANSWER_MAP['Ch\'en The Holungday'])
del E2_ANSWER_MAP['Ch\'en The Holungday']

E2_ANSWER_MAP['Skadi the Corrupting Heart'] = (E2_ANSWER_MAP['Skadi The Corrupting Heart'])
del E2_ANSWER_MAP['Skadi The Corrupting Heart']

###################
###################
###################
# map "real" questions to the 4 used on the chart itself.
col_map = {
'How powerful is this operator? (1-7)':'Power',
'How versatile do you feel this operator is?':'Utility',
'How much fun do you have using...?':'Fun',
'How coom worthy is the following operator?':'Coom'
}

for v in ANSWER_MAP.values():
    for k2, v2 in col_map.items():
        v[v2] = v[k2]
        del v[k2]
for v in ANSWER_MAP.values():
    v['Overall'] = sum(v.values())/len(v.values())

order = ['Power','Utility','Fun','Coom','Overall']

with open('polldata.txt','w') as f:
    f.write('Name\t'+'\t'.join(order)+'\n')
    for k,v in ANSWER_MAP.items():
        line = f'{k}\t'
        line+= "\t".join([str(v[n]) for n in order])
        f.write(line+'\n')
    f.write('\n\n')
    f.write('Name\t'+'\t'.join(['Ownership','E2','E2%OfOwners'])+'\n')
    for k,v in E2_ANSWER_MAP.items():
        line = f'{k}\t'
        line+= "\t".join([str(v[n]) for n in ['Ownership','E2']])
        line+= '\t'+str(v['E2']/v['Ownership'])
        f.write(line+'\n')
with open('poll_results_2.json','w') as f:
    json.dump({"scatter":{"data":ANSWER_MAP,"default_axes":order}, "bar":{"data":E2_ANSWER_MAP,"total":bar_total}}, f)
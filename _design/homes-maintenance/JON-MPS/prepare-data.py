"""Prepare the read-only CSV source for the local MPS design study."""
import csv
import json
import re
import shutil
from pathlib import Path

HERE = Path(__file__).parent
SOURCE = Path('/Users/jcountryman/Downloads/MPS - Matrix - Sheet1.csv')

def numbers(text):
    text = text.replace('½', '.5').replace(',', '')
    return [float(n) for n in re.findall(r'\d+(?:\.\d+)?', text)]

def money(text):
    matches = list(re.finditer(r'\$(\d[\d,]*)(?:[–-]\$?(\d[\d,]*))?', text))
    return [dict(low=int(m[1].replace(',', '')), high=int((m[2] or m[1]).replace(',', '')),
                 label=text[(matches[i-1].end() if i else 0):m.start()].strip(' ;,.:'), openEnded=text[m.end():m.end()+1]=='+')
            for i, m in enumerate(matches)]

short = ['Home inspection', 'HVAC & air filters', 'Vents & exhaust fans', 'Kitchen appliance care',
         'Washing machine care', 'Dryer vent cleaning', 'Plumbing & fixture checks', 'Water heater service',
         'Water filter replacement', 'Gutters & drainage', 'Sump pump check', 'Roof, attic & crawl spaces',
         'Exterior paint, seals & trim', 'Exterior washing', 'Vegetation & debris', 'Fences, decks & walkways',
         'Concrete care', 'Irrigation check', 'Window & door seals', 'After-rain moisture check',
         'Chimney & fireplace', 'Alarms & extinguishers', 'Electrical & GFCI checks', 'Emergency readiness',
         'Pest entry points', 'Doors & cabinet hardware', 'Garage door care', 'Home care priorities']
locations = ['whole','interior','interior','interior','interior','interior','interior','interior',
             'interior','exterior','interior','whole','exterior','exterior','exterior','exterior',
             'exterior','exterior','exterior','whole','interior','interior','whole','interior',
             'exterior','interior','exterior','whole']
icons = ['home','air','air','spark','spark','air','drop','drop','drop','rain','drop','home',
         'brush','spark','leaf','home','home','leaf','window','rain','home','shield','bolt',
         'shield','shield','tool','tool','calendar']
categories = ['planning','comfort','comfort','comfort','comfort','safety','water','water','water',
              'water','water','water','exterior','exterior','exterior','exterior','exterior',
              'water','comfort','water','safety','safety','safety','planning','exterior','comfort','safety','planning']
with SOURCE.open(newline='', encoding='utf-8-sig') as f:
    rows = list(csv.DictReader(f))
named = [r for r in rows if r['Task'].strip()]
assert len(named) == 28
tasks = []
for i, r in enumerate(named):
    ts = numbers(r['Estimated time'])[:2]
    if 'min' not in r['Estimated time']: ts = [v*60 for v in ts]
    lo, hi = int(ts[0]), int(ts[-1])
    booking = int(((lo+hi)/2 + 7.5)//15)*15
    service, repairs = money(r['Service Cost']), money(r['Deferred Repairs'])
    comparable = bool(repairs) and not r['Deferred Repairs'].startswith(('Another inspection', 'Catch-up'))
    # Select one named repair scenario by its range midpoint; do not add unrelated repairs together.
    comparison = max(repairs, key=lambda item: item['low']+item['high']) if comparable else None
    ratio = ((comparison['low']+comparison['high']) / (service[0]['low']+service[0]['high'])) if comparable else None
    tasks.append(dict(id=f't{i+1:02}', row=i+2, name=r['Task'], short=short[i], description=r['Descrption'],
                      frequency=r['Frequency'], sourceTime=r['Estimated time'], service=r['Service Cost'],
                      repairs=r['Deferred Repairs'], benefit=r['Intrinsic Value'], minutes=booking,
                      timeLow=lo, timeHigh=hi, serviceRanges=service, repairRanges=repairs,
                      ratio=round(ratio, 3) if ratio is not None else None, comparisonRepair=comparison,
                      location=locations[i], category=categories[i], icon=icons[i]))

# These are illustrative service visits, not a claim to satisfy every component's maintenance frequency.
# Exterior: 2 full gutter scopes, exterior finish work, concrete, vegetation, and irrigation.
exterior = [('t10',2),('t10',8),('t13',4),('t15',10),('t17',0),('t18',5),('t18',11)]
# Interior: reserve monthly alarm checks, then allocate the other selected service scopes.
interior = [('t22',m) for m in range(12)] + [('t02',2),('t02',8),('t09',1),('t09',7),
            ('t08',4),('t06',6),('t05',0),('t04',3),('t04',9),('t07',5),('t03',10),('t28',0),('t28',11)]

def jobs_from_specs(specs, prefix):
    return [dict(id=f'{prefix}-{i}', task=tid, preferredMonth=m, minutes=next(t['minutes'] for t in tasks if t['id']==tid))
            for i,(tid,m) in enumerate(specs)]

def allocate(jobs, reserve=None):
    calendar=[[] for _ in range(12)]
    ordered=sorted(jobs, key=lambda j: j['preferredMonth'])
    pending=[]
    def space(m):
        return 120-sum(e['minutes'] for e in calendar[m])
    def entry(job, minutes):
        return dict(task=job['task'], job=job['id'], minutes=minutes, fullMinutes=job['minutes'])
    # Reserve truly monthly checks first. Keep short services in one visit wherever they fit.
    if reserve:
        for job in ordered:
            if job['task']=='t22': calendar[job['preferredMonth']].append(entry(job,job['minutes']))
    for job in ordered:
        if reserve and job['task']=='t22': continue
        order=list(range(job['preferredMonth'],12))+list(range(job['preferredMonth']))
        fitting=next((m for m in order if job['minutes']<=space(m)),None)
        if fitting is not None:
            calendar[fitting].append(entry(job,job['minutes']))
        else:
            pending.append(job)
    # Larger scopes fill open time chronologically; all portions remain in calendar order.
    for job in pending:
        remaining=job['minutes']
        for m in range(12):
            take=min(space(m),remaining)
            if take: calendar[m].append(entry(job,take)); remaining-=take
            if not remaining: break
        assert remaining==0, f'Over annual capacity: {job}'
    for job in jobs:
        parts=[e for month in calendar for e in month if e['job']==job['id']]
        for idx,e in enumerate(parts): e.update(part=idx+1,parts=len(parts))
    return calendar

# Financial focus: select complete scopes in descending largest-repair / service midpoint ratio.
# Cap repeats at explicit study visit counts; a price ratio is not a failure probability or ROI.
visits={'t02':2,'t09':2,'t10':2,'t11':3,'t12':2,'t19':1,'t20':1,'t21':1,'t22':1,'t23':1,'t27':1}
preferred={'t10':[2,8],'t12':[2,8],'t09':[1,7],'t02':[2,8],'t20':[0],'t25':[3],
           't22':[0],'t11':[1,5,9],'t21':[7],'t19':[8],'t27':[6],'t07':[5]}
ranked=sorted([t for t in tasks if t['ratio'] is not None], key=lambda t:(-t['ratio'],t['id']))
financial=[]; used=0
for task in ranked:
    for n in range(visits.get(task['id'],1)):
        if used+task['minutes']<=1440:
            financial.append((task['id'],preferred.get(task['id'],[len(financial)%12])[n%len(preferred.get(task['id'],[0]))]))
            used+=task['minutes']
# Remaining capacity is honestly left available rather than inventing extra work.
plans={}
for key,specs in [('protect',financial),('outside',exterior),('inside',interior)]:
    jobs=jobs_from_specs(specs,key)
    plans[key]=dict(jobs=jobs,calendar=allocate(jobs,reserve=key=='inside'))
    assert all(sum(e['minutes'] for e in mo)<=120 for mo in plans[key]['calendar'])

payload=dict(source='MPS - Matrix - Sheet1.csv', namedRows=28,
             excludedRows=[dict(csvRow=30,reason='Task name, description, frequency and duration are blank.')],
             timeMethod='Midpoint of source time range, rounded to the nearest 15 minutes. Longer scopes are split into visits of no more than 120 minutes.',
             ratioMethod='Midpoint of the largest named repair-price range divided by the midpoint service cost. A plus sign is retained in displayed prices; the comparison uses the two published figures even when higher costs are possible. One repair scenario is compared per task; unrelated repairs are not added together. Catch-up review/inspection prices are excluded. Complete service scopes are selected in descending ratio order within a 24-hour budget, with the displayed study visit counts. Ratios are price comparisons, not expected savings or failure probabilities.',
             tasks=tasks, plans=plans)
shutil.copyfile(SOURCE,HERE/'source.csv')
(HERE/'data.json').write_text(json.dumps(payload,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({k:dict(minutes=sum(e['minutes'] for mo in v['calendar'] for e in mo),
                         months=[sum(e['minutes'] for e in mo) for mo in v['calendar']],
                         jobs=len(v['jobs'])) for k,v in plans.items()}))

#!/usr/bin/env python3
import json,sys
from pathlib import Path
p=Path(sys.argv[1] if len(sys.argv)>1 else "data/questions.json");qs=json.loads(p.read_text(encoding="utf-8"))
required=["id","year","source","page","number","subject","question","options","answer","solution"];ids=set();errors=[];years={};subjects={};answers=solutions=0
for i,q in enumerate(qs):
 missing=[k for k in required if k not in q]
 if missing:errors.append(f"{i}: missing {', '.join(missing)}")
 if q.get("id") in ids:errors.append(f"{i}: duplicate id {q.get('id')}")
 ids.add(q.get("id"));years[q.get("year")]=years.get(q.get("year"),0)+1;subjects[q.get("subject")]=subjects.get(q.get("subject"),0)+1;answers+=bool(q.get("answer"));solutions+=bool(q.get("solution"))
 if not isinstance(q.get("options",{}),dict):errors.append(f"{i}: options is not an object")
print(f"questions={len(qs)} unique_ids={len(ids)} answer_keys={answers} solutions={solutions}");print("years=",dict(sorted(years.items(),key=lambda x:(x[0] is None,x[0]))));print("subjects=",dict(sorted(subjects.items(),key=lambda x:-x[1])))
if errors:print(f"validation=FAIL errors={len(errors)}");print("\n".join(errors[:50]));raise SystemExit(1)
print("validation=PASS")

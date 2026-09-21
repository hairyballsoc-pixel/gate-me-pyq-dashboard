#!/usr/bin/env python3
"""Validate the normalized question dataset before committing it."""
import json, sys
from pathlib import Path
p=Path(sys.argv[1] if len(sys.argv)>1 else "data/questions.json")
qs=json.loads(p.read_text(encoding="utf-8"))
required=["id","year","source","page","number","subject","question","options","answer","solution"]
ids=set(); errors=[]; answers=solutions=0
for i,q in enumerate(qs):
    for key in required:
        if key not in q: errors.append(f"{i}: missing {key}")
    if q.get("id") in ids: errors.append(f"{i}: duplicate id {q.get('id')}")
    ids.add(q.get("id"))
    answers += q.get("answer") is not None
    solutions += bool(q.get("solution"))
print(f"questions={len(qs)} unique_ids={len(ids)} answer_keys={answers} solutions={solutions}")
if errors:
    print(f"validation=FAIL errors={len(errors)}")
    print("\n".join(errors[:50]))
    raise SystemExit(1)
print("validation=PASS")

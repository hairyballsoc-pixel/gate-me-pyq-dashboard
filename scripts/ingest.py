#!/usr/bin/env python3
"""Ingest permitted GATE ME PDFs into data/questions.json."""
from pathlib import Path
import argparse, fitz, hashlib, json, re
ROOT=Path(__file__).resolve().parents[1]; PDF_DIR=ROOT/"data"/"source_pdfs"; OUT=ROOT/"data"/"questions.json"
KEYWORDS={"Engineering Mathematics":["matrix","eigen","determinant","derivative","integral","differential equation","probability","variance","laplace","fourier"],"Engineering Mechanics":["force","moment","equilibrium","friction","kinematic","kinetics","impulse","momentum","centroid"],"Strength of Materials":["stress","strain","beam","bending","torsion","deflection","column","buckling","principal stress"],"Theory of Machines & Vibrations":["gear","cam","flywheel","governor","balancing","mechanism","vibration","natural frequency","damping"],"Fluid Mechanics":["fluid","pressure","bernoulli","pipe","reynolds","viscosity","boundary layer","head loss","continuity","venturi"],"Thermodynamics":["thermodynamic","entropy","enthalpy","internal energy","carnot","otto","diesel","rankine","gas turbine"],"Heat Transfer":["heat transfer","conduction","convection","radiation","thermal conductivity","heat exchanger","fin","nusselt","boiling","condensation"],"Manufacturing":["casting","machining","turning","milling","drilling","welding","forging","rolling","metrology","tolerance","cnc","edm"],"Industrial Engineering":["linear programming","inventory","queue","optimization","transportation","assignment","production","quality","forecast","scheduling"],"Machine Design":["shaft","bearing","spring","gear","key","coupling","bolt","pressure vessel","factor of safety"],"Materials Science":["phase diagram","steel","iron","alloy","hardness","tempering","annealing","martensite","pearlite","composite","fracture","fatigue","creep"],"IC Engines":["internal combustion","spark ignition","compression ignition","brake power","indicated power","volumetric efficiency","knock","cetane","octane","emission"],"Power Engineering":["boiler","steam turbine","condenser","feedwater","hydro","nuclear","reactor","power plant"],"Refrigeration & Air Conditioning":["refrigeration","refrigerant","evaporator","expansion valve","absorption","psychrometric","air conditioning","humidity"],"General Aptitude":["grammar","sentence","analogy","percentage","ratio","average","logical","inference","clock","calendar"]}
def classify(s):
    low=s.lower(); scores={k:sum(min(low.count(w),3)*(2 if " " in w else 1) for w in ws) for k,ws in KEYWORDS.items()}; subject=max(scores,key=scores.get); return subject if scores[subject] else "Other / Unclassified"
def answer(s):
    m=re.search(r'(?is)\b(?:Answer|Ans)\s*[:\-]?\s*(?:is\s*)?(\(?[A-D]\)?|[+-]?\d+(?:\.\d+)?(?:\s*(?:to|-)\s*[+-]?\d+(?:\.\d+)?)?)',s); return m.group(1).replace("(","").replace(")","").strip() if m else None
def solution(s):
    m=re.search(r'(?is)\b(?:Exp|Explanation|Solution)\s*[:\-]\s*(.*)',s); return m.group(1).strip()[:4000] if m else None
def parse(path):
    doc=fitz.open(path); out=[]
    for pi,page in enumerate(doc):
        lines=page.get_text().splitlines(); starts=[]
        for i,line in enumerate(lines):
            m=re.match(r'^\s*(?:Q(?:uestion)?\.?\s*(?:No\.?\s*)?)?(\d{1,3}(?:\.\d{1,2})?)\s*[.)]',line,re.I)
            if m: starts.append((i,m.group(1)))
        for j,(i,num) in enumerate(starts):
            end=starts[j+1][0] if j+1<len(starts) else len(lines); text=re.sub(r'\s+',' ','\n'.join(lines[i:end])).strip()
            if len(text)<30: continue
            text=re.sub(r'^Q(?:uestion)?\.?\s*(?:No\.?\s*)?\d{1,3}(?:\.\d{1,2})?\s*[.:)\-–—]?\s*','',text,flags=re.I); text=re.sub(r'^\d{1,3}(?:\.\d{1,2})?\s*[.)]\s*','',text)
            opts={k:v.strip() for k,v in re.findall(r'\(([A-D])\)\s*([^()]+?)(?=\s+\([A-D]\)|$)',text)}; years=re.findall(r'(?:19|20)\d{2}',path.name); year=int(years[0]) if years else None
            out.append({"id":hashlib.sha1(f"{path.name}:{pi+1}:{num}:{text[:120]}".encode()).hexdigest()[:12],"year":year,"source":path.name,"page":pi+1,"number":num,"subject":classify(text),"subtopic":None,"classification_confidence":0.5,"type":"MCQ" if len(opts)>=2 else "UNKNOWN","question":text,"options":opts,"answer":answer(text),"solution":solution(text)})
    return out
def main():
    ap=argparse.ArgumentParser(); ap.add_argument("--source-dir",default=str(PDF_DIR)); ap.add_argument("--output",default=str(OUT)); args=ap.parse_args(); files=sorted(Path(args.source_dir).glob("*.pdf")); allq=[]
    for f in files: print("Parsing",f.name); allq.extend(parse(f))
    Path(args.output).write_text(json.dumps(allq,ensure_ascii=False,indent=2),encoding="utf-8"); print(f"Wrote {len(allq)} questions to {args.output}")
if __name__=="__main__": main()

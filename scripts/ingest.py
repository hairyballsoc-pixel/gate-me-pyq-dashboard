#!/usr/bin/env python3
"""Ingest permitted GATE ME PDFs; optional OCR uses Tesseract for sparse pages."""
from pathlib import Path
import argparse,fitz,hashlib,json,re,shutil,subprocess
ROOT=Path(__file__).resolve().parents[1];PDF_DIR=ROOT/"data"/"source_pdfs";OUT=ROOT/"data"/"questions.json"
KEYWORDS={"Engineering Mathematics":["matrix","eigen","determinant","derivative","integral","differential equation","probability","variance","laplace","fourier","vector calculus"],"Engineering Mechanics":["force","moment","equilibrium","friction","kinematic","kinetics","impulse","momentum","centroid","free body"],"Strength of Materials":["stress","strain","beam","bending","torsion","deflection","column","buckling","principal stress","mohr"],"Theory of Machines & Vibrations":["gear","cam","flywheel","governor","balancing","mechanism","vibration","natural frequency","damping"],"Fluid Mechanics":["fluid","pressure","bernoulli","pipe","reynolds","viscosity","boundary layer","head loss","continuity","venturi"],"Thermodynamics":["thermodynamic","entropy","enthalpy","internal energy","carnot","otto","diesel","rankine","gas turbine"],"Heat Transfer":["heat transfer","conduction","convection","radiation","thermal conductivity","heat exchanger","fin","nusselt","boiling","condensation"],"Manufacturing":["casting","machining","turning","milling","drilling","welding","forging","rolling","metrology","tolerance","cnc","edm"],"Industrial Engineering":["linear programming","inventory","queue","optimization","transportation","assignment","production","quality","forecast","scheduling"],"Machine Design":["shaft","bearing","spring","gear","key","coupling","bolt","pressure vessel","factor of safety"],"Materials Science":["phase diagram","steel","iron","alloy","hardness","tempering","annealing","martensite","pearlite","composite","fracture","fatigue","creep"],"IC Engines":["internal combustion","spark ignition","compression ignition","brake power","indicated power","volumetric efficiency","knock","cetane","octane","emission"],"Power Engineering":["boiler","steam turbine","condenser","feedwater","hydro","nuclear","reactor","power plant"],"Refrigeration & Air Conditioning":["refrigeration","refrigerant","evaporator","expansion valve","absorption","psychrometric","air conditioning","humidity"],"General Aptitude":["grammar","sentence","analogy","percentage","ratio","average","logical","inference","clock","calendar"]}
def classify(s):
 low=s.lower();scores={k:sum(min(low.count(w),3)*(2 if " " in w else 1) for w in ws) for k,ws in KEYWORDS.items()};order=sorted(scores.values(),reverse=True);best=max(scores,key=scores.get);conf=0.5 if not order or order[0]==0 else min(.98,.55+.1*min(order[0],4)+(.08 if len(order)>1 and order[0]>order[1] else 0));return (best if scores[best] else "Other / Unclassified"),round(conf,2)
def answer(s):
 for pat in [r'(?is)\b(?:Answer|Ans)\s*[:\-]?\s*(?:is\s*)?(\(?[A-D]\)?)',r'(?is)\b(?:Answer|Ans)\s*[:\-]?\s*([+-]?\d+(?:\.\d+)?(?:\s*(?:to|-)\s*[+-]?\d+(?:\.\d+)?)?)']:
  m=re.search(pat,s)
  if m:return m.group(1).replace("(","").replace(")","").strip()
 return None
def solution(s):
 m=re.search(r'(?is)\b(?:Exp|Explanation|Solution)\s*[:\-]\s*(.*)',s);return m.group(1).strip()[:5000] if m else None
def ocr(page):
 pix=page.get_pixmap(dpi=220,alpha=False);tmp=ROOT/"data"/".ocr-page.png";pix.save(tmp)
 try:return subprocess.run(["tesseract",str(tmp),"stdout","-l","eng"],capture_output=True,text=True,timeout=60).stdout
 finally:tmp.unlink(missing_ok=True)
def parse(path,use_ocr):
 doc=fitz.open(path);out=[]
 for pi,page in enumerate(doc):
  text=page.get_text("text").strip();ocr_used=False
  if use_ocr and len(re.sub(r"\s+","",text))<80 and shutil.which("tesseract"):text=ocr(page).strip();ocr_used=bool(text)
  lines=text.splitlines();starts=[]
  for i,line in enumerate(lines):
   m=re.match(r'^\s*(?:Q(?:uestion)?\.?\s*(?:No\.?\s*)?)?(\d{1,3}(?:\.\d{1,2})?)\s*[.)]',line,re.I)
   if m:starts.append((i,m.group(1)))
  for j,(i,num) in enumerate(starts):
   end=starts[j+1][0] if j+1<len(starts) else len(lines);block=re.sub(r"\s+"," ","\n".join(lines[i:end])).strip()
   if len(block)<30:continue
   block=re.sub(r'^Q(?:uestion)?\.?\s*(?:No\.?\s*)?\d{1,3}(?:\.\d{1,2})?\s*[.:)\-–—]?\s*','',block,flags=re.I);block=re.sub(r'^\d{1,3}(?:\.\d{1,2})?\s*[.)]\s*','',block)
   opts={k:v.strip() for k,v in re.findall(r'\(([A-D])\)\s*([^()]+?)(?=\s+\([A-D]\)|$)',block)};ym=re.findall(r'(?:19|20)\d{2}',path.name);year=int(ym[0]) if ym else None;sub,conf=classify(block);sol=solution(block)
   out.append({"id":hashlib.sha1(f"{path.name}:{pi+1}:{num}:{block[:120]}".encode()).hexdigest()[:12],"year":year,"source":path.name,"page":pi+1,"number":num,"subject":sub,"subtopic":None,"chapter":None,"concept":None,"classification_confidence":conf,"type":"MCQ" if len(opts)>=2 else "UNKNOWN","question":block,"options":opts,"answer":answer(block),"solution":sol,"solution_status":"source" if sol else "none","ocr_used":ocr_used})
 return out
def main():
 ap=argparse.ArgumentParser();ap.add_argument("--source-dir",default=str(PDF_DIR));ap.add_argument("--output",default=str(OUT));ap.add_argument("--ocr",action="store_true");a=ap.parse_args();files=sorted(Path(a.source_dir).glob("*.pdf"))
 if not files:raise SystemExit("No PDFs found in "+str(a.source_dir))
 allq=[]
 for f in files:print("Parsing",f.name);allq.extend(parse(f,a.ocr))
 Path(a.output).write_text(json.dumps(allq,ensure_ascii=False,indent=2),encoding="utf-8");print(f"Wrote {len(allq)} questions to {a.output}")
if __name__=="__main__":main()

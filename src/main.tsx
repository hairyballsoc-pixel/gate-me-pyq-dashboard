import React, { useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import questions from "../data/questions.json";
import taxonomy from "../data/taxonomy.json";
import "./styles.css";

type Question={id:string;year:number|null;source:string;page:number;number:string;subject:string;subtopic:string|null;classification_confidence:number;type:string;question:string;options:Record<string,string>;answer:string|null;solution:string|null;chapter?:string|null;concept?:string|null;marks?:number|null;negative_mark?:number|null;solution_status?:string};
type Progress={attempts:number;correct:number;solved:number;bookmarks:string[];wrong:string[];bySubject:Record<string,{attempts:number;correct:number}>};
const bank=questions as Question[];
const taxonomyMap=taxonomy as Record<string,{chapters:string[]}>;
const subjects=["All",...Array.from(new Set(bank.map(q=>q.subject))).sort()];
const years=["All",...Array.from(new Set(bank.map(q=>q.year).filter(Boolean))).sort((a,b)=>Number(b)-Number(a))] as (string|number)[];
const types=["All",...Array.from(new Set(bank.map(q=>q.type).filter(Boolean))).sort()];
const empty:Progress={attempts:0,correct:0,solved:0,bookmarks:[],wrong:[],bySubject:{}};
const key="gate-me-progress-v2";
const normalize=(s:string)=>s.trim().toUpperCase().replace(/\s+/g,"").replace(/[()]/g,"");
const hasAnswer=(q:Question)=>q.answer!==null&&String(q.answer).trim()!=="";
const clean=(s:string)=>s.replace(/^(?:Q(?:uestion)?\.?\s*(?:No\.?\s*)?|\d+(?:\.\d+)?\s*[.)])\s*/i,"").trim();
function load():Progress{try{const x=JSON.parse(localStorage.getItem(key)||"");return {...empty,...x,bookmarks:x.bookmarks||[],wrong:x.wrong||[],bySubject:x.bySubject||{}}}catch{return empty}}

function App(){
 const [view,setView]=useState<"dashboard"|"bank"|"practice"|"review">("dashboard");
 const [subject,setSubject]=useState("All"),[chapter,setChapter]=useState("All"),[year,setYear]=useState<string|number>("All"),[type,setType]=useState("All"),[availability,setAvailability]=useState("All"),[search,setSearch]=useState("");
 const [selectedId,setSelectedId]=useState(bank[0]?.id||""),[progress,setProgress]=useState<Progress>(load),[session,setSession]=useState<Question[]>([]),[idx,setIdx]=useState(0),[answer,setAnswer]=useState(""),[submitted,setSubmitted]=useState(false);
 const chapters=useMemo(()=>subject==="All"?["All",...Array.from(new Set(Object.values(taxonomyMap).flatMap(x=>x.chapters))).sort()]:["All",...(taxonomyMap[subject]?.chapters||[])],[subject]);
 const filtered=useMemo(()=>bank.filter(q=>{
   const hay=[q.question,q.subtopic,q.chapter,q.concept,q.source,q.subject].filter(Boolean).join(" ").toLowerCase();
   const a=subject==="All"||q.subject===subject,b=chapter==="All"||q.chapter===chapter||q.subtopic===chapter||hay.includes(chapter.toLowerCase());
   const c=year==="All"||String(q.year)===String(year),d=type==="All"||q.type===type;
   const e=availability==="All"||(availability==="Answerable"&&hasAnswer(q))||(availability==="Worked solution"&&!!q.solution);
   return a&&b&&c&&d&&e&&(!search||hay.includes(search.toLowerCase()));
 }),[subject,chapter,year,type,availability,search]);
 const selected=session.length?session[idx]:bank.find(q=>q.id===selectedId)||filtered[0];
 const accuracy=progress.attempts?Math.round(progress.correct/progress.attempts*100):0;
 const answerable=bank.filter(hasAnswer).length,solutions=bank.filter(q=>!!q.solution).length;
 const persist=(p:Progress)=>{setProgress(p);localStorage.setItem(key,JSON.stringify(p))};
 const bookmark=(id:string)=>{const has=progress.bookmarks.includes(id);persist({...progress,bookmarks:has?progress.bookmarks.filter(x=>x!==id):[...progress.bookmarks,id]})};
 const choose=(q:Question)=>{setSelectedId(q.id);setSession([]);setAnswer("");setSubmitted(false)};
 function practice(pool:Question[]=filtered){
   const candidates=pool.filter(hasAnswer).sort(()=>Math.random()-.5).slice(0,20);
   setSession(candidates);setIdx(0);setAnswer("");setSubmitted(false);setView("practice");
 }
 function submit(){
   if(!selected||!answer||submitted)return;
   const ok=normalize(answer)===normalize(String(selected.answer||""));
   const s=progress.bySubject[selected.subject]||{attempts:0,correct:0};
   const p:Progress={...progress,attempts:progress.attempts+1,correct:progress.correct+(ok?1:0),solved:progress.solved+(ok&&!!selected.solution?1:0),wrong:ok?progress.wrong.filter(x=>x!==selected.id):Array.from(new Set([...progress.wrong,selected.id])),bySubject:{...progress.bySubject,[selected.subject]:{attempts:s.attempts+1,correct:s.correct+(ok?1:0)}}};
   persist(p);setSubmitted(true);
 }
 function next(){if(idx>=session.length-1){setSession([]);setView("dashboard")}else{setIdx(x=>x+1);setAnswer("");setSubmitted(false)}}
 const subjectCounts=useMemo(()=>subjects.slice(1).map(s=>({name:s,count:bank.filter(q=>q.subject===s).length})),[]);
 const yearCounts=useMemo(()=>years.slice(1).map(y=>({year:y,count:bank.filter(q=>String(q.year)===String(y)).length})),[]);
 return <div className="app"><header className="topbar"><div><div className="brand">GATE<span>ME</span></div><div className="subtitle">PYQ command center · supplied source set</div></div><button className="primary" onClick={()=>practice()}>Start practice</button></header>
 <div className="layout"><aside className="sidebar">
  <button className={view==="dashboard"?"nav active":"nav"} onClick={()=>setView("dashboard")}>▦ Dashboard</button>
  <button className={view==="bank"?"nav active":"nav"} onClick={()=>setView("bank")}>☷ Question bank</button>
  <button className={view==="practice"?"nav active":"nav"} onClick={()=>practice()}>▶ Practice</button>
  <button className={view==="review"?"nav active":"nav"} onClick={()=>setView("review")}>↻ Review mistakes</button>
  <div className="side-title">Course sections</div>{subjects.slice(1).map(s=><button key={s} className="subject-nav" onClick={()=>{setSubject(s);setChapter("All");setView("bank")}}><span>{s}</span><b>{bank.filter(q=>q.subject===s).length}</b></button>)}
 </aside><main className="main">
 {view==="dashboard"&&<Dashboard total={bank.length} answerable={answerable} solutions={solutions} accuracy={accuracy} attempts={progress.attempts} bookmarks={progress.bookmarks.length} wrong={progress.wrong.length} subjects={subjectCounts} years={yearCounts} browse={()=>setView("bank")} practice={()=>practice()}/>}
 {view==="bank"&&<Bank filtered={filtered} subject={subject} setSubject={(v:string)=>{setSubject(v);setChapter("All")}} chapter={chapter} setChapter={setChapter} chapters={chapters} year={year} setYear={setYear} type={type} setType={setType} availability={availability} setAvailability={setAvailability} search={search} setSearch={setSearch} selectedId={selected?.id} bookmarks={progress.bookmarks} choose={choose} bookmark={bookmark} practice={()=>practice(filtered)}/>}
 {view==="practice"&&selected&&<Practice q={selected} index={idx} total={session.length} answer={answer} setAnswer={setAnswer} submitted={submitted} submit={submit} next={next} bookmarked={progress.bookmarks.includes(selected.id)} bookmark={()=>bookmark(selected.id)}/>}
 {view==="review"&&<Review qs={bank.filter(q=>progress.wrong.includes(q.id))} choose={(q:Question)=>{choose(q);setView("bank")}} practice={()=>practice(bank.filter(q=>progress.wrong.includes(q.id)))}/>}
 </main></div></div>
}

function Dashboard(p:any){return <div><section className="hero"><div><div className="eyebrow">YOUR GATE ME KNOWLEDGE BASE</div><h1>Turn decades of PYQs into a system.</h1><p>Search the full bank, drill from subject to chapter, practise targeted sets, bookmark questions, and unlock stored worked solutions only after a correct submission.</p></div><button className="outline" onClick={p.browse}>Explore all questions →</button></section>
 <div className="cards"><Metric label="Questions indexed" value={p.total.toLocaleString()}/><Metric label="Answer keys" value={p.answerable.toLocaleString()}/><Metric label="Worked solutions" value={p.solutions.toLocaleString()}/><Metric label="Your accuracy" value={p.accuracy+"%"}/><Metric label="Attempts" value={String(p.attempts)}/><Metric label="Bookmarked" value={String(p.bookmarks)}/><Metric label="Needs review" value={String(p.wrong)}/></div>
 <div className="grid2"><Panel title="Course coverage">{p.subjects.map((x:any)=><div className="barrow" key={x.name}><span>{x.name}</span><div className="bar"><i style={{width:Math.max(2,x.count/p.subjects[0].count*100)+"%"}}/></div><b>{x.count}</b></div>)}</Panel><Panel title="Year coverage"><div className="yeargrid">{p.years.map((x:any)=><div className="yearcard" key={x.year}><b>{x.year}</b><span>{x.count} Qs</span></div>)}</div></Panel></div>
 <div className="notice"><b>Data boundary:</b> the supplied archive reaches 2024. 2025/2026 papers were not present. Some older scanned papers may still require OCR; the app never invents missing questions or solutions.</div></div>}
function Metric({label,value}:{label:string,value:string}){return <div className="metric"><span>{label}</span><strong>{value}</strong></div>}
function Panel({title,children}:{title:string;children:React.ReactNode}){return <section className="panel"><h2>{title}</h2>{children}</section>}

function Bank(p:any){return <div><div className="pagehead"><div><div className="eyebrow">QUESTION BANK</div><h1>All indexed PYQs</h1><p>{p.filtered.length.toLocaleString()} questions match your filters.</p></div><button className="primary" onClick={p.practice}>Practice this set</button></div>
 <div className="filters"><input value={p.search} onChange={(e:any)=>p.setSearch(e.target.value)} placeholder="Search text, topic, source…"/><select value={p.subject} onChange={(e:any)=>p.setSubject(e.target.value)}>{subjects.map(s=><option key={s}>{s}</option>)}</select><select value={p.chapter} onChange={(e:any)=>p.setChapter(e.target.value)}>{p.chapters.map((s:string)=><option key={s}>{s}</option>)}</select><select value={p.year} onChange={(e:any)=>p.setYear(e.target.value)}>{years.map(y=><option key={y}>{y}</option>)}</select><select value={p.type} onChange={(e:any)=>p.setType(e.target.value)}>{types.map(t=><option key={t}>{t}</option>)}</select><select value={p.availability} onChange={(e:any)=>p.setAvailability(e.target.value)}><option>All</option><option>Answerable</option><option>Worked solution</option></select></div>
 <div className="question-list">{p.filtered.slice(0,300).map((q:Question)=><button className={"qrow "+(q.id===p.selectedId?"selected":"")} key={q.id} onClick={()=>p.choose(q)}><span className="qyear">{q.year||"—"}</span><span className="qnum">Q{q.number}</span><span className="qtext">{clean(q.question)}</span><span className="tag">{q.subtopic||q.chapter||q.subject}</span><span className="status">{q.solution?"SOL":hasAnswer(q)?"ANS":"—"} {p.bookmarks.includes(q.id)?"★":""}</span></button>)}</div>
 {p.selectedId&&<QuestionPreview q={bank.find(q=>q.id===p.selectedId)} bookmarked={p.bookmarks.includes(p.selectedId)} bookmark={()=>p.bookmark(p.selectedId)}/>}
 {p.filtered.length>300&&<div className="notice">Showing the first 300 results. Narrow the filters to drill down.</div>}</div>}

function QuestionPreview({q,bookmarked,bookmark}:any){if(!q)return null;return <section className="preview panel"><div className="preview-head"><div><div className="eyebrow">{q.year||"YEAR UNKNOWN"} · Q{q.number}</div><h2>{q.subject}{q.subtopic?" · "+q.subtopic:""}</h2></div><button className="outline" onClick={bookmark}>{bookmarked?"★ Bookmarked":"☆ Bookmark"}</button></div><div className="preview-question">{q.question}</div>{Object.entries(q.options||{}).length>0&&<div className="preview-options">{Object.entries(q.options).map(([k,v])=><div key={k}><b>{k}</b>{String(v)}</div>)}</div>}<div className="preview-meta"><span>{q.type}</span><span>{hasAnswer(q)?"Answer key stored":"No answer key"}</span><span>{q.solution?"Worked solution stored":"No worked solution"}</span><span>{q.source} · p.{q.page}</span></div></section>}

function Practice(p:any){const correct=normalize(p.answer)===normalize(String(p.q.answer||""));return <div><div className="pagehead"><div><div className="eyebrow">{p.q.year||"YEAR UNKNOWN"} · {p.q.source} · PAGE {p.q.page}</div><h1>Practice {p.index+1} / {p.total}</h1><p>{p.q.subject}{p.q.subtopic?" · "+p.q.subtopic:""} · {p.q.type}</p></div><button className="outline" onClick={p.bookmark}>{p.bookmarked?"★ Bookmarked":"☆ Bookmark"}</button></div>
 <section className="question-card"><div className="question-meta"><span>{p.q.year||"—"}</span><span>Q{p.q.number}</span><span>{hasAnswer(p.q)?"Answer key available":"No answer key"}</span></div><div className="question-body">{p.q.question}</div>
 {Object.keys(p.q.options||{}).length>0?<div className="options">{Object.entries(p.q.options).map(([k,v])=><button key={k} disabled={p.submitted} className={p.submitted&&normalize(k)===normalize(String(p.q.answer||""))?"correct":p.submitted&&p.answer===k?"wrong":p.answer===k?"chosen":""} onClick={()=>p.setAnswer(k)}><b>{k}</b><span>{String(v)}</span></button>)}</div>:<input className="nat" value={p.answer} disabled={p.submitted} onChange={(e:any)=>p.setAnswer(e.target.value)} placeholder="Enter your answer"/>}
 {!p.submitted?<button className="primary submit" onClick={p.submit} disabled={!p.answer}>Submit answer</button>:<div className={correct?"result correctbox":"result wrongbox"}><b>{correct?"Correct.":"Not correct."}</b><div>Correct answer: <strong>{p.q.answer||"Not available"}</strong></div>{correct&&p.q.solution?<div className="solution"><h3>Worked solution</h3><p>{p.q.solution}</p></div>:correct?<div className="muted">This record has an answer key but no stored worked explanation. No explanation is fabricated.</div>:<div className="muted">Submit the correct answer to unlock any stored worked solution.</div>}<button className="outline next" onClick={p.next}>{p.index>=p.total-1?"Finish session":"Next question →"}</button></div>}</section></div>}

function Review(p:any){return <div><div className="pagehead"><div><div className="eyebrow">REVIEW LOOP</div><h1>Questions to revisit</h1><p>{p.qs.length} questions are in your review queue.</p></div>{p.qs.length>0&&<button className="primary" onClick={p.practice}>Practice mistakes</button>}</div>{p.qs.length===0?<div className="notice">Your review queue is empty. Missed questions are added automatically during practice.</div>:<div className="question-list">{p.qs.map((q:Question)=><button className="qrow" key={q.id} onClick={()=>p.choose(q)}><span className="qyear">{q.year||"—"}</span><span className="qnum">Q{q.number}</span><span className="qtext">{clean(q.question)}</span><span className="tag">{q.subject}</span><span className="status">{q.solution?"SOL":hasAnswer(q)?"ANS":"—"}</span></button>)}</div>}</div>}

createRoot(document.getElementById("root")!).render(<App/>);
import React, { useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import questions from "../data/questions.json";
import "./styles.css";

type Question = {
  id: string; year: number | null; source: string; page: number; number: string;
  subject: string; subtopic: string | null; classification_confidence: number;
  type: string; question: string; options: Record<string,string>;
  answer: string | null; solution: string | null;
};

const bank = questions as Question[];
const subjects = ["All", ...Array.from(new Set(bank.map(q=>q.subject))).sort()];
const years = ["All", ...Array.from(new Set(bank.map(q=>q.year).filter(Boolean))).sort((a,b)=>(b as number)-(a as number))] as (string|number)[];
const stripLabel = (s:string) => s.replace(/^(?:Q(?:uestion)?\.?\s*(?:No\.?\s*)?|\d+(?:\.\d+)?\s*[.)])\s*/i,"").trim();
function App(){
  const [view,setView]=useState<"dashboard"|"practice"|"browse">("dashboard");
  const [subject,setSubject]=useState("All"); const [year,setYear]=useState<string|number>("All");
  const [search,setSearch]=useState(""); const [selectedId,setSelectedId]=useState(bank[0]?.id ?? "");
  const [answer,setAnswer]=useState<string|null>(null); const [submitted,setSubmitted]=useState(false);
  const [session,setSession]=useState<Question[]>([]); const [sessionIndex,setSessionIndex]=useState(0);
  const [stats,setStats]=useState(()=>JSON.parse(localStorage.getItem("gate-stats")||'{"attempts":0,"correct":0,"solved":0}'));
  const filtered=useMemo(()=>bank.filter(q=>{
    const subjectOk=subject==="All"||q.subject===subject; const yearOk=year==="All"||String(q.year)===String(year);
    const hay=(q.question+" "+q.subtopic+" "+q.source).toLowerCase(); return subjectOk&&yearOk&&(!search||hay.includes(search.toLowerCase()));
  }),[subject,year,search]);
  const selected=session.length?session[sessionIndex]:bank.find(q=>q.id===selectedId)??filtered[0];
  const availableSolutions=bank.filter(q=>q.solution).length, answerable=bank.filter(q=>q.answer).length;
  const accuracy=stats.attempts?Math.round(stats.correct/stats.attempts*100):0;
  function startPractice(){const pool=filtered.filter(q=>Object.keys(q.options).length>=2&&q.answer);const shuffled=[...pool].sort(()=>Math.random()-0.5).slice(0,20);setSession(shuffled);setSessionIndex(0);setAnswer(null);setSubmitted(false);setView("practice")}
  function submit(){if(!selected||answer===null||submitted)return;const correct=normalize(answer)===normalize(selected.answer||"");const next={...stats,attempts:stats.attempts+1,correct:stats.correct+(correct?1:0),solved:stats.solved+(correct?1:0)};setStats(next);localStorage.setItem("gate-stats",JSON.stringify(next));setSubmitted(true)}
  function nextQuestion(){if(sessionIndex<session.length-1){setSessionIndex(i=>i+1);setAnswer(null);setSubmitted(false)}}
  const subjectCounts=useMemo(()=>subjects.slice(1).map(s=>({s,n:bank.filter(q=>q.subject===s).length})).sort((a,b)=>b.n-a.n),[]);
  const yearCounts=useMemo(()=>years.slice(1).map(y=>({y,n:bank.filter(q=>String(q.year)===String(y)).length})),[]);
  return <div className="app"><header className="topbar"><div><div className="brand">GATE<span>ME</span></div><div className="subtitle">PYQ Command Center · indexed source set</div></div><button className="primary" onClick={startPractice}>Start practice</button></header>
    <div className="layout"><aside className="sidebar"><button className={view==="dashboard"?"nav active":"nav"} onClick={()=>setView("dashboard")}>▦ Dashboard</button><button className={view==="practice"?"nav active":"nav"} onClick={startPractice}>▶ Practice</button><button className={view==="browse"?"nav active":"nav"} onClick={()=>setView("browse")}>☷ Question bank</button><div className="side-title">Course sections</div>{subjects.slice(1).map(s=><button key={s} className="subject-nav" onClick={()=>{setSubject(s);setView("browse")}}><span>{s}</span><b>{bank.filter(q=>q.subject===s).length}</b></button>)}</aside>
      <main className="main">{view==="dashboard"&&<Dashboard subjectCounts={subjectCounts} yearCounts={yearCounts} answerable={answerable} availableSolutions={availableSolutions} accuracy={accuracy} total={bank.length} onBrowse={()=>setView("browse")}/>}
      {view==="browse"&&<Browse filtered={filtered} subject={subject} setSubject={setSubject} year={year} setYear={setYear} search={search} setSearch={setSearch} onSelect={(q:any)=>{setSelectedId(q.id);setSession([]);setAnswer(null);setSubmitted(false)}} selectedId={selectedId}/>}
      {view==="practice"&&selected&&<Practice q={selected} index={sessionIndex} total={session.length} answer={answer} setAnswer={setAnswer} submitted={submitted} submit={submit} next={nextQuestion}/>}
      {view==="practice"&&!selected&&<div className="notice">No answerable MCQs are available for the current filters yet.</div>}</main></div></div>
}
function Dashboard(p:any){return <div><section className="hero"><div><div className="eyebrow">YOUR GATE ME KNOWLEDGE BASE</div><h1>Turn decades of PYQs into a system.</h1><p>Filter by course section, drill down to subtopics, practise by year, and reveal stored solutions after a correct submission.</p></div><button className="outline" onClick={p.onBrowse}>Explore all questions →</button></section><div className="cards"><Metric label="Questions indexed" value={p.total.toLocaleString()}/><Metric label="Questions with answer keys" value={p.answerable.toLocaleString()}/><Metric label="Stored worked solutions" value={p.availableSolutions.toLocaleString()}/><Metric label="Your accuracy" value={p.accuracy+"%"}/></div><div className="grid2"><Panel title="Course coverage">{p.subjectCounts.slice(0,12).map((x:any)=><div className="barrow" key={x.s}><span>{x.s}</span><div className="bar"><i style={{width:`${Math.max(3,x.n/p.subjectCounts[0].n*100)}%`}}/></div><b>{x.n}</b></div>)}</Panel><Panel title="Year coverage"><div className="yeargrid">{p.yearCounts.map((x:any)=><div className="yearcard" key={x.y}><b>{x.y}</b><span>{x.n} Qs</span></div>)}</div></Panel></div><div className="notice"><b>Data status:</b> the supplied archive reaches 2024. Some papers are image/scanned PDFs and need OCR for complete extraction; 2025/2026 source papers were not present in the supplied archive.</div></div>}
function Metric({label,value}:{label:string,value:string}){return <div className="metric"><span>{label}</span><strong>{value}</strong></div>}
function Panel({title,children}:{title:string,children:React.ReactNode}){return <section className="panel"><h2>{title}</h2>{children}</section>}
function Browse(p:any){return <div><div className="pagehead"><div><div className="eyebrow">QUESTION BANK</div><h1>All indexed PYQs</h1><p>{p.filtered.length.toLocaleString()} questions match your filters.</p></div></div><div className="filters"><input value={p.search} onChange={(e:any)=>p.setSearch(e.target.value)} placeholder="Search question text, topic, source…"/><select value={p.subject} onChange={(e:any)=>p.setSubject(e.target.value)}>{subjects.map(s=><option key={s}>{s}</option>)}</select><select value={p.year} onChange={(e:any)=>p.setYear(e.target.value)}>{years.map(y=><option key={y}>{y}</option>)}</select></div><div className="question-list">{p.filtered.slice(0,200).map((q:Question)=><button className={"qrow "+(q.id===p.selectedId?"selected":"")} key={q.id} onClick={()=>p.onSelect(q)}><span className="qyear">{q.year}</span><span className="qnum">Q{q.number}</span><span className="qtext">{stripLabel(q.question)}</span><span className="tag">{q.subtopic||q.subject}</span></button>)}</div>{p.filtered.length>200&&<div className="notice">Showing the first 200 results. Narrow the filters to drill down further.</div>}</div>}
function Practice({q,index,total,answer,setAnswer,submitted,submit,next}:any){const correct=normalize(answer||"")===normalize(q.answer||"");return <div><div className="pagehead"><div><div className="eyebrow">{q.year} · {q.source} · PAGE {q.page}</div><h1>Practice question {index+1} / {total}</h1><p>{q.subject}{q.subtopic?` · ${q.subtopic}`:""} · {q.type}</p></div></div><section className="question-card"><div className="question-meta"><span>{q.year}</span><span>Q{q.number}</span><span>{q.answer?"Answer key available":"No answer key"}</span></div><div className="question-body">{q.question}</div>{Object.keys(q.options).length>0?<div className="options">{Object.entries(q.options).map(([k,v])=><button key={k} disabled={submitted} className={submitted&&normalize(k)===normalize(q.answer||"")?"correct":submitted&&answer===k?"wrong":answer===k?"chosen":""} onClick={()=>setAnswer(k)}><b>{k}</b><span>{v}</span></button>)}</div>:<input className="nat" value={answer||""} disabled={submitted} onChange={(e:any)=>setAnswer(e.target.value)} placeholder="Enter your answer"/>}{!submitted?<button className="primary submit" onClick={submit} disabled={answer===null||answer===""}>Submit answer</button>:<div className={correct?"result correctbox":"result wrongbox"}><b>{correct?"Correct.":"Not correct."}</b><div>Correct answer: <strong>{q.answer||"Not available"}</strong></div>{correct&&q.solution&&<div className="solution"><h3>Worked solution</h3><p>{q.solution}</p></div>}{correct&&!q.solution&&<div className="muted">Answer key available, but no worked explanation is stored for this question yet.</div>}<button className="outline" onClick={next} disabled={index>=total-1}>Next question →</button></div>}</section></div>}
function normalize(s:string){return s.trim().toUpperCase().replace(/\s+/g,"")}
createRoot(document.getElementById("root")!).render(<App/>);
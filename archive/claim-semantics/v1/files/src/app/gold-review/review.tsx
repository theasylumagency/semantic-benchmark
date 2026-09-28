"use client";

import { useMemo, useState } from "react";
import type { GoldReviewSnapshot, ReviewProgress } from "@/lib/benchmark/gold-review";
import { requiresSecondPass } from "@/lib/benchmark/review-rules";
import type { BenchmarkItem, Split } from "@/lib/benchmark/types";
import type { ContractId } from "@/lib/benchmark/contracts";
import "./review.css";

type Pass = "first" | "second";
type Form = { itemId: string; action: "needs-correction" | "ontology-review" } | null;
const gold = (value: boolean | null) => value === null ? "გადასაწყვეტი" : value ? "YES" : "NO";
const statusName: Record<BenchmarkItem["goldStatus"], string> = {
  draft: "Draft", reviewed: "Reviewed", "needs-correction": "Needs correction", "ontology-review": "Ontology review",
};

function Progress({ title, value }: { title: string; value: ReviewProgress }) {
  return <div className="gr-progress-card"><h3>{title}</h3><strong>{value.reviewed} / {value.total}</strong><div className="gr-progress-track"><span style={{ width: `${value.total ? value.reviewed / value.total * 100 : 0}%` }} /></div><p>პირველი გავლა {value.firstPassComplete}/{value.total} · {value.draft} draft · {value.needsCorrection} needs correction · {value.ontologyReview} ontology review</p></div>;
}

export default function GoldReview({ initial }: { initial: GoldReviewSnapshot }) {
  const [snapshot, setSnapshot] = useState(initial);
  const [pass, setPass] = useState<Pass>("first");
  const [split, setSplit] = useState<Split | "all">("development");
  const [contract, setContract] = useState<ContractId | "all">("all");
  const [difficulty, setDifficulty] = useState("all");
  const [ambiguity, setAmbiguity] = useState("all");
  const [source, setSource] = useState("all");
  const [status, setStatus] = useState("all");
  const [query, setQuery] = useState("");
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [form, setForm] = useState<Form>(null);
  const [proposedGold, setProposedGold] = useState<boolean | null>(null);
  const [reason, setReason] = useState("");
  const [token, setToken] = useState("");
  const [busyId, setBusyId] = useState("");
  const [notice, setNotice] = useState("");

  const groups = useMemo(() => {
    const all = new Map<string, BenchmarkItem[]>();
    for (const item of snapshot.items) all.set(item.groupId, [...(all.get(item.groupId) || []), item]);
    return [...all.entries()].filter(([groupId, items]) => {
      const matches = items.some((item) =>
        (split === "all" || item.split === split) &&
        (contract === "all" || item.contract === contract) &&
        (difficulty === "all" || item.difficulty === difficulty) &&
        (ambiguity === "all" || item.ambiguity === ambiguity) &&
        (source === "all" || item.source === source) &&
        (status === "all" || item.goldStatus === status) &&
        (pass === "first" || (requiresSecondPass(item) && Boolean(snapshot.records[item.id]?.first))) &&
        (!query || item.text.toLocaleLowerCase("ka").includes(query.toLocaleLowerCase("ka")) || groupId.includes(query.toLowerCase())));
      return matches;
    }).sort(([a], [b]) => pass === "first" ? a.localeCompare(b) : b.localeCompare(a));
  }, [snapshot, split, contract, difficulty, ambiguity, source, status, query, pass]);
  const selectedIndex = Math.max(0, groups.findIndex(([id]) => id === selectedGroupId));
  const selected = groups[selectedIndex];

  async function save(itemId: string, action: "draft" | "reviewed" | "needs-correction" | "ontology-review") {
    setBusyId(itemId); setNotice("");
    try {
      const response = await fetch("/api/gold-review", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ itemId, pass, status: action,
          ...(action === "needs-correction" ? { proposedGold } : {}),
          ...(action === "needs-correction" || action === "ontology-review" ? { reason } : {}),
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || `HTTP ${response.status}`);
      setSnapshot(payload as GoldReviewSnapshot);
      setForm(null); setReason(""); setProposedGold(null);
      setNotice(`${itemId}: გადაწყვეტილება შენახულია.`);
    } catch (error) { setNotice(error instanceof Error ? error.message : "ჩანაწერი ვერ შეინახა"); }
    finally { setBusyId(""); }
  }

  function openForm(itemId: string, action: "needs-correction" | "ontology-review") {
    setForm({ itemId, action }); setReason(""); setProposedGold(null); setNotice("");
  }

  return <main className="gr-shell">
    <header className="gr-header"><div><span className="gr-eyebrow">SEMANTIC BENCHMARK · HUMAN ANNOTATION</span><h1>Blind Gold Review</h1><p>შეაფასეთ ტექსტი და მისი ყველა contract დამოუკიდებლად. თითოეული გადაწყვეტილება ცალკე ინახება.</p></div><span className="gr-version">Dataset {snapshot.datasetVersion}</span></header>
    <section className="gr-progress" aria-label="Review progress">
      <Progress title="სულ" value={snapshot.progress.all} /><Progress title="Development" value={snapshot.progress.development} /><Progress title="Validation" value={snapshot.progress.validation} />
    </section>
    <section className="gr-stability" aria-label="Human annotation stability"><div><span>მეორე გავლა</span><strong>{snapshot.secondPass.completed} / {snapshot.secondPass.eligible}</strong></div><div><span>ადამიანური თანხმობა</span><strong>{snapshot.secondPass.agreementRate === null ? "—" : `${(snapshot.secondPass.agreementRate * 100).toFixed(1)}%`}</strong></div><div><span>Gold flip</span><strong>{snapshot.secondPass.goldFlipCount}</strong></div><div><span>ონტოლოგიამდე ესკალაცია</span><strong>{snapshot.secondPass.ontologyEscalationCount}</strong></div></section>
    <div className="gr-pass" role="group" aria-label="Review pass"><button type="button" className={pass === "first" ? "active" : ""} onClick={() => { setPass("first"); setSelectedGroupId(""); setForm(null); }}>პირველი გავლა</button><button type="button" className={pass === "second" ? "active" : ""} onClick={() => { setPass("second"); setSelectedGroupId(""); setForm(null); }}>რთული ქეისების მეორე გავლა</button><span>{pass === "second" ? "ჯგუფები საპირისპირო რიგითაა. პირველი არჩევანი გამოჩნდება მხოლოდ მეორე გადაწყვეტილების შენახვის შემდეგ." : "ჯერ Development, შემდეგ Validation."}</span></div>
    <div className="gr-filters" aria-label="Review filters">
      <label>ძიება<input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ტექსტი ან group ID" /></label>
      <label>Split<select value={split} onChange={(event) => setSplit(event.target.value as Split | "all")}><option value="all">ყველა</option><option value="development">Development</option><option value="validation">Validation</option></select></label>
      <label>Contract<select value={contract} onChange={(event) => setContract(event.target.value as ContractId | "all")}><option value="all">ყველა</option>{Object.entries(snapshot.contracts).map(([id, value]) => <option key={id} value={id}>{value.label}</option>)}</select></label>
      <label>სირთულე<select value={difficulty} onChange={(event) => setDifficulty(event.target.value)}><option value="all">ყველა</option><option value="obvious">Obvious</option><option value="moderate">Moderate</option><option value="nuanced">Nuanced</option></select></label>
      <label>ბუნდოვანება<select value={ambiguity} onChange={(event) => setAmbiguity(event.target.value)}><option value="all">ყველა</option><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></label>
      <label>წყარო<select value={source} onChange={(event) => setSource(event.target.value)}><option value="all">ყველა</option><option value="seed">Seed</option><option value="adversarial-batch-01">Adversarial 01</option><option value="adversarial-expansion">Expansion</option></select></label>
      <label>Gold status<select value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">ყველა</option><option value="draft">Draft</option><option value="reviewed">Reviewed</option><option value="needs-correction">Needs correction</option><option value="ontology-review">Ontology review</option></select></label>
    </div>
    {snapshot.writeProtected ? <label className="gr-token">Review-ის წვდომის კოდი<input type="password" value={token} onChange={(event) => setToken(event.target.value)} autoComplete="off" placeholder="BENCHMARK_ACCESS_TOKEN" /></label> : null}
    {notice ? <p className="gr-notice" role="status">{notice}</p> : null}
    <div className="gr-layout"><aside className="gr-groups" aria-label="Text groups"><div className="gr-groups-head">{groups.length} ტექსტის ჯგუფი</div>{groups.map(([id, items]) => <button type="button" key={id} className={selected?.[0] === id ? "selected" : ""} onClick={() => { setSelectedGroupId(id); setForm(null); }}><small>{id} · {items[0].split}</small><span>{items[0].text}</span><em>{items.length} contract</em></button>)}</aside>
      <section className="gr-detail" aria-label="Selected text group">{selected ? <><div className="gr-group-head"><div><small>{selected[0]} · {selected[1][0].split}</small><h2>{selected[1][0].text}</h2><p>ამ ტექსტისთვის {selected[1].length} contract შეფასდება.</p></div><div className="gr-arrows"><button type="button" disabled={selectedIndex === 0} onClick={() => { setSelectedGroupId(groups[selectedIndex - 1][0]); setForm(null); }} aria-label="წინა ჯგუფი">←</button><button type="button" disabled={selectedIndex >= groups.length - 1} onClick={() => { setSelectedGroupId(groups[selectedIndex + 1][0]); setForm(null); }} aria-label="შემდეგი ჯგუფი">→</button></div></div>
        {selected[1].map((item) => {
          const record = snapshot.records[item.id];
          const decision = record?.[pass];
          const eligible = requiresSecondPass(item);
          const canReview = pass === "first" || (eligible && Boolean(record?.first));
          const revealFirst = pass === "first" || Boolean(record?.second);
          const unresolved = (value?: typeof decision) => value?.status === "needs-correction" || value?.status === "ontology-review";
          const locked = unresolved(decision) || (pass === "first" && unresolved(record?.second));
          return <article className="gr-contract" key={item.id}><div className="gr-contract-top"><div><small>{item.id}</small><h3>{snapshot.contracts[item.contract].label} <code>{item.contract}</code></h3></div><span className={`gr-status ${revealFirst ? item.goldStatus : "draft"}`}>{revealFirst ? statusName[item.goldStatus] : "მეორე გავლა მოსალოდნელია"}</span></div>
            <p className="gr-description">{snapshot.contracts[item.contract].description}</p>
            <div className="gr-fields"><div><span>შემოთავაზებული gold</span><strong>{gold(item.expected)}</strong></div><div><span>სირთულე</span><strong>{item.difficulty}</strong></div><div><span>ბუნდოვანება</span><strong>{item.ambiguity}</strong></div><div><span>წყარო</span><strong>{item.source}</strong></div></div>
            <div className="gr-rationale"><span>ადამიანური დასაბუთება</span><p>{item.humanRationale}</p></div>
            {pass === "second" && !revealFirst ? <p className="gr-pass-note">პირველი გავლა ჩაწერილია; მისი გადაწყვეტილება მეორე არჩევანამდე დამალულია.</p> : null}
            {revealFirst && record?.first ? <p className="gr-decision">პირველი გადაწყვეტილება: {record.first.status}{record.first.proposedGold !== undefined ? ` → ${gold(record.first.proposedGold)}` : ""}{record.first.reason ? ` · ${record.first.reason}` : ""}</p> : null}
            {record?.second ? <p className="gr-decision">მეორე გადაწყვეტილება: {record.second.status}{record.second.proposedGold !== undefined ? ` → ${gold(record.second.proposedGold)}` : ""}{record.second.reason ? ` · ${record.second.reason}` : ""} · {record.agreement === "agree" ? "თანხმობა" : "უთანხმოება"}</p> : null}
            {canReview ? locked ? <p className="gr-pass-note">ეს საკითხი ღიაა. გადაწყვეტილება შეიცვლება მხოლოდ წყაროსა და წესის შესაბამისი შესწორების შემდეგ.</p> : <div className="gr-actions"><button type="button" disabled={busyId === item.id || item.expected === null} onClick={() => save(item.id, "reviewed")}>Reviewed — agree</button><button type="button" disabled={busyId === item.id || item.expected === null} onClick={() => openForm(item.id, "needs-correction")}>Needs correction</button><button type="button" disabled={busyId === item.id} onClick={() => openForm(item.id, "ontology-review")}>Ontology issue</button>{decision ? <button type="button" className="gr-reset" disabled={busyId === item.id} onClick={() => save(item.id, "draft")}>ამ გავლა Draft-ად დაბრუნება</button> : null}</div> : <p className="gr-pass-note">მეორე გავლა მხოლოდ რთული ქეისებისთვისაა, პირველი გადაწყვეტილების შემდეგ.</p>}
            {form?.itemId === item.id ? <div className="gr-form"><h4>{form.action === "needs-correction" ? "შესწორების მოთხოვნა" : "ონტოლოგიური საკითხი"}</h4>{form.action === "needs-correction" ? <label>თქვენი შემოთავაზებული gold<select value={proposedGold === null ? "" : proposedGold ? "yes" : "no"} onChange={(event) => setProposedGold(event.target.value === "" ? null : event.target.value === "yes")}><option value="">აირჩიეთ</option><option value="yes">YES</option><option value="no">NO</option></select></label> : null}<label>წერილობითი მიზეზი<textarea maxLength={2000} value={reason} onChange={(event) => setReason(event.target.value)} placeholder="მიუთითეთ რა უნდა გადაიხედოს და რატომ" /></label><div><button type="button" disabled={busyId === item.id || !reason.trim() || (form.action === "needs-correction" && (proposedGold === null || proposedGold === item.expected))} onClick={() => save(item.id, form.action)}>ჩანაწერის შენახვა</button><button type="button" onClick={() => setForm(null)}>გაუქმება</button></div></div> : null}
          </article>;
        })}</> : <div className="gr-empty">ამ ფილტრებისთვის ჯგუფი ვერ მოიძებნა.</div>}</section></div>
  </main>;
}

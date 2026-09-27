"use client";

import { useMemo, useState } from "react";
import { CONTRACTS, CONTRACT_IDS, type ContractId } from "@/lib/benchmark/contracts";
import { comparableRuns, compareRepeatedRuns } from "@/lib/benchmark/stability";
import type { BenchmarkItem, BenchmarkRun, Prediction, ProviderId, Split } from "@/lib/benchmark/types";

type Snapshot = {
  dataset: { development: BenchmarkItem[]; validation: BenchmarkItem[]; version: string; reviewedCount: number; draftCount: number; ontologyReviewCount: number; total: number };
  providers: Record<ProviderId, boolean>;
  baselineConfiguration: { model: string; reasoningEffort: string };
  protocolVersion: string;
  validationFrozen: boolean;
  runs: BenchmarkRun[];
  writeProtected: boolean;
};

const percent = (value: number | null | undefined) => value == null ? "—" : `${(value * 100).toFixed(1)}%`;
const decimal = (value: number | null | undefined, digits = 3) => value == null ? "—" : value.toFixed(digits);
const date = (value: string) => new Date(value).toLocaleString("ka-GE", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
const evaluableCount = (run: BenchmarkRun) => run.metrics.total - (run.metrics.excludedGold || 0);
const answerCoverage = (run: BenchmarkRun) => evaluableCount(run) ? run.metrics.scored / evaluableCount(run) : null;
const allCaseAccuracy = (run: BenchmarkRun) => run.metrics.accuracy == null || !evaluableCount(run) ? null : run.metrics.accuracy * run.metrics.scored / evaluableCount(run);
const sameItems = (left: BenchmarkRun, right: BenchmarkRun) => {
  const rightIds = new Set(right.predictions.map((prediction) => prediction.itemId));
  return left.predictions.length === right.predictions.length && new Set(left.predictions.map((prediction) => prediction.itemId)).size === left.predictions.length && rightIds.size === right.predictions.length &&
    left.predictions.every((prediction) => rightIds.has(prediction.itemId));
};

function MetricCard({ label, value, detail, tone = "plain" }: { label: string; value: string; detail: string; tone?: string }) {
  return <div className={`metric-card ${tone}`}><div className="metric-label">{label}</div><div className="metric-value">{value}</div><div className="metric-detail">{detail}</div></div>;
}

function CaseRow({ item, prediction, onReview, busy, provider }: { item: BenchmarkItem; prediction?: Prediction; onReview: (item: BenchmarkItem) => void; busy: boolean; provider?: ProviderId }) {
  return <article className="case-row">
    <div className="case-main">
      <div className="case-id">{item.id} <span>·</span> {item.source} <span>·</span> {item.difficulty} <span>·</span> ambiguity: {item.ambiguity}</div>
      <p>{item.text}</p>
      <div className="case-tags"><span className="contract-tag">{CONTRACTS[item.contract].label}</span>{item.tags.filter((tag) => !tag.startsWith("adversarial-")).slice(0, 3).map((tag) => <span key={tag}>{tag}</span>)}</div>
      <details className="case-rationale"><summary>სამუშაო განმარტება</summary><p>{item.humanRationale}</p></details>
      {prediction?.error ? <div className="case-error">{prediction.error}</div> : null}
      <div className="review-action"><span>Gold: {item.goldStatus}</span>{item.goldStatus === "ontology-review" ? <span>ჯერ ონტოლოგიის წესი გადასაწყვეტია</span> : <button type="button" disabled={busy} onClick={() => onReview(item)}>{busy ? "ინახება…" : item.goldStatus === "reviewed" ? "Draft-ად დაბრუნება" : "გადავხედე · Reviewed"}</button>}</div>
    </div>
    <div className="case-outcome">
      <div><small>სამუშაო ნიშნული</small><strong className={item.expected === null ? "muted" : item.expected ? "yes" : "no"}>{item.expected === null ? "ONTOLOGY REVIEW" : item.expected ? "YES" : "NO"}</strong></div>
      <div><small>{provider === "jev" ? "Jev adapter-ის პასუხი" : "მოდელის პასუხი"}</small><strong className={prediction?.predicted === true ? "yes" : prediction?.predicted === false ? "no" : "muted"}>{prediction ? prediction.error ? "ERROR" : prediction.predicted === null ? provider === "jev" ? "APP ABSTAIN" : "UNCERTAIN" : prediction.predicted ? "YES" : "NO" : "—"}</strong></div>
    </div>
  </article>;
}

export default function Workbench({ initial }: { initial: Snapshot }) {
  const [snapshot, setSnapshot] = useState(initial);
  const [selectedId, setSelectedId] = useState(initial.runs[0]?.id || "");
  const [provider, setProvider] = useState<ProviderId>("jev");
  const [split, setSplit] = useState<Split>("development");
  const [inspectionSplit, setInspectionSplit] = useState<Split>("development");
  const [threshold, setThreshold] = useState("0.80");
  const [sampleGroups, setSampleGroups] = useState("10");
  const [token, setToken] = useState("");
  const [running, setRunning] = useState(false);
  const [notice, setNotice] = useState("");
  const [query, setQuery] = useState("");
  const [contractFilter, setContractFilter] = useState<ContractId | "all">("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [difficultyFilter, setDifficultyFilter] = useState("all");
  const [outcomeFilter, setOutcomeFilter] = useState("all");
  const [ambiguityFilter, setAmbiguityFilter] = useState("all");
  const [goldFilter, setGoldFilter] = useState("all");
  const [reviewBusyId, setReviewBusyId] = useState("");
  const [visibleCount, setVisibleCount] = useState(12);

  const selectedRun = snapshot.runs.find((run) => run.id === selectedId) || snapshot.runs[0];
  const stabilityRuns = useMemo(() => selectedRun ? comparableRuns(snapshot.runs, selectedRun) : [], [snapshot.runs, selectedRun]);
  const stability = useMemo(() => stabilityRuns.length >= 3 ? compareRepeatedRuns(stabilityRuns) : null, [stabilityRuns]);
  const peerRun = snapshot.runs.find((run) => selectedRun && run.provider !== selectedRun.provider && run.split === selectedRun.split &&
    run.datasetVersion === selectedRun.datasetVersion && run.protocolVersion === selectedRun.protocolVersion && sameItems(run, selectedRun));
  const fullDevGroups = new Set(snapshot.dataset.development.map((item) => item.groupId)).size;
  const calibration = snapshot.runs.find((run) => run.provider === provider && run.split === "development" && run.groupCount === fullDevGroups && run.protocolVersion === snapshot.protocolVersion && run.metrics.failed === 0 &&
    (provider !== "baseline" || (run.requestedModel === snapshot.baselineConfiguration.model && run.reasoningEffort === snapshot.baselineConfiguration.reasoningEffort)));
  const exploredItems = inspectionSplit === "validation" ? snapshot.dataset.validation : snapshot.dataset.development;
  const predictionMap = useMemo(() => new Map(selectedRun?.predictions.map((prediction) => [prediction.itemId, prediction])), [selectedRun]);
  const filteredItems = useMemo(() => exploredItems.filter((item) =>
    (contractFilter === "all" || item.contract === contractFilter) &&
    (sourceFilter === "all" || item.source === sourceFilter) &&
    (difficultyFilter === "all" || item.difficulty === difficultyFilter) &&
    (ambiguityFilter === "all" || item.ambiguity === ambiguityFilter) &&
    (goldFilter === "all" || item.goldStatus === goldFilter) &&
    (outcomeFilter === "all" || (outcomeFilter === "mismatch" && item.expected !== null && predictionMap.get(item.id)?.predicted !== null && predictionMap.has(item.id) && predictionMap.get(item.id)?.predicted !== item.expected) ||
      (outcomeFilter === "unscored" && predictionMap.has(item.id) && predictionMap.get(item.id)?.predicted === null) ||
      (outcomeFilter === "ontology-review" && item.expected === null)) &&
    (!query || item.text.toLocaleLowerCase("ka").includes(query.toLocaleLowerCase("ka")) || item.tags.some((tag) => tag.includes(query.toLowerCase())))
  ), [exploredItems, contractFilter, sourceFilter, difficultyFilter, ambiguityFilter, goldFilter, outcomeFilter, query, predictionMap]);
  const runDisabled = running || !snapshot.providers[provider] || (split === "validation" && (!calibration || !snapshot.validationFrozen));

  async function startRun() {
    setRunning(true); setNotice("");
    try {
      const response = await fetch("/api/workbench", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ provider, split, threshold: Number(threshold), sampleGroups: sampleGroups === "10" ? 10 : sampleGroups, calibrationRunId: calibration?.id }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || `HTTP ${response.status}`);
      setSnapshot((current) => ({ ...current, runs: [payload.run, ...current.runs] }));
      setSelectedId(payload.run.id);
      setNotice(payload.run.metrics.failed ? `გაშვება დასრულდა ${payload.run.metrics.failed} შეცდომით. დეტალები ანგარიშშია.` : "გაშვება დასრულდა და ანგარიში შეინახა.");
      document.getElementById("results")?.scrollIntoView({ behavior: "smooth" });
    } catch (error) { setNotice(error instanceof Error ? error.message : "გაშვება ვერ შესრულდა"); }
    finally { setRunning(false); }
  }

  async function changeReview(item: BenchmarkItem) {
    setReviewBusyId(item.id); setNotice("");
    try {
      const response = await fetch("/api/workbench", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ itemId: item.id, status: item.goldStatus === "reviewed" ? "draft" : "reviewed" }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || `HTTP ${response.status}`);
      setSnapshot((current) => ({ ...current, dataset: payload.dataset, protocolVersion: payload.protocolVersion, validationFrozen: payload.validationFrozen }));
      setNotice(`${item.id}: ${item.goldStatus === "reviewed" ? "draft" : "reviewed"} შენახულია. პროტოკოლის ვერსია განახლდა.`);
    } catch (error) { setNotice(error instanceof Error ? error.message : "გადახედვა ვერ შეინახა"); }
    finally { setReviewBusyId(""); }
  }

  return <div className="shell">
    <aside className="sidebar">
      <div className="brand"><span className="brand-mark">U<span>.</span></span><div><strong>UNDA</strong><small>RESEARCH LAB</small></div></div>
      <div className="sidebar-section-label">WORKSPACE</div>
      <nav aria-label="მთავარი ნავიგაცია" className="side-nav">
        <a href="#overview" className="active"><span className="nav-icon">◫</span> მიმოხილვა</a>
        <a href="#results"><span className="nav-icon">▥</span> შედეგები</a>
        <a href="#stability"><span className="nav-icon">◇</span> სტაბილურობა</a>
        <a href="#dataset"><span className="nav-icon">▤</span> Dataset</a>
        <a href="#method"><span className="nav-icon">◎</span> მეთოდოლოგია</a>
      </nav>
      <div className="sidebar-bottom"><span className="online-dot" /> კვლევის გარემო <span className="version">v0.1</span></div>
    </aside>

    <main className="main-content" id="overview">
      <div className="topline"><div className="breadcrumbs">UNDA <span>/</span> Research <span>/</span> <strong>Semantic Benchmark KA</strong></div><div className="topline-right"><span className="status-dot" /> დამოუკიდებელი ექსპერიმენტი</div></div>
      <section className="hero">
        <div className="eyebrow"><span className="eyebrow-line" /> MODEL EVALUATION · GEORGIAN LANGUAGE</div>
        <h1>Semantic Benchmark <em>KA</em></h1>
        <p>ვზომავთ, რამდენად საიმედოდ პასუხობს Jev ვიწრო ქართულ semantic კითხვებს — რეალური ქეისებით, ალბათობებით და ძლიერი მოდელის baseline-ით.</p>
        <div className="hero-meta"><span><b>01</b> Claim Semantics</span><span><b>02</b> Editorial Quality <i>მოგვიანებით</i></span><span><b>03</b> Evidence Routing <i>მოგვიანებით</i></span></div>
      </section>

      <section className="section" aria-labelledby="overview-title">
        <div className="section-heading"><div><div className="kicker">01 / OVERVIEW</div><h2 id="overview-title">კვლევის მდგომარეობა</h2></div><span className="section-note">{selectedRun ? `არჩეული გაშვება · ${date(selectedRun.createdAt)}` : "პირველი გაშვების მოლოდინში"}</span></div>
        <div className="metric-grid">
          <MetricCard label="სრული ნაკრების სიზუსტე" value={selectedRun ? percent(allCaseAccuracy(selectedRun)) : "—"} detail={selectedRun ? `${selectedRun.metrics.scored} პასუხი / ${evaluableCount(selectedRun)} შეფასებადი · პასუხის სიზუსტე ${percent(selectedRun.metrics.accuracy)}` : "მოდელის გაშვების შემდეგ"} tone="accent" />
          <MetricCard label="ავტონომიური დაფარვა" value={percent(selectedRun?.metrics.coverage)} detail={selectedRun ? `confidence ≥ ${Math.round(selectedRun.threshold * 100)}%` : "fallback ზღურბლის მიხედვით"} />
          <MetricCard label="შეცდომების დაჭერა" value={percent(selectedRun?.metrics.errorCapture)} detail="დაბალი confidence-ის ნაწილში" />
          <MetricCard label="პასუხის დრო · p95" value={selectedRun?.metrics.latencyMs.p95 == null ? "—" : `${selectedRun.metrics.latencyMs.p95} ms`} detail="ერთი ტექსტი / რამდენიმე კითხვა" />
        </div>
        <div className="overview-strip"><div><strong>{snapshot.dataset.total}</strong><span>contract case</span></div><div><strong>{snapshot.dataset.development.length}</strong><span>development</span></div><div><strong>{snapshot.dataset.validation.length}</strong><span>validation</span></div><div><strong>{snapshot.dataset.ontologyReviewCount}</strong><span>ontology-review დარჩა</span></div><div><strong>{snapshot.dataset.reviewedCount}/{snapshot.dataset.total}</strong><span>გადამოწმებული · {snapshot.dataset.draftCount} draft დარჩა</span></div></div>
      </section>

      <section className="section" aria-labelledby="run-title">
        <div className="section-heading"><div><div className="kicker">02 / EXPERIMENT</div><h2 id="run-title">ახალი გაშვება</h2></div><span className="section-note">ერთი ტექსტის კითხვები ერთ მოთხოვნაში მუშავდება</span></div>
        <div className="run-panel"><div className="run-intro"><span className="run-icon">▶</span><div><h3>მოდელის შეფასება</h3><p>აირჩიეთ მოდელი და მონაცემთა ნაწილი. შედეგი შენახული იქნება ანგარიშად.</p></div></div>
          <div className="run-controls">
            <label>მოდელი<select value={provider} onChange={(event) => setProvider(event.target.value as ProviderId)}><option value="jev">Jev {snapshot.providers.jev ? "· მზად არის" : "· გასამართია"}</option><option value="baseline">{snapshot.baselineConfiguration.model} · {snapshot.baselineConfiguration.reasoningEffort} {snapshot.providers.baseline ? "· მზად არის" : "· გასამართია"}</option></select></label>
            <label>მონაცემები<select value={split} onChange={(event) => setSplit(event.target.value as Split)}><option value="development">Development</option><option value="validation">Validation</option></select></label>
            {split === "development" ? <>{provider === "jev" ? <label>Confidence ზღვარი<select value={threshold} onChange={(event) => setThreshold(event.target.value)}><option value="0.70">70%</option><option value="0.80">80%</option><option value="0.85">85%</option><option value="0.90">90%</option><option value="0.95">95%</option></select></label> : null}<label>მასშტაბი<select value={sampleGroups} onChange={(event) => setSampleGroups(event.target.value)}><option value="10">10 ტექსტი · სწრაფი ტესტი</option><option value="batch-01">Batch 01 · 48 case</option><option value="adversarial-all">Adversarial · 100 case</option><option value="all">ყველა · სრული გაშვება</option></select></label></> : <div className="validation-info">{!snapshot.validationFrozen ? "Validation ჩაკეტილია პროტოკოლის გაყინვამდე" : provider === "jev" ? "ზღვარი იკეტება სრული development გაშვებიდან:" : "სრული development გაშვება:"} <strong>{snapshot.validationFrozen ? calibration ? provider === "jev" ? `${Math.round(calibration.threshold * 100)}%` : "მზად არის" : "ჯერ არ არის" : "გაყინვა საჭიროა"}</strong></div>}
          </div>
          {snapshot.writeProtected ? <label className="token-field">გაშვებისა და review-ის წვდომის კოდი<input type="password" value={token} onChange={(event) => setToken(event.target.value)} placeholder="BENCHMARK_ACCESS_TOKEN" autoComplete="off" /></label> : null}
          <div className="run-footer"><div className="run-hint">{!snapshot.providers[provider] ? "ამ მოდელის გასაშვებად სერვერზე API გასაღები მიუთითეთ." : split === "validation" && !snapshot.validationFrozen ? "ჯერ გადაამოწმეთ gold და გაყინეთ პროტოკოლი." : split === "validation" && !calibration ? "ჯერ გაუშვით development-ის სრული ნაკრები იმავე მოდელით." : "შედეგები ლოკალურად შეინახება reports/runs საქაღალდეში."}</div><button className="primary-button" type="button" onClick={startRun} disabled={runDisabled}>{running ? "მიმდინარეობს…" : "გაშვების დაწყება"}<span>↗</span></button></div>
          <div className="run-hint">პროტოკოლის ვერსია: <code>{snapshot.protocolVersion}</code> · {snapshot.validationFrozen ? "გაყინულია" : "გაყინული არ არის"}. Review-ის ცვლილება ვერსიას ცვლის.</div>
          {notice ? <div className="notice" role="status">{notice}</div> : null}
        </div>
      </section>

      <section className="section" id="results" aria-labelledby="results-title">
        <div className="section-heading"><div><div className="kicker">03 / ANALYSIS</div><h2 id="results-title">შედეგები და შეცდომები</h2></div><span className="section-note">{snapshot.runs.length} შენახული გაშვება</span></div>
        {selectedRun && selectedRun.datasetVersion === snapshot.dataset.version && selectedRun.protocolVersion !== snapshot.protocolVersion ? <div className="notice stale">ამ ანგარიშის შემდეგ შეფასების წესები ან მოდელის კონფიგურაცია შეიცვალა. შედარებისთვის მოდელები ხელახლა გაუშვით.</div> : null}
        {selectedRun && selectedRun.metrics.excludedGold > 0 ? <div className="notice">{selectedRun.metrics.excludedGold} ბუნდოვანი gold ქულიდან გამორიცხულია და ontology review-ს ელოდება.</div> : null}
        {snapshot.runs.length ? <><div className="run-tabs" role="tablist" aria-label="გაშვებები">{snapshot.runs.map((run) => <button key={run.id} type="button" role="tab" aria-selected={selectedRun?.id === run.id} className={selectedRun?.id === run.id ? "selected" : ""} onClick={() => setSelectedId(run.id)}>{run.provider === "jev" ? "JEV" : "BASELINE"}<small>{run.split === "validation" ? "VALIDATION" : "DEV"} · {run.metrics.total} case · {date(run.createdAt)}{run.protocolVersion !== snapshot.protocolVersion ? " · ძველი" : ""}</small></button>)}</div>
          {selectedRun ? <>{selectedRun.datasetVersion !== snapshot.dataset.version ? <div className="notice stale">ეს ანგარიში მონაცემთა ნაკრების ძველი ვერსიითაა შექმნილი. ახალი შეფასებისთვის მოდელი ხელახლა გაუშვით.</div> : null}<div className="results-grid"><div className="analysis-card"><div className="card-heading"><h3>კლასიფიკაციის ხარისხი</h3><span>{selectedRun.model}{selectedRun.reasoningEffort ? ` · ${selectedRun.reasoningEffort}` : ""}</span></div><div className="score-row"><div><span>Precision</span><strong>{percent(selectedRun.metrics.precision)}</strong></div><div><span>Recall</span><strong>{percent(selectedRun.metrics.recall)}</strong></div><div><span>F1 score</span><strong>{percent(selectedRun.metrics.f1)}</strong></div></div><div className="thin-divider" /><div className="substats"><div><span>Brier score</span><strong>{decimal(selectedRun.metrics.brier)}</strong></div><div><span>Calibration error</span><strong>{percent(selectedRun.metrics.expectedCalibrationError)}</strong></div><div><span>{selectedRun.provider === "jev" ? "შეცდომა / app dead-zone" : "შეცდომა / native UNCERTAIN"}</span><strong>{selectedRun.metrics.failed} / {selectedRun.metrics.abstained}</strong></div><div><span>შესული / გასული token</span><strong>{selectedRun.metrics.totalInputTokens} / {selectedRun.metrics.totalOutputTokens}</strong></div><div><span>სულ ღირებულება</span><strong>{selectedRun.metrics.totalCostUsd == null ? "ტარიფი არ არის მითითებული" : `$${selectedRun.metrics.totalCostUsd.toFixed(4)}`}</strong></div></div></div>
            <div className="analysis-card"><div className="card-heading"><h3>Confidence → fallback</h3><span>ზღვრის ანალიზი</span></div>{selectedRun.metrics.thresholds.some((point) => point.acceptedAccuracy !== null) ? <div className="threshold-chart">{selectedRun.metrics.thresholds.map((point) => <div className={`threshold-row ${point.threshold === selectedRun.threshold ? "highlight" : ""}`} key={point.threshold}><span>{Math.round(point.threshold * 100)}%</span><div className="bar-track"><div className="bar-fill" style={{ width: `${point.coverage * 100}%` }} /></div><strong>{Math.round(point.coverage * 100)}%</strong><small>{point.acceptedErrors} შეცდომა</small></div>)}</div> : <p className="empty-inline">ამ მოდელმა ალბათობები არ დააბრუნა. Confidence ანალიზი მიუწვდომელია.</p>}<div className="chart-legend"><span className="legend-dot" /> ავტონომიური დაფარვა <span>რაც დაბალია confidence, მით მეტია fallback.</span></div></div></div>
            <div className="table-card"><div className="card-heading"><h3>შედეგი contract-ების მიხედვით</h3><span>TP / FP / FN · draft gold</span></div><div className="table-scroll"><table><thead><tr><th>CONTRACT</th><th>CASE</th><th>PRECISION</th><th>RECALL</th><th>F1</th><th>FP</th><th>FN</th></tr></thead><tbody>{selectedRun.metrics.byContract.map((row) => <tr key={row.contract}><td><strong>{CONTRACTS[row.contract].label}</strong><small>{row.contract}</small></td><td>{row.total}</td><td>{percent(row.precision)}</td><td>{percent(row.recall)}</td><td><span className={`score-pill ${(row.f1 ?? 0) >= 0.8 ? "good" : ""}`}>{percent(row.f1)}</span></td><td>{row.fp}</td><td>{row.fn}</td></tr>)}</tbody></table></div></div>
            {selectedRun.metrics.confidenceBuckets.some((bucket) => bucket.count > 0) ? <div className="table-card"><div className="card-heading"><h3>სიზუსტე confidence-ის მიხედვით</h3><span>მაღალი confidence უნდა ნიშნავდეს მაღალ სიზუსტეს</span></div><div className="table-scroll"><table><thead><tr><th>CONFIDENCE</th><th>CASE</th><th>საშუალო CONFIDENCE</th><th>ფაქტობრივი სიზუსტე</th></tr></thead><tbody>{selectedRun.metrics.confidenceBuckets.map((bucket) => <tr key={bucket.label}><td><strong>{bucket.label}</strong></td><td>{bucket.count}</td><td>{percent(bucket.meanConfidence)}</td><td>{percent(bucket.accuracy)}</td></tr>)}</tbody></table></div></div> : null}
            {peerRun ? <div className="table-card"><div className="card-heading"><h3>მოდელების შედარება</h3><span>იგივე dataset, protocol და case ID-ები</span></div><div className="table-scroll"><table><thead><tr><th>მოდელი</th><th>პასუხის დაფარვა</th><th>სრული სიზუსტე</th><th>პასუხის სიზუსტე</th><th>F1</th><th>p95</th><th>ღირებულება</th></tr></thead><tbody>{[selectedRun, peerRun].map((run) => <tr key={run.id}><td><strong>{run.model}</strong><small>{run.provider}{run.reasoningEffort ? ` · ${run.reasoningEffort}` : ""}</small></td><td>{percent(answerCoverage(run))}</td><td>{percent(allCaseAccuracy(run))}</td><td>{percent(run.metrics.accuracy)}</td><td>{percent(run.metrics.f1)}</td><td>{run.metrics.latencyMs.p95 == null ? "—" : `${run.metrics.latencyMs.p95} ms`}</td><td>{run.metrics.totalCostUsd == null ? "—" : `$${run.metrics.totalCostUsd.toFixed(4)}`}</td></tr>)}</tbody></table></div></div> : null}
          </> : null}</> : <div className="empty-state"><div className="empty-symbol">◎</div><h3>შედეგები ჯერ არ არის</h3><p>API გასაღების კონფიგურაციის შემდეგ გაუშვით Jev ან baseline მოდელი. აქ გამოჩნდება contract-ების ხარისხი, calibration და fallback ანალიზი.</p></div>}
      </section>

      <section className="section" id="stability" aria-labelledby="stability-title"><div className="section-heading"><div><div className="kicker">04 / STABILITY</div><h2 id="stability-title">განმეორებითი გაშვებების სტაბილურობა</h2></div><span className="section-note">სიზუსტისგან დამოუკიდებელი შეფასება</span></div>
        <div className="table-card stability-card"><div className="card-heading"><h3>{selectedRun ? `${selectedRun.model} · ${selectedRun.split} · ${selectedRun.sample || "historical sample"}` : "აირჩიეთ გაშვება"}</h3><span>{stabilityRuns.length}/3–5 შედარებადი გაშვება</span></div>
          {stability ? <div className="stability-metrics"><div><small>ერთნაირი ნიშნული ყველა გაშვებაში</small><strong>{percent(stability.sameLabelRate)}</strong></div><div><small>YES ↔ NO ცვლილების ქეისი</small><strong>{stability.yesNoFlipCount}</strong></div><div><small>{stability.provider === "jev" ? "პასუხი ↔ app abstain" : "YES/NO ↔ UNCERTAIN"}</small><strong>{stability.answerAbstainFlipCount}</strong></div>{stability.provider === "jev" ? <><div><small>ალბათობის საშუალო აბსოლუტური სხვაობა</small><strong>{decimal(stability.meanAbsoluteProbabilityDrift, 4)}</strong></div><div><small>ალბათობის მაქსიმალური სხვაობა</small><strong>{decimal(stability.maximumProbabilityDrift, 4)}</strong></div><div><small>0.40 / 0.60 ზღვრის გადაკვეთა</small><strong>{percent(stability.decisionThresholdCrossingRate)}</strong></div></> : null}</div> : <p className="empty-inline padded">ანგარიში გამოჩნდება, როცა ერთი და იმავე მონაცემების, პროტოკოლის, მოდელის კონფიგურაციისა და case-ების 3–5 სრული გაშვება იქნება. მოდელები ახლა არ იძახება.</p>}
          {stability ? <p className="stability-note">{stability.itemCount} case · {stability.runIds.length} გაშვება. ერთნაირი ნიშნული ნიშნავს თანხმობას ყველა გაშვებაში; ალბათობის საშუალო სხვაობა ითვლება ყველა წყვილზე. ზღვრის გადაკვეთა ითვლის case-ებს, რომლებშიც p გადადის 0.40 ან 0.60 საზღვარზე.</p> : null}</div>
      </section>

      <section className="section" id="dataset" aria-labelledby="dataset-title"><div className="section-heading"><div><div className="kicker">05 / DATASET</div><h2 id="dataset-title">ქართული ტესტური ქეისები</h2></div><span className="section-note">Development და validation gold ხელმისაწვდომია ადამიანური review-სთვის</span></div>
        <div className="dataset-toolbar">
          <div className="search-wrap"><span>⌕</span><input aria-label="ქეისების ძიება" placeholder="მოძებნეთ ტექსტი ან tag..." value={query} onChange={(event) => { setQuery(event.target.value); setVisibleCount(12); }} /></div>
          <select aria-label="Dataset split filter" value={inspectionSplit} onChange={(event) => { setInspectionSplit(event.target.value as Split); setVisibleCount(12); }}><option value="development">Development · {snapshot.dataset.development.length}</option><option value="validation">Validation · {snapshot.dataset.validation.length}</option></select>
          <select aria-label="Contract filter" value={contractFilter} onChange={(event) => { setContractFilter(event.target.value as ContractId | "all"); setVisibleCount(12); }}><option value="all">ყველა contract</option>{CONTRACT_IDS.map((id) => <option key={id} value={id}>{CONTRACTS[id].label}</option>)}</select>
          <select aria-label="Source filter" value={sourceFilter} onChange={(event) => { setSourceFilter(event.target.value); setVisibleCount(12); }}><option value="all">ყველა წყარო</option><option value="seed">საწყისი</option><option value="adversarial-batch-01">Adversarial 01</option><option value="adversarial-expansion">გაფართოება</option></select>
          <select aria-label="Difficulty filter" value={difficultyFilter} onChange={(event) => { setDifficultyFilter(event.target.value); setVisibleCount(12); }}><option value="all">ყველა სირთულე</option><option value="obvious">აშკარა</option><option value="moderate">საშუალო</option><option value="nuanced">ნიუანსური</option></select>
          <select aria-label="Ambiguity filter" value={ambiguityFilter} onChange={(event) => { setAmbiguityFilter(event.target.value); setVisibleCount(12); }}><option value="all">ყველა ბუნდოვანება</option><option value="low">დაბალი</option><option value="medium">საშუალო</option><option value="high">მაღალი</option></select>
          <select aria-label="Gold status filter" value={goldFilter} onChange={(event) => { setGoldFilter(event.target.value); setVisibleCount(12); }}><option value="all">ყველა gold status</option><option value="draft">Draft</option><option value="ontology-review">Ontology review</option><option value="reviewed">Reviewed</option></select>
          <select aria-label="Outcome filter" value={outcomeFilter} onChange={(event) => { setOutcomeFilter(event.target.value); setVisibleCount(12); }}><option value="all">ყველა შედეგი</option><option value="mismatch">შეცდომები</option><option value="unscored">მოდელის გაურკვეველი / წარუმატებელი</option><option value="ontology-review">Gold გადასახედი</option></select>
        </div>
        <div className="case-list">{filteredItems.slice(0, visibleCount).map((item) => <CaseRow key={item.id} item={item} prediction={selectedRun?.split === inspectionSplit ? predictionMap.get(item.id) : undefined} provider={selectedRun?.split === inspectionSplit ? selectedRun.provider : undefined} onReview={changeReview} busy={reviewBusyId === item.id} />)}{filteredItems.length === 0 ? <div className="empty-inline padded">შესაბამისი ქეისი ვერ მოიძებნა.</div> : null}</div>
        {filteredItems.length > visibleCount ? <button className="more-button" onClick={() => setVisibleCount((count) => count + 20)}>მეტის ჩვენება · {filteredItems.length - visibleCount} დარჩა ↓</button> : null}
      </section>

      <section className="section method-section" id="method"><div className="section-heading"><div><div className="kicker">06 / METHODOLOGY</div><h2>ექსპერიმენტის ეტაპები</h2></div></div><div className="method-grid"><div><span className="method-number">01</span><h3>Development</h3><p>ონტოლოგიის დაზუსტება და ზღვრის შერჩევა. Jev-ის 0.40–0.60 მონაკვეთი აპლიკაციაში კონფიგურირებული decision dead-zone-ია.</p></div><div><span className="method-number">02</span><h3>Validation</h3><p>გაყინული პროტოკოლის დადასტურება და განზოგადების შემოწმება. Gold ხელმისაწვდომია, ამიტომ ეს ნაწილი blind არ არის.</p></div><div><span className="method-number">03</span><h3>Sealed Holdout · მომავალში</h3><p>ონტოლოგიის, gold review-ისა და stability-ის დასრულების შემდეგ შეიქმნება ცალკე ერთჯერადი საბოლოო ნაკრები.</p></div></div></section>
      <footer>UNDA RESEARCH LAB <span>·</span> SEMANTIC BENCHMARK KA <span>·</span> EXPERIMENTAL v0.1</footer>
    </main>
  </div>;
}

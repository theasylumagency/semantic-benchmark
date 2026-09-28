# Claim Semantics Ontology v2 — Implementation Plan

**Status:** Planning only; no v2 implementation has been performed.  
**Approved design:** [Claim Semantics Ontology v2 Proposal](claim-semantics-ontology-v2-proposal.md)  
**Repository scope:** `unda-semantic-benchmark` only.

This plan preserves the narrow evaluation tasks, makes propositions addressable where a text contains more than one, and keeps every v1 review decision auditable. It does not authorize changes to code, datasets, gold, review state, provider calls, or UNDA production.

## 1. Implementation inventory

The current benchmark is a TypeScript/Next.js workbench with a Python case generator. Dataset evaluation rows contain one `contract` and one boolean or null `expected` value. The current files and their v2 dependencies are:

| Component | Current responsibility | Why v2 affects it | Planned change |
| --- | --- | --- | --- |
| `src/lib/benchmark/contracts.ts` | Canonical IDs, Georgian labels, and descriptions used by the workbench and provider adapters. `ContractId` is derived from these keys. | IDs and meanings change: `factualAssertion` is renamed, `proofRequirement` retires, and promise, ambiguity, and polarity concepts are added. | Make a versioned canonical ontology manifest the source of IDs, definitions, labels, and rule versions. Keep claim types, completeness signals, and semantic attributes distinct. Generate or validate the runtime registry against the manifest. |
| `src/lib/benchmark/types.ts` | `BenchmarkItem` has one contract and one boolean/null gold; `Prediction` is boolean/null with optional probability. Metrics and run types follow the same shape. | A text/contract pair may contain multiple propositions; the target may be claim presence, ambiguity-signal presence, or proposition polarity. | Add discriminated evaluation-task and proposition-reference types. Keep binary `expected` for claim/signal presence and use the `affirmed`/`negated` enum for polarity. Do not add polarity to `ContractId`. |
| `scripts/generate_dataset.py` | Holds seed cases and contract names, assigns a text group to a split, expands cases into evaluation rows, and writes the two JSONL files. | It must emit proposition references and deliberately selected v2 tasks without expanding every text across every signal. | Add a versioned v2 generation path and explicit case-level proposition segmentation/target selection. Preserve group/split/source lineage. Never write v2 output over the frozen v1 snapshot. |
| `scripts/adversarial_cases.py`, `docs/Cases.md` | Derive the documented Batch 01 rows and define the adversarial expansion cases. | V2 needs targeted boundaries for implicit comparison, schedule versus bookability, guarantees versus promises, attribution, completeness, and both polarities. | Keep documented v1 cases immutable. Add a reviewed v2 case source with explicit proposition IDs/spans and task targets; add cases deliberately rather than by a full Cartesian product. |
| `datasets/claim-semantics/development.jsonl`, `validation.jsonl` | Current generated gold and reviewable evaluation rows. They contain 404 rows across 139 unique texts: 285 Development and 119 Validation. | IDs, targets, schemas, and gold semantics change; some old rows retire and some proposition-level targets split one row into several. | Archive exact v1 bytes and hashes. Generate versioned v2 Development and Validation drafts, retaining source, group, split, and a v1-to-v2 lineage map. Do not mutate the v1 files during migration. |
| `src/lib/benchmark/providers.ts` | Builds one Jev Noul question or one OpenAI YES/NO/UNCERTAIN field per contract in each text group; prediction keys are contract IDs. | Duplicate contract types can occur for different propositions; new ambiguity and polarity targets need different expected value types. | Key responses by evaluation-item ID, include the proposition reference/context, and keep each request target narrow. Add adapters for binary and polarity tasks without asking providers to generate a complete semantic graph. |
| `src/lib/benchmark/metrics.ts` | Computes binary confusion-matrix, precision/recall/F1, abstention, Brier, calibration, and threshold metrics. | Polarity is categorical and ambiguity signals are independent binary targets; pooling them with claim presence would hide which task failed. | Report claim presence by contract, ambiguity presence by signal, and polarity separately. Preserve binary calibration where probabilities exist and report task-specific abstentions. |
| `src/lib/benchmark/stability.ts`, `scripts/stability_report.mjs` | Compare repeated runs with matching dataset/protocol/model/item IDs; calculate label flips, abstention flips, probability drift, and threshold crossings. | Run identity must include evaluation task and proposition identity; polarity needs categorical stability measures, and stability must use a fixed five-run cohort. | Evaluate five consecutive complete runs as one cohort, using all five with no outcome-based subset selection. Match on ontology, task, proposition-aware item IDs, and dataset/protocol hashes. Report polarity flips/agreement separately from binary YES/NO flips. |
| `src/lib/benchmark/data.ts` | Loads JSONL and `reviews.json`, hashes an entire dataset item for review validity, computes dataset/protocol versions, writes first/second review decisions atomically, and reads/saves run reports. | Current review digest omits contract definitions and ontology version. A stale record under a reused ID can be replaced when a new review is saved. Protocol hashing uses a hand-maintained file list. | Add versioned active/history ledgers, an effective v2 review digest, an immutable v1 archive, explicit item lineage, and a manifest-driven protocol hash. Keep old run files readable and tagged v1. |
| `src/lib/benchmark/gold-review.ts`, `review-rules.ts` | Builds blind review snapshots, progress counts, and second-pass agreement; difficult items require a second pass. | Review units can be proposition-specific and include polarity or completeness gold; signal/task families need separate progress counts. | Preserve the blind workflow and two-pass rules while grouping tasks by source text and showing only the active target/proposition details. Compute progress and agreement per task family. |
| `src/app/api/gold-review/route.ts`, `src/app/gold-review/page.tsx`, `src/app/gold-review/review.tsx`, `review.css` | Read and write first/second review decisions; display text, contract description, rationale, status, and review controls without predictions. | The reviewer must identify a proposition/span and see a boolean signal or polarity value without turning review into graph editing. | Add task target, proposition excerpt/span, completeness target, and polarity choice where applicable. Keep predictions, confidence, provider runs, and disagreement with models out of the review payload. Preserve reason and correction workflows. |
| `src/app/api/workbench/route.ts`, `src/app/workbench.tsx` | Select text groups, call providers, save runs, show contract-level metrics, predictions, and stability. | Run selection and rendering must distinguish the three task kinds and repeated same-type proposition IDs. | Display separate result sections per task family; compare providers only on identical task IDs and protocol/dataset hashes. Keep v1 and v2 runs visibly separate. |
| `scripts/check_dataset.py`, `scripts/check_review_state.py`, `scripts/check_stability.mjs` | Check current row uniqueness/split leakage, exercise review transitions against a local server, and verify repeated-run calculations. | V2 adds proposition identity, definition-version staleness, archive guarantees, and enum polarity. The review-state script currently modifies/restores the real ledger path. | Extend deterministic checks for v2 schema, split/group leakage, stale digest dependencies, one-to-many history mapping, and categorical scoring. Run review-state tests against an isolated temporary repository/data root, never the user's active ledger. |
| `scripts/mock-jev.mjs`, `scripts/mock-baseline.mjs` | Local synthetic provider endpoints for smoke testing provider adapters. | Keys and response values change from contract-keyed binary answers to evaluation-item-keyed binary or categorical answers. | Extend mocks with duplicate contract IDs on distinct proposition IDs, mixed polarity, ambiguity labels, and abstentions. Synthetic outputs remain test-only, never gold or model evidence. |
| `package.json` and scripts | Exposes dev/build/lint plus stability checks; there is no separate `tests/` or `fixtures/` directory in the current file inventory. | V2 needs a repeatable deterministic validation sequence and isolated review fixtures. | Add or document commands for v2 schema/migration/digest checks during implementation; keep generated fixtures under temporary test data and never write into the active ledger. |
| Documentation: `README.md`, `docs/brief.md`, `Cases.md`, `factualAssertion.md`, `ontology-review.md`, `gold-review.md`, `methodology.md`, and the approved proposal | Explain v1 concepts, dataset workflow, current review protocol, and the approved v2 boundaries. | Some descriptions and contracts become historical; review and scoring workflow changes. | Preserve v1 references as historical, add v2 documentation and migration notes, and link the active manifest/version. Do not silently rewrite v1 gold rationales as if they had always used v2. |
| `reports/development-checkpoint-2026-09-27.md` and local `reports/runs/*.json` | Preserve exploratory v1 provider results and stability/report data. | V1 scores use old contracts and are not directly comparable to v2. | Retain them unchanged; tag new reports with ontology version and both hashes. Do not recalculate or relabel historical v1 scores. |

## 2. Proposed v2 data model

### 2.1 Separate text, proposition references, and evaluation items

Use three conceptual records. This plan does not prescribe source-code types or storage implementation.

1. **Text group:** original text, stable `groupId`, language, split, and source/provenance.
2. **Proposition reference (`PropositionRef`):** stable-within-text `propositionId`, character span, and exact source excerpt. A proposition reference is an evaluation anchor; it does not assert that the brand adopts it or that any semantic contract applies.
3. **Evaluation item:** one target applied to one proposition reference (or, for a whole-text absence case, the text group). Its target is one of:
   - `claimPresence` + one semantic claim ID, expected `true` / `false` / unresolved;
   - `ambiguityPresence` + one completeness-signal ID, expected `true` / `false` / unresolved;
   - `polarity` + `claimPolarity`, expected `affirmed` / `negated` / unresolved, only when an asserted proposition is in scope.

The v2 target registry is exactly:

- **Semantic claim types:** `priceClaim`, `discountClaim`, `comparativeClaim`, `superlativeClaim`, `guaranteeClaim`, `outcomePromiseClaim`, `clinicalOutcomeClaim`, `quantifiedClaim`, `availabilityClaim`, `descriptiveAssertion`.
- **Completeness / ambiguity signals:** `unspecifiedOutcome`, `missingComparisonBaseline`, `undefinedSuperlativeBasis`, `vagueQuantifier`, `unclearScope`, `ambiguousReference`.
- **Semantic attribute:** `claimPolarity`, attached per proposition/clause, with values `affirmed` and `negated`.

Only semantic claim types belong in the contract ID set. Completeness signals are separate binary targets, and `claimPolarity` is an enum-valued attribute—not a semantic claim ID or binary contract.

> A PropositionRef is the minimal evaluable semantic unit that can receive one coherent `claimPolarity` value.

A PropositionRef must not contain multiple independently negatable propositions. It is an evaluation anchor, not a grammatical sentence or an arbitrary clause: its boundaries follow the proposition being evaluated and the scope needed to assign one coherent polarity. A sentence may therefore require several PropositionRefs, and a PropositionRef may cover less than a sentence. For example, “მკურნალობა ტკივილს ამცირებს, მაგრამ შეშუპებას არ ამცირებს” contains two clinical-outcome propositions: the pain outcome is affirmed and the swelling outcome is negated, so they require separate PropositionRefs.

Keep `claimPolarity` outside the semantic claim ID registry. A single proposition may have several claim-presence items—for example, the same pain outcome can be both a promise and a clinical outcome—and one proposition-level polarity value. Completeness signals attach to the proposition they describe.

Conceptual shape:

```text
TextGroup
  groupId, text, language, split, source

PropositionRef
  propositionId, startOffset, endOffset, excerpt

EvaluationItem
  evaluationId, groupId, propositionId?, taskKind, targetId, expected, rationale
```

Offsets should use a documented, deterministic character-count convention over the exact stored text. If text changes, spans and their digest become stale. Context surrounding a span remains available to adjudicate quotation, negation scope, and clause attachment.

### 2.2 Proposition representation alternatives

| Design | Simplicity | Reviewer usability | Scoring | Backward compatibility | Provider output complexity | Future production usefulness |
| --- | --- | --- | --- | --- | --- | --- |
| **A. Proposition objects** — one text record contains a list of propositions, each with spans, polarity, claim IDs, and ambiguity IDs. | Compact once implemented, but represents many relationships in one nested object. | All labels appear together, but reviewers must inspect/edit a semantic bundle. | Requires flattening nested values and handling partial/missing arrays; one error can affect several metrics. | Weak: v1 text/contract rows must be transformed into nested objects; IDs and histories become one-to-many. | High: the provider may need to locate propositions and emit a multi-field semantic structure in one response. | Useful if production needs a complete interpretation graph, but exceeds this benchmark's narrow task model. |
| **B. Contract/task rows with proposition/span IDs** — one row asks one binary presence question or one polarity classification for one proposition reference. | Slightly more rows and explicit IDs; each row is simple. | Reviewer sees the text plus one highlighted proposition and one target at a time. | Direct: binary metrics per claim/signal and a separate two-class polarity metric. | Best: existing row concepts can be mapped, versioned, split, retired, or linked through explicit lineage. | Moderate and bounded: responses key by evaluation ID; repeated same-contract propositions do not collide. | Supports targeted checks without forcing a full graph into the provider interface. |

**Recommendation: Design B.** Preserve the existing one-target-per-evaluation behavior, adding a proposition reference only where the case needs one. Use a stable evaluation ID derived from text lineage, proposition identity, task kind, and target; do not key provider results only by contract ID. A proposition may have multiple independent evaluation rows, while its polarity is one separate enum-valued evaluation.

For „ფასდაკლება მოქმედებდა, მაგრამ ახლა აღარ მოქმედებს“, create two proposition references and separate evaluations:

| Proposition reference | `discountClaim` presence | `claimPolarity` |
| --- | --- | --- |
| Past discount proposition | YES | `affirmed` |
| Current discount proposition | YES | `negated` |

The rows share the text group and source text. Do not collapse them to one `discountClaim` answer or one text-level polarity. Where a v1 item maps to multiple v2 evaluation items, record all descendants in the lineage map; where no v2 target exists, record a retired disposition.

## 3. Preserve narrow benchmark tasks

Do not ask a provider to reconstruct every semantic relationship in the text. The unit being scored remains one narrow target:

| Target | Evaluation question | Expected value |
| --- | --- | --- |
| Claim presence | Is this specified semantic type present in this proposition? | YES / NO / unresolved |
| Ambiguity presence | Is this specific completeness signal present for this proposition? | YES / NO / unresolved |
| Polarity | Is this proposition affirmed or negated? | `affirmed` / `negated` / unresolved |

> Ontology v2 evaluates semantic classification of a curated proposition anchor. It does not evaluate proposition discovery/extraction from arbitrary text.

Because providers may receive the relevant proposition excerpt/span, benchmark results must not be interpreted as evidence that a provider can independently locate all propositions in an unsegmented text. Proposition discovery/extraction, if needed later, should be evaluated as a separate benchmark/task rather than silently folded into Claim Semantics.

Build the proposition/span references in the curated benchmark data, independently from whether a particular semantic label is positive. Pass only the original text, the relevant proposition excerpt/span, its surrounding context, and the one target definition to the provider. For proposition-level rows, the model evaluates the target; it does not invent the reference spans.

Batch multiple independent evaluation IDs for the same text group in a single provider request to control latency, but preserve a separate answer per ID. This is bounded multi-question evaluation, not broad structured generation. For a NO case, use a curated proposition/candidate span when one is relevant; use a text-level reference only when there is no meaningful proposition anchor. Avoid making a full `all claims × all signals × all propositions` product.

## 4. Exact contract migration mapping

Current v1 row counts are included to bound the migration. They are not proposed v2 gold counts.

| V1 contract | Current rows | V2 action | Mechanical label migration? | Human review |
| --- | ---: | --- | --- | --- |
| `priceClaim` | 40 | Keep ID; use proposition-scoped presence and polarity where relevant. | A simple affirmed single-proposition label may seed a draft candidate only. | Required for all v1 review records under v2 digest/version; especially negation, attribution, and multiple prices. |
| `discountClaim` | 27 | Keep ID; classify the discount proposition regardless of affirmed/negated status. | No automatic promotion; active-offer and polarity boundaries changed. | Required. |
| `comparativeClaim` | 37 | Keep ID; include implicit comparison/superlative relations and denied comparisons; put missing baseline in its own signal. | No; the positive/negative and implicit-reference boundaries change. | Required. |
| `superlativeClaim` | 35 | Keep ID; allow overlap with `comparativeClaim`; basis is separate. | No automatic promotion; basis and overlap need explicit review. | Required. |
| `guaranteeClaim` | 40 | Keep ID; explicit guarantee/warranty or explicit absolute certainty. May overlap `outcomePromiseClaim`. | No; v1 merges guarantee and promise semantics. | Required, including vague objects and simple future promises. |
| `clinicalOutcomeClaim` | 39 | Keep ID; require actually stated clinical content, with polarity independent of topic. | Candidate labels can be copied as draft only; v1 treats some vague results differently. | Required for vague outcomes, negation, attribution, and future results. |
| `quantifiedClaim` | 45 | Keep ID; explicit numbers/magnitudes only, per proposition. | Simple explicit numeric candidates may be copied to draft; no review status carries over. | Required for negated quantities, implicit zeros, and comparison quantities. |
| `availabilityClaim` | 28 | Keep ID; actual booking/service capacity, not operating hours. | No; operating-schedule boundary and polarity interaction change. | Required. |
| `factualAssertion` | 63 | Rename to `descriptiveAssertion`. | ID rewrite is mechanical; gold is not. | Required because v2 no longer asks for complete/evaluable truth conditions and separates descriptive assertion from verification. |
| `proofRequirement` | 50 | Retire from semantic evaluation; preserve every review as historical and mark it `retiredByOntologyVersion: v2`. | Retired disposition is mechanical; do not migrate its YES/NO to another target. | No active v2 gold review for this retired contract. Downstream substantiation policy is a separate future task. |

New v2 targets are `outcomePromiseClaim`, six completeness/ambiguity signals, and proposition-level `claimPolarity`. They need authored positive, negative/boundary, overlap, and incompleteness cases. Polarity is an enum attribute, not an eleventh or twelfth binary contract.

No v1 `reviewed` status transfers to v2. Existing `expected` values may be carried as **draft candidates** only when a one-to-one mapping is clear; the mapped item remains unreviewed until a human reviews it under v2. Unresolved v1 correction or ontology-review items remain unresolved in the historical archive and are not auto-promoted to v2 gold.

## 5. Preserve review history and separate it from active items

Before implementation, create a read-only v1 archive containing the exact current Development and Validation JSONL bytes, `reviews.json`, contract definitions, generator/case sources, provider prompts/adapters, review rules, and the v1 dataset/protocol hashes. Record archive checksums and the source revision/working-tree snapshot. Capture the canonical review ledger only after its writer is quiescent; do not treat an abandoned temporary write file as the canonical ledger without an explicit recovery decision.

Preserve each v1 record's original item ID, row digest, `currentGold`, first and second decisions, reasons, timestamps, agreement, and original contract/ontology version. Add an immutable migration disposition such as:

- `retiredByOntologyVersion: "v2"` for `proofRequirement` history;
- `staleByOntologyVersion: "v2"` for an active semantic target that must be reviewed under v2;
- `supersededBy: [v2 evaluation IDs]` for one-to-one or one-to-many mappings.

Keep the historical record and the current active benchmark item separate. The v2 ledger should store new decisions against new evaluation IDs and v2 digests, with optional lineage links back to v1 record IDs. It must not rewrite first/second decisions or reasons in the v1 archive.

This is necessary because the current writer uses the same ID key for the next active review: when an old digest does not match, `setGoldReview` ignores that record as a prior decision and then assigns the new record at that key. Without an immutable archive or versioned record key, a later v2 review can overwrite the v1 history even though stale records are filtered from the UI.

## 6. Review digest v2 and staleness

Use a canonical serialization and a versioned digest recipe. At minimum, hash:

```text
schemaVersion
ontologyVersion
evaluationId and text/group identity
exact text content and proposition excerpt/span/identity
split and source/provenance
task kind and target ID (contract or ambiguity signal)
expected gold value
canonical target-definition hash/version
applicable shared-rule hashes (assertionhood, attribution, polarity, completeness)
review-relevant difficulty/ambiguity/rationale fields
```

`expected` is included because a gold correction must stale the previous decision. Proposition identity and offsets/excerpt hash are included because a changed anchor changes what the reviewer evaluated. A digest may omit presentation-only styling, but the protocol hash still covers any reviewer workflow behavior that affects the decision.

A review becomes stale when any hashed input changes: text or proposition span; group/split/source assignment; evaluation target or ID; proposed gold; target definition/version; an applicable shared semantic rule; ontology version; or a review-relevant field used by the protocol. An ontology v1-to-v2 transition therefore makes all surviving v1 semantic reviews stale for active v2 scoring, even if a particular row's text and ID look unchanged. Retired proof reviews are historical, not stale active gold. For later v2 revisions, the contract/shared-rule dependency set allows only the affected v2 evaluations to become stale.

Keep `reviewDigest` distinct from `protocolHash`: the former identifies the exact reviewed item and semantics; the latter identifies the entire executable benchmark protocol and all of its inputs.

## 7. Dataset regeneration and size estimate

The current generated benchmark has 404 rows across 139 text groups: 285 Development, 119 Validation; source counts are 304 seed, 48 documented adversarial, and 52 expansion rows. Current rows by contract are: price 40, discount 27, comparative 37, superlative 35, guarantee 40, clinical outcome 39, quantified 45, availability 28, factual assertion 63, and proof requirement 50.

Regenerate v2 from versioned inputs, preserving each text group's split and source provenance wherever the group remains. Keep identical text in one split only; retain checks that no group or exact text crosses Development and Validation. Preserve a `v1 item ID → v2 evaluation ID(s) / disposition` manifest. New adversarial items must be assigned to Development before generation; do not move Validation text to Development to satisfy v2 coverage unless a written split decision documents why.

| Migration quantity | Estimate from current files | Interpretation |
| --- | ---: | --- |
| Existing source text groups | 139 | Likely preserved as the same texts/groups where no text-level correction is approved. Split membership should stay fixed. |
| Existing evaluation rows | 404 | Baseline before proposition splitting and added task targets; not the predicted v2 row count. |
| `proofRequirement` rows | 50 | Retire from active semantic scoring; preserve their history and lineage. |
| `factualAssertion` rows | 63 | Rename target ID to `descriptiveAssertion`; all review records become stale because the definition changes. |
| Other existing contract rows | 291 | Candidate one-to-one IDs for the other eight contracts; definitions/shared polarity rules still require new review. |
| Existing active semantic rows | 354 | 291 retained-ID candidates + 63 renamed candidates. Under the v2 ontology-version digest, all old reviews on these rows are stale, even when a draft label is copied as a candidate. |
| New `outcomePromiseClaim`, six ambiguity signals, and proposition-polarity evaluations | Not yet determinable | Depends on reviewed proposition segmentation and deliberately selected positive/boundary coverage. Do not multiply 139 texts by every target. |
| Additional proposition-split rows | Not yet determinable | Depends on how many source texts contain multiple separately evaluable propositions, especially repeated same-type claims. |

The counts for current rows are directly available, but the exact number of v2 evaluation items, newly required target rows, one-to-many mappings, and existing human records that become stale cannot be established safely without the approved proposition segmentation and migration run. During implementation, compute a migration report by joining v1 rows to the explicit lineage map and report counts by split, source, old/new target, disposition, and digest status before any provider work.

## 8. Gold migration safety

### Mechanically safe

- Copy exact source text, group membership, split, source/provenance, and tags to a v2 draft when the text itself is unchanged.
- Create a mechanical **ID mapping** from `factualAssertion` to `descriptiveAssertion`; this does not make its old gold mechanically valid.
- Copy a clear one-to-one v1 YES/NO value only as a proposed draft candidate with a v1 lineage reference. Never copy `reviewed` status.
- Mark retired `proofRequirement` records as retired history without translating their labels.

### Requires human re-review

- All v1 active semantic items because v2 is a new ontology version and its shared polarity rule changes the reviewed semantics.
- Guarantee/promise overlap; vague or missing outcomes; clinical content boundaries; implicit/negated comparison; quantified comparison baselines; and opening-hours versus availability.
- `factualAssertion` → `descriptiveAssertion`, because descriptive assertion no longer requires complete interpretation and does not mean verification.
- Every newly added ambiguity-signal item and every proposition-level polarity item.
- Any text group whose proposition split, span, attribution, scope, or text changed.

### Retired

- All 50 v1 `proofRequirement` evaluation rows. Their human decisions, including unresolved decisions, stay visible in the immutable v1 archive with reasons and pass history. They produce no active v2 semantic YES/NO labels.

Human review must finish on the v2 proposal gold before provider stability testing. Model disagreement never edits gold automatically.

## 9. Provider contract changes

The current Jev adapter issues one Noul question per contract and reads `answers[contractId]`; the baseline requests YES/NO/UNCERTAIN by contract. That keying fails when the same contract has two proposition targets.

| Approach | Benefit | Cost/risk |
| --- | --- | --- |
| Separate provider request for every target | Simple attribution and easy per-task prompt control. | More latency, tokens, and request failure points. |
| Batch independent target questions by text group, keyed by evaluation ID | Reuses current grouped-call pattern while preserving a narrow answer for each proposition/target. | Larger response schema and a partial/missing answer must be handled per evaluation ID. |
| Derive polarity deterministically | Fast and consistent for a small set of unambiguous particles/markers. | Georgian negation scope, coordinated clauses, quotation, and morphology make a general rule unsafe; lexical presence alone can mis-attach negation. |

**Recommendation:** batch independent, narrow tasks by text group and key every result by evaluation ID. Claim and ambiguity presence remain YES/NO/UNCERTAIN evaluations. Polarity is requested only for a claim-present proposition and returned in the domain as `affirmed`, `negated`, or abstention/uncertain; it is scored as a categorical attribute, not registered as a contract. Deterministic markers may be recorded as diagnostic inputs, but must not replace semantic review unless a separately evaluated precision/coverage rule is approved.

Before implementation, verify what the Jev transport can express. If its only native answer is Noul, an adapter may ask the bounded question “is this proposition explicitly negated?” and map YES/NO to the polarity enum, with dead-zone/non-answer mapped to abstention. Keep that transport encoding out of `ContractId` and report categorical polarity metrics. The baseline can use a strict per-evaluation schema with `affirmed`, `negated`, or `UNCERTAIN`. Do not call either provider during this planning task.

## 10. Gold Review UI

Keep the existing blind-review rule: reviewer payloads contain no runs, predictions, provider names, confidence, or disagreement. Retain first/second-pass behavior, written reasons, correction/ontology escalation, and difficult-item second pass.

For a selected text group, show a compact list of evaluation rows with:

- the original text and highlighted proposition excerpt/span when a proposition reference is needed;
- one target (claim contract, ambiguity signal, or polarity attribute);
- proposed gold (`YES`/`NO` for presence, `affirmed`/`negated` for polarity);
- the canonical short definition and item-specific rationale;
- first/second decision controls and existing reason forms.

Group rows by source text, but review one evaluation ID at a time. For multiple propositions of the same type, show separate cards with distinct proposition IDs/spans. Do not expose a general graph editor, auto-fill classifications, or reveal provider output. Progress and agreement summaries should be filterable by task family; polarity progress must not be counted as a binary claim contract.

## 11. Scoring and metrics

Report task families separately; do not combine them into one undifferentiated correctness score.

| Task family | Primary metrics | Abstention handling |
| --- | --- | --- |
| Claim presence, per semantic claim ID | Accuracy, precision, recall, F1, false-positive/false-negative rates, count. | Report answered coverage and abstentions separately; retain answered-only and all-evaluable views. |
| Ambiguity signal presence, per signal ID | Same binary metrics, per signal. | Separate per-signal abstention counts; do not pool with claim abstentions without labeling. |
| Polarity, per proposition | Two-class accuracy, per-class precision/recall, macro F1, and a 2×2 confusion matrix. Report support for each class. | Count abstentions separately; conditional polarity coverage is among propositions whose claim presence is gold YES. |

Keep Jev probability calibration (Brier/ECE, threshold coverage) for binary tasks that return probabilities. Add polarity calibration only if the adapter exposes calibrated class probabilities; otherwise report categorical agreement without inventing confidence. Preserve current run-level latency/cost/tokens. Evaluate stability over five consecutive complete runs and calculate every stability metric from all five; do not select a favorable subset or drop a complete run based on its results. Add per-task label-flip, abstention-flip, and polarity-flip rates. Any optional exact-match-across-all-targets metric must be supplementary and clearly separated from the primary per-target metrics.

## 12. Protocol freeze and hashing

Introduce an explicit ontology version and a machine-readable canonical manifest. The manifest should version each contract definition, each ambiguity definition, `claimPolarity`, shared interpretation rules, and schemas. The manifest is the hashable source of truth; prose documentation points to it rather than silently becoming an alternate definition.

The future protocol hash must include at least:

- ontology manifest and version;
- v2 schemas and proposition/polarity representation rules;
- both generated datasets, split assignments, and lineage/migration manifest;
- canonical provider prompts, response schemas, adapters, and threshold/abstention rules;
- scoring and calibration implementation;
- review digest recipe, review state version, second-pass rules, and review workflow logic;
- generator/case-source revision or reproducible generated-artifact hashes;
- model identifiers and relevant run configuration.

Any change to a contract definition, polarity rule, ambiguity definition, prompt, dataset, proposition reference, scoring rule, or applicable review rule must change the protocol hash. Store the ontology version and hashes in every run/report. A frozen protocol compares exact hashes; a shared file path or human-readable version label alone is insufficient.

## 13. Ordered migration sequence

1. **Archive/freeze v1.** Snapshot both datasets, the exact current review ledger, definitions, case sources, prompts/adapters, review rules, current reports, and hashes. Preserve the uncommitted working-tree inputs as captured artifacts; do not assume the Git commit alone contains the current ledger.
2. **Introduce ontology versioning.** Create the canonical v2 manifest, shared-rule IDs, schema version, and v1/v2 compatibility labels.
3. **Introduce v2 schemas and proposition references.** Define evaluation-item IDs, task kinds, proposition spans, and polarity values. Keep v1 readers for archived runs.
4. **Implement review digest v2 and history preservation.** Separate active v2 review records from immutable v1 records before any v2 review write can reuse IDs.
5. **Implement v2 contracts/signals and generator path.** Keep contract presence binary; add outcome promise, six completeness signals, and proposition-level polarity as distinct targets.
6. **Regenerate v2 Development/Validation drafts in a separate versioned location.** Preserve text-group split, provenance, and lineage; review the generated migration report before accepting the output.
7. **Update the blind review UI/API and run deterministic schema/digest/history checks.** Use cloned/temp data for API state-transition tests; verify no predictions leak into review.
8. **Rerun human review for all affected v2 items.** Resolve ontology questions and corrections, conduct second pass where required, and reach clean reviewed gold. Do not inherit v1 review status.
9. **Update provider adapters and scoring after the v2 target schema/gold is stable.** First test only with mock Jev/baseline fixtures; keep task outputs keyed by evaluation ID.
10. **Run the full deterministic suite.** Include dataset split-leak checks, proposition-span checks, stale-digest tests for every dependency, preservation/retirement tests, blind UI checks, provider schema mocks, scoring edge cases, and stability fixture tests.
11. **Run development model stability.** Run five consecutive complete runs on the frozen v2 candidate and evaluate stability using all five. Do not select a favorable subset or omit a complete run based on its outputs; make no gold changes based solely on model output.
12. **Freeze the protocol.** Freeze manifest, datasets, prompts, scoring, and hashes after development stability decisions. Then run Validation only against that exact frozen hash.
13. **Create a future sealed holdout only after v2 ontology, reviewed gold, and stability are stable.** Keep its text/gold outside the public benchmark inputs until the declared evaluation point.

This order places the blind review UI and deterministic safety checks before human review, while provider scoring changes and real model stability runs wait until the v2 gold and target schema are settled.

## 14. Rollback and v1/v2 comparison

Keep v1 data, reviews, contract definitions, prompts, and reports in an immutable archive. Store v2 under a separate ontology/version namespace and never overwrite v1 reports. Rollback means selecting the archived v1 code/configuration/data/protocol snapshot, not deleting v2 records.

Reports must display ontology version, dataset hash, protocol hash, provider/model configuration, and evaluated item IDs. A statement such as “Jev scored X under v1 and Y under v2” is permitted only as two version-specific results. Do not describe the difference as an accuracy improvement or regression when the semantic tasks changed. A common-case comparison may be reported as a separately defined sensitivity analysis, with the shared case set and changed label semantics explicit.

## 15. Main migration risks and controls

| Risk | Control |
| --- | --- |
| Reused contract keys overwrite or collide for multiple propositions. | Key all review and provider records by evaluation ID with proposition identity; retain a one-to-many lineage map. |
| Existing v1 review records disappear when a stale item is re-reviewed under the same ID. | Archive v1 immutably and use versioned active review records before writing v2. |
| Old gold is accidentally treated as authoritative under changed definitions. | Copy at most as draft candidate; stale every v1 semantic review; require human review. |
| New targets explode into a text × contract × signal product. | Curate proposition-level coverage and boundary cases; generate target rows only when justified. |
| Proposition segmentation leaks gold labels or mishandles split boundaries. | Annotate spans independently of provider output; assign/split source text groups before task expansion; test for duplicate text/group leakage. |
| Provider response drops a repeated target or misaligns polarity. | Use stable evaluation IDs, strict response validation, and mock fixtures with repeated contracts/mixed polarity. |
| Review UI ceases to be blind or becomes too complex. | Assert payload excludes predictions/confidence; show one narrow target and span at a time. |
| v1 and v2 metrics are read as directly comparable. | Separate namespaces and report both hashes and ontology versions on every result. |

## 16. Planning output and implementation gate

The recommended representation is **contract/task evaluation rows keyed by proposition/span IDs**, with a separate enum-valued proposition polarity task. It is the smallest extension that represents repeated same-type propositions without turning the benchmark into full semantic-graph generation.

Implementation may begin only after the v1 archive procedure, v2 manifest/version, effective review digest, proposal-to-data mapping, and temporary-ledger test approach are approved. This document itself does not execute any of those steps.

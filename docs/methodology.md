# Claim Semantics benchmark methodology

The current 403 case records cover 284 development and 119 validation evaluations. Both datasets and their gold labels are accessible in this repository. Neither is a blind final test.

## Stages

1. **Development:** refine the ontology, inspect draft labels, resolve `ontology-review` cases in writing, choose the confidence threshold, and study errors. Model disagreement alone never changes gold.
2. **Validation:** confirm a frozen protocol on a separate 119 case set and check whether development findings generalize. The workbench requires the exact current protocol hash in `BENCHMARK_FROZEN_PROTOCOL_VERSION` and a complete, error-free development run for the same provider and dataset version. Validation is not blind; any change after inspecting it creates a new protocol version and requires another full development run and explicit freeze.
3. **Sealed Holdout (future):** a one-time final evaluation after ontology resolution, review of all development and validation gold, 3–5 repeated stability runs, and explicit acceptance of the frozen contracts, prompts, metrics and protocol version. Create the sealed set separately only then. Keep its gold labels outside the public repository and development tooling until the one-time evaluation. This repository contains no sealed set or sealed gold.

## Human gold review

Generated rows start as `draft`; unresolved ontology rows are `ontology-review`. The workbench shows every development and validation item, with split, contract, difficulty, ambiguity, source, gold status, outcome and text filters. A reviewer reads the text, contract and rationale, then explicitly clicks **Reviewed**. This writes a timestamp and source-item digest to `datasets/claim-semantics/reviews.json`; it does not rewrite generated gold. If the underlying item changes, its review no longer applies. The action can be reversed to `draft`. `ontology-review` cannot be marked reviewed until its rule is documented and its source gold is resolved. The review ledger contributes to both dataset and protocol hashes, so any review change invalidates an existing freeze. The workbench shows reviewed/total, draft remaining and ontology-review remaining.

## Model decisions and stability

Jev returns a Noul YES probability. The application adapter maps `p >= 0.60` to YES, `p <= 0.40` to NO, and `0.40 < p < 0.60` to an **application abstention**, a configured decision dead-zone. Jev does not emit a native `UNCERTAIN` label. GPT-6 Sol xhigh returns `YES`, `NO` or `UNCERTAIN` directly. Errors are separate from either form of abstention.

Stability is displayed separately from accuracy. Select a run after 3–5 complete repetitions with identical dataset version, protocol version, provider, returned and requested model, reasoning effort, threshold and exact case IDs. The workbench uses the selected run and up to four latest matching runs. Failed/incomplete runs are excluded. A changed sample of the same size is not considered comparable.

- **Same-label rate:** fraction of case IDs with exactly one label across all compared runs.
- **YES ↔ NO flip count:** number of case IDs that have both labels across the runs.
- **Answer ↔ abstain/UNCERTAIN flip count:** number of case IDs with a YES or NO and a null decision across runs. For Jev this is an application abstention; for the baseline it is the model's native `UNCERTAIN`.
- **Jev mean absolute probability drift:** mean `|pᵢ − pⱼ|` across every run pair and case ID. **Maximum drift** is the largest such difference.
- **Jev threshold-crossing rate:** fraction of case IDs whose probability range crosses either decision boundary: `min(p) <= 0.40 < max(p)` or `min(p) < 0.60 <= max(p)`.

The stability comparison reads saved local reports and makes no provider calls. Historical reports keep their original protocol hashes and remain stale after this migration; their original scores are not recalculated.

To print a JSON stability report from three to five saved runs, use `npm run report:stability -- <run-id-1> <run-id-2> <run-id-3> [run-id-4] [run-id-5]`. The script rejects mismatched configurations, incomplete runs and differing case IDs. The workbench constructs the same report automatically for a selected run when enough matching local reports exist.

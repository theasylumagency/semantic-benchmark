# Development checkpoint — Claim Semantics KA

Date: 2026-09-27. Protocol version: `662cac5fb64b0b70`. Jev returned model `jev-1.13.0`; the baseline was `gpt-6-sol` with `xhigh` reasoning. Both providers received the same text/contract groups. This is an exploratory development result; all scored gold labels were draft. This historical protocol is now stale. The 119 validation cases are accessible and are not blind.

## Results

| Development slice | Model | Answered / evaluable | Correct / evaluable | Answered accuracy | F1 on answered | Request p95 |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| Batch 01 (48 cases) | Jev | 46 / 48 | 46 / 48 (95.8%) | 100.0% | 100.0% | 343 ms |
| Batch 01 (48 cases) | GPT-6 Sol xhigh | 48 / 48 | 46 / 48 (95.8%) | 95.8% | 96.2% | 8,289 ms |
| Adversarial (100 cases; 3 ontology review) | Jev | 92 / 97 | 91 / 97 (93.8%) | 98.9% | 99.1% | 404 ms |
| Adversarial (100 cases; 3 ontology review) | GPT-6 Sol xhigh | 97 / 97 | 94 / 97 (96.9%) | 96.9% | 97.4% | 12,245 ms |

“Answered accuracy” excludes non-answers; “correct / evaluable” counts them as not correct. Jev's non-answers are **application abstentions** from the configured `0.40 < p < 0.60` decision dead-zone; Jev does not emit `UNCERTAIN`. The baseline can return native `UNCERTAIN`. Request p95 is wall-clock time for one text's bundled contracts, including network time. The provider calls were made with bounded concurrency; this is not isolated model inference latency.

Jev's 100-case run had Brier score `0.0497`, expected calibration error `15.9%`, and confidence-threshold coverage at 0.80 of `70.1%`. GPT-6 Sol returned labels without YES probabilities, so those metrics are unavailable for the baseline. Cost was not computed because the current price settings were left blank; the reports retain provider token usage.

## Cases to inspect

- Jev's only scored 100-case mismatch under this **historical** protocol was `ka-exp-010-priceClaim`: “ოქტომბრიდან კონსულტაცია 150 ლარი ეღირება.” It was later excluded for ontology review and is now **YES** under the benchmark owner's written future-price rule; see [`ontology-review.md`](../docs/ontology-review.md). The historical numbers above are intentionally unchanged and must not be compared as current-protocol scores.
- GPT-6 Sol's 100-case mismatches were `ka-adv-010-factualAssertion` and `ka-adv-013-factualAssertion` (attributed testimonial/review language) and `ka-exp-011-comparativeClaim` (“საუკეთესოდ” without a named comparison). The 48-case run also missed `ka-adv-026-factualAssertion` (“most modern” without a defined measure). None of the 48 documented Batch 01 gold labels was changed after seeing model output.
- Three expansion labels were moved to ontology review under this historical protocol, so they were excluded from its 100-case scores. Two other ontology-review labels in the seed development set were outside this adversarial slice. All six ontology questions have since been resolved by written owner decisions; these old scores are not recalculated.

The specific error set changed between exploratory repetitions, especially for GPT-6 Sol. These single-run scores are descriptive, not a statistically stable model ranking. Three to five repeated complete runs must be compared separately for stability before a final protocol freeze. Independent gold review and a frozen full development protocol are required before validation. No sealed holdout exists yet.

Historical-protocol run IDs: Batch 01 Jev `run-edcc84d2-504e-4c1e-8d76-c40561a8cc84`, Batch 01 baseline `run-d9d8d98f-0c64-40b6-9ba0-5bf1134e70fb`, 100-case Jev `run-959e9e43-c709-4b9c-a28c-7496032bc0a3`, 100-case baseline `run-1cb39504-65f9-4603-aace-bcd66f197f4a`. Their JSON reports are stored locally in `reports/runs/` and intentionally ignored by Git.

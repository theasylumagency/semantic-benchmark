# Blind Human Gold Review

Open `/gold-review` to review the generated gold independently. This page and `/api/gold-review` load only dataset items, canonical contract descriptions, and the human review ledger. They do not read saved model runs, predictions, confidence, errors, disagreement, or scores, and they do not call a provider. The benchmark results page no longer has a gold approval action. Reviewers should enter this page directly before looking at model results.

## Sequence

Development first-pass review → Validation first-pass review → difficult-case second pass → resolve corrections and ontology issues in the dataset and canonical rules → 100% reviewed gold → model stability runs. The page opens with Development selected. Each `groupId` presents the Georgian text and every evaluated contract together. Filters select text groups, but the detail view keeps all contracts in a selected group visible.

## Decisions and state

The generated `development.jsonl` and `validation.jsonl` remain the source of proposed gold. Human decisions live in `datasets/claim-semantics/reviews.json`, keyed by item ID. An active record stores a digest of the complete underlying item, the proposed gold at review time, and first/second decisions as applicable. Each decision has a status and timestamp. Corrections additionally store a different proposed YES/NO and written reason; ontology issues store a written reason. Neither action changes the generated gold. A changed item digest makes the previous review inactive; the item returns to its generated status until reviewed again.

The effective statuses are `draft`, `reviewed`, `needs-correction`, and `ontology-review`. `Reviewed — agree` records agreement with the current proposed gold. `Needs correction` and `Ontology issue` remain unresolved and cannot be cleared or turned into Reviewed on the same source item. Clearing a reviewed first-pass decision also clears its second pass; clearing a reviewed second pass retains the first. Applying a correction requires editing the canonical rule/source as appropriate, regenerating the dataset, documenting the reason, and reviewing the changed item anew. An ontology issue requires a written rule decision before changing gold.

Items with `difficulty = nuanced` or `ambiguity = medium/high` require a second decision before reaching `reviewed`. The second pass lists groups in reverse order. Before its decision is saved, the UI conceals the first human decision and shows a neutral pending status instead of a status that might reveal that decision. The ledger keeps both decisions and their `agree`/`disagree` comparison. A disagreement is never resolved automatically: correction and ontology decisions keep the item unresolved. A second `Reviewed — agree` means agreement with the proposed gold, independent of the first decision.

Progress is shown overall and for each split: reviewed/total, draft, needs-correction, and ontology-review. Human annotation stability is separate from model stability. On difficult items with both decisions, agreement rate is the share of identical decision types and proposed gold values; gold flip count is the number with opposing non-null gold choices; ontology escalation count is the number whose second decision raises an ontology issue after a non-ontology first decision. These values describe human annotation, not model performance.

Every ledger change changes the dataset and protocol hashes. Review logic and the dedicated review API are included in the protocol hash. No item is marked reviewed automatically; the current starting state is 285 Development + 119 Validation = 404 draft, 0 reviewed, and 0 ontology-review.

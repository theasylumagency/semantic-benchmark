# Claim Semantics Ontology v2 — Proposal

**Status:** Design proposal; not an implemented contract change  
**Scope:** Claim Semantics and its boundary with provenance, substantiation, and application policy  
**Evidence reviewed:** Current contract definitions, the ontology review, the gold-review protocol, and the read-only review ledger in `datasets/claim-semantics/reviews.json`.

## 1. Core principle

> **Claim Semantics describes what the text says. It does not decide whether the speaker is correct, whether evidence is sufficient, whether publication is allowed, or whether the business should be audited.**

Do not supply content the text leaves unstated. Keep two questions inside this ontology:

1. **Semantic content:** What kind of claim or proposition does the text express?
2. **Semantic completeness:** Is enough information present to interpret that claim, or is a referent, scope, outcome, basis, or comparison point unclear?

Provenance, authority, substantiation, and publication decisions belong downstream. They may consume semantic signals, but they are not Claim Semantics labels.

For example:

| Text | Semantic content | Completeness signal | Do not infer |
| --- | --- | --- | --- |
| „შედეგი გარანტირებულია.“ | `guaranteeClaim = YES` | `unspecifiedOutcome = YES` | That the result is clinical, positive, pain reduction, or supported by evidence. |
| „ჩვენი მეთოდით აღდგენა ორჯერ სწრაფია.“ | `comparativeClaim = YES`, `quantifiedClaim = YES`, `clinicalOutcomeClaim = YES` | `missingComparisonBaseline = YES` | What it is twice as fast as. |
| „ჩვენი კლინიკა საუკეთესოა ქალაქში.“ | `superlativeClaim = YES`, `comparativeClaim = YES` | `undefinedSuperlativeBasis = YES` | A metric such as outcomes, price, or patient satisfaction. |

Signals should describe the text, including its omissions. They do not imply that a claim is true, false, supported, or publishable.

## 2. Keep the responsibilities distinct

| Responsibility | Question it answers | Belongs in Claim Semantics? |
| --- | --- | --- |
| Semantic claim | What does the text assert, compare, quantify, guarantee, or promise? | Yes |
| Semantic completeness | What needed outcome, reference, scope, or antecedent is missing or unclear? | Yes |
| Provenance / authority | Who supplied this claim, and is that source authorized for this kind of business fact? | No |
| Supportability / substantiation | Given the source and context, should the claim be supported or checked against an authoritative source? | No |
| Application / publication policy | Should the product explain, warn, request review, suggest a rewrite, or publish? | No |

These questions may interact. For example, a first-party price statement is a `priceClaim` and a `descriptiveAssertion` based on its wording; whether the source is the clinic's authorized tariff and whether an additional substantiation step is needed are separate questions.

## 3. Audit of the current contracts

| Current contract | Proposal | Reason |
| --- | --- | --- |
| `priceClaim` | **Keep; clarify.** | It identifies a stated price, including a starting, past, current, or future price. Time and conditions stated in the text are semantic attributes; the contract does not determine whether the price is current or authoritative. |
| `discountClaim` | **Keep; redefine.** | Identify an asserted discount or price-reduction proposition regardless of polarity; the shared polarity attribute distinguishes that the discount applies from a statement that it no longer applies. Do not treat a question, hypothetical, or mere mention as an asserted discount. |
| `comparativeClaim` | **Redefine.** | Include explicit comparisons and implicit comparison classes, whether affirmed or denied. A superlative such as “best” compares against the relevant class even when no competitor is named. Detect an omitted point of comparison separately. |
| `superlativeClaim` | **Keep; clarify.** | It marks highest/lowest or ranking language, including evaluative “best” and “leading.” A superlative can also be a comparative claim. Its basis is not supplied by this label. |
| `guaranteeClaim` | **Redefine alongside `outcomePromiseClaim`.** | `outcomePromiseClaim` detects a future result/benefit asserted or promised to the audience; `guaranteeClaim` detects explicit guarantee/warranty semantics or explicit absolute-certainty language. They may overlap. An ordinary future promise alone is not automatically a guarantee. |
| `clinicalOutcomeClaim` | **Keep; refine.** | Detect a stated or promised patient health outcome, symptom, pain, function, or recovery change. Hedging does not erase the type. An unspecified “result” or “difference” is not enough to infer clinical content. |
| `quantifiedClaim` | **Keep; refine.** | Mark explicit numeric or determinate magnitude claims such as “20%,” “40 minutes,” or “twice as fast.” Do not infer a number from “no slots remain.” Vague words such as “often” are handled by completeness signals. |
| `availabilityClaim` | **Redefine.** | Restrict it to asserted booking/service-capacity status, including either available or unavailable slots. The shared polarity attribute records the relation to availability; opening hours describe an operating schedule and are not availability by themselves. |
| `factualAssertion` | **Rename and redefine as `descriptiveAssertion`.** | The old “checkable fact” label invites an operational verification decision. The new signal marks descriptive content presented as asserted, whether or not it is fully specified or UNDA is responsible for verifying it. |
| `proofRequirement` | **Move out of Claim Semantics; retire as a semantic contract.** | Sentence meaning alone cannot determine a substantiation obligation. Replace it conceptually with a downstream `substantiationAssessment` informed by provenance, authority, task context, business-fact status, authorship, and publication policy. |

## 4. Semantic rules for the revised concepts

### 4.1 `descriptiveAssertion`

Proposed definition: **The text presents descriptive content as asserted, whether affirmed or negated, regardless of whether the content is sufficiently specified for complete interpretation or UNDA is responsible for independently verifying it.** Completeness is reported separately. This label does not mean “check this,” “trust this,” or “demand external proof.”

Apply the rule consistently:

| Example | `descriptiveAssertion` | Rule |
| --- | --- | --- |
| „დღეს ყველა მომსახურებაზე 20%-იანი ფასდაკლება მოქმედებს.“ | YES | A descriptive proposition about an offer and its stated scope. Authority and live offer status are separate. |
| „20%-იანი ფასდაკლება აღარ მოქმედებს.“ | YES | A descriptive assertion that the discount is no longer active; negation does not erase its descriptive status. |
| „ოქტომბრიდან კონსულტაცია 150 ლარი ეღირება.“ | YES | A future operational price assertion. Future timing does not turn it into a personal outcome promise. |
| „პროცედურა ყოველთვის უმტკივნეულოა.“ | YES | A descriptive universal claim about procedure experience. Whether it is supportable or should be rewritten is a downstream question. |
| „ჩვენი კლინიკა საუკეთესოა ქალაქში.“ | NO by default | An evaluative superlative with no defined measure or basis. It remains a `superlativeClaim` and `comparativeClaim`. If a measurable basis is stated, classify that descriptive proposition too. |
| „ჩვენს შეფასებებში ხშირად წერენ, რომ მომსახურება სწრაფია.“ | YES for the outer claim | The text asserts something about what appears in the review corpus. The embedded “fast” evaluation remains attributed; it is not automatically adopted as the brand's own descriptive fact. “Often” may also trigger `vagueQuantifier`. |
| „ჩვენს მიდგომას საუკეთესოდ მივიჩნევთ.“ | NO by default | Subjective framing does not automatically become a factual assertion about the speaker's internal mental state. The expressed evaluation remains a `superlativeClaim` and an implicit `comparativeClaim`. |

Negated descriptive propositions can still be descriptive assertions: „კვირაობით არ ვმუშაობთ.“ Questions, instructions, wishes, and hypotheticals do not become assertions solely because they mention a fact. An attributed quotation is not automatically adopted; a separate outer assertion about the quotation or source can itself be descriptive.

### 4.2 Global rule: semantic polarity and negation

Use one shared `claimPolarity` **semantic attribute** for every semantic proposition, not a separate yes/no contract and not contract-specific negation rules. Its values are:

- `affirmed`: the text presents the proposition in scope as holding.
- `negated`: the text explicitly denies that same normalized proposition.

> If a semantic proposition is explicitly negated, its semantic type remains present; negation is represented by `claimPolarity = negated`.

This rule applies uniformly to price, discount, guarantee, outcome-promise, comparison, superlative, availability, clinical, quantified, and descriptive propositions. Polarity is relative to the proposition's scope, not whether the statement sounds positive, is beneficial, or is true. A denied guarantee is still guarantee semantics; a claim that no slots are available is still availability semantics. `descriptiveAssertion` remains YES when descriptive content is asserted as a negative state.

**Polarity is proposition-level, not text-level.** Attach `claimPolarity` to a specific detected/evaluated proposition or clause. A sentence may contain multiple propositions of the same semantic type with different polarity values:

| Text | Proposition(s) and polarity |
| --- | --- |
| „ფასდაკლება მოქმედებდა, მაგრამ ახლა აღარ მოქმედებს.“ | Past discount proposition: `discountClaim = YES`, `claimPolarity = affirmed`. Current discount proposition: `discountClaim = YES`, `claimPolarity = negated`. |

Therefore a future implementation must not represent polarity as one text-level field, one contract-level field when that contract has multiple propositions in the text, or another binary benchmark contract. If the benchmark remains temporarily contract-row based, its implementation plan must explicitly define how multiple same-type propositions with different polarities are represented without collapsing them. This proposal sets that constraint; it does not choose the data model.

| Text | Semantic type(s) | `claimPolarity` and completeness |
| --- | --- | --- |
| „20%-იანი ფასდაკლება აღარ მოქმედებს.“ | `discountClaim = YES`; `descriptiveAssertion = YES` | `negated` for the proposition that the 20% discount applies now. The sentence asserts the descriptive state that it no longer applies. |
| „შედეგის გარანტიას არ ვიძლევით.“ | `guaranteeClaim = YES`; `descriptiveAssertion = YES` | `negated` for the proposition that a result guarantee is being offered. `unspecifiedOutcome = YES` if the result remains unidentified; `clinicalOutcomeClaim = NO` unless clinical content is stated. |
| „ჩვენი მეთოდი სხვებზე სწრაფი არ არის.“ | `comparativeClaim = YES`; `descriptiveAssertion = YES` | `negated` for the proposition that the method is faster. Add `missingComparisonBaseline = YES` if “others” has no recoverable reference. |
| „დღეს მიღებაზე ადგილი აღარ გვაქვს.“ | `availabilityClaim = YES`; `descriptiveAssertion = YES` | `negated` for the proposition that bookable capacity is available today. It is an asserted unavailable state, not an inferred numeric zero. |
| „კონსულტაცია 150 ლარი არ ღირს.“ | `priceClaim = YES`; `quantifiedClaim = YES`; `descriptiveAssertion = YES` | `claimPolarity = negated` for the proposition that the consultation costs 150 lari. Do not convert it to an affirmative price claim. |
| „მკურნალობა ტკივილს არ ამცირებს.“ | `clinicalOutcomeClaim = YES`; `descriptiveAssertion = YES` | `claimPolarity = negated` for the stated pain-reduction outcome. Negation changes polarity, not clinical topic. |

Questions, hypotheticals, wishes, and non-adopted quotations are not assertions merely because claim language appears inside them; they do not acquire an asserted claim or polarity merely because they contain negation.

### 4.3 Guarantees and outcome promises can overlap

- **`outcomePromiseClaim`** detects a future result or benefit asserted/promised to the audience. „ტკივილი გაქრება.“ is `outcomePromiseClaim = YES`; an ordinary future promise is not, by itself, a guarantee.
- **`guaranteeClaim`** detects explicit guarantee/warranty semantics or explicit absolute-certainty language. It may co-occur with `outcomePromiseClaim` when the promised future result also has guarantee or absolute-certainty semantics.
- „ტკივილი აუცილებლად გაქრება.“ yields both `outcomePromiseClaim = YES` and `guaranteeClaim = YES`. „ტკივილის გაქრობას გარანტიას გაძლევთ.“ also yields both.
- „პირველი ვიზიტიდანვე იგრძნობთ განსხვავებას.“ yields `outcomePromiseClaim = YES`, `guaranteeClaim = NO`, and `unspecifiedOutcome = YES`. The text does not specify that the difference is clinical, positive, pain-related, or measurable.
- „შედეგი გარანტირებულია.“ yields `guaranteeClaim = YES`, `unspecifiedOutcome = YES`, and `clinicalOutcomeClaim = NO` unless clinical content is stated. The guarantee type remains detectable despite the incomplete object.
- When the text names a clinical outcome, `clinicalOutcomeClaim` can overlap with either or both promise and guarantee signals. „ტკივილი აუცილებლად გაქრება“ is also a clinical outcome claim; „შეიძლება ტკივილის შემცირებაში დაგეხმაროთ“ is a clinical outcome claim despite the hedge.
- **General incompleteness rule:** when wording identifies a semantic type but leaves one of its arguments or details unspecified, keep the type signal and add the relevant completeness signal. Do not turn the type to NO just because the outcome, baseline, or other slot is missing. This does not permit inferring a different type: an unnamed “result” is not clinical unless clinical content is stated.

### 4.4 Comparisons and superlatives

`comparativeClaim` covers an explicit comparison („ჩვენი მეთოდი 30%-ით სწრაფია ძველ მეთოდზე“) and a comparison implied by a ranking term („ჩვენ საუკეთესო ვართ“). `superlativeClaim` remains a narrower overlapping signal for the highest/lowest or top-ranked form. A named competitor is not required for either signal.

Use `missingComparisonBaseline` when a relative comparison needs a reference that the text does not identify or make recoverable—for example, „აღდგენა ორჯერ სწრაფია.“ Do not invent a prior method, standard patient, competitor, or time period. For a superlative, the comparison class can be implicit; if the main omission is how “best” is measured, use `undefinedSuperlativeBasis`. Do not mark every superlative as missing a baseline when its relevant class is already expressed or implied.

### 4.5 Explicit quantities, schedule, and availability

`quantifiedClaim` is for stated numeric or mathematically determinate quantities. „ორჯერ სწრაფია“ is quantified even when the baseline is missing. „ადგილები აღარ დარჩა“ is an availability statement, not an unstated numeric zero.

An operating schedule is not a booking-capacity statement: „კლინიკა მუშაობს ორშაბათიდან შაბათის ჩათვლით“ describes hours, but does not by itself say that a patient can book or receive a service. „ამ კვირაში ყველა დრო დაჯავშნილია“ and „დღეს მიღებაზე ადგილი აღარ გვაქვს“ do describe availability. The schedule may also be a `descriptiveAssertion`; the availability signal is independent.

## 5. Semantic completeness and ambiguity signals

These narrow signals state what is missing or under-specified. They neither label a claim incorrect nor impose a publication outcome.

| Signal | Proposed meaning |
| --- | --- |
| `unspecifiedOutcome` | A result, benefit, or outcome is promised or guaranteed but the text does not identify enough of it to tell what result is meant. Do not infer a clinical endpoint. |
| `missingComparisonBaseline` | A comparative relation is stated but its reference, comparator, or baseline needed to interpret the relation is absent or unrecoverable. |
| `undefinedSuperlativeBasis` | A highest/lowest or “best” ranking is stated without a defined criterion, measure, or basis. |
| `vagueQuantifier` | A quantity/frequency term such as “many,” “often,” or “most” is used without a meaningful bound or reference where that matters to interpretation. Explicit “all” or “always” is not vague merely because it is broad. |
| `unclearScope` | The text does not make clear which people, services, time period, or other domain the claim covers. |
| `ambiguousReference` | A pronoun or referring expression has multiple plausible antecedents or no recoverable antecedent. |

Signals may co-occur with semantic claims. For example, a quantified clinical comparison can be a `comparativeClaim`, `quantifiedClaim`, and `clinicalOutcomeClaim`, while also carrying `missingComparisonBaseline`. A scope signal should only be added when the text leaves scope unclear; do not use it as a general quality or risk score.

## 6. Proposed layer boundary

```text
Text
  ↓
Deterministic lexical / pattern signals
  ↓
Claim Semantics (what the text says)
  ↓
Semantic Completeness / Ambiguity Signals (what is missing or unclear)
  ↓
Provenance / Authority (who supplied it; authorized source?)
  ↓
Supportability / Substantiation (what source or support is appropriate?)
  ↓
Application / Publication Policy (explain, warn, review, rewrite, or publish)
```

Only Claim Semantics and Semantic Completeness / Ambiguity Signals belong to this ontology. Deterministic lexical or pattern signals can provide inputs, but must not silently add absent semantic content. Downstream layers can combine the signals with source and task context while retaining their own authority.

## 7. First-party Business Facts: provenance boundary

An authorized first-party declaration about a price, discount, operating hours, address, availability, or campaign terms may be treated by the application as an authoritative **Business Fact**. This is a provenance/authority rule, not a semantic rule. Claim Semantics still identifies what the sentence says.

The application may compare such a declaration with its canonical business record or accept it as the authorized source for that fact. It should not demand external substantiation or turn UNDA into an internal business auditor merely because an authorized declaration could theoretically be false. A source mismatch, missing authority, externally repeated claim, or Writer-generated claim can be handled by the appropriate downstream layer.

## 8. User-facing policy boundary

Ambiguity must not mean “blocked.” A future application can use the signal to:

```text
signal
→ explain what is unclear
→ optionally suggest a clarification
→ let the user or application policy decide what happens next
```

Depending on context, policy may warn, request review, suggest a rewrite, or publish. The semantic ontology must not choose among those actions or treat incomplete language as automatically prohibited.

## 9. Unresolved first-pass themes and v2 mapping

The current ledger snapshot contains **29 unresolved Development first-pass decisions**: 14 `needs-correction` and 15 `ontology-review`. Of these, 16 are `proofRequirement` decisions; the other 13 concern semantic classification boundaries. The ledger also contains one unresolved Validation `proofRequirement` decision. These counts describe the review ledger at proposal time; they are not new gold labels. See the [gold-review protocol](gold-review.md) for review-state semantics.

| Unresolved theme / examples in the ledger | v2 mechanism | Expected resolution |
| --- | --- | --- |
| `proofRequirement` on prices, discounts, opening hours, availability, clinical statements, comparisons, guarantees, and subjective claims (Development includes `ka-claim-003`, `005`, `007`, `013`, `017`, `033`, `038`, `042`, `048`, `050`, `052`, `054`, and `ka-exp-008`, `010`, `011`, `013`; Validation includes `ka-claim-001`). | Retire `proofRequirement` from Claim Semantics. Assess provenance/authority first, then supportability/substantiation and publication policy. | The semantic gold question goes away; the downstream decision remains contextual. A first-party price need not be externally substantiated just because it is a price claim. |
| First-party prices, discounts, opening hours, and availability; e.g. „პირველი ვიზიტი 120 ₾-დან იწყება“, „20%-იანი ფასდაკლება მოქმედებს“, and „კლინიკა მუშაობს ორშაბათიდან შაბათის ჩათვლით.“ | Keep `priceClaim` / `discountClaim`, classify schedule as a `descriptiveAssertion`, and reserve `availabilityClaim` for bookability/capacity. Place authority in the Business Fact / provenance layer. | Separates statement meaning from the source of authority. The opening-hours case is not automatically availability. |
| „შედეგი გარანტირებულია.“ (`ka-claim-017`, `ka-adv-028`). | `guaranteeClaim = YES` plus `unspecifiedOutcome = YES`; `clinicalOutcomeClaim = NO` unless a clinical endpoint is actually named. | Records the categorical guarantee and missing object without inventing a positive or clinical result. |
| „პირველი ვიზიტიდანვე იგრძნობთ განსხვავებას.“ (`ka-exp-005`). | `outcomePromiseClaim = YES` plus `unspecifiedOutcome = YES`; no inferred guarantee or clinical endpoint. | Separates a broad future promise from an explicit guarantee and exposes the vague outcome. |
| „ჩვენი მეთოდით აღდგენა ორჯერ სწრაფია.“ (`ka-claim-048`). | `comparativeClaim = YES`, `quantifiedClaim = YES`, `clinicalOutcomeClaim = YES`, and `missingComparisonBaseline = YES`. `descriptiveAssertion` can mark the relation at the level stated. | The missing reference is explicit as an ambiguity signal; no baseline is invented. |
| „ჩვენი კლინიკა საუკეთესოა ქალაქში.“ (`ka-claim-013`, `ka-adv-017`) and „ჩვენს მიდგომას საუკეთესოდ მივიჩნევთ.“ (`ka-exp-011`). | `superlativeClaim = YES`, `comparativeClaim = YES`, and `undefinedSuperlativeBasis = YES`. Subjective framing does not make the proposition a descriptive fact about the speaker's internal state. | The implicit comparison class and missing measure are represented separately. |
| „კლინიკა მუშაობს ორშაბათიდან შაბათის ჩათვლით.“ (`ka-claim-033`). | `descriptiveAssertion = YES`; `availabilityClaim = NO` absent a booking/receiving-service claim. | Separates operating schedule from appointment capacity. |
| „ჩვენს შეფასებებში ხშირად წერენ, რომ მომსახურება სწრაფია.“ (`ka-adv-013`). | `descriptiveAssertion = YES` for the outer assertion about the review corpus; preserve attribution of the embedded evaluation. `vagueQuantifier` may flag “often.” | Separates a checkable meta-assertion from adoption of a quoted opinion. |
| „ჩვენ არ ვამბობთ, რომ საუკეთესო ვართ, თუმცა სხვებზე სწრაფად ვმუშაობთ.“ (`ka-claim-038`). | Detect the expressed comparison and, where the referent is not recoverable, `missingComparisonBaseline`; do not require the text to name a competitor for `comparativeClaim`. | Resolves the semantic comparison independently of whether it is substantiated. |
| „პროცედურა ყოველთვის უმტკივნეულოა.“ (`ka-exp-013`). | `descriptiveAssertion = YES` for the universal statement. “Always” is explicit, not a vague quantifier. Supportability and any rewrite/publishing action belong downstream. | Removes the old collision between descriptive meaning and whether the claim can be adequately substantiated. |
| „გარანტიის პირობებზე ადმინისტრატორს ჰკითხეთ.“ (`ka-claim-020`). | `descriptiveAssertion = NO` for the instruction; it is not made an assertion merely by mentioning guarantee terms. | Keeps speech act and semantic type distinct. |

### Estimate of issue resolution

At the ontology level, v2 is expected to remove all **16 Development `proofRequirement` rows** from the semantic review set and clarify the classification of the remaining **13 Development rows** through the revised assertion, comparison, guarantee/promise, schedule/availability, and completeness definitions. The one Validation `proofRequirement` row follows the same move-out. Thus roughly **29 Development first-pass issues** become either out-of-scope for Claim Semantics or expressible with the proposed concepts.

This is an estimate of conceptual coverage, not an instruction to close review items automatically. The substantiation questions remain for downstream policy. Any changed row or applicable contract/ontology definition changes the effective review digest and requires human review under the migration plan.

## 10. Migration plan — proposed, not executed

1. **Freeze the current review ledger.** Preserve the current review decisions and reasons as the baseline for migration; do not rewrite the ledger in place as part of ontology approval.
2. **Adopt the Ontology v2 definitions.** Approve the claim boundaries, completeness signals, and layer ownership described here.
3. **Map old contracts to v2.** Keep or refine stable IDs; map `factualAssertion` to `descriptiveAssertion`; refine `guaranteeClaim` and add `outcomePromiseClaim` as an overlapping signal for future results/benefits; map old `proofRequirement` cases out of semantic scoring.
4. **Remove/move `proofRequirement`.** Retire it from Claim Semantics and place substantiation responsibility downstream. Do not silently convert its old YES/NO labels into new policy decisions.
5. **Add the new semantic and completeness contracts.** Add `outcomePromiseClaim`, the shared `claimPolarity` attribute, and the six narrow ambiguity signals, with canonical definitions and boundary examples.
6. **Regenerate Development and Validation datasets.** Apply the mapping to both splits and preserve provenance for every changed or retired item.
7. **Include ontology definitions in review invalidation.** A review digest must cover the dataset item plus the canonical definition/version of its contract and any shared ontology definitions that apply to it (including polarity). Prefer a digest over those combined inputs, with an explicit ontology version. If a contract definition or an applicable shared definition changes, reviews for affected contracts become stale even when their dataset rows are byte-for-byte unchanged. Invalidate only items whose row or applicable definition/version changed; preserve unrelated review state.
8. **Rerun human review on affected items.** Review changed semantic labels, polarity values, and newly introduced signals independently. Keep ambiguity separate from any decision to request evidence or rewrite.
9. **Wait for clean reviewed gold before model stability testing.** Proceed only after affected review issues are resolved and the intended gold is fully reviewed under the adopted definitions.

No migration step should change application policy by implication. Any downstream behavior change needs its own policy decision.

## 11. Proposed v2 ontology table

| Contract / signal ID | Human-readable Georgian label | Type | Canonical definition | YES example | NO / boundary example | Notes / interactions |
| --- | --- | --- | --- | --- | --- | --- |
| `priceClaim` | კონკრეტული ფასის განცხადება | semantic claim | The text asserts a specific, starting, past, current, or future price for a product or service. | „ოქტომბრიდან კონსულტაცია 150 ლარი ეღირება.“ | „რა ღირს კონსულტაცია?“ | Price status, authority, and verification are separate. Can overlap `quantifiedClaim` and `descriptiveAssertion`. |
| `discountClaim` | ფასდაკლების განცხადება | semantic claim | The text asserts or denies a proposition about a discount or price reduction, with any period or conditions it states. | „დღეს ყველა მომსახურებაზე 20%-იანი ფასდაკლება მოქმედებს.“ / „20%-იანი ფასდაკლება აღარ მოქმედებს.“ | „იქნება თუ არა ფასდაკლება?“ | Does not validate that the offer is active or authorized. `claimPolarity` distinguishes that it applies from that it no longer applies. |
| `comparativeClaim` | შედარებითი განცხადება | semantic claim | The text asserts or denies a relative ranking, difference, advantage, or disadvantage, whether the comparator is explicit or implied by a superlative. | „ჩვენი მეთოდი ძველ მეთოდზე სწრაფია.“ / „ჩვენი მეთოდი სხვებზე სწრაფი არ არის.“ | „რომელია უფრო სწრაფი?“ | A superlative also triggers `superlativeClaim`. Polarity records affirmed vs denied comparison; a missing reference is separately signaled. |
| `superlativeClaim` | აღმატებითი შეფასება | semantic claim | The text places an entity or outcome at the highest/lowest or top-ranked position in a class. | „ჩვენი კლინიკა საუკეთესოა ქალაქში.“ | „ჩვენი კლინიკა სხვა კლინიკებთან შედარებით სწრაფია.“ | Usually overlaps `comparativeClaim`; does not define the measure or substantiate the ranking. |
| `guaranteeClaim` | გარანტია / კატეგორიული დაპირება | semantic claim | The text asserts or denies explicit guarantee/warranty semantics or uses explicit absolute-certainty language. An ordinary future promise alone does not qualify. | „ტკივილი აუცილებლად გაქრება.“ / „შედეგის გარანტიას არ ვიძლევით.“ | „პირველი ვიზიტიდანვე იგრძნობთ განსხვავებას.“ | The YES examples can also have `outcomePromiseClaim`; add `unspecifiedOutcome` when the object is vague. `claimPolarity` distinguishes offered from denied guarantee semantics. |
| `outcomePromiseClaim` | შედეგის ან სარგებლის დაპირება | semantic claim | The text asserts/promises a future result or benefit to the audience, whether or not it also has guarantee semantics. | „ტკივილი გაქრება.“ / „პირველი ვიზიტიდანვე იგრძნობთ განსხვავებას.“ | „ოქტომბრიდან კონსულტაცია 150 ლარი ეღირება.“ | Can overlap with `guaranteeClaim` and `clinicalOutcomeClaim`. A vague promised result can also have `unspecifiedOutcome`. |
| `clinicalOutcomeClaim` | კლინიკური შედეგის განცხადება | semantic claim | The text asserts or promises a patient health outcome, symptom/pain change, functional change, or recovery change. | „მკურნალობა შეიძლება დაგეხმაროთ ტკივილის შემცირებაში.“ | „პირველი ვიზიტიდანვე იგრძნობთ განსხვავებას.“ | Hedging changes certainty, not type. Unspecified “result” does not qualify by itself. |
| `quantifiedClaim` | რიცხვითი ან რაოდენობრივი განცხადება | semantic claim | The text asserts an explicit numeric or mathematically determinate amount, rate, duration, count, or magnitude. | „აღდგენა ორჯერ სწრაფია.“ | „ადგილები აღარ დარჩა.“ | The second example is availability, not an inferred numeric zero. Can overlap price, discount, comparison, and clinical claims. |
| `availabilityClaim` | დაჯავშნის / მომსახურების ხელმისაწვდომობა | semantic claim | The text asserts or denies booking/service-capacity status, including that slots are available or full. | „ამ კვირაში ყველა დრო დაჯავშნილია.“ / „დღეს მიღებაზე ადგილი აღარ გვაქვს.“ | „კლინიკა მუშაობს ორშაბათიდან შაბათის ჩათვლით.“ | Operating hours are schedule information, not necessarily bookability. The second YES example has `claimPolarity = negated` for capacity being available; it does not imply a numeric zero. |
| `descriptiveAssertion` | აღწერითი მტკიცება | semantic claim | The text presents descriptive content as asserted, affirmed or negated, whether or not it is sufficiently specified for complete interpretation or UNDA is responsible for independent verification. | „ოქტომბრიდან კონსულტაცია 150 ლარი ეღირება.“ / „20%-იანი ფასდაკლება აღარ მოქმედებს.“ | „ჩვენი კლინიკა საუკეთესოა ქალაქში.“ | An incomplete descriptive relation remains asserted and receives a separate completeness signal. An outer corpus claim can be YES while an embedded opinion remains attributed. |
| `claimPolarity` | მტკიცების პოლარობა | semantic attribute | Per-proposition attribute with the values `affirmed` or `negated`, attached to a specific detected/evaluated proposition or clause. | `affirmed`: „დღეს ფასდაკლება მოქმედებს.“; `negated`: „დღეს ფასდაკლება აღარ მოქმედებს.“ | A question such as „ფასდაკლება აღარ მოქმედებს?“ does not assert either polarity by itself. | It is not a separate YES/NO contract and not a text-level or single contract-level field when multiple propositions exist. Applies uniformly across semantic claim types; it is not truth, value, risk, or policy. |
| `unspecifiedOutcome` | შედეგი დაუზუსტებელია | completeness/ambiguity signal | A stated or promised result/benefit is not identified enough to determine what outcome is meant. | „შედეგი გარანტირებულია.“ | „ტკივილის ინტენსივობა შემცირდება.“ | Does not imply the result is clinical, positive, supported, or unsafe. |
| `missingComparisonBaseline` | შედარების საწყისი წერტილი აკლია | completeness/ambiguity signal | A comparative relation lacks a reference, comparator, or baseline needed to interpret the stated comparison. | „აღდგენა ორჯერ სწრაფია.“ | „აღდგენა ორჯერ სწრაფია სტანდარტულ მეთოდთან შედარებით.“ | Do not invent the baseline. A superlative can imply a comparison class while instead having an undefined basis. |
| `undefinedSuperlativeBasis` | აღმატებითი შეფასების საზომი დაუზუსტებელია | completeness/ambiguity signal | A superlative lacks a stated criterion or measure for the ranking. | „ჩვენი კლინიკა საუკეთესოა ქალაქში.“ | „2025 წელს ამ ჯგუფში ყველაზე მოკლე საშუალო ლოდინის დრო გვქონდა.“ | A basis may resolve this signal while the statement still remains a `superlativeClaim` and `comparativeClaim`. |
| `vagueQuantifier` | რაოდენობრივი ფარგლები ბუნდოვანია | completeness/ambiguity signal | A non-specific frequency or quantity expression lacks a meaningful bound/reference where needed for interpretation. | „ბევრი პაციენტი სწრაფად უმჯობესდება.“ | „პაციენტების 78% სწრაფად უმჯობესდება.“ | “Always” and “all” are explicit universal quantifiers, not vague merely because broad; unclear domain may separately trigger `unclearScope`. |
| `unclearScope` | მტკიცების ფარგლები გაურკვეველია | completeness/ambiguity signal | The people, services, period, geography, or other domain covered by a claim cannot be recovered clearly from the text. | „ყველას ეხმარება.“ | „18 წელზე უფროს პაციენტებს მკურნალობის კურსის შემდეგ ეხმარება.“ | Does not decide whether the stated scope is true or supportable. |
| `ambiguousReference` | მითითების ობიექტი ორაზროვანია | completeness/ambiguity signal | A pronoun or referring expression has multiple plausible antecedents or no recoverable referent. | „ეს შედეგს აუმჯობესებს.“ with no clear antecedent for „ეს“ | „ეს პროცედურა შედეგს აუმჯობესებს.“ | Report only when the reference is unresolved in context; do not treat ordinary pronouns as ambiguity automatically. |
| `proofRequirement` → downstream `substantiationAssessment` | მტკიცებულების / დასაბუთების შეფასება | moved-out policy concept | Retire this as a Claim Semantics output. Downstream assessment considers claim plus provenance, authority, task context, business-fact status, authorship, and publication policy to decide whether and how support should be obtained. | A Writer-generated external clinical claim may need a supportability assessment under the applicable policy. | An authorized current tariff matched to the canonical Business Fact need not trigger external substantiation by default. | Examples are context-dependent, not universal semantic YES/NO labels. Keep assessment and final publication decision in their own layers. |

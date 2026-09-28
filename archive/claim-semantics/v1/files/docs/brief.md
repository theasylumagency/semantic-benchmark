# UNDA Semantic Benchmark KA — v0.1

## 1. მიზანი

Benchmark-ის მიზანია გავარკვიოთ, რამდენად გამოსადეგია Jev-ის ტიპის სწრაფი typed-decision მოდელი UNDA Social Operator-ის ვიწრო semantic ამოცანებისთვის, განსაკუთრებით ქართულ ენაზე.

ამ ეტაპზე არ ხდება:

* UNDA-ს production კოდის შეცვლა;
* არსებული model provider-ის ჩანაცვლება;
* workflow-ის გადაწყობა;
* ახალი არქიტექტურული dependency-ის დამატება;
* Jev-ის შედეგებზე production გადაწყვეტილებების მიბმა.

Benchmark არის ცალკე ექსპერიმენტი.

მისი შედეგი უნდა პასუხობდეს კითხვებს:

1. რა ტიპის ქართულ semantic ამოცანებს ასრულებს Jev საიმედოდ?
2. სად იწყება მისი შეცდომების მკვეთრი ზრდა?
3. რამდენად კარგად არის მისი probability calibrated?
4. შეუძლია თუ არა დაბალი confidence-ით რთული შემთხვევების ამოცნობა?
5. რამდენი semantic check შეგვიძლია გავაკეთოთ ერთი ჩვეულებრივი LLM review-ის დროისა და ღირებულების ფარგლებში?
6. რამდენ შემთხვევაში შეგვიძლია ძლიერი LLM-ის გამოძახება საერთოდ ავიცილოთ?
7. სად არის Jev უკეთესი როგორც primary semantic signal provider და სად მხოლოდ pre-filter?

---

# 2. ძირითადი პრინციპი

Benchmark ამოწმებს შემდეგ არქიტექტურულ ჰიპოთეზას:

> **Prefer many bounded semantic signals over one broad model judgment.**

როცა შესაძლებელია, სისტემამ უნდა მიიღოს ბევრი ვიწრო და მკაფიო semantic signal და საბოლოო operational გადაწყვეტილება application policy-მ მიიღოს.

მოდელს არ ვეკითხებით:

> „ეს პოსტი კარგია?“

ვუსვამთ უფრო პატარა კითხვებს:

```text
არის თუ არა აქ კონკრეტული ფასის განცხადება?
არის თუ არა შედარებითი claim?
არის თუ არა გარანტიის დაპირება?
სჭირდება თუ არა ამ claim-ს proof?
არის თუ არა ტექსტი generic?
იმეორებს თუ არა hook ბოლო კონტენტს?
შეესაბამება თუ არა ტექსტი მოცემულ brand voice-ს?
```

ეს ბუნებრივად აგრძელებს UNDA-ს არსებულ მიმართულებას: typed registries, pure reducers, პატარა scoped model contracts და semantic მოდელების გამოყენება მხოლოდ იქ, სადაც deterministic logic საკმარისი აღარ არის.

---

# 3. Benchmark არ უნდა იყოს მიბმული Jev-ზე

Benchmark თვითონ უნდა იყოს provider-agnostic.

ერთსა და იმავე dataset-ზე უნდა შეგვეძლოს გავუშვათ:

```text
Jev
current baseline LLM
future model A
future model B
```

ამიტომ Jev არის პირველი კანდიდატი და არა benchmark-ის ნაწილი.

ეს მნიშვნელოვანია, რადგან თვითონ benchmark მომავალშიც დაგვრჩება როგორც UNDA-ს აქტივი.

---

# 4. ცალკე repository

რეკომენდებული სახელია:

```text
unda-semantic-benchmark
```

ან უფრო ნეიტრალური:

```text
semantic-benchmark-ka
```

Production repository-სთან dependency არ ექნება.

საწყისი სტრუქტურა:

```text
semantic-benchmark-ka/

  README.md

  datasets/
    claim-semantics/
    editorial-quality/
    evidence-routing/

  contracts/
    claim/
    quality/
    routing/

  providers/
    jev/
    baseline/

  runner/

  evaluation/
    metrics/
    calibration/
    latency/
    cost/

  reports/

  schemas/
```

---

# 5. Benchmark-ის სამი მოდული

პირველივე ეტაპზე ყველაფრის ერთ dataset-ში არევა არ გვინდა.

## Module A — Claim Semantics

ყველაზე ობიექტური და პირველი გასაკეთებელი ნაწილი.

ამოწმებს:

```text
priceClaim
discountClaim
comparativeClaim
superlativeClaim
guaranteeClaim
clinicalOutcomeClaim
quantifiedClaim
availabilityClaim
factualAssertion
proofRequirement
```

ეს პირდაპირ ემთხვევა ჩვენს Claim Scanner-ის არქიტექტურას:

```text
detection signal
→ claim candidate
→ semantic/support validation
→ violation or no issue
```

### მაგალითი

```text
კონსულტაცია იწყება 99 ლარიდან
```

კითხვები:

```text
Is there a concrete price claim? YES
Is there a discount claim? NO
Does this statement require factual support? YES
```

---

## Module B — Editorial Quality

ეს უკვე უფრო სუბიექტურია და ცალკე უნდა შეფასდეს.

Semantic dimensions:

```text
taskFit
brandFidelity
specificity
nonGenericity
clarity
channelFit
creativeStrength
CTAQuality
repetition
hookSimilarity
```

ეს dimensions უკვე განსაზღვრული გვაქვს Editorial Quality Reviewer-ისთვის.

აქ benchmark item-ს მარტო ტექსტი აღარ ეყოფა.

საჭირო იქნება მცირე context:

```text
task
draft
compiled voice
relevant positioning
audience
content direction
recent fingerprints
```

და არა სრული Brand Brain — რაც ასევე ემთხვევა ჩვენს არსებულ არქიტექტურას.

---

## Module C — Evidence Routing

მესამე ეტაპზე შევამოწმებთ semantic classification-ს:

```text
Evidence
→ target domain
```

მაგალითად:

```text
knowledgePath
proofCandidate
businessFact
corpusSignal
unmapped
```

ჩვენს არქიტექტურაში Evidence შეგნებულად დამოუკიდებელია destination schema-სგან და routing არის ცალკე, ხელახლა გამოსათვლელი ეტაპი.
აქ Jev-ის ტიპის მოდელი განსაკუთრებით საინტერესო კანდიდატია.

---

# 6. პირველი Dataset — Georgian Claim Semantics

პირველი ვერსიისთვის მიზანი:

```text
250–300 მაგალითი
```

არ არის საჭირო ათასობით მაგალითით დაწყება.

მნიშვნელოვანია ხარისხი და არა რაოდენობა.

Dataset უნდა მოიცავდეს შემდეგ ტიპებს.

### A. აშკარა positive

```text
კონსულტაცია ღირს 99 ლარი.
ჩვენ ვართ ბაზრის ლიდერი.
მკურნალობა სრულიად უმტკივნეულოა.
შედეგი გარანტირებულია.
```

### B. აშკარა negative

```text
ფასების შესახებ მოგვწერეთ.
ჩვენი გუნდი დაგეხმარებათ არჩევანში.
კონსულტაციაზე განვიხილავთ შესაძლო შედეგებს.
```

### C. Lexical false positives

სპეციალურად ის შემთხვევები, სადაც keyword არის, მაგრამ claim — არა.

```text
ფასის გასაგებად დაგვიკავშირდით.

ჩვენ არ ვიძლევით შედეგის გარანტიას.

ხშირად გვეკითხებიან, ვართ თუ არა საუკეთესო.
```

ეს განსაკუთრებით მნიშვნელოვანია, რადგან scanner-ში high recall გვინდა, მაგრამ user-facing warning-ში high precision.

### D. ქართული მორფოლოგია

მაგალითები სხვადასხვა ფორმით:

```text
საუკეთესო
საუკეთესოა
საუკეთესოს
საუკეთესოდ

ლიდერი
ლიდერია
ლიდერს
ლიდერად

გარანტია
გარანტირებული
გარანტირებულად
```

ჩვენ უკვე ვიცით, რომ ქართულში exact string matching არასაკმარისია.

### E. Implicit claims

```text
შედეგს პირველივე ვიზიტიდან იგრძნობთ.

ერთხელ მოხვალთ და პრობლემა წარსულში დარჩება.

აღარ მოგიწევთ ტკივილთან შეგუება.
```

აქ არ არის პირდაპირი „გარანტია“, მაგრამ semantic claim შეიძლება ძლიერი იყოს.

### F. შედარებითი claims

```text
უფრო სწრაფი შედეგი.

სხვა მეთოდებთან შედარებით ნაკლები დისკომფორტი.

ჩვენთან პროცესი უფრო კომფორტულია.

ბაზარზე არსებულ ბევრ ალტერნატივაზე უკეთესი შედეგი.
```

### G. Negation

ძალიან მნიშვნელოვანია:

```text
ჩვენ არ ვამბობთ, რომ საუკეთესო ვართ.

გარანტირებულ შედეგს ვერ დაგპირდებით.

ეს არ ნიშნავს, რომ პროცედურა უმტკივნეულოა.
```

Keyword detector აქ თითქმის აუცილებლად გამოიტანს signal-ს.

Semantic layer-მა სწორად უნდა გაარჩიოს.

### H. Quotation / attribution

```text
პაციენტმა გვითხრა: „საუკეთესო გამოცდილება იყო“.

ხშირად გვიწერენ, რომ პროცედურა უმტკივნეულო აღმოჩნდა.
```

აქ საჭიროა გარჩევა:

```text
brand claim
testimonial
quoted statement
```

### I. Multiple claims

```text
99 ლარად მიიღებთ უმტკივნეულო კონსულტაციას საუკეთესო სპეციალისტთან.
```

ერთი წინადადება შეიძლება ერთდროულად შეიცავდეს:

```text
price
clinical
superlative
```

ერთი label საკმარისი არ არის.

### J. Ambiguous cases

ეს განსაკუთრებით ღირებული ნაწილია.

მაგალითად:

```text
ალბათ საუკეთესო არჩევანია მათთვის, ვინც სწრაფ გამოსავალს ეძებს.
```

აქ სწორი benchmark answer შეიძლება იყოს არა უბრალოდ YES/NO, არამედ:

```text
ambiguous / needs contextual interpretation
```

---

# 7. Dataset item-ის სტრუქტურა

საწყისი JSONL schema შეიძლება იყოს:

```ts
type BenchmarkItem = {
  id: string

  language: "ka"

  text: string

  context?: string

  contract: string

  expected: string | boolean

  difficulty:
    | "obvious"
    | "moderate"
    | "nuanced"

  tags: string[]

  ambiguity:
    | "low"
    | "medium"
    | "high"

  humanRationale: string

  split:
    | "development"
    | "validation"
}
```

მაგალითად:

```json
{
  "id": "ka-price-0034",
  "language": "ka",
  "text": "ფასების შესახებ მოგვწერეთ",
  "contract": "isConcretePriceClaim",
  "expected": false,
  "difficulty": "moderate",
  "tags": ["price-word", "false-positive"],
  "ambiguity": "low",
  "humanRationale": "Mention of price exists but no public price value or pricing assertion is made.",
  "split": "development"
}
```

---

# 8. Development, Validation და მომავალი Sealed Holdout

Dataset თავიდანვე უნდა გაიყოს.

მაგალითად:

```text
285 development
119 validation
```

Development subset-ზე შეგვიძლია:

* prompt-ის შეცვლა;
* schema-ს გაუმჯობესება;
* thresholds-ის შერჩევა;
* Jev contract-ის კორექტირება.

Validation subset-ზე პროტოკოლის გაყინვის შემდეგ ვამოწმებთ განზოგადებას; მისი gold რეპოზიტორიაშია და blind არ არის. თუ შედეგის შემდეგ წესი შეიცვალა, იქმნება ახალი protocol version და development ხელახლა მოწმდება.

Sealed Holdout მხოლოდ მომავალში, ontology review-ის, human review-ისა და განმეორებითი stability შეფასების შემდეგ შეიქმნება. Gold საჯარო რეპოზიტორიაში შეფასებამდე არ ჩაიდება; შეფასება ერთჯერადია.

წინააღმდეგ შემთხვევაში მარტივად მოვირგებთ benchmark-ს მოდელზე და შედეგი რეალური აღარ იქნება.

---

# 9. Ground Truth

Claim Semantics-ზე gold label ძირითადად მკაფიო უნდა იყოს.

მაგრამ Editorial Quality-ზე ვითარება სხვანაირია.

მაგალითად:

```text
Is this generic?
```

ზოგ შემთხვევაში ორი გონივრული ადამიანი სხვადასხვა პასუხს გასცემს.

ამიტომ Quality benchmark-ის ნაწილზე დაახლოებით 40–50 მაგალითი დამოუკიდებლად უნდა შეაფასოს ორმა ადამიანმა.

ეს გვაძლევს human agreement baseline-ს.

თუ ადამიანები ერთმანეთს მხოლოდ 82%-ში ეთანხმებიან, მოდელს 99%-იან „accuracy“-ს ვერ მოვთხოვთ.

---

# 10. რა უნდა გავზომოთ

მხოლოდ accuracy არასაკმარისია.

## Classification

თითო contract-ზე:

```text
precision
recall
F1
false positive rate
false negative rate
```

Safety-sensitive checks-ზე false negative განსაკუთრებით მნიშვნელოვანია.

---

## Calibration

Jev-ის ერთ-ერთი ყველაზე მნიშვნელოვანი შესაძლო ღირებულება probability-ებია.

ამიტომ უნდა გავზომოთ:

```text
Brier score
calibration error
accuracy by confidence bucket
```

მაგალითად:

```text
0.95–1.00 confidence
0.85–0.95
0.70–0.85
0.50–0.70
```

მთავარი კითხვა:

> როცა Jev ძალიან დარწმუნებულია, მართლაც თითქმის ყოველთვის სწორია?

---

# 11. განსაკუთრებით მნიშვნელოვანი metric — Error Capture

ჩვენთვის შეიძლება ეს accuracy-ზე უფრო მნიშვნელოვანი იყოს.

გვინდა გავიგოთ:

> Jev-ის შეცდომების რამდენი პროცენტი ხვდება დაბალი-confidence bucket-ში?

მაგალითად:

```text
ყველა შეცდომის 88%
იყო confidence < 0.80
```

ეს შესანიშნავი შედეგი იქნებოდა.

რადგან შემდეგ შეგვიძლია:

```text
confidence >= threshold
→ accept semantic signal

confidence < threshold
→ stronger LLM
```

თუ მოდელი ცუდ პასუხებზე ძალიან თავდაჯერებულია, ასეთი fallback architecture ბევრად ნაკლებად ღირებულია.

---

# 12. Coverage

უნდა გავზომოთ:

```text
რა პროცენტის გადაწყვეტა შეუძლია Jev-ს
საჭირო reliability threshold-ის ზემოთ?
```

მაგალითად:

```text
72% → Jev alone
28% → LLM fallback
```

შეიძლება 72% coverage ბევრად ღირებული იყოს, ვიდრე 95% საშუალო accuracy.

---

# 13. Latency

უნდა ჩავწეროთ:

```text
p50
p95
p99
```

არა მხოლოდ საშუალო.

ასევე:

```text
1 check
5 checks
10 checks
20 checks
parallel execution
```

ჩვენი ჰიპოთეზა სწორედ ისაა, რომ ბევრი პატარა კითხვა შეიძლება ერთ დიდ review-ზე სწრაფი აღმოჩნდეს.

ეს ცალკე უნდა დავამტკიცოთ.

---

# 14. Cost

ყოველ run-ზე უნდა შევინახოთ:

```text
input size
number of checks
provider cost
fallback cost
total cost
```

შემდეგ შევადაროთ:

```text
one broad LLM review
vs
10 Jev checks
vs
20 Jev checks
vs
Jev + LLM fallback
```

---

# 15. Baseline

Jev მარტო არ უნდა შევაფასოთ.

იგივე semantic contracts უნდა გავუშვათ ჩვენს არსებულ ძლიერ LLM-ზე.

მაგრამ მასაც იგივე არჩევანი მივცეთ.

მაგალითად:

```text
YES
NO
UNCERTAIN
```

და არა თავისუფალი ტექსტური review.

ასე შევადარებთ semantic decision capability-ს და არა სხვადასხვა task design-ს.

---

# 16. პირველი acceptance criterion

პირველ ეტაპზე არ უნდა ვთქვათ:

```text
Jev accuracy უნდა იყოს 95%
```

ეს ხელოვნური ზღვარი იქნებოდა.

ოპერაციული კრიტერიუმი უფრო სწორი იქნება.

მაგალითად Jev-ს შეუძლია production architecture-ში როლის მიღება, თუ:

### A.

მის high-confidence subset-ში safety-relevant error ძალიან დაბალია.

### B.

შეცდომების დიდი ნაწილი low-confidence bucket-ში ხვდება.

### C.

მნიშვნელოვანი coverage რჩება ძლიერი LLM fallback-ის გარეშე.

### D.

Latency მნიშვნელოვნად უკეთესია broad LLM review-ზე.

### E.

Cost მნიშვნელოვნად დაბალია.

### F.

ქართული nuanced cases-ზე შედეგი საკმარისად სტაბილურია.

---

# 17. შესაძლო შედეგები

Benchmark-ს არ აქვს მხოლოდ ორი შედეგი:

```text
Jev კარგია
Jev ცუდია
```

შეიძლება მივიღოთ რამდენიმე რეალური დასკვნა.

### შედეგი A — ძალიან კარგი

```text
deterministic
→ Jev
→ rare LLM fallback
```

### შედეგი B — კარგია მხოლოდ მარტივ semantics-ზე

```text
deterministic
→ Jev obvious/moderate cases
→ LLM nuanced cases
```

ესეც ძალიან კარგი შედეგია.

### შედეგი C — კარგია მხოლოდ კონკრეტულ contracts-ზე

მაგალითად:

```text
priceClaim        excellent
comparativeClaim  excellent
proofRequirement  good
brandFidelity     weak
genericity        weak
```

ამ შემთხვევაში მხოლოდ პირველ სამს გამოვიყენებთ.

### შედეგი D — ქართული არასაკმარისია

Jev-ს საერთოდ არ ვაერთებთ.

Benchmark მაინც რჩება და შემდეგ მოდელს ვამოწმებთ.

---

# 18. ექსპერიმენტის თანმიმდევრობა

## Phase 1

Claim semantic contracts-ის საბოლოო სია.

## Phase 2

250–300 ქართული benchmark case.

## Phase 3

Gold labels და rationale.

## Phase 4

Baseline ძლიერი LLM.

## Phase 5

Jev.

## Phase 6

Calibration და threshold analysis.

## Phase 7

Frozen-protocol validation (not blind).

## Phase 8

Latency + cost comparison.

## Phase 9

Final report:

```text
where Jev works
where it fails
safe confidence thresholds
expected fallback rate
latency impact
cost impact
recommended role
```

## Phase 10

მხოლოდ ამის შემდეგ:

```text
Architecture Decision Record
```

და მხოლოდ მაშინ გადავწყვეტთ UNDA-ს შეცვლას.

---

# 19. ძირითადი invariant

Benchmark-ის მიზანი არ არის Jev-ის გამართლება.

მიზანია გავიგოთ რეალობა.

თუ შედეგი გვეტყვის:

```text
არ გამოგვადგება
```

ესეც წარმატებული ექსპერიმენტია.

თუ გვეტყვის:

```text
მხოლოდ ოთხ narrow contract-ზე გამოგვადგება
```

ვიყენებთ მხოლოდ ოთხზე.

თუ გვეტყვის:

```text
ქართული ძალიან კარგად ესმის და confidence-იც სწორად აქვს calibrated
```

მაშინ უკვე შეგვიძლია მნიშვნელოვნად უფრო მდიდარი semantic validation architecture ავაშენოთ.

---

# 20. საბოლოო ფილოსოფია

ჩვენ არ ვცდილობთ მოდელს მივანდოთ მეტი გადაწყვეტილება.

პირიქით.

ვცდილობთ მოდელისგან მივიღოთ **მეტი დაკვირვება და ნაკლები verdict**.

```text
more observations
more independent signals
more measurable uncertainty

→ less opaque judgment
→ less unnecessary reasoning
→ better application decisions
```

ამიტომ Benchmark-ის მთავარი კითხვა საბოლოოდ ასეთია:

> **შეგვიძლია თუ არა უფრო სრულყოფილი სურათი მივიღოთ უფრო სწრაფად, ისე რომ საბოლოო authority ისევ სისტემასთან დარჩეს?**

თუ პასუხი დადებითია, მაშინ Jev ზუსტად იმ არქიტექტურულ ადგილს ავსებს, რომელიც UNDA-ში უკვე გვაქვს გათვალისწინებული.

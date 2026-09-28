# UNDA Semantic Benchmark KA
## Adversarial Development Cases — Batch 01

### სტატუსი

```text
Development only
Do not move to Validation
48 contract evaluations
```

---

## A. Negation

### ka-adv-001-superlativeClaim

**ტექსტი**

> ჩვენ არ ვამბობთ, რომ საუკეთესო ვართ.

**Contract:** `superlativeClaim`  
**Gold:** `NO`  
**Difficulty:** moderate  
**Ambiguity:** low  
**Tags:** `negation`, `superlative`, `lexical-trap`

**Rationale:** ტექსტი შეიცავს სიტყვას „საუკეთესო“, მაგრამ ბრენდი superlative claim-ს არ აკეთებს — პირიქით, მის გაკეთებას უარყოფს.

---

### ka-adv-002-guaranteeClaim

**ტექსტი**

> შედეგის გარანტიას ვერ მოგცემთ.

**Contract:** `guaranteeClaim`  
**Gold:** `NO`  
**Difficulty:** moderate  
**Ambiguity:** low  
**Tags:** `negation`, `guarantee`, `lexical-trap`

**Rationale:** სიტყვა „გარანტია“ არსებობს, მაგრამ შედეგის გარანტია არ არის დაპირებული.

---

### ka-adv-003-discountClaim

**ტექსტი**

> 20%-იანი ფასდაკლება აღარ მოქმედებს.

**Contract:** `discountClaim`  
**Gold:** `NO`  
**Difficulty:** moderate  
**Ambiguity:** low  
**Tags:** `negation`, `discount`, `number`

**Rationale:** ტექსტი მიმდინარე ფასდაკლებას არ აცხადებს. ის ამბობს, რომ შეთავაზება დასრულებულია.

---

### ka-adv-004-factualAssertion

**ტექსტი**

> 20%-იანი ფასდაკლება აღარ მოქმედებს.

**Contract:** `factualAssertion`  
**Gold:** `YES`  
**Difficulty:** moderate  
**Ambiguity:** low  
**Tags:** `negation`, `discount`, `current-state`

**Rationale:** მიუხედავად იმისა, რომ discount claim აქტიური არ არის, ტექსტი მიმდინარე მდგომარეობის შესახებ შემოწმებად ფაქტს ამტკიცებს.

---

### ka-adv-005-factualAssertion

**ტექსტი**

> ჩვენ კვირაობით არ ვმუშაობთ.

**Contract:** `factualAssertion`  
**Gold:** `YES`  
**Difficulty:** moderate  
**Ambiguity:** low  
**Tags:** `negation`, `opening-hours`

**Rationale:** უარყოფითი ფორმით ნათქვამი statement მაინც შემოწმებადი ბიზნეს-ფაქტია.

---

### ka-adv-006-guaranteeClaim

**ტექსტი**

> პროცედურა ყოველთვის უმტკივნეულო არ არის.

**Contract:** `guaranteeClaim`  
**Gold:** `NO`  
**Difficulty:** nuanced  
**Ambiguity:** low  
**Tags:** `negation`, `clinical`, `absolute-language`

**Rationale:** ტექსტი სწორედ საპირისპიროს ამბობს — უნივერსალურ შედეგს არ ჰპირდება.

---

### ka-adv-007-clinicalOutcomeClaim

**ტექსტი**

> პროცედურა ყოველთვის უმტკივნეულო არ არის.

**Contract:** `clinicalOutcomeClaim`  
**Gold:** `YES`  
**Difficulty:** nuanced  
**Ambiguity:** medium  
**Tags:** `negation`, `clinical`, `quantifier`

**Rationale:** მიუხედავად universal promise-ის უარყოფისა, ტექსტი მაინც აკეთებს კლინიკური გამოცდილების/შედეგის შესახებ substantive assertion-ს.

---

### ka-adv-008-superlativeClaim

**ტექსტი**

> საუკეთესოობაზე საუბარი ჩვენი მიზანი არ არის.

**Contract:** `superlativeClaim`  
**Gold:** `NO`  
**Difficulty:** moderate  
**Ambiguity:** low  
**Tags:** `superlative`, `mention-not-claim`

**Rationale:** superlative vocabulary-ის ხსენება არ უდრის superlative assertion-ს.

---

# B. Quotation / Testimonial / Attribution

### ka-adv-009-superlativeClaim

**ტექსტი**

> პაციენტმა გვითხრა: „საუკეთესო გამოცდილება იყო.“

**Contract:** `superlativeClaim`  
**Gold:** `NO`  
**Difficulty:** nuanced  
**Ambiguity:** medium  
**Tags:** `testimonial`, `quotation`, `superlative`

**Rationale:** შეფასება მიეკუთვნება პაციენტს და არა ბრენდს. მიმდინარე taxonomy-ში testimonial ცალკე attribution შემთხვევაა.

---

### ka-adv-010-factualAssertion

**ტექსტი**

> პაციენტმა გვითხრა: „საუკეთესო გამოცდილება იყო.“

**Contract:** `factualAssertion`  
**Gold:** `NO`  
**Difficulty:** nuanced  
**Ambiguity:** medium  
**Tags:** `testimonial`, `quotation`

**Rationale:** ციტირებული შეფასება factual proposition-ად არ კლასიფიცირდება.

---

### ka-adv-011-clinicalOutcomeClaim

**ტექსტი**

> პაციენტი წერს: „პირველი ვიზიტიდანვე ვიგრძენი შედეგი.“

**Contract:** `clinicalOutcomeClaim`  
**Gold:** `NO`  
**Difficulty:** nuanced  
**Ambiguity:** medium  
**Tags:** `testimonial`, `clinical`, `attribution`

**Rationale:** ტექსტი გადმოსცემს კონკრეტული პაციენტის გამოცდილებას და არა ბრენდის ზოგად outcome assertion-ს.

---

### ka-adv-012-guaranteeClaim

**ტექსტი**

> პაციენტი წერს: „პირველი ვიზიტიდანვე ვიგრძენი შედეგი.“

**Contract:** `guaranteeClaim`  
**Gold:** `NO`  
**Difficulty:** moderate  
**Ambiguity:** low  
**Tags:** `testimonial`, `clinical`

**Rationale:** არც ბრენდი და არც ციტირებული პირი არ იძლევა მომავალი შედეგის გარანტიას.

---

### ka-adv-013-factualAssertion

**ტექსტი**

> ჩვენს შეფასებებში ხშირად წერენ, რომ მომსახურება სწრაფია.

**Contract:** `factualAssertion`  
**Gold:** `NO`  
**Difficulty:** nuanced  
**Ambiguity:** medium  
**Tags:** `testimonial`, `aggregation`, `evaluation`

**Rationale:** „სწრაფია“ შეფასებითი attribution-ია და არა უშუალო factual assertion მომსახურების ხანგრძლივობაზე.

---

### ka-adv-014-priceClaim

**ტექსტი**

> კლიენტი წერს: „ჩემი ვიზიტი 99 ლარი დამიჯდა.“

**Contract:** `priceClaim`  
**Gold:** `NO`  
**Difficulty:** nuanced  
**Ambiguity:** medium  
**Tags:** `testimonial`, `price`, `historical`

**Rationale:** ეს კონკრეტული კლიენტის ისტორიული გადახდილი თანხაა და არა ბრენდის მიმდინარე public pricing assertion.

---

### ka-adv-015-superlativeClaim

**ტექსტი**

> „საუკეთესო კლინიკა“ — ასე მოგვმართა ერთ-ერთმა პაციენტმა.

**Contract:** `superlativeClaim`  
**Gold:** `NO`  
**Difficulty:** nuanced  
**Ambiguity:** medium  
**Tags:** `testimonial`, `superlative`, `quotation`

**Rationale:** superlative attribution ბრენდის საკუთარ superiority assertion-ად არ ითვლება.

---

### ka-adv-016-guaranteeClaim

**ტექსტი**

> ერთ-ერთ შეფასებაში წერია: „შედეგი გარანტირებული მეგონა.“

**Contract:** `guaranteeClaim`  
**Gold:** `NO`  
**Difficulty:** nuanced  
**Ambiguity:** low  
**Tags:** `testimonial`, `guarantee`, `reported-belief`

**Rationale:** statement აღწერს პაციენტის წარსულ წარმოდგენას და შედეგის გარანტიას არ აცხადებს.

---

# C. Factual vs Evaluative

### ka-adv-017-factualAssertion

**ტექსტი**

> ჩვენი კლინიკა საუკეთესოა ქალაქში.

**Contract:** `factualAssertion`  
**Gold:** `NO`  
**Difficulty:** obvious  
**Ambiguity:** low  
**Tags:** `superlative`, `evaluative`

**Rationale:** „საუკეთესო“ განსაზღვრული საზომის გარეშე შეფასებითი superiority claim-ია და არა factual proposition.

---

### ka-adv-018-superlativeClaim

**ტექსტი**

> ჩვენი კლინიკა საუკეთესოა ქალაქში.

**Contract:** `superlativeClaim`  
**Gold:** `YES`  
**Difficulty:** obvious  
**Ambiguity:** low  
**Tags:** `superlative`

**Rationale:** ბრენდი პირდაპირ აცხადებს ყველაზე მაღალ შეფასებით პოზიციას.

---

### ka-adv-019-factualAssertion

**ტექსტი**

> 2025 წელს ქალაქში ყველაზე მეტი იმპლანტაცია ჩავატარეთ.

**Contract:** `factualAssertion`  
**Gold:** `YES`  
**Difficulty:** nuanced  
**Ambiguity:** low  
**Tags:** `superlative`, `measurable`, `historical`

**Rationale:** superiority აქ მიბმულია კონკრეტულ საზომზე — ჩატარებული იმპლანტაციების რაოდენობაზე — და პრინციპულად შემოწმებადია.

---

### ka-adv-020-superlativeClaim

**ტექსტი**

> 2025 წელს ქალაქში ყველაზე მეტი იმპლანტაცია ჩავატარეთ.

**Contract:** `superlativeClaim`  
**Gold:** `YES`  
**Difficulty:** moderate  
**Ambiguity:** low  
**Tags:** `superlative`, `measurable`

**Rationale:** „ყველაზე მეტი“ პირდაპირ highest-rank claim-ია.

---

### ka-adv-021-factualAssertion

**ტექსტი**

> ჩვენი ექიმების საშუალო გამოცდილება 14 წელია.

**Contract:** `factualAssertion`  
**Gold:** `YES`  
**Difficulty:** obvious  
**Ambiguity:** low  
**Tags:** `experience`, `number`

**Rationale:** კონკრეტული რაოდენობრივი ბიზნეს-ფაქტია.

---

### ka-adv-022-quantifiedClaim

**ტექსტი**

> ჩვენი ექიმების საშუალო გამოცდილება 14 წელია.

**Contract:** `quantifiedClaim`  
**Gold:** `YES`  
**Difficulty:** obvious  
**Ambiguity:** low  
**Tags:** `experience`, `number`

**Rationale:** statement შეიცავს კონკრეტულ რიცხვით მტკიცებას.

---

### ka-adv-023-factualAssertion

**ტექსტი**

> ჩვენი გუნდი ძალიან გამოცდილია.

**Contract:** `factualAssertion`  
**Gold:** `NO`  
**Difficulty:** nuanced  
**Ambiguity:** medium  
**Tags:** `evaluative`, `experience`

**Rationale:** „ძალიან გამოცდილია“ განსაზღვრული საზომის გარეშე შეფასებითი assertion-ია.

---

### ka-adv-024-factualAssertion

**ტექსტი**

> კლინიკას სამი ციფრული სკანერი აქვს.

**Contract:** `factualAssertion`  
**Gold:** `YES`  
**Difficulty:** obvious  
**Ambiguity:** low  
**Tags:** `equipment`, `number`

**Rationale:** კონკრეტული შემოწმებადი ბიზნეს-ფაქტია.

---

### ka-adv-025-quantifiedClaim

**ტექსტი**

> კლინიკას სამი ციფრული სკანერი აქვს.

**Contract:** `quantifiedClaim`  
**Gold:** `YES`  
**Difficulty:** obvious  
**Ambiguity:** low  
**Tags:** `equipment`, `number`

**Rationale:** statement შეიცავს კონკრეტულ რაოდენობას.

---

### ka-adv-026-factualAssertion

**ტექსტი**

> ჩვენ ყველაზე თანამედროვე ტექნოლოგიას ვიყენებთ.

**Contract:** `factualAssertion`  
**Gold:** `NO`  
**Difficulty:** nuanced  
**Ambiguity:** medium  
**Tags:** `superlative`, `technology`, `evaluative`

**Rationale:** „ყველაზე თანამედროვე“ არ შეიცავს მკაფიო საზომს ან შედარების განსაზღვრულ სივრცეს.

---

# D. Promise vs Fact / Implicit Outcome

### ka-adv-027-factualAssertion

**ტექსტი**

> შედეგი გარანტირებულია.

**Contract:** `factualAssertion`  
**Gold:** `NO`  
**Difficulty:** obvious  
**Ambiguity:** low  
**Tags:** `guarantee`, `promise`

**Rationale:** ეს არის outcome guarantee და არა აღწერითი factual proposition.

---

### ka-adv-028-guaranteeClaim

**ტექსტი**

> შედეგი გარანტირებულია.

**Contract:** `guaranteeClaim`  
**Gold:** `YES`  
**Difficulty:** obvious  
**Ambiguity:** low  
**Tags:** `guarantee`

**Rationale:** შედეგზე პირდაპირი გარანტიაა.

---

### ka-adv-029-factualAssertion

**ტექსტი**

> ხვალ უკვე უკეთ იგრძნობთ თავს.

**Contract:** `factualAssertion`  
**Gold:** `NO`  
**Difficulty:** moderate  
**Ambiguity:** low  
**Tags:** `future`, `outcome`, `promise`

**Rationale:** მომავალი ინდივიდუალური შედეგის დაპირებაა და არა მიმდინარე ან წინასწარ განსაზღვრული ბიზნეს-ფაქტი.

---

### ka-adv-030-clinicalOutcomeClaim

**ტექსტი**

> ხვალ უკვე უკეთ იგრძნობთ თავს.

**Contract:** `clinicalOutcomeClaim`  
**Gold:** `YES`  
**Difficulty:** moderate  
**Ambiguity:** low  
**Tags:** `future`, `clinical`, `outcome`

**Rationale:** ტექსტი კონკრეტულ კლინიკურ/პაციენტის შედეგს ჰპირდება.

---

### ka-adv-031-factualAssertion

**ტექსტი**

> კლინიკა ხვალ 10:00 საათზე გაიხსნება.

**Contract:** `factualAssertion`  
**Gold:** `YES`  
**Difficulty:** moderate  
**Ambiguity:** low  
**Tags:** `future`, `schedule`

**Rationale:** მომავლის მიუხედავად, ეს კონკრეტული schedule assertion-ია და გადამოწმებადია.

---

### ka-adv-032-availabilityClaim

**ტექსტი**

> ხვალ ორი თავისუფალი დრო გვაქვს.

**Contract:** `availabilityClaim`  
**Gold:** `YES`  
**Difficulty:** obvious  
**Ambiguity:** low  
**Tags:** `availability`, `number`, `future`

**Rationale:** კონკრეტული ხელმისაწვდომობის განცხადებაა.

---

### ka-adv-033-factualAssertion

**ტექსტი**

> ხვალ ორი თავისუფალი დრო გვაქვს.

**Contract:** `factualAssertion`  
**Gold:** `YES`  
**Difficulty:** obvious  
**Ambiguity:** low  
**Tags:** `availability`, `current-state`

**Rationale:** ბრენდის მიმდინარე booking state-ის შესახებ შემოწმებადი assertion-ია.

---

### ka-adv-034-guaranteeClaim

**ტექსტი**

> ერთხელ მოხვალთ და პრობლემა წარსულში დარჩება.

**Contract:** `guaranteeClaim`  
**Gold:** `YES`  
**Difficulty:** nuanced  
**Ambiguity:** medium  
**Tags:** `implicit-guarantee`, `outcome`

**Rationale:** სიტყვა „გარანტია“ არ გამოიყენება, მაგრამ შედეგი წარმოდგენილია როგორც განსაზღვრული და გარდაუვალი.

---

# E. Comparative Claims

### ka-adv-035-comparativeClaim

**ტექსტი**

> ჩვენი მეთოდი უფრო სწრაფია.

**Contract:** `comparativeClaim`  
**Gold:** `YES`  
**Difficulty:** moderate  
**Ambiguity:** low  
**Tags:** `comparison`, `implicit-reference`

**Rationale:** „უფრო სწრაფია“ პირდაპირ შედარებით მნიშვნელობას შეიცავს, მიუხედავად იმისა, რომ reference არ არის დასახელებული.

---

### ka-adv-036-comparativeClaim

**ტექსტი**

> ჩვენი მეთოდი 30%-ით სწრაფია წინა თაობის მეთოდზე.

**Contract:** `comparativeClaim`  
**Gold:** `YES`  
**Difficulty:** obvious  
**Ambiguity:** low  
**Tags:** `comparison`, `number`, `explicit-reference`

**Rationale:** განსაზღვრული reference-თან პირდაპირი შედარებაა.

---

### ka-adv-037-quantifiedClaim

**ტექსტი**

> ჩვენი მეთოდი 30%-ით სწრაფია წინა თაობის მეთოდზე.

**Contract:** `quantifiedClaim`  
**Gold:** `YES`  
**Difficulty:** obvious  
**Ambiguity:** low  
**Tags:** `comparison`, `percentage`

**Rationale:** შედარება კონკრეტული 30%-იანი რაოდენობრივი მტკიცებით არის გამოხატული.

---

### ka-adv-038-factualAssertion

**ტექსტი**

> ჩვენი მეთოდი 30%-ით სწრაფია წინა თაობის მეთოდზე.

**Contract:** `factualAssertion`  
**Gold:** `YES`  
**Difficulty:** moderate  
**Ambiguity:** low  
**Tags:** `comparison`, `measurable`, `percentage`

**Rationale:** measurable comparative proposition პრინციპულად ემპირიულად შემოწმებადია.

---

### ka-adv-039-comparativeClaim

**ტექსტი**

> ეს უკეთესი არჩევანია მათთვის, ვისაც დრო ცოტა აქვს.

**Contract:** `comparativeClaim`  
**Gold:** `YES`  
**Difficulty:** nuanced  
**Ambiguity:** medium  
**Tags:** `comparison`, `evaluative`

**Rationale:** „უკეთესი“ semantic comparison-ია, მიუხედავად იმისა, რომ reference implicit-ია.

---

### ka-adv-040-comparativeClaim

**ტექსტი**

> ჩვენ არ ვამბობთ, რომ კონკურენტებზე უკეთესი ვართ.

**Contract:** `comparativeClaim`  
**Gold:** `NO`  
**Difficulty:** nuanced  
**Ambiguity:** low  
**Tags:** `comparison`, `negation`, `mention-not-claim`

**Rationale:** comparison მხოლოდ უარყოფილი proposition-ის ნაწილადაა ნახსენები.

---

### ka-adv-041-comparativeClaim

**ტექსტი**

> წინა მეთოდთან შედარებით დისკომფორტი ნაკლებია.

**Contract:** `comparativeClaim`  
**Gold:** `YES`  
**Difficulty:** obvious  
**Ambiguity:** low  
**Tags:** `comparison`, `clinical`

**Rationale:** explicit comparison-ია ორ მეთოდს შორის.

---

### ka-adv-042-proofRequirement

**ტექსტი**

> წინა მეთოდთან შედარებით დისკომფორტი ნაკლებია.

**Contract:** `proofRequirement`  
**Gold:** `YES`  
**Difficulty:** moderate  
**Ambiguity:** low  
**Tags:** `comparison`, `clinical`, `proof`

**Rationale:** comparative clinical assertion-ს მხარდაჭერა სჭირდება.

---

# F. Question / Hypothetical / Multi-claim

### ka-adv-043-superlativeClaim

**ტექსტი**

> ჩვენ საუკეთესო კლინიკა ვართ?

**Contract:** `superlativeClaim`  
**Gold:** `NO`  
**Difficulty:** moderate  
**Ambiguity:** low  
**Tags:** `question`, `superlative`

**Rationale:** კითხვა proposition-ის assertion არ არის.

---

### ka-adv-044-clinicalOutcomeClaim

**ტექსტი**

> წარმოიდგინეთ, რომ პროცედურა სრულიად უმტკივნეულოა.

**Contract:** `clinicalOutcomeClaim`  
**Gold:** `NO`  
**Difficulty:** nuanced  
**Ambiguity:** medium  
**Tags:** `hypothetical`, `clinical`

**Rationale:** ტექსტი ჰიპოთეტურ სცენარს ქმნის და რეალურ outcome-ს არ ამტკიცებს.

---

### ka-adv-045-priceClaim

**ტექსტი**

> თუ ფასი 99 ლარი იქნებოდა, არჩევანს შეცვლიდით?

**Contract:** `priceClaim`  
**Gold:** `NO`  
**Difficulty:** moderate  
**Ambiguity:** low  
**Tags:** `hypothetical`, `price`, `number`

**Rationale:** 99 ლარი მხოლოდ hypothetical condition-შია და მიმდინარე public price-ად არ არის გამოცხადებული.

---

### ka-adv-046-guaranteeClaim

**ტექსტი**

> რა მოხდება, თუ შედეგი გარანტირებული იქნება?

**Contract:** `guaranteeClaim`  
**Gold:** `NO`  
**Difficulty:** moderate  
**Ambiguity:** low  
**Tags:** `question`, `hypothetical`, `guarantee`

**Rationale:** ტექსტი guarantee-ის არსებობას არ ამტკიცებს.

---

### ka-adv-047-priceClaim

**ტექსტი**

> 99 ლარად მიიღებთ კონსულტაციას.

**Contract:** `priceClaim`  
**Gold:** `YES`  
**Difficulty:** obvious  
**Ambiguity:** low  
**Tags:** `price`, `number`

**Rationale:** პირდაპირი კონკრეტული public price assertion-ია.

---

### ka-adv-048-quantifiedClaim

**ტექსტი**

> 99 ლარად მიიღებთ კონსულტაციას.

**Contract:** `quantifiedClaim`  
**Gold:** `YES`  
**Difficulty:** obvious  
**Ambiguity:** low  
**Tags:** `price`, `number`

**Rationale:** statement შეიცავს კონკრეტულ რიცხვით მტკიცებას.

---

# Batch 01 — coverage summary

```text
Negation                         8
Quotation / attribution         8
Factual vs evaluative          10
Promise / outcome               8
Comparative                     8
Question / hypothetical         6
---------------------------------
Total                          48
```

## განსაკუთრებით მნიშვნელოვანი cases

პირველ გაშვებაში ყურადღება უნდა მივაქციოთ:

```text
ka-adv-007   clinical statement inside negation
ka-adv-009   testimonial superlative
ka-adv-014   historical quoted price
ka-adv-019   measurable superlative as factual assertion
ka-adv-023   experienced vs measurable experience
ka-adv-026   "most modern" without metric
ka-adv-034   implicit guarantee without guarantee vocabulary
ka-adv-035   comparison with missing reference
ka-adv-039   evaluative comparison
ka-adv-040   negated comparison
ka-adv-044   hypothetical clinical language
ka-adv-045   hypothetical price
```

თუ Jev სწორედ ამ boundary cases-ზე ცდება, ეს ბევრად უფრო ინფორმაციული იქნება, ვიდრე obvious case-ზე შეცდომა.

## Rule before running

ამ 48 case-ის Jev-ის პასუხების ნახვამდე gold labels არ იცვლება.

თუ შედეგის შემდეგ რომელიმე gold საეჭვო აღმოჩნდება:

```text
model disagreement
→ ontology review
→ written reason
→ only then relabel
```

არ ვასწორებთ label-ს მხოლოდ იმიტომ, რომ model სხვაგვარად პასუხობს.
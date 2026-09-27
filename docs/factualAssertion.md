# 1. `factualAssertion` — canonical contract v0.1

## მიზანი

Contract ამოწმებს მხოლოდ იმას, შეიცავს თუ არა ტექსტი აღწერით მტკიცებას სამყაროს, ბიზნესის, სერვისის, ადამიანის, მოვლენის ან მიმდინარე მდგომარეობის შესახებ, რომლის სისწორის გადამოწმება პრინციპულად შესაძლებელია მტკიცებულებით ან ავტორიტეტული მონაცემით.

## კითხვა

> Does this text assert a descriptive proposition that can, in principle, be verified as true or false using evidence?

## პასუხები

```text
YES
NO
UNCERTAIN
```

## `YES`

`YES`, როდესაც ტექსტი ამტკიცებს კონკრეტულ მდგომარეობას, ფაქტს, რაოდენობას, ფასს, თარიღს, შესაძლებლობას, მიმდინარე შეთავაზებას ან სხვა შემოწმებად გარემოებას.

მაგალითები:

```text
კლინიკა მუშაობს კვირაში 7 დღე.                       YES
კონსულტაცია ღირს 120 ლარი.                          YES
კლინიკაში მუშაობს 12 ექიმი.                         YES
დღეს ყველა მომსახურებაზე 20%-იანი ფასდაკლება მოქმედებს. YES
ფილიალი ვაკეში მდებარეობს.                          YES
პროცედურა საშუალოდ 40 წუთს გრძელდება.               YES
```

## `NO`

`NO`, როდესაც statement ძირითადად არის:

- სუბიექტური შეფასება;
- superlative ან prestige claim მკაფიო საზომის გარეშე;
- გარანტია;
- დაპირება;
- მომავლის outcome;
- რეკომენდაცია;
- მოწოდება;
- სურვილი;
- opinion;
- testimonial-ის ციტირება, თუ თავად ბრენდი ფაქტს არ ამტკიცებს.

მაგალითები:

```text
ჩვენი კლინიკა საუკეთესოა ქალაქში.         NO
შედეგი გარანტირებულია.                    NO
ჩვენთან თავს უკეთ იგრძნობთ.               NO
ეს თქვენთვის საუკეთესო არჩევანია.          NO
აუცილებლად სცადეთ ეს მომსახურება.          NO
```

ეს statements შეიძლება სხვა contracts-ში `YES` იყოს.

მაგალითად:

```text
"ჩვენი კლინიკა საუკეთესოა ქალაქში."

superlativeClaim  = YES
factualAssertion  = NO
proofRequirement  = YES
```

და:

```text
"შედეგი გარანტირებულია."

guaranteeClaim    = YES
factualAssertion  = NO
proofRequirement  = YES
```

## მნიშვნელოვანი boundary

`factualAssertion` არ პასუხობს კითხვას:

> Does this claim require proof?

ეს არის `proofRequirement`-ის პასუხისმგებლობა.

`factualAssertion` პასუხობს მხოლოდ:

> What kind of semantic proposition is this?

Claim taxonomy და proof policy ერთმანეთისგან დამოუკიდებელია.

---

# 2. რთული შემთხვევების წესები

## რაოდენობრივი შეფასება

```text
ჩვენი პაციენტების 90% კმაყოფილია.   YES
```

რადგან არსებობს შემოწმებადი რაოდენობრივი assertion.

## Superlative + measurable basis

```text
2025 წელს ქალაქში ყველაზე მეტი იმპლანტაცია ჩავატარეთ.
```

თუ statement კონკრეტულ measurable quantity-ს ამტკიცებს:

```text
factualAssertion = YES
superlativeClaim = YES
```

ეს უკვე განსხვავდება:

```text
ჩვენ საუკეთესო კლინიკა ვართ.
```

რომელიც:

```text
factualAssertion = NO
superlativeClaim = YES
```

## Future factual commitment

```text
კლინიკა ხვალ 10:00 საათზე გაიხსნება.
```

`YES`, რადგან კონკრეტული schedule assertion-ია, მიუხედავად იმისა, რომ მომავლის მოვლენას ეხება.

მაგრამ:

```text
ხვალ უკვე უკეთ იგრძნობთ თავს.
```

`NO`, რადგან ეს outcome promise-ია.

## Negation

```text
ჩვენ კვირაობით არ ვმუშაობთ.
```

`YES`.

Negated factual proposition მაინც factual proposition-ია.

## Quotation

```text
პაციენტმა დაწერა: „ეს საუკეთესო კლინიკაა.“
```

თავად ბრენდის factual assertion:

```text
NO
```

მაგრამ შესაძლოა ცალკე contract-მა დააფიქსიროს:

```text
testimonial / attributed claim
```

---

# 3. Adversarial Development Matrix

შემდეგი development expansion შემთხვევითი ფრაზებით არ უნდა გაკეთდეს.

ვაგებთ:

```text
semantic phenomenon
×
difficulty
×
contract
```

---

## A. Negation

მიზანი: keyword detection არ გადაიქცეს semantic false positive-ად.

მაგალითები:

```text
ჩვენ არ ვამბობთ, რომ საუკეთესო ვართ.
შედეგის გარანტიას ვერ მოგცემთ.
პროცედურა ყოველთვის უმტკივნეულო არ არის.
20%-იანი ფასდაკლება აღარ მოქმედებს.
ჩვენ კვირაობით არ ვმუშაობთ.
```

სასურველი რაოდენობა:

```text
10–15 cases
```

---

## B. Quotation / Testimonial / Attribution

მიზანი: ბრენდის claim-ისა და სხვისი statement-ის გარჩევა.

```text
პაციენტმა გვითხრა: „საუკეთესო გამოცდილება იყო.“
ექიმის თქმით, ეს მეთოდი ხშირად ნაკლებ დისკომფორტს იწვევს.
ჩვენს შეფასებებში ხშირად წერენ, რომ მომსახურება სწრაფია.
```

სასურველი რაოდენობა:

```text
10–15 cases
```

---

## C. Factual vs Evaluative

მიზანი: ახალი `factualAssertion` boundary-ის გამოცდა.

```text
ჩვენ საუკეთესო კლინიკა ვართ.
კლინიკაში 18 ექიმი მუშაობს.
ჩვენი გუნდი ძალიან გამოცდილია.
ჩვენი ექიმების საშუალო გამოცდილება 14 წელია.
ყველაზე თანამედროვე ტექნოლოგიას ვიყენებთ.
კლინიკას სამი ციფრული სკანერი აქვს.
```

სასურველი რაოდენობა:

```text
15–20 cases
```

---

## D. Promise vs Fact

```text
შედეგი გარანტირებულია.
პროცედურის შედეგს პირველივე კვირაში დაინახავთ.
პროცედურა საშუალოდ 30 წუთს გრძელდება.
ხვალ კლინიკა 09:00-ზე გაიხსნება.
```

სასურველი რაოდენობა:

```text
10–15 cases
```

---

## E. Implicit Claims

მიზანი: keyword-ის გარეშე semantic claim-ის აღმოჩენა.

```text
ერთხელ მოხვალთ და პრობლემა წარსულში დარჩება.
აღარ მოგიწევთ ტკივილთან შეგუება.
პირველი ვიზიტიდანვე იგრძნობთ განსხვავებას.
```

სასურველი რაოდენობა:

```text
15–20 cases
```

---

## F. Comparative Claims

განსაკუთრებით გვჭირდება, რადგან საწყის dataset-ში positive coverage მცირეა.

```text
ჩვენი მეთოდი უფრო სწრაფია.
სხვა მეთოდებთან შედარებით ნაკლებ დისკომფორტს იწვევს.
წინა თაობის მოწყობილობაზე 30%-ით სწრაფია.
ეს უკეთესი არჩევანია მათთვის, ვისაც დრო ცოტა აქვს.
```

სასურველი რაოდენობა:

```text
15–20 cases
```

აუცილებლად უნდა იყოს:

```text
explicit comparison
implicit comparison
measurable comparison
subjective comparison
negated comparison
```

---

## G. Availability

საწყის dataset-ში მხოლოდ ერთი შემთხვევაა — არასაკმარისია.

```text
ხვალ ორი თავისუფალი დრო გვაქვს.
ამ კვირაში ჩაწერა შესაძლებელია.
ადგილები აღარ დარჩა.
ამ მომსახურებაზე დროებით ჩაწერას ვერ ვიღებთ.
```

სასურველი რაოდენობა:

```text
10–15 cases
```

---

## H. Multiple Claims in One Sentence

```text
99 ლარად მიიღებთ უმტკივნეულო მომსახურებას საუკეთესო სპეციალისტთან.
```

შესაძლო labels:

```text
priceClaim           YES
quantifiedClaim      YES
clinicalOutcomeClaim YES
superlativeClaim     YES
factualAssertion     YES only for the price component
proofRequirement     YES
```

სასურველი რაოდენობა:

```text
15–20 cases
```

---

## I. Morphology

ქართული inflection სპეციალურად უნდა იყოს დატვირთული.

```text
საუკეთესოა
საუკეთესოს
საუკეთესოდ

ლიდერია
ლიდერად
ლიდერს

გარანტირებულია
გარანტირებულად
გარანტირებულ შედეგს

უმტკივნეულოა
უმტკივნეულოდ
უმტკივნეულობის
```

სასურველი რაოდენობა:

```text
15–20 cases
```

ეს აგრძელებს ჩვენს არსებულ წესს, რომ ქართულისთვის exact matching საკმარისი არ არის და scanner-ს stem/prefix/pattern მხარდაჭერა სჭირდება.

---

## J. Scope / Quantifier Traps

```text
ზოგიერთ შემთხვევაში შედეგი პირველივე დღეს ჩანს.
ყველა პაციენტი შედეგს პირველივე დღეს ხედავს.
ხშირად პროცედურა უმტკივნეულოდ მიმდინარეობს.
პროცედურა ყოველთვის უმტკივნეულოა.
```

მიზანი:

```text
some
often
most
all
always
may
will
```

შორის semantic განსხვავების დაჭერა.

სასურველი რაოდენობა:

```text
10–15 cases
```

---

## K. Temporal Claims

```text
დღეს მოქმედებს 20%-იანი ფასდაკლება.
გასულ თვეში 20%-იანი ფასდაკლება მოქმედებდა.
ოქტომბრიდან ფასი 150 ლარი იქნება.
```

სასურველი რაოდენობა:

```text
10 cases
```

---

## L. Questions / Hypotheticals

```text
ჩვენ საუკეთესო კლინიკა ვართ?
რა მოხდება, თუ შედეგი გარანტირებული იქნება?
წარმოიდგინეთ, რომ პროცედურა სრულიად უმტკივნეულოა.
```

მიზანი: mention ≠ assertion.

სასურველი რაოდენობა:

```text
10–15 cases
```

---

# 4. Expansion target

საწყისი გაფართოება:

```text
+100–140 contract evaluations
```

არ არის აუცილებელი 140 სხვადასხვა sentence.

ერთი sentence შეიძლება რამდენიმე contract-ზე შემოწმდეს.

პრიორიტეტი:

```text
1. factual vs evaluative
2. negation
3. comparative
4. implicit claims
5. multi-claim
6. availability
7. quotation
8. morphology
9. quantifier traps
10. temporal/hypothetical
```

---

# 5. მონაცემის შექმნის წესი

ყოველ item-ს უნდა ჰქონდეს:

```text
text
contract
gold
difficulty
ambiguity
tags
human rationale
```

`humanRationale` აუცილებელია.

Gold label არ უნდა არსებობდეს მხოლოდ იმიტომ, რომ „ასე მგონია“.

---

# 6. Gold review rule

ახალი nuanced case-ის შემთხვევაში პირველად ვსვამთ კითხვას:

> Contract-ის definition-იდან ცალსახად გამოდის პასუხი?

თუ არა:

```text
ambiguity = high
```

და:

```text
gold = UNCERTAIN
```

ან case გადადის ontology-review-ში.

მოდელის დასასჯელად ბუნდოვანი gold არ უნდა შევქმნათ.

---

# 7. განვითარების მთავარი წესი

Development set-ის მიზანი არ არის Jev-ის score-ის გაზრდა.

თუ model disagreement გამოავლენს contract-ის პრობლემას:

```text
fix ontology
→ document why
→ relabel affected cases
```

თუ contract მკაფიოა და მოდელი მაინც ცდება:

```text
model error
```

ამ ორ მოვლენას benchmark-ში ერთმანეთში არ ვურევთ.

---

# 8. შემდეგი checkpoint

Adversarial expansion-ის შემდეგ თავიდან ვითვლით:

```text
Precision
Recall
F1
Brier
Calibration Error

coverage @ 60
coverage @ 70
coverage @ 80
coverage @ 85
coverage @ 90
coverage @ 95

errors at each threshold
abstention rate
error capture below threshold
```

განსაკუთრებით გვაინტერესებს:

> რამდენი შეცდომა ხვდება fallback region-ში?

და არა მხოლოდ:

> რამდენი პასუხი იყო სწორი?

---

# 9. Freeze criterion

Holdout-ის გახსნამდე უნდა გაიყინოს:

```text
contract definitions
gold labels
provider instructions
output schema
confidence interpretation
development dataset
evaluation code
```

ამის შემდეგ development-ზე აღარაფერი იცვლება holdout-ის შედეგის მიხედვით.

ეს არის ზღვარი ექსპერიმენტსა და რეალურ შეფასებას შორის.
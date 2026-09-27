# UNDA Semantic Benchmark KA

დამოუკიდებელი სამუშაო გარემო ქართული semantic contract-ების შესაფასებლად. პირველი მოდულია **Claim Semantics**. Jev და ძლიერი baseline ერთსა და იმავე ტექსტებსა და contract-ებს ამუშავებენ. ეს რეპოზიტორია UNDA production სისტემას არ ცვლის.

მიმდინარე ეტაპები: **Development → ონტოლოგიის დაზუსტება და ზღვრის შერჩევა; Validation → გაყინული პროტოკოლის დადასტურება და განზოგადების შემოწმება; Sealed Holdout → მომავალში ერთჯერადი საბოლოო შეფასება.** Development-ისა და validation-ის gold ამ რეპოზიტორიაში ჩანს, ამიტომ არც ერთი blind არ არის. დეტალები: [მეთოდოლოგია](docs/methodology.md).

## გაშვება

```powershell
Copy-Item .env.example .env.local
# შეავსეთ .env.local სერვერის გასაღებებით
npm install
npm run dev
```

გახსენით <http://localhost:3000>. `.env.local` Git-ში არ მოხვდება. Jev-ის გასაღები იქმნება პროვაიდერის ანგარიშში. API ფორმატი გადამოწმებულია [TypeSafe-ის ოფიციალურ OpenAPI სქემასთან](https://api.typesafe.ai/openapi.json): `POST /v1/systemone`, `state`, `model`, `questions`, `noul` პასუხი და token usage. სხვა სერვერზე გადასართავად გამოიყენეთ `JEV_API_URL`.

Baseline არის **GPT-6 Sol, `xhigh` reasoning დონით** და მუშაობს [OpenAI Responses API](https://developers.openai.com/api/docs/guides/reasoning)-ზე. `.env.local`-ში შეავსეთ მხოლოდ `BASELINE_API_KEY`; მოდელი, reasoning დონე და endpoint უკვე მითითებულია. Baseline აბრუნებს `YES / NO / UNCERTAIN` ნიშნულს მკაცრი JSON სქემით. რადგან API ამ ამოცანაზე YES-ის ალბათობას არ აბრუნებს, baseline-ის calibration და confidence coverage არ დაითვლება. `xhigh`-ზე სრული ნაკრების გაშვება შეიძლება ხანგრძლივი და ფასიანი იყოს; ჯერ 10 ტექსტიანი სწრაფი ტესტი გაუშვით.

საჯარო გარემოში ექსპერიმენტის დაწყება მხოლოდ `BENCHMARK_ACCESS_TOKEN`-ით შეიძლება. იგი სერვერის env ცვლადში და ეკრანის „გაშვების წვდომის კოდი“ ველში იწერება. კოდი ბრაუზერში მხოლოდ მიმდინარე სესიის განმავლობაში ინახება.

## სამუშაო თანმიმდევრობა

1. გაუშვით 10 ტექსტიანი სწრაფი development ტესტი, შემდეგ **Batch 01 · 48 case** და **Adversarial · 100 case**. ყველა adversarial case მხოლოდ development-შია.
2. გადაამოწმეთ [canonical `factualAssertion` განმარტება](docs/factualAssertion.md), [Batch 01 gold-ები](docs/Cases.md) და [ონტოლოგიის ცვლილებები](docs/ontology-review.md). Model disagreement-ის გამო ნიშნული პირდაპირ არ შეცვალოთ: ჯერ განმარტება და მიზეზი წერილობით გადაამოწმეთ.
3. საჭირო შესწორებების შემდეგ ხელახლა შექმენით მონაცემები: `python scripts/generate_dataset.py`. Development-ის სრული ნაკრებით შეარჩიეთ confidence ზღვარი.
4. როცა contract-ები, gold, review ჩანაწერები, provider-ის ინსტრუქციები, output schema, confidence-ის წაკითხვა, development და validation ნაკრებები და შეფასების კოდი გადაიხედება, ეკრანზე ნაჩვენები **პროტოკოლის ვერსია** ჩაწერეთ `.env.local`-ში `BENCHMARK_FROZEN_PROTOCOL_VERSION` მნიშვნელობად. ეს არის ხელით დადასტურებული freeze; აპი ვერ ამოწმებს, ნამდვილად ჩატარდა თუ არა ადამიანური განხილვა. ნებისმიერი შესაბამისი ფაილის ან მოდელის პარამეტრის ცვლილება ვერსიას შეცვლის და validation-ის გაშვებას ისევ ჩაკეტავს.
5. Validation-ის **გაშვება** შესაძლებელია მხოლოდ გაყინული პროტოკოლითა და იმავე ვერსიაზე სრული, უშეცდომო development გაშვებით. Gold ხელმისაწვდომია review-სთვის. Jev-ის confidence ზღვარი development-იდან გადმოდის. შედეგები შეადარეთ GPT-6 Sol baseline-ს; probability მეტრიკები მხოლოდ Jev-ზე იქნება.

`datasets/claim-semantics/` შეიცავს **139 განსხვავებულ ქართულ ტექსტს / 403 contract case-ს**: 284 development, 119 validation. მათ შორის 48 case პირდაპირ [Cases.md](docs/Cases.md)-დან მოდის, ხოლო 52 დამატებითი შეფასება adversarial მატრიცის მიხედვითაა შექმნილი. საწყის ნაკრებთან ტექსტის/contract-ის ოთხი დუბლიკატი ჩანაცვლებულია დოკუმენტირებული gold-ით. ერთი ბუნდოვანი seed ტექსტი validation-იდან development-ში გადავიდა ontology review-სთვის. ახლა არის 397 `draft`, 6 `ontology-review`, 0 `reviewed`. Validation-ის 119 ტექსტი/contract/gold უცვლელია; შეიცვალა მხოლოდ `split` მნიშვნელობა. `UNCERTAIN` gold ქულაში არ შედის. Review-ის ღილაკი თითო case-ს ცალ-ცალკე ამოწმებს; ჩანაწერი ინახება `reviews.json`-ში და ცვლის dataset/protocol hash-ს.

Jev-ის Noul ალბათობა აპლიკაციაში გარდაიქმნება ასე: `p >= 0.60 → YES`, `p <= 0.40 → NO`, `0.40 < p < 0.60 → application abstention`. ეს კონფიგურირებული decision dead-zone-ია; Jev native `UNCERTAIN`-ს არ აბრუნებს. Baseline native `UNCERTAIN`-ს აბრუნებს. სტაბილურობის ცალკე სექცია 3–5 იდენტური კონფიგურაციის განმეორებით გაშვებას ადარებს, მოდელის ხელახლა გამოძახების გარეშე.

## მეტრიკების წაკითხვა

- `პასუხის სიზუსტე`: სწორი პასუხების წილი მხოლოდ იმ case-ებზე, სადაც მოდელმა YES ან NO თქვა. Jev-ის application abstention და baseline-ის native `UNCERTAIN` ამ მნიშვნელობას არ ამცირებს.
- `პასუხის დაფარვა` და `სრული სიზუსტე`: შესაბამისად, პასუხგაცემული case-ების წილი და სწორი პასუხების წილი ყველა შეფასებადი gold-ის მიმართ. მოდელების სამართლიანად შესადარებლად ეს მაჩვენებლები ერთად წაიკითხეთ.
- `Brier score`: YES ალბათობის კვადრატული შეცდომა gold boolean-თან; ნაკლები უკეთესია.
- `Calibration error`: confidence bucket-ში საშუალო confidence-ისა და ფაქტობრივი სიზუსტის შეწონილი სხვაობა.
- `Coverage`: შეფასებადი gold-ის მქონე case-ებიდან რამდენ პასუხს მივიღებდით არჩეული confidence ზღვრის ზემოთ; ბუნდოვანი gold მნიშვნელი არ არის.
- `Error capture`: 0.5-ზე გაჭრილი შეცდომების რა წილი მოხვდა ზღვრის ქვემოთ.
- `p50 / p95 / p99`: ერთი ტექსტის შესაბამისი კითხვები ერთად გაგზავნილი მოთხოვნის სრული დრო. ეს არ არის თითო კითხვის ან მხოლოდ inference-ის დრო.
- `Cost`: ითვლება რეალური token usage-ით მხოლოდ მაშინ, თუ შესაბამისი `*_USD_PER_M` ტარიფები მითითებულია. ტარიფი განზრახ არ არის ჩაშენებული.

შედეგები ლოკალურად ინახება `reports/runs/*.json` ფაილებში და Git-ის გარეთ რჩება. თითო ანგარიში შეიცავს dataset და protocol hash-ს, მოდელს, ზღვარს, პასუხებს, გამორიცხულ gold-ს, შეცდომებს, მოთხოვნის დროსა და token usage-ს. ამ ეტაპზე არ გვაქვს Editorial Quality, Evidence Routing, ორი ადამიანის შეთანხმების შეფასება ან 1/5/10/20 კითხვიანი latency პროფილი; ეს შემდეგი ფაზებია, როგორც [ბრიფში](docs/brief.md) წერია.

## შემოწმება

```powershell
python scripts/check_dataset.py
npm run lint
npm run build
```

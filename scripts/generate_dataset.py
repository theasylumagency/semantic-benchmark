"""Build the provisional Georgian claim dataset from reviewable text-level cases.

Run: python scripts/generate_dataset.py
Each text is assigned to exactly one split before contract rows are expanded.
The draft labels need independent human review before a final model claim.
"""

import json
from collections import Counter
from pathlib import Path

from adversarial_cases import documented_cases, expansion_cases

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "datasets" / "claim-semantics"

CONTRACTS = [
    "priceClaim", "discountClaim", "comparativeClaim", "superlativeClaim",
    "guaranteeClaim", "clinicalOutcomeClaim", "quantifiedClaim",
    "availabilityClaim", "factualAssertion", "proofRequirement",
]

# text, positive contracts, tags, difficulty, ambiguity, annotation rationale
CASES = [
    ("კონსულტაცია ღირს 99 ლარი.", "priceClaim quantifiedClaim factualAssertion proofRequirement", "price explicit", "obvious", "low", "A public numeric service price is asserted."),
    ("ფასების შესახებ მოგვწერეთ.", "", "price-word false-positive", "moderate", "low", "The word price appears, but no price or priced offer is stated."),
    ("პირველი ვიზიტი 120 ₾-დან იწყება.", "priceClaim quantifiedClaim factualAssertion proofRequirement", "price morphology", "moderate", "low", "A starting price is still a concrete price claim."),
    ("რა ღირს კონსულტაცია?", "", "price-word question", "moderate", "low", "A question about price is not the brand's price assertion."),
    ("დღეს ყველა მომსახურებაზე 20%-იანი ფასდაკლება მოქმედებს.", "discountClaim quantifiedClaim factualAssertion proofRequirement", "discount number", "obvious", "low", "A specific discount and its scope are asserted."),
    ("ფასდაკლების პირობები შეგიძლიათ იკითხოთ.", "", "discount-word false-positive", "moderate", "low", "This invites an inquiry without asserting a discount."),
    ("ძველი ფასი 200 ლარია, ახლა კი 150 ლარი.", "priceClaim discountClaim quantifiedClaim factualAssertion proofRequirement", "discount price multiple", "moderate", "low", "The old and current prices imply a reduction."),
    ("ფასები სეზონურად შეიძლება შეიცვალოს.", "", "price-word conditional", "nuanced", "medium", "Possibility of future price changes does not state a current concrete price."),
    ("ჩვენთან პროცედურა სხვა მეთოდებზე სწრაფია.", "comparativeClaim factualAssertion proofRequirement", "comparison", "obvious", "low", "The brand claims superiority in speed over other methods."),
    ("შედარების შემდეგ თავად აირჩიეთ მეთოდი.", "", "comparison-word false-positive", "moderate", "low", "The reader is invited to compare; the brand asserts no superiority."),
    ("ალტერნატივებთან შედარებით ნაკლები დისკომფორტია.", "comparativeClaim clinicalOutcomeClaim factualAssertion proofRequirement", "comparison clinical", "moderate", "low", "The text compares patient discomfort to alternatives."),
    ("რომელი მეთოდი იქნება უფრო სწრაფი, წინასწარ ვერ ვიტყვით.", "", "comparison negation", "nuanced", "medium", "It explicitly declines a speed comparison for a specific case."),
    ("ჩვენი კლინიკა საუკეთესოა ქალაქში.", "superlativeClaim factualAssertion proofRequirement", "superlative", "obvious", "low", "The brand asserts the highest rank in the city."),
    ("ხშირად გვეკითხებიან, ვართ თუ არა საუკეთესო.", "", "superlative question false-positive", "moderate", "low", "A quoted question is not an answer claiming to be best."),
    ("აირჩიეთ საუკეთესოდ მორგებული გეგმა.", "", "superlative morphology false-positive", "nuanced", "medium", "Best fit refers to the patient's selection, not the brand's rank."),
    ("პაციენტმა დაწერა: „საუკეთესო გამოცდილება იყო“.", "", "superlative testimonial", "nuanced", "medium", "The assessment is attributed to a patient, not asserted by the brand."),
    ("შედეგი გარანტირებულია.", "guaranteeClaim clinicalOutcomeClaim factualAssertion proofRequirement", "guarantee clinical", "obvious", "low", "A guaranteed result is promised."),
    ("ჩვენ არ ვიძლევით შედეგის გარანტიას.", "", "guarantee negation", "moderate", "low", "The text expressly denies a guarantee."),
    ("გარანტირებულად დაგიბრუნდებათ თავდაჯერება.", "guaranteeClaim factualAssertion proofRequirement", "guarantee morphology", "nuanced", "medium", "Guaranteed emotional outcome is still a promise."),
    ("გარანტიის პირობებზე ადმინისტრატორს ჰკითხეთ.", "", "guarantee-word false-positive", "nuanced", "medium", "Mentioning terms does not itself guarantee an outcome."),
    ("შედეგს პირველივე ვიზიტიდან იგრძნობთ.", "clinicalOutcomeClaim factualAssertion proofRequirement", "clinical implicit", "nuanced", "medium", "A patient outcome is predicted from the first visit."),
    ("კონსულტაციაზე შესაძლო შედეგებს განვიხილავთ.", "", "clinical-word false-positive", "moderate", "low", "Discussion of possible outcomes is not an outcome claim."),
    ("ტკივილი პროცედურის შემდეგ გაქრება.", "clinicalOutcomeClaim guaranteeClaim factualAssertion proofRequirement", "clinical promise", "obvious", "low", "It promises that pain will disappear."),
    ("ეს არ ნიშნავს, რომ პროცედურა უმტკივნეულოა.", "", "clinical negation", "moderate", "low", "The painless proposition is expressly negated."),
    ("მომხმარებელთა 87% კმაყოფილია შედეგით.", "quantifiedClaim factualAssertion proofRequirement", "quantified evidence", "obvious", "low", "A numeric satisfaction statistic is asserted."),
    ("რამდენი ადამიანი იყო კმაყოფილი?", "", "number question", "moderate", "low", "This is a question rather than a measured claim."),
    ("უკვე 12 წელია ამ მიმართულებით ვმუშაობთ.", "quantifiedClaim factualAssertion proofRequirement", "quantified experience", "obvious", "low", "A numeric duration of experience is asserted."),
    ("ნაბიჯები: 1. მოგვწერეთ; 2. შეარჩიეთ დრო.", "", "numbers false-positive", "moderate", "low", "List numbering is not a quantitative business claim."),
    ("ხვალისთვის სამი თავისუფალი ადგილი დარჩა.", "availabilityClaim quantifiedClaim factualAssertion proofRequirement", "availability scarcity", "obvious", "low", "A specific number of available places is stated."),
    ("თავისუფალი დროის გასაგებად მოგვწერეთ.", "", "availability false-positive", "moderate", "low", "The reader is asked to inquire; current availability is not asserted."),
    ("მიღება მთელი კვირის განმავლობაში შესაძლებელია.", "availabilityClaim factualAssertion proofRequirement", "availability", "moderate", "low", "Current week-long availability is asserted."),
    ("შეიძლება მომავალ კვირას ახალი დროები დაემატოს.", "", "availability conditional", "nuanced", "medium", "A possible future addition does not establish current availability."),
    ("კლინიკა მუშაობს ორშაბათიდან შაბათის ჩათვლით.", "factualAssertion proofRequirement", "business-fact", "obvious", "low", "Operating days are a verifiable business fact."),
    ("ჩვენი გუნდი დაგეხმარებათ არჩევანში.", "", "generic negative", "moderate", "medium", "This is a general offer of help without a concrete, testable fact."),
    ("ჩვენ ვიყენებთ სერტიფიცირებულ მოწყობილობას.", "factualAssertion proofRequirement", "equipment proof", "moderate", "low", "Equipment certification is a verifiable assertion."),
    ("გვკითხეთ, რომელი მოწყობილობა გამოიყენება.", "", "equipment question", "moderate", "low", "It asks the reader to inquire without asserting equipment facts."),
    ("99 ლარად მიიღებთ უმტკივნეულო კონსულტაციას საუკეთესო სპეციალისტთან.", "priceClaim clinicalOutcomeClaim superlativeClaim quantifiedClaim factualAssertion proofRequirement", "multiple price clinical superlative", "nuanced", "low", "One sentence makes price, painless-care, and best-specialist claims."),
    ("ჩვენ არ ვამბობთ, რომ საუკეთესო ვართ, თუმცა სხვებზე სწრაფად ვმუშაობთ.", "comparativeClaim factualAssertion proofRequirement", "negation comparison", "nuanced", "low", "The best claim is negated while the speed comparison is asserted."),
    ("თუ შედეგი არ მოგეწონებათ, თანხას დაგიბრუნებთ.", "guaranteeClaim factualAssertion proofRequirement", "conditional guarantee", "nuanced", "medium", "A conditional refund promise is made."),
    ("პაციენტს გარანტირებული შედეგი არ უნდა დავპირდეთ.", "", "guarantee instruction negation", "nuanced", "low", "An internal prohibition is not a promise to the reader."),
    ("მხოლოდ ამ კვირაში ვიზიტი 50 ლარი ღირს.", "priceClaim quantifiedClaim availabilityClaim factualAssertion proofRequirement", "price availability time", "moderate", "medium", "A price and limited time window are stated; availability is implied by the offer."),
    ("ზოგ პაციენტს გაუმჯობესება ერთი კვირის შემდეგ ეწყება.", "clinicalOutcomeClaim factualAssertion proofRequirement", "clinical hedged", "nuanced", "medium", "A qualified but factual patient outcome and timing are asserted."),
    ("ექიმი მოგიყვებათ, რამდენ ხანს შეიძლება გაგრძელდეს აღდგენა.", "", "clinical conditional", "moderate", "low", "It promises an explanation, not a clinical outcome."),
    ("ყველაზე დაბალ ფასს ჩვენთან იპოვით.", "comparativeClaim superlativeClaim factualAssertion proofRequirement", "price comparison superlative", "nuanced", "low", "The brand claims the lowest relative price, without stating a numeric amount."),
    ("შესაძლოა სხვაგანაც არსებობდეს მსგავსი სერვისი.", "", "comparison possibility", "nuanced", "medium", "Possibility of similar alternatives is not a superiority claim."),
    ("ახალი პაციენტებისთვის 15%-ით ნაკლებს გადაიხდით.", "discountClaim quantifiedClaim comparativeClaim factualAssertion proofRequirement", "discount comparison", "moderate", "medium", "A numeric reduction relative to the standard price is promised."),
    ("აქცია დასრულდა; ფასდაკლება აღარ მოქმედებს.", "", "discount negation", "moderate", "low", "The text states the promotion is no longer available."),
    ("ჩვენი მეთოდით აღდგენა ორჯერ სწრაფია.", "comparativeClaim quantifiedClaim clinicalOutcomeClaim factualAssertion proofRequirement", "comparison clinical quantitative", "nuanced", "low", "A twofold improvement in recovery speed is asserted."),
    ("კლიენტი ამბობს: „პირველივე დღეს უკეთ გავხდი“.", "", "clinical testimonial attribution", "nuanced", "medium", "The outcome is attributed to a customer rather than stated as the brand's general promise."),
    ("დღეს მიღებაზე ადგილი აღარ გვაქვს.", "availabilityClaim factualAssertion proofRequirement", "availability negative-state", "moderate", "low", "A concrete lack of availability today is asserted.", "priceClaim availabilityClaim factualAssertion proofRequirement quantifiedClaim"),
    ("გვაქვს ISO 9001 სერტიფიკატი.", "factualAssertion proofRequirement", "certification quantified-false-positive", "moderate", "low", "Certification is a factual claim; 9001 is an identifier, not a measured quantity."),
    ("კონსულტაციის საფასური ინდივიდუალურად განისაზღვრება.", "factualAssertion proofRequirement", "price-word policy", "nuanced", "medium", "A pricing policy is asserted but there is no concrete price."),
    ("ბაზრის ლიდერად გვიცნობენ.", "superlativeClaim factualAssertion proofRequirement", "superlative morphology", "nuanced", "medium", "The brand implies top market status via attribution."),
    ("მკურნალობა შეიძლება დაგეხმაროთ ტკივილის შემცირებაში.", "clinicalOutcomeClaim proofRequirement", "clinical cautious", "nuanced", "high", "A possible benefit is suggested without a guaranteed result."),
    ("ჩვენთან არჩევანი ყოველთვის თქვენზეა.", "", "generic statement", "moderate", "medium", "No contract-specific objective claim is made."),
    # Additional focused cases improve positive support per contract without padding every text with trivial negatives.
    ("საწყისი დიაგნოსტიკა 75 ლარია.", "priceClaim quantifiedClaim factualAssertion proofRequirement", "price explicit", "obvious", "low", "A numeric diagnostic price is public.", "priceClaim quantifiedClaim"),
    ("ონლაინ კონსულტაციის ფასი 45 ₾-ია.", "priceClaim quantifiedClaim factualAssertion proofRequirement", "price online", "obvious", "low", "A numeric online consultation price is stated.", "priceClaim comparativeClaim"),
    ("ერთი სეანსი 180 ლარი დაგიჯდებათ.", "priceClaim quantifiedClaim factualAssertion proofRequirement", "price morphology", "moderate", "low", "The amount is a direct service price.", "priceClaim quantifiedClaim"),
    ("გამოკვლევის პაკეტი 249 ლარადაა ხელმისაწვდომი.", "priceClaim quantifiedClaim availabilityClaim factualAssertion proofRequirement", "price availability", "moderate", "medium", "A package price and present offer are asserted.", "priceClaim availabilityClaim"),
    ("მეორე ვიზიტის საფასური 60 ლარია.", "priceClaim quantifiedClaim factualAssertion proofRequirement", "price visit", "obvious", "low", "A second-visit price is stated.", "priceClaim discountClaim"),
    ("ბავშვის კონსულტაცია 80 ლარიდან იწყება.", "priceClaim quantifiedClaim factualAssertion proofRequirement", "price starting", "moderate", "low", "A starting price is a concrete price.", "priceClaim comparativeClaim"),
    ("ამ თვეში პირველ ვიზიტზე 10%-იანი ფასდაკლებაა.", "discountClaim quantifiedClaim factualAssertion proofRequirement", "discount time", "obvious", "low", "A time-limited percentage discount is stated.", "discountClaim priceClaim"),
    ("ორი სეანსის შეძენისას მესამეზე ნახევარ ფასს გადაიხდით.", "discountClaim factualAssertion proofRequirement", "discount conditional", "moderate", "low", "A conditional half-price offer is made.", "discountClaim priceClaim"),
    ("სტუდენტებისთვის მომსახურება 15%-ით იაფია.", "discountClaim comparativeClaim quantifiedClaim factualAssertion proofRequirement", "discount audience", "moderate", "medium", "A student-specific percentage reduction is asserted.", "discountClaim quantifiedClaim"),
    ("დღეს ჩაწერილებს 30 ლარს ვაკლებთ.", "discountClaim quantifiedClaim factualAssertion proofRequirement", "discount amount", "moderate", "low", "The current offer subtracts a numeric amount.", "discountClaim priceClaim"),
    ("კოდით SAVE20 ფასს 20%-ით ვამცირებთ.", "discountClaim quantifiedClaim factualAssertion proofRequirement", "discount code", "moderate", "low", "A code activates a stated reduction.", "discountClaim quantifiedClaim"),
    ("ოჯახური პაკეტის შეძენისას ფასს 25%-ით ვამცირებთ.", "discountClaim quantifiedClaim factualAssertion proofRequirement", "discount conditional", "moderate", "low", "A conditional percentage discount is stated.", "discountClaim priceClaim"),
    ("პირველი კონსულტაცია ახლა 90-ის ნაცვლად 70 ლარია.", "priceClaim discountClaim comparativeClaim quantifiedClaim factualAssertion proofRequirement", "discount price multiple", "nuanced", "low", "Old and new numeric prices establish a reduction.", "discountClaim priceClaim"),
    ("ახალი პაციენტისთვის პაკეტი 40 ლარით იაფია.", "discountClaim comparativeClaim quantifiedClaim factualAssertion proofRequirement", "discount audience", "moderate", "medium", "A numeric reduced price for a patient group is asserted.", "discountClaim quantifiedClaim"),
    ("ჩვენი მეთოდი ტრადიციულ გზაზე ნაკლებ დროს მოითხოვს.", "comparativeClaim factualAssertion proofRequirement", "comparison speed", "moderate", "low", "The method is compared with a traditional one.", "comparativeClaim superlativeClaim"),
    ("სხვა პროგრამებთან შედარებით ჩვენი გეგმა მოქნილია.", "comparativeClaim factualAssertion proofRequirement", "comparison flexibility", "nuanced", "medium", "A relative flexibility claim is asserted.", "comparativeClaim guaranteeClaim"),
    ("წინა მიდგომაზე სწრაფად ვიღებთ შედეგს.", "comparativeClaim clinicalOutcomeClaim factualAssertion proofRequirement", "comparison clinical", "nuanced", "medium", "Speed of outcome is compared with a prior method.", "comparativeClaim clinicalOutcomeClaim"),
    ("ჩვენს მომსახურებაში ლოდინი კონკურენტებთან შედარებით მოკლეა.", "comparativeClaim factualAssertion proofRequirement", "comparison competitor", "moderate", "low", "Wait time is compared with competitors.", "comparativeClaim quantifiedClaim"),
    ("სტანდარტულ სეანსზე უფრო ხანმოკლეა ახალი პროცედურა.", "comparativeClaim factualAssertion proofRequirement", "comparison procedure", "moderate", "low", "Procedure duration is compared with a standard session.", "comparativeClaim superlativeClaim"),
    ("რეგიონში ნომერ პირველი ცენტრი ვართ.", "superlativeClaim factualAssertion proofRequirement", "superlative ranking", "moderate", "low", "The brand claims a top regional rank.", "superlativeClaim comparativeClaim"),
    ("ქვეყნის წამყვანი კლინიკა ვართ.", "superlativeClaim factualAssertion proofRequirement", "superlative morphology", "moderate", "low", "The brand claims leading national status.", "superlativeClaim guaranteeClaim"),
    ("ჩვენი გუნდი ბაზარზე საუკეთესოა.", "superlativeClaim factualAssertion proofRequirement", "superlative market", "obvious", "low", "The team claims to be best in market.", "superlativeClaim quantifiedClaim"),
    ("ქალაქის ყველაზე მოთხოვნადი სპეციალისტები ჩვენთან არიან.", "superlativeClaim factualAssertion proofRequirement", "superlative demand", "nuanced", "medium", "A top-demand status is claimed for specialists.", "superlativeClaim availabilityClaim"),
    ("საუკეთესო შედეგს ჩვენთან მიიღებთ.", "superlativeClaim clinicalOutcomeClaim factualAssertion proofRequirement", "superlative clinical", "nuanced", "medium", "The brand promises the best result.", "superlativeClaim quantifiedClaim"),
    ("არცერთი სხვა ცენტრი ჩვენზე უკეთესი არ არის.", "superlativeClaim comparativeClaim factualAssertion proofRequirement", "superlative comparison negation", "nuanced", "medium", "Negated competitor superiority implies a top-rank claim.", "superlativeClaim comparativeClaim"),
    ("პირველი კონსულტაციის შემდეგ თანხის დაბრუნებას გარანტიას გაძლევთ.", "guaranteeClaim factualAssertion proofRequirement", "guarantee refund", "nuanced", "medium", "A refund guarantee is asserted.", "guaranteeClaim discountClaim"),
    ("თუ ვერ დაგეხმარებით, თანხას სრულად აგინაზღაურებთ.", "guaranteeClaim factualAssertion proofRequirement", "guarantee conditional", "nuanced", "medium", "A conditional compensation promise is made.", "guaranteeClaim priceClaim"),
    ("თქვენს კითხვაზე პასუხს 24 საათში აუცილებლად მიიღებთ.", "guaranteeClaim quantifiedClaim factualAssertion proofRequirement", "guarantee service", "moderate", "low", "A definite response-time promise is made.", "guaranteeClaim quantifiedClaim"),
    ("შედეგი ნებისმიერ შემთხვევაში დადგება.", "guaranteeClaim clinicalOutcomeClaim factualAssertion proofRequirement", "guarantee clinical", "obvious", "low", "The clinical outcome is promised unconditionally.", "guaranteeClaim clinicalOutcomeClaim"),
    ("ტკივილის სრულ გაქრობას გპირდებით.", "guaranteeClaim clinicalOutcomeClaim factualAssertion proofRequirement", "guarantee clinical", "obvious", "low", "Complete pain relief is promised.", "guaranteeClaim clinicalOutcomeClaim"),
    ("თითოეულ შეკვეთას ვადაში ჩაბარებას ვპირდებით.", "guaranteeClaim factualAssertion proofRequirement", "guarantee service", "moderate", "medium", "A delivery-time promise is made.", "guaranteeClaim clinicalOutcomeClaim"),
    ("თერაპია ზოგ პაციენტში ამცირებს შეშუპებას.", "clinicalOutcomeClaim factualAssertion proofRequirement", "clinical hedged", "nuanced", "medium", "A qualified patient outcome is asserted.", "clinicalOutcomeClaim guaranteeClaim"),
    ("პროცედურის შემდეგ მოძრაობის დიაპაზონი უმჯობესდება.", "clinicalOutcomeClaim factualAssertion proofRequirement", "clinical mobility", "moderate", "medium", "Improved mobility is asserted as an outcome.", "clinicalOutcomeClaim comparativeClaim"),
    ("მკურნალობის კურსი ქრონიკული ტკივილის სიმძიმეს ამცირებს.", "clinicalOutcomeClaim factualAssertion proofRequirement", "clinical pain", "moderate", "low", "Pain reduction is asserted as treatment outcome.", "clinicalOutcomeClaim discountClaim"),
    ("ხვალ დილის მიღებაზე ორი ადგილი თავისუფალია.", "availabilityClaim quantifiedClaim factualAssertion proofRequirement", "availability scarcity", "obvious", "low", "Two places are stated as currently bookable tomorrow.", "availabilityClaim quantifiedClaim"),
    ("ამ კვირაში ყველა დრო დაჯავშნილია.", "availabilityClaim factualAssertion proofRequirement", "availability full", "moderate", "low", "A current lack of slots is asserted.", "availabilityClaim quantifiedClaim"),
    ("შაბათს ახალ პაციენტებს ვიღებთ.", "availabilityClaim factualAssertion proofRequirement", "availability schedule", "moderate", "medium", "Saturday intake is stated as available.", "availabilityClaim priceClaim"),
    ("ონლაინ კონსულტაციისთვის საღამოს სლოტები დაგვრჩა.", "availabilityClaim factualAssertion proofRequirement", "availability online", "moderate", "low", "Evening slots are asserted available.", "availabilityClaim guaranteeClaim"),
    ("ამ თვის ბოლო ვიზიტი პარასკევს შეგიძლიათ დაჯავშნოთ.", "availabilityClaim factualAssertion proofRequirement", "availability scarcity", "nuanced", "medium", "A final bookable slot is advertised.", "availabilityClaim quantifiedClaim"),
    ("თბილისის ფილიალში დღეს თავისუფალი დრო გვაქვს.", "availabilityClaim factualAssertion proofRequirement", "availability branch", "moderate", "low", "Current availability is stated for one branch.", "availabilityClaim priceClaim"),
]

# Pre-run ontology alignment with docs/factualAssertion.md. These are semantic
# corrections to the seed annotations, not edits made in response to model output.
FACTUAL_REVISIONS = {
    13: (False, "'Best clinic' is evaluative without a defined measurable basis."),
    17: (False, "A guaranteed result is an outcome promise, not a descriptive fact."),
    19: (False, "Guaranteed confidence is a future personal outcome promise."),
    20: (True, "The brand's current no-guarantee policy is a verifiable negative fact."),
    21: (False, "A predicted first-visit patient outcome is not a descriptive fact."),
    23: (False, "Complete pain disappearance is a future outcome promise."),
    39: (False, "A conditional refund guarantee is a promise, not a descriptive fact."),
    44: (False, "'Lowest price' has no stated comparison domain or concrete measure here."),
    47: (True, "The ended promotion is a verifiable current business state."),
    53: (False, "Being known as a market leader is evaluative without a defined metric."),
    71: (False, "Relative flexibility is evaluative without a specified measure."),
    75: (False, "'Number one' has no stated ranking method or measurable basis."),
    76: (False, "'Leading clinic' is prestige language without a defined measure."),
    77: (False, "'Best team' is evaluative without a defined measure."),
    78: (False, "'Most in demand' has no stated demand measure or comparison period."),
    79: (False, "'Best result' is an evaluative future patient outcome promise."),
    80: (False, "The negated competitor superiority implies an evaluative top-rank claim."),
    81: (False, "A refund guarantee is a future commitment, not a descriptive fact."),
    82: (False, "A conditional compensation promise is not a descriptive fact."),
    83: (False, "A guaranteed response deadline is a promise, not an observed fact."),
    84: (False, "An unconditional clinical result is an outcome guarantee."),
    85: (False, "Promised complete pain relief is not a descriptive fact."),
    86: (False, "A delivery-time promise is not a descriptive fact."),
}


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    by_split = {"development": [], "validation": []}
    for index, case in enumerate(CASES):
        text, positive_raw, tags_raw, difficulty, ambiguity, note, *selection = case
        positives = set(positive_raw.split())
        factual_revision = FACTUAL_REVISIONS.get(index + 1)
        if factual_revision:
            if factual_revision[0]:
                positives.add("factualAssertion")
            else:
                positives.discard("factualAssertion")
        assert positives <= set(CONTRACTS) and len(positives) <= 6
        # Put all positive labels in the row set, then rotate negatives to balance contracts.
        tags = set(tags_raw.split())
        focus = set()
        for tag, contract in (
            ("price", "priceClaim"), ("discount", "discountClaim"),
            ("comparison", "comparativeClaim"), ("superlative", "superlativeClaim"),
            ("guarantee", "guaranteeClaim"), ("clinical", "clinicalOutcomeClaim"),
            ("number", "quantifiedClaim"), ("quantified", "quantifiedClaim"),
            ("availability", "availabilityClaim"), ("equipment", "factualAssertion"),
            ("certification", "factualAssertion"),
        ):
            if any(value.startswith(tag) for value in tags):
                focus.add(contract)
        if factual_revision:
            focus.add("factualAssertion")
        if selection:
            selected = selection[0].split()
            assert len(selected) == len(set(selected)) and set(selected) <= set(CONTRACTS)
        else:
            selected = [contract for contract in CONTRACTS if contract in positives or contract in focus]
            target_count = max(4, len(selected))
            assert target_count <= 8, (index, selected)
            for offset in range(len(CONTRACTS)):
                if len(selected) == target_count:
                    break
                contract = CONTRACTS[(index * 3 + offset) % len(CONTRACTS)]
                if contract not in selected:
                    selected.append(contract)
        # Keep the previously relocated seed group in development.
        split = "development" if index + 1 == 54 else "validation" if index % 5 in (0, 3) else "development"
        for contract in CONTRACTS:
            if contract not in selected:
                continue
            positive = contract in positives
            rationale = factual_revision[1] if contract == "factualAssertion" and factual_revision else f"{note} {'This contract applies.' if positive else 'This contract does not apply.'}"
            if index + 1 == 50 and contract == "quantifiedClaim":
                rationale = "No number or quantity is explicitly stated; lack of availability does not create an asserted numeric zero."
            if index + 1 == 54 and contract == "clinicalOutcomeClaim":
                rationale = "A qualified pain-reduction statement remains a clinical outcome claim: hedging changes certainty, not claim type."
            if index + 1 == 54 and contract == "proofRequirement":
                rationale = "A public claim that treatment may reduce pain still needs evidentiary support."
            by_split[split].append({
                "id": f"ka-claim-{index + 1:03d}-{contract}",
                "groupId": f"ka-text-{index + 1:03d}",
                "language": "ka", "text": text, "contract": contract,
                "expected": positive, "difficulty": difficulty,
                "tags": tags_raw.split(), "ambiguity": ambiguity,
                "humanRationale": rationale,
                "split": split, "goldStatus": "draft",
                "source": "seed",
            })

    seed_group_by_text = {item["text"]: item["groupId"] for item in by_split["development"]}
    documented = documented_cases()
    documented_pairs = {(item["text"], item["contract"]) for item in documented}
    by_split["development"] = [
        item for item in by_split["development"]
        if (item["text"], item["contract"]) not in documented_pairs
    ]
    for item in documented:
        if item["text"] in seed_group_by_text:
            item["groupId"] = seed_group_by_text[item["text"]]
    by_split["development"].extend(documented)
    by_split["development"].extend(expansion_cases())

    for split, items in by_split.items():
        with (OUT / f"{split}.jsonl").open("w", encoding="utf-8", newline="\n") as file:
            for item in items:
                file.write(json.dumps(item, ensure_ascii=False) + "\n")
    counts = Counter(item["contract"] for items in by_split.values() for item in items)
    print(f"{len({item['groupId'] for items in by_split.values() for item in items})} unique texts; " + ", ".join(f"{key}: {len(value)}" for key, value in by_split.items()))
    print("Contract counts:", dict(counts))


if __name__ == "__main__":
    main()

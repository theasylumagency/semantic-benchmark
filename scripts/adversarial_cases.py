"""Reviewable development cases from docs/Cases.md plus the matrix expansion."""

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CASES_DOC = ROOT / "docs" / "Cases.md"


def documented_cases():
    source = CASES_DOC.read_text(encoding="utf-8")
    headings = list(re.finditer(r"^### (ka-adv-(\d{3})-([A-Za-z]+))\s*$", source, re.M))
    assert len(headings) == 48, "Batch 01 must contain exactly 48 documented evaluations"
    first_by_text = {}
    rows = []
    for index, heading in enumerate(headings, 1):
        block = source[heading.end():headings[index].start() if index < len(headings) else source.index("# Batch 01 — coverage summary")]
        case_id, sequence, suffix = heading.groups()
        assert int(sequence) == index

        def field(name):
            match = re.search(rf"^\*\*{name}:\*\*\s*(.+?)\s*$", block, re.M)
            assert match, (case_id, name)
            return match.group(1).strip()

        text_match = re.search(r"^> (.+)$", block, re.M)
        assert text_match, case_id
        text = text_match.group(1).strip()
        contract = field("Contract").strip("` ")
        assert contract == suffix, case_id
        gold = field("Gold").strip("` ")
        assert gold in ("YES", "NO", "UNCERTAIN")
        assert text not in first_by_text or first_by_text[text] < index
        first_by_text.setdefault(text, index)
        tags = re.findall(r"`([^`]+)`", field("Tags"))
        rows.append({
            "id": case_id,
            "groupId": f"ka-adv-text-{first_by_text[text]:03d}",
            "language": "ka", "text": text, "contract": contract,
            "expected": {"YES": True, "NO": False, "UNCERTAIN": None}[gold],
            "difficulty": field("Difficulty"), "ambiguity": field("Ambiguity"),
            "tags": ["adversarial-batch-01", *tags],
            "humanRationale": field("Rationale"),
            "split": "development", "goldStatus": "ontology-review" if gold == "UNCERTAIN" else "draft",
            "source": "adversarial-batch-01",
        })
    assert len({(row["groupId"], row["contract"]) for row in rows}) == 48
    return rows


# Each tuple: text, tags, difficulty, ambiguity, contract -> (gold, contract-specific rationale).
# These 52 cases add availability, implicit claims, comparison, morphology, time and scope coverage.
EXPANSION = [
    ("ამ კვირაში ჩაწერა შესაძლებელია.", "availability current-state", "obvious", "low", {
        "availabilityClaim": (True, "ამ კვირაში ჩაწერის შესაძლებლობა პირდაპირ არის გამოცხადებული."),
        "factualAssertion": (True, "მიმდინარე ჩაწერის მდგომარეობა შემოწმებადი ბიზნეს-ფაქტია."),
        "quantifiedClaim": (False, "კვირის ხსენება კონკრეტულ რაოდენობას არ ამტკიცებს."),
        "guaranteeClaim": (False, "ჩაწერის შესაძლებლობა შედეგის გარანტია არ არის."),
    }),
    ("ადგილები აღარ დარჩა.", "availability negation current-state", "moderate", "low", {
        "availabilityClaim": (True, "თავისუფალი ადგილების არარსებობა ხელმისაწვდომობის მდგომარეობაა."),
        "factualAssertion": (True, "უარყოფითად ფორმულირებული მიმდინარე მდგომარეობა შემოწმებადია."),
        "quantifiedClaim": (False, "თავისუფალი ადგილების არარსებობა ნაგულისხმევ ნულს გულისხმობს, მაგრამ რიცხვი პირდაპირ არ არის გამოცხადებული."),
        "guaranteeClaim": (False, "ადგილის არარსებობა სამომავლო შედეგის დაპირება არ არის."),
    }),
    ("ამ მომსახურებაზე დროებით ჩაწერას ვერ ვიღებთ.", "availability negation service", "nuanced", "low", {
        "availabilityClaim": (True, "ტექსტი კონკრეტულ მომსახურებაზე მიღების დროებით შეჩერებას აცხადებს."),
        "factualAssertion": (True, "მიმდინარე მომსახურების მდგომარეობა მტკიცებულებით შემოწმებადია."),
        "priceClaim": (False, "ფასი საერთოდ არ არის გამოცხადებული."),
        "guaranteeClaim": (False, "მიღების შეჩერება შედეგის გარანტია არ არის."),
    }),
    ("აღარ მოგიწევთ ტკივილთან შეგუება.", "implicit-guarantee clinical outcome", "nuanced", "medium", {
        "clinicalOutcomeClaim": (True, "ტექსტი პაციენტისთვის ტკივილის დასრულებას გულისხმობს."),
        "guaranteeClaim": (True, "შედეგი უპირობოდ არის წარმოდგენილი, მიუხედავად იმისა, რომ სიტყვა გარანტია არ ჩანს."),
        "factualAssertion": (False, "ეს მომავალი ინდივიდუალური შედეგის დაპირებაა და არა აღწერითი ფაქტი."),
        "proofRequirement": (True, "ტკივილის დასრულების საჯარო დაპირებას დამადასტურებელი საფუძველი სჭირდება."),
    }),
    ("პირველი ვიზიტიდანვე იგრძნობთ განსხვავებას.", "implicit-guarantee clinical temporal", "nuanced", "medium", {
        "clinicalOutcomeClaim": (False, "დაუზუსტებელი „განსხვავება“ არ ასახელებს კლინიკურ endpoint-ს, სიმპტომს, ფუნქციურ ან აღდგენის ცვლილებას."),
        "guaranteeClaim": (False, "დაუზუსტებელი „განსხვავება“ არ არის მკაფიო შედეგის გარანტია."),
        "factualAssertion": (False, "მომავალი პირადი შედეგი ამ contract-ის აღწერითი ფაქტი არ არის."),
        "proofRequirement": (True, "დროში კონკრეტულად შეპირებულ შედეგს მტკიცებულება სჭირდება."),
    }),
    ("ჩვენი აპარატი წინა მოდელზე 30%-ით სწრაფია.", "comparison measurable morphology", "moderate", "low", {
        "comparativeClaim": (True, "აპარატის სიჩქარე წინა მოდელს პირდაპირ ედარება."),
        "quantifiedClaim": (True, "სიჩქარის სხვაობა 30%-ით არის გაზომილი."),
        "factualAssertion": (True, "განსაზღვრული საზომისა და შედარების ობიექტის მქონე მტკიცება შემოწმებადია."),
        "proofRequirement": (True, "რიცხვით შედარებას გაზომვის წყარო სჭირდება."),
    }),
    ("დროის დაზოგვისთვის ჩვენი გზა უკეთესი არჩევანია.", "comparison evaluative implicit-reference", "nuanced", "medium", {
        "comparativeClaim": (True, "უკეთესი არჩევანის თქმით სხვა გზებთან შედარება კეთდება."),
        "factualAssertion": (False, "უკეთესი არჩევანი განსაზღვრული საზომის გარეშე შეფასებაა."),
        "superlativeClaim": (False, "უკეთესი შედარებითი ხარისხია და არა უმაღლესი რანგი."),
        "proofRequirement": (True, "დროის დაზოგვაზე დაფუძნებულ უპირატესობის საჯარო განცხადებას მხარდაჭერა სჭირდება."),
    }),
    ("ჩვენი მეთოდი სხვებზე სწრაფი არ არის.", "comparison negation duration", "nuanced", "low", {
        "comparativeClaim": (False, "სიჩქარის უპირატესობა პირდაპირ არის უარყოფილი."),
        "factualAssertion": (True, "უარყოფითად გამოთქმული სიჩქარის შედარება პრინციპულად გაზომვადია."),
        "guaranteeClaim": (False, "შედეგის ან ვადის გარანტია არ არის მოცემული."),
        "proofRequirement": (True, "საკუთარი მეთოდის შედარებით სიჩქარეზე ფაქტობრივ განცხადებას გაზომვა სჭირდება."),
    }),
    ("გასულ თვეში 20%-იანი ფასდაკლება მოქმედებდა.", "discount historical temporal", "moderate", "low", {
        "discountClaim": (False, "ისტორიული ფასდაკლება მოქმედ აქციად არ ითვლება."),
        "factualAssertion": (True, "წარსული შეთავაზების არსებობა შემოწმებადი ფაქტია."),
        "quantifiedClaim": (True, "ისტორიული შეთავაზება კონკრეტულ 20%-ს აცხადებს."),
        "proofRequirement": (True, "წარსულ აქციაზე საჯარო ფაქტობრივ განცხადებას დამადასტურებელი წყარო სჭირდება."),
    }),
    ("ოქტომბრიდან კონსულტაცია 150 ლარი ეღირება.", "price future temporal", "moderate", "low", {
        "priceClaim": (True, "კონკრეტული 150-ლარიანი მომავალი ტარიფი priceClaim-ია; მომავალი დრო ცვლის კონტექსტს და არა claim-ის ტიპს."),
        "factualAssertion": (True, "მომავალი ტარიფის კონკრეტული გეგმა შემოწმებადი ბიზნეს-განცხადებაა."),
        "quantifiedClaim": (True, "ტექსტი კონკრეტულ 150 ლარს აცხადებს."),
        "proofRequirement": (True, "მომავალი ფასის საჯარო განცხადება დადასტურებულ ტარიფს უნდა ეყრდნობოდეს."),
    }),
    ("ჩვენს მიდგომას საუკეთესოდ მივიჩნევთ.", "superlative morphology evaluative", "nuanced", "low", {
        "superlativeClaim": (True, "ბრენდი საკუთარ მიდგომას საუკეთესოს უწოდებს ბრუნვის მიუხედავად."),
        "factualAssertion": (False, "საკუთარი მიდგომის შეფასებას განსაზღვრული საზომი არ აქვს."),
        "comparativeClaim": (False, "სხვა კონკრეტულ მეთოდთან მიმართება არ არის გამოცხადებული."),
        "proofRequirement": (True, "საჯაროდ გამოთქმულ უმაღლესი ხარისხის განცხადებას დასაბუთება სჭირდება."),
    }),
    ("ზოგიერთ პაციენტში პროცედურის შემდეგ შეშუპება მცირდება.", "clinical quantifier scope", "nuanced", "low", {
        "clinicalOutcomeClaim": (True, "შეშუპების შემცირება პაციენტის კლინიკურ შედეგს აღწერს."),
        "factualAssertion": (True, "ზოგიერთ პაციენტში შედეგის არსებობა ემპირიულად შემოწმებადია."),
        "guaranteeClaim": (False, "ზოგიერთის შემზღუდველი ფორმა უნივერსალურ შედეგს არ ჰპირდება."),
        "proofRequirement": (True, "კლინიკური შედეგის საჯარო განზოგადებას კვლევითი მხარდაჭერა სჭირდება."),
    }),
    ("პროცედურა ყოველთვის უმტკივნეულოა.", "clinical quantifier absolute", "obvious", "low", {
        "clinicalOutcomeClaim": (True, "პროცედურის ტკივილის არარსებობა კლინიკური გამოცდილების მტკიცებაა."),
        "guaranteeClaim": (True, "ყოველთვის უნივერსალურ, გამონაკლისის გარეშე შედეგს ჰპირდება."),
        "factualAssertion": (False, "აბსოლუტური ინდივიდუალური გამოცდილების დაპირება აღწერითი ფაქტის contract-ში არ შედის."),
        "proofRequirement": (True, "ყველა პაციენტზე აბსოლუტურ კლინიკურ განცხადებას მტკიცებულება სჭირდება."),
    }),
]


def expansion_cases():
    rows = []
    for sequence, (text, tags, difficulty, ambiguity, labels) in enumerate(EXPANSION, 1):
        for contract, (expected, rationale) in labels.items():
            rows.append({
                "id": f"ka-exp-{sequence:03d}-{contract}",
                "groupId": f"ka-exp-text-{sequence:03d}",
                "language": "ka", "text": text, "contract": contract,
                "expected": expected, "difficulty": difficulty,
                "ambiguity": "high" if expected is None else ambiguity,
                "tags": ["adversarial-expansion", *tags.split()],
                "humanRationale": rationale,
                "split": "development", "goldStatus": "ontology-review" if expected is None else "draft",
                "source": "adversarial-expansion",
            })
    assert len(rows) == 52
    return rows

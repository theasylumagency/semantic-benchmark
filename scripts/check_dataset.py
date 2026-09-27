"""Check dataset integrity without contacting any model provider."""

import json
import hashlib
from collections import Counter, defaultdict
from pathlib import Path

from adversarial_cases import documented_cases

ROOT = Path(__file__).resolve().parents[1] / "datasets" / "claim-semantics"
files = {split: ROOT / f"{split}.jsonl" for split in ("development", "validation")}
items = []
groups = defaultdict(set)
text_splits = defaultdict(set)
for split, file in files.items():
    for line in file.read_text(encoding="utf-8").splitlines():
        item = json.loads(line)
        assert item["split"] == split
        assert item["goldStatus"] in ("draft", "reviewed", "ontology-review")
        assert isinstance(item["expected"], bool) or item["expected"] is None
        assert (item["expected"] is None) == (item["goldStatus"] == "ontology-review")
        assert item["text"] and item["humanRationale"]
        assert item["source"] in ("seed", "adversarial-batch-01", "adversarial-expansion")
        assert item["source"] == "seed" or split == "development"
        groups[item["groupId"]].add(split)
        text_splits[item["text"]].add(split)
        items.append(item)

assert len(items) == len({item["id"] for item in items})
assert len(items) == len({(item["groupId"], item["contract"]) for item in items})
assert all(len(splits) == 1 for splits in groups.values())
assert all(len(splits) == 1 for splits in text_splits.values())
assert len(items) == 403
assert len(groups) == len(text_splits) == 139
assert Counter(item["source"] for item in items) == {"seed": 303, "adversarial-batch-01": 48, "adversarial-expansion": 52}
documented = {item["id"]: item for item in documented_cases()}
actual_documented = {item["id"]: item for item in items if item["source"] == "adversarial-batch-01"}
assert set(documented) == set(actual_documented)
assert all({key: value for key, value in actual_documented[case_id].items() if key != "groupId"} ==
           {key: value for key, value in case.items() if key != "groupId"}
           for case_id, case in documented.items())
assert sum(item["expected"] is None for item in items) == 6
assert all(item["split"] == "development" for item in items if item["expected"] is None)
counts = Counter(item["contract"] for item in items)
assert len(counts) == 10 and min(counts.values()) >= 15
for split in files:
    positive_counts = Counter(item["contract"] for item in items if item["split"] == split and item["expected"])
    assert len(positive_counts) == 10 and min(positive_counts.values()) >= 3, (split, positive_counts)
lookup = {(item["groupId"], item["contract"]): item["expected"] for item in items}
assert lookup["ka-text-002", "priceClaim"] is False
assert lookup["ka-text-003", "priceClaim"] is True
assert lookup["ka-text-003", "quantifiedClaim"] is True
assert lookup["ka-text-018", "guaranteeClaim"] is False
assert lookup["ka-text-013", "factualAssertion"] is False
assert lookup["ka-text-017", "factualAssertion"] is False
assert lookup["ka-text-020", "factualAssertion"] is True
assert lookup["ka-text-047", "factualAssertion"] is True
assert lookup["ka-text-054", "clinicalOutcomeClaim"] is None
assert lookup["ka-exp-text-002", "quantifiedClaim"] is None
assert lookup["ka-exp-text-005", "clinicalOutcomeClaim"] is None
assert lookup["ka-exp-text-005", "guaranteeClaim"] is None
assert lookup["ka-exp-text-010", "priceClaim"] is None
assert lookup["ka-adv-text-003", "discountClaim"] is False
assert lookup["ka-adv-text-003", "factualAssertion"] is True
reviews = json.loads((ROOT / "reviews.json").read_text(encoding="utf-8"))
assert isinstance(reviews, dict)
by_id = {item["id"]: item for item in items}
assert all(case_id in by_id and by_id[case_id]["goldStatus"] == "draft" and
           isinstance(entry, dict) and isinstance(entry.get("reviewedAt"), str) and
           entry.get("digest") == hashlib.sha256(json.dumps(by_id[case_id], ensure_ascii=False,
                                                   separators=(",", ":")).encode("utf-8")).hexdigest()
           for case_id, entry in reviews.items())
print(f"Dataset OK: {len(items)} contract cases, {len(groups)} text groups, {len(counts)} contracts; "
      f"development={sum(item['split'] == 'development' for item in items)}, "
      f"validation={sum(item['split'] == 'validation' for item in items)}, "
      f"ontology-review={sum(item['goldStatus'] == 'ontology-review' for item in items)}, "
      f"reviewed={len(reviews)}, draft={sum(item['goldStatus'] == 'draft' for item in items) - len(reviews)}")

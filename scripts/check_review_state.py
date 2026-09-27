"""Exercise blind review transitions against a local built server, with no provider calls."""

import json
import os
import subprocess
import time
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
LEDGER = ROOT / "datasets" / "claim-semantics" / "reviews.json"
URL = "http://127.0.0.1:3101/api/gold-review"
TOKEN = "local-review-state-test"


def request(method="GET", body=None):
    headers = {"Authorization": f"Bearer {TOKEN}"}
    data = None
    if body is not None:
        data = json.dumps(body).encode("utf-8")
        headers["Content-Type"] = "application/json"
    with urllib.request.urlopen(urllib.request.Request(URL, data=data, headers=headers, method=method), timeout=10) as response:
        return json.load(response)


def update(item, pass_name, status, **extra):
    return request("PATCH", {"itemId": item["id"], "pass": pass_name, "status": status, **extra})


def rejects(item, pass_name, status, **extra):
    try:
        update(item, pass_name, status, **extra)
    except urllib.error.HTTPError as error:
        assert error.code == 400
        return
    raise AssertionError("Unresolved review was incorrectly overwritten")


def case(snapshot, case_id):
    return next(item for item in snapshot["items"] if item["id"] == case_id)


original = LEDGER.read_bytes()
env = os.environ.copy()
env["BENCHMARK_ACCESS_TOKEN"] = TOKEN
server = subprocess.Popen(["node", "node_modules/next/dist/bin/next", "start", "-p", "3101"], cwd=ROOT,
                          env=env, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
try:
    for _ in range(60):
        try:
            initial = request()
            break
        except (urllib.error.URLError, TimeoutError):
            if server.poll() is not None:
                raise RuntimeError("Review test server exited before becoming ready")
            time.sleep(0.5)
    else:
        raise RuntimeError("Review test server did not become ready")

    assert not {"runs", "predictions", "providers", "metrics", "confidence"}.intersection(initial)
    assert initial["progress"]["all"]["total"] == 404
    with urllib.request.urlopen("http://127.0.0.1:3101/gold-review", timeout=10) as response:
        page = response.read().decode("utf-8")
    assert "Blind Gold Review" in page
    assert all(term not in page for term in ('"predictions":', '"runs":', '"metrics":', '"probabilityYes":'))
    easy = next(item for item in initial["items"] if item["goldStatus"] == "draft" and
                item["difficulty"] != "nuanced" and item["ambiguity"] == "low")
    easy_ontology = next(item for item in initial["items"] if item["id"] != easy["id"] and
                         item["goldStatus"] == "draft" and item["difficulty"] != "nuanced" and
                         item["ambiguity"] == "low" and item["expected"] is not None)
    difficult_items = [item for item in initial["items"] if item["goldStatus"] == "draft" and
                       (item["difficulty"] == "nuanced" or item["ambiguity"] != "low")][:3]
    assert len(difficult_items) == 3
    version = initial["datasetVersion"]
    protocol = initial["protocolVersion"]

    state = update(easy, "first", "reviewed")
    assert case(state, easy["id"])["goldStatus"] == "reviewed"
    assert state["datasetVersion"] != version
    assert state["protocolVersion"] != protocol
    state = update(easy, "first", "draft")
    assert state["datasetVersion"] == version
    assert state["protocolVersion"] == protocol
    state = update(easy, "first", "needs-correction", proposedGold=not easy["expected"], reason="Test correction")
    assert case(state, easy["id"])["expected"] == easy["expected"]
    assert case(state, easy["id"])["goldStatus"] == "needs-correction"
    assert state["records"][easy["id"]]["first"]["proposedGold"] != easy["expected"]
    rejects(easy, "first", "reviewed")
    rejects(easy, "first", "draft")
    state = update(easy_ontology, "first", "ontology-review", reason="Test ontology question")
    assert case(state, easy_ontology["id"])["goldStatus"] == "ontology-review"
    assert case(state, easy_ontology["id"])["expected"] == easy_ontology["expected"]
    rejects(easy_ontology, "first", "reviewed")

    agreed, flipped, escalated = difficult_items
    state = update(agreed, "first", "reviewed")
    assert case(state, agreed["id"])["goldStatus"] == "draft"
    assert state["records"][agreed["id"]]["first"]["status"] == "reviewed"
    state = update(agreed, "second", "reviewed")
    assert state["records"][agreed["id"]]["agreement"] == "agree"
    assert case(state, agreed["id"])["goldStatus"] == "reviewed"
    update(agreed, "second", "draft")
    update(agreed, "first", "draft")

    update(flipped, "first", "reviewed")
    state = update(flipped, "second", "needs-correction", proposedGold=not flipped["expected"], reason="Test second pass")
    assert state["records"][flipped["id"]]["agreement"] == "disagree"
    assert state["secondPass"]["goldFlipCount"] >= 1
    assert case(state, flipped["id"])["goldStatus"] == "needs-correction"
    rejects(flipped, "second", "reviewed")
    rejects(flipped, "first", "draft")

    update(escalated, "first", "reviewed")
    state = update(escalated, "second", "ontology-review", reason="Test escalation")
    assert state["secondPass"]["ontologyEscalationCount"] >= 1
    assert case(state, escalated["id"])["expected"] == escalated["expected"]
    rejects(escalated, "second", "draft")

    ledger = json.loads(LEDGER.read_text(encoding="utf-8"))
    ledger[easy["id"]]["digest"] = "0" * 64
    LEDGER.write_text(json.dumps(ledger, ensure_ascii=False), encoding="utf-8")
    state = request()
    assert case(state, easy["id"])["goldStatus"] == "draft"
    assert easy["id"] not in state["records"]
    print("Review state OK: blind payload, correction/ontology records, two passes, disagreement, hash invalidation")
finally:
    server.terminate()
    try:
        server.wait(timeout=10)
    except subprocess.TimeoutExpired:
        server.kill()
        server.wait(timeout=10)
    LEDGER.write_bytes(original)

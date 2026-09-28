import assert from "node:assert/strict";
import { comparableRuns, compareRepeatedRuns } from "../src/lib/benchmark/stability.ts";

function run(id, provider, values, labels, overrides = {}) {
  return {
    id, createdAt: `2026-09-27T00:00:0${id.slice(-1)}Z`, provider,
    model: provider === "jev" ? "jev-1.13.0" : "gpt-6-sol",
    requestedModel: provider === "baseline" ? "gpt-6-sol" : undefined,
    reasoningEffort: provider === "baseline" ? "xhigh" : undefined,
    split: "development", sample: "quick-10", threshold: 0.8, groupCount: 3,
    datasetVersion: "dataset", protocolVersion: "protocol", metrics: { failed: 0, total: 3 },
    predictions: ["a", "b", "c"].map((itemId, index) => ({
      itemId, predicted: labels[index], probabilityYes: values?.[index] ?? null, confidence: null,
    })), requests: [], ...overrides,
  };
}

const jev = [
  run("jev1", "jev", [0.3, 0.8, 0.2], [false, true, false]),
  run("jev2", "jev", [0.5, 0.82, 0.25], [null, true, false]),
  run("jev3", "jev", [0.7, 0.84, 0.22], [true, true, false]),
];
const result = compareRepeatedRuns(jev);
assert.equal(result.sameLabelRate, 2 / 3);
assert.equal(result.yesNoFlipCount, 1);
assert.equal(result.answerAbstainFlipCount, 1);
assert.equal(result.decisionThresholdCrossingRate, 1 / 3);
assert.ok(Math.abs(result.meanAbsoluteProbabilityDrift - 0.98 / 9) < 1e-12);
assert.ok(Math.abs(result.maximumProbabilityDrift - 0.4) < 1e-12);

const baseline = [
  run("base1", "baseline", null, [true, true, false]),
  run("base2", "baseline", null, [false, true, false]),
  run("base3", "baseline", null, [null, true, false]),
];
const baselineResult = compareRepeatedRuns(baseline);
assert.equal(baselineResult.sameLabelRate, 2 / 3);
assert.equal(baselineResult.yesNoFlipCount, 1);
assert.equal(baselineResult.answerAbstainFlipCount, 1);
assert.equal(baselineResult.meanAbsoluteProbabilityDrift, null);

const changedSample = run("jev4", "jev", [0.3, 0.8, 0.2], [false, true, false], {
  predictions: jev[0].predictions.map((prediction) => prediction.itemId === "c" ? { ...prediction, itemId: "d" } : prediction),
});
assert.equal(comparableRuns([...jev, changedSample], jev[0]).length, 3);
assert.throws(() => compareRepeatedRuns([jev[0], jev[1], changedSample]));
assert.throws(() => compareRepeatedRuns(jev.slice(0, 2)));
assert.throws(() => compareRepeatedRuns([...jev.slice(0, 2), run("jev5", "jev", [0.3, 0.8, 0.2], [false, true, false], { protocolVersion: "changed" })]));
console.log("Stability comparison OK: Jev drift/thresholds, baseline label flips, and match guards");

import type { BenchmarkRun, Prediction, ProviderId, Split } from "./types";

export type StabilityReport = {
  provider: ProviderId;
  split: Split;
  datasetVersion: string;
  protocolVersion: string;
  model: string;
  requestedModel: string | null;
  reasoningEffort: string | null;
  threshold: number;
  sample: string | null;
  runIds: string[];
  itemCount: number;
  sameLabelRate: number;
  yesNoFlipCount: number;
  answerAbstainFlipCount: number;
  meanAbsoluteProbabilityDrift: number | null;
  maximumProbabilityDrift: number | null;
  decisionThresholdCrossingRate: number | null;
};

function validPredictions(run: BenchmarkRun): boolean {
  const ids = run.predictions.map((prediction) => prediction.itemId);
  return run.metrics.failed === 0 && run.metrics.total === ids.length && ids.length > 0 && new Set(ids).size === ids.length &&
    run.predictions.every((prediction) => !prediction.error &&
      (run.provider !== "jev" || (prediction.probabilityYes !== null &&
        Number.isFinite(prediction.probabilityYes) && prediction.probabilityYes >= 0 && prediction.probabilityYes <= 1)));
}

function comparisonKey(run: BenchmarkRun): string {
  return JSON.stringify({
    datasetVersion: run.datasetVersion,
    protocolVersion: run.protocolVersion,
    provider: run.provider,
    model: run.model,
    requestedModel: run.requestedModel || null,
    reasoningEffort: run.reasoningEffort || null,
    split: run.split,
    sample: run.sample || null,
    threshold: run.threshold,
    itemIds: run.predictions.map((prediction) => prediction.itemId).sort(),
  });
}

export function comparableRuns(runs: BenchmarkRun[], selected: BenchmarkRun): BenchmarkRun[] {
  if (!validPredictions(selected)) return [];
  const key = comparisonKey(selected);
  const matching = runs.filter((run) => validPredictions(run) && comparisonKey(run) === key);
  const others = matching.filter((run) => run.id !== selected.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return [selected, ...others.slice(0, 4)].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export function compareRepeatedRuns(runs: BenchmarkRun[]): StabilityReport {
  if (runs.length < 3 || runs.length > 5 || runs.some((run) => !validPredictions(run)) ||
    new Set(runs.map(comparisonKey)).size !== 1 || new Set(runs.map((run) => run.id)).size !== runs.length) {
    throw new Error("Stability requires 3–5 complete runs with identical dataset, protocol, model configuration and item IDs");
  }
  const first = runs[0];
  const maps = runs.map((run) => new Map(run.predictions.map((prediction) => [prediction.itemId, prediction])));
  const ids = first.predictions.map((prediction) => prediction.itemId);
  let sameLabels = 0;
  let yesNoFlips = 0;
  let answerAbstainFlips = 0;
  let thresholdCrossings = 0;
  let driftSum = 0;
  let driftPairs = 0;
  let maxDrift = 0;

  for (const id of ids) {
    const predictions = maps.map((map) => map.get(id) as Prediction);
    const labels = new Set(predictions.map((prediction) => prediction.predicted));
    if (labels.size === 1) sameLabels++;
    if (labels.has(true) && labels.has(false)) yesNoFlips++;
    if (labels.has(null) && (labels.has(true) || labels.has(false))) answerAbstainFlips++;
    if (first.provider === "jev") {
      const values = predictions.map((prediction) => prediction.probabilityYes as number);
      const min = Math.min(...values);
      const max = Math.max(...values);
      if ((min <= 0.4 && max > 0.4) || (min < 0.6 && max >= 0.6)) thresholdCrossings++;
      for (let left = 0; left < values.length; left++) {
        for (let right = left + 1; right < values.length; right++) {
          const drift = Math.abs(values[left] - values[right]);
          driftSum += drift;
          driftPairs++;
          maxDrift = Math.max(maxDrift, drift);
        }
      }
    }
  }
  return {
    provider: first.provider,
    split: first.split,
    datasetVersion: first.datasetVersion,
    protocolVersion: first.protocolVersion,
    model: first.model,
    requestedModel: first.requestedModel || null,
    reasoningEffort: first.reasoningEffort || null,
    threshold: first.threshold,
    sample: first.sample || null,
    runIds: runs.map((run) => run.id),
    itemCount: ids.length,
    sameLabelRate: sameLabels / ids.length,
    yesNoFlipCount: yesNoFlips,
    answerAbstainFlipCount: answerAbstainFlips,
    meanAbsoluteProbabilityDrift: first.provider === "jev" ? driftSum / driftPairs : null,
    maximumProbabilityDrift: first.provider === "jev" ? maxDrift : null,
    decisionThresholdCrossingRate: first.provider === "jev" ? thresholdCrossings / ids.length : null,
  };
}

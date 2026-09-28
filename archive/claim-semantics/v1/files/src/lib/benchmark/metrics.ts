import { CONTRACT_IDS } from "./contracts";
import type { BenchmarkItem, ConfidenceBucket, ContractMetrics, Metrics, Prediction, Rate, RequestMeasure, ThresholdPoint } from "./types";

const divide = (a: number, b: number): Rate => b === 0 ? null : a / b;
const percentile = (values: number[], p: number): Rate => {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.ceil(p * sorted.length) - 1];
};

function classification(items: BenchmarkItem[], byId: Map<string, Prediction>): Omit<ContractMetrics, "contract"> {
  let tp = 0, fp = 0, tn = 0, fn = 0, abstained = 0, excludedGold = 0;
  for (const item of items) {
    if (item.expected === null) { excludedGold++; continue; }
    const prediction = byId.get(item.id);
    if (!prediction || prediction.predicted === null) { abstained++; continue; }
    if (prediction.predicted && item.expected) tp++;
    else if (prediction.predicted && !item.expected) fp++;
    else if (!prediction.predicted && item.expected) fn++;
    else tn++;
  }
  const precision = divide(tp, tp + fp);
  const recall = divide(tp, tp + fn);
  return {
    total: items.length, scored: tp + fp + tn + fn, abstained, excludedGold,
    tp, fp, tn, fn, precision, recall,
    f1: precision === null || recall === null ? null : divide(2 * precision * recall, precision + recall),
    falsePositiveRate: divide(fp, fp + tn),
    falseNegativeRate: divide(fn, fn + tp),
  };
}

export function evaluate(items: BenchmarkItem[], predictions: Prediction[], requests: RequestMeasure[], threshold: number): Metrics {
  const byId = new Map(predictions.map((prediction) => [prediction.itemId, prediction]));
  const overall = classification(items, byId);
  const evaluable = items.filter((item) => item.expected !== null);
  const byContract = CONTRACT_IDS.map((contract) => ({
    contract, ...classification(items.filter((item) => item.contract === contract), byId),
  }));
  const probabilities = evaluable.flatMap((item) => {
    const prediction = byId.get(item.id);
    return prediction?.probabilityYes !== null && prediction?.probabilityYes !== undefined &&
      Number.isFinite(prediction.probabilityYes)
      ? [{ item, probability: prediction.probabilityYes, confidence: Math.max(prediction.probabilityYes, 1 - prediction.probabilityYes) }]
      : [];
  });
  const brier = probabilities.length ? probabilities.reduce((sum, row) => sum + (row.probability - Number(row.item.expected)) ** 2, 0) / probabilities.length : null;
  const ranges = [0.5, 0.6, 0.7, 0.8, 0.9, 1.000001];
  const confidenceBuckets: ConfidenceBucket[] = ranges.slice(0, -1).map((lower, index) => {
    const rows = probabilities.filter((row) => row.confidence >= lower && row.confidence < ranges[index + 1]);
    const correct = rows.filter((row) => (row.probability >= 0.5) === row.item.expected).length;
    return {
      label: `${Math.round(lower * 100)}–${Math.round(Math.min(ranges[index + 1], 1) * 100)}%`,
      count: rows.length,
      accuracy: divide(correct, rows.length),
      meanConfidence: divide(rows.reduce((sum, row) => sum + row.confidence, 0), rows.length),
    };
  });
  const expectedCalibrationError = probabilities.length ? confidenceBuckets.reduce((sum, bucket) =>
    sum + (bucket.count / probabilities.length) * Math.abs((bucket.accuracy ?? 0) - (bucket.meanConfidence ?? 0)), 0) : null;

  const makeThreshold = (cutoff: number): ThresholdPoint => {
    const accepted = probabilities.filter((row) => row.confidence >= cutoff && (row.probability >= 0.6 || row.probability <= 0.4));
    const acceptedErrors = accepted.filter((row) => (row.probability >= 0.5) !== row.item.expected).length;
    const allErrors = probabilities.filter((row) => (row.probability >= 0.5) !== row.item.expected).length;
    return {
      threshold: cutoff,
      coverage: evaluable.length ? accepted.length / evaluable.length : 0,
      acceptedAccuracy: divide(accepted.length - acceptedErrors, accepted.length),
      errorCapture: divide(allErrors - acceptedErrors, allErrors),
      acceptedErrors,
    };
  };
  const thresholds = [0.6, 0.7, 0.8, 0.85, 0.9, 0.95].map(makeThreshold);
  const selected = makeThreshold(threshold);
  const latencies = requests.filter((request) => !request.error).map((request) => request.latencyMs);
  const costKnown = requests.every((request) => request.costUsd !== null);
  return {
    total: items.length,
    scored: overall.scored,
    failed: predictions.filter((prediction) => Boolean(prediction.error)).length,
    abstained: overall.abstained,
    excludedGold: overall.excludedGold,
    accuracy: divide(overall.tp + overall.tn, overall.scored),
    precision: overall.precision, recall: overall.recall, f1: overall.f1,
    brier, expectedCalibrationError,
    coverage: probabilities.length ? selected.coverage : null,
    acceptedAccuracy: selected.acceptedAccuracy,
    errorCapture: selected.errorCapture,
    byContract, thresholds, confidenceBuckets,
    latencyMs: { p50: percentile(latencies, 0.5), p95: percentile(latencies, 0.95), p99: percentile(latencies, 0.99) },
    totalCostUsd: costKnown ? requests.reduce((sum, request) => sum + (request.costUsd ?? 0), 0) : null,
    totalInputTokens: requests.reduce((sum, request) => sum + (request.inputTokens ?? 0), 0),
    totalOutputTokens: requests.reduce((sum, request) => sum + (request.outputTokens ?? 0), 0),
  };
}

import type { ContractId } from "./contracts";

export type Split = "development" | "holdout";
export type ProviderId = "jev" | "baseline";

export type BenchmarkItem = {
  id: string;
  groupId: string;
  language: "ka";
  text: string;
  contract: ContractId;
  expected: boolean | null;
  difficulty: "obvious" | "moderate" | "nuanced";
  tags: string[];
  ambiguity: "low" | "medium" | "high";
  humanRationale: string;
  split: Split;
  goldStatus: "draft" | "reviewed" | "ontology-review";
  source: "seed" | "adversarial-batch-01" | "adversarial-expansion";
};

export type Prediction = {
  itemId: string;
  predicted: boolean | null;
  probabilityYes: number | null;
  confidence: number | null;
  error?: string;
};

export type RequestMeasure = {
  groupId: string;
  latencyMs: number;
  inputTokens: number | null;
  outputTokens: number | null;
  costUsd: number | null;
  error?: string;
};

export type Rate = number | null;
export type ContractMetrics = {
  contract: ContractId;
  total: number;
  scored: number;
  abstained: number;
  excludedGold: number;
  tp: number;
  fp: number;
  tn: number;
  fn: number;
  precision: Rate;
  recall: Rate;
  f1: Rate;
  falsePositiveRate: Rate;
  falseNegativeRate: Rate;
};

export type ThresholdPoint = {
  threshold: number;
  coverage: number;
  acceptedAccuracy: Rate;
  errorCapture: Rate;
  acceptedErrors: number;
};

export type ConfidenceBucket = {
  label: string;
  count: number;
  accuracy: Rate;
  meanConfidence: Rate;
};

export type Metrics = {
  total: number;
  scored: number;
  failed: number;
  abstained: number;
  excludedGold: number;
  accuracy: Rate;
  precision: Rate;
  recall: Rate;
  f1: Rate;
  brier: Rate;
  expectedCalibrationError: Rate;
  coverage: Rate;
  acceptedAccuracy: Rate;
  errorCapture: Rate;
  byContract: ContractMetrics[];
  thresholds: ThresholdPoint[];
  confidenceBuckets: ConfidenceBucket[];
  latencyMs: { p50: Rate; p95: Rate; p99: Rate };
  totalCostUsd: Rate;
  totalInputTokens: number;
  totalOutputTokens: number;
};

export type BenchmarkRun = {
  id: string;
  createdAt: string;
  provider: ProviderId;
  model: string;
  requestedModel?: string;
  reasoningEffort?: string;
  split: Split;
  threshold: number;
  groupCount: number;
  datasetVersion: string;
  protocolVersion: string;
  predictions: Prediction[];
  requests: RequestMeasure[];
  metrics: Metrics;
};

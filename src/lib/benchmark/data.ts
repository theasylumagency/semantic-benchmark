import { readFile, readdir, writeFile, mkdir, rename } from "node:fs/promises";
import { createHash, randomUUID } from "node:crypto";
import path from "node:path";
import { CONTRACT_IDS } from "./contracts";
import { requiresSecondPass } from "./review-rules";
import type { BenchmarkItem, BenchmarkRun, Split } from "./types";

const root = process.cwd();
const datasetDir = path.join(root, "datasets", "claim-semantics");
const runsDir = path.join(root, "reports", "runs");
const reviewPath = path.join(datasetDir, "reviews.json");
export type ReviewDecision = {
  status: "reviewed" | "needs-correction" | "ontology-review";
  proposedGold?: boolean;
  reason?: string;
  createdAt: string;
};
export type ReviewRecord = { digest: string; currentGold: boolean | null; first?: ReviewDecision; second?: ReviewDecision; agreement?: "agree" | "disagree" };
type ReviewLedger = Record<string, ReviewRecord>;
export type ReviewAction = "draft" | ReviewDecision["status"];

export function reviewStatus(item: BenchmarkItem, record?: ReviewRecord): BenchmarkItem["goldStatus"] {
  if (item.goldStatus === "ontology-review") return "ontology-review";
  const first = record?.first;
  const second = record?.second;
  if (!first) return "draft";
  if (first.status === "ontology-review" || second?.status === "ontology-review") return "ontology-review";
  if (first.status === "needs-correction" || second?.status === "needs-correction") return "needs-correction";
  if (requiresSecondPass(item) && !second) return "draft";
  return "reviewed";
}

function itemDigest(item: BenchmarkItem): string {
  return createHash("sha256").update(JSON.stringify(item)).digest("hex");
}

async function readReviews(): Promise<ReviewLedger> {
  const value: unknown = JSON.parse(await readFile(reviewPath, "utf8"));
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Invalid review ledger");
  return value as ReviewLedger;
}

export async function datasetVersion(): Promise<string> {
  const files = ["development.jsonl", "validation.jsonl", "reviews.json"];
  const contents = await Promise.all(files.map((name) => readFile(path.join(datasetDir, name))));
  const digest = createHash("sha256");
  files.forEach((name, index) => digest.update(name).update(contents[index]));
  return digest.digest("hex").slice(0, 12);
}

export async function protocolVersion(): Promise<string> {
  const files = [
    "datasets/claim-semantics/development.jsonl",
    "datasets/claim-semantics/validation.jsonl",
    "datasets/claim-semantics/reviews.json",
    "src/lib/benchmark/contracts.ts",
    "src/lib/benchmark/providers.ts",
    "src/lib/benchmark/metrics.ts",
    "src/lib/benchmark/stability.ts",
    "src/lib/benchmark/types.ts",
    "src/lib/benchmark/data.ts",
    "src/lib/benchmark/review-rules.ts",
    "src/lib/benchmark/gold-review.ts",
    "src/app/api/workbench/route.ts",
    "src/app/api/gold-review/route.ts",
  ];
  const contents = await Promise.all([
    readFile(path.join(root, "datasets", "claim-semantics", "development.jsonl")),
    readFile(path.join(root, "datasets", "claim-semantics", "validation.jsonl")),
    readFile(path.join(root, "datasets", "claim-semantics", "reviews.json")),
    readFile(path.join(root, "src", "lib", "benchmark", "contracts.ts")),
    readFile(path.join(root, "src", "lib", "benchmark", "providers.ts")),
    readFile(path.join(root, "src", "lib", "benchmark", "metrics.ts")),
    readFile(path.join(root, "src", "lib", "benchmark", "stability.ts")),
    readFile(path.join(root, "src", "lib", "benchmark", "types.ts")),
    readFile(path.join(root, "src", "lib", "benchmark", "data.ts")),
    readFile(path.join(root, "src", "lib", "benchmark", "review-rules.ts")),
    readFile(path.join(root, "src", "lib", "benchmark", "gold-review.ts")),
    readFile(path.join(root, "src", "app", "api", "workbench", "route.ts")),
    readFile(path.join(root, "src", "app", "api", "gold-review", "route.ts")),
  ]);
  const digest = createHash("sha256");
  files.forEach((file, index) => digest.update(file).update(contents[index]));
  digest.update(JSON.stringify({
    jevModel: process.env.JEV_MODEL || "jev-latest",
    baselineModel: process.env.BASELINE_MODEL || "gpt-6-sol",
    baselineReasoningEffort: process.env.BASELINE_REASONING_EFFORT || "xhigh",
    jevApiUrl: process.env.JEV_API_URL || "https://api.typesafe.ai/v1/systemone",
    baselineApiUrl: process.env.BASELINE_API_URL || "https://api.openai.com/v1/responses",
  }));
  return digest.digest("hex").slice(0, 16);
}

export function protocolFrozen(version: string): boolean {
  return Boolean(version && process.env.BENCHMARK_FROZEN_PROTOCOL_VERSION === version);
}

async function rawItems(split: Split): Promise<BenchmarkItem[]> {
  const raw = await readFile(path.join(datasetDir, `${split}.jsonl`), "utf8");
  return raw.trim().split("\n").map((line) => {
    const item = JSON.parse(line) as BenchmarkItem;
    if (item.split !== split || !CONTRACT_IDS.includes(item.contract) ||
      (item.expected !== null && typeof item.expected !== "boolean") ||
      (item.expected === null && item.goldStatus !== "ontology-review") ||
      (item.expected !== null && item.goldStatus !== "draft") ||
      !["seed", "adversarial-batch-01", "adversarial-expansion"].includes(item.source)) {
      throw new Error(`Invalid dataset item: ${item.id}`);
    }
    return item;
  });
}

export async function loadItems(split: Split): Promise<BenchmarkItem[]> {
  const [items, reviews] = await Promise.all([rawItems(split), readReviews()]);
  return items.map((item) => {
    const review = reviews[item.id];
    return { ...item, goldStatus: reviewStatus(item, review?.digest === itemDigest(item) ? review : undefined) };
  });
}

export async function loadReviewRecords(): Promise<ReviewLedger> {
  const [development, validation, reviews] = await Promise.all([rawItems("development"), rawItems("validation"), readReviews()]);
  const items = new Map([...development, ...validation].map((item) => [item.id, item]));
  return Object.fromEntries(Object.entries(reviews).filter(([id, review]) => {
    const item = items.get(id);
    return item && review.digest === itemDigest(item);
  }));
}

let reviewQueue = Promise.resolve();
export function setGoldReview(id: string, pass: "first" | "second", status: ReviewAction, proposedGold?: boolean, reason?: string): Promise<void> {
  const work = reviewQueue.then(async () => {
    const [development, validation, reviews] = await Promise.all([rawItems("development"), rawItems("validation"), readReviews()]);
    const item = [...development, ...validation].find((entry) => entry.id === id);
    if (!item) throw new Error("Unknown case");
    if (status === "reviewed" && item.goldStatus !== "draft") throw new Error("Resolve source ontology before agreeing with gold");
    const previous = reviews[id]?.digest === itemDigest(item) ? reviews[id] : undefined;
    const unresolved = (decision?: ReviewDecision) => decision?.status === "needs-correction" || decision?.status === "ontology-review";
    if (unresolved(previous?.[pass]) && status !== previous?.[pass]?.status) {
      throw new Error("Resolve the correction or ontology issue in the source and rules before changing this decision");
    }
    if (pass === "first" && unresolved(previous?.second)) {
      throw new Error("Resolve the second-pass issue in the source and rules before changing the first decision");
    }
    if (pass === "second" && (!requiresSecondPass(item) || !previous?.first)) throw new Error("Second pass requires a difficult case and a first decision");
    if (status === "needs-correction" && (item.expected === null || typeof proposedGold !== "boolean" || proposedGold === item.expected)) {
      throw new Error("Choose a different proposed YES/NO gold for the correction");
    }
    const writtenReason = reason?.trim();
    if ((status === "needs-correction" || status === "ontology-review") && (!writtenReason || writtenReason.length > 2000)) {
      throw new Error("A written reason of at most 2000 characters is required");
    }
    const next: ReviewRecord = previous ? { ...previous } : { digest: itemDigest(item), currentGold: item.expected };
    if (status === "draft") {
      if (pass === "first") { delete next.first; delete next.second; }
      else delete next.second;
    } else {
      next[pass] = {
        status, createdAt: new Date().toISOString(),
        ...(status === "needs-correction" ? { proposedGold } : {}),
        ...(writtenReason ? { reason: writtenReason } : {}),
      };
      if (pass === "first") delete next.second;
    }
    if (next.first && next.second) {
      next.agreement = next.first.status === next.second.status && next.first.proposedGold === next.second.proposedGold ? "agree" : "disagree";
    } else delete next.agreement;
    if (next.first) reviews[id] = next;
    else delete reviews[id];
    const temporary = path.join(datasetDir, `reviews-${randomUUID()}.tmp`);
    await writeFile(temporary, JSON.stringify(reviews, null, 2) + "\n", "utf8");
    await rename(temporary, reviewPath);
  });
  reviewQueue = work.catch(() => undefined);
  return work;
}

export async function listRuns(): Promise<BenchmarkRun[]> {
  await mkdir(runsDir, { recursive: true });
  const names = (await readdir(runsDir)).filter((name) => /^run-[a-z0-9-]+\.json$/.test(name));
  const runs = await Promise.all(names.map(async (name) => {
    try {
      const run = JSON.parse(await readFile(path.join(runsDir, name), "utf8")) as BenchmarkRun;
      // Historical local reports retain their original protocol hash and remain stale.
      if ((run.split as string) === "holdout") run.split = "validation";
      return run;
    }
    catch { return null; }
  }));
  return runs.filter((run): run is BenchmarkRun => run !== null).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function saveRun(run: BenchmarkRun): Promise<void> {
  await mkdir(runsDir, { recursive: true });
  await writeFile(path.join(runsDir, `${run.id}.json`), JSON.stringify(run, null, 2), { flag: "wx" });
}

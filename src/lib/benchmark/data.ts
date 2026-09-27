import { readFile, readdir, writeFile, mkdir, rename } from "node:fs/promises";
import { createHash, randomUUID } from "node:crypto";
import path from "node:path";
import { CONTRACT_IDS } from "./contracts";
import type { BenchmarkItem, BenchmarkRun, Split } from "./types";

const root = process.cwd();
const datasetDir = path.join(root, "datasets", "claim-semantics");
const runsDir = path.join(root, "reports", "runs");
const reviewPath = path.join(datasetDir, "reviews.json");
type Review = { digest: string; reviewedAt: string };
type ReviewLedger = Record<string, Review>;

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
    "src/app/api/workbench/route.ts",
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
    readFile(path.join(root, "src", "app", "api", "workbench", "route.ts")),
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
    return review && review.digest === itemDigest(item) && item.goldStatus === "draft"
      ? { ...item, goldStatus: "reviewed" as const }
      : item;
  });
}

let reviewQueue = Promise.resolve();
export function setReviewStatus(id: string, status: "draft" | "reviewed"): Promise<void> {
  const work = reviewQueue.then(async () => {
    const [development, validation, reviews] = await Promise.all([rawItems("development"), rawItems("validation"), readReviews()]);
    const item = [...development, ...validation].find((entry) => entry.id === id);
    if (!item || item.goldStatus === "ontology-review") throw new Error("Case is unavailable for review; resolve ontology in the source first");
    if (status === "reviewed") reviews[id] = { digest: itemDigest(item), reviewedAt: new Date().toISOString() };
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

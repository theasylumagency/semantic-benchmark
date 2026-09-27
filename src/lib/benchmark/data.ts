import { readFile, readdir, writeFile, mkdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import { CONTRACT_IDS } from "./contracts";
import type { BenchmarkItem, BenchmarkRun, Split } from "./types";

const root = process.cwd();
const datasetDir = path.join(root, "datasets", "claim-semantics");
const runsDir = path.join(root, "reports", "runs");

export async function datasetVersion(): Promise<string> {
  const [development, holdout] = await Promise.all([
    readFile(path.join(datasetDir, "development.jsonl")),
    readFile(path.join(datasetDir, "holdout.jsonl")),
  ]);
  return createHash("sha256").update(development).update(holdout).digest("hex").slice(0, 12);
}

export async function protocolVersion(): Promise<string> {
  const files = [
    "datasets/claim-semantics/development.jsonl",
    "datasets/claim-semantics/holdout.jsonl",
    "src/lib/benchmark/contracts.ts",
    "src/lib/benchmark/providers.ts",
    "src/lib/benchmark/metrics.ts",
    "src/lib/benchmark/types.ts",
    "src/lib/benchmark/data.ts",
    "src/app/api/workbench/route.ts",
  ];
  const contents = await Promise.all([
    readFile(path.join(root, "datasets", "claim-semantics", "development.jsonl")),
    readFile(path.join(root, "datasets", "claim-semantics", "holdout.jsonl")),
    readFile(path.join(root, "src", "lib", "benchmark", "contracts.ts")),
    readFile(path.join(root, "src", "lib", "benchmark", "providers.ts")),
    readFile(path.join(root, "src", "lib", "benchmark", "metrics.ts")),
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
  }));
  return digest.digest("hex").slice(0, 16);
}

export function protocolFrozen(version: string): boolean {
  return Boolean(version && process.env.BENCHMARK_FROZEN_PROTOCOL_VERSION === version);
}

export async function loadItems(split: Split): Promise<BenchmarkItem[]> {
  const raw = await readFile(path.join(datasetDir, `${split}.jsonl`), "utf8");
  return raw.trim().split("\n").map((line) => {
    const item = JSON.parse(line) as BenchmarkItem;
    if (item.split !== split || !CONTRACT_IDS.includes(item.contract) ||
      (item.expected !== null && typeof item.expected !== "boolean") ||
      (item.expected === null && item.goldStatus !== "ontology-review") ||
      !["seed", "adversarial-batch-01", "adversarial-expansion"].includes(item.source)) {
      throw new Error(`Invalid dataset item: ${item.id}`);
    }
    return item;
  });
}

export async function listRuns(): Promise<BenchmarkRun[]> {
  await mkdir(runsDir, { recursive: true });
  const names = (await readdir(runsDir)).filter((name) => /^run-[a-z0-9-]+\.json$/.test(name));
  const runs = await Promise.all(names.map(async (name) => {
    try { return JSON.parse(await readFile(path.join(runsDir, name), "utf8")) as BenchmarkRun; }
    catch { return null; }
  }));
  return runs.filter((run): run is BenchmarkRun => run !== null).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function saveRun(run: BenchmarkRun): Promise<void> {
  await mkdir(runsDir, { recursive: true });
  await writeFile(path.join(runsDir, `${run.id}.json`), JSON.stringify(run, null, 2), { flag: "wx" });
}

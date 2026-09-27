import { randomUUID } from "node:crypto";
import { datasetVersion, loadItems, listRuns, protocolFrozen, protocolVersion, saveRun, setReviewStatus } from "@/lib/benchmark/data";
import { evaluate } from "@/lib/benchmark/metrics";
import { baselineConfiguration, providerAvailable, runGroup } from "@/lib/benchmark/providers";
import type { BenchmarkItem, BenchmarkRun, ProviderId, Split } from "@/lib/benchmark/types";

export const runtime = "nodejs";

function authorized(request: Request): boolean {
  const token = process.env.BENCHMARK_ACCESS_TOKEN;
  if (!token) return process.env.NODE_ENV !== "production";
  return request.headers.get("authorization") === `Bearer ${token}`;
}

export async function GET() {
  const [development, validation, runs, currentVersion, currentProtocol] = await Promise.all([
    loadItems("development"), loadItems("validation"), listRuns(), datasetVersion(), protocolVersion(),
  ]);
  const allItems = [...development, ...validation];
  return Response.json({
    dataset: {
      development, validation,
      version: currentVersion,
      reviewedCount: allItems.filter((item) => item.goldStatus === "reviewed").length,
      draftCount: allItems.filter((item) => item.goldStatus === "draft").length,
      ontologyReviewCount: allItems.filter((item) => item.goldStatus === "ontology-review").length,
      total: allItems.length,
    },
    providers: { jev: providerAvailable("jev"), baseline: providerAvailable("baseline") },
    baselineConfiguration: baselineConfiguration(),
    protocolVersion: currentProtocol,
    validationFrozen: protocolFrozen(currentProtocol),
    runs,
    writeProtected: Boolean(process.env.BENCHMARK_ACCESS_TOKEN) || process.env.NODE_ENV === "production",
  });
}

export async function PATCH(request: Request) {
  if (!authorized(request)) return Response.json({ error: "Access token required for review changes" }, { status: 401 });
  let body: { itemId?: unknown; status?: unknown };
  try { body = await request.json(); }
  catch { return Response.json({ error: "Invalid JSON" }, { status: 400 }); }
  if (typeof body.itemId !== "string" || !["draft", "reviewed"].includes(body.status as string)) {
    return Response.json({ error: "Invalid review change" }, { status: 400 });
  }
  try { await setReviewStatus(body.itemId, body.status as "draft" | "reviewed"); }
  catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Review change failed" }, { status: 400 }); }
  const [development, validation, version, currentProtocol] = await Promise.all([
    loadItems("development"), loadItems("validation"), datasetVersion(), protocolVersion(),
  ]);
  const allItems = [...development, ...validation];
  return Response.json({ dataset: {
    development, validation, version, total: allItems.length,
    reviewedCount: allItems.filter((item) => item.goldStatus === "reviewed").length,
    draftCount: allItems.filter((item) => item.goldStatus === "draft").length,
    ontologyReviewCount: allItems.filter((item) => item.goldStatus === "ontology-review").length,
  }, protocolVersion: currentProtocol, validationFrozen: protocolFrozen(currentProtocol) });
}

type RunRequest = { provider?: unknown; split?: unknown; threshold?: unknown; sampleGroups?: unknown; calibrationRunId?: unknown };

export async function POST(request: Request) {
  if (!authorized(request)) return Response.json({ error: "Access token required for benchmark runs" }, { status: 401 });
  let body: RunRequest;
  try { body = await request.json(); }
  catch { return Response.json({ error: "Invalid JSON" }, { status: 400 }); }
  const provider = body.provider as ProviderId;
  const split = body.split as Split;
  if ((provider !== "jev" && provider !== "baseline") || (split !== "development" && split !== "validation")) {
    return Response.json({ error: "Invalid provider or split" }, { status: 400 });
  }
  if (split === "development" && body.sampleGroups !== 10 && body.sampleGroups !== "all" &&
    body.sampleGroups !== "batch-01" && body.sampleGroups !== "adversarial-all") {
    return Response.json({ error: "Invalid development sample" }, { status: 400 });
  }
  if (!providerAvailable(provider)) return Response.json({ error: `${provider} is not configured on the server` }, { status: 400 });
  const currentVersion = await datasetVersion();
  const currentProtocol = await protocolVersion();
  let threshold: number;
  if (split === "validation") {
    if (!protocolFrozen(currentProtocol)) {
      return Response.json({ error: "Freeze the current benchmark protocol before validation runs" }, { status: 409 });
    }
    const runs = await listRuns();
    const calibration = runs.find((run) => run.id === body.calibrationRunId);
    const devGroups = new Set((await loadItems("development")).map((item) => item.groupId)).size;
    if (!calibration || calibration.provider !== provider || calibration.split !== "development" ||
      calibration.datasetVersion !== currentVersion || calibration.protocolVersion !== currentProtocol ||
      calibration.groupCount !== devGroups || calibration.metrics.failed > 0 ||
      (provider === "baseline" && (calibration.requestedModel !== baselineConfiguration().model ||
        calibration.reasoningEffort !== baselineConfiguration().reasoningEffort))) {
      return Response.json({ error: "Validation requires a full development run for this provider and dataset version" }, { status: 400 });
    }
    threshold = calibration.threshold;
  } else {
    threshold = typeof body.threshold === "number" ? body.threshold : 0.8;
    if (!Number.isFinite(threshold) || threshold < 0.6 || threshold > 1) {
      return Response.json({ error: "Threshold must be between 0.6 and 1" }, { status: 400 });
    }
  }

  const splitItems = await loadItems(split);
  const allItems = split === "development" && body.sampleGroups === "batch-01"
    ? splitItems.filter((item) => item.source === "adversarial-batch-01")
    : split === "development" && body.sampleGroups === "adversarial-all"
      ? splitItems.filter((item) => item.source !== "seed")
      : splitItems;
  const groups = new Map<string, BenchmarkItem[]>();
  for (const item of allItems) groups.set(item.groupId, [...(groups.get(item.groupId) || []), item]);
  const groupLimit = split === "validation" ? groups.size : body.sampleGroups === 10 ? 10 : groups.size;
  const selectedGroups = [...groups.values()].slice(0, groupLimit);
  const selectedItems = selectedGroups.flat();
  // Bounded concurrency avoids provider rate-limit spikes while keeping a full run practical.
  const results: Awaited<ReturnType<typeof runGroup>>[] = [];
  for (let offset = 0; offset < selectedGroups.length; offset += 3) {
    results.push(...await Promise.all(selectedGroups.slice(offset, offset + 3).map((group) => runGroup(provider, group))));
  }
  const predictions = results.flatMap((result) => result.predictions);
  const requests = results.map((result) => result.request);
  const run: BenchmarkRun = {
    id: `run-${randomUUID()}`,
    createdAt: new Date().toISOString(),
    provider,
    model: results.find((result) => !result.request.error)?.model || results[0]?.model || "unknown",
    requestedModel: results[0]?.requestedModel,
    reasoningEffort: results[0]?.reasoningEffort,
    split,
    sample: split === "validation" ? "all" : body.sampleGroups === 10 ? "quick-10" : String(body.sampleGroups),
    threshold,
    groupCount: selectedGroups.length,
    datasetVersion: currentVersion,
    protocolVersion: currentProtocol,
    predictions,
    requests,
    metrics: evaluate(selectedItems, predictions, requests, threshold),
  };
  await saveRun(run);
  return Response.json({ run });
}

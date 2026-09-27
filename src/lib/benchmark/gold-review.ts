import { CONTRACTS } from "./contracts";
import { datasetVersion, loadItems, loadReviewRecords, protocolVersion, type ReviewDecision, type ReviewRecord } from "./data";
import { requiresSecondPass } from "./review-rules";
import type { BenchmarkItem, Split } from "./types";

export type ReviewProgress = { total: number; firstPassComplete: number; reviewed: number; draft: number; needsCorrection: number; ontologyReview: number };
export type GoldReviewSnapshot = {
  items: BenchmarkItem[];
  records: Record<string, ReviewRecord>;
  contracts: typeof CONTRACTS;
  progress: Record<Split | "all", ReviewProgress>;
  secondPass: { eligible: number; completed: number; agreementRate: number | null; goldFlipCount: number; ontologyEscalationCount: number };
  datasetVersion: string;
  protocolVersion: string;
  writeProtected: boolean;
};

function progress(items: BenchmarkItem[], records: Record<string, ReviewRecord>): ReviewProgress {
  return {
    total: items.length,
    firstPassComplete: items.filter((item) => Boolean(records[item.id]?.first)).length,
    reviewed: items.filter((item) => item.goldStatus === "reviewed").length,
    draft: items.filter((item) => item.goldStatus === "draft").length,
    needsCorrection: items.filter((item) => item.goldStatus === "needs-correction").length,
    ontologyReview: items.filter((item) => item.goldStatus === "ontology-review").length,
  };
}

function decisionGold(decision: ReviewDecision, currentGold: boolean | null): boolean | null {
  return decision.status === "ontology-review" ? null : decision.status === "needs-correction" ? decision.proposedGold ?? null : currentGold;
}

export function annotationStability(items: BenchmarkItem[], records: Record<string, ReviewRecord>) {
  const eligible = items.filter(requiresSecondPass);
  const completed = eligible.filter((item) => records[item.id]?.first && records[item.id]?.second);
  const agreements = completed.filter((item) => records[item.id].agreement === "agree").length;
  return {
    eligible: eligible.length,
    completed: completed.length,
    agreementRate: completed.length ? agreements / completed.length : null,
    goldFlipCount: completed.filter((item) => {
      const record = records[item.id];
      const first = decisionGold(record.first!, item.expected);
      const second = decisionGold(record.second!, item.expected);
      return first !== null && second !== null && first !== second;
    }).length,
    ontologyEscalationCount: completed.filter((item) => records[item.id].first?.status !== "ontology-review" && records[item.id].second?.status === "ontology-review").length,
  };
}

export async function loadGoldReviewSnapshot(): Promise<GoldReviewSnapshot> {
  const [development, validation, records, version, protocol] = await Promise.all([
    loadItems("development"), loadItems("validation"), loadReviewRecords(), datasetVersion(), protocolVersion(),
  ]);
  const items = [...development, ...validation];
  return {
    items, records, contracts: CONTRACTS,
    progress: { all: progress(items, records), development: progress(development, records), validation: progress(validation, records) },
    secondPass: annotationStability(items, records), datasetVersion: version, protocolVersion: protocol,
    writeProtected: Boolean(process.env.BENCHMARK_ACCESS_TOKEN) || process.env.NODE_ENV === "production",
  };
}

import { datasetVersion, loadItems, listRuns, protocolFrozen, protocolVersion } from "@/lib/benchmark/data";
import { baselineConfiguration, providerAvailable } from "@/lib/benchmark/providers";
import { connection } from "next/server";
import Workbench from "./workbench";

export default async function Home() {
  await connection();
  const [development, holdout, runs, version, currentProtocol] = await Promise.all([
    loadItems("development"), loadItems("holdout"), listRuns(), datasetVersion(), protocolVersion(),
  ]);
  return <Workbench initial={{
    dataset: {
      development,
      version,
      holdout: runs.some((run) => run.split === "holdout" && run.protocolVersion === currentProtocol) ? holdout : [],
      holdoutCount: holdout.length,
      holdoutGroups: new Set(holdout.map((item) => item.groupId)).size,
      reviewedCount: [...development, ...holdout].filter((item) => item.goldStatus === "reviewed").length,
      total: development.length + holdout.length,
    },
    providers: { jev: providerAvailable("jev"), baseline: providerAvailable("baseline") },
    baselineConfiguration: baselineConfiguration(),
    protocolVersion: currentProtocol,
    holdoutFrozen: protocolFrozen(currentProtocol),
    runs,
    writeProtected: Boolean(process.env.BENCHMARK_ACCESS_TOKEN) || process.env.NODE_ENV === "production",
  }} />;
}

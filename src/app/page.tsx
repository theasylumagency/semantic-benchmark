import { datasetVersion, loadItems, listRuns, protocolFrozen, protocolVersion } from "@/lib/benchmark/data";
import { baselineConfiguration, providerAvailable } from "@/lib/benchmark/providers";
import { connection } from "next/server";
import Workbench from "./workbench";

export default async function Home() {
  await connection();
  const [development, validation, runs, version, currentProtocol] = await Promise.all([
    loadItems("development"), loadItems("validation"), listRuns(), datasetVersion(), protocolVersion(),
  ]);
  const allItems = [...development, ...validation];
  return <Workbench initial={{
    dataset: {
      development,
      version,
      validation,
      reviewedCount: allItems.filter((item) => item.goldStatus === "reviewed").length,
      draftCount: allItems.filter((item) => item.goldStatus === "draft").length,
      needsCorrectionCount: allItems.filter((item) => item.goldStatus === "needs-correction").length,
      ontologyReviewCount: allItems.filter((item) => item.goldStatus === "ontology-review").length,
      total: allItems.length,
    },
    providers: { jev: providerAvailable("jev"), baseline: providerAvailable("baseline") },
    baselineConfiguration: baselineConfiguration(),
    protocolVersion: currentProtocol,
    validationFrozen: protocolFrozen(currentProtocol),
    runs,
    writeProtected: Boolean(process.env.BENCHMARK_ACCESS_TOKEN) || process.env.NODE_ENV === "production",
  }} />;
}

import { readFile } from "node:fs/promises";
import path from "node:path";
import { compareRepeatedRuns } from "../src/lib/benchmark/stability.ts";

const ids = process.argv.slice(2);
if (ids.length < 3 || ids.length > 5 || ids.some((id) => !/^run-[a-z0-9-]+$/.test(id))) {
  console.error("Usage: npm run report:stability -- run-id-1 run-id-2 run-id-3 [run-id-4 run-id-5]");
  process.exit(2);
}
try {
  const runs = await Promise.all(ids.map(async (id) => {
    const run = JSON.parse(await readFile(path.join(process.cwd(), "reports", "runs", `${id}.json`), "utf8"));
    if (run.id !== id) throw new Error(`Run ID mismatch in ${id}.json`);
    if (run.split === "holdout") run.split = "validation"; // Legacy local report name only.
    return run;
  }));
  console.log(JSON.stringify(compareRepeatedRuns(runs), null, 2));
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}

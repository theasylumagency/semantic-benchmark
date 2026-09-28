import type { BenchmarkItem } from "./types";

export function requiresSecondPass(item: BenchmarkItem): boolean {
  return item.difficulty === "nuanced" || item.ambiguity !== "low";
}

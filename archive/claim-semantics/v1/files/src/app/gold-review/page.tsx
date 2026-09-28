import { connection } from "next/server";
import { loadGoldReviewSnapshot } from "@/lib/benchmark/gold-review";
import GoldReview from "./review";

export default async function GoldReviewPage() {
  await connection();
  return <GoldReview initial={await loadGoldReviewSnapshot()} />;
}

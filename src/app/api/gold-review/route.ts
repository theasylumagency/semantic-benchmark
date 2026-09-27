import { setGoldReview, type ReviewAction } from "@/lib/benchmark/data";
import { loadGoldReviewSnapshot } from "@/lib/benchmark/gold-review";

export const runtime = "nodejs";

function authorized(request: Request): boolean {
  const token = process.env.BENCHMARK_ACCESS_TOKEN;
  if (!token) return process.env.NODE_ENV !== "production";
  return request.headers.get("authorization") === `Bearer ${token}`;
}

export async function GET() {
  return Response.json(await loadGoldReviewSnapshot(), { headers: { "Cache-Control": "no-store" } });
}

export async function PATCH(request: Request) {
  if (!authorized(request)) return Response.json({ error: "Access token required for gold review" }, { status: 401 });
  let body: { itemId?: unknown; pass?: unknown; status?: unknown; proposedGold?: unknown; reason?: unknown };
  try { body = await request.json(); }
  catch { return Response.json({ error: "Invalid JSON" }, { status: 400 }); }
  if (typeof body.itemId !== "string" || !["first", "second"].includes(body.pass as string) ||
      !["draft", "reviewed", "needs-correction", "ontology-review"].includes(body.status as string) ||
      (body.proposedGold !== undefined && typeof body.proposedGold !== "boolean") ||
      (body.reason !== undefined && typeof body.reason !== "string")) {
    return Response.json({ error: "Invalid review action" }, { status: 400 });
  }
  try {
    await setGoldReview(body.itemId, body.pass as "first" | "second", body.status as ReviewAction,
      body.proposedGold as boolean | undefined, body.reason as string | undefined);
    return Response.json(await loadGoldReviewSnapshot(), { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Gold review failed" }, { status: 400 });
  }
}

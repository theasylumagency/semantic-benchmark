import { CONTRACTS } from "./contracts";
import type { BenchmarkItem, Prediction, ProviderId, RequestMeasure } from "./types";

type ProviderResponse = { predictions: Prediction[]; request: RequestMeasure; model: string; requestedModel?: string; reasoningEffort?: string };
type JevResponse = {
  model?: string;
  answers?: Record<string, { type: string; noul?: number }>;
  usage?: { input_tokens?: number; output_tokens?: number };
};

function num(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : null;
}

export function baselineConfiguration() {
  return {
    model: process.env.BASELINE_MODEL || "gpt-6-sol",
    reasoningEffort: process.env.BASELINE_REASONING_EFFORT || "xhigh",
  };
}

function cost(provider: ProviderId, input: number | null, output: number | null): number | null {
  const prefix = provider === "jev" ? "JEV" : "BASELINE";
  const inRate = Number(process.env[`${prefix}_INPUT_USD_PER_M`]);
  const outRate = Number(process.env[`${prefix}_OUTPUT_USD_PER_M`]);
  if (!process.env[`${prefix}_INPUT_USD_PER_M`] || !process.env[`${prefix}_OUTPUT_USD_PER_M`] ||
    !Number.isFinite(inRate) || !Number.isFinite(outRate) || input === null || output === null) return null;
  return (input * inRate + output * outRate) / 1_000_000;
}

async function postJson(url: string, apiKey: string, body: unknown, timeoutMs = 30000): Promise<unknown> {
  for (let attempt = 0; attempt < 3; attempt++) {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(timeoutMs),
      cache: "no-store",
    });
    if (response.ok) return response.json();
    if ((response.status === 429 || response.status === 529) && attempt < 2) {
      await new Promise((resolve) => setTimeout(resolve, 500 * 2 ** attempt));
      continue;
    }
    throw new Error(`Provider HTTP ${response.status}: ${(await response.text()).slice(0, 240)}`);
  }
  throw new Error("Provider retry limit reached");
}

async function runJev(items: BenchmarkItem[]): Promise<ProviderResponse> {
  const key = process.env.JEV_API_KEY;
  if (!key) throw new Error("JEV_API_KEY is not configured");
  const model = process.env.JEV_MODEL || "jev-latest";
  const questions = Object.fromEntries(items.map((item) => [item.contract, {
    type: "noul",
    instructions: `ქართული სარეკლამო ტექსტის შეფასება. კითხვა, ჰიპოთეზა და მესამე პირის ციტატა ბრენდის მტკიცებად არ ჩათვალო. უარყოფის ფარგლები გაარჩიე: უარყოფილი სარეკლამო claim არ არის, მაგრამ უარყოფითად ნათქვამი შემოწმებადი მდგომარეობა შეიძლება ფაქტი იყოს. ${CONTRACTS[item.contract].description} არის თუ არა ეს მტკიცება ტექსტში?`,
    criteria: { true: CONTRACTS[item.contract].description, false: "ამ ტიპის მტკიცება ტექსტში არ არის" },
  }]));
  const started = performance.now();
  const raw = await postJson(process.env.JEV_API_URL || "https://api.typesafe.ai/v1/systemone", key, {
    model, state: { language: "ka", text: items[0].text }, questions,
  }) as JevResponse;
  const latencyMs = Math.round(performance.now() - started);
  const inputTokens = num(raw.usage?.input_tokens);
  const outputTokens = num(raw.usage?.output_tokens);
  const predictions = items.map((item): Prediction => {
    const answer = raw.answers?.[item.contract];
    const probabilityYes = num(answer?.noul);
    if (answer?.type !== "noul" || probabilityYes === null || probabilityYes > 1) {
      return { itemId: item.id, predicted: null, probabilityYes: null, confidence: null, error: "Missing or invalid Noul answer" };
    }
    return {
      itemId: item.id,
      predicted: probabilityYes >= 0.6 ? true : probabilityYes <= 0.4 ? false : null,
      probabilityYes,
      confidence: Math.max(probabilityYes, 1 - probabilityYes),
    };
  });
  return { model: raw.model || model, predictions, request: {
    groupId: items[0].groupId, latencyMs, inputTokens, outputTokens,
    costUsd: cost("jev", inputTokens, outputTokens),
  } };
}

async function runBaseline(items: BenchmarkItem[]): Promise<ProviderResponse> {
  const key = process.env.BASELINE_API_KEY;
  const { model, reasoningEffort } = baselineConfiguration();
  if (!key) throw new Error("BASELINE_API_KEY is not configured");
  const contracts = Object.fromEntries(items.map((item) => [item.contract, CONTRACTS[item.contract].description]));
  const contractIds = [...new Set(items.map((item) => item.contract))];
  const started = performance.now();
  const raw = await postJson(process.env.BASELINE_API_URL || "https://api.openai.com/v1/responses", key, {
    model,
    reasoning: { effort: reasoningEffort },
    input: [
      { role: "system", content: "Classify Georgian advertising text under the given narrow contracts. For every contract return YES, NO, or UNCERTAIN. Questions, hypotheticals, and attributed testimonials are not the brand's own claims. Distinguish a negated promotional claim from an asserted negative fact, such as closed availability or hours. Factual assertion and proof requirement are separate decisions. No explanations." },
      { role: "user", content: JSON.stringify({ text: items[0].text, contracts }) },
    ],
    text: { format: {
      type: "json_schema",
      name: "claim_decisions",
      strict: true,
      schema: {
        type: "object",
        properties: { answers: {
          type: "object",
          properties: Object.fromEntries(contractIds.map((id) => [id, { type: "string", enum: ["YES", "NO", "UNCERTAIN"] }])),
          required: contractIds,
          additionalProperties: false,
        } },
        required: ["answers"],
        additionalProperties: false,
      },
    } },
  }, 180000) as {
    model?: string;
    status?: string;
    incomplete_details?: { reason?: string };
    output?: { content?: { type?: string; text?: string; refusal?: string }[] }[];
    usage?: { input_tokens?: number; output_tokens?: number };
  };
  const latencyMs = Math.round(performance.now() - started);
  if (raw.status !== "completed") throw new Error(`Baseline response ${raw.status || "missing status"}: ${raw.incomplete_details?.reason || "no completed output"}`);
  const contentParts = raw.output?.flatMap((item) => item.content || []) || [];
  const refusal = contentParts.find((part) => part.type === "refusal");
  if (refusal) throw new Error(`Baseline refused: ${refusal.refusal || "no reason provided"}`);
  const content = contentParts.filter((part) => part.type === "output_text").map((part) => part.text || "").join("");
  if (!content) throw new Error("Baseline returned no output text");
  const parsed = JSON.parse(content) as { answers?: Record<string, string> };
  const inputTokens = num(raw.usage?.input_tokens);
  const outputTokens = num(raw.usage?.output_tokens);
  const predictions = items.map((item): Prediction => {
    const label = parsed.answers?.[item.contract];
    if (label !== "YES" && label !== "NO" && label !== "UNCERTAIN") {
      return { itemId: item.id, predicted: null, probabilityYes: null, confidence: null, error: "Missing or invalid baseline label" };
    }
    return { itemId: item.id, predicted: label === "UNCERTAIN" ? null : label === "YES", probabilityYes: null, confidence: null };
  });
  return { model: raw.model || model, requestedModel: model, reasoningEffort, predictions, request: {
    groupId: items[0].groupId, latencyMs, inputTokens, outputTokens,
    costUsd: cost("baseline", inputTokens, outputTokens),
  } };
}

export function providerAvailable(provider: ProviderId): boolean {
  return provider === "jev" ? Boolean(process.env.JEV_API_KEY) : Boolean(process.env.BASELINE_API_KEY);
}

export async function runGroup(provider: ProviderId, items: BenchmarkItem[]): Promise<ProviderResponse> {
  try { return provider === "jev" ? await runJev(items) : await runBaseline(items); }
  catch (error) {
    const message = error instanceof Error ? error.message : "Unknown provider error";
    return {
      model: provider === "jev" ? process.env.JEV_MODEL || "jev-latest" : baselineConfiguration().model,
      requestedModel: provider === "baseline" ? baselineConfiguration().model : undefined,
      reasoningEffort: provider === "baseline" ? baselineConfiguration().reasoningEffort : undefined,
      predictions: items.map((item) => ({ itemId: item.id, predicted: null, probabilityYes: null, confidence: null, error: message })),
      request: { groupId: items[0].groupId, latencyMs: 0, inputTokens: null, outputTokens: null, costUsd: null, error: message },
    };
  }
}

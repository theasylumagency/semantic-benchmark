// Local smoke-test fixture only. Never use these synthetic answers as benchmark evidence.
import { createServer } from "node:http";

const port = Number(process.env.MOCK_BASELINE_PORT || 3998);
createServer(async (request, response) => {
  if (request.method !== "POST" || request.url !== "/v1/responses") {
    response.writeHead(404).end();
    return;
  }
  try {
    let body = "";
    for await (const chunk of request) body += chunk;
    const payload = JSON.parse(body);
    if (payload.model !== "gpt-6-sol" || payload.reasoning?.effort !== "xhigh" ||
        payload.text?.format?.type !== "json_schema" || payload.text.format.strict !== true) {
      response.writeHead(422).end("Wrong baseline configuration");
      return;
    }
    const keys = payload.text.format.schema.properties.answers.required;
    const answers = Object.fromEntries(keys.map((key) => [key, "NO"]));
    response.writeHead(200, { "Content-Type": "application/json" });
    response.end(JSON.stringify({
      model: "gpt-6-sol", status: "completed",
      output: [
        { type: "reasoning", summary: [] },
        { type: "message", role: "assistant", content: [{ type: "output_text", text: JSON.stringify({ answers }) }] },
      ],
      usage: { input_tokens: 100, output_tokens: 20 },
    }));
  } catch {
    response.writeHead(422).end("Invalid test request");
  }
}).listen(port, "127.0.0.1", () => console.log(`Mock baseline listening on ${port}`));

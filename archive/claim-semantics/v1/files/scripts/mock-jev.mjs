// Local smoke-test fixture only. Never use these synthetic answers as benchmark evidence.
import { createServer } from "node:http";

const port = Number(process.env.MOCK_JEV_PORT || 3999);
createServer(async (request, response) => {
  if (request.method !== "POST" || request.url !== "/v1/systemone") {
    response.writeHead(404).end();
    return;
  }
  try {
    let body = "";
    for await (const chunk of request) body += chunk;
    const payload = JSON.parse(body);
    const answers = Object.fromEntries(Object.keys(payload.questions).map((key) => [key, { type: "noul", noul: key === "priceClaim" ? 0.92 : 0.08 }]));
    response.writeHead(200, { "Content-Type": "application/json" });
    response.end(JSON.stringify({ model: "mock-jev", answers, usage: { input_tokens: 100, output_tokens: 10 } }));
  } catch {
    response.writeHead(422).end("Invalid test request");
  }
}).listen(port, "127.0.0.1", () => console.log(`Mock Jev listening on ${port}`));

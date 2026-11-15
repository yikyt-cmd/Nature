import assert from "node:assert/strict";
import { test } from "node:test";
import worker from "./index.mjs";

const appOrigin = "https://yikyt-cmd.github.io";

function makeRequest({ method = "POST", origin = appOrigin, body = "{}" } = {}) {
  return new Request("https://nature-fabric-ai.example.workers.dev/generate", {
    method,
    headers: {
      "Content-Type": "application/json",
      Origin: origin,
      "CF-Connecting-IP": "192.0.2.1"
    },
    body: method === "GET" || method === "HEAD" ? undefined : body
  });
}

function makeEnv({ allowed = true, apiKey = "test-key" } = {}) {
  return {
    ALLOWED_ORIGIN: appOrigin,
    OPENAI_API_KEY: apiKey,
    AI_RATE_LIMIT: {
      limit: async () => ({ success: allowed })
    }
  };
}

test("responds to Pages CORS preflight", async () => {
  const response = await worker.fetch(
    new Request("https://nature-fabric-ai.example.workers.dev/generate", {
      method: "OPTIONS",
      headers: { Origin: appOrigin }
    }),
    makeEnv()
  );
  assert.equal(response.status, 204);
  assert.equal(response.headers.get("Access-Control-Allow-Origin"), appOrigin);
});

test("allows the Pages origin and returns a generated background", async (t) => {
  const originalFetch = globalThis.fetch;
  let upstreamRequest;
  globalThis.fetch = async (url, options) => {
    upstreamRequest = { url, options };
    return Response.json({ data: [{ b64_json: "aW1hZ2U=" }] });
  };
  t.after(() => {
    globalThis.fetch = originalFetch;
  });

  const response = await worker.fetch(makeRequest(), makeEnv());
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("Access-Control-Allow-Origin"), appOrigin);
  assert.deepEqual(body, { imageBase64: "aW1hZ2U=", mimeType: "image/png" });
  assert.equal(upstreamRequest.url, "https://api.openai.com/v1/images/generations");
  const generationRequest = JSON.parse(upstreamRequest.options.body);
  assert.equal(generationRequest.model, "gpt-image-2.6-flare");
  assert.match(generationRequest.prompt, /cinnabar-red/i);
  assert.match(generationRequest.prompt, /seamless.*repeat/i);
  assert.match(generationRequest.prompt, /four-way repeat/i);
  assert.match(generationRequest.prompt, /two-way continuous/i);
  assert.match(generationRequest.prompt, /larger medallions.*smaller/i);
  assert.equal(upstreamRequest.options.headers.Authorization, "Bearer test-key");
});

test("rejects a request from an unapproved origin", async () => {
  const response = await worker.fetch(
    makeRequest({ origin: "https://example.com" }),
    makeEnv()
  );
  assert.equal(response.status, 403);
});

test("enforces the configured rate limit before calling OpenAI", async (t) => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => {
    throw new Error("OpenAI must not be called after rate limiting");
  };
  t.after(() => {
    globalThis.fetch = originalFetch;
  });

  const response = await worker.fetch(makeRequest(), makeEnv({ allowed: false }));
  assert.equal(response.status, 429);
});

test("rejects client-supplied prompts", async () => {
  const response = await worker.fetch(
    makeRequest({ body: JSON.stringify({ prompt: "override" }) }),
    makeEnv()
  );
  assert.equal(response.status, 400);
});

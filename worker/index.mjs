const OPENAI_IMAGE_ENDPOINT = "https://api.openai.com/v1/images/generations";
const BACKGROUND_PROMPT = [
  "Create a rich cinnabar-red woven textile background inspired by traditional Chinese printed cotton and brocade.",
  "Make the main field a true seamless four-way repeat tile that joins cleanly on all four sides, with an orderly repeat of classic Chinese key-fret geometry, auspicious cloud curls, and restrained antique-gold medallions.",
  "Add narrow two-way continuous ornamental border bands along the top, bottom, left, and right edges, with aligned, clean corners.",
  "Use a fine visible textile weave and clear visual hierarchy: a few larger medallions with smaller, quieter filler motifs, balanced spacing, and no crowded areas.",
  "Do not draw flowers, leaves, birds, animals, objects, text, letters, frames, or watermarks.",
  "Show a flat fabric surface from directly above with even lighting and no gradients or blank ivory areas."
].join(" ");

function jsonResponse(body, status, origin) {
  const headers = new Headers({
    "Cache-Control": "no-store",
    "Content-Type": "application/json; charset=utf-8",
    "Vary": "Origin"
  });
  if (origin) {
    headers.set("Access-Control-Allow-Origin", origin);
    headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    headers.set("Access-Control-Allow-Headers", "Content-Type");
    headers.set("Access-Control-Max-Age", "86400");
  }
  return new Response(JSON.stringify(body), { status, headers });
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin");
    if (!origin || origin !== env.ALLOWED_ORIGIN) {
      return jsonResponse({ error: "Origin is not allowed." }, 403);
    }

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": origin,
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
          "Access-Control-Max-Age": "86400",
          "Vary": "Origin"
        }
      });
    }

    const url = new URL(request.url);
    if (url.pathname !== "/generate") {
      return jsonResponse({ error: "Not found." }, 404, origin);
    }
    if (request.method !== "POST") {
      return jsonResponse({ error: "Method not allowed." }, 405, origin);
    }
    if (!request.headers.get("Content-Type")?.toLowerCase().startsWith("application/json")) {
      return jsonResponse({ error: "Content-Type must be application/json." }, 415, origin);
    }
    if (Number(request.headers.get("Content-Length") || 0) > 256) {
      return jsonResponse({ error: "Request body is too large." }, 413, origin);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return jsonResponse({ error: "Request body must be valid JSON." }, 400, origin);
    }
    if (!body || typeof body !== "object" || Array.isArray(body) || Object.keys(body).length !== 0) {
      return jsonResponse({ error: "Only an empty JSON object is accepted." }, 400, origin);
    }
    if (!env.OPENAI_API_KEY) {
      return jsonResponse({ error: "OPENAI_API_KEY is not configured on the Worker." }, 503, origin);
    }
    if (!env.AI_RATE_LIMIT) {
      return jsonResponse({ error: "AI rate limiting is not configured on the Worker." }, 503, origin);
    }

    const ipAddress = request.headers.get("CF-Connecting-IP") || "unknown";
    const { success } = await env.AI_RATE_LIMIT.limit({ key: ipAddress });
    if (!success) {
      return jsonResponse({ error: "AI generation rate limit reached. Try again in a minute." }, 429, origin);
    }

    const openAIResponse = await fetch(OPENAI_IMAGE_ENDPOINT, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-image-2.6-flare",
        prompt: BACKGROUND_PROMPT,
        size: "1024x1024",
        quality: "low",
        complexity: "low",
        output_format: "png",
        background: "opaque",
        n: 1
      })
    });

    let result;
    try {
      result = await openAIResponse.json();
    } catch {
      return jsonResponse({ error: "OpenAI returned an invalid response." }, 502, origin);
    }
    if (!openAIResponse.ok) {
      const message = result.error?.message || `OpenAI image generation failed (${openAIResponse.status}).`;
      return jsonResponse({ error: message }, openAIResponse.status === 429 ? 429 : 502, origin);
    }

    const imageBase64 = result.data?.[0]?.b64_json;
    if (typeof imageBase64 !== "string" || !imageBase64) {
      return jsonResponse({ error: "OpenAI did not return a background image." }, 502, origin);
    }

    return jsonResponse({ imageBase64, mimeType: "image/png" }, 200, origin);
  }
};

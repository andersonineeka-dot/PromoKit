// Cloudflare Pages Function
// Lives at: /api/generate
// Keeps the Anthropic API key on the server — never sent to the browser.
//
// Setup: in the Cloudflare Pages dashboard, go to your project ->
// Settings -> Environment variables -> add:
//   ANTHROPIC_API_KEY = sk-ant-...   (mark it "Encrypt")
// Then redeploy.

export async function onRequestPost(context) {
  const { request, env } = context;

  let body;
  try {
    body = await request.json();
  } catch (e) {
    return json({ error: "Invalid request body" }, 400);
  }

  const f = (body && body.form) || {};
  if (!f.name || !f.type || !f.offer) {
    return json({ error: "Missing required fields: name, type, offer" }, 400);
  }
  if (!env.ANTHROPIC_API_KEY) {
    return json({ error: "Server misconfigured: ANTHROPIC_API_KEY is not set" }, 500);
  }

  const system = `You are the content engine behind PromoKit, a marketing-kit generator for small businesses. Given a business and an offer, output ONLY a single valid JSON object (no markdown fences, no preamble) matching exactly this shape:
{
 "captions": [10 short strings, each a ready-to-post social caption, max ~20 words],
 "reels": [5 objects {"hook": string, "video": string, "caption": string, "cta": string}, each field max ~12 words],
 "facebook_post": string (max 40 words),
 "sms": string (max 30 words, include a reply keyword),
 "email": {"subject": string, "preview": string, "body": string (max 60 words), "cta": string},
 "flyer": {"headline": string, "subhead": string, "details": string, "cta": string},
 "hashtags": [8 short hashtags, no spaces],
 "week_plan": [7 objects {"day": "Monday".."Sunday", "action": string, max 12 words}]
}
Keep every field concise. Match the requested tone exactly. Be specific to the business, offer, and location — never generic. Output raw JSON only.`;

  const userMsg = `Business: ${f.name}
Type: ${f.type}
Location: ${f.location || "not specified"}
Target customer: ${f.audience || "general local customers"}
Offer: ${f.offer}
Brand tone: ${f.tone || "Friendly"}`;

  try {
    const upstream = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1200,
        system,
        messages: [{ role: "user", content: userMsg }]
      })
    });

    const data = await upstream.json();

    if (!upstream.ok) {
      return json({ error: data.error?.message || "Upstream API error" }, upstream.status);
    }

    const text = (data.content || []).map(b => b.text || "").join("\n").trim();
    const clean = text.replace(/^```json/i, "").replace(/```$/, "").trim();

    let campaign;
    try {
      campaign = JSON.parse(clean);
    } catch (e) {
      return json({ error: "Model returned invalid JSON" }, 502);
    }

    return json(campaign, 200);
  } catch (err) {
    return json({ error: err.message || "Unexpected server error" }, 500);
  }
}

function json(obj, status) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}

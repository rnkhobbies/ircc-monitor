// Cloudflare Pages Function at /api/visits.
// POST → increments the visit counter and returns the new total.
// GET  → returns the current total without incrementing.
//
// Storage: a single key "total" in the VISITS KV namespace (bound via
// wrangler.toml). KV is eventually consistent, so under heavy concurrent
// writes a few increments can be lost — acceptable for a visitor counter.

const KEY = "total";

async function readTotal(env) {
  const raw = await env.VISITS.get(KEY);
  return Number.parseInt(raw ?? "0", 10) || 0;
}

const jsonResponse = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      // No caching at the edge — we always need a fresh count.
      "Cache-Control": "no-store",
    },
  });

export async function onRequestGet({ env }) {
  try {
    const total = await readTotal(env);
    return jsonResponse({ total });
  } catch (e) {
    return jsonResponse({ error: String(e) }, 500);
  }
}

export async function onRequestPost({ env, request }) {
  try {
    // Ignore obvious bot/crawler User-Agents so the counter reflects humans.
    const ua = (request.headers.get("user-agent") ?? "").toLowerCase();
    const isBot = /bot|spider|crawl|preview|fetch|monitor|headless|lighthouse|wget|curl/.test(ua);

    const current = await readTotal(env);
    if (isBot) return jsonResponse({ total: current, counted: false });

    const next = current + 1;
    await env.VISITS.put(KEY, String(next));
    return jsonResponse({ total: next, counted: true });
  } catch (e) {
    return jsonResponse({ error: String(e) }, 500);
  }
}

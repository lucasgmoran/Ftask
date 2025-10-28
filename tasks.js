import { getStore } from "@netlify/blobs";

/** Simple JSON store by 'key'. */
export default async (req) => {
  const url = new URL(req.url);
  const method = req.method || "GET";

  // CORS (useful if you ever host client separately)
  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,PUT,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
  if (method === "OPTIONS") return new Response("", { headers: cors });

  const store = getStore("tasks-store");

  try {
    if (method === "GET") {
      const key = url.searchParams.get("key");
      if (!key) return json({ error: "key required" }, 400, cors);
      const raw = await store.get(key);
      const out = raw ? JSON.parse(raw) : { tasks: [] };
      return json(out, 200, cors);
    }

    if (method === "POST" || method === "PUT") {
      const body = await req.json().catch(() => ({}));
      const key = body.key || url.searchParams.get("key");
      const tasks = Array.isArray(body.tasks) ? body.tasks : [];
      if (!key) return json({ error: "key required" }, 400, cors);
      await store.setJSON(key, { tasks, updatedAt: Date.now() });
      return json({ ok: true }, 200, cors);
    }
  } catch (e) {
    return json({ error: String(e.message || e) }, 500, cors);
  }

  return json({ error: "Method Not Allowed" }, 405, cors);
};

function json(data, status = 200, extra = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json", ...extra },
  });
}

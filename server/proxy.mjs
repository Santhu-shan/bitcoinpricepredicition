import express from "express";
import cors from "cors";

const PORT = process.env.PROXY_PORT ? Number(process.env.PROXY_PORT) : 8787;
const app = express();

// In dev, Vite proxies same-origin requests so CORS isn't needed,
// but enabling it keeps direct calls to :8787 usable.
app.use(cors());

// Tiny in-memory cache to reduce rate limits.
let cache = {
  at: 0,
  ttlMs: 5 * 60 * 1000,
  key: "",
  payload: null,
};

function buildCryptoCompareUrl({ limit }) {
  // CryptoCompare returns a fixed set; we slice on our side.
  return `https://min-api.cryptocompare.com/data/v2/news/?lang=EN&categories=BTC,Blockchain,Cryptocurrency&excludeCategories=Sponsored&lTs=0`;
}

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, name: "btc-proxy", port: PORT, now: new Date().toISOString() });
});

app.get("/api/news", async (req, res) => {
  try {
    const limit = Math.min(100, Math.max(1, Number(req.query.limit ?? 25)));
    const url = buildCryptoCompareUrl({ limit });
    const key = `${url}|limit=${limit}`;

    const now = Date.now();
    if (cache.payload && cache.key === key && now - cache.at < cache.ttlMs) {
      res.setHeader("x-cache", "HIT");
      return res.json(cache.payload);
    }

    const r = await fetch(url, {
      headers: {
        "user-agent": "btc-forecaster-course-project/1.0",
        accept: "application/json",
      },
    });

    if (!r.ok) {
      return res.status(502).json({ error: "Upstream news API error", status: r.status });
    }

    const json = await r.json();
    const data = Array.isArray(json?.Data) ? json.Data.slice(0, limit) : [];

    const payload = {
      source: "cryptocompare",
      fetchedAt: new Date().toISOString(),
      items: data.map((n) => ({
        source: n.source_info?.name ?? n.source ?? "News",
        title: n.title ?? "",
        url: n.url ?? "",
        publishedAt: n.published_on ? new Date(n.published_on * 1000).toISOString() : new Date().toISOString(),
        body: n.body ?? "",
      })),
    };

    cache = { ...cache, at: now, key, payload };
    res.setHeader("x-cache", "MISS");
    return res.json(payload);
  } catch (e) {
    return res.status(500).json({ error: e?.message ?? "Proxy error" });
  }
});

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`[proxy] listening on http://localhost:${PORT}`);
});


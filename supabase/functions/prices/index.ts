import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const APP_ORIGIN = "https://georgioaboudiwan.github.io";
const secretKeys = (() => { try { return JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") || "{}"); } catch { return {}; } })();
const serviceKey = secretKeys.default || Object.values(secretKeys)[0] || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const sb = createClient(Deno.env.get("SUPABASE_URL")!, String(serviceKey || ""), { auth: { persistSession: false, autoRefreshToken: false } });
const cors = { "Access-Control-Allow-Origin": APP_ORIGIN, "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info", "Access-Control-Allow-Methods": "POST, OPTIONS", "Vary": "Origin" };
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json", "Cache-Control": "no-store" } });
const TTL = 10 * 60 * 1000;
const METALS: Record<string, string> = { gold: "XAU", silver: "XAG", platinum: "XPT" };
const KEY_RE = /^(metal|crypto|stock):([A-Za-z0-9.^=_-]{1,40})$/;
type Quote = { usd: number; chg: number | null };

const get = async (url: string) => {
  const r = await fetch(url, { headers: { "Accept": "application/json", "User-Agent": "Mozilla/5.0 BudgetSplit" }, signal: AbortSignal.timeout(6000) });
  if (!r.ok) throw new Error(String(r.status));
  return r.json();
};

async function metal(name: string): Promise<Quote | null> {
  const code = METALS[name];
  if (!code) return null;
  const d = await get(`https://api.gold-api.com/price/${code}`);
  const usd = Number(d?.price);
  return usd > 0 ? { usd, chg: null } : null;
}

async function cryptos(ids: string[]): Promise<Record<string, Quote>> {
  if (!ids.length) return {};
  const d = await get(`https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(ids.join(","))}&vs_currencies=usd&include_24hr_change=true`);
  const out: Record<string, Quote> = {};
  for (const id of ids) { const v = d?.[id]; if (v && Number(v.usd) >= 0) out[id] = { usd: Number(v.usd), chg: Number.isFinite(Number(v.usd_24h_change)) ? Number(v.usd_24h_change) : null }; }
  return out;
}

async function stock(sym: string): Promise<Quote | null> {
  const d = await get(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(sym)}?range=5d&interval=1d`);
  const m = d?.chart?.result?.[0]?.meta;
  let price = Number(m?.regularMarketPrice);
  if (!(price > 0)) return null;
  const prev = Number(m?.chartPreviousClose ?? m?.previousClose);
  let fx = 1;
  const raw = String(m?.currency || "USD");
  const pence = raw === "GBp" || raw === "GBX";
  if (pence) price = price / 100;
  const base = pence ? "GBP" : raw.toUpperCase();
  if (base !== "USD") {
    const r = await get(`https://query1.finance.yahoo.com/v8/finance/chart/${base}USD=X?range=1d&interval=1d`);
    fx = Number(r?.chart?.result?.[0]?.meta?.regularMarketPrice) || 0;
    if (!(fx > 0)) return null;
  }
  return { usd: price * fx, chg: prev > 0 ? ((Number(m.regularMarketPrice) - prev) / prev) * 100 : null };
}

Deno.serve(async req => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  if (req.method !== "POST") return json({ error: "method" }, 405);
  if (!serviceKey) return json({ error: "unavailable" }, 500);
  const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  if (!token) return json({ error: "auth" }, 401);
  const { data: who } = await sb.auth.getUser(token);
  if (!who?.user) return json({ error: "auth" }, 401);
  let body: Record<string, unknown> = {};
  try { body = await req.json(); } catch { return json({ error: "json" }, 400); }
  const keys = [...new Set((Array.isArray(body.keys) ? body.keys : []).map(k => String(k)).filter(k => KEY_RE.test(k)))].slice(0, 40);
  if (!keys.length) return json({ prices: {} });
  const { data: cached } = await sb.from("price_cache").select("key, usd, chg, at").in("key", keys);
  const out: Record<string, Quote & { at: string }> = {};
  const now = Date.now();
  for (const c of cached || []) if (now - new Date(c.at).getTime() < TTL) out[c.key] = { usd: c.usd, chg: c.chg, at: c.at };
  const missing = keys.filter(k => !out[k]);
  const fresh: Record<string, Quote> = {};
  const cryptoIds = missing.filter(k => k.startsWith("crypto:")).map(k => k.slice(7).toLowerCase());
  const jobs: Promise<void>[] = [];
  if (cryptoIds.length) jobs.push(cryptos(cryptoIds).then(r => { for (const [id, q] of Object.entries(r)) fresh["crypto:" + id] = q; }).catch(() => { }));
  for (const k of missing) {
    const [type, sym] = [k.slice(0, k.indexOf(":")), k.slice(k.indexOf(":") + 1)];
    if (type === "metal") jobs.push(metal(sym.toLowerCase()).then(q => { if (q) fresh[k] = q; }).catch(() => { }));
    if (type === "stock") jobs.push(stock(sym.toUpperCase()).then(q => { if (q) fresh[k] = q; }).catch(() => { }));
  }
  await Promise.all(jobs);
  const at = new Date().toISOString();
  const rows = Object.entries(fresh).map(([key, q]) => ({ key, usd: q.usd, chg: q.chg, at }));
  if (rows.length) await sb.from("price_cache").upsert(rows);
  for (const r of rows) out[r.key] = { usd: r.usd, chg: r.chg, at };
  for (const k of missing) if (!out[k]) { const old = (cached || []).find(c => c.key === k); if (old) out[k] = { usd: old.usd, chg: old.chg, at: old.at }; }
  return json({ prices: out });
});

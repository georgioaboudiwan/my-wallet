import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const secretKeys = (() => { try { return JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") || "{}"); } catch { return {}; } })();
const serviceKey = secretKeys.default || Object.values(secretKeys)[0] || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const sb = createClient(Deno.env.get("SUPABASE_URL")!, String(serviceKey || ""), { auth: { persistSession: false, autoRefreshToken: false } });
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });

const sha256 = async (text: string) => [...new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text)))].map(b => b.toString(16).padStart(2, "0")).join("");

Deno.serve(async req => {
  if (req.method !== "POST") return json({ error: "Use POST." }, 405);
  if (!serviceKey) return json({ error: "Not available." }, 500);
  let body: Record<string, unknown> = {};
  try { body = await req.json(); } catch { return json({ error: "Send JSON." }, 400); }
  const token = String(body.token || "");
  if (!/^[A-Za-z0-9_-]{40,64}$/.test(token)) return json({ error: "Not allowed." }, 401);
  const amount = Number(String(body.amount ?? "").replace(/\s/g, "").replace(",", "."));
  if (!Number.isFinite(amount) || amount <= 0 || amount >= 1e15) return json({ error: "Enter an amount above zero." }, 400);
  const note = String(body.note ?? "").trim().slice(0, 200) || null;

  const { data: owner } = await sb.from("quick_tokens").select("user_id").eq("token_hash", await sha256(token)).maybeSingle();
  if (!owner) return json({ error: "Not allowed." }, 401);
  const { count } = await sb.from("quick_inbox").select("id", { count: "exact", head: true }).eq("user_id", owner.user_id);
  if ((count ?? 0) >= 200) return json({ error: "Open the app first: too many entries are waiting." }, 429);
  const { error } = await sb.from("quick_inbox").insert({ user_id: owner.user_id, amount, note });
  return error ? json({ error: "Couldn't save. Try again." }, 500) : json({ ok: true, saved: amount });
});

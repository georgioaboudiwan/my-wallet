import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const APP_ORIGIN = "https://georgioaboudiwan.github.io";
const secretKeys = (() => { try { return JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") || "{}"); } catch { return {}; } })();
const serviceKey = secretKeys.default || Object.values(secretKeys)[0] || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const sb = createClient(Deno.env.get("SUPABASE_URL")!, String(serviceKey || ""), { auth: { persistSession: false, autoRefreshToken: false } });

const cors = {
  "Access-Control-Allow-Origin": APP_ORIGIN,
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Vary": "Origin"
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json", "Cache-Control": "no-store" } });

const te = new TextEncoder();
const b64 = (u8: Uint8Array) => { let s = ""; for (const b of u8) s += String.fromCharCode(b); return btoa(s); };
const unb64 = (s: string) => Uint8Array.from(atob(s), c => c.charCodeAt(0));

async function escrowKey(userId: string) {
  const base = await crypto.subtle.importKey("raw", te.encode(String(serviceKey)), "HKDF", false, ["deriveKey"]);
  return crypto.subtle.deriveKey({ name: "HKDF", hash: "SHA-256", salt: te.encode("wallet-escrow-v1"), info: te.encode(userId) }, base, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
}

async function removeReceipts(userId: string) {
  for (let i = 0; i < 20; i++) {
    const { data } = await sb.storage.from("receipts").list(userId, { limit: 1000 });
    if (!data || !data.length) return;
    await sb.storage.from("receipts").remove(data.map(f => `${userId}/${f.name}`));
  }
}

Deno.serve(async req => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  if (req.method !== "POST") return json({ error: "method" }, 405);
  if (!serviceKey) return json({ error: "Server key missing" }, 500);

  const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  if (!token) return json({ error: "Sign in first." }, 401);
  const { data: who } = await sb.auth.getUser(token);
  if (!who?.user || !who.user.email) return json({ error: "Sign in again." }, 401);

  let body: Record<string, unknown> = {};
  try { body = await req.json(); } catch { body = {}; }
  const action = String(body.action || "");
  const uid = who.user.id;

  if (action === "escrow-put") {
    const k = String(body.k || "");
    let raw: Uint8Array;
    try { raw = unb64(k); } catch { return json({ error: "Bad key." }, 400); }
    if (raw.length !== 32) return json({ error: "Bad key." }, 400);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ct = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, await escrowKey(uid), raw));
    const out = new Uint8Array(12 + ct.length);
    out.set(iv); out.set(ct, 12);
    const { error } = await sb.from("vault").update({ escrow: "e1." + b64(out) }).eq("user_id", uid);
    return error ? json({ error: "Couldn't save." }, 500) : json({ ok: true });
  }
  if (action === "escrow-clear") {
    const { error } = await sb.from("vault").update({ escrow: null }).eq("user_id", uid);
    return error ? json({ error: "Couldn't save." }, 500) : json({ ok: true });
  }
  if (action === "escrow-get") {
    const { data: row } = await sb.from("vault").select("escrow").eq("user_id", uid).maybeSingle();
    if (!row || typeof row.escrow !== "string" || !row.escrow.startsWith("e1.")) return json({ k: null });
    try {
      const raw = unb64(row.escrow.slice(3));
      const pt = new Uint8Array(await crypto.subtle.decrypt({ name: "AES-GCM", iv: raw.subarray(0, 12) }, await escrowKey(uid), raw.subarray(12)));
      return json({ k: b64(pt) });
    } catch { return json({ k: null }); }
  }
  if (action !== "delete") return json({ error: "Unknown action." }, 400);
  if (String(body.confirm || "") !== "DELETE") return json({ error: "Confirmation missing." }, 400);
  const providers = ((who.user.app_metadata as { providers?: string[] } | undefined)?.providers ?? []) as string[];
  const hasPassword = providers.includes("email");
  const password = String(body.password || "");
  if (hasPassword && (!password || password.length > 72)) return json({ error: "Enter your password." }, 400);

  const { data: admin } = await sb.from("admins").select("user_id").eq("user_id", who.user.id).maybeSingle();
  if (admin) return json({ error: "The admin account can't be deleted from the app." }, 400);

  if (hasPassword) {
    const check = createClient(Deno.env.get("SUPABASE_URL")!, String(serviceKey), { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: signed, error: signErr } = await check.auth.signInWithPassword({ email: who.user.email, password });
    if (signErr || signed?.user?.id !== who.user.id) return json({ error: "That password isn't correct." }, 403);
  }

  await removeReceipts(who.user.id).catch(() => {});
  const { error } = await sb.auth.admin.deleteUser(who.user.id);
  return error ? json({ error: "Couldn't delete the account. Try again." }, 500) : json({ ok: true });
});

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
  if (String(body.action || "") !== "delete") return json({ error: "Unknown action." }, 400);
  if (String(body.confirm || "") !== "DELETE") return json({ error: "Confirmation missing." }, 400);
  const password = String(body.password || "");
  if (!password || password.length > 72) return json({ error: "Enter your password." }, 400);

  const { data: admin } = await sb.from("admins").select("user_id").eq("user_id", who.user.id).maybeSingle();
  if (admin) return json({ error: "The admin account can't be deleted from the app." }, 400);

  const check = createClient(Deno.env.get("SUPABASE_URL")!, String(serviceKey), { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: signed, error: signErr } = await check.auth.signInWithPassword({ email: who.user.email, password });
  if (signErr || signed?.user?.id !== who.user.id) return json({ error: "That password isn't correct." }, 403);

  await removeReceipts(who.user.id).catch(() => {});
  const { error } = await sb.auth.admin.deleteUser(who.user.id);
  return error ? json({ error: "Couldn't delete the account. Try again." }, 500) : json({ ok: true });
});

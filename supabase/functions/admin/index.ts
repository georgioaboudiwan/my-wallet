import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const APP_ORIGIN = "https://georgioaboudiwan.github.io";
const secretKeys = (() => { try { return JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") || "{}"); } catch { return {}; } })();
const serviceKey = secretKeys.default || Object.values(secretKeys)[0] || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const sb = createClient(Deno.env.get("SUPABASE_URL")!, String(serviceKey || ""), { auth: { persistSession: false, autoRefreshToken: false } });
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const cors = {
  "Access-Control-Allow-Origin": APP_ORIGIN,
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Vary": "Origin"
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json", "Cache-Control": "no-store" } });

Deno.serve(async req => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  if (req.method !== "POST") return json({ error: "method" }, 405);
  if (!serviceKey) return json({ error: "Server key missing" }, 500);

  const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  if (!token) return json({ error: "Sign in first." }, 401);
  const { data: who } = await sb.auth.getUser(token);
  if (!who?.user) return json({ error: "Sign in again." }, 401);
  const { data: admin } = await sb.from("admins").select("user_id").eq("user_id", who.user.id).maybeSingle();
  if (!admin) return json({ error: "Not allowed." }, 403);

  let body: Record<string, unknown> = {};
  try { body = await req.json(); } catch { body = {}; }
  const action = String(body.action || "");

  if (action === "overview") {
    const [stats, list] = await Promise.all([sb.rpc("admin_stats"), sb.auth.admin.listUsers({ page: 1, perPage: 500 })]);
    if (stats.error || list.error) return json({ error: "Couldn't load the overview." }, 500);
    const perUser = (stats.data?.per_user ?? {}) as Record<string, unknown>;
    const users = list.data.users.map(u => ({
      id: u.id,
      email: u.email ?? "",
      created_at: u.created_at,
      last_sign_in_at: u.last_sign_in_at ?? null,
      banned_until: (u as { banned_until?: string }).banned_until ?? null,
      is_me: u.id === who.user.id,
      stats: perUser[u.id] ?? {}
    }));
    return json({ totals: stats.data?.totals ?? {}, cron: stats.data?.cron ?? null, reminder_calls: stats.data?.reminder_calls ?? null, users });
  }

  const id = String(body.user_id || "");
  if (!UUID.test(id)) return json({ error: "Unknown user." }, 400);
  if (id === who.user.id) return json({ error: "You can't do that to your own account." }, 400);

  if (action === "block" || action === "unblock") {
    const { error } = await sb.auth.admin.updateUserById(id, { ban_duration: action === "block" ? "876000h" : "none" });
    return error ? json({ error: "Couldn't update the account." }, 500) : json({ ok: true });
  }
  if (action === "delete") {
    if (String(body.confirm || "") !== "DELETE") return json({ error: "Confirmation missing." }, 400);
    const { error } = await sb.auth.admin.deleteUser(id);
    return error ? json({ error: "Couldn't delete the account." }, 500) : json({ ok: true });
  }
  return json({ error: "Unknown action." }, 400);
});

import { createClient } from "npm:@supabase/supabase-js@2.45.4";
import nodemailer from "npm:nodemailer@6.9.16";

const APP_URL = "https://georgioaboudiwan.github.io/my-wallet/";
const APP_ORIGIN = "https://georgioaboudiwan.github.io";
const secretKeys = (() => { try { return JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") || "{}"); } catch { return {}; } })();
const serviceKey = secretKeys.default || Object.values(secretKeys)[0] || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const sb = createClient(Deno.env.get("SUPABASE_URL")!, String(serviceKey || ""), { auth: { persistSession: false, autoRefreshToken: false } });
const GMAIL_USER = Deno.env.get("GMAIL_USER") || "";
const GMAIL_PASS = (Deno.env.get("GMAIL_APP_PASSWORD") || "").replace(/\s+/g, "");

const cors = {
  "Access-Control-Allow-Origin": APP_ORIGIN,
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Vary": "Origin"
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });
const esc = (s: string) => s.replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
const clean = (s: unknown, n: number) => String(s ?? "").replace(/[\u0000-\u001f\u007f<>]/g, "").replace(/\s+/g, " ").trim().slice(0, n);

const mailer = GMAIL_USER && GMAIL_PASS ? nodemailer.createTransport({ host: "smtp.gmail.com", port: 465, secure: true, auth: { user: GMAIL_USER, pass: GMAIL_PASS } }) : null;

Deno.serve(async req => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  if (req.method !== "POST") return json({ error: "method" }, 405);
  const cron = req.headers.get("x-cron-secret");
  if (cron) {
    const { data: k } = await sb.from("push_keys").select("cron_secret").eq("id", 1).single();
    if (!k || k.cron_secret !== cron) return json({ error: "unauthorized" }, 401);
    if (!mailer) return json({ emailed: false, reason: "setup" });
    try {
      await mailer.sendMail({ from: { name: "Tallyloop", address: GMAIL_USER }, to: GMAIL_USER, subject: "Tallyloop email test", text: "Invites from Tallyloop will be sent from this address." });
      return json({ emailed: true });
    } catch (e) { return json({ emailed: false, reason: "send", detail: String((e as Error)?.message || e).slice(0, 200) }); }
  }
  const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  if (!token) return json({ error: "unauthorized" }, 401);
  const { data: who } = await sb.auth.getUser(token);
  if (!who?.user) return json({ error: "unauthorized" }, 401);
  let body: Record<string, unknown> = {};
  try { body = await req.json(); } catch { body = {}; }
  const gid = String(body.group_id ?? "");
  const email = String(body.email ?? "").trim().toLowerCase();
  if (!/^[0-9a-f-]{36}$/i.test(gid) || email.length > 254 || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return json({ error: "Bad request." }, 400);
  const { data: me } = await sb.from("group_members").select("joined").eq("group_id", gid).eq("user_id", who.user.id).maybeSingle();
  if (!me?.joined) return json({ error: "Not allowed." }, 403);
  const { data: inv } = await sb.from("group_email_invites").select("id, emailed_at, created_at").eq("group_id", gid).eq("email", email).eq("invited_by", who.user.id).maybeSingle();
  if (!inv || inv.emailed_at || Date.now() - new Date(inv.created_at).getTime() > 15 * 60000) return json({ emailed: false, reason: "no-invite" });
  if (!mailer) return json({ emailed: false, reason: "setup" });
  const name = clean(body.name, 40) || clean(who.user.email?.split("@")[0], 40) || "Someone";
  const from = clean(who.user.email, 254);
  const existing = body.existing === true;
  const steps = existing
    ? "Open Tallyloop and go to People. You'll see the invite there. Tap Accept to join."
    : `Create your free account with this email address (${email}) and you'll see the invite in People.`;
  const text = `Hi,\n\n${name}${from ? ` (${from})` : ""} invited you to share expenses and loans with them on Tallyloop.\n\n${steps}\n\n${APP_URL}\n\nEverything in the group is encrypted. Only the people in it can read the amounts and notes.\n\nIf you don't know ${name}, you can ignore this email.`;
  const html = `<div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;font-size:16px;line-height:1.5;color:#14231d;max-width:520px">
<p>Hi,</p>
<p><b>${esc(name)}</b>${from ? ` (${esc(from)})` : ""} invited you to share expenses and loans with them on <b>Tallyloop</b>.</p>
<p>${esc(steps)}</p>
<p><a href="${APP_URL}" style="display:inline-block;background:#0f7a5c;color:#fff;text-decoration:none;padding:12px 22px;border-radius:999px;font-weight:600">Open Tallyloop</a></p>
<p style="color:#5b6b64;font-size:14px">Everything in the group is encrypted. Only the people in it can read the amounts and notes.<br>If you don't know ${esc(name)}, you can ignore this email.</p>
</div>`;
  try {
    await mailer.sendMail({ from: { name: "Tallyloop", address: GMAIL_USER }, to: email, replyTo: from || undefined, subject: `${name} invited you to Tallyloop`, text, html });
  } catch (e) {
    console.error("mail failed", String((e as Error)?.message || e).slice(0, 200));
    return json({ emailed: false, reason: "send" });
  }
  await sb.from("group_email_invites").update({ emailed_at: new Date().toISOString() }).eq("id", inv.id);
  return json({ emailed: true });
});

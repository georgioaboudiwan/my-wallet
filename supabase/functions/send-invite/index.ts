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
    let test: Record<string, unknown> = {};
    try { test = await req.json(); } catch { test = {}; }
    const previews = Array.isArray(test.previews) ? (test.previews as Record<string, unknown>[]).slice(0, 10) : [];
    const names = Array.isArray(test.templates) ? (test.templates as unknown[]).map(String).filter(n => /^[a-z_]{3,30}$/.test(n)).slice(0, 10) : [];
    const sample = (t: string) => t.replace(/\{\{ \.ConfirmationURL \}\}/g, APP_URL).replace(/\{\{ \.Email \}\}/g, GMAIL_USER).replace(/\{\{ \.NewEmail \}\}/g, "new.address@example.com").replace(/\{\{ \.Token \}\}/g, "482913");
    for (const n of names) {
      const base = `${APP_URL}supabase/email-templates/${n}`;
      const [h, sub] = await Promise.all([fetch(`${base}.html`).then(r => r.ok ? r.text() : ""), fetch(`${base}.subject.txt`).then(r => r.ok ? r.text() : n)]);
      if (h) previews.push({ subject: `[Preview] ${sub.trim()}`, html: sample(h) });
    }
    if (test.invites === true) {
      const t = await fetch(`${APP_URL}supabase/email-templates/group_invite.template.html`).then(r => r.ok ? r.text() : "");
      for (const has of [true, false]) if (t) {
        const v: Record<string, string> = {
          name: "Georgio", title: "Georgio invited you",
          intro: `<b>Georgio</b> <span style="color:#6d7f77;">(${esc(GMAIL_USER)})</span> wants to share expenses and loans with you on BudgetSplit. You'll both see the same history and who owes whom, and get notified when something changes.`,
          button: has ? "Open BudgetSplit" : "Create my account", url: APP_URL,
          steps: `<p class="tl-muted" style="margin:0 0 8px;font-size:15px;line-height:23px;color:#4f6159;">${has ? "Open BudgetSplit and go to <b>Split</b>. You'll see the invite there. Tap <b>Accept</b> to join." : "Sign up with <b>roudy@example.com</b>. The invite shows up in <b>Split</b> right after."}</p>`,
          reason: "Georgio sent this invite to roudy@example.com. If you don't know them, you can ignore this email."
        };
        previews.push({ subject: `[Preview] Georgio invited you to BudgetSplit (${has ? "has the app" : "new user"})`, html: t.replace(/\$\{(\w+)\}/g, (_, k) => v[k] ?? "") });
      }
    }
    try {
      if (!previews.length) await mailer.sendMail({ from: { name: "BudgetSplit", address: GMAIL_USER }, to: GMAIL_USER, subject: "BudgetSplit email test", text: "Invites from BudgetSplit will be sent from this address." });
      for (const p of previews) await mailer.sendMail({ from: { name: "BudgetSplit", address: GMAIL_USER }, to: GMAIL_USER, subject: clean(p.subject, 120), html: String(p.html ?? "").slice(0, 60000) });
      return json({ emailed: true, count: previews.length || 1 });
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
    ? "Open BudgetSplit and go to Split. You'll see the invite there. Tap Accept to join."
    : `Create your free account with this email address (${email}) and you'll see the invite in Split.`;
  const text = `Hi,\n\n${name}${from ? ` (${from})` : ""} invited you to share expenses and loans with them on BudgetSplit.\n\n${steps}\n\n${APP_URL}\n\nEverything in the group is encrypted. Only the people in it can read the amounts and notes.\n\nIf you don't know ${name}, you can ignore this email.`;
  const introHtml = `<b>${esc(name)}</b>${from ? ` <span style="color:#6d7f77;">(${esc(from)})</span>` : ""} wants to share expenses and loans with you on BudgetSplit. You'll both see the same history and who owes whom, and get notified when something changes.`;
  const stepsHtml = `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 8px;"><tr><td class="tl-muted" style="font-size:15px;line-height:23px;color:#4f6159;">${existing ? "Open BudgetSplit and go to <b>Split</b>. You'll see the invite there. Tap <b>Accept</b> to join." : `Sign up with <b>${esc(email)}</b>. The invite shows up in <b>Split</b> right after.`}</td></tr></table>`;
  const reasonHtml = `${esc(name)} sent this invite to ${esc(email)}. If you don't know them, you can ignore this email.`;
  const html = `<!doctype html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light dark">
<meta name="supported-color-schemes" content="light dark">
<title>${esc(name)} invited you</title>
<style>
  body,table,td,a{-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%}
  table,td{mso-table-lspace:0;mso-table-rspace:0}
  img{border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic}
  a.tl-btn:hover{background:#0c7359!important}
  @media (max-width:600px){
    .tl-card{border-radius:0!important}
    .tl-pad{padding-left:24px!important;padding-right:24px!important}
    .tl-title{font-size:26px!important;line-height:32px!important}
  }
  @media (prefers-color-scheme:dark){
    .tl-bg{background:#0a1412!important}
    .tl-card{background:#121d1a!important}
    .tl-ink{color:#eef5f1!important}
    .tl-muted{color:#9db1a8!important}
    .tl-box{background:#16251f!important;border-color:#1f3a30!important}
    .tl-line{border-color:#1f2e29!important}
  }
</style>
</head>
<body class="tl-bg" style="margin:0;padding:0;background:#eef3f0;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${esc(name)} wants to share with you on BudgetSplit.&#8202;&#847;&#8202;&#847;&#8202;&#847;&#8202;&#847;&#8202;&#847;&#8202;&#847;</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="tl-bg" style="background:#eef3f0;">
<tr><td align="center" style="padding:32px 12px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="tl-card" style="max-width:560px;background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 12px 40px rgba(11,59,58,.10);">
    <tr><td style="background:#0b3b3a;background-image:linear-gradient(135deg,#0b3b3a 0%,#0f8a6c 100%);padding:28px 36px 30px;" class="tl-pad">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
        <td style="vertical-align:middle;"><img src="https://georgioaboudiwan.github.io/my-wallet/icons/icon-192.png" width="44" height="44" alt="BudgetSplit" style="display:block;width:44px;height:44px;border-radius:12px;"></td>
        <td style="vertical-align:middle;padding-left:12px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:20px;font-weight:800;letter-spacing:-.3px;color:#ffffff;">BudgetSplit</td>
      </tr></table>
      <p style="margin:26px 0 6px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:12px;font-weight:700;letter-spacing:1.6px;text-transform:uppercase;color:#f6c453;">Shared with you</p>
      <h1 class="tl-title" style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:30px;line-height:36px;font-weight:800;letter-spacing:-.6px;color:#ffffff;">${esc(name)} invited you</h1>
    </td></tr>
    <tr><td class="tl-pad" style="padding:32px 36px 8px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
      <p class="tl-ink" style="margin:0 0 24px;font-size:17px;line-height:27px;color:#14231d;">${introHtml}</p>
      
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px;"><tr><td style="border-radius:999px;background:#0f8a6c;">
        <a class="tl-btn" href="${APP_URL}" target="_blank" style="display:inline-block;padding:16px 34px;border-radius:999px;background:#0f8a6c;font-size:17px;font-weight:700;color:#ffffff;text-decoration:none;">${existing ? "Open BudgetSplit" : "Create my account"}&nbsp;&rarr;</a>
      </td></tr></table>
      ${stepsHtml}
    </td></tr>
    <tr><td class="tl-pad" style="padding:8px 36px 28px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="tl-box" style="background:#f3f8f5;border:1px solid #e1ece6;border-radius:16px;"><tr>
        <td style="padding:16px 18px;font-size:14px;line-height:21px;" class="tl-muted"><span style="font-size:16px;">&#128274;</span>&nbsp; <span class="tl-muted" style="color:#4f6159;">Everything in the group is encrypted. Only the people in it can read the amounts and notes.</span></td>
      </tr></table>
    </td></tr>
    <tr><td class="tl-pad tl-line" style="padding:22px 36px 30px;border-top:1px solid #edf2ef;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
      <p class="tl-muted" style="margin:0 0 6px;font-size:13px;line-height:20px;color:#6d7f77;">${reasonHtml}</p>
      <p class="tl-muted" style="margin:0;font-size:13px;line-height:20px;color:#6d7f77;"><b style="color:#0f8a6c;">BudgetSplit</b> &middot; Budget, track spending, split bills and loans. &middot; <a href="https://georgioaboudiwan.github.io/my-wallet/" style="color:#0f8a6c;text-decoration:none;">Open the app</a></p>
    </td></tr>
  </table>
</td></tr>
</table>
</body>
</html>
`;
  try {
    await mailer.sendMail({ from: { name: "BudgetSplit", address: GMAIL_USER }, to: email, replyTo: from || undefined, subject: `${name} invited you to BudgetSplit`, text, html });
  } catch (e) {
    console.error("mail failed", String((e as Error)?.message || e).slice(0, 200));
    return json({ emailed: false, reason: "send" });
  }
  await sb.from("group_email_invites").update({ emailed_at: new Date().toISOString() }).eq("id", inv.id);
  return json({ emailed: true });
});

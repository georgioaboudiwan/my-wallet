const esc = (s: string) => s.replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
const clean = (s: unknown, n: number) => String(s ?? "").replace(/[\u0000-\u001f\u007f<>]/g, "").replace(/\s+/g, " ").trim().slice(0, n);
const FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";
const VER = /^\d{1,3}\.\d{1,3}\.\d{1,3}$/;

export type Release = { version: string; notes: { v: string; items: { title: string; text: string }[] }[] };

export function parseRelease(body: Record<string, unknown>): Release | null {
  const version = String(body.version ?? "");
  if (!VER.test(version) || !Array.isArray(body.notes)) return null;
  const notes = (body.notes as Record<string, unknown>[]).slice(0, 12).map(n => ({
    v: VER.test(String(n?.v)) ? String(n.v) : "",
    items: Array.isArray(n?.items) ? (n.items as Record<string, unknown>[]).slice(0, 8).map(i => ({ title: clean(i?.title, 80), text: clean(i?.text, 300) })).filter(i => i.title) : []
  })).filter(n => n.v && n.items.length);
  return notes.length ? { version, notes } : null;
}

export function renderRelease(r: Release, appUrl: string) {
  const count = r.notes.reduce((t, n) => t + n.items.length, 0);
  const blocks = r.notes.map(n => `
<tr><td class="rl-pad" style="padding:22px 32px 4px;font-family:${FONT};">
  <p style="margin:0 0 10px;"><span style="display:inline-block;padding:4px 11px;border-radius:99px;background:#e8f4ee;color:#0f8a6c;font-size:12px;font-weight:800;letter-spacing:.4px;">v${esc(n.v)}</span></p>
  ${n.items.map(i => `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 12px;"><tr>
    <td width="26" valign="top" style="padding-top:3px;"><div style="width:18px;height:18px;border-radius:50%;background:#0f8a6c;color:#ffffff;font-size:12px;line-height:18px;text-align:center;font-weight:800;">&#10003;</div></td>
    <td class="rl-ink" style="font-size:15.5px;line-height:23px;color:#14231d;"><b>${esc(i.title)}</b>${i.text ? `<br><span class="rl-muted" style="color:#4f6159;font-size:14.5px;">${esc(i.text)}</span>` : ""}</td>
  </tr></table>`).join("")}
</td></tr>`).join("");
  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light dark"><meta name="supported-color-schemes" content="light dark">
<title>BudgetSplit v${esc(r.version)} is live</title>
<style>
body,table,td,a{-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%}
@media (max-width:600px){.rl-card{border-radius:0!important}.rl-pad{padding-left:20px!important;padding-right:20px!important}}
@media (prefers-color-scheme:dark){.rl-bg{background:#0a1412!important}.rl-card{background:#121d1a!important}.rl-ink{color:#eef5f1!important}.rl-muted{color:#9db1a8!important}.rl-line{border-color:#1f2e29!important}}
</style></head>
<body class="rl-bg" style="margin:0;padding:0;background:#eef3f0;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${count} ${count === 1 ? "change is" : "changes are"} live for your users.&#8202;&#847;&#8202;&#847;&#8202;&#847;</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="rl-bg" style="background:#eef3f0;"><tr><td align="center" style="padding:32px 12px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="rl-card" style="max-width:560px;background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 12px 40px rgba(11,59,58,.10);">
<tr><td class="rl-pad" style="background:#0b3b3a;background-image:linear-gradient(135deg,#0b3b3a 0%,#0f8a6c 100%);padding:28px 32px 30px;font-family:${FONT};">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
    <td><img src="${appUrl}icons/icon-192.png" width="40" height="40" alt="BudgetSplit" style="display:block;width:40px;height:40px;border-radius:11px;"></td>
    <td style="padding-left:11px;font-size:19px;font-weight:800;color:#ffffff;">BudgetSplit</td>
  </tr></table>
  <p style="margin:24px 0 6px;font-size:12px;font-weight:700;letter-spacing:1.6px;text-transform:uppercase;color:#f6c453;">Admin · new version</p>
  <h1 style="margin:0;font-size:30px;line-height:36px;font-weight:800;letter-spacing:-.6px;color:#ffffff;">v${esc(r.version)} is live</h1>
  <p style="margin:8px 0 0;font-size:15px;color:#d6efe4;">${count} ${count === 1 ? "change" : "changes"} your users get the next time they open the app.</p>
</td></tr>
${blocks}
<tr><td class="rl-pad" style="padding:14px 32px 8px;font-family:${FONT};">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td style="border-radius:999px;background:#0f8a6c;">
    <a href="${appUrl}" target="_blank" style="display:inline-block;padding:15px 30px;border-radius:999px;background:#0f8a6c;font-size:16px;font-weight:700;color:#ffffff;text-decoration:none;">Open the app&nbsp;&rarr;</a>
  </td></tr></table>
</td></tr>
<tr><td class="rl-pad rl-line" style="padding:22px 32px 28px;border-top:1px solid #edf2ef;font-family:${FONT};">
  <p class="rl-muted" style="margin:14px 0 0;font-size:12.5px;line-height:19px;color:#6d7f77;">Sent only to you as the BudgetSplit admin. To tell your users, open Admin and tap “Announce this version”.</p>
</td></tr>
</table></td></tr></table></body></html>`;
  const text = `BudgetSplit v${r.version} is live\n\n${r.notes.map(n => `v${n.v}\n${n.items.map(i => `- ${i.title}${i.text ? `: ${i.text}` : ""}`).join("\n")}`).join("\n\n")}\n\n${appUrl}`;
  return { subject: `BudgetSplit v${r.version} is live · ${count} ${count === 1 ? "change" : "changes"}`, html, text };
}

const esc = (s: string) => s.replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
const clean = (s: unknown, n: number) => String(s ?? "").replace(/[\u0000-\u001f\u007f<>]/g, "").replace(/\s+/g, " ").trim().slice(0, n);
const num = (v: unknown) => { const n = Number(v); return Number.isFinite(n) && Math.abs(n) < 1e13 ? Math.round(n) : 0; };
const FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

export type Report = {
  month: string; cur: string; spent: number; income: number; plan: number; prevSpent: number; count: number; name: string;
  cats: { name: string; amount: number; budget: number; color: string }[];
  big: { name: string; note: string; amount: number; date: string } | null;
};

export function parseReport(body: Record<string, unknown>): Report | null {
  const month = String(body.month ?? "");
  const cur = String(body.cur ?? "");
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month) || !/^[A-Z]{3}$/.test(cur)) return null;
  const cats = Array.isArray(body.cats) ? (body.cats as Record<string, unknown>[]).slice(0, 5).map(c => ({
    name: clean(c?.name, 40) || "Uncategorized", amount: Math.max(0, num(c?.amount)), budget: Math.max(0, num(c?.budget)),
    color: /^#[0-9a-f]{6}$/i.test(String(c?.color)) ? String(c.color) : "#5b7083"
  })) : [];
  const b = body.big as Record<string, unknown> | null;
  const big = b && typeof b === "object" ? { name: clean(b.name, 40) || "Expense", note: clean(b.note, 60), amount: Math.max(0, num(b.amount)), date: /^\d{4}-\d{2}-\d{2}$/.test(String(b.date)) ? String(b.date) : "" } : null;
  return { month, cur, spent: Math.max(0, num(body.spent)), income: Math.max(0, num(body.income)), plan: Math.max(0, num(body.plan)), prevSpent: Math.max(0, num(body.prevSpent)), count: Math.max(0, Math.min(100000, num(body.count))), name: clean(body.name, 40), cats, big };
}

export function renderReport(r: Report, appUrl: string) {
  const fmt = (v: number) => { try { return new Intl.NumberFormat("en-US", { style: "currency", currency: r.cur, maximumFractionDigits: 0 }).format(v); } catch { return `${r.cur} ${Math.round(v).toLocaleString("en-US")}`; } };
  const label = new Date(`${r.month}-01T12:00:00Z`).toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
  const monthOnly = label.split(" ")[0];
  const net = r.income - r.spent;
  const change = r.prevSpent > 0 ? Math.round((r.spent - r.prevSpent) / r.prevSpent * 100) : null;
  const planLeft = r.plan > 0 ? r.plan - r.spent : null;
  const planPct = r.plan > 0 ? Math.min(100, Math.round(r.spent / r.plan * 100)) : 0;
  const top = Math.max(1, ...r.cats.map(c => Math.max(c.amount, c.budget)));
  const verdict = planLeft === null
    ? (net >= 0 ? `You kept ${fmt(net)} of what came in.` : `You spent ${fmt(-net)} more than came in.`)
    : planLeft >= 0 ? `You stayed ${fmt(planLeft)} under your plan. Nice work.` : `You went ${fmt(-planLeft)} over your plan.`;
  const tile = (title: string, value: string, color: string) => `<td width="33%" style="padding:0 5px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="br-box" style="background:#f3f8f5;border:1px solid #e1ece6;border-radius:16px;"><tr><td style="padding:14px 14px 12px;font-family:${FONT};"><div class="br-muted" style="font-size:12px;font-weight:700;letter-spacing:.6px;text-transform:uppercase;color:#6d7f77;">${title}</div><div style="margin-top:6px;font-size:20px;font-weight:800;letter-spacing:-.3px;color:${color};">${value}</div></td></tr></table></td>`;
  const catRows = r.cats.map(c => {
    const w = Math.max(4, Math.round(c.amount / top * 100));
    const over = c.budget > 0 && c.amount > c.budget;
    return `<tr><td style="padding:10px 0 2px;font-family:${FONT};">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
        <td class="br-ink" style="font-size:15px;font-weight:650;color:#14231d;"><span style="display:inline-block;width:10px;height:10px;border-radius:3px;background:${c.color};margin-right:8px;"></span>${esc(c.name)}</td>
        <td align="right" class="br-ink" style="font-size:15px;font-weight:750;color:${over ? "#c03e2d" : "#14231d"};white-space:nowrap;">${fmt(c.amount)}${c.budget ? `<span class="br-muted" style="font-weight:500;color:#6d7f77;font-size:13px;"> / ${fmt(c.budget)}</span>` : ""}</td>
      </tr></table>
      <div class="br-track" style="margin-top:7px;height:8px;border-radius:99px;background:#e6eeea;"><div style="width:${w}%;height:8px;border-radius:99px;background:${over ? "#e5483b" : c.color};"></div></div>
    </td></tr>`;
  }).join("");
  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light dark"><meta name="supported-color-schemes" content="light dark">
<title>Your ${esc(label)} summary</title>
<style>
body,table,td,a{-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%}table,td{mso-table-lspace:0;mso-table-rspace:0}
@media (max-width:600px){.br-card{border-radius:0!important}.br-pad{padding-left:20px!important;padding-right:20px!important}.br-big{font-size:40px!important}}
@media (prefers-color-scheme:dark){.br-bg{background:#0a1412!important}.br-card{background:#121d1a!important}.br-ink{color:#eef5f1!important}.br-muted{color:#9db1a8!important}.br-box{background:#16251f!important;border-color:#1f3a30!important}.br-track{background:#1f2e29!important}.br-line{border-color:#1f2e29!important}}
</style></head>
<body class="br-bg" style="margin:0;padding:0;background:#eef3f0;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(verdict)}&#8202;&#847;&#8202;&#847;&#8202;&#847;&#8202;&#847;</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="br-bg" style="background:#eef3f0;"><tr><td align="center" style="padding:32px 12px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="br-card" style="max-width:560px;background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 12px 40px rgba(11,59,58,.10);">
<tr><td class="br-pad" style="background:#0b3b3a;background-image:linear-gradient(135deg,#0b3b3a 0%,#0f8a6c 100%);padding:28px 32px 30px;font-family:${FONT};">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
    <td><img src="${appUrl}icons/icon-192.png" width="40" height="40" alt="BudgetSplit" style="display:block;width:40px;height:40px;border-radius:11px;"></td>
    <td style="padding-left:11px;font-size:19px;font-weight:800;color:#ffffff;">BudgetSplit</td>
  </tr></table>
  <p style="margin:24px 0 4px;font-size:12px;font-weight:700;letter-spacing:1.6px;text-transform:uppercase;color:#f6c453;">${esc(label)} summary</p>
  <p style="margin:0;font-size:15px;color:#cfe6dc;">${r.name ? `${esc(r.name)}, you` : "You"} spent</p>
  <p class="br-big" style="margin:2px 0 6px;font-size:46px;line-height:52px;font-weight:800;letter-spacing:-1.4px;color:#ffffff;">${fmt(r.spent)}</p>
  <p style="margin:0;font-size:15px;line-height:22px;color:#e4f2ec;">${esc(verdict)}${change !== null ? ` <span style="display:inline-block;margin-left:4px;padding:2px 9px;border-radius:99px;background:rgba(255,255,255,.16);font-size:13px;font-weight:700;color:#ffffff;">${change > 0 ? "▲" : change < 0 ? "▼" : "="} ${Math.abs(change)}% vs last month</span>` : ""}</p>
</td></tr>
<tr><td class="br-pad" style="padding:24px 27px 6px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
    ${tile("Came in", fmt(r.income), "#0f8a6c")}${tile("Went out", fmt(r.spent), "#c03e2d")}${tile(net >= 0 ? "Kept" : "Short", fmt(Math.abs(net)), net >= 0 ? "#0f8a6c" : "#c03e2d")}
  </tr></table>
</td></tr>
${r.plan > 0 ? `<tr><td class="br-pad" style="padding:18px 32px 4px;font-family:${FONT};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
    <td class="br-ink" style="font-size:15px;font-weight:700;color:#14231d;">${esc(monthOnly)} plan</td>
    <td align="right" style="font-size:14px;font-weight:700;color:${planLeft! >= 0 ? "#0f8a6c" : "#c03e2d"};">${planLeft! >= 0 ? `${fmt(planLeft!)} left` : `${fmt(-planLeft!)} over`}</td>
  </tr></table>
  <div class="br-track" style="margin-top:9px;height:10px;border-radius:99px;background:#e6eeea;"><div style="width:${planPct}%;height:10px;border-radius:99px;background:${planLeft! >= 0 ? "#0f8a6c" : "#e5483b"};"></div></div>
  <p class="br-muted" style="margin:8px 0 0;font-size:13px;color:#6d7f77;">${fmt(r.spent)} of ${fmt(r.plan)} · ${r.count} ${r.count === 1 ? "expense" : "expenses"}</p>
</td></tr>` : ""}
${r.cats.length ? `<tr><td class="br-pad" style="padding:22px 32px 4px;font-family:${FONT};">
  <p class="br-muted" style="margin:0 0 2px;font-size:12px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;color:#6d7f77;">Where it went</p>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${catRows}</table>
</td></tr>` : ""}
${r.big && r.big.amount ? `<tr><td class="br-pad" style="padding:20px 32px 0;font-family:${FONT};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="br-box" style="background:#fbf6ea;border:1px solid #f0e3c2;border-radius:16px;"><tr><td style="padding:14px 16px;">
    <div class="br-muted" style="font-size:12px;font-weight:700;letter-spacing:.6px;text-transform:uppercase;color:#9a7524;">Biggest expense</div>
    <div class="br-ink" style="margin-top:4px;font-size:16px;font-weight:700;color:#14231d;">${fmt(r.big.amount)} · ${esc(r.big.name)}</div>
    ${r.big.note || r.big.date ? `<div class="br-muted" style="margin-top:2px;font-size:13px;color:#6d7f77;">${[r.big.note ? esc(r.big.note) : "", r.big.date ? new Date(r.big.date + "T12:00:00Z").toLocaleDateString("en-US", { day: "numeric", month: "short", timeZone: "UTC" }) : ""].filter(Boolean).join(" · ")}</div>` : ""}
  </td></tr></table>
</td></tr>` : ""}
<tr><td class="br-pad" style="padding:26px 32px 8px;font-family:${FONT};">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td style="border-radius:999px;background:#0f8a6c;">
    <a href="${appUrl}" target="_blank" style="display:inline-block;padding:15px 30px;border-radius:999px;background:#0f8a6c;font-size:16px;font-weight:700;color:#ffffff;text-decoration:none;">See the details&nbsp;&rarr;</a>
  </td></tr></table>
</td></tr>
<tr><td class="br-pad br-line" style="padding:22px 32px 28px;border-top:1px solid #edf2ef;font-family:${FONT};">
  <p class="br-muted" style="margin:16px 0 0;font-size:12.5px;line-height:19px;color:#6d7f77;">Your app made this summary from your own entries and sent it only to you. Turn it off any time in Settings &rarr; Email.</p>
</td></tr>
</table></td></tr></table></body></html>`;
  const text = `Your ${label} summary\n\nSpent: ${fmt(r.spent)}\nCame in: ${fmt(r.income)}\n${verdict}\n\n${r.cats.map(c => `${c.name}: ${fmt(c.amount)}`).join("\n")}\n\n${appUrl}\n\nTurn this off in Settings → Email.`;
  return { subject: `Your ${label} summary: ${fmt(r.spent)} spent`, html, text };
}

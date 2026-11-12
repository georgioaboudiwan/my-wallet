import html
LOGO = "https://georgioaboudiwan.github.io/my-wallet/icons/icon-192.png"
APP = "https://georgioaboudiwan.github.io/my-wallet/"

def page(preheader, eyebrow, title, intro, button_text, button_url, after="", note="", footer_reason="", before=""):
    return f'''<!doctype html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light dark">
<meta name="supported-color-schemes" content="light dark">
<title>{title}</title>
<style>
  body,table,td,a{{-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%}}
  table,td{{mso-table-lspace:0;mso-table-rspace:0}}
  img{{border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic}}
  a.tl-btn:hover{{background:#0c7359!important}}
  @media (max-width:600px){{
    .tl-card{{border-radius:0!important}}
    .tl-pad{{padding-left:24px!important;padding-right:24px!important}}
    .tl-title{{font-size:26px!important;line-height:32px!important}}
  }}
  @media (prefers-color-scheme:dark){{
    .tl-bg{{background:#0a1412!important}}
    .tl-card{{background:#121d1a!important}}
    .tl-ink{{color:#eef5f1!important}}
    .tl-muted{{color:#9db1a8!important}}
    .tl-box{{background:#16251f!important;border-color:#1f3a30!important}}
    .tl-line{{border-color:#1f2e29!important}}
  }}
</style>
</head>
<body class="tl-bg" style="margin:0;padding:0;background:#eef3f0;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">{preheader}&#8202;&#847;&#8202;&#847;&#8202;&#847;&#8202;&#847;&#8202;&#847;&#8202;&#847;</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="tl-bg" style="background:#eef3f0;">
<tr><td align="center" style="padding:32px 12px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="tl-card" style="max-width:560px;background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 12px 40px rgba(11,59,58,.10);">
    <tr><td style="background:#0b3b3a;background-image:linear-gradient(135deg,#0b3b3a 0%,#0f8a6c 100%);padding:28px 36px 30px;" class="tl-pad">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
        <td style="vertical-align:middle;"><img src="{LOGO}" width="44" height="44" alt="BudgetSplit" style="display:block;width:44px;height:44px;border-radius:12px;"></td>
        <td style="vertical-align:middle;padding-left:12px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:20px;font-weight:800;letter-spacing:-.3px;color:#ffffff;">BudgetSplit</td>
      </tr></table>
      <p style="margin:26px 0 6px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:12px;font-weight:700;letter-spacing:1.6px;text-transform:uppercase;color:#f6c453;">{eyebrow}</p>
      <h1 class="tl-title" style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:30px;line-height:36px;font-weight:800;letter-spacing:-.6px;color:#ffffff;">{title}</h1>
    </td></tr>
    <tr><td class="tl-pad" style="padding:32px 36px 8px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
      <p class="tl-ink" style="margin:0 0 24px;font-size:17px;line-height:27px;color:#14231d;">{intro}</p>
      {before}
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px;"><tr><td style="border-radius:999px;background:#0f8a6c;">
        <a class="tl-btn" href="{button_url}" target="_blank" style="display:inline-block;padding:16px 34px;border-radius:999px;background:#0f8a6c;font-size:17px;font-weight:700;color:#ffffff;text-decoration:none;">{button_text}&nbsp;&rarr;</a>
      </td></tr></table>
      {after}
    </td></tr>
    {f"""<tr><td class="tl-pad" style="padding:8px 36px 28px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="tl-box" style="background:#f3f8f5;border:1px solid #e1ece6;border-radius:16px;"><tr>
        <td style="padding:16px 18px;font-size:14px;line-height:21px;" class="tl-muted"><span style="font-size:16px;">&#128274;</span>&nbsp; <span class="tl-muted" style="color:#4f6159;">{note}</span></td>
      </tr></table>
    </td></tr>""" if note else ""}
    <tr><td class="tl-pad tl-line" style="padding:22px 36px 30px;border-top:1px solid #edf2ef;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
      <p class="tl-muted" style="margin:0 0 6px;font-size:13px;line-height:20px;color:#6d7f77;">{footer_reason}</p>
      <p class="tl-muted" style="margin:0;font-size:13px;line-height:20px;color:#6d7f77;"><b style="color:#0f8a6c;">BudgetSplit</b> &middot; Budget, track spending, split bills and loans. &middot; <a href="{APP}" style="color:#0f8a6c;text-decoration:none;">Open the app</a></p>
    </td></tr>
  </table>
</td></tr>
</table>
</body>
</html>
'''

def fallback(url):
    return f'''<p class="tl-muted" style="margin:0 0 8px;font-size:13px;line-height:20px;color:#6d7f77;">Button not working? Copy this link into your browser:</p>
      <p style="margin:0 0 20px;font-size:13px;line-height:20px;word-break:break-all;"><a href="{url}" style="color:#0f8a6c;">{url}</a></p>'''

def code_block(token):
    return f'''<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px;"><tr><td class="tl-box tl-ink" style="background:#f3f8f5;border:1px solid #e1ece6;border-radius:16px;padding:18px 28px;font-family:'SF Mono',Menlo,Consolas,monospace;font-size:32px;font-weight:700;letter-spacing:8px;color:#0b3b3a;">{token}</td></tr></table>'''

T = {}
T["confirm_signup"] = ("Confirm your email for BudgetSplit", page(
  "One tap and your BudgetSplit account is ready.", "Welcome", "Confirm your email",
  "Thanks for joining BudgetSplit. Confirm this address and you can start tracking what you spend, planning your month and sharing with the people you trust.",
  "Confirm my email", "{{ .ConfirmationURL }}", fallback("{{ .ConfirmationURL }}"),
  "Your amounts, notes and names are encrypted on your phone before they're saved. Not even we can read them.",
  "You're getting this because someone signed up for BudgetSplit with {{ .Email }}. If it wasn't you, ignore this email."))
T["invite"] = ("You're invited to BudgetSplit", page(
  "Your BudgetSplit account is waiting.", "You're invited", "Join BudgetSplit",
  "You've been invited to BudgetSplit, the simple way to track spending, plan your month, and lend, borrow and split with others.",
  "Accept the invite", "{{ .ConfirmationURL }}", fallback("{{ .ConfirmationURL }}"),
  "Everything you add is encrypted on your phone. Only you, and the people you share with, can read it.",
  "This invite was sent to {{ .Email }}. If you weren't expecting it, you can ignore it."))
T["magic_link"] = ("Your BudgetSplit sign-in link", page(
  "Tap to sign in. The link works once.", "Sign in", "Here's your sign-in link",
  "Tap the button to sign in to BudgetSplit. The link works once and expires soon.",
  "Sign in to BudgetSplit", "{{ .ConfirmationURL }}", fallback("{{ .ConfirmationURL }}"),
  "Never share this link. Anyone who has it can sign in as you.",
  "Someone asked to sign in to BudgetSplit with {{ .Email }}. If it wasn't you, ignore this email. Your account is safe."))
T["change_email"] = ("Confirm your new email for BudgetSplit", page(
  "Confirm the change to your BudgetSplit email.", "Account", "Confirm your new email",
  "You asked to change your BudgetSplit email from <b>{{ .Email }}</b> to <b>{{ .NewEmail }}</b>. Confirm it to finish.",
  "Confirm new email", "{{ .ConfirmationURL }}", fallback("{{ .ConfirmationURL }}"),
  "If you didn't ask for this, don't tap the button and change your password right away.",
  "This email was sent because of a change request on your BudgetSplit account."))
T["reset_password"] = ("Reset your BudgetSplit password", page(
  "Choose a new password for BudgetSplit.", "Security", "Reset your password",
  "We got a request to reset the password for <b>{{ .Email }}</b>. Tap the button to choose a new one. The link expires soon.",
  "Choose a new password", "{{ .ConfirmationURL }}", fallback("{{ .ConfirmationURL }}"),
  "Your data stays encrypted. After the reset, the app unlocks it again on its own.",
  "Didn't ask for this? Ignore this email. Your password won't change."))
T["reauthentication"] = ("Your BudgetSplit confirmation code", page(
  "Your one-time code is inside.", "Security", "Confirm it's you",
  "Enter this code in BudgetSplit to continue. It works once and expires soon.",
  "Open BudgetSplit", APP, "",
  "Never share this code with anyone, even if they say they're from BudgetSplit.",
  "Requested for {{ .Email }}. If it wasn't you, change your password.", code_block("{{ .Token }}")))

for k, (subj, body) in T.items():
    open(f"{k}.html", "w").write(body)
    open(f"{k}.subject.txt", "w").write(subj + "\n")

invite = page("${name} wants to share with you on BudgetSplit.", "Shared with you", "${title}",
  "${intro}", "${button}", "${url}", "${steps}",
  "Everything in the group is encrypted. Only the people in it can read the amounts and notes.",
  "${reason}")
open("group_invite.template.html", "w").write(invite)
print("ok")

# My Wallet

A money app that installs on the phone home screen and works in any browser: balances in any currency, spending, a monthly plan with custom groups, budgets, savings goals, repeating entries, loans with private share pages, receipts, CSV import, daily reminders, and English, French and Arabic.

Live at https://georgioaboudiwan.github.io/my-wallet/

## How it is built

- `index.html`, `styles.css`, `app.js`, `i18n.js`: the whole app, no build step.
- `sw.js`: offline cache and push notifications.
- `supabase/*.sql`: database schema, row-level security, reminders, admin.
- `supabase/functions/send-reminder`: daily reminder push, with bills due tomorrow and the monthly summary.
- `supabase/functions/admin`: admin dashboard (users, block, delete).
- `supabase/functions/account`: lets a signed-in user delete their own account after re-entering the password.

## Setup

1. Create a Supabase project and run the files in `supabase/` in the SQL editor, starting with `schema.sql`.
2. Authentication: enable Email with password. Set Site URL and add the app address to Redirect URLs so password reset links return to the app.
3. Deploy the three functions in `supabase/functions/`.
4. Put the project URL and publishable key in `config.js`. Never put a secret or service key in this app.
5. Host the folder on GitHub Pages (main branch, root). On iPhone, open it in Safari and use Share, then Add to Home Screen.

## Notes

- Works offline: changes wait on the device and sync when back online.
- Exchange rates update once a day from open.er-api.com; a rate typed by hand stays until switched back to automatic.
- App lock uses the device's Face ID, Touch ID or passcode through WebAuthn. It locks the screen; it does not encrypt the local copy.

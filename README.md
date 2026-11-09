# My Wallet

A phone-first money app: balances in dollars and lira, spending, monthly plan, budgets, repeating entries and backups. It installs on the iPhone home screen and syncs through your own Supabase project.

## 1. Supabase

1. Create a project at supabase.com.
2. Open **SQL Editor**, paste `supabase/schema.sql` and run it.
3. **Authentication → Email Templates → Magic Link**: replace the body with:
   `Your code is {{ .Token }}`
   The app signs in with a 6-digit code, because a link would open Safari instead of the installed app.
4. **Authentication → URL Configuration**: set Site URL to your GitHub Pages address.
5. Copy **Project URL** and the **anon public** key from Project Settings → API into `config.js`.
6. After you sign in once, turn off **Authentication → Sign In / Providers → Allow new users to sign up** so nobody else can create an account.

Never put the `service_role` key in this app.

## 2. GitHub Pages

1. Push this folder to a GitHub repository.
2. **Settings → Pages**: deploy from the `main` branch, root folder.
3. Open the Pages address in Safari on the iPhone, tap **Share → Add to Home Screen**.

## Notes

- Works offline: changes wait on the phone and sync when you're back online.
- Exchange rate is set in Settings and saved on each entry.
- Settings → Your data exports a CSV and a full backup you can restore.

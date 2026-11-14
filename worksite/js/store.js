import { SUPABASE_URL, SUPABASE_KEY } from '../config.js';
import { addDays, iso, startOf } from './util.js';

const TABLES = { workers: 'ws_workers', sites: 'ws_sites', entries: 'ws_entries', payments: 'ws_payments' };
const FIELDS = {
  workers: ['name', 'phone', 'trade', 'daily_rate', 'active', 'notes'],
  sites: ['name', 'location', 'active'],
  entries: ['worker_id', 'site_id', 'day', 'status', 'days', 'hours', 'rate', 'note'],
  payments: ['worker_id', 'paid_on', 'amount', 'currency', 'lbp_amount', 'lbp_rate', 'method', 'note']
};
const BIZ_FIELDS = ['name', 'lbp_rate', 'hours_per_day', 'period', 'week_start', 'lang'];
const DEFAULT_BIZ = { name: '', lbp_rate: 89500, hours_per_day: 8, period: 'week', week_start: 1, lang: 'en' };

const pick = (row, keys) => Object.fromEntries(keys.filter(k => k in row).map(k => [k, row[k] === '' ? null : row[k]]));
const calcAmount = e => e.status === 'worked' ? Math.round(Number(e.days) * Number(e.rate) * 100) / 100 : 0;

export const configured = () => /^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(SUPABASE_URL) && SUPABASE_KEY.length > 20;

function cloudStore() {
  const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: 'pkce' }
  });
  const ok = ({ data, error }) => { if (error) throw error; return data; };

  async function all(table, order) {
    const out = [];
    for (let from = 0; ; from += 1000) {
      const rows = ok(await sb.from(table).select('*').order(order).range(from, from + 999));
      out.push(...rows);
      if (rows.length < 1000) return out;
    }
  }

  return {
    demo: false,
    onAuth: cb => sb.auth.onAuthStateChange((ev, s) => cb(ev, s)),
    session: async () => ok(await sb.auth.getSession()).session,
    signIn: async (email, password) => ok(await sb.auth.signInWithPassword({ email, password })),
    signUp: async (email, password) => ok(await sb.auth.signUp({ email, password, options: { emailRedirectTo: location.origin + location.pathname } })),
    reset: async email => ok(await sb.auth.resetPasswordForEmail(email, { redirectTo: location.origin + location.pathname })),
    updatePassword: async password => ok(await sb.auth.updateUser({ password })),
    signOut: async () => { await sb.auth.signOut(); },
    async load() {
      const [biz, workers, sites, entries, payments] = await Promise.all([
        sb.from('ws_business').select('*').maybeSingle().then(ok),
        all('ws_workers', 'name'), all('ws_sites', 'name'), all('ws_entries', 'day'), all('ws_payments', 'paid_on')
      ]);
      return { biz: biz || (await this.saveBiz(DEFAULT_BIZ)), workers, sites, entries, payments };
    },
    async saveBiz(row) {
      return ok(await sb.from('ws_business').upsert(pick(row, BIZ_FIELDS), { onConflict: 'owner_id' }).select().single());
    },
    async save(kind, row) {
      const data = pick(row, FIELDS[kind]);
      const q = row.id ? sb.from(TABLES[kind]).update(data).eq('id', row.id) : sb.from(TABLES[kind]).insert(data);
      return ok(await q.select().single());
    },
    async saveMany(kind, rows) {
      if (!rows.length) return [];
      const data = rows.map(r => pick(r, FIELDS[kind]));
      const opts = kind === 'entries' ? { onConflict: 'worker_id,day' } : undefined;
      return ok(await sb.from(TABLES[kind]).upsert(data, opts).select());
    },
    async remove(kind, id) { ok(await sb.from(TABLES[kind]).delete().eq('id', id)); }
  };
}

function demoStore() {
  const KEY = 'worksite_demo_v1';
  const read = () => { try { return JSON.parse(localStorage.getItem(KEY)); } catch { return null; } };
  const write = db => { try { localStorage.setItem(KEY, JSON.stringify(db)); } catch {} };
  const uid = () => crypto.randomUUID();
  let db = read() || seed();
  write(db);

  function seed() {
    const s = [
      { id: uid(), name: 'Achrafieh Villa', location: 'Achrafieh', active: true },
      { id: uid(), name: 'Jounieh Building', location: 'Jounieh', active: true }
    ];
    const w = [
      ['Hassan', 'Mason', 35], ['Elie', 'Electrician', 40], ['Mohammad', 'Helper', 20],
      ['Georges', 'Carpenter', 38], ['Ali', 'Painter', 28]
    ].map(([name, trade, daily_rate]) => ({ id: uid(), name, trade, daily_rate, phone: '', notes: '', active: true }));
    const entries = [], payments = [];
    const monday = startOf('week', iso(new Date()), 1);
    for (let d = -14; d < 7; d++) {
      const day = addDays(monday, d);
      const dow = new Date(day + 'T00:00').getDay();
      if (dow === 0) continue;
      w.forEach((wk, i) => {
        const future = day > iso(new Date());
        const r = (i * 7 + d * 3 + 20) % 10;
        let status = future ? 'planned' : r === 0 ? 'absent' : 'worked';
        let days = status === 'worked' ? (r === 1 || dow === 6 ? 0.5 : 1) : 0;
        let hours = null;
        if (status === 'worked' && r === 2) { days = 0.75; hours = 6; }
        const e = { id: uid(), worker_id: wk.id, site_id: s[i % 2].id, day, status, days, hours, rate: wk.daily_rate, note: '' };
        e.amount = calcAmount(e);
        entries.push(e);
      });
    }
    w.forEach((wk, i) => {
      payments.push({ id: uid(), worker_id: wk.id, paid_on: addDays(monday, -9), amount: wk.daily_rate * 5, currency: 'USD', method: 'cash', note: '' });
      if (i % 2 === 0) payments.push({ id: uid(), worker_id: wk.id, paid_on: addDays(monday, -2), amount: wk.daily_rate * 4, currency: 'LBP', lbp_amount: wk.daily_rate * 4 * 89500, lbp_rate: 89500, method: 'cash', note: '' });
    });
    return { biz: { ...DEFAULT_BIZ, name: 'Demo Contracting' }, workers: w, sites: s, entries, payments };
  }

  const clone = x => JSON.parse(JSON.stringify(x));
  const upsertLocal = (kind, row) => {
    const list = db[kind];
    let rec = row.id ? list.find(r => r.id === row.id) : null;
    if (kind === 'entries' && !rec) rec = list.find(r => r.worker_id === row.worker_id && r.day === row.day);
    const data = pick(row, FIELDS[kind]);
    if (rec) Object.assign(rec, data); else { rec = { id: uid(), ...data }; list.push(rec); }
    if (kind === 'entries') rec.amount = calcAmount(rec);
    return clone(rec);
  };

  return {
    demo: true,
    onAuth: () => {},
    session: async () => ({ user: { email: 'demo@worksite' } }),
    signOut: async () => { try { localStorage.removeItem(KEY); localStorage.removeItem('worksite_mode'); } catch {} },
    async load() { return clone(db); },
    async saveBiz(row) { db.biz = { ...db.biz, ...pick(row, BIZ_FIELDS) }; write(db); return clone(db.biz); },
    async save(kind, row) { const r = upsertLocal(kind, row); write(db); return r; },
    async saveMany(kind, rows) { const r = rows.map(x => upsertLocal(kind, x)); write(db); return r; },
    async remove(kind, id) {
      db[kind] = db[kind].filter(r => r.id !== id);
      if (kind === 'workers') { db.entries = db.entries.filter(e => e.worker_id !== id); db.payments = db.payments.filter(p => p.worker_id !== id); }
      if (kind === 'sites') db.entries.forEach(e => { if (e.site_id === id) e.site_id = null; });
      write(db);
    }
  };
}

export const createStore = demo => (demo || !configured() ? demoStore() : cloudStore());

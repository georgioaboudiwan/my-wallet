(() => {
  "use strict";

  const CFG = window.WALLET_CONFIG || {};
  const root = document.getElementById("app");
  const toastEl = document.getElementById("toast");
  const SVGNS = "http://www.w3.org/2000/svg";
  const TABLES = ["accounts", "categories", "transactions", "rules", "settings", "people", "loan_entries"];
  const COLS = {
    accounts: ["id", "user_id", "name", "currency", "kind", "opening_balance", "sort", "archived", "deleted_at"],
    categories: ["id", "user_id", "name", "kind", "bucket", "color", "budget", "sort", "deleted_at"],
    transactions: ["id", "user_id", "kind", "amount", "currency", "rate", "account_id", "to_account_id", "to_amount", "category_id", "note", "occurred_on", "rule_id", "deleted_at"],
    rules: ["id", "user_id", "kind", "amount", "currency", "account_id", "category_id", "note", "day", "next_on", "active", "deleted_at"],
    settings: ["id", "user_id", "data", "deleted_at"],
    people: ["id", "user_id", "name", "direction", "currency", "phone", "share_token", "sort", "deleted_at"],
    loan_entries: ["id", "user_id", "person_id", "amount", "note", "occurred_on", "deleted_at"]
  };
  const DEFAULTS = { sort: 0, archived: false, active: true, opening_balance: 0, color: "#5b7083", data: {} };
  const ID_RE = /^[A-Za-z0-9_:@.\-]{1,160}$/;
  const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
  const COLORS = ["#2e9e6b", "#3b7dd8", "#7a5cd6", "#d9a521", "#d9622b", "#d6455d", "#c2508f", "#1f9bb0", "#8a9a2b", "#5f6ad1", "#b5793a", "#5b7083"];
  const BUCKETS = {
    needs: { name: "Needs", color: "var(--needs)", about: "Rent, groceries, bills, generator, transport, health" },
    wants: { name: "Wants", color: "var(--wants)", about: "Eating out, shopping, going out, subscriptions, gifts" },
    savings: { name: "Savings", color: "var(--savings)", about: "Money moved to savings and loan repayments" }
  };
  const KIND_LABEL = { cash: "Cash", bank: "Bank", card: "Card", savings: "Savings" };
  const DEFAULT_CATS = [
    ["groceries", "Groceries", "expense", "needs", "#2e9e6b"],
    ["home", "Rent & home", "expense", "needs", "#3b7dd8"],
    ["bills", "Bills & internet", "expense", "needs", "#7a5cd6"],
    ["generator", "Generator & electricity", "expense", "needs", "#d9a521"],
    ["transport", "Fuel & transport", "expense", "needs", "#d9622b"],
    ["health", "Health", "expense", "needs", "#d6455d"],
    ["eating", "Eating out & coffee", "expense", "wants", "#c2508f"],
    ["shopping", "Shopping", "expense", "wants", "#1f9bb0"],
    ["fun", "Going out & fun", "expense", "wants", "#8a9a2b"],
    ["subs", "Subscriptions", "expense", "wants", "#5f6ad1"],
    ["gifts", "Gifts & family", "expense", "wants", "#b5793a"],
    ["debt", "Loan repayments", "expense", "savings", "#5b7083"],
    ["salary", "Salary", "income", null, "#2e9e6b"],
    ["freelance", "Freelance & side work", "income", null, "#3b7dd8"],
    ["giftsin", "Gifts received", "income", null, "#c2508f"],
    ["otherin", "Other income", "income", null, "#5b7083"]
  ];
  const ICONS = {
    home: "M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z",
    list: "M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01",
    chart: "M3 3v18h18M7 15l4-4 3 3 6-6",
    plan: "M12 3a9 9 0 1 0 9 9h-9zM15 2.6A9 9 0 0 1 21.4 9H15z",
    plus: "M12 5v14M5 12h14",
    gear: "M4 7h9M17 7h3M4 17h3M11 17h9M15 5v4M9 15v4",
    eye: "M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z",
    eyeOff: "M3 3l18 18M10.6 5.1A10 10 0 0 1 12 5c6.4 0 10 7 10 7a17 17 0 0 1-3.2 4.1M6.6 6.6A17 17 0 0 0 2 12s3.6 7 10 7a9.7 9.7 0 0 0 5.4-1.6",
    back: "M15 18l-6-6 6-6",
    fwd: "M9 18l6-6-6-6",
    close: "M18 6 6 18M6 6l12 12",
    search: "M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM21 21l-4.3-4.3",
    sync: "M20 12a8 8 0 0 1-14 5.3M4 12a8 8 0 0 1 14-5.3M18 3v4h-4M6 21v-4h4",
    cloudOff: "M3 3l18 18M8 8a5 5 0 0 0-.5 9H17M20.6 15.7A4 4 0 0 0 17 10h-1.3A7 7 0 0 0 11 6.1",
    swap: "M7 4 3 8l4 4M3 8h14M17 20l4-4-4-4M21 16H7",
    link: "M10 14a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1M14 10a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1",
    people: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8",
    chat: "M21 11.5a8.4 8.4 0 0 1-12.3 7.4L3 21l2.1-5.6A8.4 8.4 0 1 1 21 11.5z",
    warn: "M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"
  };

  const S = {
    uid: null, email: "", session: null, offline: false,
    data: Object.fromEntries(TABLES.map(t => [t, new Map()])),
    last: {}, outbox: [], syncing: false, syncError: false, syncedAt: null,
    hidden: false, view: "home", month: null,
    filter: { q: "", kind: "all", account: null }, limit: 150,
    restore: null, armed: null
  };
  let sb = null;
  let shell = null;
  let ver = 0;
  const memo = new Map();

  const h = (tag, props, ...kids) => {
    const el = document.createElement(tag);
    if (props) {
      for (const [k, v] of Object.entries(props)) {
        if (v == null || v === false) continue;
        if (k === "class") el.className = v;
        else if (k === "on") for (const [ev, fn] of Object.entries(v)) el.addEventListener(ev, fn);
        else if (k === "style") Object.assign(el.style, v);
        else if (k === "value" || k === "checked" || k === "disabled" || k === "readOnly" || k === "hidden") el[k] = v;
        else el.setAttribute(k, v === true ? "" : String(v));
      }
    }
    for (const kid of kids.flat(Infinity)) {
      if (kid == null || kid === false) continue;
      el.append(kid instanceof Node ? kid : String(kid));
    }
    return el;
  };
  const icon = (name, cls = "ico") => {
    const svg = document.createElementNS(SVGNS, "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("class", cls);
    svg.setAttribute("aria-hidden", "true");
    const path = document.createElementNS(SVGNS, "path");
    path.setAttribute("d", ICONS[name]);
    svg.append(path);
    return svg;
  };

  const pad = n => String(n).padStart(2, "0");
  const ymd = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const today = () => ymd(new Date());
  const thisMonth = () => today().slice(0, 7);
  const monthOf = s => String(s).slice(0, 7);
  const shiftMonth = (m, k) => { const [y, mo] = m.split("-").map(Number); return ymd(new Date(y, mo - 1 + k, 1)).slice(0, 7); };
  const daysInMonth = m => { const [y, mo] = m.split("-").map(Number); return new Date(y, mo, 0).getDate(); };
  const monthLabel = m => new Date(m + "-01T12:00:00").toLocaleDateString("en-GB", { month: "long", year: "numeric" });
  const monthShort = m => new Date(m + "-01T12:00:00").toLocaleDateString("en-GB", { month: "short" });
  const monthName = m => new Date(m + "-01T12:00:00").toLocaleDateString("en-GB", { month: "long" });
  const dayLabel = s => {
    if (s === today()) return "Today";
    if (s === ymd(new Date(Date.now() - 864e5))) return "Yesterday";
    const d = new Date(s + "T12:00:00");
    return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: s.slice(0, 4) === today().slice(0, 4) ? undefined : "numeric" });
  };
  const nextMonthDay = (s, day) => {
    const [y, m] = s.split("-").map(Number);
    const first = new Date(y, m, 1);
    const dim = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
    return ymd(new Date(first.getFullYear(), first.getMonth(), Math.min(day, dim)));
  };
  const newId = () => (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2));
  const ago = iso => {
    const s = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
    if (s < 60) return "just now";
    if (s < 3600) return `${Math.floor(s / 60)} min ago`;
    if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
    return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  };

  const fmt = (n, cur, opts = {}) => {
    if (S.hidden && !opts.show) return cur === "LBP" ? "LBP •••" : "$•••";
    const neg = n < 0;
    const a = Math.abs(Number(n) || 0);
    let s;
    if (cur === "LBP") {
      if (opts.compact && a >= 1e6) s = "LBP " + (a / 1e6).toLocaleString("en-US", { maximumFractionDigits: 1 }) + "M";
      else s = "LBP " + Math.round(a).toLocaleString("en-US");
    } else {
      const r = Math.round(a * 100) / 100;
      if (opts.compact && r >= 1e4) s = "$" + (r / 1e3).toLocaleString("en-US", { maximumFractionDigits: 1 }) + "k";
      else if (opts.whole) s = "$" + Math.round(r).toLocaleString("en-US");
      else s = "$" + r.toLocaleString("en-US", { minimumFractionDigits: r % 1 ? 2 : 0, maximumFractionDigits: 2 });
    }
    return (neg ? "−" : "") + s;
  };
  const usd = (n, opts) => fmt(n, "USD", opts);
  const parseAmt = raw => {
    const s = String(raw || "").replace(/[,\s$]/g, "");
    if (!/^\d+(\.\d{1,2})?$/.test(s)) return null;
    const v = Number(s);
    return v > 0 && v < 1e13 ? v : null;
  };
  const parseSigned = raw => {
    const s = String(raw || "").replace(/[,\s$]/g, "").replace("−", "-");
    if (s === "") return 0;
    if (!/^-?\d+(\.\d{1,2})?$/.test(s)) return null;
    const v = Number(s);
    return Math.abs(v) < 1e13 ? v : null;
  };

  const lsKey = k => `wallet:v1:${S.uid}:${k}`;
  const store = {
    get(k, fallback) {
      try { const v = localStorage.getItem(lsKey(k)); return v == null ? fallback : JSON.parse(v); } catch { return fallback; }
    },
    set(k, v) {
      try { localStorage.setItem(lsKey(k), JSON.stringify(v)); return true; } catch { return false; }
    }
  };
  let persistTimer = null;
  const persist = () => {
    const ok = store.set("data", Object.fromEntries(TABLES.map(t => [t, [...S.data[t].values()]])))
      && store.set("last", S.last) && store.set("outbox", S.outbox);
    if (!ok) toast("This phone is out of space for the app. Export a backup in Settings.");
  };
  const save = () => { clearTimeout(persistTimer); persistTimer = setTimeout(persist, 120); };
  const loadCache = () => {
    const d = store.get("data", {});
    for (const t of TABLES) S.data[t] = new Map((Array.isArray(d[t]) ? d[t] : []).filter(r => r && r.id).map(r => [r.id, r]));
    S.last = store.get("last", {});
    S.outbox = store.get("outbox", []);
    S.syncedAt = store.get("syncedAt", null);
    S.hidden = store.get("hidden", false);
    ver++;
  };

  const rows = t => [...S.data[t].values()];
  const acc = id => S.data.accounts.get(id);
  const cat = id => S.data.categories.get(id);
  const settingsId = () => "settings:" + S.uid;
  const storedSettings = () => (S.data.settings.get(settingsId()) || {}).data || {};
  const settings = () => {
    const d = storedSettings();
    return {
      rate: Number(d.rate) > 0 ? Number(d.rate) : 89500,
      plan: d.plan && [d.plan.needs, d.plan.wants, d.plan.savings].every(Number.isFinite) ? d.plan : { needs: 50, wants: 30, savings: 20 },
      income: Number(d.income) > 0 ? Number(d.income) : 0,
      seeded: !!d.seeded,
      name: typeof d.name === "string" ? d.name : ""
    };
  };
  const bySort = (a, b) => (a.sort || 0) - (b.sort || 0) || a.name.localeCompare(b.name);
  const byRecent = (a, b) => b.occurred_on.localeCompare(a.occurred_on) || String(b.created_at || "").localeCompare(String(a.created_at || ""));
  const toUsd = (amount, currency, rate) => currency === "LBP" ? Number(amount) / (Number(rate) || settings().rate) : Number(amount);
  const txUsd = x => toUsd(x.amount, x.currency, x.rate);

  const putMany = items => {
    for (const { t, r } of items) {
      const full = { ...r, user_id: S.uid };
      if (full.deleted_at) S.data[t].delete(full.id); else S.data[t].set(full.id, full);
      S.outbox = S.outbox.filter(o => !(o.t === t && o.r.id === full.id));
      S.outbox.push({ t, r: full });
    }
    ver++;
    save();
    render();
    flushSoon();
  };
  const put = (t, r) => putMany([{ t, r }]);
  const removeRow = (t, r) => put(t, { ...r, deleted_at: new Date().toISOString() });
  const saveSettings = patch => put("settings", { id: settingsId(), data: { ...storedSettings(), ...patch } });

  const clean = (t, r) => Object.fromEntries(COLS[t].map(c => [c, r[c] ?? DEFAULTS[c] ?? null]));
  const isPermanent = e => !!e && ((typeof e.code === "string" && /^[0-9A-Z]{5}$/.test(e.code)) || (e.status >= 400 && e.status < 500 && ![401, 408, 429].includes(e.status)));
  let flushing = false;
  let flushTimer = null;
  const flushSoon = () => { clearTimeout(flushTimer); flushTimer = setTimeout(() => flush().then(renderStatus), 400); };

  async function upsert(t, list) {
    const { error } = await sb.from(t).upsert(list.map(o => clean(t, o.r)), { onConflict: "id" });
    if (error) throw error;
  }

  async function flush() {
    if (flushing || !sb || !S.session || !S.outbox.length || !navigator.onLine) return;
    flushing = true;
    try {
      while (S.outbox.length) {
        const t = S.outbox[0].t;
        const group = S.outbox.filter(o => o.t === t).slice(0, 200);
        try {
          await upsert(t, group);
        } catch (e) {
          if (!isPermanent(e)) throw e;
          for (const o of group) {
            try { await upsert(t, [o]); } catch (e2) {
              if (!isPermanent(e2)) throw e2;
              S.outbox = S.outbox.filter(x => x !== o);
              toast("One change couldn't be saved online and was skipped.");
              continue;
            }
            S.outbox = S.outbox.filter(x => x !== o);
          }
          save();
          continue;
        }
        S.outbox = S.outbox.filter(o => !group.includes(o));
        save();
      }
      S.syncError = false;
    } catch {
      S.syncError = true;
    } finally {
      flushing = false;
    }
  }

  async function pull() {
    for (const t of TABLES) {
      const since = S.last[t] ? new Date(new Date(S.last[t]).getTime() - 120000).toISOString() : "1970-01-01T00:00:00Z";
      let from = 0;
      let max = S.last[t] || null;
      for (;;) {
        const { data, error } = await sb.from(t).select("*").gte("updated_at", since).order("updated_at", { ascending: true }).order("id", { ascending: true }).range(from, from + 999);
        if (error) throw error;
        for (const r of data) {
          if (r.deleted_at) S.data[t].delete(r.id); else S.data[t].set(r.id, r);
          if (!max || r.updated_at > max) max = r.updated_at;
        }
        if (data.length < 1000) break;
        from += 1000;
      }
      if (max) S.last[t] = max;
    }
    for (const o of S.outbox) {
      if (o.r.deleted_at) S.data[o.t].delete(o.r.id); else S.data[o.t].set(o.r.id, o.r);
    }
    ver++;
  }

  async function sync() {
    if (S.syncing || !sb || !S.session || !navigator.onLine) return renderStatus();
    S.syncing = true;
    renderStatus();
    try {
      await flush();
      await pull();
      S.syncedAt = new Date().toISOString();
      store.set("syncedAt", S.syncedAt);
      S.syncError = false;
      ensureDefaults();
      runRules();
      save();
      render();
    } catch {
      S.syncError = true;
    } finally {
      S.syncing = false;
      renderStatus();
    }
  }

  function ensureDefaults() {
    if (settings().seeded) return;
    if (S.data.accounts.size || S.data.categories.size) return saveSettings({ seeded: true });
    const p = S.uid;
    const items = [];
    [["cash-usd", "Cash (dollars)", "USD", "cash"], ["cash-lbp", "Cash (lira)", "LBP", "cash"], ["bank", "Bank account", "USD", "bank"], ["savings", "Savings", "USD", "savings"]]
      .forEach(([k, name, currency, kind], i) => items.push({ t: "accounts", r: { id: `${p}:acc:${k}`, name, currency, kind, opening_balance: 0, sort: i, archived: false } }));
    DEFAULT_CATS.forEach(([k, name, kind, bucket, color], i) => items.push({ t: "categories", r: { id: `${p}:cat:${k}`, name, kind, bucket, color, budget: null, sort: i } }));
    items.push({ t: "settings", r: { id: settingsId(), data: { ...storedSettings(), seeded: true } } });
    putMany(items);
  }

  function runRules() {
    const t = today();
    const items = [];
    for (const r of rows("rules")) {
      if (!r.active || !acc(r.account_id) || !DATE_RE.test(r.next_on)) continue;
      let next = r.next_on;
      let n = 0;
      while (next <= t && n < 24) {
        const id = `${r.id}@${next}`;
        if (!S.data.transactions.has(id)) {
          items.push({ t: "transactions", r: { id, kind: r.kind, amount: Number(r.amount), currency: r.currency, rate: settings().rate, account_id: r.account_id, to_account_id: null, to_amount: null, category_id: r.category_id, note: r.note, occurred_on: next, rule_id: r.id, created_at: new Date().toISOString() } });
        }
        next = nextMonthDay(next, r.day);
        n++;
      }
      if (next !== r.next_on) items.push({ t: "rules", r: { ...r, next_on: next } });
    }
    if (items.length) putMany(items);
  }

  function balances() {
    const b = new Map(rows("accounts").map(a => [a.id, Number(a.opening_balance) || 0]));
    const add = (id, v) => b.set(id, (b.get(id) || 0) + v);
    for (const x of rows("transactions")) {
      const amt = Number(x.amount) || 0;
      if (x.kind === "income") add(x.account_id, amt);
      else if (x.kind === "expense") add(x.account_id, -amt);
      else {
        add(x.account_id, -amt);
        if (x.to_account_id) add(x.to_account_id, Number(x.to_amount) || 0);
      }
    }
    return b;
  }

  function monthStats(m) {
    const k = ver + ":" + m;
    if (memo.has(k)) return memo.get(k);
    const s = { spent: 0, income: 0, byCat: new Map(), buckets: { needs: 0, wants: 0, savings: 0 }, days: new Map(), biggest: null, count: 0 };
    for (const x of rows("transactions")) {
      if (monthOf(x.occurred_on) !== m) continue;
      const u = txUsd(x);
      if (x.kind === "expense") {
        s.spent += u;
        s.count++;
        s.byCat.set(x.category_id, (s.byCat.get(x.category_id) || 0) + u);
        const c = cat(x.category_id);
        s.buckets[c && BUCKETS[c.bucket] ? c.bucket : "wants"] += u;
        s.days.set(x.occurred_on, (s.days.get(x.occurred_on) || 0) + u);
        if (!s.biggest || u > txUsd(s.biggest)) s.biggest = x;
      } else if (x.kind === "income") {
        s.income += u;
      } else {
        const from = acc(x.account_id);
        const to = acc(x.to_account_id);
        if (to && to.kind === "savings" && !(from && from.kind === "savings")) s.buckets.savings += u;
      }
    }
    if (memo.size > 60) memo.clear();
    memo.set(k, s);
    return s;
  }

  function planFor(m) {
    const st = settings();
    const s = monthStats(m);
    const base = st.income > 0 ? st.income : s.income;
    return {
      base, fromActual: !(st.income > 0), s,
      buckets: ["needs", "wants", "savings"].map(k => ({ k, planned: base * st.plan[k] / 100, actual: s.buckets[k] }))
    };
  }

  function safeToSpend() {
    const m = thisMonth();
    const p = planFor(m);
    if (!(p.base > 0)) return null;
    const left = p.buckets.filter(b => b.k !== "savings").reduce((a, b) => a + b.planned - b.actual, 0);
    const daysLeft = daysInMonth(m) - Number(today().slice(8)) + 1;
    return { perDay: Math.max(0, left) / daysLeft, left, daysLeft };
  }

  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    clearTimeout(toast.t);
    toast.t = setTimeout(() => toastEl.classList.remove("show"), 2800);
  }

  function keepFocus(fn) {
    const a = document.activeElement;
    const id = a && a.id;
    let sel = null;
    try { if (a && typeof a.selectionStart === "number") sel = [a.selectionStart, a.selectionEnd]; } catch { sel = null; }
    fn();
    if (!id) return;
    const el = document.getElementById(id);
    if (el && el !== document.activeElement) {
      el.focus({ preventScroll: true });
      if (sel) try { el.setSelectionRange(sel[0], sel[1]); } catch { }
    }
  }

  function go(view) {
    S.view = view;
    S.armed = null;
    if (view === "insights" || view === "plan") S.month = S.month || thisMonth();
    render();
    window.scrollTo(0, 0);
  }

  const VIEWS = {
    home: { title: "Wallet", draw: viewHome },
    activity: { title: "Activity", draw: viewActivity },
    insights: { title: "Insights", draw: viewInsights },
    plan: { title: "Plan", draw: viewPlan },
    people: { title: "People", draw: viewPeople },
    settings: { title: "Settings", draw: viewSettings }
  };

  function buildShell() {
    const title = h("h1");
    const status = h("button", { type: "button", class: "status", on: { click: () => sync() } });
    const eye = h("button", { type: "button", class: "icon-btn", on: { click: () => { S.hidden = !S.hidden; store.set("hidden", S.hidden); render(); } } });
    const gear = h("button", { type: "button", class: "icon-btn", "aria-label": "Settings", on: { click: () => go("settings") } }, icon("gear"));
    const main = h("main", { class: "view" });
    const tab = (view, label, ic) => h("button", { type: "button", class: "tab", "data-view": view, on: { click: () => go(view) } }, icon(ic), label);
    const tabs = [tab("home", "Home", "home"), tab("activity", "Activity", "list"), tab("insights", "Insights", "chart"), tab("people", "People", "people")];
    const add = h("button", { type: "button", class: "tab add", "aria-label": "Add an entry", on: { click: () => txnSheet(null) } }, h("span", { class: "bubble" }, icon("plus")));
    const nav = h("nav", { class: "tabs", "aria-label": "Sections" }, tabs[0], tabs[1], add, tabs[2], tabs[3]);
    root.replaceChildren(h("div", { class: "shell" }, h("header", { class: "top" }, title, status, eye, gear), main, nav));
    shell = { title, status, eye, main, tabs };
  }

  function renderStatus() {
    if (!shell) return;
    const el = shell.status;
    const pending = S.outbox.length;
    let text = "";
    let ic = "sync";
    let cls = "status";
    let label;
    if (!navigator.onLine || S.offline) {
      ic = "cloudOff"; cls += " warn";
      text = pending ? `Offline · ${pending}` : "Offline";
      label = pending ? `Offline. ${pending} changes will sync when you're back online.` : "Offline. Showing your saved copy.";
    } else if (S.syncing) {
      cls += " spin"; label = "Syncing";
    } else if (S.syncError) {
      ic = "warn"; cls += " warn"; text = "Retry";
      label = "Couldn't sync. Tap to try again.";
    } else if (pending) {
      text = String(pending); label = `${pending} changes waiting to sync. Tap to sync now.`;
    } else {
      label = S.syncedAt ? `Synced ${ago(S.syncedAt)}. Tap to sync now.` : "Tap to sync now.";
    }
    el.className = cls;
    el.setAttribute("aria-label", label);
    el.title = label;
    el.replaceChildren(icon(ic), ...(text ? [h("span", null, text)] : []));
  }

  function render() {
    if (!CFG.supabaseUrl || !CFG.supabaseAnonKey) return renderSetup();
    if (!S.session && !S.offline) return renderAuth();
    if (!shell) buildShell();
    const v = VIEWS[S.view] || VIEWS.home;
    shell.title.textContent = v.title;
    shell.eye.replaceChildren(icon(S.hidden ? "eyeOff" : "eye"));
    shell.eye.setAttribute("aria-label", S.hidden ? "Show amounts" : "Hide amounts");
    keepFocus(() => shell.main.replaceChildren(v.draw()));
    for (const t of shell.tabs) t.setAttribute("aria-current", t.dataset.view === S.view ? "page" : "false");
    renderStatus();
  }

  function renderSetup() {
    shell = null;
    root.replaceChildren(h("div", { class: "auth" }, h("div", { class: "auth-box" },
      h("img", { class: "auth-mark", src: "icons/icon-192.png", alt: "" }),
      h("h1", null, "Almost ready"),
      h("p", null, "Add your Supabase project URL and anon key to ", h("code", null, "config.js"), ", then reload this page.")
    )));
  }

  function renderAuth() {
    shell = null;
    let mode = "signin";
    let busy = false;
    const box = h("form", { class: "auth-box", novalidate: true });
    const err = h("p", { class: "form-err", role: "alert" });
    const draw = () => {
      const create = mode === "create";
      const email = (document.getElementById("a-email") || {}).value || "";
      box.replaceChildren(
        h("img", { class: "auth-mark", src: "icons/icon-192.png", alt: "" }),
        h("h1", null, "My Wallet"),
        h("p", null, create ? "Create your account. Use a password you don't use anywhere else." : "Sign in to see your money."),
        h("label", { class: "field" }, h("span", null, "Email"), h("input", { id: "a-email", class: "input", type: "email", autocomplete: "username", inputmode: "email", required: true, value: email })),
        h("label", { class: "field" }, h("span", null, create ? "New password (at least 10 characters)" : "Password"), h("input", { id: "a-pass", class: "input", type: "password", autocomplete: create ? "new-password" : "current-password", required: true, minlength: "10", maxlength: "72" })),
        err,
        h("button", { class: "btn", type: "submit", disabled: busy }, busy ? "One moment…" : create ? "Create account" : "Sign in"),
        h("button", { class: "btn alt", type: "button", on: { click: () => { mode = create ? "signin" : "create"; err.textContent = ""; draw(); } } }, create ? "I already have an account" : "Create an account"));
    };
    box.addEventListener("submit", async ev => {
      ev.preventDefault();
      if (busy) return;
      err.textContent = "";
      if (!navigator.onLine) { err.textContent = "You're offline. Connect to the internet to sign in."; return; }
      const email = document.getElementById("a-email").value.trim().toLowerCase();
      const password = document.getElementById("a-pass").value;
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) { err.textContent = "Enter a valid email address."; return; }
      if (mode === "create" && (password.length < 10 || password.length > 72)) { err.textContent = "Use a password of at least 10 characters."; return; }
      if (!password) { err.textContent = "Enter your password."; return; }
      busy = true; draw();
      const res = mode === "create"
        ? await sb.auth.signUp({ email, password })
        : await sb.auth.signInWithPassword({ email, password });
      busy = false;
      if (res.error) {
        draw();
        const m = String(res.error.message || "");
        err.textContent = res.error.status === 429 ? "Too many tries. Wait a minute and try again."
          : /not allowed|disabled/i.test(m) ? "New accounts are turned off for this wallet."
          : /registered|exists/i.test(m) ? "That email already has an account. Sign in instead."
          : /confirm/i.test(m) ? "Confirm your email first, using the link Supabase sent you."
          : /weak|pwned|password/i.test(m) && mode === "create" ? "That password is too weak. Try a longer one."
          : mode === "create" ? "We couldn't create the account. Try again." : "Wrong email or password.";
        return;
      }
      if (!res.data.session) {
        mode = "signin"; draw();
        err.textContent = "Account created. Check your email to confirm it, then sign in.";
        return;
      }
      setSession(res.data.session);
      render();
      sync();
    });
    draw();
    root.replaceChildren(h("div", { class: "auth" }, box));
  }

  function txnRow(x) {
    const c = cat(x.category_id);
    const a = acc(x.account_id);
    let title, dot, sign = "", cls = "row-end";
    if (x.kind === "transfer") {
      const to = acc(x.to_account_id);
      title = `${a ? a.name : "Account"} → ${to ? to.name : "Account"}`;
      dot = h("span", { class: "dot neutral" }, icon("swap", "ico sm"));
    } else {
      title = c ? c.name : (x.kind === "income" ? "Income" : "Uncategorized");
      dot = h("span", { class: "dot", style: { background: c ? c.color : "#5b7083" } }, title.charAt(0).toUpperCase());
      sign = x.kind === "income" ? "+" : "−";
      if (x.kind === "income") cls += " pos";
    }
    const sub = [x.note, x.kind !== "transfer" && a ? a.name : null, x.rule_id ? "Monthly" : null].filter(Boolean).join(" · ");
    const toAcc = acc(x.to_account_id);
    const other = x.kind === "transfer" && toAcc && toAcc.currency !== x.currency && x.to_amount
      ? h("small", null, "→ " + fmt(Number(x.to_amount), toAcc.currency))
      : (x.currency === "LBP" ? h("small", null, "≈ " + usd(txUsd(x))) : null);
    return h("button", { type: "button", class: "row", on: { click: () => txnSheet(x) } },
      dot,
      h("span", { class: "row-main" }, h("span", { class: "row-title" }, title), sub ? h("span", { class: "row-sub" }, sub) : null),
      h("span", { class: cls }, sign + fmt(Number(x.amount), x.currency), other));
  }

  function viewHome() {
    const st = settings();
    const bal = balances();
    const m = thisMonth();
    const s = monthStats(m);
    const safe = safeToSpend();
    let total = 0, usdHold = 0, lbpHold = 0;
    for (const a of rows("accounts")) {
      const v = bal.get(a.id) || 0;
      if (a.currency === "LBP") { lbpHold += v; total += v / st.rate; } else { usdHold += v; total += v; }
    }
    const txns = rows("transactions").sort(byRecent);
    const accounts = rows("accounts").filter(a => !a.archived).sort(bySort);
    const out = h("div", { class: "stack" });

    out.append(h("section", { class: "hero" },
      h("p", { class: "hero-label" }, "Everything you have"),
      h("p", { class: "hero-total num" }, usd(total)),
      h("div", { class: "hero-hold" },
        h("span", { class: "num" }, usd(usdHold) + " in dollars"),
        h("span", { class: "num" }, fmt(lbpHold, "LBP", { compact: true }) + " in lira"))));

    out.append(h("div", { class: "tiles" },
      h("button", { type: "button", class: "tile", on: { click: () => { S.month = m; go("insights"); } } }, h("small", null, `Spent in ${monthName(m)}`), h("strong", null, usd(s.spent, { whole: true }))),
      h("button", { type: "button", class: "tile", on: { click: () => { S.month = m; go("insights"); } } }, h("small", null, "Came in"), h("strong", null, usd(s.income, { whole: true }))),
      safe
        ? h("button", { type: "button", class: "tile " + (safe.left >= 0 ? "good" : "bad"), on: { click: () => { S.month = m; go("plan"); } } }, h("small", null, "Safe to spend"), h("strong", null, usd(safe.perDay, { whole: true })), h("span", null, "per day"))
        : h("button", { type: "button", class: "tile", on: { click: () => go("plan") } }, h("small", null, "Safe to spend"), h("strong", null, "—"), h("span", null, "Set a plan"))));

    const alerts = rows("categories").filter(c => c.kind === "expense" && Number(c.budget) > 0)
      .map(c => ({ c, spent: s.byCat.get(c.id) || 0, budget: Number(c.budget) }))
      .filter(a => a.spent >= a.budget * 0.8)
      .sort((a, b) => b.spent / b.budget - a.spent / a.budget);
    for (const a of alerts.slice(0, 3)) {
      const over = a.spent > a.budget;
      out.append(h("div", { class: "alert" + (over ? " bad" : "") }, icon("warn"),
        h("span", null, over
          ? `${a.c.name} is ${usd(a.spent - a.budget, { whole: true })} over its ${usd(a.budget, { whole: true })} budget.`
          : `${a.c.name}: ${usd(a.spent, { whole: true })} of ${usd(a.budget, { whole: true })} used.`)));
    }

    if (!txns.length) {
      out.append(h("section", { class: "card" },
        h("div", { class: "card-head" }, h("h2", null, "Get started")),
        h("p", null, "1. Set how much is in each account now. 2. Add what you spend as you go. 3. Set your monthly plan."),
        h("button", { type: "button", class: "btn", on: { click: () => txnSheet(null) } }, "Add your first expense"),
        h("button", { type: "button", class: "btn alt", on: { click: () => go("settings") } }, "Set account balances")));
    }

    const accCard = h("section", { class: "card flush" }, h("div", { class: "card-head" }, h("h2", null, "Accounts"), h("button", { type: "button", class: "link-btn", on: { click: () => accountSheet(null) } }, "Add")));
    for (const a of accounts) {
      const v = bal.get(a.id) || 0;
      accCard.append(h("button", { type: "button", class: "row", on: { click: () => { S.filter = { q: "", kind: "all", account: a.id }; go("activity"); } } },
        h("span", { class: "dot neutral" }, a.currency === "LBP" ? "ل" : "$"),
        h("span", { class: "row-main" }, h("span", { class: "row-title" }, a.name), h("span", { class: "row-sub" }, KIND_LABEL[a.kind] || "")),
        h("span", { class: "row-end" + (v < 0 ? " neg" : "") }, fmt(v, a.currency), a.currency === "LBP" ? h("small", null, "≈ " + usd(v / st.rate, { whole: true })) : null)));
    }
    if (!accounts.length) accCard.append(h("p", { class: "empty" }, "No accounts yet."));
    out.append(accCard);

    if (txns.length) {
      const recent = h("section", { class: "card flush" }, h("div", { class: "card-head" }, h("h2", null, "Recent"), h("button", { type: "button", class: "link-btn", on: { click: () => { S.filter = { q: "", kind: "all", account: null }; go("activity"); } } }, "See all")));
      txns.slice(0, 5).forEach(x => recent.append(txnRow(x)));
      out.append(recent);
    }

    const lb = loanBalances();
    const people = rows("people");
    if (people.length) {
      let owed = 0, owe = 0;
      for (const p of people) { const v = toUsd(lb.get(p.id) || 0, p.currency, st.rate); if (owesMe(p)) owed += v; else owe += v; }
      out.append(h("section", { class: "card flush" }, h("button", { type: "button", class: "row", on: { click: () => go("people") } },
        h("span", { class: "dot neutral" }, icon("people", "ico sm")),
        h("span", { class: "row-main" }, h("span", { class: "row-title" }, "People"), h("span", { class: "row-sub" }, [owed ? `Owed to you ${usd(owed, { whole: true })}` : null, owe ? `You owe ${usd(owe, { whole: true })}` : null].filter(Boolean).join(" · ") || "All settled")),
        icon("fwd"))));
    }
    return out;
  }

  function viewActivity() {
    const out = h("div", { class: "stack" });
    const list = h("div", { class: "stack" });
    const search = h("input", { id: "q", type: "search", placeholder: "Search notes, categories, amounts", autocomplete: "off", enterkeyhint: "search", value: S.filter.q, "aria-label": "Search entries",
      on: { input: e => { S.filter.q = e.target.value; S.limit = 150; fill(); } } });
    const kinds = [["all", "All"], ["expense", "Expenses"], ["income", "Income"], ["transfer", "Transfers"]];
    const chips = h("div", { class: "chips" },
      kinds.map(([k, l]) => h("button", { type: "button", class: "chip", "aria-pressed": String(S.filter.kind === k), on: { click: () => { S.filter.kind = k; S.limit = 150; render(); } } }, l)),
      S.filter.account && acc(S.filter.account)
        ? h("button", { type: "button", class: "chip", "aria-pressed": "true", "aria-label": `Showing ${acc(S.filter.account).name} only. Tap to show all accounts.`, on: { click: () => { S.filter.account = null; render(); } } }, acc(S.filter.account).name, icon("close", "ico sm"))
        : null);

    function fill() {
      const q = S.filter.q.trim().toLowerCase();
      const matches = rows("transactions").filter(x => {
        if (S.filter.kind !== "all" && x.kind !== S.filter.kind) return false;
        if (S.filter.account && x.account_id !== S.filter.account && x.to_account_id !== S.filter.account) return false;
        if (!q) return true;
        const c = cat(x.category_id), a = acc(x.account_id), b = acc(x.to_account_id);
        return [x.note, c && c.name, a && a.name, b && b.name, String(x.amount)].some(v => v && String(v).toLowerCase().includes(q));
      }).sort(byRecent);
      if (!matches.length) {
        list.replaceChildren(h("p", { class: "empty" }, q || S.filter.kind !== "all" || S.filter.account ? "Nothing matches." : "No entries yet. Tap + to add one."));
        return;
      }
      const shown = matches.slice(0, S.limit);
      const groups = new Map();
      for (const x of shown) { if (!groups.has(x.occurred_on)) groups.set(x.occurred_on, []); groups.get(x.occurred_on).push(x); }
      const cards = [...groups].map(([d, xs]) => {
        const spent = xs.filter(x => x.kind === "expense").reduce((a, x) => a + txUsd(x), 0);
        return h("section", { class: "card flush day" },
          h("div", { class: "day-head" }, h("span", null, dayLabel(d)), spent ? h("span", { class: "num" }, "−" + usd(spent)) : null),
          xs.map(txnRow));
      });
      if (matches.length > shown.length) cards.push(h("button", { type: "button", class: "btn alt", on: { click: () => { S.limit += 300; fill(); } } }, `Show more (${matches.length - shown.length})`));
      list.replaceChildren(...cards);
    }
    fill();
    out.append(h("label", { class: "search" }, icon("search"), search), chips, list);
    return out;
  }

  function monthSwitcher() {
    const m = S.month || thisMonth();
    return h("div", { class: "month" },
      h("button", { type: "button", class: "icon-btn", "aria-label": "Previous month", on: { click: () => { S.month = shiftMonth(m, -1); render(); } } }, icon("back")),
      h("strong", null, monthLabel(m)),
      h("button", { type: "button", class: "icon-btn", "aria-label": "Next month", disabled: m >= thisMonth(), on: { click: () => { S.month = shiftMonth(m, 1); render(); } } }, icon("fwd")));
  }

  function viewInsights() {
    const m = S.month || thisMonth();
    const s = monthStats(m);
    const prevM = shiftMonth(m, -1);
    const prev = monthStats(prevM);
    const pl = settings().plan;
    const out = h("div", { class: "stack" }, monthSwitcher(), h("section", { class: "card flush" }, h("button", { type: "button", class: "row", on: { click: () => go("plan") } },
      h("span", { class: "dot neutral" }, icon("plan", "ico sm")),
      h("span", { class: "row-main" }, h("span", { class: "row-title" }, "Your plan and budgets"), h("span", { class: "row-sub" }, `Needs ${pl.needs}% · Wants ${pl.wants}% · Savings ${pl.savings}%`)),
      icon("fwd"))));
    const left = s.income - s.spent;
    let changeText = null;
    if (prev.spent > 0 && s.spent > 0) {
      const pct = Math.round((s.spent - prev.spent) / prev.spent * 100);
      changeText = pct === 0 ? `Same as ${monthName(prevM)}` : `${Math.abs(pct)}% ${pct > 0 ? "more" : "less"} than ${monthName(prevM)}`;
    }
    out.append(h("div", { class: "tiles" },
      h("div", { class: "tile" }, h("small", null, "Spent"), h("strong", null, usd(s.spent, { whole: true })), changeText ? h("span", null, changeText) : null),
      h("div", { class: "tile" }, h("small", null, "Came in"), h("strong", null, usd(s.income, { whole: true }))),
      h("div", { class: "tile " + (left >= 0 ? "good" : "bad") }, h("small", null, left >= 0 ? "Left over" : "Overspent"), h("strong", null, usd(Math.abs(left), { whole: true })))));

    const where = h("section", { class: "card flush" }, h("div", { class: "card-head" }, h("h2", null, "Where it went")));
    const cats = [...s.byCat].sort((a, b) => b[1] - a[1]);
    const maxCat = cats.length ? cats[0][1] : 1;
    if (!cats.length) where.append(h("p", { class: "empty" }, `No spending in ${monthName(m)}.`));
    for (const [id, v] of cats) {
      const c = cat(id);
      const color = c ? c.color : "#5b7083";
      where.append(h("button", { type: "button", class: "cat-row", on: { click: () => { S.filter = { q: c ? c.name : "", kind: "expense", account: null }; go("activity"); } } },
        h("div", { class: "cat-line" }, h("span", { class: "swatch", style: { background: color } }), h("span", { class: "name" }, c ? c.name : "Uncategorized"), h("span", { class: "val" }, usd(v, { whole: true })), h("span", { class: "pct" }, Math.round(v / s.spent * 100) + "%")),
        h("div", { class: "bar" }, h("span", { style: { width: (v / maxCat * 100) + "%", background: color } }))));
    }
    out.append(where);

    const months = [5, 4, 3, 2, 1, 0].map(k => shiftMonth(m, -k));
    const stats = months.map(mm => [mm, monthStats(mm)]);
    const max = Math.max(1, ...stats.flatMap(([, x]) => [x.spent, x.income]));
    const withData = stats.filter(([, x]) => x.spent > 0);
    const avg = withData.length ? withData.reduce((a, [, x]) => a + x.spent, 0) / withData.length : 0;
    out.append(h("section", { class: "card" },
      h("div", { class: "card-head" }, h("h2", null, "Last 6 months"), avg ? h("span", { class: "hint num" }, `Avg spent ${usd(avg, { whole: true })}`) : null),
      h("div", { class: "cols", role: "img", "aria-label": stats.map(([mm, x]) => `${monthName(mm)}: spent ${usd(x.spent, { whole: true, show: true })}, came in ${usd(x.income, { whole: true, show: true })}`).join(". ") },
        stats.map(([mm, x]) => h("div", { class: "col" + (mm === m ? " cur" : "") },
          h("div", { class: "col-bars" }, h("span", { class: "b-in", style: { height: (x.income / max * 100) + "%" } }), h("span", { class: "b-out", style: { height: (x.spent / max * 100) + "%" } })),
          h("span", { class: "col-label" }, monthShort(mm))))),
      h("div", { class: "legend" }, h("span", null, h("i", { class: "swatch b-out" }), "Spent"), h("span", null, h("i", { class: "swatch b-in" }), "Came in"))));

    const isCur = m === thisMonth();
    const daysSoFar = isCur ? Number(today().slice(8)) : daysInMonth(m);
    let noSpend = 0;
    for (let d = 1; d <= daysSoFar; d++) if (!s.days.has(`${m}-${pad(d)}`)) noSpend++;
    const big = s.biggest;
    const bigCat = big ? cat(big.category_id) : null;
    out.append(h("section", { class: "card" },
      h("div", { class: "card-head" }, h("h2", null, "Habits")),
      h("div", { class: "facts" },
        h("div", { class: "fact" }, h("small", null, "Per day"), h("strong", null, usd(s.spent / daysSoFar, { whole: true })), h("span", null, isCur ? "so far this month" : "on average")),
        h("div", { class: "fact" }, h("small", null, "Days with no spending"), h("strong", { class: "num" }, String(noSpend)), h("span", null, `of ${daysSoFar}`)),
        h("div", { class: "fact" }, h("small", null, "Biggest expense"), h("strong", null, big ? usd(txUsd(big), { whole: true }) : "—"), big ? h("span", null, [bigCat ? bigCat.name : "Uncategorized", big.note].filter(Boolean).join(" · ")) : null),
        h("div", { class: "fact" }, h("small", null, "Expenses logged"), h("strong", { class: "num" }, String(s.count)), h("span", null, s.count ? `avg ${usd(s.spent / s.count, { whole: true })}` : "")))));

    const total = s.buckets.needs + s.buckets.wants + s.buckets.savings;
    if (total > 0) {
      const plan = settings().plan;
      out.append(h("section", { class: "card" },
        h("div", { class: "card-head" }, h("h2", null, "How you divided it")),
        h("div", { class: "split", "aria-hidden": "true" }, ["needs", "wants", "savings"].filter(k => s.buckets[k] > 0).map(k => h("span", { style: { flex: `${s.buckets[k]} 1 0`, background: BUCKETS[k].color } }))),
        ["needs", "wants", "savings"].map(k => h("div", { class: "cat-line" },
          h("span", { class: "swatch", style: { background: BUCKETS[k].color } }),
          h("span", { class: "name" }, BUCKETS[k].name),
          h("span", { class: "val" }, usd(s.buckets[k], { whole: true })),
          h("span", { class: "pct" }, `${Math.round(s.buckets[k] / total * 100)}%`),
          h("span", { class: "pct" }, `plan ${plan[k]}%`)))));
    }
    return out;
  }

  function viewPlan() {
    const m = S.month || thisMonth();
    const st = settings();
    const p = planFor(m);
    const s = p.s;
    const out = h("div", { class: "stack" }, monthSwitcher());

    const incomeInput = h("input", { id: "p-income", class: "input num", inputmode: "decimal", placeholder: s.income ? String(Math.round(s.income)) : "e.g. 1500", value: st.income ? String(st.income) : "", autocomplete: "off",
      on: { change: e => { const raw = e.target.value.trim(); if (!raw) return saveSettings({ income: 0 }); const v = parseAmt(raw); if (!v) { toast("Enter your monthly income in dollars, like 1500."); e.target.value = st.income ? String(st.income) : ""; return; } saveSettings({ income: v }); toast("Monthly income saved."); } } });
    out.append(h("section", { class: "card" },
      h("div", { class: "card-head" }, h("h2", null, "Money to divide")),
      h("label", { class: "field" }, h("span", null, "Monthly income in dollars"), incomeInput),
      h("p", { class: "hint" }, st.income
        ? `You received ${usd(s.income, { whole: true })} in ${monthName(m)}.`
        : s.income ? `Empty, so the plan uses the ${usd(s.income, { whole: true })} you received in ${monthName(m)}.` : "Enter what you usually earn, or log your income and the plan will use it.")));

    const pctIds = { needs: "p-needs", wants: "p-wants", savings: "p-savings" };
    const sumEl = h("p", { class: "hint" });
    const pctInputs = {};
    const updateSum = () => {
      const vals = Object.fromEntries(Object.entries(pctInputs).map(([k, el]) => [k, Number(el.value)]));
      const sum = vals.needs + vals.wants + vals.savings;
      const ok = Object.values(vals).every(v => Number.isInteger(v) && v >= 0 && v <= 100) && sum === 100;
      sumEl.textContent = ok ? "Adds up to 100%." : `Adds up to ${Number.isFinite(sum) ? sum : "?"}%. Make it 100%.`;
      sumEl.className = ok ? "hint" : "form-err";
      return ok ? vals : null;
    };
    for (const k of ["needs", "wants", "savings"]) {
      pctInputs[k] = h("input", { id: pctIds[k], class: "input", inputmode: "numeric", value: String(st.plan[k]), autocomplete: "off", "aria-label": `${BUCKETS[k].name} percent`,
        on: { input: updateSum, change: () => { const v = updateSum(); if (v) saveSettings({ plan: v }); } } });
    }
    const presets = [[50, 30, 20], [60, 20, 20], [70, 20, 10], [40, 30, 30]];
    out.append(h("section", { class: "card" },
      h("div", { class: "card-head" }, h("h2", null, "How to divide it")),
      h("div", { class: "pct-grid" }, ["needs", "wants", "savings"].map(k => h("label", { class: "field" }, h("span", null, BUCKETS[k].name + " %"), pctInputs[k]))),
      sumEl,
      h("div", { class: "chips wrap" }, presets.map(([a, b, c]) => h("button", { type: "button", class: "chip", "aria-pressed": String(st.plan.needs === a && st.plan.wants === b && st.plan.savings === c),
        on: { click: () => saveSettings({ plan: { needs: a, wants: b, savings: c } }) } }, `${a} / ${b} / ${c}`))),
      h("p", { class: "hint" }, "50 / 30 / 20 is a common starting point. If rent and bills take most of your income, try 60 / 20 / 20 or 70 / 20 / 10.")));
    updateSum();

    if (m === thisMonth()) {
      const safe = safeToSpend();
      if (safe) out.append(h("section", { class: "safe" },
        h("small", null, "Safe to spend on needs and wants"),
        h("strong", null, usd(safe.perDay, { whole: true }) + " a day"),
        h("small", null, safe.left >= 0 ? `${usd(safe.left, { whole: true })} left for the next ${safe.daysLeft} days` : `You're ${usd(-safe.left, { whole: true })} over plan this month`)));
    }

    for (const b of p.buckets) {
      const info = BUCKETS[b.k];
      const leftover = b.planned - b.actual;
      const pct = b.planned > 0 ? b.actual / b.planned * 100 : 0;
      const isSave = b.k === "savings";
      out.append(h("section", { class: "card bucket" },
        h("div", { class: "bucket-head" }, h("h3", null, h("span", { class: "swatch", style: { background: info.color } }), info.name), h("span", { class: "val" }, `${usd(b.actual, { whole: true })} of ${usd(b.planned, { whole: true })}`)),
        h("div", { class: "bar" }, h("span", { class: !isSave && pct > 100 ? "over" : "", style: { width: Math.min(100, pct) + "%", background: info.color } })),
        h("p", null, info.about),
        p.base > 0 ? h("p", { class: "left" + (!isSave && leftover < 0 ? " bad" : "") }, isSave
          ? (leftover > 0 ? `Put aside ${usd(leftover, { whole: true })} more to hit your goal` : "Goal reached")
          : (leftover >= 0 ? `${usd(leftover, { whole: true })} left` : `${usd(-leftover, { whole: true })} over`)) : null));
    }

    const budgets = h("section", { class: "card flush" }, h("div", { class: "card-head" }, h("h2", null, "Category budgets")));
    const expenseCats = rows("categories").filter(c => c.kind === "expense").sort(bySort);
    for (const k of ["needs", "wants", "savings"]) {
      for (const c of expenseCats.filter(c => (c.bucket || "wants") === k)) {
        const spent = s.byCat.get(c.id) || 0;
        const budget = Number(c.budget) || 0;
        budgets.append(h("button", { type: "button", class: "cat-row", on: { click: () => categorySheet(c) } },
          h("div", { class: "cat-line" }, h("span", { class: "swatch", style: { background: c.color } }), h("span", { class: "name" }, c.name),
            h("span", { class: "val" }, budget ? `${usd(spent, { whole: true })} / ${usd(budget, { whole: true })}` : usd(spent, { whole: true }))),
          budget ? h("div", { class: "bar" }, h("span", { class: spent > budget ? "over" : "", style: { width: Math.min(100, spent / budget * 100) + "%", background: c.color } })) : h("small", null, "No budget · tap to set one")));
      }
    }
    const armed = S.armed === "suggest";
    budgets.append(h("button", { type: "button", class: "row-btn", on: { click: () => { if (armed) { S.armed = null; suggestBudgets(); } else { S.armed = "suggest"; render(); } } } },
      armed ? "Tap again to replace your budgets" : "Suggest budgets from my last 3 months"));
    out.append(budgets);
    return out;
  }

  function suggestBudgets() {
    const m = thisMonth();
    const base = planFor(m).base;
    if (!(base > 0)) return toast("Enter your monthly income first.");
    const avg = new Map();
    for (const mm of [1, 2, 3].map(k => shiftMonth(m, -k))) for (const [id, v] of monthStats(mm).byCat) avg.set(id, (avg.get(id) || 0) + v / 3);
    const plan = settings().plan;
    const items = [];
    for (const k of ["needs", "wants", "savings"]) {
      const cs = rows("categories").filter(c => c.kind === "expense" && (c.bucket || "wants") === k);
      if (!cs.length) continue;
      const planned = base * plan[k] / 100;
      const total = cs.reduce((a, c) => a + (avg.get(c.id) || 0), 0);
      for (const c of cs) {
        const share = total > 0 ? (avg.get(c.id) || 0) / total : 1 / cs.length;
        items.push({ t: "categories", r: { ...c, budget: Math.round(planned * share / 5) * 5 } });
      }
    }
    putMany(items);
    toast("Budgets set from your plan and recent spending.");
  }

  function viewSettings() {
    const st = settings();
    const bal = balances();
    const out = h("div", { class: "stack" });
    const group = (title, ...kids) => h("section", { class: "group" }, h("h2", { class: "group-title" }, title), h("div", { class: "card flush" }, ...kids));

    const pending = S.outbox.length;
    out.append(group("Sync",
      h("div", { class: "row" }, h("span", { class: "row-main" },
        h("span", { class: "row-title" }, !navigator.onLine ? "Offline" : S.syncError ? "Couldn't sync" : pending ? `${pending} changes waiting` : "Up to date"),
        h("span", { class: "row-sub" }, S.syncedAt ? `Last synced ${ago(S.syncedAt)}` : "Not synced yet"))),
      h("button", { type: "button", class: "row-btn", on: { click: () => sync() } }, "Sync now")));

    const rate = h("input", { id: "s-rate", class: "input num", inputmode: "numeric", value: st.rate.toLocaleString("en-US"), autocomplete: "off", "aria-label": "Lira for one dollar",
      on: { change: e => { const v = parseAmt(e.target.value); if (!v || v < 1000 || v > 1e7) { toast("Enter a rate like 89,500."); e.target.value = st.rate.toLocaleString("en-US"); return; } saveSettings({ rate: Math.round(v) }); toast("Rate saved."); } } });
    out.append(group("Exchange rate",
      h("div", { class: "row" }, h("span", { class: "row-main" }, h("span", { class: "row-title" }, "LBP for $1"), h("span", { class: "row-sub" }, "Used for new entries and totals")), h("span", { style: { width: "130px" } }, rate))));

    const accRows = rows("accounts").sort((a, b) => (a.archived - b.archived) || bySort(a, b)).map(a => h("button", { type: "button", class: "row", on: { click: () => accountSheet(a) } },
      h("span", { class: "dot neutral" }, a.currency === "LBP" ? "ل" : "$"),
      h("span", { class: "row-main" }, h("span", { class: "row-title" }, a.name), h("span", { class: "row-sub" }, [KIND_LABEL[a.kind], a.currency, a.archived ? "Hidden" : null].filter(Boolean).join(" · "))),
      h("span", { class: "row-end" }, fmt(bal.get(a.id) || 0, a.currency))));
    out.append(group("Accounts", ...accRows, h("button", { type: "button", class: "row-btn", on: { click: () => accountSheet(null) } }, "Add account")));

    const catRows = kind => rows("categories").filter(c => c.kind === kind).sort(bySort).map(c => h("button", { type: "button", class: "row", on: { click: () => categorySheet(c) } },
      h("span", { class: "dot", style: { background: c.color } }, c.name.charAt(0).toUpperCase()),
      h("span", { class: "row-main" }, h("span", { class: "row-title" }, c.name), h("span", { class: "row-sub" }, kind === "expense" ? [BUCKETS[c.bucket || "wants"].name, Number(c.budget) ? `${usd(Number(c.budget), { whole: true })} a month` : null].filter(Boolean).join(" · ") : "Income"))));
    out.append(group("Spending categories", ...catRows("expense"), h("button", { type: "button", class: "row-btn", on: { click: () => categorySheet(null, "expense") } }, "Add category")));
    out.append(group("Income categories", ...catRows("income"), h("button", { type: "button", class: "row-btn", on: { click: () => categorySheet(null, "income") } }, "Add category")));

    const rules = rows("rules").sort((a, b) => a.day - b.day);
    out.append(group("Every month",
      rules.length ? rules.map(r => {
        const c = cat(r.category_id);
        return h("button", { type: "button", class: "row", on: { click: () => ruleSheet(r) } },
          h("span", { class: "dot", style: { background: c ? c.color : "#5b7083" } }, String(r.day)),
          h("span", { class: "row-main" }, h("span", { class: "row-title" }, [c ? c.name : "Entry", r.note].filter(Boolean).join(" · ")), h("span", { class: "row-sub" }, r.active ? `Next on ${dayLabel(r.next_on)}` : "Paused")),
          h("span", { class: "row-end" + (r.kind === "income" ? " pos" : "") }, (r.kind === "income" ? "+" : "−") + fmt(Number(r.amount), r.currency)));
      }) : h("p", { class: "empty" }, "Nothing repeats yet. Turn on “Repeat every month” when you add rent, salary or a subscription.")));

    const nameIn = h("input", { id: "s-name", class: "input", maxlength: "40", autocomplete: "name", placeholder: "e.g. Georgio", value: st.name, "aria-label": "Your name",
      on: { change: e => { const v = e.target.value.trim().replace(/\s+/g, " ").slice(0, 40); saveSettings({ name: v }); toast("Name saved."); } } });
    out.append(group("Your name", h("div", { class: "row" }, h("span", { class: "row-main" }, nameIn, h("span", { class: "row-sub", style: { marginTop: "6px" } }, "Shown on the private pages you share")))));

    const fileInput = h("input", { id: "s-restore", type: "file", accept: "application/json,.json", class: "vh", on: { change: onRestoreFile } });
    const dataKids = [
      h("button", { type: "button", class: "row-btn", on: { click: exportCsv } }, "Export spending (CSV)"),
      h("button", { type: "button", class: "row-btn", on: { click: exportBackup } }, "Download a backup"),
      h("button", { type: "button", class: "row-btn", on: { click: () => fileInput.click() } }, "Restore from a backup"),
      fileInput
    ];
    if (S.restore) {
      dataKids.push(h("div", { class: "row" }, h("span", { class: "row-main" }, h("span", { class: "row-title" }, `Restore ${S.restore.length} records?`), h("span", { class: "row-sub" }, "Records with the same ID are replaced."))),
        h("button", { type: "button", class: "row-btn", on: { click: () => { const items = S.restore; S.restore = null; putMany(items); toast("Backup restored."); } } }, "Restore now"),
        h("button", { type: "button", class: "row-btn danger", on: { click: () => { S.restore = null; render(); } } }, "Cancel"));
    }
    out.append(group("Your data", ...dataKids));

    const armed = S.armed === "signout";
    out.append(group("Account",
      h("div", { class: "row" }, h("span", { class: "row-main" }, h("span", { class: "row-title" }, S.email || "Signed in"), h("span", { class: "row-sub" }, "Your data syncs to every device you sign in on"))),
      h("button", { type: "button", class: "row-btn danger", on: { click: () => { if (armed) signOut(); else { S.armed = "signout"; render(); } } } },
        armed ? (pending ? `Sign out and lose ${pending} unsynced changes?` : "Tap again to sign out") : "Sign out")));
    return out;
  }

  const loanBalances = () => {
    const b = new Map();
    for (const e of rows("loan_entries")) b.set(e.person_id, (b.get(e.person_id) || 0) + Number(e.amount));
    return b;
  };
  const cleanPhone = raw => {
    const s = String(raw || "").trim().replace(/[\s().-]/g, "").replace(/^00/, "+");
    if (/^0\d{6,7}$/.test(s)) return "+961" + s.slice(1);
    return /^\d{7,8}$/.test(s) ? "+961" + s : s;
  };
  const PHONE_RE = /^\+[1-9]\d{7,14}$/;
  const TOKEN_RE = /^[A-Za-z0-9_-]{32,64}$/;
  const newToken = () => {
    const b = new Uint8Array(24);
    crypto.getRandomValues(b);
    return btoa(String.fromCharCode(...b)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  };
  const shareUrl = token => `${location.origin}${location.pathname}#share=${token}`;
  const waUrl = (phone, text) => `https://wa.me/${phone.slice(1)}?text=${encodeURIComponent(text)}`;
  const waButton = (phone, text, label, cls = "") => h("a", { class: "btn " + cls, href: waUrl(phone, text), target: "_blank", rel: "noopener noreferrer" }, icon("chat"), label);
  const owesMe = p => p.direction === "owes_me";
  const statusText = (p, v) => v === 0 ? "Settled" : owesMe(p) ? "Owes you" : "You owe";

  const loanMessage = (p, delta, balance, note) => {
    const m = v => fmt(v, p.currency, { show: true });
    const why = note ? ` (${note})` : "";
    const after = balance === 0 ? "We're all settled now." : owesMe(p) ? `You now owe me ${m(balance)}.` : `I now owe you ${m(balance)}.`;
    if (owesMe(p)) return delta > 0 ? `Hi ${p.name}, I've added ${m(delta)} to what you owe me${why}. ${after}` : `Hi ${p.name}, I got your ${m(-delta)}${why}, thanks. ${after}`;
    return delta > 0 ? `Hi ${p.name}, I've added ${m(delta)} to what I owe you${why}. ${after}` : `Hi ${p.name}, I've paid you back ${m(-delta)}${why}. ${after}`;
  };
  const balanceMessage = (p, balance) => {
    const m = fmt(balance, p.currency, { show: true });
    if (balance === 0) return `Hi ${p.name}, we're all settled. Nothing owed either way.`;
    return owesMe(p) ? `Hi ${p.name}, just so you know, you owe me ${m} so far.` : `Hi ${p.name}, just so you know, I owe you ${m} so far.`;
  };
  const linkMessage = (p, token) => `Hi ${p.name}, here's a private page with your balance and history. It updates whenever something changes: ${shareUrl(token)}`;

  async function copyText(text, fallbackId) {
    try { await navigator.clipboard.writeText(text); toast("Link copied."); return; } catch { }
    const el = document.getElementById(fallbackId);
    if (el) { el.hidden = false; el.focus(); el.select(); toast("Copy the selected link."); }
  }

  function viewPeople() {
    const st = settings();
    const bal = loanBalances();
    const people = rows("people").sort(bySort);
    let owed = 0, owe = 0;
    for (const p of people) {
      const v = toUsd(bal.get(p.id) || 0, p.currency, st.rate);
      if (owesMe(p)) owed += v; else owe += v;
    }
    const out = h("div", { class: "stack" });
    out.append(h("div", { class: "tiles two" },
      h("div", { class: "tile good" }, h("small", null, "Owed to you"), h("strong", null, usd(owed))),
      h("div", { class: "tile" + (owe > 0 ? " bad" : "") }, h("small", null, "You owe"), h("strong", null, usd(owe)))));
    const list = h("section", { class: "card flush" });
    for (const p of people) {
      const v = bal.get(p.id) || 0;
      list.append(h("button", { type: "button", class: "row", on: { click: () => personSheet(p) } },
        h("span", { class: "dot", style: { background: COLORS[(p.sort || 0) % COLORS.length] } }, p.name.charAt(0).toUpperCase()),
        h("span", { class: "row-main" }, h("span", { class: "row-title" }, p.name), h("span", { class: "row-sub" }, [statusText(p, v), p.share_token ? "Has their page" : null].filter(Boolean).join(" · "))),
        h("span", { class: "row-end" + (v > 0 && owesMe(p) ? " pos" : v > 0 ? " neg" : "") }, fmt(v, p.currency))));
    }
    if (!people.length) list.append(h("p", { class: "empty" }, "No one yet. Add the people you lend money to or borrow from."));
    list.append(h("button", { type: "button", class: "row-btn", on: { click: () => personSheet(null) } }, "Add person"));
    out.append(list, h("p", { class: "hint" }, "Each person can get a private link that shows only their own balance and history. They don't need an account."));
    return out;
  }

  function personSheet(p) {
    if (!p) return newPersonSheet();
    const body = h("div", { class: "form" });
    const f = { mode: "more", amount: "", note: "", phone: p.phone || "", name: p.name, editing: false };
    let notice = null;
    let armed = null;
    const draw = () => {
      p = S.data.people.get(p.id) || p;
      const balance = loanBalances().get(p.id) || 0;
      const cur = p.currency;
      const history = rows("loan_entries").filter(e => e.person_id === p.id).sort(byRecent);
      const kids = [];
      kids.push(h("div", { class: "person-head" },
        h("p", { class: "hint" }, balance === 0 ? "All settled" : owesMe(p) ? `${p.name} owes you` : `You owe ${p.name}`),
        h("p", { class: "big num" }, fmt(balance, cur))));

      if (notice) {
        kids.push(h("div", { class: "notice" }, h("p", null, notice.title),
          h("div", { class: "btn-row" },
            p.phone ? waButton(p.phone, notice.message, `Tell ${p.name}`) : null,
            h("button", { type: "button", class: "btn alt", on: { click: () => { notice = null; draw(); } } }, p.phone ? "Skip" : "OK")),
          p.phone ? null : h("p", { class: "hint" }, "Add their WhatsApp number below to send updates.")));
      }

      const amt = h("input", { id: "f-pamt", inputmode: "decimal", autocomplete: "off", placeholder: "0", value: f.amount, "aria-label": `Amount in ${cur === "LBP" ? "lira" : "dollars"}`, on: { input: e => { f.amount = e.target.value; refresh(); } } });
      const preview = h("p", { class: "preview num" });
      const submit = h("button", { type: "button", class: "btn" });
      const refresh = () => {
        const v = parseAmt(f.amount);
        const back = f.mode === "back";
        const tooMuch = back && v && v > balance;
        submit.disabled = !v || tooMuch;
        submit.textContent = !v ? "Enter an amount" : back ? `Record ${fmt(v, cur, { show: true })} paid back` : `Add ${fmt(v, cur, { show: true })}`;
        preview.textContent = !v ? "" : tooMuch ? `That's more than the ${fmt(balance, cur, { show: true })} balance.` : `New balance: ${fmt(balance + (back ? -v : v), cur, { show: true })}`;
      };
      submit.addEventListener("click", () => {
        const v = parseAmt(f.amount);
        if (!v) return;
        const back = f.mode === "back";
        if (back && v > balance) return;
        const amount = (cur === "LBP" ? Math.round(v) : v) * (back ? -1 : 1);
        const note = f.note.trim().slice(0, 200) || null;
        put("loan_entries", { id: newId(), person_id: p.id, amount, note, occurred_on: today(), created_at: new Date().toISOString() });
        const next = balance + amount;
        notice = { title: `Saved. ${next === 0 ? "All settled." : `Balance is now ${fmt(next, cur, { show: true })}.`}`, message: loanMessage(p, amount, next, note) };
        f.amount = ""; f.note = "";
        draw();
      });
      kids.push(h("div", { class: "form" },
        seg([["more", owesMe(p) ? "Lent more" : "Borrowed more"], ["back", owesMe(p) ? "Paid me back" : "I paid back"]], f.mode, k => { f.mode = k; draw(); }, "Change type"),
        h("label", { class: "amount", for: "f-pamt" }, h("span", { class: "cur" }, cur === "LBP" ? "LBP" : "$"), amt),
        h("div", { class: "chips" },
          (cur === "LBP" ? [1e6, 5e6, 10e6] : [100, 500, 1000]).map(n => h("button", { type: "button", class: "chip", on: { click: () => { f.amount = String(n); amt.value = f.amount; refresh(); } } }, fmt(n, cur, { show: true, compact: true }))),
          f.mode === "back" && balance > 0 ? h("button", { type: "button", class: "chip", on: { click: () => { f.amount = String(balance); amt.value = f.amount; refresh(); } } }, "Full balance") : null),
        h("input", { id: "f-pnote", class: "input", maxlength: "200", autocomplete: "off", placeholder: "What's it for? (optional)", value: f.note, "aria-label": "Note", on: { input: e => { f.note = e.target.value; } } }),
        preview, submit));
      refresh();

      if (p.phone) kids.push(waButton(p.phone, balanceMessage(p, balance), "Send balance on WhatsApp", "alt"));

      const share = h("section", { class: "card flush" }, h("div", { class: "card-head" }, h("h2", null, "Their private page")));
      if (p.share_token) {
        const url = shareUrl(p.share_token);
        share.append(
          h("p", { class: "row-sub", style: { padding: "0 16px 6px", whiteSpace: "normal" } }, `${p.name} sees only their balance and history. No account needed.`),
          h("input", { id: "f-plink", class: "input", readOnly: true, value: url, hidden: true, style: { margin: "0 16px", width: "calc(100% - 32px)" } }),
          h("button", { type: "button", class: "row-btn", on: { click: () => copyText(url, "f-plink") } }, "Copy link"),
          p.phone ? h("a", { class: "row-btn", style: { display: "block", textDecoration: "none" }, href: waUrl(p.phone, linkMessage(p, p.share_token)), target: "_blank", rel: "noopener noreferrer" }, "Send link on WhatsApp") : null,
          h("button", { type: "button", class: "row-btn danger", on: { click: () => { if (armed !== "unshare") { armed = "unshare"; draw(); return; } armed = null; put("people", { ...p, share_token: null }); toast("Link turned off."); draw(); } } }, armed === "unshare" ? "Tap again: the old link stops working" : "Turn off link"));
      } else {
        share.append(h("p", { class: "row-sub", style: { padding: "0 16px 6px", whiteSpace: "normal" } }, `Make a link that shows ${p.name} only their own balance and history.`),
          h("button", { type: "button", class: "row-btn", on: { click: () => { put("people", { ...p, share_token: newToken() }); draw(); } } }, "Create private link"));
      }
      kids.push(share);

      const hist = h("section", { class: "card flush" }, h("div", { class: "card-head" }, h("h2", null, `History (${history.length})`)));
      for (const e of history) {
        const v = Number(e.amount);
        const label = owesMe(p) ? (v > 0 ? "Lent" : "Paid back") : (v > 0 ? "Borrowed" : "Paid back");
        hist.append(h("div", { class: "row" },
          h("span", { class: "row-main" }, h("span", { class: "row-title" }, e.note || label), h("span", { class: "row-sub" }, `${label} · ${dayLabel(e.occurred_on)}`)),
          h("span", { class: "row-end" + (v < 0 ? " pos" : "") }, (v > 0 ? "+" : "−") + fmt(Math.abs(v), cur)),
          h("button", { type: "button", class: "icon-btn", "aria-label": armed === e.id ? "Confirm delete" : "Delete entry", style: armed === e.id ? { color: "var(--neg)" } : null,
            on: { click: () => { if (armed !== e.id) { armed = e.id; draw(); return; } armed = null; removeRow("loan_entries", e); toast("Entry deleted."); draw(); } } }, icon(armed === e.id ? "warn" : "close"))));
      }
      if (!history.length) hist.append(h("p", { class: "empty" }, "No entries yet."));
      kids.push(hist);

      const phoneIn = h("input", { id: "f-pphone", class: "input", type: "tel", autocomplete: "off", placeholder: "70 123 456", value: f.phone, on: { input: e => { f.phone = e.target.value; } } });
      const nameIn = h("input", { id: "f-pname", class: "input", maxlength: "40", autocomplete: "off", value: f.name, on: { input: e => { f.name = e.target.value; } } });
      kids.push(h("section", { class: "card" },
        h("div", { class: "card-head" }, h("h2", null, "Details")),
        h("label", { class: "field" }, h("span", null, "Name"), nameIn),
        h("label", { class: "field" }, h("span", null, "WhatsApp number"), phoneIn),
        h("button", { type: "button", class: "btn alt", on: { click: () => {
          const name = f.name.trim().replace(/\s+/g, " ");
          if (!name || name.length > 40) return toast("Enter a name.");
          const phone = f.phone.trim() ? cleanPhone(f.phone) : null;
          if (phone && !PHONE_RE.test(phone)) return toast("Enter a number like 70 123 456, or +33 6 12 34 56 78 outside Lebanon.");
          put("people", { ...p, name, phone });
          f.phone = phone || "";
          toast("Saved.");
          draw();
        } } }, "Save details"),
        h("button", { type: "button", class: "btn danger" + (armed === "delete" ? " sure" : ""), on: { click: () => {
          if (armed !== "delete") { armed = "delete"; draw(); return; }
          const items = [{ t: "people", r: { ...p, share_token: null, deleted_at: new Date().toISOString() } }, ...history.map(e => ({ t: "loan_entries", r: { ...e, deleted_at: new Date().toISOString() } }))];
          putMany(items); closeSheet(); toast(`${p.name} removed.`);
        } } }, armed === "delete" ? `Tap again to remove ${p.name} and their history` : "Remove person")));

      keepFocus(() => body.replaceChildren(...kids));
    };
    draw();
    openSheet(p.name, body);
  }

  function newPersonSheet() {
    const f = { name: "", direction: "owes_me", currency: "USD", amount: "", phone: "" };
    const body = h("form", { class: "form", novalidate: true });
    const err = h("p", { class: "form-err", role: "alert" });
    const draw = () => {
      keepFocus(() => body.replaceChildren(
        h("label", { class: "field" }, h("span", null, "Name"), h("input", { id: "f-nname", class: "input", maxlength: "40", autocomplete: "off", value: f.name, on: { input: e => { f.name = e.target.value; } } })),
        h("div", { class: "field" }, h("span", { class: "label" }, "Who owes who"), seg([["owes_me", "They owe me"], ["i_owe", "I owe them"]], f.direction, k => { f.direction = k; draw(); }, "Direction")),
        h("div", { class: "field" }, h("span", { class: "label" }, "Currency"), seg([["USD", "Dollars"], ["LBP", "Lira"]], f.currency, k => { f.currency = k; draw(); }, "Currency")),
        h("label", { class: "field" }, h("span", null, `Amount owed now (${f.currency === "LBP" ? "LBP" : "$"})`), h("input", { id: "f-namt", class: "input num", inputmode: "decimal", autocomplete: "off", placeholder: "0", value: f.amount, on: { input: e => { f.amount = e.target.value; } } })),
        h("label", { class: "field" }, h("span", null, "WhatsApp number (optional)"), h("input", { id: "f-nphone", class: "input", type: "tel", autocomplete: "off", placeholder: "70 123 456", value: f.phone, on: { input: e => { f.phone = e.target.value; } } })),
        err,
        h("button", { type: "submit", class: "btn" }, "Add person")));
    };
    body.addEventListener("submit", ev => {
      ev.preventDefault();
      const name = f.name.trim().replace(/\s+/g, " ");
      if (!name || name.length > 40) { err.textContent = "Enter a name."; return; }
      if (rows("people").some(p => p.name.toLowerCase() === name.toLowerCase())) { err.textContent = `${name} is already on your list.`; return; }
      const start = f.amount.trim() ? parseAmt(f.amount) : 0;
      if (start === null) { err.textContent = "Enter the amount as a number, like 2000."; return; }
      const phone = f.phone.trim() ? cleanPhone(f.phone) : null;
      if (phone && !PHONE_RE.test(phone)) { err.textContent = "Enter a number like 70 123 456, or +33 6 12 34 56 78 outside Lebanon."; return; }
      const person = { id: newId(), name, direction: f.direction, currency: f.currency, phone, share_token: null, sort: Math.max(-1, ...rows("people").map(r => r.sort || 0)) + 1 };
      const items = [{ t: "people", r: person }];
      if (start) items.push({ t: "loan_entries", r: { id: newId(), person_id: person.id, amount: f.currency === "LBP" ? Math.round(start) : start, note: "Starting balance", occurred_on: today(), created_at: new Date().toISOString() } });
      putMany(items);
      personSheet(S.data.people.get(person.id));
    });
    draw();
    openSheet("Add person", body);
  }

  async function renderShared(token) {
    shell = null;
    const box = h("div", { class: "auth-box" }, h("p", { class: "hint" }, "Loading your balance…"));
    root.replaceChildren(h("div", { class: "auth" }, box));
    const fail = text => box.replaceChildren(h("img", { class: "auth-mark", src: "icons/icon-192.png", alt: "" }), h("h1", null, "Can't open this page"), h("p", null, text));
    if (!TOKEN_RE.test(token)) return fail("This link isn't complete. Ask for it to be sent again.");
    let data = null;
    try {
      const res = await sb.rpc("shared_ledger", { p_token: token });
      if (res.error) return fail("Couldn't load your balance. Check your connection and reload.");
      data = res.data;
    } catch { return fail("Couldn't load your balance. Check your connection and reload."); }
    if (!data || typeof data !== "object") return fail("This link doesn't work anymore. Ask for a new one.");
    const cur = data.currency === "LBP" ? "LBP" : "USD";
    const balance = Number(data.balance) || 0;
    const from = typeof data.from === "string" && data.from.trim() ? data.from.trim().slice(0, 40) : "";
    const label = balance === 0 ? "You're all settled" : data.direction === "owes_me" ? (from ? `You owe ${from}` : "You owe") : (from ? `${from} owes you` : "You're owed");
    const history = Array.isArray(data.history) ? data.history : [];
    const list = h("section", { class: "card flush" }, h("div", { class: "card-head" }, h("h2", null, "History")));
    for (const e of history) {
      const v = Number(e.amount) || 0;
      const kind = data.direction === "owes_me" ? (v > 0 ? "Borrowed" : "Paid back") : (v > 0 ? "Lent" : "Paid back");
      list.append(h("div", { class: "row" },
        h("span", { class: "row-main" }, h("span", { class: "row-title" }, typeof e.note === "string" && e.note ? e.note : kind), h("span", { class: "row-sub" }, `${kind} · ${DATE_RE.test(String(e.date)) ? dayLabel(e.date) : ""}`)),
        h("span", { class: "row-end" + (v < 0 ? " pos" : "") }, (v > 0 ? "+" : "−") + fmt(Math.abs(v), cur, { show: true }))));
    }
    if (!history.length) list.append(h("p", { class: "empty" }, "Nothing here yet."));
    box.className = "auth-box";
    box.replaceChildren(
      h("section", { class: "hero" },
        h("p", { class: "hero-label" }, `Hi ${String(data.name || "").slice(0, 40)}`),
        h("p", { class: "hero-total num" }, fmt(balance, cur, { show: true })),
        h("p", { class: "hero-sub" }, label)),
      list,
      h("p", { class: "hint", style: { textAlign: "center" } }, "Only people with this link can see this page."));
    document.title = "Your balance";
  }

  function closeSheet() {
    const o = document.querySelector(".overlay");
    if (!o) return;
    o.classList.remove("open");
    document.removeEventListener("keydown", onSheetKey);
    setTimeout(() => o.remove(), 260);
  }
  function onSheetKey(e) { if (e.key === "Escape") closeSheet(); }
  function openSheet(title, body) {
    document.querySelectorAll(".overlay").forEach(o => o.remove());
    const overlay = h("div", { class: "overlay", on: { click: e => { if (e.target === overlay) closeSheet(); } } },
      h("section", { class: "sheet", role: "dialog", "aria-modal": "true", "aria-label": title },
        h("header", { class: "sheet-head" }, h("h2", null, title), h("button", { type: "button", class: "icon-btn", "aria-label": "Close", on: { click: closeSheet } }, icon("close"))),
        h("div", { class: "sheet-body" }, body)));
    document.body.append(overlay);
    document.addEventListener("keydown", onSheetKey);
    requestAnimationFrame(() => requestAnimationFrame(() => overlay.classList.add("open")));
  }

  const seg = (options, value, onPick, label) => h("div", { class: "seg", role: "group", "aria-label": label },
    options.map(([k, l, disabled]) => h("button", { type: "button", "aria-pressed": String(value === k), disabled: !!disabled, on: { click: () => onPick(k) } }, l)));

  function txnSheet(x) {
    const st = settings();
    const accounts = rows("accounts").filter(a => !a.archived || (x && (a.id === x.account_id || a.id === x.to_account_id))).sort(bySort);
    if (!accounts.length) { toast("Add an account first."); go("settings"); return; }
    const lastAcc = k => { const id = store.get("lastAcc:" + k, null); return acc(id) && !acc(id).archived ? id : null; };
    const f = x
      ? { kind: x.kind, amount: String(Number(x.amount)), account: x.account_id, to: x.to_account_id, toAmount: x.to_amount != null ? String(Number(x.to_amount)) : "", toTouched: true, category: x.category_id, date: x.occurred_on, note: x.note || "", repeat: false }
      : { kind: "expense", amount: "", account: null, to: null, toAmount: "", toTouched: false, category: null, date: today(), note: "", repeat: false };
    const usage = new Map();
    const cutoff = ymd(new Date(Date.now() - 90 * 864e5));
    for (const t of rows("transactions")) if (t.category_id && t.occurred_on >= cutoff) usage.set(t.category_id, (usage.get(t.category_id) || 0) + 1);
    const body = h("form", { class: "form", novalidate: true });
    const err = h("p", { class: "form-err", role: "alert" });
    let armedDelete = false;

    const pick = () => {
      if (!f.account || !acc(f.account)) f.account = lastAcc(f.kind) || accounts[0].id;
      if (f.kind === "transfer" && (!f.to || f.to === f.account || !acc(f.to))) {
        const other = accounts.find(a => a.id !== f.account && a.kind === "savings") || accounts.find(a => a.id !== f.account);
        f.to = other ? other.id : null;
      }
      if (f.kind !== "transfer" && f.category && (!cat(f.category) || cat(f.category).kind !== f.kind)) f.category = null;
    };
    const convert = (amount, from, to) => from === to ? amount : from === "LBP" ? Math.round(amount / st.rate * 100) / 100 : Math.round(amount * st.rate);

    const draw = () => {
      pick();
      const a = acc(f.account);
      const cur = a.currency;
      const to = f.kind === "transfer" ? acc(f.to) : null;
      const cross = to && to.currency !== cur;
      const preview = h("p", { class: "preview num" });
      const saveBtn = h("button", { type: "submit", class: "btn" });
      const toInput = cross ? h("input", { id: "f-toamt", class: "input num", inputmode: "decimal", autocomplete: "off", value: f.toAmount, on: { input: e => { f.toAmount = e.target.value; f.toTouched = true; } } }) : null;
      const refresh = () => {
        const v = parseAmt(f.amount);
        if (v && cross && !f.toTouched) { f.toAmount = String(convert(v, cur, to.currency)); toInput.value = f.toAmount; }
        preview.textContent = !v ? (f.amount.trim() ? "Use a number like 25 or 25.50." : "")
          : cur === "LBP" ? `${fmt(v, "LBP", { show: true })} ≈ ${usd(v / st.rate, { show: true })}` : `≈ ${fmt(v * st.rate, "LBP", { show: true })}`;
        const verb = { expense: "Save expense", income: "Save income", transfer: "Move money" }[f.kind];
        saveBtn.textContent = v ? `${verb} · ${fmt(v, cur, { show: true })}` : verb;
      };
      const amt = h("input", { id: "f-amt", inputmode: "decimal", autocomplete: "off", placeholder: "0", value: f.amount, "aria-label": `Amount in ${cur === "LBP" ? "lira" : "dollars"}`, enterkeyhint: "done",
        on: { input: e => { f.amount = e.target.value; refresh(); } } });

      const accChips = (value, onPick, exclude) => h("div", { class: "chips" }, accounts.filter(o => o.id !== exclude).map(o => h("button", { type: "button", class: "chip", "aria-pressed": String(o.id === value), on: { click: () => onPick(o.id) } }, o.name, h("small", null, o.currency))));
      const kids = [
        seg([["expense", "Expense"], ["income", "Income"], ["transfer", "Move", accounts.length < 2]], f.kind, k => { f.kind = k; if (!x) f.account = null; f.toTouched = false; draw(); }, "Entry type"),
        h("div", null,
          h("label", { class: "amount", for: "f-amt" }, h("span", { class: "cur" }, cur === "LBP" ? "LBP" : "$"), amt),
          cur === "LBP" ? h("div", { class: "chips", style: { marginTop: "8px" } },
            [["000", "Add 000"], ["000000", "Add 000,000"]].map(([z, l]) => h("button", { type: "button", class: "chip", on: { click: () => { f.amount = (f.amount.replace(/[,\s]/g, "") || "1") + z; amt.value = f.amount; refresh(); amt.focus(); } } }, l))) : null,
          preview),
        h("div", { class: "field" }, h("span", { class: "label" }, f.kind === "income" ? "Into" : "From"), accChips(f.account, id => { f.account = id; f.toTouched = false; draw(); }))
      ];
      if (f.kind === "transfer") {
        kids.push(h("div", { class: "field" }, h("span", { class: "label" }, "To"), accChips(f.to, id => { f.to = id; f.toTouched = false; draw(); }, f.account)));
        if (cross) kids.push(h("label", { class: "field" }, h("span", null, `${to.name} receives (${to.currency})`), toInput, h("span", { class: "hint" }, `At LBP ${st.rate.toLocaleString("en-US")} for $1. Change it if you got a different rate.`)));
      } else {
        const cats = rows("categories").filter(c => c.kind === f.kind).sort((p, q) => (usage.get(q.id) || 0) - (usage.get(p.id) || 0) || bySort(p, q));
        kids.push(h("div", { class: "field" }, h("span", { class: "label" }, "Category"),
          cats.length ? h("div", { class: "chips wrap" }, cats.map(c => h("button", { type: "button", class: "chip", "aria-pressed": String(c.id === f.category), on: { click: () => { f.category = c.id; draw(); } } }, h("span", { class: "swatch", style: { background: c.color } }), c.name)))
            : h("p", { class: "hint" }, "No categories yet. Add some in Settings.")));
      }
      const yest = ymd(new Date(Date.now() - 864e5));
      kids.push(
        h("div", { class: "field" }, h("span", { class: "label" }, "Date"),
          h("div", { class: "inline" },
            h("button", { type: "button", class: "chip", "aria-pressed": String(f.date === today()), on: { click: () => { f.date = today(); draw(); } } }, "Today"),
            h("button", { type: "button", class: "chip", "aria-pressed": String(f.date === yest), on: { click: () => { f.date = yest; draw(); } } }, "Yesterday"),
            h("input", { id: "f-date", class: "input", type: "date", value: f.date, max: ymd(new Date(Date.now() + 366 * 864e5)), "aria-label": "Date", on: { change: e => { f.date = e.target.value; draw(); } } }))),
        h("label", { class: "field" }, h("span", null, "Note"), h("input", { id: "f-note", class: "input", maxlength: "200", autocomplete: "off", placeholder: f.kind === "expense" ? "What was it? (optional)" : "Optional", value: f.note, on: { input: e => { f.note = e.target.value; } } })));
      if (!x && f.kind !== "transfer") {
        const day = Math.min(28, Number(f.date.slice(8)) || 1);
        kids.push(h("label", { class: "check" }, h("input", { id: "f-repeat", type: "checkbox", checked: f.repeat, on: { change: e => { f.repeat = e.target.checked; } } }), `Repeat every month on day ${day}`));
      }
      kids.push(err, saveBtn);
      if (x) {
        kids.push(h("button", { type: "button", class: "btn danger" + (armedDelete ? " sure" : ""), on: { click: () => {
          if (!armedDelete) { armedDelete = true; draw(); return; }
          removeRow("transactions", x); closeSheet(); toast("Entry deleted.");
        } } }, armedDelete ? "Tap again to delete" : "Delete entry"));
      }
      keepFocus(() => body.replaceChildren(...kids));
      refresh();
    };

    body.addEventListener("submit", ev => {
      ev.preventDefault();
      err.textContent = "";
      const a = acc(f.account);
      const amount = parseAmt(f.amount);
      if (!amount) { err.textContent = "Enter an amount, like 25 or 25.50."; return; }
      if (!DATE_RE.test(f.date)) { err.textContent = "Pick a date."; return; }
      let toAmount = null;
      if (f.kind === "transfer") {
        const to = acc(f.to);
        if (!to || to.id === a.id) { err.textContent = "Pick a different account to move money to."; return; }
        toAmount = to.currency === a.currency ? amount : parseAmt(f.toAmount);
        if (!toAmount) { err.textContent = `Enter how much ${to.name} receives.`; return; }
      } else if (!f.category) { err.textContent = "Pick a category."; return; }
      const sameRate = x && x.currency === a.currency && Number(x.rate) > 0;
      const row = {
        id: x ? x.id : newId(),
        kind: f.kind, amount: a.currency === "LBP" ? Math.round(amount) : amount, currency: a.currency,
        rate: sameRate ? Number(x.rate) : st.rate,
        account_id: a.id,
        to_account_id: f.kind === "transfer" ? f.to : null,
        to_amount: f.kind === "transfer" ? (acc(f.to).currency === "LBP" ? Math.round(toAmount) : toAmount) : null,
        category_id: f.kind === "transfer" ? null : f.category,
        note: f.note.trim().slice(0, 200) || null,
        occurred_on: f.date,
        rule_id: x ? x.rule_id || null : null,
        created_at: x ? x.created_at : new Date().toISOString()
      };
      const items = [];
      if (f.repeat && !x && f.kind !== "transfer") {
        const day = Math.min(28, Number(f.date.slice(8)) || 1);
        const ruleId = newId();
        row.rule_id = ruleId;
        items.push({ t: "rules", r: { id: ruleId, kind: f.kind, amount: row.amount, currency: row.currency, account_id: row.account_id, category_id: row.category_id, note: row.note, day, next_on: nextMonthDay(f.date, day), active: true } });
      }
      items.unshift({ t: "transactions", r: row });
      store.set("lastAcc:" + f.kind, a.id);
      putMany(items);
      closeSheet();
      toast(x ? "Entry updated." : `${{ expense: "Expense", income: "Income", transfer: "Transfer" }[f.kind]} saved: ${fmt(row.amount, row.currency, { show: true })}.`);
    });

    draw();
    openSheet(x ? "Edit entry" : "New entry", body);
    if (!x) document.getElementById("f-amt").focus({ preventScroll: true });
  }

  function accountSheet(a) {
    const bal = balances();
    const used = a ? rows("transactions").some(x => x.account_id === a.id || x.to_account_id === a.id) : false;
    const current = a ? bal.get(a.id) || 0 : 0;
    const f = { name: a ? a.name : "", currency: a ? a.currency : "USD", kind: a ? a.kind : "bank", balance: a ? String(Math.round(current * 100) / 100) : "" };
    const body = h("form", { class: "form", novalidate: true });
    const err = h("p", { class: "form-err", role: "alert" });
    let armedDelete = false;
    const draw = () => {
      const kids = [
        h("label", { class: "field" }, h("span", null, "Name"), h("input", { id: "f-aname", class: "input", maxlength: "60", autocomplete: "off", placeholder: "e.g. Cash, Bank Audi, Visa", value: f.name, on: { input: e => { f.name = e.target.value; } } })),
        h("div", { class: "field" }, h("span", { class: "label" }, "Currency"), seg([["USD", "Dollars", used], ["LBP", "Lira", used]], f.currency, k => { f.currency = k; draw(); }, "Currency")),
        h("div", { class: "field" }, h("span", { class: "label" }, "Type"), h("div", { class: "chips wrap" }, Object.entries(KIND_LABEL).map(([k, l]) => h("button", { type: "button", class: "chip", "aria-pressed": String(f.kind === k), on: { click: () => { f.kind = k; draw(); } } }, l)))),
        h("p", { class: "hint" }, "Money moved into a Savings account counts toward your savings goal."),
        h("label", { class: "field" }, h("span", null, `Balance now (${f.currency === "LBP" ? "LBP" : "$"})`), h("input", { id: "f-abal", class: "input num", inputmode: "decimal", autocomplete: "off", placeholder: "0", value: f.balance, on: { input: e => { f.balance = e.target.value; } } })),
        err,
        h("button", { type: "submit", class: "btn" }, a ? "Save account" : "Add account")
      ];
      if (a) {
        kids.push(h("button", { type: "button", class: "btn alt", on: { click: () => { put("accounts", { ...a, archived: !a.archived }); closeSheet(); toast(a.archived ? "Account shown again." : "Account hidden. Its history stays."); } } }, a.archived ? "Show this account again" : "Hide this account"));
        if (!used) kids.push(h("button", { type: "button", class: "btn danger" + (armedDelete ? " sure" : ""), on: { click: () => { if (!armedDelete) { armedDelete = true; draw(); return; } removeRow("accounts", a); closeSheet(); toast("Account deleted."); } } }, armedDelete ? "Tap again to delete" : "Delete account"));
      }
      keepFocus(() => body.replaceChildren(...kids));
    };
    body.addEventListener("submit", ev => {
      ev.preventDefault();
      const name = f.name.trim().replace(/\s+/g, " ");
      if (!name || name.length > 60) { err.textContent = "Give the account a name."; return; }
      const wanted = parseSigned(f.balance);
      if (wanted === null) { err.textContent = "Enter the balance as a number, like 250 or -40."; return; }
      const effect = a ? current - (Number(a.opening_balance) || 0) : 0;
      const opening = Math.round((wanted - effect) * 100) / 100;
      const maxSort = Math.max(-1, ...rows("accounts").map(r => r.sort || 0));
      put("accounts", a ? { ...a, name, currency: used ? a.currency : f.currency, kind: f.kind, opening_balance: opening } : { id: newId(), name, currency: f.currency, kind: f.kind, opening_balance: opening, sort: maxSort + 1, archived: false });
      closeSheet();
      toast(a ? "Account saved." : "Account added.");
    });
    draw();
    openSheet(a ? "Edit account" : "New account", body);
  }

  function categorySheet(c, kind) {
    const f = { name: c ? c.name : "", kind: c ? c.kind : kind || "expense", bucket: c ? c.bucket || "wants" : "needs", color: c ? c.color : COLORS[rows("categories").length % COLORS.length], budget: c && Number(c.budget) ? String(Number(c.budget)) : "" };
    const body = h("form", { class: "form", novalidate: true });
    const err = h("p", { class: "form-err", role: "alert" });
    let armedDelete = false;
    const draw = () => {
      const kids = [h("label", { class: "field" }, h("span", null, "Name"), h("input", { id: "f-cname", class: "input", maxlength: "40", autocomplete: "off", value: f.name, on: { input: e => { f.name = e.target.value; } } }))];
      if (!c) kids.push(seg([["expense", "Spending"], ["income", "Income"]], f.kind, k => { f.kind = k; draw(); }, "Category type"));
      if (f.kind === "expense") {
        kids.push(
          h("div", { class: "field" }, h("span", { class: "label" }, "Part of your plan"), seg(Object.entries(BUCKETS).map(([k, b]) => [k, b.name]), f.bucket, k => { f.bucket = k; draw(); }, "Plan group"), h("span", { class: "hint" }, BUCKETS[f.bucket].about)),
          h("label", { class: "field" }, h("span", null, "Monthly budget in dollars (optional)"), h("input", { id: "f-cbudget", class: "input num", inputmode: "decimal", autocomplete: "off", placeholder: "No budget", value: f.budget, on: { input: e => { f.budget = e.target.value; } } })));
      }
      kids.push(h("div", { class: "field" }, h("span", { class: "label" }, "Color"), h("div", { class: "swatches" }, COLORS.map(col => h("button", { type: "button", "aria-label": `Color ${col}`, "aria-pressed": String(f.color === col), style: { background: col }, on: { click: () => { f.color = col; draw(); } } })))), err, h("button", { type: "submit", class: "btn" }, c ? "Save category" : "Add category"));
      if (c) kids.push(h("button", { type: "button", class: "btn danger" + (armedDelete ? " sure" : ""), on: { click: () => { if (!armedDelete) { armedDelete = true; draw(); return; } removeRow("categories", c); closeSheet(); toast("Category deleted. Its entries show as Uncategorized."); } } }, armedDelete ? "Tap again to delete" : "Delete category"));
      keepFocus(() => body.replaceChildren(...kids));
    };
    body.addEventListener("submit", ev => {
      ev.preventDefault();
      const name = f.name.trim().replace(/\s+/g, " ");
      if (!name || name.length > 40) { err.textContent = "Give the category a name."; return; }
      let budget = null;
      if (f.kind === "expense" && f.budget.trim()) { budget = parseAmt(f.budget); if (!budget) { err.textContent = "Enter the budget as a number, like 150."; return; } }
      const maxSort = Math.max(-1, ...rows("categories").map(r => r.sort || 0));
      put("categories", c ? { ...c, name, bucket: f.kind === "expense" ? f.bucket : null, color: f.color, budget } : { id: newId(), name, kind: f.kind, bucket: f.kind === "expense" ? f.bucket : null, color: f.color, budget, sort: maxSort + 1 });
      closeSheet();
      toast(c ? "Category saved." : "Category added.");
    });
    draw();
    openSheet(c ? "Edit category" : "New category", body);
  }

  function ruleSheet(r) {
    const c = cat(r.category_id);
    const f = { amount: String(Number(r.amount)), day: String(r.day), note: r.note || "", active: r.active };
    const body = h("form", { class: "form", novalidate: true });
    const err = h("p", { class: "form-err", role: "alert" });
    let armedDelete = false;
    const draw = () => {
      const kids = [
        h("p", { class: "hint" }, `${c ? c.name : "Entry"} from ${(acc(r.account_id) || {}).name || "an account"}. Next on ${dayLabel(r.next_on)}.`),
        h("label", { class: "field" }, h("span", null, `Amount (${r.currency === "LBP" ? "LBP" : "$"})`), h("input", { id: "f-ramt", class: "input num", inputmode: "decimal", autocomplete: "off", value: f.amount, on: { input: e => { f.amount = e.target.value; } } })),
        h("label", { class: "field" }, h("span", null, "Day of the month (1 to 28)"), h("input", { id: "f-rday", class: "input num", inputmode: "numeric", autocomplete: "off", value: f.day, on: { input: e => { f.day = e.target.value; } } })),
        h("label", { class: "field" }, h("span", null, "Note"), h("input", { id: "f-rnote", class: "input", maxlength: "200", autocomplete: "off", value: f.note, on: { input: e => { f.note = e.target.value; } } })),
        h("label", { class: "check" }, h("input", { id: "f-ractive", type: "checkbox", checked: f.active, on: { change: e => { f.active = e.target.checked; } } }), "Add it automatically every month"),
        err,
        h("button", { type: "submit", class: "btn" }, "Save"),
        h("button", { type: "button", class: "btn danger" + (armedDelete ? " sure" : ""), on: { click: () => { if (!armedDelete) { armedDelete = true; draw(); return; } removeRow("rules", r); closeSheet(); toast("Stopped. Past entries stay."); } } }, armedDelete ? "Tap again to stop it for good" : "Stop repeating")
      ];
      keepFocus(() => body.replaceChildren(...kids));
    };
    body.addEventListener("submit", ev => {
      ev.preventDefault();
      const amount = parseAmt(f.amount);
      const day = Number(f.day);
      if (!amount) { err.textContent = "Enter an amount."; return; }
      if (!Number.isInteger(day) || day < 1 || day > 28) { err.textContent = "Pick a day from 1 to 28."; return; }
      let next = r.next_on;
      if (day !== r.day) {
        const t = today();
        const candidate = `${t.slice(0, 7)}-${pad(day)}`;
        next = candidate > t ? candidate : nextMonthDay(candidate, day);
      }
      put("rules", { ...r, amount: r.currency === "LBP" ? Math.round(amount) : amount, day, note: f.note.trim().slice(0, 200) || null, active: f.active, next_on: next });
      closeSheet();
      toast("Saved.");
    });
    draw();
    openSheet("Monthly entry", body);
  }

  async function shareFile(name, text, type) {
    const file = new File([text], name, { type });
    try {
      if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: name }); return; }
    } catch (e) {
      if (e && e.name === "AbortError") return;
    }
    const url = URL.createObjectURL(file);
    const a = h("a", { href: url, download: name });
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }

  function exportCsv() {
    const cell = v => {
      let s = v == null ? "" : String(v);
      if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
      return `"${s.replace(/"/g, '""')}"`;
    };
    const lines = [["Date", "Type", "Amount", "Currency", "In dollars", "Account", "To account", "Received", "Category", "Plan group", "Note"].map(cell).join(",")];
    for (const x of rows("transactions").sort(byRecent)) {
      const c = cat(x.category_id), a = acc(x.account_id), b = acc(x.to_account_id);
      lines.push([x.occurred_on, x.kind, x.amount, x.currency, Math.round(txUsd(x) * 100) / 100, a && a.name, b && b.name, x.to_amount, c && c.name, c && c.bucket, x.note].map(cell).join(","));
    }
    shareFile(`wallet-${today()}.csv`, "﻿" + lines.join("\r\n"), "text/csv");
  }

  function exportBackup() {
    const data = { app: "my-wallet", version: 1, exported_at: new Date().toISOString() };
    for (const t of TABLES) data[t] = rows(t).map(r => clean(t, r)).map(({ user_id, ...rest }) => rest);
    shareFile(`wallet-backup-${today()}.json`, JSON.stringify(data, null, 1), "application/json");
  }

  const VALID = {
    accounts: r => typeof r.name === "string" && r.name.length > 0 && r.name.length <= 60 && ["USD", "LBP"].includes(r.currency) && Object.keys(KIND_LABEL).includes(r.kind),
    categories: r => typeof r.name === "string" && r.name.length > 0 && r.name.length <= 40 && ["expense", "income"].includes(r.kind),
    transactions: r => ["expense", "income", "transfer"].includes(r.kind) && Number(r.amount) > 0 && ["USD", "LBP"].includes(r.currency) && Number(r.rate) > 0 && DATE_RE.test(String(r.occurred_on)) && typeof r.account_id === "string",
    rules: r => ["expense", "income"].includes(r.kind) && Number(r.amount) > 0 && ["USD", "LBP"].includes(r.currency) && Number.isInteger(r.day) && r.day >= 1 && r.day <= 28 && DATE_RE.test(String(r.next_on)),
    settings: r => !!r.data && typeof r.data === "object" && !Array.isArray(r.data),
    people: r => typeof r.name === "string" && r.name.length > 0 && r.name.length <= 40 && ["owes_me", "i_owe"].includes(r.direction) && ["USD", "LBP"].includes(r.currency) && (r.phone == null || PHONE_RE.test(r.phone)) && (r.share_token == null || TOKEN_RE.test(r.share_token)),
    loan_entries: r => typeof r.person_id === "string" && Number(r.amount) !== 0 && Number.isFinite(Number(r.amount)) && DATE_RE.test(String(r.occurred_on))
  };

  async function onRestoreFile(e) {
    const file = e.target.files && e.target.files[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > 20e6) return toast("That file is too big to be a wallet backup.");
    try {
      const json = JSON.parse(await file.text());
      const items = [];
      for (const t of TABLES) {
        for (const r of Array.isArray(json[t]) ? json[t] : []) {
          if (!r || typeof r !== "object" || !ID_RE.test(String(r.id)) || !VALID[t](r)) continue;
          const row = Object.fromEntries(COLS[t].filter(c => c !== "user_id" && c !== "deleted_at").map(c => [c, r[c] ?? DEFAULTS[c] ?? null]));
          if (t === "settings") row.id = settingsId();
          items.push({ t, r: row });
        }
      }
      if (!items.length) return toast("No wallet records found in that file.");
      S.restore = items;
      render();
    } catch {
      toast("That file isn't a wallet backup.");
    }
  }

  async function signOut() {
    S.armed = null;
    try { await sb.auth.signOut({ scope: "local" }); } catch { }
    try {
      const prefix = `wallet:v1:${S.uid}:`;
      Object.keys(localStorage).filter(k => k.startsWith(prefix)).forEach(k => localStorage.removeItem(k));
      localStorage.removeItem("wallet:lastUser");
    } catch { }
    S.session = null; S.uid = null; S.offline = false; S.outbox = []; S.last = {};
    for (const t of TABLES) S.data[t] = new Map();
    shell = null;
    S.view = "home";
    render();
  }

  function setSession(session) {
    const changed = S.uid !== session.user.id;
    S.session = session;
    S.email = session.user.email || "";
    S.offline = false;
    if (changed) {
      S.uid = session.user.id;
      try { localStorage.setItem("wallet:lastUser", S.uid); } catch { }
      loadCache();
      shell = null;
    }
  }

  async function recover() {
    if (!sb) return;
    let session = null;
    try { const { data } = await sb.auth.getSession(); session = data.session; } catch { session = null; }
    if (session) { setSession(session); render(); sync(); }
    else if (S.offline && navigator.onLine) { S.offline = false; render(); }
  }

  async function start() {
    S.month = thisMonth();
    if (!CFG.supabaseUrl || !CFG.supabaseAnonKey || !window.supabase) return render();
    sb = window.supabase.createClient(CFG.supabaseUrl, CFG.supabaseAnonKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false, storageKey: "wallet-auth" }
    });
    const shared = location.hash.match(/^#share=(.+)$/);
    if (shared) return renderShared(shared[1]);
    sb.auth.onAuthStateChange((event, session) => {
      if (session && (event === "TOKEN_REFRESHED" || event === "SIGNED_IN" || event === "INITIAL_SESSION")) {
        if (S.uid === session.user.id) S.session = session;
      }
    });
    let session = null;
    try { const { data } = await sb.auth.getSession(); session = data.session; } catch { session = null; }
    if (session) setSession(session);
    else {
      let last = null;
      try { last = localStorage.getItem("wallet:lastUser"); } catch { last = null; }
      if (last && !navigator.onLine) { S.uid = last; S.offline = true; loadCache(); }
    }
    render();
    if (S.session) sync();
  }

  window.addEventListener("online", () => { if (S.offline || !S.session) recover(); else sync(); renderStatus(); });
  window.addEventListener("offline", renderStatus);
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") { if (S.offline) recover(); else sync(); } });
  setInterval(() => { if (document.visibilityState === "visible" && S.session) sync(); }, 120000);
  if ("serviceWorker" in navigator && location.protocol === "https:") navigator.serviceWorker.register("sw.js").catch(() => { });

  window.addEventListener("hashchange", () => location.reload());
  start();
})();

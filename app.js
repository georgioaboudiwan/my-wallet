(() => {
  "use strict";

  const CFG = window.WALLET_CONFIG || {};
  const root = document.getElementById("app");
  const toastEl = document.getElementById("toast");
  const SVGNS = "http://www.w3.org/2000/svg";
  const TABLES = ["accounts", "categories", "transactions", "rules", "settings", "people", "loan_entries"];
  const COLS = {
    accounts: ["id", "user_id", "name", "currency", "kind", "opening_balance", "sort", "archived", "enc", "deleted_at"],
    categories: ["id", "user_id", "name", "kind", "bucket", "color", "budget", "sort", "enc", "deleted_at"],
    transactions: ["id", "user_id", "kind", "amount", "currency", "rate", "account_id", "to_account_id", "to_amount", "category_id", "note", "occurred_on", "rule_id", "receipt", "enc", "deleted_at"],
    rules: ["id", "user_id", "kind", "amount", "currency", "account_id", "category_id", "note", "day", "next_on", "active", "enc", "deleted_at"],
    settings: ["id", "user_id", "data", "enc", "deleted_at"],
    people: ["id", "user_id", "name", "direction", "currency", "phone", "share_token", "sort", "enc", "senc", "deleted_at"],
    loan_entries: ["id", "user_id", "person_id", "amount", "note", "occurred_on", "enc", "senc", "deleted_at"]
  };
  const DEFAULTS = { sort: 0, archived: false, active: true, opening_balance: 0, color: "#5b7083", data: {} };
  const ID_RE = /^[A-Za-z0-9_:@.\-]{1,160}$/;
  const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
  const COLORS = ["#2e9e6b", "#3b7dd8", "#7a5cd6", "#d9a521", "#d9622b", "#d6455d", "#c2508f", "#1f9bb0", "#8a9a2b", "#5f6ad1", "#b5793a", "#5b7083"];
  const BUCKET_COLORS = ["#2f74c9", "#c14a87", "#b8892a", "#2e9e6b", "#7a5cd6", "#d9622b", "#1f9bb0", "#5b7083"];
  const BUCKET_ID = /^[a-z0-9_-]{1,40}$/;
  const DEFAULT_BUCKETS = [
    { id: "needs", name: "Needs", pct: 50, color: "#2f74c9", save: false },
    { id: "wants", name: "Wants", pct: 30, color: "#c14a87", save: false },
    { id: "savings", name: "Savings", pct: 20, color: "#b8892a", save: true }
  ];
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
  const VERSION = "3.7.3";
  const ICONS = {
    home: "M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z",
    list: "M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01",
    chart: "M3 3v18h18M7 15l4-4 3 3 6-6",
    cam: "M4 8h3l2-3h6l2 3h3v11H4zM12 17a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z",
    chev: "M6 9l6 6 6-6",
    help: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM9.6 9.3a2.5 2.5 0 0 1 4.8.8c0 1.7-2.4 2.1-2.4 3.6M12 17h.01",
    up: "M12 19V5M5 12l7-7 7 7",
    down: "M12 5v14M5 12l7 7 7-7",
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
    cart: "M3 4h2l2.4 11.2a1 1 0 0 0 1 .8h9.2a1 1 0 0 0 1-.8L20 8H6.2M9 20h.01M17 20h.01",
    wifi: "M5 12.5a10 10 0 0 1 14 0M8.5 16a5 5 0 0 1 7 0M2 9a15 15 0 0 1 20 0M12 19.5h.01",
    bolt: "M13 2 4 14h7l-1 8 9-12h-7z",
    car: "M5 17h14M6 17v2.5M18 17v2.5M4 13l2-6h12l2 6v4H4zM7.5 14h.01M16.5 14h.01",
    heart: "M20.8 5.6a5 5 0 0 0-7.6.6L12 7.4l-1.2-1.2a5 5 0 0 0-7.6 6.5L12 21l8.8-8.3a5 5 0 0 0 0-7.1z",
    cup: "M17 8h1a3 3 0 0 1 0 6h-1M3 8h14v6a5 5 0 0 1-5 5H8a5 5 0 0 1-5-5zM7 2v3M11 2v3",
    bag: "M6 7h12l1 13H5zM9 7a3 3 0 0 1 6 0",
    star: "M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z",
    gift: "M3 9h18v4H3zM5 13v8h14v-8M12 9v12M12 9S10 4 7.5 4a2.5 2.5 0 0 0 0 5M12 9s2-5 4.5-5a2.5 2.5 0 0 1 0 5",
    bank: "M3 21h18M5 21V10M19 21V10M9 21v-6M15 21v-6M2 10l10-6 10 6z",
    work: "M3 8h18v12H3zM8 8V5h8v3M3 13h18",
    laptop: "M4 5h16v11H4zM2 19h20",
    coin: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v10M15 9.5c-.5-1-1.6-1.5-3-1.5-1.7 0-3 .8-3 2s1.3 1.7 3 2 3 .9 3 2-1.3 2-3 2c-1.4 0-2.6-.6-3-1.6",
    bell: "M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.9 1.9 0 0 0 3.4 0",
    shield: "M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6z",
    users: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
    mail: "M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zM3 7l9 6 9-6",
    lock: "M6 11h12a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1zM8 11V7a4 4 0 0 1 8 0v4",
    trash: "M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3",
    del: "M21 5H9l-6 7 6 7h12a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1zM17 9l-5 6M12 9l5 6",
    check: "M5 12.5l4.5 4.5L19 7.5",
    minus: "M5 12h14",
    cal: "M3 9h18M8 3v4M16 3v4M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z",
    note: "M4 20h4L18.5 9.5a2.8 2.8 0 0 0-4-4L4 16z",
    repeat: "M17 2l4 4-4 4M3 11V9a3 3 0 0 1 3-3h15M7 22l-4-4 4-4M21 13v2a3 3 0 0 1-3 3H3",
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
  let renderQueued = false;
  const scheduleRender = () => {
    if (renderQueued) return;
    renderQueued = true;
    requestAnimationFrame(() => { renderQueued = false; render(); });
  };
  let shell = null;
  let ver = 0;
  const memo = new Map();

  const I18N = window.WALLET_I18N || { words: {}, patterns: [] };
  const LANGS = { en: "English", fr: "Français", ar: "العربية" };
  let LANG = (() => { try { const v = localStorage.getItem("wallet:lang"); return LANGS[v] ? v : "en"; } catch { return "en"; } })();
  const PATTERNS = I18N.patterns.map(([re, fr, ar]) => [new RegExp(re), fr, ar]);
  const trCache = new Map();
  const tr = str => {
    if (LANG === "en" || typeof str !== "string" || !str) return str;
    const i = LANG === "fr" ? 0 : 1;
    const w = I18N.words[str];
    if (w) return w[i];
    if (trCache.has(str)) return trCache.get(str);
    let out = str;
    let hit = false;
    for (const [re, fr, ar] of PATTERNS) {
      const m = str.match(re);
      if (m) { out = (i === 0 ? fr : ar).replace(/\$(\d)/g, (_, n) => i === 1 ? `\u2068${tr(m[Number(n)])}\u2069` : tr(m[Number(n)])); hit = true; break; }
    }
    if (!hit && str.length < 400) {
      for (const sep of [" · ", ", "]) {
        if (!str.includes(sep)) continue;
        const parts = str.split(sep);
        const done = parts.map(tr);
        if (done.some((d, k) => d !== parts[k])) { out = done.join(LANG === "ar" && sep === ", " ? "، " : sep); break; }
      }
    }
    if (trCache.size > 500) trCache.clear();
    trCache.set(str, out);
    return out;
  };
  const dateLocale = () => LANG === "fr" ? "fr-FR" : LANG === "ar" ? "ar-LB-u-nu-latn" : "en-GB";
  const applyLang = () => { document.documentElement.lang = LANG; document.documentElement.dir = LANG === "ar" ? "rtl" : "ltr"; };
  const setLang = v => { if (!LANGS[v] || v === LANG) return; LANG = v; trCache.clear(); try { localStorage.setItem("wallet:lang", v); } catch { } applyLang(); shell = null; render(); };
  const toTop = () => { window.scrollTo(0, 0); if (document.scrollingElement) document.scrollingElement.scrollTop = 0; if (shell && shell.main) shell.main.scrollTop = 0; };
  const langChosen = () => { try { return !!LANGS[localStorage.getItem("wallet:lang")]; } catch { return true; } };
  function renderLangPick() {
    shell = null;
    const pick = k => { LANG = k; trCache.clear(); try { localStorage.setItem("wallet:lang", k); } catch { } applyLang(); render(); };
    root.replaceChildren(h("div", { class: "lang-pick" },
      h("img", { class: "login-logo", src: "icons/icon-192.png", alt: "" }),
      h("h1", null, "My Wallet"),
      h("p", { lang: "en" }, "Choose your language"),
      h("p", { lang: "fr" }, "Choisissez votre langue"),
      h("p", { lang: "ar", dir: "rtl" }, "اختر لغتك"),
      h("div", { class: "lang-list" }, Object.entries(LANGS).map(([k, name]) => h("button", { type: "button", class: "btn alt", lang: k, on: { click: () => pick(k) } }, name)))));
  }
  const TR_ATTRS = new Set(["placeholder", "aria-label", "title", "alt"]);

  function dispatch(e) {
    const fn = this.__on && this.__on[e.type];
    if (fn) return fn.call(this, e);
  }
  const PROPS = ["checked", "disabled", "readOnly", "hidden"];
  function morph(old, neu) {
    if (old.nodeType !== neu.nodeType || old.nodeName !== neu.nodeName) { old.replaceWith(neu); return; }
    if (old.nodeType === 3) { if (old.nodeValue !== neu.nodeValue) old.nodeValue = neu.nodeValue; return; }
    if (old.nodeType !== 1) return;
    if (old.namespaceURI !== "http://www.w3.org/1999/xhtml" || old.id !== neu.id) { if (!old.isEqualNode(neu)) old.replaceWith(neu); return; }
    for (const a of [...old.attributes]) if (!neu.hasAttribute(a.name)) old.removeAttribute(a.name);
    for (const a of neu.attributes) if (old.getAttribute(a.name) !== a.value) old.setAttribute(a.name, a.value);
    const on = neu.__on || null;
    if (on) for (const ev of Object.keys(on)) if (!old.__on || !old.__on[ev]) old.addEventListener(ev, dispatch);
    old.__on = on;
    for (const k of PROPS) if (k in old && old[k] !== neu[k]) old[k] = neu[k];
    const tag = old.nodeName;
    if (tag === "INPUT" && old.type === "file") return;
    let o = old.firstChild, n = neu.firstChild;
    while (n) {
      const nextN = n.nextSibling;
      if (!o) { old.appendChild(n); n = nextN; continue; }
      if (n.nodeType === 1 && n.id && !(o.nodeType === 1 && o.id === n.id)) {
        let hit = null;
        for (let x = o.nextSibling; x; x = x.nextSibling) if (x.nodeType === 1 && x.id === n.id) { hit = x; break; }
        if (hit) { old.insertBefore(hit, o); o = hit; }
        else { old.insertBefore(n, o); n = nextN; continue; }
      }
      const nextO = o.nextSibling;
      morph(o, n);
      o = nextO; n = nextN;
    }
    while (o) { const nextO = o.nextSibling; o.remove(); o = nextO; }
    if ((tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") && document.activeElement !== old && old.value !== neu.value) old.value = neu.value;
  }

  const h = (tag, props, ...kids) => {
    const el = document.createElement(tag);
    if (props) {
      for (const [k, v] of Object.entries(props)) {
        if (v == null || v === false) continue;
        if (k === "class") el.className = v;
        else if (k === "on") { el.__on = { ...(el.__on || {}), ...v }; for (const ev of Object.keys(v)) el.addEventListener(ev, dispatch); }
        else if (k === "style") Object.assign(el.style, v);
        else if (k === "value" || k === "checked" || k === "disabled" || k === "readOnly" || k === "hidden") el[k] = v;
        else el.setAttribute(k, v === true ? "" : TR_ATTRS.has(k) ? tr(String(v)) : String(v));
      }
    }
    for (const kid of kids.flat(Infinity)) {
      if (kid == null || kid === false) continue;
      el.append(kid instanceof Node ? kid : tr(String(kid)));
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
  const monthLabel = m => new Date(m + "-01T12:00:00").toLocaleDateString(dateLocale(), { month: "long", year: "numeric" });
  const monthShort = m => new Date(m + "-01T12:00:00").toLocaleDateString(dateLocale(), { month: "short" });
  const monthName = m => new Date(m + "-01T12:00:00").toLocaleDateString(dateLocale(), { month: "long" });
  const dayLabel = s => {
    if (s === today()) return "Today";
    if (s === ymd(new Date(Date.now() - 864e5))) return "Yesterday";
    const d = new Date(s + "T12:00:00");
    return d.toLocaleDateString(dateLocale(), { weekday: "short", day: "numeric", month: "short", year: s.slice(0, 4) === today().slice(0, 4) ? undefined : "numeric" });
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
    return new Date(iso).toLocaleDateString(dateLocale(), { day: "numeric", month: "short" });
  };

  const CURRENCIES = {
    USD: { name: "US dollar", symbol: "$", rate: 1 },
    LBP: { name: "Lebanese lira", symbol: "LBP", tag: "LL", dec: 0, big: true, rate: 89500 },
    EUR: { name: "Euro", symbol: "€", rate: 0.86 },
    GBP: { name: "British pound", symbol: "£", rate: 0.76 },
    AED: { name: "UAE dirham", symbol: "AED", rate: 3.6725 },
    SAR: { name: "Saudi riyal", symbol: "SAR", rate: 3.75 },
    QAR: { name: "Qatari riyal", symbol: "QAR", rate: 3.64 },
    KWD: { name: "Kuwaiti dinar", symbol: "KWD", rate: 0.307 },
    BHD: { name: "Bahraini dinar", symbol: "BHD", rate: 0.376 },
    OMR: { name: "Omani rial", symbol: "OMR", rate: 0.385 },
    JOD: { name: "Jordanian dinar", symbol: "JOD", rate: 0.709 },
    EGP: { name: "Egyptian pound", symbol: "EGP", rate: 48 },
    TRY: { name: "Turkish lira", symbol: "TRY", rate: 41 },
    IQD: { name: "Iraqi dinar", symbol: "IQD", dec: 0, big: true, rate: 1310 },
    CAD: { name: "Canadian dollar", symbol: "CA$", rate: 1.39 },
    AUD: { name: "Australian dollar", symbol: "A$", rate: 1.53 },
    CHF: { name: "Swiss franc", symbol: "CHF", rate: 0.8 },
    JPY: { name: "Japanese yen", symbol: "¥", dec: 0, rate: 150 },
    CNY: { name: "Chinese yuan", symbol: "CNY", rate: 7.1 },
    INR: { name: "Indian rupee", symbol: "₹", rate: 88 },
    BRL: { name: "Brazilian real", symbol: "R$", rate: 5.4 }
  };
  const CUR_RE = /^[A-Z]{3}$/;
  const curInfo = c => CURRENCIES[c] || { name: c, symbol: c };
  const curDec = c => curInfo(c).dec ?? 2;
  const isBig = c => !!curInfo(c).big;
  const curTag = c => curInfo(c).tag || curInfo(c).symbol;
  const curSymbol = c => curInfo(c).symbol;
  const roundCur = (v, c) => curDec(c) === 0 ? Math.round(v) : Math.round(v * 100) / 100;
  const withSymbol = (c, num) => { const sym = curSymbol(c); return sym.length === 1 || /^[A-Z]{1,2}\$$/.test(sym) ? sym + num : `${sym} ${num}`; };

  const fmt = (n, cur, opts = {}) => {
    if (S.hidden && !opts.show) return withSymbol(cur, "•••");
    const neg = n < 0;
    const a = Math.abs(Number(n) || 0);
    const dec = curDec(cur);
    let num;
    if (opts.compact && a >= 1e6) num = (a / 1e6).toLocaleString("en-US", { maximumFractionDigits: 1 }) + "M";
    else if (opts.compact && a >= 1e4 && !isBig(cur)) num = (a / 1e3).toLocaleString("en-US", { maximumFractionDigits: 1 }) + "k";
    else if (dec === 0 || opts.whole) num = Math.round(a).toLocaleString("en-US");
    else { const r = Math.round(a * 100) / 100; num = r.toLocaleString("en-US", { minimumFractionDigits: r % 1 ? 2 : 0, maximumFractionDigits: 2 }); }
    return (neg ? "−" : "") + withSymbol(cur, num);
  };
  const money = (n, opts) => fmt(n, mainCur(), opts);
  const parseAmt = raw => {
    const s = String(raw || "").replace(/[,\s]/g, "").replace(/^[^\d.]+/, "");
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
  const CAT_ICON_KEYS = { groceries: "cart", home: "home", bills: "wifi", generator: "bolt", transport: "car", health: "heart", eating: "cup", shopping: "bag", fun: "star", subs: "repeat", gifts: "gift", debt: "bank", salary: "work", freelance: "laptop", giftsin: "gift", otherin: "coin" };
  const CAT_ICON_WORDS = [[/grocer|food|super|market/i, "cart"], [/rent|home|house|apart/i, "home"], [/bill|internet|phone|mobile|wifi/i, "wifi"], [/generat|electric|power|ampere/i, "bolt"], [/fuel|petrol|car|transport|taxi|uber|bus/i, "car"], [/health|doctor|pharm|medic|hospital|gym/i, "heart"], [/eat|coffee|restaurant|lunch|dinner|cafe|drink/i, "cup"], [/shop|cloth|amazon/i, "bag"], [/fun|going out|movie|party|travel|trip/i, "star"], [/subscri|netflix|spotify|apple|icloud/i, "repeat"], [/gift|family/i, "gift"], [/loan|debt|bank|repay/i, "bank"], [/salary|work|job|wage/i, "work"], [/freelance|side|client/i, "laptop"]];
  const catIconName = c => {
    if (!c) return null;
    const m = String(c.id).match(/:cat:([a-z]+)$/);
    if (m && CAT_ICON_KEYS[m[1]]) return CAT_ICON_KEYS[m[1]];
    const w = CAT_ICON_WORDS.find(([re]) => re.test(c.name));
    return w ? w[1] : (c.kind === "income" ? "coin" : null);
  };
  const catGlyph = (c, cls = "ico") => { const n = catIconName(c); return n ? icon(n, cls) : (c ? c.name.charAt(0).toUpperCase() : "?"); };
  const settingsId = () => "settings:" + S.uid;
  const storedSettings = () => (S.data.settings.get(settingsId()) || {}).data || {};
  let settingsSrc = null, settingsCache = null;
  const settings = () => {
    const d = storedSettings();
    if (settingsCache && settingsSrc === d) return settingsCache;
    settingsSrc = d;
    settingsCache = {
      main: CUR_RE.test(d.main || "") ? d.main : "USD",
      rates: { LBP: Number(d.rate) > 0 ? Number(d.rate) : 89500, ...(d.rates && typeof d.rates === "object" ? Object.fromEntries(Object.entries(d.rates).filter(([k, v]) => CUR_RE.test(k) && Number(v) > 0).map(([k, v]) => [k, Number(v)])) : {}) },
      loanDue: d.loanDue && typeof d.loanDue === "object" ? Object.fromEntries(Object.entries(d.loanDue).filter(([k, v]) => typeof k === "string" && DATE_RE.test(String(v)))) : {},
      autoRates: d.autoRates !== false,
      strictVault: d.strictVault === true,
      manualRates: Array.isArray(d.manualRates) ? d.manualRates.filter(c => CUR_RE.test(c)) : [],
      ratesAt: DATE_RE.test(d.ratesAt || "") ? d.ratesAt : "",
      goals: Array.isArray(d.goals) ? d.goals.filter(g => g && typeof g.id === "string" && Number(g.target) > 0).slice(0, 12).map((g, i) => ({ id: g.id.slice(0, 40), name: String(g.name || "Goal").slice(0, 40), target: Number(g.target), saved: Math.max(0, Number(g.saved) || 0), by: /^\d{4}-\d{2}$/.test(g.by || "") ? g.by : "", color: /^#[0-9a-f]{6}$/i.test(g.color) ? g.color : COLORS[i % COLORS.length] })) : [],
      buckets: Array.isArray(d.buckets) && d.buckets.length
        ? d.buckets.filter(b => b && BUCKET_ID.test(b.id)).slice(0, 8).map((b, i) => ({ id: b.id, name: String(b.name || "Group").slice(0, 24), pct: Math.max(0, Math.min(100, Math.round(Number(b.pct) || 0))), color: /^#[0-9a-f]{6}$/i.test(b.color) ? b.color : BUCKET_COLORS[i % BUCKET_COLORS.length], save: !!b.save }))
        : DEFAULT_BUCKETS.map(b => ({ ...b, pct: d.plan && Number.isFinite(d.plan[b.id]) ? d.plan[b.id] : b.pct })),
      income: Number(d.income) > 0 ? Number(d.income) : 0,
      incomeMode: d.incomeMode === "fixed" || d.incomeMode === "auto" ? d.incomeMode : (Number(d.income) > 0 ? "fixed" : "auto"),
      incomeSteps: d.incomeSteps && typeof d.incomeSteps === "object" ? Object.fromEntries(Object.entries(d.incomeSteps).filter(([k, v]) => /^\d{4}-\d{2}$/.test(k) && Number(v) > 0).map(([k, v]) => [k, Number(v)])) : {},
      incomeByMonth: d.incomeByMonth && typeof d.incomeByMonth === "object" ? Object.fromEntries(Object.entries(d.incomeByMonth).filter(([k, v]) => /^\d{4}-\d{2}$/.test(k) && Number(v) > 0).map(([k, v]) => [k, Number(v)])) : {},
      seeded: !!d.seeded,
      name: typeof d.name === "string" ? d.name : ""
    };
    return settingsCache;
  };
  const bySort = (a, b) => (a.sort || 0) - (b.sort || 0) || a.name.localeCompare(b.name);
  const byRecent = (a, b) => b.occurred_on.localeCompare(a.occurred_on) || String(b.created_at || "").localeCompare(String(a.created_at || ""));
  const mainCur = () => settings().main;
  const planGroups = () => settings().buckets;
  const groupOf = c => {
    const groups = planGroups();
    if (c && groups.some(g => g.id === c.bucket)) return c.bucket;
    return (groups.find(g => !g.save) || groups[0] || { id: "wants" }).id;
  };
  const groupInfo = id => planGroups().find(g => g.id === id) || { id, name: "Other", color: "#5b7083", pct: 0, save: false };
  const rateOf = c => c === "USD" ? 1 : (settings().rates[c] || curInfo(c).rate || 1);
  const convert = (amount, from, to) => from === to ? Number(amount) : Number(amount) / rateOf(from) * rateOf(to);
  const toMain = (amount, currency) => convert(amount, currency, mainCur());
  const txMain = x => {
    const m = mainCur();
    if (x.currency === m) return Number(x.amount);
    const perUsd = x.currency === "USD" ? 1 : (Number(x.rate) > 0 ? Number(x.rate) : rateOf(x.currency));
    return Number(x.amount) / perUsd * rateOf(m);
  };
  const usedCurrencies = () => [...new Set([mainCur(), ...rows("accounts").map(a => a.currency), ...rows("people").map(p => p.currency)].filter(c => CUR_RE.test(c)))];

  const putMany = items => {
    for (const { t, r } of items) {
      const full = { ...r, user_id: S.uid };
      if (full.deleted_at) S.data[t].delete(full.id); else S.data[t].set(full.id, full);
      S.outbox = S.outbox.filter(o => !(o.t === t && o.r.id === full.id));
      S.outbox.push({ t, r: full });
    }
    ver++;
    save();
    scheduleRender();
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
    if (!VAULT.key) throw new Error("locked");
    const { error } = await sb.from(t).upsert(await Promise.all(list.map(o => sealRow(t, clean(t, o.r), o.r))), { onConflict: "id" });
    if (error) throw error;
  }

  async function flush() {
    if (flushing || !sb || !S.session || !VAULT.key || !S.outbox.length || !navigator.onLine) return;
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
    let changed = 0, unreadable = 0;
    const full = !!S.fullPull;
    await Promise.all(TABLES.map(async t => {
      const seen = full ? new Set() : null;
      const since = !full && S.last[t] ? new Date(new Date(S.last[t]).getTime() - 120000).toISOString() : "1970-01-01T00:00:00Z";
      let from = 0;
      let max = S.last[t] || null;
      for (;;) {
        const { data, error } = await sb.from(t).select("*").gte("updated_at", since).order("updated_at", { ascending: true }).order("id", { ascending: true }).range(from, from + 999);
        if (error) throw error;
        for (const r of data) {
          const prev = S.data[t].get(r.id);
          if (seen && !r.deleted_at) seen.add(r.id);
          if (r.deleted_at) { if (prev) { S.data[t].delete(r.id); changed++; } }
          else if (full || !prev || prev.updated_at !== r.updated_at) { if (await openRow(t, r)) { S.data[t].set(r.id, r); changed++; } else unreadable++; }
          if (!max || r.updated_at > max) max = r.updated_at;
        }
        if (data.length < 1000) break;
        from += 1000;
      }
      if (max) S.last[t] = max;
      if (seen) for (const id of [...S.data[t].keys()]) if (!seen.has(id) && !S.outbox.some(o => o.t === t && o.r.id === id)) { S.data[t].delete(id); changed++; }
    }));
    if (unreadable) toast(`${unreadable} item${unreadable === 1 ? "" : "s"} couldn't be opened on this device. Sign out and back in to fix it.`, "error");
    for (const o of S.outbox) {
      if (o.r.deleted_at) S.data[o.t].delete(o.r.id); else S.data[o.t].set(o.r.id, o.r);
    }
    if (full) S.fullPull = false;
    if (changed) ver++;
    return changed;
  }

  async function sync() {
    if (S.syncing || !sb || !S.session || !VAULT.key || !navigator.onLine) return renderStatus();
    S.syncing = true;
    renderStatus();
    try {
      await flush();
      const changed = await pull();
      S.syncedAt = new Date().toISOString();
      store.set("syncedAt", S.syncedAt);
      S.syncError = false;
      ensureDefaults();
      runRules();
      refreshRates();
      ensureEscrow();
      importQuick();
      if (changed) { save(); scheduleRender(); }
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
          items.push({ t: "transactions", r: { id, kind: r.kind, amount: Number(r.amount), currency: r.currency, rate: rateOf(r.currency), account_id: r.account_id, to_account_id: null, to_amount: null, category_id: r.category_id, note: r.note, occurred_on: next, rule_id: r.id, created_at: new Date().toISOString() } });
        }
        next = nextMonthDay(next, r.day);
        n++;
      }
      if (next !== r.next_on) items.push({ t: "rules", r: { ...r, next_on: next } });
    }
    if (items.length) putMany(items);
  }

  let balMemo = { ver: -1, value: null };
  function balances() {
    if (balMemo.ver === ver) return balMemo.value;
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
    balMemo = { ver, value: b };
    return b;
  }

  function monthStats(m) {
    const k = ver + ":" + m;
    if (memo.has(k)) return memo.get(k);
    const s = { spent: 0, income: 0, byCat: new Map(), buckets: Object.fromEntries(planGroups().map(g => [g.id, 0])), days: new Map(), biggest: null, count: 0 };
    for (const x of rows("transactions")) {
      if (monthOf(x.occurred_on) !== m) continue;
      const u = txMain(x);
      if (x.kind === "expense") {
        s.spent += u;
        s.count++;
        s.byCat.set(x.category_id, (s.byCat.get(x.category_id) || 0) + u);
        const c = cat(x.category_id);
        const g = groupOf(c);
        s.buckets[g] = (s.buckets[g] || 0) + u;
        s.days.set(x.occurred_on, (s.days.get(x.occurred_on) || 0) + u);
        if (!s.biggest || u > txMain(s.biggest)) s.biggest = x;
      } else if (x.kind === "income") {
        s.income += u;
      } else {
        const from = acc(x.account_id);
        const to = acc(x.to_account_id);
        const saveGroup = planGroups().find(g => g.save);
        if (saveGroup && to && to.kind === "savings" && !(from && from.kind === "savings")) s.buckets[saveGroup.id] = (s.buckets[saveGroup.id] || 0) + u;
      }
    }
    if (memo.size > 60) memo.clear();
    memo.set(k, s);
    return s;
  }

  function fixedIncome(m) {
    const st = settings();
    const k = Object.keys(st.incomeSteps).filter(x => x <= m).sort().pop();
    return k ? st.incomeSteps[k] : st.income;
  }

  function incomeBase(m) {
    const st = settings();
    const s = monthStats(m);
    const own = st.incomeByMonth[m];
    if (own > 0) return { base: own, source: "month" };
    const fixed = fixedIncome(m);
    if (st.incomeMode === "fixed" && fixed > 0) return { base: fixed, source: "fixed" };
    if (s.income > 0) return { base: s.income, source: "actual" };
    const prev = [1, 2, 3].map(k => monthStats(shiftMonth(m, -k)).income).filter(v => v > 0);
    if (prev.length) return { base: prev.reduce((a, b) => a + b, 0) / prev.length, source: "estimate" };
    return { base: 0, source: "none" };
  }

  function planFor(m) {
    const st = settings();
    const s = monthStats(m);
    const { base, source } = incomeBase(m);
    return {
      base, source, s,
      buckets: st.buckets.map(g => ({ k: g.id, g, planned: base * g.pct / 100, actual: s.buckets[g.id] || 0 }))
    };
  }

  function safeToSpend() {
    const m = thisMonth();
    const p = planFor(m);
    if (!(p.base > 0)) return null;
    const left = p.buckets.filter(b => !b.g.save).reduce((a, b) => a + b.planned - b.actual, 0);
    const daysLeft = daysInMonth(m) - Number(today().slice(8)) + 1;
    return { perDay: Math.max(0, left) / daysLeft, left, daysLeft };
  }

  function shake(el) {
    if (!el) return;
    el.classList.remove("shake", "attn");
    void el.offsetWidth;
    el.classList.add("shake", "attn");
    el.scrollIntoView({ block: "nearest", behavior: "smooth" });
    setTimeout(() => el.classList.remove("attn"), 1600);
  }
  function fail(errEl, msg, target) {
    if (errEl) errEl.textContent = tr(msg);
    toast(msg, "error");
    shake(target || errEl);
  }
  function toast(msg, kind) {
    toastEl.className = kind === "error" ? "error" : "";
    toastEl.replaceChildren(icon(kind === "error" ? "warn" : "check", "ico sm"), h("span", null, msg));
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
    if (view === "settings") { PUSH.state = null; S.setPage = null; }
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
    admin: { title: "Admin", draw: viewAdmin },
    settings: { title: "Settings", draw: viewSettings }
  };

  function buildShell() {
    const title = h("h1");
    const status = h("button", { type: "button", class: "status", on: { click: () => sync() } });
    const eye = h("button", { type: "button", class: "icon-btn eye-btn", on: { click: () => { S.hidden = !S.hidden; store.set("hidden", S.hidden); render(); } } });
    const help = h("button", { type: "button", class: "icon-btn help-btn", "aria-label": "Help", on: { click: helpSheet } }, icon("help"));
    const gear = h("button", { type: "button", class: "icon-btn gear-btn", "aria-label": "Settings", on: { click: () => go("settings") } }, icon("gear"));
    const main = h("main", { class: "view" });
    const tab = (view, label, ic) => h("button", { type: "button", class: "tab", "data-view": view, on: { click: () => go(view) } }, icon(ic), h("span", null, label));
    const tabs = [tab("home", "Home", "home"), tab("activity", "Activity", "list"), tab("insights", "Insights", "chart"), tab("people", "People", "people")];
    const add = h("button", { type: "button", class: "add-btn", "aria-label": "Add an entry", on: { click: () => txnSheet(null) } }, icon("plus"), h("span", null, "Add"));
    const lens = h("span", { class: "lens", "aria-hidden": "true" });
    const brand = h("div", { class: "side-brand" }, h("img", { src: "icons/icon-192.png", alt: "" }), h("span", null, "My Wallet"));
    const sideAdd = h("button", { type: "button", class: "side-add", on: { click: () => txnSheet(null) } }, icon("plus", "ico"), "New entry");
    const sideSettings = h("button", { type: "button", class: "tab side-only", "data-view": "settings", on: { click: () => go("settings") } }, icon("gear"), h("span", null, "Settings"));
    tabs.push(sideSettings);
    const tabsEl = h("div", { class: "tabs glass" }, lens, ...tabs);
    const ORDER = ["home", "activity", "insights", "people"];
    let drag = null, dragEnd = 0;
    const dragStop = () => { tabsEl.classList.remove("dragging"); tabs.forEach(t => t.classList.remove("over")); drag = null; };
    tabsEl.addEventListener("pointerdown", e => {
      if (window.innerWidth >= 900 || (e.pointerType === "mouse" && e.button !== 0)) return;
      const r = tabsEl.getBoundingClientRect();
      drag = { id: e.pointerId, x0: e.clientX, left: r.left + 5, w: (r.width - 10) / 4, moved: false, pos: 0 };
    });
    tabsEl.addEventListener("pointermove", e => {
      if (!drag || e.pointerId !== drag.id) return;
      if (!drag.moved && Math.abs(e.clientX - drag.x0) < 8) return;
      if (!drag.moved) { drag.moved = true; try { tabsEl.setPointerCapture(e.pointerId); } catch { } tabsEl.classList.add("dragging"); }
      const pos = Math.max(0, Math.min(3 * drag.w, e.clientX - drag.left - drag.w / 2));
      drag.pos = pos;
      lens.style.transform = `translateX(${LANG === "ar" ? pos - 3 * drag.w : pos}px)`;
      const near = Math.round(pos / drag.w);
      const idx = LANG === "ar" ? 3 - near : near;
      tabs.forEach(t => t.classList.toggle("over", t.dataset.view === ORDER[idx]));
    });
    const dragDone = e => {
      if (!drag || e.pointerId !== drag.id) return;
      const d = drag;
      dragStop();
      if (!d.moved) return;
      dragEnd = Date.now();
      const near = Math.round(d.pos / d.w);
      const view = ORDER[LANG === "ar" ? 3 - near : near];
      if (e.type === "pointerup" && view && view !== S.view) go(view); else render();
    };
    tabsEl.addEventListener("pointerup", dragDone);
    tabsEl.addEventListener("pointercancel", dragDone);
    tabsEl.addEventListener("click", e => { if (Date.now() - dragEnd < 400) { e.stopPropagation(); e.preventDefault(); } }, true);
    const nav = h("nav", { class: "dock", "aria-label": "Sections" }, brand, sideAdd, tabsEl, add);
    const top = h("header", { class: "top" }, title, h("div", { class: "tool glass" }, status, eye, help, gear));
    const ptr = h("div", { class: "ptr", "aria-hidden": "true" }, icon("sync"));
    root.replaceChildren(h("div", { class: "shell" }, top, ptr, main, nav));
    shell = { title, status, eye, main, tabs, top, ptr, lens, lastView: null };
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
    el.setAttribute("aria-label", tr(label));
    el.title = tr(label);
    el.replaceChildren(icon(ic), ...(text ? [h("span", null, text)] : []));
  }

  function render() {
    if (!CFG.supabaseUrl || !CFG.supabaseAnonKey) return renderSetup();
    if (!langChosen()) return renderLangPick();
    if (!S.session && !S.offline && !S.booting) return renderAuth();
    if (S.session && !VAULT.key && !S.booting) return renderUnlock();
    if (!shell) buildShell();
    maybeOnboard();
    const v = VIEWS[S.view] || VIEWS.home;
    shell.title.textContent = tr(v.title);
    shell.eye.replaceChildren(icon(S.hidden ? "eyeOff" : "eye"));
    shell.eye.setAttribute("aria-label", tr(S.hidden ? "Show amounts" : "Hide amounts"));
    const sameView = shell.lastView === S.view;
    if (sameView) { clearTimeout(shell.enterTimer); shell.main.classList.remove("enter"); }
    const next = v.draw();
    const cur = shell.main.firstElementChild;
    if (sameView && cur && shell.main.childNodes.length === 1) morph(cur, next);
    else keepFocus(() => shell.main.replaceChildren(next));
    if (!sameView) {
      shell.main.classList.remove("enter");
      void shell.main.offsetWidth;
      shell.main.classList.add("enter");
      shell.lastView = S.view;
      clearTimeout(shell.enterTimer);
      shell.enterTimer = setTimeout(() => shell && shell.main.classList.remove("enter"), 700);
    }
    for (const t of shell.tabs) t.setAttribute("aria-current", t.dataset.view === S.view ? "page" : "false");
    const tabIndex = ["home", "activity", "insights", "people"].indexOf(S.view === "plan" ? "insights" : S.view);
    shell.lens.style.opacity = tabIndex < 0 ? "0" : "1";
    if (tabIndex >= 0) shell.lens.style.transform = `translateX(${LANG === "ar" ? -tabIndex * 100 : tabIndex * 100}%)`;
    renderStatus();
    maybeTour();
  }

  function renderSetup() {
    shell = null;
    root.replaceChildren(h("div", { class: "auth" }, h("div", { class: "auth-box" },
      h("img", { class: "auth-mark", src: "icons/icon-192.png", alt: "" }),
      h("h1", null, "Almost ready"),
      h("p", null, "Add your Supabase project URL and anon key to ", h("code", null, "config.js"), ", then reload this page.")
    )));
  }

  const PROVIDERS = { list: [], loaded: false };
  async function loadProviders() {
    if (PROVIDERS.loaded) return false;
    try {
      const res = await fetch(`${CFG.supabaseUrl}/auth/v1/settings`, { headers: { apikey: CFG.supabaseAnonKey }, credentials: "omit" });
      const j = res.ok ? await res.json() : null;
      const ext = (j && j.external) || {};
      PROVIDERS.list = [["google", "Google"], ["azure", "Microsoft"]].filter(([id]) => ext[id] === true);
      PROVIDERS.loaded = true;
      return PROVIDERS.list.length > 0;
    } catch { return false; }
  }
  async function oauthSignIn(provider) {
    if (!navigator.onLine) return toast("Connect to the internet to sign in.", "error");
    const { error } = await sb.auth.signInWithOAuth({ provider, options: { redirectTo: location.origin + location.pathname, scopes: provider === "azure" ? "email" : undefined } });
    if (error) toast("Couldn't start sign-in. Try again.", "error");
  }
  const isOAuth = () => { try { return localStorage.getItem("wallet:oauth") === "1"; } catch { return false; } };
  const setOAuth = on => { try { if (on) localStorage.setItem("wallet:oauth", "1"); else localStorage.removeItem("wallet:oauth"); } catch { } };

  function renderAuth() {
    shell = null;
    let mode = "signin";
    let busy = false;
    const notice = S.notice; S.notice = null;
    let showPass = false;
    let email = "";
    let password = "";
    const err = h("p", { class: "form-err", role: "alert" });
    const panel = h("form", { class: "login-panel", novalidate: true });

    const field = (id, ic, input, trailing) => h("label", { class: "login-field", for: id }, icon(ic, "ico"), input, trailing || null);

    const draw = () => {
      const create = mode === "create";
      const forgot = mode === "forgot";
      const emailIn = h("input", { id: "a-email", type: "email", autocomplete: "username", inputmode: "email", autocapitalize: "none", spellcheck: "false", enterkeyhint: "next", placeholder: "Email", value: email, "aria-label": "Email",
        on: { input: e => { email = e.target.value; } } });
      const passIn = h("input", { id: "a-pass", type: showPass ? "text" : "password", autocomplete: create ? "new-password" : "current-password", enterkeyhint: "go", placeholder: create ? "New password (10+ characters)" : "Password", maxlength: "72", value: password, "aria-label": "Password",
        on: { input: e => { password = e.target.value; meter(); } } });
      const eye = h("button", { type: "button", class: "login-eye", "aria-label": showPass ? "Hide password" : "Show password", on: { click: () => { showPass = !showPass; draw(); document.getElementById("a-pass").focus(); } } }, icon(showPass ? "eyeOff" : "eye", "ico"));
      const strength = h("div", { class: "login-meter", "aria-hidden": "true" }, h("span"), h("span"), h("span"));
      const meterText = h("p", { class: "login-hint" });
      const meter = () => {
        if (!create) return;
        const p = password;
        const score = !p ? 0 : p.length < 10 ? 1 : (/[A-Z]/.test(p) + /[0-9]/.test(p) + /[^A-Za-z0-9]/.test(p) + (p.length >= 14)) >= 2 ? 3 : 2;
        strength.dataset.score = String(score);
        meterText.textContent = tr(!p ? "Use at least 10 characters." : score === 1 ? `${10 - p.length} more character${10 - p.length === 1 ? "" : "s"} needed.` : score === 2 ? "Okay. Add numbers or symbols to make it stronger." : "Strong password.");
      };
      panel.replaceChildren(...[
        forgot
          ? h("div", { class: "login-title" }, h("h2", null, "Reset your password"), h("p", null, "Enter your email and we'll send you a link to choose a new password."))
          : seg([["signin", "Sign in"], ["create", "Create account"]], mode, k => { mode = k; err.textContent = ""; draw(); }, "Sign in or create an account"),
        h("div", { class: "login-fields" },
          field("a-email", "mail", emailIn),
          forgot ? null : field("a-pass", "lock", passIn, eye)),
        mode === "signin" ? h("button", { type: "button", class: "link-btn login-link", on: { click: () => { mode = "forgot"; err.textContent = ""; draw(); } } }, "Forgot password?") : null,
        create ? h("div", { class: "login-strength" }, strength, meterText) : null,
        err,
        h("button", { class: "btn login-go", type: "submit", disabled: busy }, busy ? h("span", { class: "spinner", "aria-hidden": "true" }) : null, busy ? "One moment…" : forgot ? "Send reset link" : create ? "Create account" : "Sign in"),
        forgot ? h("button", { type: "button", class: "link-btn login-link center", on: { click: () => { mode = "signin"; err.textContent = ""; draw(); } } }, "Back to sign in") : null,
        !forgot && PROVIDERS.list.length ? h("div", { class: "login-or" }, h("span", null, "or")) : null,
        ...(!forgot ? PROVIDERS.list.map(([id, name]) => h("button", { type: "button", class: "btn alt login-provider", disabled: busy, on: { click: () => oauthSignIn(id) } }, `Continue with ${name}`)) : []),
        h("p", { class: "login-note" }, icon("shield", "ico sm"), h("span", null, "Your data is private and encrypted in transit.")),
        h("div", { class: "login-langs" }, Object.entries(LANGS).map(([k, name]) => h("button", { type: "button", class: "link-btn", "aria-pressed": String(k === LANG), on: { click: () => setLang(k) } }, name)))].filter(Boolean));
      meter();
    };

    panel.addEventListener("submit", async ev => {
      ev.preventDefault();
      if (busy) return;
      err.textContent = "";
      const target = email.trim().toLowerCase();
      if (!navigator.onLine) return fail(err, "You're offline. Connect to the internet to sign in.");
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(target) || target.length > 254) return fail(err, "Enter a valid email address.", panel.querySelector(".login-field"));
      if (mode === "forgot") {
        busy = true; draw();
        const { error } = await sb.auth.resetPasswordForEmail(target, { redirectTo: location.origin + location.pathname });
        busy = false;
        if (error && error.status === 429) { draw(); return fail(err, "Too many attempts. Wait a few minutes and try again."); }
        mode = "signin"; draw();
        return toast("If that email has an account, a reset link is on its way.");
      }
      if (!password) return fail(err, "Enter your password.", panel.querySelectorAll(".login-field")[1]);
      if (mode === "create" && (password.length < 10 || password.length > 72)) return fail(err, "Use a password of at least 10 characters.", panel.querySelectorAll(".login-field")[1]);
      busy = true; draw();
      const res = mode === "create"
        ? await sb.auth.signUp({ email: target, password })
        : await sb.auth.signInWithPassword({ email: target, password });
      busy = false;
      if (res.error) {
        draw();
        const m = String(res.error.message || "");
        return fail(err, res.error.status === 429 ? "Too many attempts. Wait a minute and try again."
          : /banned/i.test(m) ? "This account is blocked."
          : /not allowed|disabled/i.test(m) ? "New accounts are turned off for this wallet."
          : /registered|exists/i.test(m) ? "That email already has an account. Sign in instead."
          : /confirm/i.test(m) ? "Confirm your email first, using the link we sent you."
          : /weak|pwned|password/i.test(m) && mode === "create" ? "That password is too weak. Try a longer one."
          : mode === "create" ? "We couldn't create the account. Try again." : "Incorrect email or password.");
      }
      if (!res.data.session) { mode = "signin"; draw(); return fail(err, "Account created. Check your email to confirm it, then sign in."); }
      setOAuth(false);
      setSession(res.data.session);
      const unlocked = await unlockVault(password);
      password = "";
      if (unlocked.need) S.unlockNeed = "recovery";
      render();
      if (unlocked.ok) { recoverySheet(); sync(); }
    });

    draw();
    loadProviders().then(changed => { if (changed && !busy && root.contains(panel)) draw(); });
    if (notice) err.textContent = notice;
    root.replaceChildren(h("div", { class: "login" },
      h("header", { class: "login-hero" },
        h("div", { class: "login-brand" },
          h("img", { class: "login-logo", src: "icons/icon-192.png", alt: "" }),
          h("h1", null, "My Wallet"),
          h("p", null, "All your money, in any currency.")),
        h("div", { class: "login-card", "aria-hidden": "true" },
          h("span", { class: "lc-label" }, "Total balance"),
          h("span", { class: "lc-total num" }, "$2,450"),
          h("span", { class: "lc-row" }, h("i", { class: "lc-bar a" }), h("i", { class: "lc-bar b" }), h("i", { class: "lc-bar c" }))),
        h("ul", { class: "login-perks" },
          h("li", null, icon("chart", "ico sm"), "Insights"),
          h("li", null, icon("plan", "ico sm"), "Budgets"),
          h("li", null, icon("people", "ico sm"), "Loans"))),
      panel));
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
      dot = h("span", { class: "dot", style: { background: c ? c.color : "#5b7083" } }, c ? catGlyph(c, "ico sm") : title.charAt(0).toUpperCase());
      sign = x.kind === "income" ? "+" : "−";
      cls += x.kind === "income" ? " pos" : " neg";
    }
    const sub = [x.note, x.kind !== "transfer" && a ? a.name : null, x.rule_id ? "Monthly" : null, x.receipt ? "Receipt" : null].filter(Boolean).join(" · ");
    const toAcc = acc(x.to_account_id);
    const other = x.kind === "transfer" && toAcc && toAcc.currency !== x.currency && x.to_amount
      ? h("small", null, "→ " + fmt(Number(x.to_amount), toAcc.currency))
      : (x.currency !== mainCur() ? h("small", null, "≈ " + money(txMain(x))) : null);
    return h("button", { type: "button", class: "row", on: { click: () => txnSheet(x) } },
      dot,
      h("span", { class: "row-main" }, h("span", { class: "row-title" }, title), sub ? h("span", { class: "row-sub" }, sub) : null),
      h("span", { class: cls }, sign + fmt(Number(x.amount), x.currency), other));
  }

  function budgetState(catId) {
    const m = thisMonth();
    const c = cat(catId);
    const budget = c ? Number(c.budget) || 0 : 0;
    const spent = monthStats(m).byCat.get(catId) || 0;
    const safe = safeToSpend();
    return { c: budget > 0 ? c : null, budget, ratio: budget > 0 ? spent / budget : 0, left: safe ? safe.left : 0 };
  }

  const monthsUntil = by => { const [y1, m1] = thisMonth().split("-").map(Number); const [y2, m2] = by.split("-").map(Number); return (y2 - y1) * 12 + (m2 - m1); };
  const goalNeed = g => {
    const left = Math.max(0, g.target - g.saved);
    if (!left) return { left: 0, perMonth: 0, months: 0, late: false };
    if (!g.by) return { left, perMonth: 0, months: 0, late: false };
    const months = monthsUntil(g.by) + 1;
    return { left, perMonth: months > 0 ? left / months : left, months: Math.max(0, months), late: months <= 0 };
  };
  const saveGoals = list => saveSettings({ goals: list });

  function goalsCard(always) {
    const goals = settings().goals;
    if (!goals.length && !always) return null;
    const card = h("section", { class: "card flush" }, h("div", { class: "card-head" }, h("h2", null, "Savings goals"), h("button", { type: "button", class: "link-btn", on: { click: () => goalSheet(null) } }, "Add")));
    for (const g of goals) {
      const n = goalNeed(g);
      const pct = Math.min(100, g.saved / g.target * 100);
      card.append(h("button", { type: "button", class: "cat-row", on: { click: () => goalSheet(g) } },
        h("div", { class: "cat-line" }, h("span", { class: "swatch", style: { background: g.color } }), h("span", { class: "name" }, g.name), h("span", { class: "val" }, `${money(g.saved, { whole: true })} / ${money(g.target, { whole: true })}`)),
        h("div", { class: "bar" }, h("span", { style: { width: pct + "%", background: g.color } })),
        h("span", { class: "goal-sub" + (n.late ? " neg" : "") }, !n.left ? "Goal reached" : n.late ? `${money(n.left, { whole: true })} to go · target date passed` : g.by ? `${money(n.perMonth, { whole: true })} a month until ${monthLabel(g.by)}` : `${money(n.left, { whole: true })} to go`)));
    }
    if (!goals.length) card.append(h("p", { class: "empty" }, "Set a target, such as an emergency fund or a trip, and see how much to put aside each month."));
    return card;
  }

  function goalSheet(g) {
    const st = settings();
    const cur = mainCur();
    const f = { name: g ? g.name : "", target: g ? String(g.target) : "", by: g ? g.by : "" };
    const err = h("p", { class: "form-err", role: "alert" });
    const body = h("form", { class: "form", id: "goal-form", novalidate: true });
    const move = sign => amountSheet({
      title: sign > 0 ? `Add to ${g.name}` : `Take out of ${g.name}`, cur, max: sign < 0 ? g.saved : null,
      quick: [50, 100, 200, 500].map(n => roundCur(convert(n, "USD", cur), cur)),
      verbFor: v => !v ? "Enter an amount" : sign > 0 ? `Add ${fmt(v, cur, { show: true })}` : `Take out ${fmt(v, cur, { show: true })}`,
      previewFor: v => `Saved so far: ${fmt(g.saved + sign * v, cur, { show: true })} of ${fmt(g.target, cur, { show: true })}`,
      onSave: v => {
        const saved = Math.max(0, g.saved + sign * v);
        saveGoals(st.goals.map(x => x.id === g.id ? { ...x, saved } : x));
        closeSheet();
        toast(saved >= g.target ? `${g.name} reached. Well done.` : `${g.name}: ${fmt(saved, cur, { show: true })} saved.`);
      }
    });
    if (g) {
      const n = goalNeed(g);
      body.append(h("div", { class: "goal-top" },
        h("p", { class: "income-big num" }, fmt(g.saved, cur, { whole: true })),
        h("p", { class: "hint" }, `of ${fmt(g.target, cur, { whole: true, show: true })}${n.left ? ` · ${fmt(n.left, cur, { whole: true, show: true })} to go` : " · reached"}`),
        h("div", { class: "bar" }, h("span", { style: { width: Math.min(100, g.saved / g.target * 100) + "%", background: g.color } })),
        h("div", { class: "inline" },
          h("button", { type: "button", class: "btn", on: { click: () => move(1) } }, "Add money"),
          h("button", { type: "button", class: "btn alt", disabled: !(g.saved > 0), on: { click: () => move(-1) } }, "Take out"))));
    }
    body.append(
      h("label", { class: "field" }, h("span", null, "Name"), h("input", { id: "g-name", class: "input", maxlength: "40", autocomplete: "off", placeholder: "e.g. Emergency fund", value: f.name, on: { input: e => { f.name = e.target.value; } } })),
      h("label", { class: "field" }, h("span", null, `Target amount (${curSymbol(cur)})`), h("input", { id: "g-target", class: "input num", inputmode: "decimal", autocomplete: "off", placeholder: "e.g. 5000", value: f.target, on: { input: e => { f.target = e.target.value; } } })),
      h("label", { class: "field" }, h("span", null, "Target month (optional)"), h("input", { id: "g-by", class: "input", type: "month", min: thisMonth(), value: f.by, on: { input: e => { f.by = e.target.value; } } })),
      err);
    let armed = false;
    const del = g ? h("button", { type: "button", class: "btn danger", on: { click: () => {
      if (!armed) { armed = true; del.textContent = tr("Tap again to delete"); del.classList.add("sure"); return; }
      saveGoals(st.goals.filter(x => x.id !== g.id)); closeSheet(); toast("Goal deleted.");
    } } }, "Delete goal") : null;
    if (del) body.append(del);
    body.addEventListener("submit", ev => {
      ev.preventDefault();
      const name = f.name.trim();
      const target = parseAmt(f.target);
      if (!name) return fail(err, "Give the goal a name.", document.getElementById("g-name"));
      if (!target) return fail(err, "Enter the target as a number, like 5000.", document.getElementById("g-target"));
      if (f.by && !/^\d{4}-\d{2}$/.test(f.by)) return fail(err, "Pick a target month.", document.getElementById("g-by"));
      if (!g && st.goals.length >= 12) return fail(err, "You can have up to 12 goals.");
      const next = g
        ? st.goals.map(x => x.id === g.id ? { ...x, name, target, by: f.by } : x)
        : [...st.goals, { id: newId(), name, target, saved: 0, by: f.by, color: COLORS[st.goals.length % COLORS.length] }];
      saveGoals(next);
      closeSheet();
      toast(g ? "Goal saved." : "Goal added.");
    });
    openSheet(g ? g.name : "New goal", body, h("button", { type: "submit", class: "btn", form: "goal-form" }, g ? "Save changes" : "Add goal"));
  }

  function upcomingRules(days) {
    const t = today();
    const end = ymd(new Date(Date.now() + days * 864e5));
    return rows("rules").filter(r => r.active && acc(r.account_id) && DATE_RE.test(r.next_on) && r.next_on > t && r.next_on <= end).sort((a, b) => a.next_on.localeCompare(b.next_on));
  }

  function upcomingCard() {
    const list = upcomingRules(7);
    if (!list.length) return null;
    const card = h("section", { class: "card flush" }, h("div", { class: "card-head" }, h("h2", null, "Coming up this week")));
    for (const r of list.slice(0, 4)) {
      const c = cat(r.category_id);
      const days = Math.round((new Date(r.next_on + "T12:00:00") - new Date(today() + "T12:00:00")) / 864e5);
      card.append(h("button", { type: "button", class: "row", on: { click: () => ruleSheet(r) } },
        h("span", { class: "dot", style: { background: c ? c.color : "#5b7083" } }, c ? catGlyph(c, "ico sm") : icon("repeat", "ico sm")),
        h("span", { class: "row-main" }, h("span", { class: "row-title" }, r.note || (c ? c.name : "Repeating entry")), h("span", { class: "row-sub" }, days === 1 ? "Tomorrow" : `In ${days} days · ${dayLabel(r.next_on)}`)),
        h("span", { class: "row-end " + (r.kind === "income" ? "pos" : "neg") }, (r.kind === "income" ? "+" : "−") + fmt(Number(r.amount), r.currency))));
    }
    return card;
  }

  function recapData(m) {
    const s = monthStats(m);
    const prev = monthStats(shiftMonth(m, -1));
    const p = planFor(m);
    let noSpend = 0;
    for (let d = 1; d <= daysInMonth(m); d++) if (!s.days.has(`${m}-${pad(d)}`)) noSpend++;
    const top = [...s.byCat].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([id, v]) => ({ c: cat(id), v }));
    return { s, prev, p, noSpend, top, change: prev.spent > 0 && s.spent > 0 ? Math.round((s.spent - prev.spent) / prev.spent * 100) : null };
  }

  function recapSheet(m) {
    const d = recapData(m);
    const left = d.s.income - d.s.spent;
    const line = (k, v, cls) => h("div", { class: "cat-line" }, h("span", { class: "name" }, k), h("span", { class: "val" + (cls ? " " + cls : "") }, v));
    const body = h("div", { class: "prose" },
      h("div", { class: "tiles" },
        h("div", { class: "tile" }, h("small", null, "Spent"), h("strong", null, money(d.s.spent, { whole: true }))),
        h("div", { class: "tile" }, h("small", null, "Came in"), h("strong", null, money(d.s.income, { whole: true }))),
        h("div", { class: "tile " + (left >= 0 ? "good" : "bad") }, h("small", null, left >= 0 ? "Left over" : "Overspent"), h("strong", null, money(Math.abs(left), { whole: true })))),
      h("section", { class: "card" },
        d.p.base > 0 ? line("Against your plan", d.s.spent <= d.p.base ? `${money(d.p.base - d.s.spent, { whole: true })} under` : `${money(d.s.spent - d.p.base, { whole: true })} over`, d.s.spent <= d.p.base ? "pos" : "neg") : null,
        d.change != null ? line(`Compared with ${monthName(shiftMonth(m, -1))}`, d.change === 0 ? "The same" : `${Math.abs(d.change)}% ${d.change > 0 ? "more" : "less"}`, d.change > 0 ? "neg" : "pos") : null,
        line("Days with no spending", `${d.noSpend} of ${daysInMonth(m)}`),
        line("Expenses logged", String(d.s.count)),
        d.s.biggest ? line("Biggest expense", `${money(txMain(d.s.biggest), { whole: true })} · ${(cat(d.s.biggest.category_id) || { name: "Uncategorized" }).name}`) : null),
      d.top.length ? h("section", { class: "card" }, h("div", { class: "card-head" }, h("h2", null, "Top categories")),
        d.top.map(t => h("div", { class: "cat-line" }, h("span", { class: "swatch", style: { background: t.c ? t.c.color : "#5b7083" } }), h("span", { class: "name" }, t.c ? t.c.name : "Uncategorized"), h("span", { class: "val" }, money(t.v, { whole: true })), h("span", { class: "pct" }, `${Math.round(t.v / d.s.spent * 100)}%`)))) : null,
      d.p.base > 0 ? h("section", { class: "card" }, h("div", { class: "card-head" }, h("h2", null, "Plan groups")),
        d.p.buckets.map(b => h("div", { class: "cat-line" }, h("span", { class: "swatch", style: { background: b.g.color } }), h("span", { class: "name" }, b.g.name), h("span", { class: "val" }, `${money(b.actual, { whole: true })} / ${money(b.planned, { whole: true })}`)))) : null);
    openSheet(`${monthName(m)} summary`, body, h("button", { type: "button", class: "btn", on: { click: () => { closeSheet(); S.month = m; go("insights"); } } }, "Open full insights"));
  }

  function reminderCard() {
    if (store.get("remindAsk", "") === "no") return null;
    if (PUSH.state === null) { loadPushState(); return null; }
    if (PUSH.state !== "off" && PUSH.state !== "install") return null;
    const later = h("button", { type: "button", class: "btn alt", on: { click: () => { store.set("remindAsk", "no"); render(); toast("You can turn it on later in Settings."); } } }, "Not now");
    if (PUSH.state === "install") return h("section", { class: "card remind" },
      h("div", { class: "remind-top" }, h("span", { class: "dot gold" }, icon("bell", "ico sm")), h("div", null, h("h2", null, "Get a daily reminder"), h("p", null, "Add My Wallet to your Home Screen first, then open it from there."))),
      later);
    const timeIn = h("input", { id: "h-remind", class: "input time-input", type: "time", value: PUSH.time || "21:00", "aria-label": "Reminder time", on: { change: e => { if (/^\d{2}:\d{2}$/.test(e.target.value)) PUSH.time = e.target.value; } } });
    return h("section", { class: "card remind" },
      h("div", { class: "remind-top" }, h("span", { class: "dot gold" }, icon("bell", "ico sm")), h("div", null, h("h2", null, "Get a daily reminder"), h("p", null, "A notification at the time you choose, so no expense is forgotten."))),
      h("label", { class: "remind-time" }, h("span", null, "Remind me at"), timeIn),
      h("div", { class: "remind-actions" },
        h("button", { type: "button", class: "btn", disabled: PUSH.busy, on: { click: () => enablePush((document.getElementById("h-remind") || timeIn).value || "21:00") } }, PUSH.busy ? "One moment…" : "Turn on"),
        later));
  }

  function reminderSheet() {
    const timeIn = h("input", { id: "rs-time", class: "input time-input", type: "time", value: PUSH.time || "21:00", "aria-label": "Reminder time" });
    openSheet("Daily reminder", h("div", { class: "form" },
      h("p", { class: "hint" }, "A notification at the time you choose, so no expense is forgotten."),
      h("label", { class: "remind-time" }, h("span", null, "Remind me at"), timeIn)),
      h("button", { type: "button", class: "btn", on: { click: async () => { const t = /^\d{2}:\d{2}$/.test(timeIn.value) ? timeIn.value : "21:00"; closeSheet(); await enablePush(t); render(); } } }, "Turn on"));
  }

  function reminderPill() {
    const on = PUSH.state === "on";
    const act = () => {
      if (on) { go("settings"); S.setPage = "reminders"; return render(); }
      if (PUSH.state === "install") return toast("Add My Wallet to your Home Screen first, then open it from there.");
      if (PUSH.state === "denied") return toast("Notifications are blocked. Allow them in iPhone Settings → Notifications → Wallet.", "error");
      if (PUSH.state === "unsupported") return toast("This browser can't show notifications.", "error");
      reminderSheet();
    };
    return h("button", { type: "button", class: "remind-pill" + (on ? " on" : ""), on: { click: act } },
      h("span", { class: "dot " + (on ? "neutral" : "gold") }, icon("bell", "ico sm")),
      h("span", { class: "row-main" }, h("span", { class: "row-title" }, on ? "Daily reminder is on" : "Turn on the daily reminder"), h("span", { class: "row-sub" }, on ? `Every day at ${PUSH.time || "21:00"}` : "Get a notification to log what you spent.")),
      on ? icon("fwd") : h("span", { class: "pill-cta" }, "Turn on"));
  }

  function recapCard() {
    const pm = shiftMonth(thisMonth(), -1);
    if (Number(today().slice(8)) > 10 || store.get("recapSeen", "") === pm || !monthStats(pm).count) return null;
    const d = recapData(pm);
    const seen = () => store.set("recapSeen", pm);
    return h("section", { class: "card recap" },
      h("div", { class: "card-head" }, h("h2", null, `${monthName(pm)} summary`), h("button", { type: "button", class: "link-btn", on: { click: () => { seen(); render(); } } }, "Dismiss")),
      h("p", null, `You spent ${money(d.s.spent, { whole: true })}${d.change != null && d.change !== 0 ? `, ${Math.abs(d.change)}% ${d.change > 0 ? "more" : "less"} than the month before` : ""}${d.p.base > 0 ? (d.s.spent <= d.p.base ? `, and stayed ${money(d.p.base - d.s.spent, { whole: true })} under plan.` : `, ${money(d.s.spent - d.p.base, { whole: true })} over plan.`) : "."}`),
      h("button", { type: "button", class: "btn alt", on: { click: () => { seen(); recapSheet(pm); } } }, "See the summary"));
  }

  function netWorthSeries(m, count) {
    const months = [];
    for (let k = count - 1; k >= 0; k--) months.push(shiftMonth(m, -k));
    const accounts = rows("accounts");
    const txns = rows("transactions");
    const people = new Map(rows("people").map(p => [p.id, p]));
    const loans = rows("loan_entries");
    return months.map(mm => {
      const end = `${mm}-${pad(daysInMonth(mm))}`;
      const b = new Map(accounts.map(a => [a.id, Number(a.opening_balance) || 0]));
      const add = (id, v) => { if (b.has(id)) b.set(id, b.get(id) + v); };
      for (const x of txns) {
        if (x.occurred_on > end) continue;
        const amt = Number(x.amount) || 0;
        if (x.kind === "income") add(x.account_id, amt);
        else if (x.kind === "expense") add(x.account_id, -amt);
        else { add(x.account_id, -amt); if (x.to_account_id) add(x.to_account_id, Number(x.to_amount) || 0); }
      }
      let cash = 0;
      for (const a of accounts) cash += toMain(b.get(a.id) || 0, a.currency);
      let owed = 0;
      for (const e of loans) {
        const p = people.get(e.person_id);
        if (!p || e.occurred_on > end) continue;
        owed += toMain(Number(e.amount) || 0, p.currency) * (owesMe(p) ? 1 : -1);
      }
      return { m: mm, cash, owed, total: cash + owed };
    });
  }

  function netWorthCard(m) {
    const series = netWorthSeries(m, 6);
    const vals = series.map(x => x.total);
    const lo = Math.min(...vals), hi = Math.max(...vals);
    if (!rows("accounts").length) return null;
    const W = 320, H = 120, padX = 8, padY = 14;
    const span = hi - lo || Math.max(1, Math.abs(hi));
    const x = i => padX + i * (W - 2 * padX) / (series.length - 1);
    const y = v => H - padY - (v - lo) / span * (H - 2 * padY);
    const el = (tag, attrs) => { const n = document.createElementNS(SVGNS, tag); for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v); return n; };
    const pts = series.map((p, i) => `${x(i).toFixed(1)},${y(p.total).toFixed(1)}`);
    const svg = el("svg", { viewBox: `0 0 ${W} ${H}`, class: "nw-chart", role: "img", "aria-label": series.map(p => `${monthName(p.m)}: ${money(p.total, { whole: true, show: true })}`).join(". "), preserveAspectRatio: "none" });
    svg.append(el("path", { d: `M${pts[0]} L${pts.slice(1).join(" L")} L${x(series.length - 1).toFixed(1)},${H} L${x(0).toFixed(1)},${H} Z`, class: "nw-area" }),
      el("path", { d: `M${pts[0]} L${pts.slice(1).join(" L")}`, class: "nw-line" }),
      el("circle", { cx: x(series.length - 1).toFixed(1), cy: y(vals[vals.length - 1]).toFixed(1), r: "4", class: "nw-dot" }));
    const last = series[series.length - 1];
    const first = series[0];
    const diff = last.total - first.total;
    return h("section", { class: "card" },
      h("div", { class: "card-head" }, h("h2", null, "Net worth"), h("span", { class: "hint num" }, diff === 0 ? "No change in 6 months" : `${diff > 0 ? "+" : "−"}${money(Math.abs(diff), { whole: true })} in 6 months`)),
      h("p", { class: "income-big num" }, money(last.total, { whole: true })),
      svg,
      h("div", { class: "nw-labels" }, series.map(p => h("span", null, monthShort(p.m)))),
      h("p", { class: "hint" }, last.owed !== 0 ? `Accounts ${money(last.cash, { whole: true })} ${last.owed > 0 ? "plus" : "minus"} ${money(Math.abs(last.owed), { whole: true })} ${last.owed > 0 ? "owed to you" : "you owe"}. Past months use today's exchange rates.` : "Your account balances at the end of each month, at today's exchange rates."));
  }

  const dueOf = p => settings().loanDue[p.id] || null;
  const dueInfo = p => {
    const d = dueOf(p);
    if (!d) return null;
    const days = Math.round((new Date(d + "T12:00:00") - new Date(today() + "T12:00:00")) / 864e5);
    return { late: days < 0, text: days < 0 ? `Overdue by ${-days} day${days === -1 ? "" : "s"}` : days === 0 ? "Due today" : days === 1 ? "Due tomorrow" : `Due ${dayLabel(d).toLowerCase()}` };
  };

  async function shrinkImage(file) {
    if (!file || !/^image\//.test(file.type) || file.size > 25e6) return null;
    try {
      const bmp = await createImageBitmap(file);
      const scale = Math.min(1, 1600 / Math.max(bmp.width, bmp.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(bmp.width * scale);
      canvas.height = Math.round(bmp.height * scale);
      canvas.getContext("2d").drawImage(bmp, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise(res => canvas.toBlob(res, "image/jpeg", 0.78));
      return blob && blob.size <= 2e6 ? blob : null;
    } catch { return null; }
  }

  const RECEIPT_RE = /^[0-9a-f-]{36}\/[0-9a-f-]{36}\.jpg$/;
  function dropReceipt(path) {
    if (!RECEIPT_RE.test(path) || !path.startsWith(S.uid + "/") || !navigator.onLine) return;
    sb.storage.from("receipts").remove([path]).catch(() => { });
  }

  async function receiptViewer(path, onRemove) {
    if (!RECEIPT_RE.test(path)) return;
    if (!navigator.onLine) return toast("Connect to the internet to view the receipt.", "error");
    const { data, error } = await sb.storage.from("receipts").createSignedUrl(path, 120);
    if (error || !data || !data.signedUrl) return toast("The receipt couldn't be loaded.", "error");
    const close = () => view.remove();
    const view = h("div", { class: "viewer", role: "dialog", "aria-modal": "true", "aria-label": "Receipt" },
      h("img", { src: data.signedUrl, alt: "Receipt photo" }),
      h("div", { class: "viewer-bar" },
        h("button", { type: "button", class: "btn alt", on: { click: close } }, "Close"),
        h("button", { type: "button", class: "btn danger sure", on: { click: () => { close(); onRemove(); toast("Receipt removed. Save the entry to confirm."); } } }, "Remove")));
    document.body.append(view);
  }

  const parseCsv = text => {
    const rowsOut = [];
    let row = [], cell = "", q = false;
    const first = text.split("\n")[0];
    const sep = (first.match(/;/g) || []).length > (first.match(/,/g) || []).length ? ";" : ",";
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (q) { if (ch === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; } else cell += ch; }
      else if (ch === '"') q = true;
      else if (ch === sep) { row.push(cell); cell = ""; }
      else if (ch === "\n" || ch === "\r") { if (ch === "\r" && text[i + 1] === "\n") i++; row.push(cell); cell = ""; if (row.some(c => c.trim())) rowsOut.push(row); row = []; }
      else cell += ch;
    }
    row.push(cell);
    if (row.some(c => c.trim())) rowsOut.push(row);
    return rowsOut;
  };
  const csvDate = raw => {
    const v = String(raw || "").trim().replace(/^'/, "");
    let m = v.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
    if (m) return `${m[1]}-${pad(m[2])}-${pad(m[3])}`;
    m = v.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})/);
    if (!m) return null;
    let [, d, mo, y] = m;
    if (Number(mo) > 12 && Number(d) <= 12) [d, mo] = [mo, d];
    if (y.length === 2) y = "20" + y;
    if (y.length !== 4 || Number(mo) < 1 || Number(mo) > 12 || Number(d) < 1 || Number(d) > 31) return null;
    return `${y}-${pad(mo)}-${pad(d)}`;
  };
  const csvNum = raw => {
    let v = String(raw || "").replace(/[^0-9.,()\-]/g, "");
    if (!v) return 0;
    const neg = /^\(.*\)$/.test(v) || v.includes("-");
    v = v.replace(/[()\-]/g, "");
    if (v.includes(",") && v.includes(".")) v = v.lastIndexOf(",") > v.lastIndexOf(".") ? v.replace(/\./g, "").replace(",", ".") : v.replace(/,/g, "");
    else if (v.includes(",")) v = /,\d{1,2}$/.test(v) ? v.replace(",", ".") : v.replace(/,/g, "");
    const n = Number(v);
    return Number.isFinite(n) ? (neg ? -n : n) : 0;
  };

  async function onImportFile(e) {
    const file = e.target.files && e.target.files[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > 2e6) return toast("That file is too big. Import up to 2 MB at a time.", "error");
    let table;
    try { table = parseCsv((await file.text()).replace(/^﻿/, "")); } catch { table = []; }
    if (table.length < 2) return toast("No rows found in that file.", "error");
    const head = table[0].map(c => c.trim().toLowerCase());
    const find = (...names) => head.findIndex(c => names.some(n => c === n || c.includes(n)));
    const col = { date: find("date"), amount: find("amount", "montant", "value"), debit: find("debit", "withdrawal", "paid out", "débit"), credit: find("credit", "deposit", "paid in", "crédit"), note: find("description", "note", "details", "memo", "narrative", "libell"), cat: find("category", "catégorie"), type: head.indexOf("type") };
    if (col.date < 0 || (col.amount < 0 && col.debit < 0 && col.credit < 0)) return toast("The file needs a Date column and an Amount column (or Debit and Credit).", "error");
    const byName = new Map(rows("categories").map(c => [c.kind + ":" + c.name.toLowerCase(), c]));
    const learned = new Map();
    for (const t of rows("transactions")) if (t.note && t.category_id) learned.set(t.kind + ":" + t.note.trim().toLowerCase(), t.category_id);
    const seen = new Set(rows("transactions").map(t => `${t.occurred_on}|${t.kind}|${Number(t.amount)}|${(t.note || "").trim().toLowerCase()}`));
    const out = [];
    let skipped = 0, dupes = 0;
    for (const r of table.slice(1, 2001)) {
      const date = csvDate(r[col.date]);
      const type = col.type >= 0 ? String(r[col.type] || "").trim().toLowerCase() : "";
      let amt = col.amount >= 0 ? csvNum(r[col.amount]) : 0;
      if (!amt && col.debit >= 0 && csvNum(r[col.debit])) amt = -Math.abs(csvNum(r[col.debit]));
      if (!amt && col.credit >= 0 && csvNum(r[col.credit])) amt = Math.abs(csvNum(r[col.credit]));
      if (!date || !amt || type === "transfer") { skipped++; continue; }
      const kind = type === "income" ? "income" : type === "expense" ? "expense" : amt < 0 ? "expense" : "income";
      const note = col.note >= 0 ? String(r[col.note] || "").trim().replace(/^'/, "").slice(0, 200) : "";
      const named = col.cat >= 0 ? byName.get(kind + ":" + String(r[col.cat] || "").trim().toLowerCase()) : null;
      const category = named ? named.id : learned.get(kind + ":" + note.toLowerCase()) || null;
      const key = `${date}|${kind}|${Math.abs(amt)}|${note.toLowerCase()}`;
      if (seen.has(key)) { dupes++; continue; }
      seen.add(key);
      out.push({ date, kind, amount: Math.abs(amt), note, category });
    }
    if (!out.length) return toast(dupes ? "Everything in that file is already in your wallet." : "No usable rows found in that file.", "error");
    importSheet(out, skipped, dupes);
  }

  function importSheet(list, skipped, dupes) {
    const accounts = rows("accounts").filter(a => !a.archived).sort(bySort);
    if (!accounts.length) return toast("Add an account first.");
    let account = accounts[0].id;
    const body = h("div", { class: "form" });
    const draw = () => {
      const a = acc(account);
      const exp = list.filter(x => x.kind === "expense"), inc = list.filter(x => x.kind === "income");
      const sum = arr => arr.reduce((t, x) => t + x.amount, 0);
      const loose = list.filter(x => !x.category).length;
      body.replaceChildren(
        h("div", { class: "tiles two" },
          h("div", { class: "tile bad" }, h("small", null, `${exp.length} expenses`), h("strong", null, fmt(sum(exp), a.currency, { whole: true }))),
          h("div", { class: "tile good" }, h("small", null, `${inc.length} income`), h("strong", null, fmt(sum(inc), a.currency, { whole: true })))),
        h("div", { class: "field" }, h("span", { class: "label" }, "Add them to"),
          h("div", { class: "chips wrap" }, accounts.map(x => h("button", { type: "button", class: "chip", "aria-pressed": String(x.id === account), on: { click: () => { account = x.id; draw(); } } }, `${x.name} · ${x.currency}`)))),
        h("section", { class: "card flush" }, list.slice(0, 5).map(x => h("div", { class: "row" },
          h("span", { class: "row-main" }, h("span", { class: "row-title" }, x.note || (x.kind === "income" ? "Income" : "Expense")), h("span", { class: "row-sub" }, `${dayLabel(x.date)} · ${x.category && cat(x.category) ? cat(x.category).name : "Uncategorized"}`)),
          h("span", { class: "row-end " + (x.kind === "income" ? "pos" : "neg") }, (x.kind === "income" ? "+" : "−") + fmt(x.amount, a.currency)))),
          list.length > 5 ? h("p", { class: "row-note" }, `and ${list.length - 5} more`) : null),
        h("p", { class: "hint" }, [`Amounts are read in ${a.currency}, the currency of the account you pick.`, loose ? `${loose} have no category yet; open them in Activity to set one.` : null, dupes ? `${dupes} already in your wallet were left out.` : null, skipped ? `${skipped} rows without a date or amount were skipped.` : null].filter(Boolean).join(" ")));
    };
    draw();
    const btn = h("button", { type: "button", class: "btn", on: { click: () => {
      const a = acc(account);
      putMany(list.map(x => ({ t: "transactions", r: { id: newId(), kind: x.kind, amount: roundCur(x.amount, a.currency), currency: a.currency, rate: rateOf(a.currency), account_id: a.id, to_account_id: null, to_amount: null, category_id: x.category, note: x.note || null, occurred_on: x.date, rule_id: null, receipt: null, created_at: new Date().toISOString() } })));
      closeSheet();
      toast(`${list.length} entries imported.`);
    } } }, `Import ${list.length} entries`);
    openSheet("Import from a file", body, btn);
  }

  async function refreshRates(force) {
    const st = settings();
    if (!st.autoRates || !navigator.onLine || !S.session) return false;
    if (!force && st.ratesAt === today()) return false;
    const wanted = usedCurrencies().filter(c => c !== "USD" && !st.manualRates.includes(c));
    if (!wanted.length) return false;
    try {
      const res = await fetch("https://open.er-api.com/v6/latest/USD", { cache: "no-store", credentials: "omit", referrerPolicy: "no-referrer" });
      if (!res.ok) return false;
      const j = await res.json();
      if (!j || j.result !== "success" || !j.rates) return false;
      const rates = { ...settings().rates };
      for (const c of wanted) {
        const v = Number(j.rates[c]);
        if (v > 0 && Number.isFinite(v)) rates[c] = v;
      }
      saveSettings({ rates, ratesAt: today() });
      return true;
    } catch { return false; }
  }

  async function importQuick() {
    if (!sb || !S.session || !VAULT.key || !navigator.onLine || S.quickBusy) return;
    S.quickBusy = true;
    try {
      const { data, error } = await sb.from("quick_inbox").select("id, amount, note, category, created_at").order("created_at", { ascending: true }).limit(100);
      if (error || !Array.isArray(data) || !data.length) return;
      const accounts = rows("accounts").filter(a => !a.archived).sort(bySort);
      if (!accounts.length) return;
      const last = rows("transactions").filter(t => t.kind === "expense" && acc(t.account_id) && !acc(t.account_id).archived).sort(byRecent)[0];
      const a = last ? acc(last.account_id) : accounts[0];
      const cats = rows("categories").filter(c => c.kind === "expense");
      const norm = v => String(v || "").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
      const findCat = name => {
        const n = norm(name);
        if (!n) return null;
        const hit = cats.find(c => norm(c.name) === n) || cats.find(c => norm(tr(c.name)) === n) || cats.find(c => norm(c.name).startsWith(n) || n.startsWith(norm(c.name))) || cats.find(c => norm(c.name).includes(n));
        return hit ? hit.id : null;
      };
      const items = data.filter(q => Number(q.amount) > 0).map(q => ({ t: "transactions", r: { id: `q-${q.id}`, kind: "expense", amount: roundCur(Number(q.amount), a.currency), currency: a.currency, rate: rateOf(a.currency), account_id: a.id, to_account_id: null, to_amount: null, category_id: findCat(q.category), note: typeof q.note === "string" && q.note ? q.note.slice(0, 200) : null, occurred_on: ymd(new Date(q.created_at)), rule_id: null, receipt: null, created_at: q.created_at } }));
      if (items.length) putMany(items);
      await sb.from("quick_inbox").delete().in("id", data.map(q => q.id));
      const loose = items.filter(i => !i.r.category_id).length;
      if (items.length) toast(`${items.length} quick ${items.length === 1 ? "entry" : "entries"} added to ${a.name}.${loose ? " Tap it on Home to set the category." : ""}`);
    } catch { } finally { S.quickBusy = false; }
  }

  async function quickSheet() {
    const url = `${CFG.supabaseUrl}/functions/v1/quick-add`;
    const body = h("div", { class: "form" });
    const draw = () => {
      const token = store.get("quickToken", null);
      if (!token) {
        body.replaceChildren(
          h("p", { class: "hint" }, "iPhone doesn't allow web apps to have widgets, but a Shortcut can do the same job: tap it on the Lock Screen, the Action Button or the Home Screen, type the amount, and it is saved. The entry appears in your wallet the next time the app opens."),
          h("p", { class: "hint" }, "Quick entries wait on the server unencrypted until the app opens and files them, then they are deleted from there."),
          h("button", { type: "button", class: "btn", on: { click: async () => {
            if (!navigator.onLine) return toast("Connect to the internet to set this up.", "error");
            const fresh = toUrl(b64u8(rand(32)));
            const hash = [...new Uint8Array(await crypto.subtle.digest("SHA-256", te.encode(fresh)))].map(b => b.toString(16).padStart(2, "0")).join("");
            const { error } = await sb.from("quick_tokens").upsert({ user_id: S.uid, token_hash: hash }, { onConflict: "user_id" });
            if (error) return toast("Couldn't set this up. Try again.", "error");
            store.set("quickToken", fresh);
            draw(); render();
          } } }, "Turn on quick add"));
        return;
      }
      const step = (n, t, d) => h("div", { class: "prose-part" }, h("h3", null, `${n}. ${t}`), h("p", null, d));
      body.replaceChildren(
        h("div", { class: "prose" },
          step(1, "Create a Shortcut", "Open the Shortcuts app, tap +, and name it “Add expense”."),
          step(2, "Ask for the amount", "Add the action “Ask for Input”. Set the type to Number and the question to “How much?”."),
          step(3, "Send it", "Add the action “Get Contents of URL”. Paste the address below. Set Method to POST and Request Body to JSON, then add three text fields: token (paste your key below), amount (pick the “Ask for Input” result) and, if you want, note."),
          step(4, "Optional: pick the category too", "Before “Get Contents of URL”, add the action “Choose from List” with your category names (copy them below). Then add a fourth text field named category and pick the “Chosen Item” result. Entries then arrive already filed."),
          step(5, "Put it where you want", "Add the Shortcut to your Lock Screen (Customize → widgets → Shortcuts), to the Action Button (Settings → Action Button → Shortcut), or to the Home Screen.")),
        h("label", { class: "field" }, h("span", null, "Address"), h("input", { class: "input", readOnly: true, value: url, id: "q-url" })),
        h("button", { type: "button", class: "btn alt", on: { click: () => copyText(url, "q-url") } }, "Copy the address"),
        h("label", { class: "field" }, h("span", null, "Your key (keep it private)"), h("input", { class: "input", readOnly: true, value: token, id: "q-token" })),
        h("button", { type: "button", class: "btn alt", on: { click: () => copyText(token, "q-token") } }, "Copy the key"),
        h("label", { class: "field" }, h("span", null, "Your categories, one per line"), h("textarea", { class: "input", readOnly: true, rows: "4", id: "q-cats" }, rows("categories").filter(c => c.kind === "expense").sort(bySort).map(c => c.name).join("\n"))),
        h("button", { type: "button", class: "btn alt", on: { click: () => copyText(rows("categories").filter(c => c.kind === "expense").sort(bySort).map(c => c.name).join("\n"), "q-cats") } }, "Copy the categories"),
        h("button", { type: "button", class: "btn danger", on: { click: async () => {
          if (!navigator.onLine) return toast("Connect to the internet to turn this off.", "error");
          const { error } = await sb.from("quick_tokens").delete().eq("user_id", S.uid);
          if (error) return toast("Couldn't turn it off. Try again.", "error");
          try { localStorage.removeItem(lsKey("quickToken")); } catch { }
          draw(); render();
          toast("Quick add turned off. The old key no longer works.");
        } } }, "Turn off quick add"));
    };
    draw();
    openSheet("Add from the Lock Screen", body);
  }

  function maybeOnboard() {
    const st = settings();
    if (S.onboarding || !S.session || !st.seeded || storedSettings().onboarded || S.recoveryCode || document.querySelector(".overlay")) return;
    if (rows("transactions").length || rows("accounts").some(a => Number(a.opening_balance)) || st.income > 0 || Object.keys(st.incomeSteps).length) { saveSettings({ onboarded: true }); return; }
    S.onboarding = true;
    setTimeout(() => { if (document.querySelector(".overlay")) { S.onboarding = false; return; } onboardSheet(); }, 350);
  }

  function onboardSheet() {
    const f = { step: 1, cur: mainCur(), income: "", bal: {} };
    const body = h("form", { class: "form onboard", id: "ob-form", novalidate: true });
    const err = h("p", { class: "form-err", role: "alert" });
    const next = h("button", { type: "submit", class: "btn", form: "ob-form" });
    const back = h("button", { type: "button", class: "btn alt", on: { click: () => { f.step--; draw(); } } }, "Back");
    const foot = h("div", { class: "onboard-foot" }, back, next);
    const finish = skipped => {
      S.onboarding = false;
      if (skipped) { saveSettings({ onboarded: true }); return closeSheet(); }
      if (f.cur !== mainCur()) setMainCurrency(f.cur);
      const income = parseAmt(f.income);
      const items = [];
      for (const a of rows("accounts")) {
        const v = f.bal[a.id] ? parseAmt(f.bal[a.id]) : 0;
        if (v) items.push({ t: "accounts", r: { ...a, opening_balance: roundCur(v, a.currency) } });
      }
      if (items.length) putMany(items);
      saveSettings({ onboarded: true, ...(income ? { incomeMode: "fixed", incomeSteps: { [thisMonth()]: income } } : {}) });
      closeSheet();
      toast("Your wallet is ready.");
    };
    const draw = () => {
      err.textContent = "";
      const head = h("div", { class: "onboard-head" }, h("small", null, `Step ${f.step} of 3`), h("div", { class: "bar" }, h("span", { style: { width: (f.step / 3 * 100) + "%" } })));
      let kids;
      if (f.step === 1) kids = [h("h3", null, "Which currency do you think in?"), h("p", { class: "hint" }, "Totals and budgets are shown in it. You can still hold accounts in other currencies."),
        h("div", { class: "chips wrap" }, ["USD", "LBP", "EUR", "AED", "SAR", "GBP"].map(c => h("button", { type: "button", class: "chip", "aria-pressed": String(f.cur === c), on: { click: () => { f.cur = c; draw(); } } }, `${c} · ${curInfo(c).name}`))),
        curSelect("ob-cur", f.cur, c => { f.cur = c; draw(); })];
      else if (f.step === 2) kids = [h("h3", null, "What is your monthly income?"), h("p", { class: "hint" }, "Leave it empty if it changes every month. The plan will follow what you log."),
        h("input", { id: "ob-income", class: "input num", inputmode: "decimal", autocomplete: "off", placeholder: `${curSymbol(f.cur)} 1500`, value: f.income, "aria-label": "Monthly income", on: { input: e => { f.income = e.target.value; } } })];
      else kids = [h("h3", null, "How much do you have right now?"), h("p", { class: "hint" }, "Enter today's balance for the accounts you use. Skip the rest."),
        ...rows("accounts").filter(a => !a.archived).sort(bySort).map(a => h("label", { class: "field" }, h("span", null, `${tr(a.name)} (${a.currency})`),
          h("input", { class: "input num", inputmode: "decimal", autocomplete: "off", placeholder: "0", value: f.bal[a.id] || "", on: { input: e => { f.bal[a.id] = e.target.value; } } })))];
      body.replaceChildren(head, ...kids, err, h("button", { type: "button", class: "link-btn", on: { click: () => finish(true) } }, "Skip for now"));
      back.style.display = f.step === 1 ? "none" : "";
      next.textContent = tr(f.step === 3 ? "Finish" : "Continue");
    };
    body.addEventListener("submit", ev => {
      ev.preventDefault();
      if (f.step === 2 && f.income.trim() && !parseAmt(f.income)) return fail(err, "Enter the amount as a number, like 1500.", document.getElementById("ob-income"));
      if (f.step === 3) {
        if (Object.values(f.bal).some(v => v.trim() && !parseAmt(v))) return fail(err, "Enter each balance as a number, like 250.");
        return finish(false);
      }
      f.step++; draw();
    });
    draw();
    openSheet("Welcome", body, foot);
  }

  const TOURS = {
    home: [
      [".hero", "Total balance", "Everything you have across all your accounts, in your main currency. The small pills show each currency separately."],
      [".eye-btn", "Hide amounts", "Tap the eye to hide every number, for example when someone is looking at your screen."],
      [".top .status", "Sync", "Shows whether your data is saved online. Tap it to save now."],
      [".gear-btn", "Settings", "Accounts, categories, reminders, language, security and backups."],
      [".acts", "Quick actions", "Expense is money you spent. Income is money you received. Transfer moves money between your own accounts. Plan shows how your income is divided."],
      [".tiles", "Your day and month", "What you spent today and this month, and how much you can still spend per day to stay on plan."],
      [".month-card", "Month plan", "How much of this month's plan is used. Tap it to change your income or your groups."],
      [".quick", "Quick add", "Your most used categories. Tap one to add an expense already filed in that category."],
      [".remind-pill, .remind", "Daily reminder", "A notification every evening so no expense is forgotten."],
      [".dock .tabs", "Sections", "Home, Activity for every entry, Insights for where your money goes, People for loans. Tap a tab or slide your finger along the bar."],
      [".add-btn, .side-add", "Add anything", "The fastest way to add an expense, income or transfer, from any screen."],
      [".help-btn", "Help anytime", "Tap the question mark to replay this tour or read what each screen does."]
    ],
    activity: [
      [".search", "Search", "Find any entry by its note, category or amount."],
      ["main .chips", "Filters", "Show only expenses, income or transfers."],
      ["main .card.day", "Your entries", "Grouped by day. Tap an entry to edit it, change its category or delete it."]
    ],
    insights: [
      [".month", "Pick a month", "Use the arrows to look at another month."],
      ["main .card.flush .row", "Plan and budgets", "Set your income, divide it into groups and give each category a budget."],
      ["main .tiles", "The month in numbers", "What you spent, what came in, and what is left."],
      ["main .cat-row", "Where it went", "Your spending by category, biggest first."]
    ],
    people: [
      ["main .tiles", "Totals", "What people owe you, and what you owe them."],
      ["main .row-btn", "Add a person", "Track money you lend or borrow. Each person can get a private page and a WhatsApp reminder."],
      ["main .card.flush .row", "A person", "Tap to record a payment, send their balance on WhatsApp or share their private page."]
    ]
  };
  const TOUR = { el: null, view: null, steps: [], i: 0, seq: 0 };
  const tourSeen = v => store.get("tour:" + v, 0) === 1;

  function endTour() {
    if (TOUR.view) store.set("tour:" + TOUR.view, 1);
    if (TOUR.el) TOUR.el.remove();
    TOUR.el = null; TOUR.view = null;
    window.removeEventListener("resize", placeTour);
  }

  function placeTour() {
    if (!TOUR.el) return;
    const [sel] = TOUR.steps[TOUR.i];
    const target = tourTarget(sel);
    const spot = TOUR.el.querySelector(".tour-spot"), tip = TOUR.el.querySelector(".tour-tip");
    if (!target) return;
    const r = target.getBoundingClientRect(), pad = 6;
    Object.assign(spot.style, { top: `${r.top - pad}px`, left: `${r.left - pad}px`, width: `${r.width + pad * 2}px`, height: `${r.height + pad * 2}px` });
    const vw = window.innerWidth, vh = window.innerHeight, w = Math.min(340, vw - 32);
    tip.style.width = `${w}px`;
    tip.style.left = `${Math.max(16, Math.min(vw - w - 16, r.left + r.width / 2 - w / 2))}px`;
    const th = tip.offsetHeight;
    const dock = document.querySelector(".dock");
    const inDock = !!target.closest(".dock");
    const floor = inDock || !dock || window.innerWidth >= 900 ? vh - 12 : dock.getBoundingClientRect().top - 12;
    const below = r.bottom + pad + 14, above = r.top - pad - 14 - th;
    tip.style.top = `${below + th <= floor ? below : above >= 12 ? above : Math.max(12, Math.min(floor - th, below))}px`;
  }

  const tourTarget = sel => [...document.querySelectorAll(sel)].find(x => x.getClientRects().length && x.getBoundingClientRect().width > 0);

  function settle(el, done) {
    let last = null, still = 0, frames = 0;
    const tick = () => {
      if (!TOUR.el) return;
      const r = el.getBoundingClientRect();
      const key = `${Math.round(r.top)}:${Math.round(r.left)}:${Math.round(r.width)}:${Math.round(r.height)}`;
      still = key === last ? still + 1 : 0;
      last = key;
      if (still >= 3 || ++frames > 60) return done();
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  function showTourStep() {
    const steps = TOUR.steps, i = TOUR.i;
    const [sel, title, text] = steps[i];
    const target = tourTarget(sel);
    if (!target) { steps.splice(i, 1); if (!steps.length || i >= steps.length) return endTour(); return showTourStep(); }
    const token = ++TOUR.seq;
    TOUR.el.classList.add("moving");
    const tip = TOUR.el.querySelector(".tour-tip");
    tip.replaceChildren(
      h("div", { class: "tour-count" }, `${i + 1} / ${steps.length}`),
      h("h3", null, title),
      h("p", null, text),
      h("div", { class: "tour-actions" },
        h("button", { type: "button", class: "link-btn", on: { click: endTour } }, i === steps.length - 1 ? "Close" : "Skip"),
        h("span", { class: "tour-gap" }),
        i > 0 ? h("button", { type: "button", class: "btn alt", on: { click: () => { TOUR.i--; showTourStep(); } } }, "Back") : null,
        h("button", { type: "button", class: "btn", on: { click: () => { if (TOUR.i >= steps.length - 1) return endTour(); TOUR.i++; showTourStep(); } } }, i === steps.length - 1 ? "Got it" : "Next")));
    if (!target.closest(".dock, .top")) {
      const r = target.getBoundingClientRect();
      const header = document.querySelector(".top");
      const topGap = (header ? header.getBoundingClientRect().bottom : 70) + 16;
      if (Math.abs(r.top - topGap) > 4) window.scrollBy({ top: r.top - topGap, behavior: "smooth" });
    }
    settle(target, () => {
      if (token !== TOUR.seq || !TOUR.el) return;
      placeTour();
      TOUR.el.classList.remove("moving");
    });
  }

  function startTour(view) {
    const list = TOURS[view];
    if (!list || TOUR.el) return;
    const steps = list.filter(([sel]) => tourTarget(sel));
    if (!steps.length) return;
    TOUR.view = view; TOUR.steps = steps; TOUR.i = 0; TOUR.seq = 0;
    TOUR.el = h("div", { class: "tour moving", role: "dialog", "aria-modal": "true", "aria-label": "Guide" }, h("div", { class: "tour-spot" }), h("div", { class: "tour-tip" }));
    TOUR.el.addEventListener("click", e => { if (e.target === TOUR.el) e.stopPropagation(); });
    TOUR.el.addEventListener("touchmove", e => e.preventDefault(), { passive: false });
    TOUR.el.addEventListener("wheel", e => e.preventDefault(), { passive: false });
    document.body.append(TOUR.el);
    window.addEventListener("resize", placeTour);
    showTourStep();
  }

  function maybeTour() {
    const v = S.view;
    if (!TOURS[v] || tourSeen(v) || TOUR.el || S.onboarding || !S.session || !VAULT.key) return;
    if (!storedSettings().onboarded) return;
    clearTimeout(TOUR.timer);
    let tries = 0;
    const attempt = () => {
      if (S.view !== v || TOUR.el || tourSeen(v)) return;
      if (S.onboarding || document.querySelector(".overlay, .lock, .viewer")) { if (++tries < 40) TOUR.timer = setTimeout(attempt, 700); return; }
      startTour(v);
    };
    TOUR.timer = setTimeout(attempt, 900);
  }

  function helpSheet() {
    const part = (ic, title, text) => h("div", { class: "help-row" }, h("span", { class: "dot neutral" }, icon(ic, "ico sm")), h("div", null, h("h3", null, title), h("p", null, text)));
    const cur = TOURS[S.view] ? S.view : "home";
    openSheet("How it works", h("div", { class: "help-list" },
      part("home", "Home", "Your total balance, today's spending, your month plan and one-tap actions."),
      part("plus", "Add", "The green + adds an expense, income or transfer. Type the amount, pick a category, save."),
      part("list", "Activity", "Every entry, by day. Search, filter, and tap any entry to edit or delete it."),
      part("chart", "Insights", "Where your money went, your plan and budgets, goals and net worth."),
      part("people", "People", "Money you lend or borrow, with WhatsApp reminders and a private page for each person."),
      part("eye", "Eye", "Hides every amount on screen."),
      part("sync", "Sync", "Saves your data online so it's on all your devices."),
      part("gear", "Settings", "Accounts, categories, reminders, language, security and backups.")),
      h("div", { class: "help-foot" },
        h("button", { type: "button", class: "btn", on: { click: () => { closeSheet(); setTimeout(() => { if (S.view !== cur) go(cur); setTimeout(() => startTour(cur), 450); }, 350); } } }, cur === "home" ? "Start the tour" : "Tour of this screen"),
        cur !== "home" ? h("button", { type: "button", class: "btn alt", on: { click: () => { closeSheet(); setTimeout(() => { go("home"); setTimeout(() => startTour("home"), 500); }, 350); } } }, "Full tour from Home") : null));
  }

  function viewHome() {
    const st = settings();
    const bal = balances();
    const m = thisMonth();
    const s = monthStats(m);
    const safe = safeToSpend();
    let total = 0;
    const holds = new Map();
    for (const a of rows("accounts")) {
      const v = bal.get(a.id) || 0;
      holds.set(a.currency, (holds.get(a.currency) || 0) + v);
      total += toMain(v, a.currency);
    }
    const txns = rows("transactions").sort(byRecent);
    const accounts = rows("accounts").filter(a => !a.archived).sort(bySort);
    const out = h("div", { class: "stack home-grid" });

    out.append(h("section", { class: "hero" },
      h("p", { class: "hero-label" }, "Total balance"),
      h("p", { class: "hero-total num" }, money(total)),
      h("div", { class: "hero-hold" },
        [...holds].sort((p, q) => (q[0] === mainCur()) - (p[0] === mainCur()) || toMain(q[1], q[0]) - toMain(p[1], p[0])).map(([c, v]) => h("span", { class: "num", title: curInfo(c).name }, fmt(v, c, { compact: true }))))));

    const act = (label, ic, tone, fn) => h("button", { type: "button", class: "act " + tone, on: { click: fn } }, h("span", { class: "act-ico" }, icon(ic)), h("span", null, label));
    out.append(h("div", { class: "acts" },
      act("Expense", "down", "neg", () => txnSheet(null, { kind: "expense" })),
      act("Income", "up", "pos", () => txnSheet(null, { kind: "income" })),
      act("Transfer", "swap", "gold", () => txnSheet(null, { kind: "transfer" })),
      act("Plan", "plan", "plain", () => { S.month = m; go("plan"); })));

    const spentToday = s.days.get(today()) || 0;
    out.append(h("div", { class: "tiles" },
      h("button", { type: "button", class: "tile", on: { click: () => { S.filter = { q: "", kind: "all", account: null }; go("activity"); } } }, h("small", null, "Spent today"), h("strong", null, money(spentToday, { whole: true }))),
      h("button", { type: "button", class: "tile", on: { click: () => { S.month = m; go("insights"); } } }, h("small", null, `Spent in ${monthShort(m)}`), h("strong", null, money(s.spent, { whole: true }))),
      safe
        ? h("button", { type: "button", class: "tile " + (safe.left >= 0 ? "good" : "bad"), on: { click: () => { S.month = m; go("plan"); } } }, h("small", null, "Safe to spend"), h("strong", null, money(safe.perDay, { whole: true })), h("span", null, "per day"))
        : h("button", { type: "button", class: "tile", on: { click: () => go("plan") } }, h("small", null, "Safe to spend"), h("strong", null, "—"), h("span", null, "Set a plan"))));

    const plan = planFor(m);
    if (plan.base > 0) {
      const left = plan.base - s.spent;
      const pct = Math.min(100, Math.round(s.spent / plan.base * 100));
      out.append(h("button", { type: "button", class: "card month-card", on: { click: () => { S.month = m; go("plan"); } } },
        h("span", { class: "month-top" }, h("strong", null, `${monthName(m)} plan`), h("span", { class: left < 0 ? "neg" : "" }, left >= 0 ? `${money(left, { whole: true })} left` : `${money(-left, { whole: true })} over`)),
        h("span", { class: "bar" }, h("span", { class: left < 0 ? "over" : "", style: { width: pct + "%" } })),
        h("span", { class: "month-sub" }, `${money(s.spent, { whole: true })} of ${money(plan.base, { whole: true })} spent · ${safe ? safe.daysLeft : 0} days left`)));
    }

    const usage = new Map();
    const cutoff = ymd(new Date(Date.now() - 90 * 864e5));
    for (const t of txns) if (t.kind === "expense" && t.category_id && t.occurred_on >= cutoff) usage.set(t.category_id, (usage.get(t.category_id) || 0) + 1);
    const favs = rows("categories").filter(c => c.kind === "expense").sort((p, q) => (usage.get(q.id) || 0) - (usage.get(p.id) || 0) || bySort(p, q)).slice(0, 6);
    if (favs.length && accounts.length) {
      out.append(h("section", { class: "quick" },
        h("h2", null, "Quick add"),
        h("div", { class: "chips" }, favs.map(c => h("button", { type: "button", class: "chip fav", on: { click: () => txnSheet(null, { kind: "expense", category: c.id }) } },
          h("span", { class: "fav-dot", style: { background: c.color } }, catGlyph(c, "ico sm")), c.name)))));
    }

    const remind = reminderCard();
    out.append(remind || reminderPill());
    const loose = txns.filter(t => t.kind !== "transfer" && !t.category_id && t.occurred_on >= ymd(new Date(Date.now() - 45 * 864e5))).sort(byRecent);
    if (loose.length) {
      const card = h("section", { class: "card flush needs-cat" }, h("div", { class: "card-head" }, h("h2", null, "Needs a category"), h("span", { class: "hint num" }, String(loose.length))));
      for (const t of loose.slice(0, 3)) {
        const a = acc(t.account_id);
        card.append(h("button", { type: "button", class: "row", on: { click: () => txnSheet(t) } },
          h("span", { class: "dot gold" }, icon("plus", "ico sm")),
          h("span", { class: "row-main" }, h("span", { class: "row-title" }, t.note || "Tap to choose a category"), h("span", { class: "row-sub" }, [dayLabel(t.occurred_on), a ? a.name : null].filter(Boolean).join(" · "))),
          h("span", { class: "row-end " + (t.kind === "income" ? "pos" : "neg") }, (t.kind === "income" ? "+" : "−") + fmt(Number(t.amount), t.currency))));
      }
      if (loose.length > 3) card.append(h("button", { type: "button", class: "row-btn", on: { click: () => go("activity") } }, `See all ${loose.length}`));
      out.append(card);
    }
    const recap = recapCard();
    if (recap) out.append(recap);
    const coming = upcomingCard();
    if (coming) out.append(coming);

    const alerts = rows("categories").filter(c => c.kind === "expense" && Number(c.budget) > 0)
      .map(c => ({ c, spent: s.byCat.get(c.id) || 0, budget: Number(c.budget) }))
      .filter(a => a.spent >= a.budget * 0.8)
      .sort((a, b) => b.spent / b.budget - a.spent / a.budget);
    for (const a of alerts.slice(0, 3)) {
      const over = a.spent > a.budget;
      out.append(h("div", { class: "alert" + (over ? " bad" : "") }, icon("warn"),
        h("span", null, over
          ? `${a.c.name} is ${money(a.spent - a.budget, { whole: true })} over its ${money(a.budget, { whole: true })} budget.`
          : `${a.c.name}: ${money(a.spent, { whole: true })} of ${money(a.budget, { whole: true })} used.`)));
    }

    if (!txns.length) {
      out.append(h("section", { class: "card flush" },
        h("div", { class: "card-head" }, h("h2", null, "Get started")),
        ...[
          ["Set your opening balances", "Enter what each account holds today.", () => go("settings")],
          ["Record your first expense", "It takes a few seconds.", () => txnSheet(null, { kind: "expense" })],
          ["Set up your monthly plan", "Decide how your income is divided.", () => { S.month = m; go("plan"); }]
        ].map(([t, d, fn], i) => h("button", { type: "button", class: "row step", on: { click: fn } },
          h("span", { class: "dot neutral" }, String(i + 1)),
          h("span", { class: "row-main" }, h("span", { class: "row-title" }, t), h("span", { class: "row-sub" }, d)),
          icon("fwd")))));
    }

    const accCard = h("section", { class: "card flush col-a" }, h("div", { class: "card-head" }, h("h2", null, "Accounts"), h("button", { type: "button", class: "link-btn", on: { click: () => accountSheet(null) } }, "Add")));
    for (const a of accounts) {
      const v = bal.get(a.id) || 0;
      accCard.append(h("button", { type: "button", class: "row", on: { click: () => { S.filter = { q: "", kind: "all", account: a.id }; go("activity"); } } },
        h("span", { class: "dot neutral" }, curTag(a.currency)),
        h("span", { class: "row-main" }, h("span", { class: "row-title" }, a.name), h("span", { class: "row-sub" }, KIND_LABEL[a.kind] || "")),
        h("span", { class: "row-end" + (v < 0 ? " neg" : "") }, fmt(v, a.currency), a.currency !== mainCur() ? h("small", null, "≈ " + money(toMain(v, a.currency), { whole: true })) : null)));
    }
    if (!accounts.length) accCard.append(h("p", { class: "empty" }, "No accounts yet."));
    out.append(accCard);

    if (txns.length) {
      const recent = h("section", { class: "card flush col-b" }, h("div", { class: "card-head" }, h("h2", null, "Recent"), h("button", { type: "button", class: "link-btn", on: { click: () => { S.filter = { q: "", kind: "all", account: null }; go("activity"); } } }, "See all")));
      txns.slice(0, 5).forEach(x => recent.append(txnRow(x)));
      out.append(recent);
    }

    const goals = goalsCard(false);
    if (goals) out.append(goals);

    const lb = loanBalances();
    const people = rows("people");
    if (people.length) {
      let owed = 0, owe = 0;
      for (const p of people) { const v = toMain(lb.get(p.id) || 0, p.currency); if (owesMe(p)) owed += v; else owe += v; }
      const card = h("section", { class: "card flush" }, h("div", { class: "card-head" }, h("h2", null, "People"), h("button", { type: "button", class: "link-btn", on: { click: () => go("people") } }, "See all")));
      card.append(h("p", { class: "row-note" }, [owed ? `Owed to you ${money(owed, { whole: true })}` : null, owe ? `You owe ${money(owe, { whole: true })}` : null].filter(Boolean).join(" · ") || "All settled"));
      for (const p of people.slice().sort((x, y) => toMain(lb.get(y.id) || 0, y.currency) - toMain(lb.get(x.id) || 0, x.currency)).slice(0, 3)) {
        const v = lb.get(p.id) || 0;
        card.append(h("button", { type: "button", class: "row", on: { click: () => personSheet(p) } },
          h("span", { class: "dot", style: { background: COLORS[(p.sort || 0) % COLORS.length] } }, p.name.charAt(0).toUpperCase()),
          h("span", { class: "row-main" }, h("span", { class: "row-title" }, p.name), h("span", { class: "row-sub" + (v > 0 && dueInfo(p) && dueInfo(p).late ? " late" : "") }, [statusText(p, v), v > 0 && dueInfo(p) ? dueInfo(p).text : null].filter(Boolean).join(" · "))),
          h("span", { class: "row-end" + (v > 0 && owesMe(p) ? " pos" : v > 0 ? " neg" : "") }, fmt(v, p.currency))));
      }
      out.append(card);
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
        list.replaceChildren(h("p", { class: "empty" }, q || S.filter.kind !== "all" || S.filter.account ? "No entries match your search." : "No entries yet. Tap + to add one."));
        return;
      }
      const shown = matches.slice(0, S.limit);
      const groups = new Map();
      for (const x of shown) { if (!groups.has(x.occurred_on)) groups.set(x.occurred_on, []); groups.get(x.occurred_on).push(x); }
      const cards = [...groups].map(([d, xs]) => {
        const spent = xs.filter(x => x.kind === "expense").reduce((a, x) => a + txMain(x), 0);
        return h("section", { class: "card flush day" },
          h("div", { class: "day-head" }, h("span", null, dayLabel(d)), spent ? h("span", { class: "num neg-text" }, "−" + money(spent)) : null),
          xs.map(txnRow));
      });
      if (matches.length > shown.length) cards.push(h("button", { type: "button", class: "btn alt", on: { click: () => { S.limit += 300; fill(); } } }, `Show more (${matches.length - shown.length})`));
      list.replaceChildren(...cards);
    }
    fill();
    out.append(h("label", { class: "search" }, icon("search"), search), chips, list);
    return out;
  }

  function monthSwitcher(ahead = 0) {
    const m = S.month || thisMonth();
    const last = shiftMonth(thisMonth(), ahead);
    return h("div", { class: "month" },
      h("button", { type: "button", class: "icon-btn", "aria-label": "Previous month", on: { click: () => { S.month = shiftMonth(m, -1); render(); } } }, icon("back")),
      h("strong", null, monthLabel(m)),
      h("button", { type: "button", class: "icon-btn", "aria-label": "Next month", disabled: m >= last, on: { click: () => { S.month = shiftMonth(m, 1); render(); } } }, icon("fwd")));
  }

  function viewInsights() {
    const m = S.month || thisMonth();
    const s = monthStats(m);
    const prevM = shiftMonth(m, -1);
    const prev = monthStats(prevM);
    const pl = planGroups();
    const out = h("div", { class: "stack" }, monthSwitcher(), h("section", { class: "card flush" }, h("button", { type: "button", class: "row", on: { click: () => go("plan") } },
      h("span", { class: "dot neutral" }, icon("plan", "ico sm")),
      h("span", { class: "row-main" }, h("span", { class: "row-title" }, "Your plan and budgets"), h("span", { class: "row-sub" }, pl.map(g => `${g.name} ${g.pct}%`).join(" · "))),
      icon("fwd"))));
    const left = s.income - s.spent;
    let changeText = null;
    if (prev.spent > 0 && s.spent > 0) {
      const pct = Math.round((s.spent - prev.spent) / prev.spent * 100);
      changeText = pct === 0 ? `Same as ${monthName(prevM)}` : `${Math.abs(pct)}% ${pct > 0 ? "more" : "less"} than ${monthName(prevM)}`;
    }
    out.append(h("div", { class: "tiles" },
      h("div", { class: "tile" }, h("small", null, "Spent"), h("strong", null, money(s.spent, { whole: true })), changeText ? h("span", null, changeText) : null),
      h("div", { class: "tile" }, h("small", null, "Came in"), h("strong", null, money(s.income, { whole: true }))),
      h("div", { class: "tile " + (left >= 0 ? "good" : "bad") }, h("small", null, left >= 0 ? "Left over" : "Overspent"), h("strong", null, money(Math.abs(left), { whole: true })))));
    if (s.count) out.append(h("button", { type: "button", class: "btn alt", on: { click: () => recapSheet(m) } }, `${monthName(m)} summary`));

    const where = h("section", { class: "card flush" }, h("div", { class: "card-head" }, h("h2", null, "Where it went")));
    const cats = [...s.byCat].sort((a, b) => b[1] - a[1]);
    const maxCat = cats.length ? cats[0][1] : 1;
    if (!cats.length) where.append(h("p", { class: "empty" }, `No spending in ${monthName(m)}.`));
    for (const [id, v] of cats) {
      const c = cat(id);
      const color = c ? c.color : "#5b7083";
      where.append(h("button", { type: "button", class: "cat-row", on: { click: () => { S.filter = { q: c ? c.name : "", kind: "expense", account: null }; go("activity"); } } },
        h("div", { class: "cat-line" }, h("span", { class: "swatch", style: { background: color } }), h("span", { class: "name" }, c ? c.name : "Uncategorized"), h("span", { class: "val" }, money(v, { whole: true })), h("span", { class: "pct" }, Math.round(v / s.spent * 100) + "%")),
        h("div", { class: "bar" }, h("span", { style: { width: (v / maxCat * 100) + "%", background: color } }))));
    }
    out.append(where);

    const months = [5, 4, 3, 2, 1, 0].map(k => shiftMonth(m, -k));
    const stats = months.map(mm => [mm, monthStats(mm)]);
    const max = Math.max(1, ...stats.flatMap(([, x]) => [x.spent, x.income]));
    const withData = stats.filter(([, x]) => x.spent > 0);
    const avg = withData.length ? withData.reduce((a, [, x]) => a + x.spent, 0) / withData.length : 0;
    out.append(h("section", { class: "card" },
      h("div", { class: "card-head" }, h("h2", null, "Last 6 months"), avg ? h("span", { class: "hint num" }, `Avg spent ${money(avg, { whole: true })}`) : null),
      h("div", { class: "cols", role: "img", "aria-label": stats.map(([mm, x]) => `${monthName(mm)}: spent ${money(x.spent, { whole: true, show: true })}, came in ${money(x.income, { whole: true, show: true })}`).join(". ") },
        stats.map(([mm, x]) => h("div", { class: "col" + (mm === m ? " cur" : "") },
          h("div", { class: "col-bars" }, h("span", { class: "b-in", style: { height: (x.income / max * 100) + "%" } }), h("span", { class: "b-out", style: { height: (x.spent / max * 100) + "%" } })),
          h("span", { class: "col-label" }, monthShort(mm))))),
      h("div", { class: "legend" }, h("span", null, h("i", { class: "swatch b-out" }), "Spent"), h("span", null, h("i", { class: "swatch b-in" }), "Came in"))));

    const nw = netWorthCard(m);
    if (nw) out.append(nw);

    const isCur = m === thisMonth();
    const daysSoFar = isCur ? Number(today().slice(8)) : daysInMonth(m);
    let noSpend = 0;
    for (let d = 1; d <= daysSoFar; d++) if (!s.days.has(`${m}-${pad(d)}`)) noSpend++;
    const big = s.biggest;
    const bigCat = big ? cat(big.category_id) : null;
    out.append(h("section", { class: "card" },
      h("div", { class: "card-head" }, h("h2", null, "Habits")),
      h("div", { class: "facts" },
        h("div", { class: "fact" }, h("small", null, "Per day"), h("strong", null, money(s.spent / daysSoFar, { whole: true })), h("span", null, isCur ? "so far this month" : "on average")),
        h("div", { class: "fact" }, h("small", null, "Days with no spending"), h("strong", { class: "num" }, String(noSpend)), h("span", null, `of ${daysSoFar}`)),
        h("div", { class: "fact" }, h("small", null, "Biggest expense"), h("strong", null, big ? money(txMain(big), { whole: true }) : "—"), big ? h("span", null, [bigCat ? bigCat.name : "Uncategorized", big.note].filter(Boolean).join(" · ")) : null),
        h("div", { class: "fact" }, h("small", null, "Expenses logged"), h("strong", { class: "num" }, String(s.count)), h("span", null, s.count ? `avg ${money(s.spent / s.count, { whole: true })}` : "")))));

    const groups = planGroups();
    const total = groups.reduce((t, g) => t + (s.buckets[g.id] || 0), 0);
    if (total > 0) {
      out.append(h("section", { class: "card" },
        h("div", { class: "card-head" }, h("h2", null, "How you divided it")),
        h("div", { class: "split", "aria-hidden": "true" }, groups.filter(g => s.buckets[g.id] > 0).map(g => h("span", { style: { flex: `${s.buckets[g.id]} 1 0`, background: g.color } }))),
        groups.map(g => h("div", { class: "cat-line" },
          h("span", { class: "swatch", style: { background: g.color } }),
          h("span", { class: "name" }, g.name),
          h("span", { class: "val" }, money(s.buckets[g.id] || 0, { whole: true })),
          h("span", { class: "pct" }, `${Math.round((s.buckets[g.id] || 0) / total * 100)}%`),
          h("span", { class: "pct" }, `plan ${g.pct}%`)))));
    }
    return out;
  }

  function viewPlan() {
    const m = S.month || thisMonth();
    const st = settings();
    const p = planFor(m);
    const s = p.s;
    const out = h("div", { class: "stack" }, monthSwitcher(12));

    out.append(incomeCard(m, p));

    out.append(planEditor());
    out.append(goalsCard(true));

    if (m === thisMonth()) {
      const safe = safeToSpend();
      if (safe) out.append(h("section", { class: "safe" },
        h("small", null, `Safe to spend on ${planGroups().filter(g => !g.save).map(g => g.name.toLowerCase()).join(", ") || "spending"}`),
        h("strong", null, money(safe.perDay, { whole: true }) + " a day"),
        h("small", null, safe.left >= 0 ? `${money(safe.left, { whole: true })} left for the next ${safe.daysLeft} days` : `You're ${money(-safe.left, { whole: true })} over plan this month`)));
    }

    for (const b of p.buckets) {
      const info = b.g;
      const leftover = b.planned - b.actual;
      const pct = b.planned > 0 ? b.actual / b.planned * 100 : 0;
      const isSave = b.g.save;
      const catNames = rows("categories").filter(c => c.kind === "expense" && groupOf(c) === b.k).map(c => c.name);
      out.append(h("section", { class: "card bucket" },
        h("div", { class: "bucket-head" }, h("h3", null, h("span", { class: "swatch", style: { background: info.color } }), info.name), h("span", { class: "val" }, `${money(b.actual, { whole: true })} of ${money(b.planned, { whole: true })}`)),
        h("div", { class: "bar" }, h("span", { class: !isSave && pct > 100 ? "over" : "", style: { width: Math.min(100, pct) + "%", background: info.color } })),
        h("p", null, [b.g.pct + "% of your money", catNames.length ? catNames.join(", ") : "No categories yet", isSave ? "plus money moved to savings accounts" : null].filter(Boolean).join(" · ")),
        p.base > 0 ? h("p", { class: "left" + (!isSave && leftover < 0 ? " bad" : "") }, isSave
          ? (leftover > 0 ? `Put aside ${money(leftover, { whole: true })} more to hit your goal` : "Goal reached")
          : (leftover >= 0 ? `${money(leftover, { whole: true })} left` : `${money(-leftover, { whole: true })} over`)) : null));
    }

    const budgets = h("section", { class: "card flush" }, h("div", { class: "card-head" }, h("h2", null, "Category budgets")));
    const expenseCats = rows("categories").filter(c => c.kind === "expense").sort(bySort);
    for (const g of planGroups()) {
      for (const c of expenseCats.filter(c => groupOf(c) === g.id)) {
        const spent = s.byCat.get(c.id) || 0;
        const budget = Number(c.budget) || 0;
        budgets.append(h("button", { type: "button", class: "cat-row", on: { click: () => categorySheet(c) } },
          h("div", { class: "cat-line" }, h("span", { class: "swatch", style: { background: c.color } }), h("span", { class: "name" }, c.name),
            h("span", { class: "val" }, budget ? `${money(spent, { whole: true })} / ${money(budget, { whole: true })}` : money(spent, { whole: true }))),
          budget ? h("div", { class: "bar" }, h("span", { class: spent > budget ? "over" : "", style: { width: Math.min(100, spent / budget * 100) + "%", background: c.color } })) : h("small", null, "No budget · tap to set one")));
      }
    }
    const armed = S.armed === "suggest";
    budgets.append(h("button", { type: "button", class: "row-btn", on: { click: () => { if (armed) { S.armed = null; suggestBudgets(); } else { S.armed = "suggest"; render(); } } } },
      armed ? "Tap again to replace your budgets" : "Suggest budgets from my last 3 months"));
    out.append(budgets);
    return out;
  }

  function incomeCard(m, p) {
    const st = settings();
    const s = p.s;
    const name = monthName(m);
    const without = () => Object.fromEntries(Object.entries(st.incomeByMonth).filter(([k]) => k !== m));
    const derived = st.incomeByMonth[m] > 0 ? "month" : st.incomeMode === "fixed" && fixedIncome(m) > 0 ? "fixed" : "auto";
    const tab = S.incomePick && S.incomePick.m === m ? S.incomePick.k : derived;
    const pick = k => {
      S.incomePick = { m, k };
      if (k === "auto") return saveSettings({ incomeMode: "auto", incomeByMonth: without() });
      if (k === "fixed" && fixedIncome(m) > 0) return saveSettings({ incomeMode: "fixed", incomeByMonth: without() });
      render();
      const el = document.getElementById("p-income");
      if (el) el.focus();
    };
    const kids = [
      h("div", { class: "card-head" }, h("h2", null, `Money to divide in ${name}`)),
      h("p", { class: "income-big num" }, p.base > 0 ? money(p.base, { whole: true }) : "—"),
      seg([["auto", "As received"], ["fixed", "Every month"], ["month", `Only ${monthShort(m)}`]], tab, pick, "Where the amount comes from")
    ];
    if (tab !== "auto") {
      const from = tab === "fixed" && S.incomeFrom && S.incomeFrom.m === m ? S.incomeFrom.k : m;
      const current = tab === "month" ? st.incomeByMonth[m] : fixedIncome(from);
      if (tab === "fixed") {
        const first = [shiftMonth(thisMonth(), -12), m].sort()[0];
        const options = [];
        for (let k = first; k <= shiftMonth(thisMonth(), 24); k = shiftMonth(k, 1)) options.push(k);
        const sel = h("select", { id: "p-from", class: "input", on: { change: e => { S.incomeFrom = { m, k: e.target.value }; render(); } } },
          options.map(k => h("option", { value: k, selected: k === from }, k === thisMonth() ? `${monthLabel(k)} (this month)` : monthLabel(k))));
        sel.value = from;
        kids.push(h("label", { class: "field" }, h("span", null, "Starting from"), sel));
      }
      kids.push(h("label", { class: "field" }, h("span", null, tab === "month" ? `Income for ${name} (${curSymbol(mainCur())})` : `Monthly income (${curSymbol(mainCur())})`),
        h("input", { id: "p-income", class: "input num", inputmode: "decimal", autocomplete: "off", placeholder: p.base > 0 ? String(Math.round(p.base)) : "e.g. 1500", value: current ? String(current) : "",
          on: { change: e => {
            const raw = e.target.value.trim();
            const v = raw ? parseAmt(raw) : 0;
            if (raw && !v) { toast("Enter the amount as a number, like 1500.", "error"); e.target.value = current ? String(current) : ""; return; }
            if (tab === "month") {
              const next = without();
              if (v) next[m] = v;
              saveSettings({ incomeByMonth: Object.fromEntries(Object.entries(next).sort().slice(-36)) });
              if (!v) S.incomePick = null;
              toast(v ? `${name} now uses ${money(v, { show: true })}.` : `${name} is back to its usual setting.`);
            } else {
              const steps = Object.fromEntries(Object.entries(st.incomeSteps).filter(([k]) => k !== from));
              if (v) steps[from] = v;
              const keys = Object.keys(steps).filter(k => k <= m).sort();
              const still = keys.length ? steps[keys.pop()] : st.income;
              const any = still || Object.keys(steps).length;
              if (!any) S.incomePick = null;
              const later = Object.keys(steps).filter(k => k > from).sort()[0];
              saveSettings({ incomeSteps: steps, incomeMode: any ? "fixed" : "auto", incomeByMonth: from === m ? without() : st.incomeByMonth });
              toast(v ? `${money(v, { show: true })} a month from ${monthLabel(from)}${later ? ` until ${monthLabel(shiftMonth(later, -1))}` : ""}. Earlier months are unchanged.` : any ? `Change from ${monthLabel(from)} removed.` : "The plan now follows the income you log.");
            }
          } } })));
    }
    const logged = s.income > 0 ? `You logged ${money(s.income, { whole: true })} of income in ${name}.` : `No income logged in ${name} yet.`;
    kids.push(h("p", { class: "hint" },
      tab === "auto"
        ? (p.source === "actual" ? `Follows the income you log. ${name} has ${money(s.income, { whole: true })} so far and updates as more comes in.`
          : p.source === "estimate" ? `No income logged in ${name} yet, so this is the average of your last 3 months. It switches to the real amount once you log income.`
          : p.source === "month" ? `${name} has its own amount. Clear it under “Only ${monthShort(m)}” to follow your logged income.`
          : "Log your income with + and the plan follows it, month by month.")
        : tab === "fixed" ? `Pick the month the amount starts, then enter it. It applies from that month until the next change in the list. Months before it are not affected. ${logged}`
        : `Only ${name} uses this amount. Other months keep their usual setting. ${logged}`));
    const changes = Object.entries(st.incomeSteps).sort();
    if (tab === "fixed" && changes.length) {
      kids.push(h("div", { class: "steps" }, changes.map(([k, v]) => h("div", { class: "step-row" },
        h("span", null, `From ${monthLabel(k)}`),
        h("strong", { class: "num" }, money(v, { whole: true })),
        h("button", { type: "button", class: "link-btn", "aria-label": `Remove the change from ${monthLabel(k)}`, on: { click: () => {
          const steps = Object.fromEntries(changes.filter(([x]) => x !== k));
          saveSettings({ incomeSteps: steps });
          toast(`Change from ${monthLabel(k)} removed.`);
        } } }, "Remove")))));
    }
    return h("section", { class: "card" }, ...kids);
  }

  function planEditor() {
    const groups = planGroups();
    const sum = groups.reduce((t, g) => t + g.pct, 0);
    const saveGroups = next => saveSettings({ buckets: next, plan: null });
    const update = (id, patch) => saveGroups(groups.map(g => g.id === id ? { ...g, ...patch } : g));
    const step = (g, d) => update(g.id, { pct: Math.max(0, Math.min(100, g.pct + d)) });
    const card = h("section", { class: "card plan-edit" }, h("div", { class: "card-head" }, h("h2", null, "How to divide it"), h("span", { class: "hint" }, `${groups.length} group${groups.length === 1 ? "" : "s"}`)));
    const bar = h("div", { class: "alloc", "aria-hidden": "true" },
      groups.filter(g => g.pct > 0).map(g => h("span", { style: { flex: `${g.pct} 1 0`, background: g.color } }, g.pct >= 8 ? `${g.pct}%` : "")),
      sum < 100 ? h("span", { class: "free", style: { flex: `${100 - sum} 1 0` } }, 100 - sum >= 8 ? `${100 - sum}%` : "") : null);
    const status = h("p", { class: sum === 100 ? "alloc-ok" : "alloc-bad" }, sum === 100 ? "All 100% assigned." : sum < 100 ? `${100 - sum}% not assigned yet.` : `${sum - 100}% too much. Lower a group.`);
    card.append(bar, status);
    for (const g of groups) {
      const armed = S.armed === "grp:" + g.id;
      const nameIn = h("input", { id: `g-name-${g.id}`, class: "grp-name", maxlength: "24", value: g.name, autocomplete: "off", "aria-label": "Group name",
        on: { change: e => { const v = e.target.value.trim().replace(/\s+/g, " ").slice(0, 24); if (!v) { e.target.value = g.name; return; } update(g.id, { name: v }); } } });
      const pctIn = h("input", { id: `g-pct-${g.id}`, class: "grp-pct num", inputmode: "numeric", value: String(g.pct), autocomplete: "off", "aria-label": `${g.name} percent`,
        on: { change: e => { const v = Number(e.target.value); if (!Number.isInteger(v) || v < 0 || v > 100) { toast("Use a whole number from 0 to 100.", "error"); e.target.value = String(g.pct); return; } update(g.id, { pct: v }); } } });
      const colorBtn = h("button", { type: "button", class: "grp-color", style: { background: g.color }, "aria-label": `Change ${g.name} color`, on: { click: () => update(g.id, { color: BUCKET_COLORS[(BUCKET_COLORS.indexOf(g.color) + 1) % BUCKET_COLORS.length] }) } });
      card.append(h("div", { class: "grp" + (S.freshGroup === g.id ? " fresh" : "") },
        h("div", { class: "grp-top" }, colorBtn, nameIn,
          h("div", { class: "stepper" },
            h("button", { type: "button", "aria-label": `Lower ${g.name}`, on: { click: () => step(g, -5) } }, icon("minus", "ico sm")),
            pctIn, h("span", { class: "pct-sign" }, "%"),
            h("button", { type: "button", "aria-label": `Raise ${g.name}`, on: { click: () => step(g, 5) } }, icon("plus", "ico sm")))),
        h("div", { class: "grp-bottom" },
          h("button", { type: "button", class: "chip mini", "aria-pressed": String(g.save), on: { click: () => update(g.id, { save: !g.save }) } }, icon("bank", "ico sm"), "Counts as saving"),
          groups.length > 1 ? h("button", { type: "button", class: "chip mini danger" + (armed ? " sure" : ""), on: { click: () => {
            if (!armed) { S.armed = "grp:" + g.id; render(); return; }
            S.armed = null;
            const rest = groups.filter(x => x.id !== g.id);
            const fallback = (rest.find(x => !x.save) || rest[0]).id;
            putMany([
              ...rows("categories").filter(c => c.bucket === g.id).map(c => ({ t: "categories", r: { ...c, bucket: fallback } })),
              { t: "settings", r: { id: settingsId(), data: { ...storedSettings(), buckets: rest, plan: null } } }
            ]);
            toast(`${g.name} removed. Its categories moved to ${groupInfo(fallback).name}.`);
          } } }, icon("trash", "ico sm"), armed ? "Tap again" : "Remove") : null)));
    }
    if (groups.length < 8) card.append(h("button", { type: "button", class: "row-btn add-grp", on: { click: () => {
      const id = "g" + newId().replace(/[^a-z0-9]/gi, "").slice(0, 10).toLowerCase();
      S.freshGroup = id;
      saveGroups([...groups, { id, name: "New group", pct: Math.max(0, 100 - sum), color: BUCKET_COLORS[groups.length % BUCKET_COLORS.length], save: false }]);
      render();
      const el = document.getElementById(`g-name-${id}`);
      if (el) { el.scrollIntoView({ block: "center", behavior: "smooth" }); el.focus({ preventScroll: true }); el.select(); }
      setTimeout(() => { S.freshGroup = null; }, 1700);
      toast("Group added. Name it and set its percentage.");
    } } }, icon("plus", "ico sm"), "Add a group"));
    const presets = [["50 / 30 / 20", [50, 30, 20]], ["60 / 20 / 20", [60, 20, 20]], ["70 / 20 / 10", [70, 20, 10]]];
    card.append(h("div", { class: "chips wrap" },
      groups.length > 1 ? h("button", { type: "button", class: "chip", on: { click: () => {
        const base = Math.floor(100 / groups.length);
        saveGroups(groups.map((g, i) => ({ ...g, pct: base + (i < 100 - base * groups.length ? 1 : 0) })));
      } } }, "Split evenly") : null,
      sum !== 100 && groups.length ? h("button", { type: "button", class: "chip", on: { click: () => {
        const last = groups[groups.length - 1];
        update(last.id, { pct: Math.max(0, Math.min(100, last.pct + 100 - sum)) });
      } } }, `Fix to 100%`) : null,
      presets.map(([label, v]) => h("button", { type: "button", class: "chip", on: { click: () => {
        const ids = DEFAULT_BUCKETS.map(b => b.id);
        const keep = groups.filter(g => !ids.includes(g.id));
        saveGroups([...DEFAULT_BUCKETS.map((b, i) => ({ ...(groups.find(g => g.id === b.id) || b), pct: v[i] })), ...keep.map(g => ({ ...g, pct: 0 }))]);
      } } }, label))));
    card.append(h("p", { class: "hint" }, "Name your groups, give each a percentage, and mark the ones that are saving. Pick each category's group in Settings or by tapping a category budget below."));
    return card;
  }

  function suggestBudgets() {
    const m = thisMonth();
    const base = planFor(m).base;
    if (!(base > 0)) return toast("Enter your monthly income first.");
    const avg = new Map();
    for (const mm of [1, 2, 3].map(k => shiftMonth(m, -k))) for (const [id, v] of monthStats(mm).byCat) avg.set(id, (avg.get(id) || 0) + v / 3);
    const items = [];
    for (const g of planGroups()) {
      const cs = rows("categories").filter(c => c.kind === "expense" && groupOf(c) === g.id);
      if (!cs.length) continue;
      const planned = base * g.pct / 100;
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
    const group = (title, ...kids) => h("section", { class: "group", "data-key": title }, h("h2", { class: "group-title" }, title), h("div", { class: "card flush" }, ...kids));

    const pending = S.outbox.length;
    out.append(group("Sync",
      h("div", { class: "row" }, h("span", { class: "row-main" },
        h("span", { class: "row-title" }, !navigator.onLine ? "Offline" : S.syncError ? "Couldn't sync" : pending ? `${pending} changes waiting` : "Up to date"),
        h("span", { class: "row-sub" }, S.syncedAt ? `Last synced ${ago(S.syncedAt)}` : "Not synced yet"))),
      h("button", { type: "button", class: "row-btn", on: { click: () => sync() } }, "Sync now"),
      h("button", { type: "button", class: "row-btn", on: { click: async () => {
        if (!navigator.onLine) return toast("Connect to the internet to reload your data.", "error");
        if (S.outbox.length) await flush().catch(() => { });
        S.fullPull = true;
        await sync();
        toast("Reloaded from the server. This device now matches your other devices.");
      } } }, "Reload everything from the server")));

    out.append(currencyGroup(group));

    const accRows = rows("accounts").sort((a, b) => (a.archived - b.archived) || bySort(a, b)).map(a => h("button", { type: "button", class: "row", on: { click: () => accountSheet(a) } },
      h("span", { class: "dot neutral" }, curTag(a.currency)),
      h("span", { class: "row-main" }, h("span", { class: "row-title" }, a.name), h("span", { class: "row-sub" }, [KIND_LABEL[a.kind], a.currency, a.archived ? "Hidden" : null].filter(Boolean).join(" · "))),
      h("span", { class: "row-end" }, fmt(bal.get(a.id) || 0, a.currency))));
    out.append(group("Accounts", ...accRows, h("button", { type: "button", class: "row-btn", on: { click: () => accountSheet(null) } }, "Add account")));

    const catRows = kind => rows("categories").filter(c => c.kind === kind).sort(bySort).map(c => h("button", { type: "button", class: "row", on: { click: () => categorySheet(c) } },
      h("span", { class: "dot", style: { background: c.color } }, catGlyph(c, "ico sm")),
      h("span", { class: "row-main" }, h("span", { class: "row-title" }, c.name), h("span", { class: "row-sub" }, kind === "expense" ? [groupInfo(groupOf(c)).name, Number(c.budget) ? `${money(Number(c.budget), { whole: true })} a month` : null].filter(Boolean).join(" · ") : "Income"))));
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
    if (ADMIN.allowed === null) checkAdmin();
    if (ADMIN.allowed) out.append(group("Admin", h("button", { type: "button", class: "row", on: { click: () => go("admin") } },
      h("span", { class: "dot gold" }, icon("shield", "ico sm")),
      h("span", { class: "row-main" }, h("span", { class: "row-title" }, "Admin dashboard"), h("span", { class: "row-sub" }, "Users, activity and server health")),
      icon("fwd"))));
    out.append(reminderGroup(group));
    const quickOn = !!store.get("quickToken", null);
    out.append(group("Quick add",
      h("button", { type: "button", class: "row", on: { click: quickSheet } }, h("span", { class: "dot neutral" }, icon("plus", "ico sm")),
        h("span", { class: "row-main" }, h("span", { class: "row-title" }, "Add from the Lock Screen"), h("span", { class: "row-sub wrap" }, quickOn ? "On. Tap to see the setup or turn it off" : "Log an expense with an iPhone Shortcut, without opening the app")), icon("fwd"))));

    out.append(group("Your name", h("div", { class: "row" }, h("span", { class: "row-main" }, nameIn, h("span", { class: "row-sub", style: { marginTop: "6px" } }, "Shown on the private pages you share")))));

    const fileInput = h("input", { id: "s-restore", type: "file", accept: "application/json,.json", class: "vh", on: { change: onRestoreFile } });
    const importInput = h("input", { id: "s-import", type: "file", accept: ".csv,text/csv", class: "vh", on: { change: onImportFile } });
    const dataKids = [
      h("button", { type: "button", class: "row-btn", on: { click: exportCsv } }, "Export spending (CSV)"),
      h("button", { type: "button", class: "row-btn", on: { click: exportBackup } }, "Download a backup"),
      h("button", { type: "button", class: "row-btn", on: { click: () => (document.getElementById("s-restore") || fileInput).click() } }, "Restore from a backup"),
      h("button", { type: "button", class: "row-btn", on: { click: () => (document.getElementById("s-import") || importInput).click() } }, "Import entries from a CSV file"),
      fileInput, importInput
    ];
    if (S.restore) {
      dataKids.push(h("div", { class: "row" }, h("span", { class: "row-main" }, h("span", { class: "row-title" }, `Restore ${S.restore.length} records?`), h("span", { class: "row-sub" }, "Records with the same ID are replaced."))),
        h("button", { type: "button", class: "row-btn", on: { click: () => { const items = S.restore; S.restore = null; putMany(items); toast("Backup restored."); } } }, "Restore now"),
        h("button", { type: "button", class: "row-btn danger", on: { click: () => { S.restore = null; render(); } } }, "Cancel"));
    }
    out.append(group("Your data", ...dataKids));

    const armed = S.armed === "signout";
    const locked = !!lockCfg();
    const nav = (title, sub, fn, ic) => h("button", { type: "button", class: "row", on: { click: fn } }, h("span", { class: "dot neutral" }, icon(ic, "ico sm")), h("span", { class: "row-main" }, h("span", { class: "row-title" }, title), sub ? h("span", { class: "row-sub" }, sub) : null), icon("fwd"));
    out.append(group("Help",
      h("button", { type: "button", class: "row-btn", on: { click: () => { for (const v of Object.keys(TOURS)) store.set("tour:" + v, 0); go("home"); setTimeout(() => startTour("home"), 500); } } }, "Show the tour again"),
      h("button", { type: "button", class: "row-btn", on: { click: helpSheet } }, "How each screen works")));
    out.append(group("Language",
      h("div", { class: "row lang-row" }, seg(Object.entries(LANGS), LANG, setLang, "Language"))));
    out.append(group("Security",
      h("div", { class: "row" }, h("span", { class: "dot neutral" }, icon("shield", "ico sm")),
        h("span", { class: "row-main" }, h("span", { class: "row-title" }, "App lock"), h("span", { class: "row-sub" }, lockSupported() ? "Ask for Face ID or your passcode when the app opens" : "Not available in this browser")),
        h("button", { type: "button", class: "switch", role: "switch", "aria-checked": String(locked), "aria-label": "App lock", disabled: !lockSupported(), on: { click: () => (locked ? disableLock() : enableLock()) } }, h("span", { class: "knob" }))),
      isOAuth() ? null : nav("Change password", null, passwordSheet, "lock"),
      h("div", { class: "row" }, h("span", { class: "dot neutral" }, icon("mail", "ico sm")),
        h("span", { class: "row-main" }, h("span", { class: "row-title" }, "Reset password by email"), h("span", { class: "row-sub wrap" }, st.strictVault ? "Off: only your recovery key can restore your data" : "On: a forgotten password can be reset without losing data")),
        h("button", { type: "button", class: "switch", role: "switch", "aria-checked": String(!st.strictVault), "aria-label": "Reset password by email", on: { click: async () => {
          if (!navigator.onLine) return toast("Connect to the internet to change this.", "error");
          if (st.strictVault) { saveSettings({ strictVault: false }); store.set("escrow", 0); await ensureEscrow(); return toast("A forgotten password can now be reset by email."); }
          const res = await escrow("escrow-clear");
          if (!res || !res.ok) return toast("Couldn't change this. Try again.", "error");
          store.set("escrow", 0);
          saveSettings({ strictVault: true });
          toast("Done. Keep your recovery key safe: it is now the only way back in.");
        } } }, h("span", { class: "knob" }))),
      nav("Recovery key", "Create a new key if you lost the old one", newRecoveryKey, "shield"),
      nav("Privacy and your data", "What is stored and who can see it", privacySheet, "eye")));
    out.append(group("Account",
      h("div", { class: "row" }, h("span", { class: "row-main" }, h("span", { class: "row-title" }, S.email || "Signed in"), h("span", { class: "row-sub" }, "Your data syncs to every device you sign in on"))),
      h("button", { type: "button", class: "row-btn danger", on: { click: deleteAccountSheet } }, "Delete account"),
      h("button", { type: "button", class: "row-btn danger", on: { click: () => { if (armed) signOut(); else { S.armed = "signout"; render(); } } } },
        armed ? (pending ? `Sign out and lose ${pending} unsynced changes?` : "Tap again to sign out") : "Sign out")));
    const PAGES = [
      ["general", "General", "Language, your name and currency", "gear", ["Language", "Your name", "Currency", "Help"]],
      ["money", "Accounts and categories", "Accounts, categories and repeating entries", "bank", ["Accounts", "Spending categories", "Income categories", "Every month"]],
      ["reminders", "Reminders and quick add", "Daily notification and adding from the Lock Screen", "bell", ["Reminders", "Daily reminder", "Quick add"]],
      ["data", "Sync and backup", "Sync, export, import and restore", "sync", ["Sync", "Your data"]],
      ["security", "Security and account", "App lock, password, privacy and sign out", "shield", ["Security", "Account"]],
      ["admin", "Admin", "Users, activity and server health", "users", ["Admin"]]
    ];
    const sections = [...out.children].filter(el => el.dataset && el.dataset.key);
    const page = PAGES.find(p => p[0] === S.setPage);
    if (page) {
      const keep = sections.filter(el => page[4].includes(el.dataset.key));
      out.replaceChildren(
        h("button", { type: "button", class: "back-row", on: { click: () => { S.setPage = null; render(); toTop(); } } }, icon("back", "ico"), h("span", null, "Settings")),
        ...keep);
      shell.title.textContent = tr(page[1]);
      return out;
    }
    const menu = h("section", { class: "card flush" });
    for (const [id, title, sub, ic, keys] of PAGES) {
      if (!sections.some(el => keys.includes(el.dataset.key))) continue;
      menu.append(h("button", { type: "button", class: "row", on: { click: () => { S.setPage = id; render(); toTop(); } } },
        h("span", { class: "dot neutral" }, icon(ic, "ico sm")),
        h("span", { class: "row-main" }, h("span", { class: "row-title" }, title), h("span", { class: "row-sub wrap" }, sub)),
        icon("fwd")));
    }
    out.replaceChildren(menu, h("p", { class: "about" }, `My Wallet · Version ${VERSION}`));
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
  const shareUrl = p => `${location.origin}${location.pathname}#share=${p.share_token}.${p.skey}`;
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
  const linkMessage = (p, token) => `Hi ${p.name}, here's a private page with your balance and history. It updates whenever something changes: ${shareUrl(p)}`;

  async function copyText(text, fallbackId) {
    try { await navigator.clipboard.writeText(text); toast("Copied."); return; } catch { }
    const el = document.getElementById(fallbackId);
    if (el) { el.hidden = false; el.focus(); el.select(); toast("Copy the selected link."); }
  }

  function viewPeople() {
    const st = settings();
    const bal = loanBalances();
    const people = rows("people").sort(bySort);
    let owed = 0, owe = 0;
    for (const p of people) {
      const v = toMain(bal.get(p.id) || 0, p.currency);
      if (owesMe(p)) owed += v; else owe += v;
    }
    const out = h("div", { class: "stack" });
    out.append(h("div", { class: "tiles two" },
      h("div", { class: "tile good" }, h("small", null, "Owed to you"), h("strong", null, money(owed))),
      h("div", { class: "tile" + (owe > 0 ? " bad" : "") }, h("small", null, "You owe"), h("strong", null, money(owe)))));
    const list = h("section", { class: "card flush" });
    for (const p of people) {
      const v = bal.get(p.id) || 0;
      list.append(h("button", { type: "button", class: "row", on: { click: () => personSheet(p) } },
        h("span", { class: "dot", style: { background: COLORS[(p.sort || 0) % COLORS.length] } }, p.name.charAt(0).toUpperCase()),
        h("span", { class: "row-main" }, h("span", { class: "row-title" }, p.name), h("span", { class: "row-sub" + (v > 0 && dueInfo(p) && dueInfo(p).late ? " late" : "") }, [statusText(p, v), v > 0 && dueInfo(p) ? dueInfo(p).text : null, p.share_token ? "Has their page" : null].filter(Boolean).join(" · "))),
        h("span", { class: "row-end" + (v > 0 && owesMe(p) ? " pos" : v > 0 ? " neg" : "") }, fmt(v, p.currency))));
    }
    if (!people.length) list.append(h("p", { class: "empty" }, "No one yet. Add the people you lend money to or borrow from."));
    list.append(h("button", { type: "button", class: "row-btn", on: { click: () => personSheet(null) } }, "Add person"));
    out.append(list, h("p", { class: "hint" }, "Each person can get a private link that shows only their own balance and history. They don't need an account."));
    return out;
  }

  function personSheet(p, notice) {
    if (!p) return newPersonSheet();
    const body = h("div", { class: "form" });
    const f = { phone: p.phone || "", name: p.name, due: dueOf(p) || "" };
    let armed = null;
    const openAmount = mode => {
      const balance = loanBalances().get(p.id) || 0;
      const cur = p.currency;
      const back = mode === "back";
      amountSheet({
        title: back ? (owesMe(p) ? `${p.name} paid you back` : `You paid ${p.name} back`) : (owesMe(p) ? `You lent ${p.name} more` : `You borrowed more from ${p.name}`),
        cur, max: back ? balance : null,
        quick: isBig(cur) ? [1e6, 5e6, 10e6] : [50, 100, 500, 1000],
        verbFor: v => !v ? "Enter an amount" : back ? `Record ${fmt(v, cur, { show: true })} paid back` : `Add ${fmt(v, cur, { show: true })}`,
        previewFor: v => `New balance: ${fmt(balance + (back ? -v : v), cur, { show: true })}`,
        onSave: (v, note) => {
          const amount = roundCur(v, cur) * (back ? -1 : 1);
          put("loan_entries", { id: newId(), person_id: p.id, amount, note, occurred_on: today(), created_at: new Date().toISOString() });
          const next = balance + amount;
          personSheet(S.data.people.get(p.id) || p, { title: next === 0 ? "Saved. All settled." : `Saved. Balance is now ${fmt(next, cur, { show: true })}.`, message: loanMessage(p, amount, next, note) });
        }
      });
    };
    const draw = () => {
      p = S.data.people.get(p.id) || p;
      const balance = loanBalances().get(p.id) || 0;
      const cur = p.currency;
      const history = rows("loan_entries").filter(e => e.person_id === p.id).sort(byRecent);
      const kids = [];
      kids.push(h("div", { class: "hero person-hero" + (balance === 0 ? " settled" : owesMe(p) ? "" : " owe") },
        h("p", { class: "hero-label" }, balance === 0 ? "All settled" : owesMe(p) ? `${p.name} owes you` : `You owe ${p.name}`),
        h("p", { class: "hero-total num" }, fmt(balance, cur, { show: true })),
        history.length ? h("p", { class: "hero-sub" }, `Last change ${dayLabel(history[0].occurred_on).toLowerCase()}`) : null,
        balance > 0 && dueInfo(p) ? h("p", { class: "hero-sub due" + (dueInfo(p).late ? " late" : "") }, dueInfo(p).text) : null));

      if (notice) {
        kids.push(h("div", { class: "notice" }, h("p", null, icon("check", "ico sm"), notice.title),
          h("div", { class: "btn-row" },
            p.phone ? waButton(p.phone, notice.message, `Tell ${p.name}`, "wa") : null,
            h("button", { type: "button", class: "btn alt", on: { click: () => { notice = null; draw(); } } }, p.phone ? "Skip" : "OK")),
          p.phone ? null : h("p", { class: "hint" }, "Add their WhatsApp number in Details to send updates.")));
      }

      kids.push(h("div", { class: "actions" },
        h("button", { type: "button", class: "action", on: { click: () => openAmount("more") } }, h("span", { class: "action-ico" }, icon("plus")), owesMe(p) ? "Lent more" : "Borrowed more"),
        h("button", { type: "button", class: "action", disabled: balance <= 0, on: { click: () => openAmount("back") } }, h("span", { class: "action-ico out" }, icon("minus")), owesMe(p) ? "Paid me back" : "I paid back")));

      if (p.phone) kids.push(waButton(p.phone, balanceMessage(p, balance), "Send balance on WhatsApp", "alt wa-alt"));
      if (p.phone && balance > 0 && owesMe(p) && dueInfo(p)) kids.push(waButton(p.phone, `Hi ${p.name}, a friendly reminder that ${fmt(balance, cur, { show: true })} ${dueInfo(p).late ? "was due on" : "is due on"} ${dayLabel(dueOf(p)).toLowerCase()}. Thank you.`, "Send a payment reminder", "alt wa-alt"));

      const share = h("section", { class: "card flush" }, h("div", { class: "card-head" }, h("h2", null, "Their private page")));
      if (p.share_token && p.skey) {
        const url = shareUrl(p);
        share.append(
          h("p", { class: "row-sub", style: { padding: "0 16px 6px", whiteSpace: "normal" } }, `${p.name} sees only their balance and history. No account needed.`),
          h("input", { id: "f-plink", class: "input", readOnly: true, value: url, hidden: true, style: { margin: "0 16px", width: "calc(100% - 32px)" } }),
          h("button", { type: "button", class: "row-btn", on: { click: () => copyText(url, "f-plink") } }, "Copy link"),
          p.phone ? h("a", { class: "row-btn", style: { display: "block", textDecoration: "none" }, href: waUrl(p.phone, linkMessage(p, p.share_token)), target: "_blank", rel: "noopener noreferrer" }, "Send link on WhatsApp") : null,
          h("button", { type: "button", class: "row-btn danger", on: { click: () => { if (armed !== "unshare") { armed = "unshare"; draw(); return; } armed = null; putMany([{ t: "people", r: { ...p, share_token: null, skey: null } }, ...history.map(e => ({ t: "loan_entries", r: { ...e } }))]); toast("Link turned off."); draw(); } } }, armed === "unshare" ? "Tap again to turn off the link" : "Turn off link"));
      } else {
        share.append(h("p", { class: "row-sub", style: { padding: "0 16px 6px", whiteSpace: "normal" } }, `Make a link that shows ${p.name} only their own balance and history.`),
          h("button", { type: "button", class: "row-btn", on: { click: () => { putMany([{ t: "people", r: { ...p, share_token: newToken(), skey: toUrl(b64u8(rand(32))) } }, ...history.map(e => ({ t: "loan_entries", r: { ...e } }))]); draw(); } } }, "Create private link"));
      }
      kids.push(share);

      const hist = h("section", { class: "card flush" }, h("div", { class: "card-head" }, h("h2", null, `History (${history.length})`)));
      for (const e of history) {
        const v = Number(e.amount);
        const label = owesMe(p) ? (v > 0 ? "Lent" : "Paid back") : (v > 0 ? "Borrowed" : "Paid back");
        hist.append(h("div", { class: "row" },
          h("span", { class: "row-main" }, h("span", { class: "row-title" }, e.note || label), h("span", { class: "row-sub" }, e.note ? `${label} · ${dayLabel(e.occurred_on)}` : dayLabel(e.occurred_on))),
          h("span", { class: "row-end" + (v < 0 ? " neg" : " pos") }, (v > 0 ? "+" : "−") + fmt(Math.abs(v), cur)),
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
        h("label", { class: "field" }, h("span", null, "Due date (optional)"), h("input", { id: "f-pdue", class: "input", type: "date", value: f.due, on: { input: e => { f.due = e.target.value; } } })),
        h("button", { type: "button", class: "btn alt", on: { click: () => {
          const name = f.name.trim().replace(/\s+/g, " ");
          if (!name || name.length > 40) return toast("Enter a name.");
          const phone = f.phone.trim() ? cleanPhone(f.phone) : null;
          if (phone && !PHONE_RE.test(phone)) return toast("Enter a number like 70 123 456, or +33 6 12 34 56 78 outside Lebanon.");
          put("people", { ...p, name, phone });
          const due = { ...settings().loanDue };
          if (DATE_RE.test(f.due)) due[p.id] = f.due; else delete due[p.id];
          saveSettings({ loanDue: due });
          f.phone = phone || "";
          toast("Changes saved.");
          draw();
        } } }, "Save details"),
        h("button", { type: "button", class: "btn danger" + (armed === "delete" ? " sure" : ""), on: { click: () => {
          if (armed !== "delete") { armed = "delete"; draw(); return; }
          const items = [{ t: "people", r: { ...p, share_token: null, deleted_at: new Date().toISOString() } }, ...history.map(e => ({ t: "loan_entries", r: { ...e, deleted_at: new Date().toISOString() } }))];
          putMany(items); closeSheet(); toast(`${p.name} removed.`);
        } } }, armed === "delete" ? `Tap again to remove ${p.name} and their history` : "Remove person")));

      keepFocus(() => body.replaceChildren(...kids.filter(Boolean)));
    };
    draw();
    openSheet(p.name, body);
  }

  function newPersonSheet() {
    const f = { name: "", direction: "owes_me", currency: mainCur(), amount: "", phone: "" };
    const body = h("form", { class: "form", novalidate: true });
    const err = h("p", { class: "form-err", role: "alert" });
    const draw = () => {
      keepFocus(() => body.replaceChildren(
        h("label", { class: "field" }, h("span", null, "Name"), h("input", { id: "f-nname", class: "input", maxlength: "40", autocomplete: "off", value: f.name, on: { input: e => { f.name = e.target.value; } } })),
        h("div", { class: "field" }, h("span", { class: "label" }, "Who owes who"), seg([["owes_me", "They owe me"], ["i_owe", "I owe them"]], f.direction, k => { f.direction = k; draw(); }, "Direction")),
        h("div", { class: "field" }, h("span", { class: "label" }, "Currency"), curSelect("f-ncur", f.currency, k => { f.currency = k; draw(); })),
        h("label", { class: "field" }, h("span", null, `Amount owed now (${curSymbol(f.currency)})`), h("input", { id: "f-namt", class: "input num", inputmode: "decimal", autocomplete: "off", placeholder: "0", value: f.amount, on: { input: e => { f.amount = e.target.value; } } })),
        h("label", { class: "field" }, h("span", null, "WhatsApp number (optional)"), h("input", { id: "f-nphone", class: "input", type: "tel", autocomplete: "off", placeholder: "70 123 456", value: f.phone, on: { input: e => { f.phone = e.target.value; } } })),
        err,
        h("button", { type: "submit", class: "btn" }, "Add person")));
    };
    body.addEventListener("submit", ev => {
      ev.preventDefault();
      const name = f.name.trim().replace(/\s+/g, " ");
      if (!name || name.length > 40) { fail(err, "Enter a name."); return; }
      if (rows("people").some(p => p.name.toLowerCase() === name.toLowerCase())) { fail(err, `${name} is already on your list.`); return; }
      const start = f.amount.trim() ? parseAmt(f.amount) : 0;
      if (start === null) { fail(err, "Enter the amount as a number, like 2000."); return; }
      const phone = f.phone.trim() ? cleanPhone(f.phone) : null;
      if (phone && !PHONE_RE.test(phone)) { fail(err, "Enter a number like 70 123 456, or +33 6 12 34 56 78 outside Lebanon."); return; }
      const person = { id: newId(), name, direction: f.direction, currency: f.currency, phone, share_token: null, sort: Math.max(-1, ...rows("people").map(r => r.sort || 0)) + 1 };
      const items = [{ t: "people", r: person }];
      if (start) items.push({ t: "loan_entries", r: { id: newId(), person_id: person.id, amount: roundCur(start, f.currency), note: "Starting balance", occurred_on: today(), created_at: new Date().toISOString() } });
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
    const [tok, skey] = String(token).split(".");
    token = tok;
    if (!TOKEN_RE.test(token) || !/^[A-Za-z0-9_-]{43}$/.test(skey || "")) return fail("This link is from an older version or isn't complete. Ask for a new one.");
    let data = null;
    try {
      const res = await sb.rpc("shared_ledger", { p_token: token });
      if (res.error) return fail("Couldn't load your balance. Check your connection and reload.");
      data = res.data;
    } catch { return fail("Couldn't load your balance. Check your connection and reload."); }
    if (!data || typeof data !== "object" || !data.person) return fail("This link doesn't work anymore. Ask for a new one.");
    try {
      const key = await aesKey(unb64(fromUrl(skey)));
      const person = await openWith(key, data.person);
      const entries = [];
      for (const item of Array.isArray(data.history) ? data.history : []) { try { entries.push(await openWith(key, item)); } catch { } }
      data = { ...person, history: entries, balance: entries.reduce((t, e) => t + (Number(e.amount) || 0), 0) };
    } catch { return fail("This link doesn't work anymore. Ask for a new one."); }
    const cur = CUR_RE.test(String(data.currency)) ? data.currency : "USD";
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
        h("span", { class: "row-end" + (v < 0 ? " neg" : " pos") }, (v > 0 ? "+" : "−") + fmt(Math.abs(v), cur, { show: true }))));
    }
    if (!history.length) list.append(h("p", { class: "empty" }, "No history yet."));
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

  const ADMIN = { allowed: null, data: null, loading: false, error: null };

  async function checkAdmin() {
    if (ADMIN.checking || !sb || !S.session) return;
    ADMIN.checking = true;
    try { const { data } = await sb.rpc("is_admin"); ADMIN.allowed = data === true; } catch { ADMIN.allowed = false; }
    ADMIN.checking = false;
    if (S.view === "settings" && ADMIN.allowed) render();
  }

  async function adminCall(action, extra = {}) {
    const res = await sb.functions.invoke("admin", { body: { action, ...extra } });
    if (!res.error) return res.data;
    let msg = "The admin server didn't answer. Check your connection.";
    try { const r = res.error.context; if (r && typeof r.json === "function") { const j = await r.json(); if (j && j.error) msg = j.error; } } catch { }
    throw new Error(msg);
  }

  async function loadAdmin() {
    if (ADMIN.loading) return;
    ADMIN.loading = true; ADMIN.error = null;
    if (S.view === "admin") render();
    try { ADMIN.data = await adminCall("overview"); } catch (e) { ADMIN.error = e.message; }
    ADMIN.loading = false;
    if (S.view === "admin") render();
  }

  const whenText = iso => iso ? ago(iso) : "never";
  const isBlocked = u => !!u.banned_until && new Date(u.banned_until) > new Date();

  function viewAdmin() {
    const out = h("div", { class: "stack" });
    if (!ADMIN.allowed) { out.append(h("p", { class: "empty" }, "This area is for the admin only.")); return out; }
    if (!ADMIN.data && !ADMIN.loading && !ADMIN.error) loadAdmin();
    out.append(h("div", { class: "btn-row" },
      h("button", { type: "button", class: "btn alt", on: { click: () => go("settings") } }, icon("back", "ico sm"), "Settings"),
      h("button", { type: "button", class: "btn alt", disabled: ADMIN.loading, on: { click: loadAdmin } }, icon("sync", "ico sm"), ADMIN.loading ? "Loading…" : "Refresh")));
    if (ADMIN.error) { out.append(h("div", { class: "alert bad" }, icon("warn"), h("span", null, ADMIN.error))); return out; }
    const d = ADMIN.data;
    if (!d) { out.append(h("p", { class: "empty" }, "Loading the dashboard…")); return out; }
    const t = d.totals || {};
    out.append(h("div", { class: "tiles" },
      h("div", { class: "tile" }, h("small", null, "Users"), h("strong", null, String(t.users ?? 0))),
      h("div", { class: "tile" }, h("small", null, "Entries"), h("strong", null, String(t.transactions ?? 0))),
      h("div", { class: "tile" }, h("small", null, "Reminders on"), h("strong", null, String(t.reminders_on ?? 0)))));
    out.append(h("div", { class: "tiles" },
      h("div", { class: "tile" }, h("small", null, "Loan contacts"), h("strong", null, String(t.people ?? 0))),
      h("div", { class: "tile" }, h("small", null, "Loan entries"), h("strong", null, String(t.loan_entries ?? 0))),
      h("div", { class: "tile" }, h("small", null, "Shared pages"), h("strong", null, String(t.shared_links ?? 0)))));

    const cron = d.cron;
    const calls = d.reminder_calls || {};
    const cronOk = cron && cron.status === "succeeded" && (Date.now() - new Date(cron.at).getTime()) < 15 * 60000;
    out.append(h("section", { class: "card flush" }, h("div", { class: "card-head" }, h("h2", null, "Server health")),
      h("div", { class: "row" }, h("span", { class: "dot " + (cronOk ? "ok" : "bad") }, icon(cronOk ? "check" : "warn", "ico sm")),
        h("span", { class: "row-main" }, h("span", { class: "row-title" }, "Reminder timer"), h("span", { class: "row-sub" }, cron ? `Last run ${whenText(cron.at)} · ${cron.status}` : "Hasn't run yet"))),
      h("div", { class: "row" }, h("span", { class: "dot " + (calls.failed ? "bad" : "ok") }, icon(calls.failed ? "warn" : "check", "ico sm")),
        h("span", { class: "row-main" }, h("span", { class: "row-title" }, "Reminder server, last 24 h"), h("span", { class: "row-sub" }, `${calls.ok ?? 0} OK · ${calls.failed ?? 0} failed`)))));

    const list = h("section", { class: "card flush" }, h("div", { class: "card-head" }, h("h2", null, `Users (${d.users.length})`)));
    for (const u of [...d.users].sort((a, b) => String(b.last_sign_in_at || "").localeCompare(String(a.last_sign_in_at || "")))) {
      const st = u.stats || {};
      const tags = [u.is_me ? "You · admin" : null, isBlocked(u) ? "Blocked" : null].filter(Boolean).join(" · ");
      list.append(h("button", { type: "button", class: "row", on: { click: () => adminUserSheet(u) } },
        h("span", { class: "dot " + (isBlocked(u) ? "bad" : u.is_me ? "gold" : "neutral") }, (u.email || "?").charAt(0).toUpperCase()),
        h("span", { class: "row-main" }, h("span", { class: "row-title" }, u.email || "No email"), h("span", { class: "row-sub" }, [tags, `${st.transactions ?? 0} entries`, `seen ${whenText(u.last_sign_in_at)}`].filter(Boolean).join(" · "))),
        icon("fwd")));
    }
    out.append(list, h("p", { class: "hint" }, "To stop new people from creating accounts, turn off “Allow new users to sign up” in Supabase → Authentication → Sign In / Providers."));
    return out;
  }

  function adminUserSheet(u) {
    const st = u.stats || {};
    const body = h("div", { class: "form" });
    let confirmText = "";
    let busy = false;
    const act = async (action, extra, done) => {
      if (busy) return;
      busy = true; draw();
      try { await adminCall(action, { user_id: u.id, ...extra }); closeSheet(); toast(done); ADMIN.data = null; loadAdmin(); }
      catch (e) { busy = false; draw(); toast(e.message, "error"); }
    };
    const draw = () => {
      const fact = (label, value) => h("div", { class: "fact" }, h("small", null, label), h("strong", { class: "num" }, String(value)));
      const kids = [
        h("section", { class: "card" }, h("div", { class: "facts" },
          fact("Entries", st.transactions ?? 0), fact("Money accounts", st.accounts ?? 0),
          fact("Loan contacts", st.people ?? 0), fact("Reminders on", st.reminders ?? 0)),
          h("p", { class: "hint" }, `Joined ${new Date(u.created_at).toLocaleDateString(dateLocale(), { day: "numeric", month: "short", year: "numeric" })} · last sign-in ${whenText(u.last_sign_in_at)} · last entry ${whenText(st.last_entry)}`))
      ];
      if (u.is_me) {
        kids.push(h("p", { class: "hint" }, "This is your admin account. You can't block or delete it from here."));
      } else {
        kids.push(h("button", { type: "button", class: "btn alt", disabled: busy, on: { click: () => act(isBlocked(u) ? "unblock" : "block", {}, isBlocked(u) ? "Account unblocked." : "Account blocked. They can't sign in.") } },
          isBlocked(u) ? "Unblock account" : "Block account"));
        const input = h("input", { id: "f-admin-confirm", class: "input", autocomplete: "off", autocapitalize: "characters", placeholder: "Type DELETE to confirm", value: confirmText, "aria-label": "Type DELETE to confirm",
          on: { input: e => { confirmText = e.target.value; del.disabled = busy || confirmText.trim() !== "DELETE"; } } });
        const del = h("button", { type: "button", class: "btn danger sure", disabled: busy || confirmText.trim() !== "DELETE", on: { click: () => act("delete", { confirm: "DELETE" }, "Account and all its data deleted.") } }, icon("trash", "ico sm"), "Delete account and all data");
        kids.push(h("section", { class: "card" }, h("div", { class: "card-head" }, h("h2", null, "Danger zone")),
          h("p", { class: "hint" }, "Deleting removes this account and every entry, account, person, shared page and reminder it has. This can't be undone."),
          input, del));
      }
      keepFocus(() => body.replaceChildren(...kids.filter(Boolean)));
    };
    draw();
    openSheet(u.email || "User", body);
  }

  function closeSheet() {
    const o = document.querySelector(".overlay");
    if (!o) return;
    const sheet = o.querySelector(".sheet");
    if (sheet) { sheet.style.transition = ""; sheet.style.transform = ""; }
    o.classList.remove("open");
    document.body.classList.remove("locked");
    document.removeEventListener("keydown", onSheetKey);
    setTimeout(() => o.remove(), 320);
  }
  function onSheetKey(e) {
    if (e.key === "Escape") return closeSheet();
    if (e.target && e.target.closest && e.target.closest("input, textarea, select")) return;
    const pad = document.querySelector(".overlay.open .keypad");
    if (!pad || e.metaKey || e.ctrlKey || e.altKey) return;
    if (/^[0-9]$/.test(e.key)) { e.preventDefault(); pad.press(e.key); }
    else if (e.key === "." || e.key === ",") { e.preventDefault(); pad.press("."); }
    else if (e.key === "Backspace") { e.preventDefault(); pad.press("del"); }
  }
  function dragToClose(sheet) {
    const body = sheet.querySelector(".sheet-body");
    let y0 = null, dy = 0, t0 = 0, fromBody = false;
    sheet.addEventListener("touchstart", e => {
      y0 = null;
      if (e.touches.length !== 1) return;
      const inBody = body.contains(e.target);
      if (inBody && (body.scrollTop > 0 || e.target.closest("input, textarea, .keypad, .chips, .cat-grid"))) return;
      y0 = e.touches[0].clientY; dy = 0; t0 = Date.now(); fromBody = inBody;
    }, { passive: true });
    sheet.addEventListener("touchmove", e => {
      if (y0 == null) return;
      dy = e.touches[0].clientY - y0;
      if (dy <= 0) { if (fromBody) y0 = null; sheet.style.transform = ""; return; }
      if (fromBody && body.scrollTop > 0) { y0 = null; return; }
      e.preventDefault();
      sheet.style.transition = "none";
      sheet.style.transform = `translateY(${dy}px)`;
    }, { passive: false });
    const end = () => {
      if (y0 == null) return;
      const v = dy / Math.max(1, Date.now() - t0);
      sheet.style.transition = "";
      y0 = null;
      if (dy > 130 || (dy > 50 && v > 0.55)) closeSheet(); else sheet.style.transform = "";
    };
    sheet.addEventListener("touchend", end);
    sheet.addEventListener("touchcancel", end);
  }
  function openSheet(title, body, footer, opts = {}) {
    document.querySelectorAll(".overlay").forEach(o => o.remove());
    const sheet = h("section", { class: "sheet" + (opts.fill ? " fill" : ""), role: "dialog", "aria-modal": "true", "aria-label": title },
      h("div", { class: "grab", "aria-hidden": "true" }),
      h("header", { class: "sheet-head" }, h("h2", null, title), opts.headBtn || null, h("button", { type: "button", class: "icon-btn close", "aria-label": "Close", on: { click: closeSheet } }, icon("close"))),
      h("div", { class: "sheet-body" }, body),
      footer ? h("div", { class: "sheet-foot" }, footer) : null);
    const overlay = h("div", { class: "overlay", on: { click: e => { if (e.target === overlay) closeSheet(); } } }, sheet);
    document.body.append(overlay);
    document.body.classList.add("locked");
    document.addEventListener("keydown", onSheetKey);
    dragToClose(sheet);
    requestAnimationFrame(() => requestAnimationFrame(() => overlay.classList.add("open")));
  }

  const seg = (options, value, onPick, label) => {
    const idx = Math.max(0, options.findIndex(o => o[0] === value));
    const thumb = h("span", { class: "seg-thumb", "aria-hidden": "true", style: { width: `calc((100% - 6px) / ${options.length})`, transform: `translateX(${(LANG === "ar" ? -1 : 1) * idx * 100}%)` } });
    const el = h("div", { class: "seg", role: "group", "aria-label": label }, thumb,
      options.map(([k, l, disabled], i) => h("button", { type: "button", "aria-pressed": String(value === k), disabled: !!disabled, on: { click: e => {
        if (k === value) return;
        const live = e.currentTarget.parentElement || el;
        const liveThumb = live.querySelector(".seg-thumb") || thumb;
        liveThumb.style.transform = `translateX(${(LANG === "ar" ? -1 : 1) * i * 100}%)`;
        live.querySelectorAll("button").forEach((b, j) => b.setAttribute("aria-pressed", String(j === i)));
        setTimeout(() => onPick(k), 170);
      } } }, l)));
    return el;
  };

  const fmtTyped = v => {
    if (!v) return "0";
    const [i, d] = v.split(".");
    const whole = Number(i || "0").toLocaleString("en-US");
    return d !== undefined ? `${whole}.${d}` : whole;
  };

  function amountPad(cur, getV, setV, onChange) {
    const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", isBig(cur) ? "000" : curDec(cur) === 0 ? "00" : ".", "0", "del"];
    const press = k => {
      let v = getV();
      if (k === "del") v = v.slice(0, -1);
      else if (k === ".") { if (curDec(cur) === 0 || v.includes(".")) return; v = (v || "0") + "."; }
      else if (k === "00") { if (!v || v === "0" || v.length > 12) return; v += "00"; }
      else if (k === "000") { if (!v || v === "0" || v.length > 11) return; v += "000"; }
      else {
        const [i, d] = v.split(".");
        if (d !== undefined && d.length >= 2) return;
        if (d === undefined && (i || "").length >= 13) return;
        v = v === "0" ? k : v + k;
      }
      setV(v);
      onChange();
      const btn = pad.querySelector(`[data-k="${k}"]`);
      if (btn) { btn.classList.remove("hit"); void btn.offsetWidth; btn.classList.add("hit"); }
    };
    let hold = null;
    const pad = h("div", { class: "keypad", role: "group", "aria-label": "Number pad" },
      keys.map(k => h("button", {
        type: "button", class: "key" + (k === "del" ? " fn" : "") + (k === "000" ? " small" : ""), "data-k": k,
        "aria-label": k === "del" ? "Delete. Hold to clear" : k === "." ? "Decimal point" : k,
        on: {
          click: () => press(k),
          pointerdown: () => { if (k === "del") hold = setTimeout(() => { setV(""); onChange(); }, 550); },
          pointerup: () => clearTimeout(hold),
          pointerleave: () => clearTimeout(hold),
          contextmenu: e => e.preventDefault()
        }
      }, k === "del" ? icon("del") : k)));
    pad.press = press;
    return pad;
  }

  function amountDisplay(cur, kind) {
    const val = h("span", { class: "val" });
    const el = h("div", { class: "amount-display " + (kind || ""), "aria-live": "polite" }, h("span", { class: "cur" }, curSymbol(cur)), val);
    el.set = v => { val.textContent = fmtTyped(v); el.classList.toggle("empty", !v); el.classList.toggle("long", fmtTyped(v).length > 9); };
    return el;
  }

  function amountSheet({ title, cur, max, quick, verbFor, previewFor, onSave }) {
    const f = { amount: "", note: "" };
    const body = h("form", { class: "form", id: "amt-form", novalidate: true });
    const save = h("button", { type: "submit", class: "btn", form: "amt-form" });
    const display = amountDisplay(cur);
    const preview = h("p", { class: "preview num" });
    const refresh = () => {
      display.set(f.amount);
      const v = parseAmt(f.amount);
      const over = max != null && v && v > max;
      save.classList.toggle("waiting", !v || !!over);
      save.textContent = tr(verbFor(v));
      preview.textContent = !v ? " " : over ? `That's more than the ${fmt(max, cur, { show: true })} balance.` : previewFor(v);
      preview.classList.toggle("bad", !!over);
    };
    const pad = amountPad(cur, () => f.amount, v => { f.amount = v; }, refresh);
    const setQuick = n => { f.amount = String(n); refresh(); };
    body.append(display, preview,
      h("div", { class: "chips center" },
        quick.map(n => h("button", { type: "button", class: "chip", on: { click: () => setQuick(n) } }, fmt(n, cur, { show: true, compact: true }))),
        max ? h("button", { type: "button", class: "chip", on: { click: () => setQuick(max) } }, "All of it") : null),
      h("input", { id: "f-anote", class: "input", maxlength: "200", autocomplete: "off", enterkeyhint: "done", placeholder: "Add a note (optional)", "aria-label": "Note", on: { input: e => { f.note = e.target.value; } } }),
      pad);
    body.addEventListener("submit", ev => {
      ev.preventDefault();
      const v = parseAmt(f.amount);
      if (!v) return fail(null, "Type the amount on the number pad first.", display);
      if (max != null && v > max) return fail(null, `That's more than the ${fmt(max, cur, { show: true })} balance.`, display);
      onSave(v, f.note.trim().slice(0, 200) || null);
    });
    refresh();
    openSheet(title, body, save, { fill: true });
  }

  function txnSheet(x, preset) {
    const st = settings();
    const accounts = rows("accounts").filter(a => !a.archived || (x && (a.id === x.account_id || a.id === x.to_account_id))).sort(bySort);
    if (!accounts.length) { toast("Add an account first."); go("settings"); return; }
    const lastAcc = k => { const id = store.get("lastAcc:" + k, null); return acc(id) && !acc(id).archived ? id : null; };
    const f = x
      ? { kind: x.kind, amount: String(Number(x.amount)), account: x.account_id, to: x.to_account_id, toAmount: x.to_amount != null ? String(Number(x.to_amount)) : "", toTouched: true, category: x.category_id, date: x.occurred_on, note: x.note || "", repeat: false }
      : { kind: "expense", amount: "", account: null, to: null, toAmount: "", toTouched: false, category: null, date: today(), note: "", repeat: false };
    f.receipt = x ? x.receipt || null : null;
    f.blob = null;
    const receiptInput = h("input", { type: "file", accept: "image/*", hidden: true, on: { change: async e => {
      const file = e.target.files && e.target.files[0];
      e.target.value = "";
      if (!file) return;
      const blob = await shrinkImage(file);
      if (!blob) return toast("That photo couldn't be read. Try another one.", "error");
      f.blob = blob;
      draw();
    } } });
    if (!x && preset) Object.assign(f, preset);
    if (x && curDec(x.currency) === 0) f.amount = String(Math.round(Number(x.amount)));
    const usage = new Map();
    const cutoff = ymd(new Date(Date.now() - 90 * 864e5));
    for (const t of rows("transactions")) if (t.category_id && t.occurred_on >= cutoff) usage.set(t.category_id, (usage.get(t.category_id) || 0) + 1);
    const body = h("form", { class: "form txn", id: "txn-form", novalidate: true });
    const err = h("p", { class: "form-err", role: "alert" });
    const saveBtn = h("button", { type: "submit", class: "btn", form: "txn-form" });
    let armedDelete = false;
    let panel = x && x.kind !== "transfer" && !x.category_id ? "cat" : "pad";
    const bal = balances();

    const pick = () => {
      if (!f.account || !acc(f.account)) f.account = lastAcc(f.kind) || accounts[0].id;
      if (f.kind === "transfer" && (!f.to || f.to === f.account || !acc(f.to))) {
        const other = accounts.find(a => a.id !== f.account && a.kind === "savings") || accounts.find(a => a.id !== f.account);
        f.to = other ? other.id : null;
      }
      if (f.kind !== "transfer" && f.category && (!cat(f.category) || cat(f.category).kind !== f.kind)) f.category = null;
    };
    const convertFor = (amount, from, to) => roundCur(convert(amount, from, to), to);

    const draw = () => {
      pick();
      body.dataset.kind = f.kind;
      const a = acc(f.account);
      const cur = a.currency;
      if (curDec(cur) === 0 && f.amount.includes(".")) f.amount = f.amount.split(".")[0];
      const to = f.kind === "transfer" ? acc(f.to) : null;
      const cross = to && to.currency !== cur;
      const display = amountDisplay(cur, f.kind);
      const preview = h("p", { class: "preview num" });
      const toInput = cross ? h("input", { id: "f-toamt", class: "input num", inputmode: "decimal", autocomplete: "off", value: f.toAmount, on: { input: e => { f.toAmount = e.target.value; f.toTouched = true; } } }) : null;
      const refresh = () => {
        display.set(f.amount);
        const v = parseAmt(f.amount);
        if (v && cross && !f.toTouched) { f.toAmount = String(convertFor(v, cur, to.currency)); toInput.value = f.toAmount; }
        const needCat = f.kind !== "transfer" && !f.category;
        const conv = !v || cur === mainCur() ? "" : `≈ ${money(toMain(v, cur), { show: true })}`;
        preview.textContent = conv || "\u00a0";
        const catTile = body.querySelector(".ftile");
        if (catTile && f.kind !== "transfer") catTile.classList.toggle("attn", !!v && needCat);
        const verb = { expense: "Save expense", income: "Save income", transfer: "Move money" }[f.kind];
        saveBtn.textContent = !v ? tr("Type an amount") : needCat ? tr("Next: choose a category") : `${tr(verb)} · ${fmt(v, cur, { show: true })}`;
        saveBtn.className = "btn " + f.kind + (!v ? " waiting" : "");
      };
      const pad = amountPad(cur, () => f.amount, v => { f.amount = v; }, refresh);
      const yest = ymd(new Date(Date.now() - 864e5));
      const dateText = f.date === today() ? "Today" : f.date === yest ? "Yesterday" : dayLabel(f.date);
      const open = k => { panel = panel === k ? "pad" : k; draw(); if (panel === "more") { const n = document.getElementById("f-note"); if (n) n.focus(); } };
      const tile = (k, caption, value, lead, empty) => h("button", { type: "button", class: "ftile" + (empty ? " empty" : "") + (k === "cat" && empty && parseAmt(f.amount) ? " attn" : ""), "aria-expanded": String(panel === k), on: { click: () => open(k) } },
        lead || null,
        h("span", { class: "ftile-text" }, h("small", null, caption), h("strong", null, value)),
        icon("chev", "ico sm"));
      const chosen = f.kind !== "transfer" && f.category ? cat(f.category) : null;
      const extras = [f.note ? f.note : null, f.repeat ? "Monthly" : null, f.blob || f.receipt ? "Receipt" : null].filter(Boolean);
      const tiles = f.kind === "transfer"
        ? [tile("acc", "From", a.name, h("span", { class: "cur-tag" }, curTag(a.currency))),
          tile("to", "To", to ? to.name : "Choose", to ? h("span", { class: "cur-tag" }, curTag(to.currency)) : null, !to),
          tile("date", "Date", dateText, h("span", { class: "ftile-ico" }, icon("cal", "ico sm"))),
          tile("more", "Note", f.note || "Add a note", h("span", { class: "ftile-ico" }, icon("note", "ico sm")), !f.note)]
        : [tile("cat", "Category", chosen ? chosen.name : "Choose", chosen ? h("span", { class: "ftile-ico", style: { background: chosen.color, color: "#fff" } }, catGlyph(chosen, "ico sm")) : h("span", { class: "ftile-ico" }, icon("plus", "ico sm")), !chosen),
          tile("acc", f.kind === "income" ? "Into" : "Paid from", a.name, h("span", { class: "cur-tag" }, curTag(a.currency))),
          tile("date", "Date", dateText, h("span", { class: "ftile-ico" }, icon("cal", "ico sm"))),
          tile("more", "More", extras.length ? extras.join(" · ") : "Note and more", h("span", { class: "ftile-ico" }, icon("note", "ico sm")), !extras.length)];

      const accList = (value, onPick, exclude) => h("div", { class: "pick-list" }, accounts.filter(o => o.id !== exclude).map(o =>
        h("button", { type: "button", class: "pick-row", "aria-pressed": String(o.id === value), on: { click: () => onPick(o.id) } },
          h("span", { class: "cur-tag" }, curTag(o.currency)),
          h("span", { class: "pick-name" }, o.name),
          h("span", { class: "pick-end num" }, fmt(bal.get(o.id) || 0, o.currency, { whole: true })))));
      let panelEl;
      if (panel === "cat" && f.kind !== "transfer") {
        const cats = rows("categories").filter(c => c.kind === f.kind).sort((p, q) => (usage.get(q.id) || 0) - (usage.get(p.id) || 0) || bySort(p, q));
        panelEl = cats.length
          ? h("div", { class: "cat-grid", role: "group", "aria-label": "Category" }, cats.map(c => h("button", { type: "button", class: "cat-btn", "aria-pressed": String(c.id === f.category), on: { click: () => { f.category = c.id; panel = "pad"; draw(); } } },
            h("span", { class: "cat-ico", style: { background: c.color } }, catGlyph(c)), h("span", { class: "cat-name" }, c.name))))
          : h("p", { class: "hint" }, "No categories yet. Add some in Settings.");
      } else if (panel === "acc") {
        panelEl = accList(f.account, id => { f.account = id; f.toTouched = false; panel = "pad"; draw(); });
      } else if (panel === "to" && f.kind === "transfer") {
        panelEl = accList(f.to, id => { f.to = id; f.toTouched = false; panel = "pad"; draw(); }, f.account);
      } else if (panel === "date") {
        const day = (label, d) => h("button", { type: "button", class: "pick-row", "aria-pressed": String(f.date === d), on: { click: () => { f.date = d; panel = "pad"; draw(); } } }, h("span", { class: "pick-name" }, label), h("span", { class: "pick-end" }, dayLabel(d) === label ? "" : new Date(d + "T12:00:00").toLocaleDateString(dateLocale(), { weekday: "short", day: "numeric", month: "short" })));
        panelEl = h("div", { class: "pick-list" },
          day("Today", today()), day("Yesterday", yest),
          h("label", { class: "pick-row date-row", "aria-pressed": String(f.date !== today() && f.date !== yest) }, h("span", { class: "pick-name" }, "Another day"),
            h("input", { id: "f-date", class: "input", type: "date", value: f.date, max: ymd(new Date(Date.now() + 366 * 864e5)), "aria-label": "Pick another date", on: { change: e => { if (DATE_RE.test(e.target.value)) { f.date = e.target.value; panel = "pad"; draw(); } } } })));
      } else if (panel === "more") {
        panelEl = h("div", { class: "pick-list" },
          h("input", { id: "f-note", class: "input", maxlength: "200", autocomplete: "off", enterkeyhint: "done", placeholder: f.kind === "expense" ? "What was it?" : "Note", value: f.note, "aria-label": "Note", on: { input: e => { f.note = e.target.value; } } }),
          !x && f.kind !== "transfer" ? h("button", { type: "button", class: "pick-row", "aria-pressed": String(f.repeat), on: { click: () => { f.repeat = !f.repeat; draw(); } } }, h("span", { class: "ftile-ico" }, icon("repeat", "ico sm")), h("span", { class: "pick-name" }, "Repeat every month"), h("span", { class: "pick-end" }, f.repeat ? `Day ${Math.min(28, Number(f.date.slice(8)) || 1)}` : "Off")) : null,
          f.kind !== "transfer" ? h("button", { type: "button", class: "pick-row", "aria-pressed": String(!!(f.blob || f.receipt)), on: { click: () => {
            if (f.blob) { f.blob = null; return draw(); }
            if (f.receipt) return receiptViewer(f.receipt, () => { f.receipt = null; draw(); });
            receiptInput.click();
          } } }, h("span", { class: "ftile-ico" }, icon("cam", "ico sm")), h("span", { class: "pick-name" }, "Receipt photo"), h("span", { class: "pick-end" }, f.blob ? "Added · tap to remove" : f.receipt ? "View" : "Add")) : null,
          h("button", { type: "button", class: "btn alt", on: { click: () => { panel = "pad"; draw(); } } }, "Done"),
          receiptInput);
      } else {
        panel = "pad";
        panelEl = pad;
      }

      const kids = [
        seg([["expense", "Expense"], ["income", "Income"], ["transfer", "Transfer", accounts.length < 2]], f.kind, k => { f.kind = k; if (!x) f.account = null; f.toTouched = false; panel = "pad"; draw(); }, "Entry type"),
        h("button", { type: "button", class: "amount-tap", "aria-label": "Amount", on: { click: () => { if (panel !== "pad") { panel = "pad"; draw(); } } } }, display),
        preview,
        h("div", { class: "ftiles" }, tiles),
        cross ? h("label", { class: "field" }, h("span", null, `${to.name} receives (${curSymbol(to.currency)})`), toInput, h("span", { class: "hint" }, `At ${fmt(1, cur, { show: true })} = ${fmt(convert(1, cur, to.currency), to.currency, { show: true })}. Change it if you got a different rate.`)) : null,
        h("div", { class: "panel" + (panel === "pad" ? "" : " list") }, panelEl)
      ];
      keepFocus(() => body.replaceChildren(...kids.filter(Boolean)));
      refresh();
    };

    let saving = false;
    body.addEventListener("submit", async ev => {
      ev.preventDefault();
      if (saving) return;
      err.textContent = "";
      const a = acc(f.account);
      const amount = parseAmt(f.amount);
      if (!amount) { fail(null, "Type the amount on the number pad first.", body.querySelector(".amount-display")); return; }
      if (!DATE_RE.test(f.date)) { fail(err, "Pick a date."); return; }
      let toAmount = null;
      if (f.kind === "transfer") {
        const to = acc(f.to);
        if (!to || to.id === a.id) { fail(err, "Pick a different account to move money to."); return; }
        toAmount = to.currency === a.currency ? amount : parseAmt(f.toAmount);
        if (!toAmount) { fail(err, `Enter how much ${to.name} receives.`); return; }
      } else if (!f.category) { panel = "cat"; draw(); return; }
      let receiptNote = null;
      if (f.blob && f.kind !== "transfer") {
        if (!navigator.onLine) receiptNote = "Saved without the photo. Connect to the internet to attach it.";
        else {
          saving = true; saveBtn.disabled = true;
          const path = `${S.uid}/${crypto.randomUUID()}.jpg`;
          let up = null;
          try { up = await sb.storage.from("receipts").upload(path, f.blob, { contentType: "image/jpeg", cacheControl: "3600" }); } catch { up = { error: true }; }
          saving = false; saveBtn.disabled = false;
          if (up.error) receiptNote = "Saved, but the photo couldn't be uploaded. Open the entry to try again.";
          else { if (x && x.receipt) dropReceipt(x.receipt); f.receipt = path; }
        }
      }
      if (x && x.receipt && !f.receipt) dropReceipt(x.receipt);
      const sameRate = x && x.currency === a.currency && Number(x.rate) > 0;
      const row = {
        id: x ? x.id : newId(),
        kind: f.kind, amount: roundCur(amount, a.currency), currency: a.currency,
        rate: sameRate ? Number(x.rate) : rateOf(a.currency),
        account_id: a.id,
        to_account_id: f.kind === "transfer" ? f.to : null,
        to_amount: f.kind === "transfer" ? roundCur(toAmount, acc(f.to).currency) : null,
        category_id: f.kind === "transfer" ? null : f.category,
        note: f.note.trim().slice(0, 200) || null,
        occurred_on: f.date,
        receipt: f.kind === "transfer" ? null : f.receipt,
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
      const before = f.kind === "expense" ? budgetState(row.category_id) : null;
      putMany(items);
      closeSheet();
      const after = before ? budgetState(row.category_id) : null;
      const crossed = after && after.c
        ? (after.ratio >= 1 && before.ratio < 1 ? `${after.c.name} is now over its ${money(after.budget, { whole: true, show: true })} budget.`
          : after.ratio >= 0.8 && before.ratio < 0.8 ? `${after.c.name} has used ${Math.round(after.ratio * 100)}% of its budget.` : null)
        : null;
      const overPlan = after && after.left < 0 && before.left >= 0 ? "You're now over this month's plan." : null;
      if (receiptNote) return toast(receiptNote, "error");
      if (crossed || overPlan) return toast(crossed || overPlan, "error");
      toast(x ? "Entry updated." : `${{ expense: "Expense", income: "Income", transfer: "Transfer" }[f.kind]} saved · ${fmt(row.amount, row.currency, { show: true })}`);
    });

    draw();
    let headBtn = null;
    if (x) {
      headBtn = h("button", { type: "button", class: "head-del", "aria-label": "Delete entry", on: { click: () => {
        if (!armedDelete) { armedDelete = true; headBtn.classList.add("sure"); headBtn.replaceChildren(icon("trash", "ico sm"), "Delete?"); return; }
        removeRow("transactions", x); closeSheet(); toast("Entry deleted.");
      } } }, icon("trash", "ico sm"));
    }
    openSheet(x ? "Edit entry" : "New entry", body, saveBtn, { fill: true, headBtn });
  }

  function accountSheet(a) {
    const bal = balances();
    const used = a ? rows("transactions").some(x => x.account_id === a.id || x.to_account_id === a.id) : false;
    const current = a ? bal.get(a.id) || 0 : 0;
    const f = { name: a ? a.name : "", currency: a ? a.currency : mainCur(), kind: a ? a.kind : "bank", balance: a ? String(Math.round(current * 100) / 100) : "", rate: "" };
    const body = h("form", { class: "form", novalidate: true });
    const err = h("p", { class: "form-err", role: "alert" });
    let armedDelete = false;
    const draw = () => {
      const kids = [
        h("label", { class: "field" }, h("span", null, "Name"), h("input", { id: "f-aname", class: "input", maxlength: "60", autocomplete: "off", placeholder: "e.g. Cash, Bank Audi, Visa", value: f.name, on: { input: e => { f.name = e.target.value; } } })),
        h("div", { class: "field" }, h("span", { class: "label" }, "Currency"), curSelect("f-acur", f.currency, k => { f.currency = k; f.rate = ""; draw(); }, used), used ? h("p", { class: "hint" }, "The currency can't change once the account has entries.") : null),
        f.currency !== mainCur() ? h("label", { class: "field" }, h("span", null, `Exchange rate: 1 ${mainCur()} = ? ${f.currency}`), h("input", { id: "f-arate", class: "input num", inputmode: "decimal", autocomplete: "off", value: f.rate || String(+(rateOf(f.currency) / rateOf(mainCur())).toPrecision(6)), on: { input: e => { f.rate = e.target.value; } } }), h("p", { class: "hint" }, "Check this matches today's rate. You can change it later in Settings.")) : null,
        h("div", { class: "field" }, h("span", { class: "label" }, "Type"), h("div", { class: "chips wrap" }, Object.entries(KIND_LABEL).map(([k, l]) => h("button", { type: "button", class: "chip", "aria-pressed": String(f.kind === k), on: { click: () => { f.kind = k; draw(); } } }, l)))),
        h("p", { class: "hint" }, "Money moved into a Savings account counts toward your savings goal."),
        h("label", { class: "field" }, h("span", null, `Balance now (${curSymbol(f.currency)})`), h("input", { id: "f-abal", class: "input num", inputmode: "decimal", autocomplete: "off", placeholder: "0", value: f.balance, on: { input: e => { f.balance = e.target.value; } } })),
        err,
        h("button", { type: "submit", class: "btn" }, a ? "Save account" : "Add account")
      ];
      if (a) {
        kids.push(h("button", { type: "button", class: "btn alt", on: { click: () => { put("accounts", { ...a, archived: !a.archived }); closeSheet(); toast(a.archived ? "Account shown again." : "Account hidden. Its history stays."); } } }, a.archived ? "Show this account again" : "Hide this account"));
        if (!used) kids.push(h("button", { type: "button", class: "btn danger" + (armedDelete ? " sure" : ""), on: { click: () => { if (!armedDelete) { armedDelete = true; draw(); return; } removeRow("accounts", a); closeSheet(); toast("Account deleted."); } } }, armedDelete ? "Tap again to delete" : "Delete account"));
      }
      keepFocus(() => body.replaceChildren(...kids.filter(Boolean)));
    };
    body.addEventListener("submit", ev => {
      ev.preventDefault();
      const name = f.name.trim().replace(/\s+/g, " ");
      if (!name || name.length > 60) { fail(err, "Give the account a name."); return; }
      const wanted = parseSigned(f.balance);
      if (wanted === null) { fail(err, "Enter the balance as a number, like 250 or -40."); return; }
      const effect = a ? current - (Number(a.opening_balance) || 0) : 0;
      const opening = Math.round((wanted - effect) * 100) / 100;
      if (f.currency !== mainCur() && f.rate.trim()) {
        const x = parseRate(f.rate);
        if (!x) return fail(err, "Enter the exchange rate as a number, like 0.92 or 89500.");
        setRate(f.currency, x);
      }
      const maxSort = Math.max(-1, ...rows("accounts").map(r => r.sort || 0));
      put("accounts", a ? { ...a, name, currency: used ? a.currency : f.currency, kind: f.kind, opening_balance: opening } : { id: newId(), name, currency: f.currency, kind: f.kind, opening_balance: opening, sort: maxSort + 1, archived: false });
      closeSheet();
      toast(a ? "Account saved." : "Account added.");
    });
    draw();
    openSheet(a ? "Edit account" : "New account", body);
  }

  function categorySheet(c, kind) {
    const f = { name: c ? c.name : "", kind: c ? c.kind : kind || "expense", bucket: c ? groupOf(c) : groupOf(null), color: c ? c.color : COLORS[rows("categories").length % COLORS.length], budget: c && Number(c.budget) ? String(Number(c.budget)) : "" };
    const body = h("form", { class: "form", novalidate: true });
    const err = h("p", { class: "form-err", role: "alert" });
    let armedDelete = false;
    const draw = () => {
      const kids = [h("label", { class: "field" }, h("span", null, "Name"), h("input", { id: "f-cname", class: "input", maxlength: "40", autocomplete: "off", value: f.name, on: { input: e => { f.name = e.target.value; } } }))];
      if (!c) kids.push(seg([["expense", "Spending"], ["income", "Income"]], f.kind, k => { f.kind = k; draw(); }, "Category type"));
      if (f.kind === "expense") {
        kids.push(
          h("div", { class: "field" }, h("span", { class: "label" }, "Part of your plan"), h("div", { class: "chips wrap" }, planGroups().map(g => h("button", { type: "button", class: "chip", "aria-pressed": String(f.bucket === g.id), on: { click: () => { f.bucket = g.id; draw(); } } }, h("span", { class: "swatch", style: { background: g.color } }), `${g.name} · ${g.pct}%`)))),
          h("label", { class: "field" }, h("span", null, `Monthly budget in ${curSymbol(mainCur())} (optional)`), h("input", { id: "f-cbudget", class: "input num", inputmode: "decimal", autocomplete: "off", placeholder: "No budget", value: f.budget, on: { input: e => { f.budget = e.target.value; } } })));
      }
      kids.push(h("div", { class: "field" }, h("span", { class: "label" }, "Color"), h("div", { class: "swatches" }, COLORS.map(col => h("button", { type: "button", "aria-label": `Color ${col}`, "aria-pressed": String(f.color === col), style: { background: col }, on: { click: () => { f.color = col; draw(); } } })))), err, h("button", { type: "submit", class: "btn" }, c ? "Save category" : "Add category"));
      if (c) kids.push(h("button", { type: "button", class: "btn danger" + (armedDelete ? " sure" : ""), on: { click: () => { if (!armedDelete) { armedDelete = true; draw(); return; } removeRow("categories", c); closeSheet(); toast("Category deleted. Its entries show as Uncategorized."); } } }, armedDelete ? "Tap again to delete" : "Delete category"));
      keepFocus(() => body.replaceChildren(...kids.filter(Boolean)));
    };
    body.addEventListener("submit", ev => {
      ev.preventDefault();
      const name = f.name.trim().replace(/\s+/g, " ");
      if (!name || name.length > 40) { fail(err, "Give the category a name."); return; }
      let budget = null;
      if (f.kind === "expense" && f.budget.trim()) { budget = parseAmt(f.budget); if (!budget) { fail(err, "Enter the budget as a number, like 150."); return; } }
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
        h("label", { class: "field" }, h("span", null, `Amount (${curSymbol(r.currency)})`), h("input", { id: "f-ramt", class: "input num", inputmode: "decimal", autocomplete: "off", value: f.amount, on: { input: e => { f.amount = e.target.value; } } })),
        h("label", { class: "field" }, h("span", null, "Day of the month (1 to 28)"), h("input", { id: "f-rday", class: "input num", inputmode: "numeric", autocomplete: "off", value: f.day, on: { input: e => { f.day = e.target.value; } } })),
        h("label", { class: "field" }, h("span", null, "Note"), h("input", { id: "f-rnote", class: "input", maxlength: "200", autocomplete: "off", value: f.note, on: { input: e => { f.note = e.target.value; } } })),
        h("label", { class: "check" }, h("input", { id: "f-ractive", type: "checkbox", checked: f.active, on: { change: e => { f.active = e.target.checked; } } }), "Add it automatically every month"),
        err,
        h("button", { type: "submit", class: "btn" }, "Save"),
        h("button", { type: "button", class: "btn danger" + (armedDelete ? " sure" : ""), on: { click: () => { if (!armedDelete) { armedDelete = true; draw(); return; } removeRow("rules", r); closeSheet(); toast("Repeat stopped. Past entries are kept."); } } }, armedDelete ? "Tap again to stop it for good" : "Stop repeating")
      ];
      keepFocus(() => body.replaceChildren(...kids.filter(Boolean)));
    };
    body.addEventListener("submit", ev => {
      ev.preventDefault();
      const amount = parseAmt(f.amount);
      const day = Number(f.day);
      if (!amount) { fail(err, "Enter an amount."); return; }
      if (!Number.isInteger(day) || day < 1 || day > 28) { fail(err, "Pick a day from 1 to 28."); return; }
      let next = r.next_on;
      if (day !== r.day) {
        const t = today();
        const candidate = `${t.slice(0, 7)}-${pad(day)}`;
        next = candidate > t ? candidate : nextMonthDay(candidate, day);
      }
      put("rules", { ...r, amount: roundCur(amount, r.currency), day, note: f.note.trim().slice(0, 200) || null, active: f.active, next_on: next });
      closeSheet();
      toast("Changes saved.");
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

  const isStandalone = () => window.matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
  const pushSupported = () => "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
  const b64uToBytes = v => Uint8Array.from(atob(v.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((v.length + 3) % 4)), c => c.charCodeAt(0));
  const deviceId = () => {
    let id = null;
    try { id = localStorage.getItem("wallet:device"); } catch { id = null; }
    if (!id || !ID_RE.test(id)) { id = "dev-" + newId(); try { localStorage.setItem("wallet:device", id); } catch { } }
    return id;
  };
  const PUSH = { state: null, time: null, busy: false, loading: false };

  async function loadPushState() {
    if (PUSH.loading) return;
    PUSH.loading = true;
    let state = "off", time = PUSH.time || "21:00";
    try {
      if (!pushSupported()) state = /iPhone|iPad|iPod/.test(navigator.userAgent) && !isStandalone() ? "install" : "unsupported";
      else if (Notification.permission === "denied") state = "denied";
      else {
        const reg = await navigator.serviceWorker.getRegistration();
        const sub = reg ? await reg.pushManager.getSubscription() : null;
        const { data } = await sb.from("push_subs").select("enabled, remind_at").eq("id", deviceId()).maybeSingle();
        if (data && data.remind_at) time = String(data.remind_at).slice(0, 5);
        state = sub && data && data.enabled ? "on" : "off";
      }
    } catch { state = "off"; }
    PUSH.state = state; PUSH.time = time; PUSH.loading = false;
    if (S.view === "settings" || S.view === "home") render();
  }

  async function enablePush(time) {
    if (PUSH.busy) return;
    if (!navigator.onLine) return toast("Connect to the internet to turn on reminders.", "error");
    PUSH.busy = true; render();
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") { PUSH.state = perm === "denied" ? "denied" : "off"; return toast("Notifications weren't allowed. Turn them on in iPhone Settings → Notifications → Wallet.", "error"); }
      let { data: key, error } = await sb.rpc("push_public_key");
      if (error) return toast("Reminders are unavailable right now. Try again later.", "error");
      if (!key) {
        const init = await sb.functions.invoke("send-reminder", { body: { init: true } });
        if (init.error) {
          return toast("Reminders are unavailable right now. Try again later.", "error");
        }
        ({ data: key } = await sb.rpc("push_public_key"));
        if (!key) return toast("Reminders are unavailable right now. Try again later.", "error");
      }
      const reg = await navigator.serviceWorker.ready;
      let sub = await reg.pushManager.getSubscription();
      const appKey = b64uToBytes(key);
      try {
        if (!sub) sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: appKey });
      } catch {
        if (sub) await sub.unsubscribe();
        sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: appKey });
      }
      const j = sub.toJSON();
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Beirut";
      await sb.from("push_subs").delete().eq("endpoint", j.endpoint).neq("id", deviceId());
      const { error: e2 } = await sb.from("push_subs").upsert({ id: deviceId(), user_id: S.uid, endpoint: j.endpoint, p256dh: j.keys.p256dh, auth: j.keys.auth, remind_at: time, tz, enabled: true, last_sent: null }, { onConflict: "id" });
      if (e2) return toast("Couldn't save the reminder. Try again.", "error");
      PUSH.state = "on"; PUSH.time = time;
      toast(`Reminder set for ${time} every day.`);
    } catch {
      toast("Couldn't turn on notifications. Make sure My Wallet is opened from your Home Screen.", "error");
    } finally {
      PUSH.busy = false; render();
    }
  }

  async function disablePush() {
    if (PUSH.busy) return;
    PUSH.busy = true; render();
    try {
      await sb.from("push_subs").update({ enabled: false }).eq("id", deviceId());
      const reg = await navigator.serviceWorker.getRegistration();
      const sub = reg ? await reg.pushManager.getSubscription() : null;
      if (sub) await sub.unsubscribe();
      PUSH.state = "off";
      toast("Daily reminder turned off.");
    } catch {
      toast("Couldn't turn it off. Try again.", "error");
    } finally {
      PUSH.busy = false; render();
    }
  }

  async function setPushTime(time) {
    if (!/^\d{2}:\d{2}$/.test(time)) return;
    PUSH.time = time;
    if (PUSH.state !== "on") return;
    const { error } = await sb.from("push_subs").update({ remind_at: time, last_sent: null }).eq("id", deviceId());
    toast(error ? "Couldn't change the time. Try again." : `Reminder moved to ${time}.`, error ? "error" : undefined);
  }

  async function testPush() {
    if (PUSH.busy) return;
    PUSH.busy = true; render();
    try {
      const { data, error } = await sb.functions.invoke("send-reminder", { body: { test: true } });
      if (error || !data || !data.sent) toast("The test notification couldn't be sent. Try again in a moment.", "error");
      else toast("Test sent. It should arrive in a few seconds.");
    } catch {
      toast("The test notification couldn't be sent. Check your connection.", "error");
    } finally {
      PUSH.busy = false; render();
    }
  }

  const parseRate = raw => {
    const t = String(raw || "").replace(/[,\s]/g, "");
    if (!/^\d+(\.\d{1,8})?$/.test(t)) return null;
    const v = Number(t);
    return v > 0 && v < 1e9 ? v : null;
  };

  const setRate = (cur, x) => {
    const m = mainCur();
    if (cur === m || !(x > 0)) return;
    const rates = { ...settings().rates };
    if (cur === "USD") rates[m] = 1 / x; else rates[cur] = x * rateOf(m);
    saveSettings({ rates });
  };

  function setMainCurrency(next) {
    const old = mainCur();
    if (!CUR_RE.test(next) || next === old) return;
    const factor = rateOf(next) / rateOf(old);
    const items = rows("categories").filter(c => Number(c.budget) > 0).map(c => ({ t: "categories", r: { ...c, budget: roundCur(Number(c.budget) * factor, next) } }));
    const st = settings();
    items.push({ t: "settings", r: { id: settingsId(), data: { ...storedSettings(), main: next, rates: st.rates, income: st.income ? roundCur(st.income * factor, next) : 0, incomeByMonth: Object.fromEntries(Object.entries(st.incomeByMonth).map(([k, v]) => [k, roundCur(v * factor, next)])), incomeSteps: Object.fromEntries(Object.entries(st.incomeSteps).map(([k, v]) => [k, roundCur(v * factor, next)])) } } });
    putMany(items);
    toast(`Totals are now shown in ${next}. Budgets and income were converted.`);
  }

  function curSelect(id, value, onPick, disabled) {
    const used = usedCurrencies();
    const opt = c => h("option", { value: c, selected: c === value }, `${c} · ${curInfo(c).name}`);
    const others = Object.keys(CURRENCIES).filter(c => !used.includes(c));
    const sel = h("select", { id, class: "input cur-select", disabled: !!disabled, "aria-label": "Currency", on: { change: e => onPick(e.target.value) } },
      h("optgroup", { label: "Your currencies" }, used.map(opt)),
      others.length ? h("optgroup", { label: "All currencies" }, others.map(opt)) : null);
    sel.value = value;
    return sel;
  }

  function currencyGroup(group) {
    const m = mainCur();
    const st = settings();
    const manual = st.manualRates.filter(c => usedCurrencies().includes(c));
    const rateRows = usedCurrencies().filter(c => c !== m).map(c => {
      const shown = +(rateOf(c) / rateOf(m)).toPrecision(6);
      const input = h("input", { id: `s-rate-${c}`, class: "input num rate-input", inputmode: "decimal", autocomplete: "off", value: shown.toLocaleString("en-US", { maximumFractionDigits: 6 }), "aria-label": `${c} for 1 ${m}`,
        on: { change: e => { const x = parseRate(e.target.value); if (!x) { toast("Enter a rate like 0.92 or 89,500.", "error"); e.target.value = shown.toLocaleString("en-US", { maximumFractionDigits: 6 }); return; } setRate(c, x); saveSettings({ manualRates: [...new Set([...settings().manualRates, c])] }); toast(`Rate saved: 1 ${m} = ${x.toLocaleString("en-US", { maximumFractionDigits: 6 })} ${c}.`); } } });
      return h("div", { class: "row" }, h("span", { class: "dot neutral" }, curTag(c)), h("span", { class: "row-main" }, h("span", { class: "row-title" }, `1 ${m} =`), h("span", { class: "row-sub" }, st.autoRates && !st.manualRates.includes(c) ? "Automatic" : "Set by you")), input, h("span", { class: "rate-code" }, c));
    });
    return group("Currency",
      h("div", { class: "row" }, h("span", { class: "dot gold" }, curTag(m)), h("span", { class: "row-main" }, h("span", { class: "row-title" }, "Main currency"), h("span", { class: "row-sub wrap" }, "Totals, budgets and insights are shown in it")), curSelect("s-main", m, setMainCurrency)),
      ...rateRows,
      h("div", { class: "row" }, h("span", { class: "dot neutral" }, icon("sync", "ico sm")),
        h("span", { class: "row-main" }, h("span", { class: "row-title" }, "Update rates automatically"), h("span", { class: "row-sub wrap" }, st.autoRates ? (st.ratesAt ? `Last updated ${dayLabel(st.ratesAt).toLowerCase()}` : "Once a day, from a public rate service") : "Rates stay as you set them")),
        h("button", { type: "button", class: "switch", role: "switch", "aria-checked": String(st.autoRates), "aria-label": "Update rates automatically", on: { click: () => { saveSettings({ autoRates: !st.autoRates, ratesAt: "" }); if (!st.autoRates) refreshRates(true); } } }, h("span", { class: "knob" }))),
      st.autoRates && manual.length ? h("button", { type: "button", class: "row-btn", on: { click: () => { saveSettings({ manualRates: [], ratesAt: "" }); refreshRates(true).then(ok => toast(ok ? "Rates updated." : "Rates will update when you're online.")); } } }, `Use automatic rates for ${manual.join(", ")}`) : null,
      h("p", { class: "row-sub", style: { padding: "4px 16px 14px", whiteSpace: "normal" } }, "Add an account in any currency from Accounts below. A rate you type yourself stays until you switch it back to automatic."));
  }

  function reminderGroup(group) {
    if (PUSH.state === null) loadPushState();
    const st = PUSH.state;
    const on = st === "on";
    const time = PUSH.time || "21:00";
    const sw = h("button", { type: "button", class: "switch", role: "switch", "aria-checked": String(on), "aria-label": "Daily reminder", disabled: PUSH.busy || st === null || st === "install" || st === "unsupported",
      on: { click: () => on ? disablePush() : enablePush(document.getElementById("s-remind").value || time) } }, h("span", { class: "knob" }));
    const timeIn = h("input", { id: "s-remind", class: "input time-input", type: "time", value: time, "aria-label": "Reminder time", on: { change: e => setPushTime(e.target.value) } });
    const sub = st === null ? "Checking…"
      : on ? `Every day at ${time}. Tells you if nothing is logged yet.`
      : st === "install" ? "Add My Wallet to your Home Screen first, then open it from there."
      : st === "denied" ? "Notifications are blocked. Allow them in iPhone Settings → Notifications → Wallet."
      : st === "unsupported" ? "This browser can't show notifications."
      : "Get a notification to log what you spent.";
    return group("Daily reminder",
      h("div", { class: "row" }, h("span", { class: "dot gold" }, icon("bell", "ico sm")), h("span", { class: "row-main" }, h("span", { class: "row-title" }, "Remind me every day"), h("span", { class: "row-sub wrap" }, sub)), sw),
      h("div", { class: "row" }, h("span", { class: "dot neutral" }, icon("cal", "ico sm")), h("span", { class: "row-main" }, h("span", { class: "row-title" }, "Time")), timeIn),
      on ? h("button", { type: "button", class: "row-btn", disabled: PUSH.busy, on: { click: testPush } }, PUSH.busy ? "Sending…" : "Send a test notification") : null);
  }

  function exportCsv() {
    const cell = v => {
      let s = v == null ? "" : String(v);
      if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
      return `"${s.replace(/"/g, '""')}"`;
    };
    const lines = [["Date", "Type", "Amount", "Currency", `In ${mainCur()}`, "Account", "To account", "Received", "Category", "Plan group", "Note"].map(cell).join(",")];
    for (const x of rows("transactions").sort(byRecent)) {
      const c = cat(x.category_id), a = acc(x.account_id), b = acc(x.to_account_id);
      lines.push([x.occurred_on, x.kind, x.amount, x.currency, Math.round(txMain(x) * 100) / 100, a && a.name, b && b.name, x.to_amount, c && c.name, c && c.bucket, x.note].map(cell).join(","));
    }
    shareFile(`wallet-${today()}.csv`, "﻿" + lines.join("\r\n"), "text/csv");
  }

  function exportBackup() {
    const data = { app: "my-wallet", version: 1, exported_at: new Date().toISOString() };
    for (const t of TABLES) data[t] = rows(t).map(r => clean(t, r)).map(({ user_id, ...rest }) => rest);
    shareFile(`wallet-backup-${today()}.json`, JSON.stringify(data, null, 1), "application/json");
  }

  const VALID = {
    accounts: r => typeof r.name === "string" && r.name.length > 0 && r.name.length <= 60 && CUR_RE.test(String(r.currency)) && Object.keys(KIND_LABEL).includes(r.kind),
    categories: r => typeof r.name === "string" && r.name.length > 0 && r.name.length <= 40 && ["expense", "income"].includes(r.kind),
    transactions: r => ["expense", "income", "transfer"].includes(r.kind) && Number(r.amount) > 0 && CUR_RE.test(String(r.currency)) && Number(r.rate) > 0 && DATE_RE.test(String(r.occurred_on)) && typeof r.account_id === "string",
    rules: r => ["expense", "income"].includes(r.kind) && Number(r.amount) > 0 && CUR_RE.test(String(r.currency)) && Number.isInteger(r.day) && r.day >= 1 && r.day <= 28 && DATE_RE.test(String(r.next_on)),
    settings: r => !!r.data && typeof r.data === "object" && !Array.isArray(r.data),
    people: r => typeof r.name === "string" && r.name.length > 0 && r.name.length <= 40 && ["owes_me", "i_owe"].includes(r.direction) && CUR_RE.test(String(r.currency)) && (r.phone == null || PHONE_RE.test(r.phone)) && (r.share_token == null || TOKEN_RE.test(r.share_token)),
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
          if (t === "transactions" && row.receipt && !String(row.receipt).startsWith(S.uid + "/")) row.receipt = null;
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

  const passField = (id, placeholder, auto) => {
    const input = h("input", { id, class: "input", type: "password", autocomplete: auto, maxlength: "72", placeholder, "aria-label": placeholder });
    return input;
  };

  function renderNewPassword() {
    shell = null;
    const err = h("p", { class: "form-err", role: "alert" });
    const input = passField("np-pass", "New password (10+ characters)", "new-password");
    const btn = h("button", { class: "btn login-go", type: "submit" }, "Save new password");
    const panel = h("form", { class: "login-panel solo", novalidate: true },
      h("div", { class: "login-title" }, h("img", { class: "login-logo", src: "icons/icon-192.png", alt: "" }), h("h2", null, "Choose a new password"), h("p", null, S.email)),
      h("div", { class: "login-fields" }, h("label", { class: "login-field", for: "np-pass" }, icon("lock", "ico"), input)),
      err, btn);
    panel.addEventListener("submit", async ev => {
      ev.preventDefault();
      const v = input.value;
      if (v.length < 10) return fail(err, "Use a password of at least 10 characters.", panel.querySelector(".login-field"));
      btn.disabled = true;
      const { error } = await sb.auth.updateUser({ password: v });
      btn.disabled = false;
      if (error) return fail(err, /same|different/i.test(error.message || "") ? "Choose a password you haven't used here before." : /weak|pwned/i.test(error.message || "") ? "That password is too weak. Try a longer one." : "Couldn't save the password. Request a new link and try again.");
      if (VAULT.raw) await rewrapVault("wrapped_pw", v);
      else { const unlocked = await unlockVault(v); if (unlocked.need) S.unlockNeed = "recovery"; }
      toast("Password changed. You're signed in.");
      render();
      recoverySheet();
      sync();
    });
    root.replaceChildren(h("div", { class: "login" }, panel));
    input.focus();
  }

  function passwordSheet() {
    const err = h("p", { class: "form-err", role: "alert" });
    const cur = passField("cp-cur", "Current password", "current-password");
    const next = passField("cp-new", "New password (10+ characters)", "new-password");
    const btn = h("button", { type: "submit", class: "btn", form: "cp-form" }, "Change password");
    const body = h("form", { class: "form", id: "cp-form", novalidate: true },
      h("label", { class: "field" }, h("span", null, "Current password"), cur),
      h("label", { class: "field" }, h("span", null, "New password"), next),
      err);
    body.addEventListener("submit", async ev => {
      ev.preventDefault();
      if (!navigator.onLine) return fail(err, "Connect to the internet to change your password.");
      if (!cur.value) return fail(err, "Enter your current password.", cur);
      if (next.value.length < 10) return fail(err, "Use a new password of at least 10 characters.", next);
      if (next.value === cur.value) return fail(err, "Choose a password different from the current one.", next);
      btn.disabled = true;
      const check = await sb.auth.signInWithPassword({ email: S.email, password: cur.value });
      if (check.error || !check.data.session) { btn.disabled = false; return fail(err, check.error && check.error.status === 429 ? "Too many attempts. Wait a minute and try again." : "The current password isn't correct.", cur); }
      setSession(check.data.session);
      const { error } = await sb.auth.updateUser({ password: next.value });
      btn.disabled = false;
      if (error) return fail(err, /weak|pwned/i.test(error.message || "") ? "That password is too weak. Try a longer one." : "Couldn't change the password. Try again.");
      if (!(await rewrapVault("wrapped_pw", next.value))) { closeSheet(); return toast("Password changed, but your data key wasn't updated. Change the password again while online.", "error"); }
      closeSheet();
      toast("Password changed.");
    });
    openSheet("Change password", body, btn);
  }

  const LOCK = { el: null, hiddenAt: 0, busy: false };
  const lockSupported = () => !!(window.PublicKeyCredential && navigator.credentials && window.isSecureContext);
  const lockCfg = () => { const c = store.get("lock", null); return c && typeof c.id === "string" ? c : null; };
  const b64 = buf => btoa(String.fromCharCode(...new Uint8Array(buf)));
  const unb64 = str => Uint8Array.from(atob(str), c => c.charCodeAt(0));

  async function verifyDevice() {
    const cfg = lockCfg();
    if (!cfg) return true;
    try {
      const got = await navigator.credentials.get({ publicKey: { challenge: crypto.getRandomValues(new Uint8Array(32)), rpId: location.hostname, allowCredentials: [{ type: "public-key", id: unb64(cfg.id), transports: ["internal"] }], userVerification: "required", timeout: 60000 } });
      return !!got;
    } catch { return false; }
  }

  async function enableLock() {
    if (!lockSupported()) return toast("This device can't lock the app with Face ID or a passcode.", "error");
    try {
      const cred = await navigator.credentials.create({ publicKey: {
        challenge: crypto.getRandomValues(new Uint8Array(32)),
        rp: { name: "My Wallet", id: location.hostname },
        user: { id: new TextEncoder().encode(S.uid).slice(0, 64), name: S.email || "My Wallet", displayName: "My Wallet" },
        pubKeyCredParams: [{ type: "public-key", alg: -7 }, { type: "public-key", alg: -257 }],
        authenticatorSelection: { authenticatorAttachment: "platform", userVerification: "required", residentKey: "discouraged" },
        timeout: 60000, attestation: "none" } });
      if (!cred) throw new Error("none");
      store.set("lock", { id: b64(cred.rawId) });
      toast("App lock is on. You'll be asked to unlock when you open the app.");
    } catch {
      toast("App lock wasn't turned on.", "error");
    }
    render();
  }

  async function disableLock() {
    if (!(await verifyDevice())) return toast("Unlock first to turn off the app lock.", "error");
    try { localStorage.removeItem(lsKey("lock")); } catch { }
    toast("App lock turned off.");
    render();
  }

  function showLock() {
    if (LOCK.el || !lockSupported()) return;
    const tryUnlock = async () => {
      if (LOCK.busy) return;
      LOCK.busy = true;
      const ok = await verifyDevice();
      LOCK.busy = false;
      if (!ok) return;
      LOCK.el.remove(); LOCK.el = null; LOCK.hiddenAt = 0;
    };
    LOCK.el = h("div", { class: "lock", role: "dialog", "aria-modal": "true", "aria-label": "My Wallet is locked" },
      h("img", { class: "login-logo", src: "icons/icon-192.png", alt: "" }),
      h("h2", null, "My Wallet is locked"),
      h("p", null, "Unlock with Face ID, Touch ID or your device passcode."),
      h("button", { type: "button", class: "btn", on: { click: tryUnlock } }, icon("lock", "ico"), "Unlock"),
      h("button", { type: "button", class: "link-btn", on: { click: () => { LOCK.el.remove(); LOCK.el = null; signOut(); } } }, "Sign out instead"));
    document.querySelectorAll(".overlay").forEach(o => o.remove());
    document.body.classList.remove("locked");
    document.body.append(LOCK.el);
    tryUnlock();
  }

  function privacySheet() {
    const part = (t, d) => h("div", { class: "prose-part" }, h("h3", null, t), h("p", null, d));
    openSheet("Privacy and your data", h("div", { class: "prose" },
      part("What is stored", "Your accounts, entries, categories, plan, the people you track and their balances, your settings, and your email address for signing in. Nothing else is collected. There are no ads and no tracking."),
      part("Where it lives", "Your data is kept in the app's database and a copy stays on this device so the app works offline. It travels encrypted between your device and the server."),
      part("Who can see it", "Only you. Names, amounts, notes, balances, your plan and your settings are encrypted on your device with a key made from your password before they are saved, so the database holds only unreadable text. The app's administrator cannot read them and sees only your email, sign-in dates and record counts."),
      part("What is not encrypted", "Dates, currencies, which entry belongs to which account or category (as codes, not names) and receipt photos. Receipt photos are private to your account but stored as normal images."),
      part("If you forget your password", "You can reset it by email and keep your data, because the server holds a locked copy of your key that it releases only to your signed-in account. For maximum privacy, turn off “Reset password by email” in Security: the server then keeps no copy, and only your recovery key can restore your data."),
      part("Private pages", "A private page you create for a person shows only that person's balance and history, to anyone who has the link. Turn the link off at any time and it stops working."),
      part("Receipts and exchange rates", "Receipt photos are stored privately under your account and only you can open them. Exchange rates come from a public rate service; nothing about you is sent to it."),
      part("Notifications", "If you turn on the daily reminder, this device's notification address is stored so the reminder can be delivered. Turning it off removes it."),
      part("Your control", "Export your entries or a full backup at any time from Settings. Deleting your account removes it and all of its data permanently.")));
  }

  function deleteAccountSheet() {
    const err = h("p", { class: "form-err", role: "alert" });
    const pass = passField("da-pass", "Your password", "current-password");
    const word = h("input", { id: "da-word", class: "input", autocomplete: "off", autocapitalize: "characters", spellcheck: "false", placeholder: "DELETE", "aria-label": "Type DELETE to confirm" });
    const btn = h("button", { type: "submit", class: "btn danger sure", form: "da-form", disabled: true }, "Delete my account and all data");
    word.addEventListener("input", () => { btn.disabled = word.value.trim().toUpperCase() !== "DELETE"; });
    const body = h("form", { class: "form", id: "da-form", novalidate: true },
      h("p", { class: "hint" }, "This permanently removes your account and every entry, account, person, private page and reminder in it. It can't be undone. Download a backup first if you want to keep a copy."),
      isOAuth() ? null : h("label", { class: "field" }, h("span", null, "Password"), pass),
      h("label", { class: "field" }, h("span", null, "Type DELETE to confirm"), word),
      err);
    body.addEventListener("submit", async ev => {
      ev.preventDefault();
      if (!navigator.onLine) return fail(err, "Connect to the internet to delete your account.");
      if (!isOAuth() && !pass.value) return fail(err, "Enter your password.", pass);
      btn.disabled = true;
      const res = await sb.functions.invoke("account", { body: { action: "delete", confirm: "DELETE", password: pass.value } });
      if (res.error) {
        btn.disabled = false;
        let msg = "Couldn't delete the account. Check your connection and try again.";
        try { const r = res.error.context; if (r && typeof r.json === "function") { const j = await r.json(); if (j && j.error) msg = j.error; } } catch { }
        return fail(err, msg);
      }
      closeSheet();
      await signOut();
      toast("Your account and all its data were deleted.");
    });
    openSheet("Delete account", body, btn);
  }

  const VAULT = { key: null, raw: null };
  const te = new TextEncoder(), td = new TextDecoder();
  const rand = n => crypto.getRandomValues(new Uint8Array(n));
  const b64u8 = u8 => { let s = ""; for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode(...u8.subarray(i, i + 0x8000)); return btoa(s); };
  const toUrl = s => s.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  const fromUrl = s => s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4);
  const aesKey = raw => crypto.subtle.importKey("raw", raw, "AES-GCM", false, ["encrypt", "decrypt"]);
  async function sealWith(key, obj) {
    const iv = rand(12);
    const ct = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, te.encode(JSON.stringify(obj))));
    const out = new Uint8Array(12 + ct.length);
    out.set(iv); out.set(ct, 12);
    return "v1." + b64u8(out);
  }
  async function openWith(key, str) {
    if (typeof str !== "string" || !str.startsWith("v1.")) throw new Error("format");
    const raw = unb64(str.slice(3));
    return JSON.parse(td.decode(await crypto.subtle.decrypt({ name: "AES-GCM", iv: raw.subarray(0, 12) }, key, raw.subarray(12))));
  }
  async function kdf(secret, salt) {
    const base = await crypto.subtle.importKey("raw", te.encode(secret), "PBKDF2", false, ["deriveKey"]);
    return crypto.subtle.deriveKey({ name: "PBKDF2", hash: "SHA-256", salt: unb64(salt), iterations: 310000 }, base, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
  }
  const SECRET = {
    accounts: { name: "•", opening_balance: 0 },
    categories: { name: "•", budget: null },
    transactions: { amount: 1, to_amount: null, rate: 1, note: null },
    rules: { amount: 1, note: null },
    settings: { data: {} },
    people: { name: "•", phone: null },
    loan_entries: { amount: 1, note: null }
  };
  const shareKeys = new Map();
  const shareKey = async skey => {
    if (!shareKeys.has(skey)) shareKeys.set(skey, await aesKey(unb64(fromUrl(skey))));
    return shareKeys.get(skey);
  };
  async function sealRow(t, row, src) {
    const secret = {};
    for (const [k, placeholder] of Object.entries(SECRET[t])) {
      secret[k] = row[k];
      row[k] = k === "to_amount" && row[k] != null ? 1 : placeholder;
    }
    row.senc = undefined;
    if (t === "people") {
      secret.skey = src.skey || null;
      row.senc = !src.deleted_at && src.share_token && src.skey ? await sealWith(await shareKey(src.skey), { name: secret.name, currency: row.currency, direction: row.direction, from: settings().name || "" }) : null;
    }
    if (t === "loan_entries") {
      const p = S.data.people.get(src.person_id);
      row.senc = !src.deleted_at && p && p.share_token && p.skey ? await sealWith(await shareKey(p.skey), { amount: secret.amount, note: secret.note, date: row.occurred_on }) : null;
    }
    if (row.senc === undefined) delete row.senc;
    row.enc = await sealWith(VAULT.key, secret);
    return row;
  }
  async function openRow(t, r) {
    if (!r.enc) { delete r.enc; delete r.senc; return true; }
    try {
      const secret = await openWith(VAULT.key, r.enc);
      for (const k of Object.keys(SECRET[t])) if (k in secret) r[k] = secret[k];
      if (t === "people") r.skey = typeof secret.skey === "string" ? secret.skey : null;
      delete r.enc; delete r.senc;
      return true;
    } catch { return false; }
  }
  async function setVaultKey(raw) {
    VAULT.raw = raw;
    VAULT.key = await aesKey(raw);
    store.set("dk", b64u8(raw));
  }
  async function loadVaultKey() {
    VAULT.key = null; VAULT.raw = null;
    const saved = store.get("dk", null);
    if (typeof saved !== "string") return;
    try { const raw = unb64(saved); if (raw.length === 32) { VAULT.raw = raw; VAULT.key = await aesKey(raw); } } catch { VAULT.key = null; VAULT.raw = null; }
  }
  const newRecovery = () => { const a = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; return [...rand(24)].map(x => a[x % 32]).join("").replace(/(.{4})/g, "$1-").slice(0, -1); };
  const normRecovery = s => String(s || "").toUpperCase().replace(/[^A-Z2-9]/g, "");
  const wrapKey = async (secret, salt) => sealWith(await kdf(secret, salt), { k: b64u8(VAULT.raw) });

  async function escrow(action, extra) {
    try {
      const res = await sb.functions.invoke("account", { body: { action, ...(extra || {}) } });
      return res.error ? null : res.data || null;
    } catch { return null; }
  }
  async function ensureEscrow() {
    if (!VAULT.raw || !navigator.onLine || settings().strictVault || store.get("escrow", 0) === 1) return;
    const res = await escrow("escrow-put", { k: b64u8(VAULT.raw) });
    if (res && res.ok) store.set("escrow", 1);
  }

  async function unlockVault(password, recovery) {
    let row = null;
    try {
      const res = await sb.from("vault").select("salt, wrapped_pw, wrapped_rc").eq("user_id", S.uid).maybeSingle();
      if (res.error) return { error: "network" };
      row = res.data;
    } catch { return { error: "network" }; }
    if (!row) {
      const raw = rand(32);
      const salt = b64u8(rand(16));
      const code = newRecovery();
      const k = b64u8(raw);
      const wrapped_rc = await sealWith(await kdf(normRecovery(code), salt), { k });
      const ins = await sb.from("vault").insert({ user_id: S.uid, salt, wrapped_pw: password ? await sealWith(await kdf(password, salt), { k }) : wrapped_rc, wrapped_rc });
      if (ins.error) return ins.error.code === "23505" ? unlockVault(password, recovery) : { error: "network" };
      await setVaultKey(raw);
      S.recoveryCode = code;
      if (!password) await ensureEscrow();
      S.fullPull = true; S.last = {};
      try { await pull(); } catch { }
      const items = [];
      for (const t of TABLES) for (const r of S.data[t].values()) items.push({ t, r });
      if (items.length) putMany(items);
      return { ok: true };
    }
    let raw = null;
    if (password) { try { raw = unb64((await openWith(await kdf(password, row.salt), row.wrapped_pw)).k); } catch { raw = null; } }
    if (!raw && !recovery) {
      const kept = await escrow("escrow-get");
      if (kept && typeof kept.k === "string") {
        try { const got = unb64(kept.k); if (got.length === 32) { raw = got; VAULT.raw = raw; if (password) await sb.from("vault").update({ wrapped_pw: await wrapKey(password, row.salt), updated_at: new Date().toISOString() }).eq("user_id", S.uid); } } catch { raw = null; }
      }
    }
    if (!raw && recovery) {
      try { raw = unb64((await openWith(await kdf(normRecovery(recovery), row.salt), row.wrapped_rc)).k); } catch { return { error: "recovery" }; }
      VAULT.raw = raw;
      if (password) {
        const up = await sb.from("vault").update({ wrapped_pw: await wrapKey(password, row.salt), updated_at: new Date().toISOString() }).eq("user_id", S.uid);
        if (up.error) return { error: "network" };
      }
    }
    if (!raw || raw.length !== 32) return { need: "recovery" };
    await setVaultKey(raw);
    S.fullPull = true; S.last = {};
    return { ok: true };
  }
  async function rewrapVault(field, secret) {
    if (!VAULT.raw) return false;
    try {
      const { data: row } = await sb.from("vault").select("salt").eq("user_id", S.uid).maybeSingle();
      if (!row) return false;
      const { error } = await sb.from("vault").update({ [field]: await wrapKey(secret, row.salt), updated_at: new Date().toISOString() }).eq("user_id", S.uid);
      return !error;
    } catch { return false; }
  }

  function recoverySheet() {
    const code = S.recoveryCode;
    if (!code) return;
    S.recoveryCode = null;
    openSheet("Save your recovery key", h("div", { class: "form" },
      h("p", { class: "hint" }, "Your data is now encrypted, so nobody else can read it in the database. If you forget your password you can reset it by email. This key is a second way to get your data back, and the only way if you turn off reset by email in Settings. Keep it somewhere safe."),
      h("p", { class: "recovery-code num" }, code),
      h("button", { type: "button", class: "btn alt", on: { click: () => copyText(code) } }, "Copy the key")),
      h("button", { type: "button", class: "btn", on: { click: () => { closeSheet(); setTimeout(render, 400); } } }, "I've saved it"));
  }
  async function newRecoveryKey() {
    if (!navigator.onLine) return toast("Connect to the internet to create a recovery key.", "error");
    const code = newRecovery();
    if (!(await rewrapVault("wrapped_rc", normRecovery(code)))) return toast("Couldn't create a recovery key. Try again.", "error");
    S.recoveryCode = code;
    recoverySheet();
  }

  function renderUnlock() {
    shell = null;
    const oauth = isOAuth();
    const needRecovery = S.unlockNeed === "recovery" || oauth;
    const err = h("p", { class: "form-err", role: "alert" });
    const pass = passField("ul-pass", "Password", "current-password");
    const rec = needRecovery ? h("input", { id: "ul-rec", class: "input", autocomplete: "off", autocapitalize: "characters", spellcheck: "false", placeholder: "XXXX-XXXX-XXXX-XXXX-XXXX-XXXX", "aria-label": "Recovery key" }) : null;
    const btn = h("button", { class: "btn login-go", type: "submit" }, "Unlock");
    const panel = h("form", { class: "login-panel solo", novalidate: true },
      h("div", { class: "login-title" }, h("img", { class: "login-logo", src: "icons/icon-192.png", alt: "" }), h("h2", null, "Unlock your data"),
        h("p", null, oauth ? "Reset by email is turned off for this account, so your recovery key is needed to open your encrypted data on this device." : needRecovery ? "Your password was changed by email, so your recovery key is needed once to open your encrypted data." : "Your data is encrypted with your password. Enter it once on this device.")),
      h("div", { class: "login-fields" }, oauth ? null : h("label", { class: "login-field", for: "ul-pass" }, icon("lock", "ico"), pass), rec ? h("label", { class: "login-field", for: "ul-rec" }, icon("shield", "ico"), rec) : null),
      err, btn,
      h("button", { type: "button", class: "link-btn login-link center", on: { click: signOut } }, "Sign out"));
    panel.addEventListener("submit", async ev => {
      ev.preventDefault();
      if (!oauth && !pass.value) return fail(err, "Enter your password.", panel.querySelector(".login-field"));
      if (rec && normRecovery(rec.value).length !== 24) return fail(err, "Enter the 24-character recovery key.", rec);
      if (!navigator.onLine) return fail(err, "Connect to the internet to unlock your data.");
      btn.disabled = true;
      if (!oauth) {
        const check = await sb.auth.signInWithPassword({ email: S.email, password: pass.value });
        if (check.error || !check.data.session) { btn.disabled = false; return fail(err, check.error && check.error.status === 429 ? "Too many attempts. Wait a minute and try again." : "Incorrect password."); }
        setSession(check.data.session);
      }
      const res = await unlockVault(oauth ? null : pass.value, rec ? rec.value : null);
      btn.disabled = false;
      if (res.need) { S.unlockNeed = "recovery"; return renderUnlock(); }
      if (res.error) return fail(err, res.error === "recovery" ? "That recovery key isn't correct." : "Couldn't unlock. Check your connection and try again.");
      S.unlockNeed = null;
      render();
      recoverySheet();
      sync();
    });
    root.replaceChildren(h("div", { class: "login" }, panel));
    (oauth ? rec : pass).focus();
  }

  async function signOut() {
    S.armed = null;
    try { await sb.auth.signOut({ scope: "local" }); } catch { }
    try {
      const prefix = `wallet:v1:${S.uid}:`;
      Object.keys(localStorage).filter(k => k.startsWith(prefix)).forEach(k => localStorage.removeItem(k));
      localStorage.removeItem("wallet:lastUser");
      localStorage.removeItem("wallet:oauth");
    } catch { }
    S.session = null; S.uid = null; S.offline = false; S.outbox = []; S.last = {};
    VAULT.key = null; VAULT.raw = null; S.unlockNeed = null; S.recoveryCode = null;
    ADMIN.allowed = null; ADMIN.data = null;
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
    applyLang();
    S.month = thisMonth();
    if (!CFG.supabaseUrl || !CFG.supabaseAnonKey || !window.supabase) return render();
    sb = window.supabase.createClient(CFG.supabaseUrl, CFG.supabaseAnonKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false, storageKey: "wallet-auth" }
    });
    const shared = location.hash.match(/^#share=(.+)$/);
    if (shared) return renderShared(shared[1]);
    const hp = new URLSearchParams(location.hash.slice(1));
    if (hp.get("type") === "recovery" && hp.get("access_token") && hp.get("refresh_token")) {
      history.replaceState(null, "", location.pathname);
      let res = null;
      try { res = await sb.auth.setSession({ access_token: hp.get("access_token"), refresh_token: hp.get("refresh_token") }); } catch { res = null; }
      if (res && !res.error && res.data.session) { setSession(res.data.session); await loadVaultKey(); return renderNewPassword(); }
      S.notice = "That reset link has expired. Request a new one.";
    } else if (hp.get("access_token") && hp.get("refresh_token")) {
      history.replaceState(null, "", location.pathname);
      let res = null;
      try { res = await sb.auth.setSession({ access_token: hp.get("access_token"), refresh_token: hp.get("refresh_token") }); } catch { res = null; }
      if (res && !res.error && res.data.session) {
        setOAuth(true);
        setSession(res.data.session);
        await loadVaultKey();
        if (!VAULT.key) { const unlocked = await unlockVault(null); if (unlocked.need) S.unlockNeed = "recovery"; }
      } else S.notice = "Sign-in didn't complete. Try again.";
    } else if (hp.get("error_code") || hp.get("error")) {
      history.replaceState(null, "", location.pathname);
      S.notice = /recovery|otp/i.test(hp.get("error_code") || "") ? "That reset link has expired or was already used. Request a new one." : "Sign-in didn't complete. Try again.";
    }
    sb.auth.onAuthStateChange((event, session) => {
      if (session && (event === "TOKEN_REFRESHED" || event === "SIGNED_IN" || event === "INITIAL_SESSION")) {
        if (S.uid === session.user.id) S.session = session;
      }
    });
    let last = null;
    try { last = localStorage.getItem("wallet:lastUser"); } catch { last = null; }
    if (last) {
      S.uid = last;
      S.booting = true;
      loadCache();
      render();
    }
    let session = null;
    try { const { data } = await sb.auth.getSession(); session = data.session; } catch { session = null; }
    S.booting = false;
    if (session) { setSession(session); await loadVaultKey(); }
    else if (last && !navigator.onLine) { S.offline = true; }
    else if (last) { S.uid = null; shell = null; }
    render();
    if (S.session && lockCfg()) showLock();
    if (S.session && VAULT.key) recoverySheet();
    if (S.session) sync();
    if (S.session && location.hash === "#add") { history.replaceState(null, "", location.pathname); txnSheet(null); }
  }

  window.addEventListener("online", () => { if (S.offline || !S.session) recover(); else sync(); renderStatus(); });
  window.addEventListener("offline", renderStatus);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") { LOCK.hiddenAt = Date.now(); return; }
    if (S.uid && lockCfg() && LOCK.hiddenAt && Date.now() - LOCK.hiddenAt > 60000) showLock();
    if (S.offline) recover(); else sync();
  });
  setInterval(() => { if (document.visibilityState === "visible" && S.session) sync(); }, 120000);
  if ("serviceWorker" in navigator && location.protocol === "https:") {
    const hadController = !!navigator.serviceWorker.controller;
    let reloaded = false, wantsReload = false;
    const busy = () => !!document.querySelector(".overlay, .viewer") || (document.activeElement && /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName));
    const applyUpdate = () => {
      if (reloaded || !wantsReload) return;
      if (busy()) return void setTimeout(applyUpdate, 4000);
      reloaded = true;
      location.reload();
    };
    navigator.serviceWorker.addEventListener("controllerchange", () => { if (hadController) { wantsReload = true; applyUpdate(); } });
    navigator.serviceWorker.register("sw.js").then(reg => {
      document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") reg.update().catch(() => { }); });
    }).catch(() => { });
  }

  const darkQuery = window.matchMedia("(prefers-color-scheme: dark)");
  const syncThemeColor = () => {
    const meta = document.getElementById("theme-color");
    if (meta) meta.setAttribute("content", darkQuery.matches ? "#070f0c" : "#edf2ee");
    document.documentElement.style.backgroundColor = darkQuery.matches ? "#070f0c" : "#edf2ee";
  };
  syncThemeColor();
  if (darkQuery.addEventListener) darkQuery.addEventListener("change", syncThemeColor);
  window.addEventListener("hashchange", () => { if (location.hash !== "#add" && location.hash !== "") location.reload(); });
  if ("serviceWorker" in navigator) navigator.serviceWorker.addEventListener("message", e => { if (e.data && e.data.type === "open-add" && S.session) txnSheet(null); });
  window.addEventListener("scroll", () => { if (shell) shell.top.classList.toggle("scrolled", window.scrollY > 4); }, { passive: true });
  (() => {
    let y0 = null, dy = 0;
    window.addEventListener("touchstart", e => {
      y0 = null;
      if (!shell || !S.session || window.scrollY > 0 || document.querySelector(".overlay") || e.touches.length !== 1) return;
      y0 = e.touches[0].clientY; dy = 0;
    }, { passive: true });
    window.addEventListener("touchmove", e => {
      if (y0 == null) return;
      dy = Math.max(0, e.touches[0].clientY - y0);
      const d = Math.min(80, dy * 0.45);
      shell.ptr.style.transform = `translate(-50%, ${d}px) rotate(${d * 4}deg)`;
      shell.ptr.style.opacity = String(Math.min(1, d / 55));
      shell.ptr.classList.toggle("ready", d >= 55);
    }, { passive: true });
    window.addEventListener("touchend", () => {
      if (y0 == null) return;
      if (dy * 0.45 >= 55) sync();
      shell.ptr.style.transform = ""; shell.ptr.style.opacity = ""; shell.ptr.classList.remove("ready");
      y0 = null;
    });
  })();
  start();
})();

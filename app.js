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
    rules: ["id", "user_id", "kind", "amount", "currency", "account_id", "category_id", "note", "day", "next_on", "active", "remind", "enc", "deleted_at"],
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
  const HOLD_TYPES = ["gold", "silver", "crypto", "stock", "other"];
  const CRYPTOS = [["bitcoin", "BTC", "Bitcoin"], ["ethereum", "ETH", "Ethereum"], ["tether", "USDT", "Tether"], ["binancecoin", "BNB", "BNB"], ["solana", "SOL", "Solana"], ["ripple", "XRP", "XRP"], ["usd-coin", "USDC", "USD Coin"], ["dogecoin", "DOGE", "Dogecoin"], ["cardano", "ADA", "Cardano"], ["tron", "TRX", "TRON"], ["the-open-network", "TON", "Toncoin"], ["avalanche-2", "AVAX", "Avalanche"], ["polkadot", "DOT", "Polkadot"], ["chainlink", "LINK", "Chainlink"], ["litecoin", "LTC", "Litecoin"], ["shiba-inu", "SHIB", "Shiba Inu"], ["bitcoin-cash", "BCH", "Bitcoin Cash"], ["stellar", "XLM", "Stellar"], ["monero", "XMR", "Monero"], ["pepe", "PEPE", "Pepe"]];
  const HOLD_META = { gold: ["coin", "#c99a1c", "Gold"], silver: ["coin", "#8a97a6", "Silver"], crypto: ["chip", "#e8892b", "Crypto"], stock: ["chart", "#3b74d0", "Stock or ETF"], other: ["piggy", "#7a5cd6", "Other"] };
  const KIND_LABEL = { cash: "Cash", bank: "Bank", card: "Card", wallet: "E-wallet", savings: "Savings" };
  const KIND_ICON = { cash: "cash", bank: "bank", card: "card", wallet: "phone", savings: "piggy" };
  const DEFAULT_CATS = [
    ["groceries", "Groceries", "expense", "needs", "#2e9e6b"],
    ["home", "Rent & home", "expense", "needs", "#3b7dd8"],
    ["bills", "Bills & internet", "expense", "needs", "#7a5cd6"],
    ["generator", "Generator & electricity", "expense", "needs", "#d9a521"],
    ["transport", "Fuel & transport", "expense", "needs", "#d9622b"],
    ["parking", "Parking", "expense", "needs", "#4f7cac"],
    ["health", "Health", "expense", "needs", "#d6455d"],
    ["care", "Personal care", "expense", "wants", "#8e5bb5"],
    ["eating", "Eating out & coffee", "expense", "wants", "#c2508f"],
    ["shopping", "Shopping", "expense", "wants", "#1f9bb0"],
    ["fun", "Going out & fun", "expense", "wants", "#8a9a2b"],
    ["subs", "Subscriptions", "expense", "wants", "#5f6ad1"],
    ["gifts", "Gifts & family", "expense", "wants", "#b5793a"],
    ["debt", "Loan repayments", "expense", "savings", "#5b7083"],
    ["salary", "Salary", "income", null, "#2e9e6b"],
    ["freelance", "Freelance & side work", "income", null, "#3b7dd8"],
    ["remit", "Family support & remittances", "income", null, "#0f8a6c"],
    ["giftsin", "Gifts received", "income", null, "#c2508f"],
    ["otherin", "Other income", "income", null, "#5b7083"]
  ];
  const VERSION = "3.78.1";
  const ICONS = {
    globe: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM3.5 9h17M3.5 15h17M12 3c2.4 2.5 3.6 5.5 3.6 9s-1.2 6.5-3.6 9c-2.4-2.5-3.6-5.5-3.6-9s1.2-6.5 3.6-9z",
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
    bubble: "M5 4h14a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-8l-5 4v-4H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z",
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
    cash: "M2.5 6.5h19v11h-19zM12 9.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM6 9.5v5M18 9.5v5",
    card: "M2.5 5.5h19v13h-19zM2.5 10h19M6.5 15h4",
    phone: "M7 2.5h10a1 1 0 0 1 1 1v17a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1v-17a1 1 0 0 1 1-1zM10.5 18.5h3M9 7.5h6M9 11h6",
    piggy: "M4 11.5C4 8 7.6 5.5 11.5 5.5c1.6 0 3 .4 4.2 1L18 5v3.2c.9.8 1.5 1.8 1.8 2.8H21v3.5h-1.6a6 6 0 0 1-2.4 2.6V20h-3v-1.6a9 9 0 0 1-2.5.1V20h-3v-2.4C5.6 16.4 4 14.1 4 11.5zM15.5 10h.01M10 8.5h3",
    bank: "M3 21h18M5 21V10M19 21V10M9 21v-6M15 21v-6M2 10l10-6 10 6z",
    work: "M3 8h18v12H3zM8 8V5h8v3M3 13h18",
    laptop: "M4 5h16v11H4zM2 19h20",
    coin: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v10M15 9.5c-.5-1-1.6-1.5-3-1.5-1.7 0-3 .8-3 2s1.3 1.7 3 2 3 .9 3 2-1.3 2-3 2c-1.4 0-2.6-.6-3-1.6",
    bell: "M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.9 1.9 0 0 0 3.4 0",
    shield: "M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6z",
    users: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
    mail: "M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zM3 7l9 6 9-6",
    lock: "M6 11h12a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1zM8 11V7a4 4 0 0 1 8 0v4",
    pencil: "M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16zM13.5 6.5l4 4",
    trash: "M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3",
    del: "M21 5H9l-6 7 6 7h12a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1zM17 9l-5 6M12 9l5 6",
    check: "M5 12.5l4.5 4.5L19 7.5",
    minus: "M5 12h14",
    cal: "M3 9h18M8 3v4M16 3v4M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z",
    note: "M4 20h4L18.5 9.5a2.8 2.8 0 0 0-4-4L4 16z",
    repeat: "M17 2l4 4-4 4M3 11V9a3 3 0 0 1 3-3h15M7 22l-4-4 4-4M21 13v2a3 3 0 0 1-3 3H3",
    sun: "M12 3v2M12 19v2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M3 12h2M19 12h2M5.6 18.4L7 17M17 7l1.4-1.4M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0",
    moon: "M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z",
    cut: "M6 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM6 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM20 4L8.1 15.9M14.5 14.5L20 20M8.1 8.1L12 12",
    park: "M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zM10 17V7h3a3 3 0 0 1 0 6h-3",
    gem: "M6 3h12l4 6-10 12L2 9zM2 9h20M12 21 8 9l4-6 4 6z",
    chip: "M9 3v3M15 3v3M9 18v3M15 18v3M3 9h3M3 15h3M18 9h3M18 15h3M7 6h10a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1zM10 10h4v4h-4z",
    user: "M20 21a8 8 0 0 0-16 0M12 13a4 4 0 1 0 0-8 4 4 0 0 0 0 8",
    tag: "M3 12V4a1 1 0 0 1 1-1h8l9 9-9 9zM7.5 7.5h.01",
    warn: "M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"
  };

  const S = {
    uid: null, email: "", session: null, offline: false,
    data: Object.fromEntries(TABLES.map(t => [t, new Map()])),
    last: {}, outbox: [], syncing: false, syncError: false, syncedAt: null,
    hidden: false, view: "home", month: null,
    filter: { q: "", kind: "all", account: null }, limit: 50,
    restore: null, armed: null
  };
  applyTheme();
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
  const brandMark = () => { const [a, b] = LANG === "ar" ? ["ميزانية ", "وتقسيم"] : ["Budget", "Split"]; return [document.createTextNode(a), h("span", { class: "brand-split" }, document.createTextNode(b))]; };
  const dateLocale = () => LANG === "fr" ? "fr-FR" : LANG === "ar" ? "ar-LB-u-nu-latn" : "en-GB";
  const applyLang = () => { document.documentElement.lang = LANG; document.documentElement.dir = "ltr"; };
  const setLang = v => { if (!LANGS[v] || v === LANG) return; LANG = v; trCache.clear(); try { localStorage.setItem("wallet:lang", v); } catch { } applyLang(); shell = null; render(); };
  const toTop = () => { window.scrollTo(0, 0); if (document.scrollingElement) document.scrollingElement.scrollTop = 0; if (shell && shell.main) shell.main.scrollTop = 0; };
  const langChosen = () => { try { return !!LANGS[localStorage.getItem("wallet:lang")]; } catch { return true; } };
  function renderLangPick() {
    shell = null;
    const pick = k => { LANG = k; trCache.clear(); try { localStorage.setItem("wallet:lang", k); } catch { } applyLang(); render(); };
    root.replaceChildren(h("div", { class: "lang-pick" },
      h("img", { class: "login-logo", src: "icons/icon-192-b.png", alt: "" }),
      h("h1", null, "Budget", h("span", { class: "brand-split" }, "Split")),
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

  const AR_RE = /[\u0600-\u06FF]/;
  const rtlText = t => { if (LANG !== "ar" || !AR_RE.test(t)) return t; const b = document.createElement("bdi"); b.dir = "rtl"; b.textContent = t; return b; };
  const h = (tag, props, ...kids) => {
    const el = document.createElement(tag);
    if (props) {
      for (const [k, v] of Object.entries(props)) {
        if (v == null || v === false) continue;
        if (k === "class") el.className = v;
        else if (k === "on") { el.__on = { ...(el.__on || {}), ...v }; for (const ev of Object.keys(v)) el.addEventListener(ev, dispatch); }
        else if (k === "style") for (const [p, val] of Object.entries(v)) { if (p.startsWith("--")) el.style.setProperty(p, val); else el.style[p] = val; }
        else if (k === "value" || k === "checked" || k === "disabled" || k === "readOnly" || k === "hidden") el[k] = v;
        else el.setAttribute(k, v === true ? "" : TR_ATTRS.has(k) ? tr(String(v)) : String(v));
      }
    }
    for (const kid of kids.flat(Infinity)) {
      if (kid == null || kid === false) continue;
      el.append(kid instanceof Node ? kid : rtlText(tr(String(kid))));
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

  let GIO_N = 0;
  const gioMark = (cls = "gio") => {
    const id = "gio" + (++GIO_N);
    const el = (tag, at, ...kids) => { const n = document.createElementNS(SVGNS, tag); for (const [k, v] of Object.entries(at)) n.setAttribute(k, v); n.append(...kids); return n; };
    const stop = (o, c) => el("stop", { offset: o, "stop-color": c });
    return el("svg", { viewBox: "0 0 32 32", class: cls, "aria-hidden": "true" },
      el("defs", {},
        el("linearGradient", { id: id + "b", x1: "0", y1: "0", x2: "1", y2: "1" }, stop("0", "#3ee8a5"), stop(".55", "#0f9d74"), stop("1", "#09523e")),
        el("linearGradient", { id: id + "g", x1: "0", y1: "0", x2: "1", y2: "1" }, stop("0", "#fff4cc"), stop(".5", "#f5c451"), stop("1", "#c98a1e"))),
      el("rect", { x: "3", y: "3", width: "26", height: "26", rx: "9.5", fill: `url(#${id}b)` }),
      el("ellipse", { cx: "11.5", cy: "8.6", rx: "5.5", ry: "3", fill: "#fff", opacity: ".22", transform: "rotate(-28 11.5 8.6)" }),
      el("circle", { cx: "16", cy: "16", r: "9.4", fill: "none", stroke: `url(#${id}g)`, "stroke-width": "1.2", opacity: ".75" }),
      el("path", { class: "gio-spark", d: "M16 8.6Q16.9 15.1 23.4 16Q16.9 16.9 16 23.4Q15.1 16.9 8.6 16Q15.1 15.1 16 8.6Z", fill: `url(#${id}g)` }),
      el("path", { class: "gio-mini", d: "M24.4 4.4Q24.7 7.1 27.4 7.4Q24.7 7.7 24.4 10.4Q24.1 7.7 21.4 7.4Q24.1 7.1 24.4 4.4Z", fill: "#fff" }));
  };

  const pad = n => String(n).padStart(2, "0");
  const ymd = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  let todayCache = { t: 0, v: "" };
  const today = () => { const n = Date.now(); if (n - todayCache.t > 1000) todayCache = { t: n, v: ymd(new Date(n)) }; return todayCache.v; };
  const thisMonth = () => today().slice(0, 7);
  const monthOf = s => String(s).slice(0, 7);
  const shiftMonth = (m, k) => { const [y, mo] = m.split("-").map(Number); return ymd(new Date(y, mo - 1 + k, 1)).slice(0, 7); };
  const daysInMonth = m => { const [y, mo] = m.split("-").map(Number); return new Date(y, mo, 0).getDate(); };
  const FMT_CACHE = new Map();
  const dfmt = opts => { const loc = dateLocale(), k = "d" + loc + JSON.stringify(opts); let f = FMT_CACHE.get(k); if (!f) { f = new Intl.DateTimeFormat(loc, opts); FMT_CACHE.set(k, f); } return f; };
  const nfmt = opts => { const k = "n" + JSON.stringify(opts); let f = FMT_CACHE.get(k); if (!f) { f = new Intl.NumberFormat("en-US", opts); FMT_CACHE.set(k, f); } return f; };
  const monthLabel = m => dfmt({ month: "long", year: "numeric" }).format(new Date(m + "-01T12:00:00"));
  const monthShort = m => dfmt({ month: "short" }).format(new Date(m + "-01T12:00:00"));
  const monthName = m => dfmt({ month: "long" }).format(new Date(m + "-01T12:00:00"));
  const dayLabel = s => {
    if (s === today()) return "Today";
    if (s === ymd(new Date(Date.now() - 864e5))) return "Yesterday";
    const d = new Date(s + "T12:00:00");
    return dfmt({ weekday: "short", day: "numeric", month: "short", year: s.slice(0, 4) === today().slice(0, 4) ? undefined : "numeric" }).format(d);
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
    return dfmt({ day: "numeric", month: "short" }).format(new Date(iso));
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
    const dec = curDec(cur);
    const raw = Number(n) || 0;
    const a = Math.abs(raw);
    const neg = raw < 0 && (dec === 0 || opts.whole ? Math.round(a) : Math.round(a * 100) / 100) > 0;
    let num;
    if (opts.compact && a >= 1e6) num = nfmt({ maximumFractionDigits: 1 }).format((a / 1e6)) + "M";
    else if (opts.compact && a >= 1e4 && !isBig(cur)) num = nfmt({ maximumFractionDigits: 1 }).format((a / 1e3)) + "k";
    else if (dec === 0 || opts.whole) num = nfmt({}).format(Math.round(a));
    else { const r = Math.round(a * 100) / 100; num = nfmt({ minimumFractionDigits: r % 1 ? 2 : 0, maximumFractionDigits: 2 }).format(r); }
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
    S.hidden = store.get("hidden", false) || !!storedSettings().hideOnStart;
    loadGroupCache();
    LINKED.clear();
    const cachedLinks = store.get("linked", []);
    if (Array.isArray(cachedLinks)) for (const pair of cachedLinks) if (Array.isArray(pair) && pair[1] && Array.isArray(pair[1].entries)) LINKED.set(pair[0], pair[1]);
    ver++;
  };

  const rows = t => [...S.data[t].values()];
  const acc = id => S.data.accounts.get(id);
  const LOAN_CATS = { __lent: { id: "__lent", name: "Lent & paid for others", kind: "expense", color: "#4f86f0", virtual: true }, __borrowed: { id: "__borrowed", name: "Borrowed & paid back to you", kind: "income", color: "#14b8a6", virtual: true } };
  const cat = id => S.data.categories.get(id) || LOAN_CATS[id];
  const CAT_ICON_KEYS = { groceries: "cart", home: "home", bills: "wifi", generator: "bolt", transport: "car", parking: "park", care: "cut", health: "heart", eating: "cup", shopping: "bag", fun: "star", subs: "repeat", gifts: "gift", debt: "bank", salary: "work", freelance: "laptop", giftsin: "gift", remit: "globe", otherin: "coin" };
  const CAT_ICON_WORDS = [[/parking|valet|garage/i, "park"], [/hair|barber|salon|beauty|nail|spa|personal care|groom/i, "cut"], [/grocer|food|super|market/i, "cart"], [/rent|home|house|apart/i, "home"], [/bill|internet|phone|mobile|wifi/i, "wifi"], [/generat|electric|power|ampere/i, "bolt"], [/fuel|petrol|car|transport|taxi|uber|bus/i, "car"], [/health|doctor|pharm|medic|hospital|gym/i, "heart"], [/eat|coffee|restaurant|lunch|dinner|cafe|drink/i, "cup"], [/shop|cloth|amazon/i, "bag"], [/fun|going out|movie|party|travel|trip/i, "star"], [/subscri|netflix|spotify|apple|icloud/i, "repeat"], [/remit|abroad|transfer from|family support/i, "globe"], [/gift|family/i, "gift"], [/loan|debt|bank|repay/i, "bank"], [/salary|work|job|wage/i, "work"], [/freelance|side|client/i, "laptop"]];
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
      noteRequired: d.noteRequired !== false,
      manualRates: Array.isArray(d.manualRates) ? d.manualRates.filter(c => CUR_RE.test(c)) : [],
      ratesAt: DATE_RE.test(d.ratesAt || "") ? d.ratesAt : "",
      holdings: Array.isArray(d.holdings) ? d.holdings.filter(x => x && typeof x.id === "string" && HOLD_TYPES.includes(x.type)).slice(0, 60).map(x => ({
        id: x.id.slice(0, 40), type: x.type, sym: String(x.sym || "").replace(/[^A-Za-z0-9.^=_-]/g, "").slice(0, 40), name: String(x.name || "").slice(0, 40),
        qty: Number(x.qty) > 0 ? Number(x.qty) : 0, unit: ["g", "oz", "kg"].includes(x.unit) ? x.unit : "g", karat: [24, 22, 21, 18, 14].includes(Number(x.karat)) ? Number(x.karat) : 24,
        cost: Number(x.cost) > 0 ? Number(x.cost) : null, costCur: CUR_RE.test(x.costCur || "") ? x.costCur : null,
        value: Number(x.value) > 0 ? Number(x.value) : null, valCur: CUR_RE.test(x.valCur || "") ? x.valCur : null
      })) : [],
      goals: Array.isArray(d.goals) ? d.goals.filter(g => g && typeof g.id === "string" && Number(g.target) > 0).slice(0, 12).map((g, i) => ({ id: g.id.slice(0, 40), name: String(g.name || "Goal").slice(0, 40), target: Number(g.target), saved: Math.max(0, Number(g.saved) || 0), account: typeof g.account === "string" ? g.account.slice(0, 64) : "", by: /^\d{4}-\d{2}$/.test(g.by || "") ? g.by : "", color: /^#[0-9a-f]{6}$/i.test(g.color) ? g.color : COLORS[i % COLORS.length] })) : [],
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
      const what = { transactions: "entry", people: "person", loan_entries: "loan", accounts: "account", categories: "category", rules: "repeat" }[t];
      if (t === "loan_entries" && !TRACK.mute) { const lp = S.data.people.get(r.person_id); if (lp && lp.share_token && LINKS.owned.has(lp.share_token)) schedulePing(lp.share_token); }
      if (what && !(r.rule_id && !S.data[t].has(r.id))) track(r.deleted_at ? "delete" : S.data[t].has(r.id) ? "edit" : "add", t === "transactions" && r.kind ? r.kind : what);
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

  const LIVE = { ch: null, uid: null, timers: {}, again: false, retry: 0 };
  function startLive() {
    if (!sb || !S.session || !VAULT.key || typeof sb.channel !== "function") return;
    if (LIVE.ch && LIVE.uid === S.uid) return;
    stopLive();
    LIVE.uid = S.uid;
    LIVE.ch = sb.channel("live-" + S.uid)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "sync_events", filter: `user_id=eq.${S.uid}` }, p => liveEvent(p && p.new && p.new.kind))
      .subscribe(status => {
        if (status === "SUBSCRIBED") { LIVE.retry = 0; return; }
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          stopLive();
          LIVE.retry = Math.min(LIVE.retry + 1, 6);
          setTimeout(startLive, 1000 * Math.pow(2, LIVE.retry));
        }
      });
  }
  function stopLive() {
    if (LIVE.ch) { try { sb.removeChannel(LIVE.ch); } catch { } }
    LIVE.ch = null; LIVE.uid = null;
  }
  function liveEvent(kind) {
    const k = ["data", "group", "loan", "inbox"].includes(kind) ? kind : "data";
    clearTimeout(LIVE.timers[k]);
    LIVE.timers[k] = setTimeout(() => {
      if (k === "data") { if (S.syncing) LIVE.again = true; else sync(); }
      else if (k === "group") loadGroups();
      else if (k === "loan") { importShared(); loadLinked(); }
      else (INBOX.loading ? INBOX.p : Promise.resolve()).then(() => loadInbox(true));
    }, 150);
  }

  async function sync() {
    if (S.syncing || !sb || !S.session || !VAULT.key || !navigator.onLine) return renderStatus();
    S.syncing = true;
    renderStatus();
    try {
      await flush();
      const changed = await pull();
      S.syncedAt = new Date().toISOString();
      loadInbox();
      store.set("syncedAt", S.syncedAt);
      S.syncError = false;
      ensureDefaults();
      runRules();
      refreshRates();
      ensureEscrow();
      importQuick();
      importShared();
      flushSharedOut();
      loadLinked().then(processPendingJoin);
      publishKey().then(() => loadGroups()).then(processGroupJoin).catch(() => { });
      if (changed) { save(); scheduleRender(); }
    } catch {
      S.syncError = true;
    } finally {
      S.syncing = false;
      renderStatus();
      startLive();
      if (LIVE.again) { LIVE.again = false; setTimeout(sync, 50); }
    }
  }

  function ensureDefaults() {
    if (settings().seeded) {
      const ss = storedSettings();
      if (!ss.v362) {
        const c = S.data.categories.get(`${S.uid}:cat:care`);
        const fix = c && c.name === "Haircut & personal care" ? [{ t: "categories", r: { ...c, name: "Personal care" } }] : [];
        TRACK.mute = true; putMany([...fix, { t: "settings", r: { id: settingsId(), data: { ...storedSettings(), v362: true } } }]); TRACK.mute = false;
      }
      const ss2 = storedSettings();
      if (ss2.v326 && ss2.v346 && ss2.v358) return;
      const items = [];
      if (!ss.v358) {
        const cid = `${S.uid}:cat:care`;
        if (!S.data.categories.has(cid) && !rows("categories").some(c => c.kind === "expense" && /hair|barber|salon|beauty|personal care/i.test(c.name))) {
          const after = S.data.categories.get(`${S.uid}:cat:health`);
          items.push({ t: "categories", r: { id: cid, name: "Personal care", kind: "expense", bucket: "wants", color: "#8e5bb5", budget: null, sort: after ? Math.round(Number(after.sort) || 0) : rows("categories").length } });
        }
      }
      if (!ss.v346) {
        const pid = `${S.uid}:cat:parking`;
        if (!S.data.categories.has(pid) && !rows("categories").some(c => c.kind === "expense" && /park/i.test(c.name))) {
          const after = S.data.categories.get(`${S.uid}:cat:transport`);
          items.push({ t: "categories", r: { id: pid, name: "Parking", kind: "expense", bucket: "needs", color: "#4f7cac", budget: null, sort: after ? Math.round(Number(after.sort) || 0) : rows("categories").length } });
        }
      }
      if (ss.v326) { items.push({ t: "settings", r: { id: settingsId(), data: { ...storedSettings(), v346: true, v358: true } } }); TRACK.mute = true; putMany(items); TRACK.mute = false; return; }
      items.push({ t: "settings", r: { id: settingsId(), data: { ...storedSettings(), remit: true, whish: true, v326: true, v346: true, v358: true } } });
      const id = `${S.uid}:cat:remit`;
      const cur = S.data.categories.get(id);
      if (cur) items.unshift({ t: "categories", r: { ...cur, sort: Math.round(Number(cur.sort) || 0) } });
      else if (!rows("categories").some(c => c.kind === "income" && /remit/i.test(c.name))) {
        const after = S.data.categories.get(`${S.uid}:cat:freelance`) || S.data.categories.get(`${S.uid}:cat:salary`);
        items.unshift({ t: "categories", r: { id, name: "Family support & remittances", kind: "income", bucket: null, color: "#0f8a6c", budget: null, sort: after ? Math.round(Number(after.sort) || 0) : rows("categories").length } });
      }
      const wid = `${S.uid}:acc:whish`;
      if (!S.data.accounts.has(wid) && !rows("accounts").some(a => /whish/i.test(a.name))) {
        items.unshift({ t: "accounts", r: { id: wid, name: "Whish", currency: "USD", kind: "wallet", opening_balance: 0, sort: Math.max(-1, ...rows("accounts").map(a => Math.round(Number(a.sort) || 0))) + 1, archived: false } });
      }
      TRACK.mute = true; putMany(items); TRACK.mute = false;
      return;
    }
    if (S.data.accounts.size || S.data.categories.size) return saveSettings({ seeded: true });
    const p = S.uid;
    const items = [];
    [["cash-usd", "Cash (dollars)", "USD", "cash"], ["cash-lbp", "Cash (lira)", "LBP", "cash"], ["bank", "Bank account", "USD", "bank"], ["whish", "Whish", "USD", "wallet"], ["savings", "Savings", "USD", "savings"]]
      .forEach(([k, name, currency, kind], i) => items.push({ t: "accounts", r: { id: `${p}:acc:${k}`, name, currency, kind, opening_balance: 0, sort: i, archived: false } }));
    DEFAULT_CATS.forEach(([k, name, kind, bucket, color], i) => items.push({ t: "categories", r: { id: `${p}:cat:${k}`, name, kind, bucket, color, budget: null, sort: i } }));
    items.push({ t: "settings", r: { id: settingsId(), data: { ...storedSettings(), seeded: true } } });
    TRACK.mute = true;
    putMany(items);
    TRACK.mute = false;
  }

  const NOTE_SKIP_DEFAULT = ["groceries", "home", "bills", "generator", "transport", "parking", "care", "subs", "salary", "debt"];
  function noteSkipSet() {
    const v = storedSettings().noteSkip;
    if (Array.isArray(v)) return new Set(v);
    return new Set(rows("categories").filter(c => NOTE_SKIP_DEFAULT.includes(String(c.id).split(":cat:")[1])).map(c => c.id));
  }
  const noteNeeded = catId => settings().noteRequired && !(catId && noteSkipSet().has(catId));
  const noteRule = f => f.kind === "loan" ? noteNeeded(null) : f.adjust ? !(f.category && (noteSkipSet().has(f.category) || isSalaryCat(cat(f.category)))) : noteNeeded(f.category) && !isSalaryCat(cat(f.category));
  const isSalaryCat = c => !!c && c.kind === "income" && (/:cat:salary$/.test(c.id) || /salary|salaire|wage|راتب|معاش/i.test(c.name));
  function settlePlan(payday) {
    const src = acc(payday.account_id);
    if (!src) return [];
    const bal = balances();
    let left = Number(payday.amount) || 0;
    const out = [];
    const owing = rows("accounts").filter(o => !o.archived && o.id !== src.id && (bal.get(o.id) || 0) < 0)
      .sort((p, q) => (q.kind === "card") - (p.kind === "card") || bySort(p, q));
    for (const o of owing) {
      if (left <= 0) break;
      const owed = -(bal.get(o.id) || 0);
      const pay = Math.min(left, roundCur(convert(owed, o.currency, src.currency), src.currency));
      if (pay <= 0) continue;
      const toAmt = o.currency === src.currency ? pay : Math.min(owed, roundCur(convert(pay, src.currency, o.currency), o.currency));
      out.push({ acc: o, pay, toAmt, owed });
      left = roundCur(left - pay, src.currency);
    }
    return out;
  }
  function settleSheet(payday, plan) {
    const src = acc(payday.account_id);
    const on = new Set(plan.map(p => p.acc.id));
    const body = h("div", { class: "form" });
    const btn = h("button", { type: "button", class: "btn" });
    const draw = () => {
      const total = plan.filter(p => on.has(p.acc.id)).reduce((t, p) => t + p.pay, 0);
      body.replaceChildren(
        h("p", null, `Some accounts went below zero. Pay them back from ${src.name} now?`),
        h("div", { class: "card flush" }, plan.map(p => h("label", { class: "row settle-row" },
          h("input", { type: "checkbox", checked: on.has(p.acc.id), on: { change: e => { if (e.target.checked) on.add(p.acc.id); else on.delete(p.acc.id); draw(); } } }),
          h("span", { class: "row-main" }, h("span", { class: "row-title" }, p.acc.name), h("span", { class: "row-sub" }, p.toAmt < p.owed ? `Owes ${fmt(p.owed, p.acc.currency, { show: true })} · part of it` : `Owes ${fmt(p.owed, p.acc.currency, { show: true })}`)),
          h("span", { class: "amt num" }, fmt(p.pay, src.currency, { show: true }))))),
        h("p", { class: "hint" }, "Each one is saved as a transfer, so you can edit or delete it later."),
        h("button", { type: "button", class: "btn alt", on: { click: () => { track("add", "settle_no"); closeSheet(); } } }, "Not now"));
      btn.textContent = total > 0 ? tr("Pay back") + " " + fmt(total, src.currency, { show: true }) : tr("Pick at least one");
      btn.disabled = total <= 0;
    };
    btn.addEventListener("click", () => {
      const now = new Date().toISOString();
      const items = plan.filter(p => on.has(p.acc.id)).map(p => ({ t: "transactions", r: { id: `${payday.id}~set~${p.acc.id}`.slice(0, 160), kind: "transfer", amount: p.pay, currency: src.currency, rate: rateOf(src.currency), account_id: src.id, to_account_id: p.acc.id, to_amount: p.toAmt, category_id: null, note: "Paid back from salary", occurred_on: payday.occurred_on, rule_id: null, receipt: null, created_at: now } })).filter(i => !S.data.transactions.has(i.r.id));
      if (items.length) putMany(items);
      track("add", "settle_yes");
      closeSheet();
      toast(items.length === 1 ? "1 account paid back." : `${items.length} accounts paid back.`);
    });
    draw();
    openSheet("Pay back what you owe?", body, btn);
  }

  const isSalaryRule = r => r.kind === "income" && r.remind == null && isSalaryCat(cat(r.category_id));
  const dueSalary = () => rows("rules").filter(r => r.active && !r.deleted_at && acc(r.account_id) && DATE_RE.test(r.next_on) && r.next_on <= today() && isSalaryRule(r) && store.get("paySnooze:" + r.id, "") !== today()).sort((a, b) => a.next_on < b.next_on ? -1 : 1)[0] || null;
  function confirmSalary(r, amount) {
    const a = acc(r.account_id);
    if (!a) return;
    const id = `${r.id}@${r.next_on}`;
    const items = [];
    let row = null;
    if (amount > 0 && !S.data.transactions.has(id)) {
      row = { id, kind: "income", amount: roundCur(amount, a.currency), currency: a.currency, rate: rateOf(a.currency), account_id: a.id, to_account_id: null, to_amount: null, category_id: r.category_id, note: r.note, occurred_on: r.next_on <= today() ? r.next_on : today(), rule_id: r.id, receipt: null, created_at: new Date().toISOString() };
      items.push({ t: "transactions", r: row });
    }
    items.push({ t: "rules", r: { ...r, next_on: nextMonthDay(r.next_on, r.day) } });
    putMany(items);
    track("add", amount > 0 ? "salary_yes" : "salary_skip");
    if (!row) return;
    toast(`${fmt(amount, a.currency, { show: true })} added to ${a.name}.`);
    const plan = settlePlan(row);
    if (plan.length) setTimeout(() => settleSheet(row, plan), 450);
  }
  function salaryOther(r) {
    const a = acc(r.account_id);
    const input = h("input", { class: "input num", id: "pay-amt", inputmode: "decimal", value: String(Number(r.amount)), autocomplete: "off" });
    const err = h("p", { class: "form-err", role: "alert" });
    const body = h("div", { class: "form" },
      h("label", { class: "field" }, h("span", null, `How much did you get? (${curSymbol(a.currency)})`), input),
      h("label", { class: "check" }, h("input", { type: "checkbox", id: "pay-keep" }), h("span", null, "Use this amount every month from now on")),
      err,
      h("button", { type: "button", class: "btn alt", on: { click: () => { closeSheet(); confirmSalary(r, 0); toast("Skipped this month."); } } }, "I didn't get it this month"));
    const save = h("button", { type: "button", class: "btn", on: { click: () => {
      const v = parseAmt(input.value);
      if (!v) { err.textContent = tr("Enter an amount above zero."); return; }
      const keep = document.getElementById("pay-keep").checked;
      const rule = keep ? { ...r, amount: roundCur(v, a.currency) } : r;
      closeSheet();
      confirmSalary(rule, v);
    } } }, "Add it");
    openSheet("Your salary", body, save);
  }
  function salaryGuess() {
    const sc = rows("categories").filter(c => isSalaryCat(c)).sort((p, q) => /:cat:salary$/.test(q.id) - /:cat:salary$/.test(p.id))[0] || null;
    const rule = rows("rules").filter(r => isSalaryRule(r)).sort((p, q) => q.active - p.active)[0] || null;
    const last = rows("transactions").filter(x => x.kind === "income" && isSalaryCat(cat(x.category_id))).sort(byRecent)[0] || null;
    const accs = rows("accounts").filter(o => !o.archived).sort(bySort);
    const spendable = id => id && acc(id) && !acc(id).archived && acc(id).kind !== "savings";
    const pickAcc = rule && acc(rule.account_id) ? rule.account_id : [last && last.account_id, store.get("lastAcc:income", null), (accs.find(o => o.kind === "bank") || {}).id, (accs.find(o => o.kind !== "savings") || {}).id].find(spendable) || (accs[0] || {}).id || null;
    const a = acc(pickAcc);
    const plan = fixedIncome(thisMonth()) || 0;
    const amount = rule ? Number(rule.amount) : a && plan ? roundCur(convert(plan, mainCur(), a.currency), a.currency) : last ? roundCur(convert(Number(last.amount), last.currency, a ? a.currency : last.currency), a ? a.currency : last.currency) : 0;
    const day = rule ? rule.day : last ? Math.min(28, Number(last.occurred_on.slice(8)) || 1) : 1;
    return { cat: sc, rule, account: pickAcc, amount, day };
  }
  const salaryOn = () => rows("rules").some(r => r.active && isSalaryRule(r));
  function firstPayday(day) {
    const t = today();
    const [y, m] = t.split("-").map(Number);
    const dim = new Date(y, m, 0).getDate();
    const here = `${t.slice(0, 7)}-${String(Math.min(day, dim)).padStart(2, "0")}`;
    return here >= t ? here : nextMonthDay(here, day);
  }
  function salarySheet() {
    const g = salaryGuess();
    if (!g.cat) { toast("Add an income category named Salary first.", "error"); return; }
    const accs = rows("accounts").filter(o => !o.archived).sort(bySort);
    if (!accs.length) { toast("Add an account first."); return; }
    const f = { amount: g.amount ? String(g.amount) : "", account: g.account || accs[0].id, day: g.day };
    const editing = g.rule && g.rule.active;
    const err = h("p", { class: "form-err", role: "alert" });
    const amountIn = h("input", { id: "sal-amt", class: "input num", inputmode: "decimal", autocomplete: "off", placeholder: "0", value: f.amount, on: { input: e => { f.amount = e.target.value; } } });
    const accSel = h("select", { id: "sal-acc", class: "input", on: { change: e => { f.account = e.target.value; draw(); } } }, accs.map(o => h("option", { value: o.id, selected: o.id === f.account }, `${o.name} · ${o.currency}`)));
    const daySel = h("select", { id: "sal-day", class: "input", on: { change: e => { f.day = Number(e.target.value); draw(); } } }, Array.from({ length: 28 }, (_, i) => h("option", { value: String(i + 1), selected: i + 1 === f.day }, String(i + 1))));
    const preview = h("p", { class: "sal-preview" });
    const body = h("div", { class: "form" },
      h("p", { class: "hint" }, "Every month on payday, Home asks if your salary came in. Tap yes and it's added to your account. Nothing is added without your yes."),
      h("label", { class: "field" }, h("span", null, "How much do you get?"), amountIn),
      h("label", { class: "field" }, h("span", null, "Paid into"), accSel),
      h("label", { class: "field" }, h("span", null, "Payday (day of the month)"), daySel),
      preview, err,
      editing ? h("button", { type: "button", class: "btn alt danger-text", on: { click: () => { putMany([{ t: "rules", r: { ...g.rule, active: false } }]); closeSheet(); toast("Salary stopped. You can turn it on again anytime."); } } }, "Stop adding my salary") : null);
    const draw = () => {
      const a = acc(f.account);
      preview.replaceChildren(icon("cal", "ico sm"), h("span", null, `${tr("Next payday")}: ${dayLabel(firstPayday(f.day))}${a ? ` · ${a.name}` : ""}`));
      const sym = a ? curSymbol(a.currency) : "";
      amountIn.parentElement && (amountIn.parentElement.firstChild.textContent = `${tr("How much do you get?")} (${sym})`);
    };
    const save = h("button", { type: "button", class: "btn", on: { click: () => {
      const a = acc(f.account);
      const v = parseAmt(amountIn.value);
      if (!v) { err.textContent = tr("Enter an amount above zero."); amountIn.focus(); return; }
      const amount = roundCur(v, a.currency);
      const base = g.rule || { id: newId(), note: null };
      const keepNext = g.rule && g.rule.active && g.rule.day === f.day && DATE_RE.test(g.rule.next_on);
      putMany([{ t: "rules", r: { ...base, kind: "income", amount, currency: a.currency, account_id: a.id, category_id: g.cat.id, day: f.day, next_on: keepNext ? g.rule.next_on : firstPayday(f.day), active: true } }]);
      store.set("salSugOff", true);
      track("add", editing ? "salary_edit" : "salary_on");
      closeSheet();
      toast(editing ? "Salary updated." : "Done. On payday we'll ask you before adding it.");
    } } }, editing ? "Save" : "Turn it on");
    draw();
    openSheet(editing ? "Your salary" : "Add my salary every month", body, save);
  }
  function salarySuggest() {
    if (salaryOn() || store.get("salSugOff", false)) return null;
    const g = salaryGuess();
    if (!g.cat || !g.account) return null;
    const a = acc(g.account);
    return h("section", { class: "sal-teaser" },
      h("button", { type: "button", class: "split-teaser-x", "aria-label": "Hide", on: { click: () => { store.set("salSugOff", true); render(); } } }, icon("close", "ico sm")),
      h("span", { class: "payday-ico" }, icon("work")),
      h("div", null, h("strong", null, "Add your salary automatically?"), h("small", null, g.amount > 0 ? `${tr("Suggested")}: ${fmt(g.amount, a.currency, { show: true })} → ${a.name}. ${tr("You can change it.")}` : "Set it once. On payday we ask you, then add it to your account.")),
      h("button", { type: "button", class: "btn sm", on: { click: salarySheet } }, "Set it up"));
  }

  function paydayCard() {
    const r = dueSalary();
    if (!r) return null;
    const a = acc(r.account_id), c = cat(r.category_id);
    const late = r.next_on < today();
    return h("section", { class: "payday" },
      h("span", { class: "payday-ico" }, icon(c ? catIconName(c) || "work" : "work")),
      h("div", { class: "payday-main" },
        h("strong", null, late ? `Did your ${monthName(r.next_on.slice(0, 7))} salary come in?` : "Payday! Did your salary come in?"),
        h("small", null, `${fmt(Number(r.amount), r.currency || a.currency, { show: true })} → ${a.name}`)),
      h("div", { class: "payday-acts" },
        h("button", { type: "button", class: "btn sm", on: { click: () => confirmSalary(r, Number(r.amount)) } }, "Yes, add it"),
        h("button", { type: "button", class: "btn sm alt", on: { click: () => salaryOther(r) } }, "Other amount"),
        h("button", { type: "button", class: "link-btn", on: { click: () => { store.set("paySnooze:" + r.id, today()); render(); } } }, "Not yet")));
  }

  function runRules() {
    const t = today();
    const items = [];
    for (const r of rows("rules")) {
      if (!r.active || !acc(r.account_id) || !DATE_RE.test(r.next_on)) continue;
      if (isSalaryRule(r)) continue;
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
      if (x.kind === "income" || x.kind === "loan_in") add(x.account_id, amt);
      else if (x.kind === "expense" || x.kind === "loan_out") add(x.account_id, -amt);
      else {
        add(x.account_id, -amt);
        if (x.to_account_id) add(x.to_account_id, Number(x.to_amount) || 0);
      }
    }
    balMemo = { ver, value: b };
    return b;
  }

  function loanOnlyTx(m) {
    const linked = new Set();
    for (const x of rows("transactions")) if (String(x.id).startsWith("ln-")) linked.add(String(x.id).slice(3));
    const out = [];
    for (const e of rows("loan_entries")) {
      if (monthOf(e.occurred_on) !== m || linked.has(String(e.id)) || e.note === "Starting balance") continue;
      const p = S.data.people.get(e.person_id); if (!p) continue;
      const a = Number(e.amount) || 0; if (!a) continue;
      const lent = owesMe(p) ? a > 0 : a < 0;
      out.push({ id: "ln-" + e.id, kind: lent ? "loan_out" : "loan_in", amount: Math.abs(a), currency: p.currency, rate: rateOf(p.currency), account_id: null, to_account_id: null, category_id: null, note: e.note || null, occurred_on: e.occurred_on, created_at: e.created_at || "", virtual: true });
    }
    return out;
  }
  function monthStats(m) {
    const k = ver + ":" + m;
    if (memo.has(k)) return memo.get(k);
    const s = { spent: 0, income: 0, byCat: new Map(), buckets: Object.fromEntries(planGroups().map(g => [g.id, 0])), days: new Map(), biggest: null, count: 0 };
    for (const x of [...rows("transactions"), ...loanOnlyTx(m)]) {
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
      } else if (x.kind === "loan_out") {
        s.spent += u;
        s.count++;
        s.loanOut = (s.loanOut || 0) + u;
        s.byCat.set("__lent", (s.byCat.get("__lent") || 0) + u);
        s.days.set(x.occurred_on, (s.days.get(x.occurred_on) || 0) + u);
      } else if (x.kind === "loan_in") {
        s.income += u;
        s.loanIn = (s.loanIn || 0) + u;
      } else if (x.kind === "transfer") {
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
    track("view", view);
    S.armed = null;
    if (view === "settings") { S.setPage = null; loadPushState(); }
    if (view === "insights" || view === "plan") S.month = S.month || thisMonth();
    render();
    window.scrollTo(0, 0);
  }

  const VIEWS = {
    home: { title: "BudgetSplit", draw: viewHome },
    activity: { title: "Activity", draw: viewActivity },
    insights: { title: "Insights", draw: viewInsights },
    plan: { title: "Plan", draw: viewPlan },
    people: { title: "Split & loans", draw: viewPeople },
    admin: { title: "Admin", draw: viewAdmin },
    settings: { title: "Settings", draw: viewSettings }
  };

  function closeFan() {
    const f = document.querySelector(".add-fan");
    if (!f) return;
    f.classList.remove("open");
    setTimeout(() => f.remove(), 220);
  }
  function addFan() {
    if (document.querySelector(".add-fan")) return;
    const go2 = fn => () => { closeFan(); fn(); };
    const item = (k, ic, label, fn, disabled) => h("button", { type: "button", class: "fan-item k-" + k, disabled: !!disabled, on: { click: go2(fn) } }, h("span", { class: "fan-ico" }, icon(ic)), h("span", null, label));
    const many = rows("accounts").filter(a => !a.archived).length > 1;
    const fan = h("div", { class: "add-fan", on: { click: e => { if (e.target === fan) closeFan(); } } },
      h("div", { class: "fan-row" },
        item("expense", "down", "Spent", () => txnSheet(null, { kind: "expense" })),
        item("income", "up", "Received", () => txnSheet(null, { kind: "income" })),
        item("transfer", "swap", "Moved", () => txnSheet(null, { kind: "transfer" }), !many),
        item("loan", "coin", "Loan", () => txnSheet(null, { kind: "loan" })),
        item("split", "people", "Split", () => { go("people"); setTimeout(newGroupSheet, 300); }),
        item("bill", "bell", "Bill", () => billSheet(null))));
    document.body.append(fan);
    track("add", "hold_menu");
    requestAnimationFrame(() => fan.classList.add("open"));
    store.set("fanSeen", true);
  }
  function splitAttention() {
    let n = 0;
    for (const g of GROUPS.list.values()) {
      if (!g.joined) n++;
      else n += g.entries.filter(e => e.votes.length && !e.votes.includes(S.uid)).length;
    }
    const bal = loanBalances();
    for (const p of rows("people")) { const d = dueInfo(p); if (d && d.late && (bal.get(p.id) || 0) > 0) n++; }
    return n;
  }
  function paintSplitBadge() {
    const b = shell && shell.tabs[3] && shell.tabs[3].querySelector(".tab-badge");
    if (!b) return;
    const n = splitAttention();
    b.textContent = n ? String(Math.min(n, 9)) : "";
    b.classList.toggle("on", n > 0);
  }

  function buildShell() {
    const title = h("h1");
    const status = h("button", { type: "button", class: "status", on: { click: () => sync() } });
    const bell = h("button", { type: "button", class: "key bell-btn", "aria-label": "Notifications", on: { click: inboxSheet } }, icon("bell"), h("span", { class: "bell-badge" }));
    const eye = h("button", { type: "button", class: "key eye-btn", role: "switch", on: { click: () => { S.hidden = !S.hidden; store.set("hidden", S.hidden); render(); } } }, h("span", { class: "priv-knob" }));
    const help = h("button", { type: "button", class: "help-btn ask-pill", "aria-label": "Ask Gio", on: { click: assistantSheet } }, gioMark("gio ask-gio"), h("span", { class: "ask-tx" }, "Ask Gio"));
    const gear = h("button", { type: "button", class: "key gear-btn me-btn", "aria-label": "Settings", on: { click: () => go("settings") } }, h("span", { class: "me-init" }));
    const main = h("main", { class: "view" });
    const tab = (view, label, ic) => h("button", { type: "button", class: "tab", "data-view": view, on: { click: () => go(view) } }, icon(ic), h("span", null, label));
    const tabs = [tab("home", "Home", "home"), tab("activity", "Activity", "list"), tab("insights", "Insights", "chart"), tab("people", "Split", "people")];
    tabs[3].append(h("span", { class: "tab-badge", "aria-hidden": "true" }));
    let holdT = null, held = false;
    const add = h("button", { type: "button", class: "tab-add", "aria-label": "Add. Press and hold for more choices", on: {
      pointerdown: () => { held = false; clearTimeout(holdT); holdT = setTimeout(() => { held = true; if (navigator.vibrate) navigator.vibrate(10); addFan(); }, 420); },
      pointerup: () => clearTimeout(holdT), pointerleave: () => clearTimeout(holdT), pointercancel: () => clearTimeout(holdT),
      contextmenu: e => e.preventDefault(),
      click: () => { if (held) { held = false; return; } if (document.querySelector(".add-fan")) return closeFan(); txnSheet(null); }
    } }, h("span", { class: "tab-add-ring" }, icon("plus")));
    const lens = h("span", { class: "lens", "aria-hidden": "true" });
    const brand = h("div", { class: "side-brand" }, h("img", { src: "icons/icon-192-b.png", alt: "" }), h("span", null, ...brandMark()));
    const sideAdd = h("button", { type: "button", class: "side-add", on: { click: () => txnSheet(null) } }, icon("plus", "ico"), "New entry");
    const sideSettings = h("button", { type: "button", class: "tab side-only", "data-view": "settings", on: { click: () => go("settings") } }, icon("gear"), h("span", null, "Settings"));
    const tabsEl = h("div", { class: "tabs glass" }, lens, tabs[0], tabs[1], add, tabs[2], tabs[3], sideSettings);
    const ORDER = ["home", "activity", null, "insights", "people"];
    let drag = null, dragEnd = 0;
    const dragStop = () => { tabsEl.classList.remove("dragging"); tabs.forEach(t => t.classList.remove("over")); drag = null; };
    const snap = near => { const i = near; return ORDER[i] ? i : (S.view === "activity" || near < 2 ? 1 : 3); };
    tabsEl.addEventListener("pointerdown", e => {
      if (window.innerWidth >= 900 || (e.pointerType === "mouse" && e.button !== 0) || e.target.closest(".tab-add")) return;
      const r = tabsEl.getBoundingClientRect();
      drag = { id: e.pointerId, x0: e.clientX, left: r.left + 5, w: (r.width - 10) / 5, moved: false, pos: 0 };
    });
    tabsEl.addEventListener("pointermove", e => {
      if (!drag || e.pointerId !== drag.id) return;
      if (!drag.moved && Math.abs(e.clientX - drag.x0) < 8) return;
      if (!drag.moved) { drag.moved = true; try { tabsEl.setPointerCapture(e.pointerId); } catch { } tabsEl.classList.add("dragging"); }
      const pos = Math.max(0, Math.min(4 * drag.w, e.clientX - drag.left - drag.w / 2));
      drag.pos = pos;
      lens.style.transform = `translateX(${pos}px)`;
      const idx = snap(Math.round(pos / drag.w));
      tabs.forEach(t => t.classList.toggle("over", t.dataset.view === ORDER[idx]));
    });
    const dragDone = e => {
      if (!drag || e.pointerId !== drag.id) return;
      const d = drag;
      dragStop();
      if (!d.moved) return;
      dragEnd = Date.now();
      const view = ORDER[snap(Math.round(d.pos / d.w))];
      if (e.type === "pointerup" && view && view !== S.view) go(view); else render();
    };
    tabsEl.addEventListener("pointerup", dragDone);
    tabsEl.addEventListener("pointercancel", dragDone);
    tabsEl.addEventListener("click", e => { if (Date.now() - dragEnd < 400) { e.stopPropagation(); e.preventDefault(); } }, true);
    const nav = h("nav", { class: "dock", "aria-label": "Sections" }, brand, sideAdd, tabsEl);
    const top = h("header", { class: "top" }, title, h("div", { class: "tool keys" }, help, status, eye, bell, gear));
    const ptr = h("div", { class: "ptr", "aria-hidden": "true" }, icon("sync"));
    root.replaceChildren(h("div", { class: "shell" }, top, ptr, main, nav));
    shell = { title, status, eye, bell, gear, main, tabs: [...tabs, sideSettings], top, ptr, lens, lastView: null };
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
    el.className = cls + (!text && !(!navigator.onLine || S.offline) ? " quiet" : "");
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
    if (v.title === "BudgetSplit") shell.title.replaceChildren(...brandMark());
    else shell.title.textContent = tr(v.title);
    shell.eye.querySelector(".priv-knob").replaceChildren(icon(S.hidden ? "eyeOff" : "eye"));
    shell.eye.classList.toggle("on", !!S.hidden);
    shell.eye.setAttribute("aria-checked", String(!!S.hidden));
    { const nm = String(settings().name || (S.session && S.session.user && S.session.user.email) || "").trim(); const init = shell.gear.querySelector(".me-init"); const t = nm ? nm[0].toUpperCase() : ""; if (init.textContent !== t) init.textContent = t; if (!t && !init.firstChild) init.append(icon("user")); }
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
    const tabIndex = ["home", "activity", null, "insights", "people"].indexOf(S.view === "plan" ? "insights" : S.view);
    shell.lens.style.opacity = tabIndex < 0 ? "0" : "1";
    if (tabIndex >= 0) shell.lens.style.transform = `translateX(${tabIndex * 100}%)`;
    paintSplitBadge();
    renderStatus();
    paintBell();
    maybeTour();
    maybeWhatsNew();
    maybeMonthlyReport();
    queueQuickSummary();
    queueQuickLists();
    queueFx(!sameView);
  }

  function renderSetup() {
    shell = null;
    root.replaceChildren(h("div", { class: "auth" }, h("div", { class: "auth-box" },
      h("img", { class: "auth-mark", src: "icons/icon-192-b.png", alt: "" }),
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

  const knownDevice = () => {
    try {
      if (localStorage.getItem("wallet:known") === "1") return true;
      for (let i = 0; i < localStorage.length; i++) if (String(localStorage.key(i)).startsWith("wallet:v1:")) return true;
    } catch { }
    return false;
  };
  function renderAuth() {
    shell = null;
    let mode = knownDevice() || isOAuth() ? "signin" : "create";
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
          : h("div", { class: "login-title" }, h("h2", null, create ? "Create your free account" : "Welcome back"), h("p", null, create ? "Track spending, plan your month and split bills with friends." : "Sign in to see your accounts and shared groups.")),
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
        forgot ? null : h("p", { class: "login-switch" }, create ? "Already have an account?" : "New to BudgetSplit?", " ", h("button", { type: "button", class: "link-btn", on: { click: () => { mode = create ? "signin" : "create"; err.textContent = ""; draw(); } } }, create ? "Sign in" : "Create an account")),
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
        orb(380, "login-orb"),
        h("div", { class: "login-brand" },
          h("img", { class: "login-logo", src: "icons/icon-192-b.png", alt: "" }),
          h("h1", null, ...brandMark()),
          h("p", null, "Budget, track spending, split bills and loans.")),
        h("div", { class: "login-card", "aria-hidden": "true" },
          h("span", { class: "fx-glare" }),
          h("span", { class: "lc-label" }, "Total balance"),
          h("span", { class: "lc-total num" }, "$2,450"),
          h("span", { class: "lc-row" }, h("i", { class: "lc-bar a" }), h("i", { class: "lc-bar b" }), h("i", { class: "lc-bar c" }))),
        h("ul", { class: "login-perks" },
          h("li", null, icon("chart", "ico sm"), "Insights"),
          h("li", null, icon("plan", "ico sm"), "Budgets"),
          h("li", null, icon("people", "ico sm"), "Split bills"))),
      panel));
    queueFx();
  }

  const isLoanTx = x => x.kind === "loan_out" || x.kind === "loan_in";
  const loanOf = x => { const lid = String(x.id).replace(/^ln-/, ""); const e = S.data.loan_entries.get(lid) || (lid.startsWith("se-") ? virtualEntry(lid) : null); const p = e && S.data.people.get(e.person_id); return { e, p }; };
  function loanTitle(x) {
    const { p } = loanOf(x);
    const name = p ? p.name : tr("someone");
    return x.kind === "loan_out" ? `${tr("You gave")} ${name}` : `${name} ${tr("gave you")}`;
  }


  function loanAccount(p) {
    const list = rows("accounts").filter(a => !a.archived).sort(bySort);
    const saved = store.get("loanAcc:" + p.id, null);
    if (saved && list.some(a => a.id === saved)) return saved;
    const same = list.find(a => a.currency === p.currency && a.kind === "cash") || list.find(a => a.currency === p.currency);
    return same ? same.id : null;
  }

  const addKids = (el, ...kids) => el.append(...kids.flat(Infinity).filter(k => k != null && k !== false));
  const rowDate = d => DATE_RE.test(String(d)) ? dfmt(d.slice(0, 4) !== today().slice(0, 4) ? { day: "numeric", month: "short", year: "numeric" } : { day: "numeric", month: "short" }).format(new Date(d + "T12:00:00")) : null;

  function txnRow(x) {
    if (isLoanTx(x)) {
      const a = acc(x.account_id);
      const { p } = loanOf(x);
      const out = x.kind === "loan_out";
      const gx = String(x.id).startsWith("gx-") ? groupOfTx(x) : null;
      const title = gx ? `${out ? "Paid" : "Received"} · ${gx.g.meta.name}` : String(x.id).startsWith("gx-") ? (out ? "Paid for a shared group" : "Received from a shared group") : loanTitle(x);
      return h("button", { type: "button", class: "row", on: { click: () => { if (gx) groupSheet(gx.g.id); else if (p) personSheet(p); } } },
        h("span", { class: "dot neutral" }, icon("people", "ico sm")),
        h("span", { class: "row-main" }, h("span", { class: "row-title" }, title, h("em", { class: "loan-tag" }, "Loan")), h("span", { class: "row-sub" }, [rowDate(x.occurred_on), x.note, a ? a.name : null].filter(Boolean).join(" · "))),
        h("span", { class: "row-end" + (out ? " neg" : " pos") }, (out ? "−" : "+") + fmt(Number(x.amount), x.currency), x.currency !== mainCur() ? h("small", null, "≈ " + money(txMain(x))) : null));
    }
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
    const sub = [rowDate(x.occurred_on), x.note, x.kind !== "transfer" && a ? a.name : null, x.rule_id ? "Monthly" : null, x.receipt ? "Receipt" : null].filter(Boolean).join(" · ");
    const toAcc = acc(x.to_account_id);
    const other = x.kind === "transfer" && toAcc && toAcc.currency !== x.currency && x.to_amount
      ? h("small", null, "→ " + fmt(Number(x.to_amount), toAcc.currency))
      : (x.currency !== mainCur() ? h("small", null, "≈ " + money(txMain(x))) : null);
    return h("div", { class: "swipe", id: "tx-" + x.id, "data-sw": x.id },
      h("button", { type: "button", class: "sw-act sw-edit", tabindex: "-1", "aria-hidden": "true" }, h("span", { class: "sw-in" }, icon("pencil", "ico sm"), "Edit")),
      h("button", { type: "button", class: "sw-act sw-del", tabindex: "-1", "aria-hidden": "true" }, h("span", { class: "sw-in" }, icon("trash", "ico sm"), "Delete")),
      h("button", { type: "button", class: "row sw-front", on: { click: () => txnSheet(x) } },
        dot,
        h("span", { class: "row-main" }, h("span", { class: "row-title" }, title), sub ? h("span", { class: "row-sub" }, sub) : null),
        h("span", { class: cls }, sign + fmt(Number(x.amount), x.currency), other)));
  }

  function confirmDelete(x) {
    const c = cat(x.category_id), a = acc(x.account_id), to = acc(x.to_account_id);
    const what = x.kind === "transfer" ? `${a ? a.name : "Account"} → ${to ? to.name : "Account"}` : c ? c.name : x.kind === "income" ? "Income" : "Uncategorized";
    const btn = h("button", { type: "button", class: "btn danger", on: { click: () => {
      const cur = S.data.transactions.get(x.id);
      if (cur) removeRow("transactions", cur);
      closeSheet();
      toast("Entry deleted.");
    } } }, icon("trash", "ico sm"), "Delete");
    const body = h("div", { class: "form" },
      h("p", null, `Delete ${what} of ${fmt(Number(x.amount), x.currency, { show: true })} from ${rowDate(x.occurred_on)}${x.note ? ` (${x.note})` : ""}?`),
      h("p", { class: "hint" }, "Your account balance goes back to what it was before this entry. This can't be undone."),
      h("button", { type: "button", class: "btn alt", on: { click: closeSheet } }, "Keep it"));
    openSheet("Delete entry?", body, btn);
  }

  const SW = { el: null, open: null, x0: 0, y0: 0, dx: 0, on: false, eat: 0, t0: 0, w: 92 };
  const swW = el => { const t = el.querySelector(".sw-del .sw-in"); return Math.max(88, Math.min(el.offsetWidth * 0.45, (t ? t.offsetWidth : 60) + 44)); };
  const swShut = el => { if (!el) return; el.classList.remove("sw-l", "sw-r", "sw-drag"); const f = el.querySelector(".sw-front"); if (f) f.style.transform = ""; if (SW.open === el) SW.open = null; };
  function initSwipe() {
    const rtl = () => document.dir === "rtl" ? -1 : 1;
    const start = (x, y, target) => {
      const el = target.closest && target.closest(".swipe");
      if (SW.open && SW.open !== el) { swShut(SW.open); if (!el && !target.closest(".sheet")) SW.eat = Date.now() + 500; }
      if (!el || !target.closest(".sw-front")) return;
      SW.el = el; SW.x0 = x; SW.y0 = y; SW.dx = 0; SW.on = false; SW.t0 = Date.now(); SW.w = swW(el);
      SW.base = SW.open === el ? (el.classList.contains("sw-l") ? -SW.w : SW.w) : 0;
    };
    const move = (x, y) => {
      const el = SW.el;
      if (!el) return false;
      const dx = x - SW.x0, dy = y - SW.y0;
      if (!SW.on) {
        if (Math.abs(dy) > 8 && Math.abs(dy) > Math.abs(dx) * 0.8) { SW.el = null; return false; }
        if (Math.abs(dx) < 8) return false;
        SW.on = true; SW.x0 = x; el.classList.add("sw-drag");
        return true;
      }
      let v = SW.base + (x - SW.x0) * rtl();
      v = Math.max(-el.offsetWidth * 0.8, Math.min(el.offsetWidth * 0.6, v));
      SW.dx = v;
      el.classList.toggle("sw-l", v < 0); el.classList.toggle("sw-r", v > 0);
      el.querySelector(".sw-front").style.transform = `translateX(${v * rtl()}px)`;
      return true;
    };
    const end = () => {
      const el = SW.el;
      SW.el = null;
      if (!el || !SW.on) return;
      SW.eat = Date.now() + 500;
      el.classList.remove("sw-drag");
      const W = SW.w, v = SW.dx, f = el.querySelector(".sw-front"), fast = Date.now() - SW.t0 < 260;
      const x = S.data.transactions.get(el.dataset.sw);
      const moved = v - SW.base;
      if (x && (v > W * 0.9 || (fast && moved > 40 && SW.base >= 0))) { swShut(el); txnSheet(x); return; }
      if (v < -W * 0.5 || (fast && moved < -40)) { el.classList.add("sw-l"); el.classList.remove("sw-r"); f.style.transform = `translateX(${-W * rtl()}px)`; SW.open = el; return; }
      swShut(el);
    };
    const cancel = () => { if (SW.el && SW.on) end(); else SW.el = null; };
    document.addEventListener("touchstart", e => { if (e.touches.length > 1) { cancel(); return; } const t = e.touches[0]; start(t.clientX, t.clientY, e.target); }, { capture: true, passive: true });
    document.addEventListener("touchmove", e => { if (!SW.el) return; const t = e.touches[0]; if (move(t.clientX, t.clientY) && e.cancelable) e.preventDefault(); }, { capture: true, passive: false });
    document.addEventListener("touchend", end, true);
    document.addEventListener("touchcancel", cancel, true);
    document.addEventListener("pointerdown", e => { if (e.pointerType === "touch" || e.button > 0) return; start(e.clientX, e.clientY, e.target); }, true);
    document.addEventListener("pointermove", e => { if (e.pointerType !== "touch") move(e.clientX, e.clientY); }, true);
    document.addEventListener("pointerup", e => { if (e.pointerType !== "touch") end(); }, true);
    document.addEventListener("pointercancel", e => { if (e.pointerType !== "touch") cancel(); }, true);
    document.addEventListener("contextmenu", e => { if (SW.on || (e.target.closest && e.target.closest(".swipe"))) e.preventDefault(); }, true);
    document.addEventListener("click", e => {
      const act = e.target.closest && e.target.closest(".sw-act");
      if (SW.eat > Date.now() && !act) { SW.eat = 0; e.preventDefault(); e.stopPropagation(); return; }
      if (!act) return;
      e.preventDefault(); e.stopPropagation();
      const el = act.closest(".swipe"), x = S.data.transactions.get(el.dataset.sw);
      swShut(el);
      if (!x) return;
      if (act.classList.contains("sw-del")) confirmDelete(x); else txnSheet(x);
    }, true);
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
  const goalAcc = g => { const a = g.account ? acc(g.account) : null; return a && !a.deleted_at ? a : null; };
  const goalSaved = g => { const a = goalAcc(g); return a ? Math.max(0, toMain(balances().get(a.id) || 0, a.currency)) : g.saved; };
  const goalNeed = g => {
    const left = Math.max(0, g.target - goalSaved(g));
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
      const saved = goalSaved(g);
      const pct = Math.min(100, saved / g.target * 100);
      card.append(h("button", { type: "button", class: "cat-row", on: { click: () => goalSheet(g) } },
        h("div", { class: "cat-line" }, h("span", { class: "swatch", style: { background: g.color } }), h("span", { class: "name" }, g.name), h("span", { class: "val" }, `${money(saved, { whole: true })} / ${money(g.target, { whole: true })}`)),
        h("div", { class: "bar" }, h("span", { style: { width: pct + "%", background: g.color } })),
        h("span", { class: "goal-sub" + (n.late ? " neg" : "") }, !n.left ? "Goal reached" : n.late ? `${money(n.left, { whole: true })} to go · target date passed` : g.by ? `${money(n.perMonth, { whole: true })} a month until ${monthLabel(g.by)}` : `${money(n.left, { whole: true })} to go`)));
    }
    if (!goals.length) card.append(h("p", { class: "empty" }, "Set a target, such as an emergency fund or a trip, and see how much to put aside each month."));
    return card;
  }

  function goalSheet(g) {
    track("goal", g ? "open" : "new");
    const st = settings();
    const cur = mainCur();
    const accounts = rows("accounts").filter(a => !a.archived).sort(bySort);
    const linked = g ? goalAcc(g) : null;
    const f = { name: g ? g.name : "", target: g ? String(g.target) : "", by: g ? g.by : "", account: g ? (linked ? linked.id : "") : (accounts.find(a => a.kind === "savings") || {}).id || "" };
    const otherAcc = a => accounts.find(o => o.id !== a.id && o.currency === a.currency && o.kind !== "savings") || accounts.find(o => o.id !== a.id);
    const moveLinked = sign => {
      const a = linked, o = otherAcc(a);
      if (!o) { toast("Add another account to move money from."); return; }
      closeSheet();
      setTimeout(() => txnSheet(null, sign > 0 ? { kind: "transfer", account: o.id, to: a.id, note: g.name } : { kind: "transfer", account: a.id, to: o.id, note: g.name }), 320);
    };
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
      const saved = goalSaved(g);
      body.append(h("div", { class: "goal-top" },
        h("p", { class: "income-big num" }, fmt(saved, cur, { whole: true })),
        h("p", { class: "hint" }, `of ${fmt(g.target, cur, { whole: true, show: true })}${n.left ? ` · ${fmt(n.left, cur, { whole: true, show: true })} to go` : " · reached"}`),
        h("div", { class: "bar" }, h("span", { style: { width: Math.min(100, saved / g.target * 100) + "%", background: g.color } })),
        linked ? h("p", { class: "hint goal-link" }, icon("swap", "ico sm"), `Follows the balance of ${linked.name}`) : null,
        h("div", { class: "inline" },
          h("button", { type: "button", class: "btn", on: { click: () => linked ? moveLinked(1) : move(1) } }, linked ? `Move money in` : "Add money"),
          h("button", { type: "button", class: "btn alt", disabled: !(saved > 0), on: { click: () => linked ? moveLinked(-1) : move(-1) } }, "Take out"))));
    }
    body.append(
      h("label", { class: "field" }, h("span", null, "Name"), h("input", { id: "g-name", class: "input", maxlength: "40", autocomplete: "off", placeholder: "e.g. Emergency fund", value: f.name, on: { input: e => { f.name = e.target.value; } } })),
      h("label", { class: "field" }, h("span", null, `Target amount (${curSymbol(cur)})`), h("input", { id: "g-target", class: "input num", inputmode: "decimal", autocomplete: "off", placeholder: "e.g. 5000", value: f.target, on: { input: e => { f.target = e.target.value; } } })),
      h("label", { class: "field" }, h("span", null, "Target month (optional)"), h("input", { id: "g-by", class: "input", type: "month", min: thisMonth(), value: f.by, on: { input: e => { f.by = e.target.value; } } })),
      h("label", { class: "field" }, h("span", null, "Linked account"),
        h("select", { id: "g-acc", class: "input", on: { change: e => { f.account = e.target.value; } } },
          h("option", { value: "", selected: !f.account }, "None, I'll add money by hand"),
          accounts.map(a => h("option", { value: a.id, selected: f.account === a.id }, `${a.name} · ${fmt(balances().get(a.id) || 0, a.currency)}`))),
        h("small", { class: "hint" }, "When linked, the goal follows that account's balance.")),
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
        ? st.goals.map(x => x.id === g.id ? { ...x, name, target, by: f.by, account: f.account } : x)
        : [...st.goals, { id: newId(), name, target, saved: 0, by: f.by, account: f.account, color: COLORS[st.goals.length % COLORS.length] }];
      saveGoals(next);
      closeSheet();
      toast(g ? "Goal saved." : "Goal added.");
    });
    openSheet(g ? g.name : "New goal", body, h("button", { type: "submit", class: "btn", form: "goal-form" }, g ? "Save changes" : "Add goal"));
  }

  const isBill = r => r.remind != null && r.kind === "expense";
  const daysTo = d => Math.round((new Date(d + "T12:00:00") - new Date(today() + "T12:00:00")) / 864e5);
  function upcomingRules(days) {
    const t = today();
    const end = ymd(new Date(Date.now() + days * 864e5));
    return rows("rules").filter(r => acc(r.account_id) && DATE_RE.test(r.next_on) && ((isBill(r) && r.next_on <= end) || (r.active && r.next_on >= t && r.next_on <= end))).sort((a, b) => a.next_on.localeCompare(b.next_on));
  }

  function payBill(r) {
    txnSheet(null, { kind: "expense", amount: String(Number(r.amount)), account: r.account_id, category: r.category_id, note: r.note || "", bill: r.id });
  }

  const BILL_TEMPLATES = () => (mainCur() === "USD" || mainCur() === "LBP"
    ? [["Generator", "generator", "bolt"], ["Electricity (EDL)", "generator", "bolt"], ["Internet", "bills", "wifi"], ["Phone", "bills", "wifi"], ["Rent", "home", "home"], ["School fees", null, "work"], ["Water", "bills", "home"]]
    : [["Rent", "home", "home"], ["Electricity", "bills", "bolt"], ["Internet", "bills", "wifi"], ["Phone", "bills", "wifi"], ["School fees", null, "work"], ["Water", "bills", "home"]]);

  function billSheet(r) {
    const accounts = rows("accounts").filter(a => !a.archived).sort(bySort);
    if (!accounts.length) { toast("Add an account first."); return; }
    const f = r
      ? { name: r.note || "", amount: String(Number(r.amount)), day: String(r.day), account: r.account_id, category: r.category_id, remind: r.remind ?? 3, auto: !!r.active }
      : { name: "", amount: "", day: "", account: (accounts.find(a => a.kind === "cash") || accounts[0]).id, category: null, remind: 3, auto: false };
    const body = h("form", { class: "form", id: "bill-form", novalidate: true });
    const err = h("p", { class: "form-err", role: "alert" });
    let armedDelete = false;
    const draw = () => {
      const a = acc(f.account) || accounts[0];
      const kids = [
        r ? null : h("div", { class: "chips wrap" }, BILL_TEMPLATES().map(([n, ck, ic]) => h("button", { type: "button", class: "chip", "aria-pressed": String(f.name === tr(n)), on: { click: () => { f.name = tr(n); const c = ck && S.data.categories.get(`${S.uid}:cat:${ck}`); f.category = c ? c.id : f.category; draw(); } } }, icon(ic, "ico sm"), n))),
        h("label", { class: "field" }, h("span", null, "Bill name"), h("input", { id: "b-name", class: "input", maxlength: "60", autocomplete: "off", placeholder: "e.g. Generator", value: f.name, on: { input: e => { f.name = e.target.value; } } })),
        h("div", { class: "two" },
          h("label", { class: "field" }, h("span", null, `Usual amount (${curSymbol(a.currency)})`), h("input", { id: "b-amt", class: "input num", inputmode: "decimal", autocomplete: "off", placeholder: "0", value: f.amount, on: { input: e => { f.amount = e.target.value; } } })),
          h("label", { class: "field" }, h("span", null, "Due on day"), h("input", { id: "b-day", class: "input num", inputmode: "numeric", autocomplete: "off", placeholder: "1 to 28", value: f.day, on: { input: e => { f.day = e.target.value; } } }))),
        h("label", { class: "field" }, h("span", null, "Paid from"), h("select", { id: "b-acc", class: "input", on: { change: e => { f.account = e.target.value; draw(); } } }, accounts.map(o => h("option", { value: o.id, selected: o.id === f.account }, `${o.name} (${o.currency})`)))),
        h("div", { class: "field" }, h("span", { class: "label" }, "Remind me"), h("div", { class: "chips wrap" }, [[0, "On the day"], [1, "1 day before"], [3, "3 days before"], [7, "A week before"]].map(([d, l]) => h("button", { type: "button", class: "chip", "aria-pressed": String(f.remind === d), on: { click: () => { f.remind = d; draw(); } } }, l)))),
        h("label", { class: "check" }, h("input", { id: "b-auto", type: "checkbox", checked: f.auto, on: { change: e => { f.auto = e.target.checked; } } }), "The amount is always the same: add the expense automatically"),
        h("p", { class: "hint" }, f.auto ? "On the due day the expense is added for you." : "On the due day you tap Pay and confirm the real amount."),
        err,
        r ? h("button", { type: "button", class: "btn danger" + (armedDelete ? " sure" : ""), on: { click: () => { if (!armedDelete) { armedDelete = true; draw(); return; } removeRow("rules", r); closeSheet(); toast("Bill removed. Past payments stay."); } } }, armedDelete ? "Tap again to remove" : "Remove bill") : null
      ];
      keepFocus(() => body.replaceChildren(...kids.filter(Boolean)));
    };
    body.addEventListener("submit", ev => {
      ev.preventDefault();
      const name = f.name.trim().replace(/\s+/g, " ").slice(0, 60);
      const amount = parseAmt(f.amount);
      const day = Number(f.day);
      const a = acc(f.account);
      if (!name) return fail(err, "Give the bill a name.", document.getElementById("b-name"));
      if (!amount) return fail(err, "Enter the usual amount. You can change it when you pay.", document.getElementById("b-amt"));
      if (!Number.isInteger(day) || day < 1 || day > 28) return fail(err, "Pick a day from 1 to 28.", document.getElementById("b-day"));
      if (!a) return fail(err, "Pick an account.");
      const t = today();
      let next = r && r.day === day ? r.next_on : null;
      if (!next) { const cand = `${t.slice(0, 7)}-${pad(day)}`; next = cand >= t ? cand : nextMonthDay(cand, day); }
      put("rules", { ...(r || {}), id: r ? r.id : newId(), kind: "expense", amount: roundCur(amount, a.currency), currency: a.currency, account_id: a.id, category_id: f.category || null, note: name, day, next_on: next, active: f.auto, remind: f.remind });
      closeSheet();
      toast(r ? "Bill saved." : `${name} added. We'll remind you ${f.remind === 0 ? "on the day" : f.remind === 1 ? "the day before" : `${f.remind} days before`}.`);
    });
    draw();
    openSheet(r ? f.name || "Bill" : "Add a bill", body, h("button", { type: "submit", class: "btn", form: "bill-form" }, r ? "Save" : "Add bill"));
  }

  function upcomingRow(r) {
    const c = cat(r.category_id);
    const d = daysTo(r.next_on);
    const bill = isBill(r);
    const when = d < 0 ? (d === -1 ? tr("Due yesterday") : `${-d} ${tr("days late")}`) : d === 0 ? tr("Due today") : d === 1 ? tr("Tomorrow") : `${tr("In")} ${d} ${tr("days")}`;
    const dt = new Date(r.next_on + "T12:00:00");
    return h("div", { class: "row bill-row up-row" + (bill && d <= 0 ? " due" : "") },
      h("button", { type: "button", class: "row-hit", "aria-label": r.note || (c ? c.name : "Bill"), on: { click: () => bill ? billSheet(r) : ruleSheet(r) } }),
      h("span", { class: "up-date" + (d <= 0 ? " now" : d <= 3 ? " soon" : "") }, h("b", { class: "num" }, String(dt.getDate())), h("small", null, dfmt({ month: "short" }).format(dt))),
      h("span", { class: "row-main" }, h("span", { class: "row-title" }, r.note || (c ? c.name : "Repeating entry")), h("span", { class: "row-sub" + (bill && d < 0 ? " late" : "") }, [when, bill ? tr("Bill") : r.active ? tr("Added automatically") : null, (acc(r.account_id) || {}).name].filter(Boolean).join(" · "))),
      bill && !r.active ? h("button", { type: "button", class: "chip on pay-chip", on: { click: () => payBill(r) } }, `${tr("Pay")} ${fmt(Number(r.amount), r.currency, { whole: true })}`) : h("span", { class: "row-end num " + (r.kind === "income" ? "pos" : "neg") }, (r.kind === "income" ? "+" : "−") + fmt(Number(r.amount), r.currency, { whole: true })));
  }
  function upcomingAll() {
    const list = upcomingRules(90);
    const out = toMain(list.filter(r => r.kind !== "income").reduce((t, r) => t + toMain(Number(r.amount), r.currency), 0), mainCur());
    const body = h("div", { class: "stack" },
      h("div", { class: "mk-hero k-expense" }, h("small", null, "Next 90 days"), h("strong", { class: "num" }, money(out, { whole: true })), h("span", null, `${list.length} ${tr(list.length === 1 ? "payment" : "payments")}`)),
      list.length ? h("section", { class: "card flush" }, list.map(upcomingRow)) : h("p", { class: "empty" }, "Nothing scheduled."),
      h("button", { type: "button", class: "btn alt", on: { click: () => { closeSheet(); setTimeout(() => billSheet(null), 300); } } }, icon("plus", "ico sm"), "Add a bill"));
    openSheet("Coming up", body, null, { fill: true });
  }
  function upcomingCard() {
    const list = upcomingRules(30);
    const hasBills = rows("rules").some(isBill);
    if (!list.length) {
      if (hasBills || store.get("billTeaserOff", false)) return null;
      return h("section", { class: "bill-teaser" },
        h("button", { type: "button", class: "split-teaser-x", "aria-label": "Hide", on: { click: () => { store.set("billTeaserOff", true); render(); } } }, icon("close", "ico sm")),
        h("span", { class: "bill-badge" }, icon("bell", "ico sm")),
        h("div", null, h("strong", null, "Never miss a bill"), h("small", null, (mainCur() === "USD" || mainCur() === "LBP") ? "Generator, internet, rent, school fees… Get a reminder before each one is due." : "Rent, internet, phone, school fees… Get a reminder before each one is due.")),
        h("button", { type: "button", class: "btn sm", on: { click: () => billSheet(null) } }, "Add a bill"));
    }
    const due = list.filter(r => r.kind !== "income").reduce((t, r) => t + toMain(Number(r.amount), r.currency), 0);
    const week = list.filter(r => r.kind !== "income" && daysTo(r.next_on) <= 7).reduce((t, r) => t + toMain(Number(r.amount), r.currency), 0);
    return h("section", { class: "card flush up-card" },
      h("div", { class: "card-head" }, h("h2", null, "Coming up"), h("button", { type: "button", class: "link-btn", on: { click: upcomingAll } }, "See all")),
      h("div", { class: "up-sum" }, h("div", null, h("small", null, "This week"), h("b", { class: "num" }, money(week, { whole: true }))), h("div", null, h("small", null, "Next 30 days"), h("b", { class: "num" }, money(due, { whole: true })))),
      list.slice(0, 4).map(upcomingRow),
      list.length > 4 ? h("button", { type: "button", class: "row-btn", on: { click: upcomingAll } }, `${tr("See all")} ${list.length}`) : null);
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
    if (PUSH.state === null) {
      const known = store.get("pushState", null);
      loadPushState();
      if (!known) return null;
      PUSH.state = known.state; PUSH.time = known.time;
    }
    if (PUSH.state !== "off" && PUSH.state !== "install") return null;
    const later = h("button", { type: "button", class: "btn alt", on: { click: () => { store.set("remindAsk", "no"); render(); toast("You can turn it on later in Settings."); } } }, "Not now");
    if (PUSH.state === "install") return h("section", { class: "card remind" },
      h("div", { class: "remind-top" }, h("span", { class: "dot gold" }, icon("bell", "ico sm")), h("div", null, h("h2", null, "Get a daily reminder"), h("p", null, "Add BudgetSplit to your Home Screen first, then open it from there."))),
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
      if (on) { go("settings"); settingsOpen("notifications"); return; }
      if (PUSH.state === "install") return toast("Add BudgetSplit to your Home Screen first, then open it from there.");
      if (PUSH.state === "denied") return toast("Notifications are blocked. Allow them in iPhone Settings → Notifications → Wallet.", "error");
      if (PUSH.state === "unsupported") return toast("This browser can't show notifications.", "error");
      reminderSheet();
    };
    return h("button", { type: "button", class: "remind-pill" + (on ? " on" : ""), on: { click: act } },
      h("span", { class: "dot " + (on ? "neutral" : "gold") }, icon("bell", "ico sm")),
      h("span", { class: "row-main" }, h("span", { class: "row-title" }, on ? "Daily reminder is on" : "Turn on the daily reminder"), h("span", { class: "row-sub" }, on ? `Every day at ${PUSH.time || "21:00"}` : "Get a notification to log what you spent.")),
      on ? icon("fwd") : h("span", { class: "pill-cta" }, "Turn on"));
  }

  function budgetSheet(alerts) {
    track("budgets");
    openSheet("Budgets to check", h("div", { class: "bud-list" },
      alerts.map(a => {
        const over = a.spent > a.budget;
        const pct = Math.min(100, a.spent / a.budget * 100);
        return h("div", { class: "bud-item" },
          h("span", { class: "cat-ico sm", style: { background: a.c.color } }, catGlyph(a.c, "ico sm")),
          h("span", { class: "bud-main" },
            h("span", { class: "bud-top" }, h("strong", null, a.c.name), h("span", { class: "num bud-amt" + (over ? " over" : "") }, over ? `+${money(a.spent - a.budget, { whole: true })}` : `${Math.round(a.spent / a.budget * 100)}%`)),
            h("span", { class: "bar" }, h("span", { class: over ? "soft-over" : "", style: { width: pct + "%" } })),
            h("small", null, `${money(a.spent, { whole: true })} of ${money(a.budget, { whole: true })}`)));
      }),
      h("button", { type: "button", class: "btn alt", on: { click: () => { closeSheet(); setTimeout(() => go("insights"), 300); } } }, "Open Insights")));
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

  const PRICE_TTL = 10 * 60 * 1000;
  let priceLoading = false;
  const holdings = () => settings().holdings;
  const holdKey = x => x.type === "gold" || x.type === "silver" ? `metal:${x.type}` : x.type === "crypto" ? `crypto:${x.sym}` : x.type === "stock" ? `stock:${String(x.sym).toUpperCase()}` : null;
  const priceOf = x => { const k = holdKey(x); return k ? (store.get("prices", {})[k] || null) : null; };
  const OZ = 31.1034768;
  function holdUSD(x) {
    if (x.type === "other") return x.value ? convert(x.value, x.valCur || mainCur(), "USD") : null;
    const p = priceOf(x);
    if (!p || !(p.usd >= 0)) return null;
    if (x.type === "gold" || x.type === "silver") {
      const grams = x.unit === "oz" ? x.qty * OZ : x.unit === "kg" ? x.qty * 1000 : x.qty;
      return grams / OZ * p.usd * (x.type === "gold" ? x.karat / 24 : 1);
    }
    return x.qty * p.usd;
  }
  const holdMain = x => { const v = holdUSD(x); return v == null ? null : convert(v, "USD", mainCur()); };
  const costMain = x => x.cost ? convert(x.cost, x.costCur || mainCur(), mainCur()) : null;
  function holdTotals() {
    let value = 0, cost = 0, costed = 0, missing = 0;
    for (const x of holdings()) {
      const v = holdMain(x);
      if (v == null) { missing++; continue; }
      value += v;
      const c = costMain(x);
      if (c != null) { cost += c; costed += v; }
    }
    return { value, cost, costed, missing, gain: cost ? costed - cost : null };
  }
  async function loadPrices(force, extra) {
    const keys = [...new Set([...holdings().map(holdKey), ...(extra || [])].filter(Boolean))];
    if (!keys.length || priceLoading || !S.session || !navigator.onLine) return;
    const cache = store.get("prices", {});
    const stale = keys.filter(k => !cache[k] || Date.now() - new Date(cache[k].at).getTime() > PRICE_TTL);
    if (!force && !stale.length) return;
    priceLoading = true;
    try {
      const { data, error } = await sb.functions.invoke("prices", { body: { keys: force ? keys : stale } });
      if (!error && data && data.prices) {
        const next = { ...store.get("prices", {}) };
        for (const [k, v] of Object.entries(data.prices)) if (v && Number(v.usd) >= 0) next[k] = { usd: Number(v.usd), chg: Number.isFinite(Number(v.chg)) ? Number(v.chg) : null, at: v.at || new Date().toISOString() };
        store.set("prices", next);
        render();
      }
    } catch { } finally { priceLoading = false; }
  }
  const holdIcon = x => { const [ic, c] = HOLD_META[x.type]; return h("span", { class: "dot", style: { background: x.type === "crypto" ? "#e8892b" : c } }, x.type === "crypto" ? h("span", { class: "hold-tick" }, (CRYPTOS.find(k => k[0] === x.sym) || [, "?"])[1].slice(0, 4)) : x.type === "stock" ? h("span", { class: "hold-tick" }, String(x.sym).toUpperCase().slice(0, 4)) : icon(ic, "ico sm")); };
  const holdTitle = x => x.name || (x.type === "crypto" ? (CRYPTOS.find(k => k[0] === x.sym) || [, , x.sym])[2] : x.type === "stock" ? String(x.sym).toUpperCase() : tr(HOLD_META[x.type][2]));
  const trimNum = n => String(+Number(n).toFixed(8));
  const holdSub = x => x.type === "gold" ? `${trimNum(x.qty)} ${x.unit} · ${x.karat}K` : x.type === "silver" ? `${trimNum(x.qty)} ${x.unit}` : x.type === "crypto" ? `${trimNum(x.qty)} ${(CRYPTOS.find(k => k[0] === x.sym) || [, x.sym])[1]}` : x.type === "stock" ? `${trimNum(x.qty)} ${tr(x.qty === 1 ? "share" : "shares")}` : tr("Value you entered");
  function holdRow(x) {
    const v = holdMain(x), c = costMain(x), p = priceOf(x);
    const gain = v != null && c ? v - c : null;
    return h("button", { type: "button", class: "row", on: { click: () => holdingSheet(x) } }, holdIcon(x),
      h("span", { class: "row-main" }, h("span", { class: "row-title" }, holdTitle(x)), h("span", { class: "row-sub" }, holdSub(x)),
        c && v != null ? h("span", { class: "row-sub hold-pv num" }, h("span", null, `${tr("Paid")} ${money(c, { whole: true })}`), h("i", null, "→"), h("b", { class: v >= c ? "pos" : "neg" }, `${tr("Now")} ${money(v, { whole: true })}`)) : null),
      h("span", { class: "row-end num" }, v == null ? h("span", { class: "muted" }, "…") : money(v),
        gain != null ? h("small", { class: gain >= 0 ? "pos" : "neg" }, `${gain >= 0 ? "+" : "−"}${money(Math.abs(gain), { whole: true })} · ${gain >= 0 ? "+" : "−"}${Math.abs(gain / c * 100).toFixed(1)}%`)
          : p && p.chg != null ? h("small", { class: p.chg >= 0 ? "pos" : "neg" }, `${p.chg >= 0 ? "+" : "−"}${Math.abs(p.chg).toFixed(1)}% ${tr("today")}`) : null));
  }
  const TYPE_COLOR = { gold: "#f5c451", silver: "#c9d4e2", crypto: "#ff9f43", stock: "#4cc9f0", other: "#b388ff" };
  function pfStats() {
    const list = holdings();
    const t = holdTotals();
    const by = {};
    for (const x of list) { const v = holdMain(x); if (v != null && v > 0) by[x.type] = (by[x.type] || 0) + v; }
    let dayUSD = 0, dayBase = 0;
    for (const x of list) { const p = priceOf(x), v = holdUSD(x); if (p && p.chg != null && v) { dayUSD += v - v / (1 + p.chg / 100); dayBase += v; } }
    return { ...t, by, day: dayBase ? convert(dayUSD, "USD", mainCur()) : null, dayPct: dayBase ? dayUSD / (dayBase - dayUSD) * 100 : null };
  }
  const sgn = v => v >= 0 ? "+" : "−";
  const RM = matchMedia("(prefers-reduced-motion: reduce)");
  const ORBS = new Set();
  const ORB_DRAG = { at: 0 };
  let orbRaf = 0, orbLast = 0;
  function orb(size, cls = "", extra = {}) {
    const px = Math.round(size * Math.min(2, window.devicePixelRatio || 1));
    return h("canvas", { class: "orb " + cls, "data-size": String(size), width: String(px), height: String(px), style: { width: size + "px", height: size + "px" }, "aria-hidden": "true", ...extra });
  }
  function orbInit(c) {
    const size = Number(c.dataset.size) || 200;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    c.width = c.height = Math.round(size * dpr);
    c.style.width = c.style.height = size + "px";
    const n = size > 260 ? 900 : size > 160 ? 620 : 420;
    const pts = new Float32Array(n * 3);
    const ga = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < n; i++) {
      const y = 1 - (i / (n - 1)) * 2, r = Math.sqrt(1 - y * y), t = ga * i;
      pts[i * 3] = Math.cos(t) * r; pts[i * 3 + 1] = y; pts[i * 3 + 2] = Math.sin(t) * r;
    }
    const cols = [];
    for (let k = 0; k < 8; k++) {
      const m = k / 7, rr = Math.round(245 + (52 - 245) * m), gg = Math.round(196 + (211 - 196) * m), bb = Math.round(81 + (153 - 81) * m);
      for (let a = 1; a <= 4; a++) cols.push(`rgba(${rr},${gg},${bb},${(0.25 + a * 0.185).toFixed(2)})`);
    }
    const o = { c, ctx: c.getContext("2d"), size, dpr, pts, n, cols, ry: Math.random() * 6, rx: -0.35, vy: 0.35, auto: 0.35, drag: null, vis: true, t: 0, mix: null, pc: null };
    orbMix(o);
    c.__orb = o;
    c.style.touchAction = "pan-y";
    c.addEventListener("pointerdown", e => { o.drag = { x: e.clientX, y: e.clientY, lx: e.clientX, lt: performance.now(), moved: 0 }; try { c.setPointerCapture(e.pointerId); } catch { } });
    c.addEventListener("pointermove", e => {
      const d = o.drag; if (!d) return;
      const now = performance.now(), dx = e.clientX - d.lx;
      d.moved += Math.abs(dx) + Math.abs(e.clientY - d.y) * 0;
      o.ry += dx * 0.012;
      o.rx = Math.max(-1, Math.min(1, o.rx + (e.clientY - d.y) * 0.004)); d.y = e.clientY;
      o.vy = dx * 0.012 / Math.max(0.008, (now - d.lt) / 1000);
      d.lx = e.clientX; d.lt = now;
      if (RM.matches) orbDraw(o);
    });
    const end = () => { if (o.drag && o.drag.moved > 6) { ORB_DRAG.at = performance.now(); const stop = ev => { ev.stopPropagation(); ev.preventDefault(); }; window.addEventListener("click", stop, { capture: true, once: true }); setTimeout(() => window.removeEventListener("click", stop, true), 60); } o.drag = null; };
    c.addEventListener("pointerup", end);
    c.addEventListener("pointercancel", () => { o.drag = null; });
    if ("IntersectionObserver" in window) new IntersectionObserver(es => { for (const en of es) o.vis = en.isIntersecting; orbKick(); }).observe(c);
    ORBS.add(o);
    orbDraw(o);
    orbKick();
  }
  function orbMix(o) {
    const raw = o.c.dataset.mix || "";
    if (raw === o.mix) return;
    o.mix = raw;
    if (!raw) { o.pc = null; return; }
    let parts;
    try { parts = JSON.parse(raw); } catch { o.pc = null; return; }
    const tot = parts.reduce((a, p) => a + p[1], 0);
    if (!tot) { o.pc = null; return; }
    const pal = [];
    for (const [hex] of parts) {
      const m = /^#?([0-9a-f]{6})$/i.exec(hex) || [0, "34d399"], v = parseInt(m[1], 16), r = v >> 16 & 255, g = v >> 8 & 255, b = v & 255;
      const L = x => Math.min(255, Math.round(x + (255 - x) * 0.18));
      for (let a = 1; a <= 4; a++) pal.push(`rgba(${L(r)},${L(g)},${L(b)},${(0.42 + a * 0.145).toFixed(2)})`);
    }
    const pc = new Uint8Array(o.n);
    let acc = 0, k = 0, lim = parts[0][1] / tot * o.n;
    for (let i = 0; i < o.n; i++) { while (i >= lim && k < parts.length - 1) { acc = lim; k++; lim = acc + parts[k][1] / tot * o.n; } pc[i] = k; }
    o.pal = pal; o.pc = pc;
    if (RM.matches) orbDraw(o);
  }
  function orbDraw(o) {
    const { ctx, size, dpr, pts, n, cols } = o;
    const W = size * dpr, R = W * 0.4, cx = W / 2, cy = W / 2;
    ctx.clearRect(0, 0, W, W);
    const sy = Math.sin(o.ry), cyy = Math.cos(o.ry), sx = Math.sin(o.rx), cxx = Math.cos(o.rx);
    for (let i = 0; i < n; i++) {
      let x = pts[i * 3], y = pts[i * 3 + 1], z = pts[i * 3 + 2];
      const w = 1 + 0.045 * Math.sin(o.t * 1.6 + y * 5 + x * 2);
      x *= w; y *= w; z *= w;
      const x1 = x * cyy - z * sy, z1 = x * sy + z * cyy;
      const y2 = y * cxx - z1 * sx, z2 = y * sx + z1 * cxx;
      const p = 2.6 / (2.6 - z2);
      const px = cx + x1 * R * p, py = cy + y2 * R * p;
      const depth = (z2 + 1) / 2;
      const a = Math.min(3, Math.floor(depth * 4));
      const k = Math.max(0, Math.min(7, Math.round((x1 + 1) / 2 * 7)));
      ctx.fillStyle = o.pc ? o.pal[o.pc[i] * 4 + a] : cols[k * 4 + a];
      const d = (o.pc ? 1.2 + depth * 2.1 : 0.9 + depth * 1.8) * dpr;
      ctx.fillRect(px - d / 2, py - d / 2, d, d);
    }
  }
  function orbKick() {
    if (orbRaf || RM.matches) return;
    orbLast = performance.now();
    orbRaf = requestAnimationFrame(orbTick);
  }
  function orbTick(now) {
    orbRaf = 0;
    const dt = Math.min(0.05, (now - orbLast) / 1000); orbLast = now;
    let any = false;
    for (const o of ORBS) {
      if (!o.c.isConnected) { ORBS.delete(o); continue; }
      if (!o.vis || document.hidden) continue;
      any = true;
      o.t += dt;
      if (!o.drag) { o.vy += (o.auto - o.vy) * Math.min(1, dt * 1.6); o.ry += o.vy * dt; o.rx += (-0.35 - o.rx) * Math.min(1, dt * 0.8); }
      orbDraw(o);
    }
    if (any) orbRaf = requestAnimationFrame(orbTick);
  }
  document.addEventListener("visibilitychange", () => { if (!document.hidden) orbKick(); });


  function tiltInit(el) {
    el.__tilt = true;
    let on = false, raf = 0, tx = 0, ty = 0;
    const paint = () => { raf = 0; const r = el.getBoundingClientRect(); const px = Math.max(0, Math.min(1, (tx - r.left) / r.width)), py = Math.max(0, Math.min(1, (ty - r.top) / r.height)); el.style.setProperty("--rx", ((0.5 - py) * 7).toFixed(2) + "deg"); el.style.setProperty("--ry", ((px - 0.5) * 9).toFixed(2) + "deg"); el.style.setProperty("--gx", (px * 100).toFixed(1) + "%"); el.style.setProperty("--gy", (py * 100).toFixed(1) + "%"); el.style.setProperty("--go", "1"); };
    const move = e => { if (!on && e.pointerType !== "mouse") return; tx = e.clientX; ty = e.clientY; if (!raf) raf = requestAnimationFrame(paint); };
    const reset = () => { on = false; if (raf) cancelAnimationFrame(raf), raf = 0; for (const k of ["--rx", "--ry", "--go"]) el.style.removeProperty(k); };
    el.addEventListener("pointerdown", e => { if (RM.matches) return; on = true; move(e); });
    el.addEventListener("pointermove", e => { if (!RM.matches) move(e); });
    el.addEventListener("pointerup", () => { if (on) setTimeout(reset, 120); });
    el.addEventListener("pointercancel", reset);
    el.addEventListener("pointerleave", reset);
  }

  const CU = new Map();
  function parseMoneyText(t) {
    const m = t.match(/\d{1,3}(?:,\d{3})*(?:\.\d+)?|\d+(?:\.\d+)?/);
    if (!m) return null;
    const num = m[0], dot = num.indexOf(".");
    return { pre: t.slice(0, m.index), post: t.slice(m.index + num.length), v: parseFloat(num.replace(/,/g, "")), dec: dot < 0 ? 0 : num.length - dot - 1, comma: num.includes(",") || parseFloat(num.replace(/,/g, "")) < 1000 };
  }
  function countUp(el, key) {
    const target = el.textContent;
    if (el.__cu && el.__cu.to === target) return;
    if (el.__cu && el.__cu.last === target) return;
    const p = parseMoneyText(target);
    if (!p) { CU.delete(key); el.__cu = { to: target }; return; }
    const from = CU.has(key) ? CU.get(key) : 0;
    CU.set(key, p.v);
    if (RM.matches || Math.abs(from - p.v) < 0.005) { el.__cu = { to: target }; return; }
    const nf = new Intl.NumberFormat("en-US", { minimumFractionDigits: p.dec, maximumFractionDigits: p.dec, useGrouping: p.comma });
    const st = { to: target, last: null }, t0 = performance.now(), D = 1000;
    el.__cu = st;
    const step = now => {
      if (el.__cu !== st || !el.isConnected) return;
      if (st.last !== null && el.textContent !== st.last && el.textContent !== target) { el.__cu = null; countUp(el, key); return; }
      const k = Math.min(1, (now - t0) / D), e = k >= 1 ? 1 : 1 - Math.pow(2, -10 * k);
      const s = k >= 1 ? target : p.pre + nf.format(from + (p.v - from) * e) + p.post;
      if (el.textContent !== s) el.textContent = s;
      st.last = s;
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  let rvRaf = 0;
  function revealCheck() {
    rvRaf = 0;
    const lim = innerHeight * 0.94;
    for (const el of document.querySelectorAll(".rv:not(.rv-in)")) if (el.getBoundingClientRect().top < lim) el.classList.add("rv-in");
  }
  addEventListener("scroll", () => { if (!rvRaf) rvRaf = requestAnimationFrame(revealCheck); }, { passive: true, capture: true });
  addEventListener("resize", () => { if (!rvRaf) rvRaf = requestAnimationFrame(revealCheck); }, { passive: true });
  function revealIn(view) {
    if (!view || RM.matches) return;
    const lim = innerHeight - 8;
    let i = 0;
    for (const el of view.children) {
      if (i++ > 40) break;
      if (el.__rv) continue;
      el.__rv = true;
      if (el.getBoundingClientRect().top < lim) continue;
      el.classList.add("rv");
    }
  }

  document.addEventListener("pointerdown", e => {
    if (RM.matches) return;
    const b = e.target.closest && e.target.closest(".btn, .pf-cta, .key, .set-tile");
    if (!b || b.disabled) return;
    const r = b.getBoundingClientRect(), d = Math.max(r.width, r.height) * 2.2;
    const sp = document.createElement("span");
    sp.className = "fx-ripple";
    sp.style.cssText = `width:${d}px;height:${d}px;left:${e.clientX - r.left - d / 2}px;top:${e.clientY - r.top - d / 2}px`;
    b.append(sp);
    const a = sp.animate([{ transform: "scale(0)", opacity: 0.38 }, { transform: "scale(1)", opacity: 0 }], { duration: 650, easing: "cubic-bezier(.2,.7,.2,1)" });
    a.onfinish = () => sp.remove();
  }, { passive: true });

  document.addEventListener("click", e => {
    const b = !RM.matches && e.target.closest && e.target.closest(".tab-add");
    const r = b && b.querySelector(".tab-add-ring");
    if (r) r.animate([{ transform: "scale(1)" }, { transform: "scale(1.24, .8)" }, { transform: "scale(.86, 1.16)" }, { transform: "scale(1.08, .94)" }, { transform: "scale(.97, 1.03)" }, { transform: "scale(1)" }], { duration: 700, easing: "ease-out" });
  }, true);
  if (window.visualViewport) {
    const vv = window.visualViewport, de = document.documentElement;
    let vr = 0;
    const upd = () => { vr = 0; const kb = innerHeight - vv.height > 120; de.style.setProperty("--vvh", vv.height + "px"); de.style.setProperty("--vvt", vv.offsetTop + "px"); de.classList.toggle("kb", kb); };
    const q = () => { if (!vr) vr = requestAnimationFrame(upd); };
    vv.addEventListener("resize", q); vv.addEventListener("scroll", q); upd();
  }
  let fxQ = 0, fxReveal = false;
  function queueFx(reveal) {
    if (reveal) fxReveal = true;
    if (fxQ) return;
    fxQ = requestAnimationFrame(() => {
      fxQ = 0;
      for (const c of document.querySelectorAll("canvas.orb")) if (!c.__orb) orbInit(c); else orbMix(c.__orb);
      for (const r of document.querySelectorAll(".acc-rail")) if (!r.__rail) railInit(r); else r.__rail();
      for (const c of document.querySelectorAll("canvas.tank")) if (!c.__tank) tankInit(c); else c.__tank.read();
      for (const r of document.querySelectorAll(".rcpt-card")) if (!r.__seen) { r.__seen = true; if (RM.matches || !("IntersectionObserver" in window)) { r.__done = true; r.classList.add("printing", "printed"); } else { const io = new IntersectionObserver(es => { if (es.some(en => en.isIntersecting)) { io.disconnect(); r.__done = true; r.classList.add("printing"); setTimeout(() => r.classList.add("printed"), 1700); } }, { threshold: 0.2 }); io.observe(r); } } else if (r.__done) r.classList.add("printing", "printed");
      for (const el of document.querySelectorAll(".wallet > .hero, .pf-card:not(.pf-empty), .pf-hero, .login-card")) if (!el.__tilt) tiltInit(el);
      const a = document.querySelector(".wallet > .hero .hero-total"); if (a) countUp(a, "home");
      const b = document.querySelector(".pf-card .pf-total"); if (b) countUp(b, "pf");
      const c = document.querySelector(".pf-hero .pf-total"); if (c) countUp(c, "pfs");
      if (fxReveal) { fxReveal = false; if (shell && shell.main) revealIn(shell.main.firstElementChild); }
    });
  }

  const PLATE_COLOR = { gold: "#7a4f06", silver: "#8a96a8", crypto: "#c2410c", stock: "#0e7490", other: "#6d28d9" };
  function pfRing(by, total, size = 132, pal = TYPE_COLOR) {
    const r = 54, c = 2 * Math.PI * r;
    const NS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(NS, "svg");
    svg.setAttribute("viewBox", "0 0 132 132"); svg.setAttribute("width", size); svg.setAttribute("height", size); svg.setAttribute("class", "pf-ring"); svg.setAttribute("aria-hidden", "true");
    const bg = document.createElementNS(NS, "circle");
    bg.setAttribute("class", "pf-track");
    for (const [k, v] of [["cx", 66], ["cy", 66], ["r", r], ["fill", "none"], ["stroke", "rgba(255,255,255,.08)"], ["stroke-width", 12]]) bg.setAttribute(k, v);
    svg.append(bg);
    let off = 0;
    for (const t of HOLD_TYPES) {
      const v = by[t]; if (!v || !total) continue;
      const len = v / total * c;
      const seg = document.createElementNS(NS, "circle");
      for (const [k, val] of [["cx", 66], ["cy", 66], ["r", r], ["fill", "none"], ["stroke", pal[t]], ["stroke-width", 12], ["stroke-linecap", "butt"], ["stroke-dasharray", `${Math.max(0, len - 2)} ${c}`], ["stroke-dashoffset", String(-off)], ["transform", "rotate(-90 66 66)"]]) seg.setAttribute(k, val);
      svg.append(seg);
      off += len;
    }
    const n = holdings().length;
    const t1 = document.createElementNS(NS, "text");
    for (const [k, v] of [["x", 66], ["y", 66], ["text-anchor", "middle"], ["class", "pf-ring-n"]]) t1.setAttribute(k, v);
    t1.textContent = String(n);
    const t2 = document.createElementNS(NS, "text");
    for (const [k, v] of [["x", 66], ["y", 86], ["text-anchor", "middle"], ["class", "pf-ring-l"]]) t2.setAttribute(k, v);
    t2.textContent = tr(n === 1 ? "asset" : "assets");
    svg.append(t1, t2);
    return svg;
  }
  function portfolioCard() {
    const list = holdings();
    if (!list.length) {
      if (store.get("pfTeaserOff", false)) return h("button", { type: "button", class: "pf-mini", on: { click: () => portfolioSheet() } }, icon("gem"), h("span", null, "Portfolio"), h("small", null, "Gold, crypto, stocks"), icon("chev", "ico sm"));
      return h("section", { class: "pf-card pf-empty", role: "button", tabindex: "0", on: { click: e => { if (!e.target.closest(".pf-x")) holdingSheet(null); } } },
        h("span", { class: "pf-grid", "aria-hidden": "true" }),
        orb(190, "pf-orb"),
        h("button", { type: "button", class: "pf-x", "aria-label": "Hide", on: { click: () => { store.set("pfTeaserOff", true); render(); } } }, icon("close", "ico sm")),
        h("span", { class: "pf-kicker" }, icon("gem", "ico sm"), "Portfolio"),
        h("strong", { class: "pf-empty-title" }, "Track gold, crypto and stocks"),
        h("span", { class: "pf-empty-sub" }, "Live prices, your gain since you bought, all in one place."),
        h("span", { class: "pf-cta" }, icon("plus", "ico sm"), "Add your first investment"));
    }
    loadPrices(false);
    const st = pfStats();
    const total = st.value;
    return h("section", { id: "w-pf", class: "pf-card", role: "button", tabindex: "0", "aria-label": "Open portfolio", on: { click: e => { if (!e.target.closest(".pf-add")) portfolioSheet(); }, keydown: e => { if (e.key === "Enter") portfolioSheet(); } } },
      h("span", { class: "pf-grid", "aria-hidden": "true" }),
      h("span", { class: "fx-glare", "aria-hidden": "true" }),
      h("div", { class: "pf-head" }, h("span", { class: "pf-kicker" }, h("i", { class: "pf-live" }), "Portfolio · live"),
        h("button", { type: "button", class: "pf-add", "aria-label": "Add an investment", on: { click: () => holdingSheet(null) } }, icon("plus", "ico sm"))),
      h("div", { class: "pf-main" },
        h("div", { class: "pf-nums" },
          h("strong", { class: "pf-total num" }, money(total)),
          st.cost > 0 ? h("span", { class: "pf-paid num" }, h("small", null, tr("You paid")), ` ${money(st.cost, { whole: true })}`) : null,
          st.gain != null ? h("span", { class: "pf-delta num " + (st.gain >= 0 ? "up" : "down") }, `${sgn(st.gain)}${money(Math.abs(st.gain), { whole: true })} · ${sgn(st.gain)}${Math.abs(st.gain / st.cost * 100).toFixed(1)}%`, h("small", null, tr("all time"))) : null,
          st.day != null ? h("span", { class: "pf-delta small num " + (st.day >= 0 ? "up" : "down") }, `${sgn(st.day)}${money(Math.abs(st.day), { whole: true })} · ${sgn(st.dayPct)}${Math.abs(st.dayPct).toFixed(2)}%`, h("small", null, tr("today"))) : null),
        pfRing(st.by, total, 104, PLATE_COLOR)),
      h("div", { class: "pf-chips" }, HOLD_TYPES.filter(t => st.by[t]).map(t => h("span", { class: "pf-chip", style: { "--c": PLATE_COLOR[t] } }, h("i"), tr(HOLD_META[t][2]), h("b", { class: "num" }, `${Math.round(st.by[t] / total * 100)}%`)))));
  }
  function portfolioSheet() {
    const body = h("div", { class: "pf-sheet" });
    const draw = () => {
      const list = holdings();
      const st = pfStats();
      const total = st.value;
      const ats = list.map(priceOf).filter(Boolean).map(p => p.at).sort();
      const kids = [
        h("div", { class: "pf-hero" }, h("span", { class: "pf-grid", "aria-hidden": "true" }), h("span", { class: "fx-glare", "aria-hidden": "true" }),
          h("span", { class: "pf-kicker" }, h("i", { class: "pf-live" }), ats.length ? `${tr("Live")} · ${tr("updated")} ${ago(ats[0])}` : tr("Portfolio")),
          h("div", { class: "pf-main col" },
            h("div", { class: "pf-nums" },
              h("strong", { class: "pf-total big num" }, money(total)),
              st.cost > 0 ? h("div", { class: "pf-pv" }, h("div", null, h("small", null, "You paid"), h("b", { class: "num" }, money(st.cost))), h("i", null, "→"), h("div", null, h("small", null, "Worth now"), h("b", { class: "num" }, money(st.costed != null ? st.costed : total)))) : null,
              st.cost > 0 && st.costed < total - 0.5 ? h("p", { class: "pf-pv-note" }, "Only investments where you entered what you paid.") : null,
              st.gain != null ? h("span", { class: "pf-delta num " + (st.gain >= 0 ? "up" : "down") }, `${sgn(st.gain)}${money(Math.abs(st.gain))} · ${sgn(st.gain)}${Math.abs(st.gain / st.cost * 100).toFixed(1)}%`, h("small", null, tr("all time"))) : h("span", { class: "pf-hint" }, "Add what you paid to see your gain"),
              st.day != null ? h("span", { class: "pf-delta small num " + (st.day >= 0 ? "up" : "down") }, `${sgn(st.day)}${money(Math.abs(st.day))} · ${sgn(st.dayPct)}${Math.abs(st.dayPct).toFixed(2)}%`, h("small", null, tr("today"))) : null),
            total > 0 ? h("div", { class: "pf-split" }, pfRing(st.by, total, 124, PLATE_COLOR),
              h("div", { class: "pf-legend" }, HOLD_TYPES.filter(t => st.by[t]).map(t => h("div", { class: "pf-leg", style: { "--c": PLATE_COLOR[t] } }, h("i"), h("span", null, tr(HOLD_META[t][2])), h("small", { class: "num" }, `${Math.round(st.by[t] / total * 100)}%`), h("b", { class: "num" }, money(st.by[t], { whole: true })))))) : null))
      ];
      if (!list.length) kids.push(h("p", { class: "empty" }, "Track gold, silver, crypto and stocks. Their value updates with live prices."));
      for (const t of HOLD_TYPES) {
        const items = list.filter(x => x.type === t).sort((p, q) => (holdMain(q) || 0) - (holdMain(p) || 0));
        if (!items.length) continue;
        kids.push(h("section", { class: "card flush pf-group" }, h("div", { class: "card-head" }, h("h2", null, HOLD_META[t][2]), h("span", { class: "card-sub num" }, money(st.by[t] || 0, { whole: true }))), items.map(holdRow)));
      }
      if (list.length) kids.push(h("p", { class: "hint center" }, "Tap an investment to change or remove it. Prices refresh every 10 minutes."));
      body.replaceChildren(...kids);
      queueFx();
    };
    draw();
    PF.draw = draw;
    openSheet("Portfolio", body, h("button", { type: "button", class: "btn pf-btn", on: { click: () => holdingSheet(null, true) } }, icon("plus", "ico sm"), "Add an investment"), { fill: true, headBtn: h("button", { type: "button", class: "icon-btn", "aria-label": "Refresh prices", on: { click: async () => { await loadPrices(true); draw(); toast("Prices updated."); } } }, icon("sync")) });
    loadPrices(false).then(() => { if (body.isConnected) draw(); });
  }
  const PF = { draw: null };
  function holdingSheet(x, stack) {
    if (stack === undefined) stack = !!document.querySelector(".pf-sheet");
    const st = settings();
    const f = x ? { ...x, cost: x.cost ? String(x.cost) : "", value: x.value ? String(x.value) : "", qty: x.qty ? trimNum(x.qty) : "" } : { id: newId(), type: "gold", sym: "", name: "", qty: "", unit: "g", karat: 21, cost: "", costCur: mainCur(), value: "", valCur: mainCur() };
    if (!f.costCur) f.costCur = mainCur();
    if (!f.valCur) f.valCur = mainCur();
    const body = h("form", { class: "form", on: { submit: e => { e.preventDefault(); save(); } } });
    const err = h("p", { class: "form-err", role: "alert" });
    const preview = h("p", { class: "sal-preview" });
    const current = () => ({ ...f, qty: parseAmt(f.qty) || 0, cost: parseAmt(f.cost) || null, value: parseAmt(f.value) || null, sym: f.type === "stock" ? f.sym.toUpperCase().trim() : f.sym });
    const paint = () => {
      const c = current();
      const v = holdMain(c);
      preview.hidden = !(c.qty > 0 || c.type === "other");
      preview.replaceChildren(icon("coin", "ico sm"), h("span", null, v != null ? `${tr("Worth now")}: ${money(v)}` : c.type === "other" ? tr("Enter its value") : navigator.onLine ? tr("Getting the price…") : tr("Prices show when you're online.")));
    };
    let priceT = 0;
    const askPrice = () => { clearTimeout(priceT); const k = holdKey(current()); if (k && current().sym !== "" || k && (f.type === "gold" || f.type === "silver")) priceT = setTimeout(() => loadPrices(false, [k]).then(paint), 450); paint(); };
    const draw = () => {
      const kids = [
        h("div", { class: "hold-types" }, HOLD_TYPES.map(t => h("button", { type: "button", class: "hold-type" + (f.type === t ? " on" : ""), "aria-pressed": String(f.type === t), on: { click: () => { if (x) return; f.type = t; f.sym = t === "crypto" ? "bitcoin" : ""; draw(); askPrice(); } }, disabled: !!x && f.type !== t },
          h("span", { class: "dot", style: { background: HOLD_META[t][1] } }, icon(HOLD_META[t][0], "ico sm")), h("span", null, HOLD_META[t][2]))))
      ];
      if (f.type === "crypto") kids.push(h("label", { class: "field" }, h("span", null, "Coin"),
        h("select", { id: "h-coin", class: "input", on: { change: e => { f.sym = e.target.value; askPrice(); } } }, CRYPTOS.map(([id, t, n]) => h("option", { value: id, selected: f.sym === id }, `${n} · ${t}`)))));
      if (f.type === "stock") kids.push(h("label", { class: "field" }, h("span", null, "Ticker"),
        h("input", { id: "h-sym", class: "input", value: f.sym, placeholder: "AAPL, TSLA, VOO…", autocapitalize: "characters", autocomplete: "off", spellcheck: "false", maxlength: "15", on: { input: e => { f.sym = e.target.value.replace(/[^A-Za-z0-9.^=_-]/g, ""); askPrice(); } } }),
        h("small", { class: "hint" }, "The symbol you see in your broker app. For other markets add the suffix, like SAP.DE or 2222.SR.")));
      if (f.type === "other") kids.push(
        h("label", { class: "field" }, h("span", null, "Name"), h("input", { id: "h-name", class: "input", value: f.name, placeholder: "Land, a business share, a watch…", maxlength: "40", on: { input: e => { f.name = e.target.value; } } })),
        h("div", { class: "field" }, h("span", { class: "label" }, "What it's worth now"), h("div", { class: "row-inputs" }, h("input", { id: "h-val", class: "input num", inputmode: "decimal", value: f.value, placeholder: "0", on: { input: e => { f.value = e.target.value; paint(); } } }), curSelect("h-valcur", f.valCur, k => { f.valCur = k; paint(); }))));
      else kids.push(h("div", { class: "field" }, h("span", { class: "label" }, f.type === "stock" ? "How many shares" : f.type === "crypto" ? "How many coins" : "How much"),
        h("div", { class: "row-inputs" }, h("input", { id: "h-qty", class: "input num", inputmode: "decimal", value: f.qty, placeholder: "0", on: { input: e => { f.qty = e.target.value; paint(); } } }),
          f.type === "gold" || f.type === "silver" ? h("select", { id: "h-unit", class: "input mini-select", on: { change: e => { f.unit = e.target.value; paint(); } } }, [["g", "grams"], ["oz", "ounces"], ["kg", "kilos"]].map(([u, l]) => h("option", { value: u, selected: f.unit === u }, tr(l)))) : null)));
      if (f.type === "gold") kids.push(h("div", { class: "field" }, h("span", { class: "label" }, "Purity"),
        h("div", { class: "seg-row" }, [24, 22, 21, 18, 14].map(k => h("button", { type: "button", class: "chip-btn" + (f.karat === k ? " on" : ""), on: { click: () => { f.karat = k; draw(); } } }, `${k}K`)))),
        h("label", { class: "field" }, h("span", null, "Name (optional)"), h("input", { id: "h-gname", class: "input", value: f.name, placeholder: "Gold lira, bracelet, bar…", maxlength: "40", on: { input: e => { f.name = e.target.value; } } })));
      if (f.type !== "other") kids.push(h("div", { class: "field" }, h("span", { class: "label" }, "What you paid in total (optional)"),
        h("div", { class: "row-inputs" }, h("input", { id: "h-cost", class: "input num", inputmode: "decimal", value: f.cost, placeholder: "0", on: { input: e => { f.cost = e.target.value; } } }), curSelect("h-costcur", f.costCur, k => { f.costCur = k; }))));
      kids.push(preview, err);
      if (x) kids.push(h("button", { type: "button", class: "btn alt danger-text", on: { click: () => { saveSettings({ holdings: settings().holdings.filter(y => y.id !== x.id) }); closeSheet(); if (PF.draw && document.querySelector(".pf-sheet")) setTimeout(PF.draw, 50); toast("Removed."); } } }, "Remove"));
      body.replaceChildren(...kids);
      paint();
    };
    const save = () => {
      const c = current();
      if (c.type === "stock" && !/^[A-Z0-9.^=_-]{1,15}$/.test(c.sym)) return fail(err, "Enter the ticker, like AAPL.");
      if (c.type === "other" ? !c.value : !(c.qty > 0)) return fail(err, c.type === "other" ? "Enter what it's worth." : "Enter how much you have.");
      if (c.type === "other" && !c.name.trim()) return fail(err, "Give it a name.");
      const item = { id: c.id, type: c.type, sym: c.type === "crypto" || c.type === "stock" ? c.sym : "", name: c.name.trim(), qty: c.type === "other" ? 0 : c.qty, unit: c.unit, karat: c.karat, cost: c.cost, costCur: c.costCur, value: c.type === "other" ? c.value : null, valCur: c.type === "other" ? c.valCur : null };
      const list = st.holdings.filter(y => y.id !== item.id);
      if (!x && list.length >= 60) return fail(err, "You can track up to 60 investments.");
      saveSettings({ holdings: x ? st.holdings.map(y => y.id === item.id ? item : y) : [...list, item] });
      track("add", "invest_" + c.type);
      closeSheet();
      if (PF.draw && document.querySelector(".pf-sheet")) setTimeout(PF.draw, 50);
      toast(x ? "Saved." : "Added to your investments.");
      loadPrices(false);
    };
    draw();
    askPrice();
    openSheet(x ? holdTitle(x) : "Add an investment", body, h("button", { type: "button", class: "btn", on: { click: save } }, x ? "Save" : "Add"), { stack });
  }


  function netWorthSeries(m, count) {
    const months = [];
    for (let k = count - 1; k >= 0; k--) months.push(shiftMonth(m, -k));
    const accounts = rows("accounts");
    const txns = rows("transactions");
    const people = new Map(rows("people").map(p => [p.id, p]));
    const loans = loanRows();
    return months.map(mm => {
      const end = `${mm}-${pad(daysInMonth(mm))}`;
      const b = new Map(accounts.map(a => [a.id, Number(a.opening_balance) || 0]));
      const add = (id, v) => { if (b.has(id)) b.set(id, b.get(id) + v); };
      for (const x of txns) {
        if (x.occurred_on > end) continue;
        const amt = Number(x.amount) || 0;
        if (x.kind === "income" || x.kind === "loan_in") add(x.account_id, amt);
        else if (x.kind === "expense" || x.kind === "loan_out") add(x.account_id, -amt);
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

  const OCR = { p: null };
  const loadOcr = () => OCR.p || (OCR.p = new Promise((resolve, reject) => {
    if (window.Tesseract) return resolve(window.Tesseract);
    const el = document.createElement("script");
    el.src = "vendor/ocr/tesseract.min.js";
    el.onload = () => window.Tesseract ? resolve(window.Tesseract) : reject(new Error("ocr"));
    el.onerror = () => { OCR.p = null; reject(new Error("ocr")); };
    document.head.append(el);
  }));

  function parseReceipt(text) {
    const lines = String(text || "").split(/\r?\n/).map(l => l.replace(/\s+/g, " ").trim()).filter(Boolean);
    const numsIn = l => [...l.matchAll(/(?<![\d.,])(\d{1,3}(?:[ ,.]\d{3})+(?:[.,]\d{1,2})?|\d+(?:[.,]\d{1,2})?)(?![\d])/g)].map(m => {
      let v = m[1].replace(/ /g, "");
      if (/[.,]\d{1,2}$/.test(v)) { const dec = v.slice(-3).replace(/^[.,]/, "."); v = v.slice(0, -3).replace(/[.,]/g, "") + (dec.startsWith(".") ? dec : "." + dec.replace(/[.,]/, "")); }
      else v = v.replace(/[.,]/g, "");
      return Number(v);
    }).filter(n => Number.isFinite(n) && n > 0 && n < 1e10);
    const curOf = l => /\bLBP\b|L\.L|ل\.ل|ليرة/i.test(l) ? "LBP" : /\$|USD/i.test(l) ? "USD" : /€|EUR/i.test(l) ? "EUR" : null;
    let amount = null, currency = null;
    const totalRe = /(grand\s*total|total\s*(ttc|due|to pay|amount)?|amount\s*due|net\s*(amount|total|to pay)|to\s*pay|montant|à payer|الإجمالي|المجموع|المبلغ)/i;
    const cands = lines.map((l, i) => ({ l, i })).filter(({ l }) => totalRe.test(l) && !/sub\s*-?\s*total|tax|vat|tva|change|cash\s*(given|tendered)|discount/i.test(l));
    for (const { l, i } of cands.reverse()) {
      const n = numsIn(l);
      const pick = n.length ? n[n.length - 1] : (numsIn(lines[i + 1] || "")[0] || null);
      if (pick) { amount = pick; currency = curOf(l) || curOf(lines[i + 1] || ""); if (/grand/i.test(l)) break; break; }
    }
    if (!amount) {
      const all = lines.filter(l => !/tel|phone|fax|vat\s*no|mof|invoice\s*no|receipt\s*no|#/i.test(l)).flatMap(l => numsIn(l).filter(n => /[.,]\d{2}\b|\$|LBP|L\.L/.test(l) || n >= 1000).map(n => ({ n, l })));
      const best = all.sort((a, b) => b.n - a.n)[0];
      if (best) { amount = best.n; currency = curOf(best.l); }
    }
    if (!currency) currency = lines.map(curOf).find(Boolean) || null;
    let date = null;
    const MON = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 };
    const ok = (y, m, d) => { if (y < 100) y += 2000; if (m < 1 || m > 12 || d < 1 || d > 31) return null; const s2 = `${y}-${pad(m)}-${pad(d)}`; const t = today(); return s2 <= t && s2 >= ymd(new Date(Date.now() - 366 * 864e5)) ? s2 : null; };
    for (const l of lines) {
      let m = l.match(/\b(20\d{2})[-/.](\d{1,2})[-/.](\d{1,2})\b/);
      if (m && (date = ok(+m[1], +m[2], +m[3]))) break;
      m = l.match(/\b(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})\b/);
      if (m && (date = ok(+m[3], +m[2], +m[1]) || ok(+m[3], +m[1], +m[2]))) break;
      m = l.match(/\b(\d{1,2})[ -]?([A-Za-z]{3})[a-z]*[ -,]*(\d{2,4})\b/);
      if (m && MON[m[2].toLowerCase()] && (date = ok(+m[3], MON[m[2].toLowerCase()], +m[1]))) break;
    }
    const shop = lines.slice(0, 6).find(l => /[A-Za-z\u0600-\u06FF]{3,}/.test(l) && !/receipt|invoice|tel|phone|date|welcome|cashier|table|order|vat|tva|mof|www|http|@/i.test(l)) || null;
    return { amount, currency, date, shop: shop ? shop.replace(/[^\p{L}\p{N} &'.-]/gu, "").trim().slice(0, 60) : null };
  }

  async function readReceipt(file) {
    const T = await loadOcr();
    const worker = await T.createWorker("eng", 1, { workerPath: "vendor/ocr/worker.min.js", corePath: "vendor/ocr", langPath: "vendor/ocr", gzip: true, workerBlobURL: false });
    try {
      const { data } = await worker.recognize(file);
      return parseReceipt(data && data.text);
    } finally { worker.terminate().catch(() => { }); }
  }

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
      const { data, error } = await sb.from("quick_inbox").select("id, amount, note, category, account, created_at").order("created_at", { ascending: true }).limit(100);
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
      const findAcc = name => { const n = norm(name); return n ? accounts.find(o => norm(o.name) === n) || accounts.find(o => norm(tr(o.name)) === n) || null : null; };
      const items = data.filter(q => Number(q.amount) > 0).map(q => { const qa = findAcc(q.account) || a; return { t: "transactions", r: { id: `q-${q.id}`, kind: "expense", amount: roundCur(Number(q.amount), qa.currency), currency: qa.currency, rate: rateOf(qa.currency), account_id: qa.id, to_account_id: null, to_amount: null, category_id: findCat(q.category), note: typeof q.note === "string" && q.note ? q.note.slice(0, 200) : null, occurred_on: ymd(new Date(q.created_at)), rule_id: null, receipt: null, created_at: q.created_at } }; });
      if (items.length) putMany(items);
      await sb.from("quick_inbox").delete().in("id", data.map(q => q.id));
      const loose = items.filter(i => !i.r.category_id).length;
      if (items.length) toast(`${items.length} quick ${items.length === 1 ? "entry" : "entries"} added.${loose ? " Tap it on Home to set the category." : ""}`);
    } catch { } finally { S.quickBusy = false; }
  }

  let qlTimer = null;
  function queueQuickLists() {
    if (!store.get("quickToken", null) || !sb || !S.session) return;
    clearTimeout(qlTimer);
    qlTimer = setTimeout(async () => {
      if (!navigator.onLine) return;
      const cutoff = ymd(new Date(Date.now() - 90 * 864e5));
      const use = new Map();
      for (const t of rows("transactions")) if (t.kind === "expense" && t.category_id && t.occurred_on >= cutoff) use.set(t.category_id, (use.get(t.category_id) || 0) + 1);
      const cats = rows("categories").filter(c => c.kind === "expense").sort((p, q) => (use.get(q.id) || 0) - (use.get(p.id) || 0) || bySort(p, q)).map(c => tr(c.name).slice(0, 60)).slice(0, 60);
      const last = rows("transactions").filter(t => t.kind === "expense" && acc(t.account_id)).sort(byRecent)[0];
      const accs = rows("accounts").filter(o => !o.archived).sort((p, q) => (last && q.id === last.account_id) - (last && p.id === last.account_id) || bySort(p, q)).map(o => tr(o.name).slice(0, 60)).slice(0, 30);
      const key = JSON.stringify([cats, accs]);
      if (store.get("qlLast", "") === key) return;
      const { error } = await sb.from("quick_lists").upsert({ user_id: S.uid, cats, accounts: accs, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
      if (!error) store.set("qlLast", key);
    }, 3000);
  }

  let qsTimer = null;
  function queueQuickSummary() {
    if (!storedSettings().quickSummary || !store.get("quickToken", null) || !sb || !S.session) return;
    clearTimeout(qsTimer);
    qsTimer = setTimeout(async () => {
      if (!navigator.onLine) return;
      const m = thisMonth(), s = monthStats(m), plan = planFor(m), safe = safeToSpend();
      const d = new Date().toLocaleDateString("en-US", { day: "numeric", month: "short" });
      const lines = [`Spent today (${d}): ${money(s.days.get(today()) || 0, { whole: true, show: true })}`,
        plan.base > 0 ? `${monthShort(m)}: ${money(s.spent, { whole: true, show: true })} of ${money(plan.base, { whole: true, show: true })} (${money(Math.abs(plan.base - s.spent), { whole: true, show: true })} ${plan.base >= s.spent ? "left" : "over"})` : `${monthShort(m)}: ${money(s.spent, { whole: true, show: true })} spent`,
        safe ? `Safe to spend: ${money(safe.perDay, { whole: true, show: true })} a day` : null].filter(Boolean);
      const text = lines.join("\n").slice(0, 300);
      if (store.get("qsLast", "") === text) return;
      const { error } = await sb.from("quick_summary").upsert({ user_id: S.uid, text, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
      if (!error) store.set("qsLast", text);
    }, 2500);
  }

  const SHORTCUT_LINK = "https://www.icloud.com/shortcuts/be79a7d9ca9544a097e58ce9caabf06b";
  const SHORTCUT_AUTO = true;
  const SHORTCUT_NAME = "Add expense";
  function openShortcutLink() {
    const inApp = navigator.standalone === true || matchMedia("(display-mode: standalone)").matches;
    if (!inApp || !/iPhone|iPad|iPod/.test(navigator.userAgent)) { window.open(SHORTCUT_LINK, "_blank", "noopener"); return; }
    let left = false;
    const away = () => { left = true; };
    document.addEventListener("visibilitychange", away, { once: true });
    location.href = "x-safari-" + SHORTCUT_LINK;
    setTimeout(() => { document.removeEventListener("visibilitychange", away); if (!left && document.visibilityState === "visible") window.open(SHORTCUT_LINK, "_blank", "noopener"); }, 1200);
  }
  async function ensureQuickToken() {
    const have = store.get("quickToken", null);
    if (have) return have;
    if (!navigator.onLine) { toast("Connect to the internet to set this up.", "error"); return null; }
    const fresh = toUrl(b64u8(rand(32)));
    const hash = [...new Uint8Array(await crypto.subtle.digest("SHA-256", te.encode(fresh)))].map(b => b.toString(16).padStart(2, "0")).join("");
    const { error } = await sb.from("quick_tokens").upsert({ user_id: S.uid, token_hash: hash }, { onConflict: "user_id" });
    if (error) { toast("Couldn't set this up. Try again.", "error"); return null; }
    store.set("quickToken", fresh);
    return fresh;
  }

  function quickWizard() {
    const body = h("div", { class: "form qwiz" });
    const auto = SHORTCUT_AUTO;
    const total = auto ? 3 : 2;
    const getIt = token => { if (!auto && navigator.clipboard) navigator.clipboard.writeText(token).catch(() => { }); openShortcutLink(); store.set("qwiz", 2); track("add", "shortcut_get"); setTimeout(draw, 600); };
    const connect = token => { track("add", "shortcut_connect"); store.set("qwiz", 3); location.href = `shortcuts://run-shortcut?name=${encodeURIComponent(SHORTCUT_NAME)}&input=text&text=${encodeURIComponent(token)}`; setTimeout(draw, 800); };
    const dots = n => h("div", { class: "qwiz-dots" }, Array.from({ length: total }, (_, i) => h("span", { class: i < n ? "on" : "" })));
    const path = items => h("div", { class: "qwiz-path" }, items.map((t, i) => [i ? h("span", { class: "qwiz-sep" }, "›") : null, h("span", { class: "qwiz-chip" + (i === items.length - 1 ? " last" : "") }, t)]));
    const backTap = n => [dots(n),
      h("h3", { class: "qwiz-title" }, `Step ${n}: turn on Back Tap`),
      h("p", { class: "hint" }, "Open the iPhone Settings app and follow this path:"),
      path(["Settings", "Accessibility", "Touch", "Back Tap", SHORTCUT_NAME]),
      h("p", { class: "hint" }, "Touch is under Physical and Motor. Back Tap is at the very bottom of Touch. Pick Double Tap or Triple Tap, whichever you like, then choose “Add expense”."),
      h("button", { type: "button", class: "btn", on: { click: () => { store.set("qwiz", 9); track("add", "shortcut_done"); draw(); } } }, "Done"),
      h("button", { type: "button", class: "btn alt", on: { click: () => { store.set("qwiz", n - 1); draw(); } } }, "Back")];
    const draw = () => {
      const token = store.get("quickToken", null);
      const st = Math.max(1, store.get("qwiz", 1));
      let kids;
      if (st === 1) kids = [dots(1),
        h("p", { class: "hint center" }, "Tap the back of your iPhone (or say “Hey Siri, Add expense”), pick what it was for, type the amount, and it's saved. Takes about a minute to set up."),
        h("h3", { class: "qwiz-title" }, "Step 1: get the Shortcut"),
        auto
          ? h("ol", { class: "qwiz-list" },
            h("li", null, h("strong", null, "Tap the green button below.")),
            h("li", null, "Tap ", h("strong", null, "Add Shortcut"), "."),
            h("li", null, "Come back here to connect it."))
          : h("ol", { class: "qwiz-list" },
            h("li", null, h("strong", null, "Tap the green button below."), " Your personal key is copied for you."),
            h("li", null, "On the screen that opens, tap the empty box and choose ", h("strong", null, "Paste"), "."),
            h("li", null, "Tap ", h("strong", null, "Add Shortcut"), ".")),
        auto
          ? h("button", { type: "button", class: "qwiz-mock", disabled: !token, on: { click: () => token && getIt(token) } }, h("small", null, SHORTCUT_NAME), h("span", { class: "qwiz-add" }, "Add Shortcut"))
          : h("button", { type: "button", class: "qwiz-mock", disabled: !token, on: { click: () => token && getIt(token) } }, h("small", null, "Paste your BudgetSplit key"), h("span", { class: "qwiz-field" }, h("span", { class: "qwiz-paste" }, "Paste")), h("span", { class: "qwiz-add" }, "Add Shortcut")),
        h("button", { type: "button", class: "btn", disabled: !token, on: { click: () => token && getIt(token) } }, token ? "Get the Shortcut" : "One moment…"),
        h("p", { class: "hint center" }, "Blank white page? Tap the compass at the bottom right to open it in Safari."),
        h("button", { type: "button", class: "btn alt", on: { click: () => { store.set("qwiz", 2); draw(); } } }, "I already added it")];
      else if (st === 2 && auto) kids = [dots(2),
        h("h3", { class: "qwiz-title" }, "Step 2: connect it"),
        h("p", { class: "hint center" }, "One tap links the Shortcut to your account. The Shortcuts app opens for a second and shows “Connected”. Then come back here."),
        h("div", { class: "qwiz-hero" }, h("span", { class: "qwiz-big" }, icon("link"))),
        h("button", { type: "button", class: "btn", disabled: !token, on: { click: () => token && connect(token) } }, "Connect the Shortcut"),
        h("p", { class: "hint center" }, "If it says the Shortcut wasn't found, add it first with step 1 and keep the name “Add expense”."),
        h("button", { type: "button", class: "btn alt", on: { click: () => { store.set("qwiz", 1); draw(); } } }, "Back to step 1")];
      else if (st === (auto ? 3 : 2)) kids = backTap(auto ? 3 : 2);
      else kids = [
        h("div", { class: "qwiz-hero" }, h("span", { class: "qwiz-big done" }, icon("check")),
          h("h3", null, "You're all set 🎉"),
          h("p", null, "Try it now: tap the back of your iPhone the way you chose and type 1. It shows up here the next time you open the app.")),
        h("div", { class: "qwiz-tip" }, icon("chat", "ico sm"), h("span", null, "No Back Tap? You can also say ", h("strong", null, "“Hey Siri, Add expense”"), ".")),
        h("button", { type: "button", class: "btn", on: { click: closeSheet } }, "Close"),
        auto ? h("button", { type: "button", class: "btn alt", on: { click: () => token && connect(token) } }, "Connect again") : null,
        h("button", { type: "button", class: "link-btn", on: { click: () => { store.set("qwiz", 1); draw(); } } }, "Set it up again")];
      if (st === 1) kids.splice(kids.length - 1, 0, h("div", { class: "qwiz-tip" }, icon("chat", "ico sm"), h("span", null, "As soon as it's set up, you can also say ", h("strong", null, "“Hey Siri, Add expense”"), ".")));
      body.replaceChildren(...kids.filter(Boolean), h("button", { type: "button", class: "link-btn qwiz-more", on: { click: () => { closeSheet(); setTimeout(() => quickSheet(true), 330); } } }, "More options"));
    };
    draw();
    openSheet("Add without opening the app", body);
    if (!store.get("quickToken", null)) ensureQuickToken().then(() => { draw(); render(); });
  }

  async function quickSheet(advanced) {
    if (!advanced && SHORTCUT_LINK && /iPhone|iPad|iPod/.test(navigator.userAgent)) return quickWizard();
    const url = `${CFG.supabaseUrl}/functions/v1/quick-add`;
    const body = h("div", { class: "form" });
    const draw = () => {
      const token = store.get("quickToken", null);
      if (!token) {
        body.replaceChildren(
          h("p", { class: "hint" }, "Add an expense in two seconds without opening the app: tap the back of your iPhone (or use the Lock Screen or the Action Button), type the amount, and it's saved. It appears in BudgetSplit the next time you open it."),
          h("p", { class: "hint" }, "Quick entries wait on the server unencrypted until the app opens and files them, then they are deleted from there."),
          h("button", { type: "button", class: "btn", on: { click: async () => { if (await ensureQuickToken()) { draw(); render(); } } } }, "Turn on quick add"));
        return;
      }
      const step = (n, t, d) => h("div", { class: "prose-part" }, h("h3", null, `${n}. ${t}`), h("p", null, d));
      const easy = SHORTCUT_LINK ? h("section", { class: "card backtap" },
        h("div", { class: "backtap-head" }, h("span", { class: "backtap-ico" }, icon("plus")), h("div", null, h("strong", null, "Set it up in 3 easy steps"), h("small", null, "About one minute. No building needed."))),
        h("ol", { class: "backtap-steps" },
          h("li", null, "Tap Get the Shortcut below. Your key is copied for you."),
          h("li", null, "Tap Add Shortcut, then paste the key when it asks."),
          h("li", null, "In iPhone Settings → Accessibility → Touch → Back Tap, pick Double Tap or Triple Tap, then “Add expense”.")),
        h("button", { type: "button", class: "btn", on: { click: async () => { try { await navigator.clipboard.writeText(token); toast("Key copied. Paste it when the Shortcut asks."); } catch { } openShortcutLink(); } } }, "Get the Shortcut")) : null;
      body.replaceChildren(
        easy,
        SHORTCUT_LINK ? h("p", { class: "hint" }, "Prefer to build it yourself? Here's how:") : null,
        h("div", { class: "prose" },
          step(1, "Create a Shortcut", "Open the Shortcuts app, tap +, and name it “Add expense”."),
          step(2, "Ask for the amount", "Add the action “Ask for Input”. Set the type to Number and the question to “How much?”."),
          step(3, "Send it", "Add the action “Get Contents of URL”. Paste the address below. Set Method to POST and Request Body to JSON, then add three text fields: token (paste your key below), amount (pick the “Ask for Input” result) and, if you want, note."),
          step(4, "Optional: pick the category too", "Before “Get Contents of URL”, add the action “Choose from List” with your category names (copy them below). Then add a fourth text field named category and pick the “Chosen Item” result. Entries then arrive already filed."),
          step(5, "Put it where you want", "Add the Shortcut to your Lock Screen (Customize → widgets → Shortcuts), to the Action Button (Settings → Action Button → Shortcut), or to the Home Screen.")),
        h("section", { class: "card backtap" },
          h("div", { class: "backtap-head" }, h("span", { class: "backtap-ico" }, icon("phone")), h("div", null, h("strong", null, "Tap the back of your iPhone"), h("small", null, "The fastest way: tap the back of the phone, from any screen, even with another app open."))),
          h("ol", { class: "backtap-steps" },
            h("li", null, "Open the iPhone Settings app."),
            h("li", null, "Go to Accessibility → Touch → Back Tap."),
            h("li", null, "Pick Double Tap or Triple Tap, then your “Add expense” Shortcut."),
            h("li", null, "Now tap the back of your iPhone, type the amount, and it's saved. It shows up in BudgetSplit the next time you open it.")),
          h("p", { class: "hint" }, "Works on iPhone 8 and newer. Use the other one (Double or Triple Tap) for the “Today” Shortcut if you like.")),
        h("label", { class: "field" }, h("span", null, "Address"), h("input", { class: "input", readOnly: true, value: url, id: "q-url" })),
        h("button", { type: "button", class: "btn alt", on: { click: () => copyText(url, "q-url") } }, "Copy the address"),
        h("label", { class: "field" }, h("span", null, "Your key (keep it private)"), h("input", { class: "input", readOnly: true, value: token, id: "q-token" })),
        h("button", { type: "button", class: "btn alt", on: { click: () => copyText(token, "q-token") } }, "Copy the key"),
        h("label", { class: "field" }, h("span", null, "Your categories, one per line"), h("textarea", { class: "input", readOnly: true, rows: "4", id: "q-cats" }, rows("categories").filter(c => c.kind === "expense").sort(bySort).map(c => c.name).join("\n"))),
        h("button", { type: "button", class: "btn alt", on: { click: () => copyText(rows("categories").filter(c => c.kind === "expense").sort(bySort).map(c => c.name).join("\n"), "q-cats") } }, "Copy the categories"),
        h("section", { class: "card qs-card" },
          h("div", { class: "row" }, h("span", { class: "dot neutral" }, icon("chart", "ico sm")),
            h("span", { class: "row-main" }, h("span", { class: "row-title" }, "Today's spending in a Shortcut"), h("span", { class: "row-sub wrap" }, storedSettings().quickSummary ? "On" : "See what you spent today and what's left, without opening the app")),
            h("button", { type: "button", class: "switch", role: "switch", "aria-checked": String(!!storedSettings().quickSummary), "aria-label": "Today's spending in a Shortcut", on: { click: async () => {
              const on = !storedSettings().quickSummary;
              saveSettings({ quickSummary: on });
              if (!on) { store.set("qsLast", ""); await sb.from("quick_summary").delete().eq("user_id", S.uid); }
              else queueQuickSummary();
              draw();
            } } }, h("span", { class: "knob" }))),
          storedSettings().quickSummary ? h("div", { class: "prose" },
            step(1, "Create a second Shortcut", "Name it “Today”. Add “Get Contents of URL” with the same address and key as above, Method POST, Request Body JSON, and two text fields: token (your key) and action (type today)."),
            step(2, "Show the answer", "Add “Get Dictionary Value”, set the key to text, then add “Show Notification” (or “Show Result”) with the Dictionary Value."),
            step(3, "Put it on your Home Screen", "Long-press the Home Screen → Edit → Add Widget → Shortcuts, and pick “Today”. One tap shows today's spending and what's left this month.")) : null,
          h("p", { class: "hint" }, "When this is on, the app saves a one-line summary (today's total, this month's total and what's left) on the server so the Shortcut can read it. Your entries stay encrypted.")),
        h("button", { type: "button", class: "btn danger", on: { click: async () => {
          if (!navigator.onLine) return toast("Connect to the internet to turn this off.", "error");
          await sb.from("quick_summary").delete().eq("user_id", S.uid);
          await sb.from("quick_lists").delete().eq("user_id", S.uid);
          store.set("qlLast", "");
          saveSettings({ quickSummary: false });
          const { error } = await sb.from("quick_tokens").delete().eq("user_id", S.uid);
          if (error) return toast("Couldn't turn it off. Try again.", "error");
          try { localStorage.removeItem(lsKey("quickToken")); localStorage.removeItem(lsKey("qwiz")); } catch { }
          draw(); render();
          toast("Quick add turned off. The old key no longer works.");
        } } }, "Turn off quick add"));
    };
    draw();
    openSheet("Add without opening the app", body);
  }

  function maybeOnboard() {
    const st = settings();
    if (S.onboarding || !S.session || !st.seeded || storedSettings().onboarded || S.recoveryCode || document.querySelector(".overlay")) return;
    if (rows("transactions").length || rows("accounts").some(a => Number(a.opening_balance)) || st.income > 0 || Object.keys(st.incomeSteps).length) { saveSettings({ onboarded: true }); return; }
    S.onboarding = true;
    setTimeout(() => { if (document.querySelector(".overlay")) { S.onboarding = false; return; } onboardSheet(); }, 350);
  }

  function onboardSheet() {
    const f = { step: 1, cur: mainCur(), income: "", bal: {}, picks: null };
    const STEPS = 4;
    const lebanese = () => f.cur === "USD" || f.cur === "LBP";
    const templates = () => {
      const c = f.cur, leb = lebanese(), base = leb ? "USD" : c;
      return [
        { k: "cash-usd", name: leb ? "Cash (dollars)" : "Cash", currency: base, kind: "cash", hint: "Money in your pocket", on: true },
        leb ? { k: "cash-lbp", name: "Cash (lira)", currency: "LBP", kind: "cash", hint: "Lebanese pounds", on: true } : null,
        { k: "bank", name: "Bank account", currency: base, kind: "bank", hint: "Current or salary account", on: true },
        { k: "card", name: "Credit card", currency: base, kind: "card", hint: "What you spend on credit", on: false },
        { k: "whish", name: leb ? "Whish" : "E-wallet", currency: base, kind: "wallet", hint: leb ? "Whish Money wallet" : "PayPal, Revolut, Apple Cash…", on: leb },
        { k: "savings", name: "Savings", currency: base, kind: "savings", hint: "Money you put aside", on: true }
      ].filter(Boolean);
    };
    const applyAccounts = () => {
      const p = S.uid, list = templates(), items = [];
      const used = id => rows("transactions").some(x => x.account_id === id || x.to_account_id === id);
      list.forEach((t, i) => {
        const id = `${p}:acc:${t.k}`, cur = acc(id);
        if (f.picks[t.k]) items.push({ t: "accounts", r: { ...(cur || {}), id, name: t.name, currency: cur && used(id) ? cur.currency : t.currency, kind: t.kind, opening_balance: cur ? cur.opening_balance : 0, sort: i, archived: false } });
      });
      if (items.length) putMany(items);
      const keep = new Set(list.filter(t => f.picks[t.k]).map(t => `${p}:acc:${t.k}`));
      for (const a of rows("accounts")) if (String(a.id).startsWith(`${p}:acc:`) && !keep.has(a.id) && !used(a.id) && !Number(a.opening_balance)) removeRow("accounts", a);
    };
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
      toast("You're all set.");
    };
    const draw = () => {
      err.textContent = "";
      const head = h("div", { class: "onboard-head" }, h("small", null, `Step ${f.step} of ${STEPS}`), h("div", { class: "bar" }, h("span", { style: { width: (f.step / STEPS * 100) + "%" } })));
      let kids;
      if (f.step === 1) kids = [h("h3", null, "Which currency do you think in?"), h("p", { class: "hint" }, "Totals and budgets are shown in it. You can still hold accounts in other currencies."),
        h("div", { class: "chips wrap" }, ["USD", "LBP", "EUR", "AED", "SAR", "GBP"].map(c => h("button", { type: "button", class: "chip", "aria-pressed": String(f.cur === c), on: { click: () => { f.cur = c; draw(); } } }, `${c} · ${curInfo(c).name}`))),
        curSelect("ob-cur", f.cur, c => { f.cur = c; draw(); })];
      else if (f.step === 2) {
        if (!f.picks || f.picks.cur !== f.cur) f.picks = Object.fromEntries([["cur", f.cur], ...templates().map(t => [t.k, t.on])]);
        kids = [h("h3", null, "Which accounts do you use?"), h("p", { class: "hint" }, "Pick where you keep your money. You can add, rename or hide accounts later in Settings."),
          h("div", { class: "ob-accs" }, templates().map(t => h("button", { type: "button", class: "ob-acc" + (f.picks[t.k] ? " on" : ""), "aria-pressed": String(!!f.picks[t.k]), on: { click: () => { f.picks[t.k] = !f.picks[t.k]; draw(); } } },
            h("span", { class: "dot acc-dot k-" + t.kind }, icon(KIND_ICON[t.kind], "ico sm")),
            h("span", { class: "row-main" }, h("span", { class: "row-title" }, `${t.name} · ${curTag(t.currency)}`), h("span", { class: "row-sub" }, t.hint)),
            h("span", { class: "ob-check" }, f.picks[t.k] ? icon("check", "ico sm") : null))))];
      }
      else if (f.step === 3) kids = [h("h3", null, "What is your monthly income?"), h("p", { class: "hint" }, "Leave it empty if it changes every month. The plan will follow what you log."),
        h("input", { id: "ob-income", class: "input num", inputmode: "decimal", autocomplete: "off", placeholder: `${curSymbol(f.cur)} 1500`, value: f.income, "aria-label": "Monthly income", on: { input: e => { f.income = e.target.value; } } })];
      else kids = [h("h3", null, "How much do you have right now?"), h("p", { class: "hint" }, "Enter today's balance for the accounts you use. Skip the rest."),
        ...rows("accounts").filter(a => !a.archived).sort(bySort).map(a => h("label", { class: "field" }, h("span", null, `${tr(a.name)} (${a.currency})`),
          h("input", { class: "input num", inputmode: "decimal", autocomplete: "off", placeholder: "0", value: f.bal[a.id] || "", on: { input: e => { f.bal[a.id] = e.target.value; } } })))];
      body.replaceChildren(head, ...kids, err, h("button", { type: "button", class: "link-btn", on: { click: () => finish(true) } }, "Skip for now"));
      back.style.display = f.step === 1 ? "none" : "";
      next.textContent = tr(f.step === STEPS ? "Finish" : "Continue");
    };
    body.addEventListener("submit", ev => {
      ev.preventDefault();
      if (f.step === 2) {
        if (!templates().some(t => f.picks[t.k])) return fail(err, "Pick at least one account.");
        applyAccounts();
      }
      if (f.step === 3 && f.income.trim() && !parseAmt(f.income)) return fail(err, "Enter the amount as a number, like 1500.", document.getElementById("ob-income"));
      if (f.step === STEPS) {
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
      [".gear-btn", "Settings", "Accounts, categories, reminders, language, security and backups."],
      [".tab-add", "Add anything", "Tap + to add what you spent. Press and hold it to add money you received, a transfer, a loan or a shared bill."],
      [".loans-card", "Money between you and others", "Who owes you and who you owe. Tap Remind to send a friendly WhatsApp message."],
      [".tiles", "Your day and month", "What you spent today and this month, and how much you can still spend per day to stay on plan."],
      [".month-card", "Month plan", "How much of this month's plan is used. Tap it to change your income or your groups."],
      [".quick", "Quick add", "Your most used categories. Tap one to add an expense already filed in that category."],
      [".remind-pill, .remind", "Daily reminder", "A notification every evening so no expense is forgotten."],
      [".dock .tabs", "Sections", "Home, Activity for every entry, Insights for where your money goes, Split for loans and shared expenses. Tap a tab or slide your finger along the bar."],
      [".help-btn", "Ask Gio anytime", "Tap Ask Gio to ask questions about your money, or to replay this tour."]
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
    track("tour", view);
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

  const ADMIN_CHANGES = [
    { v: "3.78.1", items: [
      ["", "One-row header", "Title and controls back on one row (smaller header): title 25px (22px Arabic) never truncated, then Ask Gio pill, eye, bell, avatar at 40px. The keys row is a size container: when it has under 250px the pill collapses to the Gio logo only (Home, Split), otherwise it shows Ask Gio (Insights). Desktop title 30px."]
    ] },
    { v: "3.78.0", items: [
      ["", "Gio", "The assistant is now called Gio: header pill, sheet title, consent, hello, Insights card, tour and error texts; the system prompt says it is Gio. New gioMark() SVG logo (emerald rounded tile, gold coin ring, gold four-point spark, small white spark) with a slow twinkle, faster while thinking; reduced motion off. Fix for busy answers: Groq retired llama-3.3-70b-versatile (logs showed 404 model_not_found), so models are now openai/gpt-oss-120b, then gpt-oss-20b, then llama-3.1-8b-instant, with reasoning_effort low and include_reasoning false; empty replies are logged. Function version 4."]
    ] },
    { v: "3.77.0", items: [
      ["", "No mirroring in Arabic", "The page is always dir=ltr, so in Arabic every button, tab, swipe and card keeps the same place as in English (right-hand reach). Arabic text from h() is wrapped in <bdi dir=rtl> so words, numbers and punctuation read in the right order; inputs use unicode-bidi: plaintext. Removed the tab, lens, segment and swipe mirroring in JS and all [dir=rtl] CSS; text-align start/end became left/right. Arabic font and zero letter-spacing now keyed on html[lang=ar]; receipt uses the UI font for Arabic words."]
    ] },
    { v: "3.76.1", items: [
      ["", "Avatar on the right", "Header order is now Ask AI, eye, bell, then the avatar (Settings) at the end; mirrored in Arabic."]
    ] },
    { v: "3.76.0", items: [
      ["", "New header", "Header is now two rows: big page title on top, then avatar (Settings), an Ask AI pill with a slow emerald-gold border sheen, eye and bell. The header sticks at top: -46px so the title scrolls away and the controls row stays, title fades when scrolled, solid background when scrolled. Replaces the 3.75 dock. Eye turns dark when amounts are hidden. Desktop: pill capped at 460px, avatar hidden. Sheen off with reduced motion."]
    ] },
    { v: "3.75.0", items: [
      ["", "Top bar dock", "3.74 keys replaced by one emerald and gold dock (user picked it from 3 mockups): AI is a chat bubble with an AI tag, eye toggle, bell with badge, initial for Settings, gold dividers, RTL-aware. Portfolio button removed from the bar; when the Portfolio teaser was dismissed and there are no holdings, Home now shows a slim Portfolio row instead of nothing. Hover only on hover devices; Settings key hidden on desktop like before. Removed orb, coin, switch track, cog badge and bell ring."]
    ] },
    { v: "3.74.0", items: [
      ["", "Top bar keys", "Top bar rebuilt as separate keys instead of one glass pill: glowing conic orb behind the AI star, gold coin for Portfolio, privacy switch with eye knob (role=switch, aria-checked), bell that rings when there are unread items, avatar with the first letter of the name (or email) plus a small cog badge for Settings. Title shrinks to fit and truncates instead of overlapping; keys shrink at 430 px and 380 px, coin hidden under 350 px. New cog icon. Animations off with reduced motion."]
    ] },
    { v: "3.73.0", items: [
      ["", "AI assistant (Groq)", "AI assistant: new edge function assistant (own auth via getUser, CORS to the app origin, 30 questions per user per day via assistant_usage + assistant_take, max 8 messages of 1,200 chars, 25 s timeout, no logging of content) calling Groq llama-3.3-70b-versatile with a system prompt limited to the user's summary, no investment advice and prompt-injection guard. The phone builds the summary only when a question is asked (month totals incl. loans, last month, plan, categories with budgets, account balances, people balances, next 30 days bills, investments, last 25 entries); nothing is stored. First use shows a consent card. Entry points: the top-bar star (replaces the ? button; How it works and the tour are linked inside) and an Ask AI card in Insights. Needs the GROQ_API_KEY secret on Supabase, until then users see that the assistant isn't switched on yet. On phones 350px or narrower the Portfolio gem hides instead of the AI button."]
    ] },
    { v: "3.72.3", items: [
      ["", "Person history titles", "History entries without a note now read You gave NAME or NAME gave you as the title, with You gave/You got, the account and the date underneath, the same layout as entries with a note."]
    ] },
    { v: "3.72.2", items: [
      ["", "Pick the account when editing a loan entry", "Edit entry for a person now has Taken from / Put into with every account plus Don't move money. Choosing an account creates or moves the matching account entry; choosing Don't move money removes it. Lets users turn a starting balance into real money that came in."]
    ] },
    { v: "3.72.1", items: [
      ["", "Starting balances of people not counted", "A person's starting balance (debt that existed before they were added) was counted as money that came in or went out this month since 3.70. It is now left out of Spent, Came in and Left over; only real loans given or received during the month count."]
    ] },
    { v: "3.72.0", items: [
      ["", "Coming up card", "Home Coming up card moved right under the balance card (and payday card): totals due this week and in the next 30 days, the next 4 bills and repeating entries with a date badge (amber within 3 days, red when due or late), status, account, and a Pay button for bills. See all opens a 90 day list with the total and Add a bill. upcomingRules now uses the requested window for bills too (was fixed 10 days) and includes active repeating entries due today. The Never miss a bill teaser stays lower on Home."]
    ] },
    { v: "3.71.0", items: [
      ["", "View only shared loans", "Shared loans are view only by default: new column loan_links.view_only (default true for new links, existing links keep editing), insert policy on shared_entries now requires not view_only so members cannot add entries server side, and new RPC set_loan_view_only(token, on) for the owner. Owner sees whether the other person can only see or can also add, with a button to switch. Member side reads view_only, hides the give/get buttons, shows a view only note and excludes that person from the add screen loan list. Private link text explains it."]
    ] },
    { v: "3.70.0", items: [
      ["", "Two-way loans, editable entries, simpler wording, Home order", "Loans reworked: each person keeps a net balance that can switch sides (someone who owed you can end up being owed, and back), shown everywhere by its real side (hero, lists, totals, chips, reminders, WhatsApp texts, shared page). Person screen: two buttons I gave NAME and NAME gave me with no maximum; the add screen loan choices use the same words; activity rows read You gave NAME or NAME gave you; history rows show You gave/You got with arrows. Tapping a history entry (not for linked shared people) opens Edit entry: switch gave/got, change amount, note and date, or delete; the matching account entry is updated or deleted too. Loans saved with Don't move money now also count in month Spent and Came in. Wording: Lend or borrow renamed Money with a person. Home: Money with others moved below the tiles and plan, and restyled as a neutral card with green and red accented totals so it no longer sits as a second green block under the balance card."]
    ] },
    { v: "3.69.1", items: [
      ["", "Loans flagged", "Loan amounts are marked: a blue LOAN tag on the loan lines in month sheets, on the receipt and on every loan entry row, and the Insights Spent and Came in tiles say incl. $X loans. Fixed the receipt getting wider than the paper when a line has a tag."]
    ] },
    { v: "3.69.0", items: [
      ["", "Loans in month totals", "Month totals now include loans: loan_out (lent, paid back to someone, paid for a shared group) adds to Spent under a virtual category Lent & paid for others (blue); loan_in (borrowed, paid back to you, received from a group) adds to Came in under Borrowed & paid back to you (teal). Affects Insights tiles and month sheets, the receipt (tapping the loan line opens Split), Home Spent tiles, the plan tank and reports. Loans are not added to plan buckets or category budgets, and transfers are still not counted."]
    ] },
    { v: "3.68.0", items: [
      ["", "Insights tile details", "Insights tiles Spent, Came in and Left over/Overspent are now buttons opening a month sheet: summary card with total and entry count, breakdown by category (spent) or by source (came in) with bars and shares, then every entry of that kind for the month (tap to edit). Left over shows a came in vs spent split (each half opens its own sheet) and all income and expense entries."]
    ] },
    { v: "3.67.0", items: [
      ["", "Receipt in Insights, Arabic fixes", "Insights: coin stacks removed; the Where it went list is replaced by a printed receipt card (printer slot, paper slides out in steps when it scrolls into view, zigzag tear edge, monospace lines with dotted leaders, per category amount, number of entries and share bar, total spent, came in, left over or overspent, barcode). Tapping a line opens Activity filtered to that category; the empty month shows a plain message. Arabic: total balance label no longer sits under the card chip; people rows now translate Owes you / You owe and since. The 3.66 What's new entry for coins was removed."]
    ] },
    { v: "3.66.1", items: [
      ["", "Accounts open as cards", "The accounts section always opens as swipeable cards. See all now lasts only until the app is closed or reloaded instead of being remembered on the device."]
    ] },
    { v: "3.66.0", items: [
      ["", "Coin stacks", "Insights: spending dial replaced by coin stacks (canvas): top 6 categories plus Everything else, each a stack of gold coins (up to 14, height scaled to the biggest) with a category-colored edge band; coins fall in with gravity and a small bounce when the card scrolls into view; slide a finger across to select a stack (glow and light haptic where supported), tap a stack to re-drop its coins; the line below shows category, amount and share. The 3.65 What's new entry for the dial was removed."]
    ] },
    { v: "3.65.0", items: [
      ["", "Spending dial and accounts grid", "Insights: spending bubbles replaced by a vault-style spending dial (canvas): category segments sized by spending (top 9 plus Everything else), gold tick ring and pointer, drag to turn with inertia, snaps to the segment under the pointer, tap a segment to spin to it; the center shows the category, amount and share. Accounts: See all / Show as cards toggle (remembered per device) switches the carousel to a 2-column grid (3 on wide screens)."]
    ] },
    { v: "3.64.0", items: [
      ["", "Accounts cards, liquid plan, spending bubbles", "Accounts section rebuilt: header with count and total, a distribution bar of positive balances by account kind, then a horizontal snap carousel of bank-card shaped account cards (kind materials: emerald cash, blue bank with chip, titanium card with chip, coral e-wallet, gold savings; balance, converted value, name and currency tag; side cards shrink, tilt and fade as you swipe), ending with a dashed Add account card. Home month plan card is now a liquid tank (canvas waves at the percent used, green, amber at 80%, red when over) that sloshes when you drag across it; a drag no longer opens the plan. Money planet removed from Home and Insights; Insights gets spending bubbles: up to 12 categories as physics circles sized by amount, draggable and flickable, tap one to show name, amount and share. Animations pause off screen and in the background."]
    ] },
    { v: "3.63.0", items: [
      ["", "Planet, portfolio cost, owe chip, Arabic title", "Money planet: interactive particle globe on Home (after the tiles) and Insights (after the summary button) with bands colored by this month's spending per category (up to 14), drag to spin with inertia, legend of the top 3 (Home) or 5 (Insights); tapping the Home card opens Insights, a swipe does not. Portfolio: total \"You paid\" on the gold card, a You paid → Worth now block in the Portfolio sheet (only holdings with a purchase price, with a note when some have none), and Paid → Now under each holding. Balance card: added a \"you owe\" chip next to \"owed to you\" (the total balance itself only counts money in accounts; lent and borrowed money moved through an account are already reflected there). Arabic: app title shows ميزانية وتقسيم on one line; total balance label no longer hides under the card chip. Fixed: canvas globes lost their size after a re-render."]
    ] },
    { v: "3.62.0", items: [
      ["", "Two-step add flow", "Add sheet rebuilt as two steps. Step 1: type tabs, money card with the amount, balance or balance after, account and date chips, and a large number pad at thumb height. The button reads Choose category (or Choose who for loans, Next for moves) in gold; it reads Save directly when everything is already set (preset category from Quick add, editing an entry, or a move between same-currency accounts). A chip on the card shows the picked category and opens step 2. Step 2: a summary bar with the amount, account and date (tap to go back), a search field when there are more than 9 categories, every category as a 4-column tile grid sorted by use (selected tile fills with its color and shows a check), then the note with quick-note chips, receipt camera and Every month. Picking a category that needs a note opens the keyboard on the note right away and the grid collapses to the chosen tile; otherwise the Save button pulses. Steps slide left and right. The 3.58 single-screen layout and the 3.61 note-mode hiding of the pad are replaced by this flow."]
    ] },
    { v: "3.61.1", items: [
      ["", "Category renamed", "\"Haircut & personal care\" renamed to \"Personal care\" for new users, and once for existing users whose category still has the old name (a name they changed themselves is kept). The 3.59 What's new note now says Personal care."]
    ] },
    { v: "3.61.0", items: [
      ["", "Note typing and keyboard fit", "Note typing on iPhone: the open sheet now resizes to the visible area above the keyboard (visualViewport height and offset), so the header stays in place, there is no empty gap and the Save button sits right above the keyboard. Removed the scroll-into-view jump; the sheet scrolls to the top instead. While typing, the note field glows and up to 8 most used notes for the chosen category (or the entry type if none is chosen) from the last 90 days show as tappable chips; tapping keeps the keyboard open. The same keyboard fit applies to every sheet with a text field."]
    ] },
    { v: "3.60.0", items: [
      ["", "Add screen fit fixes", "While the note field has focus, the number pad, balance line, account and date chips and the Every month chip hide and the amount shrinks to a slim bar, so the phone keyboard never covers anything; the note scrolls to the middle. Tapping the amount bar closes the keyboard. Number pad is no longer sticky, so it can not cover the note or categories. On short screens (iPhone SE size) the layout tightens so every field is fully visible without scrolling."]
    ] },
    { v: "3.59.0", items: [
      ["", "New category", "\"Haircut & personal care\" (wants, purple, scissors icon) added for new users and, once, for existing users after Health unless they already have a similar category (hair, barber, salon, beauty, personal care). No note required by default. Custom categories with those words also get the scissors icon."]
    ] },
    { v: "3.58.0", items: [
      ["", "Add screen redesign", "Amount, account and date now sit on an emerald money card with guilloche and a light sweep. The amount is larger and tinted by type (rose for spent with a minus, mint for received with a plus, gold for moves, blue for loans). New live line shows the account balance, then the balance after the entry while typing (red if it goes below zero); hidden when editing or for loans. Categories are one horizontal swipeable row of pills sorted by use; More still opens the full grid. Note field is a pill. Number pad keys have no boxes, bigger digits and a soft press highlight. Save button is dashed until an amount is typed. Sheet scrollbars hidden everywhere. Everything fits on one screen on a normal iPhone."]
    ] },
    { v: "3.57.0", items: [
      ["", "Morphing + and gold card revert", "Gold card put back to the 3.55 look (no hologram, no coin center, no brushed layer). The 3.56 What's new note was removed. + button is now a morphing blob: organic shape that changes every 6 seconds, rotating emerald and gold gradient with a glossy highlight, a blurred glow that morphs the other way behind it, a jelly squash and stretch on tap and the plus turns 90 degrees while pressed."]
    ] },
    { v: "3.56.0", items: [
      ["", "Gold card and + coin", "Gold card: richer multi-stop metal with two light bands, brushed texture layer, double beveled frame, engraved text (light and dark edge), recessed chips and legend, gold coin with a milled edge at the center of the ring, a rainbow hologram sticker that slowly shifts, stronger moving shine and a glare that follows the finger. + button: emerald coin face with a reeded gold rim that slowly turns, a rotating emerald-and-gold aura, a light glint every few seconds, an engraved gold plus, and a 3D coin flip on tap. The + no longer gets the tap ripple."]
    ] },
    { v: "3.55.0", items: [
      ["", "Wallet stack", "When the user has investments, Home shows the balance card and the Portfolio as a stacked wallet: the back card peeks above the front one with its total and change, and tapping it swaps them with a spring animation. Portfolio card, empty Portfolio teaser and the Portfolio sheet header restyled as brushed gold plate with dark text, darker ring and legend colors for contrast. The \"invested\" chip was removed from the balance card since the gold card shows it. Trend line now ends before the card corner so today's dot is never cut off."]
    ] },
    { v: "3.54.0", items: [
      ["", "Home balance card", "30-day balance trend on the total balance card, rebuilt backwards from today's total using every entry (income, spending, loans and transfers, converted to the main currency), drawn as a glowing emerald-to-gold line with a pulsing dot for today. Change over 30 days shown under the total. Scrub the line to see the date and balance of any day. Tap the card to flip it in 3D: the back has a magnetic stripe, this month's spent, received and safe to spend per day, and the user name. Hidden amounts disable scrubbing."]
    ] },
    { v: "3.53.0", items: [
      ["", "Interactive layer (inmind.ai style)", "Canvas particle globe in gold and emerald (drag to spin with inertia, gentle breathing wave) on the sign-in hero, the unlock screen behind the logo and the empty Portfolio card. It pauses off screen, in the background and with reduce motion. 3D tilt with a light glare that follows the finger on the balance card, Portfolio card, Portfolio sheet and sign-in card. Count-up animation on the total balance and Portfolio totals when the value changes. Cards below the fold rise in as you scroll. Light ripple on buttons, keypad keys, settings tiles and the + button. Sign-in card bars recolored to emerald and gold."]
    ] },
    { v: "3.52.0", items: [
      ["", "Money theme", "Palette moved from navy and violet to emerald vault green and gold in both themes. Gold card chip and guilloche banknote pattern on the balance card, gold-foil totals on the balance and Portfolio, gold Portfolio buttons and labels, gold ring around the + button, gold settings avatar and sheet handles, green-and-gold suggestion cards and background glow. Status bar colors updated to match."]
    ] },
    { v: "3.51.0", items: [
      ["", "Unified futuristic design", "New cool palette for both themes (ice-white and deep navy-black), aurora background, deep-space surface shared by the total balance, Portfolio, Split banner and login, mint-to-ice gradient for every main button and the + button, one style for all suggestion cards (salary, split, bills, payday, your part), luminous card edges, neon focus rings and switches, gradient amounts in the add screen."]
    ] },
    { v: "3.50.0", items: [
      ["", "Portfolio redesign", "Gem button in the top bar opens a full-height Portfolio screen: deep-space hero with grid, sweep light, live pulse, total in a gradient, all-time and today's change, allocation ring with asset count, legend per type, grouped holdings, refresh button and an Add button. Home shows the same style as a card under the total balance (or a teaser when empty). Top bar tightened so 5 buttons fit from 320 px."]
    ] },
    { v: "3.49.0", items: [
      ["", "Investments", "Holdings live inside the encrypted settings (up to 60): gold with karat and grams/ounces/kilos, silver, 20 top coins, any Yahoo ticker, or a manual value. New edge function prices (signed-in users only) pulls gold-api.com, CoinGecko and Yahoo Finance, cached 10 minutes in price_cache. Home card with total, gain since purchase and daily change; hero chip; + More and Settings → Money entry points."]
    ] },
    { v: "3.48.0", items: [
      ["", "New logo", "B mark (white bar, white and gold half-coins) on the green gradient for the Home Screen icon, Android adaptive icon, browser tab, login, side bar, notifications and emails. The header reads Budget in ink and Split in the brand color."]
    ] },
    { v: "3.47.3", items: [
      ["", "No more −$0", "Amounts that round to zero (tiny leftovers from exchange rates) show as $0 instead of −$0."]
    ] },
    { v: "3.47.2", items: [
      ["", "Blank icon on new entries", "Each entry row now has its own identity, so a new entry is drawn fresh instead of repainting the old top row (iPhone sometimes lost the color doing that)."],
      ["", "No note for salary", "Salary never asks for a note, and a balance change only asks where the money came from when the category doesn't already say it."]
    ] },
    { v: "3.47.1", items: [
      ["", "Lighter on the phone's graphics chip", "Removed blur effects from things that scroll (search, month picker, top bar shadow, buttons), sheets open in 0.3 s instead of 0.42 s, bar charts animate faster, and Activity only draws the day cards on screen."]
    ] },
    { v: "3.47.0", items: [
      ["", "Top bar follows the theme natively", "Same setup as Ishtirak: two theme colors (light and dark) so iPhone switches the top bar by itself with Match my phone. The chosen theme is applied before the first paint. Forcing Light or Dark only reloads when the look really changes."],
      ["", "Faster everywhere", "Dates and amounts reuse cached formatters, today's date is cached, Activity shows 50 entries first and loads more as you scroll, screen transitions are shorter. With 3,000 entries on a phone-speed CPU: boot about 60 ms, tab switches about 40% faster."]
    ] },
    { v: "3.46.2", items: [
      ["", "Top bar follows the theme", "The status bar area at the top now switches with Light or Dark right away."]
    ] },
    { v: "3.46.1", items: [
      ["", "Parking category", "New spending category Parking (Needs, no note needed), added for new and existing users."]
    ] },
    { v: "3.46.0", items: [
      ["", "Notes only where they help", "Note required now skips everyday categories (Groceries, Rent & home, Bills, Generator, Fuel, Subscriptions, Salary, Loan repayments). Users change the list in Settings → Entries and defaults."]
    ] },
    { v: "3.45.3", items: [
      ["", "Bill in the + screen", "Tap + → More → A bill to pay every month."]
    ] },
    { v: "3.45.2", items: [
      ["", "Add a bill from the + button", "Hold the + button and pick Bill. Useful after closing the Never miss a bill card."]
    ] },
    { v: "3.45.1", items: [
      ["", "Clear who pays whom", "Each member sees “Your part” at the top (You pay Roudy $40 / Charbel pays you $130) with an I paid button. The list reads in plain words and has a Share button to send it to the group chat."]
    ] },
    { v: "3.45.0", items: [
      ["", "Group totals", "Each group now shows a Totals card: what each person paid, their share, and whether they get money back or owe, plus the total spent together."]
    ] },
    { v: "3.44.2", items: [
      ["", "Any currency for split groups", "New groups could only use currencies you already had (USD and LBP). Now the picker shows your currencies first, then every supported currency."]
    ] },
    { v: "3.44.1", items: [
      ["", "Better salary suggestion", "The suggestion now uses your Plan income first and never picks a Savings account; the card says Suggested so it's clear it's a guess."]
    ] },
    { v: "3.44.0", items: [
      ["", "Salary in one tap", "New salary sheet with the amount, account and payday already filled (from your last salary, the Plan income, or your bank account). Reachable from a Home suggestion, the Plan income card, and Settings → Repeating and bills. It still asks on payday before adding."]
    ] },
    { v: "3.43.1", items: [
      ["", "Plan income list fixed", "The list of monthly income changes in Plan was squeezed into columns with overlapping text. It's one clean row per change again."]
    ] },
    { v: "3.43.0", items: [
      ["", "Settings redesign", "Profile card with sync status, search across every setting, 4 quick switches (App lock, Daily reminder, Hide amounts, Note required), colored sections: Money, App, Privacy and data, Help, Account."],
      ["", "Swipe back and back button", "Sub-pages slide in, swipe from the left edge (right in Arabic) to go back; Android back button and browser back work too."],
      ["", "New: Appearance, Defaults, Advanced", "Light/Dark/Automatic theme, start with amounts hidden, default pay-from account, check for updates, refresh the app, reload from server, diagnostics with copy (no amounts or notes)."]
    ] },
    { v: "3.41.0", items: [
      ["", "Hidden: salary confirmation on payday", "Picking Salary under Received turns on Every month by itself. On each payday, Home asks “Did your salary come in?” (Yes, Other amount, Not yet) and only adds it after a yes. Not shown in What's new."],
    ] },
    { v: "3.42.2", items: [
      ["", "Back Tap wording", "Setup texts no longer say double-tap; users pick Double or Triple Tap themselves."]
    ] },
    { v: "3.42.1", items: [
      ["", "Shortcut link opens in Safari", "From the installed app, the Shortcut link now opens in Safari instead of the in-app browser, which showed a white page."]
    ] },
    { v: "3.42.0", items: [
      ["", "Shortcut setup button works", "The blue Add Shortcut picture in the setup guide now opens the Shortcut too."],
      ["", "Hidden: pay back negative accounts", "After a salary is confirmed, if any account is below zero (cards first), the app asks to pay them back from the salary account. The user picks which ones; each is saved as a transfer."]
    ] }
  ];
  const CHANGES = [
    { v: "3.78.0", items: [
      ["star", "Meet Gio", "Your money assistant now has a name and its own logo. Tap Ask Gio at the top to ask about your spending, bills, loans or how the app works."]
    ] },
    { v: "3.77.0", items: [
      ["globe", "Same layout in Arabic", "In Arabic, buttons and menus now stay in the same place as in English, so they are just as easy to reach with your right hand. Only the words change."]
    ] },
    { v: "3.76.0", items: [
      ["bubble", "A new header", "Ask AI now has its own bar at the top so it is easy to find. Your initial opens settings, and the eye and bell sit next to it. Portfolio lives on your Home screen."]
    ] },
    { v: "3.73.0", items: [
      ["star", "Ask AI, for free", "Tap the gold star at the top to ask anything about your money: how much you spent, where you can save, who owes you, or how the app works. 30 free questions a day."]
    ] },
    { v: "3.72.0", items: [
      ["cal", "Coming up on Home", "Your next bills and scheduled payments now show near the top of Home, with how much is due this week and in the next 30 days. Tap See all for the next 3 months."]
    ] },
    { v: "3.71.0", items: [
      ["link", "Share a loan, view only", "Send someone their private link. They see the balance and every entry in their own app, but only you can change it. You can let them add entries if you want."]
    ] },
    { v: "3.70.0", items: [
      ["people", "Give and get, as often as you want", "With the same person you can now give and get money as many times as you like, and the app works out who owes who. Tap any entry in their history to change or delete it."]
    ] },
    { v: "3.69.0", items: [
      ["people", "Loans now count", "Money you lend now counts in what you spent, and money you borrow or get back counts in what came in. They are flagged as Loan everywhere so you can tell them apart."]
    ] },
    { v: "3.68.0", items: [
      ["chart", "Tap to see the details", "In Insights, tap Spent, Came in or Left over to see the month's entries and where the money went or came from."]
    ] },
    { v: "3.67.0", items: [
      ["note", "Your month as a receipt", "Insights prints your month like a shop receipt: every category with its amount and how many times you spent, then the total. Tap a line to see those entries."]
    ] },
    { v: "3.65.0", items: [
      ["card", "See all your accounts", "Tap See all next to your accounts to see every card at once."]
    ] },
    { v: "3.64.0", items: [
      ["card", "Your accounts, as real cards", "Swipe through your accounts like cards in a wallet, with a bar showing where your money sits."],
      ["chart", "Play with your money", "Your month plan fills like liquid you can shake."]
    ] },
    { v: "3.63.0", items: [
      ["coin", "What you paid, what it's worth", "The Portfolio now shows how much you paid next to what your investments are worth today, for each one and in total."]
    ] },
    { v: "3.62.0", items: [
      ["plus", "Adding is now two simple steps", "First type the amount on a big number pad. Then pick the category from a clear grid, add a note if you want, and save."]
    ] },
    { v: "3.61.0", items: [
      ["note", "Quicker notes", "When you write a note, the notes you use most for that category show up. Tap one to fill it in."]
    ] },
    { v: "3.59.0", items: [
      ["tag", "Personal care", "A new category for haircuts, the salon, nails and other personal care."]
    ] },
    { v: "3.58.0", items: [
      ["plus", "A new way to add", "The add screen is redesigned: a big amount on a money card, your balance after the entry before you save, categories in one swipeable row and a cleaner number pad."]
    ] },
    { v: "3.57.0", items: [
      ["plus", "A living + button", "The + button is now a soft liquid shape in emerald and gold that slowly moves and wobbles like jelly when you tap it."]
    ] },
    { v: "3.55.0", items: [
      ["gem", "Your wallet", "Your balance and your investments are now two cards in one wallet. Portfolio is a gold card: tap the card behind to bring it to the front."]
    ] },
    { v: "3.54.0", items: [
      ["chart", "A living balance card", "Your card now shows how your balance moved in the last 30 days. Slide your finger on the line to see any day. Tap the card to flip it and see this month at a glance."]
    ] },
    { v: "3.53.0", items: [
      ["gem", "Touch your money", "Your balance card and Portfolio tilt and shine as you touch them, totals count up, and the gold globe spins when you swipe it."]
    ] },
    { v: "3.52.0", items: [
      ["gem", "Made for money", "Emerald and gold colors, banknote-style patterns, and a total balance that looks like a premium bank card."]
    ] },
    { v: "3.51.0", items: [
      ["sun", "A whole new look", "BudgetSplit has a new futuristic design across every screen: deep-space cards, glowing buttons and one consistent style in light and dark mode."]
    ] },
    { v: "3.50.0", items: [
      ["gem", "Your portfolio, front and center", "A new Portfolio card on Home shows what your gold, crypto and stocks are worth live, your gain and today's move. Tap the gem at the top to open it, add or edit."]
    ] },
    { v: "3.49.0", items: [
      ["coin", "Gold, crypto and stocks", "Track gold (any karat), silver, crypto, stocks and ETFs with live prices, and see how much you've gained since you bought. Tap + → More → Gold, crypto or stocks."]
    ] },
    { v: "3.48.0", items: [
      ["star", "A fresh new look", "BudgetSplit has a new logo: a B made of a bar and a split coin. To see the new icon on your Home Screen, remove the app and add it again."]
    ] },
    { v: "3.46.0", items: [
      ["note", "Fewer notes to write", "Everyday things like groceries, fuel or bills no longer need a note. Pick which categories need one in Settings → Entries and defaults."]
    ] },
    { v: "3.44.0", items: [
      ["work", "Your salary, added on payday", "Set your salary once and on payday the app asks if it came in. Tap yes and it's added to your account."]
    ] },
    { v: "3.43.0", items: [
      ["gear", "A cleaner Settings", "Everything is grouped and easy to find, with a search box and quick switches at the top. Swipe from the edge to go back."],
      ["eye", "Light or dark, your choice", "Pick Light, Dark or Match my phone in Settings → Appearance. You can also start with amounts hidden."]
    ] },
    { v: "3.40.0", items: [
      ["phone", "Quick add sets itself up", "No more copying and pasting a key. Add the Shortcut, tap Connect, and it's linked to your account."]
    ] },
    { v: "3.39.0", items: [
      ["swap", "Smoother swipe on Android", "Swiping an entry to edit or delete now works the same on Android, iPhone and computers."],
      ["phone", "Fits every screen", "The number pad stays in view on small phones, and icons draw cleanly while you scroll."]
    ] },
    { v: "3.38.0", items: [
      ["phone", "Quick add asks what it was for", "The iPhone Shortcut now lets you pick the category, the account and add a note. Use it by double-tapping the back of your iPhone or by saying “Hey Siri, Add expense”."]
    ] },
    { v: "3.37.0", items: [
      ["phone", "Easier double-tap setup", "A simple 2-step guide: get the Shortcut (your key is copied for you), then turn on Back Tap. Find it on Home or in Settings."]
    ] },
    { v: "3.36.0", items: [
      ["phone", "Add by tapping the back of your iPhone", "Settings → Add without opening the app → Get the Shortcut. Your key is copied for you. Then turn on Back Tap and double-tap the back of your phone to add an expense."]
    ] },
    { v: "3.35.0", items: [
      ["phone", "Double-tap to add", "Double-tap the back of your iPhone, type the amount, and it's saved, without opening the app. Set it up in Settings → Add without opening the app."]
    ] },
    { v: "3.34.0", items: [
      ["star", "Split is easier to find", "The Share costs with friends card now sits right under your balance, so you see it as soon as you open the app."]
    ] },
    { v: "3.32.0", items: [
      ["plus", "A new + and loans up front", "+ now sits in the middle of the bar. Tap it to add an expense, or hold it for more. Home shows who owes you, with a Remind button, and the Split tab gets a badge when something needs you."]
    ] },
    { v: "3.31.0", items: [
      ["plus", "One simple screen to add", "Tap +, type the amount, tap what it was for, save. Spent or Received at the top, and More for transfers, loans and splitting a bill."]
    ] },
    { v: "3.29.0", items: [
      ["bell", "Bill reminders", "Add your generator, internet, rent or school fees. You get a notification before each one is due, and a Pay button on Home."],
      ["mail", "Monthly report by email", "On the 1st of each month, open the app and you get a summary of last month by email: what came in, what went out and where it went."],
      ["cam", "Scan a receipt", "When adding an expense, tap Scan a receipt. The total, date and shop are filled in for you. It's optional and works on your phone."],
      ["chart", "Today's spending in a Shortcut", "See what you spent today and what's left from a Home Screen Shortcut. Turn it on in Settings → Add from the Lock Screen."]
    ] },
    { v: "3.28.0", items: [
      ["users", "Split is one tap away", "Tap Split on Home to share a bill with friends or record a loan. The Split tab now shows how it works and where to start."],
      ["bank", "Pick your accounts when you start", "New users choose which accounts they use, with the right currency for where they live."]
    ] },
    { v: "3.27.0", items: [
      ["pencil", "Change an account's balance the right way", "Open an account and tap Change balance. Enter what it has now, then say where the extra money came from or what it was used for. It's saved as an entry, so your history adds up."],
      ["coin", "Starting balance stays simple", "The starting balance can still be changed any time without questions. Everything else is calculated from it."]
    ] },
    { v: "3.26.0", items: [
      ["card", "New look for your accounts", "Each account is now a card with its own icon and color, so cash, bank, card, e-wallet and savings are easy to tell apart."],
      ["phone", "Whish account added", "You now have a Whish e-wallet account. Set its balance or hide it from Settings → Accounts if you don't use it."]
    ] },
    { v: "3.25.0", items: [
      ["bell", "Invites show up in the app", "When someone invites you to a group, you get a notification and a message in your inbox. No need to find the email: open Split and tap Accept."],
      ["swap", "Notifications open the right place", "Tapping a group or loan notification takes you straight to Split."]
    ] },
    { v: "3.24.0", items: [
      ["swap", "Swipe to edit or delete", "In your entries, swipe right to edit. Swipe left and tap Delete to remove one. We ask before deleting anything."]
    ] },
    { v: "3.23.0", items: [
      ["coin", "Change a starting balance in one tap", "Open an account from Home and tap Starting balance at the bottom. Just the amount, no note or category."],
      ["globe", "Family support & remittances", "A new income category for money family or friends send you, from Lebanon or abroad."],
      ["users", "See who you invited", "Groups now show the email you sent each invite to."]
    ] },
    { v: "3.22.0", items: [
      ["users", "Groups of two can go back to a loan", "If you made a group and it's only you and one other person, open it and tap Turn back into a loan. The history and balance stay the same."]
    ] },
    { v: "3.21.1", items: [
      ["star", "Meet BudgetSplit", "My Wallet has a new name and icon. Same app, same data: track what you spend, plan your month, lend and borrow, and share with others."]
    ] },
    { v: "3.20.0", items: [
      ["swap", "Everything updates live", "Changes from your other devices and from the people you share with show up right away, without reopening the app."]
    ] },
    { v: "3.19.0", items: [
      ["mail", "Requests by email", "Add someone's email, even for people already on your list. They get an email and, if they use the app, a notification to accept."],
      ["people", "Their history follows them", "When they accept, everything you recorded for them counts for their account."]
    ] },
    { v: "3.18.0", items: [
      ["bank", "Groups move your money too", "When you pay or receive money in a shared group, pick the account. Only your own share counts as spending."],
      ["swap", "Loans become shared groups", "Open a person in People and tap Move to a shared group. The history comes with it."],
      ["people", "Link a name to an account", "If someone you added by name joins the app, tap their name to link them. Their history follows."]
    ] },
    { v: "3.17.0", items: [
      ["people", "Shared groups", "In People, make a group for a trip, the house or a loan to several people. Everyone sees the same history and who owes whom."],
      ["cart", "Expenses, loans and payments", "Add what someone paid and split it, a loan to one or more people, or a payment back. The app works out who owes whom."],
      ["mail", "Invite by email", "If they use BudgetSplit they get a notification to accept. If not, you send them a link by email."],
      ["trash", "Deleting needs everyone", "An entry is removed only when everyone in the group agrees."]
    ] },
    { v: "3.16.0", items: [
      ["link", "Shared loans", "If the person you lend to or borrow from uses BudgetSplit, they can open your private link while signed in and add the loan to their app."],
      ["people", "One history for both", "You both see the same entries. Either of you can add one, and it shows up for the other."],
      ["bell", "Notified on every change", "When one of you changes a shared loan, the other gets a notification."]
    ] },
    { v: "3.15.0", items: [
      ["star", "What's new", "After each update, this screen shows you what changed. You can open it again from Settings → General → Help."],
      ["note", "Notes and dates", "The note sits right under the amount, and every entry now shows its date. Transfers don't need a note."],
      ["swap", "Balances while moving money", "When you transfer, you see how much each account has. It turns red if you try to move more than you have."],
      ["chart", "Calmer budget alerts", "Budget warnings are grouped in one card on Home. Tap it to see each budget."],
      ["bank", "Goals follow your Savings", "Link a savings goal to an account and it follows that balance by itself."],
      ["bell", "Notifications inbox", "Tap the bell at the top to see every message sent to you."]
    ] }
  ];
  const cmpVer = (a, b) => { const x = String(a).split(".").map(Number), y = String(b).split(".").map(Number); for (let i = 0; i < 3; i++) { if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) - (y[i] || 0); } return 0; };
  const WHATS = { timer: 0 };
  const changesSeen = () => { try { return localStorage.getItem("wallet:changesSeen") || ""; } catch { return VERSION; } };
  const markChangesSeen = () => { try { localStorage.setItem("wallet:changesSeen", VERSION); } catch { } };

  function whatsNewSheet(all) {
    const seen = changesSeen();
    const list = all ? CHANGES.slice(0, 4) : CHANGES.filter(c => !seen || cmpVer(c.v, seen) > 0);
    markChangesSeen();
    if (!list.length) return;
    track("whats_new", all ? "menu" : "auto");
    const body = h("div", { class: "help-list whats-new" },
      list.map((c, i) => [
        list.length > 1 || all ? h("p", { class: "wn-ver" }, `Version ${c.v}`) : null,
        c.items.map(([ic, title, text]) => h("div", { class: "help-row" }, h("span", { class: "dot " + (i ? "neutral" : "gold") }, icon(ic, "ico sm")), h("div", null, h("h3", null, title), h("p", null, text))))
      ]));
    openSheet(all ? "What's new" : `What's new in ${VERSION}`, body, h("button", { type: "button", class: "btn", on: { click: closeSheet } }, "Got it"));
  }

  const REPORT = { busy: false, tried: null };
  async function maybeMonthlyReport() {
    if (REPORT.busy || !sb || !S.session || !navigator.onLine || !VAULT.key || !storedSettings().onboarded) return;
    const st = storedSettings();
    const prev = shiftMonth(thisMonth(), -1);
    if (st.reportOff || st.reportSent === prev || REPORT.tried === prev) return;
    if (!S.last || !Object.keys(S.last).length) return;
    REPORT.busy = true; REPORT.tried = prev;
    try {
      const s = monthStats(prev);
      if (!s.count && !s.income) { saveSettings({ reportSent: prev }); return; }
      const before = monthStats(shiftMonth(prev, -1));
      const round = v => Math.round(Number(v) || 0);
      const cats = [...s.byCat].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([id, v]) => { const c = cat(id); return { name: c ? c.name : "Uncategorized", amount: round(v), budget: c && Number(c.budget) ? round(Number(c.budget)) : 0, color: c && /^#[0-9a-f]{6}$/i.test(c.color) ? c.color : "#5b7083" }; });
      const big = s.biggest ? { name: (cat(s.biggest.category_id) || {}).name || "Expense", note: s.biggest.note || "", amount: round(txMain(s.biggest)), date: s.biggest.occurred_on } : null;
      const { data } = await sb.functions.invoke("send-invite", { body: { action: "report", month: prev, cur: mainCur(), spent: round(s.spent), income: round(s.income), plan: round(planFor(prev).base), prevSpent: round(before.spent), count: s.count, cats, big, name: settings().name || "" } });
      if (data && (data.emailed || data.already)) saveSettings({ reportSent: prev });
    } catch { } finally { REPORT.busy = false; }
  }

  function maybeWhatsNew() {
    const seen = changesSeen();
    if (WHATS.timer || !seen || cmpVer(CHANGES[0].v, seen) <= 0 || !S.session || !VAULT.key || S.onboarding || !storedSettings().onboarded) return;
    let tries = 0;
    const attempt = () => {
      WHATS.timer = 0;
      if (cmpVer(CHANGES[0].v, changesSeen()) <= 0) return;
      if (S.onboarding || TOUR.el || document.querySelector(".overlay, .lock, .viewer, .tour")) { if (++tries < 60) WHATS.timer = setTimeout(attempt, 800); return; }
      whatsNewSheet(false);
    };
    WHATS.timer = setTimeout(attempt, 1400);
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

  const AI = { msgs: [], busy: false };
  function aiContext() {
    const m = thisMonth(), s = monthStats(m), ps = monthStats(shiftMonth(m, -1));
    const M = v => fmt(v, mainCur(), { show: true });
    const L = [];
    L.push(`Main currency: ${mainCur()}. Today: ${today()}.`);
    L.push(`This month (${monthName(m)}): spent ${M(s.spent)}${s.loanOut ? ` (incl. ${M(s.loanOut)} given to people)` : ""}, came in ${M(s.income)}${s.loanIn ? ` (incl. ${M(s.loanIn)} from people)` : ""}, left over ${M(s.income - s.spent)}. Last month spent ${M(ps.spent)}, came in ${M(ps.income)}.`);
    const plan = planFor(m);
    if (plan.base > 0) L.push(`Month plan: ${M(plan.base)}, ${M(plan.base - s.spent)} left.`);
    const cats = [...s.byCat].filter(e => e[1] > 0).sort((p, q) => q[1] - p[1]).slice(0, 15);
    if (cats.length) L.push("Spending by category this month: " + cats.map(([id, v]) => { const c = cat(id); const b = c && Number(c.budget) > 0 ? ` of budget ${M(Number(c.budget))}` : ""; return `${c ? tr(c.name) : "Uncategorized"} ${M(v)}${b}`; }).join("; ") + ".");
    const bal = balances();
    const accs = rows("accounts").filter(a => !a.archived).sort(bySort);
    if (accs.length) L.push("Accounts now: " + accs.map(a => `${a.name} (${KIND_LABEL[a.kind] || a.kind}) ${fmt(bal.get(a.id) || 0, a.currency, { show: true })}`).join("; ") + ".");
    const t = owedTotals();
    const lb = loanBalances();
    const ppl = rows("people").map(p => [p, netMine(p, lb.get(p.id) || 0)]).filter(x => Math.abs(x[1]) > 0.004).sort((a, b) => Math.abs(b[1]) - Math.abs(a[1])).slice(0, 10);
    if (t.owed > 0.5 || t.owe > 0.5) L.push(`People: owed to you ${M(t.owed)}, you owe ${M(t.owe)}. ` + ppl.map(([p, n]) => `${p.name} ${n > 0 ? "owes you" : "you owe"} ${fmt(Math.abs(n), p.currency, { show: true })}`).join("; ") + ".");
    const up = upcomingRules(30);
    if (up.length) L.push("Coming up in 30 days: " + up.slice(0, 10).map(r => `${r.note || (cat(r.category_id) ? tr(cat(r.category_id).name) : "payment")} ${r.kind === "income" ? "+" : "-"}${fmt(Number(r.amount), r.currency, { show: true })} on ${r.next_on}${isBill(r) ? " (bill)" : ""}`).join("; ") + ".");
    if (holdings().length) { const ht = holdTotals(); L.push(`Investments: worth ${M(ht.value)}${ht.cost ? `, paid ${M(ht.cost)}` : ""}.`); }
    const recent = [...rows("transactions"), ...loanOnlyTx(m)].filter(x => monthOf(x.occurred_on) === m && x.kind !== "transfer").sort(byRecent).slice(0, 25);
    if (recent.length) L.push("Latest entries this month: " + recent.map(x => { const c = cat(x.category_id); const what = x.kind === "loan_out" || x.kind === "loan_in" ? loanTitle(x) : c ? tr(c.name) : x.kind; return `${x.occurred_on} ${what} ${x.kind === "income" || x.kind === "loan_in" ? "+" : "-"}${fmt(Number(x.amount), x.currency, { show: true })}${x.note ? ` "${String(x.note).slice(0, 40)}"` : ""}`; }).join("; ") + ".");
    return L.join("\n").slice(0, 7800);
  }
  function assistantSheet() {
    track("assistant");
    const list = h("div", { class: "ai-list", "aria-live": "polite" });
    const input = h("textarea", { id: "ai-q", class: "ai-input", rows: "1", maxlength: "500", placeholder: "Ask about your money…", autocomplete: "off", "aria-label": "Your question" });
    const send = h("button", { type: "submit", class: "ai-send", "aria-label": "Send" }, icon("up", "ico sm"));
    const form = h("form", { class: "ai-form", novalidate: true }, input, send);
    const SUGG = ["How much did I spend this month?", "Where can I save money?", "Who owes me money?", "What bills are coming up?", "How do I split a bill?"];
    const bubble = (role, text, cls = "") => h("div", { class: `ai-msg ${role} ${cls}` }, document.createTextNode(String(text).replace(/\*\*(.+?)\*\*/g, "$1").replace(/^#+\s*/gm, "")));
    const paint = () => {
      const kids = [];
      if (!store.get("aiOk", false)) {
        kids.push(h("div", { class: "ai-consent" },
          gioMark("gio gio-lg"),
          h("strong", null, "Meet Gio, your money assistant"),
          h("p", null, "Ask anything about your spending, bills, loans or how the app works. To answer, a short summary of your numbers (this month's totals, categories, balances, people and bills) is sent with your question to an AI service. Nothing is stored, and it can make mistakes."),
          h("button", { type: "button", class: "btn", on: { click: () => { store.set("aiOk", true); paint(); input.focus(); } } }, "Got it, let's start")));
      } else if (!AI.msgs.length) {
        kids.push(h("div", { class: "ai-hello" }, gioMark("gio gio-lg"), h("strong", null, "Hi, I'm Gio. What would you like to know?"), h("small", null, "Free · 30 questions a day")),
          h("div", { class: "ai-sugg" }, SUGG.map(q => h("button", { type: "button", class: "chip", on: { click: () => ask(tr(q)) } }, q))));
      }
      for (const mm of AI.msgs) kids.push(bubble(mm.role, mm.content, mm.err ? "err" : ""));
      if (AI.busy) kids.push(h("div", { class: "ai-typing" }, gioMark("gio gio-sm gio-think"), h("div", { class: "ai-msg assistant typing" }, h("i"), h("i"), h("i"))));
      list.replaceChildren(...kids);
      form.hidden = !store.get("aiOk", false);
      requestAnimationFrame(() => { const sb2 = list.closest(".sheet-body"); if (sb2) sb2.scrollTop = sb2.scrollHeight; });
    };
    const ERR = { not_configured: "Gio isn't switched on yet. Try again later.", limit: "You've used today's 30 free questions. Come back tomorrow.", busy: "Gio is busy right now. Try again in a minute.", auth: "Please sign in again.", offline: "You're offline. Connect to ask a question." };
    const ask = async q => {
      q = String(q || "").trim().slice(0, 500);
      if (!q || AI.busy) return;
      AI.msgs.push({ role: "user", content: q });
      AI.busy = true; input.value = ""; paint();
      let reply = null, err = null;
      if (!navigator.onLine || !sb) err = "offline";
      else {
        try {
          const { data, error } = await sb.functions.invoke("assistant", { body: { lang: LANG, context: aiContext(), messages: AI.msgs.filter(x => !x.err).slice(-8).map(x => ({ role: x.role, content: x.content })) } });
          if (error) {
            let code = "busy";
            try { const b = await error.context.json(); if (b && b.error) code = b.error; } catch { }
            err = code;
          } else reply = data && data.reply;
        } catch { err = "busy"; }
      }
      AI.busy = false;
      if (reply) AI.msgs.push({ role: "assistant", content: reply });
      else AI.msgs.push({ role: "assistant", content: tr(ERR[err] || ERR.busy), err: true });
      if (AI.msgs.length > 40) AI.msgs.splice(0, AI.msgs.length - 40);
      paint();
    };
    form.addEventListener("submit", e => { e.preventDefault(); ask(input.value); });
    input.addEventListener("keydown", e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); ask(input.value); } });
    input.addEventListener("input", () => { input.style.height = "auto"; input.style.height = Math.min(120, input.scrollHeight) + "px"; });
    const body = h("div", { class: "ai-sheet" }, list,
      h("button", { type: "button", class: "link-btn ai-help", on: { click: () => { closeSheet(); setTimeout(helpSheet, 300); } } }, icon("help", "ico sm"), "How the app works and the tour"));
    paint();
    openSheet("Gio", body, form, { fill: true, headBtn: AI.msgs.length ? h("button", { type: "button", class: "link-btn", on: { click: () => { AI.msgs = []; paint(); } } }, "New chat") : null });
    if (store.get("aiOk", false)) setTimeout(() => input.focus(), 350);
  }

  function helpSheet() {
    track("help");
    const part = (ic, title, text) => h("div", { class: "help-row" }, h("span", { class: "dot neutral" }, icon(ic, "ico sm")), h("div", null, h("h3", null, title), h("p", null, text)));
    const cur = TOURS[S.view] ? S.view : "home";
    openSheet("How it works", h("div", { class: "help-list" },
      part("home", "Home", "Your total balance, today's spending, your month plan and one-tap actions."),
      part("plus", "Add", "The green + adds an expense, income or transfer. Type the amount, pick a category, save."),
      part("list", "Activity", "Every entry, by day. Search, filter, and tap any entry to edit or delete it."),
      part("chart", "Insights", "Where your money went, your plan and budgets, goals and net worth."),
      part("people", "Split", "Loans with people and shared groups for trips, the house or any bill you split."),
      part("eye", "Eye", "Hides every amount on screen."),
      part("sync", "Sync", "Everything saves and updates by itself. This icon only shows up when you're offline or something is waiting to be saved."),
      part("gear", "Settings", "Accounts, categories, reminders, language, security and backups.")),
      h("div", { class: "help-foot" },
        h("button", { type: "button", class: "btn", on: { click: () => { closeSheet(); setTimeout(() => { if (S.view !== cur) go(cur); setTimeout(() => startTour(cur), 450); }, 350); } } }, cur === "home" ? "Start the tour" : "Tour of this screen"),
        cur !== "home" ? h("button", { type: "button", class: "btn alt", on: { click: () => { closeSheet(); setTimeout(() => { go("home"); setTimeout(() => startTour("home"), 500); }, 350); } } }, "Full tour from Home") : null));
  }

  const TRACK = { q: [], timer: 0, last: "" };
  const deviceKind = () => {
    const u = navigator.userAgent;
    if (/iPad/.test(u) || (/Macintosh/.test(u) && navigator.maxTouchPoints > 1)) return "ipad";
    if (/iPhone|iPod/.test(u)) return "iphone";
    if (/Android/.test(u)) return "android";
    if (/Mac/.test(u)) return "mac";
    if (/Windows/.test(u)) return "windows";
    if (/Linux/.test(u)) return "linux";
    return "other";
  };
  const ERR = { n: 0, seen: new Set() };
  const reportError = msg => {
    const m = String(msg || "unknown").replace(/^Uncaught\s+/, "").slice(0, 60);
    if (ERR.n >= 5 || ERR.seen.has(m)) return;
    ERR.n++; ERR.seen.add(m);
    track("error", m);
  };
  window.addEventListener("error", e => { if (e && e.message && !/Script error/i.test(e.message)) reportError(e.message); });
  window.addEventListener("unhandledrejection", e => { const r = e && e.reason; if (r && r.message && !/fetch|network|load failed|abort/i.test(r.message)) reportError(r.message); });
  function track(event, detail) {
    if (!S.uid || TRACK.mute) return;
    const d = detail ? String(detail).toLowerCase().replace(/[^a-z0-9_:.-]/g, "_").slice(0, 40) : null;
    const key = event + ":" + d;
    if (event === "view" && TRACK.last === key) return;
    TRACK.last = key;
    TRACK.q.push({ event, detail: d });
    if (TRACK.q.length > 100) TRACK.q.splice(0, TRACK.q.length - 100);
    clearTimeout(TRACK.timer);
    TRACK.timer = setTimeout(flushTrack, event === "open" ? 1500 : 10000);
  }
  async function flushTrack() {
    if (!TRACK.q.length || !sb || !S.session || !navigator.onLine) return;
    const meta = { device: deviceKind(), standalone: isStandalone(), version: VERSION };
    const batch = TRACK.q.splice(0, 50).map(e => ({ ...e, ...meta }));
    try { await sb.from("app_events").insert(batch); } catch { }
    if (TRACK.q.length) TRACK.timer = setTimeout(flushTrack, 2000);
  }

  const INBOX = { items: [], loading: false, ok: true, at: 0 };
  const inboxSeen = () => store.get("inboxSeen", "");
  const myInbox = () => INBOX.items.filter(x => !x.target_user || x.target_user === S.uid);
  const unreadCount = () => myInbox().filter(n => n.created_at > inboxSeen()).length;

  function loadInbox(force) {
    if (INBOX.loading) return INBOX.p;
    if (!sb || !S.session || !navigator.onLine) return Promise.resolve();
    if (!force && Date.now() - INBOX.at < 60000) return Promise.resolve();
    INBOX.loading = true;
    INBOX.p = fetchInbox();
    return INBOX.p;
  }

  async function fetchInbox() {
    try {
      const { data, error } = await sb.from("notifications").select("id, title, body, created_at, target_user, devices, sent, action").order("created_at", { ascending: false }).limit(60);
      if (error) { INBOX.ok = false; }
      else { INBOX.ok = true; INBOX.items = (data || []).filter(n => n && typeof n.title === "string"); }
      INBOX.at = Date.now();
    } catch { INBOX.ok = false; }
    INBOX.loading = false;
    paintBell();
    if (S.view === "home" || S.view === "admin") scheduleRender();
  }

  function paintBell() {
    if (!shell || !shell.bell) return;
    const n = unreadCount();
    shell.bell.querySelector(".bell-badge").textContent = n ? String(Math.min(n, 9)) + (n > 9 ? "+" : "") : "";
    shell.bell.setAttribute("aria-label", tr(n ? `Notifications, ${n} unread` : "Notifications"));
    shell.bell.classList.toggle("has-new", n > 0);
  }

  function inboxSheet() {
    track("inbox");
    const seen = inboxSeen();
    const box = h("div", { class: "inbox" });
    const when = iso => new Date(iso).toLocaleString(dateLocale(), { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
    const draw = loading => {
      const mine = myInbox();
      if (mine.length) store.set("inboxSeen", mine[0].created_at);
      paintBell();
      box.replaceChildren(...(mine.length
        ? mine.map(n => h("article", { class: "inbox-item" + (n.created_at > seen ? " new" : "") },
            h("div", { class: "inbox-top" }, h("h3", null, n.title), h("time", null, when(n.created_at))),
            h("p", null, n.body),
            n.action === "split" ? h("button", { type: "button", class: "btn alt", on: { click: () => { closeSheet(); go("people"); } } }, "Open the invite") : null))
        : [h("p", { class: "empty" }, loading ? "Loading…" : !INBOX.ok ? "Couldn't load notifications. Check your connection and try again." : "No notifications yet.")]));
    };
    draw(navigator.onLine);
    openSheet("Notifications", box);
    INBOX.at = 0;
    loadInbox(true).then(() => { draw(false); if (S.view === "home") scheduleRender(); });
  }

  function inboxCard() {
    const mine = myInbox().filter(x => x.created_at > inboxSeen());
    if (!mine.length) return null;
    const n = mine[0];
    return h("button", { type: "button", class: "card inbox-card", on: { click: inboxSheet } },
      h("span", { class: "dot gold" }, icon("bell", "ico sm")),
      h("span", { class: "row-main" }, h("span", { class: "row-title" }, n.title), h("span", { class: "row-sub" }, n.body)),
      mine.length > 1 ? h("span", { class: "inbox-more" }, `+${mine.length - 1}`) : icon("fwd"));
  }

  function sentCard() {
    if (!INBOX.ok) return h("section", { class: "card" }, h("div", { class: "card-head" }, h("h2", null, "Sent notifications")),
      h("p", { class: "hint" }, "The history isn't set up on the server yet. Run supabase/notifications.sql in the Supabase SQL editor once."));
    const users = new Map(((ADMIN.data && ADMIN.data.users) || []).map(u => [u.id, u.email]));
    const sent = INBOX.items.filter(n => !n.action);
    const card = h("section", { class: "card flush" }, h("div", { class: "card-head" }, h("h2", null, `Sent notifications (${sent.length})`)));
    if (!sent.length) { card.append(h("p", { class: "empty" }, "Nothing sent yet.")); return card; }
    for (const n of sent.slice(0, 30)) {
      const armed = ADMIN.armedNote === n.id;
      card.append(h("div", { class: "row sent-row" },
        h("span", { class: "dot " + (n.target_user ? "neutral" : "gold") }, icon(n.target_user ? "people" : "bell", "ico sm")),
        h("span", { class: "row-main" },
          h("span", { class: "row-title" }, n.title),
          h("span", { class: "row-sub wrap" }, n.body),
          h("span", { class: "row-sub wrap" }, [n.target_user ? (users.get(n.target_user) || "One user") : "Everyone", whenText(n.created_at), n.devices ? `delivered to ${n.sent} of ${n.devices} devices` : "inbox only"].join(" · "))),
        h("button", { type: "button", class: "icon-btn", "aria-label": armed ? "Confirm delete" : "Delete notification", style: armed ? { color: "var(--neg)" } : null, on: { click: async () => {
          if (!armed) { ADMIN.armedNote = n.id; return render(); }
          ADMIN.armedNote = null;
          const { error } = await sb.from("notifications").delete().eq("id", n.id);
          if (error) return toast("Couldn't delete it. Try again.", "error");
          INBOX.items = INBOX.items.filter(x => x.id !== n.id);
          toast("Deleted. Users no longer see it in their inbox.");
          render();
        } } }, icon(armed ? "warn" : "close"))));
    }
    return card;
  }

  const CARD = { back: false, front: "bal" };
  const trendMemo = { k: "", v: null };
  function balanceTrend(total) {
    const k = ver + ":" + today() + ":" + mainCur() + ":" + Math.round(total * 100);
    if (trendMemo.k === k) return trendMemo.v;
    const n = 30, now = new Date(today() + "T12:00:00");
    const dates = [];
    for (let i = n - 1; i >= 0; i--) dates.push(ymd(new Date(now.getTime() - i * 864e5)));
    const day = new Map(dates.map(d => [d, 0]));
    const accCur = id => { const a = S.data.accounts.get(id); return a ? a.currency : mainCur(); };
    for (const x of rows("transactions")) {
      if (x.occurred_on <= dates[0]) continue;
      const d = x.occurred_on > dates[n - 1] ? dates[n - 1] : x.occurred_on;
      const amt = Number(x.amount) || 0;
      let e = 0;
      if (x.kind === "income" || x.kind === "loan_in") e = toMain(amt, x.currency);
      else if (x.kind === "expense" || x.kind === "loan_out") e = -toMain(amt, x.currency);
      else e = -toMain(amt, accCur(x.account_id)) + (x.to_account_id ? toMain(Number(x.to_amount) || 0, accCur(x.to_account_id)) : 0);
      day.set(d, (day.get(d) || 0) + e);
    }
    const vals = new Array(n);
    vals[n - 1] = total;
    for (let i = n - 1; i > 0; i--) vals[i - 1] = vals[i] - (day.get(dates[i]) || 0);
    const v = { dates, vals, moved: vals.some(x => Math.abs(x - total) > 0.5) };
    trendMemo.k = k; trendMemo.v = v;
    return v;
  }
  function trendView(tr0, hero) {
    const { dates, vals } = tr0, n = vals.length;
    let lo = Math.min(...vals), hi = Math.max(...vals);
    if (hi - lo < 1e-6) { lo -= 1; hi += 1; }
    const W = 300, H = 64, XR = 0.9, y = v => 10 + (1 - (v - lo) / (hi - lo)) * (H - 22);
    const pts = vals.map((v, i) => [i / (n - 1) * W * XR, y(v)]);
    let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
    for (let i = 1; i < n; i++) { const [x0, y0] = pts[i - 1], [x1, y1] = pts[i], mx = (x0 + x1) / 2; d += ` C${mx.toFixed(1)} ${y0.toFixed(1)} ${mx.toFixed(1)} ${y1.toFixed(1)} ${x1.toFixed(1)} ${y1.toFixed(1)}`; }
    const NS = "http://www.w3.org/2000/svg", mk = (t, a) => { const e = document.createElementNS(NS, t); for (const [k, v] of Object.entries(a)) e.setAttribute(k, v); return e; };
    const svg = mk("svg", { viewBox: `0 0 ${W} ${H}`, preserveAspectRatio: "none", class: "ht-svg", "aria-hidden": "true" });
    const defs = mk("defs", {});
    const g = mk("linearGradient", { id: "htFill", x1: "0", y1: "0", x2: "0", y2: "1" });
    g.append(mk("stop", { offset: "0", "stop-color": "#f5c451", "stop-opacity": ".32" }), mk("stop", { offset: "1", "stop-color": "#f5c451", "stop-opacity": "0" }));
    const gl = mk("linearGradient", { id: "htLine", x1: "0", y1: "0", x2: "1", y2: "0" });
    gl.append(mk("stop", { offset: "0", "stop-color": "#3ee8a5" }), mk("stop", { offset: "1", "stop-color": "#f5c451" }));
    defs.append(g, gl);
    svg.append(defs, mk("path", { d: d + ` L${W} ${pts[n - 1][1].toFixed(1)} L${W} ${H} L0 ${H} Z`, class: "ht-area", fill: "url(#htFill)" }), mk("path", { d, class: "ht-line", fill: "none", stroke: "url(#htLine)", "stroke-width": "2.4", "stroke-linecap": "round", "vector-effect": "non-scaling-stroke" }));
    let saved = null;
    const cur = h("i", { class: "ht-cur" }), dot = h("i", { class: "ht-dot", style: { left: XR * 100 + "%", top: (pts[n - 1][1] / H * 100).toFixed(1) + "%" } });
    const at = (e, el) => {
      const r = el.getBoundingClientRect(), i = Math.round(Math.max(0, Math.min(1, (e.clientX - r.left) / (r.width * XR))) * (n - 1));
      const card = el.closest(".hero"), lab = card.querySelector(".hero-label"), tot = card.querySelector(".hero-total"), dl = card.querySelector(".hero-delta");
      if (!saved) saved = { lab: lab.textContent, tot: tot.textContent, dl: dl ? dl.style.visibility : "" };
      lab.textContent = i === n - 1 ? tr("Today") : dayLabel(dates[i]);
      tot.textContent = money(vals[i]);
      if (dl) dl.style.visibility = "hidden";
      el.style.setProperty("--cx", (i / (n - 1) * XR * 100).toFixed(2) + "%");
      el.style.setProperty("--cy", (pts[i][1] / H * 100).toFixed(1) + "%");
      el.classList.add("scrub");
    };
    const end = el => {
      if (!saved) return;
      const card = el.closest(".hero");
      if (card) { card.querySelector(".hero-label").textContent = saved.lab; card.querySelector(".hero-total").textContent = saved.tot; const dl = card.querySelector(".hero-delta"); if (dl) dl.style.visibility = saved.dl; }
      saved = null;
      el.classList.remove("scrub");
    };
    return h("div", { class: "hero-trend", on: {
      pointerdown(e) { if (S.hidden) return; this.__down = e.clientX; },
      pointermove(e) { if (S.hidden || this.__down == null) return; if (saved || Math.abs(e.clientX - this.__down) > 4) at(e, this); },
      pointerup(e) { if (this.__down != null && !saved && !S.hidden) { at(e, this); setTimeout(() => end(this), 1400); } else end(this); this.__down = null; },
      pointercancel() { end(this); this.__down = null; },
      pointerleave() { end(this); this.__down = null; } } }, svg, cur, dot);
  }
  function flipCard(el) {
    if (!el || el.__flipping) return;
    if (RM.matches) { CARD.back = !CARD.back; render(); return; }
    el.__flipping = true;
    const dir = CARD.back ? -1 : 1;
    const a = el.animate([{ transform: "perspective(900px) rotateY(0deg)" }, { transform: `perspective(900px) rotateY(${90 * dir}deg)` }], { duration: 170, easing: "cubic-bezier(.5,0,.9,.5)" });
    a.onfinish = () => {
      el.__flipping = false;
      CARD.back = !CARD.back;
      render();
      const n = document.querySelector(".wallet > .hero");
      if (n) n.animate([{ transform: `perspective(900px) rotateY(${-90 * dir}deg)` }, { transform: "perspective(900px) rotateY(0deg)" }], { duration: 480, easing: "cubic-bezier(.2,1.5,.4,1)" });
    };
  }
  function swapWallet() {
    const w = document.querySelector(".wallet"), front = w && w.lastElementChild;
    CARD.front = CARD.front === "pf" ? "bal" : "pf";
    CARD.back = false;
    if (RM.matches || !front) { render(); return; }
    const a = front.animate([{ transform: "none", opacity: 1 }, { transform: "translateY(30px) scale(.95)", opacity: 0 }], { duration: 160, easing: "ease-in" });
    a.onfinish = () => {
      render();
      const w2 = document.querySelector(".wallet");
      if (!w2) return;
      w2.lastElementChild.animate([{ transform: "translateY(-72px) scale(.93)", opacity: .2 }, { transform: "none", opacity: 1 }], { duration: 560, easing: "cubic-bezier(.2,1.25,.4,1)" });
      w2.firstElementChild.animate([{ transform: "translateY(44px)", opacity: 0 }, { transform: "none", opacity: 1 }], { duration: 420, easing: "cubic-bezier(.2,.8,.2,1)" });
    };
  }
  function walletPeek(kind, total, tDelta) {
    if (kind === "pf") {
      const st = pfStats();
      return h("button", { type: "button", id: "w-peek", class: "wallet-peek pf-peek", "aria-label": "Show portfolio", on: { click: swapWallet } },
        icon("gem", "ico sm"), h("span", { class: "wp-label" }, "Portfolio"),
        h("span", { class: "wp-val num" }, money(st.value, { whole: true })),
        st.gain != null && st.cost ? h("span", { class: "wp-delta num " + (st.gain >= 0 ? "up" : "down") }, `${st.gain >= 0 ? "▲" : "▼"} ${Math.abs(st.gain / st.cost * 100).toFixed(1)}%`) : null,
        icon("chev", "ico sm wp-chev"));
    }
    return h("button", { type: "button", id: "w-peek", class: "wallet-peek bal-peek", "aria-label": "Show total balance", on: { click: swapWallet } },
      h("i", { class: "wp-chip", "aria-hidden": "true" }), h("span", { class: "wp-label" }, "Total balance"),
      h("span", { class: "wp-val num" }, money(total, { whole: true })),
      Math.abs(tDelta) > 0.5 && !S.hidden ? h("span", { class: "wp-delta num " + (tDelta >= 0 ? "up" : "down") }, `${tDelta >= 0 ? "▲" : "▼"} ${money(Math.abs(tDelta), { whole: true })}`) : null,
      icon("chev", "ico sm wp-chev"));
  }
  function heroBack(st, m, s, safe) {
    const row = (label, val, cls) => h("div", { class: "hb-stat " + cls }, h("small", null, label), h("strong", { class: "num" }, val));
    return h("section", { id: "w-bal", class: "hero back", role: "button", tabindex: "0", "aria-label": "Flip card", on: { click(e) { if (!e.target.closest("button")) flipCard(this); }, keydown(e) { if (e.key === "Enter") flipCard(this); } } },
      h("span", { class: "fx-glare", "aria-hidden": "true" }),
      h("span", { class: "hb-stripe", "aria-hidden": "true" }),
      h("p", { class: "hero-label" }, monthName(m)),
      h("div", { class: "hb-grid" },
        row("Spent", money(s.spent, { whole: true }), "out"),
        row("Received", money(s.income, { whole: true }), "in"),
        row("Safe to spend", safe ? `${money(safe.perDay, { whole: true })}${tr("/day")}` : "—", "safe")),
      h("div", { class: "hb-foot" },
        h("span", { class: "hb-num num" }, `••••  ••••  ••••  ${today().slice(0, 4)}`),
        h("span", { class: "hb-name" }, String(st.name || "BudgetSplit").toUpperCase().slice(0, 26))),
      h("span", { class: "hb-hint" }, icon("sync", "ico sm"), "Tap to flip"));
  }

  const ANIM_DRAG = { at: 0 };
  function sizeCanvas(c, hgt) {
    const dpr = Math.min(2, window.devicePixelRatio || 1), w = Math.max(1, Math.round(c.clientWidth || c.parentNode.clientWidth));
    if (c.__w === w && c.width === Math.round(w * dpr)) return false;
    c.__w = w; c.width = Math.round(w * dpr); c.height = Math.round(hgt * dpr); c.__dpr = dpr;
    return true;
  }
  function animLoop(c, step) {
    let last = performance.now(), raf = 0, vis = true;
    const tick = now => {
      raf = 0;
      if (!c.isConnected) return;
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      if (!vis || document.hidden) return;
      step(dt);
      raf = requestAnimationFrame(tick);
    };
    const kick = () => { if (!raf && vis && !document.hidden && c.isConnected) { last = performance.now(); raf = requestAnimationFrame(tick); } };
    if ("IntersectionObserver" in window) new IntersectionObserver(es => { for (const en of es) vis = en.isIntersecting; kick(); }).observe(c);
    document.addEventListener("visibilitychange", kick);
    kick();
    return kick;
  }
  function railInit(r) {
    let raf = 0;
    const upd = () => {
      raf = 0;
      const rr = r.getBoundingClientRect(), mid = rr.left + rr.width / 2;
      for (const el of r.children) { const b = el.getBoundingClientRect(), d = Math.min(1, Math.abs(b.left + b.width / 2 - mid) / rr.width); el.style.setProperty("--d", d.toFixed(3)); }
    };
    r.addEventListener("scroll", () => { if (!raf) raf = requestAnimationFrame(upd); }, { passive: true });
    r.__rail = upd;
    upd();
  }
  function tankInit(c) {
    const H = 132, o = { level: 0, slosh: 0, vs: 0, t: 0, drag: null };
    c.__tank = o;
    const card = c.closest(".tank-card");
    const read = () => { o.target = Math.max(0, Math.min(1, Number(c.dataset.pct) || 0)); o.color = c.dataset.c || "#2fd39a"; };
    read();
    o.read = read;
    if (RM.matches) o.level = o.target;
    const draw = () => {
      sizeCanvas(c, H);
      const ctx = c.getContext("2d"), dpr = c.__dpr || 1, W = c.width, Hh = c.height;
      ctx.clearRect(0, 0, W, Hh);
      const base = Hh * (1 - (0.06 + o.level * 0.86));
      const wave = (amp, k, sp, ph) => {
        ctx.beginPath(); ctx.moveTo(0, Hh);
        for (let x = 0; x <= W; x += 6 * dpr) { const u = x / W; ctx.lineTo(x, base + Math.sin(u * k + o.t * sp + ph) * amp * dpr * (1 + Math.abs(o.slosh) * 3) + o.slosh * (u - 0.5) * Hh * 0.5); }
        ctx.lineTo(W, Hh); ctx.closePath();
      };
      const g = ctx.createLinearGradient(0, base - 20 * dpr, 0, Hh);
      g.addColorStop(0, o.color + "cc"); g.addColorStop(1, o.color + "40");
      wave(5, 9, 1.4, 1.8); ctx.fillStyle = o.color + "44"; ctx.fill();
      wave(6, 7, 2, 0); ctx.fillStyle = g; ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,.55)";
      for (let i = 0; i < 7; i++) { const bx = ((i * 97 + o.t * 18 * (1 + i % 3)) % (W / dpr)) * dpr, by = Hh - ((o.t * (14 + i * 5) + i * 40) % Math.max(1, (Hh - base) / dpr)) * dpr; if (by > base + 6 * dpr) { ctx.beginPath(); ctx.arc(bx, by, (1.2 + i % 3) * dpr, 0, 6.3); ctx.fill(); } }
    };
    const kick = animLoop(c, dt => {
      o.t += dt;
      o.level += (o.target - o.level) * Math.min(1, dt * 1.8);
      o.vs += (-o.slosh * 26 - o.vs * 3.2) * dt; o.slosh += o.vs * dt;
      draw();
    });
    const at = e => e.clientX;
    card.addEventListener("pointerdown", e => { o.drag = { x: at(e), moved: 0 }; });
    card.addEventListener("pointermove", e => { if (!o.drag) return; const dx = at(e) - o.drag.x; o.drag.x = at(e); o.drag.moved += Math.abs(dx); o.vs += dx * 0.06; o.vs = Math.max(-4, Math.min(4, o.vs)); kick(); });
    const up = () => { if (o.drag && o.drag.moved > 8) ANIM_DRAG.at = performance.now(); o.drag = null; };
    card.addEventListener("pointerup", up); card.addEventListener("pointercancel", up); card.addEventListener("pointerleave", up);
    card.style.touchAction = "pan-y";
    draw();
  }
  function spendReceipt(m, s) {
    const cats = [...s.byCat].filter(e => e[1] > 0).sort((p, q) => q[1] - p[1]);
    if (!cats.length) return null;
    const cnt = new Map();
    for (const x of [...rows("transactions"), ...loanOnlyTx(m)]) if ((x.kind === "expense" || x.kind === "loan_out") && monthOf(x.occurred_on) === m) { const k = x.kind === "loan_out" ? "__lent" : x.category_id; cnt.set(k, (cnt.get(k) || 0) + 1); }
    const left = s.income - s.spent;
    const stamp = new Date();
    const no = String(Math.abs(Math.round(s.spent * 100)) % 1000000).padStart(6, "0");
    return h("section", { class: "rcpt-card" },
      h("div", { class: "rcpt-slot", "aria-hidden": "true" }),
      h("div", { class: "rcpt-clip" },
        h("div", { class: "rcpt" },
          h("div", { class: "rcpt-head" }, h("strong", null, ...brandMark()), h("span", null, `${tr("Receipt")} · ${monthName(m)}`), h("small", { class: "num" }, `#${no} · ${dfmt({ day: "numeric", month: "short" }).format(stamp)} ${String(stamp.getHours()).padStart(2, "0")}:${String(stamp.getMinutes()).padStart(2, "0")}`)),
          h("div", { class: "rcpt-rule" }),
          h("ul", { class: "rcpt-items" }, cats.map(([id, v], i) => {
            const c = cat(id), pct = v / s.spent * 100;
            return h("li", { style: { "--c": c ? c.color : "#5b7083", "--p": pct.toFixed(1) + "%", "--i": String(i) } },
              h("button", { type: "button", on: { click: () => { if (c && c.virtual) return go("people"); S.filter = { q: c ? c.name : "", kind: "expense", account: null }; go("activity"); } } },
                h("span", { class: "rcpt-line" + (c && c.virtual ? " is-loan" : "") }, h("span", { class: "rcpt-name" }, c ? c.name : "Uncategorized"), c && c.virtual ? h("em", { class: "loan-tag" }, "Loan") : null, h("i", { class: "rcpt-dots" }), h("b", { class: "num" }, money(v))),
                h("span", { class: "rcpt-meta num" }, h("span", { class: "rcpt-bar" }), `${cnt.get(id) || 0} × · ${Math.round(pct)}%`)));
          })),
          h("div", { class: "rcpt-rule" }),
          h("div", { class: "rcpt-total" }, h("span", null, "Total spent"), h("b", { class: "num" }, money(s.spent))),
          h("div", { class: "rcpt-sub" }, h("span", null, "Came in"), h("span", { class: "num" }, money(s.income))),
          h("div", { class: "rcpt-sub" }, h("span", null, left >= 0 ? "Left over" : "Overspent"), h("span", { class: "num" + (left < 0 ? " neg" : "") }, money(Math.abs(left)))),
          h("div", { class: "rcpt-rule" }),
          h("div", { class: "rcpt-code", "aria-hidden": "true" }),
          h("p", { class: "rcpt-thanks" }, "Thank you for tracking your money"))));
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

    const trend = balanceTrend(total);
    const tDelta = total - trend.vals[0];
    const hasPf = holdings().length > 0;
    if (!hasPf) CARD.front = "bal";
    let balCard;
    if (CARD.back) balCard = heroBack(st, m, s, safe);
    else balCard = (h("section", { id: "w-bal", class: "hero", on: { click(e) { if (!e.target.closest("button, .hero-trend")) flipCard(this); } } },
      h("span", { class: "fx-glare", "aria-hidden": "true" }),
      h("p", { class: "hero-label" }, "Total balance"),
      h("p", { class: "hero-total num" }, money(total)),
      trend.moved && !S.hidden ? h("p", { class: "hero-delta num " + (tDelta >= 0 ? "up" : "down") }, `${tDelta >= 0 ? "▲" : "▼"} ${money(Math.abs(tDelta), { whole: true })}`, h("small", null, tr("last 30 days"))) : null,
      h("div", { class: "hero-hold" },
        [...holds].sort((p, q) => (q[0] === mainCur()) - (p[0] === mainCur()) || toMain(q[1], q[0]) - toMain(p[1], p[0])).map(([c, v]) => h("span", { class: "num", title: curInfo(c).name }, fmt(v, c, { compact: true }))),
        (() => { const t = owedTotals(); return [t.owed > 0.5 ? h("button", { type: "button", class: "num hero-owed", on: { click: () => go("people") } }, `+${money(t.owed, { whole: true })} ${tr("owed to you")}`) : null, t.owe > 0.5 ? h("button", { type: "button", class: "num hero-owed hero-owe", on: { click: () => go("people") } }, `−${money(t.owe, { whole: true })} ${tr("you owe")}`) : null]; })(),
      ),
      trend.moved ? trendView(trend) : null));
    out.append(h("div", { class: "wallet" + (hasPf ? " stacked" : "") }, hasPf ? (CARD.front === "pf" ? [walletPeek("bal", total, tDelta), portfolioCard()] : [walletPeek("pf"), balCard]) : balCard));

    const pay = paydayCard();
    if (pay) out.append(pay);
    const coming = upcomingCard();
    if (coming && !coming.classList.contains("bill-teaser")) out.append(coming);
    else { const sug = salarySuggest(); if (sug) out.append(sug); }
    if (!hasPf) { const inv = portfolioCard(); if (inv) out.append(inv); }
    if (!rows("people").length && !GROUPS.list.size && !store.get("splitTeaserOff", false)) {
      out.append(h("section", { class: "split-teaser" },
        h("button", { type: "button", class: "split-teaser-x", "aria-label": "Hide", on: { click: () => { store.set("splitTeaserOff", true); render(); } } }, icon("close", "ico sm")),
        h("span", { class: "split-badge" }, icon("people", "ico sm")),
        h("div", null, h("strong", null, "Share costs with friends"), h("small", null, "Split a dinner, the rent or a trip, or track money you lent. Everyone sees who owes whom.")),
        h("button", { type: "button", class: "btn sm", on: { click: splitChooser } }, "Try Split")));
    }

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
      const tone = left < 0 ? "#ff6b6b" : pct >= 80 ? "#f5a524" : "#2fd39a";
      out.append(h("section", { class: "card month-card tank-card", role: "button", tabindex: "0", on: { click: () => { if (performance.now() - ANIM_DRAG.at < 500) return; S.month = m; go("plan"); } } },
        h("canvas", { class: "tank", "data-pct": String(Math.min(1, s.spent / plan.base)), "data-c": tone, "aria-hidden": "true" }),
        h("span", { class: "tank-text" },
          h("span", { class: "tank-kicker" }, `${monthName(m)} plan`),
          h("strong", { class: "tank-pct num" }, `${pct}%`),
          h("span", { class: "tank-sub" }, `${money(s.spent, { whole: true })} of ${money(plan.base, { whole: true })} used`)),
        h("span", { class: "tank-side" },
          h("b", { class: "num" + (left < 0 ? " neg" : "") }, left >= 0 ? money(left, { whole: true }) : `−${money(-left, { whole: true })}`),
          h("small", null, left >= 0 ? "left" : "over"),
          h("small", { class: "tank-days" }, `${safe ? safe.daysLeft : 0} ${tr("days left")}`)),
        h("span", { class: "tank-hint" }, "Shake it")));
    }

    const loans = loansCard();
    if (loans) out.append(loans);

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

    const news = inboxCard();
    if (news) out.append(news);
    const remind = reminderCard();
    out.append(remind || reminderPill());
    const loose = txns.filter(t => (t.kind === "expense" || t.kind === "income") && !t.category_id && t.occurred_on >= ymd(new Date(Date.now() - 45 * 864e5))).sort(byRecent);
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
    if (coming && coming.classList.contains("bill-teaser")) out.append(coming);
    if (/iPhone/.test(navigator.userAgent) && store.get("qwiz", 0) < 3 && !store.get("tapTeaserOff", false)) {
      out.append(h("section", { class: "bill-teaser tap-teaser" },
        h("button", { type: "button", class: "split-teaser-x", "aria-label": "Hide", on: { click: () => { store.set("tapTeaserOff", true); render(); } } }, icon("close", "ico sm")),
        h("span", { class: "bill-badge" }, icon("phone", "ico sm")),
        h("div", null, h("strong", null, "Add without opening the app"), h("small", null, "Tap the back of your iPhone or say “Hey Siri, Add expense”. Takes about a minute to set up.")),
        h("button", { type: "button", class: "btn sm", on: { click: () => quickSheet() } }, "Set it up")));
    }

    const alerts = rows("categories").filter(c => c.kind === "expense" && Number(c.budget) > 0)
      .map(c => ({ c, spent: s.byCat.get(c.id) || 0, budget: Number(c.budget) }))
      .filter(a => a.spent >= a.budget * 0.8)
      .sort((a, b) => b.spent / b.budget - a.spent / a.budget);
    if (alerts.length) {
      const nOver = alerts.filter(a => a.spent > a.budget).length;
      const nNear = alerts.length - nOver;
      out.append(h("button", { type: "button", class: "remind-pill budget-pill", on: { click: () => budgetSheet(alerts) } },
        h("span", { class: "dot neutral bud-dot" }, icon("chart", "ico sm"), h("span", { class: "bud-count" }, String(alerts.length))),
        h("span", { class: "row-main" }, h("span", { class: "row-title" }, "Budgets to check"),
          h("span", { class: "row-sub" }, [nOver ? `${nOver} over budget` : null, nNear ? `${nNear} almost used` : null].filter(Boolean).join(" · "))),
        icon("fwd")));
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

    const accTotal = accounts.reduce((t, a) => t + toMain(bal.get(a.id) || 0, a.currency), 0);
    const accPos = accounts.map(a => Math.max(0, toMain(bal.get(a.id) || 0, a.currency)));
    const accPosTot = accPos.reduce((p, q) => p + q, 0);
    const accCard = h("section", { class: "card col-a accs-card" },
      h("div", { class: "accs-head" },
        h("div", null, h("h2", null, "Your accounts"), h("small", null, `${accounts.length} ${tr(accounts.length === 1 ? "account" : "accounts")}`)),
        h("div", { class: "accs-right" },
          h("strong", { class: "accs-total num" + (accTotal < 0 ? " neg" : "") }, money(accTotal, { whole: true })),
          h("button", { type: "button", class: "link-btn accs-toggle", on: { click: () => { S.accGrid = !S.accGrid; render(); } } }, icon(S.accGrid ? "card" : "plan", "ico sm"), S.accGrid ? "Show as cards" : "See all"))),
      accPosTot > 0 ? h("div", { class: "acc-dist", "aria-hidden": "true" }, accounts.map((a, i) => accPos[i] > 0 ? h("span", { class: "k-" + (KIND_ICON[a.kind] ? a.kind : "cash"), style: { flex: String(accPos[i] / accPosTot) } }) : null)) : null,
      h("div", { class: "acc-rail" + (S.accGrid ? " grid" : "") },
        accounts.map(a => {
          const v = bal.get(a.id) || 0, k = KIND_ICON[a.kind] ? a.kind : "cash";
          return h("button", { type: "button", class: "acard k-" + k, "aria-label": `${a.name}, ${KIND_LABEL[a.kind] || ""}, ${fmt(v, a.currency)}`, on: { click: () => { S.filter = { q: "", kind: "all", account: a.id }; go("activity"); } } },
            h("span", { class: "acard-top" }, h("span", { class: "acard-ico" }, icon(KIND_ICON[a.kind] || "cash", "ico sm")), h("span", { class: "acard-kind" }, KIND_LABEL[a.kind] || ""), k === "bank" || k === "card" ? h("i", { class: "acard-chip" }) : null),
            h("span", { class: "acard-bal num" + (v < 0 ? " neg" : "") }, fmt(v, a.currency)),
            a.currency !== mainCur() ? h("span", { class: "acard-alt num" }, "≈ " + money(toMain(v, a.currency), { whole: true })) : h("span", { class: "acard-alt" }, "\u00a0"),
            h("span", { class: "acard-foot" }, h("span", { class: "acard-name" }, a.name), h("span", { class: "acard-cur" }, curTag(a.currency))));
        }),
        h("button", { type: "button", class: "acard add", on: { click: () => accountSheet(null) } }, h("span", { class: "acard-ico" }, icon("plus", "ico sm")), h("strong", null, "Add account"), h("small", null, "Cash, bank, card, Whish…"))));
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
    if (people.length || GROUPS.list.size) {
      let { owed, owe } = groupTotals();
      for (const p of people) { const v = netMine(p, toMain(lb.get(p.id) || 0, p.currency)); if (v > 0) owed += v; else owe -= v; }
      const card = h("section", { class: "card flush" }, h("div", { class: "card-head" }, h("h2", null, "Split & loans"), h("button", { type: "button", class: "link-btn", on: { click: () => go("people") } }, "See all")));
      card.append(h("p", { class: "row-note" }, [owed ? `Owed to you ${money(owed, { whole: true })}` : null, owe ? `You owe ${money(owe, { whole: true })}` : null].filter(Boolean).join(" · ") || "All settled"));
      for (const p of people.slice().sort((x, y) => toMain(lb.get(y.id) || 0, y.currency) - toMain(lb.get(x.id) || 0, x.currency)).slice(0, 3)) {
        const v = lb.get(p.id) || 0;
        card.append(h("button", { type: "button", class: "row", on: { click: () => personSheet(p) } },
          h("span", { class: "dot", style: { background: COLORS[(p.sort || 0) % COLORS.length] } }, p.name.charAt(0).toUpperCase()),
          h("span", { class: "row-main" }, h("span", { class: "row-title" }, p.name), h("span", { class: "row-sub" + (theyOwe(p, v) && dueInfo(p) && dueInfo(p).late ? " late" : "") }, [statusText(p, v), theyOwe(p, v) && dueInfo(p) ? dueInfo(p).text : null].filter(Boolean).join(" · "))),
          h("span", { class: "row-end" + (netMine(p, v) > 0.004 ? " pos" : netMine(p, v) < -0.004 ? " neg" : "") }, fmt(Math.abs(v), p.currency))));
      }
      out.append(card);
    }
    return out;
  }

  function accountFilterSheet() {
    const bal = balances();
    const pick = id => { closeSheet(); S.filter.account = id; S.limit = 50; render(); window.scrollTo(0, 0); };
    const list = h("section", { class: "card flush" },
      h("button", { type: "button", class: "row", on: { click: () => pick(null) } }, h("span", { class: "dot neutral" }, icon("list", "ico sm")), h("span", { class: "row-main" }, h("span", { class: "row-title" }, "All accounts")), !S.filter.account ? icon("check", "ico sm") : null),
      ...rows("accounts").filter(a => !a.archived).sort(bySort).map(a => h("button", { type: "button", class: "row", on: { click: () => pick(a.id) } },
        h("span", { class: "dot acc-dot k-" + (KIND_ICON[a.kind] ? a.kind : "cash") }, icon(KIND_ICON[a.kind] || "cash", "ico sm")),
        h("span", { class: "row-main" }, h("span", { class: "row-title" }, a.name), h("span", { class: "row-sub" }, KIND_LABEL[a.kind] || "")),
        h("span", { class: "row-end num" }, fmt(bal.get(a.id) || 0, a.currency)))));
    openSheet("Show entries from", list);
  }

  function viewActivity() {
    const out = h("div", { class: "stack" });
    const list = h("div", { class: "stack" });
    const search = h("input", { id: "q", type: "search", placeholder: "Search notes, categories, amounts", autocomplete: "off", enterkeyhint: "search", value: S.filter.q, "aria-label": "Search entries",
      on: { input: e => { S.filter.q = e.target.value; S.limit = 50; fill(); } } });
    const kinds = [["all", "All"], ["expense", "Expenses"], ["income", "Income"], ["transfer", "Transfers"], ["loan", "Loans"]];
    const picked = S.filter.account && acc(S.filter.account);
    const chips = h("div", { class: "chips" },
      picked
        ? h("button", { type: "button", class: "chip acc-chip on k-" + (KIND_ICON[picked.kind] ? picked.kind : "cash"), "aria-label": `Showing ${picked.name} only. Tap to show all accounts.`, on: { click: () => { S.filter.account = null; render(); } } }, icon(KIND_ICON[picked.kind] || "cash", "ico sm"), picked.name, icon("close", "ico sm"))
        : h("button", { type: "button", class: "chip acc-chip", on: { click: accountFilterSheet } }, icon("bank", "ico sm"), "All accounts", icon("down", "ico sm")),
      kinds.map(([k, l]) => h("button", { type: "button", class: "chip", "aria-pressed": String(S.filter.kind === k), on: { click: () => { S.filter.kind = k; S.limit = 50; render(); } } }, l)));

    function fill() {
      const q = S.filter.q.trim().toLowerCase();
      const matches = rows("transactions").filter(x => {
        if (S.filter.kind !== "all" && x.kind !== S.filter.kind && !(S.filter.kind === "loan" && isLoanTx(x))) return false;
        if (S.filter.account && x.account_id !== S.filter.account && x.to_account_id !== S.filter.account) return false;
        if (!q) return true;
        const c = cat(x.category_id), a = acc(x.account_id), b = acc(x.to_account_id);
        return [x.note, c && c.name, a && a.name, b && b.name, String(x.amount), isLoanTx(x) ? loanTitle(x) : null].some(v => v && String(v).toLowerCase().includes(q));
      }).sort(byRecent);
      const fa = S.filter.account && !q && S.filter.kind === "all" ? acc(S.filter.account) : null;
      const sel = S.filter.account ? acc(S.filter.account) : null;
      const head = sel ? (() => {
        const v = balances().get(sel.id) || 0;
        return h("section", { class: "acc acc-head k-" + (KIND_ICON[sel.kind] ? sel.kind : "cash") },
          h("span", { class: "acc-top" }, h("span", { class: "acc-ico" }, icon(KIND_ICON[sel.kind] || "cash", "ico sm")), h("span", { class: "acc-kind" }, `${KIND_LABEL[sel.kind] || ""} · ${curTag(sel.currency)}`),
            h("button", { type: "button", class: "acc-x", "aria-label": "Show all accounts", on: { click: () => { S.filter.account = null; render(); } } }, icon("close", "ico sm"))),
          h("span", { class: "acc-name" }, sel.name),
          h("span", { class: "acc-bal num" + (v < 0 ? " neg" : "") }, fmt(v, sel.currency)),
          sel.currency !== mainCur() ? h("small", { class: "acc-alt num" }, "≈ " + money(toMain(v, sel.currency), { whole: true })) : null,
          h("span", { class: "acc-btns" },
            h("button", { type: "button", class: "acc-btn", on: { click: () => balanceSheet(sel) } }, icon("pencil", "ico sm"), "Change balance"),
            h("button", { type: "button", class: "acc-btn", on: { click: () => accountSheet(sel) } }, icon("gear", "ico sm"), "Edit account")));
      })() : null;
      const startCard = fa ? h("section", { class: "card flush" }, h("button", { type: "button", class: "row", on: { click: () => openingSheet(fa) } },
        h("span", { class: "dot neutral" }, icon("coin", "ico sm")),
        h("span", { class: "row-main" }, h("span", { class: "row-title" }, "Starting balance"), h("span", { class: "row-sub" }, "What the account had when you added it. Tap to change")),
        h("span", { class: "row-end num" }, fmt(Number(fa.opening_balance) || 0, fa.currency)))) : null;
      if (!matches.length) {
        list.replaceChildren(...[head, h("p", { class: "empty" }, q || S.filter.kind !== "all" ? "No entries match your search." : S.filter.account ? "No entries in this account yet." : "No entries yet. Tap + to add one."), startCard].filter(Boolean));
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
      let more = null;
      if (matches.length > shown.length) cards.push(more = h("button", { type: "button", class: "btn alt", on: { click: () => { S.limit += 100; fill(); } } }, `Show more (${matches.length - shown.length})`));
      else if (startCard) cards.push(startCard);
      list.replaceChildren(...[head, ...cards].filter(Boolean));
      if (more && "IntersectionObserver" in window) {
        const io = new IntersectionObserver(es => { if (es.some(en => en.isIntersecting)) { io.disconnect(); S.limit += 100; fill(); } }, { rootMargin: "600px 0px" });
        requestAnimationFrame(() => more.isConnected && io.observe(more));
      }
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

  function monthKindSheet(m, kind) {
    const s = monthStats(m);
    const kinds = kind === "expense" ? ["expense", "loan_out"] : kind === "income" ? ["income", "loan_in"] : ["expense", "loan_out", "income", "loan_in"];
    const list = [...rows("transactions"), ...loanOnlyTx(m)].filter(x => monthOf(x.occurred_on) === m && kinds.includes(x.kind)).sort(byRecent);
    const title = kind === "expense" ? `${tr("Spent in")} ${monthName(m)}` : kind === "income" ? `${tr("Came in")} · ${monthName(m)}` : `${monthName(m)} · ${tr("in and out")}`;
    const sums = new Map();
    for (const x of list) { const k = x.kind === "loan_out" ? "e:__lent" : x.kind === "loan_in" ? "i:__borrowed" : (x.kind === "income" ? "i:" : "e:") + (x.category_id || ""); sums.set(k, (sums.get(k) || 0) + txMain(x)); }
    const total = kind === "expense" ? s.spent : kind === "income" ? s.income : s.income - s.spent;
    const breakdown = [...sums].filter(([k]) => kind === "both" || k.startsWith(kind === "income" ? "i:" : "e:")).sort((p, q) => q[1] - p[1]);
    const bigK = kind === "both" ? null : (breakdown[0] || [0, 1])[1];
    const body = h("div", { class: "mk-sheet" },
      h("div", { class: "mk-hero k-" + kind },
        h("small", null, kind === "both" ? (total >= 0 ? "Left over" : "Overspent") : kind === "income" ? "Came in" : "Spent"),
        h("strong", { class: "num" }, money(Math.abs(total))),
        h("span", null, kind === "both" ? `${money(s.income, { whole: true })} ${tr("in")} · ${money(s.spent, { whole: true })} ${tr("out")}` : `${list.length} ${tr(list.length === 1 ? "entry" : "entries")}`)),
      kind === "both" ? h("div", { class: "mk-split" },
        h("button", { type: "button", class: "mk-half in", on: { click: () => monthKindSheet(m, "income") } }, h("small", null, "Came in"), h("b", { class: "num" }, money(s.income, { whole: true })), h("i", { style: { width: (s.income + s.spent ? s.income / Math.max(s.income, s.spent) * 100 : 0) + "%" } })),
        h("button", { type: "button", class: "mk-half out", on: { click: () => monthKindSheet(m, "expense") } }, h("small", null, "Spent"), h("b", { class: "num" }, money(s.spent, { whole: true })), h("i", { style: { width: (s.income + s.spent ? s.spent / Math.max(s.income, s.spent) * 100 : 0) + "%" } }))) : null,
      kind !== "both" && breakdown.length ? h("section", { class: "card flush mk-cats" }, h("div", { class: "card-head" }, h("h2", null, kind === "income" ? "Where it came from" : "By category")),
        breakdown.map(([k, v]) => { const c = cat(k.slice(2)); const color = c ? c.color : "#5b7083"; return h("div", { class: "mk-cat" }, h("span", { class: "mk-cat-top" }, h("i", { style: { background: color } }), h("span", null, c ? c.name : kind === "income" ? "Other income" : "Uncategorized"), c && c.virtual ? h("em", { class: "loan-tag" }, "Loan") : null, h("b", { class: "num" }, money(v, { whole: true })), h("small", { class: "num" }, `${Math.round(v / (total || 1) * 100)}%`)), h("span", { class: "bar" }, h("span", { style: { width: (v / bigK * 100) + "%", background: color } }))); })) : null,
      list.length ? h("section", { class: "card flush" }, h("div", { class: "card-head" }, h("h2", null, "Entries")), list.map(txnRow)) : h("p", { class: "empty" }, kind === "income" ? `Nothing came in during ${monthName(m)}.` : `No spending in ${monthName(m)}.`));
    openSheet(title, body, null, { fill: true });
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
      h("button", { type: "button", class: "tile tap", on: { click: () => monthKindSheet(m, "expense") } }, h("small", null, "Spent"), h("strong", null, money(s.spent, { whole: true })), s.loanOut ? h("span", { class: "loan-flag" }, `${tr("incl.")} ${money(s.loanOut, { whole: true })} ${tr("loans")}`) : changeText ? h("span", null, changeText) : null, icon("fwd", "ico sm tile-go")),
      h("button", { type: "button", class: "tile tap", on: { click: () => monthKindSheet(m, "income") } }, h("small", null, "Came in"), h("strong", null, money(s.income, { whole: true })), s.loanIn ? h("span", { class: "loan-flag" }, `${tr("incl.")} ${money(s.loanIn, { whole: true })} ${tr("loans")}`) : null, icon("fwd", "ico sm tile-go")),
      h("button", { type: "button", class: "tile tap " + (left >= 0 ? "good" : "bad"), on: { click: () => monthKindSheet(m, "both") } }, h("small", null, left >= 0 ? "Left over" : "Overspent"), h("strong", null, money(Math.abs(left), { whole: true })), icon("fwd", "ico sm tile-go"))));
    if (s.count) out.append(h("button", { type: "button", class: "btn alt", on: { click: () => recapSheet(m) } }, `${monthName(m)} summary`));
    out.append(h("button", { type: "button", class: "ai-cta", on: { click: assistantSheet } }, gioMark("gio gio-md"), h("span", null, h("strong", null, "Ask Gio about your money"), h("small", null, "\"Where can I save?\" · \"Who owes me?\"")), icon("fwd", "ico sm")));
    const rc = spendReceipt(m, s);
    out.append(rc || h("section", { class: "card" }, h("p", { class: "empty" }, `No spending in ${monthName(m)}.`)));


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
    {
      const sr = rows("rules").find(r => r.active && isSalaryRule(r));
      const sa = sr && acc(sr.account_id);
      kids.push(h("button", { type: "button", class: "sal-row", on: { click: salarySheet } },
        h("span", { class: "payday-ico sm" }, icon("work", "ico sm")),
        h("span", { class: "row-main" }, h("span", { class: "row-title" }, sr ? "Salary added on payday" : "Add my salary to my account every month"),
          h("span", { class: "row-sub wrap" }, sr && sa ? `${fmt(Number(sr.amount), sr.currency, { show: true })} → ${sa.name} · ${tr("day")} ${sr.day}` : "We ask you on payday, then add it")),
        h("span", { class: "sal-go" }, tr(sr ? "Change" : "Set up"))));
    }
    const changes = Object.entries(st.incomeSteps).sort();
    if (tab === "fixed" && changes.length) {
      kids.push(h("div", { class: "inc-steps" }, changes.map(([k, v]) => h("div", { class: "step-row" },
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
      h("span", { class: "dot acc-dot k-" + (KIND_ICON[a.kind] ? a.kind : "cash") }, icon(KIND_ICON[a.kind] || "cash", "ico sm")),
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
        return h("button", { type: "button", class: "row", on: { click: () => isBill(r) ? billSheet(r) : ruleSheet(r) } },
          h("span", { class: "dot", style: { background: c ? c.color : "#5b7083" } }, String(r.day)),
          h("span", { class: "row-main" }, h("span", { class: "row-title" }, [c ? c.name : "Entry", r.note].filter(Boolean).join(" · ")), h("span", { class: "row-sub" }, r.active ? `Next on ${dayLabel(r.next_on)}` : "Paused")),
          h("span", { class: "row-end" + (r.kind === "income" ? " pos" : "") }, (r.kind === "income" ? "+" : "−") + fmt(Number(r.amount), r.currency)));
      }) : h("p", { class: "empty" }, "Nothing repeats yet. Turn on “Repeat every month” when you add rent, salary or a subscription."),
      h("button", { type: "button", class: "row-btn", on: { click: () => billSheet(null) } }, "Add a bill with a reminder"),
      h("button", { type: "button", class: "row-btn", on: { click: salarySheet } }, salaryOn() ? "Change my salary" : "Add my salary every month")));

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
      h("button", { type: "button", class: "row", on: { click: () => quickSheet() } }, h("span", { class: "dot neutral" }, icon("plus", "ico sm")),
        h("span", { class: "row-main" }, h("span", { class: "row-title" }, "Add without opening the app"), h("span", { class: "row-sub wrap" }, quickOn ? "On. Tap to see the setup or turn it off" : "Tap the back of your iPhone or say “Hey Siri, Add expense”")), icon("fwd"))));

    out.append(group("Your name", h("div", { class: "row" }, h("span", { class: "row-main" }, nameIn, h("span", { class: "row-sub", style: { marginTop: "6px" } }, "Shown on the private pages you share")))),
      group("Signed in as", h("div", { class: "row" }, h("span", { class: "dot neutral" }, icon("mail", "ico sm")), h("span", { class: "row-main" }, h("span", { class: "row-title" }, S.email || "Signed in"), h("span", { class: "row-sub" }, "Your data syncs to every device you sign in on")))));

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
    out.append(group("Email",
      h("div", { class: "row" }, h("span", { class: "dot neutral" }, icon("mail", "ico sm")),
        h("span", { class: "row-main" }, h("span", { class: "row-title" }, "Monthly report by email"), h("span", { class: "row-sub wrap" }, storedSettings().reportOff ? "Off" : "A summary of last month, sent when you open the app on or after the 1st")),
        h("button", { type: "button", class: "switch", role: "switch", "aria-checked": String(!storedSettings().reportOff), "aria-label": "Monthly report by email", on: { click: () => saveSettings({ reportOff: !storedSettings().reportOff }) } }, h("span", { class: "knob" })))));
    out.append(group("Entries",
      h("div", { class: "row" }, h("span", { class: "dot neutral" }, icon("note", "ico sm")),
        h("span", { class: "row-main" }, h("span", { class: "row-title" }, "Note is required"), h("span", { class: "row-sub wrap" }, settings().noteRequired ? "Asked for every category except the ones ticked below" : "Notes are optional")),
        h("button", { type: "button", class: "switch", role: "switch", "aria-checked": String(settings().noteRequired), "aria-label": "Note is required", on: { click: () => saveSettings({ noteRequired: !settings().noteRequired }) } }, h("span", { class: "knob" }))),
      settings().noteRequired ? h("div", { class: "note-skip" },
        h("p", { class: "row-sub wrap" }, "No note needed for these. Tap to change:"),
        h("div", { class: "note-chips" }, rows("categories").filter(c => c.kind === "expense" || c.kind === "income").sort((p, q) => (p.kind === q.kind ? 0 : p.kind === "expense" ? -1 : 1) || bySort(p, q)).map(c => {
          const off = noteSkipSet().has(c.id);
          return h("button", { type: "button", class: "note-chip" + (off ? " on" : ""), "aria-pressed": String(off), style: { "--c": c.color }, on: { click: () => { const set = noteSkipSet(); if (off) set.delete(c.id); else set.add(c.id); saveSettings({ noteSkip: [...set] }); } } }, h("i"), c.name, off ? icon("check", "ico sm") : null);
        }))) : null));
    out.append(group("Help",
      h("button", { type: "button", class: "row-btn", on: { click: () => { for (const v of Object.keys(TOURS)) store.set("tour:" + v, 0); go("home"); setTimeout(() => startTour("home"), 500); } } }, "Show the tour again"),
      h("button", { type: "button", class: "row-btn", on: { click: helpSheet } }, "How each screen works"),
      h("button", { type: "button", class: "row-btn", on: { click: () => whatsNewSheet(true) } }, "What's new"),
      h("p", { class: "hint group-note" }, "To improve the app, it counts when you open it and which screens and buttons you use. It never sends your amounts, notes, names or accounts.")));
    out.append(group("Language", ...Object.entries(LANGS).map(([code, name]) => h("button", { type: "button", class: "row set-pick" + (code === LANG ? " on" : ""), "aria-pressed": String(code === LANG), on: { click: () => setLang(code) } },
      h("span", { class: "dot neutral lang-dot" }, code.toUpperCase()), h("span", { class: "row-main" }, h("span", { class: "row-title" }, name)), code === LANG ? icon("check", "ico sm pick-check") : null))));
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
      h("button", { type: "button", class: "row-btn danger", on: { click: () => { if (armed) signOut(); else { S.armed = "signout"; render(); } } } },
        armed ? (pending ? `Sign out and lose ${pending} unsynced changes?` : "Tap again to sign out") : "Sign out"),
      h("button", { type: "button", class: "row-btn danger", on: { click: deleteAccountSheet } }, "Delete account")));
    const theme = themePref();
    const ss = storedSettings();
    out.append(group("Appearance",
      ...[["system", "Match my phone", "Light or dark, like the rest of your phone", "phone"], ["light", "Light", "Always light", "sun"], ["dark", "Dark", "Always dark", "moon"]].map(([k, t, sub, ic]) => h("button", { type: "button", class: "row set-pick" + (theme === k ? " on" : ""), "aria-pressed": String(theme === k), on: { click: () => setTheme(k) } },
        h("span", { class: "dot neutral" }, icon(ic, "ico sm")), h("span", { class: "row-main" }, h("span", { class: "row-title" }, t), h("span", { class: "row-sub" }, sub)), theme === k ? icon("check", "ico sm pick-check") : null)),
      h("div", { class: "row" }, h("span", { class: "dot neutral" }, icon("eyeOff", "ico sm")),
        h("span", { class: "row-main" }, h("span", { class: "row-title" }, "Start with amounts hidden"), h("span", { class: "row-sub wrap" }, "Handy in public. Tap the eye at the top to show them.")),
        h("button", { type: "button", class: "switch", role: "switch", "aria-checked": String(!!ss.hideOnStart), "aria-label": "Start with amounts hidden", on: { click: () => saveSettings({ hideOnStart: !ss.hideOnStart }) } }, h("span", { class: "knob" })))));
    const liveAccs = rows("accounts").filter(o => !o.archived).sort(bySort);
    out.append(group("Defaults",
      h("label", { class: "row" }, h("span", { class: "dot neutral" }, icon("cash", "ico sm")),
        h("span", { class: "row-main" }, h("span", { class: "row-title" }, "Pay from by default"), h("span", { class: "row-sub wrap" }, "The account picked first when you add an expense")),
        h("select", { id: "s-defacc", class: "input mini-select", "aria-label": "Pay from by default", on: { change: e => saveSettings({ defAcc: e.target.value || "" }) } },
          h("option", { value: "", selected: !ss.defAcc }, tr("Last used")),
          ...liveAccs.map(o => h("option", { value: o.id, selected: ss.defAcc === o.id }, o.name))))));
    out.append(group("Advanced",
      h("div", { class: "row" }, h("span", { class: "dot neutral" }, icon("chip", "ico sm")),
        h("span", { class: "row-main" }, h("span", { class: "row-title" }, `Version ${VERSION}`), h("span", { class: "row-sub wrap" }, "Updates install by themselves when you open the app"))),
      h("button", { type: "button", class: "row-btn", on: { click: checkUpdate } }, "Check for updates now"),
      h("button", { type: "button", class: "row-btn", on: { click: async () => {
        if (!navigator.onLine) return toast("Connect to the internet to reload your data.", "error");
        if (S.outbox.length) await flush().catch(() => { });
        S.fullPull = true;
        await sync();
        toast("Reloaded from the server. This device now matches your other devices.");
      } } }, "Reload everything from the server"),
      h("button", { type: "button", class: "row-btn", on: { click: refreshApp } }, "Refresh the app"),
      h("p", { class: "hint group-note" }, "Refresh the app clears saved app files on this device and loads the newest ones. Your data stays.")));
    out.append(group("Diagnostics", ...diagRows().map(([k, v]) => h("div", { class: "row diag-row" }, h("span", { class: "row-main" }, h("span", { class: "row-title" }, k)), h("span", { class: "row-end" }, v))),
      h("button", { type: "button", class: "row-btn", on: { click: copyDiag } }, "Copy diagnostics"),
      h("p", { class: "hint group-note" }, "Diagnostics never include your amounts, notes or names. Send them to support if something looks wrong.")));

    const sections = [...out.children].filter(el => el.dataset && el.dataset.key);
    const pushOn = PUSH.state === "on";
    const lockOn = !!lockCfg();
    const count = n => n ? String(n) : "";
    const PAGES = [
      { id: "profile", t: "Profile", keys: ["Your name", "Signed in as"] },
      { id: "accounts", t: "Accounts", ic: "bank", c: "#3b74d0", keys: ["Accounts"], v: count(rows("accounts").filter(o => !o.archived).length), sec: "Money" },
      { id: "categories", t: "Categories", ic: "tag", c: "#c14a87", keys: ["Spending categories", "Income categories"], v: count(rows("categories").length), sec: "Money" },
      { id: "invest", t: "Investments", ic: "coin", c: "#c99a1c", fn: portfolioSheet, v: holdings().length ? String(holdings().length) : "", sec: "Money" },
      { id: "repeat", t: "Repeating and bills", ic: "repeat", c: "#7a5cd6", keys: ["Every month"], v: count(rows("rules").length), sec: "Money" },
      { id: "currency", t: "Currency and rates", ic: "coin", c: "#d4a23c", keys: ["Currency"], v: mainCur(), sec: "Money" },
      { id: "appearance", t: "Appearance", ic: "sun", c: "#2f74c9", keys: ["Appearance"], v: tr(theme === "light" ? "Light" : theme === "dark" ? "Dark" : "Automatic"), sec: "App" },
      { id: "language", t: "Language", ic: "globe", c: "#0d7a59", keys: ["Language"], v: LANGS[LANG], sec: "App" },
      { id: "notifications", t: "Notifications", ic: "bell", c: "#e0534a", keys: ["Daily reminder", "Email"], v: pushOn ? (PUSH.time || "21:00") : tr("Off"), sec: "App" },
      { id: "quick", t: "Add without opening the app", ic: "plus", c: "#0f8a6c", fn: () => quickSheet(), v: store.get("quickToken", null) ? tr("On") : "", sec: "App" },
      { id: "entries", t: "Entries and defaults", ic: "note", c: "#5b7083", keys: ["Entries", "Defaults"], sec: "App" },
      { id: "security", t: "Security", ic: "shield", c: "#1f7a5c", keys: ["Security"], v: lockOn ? tr("Locked") : "", sec: "Privacy and data" },
      { id: "data", t: "Sync and backup", ic: "sync", c: "#3b74d0", keys: ["Sync", "Your data"], v: S.outbox.length ? `${S.outbox.length} ${tr("waiting")}` : tr(navigator.onLine ? "Synced" : "Offline"), sec: "Privacy and data" },
      { id: "privacy", t: "Privacy", ic: "eye", c: "#5b7083", fn: privacySheet, sec: "Privacy and data" },
      { id: "help", t: "Help and tour", ic: "help", c: "#d4a23c", keys: ["Help"], sec: "Help" },
      { id: "news", t: "What's new", ic: "star", c: "#e0534a", fn: () => whatsNewSheet(true), sec: "Help" },
      { id: "advanced", t: "Advanced", ic: "chip", c: "#334155", keys: ["Advanced", "Diagnostics"], sec: "Help" },
      { id: "admin", t: "Admin dashboard", ic: "users", c: "#b8892a", fn: () => go("admin"), sec: "Admin", only: () => ADMIN.allowed },
      { id: "account", t: "Account", ic: "user", c: "#c03e2d", keys: ["Account"], v: "", sec: "Account" }
    ].filter(p => !p.only || p.only());
    const page = PAGES.find(p => p.id === S.setPage && p.keys);
    if (page) {
      const keep = sections.filter(el => page.keys.includes(el.dataset.key));
      out.replaceChildren(
        h("button", { type: "button", class: "back-row", on: { click: settingsBack } }, icon("back", "ico"), h("span", null, "Settings")),
        ...keep);
      out.classList.add("set-page");
      shell.title.textContent = tr(page.t);
      if (S.setFocus) { const k = S.setFocus; S.setFocus = null; requestAnimationFrame(() => { const el = [...document.querySelectorAll("main .group")].find(g => g.dataset.key === k); if (el) { el.scrollIntoView({ block: "center", behavior: "smooth" }); el.classList.add("flash"); setTimeout(() => el.classList.remove("flash"), 1600); } }); }
      return out;
    }
    const openPage = p => { if (p.fn) return p.fn(); settingsOpen(p.id); };
    const ico = p => h("span", { class: "set-ico", style: { "--c": p.c } }, icon(p.ic, "ico sm"));
    const q = (S.setQuery || "").trim().toLowerCase();
    const name = settings().name;
    const syncTxt = !navigator.onLine ? tr("Offline") : S.syncError ? tr("Couldn't sync") : S.outbox.length ? `${S.outbox.length} ${tr("waiting")}` : tr("Up to date");
    const profile = h("button", { type: "button", class: "set-profile", on: { click: () => settingsOpen("profile") } },
      h("span", { class: "set-avatar" }, (name || S.email || "?").trim().charAt(0).toUpperCase()),
      h("span", { class: "set-who" }, h("strong", null, name || tr("Add your name")), h("small", null, S.email || "")),
      h("span", { class: "set-sync" + (S.syncError || !navigator.onLine ? " bad" : S.outbox.length ? " wait" : "") }, h("i"), syncTxt));
    const search = h("label", { class: "set-search" }, icon("search", "ico sm"),
      h("input", { id: "set-q", type: "search", class: "set-q", placeholder: tr("Search settings"), autocomplete: "off", value: S.setQuery || "", "aria-label": "Search settings", on: { input: e => { S.setQuery = e.target.value; render(); } } }),
      q ? h("button", { type: "button", class: "set-q-x", "aria-label": "Clear", on: { click: () => { S.setQuery = ""; render(); } } }, icon("close", "ico sm")) : null);
    const kids = [profile, search];
    if (q) {
      const hits = [];
      const seen = new Set();
      for (const p of PAGES) {
        if (tr(p.t).toLowerCase().includes(q) || p.t.toLowerCase().includes(q)) { hits.push({ label: tr(p.t), where: tr(p.sec || "Settings"), go: () => { S.setQuery = ""; openPage(p); }, p }); seen.add(p.id + ":"); }
        for (const el of sections.filter(g => p.keys && p.keys.includes(g.dataset.key))) {
          for (const t of el.querySelectorAll(".row-title, .row-btn, .group-title")) {
            const txt = t.textContent.trim();
            if (!txt || !txt.toLowerCase().includes(q) || seen.has(p.id + ":" + txt)) continue;
            seen.add(p.id + ":" + txt);
            hits.push({ label: txt, where: tr(p.t), go: () => { S.setQuery = ""; S.setFocus = el.dataset.key; settingsOpen(p.id); }, p });
          }
        }
      }
      kids.push(hits.length
        ? h("section", { class: "card flush set-list" }, hits.slice(0, 30).map(x => h("button", { type: "button", class: "row", on: { click: x.go } }, ico(x.p), h("span", { class: "row-main" }, h("span", { class: "row-title" }, x.label), h("span", { class: "row-sub" }, x.where)), icon("fwd"))))
        : h("p", { class: "empty" }, "No setting matches that."));
      out.replaceChildren(...kids);
      return out;
    }
    const quickToggle = (ic, label, onNow, fn, disabled) => h("button", { type: "button", class: "set-tile" + (onNow ? " on" : ""), "aria-pressed": String(!!onNow), disabled: !!disabled, on: { click: fn } },
      icon(ic, "ico sm"), h("span", null, label), h("small", null, tr(onNow ? "On" : "Off")));
    kids.push(h("div", { class: "set-tiles" },
      quickToggle("lock", "App lock", lockOn, () => (lockOn ? disableLock() : enableLock()), !lockSupported()),
      quickToggle("bell", "Daily reminder", pushOn, () => pushOn ? disablePush() : PUSH.state === "off" ? enablePush(PUSH.time || "21:00") : settingsOpen("notifications")),
      quickToggle("eyeOff", "Hide amounts", S.hidden, () => { S.hidden = !S.hidden; store.set("hidden", S.hidden); render(); }),
      quickToggle("note", "Note required", settings().noteRequired, () => saveSettings({ noteRequired: !settings().noteRequired }))));
    for (const sec of ["Money", "App", "Privacy and data", "Help", "Admin", "Account"]) {
      const list = PAGES.filter(p => p.sec === sec);
      if (!list.length) continue;
      kids.push(h("section", { class: "group" }, h("h2", { class: "group-title" }, sec),
        h("div", { class: "card flush set-list" }, list.map(p => h("button", { type: "button", class: "row", on: { click: () => openPage(p) } },
          ico(p), h("span", { class: "row-main" }, h("span", { class: "row-title" }, p.t)), p.v ? h("span", { class: "set-val" }, p.v) : null, icon("fwd"))))));
    }
    kids.push(h("p", { class: "about" }, `BudgetSplit · Version ${VERSION}`));
    out.replaceChildren(...kids);
    return out;
  }

  function themePref() { try { const v = localStorage.getItem("wallet:theme"); return v === "light" || v === "dark" ? v : "system"; } catch { return "system"; } }
  const systemDark = () => window.matchMedia("(prefers-color-scheme: dark)").matches;
  const themeIsDark = v => v === "dark" || (v === "system" && systemDark());
  function applyTheme() {
    const v = themePref();
    const root = document.documentElement;
    if (v === "system") { root.removeAttribute("data-theme"); root.style.colorScheme = ""; } else { root.setAttribute("data-theme", v); root.style.colorScheme = v; }
    document.querySelectorAll('meta[name="theme-color"]').forEach(m => m.remove());
    const add = (content, media) => { const m = document.createElement("meta"); m.name = "theme-color"; m.content = content; if (media) m.media = media; document.head.append(m); };
    if (v === "system") { add("#f1f5f0", "(prefers-color-scheme: light)"); add("#040b08", "(prefers-color-scheme: dark)"); }
    else add(v === "dark" ? "#040b08" : "#f1f5f0");
  }
  function setTheme(v) {
    const before = themeIsDark(themePref());
    try { if (v === "system") localStorage.removeItem("wallet:theme"); else localStorage.setItem("wallet:theme", v); } catch { }
    applyTheme();
    track("set", "theme_" + v);
    const iosApp = navigator.standalone === true && /iPhone|iPad|iPod/.test(navigator.userAgent);
    if (iosApp && before !== themeIsDark(v)) {
      try { sessionStorage.setItem("wallet:reopen", "appearance"); } catch { }
      clearTimeout(persistTimer);
      persist();
      location.reload();
      return;
    }
    render();
  }

  function settingsOpen(id) {
    S.setPage = id;
    try { history.pushState({ sp: id }, ""); } catch { }
    if (shell) { shell.main.classList.remove("set-back"); shell.main.classList.add("set-in"); setTimeout(() => shell && shell.main.classList.remove("set-in"), 320); }
    render();
    toTop();
  }
  function settingsBack() {
    if (history.state && history.state.sp) { history.back(); return; }
    settingsClose();
  }
  function settingsClose() {
    if (!S.setPage) return;
    S.setPage = null;
    if (shell) { shell.main.style.transform = ""; shell.main.classList.remove("set-in"); shell.main.classList.add("set-back"); setTimeout(() => shell && shell.main.classList.remove("set-back"), 320); }
    render();
    toTop();
  }
  window.addEventListener("popstate", () => { if (S.view === "settings" && S.setPage) settingsClose(); });
  function initSettingsSwipe() {
    const SWB = { on: false, x0: 0, y0: 0, dx: 0, live: false, t0: 0 };
    document.addEventListener("touchstart", e => {
      SWB.on = false;
      if (S.view !== "settings" || !S.setPage || e.touches.length > 1 || document.querySelector(".overlay.open")) return;
      const t = e.touches[0], rtl = document.dir === "rtl";
      const edge = rtl ? innerWidth - t.clientX : t.clientX;
      if (edge > 32) return;
      Object.assign(SWB, { on: true, x0: t.clientX, y0: t.clientY, dx: 0, live: false, t0: Date.now() });
    }, { passive: true });
    document.addEventListener("touchmove", e => {
      if (!SWB.on) return;
      const t = e.touches[0], rtl = document.dir === "rtl" ? -1 : 1;
      const dx = (t.clientX - SWB.x0) * rtl, dy = t.clientY - SWB.y0;
      if (!SWB.live) {
        if (Math.abs(dy) > 10 && Math.abs(dy) > Math.abs(dx)) { SWB.on = false; return; }
        if (dx < 8) return;
        SWB.live = true;
        shell.main.classList.add("set-drag");
      }
      if (e.cancelable) e.preventDefault();
      SWB.dx = Math.max(0, dx);
      shell.main.style.transform = `translateX(${SWB.dx * rtl}px)`;
    }, { passive: false });
    const end = () => {
      if (!SWB.on) return;
      SWB.on = false;
      if (!SWB.live) return;
      shell.main.classList.remove("set-drag");
      const fast = SWB.dx > 60 && Date.now() - SWB.t0 < 300;
      if (SWB.dx > innerWidth * 0.33 || fast) { shell.main.style.transform = ""; settingsBack(); }
      else { shell.main.classList.add("set-snap"); shell.main.style.transform = ""; setTimeout(() => shell.main.classList.remove("set-snap"), 260); }
    };
    document.addEventListener("touchend", end, true);
    document.addEventListener("touchcancel", end, true);
  }
  function diagRows() {
    const n = t => rows(t).length;
    let bytes = 0;
    try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k && k.startsWith("wallet:")) bytes += (localStorage.getItem(k) || "").length * 2; } } catch { }
    const standalone = navigator.standalone === true || matchMedia("(display-mode: standalone)").matches;
    return [
      ["Entries", String(n("transactions"))],
      ["Accounts", String(n("accounts"))],
      ["Categories", String(n("categories"))],
      ["Repeating", String(n("rules"))],
      ["People", String(n("people"))],
      ["Groups", String(GROUPS.list.size)],
      ["Waiting to sync", String(S.outbox.length)],
      ["Last synced", S.syncedAt ? ago(S.syncedAt) : tr("Never")],
      ["Saved on this device", bytes > 1048576 ? `${(bytes / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`],
      ["Installed on Home Screen", tr(standalone ? "Yes" : "No")],
      ["Notifications", tr(PUSH.state === "on" ? "On" : PUSH.state === "denied" ? "Blocked" : "Off")],
      ["Online", tr(navigator.onLine ? "Yes" : "No")]
    ];
  }
  async function copyDiag() {
    const text = [`BudgetSplit ${VERSION}`, `${navigator.userAgent}`, `Language: ${LANG} · Theme: ${themePref()}`, ...diagRows().map(([k, v]) => `${k}: ${v}`)].join("\n");
    try { await navigator.clipboard.writeText(text); toast("Diagnostics copied."); } catch { toast("Couldn't copy. Try again.", "error"); }
  }
  async function checkUpdate() {
    if (!navigator.onLine) return toast("Connect to the internet to check for updates.", "error");
    if (!("serviceWorker" in navigator)) return toast("You're on the latest version.");
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      if (!reg) return toast("You're on the latest version.");
      await reg.update();
      if (reg.installing || reg.waiting) { toast("Updating… the app will restart in a moment."); return; }
      toast("You're on the latest version.");
    } catch { toast("Couldn't check right now. Try again.", "error"); }
  }
  async function refreshApp() {
    if (!navigator.onLine) return toast("Connect to the internet first.", "error");
    try { if (S.outbox.length) await flush(); } catch { }
    try { if (window.caches) for (const k of await caches.keys()) await caches.delete(k); } catch { }
    location.reload();
  }

  const LINK_RE = /^[A-Za-z0-9_-]{32,64}\.[A-Za-z0-9_-]{43}$/;
  const linkOf = p => p && typeof p.link === "string" && LINK_RE.test(p.link) ? { token: p.link.split(".")[0], skey: p.link.split(".")[1] } : null;
  const LINKED = new Map();
  const LINKS = { owned: new Map(), pings: new Set(), timer: 0 };
  const sharedOut = () => { const q = store.get("sharedOut", []); return Array.isArray(q) ? q : []; };
  function linkedEntries(p) {
    const l = LINKED.get(p.id) || {};
    const list = (l.entries || []).slice();
    const have = new Set(list.map(e => e.id));
    for (const e of [...(l.pending || []), ...sharedOut().filter(q => q.person_id === p.id)]) {
      if (have.has(e.id)) continue;
      have.add(e.id);
      list.push({ id: e.id, person_id: p.id, amount: e.amount, note: e.note, occurred_on: e.date || e.occurred_on, created_at: e.created_at, remote: "pending" });
    }
    return list;
  }
  const loanRows = () => {
    const list = rows("loan_entries");
    for (const p of rows("people")) if (linkOf(p)) list.push(...linkedEntries(p));
    return list;
  };
  const virtualEntry = id => { for (const p of rows("people")) if (linkOf(p)) { const e = linkedEntries(p).find(x => x.id === id); if (e) return e; } return null; };
  const loanBalances = () => {
    const b = new Map();
    for (const e of loanRows()) b.set(e.person_id, (b.get(e.person_id) || 0) + Number(e.amount));
    return b;
  };
  const sharedId = () => "se-" + newToken().slice(0, 32);
  const shortHash = async str => toUrl(b64u8(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(str))))).slice(0, 24);

  function saveLoan(p, entry, extra = []) {
    const link = linkOf(p);
    if (!link) return putMany([{ t: "loan_entries", r: entry }, ...extra]);
    if (extra.length) putMany(extra);
    queueShared(p, link, entry);
  }
  function queueShared(p, link, entry) {
    store.set("sharedOut", [...sharedOut(), { id: entry.id, token: link.token, person_id: p.id, amount: entry.amount, note: entry.note, date: entry.occurred_on, created_at: entry.created_at }]);
    track("add", "shared_loan");
    scheduleRender();
    flushSharedOut();
  }
  async function flushSharedOut() {
    const q = sharedOut();
    if (!q.length || !sb || !S.session || !navigator.onLine || LINKS.flushing) return;
    LINKS.flushing = true;
    const left = [], sent = new Set();
    for (const item of q) {
      const p = S.data.people.get(item.person_id);
      const link = linkOf(p);
      if (!link || link.token !== item.token) continue;
      let res;
      try {
        const senc = await sealWith(await shareKey(link.skey), { id: item.id, amount: item.amount, note: item.note, date: item.date });
        res = await sb.from("shared_entries").insert({ id: item.id, token: item.token, senc });
      } catch { res = { error: {} }; }
      if (!res.error || res.error.code === "23505") {
        sent.add(item.token);
        const l = LINKED.get(item.person_id);
        if (l) l.pending = [...(l.pending || []).filter(e => e.id !== item.id), { id: item.id, amount: item.amount, note: item.note, date: item.date, created_at: item.created_at }];
      } else if (!res.error.code) left.push(item);
    }
    store.set("sharedOut", left);
    LINKS.flushing = false;
    for (const t of sent) pingLoan(t);
    scheduleRender();
  }
  function pingLoan(token) {
    if (!sb || !S.session || !navigator.onLine) return;
    sb.functions.invoke("send-reminder", { body: { action: "loan_ping", token, name: settings().name || "" } }).catch(() => { });
  }
  function schedulePing(token) {
    LINKS.pings.add(token);
    clearTimeout(LINKS.timer);
    LINKS.timer = setTimeout(async () => {
      try { await flush(); } catch { }
      for (const t of LINKS.pings) pingLoan(t);
      LINKS.pings.clear();
    }, 500);
  }
  async function loadLinked() {
    if (!sb || !S.session || !navigator.onLine || LINKS.loading) return;
    const linked = rows("people").filter(linkOf);
    if (!linked.length) return;
    LINKS.loading = true;
    let changed = false;
    for (const p of linked) {
      const { token, skey } = linkOf(p);
      try {
        const key = await shareKey(skey);
        const res = await sb.rpc("shared_ledger", { p_token: token });
        if (res.error) continue;
        const prev = LINKED.get(p.id);
        if (!res.data || !res.data.person) {
          if (!prev || !prev.off) { LINKED.set(p.id, { ...(prev || { entries: [] }), off: true, pending: [] }); changed = true; }
          continue;
        }
        const info = await openWith(key, res.data.person);
        const entries = [];
        for (const sealed of Array.isArray(res.data.history) ? res.data.history : []) {
          try {
            const e = await openWith(key, sealed);
            const amount = Number(e.amount);
            if (!isFinite(amount) || !amount) continue;
            entries.push({ id: typeof e.id === "string" && e.id.length <= 120 ? e.id : "x-" + await shortHash(sealed), person_id: p.id, amount, note: typeof e.note === "string" ? e.note.slice(0, 200) : null, occurred_on: DATE_RE.test(String(e.date)) ? e.date : today(), created_at: typeof e.at === "string" ? e.at.slice(0, 40) : "", remote: true });
          } catch { }
        }
        const pending = [];
        const mine = await sb.from("shared_entries").select("id, senc, created_at").eq("token", token).is("consumed_at", null);
        for (const r of mine.data || []) {
          if (entries.some(e => e.id === r.id)) continue;
          try { const e = await openWith(key, r.senc); pending.push({ id: r.id, amount: Number(e.amount), note: e.note || null, date: e.date, created_at: r.created_at }); } catch { }
        }
        const from = typeof info.from === "string" ? info.from.trim().slice(0, 40) : "";
        let viewOnly = prev ? !!prev.viewOnly : false;
        try { const vo = await sb.from("loan_links").select("view_only").eq("token", token).maybeSingle(); if (!vo.error && vo.data) viewOnly = !!vo.data.view_only; } catch { }
        const sig = JSON.stringify([entries, pending, from, viewOnly]);
        if (!prev || prev.sig !== sig) {
          LINKED.set(p.id, { entries, pending, from, off: false, sig, viewOnly });
          changed = true;
        }
      } catch { }
    }
    LINKS.loading = false;
    if (changed) {
      store.set("linked", [...LINKED.entries()]);
      ver++;
      scheduleRender();
    }
  }
  async function importShared() {
    if (!sb || !S.session || !navigator.onLine || LINKS.importing) return;
    const owned = rows("people").filter(p => p.share_token && p.skey);
    if (!owned.length) { LINKS.owned = new Map(); return; }
    LINKS.importing = true;
    try {
      const { data: links, error } = await sb.from("loan_links").select("token, member, view_only").eq("owner", S.uid);
      if (error) return;
      LINKS.owned = new Map((links || []).map(l => [l.token, l.member]));
      LINKS.view = new Map((links || []).map(l => [l.token, !!l.view_only]));
      const tokens = owned.map(p => p.share_token).filter(t => LINKS.owned.has(t));
      if (!tokens.length) return;
      const { data } = await sb.from("shared_entries").select("id, token, senc").in("token", tokens).is("consumed_at", null).limit(200);
      const items = [], done = [], who = new Map();
      for (const r of data || []) {
        const p = owned.find(x => x.share_token === r.token);
        done.push(r.id);
        if (!p || !/^se-[A-Za-z0-9_-]{20,40}$/.test(r.id) || S.data.loan_entries.has(r.id)) continue;
        try {
          const e = await openWith(await shareKey(p.skey), r.senc);
          const amount = roundCur(Number(e.amount), p.currency);
          if (!isFinite(amount) || !amount || Math.abs(amount) > 1e12) continue;
          items.push({ t: "loan_entries", r: { id: r.id, person_id: p.id, amount, note: typeof e.note === "string" ? e.note.trim().slice(0, 200) || null : null, occurred_on: DATE_RE.test(String(e.date)) ? e.date : today(), created_at: new Date().toISOString() } });
          who.set(p.name, (who.get(p.name) || 0) + 1);
        } catch { }
      }
      if (items.length) { TRACK.mute = true; putMany(items); TRACK.mute = false; await flush(); }
      if (done.length) await sb.from("shared_entries").update({ consumed_at: new Date().toISOString() }).in("id", done);
      for (const [name, n] of who) toast(n === 1 ? `${name} added an entry to your shared loan.` : `${name} added ${n} entries to your shared loan.`);
    } catch { } finally { LINKS.importing = false; }
  }
  async function processPendingJoin() {
    let pend = null;
    try { pend = JSON.parse(localStorage.getItem("wallet:joinLink") || "null"); } catch { pend = null; }
    if (!pend || !LINK_RE.test(String(pend.link)) || !sb || !S.session || !VAULT.key || !navigator.onLine) return;
    if (busyUi()) { if (!LINKS.waitJoin) { LINKS.waitJoin = true; whenIdle(() => { LINKS.waitJoin = false; processPendingJoin(); }); } return; }
    try { localStorage.removeItem("wallet:joinLink"); } catch { }
    const [token, skey] = pend.link.split(".");
    const existing = rows("people").find(p => linkOf(p) && linkOf(p).token === token);
    if (existing) { go("people"); setTimeout(() => personSheet(existing), 300); return; }
    try {
      const j = await sb.rpc("join_loan", { p_token: token });
      if (j.error || !j.data || !j.data.ok) {
        const why = j.data && j.data.reason;
        return toast(why === "own" ? "That's your own link. Send it to the other person." : why === "taken" ? "Someone else already added this loan to their app." : "This link doesn't work anymore. Ask for a new one.", "error");
      }
      const res = await sb.rpc("shared_ledger", { p_token: token });
      const info = await openWith(await shareKey(skey), res.data.person);
      const cur = CUR_RE.test(String(info.currency)) ? info.currency : mainCur();
      const from = typeof info.from === "string" && info.from.trim() ? info.from.trim().slice(0, 40) : "Shared loan";
      const person = { id: newId(), name: from, direction: info.direction === "owes_me" ? "i_owe" : "owes_me", currency: cur, phone: null, share_token: null, link: pend.link, sort: Math.max(-1, ...rows("people").map(r => r.sort || 0)) + 1 };
      put("people", person);
      track("add", "linked_loan");
      await loadLinked();
      go("people");
      setTimeout(() => personSheet(S.data.people.get(person.id) || person), 350);
      toast(`Your loan with ${from} is now in Split.`);
    } catch { toast("Couldn't add the loan. Open the link again.", "error"); }
  }
  function unlinkMember(p) {
    const l = linkOf(p);
    if (l && sb) sb.from("loan_links").delete().eq("token", l.token).then(() => { }, () => { });
    LINKED.delete(p.id);
    store.set("linked", [...LINKED.entries()]);
  }
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
  const waButton = (phone, text, label, cls = "") => h("a", { class: "btn " + cls, href: waUrl(phone, text), target: "_blank", rel: "noopener noreferrer", on: { click: () => track("whatsapp") } }, icon("chat"), label);
  const owesMe = p => p.direction === "owes_me";
  const netMine = (p, v) => owesMe(p) ? v : -v;
  const theyOwe = (p, v) => netMine(p, v) > 0;
  const statusText = (p, v) => Math.abs(v) < 0.005 ? "Settled" : theyOwe(p, v) ? "Owes you" : "You owe";

  const loanMessage = (p, delta, balance, note) => {
    const m = v => fmt(v, p.currency, { show: true });
    const why = note ? ` (${note})` : "";
    const after = Math.abs(balance) < 0.005 ? "We're all settled now." : theyOwe(p, balance) ? `You now owe me ${m(Math.abs(balance))}.` : `I now owe you ${m(Math.abs(balance))}.`;
    const d = netMine(p, delta);
    return d > 0 ? `Hi ${p.name}, I gave you ${m(d)}${why}. ${after}` : `Hi ${p.name}, I got ${m(-d)} from you${why}, thanks. ${after}`;
  };
  const balanceMessage = (p, balance) => {
    const m = fmt(balance, p.currency, { show: true });
    if (Math.abs(balance) < 0.005) return `Hi ${p.name}, we're all settled. Nothing owed either way.`;
    const mm = fmt(Math.abs(balance), p.currency, { show: true });
    return theyOwe(p, balance) ? `Hi ${p.name}, just so you know, you owe me ${mm} so far.` : `Hi ${p.name}, just so you know, I owe you ${mm} so far.`;
  };
  const linkMessage = (p, token) => `Hi ${p.name}, here's a private page with your balance and history. It updates whenever something changes: ${shareUrl(p)}`;

  async function copyText(text, fallbackId) {
    try { await navigator.clipboard.writeText(text); toast("Copied."); return; } catch { }
    const el = document.getElementById(fallbackId);
    if (el) { el.hidden = false; el.focus(); el.select(); toast("Copy the selected link."); }
  }

  const KP = { priv: null, pub: null, published: false, busy: null };
  const ECDH = { name: "ECDH", namedCurve: "P-256" };
  const fromB64u = s => unb64(fromUrl(s));
  async function myKeys() {
    if (KP.priv) return KP;
    if (KP.busy) return KP.busy;
    KP.busy = (async () => {
      const st = storedSettings();
      if (st.kp && st.kp.d && typeof st.kpPub === "string") {
        KP.priv = await crypto.subtle.importKey("jwk", st.kp, ECDH, false, ["deriveBits"]);
        KP.pub = st.kpPub;
      } else {
        const pair = await crypto.subtle.generateKey(ECDH, true, ["deriveBits"]);
        const { kty, crv, x, y, d } = await crypto.subtle.exportKey("jwk", pair.privateKey);
        KP.pub = toUrl(b64u8(new Uint8Array(await crypto.subtle.exportKey("raw", pair.publicKey))));
        KP.priv = pair.privateKey;
        saveSettings({ kp: { kty, crv, x, y, d }, kpPub: KP.pub });
      }
      KP.busy = null;
      return KP;
    })();
    return KP.busy;
  }
  async function publishKey() {
    if (KP.published || !sb || !S.session || !navigator.onLine || !VAULT.key || !S.syncedAt) return;
    const k = await myKeys();
    const { error } = await sb.from("user_keys").upsert({ user_id: S.uid, pub: k.pub, updated_at: new Date().toISOString() });
    if (!error) KP.published = true;
  }
  const sharedSecret = async (priv, pubRaw) => crypto.subtle.importKey("raw", await crypto.subtle.digest("SHA-256", await crypto.subtle.deriveBits({ name: "ECDH", public: await crypto.subtle.importKey("raw", pubRaw, ECDH, false, []) }, priv, 256)), "AES-GCM", false, ["encrypt", "decrypt"]);
  async function sealTo(pubB64, bytes) {
    const eph = await crypto.subtle.generateKey(ECDH, true, ["deriveBits"]);
    const key = await sharedSecret(eph.privateKey, fromB64u(pubB64));
    const iv = rand(12);
    const ct = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, bytes));
    const epk = new Uint8Array(await crypto.subtle.exportKey("raw", eph.publicKey));
    const out = new Uint8Array(65 + 12 + ct.length);
    out.set(epk, 0); out.set(iv, 65); out.set(ct, 77);
    return toUrl(b64u8(out));
  }
  async function openSealed(str) {
    const k = await myKeys();
    const all = fromB64u(str);
    const key = await sharedSecret(k.priv, all.slice(0, 65));
    return new Uint8Array(await crypto.subtle.decrypt({ name: "AES-GCM", iv: all.slice(65, 77) }, key, all.slice(77)));
  }

  const GROUPS = { list: new Map(), loading: false, at: 0, keys: new Map() };
  const gid8 = () => newToken().slice(0, 32);
  const memberKey = uid => "u:" + uid;
  function cacheGroups() {
    store.set("groups", [...GROUPS.list.values()].map(g => ({ ...g, key: undefined })));
    store.set("groupKeys", [...GROUPS.keys.entries()].map(([id, raw]) => [id, b64u8(raw)]));
  }
  function loadGroupCache() {
    GROUPS.list.clear(); GROUPS.keys.clear();
    const keys = store.get("groupKeys", []);
    if (Array.isArray(keys)) for (const [id, b] of keys) { try { GROUPS.keys.set(id, unb64(b)); } catch { } }
    const list = store.get("groups", []);
    if (Array.isArray(list)) for (const g of list) if (g && g.id && g.meta) GROUPS.list.set(g.id, g);
  }
  const groupKey = async id => { const raw = GROUPS.keys.get(id); return raw ? aesKey(raw) : null; };

  async function loadGroups(quiet) {
    if (GROUPS.loading) { GROUPS.again = true; return; }
    if (!sb || !S.session || !navigator.onLine || !VAULT.key) return;
    GROUPS.loading = true;
    try {
      await myKeys();
      const mine = await sb.from("group_members").select("group_id, sealed_key, joined").eq("user_id", S.uid);
      if (mine.error) return;
      const ids = (mine.data || []).map(m => m.group_id);
      const next = new Map();
      if (ids.length) {
        const [gs, ms, es] = await Promise.all([
          sb.from("groups").select("id, enc, created_by, updated_at").in("id", ids),
          sb.from("group_members").select("group_id, user_id, joined, profile, invited_by").in("group_id", ids),
          sb.from("group_entries").select("id, group_id, author, enc, created_at").in("group_id", ids).is("deleted_at", null)
        ]);
        const entryIds = (es.data || []).map(e => e.id);
        const vs = entryIds.length ? await sb.from("group_votes").select("entry_id, user_id").in("entry_id", entryIds) : { data: [] };
        for (const row of mine.data || []) {
          let raw = GROUPS.keys.get(row.group_id);
          if (!raw && row.sealed_key) { try { raw = await openSealed(row.sealed_key); GROUPS.keys.set(row.group_id, raw); } catch { raw = null; } }
          const g = (gs.data || []).find(x => x.id === row.group_id);
          if (!raw || !g) continue;
          const key = await aesKey(raw);
          let meta;
          try { meta = await openWith(key, g.enc); } catch { continue; }
          const members = [];
          for (const m of (ms.data || []).filter(x => x.group_id === g.id)) {
            let name = "";
            if (m.profile) { try { name = String((await openWith(key, m.profile)).name || "").slice(0, 40); } catch { } }
            members.push({ id: memberKey(m.user_id), user_id: m.user_id, joined: m.joined, name: name || (m.user_id === S.uid ? settings().name || "You" : m.joined ? "Member" : "Invited") });
          }
          const entries = [];
          if (row.joined) for (const e of (es.data || []).filter(x => x.group_id === g.id)) {
            try {
              const d = await openWith(key, e.enc);
              const amount = Number(d.amount);
              if (!isFinite(amount) || amount <= 0 || !d.shares || typeof d.shares !== "object") continue;
              entries.push({ id: e.id, author: e.author, created_at: e.created_at, kind: ["expense", "loan", "payment"].includes(d.kind) ? d.kind : "expense", payer: String(d.payer), amount, shares: d.shares, note: typeof d.note === "string" ? d.note.slice(0, 200) : "", date: DATE_RE.test(String(d.date)) ? d.date : e.created_at.slice(0, 10), votes: (vs.data || []).filter(v => v.entry_id === e.id).map(v => v.user_id) });
            } catch { }
          }
          entries.sort((a, b) => b.date.localeCompare(a.date) || b.created_at.localeCompare(a.created_at));
          next.set(g.id, { id: g.id, created_by: g.created_by, joined: row.joined, invited_by: ((ms.data || []).find(x => x.group_id === g.id && x.user_id === S.uid) || {}).invited_by, meta: { name: String(meta.name || "Group").slice(0, 40), currency: CUR_RE.test(String(meta.currency)) ? meta.currency : "USD", guests: Array.isArray(meta.guests) ? meta.guests.filter(x => x && typeof x.id === "string" && typeof x.name === "string").slice(0, 30) : [], claims: meta.claims && typeof meta.claims === "object" ? Object.fromEntries(Object.entries(meta.claims).filter(([k, v]) => typeof k === "string" && /^[0-9a-f-]{36}$/i.test(String(v)))) : {}, emails: meta.emails && typeof meta.emails === "object" ? Object.fromEntries(Object.entries(meta.emails).filter(([k, v]) => /^[gue]:/.test(k) && typeof v === "string" && /^[^@\s<>]{1,64}@[^@\s<>]{1,190}$/.test(v)).slice(0, 60)) : {} }, members, entries });
        }
      }
      const before = GROUPS.list;
      let news = 0;
      for (const [id, g] of next) { const old = before.get(id); if (old && old.joined) news += g.entries.filter(e => !old.entries.some(o => o.id === e.id) && e.author !== S.uid).length; }
      const invites = [...next.values()].filter(g => !g.joined && !before.has(g.id)).length;
      GROUPS.list = next;
      for (const id of [...GROUPS.keys.keys()]) if (!next.has(id)) GROUPS.keys.delete(id);
      GROUPS.at = Date.now();
      cacheGroups();
      for (const g of next.values()) {
        const me = g.members.find(m => m.user_id === S.uid);
        if (g.joined && me && (me.name === "You" || me.name === "Member") && settings().name) setGroupProfile(g.id);
      }
      if (!quiet && news) toast(news === 1 ? "There's a new entry in a shared group." : `There are ${news} new entries in your shared groups.`);
      if (!quiet && invites) toast("You've been invited to a shared group. Open Split to answer.");
      ver++;
      scheduleRender();
      cleanGroupMoney();
      if (!GROUPS.resolving) { GROUPS.resolving = true; resolveEmailInvites().finally(() => { GROUPS.resolving = false; }); }
      if (GROUPS.open) GROUPS.open();
    } catch { } finally {
      GROUPS.loading = false;
      if (GROUPS.again) { GROUPS.again = false; setTimeout(() => loadGroups(true), 50); }
    }
  }
  async function setGroupProfile(id, name) {
    const key = await groupKey(id);
    if (!key) return;
    const fallback = String(S.email || "").split("@")[0].replace(/[._-]+/g, " ").trim().replace(/\b\w/g, c => c.toUpperCase());
    await sb.rpc("set_group_profile", { p_group: id, p_profile: await sealWith(key, { name: (name || settings().name || fallback || "Member").slice(0, 40) }) });
  }
  function groupPing(id, invitee) {
    if (!sb || !S.session || !navigator.onLine) return;
    sb.functions.invoke("send-reminder", { body: { action: "group_ping", group_id: id, name: settings().name || "", invitee: invitee || null } }).catch(() => { });
  }

  const claimOf = (g, gid) => { const u = (g.meta.claims || {})[gid]; return u && g.members.some(m => m.user_id === u && m.joined) ? u : null; };
  const canon = (g, k) => { if (k.startsWith("g:")) { const u = claimOf(g, k.slice(2)); if (u) return memberKey(u); } return k; };
  const isMe = (g, k) => canon(g, k) === memberKey(S.uid);
  const gName = (g, k0) => { const k = canon(g, k0); if (k.startsWith("g:")) { const x = g.meta.guests.find(q => "g:" + q.id === k); return x ? x.name : "Someone"; } const m = g.members.find(q => q.id === k); return m ? (m.user_id === S.uid ? "You" : m.name) : "Former member"; };
  const gParties = g => [...g.members.filter(m => m.joined || m.user_id === S.uid).map(m => ({ id: m.id, name: m.user_id === S.uid ? "You" : m.name, me: m.user_id === S.uid })), ...g.meta.guests.filter(x => !claimOf(g, x.id)).map(x => ({ id: "g:" + x.id, name: x.name, guest: true }))];
  function gBalances(g) {
    const b = new Map(gParties(g).map(p => [p.id, 0]));
    for (const e of g.entries) {
      const payer = canon(g, e.payer);
      b.set(payer, (b.get(payer) || 0) + e.amount);
      for (const [k0, v] of Object.entries(e.shares)) { const k = canon(g, k0); b.set(k, (b.get(k) || 0) - (Number(v) || 0)); }
    }
    return b;
  }
  function gSettle(g) {
    const b = gBalances(g);
    const cred = [...b].filter(([, v]) => v > 0.005).map(([k, v]) => [k, v]).sort((x, y) => y[1] - x[1]);
    const debt = [...b].filter(([, v]) => v < -0.005).map(([k, v]) => [k, -v]).sort((x, y) => y[1] - x[1]);
    const out = [];
    let i = 0, j = 0;
    while (i < debt.length && j < cred.length) {
      const amt = Math.min(debt[i][1], cred[j][1]);
      out.push({ from: debt[i][0], to: cred[j][0], amount: roundCur(amt, g.meta.currency) });
      debt[i][1] -= amt; cred[j][1] -= amt;
      if (debt[i][1] < 0.005) i++;
      if (cred[j][1] < 0.005) j++;
    }
    return out.filter(x => x.amount > 0);
  }
  const inviteEmail = (g, key) => {
    const em = g.meta.emails || {};
    const u = key.startsWith("g:") ? (g.meta.claims || {})[key.slice(2)] : null;
    const e = em[key] || (u ? em["u:" + u] : null);
    return typeof e === "string" && e.length <= 254 ? e : null;
  };
  async function fillInviteEmails(g) {
    if (!g.joined || !g.members.some(m => m.user_id !== S.uid && !inviteEmail(g, m.id))) return false;
    const { data, error } = await sb.rpc("my_invite_emails", { p_group: g.id });
    if (error || !data || !data.length) return false;
    const emails = { ...(g.meta.emails || {}) };
    for (const r of data) if (r.user_id && typeof r.email === "string") emails["u:" + r.user_id] = r.email;
    if (JSON.stringify(emails) === JSON.stringify(g.meta.emails || {})) return false;
    try { await saveGroupMeta(g, { emails }); } catch { g.meta.emails = emails; }
    return true;
  }
  const myGroupBalance = g => gBalances(g).get(memberKey(S.uid)) || 0;
  function groupTotals() {
    let owed = 0, owe = 0;
    for (const g of GROUPS.list.values()) {
      if (!g.joined) continue;
      const v = toMain(myGroupBalance(g), g.meta.currency);
      if (v > 0.005) owed += v; else if (v < -0.005) owe -= v;
    }
    return { owed, owe };
  }

  function owedTotals() {
    const bal = loanBalances();
    let { owed, owe } = groupTotals();
    for (const p of rows("people")) { const v = netMine(p, toMain(bal.get(p.id) || 0, p.currency)); if (v > 0) owed += v; else owe -= v; }
    return { owed, owe };
  }

  function remindText(p, v) {
    const due = dueOf(p);
    return `Hi ${p.name}, hope you're well! Just a friendly reminder about the ${fmt(v, p.currency, { show: true })}${due ? ` (due ${dayLabel(due)})` : ""}. No rush, thanks! 🙏`;
  }

  function loansCard() {
    const bal = loanBalances();
    const people = rows("people").map(p => ({ p, v: bal.get(p.id) || 0 })).filter(x => Math.abs(x.v) > 0.004);
    const groups = [...GROUPS.list.values()].filter(g => g.joined).map(g => ({ g, v: myGroupBalance(g) })).filter(x => Math.abs(x.v) > 0.005);
    if (!people.length && !groups.length) return null;
    const t = owedTotals();
    const lastDate = p => rows("loan_entries").filter(e => e.person_id === p.id).map(e => e.occurred_on).sort().pop();
    const items = [
      ...people.map(({ p, v }) => ({ w: Math.abs(toMain(v, p.currency)), el: (() => {
        const mine = theyOwe(p, v), due = mine ? dueInfo(p) : null;
        const since = lastDate(p);
        return h("div", { class: "loan-row" },
          h("button", { type: "button", class: "loan-hit", "aria-label": p.name, on: { click: () => personSheet(p) } }),
          h("span", { class: "dot", style: { background: COLORS[(p.sort || 0) % COLORS.length] } }, p.name.charAt(0).toUpperCase()),
          h("span", { class: "row-main" }, h("span", { class: "row-title" }, p.name),
            h("span", { class: "row-sub" + (due && due.late ? " late" : "") }, document.createTextNode([tr(mine ? "Owes you" : "You owe"), due ? tr(due.text) : since ? `${tr("since")} ${LANG === "en" ? dayLabel(since).toLowerCase() : dayLabel(since)}` : null].filter(Boolean).join(" · ")))),
          h("span", { class: "row-end " + (mine ? "pos" : "neg") }, fmt(Math.abs(v), p.currency, { whole: true })),
          mine ? h("a", { class: "chip remind-chip", href: p.phone ? waUrl(p.phone, remindText(p, v)) : `https://wa.me/?text=${encodeURIComponent(remindText(p, v))}`, target: "_blank", rel: "noopener noreferrer", on: { click: () => track("whatsapp", "remind") } }, "Remind") : null);
      })() })),
      ...groups.map(({ g, v }) => ({ w: Math.abs(toMain(v, g.meta.currency)), el: h("div", { class: "loan-row" },
        h("button", { type: "button", class: "loan-hit", "aria-label": g.meta.name, on: { click: () => groupSheet(g.id) } }),
        h("span", { class: "dot neutral" }, icon("people", "ico sm")),
        h("span", { class: "row-main" }, h("span", { class: "row-title" }, g.meta.name), h("span", { class: "row-sub" }, v > 0 ? "Group · you're owed" : "Group · you owe")),
        h("span", { class: "row-end " + (v > 0 ? "pos" : "neg") }, fmt(Math.abs(v), g.meta.currency, { whole: true }))) }))
    ].sort((a, b) => b.w - a.w).slice(0, 4);
    return h("section", { class: "card flush loans-card" },
      h("div", { class: "card-head" }, h("h2", null, "Money with others"), h("button", { type: "button", class: "link-btn", on: { click: () => go("people") } }, "See all")),
      h("div", { class: "loans-sum" },
        h("div", { class: "pos" }, h("small", null, "Owed to you"), h("strong", { class: "num" }, money(t.owed, { whole: true }))),
        h("div", { class: t.owe > 0.5 ? "neg" : "" }, h("small", null, "You owe"), h("strong", { class: "num" }, money(t.owe, { whole: true })))),
      ...items.map(x => x.el));
  }

  function splitChooser() {
    const opt = (ic, title, sub, fn) => h("button", { type: "button", class: "split-opt", on: { click: () => { closeSheet(); setTimeout(fn, 330); } } },
      h("span", { class: "split-opt-ico" }, icon(ic)), h("span", { class: "row-main" }, h("span", { class: "row-title" }, title), h("span", { class: "row-sub wrap" }, sub)), icon("chev", "ico sm"));
    openSheet("Split", h("div", { class: "form" },
      opt("people", "Split a bill or a trip", "Rent, dinner, a trip… Add everyone, then each expense is split and the app tells who owes whom.", () => { go("people"); newGroupSheet(); }),
      opt("up", "Money with a person", "Money you gave someone or got from someone. See who owes who at a glance.", () => { go("people"); personSheet(null); }),
      h("button", { type: "button", class: "btn alt", on: { click: () => { closeSheet(); go("people"); } } }, "Open Split")));
  }

  function splitIntro(big) {
    const step = (n, title, sub) => h("div", { class: "split-step" }, h("span", { class: "split-num" }, n), h("span", null, h("strong", null, title), h("small", null, sub)));
    return h("section", { class: "split-hero" + (big ? "" : " slim") },
      h("div", { class: "split-hero-top" },
        h("span", { class: "split-badge" }, icon("people", "ico sm")),
        h("div", null, h("h2", null, big ? "Split bills. Track loans." : "Split or lend"), big ? h("p", null, "Share costs with friends, family or roommates, and never forget who owes what.") : null)),
      big ? h("div", { class: "split-steps" },
        step("1", "Create a group", "Like “Trip to Faraya” or “House”."),
        step("2", "Add what was paid", "Pick who paid and who shares it."),
        step("3", "See who owes whom", "Settle up with one payment each.")) : null,
      h("div", { class: "split-ctas" },
        h("button", { type: "button", class: "btn", on: { click: newGroupSheet } }, icon("people", "ico sm"), "Split a bill"),
        h("button", { type: "button", class: "btn alt", on: { click: () => personSheet(null) } }, icon("up", "ico sm"), "Money with a person")));
  }

  function groupsCard() {
    const list = [...GROUPS.list.values()];
    const card = h("section", { class: "card flush groups-card" }, h("div", { class: "card-head" }, h("h2", null, "Shared groups"), h("button", { type: "button", class: "link-btn", on: { click: newGroupSheet } }, "New")));
    for (const g of list.filter(x => !x.joined)) {
      const by = g.members.find(m => m.user_id === g.invited_by);
      card.append(h("div", { class: "row invite-row" }, h("span", { class: "dot gold" }, icon("people", "ico sm")),
        h("span", { class: "row-main" }, h("span", { class: "row-title" }, g.meta.name), h("span", { class: "row-sub wrap" }, `${by && by.name !== "Member" ? by.name : "Someone"} invited you`)),
        h("span", { class: "inv-btns" },
          h("button", { type: "button", class: "chip", on: { click: () => answerGroup(g, false) } }, "Decline"),
          h("button", { type: "button", class: "chip on", on: { click: () => answerGroup(g, true) } }, "Accept"))));
    }
    for (const g of list.filter(x => x.joined)) {
      const v = myGroupBalance(g);
      const pend = g.entries.filter(e => e.votes.length && !e.votes.includes(S.uid)).length;
      card.append(h("button", { type: "button", class: "row", on: { click: () => groupSheet(g.id) } },
        h("span", { class: "dot neutral" }, icon("people", "ico sm")),
        h("span", { class: "row-main" }, h("span", { class: "row-title" }, g.meta.name), h("span", { class: "row-sub" }, [`${gParties(g).length} people`, pend ? `${pend} to approve` : null].filter(Boolean).join(" · "))),
        h("span", { class: "row-end" + (v > 0.005 ? " pos" : v < -0.005 ? " neg" : "") }, Math.abs(v) < 0.005 ? tr("Settled") : (v > 0 ? "+" : "−") + fmt(Math.abs(v), g.meta.currency))));
    }
    if (!list.length) card.append(h("p", { class: "empty" }, "Share loans and expenses with other people. Everyone sees the same history and who owes whom."));
    return card;
  }

  async function answerGroup(g, yes) {
    const { error } = await sb.rpc("answer_group", { p_group: g.id, p_accept: yes });
    if (error) return toast("Couldn't answer. Try again.", "error");
    if (yes) { await setGroupProfile(g.id); groupPing(g.id); toast(`You joined ${g.meta.name}.`); }
    else toast("Invite declined.");
    await loadGroups(true);
    if (yes) groupSheet(g.id);
  }

  function newGroupSheet() {
    const f = { name: "", currency: mainCur(), me: settings().name || "" };
    const err = h("p", { class: "form-err", role: "alert" });
    const body = h("form", { class: "form", id: "group-form", novalidate: true },
      h("label", { class: "field" }, h("span", null, "Group name"), h("input", { id: "g-gname", class: "input", maxlength: "40", autocomplete: "off", placeholder: "e.g. Trip to Faraya, House, Loan to Roudy", on: { input: e => { f.name = e.target.value; } } })),
      h("div", { class: "field" }, h("span", { class: "label" }, "Currency"), curSelect("g-gcur", f.currency, k => { f.currency = k; })),
      h("label", { class: "field" }, h("span", null, "Your name in the group"), h("input", { id: "g-gme", class: "input", maxlength: "40", autocomplete: "off", value: f.me, on: { input: e => { f.me = e.target.value; } } })),
      err);
    const btn = h("button", { type: "submit", class: "btn", form: "group-form" }, "Create group");
    body.addEventListener("submit", async ev => {
      ev.preventDefault();
      const name = f.name.trim(), me = f.me.trim();
      if (!name) return fail(err, "Give the group a name.", document.getElementById("g-gname"));
      if (!me) return fail(err, "Write your name so others know it's you.", document.getElementById("g-gme"));
      if (!navigator.onLine) return fail(err, "Connect to the internet to create a group.");
      btn.disabled = true;
      try {
        const k = await myKeys();
        const raw = rand(32);
        const key = await aesKey(raw);
        const id = crypto.randomUUID();
        const enc = await sealWith(key, { name, currency: f.currency, guests: [] });
        const { error } = await sb.rpc("create_group", { p_id: id, p_enc: enc, p_sealed: await sealTo(k.pub, raw) });
        if (error) throw error;
        await publishKey();
        GROUPS.keys.set(id, raw);
        await setGroupProfile(id, me);
        if (!settings().name) saveSettings({ name: me });
        track("add", "group");
        closeSheet();
        await loadGroups(true);
        setTimeout(() => groupSheet(id), 300);
      } catch { btn.disabled = false; fail(err, "Couldn't create the group. Try again."); }
    });
    openSheet("New shared group", body, btn);
  }

  function groupSheet(id) {
    const body = h("div", { class: "form" });
    let armed = null;
    let shown = false;
    const draw = () => {
      if (shown && !body.isConnected) { if (GROUPS.open === draw) GROUPS.open = null; return; }
      const g = GROUPS.list.get(id);
      if (!g) { if (shown) closeSheet(); return; }
      const cur = g.meta.currency;
      const bal = gBalances(g);
      const mine = bal.get(memberKey(S.uid)) || 0;
      const kids = [];
      kids.push(h("div", { class: "hero person-hero" + (Math.abs(mine) < 0.005 ? " settled" : mine > 0 ? "" : " owe") },
        h("p", { class: "hero-label" }, Math.abs(mine) < 0.005 ? "You're settled" : mine > 0 ? "You're owed" : "You owe"),
        h("p", { class: "hero-total num" }, fmt(Math.abs(mine), cur, { show: true })),
        h("p", { class: "hero-sub" }, `${gParties(g).length} people · ${g.entries.length} ${g.entries.length === 1 ? "entry" : "entries"}`)));
      kids.push(h("div", { class: "actions three" },
        h("button", { type: "button", class: "action", on: { click: () => groupEntrySheet(g.id, "expense") } }, h("span", { class: "action-ico" }, icon("cart")), "Expense"),
        h("button", { type: "button", class: "action", on: { click: () => groupEntrySheet(g.id, "loan") } }, h("span", { class: "action-ico" }, icon("up")), "Loan"),
        h("button", { type: "button", class: "action", on: { click: () => groupEntrySheet(g.id, "payment") } }, h("span", { class: "action-ico" }, icon("swap")), "Payment")));
      const partAt = kids.length;
      if (g.entries.some(e => e.kind === "expense")) {
        const paid = new Map(), share = new Map();
        for (const e of g.entries) {
          if (e.kind !== "expense") continue;
          const payer = canon(g, e.payer);
          paid.set(payer, (paid.get(payer) || 0) + e.amount);
          for (const [k0, v] of Object.entries(e.shares)) { const k = canon(g, k0); share.set(k, (share.get(k) || 0) + (Number(v) || 0)); }
        }
        const total = [...paid.values()].reduce((t, v) => t + v, 0);
        const tot = h("section", { class: "card flush" }, h("div", { class: "card-head" }, h("h2", null, "Totals"), h("span", { class: "card-sub num" }, `${tr("Spent together")}: ${fmt(total, cur, { show: true })}`)));
        for (const p of gParties(g)) {
          const v = bal.get(p.id) || 0;
          tot.append(h("div", { class: "row" + (p.me ? " me" : "") },
            h("span", { class: "dot neutral" }, p.name.charAt(0).toUpperCase()),
            h("span", { class: "row-main" }, h("span", { class: "row-title" }, p.me ? tr("You") : p.name), h("span", { class: "row-sub" }, `${tr("Paid")} ${fmt(paid.get(p.id) || 0, cur)} · ${tr("Share")} ${fmt(share.get(p.id) || 0, cur)}`)),
            h("span", { class: "row-end num" + (v > 0.005 ? " pos" : v < -0.005 ? " neg" : "") }, Math.abs(v) < 0.005 ? tr("Even") : (v > 0 ? `${tr("Gets")} ` : `${tr("Owes")} `) + fmt(Math.abs(v), cur))));
        }
        kids.push(tot);
      }
      const settle = gSettle(g);
      const meKey = memberKey(S.uid);
      const plainName = k => { const p = gParties(g).find(x => x.id === k); return p ? p.name : gName(g, k); };
      const shareSettle = async () => {
        const lines = settle.map(x => `• ${plainName(x.from)} → ${plainName(x.to)}: ${fmt(x.amount, cur, { show: true })}`);
        const text = `${g.meta.name}\n${tr("Who pays whom")}:\n${lines.join("\n")}`;
        try { if (navigator.share) { await navigator.share({ text }); return; } } catch (e) { if (e && e.name === "AbortError") return; }
        try { await navigator.clipboard.writeText(text); toast("Copied. Paste it in your group chat."); } catch { toast("Couldn't share. Try again.", "error"); }
      };
      const mineTo = settle.filter(x => x.from === meKey), mineFrom = settle.filter(x => x.to === meKey);
      if (mineTo.length || mineFrom.length) kids.splice(partAt, 0, h("section", { class: "my-part" },
        h("h2", null, "Your part"),
        ...mineTo.map(x => h("div", { class: "my-line neg" }, h("span", null, `${tr("You pay")} ${plainName(x.to)}`), h("strong", { class: "num" }, fmt(x.amount, cur, { show: true })))),
        ...mineFrom.map(x => h("div", { class: "my-line pos" }, h("span", null, `${plainName(x.from)} ${tr("pays you")}`), h("strong", { class: "num" }, fmt(x.amount, cur, { show: true })))),
        mineTo.length ? h("button", { type: "button", class: "btn sm", on: { click: () => groupEntrySheet(g.id, "payment") } }, "I paid") : null));
      const who = h("section", { class: "card flush" }, h("div", { class: "card-head" }, h("h2", null, "Who pays whom"), settle.length ? h("button", { type: "button", class: "link-btn", on: { click: shareSettle } }, "Share") : null));
      for (const s of settle) who.append(h("div", { class: "row" + (s.from === meKey || s.to === meKey ? " me" : "") },
        h("span", { class: "row-main" }, h("span", { class: "row-title" }, s.from === meKey ? `${tr("You pay")} ${plainName(s.to)}` : s.to === meKey ? `${plainName(s.from)} ${tr("pays you")}` : `${plainName(s.from)} ${tr("pays")} ${plainName(s.to)}`)),
        h("span", { class: "row-end num" + (s.from === meKey ? " neg" : s.to === meKey ? " pos" : "") }, fmt(s.amount, cur))));
      if (settle.length) who.append(h("p", { class: "hint group-note" }, "Everyone in the group sees this list in their app. Tap Share to send it to people who don't use BudgetSplit."));
      if (!settle.length) who.append(h("p", { class: "empty" }, "Everyone is settled."));
      kids.push(who);
      const pending = g.entries.filter(e => e.votes.length);
      if (pending.length) {
        const pc = h("section", { class: "card flush" }, h("div", { class: "card-head" }, h("h2", null, "Waiting for approval")));
        const need = g.members.filter(m => m.joined).length;
        for (const e of pending) pc.append(h("button", { type: "button", class: "row", on: { click: () => groupEntryInfo(g.id, e.id) } },
          h("span", { class: "dot gold" }, icon("trash", "ico sm")),
          h("span", { class: "row-main" }, h("span", { class: "row-title" }, e.note || kindLabel(e.kind)), h("span", { class: "row-sub" }, `Delete · ${e.votes.length} of ${need} agreed${e.votes.includes(S.uid) ? "" : " · tap to answer"}`)),
          h("span", { class: "row-end num" }, fmt(e.amount, cur))));
        kids.push(pc);
      }
      const hist = h("section", { class: "card flush" }, h("div", { class: "card-head" }, h("h2", null, `History (${g.entries.length})`)));
      for (const e of g.entries) {
        const n = Object.keys(e.shares).length;
        const sub = e.kind === "payment" ? `${gName(g, e.payer)} paid ${gName(g, Object.keys(e.shares)[0] || "")}` : e.kind === "loan" ? `${gName(g, e.payer)} lent · ${n} ${n === 1 ? "person" : "people"}` : `${gName(g, e.payer)} paid · split ${n} ${n === 1 ? "way" : "ways"}`;
        hist.append(h("button", { type: "button", class: "row" + (e.votes.length ? " pending" : ""), on: { click: () => groupEntryInfo(g.id, e.id) } },
          h("span", { class: "dot neutral" }, icon(e.kind === "payment" ? "swap" : e.kind === "loan" ? "up" : "cart", "ico sm")),
          h("span", { class: "row-main" }, h("span", { class: "row-title" }, e.note || kindLabel(e.kind)), h("span", { class: "row-sub" }, `${rowDate(e.date)} · ${sub}`)),
          h("span", { class: "row-end num" }, fmt(e.amount, cur))));
      }
      if (!g.entries.length) hist.append(h("p", { class: "empty" }, "No entries yet. Add an expense, a loan or a payment."));
      kids.push(hist);
      const mem = h("section", { class: "card flush" }, h("div", { class: "card-head" }, h("h2", null, "People"), h("button", { type: "button", class: "link-btn", on: { click: () => groupInviteSheet(g.id) } }, "Add")));
      for (const p of gParties(g)) {
        const v = bal.get(p.id) || 0;
        mem.append(h(p.guest ? "button" : "div", { class: "row", type: p.guest ? "button" : null, on: p.guest ? { click: () => guestSheet(g.id, p.id.slice(2)) } : null }, h("span", { class: "dot neutral" }, p.name.charAt(0).toUpperCase()),
          h("span", { class: "row-main" }, h("span", { class: "row-title" }, p.name), h("span", { class: "row-sub" }, p.me ? "You" : inviteEmail(g, p.id) ? (p.guest ? `Invited · ${inviteEmail(g, p.id)}` : inviteEmail(g, p.id)) : p.guest ? "Name only, no app" : "Uses BudgetSplit")),
          h("span", { class: "row-end num" + (v > 0.005 ? " pos" : v < -0.005 ? " neg" : "") }, Math.abs(v) < 0.005 ? "0" : (v > 0 ? "+" : "−") + fmt(Math.abs(v), cur))));
      }
      for (const m of g.members.filter(x => !x.joined)) mem.append(h("div", { class: "row pending" }, h("span", { class: "dot neutral" }, "?"), h("span", { class: "row-main" }, h("span", { class: "row-title" }, inviteEmail(g, m.id) || "Invited"), h("span", { class: "row-sub" }, "Has the app · hasn't answered yet"))));
      for (const [k, addr] of Object.entries(g.meta.emails || {})) if (k.startsWith("e:")) mem.append(h("div", { class: "row pending" }, h("span", { class: "dot neutral" }, "@"), h("span", { class: "row-main" }, h("span", { class: "row-title" }, addr), h("span", { class: "row-sub" }, "Invited by email · waiting for them to sign up"))));
      kids.push(mem);
      const parties = gParties(g);
      if (g.created_by === S.uid && parties.length === 2 && g.members.length <= 2) {
        const other = parties.find(p => !p.me);
        kids.push(h("button", { type: "button", class: "btn alt" + (armed === "toloan" ? " sure" : ""), on: { click: () => {
          if (armed !== "toloan") { armed = "toloan"; draw(); return; }
          armed = null;
          groupToLoan(g);
        } } }, armed === "toloan" ? `Tap again to turn it into a loan with ${other.name}` : "Turn back into a loan"),
          armed === "toloan" ? h("p", { class: "hint" }, other.guest ? `${other.name} goes back to Your loans with the same history and balance.` : `${other.name} goes back to Your loans with the same history and balance, and stops seeing this group in their app.`) : null);
        if (kids[kids.length - 1] === null) kids.pop();
      }
      const alone = g.members.filter(m => m.joined).length === 1;
      kids.push(h("button", { type: "button", class: "btn danger" + (armed === "leave" ? " sure" : ""), on: { click: async () => {
        if (armed !== "leave") { armed = "leave"; draw(); return; }
        if (!alone && Math.abs(mine) > 0.005) { armed = null; draw(); return toast("Settle your balance before leaving the group.", "error"); }
        const { error } = await sb.rpc("leave_group", { p_group: g.id });
        if (error) return toast("Couldn't do that. Try again.", "error");
        if (alone) {
          const map = store.get("gxGroup", {}) || {};
          const ids = new Set(g.entries.map(e => e.id));
          const gone = rows("transactions").filter(x => { const m = String(x.id).match(/^gx-(ge-[A-Za-z0-9_-]+?)(-o)?$/); return m && (ids.has(m[1]) || map[x.id] === g.id); }).map(x => ({ t: "transactions", r: { ...x, deleted_at: new Date().toISOString() } }));
          if (gone.length) putMany(gone);
        }
        GROUPS.list.delete(g.id); GROUPS.keys.delete(g.id); cacheGroups(); closeSheet(); toast(alone ? `${g.meta.name} was deleted.` : `You left ${g.meta.name}.`); scheduleRender();
      } } }, armed === "leave" ? (alone ? "Tap again to delete the group and its entries" : "Tap again to leave the group") : (alone ? "Delete group" : "Leave group")));
      keepFocus(() => body.replaceChildren(...kids));
    };
    GROUPS.open = draw;
    draw();
    openSheet((GROUPS.list.get(id) || { meta: { name: "Group" } }).meta.name, body);
    shown = true;
    loadGroups(true);
    const g0 = GROUPS.list.get(id);
    if (g0) fillInviteEmails(g0).then(ch => { if (ch && body.isConnected) draw(); }, () => { });
  }
  const kindLabel = k => k === "payment" ? "Payment" : k === "loan" ? "Loan" : "Expense";

  function groupEntrySheet(id, kind) {
    const g = GROUPS.list.get(id);
    if (!g) return;
    const parties = gParties(g);
    const me = memberKey(S.uid);
    const f = { kind, amount: "", payer: me, split: new Set(kind === "loan" ? parties.filter(p => p.id !== me).map(p => p.id) : parties.map(p => p.id)), to: (parties.find(p => p.id !== me) || {}).id || "", note: "", date: today(), account: groupAccount(g), category: groupCategory() };
    const err = h("p", { class: "form-err", role: "alert" });
    const body = h("form", { class: "form", id: "gentry-form", novalidate: true });
    const draw = () => {
      const v = parseAmt(f.amount);
      const list = [...f.split];
      const each = list.length && v ? v / list.length : 0;
      const kids = [
        h("div", { class: "seg", role: "group" }, [["expense", "Expense"], ["loan", "Loan"], ["payment", "Payment"]].map(([k, l]) => h("button", { type: "button", "aria-pressed": String(f.kind === k), on: { click: () => { f.kind = k; if (k === "loan") f.split = new Set(parties.filter(p => p.id !== f.payer).map(p => p.id)); if (k === "expense") f.split = new Set(parties.map(p => p.id)); draw(); } } }, l))),
        h("label", { class: "field" }, h("span", null, `Amount (${curSymbol(g.meta.currency)})`), h("input", { id: "ge-amt", class: "input num big-amt", inputmode: "decimal", autocomplete: "off", placeholder: "0", value: f.amount, on: { input: e => { f.amount = e.target.value; const p = body.querySelector(".split-each"); if (p) p.textContent = tr(splitText()); } } })),
        h("label", { class: "field" }, h("span", null, f.kind === "payment" ? "Who paid" : f.kind === "loan" ? "Who lent the money" : "Who paid"),
          h("select", { id: "ge-payer", class: "input", on: { change: e => { f.payer = e.target.value; if (f.kind === "loan") f.split.delete(f.payer); if (f.to === f.payer) f.to = (parties.find(p => p.id !== f.payer) || {}).id || ""; draw(); } } }, parties.map(p => h("option", { value: p.id, selected: p.id === f.payer }, p.name))))
      ];
      if (f.kind === "payment") {
        kids.push(h("label", { class: "field" }, h("span", null, "Paid to"), h("select", { id: "ge-to", class: "input", on: { change: e => { f.to = e.target.value; } } }, parties.filter(p => p.id !== f.payer).map(p => h("option", { value: p.id, selected: p.id === f.to }, p.name)))));
      } else {
        kids.push(h("div", { class: "field" }, h("span", null, f.kind === "loan" ? "Lent to" : "Split between"),
          h("div", { class: "chips wrap" }, parties.filter(p => f.kind !== "loan" || p.id !== f.payer).map(p => h("button", { type: "button", class: "chip" + (f.split.has(p.id) ? " on" : ""), "aria-pressed": String(f.split.has(p.id)), on: { click: () => { if (f.split.has(p.id)) f.split.delete(p.id); else f.split.add(p.id); draw(); } } }, p.name))),
          h("small", { class: "hint split-each" }, splitText())));
      }
      const flow = f.kind === "payment" ? (f.payer === me ? "out" : f.to === me ? "in" : null) : f.payer === me ? "out" : f.kind === "loan" && f.split.has(me) ? "in" : null;
      if (flow) kids.push(accountPicker(f, flow, f.kind === "expense" && f.payer === me && f.split.has(me)));
      kids.push(
        h("label", { class: "note-line" + (!f.note.trim() ? " need" : "") }, h("span", { class: "ftile-ico" }, icon("note", "ico sm")), h("input", { id: "ge-note", class: "note-input", maxlength: "200", autocomplete: "off", placeholder: f.kind === "payment" ? "Note (optional)" : "What was it for?", value: f.note, on: { input: e => { f.note = e.target.value; e.target.parentNode.classList.toggle("need", f.kind !== "payment" && !f.note.trim()); } } })),
        h("label", { class: "field" }, h("span", null, "Date"), h("input", { id: "ge-date", class: "input", type: "date", value: f.date, on: { input: e => { f.date = e.target.value; } } })),
        err);
      keepFocus(() => body.replaceChildren(...kids));
      function splitText() { const n = f.split.size, a = parseAmt(f.amount); return n ? (a ? `${fmt(a / n, g.meta.currency, { show: true })} each · ${n} ${n === 1 ? "person" : "people"}` : `${n} ${n === 1 ? "person" : "people"}`) : "Pick at least one person"; }
      void each;
    };
    draw();
    const btn = h("button", { type: "submit", class: "btn", form: "gentry-form" }, "Save");
    body.addEventListener("submit", async ev => {
      ev.preventDefault();
      const amount = roundCur(parseAmt(f.amount), g.meta.currency);
      if (!amount || amount <= 0) return fail(err, "Enter an amount.", document.getElementById("ge-amt"));
      if (f.kind !== "payment" && !f.note.trim()) return fail(err, "Write a short note so everyone knows what it was.", document.getElementById("ge-note"));
      if (!DATE_RE.test(f.date)) return fail(err, "Pick a date.");
      let shares = {};
      if (f.kind === "payment") { if (!f.to || f.to === f.payer) return fail(err, "Pick who received the money."); shares[f.to] = amount; }
      else {
        const list = [...f.split];
        if (!list.length) return fail(err, "Pick at least one person.");
        const dec = curDec(g.meta.currency), unit = Math.pow(10, -dec);
        const base = Math.floor(amount / list.length / unit) * unit;
        list.forEach((k, i) => { shares[k] = Number((base + (i === 0 ? amount - base * list.length : 0)).toFixed(dec)); });
      }
      if (!navigator.onLine) return fail(err, "Connect to the internet to add to a shared group.");
      btn.disabled = true;
      try {
        const key = await groupKey(g.id);
        const entryId = "ge-" + gid8();
        const enc = await sealWith(key, { kind: f.kind, payer: f.payer, amount, shares, note: f.note.trim().slice(0, 200), date: f.date });
        const { error } = await sb.from("group_entries").insert({ id: entryId, group_id: g.id, enc });
        if (error) throw error;
        if (f.account) recordGroupMoney(g, { id: entryId, kind: f.kind, payer: f.payer, amount, shares, note: f.note.trim().slice(0, 200), date: f.date }, f.account, f.category);
        track("add", "group_" + f.kind);
        groupPing(g.id);
        closeSheet();
        toast("Saved. Everyone in the group can see it.");
        await loadGroups(true);
        setTimeout(() => groupSheet(g.id), 300);
      } catch { btn.disabled = false; fail(err, "Couldn't save. Check your connection and try again."); }
    });
    openSheet(`${g.meta.name}`, body, btn, { stack: true });
  }

  function groupEntryInfo(id, entryId) {
    const g = GROUPS.list.get(id);
    const e = g && g.entries.find(x => x.id === entryId);
    if (!e) return;
    const cur = g.meta.currency;
    const need = g.members.filter(m => m.joined).length;
    const voted = e.votes.includes(S.uid);
    const lines = Object.entries(e.shares).map(([k, v]) => h("div", { class: "row" }, h("span", { class: "row-main" }, h("span", { class: "row-title" }, gName(g, k))), h("span", { class: "row-end num" }, fmt(Number(v), cur))));
    const author = g.members.find(m => m.user_id === e.author);
    const body = h("div", { class: "form" },
      h("div", { class: "hero person-hero settled" }, h("p", { class: "hero-label" }, kindLabel(e.kind)), h("p", { class: "hero-total num" }, fmt(e.amount, cur, { show: true })), h("p", { class: "hero-sub" }, `${e.kind === "loan" ? "Lent by" : "Paid by"} ${gName(g, e.payer)} · ${dayLabel(e.date)}`)),
      e.note ? h("p", { class: "hint" }, e.note) : null,
      h("section", { class: "card flush" }, h("div", { class: "card-head" }, h("h2", null, e.kind === "payment" ? "Received by" : e.kind === "loan" ? "Lent to" : "Shares")), ...lines),
      h("p", { class: "hint" }, `Added by ${author ? (author.user_id === S.uid ? "you" : author.name) : "a former member"}.`),
      e.votes.length ? h("p", { class: "hint" }, `${e.votes.length} of ${need} agreed to delete it. It's removed when everyone agrees.`) : h("p", { class: "hint" }, "Removing an entry needs everyone in the group to agree."));
    const act = async (fn, msg) => {
      const { data, error } = await sb.rpc(fn, { p_entry: e.id });
      if (error) return toast("Couldn't do that. Try again.", "error");
      groupPing(g.id);
      closeSheet();
      toast(data && data.deleted ? "Everyone agreed. The entry was removed." : msg);
      await loadGroups(true);
    };
    const mv = myMoney(g, e);
    if (mv && !S.data.transactions.has("gx-" + e.id)) body.append(h("button", { type: "button", class: "btn alt", on: { click: () => recordLaterSheet(g.id, e.id) } }, icon("bank", "ico sm"), mv.dir === "out" ? "Record it in my accounts" : "Record the money I received"));
    else if (S.data.transactions.has("gx-" + e.id)) body.append(h("p", { class: "hint" }, icon("check", "ico sm"), " Recorded in your accounts."));
    const btn = voted
      ? h("button", { type: "button", class: "btn alt", on: { click: () => act("unvote_delete", "Your delete request was withdrawn.") } }, "Keep it, withdraw my request")
      : h("button", { type: "button", class: "btn danger", on: { click: () => act("vote_delete", e.votes.length ? "You agreed to delete it." : "Delete requested. Everyone else needs to agree.") } }, need === 1 ? "Delete" : e.votes.length ? "Agree to delete" : "Ask to delete");
    openSheet(e.note || kindLabel(e.kind), body, btn, { stack: true });
  }

  function groupAccount(g) {
    const list = rows("accounts").filter(a => !a.archived).sort(bySort);
    const saved = store.get("groupAcc:" + g.id, null);
    if (saved && list.some(a => a.id === saved)) return saved;
    const same = list.find(a => a.currency === g.meta.currency && a.kind === "cash") || list.find(a => a.currency === g.meta.currency);
    return same ? same.id : null;
  }
  function groupCategory() {
    const cats = rows("categories").filter(c => c.kind === "expense");
    const used = new Map();
    for (const x of rows("transactions")) if (x.category_id && x.kind === "expense") used.set(x.category_id, (used.get(x.category_id) || 0) + 1);
    cats.sort((a, b) => (used.get(b.id) || 0) - (used.get(a.id) || 0) || bySort(a, b));
    return cats[0] ? cats[0].id : null;
  }
  function accountPicker(f, flow, needCat) {
    const accounts = rows("accounts").filter(a => !a.archived).sort(bySort);
    const wrap = h("div", { class: "field money-pick" },
      h("span", null, flow === "out" ? "Take the money from" : "Put the money into"),
      h("div", { class: "chips wrap" },
        accounts.map(a => h("button", { type: "button", class: "chip" + (f.account === a.id ? " on" : ""), "aria-pressed": String(f.account === a.id), on: { click: () => { f.account = a.id; wrap.replaceWith(accountPicker(f, flow, needCat)); } } }, h("span", { class: "chip-cur" }, curTag(a.currency)), a.name)),
        h("button", { type: "button", class: "chip" + (!f.account ? " on" : ""), "aria-pressed": String(!f.account), on: { click: () => { f.account = null; wrap.replaceWith(accountPicker(f, flow, needCat)); } } }, "Don't record")),
      needCat && f.account ? h("label", { class: "field" }, h("span", null, "Your share counts as"),
        h("select", { id: "ge-cat", class: "input", on: { change: e => { f.category = e.target.value; } } }, rows("categories").filter(c => c.kind === "expense").sort(bySort).map(c => h("option", { value: c.id, selected: c.id === f.category }, c.name)))) : null,
      h("small", { class: "hint" }, f.account ? (flow === "out" ? "Your account goes down by what you paid. Only your share counts as spending." : "Your account goes up by what you received.") : "Nothing changes in your accounts."));
    return wrap;
  }
  function myMoney(g, e) {
    const mine = Object.entries(e.shares).filter(([k]) => isMe(g, k)).reduce((t, [, v]) => t + (Number(v) || 0), 0);
    if (isMe(g, e.payer)) return { dir: "out", amount: e.amount, share: e.kind === "expense" ? mine : 0 };
    if ((e.kind === "loan" || e.kind === "payment") && mine > 0) return { dir: "in", amount: mine, share: 0 };
    return null;
  }
  function recordGroupMoney(g, e, accId, catId) {
    const a = acc(accId);
    const mv = myMoney(g, e);
    if (!a || !mv) return;
    const now = new Date().toISOString();
    const conv = v => roundCur(convert(v, g.meta.currency, a.currency), a.currency);
    const note = [g.meta.name, e.note].filter(Boolean).join(" · ").slice(0, 200);
    const base = { currency: a.currency, rate: rateOf(a.currency), account_id: a.id, to_account_id: null, to_amount: null, occurred_on: e.date, rule_id: null, receipt: null, created_at: now, note };
    const items = [];
    if (mv.dir === "out" && mv.share > 0 && catId && cat(catId)) {
      items.push({ t: "transactions", r: { ...base, id: "gx-" + e.id, kind: "expense", amount: conv(mv.share), category_id: catId } });
      if (mv.amount - mv.share > 0.004) items.push({ t: "transactions", r: { ...base, id: "gx-" + e.id + "-o", kind: "loan_out", amount: conv(mv.amount - mv.share), category_id: null } });
    } else items.push({ t: "transactions", r: { ...base, id: "gx-" + e.id, kind: mv.dir === "out" ? "loan_out" : "loan_in", amount: conv(mv.amount), category_id: null } });
    putMany(items);
    store.set("groupAcc:" + g.id, a.id);
    const map = store.get("gxGroup", {});
    for (const it of items) map[it.r.id] = g.id;
    store.set("gxGroup", map);
  }
  function recordLaterSheet(id, entryId) {
    const g = GROUPS.list.get(id);
    const e = g && g.entries.find(x => x.id === entryId);
    const mv = e && myMoney(g, e);
    if (!mv) return;
    const f = { account: groupAccount(g), category: groupCategory() };
    const body = h("div", { class: "form" }, h("p", { class: "hint" }, `${e.note || kindLabel(e.kind)} · ${fmt(mv.amount, g.meta.currency, { show: true })}`), accountPicker(f, mv.dir, mv.share > 0));
    openSheet("Record in my accounts", body, h("button", { type: "button", class: "btn", on: { click: () => {
      if (!f.account) return toast("Pick an account.");
      recordGroupMoney(g, e, f.account, f.category);
      closeSheet();
      toast("Recorded in your accounts.");
    } } }, "Save"), { stack: true });
  }
  function groupOfTx(x) {
    const m = String(x.id).match(/^gx-(ge-[A-Za-z0-9_-]+?)(-o)?$/);
    if (!m) return null;
    for (const g of GROUPS.list.values()) { const e = g.entries.find(q => q.id === m[1]); if (e) return { g, e }; }
    const gid = (store.get("gxGroup", {}) || {})[x.id];
    const g = gid && GROUPS.list.get(gid);
    return g ? { g, e: null } : null;
  }
  function cleanGroupMoney() {
    const map = store.get("gxGroup", {}) || {};
    const gone = [];
    for (const x of rows("transactions")) {
      const m = String(x.id).match(/^gx-(ge-[A-Za-z0-9_-]+?)(-o)?$/);
      if (!m) continue;
      const g = GROUPS.list.get(map[x.id]);
      if (g && g.joined && !g.entries.some(e => e.id === m[1])) gone.push({ t: "transactions", r: { ...x, deleted_at: new Date().toISOString() } });
    }
    if (gone.length) { TRACK.mute = true; putMany(gone); TRACK.mute = false; toast("An entry was removed from a group, so your accounts were corrected."); }
  }

  function guestSheet(id, guestId) {
    const g = GROUPS.list.get(id);
    const guest = g && g.meta.guests.find(x => x.id === guestId);
    if (!guest) return;
    const used = g.entries.some(e => e.payer === "g:" + guestId || ("g:" + guestId) in e.shares);
    const members = g.members.filter(m => m.joined);
    const save = async meta => {
      const key = await groupKey(g.id);
      const { error } = await sb.rpc("update_group", { p_group: g.id, p_enc: await sealWith(key, meta) });
      if (error) return toast("Couldn't save. Try again.", "error");
      groupPing(g.id);
      closeSheet();
      await loadGroups(true);
      setTimeout(() => groupSheet(g.id), 300);
    };
    const fe = { email: "" };
    const gerr = h("p", { class: "form-err", role: "alert" });
    const body = h("div", { class: "form" },
      h("section", { class: "card" }, h("div", { class: "card-head" }, h("h2", null, `Invite ${guest.name} (optional)`)),
        h("p", { class: "hint" }, `Add ${guest.name}'s email to send a request. If they accept, they see this group and everything recorded for ${guest.name} counts for their account.`),
        h("input", { id: "gs-email", class: "input", type: "email", inputmode: "email", autocomplete: "off", autocapitalize: "none", placeholder: "name@example.com", on: { input: e => { fe.email = e.target.value; } } }),
        h("button", { type: "button", class: "btn", on: { click: async () => {
          const email = fe.email.trim().toLowerCase();
          if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return fail(gerr, "Enter a valid email.", document.getElementById("gs-email"));
          if (!navigator.onLine) return fail(gerr, "Connect to the internet to invite.");
          try {
            const r = await emailInvite(g, email, guestId);
            if (r.self || r.member) return fail(gerr, inviteMessage(r, email));
            closeSheet(); toast(inviteMessage(r, email)); loadGroups(true);
          } catch (x) { fail(gerr, x && x.code === "54000" ? "Too many invites today. Try again tomorrow." : "Couldn't send the invite. Try again."); }
        } } }, "Send request"), gerr),
      h("p", { class: "hint" }, `If ${guest.name} already joined the group with the app, link them here instead.`),
      h("section", { class: "card flush" }, h("div", { class: "card-head" }, h("h2", null, `${guest.name} is…`)),
        ...members.map(m => h("button", { type: "button", class: "row", on: { click: () => save({ ...g.meta, claims: { ...(g.meta.claims || {}), [guestId]: m.user_id } }).then(() => toast(`${guest.name} is now linked to ${m.user_id === S.uid ? "you" : m.name}.`)) } },
          h("span", { class: "dot neutral" }, (m.user_id === S.uid ? "Y" : m.name.charAt(0)).toUpperCase()),
          h("span", { class: "row-main" }, h("span", { class: "row-title" }, m.user_id === S.uid ? "Me" : m.name))))),
      used ? h("p", { class: "hint" }, `${guest.name} has entries, so they can't be removed. Link them to a member instead.`)
        : h("button", { type: "button", class: "btn danger", on: { click: () => save({ ...g.meta, guests: g.meta.guests.filter(x => x.id !== guestId) }).then(() => toast(`${guest.name} removed.`)) } }, `Remove ${guest.name}`));
    openSheet(guest.name, body, null, { stack: true });
  }

  async function groupToLoan(g) {
    if (!navigator.onLine) return toast("Connect to the internet first.", "error");
    const other = gParties(g).find(p => !p.me);
    if (!other) return;
    const bal = myGroupBalance(g);
    const direction = bal < 0 ? "i_owe" : "owes_me";
    const sign = direction === "owes_me" ? 1 : -1;
    const now = new Date().toISOString();
    const person = { id: newId(), name: other.name.slice(0, 40), direction, currency: g.meta.currency, phone: null, share_token: null, sort: Math.max(-1, ...rows("people").map(r => r.sort || 0)) + 1 };
    const items = [{ t: "people", r: person }];
    const map = store.get("gxGroup", {}) || {};
    for (const e of [...g.entries].reverse()) {
      const paid = isMe(g, e.payer) ? e.amount : 0;
      const owed = Object.entries(e.shares).filter(([k]) => isMe(g, k)).reduce((t, [, v]) => t + (Number(v) || 0), 0);
      const net = roundCur(paid - owed, g.meta.currency);
      if (!net) continue;
      const id = newId();
      items.push({ t: "loan_entries", r: { id, person_id: person.id, amount: net * sign, note: e.note || null, occurred_on: e.date, created_at: e.created_at || now } });
      for (const txId of ["gx-" + e.id + "-o", "gx-" + e.id]) {
        const tx = S.data.transactions.get(txId);
        if (!tx || (tx.kind !== "loan_out" && tx.kind !== "loan_in")) continue;
        items.push({ t: "transactions", r: { ...tx, id: "ln-" + id } }, { t: "transactions", r: { ...tx, deleted_at: now } });
        delete map[txId];
        break;
      }
    }
    try {
      const { error } = await sb.rpc("delete_group", { p_group: g.id });
      if (error) throw error;
    } catch { return toast("Couldn't turn it into a loan. Nothing was changed. Try again.", "error"); }
    TRACK.mute = true; putMany(items); TRACK.mute = false;
    store.set("gxGroup", map);
    GROUPS.list.delete(g.id); GROUPS.keys.delete(g.id); cacheGroups();
    track("add", "loan_from_group");
    closeSheet();
    go("people");
    setTimeout(() => personSheet(S.data.people.get(person.id)), 350);
    toast(`${g.meta.name} is a loan with ${person.name} again.`);
  }

  async function personToGroup(p, email) {
    if (!navigator.onLine) return toast("Connect to the internet first.", "error");
    const history = rows("loan_entries").filter(e => e.person_id === p.id).sort((a, b) => a.occurred_on.localeCompare(b.occurred_on) || String(a.created_at || "").localeCompare(String(b.created_at || "")));
    if (history.length > 100) return toast("This person has too many entries to move at once.", "error");
    try {
      const k = await myKeys();
      await publishKey();
      const raw = rand(32);
      const key = await aesKey(raw);
      const id = crypto.randomUUID();
      const guestId = gid8().slice(0, 12);
      const meta = { name: p.name.slice(0, 40), currency: p.currency, guests: [{ id: guestId, name: p.name.slice(0, 40) }], claims: {} };
      const r = await sb.rpc("create_group", { p_id: id, p_enc: await sealWith(key, meta), p_sealed: await sealTo(k.pub, raw) });
      if (r.error) throw r.error;
      GROUPS.keys.set(id, raw);
      await setGroupProfile(id);
      const me = memberKey(S.uid), them = "g:" + guestId;
      const items = [];
      const map = store.get("gxGroup", {}) || {};
      for (const le of history) {
        const v = Number(le.amount);
        if (!v) continue;
        const amt = Math.abs(v);
        const lend = owesMe(p) ? v > 0 : v < 0;
        const kind = v > 0 ? "loan" : "payment";
        const payer = lend ? me : them;
        const to = lend ? them : me;
        const entryId = "ge-" + gid8();
        const { error } = await sb.from("group_entries").insert({ id: entryId, group_id: id, enc: await sealWith(key, { kind, payer, amount: amt, shares: { [to]: amt }, note: le.note || "", date: le.occurred_on }) });
        if (error) throw error;
        const tx = S.data.transactions.get("ln-" + le.id);
        if (tx) { items.push({ t: "transactions", r: { ...tx, id: "gx-" + entryId } }, { t: "transactions", r: { ...tx, deleted_at: new Date().toISOString() } }); map["gx-" + entryId] = id; }
        items.push({ t: "loan_entries", r: { ...le, deleted_at: new Date().toISOString() } });
      }
      store.set("gxGroup", map);
      items.push({ t: "people", r: { ...p, share_token: null, deleted_at: new Date().toISOString() } });
      TRACK.mute = true; putMany(items); TRACK.mute = false;
      track("add", "group_from_person");
      closeSheet();
      await loadGroups(true);
      let msg = `${p.name}'s loan is now a shared group. Add more people or invite ${p.name} by email.`;
      if (email) { try { const r = await emailInvite(GROUPS.list.get(id) || { id, meta, members: [], entries: [] }, email, guestId); msg = inviteMessage(r, email); await loadGroups(true); } catch { msg = "The group is ready, but the request couldn't be sent. Open the group and try again."; } }
      go("people");
      setTimeout(() => groupSheet(id), 350);
      toast(msg);
    } catch { toast("Couldn't move the loan. Nothing was changed. Try again.", "error"); }
  }

  async function saveGroupMeta(g, meta) {
    const key = await groupKey(g.id);
    const { error } = await sb.rpc("update_group", { p_group: g.id, p_enc: await sealWith(key, { ...g.meta, ...meta }) });
    if (error) throw error;
    g.meta = { ...g.meta, ...meta };
  }
  async function emailInvite(g, email, guestId) {
    const addr = String(email || "").trim().toLowerCase();
    const { data, error } = await sb.rpc("invite_email", { p_group: g.id, p_email: addr, p_guest: guestId || null });
    if (error) throw error;
    if (data && data.self) return { self: true };
    if (data && data.member) return { member: true };
    let invited = false;
    if (data && data.user_id && data.pub) {
      const r = await sb.rpc("invite_to_group", { p_group: g.id, p_user: data.user_id, p_sealed: await sealTo(data.pub, GROUPS.keys.get(g.id)) });
      if (r.error) throw r.error;
      if (guestId) await saveGroupMeta(g, { claims: { ...(g.meta.claims || {}), [guestId]: data.user_id } });
      groupPing(g.id, data.user_id);
      invited = true;
    }
    const emails = { ...(g.meta.emails || {}) };
    if (guestId) emails["g:" + guestId] = addr;
    if (data && data.user_id) emails["u:" + data.user_id] = addr;
    if (!guestId && !(data && data.user_id)) emails["e:" + addr] = addr;
    try { await saveGroupMeta(g, { emails }); } catch { }
    let mail = null;
    try { mail = (await sb.functions.invoke("send-invite", { body: { group_id: g.id, email: addr, name: settings().name || "", existing: !!(data && data.user_id) } })).data; } catch { mail = null; }
    if (invited) sb.from("group_email_invites").delete().eq("group_id", g.id).eq("email", addr).then(() => { }, () => { });
    track("add", "group_invite");
    return { invited, emailed: !!(mail && mail.emailed), reason: mail && mail.reason, existing: !!(data && data.user_id) };
  }
  function inviteMessage(r, email) {
    if (r.self) return "That's your own email.";
    if (r.member) return "They're already in the group.";
    if (r.invited && r.emailed) return "Request sent. They got an email and a notification in the app.";
    if (r.invited) return "Request sent. They'll see it in the app.";
    if (r.emailed) return `Email sent to ${email}. They'll see the request as soon as they sign up with this email.`;
    return `Saved. When ${email} signs up, they'll see the request.`;
  }
  async function resolveEmailInvites() {
    for (const g of GROUPS.list.values()) {
      if (!g.joined || !GROUPS.keys.get(g.id)) continue;
      try {
        const { data } = await sb.rpc("resolve_email_invites", { p_group: g.id });
        if (!data || !data.length) continue;
        const claims = { ...(g.meta.claims || {}) };
        const emails = { ...(g.meta.emails || {}) };
        for (const r of data) {
          const res = await sb.rpc("invite_to_group", { p_group: g.id, p_user: r.user_id, p_sealed: await sealTo(r.pub, GROUPS.keys.get(g.id)) });
          if (res.error) continue;
          if (r.guest_id) claims[r.guest_id] = r.user_id;
          emails["u:" + r.user_id] = r.email;
          delete emails["e:" + r.email];
          groupPing(g.id, r.user_id);
          await sb.from("group_email_invites").delete().eq("id", r.id);
        }
        if (JSON.stringify(claims) !== JSON.stringify(g.meta.claims || {}) || JSON.stringify(emails) !== JSON.stringify(g.meta.emails || {})) await saveGroupMeta(g, { claims, emails });
      } catch { }
    }
  }

  function groupInviteSheet(id) {
    const g = GROUPS.list.get(id);
    if (!g) return;
    const f = { email: "", guest: "" };
    const err = h("p", { class: "form-err", role: "alert" });
    const out = h("div", { class: "invite-out" });
    const body = h("div", { class: "form" },
      h("section", { class: "card" }, h("div", { class: "card-head" }, h("h2", null, "Invite by email")),
        h("p", { class: "hint" }, "If they use BudgetSplit, they get a notification and accept in the app. If not, we open an email for you to send them a link."),
        h("input", { id: "gi-email", class: "input", type: "email", inputmode: "email", autocomplete: "off", autocapitalize: "none", placeholder: "name@example.com", on: { input: e => { f.email = e.target.value; } } }),
        h("button", { type: "button", class: "btn", on: { click: sendInvite } }, "Send invite"), out),
      h("section", { class: "card" }, h("div", { class: "card-head" }, h("h2", null, "Add a name only")),
        h("p", { class: "hint" }, "For someone without the app. You keep track for them."),
        h("input", { id: "gi-guest", class: "input", maxlength: "40", autocomplete: "off", placeholder: "Name", on: { input: e => { f.guest = e.target.value; } } }),
        h("button", { type: "button", class: "btn alt", on: { click: addGuest } }, "Add")),
      err);
    async function sendInvite() {
      const email = f.email.trim().toLowerCase();
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return fail(err, "Enter a valid email.", document.getElementById("gi-email"));
      if (!navigator.onLine) return fail(err, "Connect to the internet to invite.");
      err.textContent = "";
      try {
        const r = await emailInvite(g, email);
        if (r.self || r.member) return fail(err, inviteMessage(r, email));
        if (!r.emailed && !r.invited) {
          const text = `Hi! I'm using BudgetSplit to keep track of what we share in "${g.meta.name}". Sign up with this email (${email}) and you'll see my request:\n\n${location.origin}${location.pathname}`;
          out.replaceChildren(
            h("p", { class: "hint" }, "The email couldn't be sent automatically. Send it yourself:"),
            h("a", { class: "btn alt", href: `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(`Join "${g.meta.name}" on BudgetSplit`)}&body=${encodeURIComponent(text)}` }, icon("mail", "ico sm"), "Open email"));
          return;
        }
        closeSheet();
        toast(inviteMessage(r, email));
        loadGroups(true);
      } catch (x) { fail(err, x && x.code === "54000" ? "Too many invites today. Try again tomorrow." : "Couldn't send the invite. Try again."); }
    }
    async function addGuest() {
      const name = f.guest.trim().replace(/\s+/g, " ");
      if (!name) return fail(err, "Enter a name.", document.getElementById("gi-guest"));
      try {
        const key = await groupKey(g.id);
        const guests = [...g.meta.guests, { id: gid8().slice(0, 12), name: name.slice(0, 40) }];
        const { error } = await sb.rpc("update_group", { p_group: g.id, p_enc: await sealWith(key, { ...g.meta, guests }) });
        if (error) throw error;
        groupPing(g.id);
        closeSheet();
        toast(`${name} added to the group.`);
        await loadGroups(true);
        setTimeout(() => groupSheet(g.id), 300);
      } catch { fail(err, "Couldn't add them. Try again."); }
    }
    openSheet(`Add to ${g.meta.name}`, body, null, { stack: true });
  }

  const busyUi = () => S.onboarding || !storedSettings().onboarded || TOUR.el || document.querySelector(".overlay, .lock, .viewer");
  function whenIdle(fn, tries = 0) {
    if (!busyUi()) return fn();
    if (tries < 100) setTimeout(() => whenIdle(fn, tries + 1), 1500);
  }
  async function processGroupJoin() {
    let pend = null;
    try { pend = localStorage.getItem("wallet:joinGroup"); } catch { pend = null; }
    if (!pend || !/^[A-Za-z0-9_-]{32,64}\.[A-Za-z0-9_-]{43}$/.test(pend) || !sb || !S.session || !VAULT.key || !navigator.onLine) return;
    if (busyUi()) { if (!GROUPS.waitJoin) { GROUPS.waitJoin = true; whenIdle(() => { GROUPS.waitJoin = false; processGroupJoin(); }); } return; }
    try { localStorage.removeItem("wallet:joinGroup"); } catch { }
    const [token, keyB64] = pend.split(".");
    try {
      const k = await myKeys();
      await publishKey();
      const raw = fromB64u(keyB64);
      const { data, error } = await sb.rpc("join_group_link", { p_token: token, p_sealed: await sealTo(k.pub, raw) });
      if (error || !data) return toast("This group link doesn't work anymore. Ask for a new one.", "error");
      GROUPS.keys.set(data, raw);
      await setGroupProfile(data);
      groupPing(data);
      await loadGroups(true);
      go("people");
      setTimeout(() => groupSheet(data), 350);
      const g = GROUPS.list.get(data);
      toast(g ? `You joined ${g.meta.name}.` : "You joined the group.");
    } catch { toast("Couldn't join the group. Open the link again.", "error"); }
  }

  function viewPeople() {
    const st = settings();
    const bal = loanBalances();
    const people = rows("people").sort(bySort);
    let { owed, owe } = groupTotals();
    for (const p of people) {
      const v = netMine(p, toMain(bal.get(p.id) || 0, p.currency));
      if (v > 0) owed += v; else owe -= v;
    }
    const out = h("div", { class: "stack" });
    out.append(h("div", { class: "tiles two" },
      h("div", { class: "tile good" }, h("small", null, "Owed to you"), h("strong", null, money(owed))),
      h("div", { class: "tile" + (owe > 0 ? " bad" : "") }, h("small", null, "You owe"), h("strong", null, money(owe)))));
    const fresh = !people.length && !GROUPS.list.size;
    out.append(splitIntro(fresh));
    out.append(groupsCard());
    const list = h("section", { class: "card flush" }, h("div", { class: "card-head" }, h("h2", null, "Your loans")));
    for (const p of people) {
      const v = bal.get(p.id) || 0;
      list.append(h("button", { type: "button", class: "row", on: { click: () => personSheet(p) } },
        h("span", { class: "dot", style: { background: COLORS[(p.sort || 0) % COLORS.length] } }, p.name.charAt(0).toUpperCase()),
        h("span", { class: "row-main" }, h("span", { class: "row-title" }, p.name), h("span", { class: "row-sub" + (theyOwe(p, v) && dueInfo(p) && dueInfo(p).late ? " late" : "") }, [statusText(p, v), theyOwe(p, v) && dueInfo(p) ? dueInfo(p).text : null, linkOf(p) || (p.share_token && LINKS.owned.has(p.share_token)) ? "Shared" : p.share_token ? "Has their page" : null].filter(Boolean).join(" · "))),
        h("span", { class: "row-end" + (netMine(p, v) > 0.004 ? " pos" : netMine(p, v) < -0.004 ? " neg" : "") }, fmt(Math.abs(v), p.currency))));
    }
    if (!people.length) list.append(h("p", { class: "empty" }, "No one yet. Add the people you lend money to or borrow from."));
    list.append(h("button", { type: "button", class: "row-btn", on: { click: () => personSheet(null) } }, "Add person"));
    out.append(list, h("p", { class: "hint" }, "Each person can get a private link that shows only their own balance and history. They don't need an account."));
    return out;
  }

  function loanEntrySheet(p, e) {
    const cur = p.currency;
    const linked = S.data.transactions.get(`ln-${e.id}`);
    const f = { amount: String(Math.abs(Number(e.amount))), gave: netMine(p, Number(e.amount)) > 0, note: e.note || "", date: e.occurred_on, account: linked ? linked.account_id : null };
    const accs = rows("accounts").filter(a => !a.archived || (linked && a.id === linked.account_id)).sort(bySort);
    const body = h("form", { class: "form", id: "le-form", novalidate: true });
    const err = h("p", { class: "form-err", role: "alert" });
    let armed = false;
    const draw = () => body.replaceChildren(
      h("div", { class: "tx-type" },
        h("button", { type: "button", class: "tx-tab" + (f.gave ? " on" : ""), on: { click: () => { f.gave = true; draw(); } } }, `${tr("I gave")} ${p.name}`),
        h("button", { type: "button", class: "tx-tab" + (!f.gave ? " on" : ""), on: { click: () => { f.gave = false; draw(); } } }, `${p.name} ${tr("gave me")}`)),
      h("label", { class: "field" }, h("span", null, `${tr("Amount")} (${curSymbol(cur)})`), h("input", { id: "le-amt", class: "input num", inputmode: "decimal", autocomplete: "off", value: f.amount, on: { input: ev => { f.amount = ev.target.value; } } })),
      h("label", { class: "field" }, h("span", null, "Note"), h("input", { id: "le-note", class: "input", maxlength: "200", autocomplete: "off", value: f.note, on: { input: ev => { f.note = ev.target.value; } } })),
      h("label", { class: "field" }, h("span", null, "Date"), h("input", { id: "le-date", class: "input", type: "date", value: f.date, on: { change: ev => { f.date = ev.target.value; } } })),
      h("div", { class: "field" }, h("span", { class: "label" }, f.gave ? "Taken from" : "Put into"),
        h("div", { class: "chips wrap" },
          accs.map(a => h("button", { type: "button", class: "chip", "aria-pressed": String(f.account === a.id), on: { click: () => { f.account = a.id; draw(); } } }, h("span", { class: "chip-cur" }, curTag(a.currency)), a.name)),
          h("button", { type: "button", class: "chip", "aria-pressed": String(!f.account), on: { click: () => { f.account = null; draw(); } } }, "Don't move money"))),
      h("p", { class: "hint" }, f.account ? `${tr("This money is counted in")} ${(acc(f.account) || {}).name} ${tr("and in this month's totals.")}` : tr("No account changes. Use this for an old debt from before.")),
      err,
      h("button", { type: "button", class: "btn danger alt", on: { click: () => {
        if (!armed) { armed = true; draw(); return; }
        removeRow("loan_entries", e); if (linked) removeRow("transactions", linked);
        closeSheet(); toast("Entry deleted."); personSheet(S.data.people.get(p.id) || p);
      } } }, armed ? "Tap again to delete" : "Delete this entry"));
    body.addEventListener("submit", ev => {
      ev.preventDefault();
      const v = parseAmt(f.amount);
      if (!v) return fail(err, "Enter an amount.", document.getElementById("le-amt"));
      if (!DATE_RE.test(f.date)) return fail(err, "Pick a date.");
      const amount = roundCur(v, cur) * (f.gave ? 1 : -1) * (owesMe(p) ? 1 : -1);
      const note = f.note.trim().slice(0, 200) || null;
      const items = [{ t: "loan_entries", r: { ...e, amount, note, occurred_on: f.date } }];
      const ta = f.account && acc(f.account);
      if (ta) items.push({ t: "transactions", r: { ...(linked || { id: `ln-${e.id}`, to_account_id: null, to_amount: null, category_id: null, rule_id: null, receipt: null, created_at: new Date().toISOString() }), kind: f.gave ? "loan_out" : "loan_in", account_id: ta.id, currency: ta.currency, rate: rateOf(ta.currency), amount: roundCur(convert(v, cur, ta.currency), ta.currency), note, occurred_on: f.date } });
      putMany(items);
      if (!ta && linked) removeRow("transactions", linked);
      closeSheet(); toast("Entry updated."); personSheet(S.data.people.get(p.id) || p);
    });
    draw();
    openSheet("Edit entry", body, h("button", { type: "submit", class: "btn", form: "le-form" }, "Save changes"), { stack: true });
  }

  function personSheet(p, notice) {
    if (!p) return newPersonSheet();
    const body = h("div", { class: "form" });
    const f = { phone: p.phone || "", name: p.name, due: dueOf(p) || "" };
    let armed = null;
    const openAmount = mode => {
      const balance = loanBalances().get(p.id) || 0;
      const cur = p.currency;
      const moneyOut = mode === "out";
      const net = netMine(p, balance);
      const sign = (moneyOut ? 1 : -1) * (owesMe(p) ? 1 : -1);
      amountSheet({
        title: moneyOut ? `${tr("I gave")} ${p.name}` : `${p.name} ${tr("gave me")}`,
        cur, max: null,
        quick: isBig(cur) ? [1e6, 5e6, 10e6] : [50, 100, 500, 1000],
        verbFor: v => !v ? "Enter an amount" : `Save ${fmt(v, cur, { show: true })}`,
        accountPick: { label: moneyOut ? "Take the money from" : "Put the money into", initial: loanAccount(p) },
        previewFor: (v, accId) => {
          const a = accId && acc(accId);
          const moved = a ? ` · ${a.name} ${moneyOut ? "−" : "+"}${fmt(roundCur(convert(v, cur, a.currency), a.currency), a.currency, { show: true })}` : "";
          const nb = net + (moneyOut ? v : -v);
          return `${Math.abs(nb) < 0.005 ? tr("All settled") : nb > 0 ? `${p.name} ${tr("owes you")} ${fmt(nb, cur, { show: true })}` : `${tr("You owe")} ${p.name} ${fmt(-nb, cur, { show: true })}`}${moved}`;
        },
        onSave: (v, note, accId) => {
          const amount = roundCur(v, cur) * sign;
          const id = linkOf(p) ? sharedId() : newId();
          const now = new Date().toISOString();
          const entry = { id, person_id: p.id, amount, note, occurred_on: today(), created_at: now };
          const items = [];
          const a = accId && acc(accId);
          if (a) {
            items.push({ t: "transactions", r: { id: `ln-${id}`, kind: moneyOut ? "loan_out" : "loan_in", amount: roundCur(convert(v, cur, a.currency), a.currency), currency: a.currency, rate: rateOf(a.currency), account_id: a.id, to_account_id: null, to_amount: null, category_id: null, note: note || null, occurred_on: today(), rule_id: null, receipt: null, created_at: now } });
            store.set("loanAcc:" + p.id, a.id);
          }
          saveLoan(p, entry, items);
          const next = balance + amount, nn = netMine(p, next);
          personSheet(S.data.people.get(p.id) || p, { title: Math.abs(next) < 0.005 ? "Saved. All settled." : nn > 0 ? `Saved. ${p.name} owes you ${fmt(nn, cur, { show: true })}.` : `Saved. You owe ${p.name} ${fmt(-nn, cur, { show: true })}.`, message: loanMessage(p, amount, next, note) });
        }
      });
    };
    const draw = () => {
      p = S.data.people.get(p.id) || p;
      const balance = loanBalances().get(p.id) || 0;
      const cur = p.currency;
      const history = loanRows().filter(e => e.person_id === p.id).sort(byRecent);
      const kids = [];
      const net = netMine(p, balance), settled = Math.abs(balance) < 0.005;
      kids.push(h("div", { class: "hero person-hero" + (settled ? " settled" : net > 0 ? "" : " owe") },
        h("p", { class: "hero-label" }, settled ? "All settled" : net > 0 ? `${p.name} owes you` : `You owe ${p.name}`),
        h("p", { class: "hero-total num" }, fmt(Math.abs(balance), cur, { show: true })),
        history.length ? h("p", { class: "hero-sub" }, `Last change ${dayLabel(history[0].occurred_on).toLowerCase()}`) : null,
        net > 0 && dueInfo(p) ? h("p", { class: "hero-sub due" + (dueInfo(p).late ? " late" : "") }, dueInfo(p).text) : null));

      if (notice) {
        kids.push(h("div", { class: "notice" }, h("p", null, icon("check", "ico sm"), notice.title),
          h("div", { class: "btn-row" },
            p.phone ? waButton(p.phone, notice.message, `Tell ${p.name}`, "wa") : null,
            h("button", { type: "button", class: "btn alt", on: { click: () => { notice = null; draw(); } } }, p.phone ? "Skip" : "OK")),
          p.phone ? null : h("p", { class: "hint" }, "Add their WhatsApp number in Details to send updates.")));
      }

      const roOnly = !!(linkOf(p) && (LINKED.get(p.id) || {}).viewOnly);
      if (roOnly) kids.push(h("p", { class: "ro-note" }, icon("eye", "ico sm"), `${tr("View only. Only")} ${(LINKED.get(p.id) || {}).from || p.name} ${tr("can add or change entries.")}`));
      else kids.push(h("div", { class: "actions" },
        h("button", { type: "button", class: "action", on: { click: () => openAmount("out") } }, h("span", { class: "action-ico out" }, icon("up")), `${tr("I gave")} ${p.name}`),
        h("button", { type: "button", class: "action", on: { click: () => openAmount("in") } }, h("span", { class: "action-ico" }, icon("down")), `${p.name} ${tr("gave me")}`)));

      if (p.phone) kids.push(waButton(p.phone, balanceMessage(p, balance), "Send balance on WhatsApp", "alt wa-alt"));
      if (p.phone && net > 0 && dueInfo(p)) kids.push(waButton(p.phone, `Hi ${p.name}, a friendly reminder that ${fmt(Math.abs(balance), cur, { show: true })} ${dueInfo(p).late ? "was due on" : "is due on"} ${dayLabel(dueOf(p)).toLowerCase()}. Thank you.`, "Send a payment reminder", "alt wa-alt"));

      const link = linkOf(p);
      const lk = link ? LINKED.get(p.id) || {} : null;
      const connected = !link && p.share_token && LINKS.owned.has(p.share_token);
      const share = h("section", { class: "card flush" + (link || connected ? " shared-card" : "") }, h("div", { class: "card-head" }, h("h2", null, link || connected ? "Shared loan" : "Their private page")));
      if (link) {
        share.append(
          h("div", { class: "row" }, h("span", { class: "dot " + (lk.off ? "bad" : "ok") }, icon(lk.off ? "warn" : "link", "ico sm")),
            h("span", { class: "row-main" }, h("span", { class: "row-title" }, lk.off ? "Sharing was turned off" : `Connected to ${p.name}'s account`),
              h("span", { class: "row-sub wrap" }, lk.off ? `${p.name} turned off the link. You still see the last entries you got.` : lk.viewOnly ? `${tr("View only")}. ${tr("You see the balance and history, and only")} ${lk.from || p.name} ${tr("can change it.")}` : `You both see the same history. What you add is sent to ${p.name}, and you're notified when they change something.`))),
          h("button", { type: "button", class: "row-btn", on: { click: async () => { await loadLinked(); draw(); toast("Up to date."); } } }, "Check for changes"));
      } else if (connected) {
        share.append(
          h("div", { class: "row" }, h("span", { class: "dot ok" }, icon("link", "ico sm")),
            h("span", { class: "row-main" }, h("span", { class: "row-title" }, `Connected to ${p.name}'s account`),
              h("span", { class: "row-sub wrap" }, LINKS.view && LINKS.view.get(p.share_token) !== false ? `${p.name} ${tr("sees this loan in their own app but can't change it. Only you can.")}` : `${p.name} sees this loan in their own app and can add entries. You both get notified when something changes.`))),
          h("button", { type: "button", class: "row-btn", on: { click: async () => {
            const cur = !(LINKS.view && LINKS.view.get(p.share_token) === false);
            const { error } = await sb.rpc("set_loan_view_only", { p_token: p.share_token, p_on: !cur });
            if (error) return toast("Couldn't change it. Try again.", "error");
            if (!LINKS.view) LINKS.view = new Map();
            LINKS.view.set(p.share_token, !cur);
            toast(!cur ? `${p.name} can only see it now.` : `${p.name} can add entries now.`);
            draw();
          } } }, LINKS.view && LINKS.view.get(p.share_token) === false ? `${tr("Make it view only for")} ${p.name}` : `${tr("Let")} ${p.name} ${tr("add entries too")}`),
          h("button", { type: "button", class: "row-btn danger", on: { click: () => {
            if (armed !== "disconnect") { armed = "disconnect"; draw(); return; }
            armed = null;
            sb.from("loan_links").delete().eq("token", p.share_token).then(({ error }) => { if (error) return toast("Couldn't disconnect. Try again.", "error"); LINKS.owned.delete(p.share_token); toast(`${p.name}'s account is disconnected.`); draw(); }, () => toast("Couldn't disconnect. Try again.", "error"));
          } } }, armed === "disconnect" ? "Tap again to disconnect" : "Disconnect their account"));
      } else if (p.share_token && p.skey) {
        const url = shareUrl(p);
        addKids(share, 
          h("p", { class: "row-sub", style: { padding: "0 16px 6px", whiteSpace: "normal" } }, `${p.name} ${tr("sees their balance and history, but can't change anything. No account needed. If they use BudgetSplit, opening the link while signed in adds it to their app, view only.")}`),
          h("input", { id: "f-plink", class: "input", readOnly: true, value: url, hidden: true, style: { margin: "0 16px", width: "calc(100% - 32px)" } }),
          h("button", { type: "button", class: "row-btn", on: { click: () => copyText(url, "f-plink") } }, "Copy link"),
          p.phone ? h("a", { class: "row-btn", style: { display: "block", textDecoration: "none" }, href: waUrl(p.phone, linkMessage(p, p.share_token)), target: "_blank", rel: "noopener noreferrer", on: { click: () => track("whatsapp", "link") } }, "Send link on WhatsApp") : null,
          h("button", { type: "button", class: "row-btn danger", on: { click: () => { if (armed !== "unshare") { armed = "unshare"; draw(); return; } armed = null; putMany([{ t: "people", r: { ...p, share_token: null, skey: null } }, ...history.map(e => ({ t: "loan_entries", r: { ...e } }))]); toast("Link turned off."); draw(); } } }, armed === "unshare" ? "Tap again to turn off the link" : "Turn off link"));
      } else {
        share.append(h("p", { class: "row-sub", style: { padding: "0 16px 6px", whiteSpace: "normal" } }, `Make a link that shows ${p.name} only their own balance and history.`),
          h("button", { type: "button", class: "row-btn", on: { click: () => { putMany([{ t: "people", r: { ...p, share_token: newToken(), skey: toUrl(b64u8(rand(32))) } }, ...history.map(e => ({ t: "loan_entries", r: { ...e } }))]); draw(); } } }, "Create private link"));
      }
      if (!link && !connected) {
        const pe = { email: "" };
        const perr = h("p", { class: "form-err", role: "alert" });
        share.append(h("div", { class: "email-req" },
          h("label", { class: "field" }, h("span", null, `${p.name}'s email (optional)`), h("input", { id: "p-email", class: "input", type: "email", inputmode: "email", autocomplete: "off", autocapitalize: "none", placeholder: "name@example.com", on: { input: e => { pe.email = e.target.value; } } })),
          h("small", { class: "hint" }, `We send ${p.name} a request. If they accept, you both see this loan in your apps and get notified on every change.`),
          h("button", { type: "button", class: "btn alt", on: { click: () => {
            const email = pe.email.trim().toLowerCase();
            if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return fail(perr, "Enter a valid email.", document.getElementById("p-email"));
            personToGroup(p, email);
          } } }, "Send request"), perr));
      }
      if (!link && !connected) addKids(share, h("button", { type: "button", class: "row-btn", on: { click: () => {
        if (armed !== "togroup") { armed = "togroup"; draw(); return; }
        armed = null;
        personToGroup(p);
      } } }, armed === "togroup" ? "Tap again to move it to a shared group" : "Move to a shared group"),
        armed === "togroup" ? h("p", { class: "row-sub", style: { padding: "0 16px 10px", whiteSpace: "normal" } }, `${p.name} becomes a member of a new shared group with the same history. You can then invite them by email or add more people.`) : null);
      kids.push(share);

      const hist = h("section", { class: "card flush" }, h("div", { class: "card-head" }, h("h2", null, `History (${history.length})`)));
      for (const e of history) {
        const v = Number(e.amount);
        const gave = netMine(p, v) > 0;
        const label0 = gave ? "You gave" : "You got";
        const linkedTx = S.data.transactions.get(`ln-${e.id}`);
        const linkedAcc = linkedTx && acc(linkedTx.account_id);
        const label = linkedAcc ? `${label0} · ${linkedAcc.name}` : label0;
        const when = e.remote === "pending" ? `${dayLabel(e.occurred_on)} · sending to ${p.name}` : dayLabel(e.occurred_on);
        const editable = !e.remote && !linkOf(p) && S.data.loan_entries.has(e.id);
        hist.append(h("div", { class: "row" + (e.remote === "pending" ? " pending" : "") + (editable ? " tap" : "") },
          editable ? h("button", { type: "button", class: "loan-hit", "aria-label": "Edit entry", on: { click: () => loanEntrySheet(p, e) } }) : null,
          h("span", { class: "row-main" }, h("span", { class: "row-title" }, e.note || (gave ? `${tr("You gave")} ${p.name}` : `${p.name} ${tr("gave you")}`)), h("span", { class: "row-sub" }, `${label} · ${when}`)),
          h("span", { class: "row-end" + (gave ? " neg" : " pos") }, (gave ? "↑ " : "↓ ") + fmt(Math.abs(v), cur)),
          e.remote ? h("span", { class: "row-lock", "aria-hidden": "true" }) : h("button", { type: "button", class: "icon-btn", "aria-label": armed === e.id ? "Confirm delete" : "Delete entry", style: armed === e.id ? { color: "var(--neg)" } : null,
            on: { click: () => { if (armed !== e.id) { armed = e.id; draw(); return; } armed = null; removeRow("loan_entries", e); const linked = S.data.transactions.get(`ln-${e.id}`); if (linked) removeRow("transactions", linked); toast(linked ? "Entry deleted, and the account was corrected." : "Entry deleted."); draw(); } } }, icon(armed === e.id ? "warn" : "close"))));
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
          const items = [{ t: "people", r: { ...p, share_token: null, deleted_at: new Date().toISOString() } }, ...history.filter(e => !e.remote).map(e => ({ t: "loan_entries", r: { ...e, deleted_at: new Date().toISOString() } })), ...history.map(e => S.data.transactions.get(`ln-${e.id}`)).filter(Boolean).map(x => ({ t: "transactions", r: { ...x, deleted_at: new Date().toISOString() } }))];
          if (linkOf(p)) unlinkMember(p);
          putMany(items); closeSheet(); toast(`${p.name} removed.`);
        } } }, armed === "delete" ? `Tap again to remove ${p.name} and their history` : "Remove person")));

      keepFocus(() => body.replaceChildren(...kids.filter(Boolean)));
    };
    draw();
    openSheet(p.name, body);
  }

  function newPersonSheet() {
    const f = { name: "", direction: "owes_me", currency: mainCur(), amount: "", phone: "", email: "" };
    const body = h("form", { class: "form", novalidate: true });
    const err = h("p", { class: "form-err", role: "alert" });
    const draw = () => {
      keepFocus(() => body.replaceChildren(
        h("label", { class: "field" }, h("span", null, "Name"), h("input", { id: "f-nname", class: "input", maxlength: "40", autocomplete: "off", value: f.name, on: { input: e => { f.name = e.target.value; } } })),
        h("div", { class: "field" }, h("span", { class: "label" }, "Who owes who"), seg([["owes_me", "They owe me"], ["i_owe", "I owe them"]], f.direction, k => { f.direction = k; draw(); }, "Direction")),
        h("div", { class: "field" }, h("span", { class: "label" }, "Currency"), curSelect("f-ncur", f.currency, k => { f.currency = k; draw(); })),
        h("label", { class: "field" }, h("span", null, `Amount owed now (${curSymbol(f.currency)})`), h("input", { id: "f-namt", class: "input num", inputmode: "decimal", autocomplete: "off", placeholder: "0", value: f.amount, on: { input: e => { f.amount = e.target.value; } } })),
        h("label", { class: "field" }, h("span", null, "WhatsApp number (optional)"), h("input", { id: "f-nphone", class: "input", type: "tel", autocomplete: "off", placeholder: "70 123 456", value: f.phone, on: { input: e => { f.phone = e.target.value; } } })),
        h("label", { class: "field" }, h("span", null, "Email (optional)"), h("input", { id: "f-nemail", class: "input", type: "email", inputmode: "email", autocomplete: "off", autocapitalize: "none", placeholder: "name@example.com", value: f.email, on: { input: e => { f.email = e.target.value; } } }),
          h("small", { class: "hint" }, "If you add it, they get a request to share this loan with you in their app.")),
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
      const email = f.email.trim().toLowerCase();
      if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { fail(err, "Enter a valid email, or leave it empty."); return; }
      const person = { id: newId(), name, direction: f.direction, currency: f.currency, phone, share_token: null, sort: Math.max(-1, ...rows("people").map(r => r.sort || 0)) + 1 };
      const items = [{ t: "people", r: person }];
      if (start) items.push({ t: "loan_entries", r: { id: newId(), person_id: person.id, amount: roundCur(start, f.currency), note: "Starting balance", occurred_on: today(), created_at: new Date().toISOString() } });
      putMany(items);
      if (email && navigator.onLine) { closeSheet(); toast("Sending the request…"); personToGroup(S.data.people.get(person.id), email); return; }
      personSheet(S.data.people.get(person.id));
    });
    draw();
    openSheet("Add person", body);
  }

  async function renderShared(token) {
    shell = null;
    const box = h("div", { class: "auth-box" }, h("p", { class: "hint" }, "Loading your balance…"));
    root.replaceChildren(h("div", { class: "auth" }, box));
    const fail = text => box.replaceChildren(h("img", { class: "auth-mark", src: "icons/icon-192-b.png", alt: "" }), h("h1", null, "Can't open this page"), h("p", null, text));
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
    const viewerOwes = (data.direction === "owes_me") === (balance > 0);
    const label = balance === 0 ? "You're all settled" : viewerOwes ? (from ? `You owe ${from}` : "You owe") : (from ? `${from} owes you` : "You're owed");
    const history = Array.isArray(data.history) ? data.history : [];
    const list = h("section", { class: "card flush" }, h("div", { class: "card-head" }, h("h2", null, "History")));
    for (const e of history) {
      const v = Number(e.amount) || 0;
      const ownerGave = (data.direction === "owes_me") === (v > 0);
      const kind = ownerGave ? "You got" : "You gave";
      list.append(h("div", { class: "row" },
        h("span", { class: "row-main" }, h("span", { class: "row-title" }, typeof e.note === "string" && e.note ? e.note : kind), h("span", { class: "row-sub" }, `${kind} · ${DATE_RE.test(String(e.date)) ? dayLabel(e.date) : ""}`)),
        h("span", { class: "row-end" + (v < 0 ? " neg" : " pos") }, (v > 0 ? "+" : "−") + fmt(Math.abs(v), cur, { show: true }))));
    }
    if (!history.length) list.append(h("p", { class: "empty" }, "No history yet."));
    box.className = "auth-box";
    box.replaceChildren(
      h("section", { class: "hero" },
        h("p", { class: "hero-label" }, `Hi ${String(data.name || "").slice(0, 40)}`),
        h("p", { class: "hero-total num" }, fmt(Math.abs(balance), cur, { show: true })),
        h("p", { class: "hero-sub" }, label)),
      list,
      h("p", { class: "hint", style: { textAlign: "center" } }, "Only people with this link can see this page."));
    document.title = "Your balance";
    let session = null;
    try { session = (await sb.auth.getSession()).data.session; } catch { session = null; }
    const join = () => {
      try { localStorage.setItem("wallet:joinLink", JSON.stringify({ link: `${token}.${skey}` })); } catch { }
      location.hash = "";
      location.reload();
    };
    box.append(h("section", { class: "card join-card" },
      h("h2", null, session ? "Add it to your wallet" : "Use BudgetSplit?"),
      h("p", { class: "hint" }, session ? `See this loan in your own app${from ? ` next to your other entries. You and ${from}` : ". You both"} see the same history and get notified when something changes.` : "Sign in to BudgetSplit to keep this loan in your own app and get notified when it changes."),
      h("button", { type: "button", class: "btn", on: { click: join } }, session ? "Add to my wallet" : "Sign in and add it")));
  }

  const ADMIN = { allowed: null, data: null, loading: false, error: null };

  async function checkAdmin() {
    if (ADMIN.checking || !sb || !S.session) return;
    ADMIN.checking = true;
    try { const { data } = await sb.rpc("is_admin"); ADMIN.allowed = data === true; } catch { ADMIN.allowed = false; }
    ADMIN.checking = false;
    if (ADMIN.allowed) mailRelease();
    if (S.view === "settings" && ADMIN.allowed) render();
  }

  const vnum = v => String(v).split(".").reduce((t, x) => t * 1000 + (Number(x) || 0), 0);
  async function mailRelease() {
    const last = storedSettings().releaseMailed;
    if (last === VERSION || !navigator.onLine) return;
    const notes = [...CHANGES, ...ADMIN_CHANGES].sort((p, q) => vnum(q.v) - vnum(p.v)).filter(c => vnum(c.v) <= vnum(VERSION) && (!last || vnum(c.v) > vnum(last))).slice(0, last ? 12 : 1)
      .map(c => ({ v: c.v, items: c.items.map(([, title, text]) => ({ title, text })) }));
    if (!notes.length) return saveSettings({ releaseMailed: VERSION });
    try {
      const { data } = await sb.functions.invoke("send-invite", { body: { action: "release", version: VERSION, notes } });
      if (data && (data.emailed || data.already)) saveSettings({ releaseMailed: VERSION });
    } catch { }
  }

  async function adminCall(action, extra = {}) {
    const res = await sb.functions.invoke("admin", { body: { action, ...extra } });
    if (!res.error) return res.data;
    let msg = "The admin server didn't answer. Check your connection.";
    try { const r = res.error.context; if (r && typeof r.json === "function") { const j = await r.json(); if (j && j.error) msg = j.error; } } catch { }
    throw new Error(msg);
  }

  function notifySheet(u, preset) {
    const f = { title: preset ? preset.title : "", body: preset ? preset.body : "" };
    const err = h("p", { class: "form-err", role: "alert" });
    const reach = u ? (u.stats && u.stats.reminders) || 0 : (ADMIN.data && ADMIN.data.totals && ADMIN.data.totals.reminders_on) || 0;
    let busy = false;
    const btn = h("button", { type: "submit", class: "btn", form: "nt-form" }, u ? "Send to this user" : "Send to everyone");
    const body = h("form", { class: "form", id: "nt-form", novalidate: true },
      h("p", { class: "hint" }, u ? `Goes to ${u.email || "this user"} on every device where they turned on notifications.` : "Goes to every user who turned on notifications in the app."),
      h("p", { class: "hint" }, (reach ? `${reach} ${reach === 1 ? "device gets" : "devices get"} an alert right away.` : "No devices have notifications turned on, so nobody gets an alert.") + " " + (u ? "It also appears in their inbox in the app." : "It also appears in every user's inbox in the app.")),
      h("label", { class: "field" }, h("span", null, "Title"), h("input", { id: "nt-title", class: "input", maxlength: "60", autocomplete: "off", value: f.title, placeholder: "e.g. New in BudgetSplit", on: { input: e => { f.title = e.target.value; err.textContent = ""; e.target.classList.remove("invalid"); } } })),
      h("label", { class: "field" }, h("span", null, "Message"), h("textarea", { id: "nt-body", class: "input", maxlength: "180", rows: "3", value: f.body, placeholder: "Keep it short. Up to 180 characters.", on: { input: e => { f.body = e.target.value; err.textContent = ""; e.target.classList.remove("invalid"); } } })),
      err);
    body.addEventListener("submit", async ev => {
      ev.preventDefault();
      if (busy) return;
      if (!f.title.trim()) return fail(err, "Write a title.", document.getElementById("nt-title"));
      if (!f.body.trim()) return fail(err, "Write a message.", document.getElementById("nt-body"));
      if (!navigator.onLine) return fail(err, "Connect to the internet to send.");
      busy = true; btn.disabled = true; btn.textContent = tr("Sending…");
      let res = null;
      try { res = await sb.functions.invoke("send-reminder", { body: { action: "broadcast", title: f.title.trim(), body: f.body.trim(), user_id: u ? u.id : null } }); } catch { res = { error: true }; }
      busy = false; btn.disabled = false; btn.textContent = tr(u ? "Send to this user" : "Send to everyone");
      if (res.error || !res.data) return fail(err, "Couldn't send. Check your connection and try again.");
      const d = res.data;
      closeSheet();
      loadInbox(true);
      const inbox = d.saved ? (u ? " It's also in their inbox in the app." : " It's also in everyone's inbox in the app.") : "";
      if (!d.devices) return toast(d.saved ? (u ? "Saved to their inbox. They haven't turned on notifications, so no alert was sent." : "Saved to everyone's inbox. Nobody has notifications turned on, so no alert was sent.") : (u ? "This user hasn't turned on notifications, so nothing was sent." : "Nobody has notifications turned on yet."), d.saved ? undefined : "error");
      toast((d.sent === d.devices ? `Sent to ${d.sent} ${d.sent === 1 ? "device" : "devices"}.` : `Sent to ${d.sent} of ${d.devices} devices. The others may have turned notifications off.`) + inbox);
    });
    openSheet(u ? "Notify this user" : "Notify everyone", body, btn);
  }

  const USAGE = { data: null, error: false, busy: false };
  async function loadUsage() {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
      const { data, error } = await sb.rpc("admin_usage", { p_days: 30, p_tz: tz });
      USAGE.error = !!error; if (!error) USAGE.data = data;
    } catch { USAGE.error = true; }
  }
  const DEVICE_NAMES = { iphone: "iPhone", ipad: "iPad", android: "Android", mac: "Mac", windows: "Windows", linux: "Linux", other: "Other" };
  const SCREENS = { home: "Home", activity: "Activity", insights: "Insights", people: "Split", settings: "Settings", plan: "Plan", admin: "Admin" };
  const THINGS = { expense: "an expense", income: "income", transfer: "a transfer", loan_out: "money lent", loan_in: "money borrowed", entry: "an entry", person: "a person", loan: "a loan entry", account: "an account", category: "a category", repeat: "a repeating entry" };
  function featureLabel(e, d) {
    if (e === "view") return `Opened ${SCREENS[d] || d}`;
    if (e === "add") return `Added ${THINGS[d] || d}`;
    if (e === "edit") return `Edited ${THINGS[d] || d}`;
    if (e === "delete") return `Deleted ${THINGS[d] || d}`;
    if (e === "tour") return `Watched the ${SCREENS[d] || ""} tour`.replace("  ", " ");
    if (e === "goal") return d === "new" ? "Created a savings goal" : "Opened a savings goal";
    return { help: "Opened help", inbox: "Read notifications", budgets: "Checked budgets", whatsapp: d === "link" ? "Sent a share link on WhatsApp" : "Sent a WhatsApp reminder" }[e] || [e, d].filter(Boolean).join(" · ");
  }
  const emailOf = id => { const u = ADMIN.data && ADMIN.data.users.find(x => x.id === id); return u ? u.email || "No email" : "Deleted user"; };

  function usageCard() {
    const card = h("section", { class: "card flush usage" }, h("div", { class: "card-head" }, h("h2", null, "Usage, last 30 days")));
    const u = USAGE.data;
    if (!u) { card.append(h("p", { class: "empty" }, USAGE.error ? "Run supabase/usage.sql in the Supabase SQL editor once." : "Loading…")); return card; }
    const a = u.active || {};
    card.append(h("div", { class: "tiles four" },
      h("div", { class: "tile" }, h("small", null, "Active today"), h("strong", null, String(a.today ?? 0))),
      h("div", { class: "tile" }, h("small", null, "This week"), h("strong", null, String(a.week ?? 0))),
      h("div", { class: "tile" }, h("small", null, "This month"), h("strong", null, String(a.month ?? 0))),
      h("div", { class: "tile" }, h("small", null, "Opens today"), h("strong", null, String(u.opens_today ?? 0)))));
    const byDay = new Map((u.days || []).map(d => [d.day, d]));
    const days = [];
    for (let i = 13; i >= 0; i--) { const d = ymd(new Date(Date.now() - i * 864e5)); days.push({ day: d, opens: byDay.get(d)?.opens || 0, users: byDay.get(d)?.users || 0 }); }
    const max = Math.max(1, ...days.map(d => d.opens));
    card.append(h("div", { class: "usage-chart", role: "img", "aria-label": tr("App opens, last 14 days") },
      days.map(d => h("div", { class: "uc-col", title: `${d.day}: ${d.opens} opens, ${d.users} people` },
        h("span", { class: "uc-n num" }, d.opens ? String(d.opens) : ""),
        h("span", { class: "uc-bar", style: { height: Math.max(3, d.opens / max * 100) + "%" } }),
        h("small", null, String(Number(d.day.slice(8))))))));
    card.append(h("p", { class: "hint usage-cap" }, "App opens per day, last 14 days"));
    const devs = Object.entries(u.devices || {}).sort((x, y) => y[1] - x[1]).map(([k, n]) => `${DEVICE_NAMES[k] || k} ${n}`).join(" · ");
    if (devs) card.append(h("p", { class: "hint usage-cap" }, `People by device: ${devs}`));
    const on = !!u.alert_opens;
    card.append(h("div", { class: "row" }, h("span", { class: "dot " + (on ? "gold" : "neutral") }, icon("bell", "ico sm")),
      h("span", { class: "row-main" }, h("span", { class: "row-title" }, "Alert me when someone opens the app"), h("span", { class: "row-sub wrap" }, "At most once every 30 minutes per person. Needs notifications on for this device.")),
      h("button", { type: "button", class: "switch", role: "switch", "aria-checked": String(on), "aria-label": "Alert me when someone opens the app", disabled: USAGE.busy, on: { click: async () => {
        USAGE.busy = true; render();
        try { const { data, error } = await sb.rpc("admin_set_open_alerts", { p_on: !on }); if (error) throw error; u.alert_opens = !!data; toast(data ? "You'll get a notification when someone opens the app." : "Open alerts turned off."); }
        catch { toast("Couldn't change that. Try again.", "error"); }
        USAGE.busy = false; render();
      } } }, h("span", { class: "knob" }))));
    const top = (u.top || []).slice(0, 10);
    const topMax = Math.max(1, ...top.map(t => t.n));
    card.append(h("div", { class: "card-head sub" }, h("h3", null, "Most used")));
    card.append(top.length ? h("div", { class: "usage-top" }, top.map(t => h("div", { class: "ut-row" },
      h("div", { class: "ut-line" }, h("span", null, featureLabel(t.event, t.detail)), h("span", { class: "num" }, `${t.n} · ${t.users} ${t.users === 1 ? "person" : "people"}`)),
      h("div", { class: "bar" }, h("span", { style: { width: (t.n / topMax * 100) + "%" } })))))
      : h("p", { class: "empty" }, "Nothing yet. Usage appears as people use the app."));
    const recent = (u.recent || []).slice(0, 10);
    card.append(h("div", { class: "card-head sub" }, h("h3", null, "Recently opened")));
    card.append(recent.length ? h("div", null, recent.map(r => h("div", { class: "row" },
      h("span", { class: "dot neutral" }, emailOf(r.user_id).charAt(0).toUpperCase()),
      h("span", { class: "row-main" }, h("span", { class: "row-title" }, emailOf(r.user_id)), h("span", { class: "row-sub" }, [DEVICE_NAMES[r.device] || null, r.standalone ? "Home Screen app" : r.standalone === false ? "Browser" : null, r.version ? `v${r.version}` : null].filter(Boolean).join(" · "))),
      h("span", { class: "row-end muted" }, ago(r.at)))))
      : h("p", { class: "empty" }, "No opens recorded yet."));
    return card;
  }

  async function loadAdmin() {
    if (ADMIN.loading) return;
    ADMIN.loading = true; ADMIN.error = null;
    if (S.view === "admin") render();
    try { [ADMIN.data] = await Promise.all([adminCall("overview"), loadUsage(), loadInsights()]); } catch (e) { ADMIN.error = e.message; }
    ADMIN.loading = false;
    if (S.view === "admin") render();
  }

  const INSIGHTS = { data: null, error: false };
  async function loadInsights() {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
      const { data, error } = await sb.rpc("admin_insights", { p_tz: tz });
      INSIGHTS.error = !!error; if (!error) INSIGHTS.data = data;
    } catch { INSIGHTS.error = true; }
  }
  const pct = (a, b) => b ? Math.round(a / b * 100) : 0;
  function bars(list, opts = {}) {
    const max = Math.max(1, ...list.map(x => x.n));
    return h("div", { class: "ibars" + (opts.tall ? " tall" : "") }, list.map(x => h("div", { class: "ibar", title: `${x.label}: ${x.n}` },
      h("span", { class: "ibar-fill" + (x.hot ? " hot" : ""), style: { height: `${Math.max(x.n ? 6 : 0, Math.round(x.n / max * 100))}%` } }),
      opts.labels ? h("small", null, x.short ?? "") : null)));
  }
  function hbar(label, n, total, sub) {
    return h("div", { class: "hbar" }, h("div", { class: "hbar-top" }, h("span", null, label), h("span", { class: "num" }, sub ?? `${n} · ${pct(n, total)}%`)),
      h("div", { class: "hbar-track" }, h("span", { style: { width: `${pct(n, total)}%` } })));
  }
  function insightsCards() {
    const d = INSIGHTS.data;
    if (!d) return [h("p", { class: "hint" }, INSIGHTS.error ? "Insights couldn't load. Tap Refresh." : "Loading insights…")];
    const days30 = Array.from({ length: 30 }, (_, i) => ymd(new Date(Date.now() - (29 - i) * 864e5)));
    const byDay = (arr, k = "n") => { const m = new Map((arr || []).map(x => [x.day, x[k]])); return days30.map((day, i) => ({ label: day, n: m.get(day) || 0, short: i % 7 === 0 ? day.slice(8) : "", hot: day === today() })); };
    const f = d.funnel || {}, r = d.retention || {}, ad = d.adoption || {}, g = d.groups || {};
    const users = f.signed_up || 0;
    const cards = [];
    cards.push(h("section", { class: "card icard" }, h("div", { class: "card-head" }, h("h2", null, "Growth")),
      h("p", { class: "hint" }, `${(d.signups || []).reduce((t, x) => t + x.n, 0)} new accounts in the last 30 days`), bars(byDay(d.signups), { labels: true }),
      h("h3", null, "From sign-up to habit"),
      hbar("Signed up", f.signed_up || 0, users), hbar("Opened the app", f.opened || 0, users), hbar("Added a first entry", f.first_entry || 0, users),
      hbar("10+ entries", f.ten_entries || 0, users), hbar("50+ entries", f.fifty_entries || 0, users)));
    cards.push(h("section", { class: "card icard" }, h("div", { class: "card-head" }, h("h2", null, "Do people come back?")),
      h("div", { class: "facts" },
        h("div", { class: "fact" }, h("small", null, "Back the next day"), h("strong", { class: "num" }, `${pct(r.day1 || 0, r.day1_cohort || 0)}%`), h("small", null, `${r.day1 || 0} of ${r.day1_cohort || 0}`)),
        h("div", { class: "fact" }, h("small", null, "Active this week"), h("strong", { class: "num" }, `${pct(r.week_back || 0, r.week_cohort || 0)}%`), h("small", null, `${r.week_back || 0} of ${r.week_cohort || 0} older users`)))));
    const hours = Array.from({ length: 24 }, (_, i) => ({ label: `${i}:00`, n: Number((d.hours || {})[i] || 0), short: i % 6 === 0 ? String(i) : "" }));
    const peak = hours.reduce((a, b) => b.n > a.n ? b : a, hours[0]);
    const WD = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const wds = WD.map((w, i) => ({ label: w, n: Number((d.weekdays || {})[i + 1] || 0), short: w.slice(0, 2) }));
    cards.push(h("section", { class: "card icard" }, h("div", { class: "card-head" }, h("h2", null, "When people open the app")),
      h("p", { class: "hint" }, peak.n ? `Busiest around ${peak.label}. Good time for announcements.` : "Not enough data yet."),
      bars(hours.map(x => ({ ...x, hot: x === peak && x.n > 0 })), { labels: true }), bars(wds, { labels: true })));
    const kinds = d.kinds || {};
    const KN = { expense: "Expenses", income: "Income", transfer: "Transfers", loan_out: "Money lent / paid", loan_in: "Money received back / borrowed" };
    const ktotal = Object.values(kinds).reduce((a, b) => a + Number(b), 0);
    cards.push(h("section", { class: "card icard" }, h("div", { class: "card-head" }, h("h2", null, "Entries added")),
      h("p", { class: "hint" }, `${ktotal} entries in 30 days`), bars(byDay(d.entries), { labels: true }),
      ...Object.entries(kinds).sort((a, b) => b[1] - a[1]).map(([k, n]) => hbar(KN[k] || k, Number(n), ktotal))));
    const FEAT = [["reminders", "Daily reminder on"], ["installed", "Installed on Home Screen"], ["loans", "Loans with people"], ["groups", "Shared groups"], ["budgets", "Category budgets"], ["bills", "Bill reminders"], ["repeats", "Monthly repeats"], ["receipts", "Receipt photos"], ["reports", "Got a monthly report"], ["quick_add", "Lock Screen quick add"]];
    cards.push(h("section", { class: "card icard" }, h("div", { class: "card-head" }, h("h2", null, "Which features people use")),
      h("p", { class: "hint" }, `Out of ${users} users`),
      ...FEAT.map(([k, label]) => ({ k, label, n: Number(ad[k] || 0) })).sort((a, b) => b.n - a.n).map(x => hbar(x.label, x.n, users)),
      h("p", { class: "hint" }, `Groups: ${g.total || 0} · members ${g.members || 0} · waiting to answer ${g.pending || 0} · email invites ${g.email_invites || 0}`)));
    const vers = Object.entries(d.versions || {}).sort((a, b) => String(b[0]).localeCompare(String(a[0]), undefined, { numeric: true }));
    const vtotal = vers.reduce((a, [, n]) => a + Number(n), 0);
    cards.push(h("section", { class: "card icard" }, h("div", { class: "card-head" }, h("h2", null, "App versions in use")),
      ...vers.map(([v, n], i) => hbar(`v${v}${v === VERSION ? " · latest" : ""}`, Number(n), vtotal)),
      vers.length && vers[0][0] !== VERSION ? h("p", { class: "hint" }, "Some people haven't opened the app since the last update.") : null));
    const LN = { en: "English", fr: "Français", ar: "العربية" };
    const langs = Object.entries(d.langs || {});
    const ltotal = langs.reduce((t, [, n]) => t + Number(n), 0);
    if (langs.length) cards.push(h("section", { class: "card icard" }, h("div", { class: "card-head" }, h("h2", null, "Languages")),
      ...langs.sort((a, b) => b[1] - a[1]).map(([k, n]) => hbar(LN[k] || k, Number(n), ltotal))));
    const person = (id, sub) => {
      const u = ADMIN.data && ADMIN.data.users.find(x => x.id === id);
      return h("div", { class: "row" }, h("span", { class: "dot neutral" }, (u && u.email || "?").charAt(0).toUpperCase()),
        h("span", { class: "row-main" }, h("span", { class: "row-title" }, u ? u.email || "No email" : "Deleted user"), h("span", { class: "row-sub" }, sub)),
        u ? h("button", { type: "button", class: "chip", on: { click: () => notifySheet(u, { title: "We miss you 👋", body: "Your budget is waiting. Open BudgetSplit and log today's spending, it takes 5 seconds." }) } }, "Nudge") : null);
    };
    const quiet = d.quiet || [], never = d.never || [];
    cards.push(h("section", { class: "card flush icard" }, h("div", { class: "card-head" }, h("h2", null, `People drifting away (${quiet.length + never.length})`)),
      quiet.length || never.length ? null : h("p", { class: "empty" }, "Everyone is active. 🎉"),
      ...quiet.slice(0, 15).map(x => person(x.user_id, `Last opened ${ago(x.last)} · ${x.entries} entries`)),
      ...never.slice(0, 15).map(x => person(x.user_id, `Joined ${ago(x.created)} · never added an entry`))));
    const errs = d.errors || [];
    cards.push(h("section", { class: "card flush icard" }, h("div", { class: "card-head" }, h("h2", null, `App errors, last 14 days (${errs.length})`)),
      errs.length ? errs.map(e => h("div", { class: "row" }, h("span", { class: "dot bad" }, icon("warn", "ico sm")),
        h("span", { class: "row-main" }, h("span", { class: "row-title" }, String(e.detail || "unknown").replace(/_/g, " ")), h("span", { class: "row-sub" }, `${e.n} times · ${e.users} ${e.users === 1 ? "person" : "people"} · last ${ago(e.last)}`))))
        : h("p", { class: "empty" }, "No errors reported. 👍")));
    return cards;
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

    out.append(usageCard(), ...insightsCards());
    const latest = CHANGES[0];
    const annTitle = `Version ${latest.v} is here`;
    const announced = INBOX.items.some(n => n.title === annTitle);
    const annBody = `New: ${latest.items.slice(1).map(x => x[1]).join(", ")}. Open the app to see what changed.`.slice(0, 180);
    out.append(h("section", { class: "card" + (announced ? "" : " announce") },
      h("div", { class: "row" }, h("span", { class: "dot " + (announced ? "ok" : "gold") }, icon(announced ? "check" : "star", "ico sm")),
        h("span", { class: "row-main" }, h("span", { class: "row-title" }, `Version ${latest.v}`), h("span", { class: "row-sub wrap" }, announced ? "Announced to everyone." : "Not announced yet. Tell your users what's new."))),
      announced ? null : h("button", { type: "button", class: "btn", on: { click: () => notifySheet(null, { title: annTitle, body: annBody }) } }, icon("bell", "ico sm"), "Announce this version")));
    out.append(h("button", { type: "button", class: "btn", on: { click: () => notifySheet(null) } }, icon("bell", "ico sm"), "Send a notification to everyone"));
    if (!INBOX.at) loadInbox(true);
    out.append(sentCard());
    const list = h("section", { class: "card flush" }, h("div", { class: "card-head" }, h("h2", null, `Users (${d.users.length})`)));
    for (const u of [...d.users].sort((a, b) => String(b.last_sign_in_at || "").localeCompare(String(a.last_sign_in_at || "")))) {
      const st = u.stats || {};
      const tags = [u.is_me ? "You · admin" : null, isBlocked(u) ? "Blocked" : null].filter(Boolean).join(" · ");
      list.append(h("button", { type: "button", class: "row", on: { click: () => adminUserSheet(u) } },
        h("span", { class: "dot " + (isBlocked(u) ? "bad" : u.is_me ? "gold" : "neutral") }, (u.email || "?").charAt(0).toUpperCase()),
        h("span", { class: "row-main" }, h("span", { class: "row-title" }, u.email || "No email"), h("span", { class: "row-sub" }, [tags, `${st.transactions ?? 0} entries`, (USAGE.data?.per_user || {})[u.id]?.last ? `active ${ago(USAGE.data.per_user[u.id].last)}` : `seen ${whenText(u.last_sign_in_at)}`].filter(Boolean).join(" · "))),
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
          h("p", { class: "hint" }, `Joined ${dfmt({ day: "numeric", month: "short", year: "numeric" }).format(new Date(u.created_at))} · last sign-in ${whenText(u.last_sign_in_at)} · last entry ${whenText(st.last_entry)}`))
      ];
      const us = (USAGE.data?.per_user || {})[u.id];
      kids.push(h("section", { class: "card" }, h("div", { class: "card-head" }, h("h2", null, "Activity, last 30 days")),
        us ? [h("div", { class: "facts" }, fact("App opens", us.opens ?? 0), fact("Actions", us.actions ?? 0)),
          h("p", { class: "hint" }, [`Last active ${ago(us.last)}`, DEVICE_NAMES[us.device] || null, us.version ? `v${us.version}` : null].filter(Boolean).join(" · ")),
          (us.top || []).length ? h("div", { class: "usage-top" }, us.top.map(t => h("div", { class: "ut-line" }, h("span", null, featureLabel(t.event, t.detail)), h("span", { class: "num" }, String(t.n))))) : null]
          : h("p", { class: "hint" }, "No activity recorded yet. It's counted from version 3.14.0 on.")));
      kids.push(h("button", { type: "button", class: "btn", disabled: busy, on: { click: () => { closeSheet(); setTimeout(() => notifySheet(u), 350); } } }, icon("bell", "ico sm"), "Send a notification"));
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

  const liveOverlays = () => [...document.querySelectorAll(".overlay:not(.closing)")];
  function closeSheet() {
    const list = liveOverlays();
    const o = list.pop();
    if (!o) return;
    const sheet = o.querySelector(".sheet");
    if (sheet) { sheet.style.transition = ""; sheet.style.transform = ""; }
    o.classList.add("closing");
    o.classList.remove("open");
    const below = list[list.length - 1];
    if (below) below.classList.remove("under");
    else { document.body.classList.remove("locked"); document.removeEventListener("keydown", onSheetKey); }
    setTimeout(() => o.remove(), 320);
  }
  const dismissSheet = () => closeSheet();
  function onSheetKey(e) {
    if (e.key === "Escape") return dismissSheet();
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
      if (dy > 130 || (dy > 50 && v > 0.55)) dismissSheet(); else sheet.style.transform = "";
    };
    sheet.addEventListener("touchend", end);
    sheet.addEventListener("touchcancel", end);
  }
  function openSheet(title, body, footer, opts = {}) {
    if (opts.stack && liveOverlays().length) liveOverlays().forEach(o => o.classList.add("under"));
    else document.querySelectorAll(".overlay").forEach(o => o.remove());
    const sheet = h("section", { class: "sheet" + (opts.fill ? " fill" : ""), role: "dialog", "aria-modal": "true", "aria-label": title },
      h("div", { class: "grab", "aria-hidden": "true" }),
      h("header", { class: "sheet-head" }, h("h2", null, title), opts.headBtn || null, h("button", { type: "button", class: "icon-btn close", "aria-label": "Close", on: { click: dismissSheet } }, icon("close"))),
      h("div", { class: "sheet-body" }, body),
      footer ? h("div", { class: "sheet-foot" }, footer) : null);
    const overlay = h("div", { class: "overlay" + (opts.stack && document.querySelector(".overlay.under") ? " stacked" : ""), on: { click: e => { if (e.target === overlay) dismissSheet(); } } }, sheet);
    document.body.append(overlay);
    document.body.classList.add("locked");
    document.removeEventListener("keydown", onSheetKey);
    document.addEventListener("keydown", onSheetKey);
    dragToClose(sheet);
    requestAnimationFrame(() => requestAnimationFrame(() => overlay.classList.add("open")));
  }

  const seg = (options, value, onPick, label) => {
    const idx = Math.max(0, options.findIndex(o => o[0] === value));
    const thumb = h("span", { class: "seg-thumb", "aria-hidden": "true", style: { width: `calc((100% - 6px) / ${options.length})`, transform: `translateX(${idx * 100}%)` } });
    const el = h("div", { class: "seg", role: "group", "aria-label": label }, thumb,
      options.map(([k, l, disabled], i) => h("button", { type: "button", "aria-pressed": String(value === k), disabled: !!disabled, on: { click: e => {
        if (k === value) return;
        const live = e.currentTarget.parentElement || el;
        const liveThumb = live.querySelector(".seg-thumb") || thumb;
        liveThumb.style.transform = `translateX(${i * 100}%)`;
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

  function amountSheet({ title, cur, max, quick, verbFor, previewFor, onSave, accountPick }) {
    const f = { amount: "", note: "", account: accountPick ? accountPick.initial : null };
    const accRow = accountPick ? h("div", { class: "field acc-pick" }) : null;
    const drawAcc = () => {
      if (!accRow) return;
      const list = rows("accounts").filter(a => !a.archived).sort(bySort);
      accRow.replaceChildren(h("span", { class: "label" }, accountPick.label),
        h("div", { class: "chips wrap" },
          list.map(a => h("button", { type: "button", class: "chip", "aria-pressed": String(f.account === a.id), on: { click: () => { f.account = a.id; drawAcc(); refresh(); } } }, h("span", { class: "chip-cur" }, curSymbol(a.currency)), a.name)),
          h("button", { type: "button", class: "chip", "aria-pressed": String(!f.account), on: { click: () => { f.account = null; drawAcc(); refresh(); } } }, "Don't move money")));
    };
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
      preview.textContent = !v ? " " : over ? `That's more than the ${fmt(max, cur, { show: true })} balance.` : previewFor(v, f.account);
      preview.classList.toggle("bad", !!over);
    };
    const pad = amountPad(cur, () => f.amount, v => { f.amount = v; }, refresh);
    const setQuick = n => { f.amount = String(n); refresh(); };
    body.append(display, preview,
      h("div", { class: "chips center" },
        quick.map(n => h("button", { type: "button", class: "chip", on: { click: () => setQuick(n) } }, fmt(n, cur, { show: true, compact: true }))),
        max ? h("button", { type: "button", class: "chip", on: { click: () => setQuick(max) } }, "All of it") : null),
      accRow,
      h("input", { id: "f-anote", class: "input", maxlength: "200", autocomplete: "off", enterkeyhint: "done", placeholder: settings().noteRequired ? "What is it for?" : "Add a note (optional)", "aria-label": "Note", on: { input: e => { f.note = e.target.value; } } }),
      pad);
    body.addEventListener("submit", ev => {
      ev.preventDefault();
      const v = parseAmt(f.amount);
      if (!v) return fail(null, "Type the amount on the number pad first.", display);
      if (max != null && v > max) return fail(null, `That's more than the ${fmt(max, cur, { show: true })} balance.`, display);
      if (settings().noteRequired && !f.note.trim()) return fail(null, "Write a short note so you remember what it was.", body.querySelector("#f-anote"));
      onSave(v, f.note.trim().slice(0, 200) || null, f.account);
    });
    drawAcc();
    refresh();
    openSheet(title, body, save, { fill: true });
  }

  function txnSheet(x, preset) {
    const st = settings();
    const accounts = rows("accounts").filter(a => !a.archived || (x && (a.id === x.account_id || a.id === x.to_account_id))).sort(bySort);
    if (!accounts.length) { toast("Add an account first."); go("settings"); return; }
    const lastAcc = k => { const id = store.get("lastAcc:" + k, null); return acc(id) && !acc(id).archived ? id : null; };
    const defAcc = () => { const id = storedSettings().defAcc; return id && acc(id) && !acc(id).archived ? id : null; };
    const f = x
      ? { kind: x.kind, amount: String(Number(x.amount)), account: x.account_id, to: x.to_account_id, toAmount: x.to_amount != null ? String(Number(x.to_amount)) : "", toTouched: true, category: x.category_id, date: x.occurred_on, note: x.note || "", repeat: false }
      : { kind: "expense", amount: "", account: null, to: null, toAmount: "", toTouched: false, category: null, date: today(), note: "", repeat: false };
    f.receipt = x ? x.receipt || null : null;
    f.blob = null;
    let scanning = false;
    const scanInput = h("input", { type: "file", accept: "image/*", hidden: true, on: { change: async e => {
      const file = e.target.files && e.target.files[0];
      e.target.value = "";
      if (!file || scanning) return;
      scanning = true; draw();
      try {
        track("add", "receipt_scan");
        const [res, blob] = await Promise.all([readReceipt(file), shrinkImage(file)]);
        if (blob) f.blob = blob;
        if (res.currency && acc(f.account) && acc(f.account).currency !== res.currency) {
          const same = accounts.find(o => o.currency === res.currency);
          if (same) f.account = same.id;
        }
        if (res.amount) f.amount = String(roundCur(res.amount, (acc(f.account) || accounts[0]).currency));
        if (res.date) f.date = res.date;
        if (res.shop && !f.note.trim()) f.note = res.shop;
        toast(res.amount ? "Filled in from the receipt. Check the amount before saving." : "Couldn't find the total. Type it in, the photo is attached.", res.amount ? undefined : "error");
      } catch { toast("Couldn't read the receipt. Type it in instead.", "error"); }
      scanning = false; draw();
    } } });
    const receiptInput = h("input", { type: "file", accept: "image/*", hidden: true, on: { change: async e => {
      const file = e.target.files && e.target.files[0];
      e.target.value = "";
      if (!file) return;
      const blob = await shrinkImage(file);
      if (!blob) return toast("That photo couldn't be read. Try another one.", "error");
      f.blob = blob;
      draw();
    } } });
    f.person = null;
    f.lmode = "out";
    if (!x && preset) Object.assign(f, preset);
    if (x && curDec(x.currency) === 0) f.amount = String(Math.round(Number(x.amount)));
    const usage = new Map();
    const cutoff = ymd(new Date(Date.now() - 90 * 864e5));
    for (const t of rows("transactions")) if (t.category_id && t.occurred_on >= cutoff) usage.set(t.category_id, (usage.get(t.category_id) || 0) + 1);
    const body = h("form", { class: "form txn", id: "txn-form", novalidate: true });
    const err = h("p", { class: "form-err", role: "alert" });
    const saveBtn = h("button", { type: "submit", class: "btn", form: "txn-form" });
    let armedDelete = false;
    let panel = "none";
    let showAll = false, typeMenu = false, attn = false, step = "amt", lastStep = "amt", catQ = "";
    const needsNote = () => noteRule(f) && !x && f.kind !== "transfer";
    const isCross = () => { const fa = acc(f.account), ft = f.kind === "transfer" ? acc(f.to) : null; return !!(fa && ft && ft.currency !== fa.currency); };
    const canSave = () => {
      const noteOk = !(needsNote() && !f.note.trim());
      if (f.kind === "expense" || f.kind === "income") return !!f.category && noteOk;
      if (f.kind === "transfer") return !!f.to && !isCross();
      return !!loanPerson() && noteOk;
    };
    const goStep = k => { step = k; err.textContent = ""; panel = "none"; typeMenu = false; draw(); const sb = body.closest(".sheet-body"); if (sb) sb.scrollTop = 0; };
    const bal = balances();

    const pick = () => {
      if (!f.account || !acc(f.account)) f.account = (f.kind === "expense" && defAcc()) || lastAcc(f.kind) || accounts[0].id;
      if (f.kind === "transfer" && (!f.to || f.to === f.account || !acc(f.to))) {
        const other = accounts.find(a => a.id !== f.account && a.kind === "savings") || accounts.find(a => a.id !== f.account);
        f.to = other ? other.id : null;
      }
      if (f.kind !== "transfer" && f.category && (!cat(f.category) || cat(f.category).kind !== f.kind)) f.category = null;
      if (!x && !f.repeatTouched) {
        const sal = f.kind === "income" && isSalaryCat(cat(f.category));
        if (sal && !f.repeat && !rows("rules").some(r => r.active && isSalaryRule(r))) { f.repeat = true; f.repeatAuto = true; }
        else if (!sal && f.repeatAuto) { f.repeat = false; f.repeatAuto = false; }
      }
      if (f.person && !S.data.people.get(f.person)) f.person = null;
    };
    const loanPerson = () => f.kind === "loan" && f.person ? S.data.people.get(f.person) : null;
    const loanOut = () => f.lmode !== "in";
    const loanNet = p => netMine(p, loanBalances().get(p.id) || 0);
    const loanLabel = p => !p ? (f.lmode === "in" ? "Money I got" : "Money I gave") : f.lmode === "in" ? `${p.name} ${tr("gave me")}` : `${tr("I gave")} ${p.name}`;
    const convertFor = (amount, from, to) => roundCur(convert(amount, from, to), to);

    const setKind = k => { f.kind = k; if (!x) f.account = null; f.toTouched = false; f.category = null; typeMenu = false; panel = "none"; attn = false; step = "amt"; draw(); };
    const draw = () => {
      pick();
      body.dataset.kind = f.kind;
      const a = acc(f.account);
      const cur = a.currency;
      if (curDec(cur) === 0 && f.amount.includes(".")) f.amount = f.amount.split(".")[0];
      const to = f.kind === "transfer" ? acc(f.to) : null;
      const cross = to && to.currency !== cur;
      const display = amountDisplay(cur, "");
      const preview = h("p", { class: "preview num" });
      const afterEl = h("p", { class: "tx-after num" });
      const toInput = cross ? h("input", { id: "f-toamt", class: "input num", inputmode: "decimal", autocomplete: "off", value: f.toAmount, on: { input: e => { f.toAmount = e.target.value; f.toTouched = true; } } }) : null;
      const refresh = () => {
        display.set(f.amount);
        const v = parseAmt(f.amount);
        if (v && cross && !f.toTouched) { f.toAmount = String(convertFor(v, cur, to.currency)); toInput.value = f.toAmount; }
        const conv = !v || cur === mainCur() ? "" : `≈ ${money(toMain(v, cur), { show: true })}`;
        preview.textContent = conv || "\u00a0";
        if (!x && f.kind !== "loan") {
          const cb = bal.get(a.id) || 0, sign = f.kind === "income" ? 1 : -1;
          afterEl.replaceChildren(...[h("span", null, tr(v ? "Balance after" : "Balance")), v ? h("b", { class: "nx" + (cb + sign * v < 0 ? " neg" : "") }, fmt(cb + sign * v, cur, { show: true })) : h("b", null, fmt(cb, cur, { show: true }))]);
        } else afterEl.hidden = true;
        const verb = { expense: "Save", income: "Save", transfer: "Move", loan: "Save" }[f.kind];
        const ready = step === "det" || canSave();
        const nextLabel = f.kind === "expense" || f.kind === "income" ? "Choose category" : f.kind === "loan" ? "Choose who" : "Next";
        saveBtn.textContent = !v ? tr("Enter an amount") : ready ? `${tr(verb)} ${fmt(v, cur, { show: true })}` : `${tr(nextLabel)} →`;
        saveBtn.className = "btn tx-save" + (!v ? " waiting" : ready ? "" : " next");
      };
      const pad = amountPad(cur, () => f.amount, v => { f.amount = v; }, refresh);
      const yest = ymd(new Date(Date.now() - 864e5));
      const dateText = f.date === today() ? "Today" : f.date === yest ? "Yesterday" : dayLabel(f.date);
      const lp = loanPerson();
      const needNote = noteRule(f) && !x && f.kind !== "transfer";
      const noteHint = f.kind === "expense" ? "Add a note, like what you bought" : f.kind === "income" ? "Add a note, like who sent it" : f.kind === "loan" ? "What is it for?" : "Add a note";
      const open = k => { err.textContent = ""; panel = panel === k ? "none" : k; draw(); };
      const accDot = o => h("span", { class: "tx-dot k-" + (KIND_ICON[o.kind] ? o.kind : "cash") }, icon(KIND_ICON[o.kind] || "cash", "ico sm"));
      const accList = (value, onPick, exclude) => h("div", { class: "pick-list" }, accounts.filter(o => o.id !== exclude).map(o =>
        h("button", { type: "button", class: "pick-row", "aria-pressed": String(o.id === value), on: { click: () => onPick(o.id) } },
          accDot(o), h("span", { class: "pick-name" }, o.name), h("span", { class: "pick-end num" }, fmt(bal.get(o.id) || 0, o.currency)))));
      let panelEl = null;
      if (panel === "acc") panelEl = accList(f.account, id => { f.account = id; f.toTouched = false; panel = "none"; draw(); });
      else if (panel === "to" && f.kind === "transfer") panelEl = accList(f.to, id => { f.to = id; f.toTouched = false; panel = "none"; draw(); }, f.account);
      else if (panel === "date") {
        const day = (label, d) => h("button", { type: "button", class: "pick-row", "aria-pressed": String(f.date === d), on: { click: () => { f.date = d; panel = "none"; draw(); } } }, h("span", { class: "pick-name" }, label));
        panelEl = h("div", { class: "pick-list" }, day("Today", today()), day("Yesterday", yest),
          h("label", { class: "pick-row date-row", "aria-pressed": String(f.date !== today() && f.date !== yest) }, h("span", { class: "pick-name" }, "Another day"),
            h("input", { id: "f-date", class: "input", type: "date", value: f.date, max: ymd(new Date(Date.now() + 366 * 864e5)), "aria-label": "Pick another date", on: { change: e => { if (DATE_RE.test(e.target.value)) { f.date = e.target.value; panel = "none"; draw(); } } } })));
      } else panel = "none";

      const adj = !x && f.adjust ? acc(f.account) : null;
      const isLoan = f.kind === "loan", isMove = f.kind === "transfer";
      const top = adj
        ? h("div", { class: "adjust-note" + (f.kind === "income" ? " up" : " down") }, icon(f.kind === "income" ? "up" : "down", "ico sm"),
          h("span", null, h("strong", null, `${adj.name}: ${fmt(f.adjust.from, adj.currency, { show: true })} → ${fmt(f.adjust.to, adj.currency, { show: true })}`),
            h("small", null, f.kind === "income" ? "Pick where this money came from, then save." : "Pick what this money was used for, then save.")))
        : x ? null
        : h("div", { class: "tx-type", role: "tablist" },
          h("button", { type: "button", class: "tx-tab" + (f.kind === "expense" ? " on" : ""), role: "tab", "aria-selected": String(f.kind === "expense"), on: { click: () => setKind("expense") } }, "Spent"),
          h("button", { type: "button", class: "tx-tab" + (f.kind === "income" ? " on" : ""), role: "tab", "aria-selected": String(f.kind === "income"), on: { click: () => setKind("income") } }, "Received"),
          h("button", { type: "button", class: "tx-tab" + (isMove || isLoan ? " on" : "") + (typeMenu ? " open" : ""), "aria-expanded": String(typeMenu), on: { click: () => { typeMenu = !typeMenu; draw(); } } }, isMove ? "Moved" : isLoan ? "Loan" : "More", icon("down", "ico sm")));
      const menuItem = (ic, title, sub, fn, disabled) => h("button", { type: "button", class: "tx-menu-item", disabled: !!disabled, on: { click: fn } }, h("span", { class: "tx-menu-ico" }, icon(ic, "ico sm")), h("span", null, h("strong", null, title), h("small", null, sub)));
      const menu = typeMenu ? h("div", { class: "tx-menu" },
        menuItem("swap", "Moved between my accounts", "Like cash to the bank, or to savings", () => setKind("transfer"), accounts.length < 2),
        menuItem("coin", "Money with a person", "You gave someone money, or they gave you", () => setKind("loan")),
        menuItem("people", "Split a bill with friends", "Dinner, rent, a trip…", () => { closeSheet(); go("people"); setTimeout(newGroupSheet, 350); }),
        menuItem("bell", "A bill to pay every month", "Generator, internet, rent… with a reminder", () => { closeSheet(); setTimeout(() => billSheet(null), 350); }),
        menuItem("coin", "Gold, crypto or stocks", "Track what they're worth with live prices", () => { closeSheet(); setTimeout(() => holdingSheet(null), 350); })) : null;

      const chip = (k, lead, text) => h("button", { type: "button", class: "tx-chip" + (panel === k ? " on" : ""), "aria-expanded": String(panel === k), on: { click: () => open(k) } }, lead, h("span", null, text), icon("down", "ico sm"));
      const metas = h("div", { class: "tx-metas" },
        isMove ? [chip("acc", accDot(a), a.name), h("span", { class: "tx-arrow" }, "→"), chip("to", to ? accDot(to) : icon("plus", "ico sm"), to ? to.name : "Choose")]
          : chip("acc", accDot(a), `${f.kind === "income" || (isLoan && !loanOut()) ? "Into" : "From"} ${a.name}`),
        chip("date", icon("cal", "ico sm"), dateText));

      let pickArea = null;
      if (f.kind === "expense" || f.kind === "income") {
        const cats = rows("categories").filter(c => c.kind === f.kind).sort((p, q) => (usage.get(q.id) || 0) - (usage.get(p.id) || 0) || bySort(p, q));
        const q = catQ.trim().toLowerCase();
        const shown = q ? cats.filter(c => tr(c.name).toLowerCase().includes(q) || c.name.toLowerCase().includes(q)) : cats;
        pickArea = h("section", { class: "tx-pick tiles" + (attn ? " attn" : "") },
          cats.length > 9 ? h("label", { class: "cat-search" }, icon("search", "ico sm"), h("input", { id: "f-catq", class: "note-input", type: "search", autocomplete: "off", enterkeyhint: "done", placeholder: f.kind === "expense" ? "Search what it was for" : "Search where it came from", value: catQ, "aria-label": "Search categories", on: { input: e => { catQ = e.target.value; draw(); }, keydown: e => { if (e.key === "Enter") { e.preventDefault(); e.target.blur(); } } } })) : null,
          h("div", { class: "cat-tiles" },
            shown.map(c => h("button", { type: "button", class: "cat-tile bubble" + (c.id === f.category ? " on" : ""), style: { "--c": c.color }, "aria-pressed": String(c.id === f.category), on: { click: () => { f.category = c.id; attn = false; err.textContent = ""; catQ = ""; draw(); if (needsNote() && !f.note.trim()) { const n = document.getElementById("f-note"); if (n) n.focus(); } else { saveBtn.classList.remove("ready"); void saveBtn.offsetWidth; saveBtn.classList.add("ready"); } } } },
              h("span", { class: "bubble-ico" }, catGlyph(c, "ico")), h("span", { class: "bubble-name" }, c.name), c.id === f.category ? h("i", { class: "ct-check" }, icon("check", "ico sm")) : null))),
          shown.length ? null : h("p", { class: "hint center" }, "No category with that name."));
      } else if (isLoan) {
        const lb = loanBalances();
        const people = rows("people").filter(p => !(linkOf(p) && (LINKED.get(p.id) || {}).viewOnly)).sort((p, q) => Math.abs(toMain(lb.get(q.id) || 0, q.currency)) - Math.abs(toMain(lb.get(p.id) || 0, p.currency)) || bySort(p, q));
        const choice = (mode, label) => h("button", { type: "button", class: "tx-tab" + (f.lmode === mode ? " on" : ""), on: { click: () => { f.lmode = mode; draw(); } } }, label);
        pickArea = h("section", { class: "tx-pick" + (attn ? " attn" : "") },
          h("h3", null, "With who?"),
          h("div", { class: "bubbles" },
            people.map((p, i) => h("button", { type: "button", class: "bubble" + (p.id === f.person ? " on" : ""), style: { "--c": COLORS[(p.sort || i) % COLORS.length] }, on: { click: () => { f.person = p.id; const la = loanAccount(p); if (la) f.account = la; attn = false; f.adding = false; draw(); } } },
              h("span", { class: "bubble-ico letter" }, p.name.charAt(0).toUpperCase()), h("span", { class: "bubble-name" }, p.name))),
            h("button", { type: "button", class: "bubble more" + (f.adding ? " on" : ""), on: { click: () => { f.adding = !f.adding; draw(); } } }, h("span", { class: "bubble-ico" }, icon("plus", "ico")), h("span", { class: "bubble-name" }, "Someone new"))),
          f.adding ? h("div", { class: "new-person" },
            h("input", { id: "f-newp", class: "input", maxlength: "40", autocomplete: "off", placeholder: "Their name", value: f.newName || "", on: { input: e => { f.newName = e.target.value; } } }),
            h("div", { class: "two" }, [["owes_me", "I gave them"], ["i_owe", "They gave me"]].map(([dir, label]) => h("button", { type: "button", class: "btn alt sm", on: { click: () => {
              const name = String(f.newName || "").trim().replace(/\s+/g, " ").slice(0, 40);
              if (!name) return fail(err, "Type the person's name first.", document.getElementById("f-newp"));
              const p = { id: newId(), name, direction: dir, currency: a.currency, phone: null, share_token: null, sort: Math.max(-1, ...rows("people").map(r => r.sort || 0)) + 1 };
              put("people", p);
              f.person = p.id; f.lmode = dir === "owes_me" ? "out" : "in"; f.newName = ""; f.adding = false; attn = false; draw();
            } } }, label)))) : null,
          lp ? h("div", { class: "tx-type small" }, choice("out", `${tr("I gave")} ${lp.name}`), choice("in", `${lp.name} ${tr("gave me")}`)) : null);
      }

      const camBtn = f.kind !== "transfer" && !isLoan
        ? h("button", { type: "button", class: "tx-cam" + (f.blob || f.receipt ? " on" : ""), "aria-label": f.blob || f.receipt ? "Receipt attached" : "Scan or attach a receipt", disabled: scanning, on: { click: () => {
          if (f.blob) { f.blob = null; return draw(); }
          if (f.receipt) return receiptViewer(f.receipt, () => { f.receipt = null; draw(); });
          (!x && f.kind === "expense" ? scanInput : receiptInput).click();
        } } }, scanning ? h("span", { class: "spinner", "aria-hidden": "true" }) : icon(f.blob || f.receipt ? "check" : "cam", "ico sm"))
        : null;
      const noteRow = h("label", { class: "tx-note" + (needNote && !f.note.trim() ? " need" : "") }, icon("note", "ico sm"),
        h("input", { id: "f-note", class: "note-input", maxlength: "200", autocomplete: "off", enterkeyhint: "done", placeholder: noteHint, value: f.note, "aria-label": "Note",
          on: { input: e => { f.note = e.target.value; if (f.note.trim()) err.textContent = ""; e.target.parentNode.classList.toggle("need", needNote && !f.note.trim()); }, keydown: e => { if (e.key === "Enter") { e.preventDefault(); e.target.blur(); } },
            focus: () => { clearTimeout(body.__noteT); body.classList.add("noting"); const sb = body.closest(".sheet-body"); if (sb) requestAnimationFrame(() => { sb.scrollTop = 0; }); },
            blur: () => { clearTimeout(body.__noteT); body.__noteT = setTimeout(() => body.classList.remove("noting"), 120); } } }),
        camBtn, scanInput, receiptInput);
      const sugs = (() => {
        if (f.kind === "transfer") return null;
        const cnt = new Map();
        for (const t of rows("transactions")) {
          if (!t.note || t.occurred_on < cutoff) continue;
          if (f.category ? t.category_id !== f.category : t.kind !== f.kind) continue;
          const n = String(t.note).trim(); if (!n || n.length > 40) continue;
          const k = n.toLowerCase(); const c = cnt.get(k); cnt.set(k, c ? { n: c.n, c: c.c + 1 } : { n, c: 1 });
        }
        const list = [...cnt.values()].sort((p, q) => q.c - p.c).slice(0, 8);
        if (!list.length) return null;
        return h("div", { class: "tx-sugs" }, list.map(o => h("button", { type: "button", class: "tx-sug", on: { pointerdown: e => { e.preventDefault(); const inp = document.getElementById("f-note"); f.note = o.n; if (inp) { inp.value = o.n; inp.parentNode.classList.remove("need"); } err.textContent = ""; }, mousedown: e => e.preventDefault(), click: e => { e.preventDefault(); const inp = document.getElementById("f-note"); f.note = o.n; if (inp) inp.value = o.n; } } }, o.n)));
      })();
      const repeatChip = !x && !adj && (f.kind === "expense" || f.kind === "income")
        ? h("button", { type: "button", class: "tx-mini" + (f.repeat ? " on" : ""), "aria-pressed": String(f.repeat), on: { click: () => { f.repeat = !f.repeat; f.repeatTouched = true; draw(); } } }, icon("repeat", "ico sm"), "Every month")
        : null;

      const v0 = parseAmt(f.amount);
      const selCat = (f.kind === "expense" || f.kind === "income") && f.category ? cat(f.category) : null;
      const catChip = step === "amt" && v0 && selCat ? h("button", { type: "button", class: "tx-catchip", style: { "--c": selCat.color }, on: { click: () => goStep("det") } }, h("span", { class: "bubble-ico" }, catGlyph(selCat, "ico sm")), h("span", null, selCat.name), icon("fwd", "ico sm")) : null;
      const sign = f.kind === "expense" ? "−" : f.kind === "income" ? "+" : "";
      const back = h("button", { type: "button", class: "tx-back", "aria-label": "Change the amount", on: { click: () => goStep("amt") } },
        h("span", { class: "tx-back-ico" }, icon("back", "ico sm")),
        h("span", { class: "tx-back-amt num" }, `${sign}${fmt(v0 || 0, cur, { show: true })}`),
        h("span", { class: "tx-back-sub" }, `${isMove ? `${a.name} → ${to ? to.name : ""}` : a.name} · ${tr(dateText)}`));
      const extras = repeatChip || scanning ? h("div", { class: "tx-extras" }, repeatChip, scanning ? h("small", { class: "hint" }, "Reading the receipt…") : null) : null;
      const crossField = cross ? h("label", { class: "field" }, h("span", null, `${to.name} receives (${curSymbol(to.currency)})`), toInput, h("span", { class: "hint" }, `At ${fmt(1, cur, { show: true })} = ${fmt(convert(1, cur, to.currency), to.currency, { show: true })}. Change it if you got a different rate.`)) : null;
      const kids = step === "amt" ? [
        top, menu,
        h("div", { class: "tx-hero" }, h("div", { class: "tx-amount" }, display, preview), afterEl, metas, catChip),
        panelEl ? h("div", { class: "panel list inline" }, panelEl) : null,
        err,
        h("div", { class: "panel tx-pad" }, pad)
      ] : [
        back,
        pickArea,
        crossField,
        noteRow,
        sugs,
        extras,
        err
      ];
      body.dataset.step = step;
      if (lastStep !== step) { body.classList.remove("fwd", "bwd"); void body.offsetWidth; body.classList.add(step === "det" ? "fwd" : "bwd"); lastStep = step; }
      if (step === "amt") body.classList.remove("noting");
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
      if (!amount) { if (step !== "amt") goStep("amt"); fail(null, "Type the amount on the number pad first.", body.querySelector(".amount-display")); return; }
      if (step === "amt" && !canSave()) { goStep("det"); return; }
      if ((f.kind === "expense" || f.kind === "income") && !f.category) { attn = true; draw(); fail(err, f.kind === "expense" ? "Pick what it was for." : "Pick where it came from.", body.querySelector(".tx-pick")); return; }
      if (f.kind === "loan" && !loanPerson()) { attn = true; draw(); fail(err, "Pick who it's with.", body.querySelector(".tx-pick")); return; }
      if (!DATE_RE.test(f.date)) { fail(err, "Pick a date."); return; }
      if (noteRule(f) && !x && f.kind !== "transfer" && !f.note.trim()) { fail(err, f.adjust ? (f.kind === "income" ? "Write where this money came from." : "Write what this money was used for.") : "Write a short note so you remember what it was."); const n = document.getElementById("f-note"); if (n) n.focus(); return; }
      if (f.adjust && !x && !f.category) { attn = true; draw(); fail(err, f.kind === "income" ? "Pick what kind of money this is." : "Pick what it was spent on."); return; }
      if (f.kind === "loan") {
        const p = loanPerson();
        if (!p) return;
        const owed = loanBalances().get(p.id) || 0;
        const loanAmt = roundCur(convert(amount, a.currency, p.currency), p.currency);
        const delta = loanAmt * (loanOut() ? 1 : -1) * (owesMe(p) ? 1 : -1);
        const id = linkOf(p) ? sharedId() : newId(), now = new Date().toISOString(), note = f.note.trim().slice(0, 200) || null;
        const out = loanOut();
        saveLoan(p, { id, person_id: p.id, amount: delta, note, occurred_on: f.date, created_at: now }, [
          { t: "transactions", r: { id: `ln-${id}`, kind: out ? "loan_out" : "loan_in", amount: roundCur(amount, a.currency), currency: a.currency, rate: rateOf(a.currency), account_id: a.id, to_account_id: null, to_amount: null, category_id: null, note, occurred_on: f.date, rule_id: null, receipt: null, created_at: now } }]);
        store.set("lastAcc:loan", a.id);
        store.set("loanAcc:" + p.id, a.id);
        closeSheet();
        const next = owed + delta, nn = netMine(p, next);
        toast(Math.abs(next) < 0.005 ? `Saved. You and ${p.name} are settled.` : `Saved. ${nn > 0 ? `${p.name} owes you` : `You owe ${p.name}`} ${fmt(Math.abs(nn), p.currency, { show: true })}.`);
        return;
      }
      let toAmount = null;
      if (f.kind === "transfer") {
        const to = acc(f.to);
        if (!to || to.id === a.id) { fail(err, "Pick a different account to move money to."); return; }
        toAmount = to.currency === a.currency ? amount : parseAmt(f.toAmount);
        if (!toAmount) { fail(err, `Enter how much ${to.name} receives.`); return; }
      } else if (!f.category) return;
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
      const paidBill = !x && f.bill ? S.data.rules.get(f.bill) : null;
      if (paidBill && DATE_RE.test(paidBill.next_on)) items.push({ t: "rules", r: { ...paidBill, next_on: nextMonthDay(paidBill.next_on, paidBill.day) } });
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

  function balanceSheet(a) {
    const current = Math.round((balances().get(a.id) || 0) * 100) / 100;
    const f = { v: String(current) };
    const err = h("p", { class: "form-err", role: "alert" });
    const diffEl = h("p", { class: "hint num" });
    const showDiff = () => {
      const v = parseSigned(f.v);
      const d = v === null ? 0 : roundCur(v - current, a.currency);
      diffEl.textContent = v === null || !d ? tr("Type the amount the account has now.") : tr(d > 0 ? `That's ${fmt(d, a.currency, { show: true })} more. Next, you'll say where it came from.` : `That's ${fmt(-d, a.currency, { show: true })} less. Next, you'll say what it was used for.`);
    };
    const body = h("form", { class: "form", id: "bal-form", novalidate: true },
      h("p", { class: "hint" }, `${a.name} has ${fmt(current, a.currency, { show: true })} now. If that changed, enter the new amount and we'll record the difference as income or an expense, so your history stays right.`),
      h("label", { class: "field" }, h("span", null, `New balance (${curSymbol(a.currency)})`), h("input", { id: "f-newbal", class: "input num", inputmode: "decimal", autocomplete: "off", value: f.v, on: { input: e => { f.v = e.target.value; showDiff(); } } })),
      diffEl, err,
      h("button", { type: "button", class: "row-btn", on: { click: () => openingSheet(a) } }, "Change the starting balance instead"));
    showDiff();
    const btn = h("button", { type: "submit", class: "btn", form: "bal-form" }, "Continue");
    body.addEventListener("submit", ev => {
      ev.preventDefault();
      const v = parseSigned(f.v);
      if (v === null) return fail(err, "Enter the balance as a number, like 250 or -40.", document.getElementById("f-newbal"));
      const d = roundCur(v - current, a.currency);
      if (!d) { closeSheet(); return toast("No change. The balance is the same."); }
      txnSheet(null, { kind: d > 0 ? "income" : "expense", amount: String(Math.abs(d)), account: a.id, adjust: { from: current, to: roundCur(v, a.currency) } });
    });
    openSheet("Change balance", body, btn);
  }

  function openingSheet(a) {
    const f = { v: String(Number(a.opening_balance) || 0) };
    const err = h("p", { class: "form-err", role: "alert" });
    const body = h("form", { class: "form", id: "open-form", novalidate: true },
      h("p", { class: "hint" }, `The money ${a.name} had when you started using the app. Changing it moves the balance by the same amount. No note or category needed.`),
      h("label", { class: "field" }, h("span", null, `Starting balance (${curSymbol(a.currency)})`), h("input", { id: "f-open", class: "input num", inputmode: "decimal", autocomplete: "off", value: f.v, on: { input: e => { f.v = e.target.value; } } })),
      err);
    const btn = h("button", { type: "submit", class: "btn", form: "open-form" }, "Save");
    body.addEventListener("submit", ev => {
      ev.preventDefault();
      const v = parseSigned(f.v);
      if (v === null) return fail(err, "Enter the balance as a number, like 250 or -40.", document.getElementById("f-open"));
      put("accounts", { ...a, opening_balance: roundCur(v, a.currency) });
      closeSheet();
      toast(`Starting balance saved. ${a.name} now has ${fmt((balances().get(a.id) || 0), a.currency, { show: true })}.`);
    });
    openSheet("Starting balance", body, btn);
  }

  function accountSheet(a) {
    const bal = balances();
    const used = a ? rows("transactions").some(x => x.account_id === a.id || x.to_account_id === a.id) : false;
    const current = a ? bal.get(a.id) || 0 : 0;
    const f = { name: a ? a.name : "", currency: a ? a.currency : mainCur(), kind: a ? a.kind : "bank", balance: a ? String(Number(a.opening_balance) || 0) : "", rate: "" };
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
        h("label", { class: "field" }, h("span", null, a ? `Starting balance (${curSymbol(f.currency)})` : `Balance now (${curSymbol(f.currency)})`), h("input", { id: "f-abal", class: "input num", inputmode: "decimal", autocomplete: "off", placeholder: "0", value: f.balance, on: { input: e => { f.balance = e.target.value; } } }), a ? h("p", { class: "hint" }, `What ${a.name} had when you started. Everything else is calculated from your entries. Now: ${fmt(current, a.currency, { show: true })}.`) : null),
        a ? h("button", { type: "button", class: "btn alt", on: { click: () => balanceSheet(a) } }, "The balance changed? Record it") : null,
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
      const opening = Math.round(wanted * 100) / 100;
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
    const known = store.get("pushState", null);
    let state = known && known.state ? known.state : "off", time = PUSH.time || (known && known.time) || "21:00";
    try {
      if (!pushSupported()) state = /iPhone|iPad|iPod/.test(navigator.userAgent) && !isStandalone() ? "install" : "unsupported";
      else if (Notification.permission === "denied") state = "denied";
      else if (Notification.permission !== "granted") state = "off";
      else {
        const reg = await navigator.serviceWorker.getRegistration();
        const sub = reg ? await reg.pushManager.getSubscription() : null;
        if (reg && !sub) state = "off";
        else if (sub) {
          const { data, error } = await sb.from("push_subs").select("enabled, remind_at").eq("id", deviceId()).maybeSingle();
          if (!error) {
            if (data && data.remind_at) time = String(data.remind_at).slice(0, 5);
            state = data && data.enabled ? "on" : "off";
          }
        }
      }
    } catch { }
    if (state === "on" || state === "off") store.set("pushState", { state, time });
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
      PUSH.state = "on"; PUSH.time = time; store.set("pushState", { state: "on", time });
      toast(`Reminder set for ${time} every day.`);
    } catch {
      toast("Couldn't turn on notifications. Make sure BudgetSplit is opened from your Home Screen.", "error");
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
      PUSH.state = "off"; store.set("pushState", { state: "off", time: PUSH.time });
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
      : st === "install" ? "Add BudgetSplit to your Home Screen first, then open it from there."
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
    transactions: r => ["expense", "income", "transfer", "loan_out", "loan_in"].includes(r.kind) && Number(r.amount) > 0 && CUR_RE.test(String(r.currency)) && Number(r.rate) > 0 && DATE_RE.test(String(r.occurred_on)) && typeof r.account_id === "string",
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
      h("div", { class: "login-title" }, h("img", { class: "login-logo", src: "icons/icon-192-b.png", alt: "" }), h("h2", null, "Choose a new password"), h("p", null, S.email)),
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
    queueFx();
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
        rp: { name: "BudgetSplit", id: location.hostname },
        user: { id: new TextEncoder().encode(S.uid).slice(0, 64), name: S.email || "BudgetSplit", displayName: "BudgetSplit" },
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
    LOCK.el = h("div", { class: "lock", role: "dialog", "aria-modal": "true", "aria-label": "BudgetSplit is locked" },
      h("img", { class: "login-logo", src: "icons/icon-192-b.png", alt: "" }),
      h("h2", null, "BudgetSplit is locked"),
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
      secret.link = src.link || null;
      row.senc = !src.deleted_at && src.share_token && src.skey ? await sealWith(await shareKey(src.skey), { name: secret.name, currency: row.currency, direction: row.direction, from: settings().name || "" }) : null;
    }
    if (t === "loan_entries") {
      const p = S.data.people.get(src.person_id);
      row.senc = !src.deleted_at && p && p.share_token && p.skey ? await sealWith(await shareKey(p.skey), { id: row.id, amount: secret.amount, note: secret.note, date: row.occurred_on, at: src.created_at || null }) : null;
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
      if (t === "people") { r.skey = typeof secret.skey === "string" ? secret.skey : null; r.link = typeof secret.link === "string" ? secret.link : null; }
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
      h("div", { class: "login-title" }, h("div", { class: "orb-wrap" }, orb(210, "unlock-orb"), h("img", { class: "login-logo", src: "icons/icon-192-b.png", alt: "" })), h("h2", null, "Unlock your data"),
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
    queueFx();
    (oauth ? rec : pass).focus();
  }

  async function signOut() {
    S.armed = null;
    stopLive();
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
    try { localStorage.setItem("wallet:known", "1"); } catch { }
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
    try {
      const seen = localStorage.getItem("wallet:version");
      if (!localStorage.getItem("wallet:changesSeen")) localStorage.setItem("wallet:changesSeen", seen && cmpVer(seen, VERSION) < 0 ? seen : VERSION);
      localStorage.setItem("wallet:version", VERSION);
    } catch { }
    S.month = thisMonth();
    if (!CFG.supabaseUrl || !CFG.supabaseAnonKey || !window.supabase) return render();
    sb = window.supabase.createClient(CFG.supabaseUrl, CFG.supabaseAnonKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false, storageKey: "wallet-auth" }
    });
    const groupJoin = location.hash.match(/^#group=([A-Za-z0-9_-]{32,64}\.[A-Za-z0-9_-]{43})$/);
    if (groupJoin) { try { localStorage.setItem("wallet:joinGroup", groupJoin[1]); } catch { } history.replaceState(null, "", location.pathname); }
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
    if (S.session) { sync(); track("open", "start"); track("lang", LANG); setTimeout(checkAdmin, 4000); }
    if (S.session && location.hash === "#add") { history.replaceState(null, "", location.pathname); txnSheet(null); }
    if (S.session && location.hash === "#split") { history.replaceState(null, "", location.pathname); go("people"); }
    let reopen = null;
    try { reopen = sessionStorage.getItem("wallet:reopen"); sessionStorage.removeItem("wallet:reopen"); } catch { }
    if (S.session && reopen === "appearance") { go("settings"); settingsOpen("appearance"); }
  }

  window.addEventListener("online", () => { if (S.offline || !S.session) recover(); else sync(); renderStatus(); });
  window.addEventListener("offline", renderStatus);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") { LOCK.hiddenAt = Date.now(); flushTrack(); return; }
    if (S.session && LOCK.hiddenAt && Date.now() - LOCK.hiddenAt > 30 * 60000) track("open", "resume");
    if (S.uid && lockCfg() && LOCK.hiddenAt && Date.now() - LOCK.hiddenAt > 60000) showLock();
    if (S.offline) recover(); else sync();
    loadInbox(true);
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
  applyTheme();
  if (darkQuery.addEventListener) darkQuery.addEventListener("change", applyTheme);
  window.addEventListener("hashchange", () => { if (location.hash !== "#add" && location.hash !== "#split" && location.hash !== "") location.reload(); });
  if ("serviceWorker" in navigator) navigator.serviceWorker.addEventListener("message", e => {
    if (!e.data || !S.session) return;
    if (e.data.type === "open-add") txnSheet(null);
    if (e.data.type === "open-split") { closeSheet(); go("people"); }
    if (e.data.type === "open-home") { closeSheet(); loadInbox(true); go("home"); }
  });
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
  initSwipe();
  initSettingsSwipe();
  start();
})();

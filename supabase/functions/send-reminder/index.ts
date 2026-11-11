import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const APP_URL = "https://georgioaboudiwan.github.io/my-wallet/";
const APP_ORIGIN = "https://georgioaboudiwan.github.io";
const secretKeys = (() => { try { return JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") || "{}"); } catch { return {}; } })();
const serviceKey = secretKeys.default || Object.values(secretKeys)[0] || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const sb = createClient(Deno.env.get("SUPABASE_URL")!, String(serviceKey || ""), { auth: { persistSession: false, autoRefreshToken: false } });
const enc = new TextEncoder();

const cors = {
  "Access-Control-Allow-Origin": APP_ORIGIN,
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Vary": "Origin"
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

export const b64u = (buf: ArrayBuffer | Uint8Array) => {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};
export const unb64u = (s: string) => Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4)), c => c.charCodeAt(0));
const concat = (...parts: Uint8Array[]) => {
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let o = 0;
  for (const p of parts) { out.set(p, o); o += p.length; }
  return out;
};

async function hkdf(salt: Uint8Array, ikm: Uint8Array, info: Uint8Array, length: number) {
  const key = await crypto.subtle.importKey("raw", ikm, "HKDF", false, ["deriveBits"]);
  return new Uint8Array(await crypto.subtle.deriveBits({ name: "HKDF", hash: "SHA-256", salt, info }, key, length * 8));
}

export async function encryptPayload(p256dh: string, auth: string, payload: string) {
  const uaPublic = unb64u(p256dh);
  const authSecret = unb64u(auth);
  if (uaPublic.length !== 65 || authSecret.length !== 16) throw new Error("bad subscription keys");
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const local = await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"]);
  const asPublic = new Uint8Array(await crypto.subtle.exportKey("raw", local.publicKey));
  const uaKey = await crypto.subtle.importKey("raw", uaPublic, { name: "ECDH", namedCurve: "P-256" }, false, []);
  const shared = new Uint8Array(await crypto.subtle.deriveBits({ name: "ECDH", public: uaKey }, local.privateKey, 256));
  const ikm = await hkdf(authSecret, shared, concat(enc.encode("WebPush: info\0"), uaPublic, asPublic), 32);
  const cek = await hkdf(salt, ikm, enc.encode("Content-Encoding: aes128gcm\0"), 16);
  const nonce = await hkdf(salt, ikm, enc.encode("Content-Encoding: nonce\0"), 12);
  const key = await crypto.subtle.importKey("raw", cek, "AES-GCM", false, ["encrypt"]);
  const cipher = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv: nonce }, key, concat(enc.encode(payload), new Uint8Array([2]))));
  const header = new Uint8Array(21 + asPublic.length);
  header.set(salt, 0);
  new DataView(header.buffer).setUint32(16, 4096);
  header[20] = asPublic.length;
  header.set(asPublic, 21);
  return concat(header, cipher);
}

export async function vapidAuth(endpoint: string, publicKey: string, privateJwk: JsonWebKey) {
  const head = b64u(enc.encode(JSON.stringify({ typ: "JWT", alg: "ES256" })));
  const body = b64u(enc.encode(JSON.stringify({ aud: new URL(endpoint).origin, exp: Math.floor(Date.now() / 1000) + 12 * 3600, sub: APP_URL })));
  const key = await crypto.subtle.importKey("jwk", privateJwk, { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, key, enc.encode(`${head}.${body}`));
  return `vapid t=${head}.${body}.${b64u(sig)}, k=${publicKey}`;
}

type Keys = { public_key: string; private_jwk: JsonWebKey; cron_secret: string };
type Sub = { id: string; user_id: string; endpoint: string; p256dh: string; auth: string; remind_at: string; tz: string; last_sent: string | null };

async function loadKeys(): Promise<Keys> {
  const { data, error } = await sb.from("push_keys").select("public_key, private_jwk, cron_secret").eq("id", 1).single();
  if (error || !data) throw new Error(error ? `push_keys: ${error.message}` : "push_keys row missing");
  if (data.public_key && data.private_jwk) return data as Keys;
  const pair = await crypto.subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, true, ["sign", "verify"]);
  const public_key = b64u(await crypto.subtle.exportKey("raw", pair.publicKey));
  const { kty, crv, x, y, d } = await crypto.subtle.exportKey("jwk", pair.privateKey);
  const private_jwk = { kty, crv, x, y, d };
  const { error: upErr } = await sb.from("push_keys").update({ public_key, private_jwk }).eq("id", 1).is("public_key", null);
  if (upErr) throw upErr;
  const again = await sb.from("push_keys").select("public_key, private_jwk, cron_secret").eq("id", 1).single();
  return again.data as Keys;
}

async function push(keys: Keys, sub: Sub, message: { title: string; body: string }) {
  if (!/^https:\/\//.test(sub.endpoint)) return 400;
  const body = await encryptPayload(sub.p256dh, sub.auth, JSON.stringify({ ...message, url: APP_URL }));
  const res = await fetch(sub.endpoint, {
    method: "POST",
    headers: {
      Authorization: await vapidAuth(sub.endpoint, keys.public_key, keys.private_jwk),
      "Content-Encoding": "aes128gcm",
      "Content-Type": "application/octet-stream",
      TTL: "43200",
      Urgency: "high"
    },
    body
  });
  if (res.status === 404 || res.status === 410) await sb.from("push_subs").delete().eq("id", sub.id);
  return res.status;
}

function localNow(tz: string) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date()).map(p => [p.type, p.value]));
  return { date: `${parts.year}-${parts.month}-${parts.day}`, minutes: Number(parts.hour) * 60 + Number(parts.minute) };
}

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function nextDay(date: string) {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

async function dueTomorrow(userId: string, date: string) {
  const { count } = await sb.from("rules").select("id", { count: "exact", head: true }).eq("user_id", userId).eq("active", true).eq("next_on", nextDay(date)).is("deleted_at", null);
  return count ? ` ${count === 1 ? "A repeating entry is" : `${count} repeating entries are`} due tomorrow.` : "";
}

async function reminderFor(sub: Sub, date: string) {
  const [{ count }, due] = await Promise.all([
    sb.from("transactions").select("id", { count: "exact", head: true }).eq("user_id", sub.user_id).eq("occurred_on", date).is("deleted_at", null),
    dueTomorrow(sub.user_id, date).catch(() => "")
  ]);
  if (date.slice(8) === "01") {
    const prev = MONTHS[(Number(date.slice(5, 7)) + 10) % 12];
    return { title: `Your ${prev} summary is ready`, body: `See how ${prev} went against your plan.${due}` };
  }
  return count
    ? { title: "Anything else today?", body: `You logged ${count} ${count === 1 ? "entry" : "entries"} today. Tap to add anything you missed.${due}` }
    : { title: "Log today's spending", body: `Nothing logged yet today. Tap to add what you spent.${due}` };
}

Deno.serve(async req => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  if (req.method !== "POST") return json({ error: "method" }, 405);
  let keys: Keys;
  if (!serviceKey) return json({ error: "setup", detail: "No service key in the function environment" }, 500);
  try { keys = await loadKeys(); } catch (e) { console.error("loadKeys", e); return json({ error: "setup", detail: String((e as Error)?.message || e).slice(0, 200) }, 500); }

  const secret = req.headers.get("x-cron-secret");
  if (secret && secret === keys.cron_secret) {
    const { data: subs } = await sb.from("push_subs").select("id, user_id, endpoint, p256dh, auth, remind_at, tz, last_sent").eq("enabled", true);
    let sent = 0;
    for (const sub of (subs ?? []) as Sub[]) {
      let now;
      try { now = localNow(sub.tz); } catch { continue; }
      const [h, m] = sub.remind_at.split(":").map(Number);
      const due = h * 60 + m;
      if (now.minutes < due || now.minutes - due > 180 || sub.last_sent === now.date) continue;
      await sb.from("push_subs").update({ last_sent: now.date }).eq("id", sub.id);
      let status = 0;
      try { status = await push(keys, sub, await reminderFor(sub, now.date)); } catch (e) { console.error("push failed", String((e as Error)?.message || e).slice(0, 200)); }
      if (status >= 200 && status < 300) sent++; else console.error("push status", status, new URL(sub.endpoint).host);
      await sb.from("push_subs").update({ last_status: status }).eq("id", sub.id);
    }
    return json({ sent });
  }

  const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  if (!token) return json({ error: "unauthorized" }, 401);
  const { data: who, error: whoErr } = await sb.auth.getUser(token);
  if (!who?.user) return json({ error: "unauthorized", detail: whoErr?.message || "no user" }, 401);
  let body: Record<string, unknown> = {};
  try { body = await req.json(); } catch { body = {}; }
  if (body.action === "broadcast") {
    const { data: admin } = await sb.from("admins").select("user_id").eq("user_id", who.user.id).maybeSingle();
    if (!admin) return json({ error: "Not allowed." }, 403);
    const title = String(body.title ?? "").trim().slice(0, 60);
    const text = String(body.body ?? "").trim().slice(0, 180);
    if (!title || !text) return json({ error: "Write a title and a message." }, 400);
    const target = body.user_id ? String(body.user_id) : null;
    if (target && !/^[0-9a-f-]{36}$/i.test(target)) return json({ error: "Unknown user." }, 400);
    let q = sb.from("push_subs").select("id, user_id, endpoint, p256dh, auth, remind_at, tz, last_sent").eq("enabled", true);
    if (target) q = q.eq("user_id", target);
    const { data: subs } = await q;
    const list = (subs ?? []) as Sub[];
    const statuses = await Promise.all(list.map(sub => push(keys, sub, { title, body: text }).catch(() => 0)));
    const ok = statuses.filter(s => s >= 200 && s < 300).length;
    const people = new Set(list.filter((_, i) => statuses[i] >= 200 && statuses[i] < 300).map(sub => sub.user_id)).size;
    return json({ sent: ok, devices: list.length, people });
  }
  const { data: mine } = await sb.from("push_subs").select("id, user_id, endpoint, p256dh, auth, remind_at, tz, last_sent").eq("user_id", who.user.id).eq("enabled", true);
  const results: number[] = [];
  for (const sub of (mine ?? []) as Sub[]) {
    try { results.push(await push(keys, sub, { title: "Notifications are on", body: "You'll get a reminder every day to log what you spent." })); } catch { results.push(0); }
  }
  return json({ sent: results.filter(s => s >= 200 && s < 300).length, results });
});

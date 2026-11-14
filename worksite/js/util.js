export const pad = n => String(n).padStart(2, '0');
export const iso = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const toDate = s => new Date(s + 'T00:00:00');
export const addDays = (s, n) => { const d = toDate(s); d.setDate(d.getDate() + n); return iso(d); };
export const today = () => iso(new Date());

export function startOf(period, s, weekStart = 1) {
  const d = toDate(s);
  if (period === 'week') d.setDate(d.getDate() - ((d.getDay() - weekStart + 7) % 7));
  if (period === 'month') d.setDate(1);
  return iso(d);
}

export function range(period, anchor, weekStart) {
  const start = startOf(period, anchor, weekStart);
  let end = start;
  if (period === 'week') end = addDays(start, 6);
  if (period === 'month') { const d = toDate(start); end = iso(new Date(d.getFullYear(), d.getMonth() + 1, 0)); }
  return { start, end };
}

export function shift(period, anchor, dir) {
  if (period === 'day') return addDays(anchor, dir);
  if (period === 'week') return addDays(anchor, 7 * dir);
  const d = toDate(anchor);
  return iso(new Date(d.getFullYear(), d.getMonth() + dir, 1));
}

export function daysIn(start, end) {
  const out = [];
  for (let d = start; d <= end; d = addDays(d, 1)) out.push(d);
  return out;
}

export const round2 = n => Math.round((Number(n) || 0) * 100) / 100;

export function h(tag, attrs, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else if (k === 'style') Object.assign(el.style, v);
    else if (k in el && typeof v !== 'string') el[k] = v;
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const c of kids.flat(Infinity)) {
    if (c == null || c === false) continue;
    el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  return el;
}

export function csv(rows) {
  const cell = v => {
    let s = v == null ? '' : String(v);
    if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
    return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return '﻿' + rows.map(r => r.map(cell).join(',')).join('\r\n');
}

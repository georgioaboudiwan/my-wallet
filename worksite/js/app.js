import { t, setLang, getLang } from './i18n.js';
import { createStore, configured } from './store.js';
import { h, iso, today, toDate, addDays, range, shift, daysIn, round2, csv, startOf } from './util.js';

const root = document.getElementById('app');
const S = { store: null, data: null, view: 'dashboard', period: 'week', anchor: today(), workerId: null, q: '' };

const nf = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 });
const nf0 = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });
const usd = n => (n < 0 ? '-$' : '$') + nf.format(Math.abs(round2(n)));
const lbp = n => nf0.format(Math.round(n * S.data.biz.lbp_rate)) + ' LBP';
const lbpRaw = n => nf0.format(Math.round(n)) + ' LBP';
const daysTxt = n => nf.format(round2(n));

const workerById = id => S.data.workers.find(w => w.id === id);
const siteById = id => S.data.sites.find(s => s.id === id);
const activeWorkers = () => S.data.workers.filter(w => w.active).sort((a, b) => a.name.localeCompare(b.name));
const activeSites = () => S.data.sites.filter(s => s.active);
const inRange = (d, r) => d >= r.start && d <= r.end;
const curRange = () => range(S.period, S.anchor, S.data.biz.week_start);
const worked = e => e.status === 'worked';
const sum = (arr, f) => arr.reduce((a, x) => a + (Number(f(x)) || 0), 0);

function stats(workerId, r) {
  const es = S.data.entries.filter(e => (!workerId || e.worker_id === workerId) && (!r || inRange(e.day, r)));
  const ps = S.data.payments.filter(p => (!workerId || p.worker_id === workerId) && (!r || inRange(p.paid_on, r)));
  const earned = sum(es, e => e.amount);
  const paid = sum(ps, p => p.amount);
  return { days: sum(es.filter(worked), e => e.days), earned, paid, left: earned - paid, entries: es, payments: ps };
}
const balance = id => stats(id).left;

function toast(msg, bad) {
  const el = h('div', { class: 'toast' + (bad ? ' bad' : ''), role: 'status' }, msg);
  document.body.append(el);
  requestAnimationFrame(() => el.classList.add('show'));
  setTimeout(() => { el.classList.remove('show'); setTimeout(() => el.remove(), 300); }, 2400);
}

function fail(err) {
  console.error(err);
  const msg = err?.message && err.message.length < 140 ? err.message : t('error');
  toast(msg, true);
}

function icon(name) {
  const paths = {
    dashboard: 'M3 13h8V3H3zm10 8h8V11h-8zM3 21h8v-6H3zm10-18v6h8V3z',
    planner: 'M7 2v2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2V2h-2v2H9V2zm-2 8h14v10H5zm2 2v2h2v-2zm4 0v2h2v-2zm4 0v2h2v-2z',
    workers: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm0 2c-4 0-8 2-8 5v1h16v-1c0-3-4-5-8-5z',
    payments: 'M2 6a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2zm2 2v2h16V8zm0 6v4h16v-4zm2 1h5v2H6z',
    settings: 'M19.4 13a7.5 7.5 0 0 0 0-2l2.1-1.6-2-3.5-2.5 1a7.6 7.6 0 0 0-1.7-1L15 3h-4l-.3 2.9a7.6 7.6 0 0 0-1.7 1l-2.5-1-2 3.5L6.6 11a7.5 7.5 0 0 0 0 2l-2.1 1.6 2 3.5 2.5-1a7.6 7.6 0 0 0 1.7 1L11 21h4l.3-2.9a7.6 7.6 0 0 0 1.7-1l2.5 1 2-3.5zM13 15.5a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7z',
    plus: 'M11 5h2v6h6v2h-6v6h-2v-6H5v-2h6z',
    left: 'M15.4 7.4 14 6l-6 6 6 6 1.4-1.4L10.8 12z',
    right: 'M8.6 16.6 10 18l6-6-6-6-1.4 1.4 4.6 4.6z',
    back: 'M20 11H7.8l5.6-5.6L12 4l-8 8 8 8 1.4-1.4L7.8 13H20z',
    edit: 'M3 17.2V21h3.8L17.8 9.9l-3.7-3.7zM20.7 7a1 1 0 0 0 0-1.4l-2.3-2.3a1 1 0 0 0-1.4 0l-1.8 1.8 3.7 3.7z',
    phone: 'M6.6 10.8a15 15 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.2 11.4 11.4 0 0 0 3.6.6 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.2.2 2.4.6 3.6a1 1 0 0 1-.3 1z',
    copy: 'M16 1H4a2 2 0 0 0-2 2v14h2V3h12zm3 4H8a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2zm0 16H8V7h11z',
    check: 'M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z',
    helmet: 'M12 3a8 8 0 0 0-8 8v3H2v3h20v-3h-2v-3a8 8 0 0 0-6-7.7V7h-2V3.1A8 8 0 0 0 12 3zm-2 .3V7H8V4.4a8 8 0 0 1 2-1.1z'
  };
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('aria-hidden', 'true');
  svg.classList.add('ico');
  const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  p.setAttribute('d', paths[name]);
  svg.append(p);
  return svg;
}

function periodLabel() {
  const r = curRange();
  const M = t('months');
  const s = toDate(r.start), e = toDate(r.end);
  if (S.period === 'day') return `${t('weekdays')[s.getDay()]} ${s.getDate()} ${M[s.getMonth()]}`;
  if (S.period === 'month') return `${M[s.getMonth()]} ${s.getFullYear()}`;
  return s.getMonth() === e.getMonth()
    ? `${s.getDate()}–${e.getDate()} ${M[s.getMonth()]}`
    : `${s.getDate()} ${M[s.getMonth()]} – ${e.getDate()} ${M[e.getMonth()]}`;
}

function periodBar() {
  const seg = h('div', { class: 'seg', role: 'tablist' },
    ['day', 'week', 'month'].map(p => h('button', {
      class: S.period === p ? 'on' : '', role: 'tab', 'aria-selected': String(S.period === p),
      onclick: () => { S.period = p; render(); }
    }, t(p))));
  const r = curRange();
  const isNow = inRange(today(), r);
  return h('div', { class: 'periodbar' }, seg,
    h('div', { class: 'pnav' },
      h('button', { class: 'icon-btn flip', 'aria-label': 'previous', onclick: () => { S.anchor = shift(S.period, S.anchor, -1); render(); } }, icon('left')),
      h('span', { class: 'plabel' }, periodLabel()),
      h('button', { class: 'icon-btn flip', 'aria-label': 'next', onclick: () => { S.anchor = shift(S.period, S.anchor, 1); render(); } }, icon('right')),
      !isNow && h('button', { class: 'chip', onclick: () => { S.anchor = today(); render(); } }, t('today'))));
}

function kpi(label, value, sub, tone) {
  return h('div', { class: 'kpi ' + (tone || '') }, h('span', { class: 'kl' }, label), h('strong', { class: 'kv' }, value), sub && h('span', { class: 'ks' }, sub));
}

function empty(msg, action) {
  return h('div', { class: 'empty' }, icon('helmet'), h('p', null, msg), action);
}

function viewDashboard() {
  const r = curRange();
  const st = stats(null, r);
  const owed = sum(S.data.workers, w => Math.max(0, balance(w.id)));
  const td = S.data.entries.filter(e => e.day === today());
  const onSite = td.filter(e => e.status !== 'absent').length;
  const workedToday = td.filter(worked).length;

  const kpis = h('div', { class: 'kpis' },
    kpi(t('earned'), usd(st.earned), lbp(st.earned)),
    kpi(t('paid'), usd(st.paid), lbp(st.paid), 'good'),
    kpi(st.left >= 0 ? t('left') : t('advance'), usd(Math.abs(st.left)), lbp(Math.abs(st.left)), st.left > 0 ? 'warn' : 'good'),
    kpi(t('owed'), usd(owed), t('owedHint'), owed > 0 ? 'hot' : ''));

  const strip = h('div', { class: 'card today' },
    h('div', null, h('span', { class: 'kl' }, t('onSite')), h('strong', { class: 'big' }, `${onSite}`, h('small', null, ` / ${activeWorkers().length}`))),
    h('div', { class: 'dots' }, activeWorkers().map(w => {
      const e = td.find(x => x.worker_id === w.id);
      const cls = !e ? 'none' : e.status;
      return h('span', { class: 'dot ' + cls, title: w.name }, w.name.slice(0, 1).toUpperCase());
    })),
    h('button', { class: 'btn ghost sm', onclick: () => { S.view = 'planner'; S.period = 'day'; S.anchor = today(); render(); } },
      `${workedToday} ${t('worked')} →`));

  let bars;
  if (S.period === 'day') {
    bars = st.entries.filter(worked).map(e => ({ label: workerById(e.worker_id)?.name || '?', v: e.amount, key: e.worker_id }));
  } else {
    bars = daysIn(r.start, r.end).map(d => {
      const dt = toDate(d);
      return { label: S.period === 'week' ? t('weekdays')[dt.getDay()] : String(dt.getDate()), v: sum(st.entries.filter(e => e.day === d), e => e.amount), key: d, today: d === today() };
    });
  }
  const max = Math.max(1, ...bars.map(b => b.v));
  const chart = h('div', { class: 'card' },
    h('div', { class: 'card-h' }, h('h3', null, t('laborCost')), h('span', { class: 'muted' }, usd(st.earned))),
    bars.length ? h('div', { class: 'chart ' + S.period },
      bars.map(b => h('div', { class: 'bar' + (b.today ? ' now' : ''), title: `${b.label}: ${usd(b.v)}` },
        h('span', { class: 'bv' }, b.v ? nf0.format(b.v) : ''),
        h('span', { class: 'track' }, h('span', { class: 'bf', style: { height: `${(b.v / max) * 100}%` } })),
        h('span', { class: 'bl' }, b.label)))) : empty(t('noData')));

  const rows = activeWorkers().map(w => ({ w, s: stats(w.id, r), bal: balance(w.id) }))
    .filter(x => x.s.entries.length || x.s.payments.length || Math.abs(x.bal) > 0.009);
  const table = h('div', { class: 'card' },
    h('div', { class: 'card-h' }, h('h3', null, t('byWorker'))),
    rows.length ? h('div', { class: 'tbl-wrap' }, h('table', { class: 'tbl' },
      h('thead', null, h('tr', null, h('th', null, t('worker')), h('th', { class: 'n' }, t('days')), h('th', { class: 'n' }, t('earned')),
        h('th', { class: 'n' }, t('paid')), h('th', { class: 'n' }, t('left')), h('th', { class: 'n' }, t('balance')))),
      h('tbody', null, rows.map(({ w, s, bal }) => h('tr', { class: 'link', tabindex: '0', onclick: () => openWorker(w.id), onkeydown: ev => ev.key === 'Enter' && openWorker(w.id) },
        h('td', null, h('b', null, w.name), h('small', { class: 'muted block' }, w.trade || '')),
        h('td', { class: 'n' }, daysTxt(s.days)),
        h('td', { class: 'n' }, usd(s.earned)),
        h('td', { class: 'n good-t' }, usd(s.paid)),
        h('td', { class: 'n ' + (s.left > 0 ? 'warn-t' : '') }, usd(s.left)),
        h('td', { class: 'n ' + (bal > 0 ? 'hot-t' : bal < 0 ? 'good-t' : '') }, usd(bal))))),
      h('tfoot', null, h('tr', null, h('td', null, t('total')), h('td', { class: 'n' }, daysTxt(st.days)), h('td', { class: 'n' }, usd(st.earned)),
        h('td', { class: 'n' }, usd(st.paid)), h('td', { class: 'n' }, usd(st.left)), h('td', { class: 'n' }, usd(owed))))))
      : empty(S.data.workers.length ? t('noData') : t('noWorkers'), !S.data.workers.length && h('button', { class: 'btn', onclick: () => editWorker() }, t('addWorker'))));

  const bySite = new Map();
  st.entries.filter(worked).forEach(e => bySite.set(e.site_id || '', (bySite.get(e.site_id || '') || 0) + e.amount));
  const siteRows = [...bySite.entries()].sort((a, b) => b[1] - a[1]);
  const smax = Math.max(1, ...siteRows.map(x => x[1]));
  const sites = h('div', { class: 'card' },
    h('div', { class: 'card-h' }, h('h3', null, t('bySite'))),
    siteRows.length ? h('ul', { class: 'hbars' }, siteRows.map(([id, v]) => h('li', null,
      h('div', { class: 'hb-t' }, h('span', null, siteById(id)?.name || t('noSite')), h('b', null, usd(v))),
      h('div', { class: 'hb' }, h('span', { style: { width: `${(v / smax) * 100}%` } }))))) : empty(t('noData')));

  return h('div', { class: 'view' }, periodBar(), kpis, strip, h('div', { class: 'grid2' }, chart, sites), table,
    fab(t('addPayment'), () => editPayment()));
}

function cellCode(e) {
  if (!e) return { txt: '', cls: '' };
  if (e.status === 'planned') return { txt: '•', cls: 'planned' };
  if (e.status === 'absent') return { txt: '✕', cls: 'absent' };
  if (e.hours != null) return { txt: nf.format(e.hours) + t('hoursShort'), cls: 'worked part' };
  if (Number(e.days) === 1) return { txt: '1', cls: 'worked' };
  if (Number(e.days) === 0.5) return { txt: '½', cls: 'worked part' };
  return { txt: nf.format(e.days), cls: 'worked part' };
}

function entryLabel(e) {
  if (e.status !== 'worked') return t(e.status);
  if (e.hours != null) return `${nf.format(e.hours)} ${t('hours').toLowerCase()}`;
  if (Number(e.days) === 1) return t('full');
  if (Number(e.days) === 0.5) return t('half');
  return `${nf.format(e.days)} ${t('days').toLowerCase()}`;
}

function lastSite(workerId, before) {
  const e = S.data.entries.filter(x => x.worker_id === workerId && x.site_id && x.day <= before).sort((a, b) => b.day.localeCompare(a.day))[0];
  return e?.site_id || activeSites()[0]?.id || null;
}

async function quickSet(w, day, kind, extra = {}) {
  const ex = S.data.entries.find(e => e.worker_id === w.id && e.day === day);
  if (kind === 'clear') { if (ex) await removeRow('entries', ex.id); return; }
  const hpd = Number(S.data.biz.hours_per_day);
  const map = {
    full: { status: 'worked', days: 1, hours: null },
    half: { status: 'worked', days: 0.5, hours: null },
    hours: { status: 'worked', days: round3(extra.hours / hpd), hours: extra.hours },
    planned: { status: 'planned', days: 0, hours: null },
    absent: { status: 'absent', days: 0, hours: null }
  };
  await saveRow('entries', {
    id: ex?.id, worker_id: w.id, day, site_id: ex?.site_id ?? extra.site_id ?? lastSite(w.id, day),
    rate: ex?.rate ?? w.daily_rate, note: ex?.note ?? null, ...map[kind]
  }, true);
}
const round3 = n => Math.round(n * 1000) / 1000;

function viewPlanner() {
  const ws = activeWorkers();
  if (!ws.length) return h('div', { class: 'view' }, periodBar(), empty(t('noWorkers'), h('button', { class: 'btn', onclick: () => editWorker() }, t('addWorker'))));
  return h('div', { class: 'view' }, periodBar(), S.period === 'day' ? plannerDay(ws) : plannerGrid(ws));
}

function plannerDay(ws) {
  const day = S.anchor;
  const des = S.data.entries.filter(e => e.day === day);
  const planned = des.filter(e => e.status === 'planned');
  const cost = sum(des, e => e.amount);
  return h('div', null,
    h('div', { class: 'toolbar' },
      h('span', { class: 'muted' }, `${t('laborCost')}: `, h('b', null, usd(cost))),
      planned.length > 0 && h('button', { class: 'btn sm', onclick: () => bulkMark(planned) }, icon('check'), ` ${t('markWorked')} (${planned.length})`)),
    h('div', { class: 'daylist' }, ws.map(w => {
      const e = des.find(x => x.worker_id === w.id);
      const cur = !e ? 'none' : e.status === 'worked' ? (e.hours != null ? 'hours' : Number(e.days) === 1 ? 'full' : Number(e.days) === 0.5 ? 'half' : 'hours') : e.status;
      const opts = [['full', t('full')], ['half', t('half')], ['hours', t('hours')], ['absent', t('absent')]];
      const siteSel = siteSelect(e?.site_id ?? lastSite(w.id, day));
      siteSel.addEventListener('change', async () => {
        try {
          if (e) await saveRow('entries', { ...e, site_id: siteSel.value || null }, true);
          else await quickSet(w, day, 'planned', { site_id: siteSel.value || null });
          render();
        } catch (err) { fail(err); }
      });
      return h('div', { class: 'daycard ' + cur },
        h('div', { class: 'dc-top' },
          h('div', { class: 'who', onclick: () => openWorker(w.id) }, h('span', { class: 'av' }, w.name.slice(0, 1).toUpperCase()),
            h('div', null, h('b', null, w.name), h('small', { class: 'muted block' }, `${w.trade || ''} · ${usd(w.daily_rate)}${t('perDay')}`))),
          h('b', { class: 'dc-amt' }, e && e.amount ? usd(e.amount) : cur === 'planned' ? t('planned') : '')),
        h('div', { class: 'dc-row' },
          h('div', { class: 'seg small wrap' }, opts.map(([k, label]) => h('button', {
            class: cur === k ? 'on ' + k : '', onclick: async () => {
              try {
                if (k === 'hours') return askHours(w, day, e);
                await quickSet(w, day, cur === k ? 'planned' : k);
                render();
              } catch (err) { fail(err); }
            }
          }, k === 'hours' && cur === 'hours' && e ? `${nf.format(e.hours ?? e.days * S.data.biz.hours_per_day)}${t('hoursShort')}` : label))),
          siteSel,
          h('button', { class: 'icon-btn', 'aria-label': t('edit'), onclick: () => editEntry(w, day) }, icon('edit'))));
    })));
}

function siteSelect(value) {
  const s = h('select', { class: 'site-sel', 'aria-label': t('site') },
    h('option', { value: '' }, `— ${t('noSite')}`),
    S.data.sites.filter(x => x.active || x.id === value).map(x => h('option', { value: x.id }, x.name)));
  s.value = value || '';
  return s;
}

function askHours(w, day, e) {
  const input = h('input', { type: 'number', name: 'hours', inputmode: 'decimal', min: '0.25', max: '24', step: 'any', required: true, value: e?.hours ?? '' });
  const form = h('form', { class: 'form' },
    field(t('hours'), input),
    h('p', { class: 'muted' }, `${t('hoursPerDay')}: ${S.data.biz.hours_per_day} · ${usd(w.daily_rate)}${t('perDay')}`));
  sheet(`${w.name} · ${t('hours')}`, form, async () => {
    const hrs = Number(input.value);
    if (!(hrs > 0 && hrs <= 24)) throw new Error(t('hours'));
    await quickSet(w, day, 'hours', { hours: hrs });
  });
  setTimeout(() => input.focus(), 50);
}

async function bulkMark(list) {
  try {
    const rows = list.map(e => ({ ...e, status: 'worked', days: 1, hours: null }));
    const saved = await S.store.saveMany('entries', rows);
    merge('entries', saved);
    toast(t('marked', { n: saved.length }));
    render();
  } catch (err) { fail(err); }
}

function plannerGrid(ws) {
  const r = curRange();
  const days = daysIn(r.start, r.end);
  const byKey = new Map(S.data.entries.filter(e => inRange(e.day, r)).map(e => [e.worker_id + e.day, e]));
  const head = h('tr', null, h('th', { class: 'sticky' }, t('worker')),
    days.map(d => {
      const dt = toDate(d);
      return h('th', { class: 'dh' + (d === today() ? ' now' : '') + (dt.getDay() === 0 ? ' sun' : '') },
        h('button', { class: 'dh-btn', onclick: () => { S.period = 'day'; S.anchor = d; render(); } },
          h('small', null, t('weekdays')[dt.getDay()]), h('span', null, dt.getDate())));
    }),
    h('th', { class: 'n' }, t('days')), h('th', { class: 'n' }, t('earned')));
  const body = ws.map(w => {
    let dsum = 0, asum = 0;
    const cells = days.map(d => {
      const e = byKey.get(w.id + d);
      if (e && worked(e)) { dsum += Number(e.days); asum += Number(e.amount); }
      const c = cellCode(e);
      const site = e?.site_id ? siteById(e.site_id) : null;
      return h('td', { class: 'cell ' + (d === today() ? 'now' : '') },
        h('button', { class: 'cb ' + c.cls, title: site?.name || '', 'aria-label': `${w.name} ${d}`, onclick: () => editEntry(w, d) },
          c.txt, site && h('i', { class: 'sd' }, site.name.slice(0, 2))));
    });
    return h('tr', null, h('th', { class: 'sticky wname', onclick: () => openWorker(w.id) }, w.name),
      cells, h('td', { class: 'n' }, daysTxt(dsum)), h('td', { class: 'n' }, usd(asum)));
  });
  const totals = h('tr', { class: 'tot' }, h('th', { class: 'sticky' }, t('total')),
    days.map(d => {
      const v = sum([...byKey.values()].filter(e => e.day === d), e => e.amount);
      return h('td', { class: 'n tiny' }, v ? nf0.format(v) : '');
    }),
    h('td', { class: 'n' }, daysTxt(sum([...byKey.values()].filter(worked), e => e.days))),
    h('td', { class: 'n' }, usd(sum([...byKey.values()], e => e.amount))));

  const planned = [...byKey.values()].filter(e => e.status === 'planned' && e.day <= today());
  return h('div', null,
    h('div', { class: 'toolbar' },
      h('div', { class: 'legend' },
        h('span', null, h('i', { class: 'lg worked' }), t('full')), h('span', null, h('i', { class: 'lg part' }), `${t('half')} / ${t('hours')}`),
        h('span', null, h('i', { class: 'lg planned' }), t('planned')), h('span', null, h('i', { class: 'lg absent' }), t('absent'))),
      h('div', { class: 'tb-actions' },
        S.period === 'week' && h('button', { class: 'btn ghost sm', onclick: () => copyLastWeek(r) }, icon('copy'), ' ', t('copyLastWeek')),
        planned.length > 0 && h('button', { class: 'btn sm', onclick: () => bulkMark(planned) }, icon('check'), ` ${t('markWorked')} (${planned.length})`))),
    h('div', { class: 'grid-wrap ' + S.period }, h('table', { class: 'plan' }, h('thead', null, head), h('tbody', null, body, totals))));
}

async function copyLastWeek(r) {
  try {
    const prev = { start: addDays(r.start, -7), end: addDays(r.end, -7) };
    const exist = new Set(S.data.entries.filter(e => inRange(e.day, r)).map(e => e.worker_id + e.day));
    const rows = S.data.entries.filter(e => inRange(e.day, prev) && e.status !== 'absent')
      .map(e => ({ worker_id: e.worker_id, site_id: e.site_id, day: addDays(e.day, 7), status: 'planned', days: 0, hours: null, rate: workerById(e.worker_id)?.daily_rate ?? e.rate, note: null }))
      .filter(e => workerById(e.worker_id)?.active && !exist.has(e.worker_id + e.day));
    const saved = await S.store.saveMany('entries', rows);
    merge('entries', saved);
    toast(t('copied', { n: saved.length }));
    render();
  } catch (err) { fail(err); }
}

function editEntry(w, day) {
  const e = S.data.entries.find(x => x.worker_id === w.id && x.day === day);
  const hpd = Number(S.data.biz.hours_per_day);
  let mode = !e ? 'full' : e.status !== 'worked' ? e.status : e.hours != null ? 'hours' : Number(e.days) === 1 ? 'full' : Number(e.days) === 0.5 ? 'half' : 'custom';
  const hoursIn = h('input', { type: 'number', name: 'hours', inputmode: 'decimal', min: '0.25', max: '24', step: 'any', value: e?.hours ?? '' });
  const fracIn = h('input', { type: 'number', name: 'days', inputmode: 'decimal', min: '0.05', max: '2', step: 'any', value: mode === 'custom' ? e.days : '' });
  const rateIn = h('input', { type: 'number', name: 'rate', inputmode: 'decimal', min: '0', step: 'any', required: true, value: e?.rate ?? w.daily_rate });
  const noteIn = h('input', { type: 'text', name: 'note', maxlength: '500', value: e?.note ?? '' });
  const site = siteSelect(e?.site_id ?? lastSite(w.id, day));
  const preview = h('p', { class: 'preview' });
  const hoursF = field(t('hours'), hoursIn), fracF = field(t('fraction'), fracIn);
  const modes = [['full', t('full')], ['half', t('half')], ['hours', t('hours')], ['custom', t('custom')], ['planned', t('planned')], ['absent', t('absent')]];
  const seg = h('div', { class: 'seg wrap' });
  const calc = () => {
    const d = mode === 'full' ? 1 : mode === 'half' ? 0.5 : mode === 'hours' ? (Number(hoursIn.value) || 0) / hpd : mode === 'custom' ? Number(fracIn.value) || 0 : 0;
    return round3(d);
  };
  const refresh = () => {
    seg.replaceChildren(...modes.map(([k, l]) => h('button', { type: 'button', class: mode === k ? 'on ' + k : '', onclick: () => { mode = k; refresh(); } }, l)));
    hoursF.hidden = mode !== 'hours';
    fracF.hidden = mode !== 'custom';
    const d = calc();
    preview.textContent = ['planned', 'absent'].includes(mode) ? '' : `${daysTxt(d)} × ${usd(Number(rateIn.value) || 0)} = ${usd(d * (Number(rateIn.value) || 0))}`;
  };
  [hoursIn, fracIn, rateIn].forEach(i => i.addEventListener('input', refresh));
  refresh();
  const dt = toDate(day);
  const form = h('form', { class: 'form' }, seg, hoursF, fracF, field(t('site'), site), field(t('rate'), rateIn), field(t('note'), noteIn), preview);
  sheet(`${w.name} · ${t('weekdays')[dt.getDay()]} ${dt.getDate()} ${t('months')[dt.getMonth()]}`, form, async () => {
    const d = calc();
    const work = !['planned', 'absent'].includes(mode);
    if (work && !(d > 0 && d <= 2)) throw new Error(t('fraction'));
    await saveRow('entries', {
      id: e?.id, worker_id: w.id, day, site_id: site.value || null,
      status: work ? 'worked' : mode, days: work ? d : 0, hours: mode === 'hours' ? Number(hoursIn.value) : null,
      rate: Number(rateIn.value), note: noteIn.value.trim() || null
    });
  }, e && (() => removeRow('entries', e.id)));
}

function fab(label, fn) {
  return h('button', { class: 'fab', 'aria-label': label, title: label, onclick: fn }, icon('plus'));
}

function viewWorkers() {
  const q = S.q.trim().toLowerCase();
  const list = [...S.data.workers].sort((a, b) => (b.active - a.active) || a.name.localeCompare(b.name))
    .filter(w => !q || w.name.toLowerCase().includes(q) || (w.trade || '').toLowerCase().includes(q));
  const search = h('input', { type: 'search', class: 'search', placeholder: t('search'), value: S.q, 'aria-label': t('search') });
  search.addEventListener('input', () => { S.q = search.value; const pos = search.selectionStart; render(); const n = root.querySelector('.search'); n.focus(); n.setSelectionRange(pos, pos); });
  return h('div', { class: 'view' },
    S.data.workers.length > 5 && search,
    list.length ? h('div', { class: 'wlist' }, list.map(w => {
      const bal = balance(w.id);
      return h('button', { class: 'wcard' + (w.active ? '' : ' off'), onclick: () => openWorker(w.id) },
        h('span', { class: 'av' }, w.name.slice(0, 1).toUpperCase()),
        h('span', { class: 'wc-main' }, h('b', null, w.name), h('small', { class: 'muted' }, [w.trade, `${usd(w.daily_rate)}${t('perDay')}`, !w.active && t('inactive')].filter(Boolean).join(' · '))),
        h('span', { class: 'wc-bal ' + (bal > 0.009 ? 'hot-t' : bal < -0.009 ? 'good-t' : 'muted') }, h('small', null, bal < -0.009 ? t('credit') : t('balance')), usd(Math.abs(bal))));
    })) : empty(t('noWorkers')),
    fab(t('addWorker'), () => editWorker()));
}

function openWorker(id) { S.view = 'worker'; S.workerId = id; render(); window.scrollTo(0, 0); }

function viewWorker() {
  const w = workerById(S.workerId);
  if (!w) { S.view = 'workers'; return viewWorkers(); }
  const r = curRange();
  const st = stats(w.id, r);
  const bal = balance(w.id);
  const all = stats(w.id);
  const hist = [
    ...all.entries.filter(e => e.status !== 'planned').map(e => ({ d: e.day, kind: 'e', e })),
    ...all.payments.map(p => ({ d: p.paid_on, kind: 'p', p }))
  ].sort((a, b) => b.d.localeCompare(a.d) || (a.kind === 'p' ? -1 : 1)).slice(0, 80);
  const tel = (w.phone || '').replace(/[^\d+]/g, '');
  return h('div', { class: 'view' },
    h('div', { class: 'whead' },
      h('button', { class: 'icon-btn flip', 'aria-label': 'back', onclick: () => { S.view = 'workers'; render(); } }, icon('back')),
      h('span', { class: 'av lg' }, w.name.slice(0, 1).toUpperCase()),
      h('div', { class: 'wh-main' }, h('h2', null, w.name), h('small', { class: 'muted' }, [w.trade, `${usd(w.daily_rate)}${t('perDay')}`].filter(Boolean).join(' · '))),
      tel && h('a', { class: 'icon-btn', href: 'tel:' + tel, 'aria-label': t('phone') }, icon('phone')),
      h('button', { class: 'icon-btn', 'aria-label': t('editWorker'), onclick: () => editWorker(w) }, icon('edit'))),
    h('div', { class: 'card balcard ' + (bal > 0.009 ? 'hot' : 'good') },
      h('div', null, h('span', { class: 'kl' }, bal < -0.009 ? t('advance') : t('balance')), h('strong', { class: 'big' }, usd(Math.abs(bal))), h('small', { class: 'muted block' }, lbp(Math.abs(bal)))),
      bal > 0.009 && h('button', { class: 'btn', onclick: () => editPayment({ worker_id: w.id, amount: round2(bal) }) }, t('payBalance'))),
    periodBar(),
    h('div', { class: 'kpis' },
      kpi(t('days'), daysTxt(st.days)), kpi(t('earned'), usd(st.earned)),
      kpi(t('paid'), usd(st.paid), null, 'good'), kpi(st.left >= 0 ? t('left') : t('advance'), usd(Math.abs(st.left)), null, st.left > 0 ? 'warn' : 'good')),
    h('div', { class: 'card' }, h('div', { class: 'card-h' }, h('h3', null, t('history'))),
      hist.length ? h('ul', { class: 'hist' }, hist.map(x => {
        const dt = toDate(x.d);
        const dl = `${t('weekdays')[dt.getDay()]} ${dt.getDate()} ${t('months')[dt.getMonth()]}`;
        if (x.kind === 'p') return h('li', { class: 'pay', onclick: () => editPayment(x.p) },
          h('span', null, dl), h('span', { class: 'muted' }, `${t('pay')} · ${t(x.p.method)}${x.p.currency === 'LBP' ? ' · ' + lbpRaw(x.p.lbp_amount) : ''}`), h('b', { class: 'good-t' }, '−' + usd(x.p.amount)));
        return h('li', { onclick: () => editEntry(w, x.e.day) },
          h('span', null, dl), h('span', { class: 'muted' }, [entryLabel(x.e), siteById(x.e.site_id)?.name].filter(Boolean).join(' · ')),
          h('b', null, x.e.amount ? '+' + usd(x.e.amount) : ''));
      })) : empty(t('noData'))),
    fab(t('addPayment'), () => editPayment({ worker_id: w.id })));
}

function field(label, input, hint) {
  return h('label', { class: 'field' }, h('span', null, label), input, hint && h('small', { class: 'muted' }, hint));
}

function editWorker(w = {}) {
  const f = {
    name: h('input', { name: 'name', required: true, maxlength: '120', autocomplete: 'off', value: w.name || '' }),
    trade: h('input', { name: 'trade', maxlength: '60', placeholder: t('tradeHint'), value: w.trade || '' }),
    daily_rate: h('input', { name: 'daily_rate', type: 'number', inputmode: 'decimal', min: '0', step: 'any', required: true, value: w.daily_rate ?? '' }),
    phone: h('input', { name: 'phone', type: 'tel', maxlength: '40', autocomplete: 'off', value: w.phone || '' }),
    notes: h('textarea', { name: 'notes', maxlength: '1000', rows: '2' }, w.notes || ''),
    active: h('input', { name: 'active', type: 'checkbox', checked: w.active !== false })
  };
  const form = h('form', { class: 'form' },
    field(t('name'), f.name), field(t('trade'), f.trade), field(`${t('rate')} (USD)`, f.daily_rate), field(t('phone'), f.phone), field(t('notes'), f.notes),
    h('label', { class: 'check' }, f.active, h('span', null, t('active'))));
  sheet(w.id ? t('editWorker') : t('addWorker'), form, async () => {
    const saved = await saveRow('workers', {
      id: w.id, name: f.name.value.trim(), trade: f.trade.value.trim() || null, daily_rate: Number(f.daily_rate.value),
      phone: f.phone.value.trim() || null, notes: f.notes.value.trim() || null, active: f.active.checked
    });
    if (!w.id) openWorker(saved.id);
  }, w.id && (async () => { await removeRow('workers', w.id); S.view = 'workers'; }));
  setTimeout(() => f.name.focus(), 50);
}

function editPayment(p = {}) {
  const ws = S.data.workers.filter(w => w.active || w.id === p.worker_id);
  let cur = p.currency || 'USD';
  const wsel = h('select', { name: 'worker_id', required: true }, h('option', { value: '' }, '—'), ws.map(w => h('option', { value: w.id }, w.name)));
  wsel.value = p.worker_id || '';
  const amt = h('input', { name: 'amount', type: 'number', inputmode: 'decimal', min: '0', step: 'any', required: true,
    value: cur === 'LBP' ? p.lbp_amount ?? '' : p.amount ?? '' });
  const rate = h('input', { name: 'lbp_rate', type: 'number', inputmode: 'numeric', min: '1', step: '1', value: p.lbp_rate ?? S.data.biz.lbp_rate });
  const date = h('input', { name: 'paid_on', type: 'date', required: true, value: p.paid_on || today() });
  const method = h('select', { name: 'method' }, ['cash', 'transfer', 'whish', 'omt', 'other'].map(m => h('option', { value: m }, t(m))));
  method.value = p.method || 'cash';
  const note = h('input', { name: 'note', maxlength: '500', value: p.note || '' });
  const rateF = field(t('lbpRate'), rate);
  const hint = h('p', { class: 'preview' });
  const amtF = field(t('amount'), amt);
  const seg = h('div', { class: 'seg' });
  const refresh = () => {
    seg.replaceChildren(...['USD', 'LBP'].map(c => h('button', { type: 'button', class: cur === c ? 'on' : '', onclick: () => {
      if (cur !== c && amt.value) amt.value = c === 'LBP' ? Math.round(Number(amt.value) * Number(rate.value)) : round2(Number(amt.value) / Number(rate.value));
      cur = c; refresh();
    } }, c)));
    rateF.hidden = cur !== 'LBP';
    amtF.firstChild.textContent = `${t('amount')} (${cur})`;
    const v = Number(amt.value) || 0;
    const wid = wsel.value;
    const bal = wid ? balance(wid) + (p.id && p.worker_id === wid ? Number(p.amount) : 0) : null;
    hint.textContent = (cur === 'LBP' ? `= ${usd(v / (Number(rate.value) || 1))}` : v ? `= ${lbp(v)}` : '') +
      (bal != null ? `  ·  ${t('balance')}: ${usd(bal)}` : '');
  };
  [amt, rate].forEach(i => i.addEventListener('input', refresh));
  wsel.addEventListener('change', refresh);
  refresh();
  const form = h('form', { class: 'form' }, field(t('worker'), wsel), seg, amtF, rateF, hint, field(t('date'), date), field(t('method'), method), field(t('note'), note));
  sheet(p.id ? t('editPayment') : t('addPayment'), form, async () => {
    const v = Number(amt.value), r = Number(rate.value);
    if (!(v > 0)) throw new Error(t('amount'));
    if (cur === 'LBP' && !(r > 0)) throw new Error(t('lbpRate'));
    await saveRow('payments', {
      id: p.id, worker_id: wsel.value, paid_on: date.value, method: method.value, note: note.value.trim() || null, currency: cur,
      amount: cur === 'USD' ? round2(v) : round2(v / r), lbp_amount: cur === 'LBP' ? Math.round(v) : null, lbp_rate: cur === 'LBP' ? Math.round(r) : null
    });
  }, p.id && (() => removeRow('payments', p.id)));
}

function viewPayments() {
  const r = curRange();
  const ps = S.data.payments.filter(p => inRange(p.paid_on, r)).sort((a, b) => b.paid_on.localeCompare(a.paid_on));
  const groups = new Map();
  ps.forEach(p => { if (!groups.has(p.paid_on)) groups.set(p.paid_on, []); groups.get(p.paid_on).push(p); });
  const st = stats(null, r);
  return h('div', { class: 'view' }, periodBar(),
    h('div', { class: 'kpis three' }, kpi(t('paid'), usd(st.paid), lbp(st.paid), 'good'), kpi(t('earned'), usd(st.earned)),
      kpi(st.left >= 0 ? t('left') : t('advance'), usd(Math.abs(st.left)), null, st.left > 0 ? 'warn' : 'good')),
    ps.length ? [...groups.entries()].map(([d, list]) => {
      const dt = toDate(d);
      return h('div', { class: 'card' },
        h('div', { class: 'card-h' }, h('h3', null, `${t('weekdays')[dt.getDay()]} ${dt.getDate()} ${t('months')[dt.getMonth()]}`), h('b', null, usd(sum(list, p => p.amount)))),
        h('ul', { class: 'plist' }, list.map(p => h('li', { onclick: () => editPayment(p) },
          h('span', { class: 'av sm' }, (workerById(p.worker_id)?.name || '?').slice(0, 1).toUpperCase()),
          h('span', { class: 'pl-main' }, h('b', null, workerById(p.worker_id)?.name || '?'), h('small', { class: 'muted' }, [t(p.method), p.note].filter(Boolean).join(' · '))),
          h('span', { class: 'pl-amt' }, h('b', null, usd(p.amount)), p.currency === 'LBP' && h('small', { class: 'muted block' }, lbpRaw(p.lbp_amount)))))));
    }) : empty(t('noData')),
    fab(t('addPayment'), () => editPayment()));
}

function viewSettings() {
  const b = S.data.biz;
  const name = h('input', { name: 'name', maxlength: '120', value: b.name || '' });
  const lang = h('select', { name: 'lang' }, h('option', { value: 'en' }, 'English'), h('option', { value: 'ar' }, 'العربية'));
  lang.value = b.lang;
  const period = h('select', { name: 'period' }, ['day', 'week', 'month'].map(p => h('option', { value: p }, t(p))));
  period.value = b.period;
  const ws = h('select', { name: 'week_start' }, [1, 6, 0].map(d => h('option', { value: String(d) }, t('weekdays')[d])));
  ws.value = String(b.week_start);
  const hpd = h('input', { name: 'hours_per_day', type: 'number', min: '1', max: '24', step: 'any', inputmode: 'decimal', value: b.hours_per_day });
  const rate = h('input', { name: 'lbp_rate', type: 'number', min: '1', step: '1', inputmode: 'numeric', value: b.lbp_rate });
  const form = h('form', { class: 'form card', onsubmit: async ev => {
    ev.preventDefault();
    try {
      S.data.biz = await S.store.saveBiz({ name: name.value.trim(), lang: lang.value, period: period.value, week_start: Number(ws.value), hours_per_day: Number(hpd.value), lbp_rate: Number(rate.value) });
      setLang(S.data.biz.lang);
      toast(t('saved'));
      render();
    } catch (err) { fail(err); }
  } },
    field(t('business'), name), h('div', { class: 'row2' }, field(t('language'), lang), field(t('defaultPeriod'), period)),
    h('div', { class: 'row2' }, field(t('weekStart'), ws), field(t('hoursPerDay'), hpd)), field(t('lbpRate'), rate),
    h('button', { class: 'btn', type: 'submit' }, t('save')));

  const sites = h('div', { class: 'card' },
    h('div', { class: 'card-h' }, h('h3', null, t('sites')), h('button', { class: 'btn ghost sm', onclick: () => editSite() }, icon('plus'), ' ', t('addSite'))),
    S.data.sites.length ? h('ul', { class: 'plist' }, [...S.data.sites].sort((a, c) => (c.active - a.active) || a.name.localeCompare(c.name)).map(s => h('li', { class: s.active ? '' : 'off', onclick: () => editSite(s) },
      h('span', { class: 'pl-main' }, h('b', null, s.name), h('small', { class: 'muted' }, [s.location, !s.active && t('inactive')].filter(Boolean).join(' · '))),
      h('span', { class: 'muted' }, usd(sum(S.data.entries.filter(e => e.site_id === s.id), e => e.amount)))))) : empty(t('noData')));

  const acct = h('div', { class: 'card stack' },
    S.store.demo && h('p', { class: 'banner' }, t('demo')),
    h('button', { class: 'btn ghost', onclick: exportCsv }, t('exportCsv')),
    h('button', { class: 'btn danger ghost', onclick: async () => { await S.store.signOut(); location.reload(); } }, t('signOut')));
  return h('div', { class: 'view narrow' }, form, sites, acct);
}

function editSite(s = {}) {
  const name = h('input', { name: 'name', required: true, maxlength: '120', value: s.name || '' });
  const loc = h('input', { name: 'location', maxlength: '200', value: s.location || '' });
  const active = h('input', { type: 'checkbox', checked: s.active !== false });
  sheet(s.id ? t('site') : t('addSite'), h('form', { class: 'form' }, field(t('name'), name), field(t('location'), loc), h('label', { class: 'check' }, active, h('span', null, t('active')))),
    () => saveRow('sites', { id: s.id, name: name.value.trim(), location: loc.value.trim() || null, active: active.checked }),
    s.id && (() => removeRow('sites', s.id)));
}

function exportCsv() {
  const rows = [['type', 'date', 'worker', 'site', 'status', 'days', 'hours', 'rate_usd', 'amount_usd', 'currency', 'lbp_amount', 'lbp_rate', 'method', 'note']];
  S.data.entries.forEach(e => rows.push(['work', e.day, workerById(e.worker_id)?.name, siteById(e.site_id)?.name, e.status, e.days, e.hours, e.rate, e.amount, 'USD', '', '', '', e.note]));
  S.data.payments.forEach(p => rows.push(['payment', p.paid_on, workerById(p.worker_id)?.name, '', '', '', '', '', p.amount, p.currency, p.lbp_amount, p.lbp_rate, p.method, p.note]));
  rows.splice(1, rows.length, ...rows.slice(1).sort((a, b) => a[1].localeCompare(b[1])));
  const url = URL.createObjectURL(new Blob([csv(rows)], { type: 'text/csv;charset=utf-8' }));
  const a = h('a', { href: url, download: `worksite-${today()}.csv` });
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function sheet(title, form, onSave, onDelete) {
  const close = () => { wrap.classList.remove('show'); document.removeEventListener('keydown', esc); setTimeout(() => wrap.remove(), 200); };
  const esc = ev => ev.key === 'Escape' && close();
  const saveBtn = h('button', { class: 'btn', type: 'submit' }, t('save'));
  form.addEventListener('submit', async ev => {
    ev.preventDefault();
    if (!form.reportValidity()) return;
    saveBtn.disabled = true;
    try { await onSave(); close(); render(); } catch (err) { fail(err); } finally { saveBtn.disabled = false; }
  });
  form.append(h('div', { class: 'actions' },
    onDelete && h('button', { class: 'btn danger ghost', type: 'button', onclick: async () => {
      if (!confirm(t('confirmDelete'))) return;
      try { await onDelete(); toast(t('deleted')); close(); render(); } catch (err) { fail(err); }
    } }, t('delete')),
    h('span', { class: 'sp' }),
    h('button', { class: 'btn ghost', type: 'button', onclick: close }, t('cancel')), saveBtn));
  const wrap = h('div', { class: 'overlay', onclick: ev => ev.target === wrap && close() },
    h('div', { class: 'sheet', role: 'dialog', 'aria-modal': 'true', 'aria-label': title }, h('div', { class: 'grab' }), h('h2', null, title), form));
  document.body.append(wrap);
  document.addEventListener('keydown', esc);
  requestAnimationFrame(() => wrap.classList.add('show'));
}

function merge(kind, rows) {
  const list = S.data[kind];
  rows.forEach(r => { const i = list.findIndex(x => x.id === r.id); if (i >= 0) list[i] = r; else list.push(r); });
}

async function saveRow(kind, row, quiet) {
  const saved = await S.store.save(kind, row);
  merge(kind, [saved]);
  if (!quiet) toast(t('saved'));
  return saved;
}

async function removeRow(kind, id) {
  await S.store.remove(kind, id);
  S.data[kind] = S.data[kind].filter(r => r.id !== id);
  if (kind === 'workers') {
    S.data.entries = S.data.entries.filter(e => e.worker_id !== id);
    S.data.payments = S.data.payments.filter(p => p.worker_id !== id);
  }
  if (kind === 'sites') S.data.entries.forEach(e => { if (e.site_id === id) e.site_id = null; });
}

const TABS = ['dashboard', 'planner', 'workers', 'payments', 'settings'];

function render() {
  const views = { dashboard: viewDashboard, planner: viewPlanner, workers: viewWorkers, worker: viewWorker, payments: viewPayments, settings: viewSettings };
  const active = S.view === 'worker' ? 'workers' : S.view;
  const navBtn = k => h('button', { class: active === k ? 'on' : '', 'aria-current': active === k ? 'page' : null, onclick: () => { S.view = k; S.q = ''; render(); window.scrollTo(0, 0); } }, icon(k), h('span', null, t(k)));
  root.replaceChildren(
    h('div', { class: 'shell' },
      h('aside', { class: 'side' },
        h('div', { class: 'brand' }, h('span', { class: 'logo' }, icon('helmet')), h('div', null, h('b', null, t('app')), h('small', null, S.data.biz.name || ''))),
        h('nav', null, TABS.map(navBtn)),
        S.store.demo && h('p', { class: 'banner sm' }, t('demo'))),
      h('main', null,
        h('header', { class: 'top' },
          h('span', { class: 'logo sm' }, icon('helmet')),
          h('div', null, h('h1', null, S.view === 'worker' ? t('workers') : t(S.view)), h('small', { class: 'muted' }, S.data.biz.name || t('app')))),
        views[S.view]()),
      h('nav', { class: 'tabs' }, TABS.map(navBtn))));
}

function authScreen(msg) {
  let mode = 'in';
  const email = h('input', { type: 'email', name: 'email', required: true, autocomplete: 'email', maxlength: '254' });
  const pw = h('input', { type: 'password', name: 'password', required: true, minlength: '10', maxlength: '128', autocomplete: 'current-password' });
  const info = h('p', { class: 'info' }, msg || '');
  const submit = h('button', { class: 'btn wide', type: 'submit' });
  const toggle = h('button', { class: 'link-btn', type: 'button' });
  const forgot = h('button', { class: 'link-btn', type: 'button' }, t('forgot'));
  const draw = () => {
    submit.textContent = mode === 'in' ? t('signIn') : t('signUp');
    toggle.textContent = mode === 'in' ? t('noAccount') : t('haveAccount');
    pw.autocomplete = mode === 'in' ? 'current-password' : 'new-password';
    forgot.hidden = mode !== 'in';
  };
  toggle.onclick = () => { mode = mode === 'in' ? 'up' : 'in'; draw(); };
  forgot.onclick = async () => {
    if (!email.reportValidity()) return;
    try { await S.store.reset(email.value.trim()); info.textContent = t('resetSent'); } catch (err) { fail(err); }
  };
  const form = h('form', { class: 'form', onsubmit: async ev => {
    ev.preventDefault();
    submit.disabled = true;
    try {
      if (mode === 'in') { await S.store.signIn(email.value.trim(), pw.value); await boot(); }
      else { const r = await S.store.signUp(email.value.trim(), pw.value); if (r.session) await boot(); else { info.textContent = t('checkEmail'); mode = 'in'; draw(); } }
    } catch (err) { fail(err); } finally { submit.disabled = false; }
  } }, field(t('email'), email), field(t('password'), pw, t('pwRule')), submit, h('div', { class: 'auth-links' }, toggle, forgot), info);
  draw();
  const langBtn = h('button', { class: 'chip', onclick: () => { setLang(getLang() === 'ar' ? 'en' : 'ar'); try { localStorage.setItem('worksite_lang', getLang()); } catch {} authScreen(); } }, getLang() === 'ar' ? 'English' : 'العربية');
  root.replaceChildren(h('div', { class: 'auth' },
    h('div', { class: 'auth-card' }, h('div', { class: 'auth-top' }, h('span', { class: 'logo lg' }, icon('helmet')), langBtn),
      h('h1', null, t('app')), h('p', { class: 'muted' }, t('tagline')), form,
      h('button', { class: 'btn ghost wide', onclick: async () => { try { localStorage.setItem('worksite_mode', 'demo'); } catch {} S.store = createStore(true); await boot(); } }, t('tryDemo')))));
}

function newPassword() {
  const pw = h('input', { type: 'password', required: true, minlength: '10', maxlength: '128', autocomplete: 'new-password' });
  sheet(t('password'), h('form', { class: 'form' }, field(t('password'), pw, t('pwRule'))), async () => { await S.store.updatePassword(pw.value); toast(t('saved')); });
}

async function boot() {
  const s = await S.store.session();
  if (!s) return authScreen();
  S.data = await S.store.load();
  ['entries', 'payments', 'workers'].forEach(k => S.data[k].forEach(r => {
    ['days', 'hours', 'rate', 'amount', 'daily_rate', 'lbp_amount', 'lbp_rate'].forEach(f => { if (r[f] != null) r[f] = Number(r[f]); });
  }));
  ['lbp_rate', 'hours_per_day', 'week_start'].forEach(f => { S.data.biz[f] = Number(S.data.biz[f]); });
  setLang(S.data.biz.lang);
  S.period = S.data.biz.period;
  render();
}

async function start() {
  let mode = null;
  try { mode = localStorage.getItem('worksite_mode'); setLang(localStorage.getItem('worksite_lang') || ((navigator.language || '').startsWith('ar') ? 'ar' : 'en')); } catch {}
  S.store = createStore(mode === 'demo' || !configured());
  S.store.onAuth((ev) => {
    if (ev === 'PASSWORD_RECOVERY') newPassword();
    if (ev === 'SIGNED_OUT' && S.data) { S.data = null; authScreen(t('sessionExpired')); }
  });
  try { await boot(); } catch (err) { fail(err); authScreen(); }
  if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});
}

window.addEventListener('offline', () => toast(t('offline'), true));
start();

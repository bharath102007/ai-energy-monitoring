/* EnergyIQ — UI shell, screens and events */

import { art, artLabel, CATALOG } from './applianceArt.js';
import {
  getState, save, resetDemo, tick, livePower, dayEnergy, dayCost,
  lastDays, averageDaily, rangeData, applianceShares, applianceDayEnergy,
  applianceDayStats, monthKeys, shiftMonth, allDayKeys, dayTop
} from './store.js';
import {
  dateKey, todayKey, weekday, shortDate, money, niceNumber, uid,
  escapeHtml, clamp, pct, timeAgo, WEEKDAYS, WEEKDAYS_LONG, MONTHS
} from './utils.js';
import { barChart, donutChart, gauge, sparkBars, donutColors } from './charts.js';
import { buildInsights, recommendations, efficiencyScore, chatReply, anomalies, recentAnomalies, credits } from './insights.js';

const ui = {
  tab: 'dashboard',
  usageMode: 'daily',
  pickedType: 'fridge',
  draft: { name: '', watts: '' },
  wattsEdited: false,
  chatInput: '',
  chatTyping: false,
  editId: null,
  confirmDeleteId: null,
  sidebarOpen: false,
  applianceDate: todayKey(),
  reportMonth: shiftMonth(0),
  freshTimer: null
};

const TABS = [
  { id: 'dashboard', label: 'Live Dashboard', short: 'Dashboard', icon: 'dashboard', group: 'Monitor' },
  { id: 'appliances', label: 'Appliances', short: 'Appliances', icon: 'appliances', group: 'Monitor', badge: true },
  { id: 'usage', label: 'Usage', short: 'Usage', icon: 'usage', group: 'Monitor' },
  { id: 'reports', label: 'Reports & Downloads', short: 'Reports', icon: 'reports', group: 'Monitor' },
  { id: 'insights', label: 'AI Insights', short: 'AI Insights', icon: 'insights', group: 'Intelligence' },
  { id: 'credits', label: 'Green Credits', short: 'Credits', icon: 'credits', group: 'Intelligence' },
  { id: 'chat', label: 'Ask EnergyIQ', short: 'Chatbot', icon: 'chat', group: 'Intelligence', badge: true }
];

const ICON_PATHS = {
  dashboard: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
  appliances: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="18" height="7" rx="1.5"/>',
  usage: '<path d="M3 20h18M6 16v-5M11 16V7M16 16v-8M21 16v-3"/>',
  insights: '<path d="M12 3l1.8 4.6L18 9.5l-4.2 1.9L12 16l-1.8-4.6L6 9.5l4.2-1.9z"/><path d="M18.5 15l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8z"/>',
  chat: '<path d="M21 12a8 8 0 0 1-8 8H7l-4 3V12a8 8 0 0 1 8-8h2a8 8 0 0 1 8 8Z"/><path d="M8 12h.01M12 12h.01M16 12h.01"/>',
  reports: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h5"/>',
  credits: '<path d="M12 2l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17l-5.9 3 1.2-6.5L2.5 8.9 9.1 8z"/>'
};

function icon(name) {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ICON_PATHS[name] || ''}</svg>`;
}

const TONE_STYLE = {
  violet: 'background:var(--accent-soft);color:var(--accent)',
  green: 'background:var(--green-soft);color:#0b8f69',
  amber: 'background:var(--amber-soft);color:#b57600',
  red: 'background:var(--red-soft);color:#d24555',
  blue: 'background:var(--blue-soft);color:#2277c9'
};

/* ---------- shell ---------- */

function renderNav() {
  const s = getState();
  let html = '';
  let group = '';
  TABS.forEach(t => {
    if (t.group !== group) {
      group = t.group;
      html += `<div class="nav-section">${group}</div>`;
    }
    const badge = t.badge
      ? `<span class="nav-badge">${t.id === 'appliances' ? s.appliances.length : s.chat.filter(m => m.role === 'user').length}</span>`
      : '';
    html += `<button class="nav-item ${ui.tab === t.id ? 'active' : ''}" data-action="tab" data-tab="${t.id}">
      ${icon(t.icon)}<span>${t.short}</span>${badge}
    </button>`;
  });
  document.getElementById('nav').innerHTML = html;
}

function updateHeader() {
  const tab = TABS.find(t => t.id === ui.tab);
  const now = new Date();
  document.getElementById('page-title').textContent = tab.label;
  document.getElementById('today-eyebrow').textContent =
    `${weekday(now, true).toUpperCase()} · ${shortDate(now).toUpperCase()}`;
}

function renderView(quiet = false) {
  updateHeader();
  document.body.dataset.tab = ui.tab;
  const views = {
    dashboard: dashboardView,
    appliances: appliancesView,
    usage: usageView,
    reports: reportsView,
    insights: insightsView,
    credits: creditsView,
    chat: chatView
  };
  const view = document.getElementById('view');
  view.innerHTML = (views[ui.tab] || dashboardView)();
  if (!quiet) {
    view.classList.remove('fresh');
    void view.offsetWidth; // restart the entrance animation
    view.classList.add('fresh');
    clearTimeout(ui.freshTimer);
    ui.freshTimer = setTimeout(() => view.classList.remove('fresh'), 1100);
  }
  if (ui.tab === 'chat') {
    requestAnimationFrame(() => {
      const body = document.querySelector('.chat-body');
      if (body) body.scrollTop = body.scrollHeight;
    });
  }
}

/* ---------- screens ---------- */

function statCard(label, value, unit, iconName, tone, foot) {
  return `<div class="card stat-card">
    <div class="stat-top">
      <div class="stat-icon" style="${TONE_STYLE[tone]}">${icon(iconName)}</div>
    </div>
    <div class="stat-label">${label}</div>
    <div class="stat-value">${value}${unit ? ` <small>${unit}</small>` : ''}</div>
    <div class="stat-foot">${foot}</div>
  </div>`;
}

function dashboardView() {
  const s = getState();
  const key = todayKey();
  const energy = dayEnergy(key);
  const cost = dayCost(key);
  const live = livePower();
  const connected = s.appliances.reduce((n, a) => n + a.watts, 0);
  const avg = averageDaily(7);
  const days = lastDays(7);
  const values = days.map(dayEnergy);
  const maxV = Math.max(...values, .0001);
  const bars = values.map((v, i) => `<i class="${v === maxV ? 'hot' : ''}" style="height:${Math.max(6, v / maxV * 54)}px"><title>${days[i]}: ${niceNumber(v)} kWh</title></i>`).join('');

  const stats = [
    statCard('Energy used today', niceNumber(energy), 'kWh', 'usage', 'violet',
      `<span class="trend-up">↑</span> updates live every second`),
    statCard('Cost incurred today', money(cost), '', 'insights', 'amber',
      `${money(s.tariff)} per unit · ${shortDate(new Date())}`),
    statCard('Live power draw', niceNumber(live, 0), 'W', 'dashboard', live > connected * .7 ? 'red' : 'green',
      `${s.appliances.filter(a => a.on).length} of ${s.appliances.length} appliances ON`),
    statCard('7-day daily average', niceNumber(avg), 'kWh', 'usage', 'blue',
      `~${money(avg * s.tariff, 0)} per day`)
  ].join('');

  const rows = s.appliances.slice().sort((a, b) => (b.on ? 1 : 0) - (a.on ? 1 : 0) || b.watts - a.watts)
    .map(a => `<div class="appliance-row">
      ${art(a.type)}
      <div class="meta"><strong>${escapeHtml(a.name)}</strong><span>${artLabel(a.type)} · ${a.watts} W</span></div>
      <div class="row-power"><strong>${a.on ? niceNumber(a.watts, 0) + ' W' : '—'}</strong>
        <span>${niceNumber(applianceDayEnergy(key, a.id))} kWh today</span></div>
      <label class="switch" title="Toggle ${escapeHtml(a.name)}">
        <input type="checkbox" data-action="toggle-appliance" data-id="${a.id}" ${a.on ? 'checked' : ''}>
        <span class="slider"></span>
      </label>
    </div>`).join('');

  const chartItems = days.map((k, i) => ({
    label: weekday(new Date(k + 'T12:00:00')), value: values[i], fullLabel: `${weekday(new Date(k + 'T12:00:00'), true)}, ${shortDate(new Date(k + 'T12:00:00'))}`
  }));

  const flags = recentAnomalies().slice(0, 2);
  const alertBanner = flags.length ? `<div class="alert-banner">
    <div class="alert-icon">🚨</div>
    <div><strong>Unusual energy spike detected</strong>
      <div class="tiny">${flags.map(f => `${f.label}: ${niceNumber(f.energy)} kWh (${Math.round((f.ratio - 1) * 100)}% above normal)`).join(' · ')}</div></div>
    <button class="btn btn-sm" style="margin-left:auto" data-action="tab" data-tab="insights">View alerts →</button>
  </div>` : '';

  return `
    ${alertBanner}
    <div class="grid grid-4">${stats}</div>

    <div class="card live-hero mt-16">
      <div class="live-left">
        <div class="hero-kicker"><span class="dot-live"></span> Live energy pulse</div>
        <div class="hero-number">${niceNumber(live, 0)}<span> W</span></div>
        <div class="hero-sub">${niceNumber(energy)} kWh used today · ${money(cost)} so far</div>
        <div class="hero-bars">${bars}</div>
        <div class="tiny muted mt-16">Last 7 days of consumption · hover a bar for details</div>
      </div>
      <div class="gauge-wrap">${gauge(connected ? live / connected : 0, niceNumber(live, 0) + ' W', `of ${niceNumber(connected, 0)} W connected`)}</div>
    </div>

    <div class="grid grid-2 mt-16">
      <div class="card panel">
        <div class="panel-head"><h3>Appliance status</h3><button class="btn btn-ghost btn-sm" data-action="tab" data-tab="appliances">Manage →</button></div>
        ${rows || '<div class="empty">No appliances yet.</div>'}
      </div>
      <div class="card panel">
        <div class="panel-head"><h3>Energy this week</h3><span class="muted">kWh / day</span></div>
        ${barChart(chartItems, { formatter: v => niceNumber(v, 1), height: 250, color: '#6c5ce7' })}
        <div class="chart-legend"><span><i style="background:#6c5ce7"></i> Energy used</span><span><i style="background:#ffb457"></i> Highest day</span></div>
      </div>
    </div>

    <div class="card panel mt-16 spread">
      <div><strong class="tiny">Data source: simulated sensor stream</strong>
        <div class="tiny muted mt-16" style="margin-top:5px">Readings are written to a local data store. Wi-Fi energy sensors can feed the same store later.</div></div>
      <span class="badge blue">Hardware-ready</span>
    </div>
  `;
}

function appliancesView() {
  const s = getState();
  const connected = s.appliances.reduce((n, a) => n + a.watts, 0);
  const selected = allDayKeys().includes(ui.applianceDate) ? ui.applianceDate : todayKey();
  const d = new Date(selected + 'T12:00:00');
  const dayLabel = `${WEEKDAYS_LONG[d.getDay()]}, ${shortDate(d)}`;

  const picker = CATALOG.map(c => `<button type="button" class="picker-item ${ui.pickedType === c.type ? 'active' : ''}" data-action="pick-art" data-type="${c.type}" title="${c.label} · ${c.watts} W">
      ${art(c.type)}<span>${c.label}</span>
    </button>`).join('');

  const dateOptions = lastDays(30).slice().reverse().map(k => {
    const dd = new Date(k + 'T12:00:00');
    return `<option value="${k}" ${selected === k ? 'selected' : ''}>${WEEKDAYS[dd.getDay()]}, ${shortDate(dd)}</option>`;
  }).join('');

  const cards = s.appliances.map(a => {
    const st = applianceDayStats(selected, a.id);
    return `<div class="card appliance-card">
      ${a.on ? '<span class="badge green on-tag">ON</span>' : '<span class="badge on-tag" style="background:#eef0f6;color:#8b96ad">OFF</span>'}
      ${art(a.type, 'art art-lg')}
      <h3>${escapeHtml(a.name)}</h3>
      <div class="watts">${a.watts} W · ${artLabel(a.type)}</div>
      <span class="added-tag">✓ Added by you</span>
      <div class="day-usage">
        <div><span>RUN TIME</span><strong>${niceNumber(st.hours)} h</strong></div>
        <div><span>ENERGY</span><strong>${niceNumber(st.energy)} kWh</strong></div>
        <div><span>COST</span><strong>${money(st.cost)}</strong></div>
      </div>
      <div class="card-foot">
        <label class="switch"><input type="checkbox" data-action="toggle-appliance" data-id="${a.id}" ${a.on ? 'checked' : ''}><span class="slider"></span></label>
        <div class="card-actions">
          <button class="mini-btn" data-action="edit-appliance" data-id="${a.id}" title="Edit" aria-label="Edit ${escapeHtml(a.name)}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>
          </button>
          <button class="mini-btn del" data-action="delete-appliance" data-id="${a.id}" title="Delete" aria-label="Delete ${escapeHtml(a.name)}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v5M14 11v5"/></svg>
          </button>
        </div>
      </div>
    </div>`;
  }).join('');

  return `
    <div class="section-head">
      <div><h2>Your appliances</h2><p>${s.appliances.length} devices · ${niceNumber(connected, 0)} W · usage for ${dayLabel}: ${niceNumber(dayEnergy(selected))} kWh / ${money(dayCost(selected))}</p></div>
      <div class="row"><span class="badge violet">All added by you</span>
        <select class="select date-select" data-action="set-appliance-date">${dateOptions}</select>
      </div>
    </div>

    <div class="card panel">
      <div class="panel-head"><h3>Add an appliance</h3><span class="muted">Name it, set its watts, pick a picture</span></div>
      <form data-form="add-appliance">
        <div class="grid grid-2">
          <div class="field"><label>Appliance name</label>
            <input class="input" name="name" placeholder="e.g. Bedroom Fan" value="${escapeHtml(ui.draft.name)}" required maxlength="40"></div>
          <div class="field"><label>Power rating (watts)</label>
            <input class="input" type="number" name="watts" min="1" max="10000" placeholder="e.g. 120" value="${escapeHtml(ui.draft.watts)}" required></div>
        </div>
        <div class="field mt-16"><label>Picture</label><div class="picker">${picker}</div></div>
        <button class="btn mt-16" type="submit">+ Add appliance</button>
      </form>
    </div>

    <div class="appliance-grid mt-22">${cards || '<div class="empty"><div class="empty-icon">🔌</div><h3>Nothing here yet</h3><p>Add your first appliance above to start tracking.</p></div>'}</div>
  `;
}

function usageView() {
  const s = getState();
  const { items } = rangeData(ui.usageMode);
  const totalEnergy = items.reduce((a, i) => a + i.energy, 0);
  const totalCost = totalEnergy * s.tariff;
  const avg = items.length ? totalEnergy / items.length : 0;
  const labels = { daily: 'last 7 days', weekly: 'last 6 weeks', monthly: 'last 6 months' };
  const flagged = new Set(anomalies().map(a => a.key));

  const rows = items.slice().reverse().map(i => `<tr>
    <td><strong>${escapeHtml(i.fullLabel)}</strong>${i.key && flagged.has(i.key) ? ' <span class="badge red">⚠ High</span>' : ''}</td>
    <td class="num">${niceNumber(i.energy)} kWh</td>
    <td class="num">${money(i.cost)}</td>
    <td><div class="app-cell">${i.top?.id ? art(s.appliances.find(a => a.id === i.top.id)?.type || 'other') : '<span class="muted">—</span>'}<span>${escapeHtml(i.top?.name || '—')}</span></div></td>
    <td><div style="height:6px;border-radius:6px;background:#eef0f6;max-width:110px"><div style="height:6px;border-radius:6px;background:var(--accent);width:${clamp(pct(i.energy, Math.max(...items.map(x => x.energy), .0001)), 2, 100)}%"></div></div></td>
  </tr>`).join('');

  return `
    <div class="section-head">
      <div><h2>Usage reports</h2><p>Every reading is stored locally — ${labels[ui.usageMode]}</p></div>
      <div class="segment">
        ${['daily', 'weekly', 'monthly'].map(m => `<button class="${ui.usageMode === m ? 'active' : ''}" data-action="usage-mode" data-mode="${m}">${m[0].toUpperCase() + m.slice(1)}</button>`).join('')}
      </div>
    </div>

    <div class="grid grid-3">
      ${statCard('Total energy', niceNumber(totalEnergy), 'kWh', 'usage', 'violet', labels[ui.usageMode])}
      ${statCard('Total cost', money(totalCost, 0), '', 'insights', 'amber', `at ${money(s.tariff)}/unit`)}
      ${statCard('Average per period', niceNumber(avg), 'kWh', 'dashboard', 'blue', `~${money(avg * s.tariff, 0)}`)}
    </div>

    <div class="card panel mt-16">
      <div class="panel-head"><h3>Energy trend</h3><span class="muted">kWh · hover for exact values</span></div>
      ${barChart(items.map(i => ({ label: i.label, value: i.energy, fullLabel: i.fullLabel })), { formatter: v => niceNumber(v, 1), height: 260 })}
    </div>

    <div class="card panel mt-16">
      <div class="panel-head"><h3>Stored report</h3><span class="muted">${items.length} periods</span></div>
      <div class="table-wrap"><table class="data">
        <thead><tr><th>Period</th><th>Energy</th><th>Cost</th><th>Top appliance</th><th>Relative use</th></tr></thead>
        <tbody>${rows}</tbody>
      </table></div>
      <div class="hint">Reports keep up to 90 days of readings in this browser. Connect your sensor API to store the same fields on a server.</div>
    </div>
  `;
}

function reportsView() {
  const s = getState();
  const prefix = ui.reportMonth;
  const [yr, mo] = prefix.split('-').map(Number);
  const monthLabel = `${MONTHS[mo - 1]} ${yr}`;
  const now = new Date();
  const currentPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const isCurrent = prefix === currentPrefix;
  const daysInMonth = new Date(yr, mo, 0).getDate();

  const dates = [];
  for (let day = 1; day <= daysInMonth; day++) {
    const k = `${prefix}-${String(day).padStart(2, '0')}`;
    if (isCurrent && k > todayKey()) continue;
    dates.push(k);
  }

  const flagged = new Set(anomalies().map(a => a.key));
  const maxE = Math.max(...dates.map(dayEnergy), .0001);
  ui.reportRows = dates.map(k => {
    const dd = new Date(k + 'T12:00:00');
    const top = dayTop(k);
    return {
      date: k,
      weekday: WEEKDAYS_LONG[dd.getDay()],
      energy: dayEnergy(k),
      cost: dayCost(k),
      topId: top.id,
      topName: s.appliances.find(a => a.id === top.id)?.name || '—',
      anomaly: flagged.has(k)
    };
  });

  const total = ui.reportRows.reduce((sum, r) => sum + r.energy, 0);
  const highDays = ui.reportRows.filter(r => r.anomaly).length;
  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const k = shiftMonth(i);
    const [y, m] = k.split('-').map(Number);
    return `<option value="${k}" ${prefix === k ? 'selected' : ''}>${MONTHS[m - 1]} ${y}</option>`;
  }).join('');

  const rows = ui.reportRows.slice().reverse().map(r => `<tr class="clickable-row" data-action="report-day" data-date="${r.date}" title="View appliance details for ${r.date}">
    <td><strong>${r.date}</strong><div class="tiny muted">${r.weekday}</div></td>
    <td class="num">${niceNumber(r.energy)} kWh</td>
    <td class="num">${money(r.cost)}</td>
    <td><div style="height:6px;border-radius:6px;background:#eef0f6;max-width:120px"><div style="height:6px;border-radius:6px;background:${r.anomaly ? 'var(--red)' : 'var(--accent)'};width:${clamp(pct(r.energy, maxE), 2, 100)}%"></div></div></td>
    <td>${r.anomaly ? '<span class="badge red">⚠ High</span>' : '<span class="badge green">Normal</span>'}</td>
    <td class="tiny muted">View →</td>
  </tr>`).join('');

  return `
    <div class="section-head">
      <div><h2>Reports & downloads</h2><p>Month-wise daily readings, ready to export</p></div>
      <select class="select date-select" data-action="set-report-month">${monthOptions}</select>
    </div>

    <div class="grid grid-3">
      ${statCard(`${monthLabel} energy`, niceNumber(total), 'kWh', 'usage', 'violet', `${ui.reportRows.length} days recorded`)}
      ${statCard(`${monthLabel} cost`, money(total * s.tariff, 0), '', 'insights', 'amber', `at ${money(s.tariff)}/unit`)}
      ${statCard('High-usage days', String(highDays), 'days', 'reports', highDays ? 'red' : 'green', 'above normal baseline')}
    </div>

    <div class="card panel mt-16 no-print">
      <div class="panel-head"><h3>Download ${monthLabel} report</h3><span class="muted">CSV, JSON or print to PDF</span></div>
      <div class="chip-row">
        <button class="btn btn-sm" data-action="download-csv">⬇ Daily CSV</button>
        <button class="btn btn-ghost btn-sm" data-action="download-detail-csv">⬇ Appliance-wise CSV</button>
        <button class="btn btn-ghost btn-sm" data-action="download-json">⬇ JSON</button>
        <button class="btn btn-dark btn-sm" data-action="print-report">🖨 Print / Save PDF</button>
      </div>
    </div>

    <div class="card panel mt-16">
      <div class="panel-head"><h3>${monthLabel} — daily data</h3><span class="muted">Click any day for appliance details</span></div>
      <div class="table-wrap"><table class="data">
        <thead><tr><th>Date</th><th>Energy</th><th>Cost</th><th>Relative use</th><th>Status</th><th></th></tr></thead>
        <tbody>${rows}</tbody>
      </table></div>
    </div>
  `;
}

function creditsView() {
  const c = credits();
  const rows = c.recent.map(r => `<tr>
    <td><strong>${r.date}</strong><div class="tiny muted">${weekday(new Date(r.date + 'T12:00:00'), true)}</div></td>
    <td class="num">${niceNumber(r.energy)} kWh</td>
    <td>${r.saved ? '<span class="badge green">Below average</span>' : '<span class="badge">Above average</span>'}</td>
    <td class="num" style="color:var(--green)">+${r.credits.toLocaleString('en-IN')}</td>
  </tr>`).join('');

  return `
    <div class="section-head">
      <div><h2>Green Credits</h2><p>Save energy, earn credits, level up</p></div>
      <span class="badge green">🌿 Eco rewards</span>
    </div>

    <div class="card credit-hero">
      <div>
        <div class="tiny" style="opacity:.75">YOUR BALANCE</div>
        <div class="credit-big">${c.balance.toLocaleString('en-IN')}<span> credits</span></div>
        <div class="tiny" style="opacity:.8">${c.tier} tier${c.next ? ` · ${c.progress.toFixed(0)}% to ${c.next}` : ' · highest tier reached'}</div>
        <div class="credit-progress"><i style="width:${c.progress}%"></i></div>
      </div>
      <div class="credit-trophy">🏆</div>
    </div>

    <div class="grid grid-3 mt-16">
      ${statCard('Earned this week', c.weekly.toLocaleString('en-IN'), 'credits', 'credits', 'green', '₹1 saved = 1 credit')}
      ${statCard('Saving streak', String(c.streak), 'days', 'dashboard', 'amber', 'below average days in a row')}
      ${statCard('Saved this week', money(c.saved, 0), '', 'insights', 'blue', `vs ${niceNumber(c.baseline)} kWh/day baseline`)}
    </div>

    <div class="grid grid-2 mt-16">
      <div class="card panel">
        <div class="panel-head"><h3>Recent credits</h3><span class="muted">last 7 days</span></div>
        <div class="table-wrap"><table class="data">
          <thead><tr><th>Date</th><th>Used</th><th>Result</th><th>Earned</th></tr></thead>
          <tbody>${rows}</tbody>
        </table></div>
      </div>
      <div class="card panel">
        <div class="panel-head"><h3>How credits work</h3><span class="muted">Built to encourage saving</span></div>
        <ul class="tip-list">
          <li><span class="num-dot">1</span><span>Your 30-day average is <strong>${niceNumber(c.baseline)} kWh/day</strong>. Use less than that and the rupees you save become credits.</span></li>
          <li><span class="num-dot">2</span><span>₹1 saved = <strong>1 green credit</strong>. Days above average earn nothing but do not reduce your balance.</span></li>
          <li><span class="num-dot">3</span><span>Tiers: Bronze → Silver (250) → Gold (600) → Platinum (1,200).</span></li>
          <li><span class="num-dot">4</span><span>Check the Anomaly Alerts in AI Insights — avoiding those spikes earns the most credits.</span></li>
        </ul>
      </div>
    </div>
  `;
}

function insightsView() {
  const shares = applianceShares(7).filter(a => a.energy > 0);
  const total = shares.reduce((sum, a) => sum + a.energy, 0);
  const score = efficiencyScore();
  const donutSegments = shares.slice(0, 5).map((a, i) => ({
    label: a.name, value: a.energy, color: donutColors[i % donutColors.length]
  }));
  if (shares.length > 5) {
    donutSegments.push({ label: 'Others', value: shares.slice(5).reduce((s, a) => s + a.energy, 0), color: '#cbd2e0' });
  }
  const legend = donutSegments.map((d, i) => `<div class="spread" style="padding:6px 0;font-size:11.5px">
      <span class="row"><i style="width:9px;height:9px;border-radius:3px;background:${d.color}"></i>${escapeHtml(d.label)}</span>
      <strong>${pct(d.value, total)}%</strong>
    </div>`).join('');

  const cards = buildInsights().map(i => `<div class="card insight-card">
    <div class="insight-icon" style="${TONE_STYLE[i.tone]}">${i.icon}</div>
    <div><h3>${escapeHtml(i.title)}</h3><p>${escapeHtml(i.text)}</p>
      ${i.saving ? `<div class="saving">💰 ${escapeHtml(i.saving)}</div>` : ''}</div>
  </div>`).join('');

  const alerts = anomalies().slice(0, 5);
  const alertPanel = `<div class="card panel mt-16">
    <div class="panel-head"><h3>🚨 Anomaly alerts</h3>
      <span class="badge ${alerts.length ? 'red' : 'green'}">${alerts.length ? alerts.length + ' flagged day(s)' : 'All normal'}</span></div>
    ${alerts.length ? `<div class="table-wrap"><table class="data">
      <thead><tr><th>Day</th><th>Used</th><th>Above normal</th><th>Extra cost</th><th>Status</th></tr></thead>
      <tbody>${alerts.map(a => `<tr>
        <td><strong>${escapeHtml(a.label)}</strong></td>
        <td class="num">${niceNumber(a.energy)} kWh</td>
        <td class="num" style="color:var(--red)">+${Math.round((a.ratio - 1) * 100)}%</td>
        <td class="num">${money(a.extraCost)}</td>
        <td><span class="badge red">⚠ Warning</span></td>
      </tr>`).join('')}</tbody>
    </table></div>` : '<div class="empty tiny" style="padding:20px">No unusual spikes detected in the last 30 days. ✅</div>'}
    <div class="hint">A day is flagged when it uses more than 18% above your 30-day average and outside the normal variation band.</div>
  </div>`;

  return `
    <div class="grid grid-2">
      <div class="card panel">
        <div class="panel-head"><h3>Efficiency score</h3><span class="badge ${score >= 80 ? 'green' : score >= 60 ? 'amber' : 'red'}">${score >= 80 ? 'Good' : score >= 60 ? 'Fair' : 'Needs attention'}</span></div>
        <div class="score-ring">${gauge(score / 100, score + '/100', 'Efficiency score')}</div>
        <p class="tiny muted" style="text-align:center;line-height:1.6">Based on your top consumer, always-on load, live heavy devices and today's pacing versus your average.</p>
      </div>
      <div class="card panel">
        <div class="panel-head"><h3>Where your energy goes</h3><span class="muted">last 7 days</span></div>
        <div class="grid grid-2" style="align-items:center;gap:8px">
          ${donutChart(donutSegments, { centerTop: niceNumber(total, 0), centerBottom: 'kWh total' })}
          <div>${legend}</div>
        </div>
      </div>
    </div>

    <div class="section-head mt-22"><div><h2>Personalised insights</h2><p>Generated from your own readings</p></div><span class="badge violet">AI Insights</span></div>
    <div class="grid grid-2">${cards}</div>
    ${alertPanel}

    <div class="card panel mt-16">
      <div class="panel-head"><h3>Action checklist</h3><span class="muted">Start with the first two</span></div>
      <ul class="tip-list">${recommendations().map((t, i) => `<li><span class="num-dot">${i + 1}</span><span>${escapeHtml(t)}</span></li>`).join('')}</ul>
    </div>
  `;
}

const QUICK = [
  'Which appliance uses the most?',
  'How much did I spend today?',
  'Were there any unusual spikes?',
  'How many green credits do I have?',
  'How can I save money?',
  'How will sensors connect?'
];

function chatView() {
  const s = getState();
  const msgs = s.chat.map(m => `<div class="msg ${m.role}">
    ${m.role === 'bot' ? '<div class="small-avatar">⚡</div>' : ''}
    <div><div class="bubble">${escapeHtml(m.text)}</div><div class="msg-meta">${m.role === 'bot' ? 'EnergyIQ' : 'You'} · ${timeAgo(m.ts)}</div></div>
  </div>`).join('');

  return `<div class="card chat-card">
    <div class="chat-head">
      <div class="bot-avatar">⚡</div>
      <div><strong>EnergyIQ Assistant</strong><span><span class="dot-live" style="display:inline-block;width:6px;height:6px;margin-right:5px"></span>Reading your live data</span></div>
      <button class="btn btn-ghost btn-sm" style="margin-left:auto" data-action="clear-chat">Clear chat</button>
    </div>
    <div class="chat-body">${msgs}${ui.chatTyping ? '<div class="msg bot"><div class="small-avatar">⚡</div><div class="bubble typing"><span></span><span></span><span></span></div></div>' : ''}</div>
    <div class="chat-quick">${QUICK.map(q => `<button class="chip" data-action="quick" data-q="${escapeHtml(q)}">${escapeHtml(q)}</button>`).join('')}</div>
    <form class="chat-input-row" data-form="chat">
      <input class="input" id="chat-input" name="message" placeholder="Ask about your energy usage…" value="${escapeHtml(ui.chatInput)}" autocomplete="off">
      <button class="send-btn" type="submit" title="Send" aria-label="Send message">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 2 11 13M22 2l-7 20-4-9-9-4z"/></svg>
      </button>
    </form>
  </div>`;
}

/* ---------- drawer / modal ---------- */

function renderSettings() {
  const s = getState();
  document.getElementById('settings-drawer').innerHTML = `
    <div class="drawer-head"><h2>Settings</h2><button class="icon-btn" data-action="close-settings" aria-label="Close">✕</button></div>

    <div class="drawer-section">
      <h3>Electricity tariff</h3>
      <form data-form="tariff">
        <div class="field"><label>Price per unit (kWh)</label>
          <input class="input" type="number" name="tariff" min="0.1" max="100" step="0.1" value="${s.tariff}"></div>
        <button class="btn btn-sm mt-16" type="submit">Save tariff</button>
      </form>
      <div class="hint">All cost figures recalculate instantly. Default is ₹8.50 per unit.</div>
    </div>

    <div class="drawer-section">
      <h3>Simulation speed</h3>
      <div class="segment">
        ${[1, 5, 15].map(v => `<button class="${s.simMinutesPerTick === v ? 'active' : ''}" data-action="set-speed" data-speed="${v}">${v} min/sec</button>`).join('')}
      </div>
      <div class="hint">Controls how fast simulated readings accumulate while devices are ON.</div>
    </div>

    <div class="drawer-section">
      <h3>Data & hardware</h3>
      <div class="hint">Appliances, 90-day usage history and chat are stored in this browser. The data layer is isolated so Wi-Fi sensors can write into it later.</div>
      <button class="btn btn-danger btn-sm mt-16" data-action="ask-reset">Reset demo data</button>
    </div>

    <div class="drawer-section">
      <h3>About</h3>
      <div class="hint">EnergyIQ v1.0 — web prototype. Built for live monitoring, appliance setup, usage reports, AI insights and an assistant chatbot.</div>
    </div>
  `;
}

function openDrawer() {
  renderSettings();
  document.getElementById('settings-drawer').classList.add('show');
  document.getElementById('drawer-backdrop').classList.add('show');
}
function closeDrawer() {
  document.getElementById('settings-drawer').classList.remove('show');
  document.getElementById('drawer-backdrop').classList.remove('show');
}
function openModal(html, wide = false) {
  const w = document.getElementById('modal-wrap');
  w.innerHTML = `<div class="modal ${wide ? 'wide' : ''}">${html}</div>`;
  w.classList.add('show');
}
function closeModal() {
  const w = document.getElementById('modal-wrap');
  w.classList.remove('show');
  w.innerHTML = '';
  ui.editId = null;
  ui.confirmDeleteId = null;
}
function toast(text, err = false) {
  const el = document.createElement('div');
  el.className = 'toast' + (err ? ' err' : '');
  el.textContent = text;
  document.getElementById('toast-wrap').append(el);
  setTimeout(() => el.remove(), 2800);
}

/* ---------- report exports ---------- */

function downloadFile(filename, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

function csvCell(v) { return '"' + String(v ?? '').replace(/"/g, '""') + '"'; }

function downloadReport(kind) {
  const rows = ui.reportRows || [];
  const prefix = ui.reportMonth;
  if (!rows.length) return toast('No data available for this month', true);
  const s = getState();

  if (kind === 'print') { window.print(); return; }

  if (kind === 'csv') {
    const lines = [['Date', 'Weekday', 'Energy (kWh)', 'Cost (INR)', 'Top appliance', 'Anomaly'].join(','),
      ...rows.map(r => [r.date, r.weekday, r.energy.toFixed(3), r.cost.toFixed(2), r.topName, r.anomaly ? 'HIGH' : 'Normal'].map(csvCell).join(','))];
    downloadFile(`energyiq-daily-${prefix}.csv`, lines.join('\n'), 'text/csv;charset=utf-8');
    toast('Daily CSV downloaded');
  }

  if (kind === 'detail') {
    const lines = [['Date', 'Appliance', 'Type', 'Watts', 'Run hours', 'Energy (kWh)', 'Cost (INR)'].join(',')];
    rows.forEach(r => s.appliances.forEach(a => {
      const st = applianceDayStats(r.date, a.id);
      lines.push([r.date, a.name, artLabel(a.type), a.watts, st.hours.toFixed(2), st.energy.toFixed(4), st.cost.toFixed(2)].map(csvCell).join(','));
    }));
    downloadFile(`energyiq-appliances-${prefix}.csv`, lines.join('\n'), 'text/csv;charset=utf-8');
    toast('Appliance-wise CSV downloaded');
  }

  if (kind === 'json') {
    const payload = {
      month: prefix, tariff: s.tariff, generatedAt: new Date().toISOString(),
      days: rows.map(r => ({ date: r.date, weekday: r.weekday, energyKWh: Number(r.energy.toFixed(4)), costINR: Number(r.cost.toFixed(2)), topAppliance: r.topName, anomaly: r.anomaly })),
      appliances: s.appliances.map(a => ({ id: a.id, name: a.name, watts: a.watts, type: a.type, addedBy: a.addedBy || 'user' }))
    };
    downloadFile(`energyiq-report-${prefix}.json`, JSON.stringify(payload, null, 2), 'application/json');
    toast('JSON report downloaded');
  }
}

function openDayDetail(date) {
  const s = getState();
  const dd = new Date(date + 'T12:00:00');
  const detail = s.appliances.map(a => ({ a, st: applianceDayStats(date, a.id) }))
    .filter(x => x.st.energy > 0)
    .sort((x, y) => y.st.energy - x.st.energy);
  const totalEnergy = detail.reduce((sum, x) => sum + x.st.energy, 0);
  const totalCost = totalEnergy * s.tariff;
  const flagged = anomalies().some(a => a.key === date);

  const rows = detail.length ? detail.map(({ a, st }) => `<tr>
    <td><div class="app-cell">${art(a.type)}<span><strong>${escapeHtml(a.name)}</strong><div class="tiny muted">${a.watts} W · ${artLabel(a.type)}</div></span></div></td>
    <td class="num">${niceNumber(st.hours)} h</td>
    <td class="num">${niceNumber(st.energy)} kWh</td>
    <td class="num">${money(st.cost)}</td>
  </tr>`).join('') : '<tr><td colspan="4" class="muted" style="text-align:center;padding:20px">No appliance usage recorded on this day.</td></tr>';

  openModal(`<h2>${WEEKDAYS_LONG[dd.getDay()]}, ${shortDate(dd)}</h2>
    <p>${flagged ? '⚠ This day was flagged as unusually high compared with your normal usage.' : 'Appliance-level breakdown for this day.'}</p>
    <div class="detail-summary">
      <div><span>TOTAL USED</span><strong>${niceNumber(totalEnergy)} kWh</strong></div>
      <div><span>DAY COST</span><strong>${money(totalCost)}</strong></div>
      <div><span>DEVICES USED</span><strong>${detail.length}</strong></div>
    </div>
    <div class="table-wrap"><table class="data">
      <thead><tr><th>Appliance</th><th>Run time</th><th>Energy</th><th>Cost</th></tr></thead>
      <tbody>${rows}</tbody>
    </table></div>
    <div class="modal-actions"><button class="btn btn-dark" data-action="cancel-modal">Close</button></div>`, true);
}

/* ---------- events ---------- */

function bindEvents() {
  document.addEventListener('click', e => {
    const el = e.target.closest('[data-action]');
    if (!el) return;
    const a = el.dataset.action;
    const s = getState();

    if (a === 'tab') {
      ui.tab = el.dataset.tab;
      renderNav(); renderView();
      document.getElementById('sidebar').classList.remove('open');
      ui.sidebarOpen = false;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (a === 'toggle-sidebar') {
      ui.sidebarOpen = !ui.sidebarOpen;
      document.getElementById('sidebar').classList.toggle('open', ui.sidebarOpen);
    } else if (a === 'open-settings') openDrawer();
    else if (a === 'close-settings') closeDrawer();
    else if (a === 'usage-mode') { ui.usageMode = el.dataset.mode; renderView(); }
    else if (a === 'pick-art') {
      ui.pickedType = el.dataset.type;
      if (!ui.wattsEdited) {
        const c = CATALOG.find(x => x.type === ui.pickedType);
        ui.draft.watts = c ? String(c.watts) : '';
      }
      renderView();
    } else if (a === 'edit-appliance') {
      const ap = s.appliances.find(x => x.id === el.dataset.id);
      if (!ap) return;
      ui.editId = ap.id;
      openModal(`<h2>Edit appliance</h2><p>Update the name or power rating. The picture type stays the same.</p>
        <form data-form="edit-appliance">
          <div class="field"><label>Name</label><input class="input" name="name" value="${escapeHtml(ap.name)}" required maxlength="40"></div>
          <div class="field mt-16"><label>Power rating (watts)</label><input class="input" type="number" name="watts" min="1" max="10000" value="${ap.watts}" required></div>
          <div class="modal-actions"><button type="button" class="btn btn-dark" data-action="cancel-modal">Cancel</button><button type="submit" class="btn">Save changes</button></div>
        </form>`);
    } else if (a === 'delete-appliance') {
      const ap = s.appliances.find(x => x.id === el.dataset.id);
      if (!ap) return;
      ui.confirmDeleteId = ap.id;
      openModal(`<h2>Remove ${escapeHtml(ap.name)}?</h2><p>Its saved usage history will also be removed from reports. This cannot be undone.</p>
        <div class="modal-actions"><button class="btn btn-dark" data-action="cancel-modal">Cancel</button>
        <button class="btn btn-danger" data-action="confirm-delete">Remove appliance</button></div>`);
    } else if (a === 'confirm-delete') {
      const id = ui.confirmDeleteId;
      s.appliances = s.appliances.filter(x => x.id !== id);
      Object.values(s.usage).forEach(b => { delete b[id]; });
      save(); closeModal(); renderNav(); renderView(); toast('Appliance removed');
    } else if (a === 'cancel-modal') closeModal();
    else if (a === 'set-speed') {
      s.simMinutesPerTick = Number(el.dataset.speed);
      save(); renderSettings(); toast(`Simulation speed: ${s.simMinutesPerTick} min/sec`);
    } else if (a === 'ask-reset') {
      openModal(`<h2>Reset all demo data?</h2><p>This restores the default appliances, regenerates 30 days of sample readings, and clears your chat.</p>
        <div class="modal-actions"><button class="btn btn-dark" data-action="cancel-modal">Cancel</button>
        <button class="btn btn-danger" data-action="confirm-reset">Reset everything</button></div>`);
    } else if (a === 'confirm-reset') {
      resetDemo(); closeModal(); closeDrawer(); ui.draft = { name: '', watts: '' }; ui.wattsEdited = false;
      renderNav(); renderView(); renderSettings(); toast('Demo data reset');
    } else if (a === 'clear-chat') {
      s.chat = [{ role: 'bot', ts: Date.now(), text: 'Chat cleared. Ask me anything about your energy usage! ⚡' }];
      save(); renderView(); renderNav(); toast('Chat cleared');
    } else if (a === 'quick') {
      submitChat(el.dataset.q);
    } else if (a === 'report-day') openDayDetail(el.dataset.date);
    else if (a === 'download-csv') downloadReport('csv');
    else if (a === 'download-detail-csv') downloadReport('detail');
    else if (a === 'download-json') downloadReport('json');
    else if (a === 'print-report') downloadReport('print');
  });

  document.addEventListener('change', e => {
    const el = e.target.closest('[data-action]');
    if (!el) return;
    if (el.dataset.action === 'set-appliance-date') {
      ui.applianceDate = el.value;
      renderView();
      return;
    }
    if (el.dataset.action === 'set-report-month') {
      ui.reportMonth = el.value;
      renderView();
      return;
    }
    const toggle = e.target.closest('[data-action="toggle-appliance"]');
    if (!toggle) return;
    const ap = getState().appliances.find(x => x.id === toggle.dataset.id);
    if (!ap) return;
    ap.on = toggle.checked;
    save(); renderView();
    toast(`${ap.name} switched ${ap.on ? 'ON' : 'OFF'}`);
  });

  document.addEventListener('input', e => {
    const form = e.target.closest('[data-form]');
    if (!form) return;
    if (form.dataset.form === 'add-appliance') {
      if (e.target.name === 'name') ui.draft.name = e.target.value;
      if (e.target.name === 'watts') { ui.draft.watts = e.target.value; ui.wattsEdited = true; }
    }
    if (e.target.name === 'message') ui.chatInput = e.target.value;
  });

  document.addEventListener('submit', e => {
    const form = e.target.closest('[data-form]');
    if (!form) return;
    e.preventDefault();
    const s = getState();
    const fd = new FormData(form);

    if (form.dataset.form === 'add-appliance') {
      const name = String(fd.get('name') || '').trim();
      const watts = Number(fd.get('watts'));
      if (!name || !(watts > 0)) return toast('Enter a name and valid wattage', true);
      s.appliances.push({
        id: uid(), name, watts, type: ui.pickedType, on: true, addedBy: 'user', addedAt: Date.now()
      });
      ui.draft = { name: '', watts: '' }; ui.wattsEdited = false;
      save(); renderNav(); renderView(); toast(`${name} added`);
    }

    else if (form.dataset.form === 'edit-appliance') {
      const ap = s.appliances.find(x => x.id === ui.editId);
      const name = String(fd.get('name') || '').trim();
      const watts = Number(fd.get('watts'));
      if (!ap || !name || !(watts > 0)) return toast('Enter a name and valid wattage', true);
      ap.name = name; ap.watts = watts;
      save(); closeModal(); renderNav(); renderView(); toast('Appliance updated');
    }

    else if (form.dataset.form === 'tariff') {
      const t = Number(fd.get('tariff'));
      if (!(t > 0)) return toast('Enter a valid tariff', true);
      s.tariff = t; save(); renderSettings(); renderView(); toast(`Tariff set to ${money(t)}/unit`);
    }

    else if (form.dataset.form === 'chat') {
      const text = String(fd.get('message') || '').trim();
      if (!text) return;
      submitChat(text);
    }
  });
}

function submitChat(text) {
  const s = getState();
  s.chat.push({ role: 'user', text, ts: Date.now() });
  ui.chatInput = '';
  ui.chatTyping = true;
  save(); renderView(); renderNav();
  setTimeout(() => {
    s.chat.push({ role: 'bot', text: chatReply(text), ts: Date.now() });
    ui.chatTyping = false;
    save(); renderView();
  }, 620);
}

/* ---------- boot ---------- */

// Inject the animated neon data-wave layers into every themed scene and the intro.
const NEON_WAVES = `<div class="neon-waves">
  <svg class="nw nw1" viewBox="0 0 1200 260" preserveAspectRatio="none"><path d="M-120 170 C80 40 180 280 360 160 S640 40 820 170 S1080 280 1320 140"/></svg>
  <svg class="nw nw2" viewBox="0 0 1200 260" preserveAspectRatio="none"><path d="M-120 90 C100 230 220 -20 420 120 S700 250 900 100 S1120 -10 1320 110"/></svg>
  <svg class="nw nw3" viewBox="0 0 1200 260" preserveAspectRatio="none"><path d="M-120 200 C120 90 240 260 440 170 S720 80 920 190 S1140 250 1320 160"/></svg>
  <div class="nw-particles"></div>
</div>`;
document.querySelectorAll('.scene, .intro').forEach(el => el.insertAdjacentHTML('afterbegin', NEON_WAVES));

getState();
save();
renderNav();
renderView();
renderSettings();
bindEvents();

setTimeout(() => document.getElementById('intro')?.remove(), 5600);

setInterval(() => {
  tick();
  if (ui.tab === 'dashboard') renderView(true);
  if (document.getElementById('settings-drawer').classList.contains('show')) renderSettings();
}, 1000);

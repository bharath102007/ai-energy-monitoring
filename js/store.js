/* Data layer — all appliance + usage state lives here.
   Today it is seeded / simulated locally. When Wi-Fi sensors are ready,
   replace `tick()` with the incoming sensor payload writer; every screen
   reads from `state.usage`, so nothing else needs to change. */

import { dateKey, todayKey, daysBack, pad, shortDate, MONTHS, uid, clamp } from './utils.js';

const KEY = 'energyiq.state.v1';

const DEFAULT_APPLIANCES = [
  { type: 'fridge',    name: 'Refrigerator',    watts: 150,  on: true  },
  { type: 'ac',        name: 'Air Conditioner', watts: 1200, on: true  },
  { type: 'tv',        name: 'Television',      watts: 120,  on: true  },
  { type: 'fan',       name: 'Ceiling Fan',     watts: 55,   on: true  },
  { type: 'light',     name: 'LED Lights',      watts: 18,   on: true  },
  { type: 'router',    name: 'Wi-Fi Router',    watts: 12,   on: true  },
  { type: 'laptop',    name: 'Laptop',          watts: 65,   on: true  },
  { type: 'washer',    name: 'Washing Machine', watts: 550,  on: false },
  { type: 'microwave', name: 'Microwave',       watts: 900,  on: false },
  { type: 'geyser',    name: 'Water Heater',    watts: 2000, on: false }
];

const DAILY_MINUTES = {
  fridge: 1440, router: 1440, ac: 300, tv: 210, washer: 60, fan: 480,
  light: 300, microwave: 25, laptop: 300, geyser: 45, oven: 30,
  phone: 90, dishwasher: 45, kettle: 20, other: 120
};

let state = null;

function rand(i, d) {
  const x = Math.sin((i + 1) * 97.31 + d * 13.77) * 43758.5453;
  return x - Math.floor(x);
}

function freshState() {
  const appliances = DEFAULT_APPLIANCES.map(a => ({
    id: uid(), ...a, addedBy: 'user', addedAt: Date.now() - 30 * 864e5
  }));

  const usage = {};
  const now = new Date();
  const elapsed = clamp((now.getHours() * 60 + now.getMinutes()) / 1440, 0.06, 1);

  for (let d = 29; d >= 0; d--) {
    const date = daysBack(d, now);
    const key = dateKey(date);
    const bucket = {};
    const weekend = (date.getDay() === 0 || date.getDay() === 6) ? 1.18 : 1;
    const fraction = d === 0 ? elapsed : 1;

    appliances.forEach((a, i) => {
      const base = DAILY_MINUTES[a.type] ?? 120;
      const jitter = 0.74 + rand(i, d) * 0.52;
      let minutes = base * jitter * weekend * fraction;
      if (a.type === 'fridge' || a.type === 'router') {
        minutes = 1440 * (0.91 + rand(i + 40, d) * 0.09) * fraction;
      }
      minutes = Math.min(minutes, 1440 * fraction);
      bucket[a.id] = a.watts * minutes; // watt-minutes
    });
    usage[key] = bucket;
  }

  return {
    version: 1,
    tariff: 8.5,
    simMinutesPerTick: 1,
    appliances,
    usage,
    chat: [{
      role: 'bot', ts: Date.now(),
      text: 'Hi! I am your EnergyIQ assistant ⚡\nAsk me anything about your usage — for example “Which appliance uses the most?” or “How can I save money?”'
    }],
    lastTickAt: Date.now(),
    createdAt: Date.now()
  };
}

function validate(s) {
  return s && s.version === 1 && Array.isArray(s.appliances) && s.usage && typeof s.usage === 'object';
}

function normalize(s) {
  if (!validate(s)) return null;
  s.appliances.forEach(a => { if (!a.addedBy) a.addedBy = 'user'; });
  if (!s.lastTickAt) s.lastTickAt = Date.now();
  return s;
}

export function getState() {
  if (!state) {
    try {
      const raw = localStorage.getItem(KEY);
      state = normalize(raw ? JSON.parse(raw) : null) || freshState();
    } catch (e) {
      state = freshState();
    }
  }
  return state;
}

export function save() {
  try { localStorage.setItem(KEY, JSON.stringify(getState())); } catch (e) { /* storage unavailable */ }
}

export function resetDemo() {
  state = freshState();
  save();
  return state;
}

export function tick() {
  // Always adopt the newest persisted state so a reset in another tab wins.
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = normalize(JSON.parse(raw));
      if (parsed) state = parsed;
    }
  } catch (e) { /* keep in-memory state */ }

  const s = getState();
  const now = Date.now();
  // Only one tab may write a reading per tick — prevents double counting.
  if (s.lastTickAt && now - s.lastTickAt < 900) return;
  s.lastTickAt = now;
  const key = todayKey();
  if (!s.usage[key]) s.usage[key] = {};
  const minutes = s.simMinutesPerTick || 1;
  s.appliances.forEach(a => {
    if (a.on) s.usage[key][a.id] = (s.usage[key][a.id] || 0) + a.watts * minutes;
  });

  // keep 90 days of history
  const cutoff = dateKey(daysBack(90));
  Object.keys(s.usage).forEach(k => { if (k < cutoff) delete s.usage[k]; });
  save();
}

/* ---------- reads ---------- */

export function livePower() {
  return getState().appliances.reduce((sum, a) => sum + (a.on ? a.watts : 0), 0);
}

export function dayEnergy(key) {
  const b = getState().usage[key] || {};
  let wm = 0;
  for (const id in b) wm += Number(b[id]) || 0;
  return wm / 60000; // kWh
}

export function dayCost(key) {
  return dayEnergy(key) * getState().tariff;
}

export function applianceDayEnergy(key, id) {
  return ((getState().usage[key] || {})[id] || 0) / 60000;
}

export function dayTop(key) {
  const s = getState();
  const b = s.usage[key] || {};
  let best = null, bestVal = 0;
  for (const id in b) {
    const v = (Number(b[id]) || 0) / 60000;
    if (v > bestVal) { bestVal = v; best = id; }
  }
  return { id: best, energy: bestVal };
}

export function lastDays(n) {
  return Array.from({ length: n }, (_, i) => dateKey(daysBack(n - 1 - i)));
}

export function averageDaily(n = 7) {
  const keys = lastDays(n);
  return keys.reduce((sum, k) => sum + dayEnergy(k), 0) / n;
}

export function totalForKeys(keys) {
  return keys.reduce((sum, k) => sum + dayEnergy(k), 0);
}

export function applianceShares(days = 7) {
  const s = getState();
  const keys = lastDays(days);
  const totals = {};
  s.appliances.forEach(a => { totals[a.id] = 0; });
  keys.forEach(k => s.appliances.forEach(a => {
    totals[a.id] += applianceDayEnergy(k, a.id);
  }));
  const grand = Object.values(totals).reduce((x, y) => x + y, 0);
  return s.appliances
    .map(a => ({ ...a, energy: totals[a.id] || 0, share: grand ? (totals[a.id] || 0) / grand : 0 }))
    .sort((a, b) => b.energy - a.energy);
}

export function rangeData(mode) {
  const s = getState();
  const items = [];

  if (mode === 'weekly') {
    for (let i = 5; i >= 0; i--) {
      const start = daysBack(i * 7 + 6);
      const end = daysBack(i * 7);
      const keys = [];
      for (let d = 0; d < 7; d++) keys.push(dateKey(daysBack(i * 7 + d)));
      const top = bucketTop(keys);
      items.push({
        label: shortDate(start),
        fullLabel: `${shortDate(start)} – ${shortDate(end)}`,
        keys, energy: totalForKeys(keys), top
      });
    }
  } else if (mode === 'monthly') {
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const prefix = `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
      const keys = Object.keys(s.usage).filter(k => k.startsWith(prefix));
      items.push({
        label: MONTHS[d.getMonth()],
        fullLabel: `${MONTHS[d.getMonth()]} ${d.getFullYear()}`,
        keys, energy: totalForKeys(keys), top: bucketTop(keys)
      });
    }
  } else {
    lastDays(7).forEach(k => {
      const d = new Date(k + 'T12:00:00');
      const top = dayTop(k);
      items.push({
        label: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()],
        fullLabel: `${['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][d.getDay()]}, ${shortDate(d)}`,
        key: k, keys: [k], energy: dayEnergy(k),
        top: { ...top, name: s.appliances.find(a => a.id === top.id)?.name || '—' }
      });
    });
  }

  items.forEach(it => { it.cost = it.energy * s.tariff; });
  return { items, tariff: s.tariff };
}

function bucketTop(keys) {
  const s = getState();
  const totals = {};
  keys.forEach(k => {
    const b = s.usage[k] || {};
    for (const id in b) totals[id] = (totals[id] || 0) + (Number(b[id]) || 0) / 60000;
  });
  let best = null, bestVal = 0;
  for (const id in totals) {
    if (totals[id] > bestVal) { bestVal = totals[id]; best = id; }
  }
  return { id: best, energy: bestVal, name: s.appliances.find(a => a.id === best)?.name || '—' };
}

/* ---------- per-appliance day detail + calendar helpers ---------- */

export function applianceDayWattMinutes(key, id) {
  return Number((getState().usage[key] || {})[id]) || 0;
}

export function applianceDayStats(key, id) {
  const s = getState();
  const wm = applianceDayWattMinutes(key, id);
  const ap = s.appliances.find(a => a.id === id);
  const energy = wm / 60000;
  const minutes = ap && ap.watts > 0 ? wm / ap.watts : 0;
  return { wm, minutes, hours: minutes / 60, energy, cost: energy * s.tariff };
}

export function monthKey(d = new Date()) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
}

export function shiftMonth(offset) {
  const now = new Date();
  return monthKey(new Date(now.getFullYear(), now.getMonth() - offset, 1));
}

export function monthKeys(prefix) {
  return Object.keys(getState().usage).filter(k => k.startsWith(prefix)).sort();
}

export function allDayKeys() {
  return Object.keys(getState().usage).sort();
}

/* Keep extra tabs in sync with the winning writer. */
if (typeof window !== 'undefined') {
  window.addEventListener('storage', e => {
    if (e.key !== KEY || !e.newValue) return;
    try {
      state = normalize(JSON.parse(e.newValue)) || state;
    } catch (err) { /* ignore malformed payload */ }
  });
}

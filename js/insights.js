/* Rule-based "AI" layer: reads the same data the dashboard reads.
   Swap this module for an LLM call later without touching the UI. */

import { getState, dayEnergy, dayCost, averageDaily, applianceShares, livePower, rangeData, lastDays, allDayKeys } from './store.js';
import { money, niceNumber, pct, clamp, todayKey, weekday, shortDate } from './utils.js';
import { artLabel } from './applianceArt.js';

export function efficiencyScore() {
  const shares = applianceShares(7);
  const top = shares[0];
  const s = getState();
  const baseline = shares.filter(a => a.type === 'fridge' || a.type === 'router')
    .reduce((sum, a) => sum + a.energy, 0);
  const total = shares.reduce((sum, a) => sum + a.energy, 0);
  const projected = projectedToday();
  const avg = averageDaily(7);

  let score = 100;
  if (top && top.share > .4) score -= 20;
  else if (top && top.share > .3) score -= 10;
  if (baseline / (total || 1) > .28) score -= 12;
  if (s.appliances.some(a => a.on && a.watts >= 1000)) score -= 12;
  if (avg > 0 && projected > avg * 1.2) score -= 10;
  return clamp(Math.round(score), 32, 98);
}

export function projectedToday() {
  const now = new Date();
  const fraction = clamp((now.getHours() * 60 + now.getMinutes()) / 1440, .06, 1);
  return dayEnergy(todayKey()) / fraction;
}

/* Days whose consumption is well above the normal baseline. */
export function anomalies(days = 30) {
  const keys = lastDays(days).filter(k => allDayKeys().includes(k));
  if (keys.length < 5) return [];
  const s = getState();
  const values = keys.map(dayEnergy);
  const mean = values.reduce((a, v) => a + v, 0) / values.length;
  const sd = Math.sqrt(values.reduce((a, v) => a + (v - mean) ** 2, 0) / values.length);
  const threshold = Math.max(mean + 1.25 * sd, mean * 1.18);

  return keys.map((k, i) => ({
    key: k,
    energy: values[i],
    cost: dayCost(k),
    ratio: mean ? values[i] / mean : 1,
    extraCost: Math.max(0, values[i] - mean) * s.tariff,
    label: `${weekday(new Date(k + 'T12:00:00'))}, ${shortDate(new Date(k + 'T12:00:00'))}`
  })).filter(x => x.energy > threshold).sort((a, b) => b.key.localeCompare(a.key));
}

export function recentAnomalies() {
  const recent = lastDays(3);
  return anomalies().filter(a => recent.includes(a.key));
}

/* Green credits: ₹1 saved against your 30-day average = 1 credit. */
export function credits() {
  const s = getState();
  const keys = lastDays(30).filter(k => allDayKeys().includes(k));
  if (!keys.length) return { balance: 0, weekly: 0, streak: 0, baseline: 0, tier: 'Bronze', next: 'Silver', progress: 0, recent: [], saved: 0 };

  const energies = keys.map(dayEnergy);
  const baseline = energies.reduce((a, v) => a + v, 0) / energies.length;
  const earn = k => Math.round(Math.max(0, baseline - dayEnergy(k)) * s.tariff);

  const balance = keys.reduce((sum, k) => sum + earn(k), 0);
  const weekKeys = lastDays(7);
  const weekly = weekKeys.reduce((sum, k) => sum + (allDayKeys().includes(k) ? earn(k) : 0), 0);
  const saved = weekKeys.reduce((sum, k) => sum + Math.max(0, baseline - dayEnergy(k)) * s.tariff, 0);

  let streak = 0;
  for (let i = 1; i < keys.length; i++) {
    const k = keys[keys.length - i];
    if (dayEnergy(k) < baseline * .92) streak++;
    else break;
  }

  const tiers = [
    { name: 'Bronze', min: 0 }, { name: 'Silver', min: 250 },
    { name: 'Gold', min: 600 }, { name: 'Platinum', min: 1200 }
  ];
  let idx = 0;
  tiers.forEach((t, i) => { if (balance >= t.min) idx = i; });
  const tier = tiers[idx].name;
  const next = tiers[idx + 1]?.name || null;
  const progress = next ? clamp((balance - tiers[idx].min) / (tiers[idx + 1].min - tiers[idx].min) * 100, 0, 100) : 100;

  const recent = weekKeys.slice().reverse().filter(k => allDayKeys().includes(k)).map(k => ({
    key: k, energy: dayEnergy(k), credits: earn(k), saved: dayEnergy(k) < baseline * .92
  }));

  return { balance, weekly, streak, baseline, tier, next, progress, recent, saved };
}

export function buildInsights() {
  const s = getState();
  const shares = applianceShares(7);
  const top = shares[0];
  const out = [];

  const spike = recentAnomalies().slice(0, 1)[0];
  if (spike) {
    out.push({
      icon: '🚨', tone: 'red',
      title: `Unusual spike on ${spike.label}`,
      text: `That day used ${niceNumber(spike.energy)} kWh — ${Math.round((spike.ratio - 1) * 100)}% above your normal daily average. It cost about ${money(spike.extraCost)} more than usual.`,
      saving: 'Check the Anomaly Alerts panel for all flagged days'
    });
  }

  if (top) {
    const high = top.share > .35;
    out.push({
      icon: high ? '⚠️' : '🔍', tone: high ? 'amber' : 'blue',
      title: `${top.name} is your biggest consumer`,
      text: `${pct(top.energy, shares.reduce((a, x) => a + x.energy, 0))}% of your last 7 days' energy — ${niceNumber(top.energy)} kWh. ${high
        ? 'Try reducing its runtime or upgrading to a more efficient model.'
        : 'That is a healthy share. Keep an eye on it during peak hours.'}`,
      saving: high ? money(top.energy * 0.15 * s.tariff, 0) + '/week possible saving' : ''
    });
  }

  const heavy = s.appliances.filter(a => a.on && a.watts >= 1000);
  if (heavy.length) {
    const a = heavy[0];
    const save = (a.watts * 120 / 60000) * s.tariff;
    out.push({
      icon: '🔥', tone: 'red',
      title: `${a.name} is running right now`,
      text: `It is drawing ${a.watts} W. Cutting it off for just 2 hours today would save about ${money(save)}.`,
      saving: money(save) + ' in 2 hours'
    });
  }

  const baseline = shares.filter(a => a.type === 'fridge' || a.type === 'router');
  const baseEnergy = baseline.reduce((sum, a) => sum + a.energy, 0);
  if (baseline.length) {
    const daily = baseEnergy / 7;
    out.push({
      icon: '🔌', tone: 'violet',
      title: 'Always-on devices never sleep',
      text: `${baseline.map(a => a.name).join(' and ')} consume about ${niceNumber(daily)} kWh every day, even when nobody is home. A smart plug or timer can help.`,
      saving: money(daily * 30 * s.tariff, 0) + '/month baseline'
    });
  }

  const avg = averageDaily(7);
  const proj = projectedToday();
  if (avg > 0) {
    const hot = proj > avg * 1.12;
    out.push({
      icon: hot ? '📈' : '✅', tone: hot ? 'amber' : 'green',
      title: hot ? 'Today is tracking above average' : 'You are below your weekly average',
      text: `At the current pace today will finish near ${niceNumber(proj)} kWh, compared with your ${niceNumber(avg)} kWh daily average.`,
      saving: hot ? '' : 'Good work — keep it up!'
    });
  }

  if (s.tariff >= 8) {
    out.push({
      icon: '🕒', tone: 'blue',
      title: 'Shift heavy loads off-peak',
      text: `At ${money(s.tariff)}/unit, one hour of your water heater costs about ${money(2000 / 1000 * s.tariff)}. Running it outside peak hours can cut the bill.`,
      saving: ''
    });
  }

  return out.slice(0, 5);
}

export function recommendations() {
  const shares = applianceShares(7);
  const top = shares[0];
  const s = getState();
  const list = [];
  if (top) list.push(`Cut ${top.name} runtime by 15% — roughly ${money(top.energy * .15 * s.tariff, 0)} saved per week.`);
  list.push('Switch off standby devices at the plug; phantom load adds up over a month.');
  list.push('Run the washing machine with full loads instead of several small ones.');
  list.push('Set the AC to 24–26°C — every degree lower can add ~6% to its power bill.');
  list.push('Review the Usage tab weekly; your reports are stored locally for 90 days.');
  return list;
}

/* ---------- chatbot ---------- */

function weeklyTotal() {
  return rangeData('weekly').items.slice(-1)[0];
}

function monthlyTotal() {
  return rangeData('monthly').items.slice(-1)[0];
}

export function chatReply(question) {
  const s = getState();
  const q = ' ' + question.toLowerCase().trim() + ' ';
  const has = (...words) => words.some(w => q.includes(w));

  if (has('hi ', 'hello', 'hey', 'vanakkam', 'namaste', 'good morning', 'good evening')) {
    return 'Hey! 👋 I can read your live energy data and answer questions about it. Try asking about your biggest appliance, today’s cost, or ways to save.';
  }

  if (has('which appliance', 'most energy', 'uses the most', 'highest', 'top consumer', 'maximum power')) {
    const a = applianceShares(7)[0];
    if (!a) return 'Add an appliance first and I will analyse it for you.';
    return `${a.name} uses the most energy — ${niceNumber(a.energy)} kWh over the last 7 days (${Math.round(a.share * 100)}% of your total). At ${money(s.tariff)}/unit that is about ${money(a.energy * s.tariff, 0)}.`;
  }

  if (has('sensor', 'hardware', 'wifi', 'wi-fi', 'connect', 'device', 'esp32')) {
    return 'This web prototype currently reads simulated data stored in your browser. The data layer is separate from the screens, so when Wi‑Fi energy sensors are ready their readings can be written into the same usage store — no UI rewrite needed. 🔌';
  }

  if (has('anomaly', 'abnormal', 'spike', 'warning', 'unusual')) {
    const a = anomalies().slice(0, 3);
    if (!a.length) return 'Good news — no unusual consumption spikes were detected in your last 30 days. ✅';
    return `${a.length} unusual day(s) detected:\n` + a.map(x => `• ${x.label}: ${niceNumber(x.energy)} kWh, ${Math.round((x.ratio - 1) * 100)}% above normal (~${money(x.extraCost, 0)} extra)`).join('\n');
  }

  if (has('credit', 'reward', 'points', 'green point')) {
    const c = credits();
    return `You have ${c.balance.toLocaleString('en-IN')} green credits (${c.tier} tier). ${c.weekly} earned this week and a ${c.streak}-day saving streak. ₹1 saved against your average = 1 credit. Keep it going! 🌿`;
  }

  if (has('today', 'this day')) {
    const e = dayEnergy(todayKey());
    return `So far today you have used ${niceNumber(e)} kWh, costing about ${money(e * s.tariff)}. At this pace the day should finish around ${niceNumber(projectedToday())} kWh.`;
  }

  if (has('week')) {
    const w = weeklyTotal();
    return `This week: ${niceNumber(w.energy)} kWh ≈ ${money(w.cost, 0)}. ${w.top?.name && w.top.name !== '—' ? `${w.top.name} is the top consumer.` : ''}`;
  }

  if (has('month')) {
    const m = monthlyTotal();
    return `This month: ${niceNumber(m.energy)} kWh ≈ ${money(m.cost, 0)}. ${m.top?.name && m.top.name !== '—' ? `${m.top.name} is leading the usage.` : ''}`;
  }

  if (has('save', 'saving', 'reduce', 'tips', 'suggest', 'lower')) {
    const tips = recommendations().slice(0, 3);
    return 'Here are three quick wins:\n' + tips.map((t, i) => `${i + 1}. ${t}`).join('\n');
  }

  if (has('bill', 'cost', 'spend', 'spending', 'rupee', 'money', 'how much', 'rate', 'tariff', 'unit price')) {
    const e = dayEnergy(todayKey());
    return `Your tariff is set to ${money(s.tariff)}/unit. Today's usage has cost ${money(e * s.tariff)} so far, and your weekly average is about ${money(averageDaily(7) * s.tariff, 0)} per day.`;
  }

  if (has('on right now', 'currently on', 'switch on', 'is on', 'turned on', 'running')) {
    const on = s.appliances.filter(a => a.on);
    return on.length
      ? `${on.length} appliances are ON right now (${niceNumber(livePower())} W total): ${on.map(a => a.name).join(', ')}.`
      : 'Nothing is running right now — your live load is 0 W.';
  }

  if (has('score', 'efficient', 'performance', 'how am i doing')) {
    return `Your efficiency score is ${efficiencyScore()}/100. ${efficiencyScore() >= 80 ? 'That is a solid result.' : 'There is room to improve — check the AI Insights tab for tailored suggestions.'}`;
  }

  if (has('trend', 'compare', 'compared', 'increase', 'decrease')) {
    const keys = lastDays(7);
    const recent = keys.slice(-3).reduce((a, k) => a + dayEnergy(k), 0) / 3;
    const before = keys.slice(0, 3).reduce((a, k) => a + dayEnergy(k), 0) / 3;
    const diff = before ? ((recent - before) / before) * 100 : 0;
    return `Your last 3 days averaged ${niceNumber(recent)} kWh/day versus ${niceNumber(before)} kWh/day before that — ${diff >= 0 ? 'up' : 'down'} ${Math.abs(Math.round(diff))}%.`;
  }

  if (has('help', 'what can you', 'who are you')) {
    return 'I can answer questions like:\n• Which appliance uses the most?\n• How much did I spend today?\n• Show my weekly / monthly usage\n• Were there any unusual spikes?\n• How many green credits do I have?\n• How can I save money?\n• How does the sensor hardware connect?';
  }

  if (has('thank', 'thanks')) return 'Anytime! ⚡ Come back whenever you want to check your usage.';

  // appliance-specific question
  const match = s.appliances.find(a =>
    q.includes(a.name.toLowerCase()) || q.includes(artLabel(a.type).toLowerCase())
  );
  if (match) {
    const wk = applianceShares(7).find(x => x.id === match.id) || { energy: 0, share: 0 };
    return `${match.name}: ${match.watts} W rated power, currently ${match.on ? 'ON' : 'OFF'}. Over the last 7 days it used ${niceNumber(wk.energy)} kWh (${Math.round(wk.share * 100)}% of total), about ${money(wk.energy * s.tariff, 0)} at your current tariff.`;
  }

  return 'I am not sure about that one, but I can help with your appliance usage, daily cost, weekly and monthly reports, savings tips and the sensor setup. Try one of those! 😊';
}

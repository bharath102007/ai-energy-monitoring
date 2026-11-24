/* Inline SVG "pictures" for appliances — no external image files needed. */

const ART = {
  fridge: {
    label: 'Fridge', watts: 150, bg: '#e8f4ff', fg: '#2277c9',
    draw: `<rect x="20" y="8" width="24" height="48" rx="5" fill="#fff" stroke="currentColor" stroke-width="2.5"/>
           <path d="M20 26h24" stroke="currentColor" stroke-width="2.5"/>
           <path d="M25 16v6M25 33v8" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>`
  },
  ac: {
    label: 'AC', watts: 1200, bg: '#e9f7ff', fg: '#1e90cf',
    draw: `<rect x="9" y="18" width="46" height="17" rx="4" fill="#fff" stroke="currentColor" stroke-width="2.5"/>
           <path d="M14 29h36" stroke="currentColor" stroke-width="2"/>
           <path d="M16 42c3-3 6-3 9 0M27 48c3-3 6-3 9 0M38 42c3-3 6-3 9 0" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>`
  },
  tv: {
    label: 'TV', watts: 120, bg: '#f0ecff', fg: '#6c5ce7',
    draw: `<rect x="9" y="13" width="46" height="30" rx="4" fill="#fff" stroke="currentColor" stroke-width="2.5"/>
           <path d="M32 43v8M23 52h18" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
           <path d="M15 19h13v9H15z" fill="currentColor" opacity=".18"/>`
  },
  washer: {
    label: 'Washer', watts: 550, bg: '#e9f7f2', fg: '#12a37f',
    draw: `<rect x="15" y="10" width="34" height="44" rx="5" fill="#fff" stroke="currentColor" stroke-width="2.5"/>
           <circle cx="32" cy="35" r="12" fill="none" stroke="currentColor" stroke-width="2.5"/>
           <circle cx="32" cy="35" r="5.5" fill="currentColor" opacity=".18"/>
           <path d="M20 17h9" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>`
  },
  fan: {
    label: 'Fan', watts: 55, bg: '#fff5e6', fg: '#e08a12',
    draw: `<circle cx="32" cy="29" r="4.5" fill="currentColor"/>
           <path d="M31 25c-2-9 2-15 8-14 5 1 4 8-3 13M36 31c9-1 15 4 13 10-2 5-9 3-13-4M28 31c-8 4-15 1-14-5 1-4 7-5 13-1" fill="currentColor" opacity=".78"/>
           <path d="M32 34v14M25 51h14" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>`
  },
  light: {
    label: 'Light', watts: 18, bg: '#fff8e0', fg: '#d99b09',
    draw: `<path d="M32 9c-9 0-15 7-15 15 0 6 3 10 6 12 1 1 2 2 2 4h14c0-2 1-3 2-4 3-2 6-6 6-12 0-8-6-15-15-15Z" fill="#fff" stroke="currentColor" stroke-width="2.5"/>
           <path d="M26 44h12M28 49h8" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>`
  },
  microwave: {
    label: 'Microwave', watts: 900, bg: '#eef1ff', fg: '#5566d9',
    draw: `<rect x="8" y="19" width="48" height="27" rx="4" fill="#fff" stroke="currentColor" stroke-width="2.5"/>
           <rect x="13" y="24" width="25" height="17" rx="2" fill="currentColor" opacity=".16"/>
           <path d="M45 25v4M51 25v4M45 33v4M51 33v4" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>`
  },
  laptop: {
    label: 'Laptop', watts: 65, bg: '#edf7f4', fg: '#149a81',
    draw: `<rect x="12" y="14" width="40" height="27" rx="3" fill="#fff" stroke="currentColor" stroke-width="2.5"/>
           <path d="M7 46h50l-4 5H11z" fill="currentColor" opacity=".2" stroke="currentColor" stroke-width="2"/>`
  },
  router: {
    label: 'Router', watts: 12, bg: '#f2f4ff', fg: '#6674d8',
    draw: `<rect x="12" y="32" width="40" height="18" rx="4" fill="#fff" stroke="currentColor" stroke-width="2.5"/>
           <path d="M20 32V18M44 32V18" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
           <circle cx="22" cy="41" r="2.4" fill="currentColor"/><circle cx="30" cy="41" r="2.4" fill="currentColor"/><circle cx="38" cy="41" r="2.4" fill="currentColor"/>`
  },
  geyser: {
    label: 'Water heater', watts: 2000, bg: '#ffeff1', fg: '#df5465',
    draw: `<rect x="20" y="10" width="24" height="44" rx="12" fill="#fff" stroke="currentColor" stroke-width="2.5"/>
           <path d="M20 24h24" stroke="currentColor" stroke-width="2"/><circle cx="32" cy="40" r="4" fill="currentColor"/>
           <path d="M27 10h10" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>`
  },
  oven: {
    label: 'Oven', watts: 1200, bg: '#fff0eb', fg: '#dd6b47',
    draw: `<rect x="12" y="12" width="40" height="40" rx="5" fill="#fff" stroke="currentColor" stroke-width="2.5"/>
           <rect x="18" y="22" width="28" height="22" rx="3" fill="currentColor" opacity=".15"/>
           <path d="M18 19h10M40 19h6" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>`
  },
  phone: {
    label: 'Charger', watts: 15, bg: '#f0f3ff', fg: '#5b6fd8',
    draw: `<rect x="23" y="8" width="18" height="46" rx="4" fill="#fff" stroke="currentColor" stroke-width="2.5"/>
           <path d="M29 13h6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="32" cy="48" r="2" fill="currentColor"/>`
  },
  dishwasher: {
    label: 'Dishwasher', watts: 1400, bg: '#eaf6f7', fg: '#188d99',
    draw: `<rect x="15" y="10" width="34" height="44" rx="5" fill="#fff" stroke="currentColor" stroke-width="2.5"/>
           <path d="M15 23h34M20 16h11" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
           <circle cx="32" cy="38" r="9" fill="none" stroke="currentColor" stroke-width="2.5"/>`
  },
  kettle: {
    label: 'Kettle', watts: 1800, bg: '#fff3e8', fg: '#d97a24',
    draw: `<path d="M18 25h28l-3 25H21z" fill="#fff" stroke="currentColor" stroke-width="2.5" stroke-linejoin="round"/>
           <path d="M22 25c0-8 4-13 10-13s10 5 10 13" fill="none" stroke="currentColor" stroke-width="2.5"/>
           <path d="M46 29c8 0 10 6 6 12" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>`
  },
  other: {
    label: 'Other', watts: 100, bg: '#f1f3f7', fg: '#75819b',
    draw: `<circle cx="32" cy="32" r="15" fill="#fff" stroke="currentColor" stroke-width="2.5"/>
           <path d="M26 28v8M38 28v8" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>`
  }
};

export const CATALOG = Object.entries(ART).map(([type, a]) => ({
  type, label: a.label, watts: a.watts
}));

export function art(type, className = 'art') {
  const a = ART[type] || ART.other;
  return `<span class="${className}" style="background:${a.bg};color:${a.fg}">
    <svg viewBox="0 0 64 64" width="100%" height="100%" aria-hidden="true">${a.draw}</svg>
  </span>`;
}

export function artLabel(type) {
  return (ART[type] || ART.other).label;
}

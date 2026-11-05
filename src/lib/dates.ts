export function dateKey(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

export function parseKey(k: string): Date {
  const [y, m, d] = k.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** Consecutive active days (xp>0 or frozen) ending today, or yesterday if today has nothing yet. */
export function computeStreak(days: Record<string, number>, frozen: string[] = [], today = new Date()): number {
  const active = (k: string) => (days[k] ?? 0) > 0 || frozen.includes(k);
  let d = new Date(today);
  if (!active(dateKey(d))) d = addDays(d, -1);
  let n = 0;
  while (active(dateKey(d))) {
    n++;
    d = addDays(d, -1);
  }
  return n;
}

export function longestStreak(days: Record<string, number>, frozen: string[] = []): number {
  const keys = Object.keys(days)
    .filter((k) => days[k] > 0)
    .concat(frozen)
    .sort();
  let best = 0;
  let cur = 0;
  let prev: Date | null = null;
  for (const k of Array.from(new Set(keys))) {
    const d = parseKey(k);
    if (prev && Math.round((d.getTime() - prev.getTime()) / 86400000) === 1) cur++;
    else cur = 1;
    best = Math.max(best, cur);
    prev = d;
  }
  return best;
}

export const WEEKDAYS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
export const MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

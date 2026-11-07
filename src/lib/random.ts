import type { Rng } from '../content/types';

/** Mulberry32 PRNG — deterministic when seeded. */
export function makeRng(seed = Date.now()): Rng {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const randInt = (rng: Rng, min: number, max: number) => Math.floor(rng() * (max - min + 1)) + min;
export const randNZ = (rng: Rng, min: number, max: number) => {
  let v = 0;
  while (v === 0) v = randInt(rng, min, max);
  return v;
};
export const pick = <T,>(rng: Rng, arr: readonly T[]): T => arr[Math.floor(rng() * arr.length)];

export function shuffle<T>(rng: Rng, arr: readonly T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Builds an MCQ option list: correct answer + distractors (deduplicated),
 * shuffled. Returns options and index of the correct one.
 */
export function mcqOptions(rng: Rng, correct: string, distractors: string[], n = 4): { options: string[]; answer: number } {
  const uniq: string[] = [];
  for (const d of distractors) if (d !== correct && !uniq.includes(d)) uniq.push(d);
  const chosen = shuffle(rng, uniq).slice(0, n - 1);
  const options = shuffle(rng, [correct, ...chosen]);
  return { options, answer: options.indexOf(correct) };
}

export function gcd(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) [a, b] = [b, a % b];
  return a;
}

/** Formats a number for pt-BR (comma decimal), trimming zeros. */
export function fmt(n: number, digits = 4): string {
  if (!isFinite(n)) return n > 0 ? '\\infty' : '-\\infty';
  const r = Math.round(n * 10 ** digits) / 10 ** digits;
  let s = r.toString();
  if (s.includes('e')) s = r.toFixed(digits);
  return s.replace('.', ',');
}

/** TeX for a fraction p/q reduced. */
export function fracTex(p: number, q: number): string {
  if (q < 0) {
    p = -p;
    q = -q;
  }
  const g = gcd(p, q) || 1;
  p /= g;
  q /= g;
  if (q === 1) return `${p}`;
  return `${p < 0 ? '-' : ''}\\frac{${Math.abs(p)}}{${q}}`;
}

/** Polynomial to TeX: coeffs[i] is coefficient of x^i. */
/** Signed monomial for TeX: term(-1, 'x^2', true) = '-x^2', term(3, 'y') = '+3y', term(0, …) = ''. */
export function term(c: number, body: string, first = false): string {
  if (!c) return '';
  const abs = Math.abs(c);
  const coef = body && abs === 1 ? '' : fmt(abs);
  return (c < 0 ? '-' : first ? '' : '+') + coef + body;
}

export function polyTex(coeffs: number[], v = 'x'): string {
  const terms: string[] = [];
  for (let i = coeffs.length - 1; i >= 0; i--) {
    const c = coeffs[i];
    if (!c) continue;
    const abs = Math.abs(c);
    const sign = c < 0 ? '-' : '+';
    let body: string;
    if (i === 0) body = `${fmt(abs)}`;
    else {
      const coef = abs === 1 ? '' : fmt(abs);
      body = coef + (i === 1 ? v : `${v}^{${i}}`);
    }
    terms.push((terms.length === 0 ? (c < 0 ? '-' : '') : ` ${sign} `) + body);
  }
  return terms.length ? terms.join('') : '0';
}

/** Signed term helper: "+ 3" / "- 3" for building expressions. */
export const sgn = (n: number) => (n < 0 ? `- ${fmt(-n)}` : `+ ${fmt(n)}`);

/** Number as a factor inside a worked computation: negatives get parentheses ("2+(-3)", "(-1)^2"). */
export const par = (n: number) => (n < 0 ? `(${fmt(n)})` : fmt(n));

/** "x - a" with the sign folded: xm(2) = "x-2", xm(-3) = "x+3", xm(0) = "x". */
export const xm = (a: number, v = 'x') => (a === 0 ? v : a > 0 ? `${v}-${fmt(a)}` : `${v}+${fmt(-a)}`);

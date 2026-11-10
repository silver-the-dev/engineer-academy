import { defaults } from '../../lib/circuit';
import type { CircuitSpec, Comp, CompType, PaletteItem, Pt } from '../../lib/circuit';
import { P } from '../../content/circuits';

export const names: Record<CompType, string> = {
  wire: 'Fio', resistor: 'Resistor', lamp: 'Lâmpada', switch: 'Chave', vsrc: 'Fonte DC', acsrc: 'Fonte AC',
  isrc: 'Fonte de corrente', clock: 'Clock', capacitor: 'Capacitor', inductor: 'Indutor', diode: 'Diodo',
  led: 'LED', zener: 'Zener', npn: 'NPN', pnp: 'PNP', nmos: 'NMOS', opamp: 'Amp-op', ground: 'Terra',
  input: 'Entrada', output: 'Saída', and: 'AND', or: 'OR', not: 'NOT', nand: 'NAND', nor: 'NOR',
  xor: 'XOR', xnor: 'XNOR', dff: 'Flip-flop D', voltmeter: 'Voltímetro', ammeter: 'Amperímetro',
};
export const allTypes = Object.keys(names) as CompType[];
export const units: Partial<Record<CompType, string>> = {
  resistor: 'Ω', lamp: 'Ω', vsrc: 'V', acsrc: 'V', clock: 'V', zener: 'V', isrc: 'A', capacitor: 'F', inductor: 'H',
};
export function engineering(value: number, unit = ''): string {
  if (!Number.isFinite(value)) return `${Number.isNaN(value) ? '—' : '∞'}${unit ? ` ${unit}` : ''}`;
  const a = Math.abs(value);
  const power = a === 0 ? 0 : Math.max(-12, Math.min(9, Math.floor(Math.log10(a) / 3) * 3));
  const prefixes: Record<number, string> = { '-12': 'p', '-9': 'n', '-6': 'µ', '-3': 'm', 0: '', 3: 'k', 6: 'M', 9: 'G' };
  // Four significant figures, with a fresh prefix if rounding crosses a boundary.
  const rounded = Number((value / 10 ** power).toPrecision(4));
  if (Math.abs(rounded) >= 1000 && power < 9) return engineering(Math.sign(value) * 10 ** (power + 3), unit);
  return `${String(rounded).replace('.', ',')}${unit || prefixes[power] ? ` ${prefixes[power]}${unit}` : ''}`;
}
export function partValue(c: Comp): string {
  if (c.hidden) return '?';
  if (units[c.type]) return engineering(c.value ?? defaults(c.type).value ?? 0, units[c.type]);
  if (c.type === 'npn' || c.type === 'pnp') return `β ${c.beta ?? 100}`;
  if (c.type === 'switch' || c.type === 'input') return c.on ? 'Ligado' : 'Desligado';
  return '';
}
export function limits(c: Comp): [number, number] {
  const range: [number, number] = c.type === 'capacitor' ? [1e-12, 1] : c.type === 'inductor' ? [1e-6, 100]
    : c.type === 'isrc' ? [1e-6, 10] : c.type === 'resistor' || c.type === 'lamp' ? [1, 1e7] : [0.1, 1000];
  return [c.min ?? c.values?.reduce((a, b) => Math.min(a, b), Infinity) ?? Math.min(range[0], c.value ?? range[0]),
    c.max ?? c.values?.reduce((a, b) => Math.max(a, b), -Infinity) ?? Math.max(range[1], c.value ?? range[1])];
}
export function offeredValues(c: Comp): number[] {
  const [min, max] = limits(c);
  if (c.values) return [...new Set(c.values)].filter(v => Number.isFinite(v) && v >= min && v <= max).sort((a, b) => a - b);
  const list = [min, max];
  for (let p = -12; p <= 9; p++) for (const e of [1, 1.2, 1.5, 1.8, 2.2, 2.7, 3.3, 3.9, 4.7, 5.6, 6.8, 8.2]) {
    const v = Number((e * 10 ** p).toPrecision(8));
    if (v >= min && v <= max) list.push(v);
    if (-v >= min && -v <= max) list.push(-v);
  }
  if (min <= 0 && max >= 0) list.push(0);
  return [...new Set(list)].sort((a, b) => a - b);
}
export function stepValue(c: Comp, direction: number): number {
  const list = offeredValues(c), current = c.value ?? defaults(c.type).value ?? 0;
  return direction > 0 ? list.find(v => v > current + Math.abs(current) * 1e-8) ?? list[list.length - 1]
    : [...list].reverse().find(v => v < current - Math.abs(current) * 1e-8) ?? list[0];
}
// Positive ranges are logarithmic; a signed logarithm also supports sources spanning zero.
export function sliderMap(c: Comp) {
  const [a, b] = limits(c), base = Math.max(1e-12, Math.min(Math.abs(a) || 1, Math.abs(b) || 1));
  const f = (v: number) => a > 0 ? Math.log(v) : Math.sign(v) * Math.log1p(Math.abs(v) / base);
  const inv = (v: number) => a > 0 ? Math.exp(v) : Math.sign(v) * Math.expm1(Math.abs(v)) * base;
  return {
    position: (v: number) => Math.max(0, Math.min(1, (f(Math.max(a, Math.min(b, v))) - f(a)) / (f(b) - f(a) || 1))),
    value: (t: number) => {
      const v = Math.max(a, Math.min(b, inv(f(a) + t * (f(b) - f(a)))));
      return c.values ? offeredValues(c).reduce((best, n) => Math.abs(f(n) - f(v)) < Math.abs(f(best) - f(v)) ? n : best, c.values[0]) : Number(v.toPrecision(5));
    },
  };
}
export type Grid = { cols: number; rows: number; cell: number; x: number; y: number };
export function gridFor(spec: CircuitSpec, width: number): Grid {
  const pts = spec.comps.flatMap(c => c.pts);
  const x = spec.cols ? 0 : Math.min(0, ...pts.map(p => p[0])) - 1;
  const y = spec.rows ? 0 : Math.min(0, ...pts.map(p => p[1])) - 1;
  const cols = spec.cols ?? Math.max(6, ...pts.map(p => p[0] - x + 1));
  const rows = spec.rows ?? Math.max(5, ...pts.map(p => p[1] - y + 1));
  return { cols, rows, cell: width / cols, x, y };
}
export const pixel = (p: Pt, g: Grid): Pt => [(p[0] - g.x) * g.cell, (p[1] - g.y) * g.cell];
export const nearest = (p: Pt, g: Grid): Pt => [Math.max(0, Math.min(g.cols, Math.round(p[0] / g.cell))) + g.x,
  Math.max(0, Math.min(g.rows, Math.round(p[1] / g.cell))) + g.y];
export function terminals(type: CompType, at: Pt, end: Pt): Pt[] {
  if (['ground', 'input', 'output'].includes(type)) return [at];
  if (type === 'npn' || type === 'pnp') return Object.values(P.bjt(at));
  if (type === 'nmos') return Object.values(P.mos(at));
  if (type === 'opamp') return Object.values(P.opamp(at));
  if (type === 'dff') return Object.values(P.dff(at));
  if (['and', 'nand', 'or', 'nor', 'xor', 'xnor', 'not'].includes(type)) {
    const p = P.gate(at, type === 'not' ? 1 : 2); return [...p.ins, p.out];
  }
  return [at, end];
}
export const isAnchored = (type: CompType) => terminals(type, [0, 0], [0, 0]).length !== 2 || type === 'not';
export const paletteItem = (p: PaletteItem | CompType): PaletteItem => typeof p === 'string' ? { type: p } : p;
export function hitPart(comps: Comp[], point: Pt, grid: Grid): Comp | undefined {
  const distance = (a: Pt, b: Pt) => {
    const dx = b[0] - a[0], dy = b[1] - a[1];
    const t = Math.max(0, Math.min(1, ((point[0] - a[0]) * dx + (point[1] - a[1]) * dy) / (dx * dx + dy * dy || 1)));
    return Math.hypot(point[0] - a[0] - t * dx, point[1] - a[1] - t * dy);
  };
  return comps.map(c => {
    const ps = c.pts.map(p => pixel(p, grid));
    const center: Pt = [ps.reduce((s, p) => s + p[0], 0) / ps.length, ps.reduce((s, p) => s + p[1], 0) / ps.length];
    return { c, d: ps.length <= 2 ? distance(ps[0], ps[1] ?? ps[0]) : Math.min(Math.hypot(point[0] - center[0], point[1] - center[1]), ...ps.map(p => distance(p, center))) };
  }).filter(v => v.d <= 20).sort((a, b) => a.d - b.d || Number(a.c.type === 'wire') - Number(b.c.type === 'wire'))[0]?.c;
}

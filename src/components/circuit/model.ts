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
  if (c.type === 'input') return c.on ? '1' : '0';
  if (c.type === 'switch') return c.on ? 'Ligado' : 'Desligado';
  return '';
}
/** IDs share a namespace, including existing authored parts and other types. */
export function nextId(type: CompType, comps: Comp[]): string {
  const prefixes: Record<CompType, string> = {
    wire: 'W', ground: 'GND', resistor: 'R', lamp: 'LP', inductor: 'L', capacitor: 'C',
    diode: 'D', led: 'LED', zener: 'Z', vsrc: 'V', acsrc: 'V', clock: 'V', isrc: 'I',
    switch: 'CH', npn: 'Q', pnp: 'Q', nmos: 'M', opamp: 'U', and: 'U', or: 'U',
    not: 'U', nand: 'U', nor: 'U', xor: 'U', xnor: 'U', dff: 'U', voltmeter: 'VM', ammeter: 'AM', input: '', output: 'S',
  };
  const used = new Set(comps.map(c => c.id));
  const letters = (n: number): string => n > 26 ? letters(Math.floor((n - 1) / 26)) + letters((n - 1) % 26 + 1) : String.fromCharCode(64 + n);
  for (let n = 1; ; n++) {
    const id = type === 'input' ? letters(n) : `${prefixes[type]}${n}`;
    if (!used.has(id)) return id;
  }
}
export const measurable = (c: Comp) => c.type !== 'wire' && c.type !== 'ground';
export function limits(c: Comp): [number, number] {
  const range: [number, number] = c.type === 'capacitor' ? [1e-9, 1e-2] : c.type === 'inductor' ? [1e-6, 10]
    : c.type === 'isrc' ? [1e-3, 2] : c.type === 'resistor' || c.type === 'lamp' ? [1, 1e6]
      : c.type === 'vsrc' ? [0, 24] : c.type === 'acsrc' || c.type === 'clock' ? [1, 50] : [0.1, 1000];
  const values = c.values?.filter(Number.isFinite);
  return [c.min ?? (values?.length ? Math.min(...values) : range[0]),
    c.max ?? (values?.length ? Math.max(...values) : range[1])];
}
export function offeredValues(c: Comp): number[] {
  const [min, max] = limits(c);
  if (c.values) return [...new Set(c.values)].filter(v => Number.isFinite(v) && v >= min && v <= max).sort((a, b) => a - b);
  const list = [min, max];
  for (let p = -12; p <= 9; p++) for (const e of [1, 1.1, 1.2, 1.3, 1.5, 1.6, 1.8, 2, 2.2, 2.4, 2.7, 3, 3.3, 3.6, 3.9, 4.3, 4.7, 5.1, 5.6, 6.2, 6.8, 7.5, 8.2, 9.1]) {
    const v = Number((e * 10 ** p).toPrecision(8));
    if (v >= min && v <= max) list.push(v);
    if (-v >= min && -v <= max) list.push(-v);
  }
  if (min <= 0 && max >= 0) list.push(0);
  return [...new Set(list)].sort((a, b) => a - b);
}
function stepIn(list: number[], current: number, direction: number): number {
  return direction > 0 ? list.find(v => v > current + Math.abs(current) * 1e-8) ?? list[list.length - 1] ?? current
    : [...list].reverse().find(v => v < current - Math.abs(current) * 1e-8) ?? list[0] ?? current;
}
export function stepValue(c: Comp, direction: number): number {
  return stepIn(offeredValues(c), c.value ?? defaults(c.type).value ?? 0, direction);
}
export function sliderValue(c: Comp, value: number): number {
  const [min, max] = limits(c), clamp = (v: number) => Math.max(min, Math.min(max, v));
  const v = clamp(value), values = c.values && offeredValues(c);
  if (values?.length) return values.reduce((best, n) => Math.abs(n - v) < Math.abs(best - v) ? n : best);
  return clamp(c.type === 'vsrc' ? Math.round(v * 2) / 2 : Number(v.toPrecision(2)));
}
// DC voltage is linear; positive ranges are logarithmic, signed ranges use log1p.
export function sliderMap(c: Comp) {
  const [a, b] = limits(c), base = Math.max(1e-12, Math.min(Math.abs(a) || 1, Math.abs(b) || 1));
  const f = (v: number) => c.type === 'vsrc' ? v : a > 0 ? Math.log(v) : Math.sign(v) * Math.log1p(Math.abs(v) / base);
  const inv = (v: number) => c.type === 'vsrc' ? v : a > 0 ? Math.exp(v) : Math.sign(v) * Math.expm1(Math.abs(v)) * base;
  return {
    position: (v: number) => Math.max(0, Math.min(1, (f(Math.max(a, Math.min(b, v))) - f(a)) / (f(b) - f(a) || 1))),
    value: (t: number) => sliderValue(c, inv(f(a) + Math.max(0, Math.min(1, t)) * (f(b) - f(a)))),
  };
}
export const frequencyValue = (c: Comp) => c.freq ?? defaults(c.type).freq ?? 60;
const frequencyPart: Comp = { id: '', type: 'acsrc', pts: [], min: 1, max: 1e5 };
export const frequencyMap = () => sliderMap(frequencyPart);
export function stepFrequency(c: Comp, direction: number): number {
  const values: number[] = [];
  for (let p = 0; p <= 5; p++) for (const m of [1, 2, 5]) if (m * 10 ** p <= 1e5) values.push(m * 10 ** p);
  return stepIn(values, frequencyValue(c), direction);
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

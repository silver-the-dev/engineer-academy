import type { Comp, CompState, Pt, Solution, SolveError } from './types';
import { applyEdit, defaults } from './edit';

const WIRE = 1e-5;
const GMIN = 1e-12;
const VT = 0.01;
const gates = new Set(['and', 'or', 'not', 'nand', 'nor', 'xor', 'xnor']);
const sources = new Set(['vsrc', 'acsrc', 'clock']);
const key = (p: Pt) => `${p[0]},${p[1]}`;
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const value = (c: Comp) => c.value ?? defaults(c.type).value ?? 0;
/** Difference between the forward drops of the emitter and collector junctions of a BJT (sets Vce in saturation). */
const BC_OFFSET = 0.2;
const drop = (c: Comp) => c.vf ?? (c.type === 'led' ? { red: 1.8, yellow: 2, green: 2.1, blue: 3, white: 3 }[c.color ?? 'red'] : 0.7);

type Mode = 'dc' | 'initial' | 'step';
type Memory = { logic: Map<string, boolean>; clk: Map<string, boolean>; energy: Map<string, number> };
type Part = { c: Comp; ns: number[]; bs: number[] };
type Topology = { parts: Part[]; nodes: number; size: number; nodeAt: (p: Pt) => number; floats: { ns: number[]; b: number }[] };

function topology(comps: Comp[]): Topology {
  const refs = new Set(comps.filter((c) => c.type === 'ground').map((c) => key(c.pts[0])));
  if (!refs.size) {
    const source = comps.find((c) => sources.has(c.type));
    // Logic sources have an implicit return; grounding an input would short its 5 V source.
    const implicit = comps.some((c) => c.type === 'input' || c.type === 'opamp' || c.type === 'dff' || gates.has(c.type));
    const ref = source?.pts[1] ?? (!implicit ? comps[0]?.pts[0] : undefined);
    if (ref) refs.add(key(ref));
  }
  const points = new Map<string, number>();
  let nodes = 1;
  comps.forEach((c) => c.pts.forEach((p) => { if (!points.has(key(p))) points.set(key(p), refs.has(key(p)) ? 0 : nodes++); }));
  const nodeAt = (p: Pt) => points.get(key(p)) ?? -1;
  let size = nodes - 1;
  const parts = comps.map((c): Part => {
    const n = c.type === 'dff' ? 2 : sources.has(c.type) || c.type === 'input' || c.type === 'opamp' || gates.has(c.type) || c.type === 'capacitor' || c.type === 'inductor' ? 1 : 0;
    return { c, ns: c.pts.map(nodeAt), bs: Array.from({ length: n }, () => size++) };
  });
  // Common-mode gmin is stamped through an extra unknown. Unlike adding 1e-12
  // to a 1e5 wire diagonal, this survives floating-point cancellation on islands.
  const parent = Array.from({ length: nodes }, (_, i) => i);
  const root = (n: number): number => parent[n] === n ? n : (parent[n] = root(parent[n]));
  const join = (a: number, b: number) => { parent[root(a)] = root(b); };
  for (const { c, ns } of parts) {
    if (c.type === 'input') join(ns[0], 0);
    else if (c.type === 'opamp' || gates.has(c.type)) join(ns[ns.length - 1], 0);
    else if (c.type === 'dff') { join(ns[2], 0); join(ns[3], 0); }
    else if (['wire', 'resistor', 'lamp', 'switch', 'vsrc', 'acsrc', 'clock', 'ammeter'].includes(c.type) && !(c.type === 'switch' && !c.on)) {
      // Only guaranteed conducting edges join groups. Storage and nonlinear
      // parts may be open in one of the solves; gmin must survive that too.
      for (let k = 1; k < ns.length; k++) join(ns[0], ns[k]);
    }
  }
  const groups = new Map<number, number[]>();
  for (let n = 1; n < nodes; n++) if (root(n) !== root(0)) groups.set(root(n), [...(groups.get(root(n)) ?? []), n]);
  const floats = [...groups.values()].map((ns) => ({ ns, b: size++ }));
  return { parts, nodes, size, nodeAt, floats };
}

/** Dense elimination with partial pivoting. Work arrays belong to this solve. */
function eliminate(a: Float64Array[], b: Float64Array): Float64Array | undefined {
  const n = b.length;
  for (let k = 0; k < n; k++) {
    let p = k;
    for (let j = k + 1; j < n; j++) if (Math.abs(a[j][k]) > Math.abs(a[p][k])) p = j;
    if (!Number.isFinite(a[p][k]) || Math.abs(a[p][k]) < 1e-30) return undefined;
    if (p !== k) { [a[p], a[k]] = [a[k], a[p]]; [b[p], b[k]] = [b[k], b[p]]; }
    for (let j = k + 1; j < n; j++) {
      const f = a[j][k] / a[k][k];
      if (!f) continue;
      a[j][k] = 0;
      for (let i = k + 1; i < n; i++) a[j][i] -= f * a[k][i];
      b[j] -= f * b[k];
    }
  }
  const x = new Float64Array(n);
  for (let k = n - 1; k >= 0; k--) {
    let v = b[k];
    for (let j = k + 1; j < n; j++) v -= a[k][j] * x[j];
    x[k] = v / a[k][k];
    if (!Number.isFinite(x[k])) return undefined;
  }
  return x;
}

/** Exponential in the useful range, C1 linear continuation above ~1e11 A.
 * An ideal LED directly on an ideal source can otherwise overflow IEEE doubles. */
function diode(v: number, vf: number): [number, number] {
  const z = (v - vf) / VT;
  const e = Math.exp(Math.min(z, 30));
  return [0.01 * (e * (z > 30 ? 1 + z - 30 : 1) - Math.exp(-vf / VT)), e];
}

function mos(c: Comp, v: number[]): { i: number; gm: number; gd: number; reverse: boolean } {
  const reverse = v[1] < v[2];
  const s = reverse ? v[1] : v[2], d = reverse ? v[2] : v[1];
  const u = v[0] - s - (c.vth ?? 2), w = d - s, k = c.k ?? 0.5;
  if (u <= 0) return { i: 0, gm: 0, gd: 0, reverse };
  return w < u ? { i: k * (2 * u * w - w * w), gm: 2 * k * w, gd: 2 * k * (u - w), reverse }
    : { i: k * u * u, gm: 2 * k * u, gd: 0, reverse };
}

function gate(c: Comp, vs: number[]): boolean {
  const ins = vs.slice(0, -1).map((v) => v > 2.5);
  const and = ins.every(Boolean), or = ins.some(Boolean), xor = ins.filter(Boolean).length % 2 === 1;
  switch (c.type) {
    case 'and': return and;
    case 'nand': return !and;
    case 'or': return or;
    case 'nor': return !or;
    case 'not': return !ins[0];
    case 'xor': return xor;
    default: return !xor;
  }
}

function run(top: Topology, mode: Mode, t: number, dt: number, mem: Memory, previous?: Solution, sample = false): Solution {
  const { parts, nodes, size } = top;
  let x: Float64Array = new Float64Array(size);
  if (previous) for (let n = 1; n < nodes; n++) x[n - 1] = previous.nodeV[n] ?? 0;
  const voltage = (n: number) => n ? x[n - 1] : 0;
  const limited = new Map<string, number>();
  let error: SolveError | undefined = parts.length ? undefined : 'empty';
  const nonlinear = parts.some(({ c }) => ['diode', 'led', 'zener', 'npn', 'pnp', 'nmos', 'opamp'].includes(c.type));
  const floatingNodes = new Set(top.floats.flatMap((f) => f.ns));

  const analog = (): boolean => {
    for (let iter = 0; iter < (nonlinear ? 200 : 1); iter++) {
      const a = Array.from({ length: size }, () => new Float64Array(size));
      const rhs = new Float64Array(size);
      let wasLimited = false;
      const add = (r: number, col: number, g: number) => { if (r >= 0 && col >= 0) a[r][col] += g; };
      const inj = (n: number, i: number) => { if (n) rhs[n - 1] += i; };
      const conduct = (p: number, q: number, g: number) => {
        add(p - 1, p - 1, g); add(q - 1, q - 1, g); add(p - 1, q - 1, -g); add(q - 1, p - 1, -g);
      };
      const branch = (p: number, q: number, b: number, v: number, r = 0) => {
        add(p - 1, b, 1); add(q - 1, b, -1); add(b, p - 1, 1); add(b, q - 1, -1); add(b, b, -r); rhs[b] += v;
      };
      const current = (p: number, q: number, i: number) => { inj(p, -i); inj(q, i); };
      const controlled = (p: number, q: number, ns: number[], ds: number[], i: number, vs: number[]) => {
        ns.forEach((n, k) => { add(p - 1, n - 1, ds[k]); add(q - 1, n - 1, -ds[k]); });
        current(p, q, i - ds.reduce((sum, d, k) => sum + d * vs[k], 0));
      };
      const junction = (id: string, v: number, vf: number): [number, number, number] => {
        const old = limited.get(id) ?? (previous ? v : 0);
        let vl = v;
        // Logarithmic forward step limiting; the continued region is linear.
        if (old < vf + 30 * VT && v > vf - 0.1 && v - old > 2 * VT) {
          const base = Math.max(old, vf - 0.1);
          vl = Math.min(v, base + VT * Math.log1p(Math.max(0, v - base) / VT));
        }
        if (Math.abs(vl - v) > 1e-9) wasLimited = true;
        limited.set(id, vl);
        const [i, g] = diode(vl, vf);
        return [i, g, vl];
      };
      for (let n = 1; n < nodes; n++) if (!floatingNodes.has(n)) add(n - 1, n - 1, GMIN);
      for (const f of top.floats) {
        for (const n of f.ns) { add(n - 1, f.b, 1); add(f.b, n - 1, 1); }
        // Differential gmin + common-mode gmin equals an individual 1 pS
        // shunt at every node, without losing the island's common-mode pivot.
        for (let i = 0; i < f.ns.length; i++) for (let j = i + 1; j < f.ns.length; j++) conduct(f.ns[i], f.ns[j], GMIN / f.ns.length);
        add(f.b, f.b, -f.ns.length / GMIN);
      }
      for (const { c, ns, bs } of parts) {
        const [p, q = 0] = ns, [b] = bs, vs = ns.map(voltage), v = vs[0] - (vs[1] ?? 0);
        switch (c.type) {
          case 'wire': case 'ammeter': conduct(p, q, 1 / WIRE); break;
          case 'switch': if (c.on) conduct(p, q, 1 / WIRE); break;
          case 'resistor': case 'lamp': conduct(p, q, 1 / Math.max(WIRE, value(c))); break;
          case 'isrc': current(p, q, -value(c)); break;
          case 'vsrc': case 'acsrc': case 'clock': {
            let e = value(c);
            if (c.type === 'acsrc') e = (c.offset ?? 0) + (mode === 'dc' ? 0 : e * Math.sin(2 * Math.PI * (c.freq ?? 60) * t + (c.phase ?? 0) * Math.PI / 180));
            if (c.type === 'clock') e = mode === 'dc' || t === 0 || ((t * (c.freq ?? 1)) % 1 + 1e-12) % 1 < 0.5 ? 0 : e;
            branch(p, q, b, e); break;
          }
          case 'input': branch(p, 0, b, c.on ? 5 : 0); break;
          case 'capacitor': {
            const prev = mem.energy.get(c.id) ?? c.ic ?? 0;
            if (mode === 'dc' || value(c) <= 0) add(b, b, 1);
            else branch(p, q, b, prev, mode === 'initial' ? 0 : dt / value(c));
            // Open capacitors still have a branch-current unknown in DC.
            if (mode === 'dc' || value(c) <= 0) { add(p - 1, b, 1); add(q - 1, b, -1); }
            break;
          }
          case 'inductor': {
            if (mode === 'initial') { add(p - 1, b, 1); add(q - 1, b, -1); add(b, b, 1); rhs[b] = mem.energy.get(c.id) ?? c.ic ?? 0; }
            else { const r = mode === 'dc' ? WIRE : Math.max(0, value(c)) / dt; branch(p, q, b, mode === 'dc' ? 0 : -r * (mem.energy.get(c.id) ?? c.ic ?? 0), r); }
            break;
          }
          case 'diode': case 'led': case 'zener': {
            const [i, g, vl] = junction(c.id, v, drop(c));
            let j = i - g * vl, gd = g;
            if (c.type === 'zener') { const [ir, gr, vr] = junction(`${c.id}:z`, -v, value(c)); j -= ir - gr * vr; gd += gr; }
            conduct(p, q, gd); current(p, q, j); break;
          }
          case 'npn': case 'pnp': {
            const s = c.type === 'npn' ? 1 : -1, beta = c.beta ?? 100;
            const [ie, ge, ve] = junction(`${c.id}:be`, s * (vs[0] - vs[2]), drop(c));
            const [ic, gc, vc] = junction(`${c.id}:bc`, s * (vs[0] - vs[1]), drop(c) - BC_OFFSET);
            // Reciprocal Ebers-Moll: alphaF=beta/(beta+1), alphaR=1/2.
            // Forward junction is calibrated to base current, reverse beta is 1.
            // The collector junction turns on BC_OFFSET below the emitter junction, so a saturated
            // transistor sits at Vce ≈ 0.2 V, the value used in class.
            const dsB = [ge + beta * gc, -beta * gc, -ge];
            const dsC = [beta * ge - 2 * beta * gc, 2 * beta * gc, -beta * ge];
            const lv = [0, -s * vc, -s * ve];
            controlled(ns[0], ns[2], ns, dsB, s * (ie + beta * ic), lv);
            controlled(ns[1], ns[2], ns, dsC, s * beta * (ie - 2 * ic), lv);
            break;
          }
          case 'nmos': {
            const m = mos(c, vs), d = m.reverse ? ns[2] : ns[1], s = m.reverse ? ns[1] : ns[2];
            controlled(d, s, [ns[0], d, s], [m.gm, m.gd, -m.gm - m.gd], m.i, [vs[0], voltage(d), voltage(s)]); break;
          }
          case 'opamp': {
            const [lo, hi] = c.rails ?? [-15, 15], target = 1e5 * (vs[1] - vs[0]);
            branch(ns[2], 0, b, clamp(target, lo, hi));
            if (target > lo && target < hi) { add(b, ns[1] - 1, -1e5); add(b, ns[0] - 1, 1e5); rhs[b] = 0; }
            break;
          }
          case 'dff': branch(ns[2], 0, bs[0], mem.logic.get(c.id) ? 5 : 0); branch(ns[3], 0, bs[1], mem.logic.get(c.id) ? 0 : 5); break;
          default: if (gates.has(c.type)) branch(ns[ns.length - 1], 0, b, mem.logic.get(c.id) ? 5 : 0);
        }
      }
      const next = eliminate(a, rhs);
      if (!next) { error = 'singular'; return false; }
      let close = !wasLimited;
      for (let j = 0; j < size; j++) if (Math.abs(next[j] - x[j]) > (j < nodes - 1 ? 1e-8 : 1e-10) + 1e-8 * Math.max(Math.abs(next[j]), Math.abs(x[j]))) close = false;
      x = next;
      if (!nonlinear || close) return true;
    }
    error = 'noconv'; return false;
  };

  let converged = analog();
  const relax = () => {
    for (let round = 0; converged && round < 50; round++) {
      let changed = false;
      // Gauss-Seidel relaxation breaks the artificial synchronous oscillation of
      // a symmetric SR latch, while retaining its previous stable state.
      for (const { c, ns } of parts) if (gates.has(c.type)) {
        const next = gate(c, ns.map(voltage));
        if (next !== (mem.logic.get(c.id) ?? false)) {
          mem.logic.set(c.id, next); changed = true; converged = analog();
          if (!converged) return;
        }
      }
      if (!changed) return;
    }
    if (converged) { error = 'noconv'; converged = false; }
  };
  relax();
  if (sample && converged) {
    const updates: [string, boolean][] = [];
    for (const { c, ns } of parts) if (c.type === 'dff') {
      const clk = voltage(ns[1]) > 2.5;
      if (clk && !mem.clk.get(c.id)) updates.push([c.id, voltage(ns[0]) > 2.5]);
      mem.clk.set(c.id, clk);
    }
    if (updates.length) {
      updates.forEach(([id, q]) => mem.logic.set(id, q)); converged = analog(); relax();
    }
  }

  const comp: Record<string, CompState> = {};
  for (const { c, ns, bs } of parts) {
    const vs = ns.map(voltage);
    let v = vs[0] - (vs[1] ?? 0), i = 0;
    let pins = ns.map(() => 0);
    let on: boolean | undefined, burnt: boolean | undefined;
    let supplied = false;
    switch (c.type) {
      case 'wire': case 'ammeter': i = v / WIRE; break;
      case 'resistor': case 'lamp': i = v / Math.max(WIRE, value(c)); break;
      case 'switch': on = !!c.on; i = on ? v / WIRE : 0; break;
      case 'vsrc': case 'acsrc': case 'clock': i = -x[bs[0]]; supplied = true; break;
      case 'isrc': i = value(c); supplied = true; break;
      case 'capacitor': case 'inductor': i = x[bs[0]]; break;
      case 'diode': case 'led': case 'zener':
        i = diode(v, drop(c))[0];
        if (c.type === 'zener') i -= diode(-v, value(c))[0];
        if (c.type === 'led') { burnt = i > (c.imax ?? 0.03); on = i >= 0.001 && !burnt; }
        break;
      case 'npn': case 'pnp': {
        const s = c.type === 'npn' ? 1 : -1, beta = c.beta ?? 100;
        const je = diode(s * (vs[0] - vs[2]), drop(c))[0], jc = diode(s * (vs[0] - vs[1]), drop(c) - BC_OFFSET)[0];
        const ib = s * (je + beta * jc);
        i = s * beta * (je - 2 * jc); v = vs[1] - vs[2]; pins = [ib, i, -ib - i]; break;
      }
      case 'nmos': { const m = mos(c, vs); i = m.reverse ? -m.i : m.i; v = vs[1] - vs[2]; pins = [0, i, -i]; break; }
      case 'input': v = vs[0]; i = -x[bs[0]]; pins = [-i]; on = !!c.on; supplied = true; break;
      case 'output': v = vs[0]; on = v > 2.5; break;
      case 'opamp': v = vs[2]; i = -x[bs[0]]; pins = [0, 0, -i]; supplied = true; break;
      case 'dff': v = vs[2]; i = -x[bs[0]]; pins = [0, 0, x[bs[0]], x[bs[1]]]; on = v > 2.5; supplied = true; break;
      default:
        if (gates.has(c.type)) { v = vs[vs.length - 1]; i = -x[bs[0]]; pins[pins.length - 1] = -i; on = v > 2.5; supplied = true; }
    }
    if (ns.length === 2) pins = supplied ? [-i, i] : [i, -i];
    const power = ns.reduce((sum, _, k) => sum + vs[k] * pins[k], 0);
    const p = supplied ? -power : Math.max(0, power);
    if (c.type === 'lamp') on = p >= 0.05 * (c.rated ?? 36 / Math.max(WIRE, value(c)));
    comp[c.id] = { v, i, p, pins, ...(on !== undefined && { on }), ...(burnt !== undefined && { burnt }) };
    if (sources.has(c.type) && Math.abs(i) > 500 && !error) error = 'short';
  }
  return { ok: !error, ...(error && { error }), t, nodeV: [0, ...Array.from(x.slice(0, nodes - 1))], nodeAt: top.nodeAt, comp };
}

const memory = (): Memory => ({ logic: new Map(), clk: new Map(), energy: new Map() });

export function solveDC(comps: Comp[]): Solution {
  return run(topology(comps), 'dc', 0, 0, memory());
}

export class Sim {
  t = 0;
  solution!: Solution;
  private readonly top: Topology;
  private mem = memory();

  constructor(comps: Comp[]) {
    // Snapshot the input: edits require a new simulation, not half-updated stamps.
    this.top = topology(applyEdit(comps, {}));
    this.reset();
  }

  reset(): void {
    this.t = 0;
    this.mem = memory();
    this.solution = run(this.top, 'initial', 0, 0, this.mem);
    for (const { c, ns } of this.top.parts) if (c.type === 'dff') this.mem.clk.set(c.id, this.solution.nodeV[ns[1]] > 2.5);
  }

  step(dt: number): Solution {
    if (!Number.isFinite(dt) || dt <= 0) throw new RangeError('dt must be finite and positive');
    // Commit storage only after a successful step; initial values are explicit ic.
    const next = run(this.top, 'step', this.t + dt, dt, this.mem, this.solution, true);
    this.t += dt;
    this.solution = next;
    if (next.ok || next.error === 'short') for (const { c } of this.top.parts) {
      if (c.type === 'capacitor') this.mem.energy.set(c.id, next.comp[c.id].v);
      if (c.type === 'inductor') this.mem.energy.set(c.id, next.comp[c.id].i);
    }
    return next;
  }
}

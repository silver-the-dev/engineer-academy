/**
 * Authoring helpers for circuit exercises and circuit visuals (widget `circuit`).
 * Spec of the simulator: see src/lib/circuit/types.ts.
 *
 *   const c = circuit(
 *     V('fonte', [0, 0], [0, 3], 9),                      // + on top, − at the bottom
 *     wires([0, 0], [2, 0]), R('r1', [2, 0], [5, 0], 330),
 *     LED('led', [5, 0], [5, 3], 'red'),
 *     wires([5, 3], [0, 3]),
 *   );
 *   circuitEx('Ajuste $R_1$ para o LED receber 20 mA.', { comps: c }, (v) => near(v.i('led'), 0.02, 0.002),
 *     '$R = (9 - 2)/0{,}02 = 350\\ \\Omega$', 'explicação…', { set: { r1: 350 } })
 */
import type { CircuitSpec, CircuitValue, Comp, CompType, Edit, GateType, LedColor, Pt } from '../lib/circuit/types';
import type { Interactive, VisualSpec } from './types';

type O = Partial<Omit<Comp, 'id' | 'type' | 'pts'>>;

const mk = (type: CompType, id: string, pts: Pt[], o: O = {}): Comp => ({ id, type, pts, ...o });

/** Flattens parts and lists of parts into the `comps` array of a spec. */
export const circuit = (...items: (Comp | Comp[])[]): Comp[] => items.flat();

/** Chain of wires through the given grid points. */
export const wires = (...pts: Pt[]): Comp[] => pts.slice(1).map((p, k) => mk('wire', `w${pts[k].join('_')}-${p.join('_')}`, [pts[k], p], { locked: true }));

export const R = (id: string, a: Pt, b: Pt, ohms: number, o?: O) => mk('resistor', id, [a, b], { value: ohms, ...o });
export const LAMP = (id: string, a: Pt, b: Pt, ohms: number, o?: O) => mk('lamp', id, [a, b], { value: ohms, ...o });
export const SW = (id: string, a: Pt, b: Pt, on = false, o?: O) => mk('switch', id, [a, b], { on, ...o });
/** DC source: `plus` is the positive terminal. */
export const V = (id: string, plus: Pt, minus: Pt, volts: number, o?: O) => mk('vsrc', id, [plus, minus], { value: volts, ...o });
/** Sine source: peak voltage and frequency in Hz. */
export const VAC = (id: string, plus: Pt, minus: Pt, vpeak: number, freq: number, o?: O) => mk('acsrc', id, [plus, minus], { value: vpeak, freq, ...o });
/** Current source: the current leaves through `out`. */
export const I = (id: string, out: Pt, back: Pt, amps: number, o?: O) => mk('isrc', id, [out, back], { value: amps, ...o });
/** Square wave between 0 V and `volts` (default 5 V). */
export const CLK = (id: string, plus: Pt, minus: Pt, freq: number, volts = 5, o?: O) => mk('clock', id, [plus, minus], { value: volts, freq, ...o });
export const C = (id: string, a: Pt, b: Pt, farads: number, o?: O) => mk('capacitor', id, [a, b], { value: farads, ...o });
export const L = (id: string, a: Pt, b: Pt, henries: number, o?: O) => mk('inductor', id, [a, b], { value: henries, ...o });
export const D = (id: string, anode: Pt, cathode: Pt, o?: O) => mk('diode', id, [anode, cathode], o);
export const LED = (id: string, anode: Pt, cathode: Pt, color: LedColor = 'red', o?: O) => mk('led', id, [anode, cathode], { color, ...o });
/** Zener: conducts from cathode to anode when the reverse voltage reaches `vz`. */
export const Z = (id: string, anode: Pt, cathode: Pt, vz: number, o?: O) => mk('zener', id, [anode, cathode], { value: vz, ...o });
export const GND = (at: Pt, id = `gnd${at.join('_')}`) => mk('ground', id, [at], { locked: true });
export const VM = (id: string, a: Pt, b: Pt, o?: O) => mk('voltmeter', id, [a, b], o);
export const AM = (id: string, a: Pt, b: Pt, o?: O) => mk('ammeter', id, [a, b], o);
/** Logic input (0 V / 5 V) and logic probe. */
export const IN = (id: string, at: Pt, on = false, o?: O) => mk('input', id, [at], { on, label: id, ...o });
export const OUT = (id: string, at: Pt, o?: O) => mk('output', id, [at], { label: id, ...o });

/**
 * Pin positions of the multi-terminal parts, all drawn facing right from the anchor point `at`.
 *  transistor: base/gate at `at`, collector/drain one cell right and one up, emitter/source one cell right and one down
 *  opamp: in− at `at`, in+ two cells below, out three cells right and one down
 *  gate: inputs on the column of `at` (n = 2: rows y and y+2; n = 3: y, y+1, y+2; n = 4: y … y+3), output three cells right at mid height (n = 1: same row)
 *  dff: D at `at`, CLK two cells below, Q three cells right, Q̄ three cells right and two down
 */
export const P = {
  bjt: ([x, y]: Pt) => ({ b: [x, y] as Pt, c: [x + 1, y - 1] as Pt, e: [x + 1, y + 1] as Pt }),
  mos: ([x, y]: Pt) => ({ g: [x, y] as Pt, d: [x + 1, y - 1] as Pt, s: [x + 1, y + 1] as Pt }),
  opamp: ([x, y]: Pt) => ({ neg: [x, y] as Pt, pos: [x, y + 2] as Pt, out: [x + 3, y + 1] as Pt }),
  gate: ([x, y]: Pt, n = 2) => {
    const ins: Pt[] = n === 1 ? [[x, y]] : n === 2 ? [[x, y], [x, y + 2]] : Array.from({ length: n }, (_, k) => [x, y + k] as Pt);
    const out: Pt = n === 1 ? [x + 3, y] : n === 4 ? [x + 3, y + 1] : [x + 3, y + 1];
    return { ins, out };
  },
  dff: ([x, y]: Pt) => ({ d: [x, y] as Pt, clk: [x, y + 2] as Pt, q: [x + 3, y] as Pt, qn: [x + 3, y + 2] as Pt }),
};

export const NPN = (id: string, at: Pt, o?: O) => mk('npn', id, Object.values(P.bjt(at)), o);
export const PNP = (id: string, at: Pt, o?: O) => mk('pnp', id, Object.values(P.bjt(at)), o);
export const NMOS = (id: string, at: Pt, o?: O) => mk('nmos', id, Object.values(P.mos(at)), o);
export const OPAMP = (id: string, at: Pt, o?: O) => mk('opamp', id, Object.values(P.opamp(at)), o);
export const GATE = (type: GateType, id: string, at: Pt, nIn = type === 'not' ? 1 : 2, o?: O) => {
  const g = P.gate(at, type === 'not' ? 1 : nIn);
  return mk(type, id, [...g.ins, g.out], o);
};
export const DFF = (id: string, at: Pt, o?: O) => mk('dff', id, Object.values(P.dff(at)), o);

/** Circuit shown inside a theory card or next to any exercise (`visual:`). */
export const circuitVisual = (spec: CircuitSpec): VisualSpec => ({ name: 'circuit', props: spec });

/**
 * Hands-on exercise in the simulator. `check` receives a CircuitValue once the user has changed something.
 * `solution` is one way of solving it: QA applies it and requires `check` to pass (and to fail before it).
 */
export const circuitEx = (prompt: string, spec: CircuitSpec, check: (v: CircuitValue) => boolean, answerText: string, explain: string, solution: Edit): Interactive => ({
  kind: 'interactive',
  prompt,
  widget: 'circuit',
  props: spec,
  check,
  answerText,
  explain,
  solution,
});

/**
 * Circuit simulator: shared contract between the engine (src/lib/circuit), the widget
 * (src/components/visuals/CircuitSim.tsx) and the content (src/content/circuits.ts).
 * Pure types: no React / React Native imports here or anywhere in src/lib/circuit.
 */

/** Grid point (integers): x grows to the right, y grows downwards. */
export type Pt = [number, number];

export type GateType = 'and' | 'or' | 'not' | 'nand' | 'nor' | 'xor' | 'xnor';

export type CompType =
  | 'wire'
  | 'resistor'
  | 'lamp'
  | 'switch'
  | 'vsrc'
  | 'acsrc'
  | 'isrc'
  | 'clock'
  | 'capacitor'
  | 'inductor'
  | 'diode'
  | 'led'
  | 'zener'
  | 'npn'
  | 'pnp'
  | 'nmos'
  | 'opamp'
  | 'ground'
  | 'input'
  | 'output'
  | GateType
  | 'dff'
  | 'voltmeter'
  | 'ammeter';

export type LedColor = 'red' | 'green' | 'yellow' | 'blue' | 'white';

/**
 * One component. `pts` are its terminals, in this order:
 *  - two-terminal parts: [a, b]
 *      vsrc / acsrc / clock: a = positive terminal (+), b = negative (−)
 *      isrc: the current leaves the source through a (and returns through b)
 *      diode / led / zener: a = anode, b = cathode
 *  - ground, input, output: [a]
 *  - npn / pnp: [base, collector, emitter]      nmos: [gate, drain, source]
 *  - opamp: [in−, in+, out]
 *  - gates: [in1, …, inN, out] ('not' has one input)
 *  - dff: [D, CLK, Q, Q̄]
 */
export type Comp = {
  id: string;
  type: CompType;
  pts: Pt[];
  /** Main value in SI units: Ω (resistor, lamp), V (vsrc; peak for acsrc; high level for clock; Vz for zener), A (isrc), F, H. */
  value?: number;
  /** acsrc / clock frequency in Hz. */
  freq?: number;
  /** acsrc phase in degrees and DC offset in volts. */
  phase?: number;
  offset?: number;
  /** switch closed / logic input high. */
  on?: boolean;
  /** Forward drop at 10 mA for diode / led / zener (defaults: diode and zener 0.7 V, led by colour). */
  vf?: number;
  color?: LedColor;
  /** led: current above which it burns (default 0.03 A). lamp: rated power in W for full brightness. */
  imax?: number;
  rated?: number;
  /** BJT current gain (default 100). */
  beta?: number;
  /** nmos threshold voltage (default 2 V) and transconductance parameter K in A/V² (default 0.5): Id = K (Vgs − Vth)² in saturation. */
  vth?: number;
  k?: number;
  /** opamp output saturation [min, max] in volts (default [-15, 15]). */
  rails?: [number, number];
  /** Initial condition for transients: capacitor voltage (V) or inductor current (A) at t = 0 (default 0). */
  ic?: number;

  /* ---- authoring / UI only (the engine ignores these) ---- */
  /** Text drawn next to the part, e.g. "R1". */
  label?: string;
  /** The user cannot delete or move it. */
  locked?: boolean;
  /** The user cannot change its value or state. */
  fixed?: boolean;
  /** The value is displayed as "?" (unknown part that has to be measured). */
  hidden?: boolean;
  /** Values offered when editing; otherwise the editor steps through the E12 series between min and max. */
  values?: number[];
  min?: number;
  max?: number;
  /** Live readouts drawn next to the part. */
  show?: ('v' | 'i' | 'p')[];
};

export type SolveError = 'empty' | 'singular' | 'noconv' | 'short';

/** Electrical state of one component. */
export type CompState = {
  /** Voltage V(a) − V(b). Three-terminal parts: Vce (npn/pnp), Vds (nmos); opamp, gates and dff: output voltage; one-terminal parts: node voltage. */
  v: number;
  /** Current from a to b through the part, in A. Sources: current delivered through the + terminal (positive when supplying). npn/pnp: Ic; nmos: Id; opamp/gates: output current. */
  i: number;
  /** Power in W: absorbed by passive parts and semiconductors (≥ 0), supplied by sources (positive when supplying). */
  p: number;
  /** Current entering the part through each terminal, same order as `pts`. */
  pins: number[];
  /** switch closed, led lit (i ≥ 1 mA and not burnt), lamp glowing, logic input/output/gate/dff output high. */
  on?: boolean;
  /** led driven above `imax`. */
  burnt?: boolean;
};

export type Solution = {
  ok: boolean;
  error?: SolveError;
  /** Simulated time in seconds (0 for a DC solution). */
  t: number;
  /** Voltage of every node; node 0 is the reference (0 V). */
  nodeV: number[];
  /** Node index of a grid point, or -1 when no terminal touches it. */
  nodeAt: (p: Pt) => number;
  comp: Record<string, CompState>;
};

export type WaveStats = { min: number; max: number; avg: number; rms: number; pp: number; last: number };

/** What `check` functions of circuit exercises receive. Everything is computed from the circuit as the user left it. */
export type CircuitValue = {
  comps: Comp[];
  /** DC operating point (capacitors open, inductors shorted, AC sources at their offset). */
  ok: boolean;
  error?: SolveError;
  /** Voltage across / current through / power of a component (see CompState). 0 when the id does not exist. */
  v: (id: string) => number;
  i: (id: string) => number;
  p: (id: string) => number;
  /** Current entering terminal k of a component, and the node voltage at that terminal. */
  pin: (id: string, k: number) => number;
  vpin: (id: string, k: number) => number;
  /** Node voltage at a grid point (NaN when nothing is connected there). */
  node: (p: Pt) => number;
  /** Component value, and its on / lit / high state. */
  val: (id: string) => number;
  on: (id: string) => boolean;
  burnt: (id: string) => boolean;
  has: (id: string) => boolean;
  /** How many components of a type exist (wires included when type is 'wire'). */
  count: (type: CompType) => number;
  /** True when the two grid points belong to the same node. */
  joined: (a: Pt, b: Pt) => boolean;
  /** Equivalent resistance seen between two grid points with every independent source switched off (vsrc → wire, isrc → open). Infinity when open. */
  req: (a: Pt, b: Pt) => number;
  /** Transient from t = 0 to `t` seconds; statistics of the voltage (or current) of one component over [from, t] (default from = t / 2). Default t: 4 periods of the first acsrc/clock, else 5 time constants estimate, else 1 s. */
  wave: (id: string, opts?: { t?: number; from?: number; of?: 'v' | 'i' }) => WaveStats;
  /** Value of the voltage (or current) of a component at time t of a transient started at t = 0. */
  at: (id: string, t: number, of?: 'v' | 'i') => number;
  /** Truth table of a logic circuit: sets the `input` components to every combination (first id = most significant bit, rows in counting order) and reads the `output` component (0 or 1). */
  truth: (inputs: string[], output: string) => number[];
};

/** Change applied to a circuit: used by QA to prove that an exercise can be solved. */
export type Edit = {
  /** id → new value */
  set?: Record<string, number>;
  /** id → switch / input state */
  on?: Record<string, boolean>;
  add?: Comp[];
  remove?: string[];
};

export type PaletteItem = {
  type: CompType;
  /** Value of new parts of this tool (defaults per type). */
  value?: number;
  /** Maximum number of parts of this tool the user may place. */
  max?: number;
  /** New parts cannot have their value changed. */
  fixed?: boolean;
  color?: LedColor;
  label?: string;
};

/** Props of the `circuit` widget (theory cards, exercise visuals and interactive exercises). */
export type CircuitSpec = {
  comps: Comp[];
  /** Grid size in cells. Default: bounding box of the parts plus one cell of margin. */
  cols?: number;
  rows?: number;
  /**
   * view: watch, tap a part to measure it, flip switches and logic inputs.
   * adjust (default): also change values of parts that are not `fixed`.
   * build: also add parts from the palette, draw wires and delete parts that are not `locked`.
   */
  mode?: 'view' | 'adjust' | 'build';
  palette?: (PaletteItem | CompType)[];
  /** Oscilloscope panel under the circuit. */
  scope?: { ids: string[]; of?: 'v' | 'i'; window?: number };
  /** Simulated seconds per real second for circuits with capacitors, inductors, AC sources or clocks (default: chosen so one period / time constant takes about 2 s). */
  timeScale?: number;
  caption?: string;
};

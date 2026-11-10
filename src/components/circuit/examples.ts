import type { CircuitSpec, CompType } from '../../lib/circuit';
import { AM, C, CLK, D, DFF, GATE, GND, I, IN, L, LAMP, LED, NMOS, NPN, OPAMP, OUT, P, PNP, R, SW, V, VAC, VM, Z, circuit, wires } from '../../content/circuits';

export type Example = { id: string; title: string; spec: CircuitSpec };
const spec = (comps: CircuitSpec['comps'], rest: Partial<CircuitSpec> = {}): CircuitSpec => ({ cols: 9, rows: 12, comps, ...rest });
export const examples: Example[] = [
  { id: 'divider', title: 'Divisor de tensão', spec: spec(circuit(V('V1', [1, 2], [1, 9], 12), R('R1', [1, 2], [7, 2], 1000, { show: ['v'] }), R('R2', [7, 2], [7, 9], 2000, { show: ['v', 'i'] }), wires([7, 9], [1, 9]), GND([1, 9]))) },
  { id: 'led', title: 'LED com resistor', spec: spec(circuit(V('V1', [1, 2], [1, 9], 9), R('R1', [1, 2], [7, 2], 360), LED('LED', [7, 2], [7, 9], 'red', { show: ['i'] }), wires([7, 9], [1, 9]), GND([1, 9]))) },
  { id: 'rc', title: 'Carga de um capacitor · RC', spec: spec(circuit(V('V1', [1, 2], [1, 9], 5), R('R1', [1, 2], [7, 2], 10000), C('C1', [7, 2], [7, 9], 100e-6), wires([7, 9], [1, 9]), GND([1, 9])), { scope: { ids: ['C1'], window: 5 }, timeScale: 0.5 }) },
  { id: 'half', title: 'Retificador de meia onda', spec: spec(circuit(VAC('AC', [1, 2], [1, 9], 10, 60), D('D1', [1, 2], [7, 2]), R('Carga', [7, 2], [7, 9], 1000), wires([7, 9], [1, 9]), GND([1, 9])), { scope: { ids: ['AC', 'Carga'] } }) },
  { id: 'bridge', title: 'Ponte retificadora', spec: spec(circuit(VAC('AC', [2, 4], [6, 4], 10, 60), D('D1', [2, 4], [4, 2]), D('D2', [6, 4], [4, 2]), D('D3', [4, 6], [2, 4]), D('D4', [4, 6], [6, 4]), wires([4, 2], [8, 2]), R('Carga', [8, 2], [8, 8], 1000), wires([8, 8], [4, 8], [4, 6]), GND([4, 6])), { scope: { ids: ['AC', 'Carga'] } }) },
  { id: 'transistor', title: 'Transistor NPN como chave', spec: spec(circuit(V('Vcc', [1, 1], [1, 10], 5), wires([1, 1], [6, 1]), LAMP('Luz', [6, 1], [6, 4], 100), NPN('Q1', [5, 5]), R('Rb', [2, 5], [5, 5], 10000), IN('Base', [2, 5]), wires([6, 6], [6, 10], [1, 10]), GND([1, 10]))) },
  { id: 'opamp', title: 'Amp-op inversor · ganho −10', spec: spec(circuit(OPAMP('U1', [3, 4]), V('Vin', [1, 4], [1, 10], 0.5, { min: -1, max: 1 }), R('Rin', [1, 4], [3, 4], 10000), wires([3, 4], [3, 2]), R('Rf', [3, 2], [6, 2], 100000), wires([6, 2], [6, 5]), wires([3, 6], [3, 10], [1, 10]), VM('Vout', [6, 5], [6, 10], { show: ['v'] }), wires([6, 10], [3, 10]), GND([1, 10]))) },
  { id: 'logic', title: 'Portas lógicas · AND', spec: spec(circuit(GATE('and', 'AND', [3, 4]), IN('A', [1, 4]), IN('B', [1, 6]), wires([1, 4], [3, 4]), wires([1, 6], [3, 6]), OUT('S', [7, 5]), wires([6, 5], [7, 5]))) },
  { id: 'latch', title: 'Latch SR · pulsos alternados', spec: spec(circuit(GATE('nor', 'Q', [2, 2]), GATE('nor', 'Qb', [5, 7]), VAC('Reset', [2, 2], [1, 11], 5, 1, { offset: -2, phase: 180 }), VAC('Set', [5, 7], [1, 11], 5, 1, { offset: -2 }), wires([5, 3], [7, 3], [7, 5], [4, 5], [4, 9], [5, 9]), wires([8, 8], [8, 10], [1, 10], [1, 4], [2, 4]), GND([1, 11])), { scope: { ids: ['Q', 'Qb'] }, caption: 'Pulsos automáticos Set e Reset. Os fios só conectam pelas pontas.' }) },
];

const gateExamples: Example[] = (['and', 'or', 'not', 'nand', 'nor', 'xor', 'xnor'] as const).map(type => {
  const p = P.gate([3, 4], type === 'not' ? 1 : 2);
  return { id: `gate-${type}`, title: `Porta ${type.toUpperCase()} · toque nas entradas`, spec: spec(circuit(GATE(type, 'U1', [3, 4]), ...p.ins.map((at, k) => IN(k ? 'B' : 'A', [1, at[1]], k === 0)), ...p.ins.flatMap(at => wires([1, at[1]], at)), wires(p.out, [7, p.out[1]]), OUT('S', [7, p.out[1]])), { mode: 'view', rows: 8 }) };
});
export const demoExamples: Example[] = [
  { id: 'build', title: 'Montagem livre · arraste na grade', spec: spec([], { mode: 'build', rows: 7, palette: ['wire', { type: 'vsrc', max: 1, fixed: true }, { type: 'resistor', max: 2 }, 'led', 'ground'] }) },
  ...examples.map(e => ({ ...e, spec: { ...e.spec, mode: 'adjust' as const } })),
  { id: 'passive', title: 'Chave, lâmpada e amperímetro · observar', spec: spec(circuit(V('V1', [1, 2], [1, 9], 6), SW('Chave', [1, 2], [4, 2], true), AM('A1', [4, 2], [7, 2], { show: ['i'] }), LAMP('L1', [7, 2], [7, 9], 60), wires([7, 9], [1, 9]), GND([1, 9])), { mode: 'view' }) },
  { id: 'isrc', title: 'Fonte de corrente e voltímetro', spec: spec(circuit(I('I1', [1, 2], [1, 9], 0.01), wires([1, 2], [4, 2], [7, 2]), R('R1', [4, 2], [4, 9], 1000), VM('V1', [7, 2], [7, 9], { show: ['v'] }), wires([7, 9], [4, 9], [1, 9]), GND([1, 9]))) },
  { id: 'rl', title: 'Indutor · resposta RL', spec: spec(circuit(V('V1', [1, 2], [1, 9], 5), R('R1', [1, 2], [7, 2], 100), L('L1', [7, 2], [7, 9], 1), wires([7, 9], [1, 9]), GND([1, 9])), { scope: { ids: ['L1'], of: 'i' } }) },
  { id: 'zener', title: 'Zener · regulador 5,1 V', spec: spec(circuit(V('V1', [1, 2], [1, 9], 12), R('R1', [1, 2], [7, 2], 470), Z('Z1', [7, 9], [7, 2], 5.1, { show: ['v'] }), wires([7, 9], [1, 9]), GND([1, 9]))) },
  { id: 'pnp', title: 'Transistor PNP', spec: spec(circuit(PNP('Q1', [5, 5]), V('Vcc', [6, 6], [1, 10], 5), R('Carga', [6, 4], [6, 1], 1000), wires([6, 1], [8, 1], [8, 10], [1, 10]), R('Rb', [2, 5], [5, 5], 10000), IN('Base', [2, 5]), GND([1, 10]))) },
  { id: 'nmos', title: 'NMOS · chave por tensão', spec: spec(circuit(NMOS('M1', [5, 5]), IN('Gate', [2, 5], true), wires([2, 5], [5, 5]), V('V1', [1, 1], [1, 10], 5), wires([1, 1], [6, 1]), LAMP('L1', [6, 1], [6, 4], 100), wires([6, 6], [6, 10], [1, 10]), GND([1, 10]))) },
  { id: 'dff', title: 'Flip-flop D e clock · divisor por 2', spec: spec(circuit(DFF('FF', [3, 3]), CLK('CLK', [3, 5], [1, 10], 1), wires([6, 5], [7, 5], [7, 1], [2, 1], [2, 3], [3, 3]), OUT('Q', [6, 3]), GND([1, 10])), { scope: { ids: ['CLK', 'FF'], window: 4 }, timeScale: 0.5 }) },
  ...gateExamples,
  { id: 'colors', title: 'LEDs · cinco cores', spec: spec(circuit(V('V1', [1, 11], [8, 11], 5), ...(['red', 'green', 'yellow', 'blue', 'white'] as const).flatMap((color, k) => { const y = 1 + k * 2; return circuit(wires([1, y], [1, y + 2]), R(`R${k + 1}`, [1, y], [5, y], 330), LED(color, [5, y], [8, y], color), wires([8, y], [8, y + 2])); }), GND([8, 11]))) },
  { id: 'unknown', title: 'Resistor desconhecido · valor oculto e fixo', spec: spec(circuit(V('V1', [1, 2], [1, 9], 5, { fixed: true }), R('Rx', [1, 2], [7, 2], 470, { hidden: true, fixed: true, locked: true, show: ['v', 'i'] }), wires([7, 2], [7, 9], [1, 9]), GND([1, 9])), { mode: 'build', palette: [{ type: 'resistor', max: 1 }, 'wire'] }) },
  { id: 'short', title: 'Aviso · curto-circuito', spec: spec(circuit(V('V1', [1, 3], [1, 8], 5), wires([1, 3], [7, 3], [7, 8], [1, 8])), { mode: 'view' }) },
  { id: 'burnt', title: 'Aviso · LED queimado', spec: spec(circuit(V('V1', [1, 2], [1, 9], 9), LED('LED', [1, 2], [7, 2]), wires([7, 2], [7, 9], [1, 9])), { mode: 'view' }) },
  { id: 'open', title: 'Aviso · circuito incompleto', spec: spec(circuit(V('V1', [1, 2], [1, 9], 5), SW('S1', [1, 2], [7, 2]), R('R1', [7, 2], [7, 9], 1000), wires([7, 9], [1, 9])), { mode: 'view' }) },
];

// Compile-time exhaustiveness: demo coverage is also asserted by test-circuit-ui.cjs.
export const demoTypes: CompType[] = [...new Set(demoExamples.flatMap(e => e.spec.comps.map(c => c.type)))];

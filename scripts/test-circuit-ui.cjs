#!/usr/bin/env node
/** Headless checks for UI geometry, value editing and every shipped example. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const resolve = Module._resolveFilename;
Module._resolveFilename = function (request, parent, ...rest) {
  try { return resolve.call(this, request, parent, ...rest); } catch (error) {
    if (request.startsWith('.') && parent) {
      const base = path.resolve(path.dirname(parent.filename), request);
      for (const suffix of ['.ts', '.tsx', '/index.ts']) if (fs.existsSync(base + suffix)) return base + suffix;
    }
    throw error;
  }
};
const load = Module._load;
Module._load = function (request, ...args) {
  if (/^react-native(?:-svg)?$/.test(request)) return {};
  return load.call(this, request, ...args);
};
for (const ext of ['.ts', '.tsx']) Module._extensions[ext] = (module, filename) => {
  module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    fileName: filename,
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.React, esModuleInterop: true },
  }).outputText, filename);
};
const { engineering, partValue, nextId, measurable, limits, offeredValues, stepValue, sliderValue, sliderMap, frequencyValue, frequencyMap, stepFrequency, gridFor, nearest, pixel, terminals, hitPart, allTypes } = require('../src/components/circuit/model');
const { labelsFor, symbolBox } = require('../src/components/circuit/Labels');
const { timing } = require('../src/components/circuit/useSimulation');
const { examples, demoExamples, demoTypes } = require('../src/components/circuit/examples');
const { solveDC, Sim } = require('../src/lib/circuit');
const { P, VAC, wires } = require('../src/content/circuits');
let checks = 0;
const test = (name, run) => { run(); checks++; console.log(`ok ${name}`); };
const near = (a, b, tol = 1e-9) => assert.ok(Math.abs(a - b) < tol, `${a} ≉ ${b}`);

test('Portuguese SI units, zero, signs and rounding boundaries', () => {
  for (const [v, u, result] of [[4700, 'Ω', '4,7 kΩ'], [100e-6, 'F', '100 µF'], [-0.0125, 'A', '-12,5 mA'], [0, 'V', '0 V'], [1e6, 'Ω', '1 MΩ'], [999999, 'Ω', '1 MΩ'], [9, 'V', '9 V']]) assert.equal(engineering(v, u), result);
  assert.equal(engineering(NaN, 'V'), '— V');
});
test('E24 stepping in both directions and boundary clamps', () => {
  const c = { id: 'r', type: 'resistor', pts: [[0, 0], [1, 0]], value: 4700, min: 1000, max: 10000 };
  assert.equal(stepValue(c, 1), 5100); assert.equal(stepValue(c, -1), 4300);
  assert.equal(stepValue({ ...c, value: 10000 }, 1), 10000);
  assert.equal(stepValue({ ...c, value: 1000 }, -1), 1000);
  assert.equal(stepValue({ ...c, value: 4500 }, 1), 4700);
  assert.deepEqual(offeredValues({ ...c, values: [4700, 1000, 4700, 10000, 20000] }), [1000, 4700, 10000]);
});
test('Automatic IDs by type, shared prefixes, collisions and alphabet rollover', () => {
  const expected = { resistor: 'R1', lamp: 'LP1', inductor: 'L1', capacitor: 'C1', diode: 'D1', led: 'LED1', zener: 'Z1', vsrc: 'V1', acsrc: 'V1', clock: 'V1', isrc: 'I1', switch: 'CH1', npn: 'Q1', pnp: 'Q1', nmos: 'M1', opamp: 'U1', dff: 'U1', voltmeter: 'VM1', ammeter: 'AM1', input: 'A', output: 'S1', wire: 'W1', ground: 'GND1' };
  for (const type of allTypes) assert.equal(nextId(type, []), expected[type] ?? 'U1', type);
  const comps = [];
  for (const type of ['resistor', 'resistor', 'lamp', 'inductor', 'vsrc', 'acsrc', 'clock', 'npn', 'pnp', 'and', 'dff', 'opamp']) comps.push({ type, id: nextId(type, comps) });
  assert.deepEqual(comps.map(c => c.id), ['R1', 'R2', 'LP1', 'L1', 'V1', 'V2', 'V3', 'Q1', 'Q2', 'U1', 'U2', 'U3']);
  assert.equal(nextId('resistor', [{ id: 'R1', type: 'capacitor' }, { id: 'R2' }]), 'R3');
  const inputs = [];
  for (let k = 0; k < 28; k++) inputs.push({ id: nextId('input', inputs) });
  assert.equal(inputs[25].id, 'Z'); assert.equal(inputs[26].id, 'AA'); assert.equal(inputs[27].id, 'AB');
});
test('Default ranges never expand with the value; explicit limits and values take priority', () => {
  for (const [type, range] of Object.entries({ resistor: [1, 1e6], lamp: [1, 1e6], capacitor: [1e-9, .01], inductor: [1e-6, 10], vsrc: [0, 24], isrc: [.001, 2], acsrc: [1, 50], clock: [1, 50] })) {
    assert.deepEqual(limits({ type }), range, type);
    assert.deepEqual(limits({ type, value: 1e20 }), range, type);
    assert.deepEqual(limits({ type, min: 2, max: 3 }), [2, 3]);
  }
  assert.deepEqual(limits({ type: 'resistor', values: [100, 300, 200] }), [100, 300]);
  assert.deepEqual(limits({ type: 'resistor', values: [] }), [1, 1e6]);
});
test('Slider rounds to two significant digits, clamps after rounding and snaps to nearest allowed value', () => {
  for (const [type, input, expected] of [['resistor', 50.82, 51], ['capacitor', 1.234e-9, 1.2e-9], ['inductor', .00005678, .000057], ['isrc', .01234, .012], ['acsrc', 12.34, 12], ['clock', 49.99, 50]]) near(sliderValue({ type }, input), expected);
  const bounded = { type: 'resistor', min: 1.23, max: 9.87 };
  near(sliderValue(bounded, -100), 1.23); near(sliderValue(bounded, 100), 9.87);
  const choices = { type: 'resistor', min: 100, max: 1000, values: [1, 100, 470, 1000, 1e4] };
  assert.equal(sliderValue(choices, 600), 470); assert.equal(sliderValue(choices, -10), 100); assert.equal(sliderValue(choices, 9999), 1000);
  for (const c of [{ type: 'resistor' }, { type: 'capacitor' }, { type: 'inductor' }, { type: 'isrc' }]) {
    const m = sliderMap(c), [min, max] = limits(c);
    near(m.value(0), min); near(m.value(1), max);
    for (const t of [0, .25, .5, .75, 1]) near(m.position(m.value(t)), t, .005);
    assert.equal(m.value(-1), min); assert.equal(m.value(2), max);
  }
  const dc = sliderMap({ type: 'vsrc' });
  assert.equal(dc.value(0), 0); assert.equal(dc.value(.5), 12); assert.equal(dc.value(1), 24);
  for (let k = 0; k <= 100; k++) assert.equal((dc.value(k / 100) * 2) % 1, 0);
  near(sliderMap({ type: 'vsrc', min: -10, max: 10 }).value(.25), -5);
  near(sliderMap({ type: 'vsrc', min: .1, max: .9 }).value(1), .9);
  const single = sliderMap({ type: 'resistor', values: [470] });
  assert.equal(single.value(.7), 470); assert.equal(single.position(470), 0);
});
test('Frequency log slider, two significant digits and 1-2-5 buttons', () => {
  assert.equal(frequencyValue({ type: 'clock' }), 1); assert.equal(frequencyValue({ type: 'acsrc' }), 60);
  const m = frequencyMap();
  for (const [t, expected] of [[0, 1], [.2, 10], [.4, 100], [.6, 1000], [.8, 10000], [1, 100000]]) near(m.value(t), expected);
  near(m.value(.345), 53); assert.equal(m.value(-2), 1); assert.equal(m.value(2), 1e5);
  for (const [freq, minus, plus] of [[1, 1, 2], [2, 1, 5], [5, 2, 10], [60, 50, 100], [100000, 50000, 100000]]) {
    assert.equal(stepFrequency({ freq }, -1), minus); assert.equal(stepFrequency({ freq }, 1), plus);
  }
});
test('Wire and ground have neither labels nor measurement buttons; logic labels use bits', () => {
  assert.equal(measurable({ type: 'wire', label: 'Wire' }), false);
  assert.equal(measurable({ type: 'ground', label: 'Ground' }), false);
  assert.equal(measurable({ type: 'resistor' }), true);
  assert.equal(partValue({ type: 'input', on: false }), '0'); assert.equal(partValue({ type: 'input', on: true }), '1');
  assert.equal(partValue({ type: 'switch', on: false }), 'Desligado');
  const comps = [{ id: 'w', label: 'Wire', type: 'wire', pts: [[1, 1], [2, 1]], show: ['v'] }, { id: 'g', type: 'ground', pts: [[2, 1]] }];
  assert.deepEqual(labelsFor(comps, solveDC(comps), gridFor({ comps }, 375)), { labels: [], overflow: [] });
});
test('Grid pixel conversion, negative coordinates, rounding and clamps', () => {
  const g = gridFor({ comps: [{ pts: [[-2, -1], [4, 5]] }] }, 360);
  assert.deepEqual(nearest(pixel([-2, -1], g), g), [-2, -1]);
  assert.deepEqual(nearest([-1000, 10000], g), [g.x, g.y + g.rows]);
  assert.deepEqual(nearest([g.cell * 2.49, g.cell * 3.51], g), [g.x + 2, g.y + 4]);
});
test('Multi-terminal placement follows P exactly', () => {
  const at = [2, 4];
  for (const [type, pins] of [['npn', P.bjt(at)], ['pnp', P.bjt(at)], ['nmos', P.mos(at)], ['opamp', P.opamp(at)], ['dff', P.dff(at)]]) assert.deepEqual(terminals(type, at, [0, 0]), Object.values(pins));
  for (const type of ['and', 'or', 'not', 'nand', 'nor', 'xor', 'xnor']) { const p = P.gate(at, type === 'not' ? 1 : 2); assert.deepEqual(terminals(type, at, [0, 0]), [...p.ins, p.out]); }
});
test('40 px selection and diagonal wire proximity', () => {
  const g = gridFor({ cols: 9, rows: 12, comps: [] }, 360);
  const r = { id: 'r', type: 'resistor', pts: [[1, 1], [5, 1]] }, w = { id: 'w', type: 'wire', pts: [[1, 2], [5, 6]] };
  assert.equal(hitPart([r], [120, 59], g)?.id, 'r');
  assert.equal(hitPart([r], [120, 61], g), undefined);
  assert.equal(hitPart([w], [120, 160], g)?.id, 'w');
});
test('All 30 symbols and all three modes are represented', () => {
  assert.deepEqual([...demoTypes].sort(), [...allTypes].sort());
  assert.deepEqual([...new Set(demoExamples.map(e => e.spec.mode ?? 'adjust'))].sort(), ['adjust', 'build', 'view']);
});
test('Examples have unique IDs and their terminals fit the 9×12 grid', () => {
  for (const e of demoExamples) {
    assert.equal(new Set(e.spec.comps.map(c => c.id)).size, e.spec.comps.length, e.id);
    for (const c of e.spec.comps) for (const [x, y] of c.pts) assert.ok(x >= 0 && x <= e.spec.cols && y >= 0 && y <= e.spec.rows, `${e.id}: ${c.id} outside grid`);
  }
});
test('All normal examples solve; warning fixtures reproduce their warnings', () => {
  for (const e of demoExamples) {
    const s = solveDC(e.spec.comps);
    if (['short', 'burnt'].includes(e.id)) assert.equal(s.error, 'short', e.id);
    else if (e.id === 'build') assert.equal(s.error, 'empty');
    else assert.ok(s.ok, `${e.id}: ${s.error}`);
    if (e.id === 'burnt') assert.ok(s.comp.LED.burnt);
    if (e.id === 'open') assert.ok(Math.abs(s.comp.R1.i) < 1e-8);
  }
});
test('Live examples advance without solver errors at UI time steps', () => {
  for (const e of examples.filter(e => timing(e.spec.comps).dynamic)) {
    const config = timing(e.spec.comps, e.spec.timeScale), sim = new Sim(e.spec.comps);
    for (let k = 0; k < 480; k++) assert.ok(sim.step(config.step).ok, `${e.id} failed at ${sim.t}`);
    assert.ok(sim.t > 0);
  }
});
test('Extended floating bridge source converges for 480 steps with rectified load voltage', () => {
  const bridge = examples.find(e => e.id === 'bridge').spec.comps;
  const extended = [
    VAC('AC', [1, 10], [7, 10], 10, 60),
    ...wires([1, 10], [1, 4], [2, 4]), ...wires([7, 10], [7, 4], [6, 4]),
    ...bridge.filter(c => c.id !== 'AC'),
  ];
  const sim = new Sim(extended);
  let peak = 0;
  for (let k = 0; k < 480; k++) {
    const s = sim.step(1 / 7200); assert.ok(s.ok, `step ${k}: ${s.error}`);
    assert.ok(s.comp.Carga.v >= -1e-8 && s.comp.Carga.v <= 10 - 2 * .7 + .01, `load ${s.comp.Carga.v}`);
    peak = Math.max(peak, s.comp.Carga.v);
  }
  assert.ok(peak > 8.5, `rectification peak ${peak}`);
});
test('Mobile NPN labels keep Vcc and logic bits apart; cramped labels fall back to the name', () => {
  const example = examples.find(e => e.id === 'transistor'), grid = gridFor(example.spec, 373);
  for (const on of [false, true]) {
    const comps = example.spec.comps.map(c => c.id === 'Base' ? { ...c, on } : c);
    const { labels, overflow } = labelsFor(comps, solveDC(comps), grid);
    const vcc = labels.find(l => l.id === 'Vcc'), base = labels.find(l => l.id === 'Base');
    assert.equal(vcc?.text, 'Vcc · 5 V'); assert.equal(base?.text, `Base · ${on ? 1 : 0}`);
    assert.ok(vcc.x + vcc.w < base.x || base.x + base.w < vcc.x || vcc.y + vcc.h < base.y || base.y + base.h < vcc.y);
    assert.equal(overflow.length, 0);
  }
  const comps = [{ id: 'long-id', label: 'R1', type: 'resistor', pts: [[0, 1], [2, 1]], value: 1000, show: ['v', 'i', 'p'] }];
  const { labels, overflow } = labelsFor(comps, solveDC(comps), gridFor({ comps, cols: 3, rows: 5 }, 60));
  assert.equal(labels[0]?.text, 'R1'); assert.equal(overflow.length, 0);
});
test('Label boxes stay inside mobile canvas and never cover one another', () => {
  for (const width of [320, 360, 373, 375, 412]) for (const e of demoExamples) {
    const grid = gridFor(e.spec, width), s = solveDC(e.spec.comps), { labels, overflow } = labelsFor(e.spec.comps, s, grid);
    for (let i = 0; i < labels.length; i++) {
      const a = labels[i]; assert.ok(a.x >= 0 && a.x + a.w <= width && a.y >= 0 && a.y + a.h <= grid.rows * grid.cell, `${e.id}: label outside canvas`);
      for (const c of e.spec.comps.filter(c => c.type !== 'wire')) {
        const b = symbolBox(c, grid);
        assert.ok(!(a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y), `${e.id}: label covers ${c.id}`);
      }
      for (const b of labels.slice(i + 1)) assert.ok(!(a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y), `${e.id}: labels overlap`);
    }
    assert.equal(labels.length + overflow.length, e.spec.comps.filter(measurable).length);
  }
});
console.log(`\n${checks} UI groups; all ok (${demoExamples.length} examples, ${demoTypes.length} component types)`);

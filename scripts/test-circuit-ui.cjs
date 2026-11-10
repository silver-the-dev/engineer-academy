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
const { engineering, offeredValues, stepValue, sliderMap, gridFor, nearest, pixel, terminals, hitPart, allTypes } = require('../src/components/circuit/model');
const { labelsFor } = require('../src/components/circuit/Labels');
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
test('E12 stepping in both directions and boundary clamps', () => {
  const c = { id: 'r', type: 'resistor', pts: [[0, 0], [1, 0]], value: 4700, min: 1000, max: 10000 };
  assert.equal(stepValue(c, 1), 5600); assert.equal(stepValue(c, -1), 3900);
  assert.equal(stepValue({ ...c, value: 10000 }, 1), 10000);
  assert.equal(stepValue({ ...c, value: 1000 }, -1), 1000);
  assert.equal(stepValue({ ...c, value: 4500 }, 1), 4700);
  assert.deepEqual(offeredValues({ ...c, values: [4700, 1000, 4700, 10000, 20000] }), [1000, 4700, 10000]);
});
test('Log slider round trips, negative voltage, zero and explicit values', () => {
  for (const c of [{ type: 'resistor', min: 1, max: 1e6 }, { type: 'vsrc', min: -10, max: 10 }, { type: 'vsrc', min: 0, max: 5 }]) {
    const m = sliderMap(c);
    for (const t of [0, 0.25, 0.5, 0.75, 1]) near(m.position(m.value(t)), t, 1e-5);
  }
  const m = sliderMap({ type: 'resistor', values: [100, 1000, 10000] });
  assert.equal(m.value(0.49), 1000);
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
test('Known engine limitation reproduced: extended floating bridge source → noconv', () => {
  // Electrically equivalent to the working bridge example. Adding four 10 µΩ
  // wire segments to its AC leads makes the first transient step fail Newton.
  // Kept here as a reproducible report; the engine is outside this unit's scope.
  const bridge = examples.find(e => e.id === 'bridge').spec.comps;
  const extended = [
    VAC('AC', [1, 10], [7, 10], 10, 60),
    ...wires([1, 10], [1, 4], [2, 4]), ...wires([7, 10], [7, 4], [6, 4]),
    ...bridge.filter(c => c.id !== 'AC'),
  ];
  assert.equal(new Sim(extended).step(1 / 7200).error, 'noconv');
});
test('Label boxes stay inside mobile canvas and never cover one another', () => {
  for (const width of [320, 360, 412]) for (const e of demoExamples) {
    const grid = gridFor(e.spec, width), s = solveDC(e.spec.comps), { labels, overflow } = labelsFor(e.spec.comps, s, grid);
    for (let i = 0; i < labels.length; i++) {
      const a = labels[i]; assert.ok(a.x >= 0 && a.x + a.w <= width && a.y >= 0 && a.y + a.h <= grid.rows * grid.cell, `${e.id}: label outside canvas`);
      for (const b of labels.slice(i + 1)) assert.ok(!(a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y), `${e.id}: labels overlap`);
    }
    assert.equal(labels.length + overflow.length, e.spec.comps.filter(c => c.type !== 'wire' || c.label || c.show?.length).length);
  }
});
console.log(`\n${checks} UI groups; all ok (${demoExamples.length} examples, ${demoTypes.length} component types)`);

const assert = require('node:assert/strict');
const { buildCatalog, fingerprintExercise } = require('./generate-review-catalog.cjs');

const number = { kind: 'numeric', prompt: 'Some 1 + 1', answer: 2, explain: 'Duas unidades.' };
const quiz = { kind: 'mcq', prompt: 'Qual é par?', options: ['3', '4', '5'], answer: 1 };
const section = exercises => [{ units: [{ lessons: [{ id: 'lição', exercises }] }] }];

const initial = buildCatalog(section([number, quiz]));
const [first, second] = initial.lição;
assert.match(first, /^[0-9a-f]{24}$/);
assert.deepEqual(initial, buildCatalog(section([number, quiz])));
assert.deepEqual(buildCatalog(section([quiz, number])).lição, [second, first]);
const added = buildCatalog(section([number, { ...number, prompt: 'Some 2 + 2', answer: 4 }, quiz]));
assert.deepEqual([added.lição[0], added.lição[2]], [first, second]);
assert(!initial.lição.includes(added.lição[1]));
assert.equal(first, fingerprintExercise({ answer: 2, explain: 'Duas unidades.', prompt: 'Some 1 + 1', kind: 'numeric' }));

for (const changes of [
  { prompt: 'Some 1 + 2' },
  { answer: 3 },
  { explain: 'Uma nova explicação.' },
  { tol: 0.01 },
  { visual: { name: 'table', props: { head: ['Dado'], rows: [[1]] } } },
  { reviewRevision: 1 },
]) assert.notEqual(first, fingerprintExercise({ ...number, ...changes }));
assert.notEqual(second, fingerprintExercise({ ...quiz, answer: 0 }));

const generated = n => ({ gen: rng => ({ ...number, answer: Math.floor(rng() * 4) + n }) });
assert.equal(fingerprintExercise(generated(2)), fingerprintExercise(generated(2)));
assert.notEqual(fingerprintExercise(generated(2)), fingerprintExercise(generated(3)));
assert.notEqual(fingerprintExercise(generated(2)), fingerprintExercise({ gen: rng => ({ ...number, answer: 2 + Math.floor(rng() * 4) }) }));

// A closed-over value is not present in either function's source. Exercise
// snapshots still distinguish a change in how the plot grades or describes it.
const plot = (target, label) => ({
  kind: 'interactive', widget: 'plot', prompt: 'Ajuste x',
  check: ({ p }) => p.x === target,
  props: { params: [{ key: 'x', min: 0, max: 2, value: 1 }], info: () => label },
});
assert.notEqual(fingerprintExercise(plot(0, 'x')), fingerprintExercise(plot(2, 'x')));
assert.notEqual(fingerprintExercise(plot(0, 'x')), fingerprintExercise(plot(0, 't')));

// A circuit check that closes over its target has the same source for either target: the
// simulator readings and the check result are what tell the two exercises apart.
const circuit = (ohms, target) => ({
  kind: 'interactive', widget: 'circuit', prompt: 'Ajuste a corrente',
  check: v => Math.abs(Math.abs(v.i('r')) - target) < 1e-4,
  props: { comps: [
    { id: 'v', type: 'vsrc', pts: [[0, 2], [0, 0]], value: 6 },
    { id: 'r', type: 'resistor', pts: [[0, 0], [2, 0]], value: ohms },
    { id: 'w', type: 'wire', pts: [[2, 0], [2, 2]] }, { id: 'g', type: 'wire', pts: [[2, 2], [0, 2]] },
  ] },
  solution: { set: { r: 120 } },
});
assert.equal(fingerprintExercise(circuit(300, 0.05)), fingerprintExercise(circuit(300, 0.05)));
assert.notEqual(fingerprintExercise(circuit(300, 0.05)), fingerprintExercise(circuit(300, 0.02)));
assert.notEqual(fingerprintExercise(circuit(300, 0.05)), fingerprintExercise(circuit(200, 0.05)));

const line = target => ({ kind: 'interactive', widget: 'numberline', prompt: 'Marque', check: v => v === target, props: { min: 0, max: 4, step: 1 } });
assert.notEqual(fingerprintExercise(line(2)), fingerprintExercise(line(3)));
const venn = target => ({ kind: 'interactive', widget: 'venn', prompt: 'Pinte', check: v => v.join() === target, props: {} });
assert.notEqual(fingerprintExercise(venn('A')), fingerprintExercise(venn('B')));
const program = expected => ({
  kind: 'interactive', widget: 'c-lab', prompt: 'Imprima', check: v => !!v && v.passed,
  props: { starter: 'int main(void) { return 0; }', cases: [{ output: expected }] },
  solution: '#include <stdio.h>\nint main(void) { printf("%d\\n", 3); }',
});
assert.notEqual(fingerprintExercise(program('3')), fingerprintExercise(program('4')));
assert.notEqual(fingerprintExercise({ ...number, visual: { name: 'table', props: { rows: new Set([1]) } } }),
  fingerprintExercise({ ...number, visual: { name: 'table', props: { rows: new Set([2]) } } }));

console.log('Catálogo de revisão: estabilidade, inclusão, reordenação, edição, gabarito e comportamento de circuitos, C, reta e Venn verificados.');

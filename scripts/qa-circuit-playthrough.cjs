#!/usr/bin/env node
// Replays the authored solution with the controls and placement rules of CircuitSim.
const ROOT = require('./support/load-content.cjs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { SECTIONS } = require(path.join(ROOT, 'src/content/sections'));
const { resolve } = require(path.join(ROOT, 'src/content'));
const { applyEdit, defaults, makeValue } = require(path.join(ROOT, 'src/lib/circuit'));
const {
  allTypes, gridFor, offeredValues, paletteItem, placeOnGrid, sliderMap, units,
} = require(path.join(ROOT, 'src/components/circuit/model'));

function reachableValue(part, target) {
  const map = sliderMap(part);
  const choices = [
    part.value ?? defaults(part.type).value,
    ...offeredValues(part),
    ...Array.from({ length: 1001 }, (_, i) => map.value(i / 1000)),
  ];
  return choices.reduce((best, v) => Math.abs(v - target) < Math.abs(best - target) ? v : best);
}

function solve(spec, solution) {
  assert(solution, 'falta solução cadastrada');
  const mode = spec.mode ?? 'adjust';
  const grid = gridFor(spec, 344);
  let comps = applyEdit(spec.comps, {});
  const aliases = new Map();
  for (const id of solution.remove ?? []) {
    const part = comps.find(c => c.id === id);
    assert(mode === 'build' && part && !part.locked, 'peça indisponível para remoção: ' + id);
    comps = applyEdit(comps, { remove: [id] });
  }
  for (const part of solution.add ?? []) {
    assert.equal(mode, 'build', 'montagem desabilitada');
    const tools = (spec.palette ?? allTypes).map(paletteItem).filter(p => p.type === part.type);
    assert(tools.length, 'ferramenta fora da paleta: ' + part.type);
    const same = p => (part.color == null || p.color === part.color) && (part.value == null || p.value === part.value);
    const ordered = [...tools.filter(same), ...tools.filter(p => !same(p))];
    const placements = ordered.map(p => placeOnGrid(comps, p, part.pts[0], part.pts[1] ?? part.pts[0], grid));
    const result = placements.find(r => r.part);
    assert(result, placements.map(r => r.error).join(' / '));
    assert.deepEqual(result.part.pts, part.pts, 'pinos da peça não correspondem à montagem');
    aliases.set(part.id, result.part.id);
    comps = applyEdit(comps, { add: [result.part] });
    if (part.value != null && result.part.value !== part.value) {
      assert(units[part.type] && !result.part.fixed, 'valor de montagem fora da paleta: ' + part.id);
      comps = applyEdit(comps, { set: { [result.part.id]: reachableValue(result.part, part.value) } });
    }
  }
  for (const [authoredId, target] of Object.entries(solution.set ?? {})) {
    const id = aliases.get(authoredId) ?? authoredId;
    const part = comps.find(c => c.id === id);
    assert(mode !== 'view' && part && !part.fixed && units[part.type], 'valor não editável: ' + id);
    comps = applyEdit(comps, { set: { [id]: reachableValue(part, target) } });
  }
  for (const [authoredId, on] of Object.entries(solution.on ?? {})) {
    const id = aliases.get(authoredId) ?? authoredId;
    const part = comps.find(c => c.id === id);
    assert(part && !part.fixed && ['switch', 'input'].includes(part.type), 'chave não acionável: ' + id);
    comps = applyEdit(comps, { on: { [id]: on } });
  }
  return comps;
}

let positions = 0;
let instances = 0;
const errors = [];
const counts = {};
for (const section of SECTIONS) for (const unit of section.units) for (const lesson of unit.lessons) {
  for (const [index, source] of lesson.exercises.entries()) {
    let found = false;
    for (const seed of ('gen' in source ? [1, 17, 71] : [1])) {
      const ex = resolve(source, seed + index * 7919);
      if (ex.kind !== 'interactive' || ex.widget !== 'circuit') continue;
      if (!found) {
        found = true;
        positions++;
        counts[section.id] = (counts[section.id] ?? 0) + 1;
      }
      instances++;
      try {
        const initial = makeValue(ex.props.comps);
        assert(!ex.check(initial), 'o circuito inicial já passa no gabarito');
        const circuit = solve(ex.props, ex.solution);
        const result = makeValue(circuit);
        assert(!result.error, 'simulação falhou: ' + result.error);
        assert(ex.check(result), 'a montagem ou os valores atingíveis não passam no gabarito');
      } catch (error) {
        errors.push(lesson.id + '#' + index + ' (semente ' + seed + ') ' + error.message);
      }
    }
  }
}
console.log(JSON.stringify({ positions, instances, counts, errors: errors.length }));
for (const error of errors) console.error(error);
if (errors.length) process.exitCode = 1;

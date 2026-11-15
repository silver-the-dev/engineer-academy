#!/usr/bin/env node
// Stable exercise revisions for the administrator's on-device review history.
const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');
const React = require('react');
const ROOT = require('./support/load-content.cjs');
const { makeRng } = require(path.join(ROOT, 'src/lib/random.ts'));
const { isGenerator } = require(path.join(ROOT, 'src/content/types.ts'));
const { applyEdit, makeValue } = require(path.join(ROOT, 'src/lib/circuit'));
const { checkC } = require(path.join(ROOT, 'src/lib/c/challenge.ts'));

// Part of every fingerprint. Raise it to send all questions back to review after a change that
// the probes below cannot see, such as how answers are graded or drawn for a whole exercise type.
const REVIEW_EPOCH = 1;

const SAMPLE_SEEDS = Object.freeze([17, 113, 271, 2027]);
const OUTPUT = path.join(ROOT, 'src/content/review-catalog.json');

function canonical(value) {
  if (typeof value === 'function') return { $function: Function.prototype.toString.call(value) };
  if (typeof value === 'symbol') return { $symbol: String(value) };
  if (typeof value === 'number' && (!Number.isFinite(value) || Object.is(value, -0))) {
    return { $number: Object.is(value, -0) ? '-0' : String(value) };
  }
  if (Array.isArray(value)) return value.map(canonical);
  if (value instanceof Map) return { $map: canonical([...value.entries()]) };
  if (value instanceof Set) return { $set: canonical([...value.values()]) };
  if (React.isValidElement(value)) return { type: canonical(value.type), key: value.key, props: canonical(value.props) };
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map(key => [key, canonical(value[key])]));
  }
  return value;
}

function probe(fn, ...args) {
  if (typeof fn !== 'function') return undefined;
  try {
    return fn(...args);
  } catch (error) {
    // Some callbacks intentionally only accept certain states. Hash the outcome
    // without stack traces or filesystem paths.
    return { $error: error?.name ?? 'Error' };
  }
}

function drawingSnapshot(node) {
  if (Array.isArray(node)) return node.map(drawingSnapshot);
  if (!React.isValidElement(node)) return node;
  const { children, f, g, from, to, a, b } = node.props;
  const sample = fn => typeof fn === 'function'
    ? [-3, -1, 0, 1, 3, from, to, a, b].filter(Number.isFinite).map(x => [x, probe(fn, x)])
    : undefined;
  return {
    type: node.type,
    key: node.key,
    props: { ...node.props, children: drawingSnapshot(children) },
    curves: [sample(f), sample(g)],
  };
}

const rounded = x => typeof x !== 'number' || !Number.isFinite(x) ? x : x === 0 ? 0 : Number(x.toPrecision(9));

// What the simulator measures before and after the reference solution, and what the check says.
// A change in the engine or in a value the check closes over shows up here.
function circuitState(comps, check) {
  if (!Array.isArray(comps)) return comps;
  const value = probe(makeValue, comps);
  if (!value || value.$error) return value;
  return {
    ok: value.ok,
    error: value.error,
    parts: value.comps.map(c => [c.id, rounded(value.v(c.id)), rounded(value.i(c.id)), value.on(c.id), value.burnt(c.id)]),
    check: probe(check, value),
  };
}

function widgetSnapshots(name, props, check, solution) {
  if (!props) return undefined;
  if (name === 'circuit') {
    return [circuitState(props.comps, check), solution === undefined ? undefined : circuitState(probe(applyEdit, props.comps, solution), check)];
  }
  if (name === 'c-lab') {
    return [solution, props.starter].map(source => {
      const run = typeof source === 'string' ? probe(checkC, source, props) : undefined;
      return [run, probe(check, run)];
    });
  }
  if (name === 'code-puzzle') return [probe(check, solution), probe(check, [])];
  if (name === 'numberline') {
    const min = props.min ?? -5, max = props.max ?? 5, step = props.step ?? 0.5;
    const count = Math.min(400, Math.floor((max - min) / step + 1e-9) + 1);
    return Array.from({ length: count }, (_, i) => rounded(min + i * step)).map(v => [v, probe(check, v)]);
  }
  if (name === 'venn') {
    const regions = ['A', 'AB', 'B', 'U'];
    return Array.from({ length: 16 }, (_, mask) => probe(check, regions.filter((_, i) => mask & (1 << i))));
  }
  if (name === 'bars') return [probe(check, props.values), probe(check, (props.values ?? []).map(() => 0))];
  if (name === 'simulator') return [0, 1, 10, 100, 1000, 10000].map(n => probe(check, n));
  if (name === 'stepper') {
    return [...new Set([0, Math.floor(props.steps / 2), props.steps - 1])]
      .map(i => [drawingSnapshot(probe(props.render, i, 360)), probe(props.info, i), probe(check, i)]);
  }
  if (name !== 'plot' && name !== 'space3d') return undefined;
  const params = props.params ?? [];
  const points = props.points ?? [];
  const pts = Object.fromEntries(points.map(({ id, x, y }) => [id, { x, y }]));
  return ['value', 'min', 'max'].map(key => {
    const p = Object.fromEntries(params.map(q => [q.key, q[key] ?? q.value]));
    const state = name === 'plot'
      ? { p, pts }
      : { p, yaw: props.initialYaw ?? -0.75, pitch: props.initialPitch ?? 0.42 };
    return {
      drawing: drawingSnapshot(probe(props.render, state)),
      info: probe(props.info, state),
      display: params.map(q => probe(q.format, p[q.key])),
      check: probe(check, state),
      hidden: probe(props.hidePoints, state),
      constrained: points.map(({ id, x, y }) => probe(props.constrain, id, x + 1, y - 1, state)),
    };
  });
}

function snapshot(ex) {
  return {
    exercise: ex,
    widget: widgetSnapshots(ex.widget, ex.props, ex.check, ex.solution),
    visual: widgetSnapshots(ex.visual?.name, ex.visual?.props),
  };
}

function fingerprintExercise(source) {
  const data = isGenerator(source)
    ? { generator: source, samples: SAMPLE_SEEDS.map(seed => snapshot(source.gen(makeRng(seed)))) }
    : snapshot(source);
  return createHash('sha256').update(JSON.stringify(canonical({ epoch: REVIEW_EPOCH, data }))).digest('hex').slice(0, 24);
}

function buildCatalog(sections) {
  const lessons = sections.flatMap(s => s.units.flatMap(u => u.lessons));
  lessons.sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
  const ids = new Set();
  return Object.fromEntries(lessons.map(lesson => {
    if (ids.has(lesson.id)) throw new Error('ID de lição duplicado: ' + lesson.id);
    ids.add(lesson.id);
    return [lesson.id, lesson.exercises.map((source, index) => {
      try {
        return fingerprintExercise(source);
      } catch (error) {
        throw new Error('Erro ao calcular revisão de ' + lesson.id + '#' + index, { cause: error });
      }
    })];
  }));
}

if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.length > 1 || (args.length === 1 && args[0] !== '--check')) {
    console.error('Uso: node scripts/generate-review-catalog.cjs [--check]');
    process.exitCode = 1;
  } else {
    const { SECTIONS } = require(path.join(ROOT, 'src/content/sections/index.ts'));
    const catalog = buildCatalog(SECTIONS);
    const output = JSON.stringify(catalog, null, 2) + '\n';
    const previous = fs.existsSync(OUTPUT) ? fs.readFileSync(OUTPUT, 'utf8') : '';
    if (args[0] === '--check' && output !== previous) {
      console.error('Catálogo de revisão desatualizado. Execute node scripts/generate-review-catalog.cjs.');
      process.exitCode = 1;
    } else {
      if (output !== previous) {
        const pending = OUTPUT + '.' + process.pid + '.tmp';
        try {
          fs.writeFileSync(pending, output);
          fs.renameSync(pending, OUTPUT);
        } finally {
          fs.rmSync(pending, { force: true });
        }
      }
      const n = Object.values(catalog).reduce((sum, lesson) => sum + lesson.length, 0);
      console.log('Catálogo de revisão: ' + n + ' questões em ' + Object.keys(catalog).length + ' lições.');
    }
  }
}

module.exports = { buildCatalog, fingerprintExercise, SAMPLE_SEEDS };

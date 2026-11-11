#!/usr/bin/env node
// Replays answer inputs for each non-circuit exercise. Run alongside qa-content.cjs.
const path = require('node:path');
const assert = require('node:assert/strict');
const ROOT = require('./support/load-content.cjs');
const { SECTIONS } = require(path.join(ROOT, 'src/content/sections/index.ts'));
const { makeRng, shuffle } = require(path.join(ROOT, 'src/lib/random.ts'));
const { checkNumeric, NUMERIC_INPUT_LIMIT, parseNumber } = require(path.join(ROOT, 'src/lib/numericAnswer.ts'));
const { checkC } = require(path.join(ROOT, 'src/lib/c/challenge.ts'));

function uniqueText(strings) {
  const normalized = strings.map(s => s.trim().replace(/\s+/g, ' '));
  return normalized.every(Boolean) && new Set(normalized).size === strings.length;
}

function numericEntry(ex) {
  const number = ex.answer;
  for (let digits = 0; digits <= NUMERIC_INPUT_LIMIT; digits++) {
    const value = number.toFixed(digits).replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '').replace('.', ',').replace('-', '−');
    if (/^[−0-9,]+$/.test(value) && value.length <= NUMERIC_INPUT_LIMIT && checkNumeric(ex, value)) return value;
  }
  return null;
}

function bankIndices(bank, answers) {
  const available = shuffle(makeRng(73), bank.map((text, index) => ({ text, index })));
  return answers.map(answer => {
    const i = available.findIndex(item => item.text === answer);
    assert(i >= 0, 'não há uma ficha disponível para ' + answer);
    return available.splice(i, 1)[0].index;
  });
}

function sliderValues({ min, max, step = 0.1, value }, clipAfterRounding = true) {
  assert(Number.isFinite(min) && Number.isFinite(max) && min < max && step > 0, 'faixa de controle inválida');
  assert(Number.isFinite(value) && min <= value && value <= max, 'valor inicial fora da faixa');
  const first = Math.round(min / step);
  const last = Math.round(max / step);
  assert(last - first < 10000, 'faixa extensa demais para enumeração');
  return [...new Set([value, ...Array.from({ length: last - first + 1 }, (_, i) => {
    const snapped = (first + i) * step;
    return clipAfterRounding ? Number(Math.min(max, Math.max(min, snapped)).toFixed(6)) : snapped;
  })])].sort((a, b) => Math.abs(a - value) - Math.abs(b - value));
}

function findCombination(arrays, check, budget = 800000) {
  const values = [];
  let count = 0;
  const visit = index => {
    if (count >= budget) return false;
    if (index === arrays.length) {
      count++;
      return check(values);
    }
    for (const value of arrays[index]) {
      values[index] = value;
      if (visit(index + 1)) return true;
      if (count >= budget) break;
    }
    return false;
  };
  return visit(0);
}

function pointCandidates(min, max, step, initial) {
  const first = Math.ceil(min / step);
  const last = Math.floor(max / step);
  if (last - first > 200) return [initial, min, max, (min + max) / 2];
  return [...new Set([initial, ...Array.from({ length: last - first + 1 }, (_, i) => Number(((first + i) * step).toFixed(8)))])];
}

function dragCandidates(view, step, point) {
  const xs = pointCandidates(view.xMin, view.xMax, step, point.x);
  const ys = pointCandidates(view.yMin, view.yMax, step, point.y);
  return xs.flatMap(x => ys.map(y => ({ x, y }))).sort((a, b) =>
    (a.x - point.x) ** 2 + (a.y - point.y) ** 2 - ((b.x - point.x) ** 2 + (b.y - point.y) ** 2));
}

function findPlotSolution(ex, initial, params, points) {
  const spec = ex.props;
  const { p, pts } = initial;
  const arrays = params.map(q => sliderValues(q));
  const sliderSearch = test => {
    const run = candidates => findCombination(candidates, values => test(Object.fromEntries(params.map((q, i) => [q.key, values[i]]))));
    // Try usual teaching values first for controls with a large Cartesian product.
    const shortlist = arrays.map((values, i) => values.filter(v =>
      v === params[i].value || v === params[i].min || v === params[i].max || Number.isInteger(v)));
    return run(shortlist) || run(arrays);
  };
  const check = (p, pts) => ex.check({ ...initial, p, pts });
  if (sliderSearch(p => check(p, pts))) return true;
  if (!points.length) return false;
  assert(spec.view, 'gráfico com pontos sem área de desenho');

  const move = (id, dest, p, current) => {
    const state = { p, pts: current };
    if (spec.hidePoints?.(state)?.includes(id)) return current;
    const snap = n => spec.snap ? Math.round(n / spec.snap) * spec.snap : n;
    const x = snap(dest.x);
    const y = snap(dest.y);
    return { ...current, [id]: spec.constrain?.(id, x, y, state) ?? { x, y } };
  };
  const candidates = points.map(point => dragCandidates(spec.view, spec.snap || 0.2, point));
  const testSingle = p => points.some(({ id }, i) =>
    candidates[i].some(dest => check(p, move(id, dest, p, pts))));
  if (sliderSearch(testSingle)) return true;
  // Alinhamento e dispersão: preserve a posição horizontal de cada ponto ou reúna-os.
  for (const slope of [0, 1, -1]) {
    for (const bias of [0, 1, 2, 4, 6, 8, 10]) {
      const desired = points.map(point => ({ x: point.x, y: slope * point.x + bias }));
      if (desired.every(({ y }) => y >= spec.view.yMin && y <= spec.view.yMax)) {
        const moved = points.reduce((current, point, i) => move(point.id, desired[i], p, current), pts);
        if (check(p, moved)) return true;
      }
    }
  }
  for (const x of [0, 2, 4, 6, 8, 10]) {
    if (x < spec.view.xMin || x > spec.view.xMax) continue;
    if (check(p, points.reduce((current, point) => move(point.id, { x, y: point.y }, p, current), pts))) return true;
  }
  for (let i = 0; i < points.length; i++) {
    for (let j = 0; j < points.length; j++) {
      if (i === j) continue;
      if (findCombination([candidates[i], candidates[j]], ([a, b]) => {
        const intermediate = move(points[i].id, a, p, pts);
        return check(p, move(points[j].id, b, p, intermediate));
      }, 800000)) return true;
    }
  }
  return false;
}

function replayWidget(ex) {
  const { widget, props, check, solution } = ex;
  if (widget === 'plot' || widget === 'space3d') {
    const params = props.params ?? [];
    const points = props.points ?? [];
    const initial = {
      p: Object.fromEntries(params.map(q => [q.key, q.value])),
      pts: Object.fromEntries(points.map(q => [q.id, { x: q.x, y: q.y }])),
      yaw: props.initialYaw ?? -0.75,
      pitch: props.initialPitch ?? 0.42,
    };
    assert(params.length || points.length, 'não há controle que envie uma resposta');
    assert(!check(initial), 'estado inicial já satisfaz a solução');
    assert(findPlotSolution(ex, initial, params, points), 'nenhum estado encontrado nas ações disponíveis');
  } else if (widget === 'numberline') {
    const min = props.min ?? -5, max = props.max ?? 5, step = props.step ?? 0.5;
    const value = props.value ?? (min + max) / 2;
    assert(props.marker !== false, 'marcador desativado');
    assert(!check(value), 'marcador inicial já satisfaz a solução');
    assert(sliderValues({ min, max, step, value }, false).some(v => check(v)), 'não há valor acessível na reta');
  } else if (widget === 'venn') {
    const regions = ['A', 'AB', 'B', 'U'];
    assert(!props.readOnly, 'seleção desativada');
    assert(!check(props.highlight ?? props.initial ?? []), 'regiões iniciais já satisfazem a solução');
    assert(Array.from({ length: 16 }, (_, mask) => regions.filter((_, i) => mask & (1 << i))).some(v => check(v)), 'nenhum conjunto de regiões satisfaz a solução');
  } else if (widget === 'bars') {
    const max = props.max ?? 10, step = props.step ?? 1;
    assert(props.editable !== false, 'barras sem edição');
    assert(props.labels.length === props.values.length && props.values.length > 0, 'rótulos incompatíveis com as barras');
    assert(!check(props.values), 'alturas iniciais já satisfazem a solução');
    const heights = sliderValues({ min: 0, max, step, value: 0 });
    assert(findCombination(props.values.map(() => heights), values => check(values)), 'nenhuma combinação de alturas encontrada');
  } else if (widget === 'simulator') {
    assert(!check(0), 'simulador já começa resolvido');
    assert(Array.from({ length: 10000 }, (_, i) => i + 1).some(v => check(v)), 'nenhuma sequência de lançamentos satisfaz a solução');
  } else if (widget === 'c-lab') {
    assert(typeof solution === 'string' && check(checkC(solution, props)), 'o programa não passa os casos');
    assert(!check(checkC(props.starter, props)), 'o programa inicial já passa');
  } else if (widget === 'code-puzzle') {
    assert(Array.isArray(solution) && solution.length === props.slots, 'quantidade incorreta de blocos');
    const used = bankIndices(props.pieces, solution);
    assert(check(used.map(i => props.pieces[i])), 'blocos selecionados não passam');
    assert(!check([]), 'sequência vazia passa');
  } else {
    throw new Error('widget sem estratégia de verificação: ' + widget);
  }
}

function replay(ex) {
  switch (ex.kind) {
    case 'mcq': {
      assert(uniqueText(ex.options) && ex.options.length >= 2, 'alternativas indistinguíveis ou ausentes');
      const order = shuffle(makeRng(73), ex.options.map((_, i) => i));
      assert(order.includes(ex.answer), 'resposta não aparece nas alternativas');
      break;
    }
    case 'multi': {
      assert(uniqueText(ex.options) && ex.options.length >= 2, 'alternativas indistinguíveis ou ausentes');
      const order = shuffle(makeRng(73), ex.options.map((_, i) => i));
      assert(ex.answers.length && new Set(ex.answers).size === ex.answers.length && ex.answers.every(i => order.includes(i)), 'seleção correta não pode ser reproduzida');
      break;
    }
    case 'tf':
      assert(typeof ex.answer === 'boolean', 'resposta não é verdadeiro/falso');
      break;
    case 'numeric':
      assert(Number.isFinite(ex.answer) && (ex.tol === undefined || Number.isFinite(ex.tol) && ex.tol >= 0), 'resultado ou tolerância inválida');
      assert(numericEntry(ex) !== null, 'resposta não pode ser digitada no teclado: ' + ex.answer);
      break;
    case 'match': {
      const left = ex.pairs.map(p => p[0]);
      const right = ex.pairs.map(p => p[1]);
      assert(left.length >= 2 && uniqueText(left) && uniqueText(right), 'opções iguais ou ausentes tornam a associação ambígua');
      assert(bankIndices(left, left).every((index, i) => index === bankIndices(right, right)[i]), 'as duas colunas não permitem montar os pares');
      break;
    }
    case 'order': {
      assert(uniqueText(ex.items) && ex.items.length >= 2, 'ordem contém peças iguais ou ausentes');
      assert(bankIndices(ex.items, ex.items).every((index, i) => index === i), 'sequência não pode ser reproduzida');
      break;
    }
    case 'fill': {
      assert(ex.answers.length && ex.template.split('___').length === ex.answers.length + 1, 'quantidade de lacunas não corresponde às respostas');
      const filled = bankIndices(ex.bank, ex.answers);
      assert(filled.every((index, i) => ex.bank[index] === ex.answers[i]), 'não é possível preencher todas as lacunas');
      break;
    }
    case 'interactive':
      replayWidget(ex);
      break;
    default:
      throw new Error('tipo de exercício sem estratégia: ' + ex.kind);
  }
}

for (const invalid of ['1,', '1,,2', '1/2/3', '3/0', '3//2', '-', '2,1,3', '4x', '−/4']) assert.equal(parseNumber(invalid), null, invalid);
for (const [input, expected] of [['−3,25', -3.25], ['3/4', 0.75], ['1,5/0,5', 3], [',5', 0.5]]) assert.equal(parseNumber(input), expected, input);

const totals = {};
const perSection = {};
const errors = [];
const filter = process.argv.slice(2);
let samples = 0;
for (const section of SECTIONS) {
  for (const unit of section.units) {
    for (const lesson of unit.lessons) {
      for (const [index, source] of lesson.exercises.entries()) {
        const key = lesson.id + '#' + index;
        if (filter.length && !filter.some(f => key.startsWith(f))) continue;
        const seeds = source.gen ? [17, 113, 271] : [17];
        for (const [attempt, seed] of seeds.entries()) {
          try {
            const ex = source.gen?.(makeRng(seed + index * 7919)) ?? source;
            if (ex.kind === 'interactive' && ex.widget === 'circuit') continue;
            const type = ex.kind === 'interactive' ? ex.widget : ex.kind;
            if (attempt === 0) {
              totals[type] = (totals[type] ?? 0) + 1;
              perSection[section.id] = (perSection[section.id] ?? 0) + 1;
            }
            samples++;
            replay(ex);
          } catch (error) {
            errors.push(key + ' (semente ' + seed + '): ' + error.message);
          }
        }
      }
    }
  }
}
console.log('Posições por tipo:', JSON.stringify(totals));
console.log('Posições por seção:', JSON.stringify(perSection));
console.log('Posições não circuito:', Object.values(totals).reduce((n, value) => n + value, 0), '| instâncias:', samples, '| falhas:', errors.length);
for (const error of errors) console.log(error);
process.exitCode = errors.length ? 1 : 0;

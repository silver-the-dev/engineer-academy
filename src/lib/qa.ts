/**
 * Content QA shared by the /debug screen and `node scripts/qa-content.cjs`:
 * validates every TeX snippet and the structure of every exercise (generators run with 6 seeds).
 */
import { isGenerator, type Exercise, type Section } from '../content/types';
import { makeRng } from './random';
import { compareOptions } from './texEval';
import { texToSvg, tidyOnes } from '../components/math/tex';

function extractMath(s: string): string[] {
  const out: string[] = [];
  const re = /\$\$([\s\S]+?)\$\$|\$([^$]+?)\$/g;
  const clean = (s || '').replace(/\\\$/g, '');
  let m: RegExpExecArray | null;
  while ((m = re.exec(clean))) out.push((m[1] ?? m[2]).trim());
  // odd number of $ => unbalanced
  const count = (clean.match(/\$/g) || []).length;
  if (count % 2) out.push('__UNBALANCED__' + s.slice(0, 60));
  return out;
}

function exStrings(e: Exercise): string[] {
  const s: string[] = [e.prompt, e.explain ?? '', e.hint ?? ''];
  if (e.kind === 'mcq' || e.kind === 'multi') s.push(...e.options);
  if (e.kind === 'match') e.pairs.forEach((p) => s.push(p[0], p[1]));
  if (e.kind === 'order') s.push(...e.items);
  if (e.kind === 'fill') s.push(e.template, ...e.bank);
  if (e.kind === 'interactive' && e.answerText) s.push(e.answerText);
  return s;
}

function structural(e: Exercise): string | null {
  if (e.kind === 'mcq' && (e.answer < 0 || e.answer >= e.options.length)) return 'mcq answer index';
  if (e.kind === 'mcq' && new Set(e.options).size !== e.options.length) return 'mcq duplicate options';
  if (e.kind === 'multi' && (!e.answers.length || e.answers.some((a) => a < 0 || a >= e.options.length))) return 'multi answer index';
  if (e.kind === 'multi' && new Set(e.options).size !== e.options.length) return 'multi duplicate options';
  // the renderer hides coefficient/exponent 1 (tidyOnes): "1x" and "x" would show as the same option
  if ((e.kind === 'mcq' || e.kind === 'multi') && new Set(e.options.map(tidyOnes)).size !== e.options.length) return 'opções iguais depois de esconder o 1 (1x = x)';
  if (e.kind === 'numeric' && !isFinite(e.answer)) return 'numeric answer not finite';
  if (e.kind === 'fill') {
    const slots = e.template.split('___').length - 1;
    if (slots !== e.answers.length) return `fill slots ${slots} != answers ${e.answers.length}`;
    for (const a of e.answers) if (!e.bank.includes(a)) return 'fill answer not in bank';
    // the screen renders each piece between blanks on its own: a blank inside $…$ breaks the formula
    const dollars = (p: string) => (p.match(/(^|[^\\])\$/g) ?? []).length;
    if (e.template.split('___').some((p) => dollars(p) % 2)) return 'fill: lacuna ___ dentro de $…$';
  }
  if (e.kind === 'match' && new Set(e.pairs.map((p) => p[1])).size !== e.pairs.length) return 'match duplicate right side';
  if (e.kind === 'order' && new Set(e.items).size !== e.items.length) return 'order duplicate items';
  return null;
}

/** Numeric value of a plain option such as "$-\dfrac{3}{4}$", "0,75" or "$2{,}5$" (null for anything else). */
export function optionValue(s: string): number | null {
  let t = s.trim();
  if (/^\$[^$]*\$$/.test(t)) t = t.slice(1, -1);
  t = t
    .replace(/\\[dt]?frac\{([^{}]+)\}\{([^{}]+)\}/g, '$1/$2')
    .replace(/\{,\}/g, '.')
    .replace(/(\d),(\d)/g, '$1.$2')
    .replace(/\\[,;!]|\s/g, '')
    .replace(/−/g, '-');
  const m = t.match(/^([+-]?)(\d+(?:\.\d+)?)(?:\/(\d+(?:\.\d+)?))?$/);
  if (!m) return null;
  const v = parseFloat(m[2]) / (m[3] ? parseFloat(m[3]) : 1);
  return isFinite(v) ? (m[1] === '-' ? -v : v) : null;
}

/** Problems that only show up for some random draws: equivalent options, "-0", doubled signs. */
function drawIssues(e: Exercise): string[] {
  const out: string[] = [];
  if (!e.explain?.trim()) out.push('sem explicação (quem erra não vê o porquê)');
  if (e.kind === 'mcq') {
    const vals = e.options.map(optionValue);
    const a = vals[e.answer];
    if (a !== null) vals.forEach((v, i) => i !== e.answer && v !== null && Math.abs(v - a) < 1e-9 && out.push(`opção errada "${e.options[i]}" vale o mesmo que a resposta "${e.options[e.answer]}"`));
    // "(x+1)(x-1)(x+4)" vs "(x-1)(x+1)(x+4)": the same product with the factors in another order
    const prod = (o: string) => {
      const m = o.trim().replace(/^\$|\$$/g, '').replace(/\s/g, '');
      if (!/^-?\d*(\([^()]+\)(\^\d+)?){2,}$/.test(m)) return null;
      const lead = m.match(/^-?\d*/)![0];
      return lead + '|' + (m.slice(lead.length).match(/\([^()]+\)(\^\d+)?/g) ?? []).sort().join('');
    };
    // options written differently but equal as functions ("1-\frac{4}{2}x^2" vs "1-2x^2"), or two
    // antiderivatives of an indefinite integral that differ only by a constant
    const indefinite = /\\int(?![_^])/.test(e.prompt);
    // factor / simplify / "write in the form" questions list equal expressions on purpose
    const formQuestion = /fator|simplifi|forma|notação|racionaliz|escrev|decomp|evidência|agrup|potência de|radical/i.test(e.prompt);
    e.options.forEach((o, i) => {
      if (i === e.answer || formQuestion) return;
      const c = compareOptions(e.options[e.answer], o);
      if (c === 'same') out.push(`opção errada "${o}" é igual à resposta "${e.options[e.answer]}" como expressão`);
      if (c === 'const' && indefinite && /\+\s*C\s*\$?$/.test(o) && /\+\s*C\s*\$?$/.test(e.options[e.answer])) out.push(`opção errada "${o}" difere da resposta só por uma constante (também é primitiva)`);
    });
    const pa = prod(e.options[e.answer]);
    if (pa) e.options.forEach((o, i) => i !== e.answer && prod(o) === pa && out.push(`opção errada "${o}" é o mesmo produto da resposta em outra ordem`));
  }
  for (const str of exStrings(e)) {
    // "\to", "\frac", "\beta" in a normal '…' string turn into tab/form-feed/backspace; "\in", "\mathbb" lose the backslash
    if (/[\t\f\v\b]/.test(str)) out.push(`caractere de controle no texto (TeX com barra simples em string normal?): ${JSON.stringify(str.slice(0, 60))}`);
    for (const raw of extractMath(str)) {
      const tex = tidyOnes(raw); // what the screen shows
      if (/(^|[^\\a-zA-Z])(infty|mathbb|operatorname|dfrac|sqrt|cdot)(?![a-zA-Z])/.test(tex)) out.push(`macro TeX sem barra em $${tex}$`);
      if (tex.startsWith('__UNBALANCED__')) continue;
      // "−0" written as a value (after "=", "(", "," or at the start), not "a−0"
      if (/(^|[=(,]|\\cdot|\\left\()\s*[-−]\s*0(?![\d.,{])/.test(tex)) out.push(`"−0" em $${tex}$`);
      if (/[+-]\s*[+-]\s*\d/.test(tex.replace(/\\pm|\\mp/g, ''))) out.push(`sinal duplo em $${tex}$`);
      if (/(\\cdot|\\times)\s*[-−]\s*\d/.test(tex)) out.push(`negativo sem parênteses depois de × em $${tex}$`);
    }
  }
  return out;
}

export type QAReport = { errors: string[]; warnings: string[]; bySection: string[]; nTex: number; nEx: number; nLessons: number; nItems: number; nParts: number };

export function runContentQA(sections: Section[]): QAReport {
  const errors: string[] = [];
  let nTex = 0;
  let nEx = 0;
  let nLessons = 0;
  const checkStr = (where: string, s: string) => {
    if (/[\t\f\v\b]/.test(s)) warnings.push(`${where}: caractere de controle no texto (TeX com barra simples em string normal?): ${JSON.stringify(s.slice(0, 60))}`);
    for (const tex of extractMath(s)) {
      if (tex.startsWith('__UNBALANCED__')) {
        errors.push(`${where}: $ desbalanceado: ${tex.slice(14)}`);
        continue;
      }
      nTex++;
      const r = texToSvg(tex, false);
      if (r.error) errors.push(`${where}: TeX inválido: ${tex}`);
    }
  };
  const warnings: string[] = [];
  const bySection: string[] = [];
  const ids = new Set<string>();
  let nItems = 0;
  let nParts = 0;
  for (const sec of sections) {
    let secLessons = 0;
    let secSplit = 0;
    let secParts = 0;
    let secItems = 0;
    for (const u of sec.units) {
      if (ids.has(u.id)) errors.push(`id de unidade repetido: ${u.id}`);
      ids.add(u.id);
      for (const l of u.lessons) {
        if (ids.has(l.id)) errors.push(`id de lição repetido: ${l.id}`);
        ids.add(l.id);
        nLessons++;
        secLessons++;
        secParts += l.parts.length;
        secItems += l.exercises.length;
        nParts += l.parts.length;
        nItems += l.exercises.length;
        if (l.parts.length > 1) secSplit++;
        else warnings.push(`${l.id}: lição sem partes (formato antigo)`);
        if (l.parts.length > 1) l.parts.forEach((p, pi) => p.count < 6 && warnings.push(`${l.id} parte ${pi + 1}: só ${p.count} exercícios`));
        if (u.guide) checkStr(`${u.id} guide`, u.guide);
        l.cards.forEach((c, i) => {
          checkStr(`${l.id} card${i}`, c.body);
          if (c.formula) {
            nTex++;
            if (texToSvg(c.formula, true).error) errors.push(`${l.id} card${i} formula: ${c.formula}`);
          }
          if (c.tip) checkStr(`${l.id} card${i} tip`, c.tip);
          if (c.example) checkStr(`${l.id} card${i} ex`, c.example);
        });
        l.exercises.forEach((src, idx) => {
          // TeX is checked on the first 6 draws; the cheap checks run on 30 draws to catch rare edge cases
          const seeds = isGenerator(src) ? Array.from({ length: 30 }, (_, i) => i + 1) : [0];
          for (const sd of seeds) {
            let e: Exercise;
            try {
              e = isGenerator(src) ? src.gen(makeRng(sd * 7919 + idx)) : src;
            } catch (err: any) {
              errors.push(`${l.id}#${idx}: gerador falhou: ${err?.message}`);
              continue;
            }
            nEx++;
            const st = structural(e);
            if (st) errors.push(`${l.id}#${idx}: ${st}`);
            if (e.kind === 'mcq' && e.options.length < 3 && !e.options.includes('Direta')) warnings.push(`${l.id}#${idx} (seed ${sd}): múltipla escolha com só ${e.options.length} opções`);
            for (const d of drawIssues(e)) {
              const msg = `${l.id}#${idx}: ${d}`;
              if (!warnings.includes(msg)) warnings.push(msg);
            }
            if (sd <= 6) exStrings(e).forEach((s) => checkStr(`${l.id}#${idx}`, s));
          }
        });
      }
    }
    bySection.push(`${sec.id}: ${secSplit}/${secLessons} lições com partes · ${secParts} partes · ${secItems} exercícios (${(secItems / secParts).toFixed(1)}/parte)`);
  }
  const selfTest = [texToSvg('\\macroinexistente x').error, texToSvg('\\frac{1}{').error, texToSvg('x^2').error];
  errors.unshift(`autoteste detector (esperado true,true,false): ${selfTest.join(',')}`);
  return { errors, warnings, bySection, nTex, nEx, nLessons, nItems, nParts };
}

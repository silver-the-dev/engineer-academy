/**
 * Content QA shared by the /debug screen and `node scripts/qa-content.cjs`:
 * validates every TeX snippet and the structure of every exercise (generators run with 6 seeds).
 */
import { isGenerator, type Exercise, type Section } from '../content/types';
import { makeRng } from './random';
import { texToSvg } from '../components/math/tex';

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
  if (e.kind === 'numeric' && !isFinite(e.answer)) return 'numeric answer not finite';
  if (e.kind === 'fill') {
    const slots = e.template.split('___').length - 1;
    if (slots !== e.answers.length) return `fill slots ${slots} != answers ${e.answers.length}`;
    for (const a of e.answers) if (!e.bank.includes(a)) return 'fill answer not in bank';
  }
  if (e.kind === 'match' && new Set(e.pairs.map((p) => p[1])).size !== e.pairs.length) return 'match duplicate right side';
  if (e.kind === 'order' && new Set(e.items).size !== e.items.length) return 'order duplicate items';
  return null;
}

export type QAReport = { errors: string[]; warnings: string[]; bySection: string[]; nTex: number; nEx: number; nLessons: number; nItems: number; nParts: number };

export function runContentQA(sections: Section[]): QAReport {
  const errors: string[] = [];
  let nTex = 0;
  let nEx = 0;
  let nLessons = 0;
  const checkStr = (where: string, s: string) => {
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
          const seeds = isGenerator(src) ? [1, 2, 3, 4, 5, 6] : [0];
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
            exStrings(e).forEach((s) => checkStr(`${l.id}#${idx}`, s));
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

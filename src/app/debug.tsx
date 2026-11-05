import React, { useMemo } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SECTIONS } from '../content';
import { isGenerator, type Exercise } from '../content/types';
import { makeRng } from '../lib/random';
import { texToSvg } from '../components/math/tex';
import { C, F } from '../theme';

/** Internal QA screen: validates every TeX snippet and exercise structure. */
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
  if (e.kind === 'numeric' && !isFinite(e.answer)) return 'numeric answer not finite';
  if (e.kind === 'fill') {
    const slots = e.template.split('___').length - 1;
    if (slots !== e.answers.length) return `fill slots ${slots} != answers ${e.answers.length}`;
    for (const a of e.answers) if (!e.bank.includes(a)) return 'fill answer not in bank';
  }
  if (e.kind === 'match' && new Set(e.pairs.map((p) => p[1])).size !== e.pairs.length) return 'match duplicate right side';
  return null;
}

export default function Debug() {
  const report = useMemo(() => {
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
    for (const sec of SECTIONS)
      for (const u of sec.units)
        for (const l of u.lessons) {
          nLessons++;
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
              exStrings(e).forEach((s) => checkStr(`${l.id}#${idx}`, s));
            }
          });
        }
    const selfTest = [texToSvg('\\macroinexistente x').error, texToSvg('\\frac{1}{').error, texToSvg('x^2').error];
    errors.unshift(`autoteste detector (esperado true,true,false): ${selfTest.join(',')}`);
    return { errors, nTex, nEx, nLessons };
  }, []);
  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ padding: 16 }}>
      <Text style={{ color: C.text, fontFamily: F.black, fontSize: 20 }}>QA de conteúdo</Text>
      <Text nativeID="qa-summary" style={{ color: C.textMuted, fontFamily: F.bold, marginVertical: 8 }}>
        {`lições=${report.nLessons} exercícios=${report.nEx} fórmulas=${report.nTex} erros=${report.errors.length}`}
      </Text>
      {report.errors.map((e, i) => (
        <View key={i} style={{ paddingVertical: 4, borderBottomWidth: 1, borderColor: C.surface2 }}>
          <Text style={{ color: C.danger, fontFamily: F.semibold, fontSize: 12 }}>{e}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

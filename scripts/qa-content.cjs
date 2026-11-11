#!/usr/bin/env node
/**
 * Headless content QA (same checks as the /debug screen).
 *
 *   node scripts/qa-content.cjs            # whole app
 *   node scripts/qa-content.cjs c-tec f-   # only errors/warnings whose text contains one of these ids
 *
 * Loads src/content with a tiny require hook: .ts/.tsx are transpiled with the project's TypeScript,
 * native-only modules (react-native, react-native-svg, expo-*) are replaced by inert stubs.
 * Exit code 1 if there is any error besides the detector self-test.
 */
const path = require('node:path');
const ROOT = require('./support/load-content.cjs');

const { runContentQA } = require(path.join(ROOT, 'src/lib/qa.ts'));
const { normalizeSection } = require(path.join(ROOT, 'src/content/types.ts'));

// --file path/to/content.tsx: check every UnitDef exported by that file (even if not registered yet)
let args = process.argv.slice(2);
let SECTIONS;
const fi = args.indexOf('--file');
if (fi >= 0) {
  const file = path.resolve(process.cwd(), args[fi + 1]);
  args = args.filter((_, i) => i !== fi && i !== fi + 1);
  const mod = require(file);
  const units = Object.values(mod).filter((u) => u && typeof u === 'object' && typeof u.id === 'string' && Array.isArray(u.lessons));
  if (!units.length) {
    console.log('✗ nenhum UnitDef exportado em ' + file);
    process.exit(1);
  }
  SECTIONS = [normalizeSection({ id: path.basename(file), title: '', subtitle: '', color: '', emoji: '', units })];
} else {
  SECTIONS = require(path.join(ROOT, 'src/content/sections/index.ts')).SECTIONS;
}

const filters = args;
const keep = (s) => !filters.length || filters.some((f) => s.includes(f));
const r = runContentQA(SECTIONS);
console.log(`lições=${r.nLessons} partes=${r.nParts} exercícios=${r.nItems} (testados=${r.nEx}) fórmulas=${r.nTex} erros=${r.errors.length} avisos=${r.warnings.length}`);
r.bySection.forEach((s) => console.log('  ' + s));
const errs = r.errors.filter(keep);
const warns = r.warnings.filter(keep);
if (errs.length) console.log('\nERROS:\n' + errs.map((e) => '  ✗ ' + e).join('\n'));
if (warns.length) console.log('\nAVISOS:\n' + warns.map((e) => '  ! ' + e).join('\n'));
const real = r.errors.filter((e) => !e.startsWith('autoteste detector'));
const selfOk = r.errors[0] && r.errors[0].endsWith('true,true,false');
if (!selfOk) console.log('\n✗ autoteste do detector falhou: ' + r.errors[0]);
process.exit(real.length || !selfOk ? 1 : 0);

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
const Module = require('module');
const fs = require('fs');
const path = require('path');
const ts = require('typescript');

const ROOT = path.resolve(__dirname, '..');
const STUB_RE = /^(react-native(-svg|-gesture-handler|-reanimated|-safe-area-context|-worklets)?|expo(-.+)?|@expo\/.+|@react-native-async-storage\/.+)$/;

function stub() {
  const fn = function () {
    return null;
  };
  return new Proxy(fn, {
    get: (_t, k) => (k === '__esModule' ? true : k === 'default' ? stub() : k === Symbol.toPrimitive ? () => '' : stub()),
    apply: () => null,
    construct: () => ({}),
  });
}

const origLoad = Module._load;
Module._load = function (request, parent, isMain) {
  if (STUB_RE.test(request) || /\.(wav|mp3|png|jpe?g|ttf|otf)$/i.test(request)) return stub();
  return origLoad.call(this, request, parent, isMain);
};

const origResolve = Module._resolveFilename;
Module._resolveFilename = function (request, parent, ...rest) {
  try {
    return origResolve.call(this, request, parent, ...rest);
  } catch (e) {
    if (request.startsWith('.') && parent && parent.filename) {
      const base = path.resolve(path.dirname(parent.filename), request);
      for (const ext of ['.ts', '.tsx', '/index.ts', '/index.tsx']) if (fs.existsSync(base + ext)) return base + ext;
    }
    throw e;
  }
};

for (const ext of ['.ts', '.tsx']) {
  Module._extensions[ext] = function (module, filename) {
    const src = fs.readFileSync(filename, 'utf8');
    const out = ts.transpileModule(src, {
      fileName: filename,
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.React, esModuleInterop: true },
    });
    module._compile(out.outputText, filename);
  };
}

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

// Transpile catalog TypeScript and stand in for native modules in Node QA.
const Module = require('module');
const fs = require('fs');
const path = require('path');
const ts = require('typescript');

const ROOT = path.resolve(__dirname, '..', '..');
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

module.exports = ROOT;

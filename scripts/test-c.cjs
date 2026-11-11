// Exercise the same evaluator used on the phone, without an Expo runtime.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');

require.extensions['.ts'] = (mod, file) => {
  const source = fs.readFileSync(file, 'utf8');
  mod._compile(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, file);
};

const { runC, C_SOURCE_LIMIT } = require('../src/lib/c/run.ts');
const { checkC } = require('../src/lib/c/challenge.ts');
const main = (body) => 'int main(void) {\n' + body + '\n}';
let count = 0;
const ok = (source, value, output = '', entry, args) => {
  assert.deepEqual(runC(source, entry, args), { ok: true, value, output });
  count++;
};
const bad = (source, expected) => {
  const r = runC(source);
  assert.equal(r.ok, false, source.slice(0, 100));
  assert.match(r.error, expected);
  count++;
};

ok('#include <stdio.h>\n' + main('printf("saida: %d %x %c %%\\n", -7, 26, \'A\');'), 0, 'saida: -7 1a A %\n');
ok(main('return -17 / 5 * 10 + (-17 % 5);'), -32);
ok(main('return 010 + (0xA3 >> 4);'), 18);
ok(main('int i = 0; int s = 0; while (i < 3) { ++i; s += i; } return s;'), 6);
ok(main('int s = 0; for (int i = 1; i <= 5; i++) { s += i; } return s;'), 15);
ok(main('int x = 7; if (1) { int x = 2; x++; } return x;'), 7);
ok(main('if (1 || (2 / 0)) return !0; else return 3;'), 1);
ok(main('return 0 && (2 / 0);'), 0);
ok('int dobro(int n) { return 2*n; } int total(int a,int b) { return dobro(a)+dobro(b); }', 22, '', 'total', [2, 9]);
ok(main('int n = 15; n &= ~8; n ^= 1; return n;'), 6);
ok(main('printf("}"); return 0;'), 0, '}');
bad(main('printf("a")'), /esperado «;»/);
bad(main('printf("%s", 3);'), /formatos aceitos/);
bad(main('return 1 / 0;'), /divisão por zero/);
bad(main('int x; return x;'), /inicializada/);
bad(main('return 2147483647 + 1;'), /fora da faixa/);
bad(main('while (1) {}'), /limite de execução/);
bad(main('return main();'), /limite de chamadas/);
bad(main('while (1) { printf("0123456789"); }'), /limite de saída/);
bad(main('return ' + '('.repeat(90) + '0' + ')'.repeat(90) + ';'), /aninhada/);
bad(' '.repeat(C_SOURCE_LIMIT + 1), /grande demais/);
bad('#include <unistd.h>\n' + main('return 0;'), /stdio/);
bad('#define X 1\n' + main('return X;'), /stdio/);
bad(main('return system("sh");'), /função system não disponível/);
bad(main('return open("arquivo");'), /função open não disponível/);
bad(main('return fetch("http://host");'), /função fetch não disponível/);
bad(main('return eval("globalThis");'), /função eval não disponível/);
bad(main('return constructor();'), /função constructor não disponível/);
bad(main('printf("%n", 1);'), /formatos aceitos/);
bad(main('return globalThis.fetch();'), /símbolo/);
const challenge = { entry: 'dobro', cases: [{ args: [4], value: 8 }, { args: [-2], value: -4 }] };
assert.equal(checkC('int dobro(int n) { return 8; }', challenge).passed, false);
assert.equal(checkC('int dobro(int n) { return n * 2; }', challenge).passed, true);
console.log(`C didático: ${count + 2} casos passaram.`);

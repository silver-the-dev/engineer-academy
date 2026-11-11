// Educational subset of C. Source is parsed as data; the evaluator has no host API.
type Tok = { s: string; line: number; kind: 'word' | 'num' | 'str' | 'symbol' | 'end' };
type Expr =
  | { k: 'num'; n: number; line: number }
  | { k: 'str'; s: string; line: number }
  | { k: 'var'; name: string; line: number }
  | { k: 'call'; name: string; args: Expr[]; line: number }
  | { k: 'op'; op: string; a: Expr; b?: Expr; line: number };
type Stmt =
  | { k: 'block'; items: Stmt[]; line: number }
  | { k: 'decl'; name: string; value?: Expr; line: number }
  | { k: 'assign'; name: string; op: string; value: Expr; line: number }
  | { k: 'expr' | 'return'; value: Expr; line: number }
  | { k: 'if'; cond: Expr; yes: Stmt; no?: Stmt; line: number }
  | { k: 'loop'; cond: Expr; body: Stmt; init?: Stmt; next?: Stmt; line: number };
type Fn = { params: string[]; body: Stmt; line: number };
export type CResult = { ok: true; output: string; value: number } | { ok: false; output: string; error: string };

export const C_SOURCE_LIMIT = 6000;
const PRECEDENCE: ReadonlyMap<string, number> = new Map([
  ['||', 1], ['&&', 2], ['|', 3], ['^', 4], ['&', 5], ['==', 6], ['!=', 6],
  ['<', 7], ['<=', 7], ['>', 7], ['>=', 7], ['<<', 8], ['>>', 8],
  ['+', 9], ['-', 9], ['*', 10], ['/', 10], ['%', 10],
]);
const RESERVED = new Set('int void float double char short long unsigned signed if else for while do switch case default break continue return goto const volatile static extern auto register typedef struct union enum sizeof _Bool _Alignof _Alignas _Atomic _Complex _Generic _Imaginary _Noreturn _Static_assert _Thread_local restrict inline printf'.split(' '));
const ASSIGN = new Set(['=', '+=', '-=', '*=', '/=', '%=', '&=', '|=', '^=', '<<=', '>>=', '++', '--']);
const fail = (line: number, message: string): never => { throw new Error(`Linha ${line}: ${message}`); };
const int = (n: number, line: number) => {
  if (!Number.isInteger(n) || n < -2147483648 || n > 2147483647) fail(line, 'valor fora da faixa de int de 32 bits.');
  return n || 0;
};

function lex(source: string): Tok[] {
  const tokens: Tok[] = [];
  let i = 0;
  let line = 1;
  const token = (s: string, kind: Tok['kind']) => {
    tokens.push({ s, line, kind });
    if (tokens.length > 1400) fail(line, 'programa grande demais para o exercício.');
  };
  while (i < source.length) {
    const rest = source.slice(i);
    if (rest[0] === '\n') { line++; i++; continue; }
    if (/^\s/.test(rest)) { i++; continue; }
    const comment = /^\/\/[^\n]*|^\/\*[\s\S]*?\*\//.exec(rest)?.[0];
    if (comment !== undefined) { line += comment.split('\n').length - 1; i += comment.length; continue; }
    if (rest.startsWith('/*')) fail(line, 'comentário sem fechamento.');
    if (rest[0] === '#') {
      const directive = /^#[ \t]*include[ \t]*<stdio\.h>[ \t]*(?:\/\/[^\n]*)?(?=\r?\n|$)/.exec(rest)?.[0];
      if (!directive || tokens.length) fail(line, 'só #include <stdio.h> no início é permitido.');
      i += directive!.length;
      continue;
    }
    if (rest[0] === '"' || rest[0] === "'") {
      const quote = rest[0];
      const start = line;
      let out = '';
      i++;
      while (i < source.length && source[i] !== quote) {
        const ch = source[i++];
        if (ch === '\n' || ch === '\r') fail(start, 'literal sem fechamento.');
        if (ch !== '\\') { out += ch; continue; }
        const esc = source[i++];
        if (esc === 'n') out += '\n';
        else if (esc === 't') out += '\t';
        else if (esc === 'r') out += '\r';
        else if (esc === '\\' || esc === '"' || esc === "'") out += esc;
        else fail(start, 'sequência de escape não disponível.');
      }
      if (source[i++] !== quote) fail(start, 'literal sem fechamento.');
      if (quote === "'" && (out.length !== 1 || out.charCodeAt(0) > 127)) fail(start, 'use um caractere ASCII entre aspas simples.');
      token(quote === '"' ? out : String(out.charCodeAt(0)), quote === '"' ? 'str' : 'num');
      continue;
    }
    const word = /^[A-Za-z_][A-Za-z_0-9]*/.exec(rest)?.[0];
    if (word) { token(word, 'word'); i += word.length; continue; }
    const n = /^(?:0[xX][0-9A-Fa-f]+|[0-9]+)(?![A-Za-z_0-9.])/.exec(rest)?.[0];
    if (n) { token(n, 'num'); i += n.length; continue; }
    const sym = /^(?:<<=|>>=|\+\+|--|[+*/%&|^!<>=-]=|&&|\|\||<<|>>|[{}(),;=+*/%&|^!~<>-])/.exec(rest)?.[0];
    if (sym) { token(sym, 'symbol'); i += sym.length; continue; }
    fail(line, `símbolo ou literal não disponível: ${rest[0]}.`);
  }
  return [...tokens, { s: '', line, kind: 'end' }];
}

class Parser {
  private i = 0;
  private depth = 0;
  constructor(private tokens: Tok[]) {}
  peek() { return this.tokens[this.i]; }
  is(s: string) { const t = this.peek(); return t.s === s && t.kind !== 'str' && t.kind !== 'end'; }
  take(s: string) { if (!this.is(s)) return false; this.i++; return true; }
  need(s: string) { if (!this.take(s)) fail(this.peek().line, `esperado «${s}».`); }
  name() {
    const t = this.peek();
    if (t.kind !== 'word' || RESERVED.has(t.s)) fail(t.line, 'esperado um nome disponível.');
    this.i++;
    return t.s;
  }
  nested<T>(f: () => T): T {
    if (++this.depth > 48) fail(this.peek().line, 'estrutura muito aninhada.');
    try { return f(); } finally { this.depth--; }
  }
  program() {
    const fns = new Map<string, Fn>();
    while (this.peek().kind !== 'end') {
      const { line } = this.peek();
      this.need('int');
      const name = this.name();
      if (fns.has(name)) fail(line, `função ${name} já definida.`);
      this.need('(');
      const params: string[] = [];
      if (!this.take('void') && !this.is(')')) {
        do {
          this.need('int');
          const p = this.name();
          if (params.includes(p)) fail(line, 'parâmetro repetido.');
          params.push(p);
        } while (this.take(','));
      }
      this.need(')');
      if (!this.is('{')) fail(this.peek().line, 'esperado o corpo da função entre chaves.');
      fns.set(name, { params, body: this.statement(), line });
    }
    return fns;
  }
  private expression(min = 1): Expr {
    return this.nested(() => {
      const t = this.peek();
      let a: Expr;
      if (t.kind === 'symbol' && ['+', '-', '!', '~'].includes(t.s)) {
        this.i++;
        // Accept the minimum signed value as a literal expression.
        if (t.s === '-' && this.peek().kind === 'num' && this.peek().s === '2147483648') {
          this.i++;
          a = { k: 'num', n: -2147483648, line: t.line };
        } else a = { k: 'op', op: t.s, a: this.expression(11), line: t.line };
      } else if (this.take('(')) {
        a = this.expression();
        this.need(')');
      } else if (t.kind === 'num') {
        this.i++;
        if (/^0[0-9]/.test(t.s) && !/^0[0-7]+$/.test(t.s)) fail(t.line, 'literal octal inválido.');
        a = { k: 'num', n: int(/^0[0-7]+$/.test(t.s) ? parseInt(t.s, 8) : Number(t.s), t.line), line: t.line };
      } else if (t.kind === 'str') {
        this.i++;
        a = { k: 'str', s: t.s, line: t.line };
      } else {
        let name: string;
        if (this.take('printf')) name = 'printf';
        else name = this.name();
        if (this.take('(')) {
          const args: Expr[] = [];
          if (!this.is(')')) do { args.push(this.expression()); } while (this.take(','));
          this.need(')');
          a = { k: 'call', name, args, line: t.line };
        } else a = { k: 'var', name, line: t.line };
      }
      while (this.peek().kind === 'symbol') {
        const op = this.peek();
        const p = PRECEDENCE.get(op.s);
        if (!p || p < min) break;
        this.i++;
        a = { k: 'op', op: op.s, a, b: this.expression(p + 1), line: op.line };
      }
      return a;
    });
  }
  private simple(): Stmt {
    const t = this.peek();
    if (this.take('int')) {
      const name = this.name();
      return { k: 'decl', name, value: this.take('=') ? this.expression() : undefined, line: t.line };
    }
    if ((t.s === '++' || t.s === '--') && t.kind === 'symbol') {
      this.i++;
      return { k: 'assign', name: this.name(), op: t.s === '++' ? '+=' : '-=', value: { k: 'num', n: 1, line: t.line }, line: t.line };
    }
    const a = this.expression();
    const next = this.peek();
    if (a.k === 'var' && next.kind === 'symbol' && ASSIGN.has(next.s)) {
      this.i++;
      if (next.s === '++' || next.s === '--') return { k: 'assign', name: a.name, op: next.s === '++' ? '+=' : '-=', value: { k: 'num', n: 1, line: t.line }, line: t.line };
      return { k: 'assign', name: a.name, op: next.s, value: this.expression(), line: t.line };
    }
    return { k: 'expr', value: a, line: t.line };
  }
  private statement(): Stmt {
    return this.nested(() => {
      const { line } = this.peek();
      if (this.take('{')) {
        const items: Stmt[] = [];
        while (!this.take('}')) items.push(this.statement());
        return { k: 'block', items, line };
      }
      if (this.take('if')) {
        this.need('(');
        const cond = this.expression();
        this.need(')');
        const yes = this.statement();
        const no = this.take('else') ? this.statement() : undefined;
        return { k: 'if', cond, yes, no, line };
      }
      const isFor = this.take('for');
      if (isFor || this.take('while')) {
        this.need('(');
        const init = isFor && !this.is(';') ? this.simple() : undefined;
        if (isFor) this.need(';');
        const cond: Expr = isFor && this.is(';') ? { k: 'num', n: 1, line } : this.expression();
        if (isFor) this.need(';');
        const next = isFor && !this.is(')') ? this.simple() : undefined;
        if (next?.k === 'decl') fail(line, 'não declare variável na atualização do for.');
        this.need(')');
        return { k: 'loop', init, cond, next, body: this.statement(), line };
      }
      let s: Stmt;
      if (this.take('return')) s = { k: 'return', value: this.expression(), line };
      else s = this.simple();
      this.need(';');
      return s;
    });
  }
}

function binary(op: string, a: number, b: number, line: number): number {
  switch (op) {
    case '+': return int(a + b, line);
    case '-': return int(a - b, line);
    case '*': return int(a * b, line);
    case '/': case '%':
      if (b === 0) fail(line, 'divisão por zero.');
      if (a === -2147483648 && b === -1) fail(line, 'divisão fora da faixa de int.');
      return op === '/' ? Math.trunc(a / b) || 0 : a % b || 0;
    case '<': return Number(a < b);
    case '<=': return Number(a <= b);
    case '>': return Number(a > b);
    case '>=': return Number(a >= b);
    case '==': return Number(a === b);
    case '!=': return Number(a !== b);
    case '&': return a & b;
    case '|': return a | b;
    case '^': return a ^ b;
    case '<<': case '>>':
      if (b < 0 || b > 31 || a < 0) fail(line, 'use deslocamento de 0 a 31 e operando não negativo.');
      return op === '<<' ? int(a * 2 ** b, line) : a >> b;
    default: return fail(line, 'operador não disponível.');
  }
}

type Scope = Map<string, number | undefined>[];
const has = (scopes: Scope, name: string) => [...scopes].reverse().find((s) => s.has(name));

export function runC(source: string, entry = 'main', args: readonly number[] = []): CResult {
  let output = '';
  try {
    if (source.length > C_SOURCE_LIMIT) fail(1, 'código grande demais para o exercício.');
    const fns = new Parser(lex(source)).program();
    let steps = 15000;
    let depth = 0;
    const tick = (line: number) => { if (--steps < 0) fail(line, 'limite de execução atingido. Confira os laços.'); };
    const call = (name: string, values: readonly number[], line: number): number => {
      if (++depth > 24) fail(line, 'limite de chamadas de função atingido.');
      const fn = fns.get(name);
      if (!fn) return fail(line, `função ${name} não disponível.`);
      if (fn.params.length !== values.length) fail(line, `${name} espera ${fn.params.length} argumento(s).`);
      const params = new Map(fn.params.map((p, i) => [p, int(values[i], line)]));
      // The function body shares its outer scope with parameters in C.
      let result: number | undefined;
      if (fn.body.k === 'block') {
        for (const s of fn.body.items) { result = execute(s, [params]); if (result !== undefined) break; }
      }
      depth--;
      if (result === undefined && name !== 'main') fail(fn.line, `a função ${name} precisa devolver um int.`);
      return result ?? 0;
    };
    const read = (scope: Scope, name: string, line: number): number => {
      const value = has(scope, name)?.get(name);
      return value ?? fail(line, `${name} não foi declarada e inicializada.`);
    };
    const evaluate = (e: Expr, scope: Scope): number => {
      tick(e.line);
      switch (e.k) {
        case 'num': return e.n;
        case 'var': return read(scope, e.name, e.line);
        case 'str': return fail(e.line, 'texto só é aceito como formato de printf.');
        case 'op': {
          const a = evaluate(e.a, scope);
          if (!e.b) return e.op === '-' ? int(-a, e.line) : e.op === '~' ? ~a : e.op === '!' ? Number(!a) : a;
          if (e.op === '&&') return Number(Boolean(a && evaluate(e.b, scope)));
          if (e.op === '||') return Number(Boolean(a || evaluate(e.b, scope)));
          return binary(e.op, a, evaluate(e.b, scope), e.line);
        }
        case 'call': {
          if (e.name !== 'printf') {
            if (!fns.has(e.name)) return fail(e.line, `função ${e.name} não disponível.`);
            return call(e.name, e.args.map((a) => evaluate(a, scope)), e.line);
          }
          const [format, ...rest] = e.args;
          if (format?.k !== 'str') return fail(e.line, 'printf precisa de um formato entre aspas.');
          const values = rest.map((a) => evaluate(a, scope));
          let i = 0;
          const str = format.s.replace(/%([\s\S]|$)/g, (_, spec: string) => {
            if (spec === '%') return '%';
            if (!['d', 'i', 'u', 'x', 'X', 'c'].includes(spec)) return fail(e.line, 'formatos aceitos: %d, %i, %u, %x, %X, %c e %%.');
            const v = values[i++];
            if (v === undefined) return fail(e.line, 'faltou argumento no printf.');
            if (spec === 'c') {
              if (v < 0 || v > 127) return fail(e.line, '%c aceita valores ASCII de 0 a 127.');
              return String.fromCharCode(v);
            }
            if (spec === 'u') return String(v >>> 0);
            if (spec === 'x' || spec === 'X') {
              const hex = (v >>> 0).toString(16);
              return spec === 'X' ? hex.toUpperCase() : hex;
            }
            return String(v);
          });
          if (i !== values.length) fail(e.line, 'sobraram argumentos no printf.');
          if (output.length + str.length > 1800) fail(e.line, 'limite de saída atingido.');
          output += str;
          return str.length;
        }
      }
    };
    const execute = (s: Stmt, scope: Scope): number | undefined => {
      tick(s.line);
      switch (s.k) {
        case 'block': {
          const nested = [...scope, new Map<string, number | undefined>()];
          for (const item of s.items) {
            const ret = execute(item, nested);
            if (ret !== undefined) return ret;
          }
          break;
        }
        case 'decl': {
          const local = scope[scope.length - 1];
          if (local.has(s.name)) fail(s.line, `${s.name} já existe neste bloco.`);
          local.set(s.name, undefined);
          if (s.value) local.set(s.name, evaluate(s.value, scope));
          break;
        }
        case 'assign': {
          const local = has(scope, s.name);
          if (!local) return fail(s.line, `${s.name} não foi declarada.`);
          const b = evaluate(s.value, scope);
          local.set(s.name, s.op === '=' ? b : binary(s.op.slice(0, -1), read(scope, s.name, s.line), b, s.line));
          break;
        }
        case 'expr': evaluate(s.value, scope); break;
        case 'return': return evaluate(s.value, scope);
        case 'if': {
          if (evaluate(s.cond, scope)) return execute(s.yes, [...scope, new Map()]);
          if (s.no) return execute(s.no, [...scope, new Map()]);
          break;
        }
        case 'loop': {
          const inner = [...scope, new Map<string, number | undefined>()];
          if (s.init) execute(s.init, inner);
          while (evaluate(s.cond, inner)) {
            const ret = execute(s.body, [...inner, new Map()]);
            if (ret !== undefined) return ret;
            if (s.next) execute(s.next, inner);
          }
          break;
        }
      }
    };
    return { ok: true, value: call(entry, args, 1), output };
  } catch (error) {
    return { ok: false, output, error: error instanceof Error ? error.message : 'Não foi possível executar.' };
  }
}

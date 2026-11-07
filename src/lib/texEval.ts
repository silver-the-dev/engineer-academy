/**
 * Tiny evaluator for the TeX of multiple-choice options (QA only): turns "$\frac{x^2}{2}\ln x-\frac{x^2}{4}+C$"
 * into a function of x, y, t, n, u so two options can be compared numerically. Anything it does not
 * understand (words, sets, intervals, vectors, matrices…) returns null and is simply not compared.
 */
type Tok = { k: 'num' | 'id' | 'fn' | 'op' | '(' | ')'; v: string };
type Fn = (env: Record<string, number>) => number;

const FN: Record<string, (a: number) => number> = {
  sin: Math.sin, cos: Math.cos, tan: Math.tan, sec: (a) => 1 / Math.cos(a), csc: (a) => 1 / Math.sin(a), cot: (a) => 1 / Math.tan(a),
  asin: Math.asin, acos: Math.acos, atan: Math.atan, sinh: Math.sinh, cosh: Math.cosh, tanh: Math.tanh,
  ln: Math.log, log: Math.log10, sqrt: Math.sqrt, abs: Math.abs, exp: Math.exp,
};
const NAMES: Record<string, string> = {
  sen: 'sin', sin: 'sin', cos: 'cos', tg: 'tan', tan: 'tan', sec: 'sec', cossec: 'csc', csc: 'csc', cotg: 'cot', cot: 'cot',
  arcsen: 'asin', arcsin: 'asin', arccos: 'acos', arctg: 'atan', arctan: 'atan', senh: 'sinh', sinh: 'sinh', cosh: 'cosh', tgh: 'tanh', tanh: 'tanh', ln: 'ln', log: 'log', exp: 'exp',
};
const VARS = new Set(['x', 'y', 't', 'n', 'u', 'z', 'e', 'π', 'C']);

function prep(tex: string): string | null {
  let s = tex.trim();
  if (/^\$[^$]*\$$/.test(s)) s = s.slice(1, -1);
  s = s.replace(/\\left\||\\right\|/g, '|').replace(/\|([^|]+)\|/g, '\\abs($1)');
  if (s.includes('$') || /\\(times|text|mathrm|mathbb|vec|begin|in|le|ge|ne|neq|to|lt|gt|infty|pm|mp|iff|implies|Rightarrow|cup|cap|sum|int|lim|prod|\{)|[<>=≤≥,;:!|[\]']/.test(s)) return null;
  s = s
    .replace(/\\left|\\right|\\big|\\Big|\\displaystyle/g, '')
    .replace(/\\[,;!:]|\\quad|~/g, ' ')
    .replace(/\{,\}/g, '.')
    .replace(/\\cdot/g, '*')
    .replace(/\\pi/g, 'π')
    .replace(/\\operatorname\{([a-z]+)\}/g, (_m, n: string) => (NAMES[n] ? `\\${NAMES[n]}` : `\\?${n}`))
    .replace(/\\(sen|sin|cos|tg|tan|sec|cossec|csc|cotg|cot|arcsen|arcsin|arccos|arctg|arctan|senh|sinh|cosh|tgh|tanh|ln|log|exp)(?![a-z])/g, (_m, n: string) => `\\${NAMES[n]}`);
  // \frac{a}{b} / \dfrac / \tfrac and \sqrt[n]{a}: rewrite innermost first
  for (let i = 0; i < 40; i++) {
    const before = s;
    s = s.replace(/\\[dt]?frac\s*\{([^{}]*)\}\s*\{([^{}]*)\}/g, '(($1)/($2))');
    s = s.replace(/\\[dt]?frac\s*(\d)\s*(\d)/g, '(($1)/($2))');
    s = s.replace(/\\[dt]?frac\s*(\d)\s*\{([^{}]*)\}/g, '(($1)/($2))');
    s = s.replace(/\\[dt]?frac\s*\{([^{}]*)\}\s*([a-z\d])/g, '(($1)/($2))');
    s = s.replace(/\\sqrt\s*\[([^\]]*)\]\s*\{([^{}]*)\}/g, '(($2)^(1/($1)))');
    s = s.replace(/\\sqrt\s*\{([^{}]*)\}/g, '\\sqrt($1)');
    s = s.replace(/\\sqrt\s*([a-z\d])/g, '\\sqrt($1)');
    s = s.replace(/([\^_])\{([^{}]*)\}/g, '$1($2)');
    if (s === before) s = s.replace(/\{([^{}]*)\}/g, '($1)'); // plain groups only once nothing else applies
    if (s === before) break;
  }
  if (/[{}]|\\\?|\\[a-zA-Z]+/.test(s.replace(/\\(sin|cos|tan|sec|csc|cot|asin|acos|atan|sinh|cosh|tanh|ln|log|exp|sqrt|abs)(?![a-z])/g, ''))) return null;
  return s;
}

function lex(s: string): Tok[] | null {
  const out: Tok[] = [];
  let i = 0;
  while (i < s.length) {
    const c = s[i];
    if (c === ' ') { i++; continue; }
    const num = s.slice(i).match(/^\d+(?:[.,]\d+)?/);
    if (num) { out.push({ k: 'num', v: num[0].replace(',', '.') }); i += num[0].length; continue; }
    const fn = s.slice(i).match(/^\\(sinh|cosh|tanh|asin|acos|atan|sin|cos|tan|sec|csc|cot|ln|log|exp|sqrt|abs)/);
    if (fn) { out.push({ k: 'fn', v: fn[1] }); i += fn[0].length; continue; }
    if (VARS.has(c)) { out.push({ k: 'id', v: c }); i++; continue; }
    if ('+-−*/^'.includes(c)) { out.push({ k: 'op', v: c === '−' ? '-' : c }); i++; continue; }
    if (c === '(' || c === ')') { out.push({ k: c, v: c }); i++; continue; }
    return null;
  }
  return out;
}

function parse(toks: Tok[]): Fn | null {
  let p = 0;
  const peek = () => toks[p];
  const startsAtom = (t?: Tok) => !!t && (t.k === 'num' || t.k === 'id' || t.k === 'fn' || t.k === '(');
  const expr = (): Fn => {
    let sign = 1;
    while (peek()?.k === 'op' && (peek().v === '-' || peek().v === '+')) { if (toks[p++].v === '-') sign = -sign; }
    let left = term();
    if (sign < 0) { const l = left; left = (e) => -l(e); }
    while (peek()?.k === 'op' && (peek().v === '+' || peek().v === '-')) {
      const op = toks[p++].v;
      const r = term();
      const l = left;
      left = op === '+' ? (e) => l(e) + r(e) : (e) => l(e) - r(e);
    }
    return left;
  };
  const term = (): Fn => {
    let left = power();
    for (;;) {
      const t = peek();
      if (t?.k === 'op' && (t.v === '*' || t.v === '/')) {
        p++;
        const r = power();
        const l = left;
        left = t.v === '*' ? (e) => l(e) * r(e) : (e) => l(e) / r(e);
      } else if (startsAtom(t)) {
        const r = power();
        const l = left;
        left = (e) => l(e) * r(e);
      } else return left;
    }
  };
  const power = (): Fn => {
    let base = unaryAtom();
    if (peek()?.k === 'op' && peek().v === '^') {
      p++;
      const ex = peek()?.k === 'op' && peek().v === '-' ? (p++, ((a) => (e: Record<string, number>) => -a(e))(atom())) : atom();
      const b = base;
      base = (e) => Math.pow(b(e), ex(e));
    }
    return base;
  };
  const unaryAtom = (): Fn => {
    if (peek()?.k === 'op' && peek().v === '-') { p++; const a = power(); return (e) => -a(e); }
    return atom();
  };
  const atom = (): Fn => {
    const t = toks[p++];
    if (!t) throw new Error('eof');
    if (t.k === 'num') { const v = parseFloat(t.v); return () => v; }
    if (t.k === 'id') {
      if (t.v === 'π') return () => Math.PI;
      if (t.v === 'e') return () => Math.E;
      const v = t.v;
      return (e) => e[v];
    }
    if (t.k === '(') { const inner = expr(); if (toks[p++]?.k !== ')') throw new Error(')'); return inner; }
    if (t.k === 'fn') {
      const f = FN[t.v];
      let pw: Fn | null = null;
      if (peek()?.k === 'op' && peek().v === '^') { p++; pw = atom(); } // sen^2 x
      let arg: Fn;
      if (peek()?.k === '(') arg = atom();
      else {
        // "sen 3x", "cos x": the argument is the following product of numbers/variables
        arg = power();
        while (peek() && (peek().k === 'num' || peek().k === 'id')) { const a = arg; const b = power(); arg = (e) => a(e) * b(e); }
      }
      return pw ? (e) => Math.pow(f(arg(e)), pw!(e)) : (e) => f(arg(e));
    }
    throw new Error('tok');
  };
  try {
    const f = expr();
    return p === toks.length ? f : null;
  } catch {
    return null;
  }
}

/** Compile an option to a function of the usual variables (null when it is not a plain expression). */
export function texFunction(tex: string): Fn | null {
  const s = prep(tex);
  if (s === null || !s.trim()) return null;
  const toks = lex(s);
  if (!toks || !toks.length) return null;
  return parse(toks);
}

const POINTS = [
  { x: 0.37, y: 1.21, t: 0.53, n: 2.3, u: 0.71, z: 1.7, C: 0.77 },
  { x: 1.13, y: 0.42, t: 1.37, n: 3.1, u: 0.29, z: 0.6, C: 0.77 },
  { x: 0.81, y: 2.07, t: 0.19, n: 4.7, u: 1.43, z: 2.2, C: 0.77 },
  // negative values tell |x| from x (points where a log is undefined are skipped)
  { x: -0.63, y: -1.31, t: -0.47, n: -1.9, u: -0.83, z: -1.1, C: 0.77 },
  { x: -1.71, y: 0.58, t: -1.23, n: 1.4, u: -0.37, z: 0.9, C: 0.77 },
];

/** "same": equal everywhere; "const": differ by a nonzero constant (two antiderivatives); null otherwise. */
export function compareOptions(a: string, b: string): 'same' | 'const' | null {
  const fa = texFunction(a);
  const fb = texFunction(b);
  if (!fa || !fb) return null;
  const d: number[] = [];
  let scale = 0;
  for (const pt of POINTS) {
    const va = fa(pt);
    const vb = fb(pt);
    if (!isFinite(va) || !isFinite(vb)) continue;
    d.push(va - vb);
    scale = Math.max(scale, Math.abs(va), Math.abs(vb));
  }
  if (d.length < 3 || scale === 0) return null;
  const tol = 1e-9 * scale;
  if (d.every((x) => Math.abs(x) <= tol)) return 'same';
  if (Math.abs(d[0]) > tol && d.every((x) => Math.abs(x - d[0]) <= tol)) return 'const';
  return null;
}

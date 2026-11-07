/**
 * Runtime TeX -> SVG conversion with MathJax (lite adaptor, no DOM needed).
 * Output is consumed by react-native-svg's SvgXml. Results are cached.
 */
import { mathjax } from 'mathjax-full/js/mathjax.js';
import { TeX } from 'mathjax-full/js/input/tex.js';
import { SVG } from 'mathjax-full/js/output/svg.js';
import { liteAdaptor } from 'mathjax-full/js/adaptors/liteAdaptor.js';
import { RegisterHTMLHandler } from 'mathjax-full/js/handlers/html.js';
import 'mathjax-full/js/input/tex/base/BaseConfiguration.js';
import 'mathjax-full/js/input/tex/ams/AmsConfiguration.js';
import 'mathjax-full/js/input/tex/newcommand/NewcommandConfiguration.js';
import 'mathjax-full/js/input/tex/noundefined/NoUndefinedConfiguration.js';
import 'mathjax-full/js/input/tex/boldsymbol/BoldsymbolConfiguration.js';
import 'mathjax-full/js/input/tex/cancel/CancelConfiguration.js';
import 'mathjax-full/js/input/tex/color/ColorConfiguration.js';
import 'mathjax-full/js/input/tex/configmacros/ConfigMacrosConfiguration.js';

export type TexSvg = {
  xml: string;
  /** size in ex units */
  wEx: number;
  hEx: number;
  /** vertical-align in ex (negative = below baseline) */
  vaEx: number;
  error?: boolean;
};

let doc: any = null;
let adaptor: any = null;

function init() {
  if (doc) return;
  adaptor = liteAdaptor();
  RegisterHTMLHandler(adaptor);
  doc = mathjax.document('', {
    InputJax: new TeX({
      packages: ['base', 'ams', 'newcommand', 'configmacros', 'noundefined', 'boldsymbol', 'cancel', 'color'],
      macros: {
        R: '\\mathbb{R}',
        N: '\\mathbb{N}',
        Z: '\\mathbb{Z}',
        Q: '\\mathbb{Q}',
        C: '\\mathbb{C}',
        vv: ['\\vec{#1}', 1],
        dd: '\\,\\mathrm{d}',
        sen: '\\operatorname{sen}',
        tg: '\\operatorname{tg}',
        cotg: '\\operatorname{cotg}',
        cossec: '\\operatorname{cossec}',
        arcsen: '\\operatorname{arcsen}',
        arctg: '\\operatorname{arctg}',
        proj: '\\operatorname{proj}',
      },
    }),
    OutputJax: new SVG({ fontCache: 'none' }),
  });
}

const cache = new Map<string, TexSvg>();

/**
 * Random generators often produce "x+-2", "x--4", "1x", "-1e^{t}", "\operatorname{sen}(1x)" or
 * "x^{1}", "(x+3)^{1}". Fold doubled signs ("+-" → "-", "--" → "+"; never right after ^ or _,
 * so "0^+" or "x_-" stay), then hide the ones: a coefficient 1 right before a variable/function
 * and a braced exponent 1 on a single-letter variable or a parenthesis (never on digits, so
 * "2^{1}" or "\int_0^{1}" stay). A negative number right after \cdot/\times gets parentheses
 * ("4\cdot-3" → "4\cdot(-3)"), unless it carries an exponent ("-2^2" ≠ "(-2)^2").
 */
export function tidyOnes(tex: string): string {
  return tex
    // "(1,5,\,2)" is ambiguous with the decimal comma: inside a pair/tuple/interval holding a decimal, separate with ";"
    .replace(/([([])([^()[\]]*)([)\]])/g, (m, o: string, inner: string, c: string) =>
      /\d,\d/.test(inner) && /,(?:\s*\\,|\s)/.test(inner) ? o + inner.replace(/,\s*\\,\s*|,\s+/g, ';\\ ') + c : m,
    )
    .replace(/(\\cdot|\\times)\s*[-−]\s*(\d+(?:(?:[.,]|\{,\})\d+)?)(?![\d.,{^])/g, '$1(-$2)')
    .replace(/(^|[(=$]|\\left\()\s*--(?=\s*[\w\\(])/g, '$1')
    .replace(/(?<![\^_])([+\-−])([+\-−])(?=\s*[\w\\(])/g, (_m, a: string, b: string) => ((a === '+') === (b === '+') ? '+' : '-'))
    .replace(/(^|[\s=(+\-−{&$]|\\,|\\cdot|\\left\()1\s*(?=[xytuzv](?![a-zA-Z])|\\operatorname|\\sqrt|\\ln\b|\\cos\b|\\sin\b|e\^)/g, '$1 ')
    .replace(/((?<![\\a-zA-Z_^])[a-zA-Z]|\))\^(?:\{1\}|1(?![\d.,{]))/g, '$1')
    // "(x+0)", "\frac{x+0}{…}": a zero term right before a closing bracket (never after a digit, so "0+0" stays)
    .replace(/(?<=[a-zA-Z)}])\s*[+\-−]\s*0(?![\d.,{])(?=\s*[)}])/g, '')
    // a factor for the root 0 printed as "(x-0)" → "(x)": "(x+3)(x)^2" reads better as "(x+3)x^2"
    .replace(/\)\(([a-z])\)/g, ')$1')
    .replace(/(^|[=+\-−\s]|\\cdot)\(([a-z])\)(?=[a-z\\^])/g, '$1$2');
}

export function texToSvg(tex: string, display = false): TexSvg {
  const key = (display ? 'D|' : 'I|') + tex;
  const hit = cache.get(key);
  if (hit) return hit;
  init();
  let out: TexSvg;
  try {
    // pt-BR decimal comma: "0,5" must not get the punctuation space TeX adds after commas.
    // (Coordinates/lists are written with ", " so they are not affected.)
    // Integer runs with 2+ commas (lists/tuples like -1,0,1 or (1,0,2)) are never decimals.
    const src = tidyOnes(tex)
      .replace(/-?\d+(?:,-?\d+){2,}/g, (run) => run.replace(/,/g, '\u0001'))
      .replace(/(\d),(?=\d)/g, '$1{,}')
      .replace(/\u0001/g, ',');
    const node = doc.convert(src, { display });
    let svg: string = adaptor.innerHTML(node);
    // MathJax wraps in <mjx-container> when display; innerHTML gives the <svg>
    const m = svg.match(/<svg[\s\S]*<\/svg>/);
    svg = m ? m[0] : svg;
    const w = parseFloat((svg.match(/width="([\d.]+)ex"/) || [])[1] || '1');
    const h = parseFloat((svg.match(/height="([\d.]+)ex"/) || [])[1] || '1');
    const va = parseFloat((svg.match(/vertical-align:\s*(-?[\d.]+)ex/) || [])[1] || '0');
    // errors (merror) and undefined macros (noundefined paints them red)
    const hasError = /data-mjx-error|"merror"|fill="red"|stroke="red"|mathcolor="red"/.test(svg);
    // Strip attributes react-native-svg does not need
    svg = svg
      .replace(/\sstyle="[^"]*"/g, '')
      .replace(/\srole="[^"]*"/g, '')
      .replace(/\sfocusable="[^"]*"/g, '')
      .replace(/\sdata-[a-z-]+="[^"]*"/g, '')
      .replace(/\saria-[a-z-]+="[^"]*"/g, '')
      .replace(/<title>[\s\S]*?<\/title>/g, '');
    out = { xml: svg, wEx: w, hEx: h, vaEx: va, error: hasError };
  } catch {
    out = { xml: '', wEx: 0, hEx: 0, vaEx: 0, error: true };
  }
  cache.set(key, out);
  return out;
}

/** Applies size and colour to the cached svg string. */
export function sizedSvg(t: TexSvg, exPx: number, color: string): { xml: string; w: number; h: number } {
  const w = Math.max(1, t.wEx * exPx);
  const h = Math.max(1, t.hEx * exPx);
  const xml = t.xml
    .replace(/width="[\d.]+ex"/, `width="${w.toFixed(2)}"`)
    .replace(/height="[\d.]+ex"/, `height="${h.toFixed(2)}"`)
    .replace(/currentColor/g, color);
  return { xml, w, h };
}

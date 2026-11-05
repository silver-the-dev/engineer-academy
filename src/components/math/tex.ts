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
      packages: ['base', 'ams', 'newcommand', 'noundefined', 'boldsymbol', 'cancel', 'color'],
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

export function texToSvg(tex: string, display = false): TexSvg {
  const key = (display ? 'D|' : 'I|') + tex;
  const hit = cache.get(key);
  if (hit) return hit;
  init();
  let out: TexSvg;
  try {
    // pt-BR decimal comma: "0,5" must not get the punctuation space TeX adds after commas.
    // (Coordinates/lists are written with ", " so they are not affected.)
    const src = tex.replace(/(\d),(?=\d)/g, '$1{,}');
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
  } catch (e) {
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

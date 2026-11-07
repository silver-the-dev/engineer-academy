import React from 'react';
import type { UnitDef } from '../../types';
import { gen, mcq, mcqS, num, tf, fill, match, order, inter, plot, rmcq, near, multi } from '../../helpers';
import { CircleW, FnCurve, Pt, RectW, Seg } from '../../../components/plot/Plot';
import { C } from '../../../theme';
import { fmt, par, pick, randInt, randNZ, polyTex, term } from '../../../lib/random';
import { fnLab } from '../../visuals';

const t = String.raw;

const transformLab = () =>
  fnLab({
    f: (x, p) => p.a * (x - p.h) ** 2 + p.k,
    params: [
      { key: 'a', label: 'a', min: -2, max: 2, step: 0.1, value: 1, color: C.p1 },
      { key: 'h', label: 'h', min: -4, max: 4, step: 0.5, value: 0, color: C.p2 },
      { key: 'k', label: 'k', min: -4, max: 4, step: 0.5, value: 0, color: C.p3 },
    ],
    view: { xMin: -6, xMax: 6, yMin: -5, yMax: 7 },
    ghost: (x) => x * x,
    info: (p) => t`$y=${fmt(p.a)}(x${p.h < 0 ? '+' : '-'}${fmt(Math.abs(p.h))})^2${p.k < 0 ? '-' : '+'}${fmt(Math.abs(p.k))}$ · tracejada: $y=x^2$`,
  });

const approachLab = () =>
  plot({
    view: { xMin: -1, xMax: 3, yMin: -0.5, yMax: 4 },
    params: [{ key: 'd', label: '\\delta', min: 0.001, max: 1, step: 0.001, value: 0.8, color: C.p5 }],
    render: ({ p }: any) => (
      <>
        <FnCurve f={(x) => (Math.abs(x - 1) < 1e-9 ? NaN : (x * x - 1) / (x - 1))} color={C.p2} />
        <CircleW cx={1} cy={2} r={0.06} color={C.p2} fill={C.bgDeep} fillOpacity={1} width={2.5} />
        <Pt x={1 - p.d} y={2 - p.d} color={C.p3} label="esq" dy={18} />
        <Pt x={1 + p.d} y={2 + p.d} color={C.p5} label="dir" />
        <Seg x1={-1} y1={2} x2={3} y2={2} color={C.gold} dash="5 5" width={1} />
      </>
    ),
    info: ({ p }: any) => t`$f(${fmt(1 - p.d, 3)})=${fmt(2 - p.d, 3)}$ · $f(${fmt(1 + p.d, 3)})=${fmt(2 + p.d, 3)}$ ⟹ $\lim_{x\to1}f(x)=2$`,
  });

const jumpLab = () =>
  plot({
    view: { xMin: -3, xMax: 3, yMin: -1, yMax: 4 },
    params: [{ key: 'L', label: 'c', min: 0, max: 3, step: 0.5, value: 2, color: C.p3 }],
    render: ({ p }: any) => (
      <>
        <FnCurve f={(x) => (x < 1 ? 1 + 0 * x : NaN)} to={1} color={C.p2} />
        <FnCurve f={(x) => (x >= 1 ? p.L : NaN)} from={1} color={C.p3} />
        <CircleW cx={1} cy={1} r={0.07} color={C.p2} fill={C.bgDeep} fillOpacity={1} />
        <Pt x={1} y={p.L} color={C.p3} r={5} />
      </>
    ),
    info: ({ p }: any) => (p.L === 1 ? t`$\lim_{x\to1^-}=1=\lim_{x\to1^+}$ ⟹ o limite **existe** (e a função é contínua)` : t`$\lim_{x\to1^-}f=1\ne\lim_{x\to1^+}f=${fmt(p.L)}$ ⟹ limite **não existe**`),
  });

const epsDeltaLab = () =>
  plot({
    view: { xMin: -0.5, xMax: 2.5, yMin: 0.5, yMax: 5.5 },
    params: [
      { key: 'eps', label: '\\varepsilon', min: 0.2, max: 1.6, step: 0.1, value: 0.6, color: C.gold },
      { key: 'd', label: '\\delta', min: 0.05, max: 1.0, step: 0.05, value: 0.6, color: C.p2 },
    ],
    render: ({ p }: any) => {
      const ok = 2 * p.d <= p.eps + 1e-6;
      const col = ok ? C.success : C.danger;
      return (
        <>
          <RectW x={-0.5} y={3 - p.eps} w={3} h={2 * p.eps} color={C.gold} opacity={0.12} stroke="none" />
          <Seg x1={-0.5} y1={3 - p.eps} x2={2.5} y2={3 - p.eps} color={C.gold} dash="5 4" width={1.5} />
          <Seg x1={-0.5} y1={3 + p.eps} x2={2.5} y2={3 + p.eps} color={C.gold} dash="5 4" width={1.5} />
          <RectW x={1 - p.d} y={0.5} w={2 * p.d} h={5} color={C.p2} opacity={0.1} stroke="none" />
          <Seg x1={1 - p.d} y1={0.5} x2={1 - p.d} y2={5.5} color={C.p2} dash="5 4" width={1.5} />
          <Seg x1={1 + p.d} y1={0.5} x2={1 + p.d} y2={5.5} color={C.p2} dash="5 4" width={1.5} />
          <RectW x={1 - p.d} y={3 - p.eps} w={2 * p.d} h={2 * p.eps} color={col} opacity={0.22} stroke={col} />
          <FnCurve f={(x) => 2 * x + 1} color={C.p1} width={2} opacity={0.45} />
          <FnCurve f={(x) => 2 * x + 1} from={1 - p.d} to={1 + p.d} color={col} width={4.5} />
          <CircleW cx={1} cy={3} r={0.05} color={C.gold} fill={C.bgDeep} fillOpacity={1} width={2.5} />
        </>
      );
    },
    info: ({ p }: any) =>
      2 * p.d <= p.eps + 1e-6
        ? t`$\varepsilon=${fmt(p.eps, 2)}$, $\delta=${fmt(p.d, 2)}$: $|f(x)-3|\le ${fmt(2 * p.d, 2)}\le\varepsilon$ — **dentro da faixa!**`
        : t`$\varepsilon=${fmt(p.eps, 2)}$, $\delta=${fmt(p.d, 2)}$: $|f(x)-3|$ chega a $${fmt(2 * p.d, 2)}>\varepsilon$ — **escapa da faixa!**`,
  });

const oscLab = () =>
  plot({
    view: { xMin: -0.6, xMax: 0.6, yMin: -1.4, yMax: 1.4 },
    params: [{ key: 'd', label: '\\delta', min: 0.05, max: 0.5, step: 0.05, value: 0.35, color: C.p2 }],
    render: ({ p }: any) => (
      <>
        <RectW x={-p.d} y={-1.4} w={2 * p.d} h={2.8} color={C.danger} opacity={0.14} stroke="none" />
        <Seg x1={-p.d} y1={-1.4} x2={-p.d} y2={1.4} color={C.p2} dash="5 4" width={1.5} />
        <Seg x1={p.d} y1={-1.4} x2={p.d} y2={1.4} color={C.p2} dash="5 4" width={1.5} />
        <FnCurve f={(x) => (Math.abs(x) < 0.008 ? NaN : Math.sin(1 / x))} samples={400} color={C.p5} width={2} />
      </>
    ),
    info: ({ p }: any) => t`Mesmo em $(-${fmt(p.d, 2)},\,${fmt(p.d, 2)})$, $\operatorname{sen}(1/x)$ atinge $-1$ e $+1$: nenhum $\delta$ prende o gráfico!`,
  });

const tviLab = () =>
  plot({
    view: { xMin: -0.6, xMax: 2.6, yMin: -1.8, yMax: 3.8 },
    params: [{ key: 'N', label: 'N', min: -1, max: 3, step: 0.1, value: 1.6, color: C.gold }],
    render: ({ p }: any) => {
      const f = (x: number) => x * x - 1;
      const c = Math.sqrt(Math.max(0, p.N + 1));
      return (
        <>
          <Seg x1={0} y1={-1} x2={2} y2={-1} color={C.textDim} dash="4 4" width={1} />
          <Seg x1={0} y1={3} x2={2} y2={3} color={C.textDim} dash="4 4" width={1} />
          <FnCurve f={f} color={C.p1} width={2} opacity={0.3} />
          <FnCurve f={f} from={0} to={2} color={C.p1} width={4} />
          <Pt x={0} y={-1} color={C.p2} r={5} label="f(a)" dx={-32} dy={4} />
          <Pt x={2} y={3} color={C.p2} r={5} label="f(b)" dx={8} dy={4} />
          <Seg x1={-0.6} y1={p.N} x2={2.6} y2={p.N} color={C.gold} width={2.5} dash="6 4" />
          <Seg x1={c} y1={0} x2={c} y2={p.N} color={C.p4} width={2} dash="4 4" />
          <Pt x={c} y={p.N} color={C.gold} r={6} />
          <Pt x={c} y={0} color={C.p4} r={5} label="c" dy={18} dx={-4} />
        </>
      );
    },
    info: ({ p }: any) => {
      const c = Math.sqrt(Math.max(0, p.N + 1));
      return t`$N=${fmt(p.N, 1)}\in[-1,\,3]$ ⟹ existe $c=${fmt(c, 3)}\in[0,\,2]$ com $f(c)=${fmt(p.N, 1)}$`;
    },
  });

const iv = (a: number | string, b: number | string, oa: boolean, ob: boolean) => `${oa ? '(' : '['}${a},\\,${b}${ob ? ')' : ']'}`;
const lin = (a: number, b: number) => polyTex([b, a]);
const xm = (r: number) => (r === 0 ? 'x' : r < 0 ? `x+${-r}` : `x-${r}`);
const lim = (a: string | number) => `\\lim_{x\\to ${a}}`;

export const funcoesCalc: UnitDef = {
  id: 'c-func',
  title: 'Funções (revisão para Cálculo)',
  subtitle: 'Domínio, composição, inversa e transformações',
  icon: '🧩',
  source: 'Cálculo I · Unidade 1 — O estudo das funções',
  guide: t`O objeto de estudo do Cálculo são as funções. Antes de derivar e integrar, é preciso dominar domínio, composição, inversa e como transformações mexem no gráfico.`,
  lessons: [
    {
      id: 'c-func-dom',
      title: 'Domínio e imagem',
      parts: [
        {
          card: {
            title: 'Onde a função existe',
            body: t`**Domínio**: os $x$ permitidos. As restrições clássicas:

• denominador $\ne0$: $f(x)=\frac{1}{x-2}$ ⟹ $x\ne2$
• raiz par de algo $\ge0$: $\sqrt{x+3}$ ⟹ $x\ge-3$
• logaritmo de algo $>0$: $\ln(5-x)$ ⟹ $x<5$`,
          },
          exercises: [
            tf(t`A função $f(x)=\frac{1}{x}$ tem domínio $\mathbb R$.`, false, t`$x=0$ não pertence ao domínio.`),
            mcqS(t`Qual o domínio de $f(x)=\sqrt{x-5}$?`, t`$[5,\,\infty)$`, [t`$(5,\,\infty)$`, t`$\mathbb R$`, t`$(-\infty,\,5]$`], t`$x-5\ge0\iff x\ge5$.`),
            gen((rng) => {
              const a = randNZ(rng, -7, 7);
              return rmcq(rng, t`Qual o domínio de $f(x)=\dfrac{4}{${xm(a)}}$?`, `$\\mathbb R-\\{${a}\\}$`, [`$\\mathbb R-\\{${-a}\\}$`, '$\\mathbb R$', `$(${a},\\,\\infty)$`], t`O denominador zera em $x=${a}$.`);
            }),
            gen((rng) => {
              const a = randInt(rng, -5, 8);
              return rmcq(rng, t`Qual o domínio de $f(x)=\sqrt{${a}-x}$?`, `$${iv('-\\infty', a, true, false)}$`, [`$${iv(a, '\\infty', false, true)}$`, `$${iv('-\\infty', a, true, true)}$`, `$${iv(-a, '\\infty', false, true)}$`], t`$${a}-x\ge0\iff x\le ${a}$.`);
            }),
            mcqS(t`Qual o domínio de $f(x)=\dfrac{3}{x^2-9}$?`, t`$\mathbb R-\{-3,\,3\}$`, [t`$\mathbb R-\{9\}$`, t`$(-3,\,3)$`, t`$\mathbb R-\{3\}$`], t`$x^2-9=0\iff x=\pm3$.`),
            mcqS(t`Qual o domínio de $f(x)=\ln(2x-6)$?`, t`$(3,\,\infty)$`, [t`$[3,\,\infty)$`, t`$(6,\,\infty)$`, t`$\mathbb R$`], t`$2x-6>0\iff x>3$.`),
            gen((rng) => {
              const a = randNZ(rng, -6, 6);
              return rmcq(rng, t`Qual o domínio de $f(x)=\ln(x${term(a, '')})$?`, `$${iv(-a, '\\infty', true, true)}$`, [`$${iv(-a, '\\infty', false, true)}$`, `$${iv(a, '\\infty', true, true)}$`, `$${iv('-\\infty', -a, true, true)}$`], t`$x${term(a, '')}>0\iff x>${-a}$ (estritamente: $\ln 0$ não existe).`);
            }),
            gen((rng) => {
              const k = randInt(rng, 2, 6);
              return rmcq(rng, t`Qual o domínio de $f(x)=\dfrac{1}{x^2+${k * k}}$?`, '$\\mathbb R$', [`$\\mathbb R-\\{-${k},\\,${k}\\}$`, `$\\mathbb R-\\{${k}\\}$`, `$(-${k},\\,${k})$`], t`$x^2+${k * k}\ge${k * k}>0$: o denominador nunca zera.`);
            }),
          ],
        },
        {
          card: {
            title: 'Juntando restrições',
            body: t`Com várias restrições ao mesmo tempo, o domínio é a **interseção** de todas.

Atenção: raiz **no denominador** exige o radicando **estritamente** positivo ($>0$), porque também não pode zerar.`,
            example: t`$f(x)=\dfrac{\sqrt{x}}{x-4}$: precisa $x\ge0$ e $x\ne4$ ⟹ $D=[0,\,4)\cup(4,\,\infty)$.`,
          },
          exercises: [
            mcqS(t`Qual o domínio de $f(x)=\dfrac{\sqrt{x}}{x-4}$?`, t`$[0,\,4)\cup(4,\,\infty)$`, [t`$[0,\,\infty)$`, t`$(4,\,\infty)$`, t`$\mathbb R-\{4\}$`], t`$x\ge0$ (raiz) e $x\ne4$ (denominador).`),
            mcqS(t`Qual o domínio de $f(x)=\dfrac{1}{\sqrt{x-2}}$?`, t`$(2,\,\infty)$`, [t`$[2,\,\infty)$`, t`$\mathbb R-\{2\}$`, t`$(-\infty,\,2)$`], t`A raiz está no denominador: $x-2>0$, estritamente.`),
            gen((rng) => {
              const a = randInt(rng, -5, 2);
              const b = a + randInt(rng, 2, 7);
              return rmcq(rng, t`Qual o domínio de $f(x)=\sqrt{${xm(a)}}+\sqrt{${b}-x}$?`, `$${iv(a, b, false, false)}$`, [`$${iv(a, b, true, true)}$`, `$${iv(a, '\\infty', false, true)}$`, `$${iv('-\\infty', b, true, false)}$`], t`$x\ge${a}$ **e** $x\le${b}$: $[${a},\,${b}]$.`);
            }),
            tf(t`O domínio de $f(x)=\dfrac{\sqrt{x-1}}{x-3}$ é $[1,\,\infty)$.`, false, t`Falta tirar o $3$, que zera o denominador: $[1,\,3)\cup(3,\,\infty)$.`),
            mcqS(t`Qual o domínio de $f(x)=\ln(x^2-4)$?`, t`$x<-2$ ou $x>2$`, [t`$-2<x<2$`, t`$x>2$`, t`$\mathbb R-\{-2,\,2\}$`], t`$x^2-4>0$ fora das raízes $\pm2$.`),
            gen((rng) => {
              const k = randInt(rng, 1, 5);
              return rmcq(rng, t`Qual o domínio de $f(x)=\sqrt{x^2-${k * k}}$?`, `$x\\le -${k}$ ou $x\\ge ${k}$`, [`$-${k}\\le x\\le ${k}$`, `$x\\ge ${k}$`, `$x<-${k}$ ou $x>${k}$`], t`$x^2\ge${k * k}$ fora do intervalo $(-${k},\,${k})$, incluindo $\pm${k}$.`);
            }),
            mcqS(t`Qual o domínio de $f(x)=\dfrac{\ln x}{x-1}$?`, t`$(0,\,1)\cup(1,\,\infty)$`, [t`$(0,\,\infty)$`, t`$[0,\,1)\cup(1,\,\infty)$`, t`$\mathbb R-\{1\}$`], t`$\ln x$ pede $x>0$, e o denominador pede $x\neq1$.`),
            num(t`Quantos números **inteiros** pertencem ao domínio de $f(x)=\sqrt{9-x^2}$?`, 7, t`$9-x^2\ge0\iff -3\le x\le 3$: inteiros $-3,\ldots,3$, são $7$.`),
          ],
        },
        {
          card: {
            title: 'Imagem',
            body: t`**Imagem**: os valores de $y$ que a função realmente atinge. Use o gráfico ou fatos conhecidos:

• $x^2\ge0$ · $\sqrt{x}\ge0$ · $e^x>0$
• $\operatorname{sen}x$ e $\cos x$ ficam em $[-1,\,1]$
• parábola: a imagem começa (ou termina) no $y$ do vértice`,
          },
          exercises: [
            mcqS(t`Qual a imagem de $f(x)=x^2+1$?`, t`$[1,\,\infty)$`, [t`$\mathbb R$`, t`$(1,\,\infty)$`, t`$[0,\,\infty)$`], t`$x^2\ge0\Rightarrow x^2+1\ge1$.`),
            gen((rng) => {
              const a = randInt(rng, -4, 4);
              const b = randInt(rng, 1, 5);
              const x = randInt(rng, -3, 3);
              return num(t`Se $f(x)=${polyTex([b, a, 1])}$, quanto vale $f(${x})$?`, x * x + a * x + b, t`$(${x})^2${term(a, `\\cdot(${x})`)}+${b}=${x * x + a * x + b}$.`);
            }),
            tf(t`A imagem de $f(x)=\sqrt{x}$ é $[0,\,\infty)$.`, true, t`A raiz nunca é negativa e atinge qualquer valor $\ge0$.`),
            mcqS(t`Qual a imagem de $f(x)=e^x$?`, t`$(0,\,\infty)$`, [t`$[0,\,\infty)$`, t`$\mathbb R$`, t`$[1,\,\infty)$`], t`A exponencial é sempre positiva, mas chega tão perto de $0$ quanto se queira.`),
            gen((rng) => {
              const a = randInt(rng, 1, 4);
              const d = randInt(rng, -3, 4);
              return rmcq(rng, t`Qual a imagem de $f(x)=${a === 1 ? '' : a}\operatorname{sen}x${term(d, '')}$?`, `$[${d - a},\\,${d + a}]$`, [`$[${-a},\\,${a}]$`, `$[${d - 1},\\,${d + 1}]$`, `$[${d},\\,${d + a}]$`, `$[${d - 2 * a},\\,${d + 2 * a}]$`, `$[${d - a},\\,${d + a + 1}]$`], t`$\operatorname{sen}x\in[-1,\,1]$; vezes $${a}$ e somando $${d}$: $[${d - a},\,${d + a}]$.`);
            }),
            gen((rng) => {
              const h = randInt(rng, -3, 3);
              const k = randInt(rng, -4, 6);
              return rmcq(rng, t`Qual a imagem de $f(x)=-(${xm(h)})^2${term(k, '')}$?`, `$(-\\infty,\\,${k}]$`, [`$[${k},\\,\\infty)$`, `$(-\\infty,\\,${h}]$`, '$\\mathbb R$'], t`Parábola para baixo com vértice em $y=${k}$: valores de $${k}$ para baixo.`);
            }),
            mcqS(t`Qual a imagem de $f(x)=\dfrac{1}{x}$?`, t`$\mathbb R-\{0\}$`, [t`$\mathbb R$`, t`$(0,\,\infty)$`, t`$\mathbb R-\{1\}$`], t`$\frac1x$ assume qualquer valor, exceto zero.`),
            mcqS(t`Qual a imagem de $f(x)=2+e^{-x}$?`, t`$(2,\,\infty)$`, [t`$[2,\,\infty)$`, t`$(0,\,\infty)$`, t`$\mathbb R$`], t`$e^{-x}>0$, então $f(x)>2$, chegando tão perto de $2$ quanto se queira.`),
          ],
        },
      ],
    },
    {
      id: 'c-func-comp',
      title: 'Composição e inversa',
      parts: [
        {
          card: {
            title: 'Função de função',
            body: t`$(f\circ g)(x)=f(g(x))$: primeiro aplica $g$, depois $f$.

Se $f(x)=x^2$ e $g(x)=x+1$:
• $f(g(x))=(x+1)^2$
• $g(f(x))=x^2+1$ — em geral $f\circ g\neq g\circ f$!`,
          },
          exercises: [
            tf(t`Sempre vale $f\circ g=g\circ f$.`, false, t`Com $f(x)=x^2$ e $g(x)=x+1$: $(x+1)^2\neq x^2+1$.`),
            mcqS(t`Com $f(x)=x^2$ e $g(x)=x+1$, quanto é $g(f(x))$?`, t`$x^2+1$`, [t`$(x+1)^2$`, t`$x^2+x$`, t`$2x+1$`], t`Primeiro $f$: $x^2$; depois soma $1$.`),
            gen((rng) => {
              const a = randInt(rng, 1, 4);
              const b = randInt(rng, -3, 3);
              const x = randInt(rng, -2, 3);
              return num(t`Sendo $f(x)=x^2$ e $g(x)=${lin(a, b)}$, calcule $f(g(${x}))$.`, (a * x + b) ** 2, t`$g(${x})=${a * x + b}$ e $f(${a * x + b})=${(a * x + b) ** 2}$.`);
            }),
            gen((rng) => {
              const a = randInt(rng, 1, 4);
              const b = randInt(rng, -3, 3);
              const x = randInt(rng, -2, 3);
              return num(t`Sendo $f(x)=x^2$ e $g(x)=${lin(a, b)}$, calcule $g(f(${x}))$.`, a * x * x + b, t`$f(${x})=${x * x}$ e $g(${x * x})=${a * x * x + b}$.`);
            }),
            mcqS(t`Se $f(x)=\sqrt{x}$ e $g(x)=x^2+9$, quanto é $(f\circ g)(x)$?`, t`$\sqrt{x^2+9}$`, [t`$x+9$`, t`$x+3$`, t`$(\sqrt x)^2+9$`], t`Coloque $g(x)$ dentro de $f$.`),
            gen((rng) => {
              const [a, b, c, d] = [randNZ(rng, -3, 3), randInt(rng, -4, 4), randNZ(rng, -3, 3), randInt(rng, -4, 4)];
              return rmcq(rng, t`Sendo $f(x)=${lin(a, b)}$ e $g(x)=${lin(c, d)}$, quanto é $f(g(x))$?`, `$${lin(a * c, a * d + b)}$`, [`$${lin(a * c, c * b + d)}$`, `$${lin(a + c, b + d)}$`, `$${lin(a * c, b * d)}$`, `$${lin(a * c, a * d + b + 1)}$`], t`$f(g(x))=${a}(${lin(c, d)})${term(b, '')}=${lin(a * c, a * d + b)}$.`);
            }),
            gen((rng) => {
              // b ≠ 0: with b = 0 three distractors collapse into the answer a²x
              const [a, b] = [randNZ(rng, -3, 4), randNZ(rng, -4, 4)];
              return rmcq(rng, t`Sendo $f(x)=${lin(a, b)}$, quanto é $f(f(x))$?`, `$${lin(a * a, a * b + b)}$`, [`$${lin(2 * a, 2 * b)}$`, `$${lin(a * a, b * b)}$`, `$${lin(a * a, b)}$`, `$${lin(a * a, a * b)}$`], t`$${a}(${lin(a, b)})${term(b, '')}=${lin(a * a, a * b + b)}$.`);
            }),
            num(t`Sendo $f(x)=2x+1$ e $f(g(x))=6x+7$, quanto vale $g(1)$?`, 6, t`$2g(x)+1=6x+7\Rightarrow g(x)=3x+3$, então $g(1)=6$.`),
          ],
        },
        {
          card: {
            title: 'De fora e de dentro',
            body: t`Decompor $h(x)=f(g(x))$ é identificar a função **de dentro** $g$ (calculada primeiro) e a **de fora** $f$.

$h(x)=(3x+1)^5$: dentro $g(x)=3x+1$, fora $f(u)=u^5$.`,
            tip: t`A **regra da cadeia** das derivadas é sobre funções compostas. Reconhecer "a de fora" e "a de dentro" é o segredo.`,
          },
          exercises: [
            mcq(t`Em $h(x)=(2x-1)^3$, qual é a função **de dentro**?`, ['$2x-1$', '$u^3$', '$2x$', '$x^3$'], 0, t`Primeiro calcula-se $2x-1$; depois eleva-se ao cubo.`),
            mcq(t`Em $h(x)=\sqrt{x^2+1}$, qual é a função **de fora**?`, ['$f(u)=\\sqrt{u}$', '$f(u)=u^2+1$', '$f(u)=u^2$', '$f(u)=u+1$'], 0, t`A última operação é tirar a raiz.`),
            gen((rng) => {
              const k = randInt(rng, 2, 9);
              const fn = pick(rng, ['\\operatorname{sen}', '\\cos', 'e^', '\\ln'] as const);
              const expr = fn === 'e^' ? `e^{${k}x}` : `${fn}(${k}x)`;
              return rmcq(rng, t`Em $h(x)=${expr}$, qual é a função de dentro?`, `$${k}x$`, [`$${k}$`, '$x$', `$${expr}$`], t`O que é calculado primeiro é $${k}x$.`);
            }),
            mcq(t`Como decompor $h(x)=e^{x^2}$?`, ['$f(u)=e^u$ e $g(x)=x^2$', '$f(u)=u^2$ e $g(x)=e^x$', '$f(u)=e^{2u}$ e $g(x)=x$', 'não é composta'], 0, t`Dentro: $x^2$. Fora: exponencial.`),
            tf(t`Em $h(x)=\ln(\cos x)$, a função de dentro é o $\ln$.`, false, t`Primeiro calcula-se $\cos x$; o $\ln$ é a de fora.`),
            match(t`Ligue cada função à sua parte **de dentro**:`, [
              [t`$(x^3+2)^4$`, t`$x^3+2$`],
              [t`$\cos(5x)$`, t`$5x$`],
              [t`$e^{-x}$`, t`$-x$`],
              [t`$\ln(x^2+1)$`, t`$x^2+1$`],
            ], t`A parte de dentro é o que se calcula primeiro, o "argumento" da última operação: a base da potência, o ângulo do cosseno, o expoente da exponencial, o que está dentro do $\ln$.`),
            mcq(t`Como decompor $h(x)=\dfrac{1}{(x+3)^2}$?`, ['$f(u)=\\frac{1}{u^2}$ e $g(x)=x+3$', '$f(u)=u+3$ e $g(x)=\\frac{1}{x^2}$', '$f(u)=\\frac1u$ e $g(x)=x^2+3$', '$f(u)=u^2$ e $g(x)=\\frac{1}{x+3}$'], 0, t`Dentro: $x+3$. Fora: $\frac{1}{u^2}$.`),
            mcq(t`$h(x)=\operatorname{sen}^2(3x)=[\operatorname{sen}(3x)]^2$ é uma composição tripla. Qual é a ordem de cálculo?`, ['$3x$, depois seno, depois elevar ao quadrado', 'seno, depois $3x$, depois quadrado', 'quadrado, depois seno, depois $3x$', '$3x$, depois quadrado, depois seno'], 0, t`De dentro para fora: $u=3x$, $v=\operatorname{sen}u$, $h=v^2$.`),
          ],
        },
        {
          card: {
            title: 'Inversa',
            body: t`$f^{-1}$ desfaz $f$: $f^{-1}(f(x))=x$. Para achar: troque $x$ e $y$ e isole $y$.

$y=2x+3 \to x=2y+3 \to y=\frac{x-3}{2}$

O gráfico de $f^{-1}$ é o reflexo do de $f$ na reta $y=x$. Só existe inversa se $f$ for **bijetora**.`,
          },
          exercises: [
            mcqS(t`Qual a inversa de $f(x)=3x-6$?`, t`$f^{-1}(x)=\frac{x+6}{3}$`, [t`$f^{-1}(x)=\frac{x-6}{3}$`, t`$f^{-1}(x)=3x+6$`, t`$f^{-1}(x)=\frac{1}{3x-6}$`], t`$x=3y-6\Rightarrow y=\frac{x+6}{3}$.`),
            tf(t`A inversa de $f(x)=e^x$ é $f^{-1}(x)=\ln x$.`, true, t`$\ln(e^x)=x$ e $e^{\ln x}=x$.`),
            match(t`Ligue cada função à sua inversa:`, [
              [t`$2x$`, t`$\frac{x}{2}$`],
              [t`$x+5$`, t`$x-5$`],
              [t`$x^3$`, t`$\sqrt[3]{x}$`],
              [t`$10^x$`, t`$\log x$`],
            ], t`A inversa desfaz a operação: dividir desfaz multiplicar, subtrair desfaz somar, a raiz cúbica desfaz o cubo e o $\log$ desfaz a potência de $10$.`),
            mcq(t`O gráfico de $f^{-1}$ é o de $f$ refletido…`, ['na reta $y=x$', 'no eixo $x$', 'no eixo $y$', 'na origem'], 0, t`Trocar $x$ com $y$ é refletir na diagonal $y=x$.`),
            gen((rng) => {
              const a = randNZ(rng, -4, 4);
              const b = randInt(rng, -6, 6);
              const x0 = randInt(rng, -4, 5);
              return num(t`Sendo $f(x)=${lin(a, b)}$, quanto vale $f^{-1}(${a * x0 + b})$?`, x0, t`$f^{-1}(${a * x0 + b})$ é o $x$ com $f(x)=${a * x0 + b}$: $${lin(a, b)}=${a * x0 + b}\Rightarrow x=${x0}$.`);
            }),
            tf(t`$f(x)=x^2$, definida em todo $\mathbb R$, tem inversa.`, false, t`$f(2)=f(-2)=4$: não é injetora. Restringindo a $x\ge0$, a inversa seria $\sqrt x$.`),
            gen((rng) => {
              const a = randInt(rng, 2, 5);
              const b = randNZ(rng, -6, 6);
              return rmcq(rng, t`Qual a inversa de $f(x)=\dfrac{x${term(b, '')}}{${a}}$?`, `$f^{-1}(x)=${lin(a, -b)}$`, [`$f^{-1}(x)=${lin(a, b)}$`, `$f^{-1}(x)=\\frac{x${term(-b, '')}}{${a}}$`, `$f^{-1}(x)=\\frac{${a}}{x${term(b, '')}}$`], t`$x=\frac{y${term(b, '')}}{${a}}\Rightarrow ${a}x=y${term(b, '')}\Rightarrow y=${lin(a, -b)}$.`);
            }),
            mcqS(t`Qual a inversa de $f(x)=\dfrac{2x+1}{x-3}$?`, t`$f^{-1}(x)=\dfrac{3x+1}{x-2}$`, [t`$f^{-1}(x)=\dfrac{x-3}{2x+1}$`, t`$f^{-1}(x)=\dfrac{3x-1}{x+2}$`, t`$f^{-1}(x)=\dfrac{2x-1}{x+3}$`], t`$x(y-3)=2y+1\Rightarrow xy-2y=3x+1\Rightarrow y=\frac{3x+1}{x-2}$.`),
          ],
        },
      ],
    },
    {
      id: 'c-func-transf',
      title: 'Transformações de gráficos',
      parts: [
        {
          card: {
            title: 'Deslocamentos',
            body: t`A partir de $y=f(x)$:
• $f(x-h)$: desloca **$h$ para a direita** (e $f(x+h)$, para a esquerda)
• $f(x)+k$: desloca **$k$ para cima**

Mexa em $h$ e $k$ partindo de $y=x^2$:`,
            visual: transformLab(),
          },
          exercises: [
            mcq(t`O gráfico de $y=(x-3)^2$ é o de $y=x^2$ deslocado…`, ['3 unidades para a direita', '3 unidades para a esquerda', '3 para cima', '3 para baixo'], 0, t`$x-3=0$ em $x=3$: o vértice vai para a direita.`),
            mcqS(t`Qual transformação leva $y=\operatorname{sen}x$ em $y=\operatorname{sen}x+2$?`, '2 unidades para cima', ['2 para a direita', 'amplitude 2', 'período 2'], t`Somar fora da função desloca na vertical.`),
            mcq(t`O gráfico de $y=f(x+4)$ é o de $y=f(x)$ deslocado…`, ['4 para a esquerda', '4 para a direita', '4 para cima', '4 para baixo'], 0, t`$x+4=x-(-4)$: $h=-4$, para a esquerda.`),
            inter(t`Posicione a parábola com vértice em $(2,\,-1)$, mantendo a abertura de $y=x^2$.`, 'plot', transformLab().props, (v: any) => v && near(v.p.a, 1, 0.01) && near(v.p.h, 2, 0.01) && near(v.p.k, -1, 0.01), t`$a=1$, $h=2$, $k=-1$`, t`Em $y=a(x-h)^2+k$ o vértice é $(h,\,k)$: $h=2$, $k=-1$, e a mesma abertura de $x^2$ pede $a=1$.`),
            gen((rng) => {
              const h = randNZ(rng, -4, 4);
              let k = randNZ(rng, -4, 4);
              if (k === h) k = -h; // (k, h) would repeat the answer
              return rmcq(rng, t`Qual o vértice de $y=(${xm(h)})^2${term(k, '')}$?`, `$(${h},\\,${k})$`, [`$(${-h},\\,${k})$`, `$(${h},\\,${-k})$`, `$(${k},\\,${h})$`], t`$(x-h)^2+k$ tem vértice $(h,\,k)=(${h},\,${k})$.`);
            }),
            gen((rng) => {
              const h = randNZ(rng, -4, 4);
              const k = randNZ(rng, -4, 4);
              return rmcq(rng, t`Deslocando $y=x^2$ ${Math.abs(h)} ${Math.abs(h) === 1 ? 'unidade' : 'unidades'} para a ${h > 0 ? 'direita' : 'esquerda'} e ${Math.abs(k)} para ${k > 0 ? 'cima' : 'baixo'}, obtemos:`, `$y=(${xm(h)})^2${term(k, '')}$`, [`$y=(${xm(-h)})^2${term(k, '')}$`, `$y=(${xm(h)})^2${term(-k, '')}$`, `$y=x^2${term(k - h, '')}$`], t`Direita/esquerda mexe **dentro** ($x-h$), cima/baixo mexe **fora** ($+k$).`);
            }),
            tf(t`O gráfico de $y=\sqrt{x-2}$ começa no ponto $(2,\,0)$.`, true, t`É $\sqrt x$ deslocada 2 para a direita.`),
            mcq(t`Qual é o "bico" (vértice) do gráfico de $y=|x+1|-3$?`, ['$(-1,\\,-3)$', '$(1,\\,-3)$', '$(-1,\\,3)$', '$(1,\\,3)$'], 0, t`$|x|$ deslocado 1 para a esquerda e 3 para baixo.`),
          ],
        },
        {
          card: {
            title: 'Esticar e refletir',
            body: t`• $a\,f(x)$: estica verticalmente ($|a|>1$) ou achata ($|a|<1$)
• $-f(x)$: reflete no **eixo $x$**
• $f(-x)$: reflete no **eixo $y$**`,
            visual: transformLab(),
          },
          exercises: [
            tf(t`O gráfico de $y=-f(x)$ é o reflexo de $y=f(x)$ no eixo $x$.`, true, t`Cada altura troca de sinal.`),
            mcq(t`Comparado com $y=x^2$, o gráfico de $y=3x^2$ fica…`, ['mais fechado (esticado na vertical)', 'mais aberto', 'deslocado 3 para cima', 'refletido'], 0, t`Cada altura fica 3 vezes maior.`),
            mcq(t`O gráfico de $y=f(-x)$ é o de $y=f(x)$…`, ['refletido no eixo $y$', 'refletido no eixo $x$', 'deslocado para a esquerda', 'igual'], 0, t`O valor que estava em $x$ passa a estar em $-x$.`),
            inter(t`Faça a parábola ficar "triste" (boca para baixo) com vértice em $(-1,\,3)$ e $|a|=1$.`, 'plot', transformLab().props, (v: any) => v && near(v.p.a, -1, 0.01) && near(v.p.h, -1, 0.01) && near(v.p.k, 3, 0.01), t`$a=-1$, $h=-1$, $k=3$`, t`Boca para baixo pede $a<0$ (com $|a|=1$, $a=-1$); o vértice $(h,\,k)=(-1,\,3)$ dá $y=-(x+1)^2+3$.`),
            mcq(t`Qual a amplitude de $y=0{,}5\operatorname{sen}x$?`, ['$0{,}5$', '$1$', '$2$', '$\\pi$'], 0, t`O fator $0{,}5$ achata a onda pela metade.`),
            gen((rng) => {
              const a = randInt(rng, 2, 4);
              const k = randInt(rng, -3, 5);
              return rmcq(rng, t`Qual a imagem de $y=-${a}x^2${term(k, '')}$?`, `$(-\\infty,\\,${k}]$`, [`$[${k},\\,\\infty)$`, `$(-\\infty,\\,${-a}]$`, `$(-\\infty,\\,${k * a}]$`], t`O $-${a}$ vira a parábola para baixo; o topo fica em $y=${k}$.`);
            }),
            tf(t`O gráfico de $y=e^{-x}$ é o reflexo de $y=e^x$ no eixo $y$.`, true, t`É $f(-x)$ com $f(x)=e^x$.`),
            mcqS(t`Quais transformações levam $y=x^2$ em $y=-(x-1)^2+4$?`, '1 para a direita, reflexo no eixo x, 4 para cima', ['1 para a esquerda, reflexo no eixo y, 4 para cima', 'reflexo no eixo x, 1 para cima, 4 para a direita', '1 para a direita, 4 para baixo'], t`$(x-1)$: direita; sinal de menos: reflexo; $+4$: sobe.`),
          ],
        },
        {
          card: {
            title: 'Simetria: funções pares e ímpares',
            body: t`• **Par**: $f(-x)=f(x)$ — simétrica em relação ao eixo $y$. Ex.: $x^2$, $\cos x$, $|x|$
• **Ímpar**: $f(-x)=-f(x)$ — simétrica em relação à origem. Ex.: $x^3$, $\operatorname{sen}x$, $\frac1x$

A maioria das funções não é nem par nem ímpar.`,
          },
          exercises: [
            mcq(t`$f(x)=x^2$ é…`, ['par', 'ímpar', 'nem par nem ímpar', 'par e ímpar'], 0, t`$(-x)^2=x^2$.`),
            mcq(t`$f(x)=\operatorname{sen}x$ é…`, ['ímpar', 'par', 'nem par nem ímpar', 'periódica e par'], 0, t`$\operatorname{sen}(-x)=-\operatorname{sen}x$.`),
            tf(t`$f(x)=x^3+1$ é ímpar.`, false, t`$f(-x)=-x^3+1$, que não é $-f(x)=-x^3-1$. Nem par nem ímpar.`),
            gen((rng) => {
              const a = randInt(rng, 1, 6);
              const b = randNZ(rng, -9, 9);
              return num(t`$f$ é **ímpar** e $f(${a})=${b}$. Quanto vale $f(-${a})$?`, -b, t`Ímpar: $f(-${a})=-f(${a})=${-b}$.`);
            }),
            gen((rng) => {
              const a = randInt(rng, 1, 6);
              const b = randNZ(rng, -9, 9);
              return num(t`$f$ é **par** e $f(${a})=${b}$. Quanto vale $f(-${a})$?`, b, t`Par: $f(-${a})=f(${a})=${b}$.`);
            }),
            multi(t`Quais funções são **pares**?`, ['$\\cos x$', '$x^4+1$', '$x^3$', '$|x|$', '$e^x$'], [0, 1, 3], t`$x^3$ é ímpar; $e^x$ não é nem par nem ímpar.`),
            mcq(t`O produto de duas funções **ímpares** é…`, ['par', 'ímpar', 'nem par nem ímpar', 'sempre zero'], 0, t`$f(-x)g(-x)=(-f(x))(-g(x))=f(x)g(x)$.`),
            num(t`$f$ é ímpar e está definida em $x=0$. Quanto vale $f(0)$?`, 0, t`Ímpar significa $f(-x)=-f(x)$. Com $x=0$ (e $-0=0$): $f(0)=-f(0)\Rightarrow 2f(0)=0\Rightarrow f(0)=0$.`),
          ],
        },
      ],
    },
  ],
};

export const limites: UnitDef = {
  id: 'c-lim',
  title: 'Limites',
  subtitle: 'Aproximação, laterais, infinito e continuidade',
  icon: '🎯',
  source: 'Cálculo I · Unidade 2 — Limites',
  guide: t`Limite responde: de que valor $f(x)$ se aproxima quando $x$ se aproxima de $a$? Não importa o que acontece **em** $a$, só **perto** dele. É a base da derivada e da integral.`,
  lessons: [
    {
      id: 'c-lim-int',
      title: 'Ideia intuitiva e limites laterais',
      parts: [
        {
          card: {
            title: 'Chegando perto',
            body: t`$f(x)=\frac{x^2-1}{x-1}$ **não existe** em $x=1$ (dá $\frac00$), mas veja os valores quando $x$ se aproxima de 1 pelos dois lados. Diminua $\delta$:`,
            visual: approachLab(),
            formula: t`\lim_{x\to1}\frac{x^2-1}{x-1}=2`,
          },
          exercises: [
            inter(t`Diminua $\delta$ até os dois pontos ficarem a menos de $0{,}01$ do valor limite.`, 'plot', approachLab().props, (v: any) => v && v.p.d < 0.01, t`$\delta<0{,}01$`, t`Quanto menor $\delta$, mais perto de 2 ficam as imagens: é isso que "limite igual a 2" significa.`),
            tf(t`Para que $\lim_{x\to a}f(x)$ exista, $f$ precisa estar definida em $x=a$.`, false, t`O limite só olha para valores **próximos** de $a$. Ex.: $\frac{x^2-1}{x-1}$ em $a=1$.`),
            gen((rng) => {
              const a = randNZ(rng, -4, 4);
              const b = randInt(rng, -6, 6);
              const x0 = randInt(rng, -3, 4);
              return num(t`Calcule $${lim(x0)}\,(${lin(a, b)})$.`, a * x0 + b, t`Função afim é contínua: substitua, $${a}\cdot(${x0})${term(b, '')}=${a * x0 + b}$.`);
            }),
            gen((rng) => {
              const a = randInt(rng, -3, 4);
              const c = randInt(rng, -5, 5);
              return num(t`Calcule $${lim(a)}\,(x^2${term(c, '')})$.`, a * a + c, t`Polinômio é contínuo: basta substituir, $(${a})^2${term(c, '')}=${a * a + c}$.`);
            }),
            mcq(t`Uma tabela mostra $f(1{,}9)=4{,}9$; $f(1{,}99)=4{,}99$; $f(2{,}01)=5{,}01$; $f(2{,}1)=5{,}1$. O valor provável de $\lim_{x\to2}f(x)$ é…`, ['$5$', '$4{,}9$', '$2$', 'não dá para saber nada'], 0, t`Dos dois lados, os valores se aproximam de $5$.`),
            mcq(t`O valor de $\lim_{x\to a}f(x)$ depende do valor de $f(a)$?`, ['Não: só dos valores perto de $a$', 'Sim, é sempre igual a $f(a)$', 'Sim, se $f(a)$ for positivo', 'Só se $a=0$'], 0, t`$f(a)$ pode nem existir ou ser diferente do limite.`),
            gen((rng) => {
              const k = randInt(rng, 2, 9);
              return num(t`Calcule $${lim(k * k)}\sqrt{x}$.`, k, t`$\sqrt x$ é contínua para $x>0$: $\sqrt{${k * k}}=${k}$.`);
            }),
            mcq(t`O que acontece com $\operatorname{sen}\left(\frac1x\right)$ quando $x\to0$?`, ['oscila entre $-1$ e $1$ sem parar: o limite não existe', 'tende a $0$', 'tende a $1$', 'tende ao infinito'], 0, t`$\frac1x$ cresce sem parar, e o seno fica dando voltas: não se aproxima de nenhum número.`),
          ],
        },
        {
          card: {
            title: 'Laterais',
            body: t`$\lim_{x\to a^-}$: pela **esquerda** · $\lim_{x\to a^+}$: pela **direita**.

O limite existe se, e somente se, os laterais existem e são **iguais**. Ajuste o valor $c$ do degrau:`,
            visual: jumpLab(),
          },
          exercises: [
            inter(t`Ajuste $c$ para que $\lim_{x\to1}f(x)$ exista.`, 'plot', jumpLab().props, (v: any) => v && near(v.p.L, 1, 0.01), t`$c=1$`, t`O limite existe quando os dois laterais coincidem: o pedaço da direita precisa chegar à mesma altura que o da esquerda, o que acontece com $c=1$.`),
            mcq(t`Se $\lim_{x\to2^-}f(x)=5$ e $\lim_{x\to2^+}f(x)=3$, então $\lim_{x\to2}f(x)$…`, ['não existe', 'vale 4', 'vale 5', 'vale 3'], 0, t`Laterais diferentes: o limite não existe.`),
            tf(t`Se os dois limites laterais em $a$ valem $L$, então $\lim_{x\to a}f(x)=L$.`, true, t`É exatamente a condição de existência.`),
            gen((rng) => {
              const L1 = randInt(rng, -4, 6);
              const same = rng() < 0.5;
              const L2 = same ? L1 : L1 + pick(rng, [-2, -1, 1, 3]);
              return tf(t`Se $\lim_{x\to3^-}f(x)=${L1}$ e $\lim_{x\to3^+}f(x)=${L2}$, então $\lim_{x\to3}f(x)$ existe.`, same, same ? t`Laterais iguais a $${L1}$: o limite existe e vale $${L1}$.` : t`$${L1}\neq${L2}$: o limite não existe.`);
            }),
            mcq(t`Quanto vale $\lim_{x\to0^+}\dfrac{|x|}{x}$?`, ['$1$', '$-1$', '$0$', 'não existe'], 0, t`Para $x>0$, $|x|=x$ e a fração vale $1$.`),
            num(t`Quanto vale $\lim_{x\to0^-}\dfrac{|x|}{x}$?`, -1, t`Para $x<0$, $|x|=-x$ e a fração vale $-1$.`),
            mcq(t`Então $\lim_{x\to0}\dfrac{|x|}{x}$…`, ['não existe', 'vale $0$', 'vale $1$', 'vale $-1$'], 0, t`Os laterais ($1$ e $-1$) são diferentes.`),
            mcq(t`Seja $\lfloor x\rfloor$ o maior inteiro menor ou igual a $x$. Sobre $\lim_{x\to2}\lfloor x\rfloor$:`, ['não existe (vale 1 pela esquerda e 2 pela direita)', 'vale 2', 'vale 1', 'vale 1,5'], 0, t`Logo antes de 2, $\lfloor x\rfloor=1$; logo depois, $=2$.`),
          ],
        },
        {
          card: {
            title: 'Funções definidas por partes',
            body: t`Numa função "por partes", nos pontos de **emenda** cada lateral usa a fórmula do seu lado.

$$f(x)=\begin{cases}x+1,&x<2\\ 3x-3,&x\ge2\end{cases}$$

$\lim_{x\to2^-}f=3$ e $\lim_{x\to2^+}f=3$: o limite existe e vale $3$.`,
          },
          exercises: [
            gen((rng) => {
              const c = randInt(rng, -2, 3);
              const a = randInt(rng, -3, 4);
              const b = randNZ(rng, -3, 3);
              return num(t`Para $f(x)=\begin{cases}x${term(a, '')},&x<${c}\\ ${b}x,&x\ge${c}\end{cases}$, calcule $\lim_{x\to${c}^-}f(x)$.`, c + a, t`Pela esquerda vale a fórmula $x${term(a, '')}$: $${c}${term(a, '')}=${c + a}$.`);
            }),
            gen((rng) => {
              const c = randInt(rng, -2, 3);
              const a = randInt(rng, -3, 4);
              const b = randNZ(rng, -3, 3);
              return num(t`Para $f(x)=\begin{cases}x${term(a, '')},&x<${c}\\ ${b}x,&x\ge${c}\end{cases}$, calcule $\lim_{x\to${c}^+}f(x)$.`, b * c, t`Pela direita vale $${b}x$: $${b}\cdot(${c})=${b * c}$.`);
            }),
            tf(t`Sempre vale $\lim_{x\to a}f(x)=f(a)$.`, false, t`Só quando $f$ é **contínua** em $a$.`),
            mcq(t`Para $f(x)=\begin{cases}1,&x<0\\ x^2,&x\ge0\end{cases}$, o limite em $x=0$…`, ['não existe', 'vale $0$', 'vale $1$', 'vale $\\frac12$'], 0, t`Pela esquerda $1$, pela direita $0$.`),
            num(t`Para $f(x)=\begin{cases}3x-1,&x\neq2\\ 10,&x=2\end{cases}$, quanto vale $\lim_{x\to2}f(x)$?`, 5, t`Perto de 2 (sem ser 2) vale $3x-1\to5$. O valor $f(2)=10$ não importa para o limite.`),
            gen((rng) => {
              const c = randInt(rng, 1, 4);
              return num(t`Para qual $k$ o limite de $f(x)=\begin{cases}x^2,&x<${c}\\ x+k,&x\ge${c}\end{cases}$ existe em $x=${c}$?`, c * c - c, t`Esquerda: $${c * c}$. Direita: $${c}+k$. Igualando: $k=${c * c - c}$.`);
            }),
            gen((rng) => {
              const a = randInt(rng, -2, 5);
              const val = a + 1;
              return num(t`Para qual $a$ o limite de $f(x)=\begin{cases}ax+1,&x<1\\ x^2${term(val - 1, '')},&x\ge1\end{cases}$ existe em $x=1$?`, a, t`Esquerda: $a+1$. Direita: $1${term(val - 1, '')}=${val}$. Então $a+1=${val}$, ou seja, $a=${a}$.`);
            }),
            mcq(t`Para $f(x)=\begin{cases}x^2,&x<1\\ 2x-1,&x\ge1\end{cases}$, o limite em $x=1$…`, ['existe e vale $1$', 'não existe', 'vale $2$', 'vale $0$'], 0, t`Esquerda: $1^2=1$. Direita: $2-1=1$. Iguais.`),
          ],
        },
      ],
    },
    {
      id: 'c-lim-calc',
      title: 'Calculando limites (0/0)',
      parts: [
        {
          card: {
            title: 'Propriedades e substituição',
            body: t`O limite da soma é a soma dos limites; idem produto e quociente (se o limite do denominador $\ne0$).

Para polinômios e funções contínuas: **substitua direto**. Só quando aparecer $\frac00$ (uma **indeterminação**) é que precisamos simplificar antes.`,
          },
          exercises: [
            gen((rng) => {
              const [a, b, c] = [randNZ(rng, -3, 3), randInt(rng, -5, 5), randInt(rng, -6, 6)];
              const x0 = randInt(rng, -3, 3);
              return num(t`Calcule $${lim(x0)}\,(${polyTex([c, b, a])})$.`, a * x0 * x0 + b * x0 + c, t`Substitua $x=${x0}$: $${a * x0 * x0 + b * x0 + c}$.`);
            }),
            tf(t`$\frac00$ significa que o limite é zero.`, false, t`$\frac00$ é uma **indeterminação**: o limite pode ser qualquer coisa; é preciso simplificar.`),
            mcq(t`Substituindo $x=3$ em $\dfrac{x^2-9}{x-3}$ obtemos…`, ['$\\frac00$, uma indeterminação', '$0$', '$6$', '$\\infty$'], 0, t`Em cima $9-9=0$, embaixo $3-3=0$.`),
            gen((rng) => {
              const x0 = randInt(rng, 1, 4);
              const q = randInt(rng, x0 + 1, x0 + 6);
              const m = q * (x0 + 1) - x0 * x0;
              return num(t`Calcule $${lim(x0)}\dfrac{x^2${term(m, '')}}{x+1}$.`, q, t`O denominador não zera em $x=${x0}$: substitua, $\frac{${x0 * x0}${term(m, '')}}{${x0 + 1}}=${q}$.`);
            }),
            gen((rng) => {
              const A = randInt(rng, -5, 6);
              const B = randInt(rng, -5, 6);
              const p = randInt(rng, 2, 4);
              return num(t`Sabendo que $${lim('a')}f(x)=${A}$ e $${lim('a')}g(x)=${B}$, calcule $${lim('a')}\,[${p}f(x)-g(x)]$.`, p * A - B, t`$${p}\cdot(${A})-(${B})=${p * A - B}$.`);
            }),
            mcq(t`Quanto vale $\lim_{x\to\pi}\cos x$?`, ['$-1$', '$1$', '$0$', '$\\pi$'], 0, t`O cosseno é contínuo: $\cos\pi=-1$.`),
            gen((rng) => {
              const k = randInt(rng, 2, 7);
              const b = randInt(rng, 0, 9);
              return num(t`Calcule $${lim(k * k - b)}\sqrt{x+${b}}$.`, k, t`$\sqrt{${k * k - b}+${b}}=\sqrt{${k * k}}=${k}$.`);
            }),
            gen((rng) => {
              const A = randInt(rng, 1, 5);
              const B = pick(rng, [1, 2, -1, 4]);
              return num(t`Sabendo que $${lim(2)}f(x)=${A}$ e $${lim(2)}g(x)=${B}$, calcule $${lim(2)}\dfrac{f(x)^2+g(x)}{g(x)}$.`, (A * A + B) / B, t`$\frac{${A}^2+(${B})}{${B}}=${fmt((A * A + B) / B)}$.`);
            }),
          ],
        },
        {
          card: {
            title: 'Fatorar o 0/0',
            body: t`Se um quociente de polinômios dá $\frac00$ em $x=a$, então $(x-a)$ é **fator** de cima e de baixo. Fatore, cancele e substitua de novo:

$$\frac{x^2-9}{x-3}=\frac{(x-3)(x+3)}{x-3}=x+3\ \to\ 6$$`,
          },
          exercises: [
            order(t`Ordene a estratégia para um limite que dá $\frac00$:`, ['Substituir e detectar a indeterminação 0/0', 'Fatorar ou racionalizar', 'Cancelar o fator comum', 'Substituir de novo'], t`Primeiro confirme que é $\frac00$; depois transforme a expressão (fatorar ou racionalizar) para revelar o fator que zera, cancele-o e só então substitua.`),
            gen((rng) => {
              const a = randNZ(rng, -6, 6);
              return num(t`Calcule $${lim(a)}\dfrac{x^2-${a * a}}{${xm(a)}}$.`, 2 * a, t`Fatore: $\frac{(${xm(a)})(${xm(-a)})}{${xm(a)}}=${xm(-a)}$ ⟹ $${a}+(${a})=${2 * a}$.`);
            }),
            tf(t`Se o limite dá $\frac00$, então o limite não existe.`, false, t`Pode existir (e geralmente existe): é só simplificar.`),
            gen((rng) => {
              const a = randNZ(rng, -6, 6);
              return num(t`Calcule $${lim(0)}\dfrac{x^2${term(-a, 'x')}}{x}$.`, -a, t`$\frac{x(x${term(-a, '')})}{x}=x${term(-a, '')}\to${-a}$.`);
            }),
            gen((rng) => {
              const r1 = randInt(rng, -3, 3);
              let r2 = randInt(rng, -4, 4);
              if (r2 === r1) r2 = r1 + 2;
              return num(t`Calcule $${lim(r1)}\dfrac{${polyTex([r1 * r2, -(r1 + r2), 1])}}{${xm(r1)}}$.`, r1 - r2, t`Numerador $=(${xm(r1)})(${xm(r2)})$; cancelando, sobra $${xm(r2)}$ em $x=${r1}$: $${r1 - r2}$.`);
            }),
            mcqS(t`$\lim_{x\to2}\dfrac{x^3-8}{x-2}$ vale:`, '$12$', ['$0$', '$4$', 'não existe'], t`$x^3-8=(x-2)(x^2+2x+4)$ ⟹ $4+4+4=12$.`),
            gen((rng) => {
              const r = randNZ(rng, -5, 5);
              return num(t`Calcule $${lim(r)}\dfrac{x^2-${r * r}}{x^2${term(-r, 'x')}}$.`, 2, t`$\frac{(${xm(r)})(${xm(-r)})}{x(${xm(r)})}=\frac{${xm(-r)}}{x}$, que em $x=${r}$ vale $\frac{${2 * r}}{${r}}=2$.`);
            }),
            num(t`Calcule $\lim_{x\to1}\dfrac{x^3-1}{x^2-1}$.`, 1.5, t`$\frac{(x-1)(x^2+x+1)}{(x-1)(x+1)}=\frac{x^2+x+1}{x+1}\to\frac32$.`),
          ],
        },
        {
          card: {
            title: 'Racionalizar o 0/0',
            body: t`Com raiz, multiplique em cima e embaixo pelo **conjugado**, usando $(\sqrt A-b)(\sqrt A+b)=A-b^2$:

$$\lim_{x\to0}\frac{\sqrt{x+4}-2}{x}=\lim_{x\to0}\frac{x}{x(\sqrt{x+4}+2)}=\frac14$$`,
          },
          exercises: [
            tf(t`O conjugado de $\sqrt{x}-3$ é $\sqrt{x}+3$.`, true, t`Troca-se o sinal do meio.`),
            mcq(t`Para calcular $\lim_{x\to0}\dfrac{\sqrt{x+1}-1}{x}$, multiplicamos em cima e embaixo por…`, ['$\\sqrt{x+1}+1$', '$\\sqrt{x+1}-1$', '$x$', '$\\sqrt{x}$'], 0, t`O conjugado elimina a raiz do numerador.`),
            num(t`Calcule $\lim_{x\to0}\dfrac{\sqrt{x+9}-3}{x}$.`, 1 / 6, t`Racionalize: $\frac{x}{x(\sqrt{x+9}+3)}\to\frac16$.`, { tol: 0.002 }),
            gen((rng) => {
              const k = randInt(rng, 2, 6);
              return num(t`Calcule $\lim_{x\to0}\dfrac{\sqrt{x+${k * k}}-${k}}{x}$. (fração ou decimal)`, 1 / (2 * k), t`$\frac{x}{x(\sqrt{x+${k * k}}+${k})}\to\frac{1}{${2 * k}}$.`, { tol: 0.002 });
            }),
            mcq(t`Quanto vale $\lim_{x\to4}\dfrac{x-4}{\sqrt{x}-2}$?`, ['$4$', '$0$', '$2$', '$\\frac14$'], 0, t`$x-4=(\sqrt x-2)(\sqrt x+2)$; cancelando, $\sqrt4+2=4$.`),
            gen((rng) => {
              const k = randInt(rng, 2, 6);
              return num(t`Calcule $${lim(k * k)}\dfrac{x-${k * k}}{\sqrt{x}-${k}}$.`, 2 * k, t`$x-${k * k}=(\sqrt x-${k})(\sqrt x+${k})$; sobra $\sqrt{${k * k}}+${k}=${2 * k}$.`);
            }),
            gen((rng) => {
              const k = randInt(rng, 2, 5);
              return num(t`Calcule $${lim(k * k)}\dfrac{\sqrt{x}-${k}}{x-${k * k}}$. (fração ou decimal)`, 1 / (2 * k), t`É o inverso do anterior: $\frac{1}{\sqrt x+${k}}\to\frac{1}{${2 * k}}$.`, { tol: 0.002 });
            }),
            num(t`Calcule $\lim_{x\to0}\dfrac{\sqrt{1+x}-\sqrt{1-x}}{x}$.`, 1, t`Multiplique por $\sqrt{1+x}+\sqrt{1-x}$: $\frac{2x}{x(\sqrt{1+x}+\sqrt{1-x})}\to\frac22=1$.`),
          ],
        },
      ],
    },
    {
      id: 'c-lim-inf',
      title: 'Limites infinitos e no infinito',
      parts: [
        {
          card: {
            title: 'Limites infinitos',
            body: t`Se o denominador vai a $0$ e o numerador não, a função **explode**: o limite é $+\infty$ ou $-\infty$, e há uma **assíntota vertical**.

O sinal depende do lado: em $\frac{1}{x}$, pela direita $+\infty$; pela esquerda $-\infty$.`,
          },
          exercises: [
            mcqS(t`$\lim_{x\to0^+}\dfrac{1}{x}$ vale:`, '$+\\infty$', ['$-\\infty$', '$0$', '$1$'], t`Dividir 1 por números positivos cada vez menores dá números enormes.`),
            mcq(t`$\lim_{x\to0^-}\dfrac{1}{x}$ vale:`, ['$-\\infty$', '$+\\infty$', '$0$', '$-1$'], 0, t`Denominador negativo e minúsculo: resultado muito negativo.`),
            mcq(t`$\lim_{x\to0}\dfrac{1}{x^2}$ vale:`, ['$+\\infty$', '$-\\infty$', 'não existe', '$0$'], 0, t`$x^2>0$ dos dois lados: os dois laterais dão $+\infty$.`),
            mcqS(t`Qual a assíntota vertical de $f(x)=\dfrac{5}{x+4}$?`, '$x=-4$', ['$x=4$', '$y=0$', '$x=5$'], t`O denominador zera em $x=-4$ e o numerador não.`),
            gen((rng) => {
              const c = randNZ(rng, -6, 6);
              const a = randNZ(rng, -5, 5);
              return num(t`Em que valor de $x$ fica a assíntota vertical de $f(x)=\dfrac{${a}}{${xm(c)}}$?`, c, t`$${xm(c)}=0\iff x=${c}$.`);
            }),
            mcq(t`$\lim_{x\to3^+}\dfrac{1}{x-3}$ vale:`, ['$+\\infty$', '$-\\infty$', '$0$', '$3$'], 0, t`Para $x$ logo acima de 3, $x-3$ é positivo e minúsculo.`),
            tf(t`$x=2$ é assíntota vertical de $f(x)=\dfrac{x-2}{x^2-4}$.`, false, t`$\frac{x-2}{(x-2)(x+2)}=\frac{1}{x+2}$: em $x=2$ há só um "buraco" (limite $\frac14$). A assíntota é $x=-2$.`),
            gen((rng) => {
              const c = randInt(rng, 1, 5);
              return mcq(t`Quanto vale $\lim_{x\to${c}^-}\dfrac{x+1}{x-${c}}$?`, ['$-\\infty$', '$+\\infty$', `$${c + 1}$`, '$0$'], 0, t`Numerador $\to${c + 1}>0$; denominador negativo e minúsculo (pela esquerda): $-\infty$.`);
            }),
          ],
        },
        {
          card: {
            title: 'Limites no infinito',
            body: t`Com $x\to\pm\infty$, em frações de polinômios **mandam os termos de maior grau**:

• graus iguais: razão dos coeficientes líderes
• grau de baixo maior: $0$
• grau de cima maior: $\pm\infty$

Se $\lim_{x\to\pm\infty}f(x)=L$, há **assíntota horizontal** $y=L$.`,
            visual: plot({
              view: { xMin: -6, xMax: 6, yMin: -6, yMax: 8 },
              render: () => (
                <>
                  <Seg x1={1} y1={-6} x2={1} y2={8} color={C.danger} dash="6 5" width={1.5} />
                  <Seg x1={-6} y1={2} x2={6} y2={2} color={C.gold} dash="6 5" width={1.5} />
                  <FnCurve f={(x) => (2 * x + 1) / (x - 1)} color={C.p2} />
                </>
              ),
              caption: 'y = (2x+1)/(x−1): vertical x = 1, horizontal y = 2',
            }),
            example: t`$\lim_{x\to\infty}\frac{3x^2+x}{5x^2-2}=\frac35$ e $\lim_{x\to\infty}\frac{x}{x^2+1}=0$.`,
          },
          exercises: [
            gen((rng) => {
              const a = randInt(rng, 1, 9);
              const b = randInt(rng, 1, 9);
              return num(t`Calcule $\lim_{x\to\infty}\dfrac{${a}x^2+3x}{${b}x^2-1}$. (fração ou decimal)`, a / b, t`Graus iguais: razão dos coeficientes líderes, $\frac{${a}}{${b}}$.`, { tol: 0.005 });
            }),
            mcqS(t`$\lim_{x\to\infty}\dfrac{x+1}{x^3}$ vale:`, '$0$', ['$1$', '$\\infty$', '$\\frac13$'], t`Grau do denominador maior ⟹ tende a 0.`),
            mcq(t`$\lim_{x\to\infty}(x^2-100x)$ vale:`, ['$+\\infty$', '$-\\infty$', '$0$', '$-100$'], 0, t`$x^2$ domina $100x$ para $x$ grande.`),
            mcq(t`$\lim_{x\to-\infty}x^3$ vale:`, ['$-\\infty$', '$+\\infty$', '$0$', 'não existe'], 0, t`Cubo de número muito negativo é muito negativo.`),
            gen((rng) => {
              const [a, c] = [randNZ(rng, -6, 6), randNZ(rng, -4, 4)];
              const [b, d] = [randInt(rng, -5, 5), randInt(rng, -5, 5)];
              return num(t`Qual é a assíntota horizontal ($y=L$) de $f(x)=\dfrac{${lin(a, b)}}{${lin(c, d)}}$? Dê o valor de $L$.`, a / c, t`$L=\frac{${a}}{${c}}=${fmt(a / c, 3)}$ (razão dos coeficientes de $x$).`, { tol: 0.005 });
            }),
            gen((rng) => {
              const a = randInt(rng, 2, 6);
              const deg = pick(rng, [2, 3] as const);
              return mcq(t`Quanto vale $\lim_{x\to\infty}\dfrac{${a}x^${deg === 3 ? 3 : 2}+1}{x^${deg === 3 ? 2 : 3}+5}$?`, deg === 3 ? ['$+\\infty$', '$0$', `$${a}$`, '$1$'] : ['$0$', '$+\\infty$', `$${a}$`, '$1$'], 0, deg === 3 ? t`Grau de cima maior: vai ao infinito.` : t`Grau de baixo maior: vai a zero.`);
            }),
            tf(t`$\lim_{x\to\infty}\left(1+\frac1x\right)^x=e$`, true, t`É um dos limites fundamentais: define o número $e\approx2{,}718$.`),
            num(t`Calcule $\lim_{x\to\infty}\left(\sqrt{x^2+4x}-x\right)$.`, 2, t`Multiplique pelo conjugado: $\frac{4x}{\sqrt{x^2+4x}+x}=\frac{4}{\sqrt{1+4/x}+1}\to\frac42=2$.`),
          ],
        },
        {
          card: {
            title: 'Quem cresce mais rápido',
            body: t`Para $x\to\infty$ existe uma "hierarquia" de crescimento:

$$\ln x\ \ll\ x^p\ \ll\ a^x\ (a>1)$$

Numa fração, quem cresce mais rápido **domina**: $\frac{x^{10}}{e^x}\to0$ e $\frac{e^x}{x^{10}}\to\infty$.`,
          },
          exercises: [
            mcq(t`$\lim_{x\to\infty}\dfrac{e^x}{x^5}$ vale:`, ['$+\\infty$', '$0$', '$1$', '$5$'], 0, t`A exponencial vence qualquer potência.`),
            mcq(t`$\lim_{x\to\infty}\dfrac{\ln x}{x}$ vale:`, ['$0$', '$+\\infty$', '$1$', '$e$'], 0, t`O log cresce mais devagar que qualquer potência de $x$.`),
            tf(t`Para $x$ grande, $x^{100}$ cresce mais rápido que $2^x$.`, false, t`No começo $x^{100}$ parece maior, mas $2^x$ acaba passando (e muito).`),
            mcq(t`$\lim_{x\to\infty}e^{-x}$ vale:`, ['$0$', '$1$', '$-\\infty$', '$+\\infty$'], 0, t`$e^{-x}=\frac{1}{e^x}\to0$.`),
            gen((rng) => {
              const a = randInt(rng, 2, 9);
              const p = randInt(rng, 2, 6);
              return mcq(t`Quanto vale $\lim_{x\to\infty}\dfrac{${a}x^{${p}}+1}{e^x}$?`, ['$0$', '$+\\infty$', `$${a}$`, '$1$'], 0, t`A exponencial no denominador domina.`);
            }),
            order(t`Ordene do que cresce **mais devagar** ao **mais rápido** (para $x\to\infty$):`, [t`$\ln x$`, t`$\sqrt{x}$`, t`$x^2$`, t`$2^x$`], t`Hierarquia no infinito: logaritmo $\ll$ potências (quanto maior o expoente, mais rápido) $\ll$ exponenciais.`),
            mcq(t`Quanto vale $\lim_{x\to\infty}\left(1+\frac1x\right)^x$?`, ['$e\\approx2{,}718$', '$1$', '$+\\infty$', '$0$'], 0, t`"$1^\infty$" é indeterminação; este limite define o $e$.`),
            num(t`Calcule $\lim_{x\to\infty}\left(1+\frac{2}{x}\right)^x$. (3 casas)`, Math.E ** 2, t`Com $u=\frac x2$: $\left[\left(1+\frac1u\right)^u\right]^2\to e^2\approx7{,}389$.`, { tol: 0.01 }),
          ],
        },
      ],
    },
    {
      id: 'c-lim-cont',
      title: 'Continuidade e limites fundamentais',
      parts: [
        {
          card: {
            title: 'Sem tirar o lápis do papel',
            body: t`$f$ é **contínua** em $a$ se:
1. $f(a)$ existe
2. $\lim_{x\to a}f(x)$ existe
3. $\lim_{x\to a}f(x)=f(a)$

Polinômios, exponenciais, seno e cosseno são contínuos em todo $\mathbb R$. Quando só o item 3 falha (ou $f(a)$ não existe, mas o limite sim), a descontinuidade é **removível**.`,
          },
          exercises: [
            tf(t`Toda função polinomial é contínua em todos os reais.`, true, t`Polinômios não têm saltos nem buracos.`),
            mcq(t`Onde $f(x)=\dfrac{1}{x-2}$ é descontínua?`, ['em $x=2$', 'em $x=0$', 'em $x=-2$', 'em lugar nenhum'], 0, t`$f(2)$ não existe.`),
            multi(t`Quais funções são contínuas em **todo** $\mathbb R$?`, ['$x^3$', '$\\operatorname{sen}x$', '$\\frac1x$', '$e^x$', '$\\operatorname{tg}x$'], [0, 1, 3], t`$\frac1x$ falha em $0$; $\operatorname{tg}x$ falha em $\frac\pi2+k\pi$.`),
            mcq(t`$f(x)=\begin{cases}x^2,&x\ne1\\ 5,&x=1\end{cases}$ é contínua em $x=1$?`, ['Não: o limite é 1, mas f(1) = 5', 'Sim', 'Não: o limite não existe', 'Sim, pois f(1) existe'], 0, t`O limite existe ($1$) mas é diferente de $f(1)$.`),
            mcq(t`A descontinuidade de $\dfrac{x^2-1}{x-1}$ em $x=1$ é do tipo…`, ['removível (um buraco)', 'salto', 'infinita (assíntota)', 'oscilante'], 0, t`O limite existe ($2$); basta definir $f(1)=2$ para "tapar o buraco".`),
            num(t`Para que valor de $k$ a função $f(x)=\begin{cases}2x+1,&x<2\\ k,&x\ge2\end{cases}$ é contínua?`, 5, t`$\lim_{x\to2^-}(2x+1)=5$, então $k=5$.`),
            gen((rng) => {
              const c = randInt(rng, 1, 3);
              const m = randInt(rng, 1, 4);
              const b = randInt(rng, -3, 5);
              return num(t`Para qual $k$ a função $f(x)=\begin{cases}x^2+k,&x\le${c}\\ ${m}x${term(b, '')},&x>${c}\end{cases}$ é contínua?`, m * c + b - c * c, t`Em $x=${c}$: $${c * c}+k=${m * c + b}\Rightarrow k=${m * c + b - c * c}$.`);
            }),
            num(t`$f(x)=\dfrac{x^2-4}{x-2}$ não está definida em $x=2$. Que valor $f(2)$ tornaria $f$ contínua?`, 4, t`$\frac{(x-2)(x+2)}{x-2}=x+2\to4$.`),
          ],
        },
        {
          card: {
            title: 'Teorema do Valor Intermediário',
            body: t`Se $f$ é **contínua** em $[a,\,b]$, ela assume todos os valores entre $f(a)$ e $f(b)$.

Em especial: se $f(a)$ e $f(b)$ têm **sinais opostos**, existe $c\in(a,\,b)$ com $f(c)=0$.

É a ideia por trás do **método da bisseção** (Cálculo Numérico).`,
          },
          exercises: [
            tf(t`Se $f$ é contínua, $f(1)=-2$ e $f(3)=5$, então $f$ tem uma raiz entre $1$ e $3$.`, true, t`Sinais opostos nas pontas de um intervalo onde $f$ é contínua.`),
            mcq(t`Em qual intervalo $f(x)=x^3+x-1$ certamente tem uma raiz?`, ['$[0,\\,1]$', '$[1,\\,2]$', '$[-2,\\,-1]$', '$[2,\\,3]$'], 0, t`$f(0)=-1<0$ e $f(1)=1>0$.`),
            gen((rng) => {
              const r = randInt(rng, -3, 3);
              const c = pick(rng, [1, 2, 3]);
              const f = (x: number) => (x - r) * (x * x + c);
              return rmcq(rng, t`$f(x)=(${xm(r)})(x^2+${c})$ é contínua. Em qual intervalo há certeza de uma raiz?`, `$[${r - 1},\\,${r + 1}]$`, [`$[${r + 1},\\,${r + 2}]$`, `$[${r - 3},\\,${r - 2}]$`, `$[${r + 2},\\,${r + 4}]$`], t`$f(${r - 1})=${f(r - 1)}$ e $f(${r + 1})=${f(r + 1)}$ têm sinais opostos.`);
            }),
            tf(t`Se $f(a)$ e $f(b)$ têm o **mesmo** sinal, então $f$ não tem raiz em $[a,\,b]$.`, false, t`Pode ter duas raízes (ou mais). Ex.: $x^2-1$ em $[-2,\,2]$: $f(\pm2)=3>0$, mas há raízes em $\pm1$.`),
            mcq(t`Por que o TVI **não** garante raiz de $f(x)=\frac1x$ em $[-1,\,1]$, apesar de $f(-1)<0<f(1)$?`, ['porque $f$ não é contínua em $[-1,\\,1]$', 'porque o intervalo é simétrico', 'porque $f$ é ímpar', 'o TVI garante, sim'], 0, t`$f$ nem está definida em $0$.`),
            gen((rng) => {
              const p = randInt(rng, -5, 0);
              const q = randInt(rng, 2, 8);
              const v = randInt(rng, p + 1, q - 1);
              return tf(t`$f$ é contínua em $[0,\,4]$, com $f(0)=${p}$ e $f(4)=${q}$. Existe $c$ com $f(c)=${v}$.`, true, t`$${v}$ está entre $${p}$ e $${q}$: o TVI garante.`);
            }),
            mcq(t`Bisseção: $f(1)<0$, $f(2)>0$ e $f(1{,}5)>0$. Onde está uma raiz?`, ['em $[1,\\,1{,}5]$', 'em $[1{,}5,\\,2]$', 'em $[2,\\,3]$', 'não dá para saber'], 0, t`A troca de sinal acontece entre $1$ e $1{,}5$.`),
            num(t`Quantas raízes reais $f(x)=x^3-3x+1$ tem em $[-2,\,2]$?`, 3, t`$f(-2)=-1$, $f(-1)=3$, $f(0)=1$, $f(1)=-1$, $f(2)=3$: três trocas de sinal, e um polinômio de grau 3 tem no máximo 3 raízes.`),
          ],
        },
        {
          card: {
            title: 'Os limites fundamentais',
            body: t`$$\lim_{x\to0}\frac{\operatorname{sen}x}{x}=1\qquad\lim_{x\to0}\frac{e^x-1}{x}=1\qquad \lim_{x\to\infty}\left(1+\tfrac1x\right)^x=e$$`,
            visual: plot({
              view: { xMin: -8, xMax: 8, yMin: -0.4, yMax: 1.3 },
              render: () => (
                <>
                  <FnCurve f={(x) => (Math.abs(x) < 1e-6 ? NaN : Math.sin(x) / x)} color={C.p5} />
                  <CircleW cx={0} cy={1} r={0.12} color={C.p5} fill={C.bgDeep} fillOpacity={1} width={2} />
                </>
              ),
              caption: 'sen(x)/x se aproxima de 1 em x → 0',
            }),
            tip: t`Truque: ajuste para o formato do limite fundamental. $\frac{\operatorname{sen}(kx)}{x}=k\cdot\frac{\operatorname{sen}(kx)}{kx}\to k$.`,
          },
          exercises: [
            mcq(t`Quanto vale $\lim_{x\to0}\dfrac{x}{\operatorname{sen}x}$?`, ['$1$', '$0$', '$\\infty$', 'não existe'], 0, t`É o inverso do limite fundamental: $\frac11=1$.`),
            num(t`Calcule $\lim_{x\to0}\dfrac{\operatorname{sen}(3x)}{x}$.`, 3, t`$\frac{\operatorname{sen}3x}{x}=3\cdot\frac{\operatorname{sen}3x}{3x}\to3\cdot1$.`),
            gen((rng) => {
              const k = randInt(rng, 2, 9);
              return num(t`Calcule $\lim_{x\to0}\dfrac{\operatorname{sen}(${k}x)}{x}$.`, k, t`$${k}\cdot\frac{\operatorname{sen}(${k}x)}{${k}x}\to${k}$.`);
            }),
            tf(t`$\lim_{x\to\infty}\dfrac{\operatorname{sen}x}{x}=1$`, false, t`Cuidado com para onde $x$ vai! Com $x\to\infty$, o seno fica limitado e o $x$ cresce: o limite é $0$.`),
            gen((rng) => {
              const k = randInt(rng, 2, 6);
              return num(t`Calcule $\lim_{x\to0}\dfrac{e^{${k}x}-1}{x}$.`, k, t`$${k}\cdot\frac{e^{${k}x}-1}{${k}x}\to${k}$.`);
            }),
            num(t`Calcule $\lim_{x\to0}\dfrac{\operatorname{sen}(5x)}{\operatorname{sen}(2x)}$.`, 2.5, t`$\frac{5}{2}\cdot\frac{\operatorname{sen}5x/5x}{\operatorname{sen}2x/2x}\to\frac52$.`),
            gen((rng) => {
              const k = randInt(rng, 2, 6);
              return num(t`Calcule $\lim_{x\to0}\dfrac{\operatorname{tg}(${k}x)}{x}$.`, k, t`$\frac{\operatorname{tg}(${k}x)}{x}=\frac{\operatorname{sen}(${k}x)}{x}\cdot\frac{1}{\cos(${k}x)}\to${k}\cdot1$.`);
            }),
            num(t`Calcule $\lim_{x\to0}\dfrac{1-\cos x}{x^2}$.`, 0.5, t`Multiplique por $1+\cos x$: $\frac{\operatorname{sen}^2x}{x^2(1+\cos x)}\to1\cdot\frac12$.`),
          ],
        },
      ],
    },
    {
      id: 'c-lim-eps',
      title: 'Definição formal e TVI',
      parts: [
        {
          card: {
            title: 'O jogo do ε e do δ',
            body: t`Dizer que $\lim_{x\to a}f(x)=L$ é vencer um jogo de **desafio e resposta**:

1. Alguém desafia com uma tolerância vertical $\varepsilon>0$ (a faixa $L-\varepsilon < y < L+\varepsilon$).
2. Você responde com um raio horizontal $\delta>0$ ao redor de $a$ tal que, se $0<|x-a|<\delta$ ($x$ perto de $a$, mas $x\ne a$), então $|f(x)-L|<\varepsilon$.

Veja em $f(x)=2x+1$ perto de $a=1$ ($L=3$):`,
            formula: t`\forall\varepsilon>0,\,\exists\delta>0:\;0<|x-a|<\delta \Rightarrow |f(x)-L|<\varepsilon`,
            visual: epsDeltaLab(),
            tip: t`Se um $\delta$ funciona para um certo $\varepsilon$, qualquer valor menor $0<\delta'<\delta$ também funciona!`,
          },
          exercises: [
            fill(
              t`Complete os papéis na definição formal de $\lim_{x\to a}f(x)=L$:`,
              t`A tolerância no eixo $y$ (em torno de $L$) é ___ e o raio no eixo $x$ (em torno de $a$) é ___.`,
              ['$\\varepsilon$', '$\\delta$'],
              ['$L$', '$a$'],
              t`$\varepsilon$ controla o erro na saída $f(x)$ e $\delta$ controla a proximidade na entrada $x$.`,
            ),
            tf(
              t`Na condição $0<|x-a|<\delta$, a desigualdade "$0<$" serve exatamente para excluir o ponto $x=a$.`,
              true,
              t`$|x-a|>0\iff x\ne a$: o limite analisa a vizinhança de $a$, nunca o valor em $x=a$.`,
            ),
            inter(
              t`Para $f(x)=2x+1$ em $a=1$ ($L=3$), mantenha $\varepsilon=0{,}6$ e ajuste $\delta$ para que o gráfico fique inteiramente dentro do retângulo (verde).`,
              'plot',
              epsDeltaLab().props,
              (v: any) => v && near(v.p.eps, 0.6, 0.01) && v.p.d > 0 && 2 * v.p.d <= v.p.eps + 1e-6,
              t`$\delta\le 0{,}3$ (com $\varepsilon=0{,}6$)`,
              t`Como $|f(x)-3|=2|x-1|$, para ficar abaixo de $\varepsilon=0{,}6$ basta $\delta\le\frac{0{,}6}{2}=0{,}3$.`,
            ),
            mcqS(
              t`A condição $|f(x)-5|<0{,}1$ equivale a qual intervalo para $f(x)$?`,
              t`$(4{,}9;\,5{,}1)$`,
              [t`$(-0{,}1;\,0{,}1)$`, t`$[5;\,5{,}1]$`, t`$(4{,}5;\,5{,}5)$`, t`$(0{,}1;\,5)$`],
              t`$|f(x)-L|<\varepsilon\iff L-\varepsilon<f(x)<L+\varepsilon$, logo $5-0{,}1<f(x)<5+0{,}1$.`,
            ),
            gen((rng) => {
              const a = randInt(rng, 2, 7);
              const k = randInt(rng, 1, 4);
              const lo = fmt(a - k / 10);
              const hi = fmt(a + k / 10);
              const dStr = fmt(k / 10);
              return rmcq(
                rng,
                t`A condição $0<|x-${a}|<${dStr}$ representa qual conjunto de valores de $x$?`,
                t`$(${lo};\,${hi})-\{${a}\}$`,
                [t`$(${lo};\,${hi})$`, t`$[${lo};\,${hi}]-\{${a}\}$`, t`$(0;\,${dStr})$`, t`$(-${dStr};\,${dStr})-\{0\}$`],
                t`$|x-${a}|<${dStr}$ define o intervalo aberto $(${lo};\,${hi})$, e $0<|x-${a}|$ retira o centro $x=${a}$.`,
              );
            }),
            tf(
              t`Se $\delta=0{,}04$ satisfaz a definição de limite para um certo $\varepsilon>0$, então $\delta=0{,}01$ também satisfaz para esse mesmo $\varepsilon$.`,
              true,
              t`Todo $x$ com $0<|x-a|<0{,}01$ também cumpre $0<|x-a|<0{,}04$, logo $|f(x)-L|<\varepsilon$ continua valendo.`,
            ),
            match(
              t`Ligue cada parte da definição $\varepsilon$–$\delta$ ao seu significado geométrico:`,
              [
                [t`$\varepsilon>0$`, t`Raio da faixa horizontal em torno de $L$`],
                [t`$\delta>0$`, t`Raio da faixa vertical em torno de $a$`],
                [t`$0<|x-a|<\delta$`, t`$x$ está perto de $a$, mas $x\ne a$`],
                [t`$|f(x)-L|<\varepsilon$`, t`$f(x)$ cai dentro da tolerância em torno de $L$`],
              ],
              t`A definição traduz "proximidade no gráfico" em duas faixas: uma de entrada ($\delta$) e outra de saída ($\varepsilon$).`,
            ),
            gen((rng) => {
              const a = randInt(rng, 2, 5);
              const d1 = randInt(rng, 1, 3) / 10;
              const d2 = randInt(rng, 4, 7) / 10;
              const xMin = a - d1;
              const xMax = a + d2;
              return num(
                t`Para garantir $|f(x)-L|<\varepsilon$ perto de $a=${a}$, descobrimos que basta $x\in(${fmt(xMin)};\,${fmt(xMax)})$, com $x\ne ${a}$. Qual é o maior $\delta>0$ simétrico ($0<|x-${a}|<\delta$) que podemos escolher?`,
                d1,
                t`As distâncias até as bordas são $${fmt(d1)}$ à esquerda e $${fmt(d2)}$ à direita; para caber dos dois lados, tomamos $\delta=\min(${fmt(d1)};\,${fmt(d2)})=${fmt(d1)}$.`,
              );
            }),
          ],
        },
        {
          card: [
            {
              title: 'Encontrando δ na prática',
              body: t`• **Função afim** $f(x)=mx+b$ ($m\ne 0$) em $x=a$, com $L=ma+b$:
$$|f(x)-L|=|m(x-a)|=|m|\cdot|x-a|$$
Para ficar menor que $\varepsilon$, basta tomar $\delta=\dfrac{\varepsilon}{|m|}$.

• **Quadrática** $f(x)=x^2$ em $x=a$: fatoramos $|x^2-a^2|=|x-a|\cdot|x+a|$. Impondo primeiro $\delta\le 1$, temos $|x+a|<2|a|+1$, e escolhemos $\delta=\min\!\left(1,\,\dfrac{\varepsilon}{2|a|+1}\right)$.`,
              example: t`Provar $\lim_{x\to 2}(3x-1)=5$: dado $\varepsilon>0$, tome $\delta=\frac{\varepsilon}{3}$. Se $0<|x-2|<\delta$, então $|(3x-1)-5|=3|x-2|<3\delta=\varepsilon$.`,
            },
            {
              title: 'Quando nenhum δ funciona',
              body: t`Por que $\lim_{x\to 0}\operatorname{sen}\!\left(\frac{1}{x}\right)$ **não existe**?

Perto de $0$, $\frac{1}{x}$ passa por infinitos múltiplos de $\frac{\pi}{2}$. Em **qualquer** vizinhança $(-\delta,\,\delta)$, a função atinge tanto $+1$ quanto $-1$: para $\varepsilon=\frac{1}{2}$, nenhuma faixa horizontal de raio $\frac{1}{2}$ contém o gráfico.`,
              visual: oscLab(),
            },
          ],
          exercises: [
            mcqS(
              t`Para provar que $\lim_{x\to a}(mx+b)=ma+b$ com $m\ne 0$, qual escolha de $\delta$ em função de $\varepsilon$ sempre funciona?`,
              t`$\delta=\dfrac{\varepsilon}{|m|}$`,
              [t`$\delta=|m|\,\varepsilon$`, t`$\delta=\dfrac{\varepsilon}{|b|}$`, t`$\delta=\varepsilon-|m|$`, t`$\delta=\dfrac{|m|}{\varepsilon}$`],
              t`$|(mx+b)-(ma+b)|=|m|\cdot|x-a|<\varepsilon\iff |x-a|<\dfrac{\varepsilon}{|m|}$.`,
            ),
            gen((rng) => {
              const m = pick(rng, [-5, -4, -2, 2, 4, 5] as const);
              const b = randInt(rng, -6, 6);
              const a = randInt(rng, -3, 4);
              const L = m * a + b;
              const k = randInt(rng, 1, 4);
              const eps = (Math.abs(m) * k) / 100;
              return num(
                t`Na definição de $\lim_{x\to ${a}}(${lin(m, b)})=${L}$, qual é o maior $\delta$ que garante $|f(x)${L === 0 ? '' : '-' + par(L)}|<${fmt(eps)}$?`,
                k / 100,
                t`$|(${lin(m, b)})${L === 0 ? '' : '-' + par(L)}|=${Math.abs(m)}|${xm(a)}|<${fmt(eps)}\iff |${xm(a)}|<\frac{${fmt(eps)}}{${Math.abs(m)}}=${fmt(k / 100)}$.`,
              );
            }),
            order(
              t`Ordene os passos da demonstração formal de que $\lim_{x\to 3}(4x-5)=7$:`,
              [
                t`Seja $\varepsilon>0$ dado arbitrariamente.`,
                t`Escolhemos $\delta=\dfrac{\varepsilon}{4}>0$.`,
                t`Suponha que $0<|x-3|<\delta$.`,
                t`Então $|(4x-5)-7|=|4x-12|=4|x-3|<4\delta=\varepsilon$.`,
              ],
              t`Toda prova $\varepsilon$–$\delta$ segue o roteiro: receber $\varepsilon>0$, exibir $\delta>0$, assumir $0<|x-a|<\delta$ e deduzir $|f(x)-L|<\varepsilon$.`,
            ),
            gen((rng) => {
              const k = randInt(rng, 1, 6);
              const d = k / 10;
              const eps = (k * k) / 100;
              return num(
                t`Para $\lim_{x\to 0}x^2=0$, qual é o maior $\delta>0$ tal que $0<|x|<\delta\Rightarrow |x^2-0|<${fmt(eps)}$?`,
                d,
                t`$|x^2|<${fmt(eps)}\iff |x|<\sqrt{${fmt(eps)}}=${fmt(d)}$.`,
              );
            }),
            order(
              t`Ordene os passos para encontrar $\delta$ na prova de que $\lim_{x\to 2}x^2=4$:`,
              [
                t`Fatorar o erro: $|x^2-4|=|x-2|\cdot|x+2|$.`,
                t`Impor primeiro $\delta\le 1$, o que garante $1<x<3$ e portanto $|x+2|<5$.`,
                t`Estimar: $|x^2-4|=|x-2|\cdot|x+2|<5|x-2|$.`,
                t`Escolher $\delta=\min\!\left(1,\,\dfrac{\varepsilon}{5}\right)$ para ter $5|x-2|<\varepsilon$.`,
              ],
              t`Em funções não lineares, limitamos primeiro $\delta\le 1$ para dominar o fator $|x+a|$ por uma constante.`,
            ),
            gen((rng) => {
              const a = randInt(rng, 1, 5);
              const M = 2 * a + 1;
              return rmcq(
                rng,
                t`Ao provar $\lim_{x\to ${a}}x^2=${a * a}$, se impusermos $|x-${a}|<1$, qual cota superior vale para $|x+${a}|$ e qual $\delta$ escolhemos?`,
                t`$|x+${a}|<${M}$ e $\delta=\min\!\left(1,\,\dfrac{\varepsilon}{${M}}\right)$`,
                [
                  t`$|x+${a}|<${2 * a}$ e $\delta=\dfrac{\varepsilon}{${2 * a}}$`,
                  t`$|x+${a}|<${a + 1}$ e $\delta=\min\!\left(1,\,\dfrac{\varepsilon}{${a + 1}}\right)$`,
                  t`$|x+${a}|<1$ e $\delta=\varepsilon$`,
                  t`$|x+${a}|<${a * a}$ e $\delta=\dfrac{\varepsilon}{${a * a}}$`,
                ],
                t`$|x-${a}|<1\Rightarrow ${a - 1}<x<${a + 1}\Rightarrow ${2 * a - 1}<x+${a}<${M}$. Logo $|x^2-${a * a}|<${M}|x-${a}|$, bastando $\delta=\min(1,\,\varepsilon/${M})$.`,
              );
            }),
            mcqS(
              t`Pela definição $\varepsilon$–$\delta$, por que $\lim_{x\to 0}\operatorname{sen}\!\left(\frac{1}{x}\right)$ não existe?`,
              t`Para $\varepsilon=\frac{1}{2}$, em qualquer intervalo $(-\delta,\,\delta)$ a função assume tanto $1$ quanto $-1$, escapando de $(L-\varepsilon,\,L+\varepsilon)$`,
              [
                t`Porque $\operatorname{sen}(1/x)$ tende a $+\infty$ quando $x\to 0$`,
                t`Porque a função não está definida em $x=0$`,
                t`Porque $\delta$ precisaria ser igual a $\pi$`,
                t`Porque o limite pela direita é $1$ e pela esquerda é $-1$`,
              ],
              t`Um intervalo $(L-1/2,\,L+1/2)$ tem comprimento $1$, mas em qualquer vizinhança de $0$ o seno varia de $-1$ a $1$ (distância $2$).`,
            ),
            tf(
              t`Diferente de $\operatorname{sen}(1/x)$, o limite $\lim_{x\to 0}x\operatorname{sen}\!\left(\frac{1}{x}\right)$ existe e vale $0$ (basta tomar $\delta=\varepsilon$).`,
              true,
              t`Como $|\operatorname{sen}(1/x)|\le 1$, temos $|x\operatorname{sen}(1/x)-0|\le |x|<\delta=\varepsilon$.`,
            ),
          ],
        },
        {
          card: [
            {
              title: 'TVI geral e bisseção',
              body: t`Se $f$ é **contínua** em $[a,\,b]$ e $N$ está entre $f(a)$ e $f(b)$, existe $c\in(a,\,b)$ tal que $f(c)=N$.

• **Raízes ($N=0$)**: se $f(a)$ e $f(b)$ têm sinais opostos, existe raiz em $(a,\,b)$.
• **Bisseção**: cortando o intervalo ao meio $n$ vezes e mantendo a metade com troca de sinal, o tamanho do intervalo cai para $\dfrac{b-a}{2^n}$.

Mova a reta $y=N$ em $f(x)=x^2-1$ no intervalo $[0,\,2]$:`,
              visual: tviLab(),
            },
            {
              title: 'Teorema de Weierstrass',
              body: t`Toda função **contínua** num intervalo **fechado e limitado** $[a,\,b]$ atinge um **máximo absoluto** e um **mínimo absoluto** em $[a,\,b]$.

Se o intervalo não for fechado (como $(0,\,1]$) ou se houver descontinuidade, os extremos podem não existir!`,
              example: t`$f(x)=\frac{1}{x}$ em $(0,\,1]$ é contínua, mas não tem máximo porque explode quando $x\to 0^+$.`,
              tip: t`Juntando Weierstrass e o TVI: a imagem de $[a,\,b]$ por uma função contínua é sempre um intervalo fechado $[m,\,M]$.`,
            },
          ],
          exercises: [
            inter(
              t`No gráfico de $f(x)=x^2-1$ em $[0,\,2]$, mova a reta horizontal $y=N$ até $N=0$ para localizar a raiz $c\in(0,\,2)$.`,
              'plot',
              tviLab().props,
              (v: any) => v && near(v.p.N, 0, 0.05),
              t`$N=0$ (dando $c=1$)`,
              t`Para $N=0\in[-1,\,3]$, a reta $y=0$ corta a curva em $c=1\in(0,\,2)$.`,
            ),
            gen((rng) => {
              const c = randInt(rng, 1, 3);
              const k = randInt(rng, -4, 5);
              const N = c * c + k;
              return num(
                t`Seja $f(x)=x^2${term(k, '')}$ em $[0,\,4]$ (onde $f(0)=${k}$ e $f(4)=${16 + k}$). Qual é o valor de $c\in(0,\,4)$ garantido pelo TVI tal que $f(c)=${N}$?`,
                c,
                t`Queremos $c^2${term(k, '')}=${N}\Rightarrow c^2=${c * c}$. Como $c\in(0,\,4)$, temos $c=${c}$.`,
              );
            }),
            mcqS(
              t`Para provar pelo TVI que a equação $\cos x = x$ tem solução em $\left[0,\,\frac{\pi}{2}\right]$, qual função auxiliar $f(x)$ analisamos?`,
              t`$f(x)=\cos x - x$, pois $f(0)=1>0$ e $f(\pi/2)=-\pi/2<0$`,
              [
                t`$f(x)=\frac{\cos x}{x}$, pois $f(0)=0$`,
                t`$f(x)=\cos x + x$, pois $f(0)>0$ e $f(\pi/2)>0$`,
                t`$f(x)=x\cos x$, pois se anula nos dois extremos`,
                t`Não é possível usar o TVI em equações com $\cos x$`,
              ],
              t`Transformamos $g(x)=h(x)$ em $f(x)=g(x)-h(x)=0$. Como $f$ é contínua e troca de sinal entre $0$ e $\pi/2$, existe $c$ com $\cos c = c$.`,
            ),
            gen((rng) => {
              const a = randInt(rng, 0, 3);
              const len = pick(rng, [1, 2, 4] as const);
              const b = a + len;
              const n = randInt(rng, 2, 4);
              const ans = len / Math.pow(2, n);
              return num(
                t`Aplicando o método da bisseção ao intervalo inicial $[${a},\,${b}]$ por $n=${n}$ iterações, qual passa a ser o comprimento do subintervalo que contém a raiz?`,
                ans,
                t`Cada passo divide o tamanho por $2$: $\dfrac{${b}-${a}}{2^{${n}}}=\dfrac{${len}}{${Math.pow(2, n)}}=${fmt(ans)}$.`,
              );
            }),
            fill(
              t`Complete as hipóteses do Teorema de Weierstrass (Valor Extremo):`,
              t`Toda função ___ num intervalo ___ e limitado $[a,\,b]$ atinge valor máximo e valor mínimo absolutos.`,
              ['contínua', 'fechado'],
              ['derivável', 'aberto', 'ilimitado'],
              t`Continuidade evita explosões internas e o intervalo fechado $[a,\,b]$ inclui as bordas, garantindo que máximo e mínimo sejam atingidos.`,
            ),
            multi(
              t`Em quais casos o Teorema de Weierstrass garante que $f$ atinge máximo e mínimo absolutos no intervalo dado?`,
              [
                t`$f(x)=e^x\cos x$ em $[0,\,\pi]$`,
                t`$f(x)=x^3-3x$ em $[-2,\,2]$`,
                t`$f(x)=\dfrac{1}{x}$ em $(0,\,1]$`,
                t`$f(x)=\operatorname{tg}x$ em $[0,\,\pi]$`,
                t`$f(x)=\sqrt{x+1}$ em $[0,\,8]$`,
              ],
              [0, 1, 4],
              t`Nos itens 1, 2 e 5 a função é contínua e o intervalo é fechado e limitado. Em $(0,\,1]$ falta fechar o $0$; $\operatorname{tg}x$ é descontínua em $\frac{\pi}{2}\in[0,\,\pi]$.`,
            ),
            match(
              t`Ligue cada contraexemplo à hipótese de TVI ou Weierstrass que foi violada:`,
              [
                [t`$f(x)=x$ em $(0,\,1)$ não tem máximo nem mínimo`, t`O intervalo não é fechado`],
                [t`$f(x)=\frac{1}{x}$ em $[-1,\,1]$ não tem raiz mesmo com $f(-1)<0<f(1)$`, t`Descontinuidade no interior do intervalo`],
                [t`$f(x)=e^{-x}$ em $[0,\,\infty)$ não atinge valor mínimo`, t`O intervalo não é limitado`],
                [t`$f(x)=x^2+1$ em $[-1,\,2]$ não tem raiz em $(-1,\,2)$`, t`$0$ não está entre $f(-1)$ e $f(2)$`],
              ],
              t`Os teoremas de existência exigem função contínua em intervalo fechado e limitado $[a,\,b]$ (e, para raízes no TVI, troca de sinal).`,
            ),
            tf(
              t`Se $f:[0,\,1]\to[0,\,1]$ é contínua, então existe pelo menos um "ponto fixo" $c\in[0,\,1]$ tal que $f(c)=c$.`,
              true,
              t`Aplique o TVI a $g(x)=f(x)-x$: como $0\le f(x)\le 1$, temos $g(0)=f(0)\ge 0$ e $g(1)=f(1)-1\le 0$, logo $g(c)=0$ para algum $c\in[0,\,1]$.`,
            ),
          ],
        },
      ],
    },
  ],
};

import React from 'react';
import type { UnitDef } from '../../types';
import { gen, mcqS, num, tf, fill, match, order, inter, plot, rmcq, near, table } from '../../helpers';
import { AreaUnder, FnCurve, InfLine, Label, Pt, RectW, Seg } from '../../../components/plot/Plot';
import { C } from '../../../theme';
import { fmt, pick, randInt, randNZ, polyTex, term } from '../../../lib/random';
import { parabolaLab } from '../../visuals';

const t = String.raw;

/** Interval helper with thin space after comma so tex.ts does not turn it into decimal comma. */
const iv = (a: number | string, b: number | string, oa: boolean, ob: boolean) => `${oa ? '(' : '['}${a},\\,${b}${ob ? ')' : ']'}`;
/** Factor (x - r) in TeX. */
const xm = (r: number) => (r === 0 ? 'x' : r < 0 ? `x+${-r}` : `x-${r}`);

/* ---------------- Local Interactive Visuals ---------------- */

/** Geometric square of side (a + b) partitioned into a^2, ab, ab, b^2 */
const notableSquareLab = () =>
  plot(
    {
      view: { xMin: -0.4, xMax: 6.4, yMin: -0.4, yMax: 6.4 },
      equalAspect: true,
      grid: false,
      tickLabels: false,
      params: [
        { key: 'a', label: 'a', min: 1, max: 4, step: 0.5, value: 3, color: C.p3 },
        { key: 'b', label: 'b', min: 0.5, max: 2, step: 0.5, value: 1.5, color: C.p5 },
      ],
      render: ({ p }: any) => (
        <>
          <RectW x={0} y={0} w={p.a} h={p.a} color={C.p3} opacity={0.45} />
          <RectW x={p.a} y={0} w={p.b} h={p.a} color={C.p2} opacity={0.35} />
          <RectW x={0} y={p.a} w={p.a} h={p.b} color={C.p2} opacity={0.35} />
          <RectW x={p.a} y={p.a} w={p.b} h={p.b} color={C.p5} opacity={0.45} />
          <Label x={p.a / 2} y={p.a / 2} text={`a² = ${fmt(p.a * p.a, 2)}`} anchor="middle" size={13} />
          <Label x={p.a + p.b / 2} y={p.a / 2} text={`ab`} anchor="middle" size={12} />
          <Label x={p.a / 2} y={p.a + p.b / 2} text={`ab`} anchor="middle" size={12} />
          <Label x={p.a + p.b / 2} y={p.a + p.b / 2} text={`b²`} anchor="middle" size={12} />
        </>
      ),
      info: ({ p }: any) =>
        t`Lado $a+b=${fmt(p.a + p.b, 2)}$ ⟹ $(a+b)^2 = ${fmt(p.a ** 2, 2)} + 2\cdot ${fmt(p.a * p.b, 2)} + ${fmt(p.b ** 2, 2)} = ${fmt((p.a + p.b) ** 2, 2)}$`,
    },
    280,
  );

/** Factored parabola (x - r1)(x - r2) showing roots and sum/product */
const factoredQuadLab = () =>
  plot({
    view: { xMin: -5, xMax: 5, yMin: -5, yMax: 7 },
    params: [
      { key: 'r1', label: 'r_1', min: -4, max: 4, step: 0.5, value: -1, color: C.p2 },
      { key: 'r2', label: 'r_2', min: -4, max: 4, step: 0.5, value: 3, color: C.p5 },
    ],
    render: ({ p }: any) => {
      const f = (x: number) => (x - p.r1) * (x - p.r2);
      const xv = (p.r1 + p.r2) / 2;
      return (
        <>
          <FnCurve f={f} color={C.p1} />
          <Pt x={p.r1} y={0} color={C.p2} r={6} label="r₁" />
          <Pt x={p.r2} y={0} color={C.p5} r={6} label="r₂" />
          <Pt x={xv} y={f(xv)} color={C.gold} r={4} />
        </>
      );
    },
    info: ({ p }: any) => {
      const S = p.r1 + p.r2;
      const P = p.r1 * p.r2;
      return t`$y=(x-${fmt(p.r1)})(x-${fmt(p.r2)})=x^2 ${S >= 0 ? '-' : '+'} ${fmt(Math.abs(S))}x ${P >= 0 ? '+' : '-'} ${fmt(Math.abs(P))}$ · $S=${fmt(S)}$, $P=${fmt(P)}$`;
    },
  });

/** Cubic polynomial p(x) = (x - r)(x^2 - 4) with slider for root r */
const cubicRootLab = () =>
  plot({
    view: { xMin: -4, xMax: 4, yMin: -8, yMax: 8 },
    params: [{ key: 'r', label: 'r', min: -3, max: 3, step: 0.5, value: 1, color: C.gold }],
    render: ({ p }: any) => {
      const f = (x: number) => (x - p.r) * (x * x - 4);
      return (
        <>
          <FnCurve f={f} color={C.p4} />
          <Pt x={-2} y={0} color={C.p2} r={5} label="-2" />
          <Pt x={2} y={0} color={C.p2} r={5} label="2" />
          <Pt x={p.r} y={0} color={C.gold} r={6} label="r" />
        </>
      );
    },
    info: ({ p }: any) => t`$p(x)=(x-${fmt(p.r)})(x-2)(x+2)$ · raízes em $-2$, $2$ e $r=${fmt(p.r)}$ · $p(0)=${fmt(4 * p.r)}$`,
  });

/** Sign lab for (x - a)(x - b) with sliders a and b */
const signVaralLab = () =>
  plot({
    view: { xMin: -5, xMax: 5, yMin: -5, yMax: 6 },
    params: [
      { key: 'a', label: 'a', min: -4, max: 1, step: 0.5, value: -2, color: C.p2 },
      { key: 'b', label: 'b', min: 0, max: 4, step: 0.5, value: 2, color: C.p5 },
    ],
    render: ({ p }: any) => {
      const lo = Math.min(p.a, p.b);
      const hi = Math.max(p.a, p.b);
      const f = (x: number) => (x - p.a) * (x - p.b);
      return (
        <>
          <AreaUnder f={f} a={-5} b={lo} color={C.success} opacity={0.22} />
          {hi > lo ? <AreaUnder f={f} a={lo} b={hi} color={C.danger} opacity={0.28} /> : null}
          <AreaUnder f={f} a={hi} b={5} color={C.success} opacity={0.22} />
          <Seg x1={-5} y1={0} x2={lo} y2={0} color={C.success} width={5} />
          {hi > lo ? <Seg x1={lo} y1={0} x2={hi} y2={0} color={C.danger} width={5} /> : null}
          <Seg x1={hi} y1={0} x2={5} y2={0} color={C.success} width={5} />
          <FnCurve f={f} color={C.p1} />
          <Pt x={p.a} y={0} color={C.gold} r={5} label="a" />
          <Pt x={p.b} y={0} color={C.gold} r={5} label="b" />
        </>
      );
    },
    info: ({ p }: any) => {
      const lo = Math.min(p.a, p.b);
      const hi = Math.max(p.a, p.b);
      if (Math.abs(hi - lo) < 1e-6) return t`$(x-${fmt(lo)})^2 \ge 0$ sempre (raiz dupla em $x=${fmt(lo)}$)`;
      return t`$(x-${fmt(p.a)})(x-${fmt(p.b)})$: **negativo** em $(${fmt(lo)},\,${fmt(hi)})$ · **positivo** fora`;
    },
  });

/** Absolute value graph y = |x - a| + b with horizontal line y = c */
const absGraphLab = () =>
  plot({
    view: { xMin: -6, xMax: 6, yMin: -3, yMax: 7 },
    params: [
      { key: 'a', label: 'a', min: -4, max: 4, step: 0.5, value: 1, color: C.p2 },
      { key: 'b', label: 'b', min: -2, max: 3, step: 0.5, value: 0, color: C.p3 },
    ],
    render: ({ p }: any) => (
      <>
        <FnCurve f={(x) => Math.abs(x - p.a) + p.b} color={C.p2} />
        <Pt x={p.a} y={p.b} color={C.gold} r={6} label="V" />
      </>
    ),
    info: ({ p }: any) =>
      t`$f(x)=|x ${p.a >= 0 ? '-' : '+'} ${fmt(Math.abs(p.a))}| ${p.b >= 0 ? '+' : '-'} ${fmt(Math.abs(p.b))}$ · bico (vértice) em $(${fmt(p.a)},\,${fmt(p.b)})$`,
  });

/** Two intersecting lines y = m1 x + b1 and y = -x + 2 */
const sysLinesLab = () =>
  plot({
    view: { xMin: -5, xMax: 5, yMin: -5, yMax: 5 },
    equalAspect: true,
    params: [
      { key: 'm', label: 'm', min: -2, max: 3, step: 0.5, value: 1, color: C.p2 },
      { key: 'b', label: 'b', min: -4, max: 4, step: 0.5, value: -2, color: C.p3 },
    ],
    render: ({ p }: any) => {
      // Line 1 (fixed): x + y = 2 => y = -x + 2
      // Line 2 (adjustable): y = m x + b
      const denom = p.m + 1;
      const xInt = Math.abs(denom) > 1e-6 ? (2 - p.b) / denom : null;
      return (
        <>
          <InfLine x1={0} y1={2} x2={2} y2={0} color={C.p5} />
          <InfLine x1={0} y1={p.b} x2={1} y2={p.b + p.m} color={C.p2} />
          {xInt !== null ? <Pt x={xInt} y={2 - xInt} color={C.gold} r={6} label="P" /> : null}
        </>
      );
    },
    info: ({ p }: any) => {
      const denom = p.m + 1;
      if (Math.abs(denom) < 1e-6) {
        return Math.abs(p.b - 2) < 1e-6 ? t`Retas **coincidentes** ⟹ infinitas soluções (SPI)` : t`Retas **paralelas** ⟹ nenhuma solução (SI)`;
      }
      const x = (2 - p.b) / denom;
      return t`Encontro $P=(${fmt(x, 2)},\,${fmt(2 - x, 2)})$ · sistema possível e determinado (SPD)`;
    },
  });

/* ========================================================================
 * UNIDADE 1: FATORAÇÃO E POLINÔMIOS (f-fat)
 * ======================================================================== */

export const fatoracao: UnitDef = {
  id: 'f-fat',
  title: 'Fatoração e polinômios',
  subtitle: 'Manipulação algébrica, fatoração, frações e divisão de polinômios',
  icon: '🧩',
  source: 'Competências Básicas · Fatoração e Polinômios',
  guide: t`Manipular e fatorar expressões algébricas é o que destrava integrais, limites indeterminados $\frac{0}{0}$ e equações de grau alto. Domine **produtos notáveis** (até o grau 3), as **técnicas de fatoração**, a **simplificação de frações algébricas** e o dispositivo de **Briot-Ruffini**.`,
  lessons: [
    /* ---------------- LIÇÃO 1: f-fat-expr ---------------- */
    {
      id: 'f-fat-expr',
      title: 'Manipulação algébrica e produtos notáveis',
      parts: [
        {
          card: {
            title: 'Termos semelhantes e distributiva',
            body: t`Na soma e na subtração, só podemos juntar **termos semelhantes** — aqueles que têm exatamente a mesma parte literal (mesmas letras com os mesmos expoentes):

$$3x^2y + 5xy - x^2y = 2x^2y + 5xy$$

Na multiplicação, aplicamos a **propriedade distributiva** ("chuveirinho"), multiplicando cada termo do primeiro parêntese por cada termo do segundo:

$$(a+b)(c+d) = ac + ad + bc + bd$$`,
            tip: t`Sinal de **menos** antes de parênteses troca o sinal de **todos** os termos de dentro: $-(2x^2 - 3x + 1) = -2x^2 + 3x - 1$.`,
            example: t`$(2x - 3)(x + 4) = 2x^2 + 8x - 3x - 12 = 2x^2 + 5x - 12$.`,
          },
          exercises: [
            mcqS(
              t`Qual monômio é **semelhante** a $-4x^2y^3$?`,
              t`$7x^2y^3$`,
              [t`$-4x^3y^2$`, t`$7x^2y$`, t`$x^3y^3$`, t`$-4xy$`],
              t`Termos semelhantes têm as mesmas letras com os **mesmos expoentes**: $x^2y^3$.`,
            ),
            tf(
              t`A expressão $2x^2 + 3x$ pode ser simplificada para $5x^3$.`,
              false,
              t`$x^2$ e $x$ têm expoentes diferentes: não são termos semelhantes e não podem ser somados em um único monômio.`,
            ),
            gen((rng) => {
              const a = randInt(rng, 2, 7);
              const b = randNZ(rng, -5, 6);
              const c = randInt(rng, 1, 5);
              const d = randNZ(rng, -6, 5);
              return rmcq(
                rng,
                t`Reduza os termos semelhantes em $(${a}x^2 ${term(b, 'x')}) + (${c}x^2 ${term(d, 'x')})$.`,
                t`$${polyTex([0, b + d, a + c])}$`,
                [
                  t`$${polyTex([0, b - d, a + c])}$`,
                  t`$${polyTex([0, b + d, a * c])}$`,
                  t`$${(a + c + b + d)}x^3$`,
                  t`$${polyTex([0, b + d + 1, a + c])}$`,
                ],
                t`Some $x^2$ com $x^2$ ($${a}+${c}=${a + c}$) e $x$ com $x$ ($${b}+(${d})=${b + d}$).`,
              );
            }),
            gen((rng) => {
              const a = randInt(rng, 3, 8);
              const b = randInt(rng, 1, 6);
              const c = randInt(rng, 1, a - 1);
              const d = randInt(rng, 2, 7);
              return rmcq(
                rng,
                t`Simplifique $(${a}x + ${b}) - (${c}x - ${d})$.`,
                t`$${polyTex([b + d, a - c])}$`,
                [
                  t`$${polyTex([b - d, a - c])}$`,
                  t`$${polyTex([b + d, a + c])}$`,
                  t`$${polyTex([-b - d, a - c])}$`,
                  t`$${polyTex([b - d, a + c])}$`,
                ],
                t`O menos na frente do parêntese troca os sinais: $-${c}x + ${d}$. Assim, $(${a}-${c})x + (${b}+${d}) = ${polyTex([b + d, a - c])}$.`,
              );
            }),
            fill(
              t`Aplique a distributiva em $3x(2x^2 - 5x + 1)$:`,
              t`___ $- 15x^2 +$ ___`,
              ['$6x^3$', '$3x$'],
              ['$5x^3$', '$6x^2$', '$1$'],
              t`$3x\cdot 2x^2 = 6x^3$, $3x\cdot(-5x) = -15x^2$ e $3x\cdot 1 = 3x$.`,
            ),
            gen((rng) => {
              const a = randInt(rng, 2, 4);
              const b = randNZ(rng, -5, 5);
              const c = randNZ(rng, -4, 4);
              const c2 = a;
              const c1 = a * c + b;
              const c0 = b * c;
              return rmcq(
                rng,
                t`Desenvolva o produto $(${a}x ${term(b, '')})(x ${term(c, '')})$.`,
                t`$${polyTex([c0, c1, c2])}$`,
                [
                  t`$${polyTex([c0, b + c, c2])}$`,
                  t`$${polyTex([-c0, c1, c2])}$`,
                  t`$${polyTex([c0, a * c - b, c2])}$`,
                  t`$${polyTex([c0, 0, c2])}$`,
                ],
                t`Distributiva: $${a}x^2 ${term(a * c, 'x')} ${term(b, 'x')} ${term(b * c, '')} = ${polyTex([c0, c1, c2])}$.`,
              );
            }),
            gen((rng) => {
              const a = randInt(rng, 2, 5);
              const b = randInt(rng, 1, 6);
              const x0 = randInt(rng, -2, 3);
              const val = (x0 + a) * (x0 - b) - x0 * x0;
              return num(
                t`Após simplificar $E(x) = (x+${a})(x-${b}) - x^2$, calcule o valor de $E(${x0})$.`,
                val,
                t`$E(x) = x^2 ${term(a - b, 'x')} - ${a * b} - x^2 = ${polyTex([-a * b, a - b])}$. Em $x=${x0}$: $${(a - b) * x0 - a * b}$.`,
              );
            }),
            mcqS(
              t`Qual é o grau do polinômio resultante de $(x^3 + 2x)(x^2 - 5) - x^5$?`,
              t`$3$`,
              [t`$5$`, t`$6$`, t`$2$`, t`$1$`],
              t`$(x^3+2x)(x^2-5) = x^5 - 5x^3 + 2x^3 - 10x = x^5 - 3x^3 - 10x$. Subtraindo $x^5$, sobra $-3x^3 - 10x$, que tem grau $3$.`,
            ),
          ],
        },
        {
          card: {
            title: 'Produtos notáveis e visão geométrica',
            body: t`Os três produtos notáveis de 2º grau economizam distributivas a todo instante:

$$\begin{aligned}
(a+b)^2 &= a^2 + 2ab + b^2 \\
(a-b)^2 &= a^2 - 2ab + b^2 \\
(a+b)(a-b) &= a^2 - b^2
\end{aligned}$$

Geometricamente, um quadrado de lado $a+b$ se divide em dois quadrados ($a^2$ e $b^2$) e **dois** retângulos de área $ab$:`,
            visual: notableSquareLab(),
            tip: t`Repare que $(a+b)^2 - (a-b)^2 = 4ab$, e $(a+b)^2 + (a-b)^2 = 2(a^2+b^2)$ (os termos $2ab$ se cancelam!).`,
          },
          exercises: [
            inter(
              t`No quadrado de lado $a+b$, ajuste os controles para que $a=3$ e a área total $(a+b)^2$ seja $16$.`,
              'plot',
              notableSquareLab().props,
              (v: any) => v && near(v.p.a, 3, 0.05) && near(v.p.b, 1, 0.05),
              t`$a=3$ e $b=1$`,
              t`Para $(a+b)^2=16$, o lado total é $a+b=4$. Com $a=3$, temos $b=1$.`,
            ),
            match(
              t`Associe cada expressão ao seu desenvolvimento:`,
              [
                [t`$(x+y)^2$`, t`$x^2 + 2xy + y^2$`],
                [t`$(x-y)^2$`, t`$x^2 - 2xy + y^2$`],
                [t`$(x+y)(x-y)$`, t`$x^2 - y^2$`],
                [t`$(x+y)^2 - (x-y)^2$`, t`$4xy$`],
              ],
              t`O quadrado da soma/diferença tem o termo central $\pm 2xy$; o produto da soma pela diferença cancela o termo central.`,
            ),
            gen((rng) => {
              const a = randInt(rng, 2, 5);
              const b = randInt(rng, 2, 5);
              return rmcq(
                rng,
                t`Desenvolva $(${a}x - ${b}y)^2$.`,
                t`$${a * a}x^2 - ${2 * a * b}xy + ${b * b}y^2$`,
                [
                  t`$${a * a}x^2 - ${b * b}y^2$`,
                  t`$${a * a}x^2 - ${a * b}xy + ${b * b}y^2$`,
                  t`$${a * a}x^2 + ${2 * a * b}xy + ${b * b}y^2$`,
                  t`$${a * a}x^2 - ${2 * a * b}xy - ${b * b}y^2$`,
                ],
                t`Quadrado do 1º ($${a * a}x^2$), menos duas vezes o 1º pelo 2º ($-2\cdot ${a}x\cdot ${b}y = -${2 * a * b}xy$), mais o quadrado do 2º ($+${b * b}y^2$).`,
              );
            }),
            gen((rng) => {
              const k = randInt(rng, 2, 6);
              return rmcq(
                rng,
                t`Desenvolva $(x^2 + ${k})(x^2 - ${k})$.`,
                t`$x^4 - ${k * k}$`,
                [t`$x^2 - ${k * k}$`, t`$x^4 + ${k * k}$`, t`$x^4 - ${2 * k}x^2 + ${k * k}$`, t`$x^4 - ${2 * k}$`],
                t`Produto da soma pela diferença com $a=x^2$ e $b=${k}$: $(x^2)^2 - ${k}^2 = x^4 - ${k * k}$.`,
              );
            }),
            mcqS(
              t`Simplifique $(x+3)^2 + (x-3)^2$.`,
              t`$2x^2 + 18$`,
              [t`$2x^2$`, t`$12x$`, t`$2x^2 - 18$`, t`$x^2 + 9$`],
              t`Os termos $+6x$ e $-6x$ se cancelam: $(x^2+6x+9) + (x^2-6x+9) = 2x^2 + 18$.`,
            ),
            gen((rng) => {
              const s = randInt(rng, 5, 12);
              const p = randInt(rng, 3, 15);
              const ans = s * s - 2 * p;
              return num(
                t`Sabendo que $a+b = ${s}$ e $ab = ${p}$, calcule o valor de $a^2 + b^2$.`,
                ans,
                t`Como $(a+b)^2 = a^2 + 2ab + b^2$, temos $a^2+b^2 = (a+b)^2 - 2ab = ${s}^2 - 2\cdot ${p} = ${ans}$.`,
              );
            }),
            gen((rng) => {
              const k = randInt(rng, 3, 9);
              return num(
                t`Se $x + \dfrac{1}{x} = ${k}$, quanto vale $x^2 + \dfrac{1}{x^2}$?`,
                k * k - 2,
                t`Elevando ao quadrado: $\left(x+\frac{1}{x}\right)^2 = x^2 + 2\cdot x\cdot \frac{1}{x} + \frac{1}{x^2} = x^2 + 2 + \frac{1}{x^2} = ${k * k}\Rightarrow x^2 + \frac{1}{x^2} = ${k * k - 2}$.`,
              );
            }),
            mcqS(
              t`Simplifique o produto $(x-1)(x+1)(x^2+1)$.`,
              t`$x^4 - 1$`,
              [t`$x^4 + 1$`, t`$x^3 - 1$`, t`$x^4 - 2x^2 + 1$`, t`$x^2 - 1$`],
              t`Em cadeia: $(x-1)(x+1) = x^2-1$, e depois $(x^2-1)(x^2+1) = x^4 - 1$.`,
            ),
          ],
        },
        {
          card: {
            title: 'Cubo da soma, da diferença e soma/diferença de cubos',
            body: t`No grau 3, cuidado para não confundir o **cubo da soma** com a **soma de cubos**:

• **Cubo da soma / diferença** (desenvolve em 4 termos, coeficientes $1, 3, 3, 1$):
$$(a+b)^3 = a^3 + 3a^2b + 3ab^2 + b^3$$
$$(a-b)^3 = a^3 - 3a^2b + 3ab^2 - b^3$$

• **Soma e diferença de cubos** (fatora em binômio $\times$ trinômio):
$$a^3 - b^3 = (a-b)(a^2 + ab + b^2)$$
$$a^3 + b^3 = (a+b)(a^2 - ab + b^2)$$`,
            tip: t`Mnemônico **MTM** (Mesmo, Troca, Mais) para os sinais de $a^3 \pm b^3$: o binômio tem o **M**esmo sinal, o termo $ab$ **T**roca de sinal, e o $+b^2$ é sempre **M**ais.`,
            example: t`$x^3 - 8 = x^3 - 2^3 = (x-2)(x^2 + 2x + 4)$.`,
          },
          exercises: [
            tf(
              t`Para quaisquer reais $a$ e $b$, vale $(a+b)^3 = a^3 + b^3$.`,
              false,
              t`Faltam os termos centrais $3a^2b + 3ab^2$. Por exemplo, $(1+1)^3 = 8 \neq 1^3+1^3 = 2$.`,
            ),
            fill(
              t`Complete os coeficientes do desenvolvimento de $(x+2)^3$:`,
              t`$x^3 +$ ___ $x^2 +$ ___ $x + 8$`,
              ['$6$', '$12$'],
              ['$3$', '$4$', '$8$'],
              t`$(x+2)^3 = x^3 + 3\cdot x^2\cdot 2 + 3\cdot x\cdot 2^2 + 2^3 = x^3 + 6x^2 + 12x + 8$.`,
            ),
            gen((rng) => {
              const k = randInt(rng, 1, 4);
              return rmcq(
                rng,
                t`Desenvolva $(x - ${k})^3$.`,
                t`$x^3 - ${3 * k}x^2 + ${3 * k * k}x - ${k ** 3}$`,
                [
                  t`$x^3 - ${k ** 3}$`,
                  t`$x^3 - ${3 * k}x^2 - ${3 * k * k}x - ${k ** 3}$`,
                  t`$x^3 + ${3 * k}x^2 + ${3 * k * k}x + ${k ** 3}$`,
                  t`$x^3 - ${k}x^2 + ${k * k}x - ${k ** 3}$`,
                ],
                t`Em $(a-b)^3$, os sinais alternam ($+, -, +, -$): $x^3 - 3(${k})x^2 + 3(${k}^2)x - ${k}^3$.`,
              );
            }),
            gen((rng) => {
              const k = randInt(rng, 1, 5);
              return rmcq(
                rng,
                t`Qual é a fatoração de $x^3 - ${k ** 3}$?`,
                t`$(x-${k})(x^2 + ${k === 1 ? '' : k}x + ${k * k})$`,
                [
                  t`$(x-${k})(x^2 - ${k === 1 ? '' : k}x + ${k * k})$`,
                  t`$(x-${k})^3$`,
                  t`$(x-${k})(x^2 + ${2 * k}x + ${k * k})$`,
                  t`$(x+${k})(x^2 - ${k === 1 ? '' : k}x + ${k * k})$`,
                ],
                t`Diferença de cubos $a^3-b^3=(a-b)(a^2+ab+b^2)$ com $a=x$ e $b=${k}$ (repare que no trinômio é $+${k === 1 ? '' : k}x$, e não $+2ab$).`,
              );
            }),
            gen((rng) => {
              const k = randInt(rng, 1, 5);
              return rmcq(
                rng,
                t`Qual é a fatoração de $x^3 + ${k ** 3}$?`,
                t`$(x+${k})(x^2 - ${k}x + ${k * k})$`,
                [
                  t`$(x+${k})(x^2 + ${k}x + ${k * k})$`,
                  t`$(x+${k})^3$`,
                  t`$(x-${k})(x^2 + ${k}x + ${k * k})$`,
                  t`$(x+${k})(x^2 - ${2 * k}x + ${k * k})$`,
                ],
                t`Soma de cubos $a^3+b^3=(a+b)(a^2-ab+b^2)$ com $a=x$ e $b=${k}$.`,
              );
            }),
            mcqS(
              t`Simplifique o produto $(x+2)(x^2 - 2x + 4)$.`,
              t`$x^3 + 8$`,
              [t`$x^3 - 8$`, t`$(x+2)^3$`, t`$x^3 + 6x^2 + 12x + 8$`, t`$x^3 + 4$`],
              t`Tem a forma exata $(a+b)(a^2-ab+b^2) = a^3+b^3 = x^3 + 2^3 = x^3 + 8$.`,
            ),
            gen((rng) => {
              const x0 = randInt(rng, 3, 8);
              const k = randInt(rng, 1, 4);
              const ans = (x0 - k) ** 3;
              return num(
                t`Calcule o valor numérico de $x^3 - ${3 * k}x^2 + ${3 * k * k}x - ${k ** 3}$ para $x = ${x0}$.`,
                ans,
                t`Reconheça o cubo da diferença: a expressão é $(x-${k})^3 = (${x0}-${k})^3 = ${x0 - k}^3 = ${ans}$. Muito mais rápido do que substituir termo a termo!`,
              );
            }),
            num(
              t`Sabendo que $a-b = 2$ e $a^2 + ab + b^2 = 19$, quanto vale $a^3 - b^3$?`,
              38,
              t`$a^3 - b^3 = (a-b)(a^2+ab+b^2) = 2\cdot 19 = 38$.`,
            ),
          ],
        },
      ],
    },

    /* ---------------- LIÇÃO 2: f-fat-tec ---------------- */
    {
      id: 'f-fat-tec',
      title: 'Técnicas de fatoração e frações algébricas',
      parts: [
        {
          card: {
            title: 'Fator comum em evidência e agrupamento',
            body: t`Fatorar é transformar uma **soma em produto** — o inverso da distributiva.

1. **Fator comum em evidência** (sempre tente primeiro!):
$$6x^3 + 9x^2 = 3x^2(2x + 3)$$

2. **Agrupamento** (para 4 termos): coloque em evidência de dois em dois para fazer surgir um parêntese comum:
$$ax + ay + bx + by = a(x+y) + b(x+y) = (x+y)(a+b)$$`,
            tip: t`Em uma equação como $x^2 - 5x = 0$, **nunca** divida por $x$ (você perderia a raiz $x=0$!). Coloque $x$ em evidência: $x(x-5)=0$.`,
            example: t`$x^3 + 2x^2 + 3x + 6 = x^2(x+2) + 3(x+2) = (x+2)(x^2+3)$.`,
          },
          exercises: [
            mcqS(
              t`Fatore colocando o maior fator comum em evidência: $12x^3 - 8x^2$.`,
              t`$4x^2(3x - 2)$`,
              [t`$2x(6x^2 - 4x)$`, t`$4x^3(3 - 2x)$`, t`$4x^2(3x - 8)$`, t`$12x^2(x - 8)$`],
              t`O MDC entre $12$ e $8$ é $4$, e a menor potência de $x$ é $x^2$: $4x^2(3x-2)$.`,
            ),
            gen((rng) => {
              const k = randInt(rng, 2, 6);
              const a = randInt(rng, 2, 5);
              let b = randInt(rng, 2, 7);
              while (b % a === 0 || a % b === 0) b++;
              return rmcq(
                rng,
                t`Coloque o fator comum em evidência em $${k * a}x^2 + ${k * b}x$.`,
                t`$${k}x(${a}x + ${b})$`,
                [
                  t`$${k}(${a}x^2 + ${b}x)$`,
                  t`$x(${k * a}x + ${b})$`,
                  t`$${k}x^2(${a} + ${b})$`,
                  t`$${k}x(${a}x - ${b})$`,
                ],
                t`Fator comum numérico $${k}$ e literal $x$: $${k}x(${a}x + ${b})$.`,
              );
            }),
            fill(
              t`Fatore por agrupamento: $x^3 + 3x^2 + 2x + 6 = x^2(x+3) + 2(x+3) =$`,
              t`$(x+3)($ ___ $+$ ___ $)$`,
              ['$x^2$', '$2$'],
              ['$3x$', '$x$', '$6$'],
              t`O parêntese $(x+3)$ é o fator comum aos dois blocos: $(x+3)(x^2+2)$.`,
            ),
            gen((rng) => {
              const a = randInt(rng, 2, 6);
              const b = randInt(rng, 2, 6);
              return rmcq(
                rng,
                t`Fatore por agrupamento: $xy + ${a}x + ${b}y + ${a * b}$.`,
                t`$(x+${b})(y+${a})$`,
                [
                  t`$(x+${a})(y+${b})$`,
                  t`$(x-${b})(y-${a})$`,
                  t`$x(y+${a}) + ${b}$`,
                  t`$(xy+${a})(y+${b})$`,
                ],
                t`$x(y+${a}) + ${b}(y+${a}) = (y+${a})(x+${b})$.`,
              );
            }),
            gen((rng) => {
              const a = randInt(rng, 1, 5);
              const b = randInt(rng, 2, 6);
              return rmcq(
                rng,
                t`Fatore $x^3 - ${a}x^2 + ${b}x - ${a * b}$.`,
                t`$(x-${a})(x^2+${b})$`,
                [
                  t`$(x+${a})(x^2-${b})$`,
                  t`$(x-${a})(x^2-${b})$`,
                  t`$(x-${b})(x^2+${a})$`,
                  t`$x(x-${a})(x+${b})$`,
                ],
                t`$x^2(x-${a}) + ${b}(x-${a}) = (x-${a})(x^2+${b})$.`,
              );
            }),
            mcqS(
              t`Simplifique $(x-2)(x+5) + (x-2)(x-1)$ colocando $(x-2)$ em evidência.`,
              t`$2(x-2)(x+2)$`,
              [t`$(x-2)(x+4)$`, t`$(x-2)^2(x+4)$`, t`$2x(x-2)$`, t`$(x-2)(2x+6)$`],
              t`$(x-2)[(x+5) + (x-1)] = (x-2)(2x+4) = 2(x-2)(x+2)$.`,
            ),
            gen((rng) => {
              const x = randInt(rng, 12, 25);
              const y = randInt(rng, 11, 20);
              const a = randInt(rng, 3, 7);
              const b = 10 - a;
              const ans = 10 * (x + y);
              return num(
                t`Use fatoração por agrupamento para calcular $${a}\cdot ${x} + ${a}\cdot ${y} + ${b}\cdot ${x} + ${b}\cdot ${y}$.`,
                ans,
                t`Agrupando: $(${a}+${b})(${x}+${y}) = 10\cdot ${x + y} = ${ans}$.`,
              );
            }),
            mcqS(
              t`Fatore completamente $2x^3 - 2x^2 - 8x + 8$.`,
              t`$2(x-1)(x-2)(x+2)$`,
              [t`$2(x-1)(x^2-4)$`, t`$(2x-2)(x-2)^2$`, t`$2(x+1)(x-2)(x+2)$`, t`$2(x-1)(x^2+4)$`],
              t`$2[x^2(x-1) - 4(x-1)] = 2(x-1)(x^2-4) = 2(x-1)(x-2)(x+2)$.`,
            ),
          ],
        },
        {
          card: {
            title: 'Trinômios e diferença de quadrados',
            body: t`Para polinômios de 2º grau:
• **2 termos** ($a^2 - b^2$): diferença de quadrados $(a+b)(a-b)$. (Atenção: $x^2 + k$ com $k>0$ **não** fatora nos reais!)
• **3 termos — Trinômio Quadrado Perfeito (TQP)**: $a^2 \pm 2ab + b^2 = (a\pm b)^2$.
• **3 termos — Soma e produto**: $x^2 - Sx + P = (x-r_1)(x-r_2)$, onde $r_1 + r_2 = S$ e $r_1\cdot r_2 = P$.

Mexa nas raízes $r_1$ e $r_2$ e veja o polinômio fatorado:`,
            visual: factoredQuadLab(),
            tip: t`Quando $a \neq 1$, temos $ax^2 + bx + c = a(x-r_1)(x-r_2)$ — não esqueça do coeficiente líder $a$ na frente!`,
          },
          exercises: [
            inter(
              t`Ajuste as raízes $r_1$ e $r_2$ (com $r_1 < r_2$) para obter o trinômio $x^2 - x - 6$.`,
              'plot',
              factoredQuadLab().props,
              (v: any) => v && near(v.p.r1, -2, 0.05) && near(v.p.r2, 3, 0.05),
              t`$r_1 = -2$ e $r_2 = 3$`,
              t`Soma $S = 1$ e produto $P = -6$: as raízes são $-2$ e $3$, logo $x^2-x-6=(x+2)(x-3)$.`,
            ),
            tf(
              t`O polinômio $x^2 + 9$ pode ser fatorado nos reais como $(x+3)(x-3)$.`,
              false,
              t`$(x+3)(x-3) = x^2 - 9$. A **soma** de quadrados $x^2+9$ não tem raízes reais e é irredutível em $\mathbb R$.`,
            ),
            gen((rng) => {
              const k = randInt(rng, 2, 9);
              const minus = rng() < 0.5;
              const sign = minus ? '-' : '+';
              return rmcq(
                rng,
                t`Reconheça o trinômio quadrado perfeito e fatore $x^2 ${sign} ${2 * k}x + ${k * k}$.`,
                t`$(x ${sign} ${k})^2$`,
                [
                  t`$(x ${minus ? '+' : '-'} ${k})^2$`,
                  t`$(x+${k})(x-${k})$`,
                  t`$(x ${sign} ${k * k})^2$`,
                  t`$(x ${sign} ${2 * k})^2$`,
                ],
                t`$\sqrt{x^2}=x$, $\sqrt{${k * k}}=${k}$ e o termo central é $\pm 2\cdot ${k}\cdot x = \pm ${2 * k}x$.`,
              );
            }),
            gen((rng) => {
              const r1 = randInt(rng, 1, 5);
              const r2 = r1 + randInt(rng, 1, 5);
              const S = r1 + r2;
              const P = r1 * r2;
              return rmcq(
                rng,
                t`Fatore por soma e produto: $x^2 - ${S}x + ${P}$.`,
                t`$(x-${r1})(x-${r2})$`,
                [
                  t`$(x+${r1})(x+${r2})$`,
                  t`$(x-${r1})(x+${r2})$`,
                  t`$(x+${r1})(x-${r2})$`,
                  t`$(x-${S})(x+${P})$`,
                ],
                t`Dois números que somam $${S}$ e multiplicam $${P}$ são $${r1}$ e $${r2}$: $(x-${r1})(x-${r2})$.`,
              );
            }),
            gen((rng) => {
              const r1 = randInt(rng, 1, 5);
              let r2 = randInt(rng, 1, 6);
              if (r2 === r1) r2 = r1 + 1; // r2 = r1 would make b = 0 and a "(x-0)" option
              const b = r2 - r1;
              const c = -r1 * r2;
              return rmcq(
                rng,
                t`Fatore $x^2 ${term(b, 'x')} ${c}$.`,
                t`$(x-${r1})(x+${r2})$`,
                [
                  t`$(x+${r1})(x-${r2})$`,
                  t`$(x-${r1})(x-${r2})$`,
                  t`$(x+${r1})(x+${r2})$`,
                  t`$(x-${Math.abs(b)})(x+${Math.abs(c)})$`,
                ],
                t`Raízes $${r1}$ e $-${r2}$ (soma $${r1 - r2}$, produto $${c}$), logo $(x-${r1})(x+${r2})$.`,
              );
            }),
            mcqS(
              t`Fatore completamente $3x^2 - 12$.`,
              t`$3(x+2)(x-2)$`,
              [t`$(3x+6)(x-2)$`, t`$3(x-2)^2$`, t`$3(x^2-4)$`, t`$(3x+2)(3x-2)$`],
              t`1º passo: evidência $3(x^2-4)$. 2º passo: diferença de quadrados $3(x+2)(x-2)$.`,
            ),
            mcqS(
              t`Qual é a forma fatorada de $2x^2 - 5x + 2$?`,
              t`$(2x-1)(x-2)$`,
              [t`$(x-\frac{1}{2})(x-2)$`, t`$(2x+1)(x+2)$`, t`$2(x-1)(x-2)$`, t`$(2x-2)(x-1)$`],
              t`Raízes $\frac{1}{2}$ e $2$: $2\left(x-\frac{1}{2}\right)(x-2) = (2x-1)(x-2)$.`,
            ),
            mcqS(
              t`Fatore completamente $x^4 - 16$ nos reais.`,
              t`$(x-2)(x+2)(x^2+4)$`,
              [t`$(x^2-4)(x^2+4)$`, t`$(x-2)^2(x+2)^2$`, t`$(x-4)(x+4)$`, t`$(x-2)(x+2)^3$`],
              t`$x^4 - 16 = (x^2-4)(x^2+4) = (x-2)(x+2)(x^2+4)$ (e $x^2+4$ é irredutível nos reais).`,
            ),
          ],
        },
        {
          card: {
            title: 'Frações algébricas (a ponte para os limites 0/0)',
            body: t`Em uma fração algébrica, **só podemos cancelar fatores** (que multiplicam tudo), nunca parcelas soltas de uma soma!

$$\frac{x^2 - 9}{x^2 - 6x + 9} = \frac{(x+3)\cancel{(x-3)}}{(x-3)\cancel{(x-3)}} = \frac{x+3}{x-3}\quad (x\neq 3)$$

Em Cálculo, é exatamente assim que levantamos a indeterminação $\frac{0}{0}$ em $\lim_{x\to a}\frac{P(x)}{Q(x)}$.`,
            tip: t`A armadilha mais comum da álgebra: em $\frac{x+3}{x}$, **não** dá para cortar o $x$! Já em $\frac{x(x+3)}{x} = x+3$ (para $x\neq 0$), o $x$ é fator e pode ser cancelado.`,
            example: t`Para somar frações, tire o MMC dos denominadores fatorados: $\frac{1}{x-1} + \frac{1}{x+1} = \frac{(x+1)+(x-1)}{(x-1)(x+1)} = \frac{2x}{x^2-1}$.`,
          },
          exercises: [
            tf(
              t`Para todo $x\neq 0$, vale $\dfrac{x^2 + 5}{x^2} = 5$.`,
              false,
              t`Não se pode cancelar $x^2$ porque ele é uma **parcela** da soma no numerador, não um fator de todo o numerador. O correto seria $1 + \frac{5}{x^2}$.`,
            ),
            gen((rng) => {
              const a = randInt(rng, 2, 8);
              return rmcq(
                rng,
                t`Simplifique $\dfrac{x^2 - ${a * a}}{x - ${a}}$ para $x \neq ${a}$.`,
                t`$x + ${a}$`,
                [t`$x - ${a}$`, t`$x^2 - ${a}$`, t`$${a}$`, t`$1$`],
                t`$\frac{(x+${a})(x-${a})}{x-${a}} = x+${a}$.`,
              );
            }),
            gen((rng) => {
              const a = randInt(rng, 2, 6);
              const k = randInt(rng, 2, 5);
              return rmcq(
                rng,
                t`Simplifique $\dfrac{${k}x^2 - ${k * a}x}{x - ${a}}$ para $x \neq ${a}$.`,
                t`$${k}x$`,
                [t`$${k}$`, t`$x - ${a}$`, t`$${k}x - ${a}$`, t`$${k}(x-${a})$`],
                t`Coloque $${k}x$ em evidência no numerador: $\frac{${k}x(x-${a})}{x-${a}} = ${k}x$.`,
              );
            }),
            gen((rng) => {
              const r1 = randInt(rng, 1, 4);
              const r2 = r1 + randInt(rng, 1, 4);
              const S = r1 + r2;
              const P = r1 * r2;
              return rmcq(
                rng,
                t`Simplifique $\dfrac{x^2 - ${S}x + ${P}}{x^2 - ${r1 * r1}}$ (para $x\neq \pm ${r1}$).`,
                t`$\dfrac{x - ${r2}}{x + ${r1}}$`,
                [
                  t`$\dfrac{x - ${r2}}{x - ${r1}}$`,
                  t`$\dfrac{x + ${r2}}{x + ${r1}}$`,
                  t`$\dfrac{x - ${r1}}{x + ${r2}}$`,
                  t`$x - ${r2}$`,
                ],
                t`Fatorando: $\frac{(x-${r1})(x-${r2})}{(x-${r1})(x+${r1})} = \frac{x-${r2}}{x+${r1}}$.`,
              );
            }),
            mcqS(
              t`Qual é o resultado de $\dfrac{2 - x}{x - 2}$ para $x \neq 2$?`,
              t`$-1$`,
              [t`$1$`, t`$0$`, t`$x-2$`, t`$-2$`],
              t`Note que $2 - x = -(x - 2)$. Portanto $\frac{-(x-2)}{x-2} = -1$.`,
            ),
            mcqS(
              t`Reduza a uma única fração: $\dfrac{1}{x-2} - \dfrac{1}{x+2}$.`,
              t`$\dfrac{4}{x^2 - 4}$`,
              [t`$0$`, t`$\dfrac{2x}{x^2 - 4}$`, t`$-\dfrac{1}{4}$`, t`$\dfrac{-4}{x^2 - 4}$`],
              t`MMC $=(x-2)(x+2)$: $\frac{(x+2) - (x-2)}{x^2-4} = \frac{4}{x^2-4}$.`,
            ),
            gen((rng) => {
              const a = randInt(rng, 1, 4);
              return num(
                t`Após simplificar $f(x) = \dfrac{x^3 - ${a ** 3}}{x - ${a}}$ para $x\neq ${a}$, qual valor a expressão simplificada assume em $x = ${a}$?`,
                3 * a * a,
                t`$\frac{(x-${a})(x^2+${a}x+${a * a})}{x-${a}} = x^2+${a}x+${a * a}$. Em $x=${a}$: $${a * a}+${a * a}+${a * a} = ${3 * a * a}$ (que é $\lim_{x\to ${a}} f(x)$!).`,
              );
            }),
            mcqS(
              t`Simplifique $\dfrac{\dfrac{1}{x} - \dfrac{1}{3}}{x - 3}$ para $x\neq 0,\,3$.`,
              t`$-\dfrac{1}{3x}$`,
              [t`$\dfrac{1}{3x}$`, t`$-\dfrac{x-3}{3x}$`, t`$\dfrac{1}{3}$`, t`$-3x$`],
              t`No numerador: $\frac{3-x}{3x} = \frac{-(x-3)}{3x}$. Dividindo por $(x-3)$, sobra $-\frac{1}{3x}$.`,
            ),
          ],
        },
      ],
    },

    /* ---------------- LIÇÃO 3: f-fat-div ---------------- */
    {
      id: 'f-fat-div',
      title: 'Divisão de polinômios e Briot-Ruffini',
      parts: [
        {
          card: {
            title: 'A relação fundamental e o método da chave',
            body: t`Dividir um polinômio $P(x)$ por um divisor $D(x)\neq 0$ significa encontrar o **quociente** $Q(x)$ e o **resto** $R(x)$ tais que:

$$P(x) = D(x)\cdot Q(x) + R(x)$$

onde $R(x) = 0$ (divisão exata) ou $\text{grau}(R) < \text{grau}(D)$.

No **método da chave**, a cada passo dividimos apenas o **termo de maior grau** do que restou pelo termo de maior grau do divisor, multiplicamos de volta e subtraímos.`,
            tip: t`Se $\text{grau}(P) = m$ e $\text{grau}(D) = n$ (com $m\ge n$), o quociente tem grau $m - n$ e o resto tem grau no máximo $n - 1$.`,
            example: t`Ao dividir um polinômio de grau $4$ por um de grau $2$, o quociente tem grau $4-2=2$ e o resto tem grau $\le 1$ (é da forma $ax+b$).`,
          },
          exercises: [
            gen((rng) => {
              const m = randInt(rng, 4, 8);
              const n = randInt(rng, 1, 3);
              return num(
                t`Na divisão de um polinômio de grau $${m}$ por um de grau $${n}$, qual é o grau do **quociente**?`,
                m - n,
                t`Na divisão, subtraímos os graus dos termos líderes: $${m} - ${n} = ${m - n}$.`,
              );
            }),
            mcqS(
              t`Se dividirmos um polinômio $P(x)$ por um divisor de **grau 2**, o resto $R(x)$ (se não for nulo) pode ter grau:`,
              t`$0$ ou $1$`,
              [t`no máximo $2$`, t`sempre $1$`, t`qualquer grau menor que o de $P$`, t`somente $0$`],
              t`A condição da divisão euclidiana exige $\text{grau}(R) < \text{grau}(D) = 2$, logo grau $0$ (constante) ou $1$ ($ax+b$).`,
            ),
            order(
              t`Ordene os passos para um ciclo do método da chave na divisão de $P(x)$ por $D(x)$:`,
              [
                t`Ordenar $P(x)$ e $D(x)$ em potências decrescentes de $x$`,
                t`Dividir o termo de maior grau do dividendo pelo de maior grau de $D(x)$`,
                t`Multiplicar o termo obtido por todo o divisor $D(x)$`,
                t`Subtrair o resultado do dividendo para obter o resto parcial`,
              ],
              t`Dividir os líderes → multiplicar de volta → subtrair → repetir até o grau ficar menor que o do divisor.`,
            ),
            gen((rng) => {
              const a = randInt(rng, 2, 5);
              const b = randNZ(rng, -5, 5);
              const r = randInt(rng, 1, 7);
              // P(x) = (x + 1)(a x + b) + r = a x^2 + (a+b)x + (b+r)
              const P = polyTex([b + r, a + b, a]);
              return rmcq(
                rng,
                t`Qual é o quociente da divisão de $P(x) = ${P}$ por $D(x) = x + 1$?`,
                t`$${polyTex([b, a])}$`,
                [
                  t`$${polyTex([-b, a])}$`,
                  t`$${polyTex([a + b, a])}$`,
                  t`$${polyTex([b + r, a])}$`,
                  t`$${polyTex([b, a + 1])}$`,
                ],
                t`Note que $(x+1)(${polyTex([b, a])}) + ${r} = ${P}$, logo $Q(x) = ${polyTex([b, a])}$ (e resto $${r}$).`,
              );
            }),
            gen((rng) => {
              const x0 = randInt(rng, 1, 3);
              const d0 = randInt(rng, 2, 5);
              const q0 = randInt(rng, 2, 6);
              const r0 = randInt(rng, 1, 8);
              const p0 = d0 * q0 + r0;
              return num(
                t`Na divisão de $P(x)$ por $D(x)$, sabemos que $D(${x0}) = ${d0}$, $Q(${x0}) = ${q0}$ e $R(${x0}) = ${r0}$. Quanto vale $P(${x0})$?`,
                p0,
                t`Pela identidade $P(x) = D(x)Q(x) + R(x)$, temos $P(${x0}) = ${d0}\cdot ${q0} + ${r0} = ${p0}$.`,
              );
            }),
            mcqS(
              t`Qual é o resto da divisão de $x^3 + 2x^2 - x + 5$ por $x^2 + 1$?`,
              t`$-2x + 3$`,
              [t`$x + 2$`, t`$3$`, t`$2x - 3$`, t`$0$`],
              t`$x^3+2x^2-x+5 = (x^2+1)(x+2) + (-2x+3)$. Confira: $(x^3+2x^2+x+2) + (-2x+3) = x^3+2x^2-x+5$.`,
            ),
            tf(
              t`Se o resto da divisão de $P(x)$ por $D(x)$ é zero, dizemos que $P(x)$ é divisível por $D(x)$.`,
              true,
              t`Resto identicamente nulo ($R(x)=0$) significa que $P(x) = D(x)\cdot Q(x)$, ou seja, $D(x)$ é fator de $P(x)$.`,
            ),
            num(
              t`Para qual valor de $k$ o polinômio $x^3 + x^2 + 2x + k$ é divisível por $x^2 + 2$?`,
              2,
              t`$(x^2+2)(x+1) = x^3 + x^2 + 2x + 2$. Para o resto ser zero, precisamos de $k = 2$.`,
            ),
          ],
        },
        {
          card: {
            title: 'Teorema do Resto e dispositivo de Briot-Ruffini',
            body: t`Quando o divisor é do 1º grau $x - a$, como $P(x) = (x-a)Q(x) + R$, basta substituir $x = a$ para zerar $(x-a)$:

• **Teorema do Resto**: o resto da divisão de $P(x)$ por $(x - a)$ é simplesmente $R = P(a)$.
• **Teorema de D'Alembert**: $P(x)$ é divisível por $(x - a) \iff P(a) = 0$ ($a$ é raiz!).

Para achar também o quociente $Q(x)$, usamos o **dispositivo de Briot-Ruffini**: abaixe o 1º coeficiente e, a cada coluna, **multiplique por $a$ e some com o próximo**. Veja para $(2x^3 - 3x^2 + 0x - 5) \div (x - 2)$:`,
            visual: table(
              ['a = 2', 'x³', 'x²', 'x¹', 'x⁰ (resto)'],
              [
                ['Coeficientes', '2', '-3', '0', '-5'],
                ['×2 + próximo', '↓', '+4', '+2', '+4'],
                ['Resultado', '2', '1', '2', 'R = -1'],
              ],
              [2],
            ),
            tip: t`Nunca esqueça de colocar $0$ nos graus que faltam! Em $x^3 - 5$, os coeficientes são $1,\ 0,\ 0,\ -5$. E na divisão por $(x + 3)$, a raiz do divisor é $a = -3$.`,
          },
          exercises: [
            mcqS(
              t`No dispositivo de Briot-Ruffini acima, qual é o quociente $Q(x)$ de $(2x^3 - 3x^2 - 5) \div (x - 2)$?`,
              t`$2x^2 + x + 2$`,
              [t`$2x^2 + x - 1$`, t`$2x^3 + x^2 + 2x - 1$`, t`$x^2 + 2x - 1$`, t`$2x^2 - 3x + 2$`],
              t`Os números da linha final antes do resto ($2, 1, 2$) são os coeficientes do quociente de grau $3-1=2$: $2x^2 + x + 2$.`,
            ),
            gen((rng) => {
              const a = randNZ(rng, -3, 3);
              const c2 = randInt(rng, -4, 4);
              const c1 = randInt(rng, -5, 5);
              const c0 = randInt(rng, -6, 6);
              const r = a ** 3 + c2 * a * a + c1 * a + c0;
              return num(
                t`Use o Teorema do Resto: qual é o resto da divisão de $P(x) = ${polyTex([c0, c1, c2, 1])}$ por $${xm(a)}$?`,
                r,
                t`A raiz do divisor $${xm(a)}$ é $x = ${a}$. Calculando $P(${a}) = (${a})^3 ${term(c2, `(${a})^2`)} ${term(c1, `(${a})`)} ${term(c0, '')} = ${r}$.`,
              );
            }),
            mcqS(
              t`Para dividir $P(x) = 3x^4 - 7x^2 + 2$ por $x + 1$ usando Briot-Ruffini, qual fila de coeficientes de $P(x)$ devemos escrever no topo?`,
              t`$3,\ 0,\ -7,\ 0,\ 2$`,
              [t`$3,\ -7,\ 2$`, t`$3,\ 0,\ -7,\ 2$`, t`$3,\ 1,\ -7,\ 1,\ 2$`, t`$4,\ 0,\ 2,\ 0$`],
              t`Faltam os termos em $x^3$ e em $x^1$, que devem ser preenchidos com zero.`,
            ),
            gen((rng) => {
              const a = pick(rng, [-2, -1, 1, 2, 3]);
              const b = randInt(rng, -4, 5);
              // P(x) = x^3 + b x^2 + k x - 2 divisible by (x - a) => a^3 + b a^2 + k a - 2 = 0
              const k = randInt(rng, -5, 5);
              const c0 = -(a ** 3 + b * a * a + k * a);
              return num(
                t`Sabendo que $P(x) = ${polyTex([0, 0, b, 1])} + kx ${term(c0, '')}$ é divisível por $${xm(a)}$, calcule $k$.`,
                k,
                t`Por D'Alembert, $P(${a}) = 0 \Rightarrow (${a})^3 ${term(b, `(${a})^2`)} + k(${a}) ${term(c0, '')} = 0 \Rightarrow ${a}k = ${-a * k} \Rightarrow k = ${k}$.`,
              );
            }),
            fill(
              t`Complete a linha final do Briot-Ruffini na divisão de $x^3 - 4x^2 + 5x - 2$ por $x - 1$ (coeficientes $1,\ -4,\ 5,\ -2$ com $a=1$):`,
              t`$1,\ $ ___ $,\ $ ___ $,\ 0$`,
              ['$-3$', '$2$'],
              ['$-4$', '$5$', '$1$'],
              t`Abaixa o $1$; $1\cdot 1 + (-4) = -3$; $(-3)\cdot 1 + 5 = 2$; $2\cdot 1 + (-2) = 0$. Quociente $x^2 - 3x + 2$.`,
            ),
            gen((rng) => {
              const n = pick(rng, [10, 20, 50, 99, 100]);
              const c = randInt(rng, 2, 9);
              return num(
                t`Qual é o resto da divisão de $P(x) = x^{${n}} + ${c}$ por $x - 1$?`,
                1 + c,
                t`Pelo Teorema do Resto, basta calcular $P(1) = 1^{${n}} + ${c} = ${1 + c}$ (não tente fazer pelo método da chave!).`,
              );
            }),
            num(
              t`Qual é o resto da divisão de $P(x) = x^{2025} + x^{100} + 1$ por $x + 1$?`,
              1,
              t`Raiz do divisor: $x = -1$. Como $2025$ é ímpar e $100$ é par, $P(-1) = (-1)^{2025} + (-1)^{100} + 1 = -1 + 1 + 1 = 1$.`,
            ),
            mcqS(
              t`Um polinômio $P(x)$ deixa resto $3$ quando dividido por $(x-1)$ e resto $7$ quando dividido por $(x-3)$. Qual é o resto de $P(x)$ por $(x-1)(x-3)$?`,
              t`$2x + 1$`,
              [t`$2x - 1$`, t`$4x - 1$`, t`$10$`, t`$3x + 4$`],
              t`O divisor tem grau $2$, então $R(x) = ax+b$. Como $R(1)=P(1)=3$ e $R(3)=P(3)=7$, temos $a+b=3$ e $3a+b=7 \Rightarrow a=2,\,b=1 \Rightarrow R(x)=2x+1$.`,
            ),
          ],
        },
        {
          card: {
            title: 'Fatorando polinômios de grau 3',
            body: t`Como resolver ou fatorar uma equação de **3º grau** $ax^3+bx^2+cx+d=0$?

1. **Descubra uma raiz $r_1$**: se houver raiz inteira, ela divide o termo independente $d$ (teste $\pm 1, \pm 2, \dots$).
2. **Baixe o grau com Briot-Ruffini**: divida por $(x - r_1)$ para obter um quociente de **2º grau**.
3. **Resolva o 2º grau** por soma e produto ou Bhaskara:
$$P(x) = a(x-r_1)(x-r_2)(x-r_3)$$

Mexa na raiz $r$ do polinômio cúbico abaixo:`,
            visual: cubicRootLab(),
            tip: t`**Atalho esperto**: se a **soma dos coeficientes** de $P(x)$ for zero ($a+b+c+d=0$), então $P(1)=0$ e $x=1$ é raiz na hora!`,
          },
          exercises: [
            inter(
              t`No gráfico de $p(x) = (x-r)(x-2)(x+2)$, ajuste a raiz $r$ para que o gráfico corte o eixo $y$ em $p(0) = -4$.`,
              'plot',
              cubicRootLab().props,
              (v: any) => v && near(v.p.r, -1, 0.05),
              t`$r = -1$`,
              t`Como $p(0) = (-r)(-2)(2) = 4r$, para ter $p(0) = -4$ precisamos de $r = -1$.`,
            ),
            tf(
              t`Se a soma de todos os coeficientes de um polinômio $P(x)$ é igual a $0$, então $x = 1$ é obrigatoriamente uma raiz de $P(x)$.`,
              true,
              t`Substituindo $x=1$ em $P(x)$, todas as potências de $1$ valem $1$ e $P(1)$ é exatamente a soma dos coeficientes.`,
            ),
            mcqS(
              t`Se o polinômio $x^3 + bx^2 + cx - 6$ tem raízes inteiras, todas elas devem ser divisores de:`,
              t`$-6$ (ou seja, $\pm 1,\ \pm 2,\ \pm 3,\ \pm 6$)`,
              [t`$b$`, t`$c$`, t`$3$ (o grau do polinômio)`, t`$b + c$`],
              t`Como o produto das raízes (a menos de sinal) é o termo independente $-6$, qualquer raiz inteira divide $6$.`,
            ),
            gen((rng) => {
              const r2 = randInt(rng, 2, 4);
              const r3 = r2 + randInt(rng, 1, 3);
              // (x-1)(x-r2)(x-r3) = (x-1)(x^2 - (r2+r3)x + r2*r3)
              const S2 = r2 + r3;
              const P2 = r2 * r3;
              const c2 = -(1 + S2);
              const c1 = S2 + P2;
              const c0 = -P2;
              return rmcq(
                rng,
                t`Sabendo que $x = 1$ é raiz de $P(x) = ${polyTex([c0, c1, c2, 1])}$, qual é o quociente de $P(x)$ por $(x-1)$?`,
                t`$${polyTex([P2, -S2, 1])}$`,
                [
                  t`$${polyTex([P2, S2, 1])}$`,
                  t`$${polyTex([-P2, -S2, 1])}$`,
                  t`$${polyTex([c1, c2, 1])}$`,
                  t`$${polyTex([P2, -(S2 + 1), 1])}$`,
                ],
                t`Por Briot-Ruffini com $a=1$ nos coeficientes $1,\ ${c2},\ ${c1},\ ${c0}$, obtemos $1,\ ${-S2},\ ${P2}$ e resto $0$.`,
              );
            }),
            gen((rng) => {
              const r2 = randInt(rng, 2, 5);
              const r3 = r2 + randInt(rng, 1, 4);
              const S2 = r2 + r3;
              const P2 = r2 * r3;
              const c2 = -(1 + S2);
              const c1 = S2 + P2;
              const c0 = -P2;
              return num(
                t`Sabendo que $x = 1$ é raiz de $${polyTex([c0, c1, c2, 1])} = 0$, qual é a **maior** raiz dessa equação?`,
                r3,
                t`Dividindo por $(x-1)$ sobra $x^2 - ${S2}x + ${P2} = (x-${r2})(x-${r3}) = 0$. As raízes são $1,\ ${r2}$ e $${r3}$.`,
              );
            }),
            gen((rng) => {
              const r1 = -1;
              // r2 = 1 or r3 = -r2 would turn a distractor into the same product in another order
              const r2 = randInt(rng, 2, 4);
              const r3 = pick(rng, [-4, -3, -2].filter((r) => r !== -r2));
              const c2 = -(r1 + r2 + r3);
              const c1 = r1 * r2 + r1 * r3 + r2 * r3;
              const c0 = -(r1 * r2 * r3);
              return rmcq(
                rng,
                t`Fatore completamente $P(x) = ${polyTex([c0, c1, c2, 1])}$, sabendo que $P(-1) = 0$.`,
                t`$(x+1)(${xm(r2)})(${xm(r3)})$`,
                [
                  t`$(x-1)(${xm(r2)})(${xm(r3)})$`,
                  t`$(x+1)(${xm(-r2)})(${xm(-r3)})$`,
                  t`$(x+1)(${xm(r2)})(${xm(-r3)})$`,
                  t`$(x-1)(${xm(-r2)})(${xm(r3)})$`,
                ],
                t`Como $P(-1)=0$, dividimos por $(x+1)$ via Briot-Ruffini e fatoramos o trinômio restante em $(${xm(r2)})(${xm(r3)})$.`,
              );
            }),
            num(
              t`Calcule $\lim_{x\to 1} \dfrac{x^3 - 6x^2 + 11x - 6}{x - 1}$ fatorando o numerador.`,
              2,
              t`Por Briot-Ruffini com $a=1$, $x^3-6x^2+11x-6 = (x-1)(x^2-5x+6)$. Cancelando $(x-1)$ e substituindo $x=1$: $1 - 5 + 6 = 2$.`,
            ),
            num(
              t`Um polinômio mônico (coeficiente líder $1$) de grau $3$ tem raízes $-2,\ 1$ e $3$. Quanto vale $P(2)$?`,
              -4,
              t`Na forma fatorada, $P(x) = (x+2)(x-1)(x-3)$. Logo $P(2) = (2+2)(2-1)(2-3) = 4\cdot 1\cdot (-1) = -4$.`,
            ),
          ],
        },
      ],
    },
  ],
};

/* ========================================================================
 * UNIDADE 2: EQUAÇÕES E INEQUAÇÕES (f-eq)
 * ======================================================================== */

export const equacoes: UnitDef = {
  id: 'f-eq',
  title: 'Equações e inequações',
  subtitle: '1º e 2º grau, varal de sinais, módulo e sistemas 3×3',
  icon: '⚖️',
  source: 'Competências Básicas · Equações e Inequações',
  guide: t`Resolver uma equação é desfazer operações mantendo a balança em equilíbrio — sempre vigiando o **domínio**. No estudo de sinais, o **varal de sinais** resolve qualquer produto ou quociente; o **módulo** traduz distâncias e prepara o terreno para a definição $\varepsilon$-$\delta$ de limite.`,
  lessons: [
    /* ---------------- LIÇÃO 1: f-eq-grau ---------------- */
    {
      id: 'f-eq-grau',
      title: 'Equações de 1º e 2º grau e redutíveis',
      parts: [
        {
          card: {
            title: '1º grau e equações fracionárias (olho no domínio!)',
            body: t`Em uma equação do 1º grau $ax + b = 0$ ($a\neq 0$), isolamos $x = -\frac{b}{a}$. Quando há frações numéricas, multiplique os dois lados pelo **MMC** dos denominadores para limpar as frações de uma vez.

Se a incógnita $x$ estiver **no denominador** (equação fracionária):
1. Anote as **restrições de domínio** (valores de $x$ que zeram algum denominador).
2. Elimine os denominadores com o MMC e resolva.
3. **Descarte** qualquer solução que viole o domínio (chamada de *raiz estranha*).`,
            tip: t`Exemplo de raiz estranha: em $\frac{x}{x-2} = \frac{2}{x-2} + 1$, multiplicar por $(x-2)$ leva a $x = 2 + (x-2) \Rightarrow$ todo $x$, exceto $x=2$! E se desse $x=2$ como única resposta, o conjunto solução seria vazio ($\varnothing$).`,
            example: t`$\frac{x}{2} + \frac{x-1}{3} = 4 \xrightarrow{\times 6} 3x + 2(x-1) = 24 \Rightarrow 5x = 26 \Rightarrow x = 5{,}2$.`,
          },
          exercises: [
            gen((rng) => {
              const x0 = randInt(rng, -5, 6);
              const a = randInt(rng, 2, 5);
              const b = randNZ(rng, -6, 6);
              let c = randInt(rng, 1, 4);
              if (c === a) c = a - 1; // c = a turns the equation into an identity (0x = 0)
              const d = (a - c) * x0 + a * b;
              return num(
                t`Resolva a equação $${a}(x ${term(b, '')}) = ${c}x ${term(d, '')}$.`,
                x0,
                t`$${a}x ${term(a * b, '')} = ${c}x ${term(d, '')} \Rightarrow ${a - c}x = ${d - a * b} \Rightarrow x = ${x0}$.`,
              );
            }),
            gen((rng) => {
              const k = randInt(rng, 1, 5);
              const x0 = 6 * k;
              const rhs = 5 * k;
              return num(
                t`Resolva $\dfrac{x}{2} + \dfrac{x}{3} = ${rhs}$.`,
                x0,
                t`Multiplicando tudo pelo MMC $= 6$: $3x + 2x = ${6 * rhs} \Rightarrow 5x = ${6 * rhs} \Rightarrow x = ${x0}$.`,
              );
            }),
            mcqS(
              t`Qual é a restrição de domínio da equação $\dfrac{3}{x-4} + \dfrac{x}{x+1} = 2$?`,
              t`$x \neq 4$ e $x \neq -1$`,
              [t`$x \neq -4$ e $x \neq 1$`, t`$x \neq 0$`, t`$x > 4$`, t`$x \neq 3$`],
              t`Nenhum denominador pode ser zero: $x-4\neq 0 \Rightarrow x\neq 4$ e $x+1\neq 0 \Rightarrow x\neq -1$.`,
            ),
            gen((rng) => {
              const a = randInt(rng, 1, 5);
              const k = randInt(rng, 2, 5);
              // (k*a + 6) / (x - a) = k => k(x - a) = k*a + 6 => not integer unless we pick nicely:
              const x0 = a + randInt(rng, 2, 6);
              const numVal = k * (x0 - a);
              return num(
                t`Resolva a equação fracionária $\dfrac{${numVal}}{x - ${a}} = ${k}$.`,
                x0,
                t`Com $x \neq ${a}$, temos $${k}(x - ${a}) = ${numVal} \Rightarrow x - ${a} = ${x0 - a} \Rightarrow x = ${x0}$ (que respeita $x\neq ${a}$).`,
              );
            }),
            mcqS(
              t`Ao resolver $\dfrac{x^2}{x-3} = \dfrac{9}{x-3}$, qual é o conjunto solução em $\mathbb R$?`,
              t`$\{-3\}$`,
              [t`$\{-3, 3\}$`, t`$\{3\}$`, t`$\varnothing$`],
              t`Igualando os numeradores: $x^2 = 9 \Rightarrow x = 3$ ou $x = -3$. Mas $x = 3$ zera o denominador (raiz estranha!), sobrando apenas $x = -3$.`,
            ),
            tf(
              t`A equação $\dfrac{x-1}{x-1} = 0$ tem solução $x = 1$.`,
              false,
              t`Em $x=1$ temos $\frac{0}{0}$, que não existe! Para $x\neq 1$ a fração vale $1\neq 0$, logo o conjunto solução é vazio ($\varnothing$).`,
            ),
            mcqS(
              t`Para quais valores do parâmetro $m$ a equação $(m-2)x = 5$ **não** tem solução real?`,
              t`$m = 2$`,
              [t`$m = 0$`, t`$m = 5$`, t`$m = -2$`, t`qualquer $m < 0$`],
              t`Se $m = 2$, a equação vira $0\cdot x = 5$, que é impossível.`,
            ),
            num(
              t`Duas torneiras enchem um tanque juntas: a primeira sozinha leva $3$ horas e a segunda leva $6$ horas. Em quantas horas as duas juntas enchem o tanque?`,
              2,
              t`Em 1 hora, somam as frações do tanque: $\frac{1}{3} + \frac{1}{6} = \frac{1}{t} \Rightarrow \frac{3}{6} = \frac{1}{t} \Rightarrow t = 2$ h.`,
              { unit: 'h' },
            ),
          ],
        },
        {
          card: {
            title: 'De onde vem Bhaskara: completando o quadrado',
            body: t`Toda equação de 2º grau pode ser resolvida **completando o quadrado**: somamos $\left(\frac{b}{2}\right)^2$ aos dois lados de $x^2 + bx = -c$ para formar um trinômio quadrado perfeito!

Fazendo isso em $ax^2 + bx + c = 0$, chegamos à famosa **fórmula de Bhaskara**:

$$x = \frac{-b \pm \sqrt{\Delta}}{2a}, \qquad \Delta = b^2 - 4ac$$

E pelas **relações de Girard**, sem precisar achar as raízes:
$$x_1 + x_2 = -\frac{b}{a}, \qquad x_1 \cdot x_2 = \frac{c}{a}$$`,
            visual: parabolaLab(),
            example: t`$x^2 + 6x - 7 = 0 \iff x^2 + 6x + 9 = 7 + 9 \iff (x+3)^2 = 16 \iff x+3 = \pm 4 \implies x=1$ ou $x=-7$.`,
          },
          exercises: [
            inter(
              t`Ajuste os coeficientes da parábola para que $a=1$, $b=-2$ e a equação tenha uma **única raiz real (dupla)**.`,
              'plot',
              parabolaLab({ a: 1, b: -2, c: -3 }).props,
              (v: any) => v && near(v.p.a, 1, 0.05) && near(v.p.b, -2, 0.05) && near(v.p.c, 1, 0.05),
              t`$a=1,\ b=-2,\ c=1$`,
              t`Raiz dupla ocorre quando $\Delta = b^2 - 4ac = (-2)^2 - 4(1)c = 0 \Rightarrow c = 1$ (que forma $(x-1)^2 = 0$).`,
            ),
            fill(
              t`Complete o quadrado para resolver $x^2 - 8x = 9$:`,
              t`$x^2 - 8x +$ ___ $= 9 +$ ___ $\implies (x-4)^2 = 25$`,
              ['$16$', '$16$'],
              ['$8$', '$4$', '$64$'],
              t`Metade de $-8$ é $-4$, e $(-4)^2 = 16$. Somamos $16$ dos dois lados.`,
            ),
            gen((rng) => {
              const h = randNZ(rng, -5, 5);
              const k = randInt(rng, 2, 6);
              // (x + h)^2 = k^2 => x^2 + 2hx + (h^2 - k^2) = 0
              const c = h * h - k * k;
              const rMax = -h + k;
              return num(
                t`Complete o quadrado em $x^2 ${term(2 * h, 'x')} ${term(c, '')} = 0$ e informe a **maior** raiz.`,
                rMax,
                t`Somando $${h * h}$: $(x ${term(h, '')})^2 = ${k * k} \Rightarrow x = ${-h} \pm ${k}$. A maior raiz é $${rMax}$.`,
              );
            }),
            gen((rng) => {
              const a = pick(rng, [2, 3, 4]);
              const b = randNZ(rng, -9, 9);
              const c = randNZ(rng, -8, 8);
              const askProd = rng() < 0.5;
              const ans = askProd ? c / a : -b / a;
              return num(
                t`Sem calcular as raízes de $${polyTex([c, b, a])} = 0$, quanto vale ${askProd ? 'o **produto** $x_1\\cdot x_2$' : 'a **soma** $x_1 + x_2$'}? (fração ou decimal)`,
                ans,
                askProd
                  ? t`Pelas relações de Girard, $x_1\cdot x_2 = \frac{c}{a} = \frac{${c}}{${a}} = ${fmt(ans, 4)}$.`
                  : t`Pelas relações de Girard, $x_1 + x_2 = -\frac{b}{a} = \frac{${-b}}{${a}} = ${fmt(ans, 4)}$.`,
                { tol: 0.005 },
              );
            }),
            gen((rng) => {
              const S = randNZ(rng, -8, 8);
              const P = pick(rng, [-4, -2, -1, 1, 2, 4, 5]);
              // 1/x1 + 1/x2 = (x1+x2)/(x1*x2) = S/P
              return num(
                t`Se $x_1$ e $x_2$ são as raízes de $x^2 ${term(-S, 'x')} ${term(P, '')} = 0$, quanto vale $\dfrac{1}{x_1} + \dfrac{1}{x_2}$?`,
                S / P,
                t`Tirando o MMC: $\frac{1}{x_1}+\frac{1}{x_2} = \frac{x_1+x_2}{x_1\cdot x_2} = \frac{S}{P} = \frac{${S}}{${P}} = ${fmt(S / P, 4)}$.`,
                { tol: 0.005 },
              );
            }),
            num(
              t`Se $x_1$ e $x_2$ são as raízes de $x^2 - 5x + 3 = 0$, quanto vale $x_1^2 + x_2^2$?`,
              19,
              t`Temos $x_1+x_2 = 5$ e $x_1x_2 = 3$. Como $x_1^2+x_2^2 = (x_1+x_2)^2 - 2x_1x_2 = 5^2 - 2\cdot 3 = 25 - 6 = 19$.`,
            ),
            mcqS(
              t`Para quais valores de $m$ a equação $x^2 - 4x + m = 0$ possui **duas raízes reais distintas**?`,
              t`$m < 4$`,
              [t`$m \le 4$`, t`$m > 4$`, t`$m = 4$`, t`$m < -4$`],
              t`Duas raízes reais distintas exigem $\Delta > 0 \iff (-4)^2 - 4(1)(m) > 0 \iff 16 - 4m > 0 \iff m < 4$.`,
            ),
            num(
              t`Sabendo que uma das raízes de $2x^2 - 7x + k = 0$ é $x_1 = 3$, quanto vale $k$?`,
              3,
              t`Substituindo $x=3$: $2(3)^2 - 7(3) + k = 0 \Rightarrow 18 - 21 + k = 0 \Rightarrow k = 3$.`,
            ),
          ],
        },
        {
          card: {
            title: 'Equações biquadradas, mudança de variável e irracionais',
            body: t`Muitas equações de grau maior ou com raízes escondem uma equação de 2º grau:

• **Biquadrada** ($ax^4 + bx^2 + c = 0$, só potências pares): faça a **mudança de variável** $u = x^2$ (com $u \ge 0$), resolva $au^2 + bu + c = 0$ e depois tire $x = \pm\sqrt{u}$.
• **Equações irracionais** ($\sqrt{A(x)} = B(x)$): eleve ambos os lados ao quadrado, mas **sempre verifique** as soluções na equação original (pois elevar ao quadrado pode criar raízes estranhas onde $B(x) < 0$!).`,
            tip: t`Em uma biquadrada, cada $u > 0$ gera **duas** raízes reais ($\pm\sqrt{u}$), $u = 0$ gera **uma** ($x=0$) e $u < 0$ **não** gera raiz real.`,
            example: t`$x^4 - 5x^2 + 4 = 0 \xrightarrow{u=x^2} u^2 - 5u + 4 = 0 \Rightarrow u=1$ ou $u=4 \Rightarrow x \in \{\pm 1, \pm 2\}$.`,
          },
          exercises: [
            mcqS(
              t`Para transformar $x^4 - 13x^2 + 36 = 0$ em uma equação do 2º grau, fazemos a substituição:`,
              t`$u = x^2$, obtendo $u^2 - 13u + 36 = 0$`,
              [
                t`$u = x^4$, obtendo $u - 13u^2 + 36 = 0$`,
                t`$u = \sqrt{x}$, obtendo $u^2 - 13u + 36 = 0$`,
                t`$u = x^3$, obtendo $u^2 - 13u + 36 = 0$`,
              ],
              t`Como $x^4 = (x^2)^2$, trocando $x^2$ por $u$ temos $u^2 - 13u + 36 = 0$.`,
            ),
            gen((rng) => {
              const a = randInt(rng, 1, 3);
              const b = a + randInt(rng, 1, 3);
              const u1 = a * a;
              const u2 = b * b;
              const S = u1 + u2;
              const P = u1 * u2;
              return num(
                t`Qual é a **maior** raiz real da equação biquadrada $x^4 - ${S}x^2 + ${P} = 0$?`,
                b,
                t`Com $u = x^2$: $u^2 - ${S}u + ${P} = 0 \Rightarrow u = ${u1}$ ou $u = ${u2}$. Logo $x = \pm ${a}$ ou $x = \pm ${b}$; a maior é $${b}$.`,
              );
            }),
            gen((rng) => {
              const a = randInt(rng, 2, 5);
              const neg = randInt(rng, 1, 6);
              // (x^2 - a^2)(x^2 + neg) = 0 => x^4 + (neg - a^2)x^2 - a^2*neg = 0
              const B = neg - a * a;
              const C0 = -a * a * neg;
              return rmcq(
                rng,
                t`Quais são todas as raízes **reais** de $x^4 ${term(B, 'x^2')} ${C0} = 0$?`,
                t`$x = -${a}$ e $x = ${a}$`,
                [
                  t`$x = \pm ${a}$ e $x = \pm \sqrt{${neg}}$`,
                  t`$x = ${a * a}$ e $x = -${neg}$`,
                  t`$x = ${a}$ apenas`,
                  t`não possui raízes reais`,
                ],
                t`Fatorando em $u=x^2$: $(x^2 - ${a * a})(x^2 + ${neg}) = 0$. Como $x^2 = -${neg}$ não tem solução real, só $x^2 = ${a * a} \Rightarrow x = \pm ${a}$.`,
              );
            }),
            mcqS(
              t`Quantas raízes reais tem a equação $x^4 + 5x^2 + 4 = 0$?`,
              t`$0$ (nenhuma)`,
              [t`$4$`, t`$2$`, t`$1$`],
              t`Para todo $x\in\mathbb R$, $x^4 \ge 0$ e $5x^2 \ge 0$, logo $x^4 + 5x^2 + 4 \ge 4 > 0$ (ou: $u = -1$ e $u = -4$, ambas negativas).`,
            ),
            num(
              t`Usando a mudança de variável $u = x+1$, resolva $(x+1)^2 - 5(x+1) + 6 = 0$ e informe a **maior** solução $x$.`,
              2,
              t`Com $u = x+1$: $u^2 - 5u + 6 = 0 \Rightarrow u = 2$ ou $u = 3$. Voltando para $x = u - 1$: $x = 1$ ou $x = 2$. A maior é $2$.`,
            ),
            gen((rng) => {
              const x0 = randInt(rng, 2, 7);
              const k = randInt(rng, 3, 6);
              const a = k * k - 2 * x0;
              return num(
                t`Resolva a equação irracional $\sqrt{2x ${term(a, '')}} = ${k}$.`,
                x0,
                t`Elevando os dois lados ao quadrado: $2x ${term(a, '')} = ${k * k} \Rightarrow 2x = ${2 * x0} \Rightarrow x = ${x0}$. Testando: $\sqrt{${k * k}} = ${k}$ ✓.`,
              );
            }),
            tf(
              t`A equação $\sqrt{x + 2} = -3$ tem solução real $x = 7$.`,
              false,
              t`A raiz quadrada real $\sqrt{\cdot}$ é sempre $\ge 0$, nunca pode valer $-3$. O valor $x=7$ é uma **raiz estranha** criada ao elevar ambos os lados ao quadrado!`,
            ),
            mcqS(
              t`Qual é o conjunto solução em $\mathbb R$ da equação irracional $\sqrt{x + 2} = x$?`,
              t`$\{2\}$`,
              [t`$\{-1, 2\}$`, t`$\{-1\}$`, t`$\varnothing$`],
              t`Elevando ao quadrado: $x+2 = x^2 \Rightarrow x^2 - x - 2 = 0 \Rightarrow x=2$ ou $x=-1$. Testando na original: para $x=2$, $\sqrt{4}=2$ ✓; para $x=-1$, $\sqrt{1}=1 \neq -1$ ✗ (raiz estranha!).`,
            ),
          ],
        },
      ],
    },

    /* ---------------- LIÇÃO 2: f-eq-varal ---------------- */
    {
      id: 'f-eq-varal',
      title: 'Inequações e o varal de sinais',
      parts: [
        {
          card: {
            title: 'Estudo do sinal de fatores e o produto (x − a)(x − b)',
            body: t`Um fator linear $x - a$ zera em $x = a$: é **negativo** à esquerda de $a$ ($x < a$) e **positivo** à direita ($x > a$).

Quando multiplicamos $(x - a)(x - b)$ (com $a < b$):
• Para $x < a$: $(-)\cdot(-) = (+)$
• Para $a < x < b$: $(+)\cdot(-) = (-)$
• Para $x > b$: $(+)\cdot(+) = (+)$

Mexa nas raízes $a$ e $b$ abaixo e veja onde o produto é negativo (vermelho) e positivo (verde):`,
            visual: signVaralLab(),
            tip: t`Fatores elevados a **expoente par**, como $(x-3)^2$, são sempre $\ge 0$ e **não trocam o sinal** da expressão ao passar pela raiz $x=3$!`,
          },
          exercises: [
            inter(
              t`No laboratório de $(x-a)(x-b)$, ajuste $a$ e $b$ (com $a < b$) para que o produto seja negativo no intervalo $(-1,\,3)$.`,
              'plot',
              signVaralLab().props,
              (v: any) => v && near(v.p.a, -1, 0.05) && near(v.p.b, 3, 0.05),
              t`$a = -1$ e $b = 3$`,
              t`O produto $(x-a)(x-b)$ é negativo entre as raízes $a=-1$ e $b=3$.`,
            ),
            mcqS(
              t`Para o fator linear $f(x) = x - 4$, quais são os seus sinais para $x < 4$ e para $x > 4$, respectivamente?`,
              t`Negativo ($-$) para $x < 4$ e positivo ($+$) para $x > 4$`,
              [
                t`Positivo ($+$) para $x < 4$ e negativo ($-$) para $x > 4$`,
                t`Sempre positivo para $x \neq 4$`,
                t`Sempre negativo para $x \neq 4$`,
              ],
              t`Como o coeficiente de $x$ é positivo ($a=1>0$), a reta sobe: é negativa antes da raiz $4$ e positiva depois.`,
            ),
            tf(
              t`O fator $(x - 3)^2$ é estritamente positivo para todo $x \neq 3$ e não faz a expressão trocar de sinal ao passar por $x = 3$.`,
              true,
              t`Todo quadrado real é $\ge 0$, valendo zero apenas em $x = 3$.`,
            ),
            gen((rng) => {
              const a = randInt(rng, -5, 0);
              const b = randInt(rng, 1, 6);
              return rmcq(
                rng,
                t`Resolva a inequação $(${xm(a)})(${xm(b)}) < 0$ em notação de intervalo.`,
                t`$${iv(a, b, true, true)}$`,
                [
                  t`$${iv(a, b, false, false)}$`,
                  t`$(-\infty,\,${a})\cup(${b},\,\infty)$`,
                  t`$(-\infty,\,${a}]\cup[${b},\,\infty)$`,
                ],
                t`Raízes $${a}$ e $${b}$: o produto é estritamente negativo **entre** as raízes, $${iv(a, b, true, true)}$.`,
              );
            }),
            gen((rng) => {
              const a = randInt(rng, -5, 0);
              const b = randInt(rng, 1, 6);
              return rmcq(
                rng,
                t`Resolva $(${xm(a)})(${xm(b)}) \ge 0$.`,
                t`$(-\infty,\,${a}]\cup[${b},\,\infty)$`,
                [
                  t`$${iv(a, b, false, false)}$`,
                  t`$(-\infty,\,${a})\cup(${b},\,\infty)$`,
                  t`$${iv(a, b, true, true)}$`,
                ],
                t`O produto é positivo ou zero **fora** do intervalo entre as raízes, incluindo $${a}$ e $${b}$.`,
              );
            }),
            mcqS(
              t`Qual é o conjunto solução de $(x + 1)(x - 2)^2 \le 0$?`,
              t`$(-\infty,\,-1]\cup\{2\}$`,
              [t`$(-\infty,\,-1]$`, t`$[-1,\,2]$`, t`$(-\infty,\,2]$`],
              t`Para $x \neq 2$, $(x-2)^2 > 0$, então $(x+1)(x-2)^2 \le 0 \iff x+1 \le 0 \iff x \le -1$. Mas em $x=2$ o produto zera ($0 \le 0$ ✓), então o ponto isolado $x=2$ também entra!`,
            ),
            gen((rng) => {
              const a = randInt(rng, -4, 1);
              const b = a + randInt(rng, 2, 6);
              return num(
                t`Quantos números **inteiros** satisfazem $(${xm(a)})(${xm(b)}) \le 0$?`,
                b - a + 1,
                t`A solução é $[${a},\,${b}]$, que contém todos os inteiros de $${a}$ até $${b}$: $${b} - (${a}) + 1 = ${b - a + 1}$.`,
              );
            }),
            mcqS(
              t`Como $x^2 + 4 > 0$ para todo $x \in \mathbb R$, qual é o conjunto solução de $(x^2 + 4)(x - 5) < 0$?`,
              t`$(-\infty,\,5)$`,
              [t`$(-2,\,5)$`, t`$(-\infty,\,-2)\cup(2,\,5)$`, t`$\varnothing$`],
              t`O fator $x^2+4$ é sempre positivo e não tem raízes reais; logo o sinal do produto é idêntico ao sinal de $(x-5) < 0 \iff x < 5$.`,
            ),
          ],
        },
        {
          card: {
            title: 'O quadro (varal) de sinais',
            body: t`Para estudar o sinal de um produto ou quociente com vários fatores, alinhamos as raízes em ordem crescente e montamos o **varal de sinais** — uma linha para cada fator e a última para a regra de sinais.

Veja o varal para $E(x) = \dfrac{(x+2)(x-1)}{x-3}$ (raízes $-2,\ 1,\ 3$):`,
            visual: table(
              ['Fator \\ Trecho', 'x < -2', '-2 < x < 1', '1 < x < 3', 'x > 3'],
              [
                ['x + 2 (raiz -2)', '−', '+', '+', '+'],
                ['x − 1 (raiz 1)', '−', '−', '+', '+'],
                ['x − 3 (raiz 3, ≠0)', '−', '−', '−', '+'],
                ['E(x)', '−', '+', '−', '+'],
              ],
              [3],
            ),
            tip: t`Em inequações com $\le$ ou $\ge$, as raízes do **numerador** entram (bolinha cheia, colchete), mas as raízes do **denominador** ficam sempre de fora (bolinha aberta, parêntese)!`,
          },
          exercises: [
            mcqS(
              t`Consultando o quadro de sinais de $E(x) = \dfrac{(x+2)(x-1)}{x-3}$ acima, qual é a solução de $E(x) \le 0$?`,
              t`$(-\infty,\,-2]\cup[1,\,3)$`,
              [
                t`$(-\infty,\,-2]\cup[1,\,3]$`,
                t`$[-2,\,1]\cup(3,\,\infty)$`,
                t`$(-\infty,\,-2)\cup(1,\,3)$`,
              ],
              t`$E(x)$ é negativa nos trechos $x < -2$ e $1 < x < 3$. As raízes do numerador ($-2$ e $1$) entram com colchete; a do denominador ($3$) fica aberta!`,
            ),
            tf(
              t`Na inequação $\dfrac{x - 2}{x - 5} \le 0$, o valor $x = 5$ faz parte da solução por causa do sinal $\le$.`,
              false,
              t`Em $x = 5$ o denominador vale zero e a fração não existe. Raiz do denominador **nunca** entra na solução ($S = [2,\,5)$).`,
            ),
            match(
              t`No varal de sinais de $\dfrac{N(x)}{D(x)} \ge 0$, ligue cada caso ao que acontece na fronteira:`,
              [
                [t`Raiz apenas de $N(x)$`, t`Entra na solução (colchete)`],
                [t`Raiz de $D(x)$`, t`Não entra na solução (parêntese)`],
                [t`Fator com expoente ímpar`, t`O sinal troca ao passar pela raiz`],
                [t`Fator com expoente par`, t`O sinal se mantém ao passar pela raiz`],
              ],
              t`Denominador nunca zera; expoente ímpar inverte o sinal e expoente par preserva.`,
            ),
            gen((rng) => {
              const a = randInt(rng, -5, 0);
              const b = randInt(rng, 1, 6);
              return rmcq(
                rng,
                t`Resolva a inequação quociente $\dfrac{${xm(a)}}{${xm(b)}} \le 0$.`,
                t`$${iv(a, b, false, true)}$`,
                [
                  t`$${iv(a, b, false, false)}$`,
                  t`$${iv(a, b, true, false)}$`,
                  t`$(-\infty,\,${a}]\cup(${b},\,\infty)$`,
                ],
                t`Negativo entre $${a}$ e $${b}$; $${a}$ zera o numerador (fechado) e $${b}$ zera o denominador (aberto): $${iv(a, b, false, true)}$.`,
              );
            }),
            gen((rng) => {
              const a = randInt(rng, -5, 0);
              const b = randInt(rng, 1, 6);
              return rmcq(
                rng,
                t`Resolva $\dfrac{${xm(a)}}{${xm(b)}} \ge 0$.`,
                t`$(-\infty,\,${a}]\cup(${b},\,\infty)$`,
                [
                  t`$(-\infty,\,${a}]\cup[${b},\,\infty)$`,
                  t`$${iv(a, b, false, true)}$`,
                  t`$(-\infty,\,${a})\cup[${b},\,\infty)$`,
                ],
                t`Mesmo sinal fora do intervalo entre as raízes, com $${a}$ fechado (numerador) e $${b}$ aberto (denominador).`,
              );
            }),
            mcqS(
              t`Qual é o conjunto solução de $(x + 3)(x - 1)(x - 4) < 0$?`,
              t`$(-\infty,\,-3)\cup(1,\,4)$`,
              [
                t`$(-3,\,1)\cup(4,\,\infty)$`,
                t`$(-\infty,\,-3)\cup(4,\,\infty)$`,
                t`$(-3,\,4)$`,
              ],
              t`Para $x > 4$, os três fatores são positivos ($+$). Como todas as raízes têm multiplicidade $1$, os sinais da direita para a esquerda alternam: $+,\ -,\ +,\ -$.`,
            ),
            gen((rng) => {
              const b = randInt(rng, 1, 4);
              const a = randInt(rng, 1, 5);
              return rmcq(
                rng,
                t`Cuidado com o coeficiente negativo de $x$: resolva $\dfrac{${a} - x}{x + ${b}} > 0$.`,
                t`$${iv(-b, a, true, true)}$`,
                [
                  t`$(-\infty,\,-${b})\cup(${a},\,\infty)$`,
                  t`$${iv(-b, a, false, false)}$`,
                  t`$${iv(-a, b, true, true)}$`,
                ],
                t`O fator $${a}-x$ é positivo à **esquerda** de $${a}$ e $x+${b}$ é positivo à **direita** de $-${b}$. Os dois são positivos simultaneamente em $(-${b},\,${a})$.`,
              );
            }),
            num(
              t`Qual é a **soma** de todos os números **inteiros** que satisfazem $\dfrac{x - 1}{x - 5} \le 0$?`,
              10,
              t`A solução é $[1,\,5)$, então os inteiros são $1, 2, 3$ e $4$ ($5$ fica de fora pois zera o denominador!). Soma: $1+2+3+4 = 10$.`,
            ),
          ],
        },
        {
          card: {
            title: 'Inequações racionais gerais e domínio de funções',
            body: t`Quando o lado direito de uma inequação **não é zero**, como em $\dfrac{2x-1}{x-2} \le 1$:

**NUNCA multiplique cruzado por $(x-2)$!** Você não sabe se $x-2$ é positivo ou negativo (o que inverteria a desigualdade). O procedimento correto é:
1. Passe tudo para o lado esquerdo: $\dfrac{2x-1}{x-2} - 1 \le 0$
2. Tire o MMC em uma única fração: $\dfrac{(2x-1) - (x-2)}{x-2} = \dfrac{x+1}{x-2} \le 0$
3. Aplique o varal de sinais: $S = [-1,\,2)$.`,
            tip: t`Essa técnica é indispensável em Cálculo para achar o domínio de funções como $f(x) = \sqrt{\frac{P(x)}{Q(x)}}$ (exige $\frac{P(x)}{Q(x)} \ge 0$) e $g(x) = \ln\left(\frac{P(x)}{Q(x)}\right)$ (exige $\frac{P(x)}{Q(x)} > 0$).`,
          },
          exercises: [
            tf(
              t`Para resolver $\dfrac{1}{x} < 1$, basta multiplicar os dois lados por $x$ e concluir que $x > 1$.`,
              false,
              t`Errado! Se $x < 0$, multiplicar por $x$ inverte o sinal (e de fato todo $x < 0$ satisfaz $\frac{1}{x} < 0 < 1$). A solução correta é $(-\infty,\,0)\cup(1,\,\infty)$.`,
            ),
            order(
              t`Ordene os passos corretos para resolver $\dfrac{2x + 1}{x - 3} \ge 1$:`,
              [
                t`Subtrair $1$ dos dois lados: $\dfrac{2x+1}{x-3} - 1 \ge 0$`,
                t`Reduzir ao mesmo denominador: $\dfrac{(2x+1) - (x-3)}{x-3} \ge 0$`,
                t`Simplificar o numerador: $\dfrac{x + 4}{x - 3} \ge 0$`,
                t`Fazer o varal de sinais para obter $(-\infty,\,-4]\cup(3,\,\infty)$`,
              ],
              t`Deixe zero de um lado → junte em uma só fração → varal de sinais.`,
            ),
            mcqS(
              t`Qual é o conjunto solução de $\dfrac{1}{x} < 1$ em $\mathbb R$?`,
              t`$(-\infty,\,0)\cup(1,\,\infty)$`,
              [t`$(1,\,\infty)$`, t`$(0,\,1)$`, t`$(-\infty,\,1)$`],
              t`$\frac{1}{x} - 1 < 0 \iff \frac{1 - x}{x} < 0$. Raízes $0$ e $1$; negativo fora de $[0,\,1]$, logo $x < 0$ ou $x > 1$.`,
            ),
            gen((rng) => {
              const a = randInt(rng, 1, 5);
              const b = randInt(rng, 1, 5);
              return rmcq(
                rng,
                t`Resolva $\dfrac{x + ${a}}{x - ${b}} \le 1$.`,
                t`$(-\infty,\,${b})$`,
                [
                  t`$(-\infty,\,${b}]$`,
                  t`$[-${a},\,${b})$`,
                  t`$(${b},\,\infty)$`,
                ],
                t`Passando $1$ para a esquerda: $\frac{(x+${a})-(x-${b})}{x-${b}} = \frac{${a + b}}{x-${b}} \le 0$. Como $${a + b} > 0$, precisamos de $x - ${b} < 0 \iff x < ${b}$.`,
              );
            }),
            mcqS(
              t`Qual é o domínio real da função $f(x) = \sqrt{x^2 - 2x - 3}$?`,
              t`$(-\infty,\,-1]\cup[3,\,\infty)$`,
              [t`$[-1,\,3]$`, t`$(-\infty,\,-1)\cup(3,\,\infty)$`, t`$\mathbb R$`],
              t`O radicando deve ser $\ge 0$: $x^2-2x-3 = (x+1)(x-3) \ge 0 \iff x \le -1$ ou $x \ge 3$.`,
            ),
            gen((rng) => {
              const a = randInt(rng, -4, 0);
              const b = randInt(rng, 1, 5);
              return rmcq(
                rng,
                t`Qual é o domínio da função $f(x) = \sqrt{\dfrac{${xm(a)}}{${xm(b)}}}$?`,
                t`$(-\infty,\,${a}]\cup(${b},\,\infty)$`,
                [
                  t`$${iv(a, b, false, true)}$`,
                  t`$(-\infty,\,${a}]\cup[${b},\,\infty)$`,
                  t`$(-\infty,\,${a})\cup(${b},\,\infty)$`,
                ],
                t`Precisamos de $\frac{${xm(a)}}{${xm(b)}} \ge 0$ (e $x\neq ${b}$): fora do intervalo entre as raízes, com $${a}$ fechado e $${b}$ aberto.`,
              );
            }),
            mcqS(
              t`Qual é o domínio de $f(x) = \ln\left(\dfrac{x - 2}{x + 4}\right)$?`,
              t`$(-\infty,\,-4)\cup(2,\,\infty)$`,
              [
                t`$(-\infty,\,-4]\cup[2,\,\infty)$`,
                t`$(-4,\,2)$`,
                t`$(2,\,\infty)$`,
              ],
              t`O logaritmando deve ser **estritamente** positivo: $\frac{x-2}{x+4} > 0 \iff x < -4$ ou $x > 2$ (ambas as pontas abertas).`,
            ),
            num(
              t`Quantos números **inteiros** pertencem ao domínio de $f(x) = \sqrt{\dfrac{4 - x}{x + 2}}$?`,
              6,
              t`$\frac{4-x}{x+2} \ge 0 \iff x \in (-2,\,4]$. Os inteiros nesse intervalo são $-1, 0, 1, 2, 3, 4$, totalizando $6$ inteiros.`,
            ),
          ],
        },
      ],
    },

    /* ---------------- LIÇÃO 3: f-eq-mod ---------------- */
    {
      id: 'f-eq-mod',
      title: 'Módulo: distância, equações, inequações e limites',
      parts: [
        {
          card: {
            title: 'Definição e módulo como distância na reta',
            body: t`O **módulo** (ou valor absoluto) de um número real $x$ é definido por partes:

$$|x| = \begin{cases} x, & \text{se } x \ge 0 \\ -x, & \text{se } x < 0 \end{cases}$$

Geometricamente, $|x - a|$ mede a **distância** entre $x$ e $a$ na reta real! Na reta abaixo, o segmento verde mostra todos os pontos a distância $\le 3$ do centro $a = 1$ ($|x - 1| \le 3 \iff -2 \le x \le 4$):`,
            visual: {
              name: 'numberline',
              props: {
                min: -4,
                max: 6,
                step: 1,
                value: 1,
                marker: true,
                intervals: [{ a: -2, b: 4, color: C.success }],
              },
            },
            tip: t`Identidade fundamental: $\sqrt{x^2} = |x|$ (e não $x$!). Além disso, $|a\cdot b| = |a|\cdot |b|$, mas em geral $|a + b| \le |a| + |b|$ (desigualdade triangular).`,
          },
          exercises: [
            inter(
              t`Arraste o marcador na reta até o ponto **positivo** cuja distância ao número $1$ é exatamente $3$ (isto é, $|x - 1| = 3$ com $x > 0$).`,
              'numberline',
              { min: -4, max: 6, step: 1, value: 0, intervals: [{ a: -2, b: 4, color: C.p2 }] },
              (v: number) => v === 4,
              t`$x = 4$`,
              t`Os pontos a distância $3$ de $1$ são $1 - 3 = -2$ e $1 + 3 = 4$. O positivo é $4$.`,
            ),
            mcqS(
              t`Pela definição de módulo, se $x < 3$, como fica $|x - 3|$ sem as barras de módulo?`,
              t`$-x + 3$`,
              [t`$x - 3$`, t`$x + 3$`, t`$-x - 3$`],
              t`Se $x < 3$, então $x - 3 < 0$ (negativo). Pela definição, o módulo troca o sinal de tudo: $-(x - 3) = -x + 3$.`,
            ),
            tf(
              t`Para qualquer número real $x$, vale $\sqrt{x^2} = |x|$.`,
              true,
              t`Por exemplo, para $x = -5$, $\sqrt{(-5)^2} = \sqrt{25} = 5 = |-5|$.`,
            ),
            gen((rng) => {
              const a = randInt(rng, 2, 9);
              const b = randInt(rng, 1, 5);
              const c = b + randInt(rng, 2, 8);
              const ans = a - (c - b);
              return num(
                t`Calcule o valor de $|- ${a}| - |${b} - ${c}|$.`,
                ans,
                t`$|- ${a}| = ${a}$ e $|${b} - ${c}| = |-${c - b}| = ${c - b}$. Portanto, $${a} - ${c - b} = ${ans}$.`,
              );
            }),
            mcqS(
              t`Qual expressão em módulo representa "a distância entre $x$ e $-4$ na reta real"?`,
              t`$|x + 4|$`,
              [t`$|x - 4|$`, t`$|x| - 4$`, t`$|x| + 4$`],
              t`A distância entre $x$ e $a$ é $|x - a| = |x - (-4)| = |x + 4|$.`,
            ),
            gen((rng) => {
              const a = randNZ(rng, -5, 5);
              const r = randInt(rng, 1, 6);
              return num(
                t`Os dois números que satisfazem $|x ${term(-a, '')}| = ${r}$ estão à mesma distância de qual ponto central da reta?`,
                a,
                t`$|x - (${a})| = ${r}$ significa distância $${r}$ até o centro $a = ${a}$ (as soluções são $${a - r}$ e $${a + r}$, cujo ponto médio é $${a}$).`,
              );
            }),
            mcqS(
              t`Para $1 < x < 4$, simplifique a expressão $|x - 1| + |x - 4|$.`,
              t`$3$`,
              [t`$2x - 5$`, t`$-2x + 5$`, t`$5$`],
              t`Para $1 < x < 4$, temos $x-1 > 0 \Rightarrow |x-1| = x-1$ e $x-4 < 0 \Rightarrow |x-4| = 4-x$. Somando: $(x-1) + (4-x) = 3$ (a distância total entre $1$ e $4$!).`,
            ),
            num(
              t`Sabendo que $3 < \pi < 4$, calcule o valor exato de $|\pi - 4| + |\pi - 3|$.`,
              1,
              t`Como $\pi - 4 < 0$, $|\pi - 4| = 4 - \pi$. Como $\pi - 3 > 0$, $|\pi - 3| = \pi - 3$. Somando: $(4 - \pi) + (\pi - 3) = 1$.`,
            ),
          ],
        },
        {
          card: {
            title: 'Gráfico em "V" e equações modulares',
            body: t`O gráfico de $f(x) = |x - a| + b$ tem formato de **"V"** com vértice (bico) no ponto $(a,\,b)$, pois $|x - a|$ zera em $x = a$ e nunca é negativo.

Para resolver uma **equação modular** $|A(x)| = c$:
• Se $c < 0$: **não há solução** ($\varnothing$), pois módulo é sempre $\ge 0$.
• Se $c \ge 0$: abrimos em dois casos:
$$|A(x)| = c \iff A(x) = c \quad\text{ou}\quad A(x) = -c$$`,
            visual: absGraphLab(),
            example: t`$|2x - 1| = 5 \iff 2x - 1 = 5$ ($x = 3$) ou $2x - 1 = -5$ ($x = -2$).`,
          },
          exercises: [
            inter(
              t`No gráfico de $f(x) = |x - a| + b$, ajuste $a$ e $b$ para posicionar o vértice ("bico") no ponto $(-2,\,1)$.`,
              'plot',
              absGraphLab().props,
              (v: any) => v && near(v.p.a, -2, 0.05) && near(v.p.b, 1, 0.05),
              t`$a = -2$ e $b = 1$`,
              t`$f(x) = |x + 2| + 1$ tem vértice em $(-2,\,1)$.`,
            ),
            tf(
              t`A equação $|2x - 7| = -3$ possui duas soluções reais.`,
              false,
              t`O módulo de qualquer número real é $\ge 0$, logo nunca pode ser igual a $-3$. Conjunto solução vazio ($\varnothing$).`,
            ),
            gen((rng) => {
              const a = randInt(rng, -5, 5);
              const r = randInt(rng, 1, 8);
              return num(
                t`Resolva $|x ${term(-a, '')}| = ${r}$ e informe a **maior** solução.`,
                a + r,
                t`$x ${term(-a, '')} = ${r}$ ou $x ${term(-a, '')} = -${r}$, dando $x = ${a + r}$ ou $x = ${a - r}$. A maior é $${a + r}$.`,
              );
            }),
            gen((rng) => {
              const a = pick(rng, [2, 3]);
              const c = randInt(rng, 2, 10);
              // Solutions: x = (c - b)/a and (-c - b)/a => sum of solutions = -2b/a
              const bEven = a * randNZ(rng, -4, 4);
              const sumSol = (-2 * bEven) / a;
              return num(
                t`Quanto vale a **soma** das duas soluções reais da equação $|${a}x ${term(bEven, '')}| = ${c}$?`,
                sumSol,
                t`As soluções vêm de $${a}x ${term(bEven, '')} = ${c}$ e $${a}x ${term(bEven, '')} = -${c}$. Somando as duas equações: $${a}(x_1+x_2) ${term(2 * bEven, '')} = 0 \Rightarrow x_1 + x_2 = -\frac{${2 * bEven}}{${a}} = ${sumSol}$.`,
              );
            }),
            mcqS(
              t`Quais são as soluções da equação $|2x - 3| = 5$?`,
              t`$x = 4$ ou $x = -1$`,
              [t`$x = 4$ apenas`, t`$x = 4$ ou $x = 1$`, t`$x = -4$ ou $x = 1$`],
              t`$2x - 3 = 5 \Rightarrow x = 4$, ou $2x - 3 = -5 \Rightarrow 2x = -2 \Rightarrow x = -1$.`,
            ),
            mcqS(
              t`Resolva a equação com dois módulos $|2x - 1| = |x + 3|$.`,
              t`$x = 4$ ou $x = -\dfrac{2}{3}$`,
              [t`$x = 4$ apenas`, t`$x = -4$ ou $x = \dfrac{2}{3}$`, t`$x = 2$ ou $x = -1$`],
              t`$|A| = |B| \iff A = B$ ou $A = -B$. Logo $2x-1 = x+3 \Rightarrow x=4$, ou $2x-1 = -(x+3) \Rightarrow 3x = -2 \Rightarrow x = -\frac{2}{3}$.`,
            ),
            gen((rng) => {
              const a = randInt(rng, 4, 8);
              const b = randInt(rng, 1, a - 1);
              // ||x| - a| = b => |x| = a + b or |x| = a - b => max x is a + b
              return num(
                t`Qual é a **maior** solução real de $||x| - ${a}| = ${b}$?`,
                a + b,
                t`$|x| - ${a} = \pm ${b} \Rightarrow |x| = ${a + b}$ ou $|x| = ${a - b}$. As 4 soluções são $\pm ${a + b}$ e $\pm ${a - b}$; a maior é $${a + b}$.`,
              );
            }),
            num(
              t`Quantas soluções reais distintas possui a equação $|x|^2 - 3|x| + 2 = 0$?`,
              4,
              t`Fazendo $u = |x|$: $u^2 - 3u + 2 = 0 \Rightarrow u = 1$ ou $u = 2$. Assim $|x| = 1$ ($x = \pm 1$) ou $|x| = 2$ ($x = \pm 2$): são $4$ soluções reais!`,
            ),
          ],
        },
        {
          card: {
            title: 'Inequações modulares e a ponte com o ε-δ dos limites',
            body: t`Pense no módulo como distância ao centro $a$ com raio $r > 0$:

• **Menor que $r$ ("dentro")**:
$$|x - a| < r \iff -r < x - a < r \iff a - r < x < a + r$$

• **Maior que $r$ ("fora")**:
$$|x - a| > r \iff x - a < -r \ \text{ ou }\ x - a > r \iff x < a - r \ \text{ ou }\ x > a + r$$

Em Cálculo, a definição formal de $\lim_{x\to a} f(x) = L$ diz exatamente isso: para toda tolerância $\varepsilon > 0$ no eixo $y$ ($|f(x) - L| < \varepsilon$), existe um raio $\delta > 0$ no eixo $x$ tal que:
$$0 < |x - a| < \delta \implies |f(x) - L| < \varepsilon$$`,
            tip: t`Repare no $0 < |x - a|$: como $|x - a| = 0 \iff x = a$, escrever $0 < |x - a| < \delta$ significa "no intervalo $(a-\delta,\,a+\delta)$, **exceto** o próprio ponto $x = a$".`,
          },
          exercises: [
            match(
              t`Para $r > 0$, associe cada inequação modular ao seu conjunto de pontos:`,
              [
                [t`$|x - a| < r$`, t`Intervalo aberto $(a-r,\,a+r)$`],
                [t`$|x - a| \le r$`, t`Intervalo fechado $[a-r,\,a+r]$`],
                [t`$|x - a| > r$`, t`União $(-\infty,\,a-r)\cup(a+r,\,\infty)$`],
                [t`$0 < |x - a| < r$`, t`$(a-r,\,a+r)$ excluindo o centro $a$`],
              ],
              t`Menor que $r$ fica entre $a-r$ e $a+r$; maior que $r$ fica nas duas caudas externas.`,
            ),
            gen((rng) => {
              const a = randInt(rng, -4, 4);
              const r = randInt(rng, 1, 6);
              return rmcq(
                rng,
                t`Resolva a inequação modular $|${xm(a)}| < ${r}$.`,
                t`$${iv(a - r, a + r, true, true)}$`,
                [
                  t`$${iv(a - r, a + r, false, false)}$`,
                  t`$(-\infty,\,${a - r})\cup(${a + r},\,\infty)$`,
                  t`$${iv(-r, r, true, true)}$`,
                ],
                t`$-${r} < ${xm(a)} < ${r} \iff ${a - r} < x < ${a + r}$.`,
              );
            }),
            gen((rng) => {
              const a = randInt(rng, -4, 4);
              const r = randInt(rng, 1, 6);
              return rmcq(
                rng,
                t`Resolva $|${xm(a)}| \ge ${r}$.`,
                t`$(-\infty,\,${a - r}]\cup[${a + r},\,\infty)$`,
                [
                  t`$${iv(a - r, a + r, false, false)}$`,
                  t`$(-\infty,\,${a - r})\cup(${a + r},\,\infty)$`,
                  t`$[${a + r},\,\infty)$`,
                ],
                t`Distância $\ge ${r}$ até $${a}$: $x \le ${a - r}$ ou $x \ge ${a + r}$.`,
              );
            }),
            gen((rng) => {
              const a = randInt(rng, -5, 5);
              const r = randInt(rng, 1, 7);
              return num(
                t`Quantos números **inteiros** satisfazem $|${xm(a)}| \le ${r}$?`,
                2 * r + 1,
                t`O intervalo é $[${a - r},\,${a + r}]$, que tem $(${a + r}) - (${a - r}) + 1 = 2\cdot ${r} + 1 = ${2 * r + 1}$ inteiros (o centro $${a}$ mais $${r}$ para cada lado).`,
              );
            }),
            mcqS(
              t`Qual inequação modular descreve exatamente o intervalo aberto $(-1,\,7)$?`,
              t`$|x - 3| < 4$`,
              [t`$|x - 4| < 3$`, t`$|x + 3| < 4$`, t`$|x - 3| > 4$`],
              t`O centro do intervalo é o ponto médio $a = \frac{-1 + 7}{2} = 3$, e o raio (metade do comprimento) é $r = \frac{7 - (-1)}{2} = 4$: $|x - 3| < 4$.`,
            ),
            tf(
              t`Na definição formal de limite, a condição $0 < |x - a| < \delta$ inclui todos os pontos do intervalo $(a-\delta,\,a+\delta)$, exceto $x = a$.`,
              true,
              t`O $< \delta$ seleciona a vizinhança $(a-\delta,\,a+\delta)$, e o $0 < |x-a|$ exige $x \neq a$ (pois para o limite não importa o valor em $a$!).`,
            ),
            gen((rng) => {
              const k = pick(rng, [2, 4, 5]);
              const eps = k * pick(rng, [0.01, 0.02, 0.05, 0.1]);
              const delta = eps / k;
              return num(
                t`Para $f(x) = ${k}x + 1$ e $L = ${k * 2 + 1}$ em $a = 2$, temos $|f(x) - L| = |${k}x - ${2 * k}| = ${k}|x - 2|$. Qual é o maior $\delta$ que garante $|f(x) - L| < ${fmt(eps)}$ sempre que $0 < |x - 2| < \delta$?`,
                delta,
                t`Queremos $${k}|x - 2| < ${fmt(eps)} \iff |x - 2| < \frac{${fmt(eps)}}{${k}} = ${fmt(delta)}$. Logo $\delta = ${fmt(delta)}$.`,
                { tol: 0.0005 },
              );
            }),
            mcqS(
              t`Qual é o conjunto solução de $|x - 2| > -1$ em $\mathbb R$?`,
              t`$\mathbb R$ (todos os números reais)`,
              [t`$\varnothing$`, t`$(1,\,3)$`, t`$(2,\,\infty)$`],
              t`Como todo módulo é $\ge 0$, temos $|x - 2| \ge 0 > -1$ para **qualquer** número real $x$!`,
            ),
          ],
        },
      ],
    },

    /* ---------------- LIÇÃO 4: f-eq-sis ---------------- */
    {
      id: 'f-eq-sis',
      title: 'Sistemas lineares: 2×2, escalonamento 3×3 e discussão',
      parts: [
        {
          card: {
            title: 'Sistemas 2×2: substituição, adição e visão gráfica',
            body: t`Cada equação linear $ax + by = c$ representa uma **reta** no plano. Resolver um sistema $2\times 2$ é achar o ponto $(x,\,y)$ onde as duas retas se cruzam:

• **Substituição**: isole uma incógnita em uma equação e substitua na outra.
• **Adição (eliminação)**: multiplique as equações por constantes adequadas para que, ao somá-las, uma incógnita se cancele.

No laboratório abaixo, a reta rosa é $x + y = 2$. Ajuste $m$ e $b$ da reta azul $y = mx + b$:`,
            visual: sysLinesLab(),
            example: t`$\begin{cases}2x + y = 7 \\ x - y = 2\end{cases} \xrightarrow{+} 3x = 9 \Rightarrow x = 3$ e $y = 1$.`,
          },
          exercises: [
            inter(
              t`Com a reta rosa fixa em $x + y = 2$, ajuste $m = 1$ e o coeficiente linear $b$ da reta azul $y = mx + b$ para que as retas se cruzem em $P = (2,\,0)$.`,
              'plot',
              sysLinesLab().props,
              (v: any) => v && near(v.p.m, 1, 0.05) && near(v.p.b, -2, 0.05),
              t`$m = 1$ e $b = -2$`,
              t`Para $y = 1\cdot x + b$ passar por $(2,\,0)$, precisamos de $0 = 2 + b \Rightarrow b = -2$.`,
            ),
            mcqS(
              t`No método da adição para $\begin{cases}3x + 2y = 7 \\ 5x - 4y = 3\end{cases}$, a forma mais direta de eliminar $y$ é:`,
              t`Multiplicar a 1ª equação por $2$ e somar com a 2ª`,
              [
                t`Somar as duas equações diretamente sem multiplicar`,
                t`Multiplicar a 1ª equação por $5$ e somar com a 2ª`,
                t`Multiplicar a 2ª equação por $2$ e somar com a 1ª`,
              ],
              t`Multiplicando a 1ª por $2$, o termo $+2y$ vira $+4y$, que cancela exatamente com o $-4y$ da 2ª equação!`,
            ),
            gen((rng) => {
              const x0 = randInt(rng, -3, 5);
              const y0 = randInt(rng, -3, 5);
              const a = randInt(rng, 2, 4);
              const e1 = a * x0 + y0;
              const e2 = x0 - y0;
              return num(
                t`Resolva por adição o sistema $\begin{cases}${a}x + y = ${e1} \\ x - y = ${e2}\end{cases}$ e informe o valor de $x$.`,
                x0,
                t`Somando as duas equações o $y$ cancela: $(${a}+1)x = ${e1 + e2} \Rightarrow ${a + 1}x = ${e1 + e2} \Rightarrow x = ${x0}$.`,
              );
            }),
            gen((rng) => {
              const x0 = randInt(rng, 1, 6);
              const y0 = randInt(rng, 1, 6);
              const e1 = 2 * x0 + 3 * y0;
              const e2 = 3 * x0 + 2 * y0;
              return num(
                t`Sem precisar achar $x$ e $y$ separadamente, se $\begin{cases}2x + 3y = ${e1} \\ 3x + 2y = ${e2}\end{cases}$, quanto vale $x + y$?`,
                x0 + y0,
                t`Dica de ouro: some as duas equações! $5x + 5y = ${e1 + e2} \Rightarrow 5(x+y) = ${e1 + e2} \Rightarrow x+y = ${x0 + y0}$.`,
              );
            }),
            gen((rng) => {
              const i1 = randInt(rng, 2, 6);
              const i2 = randInt(rng, 1, 5);
              const tot = i1 + i2;
              const v = 4 * i1 - 2 * i2;
              return num(
                t`Em um circuito elétrico, as correntes $i_1$ e $i_2$ (em A) satisfazem $\begin{cases}i_1 + i_2 = ${tot} \\ 4i_1 - 2i_2 = ${v}\end{cases}$. Calcule a corrente $i_1$.`,
                i1,
                t`Multiplicando a 1ª por $2$ ($2i_1 + 2i_2 = ${2 * tot}$) e somando com a 2ª: $6i_1 = ${2 * tot + v} \Rightarrow i_1 = ${i1}$ A.`,
                { unit: 'A' },
              );
            }),
            num(
              t`Uma viga em equilíbrio estático tem reações verticais $R_A$ e $R_B$ tais que $\begin{cases}R_A + R_B = 120 \\ 2R_A - R_B = 0\end{cases}$ (em kN). Quanto vale $R_B$?`,
              80,
              t`Somando as equações: $3R_A = 120 \Rightarrow R_A = 40$ kN. Logo $R_B = 120 - 40 = 80$ kN.`,
              { unit: 'kN' },
            ),
            mcqS(
              t`Se durante a resolução de um sistema $2\times 2$ chegamos à identidade $0x + 0y = 0$, concluímos que as duas retas são:`,
              t`Coincidentes (sistema possível e indeterminado — SPI)`,
              [
                t`Paralelas distintas (sistema impossível — SI)`,
                t`Perpendiculares com interseção na origem $(0,\,0)$`,
                t`Concorrentes em um único ponto`,
              ],
              t`$0 = 0$ é sempre verdadeiro: uma equação é múltipla da outra (a mesma reta) e há infinitas soluções.`,
            ),
            num(
              t`Usando a mudança de variáveis $u = \dfrac{1}{x}$ e $v = \dfrac{1}{y}$, resolva $\begin{cases}\dfrac{2}{x} + \dfrac{1}{y} = 5 \\ \dfrac{1}{x} - \dfrac{1}{y} = 1\end{cases}$ e dê o valor de $x$.`,
              0.5,
              t`Em $u$ e $v$: $2u+v=5$ e $u-v=1$. Somando: $3u = 6 \Rightarrow u = 2$. Como $\frac{1}{x} = u = 2$, temos $x = \frac{1}{2} = 0{,}5$.`,
            ),
          ],
        },
        {
          card: {
            title: 'Sistemas 3×3 por escalonamento (eliminação de Gauss)',
            body: t`Para sistemas $3\times 3$ (ou maiores em Engenharia), o método padrão é o **escalonamento de Gauss**: usamos operações entre linhas ($L_i \leftarrow L_i + k\,L_j$) para zerar coeficientes abaixo da diagonal principal até deixar o sistema em **formato de escada (triangular)**.

Veja o sistema $\begin{cases}x + y + z = 6 \\ 2x + 3y + z = 11 \\ x - y + 2z = 5\end{cases}$ após zerar o $x$ das linhas 2 e 3 e depois o $y$ da linha 3:`,
            visual: table(
              ['Equação', 'x', 'y', 'z', '='],
              [
                ['L₁', '1', '1', '1', '6'],
                ['L₂ ← L₂ − 2L₁', '0', '1', '-1', '-1'],
                ['L₃ final', '0', '0', '3', '9'],
              ],
              [2],
            ),
            tip: t`Com o sistema escalonado, resolvemos **de baixo para cima** (retrossubstituição): da $L_3$ sai $3z = 9 \Rightarrow z = 3$; na $L_2$, $y - 3 = -1 \Rightarrow y = 2$; na $L_1$, $x + 2 + 3 = 6 \Rightarrow x = 1$.`,
          },
          exercises: [
            gen((rng) => {
              const z0 = randInt(rng, 1, 4);
              const y0 = randInt(rng, -2, 4);
              const x0 = randInt(rng, -3, 5);
              const k = randNZ(rng, -2, 3);
              const b2 = y0 + k * z0;
              const b1 = x0 + y0 + z0;
              return num(
                t`Resolva o sistema já escalonado $\begin{cases}x + y + z = ${b1} \\ y ${term(k, 'z')} = ${b2} \\ z = ${z0}\end{cases}$ de baixo para cima e informe o valor de $x$.`,
                x0,
                t`Com $z = ${z0}$, da 2ª equação tiramos $y = ${b2} - (${k})(${z0}) = ${y0}$. Da 1ª: $x = ${b1} - (${y0}) - (${z0}) = ${x0}$.`,
              );
            }),
            order(
              t`Ordene as etapas do escalonamento de Gauss para um sistema $3\times 3$:`,
              [
                t`Usar a 1ª equação (pivô em $x$) para eliminar $x$ da 2ª e da 3ª equação`,
                t`Usar a nova 2ª equação (pivô em $y$) para eliminar $y$ da 3ª equação`,
                t`Resolver a 3ª equação para encontrar $z$`,
                t`Fazer a retrossubstituição na 2ª e na 1ª equação para achar $y$ e $x$`,
              ],
              t`Elimine $x$ abaixo da linha 1 → elimine $y$ abaixo da linha 2 → suba substituindo $z$, depois $y$.`,
            ),
            mcqS(
              t`Em um sistema cuja 1ª linha é $L_1:\ x + 3y - z = 4$ e a 2ª linha é $L_2:\ 2x + 5y + z = 9$, qual operação elementar elimina o $x$ da linha 2?`,
              t`$L_2 \leftarrow L_2 - 2L_1$`,
              [
                t`$L_2 \leftarrow L_2 + 2L_1$`,
                t`$L_2 \leftarrow 2L_2 - L_1$`,
                t`$L_2 \leftarrow L_2 - 3L_1$`,
              ],
              t`Para zerar $2x$ usando $1x$ de $L_1$, subtraímos $2$ vezes $L_1$: $2x - 2(x) = 0$.`,
            ),
            tf(
              t`Multiplicar uma equação inteira por $0$ é uma operação elementar válida durante o escalonamento.`,
              false,
              t`Multiplicar uma linha por zero destrói a equação ($0 = 0$) e altera o conjunto solução! Só podemos multiplicar uma linha por constante $k \neq 0$.`,
            ),
            gen((rng) => {
              const a = randInt(rng, 2, 5);
              const b1 = randNZ(rng, -3, 4);
              const b2 = randInt(rng, -4, 6);
              const newY = b2 - a * b1;
              return num(
                t`Sendo $L_1:\ x ${term(b1, 'y')} + z = 2$ e $L_2:\ ${a}x ${term(b2, 'y')} - z = 5$, qual será o novo coeficiente de $y$ na linha 2 após fazermos $L_2 \leftarrow L_2 - ${a}L_1$?`,
                newY,
                t`Novo coeficiente de $y$: $${b2} - ${a}\cdot(${b1}) = ${newY}$.`,
              );
            }),
            gen((rng) => {
              const x0 = randInt(rng, 1, 5);
              const y0 = randInt(rng, 1, 5);
              const z0 = randInt(rng, 1, 5);
              const sAll = x0 + y0 + z0;
              const sXY = x0 + y0;
              const sYZ = y0 + z0;
              return num(
                t`No sistema $\begin{cases}x + y + z = ${sAll} \\ x + y = ${sXY} \\ y + z = ${sYZ}\end{cases}$, quanto vale $y$?`,
                y0,
                t`Subtraindo a 2ª da 1ª temos $z = ${sAll} - ${sXY} = ${z0}$. Então, na 3ª equação, $y = ${sYZ} - ${z0} = ${y0}$.`,
              );
            }),
            num(
              t`Resolva por escalonamento o sistema $\begin{cases}x + y + z = 6 \\ 2x + y - z = 1 \\ 3x - y + z = 4\end{cases}$ e informe o valor de $x$.`,
              1,
              t`Somando a 2ª e a 3ª equações, $y$ e $z$ se cancelam de imediato: $5x = 5 \Rightarrow x = 1$ (e depois $y = 2, z = 3$).`,
            ),
            num(
              t`Uma parábola $y = ax^2 + bx + c$ passa pelos pontos $(0,\,1)$, $(1,\,2)$ e $(-1,\,6)$. Montando o sistema nas incógnitas $a, b, c$, quanto vale $a$?`,
              3,
              t`De $(0,\,1)$ sai $c = 1$. De $(1,\,2)$ e $(-1,\,6)$ saem $a+b+1=2 \Rightarrow a+b=1$ e $a-b+1=6 \Rightarrow a-b=5$. Somando: $2a = 6 \Rightarrow a = 3$.`,
            ),
          ],
        },
        {
          card: {
            title: 'Classificação (SPD, SPI, SI) e discussão de sistemas',
            body: t`Ao final do escalonamento, olhe para a última equação $\alpha\cdot z = \beta$:

• **SPD** (*Possível e Determinado*): $\alpha \neq 0 \implies$ **uma única** solução ($z = \frac{\beta}{\alpha}$).
• **SPI** (*Possível e Indeterminado*): $0z = 0 \implies$ sobrou menos equações úteis que incógnitas; há **infinitas** soluções (com variável livre).
• **SI** (*Sistema Impossível*): $0z = \beta$ com $\beta \neq 0$ (ex.: $0 = 5$) $\implies$ absurdo, **nenhuma** solução ($\varnothing$).`,
            tip: t`Todo sistema **homogêneo** ($Ax = 0$, com todos os termos independentes nulos) é sempre possível, pois $(0,\,0,\,0)$ é sempre solução (a *solução trivial*). Ele só tem outras soluções se for **SPI**.`,
          },
          exercises: [
            match(
              t`Ligue a última linha obtida no escalonamento à classificação do sistema:`,
              [
                [t`$4z = 12$`, t`SPD (solução única)`],
                [t`$0z = 0$`, t`SPI (infinitas soluções)`],
                [t`$0z = -7$`, t`SI (nenhuma solução)`],
                [t`$3z = 0$`, t`SPD (com $z = 0$)`],
              ],
              t`Cuidado com $3z = 0$: o coeficiente de $z$ é $3 \neq 0$, logo $z = 0$ é determinado (SPD)! Só é SPI/SI quando o coeficiente de $z$ zera.`,
            ),
            tf(
              t`Todo sistema linear homogêneo (cujos termos independentes são todos iguais a zero) admite pelo menos uma solução.`,
              true,
              t`Substituindo todas as incógnitas por zero ($x = y = z = 0$), todas as equações dão $0 = 0$. Portanto um sistema homogêneo nunca é impossível!`,
            ),
            mcqS(
              t`Um sistema linear homogêneo $3\times 3$ possui soluções **não triviais** (diferentes de $(0,\,0,\,0)$) se, e somente se:`,
              t`For possível e indeterminado (SPI, com $\det A = 0$)`,
              [
                t`For possível e determinado (SPD, com $\det A \neq 0$)`,
                t`For impossível (SI)`,
                t`Tiver todas as constantes positivas`,
              ],
              t`Se for SPD, a única solução é a trivial $(0,\,0,\,0)$. Soluções não triviais (como autovetores em Álgebra Linear!) exigem $\det A = 0$ (SPI).`,
            ),
            gen((rng) => {
              const a = randNZ(rng, -5, 6);
              const b = randNZ(rng, 1, 8);
              return num(
                t`Após escalonar um sistema $3\times 3$, a 3ª linha ficou $(k ${term(-a, '')})z = ${b}$. Para qual valor de $k$ o sistema é **impossível (SI)**?`,
                a,
                t`Como o lado direito é $${b} \neq 0$, o sistema fica impossível ($0z = ${b}$) quando o coeficiente de $z$ zera: $k ${term(-a, '')} = 0 \Rightarrow k = ${a}$.`,
              );
            }),
            gen((rng) => {
              const a = randNZ(rng, -6, 6);
              return num(
                t`Se a última linha do escalonamento de um sistema é $(k^2 - ${a * a})z = k ${term(-a, '')}$, para qual valor de $k$ o sistema é **possível e indeterminado (SPI)**?`,
                a,
                t`Para ser SPI precisamos de $0z = 0$ ao mesmo tempo: $k^2 - ${a * a} = 0$ ($k = \pm ${Math.abs(a)}$) **e** $k ${term(-a, '')} = 0 \Rightarrow k = ${a}$. (Em $k = ${-a}$ daria $0z = ${-2 * a}$, que é SI!).`,
              );
            }),
            mcqS(
              t`No sistema escalonado $\begin{cases}x + y - z = 2 \\ y + 2z = 5\end{cases}$ (SPI), escolhendo $z = t \in \mathbb R$ como variável livre, qual é a solução geral $(x,\,y,\,z)$?`,
              t`$(-3 + 3t,\ 5 - 2t,\ t)$`,
              [
                t`$(2 + t,\ 5 - 2t,\ t)$`,
                t`$(-3 - 3t,\ 5 + 2t,\ t)$`,
                t`$(7 - t,\ 5 - 2t,\ t)$`,
              ],
              t`Da 2ª equação: $y = 5 - 2t$. Substituindo na 1ª: $x = 2 - y + z = 2 - (5 - 2t) + t = -3 + 3t$.`,
            ),
            gen((rng) => {
              const k = randInt(rng, 2, 5);
              const c = randInt(rng, 2, 7);
              return num(
                t`Para qual valor de $m$ o sistema $\begin{cases}x + 2y = ${c} \\ ${k}x + ${2 * k}y = m\end{cases}$ é **possível e indeterminado (SPI)**?`,
                k * c,
                t`A 2ª linha tem o lado esquerdo multiplicado por $${k}$; para ser SPI ($0 = 0$ após $L_2 \leftarrow L_2 - ${k}L_1$), o lado direito também deve ser multiplicado por $${k}$: $m = ${k}\cdot ${c} = ${k * c}$.`,
              );
            }),
            mcqS(
              t`No espaço 3D, cada equação linear $ax + by + cz = d$ representa um **plano**. Quando um sistema $3\times 3$ é **SPD**, os três planos se interceptam em:`,
              t`Um único ponto $(x_0,\,y_0,\,z_0)$`,
              [
                t`Uma reta comum`,
                t`Três retas paralelas`,
                t`Um plano`,
              ],
              t`Cada solução $(x,\,y,\,z)$ do sistema é um ponto comum aos três planos; sendo SPD, há exatamente um ponto de interseção.`,
            ),
          ],
        },
      ],
    },
  ],
};


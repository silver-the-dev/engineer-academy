import React from 'react';
import type { UnitDef } from '../../types';
import { gen, mcqS, num, tf, fill, match, order, inter, plot, table, rmcq, near, multi } from '../../helpers';
import { ArcW, CircleW, FnCurve, Label, Pt, RectW, Seg } from '../../../components/plot/Plot';
import { C } from '../../../theme';
import { fmt, fracTex, gcd, pick, randInt } from '../../../lib/random';

const t = String.raw;

const lcm = (a: number, b: number) => Math.abs(a * b) / (gcd(a, b) || 1);

/** Interactive fraction bar + pie showing p/q and its simplified form. */
const fracBarLab = (p0 = 3, q0 = 6) =>
  plot(
    {
      view: { xMin: -2.2, xMax: 6.4, yMin: -1.6, yMax: 1.6 },
      equalAspect: true,
      grid: false,
      axes: false,
      tickLabels: false,
      params: [
        { key: 'p', label: 'p (numerador)', min: 0, max: 12, step: 1, value: p0, color: C.p2, format: (v: number) => String(v) },
        { key: 'q', label: 'q (denominador)', min: 1, max: 12, step: 1, value: q0, color: C.p3, format: (v: number) => String(v) },
      ],
      render: ({ p }: any) => {
        const numP = Math.min(p.p, p.q);
        const denQ = p.q;
        const g = gcd(numP, denQ) || 1;
        const r = 1.15;
        const cx = -0.85;
        const cy = 0.05;
        const sectors: React.ReactNode[] = [];
        for (let i = 0; i < denQ; i++) {
          const a0 = Math.PI / 2 - ((i + 1) * 2 * Math.PI) / denQ;
          const a1 = Math.PI / 2 - (i * 2 * Math.PI) / denQ;
          if (i < numP) {
            sectors.push(<ArcW key={'a' + i} cx={cx} cy={cy} r={r} a0={a0} a1={a1} color={C.p2} width={1.5} fillOpacity={0.55} />);
          }
          if (denQ > 1) {
            sectors.push(<Seg key={'s' + i} x1={cx} y1={cy} x2={cx + r * Math.cos(a1)} y2={cy + r * Math.sin(a1)} color={C.border} width={1.5} />);
          }
        }
        const bw = 5.2 / denQ;
        const bars: React.ReactNode[] = [];
        for (let i = 0; i < denQ; i++) {
          bars.push(
            <RectW
              key={'b' + i}
              x={0.8 + i * bw}
              y={0.25}
              w={bw - 0.04}
              h={0.75}
              color={i < numP ? C.p2 : C.surface3}
              opacity={i < numP ? 0.75 : 0.45}
            />,
          );
        }
        const simpQ = denQ / g;
        const simpP = numP / g;
        const sbw = 5.2 / simpQ;
        const simpBars: React.ReactNode[] = [];
        for (let i = 0; i < simpQ; i++) {
          simpBars.push(
            <RectW
              key={'sb' + i}
              x={0.8 + i * sbw}
              y={-0.95}
              w={sbw - 0.04}
              h={0.75}
              color={i < simpP ? C.gold : C.surface3}
              opacity={i < simpP ? 0.75 : 0.45}
            />,
          );
        }
        return (
          <>
            <CircleW cx={cx} cy={cy} r={r} color={C.p3} width={2} />
            {sectors}
            {bars}
            {simpBars}
            <Label x={3.4} y={1.18} text={`Fração: ${numP}/${denQ}`} anchor="middle" color={C.p2} size={12} />
            <Label x={3.4} y={-1.25} text={`Irredutível (÷ MDC=${g}): ${simpP}/${simpQ}`} anchor="middle" color={C.gold} size={12} />
          </>
        );
      },
      info: ({ p }: any) => {
        const numP = Math.min(p.p, p.q);
        const denQ = p.q;
        const g = gcd(numP, denQ) || 1;
        return t`$\dfrac{${numP}}{${denQ}} = \dfrac{${numP}\div ${g}}{${denQ}\div ${g}} = ${fracTex(numP, denQ)} = ${fmt(numP / denQ, 3)}$`;
      },
    },
    250,
  );

/** Visual bar showing why 1/b + 1/d uses MMC(b, d) equal slices. */
const fracSumLab = () =>
  plot(
    {
      view: { xMin: -0.2, xMax: 6.2, yMin: -0.4, yMax: 3.4 },
      grid: false,
      axes: false,
      tickLabels: false,
      params: [
        { key: 'b', label: 'b (1º den.)', min: 2, max: 6, step: 1, value: 2, color: C.p2, format: (v: number) => String(v) },
        { key: 'd', label: 'd (2º den.)', min: 2, max: 6, step: 1, value: 3, color: C.p3, format: (v: number) => String(v) },
      ],
      render: ({ p }: any) => {
        const b = p.b;
        const d = p.d;
        const m = lcm(b, d);
        const W = 5.8;
        const row1: React.ReactNode[] = [];
        for (let i = 0; i < b; i++) {
          row1.push(<RectW key={'r1' + i} x={i * (W / b)} y={2.3} w={W / b - 0.04} h={0.65} color={i === 0 ? C.p2 : C.surface3} opacity={i === 0 ? 0.75 : 0.4} />);
        }
        const row2: React.ReactNode[] = [];
        for (let i = 0; i < d; i++) {
          row2.push(<RectW key={'r2' + i} x={i * (W / d)} y={1.3} w={W / d - 0.04} h={0.65} color={i === 0 ? C.p3 : C.surface3} opacity={i === 0 ? 0.75 : 0.4} />);
        }
        const n1 = m / b;
        const n2 = m / d;
        const row3: React.ReactNode[] = [];
        for (let i = 0; i < m; i++) {
          const col = i < n1 ? C.p2 : i < n1 + n2 ? C.p3 : C.surface3;
          const op = i < n1 + n2 ? 0.8 : 0.4;
          row3.push(<RectW key={'r3' + i} x={i * (W / m)} y={0.15} w={W / m - 0.03} h={0.7} color={col} opacity={op} />);
        }
        return (
          <>
            {row1}
            {row2}
            {row3}
            <Label x={W / 2} y={3.1} text={`1/${b} + 1/${d}  →  MMC(${b}, ${d}) = ${m} fatias iguais`} anchor="middle" color={C.gold} size={12} />
          </>
        );
      },
      info: ({ p }: any) => {
        const m = lcm(p.b, p.d);
        const n1 = m / p.b;
        const n2 = m / p.d;
        return t`$\dfrac{1}{${p.b}}+\dfrac{1}{${p.d}}=\dfrac{${n1}}{${m}}+\dfrac{${n2}}{${m}}=\dfrac{${n1 + n2}}{${m}}=${fracTex(n1 + n2, m)}$`;
      },
    },
    230,
  );

/** Plot of y = a^x highlighting the symmetry a^n and a^{-n} = 1/a^n. */
const negExpLab = (a0 = 2, n0 = 2) =>
  plot({
    view: { xMin: -3.5, xMax: 3.5, yMin: -0.8, yMax: 9.8 },
    params: [
      { key: 'a', label: 'a (base)', min: 1.5, max: 3, step: 0.5, value: a0, color: C.p1 },
      { key: 'n', label: 'n (expoente)', min: 1, max: 3, step: 1, value: n0, color: C.gold, format: (v: number) => String(v) },
    ],
    render: ({ p }: any) => {
      const yn = Math.pow(p.a, p.n);
      const yneg = Math.pow(p.a, -p.n);
      return (
        <>
          <FnCurve f={(x) => Math.pow(p.a, x)} color={C.p1} />
          <Seg x1={p.n} y1={0} x2={p.n} y2={yn} color={C.gold} dash="5 4" />
          <Seg x1={0} y1={yn} x2={p.n} y2={yn} color={C.gold} dash="5 4" />
          <Seg x1={-p.n} y1={0} x2={-p.n} y2={yneg} color={C.p5} dash="5 4" />
          <Seg x1={-p.n} y1={yneg} x2={0} y2={yneg} color={C.p5} dash="5 4" />
          <Pt x={0} y={1} color={C.p2} r={5} label="a⁰=1" dx={8} dy={-8} />
          <Pt x={p.n} y={yn} color={C.gold} r={6} label="aⁿ" dx={8} dy={-6} />
          <Pt x={-p.n} y={yneg} color={C.p5} r={6} label="a⁻ⁿ" dx={-28} dy={-10} />
        </>
      );
    },
    info: ({ p }: any) => {
      const yn = Math.pow(p.a, p.n);
      return t`$a^{${p.n}}=${fmt(yn, 3)}$ · $a^{-${p.n}}=\dfrac{1}{a^{${p.n}}}=\dfrac{1}{${fmt(yn, 3)}}=${fmt(1 / yn, 3)}$ · produto $a^n\cdot a^{-n}=1$`;
    },
  });

/** Geometric square decomposition showing sqrt(k^2 * m) = k * sqrt(m). */
const radicalSquareLab = (k0 = 2, m0 = 3) =>
  plot(
    {
      view: { xMin: -0.8, xMax: 9.8, yMin: -1.4, yMax: 6.6 },
      equalAspect: true,
      grid: false,
      tickLabels: false,
      params: [
        { key: 'k', label: 'k (fator externo)', min: 1, max: 4, step: 1, value: k0, color: C.p2, format: (v: number) => String(v) },
        { key: 'm', label: 'm (radicando)', min: 2, max: 5, step: 1, value: m0, color: C.gold, format: (v: number) => String(v) },
      ],
      render: ({ p }: any) => {
        const K = p.k;
        // the k×k grid always fills the widget; each small square stands for area m (side √m)
        const s = 6.2 / K;
        const x0 = 1.6; // centres the 6.2-wide grid
        const cells: React.ReactNode[] = [];
        for (let r = 0; r < K; r++) {
          for (let c = 0; c < K; c++) {
            const isCorner = r === 0 && c === 0;
            cells.push(
              <RectW
                key={`${r}-${c}`}
                x={x0 + c * s}
                y={r * s}
                w={s}
                h={s}
                color={isCorner ? C.gold : C.p2}
                opacity={isCorner ? 0.55 : 0.28}
              />,
            );
          }
        }
        const tot = K * s;
        return (
          <>
            {cells}
            <Label x={x0 + s / 2} y={s / 2} dy={4} text={`área ${p.m}`} anchor="middle" color={C.gold} size={K > 3 ? 11 : 13} />
            <Label x={x0 + tot / 2} y={-0.7} text={`lado total = ${K}·√${p.m} ≈ ${fmt(K * Math.sqrt(p.m), 2)}`} anchor="middle" color={C.p2} size={13} />
          </>
        );
      },
      info: ({ p }: any) => {
        const N = p.k * p.k * p.m;
        return t`Área total $= ${p.k}^2\cdot ${p.m} = ${N}$ ⟹ lado $\sqrt{${N}} = \sqrt{${p.k * p.k}\cdot ${p.m}} = ${p.k}\sqrt{${p.m}}$`;
      },
    },
    255,
  );

/** Plot of f(x) = (sqrt(x) - sqrt(a)) / (x - a) = 1 / (sqrt(x) + sqrt(a)) showing how rationalization removes 0/0. */
const conjugateLimitLab = () =>
  plot({
    view: { xMin: -0.5, xMax: 10, yMin: -0.05, yMax: 0.75 },
    params: [{ key: 'a', label: 'a', min: 1, max: 9, step: 1, value: 4, color: C.gold, format: (v: number) => String(v) }],
    render: ({ p }: any) => {
      const a = p.a;
      const yLim = 1 / (2 * Math.sqrt(a));
      return (
        <>
          <FnCurve f={(x) => (x >= 0 ? 1 / (Math.sqrt(x) + Math.sqrt(a)) : NaN)} from={0} color={C.p2} />
          <Seg x1={a} y1={0} x2={a} y2={yLim} color={C.gold} dash="5 4" />
          <Seg x1={0} y1={yLim} x2={a} y2={yLim} color={C.gold} dash="5 4" />
          <Pt x={a} y={yLim} color={C.gold} hollow r={6} label="0/0 racionalizado" dx={10} dy={-8} />
        </>
      );
    },
    info: ({ p }: any) => {
      const sa = Math.sqrt(p.a);
      return t`$\dfrac{\sqrt{x}-\sqrt{${p.a}}}{x-${p.a}}=\dfrac{1}{\sqrt{x}+\sqrt{${p.a}}}$ ⟹ em $x=${p.a}$, tende a $\dfrac{1}{2\sqrt{${p.a}}}=${ fmt(1 / (2 * sa), 3)}$`;
    },
  });

/** Logarithmic scale lab for scientific notation a * 10^n. */
const sciScaleLab = (a0 = 3, n0 = 3) =>
  plot(
    {
      view: { xMin: -9.8, xMax: 10.5, yMin: -1.3, yMax: 1.5 },
      grid: false,
      axes: false,
      tickLabels: false,
      params: [
        { key: 'a', label: 'a (mantissa)', min: 1, max: 9.5, step: 0.5, value: a0, color: C.p2 },
        { key: 'n', label: 'n (expoente)', min: -9, max: 9, step: 1, value: n0, color: C.gold, format: (v: number) => String(v) },
      ],
      render: ({ p }: any) => {
        const pos = p.n + Math.log10(p.a);
        const og = p.a >= Math.sqrt(10) ? p.n + 1 : p.n;
        const marks: [number, string][] = [
          [-9, 'n (10⁻⁹)'],
          [-6, 'μ (10⁻⁶)'],
          [-3, 'm (10⁻³)'],
          [0, '10⁰'],
          [3, 'k (10³)'],
          [6, 'M (10⁶)'],
          [9, 'G (10⁹)'],
        ];
        return (
          <>
            <Seg x1={-9.2} y1={0} x2={9.8} y2={0} color={C.plotAxis} width={2.5} />
            {marks.map(([x, lbl]) => (
              <React.Fragment key={x}>
                <Seg x1={x} y1={-0.2} x2={x} y2={0.2} color={C.textMuted} width={2} />
                <Label x={x} y={-0.55} text={lbl} anchor="middle" color={C.textDim} size={10} />
              </React.Fragment>
            ))}
            <Pt x={og} y={0} color={C.p5} r={8} hollow />
            <Pt x={pos} y={0} color={C.gold} r={6} label={`${fmt(p.a)}×10^(${p.n})`} dx={0} dy={-16} />
          </>
        );
      },
      info: ({ p }: any) => {
        const og = p.a >= Math.sqrt(10) ? p.n + 1 : p.n;
        return t`Número: $${fmt(p.a)}\times 10^{${p.n}}$ · como $${fmt(p.a)} ${p.a >= Math.sqrt(10) ? '\\ge' : '<'} \sqrt{10}\approx 3{,}16$, a ordem de grandeza é $10^{${og}}$`;
      },
    },
    210,
  );

export const aritmetica: UnitDef = {
  id: 'f-arit',
  title: 'Aritmética essencial',
  subtitle: 'Frações, potências, radicais e notação científica',
  icon: '➗',
  source: 'Competências Básicas · Aritmética',
  guide: t`Antes da álgebra e do Cálculo, toda conta passa por **frações**, **manipulação de potências**, **racionalização de radicais** e **notação científica com prefixos do SI**. Dominar essas ferramentas evita os erros algébricos mais comuns na engenharia.`,
  lessons: [
    {
      id: 'f-arit-frac',
      title: 'Frações',
      parts: [
        {
          card: {
            title: 'Parte de um todo e equivalência',
            body: t`Na fração $\dfrac{p}{q}$ (com $q\ne 0$), o **denominador** $q$ indica em quantas partes iguais o inteiro foi dividido, e o **numerador** $p$ conta quantas partes tomamos.

Multiplicar ou dividir $p$ e $q$ pelo **mesmo número** não altera o valor — gera **frações equivalentes**. Dividindo ambos pelo $\operatorname{mdc}(p,\,q)$, chegamos à **forma irredutível**:`,
            visual: fracBarLab(),
            formula: t`\frac{p}{q}=\frac{p\div d}{q\div d},\qquad d=\operatorname{mdc}(p,\,q)`,
            example: t`$\dfrac{18}{24}=\dfrac{18\div 6}{24\div 6}=\dfrac{3}{4}$ e o número misto $2\dfrac{3}{5}=2+\dfrac{3}{5}=\dfrac{13}{5}$.`,
            tip: t`Nunca "simplifique" somas! Em $\dfrac{4+3}{4}$, o $4$ **não** pode ser cancelado; só fatores que multiplicam tudo em cima e embaixo podem ser cancelados.`,
          },
          exercises: [
            inter(
              t`Ajuste os controles $p$ e $q$ para montar a fração com denominador $q=8$ que é equivalente a $\dfrac{3}{4}$.`,
              'plot',
              fracBarLab(2, 5).props,
              (v) => v && v.p.p === 6 && v.p.q === 8,
              t`$p=6$ e $q=8$, pois $\dfrac{3\cdot 2}{4\cdot 2}=\dfrac{6}{8}$.`,
              t`Multiplicando numerador e denominador de $\frac{3}{4}$ por $2$, obtemos $\frac{6}{8}$.`,
            ),
            gen((rng) => {
              const w = randInt(rng, 1, 4);
              const q = pick(rng, [3, 4, 5, 7, 8]);
              const r = randInt(rng, 1, q - 1);
              return rmcq(
                rng,
                t`Converta o número misto $${w}\dfrac{${r}}{${q}}$ (isto é, $${w}+\dfrac{${r}}{${q}}$) em uma fração imprópria.`,
                t`$\dfrac{${w * q + r}}{${q}}$`,
                [t`$\dfrac{${w + r}}{${q}}$`, t`$\dfrac{${w * r}}{${q}}$`, t`$\dfrac{${w * q - r}}{${q}}$`, t`$\dfrac{${q}}{${w * q + r}}$`],
                t`Cada inteiro tem $${q}$ partes de $\frac{1}{${q}}$: $${w}+\frac{${r}}{${q}}=\frac{${w}\cdot ${q}+${r}}{${q}}=\frac{${w * q + r}}{${q}}$.`,
              );
            }),
            gen((rng) => {
              const [p, q] = pick(rng, [
                [2, 3],
                [3, 4],
                [2, 5],
                [3, 5],
                [4, 7],
                [5, 8],
              ]);
              const g = randInt(rng, 2, 7);
              return num(
                t`Qual é o máximo divisor comum $\operatorname{mdc}(${p * g},\,${q * g})$ usado para simplificar a fração $\dfrac{${p * g}}{${q * g}}$?`,
                g,
                t`Como $\operatorname{mdc}(${p},\,${q})=1$, o maior divisor comum de $${p * g}$ e $${q * g}$ é $${g}$, levando à forma irredutível $\frac{${p}}{${q}}$.`,
              );
            }),
            gen((rng) => {
              const [p, q] = pick(rng, [
                [3, 5],
                [2, 7],
                [4, 9],
                [5, 6],
                [3, 8],
                [7, 10],
              ]);
              const g = randInt(rng, 3, 6);
              return rmcq(
                rng,
                t`Qual é a forma irredutível da fração $\dfrac{${p * g}}{${q * g}}$?`,
                t`$\dfrac{${p}}{${q}}$`,
                [t`$\dfrac{${p * g}}{${q}}$`, t`$\dfrac{${p}}{${q * g}}$`, t`$\dfrac{${q}}{${p}}$`, t`$\dfrac{${p + 1}}{${q + 1}}$`],
                t`Dividindo numerador e denominador por $\operatorname{mdc}(${p * g},\,${q * g})=${g}$, obtemos $\frac{${p}}{${q}}$.`,
              );
            }),
            tf(
              t`Somar o mesmo número positivo ao numerador e ao denominador mantém a fração equivalente: por exemplo, $\dfrac{2}{3}=\dfrac{2+5}{3+5}=\dfrac{7}{8}$.`,
              false,
              t`Frações equivalentes surgem ao **multiplicar** ou **dividir** por um mesmo número não nulo. Somando $5$, temos $\frac{2}{3}\approx 0{,}667\ne \frac{7}{8}=0{,}875$.`,
            ),
            fill(
              t`Complete as igualdades sobre equivalência e simplificação:`,
              t`O $\operatorname{mdc}(18,\,24)$ é ___, logo a forma irredutível de $\dfrac{18}{24}$ tem numerador $3$ e denominador ___.`,
              ['6', '4'],
              ['3', '8', '12'],
              t`Dividindo $18$ e $24$ por $\operatorname{mdc}(18,\,24)=6$, obtemos $\frac{3}{4}$.`,
            ),
            gen((rng) => {
              const [a, b] = pick(rng, [
                [3, 4],
                [2, 5],
                [5, 6],
                [4, 7],
                [3, 8],
              ]);
              const k = randInt(rng, 3, 8);
              return num(
                t`Determine $x$ para que as frações sejam equivalentes: $\dfrac{${a}}{${b}}=\dfrac{x}{${b * k}}$.`,
                a * k,
                t`O denominador foi multiplicado por $${k}$ ($${b}\cdot ${k}=${b * k}$), logo $x=${a}\cdot ${k}=${a * k}$.`,
              );
            }),
            order(
              t`Ordene as frações da **menor para a maior**:`,
              [t`$\dfrac{1}{4}$`, t`$\dfrac{2}{5}$`, t`$\dfrac{3}{4}$`, t`$\dfrac{7}{5}$`],
              t`Em decimais (ou pelo $\operatorname{mmc}(4,\,5)=20$): $\frac{1}{4}=\frac{5}{20} < \frac{2}{5}=\frac{8}{20} < \frac{3}{4}=\frac{15}{20} < \frac{7}{5}=\frac{28}{20}$.`,
            ),
          ],
        },
        {
          card: {
            title: 'MMC, soma e subtração',
            body: t`Não podemos somar $\dfrac{1}{2}+\dfrac{1}{3}$ somando os denominadores, porque metades e terços têm **tamanhos diferentes**.

Primeiro convertemos para o mesmo denominador usando o **mínimo múltiplo comum** $m=\operatorname{mmc}(b,\,d)$. Em cada fração, dividimos $m$ pelo denominador antigo e multiplicamos pelo numerador:`,
            visual: fracSumLab(),
            formula: t`\frac{a}{b}\pm\frac{c}{d}=\frac{a\cdot(m/b)\pm c\cdot(m/d)}{m},\qquad m=\operatorname{mmc}(b,\,d)`,
            example: t`$\dfrac{5}{6}-\dfrac{1}{4}$: como $\operatorname{mmc}(6,\,4)=12$, fazemos $\dfrac{5\cdot 2 - 1\cdot 3}{12}=\dfrac{7}{12}$.`,
            tip: t`Atalho para somar inteiro com fração (muito usado ao derivar $x^n\to x^{n-1}$): $k\pm\dfrac{a}{b}=\dfrac{k\cdot b\pm a}{b}$. Ex.: $\dfrac{1}{2}-1=\dfrac{1-2}{2}=-\dfrac{1}{2}$.`,
          },
          exercises: [
            tf(
              t`$\dfrac{1}{2}+\dfrac{1}{3}=\dfrac{2}{5}$.`,
              false,
              t`$\frac{2}{5}=0{,}4$ é **menor** que $\frac{1}{2}=0{,}5$: somar um número positivo nunca diminui o resultado! Pelo $\operatorname{mmc}(2,\,3)=6$, temos $\frac{3}{6}+\frac{2}{6}=\frac{5}{6}$.`,
            ),
            gen((rng) => {
              const [a, b] = pick(rng, [
                [4, 6],
                [6, 8],
                [6, 9],
                [8, 12],
                [10, 15],
                [9, 12],
              ]);
              const m = lcm(a, b);
              return num(
                t`Qual é o mínimo múltiplo comum $\operatorname{mmc}(${a},\,${b})$?`,
                m,
                t`Os múltiplos de $${a}$ e de $${b}$ se encontram pela primeira vez em $${m}$ (ou $\frac{${a}\cdot ${b}}{\operatorname{mdc}(${a},\,${b})}=\frac{${a * b}}{${gcd(a, b)}}=${m}$).`,
              );
            }),
            gen((rng) => {
              const [b, d] = pick(rng, [
                [2, 3],
                [3, 4],
                [2, 5],
                [3, 5],
                [4, 6],
              ]);
              const a = randInt(rng, 1, b - 1);
              const c = randInt(rng, 1, d - 1);
              const m = lcm(b, d);
              const numAns = a * (m / b) + c * (m / d);
              return rmcq(
                rng,
                t`Calcule $\dfrac{${a}}{${b}}+\dfrac{${c}}{${d}}$ na forma irredutível.`,
                `$${fracTex(numAns, m)}$`,
                [
                  `$\\frac{${a + c}}{${b + d}}$`,
                  `$${fracTex(a + c, m)}$`,
                  `$${fracTex(numAns + 1, m)}$`,
                  `$${fracTex(a * c, m)}$`,
                ],
                t`Com $\operatorname{mmc}(${b},\,${d})=${m}$, temos $\frac{${a * (m / b)}+${c * (m / d)}}{${m}}=\frac{${numAns}}{${m}}=${fracTex(numAns, m)}$.`,
              );
            }),
            gen((rng) => {
              const q = pick(rng, [2, 3, 4, 5]);
              const p = pick(
                rng,
                [1, 3, 5, 7].filter((x) => x % q !== 0),
              );
              const ans = (p - q) / q;
              return num(
                t`Ao derivar $x^{${p}/${q}}$ no Cálculo, precisamos do expoente $\dfrac{${p}}{${q}}-1$. Quanto vale essa diferença? (pode responder em fração)`,
                ans,
                t`$\frac{${p}}{${q}}-1=\frac{${p}}{${q}}-\frac{${q}}{${q}}=\frac{${p - q}}{${q}}$.`,
              );
            }),
            gen((rng) => {
              const k = randInt(rng, 2, 5);
              const [a, b] = pick(rng, [
                [1, 3],
                [2, 3],
                [1, 4],
                [3, 4],
                [2, 5],
              ]);
              const numAns = k * b - a;
              return num(
                t`Calcule $${k}-\dfrac{${a}}{${b}}$. (fração ou decimal)`,
                numAns / b,
                t`$${k}-\frac{${a}}{${b}}=\frac{${k}\cdot ${b}-${a}}{${b}}=\frac{${numAns}}{${b}}$.`,
              );
            }),
            match(
              t`Ligue cada operação ao seu resultado irredutível:`,
              [
                [t`$\dfrac{1}{2}+\dfrac{1}{4}$`, t`$\dfrac{3}{4}$`],
                [t`$1-\dfrac{2}{5}$`, t`$\dfrac{3}{5}$`],
                [t`$\dfrac{5}{6}-\dfrac{1}{3}$`, t`$\dfrac{1}{2}$`],
                [t`$\dfrac{3}{4}-\dfrac{1}{3}$`, t`$\dfrac{5}{12}$`],
              ],
              t`Reduza ao mesmo denominador pelo MMC e simplifique o resultado final.`,
            ),
            gen((rng) => {
              const a = randInt(rng, 1, 3);
              const b = randInt(rng, 1, 2);
              const c = randInt(rng, 1, 5);
              const numAns = 3 * a + 2 * b - c;
              return num(
                t`Calcule $\dfrac{${a}}{2}+\dfrac{${b}}{3}-\dfrac{${c}}{6}$. (fração ou decimal)`,
                numAns / 6,
                t`Pelo $\operatorname{mmc}(2,\,3,\,6)=6$: $\frac{${3 * a}+${2 * b}-${c}}{6}=\frac{${numAns}}{6}=${fracTex(numAns, 6)}$.`,
              );
            }),
            num(
              t`Em uma liga metálica de engenharia, $\dfrac{2}{5}$ da massa é cobre, $\dfrac{1}{3}$ é zinco e o restante é níquel. Que fração da liga é níquel?`,
              4 / 15,
              t`Com $\operatorname{mmc}(5,\,3)=15$, cobre $+$ zinco $=\frac{6}{15}+\frac{5}{15}=\frac{11}{15}$. O restante é $1-\frac{11}{15}=\frac{4}{15}$.`,
            ),
          ],
        },
        {
          card: {
            title: 'Multiplicação, divisão e frações compostas',
            body: t`• **Multiplicação**: multiplica reto (numerador com numerador, denominador com denominador). Simplifique fatores comuns **antes** de multiplicar!
• **Divisão**: conserva a primeira fração e multiplica pelo **inverso** da segunda:

$$\frac{a}{b}\cdot\frac{c}{d}=\frac{a\cdot c}{b\cdot d}\qquad\quad \frac{\;\dfrac{a}{b}\;}{\dfrac{c}{d}}=\frac{a}{b}\cdot\frac{d}{c}=\frac{a\cdot d}{b\cdot c}$$`,
            example: t`$\dfrac{9}{10}\cdot\dfrac{5}{6}=\dfrac{3}{2}\cdot\dfrac{1}{2}=\dfrac{3}{4}$ (cancelando $9$ com $6$ por $3$, e $5$ com $10$ por $5$).`,
            tip: t`Atenção à posição do **traço principal**: $\dfrac{2}{\;3/5\;}=2\cdot\dfrac{5}{3}=\dfrac{10}{3}$, mas $\dfrac{\;2/3\;}{5}=\dfrac{2}{3}\cdot\dfrac{1}{5}=\dfrac{2}{15}$. Dividir por $\dfrac{1}{2}$ é o mesmo que **multiplicar por $2$**!`,
          },
          exercises: [
            gen((rng) => {
              const [a, c] = pick(rng, [
                [2, 5],
                [3, 7],
                [4, 9],
                [5, 8],
                [3, 10],
              ]);
              const b = randInt(rng, 3, 9);
              return num(
                t`Calcule $\dfrac{${a}}{${b}}\cdot\dfrac{${b}}{${c}}$. (fração ou decimal)`,
                a / c,
                t`Cancelando o fator comum $${b}$ em cima e embaixo, sobra diretamente $\frac{${a}}{${c}}=${fracTex(a, c)}$.`,
              );
            }),
            gen((rng) => {
              const [a, b] = pick(rng, [
                [2, 3],
                [3, 4],
                [2, 5],
                [4, 7],
              ]);
              const [c, d] = pick(rng, [
                [3, 5],
                [5, 2],
                [3, 7],
                [5, 6],
              ]);
              return rmcq(
                rng,
                t`Calcule $\dfrac{${a}}{${b}}\div\dfrac{${c}}{${d}}$ na forma irredutível.`,
                `$${fracTex(a * d, b * c)}$`,
                [
                  `$${fracTex(a * c, b * d)}$`,
                  `$${fracTex(b * c, a * d)}$`,
                  `$${fracTex(a + d, b + c)}$`,
                  `$${fracTex(a * d + 1, b * c)}$`,
                ],
                t`Multiplique a primeira pelo inverso da segunda: $\frac{${a}}{${b}}\cdot\frac{${d}}{${c}}=\frac{${a * d}}{${b * c}}=${fracTex(a * d, b * c)}$.`,
              );
            }),
            fill(
              t`Complete a regra da divisão de frações:`,
              t`Dividir por $\dfrac{1}{4}$ é o mesmo que multiplicar por ___, logo $\dfrac{5}{\;1/4\;}=$ ___.`,
              ['4', '20'],
              ['1/4', '5/4', '9'],
              t`$5\div\frac{1}{4}=5\cdot\frac{4}{1}=20$: cabem $20$ quartos dentro de $5$ inteiros.`,
            ),
            mcqS(
              t`Compare $A=\dfrac{3}{\;2/5\;}$ e $B=\dfrac{\;3/2\;}{5}$. Quais são os valores de $A$ e $B$?`,
              t`$A=\dfrac{15}{2}$ e $B=\dfrac{3}{10}$`,
              [t`$A=\dfrac{6}{5}$ e $B=\dfrac{6}{5}$`, t`$A=\dfrac{3}{10}$ e $B=\dfrac{15}{2}$`, t`$A=\dfrac{15}{2}$ e $B=\dfrac{15}{2}$`],
              t`Em $A$, o traço principal está abaixo do $3$: $A=3\cdot\frac{5}{2}=\frac{15}{2}$. Em $B$, está acima do $5$: $B=\frac{3}{2}\cdot\frac{1}{5}=\frac{3}{10}$.`,
            ),
            gen((rng) => {
              const n = randInt(rng, 2, 6);
              return num(
                t`Simplifique a fração composta $\dfrac{1+\dfrac{1}{${n}}}{1-\dfrac{1}{${n}}}$. (fração ou decimal)`,
                (n + 1) / (n - 1),
                t`Numerador: $\frac{${n}+1}{${n}}=\frac{${n + 1}}{${n}}$. Denominador: $\frac{${n}-1}{${n}}=\frac{${n - 1}}{${n}}$. Dividindo, os denominadores $${n}$ se cancelam: $\frac{${n + 1}}{${n - 1}}$.`,
              );
            }),
            gen((rng) => {
              const a = randInt(rng, 1, 4);
              const b = randInt(rng, 1, 4);
              const ans = (2 * a + b) / 3;
              return num(
                t`Calcule $\dfrac{\dfrac{${a}}{2}+\dfrac{${b}}{4}}{\dfrac{3}{4}}$. (fração ou decimal)`,
                ans,
                t`Multiplicando o numerador e o denominador por $4$, eliminamos as subfrações de uma vez: $\frac{2\cdot ${a}+${b}}{3}=\frac{${2 * a + b}}{3}=${fracTex(2 * a + b, 3)}$.`,
              );
            }),
            num(
              t`Calcule a fração contínua $1+\dfrac{1}{1+\dfrac{1}{2}}$. (fração ou decimal)`,
              5 / 3,
              t`De baixo para cima: $1+\frac{1}{2}=\frac{3}{2}$; o inverso de $\frac{3}{2}$ é $\frac{2}{3}$; somando $1$, temos $1+\frac{2}{3}=\frac{5}{3}$.`,
            ),
            mcqS(
              t`No cálculo da derivada de $f(x)=\dfrac{1}{x}$, aparece a expressão $\dfrac{\dfrac{1}{x}-\dfrac{1}{a}}{x-a}$ (com $x\ne a$). Simplificando essa fração composta, obtemos:`,
              t`$-\dfrac{1}{ax}$`,
              [t`$\dfrac{1}{ax}$`, t`$\dfrac{a-x}{ax}$`, t`$-\dfrac{x-a}{ax}$`],
              t`No numerador, $\frac{1}{x}-\frac{1}{a}=\frac{a-x}{ax}=-\frac{x-a}{ax}$. Dividindo por $(x-a)$, cancelamos $(x-a)$ e sobra $-\frac{1}{ax}$.`,
            ),
          ],
        },
      ],
    },
    {
      id: 'f-arit-pot',
      title: 'Potências: propriedades em profundidade',
      parts: [
        {
          card: {
            title: 'Manipulação algébrica e base comum',
            body: t`Relembrando as regras de mesma base ($a^m\cdot a^n=a^{m+n}$, $\frac{a^m}{a^n}=a^{m-n}$ e $(a^m)^n=a^{m\cdot n}$), três técnicas aparecem o tempo todo na engenharia:

1. **Reduzir à mesma base**: trocar $4^x$, $8^x$, $16^x$ por potências de $2$ ($2^{2x}$, $2^{3x}$, $2^{4x}$).
2. **Torre de expoentes vs. parênteses**: $a^{m^n}$ calcula-se de cima para baixo, então $2^{3^2}=2^9=512\ne (2^3)^2=2^6=64$.
3. **Colocar potência em evidência** em somas: $a^{n+k}+a^n = a^n(a^k+1)$.`,
            formula: t`a^{n+k}+a^n = a^n\cdot a^k + a^n\cdot 1 = a^n(a^k+1)`,
            example: t`$\dfrac{2^{n+3}+2^n}{2^n}=\dfrac{2^n(2^3+1)}{2^n}=8+1=9$ para qualquer $n$.`,
            tip: t`A metade de $2^{20}$ **não** é $2^{10}$ nem $1^{20}$: dividir por $2$ é dividir por $2^1$, portanto $\dfrac{2^{20}}{2^1}=2^{20-1}=2^{19}$!`,
          },
          exercises: [
            mcqS(
              t`Qual é a diferença entre $(2^3)^2$ e $2^{3^2}$?`,
              t`$(2^3)^2=2^6=64$, enquanto $2^{3^2}=2^9=512$`,
              [
                t`As duas valem $64$`,
                t`As duas valem $512$`,
                t`$(2^3)^2=512$, enquanto $2^{3^2}=64$`,
              ],
              t`Com parênteses multiplicamos os expoentes ($3\cdot 2=6$); sem parênteses resolvemos o expoente primeiro ($3^2=9$).`,
            ),
            gen((rng) => {
              const n = randInt(rng, 10, 40);
              return rmcq(
                rng,
                t`Qual potência representa a **metade** de $2^{${n}}$ (e o **triplo** de $3^{${n}}$)?`,
                t`$2^{${n - 1}}$ e $3^{${n + 1}}$`,
                [
                  t`$2^{${Math.floor(n / 2)}}$ e $9^{${n}}$`,
                  t`$1^{${n}}$ e $3^{${3 * n}}$`,
                  t`$2^{${n - 2}}$ e $3^{${n + 3}}$`,
                  t`$2^{${n + 1}}$ e $3^{${n - 1}}$`,
                ],
                t`Metade de $2^{${n}}$: $\frac{2^{${n}}}{2^1}=2^{${n - 1}}$. Triplo de $3^{${n}}$: $3^1\cdot 3^{${n}}=3^{${n + 1}}$.`,
              );
            }),
            gen((rng) => {
              const a = randInt(rng, 2, 5);
              const b = randInt(rng, 1, 3);
              const r = randInt(rng, 2, 5);
              const c = 2 * a + 3 * b - r;
              return num(
                t`Reduza à base $2$ e calcule $\dfrac{4^{${a}}\cdot 8^{${b}}}{2^{${c}}}$.`,
                2 ** r,
                t`$4^{${a}}=(2^2)^{${a}}=2^{${2 * a}}$ e $8^{${b}}=(2^3)^{${b}}=2^{${3 * b}}$. Logo $2^{${2 * a}+${3 * b}-${c}}=2^{${r}}=${2 ** r}$.`,
              );
            }),
            gen((rng) => {
              const a = randInt(rng, 2, 5);
              const b = randInt(rng, 2, 4);
              return rmcq(
                rng,
                t`Reescreva $9^{${a}x}\cdot 27^{${b}x}$ como uma única potência de base $3$.`,
                t`$3^{${2 * a + 3 * b}x}$`,
                [
                  t`$3^{${(a + b) * 2}x}$`,
                  t`$3^{${6 * a * b}x}$`,
                  t`$243^{${a + b}x}$`,
                  t`$3^{${a + b}x}$`,
                ],
                t`$9^{${a}x}=(3^2)^{${a}x}=3^{${2 * a}x}$ e $27^{${b}x}=(3^3)^{${b}x}=3^{${3 * b}x}$. Somando os expoentes: $3^{${2 * a + 3 * b}x}$.`,
              );
            }),
            gen((rng) => {
              const b = pick(rng, [2, 3, 5]);
              const k = randInt(rng, 1, 3);
              const ans = b ** k + 1;
              return num(
                t`Coloque $${b}^n$ em evidência e simplifique $\dfrac{${b}^{n+${k}}+${b}^n}{${b}^n}$.`,
                ans,
                t`$\frac{${b}^n(${b}^{${k}}+1)}{${b}^n}=${b}^{${k}}+1=${ans}$.`,
              );
            }),
            gen((rng) => {
              const m = randInt(rng, 2, 6);
              const k = randInt(rng, 1, 4);
              return num(
                t`Resolva para $x$: $2^{x+${k}}=8^{${m}}$.`,
                3 * m - k,
                t`Como $8^{${m}}=(2^3)^{${m}}=2^{${3 * m}}$, igualamos os expoentes: $x+${k}=${3 * m}\Rightarrow x=${3 * m - k}$.`,
              );
            }),
            match(
              t`Ligue cada expressão com base $5$ à sua forma equivalente:`,
              [
                [t`$5^{x+2}$`, t`$25\cdot 5^x$`],
                [t`$(5^x)^2$`, t`$5^{2x}$`],
                [t`$5^x+5^x+5^x+5^x+5^x$`, t`$5^{x+1}$`],
                [t`$\dfrac{5^{2x}}{5^x}$`, t`$5^x$`],
              ],
              t`Somar 5 parcelas iguais a $5^x$ é $5\cdot 5^x=5^{x+1}$; já $5^{x+2}=5^2\cdot 5^x=25\cdot 5^x$.`,
            ),
            gen((rng) => {
              const m = randInt(rng, 2, 5);
              const n = randInt(rng, 2, 4);
              const k = randInt(rng, 1, 2 * m - 1);
              return rmcq(
                rng,
                t`Simplifique $\dfrac{(a^{${m}}b^{${n}})^2}{a^{${k}}b^{${n}}}$ (com $a,\,b\ne 0$).`,
                t`$a^{${2 * m - k}}b^{${n}}$`,
                [
                  t`$a^{${m + 2 - k}}b^{${n}}$`,
                  t`$a^{${2 * m - k}}b^{${2 * n}}$`,
                  t`$a^{${2 * m + k}}b^{${n}}$`,
                  t`$a^{${m - k}}b^{2}$`,
                ],
                t`No numerador, $(a^{${m}}b^{${n}})^2=a^{${2 * m}}b^{${2 * n}}$. Subtraindo os expoentes do denominador: $a^{${2 * m}-${k}}b^{${2 * n}-${n}}=a^{${2 * m - k}}b^{${n}}$.`,
              );
            }),
          ],
        },
        {
          card: {
            title: 'Expoentes negativos e inversão no Cálculo',
            body: t`No gráfico de $y=a^x$, avançar $1$ unidade em $x$ **multiplica** $y$ por $a$; recuar $1$ unidade **divide** por $a$. Por isso $a^0=1$ e $a^{-n}=\dfrac{1}{a^n}$: $a^n$ e $a^{-n}$ são **inversos multiplicativos** ($a^n\cdot a^{-n}=a^0=1$).

No Cálculo, reescrevemos potências no denominador como expoentes negativos antes de derivar ou integrar:

$$\frac{c}{x^n}=c\cdot x^{-n}\qquad\quad \frac{a}{b\,x^n}=\frac{a}{b}\,x^{-n}$$`,
            visual: negExpLab(),
            example: t`$\dfrac{7}{3x^4}=\dfrac{7}{3}x^{-4}$ (apenas o $x$ sobe com expoente trocado; o $3$ continua no denominador!).`,
            tip: t`$(a+b)^{-1}=\dfrac{1}{a+b}$, que é **muito diferente** de $a^{-1}+b^{-1}=\dfrac{1}{a}+\dfrac{1}{b}=\dfrac{a+b}{ab}$.`,
          },
          exercises: [
            inter(
              t`No gráfico de $y=a^x$, ajuste a base $a$ e o expoente $n$ para visualizar $a^n=9$ e $a^{-n}=\dfrac{1}{9}$ com $n=2$.`,
              'plot',
              negExpLab(1.5, 1).props,
              (v) => v && near(v.p.a, 3, 0.05) && v.p.n === 2,
              t`$a=3$ e $n=2$, pois $3^2=9$ e $3^{-2}=\dfrac{1}{9}$.`,
              t`Com $a=3$ e $n=2$, os pontos destacados são $(2,\,9)$ e $(-2,\,\frac{1}{9})$.`,
            ),
            tf(
              t`Para quaisquer $a,\,b\ne 0$ com $a+b\ne 0$, vale $(a+b)^{-1}=a^{-1}+b^{-1}$.`,
              false,
              t`Teste com $a=1$ e $b=1$: $(1+1)^{-1}=2^{-1}=\frac{1}{2}$, mas $1^{-1}+1^{-1}=1+1=2$. Potência não se distribui na soma!`,
            ),
            mcqS(
              t`Para derivar $f(x)=\dfrac{5}{4x^3}$ sem usar a regra do quociente, reescrevemos a função na forma $c\cdot x^n$. Qual é essa forma?`,
              t`$\dfrac{5}{4}x^{-3}$`,
              [t`$5\cdot 4x^{-3}$`, t`$\dfrac{5}{4x^{-3}}$`, t`$(4x)^{-3}\cdot 5$`],
              t`O coeficiente numérico é $\frac{5}{4}$ e apenas $\frac{1}{x^3}$ vira $x^{-3}$: $\frac{5}{4}x^{-3}$.`,
            ),
            gen((rng) => {
              const [a, b] = pick(rng, [
                [2, 3],
                [2, 4],
                [3, 6],
                [2, 5],
                [3, 4],
              ]);
              const ans = (a * b) / (a + b);
              return num(
                t`Calcule $(${a}^{-1}+${b}^{-1})^{-1}$. (fração ou decimal)`,
                ans,
                t`Primeiro somamos as frações dentro dos parênteses: $\frac{1}{${a}}+\frac{1}{${b}}=\frac{${a + b}}{${a * b}}$. Depois invertemos o resultado: $\left(\frac{${a + b}}{${a * b}}\right)^{-1}=\frac{${a * b}}{${a + b}}${gcd(a * b, a + b) > 1 ? '=' + fracTex(a * b, a + b) : ''}$.`,
              );
            }),
            fill(
              t`Compare onde o expoente atua:`,
              t`A expressão $\dfrac{1}{2x^3}$ equivale a ___ $\cdot\, x^{-3}$, enquanto $(2x)^{-3}$ equivale a ___ $\cdot\, x^{-3}$.`,
              ['1/2', '1/8'],
              ['2', '-2', '8'],
              t`Em $\frac{1}{2x^3}$, o cubo pega só o $x$; em $(2x)^{-3}=\frac{1}{(2x)^3}=\frac{1}{8x^3}$, o cubo também eleva o $2$.`,
            ),
            gen((rng) => {
              const m = randInt(rng, 2, 6);
              const n = randInt(rng, 1, 5);
              return rmcq(
                rng,
                t`Simplifique $\dfrac{x^{-${m}}}{x^{-${n}}}$, escrevendo com um único expoente.`,
                t`$x^{${n - m}}$`,
                [
                  t`$x^{${-m - n}}$`,
                  t`$x^{${m - n}}$`,
                  t`$x^{${m * n}}$`,
                  t`$x^{${m + n}}$`,
                ],
                t`Subtraia o expoente de baixo do de cima (cuidado com o jogo de sinais!): $-${m}-(-${n})=-${m}+${n}=${n - m}$.`,
              );
            }),
            gen((rng) => {
              const a = randInt(rng, 2, 4);
              const b = randInt(rng, 2, 9);
              const c = randInt(rng, 2, 5);
              const ans = a * a - 1 + c;
              return num(
                t`Calcule $\left(\dfrac{1}{${a}}\right)^{-2}-(${b})^0+${c}^{-1}\cdot ${c}^2$.`,
                ans,
                t`$\left(\frac{1}{${a}}\right)^{-2}=${a}^2=${a * a}$, $(${b})^0=1$ e $${c}^{-1}\cdot ${c}^2=${c}^1=${c}$. Total: $${a * a}-1+${c}=${ans}$.`,
              );
            }),
            mcqS(
              t`Simplifique a expressão algébrica $\dfrac{x^{-1}+y^{-1}}{(xy)^{-1}}$ (para $x,\,y\ne 0$).`,
              t`$x+y$`,
              [t`$\dfrac{1}{x+y}$`, t`$xy$`, t`$\dfrac{x+y}{x^2y^2}$`],
              t`$\dfrac{\frac{1}{x}+\frac{1}{y}}{\frac{1}{xy}}=\dfrac{\frac{y+x}{xy}}{\frac{1}{xy}}=x+y$.`,
            ),
          ],
        },
        {
          card: {
            title: 'Expoentes fracionários e expressões do Cálculo',
            body: t`Juntando raízes ($\sqrt[n]{x^m}=x^{m/n}$) e expoentes negativos ($x^{-p}=\frac{1}{x^p}$), qualquer combinação de radicais e frações vira uma potência simples $x^p$:

$$\frac{1}{\sqrt{x}}=x^{-1/2}\qquad\quad \frac{1}{\sqrt[3]{x^2}}=x^{-2/3}\qquad\quad x\sqrt{x}=x^1\cdot x^{1/2}=x^{3/2}$$

Isso permite quebrar frações com raízes em somas de potências fáceis de derivar e integrar!`,
            formula: t`\frac{x^2+1}{\sqrt{x}}=\frac{x^2}{x^{1/2}}+\frac{1}{x^{1/2}}=x^{3/2}+x^{-1/2}`,
            example: t`$\sqrt{x\sqrt{x}}=\left(x\cdot x^{1/2}\right)^{1/2}=\left(x^{3/2}\right)^{1/2}=x^{3/4}$.`,
            tip: t`Quando colocar uma potência em evidência, escolha o **menor expoente**: em $x^{1/2}+x^{-1/2}=x^{-1/2}(x^1+1)=\dfrac{x+1}{\sqrt{x}}$, a raiz vai direto para o denominador!`,
          },
          exercises: [
            mcqS(
              t`Como reescrevemos $f(x)=\dfrac{1}{\sqrt[3]{x^2}}$ na forma de potência $x^p$ para aplicar a regra da potência no Cálculo?`,
              t`$x^{-2/3}$`,
              [t`$x^{-3/2}$`, t`$x^{2/3}$`, t`$-x^{2/3}$`],
              t`$\sqrt[3]{x^2}=x^{2/3}$, e como está no denominador o expoente fica negativo: $x^{-2/3}$.`,
            ),
            gen((rng) => {
              const k = randInt(rng, 2, 4);
              const [m, n] = pick(rng, [
                [2, 3],
                [3, 2],
                [3, 4],
              ]);
              const base = k ** n;
              const ans = k ** m;
              return num(
                t`Calcule $\left(\dfrac{1}{${base}}\right)^{-${m}/${n}}$.`,
                ans,
                t`O sinal negativo do expoente inverte a base: $(${base})^{${m}/${n}}=\left(\sqrt[${n}]{${base}}\right)^{${m}}=${k}^{${m}}=${ans}$.`,
              );
            }),
            gen((rng) => {
              const a = randInt(rng, 1, 4);
              const numExp = 2 * a - 1;
              return rmcq(
                rng,
                t`Reescreva $\dfrac{x^{${a}}+1}{\sqrt{x}}$ (para $x>0$) como soma de potências de $x$.`,
                t`$x^{${numExp}/2}+x^{-1/2}$`,
                [
                  t`$x^{${a}/2}+x^{-1/2}$`,
                  t`$x^{${numExp}/2}+x^{1/2}$`,
                  t`$x^{${2 * a + 1}/2}+x^{-1/2}$`,
                  t`$x^{${a - 1}}+1$`,
                ],
                t`Dividindo cada termo por $\sqrt{x}=x^{1/2}$: $x^{${a}-1/2}+x^{-1/2}=x^{${numExp}/2}+x^{-1/2}$.`,
              );
            }),
            multi(
              t`Quais das expressões abaixo são equivalentes a $x^{-3/2}$ (para $x>0$)?`,
              [t`$\dfrac{1}{\sqrt{x^3}}$`, t`$\dfrac{1}{x\sqrt{x}}$`, t`$\left(\dfrac{1}{x}\right)^{3/2}$`, t`$-\sqrt{x^3}$`, t`$\sqrt[3]{x^{-2}}$`],
              [0, 1, 2],
              t`$x^{-3/2}=\frac{1}{x^{3/2}}=\frac{1}{\sqrt{x^3}}=\frac{1}{x^1\cdot x^{1/2}}=\frac{1}{x\sqrt{x}}=\left(\frac{1}{x}\right)^{3/2}$. O sinal negativo no expoente inverte a base, não troca o sinal do resultado.`,
            ),
            gen((rng) => {
              const [m, n] = pick(rng, [
                [2, 3],
                [3, 2],
                [2, 4],
                [3, 3],
              ]);
              const p = n + 1;
              const q = m * n;
              return rmcq(
                rng,
                t`Simplifique os radicais aninhados $\sqrt[${m}]{x\cdot\sqrt[${n}]{x}}$ (com $x>0$) em uma única potência de $x$.`,
                t`$x^{${fracTex(p, q).replace('\\frac', '') === `${p}` ? p : `${p / (gcd(p, q) || 1)}/${q / (gcd(p, q) || 1)}`}}$`,
                [
                  t`$x^{1/${q}}$`,
                  t`$x^{2/${m + n}}$`,
                  t`$x^{${m + n}/${q}}$`,
                  t`$x^{${q}/${p}}$`,
                ],
                t`Por dentro: $x\cdot x^{1/${n}}=x^{${p}/${n}}$. Tirando a raiz de índice $${m}$ (dividindo o expoente por $${m}$): $x^{${p}/(${m}\cdot ${n})}=x^{${p}/${q}}${gcd(p, q) > 1 ? `=x^{${p / gcd(p, q)}/${q / gcd(p, q)}}` : ''}$.`,
              );
            }),
            gen((rng) => {
              const a = randInt(rng, 2, 9);
              const b = randInt(rng, 2, 9);
              return num(
                t`Simplifique e calcule $${a}^{3/2}\cdot ${a}^{-1/2} + ${b}^{-2/3}\cdot ${b}^{5/3}$.`,
                a + b,
                t`Somando os expoentes de mesma base: $\frac{3}{2}-\frac{1}{2}=1$ e $-\frac{2}{3}+\frac{5}{3}=1$. Logo sobra $${a}^1+${b}^1=${a + b}$.`,
              );
            }),
            order(
              t`Ordene as potências de $16$ da **menor para a maior**:`,
              [t`$16^{-1/2}$`, t`$16^{0}$`, t`$16^{1/4}$`, t`$16^{3/4}$`],
              t`$16^{-1/2}=\frac{1}{4}=0{,}25 < 16^0=1 < 16^{1/4}=2 < 16^{3/4}=2^3=8$.`,
            ),
            mcqS(
              t`Ao derivar $x\sqrt{x+1}$ pela regra do produto, surge $(x+1)^{1/2}+\dfrac{x}{2}(x+1)^{-1/2}$. Colocando $(x+1)^{-1/2}$ em evidência para juntar em uma única fração, obtemos:`,
              t`$\dfrac{3x+2}{2\sqrt{x+1}}$`,
              [t`$\dfrac{2x+1}{2\sqrt{x+1}}$`, t`$\dfrac{3x+1}{\sqrt{x+1}}$`, t`$\dfrac{x+2}{2(x+1)^{3/2}}$`],
              t`Como $(x+1)^{1/2}=(x+1)^{-1/2}\cdot(x+1)^1$, temos $(x+1)^{-1/2}\left[(x+1)+\frac{x}{2}\right]=\frac{1}{\sqrt{x+1}}\cdot\frac{2x+2+x}{2}=\frac{3x+2}{2\sqrt{x+1}}$.`,
            ),
          ],
        },
      ],
    },
    {
      id: 'f-arit-racio',
      title: 'Radicais e racionalização',
      parts: [
        {
          card: {
            title: 'Simplificação de radicais e denominadores monômios',
            body: t`Pela propriedade $\sqrt[n]{a\cdot b}=\sqrt[n]{a}\cdot\sqrt[n]{b}$, todo fator com potência perfeita sai do radical: $\sqrt{k^2\cdot m}=k\sqrt{m}$. Geometricamente, um quadrado de área $k^2 m$ é formado por $k\times k$ quadrados menores de área $m$ (lado $\sqrt{m}$):`,
            visual: radicalSquareLab(),
            formula: t`\frac{c}{\sqrt{a}}=\frac{c\sqrt{a}}{a}\qquad\quad \frac{c}{\sqrt[n]{a^k}}=\frac{c\,\sqrt[n]{a^{n-k}}}{a}`,
            example: t`Para racionalizar $\dfrac{6}{\sqrt[3]{2}}$, completamos o expoente do $2^1$ até $2^3$ multiplicando por $\dfrac{\sqrt[3]{2^2}}{\sqrt[3]{2^2}}$: $\dfrac{6\sqrt[3]{4}}{2}=3\sqrt[3]{4}$.`,
            tip: t`Só podemos somar ou subtrair **radicais semelhantes** (mesmo índice e mesmo radicando após simplificar): $\sqrt{12}+\sqrt{27}=2\sqrt{3}+3\sqrt{3}=5\sqrt{3}$.`,
          },
          exercises: [
            inter(
              t`Ajuste os controles $k$ e $m$ para decompor geometricamente $\sqrt{45}$ na forma $k\sqrt{m}$ (com $m$ sem fatores quadrados).`,
              'plot',
              radicalSquareLab(2, 2).props,
              (v) => v && v.p.k === 3 && v.p.m === 5,
              t`$k=3$ e $m=5$, pois $45=9\cdot 5=3^2\cdot 5\Rightarrow \sqrt{45}=3\sqrt{5}$.`,
              t`O quadrado de área $45$ se divide em $3\times 3=9$ quadrados de área $5$ e lado $\sqrt{5}$.`,
            ),
            gen((rng) => {
              const m = pick(rng, [2, 3, 5]);
              const a = randInt(rng, 3, 5);
              const b = randInt(rng, 2, 4);
              const c = randInt(rng, 1, a + b - 2);
              const res = a + b - c;
              return rmcq(
                rng,
                t`Simplifique $\sqrt{${a * a * m}}+\sqrt{${b * b * m}}-\sqrt{${c * c * m}}$.`,
                t`$${res}\sqrt{${m}}$`,
                [
                  t`$${a + b + c}\sqrt{${m}}$`,
                  t`$\sqrt{${(a * a + b * b - c * c) * m}}$`,
                  t`$${res}\sqrt{${3 * m}}$`,
                  t`$${res + 1}\sqrt{${m}}$`,
                ],
                t`Extraindo os quadrados perfeitos: $${a}\sqrt{${m}}+${b}\sqrt{${m}}-${c}\sqrt{${m}}=${res}\sqrt{${m}}$.`,
              );
            }),
            gen((rng) => {
              const k = randInt(rng, 2, 7);
              const m = pick(rng, [2, 3, 5, 6, 7]);
              return num(
                t`Calcule $\dfrac{\sqrt{${k * k * m}}}{\sqrt{${m}}}$.`,
                k,
                t`Pelo quociente de raízes de mesmo índice, $\sqrt{\frac{${k * k * m}}{${m}}}=\sqrt{${k * k}}=${k}$.`,
              );
            }),
            gen((rng) => {
              const m = pick(rng, [2, 3, 5, 7]);
              const b = randInt(rng, 2, 4);
              const k = randInt(rng, 2, 5);
              const numC = k * b * m;
              return rmcq(
                rng,
                t`Racionalize e simplifique $\dfrac{${numC}}{${b}\sqrt{${m}}}$.`,
                t`$${k}\sqrt{${m}}$`,
                [
                  t`$${k * b}\sqrt{${m}}$`,
                  t`$\dfrac{${k}\sqrt{${m}}}{${m}}$`,
                  t`$${k * m}\sqrt{${m}}$`,
                  t`$\dfrac{${numC}}{${b * m}}$`,
                ],
                t`Multiplicando por $\frac{\sqrt{${m}}}{\sqrt{${m}}}$, temos $\frac{${numC}\sqrt{${m}}}{${b * m}}=${k}\sqrt{${m}}$.`,
              );
            }),
            mcqS(
              t`Para racionalizar o denominador de $\dfrac{1}{\sqrt[3]{5}}$, devemos multiplicar o numerador e o denominador por:`,
              t`$\sqrt[3]{25}$`,
              [t`$\sqrt[3]{5}$`, t`$\sqrt{5}$`, t`$\sqrt[3]{125}$`],
              t`Como $\sqrt[3]{5}=\sqrt[3]{5^1}$, faltam dois fatores $5$ para completar o cubo $\sqrt[3]{5^3}=5$: multiplicamos por $\sqrt[3]{5^2}=\sqrt[3]{25}$.`,
            ),
            gen((rng) => {
              const p = pick(rng, [2, 3, 5, 7]);
              const k = randInt(rng, 2, 4);
              return rmcq(
                rng,
                t`Racionalize e simplifique $\dfrac{${k * p}}{\sqrt[3]{${p}}}$.`,
                t`$${k}\sqrt[3]{${p * p}}$`,
                [
                  t`$${k}\sqrt[3]{${p}}$`,
                  t`$${k * p}\sqrt[3]{${p * p}}$`,
                  t`$\dfrac{${k}\sqrt[3]{${p}}}{${p}}$`,
                  t`$${k}\sqrt{${p ** 3}}$`,
                ],
                t`Multiplicando em cima e embaixo por $\sqrt[3]{${p}^2}=\sqrt[3]{${p * p}}$: $\frac{${k * p}\sqrt[3]{${p * p}}}{${p}}=${k}\sqrt[3]{${p * p}}$.`,
              );
            }),
            fill(
              t`Complete a simplificação de radicais:`,
              t`Como $50=25\cdot 2$ e $8=4\cdot 2$, temos $\sqrt{50}-\sqrt{8}=$ ___$\sqrt{2}-2\sqrt{2}=$ ___$\sqrt{2}$.`,
              ['5', '3'],
              ['25', '7', '2'],
              t`$\sqrt{50}=5\sqrt{2}$ e $\sqrt{8}=2\sqrt{2}$; subtraindo os coeficientes, $5\sqrt{2}-2\sqrt{2}=3\sqrt{2}$.`,
            ),
            gen((rng) => {
              const a = pick(rng, [2, 3, 5, 6]);
              const b = pick(rng, [7, 8, 10, 11]);
              return num(
                t`Desenvolva o quadrado e calcule $(\sqrt{${a}}+\sqrt{${b}})^2-2\sqrt{${a * b}}$.`,
                a + b,
                t`Pelo produto notável, $(\sqrt{${a}}+\sqrt{${b}})^2=${a}+2\sqrt{${a * b}}+${b}$. Subtraindo $2\sqrt{${a * b}}$, sobra $${a}+${b}=${a + b}$.`,
              );
            }),
          ],
        },
        {
          card: {
            title: 'Conjugado e os limites do Cálculo',
            body: t`Quando o denominador (ou numerador) tem uma soma ou diferença com raízes quadradas, multiplicamos pelo **conjugado** ($\sqrt{A}\pm\sqrt{B}\leftrightarrow\sqrt{A}\mp\sqrt{B}$), usando o produto da soma pela diferença:

$$(\sqrt{A}-\sqrt{B})(\sqrt{A}+\sqrt{B})=(\sqrt{A})^2-(\sqrt{B})^2=A-B$$

No **Cálculo**, racionalizamos o **numerador** para destravar limites do tipo $\dfrac{0}{0}$:

$$\frac{\sqrt{x}-\sqrt{a}}{x-a}\cdot\frac{\sqrt{x}+\sqrt{a}}{\sqrt{x}+\sqrt{a}}=\frac{x-a}{(x-a)(\sqrt{x}+\sqrt{a})}=\frac{1}{\sqrt{x}+\sqrt{a}}$$`,
            visual: conjugateLimitLab(),
            example: t`$\dfrac{4}{\sqrt{7}-\sqrt{3}}=\dfrac{4(\sqrt{7}+\sqrt{3})}{7-3}=\sqrt{7}+\sqrt{3}$.`,
            tip: t`O conjugado troca apenas o sinal **entre** os dois termos do binômio: o conjugado de $\sqrt{x+2}-3$ é $\sqrt{x+2}+3$ (nunca troque o sinal dentro da raiz!).`,
          },
          exercises: [
            tf(
              t`O conjugado da expressão $\sqrt{x+5}-2$ é $\sqrt{x-5}+2$.`,
              false,
              t`O radicando $(x+5)$ é um bloco único e não muda! Troca-se apenas o sinal entre os termos do binômio: $\sqrt{x+5}+2$.`,
            ),
            gen((rng) => {
              const a = randInt(rng, 2, 4);
              const m = pick(rng, [2, 3, 5]);
              const b = randInt(rng, 1, 5);
              const ans = a * a * m - b * b;
              return num(
                t`Calcule o produto de conjugados $(${a}\sqrt{${m}}+${b})(${a}\sqrt{${m}}-${b})$.`,
                ans,
                t`$(${a}\sqrt{${m}})^2-${b}^2=${a * a}\cdot ${m}-${b * b}=${a * a * m}-${b * b}=${ans}$.`,
              );
            }),
            gen((rng) => {
              const [a, b] = pick(rng, [
                [5, 2],
                [7, 3],
                [6, 2],
                [10, 5],
                [11, 3],
              ]);
              const k = randInt(rng, 1, 3);
              const d = k * (a - b);
              const pref = k === 1 ? '' : `${k}`;
              return rmcq(
                rng,
                t`Racionalize e simplifique $\dfrac{${d}}{\sqrt{${a}}-\sqrt{${b}}}$.`,
                t`$${pref ? `${pref}(\\sqrt{${a}}+\\sqrt{${b}})` : `\\sqrt{${a}}+\\sqrt{${b}}`}$`,
                [
                  t`$${pref ? `${pref}(\\sqrt{${a}}-\\sqrt{${b}})` : `\\sqrt{${a}}-\\sqrt{${b}}`}$`,
                  t`$\dfrac{\sqrt{${a}}+\sqrt{${b}}}{${a - b}}$`,
                  t`$${d}(\sqrt{${a}}+\sqrt{${b}})$`,
                  t`$\sqrt{${a - b}}$`,
                ],
                t`Multiplicando pelo conjugado $\sqrt{${a}}+\sqrt{${b}}$, o denominador vira $${a}-${b}=${a - b}$, e $\frac{${d}}{${a - b}}=${k}$.`,
              );
            }),
            gen((rng) => {
              const n = randInt(rng, 2, 10);
              return rmcq(
                rng,
                t`Racionalize $\dfrac{1}{\sqrt{${n + 1}}+\sqrt{${n}}}$.`,
                t`$\sqrt{${n + 1}}-\sqrt{${n}}$`,
                [
                  t`$\sqrt{${n + 1}}+\sqrt{${n}}$`,
                  t`$\sqrt{${n}}-\sqrt{${n + 1}}$`,
                  t`$\dfrac{\sqrt{${n + 1}}-\sqrt{${n}}}{${2 * n + 1}}$`,
                  t`$\dfrac{1}{\sqrt{${n + 1}}-\sqrt{${n}}}$`,
                ],
                t`Pelo conjugado $\sqrt{${n + 1}}-\sqrt{${n}}$, o denominador fica $(${n + 1})-${n}=1$, sobrando $\sqrt{${n + 1}}-\sqrt{${n}}$.`,
              );
            }),
            num(
              t`Racionalize cada parcela e calcule a soma telescópica $\dfrac{1}{\sqrt{2}+1}+\dfrac{1}{\sqrt{3}+\sqrt{2}}+\dfrac{1}{\sqrt{4}+\sqrt{3}}$.`,
              1,
              t`Racionalizando: $(\sqrt{2}-1)+(\sqrt{3}-\sqrt{2})+(\sqrt{4}-\sqrt{3})=\sqrt{4}-1=2-1=1$ (os termos intermediários se cancelam!).`,
            ),
            mcqS(
              t`No Cálculo, substituir $x=9$ em $\dfrac{\sqrt{x}-3}{x-9}$ gera a indeterminação $\dfrac{0}{0}$. Racionalizando o **numerador**, para qual expressão equivalente (com $x\ne 9$) ela se simplifica?`,
              t`$\dfrac{1}{\sqrt{x}+3}$`,
              [t`$\dfrac{1}{\sqrt{x}-3}$`, t`$\sqrt{x}+3$`, t`$\dfrac{\sqrt{x}+3}{x-9}$`],
              t`Multiplicando por $\frac{\sqrt{x}+3}{\sqrt{x}+3}$, temos $\frac{x-9}{(x-9)(\sqrt{x}+3)}=\frac{1}{\sqrt{x}+3}$.`,
            ),
            gen((rng) => {
              const k = randInt(rng, 2, 6);
              const a = k * k;
              return num(
                t`Após racionalizar $\dfrac{\sqrt{x}-${k}}{x-${a}}=\dfrac{1}{\sqrt{x}+${k}}$ (para $x\ne ${a}$), calcule o valor limite dessa expressão quando $x$ se aproxima de $${a}$. (fração ou decimal)`,
                1 / (2 * k),
                t`Substituindo $x=${a}$ na forma racionalizada: $\frac{1}{\sqrt{${a}}+${k}}=\frac{1}{${k}+${k}}=\frac{1}{${2 * k}}$.`,
                { tol: 0.002 },
              );
            }),
            mcqS(
              t`Na definição da derivada de $f(x)=\sqrt{x}$, aparece o quociente $\dfrac{\sqrt{x+h}-\sqrt{x}}{h}$ (com $h\ne 0$). Racionalizando o numerador e cancelando $h$, obtemos:`,
              t`$\dfrac{1}{\sqrt{x+h}+\sqrt{x}}$`,
              [t`$\dfrac{1}{\sqrt{x+h}-\sqrt{x}}$`, t`$\dfrac{2x+h}{h(\sqrt{x+h}+\sqrt{x})}$`, t`$\sqrt{x+h}+\sqrt{x}$`],
              t`No numerador, $(\sqrt{x+h}-\sqrt{x})(\sqrt{x+h}+\sqrt{x})=(x+h)-x=h$. Cancelando $h$ com o denominador, resta $\frac{1}{\sqrt{x+h}+\sqrt{x}}$.`,
            ),
          ],
        },
      ],
    },
    {
      id: 'f-arit-cient',
      title: 'Notação científica e ordens de grandeza',
      parts: [
        {
          card: {
            title: 'Notação científica e normalização',
            body: t`Na engenharia, grandezas muito grandes ou muito pequenas são escritas em **notação científica**:

$$N = a\times 10^n,\qquad 1\le |a| < 10,\quad n\in\mathbb Z$$

Se após uma conta a mantissa $a$ sair do intervalo $[1,\,10)$, **normalizamos**: deslocar a vírgula $k$ casas para a **esquerda** (diminuindo a mantissa) **soma $k$** ao expoente; para a **direita**, **subtrai $k$**.`,
            visual: sciScaleLab(),
            example: t`$(4\times 10^5)\cdot(7\times 10^3)=28\times 10^8 = 2{,}8\times 10^9$ e $0{,}05\times 10^{-2}=5\times 10^{-4}$.`,
            tip: t`Para **somar ou subtrair** em notação científica, primeiro iguale as potências de $10$: $3{,}2\times 10^5 + 5\times 10^4 = 3{,}2\times 10^5 + 0{,}5\times 10^5 = 3{,}7\times 10^5$.`,
          },
          exercises: [
            inter(
              t`Ajuste a mantissa $a$ e o expoente $n$ no laboratório para representar $0{,}0025$ em notação científica padrão.`,
              'plot',
              sciScaleLab(5, 2).props,
              (v) => v && near(v.p.a, 2.5, 0.05) && v.p.n === -3,
              t`$a=2{,}5$ e $n=-3$, pois $0{,}0025=2{,}5\times 10^{-3}$.`,
              t`A vírgula anda $3$ casas para a direita até ficar logo após o $2$, gerando $2{,}5\times 10^{-3}$.`,
            ),
            tf(
              t`O número $15\times 10^{6}$ já está escrito em notação científica padrão.`,
              false,
              t`Na notação científica padrão, a mantissa deve satisfazer $1\le |a|<10$. Como $15\ge 10$, normalizamos para $1{,}5\times 10^7$.`,
            ),
            gen((rng) => {
              const [a, b] = pick(rng, [
                [4, 5],
                [5, 6],
                [4, 8],
                [6, 5],
                [3, 8],
                [5, 9],
              ]);
              const m = randInt(rng, 3, 7);
              const n = randInt(rng, 2, 6);
              const prod = a * b;
              const mant = prod / 10;
              const exp = m + n + 1;
              return rmcq(
                rng,
                t`Calcule $(${a}\times 10^{${m}})\cdot(${b}\times 10^{${n}})$ em notação científica **normalizada**.`,
                t`$${fmt(mant)}\times 10^{${exp}}$`,
                [
                  t`$${prod}\times 10^{${m + n}}$`,
                  t`$${fmt(mant)}\times 10^{${m + n}}$`,
                  t`$${fmt(mant)}\times 10^{${m + n - 1}}$`,
                  t`$${fmt(mant)}\times 10^{${m * n}}$`,
                ],
                t`$${a}\cdot ${b}=${prod}$, então temos $${prod}\times 10^{${m + n}}$. Dividindo a mantissa por $10$ e somando $1$ ao expoente: $${fmt(mant)}\times 10^{${exp}}$.`,
              );
            }),
            gen((rng) => {
              const [a, b] = pick(rng, [
                [2, 4],
                [3, 6],
                [2, 5],
                [3, 5],
                [4, 5],
              ]);
              const m = randInt(rng, 2, 6);
              const n = -randInt(rng, 2, 5);
              const q = a / b; // < 1
              const mant = q * 10;
              const exp = m - n - 1;
              return rmcq(
                rng,
                t`Calcule $\dfrac{${a}\times 10^{${m}}}{${b}\times 10^{${n}}}$ em notação científica padrão.`,
                t`$${fmt(mant)}\times 10^{${exp}}$`,
                [
                  t`$${fmt(mant)}\times 10^{${m - n}}$`,
                  t`$${fmt(mant)}\times 10^{${m + n - 1}}$`,
                  t`$${fmt(q)}\times 10^{${m - n}}$`,
                  t`$${fmt(mant)}\times 10^{${m - n + 1}}$`,
                ],
                t`$\frac{${a}}{${b}}=${fmt(q)}$ e $10^{${m}-(${n})}=10^{${m - n}}$. Normalizando $${fmt(q)}\times 10^{${m - n}}$: multiplicamos por $10$ e subtraímos $1$ do expoente, obtendo $${fmt(mant)}\times 10^{${exp}}$.`,
              );
            }),
            gen((rng) => {
              const c = pick(rng, [2, 3]);
              const n = -randInt(rng, 2, 5);
              const ansM = c * c;
              const ansE = 2 * n;
              return rmcq(
                rng,
                t`Calcule $(${c}\times 10^{${n}})^2$.`,
                t`$${ansM}\times 10^{${ansE}}$`,
                [
                  t`$${ansM}\times 10^{${n * n}}$`,
                  t`$${2 * c}\times 10^{${ansE}}$`,
                  t`$${ansM}\times 10^{${n + 2}}$`,
                  t`$${c}\times 10^{${ansE}}$`,
                ],
                t`Elevamos a mantissa e multiplicamos o expoente por $2$: $${c}^2\times 10^{2\cdot(${n})}=${ansM}\times 10^{${ansE}}$.`,
              );
            }),
            gen((rng) => {
              const a = randInt(rng, 2, 8);
              const b = randInt(rng, 1, 9);
              const mant = a + b / 10;
              return num(
                t`Escrevendo a soma $${a}\times 10^5 + ${b}\times 10^4$ em notação científica $m\times 10^5$, qual é o valor da mantissa $m$?`,
                mant,
                t`Igualando ao expoente $10^5$: $${b}\times 10^4 = 0{,}${b}\times 10^5$. Somando as mantissas: $${a}+0{,}${b}=${fmt(mant)}$.`,
              );
            }),
            fill(
              t`Complete a normalização:`,
              t`Em $0{,}06\times 10^{-4}$, a vírgula anda $2$ casas para a direita (virando $6$) e ___ $2$ no expoente, resultando em $6\times 10^{n}$ com $n=$ ___.`,
              ['subtraímos', '-6'],
              ['somamos', '-2', '-8'],
              t`Como aumentamos a mantissa em $10^2$ ($0{,}06\to 6$), compensamos dividindo a potência por $10^2$: $-4-2=-6$.`,
            ),
            inter(
              t`Na reta dos expoentes de base $10$, posicione o marcador no expoente $n$ que corresponde a um milésimo ($\dfrac{1}{1000}=10^n$).`,
              'numberline',
              { min: -6, max: 6, step: 1, value: 0 },
              (v) => v === -3,
              t`$n=-3$`,
              t`$\frac{1}{1000}=\frac{1}{10^3}=10^{-3}$.`,
            ),
          ],
        },
        {
          card: {
            title: 'Prefixos do SI, ordem de grandeza e Fermi',
            body: t`Os **prefixos do SI** agrupam potências de $10$ de $3$ em $3$ para facilitar a leitura em projetos de engenharia.

A **ordem de grandeza** de $N=a\times 10^n$ (com $1\le a<10$) é a potência de $10$ mais próxima na escala logarítmica. Como o meio do caminho entre $10^0$ e $10^1$ é $10^{0{,}5}=\sqrt{10}\approx 3{,}16$:
• se $a < 3{,}16$, a ordem de grandeza é $10^n$;
• se $a \ge 3{,}16$, a ordem de grandeza sobe para $10^{n+1}$.`,
            visual: table(
              ['Prefixo', 'Símbolo', 'Fator', 'Exemplo na engenharia'],
              [
                ['giga', 'G', '$10^{9}$', 'frequência de CPU ($\\text{GHz}$)'],
                ['mega', 'M', '$10^{6}$', 'tensão mecânica ($\\text{MPa}$)'],
                ['quilo', 'k', '$10^{3}$', 'potência elétrica ($\\text{kW}$)'],
                ['mili', 'm', '$10^{-3}$', 'corrente em LED ($\\text{mA}$)'],
                ['micro', '$\\mu$', '$10^{-6}$', 'deformação / capacitância ($\\mu\\text{F}$)'],
                ['nano', 'n', '$10^{-9}$', 'litografia de chip ($\\text{nm}$)'],
              ],
            ),
            tip: t`**Atalho de engenharia**: como $\text{mili}\,(10^{-3})\times\text{quilo}\,(10^3)=10^0=1$, multiplicar $\text{mA}\times\text{k}\Omega$ dá diretamente **volts** ($\text{V}$)!`,
          },
          exercises: [
            match(
              t`Ligue cada prefixo do Sistema Internacional (SI) à sua potência de $10$:`,
              [
                [t`mega ($\text{M}$)`, t`$10^{6}$`],
                [t`quilo ($\text{k}$)`, t`$10^{3}$`],
                [t`micro ($\mu$)`, t`$10^{-6}$`],
                [t`nano ($\text{n}$)`, t`$10^{-9}$`],
              ],
              t`Os prefixos variam de $3$ em $3$ no expoente: $\text{k}=10^3$, $\text{M}=10^6$, $\text{G}=10^9$ e $\text{m}=10^{-3}$, $\mu=10^{-6}$, $\text{n}=10^{-9}$.`,
            ),
            gen((rng) => {
              const item = pick(rng, [
                ['\\mu\\text{F}', '\\text{F}', -6, 'micro'],
                ['\\text{nm}', '\\text{m}', -9, 'nano'],
                ['\\text{MPa}', '\\text{Pa}', 6, 'mega'],
                ['\\text{GHz}', '\\text{Hz}', 9, 'giga'],
              ] as const);
              const v = pick(rng, [2.5, 4.7, 1.8, 6.8, 3.3]);
              const e = item[2];
              return rmcq(
                rng,
                t`Converta $${fmt(v)}\,${item[0]}$ para a unidade base ($${item[1]}$) em notação científica.`,
                t`$${fmt(v)}\times 10^{${e}}\,${item[1]}$`,
                [
                  t`$${fmt(v)}\times 10^{${-e}}\,${item[1]}$`,
                  t`$${fmt(v)}\times 10^{${e + 3}}\,${item[1]}$`,
                  t`$${fmt(v)}\times 10^{${e - 3}}\,${item[1]}$`,
                  t`$${fmt(v)}\times 10^{${e + 1}}\,${item[1]}$`,
                ],
                t`O prefixo **${item[3]}** vale $10^{${e}}$, basta substituir o prefixo por $\times 10^{${e}}$.`,
              );
            }),
            mcqS(
              t`Por que a fronteira para decidir se a ordem de grandeza de $a\times 10^n$ é $10^n$ ou $10^{n+1}$ usa $\sqrt{10}\approx 3{,}16$ (e não $5$)?`,
              t`Porque na escala de potências (logarítmica), o ponto médio entre $10^0$ e $10^1$ é $10^{1/2}=\sqrt{10}$`,
              [
                t`Porque $\sqrt{10}$ é igual a $\pi$`,
                t`Porque só números primos mudam de ordem de grandeza`,
                t`Porque $3{,}16$ é a metade aritmética de $10$`,
              ],
              t`Em ordens de grandeza comparamos **razões** (expoentes): de $1$ até $\sqrt{10}$ multiplicamos por $\sqrt{10}$, e de $\sqrt{10}$ até $10$ multiplicamos de novo por $\sqrt{10}$.`,
            ),
            gen((rng) => {
              const high = rng() < 0.5;
              const a = high ? pick(rng, [4.2, 5.5, 6.02, 7.8, 8.9]) : pick(rng, [1.2, 1.8, 2.4, 2.9]);
              const n = randInt(rng, -5, 8);
              const og = high ? n + 1 : n;
              return rmcq(
                rng,
                t`Qual é a ordem de grandeza da medida $${fmt(a)}\times 10^{${n}}$ (usando o critério $\sqrt{10}\approx 3{,}16$)?`,
                t`$10^{${og}}$`,
                [
                  t`$10^{${high ? n : n + 1}}$`,
                  t`$10^{${n - 1}}$`,
                  t`$10^{${n + 2}}$`,
                  t`$10^{${n - 2}}$`,
                ],
                high
                  ? t`Como a mantissa $${fmt(a)} \ge 3{,}16$, o número está mais perto de $10^{${n + 1}}$: ordem de grandeza $10^{${og}}$.`
                  : t`Como a mantissa $${fmt(a)} < 3{,}16$, o número está mais perto de $10^{${n}}$: ordem de grandeza $10^{${og}}$.`,
              );
            }),
            gen((rng) => {
              const i = randInt(rng, 2, 9);
              const r = randInt(rng, 2, 12);
              return num(
                t`Num circuito eletrônico, uma corrente $I=${i}\text{ mA}$ atravessa um resistor $R=${r}\text{ k}\Omega$. Qual é a tensão $V=R\cdot I$ em **volts** ($\text{V}$)?`,
                i * r,
                t`$V=(${r}\times 10^3\,\Omega)\cdot(${i}\times 10^{-3}\,\text{A})=${r * i}\times 10^{3-3}=${r * i}\text{ V}$. Os prefixos quilo ($10^3$) e mili ($10^{-3}$) se cancelam!`,
                { unit: 'V' },
              );
            }),
            order(
              t`Ordene os comprimentos abaixo do **menor para o maior**:`,
              [t`$20\text{ nm}$`, t`$5\text{ }\mu\text{m}$`, t`$0{,}3\text{ mm}$`, t`$2\text{ km}$`],
              t`Em metros: $20\text{ nm}=2\times 10^{-8}\text{ m} < 5\,\mu\text{m}=5\times 10^{-6}\text{ m} < 0{,}3\text{ mm}=3\times 10^{-4}\text{ m} < 2\text{ km}=2\times 10^3\text{ m}$.`,
            ),
            gen((rng) => {
              const p = randInt(rng, 2, 6);
              const c = randInt(rng, 2, 5);
              const mw = p * c * 10;
              return num(
                t`Estimativa de Fermi: uma cidade tem $${p}\times 10^5$ residências, cada uma consumindo em média $${c}\times 10^2\text{ W}$ de potência contínua. Qual é a potência total demandada em **megawatts** ($\text{MW}=10^6\text{ W}$)?`,
                mw,
                t`Total em watts: $(${p}\times 10^5)\cdot(${c}\times 10^2)=${p * c}\times 10^7\text{ W}=${mw}\times 10^6\text{ W}=${mw}\text{ MW}$.`,
                { unit: 'MW' },
              );
            }),
            num(
              t`Um atalho clássico de Fermi na engenharia diz que $1$ ano ($365\text{ dias}\times 24\text{ h}\times 3600\text{ s}\approx 3{,}15\times 10^7\text{ s}$) tem aproximadamente $\pi\times 10^n$ segundos. Qual é a ordem de grandeza (o expoente da potência de $10$) do número de segundos em $1$ ano?`,
              7,
              t`$365\cdot 86\,400=31\,536\,000\approx 3{,}15\times 10^7\text{ s}$. Como $3{,}15 < \sqrt{10}\approx 3{,}162$, a ordem de grandeza é $10^7$ (expoente $7$).`,
            ),
          ],
        },
      ],
    },
  ],
};

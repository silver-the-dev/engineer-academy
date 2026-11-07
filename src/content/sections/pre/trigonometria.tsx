import React from 'react';
import type { UnitDef } from '../../types';
import { gen, mcq, mcqS, num, tf, fill, match, order, inter, plot, rmcq, near, multi } from '../../helpers';
import { ArcW, CircleW, FnCurve, Label, PolygonW, Pt, Seg } from '../../../components/plot/Plot';
import { C } from '../../../theme';
import { fmt, gcd, pick, randInt, term } from '../../../lib/random';

const t = String.raw;

const TRI = [
  [3, 4, 5],
  [5, 12, 13],
  [8, 15, 17],
  [7, 24, 25],
] as const;

const fr = (p: number, q: number) => `\\frac{${p}}{${q}}`;

/** 4-parameter sinusoid lab: y = A sen(B x + C) + D with optional target [A, B, C, D] */
const wave4Lab = (target?: [number, number, number, number]) =>
  plot({
    view: { xMin: -1, xMax: 9.5, yMin: -4.2, yMax: 4.2 },
    params: [
      { key: 'A', label: 'A', min: 0.5, max: 3, step: 0.5, value: 1, color: C.p5 },
      { key: 'B', label: 'B', min: 0.5, max: 3, step: 0.5, value: 1, color: C.p2 },
      { key: 'C', label: 'C', min: -2, max: 2, step: 0.5, value: 0, color: C.p3 },
      { key: 'D', label: 'D', min: -2, max: 2, step: 0.5, value: 0, color: C.p4 },
    ],
    render: ({ p }: any) => (
      <>
        {target ? (
          <FnCurve
            f={(x) => target[0] * Math.sin(target[1] * x + target[2]) + target[3]}
            color={C.gold}
            dash="7 6"
            width={2.5}
          />
        ) : null}
        <Seg x1={-1} y1={p.D} x2={9.5} y2={p.D} color={C.p4} dash="4 4" width={1.5} />
        <FnCurve f={(x) => p.A * Math.sin(p.B * x + p.C) + p.D} color={C.p1} />
      </>
    ),
    info: ({ p }: any) => {
      const cStr = p.C === 0 ? '' : p.C < 0 ? ` - ${fmt(Math.abs(p.C))}` : ` + ${fmt(p.C)}`;
      const dStr = p.D === 0 ? '' : p.D < 0 ? ` - ${fmt(Math.abs(p.D))}` : ` + ${fmt(p.D)}`;
      return t`$y=${fmt(p.A)}\operatorname{sen}(${fmt(p.B)}x${cStr})${dStr}$ · período $T=\frac{2\pi}{B}\approx ${fmt((2 * Math.PI) / p.B, 2)}$ · defasagem $-\frac{C}{B}=${fmt(-p.C / p.B, 2)}$`;
    },
  });

/** Tangent lab with vertical asymptotes: y = A tg(B x) */
const tanLab = () =>
  plot({
    view: { xMin: -5, xMax: 5, yMin: -4.5, yMax: 4.5 },
    params: [
      { key: 'A', label: 'A', min: 0.5, max: 2.5, step: 0.5, value: 1, color: C.p5 },
      { key: 'B', label: 'B', min: 0.5, max: 2, step: 0.5, value: 1, color: C.p2 },
    ],
    render: ({ p }: any) => {
      const asym: React.ReactNode[] = [];
      for (let k = -3; k <= 2; k++) {
        const xa = ((k + 0.5) * Math.PI) / p.B;
        if (xa >= -5 && xa <= 5) {
          asym.push(<Seg key={k} x1={xa} y1={-4.5} x2={xa} y2={4.5} color={C.gold} dash="5 5" width={1.5} />);
        }
      }
      return (
        <>
          {asym}
          <FnCurve
            f={(x) => {
              const c = Math.cos(p.B * x);
              return Math.abs(c) < 0.06 ? NaN : (p.A * Math.sin(p.B * x)) / c;
            }}
            color={C.p1}
            samples={360}
          />
        </>
      );
    },
    info: ({ p }: any) =>
      t`$y=${fmt(p.A)}\operatorname{tg}(${fmt(p.B)}x)$ · período $T=\frac{\pi}{B}\approx ${fmt(Math.PI / p.B, 2)}$ · 1ª assíntota em $x=\frac{\pi}{2B}\approx ${fmt(Math.PI / (2 * p.B), 2)}$`,
  });

/** Reciprocal trig lab: sec x over cos x (M=0) or cossec x over sen x (M=1) */
const recipLab = () =>
  plot({
    view: { xMin: -6.5, xMax: 6.5, yMin: -4, yMax: 4 },
    params: [
      {
        key: 'm',
        label: 'f',
        min: 0,
        max: 1,
        step: 1,
        value: 0,
        color: C.p2,
        format: (v: number) => (v === 0 ? 'sec x' : 'cossec x'),
      },
    ],
    render: ({ p }: any) => {
      const isSec = p.m === 0;
      const baseFn = (x: number) => (isSec ? Math.cos(x) : Math.sin(x));
      return (
        <>
          <Seg x1={-6.5} y1={1} x2={6.5} y2={1} color={C.textDim} dash="4 4" width={1} />
          <Seg x1={-6.5} y1={-1} x2={6.5} y2={-1} color={C.textDim} dash="4 4" width={1} />
          <FnCurve f={baseFn} color={C.p2} dash="5 5" width={2} />
          <FnCurve
            f={(x) => {
              const b = baseFn(x);
              return Math.abs(b) < 0.06 ? NaN : 1 / b;
            }}
            color={C.p5}
            samples={360}
          />
        </>
      );
    },
    info: ({ p }: any) =>
      p.m === 0
        ? t`Rosa: $\sec x=\frac{1}{\cos x}$ · Azul tracejado: $\cos x$ · Tocam-se em $y=\pm 1$; onde $\cos x=0$, há assíntota!`
        : t`Rosa: $\operatorname{cossec} x=\frac{1}{\operatorname{sen} x}$ · Azul tracejado: $\operatorname{sen} x$ · Imagem: $(-\infty,\,-1]\cup[1,\,\infty)$`,
  });

/** Geometric Pythagorean identities on the unit circle: sen^2+cos^2=1 and 1+tg^2=sec^2 */
const pythCircleLab = () =>
  plot({
    view: { xMin: -1.4, xMax: 2.2, yMin: -1.6, yMax: 1.8 },
    equalAspect: true,
    params: [
      {
        key: 'th',
        label: '\\theta',
        min: -60,
        max: 60,
        step: 5,
        value: 35,
        color: C.gold,
        format: (v: number) => `${v}°`,
      },
    ],
    render: ({ p }: any) => {
      const a = (p.th * Math.PI) / 180;
      const c = Math.cos(a);
      const s = Math.sin(a);
      const tg = Math.tan(a);
      return (
        <>
          <CircleW cx={0} cy={0} r={1} color={C.textDim} width={2} />
          <PolygonW pts={[[0, 0], [1, 0], [1, tg]]} color={C.p4} opacity={0.14} strokeWidth={0} />
          <PolygonW pts={[[0, 0], [c, 0], [c, s]]} color={C.p2} opacity={0.22} strokeWidth={0} />
          <Seg x1={0} y1={0} x2={c} y2={0} color={C.p2} width={4} />
          <Seg x1={c} y1={0} x2={c} y2={s} color={C.p5} width={4} />
          <Seg x1={1} y1={0} x2={1} y2={tg} color={C.p4} width={4} />
          <Seg x1={0} y1={0} x2={1} y2={tg} color={C.gold} width={3} />
          <Pt x={c} y={s} color={C.gold} r={5} label="P" />
          <Pt x={1} y={tg} color={C.p4} r={5} label="T" />
        </>
      );
    },
    info: ({ p }: any) => {
      const a = (p.th * Math.PI) / 180;
      const tg = Math.tan(a);
      const sec = 1 / Math.cos(a);
      return t`$\operatorname{sen}^2\theta+\cos^2\theta=1$ · No triângulo maior: $1+\operatorname{tg}^2\theta=1+${fmt(tg * tg, 2)}=${fmt(sec * sec, 2)}=\sec^2\theta$`;
    },
  });

/** Sum of angles on the unit circle */
const sumAnglesLab = () =>
  plot({
    view: { xMin: -1.4, xMax: 1.4, yMin: -1.4, yMax: 1.4 },
    equalAspect: true,
    params: [
      { key: 'a', label: '\\alpha', min: 0, max: 90, step: 15, value: 45, color: C.p2, format: (v: number) => `${v}°` },
      { key: 'b', label: '\\beta', min: -45, max: 60, step: 15, value: 15, color: C.p3, format: (v: number) => `${v}°` },
    ],
    render: ({ p }: any) => {
      const a = (p.a * Math.PI) / 180;
      const b = (p.b * Math.PI) / 180;
      const ab = a + b;
      return (
        <>
          <CircleW cx={0} cy={0} r={1} color={C.textDim} width={2} />
          <ArcW cx={0} cy={0} r={0.28} a0={0} a1={a} color={C.p2} />
          <ArcW cx={0} cy={0} r={0.42} a0={a} a1={ab} color={C.p3} />
          <Seg x1={0} y1={0} x2={Math.cos(a)} y2={Math.sin(a)} color={C.p2} width={2.5} dash="5 4" />
          <Seg x1={0} y1={0} x2={Math.cos(ab)} y2={Math.sin(ab)} color={C.gold} width={4} />
          <Seg x1={0} y1={0} x2={Math.cos(ab)} y2={0} color={C.p2} width={4} />
          <Seg x1={Math.cos(ab)} y1={0} x2={Math.cos(ab)} y2={Math.sin(ab)} color={C.p5} width={4} />
          <Pt x={Math.cos(a)} y={Math.sin(a)} color={C.p2} r={5} label="α" />
          <Pt x={Math.cos(ab)} y={Math.sin(ab)} color={C.gold} r={6} label="α+β" />
        </>
      );
    },
    info: ({ p }: any) => {
      const s = p.a + p.b;
      const rad = (s * Math.PI) / 180;
      return t`$\alpha+\beta=${s}^\circ$ · $\cos(${s}^\circ)=${fmt(Math.cos(rad), 3)}$ · $\operatorname{sen}(${s}^\circ)=${fmt(Math.sin(rad), 3)}$`;
    },
  });

/** Power reduction lab: sen^2(x) vs (1 - cos(k x)) / 2 */
const powerRedLab = () =>
  plot({
    view: { xMin: -0.5, xMax: 6.5, yMin: -0.3, yMax: 1.3 },
    params: [{ key: 'k', label: 'k', min: 1, max: 4, step: 0.5, value: 2, color: C.p2 }],
    render: ({ p }: any) => (
      <>
        <Seg x1={-0.5} y1={0.5} x2={6.5} y2={0.5} color={C.textDim} dash="4 4" width={1.5} />
        <FnCurve f={(x) => Math.sin(x) ** 2} color={C.gold} dash="7 5" width={2.5} />
        <FnCurve f={(x) => (1 - Math.cos(p.k * x)) / 2} color={C.p2} width={3} />
      </>
    ),
    info: ({ p }: any) =>
      p.k === 2
        ? t`$k=2$: $\frac{1-\cos(2x)}{2}=\operatorname{sen}^2 x$ (coincidem!) · Linha média em $y=\frac{1}{2}$ e período $\pi$`
        : t`Dourada tracejada: $\operatorname{sen}^2 x$ · Azul: $\frac{1-\cos(${fmt(p.k)}x)}{2}$ (ajuste $k=2$ para coincidir)`,
  });

/** Inverse sine reflection lab: y = sen x on [-pi/2, pi/2] and y = arcsen x on [-1, 1] */
const invTrigLab = () =>
  plot({
    view: { xMin: -2.2, xMax: 2.2, yMin: -1.8, yMax: 1.8 },
    equalAspect: true,
    params: [{ key: 'x', label: 'x', min: -1, max: 1, step: 0.05, value: 0.5, color: C.p5 }],
    render: ({ p }: any) => {
      const y = Math.asin(p.x);
      return (
        <>
          <FnCurve f={(x) => x} color={C.textDim} dash="5 5" width={1.5} />
          <FnCurve f={(x) => Math.sin(x)} color={C.p2} opacity={0.22} width={2} />
          <FnCurve f={(x) => Math.sin(x)} from={-Math.PI / 2} to={Math.PI / 2} color={C.p2} width={3.5} />
          <FnCurve f={(x) => (Math.abs(x) <= 1 ? Math.asin(x) : NaN)} from={-1} to={1} color={C.p5} width={3.5} />
          <Seg x1={p.x} y1={y} x2={y} y2={p.x} color={C.gold} dash="4 4" width={1.5} />
          <Pt x={y} y={p.x} color={C.p2} r={5} />
          <Pt x={p.x} y={y} color={C.p5} r={6} label="P" />
        </>
      );
    },
    info: ({ p }: any) => {
      const y = Math.asin(p.x);
      return t`$\operatorname{arcsen}(${fmt(p.x, 2)})=${fmt(y, 3)}\text{ rad}\approx ${fmt((y * 180) / Math.PI, 1)}^\circ$ · Espelho de $(${fmt(y, 2)},\,${fmt(p.x, 2)})$ na reta $y=x$`;
    },
  });

/** Triangle method lab for cos(arcsen x) = sqrt(1 - x^2) */
const invTriangleLab = () =>
  plot({
    view: { xMin: -0.4, xMax: 4.8, yMin: -0.5, yMax: 3.6 },
    equalAspect: true,
    params: [{ key: 'x', label: 'x', min: 0.2, max: 0.95, step: 0.05, value: 0.6, color: C.p5 }],
    render: ({ p }: any) => {
      const S = 3.6;
      const adj = Math.sqrt(1 - p.x * p.x);
      const X = S * adj;
      const Y = S * p.x;
      const a = Math.asin(p.x);
      return (
        <>
          <PolygonW pts={[[0, 0], [X, 0], [X, Y]]} color={C.p1} opacity={0.16} />
          <Seg x1={0} y1={0} x2={X} y2={0} color={C.p2} width={4} />
          <Seg x1={X} y1={0} x2={X} y2={Y} color={C.p5} width={4} />
          <Seg x1={0} y1={0} x2={X} y2={Y} color={C.gold} width={4} />
          <ArcW cx={0} cy={0} r={0.65} a0={0} a1={a} color={C.gold} />
          <Label x={X / 2} y={0} dy={16} text={`√(1−x²) = ${fmt(adj, 2)}`} color={C.p2} anchor="middle" size={12} />
          <Label x={X} y={Y / 2} dx={8} text={`x = ${fmt(p.x, 2)}`} color={C.p5} size={12} />
          <Label x={X / 2 - 0.2} y={Y / 2 + 0.25} text="hip = 1" color={C.gold} anchor="end" size={12} />
        </>
      );
    },
    info: ({ p }: any) => {
      const adj = Math.sqrt(1 - p.x * p.x);
      return t`$\theta=\operatorname{arcsen}(${fmt(p.x, 2)})$ ⟹ $\cos(\operatorname{arcsen} x)=\sqrt{1-x^2}=${fmt(adj, 3)}$ · $\operatorname{tg}(\operatorname{arcsen} x)=\frac{x}{\sqrt{1-x^2}}=${fmt(p.x / adj, 3)}$`;
    },
  });

export const trigAvancada: UnitDef = {
  id: 'p-trig',
  title: 'Trigonometria avançada',
  subtitle: 'Gráficos periódicos, identidades, soma de arcos e inversas',
  icon: '🌊',
  source: 'Pré-Cálculo · Trigonometria Avançada',
  guide: t`Da modelagem de ondas completas $y=A\operatorname{sen}(Bx+C)+D$ e funções recíprocas até as identidades pitagóricas, fórmulas de arco duplo, redução de potência e funções trigonométricas inversas — ferramentas indispensáveis para derivadas, integrais e sinais.`,
  lessons: [
    {
      id: 'p-trig-graf',
      title: 'Gráficos periódicos',
      parts: [
        {
          card: {
            title: 'A senoide completa',
            body: t`Toda onda harmônica pode ser escrita na forma geral:
$$y = A\operatorname{sen}(Bx + C) + D$$

• **Amplitude** $|A|$: metade da distância entre o pico e o vale.
• **Período** $T = \dfrac{2\pi}{|B|}$: comprimento de um ciclo completo.
• **Defasagem** $-\dfrac{C}{B}$: deslocamento horizontal do início do ciclo (pois $Bx + C = 0 \iff x = -\frac{C}{B}$).
• **Linha média** $y = D$: deslocamento vertical; a imagem passa a ser $[D - |A|,\,D + |A|]$.`,
            visual: wave4Lab(),
            example: t`Em $y = 3\operatorname{sen}\left(2x - \frac{\pi}{2}\right) + 1$, a amplitude é $3$, o período é $\frac{2\pi}{2}=\pi$, a defasagem é $\frac{\pi/2}{2}=\frac{\pi}{4}$ (para a direita) e a imagem é $[-2,\,4]$.`,
            tip: t`Para achar a defasagem sem errar, coloque $B$ em evidência: $Bx + C = B\left(x + \frac{C}{B}\right)$.`,
          },
          exercises: [
            mcq(
              t`Em $y = A\operatorname{sen}(Bx + C) + D$, qual parâmetro desloca a linha média da onda verticalmente?`,
              ['$D$', '$A$', '$B$', '$C$'],
              0,
              t`Somar $D$ fora do seno sobe ou desce todo o gráfico para a linha média $y = D$.`,
            ),
            tf(
              t`O período de $y = 5\operatorname{sen}(3x - \pi) + 2$ depende apenas de $B = 3$, valendo $T = \dfrac{2\pi}{3}$.`,
              true,
              t`Amplitude $A$, fase $C$ e deslocamento vertical $D$ não alteram o período $T = \frac{2\pi}{|B|}$.`,
            ),
            gen((rng) => {
              const A = randInt(rng, 2, 6);
              const B = pick(rng, [2, 3, 4]);
              const D = randInt(rng, -3, 4);
              return num(
                t`Na onda $y = ${A}\cos(${B}x) ${term(D, '')}$, qual é a distância vertical entre o valor máximo e o valor mínimo (variação pico a pico)?`,
                2 * A,
                t`O máximo é $D + A = ${D + A}$ e o mínimo é $D - A = ${D - A}$. A distância pico a pico é sempre $2|A| = ${2 * A}$.`,
              );
            }),
            gen((rng) => {
              const B = pick(rng, [2, 3, 4]);
              const k = pick(rng, [1, 3]);
              // k·π/d in lowest terms ("3π/6" → "π/2", "3π/3" → "π")
              const piFrac = (n: number, d: number) => {
                const g = gcd(n, d);
                const [a, b] = [n / g, d / g];
                const top = `${a === 1 ? '' : a}\\pi`;
                return b === 1 ? top : `\\frac{${top}}{${b}}`;
              };
              const ans = piFrac(k, 2 * B);
              const wrong = [piFrac(k, 2), piFrac(k, B), `-${piFrac(k, 2 * B)}`, `${B}\\pi`];
              return rmcq(
                rng,
                t`Qual é a defasagem horizontal $-\dfrac{C}{B}$ da função $y = 2\operatorname{sen}\left(${B}x - \dfrac{${k === 1 ? '' : k}\pi}{2}\right)$?`,
                `$${ans}$`,
                wrong.map((w) => `$${w}$`),
                t`Igualando o argumento a zero: $${B}x - \frac{${k === 1 ? '' : k}\pi}{2} = 0 \Rightarrow x = ${ans}$.`,
              );
            }),
            inter(
              t`Ajuste os 4 controles para igualar a onda tracejada $y = 2\operatorname{sen}(2x - 1) + 1$.`,
              'plot',
              wave4Lab([2, 2, -1, 1]).props,
              (v: any) =>
                v &&
                near(v.p.A, 2, 0.1) &&
                near(v.p.B, 2, 0.1) &&
                near(v.p.C, -1, 0.1) &&
                near(v.p.D, 1, 0.1),
              t`$A=2$, $B=2$, $C=-1$, $D=1$`,
              t`A linha média está em $y=1$ ($D=1$), a amplitude é $2$ ($A=2$), a frequência dobra ($B=2$) e a fase é $C=-1$.`,
            ),
            fill(
              t`Complete a análise da função $y = -3\operatorname{sen}(4x) + 2$:`,
              t`A amplitude é ___, o período é ___ e o conjunto imagem é ___.`,
              ['$3$', t`$\frac{\pi}{2}$`, '$[-1,\\,5]$'],
              ['$-3$', t`$4\pi$`, '$[-3,\\,3]$'],
              t`Amplitude $|-3|=3$, período $\frac{2\pi}{4}=\frac{\pi}{2}$ e imagem $[2-3,\,2+3] = [-1,\,5]$.`,
            ),
            gen((rng) => {
              const k = pick(rng, [4, 6, 8, 12]);
              const D = randInt(rng, 10, 20);
              const A = randInt(rng, 2, 5);
              return num(
                t`A altura da água num reservatório varia segundo $h(t) = ${D} + ${A}\cos\left(\dfrac{\pi}{${k}}t\right)$, com $t$ em horas. Qual é o período dessa oscilação, em horas?`,
                2 * k,
                t`Com $B = \frac{\pi}{${k}}$, o período é $T = \frac{2\pi}{\pi/${k}} = ${2 * k}$ horas.`,
                { unit: 'h' },
              );
            }),
            mcqS(
              t`Uma onda senoidal oscila entre o mínimo $y = -2$ e o máximo $y = 6$, completando um ciclo a cada $\pi$ radianos. Qual pode ser sua lei?`,
              t`$y = 4\operatorname{sen}(2x) + 2$`,
              [
                t`$y = 8\operatorname{sen}(2x) + 2$`,
                t`$y = 4\operatorname{sen}(\pi x) + 2$`,
                t`$y = 2\operatorname{sen}(2x) + 4$`,
                t`$y = 4\operatorname{sen}(2x) - 2$`,
              ],
              t`Linha média $D = \frac{-2 + 6}{2} = 2$, amplitude $A = \frac{6 - (-2)}{2} = 4$ e período $\pi = \frac{2\pi}{B} \Rightarrow B = 2$.`,
            ),
          ],
        },
        {
          card: {
            title: 'Tangente e suas assíntotas',
            body: t`Como $\operatorname{tg} x = \dfrac{\operatorname{sen} x}{\cos x}$, a função tangente **explode** sempre que o denominador $\cos x$ zera:

• **Assíntotas verticais**: $x = \dfrac{\pi}{2} + k\pi$ ($k \in \mathbb Z$).
• **Período**: $T = \pi$ (metade do período do seno!). Para $y = A\operatorname{tg}(Bx)$, o período é $T = \dfrac{\pi}{|B|}$.
• **Imagem**: $\mathbb R$ (não tem valor máximo nem mínimo).`,
            visual: tanLab(),
            tip: t`Para achar as assíntotas de $\operatorname{tg}(Bx + C)$, basta resolver $Bx + C = \frac{\pi}{2} + k\pi$.`,
          },
          exercises: [
            mcq(
              t`Qual é o período fundamental da função $f(x) = \operatorname{tg} x$?`,
              ['$\\pi$', '$2\\pi$', '$\\dfrac{\\pi}{2}$', '$1$'],
              0,
              t`Como $\operatorname{tg}(x + \pi) = \frac{-\operatorname{sen} x}{-\cos x} = \operatorname{tg} x$, a tangente se repete a cada $\pi$ radianos.`,
            ),
            tf(
              t`A imagem da função $f(x) = \operatorname{tg} x$ é o conjunto $\mathbb R$ de todos os números reais.`,
              true,
              t`Em cada ramo entre duas assíntotas verticais, $\operatorname{tg} x$ cresce de $-\infty$ até $+\infty$.`,
            ),
            mcqS(
              t`Por que o gráfico de $y = \operatorname{tg} x$ possui assíntotas verticais em $x = \dfrac{\pi}{2} + k\pi$?`,
              t`Porque $\cos x = 0$ nesses pontos, zerando o denominador de $\dfrac{\operatorname{sen} x}{\cos x}$`,
              [
                t`Porque $\operatorname{sen} x = 0$ nesses pontos`,
                t`Porque $\operatorname{sen} x = \cos x$ nesses pontos`,
                t`Porque a função atinge seu valor máximo igual a $1$`,
                t`Porque o raio do ciclo trigonométrico fica nulo`,
              ],
              t`Quando $x \to \frac{\pi}{2}$, $\operatorname{sen} x \to 1$ e $\cos x \to 0$, fazendo a razão $\frac{\operatorname{sen} x}{\cos x}$ tender a $\pm\infty$.`,
            ),
            gen((rng) => {
              const B = pick(rng, [2, 3, 4, 5, 6]);
              return rmcq(
                rng,
                t`Qual é o período da função $f(x) = 3\operatorname{tg}(${B}x)$?`,
                t`$\dfrac{\pi}{${B}}$`,
                [
                  t`$\dfrac{2\pi}{${B}}$`,
                  t`$${B}\pi$`,
                  t`$\dfrac{\pi}{${2 * B}}$`,
                  t`$\dfrac{3\pi}{${B}}$`,
                ],
                t`O período de $\operatorname{tg}(Bx)$ é $\frac{\pi}{|B|} = \frac{\pi}{${B}}$.`,
              );
            }),
            gen((rng) => {
              const B = pick(rng, [1, 2, 3, 4, 5]);
              return num(
                t`A primeira assíntota vertical positiva ($x > 0$) de $f(x) = \operatorname{tg}(${B === 1 ? '' : B}x)$ ocorre em $x = \dfrac{\pi}{n}$. Quanto vale $n$?`,
                2 * B,
                t`A primeira assíntota positiva ocorre quando $${B === 1 ? '' : B}x = \frac{\pi}{2} \Rightarrow x = \frac{\pi}{${2 * B}}$, logo $n = ${2 * B}$.`,
              );
            }),
            match(
              t`Ligue cada função tangente à sua primeira assíntota vertical positiva ($x > 0$):`,
              [
                [t`$\operatorname{tg} x$`, t`$x = \frac{\pi}{2}$`],
                [t`$\operatorname{tg}(2x)$`, t`$x = \frac{\pi}{4}$`],
                [t`$\operatorname{tg}\left(\frac{x}{2}\right)$`, t`$x = \pi$`],
                [t`$\operatorname{tg}\left(\frac{\pi x}{2}\right)$`, t`$x = 1$`],
              ],
              t`Iguale o argumento de cada tangente a $\frac{\pi}{2}$ e isole $x$.`,
            ),
            multi(
              t`Quais afirmações são verdadeiras sobre a função $f(x) = \operatorname{tg} x$?`,
              [
                t`É estritamente crescente em cada intervalo aberto entre assíntotas`,
                t`É uma função ímpar: $\operatorname{tg}(-x) = -\operatorname{tg} x$`,
                t`Seus zeros ocorrem em $x = k\pi$ ($k \in \mathbb Z$)`,
                t`É limitada entre $-1$ e $1$`,
              ],
              [0, 1, 2],
              t`A tangente é ímpar, cresce em cada ramo e zera quando $\operatorname{sen} x = 0$ ($x = k\pi$), mas não é limitada.`,
            ),
            gen((rng) => {
              const A = randInt(rng, 2, 6);
              const D = randInt(rng, -4, 5);
              return num(
                t`Dada $f(x) = ${A}\operatorname{tg}(3x) ${term(D, '')}$, calcule $f\left(\dfrac{\pi}{12}\right)$.`,
                A + D,
                t`$3 \cdot \frac{\pi}{12} = \frac{\pi}{4}$ e $\operatorname{tg}\left(\frac{\pi}{4}\right) = 1$, logo $f\left(\frac{\pi}{12}\right) = ${A}\cdot 1 ${term(D, '')} = ${A + D}$.`,
              );
            }),
          ],
        },
        {
          card: {
            title: 'Secante, cossecante e cotangente',
            body: t`As três razões recíprocas são definidas por:
$$\sec x = \frac{1}{\cos x}\qquad \operatorname{cossec} x = \frac{1}{\operatorname{sen} x}\qquad \operatorname{cotg} x = \frac{\cos x}{\operatorname{sen} x}$$

Como $|\cos x| \le 1$ e $|\operatorname{sen} x| \le 1$, seus inversos $\sec x$ e $\operatorname{cossec} x$ têm valor absoluto $\ge 1$: os gráficos são curvas em "U" que tocam os picos e vales de $\cos x$ e $\operatorname{sen} x$ em $y = \pm 1$.`,
            visual: recipLab(),
            tip: t`Cuidado com os nomes: a recíproca do **sen**o começa com **co** ($\operatorname{cossec}$), e a do **co**sseno começa com **s** ($\sec$).`,
          },
          exercises: [
            match(
              t`Ligue cada função trigonométrica recíproca à sua definição:`,
              [
                [t`$\sec x$`, t`$\frac{1}{\cos x}$`],
                [t`$\operatorname{cossec} x$`, t`$\frac{1}{\operatorname{sen} x}$`],
                [t`$\operatorname{cotg} x$`, t`$\frac{\cos x}{\operatorname{sen} x}$`],
              ],
              t`Secante inverte o cosseno, cossecante inverte o seno e cotangente inverte a tangente.`,
            ),
            tf(
              t`Não existe nenhum número real $x$ tal que $\sec x = 0{,}5$.`,
              true,
              t`Se $\sec x = 0{,}5$, teríamos $\cos x = 2$, o que é impossível para $x \in \mathbb R$.`,
            ),
            mcqS(
              t`Qual é o conjunto imagem das funções $y = \sec x$ e $y = \operatorname{cossec} x$?`,
              t`$(-\infty,\,-1] \cup [1,\,\infty)$`,
              [
                t`$[-1,\,1]$`,
                t`$\mathbb R - \{0\}$`,
                t`$[1,\,\infty)$`,
                t`$(-\infty,\,-1) \cup (1,\,\infty)$`,
              ],
              t`Como $0 < |\cos x| \le 1$, ao inverter obtemos $|\sec x| \ge 1$, incluindo $-1$ e $1$.`,
            ),
            gen((rng) => {
              const [, b, c] = pick(rng, TRI);
              return num(
                t`Se $\cos\theta = ${fr(b, c)}$, quanto vale $\sec\theta$? (fração ou decimal)`,
                c / b,
                t`$\sec\theta = \frac{1}{\cos\theta} = ${fr(c, b)}$.`,
                { tol: 0.002 },
              );
            }),
            mcqS(
              t`Onde ficam as assíntotas verticais de $y = \operatorname{cossec} x$ e $y = \operatorname{cotg} x$?`,
              t`Em $x = k\pi$ ($k \in \mathbb Z$), onde $\operatorname{sen} x = 0$`,
              [
                t`Em $x = \dfrac{\pi}{2} + k\pi$, onde $\cos x = 0$`,
                t`Apenas em $x = 0$`,
                t`Em $x = \dfrac{\pi}{4} + k\pi$`,
                t`Essas funções não possuem assíntotas`,
              ],
              t`Tanto $\operatorname{cossec} x = \frac{1}{\operatorname{sen} x}$ quanto $\operatorname{cotg} x = \frac{\cos x}{\operatorname{sen} x}$ têm $\operatorname{sen} x$ no denominador, que zera em $x = k\pi$.`,
            ),
            gen((rng) => {
              const item = pick(rng, [
                ['\\sec 60^\\circ', '2'],
                ['\\operatorname{cossec} 30^\\circ', '2'],
                ['\\sec 45^\\circ', '\\sqrt{2}'],
                ['\\operatorname{cotg} 45^\\circ', '1'],
                ['\\operatorname{cotg} 30^\\circ', '\\sqrt{3}'],
                ['\\operatorname{cotg} 60^\\circ', '\\frac{\\sqrt{3}}{3}'],
              ] as const);
              const allAns = ['2', '\\sqrt{2}', '1', '\\sqrt{3}', '\\frac{\\sqrt{3}}{3}', '\\frac{1}{2}'];
              return rmcq(
                rng,
                t`Quanto vale $${item[0]}$?`,
                `$${item[1]}$`,
                allAns.filter((x) => x !== item[1]).map((x) => `$${x}$`),
                t`Inverta o valor correspondente de cosseno, seno ou tangente: $${item[0]} = ${item[1]}$.`,
              );
            }),
            fill(
              t`Complete sobre as funções recíprocas:`,
              t`O período de $\sec x$ é ___, o período de $\operatorname{cotg} x$ é ___ e os gráficos de $\sec x$ e $\cos x$ se tocam quando $|\cos x| =$ ___.`,
              [t`$2\pi$`, t`$\pi$`, '$1$'],
              [t`$\frac{\pi}{2}$`, '$0$'],
              t`$\sec x$ acompanha o período $2\pi$ de $\cos x$, $\operatorname{cotg} x$ tem período $\pi$ como a tangente, e $\frac{1}{\cos x} = \cos x \iff \cos x = \pm 1$.`,
            ),
            gen((rng) => {
              const A = randInt(rng, 2, 7);
              const B = pick(rng, [2, 3, 4]);
              return num(
                t`Qual é o menor valor **positivo** assumido pela função $f(x) = ${A}\sec(${B}x)$?`,
                A,
                t`No ramo positivo, $\sec(${B}x) \ge 1$, atingindo $1$ quando $\cos(${B}x) = 1$. Portanto o mínimo positivo é $${A}\cdot 1 = ${A}$.`,
              );
            }),
          ],
        },
      ],
    },
    {
      id: 'p-trig-id',
      title: 'Identidades fundamentais',
      parts: [
        {
          card: {
            title: 'A família pitagórica',
            body: t`Da relação fundamental no ciclo trigonométrico nascem mais duas identidades essenciais:

1. $\operatorname{sen}^2\theta + \cos^2\theta = 1$
2. Dividindo tudo por $\cos^2\theta$: $\quad \operatorname{tg}^2\theta + 1 = \sec^2\theta$
3. Dividindo tudo por $\operatorname{sen}^2\theta$: $\quad 1 + \operatorname{cotg}^2\theta = \operatorname{cossec}^2\theta$

Veja no círculo: o triângulo externo tem catetos $1$ e $\operatorname{tg}\theta$, e hipotenusa $\sec\theta$!`,
            visual: pythCircleLab(),
            tip: t`Em Cálculo, $\sec^2 x - \operatorname{tg}^2 x = 1$ é a chave para substituições trigonométricas com $\sqrt{x^2 + a^2}$ e $\sqrt{x^2 - a^2}$.`,
          },
          exercises: [
            mcq(
              t`Dividindo ambos os lados de $\operatorname{sen}^2 x + \cos^2 x = 1$ por $\cos^2 x$, obtemos…`,
              [
                '$\\operatorname{tg}^2 x + 1 = \\sec^2 x$',
                '$1 + \\operatorname{cotg}^2 x = \\operatorname{cossec}^2 x$',
                '$\\operatorname{tg} x + 1 = \\sec x$',
                '$\\operatorname{sen} x + \\cos x = \\sec x$',
              ],
              0,
              t`$\frac{\operatorname{sen}^2 x}{\cos^2 x} + \frac{\cos^2 x}{\cos^2 x} = \frac{1}{\cos^2 x} \Rightarrow \operatorname{tg}^2 x + 1 = \sec^2 x$.`,
            ),
            fill(
              t`Complete a terceira identidade pitagórica (obtida ao dividir por $\operatorname{sen}^2 x$):`,
              t`$1 +$ ___ $=$ ___`,
              [t`$\operatorname{cotg}^2 x$`, t`$\operatorname{cossec}^2 x$`],
              [t`$\operatorname{tg}^2 x$`, t`$\sec^2 x$`],
              t`$\frac{\operatorname{sen}^2 x}{\operatorname{sen}^2 x} + \frac{\cos^2 x}{\operatorname{sen}^2 x} = \frac{1}{\operatorname{sen}^2 x} \Rightarrow 1 + \operatorname{cotg}^2 x = \operatorname{cossec}^2 x$.`,
            ),
            inter(
              t`Ajuste o ângulo $\theta > 0$ no laboratório para que $\sec^2\theta = 2$ (ou seja, $\operatorname{tg}\theta = 1$).`,
              'plot',
              pythCircleLab().props,
              (v: any) => v && near(v.p.th, 45, 2),
              t`$\theta = 45^\circ$`,
              t`Em $\theta = 45^\circ$, $\operatorname{tg} 45^\circ = 1$ e $\sec^2 45^\circ = 1 + 1^2 = 2$.`,
            ),
            gen((rng) => {
              const k = randInt(rng, 2, 6);
              return num(
                t`Se $\operatorname{tg} x = ${k}$, quanto vale $\sec^2 x$?`,
                1 + k * k,
                t`Pela identidade pitagórica, $\sec^2 x = 1 + \operatorname{tg}^2 x = 1 + ${k}^2 = ${1 + k * k}$.`,
              );
            }),
            gen((rng) => {
              const a = randInt(rng, 2, 7);
              const b = randInt(rng, 1, 6);
              const ang = pick(rng, [19, 27, 38, 53, 71]);
              return num(
                t`Calcule o valor de $E = ${a}\operatorname{sen}^2(${ang}^\circ) + ${a}\cos^2(${ang}^\circ) + ${b}(\sec^2 x - \operatorname{tg}^2 x)$.`,
                a + b,
                t`Colocando em evidência: $${a}(\operatorname{sen}^2 ${ang}^\circ + \cos^2 ${ang}^\circ) + ${b}\cdot 1 = ${a} + ${b} = ${a + b}$.`,
              );
            }),
            mcqS(
              t`A expressão $\operatorname{cossec}^2 x - \operatorname{cotg}^2 x$ (para $\operatorname{sen} x \ne 0$) é sempre igual a…`,
              t`$1$`,
              [t`$0$`, t`$-1$`, t`$2\operatorname{cotg}^2 x$`, t`$\operatorname{sen}^2 x$`],
              t`Como $1 + \operatorname{cotg}^2 x = \operatorname{cossec}^2 x$, passar $\operatorname{cotg}^2 x$ subtraindo deixa $1$.`,
            ),
            gen((rng) => {
              const [a, b, c] = pick(rng, TRI);
              return num(
                t`Se $\operatorname{cotg} x = ${fr(a, b)}$, quanto vale $\operatorname{cossec}^2 x$? (fração ou decimal)`,
                (c * c) / (b * b),
                t`$\operatorname{cossec}^2 x = 1 + \operatorname{cotg}^2 x = 1 + \frac{${a * a}}{${b * b}} = \frac{${c * c}}{${b * b}}$.`,
                { tol: 0.002 },
              );
            }),
            tf(
              t`Para todo $x$ no domínio, $(\sec x - \operatorname{tg} x)(\sec x + \operatorname{tg} x) = 1$.`,
              true,
              t`Pelo produto da soma pela diferença: $\sec^2 x - \operatorname{tg}^2 x = 1$.`,
            ),
          ],
        },
        {
          card: {
            title: 'Simplificando e provando identidades',
            body: t`Para simplificar uma expressão trigonométrica ou provar que $A = B$:

1. **Passe tudo para seno e cosseno** se houver tangentes, secantes etc.
2. **Some frações** tirando o mínimo múltiplo comum.
3. **Fatore** (fator comum, diferença de quadrados $a^2 - b^2$) e aplique $\operatorname{sen}^2 x + \cos^2 x = 1$.`,
            example: t`$$\sec x - \cos x = \frac{1}{\cos x} - \cos x = \frac{1 - \cos^2 x}{\cos x} = \frac{\operatorname{sen}^2 x}{\cos x} = \operatorname{sen} x \cdot \operatorname{tg} x$$`,
            tip: t`Ao provar uma identidade, trabalhe com o lado **mais complicado** até transformá-lo no lado mais simples.`,
          },
          exercises: [
            mcqS(
              t`Simplificando a expressão $\cos x \cdot \operatorname{tg} x$, obtemos…`,
              t`$\operatorname{sen} x$`,
              [t`$\cos^2 x$`, t`$\sec x$`, t`$1$`, t`$\operatorname{cotg} x$`],
              t`$\cos x \cdot \frac{\operatorname{sen} x}{\cos x} = \operatorname{sen} x$.`,
            ),
            mcqS(
              t`Simplifique $(1 - \cos^2 x)\cdot \operatorname{cotg}^2 x$.`,
              t`$\cos^2 x$`,
              [t`$\operatorname{sen}^2 x$`, t`$1$`, t`$\operatorname{tg}^2 x$`, t`$\sec^2 x$`],
              t`$1 - \cos^2 x = \operatorname{sen}^2 x$, e $\operatorname{sen}^2 x \cdot \frac{\cos^2 x}{\operatorname{sen}^2 x} = \cos^2 x$.`,
            ),
            order(
              t`Ordene os passos para provar que $\operatorname{tg} x + \operatorname{cotg} x = \sec x \cdot \operatorname{cossec} x$:`,
              [
                t`Escrever em seno e cosseno: $\dfrac{\operatorname{sen} x}{\cos x} + \dfrac{\cos x}{\operatorname{sen} x}$`,
                t`Somar as frações no denominador comum: $\dfrac{\operatorname{sen}^2 x + \cos^2 x}{\cos x \cdot \operatorname{sen} x}$`,
                t`Usar a identidade pitagórica no numerador: $\dfrac{1}{\cos x \cdot \operatorname{sen} x}$`,
                t`Separar o produto das recíprocas: $\sec x \cdot \operatorname{cossec} x$`,
              ],
              t`Passar para seno e cosseno e tirar o MMC transforma a soma num produto imediato.`,
            ),
            gen((rng) => {
              const k = randInt(rng, 2, 6);
              return rmcq(
                rng,
                t`Simplifique a expressão $\dfrac{${k} - ${k}\operatorname{sen}^2 x}{\cos x}$ (para $\cos x \ne 0$).`,
                t`$${k}\cos x$`,
                [
                  t`$${k}\operatorname{sen} x$`,
                  t`$${k}\sec x$`,
                  t`$${k}\operatorname{tg} x$`,
                  t`$${k}$`,
                ],
                t`Fatorando $${k}$: $\frac{${k}(1 - \operatorname{sen}^2 x)}{\cos x} = \frac{${k}\cos^2 x}{\cos x} = ${k}\cos x$.`,
              );
            }),
            match(
              t`Ligue cada expressão à sua forma simplificada:`,
              [
                [t`$\dfrac{\operatorname{sen} x}{\operatorname{cossec} x} + \dfrac{\cos x}{\sec x}$`, '$1$'],
                [t`$\sec x - \cos x$`, t`$\operatorname{sen} x \cdot \operatorname{tg} x$`],
                [t`$\dfrac{1 + \operatorname{tg}^2 x}{\operatorname{cossec}^2 x}$`, t`$\operatorname{tg}^2 x$`],
                [t`$\dfrac{\operatorname{tg} x}{\sec x}$`, t`$\operatorname{sen} x$`],
              ],
              t`Substitua cada recíproca em termos de $\operatorname{sen} x$ e $\cos x$ e cancele os fatores comuns.`,
            ),
            order(
              t`Ordene os passos para simplificar $\dfrac{1 - \operatorname{sen}^4 x}{\cos^2 x}$:`,
              [
                t`Fatorar como diferença de quadrados: $\dfrac{(1 - \operatorname{sen}^2 x)(1 + \operatorname{sen}^2 x)}{\cos^2 x}$`,
                t`Substituir $1 - \operatorname{sen}^2 x$ por $\cos^2 x$: $\dfrac{\cos^2 x(1 + \operatorname{sen}^2 x)}{\cos^2 x}$`,
                t`Cancelar o fator comum $\cos^2 x$: $1 + \operatorname{sen}^2 x$`,
              ],
              t`Reconhecer $1 - \operatorname{sen}^4 x = (1 - \operatorname{sen}^2 x)(1 + \operatorname{sen}^2 x)$ elimina o denominador na hora.`,
            ),
            gen((rng) => {
              const s = pick(rng, [1.2, 1.4]);
              const ans = (s * s - 1) / 2;
              return num(
                t`Sabendo que $\operatorname{sen} x + \cos x = ${fmt(s)}$, calcule o produto $\operatorname{sen} x \cdot \cos x$.`,
                ans,
                t`Elevando ao quadrado: $(\operatorname{sen} x + \cos x)^2 = \operatorname{sen}^2 x + \cos^2 x + 2\operatorname{sen} x\cos x \Rightarrow ${fmt(s * s)} = 1 + 2\operatorname{sen} x\cos x \Rightarrow \operatorname{sen} x\cos x = ${fmt(ans)}$.`,
                { tol: 0.001 },
              );
            }),
            mcqS(
              t`Simplificando $\dfrac{\sec x}{\operatorname{tg} x + \operatorname{cotg} x}$, obtemos…`,
              t`$\operatorname{sen} x$`,
              [t`$\cos x$`, t`$\operatorname{tg} x$`, t`$\operatorname{cossec} x$`, t`$1$`],
              t`Como $\operatorname{tg} x + \operatorname{cotg} x = \frac{1}{\operatorname{sen} x\cos x}$, dividir $\frac{1}{\cos x}$ por isso resulta em $\operatorname{sen} x$.`,
            ),
          ],
        },
        {
          card: {
            title: 'Dado um valor e o quadrante',
            body: t`Conhecendo **uma** das seis razões trigonométricas de $\theta$ e o seu **quadrante**, você descobre todas as outras cinco em dois passos:

1. **Módulo pelo triângulo retângulo**: ignore o sinal e use Pitágoras para achar os três lados.
2. **Sinal pelo quadrante**:
   • **1º Q**: todas positivas
   • **2º Q**: só $\operatorname{sen}$ e $\operatorname{cossec}$ positivas
   • **3º Q**: só $\operatorname{tg}$ e $\operatorname{cotg}$ positivas
   • **4º Q**: só $\cos$ e $\sec$ positivas`,
            example: t`Se $\operatorname{tg}\theta = -\frac{3}{4}$ e $\theta \in 2\text{º Q}$, o triângulo $3\text{-}4\text{-}5$ tem hipotenusa $5$. No 2º Q, $\operatorname{sen}\theta = +\frac{3}{5}$ e $\cos\theta = -\frac{4}{5}$.`,
          },
          exercises: [
            mcqS(
              t`Se $\operatorname{sen}\theta < 0$ e $\operatorname{tg}\theta > 0$, em qual quadrante está $\theta$?`,
              '3º quadrante',
              ['1º quadrante', '2º quadrante', '4º quadrante'],
              t`Para $\operatorname{tg}\theta = \frac{\operatorname{sen}\theta}{\cos\theta} > 0$ com $\operatorname{sen}\theta < 0$, o cosseno também precisa ser negativo: 3º quadrante.`,
            ),
            tf(
              t`No 2º quadrante, $\sec\theta$ e $\operatorname{cotg}\theta$ são ambos negativos.`,
              true,
              t`No 2º quadrante $\cos\theta < 0$ e $\operatorname{sen}\theta > 0$, logo $\sec\theta = \frac{1}{\cos\theta} < 0$ e $\operatorname{cotg}\theta = \frac{\cos\theta}{\operatorname{sen}\theta} < 0$.`,
            ),
            gen((rng) => {
              const [a, b, c] = pick(rng, TRI);
              const q = pick(rng, [3, 4] as const);
              const sign = q === 4 ? 1 : -1;
              return num(
                t`Se $\operatorname{sen}\theta = -${fr(a, c)}$ e $\theta$ está no ${q}º quadrante, quanto vale $\sec\theta$? (fração ou decimal)`,
                (sign * c) / b,
                t`Pelo triângulo $${a}\text{-}${b}\text{-}${c}$, $|\cos\theta| = ${fr(b, c)}$. No ${q}º quadrante o cosseno é ${q === 4 ? 'positivo' : 'negativo'}, logo $\sec\theta = ${q === 4 ? '' : '-'}${fr(c, b)}$.`,
                { tol: 0.002 },
              );
            }),
            gen((rng) => {
              const [a, b, c] = pick(rng, TRI);
              return num(
                t`Se $\operatorname{tg}\theta = -${fr(a, b)}$ e $\theta$ está no 2º quadrante, quanto vale $\operatorname{sen}\theta$? (fração ou decimal)`,
                a / c,
                t`Com oposto $${a}$ e adjacente $${b}$, a hipotenusa é $${c}$. No 2º quadrante o seno é **positivo**: $\operatorname{sen}\theta = ${fr(a, c)}$.`,
                { tol: 0.002 },
              );
            }),
            gen((rng) => {
              const [a, b, c] = pick(rng, TRI);
              return rmcq(
                rng,
                t`Sabendo que $\cos\theta = -${fr(b, c)}$ e $\pi < \theta < \dfrac{3\pi}{2}$ (3º quadrante), quanto vale $\operatorname{cotg}\theta$?`,
                `$${fr(b, a)}$`,
                [`$-${fr(b, a)}$`, `$${fr(a, b)}$`, `$-${fr(a, b)}$`, `$${fr(c, a)}$`],
                t`No 3º quadrante a cotangente é positiva, e $\operatorname{cotg}\theta = \frac{\text{adjacente}}{\text{oposto}} = ${fr(b, a)}$.`,
              );
            }),
            fill(
              t`Complete os valores para $\operatorname{tg}\theta = \dfrac{3}{4}$ com $\theta$ no 3º quadrante:`,
              t`$\operatorname{sen}\theta =$ ___, $\cos\theta =$ ___ e $\sec\theta =$ ___.`,
              [t`$-\frac{3}{5}$`, t`$-\frac{4}{5}$`, t`$-\frac{5}{4}$`],
              [t`$\frac{3}{5}$`, t`$\frac{5}{4}$`],
              t`Hipotenusa $\sqrt{3^2+4^2}=5$; no 3º quadrante seno, cosseno e secante são todos negativos.`,
            ),
            multi(
              t`Se $\theta$ pertence ao 4º quadrante, quais das razões abaixo são **positivas**?`,
              [t`$\cos\theta$`, t`$\sec\theta$`, t`$\operatorname{sen}\theta$`, t`$\operatorname{tg}\theta$`, t`$\operatorname{cossec}\theta$`],
              [0, 1],
              t`No 4º quadrante ($x > 0, y < 0$), apenas o cosseno e sua recíproca $\sec\theta$ são positivos.`,
            ),
            num(
              t`Se $\sec\theta = -\dfrac{13}{5}$ e $\operatorname{sen}\theta > 0$, quanto vale $\operatorname{tg}\theta$?`,
              -2.4,
              t`$\cos\theta = -\frac{5}{13} < 0$ e $\operatorname{sen}\theta > 0$ indicam o 2º quadrante, com $\operatorname{sen}\theta = \frac{12}{13}$. Logo $\operatorname{tg}\theta = -\frac{12}{5} = -2{,}4$.`,
              { tol: 0.002 },
            ),
          ],
        },
      ],
    },
    {
      id: 'p-trig-soma',
      title: 'Soma de arcos e arco duplo',
      parts: [
        {
          card: {
            title: 'Soma e diferença de arcos',
            body: t`Cuidado: $\operatorname{sen}(a+b)$ **não** é $\operatorname{sen} a + \operatorname{sen} b$! As fórmulas corretas são:

$$\operatorname{sen}(a \pm b) = \operatorname{sen} a\cos b \pm \cos a\operatorname{sen} b$$
$$\cos(a \pm b) = \cos a\cos b \mp \operatorname{sen} a\operatorname{sen} b$$
$$\operatorname{tg}(a \pm b) = \frac{\operatorname{tg} a \pm \operatorname{tg} b}{1 \mp \operatorname{tg} a\operatorname{tg} b}$$

Com elas calculamos ângulos como $15^\circ = 45^\circ - 30^\circ$ e $75^\circ = 45^\circ + 30^\circ$.`,
            visual: sumAnglesLab(),
            example: t`$$\operatorname{sen} 15^\circ = \operatorname{sen}(45^\circ - 30^\circ) = \frac{\sqrt{2}}{2}\frac{\sqrt{3}}{2} - \frac{\sqrt{2}}{2}\frac{1}{2} = \frac{\sqrt{6} - \sqrt{2}}{4}$$`,
            tip: t`No **seno**, o sinal do meio se **mantém** ($\pm \to \pm$). No **cosseno**, o sinal se **inverte** ($\pm \to \mp$).`,
          },
          exercises: [
            mcqS(
              t`Qual é a expansão correta de $\cos(a + b)$?`,
              t`$\cos a\cos b - \operatorname{sen} a\operatorname{sen} b$`,
              [
                t`$\cos a\cos b + \operatorname{sen} a\operatorname{sen} b$`,
                t`$\operatorname{sen} a\cos b + \cos a\operatorname{sen} b$`,
                t`$\cos a + \cos b$`,
                t`$\cos a\operatorname{sen} b - \operatorname{sen} a\cos b$`,
              ],
              t`No cosseno da soma, multiplicamos cossenos e subtraímos o produto dos senos.`,
            ),
            inter(
              t`No laboratório, ajuste $\alpha = 45^\circ$ e $\beta = 30^\circ$ para formar o arco soma $\alpha + \beta = 75^\circ$.`,
              'plot',
              sumAnglesLab().props,
              (v: any) => v && v.p.a === 45 && v.p.b === 30,
              t`$\alpha = 45^\circ$, $\beta = 30^\circ$`,
              t`Com $45^\circ + 30^\circ = 75^\circ$, obtemos $\cos 75^\circ = \frac{\sqrt{6}-\sqrt{2}}{4} \approx 0{,}259$.`,
            ),
            mcqS(
              t`Escrevendo $15^\circ = 45^\circ - 30^\circ$, qual é o valor exato de $\cos 15^\circ$?`,
              t`$\dfrac{\sqrt{6} + \sqrt{2}}{4}$`,
              [
                t`$\dfrac{\sqrt{6} - \sqrt{2}}{4}$`,
                t`$\dfrac{\sqrt{3} + 1}{2}$`,
                t`$\dfrac{\sqrt{3} - \sqrt{2}}{2}$`,
                t`$\dfrac{\sqrt{2}}{4}$`,
              ],
              t`$\cos(45^\circ - 30^\circ) = \cos 45^\circ\cos 30^\circ + \operatorname{sen} 45^\circ\operatorname{sen} 30^\circ = \frac{\sqrt{6} + \sqrt{2}}{4}$ (que também é igual a $\operatorname{sen} 75^\circ$).`,
            ),
            gen((rng) => {
              const [a, b, sum, ans] = pick(rng, [
                [18, 12, 30, 0.5],
                [13, 17, 30, 0.5],
                [52, 38, 90, 1],
                [67, 23, 90, 1],
              ] as const);
              return num(
                t`Calcule o valor exato de $\operatorname{sen} ${a}^\circ \cos ${b}^\circ + \cos ${a}^\circ \operatorname{sen} ${b}^\circ$.`,
                ans,
                t`Reconhecendo a fórmula de $\operatorname{sen}(a+b)$: $\operatorname{sen}(${a}^\circ + ${b}^\circ) = \operatorname{sen} ${sum}^\circ = ${fmt(ans)}$.`,
              );
            }),
            gen((rng) => {
              const [ta, tb, ans] = pick(rng, [
                [1, 2, -3],
                [1, 3, -2],
                [2, 3, -1],
                [1, 0.5, 3],
              ] as const);
              return num(
                t`Sabendo que $\operatorname{tg} a = ${fmt(ta)}$ e $\operatorname{tg} b = ${fmt(tb)}$, calcule $\operatorname{tg}(a + b)$.`,
                ans,
                t`$\operatorname{tg}(a+b) = \frac{${fmt(ta)} + ${fmt(tb)}}{1 - ${fmt(ta)}\cdot ${fmt(tb)}} = \frac{${fmt(ta + tb)}}{${fmt(1 - ta * tb)}} = ${ans}$.`,
              );
            }),
            mcqS(
              t`Quanto vale $\operatorname{tg} 15^\circ = \operatorname{tg}(45^\circ - 30^\circ)$ após racionalizar o denominador?`,
              t`$2 - \sqrt{3}$`,
              [
                t`$2 + \sqrt{3}$`,
                t`$\sqrt{3} - 1$`,
                t`$1 - \dfrac{\sqrt{3}}{3}$`,
                t`$\dfrac{\sqrt{3}}{2}$`,
              ],
              t`$\frac{1 - \sqrt{3}/3}{1 + \sqrt{3}/3} = \frac{3 - \sqrt{3}}{3 + \sqrt{3}} = \frac{(3-\sqrt{3})^2}{9 - 3} = \frac{12 - 6\sqrt{3}}{6} = 2 - \sqrt{3}$.`,
            ),
            fill(
              t`Aplique as fórmulas de adição para arcos complementares:`,
              t`$\cos\left(x + \frac{\pi}{2}\right) =$ ___ e $\operatorname{sen}\left(\frac{\pi}{2} - x\right) =$ ___.`,
              [t`$-\operatorname{sen} x$`, t`$\cos x$`],
              [t`$\operatorname{sen} x$`, t`$-\cos x$`],
              t`$\cos x\cos\frac{\pi}{2} - \operatorname{sen} x\operatorname{sen}\frac{\pi}{2} = -\operatorname{sen} x$, e $\operatorname{sen}\frac{\pi}{2}\cos x - \cos\frac{\pi}{2}\operatorname{sen} x = \cos x$.`,
            ),
            gen((rng) => {
              const isSin = rng() < 0.5;
              // a: 3-4-5 (sen a = 3/5, cos a = 4/5), b: 5-12-13 (sen b = 5/13, cos b = 12/13)
              const numVal = isSin ? 3 * 12 + 4 * 5 : 4 * 12 + 3 * 5;
              const expr = isSin ? '\\operatorname{sen}(a + b)' : '\\cos(a - b)';
              return num(
                t`Se $a$ e $b$ são ângulos agudos com $\operatorname{sen} a = \dfrac{3}{5}$ e $\cos b = \dfrac{12}{13}$, calcule $${expr}$. (fração ou decimal)`,
                numVal / 65,
                t`Como $a, b$ são agudos, $\cos a = \frac{4}{5}$ e $\operatorname{sen} b = \frac{5}{13}$. Logo $${expr} = \frac{${numVal}}{65}$.`,
                { tol: 0.002 },
              );
            }),
          ],
        },
        {
          card: {
            title: 'Arco duplo e redução de potência',
            body: t`Fazendo $b = a$ nas fórmulas da soma, obtemos o **arco duplo**:
$$\operatorname{sen}(2a) = 2\operatorname{sen} a\cos a\qquad \operatorname{tg}(2a) = \frac{2\operatorname{tg} a}{1 - \operatorname{tg}^2 a}$$
$$\cos(2a) = \cos^2 a - \operatorname{sen}^2 a = 2\cos^2 a - 1 = 1 - 2\operatorname{sen}^2 a$$

Isolando $\operatorname{sen}^2 x$ e $\cos^2 x$, chegamos às **fórmulas de redução de potência** (vitais para calcular $\int \operatorname{sen}^2 x\,dx$ e $\int \cos^2 x\,dx$):
$$\operatorname{sen}^2 x = \frac{1 - \cos(2x)}{2}\qquad \cos^2 x = \frac{1 + \cos(2x)}{2}$$`,
            visual: powerRedLab(),
            tip: t`Reduzir a potência troca o quadrado ($\operatorname{sen}^2 x$) por um cosseno de frequência dobrada ($\cos 2x$), que é imediato de integrar!`,
          },
          exercises: [
            multi(
              t`Quais das expressões abaixo são identicamente iguais a $\cos(2x)$?`,
              [
                t`$\cos^2 x - \operatorname{sen}^2 x$`,
                t`$2\cos^2 x - 1$`,
                t`$1 - 2\operatorname{sen}^2 x$`,
                t`$2\cos x$`,
                t`$\operatorname{sen}^2 x - \cos^2 x$`,
              ],
              [0, 1, 2],
              t`Trocando $\operatorname{sen}^2 x = 1 - \cos^2 x$ ou $\cos^2 x = 1 - \operatorname{sen}^2 x$ em $\cos^2 x - \operatorname{sen}^2 x$, surgem as três formas clássicas de $\cos(2x)$.`,
            ),
            mcqS(
              t`Para integrar $\cos^2 x$ em Cálculo, reescrevemos $\cos^2 x$ sem expoente usando…`,
              t`$\dfrac{1 + \cos(2x)}{2}$`,
              [
                t`$\dfrac{1 - \cos(2x)}{2}$`,
                t`$1 - \operatorname{sen}^2 x$`,
                t`$2\cos x \operatorname{sen} x$`,
                t`$\dfrac{1 + \operatorname{sen}(2x)}{2}$`,
              ],
              t`De $\cos(2x) = 2\cos^2 x - 1$, isolamos $\cos^2 x = \frac{1 + \cos(2x)}{2}$.`,
            ),
            gen((rng) => {
              const c = pick(rng, [0.5, 0.6, 0.8, 0.25]);
              const ans = 2 * c * c - 1;
              return num(
                t`Se $\cos x = ${fmt(c)}$, quanto vale $\cos(2x)$?`,
                ans,
                t`Usando $\cos(2x) = 2\cos^2 x - 1 = 2\cdot(${fmt(c)})^2 - 1 = ${fmt(ans)}$.`,
                { tol: 0.001 },
              );
            }),
            gen((rng) => {
              const [k, ans] = pick(rng, [
                [15, '\\frac{1}{2}'],
                [22.5, '\\frac{\\sqrt{2}}{2}'],
                [30, '\\frac{\\sqrt{3}}{2}'],
                [75, '\\frac{1}{2}'],
              ] as const);
              return rmcq(
                rng,
                t`Qual é o valor exato de $2\operatorname{sen}(${fmt(k)}^\circ)\cos(${fmt(k)}^\circ)$?`,
                `$${ans}$`,
                ['\\frac{1}{2}', '\\frac{\\sqrt{2}}{2}', '\\frac{\\sqrt{3}}{2}', '1', '\\frac{\\sqrt{3}}{4}']
                  .filter((x) => x !== ans)
                  .map((x) => `$${x}$`),
                t`$2\operatorname{sen}(${fmt(k)}^\circ)\cos(${fmt(k)}^\circ) = \operatorname{sen}(${2 * k}^\circ) = ${ans}$.`,
              );
            }),
            gen((rng) => {
              const [tg, ans] = pick(rng, [
                [2, -4 / 3],
                [3, -0.75],
                [0.5, 4 / 3],
              ] as const);
              return num(
                t`Se $\operatorname{tg} a = ${fmt(tg)}$, quanto vale $\operatorname{tg}(2a)$? (fração ou decimal)`,
                ans,
                t`$\operatorname{tg}(2a) = \frac{2\operatorname{tg} a}{1 - \operatorname{tg}^2 a} = \frac{${fmt(2 * tg)}}{${fmt(1 - tg * tg)}} \approx ${fmt(ans, 3)}$.`,
                { tol: 0.002 },
              );
            }),
            match(
              t`Ligue cada expressão à sua identidade equivalente:`,
              [
                [t`$2\operatorname{sen} x\cos x$`, t`$\operatorname{sen}(2x)$`],
                [t`$\dfrac{1 - \cos(2x)}{2}$`, t`$\operatorname{sen}^2 x$`],
                [t`$\dfrac{1 + \cos(2x)}{2}$`, t`$\cos^2 x$`],
                [t`$1 - 2\operatorname{sen}^2 x$`, t`$\cos(2x)$`],
              ],
              t`São as identidades de arco duplo e redução de potência.`,
            ),
            tf(
              t`O valor médio de $\operatorname{sen}^2 x$ num período completo é $\dfrac{1}{2}$.`,
              true,
              t`Como $\operatorname{sen}^2 x = \frac{1}{2} - \frac{1}{2}\cos(2x)$ e a média de $\cos(2x)$ é zero, a linha média fica exatamente em $\frac{1}{2}$.`,
            ),
            num(
              t`Usando $\cos^2\left(\dfrac{\pi}{8}\right) = \dfrac{1 + \cos(\pi/4)}{2}$, calcule $8\cos^2\left(\dfrac{\pi}{8}\right) - 4$. (2 casas)`,
              2 * Math.SQRT2,
              t`$8\cdot\frac{1 + \sqrt{2}/2}{2} - 4 = 4 + 2\sqrt{2} - 4 = 2\sqrt{2} \approx 2{,}83$.`,
              { tol: 0.02 },
            ),
          ],
        },
        {
          card: {
            title: 'Equações trigonométricas',
            body: t`Para resolver equações trigonométricas mais elaboradas em $[0,\,2\pi)$:

• **Arco múltiplo** ($\operatorname{sen}(kx) = c$): se $x \in [0,\,2\pi)$, então $u = kx$ percorre $[0,\,2k\pi)$, gerando **$k$ vezes mais soluções**!
• **Fatoração**: passe tudo para um lado e coloque em evidência. **Nunca divida** por uma expressão que pode ser zero!
• **Quadrática**: troque $\operatorname{sen}^2 x = 1 - \cos^2 x$ para ficar com uma única função.`,
            example: t`Em $\operatorname{sen}(2x) = \cos x$: $2\operatorname{sen} x\cos x - \cos x = 0 \Rightarrow \cos x(2\operatorname{sen} x - 1) = 0 \Rightarrow \cos x = 0$ ou $\operatorname{sen} x = \frac{1}{2}$.`,
          },
          exercises: [
            mcqS(
              t`Quais são as soluções de $\cos x = \dfrac{1}{2}$ no intervalo $[0,\,2\pi)$?`,
              t`$\dfrac{\pi}{3}$ e $\dfrac{5\pi}{3}$`,
              [
                t`$\dfrac{\pi}{3}$ e $\dfrac{2\pi}{3}$`,
                t`$\dfrac{\pi}{6}$ e $\dfrac{11\pi}{6}$`,
                t`$\dfrac{\pi}{3}$ e $\dfrac{4\pi}{3}$`,
                t`apenas $\dfrac{\pi}{3}$`,
              ],
              t`O cosseno é positivo no 1º e no 4º quadrantes: $\frac{\pi}{3}$ e $2\pi - \frac{\pi}{3} = \frac{5\pi}{3}$.`,
            ),
            gen((rng) => {
              const k = pick(rng, [2, 3, 4]);
              return num(
                t`Quantas soluções a equação $\operatorname{sen}(${k}x) = \dfrac{1}{2}$ possui no intervalo $[0,\,2\pi)$?`,
                2 * k,
                t`Como $x \in [0,\,2\pi)$, o argumento $u = ${k}x$ dá $${k}$ voltas completas no ciclo ($[0,\,${2 * k}\pi)$). Cada volta tem $2$ soluções, totalizando $2 \cdot ${k} = ${2 * k}$.`,
              );
            }),
            order(
              t`Ordene os passos para resolver $\operatorname{sen}(2x) = \cos x$ em $[0,\,2\pi)$:`,
              [
                t`Expandir o arco duplo: $2\operatorname{sen} x\cos x = \cos x$`,
                t`Passar para o mesmo lado e fatorar: $\cos x(2\operatorname{sen} x - 1) = 0$`,
                t`Anular cada fator: $\cos x = 0$ ou $\operatorname{sen} x = \dfrac{1}{2}$`,
                t`Obter as 4 soluções: $x \in \left\{\dfrac{\pi}{6},\,\dfrac{\pi}{2},\,\dfrac{5\pi}{6},\,\dfrac{3\pi}{2}\right\}$`,
              ],
              t`Fatorar $\cos x$ preserva as raízes $\frac{\pi}{2}$ e $\frac{3\pi}{2}$ onde $\cos x = 0$.`,
            ),
            mcqS(
              t`Ao resolver $\operatorname{sen}(2x) = \cos x$, por que é um erro dividir os dois lados por $\cos x$?`,
              t`Porque perderíamos as soluções em que $\cos x = 0$`,
              [
                t`Porque $\cos x$ é sempre negativo`,
                t`Porque a identidade do arco duplo deixa de valer`,
                t`Porque $\operatorname{sen}(2x)$ não é divisível por $2$`,
                t`Porque surgem raízes complexas`,
              ],
              t`Dividir por uma incógnita que pode valer zero descarta raízes legítimas da equação.`,
            ),
            gen((rng) => {
              const [val, ans] = pick(rng, [
                ['1', '\\frac{\\pi}{4}\\text{ e }\\frac{5\\pi}{4}'],
                ['\\sqrt{3}', '\\frac{\\pi}{3}\\text{ e }\\frac{4\\pi}{3}'],
                ['-1', '\\frac{3\\pi}{4}\\text{ e }\\frac{7\\pi}{4}'],
              ] as const);
              const all = [
                '\\frac{\\pi}{4}\\text{ e }\\frac{5\\pi}{4}',
                '\\frac{\\pi}{3}\\text{ e }\\frac{4\\pi}{3}',
                '\\frac{3\\pi}{4}\\text{ e }\\frac{7\\pi}{4}',
                '\\frac{\\pi}{6}\\text{ e }\\frac{7\\pi}{6}',
                '\\frac{\\pi}{3}\\text{ e }\\frac{2\\pi}{3}',
              ];
              return rmcq(
                rng,
                t`Resolva $\operatorname{tg} x = ${val}$ no intervalo $[0,\,2\pi)$.`,
                `$${ans}$`,
                all.filter((x) => x !== ans).map((x) => `$${x}$`),
                t`Como a tangente tem período $\pi$, se $x_0$ é solução, a outra em $[0,\,2\pi)$ é $x_0 + \pi$.`,
              );
            }),
            mcqS(
              t`Resolva $2\operatorname{sen}^2 x - \operatorname{sen} x - 1 = 0$ em $[0,\,2\pi)$.`,
              t`$\dfrac{\pi}{2},\ \dfrac{7\pi}{6}$ e $\dfrac{11\pi}{6}$`,
              [
                t`$\dfrac{\pi}{6},\ \dfrac{5\pi}{6}$ e $\dfrac{3\pi}{2}$`,
                t`$\dfrac{\pi}{2}$ e $\dfrac{3\pi}{2}$`,
                t`$\dfrac{\pi}{3},\ \dfrac{2\pi}{3}$ e $\pi$`,
                t`apenas $\dfrac{\pi}{2}$`,
              ],
              t`Fazendo $u = \operatorname{sen} x$: $2u^2 - u - 1 = 0 \Rightarrow u = 1$ ($x = \frac{\pi}{2}$) ou $u = -\frac{1}{2}$ ($x = \frac{7\pi}{6}$ e $\frac{11\pi}{6}$).`,
            ),
            num(
              t`Qual é a **menor** solução positiva (em graus) da equação $\cos(3x) = 0$?`,
              30,
              t`O primeiro zero positivo do cosseno é $90^\circ$: $3x = 90^\circ \Rightarrow x = 30^\circ$.`,
              { unit: '°' },
            ),
            num(
              t`Calcule a soma (em graus) das duas soluções de $\cos^2 x - \operatorname{sen}^2 x = \dfrac{1}{2}$ no intervalo $[0^\circ,\,180^\circ]$.`,
              180,
              t`$\cos(2x) = \frac{1}{2} \Rightarrow 2x = 60^\circ$ ou $2x = 300^\circ \Rightarrow x = 30^\circ$ ou $x = 150^\circ$. Soma: $30^\circ + 150^\circ = 180^\circ$.`,
              { unit: '°' },
            ),
          ],
        },
      ],
    },
    {
      id: 'p-trig-inv',
      title: 'Funções trigonométricas inversas',
      parts: [
        {
          card: {
            title: 'Restringindo o domínio: arcsen, arccos e arctg',
            body: t`Como $\operatorname{sen} x$, $\cos x$ e $\operatorname{tg} x$ são periódicas, elas repetem valores e não são bijetoras em $\mathbb R$. Para inverter, restringimos cada uma ao seu **ramo principal**:

• $y = \operatorname{arcsen} x$: domínio $[-1,\,1]$ e imagem $\left[-\dfrac{\pi}{2},\,\dfrac{\pi}{2}\right]$
• $y = \arccos x$: domínio $[-1,\,1]$ e imagem $[0,\,\pi]$
• $y = \operatorname{arctg} x$: domínio $\mathbb R$ e imagem $\left(-\dfrac{\pi}{2},\,\dfrac{\pi}{2}\right)$`,
            visual: invTrigLab(),
            tip: t`$\operatorname{arcsen} x$ nunca devolve um ângulo do 2º ou 3º quadrantes; $\arccos x$ nunca devolve um ângulo negativo!`,
          },
          exercises: [
            mcq(
              t`Por que precisamos restringir o domínio de $\operatorname{sen} x$ a $\left[-\dfrac{\pi}{2},\,\dfrac{\pi}{2}\right]$ para definir $\operatorname{arcsen} x$?`,
              [
                'Porque em $\\mathbb R$ a função seno repete valores e não é injetora',
                'Porque fora desse intervalo o seno não está definido',
                'Porque o seno fica maior que $1$ fora desse intervalo',
                'Porque o gráfico deixa de ser contínuo',
              ],
              0,
              t`Em $\left[-\frac{\pi}{2},\,\frac{\pi}{2}\right]$, $\operatorname{sen} x$ é estritamente crescente e atinge todos os valores de $[-1,\,1]$ uma única vez.`,
            ),
            match(
              t`Ligue cada função inversa à sua **imagem** (intervalo dos ângulos que ela devolve):`,
              [
                [t`$\operatorname{arcsen} x$`, t`$\left[-\frac{\pi}{2},\,\frac{\pi}{2}\right]$`],
                [t`$\arccos x$`, t`$[0,\,\pi]$`],
                [t`$\operatorname{arctg} x$`, t`$\left(-\frac{\pi}{2},\,\frac{\pi}{2}\right)$`],
              ],
              t`$\operatorname{arcsen}$ e $\operatorname{arctg}$ usam o 4º e 1º quadrantes ($\pm\frac{\pi}{2}$); $\arccos$ usa o 1º e 2º quadrantes ($[0,\,\pi]$).`,
            ),
            inter(
              t`No laboratório, ajuste $x$ para que $\operatorname{arcsen}(x) = \dfrac{\pi}{6} \approx 0{,}524$ rad ($30^\circ$).`,
              'plot',
              invTrigLab().props,
              (v: any) => v && near(v.p.x, 0.5, 0.03),
              t`$x = 0{,}5$`,
              t`Como $\operatorname{sen}\left(\frac{\pi}{6}\right) = 0{,}5$, temos $\operatorname{arcsen}(0{,}5) = \frac{\pi}{6}$.`,
            ),
            tf(
              t`O domínio da função $f(x) = \operatorname{arctg} x$ é o intervalo fechado $[-1,\,1]$.`,
              false,
              t`Como a imagem de $\operatorname{tg} x$ é $\mathbb R$, o domínio de sua inversa $\operatorname{arctg} x$ é todo o conjunto $\mathbb R$.`,
            ),
            gen((rng) => {
              const a = pick(rng, [-3, -2, 1, 2, 4]);
              const expr = a < 0 ? `x + ${-a}` : `x - ${a}`;
              return rmcq(
                rng,
                t`Qual é o domínio da função $f(x) = \operatorname{arcsen}(${expr})$?`,
                `$[${a - 1},\\,${a + 1}]$`,
                [
                  `$[-1,\\,1]$`,
                  `$[${-a - 1},\\,${-a + 1}]$`,
                  `$(${a - 1},\\,${a + 1})$`,
                  `$[0,\\,${a + 1}]$`,
                ],
                t`O argumento precisa ficar em $[-1,\,1]$: $-1 \le ${expr} \le 1 \iff ${a - 1} \le x \le ${a + 1}$.`,
              );
            }),
            mcqS(
              t`Quando $x \to +\infty$, de qual valor $\operatorname{arctg} x$ se aproxima (assíntota horizontal)?`,
              t`$\dfrac{\pi}{2}$`,
              [t`$\pi$`, t`$+\infty$`, t`$1$`, t`$0$`],
              t`As assíntotas verticais $x = \pm\frac{\pi}{2}$ da tangente viram assíntotas horizontais $y = \pm\frac{\pi}{2}$ de $\operatorname{arctg} x$.`,
            ),
            fill(
              t`Complete sobre o sinal das funções inversas quando a entrada é negativa ($-1 \le x < 0$):`,
              t`Para $x \in [-1,\,0)$, $\operatorname{arcsen} x$ pertence a ___ (4º quadrante), enquanto $\arccos x$ pertence a ___ (2º quadrante).`,
              [t`$\left[-\frac{\pi}{2},\,0\right)$`, t`$\left(\frac{\pi}{2},\,\pi\right]$`],
              [t`$[0,\,\pi]$`, t`$\left(\pi,\,\frac{3\pi}{2}\right]$`],
              t`Para entradas negativas, $\operatorname{arcsen} x < 0$ e $\arccos x \in \left(\frac{\pi}{2},\,\pi\right]$.`,
            ),
            gen((rng) => {
              const k = randInt(rng, 2, 6);
              return num(
                t`Qual é o comprimento do intervalo que forma o domínio de $f(x) = \arccos\left(\dfrac{x}{${k}}\right)$?`,
                2 * k,
                t`Precisamos de $-1 \le \frac{x}{${k}} \le 1 \iff -${k} \le x \le ${k}$. O comprimento de $[-${k},\,${k}]$ é $${2 * k}$.`,
              );
            }),
          ],
        },
        {
          card: {
            title: 'Valores notáveis das inversas',
            body: t`Calcular $\operatorname{arcsen} y$ é perguntar: *"qual ângulo do ramo principal tem seno igual a $y$?"*.

Atenção aos valores negativos:
• **Ímpares**: $\operatorname{arcsen}(-x) = -\operatorname{arcsen} x$ e $\operatorname{arctg}(-x) = -\operatorname{arctg} x$
• **Suplementar**: $\arccos(-x) = \pi - \arccos x$ (2º quadrante!)
• **Soma complementar**: $\operatorname{arcsen} x + \arccos x = \dfrac{\pi}{2}$ para todo $x \in [-1,\,1]$.`,
            example: t`• $\operatorname{arcsen}\left(-\frac{1}{2}\right) = -\frac{\pi}{6}$ ($-30^\circ$)
• $\arccos\left(-\frac{1}{2}\right) = \pi - \frac{\pi}{3} = \frac{2\pi}{3}$ ($120^\circ$)`,
          },
          exercises: [
            mcqS(
              t`Quanto vale $\operatorname{arcsen}\left(-\dfrac{1}{2}\right)$ em radianos?`,
              t`$-\dfrac{\pi}{6}$`,
              [
                t`$\dfrac{7\pi}{6}$`,
                t`$\dfrac{5\pi}{6}$`,
                t`$-\dfrac{\pi}{3}$`,
                t`$\dfrac{11\pi}{6}$`,
              ],
              t`O único ângulo em $\left[-\frac{\pi}{2},\,\frac{\pi}{2}\right]$ cujo seno vale $-\frac{1}{2}$ é $-\frac{\pi}{6}$.`,
            ),
            mcqS(
              t`Quanto vale $\arccos\left(-\dfrac{1}{2}\right)$ em radianos?`,
              t`$\dfrac{2\pi}{3}$`,
              [
                t`$-\dfrac{\pi}{3}$`,
                t`$\dfrac{4\pi}{3}$`,
                t`$\dfrac{\pi}{3}$`,
                t`$-\dfrac{2\pi}{3}$`,
              ],
              t`A imagem de $\arccos$ é $[0,\,\pi]$: $\arccos\left(-\frac{1}{2}\right) = \pi - \frac{\pi}{3} = \frac{2\pi}{3}$.`,
            ),
            gen((rng) => {
              const item = pick(rng, [
                ['\\operatorname{arcsen}\\left(\\frac{\\sqrt{3}}{2}\\right)', 60],
                ['\\arccos\\left(\\frac{\\sqrt{2}}{2}\\right)', 45],
                ['\\operatorname{arctg}(\\sqrt{3})', 60],
                ['\\operatorname{arctg}(-1)', -45],
                ['\\arccos(0)', 90],
                ['\\arccos\\left(-\\frac{\\sqrt{3}}{2}\\right)', 150],
              ] as const);
              return num(
                t`Calcule em graus o valor de $${item[0]}$.`,
                item[1],
                t`No ramo principal da função inversa correspondente, o ângulo é $${item[1]}^\circ$.`,
                { unit: '°' },
              );
            }),
            match(
              t`Ligue cada expressão ao seu valor exato em radianos:`,
              [
                [t`$\operatorname{arcsen}(1)$`, t`$\frac{\pi}{2}$`],
                [t`$\arccos(1)$`, '$0$'],
                [t`$\operatorname{arctg}(1)$`, t`$\frac{\pi}{4}$`],
                [t`$\arccos(-1)$`, t`$\pi$`],
              ],
              t`$\operatorname{sen}(\pi/2)=1$, $\cos(0)=1$, $\operatorname{tg}(\pi/4)=1$ e $\cos(\pi)=-1$.`,
            ),
            tf(
              t`Para todo $x \in [-1,\,1]$, vale a identidade $\operatorname{arcsen} x + \arccos x = \dfrac{\pi}{2}$.`,
              true,
              t`Se $\theta = \operatorname{arcsen} x$, então $\cos\left(\frac{\pi}{2} - \theta\right) = \operatorname{sen}\theta = x$, logo $\arccos x = \frac{\pi}{2} - \theta$.`,
            ),
            gen((rng) => {
              const g = pick(rng, [18, 25, 34, 52, 68]);
              return num(
                t`Sabendo que $\operatorname{arcsen} x = ${g}^\circ$, quanto vale $\arccos x$ em graus?`,
                90 - g,
                t`Como $\operatorname{arcsen} x + \arccos x = 90^\circ$, temos $\arccos x = 90^\circ - ${g}^\circ = ${90 - g}^\circ$.`,
                { unit: '°' },
              );
            }),
            gen((rng) => {
              const item = pick(rng, [
                ['\\operatorname{arcsen}\\left(\\frac{1}{2}\\right) + \\operatorname{arctg}(1)', '\\frac{5\\pi}{12}', '\\frac{\\pi}{6} + \\frac{\\pi}{4} = \\frac{5\\pi}{12}'],
                ['\\arccos\\left(\\frac{1}{2}\\right) + \\operatorname{arcsen}\\left(-\\frac{1}{2}\\right)', '\\frac{\\pi}{6}', '\\frac{\\pi}{3} - \\frac{\\pi}{6} = \\frac{\\pi}{6}'],
                ['\\operatorname{arctg}(\\sqrt{3}) + \\operatorname{arctg}(-\\sqrt{3})', '0', '\\frac{\\pi}{3} - \\frac{\\pi}{3} = 0'],
              ] as const);
              const pool = ['\\frac{5\\pi}{12}', '\\frac{\\pi}{6}', '0', '\\frac{\\pi}{2}', '\\frac{2\\pi}{3}'];
              return rmcq(
                rng,
                t`Quanto vale $${item[0]}$?`,
                `$${item[1]}$`,
                pool.filter((x) => x !== item[1]).map((x) => `$${x}$`),
                t`Calculando cada parcela no ramo principal: $${item[2]}$.`,
              );
            }),
            num(
              t`Calcule em graus: $\operatorname{arcsen}\left(-\dfrac{\sqrt{2}}{2}\right) + \arccos\left(-\dfrac{\sqrt{2}}{2}\right) + \operatorname{arctg}(\sqrt{3})$.`,
              150,
              t`$-45^\circ + 135^\circ + 60^\circ = 150^\circ$ (note que as duas primeiras somam $90^\circ$!).`,
              { unit: '°' },
            ),
          ],
        },
        {
          card: {
            title: 'Compostas e o método do triângulo',
            body: t`**1. Método do triângulo**: para transformar $\cos(\operatorname{arcsen} x)$ em álgebra, chame $\theta = \operatorname{arcsen} x$, logo $\operatorname{sen}\theta = \frac{x}{1}$. Num triângulo de hipotenusa $1$ e cateto oposto $x$, o adjacente é $\sqrt{1 - x^2}$:
$$\cos(\operatorname{arcsen} x) = \sqrt{1 - x^2}\qquad \operatorname{tg}(\operatorname{arcsen} x) = \frac{x}{\sqrt{1 - x^2}}$$

**2. A armadilha da composta**:
• $\operatorname{sen}(\operatorname{arcsen} x) = x$ sempre que $x \in [-1,\,1]$.
• Porém $\operatorname{arcsen}(\operatorname{sen} x) = x$ **somente se** $x \in \left[-\frac{\pi}{2},\,\frac{\pi}{2}\right]$! Fora daí, o resultado é o ângulo do ramo principal com o mesmo seno.`,
            visual: invTriangleLab(),
            example: t`$\operatorname{arcsen}\left(\operatorname{sen}\frac{5\pi}{6}\right) = \operatorname{arcsen}\left(\frac{1}{2}\right) = \frac{\pi}{6} \ne \frac{5\pi}{6}$.`,
            tip: t`Essa identidade $\cos(\operatorname{arcsen} x) = \sqrt{1-x^2}$ é o que explica por que a derivada de $\operatorname{arcsen} x$ é $\frac{1}{\sqrt{1-x^2}}$!`,
          },
          exercises: [
            mcqS(
              t`Para todo $x \in [-1,\,1]$, a expressão $\cos(\operatorname{arcsen} x)$ é igual a…`,
              t`$\sqrt{1 - x^2}$`,
              [t`$1 - x^2$`, t`$\sqrt{1 + x^2}$`, t`$\dfrac{1}{x}$`, t`$1 - x$`],
              t`Com $\theta = \operatorname{arcsen} x \in \left[-\frac{\pi}{2},\,\frac{\pi}{2}\right]$, temos $\cos\theta \ge 0$ e $\cos\theta = \sqrt{1 - \operatorname{sen}^2\theta} = \sqrt{1 - x^2}$.`,
            ),
            mcqS(
              t`Usando um triângulo retângulo com cateto oposto $x$ e cateto adjacente $1$ ($\theta = \operatorname{arctg} x$), quanto vale $\sec(\operatorname{arctg} x)$?`,
              t`$\sqrt{1 + x^2}$`,
              [t`$\sqrt{1 - x^2}$`, t`$1 + x^2$`, t`$\dfrac{x}{\sqrt{1 + x^2}}$`, t`$\dfrac{1}{x}$`],
              t`A hipotenusa é $\sqrt{1^2 + x^2} = \sqrt{1 + x^2}$, logo $\sec\theta = \frac{\text{hip}}{\text{adj}} = \sqrt{1 + x^2}$.`,
            ),
            gen((rng) => {
              const [a, b, c] = pick(rng, TRI);
              const mode = rng() < 0.5;
              return num(
                mode
                  ? t`Calcule $\cos\left(\operatorname{arcsen}\dfrac{${a}}{${c}}\right)$. (fração ou decimal)`
                  : t`Calcule $\operatorname{sen}\left(\operatorname{arctg}\dfrac{${a}}{${b}}\right)$. (fração ou decimal)`,
                mode ? b / c : a / c,
                t`Pelo triângulo retângulo $${a}\text{-}${b}\text{-}${c}$, a razão pedida vale $${fr(mode ? b : a, c)}$.`,
                { tol: 0.002 },
              );
            }),
            tf(
              t`$\operatorname{arcsen}\left(\operatorname{sen}\dfrac{5\pi}{6}\right) = \dfrac{5\pi}{6}$.`,
              false,
              t`Como $\frac{5\pi}{6}$ está fora de $\left[-\frac{\pi}{2},\,\frac{\pi}{2}\right]$, temos $\operatorname{arcsen}\left(\operatorname{sen}\frac{5\pi}{6}\right) = \operatorname{arcsen}\left(\frac{1}{2}\right) = \frac{\pi}{6}$.`,
            ),
            gen((rng) => {
              const [ang, ans] = pick(rng, [
                ['\\frac{2\\pi}{3}', '\\frac{\\pi}{3}'],
                ['\\frac{3\\pi}{4}', '\\frac{\\pi}{4}'],
                ['\\frac{5\\pi}{6}', '\\frac{\\pi}{6}'],
                ['\\frac{7\\pi}{6}', '-\\frac{\\pi}{6}'],
              ] as const);
              const pool = ['\\frac{\\pi}{3}', '\\frac{\\pi}{4}', '\\frac{\\pi}{6}', '-\\frac{\\pi}{6}', ang];
              return rmcq(
                rng,
                t`Quanto vale $\operatorname{arcsen}\left(\operatorname{sen}\left(${ang}\right)\right)$?`,
                `$${ans}$`,
                pool.filter((x) => x !== ans).map((x) => `$${x}$`),
                t`Reduza ao ramo principal $\left[-\frac{\pi}{2},\,\frac{\pi}{2}\right]$: o ângulo com o mesmo seno de $${ang}$ é $${ans}$.`,
              );
            }),
            order(
              t`Ordene os passos para encontrar a expressão algébrica de $\operatorname{tg}(\arccos x)$ para $0 < x < 1$:`,
              [
                t`Definir $\theta = \arccos x$, de modo que $\cos\theta = \dfrac{x}{1}$`,
                t`Montar um triângulo retângulo com hipotenusa $1$ e cateto adjacente $x$`,
                t`Aplicar Pitágoras para achar o cateto oposto: $\sqrt{1 - x^2}$`,
                t`Escrever a tangente (oposto sobre adjacente): $\dfrac{\sqrt{1 - x^2}}{x}$`,
              ],
              t`O método do triângulo converte qualquer composta $\text{trig}(\text{arctrig } x)$ numa expressão algébrica.`,
            ),
            fill(
              t`Compare as duas ordens de composição:`,
              t`Enquanto $\operatorname{sen}(\operatorname{arcsen} 0{,}7) =$ ___, a composta $\operatorname{arcsen}(\operatorname{sen} 2)$ vale ___ pois $2$ rad está no 2º quadrante.`,
              ['$0,7$', t`$\pi - 2$`],
              ['$2$', t`$2 - \pi$`],
              t`Para $2 \in \left(\frac{\pi}{2},\,\pi\right)$, o arco simétrico no 1º quadrante com o mesmo seno é $\pi - 2 \approx 1{,}14$ rad.`,
            ),
            num(
              t`Calcule $\operatorname{sen}\left(2\operatorname{arcsen}\dfrac{3}{5}\right)$ usando $\operatorname{sen}(2\theta) = 2\operatorname{sen}\theta\cos\theta$.`,
              0.96,
              t`Com $\theta = \operatorname{arcsen}\frac{3}{5}$, temos $\operatorname{sen}\theta = \frac{3}{5}$ e $\cos\theta = \frac{4}{5}$. Logo $\operatorname{sen}(2\theta) = 2\cdot\frac{3}{5}\cdot\frac{4}{5} = \frac{24}{25} = 0{,}96$.`,
            ),
          ],
        },
      ],
    },
  ],
};

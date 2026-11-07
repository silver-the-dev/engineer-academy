import React from 'react';
import type { UnitDef } from '../../types';
import { gen, mcq, mcqS, num, tf, fill, match, order, inter, plot, rmcq, near, multi } from '../../helpers';
import { ArcW, AreaUnder, FnCurve, Label, PolygonW, Pt, RectW, Seg } from '../../../components/plot/Plot';
import { C } from '../../../theme';
import { fmt, randInt, polyTex, term } from '../../../lib/random';

const t = String.raw;

const sinSqLab = () =>
  plot({
    view: { xMin: -0.2, xMax: 6.5, yMin: -0.15, yMax: 1.25 },
    params: [
      { key: 'b', label: 'b', min: 0.5, max: 6.28, step: 0.02, value: 2.2, color: C.p2 },
      { key: 'h', label: 'h', min: 0.1, max: 1, step: 0.05, value: 0.35, color: C.gold },
    ],
    render: ({ p }: any) => (
      <>
        <AreaUnder f={(x) => Math.sin(x) ** 2} a={0} b={p.b} color={C.p1} opacity={0.32} />
        <RectW x={0} y={0} w={p.b} h={p.h} color={C.gold} opacity={0.2} />
        <FnCurve f={(x) => Math.sin(x) ** 2} from={0} to={6.28} color={C.p1} />
        <Seg x1={0} y1={p.h} x2={6.28} y2={p.h} color={C.gold} width={2.5} dash="6 4" />
        <Pt x={p.b} y={Math.sin(p.b) ** 2} color={C.p2} r={5} />
      </>
    ),
    info: ({ p }: any) => {
      const exact = 0.5 * p.b - 0.25 * Math.sin(2 * p.b);
      return t`$\int_0^{${fmt(p.b, 2)}}\operatorname{sen}^2 x\,dx = ${fmt(exact, 3)}$ · retângulo $h\cdot b = ${fmt(p.h * p.b, 3)}$ (média $h=0{,}5$)`;
    },
  });

const circleTrigLab = () =>
  plot({
    view: { xMin: -2.4, xMax: 2.4, yMin: -0.35, yMax: 2.35 },
    equalAspect: true,
    params: [{ key: 'b', label: 'b', min: 0.1, max: 2, step: 0.05, value: 1.2, color: C.p2 }],
    render: ({ p }: any) => {
      const y = Math.sqrt(Math.max(0, 4 - p.b * p.b));
      return (
        <>
          <AreaUnder f={(x) => Math.sqrt(Math.max(0, 4 - x * x))} a={0} b={p.b} color={C.p1} opacity={0.32} />
          <FnCurve f={(x) => Math.sqrt(Math.max(0, 4 - x * x))} from={-2} to={2} color={C.p1} samples={260} />
          <PolygonW pts={[[0, 0], [p.b, 0], [p.b, y]]} color={C.gold} opacity={0.22} strokeWidth={1.8} />
          <Pt x={p.b} y={y} color={C.p2} r={5} />
        </>
      );
    },
    info: ({ p }: any) => {
      const y = Math.sqrt(Math.max(0, 4 - p.b * p.b));
      const theta = Math.asin(Math.min(1, p.b / 2));
      const area = 2 * theta + 0.5 * p.b * y;
      return t`$x=2\operatorname{sen}\theta\implies \theta=${fmt((theta * 180) / Math.PI, 1)}^\circ$ · $\int_0^{${fmt(p.b, 2)}}\sqrt{4-x^2}\,dx = ${fmt(area, 3)}$`;
    },
  });

const refTriangleLab = () =>
  plot({
    view: { xMin: -0.4, xMax: 3.4, yMin: -0.45, yMax: 2.35 },
    equalAspect: true,
    grid: false,
    axes: false,
    tickLabels: false,
    params: [
      { key: 'a', label: 'a', min: 1.5, max: 3, step: 0.25, value: 2.5, color: C.gold },
      { key: 'x', label: 'x', min: 0.5, max: 2, step: 0.25, value: 1, color: C.p5 },
    ],
    render: ({ p }: any) => {
      const xx = Math.min(p.x, p.a - 0.1);
      const adj = Math.sqrt(Math.max(0.01, p.a * p.a - xx * xx));
      const ang = Math.atan2(xx, adj);
      return (
        <>
          <PolygonW pts={[[0, 0], [adj, 0], [adj, xx]]} color={C.p1} opacity={0.22} strokeWidth={2.5} />
          <ArcW cx={0} cy={0} r={0.42} a0={0} a1={ang} color={C.gold} width={2.5} />
          <Seg x1={0} y1={0} x2={adj} y2={0} color={C.p2} width={4} />
          <Seg x1={adj} y1={0} x2={adj} y2={xx} color={C.p5} width={4} />
          <Seg x1={0} y1={0} x2={adj} y2={xx} color={C.gold} width={4} />
          <Label x={adj / 2} y={-0.24} text={`√(a²−x²) = ${fmt(adj, 2)}`} color={C.p2} anchor="middle" />
          <Label x={adj + 0.12} y={xx / 2} text={`x = ${fmt(xx, 2)}`} color={C.p5} anchor="start" />
          <Label x={adj / 2 - 0.15} y={xx / 2 + 0.18} text={`a = ${fmt(p.a, 2)}`} color={C.gold} anchor="end" />
        </>
      );
    },
    info: ({ p }: any) => {
      const xx = Math.min(p.x, p.a - 0.1);
      const adj = Math.sqrt(Math.max(0.01, p.a * p.a - xx * xx));
      return t`$\operatorname{sen}\theta=\frac{x}{a}=${fmt(xx / p.a, 2)}$ · $\cos\theta=\frac{\sqrt{a^2-x^2}}{a}=${fmt(adj / p.a, 2)}$ · $\operatorname{tg}\theta=\frac{x}{\sqrt{a^2-x^2}}=${fmt(xx / adj, 2)}$`;
    },
  });

const partialFracLab = () =>
  plot({
    view: { xMin: -3.5, xMax: 3.5, yMin: -4, yMax: 4 },
    params: [
      { key: 'A', label: 'A', min: -2, max: 2, step: 0.25, value: 0.5, color: C.p2 },
      { key: 'B', label: 'B', min: -2, max: 2, step: 0.25, value: 0.5, color: C.p3 },
    ],
    render: ({ p }: any) => (
      <>
        <Seg x1={-1} y1={-4} x2={-1} y2={4} color={C.textDim} dash="4 4" width={1.2} />
        <Seg x1={1} y1={-4} x2={1} y2={4} color={C.textDim} dash="4 4" width={1.2} />
        <FnCurve f={(x) => (Math.abs(x * x - 1) < 0.08 ? NaN : 2 / (x * x - 1))} color={C.gold} dash="7 5" width={2.5} samples={300} />
        <FnCurve f={(x) => (Math.abs(x - 1) < 0.06 || Math.abs(x + 1) < 0.06 ? NaN : p.A / (x - 1) + p.B / (x + 1))} color={C.p2} width={3} samples={300} />
      </>
    ),
    info: ({ p }: any) => {
      const c1 = p.A + p.B;
      const c0 = p.A - p.B;
      return t`$\frac{${fmt(p.A, 2)}}{x-1}+\frac{${fmt(p.B, 2)}}{x+1}=\frac{${fmt(c1, 2)}x${c0 < 0 ? '' : '+'}${fmt(c0, 2)}}{x^2-1}$ · alvo tracejado: $\frac{2}{x^2-1}$`;
    },
  });

const pIntegralLab = () =>
  plot({
    view: { xMin: -0.3, xMax: 12.5, yMin: -0.15, yMax: 1.35 },
    params: [
      { key: 'p', label: 'p', min: 0.5, max: 2.5, step: 0.25, value: 2, color: C.p1 },
      { key: 'b', label: 'b', min: 2, max: 12, step: 0.5, value: 5, color: C.p3 },
    ],
    render: ({ p }: any) => (
      <>
        <AreaUnder f={(x) => Math.pow(x, -p.p)} a={1} b={p.b} color={p.p > 1 ? C.success : C.danger} opacity={0.32} />
        <FnCurve f={(x) => (x >= 0.85 ? Math.pow(x, -p.p) : NaN)} from={0.85} to={12.5} color={C.p1} width={3} />
        <Pt x={1} y={1} color={C.gold} r={4} />
        <Pt x={p.b} y={Math.pow(p.b, -p.p)} color={C.p3} r={5} />
      </>
    ),
    info: ({ p }: any) => {
      const area = Math.abs(p.p - 1) < 1e-6 ? Math.log(p.b) : (Math.pow(p.b, 1 - p.p) - 1) / (1 - p.p);
      return p.p > 1
        ? t`$\int_1^{${fmt(p.b, 1)}}\frac{1}{x^{${fmt(p.p, 2)}}}\,dx = ${fmt(area, 3)}$ · em $b\to\infty$, **converge** para $\frac{1}{p-1}=${fmt(1 / (p.p - 1), 3)}$`
        : t`$\int_1^{${fmt(p.b, 1)}}\frac{1}{x^{${fmt(p.p, 2)}}}\,dx = ${fmt(area, 3)}$ · em $b\to\infty$, cresce sem teto (**diverge**!)`;
    },
  });

export const tecnicas: UnitDef = {
  id: 'c-tec',
  title: 'Técnicas de integração',
  subtitle: 'Trigonométricas, substituição trigonométrica, frações parciais e impróprias',
  icon: '🛠️',
  source: 'Cálculo I · Unidade 4 — Técnicas de integração',
  guide: t`Quando a substituição simples e a integração por partes não bastam, reescrevemos o integrando: identidades resolvem potências trigonométricas, o triângulo de referência elimina raízes do tipo $\sqrt{a^2\pm x^2}$, frações parciais quebram quocientes de polinômios e limites estendem a integral para o infinito.`,
  lessons: [
    {
      id: 'c-tec-trig',
      title: 'Integrais trigonométricas',
      parts: [
        {
          card: {
            title: 'Potência ímpar: separe um fator',
            body: t`Em $\int\operatorname{sen}^m x\cos^n x\,dx$, quando um dos expoentes é **ímpar**, separe **um fator** dessa função junto do $dx$ para formar o $du$ e converta os fatores pares restantes usando:
$$\operatorname{sen}^2 x+\cos^2 x=1$$

• Se $\cos$ tem potência ímpar: separe $\cos x\,dx=du$, troque $\cos^2 x=1-\operatorname{sen}^2 x$ e faça $u=\operatorname{sen}x$.
• Se $\operatorname{sen}$ tem potência ímpar: separe $\operatorname{sen}x\,dx=-du$, troque $\operatorname{sen}^2 x=1-\cos^2 x$ e faça $u=\cos x$.`,
            formula: t`\operatorname{sen}^2 x+\cos^2 x=1`,
            example: t`$\int\cos^3 x\,dx=\int(1-\operatorname{sen}^2 x)\cos x\,dx=\int(1-u^2)\,du=\operatorname{sen}x-\frac{\operatorname{sen}^3 x}{3}+C$.`,
            tip: t`Quem manda na escolha de $u$ é a potência **ímpar**: o fator separado vira $du$ e a outra função vira $u$.`,
          },
          exercises: [
            mcq(
              t`Para calcular $\int\operatorname{sen}^4 x\cos^3 x\,dx$, qual é a melhor estratégia?`,
              [
                t`Separar $\cos x\,dx$, trocar $\cos^2 x=1-\operatorname{sen}^2 x$ e fazer $u=\operatorname{sen}x$`,
                t`Separar $\operatorname{sen}x\,dx$ e fazer $u=\cos x$`,
                t`Aplicar integração por partes três vezes`,
                t`Usar redução de potência nos dois termos`,
              ],
              0,
              t`A potência ímpar está no cosseno ($\cos^3 x$): separamos $\cos x\,dx=du$ e deixamos tudo em função de $u=\operatorname{sen}x$.`,
            ),
            mcqS(
              t`Calcule $\int\cos^3 x\,dx$.`,
              t`$\operatorname{sen}x-\frac{\operatorname{sen}^3 x}{3}+C$`,
              [t`$\frac{\cos^4 x}{4}+C$`, t`$\operatorname{sen}x+\frac{\operatorname{sen}^3 x}{3}+C$`, t`$-\cos x+\frac{\cos^3 x}{3}+C$`, t`$\frac{\operatorname{sen}^4 x}{4}+C$`],
              t`$\int(1-\operatorname{sen}^2 x)\cos x\,dx = \operatorname{sen}x-\frac{\operatorname{sen}^3 x}{3}+C$.`,
            ),
            mcqS(
              t`Calcule $\int\operatorname{sen}^3 x\,dx$.`,
              t`$-\cos x+\frac{\cos^3 x}{3}+C$`,
              [t`$\cos x-\frac{\cos^3 x}{3}+C$`, t`$-\frac{\cos^4 x}{4}+C$`, t`$-\cos x-\frac{\cos^3 x}{3}+C$`, t`$\operatorname{sen}x-\frac{\operatorname{sen}^3 x}{3}+C$`],
              t`Com $u=\cos x$ ($du=-\operatorname{sen}x\,dx$): $\int(1-u^2)(-du)=-u+\frac{u^3}{3}+C=-\cos x+\frac{\cos^3 x}{3}+C$.`,
            ),
            gen((rng) => {
              const m = randInt(rng, 2, 6);
              return rmcq(
                rng,
                t`Calcule $\int\operatorname{sen}^{${m}}x\cos x\,dx$.`,
                t`$\frac{\operatorname{sen}^{${m + 1}}x}{${m + 1}}+C$`,
                [
                  t`$-\frac{\operatorname{sen}^{${m + 1}}x}{${m + 1}}+C$`,
                  t`$\frac{\cos^{${m + 1}}x}{${m + 1}}+C$`,
                  t`$${m}\operatorname{sen}^{${m - 1}}x+C$`,
                  t`$\frac{\operatorname{sen}^{${m}}x}{${m}}+C$`,
                ],
                t`Com $u=\operatorname{sen}x$ e $du=\cos x\,dx$, temos $\int u^{${m}}\,du=\frac{\operatorname{sen}^{${m + 1}}x}{${m + 1}}+C$.`,
              );
            }),
            gen((rng) => {
              const m = randInt(rng, 2, 5);
              const k = randInt(rng, 1, 4);
              const a = (m + 1) * k;
              return num(
                t`Calcule a integral definida $\int_0^{\pi/2} ${a}\operatorname{sen}^{${m}}x\cos x\,dx$.`,
                k,
                t`Com $u=\operatorname{sen}x$ (de $0$ a $1$): $\int_0^1 ${a}u^{${m}}\,du = \left[${k === 1 ? '' : k}u^{${m + 1}}\right]_0^1 = ${k}$.`,
              );
            }),
            order(
              t`Ordene os passos para calcular $\int\operatorname{sen}^2 x\cos^3 x\,dx$:`,
              [
                t`Separar um fator da potência ímpar: $\int\operatorname{sen}^2 x\cos^2 x\cdot\cos x\,dx$`,
                t`Converter o par restante: $\int\operatorname{sen}^2 x(1-\operatorname{sen}^2 x)\cos x\,dx$`,
                t`Substituir $u=\operatorname{sen}x$ e $du=\cos x\,dx$: $\int(u^2-u^4)\,du$`,
                t`Integrar e voltar para $x$: $\frac{\operatorname{sen}^3 x}{3}-\frac{\operatorname{sen}^5 x}{5}+C$`,
              ],
              t`Separar um $\cos x$ permite reescrever todo o resto como polinômio em $u=\operatorname{sen}x$.`,
            ),
            num(
              t`Calcule $\int_0^{\pi/2}\cos^3 x\,dx$ (fração ou decimal com 3 casas).`,
              2 / 3,
              t`$\left[\operatorname{sen}x-\frac{\operatorname{sen}^3 x}{3}\right]_0^{\pi/2}=1-\frac13=\frac23\approx 0{,}667$.`,
              { tol: 0.005 },
            ),
            gen((rng) => {
              const n = randInt(rng, 2, 5);
              return rmcq(
                rng,
                t`Calcule $\int\operatorname{sen}^3 x\cos^{${n}}x\,dx$.`,
                t`$-\frac{\cos^{${n + 1}}x}{${n + 1}}+\frac{\cos^{${n + 3}}x}{${n + 3}}+C$`,
                [
                  t`$\frac{\cos^{${n + 1}}x}{${n + 1}}-\frac{\cos^{${n + 3}}x}{${n + 3}}+C$`,
                  t`$\frac{\operatorname{sen}^{4}x\cos^{${n + 1}}x}{${4 * (n + 1)}}+C$`,
                  t`$-\frac{\cos^{${n + 1}}x}{${n + 1}}-\frac{\cos^{${n + 3}}x}{${n + 3}}+C$`,
                  t`$\frac{\operatorname{sen}^{${n + 1}}x}{${n + 1}}+\frac{\operatorname{sen}^{${n + 3}}x}{${n + 3}}+C$`,
                ],
                t`Com $u=\cos x$ ($du=-\operatorname{sen}x\,dx$): $\int(1-u^2)u^{${n}}(-du)=-\frac{u^{${n + 1}}}{${n + 1}}+\frac{u^{${n + 3}}}{${n + 3}}+C$.`,
              );
            }),
          ],
        },
        {
          card: {
            title: 'Potências pares: redução de potência',
            body: t`Quando **todos** os expoentes de $\operatorname{sen}x$ e $\cos x$ são **pares**, não sobra fator isolado para o $du$. Usamos então as identidades do arco duplo para cair o grau pela metade:
$$\operatorname{sen}^2 x=\frac{1-\cos(2x)}{2}\qquad\cos^2 x=\frac{1+\cos(2x)}{2}$$

Veja que $\operatorname{sen}^2 x$ oscila entre $0$ e $1$ em torno da reta média $y=\frac12$:`,
            visual: sinSqLab(),
            example: t`$\int\operatorname{sen}^2 x\,dx=\int\frac{1-\cos(2x)}{2}\,dx=\frac{x}{2}-\frac{\operatorname{sen}(2x)}{4}+C$.`,
            tip: t`Em qualquer múltiplo de meio período ($[0,\,\pi]$ ou $[0,\,2\pi]$), a parcela oscilante $\cos(2x)$ tem integral zero e a área é simplesmente $\frac12$ vezes a largura do intervalo!`,
          },
          exercises: [
            inter(
              t`Ajuste $h$ para a altura média de $\operatorname{sen}^2 x$ ($0{,}5$) e leve $b$ até $\pi\approx 3{,}14$ para igualar a área do retângulo à integral.`,
              'plot',
              sinSqLab().props,
              (v: any) => v && near(v.p.h, 0.5, 0.03) && near(v.p.b, Math.PI, 0.08),
              t`$h=0{,}5$ e $b=\pi\approx 3{,}14$`,
              t`Em $[0,\,\pi]$, a onda $\cos(2x)$ completa um ciclo inteiro e se cancela, restando $\frac12\cdot\pi\approx 1{,}571$.`,
            ),
            fill(
              t`Complete as fórmulas de redução de potência:`,
              t`$\operatorname{sen}^2 x = \frac12($ ___ $)$ e $\cos^2 x = \frac12($ ___ $)$`,
              [t`$1-\cos(2x)$`, t`$1+\cos(2x)$`],
              [t`$1-\operatorname{sen}(2x)$`, t`$\cos(2x)-1$`, t`$1+\operatorname{sen}(2x)$`],
              t`Somando $\cos^2 x+\operatorname{sen}^2 x=1$ com $\cos^2 x-\operatorname{sen}^2 x=\cos(2x)$ saem as duas identidades.`,
            ),
            mcqS(
              t`Calcule $\int\cos^2 x\,dx$.`,
              t`$\frac{x}{2}+\frac{\operatorname{sen}(2x)}{4}+C$`,
              [t`$\frac{x}{2}-\frac{\operatorname{sen}(2x)}{4}+C$`, t`$\frac{\operatorname{sen}^3 x}{3}+C$`, t`$\frac{x}{2}+\frac{\operatorname{sen}(2x)}{2}+C$`, t`$x+\operatorname{sen}(2x)+C$`],
              t`$\int\frac{1+\cos(2x)}{2}\,dx=\frac{x}{2}+\frac{\operatorname{sen}(2x)}{4}+C$.`,
            ),
            mcqS(
              t`Calcule $\int\operatorname{sen}^2 x\,dx$.`,
              t`$\frac{x}{2}-\frac{\operatorname{sen}(2x)}{4}+C$`,
              [t`$\frac{x}{2}+\frac{\operatorname{sen}(2x)}{4}+C$`, t`$-\frac{\cos^3 x}{3}+C$`, t`$\frac{x}{2}-\frac{\cos(2x)}{4}+C$`, t`$\frac{x}{2}-\frac{\operatorname{sen}(2x)}{2}+C$`],
              t`$\int\frac{1-\cos(2x)}{2}\,dx=\frac{x}{2}-\frac{\operatorname{sen}(2x)}{4}+C$.`,
            ),
            gen((rng) => {
              const k = 2 * randInt(rng, 1, 4) - 1;
              return rmcq(
                rng,
                t`Quanto vale a integral definida $\int_0^{${k === 1 ? '' : k}\pi}\operatorname{sen}^2 x\,dx$?`,
                t`$\frac{${k === 1 ? '' : k}\pi}{2}$`,
                [t`$${k === 1 ? '' : k}\pi$`, t`$0$`, t`$\frac{${k === 1 ? '' : k}\pi}{4}$`, t`$${2 * k}\pi$`],
                t`Em $[0,\,${k === 1 ? '' : k}\pi]$, o termo $\frac{\operatorname{sen}(2x)}{4}$ zera nos extremos e sobra $\frac{${k === 1 ? '' : k}\pi}{2}$.`,
              );
            }),
            gen((rng) => {
              const a = randInt(rng, 1, 5);
              return num(
                t`Calcule $\dfrac{1}{\pi}\int_0^{2\pi} ${a === 1 ? '' : a}\cos^2 x\,dx$.`,
                a,
                t`Como $\int_0^{2\pi}\cos^2 x\,dx = \pi$, temos $\frac{1}{\pi}\cdot ${a}\pi = ${a}$.`,
              );
            }),
            mcqS(
              t`Para integrar $\int\operatorname{sen}^2 x\cos^2 x\,dx$, usando $\operatorname{sen}x\cos x=\frac12\operatorname{sen}(2x)$, o integrando se reduz a:`,
              t`$\frac18\big(1-\cos(4x)\big)$`,
              [t`$\frac14\big(1-\cos(2x)\big)$`, t`$\frac12\big(1+\cos(4x)\big)$`, t`$\frac18\big(1+\cos(4x)\big)$`, t`$\frac14\operatorname{sen}(4x)$`],
              t`$(\operatorname{sen}x\cos x)^2 = \frac14\operatorname{sen}^2(2x) = \frac14\cdot\frac{1-\cos(4x)}{2} = \frac18(1-\cos(4x))$.`,
            ),
            mcqS(
              t`Ao calcular $\int\cos^4 x\,dx = \int\left(\frac{1+\cos(2x)}{2}\right)^2 dx$, expandimos o quadrado e trocamos $\cos^2(2x)$ por:`,
              t`$\frac{1+\cos(4x)}{2}$`,
              [t`$\frac{1+\cos(2x)}{2}$`, t`$\frac{1-\cos(4x)}{2}$`, t`$\cos(4x)$`, t`$\frac{1+\cos(4x)}{4}$`],
              t`Aplicando novamente a redução de potência com o dobro do ângulo ($2x\to 4x$), obtemos $\frac{1+\cos(4x)}{2}$.`,
            ),
          ],
        },
        {
          card: {
            title: 'Tangente, secante e produtos',
            body: t`Para $\int\operatorname{tg}^m x\sec^n x\,dx$, usamos $\operatorname{tg}^2 x+1=\sec^2 x$ e as derivadas $(\operatorname{tg}x)'=\sec^2 x$ e $(\sec x)'=\sec x\operatorname{tg}x$:

• **$\sec$ com potência par**: separe $\sec^2 x\,dx=du$, troque o resto por $\operatorname{tg}^2 x+1$ e faça $u=\operatorname{tg}x$.
• **$\operatorname{tg}$ com potência ímpar**: separe $\sec x\operatorname{tg}x\,dx=du$, troque $\operatorname{tg}^2 x=\sec^2 x-1$ e faça $u=\sec x$.
• **Produtos $\operatorname{sen}(mx)\cos(nx)$**: viram soma de ondas; para $m\ne n$ inteiros, são **ortogonais** em $[0,\,2\pi]$ (integral nula).`,
            example: t`$\int\operatorname{tg}^2 x\,dx=\int(\sec^2 x-1)\,dx=\operatorname{tg}x-x+C$ e $\int\operatorname{tg}^3 x\sec^2 x\,dx=\frac{\operatorname{tg}^4 x}{4}+C$.`,
            tip: t`Guarde também a primitiva da secante: $\int\sec x\,dx=\ln|\sec x+\operatorname{tg}x|+C$.`,
          },
          exercises: [
            match(
              t`Ligue cada expressão de tangente e secante ao seu par:`,
              [
                [t`$(\operatorname{tg}x)'$`, t`$\sec^2 x$`],
                [t`$(\sec x)'$`, t`$\sec x\operatorname{tg}x$`],
                [t`$\operatorname{tg}^2 x+1$`, t`$\sec^2 x$ (identidade)`],
                [t`$\int\sec x\,dx$`, t`$\ln|\sec x+\operatorname{tg}x|+C$`],
              ],
              t`Essas quatro relações resolvem todas as integrais da família $\int\operatorname{tg}^m x\sec^n x\,dx$.`,
            ),
            mcqS(
              t`Calcule $\int\operatorname{tg}^2 x\,dx$.`,
              t`$\operatorname{tg}x-x+C$`,
              [t`$\frac{\operatorname{tg}^3 x}{3}+C$`, t`$\sec^2 x+C$`, t`$\operatorname{tg}x+x+C$`, t`$\sec x-x+C$`],
              t`Trocando $\operatorname{tg}^2 x = \sec^2 x - 1$, integramos $\sec^2 x$ para $\operatorname{tg}x$ e $-1$ para $-x$.`,
            ),
            gen((rng) => {
              const m = randInt(rng, 2, 6);
              return rmcq(
                rng,
                t`Calcule $\int\operatorname{tg}^{${m}}x\sec^2 x\,dx$.`,
                t`$\frac{\operatorname{tg}^{${m + 1}}x}{${m + 1}}+C$`,
                [
                  t`$\frac{\sec^{${m + 1}}x}{${m + 1}}+C$`,
                  t`$\frac{\operatorname{tg}^{${m}}x}{${m}}+C$`,
                  t`$${m}\operatorname{tg}^{${m - 1}}x+C$`,
                  t`$\frac{\operatorname{tg}^{${m + 1}}x\sec^3 x}{${m + 1}}+C$`,
                ],
                t`Com $u=\operatorname{tg}x$ e $du=\sec^2 x\,dx$: $\int u^{${m}}\,du = \frac{\operatorname{tg}^{${m + 1}}x}{${m + 1}}+C$.`,
              );
            }),
            gen((rng) => {
              const m = randInt(rng, 1, 4);
              const k = randInt(rng, 1, 5);
              const a = (m + 1) * k;
              return num(
                t`Calcule a integral definida $\int_0^{\pi/4} ${a}\operatorname{tg}${m === 1 ? "" : `^{${m}}`}x\sec^2 x\,dx$.`,
                k,
                t`Com $u=\operatorname{tg}x$, $u(0)=0$ e $u(\frac{\pi}{4})=1$: $\int_0^1 ${a}u${m === 1 ? "" : `^{${m}}`}\,du = \left[${k === 1 ? '' : k}u^{${m + 1}}\right]_0^1 = ${k}$.`,
              );
            }),
            mcqS(
              t`Para calcular $\int\operatorname{tg}^3 x\sec^3 x\,dx$ (potência de $\operatorname{tg}$ ímpar), qual substituição funciona direto?`,
              t`Separar $\sec x\operatorname{tg}x\,dx$, trocar $\operatorname{tg}^2 x=\sec^2 x-1$ e usar $u=\sec x$`,
              [
                t`Separar $\sec^2 x\,dx$ e usar $u=\operatorname{tg}x$`,
                t`Fazer $u=\operatorname{sen}x$ e $du=\cos x\,dx$`,
                t`Usar redução de potência $\frac{1-\cos(2x)}{2}$`,
                t`Integrar por partes com $u=\operatorname{tg}^3 x$`,
              ],
              t`Fica $\int(\sec^2 x-1)\sec^2 x\cdot(\sec x\operatorname{tg}x\,dx)=\int(u^4-u^2)\,du=\frac{\sec^5 x}{5}-\frac{\sec^3 x}{3}+C$.`,
            ),
            mcqS(
              t`Para integrar $\int\operatorname{tg}^2 x\sec^4 x\,dx$ (potência de $\sec$ par), escrevemos $\sec^4 x = (\operatorname{tg}^2 x+1)\sec^2 x$. Em $u=\operatorname{tg}x$, a integral vira:`,
              t`$\int u^2(u^2+1)\,du = \frac{\operatorname{tg}^5 x}{5}+\frac{\operatorname{tg}^3 x}{3}+C$`,
              [
                t`$\int u^2(u^2-1)\,du = \frac{\operatorname{tg}^5 x}{5}-\frac{\operatorname{tg}^3 x}{3}+C$`,
                t`$\int u^4\,du = \frac{\operatorname{tg}^5 x}{5}+C$`,
                t`$\frac{\operatorname{tg}^3 x\sec^5 x}{15}+C$`,
                t`$\frac{\sec^5 x}{5}+\frac{\sec^3 x}{3}+C$`,
              ],
              t`Um $\sec^2 x$ vira $du$ e o outro vira $u^2+1$, gerando $\int(u^4+u^2)\,du$.`,
            ),
            tf(
              t`Para inteiros positivos diferentes $m\ne n$, vale $\int_0^{2\pi}\operatorname{sen}(mx)\operatorname{sen}(nx)\,dx=0$ (ortogonalidade das senoides).`,
              true,
              t`Pela identidade de produto em soma, surgem cossenos de frequências inteiras $(m-n)$ e $(m+n)$, cuja integral num período completo $[0,\,2\pi]$ é zero.`,
            ),
            mcqS(
              t`Usando $\operatorname{sen}(3x)\cos(x)=\frac12\big(\operatorname{sen}(4x)+\operatorname{sen}(2x)\big)$, calcule $\int\operatorname{sen}(3x)\cos(x)\,dx$.`,
              t`$-\frac{\cos(4x)}{8}-\frac{\cos(2x)}{4}+C$`,
              [
                t`$\frac{\cos(4x)}{8}+\frac{\cos(2x)}{4}+C$`,
                t`$-\frac{\cos(4x)}{4}-\frac{\cos(2x)}{2}+C$`,
                t`$\frac{\operatorname{sen}(4x)}{8}+\frac{\operatorname{sen}(2x)}{4}+C$`,
                t`$-\frac{\cos(3x)\operatorname{sen}x}{3}+C$`,
              ],
              t`$\frac12\int\operatorname{sen}(4x)\,dx+\frac12\int\operatorname{sen}(2x)\,dx = -\frac{\cos(4x)}{8}-\frac{\cos(2x)}{4}+C$.`,
            ),
          ],
        },
      ],
    },
    {
      id: 'c-tec-subtrig',
      title: 'Substituição trigonométrica',
      parts: [
        {
          card: {
            title: 'A raiz √(a² − x²) e o seno',
            body: t`Quando o integrando tem $\sqrt{a^2-x^2}$ sem um fator $x$ fora da raiz, eliminamos o radical usando $1-\operatorname{sen}^2\theta=\cos^2\theta$:
$$x=a\operatorname{sen}\theta,\quad dx=a\cos\theta\,d\theta\implies \sqrt{a^2-x^2}=a\cos\theta$$

É assim que o Cálculo demonstra a área do círculo ($\int_0^r\sqrt{r^2-x^2}\,dx=\frac{\pi r^2}{4}$). Mova $b$ no semicírculo de raio $a=2$:`,
            visual: circleTrigLab(),
            example: t`$\int\frac{dx}{\sqrt{a^2-x^2}}=\int\frac{a\cos\theta\,d\theta}{a\cos\theta}=\theta+C=\operatorname{arcsen}\left(\frac{x}{a}\right)+C$.`,
            tip: t`Se houver $x\,dx$ fora da raiz (como em $\int x\sqrt{a^2-x^2}\,dx$), use substituição simples $u=a^2-x^2$, que é muito mais rápida!`,
          },
          exercises: [
            inter(
              t`No semicírculo de raio $a=2$, leve $b$ até $2$ para obter exatamente um quarto da área do círculo ($\pi\approx 3{,}142$).`,
              'plot',
              circleTrigLab().props,
              (v: any) => v && near(v.p.b, 2, 0.05),
              t`$b=2$`,
              t`Em $b=2$, $\theta=\frac{\pi}{2}$ e $\int_0^2\sqrt{4-x^2}\,dx=\frac14\pi(2)^2=\pi\approx 3{,}142$.`,
            ),
            mcqS(
              t`Qual substituição trigonométrica elimina a raiz em $\int\sqrt{9-x^2}\,dx$?`,
              t`$x=3\operatorname{sen}\theta$`,
              [t`$x=9\operatorname{sen}\theta$`, t`$x=3\operatorname{tg}\theta$`, t`$x=3\sec\theta$`, t`$u=9-x^2$`],
              t`Como $a^2=9\implies a=3$, fazemos $x=3\operatorname{sen}\theta$, pois $\sqrt{9-9\operatorname{sen}^2\theta}=3\cos\theta$.`,
            ),
            gen((rng) => {
              const a = randInt(rng, 2, 7);
              return rmcq(
                rng,
                t`Fazendo $x=${a}\operatorname{sen}\theta$ ($-\frac{\pi}{2}\le\theta\le\frac{\pi}{2}$), em que se transforma o produto $\sqrt{${a * a}-x^2}\,dx$?`,
                t`$${a * a}\cos^2\theta\,d\theta$`,
                [
                  t`$${a}\cos\theta\,d\theta$`,
                  t`$${a * a}\operatorname{sen}^2\theta\,d\theta$`,
                  t`$\cos^2\theta\,d\theta$`,
                  t`$${a}\cos^2\theta\,d\theta$`,
                ],
                t`Temos $\sqrt{${a * a}-x^2}=${a}\cos\theta$ e $dx=${a}\cos\theta\,d\theta$; multiplicando os dois, sai $${a * a}\cos^2\theta\,d\theta$.`,
              );
            }),
            gen((rng) => {
              const a = randInt(rng, 2, 8);
              return rmcq(
                rng,
                t`Calcule $\int\dfrac{dx}{\sqrt{${a * a}-x^2}}$.`,
                t`$\operatorname{arcsen}\left(\frac{x}{${a}}\right)+C$`,
                [
                  t`$\frac{1}{${a}}\operatorname{arcsen}\left(\frac{x}{${a}}\right)+C$`,
                  t`$\frac{1}{${a}}\operatorname{arctg}\left(\frac{x}{${a}}\right)+C$`,
                  t`$\sqrt{${a * a}-x^2}+C$`,
                  t`$\operatorname{arcsen}(${a}x)+C$`,
                ],
                t`Com $x=${a}\operatorname{sen}\theta$, o fator $${a}\cos\theta$ cancela em cima e embaixo, sobrando $\theta+C=\operatorname{arcsen}\left(\frac{x}{${a}}\right)+C$.`,
              );
            }),
            mcqS(
              t`Ao calcular $\int_0^r\sqrt{r^2-x^2}\,dx$ com $x=r\operatorname{sen}\theta$, os limites $x=0$ e $x=r$ viram $\theta=0$ e $\theta=\frac{\pi}{2}$, chegando a:`,
              t`$r^2\int_0^{\pi/2}\cos^2\theta\,d\theta = \frac{\pi r^2}{4}$`,
              [t`$r\int_0^{\pi/2}\cos\theta\,d\theta = r$`, t`$r^2\int_0^{\pi}\operatorname{sen}^2\theta\,d\theta = \frac{\pi r^2}{2}$`, t`$\pi r^2$`, t`$\frac{\pi r^2}{2}$`],
              t`Multiplicando esse quarto de círculo por $4$, demonstramos que a área do círculo de raio $r$ é $\pi r^2$.`,
            ),
            gen((rng) => {
              const r = 2 * randInt(rng, 1, 4);
              return num(
                t`Sabendo que $\int_0^{${r}}\sqrt{${r * r}-x^2}\,dx = k\pi$, quanto vale $k$?`,
                (r * r) / 4,
                t`É um quarto do círculo de raio $r=${r}$: $\frac{\pi r^2}{4}=\frac{${r * r}}{4}\pi=${(r * r) / 4}\pi\implies k=${(r * r) / 4}$.`,
              );
            }),
            mcq(
              t`Qual das integrais abaixo **NÃO** precisa de substituição trigonométrica porque sai direto por $u=4-x^2$?`,
              [
                t`$\int x\sqrt{4-x^2}\,dx$`,
                t`$\int\sqrt{4-x^2}\,dx$`,
                t`$\int\frac{dx}{(4-x^2)^{3/2}}$`,
                t`$\int\frac{x^2}{\sqrt{4-x^2}}\,dx$`,
              ],
              0,
              t`Em $\int x\sqrt{4-x^2}\,dx$, o fator $x\,dx=-\frac12 du$ já está presente fora da raiz.`,
            ),
            num(
              t`Calcule $\int_0^1\frac{dx}{\sqrt{4-x^2}}$ sabendo que $\operatorname{arcsen}\left(\frac12\right)=\frac{\pi}{6}$ (responda com 2 casas decimais).`,
              Math.PI / 6,
              t`$\left[\operatorname{arcsen}\left(\frac{x}{2}\right)\right]_0^1 = \operatorname{arcsen}\left(\frac12\right)-0 = \frac{\pi}{6}\approx 0{,}524$.`,
              { tol: 0.01 },
            ),
          ],
        },
        {
          card: {
            title: 'Tangente (a² + x²) e secante (x² − a²)',
            body: t`Os outros dois casos saem da identidade $\operatorname{tg}^2\theta+1=\sec^2\theta$:

• **Soma $\sqrt{a^2+x^2}$**: faça $x=a\operatorname{tg}\theta$ ($dx=a\sec^2\theta\,d\theta$), pois $\sqrt{a^2+a^2\operatorname{tg}^2\theta}=a\sec\theta$.
• **Diferença $\sqrt{x^2-a^2}$**: faça $x=a\sec\theta$ ($dx=a\sec\theta\operatorname{tg}\theta\,d\theta$), pois $\sqrt{a^2\sec^2\theta-a^2}=a\operatorname{tg}\theta$.`,
            formula: t`\int\frac{dx}{a^2+x^2}=\frac{1}{a}\operatorname{arctg}\left(\frac{x}{a}\right)+C`,
            example: t`Em $\int\frac{dx}{(x^2+a^2)^{3/2}}$ com $x=a\operatorname{tg}\theta$: $\int\frac{a\sec^2\theta\,d\theta}{a^3\sec^3\theta}=\frac{1}{a^2}\int\cos\theta\,d\theta=\frac{\operatorname{sen}\theta}{a^2}+C$.`,
            tip: t`Memorize o trio: $(a^2-x^2)\to a\operatorname{sen}\theta$; $(a^2+x^2)\to a\operatorname{tg}\theta$; $(x^2-a^2)\to a\sec\theta$.`,
          },
          exercises: [
            match(
              t`Ligue cada radical à sua substituição trigonométrica e identidade:`,
              [
                [t`$\sqrt{a^2-x^2}$`, t`$x=a\operatorname{sen}\theta$`],
                [t`$\sqrt{a^2+x^2}$`, t`$x=a\operatorname{tg}\theta$`],
                [t`$\sqrt{x^2-a^2}$`, t`$x=a\sec\theta$`],
                [t`$1+\operatorname{tg}^2\theta$`, t`$\sec^2\theta$`],
              ],
              t`Cada escolha transforma a soma ou diferença dentro da raiz num quadrado perfeito.`,
            ),
            gen((rng) => {
              const a = randInt(rng, 2, 7);
              return rmcq(
                rng,
                t`Qual substituição trigonométrica elimina a raiz em $\sqrt{x^2+${a * a}}$?`,
                t`$x=${a}\operatorname{tg}\theta$`,
                [
                  t`$x=${a}\operatorname{sen}\theta$`,
                  t`$x=${a}\sec\theta$`,
                  t`$x=${a * a}\operatorname{tg}\theta$`,
                  t`$x=${a}\cos\theta$`,
                ],
                t`Com $x=${a}\operatorname{tg}\theta$, temos $\sqrt{${a * a}\operatorname{tg}^2\theta+${a * a}}=${a}\sec\theta$.`,
              );
            }),
            gen((rng) => {
              const a = randInt(rng, 2, 6);
              return rmcq(
                rng,
                t`Calcule $\int\dfrac{dx}{x^2+${a * a}}$.`,
                t`$\frac{1}{${a}}\operatorname{arctg}\left(\frac{x}{${a}}\right)+C$`,
                [
                  t`$\operatorname{arctg}\left(\frac{x}{${a}}\right)+C$`,
                  t`$\frac{1}{${a * a}}\operatorname{arctg}\left(\frac{x}{${a}}\right)+C$`,
                  t`$\operatorname{arcsen}\left(\frac{x}{${a}}\right)+C$`,
                  t`$\ln(x^2+${a * a})+C$`,
                ],
                t`Com $x=${a}\operatorname{tg}\theta$ ($dx=${a}\sec^2\theta\,d\theta$), fica $\int\frac{${a}\sec^2\theta}{${a * a}\sec^2\theta}\,d\theta=\frac{1}{${a}}\theta+C=\frac{1}{${a}}\operatorname{arctg}\left(\frac{x}{${a}}\right)+C$.`,
              );
            }),
            mcqS(
              t`Ao substituir $x=a\operatorname{tg}\theta$ em $\int\frac{dx}{\sqrt{x^2+a^2}}$, a integral em $\theta$ simplifica para:`,
              t`$\int\sec\theta\,d\theta = \ln|\sec\theta+\operatorname{tg}\theta|+C$`,
              [
                t`$\int d\theta = \theta+C$`,
                t`$\int\cos\theta\,d\theta = \operatorname{sen}\theta+C$`,
                t`$\int\sec^2\theta\,d\theta = \operatorname{tg}\theta+C$`,
                t`$\frac{1}{a}\int\sec\theta\,d\theta$`,
              ],
              t`Como $dx=a\sec^2\theta\,d\theta$ e $\sqrt{x^2+a^2}=a\sec\theta$, o quociente dá exatamente $\int\sec\theta\,d\theta$.`,
            ),
            mcqS(
              t`Em $\int\frac{dx}{x^2\sqrt{x^2-a^2}}$ ($x>a$), fazendo $x=a\sec\theta$ ($dx=a\sec\theta\operatorname{tg}\theta\,d\theta$), obtemos:`,
              t`$\frac{1}{a^2}\int\cos\theta\,d\theta = \frac{\operatorname{sen}\theta}{a^2}+C$`,
              [
                t`$\int\sec\theta\,d\theta$`,
                t`$\frac{1}{a}\int\operatorname{sen}\theta\,d\theta$`,
                t`$\frac{1}{a^2}\int\sec^2\theta\,d\theta$`,
                t`$\frac{1}{a^3}\int\cos\theta\,d\theta$`,
              ],
              t`$\int\frac{a\sec\theta\operatorname{tg}\theta\,d\theta}{a^2\sec^2\theta\cdot a\operatorname{tg}\theta} = \frac{1}{a^2}\int\frac{d\theta}{\sec\theta} = \frac{1}{a^2}\int\cos\theta\,d\theta$.`,
            ),
            gen((rng) => {
              const a = randInt(rng, 2, 5);
              const m = randInt(rng, 1, 5);
              return num(
                t`Calcule $\dfrac{4}{\pi}\int_0^{${a}}\dfrac{${m * a}}{x^2+${a * a}}\,dx$.`,
                m,
                t`$\int_0^{${a}}\frac{${m * a}}{x^2+${a * a}}\,dx = \left[${m}\operatorname{arctg}\left(\frac{x}{${a}}\right)\right]_0^{${a}} = ${m}\cdot\frac{\pi}{4}$; multiplicando por $\frac{4}{\pi}$, dá $${m}$.`,
              );
            }),
            tf(
              t`Em $\int\frac{\sqrt{x^2-4}}{x}\,dx$ ($x>2$), a substituição $x=2\sec\theta$ transforma a integral em $2\int\operatorname{tg}^2\theta\,d\theta = 2\int(\sec^2\theta-1)\,d\theta$.`,
              true,
              t`Pois $\frac{2\operatorname{tg}\theta}{2\sec\theta}\cdot 2\sec\theta\operatorname{tg}\theta\,d\theta = 2\operatorname{tg}^2\theta\,d\theta$.`,
            ),
            mcqS(
              t`Para integrar $\int\frac{dx}{\sqrt{x^2+2x+5}}$, completamos o quadrado: $x^2+2x+5=(x+1)^2+4$. Qual substituição fazemos a seguir?`,
              t`$x+1=2\operatorname{tg}\theta$`,
              [t`$x+1=4\operatorname{tg}\theta$`, t`$x+1=2\operatorname{sen}\theta$`, t`$x=2\operatorname{tg}\theta$`, t`$x+1=2\sec\theta$`],
              t`Temos $u^2+2^2$ com $u=x+1$ e $a=2$, logo $x+1=2\operatorname{tg}\theta$.`,
            ),
          ],
        },
        {
          card: {
            title: 'O triângulo de referência',
            body: t`Depois de integrar em $\theta$, voltamos para $x$ desenhando um **triângulo retângulo** a partir da definição da substituição e achando o terceiro lado por Pitágoras:

• Se $x=a\operatorname{sen}\theta\implies\operatorname{sen}\theta=\frac{x}{a}=\frac{\text{oposto}}{\text{hipotenusa}}$, o cateto adjacente é $\sqrt{a^2-x^2}$.
• Se $x=a\operatorname{tg}\theta\implies\operatorname{tg}\theta=\frac{x}{a}=\frac{\text{oposto}}{\text{adjacente}}$, a hipotenusa é $\sqrt{a^2+x^2}$.

Explore o triângulo de referência de $x=a\operatorname{sen}\theta$:`,
            visual: refTriangleLab(),
            example: t`Se $x=3\operatorname{tg}\theta$ e a integral deu $\operatorname{sen}\theta+C$: oposto $=x$, adjacente $=3$, hipotenusa $=\sqrt{x^2+9}\implies\operatorname{sen}\theta=\frac{x}{\sqrt{x^2+9}}$.`,
            tip: t`Se aparecer $\operatorname{sen}(2\theta)$, use $\operatorname{sen}(2\theta)=2\operatorname{sen}\theta\cos\theta$ antes de ler no triângulo!`,
          },
          exercises: [
            inter(
              t`No triângulo de referência ($x=a\operatorname{sen}\theta$), ajuste $a=2{,}5$ e $x=1{,}5$ para formar o triângulo pitagórico $(1{,}5;\,2;\,2{,}5)$ com $\cos\theta=0{,}8$.`,
              'plot',
              refTriangleLab().props,
              (v: any) => v && near(v.p.a, 2.5, 0.05) && near(v.p.x, 1.5, 0.05),
              t`$a=2{,}5$ e $x=1{,}5$`,
              t`O cateto adjacente fica $\sqrt{2{,}5^2-1{,}5^2}=\sqrt{4}=2$, dando $\cos\theta=\frac{2}{2{,}5}=0{,}8$.`,
            ),
            mcqS(
              t`Se fizemos $x=4\operatorname{sen}\theta$ ($\operatorname{sen}\theta=\frac{x}{4}$), quanto vale $\cos\theta$ em função de $x$?`,
              t`$\frac{\sqrt{16-x^2}}{4}$`,
              [t`$\frac{4}{\sqrt{16-x^2}}$`, t`$\frac{x}{\sqrt{16-x^2}}$`, t`$\sqrt{16-x^2}$`, t`$\frac{\sqrt{x^2-16}}{4}$`],
              t`Hipotenusa $4$ e cateto oposto $x\implies$ adjacente $\sqrt{16-x^2}\implies \cos\theta=\frac{\sqrt{16-x^2}}{4}$.`,
            ),
            gen((rng) => {
              const a = randInt(rng, 2, 7);
              return rmcq(
                rng,
                t`Se fizemos $x=${a}\operatorname{tg}\theta$ ($\operatorname{tg}\theta=\frac{x}{${a}}$), qual é a expressão de $\operatorname{sen}\theta$ ao voltar para $x$?`,
                t`$\frac{x}{\sqrt{x^2+${a * a}}}$`,
                [
                  t`$\frac{${a}}{\sqrt{x^2+${a * a}}}$`,
                  t`$\frac{\sqrt{x^2+${a * a}}}{x}$`,
                  t`$\frac{x}{\sqrt{${a * a}-x^2}}$`,
                  t`$\frac{x}{x^2+${a * a}}$`,
                ],
                t`Oposto $=x$ e adjacente $=${a}\implies$ hipotenusa $=\sqrt{x^2+${a * a}}\implies \operatorname{sen}\theta=\frac{x}{\sqrt{x^2+${a * a}}}$.`,
              );
            }),
            gen((rng) => {
              const a = randInt(rng, 2, 6);
              return rmcq(
                rng,
                t`Se fizemos $x=${a}\operatorname{tg}\theta$, quanto vale $\cos\theta$ em função de $x$?`,
                t`$\frac{${a}}{\sqrt{x^2+${a * a}}}$`,
                [
                  t`$\frac{x}{\sqrt{x^2+${a * a}}}$`,
                  t`$\frac{\sqrt{x^2+${a * a}}}{${a}}$`,
                  t`$\frac{${a}}{x^2+${a * a}}$`,
                  t`$\frac{\sqrt{${a * a}-x^2}}{${a}}$`,
                ],
                t`Adjacente $=${a}$ sobre hipotenusa $=\sqrt{x^2+${a * a}}$.`,
              );
            }),
            mcqS(
              t`Na resolução de $\int\frac{dx}{(x^2+9)^{3/2}}$ com $x=3\operatorname{tg}\theta$, obtivemos $\frac19\operatorname{sen}\theta+C$. Voltando para $x$, a primitiva é:`,
              t`$\frac{x}{9\sqrt{x^2+9}}+C$`,
              [t`$\frac{1}{3\sqrt{x^2+9}}+C$`, t`$\frac{\sqrt{x^2+9}}{9x}+C$`, t`$\frac{x}{3\sqrt{x^2+9}}+C$`, t`$\frac19\operatorname{arcsen}\left(\frac{x}{3}\right)+C$`],
              t`No triângulo de $\operatorname{tg}\theta=\frac{x}{3}$, temos $\operatorname{sen}\theta=\frac{x}{\sqrt{x^2+9}}$.`,
            ),
            mcqS(
              t`Se $x=a\sec\theta$ ($\sec\theta=\frac{x}{a}$, hipotenusa $x$ e adjacente $a$), quanto vale $\operatorname{tg}\theta$ para $x>a$?`,
              t`$\frac{\sqrt{x^2-a^2}}{a}$`,
              [t`$\frac{a}{\sqrt{x^2-a^2}}$`, t`$\frac{\sqrt{x^2-a^2}}{x}$`, t`$\frac{\sqrt{a^2-x^2}}{a}$`, t`$\frac{x}{\sqrt{x^2-a^2}}$`],
              t`Por Pitágoras, o cateto oposto é $\sqrt{x^2-a^2}$, logo $\operatorname{tg}\theta=\frac{\text{oposto}}{\text{adjacente}}=\frac{\sqrt{x^2-a^2}}{a}$.`,
            ),
            order(
              t`Ordene o cálculo completo de $\int\frac{dx}{x^2\sqrt{4-x^2}}$:`,
              [
                t`Substituir $x=2\operatorname{sen}\theta$ e $dx=2\cos\theta\,d\theta$`,
                t`Simplificar para $\frac14\int\frac{d\theta}{\operatorname{sen}^2\theta}=\frac14\int\operatorname{cossec}^2\theta\,d\theta$`,
                t`Integrar em $\theta$: $-\frac14\operatorname{cotg}\theta+C$`,
                t`Voltar para $x$ pelo triângulo ($\operatorname{cotg}\theta=\frac{\text{adj}}{\text{op}}$): $-\frac{\sqrt{4-x^2}}{4x}+C$`,
              ],
              t`O triângulo de $\operatorname{sen}\theta=\frac{x}{2}$ tem cateto adjacente $\sqrt{4-x^2}$ e oposto $x$, logo $\operatorname{cotg}\theta=\frac{\sqrt{4-x^2}}{x}$.`,
            ),
            mcqS(
              t`Na integral de $\sqrt{a^2-x^2}$ aparece $\frac{a^2}{2}\operatorname{sen}(2\theta)=a^2\operatorname{sen}\theta\cos\theta$. Voltando para $x$ (com $x=a\operatorname{sen}\theta$), esse termo vira:`,
              t`$\frac12 x\sqrt{a^2-x^2}$`,
              [t`$x\sqrt{a^2-x^2}$`, t`$\frac{x}{\sqrt{a^2-x^2}}$`, t`$\frac{a^2}{2}x\sqrt{a^2-x^2}$`, t`$\frac12(a^2-x^2)$`],
              t`Como $\frac{a^2}{2}\operatorname{sen}(2\theta)=\frac{a^2}{2}\cdot 2\operatorname{sen}\theta\cos\theta$, substituindo $\operatorname{sen}\theta=\frac{x}{a}$ e $\cos\theta=\frac{\sqrt{a^2-x^2}}{a}$ em $\frac{a^2}{2}\operatorname{sen}(2\theta)$ obtemos $\frac12 x\sqrt{a^2-x^2}$.`,
            ),
          ],
        },
      ],
    },
    {
      id: 'c-tec-frac',
      title: 'Frações parciais',
      parts: [
        {
          card: {
            title: 'Fatores lineares distintos',
            body: t`Para integrar $\frac{P(x)}{Q(x)}$ com $\text{grau}(P)<\text{grau}(Q)$, fatoramos o denominador. Se $Q(x)=(x-r_1)(x-r_2)$ tem raízes reais **distintas**, decompomos em frações simples:
$$\frac{P(x)}{(x-r_1)(x-r_2)}=\frac{A}{x-r_1}+\frac{B}{x-r_2}$$

**Método de cobrir (Heaviside)**: para achar $A$, cubra $(x-r_1)$ no lado esquerdo e substitua $x=r_1$ no resto! Ajuste $A$ e $B$:`,
            visual: partialFracLab(),
            example: t`Em $\frac{5x-3}{(x-1)(x+3)}=\frac{A}{x-1}+\frac{B}{x+3}$: cobrindo $(x-1)$ em $x=1$, $A=\frac{5(1)-3}{1+3}=\frac12$; cobrindo $(x+3)$ em $x=-3$, $B=\frac{-15-3}{-3-1}=\frac92$.`,
            tip: t`Cada parcela $\frac{A}{x-r}$ integra direto para um logaritmo: $\int\frac{A}{x-r}\,dx=A\ln|x-r|+C$.`,
          },
          exercises: [
            inter(
              t`Ajuste os coeficientes $A$ e $B$ até que $\frac{A}{x-1}+\frac{B}{x+1}$ coincida com $\frac{2}{x^2-1}$.`,
              'plot',
              partialFracLab().props,
              (v: any) => v && near(v.p.A, 1, 0.05) && near(v.p.B, -1, 0.05),
              t`$A=1$ e $B=-1$`,
              t`Cobrindo $(x-1)$ em $x=1$: $A=\frac{2}{1+1}=1$. Cobrindo $(x+1)$ em $x=-1$: $B=\frac{2}{-1-1}=-1$.`,
            ),
            gen((rng) => {
              const r1 = randInt(rng, 1, 3);
              const r2 = r1 + randInt(rng, 1, 3);
              const A = randInt(rng, 1, 5);
              const B = randInt(rng, 1, 4);
              const numP = polyTex([-(A * r2 + B * r1), A + B]);
              return num(
                t`Na decomposição $\dfrac{${numP}}{(x-${r1})(x-${r2})}=\dfrac{A}{x-${r1}}+\dfrac{B}{x-${r2}}$, quanto vale $A$?`,
                A,
                t`Pelo método de cobrir em $x=${r1}$: $A=\frac{${(A + B) * r1 - (A * r2 + B * r1)}}{${r1}-${r2}}=${A}$.`,
              );
            }),
            gen((rng) => {
              const r1 = randInt(rng, 1, 4);
              const r2 = randInt(rng, 1, 4);
              const A = randInt(rng, 1, 4);
              const B = randInt(rng, 1, 5);
              const numP = polyTex([A * r2 - B * r1, A + B]);
              return num(
                t`Na decomposição $\dfrac{${numP}}{(x-${r1})(x+${r2})}=\dfrac{A}{x-${r1}}+\dfrac{B}{x+${r2}}$, quanto vale $B$?`,
                B,
                t`Cobrindo $(x+${r2})$ e substituindo $x=-${r2}$: $B=\frac{${-(A + B) * r2 + (A * r2 - B * r1)}}{-${r2}-${r1}}=${B}$.`,
              );
            }),
            mcqS(
              t`Sabendo que $\frac{2}{x^2-1}=\frac{1}{x-1}-\frac{1}{x+1}$, calcule $\int\frac{2}{x^2-1}\,dx$.`,
              t`$\ln|x-1|-\ln|x+1|+C$`,
              [t`$\ln|x-1|+\ln|x+1|+C$`, t`$2\operatorname{arctg}x+C$`, t`$-\frac{2}{(x^2-1)^2}+C$`, t`$\ln|x^2-1|+C$`],
              t`Integrando termo a termo: $\int\frac{dx}{x-1}-\int\frac{dx}{x+1}=\ln|x-1|-\ln|x+1|+C=\ln\left|\frac{x-1}{x+1}\right|+C$.`,
            ),
            gen((rng) => {
              const r1 = randInt(rng, 1, 3);
              const r2 = r1 + randInt(rng, 1, 3);
              const A = randInt(rng, 1, 3);
              const B = A + randInt(rng, 1, 3);
              const numP = polyTex([-(A * r2 + B * r1), A + B]);
              return rmcq(
                rng,
                t`Calcule $\int\dfrac{${numP}}{(x-${r1})(x-${r2})}\,dx$.`,
                t`$${term(A, `\\ln|x-${r1}|`, true)}${term(B, `\\ln|x-${r2}|`)}+C$`,
                [
                  t`$${term(B, `\\ln|x-${r1}|`, true)}${term(A, `\\ln|x-${r2}|`)}+C$`,
                  t`$${term(A, `\\ln|x-${r1}|`, true)}${term(-B, `\\ln|x-${r2}|`)}+C$`,
                  t`$${term(-A, `\\ln|x-${r1}|`, true)}${term(B, `\\ln|x-${r2}|`)}+C$`,
                  t`$\ln|(x-${r1})(x-${r2})|+C$`,
                ],
                t`Decompondo: $\frac{${A}}{x-${r1}}+\frac{${B}}{x-${r2}}\implies ${term(A, `\\ln|x-${r1}|`, true)}${term(B, `\\ln|x-${r2}|`)}+C$.`,
              );
            }),
            gen((rng) => {
              const a = randInt(rng, 2, 6);
              return rmcq(
                rng,
                t`Calcule $\int\dfrac{${2 * a}}{x^2-${a * a}}\,dx$.`,
                t`$\ln\left|\frac{x-${a}}{x+${a}}\right|+C$`,
                [
                  t`$\ln\left|\frac{x+${a}}{x-${a}}\right|+C$`,
                  t`$2\operatorname{arctg}\left(\frac{x}{${a}}\right)+C$`,
                  t`$\ln|x^2-${a * a}|+C$`,
                  t`$${2 * a}\ln|x^2-${a * a}|+C$`,
                ],
                t`Como $\frac{${2 * a}}{x^2-${a * a}}=\frac{1}{x-${a}}-\frac{1}{x+${a}}$, a integral vale $\ln|x-${a}|-\ln|x+${a}|+C=\ln\left|\frac{x-${a}}{x+${a}}\right|+C$.`,
              );
            }),
            num(
              t`Sabendo que $\frac{1}{x(x-1)}=\frac{1}{x-1}-\frac{1}{x}$, se $\int_2^3\frac{1}{x(x-1)}\,dx = \ln\left(\frac{p}{3}\right)$, quanto vale $p$?`,
              4,
              t`$\left[\ln\left(\frac{x-1}{x}\right)\right]_2^3 = \ln\left(\frac23\right)-\ln\left(\frac12\right) = \ln\left(\frac43\right)\implies p=4$.`,
            ),
            order(
              t`Ordene os passos para calcular $\int\frac{x+5}{x^2+x-2}\,dx$:`,
              [
                t`Fatorar o denominador: $x^2+x-2=(x-1)(x+2)$`,
                t`Montar as frações parciais: $\frac{x+5}{(x-1)(x+2)}=\frac{A}{x-1}+\frac{B}{x+2}$`,
                t`Calcular os coeficientes cobrindo: $A=\frac{1+5}{1+2}=2$ e $B=\frac{-2+5}{-2-1}=-1$`,
                t`Integrar cada fração: $2\ln|x-1|-\ln|x+2|+C$`,
              ],
              t`Depois de fatorar o denominador, achamos $A$ e $B$ e integramos cada fração simples em logaritmo.`,
            ),
          ],
        },
        {
          card: {
            title: 'Divisão prévia e raízes repetidas',
            body: t`Atenção a dois casos fundamentais antes de montar as frações:

1. **Grau de cima $\ge$ grau debaixo** (fração imprópria): **divida os polinômios primeiro**!
2. **Fator linear repetido** $(x-r)^k$: inclua uma fração para **cada potência** de $1$ até $k$:
$$\frac{P(x)}{(x-r)^2}=\frac{A}{x-r}+\frac{B}{(x-r)^2}$$

O primeiro termo dá $A\ln|x-r|$ e o segundo é regra da potência: $\int B(x-r)^{-2}\,dx=-\frac{B}{x-r}$.`,
            example: t`$\frac{x^2+1}{x-1}=\frac{(x^2-1)+2}{x-1}=x+1+\frac{2}{x-1}\implies\int\frac{x^2+1}{x-1}\,dx=\frac{x^2}{2}+x+2\ln|x-1|+C$.`,
            tip: t`Nunca integre $\frac{1}{(x-r)^2}$ como logaritmo: $(x-r)^{-2}$ integra para $-\frac{1}{x-r}+C$!`,
          },
          exercises: [
            tf(
              t`A decomposição direta em frações parciais só vale quando o grau do numerador é **estritamente menor** que o grau do denominador.`,
              true,
              t`Se $\text{grau}(P)\ge\text{grau}(Q)$, primeiro extraímos a parte polinomial dividindo $P(x)$ por $Q(x)$.`,
            ),
            mcq(
              t`Para integrar $\int\frac{x^3+2x}{x^2-1}\,dx$, qual deve ser o **primeiro** passo?`,
              [
                t`Dividir o numerador pelo denominador, pois o grau de cima (3) é maior que o de baixo (2)`,
                t`Escrever direto $\frac{A}{x-1}+\frac{B}{x+1}$`,
                t`Fazer substituição trigonométrica $x=\sec\theta$`,
                t`Derivar em cima e embaixo por L'Hôpital`,
              ],
              0,
              t`Como $x^3+2x = x(x^2-1)+3x$, a fração vira $x+\frac{3x}{x^2-1}$.`,
            ),
            mcqS(
              t`Qual é a forma correta da decomposição em frações parciais de $\dfrac{3x+1}{(x-1)(x+2)^2}$?`,
              t`$\frac{A}{x-1}+\frac{B}{x+2}+\frac{C}{(x+2)^2}$`,
              [
                t`$\frac{A}{x-1}+\frac{B}{(x+2)^2}$`,
                t`$\frac{A}{x-1}+\frac{Bx+C}{(x+2)^2}$`,
                t`$\frac{A}{x-1}+\frac{B}{x+2}+\frac{C}{x+2}$`,
                t`$\frac{Ax+B}{x-1}+\frac{C}{(x+2)^2}$`,
              ],
              t`O fator repetido $(x+2)^2$ exige uma parcela para $(x+2)$ e outra para $(x+2)^2$, ambas com numerador constante.`,
            ),
            gen((rng) => {
              const r = randInt(rng, 1, 5);
              const k = randInt(rng, 2, 7);
              const a = k - r;
              return num(
                t`Reescrevendo a fração imprópria $\dfrac{x${term(a, '')}}{x-${r}} = 1 + \dfrac{k}{x-${r}}$, quanto vale o resto $k$?`,
                k,
                t`$x${term(a, '')} = (x-${r})+${k}\implies \frac{x${term(a, '')}}{x-${r}} = 1+\frac{${k}}{x-${r}}$, logo $k=${k}$.`,
              );
            }),
            gen((rng) => {
              const r = randInt(rng, 1, 5);
              const A = randInt(rng, 1, 4);
              const B = randInt(rng, 2, 6);
              return rmcq(
                rng,
                t`Calcule $\int\left(\dfrac{${A}}{x-${r}}+\dfrac{${B}}{(x-${r})^2}\right)dx$.`,
                t`$${term(A, `\\ln|x-${r}|`, true)}-\frac{${B}}{x-${r}}+C$`,
                [
                  t`$${term(A, `\\ln|x-${r}|`, true)}+\frac{${B}}{x-${r}}+C$`,
                  t`$${term(A, `\\ln|x-${r}|`, true)}+${B}\ln|(x-${r})^2|+C$`,
                  t`$-\frac{${A}}{(x-${r})^2}-\frac{${B}}{x-${r}}+C$`,
                  t`$${term(A, `\\ln|x-${r}|`, true)}-\frac{${B}}{2(x-${r})^2}+C$`,
                ],
                t`O primeiro termo integra para $${term(A, `\\ln|x-${r}|`, true)}$ e o segundo usa $\int ${B}(x-${r})^{-2}\,dx = -\frac{${B}}{x-${r}}$.`,
              );
            }),
            gen((rng) => {
              const r = randInt(rng, 1, 5);
              const c = randInt(rng, 1, 6);
              return num(
                t`Na decomposição $\dfrac{x+${c}}{(x-${r})^2}=\dfrac{A}{x-${r}}+\dfrac{B}{(x-${r})^2}$, quanto vale $B$?`,
                r + c,
                t`Multiplicando por $(x-${r})^2$: $x+${c}=A(x-${r})+B$. Substituindo $x=${r}$, sai $B=${r}+${c}=${r + c}$.`,
              );
            }),
            mcqS(
              t`Calcule $\int\frac{x^2}{x^2+1}\,dx$ somando e subtraindo $1$ no numerador ($\frac{x^2+1-1}{x^2+1}$).`,
              t`$x-\operatorname{arctg}x+C$`,
              [t`$x+\operatorname{arctg}x+C$`, t`$\frac12\ln(x^2+1)+C$`, t`$x-\ln(x^2+1)+C$`, t`$\operatorname{arctg}x+C$`],
              t`$\int\left(1-\frac{1}{x^2+1}\right)dx = x-\operatorname{arctg}x+C$.`,
            ),
            num(
              t`Calcule a integral definida $\int_2^3\frac{2}{(x-1)^2}\,dx$.`,
              1,
              t`$\left[-\frac{2}{x-1}\right]_2^3 = -\frac{2}{2}-\left(-\frac{2}{1}\right) = -1+2 = 1$.`,
            ),
          ],
        },
        {
          card: {
            title: 'Quadráticos irredutíveis: ln e arctg',
            body: t`Quando o denominador tem um fator quadrático **irredutível** como $x^2+a^2$ ($\Delta<0$, sem raízes reais), sua fração parcial leva numerador **linear** $Bx+C$:
$$\frac{P(x)}{(x-r)(x^2+a^2)}=\frac{A}{x-r}+\frac{Bx+C}{x^2+a^2}$$

Para integrar $\frac{Bx+C}{x^2+a^2}$, separe em duas parcelas:
• $\int\frac{Bx}{x^2+a^2}\,dx=\frac{B}{2}\ln(x^2+a^2)$ (substituição $u=x^2+a^2$)
• $\int\frac{C}{x^2+a^2}\,dx=\frac{C}{a}\operatorname{arctg}\left(\frac{x}{a}\right)$`,
            example: t`$\int\frac{2x+3}{x^2+9}\,dx=\int\frac{2x}{x^2+9}\,dx+\int\frac{3}{x^2+9}\,dx=\ln(x^2+9)+\operatorname{arctg}\left(\frac{x}{3}\right)+C$.`,
            tip: t`Se o quadrático tiver termo em $x$ (como $x^2+4x+5$), complete o quadrado $(x+2)^2+1$ e faça $u=x+2$.`,
          },
          exercises: [
            mcqS(
              t`Qual é a forma correta da decomposição em frações parciais de $\dfrac{5x}{(x-1)(x^2+4)}$?`,
              t`$\frac{A}{x-1}+\frac{Bx+C}{x^2+4}$`,
              [
                t`$\frac{A}{x-1}+\frac{B}{x^2+4}$`,
                t`$\frac{A}{x-1}+\frac{B}{x-2}+\frac{C}{x+2}$`,
                t`$\frac{Ax+B}{x-1}+\frac{C}{x^2+4}$`,
                t`$\frac{A}{x-1}+\frac{B}{x+2}+\frac{C}{(x+2)^2}$`,
              ],
              t`Como $x^2+4$ não tem raízes reais, seu numerador na fração parcial deve ser do 1º grau ($Bx+C$).`,
            ),
            match(
              t`Ligue cada fração elementar à sua primitiva:`,
              [
                [t`$\int\frac{1}{x-3}\,dx$`, t`$\ln|x-3|+C$`],
                [t`$\int\frac{1}{(x-3)^2}\,dx$`, t`$-\frac{1}{x-3}+C$`],
                [t`$\int\frac{2x}{x^2+9}\,dx$`, t`$\ln(x^2+9)+C$`],
                [t`$\int\frac{1}{x^2+9}\,dx$`, t`$\frac13\operatorname{arctg}\left(\frac{x}{3}\right)+C$`],
              ],
              t`Toda integral de função racional se reduz a uma combinação desses quatro blocos fundamentais.`,
            ),
            gen((rng) => {
              const a = randInt(rng, 2, 5);
              const k = randInt(rng, 1, 4);
              const m = randInt(rng, 1, 4);
              return rmcq(
                rng,
                t`Calcule $\int\dfrac{${2 * k}x+${m * a}}{x^2+${a * a}}\,dx$.`,
                t`$${k === 1 ? '' : k}\ln(x^2+${a * a})+${m === 1 ? '' : m}\operatorname{arctg}\left(\frac{x}{${a}}\right)+C$`,
                [
                  t`$${2 * k}\ln(x^2+${a * a})+${m * a}\operatorname{arctg}\left(\frac{x}{${a}}\right)+C$`,
                  t`$${k === 1 ? '' : k}\ln(x^2+${a * a})+${m * a}\operatorname{arctg}(x)+C$`,
                  t`$${2 * k}\ln(x^2+${a * a})+${m === 1 ? '' : m}\operatorname{arctg}\left(\frac{x}{${a}}\right)+C$`,
                  t`$${k === 1 ? '' : k}\operatorname{arctg}\left(\frac{x}{${a}}\right)+${m === 1 ? '' : m}\ln(x^2+${a * a})+C$`,
                ],
                t`Separando: $\int\frac{${2 * k}x}{x^2+${a * a}}\,dx + \int\frac{${m * a}}{x^2+${a * a}}\,dx = ${k === 1 ? '' : k}\ln(x^2+${a * a})+${m === 1 ? '' : m}\operatorname{arctg}\left(\frac{x}{${a}}\right)+C$.`,
              );
            }),
            gen((rng) => {
              const r = randInt(rng, 1, 3);
              const a = randInt(rng, 1, 3);
              const A = randInt(rng, 1, 4);
              const k = A * (r * r + a * a);
              return num(
                t`Na decomposição $\dfrac{${k}}{(x-${r})(x^2+${a * a})}=\dfrac{A}{x-${r}}+\dfrac{Bx+C}{x^2+${a * a}}$, quanto vale $A$?`,
                A,
                t`Cobrindo $(x-${r})$ e substituindo $x=${r}$: $A=\frac{${k}}{${r}^2+${a * a}}=\frac{${k}}{${r * r + a * a}}=${A}$.`,
              );
            }),
            mcqS(
              t`Em $\frac{2}{x(x^2+1)}=\frac{A}{x}+\frac{Bx+C}{x^2+1}$, quitando os denominadores temos $2=A(x^2+1)+(Bx+C)x$. Quais são os valores de $A$, $B$ e $C$?`,
              t`$A=2,\ B=-2,\ C=0$`,
              [
                t`$A=2,\ B=2,\ C=0$`,
                t`$A=1,\ B=-1,\ C=1$`,
                t`$A=2,\ B=0,\ C=-2$`,
                t`$A=-2,\ B=2,\ C=0$`,
              ],
              t`Em $x=0$, $A=2$. Como o coeficiente de $x^2$ é $A+B=0\implies B=-2$, e o de $x$ é $C=0$.`,
            ),
            mcqS(
              t`Para integrar $\int\frac{dx}{x^2+4x+5}$, completamos o quadrado no denominador: $x^2+4x+5=(x+2)^2+1$. O resultado é:`,
              t`$\operatorname{arctg}(x+2)+C$`,
              [t`$\ln(x^2+4x+5)+C$`, t`$\frac12\operatorname{arctg}\left(\frac{x+2}{2}\right)+C$`, t`$\operatorname{arctg}(x+4)+C$`, t`$-\frac{1}{x+2}+C$`],
              t`Com $u=x+2$ ($du=dx$), temos $\int\frac{du}{u^2+1}=\operatorname{arctg}u+C=\operatorname{arctg}(x+2)+C$.`,
            ),
            gen((rng) => {
              const h = randInt(rng, 1, 4);
              const m = randInt(rng, 1, 5);
              return num(
                t`Calcule $\dfrac{4}{\pi}\int_{-${h}}^{${1 - h}}\dfrac{${m}}{x^2+${2 * h}x+${h * h + 1}}\,dx$ (note que $x^2+${2 * h}x+${h * h + 1}=(x+${h})^2+1$).`,
                m,
                t`Com $u=x+${h}$, $u$ vai de $0$ a $1$: $\frac{4}{\pi}\int_0^1\frac{${m}}{u^2+1}\,du = \frac{4}{\pi}\cdot ${m}\frac{\pi}{4}=${m}$.`,
              );
            }),
            fill(
              t`Complete a integração separando a fração:`,
              t`$\int\frac{6x+4}{x^2+4}\,dx =$ ___ $+$ ___ $+C$`,
              [t`$3\ln(x^2+4)$`, t`$2\operatorname{arctg}\left(\frac{x}{2}\right)$`],
              [t`$6\ln(x^2+4)$`, t`$4\operatorname{arctg}(x)$`, t`$\ln|x+2|$`],
              t`$\int\frac{6x}{x^2+4}\,dx=3\ln(x^2+4)$ e $\int\frac{4}{x^2+4}\,dx=4\cdot\frac12\operatorname{arctg}\left(\frac{x}{2}\right)=2\operatorname{arctg}\left(\frac{x}{2}\right)$.`,
            ),
          ],
        },
      ],
    },
    {
      id: 'c-tec-impr',
      title: 'Integrais impróprias',
      parts: [
        {
          card: {
            title: 'Integrando até o infinito',
            body: t`Quando o intervalo de integração é infinito (Tipo 1), trocamos $\infty$ por um limite $b\to\infty$:
$$\int_a^\infty f(x)\,dx=\lim_{b\to\infty}\int_a^b f(x)\,dx$$

Se o limite é um número finito, a integral **converge**; senão, **diverge**. O padrão de referência é a **$p$-integral**:
$$\int_1^\infty\frac{1}{x^p}\,dx=\begin{cases}\dfrac{1}{p-1},&\text{se }p>1\text{ (converge)}\\\infty,&\text{se }p\le 1\text{ (diverge)}\end{cases}$$

Teste diferentes valores de $p$ e aumente $b$:`,
            visual: pIntegralLab(),
            example: t`$\int_0^\infty e^{-x}\,dx=\lim_{b\to\infty}[-e^{-x}]_0^b=\lim_{b\to\infty}(1-e^{-b})=1$ (converge).`,
            tip: t`Em $p=1$, $\int_1^b\frac1x\,dx=\ln b\to\infty$: a curva $\frac1x$ desce devagar demais e a área sob a cauda é infinita!`,
          },
          exercises: [
            inter(
              t`Ajuste o expoente $p$ para que $\int_1^\infty\frac{1}{x^p}\,dx$ convirja para o teto $2$, e leve $b$ até pelo menos $10$.`,
              'plot',
              pIntegralLab().props,
              (v: any) => v && near(v.p.p, 1.5, 0.05) && v.p.b >= 10,
              t`$p=1{,}5$ e $b\ge 10$`,
              t`Para $\frac{1}{p-1}=2$, precisamos de $p-1=0{,}5\implies p=1{,}5$.`,
            ),
            mcq(
              t`Por definição, a integral imprópria $\int_1^\infty f(x)\,dx$ é calculada como:`,
              [
                t`$\lim_{b\to\infty}\int_1^b f(x)\,dx$`,
                t`$f(\infty)-f(1)$`,
                t`$\int_1^{1000} f(x)\,dx$`,
                t`$\lim_{x\to\infty} f(x)$`,
              ],
              0,
              t`Integramos primeiro num intervalo fechado $[1,\,b]$ pelo TFC e depois tomamos o limite quando $b\to\infty$.`,
            ),
            multi(
              t`Quais das integrais impróprias abaixo **convergem** pelo critério da $p$-integral ($\int_1^\infty\frac{1}{x^p}\,dx$ converge $\iff p>1$)?`,
              [
                t`$\int_1^\infty\frac{1}{x^2}\,dx$`,
                t`$\int_1^\infty\frac{1}{x}\,dx$`,
                t`$\int_1^\infty\frac{1}{x\sqrt x}\,dx$`,
                t`$\int_1^\infty\frac{1}{\sqrt x}\,dx$`,
                t`$\int_1^\infty\frac{1}{x^4}\,dx$`,
              ],
              [0, 2, 4],
              t`Os expoentes são $p=2$, $p=1$, $p=1{,}5$, $p=0{,}5$ e $p=4$; convergem aqueles com $p>1$.`,
            ),
            gen((rng) => {
              const p = randInt(rng, 2, 5);
              const m = randInt(rng, 1, 5);
              const k = (p - 1) * m;
              return num(
                t`Calcule o valor exato da integral imprópria $\int_1^\infty\dfrac{${k}}{x^{${p}}}\,dx$.`,
                m,
                t`Como $p=${p}>1$, vale $\frac{${k}}{${p}-1}=\frac{${k}}{${p - 1}}=${m}$.`,
              );
            }),
            gen((rng) => {
              const k = randInt(rng, 2, 6);
              const m = randInt(rng, 1, 5);
              const A = k * m;
              return num(
                t`Calcule $\int_0^\infty ${A}e^{-${k}x}\,dx$.`,
                m,
                t`$\lim_{b\to\infty}\left[-${m}e^{-${k}x}\right]_0^b = 0 - (-${m}) = ${m}$.`,
              );
            }),
            mcqS(
              t`Quanto vale $\int_0^\infty\frac{1}{1+x^2}\,dx$?`,
              t`$\frac{\pi}{2}$`,
              [t`$\pi$`, t`$1$`, t`$0$`, t`diverge ($\infty$)`],
              t`$\lim_{b\to\infty}[\operatorname{arctg}x]_0^b = \frac{\pi}{2}-0 = \frac{\pi}{2}$.`,
            ),
            mcqS(
              t`E na reta inteira, quanto vale $\int_{-\infty}^\infty\frac{1}{1+x^2}\,dx$?`,
              t`$\pi$`,
              [t`$\frac{\pi}{2}$`, t`$0$`, t`$2\pi$`, t`diverge`],
              t`$\int_{-\infty}^0\frac{dx}{1+x^2}+\int_0^\infty\frac{dx}{1+x^2}=\frac{\pi}{2}+\frac{\pi}{2}=\pi$.`,
            ),
            tf(
              t`Como $\cos x$ oscila simetricamente entre $-1$ e $1$, a integral imprópria $\int_0^\infty\cos x\,dx$ converge para $0$.`,
              false,
              t`Falso! $\lim_{b\to\infty}\int_0^b\cos x\,dx = \lim_{b\to\infty}\operatorname{sen}b$ não existe (oscila sem parar), logo a integral diverge.`,
            ),
          ],
        },
        {
          card: {
            title: 'Assíntotas verticais no intervalo',
            body: t`Uma integral em $[a,\,b]$ finito também é **imprópria** (Tipo 2) se o integrando explode ($f(x)\to\pm\infty$) num extremo ou no meio do intervalo! Trocamos o ponto de descontinuidade por um limite lateral:
$$\int_0^1\frac{1}{x^p}\,dx=\lim_{t\to 0^+}\int_t^1 x^{-p}\,dx=\begin{cases}\dfrac{1}{1-p},&\text{se }p<1\text{ (converge)}\\\infty,&\text{se }p\ge 1\text{ (diverge)}\end{cases}$$`,
            example: t`$\int_0^1\frac{1}{\sqrt x}\,dx=\lim_{t\to 0^+}[2\sqrt x]_t^1=2-0=2$ (converge, $p=\frac12<1$), mas $\int_0^1\frac{1}{x}\,dx=\lim_{t\to 0^+}(-\ln t)=\infty$ (diverge).`,
            tip: t`Compare: perto de $0$ ($\int_0^1 x^{-p}\,dx$) converge para $p<1$; no infinito ($\int_1^\infty x^{-p}\,dx$) converge para $p>1$. E para $p=1$ ($\frac1x$), **diverge nos dois**!`,
          },
          exercises: [
            mcq(
              t`Por que $\int_0^1\frac{1}{\sqrt x}\,dx$ é uma integral imprópria mesmo tendo limites de integração finitos?`,
              [
                t`Porque o integrando vai para $+\infty$ quando $x\to 0^+$ (assíntota vertical)`,
                t`Porque o resultado envolve número irracional`,
                t`Porque $\sqrt x$ não tem primitiva elementar`,
                t`Porque o limite superior é $1$`,
              ],
              0,
              t`Em $x=0$ o denominador zera e a função não é limitada em $[0,\,1]$.`,
            ),
            fill(
              t`Compare os critérios de convergência de $\frac{1}{x^p}$:`,
              t`$\int_1^\infty\frac{1}{x^p}\,dx$ converge para ___ e $\int_0^1\frac{1}{x^p}\,dx$ converge para ___`,
              [t`$p>1$`, t`$p<1$`],
              [t`$p=1$`, t`$p\ge 1$`, t`todo $p>0$`],
              t`No infinito precisamos de decaimento rápido ($p>1$); perto da origem a explosão precisa ser suave ($p<1$).`,
            ),
            gen((rng) => {
              const b = randInt(rng, 1, 5);
              const k = randInt(rng, 1, 4);
              return num(
                t`Calcule a integral imprópria $\int_0^{${b * b}}\dfrac{${k}}{\sqrt{x}}\,dx$.`,
                2 * k * b,
                t`$\lim_{t\to 0^+}\left[${2 * k}\sqrt{x}\right]_t^{${b * b}} = ${2 * k}\cdot ${b} - 0 = ${2 * k * b}$.`,
              );
            }),
            gen((rng) => {
              const a = randInt(rng, 1, 4);
              const len = randInt(rng, 1, 4);
              const b = a + len * len;
              const k = randInt(rng, 1, 3);
              return num(
                t`Calcule $\int_{${a}}^{${b}}\dfrac{${k}}{\sqrt{x-${a}}}\,dx$ (descontinuidade em $x=${a}$).`,
                2 * k * len,
                t`$\lim_{t\to ${a}^+}\left[${2 * k}\sqrt{x-${a}}\right]_t^{${b}} = ${2 * k}\sqrt{${len * len}} = ${2 * k * len}$.`,
              );
            }),
            mcqS(
              t`Quanto vale a integral imprópria $\int_0^1\frac{1}{x^{1/3}}\,dx$?`,
              t`$\frac32$`,
              [t`$3$`, t`$\frac23$`, t`$\frac13$`, t`diverge`],
              t`Como $p=\frac13<1$, converge para $\frac{1}{1-1/3}=\frac{1}{2/3}=\frac32$.`,
            ),
            tf(
              t`Podemos calcular $\int_{-1}^1\frac{1}{x^2}\,dx$ aplicando Barrow direto: $\left[-\frac1x\right]_{-1}^1 = -1-1=-2$.`,
              false,
              t`Errado! Há uma assíntota vertical em $x=0$ no meio do intervalo. Separando em $\int_{-1}^0+\int_0^1$, ambas divergem ($p=2\ge 1$).`,
            ),
            mcqS(
              t`Sabendo que $\lim_{t\to 0^+} t\ln t=0$, quanto vale a integral imprópria $\int_0^1\ln x\,dx = \lim_{t\to 0^+}[x\ln x-x]_t^1$?`,
              t`$-1$`,
              [t`$-\infty$ (diverge)`, t`$0$`, t`$1$`, t`$-e$`],
              t`$(1\ln 1 - 1) - \lim_{t\to 0^+}(t\ln t - t) = -1 - 0 = -1$.`,
            ),
            num(
              t`Calcule a integral imprópria $\int_0^2\frac{dx}{\sqrt{4-x^2}}$ (assíntota em $x=2$), com 2 casas decimais.`,
              Math.PI / 2,
              t`$\lim_{t\to 2^-}\operatorname{arcsen}\left(\frac{t}{2}\right) = \operatorname{arcsen}(1) = \frac{\pi}{2}\approx 1{,}571$.`,
              { tol: 0.01 },
            ),
          ],
        },
        {
          card: [
            {
              title: 'Comparação e estratégia',
              body: t`Quando não há primitiva elementar (como em $\int_1^\infty e^{-x^2}\,dx$), usamos o **critério da comparação** para $0\le f(x)\le g(x)$:

• Se a **maior** ($\int g$) **converge**, a menor ($\int f$) também **converge**.
• Se a **menor** ($\int f$) **diverge**, a maior ($\int g$) também **diverge**.`,
              example: t`Para $x\ge 1$, $0\le e^{-x^2}\le e^{-x}$. Como $\int_1^\infty e^{-x}\,dx=e^{-1}$ converge, $\int_1^\infty e^{-x^2}\,dx$ também converge!`,
            },
            {
              title: 'Resumo: qual técnica usar?',
              body: t`Diante de uma integral $\int f(x)\,dx$, siga esta ordem de ataque:

1. **Simplifique e olhe a tabela**: expanda, separe frações ou use identidades imediatas.
2. **Substituição $u=g(x)$**: aparece uma função composta e sua derivada $g'(x)\,dx$?
3. **Pelo formato do integrando**:
   • Produto de famílias diferentes ($x\,e^x$, $x\cos x$, $\ln x$, $\operatorname{arctg}x$) $\to$ **Por partes (LIATE)**
   • Potências de $\operatorname{sen}/\cos$ ou $\operatorname{tg}/\sec$ $\to$ **Trigonométrica**
   • Raiz $\sqrt{a^2-x^2}$, $\sqrt{a^2+x^2}$, $\sqrt{x^2-a^2}$ $\to$ **Substituição trigonométrica**
   • Fração de polinômios $\frac{P(x)}{Q(x)}$ $\to$ **Frações parciais** (divida se grau $\ge$)`,
            },
          ],
          exercises: [
            tf(
              t`Se $0\le f(x)\le g(x)$ para $x\ge 1$ e $\int_1^\infty g(x)\,dx$ converge, então $\int_1^\infty f(x)\,dx$ também converge.`,
              true,
              t`A área sob $f$ é positiva, crescente com $b$ e limitada superiormente pela área finita sob $g$.`,
            ),
            mcq(
              t`Se $0\le f(x)\le g(x)$ e sabemos apenas que a **menor** $\int_1^\infty f(x)\,dx$ converge, o que podemos concluir sobre a maior $\int_1^\infty g(x)\,dx$?`,
              [
                t`Nada: estar acima de uma área finita não impede $g$ de divergir`,
                t`Que $\int_1^\infty g(x)\,dx$ certamente converge`,
                t`Que $\int_1^\infty g(x)\,dx$ certamente diverge`,
                t`Que as duas integrais são iguais`,
              ],
              0,
              t`Ex.: $\frac{1}{x^2}\le\frac{1}{x}$ em $[1,\,\infty)$, $\int_1^\infty\frac{1}{x^2}\,dx$ converge, mas $\int_1^\infty\frac{1}{x}\,dx$ diverge.`,
            ),
            mcqS(
              t`Usando comparação em $[1,\,\infty)$, o que ocorre com $\int_1^\infty\frac{\cos^2 x}{x^2}\,dx$?`,
              t`Converge, pois $0\le\frac{\cos^2 x}{x^2}\le\frac{1}{x^2}$ e $\int_1^\infty\frac{1}{x^2}\,dx$ converge`,
              [
                t`Diverge, porque $\cos^2 x$ oscila infinitas vezes`,
                t`Diverge, pois é maior que $\frac1x$`,
                t`Converge para $0$`,
                t`Não é possível decidir por comparação`,
              ],
              t`Como $0\le\cos^2 x\le 1$, o integrando fica preso abaixo de $\frac{1}{x^2}$, cuja integral de $1$ a $\infty$ vale $1$.`,
            ),
            mcqS(
              t`E o que ocorre com $\int_1^\infty\frac{1}{\sqrt{x^2-0{,}5}}\,dx$ comparando com $\frac{1}{x}$?`,
              t`Diverge, pois $\frac{1}{\sqrt{x^2-0{,}5}}\ge\frac{1}{x}$ e $\int_1^\infty\frac{1}{x}\,dx$ diverge`,
              [
                t`Converge, pois tem raiz quadrada no denominador`,
                t`Converge, pois $\frac{1}{\sqrt{x^2-0{,}5}}\le\frac{1}{x^2}$`,
                t`Converge para $\frac{\pi}{2}$`,
                t`Diverge apenas porque $0{,}5$ não é inteiro`,
              ],
              t`Diminuir o denominador aumenta a fração: como fica acima de $\frac1x$ (que diverge), também diverge.`,
            ),
            match(
              t`Ligue cada integral à técnica mais indicada:`,
              [
                [t`$\int x\,e^{3x}\,dx$`, t`Integração por partes`],
                [t`$\int x\,e^{x^2}\,dx$`, t`Substituição simples ($u=x^2$)`],
                [t`$\int\frac{3x+1}{x^2-4}\,dx$`, t`Frações parciais`],
                [t`$\int\sqrt{9-x^2}\,dx$`, t`Substituição trigonométrica`],
              ],
              t`Reconhecer o padrão visual do integrando é o passo mais importante antes de fazer contas.`,
            ),
            gen((rng) => {
              const k = randInt(rng, 2, 6);
              const a = k * k;
              return rmcq(
                rng,
                t`Qual é o método mais direto para integrar $\int\dfrac{1}{x^2-${a}}\,dx$, $\int\dfrac{x}{x^2-${a}}\,dx$ e $\int\sqrt{${a}-x^2}\,dx$, respectivamente?`,
                t`Frações parciais, substituição simples ($u=x^2-${a}$) e substituição trigonométrica ($x=${k}\operatorname{sen}\theta$)`,
                [
                  t`Substituição simples nas três`,
                  t`Substituição trigonométrica, frações parciais e integração por partes`,
                  t`Frações parciais nas duas primeiras e integração por partes na terceira`,
                  t`Integração por partes, substituição simples e frações parciais`,
                ],
                t`$\frac{1}{x^2-${a}}$ fatora em $(x-${k})(x+${k})$; em $\frac{x}{x^2-${a}}$ temos $x\,dx=\frac12 du$; e $\sqrt{${a}-x^2}$ pede $x=${k}\operatorname{sen}\theta$.`,
              );
            }),
            order(
              t`Ordene as 4 integrais da mais imediata para a que exige técnica mais elaborada:`,
              [
                t`$\int\frac{1}{x^2+1}\,dx$ (tabela imediata: $\operatorname{arctg}x$)`,
                t`$\int\frac{x}{x^2+1}\,dx$ (substituição simples: $u=x^2+1$)`,
                t`$\int\frac{1}{x(x^2+1)}\,dx$ (frações parciais: $\frac{A}{x}+\frac{Bx+C}{x^2+1}$)`,
                t`$\int\frac{1}{(x^2+1)^{3/2}}\,dx$ (substituição trigonométrica: $x=\operatorname{tg}\theta$)`,
              ],
              t`Pequenas mudanças no integrando mudam completamente a ferramenta necessária.`,
            ),
            multi(
              t`Quais das integrais abaixo saem por **substituição simples** $u=g(x)$ (sem precisar de partes, frações parciais ou substituição trigonométrica)?`,
              [
                t`$\int x\sqrt{9-x^2}\,dx$`,
                t`$\int\frac{\cos x}{1+\operatorname{sen}^2 x}\,dx$`,
                t`$\int x\ln x\,dx$`,
                t`$\int\frac{1}{x^2-9}\,dx$`,
                t`$\int\frac{2x+1}{x^2+x+5}\,dx$`,
              ],
              [0, 1, 4],
              t`Na 1ª, $u=9-x^2$; na 2ª, $u=\operatorname{sen}x$ ($\to\operatorname{arctg}(\operatorname{sen}x)$); na 5ª, $u=x^2+x+5$. Já $x\ln x$ usa partes e $\frac{1}{x^2-9}$ usa frações parciais.`,
            ),
          ],
        },
      ],
    },
  ],
};

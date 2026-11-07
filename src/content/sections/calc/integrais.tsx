import React from 'react';
import type { UnitDef } from '../../types';
import { gen, mcq, mcqS, num, tf, fill, match, order, inter, plot, rmcq, near } from '../../helpers';
import { AreaUnder, FnCurve, Pt, RectW, Seg } from '../../../components/plot/Plot';
import { C } from '../../../theme';
import { fmt, randInt, randNZ, polyTex, term } from '../../../lib/random';
import { areaLab, betweenLab, fnLab, riemannLab } from '../../visuals';

const t = String.raw;

const familyLab = () =>
  fnLab({
    f: (x, p) => (x * x) / 2 + p.C,
    params: [{ key: 'C', label: 'C', min: -3, max: 3, step: 0.25, value: 0, color: C.p3 }],
    view: { xMin: -4, xMax: 4, yMin: -4, yMax: 8 },
    extra: (p) => (
      <>
        {[-2, -1, 1, 2].map((c) => (
          <FnCurve key={c} f={(x) => (x * x) / 2 + c} color={C.textDim} width={1} />
        ))}
        <Pt x={0} y={p.C} color={C.p3} label="F(0)" />
        <Pt x={1} y={0.5 + p.C} color={C.gold} />
      </>
    ),
    info: (p) => t`$F(x)=\frac{x^2}{2}${p.C < 0 ? '' : '+'}${fmt(p.C, 2)}$ · $F(0)=${fmt(p.C, 2)}$, $F(1)=${fmt(0.5 + p.C, 2)}$ · todas têm $F'(x)=x$`,
  });

const motionLab = () =>
  plot({
    view: { xMin: 0, xMax: 6.5, yMin: -4, yMax: 12 },
    params: [{ key: 'v0', label: 'v_0', min: 1, max: 8, step: 0.5, value: 4, color: C.p2 }],
    render: ({ p }: any) => {
      const tPeak = p.v0 / 2;
      const sMax = (p.v0 * p.v0) / 4;
      return (
        <>
          <FnCurve f={(x) => p.v0 - 2 * x} from={0} to={6.5} color={C.p2} width={2} dash="6 4" />
          <FnCurve f={(x) => p.v0 * x - x * x} from={0} to={6.5} color={C.p1} />
          <Pt x={tPeak} y={sMax} color={C.gold} label="máx" />
          <Pt x={tPeak} y={0} color={C.p2} r={5} />
        </>
      );
    },
    info: ({ p }: any) => t`$v(t)=${fmt(p.v0, 1)}-2t$ (tracejada) · $s(t)=${fmt(p.v0, 1)}t-t^2$ · topo em $t=${fmt(p.v0 / 2, 2)}$ s ($v=0$)`,
  });

const subsLab = () =>
  plot({
    view: { xMin: -1.8, xMax: 1.5, yMin: -0.5, yMax: 8 },
    params: [{ key: 'a', label: 'a', min: 0.1, max: 1.5, step: 0.05, value: 1, color: C.p3 }],
    render: ({ p }: any) => (
      <>
        <FnCurve f={(x) => Math.exp(2 * x)} color={C.gold} dash="7 6" width={2.5} />
        <FnCurve f={(x) => 2 * p.a * Math.exp(2 * x)} color={C.p3} />
      </>
    ),
    info: ({ p }: any) => t`Candidata $F(x)=${fmt(p.a, 2)}e^{2x}\implies F'(x)=${fmt(2 * p.a, 2)}e^{2x}$ · alvo tracejado: $f(x)=e^{2x}$`,
  });

const partsLab = () =>
  plot({
    view: { xMin: -2.5, xMax: 1.8, yMin: -2, yMax: 7 },
    params: [{ key: 'k', label: 'k', min: -2, max: 1, step: 0.25, value: 0, color: C.p4 }],
    render: ({ p }: any) => (
      <>
        <FnCurve f={(x) => x * Math.exp(x)} color={C.gold} dash="7 6" width={2.5} />
        <FnCurve f={(x) => (x + 1 + p.k) * Math.exp(x)} color={C.p4} />
      </>
    ),
    info: ({ p }: any) => t`$F(x)=(x${p.k < 0 ? '' : '+'}${fmt(p.k, 2)})e^x\implies F'(x)=(x${1 + p.k < 0 ? '' : '+'}${fmt(1 + p.k, 2)})e^x$ · alvo: $xe^x$`,
  });

const signedAreaLab = () =>
  plot({
    view: { xMin: -0.3, xMax: 3.3, yMin: -1.5, yMax: 2.5 },
    params: [{ key: 'b', label: 'b', min: 0.5, max: 3, step: 0.1, value: 1.5, color: C.p3 }],
    render: ({ p }: any) => (
      <>
        <AreaUnder f={(x) => x - 1} a={0} b={Math.min(1, p.b)} color={C.danger} opacity={0.35} />
        {p.b > 1 ? <AreaUnder f={(x) => x - 1} a={1} b={p.b} color={C.success} opacity={0.35} /> : null}
        <FnCurve f={(x) => x - 1} color={C.p1} />
        <Pt x={p.b} y={p.b - 1} color={C.gold} />
      </>
    ),
    info: ({ p }: any) => {
      const net = 0.5 * p.b * p.b - p.b;
      return t`$\int_0^{${fmt(p.b, 1)}}(x-1)\,dx = ${fmt(net, 2)}$ (vermelho negativo, verde positivo)`;
    },
  });

const intersectAreaLab = () =>
  plot({
    view: { xMin: -0.4, xMax: 3.4, yMin: -0.5, yMax: 9.5 },
    params: [{ key: 'm', label: 'm', min: 1, max: 3, step: 0.25, value: 2, color: C.p2 }],
    render: ({ p }: any) => (
      <>
        <AreaUnder f={(x) => p.m * x} g={(x) => x * x} a={0} b={p.m} color={C.gold} opacity={0.35} />
        <FnCurve f={(x) => p.m * x} color={C.p2} />
        <FnCurve f={(x) => x * x} color={C.p3} />
        <Pt x={0} y={0} color={C.gold} r={4} />
        <Pt x={p.m} y={p.m * p.m} color={C.gold} r={5} />
      </>
    ),
    info: ({ p }: any) => t`Cruzam em $x=0$ e $x=${fmt(p.m, 2)}$ · Área $=\int_0^{${fmt(p.m, 2)}} (${fmt(p.m, 2)}x-x^2)\,dx = \frac{${fmt(p.m, 2)}^3}{6} = ${fmt((p.m ** 3) / 6, 3)}$`,
  });

const meanValueLab = () =>
  plot({
    view: { xMin: -0.3, xMax: 3.3, yMin: -0.5, yMax: 9.5 },
    params: [{ key: 'h', label: 'h', min: 0, max: 9, step: 0.1, value: 1.5, color: C.p4 }],
    render: ({ p }: any) => (
      <>
        <AreaUnder f={(x) => x * x} a={0} b={3} color={C.p1} opacity={0.3} />
        <RectW x={0} y={0} w={3} h={p.h} color={C.p4} opacity={0.3} />
        <FnCurve f={(x) => x * x} color={C.p1} />
        <Seg x1={0} y1={p.h} x2={3} y2={p.h} color={C.p4} width={2.5} dash="5 4" />
      </>
    ),
    info: ({ p }: any) => t`Área sob $x^2$ em $[0,\,3]$: $9$ · área do retângulo: $3\cdot${fmt(p.h, 1)}=${fmt(3 * p.h, 1)}$`,
  });

export const integrais: UnitDef = {
  id: 'c-int',
  title: 'Integrais indefinidas',
  subtitle: 'Primitivas, valor inicial, substituição e por partes',
  icon: '∫',
  source: 'Cálculo I · Unidade 4 — Integrais',
  guide: t`Integrar é **desfazer a derivada**: achar uma primitiva $F$ tal que $F'=f$, sempre somando a constante $+C$. Uma condição inicial fixa o $C$; a substituição $u$ desfaz a regra da cadeia e a integração por partes desfaz a regra do produto.`,
  lessons: [
    {
      id: 'c-int-prim',
      title: 'Primitivas',
      parts: [
        {
          card: {
            title: 'Derivar ao contrário',
            body: t`Uma **primitiva** (ou antiderivada) de $f(x)$ é uma função $F(x)$ tal que $F'(x)=f(x)$. Para potências:
$$\int x^n\,dx=\frac{x^{n+1}}{n+1}+C\quad(n\ne-1)$$

O $+C$ existe porque somar uma constante só desloca o gráfico na vertical, sem alterar a inclinação em cada $x$:`,
            visual: familyLab(),
            tip: t`Sempre dá para conferir uma integral: **derive** sua resposta e veja se volta ao integrando.`,
          },
          exercises: [
            tf(t`Se $F'(x)=f(x)$, então $F(x)+C$ também tem derivada $f(x)$ para qualquer constante $C$.`, true, t`A derivada de uma constante $C$ é zero: $(F(x)+C)'=F'(x)+0=f(x)$.`),
            inter(t`Ajuste a constante $C$ para que a primitiva $F(x)=\frac{x^2}{2}+C$ tenha $F(0)=1{,}5$.`, 'plot', familyLab().props, (v: any) => v && near(v.p.C, 1.5, 0.05), t`$C=1{,}5$`, t`Em $x=0$, $F(0)=0+C=1{,}5$.`),
            mcqS(t`Qual das funções abaixo é uma primitiva de $f(x)=2x$?`, t`$x^2+7$`, [t`$2$`, t`$2x^2+7$`, t`$\frac{x^2}{2}$`, t`$x^3$`], t`Derivando $x^2+7$ obtemos $2x+0=2x$.`),
            gen((rng) => {
              const n = randInt(rng, 1, 5);
              const k = randInt(rng, 1, 4);
              const a = (n + 1) * k;
              return rmcq(
                rng,
                t`Calcule $\int ${a}x^{${n}}\,dx$.`,
                t`$${k === 1 ? '' : k}x^{${n + 1}}+C$`,
                [t`$${a * n}x^{${n - 1}}+C$`, t`$${a}x^{${n + 1}}+C$`, t`$${k === 1 ? '' : k}x^{${n}}+C$`, t`$\frac{x^{${n + 1}}}{${a}}+C$`],
                t`$${a}\cdot\frac{x^{${n + 1}}}{${n + 1}}=${k === 1 ? '' : k}x^{${n + 1}}+C$.`,
              );
            }),
            mcqS(t`Quanto vale $\int 1\,dx$ (também escrita como $\int dx$)?`, t`$x+C$`, [t`$0$`, t`$1+C$`, t`$\frac{x^2}{2}+C$`, t`$C$`], t`A derivada de $x+C$ é $1$.`),
            gen((rng) => {
              const n = randInt(rng, 1, 3);
              const k = randInt(rng, 1, 3);
              const a = (n + 1) * k;
              const x0 = randInt(rng, 1, 3);
              return num(
                t`Seja $F(x)$ a primitiva de $f(x)=${a}x^{${n}}$ com constante $C=0$. Quanto vale $F(${x0})$?`,
                k * x0 ** (n + 1),
                t`$F(x)=${k === 1 ? '' : k}x^{${n + 1}}\implies F(${x0})=${k}\cdot ${x0}^{${n + 1}}=${k * x0 ** (n + 1)}$.`,
              );
            }),
            mcq(
              t`Duas primitivas de uma mesma função num intervalo diferem sempre por…`,
              ['uma constante', 'um fator multiplicativo', 'uma reta $ax+b$', 'zero'],
              0,
              t`Se $F'=G'=f$, então $(F-G)'=0$, logo $F(x)-G(x)=C$.`,
            ),
            gen((rng) => {
              const a = randInt(rng, 2, 6);
              const b = randNZ(rng, -5, 5);
              return rmcq(
                rng,
                t`Qual é o resultado de $\dfrac{d}{dx}\left(\int (${a}x^2${term(b, 'x')})\,dx\right)$?`,
                t`$${a}x^2${term(b, 'x')}$`,
                [t`$${2 * a}x${term(b, '')}$`, t`$\frac{${a}}{3}x^3${term(b / 2, 'x^2')}+C$`, t`$${a}x^2${term(b, 'x')}+C$`, t`$0$`],
                t`A derivada desfaz a integral indefinida e devolve o próprio integrando.`,
              );
            }),
          ],
        },
        {
          card: {
            title: 'Raízes, frações e o caso 1/x',
            body: t`Reescreva raízes e potências no denominador como expoentes fracionários ou negativos: $\sqrt{x}=x^{1/2}$ e $\frac{1}{x^k}=x^{-k}$.

A única exceção à regra da potência é $n=-1$, que dá logaritmo:
$$\int\frac{1}{x}\,dx=\ln|x|+C$$`,
            example: t`$\int\frac{1}{\sqrt x}\,dx=\int x^{-1/2}\,dx=\frac{x^{1/2}}{1/2}+C=2\sqrt x+C$ e $\int\frac{1}{x^2}\,dx=\int x^{-2}\,dx=-\frac{1}{x}+C$.`,
            tip: t`O módulo em $\ln|x|+C$ garante que a primitiva valha também para $x<0$.`,
          },
          exercises: [
            tf(t`$\int x^{-1}\,dx=\frac{x^0}{0}+C$.`, false, t`Para $n=-1$ a regra da potência dividiria por zero: $\int\frac1x\,dx=\ln|x|+C$.`),
            mcqS(t`Calcule $\int\frac{1}{\sqrt{x}}\,dx$.`, t`$2\sqrt{x}+C$`, [t`$\frac{1}{2\sqrt x}+C$`, t`$\ln\sqrt x+C$`, t`$\sqrt x+C$`, t`$-\frac{1}{2\sqrt x}+C$`], t`$\int x^{-1/2}\,dx=\frac{x^{1/2}}{1/2}+C=2\sqrt x+C$.`),
            mcqS(t`Calcule $\int\frac{3}{x}\,dx$.`, t`$3\ln|x|+C$`, [t`$-\frac{3}{x^2}+C$`, t`$\frac{3x^2}{2}+C$`, t`$\ln|3x|$`, t`$\frac{3}{\ln x}+C$`], t`Constante sai da integral: $3\int\frac1x\,dx=3\ln|x|+C$.`),
            gen((rng) => {
              const n = randInt(rng, 2, 5);
              const k = randInt(rng, 1, 4);
              const a = (n - 1) * k;
              const xp = n - 1 === 1 ? 'x' : `x^{${n - 1}}`;
              return rmcq(
                rng,
                t`Calcule $\int \dfrac{${a}}{x^{${n}}}\,dx$.`,
                t`$-\frac{${k}}{${xp}}+C$`,
                [t`$\frac{${k}}{${xp}}+C$`, t`$${a}\ln|x^{${n}}|+C$`, t`$-\frac{${a}}{x^{${n + 1}}}+C$`, t`$-\frac{${a}}{${xp}}+C$`],
                t`$\int ${a}x^{-${n}}\,dx=${a}\frac{x^{-${n - 1}}}{-${n - 1}}=-\frac{${k}}{${xp}}+C$.`,
              );
            }),
            mcqS(t`Para integrar $\int \sqrt[3]{x^2}\,dx$, reescrevemos o integrando como:`, t`$x^{2/3}$`, [t`$x^{3/2}$`, t`$x^{-2/3}$`, t`$\frac23 x$`, t`$x^{1/6}$`], t`Expoente de dentro no numerador e índice da raiz no denominador: $\sqrt[3]{x^2}=x^{2/3}$.`),
            mcqS(t`Calcule $\int x\sqrt{x}\,dx$.`, t`$\frac{2}{5}x^{5/2}+C$`, [t`$\frac{3}{2}x^{3/2}+C$`, t`$\frac{2}{3}x^{3/2}+C$`, t`$\frac{5}{2}x^{5/2}+C$`, t`$\frac{x^2}{2}\sqrt x+C$`], t`$x\sqrt x=x^{3/2}\implies \frac{x^{5/2}}{5/2}=\frac25 x^{5/2}+C$.`),
            gen((rng) => {
              const a = randNZ(rng, -7, 7);
              return rmcq(
                rng,
                t`Calcule $\int \dfrac{${a}}{x}\,dx$ para $x\ne 0$.`,
                t`$${term(a, '\\ln|x|', true)}+C$`,
                [t`$-\frac{${a}}{x^2}+C$`, t`$${term(a, 'x\\ln|x|', true)}+C$`, t`$\frac{${a}}{2}x^2+C$`, t`$\ln|x|+C$`],
                t`$\int\frac{${a}}{x}\,dx=${term(a, '\\ln|x|', true)}+C$.`,
              );
            }),
            fill(
              t`Complete as duas integrais:`,
              t`$\int x^{-2}\,dx =$ ___ $+C$ e $\int x^{-1}\,dx =$ ___ $+C$`,
              [t`$-\frac{1}{x}$`, t`$\ln|x|$`],
              [t`$\frac{1}{x}$`, t`$x^0$`, t`$-\frac{2}{x^3}$`],
              t`$x^{-2}$ segue a regra da potência ($\frac{x^{-1}}{-1}$), enquanto $x^{-1}$ integra para $\ln|x|$.`,
            ),
          ],
        },
        {
          card: {
            title: 'Tabela imediata e linearidade',
            body: t`$$\int e^x\,dx=e^x+C\qquad\int\cos x\,dx=\operatorname{sen}x+C\qquad\int\operatorname{sen}x\,dx=-\cos x+C$$

A integral é **linear**: $\int(af+bg)\,dx=a\int f\,dx+b\int g\,dx$.`,
            example: t`$\int(6x^2-4x+3)\,dx=2x^3-2x^2+3x+C$.`,
            tip: t`Atenção ao sinal: a derivada de $\operatorname{sen}x$ é $+\cos x$, mas a integral de $\operatorname{sen}x$ é $-\cos x+C$.`,
          },
          exercises: [
            mcqS(t`Calcule $\int\cos x\,dx$.`, t`$\operatorname{sen}x+C$`, [t`$-\operatorname{sen}x+C$`, t`$\cos x+C$`, t`$-\cos x+C$`, t`$\operatorname{tg}x+C$`], t`Pois $(\operatorname{sen}x)'=\cos x$.`),
            mcqS(t`Calcule $\int\operatorname{sen}x\,dx$.`, t`$-\cos x+C$`, [t`$\cos x+C$`, t`$\operatorname{sen}x+C$`, t`$-\operatorname{sen}x+C$`, t`$\sec^2 x+C$`], t`Pois $(-\cos x)'=-(-\operatorname{sen}x)=\operatorname{sen}x$.`),
            match(
              t`Ligue integrando e primitiva:`,
              [
                [t`$e^x$`, t`$e^x+C$`],
                [t`$\operatorname{sen}x$`, t`$-\cos x+C$`],
                [t`$x^2$`, t`$\frac{x^3}{3}+C$`],
                [t`$\frac1x$`, t`$\ln|x|+C$`],
              ],
              t`Regras imediatas da tabela de primitivas.`,
            ),
            gen((rng) => {
              const c2 = randNZ(rng, -3, 3);
              const c1 = randNZ(rng, -4, 4);
              const c0 = randNZ(rng, -5, 5);
              return rmcq(
                rng,
                t`Calcule $\int (${polyTex([c0, 2 * c1, 3 * c2])})\,dx$.`,
                t`$${polyTex([0, c0, c1, c2])}+C$`,
                [
                  t`$${polyTex([0, c0, 2 * c1, 3 * c2])}+C$`,
                  t`$${polyTex([2 * c1, 6 * c2])}+C$`,
                  t`$${polyTex([0, c0, -c1, c2])}+C$`,
                  t`$${polyTex([c0, c1, c2])}+C$`,
                ],
                t`Integrando termo a termo: $${polyTex([0, c0, c1, c2])}+C$.`,
              );
            }),
            tf(t`Para quaisquer funções, a integral do produto é o produto das integrais: $\int f(x)g(x)\,dx=\left(\int f\,dx\right)\left(\int g\,dx\right)$.`, false, t`A linearidade vale para soma e constante, nunca para produto! Ex.: $\int x\cdot x\,dx=\frac{x^3}{3}\ne \frac{x^2}{2}\cdot\frac{x^2}{2}$.`),
            mcqS(
              t`Para $x>0$, calcule $\int\frac{x^2+1}{x}\,dx$ separando a fração antes de integrar.`,
              t`$\frac{x^2}{2}+\ln x+C$`,
              [t`$\frac{x^3/3+x}{x^2/2}+C$`, t`$x-\frac{1}{x^2}+C$`, t`$\ln(x^2+1)+C$`, t`$\frac{x^2}{2}+\frac{1}{x^2}+C$`],
              t`$\frac{x^2+1}{x}=x+\frac1x\implies \int\left(x+\frac1x\right)dx=\frac{x^2}{2}+\ln x+C$.`,
            ),
            gen((rng) => {
              const a = randInt(rng, 2, 5);
              const b = randNZ(rng, -4, 4);
              return rmcq(
                rng,
                t`Calcule $\int (${a}e^x${term(b, '\\cos x')})\,dx$.`,
                t`$${a}e^x${term(b, '\\operatorname{sen}x')}+C$`,
                [t`$${a}e^x${term(-b, '\\operatorname{sen}x')}+C$`, t`$${a}e^x${term(b, '\\cos x')}+C$`, t`$e^{${a}x}${term(b, '\\operatorname{sen}x')}+C$`, t`$${a}xe^{x-1}${term(b, '\\operatorname{sen}x')}+C$`],
                t`Pela linearidade: $${a}\int e^x\,dx${term(b, '\\int\\cos x\\,dx')}=${a}e^x${term(b, '\\operatorname{sen}x')}+C$.`,
              );
            }),
            mcqS(
              t`Calcule $\int\left(\sec^2 x+\frac{1}{1+x^2}\right)dx$.`,
              t`$\operatorname{tg}x+\operatorname{arctg}x+C$`,
              [t`$\sec x+\ln(1+x^2)+C$`, t`$-\operatorname{cotg}x+\operatorname{arcsen}x+C$`, t`$\operatorname{tg}^2 x+\operatorname{arctg}x+C$`, t`$2\sec^2 x\operatorname{tg}x+C$`],
              t`$(\operatorname{tg}x)'=\sec^2 x$ e $(\operatorname{arctg}x)'=\frac{1}{1+x^2}$.`,
            ),
          ],
        },
      ],
    },
    {
      id: 'c-int-pvi',
      title: 'Valor inicial e EDO simples',
      parts: [
        {
          card: {
            title: 'Descobrindo o C',
            body: t`Uma **equação diferencial** simples tem a forma $\frac{dy}{dx}=f(x)$. A solução geral é a família $y=F(x)+C$. Uma **condição inicial** $y(x_0)=y_0$ seleciona uma única curva da família e fixa o valor de $C$.

Ajuste $C$ para escolher uma curva da família $F(x)=\frac{x^2}{2}+C$:`,
            visual: familyLab(),
            example: t`$y'=2x$, $y(0)=3$: $y=x^2+C$; substituindo $x=0$, temos $3=0+C\Rightarrow y=x^2+3$.`,
            tip: t`Cuidado com exponenciais e cossenos: em $x=0$, $e^0=1$ e $\cos 0=1$, então $y(0)$ nem sempre é igual a $C$!`,
          },
          exercises: [
            inter(t`Ajuste $C$ para que a solução de $F'(x)=x$ satisfaça a condição inicial $F(1)=2{,}5$.`, 'plot', familyLab().props, (v: any) => v && near(v.p.C, 2, 0.05), t`$C=2$`, t`$F(1)=0{,}5+C=2{,}5\implies C=2$.`),
            mcqS(t`Resolva $y'=\cos x$ com $y(0)=1$.`, t`$y=\operatorname{sen}x+1$`, [t`$y=\operatorname{sen}x$`, t`$y=-\operatorname{sen}x+1$`, t`$y=\cos x$`, t`$y=\operatorname{sen}x-1$`], t`$y=\operatorname{sen}x+C$; como $\operatorname{sen}0=0$, temos $C=1$.`),
            gen((rng) => {
              const k = randInt(rng, -5, 5);
              return num(t`Se $y'=3x^2$ e $y(0)=${k}$, quanto vale $y(2)$?`, 8 + k, t`$y=x^3+C$, $C=${k}$ ⟹ $y(2)=8${k < 0 ? '' : '+'}${k}=${8 + k}$.`);
            }),
            tf(t`Se $y'=e^x$ e $y(0)=0$, então na solução $y=e^x+C$ temos $C=0$.`, false, t`Substituindo $x=0$: $y(0)=e^0+C=1+C=0\implies C=-1$, logo $y=e^x-1$.`),
            num(t`Se $y'=e^x$ e $y(0)=5$, quanto vale a constante $C$ em $y=e^x+C$?`, 4, t`$y(0)=e^0+C=1+C=5\implies C=4$.`),
            gen((rng) => {
              const b = randNZ(rng, -4, 4);
              const y1 = randInt(rng, -3, 8);
              const c = y1 - 1 - b;
              return num(
                t`Se $f'(x)=2x${term(b, '')}$ e $f(1)=${y1}$, quanto vale $f(0)$?`,
                c,
                t`$f(x)=x^2${term(b, 'x')}+C$. Como $f(1)=1${term(b, '')}+C=${y1}$, temos $f(0)=C=${c}$.`,
              );
            }),
            order(
              t`Ordene os passos para resolver o PVI $y'=4x-1$ com $y(2)=5$:`,
              [
                t`Integrar $y'$ para obter a família $y=2x^2-x+C$`,
                t`Substituir $x=2$ e $y=5$: $2(2)^2-2+C=5$`,
                t`Isolar a constante: $6+C=5\implies C=-1$`,
                t`Escrever a solução particular: $y=2x^2-x-1$`,
              ],
              t`Primeiro integramos para achar a família geral e depois usamos o ponto inicial para fixar $C$.`,
            ),
            mcqS(
              t`Uma curva para $x>0$ tem inclinação $\frac{dy}{dx}=\frac{2}{x}$ e passa por $(1,\,3)$. Qual é sua equação?`,
              t`$y=2\ln x+3$`,
              [t`$y=2\ln x+1$`, t`$y=-\frac{2}{x^2}+5$`, t`$y=\ln(2x)+3$`, t`$y=2\ln x$`],
              t`$y=2\ln x+C$; em $x=1$, $2\ln 1+C=0+C=3\implies C=3$.`,
            ),
          ],
        },
        {
          card: {
            title: 'Da aceleração à posição',
            body: t`Na cinemática, $a(t)=\frac{dv}{dt}$ e $v(t)=\frac{ds}{dt}$. Por isso, integrar a aceleração dá a **velocidade** e integrar a velocidade dá a **posição**:
$$v(t)=\int a(t)\,dt\qquad s(t)=\int v(t)\,dt$$

Explore o lançamento vertical com $a=-2\text{ m/s}^2$ e $s(0)=0$:`,
            visual: motionLab(),
            example: t`Com $a=2\text{ m/s}^2$, $v(0)=0$ e $s(0)=0$: $v(t)=2t$ e $s(t)=t^2$. Em $t=5\text{ s}$, $v=10\text{ m/s}$ e $s=25\text{ m}$.`,
            tip: t`No ponto mais alto da trajetória, a velocidade se anula ($v(t)=0$).`,
          },
          exercises: [
            num(t`Um carro parte do repouso com aceleração constante $a=2$ m/s². Qual a velocidade em $t=5$ s?`, 10, t`$v=\int2\,dt=2t+C$, $v(0)=0\Rightarrow v(5)=10$ m/s.`, { unit: 'm/s' }),
            num(t`Com $v(t)=2t$ m/s e $s(0)=0$ m, qual a posição em $t=5$ s?`, 25, t`$s=\int 2t\,dt=t^2\implies s(5)=25$ m.`, { unit: 'm' }),
            inter(t`No laboratório ($a=-2\text{ m/s}^2$), ajuste a velocidade inicial $v_0$ para que a altura máxima ocorra em $t=3\text{ s}$.`, 'plot', motionLab().props, (v: any) => v && near(v.p.v0, 6, 0.1), t`$v_0=6\text{ m/s}$`, t`No topo, $v(3)=v_0-2(3)=0\implies v_0=6\text{ m/s}$.`),
            gen((rng) => {
              const k = randInt(rng, 1, 4);
              const v0 = randInt(rng, 1, 6);
              const s0 = randInt(rng, 0, 5);
              const t1 = randInt(rng, 2, 4);
              const ans = k * t1 * t1 + v0 * t1 + s0;
              return num(
                t`Um móvel tem velocidade $v(t)=${2 * k}t+${v0}$ m/s e parte de $s(0)=${s0}$ m. Qual a posição em $t=${t1}$ s?`,
                ans,
                t`$s(t)=${k === 1 ? '' : k}t^2+${v0}t+${s0}\implies s(${t1})=${k * t1 * t1}+${v0 * t1}+${s0}=${ans}$ m.`,
                { unit: 'm' },
              );
            }),
            gen((rng) => {
              const k = randInt(rng, 1, 3);
              const v0 = randInt(rng, 0, 5);
              const t1 = randInt(rng, 2, 4);
              const ans = 3 * k * t1 * t1 + v0;
              return num(
                t`Uma partícula tem aceleração $a(t)=${6 * k}t$ m/s² e velocidade inicial $v(0)=${v0}$ m/s. Qual a velocidade em $t=${t1}$ s?`,
                ans,
                t`$v(t)=\int ${6 * k}t\,dt=${3 * k}t^2+${v0}\implies v(${t1})=${ans}$ m/s.`,
                { unit: 'm/s' },
              );
            }),
            mcqS(
              t`Se $s''(t)=6t$, $s'(0)=2$ e $s(0)=1$, qual é a função posição $s(t)$?`,
              t`$s(t)=t^3+2t+1$`,
              [t`$s(t)=3t^2+2t+1$`, t`$s(t)=t^3+2$`, t`$s(t)=3t^3+2t+1$`, t`$s(t)=\frac{t^3}{2}+2t+1$`],
              t`$s'(t)=3t^2+2\implies s(t)=t^3+2t+1$.`,
            ),
            num(
              t`Uma pedra é lançada para cima do solo ($s(0)=0$) com $v(0)=20$ m/s e aceleração da gravidade $a=-10$ m/s². Qual a altura em $t=3$ s?`,
              15,
              t`$v(t)=20-10t\implies s(t)=20t-5t^2\implies s(3)=60-45=15$ m.`,
              { unit: 'm' },
            ),
            num(
              t`Uma cultura de bactérias cresce à taxa $P'(t)=100e^{0{,}5t}$ por hora e tem $P(0)=500$. Qual é a constante $C$ em $P(t)=200e^{0{,}5t}+C$?`,
              300,
              t`Em $t=0$: $P(0)=200e^0+C=200+C=500\implies C=300$.`,
            ),
          ],
        },
      ],
    },
    {
      id: 'c-int-subs',
      title: 'Substituição',
      parts: [
        {
          card: {
            title: 'Desfazendo a cadeia (u = ax + b)',
            body: t`A substituição $u=g(x)$ com $du=g'(x)\,dx$ é a **regra da cadeia ao contrário**:
$$\int f(g(x))\,g'(x)\,dx=\int f(u)\,du$$

Quando $u=kx$, temos $du=k\,dx\implies dx=\frac{du}{k}$. Ajuste $a$ em $F(x)=a\,e^{2x}$ para ver por que dividimos por $2$:`,
            visual: subsLab(),
            example: t`$\int e^{5x}\,dx$: $u=5x$, $dx=\frac{du}{5}\implies\frac15\int e^u\,du=\frac{e^{5x}}{5}+C$.`,
            tip: t`Ao derivar $\operatorname{sen}(kx)$, multiplica-se por $k$; ao integrar, **divide-se** por $k$.`,
          },
          exercises: [
            inter(t`Ajuste o coeficiente $a$ na candidata $F(x)=a\,e^{2x}$ até que sua derivada $F'(x)$ coincida com $f(x)=e^{2x}$.`, 'plot', subsLab().props, (v: any) => v && near(v.p.a, 0.5, 0.03), t`$a=0{,}5=\frac12$`, t`Como $(e^{2x})'=2e^{2x}$, precisamos de $a=\frac12$ para cancelar o fator $2$.`),
            mcqS(t`Calcule $\int e^{5x}\,dx$.`, t`$\frac{e^{5x}}{5}+C$`, [t`$5e^{5x}+C$`, t`$e^{5x}+C$`, t`$\frac{e^{x}}{5}+C$`, t`$\frac{e^{5x+1}}{5x+1}+C$`], t`$u=5x$, $dx=\frac{du}{5}$.`),
            mcqS(t`Calcule $\int\operatorname{sen}(3x)\,dx$.`, t`$-\frac{\cos(3x)}{3}+C$`, [t`$-3\cos(3x)+C$`, t`$\frac{\cos(3x)}{3}+C$`, t`$-\cos(3x)+C$`, t`$3\cos(3x)+C$`], t`$u=3x$, $dx=\frac{du}{3}$ e $\int\operatorname{sen}u\,du=-\cos u+C$.`),
            gen((rng) => {
              const k = randInt(rng, 2, 8);
              return rmcq(
                rng,
                t`Calcule $\int\cos(${k}x)\,dx$.`,
                t`$\frac{\operatorname{sen}(${k}x)}{${k}}+C$`,
                [t`$${k}\operatorname{sen}(${k}x)+C$`, t`$-\frac{\operatorname{sen}(${k}x)}{${k}}+C$`, t`$\operatorname{sen}(${k}x)+C$`, t`$\frac{\cos(${k}x)}{${k}}+C$`],
                t`$u=${k}x$, $dx=\frac{du}{${k}}\implies \frac{\operatorname{sen}(${k}x)}{${k}}+C$.`,
              );
            }),
            gen((rng) => {
              const a = randInt(rng, 2, 5);
              const b = randNZ(rng, -4, 4);
              const n = randInt(rng, 3, 6);
              const inside = `${a}x${term(b, '')}`;
              return rmcq(
                rng,
                t`Calcule $\int (${inside})^{${n}}\,dx$.`,
                t`$\frac{(${inside})^{${n + 1}}}{${a * (n + 1)}}+C$`,
                [
                  t`$\frac{(${inside})^{${n + 1}}}{${n + 1}}+C$`,
                  t`$${a}\frac{(${inside})^{${n + 1}}}{${n + 1}}+C$`,
                  t`$${a * n}(${inside})^{${n - 1}}+C$`,
                  t`$\frac{(${inside})^{${n}}}{${a * n}}+C$`,
                ],
                t`$u=${inside}$, $dx=\frac{du}{${a}}\implies \frac{1}{${a}}\cdot\frac{u^{${n + 1}}}{${n + 1}}=\frac{(${inside})^{${n + 1}}}{${a * (n + 1)}}+C$.`,
              );
            }),
            mcqS(
              t`Calcule $\int\frac{1}{2x+1}\,dx$ para $x>-\frac12$.`,
              t`$\frac12\ln(2x+1)+C$`,
              [t`$\ln(2x+1)+C$`, t`$2\ln(2x+1)+C$`, t`$-\frac{1}{2(2x+1)^2}+C$`, t`$\frac{1}{2x+1}+C$`],
              t`$u=2x+1$, $dx=\frac{du}{2}\implies \frac12\int\frac{du}{u}=\frac12\ln(2x+1)+C$.`,
            ),
            mcqS(
              t`Calcule $\int\sqrt{4x-1}\,dx$.`,
              t`$\frac16(4x-1)^{3/2}+C$`,
              [t`$\frac23(4x-1)^{3/2}+C$`, t`$\frac83(4x-1)^{3/2}+C$`, t`$\frac{1}{2\sqrt{4x-1}}+C$`, t`$\frac14(4x-1)^{3/2}+C$`],
              t`$u=4x-1$, $dx=\frac{du}{4}\implies \frac14\cdot\frac23 u^{3/2}=\frac16(4x-1)^{3/2}+C$.`,
            ),
            gen((rng) => {
              const k = randInt(rng, 2, 6);
              const q = randInt(rng, 2, 5);
              return num(
                t`Se $\int ${k * q}e^{${k}x}\,dx = A\,e^{${k}x}+C$, quanto vale o coeficiente $A$?`,
                q,
                t`$\int ${k * q}e^{${k}x}\,dx = \frac{${k * q}}{${k}}e^{${k}x}+C = ${q}e^{${k}x}+C\implies A=${q}$.`,
              );
            }),
          ],
        },
        {
          card: {
            title: 'Caçando u e du no integrando',
            body: t`Procure no integrando **"uma função e a derivada dela"** multiplicando $dx$. Se faltar apenas um fator constante, divida por ele:
$$\int x\,e^{x^2}\,dx:\quad u=x^2\implies du=2x\,dx\implies x\,dx=\frac{du}{2}$$`,
            example: t`$\int2x\cos(x^2)\,dx$: $u=x^2$, $du=2x\,dx$ ⟹ $\int\cos u\,du=\operatorname{sen}(x^2)+C$.`,
            tip: t`Apenas **constantes** podem sair da integral. Nunca passe $x$ para fora do sinal $\int$!`,
          },
          exercises: [
            mcqS(t`Calcule $\int 3x^2(x^3+1)^4\,dx$.`, t`$\frac{(x^3+1)^5}{5}+C$`, [t`$(x^3+1)^5+C$`, t`$\frac{(x^3+1)^5}{15}+C$`, t`$12x(x^3+1)^3$`, t`$\frac{x^3(x^3+1)^5}{5}+C$`], t`$u=x^3+1$, $du=3x^2dx$: $\int u^4du=\frac{u^5}{5}+C$.`),
            order(
              t`Ordene a substituição em $\int x\,e^{x^2}dx$:`,
              [
                t`Escolher $u=x^2$`,
                t`Calcular $du=2x\,dx$, então $x\,dx=\frac{du}{2}$`,
                t`Reescrever: $\frac12\int e^u\,du$`,
                t`Integrar e voltar para $x$: $\frac{e^{x^2}}{2}+C$`,
              ],
              t`O fator $x\,dx$ vira $\frac{du}{2}$; depois de integrar em $u$, voltamos para a variável $x$.`,
            ),
            gen((rng) => {
              const c = randInt(rng, 1, 5);
              const n = randInt(rng, 3, 6);
              return rmcq(
                rng,
                t`Calcule $\int x(x^2+${c})^{${n}}\,dx$.`,
                t`$\frac{(x^2+${c})^{${n + 1}}}{${2 * (n + 1)}}+C$`,
                [
                  t`$\frac{(x^2+${c})^{${n + 1}}}{${n + 1}}+C$`,
                  t`$2\frac{(x^2+${c})^{${n + 1}}}{${n + 1}}+C$`,
                  t`$\frac{x^2(x^2+${c})^{${n + 1}}}{${2 * (n + 1)}}+C$`,
                  t`$\frac{(x^2+${c})^{${n}}}{${2 * n}}+C$`,
                ],
                t`$u=x^2+${c}\implies x\,dx=\frac{du}{2}\implies \frac12\cdot\frac{u^{${n + 1}}}{${n + 1}}=\frac{(x^2+${c})^{${n + 1}}}{${2 * (n + 1)}}+C$.`,
              );
            }),
            mcqS(
              t`Calcule $\int x\operatorname{sen}(x^2)\,dx$.`,
              t`$-\frac12\cos(x^2)+C$`,
              [t`$\frac12\cos(x^2)+C$`, t`$-\cos(x^2)+C$`, t`$-2\cos(x^2)+C$`, t`$\frac{x^2}{2}\cos(x^2)+C$`],
              t`$u=x^2$, $x\,dx=\frac{du}{2}\implies \frac12\int\operatorname{sen}u\,du=-\frac12\cos(x^2)+C$.`,
            ),
            mcqS(
              t`Calcule $\int \operatorname{sen}^3 x\cos x\,dx$.`,
              t`$\frac{\operatorname{sen}^4 x}{4}+C$`,
              [t`$\frac{\cos^4 x}{4}+C$`, t`$3\operatorname{sen}^2 x+C$`, t`$-\frac{\operatorname{sen}^4 x}{4}+C$`, t`$\frac{\operatorname{sen}^4 x\cdot\operatorname{sen}x}{4}+C$`],
              t`$u=\operatorname{sen}x$, $du=\cos x\,dx\implies \int u^3\,du=\frac{u^4}{4}+C$.`,
            ),
            mcqS(
              t`Calcule $\int x\sqrt{x^2+9}\,dx$.`,
              t`$\frac13(x^2+9)^{3/2}+C$`,
              [t`$\frac23(x^2+9)^{3/2}+C$`, t`$(x^2+9)^{3/2}+C$`, t`$\frac{x}{\sqrt{x^2+9}}+C$`, t`$\frac12(x^2+9)^{3/2}+C$`],
              t`$u=x^2+9$, $x\,dx=\frac{du}{2}\implies \frac12\cdot\frac23 u^{3/2}=\frac13(x^2+9)^{3/2}+C$.`,
            ),
            gen((rng) => {
              const k = randInt(rng, 1, 5);
              return rmcq(
                rng,
                t`Calcule $\int ${2 * k}x\,e^{x^2}\,dx$.`,
                t`$${k === 1 ? '' : k}e^{x^2}+C$`,
                [t`$${2 * k}e^{x^2}+C$`, t`$${k === 1 ? '' : k}x^2 e^{x^2}+C$`, t`$\frac{e^{x^2}}{${2 * k}}+C$`, t`$${4 * k}x^2 e^{x^2}+C$`],
                t`$u=x^2$, $du=2x\,dx\implies ${k}\int e^u\,du=${k === 1 ? '' : k}e^{x^2}+C$.`,
              );
            }),
            tf(
              t`Para integrar $\int e^{x^2}\,dx$, podemos fazer $u=x^2$ e escrever $\frac{1}{2x}\int e^u\,du=\frac{e^{x^2}}{2x}+C$.`,
              false,
              t`Errado! $2x$ não é constante e não pode sair da integral. $\int e^{x^2}\,dx$ não tem primitiva elementar.`,
            ),
          ],
        },
        {
          card: {
            title: 'Derivada em cima, função embaixo',
            body: t`Quando o numerador é a derivada do denominador, a substituição $u=g(x)$ leva direto a um logaritmo:
$$\int\frac{g'(x)}{g(x)}\,dx=\int\frac{du}{u}=\ln|g(x)|+C$$`,
            example: t`$\int\frac{2x}{x^2+1}\,dx=\ln(x^2+1)+C$ e $\int\operatorname{tg}x\,dx=\int\frac{\operatorname{sen}x}{\cos x}\,dx=-\ln|\cos x|+C$.`,
            tip: t`Em $\int\frac{\ln x}{x}\,dx$, chame $u=\ln x$, pois $du=\frac{dx}{x}$ já está pronto no integrando!`,
          },
          exercises: [
            mcqS(t`Qual a melhor escolha de $u$ para $\int\frac{\ln x}{x}\,dx$?`, t`$u=\ln x$`, [t`$u=x$`, t`$u=\frac1x$`, t`$u=x\ln x$`, t`$u=\ln(x^2)$`], t`$du=\frac{dx}{x}$ ⟹ $\int u\,du=\frac{(\ln x)^2}{2}+C$.`),
            mcqS(t`Calcule $\int\frac{\ln x}{x}\,dx$.`, t`$\frac{(\ln x)^2}{2}+C$`, [t`$\ln(\ln x)+C$`, t`$\frac{1}{x^2}+C$`, t`$x\ln x-x+C$`, t`$\ln x+C$`], t`Com $u=\ln x$ e $du=\frac{dx}{x}$, temos $\int u\,du=\frac{u^2}{2}+C$.`),
            gen((rng) => {
              const k = randInt(rng, 1, 4);
              const c = randInt(rng, 1, 7);
              return rmcq(
                rng,
                t`Calcule $\int\dfrac{${2 * k}x}{x^2+${c}}\,dx$.`,
                t`$${k === 1 ? '' : k}\ln(x^2+${c})+C$`,
                [
                  t`$${2 * k}\ln(x^2+${c})+C$`,
                  t`$\frac{${k}}{x^2+${c}}+C$`,
                  t`$\ln(${2 * k}x)+C$`,
                  t`$-\frac{${2 * k}}{(x^2+${c})^2}+C$`,
                ],
                t`$u=x^2+${c}$, $du=2x\,dx\implies ${k}\int\frac{du}{u}=${k === 1 ? '' : k}\ln(x^2+${c})+C$.`,
              );
            }),
            mcqS(
              t`Calcule $\int\operatorname{tg}x\,dx=\int\frac{\operatorname{sen}x}{\cos x}\,dx$.`,
              t`$-\ln|\cos x|+C$`,
              [t`$\ln|\operatorname{sen}x|+C$`, t`$\sec^2 x+C$`, t`$\ln|\cos x|+C$`, t`$-\sec x+C$`],
              t`$u=\cos x\implies du=-\operatorname{sen}x\,dx\implies -\int\frac{du}{u}=-\ln|\cos x|+C$.`,
            ),
            mcqS(
              t`Calcule $\int\frac{e^x}{e^x+1}\,dx$.`,
              t`$\ln(e^x+1)+C$`,
              [t`$\frac{1}{(e^x+1)^2}+C$`, t`$e^x\ln(e^x+1)+C$`, t`$\frac{e^x}{e^x+x}+C$`, t`$e^x+C$`],
              t`$u=e^x+1$, $du=e^x\,dx\implies \int\frac{du}{u}=\ln(e^x+1)+C$.`,
            ),
            match(
              t`Ligue cada integral à substituição $u$ adequada:`,
              [
                [t`$\int\frac{\cos x}{\operatorname{sen}x}\,dx$`, t`$u=\operatorname{sen}x$`],
                [t`$\int\frac{e^{\sqrt x}}{\sqrt x}\,dx$`, t`$u=\sqrt x$`],
                [t`$\int\frac{1}{x\ln x}\,dx$`, t`$u=\ln x$`],
                [t`$\int\frac{x}{x^2+4}\,dx$`, t`$u=x^2+4$`],
              ],
              t`Em cada caso, $du$ aparece multiplicando $dx$ a menos de uma constante.`,
            ),
            gen((rng) => {
              const c = randInt(rng, 1, 9);
              return rmcq(
                rng,
                t`Calcule $\int\dfrac{x}{x^2+${c}}\,dx$.`,
                t`$\frac12\ln(x^2+${c})+C$`,
                [t`$\ln(x^2+${c})+C$`, t`$2\ln(x^2+${c})+C$`, t`$\operatorname{arctg}(x^2+${c})+C$`, t`$\frac{1}{(x^2+${c})^2}+C$`],
                t`$u=x^2+${c}\implies x\,dx=\frac{du}{2}\implies \frac12\ln(x^2+${c})+C$.`,
              );
            }),
            mcqS(
              t`Calcule $\int\frac{1}{x\ln x}\,dx$ para $x>1$.`,
              t`$\ln(\ln x)+C$`,
              [t`$\frac{(\ln x)^2}{2}+C$`, t`$\ln x+C$`, t`$-\frac{1}{(\ln x)^2}+C$`, t`$x\ln x+C$`],
              t`$u=\ln x$, $du=\frac{dx}{x}\implies \int\frac{du}{u}=\ln|u|+C=\ln(\ln x)+C$.`,
            ),
          ],
        },
      ],
    },
    {
      id: 'c-int-partes',
      title: 'Integração por partes',
      parts: [
        {
          card: {
            title: 'Desfazendo o produto (LIATE)',
            body: t`Da regra do produto $(uv)'=u'v+uv'$ sai a **integração por partes**:
$$\int u\,dv=uv-\int v\,du$$

Escolha $u$ pela prioridade **LIATE** (Logarítmica, Inversa trig., Algébrica, Trigonométrica, Exponencial). Veja como o termo $-e^x$ compensa a sobra da regra do produto em $(xe^x)'=xe^x+e^x$:`,
            visual: partsLab(),
            example: t`$\int x e^x dx$: $u=x$, $dv=e^xdx$ ⟹ $du=dx$, $v=e^x$:
$$xe^x-\int e^xdx=xe^x-e^x+C$$`,
            tip: t`Derive $u$ para achar $du$ e integre $dv$ para achar $v$.`,
          },
          exercises: [
            fill(
              t`Complete a fórmula da integração por partes:`,
              t`$\int u\,dv =$ ___ $-\int$ ___`,
              [t`$uv$`, t`$v\,du$`],
              [t`$u\,dv$`, t`$u^2$`, t`$dv$`],
              t`$\int u\,dv = uv - \int v\,du$.`,
            ),
            inter(t`Ajuste $k$ em $F(x)=(x+k)e^x$ até que sua derivada $F'(x)$ coincida exatamente com $xe^x$.`, 'plot', partsLab().props, (v: any) => v && near(v.p.k, -1, 0.05), t`$k=-1$`, t`Para $k=-1$, $F(x)=(x-1)e^x$ tem derivada $(x-1+1)e^x=xe^x$.`),
            tf(t`Na integração por partes, escolher mal o $u$ pode deixar a integral mais difícil.`, true, t`Se escolhêssemos $u=e^x$ e $dv=x\,dx$ em $\int xe^x\,dx$, cairíamos em $\int \frac{x^2}{2}e^x\,dx$, que é pior.`),
            mcqS(t`Em $\int x\cos x\,dx$, pela LIATE, quem é $u$?`, t`$u=x$`, [t`$u=\cos x$`, t`$u=x\cos x$`, t`$u=\operatorname{sen}x$`, t`$u=1$`], t`$x$ é Algébrica (A), que vem antes de Trigonométrica (T).`),
            mcqS(t`Calcule $\int x\cos x\,dx$.`, t`$x\operatorname{sen}x+\cos x+C$`, [t`$x\operatorname{sen}x-\cos x+C$`, t`$\frac{x^2}{2}\operatorname{sen}x+C$`, t`$-x\operatorname{sen}x+C$`, t`$x\cos x-\operatorname{sen}x+C$`], t`$u=x$, $v=\operatorname{sen}x$: $x\operatorname{sen}x-\int\operatorname{sen}x\,dx=x\operatorname{sen}x+\cos x+C$.`),
            mcqS(t`Calcule $\int x\operatorname{sen}x\,dx$.`, t`$-x\cos x+\operatorname{sen}x+C$`, [t`$x\cos x-\operatorname{sen}x+C$`, t`$-x\cos x-\operatorname{sen}x+C$`, t`$\frac{x^2}{2}\cos x+C$`, t`$x\operatorname{sen}x+\cos x+C$`], t`$u=x$, $dv=\operatorname{sen}x\,dx\implies v=-\cos x$: $-x\cos x-\int(-\cos x)\,dx=-x\cos x+\operatorname{sen}x+C$.`),
            gen((rng) => {
              const k = randInt(rng, 2, 5);
              return rmcq(
                rng,
                t`Calcule $\int x\,e^{${k}x}\,dx$.`,
                t`$\frac{x}{${k}}e^{${k}x}-\frac{1}{${k * k}}e^{${k}x}+C$`,
                [
                  t`$\frac{x}{${k}}e^{${k}x}+\frac{1}{${k * k}}e^{${k}x}+C$`,
                  t`$xe^{${k}x}-\frac{1}{${k}}e^{${k}x}+C$`,
                  t`$\frac{x^2}{2}e^{${k}x}+C$`,
                  t`$\frac{x}{${k}}e^{${k}x}-\frac{1}{${k}}e^{${k}x}+C$`,
                ],
                t`$u=x$, $dv=e^{${k}x}dx\implies v=\frac{e^{${k}x}}{${k}}\implies \frac{x}{${k}}e^{${k}x}-\int\frac{e^{${k}x}}{${k}}dx$.`,
              );
            }),
            gen((rng) => {
              const k = randInt(rng, 2, 5);
              return rmcq(
                rng,
                t`Calcule $\int x\cos(${k}x)\,dx$.`,
                t`$\frac{x}{${k}}\operatorname{sen}(${k}x)+\frac{1}{${k * k}}\cos(${k}x)+C$`,
                [
                  t`$\frac{x}{${k}}\operatorname{sen}(${k}x)-\frac{1}{${k * k}}\cos(${k}x)+C$`,
                  t`$x\operatorname{sen}(${k}x)+\cos(${k}x)+C$`,
                  t`$\frac{x}{${k}}\operatorname{sen}(${k}x)+\frac{1}{${k}}\cos(${k}x)+C$`,
                  t`$-\frac{x}{${k}}\operatorname{sen}(${k}x)+\frac{1}{${k * k}}\cos(${k}x)+C$`,
                ],
                t`$u=x$, $v=\frac{\operatorname{sen}(${k}x)}{${k}}\implies \frac{x}{${k}}\operatorname{sen}(${k}x)-\int\frac{\operatorname{sen}(${k}x)}{${k}}dx$.`,
              );
            }),
          ],
        },
        {
          card: {
            title: 'Logaritmos e inversas (dv = dx)',
            body: t`Para integrar $\ln x$, $\operatorname{arctg}x$ ou $\operatorname{arcsen}x$ sozinhos, fazemos $u$ igual à própria função e $dv=1\,dx$ ($v=x$).

Com $x^n\ln x$, pela LIATE o **logaritmo** vem primeiro: $u=\ln x$ e $dv=x^n\,dx$.`,
            example: t`$\int\ln x\,dx$: $u=\ln x$ ($du=\frac{dx}{x}$), $dv=dx$ ($v=x$) ⟹ $x\ln x-\int x\cdot\frac1x\,dx=x\ln x-x+C$.`,
            tip: t`Derivar $\ln x$ troca o logaritmo por $\frac1x$, que simplifica com a potência de $x$!`,
          },
          exercises: [
            mcqS(t`Para calcular $\int\ln x\,dx$ por partes, escolhemos:`, t`$u=\ln x$ e $dv=dx$`, [t`$u=x$ e $dv=\ln x\,dx$`, t`$u=\frac1x$ e $dv=dx$`, t`$u=1$ e $dv=\ln x\,dx$`, t`$u=\ln x$ e $dv=\frac1x\,dx$`], t`Sabemos derivar $\ln x$ e integrar $dv=1\,dx$.`),
            mcqS(t`Calcule $\int\ln x\,dx$.`, t`$x\ln x-x+C$`, [t`$\frac1x+C$`, t`$x\ln x+C$`, t`$\frac{(\ln x)^2}{2}+C$`, t`$x\ln x+x+C$`], t`$u=\ln x$, $dv=dx$: $x\ln x-\int x\cdot\frac1x dx=x\ln x-x+C$.`),
            mcqS(
              t`Calcule $\int x\ln x\,dx$.`,
              t`$\frac{x^2}{2}\ln x-\frac{x^2}{4}+C$`,
              [t`$\frac{x^2}{2}\ln x-\frac{x^2}{2}+C$`, t`$x^2\ln x-x^2+C$`, t`$\frac{(\ln x)^2}{2}+C$`, t`$\frac{x^2}{2}\ln x+\frac{x^2}{4}+C$`],
              t`$u=\ln x$, $dv=x\,dx$ ($v=\frac{x^2}{2}$): $\frac{x^2}{2}\ln x-\int\frac{x^2}{2}\cdot\frac1x\,dx=\frac{x^2}{2}\ln x-\frac{x^2}{4}+C$.`,
            ),
            gen((rng) => {
              const n = randInt(rng, 2, 4);
              const m = n + 1;
              return rmcq(
                rng,
                t`Calcule $\int x^{${n}}\ln x\,dx$.`,
                t`$\frac{x^{${m}}}{${m}}\ln x-\frac{x^{${m}}}{${m * m}}+C$`,
                [
                  t`$\frac{x^{${m}}}{${m}}\ln x-\frac{x^{${m}}}{${m}}+C$`,
                  t`$\frac{x^{${m}}}{${m}}\ln x+\frac{x^{${m}}}{${m * m}}+C$`,
                  t`$x^{${n}}\ln x-x^{${n}}+C$`,
                  t`$\frac{x^{${n}}}{${m}}\ln x+C$`,
                ],
                t`$u=\ln x$, $v=\frac{x^{${m}}}{${m}}\implies \frac{x^{${m}}}{${m}}\ln x-\int\frac{x^{${n}}}{${m}}\,dx=\frac{x^{${m}}}{${m}}\ln x-\frac{x^{${m}}}{${m * m}}+C$.`,
              );
            }),
            order(
              t`Ordene o cálculo de $\int\operatorname{arctg}x\,dx$:`,
              [
                t`Escolher $u=\operatorname{arctg}x$ e $dv=dx$`,
                t`Obter $du=\frac{1}{1+x^2}\,dx$ e $v=x$`,
                t`Montar $x\operatorname{arctg}x-\int\frac{x}{1+x^2}\,dx$`,
                t`Integrar a fração com $w=1+x^2$: $x\operatorname{arctg}x-\frac12\ln(1+x^2)+C$`,
              ],
              t`Por partes transforma $\operatorname{arctg}x$ numa fração racional integrável por substituição.`,
            ),
            gen((rng) => {
              const y1 = randInt(rng, 1, 8);
              return num(
                t`Se $F(x)=x\ln x-x+C$ é a primitiva de $\ln x$ que satisfaz $F(1)=${y1}$, quanto vale $C$?`,
                y1 + 1,
                t`$F(1)=1\cdot\ln 1-1+C=-1+C=${y1}\implies C=${y1 + 1}$.`,
              );
            }),
            mcqS(
              t`Qual método resolve mais diretamente $\int\frac{\ln x}{x}\,dx$ e $\int x\ln x\,dx$, respectivamente?`,
              t`substituição ($u=\ln x$) e integração por partes`,
              [t`integração por partes nas duas`, t`substituição nas duas`, t`por partes na primeira e substituição na segunda`],
              t`Em $\frac{\ln x}{x}$, $\frac{dx}{x}$ é o $du$ de $\ln x$; já em $x\ln x$, usamos partes com $u=\ln x$ e $dv=x\,dx$.`,
            ),
            mcqS(
              t`Calcule $\int\operatorname{arcsen}x\,dx$.`,
              t`$x\operatorname{arcsen}x+\sqrt{1-x^2}+C$`,
              [t`$x\operatorname{arcsen}x-\sqrt{1-x^2}+C$`, t`$\frac{1}{\sqrt{1-x^2}}+C$`, t`$-\cos x+C$`, t`$x\operatorname{arccos}x+C$`],
              t`$u=\operatorname{arcsen}x$, $v=x\implies x\operatorname{arcsen}x-\int\frac{x}{\sqrt{1-x^2}}dx=x\operatorname{arcsen}x+\sqrt{1-x^2}+C$.`,
            ),
          ],
        },
        {
          card: {
            title: 'Repetida, tabular e cíclica',
            body: t`Para $\int x^2 e^x\,dx$, aplicamos partes **duas vezes** (ou o método tabular, alternando sinais $+,\,-,\,+$ nas derivadas de $x^2$).

Em $I=\int e^x\operatorname{sen}x\,dx$, após duas integrações por partes a própria integral $I$ reaparece com sinal negativo do lado direito; basta isolá-la algebricamente!`,
            example: t`$\int x^2e^x\,dx=(x^2-2x+2)e^x+C$ e $\int e^x\operatorname{sen}x\,dx=\frac12 e^x(\operatorname{sen}x-\cos x)+C$.`,
            tip: t`Nas integrais cíclicas, mantenha a mesma família para $u$ nas duas passadas (se começou com $u=e^x$, use $u=e^x$ na segunda também).`,
          },
          exercises: [
            mcq(t`Para calcular $\int x^2 e^x\,dx$, quantas vezes aplicamos integração por partes?`, ['2 vezes', '1 vez', '3 vezes', 'infinitas vezes'], 0, t`Cada aplicação reduz o grau de $x^2$ em 1 unidade ($x^2\to 2x\to 2$).`),
            mcqS(
              t`Calcule $\int x^2 e^x\,dx$.`,
              t`$(x^2-2x+2)e^x+C$`,
              [t`$(x^2+2x+2)e^x+C$`, t`$x^2e^x-2xe^x+C$`, t`$\frac{x^3}{3}e^x+C$`, t`$(x^2-2x)e^x+C$`],
              t`Pelo método tabular: $(+x^2 - 2x + 2)e^x + C$.`,
            ),
            gen((rng) => {
              const a = randInt(rng, 2, 6);
              return rmcq(
                rng,
                t`Calcule $\int ${a}x^2 e^x\,dx$.`,
                t`$${a}(x^2-2x+2)e^x+C$`,
                [
                  t`$${a}(x^2+2x+2)e^x+C$`,
                  t`$${a}(x^2-x+1)e^x+C$`,
                  t`$${a}x^2 e^x-2xe^x+C$`,
                  t`$\frac{${a}}{3}x^3 e^x+C$`,
                ],
                t`$${a}\int x^2e^x\,dx=${a}(x^2-2x+2)e^x+C$.`,
              );
            }),
            mcqS(
              t`Calcule $\int x^2\cos x\,dx$.`,
              t`$x^2\operatorname{sen}x+2x\cos x-2\operatorname{sen}x+C$`,
              [t`$x^2\operatorname{sen}x-2x\cos x+2\operatorname{sen}x+C$`, t`$2x\operatorname{sen}x+C$`, t`$x^2\operatorname{sen}x+2\cos x+C$`, t`$-x^2\operatorname{sen}x+2x\cos x+C$`],
              t`$x^2\operatorname{sen}x-\int 2x\operatorname{sen}x\,dx = x^2\operatorname{sen}x - (-2x\cos x + 2\operatorname{sen}x)+C$.`,
            ),
            order(
              t`Ordene a resolução da integral cíclica $I=\int e^x\operatorname{sen}x\,dx$:`,
              [
                t`1ª partes ($u=\operatorname{sen}x$, $dv=e^x dx$): $I=e^x\operatorname{sen}x-\int e^x\cos x\,dx$`,
                t`2ª partes ($u=\cos x$, $dv=e^x dx$): $I=e^x\operatorname{sen}x-e^x\cos x-\int e^x\operatorname{sen}x\,dx$`,
                t`Reconhecer $I$ no lado direito: $I=e^x(\operatorname{sen}x-\cos x)-I$`,
                t`Somar $I$ dos dois lados e dividir por 2: $I=\frac12 e^x(\operatorname{sen}x-\cos x)+C$`,
              ],
              t`Depois de duas aplicações de partes, a integral original reaparece com sinal oposto.`,
            ),
            mcqS(
              t`Se após duas integrações por partes em $I=\int e^x\cos x\,dx$ obtemos $I=e^x\operatorname{sen}x+e^x\cos x-I$, quanto vale $I$?`,
              t`$\frac12 e^x(\operatorname{sen}x+\cos x)+C$`,
              [t`$e^x(\operatorname{sen}x+\cos x)+C$`, t`$0$`, t`$2e^x(\operatorname{sen}x+\cos x)+C$`, t`$\frac12 e^x(\operatorname{sen}x-\cos x)+C$`],
              t`$2I=e^x(\operatorname{sen}x+\cos x)\implies I=\frac12 e^x(\operatorname{sen}x+\cos x)+C$.`,
            ),
            gen((rng) => {
              const a = randInt(rng, 2, 5);
              return num(
                t`Ao integrar $I=\int e^{${a}x}\operatorname{sen}x\,dx$ duas vezes por partes, chegamos a $I = \text{termos} - \frac{1}{${a * a}}I$, ou seja, $\frac{k}{${a * a}}I=\text{termos}$. Quanto vale $k$?`,
                a * a + 1,
                t`$I+\frac{1}{${a * a}}I=\left(1+\frac{1}{${a * a}}\right)I=\frac{${a * a + 1}}{${a * a}}I\implies k=${a * a + 1}$.`,
              );
            }),
            mcqS(
              t`Calcule $\int (\ln x)^2\,dx$ (dica: use $u=(\ln x)^2$ e o resultado já conhecido de $\int\ln x\,dx$).`,
              t`$x(\ln x)^2-2x\ln x+2x+C$`,
              [t`$x(\ln x)^2-2\ln x+C$`, t`$\frac{(\ln x)^3}{3}+C$`, t`$2x\ln x-2x+C$`, t`$x(\ln x)^2+2x\ln x-2x+C$`],
              t`$x(\ln x)^2-\int x\cdot\frac{2\ln x}{x}dx = x(\ln x)^2-2(x\ln x-x)+C$.`,
            ),
          ],
        },
      ],
    },
  ],
};

export const integralDefinida: UnitDef = {
  id: 'c-def',
  title: 'Integral definida',
  subtitle: 'Somas de Riemann, TFC, áreas e valor médio',
  icon: '🟪',
  source: 'Cálculo I · Unidades 4 e 5 — Integral definida e aplicações',
  guide: t`A integral definida $\int_a^b f(x)\,dx$ é o **limite das somas de Riemann** e mede a área **com sinal** entre o gráfico e o eixo $x$. O Teorema Fundamental do Cálculo conecta derivada e integral e transforma esse limite em $F(b)-F(a)$.`,
  lessons: [
    {
      id: 'c-def-riem',
      title: 'Somas de Riemann',
      parts: [
        {
          card: {
            title: 'Fatiar e somar',
            body: t`Divida $[a,\,b]$ em $n$ subintervalos de largura $\Delta x=\frac{b-a}{n}$ e some as áreas dos retângulos $f(x_i^*)\,\Delta x$ (usando a extremidade esquerda, direita ou o ponto médio). Aumente $n$:`,
            visual: riemannLab((x) => 0.3 * x * x + 0.6, 0, 3, 4.5, { xMin: -0.2, xMax: 3.2, yMin: -0.2, yMax: 3.6 }),
            formula: t`\int_a^b f(x)\,dx=\lim_{n\to\infty}\sum_{i=1}^n f(x_i^*)\,\Delta x`,
            tip: t`Se $f$ é crescente, a soma pela esquerda fica **abaixo** da área exata e a soma pela direita fica **acima**.`,
          },
          exercises: [
            inter(t`Aumente $n$ até o erro ficar menor que $0{,}001$.`, 'plot', riemannLab((x) => 0.3 * x * x + 0.6, 0, 3, 4.5, { xMin: -0.2, xMax: 3.2, yMin: -0.2, yMax: 3.6 }).props, (v: any) => v && v.p.n >= 26, t`$n\ge26$ (com ponto médio)`, t`Quanto maior $n$, mais estreitos ficam os retângulos e menor o erro.`),
            mcq(
              t`Aumentar o número de retângulos numa soma de Riemann…`,
              ['em geral diminui o erro', 'sempre aumenta a soma', 'não muda nada', 'só funciona para retas'],
              0,
              t`Quando $n\to\infty$, $\Delta x\to 0$ e a soma converge para a integral exata.`,
            ),
            gen((rng) => {
              const a = randInt(rng, 0, 3);
              const n = randInt(rng, 2, 6);
              const dx = randInt(rng, 1, 3);
              const b = a + n * dx;
              return num(
                t`Dividindo o intervalo $[${a},\,${b}]$ em $n=${n}$ subintervalos iguais, qual é a largura $\Delta x$ de cada retângulo?`,
                dx,
                t`$\Delta x=\frac{b-a}{n}=\frac{${b}-${a}}{${n}}=${dx}$.`,
              );
            }),
            num(t`Aproxime $\int_0^2x^2dx$ com 2 retângulos de ponto médio (pontos $0{,}5$ e $1{,}5$).`, 2.5, t`$\Delta x=1$: $(0{,}25+2{,}25)\cdot1=2{,}5$ (exato: $\frac83\approx2{,}667$).`),
            num(t`Aproxime $\int_0^3 x^2\,dx$ com $n=3$ retângulos pela **esquerda** (alturas em $x=0,\,1,\,2$).`, 5, t`$\Delta x=1$: $(0^2+1^2+2^2)\cdot 1=0+1+4=5$.`),
            num(t`Aproxime $\int_0^3 x^2\,dx$ com $n=3$ retângulos pela **direita** (alturas em $x=1,\,2,\,3$).`, 14, t`$\Delta x=1$: $(1^2+2^2+3^2)\cdot 1=1+4+9=14$.`),
            gen((rng) => {
              const m = randInt(rng, 1, 4);
              const c = randInt(rng, 1, 5);
              return num(
                t`Aproxime $\int_0^2 (${m === 1 ? '' : m}x+${c})\,dx$ com $n=2$ retângulos pela **esquerda** (alturas em $x=0$ e $x=1$).`,
                m + 2 * c,
                t`$\Delta x=1$: $f(0)\cdot 1 + f(1)\cdot 1 = ${c} + (${m + c}) = ${m + 2 * c}$.`,
              );
            }),
            mcq(
              t`Se $f(x)$ é estritamente **crescente** em $[a,\,b]$, qual relação vale entre a soma pela esquerda $S_E$, a integral exata $I$ e a soma pela direita $S_D$?`,
              ['$S_E < I < S_D$', '$S_D < I < S_E$', '$S_E = I = S_D$', '$I < S_E < S_D$'],
              0,
              t`Em cada fatia, o menor valor está na esquerda e o maior está na direita.`,
            ),
          ],
        },
        {
          card: {
            title: 'Área com sinal e simetria',
            body: t`A integral definida mede a **área com sinal**: regiões acima do eixo $x$ contam **positivo** e regiões abaixo contam **negativo**.

Mova $b$ em $f(x)=x-1$ e veja como a área positiva compensa a negativa:`,
            visual: signedAreaLab(),
            example: t`Se $f$ é **ímpar** ($f(-x)=-f(x)$), então $\int_{-a}^a f(x)\,dx=0$. Se $f$ é **par** ($f(-x)=f(x)$), então $\int_{-a}^a f(x)\,dx=2\int_0^a f(x)\,dx$.`,
          },
          exercises: [
            tf(t`Se $f$ é negativa em $[a,\,b]$, a integral definida $\int_a^b f(x)\,dx$ é negativa.`, true, t`A integral é área **com sinal**: abaixo do eixo conta negativo.`),
            inter(t`No gráfico de $f(x)=x-1$, ajuste $b$ para que a integral líquida $\int_0^b (x-1)\,dx$ seja igual a zero.`, 'plot', signedAreaLab().props, (v: any) => v && near(v.p.b, 2, 0.05), t`$b=2$`, t`De $0$ a $1$ o triângulo tem área $-0{,}5$; de $1$ a $2$ tem área $+0{,}5$, somando zero.`),
            gen((rng) => {
              const b = randInt(rng, 2, 6);
              const k = randInt(rng, 2, 7);
              return num(
                t`Interpretando como a área de um retângulo, quanto vale $\int_0^{${b}} ${k}\,dx$?`,
                b * k,
                t`Retângulo de base $${b}$ e altura $${k}$: área $=${b * k}$.`,
              );
            }),
            gen((rng) => {
              const b = randInt(rng, 2, 6);
              const m = randInt(rng, 1, 4);
              return num(
                t`Interpretando como a área de um triângulo, quanto vale $\int_0^{${b}} ${m === 1 ? '' : m}x\,dx$?`,
                0.5 * m * b * b,
                t`Triângulo de base $${b}$ e altura $${m * b}$: $\frac{${b}\cdot ${m * b}}{2}=${fmt(0.5 * m * b * b)}$.`,
              );
            }),
            mcqS(
              t`O gráfico de $y=\sqrt{9-x^2}$ em $[-3,\,3]$ é a metade superior de um círculo de raio $3$. Quanto vale $\int_{-3}^3\sqrt{9-x^2}\,dx$?`,
              t`$\frac{9\pi}{2}$`,
              [t`$9\pi$`, t`$3\pi$`, t`$0$`, t`$6\pi$`],
              t`Metade da área do círculo de raio $r=3$: $\frac12\pi r^2=\frac{9\pi}{2}$.`,
            ),
            num(
              t`Se de $x=0$ a $x=2$ a região sob $f$ está acima do eixo com área $7$, e de $x=2$ a $x=5$ está **abaixo** do eixo com área $4$, quanto vale $\int_0^5 f(x)\,dx$?`,
              3,
              t`Acima conta positivo e abaixo conta negativo: $7-4=3$.`,
            ),
            mcq(
              t`Por que $\int_{-5}^{5} x^3\cos x\,dx = 0$ sem precisar achar a primitiva?`,
              ['porque o integrando é ímpar e o intervalo $[-5,\,5]$ é simétrico', 'porque $\\cos x$ é zero', 'porque $x^3$ é par', 'porque os limites são iguais'],
              0,
              t`Ímpar $\times$ par $=$ ímpar; em $[-a,\,a]$ as metades esquerda e direita se cancelam.`,
            ),
            gen((rng) => {
              const a = randInt(rng, 2, 6);
              const val = randInt(rng, 3, 12);
              return num(
                t`Sabendo que $f(x)$ é uma função **par** e $\int_0^{${a}} f(x)\,dx = ${val}$, quanto vale $\int_{-${a}}^{${a}} f(x)\,dx$?`,
                2 * val,
                t`Para função par, os dois lados são iguais: $2\int_0^{${a}} f(x)\,dx = 2\cdot ${val}=${2 * val}$.`,
              );
            }),
          ],
        },
        {
          card: {
            title: 'Propriedades dos limites de integração',
            body: t`$$\int_a^a f(x)\,dx=0\qquad\int_b^a f(x)\,dx=-\int_a^b f(x)\,dx$$
$$\int_a^c f(x)\,dx+\int_c^b f(x)\,dx=\int_a^b f(x)\,dx$$`,
            example: t`Se $\int_0^6 f=15$ e $\int_0^2 f=4$, então $\int_2^6 f=15-4=11$ e $\int_6^2 f=-11$.`,
            tip: t`Inverter os limites de integração troca o sinal de $\Delta x$, logo troca o sinal da integral.`,
          },
          exercises: [
            num(t`Quanto vale $\int_4^4 (x^3+\cos x+e^x)\,dx$?`, 0, t`Com limites inferior e superior iguais, a largura do intervalo é zero.`),
            gen((rng) => {
              const A = randNZ(rng, -9, 12);
              return num(
                t`Se $\int_1^5 f(x)\,dx = ${A}$, quanto vale $\int_5^1 f(x)\,dx$?`,
                -A,
                t`Inverter os limites troca o sinal: $-\int_1^5 f(x)\,dx = ${-A}$.`,
              );
            }),
            gen((rng) => {
              const A = randInt(rng, -4, 9);
              const B = randInt(rng, -4, 9);
              return num(
                t`Se $\int_0^3 f(x)\,dx = ${A}$ e $\int_3^7 f(x)\,dx = ${B}$, quanto vale $\int_0^7 f(x)\,dx$?`,
                A + B,
                t`Pela aditividade: $\int_0^3 f + \int_3^7 f = ${A}+(${B})=${A + B}$.`,
              );
            }),
            gen((rng) => {
              const A = randInt(rng, 2, 7);
              const B = randInt(rng, -4, 6);
              const k = randInt(rng, 2, 4);
              return num(
                t`Se $\int_1^4 f(x)\,dx=${A}$ e $\int_1^4 g(x)\,dx=${B}$, calcule $\int_1^4\big(${k}f(x)-g(x)\big)\,dx$.`,
                k * A - B,
                t`$${k}\int_1^4 f - \int_1^4 g = ${k}\cdot ${A}-(${B})=${k * A - B}$.`,
              );
            }),
            num(
              t`Sabendo que $\int_0^6 f(x)\,dx=15$ e $\int_0^2 f(x)\,dx=4$, quanto vale $\int_2^6 f(x)\,dx$?`,
              11,
              t`$\int_2^6 f = \int_0^6 f - \int_0^2 f = 15-4=11$.`,
            ),
            num(
              t`Se $\int_1^3 f(x)\,dx=5$, quanto vale $\int_1^3 \big(f(x)+4\big)\,dx$?`,
              13,
              t`$\int_1^3 f(x)\,dx + \int_1^3 4\,dx = 5 + 4\cdot(3-1) = 13$.`,
            ),
            match(
              t`Supondo $\int_a^b f(x)\,dx = I$, ligue cada expressão ao seu valor:`,
              [
                [t`$\int_a^a f(x)\,dx$`, t`$0$`],
                [t`$\int_b^a f(x)\,dx$`, t`$-I$`],
                [t`$\int_a^b 3f(x)\,dx$`, t`$3I$`],
                [t`$\int_a^c f(x)\,dx+\int_c^b f(x)\,dx$`, t`$I$`],
              ],
              t`Propriedades fundamentais da integral definida.`,
            ),
            mcq(
              t`Qual limite de soma de Riemann representa $\int_0^2 x^3\,dx$ (usando $\Delta x=\frac{2}{n}$ e $x_i=\frac{2i}{n}$)?`,
              [
                t`$\lim_{n\to\infty}\sum_{i=1}^n \left(\frac{2i}{n}\right)^3\frac{2}{n}$`,
                t`$\lim_{n\to\infty}\sum_{i=1}^n i^3$`,
                t`$\lim_{n\to\infty}\sum_{i=1}^n \frac{2i}{n}$`,
                t`$\sum_{i=1}^2 x^3$`,
              ],
              0,
              t`$f(x_i)\,\Delta x = \left(\frac{2i}{n}\right)^3\cdot\frac{2}{n}$.`,
            ),
          ],
        },
      ],
    },
    {
      id: 'c-def-tfc',
      title: 'Teorema Fundamental do Cálculo',
      parts: [
        {
          card: {
            title: 'F(b) − F(a)',
            body: t`Se $F'=f$, a Parte 2 do TFC (regra de Barrow) transforma a integral definida na variação da primitiva:
$$\int_a^b f(x)\,dx=\big[F(x)\big]_a^b=F(b)-F(a)$$

Arraste o limite superior $b$ e veja a área acumulada sob $y=x^2$:`,
            visual: areaLab((x) => x * x, (x) => (x * x * x) / 3, 0, 2, { xMin: -0.3, xMax: 3.2, yMin: -0.5, yMax: 9.5 }),
            example: t`$\int_1^3(2x+1)\,dx=[x^2+x]_1^3=12-2=10$.`,
            tip: t`Não precisa do $+C$ na integral definida: ele cancela em $F(b)-F(a)$.`,
          },
          exercises: [
            inter(t`Arraste $b$ até a área acumulada sob $y=x^2$ (desde 0) valer $9$.`, 'plot', areaLab((x) => x * x, (x) => (x * x * x) / 3, 0, 1, { xMin: -0.3, xMax: 3.2, yMin: -0.5, yMax: 9.5 }).props, (v: any) => v && near(v.p.b, 3, 0.03), t`$b=3$, pois $\frac{3^3}{3}=9$`, t`$\int_0^b x^2\,dx=\frac{b^3}{3}=9\implies b=3$.`),
            gen((rng) => {
              const b = randInt(rng, 1, 4);
              return num(t`Calcule $\int_0^{${b}}3x^2\,dx$.`, b ** 3, t`$[x^3]_0^{${b}}=${b ** 3}$.`);
            }),
            gen((rng) => {
              const a = randInt(rng, 0, 2);
              const b = a + randInt(rng, 1, 3);
              const m = 2 * randNZ(rng, -2, 3);
              const k = randInt(rng, -3, 3);
              const val = (m / 2) * (b * b - a * a) + k * (b - a);
              return num(t`Calcule $\int_{${a}}^{${b}}(${term(m, 'x', true)}${term(k, '')})\,dx$.`, val, t`$\left[${term(m / 2, 'x^2', true)}${term(k, 'x')}\right]_{${a}}^{${b}}=${fmt(val)}$.`);
            }),
            num(t`Calcule $\int_0^{\pi}\operatorname{sen}x\,dx$.`, 2, t`$[-\cos x]_0^\pi=-(-1)-(-1)=2$.`),
            num(t`Calcule $\int_1^{e}\frac{1}{x}\,dx$.`, 1, t`$[\ln x]_1^e=1-0=1$.`),
            mcqS(t`Calcule $\int_0^1 e^x\,dx$.`, t`$e-1$`, [t`$e$`, t`$1$`, t`$e+1$`, t`$0$`], t`$[e^x]_0^1=e^1-e^0=e-1$.`),
            num(t`Calcule $\int_0^{\pi/4}\sec^2 x\,dx$.`, 1, t`$[\operatorname{tg}x]_0^{\pi/4}=\operatorname{tg}\frac{\pi}{4}-\operatorname{tg}0=1-0=1$.`),
            gen((rng) => {
              const b = randInt(rng, 2, 6);
              return num(
                t`Calcule $\int_1^{${b * b}}\frac{1}{2\sqrt{x}}\,dx$.`,
                b - 1,
                t`$[\sqrt{x}]_1^{${b * b}}=\sqrt{${b * b}}-\sqrt{1}=${b}-1=${b - 1}$.`,
              );
            }),
          ],
        },
        {
          card: {
            title: 'TFC Parte 1: derivando a integral',
            body: t`A taxa de variação da área acumulada $A(x)=\int_a^x f(t)\,dt$ é a própria altura da curva em $x$:
$$\frac{d}{dx}\int_a^x f(t)\,dt=f(x)$$

Se o limite superior for uma função $g(x)$, combine com a **regra da cadeia**:
$$\frac{d}{dx}\int_a^{g(x)} f(t)\,dt=f(g(x))\cdot g'(x)$$`,
            example: t`$\frac{d}{dx}\int_0^x e^{-t^2}\,dt=e^{-x^2}$ e $\frac{d}{dx}\int_1^{x^3}\cos t\,dt=3x^2\cos(x^3)$.`,
            tip: t`Não tente resolver a integral antes de derivar: o TFC dá a derivada instantaneamente!`,
          },
          exercises: [
            mcqS(
              t`Pela Parte 1 do TFC, quanto vale $\dfrac{d}{dx}\int_0^x \sqrt{1+t^3}\,dt$?`,
              t`$\sqrt{1+x^3}$`,
              [t`$\frac{3x^2}{2\sqrt{1+x^3}}$`, t`$\frac25(1+x^3)^{5/2}$`, t`$0$`, t`$\sqrt{1+x^3}-1$`],
              t`A derivada de $\int_0^x f(t)\,dt$ em relação a $x$ é simplesmente $f(x)$.`,
            ),
            tf(t`O resultado de $\dfrac{d}{dx}\int_2^x \cos(t^2)\,dt$ depende do limite inferior $2$.`, false, t`Como $F(x)-F(2)$ tem $F(2)$ constante, sua derivada é $F'(x)-0=\cos(x^2)$ para qualquer limite inferior constante.`),
            gen((rng) => {
              const c = randInt(rng, 1, 6);
              const x0 = randInt(rng, 1, 4);
              return num(
                t`Se $F(x)=\int_0^x (t^2+${c})\,dt$, quanto vale $F'(${x0})$?`,
                x0 * x0 + c,
                t`Pelo TFC, $F'(x)=x^2+${c}\implies F'(${x0})=${x0}^2+${c}=${x0 * x0 + c}$.`,
              );
            }),
            mcqS(
              t`Calcule $\dfrac{d}{dx}\int_1^{x^2}\operatorname{sen}t\,dt$.`,
              t`$2x\operatorname{sen}(x^2)$`,
              [t`$\operatorname{sen}(x^2)$`, t`$-\cos(x^2)$`, t`$2x\cos(x^2)$`, t`$\operatorname{sen}(2x)$`],
              t`Substitua $t=x^2$ e multiplique pela derivada de $x^2$: $\operatorname{sen}(x^2)\cdot 2x$.`,
            ),
            gen((rng) => {
              const k = randInt(rng, 2, 5);
              return rmcq(
                rng,
                t`Calcule $\dfrac{d}{dx}\int_0^{${k}x} e^{t^2}\,dt$.`,
                t`$${k}e^{${k * k}x^2}$`,
                [t`$e^{${k * k}x^2}$`, t`$2${k}x\,e^{${k * k}x^2}$`, t`$${k}e^{x^2}$`, t`$\frac{1}{${k}}e^{${k * k}x^2}$`],
                t`$f(${k}x)\cdot(${k}x)' = e^{(${k}x)^2}\cdot ${k} = ${k}e^{${k * k}x^2}$.`,
              );
            }),
            mcqS(
              t`Quanto vale $\dfrac{d}{dx}\int_x^5 \ln t\,dt$ (note que o $x$ está no limite inferior)?`,
              t`$-\ln x$`,
              [t`$\ln x$`, t`$\frac1x$`, t`$\ln 5-\ln x$`, t`$-\frac1x$`],
              t`Inverta os limites: $\frac{d}{dx}\left(-\int_5^x \ln t\,dt\right)=-\ln x$.`,
            ),
            num(
              t`Se $G(x)=\int_1^{2x}\sqrt{t+2}\,dt$, quanto vale $G'(1)$?`,
              4,
              t`$G'(x)=\sqrt{2x+2}\cdot 2\implies G'(1)=2\sqrt{4}=4$.`,
            ),
            mcqS(
              t`Em qual valor de $x$ a função $F(x)=\int_0^x (t-3)e^t\,dt$ tem um ponto crítico ($F'(x)=0$)?`,
              t`$x=3$`,
              [t`$x=0$`, t`$x=-3$`, t`$x=1$`, t`não tem ponto crítico`],
              t`$F'(x)=(x-3)e^x=0\iff x=3$, já que $e^x>0$ sempre.`,
            ),
          ],
        },
        {
          card: {
            title: 'Trocando os limites na substituição',
            body: t`Na integral definida por substituição $u=g(x)$, troque também os limites de integração para $u(a)=g(a)$ e $u(b)=g(b)$:
$$\int_a^b f(g(x))\,g'(x)\,dx=\int_{g(a)}^{g(b)} f(u)\,du$$

Assim você calcula tudo em $u$ e não precisa voltar para $x$!`,
            example: t`$\int_0^1 2x(x^2+1)^2\,dx$: com $u=x^2+1$, $u(0)=1$ e $u(1)=2$ ⟹ $\int_1^2 u^2\,du=\left[\frac{u^3}{3}\right]_1^2=\frac73$.`,
            tip: t`Na integração por partes definida, aplique os limites nos dois termos: $\int_a^b u\,dv=[uv]_a^b-\int_a^b v\,du$.`,
          },
          exercises: [
            mcq(
              t`Ao fazer a substituição $u=x^2+1$ em $\int_0^2 2x\cos(x^2+1)\,dx$, os novos limites para $u$ são:`,
              ['de $u=1$ até $u=5$', 'de $u=0$ até $u=2$', 'de $u=0$ até $u=4$', 'de $u=1$ até $u=3$'],
              0,
              t`Em $x=0$, $u=0^2+1=1$; em $x=2$, $u=2^2+1=5$.`,
            ),
            num(t`Calcule $\int_0^1 2x(x^2+1)^2\,dx$.`, 7 / 3, t`$u=x^2+1$ vai de $1$ a $2$: $\int_1^2 u^2\,du=\frac{8-1}{3}=\frac73\approx 2{,}333$.`, { tol: 0.01 }),
            gen((rng) => {
              const c = randInt(rng, 1, 6);
              return num(
                t`Calcule $\int_0^1 2x(x^2+${c})\,dx$.`,
                c + 0.5,
                t`$u=x^2+${c}$ vai de $${c}$ a $${c + 1}$: $\left[\frac{u^2}{2}\right]_{${c}}^{${c + 1}}=\frac{${(c + 1) ** 2}-${c * c}}{2}=${fmt(c + 0.5)}$.`,
              );
            }),
            num(t`Calcule $\int_0^{\sqrt{\pi}} 2x\operatorname{sen}(x^2)\,dx$.`, 2, t`$u=x^2$ vai de $0$ a $\pi$: $\int_0^\pi\operatorname{sen}u\,du=[-\cos u]_0^\pi=2$.`),
            num(t`Calcule $\int_1^e \frac{\ln x}{x}\,dx$.`, 0.5, t`$u=\ln x$ vai de $\ln 1=0$ a $\ln e=1$: $\int_0^1 u\,du=\left[\frac{u^2}{2}\right]_0^1=0{,}5$.`),
            num(t`Calcule $\int_0^1 x\,e^x\,dx$ por partes.`, 1, t`$[xe^x-e^x]_0^1=(e-e)-(0-1)=1$.`),
            num(t`Calcule $\int_1^e \ln x\,dx$.`, 1, t`$[x\ln x-x]_1^e=(e\cdot 1-e)-(1\cdot 0-1)=1$.`),
            gen((rng) => {
              const a = randInt(rng, 2, 5);
              const val = randInt(rng, 3, 10);
              return num(
                t`Sabendo que $\int_0^{${2 * a}} f(u)\,du = ${2 * val}$, quanto vale $\int_0^{${a}} f(2x)\,dx$?`,
                val,
                t`Com $u=2x$ ($dx=\frac{du}{2}$), os limites vão de $0$ a $${2 * a}$: $\frac12\int_0^{${2 * a}} f(u)\,du = \frac{${2 * val}}{2}=${val}$.`,
              );
            }),
          ],
        },
      ],
    },
    {
      id: 'c-def-area',
      title: 'Área entre curvas',
      parts: [
        {
          card: {
            title: 'Cima menos baixo',
            body: t`Se $f(x)\ge g(x)$ em $[a,\,b]$, a área da região entre as duas curvas é sempre a integral da **de cima menos a de baixo**:
$$A=\int_a^b\big(f(x)-g(x)\big)\,dx$$`,
            visual: betweenLab((x) => x, (x) => x * x, 0, 1, 1 / 6, { xMin: -0.3, xMax: 1.4, yMin: -0.2, yMax: 1.4 }),
            example: t`Entre $y=x$ e $y=x^2$ em $[0,\,1]$: $A=\int_0^1(x-x^2)\,dx=\frac12-\frac13=\frac16$.`,
            tip: t`A fórmula $\int_a^b (f-g)\,dx$ funciona mesmo quando uma ou ambas as curvas passam abaixo do eixo $x$, pois $f(x)-g(x)\ge 0$.`,
          },
          exercises: [
            mcq(
              t`Se $f(x)\ge g(x)$ em todo o intervalo $[a,\,b]$, a área entre os dois gráficos é dada por:`,
              [t`$\int_a^b\big(f(x)-g(x)\big)\,dx$`, t`$\int_a^b\big(g(x)-f(x)\big)\,dx$`, t`$\int_a^b f(x)\,dx\cdot\int_a^b g(x)\,dx$`, t`$f(b)-g(a)$`],
              0,
              t`A altura de cada fatia vertical entre as curvas é $f(x)-g(x)$.`,
            ),
            tf(t`Se $g(x)$ estiver abaixo do eixo $x$ e $f(x)$ acima, a fórmula $\int_a^b (f(x)-g(x))\,dx$ continua dando a área correta entre elas.`, true, t`Subtrair $g(x)$ (negativo) soma a distância abaixo do eixo à altura de $f(x)$.`),
            num(t`Calcule a área entre $y=x$ e $y=x^2$ no intervalo $[0,\,1]$.`, 1 / 6, t`$\int_0^1(x-x^2)\,dx=\frac12-\frac13=\frac16\approx 0{,}167$.`, { tol: 0.005 }),
            gen((rng) => {
              const k = randInt(rng, 2, 7);
              return num(
                t`Calcule a área entre a reta horizontal $y=${k}$ e a parábola $y=3x^2$ no intervalo $[0,\,1]$.`,
                k - 1,
                t`Em $[0,\,1]$, $${k}\ge 3x^2$: $\int_0^1(${k}-3x^2)\,dx=[${k}x-x^3]_0^1=${k}-1=${k - 1}$.`,
              );
            }),
            gen((rng) => {
              const c = randInt(rng, 2, 5);
              const b = randInt(rng, 2, 5);
              return num(
                t`Calcule a área entre as retas paralelas $f(x)=x+${c}$ e $g(x)=x$ de $x=0$ até $x=${b}$.`,
                c * b,
                t`$f(x)-g(x)=${c}\implies \int_0^{${b}} ${c}\,dx=${c * b}$.`,
              );
            }),
            num(
              t`Calcule a área entre $y=\sqrt{x}$ e $y=x^2$ em $[0,\,1]$.`,
              1 / 3,
              t`Em $[0,\,1]$, $\sqrt x\ge x^2$: $\int_0^1(\sqrt x-x^2)\,dx=\frac23-\frac13=\frac13\approx 0{,}333$.`,
              { tol: 0.005 },
            ),
            mcqS(
              t`Qual integral calcula a área entre $y=\cos x$ e $y=\operatorname{sen}x$ em $[0,\,\frac{\pi}{4}]$?`,
              t`$\int_0^{\pi/4}(\cos x-\operatorname{sen}x)\,dx$`,
              [t`$\int_0^{\pi/4}(\operatorname{sen}x-\cos x)\,dx$`, t`$\int_0^{\pi/4}\cos x\operatorname{sen}x\,dx$`, t`$\int_0^{\pi}(\cos x-\operatorname{sen}x)\,dx$`, t`$\int_0^{\pi/4}(\cos^2 x-\operatorname{sen}^2 x)\,dx$`],
              t`Em $[0,\,\frac{\pi}{4}]$, temos $\cos x\ge\operatorname{sen}x$.`,
            ),
            num(
              t`Calcule a área entre $y=\cos x$ e $y=\operatorname{sen}x$ em $[0,\,\frac{\pi}{4}]$ (arredonde com 2 casas decimais).`,
              Math.SQRT2 - 1,
              t`$[\operatorname{sen}x+\cos x]_0^{\pi/4}=\left(\frac{\sqrt2}{2}+\frac{\sqrt2}{2}\right)-(0+1)=\sqrt2-1\approx 0{,}414$.`,
              { tol: 0.01 },
            ),
          ],
        },
        {
          card: {
            title: 'Interseções e curvas que se cruzam',
            body: t`Quando os limites $a$ e $b$ não são dados, iguale $f(x)=g(x)$ para achar os **pontos de interseção**.

Ajuste a inclinação $m$ da reta $y=mx$ e veja como mudam as interseções e a área com $y=x^2$:`,
            visual: intersectAreaLab(),
            example: t`Entre $y=4-x^2$ e o eixo $x$ ($y=0$): $4-x^2=0\Rightarrow x=\pm2$. $A=\int_{-2}^2(4-x^2)\,dx=\frac{32}{3}$.`,
            tip: t`Se as curvas se cruzam no meio do intervalo, divida a integral no ponto de cruzamento para somar sempre $|f(x)-g(x)|$.`,
          },
          exercises: [
            mcq(
              t`Para calcular a área entre duas curvas quando os limites não são informados, o primeiro passo costuma ser…`,
              ['achar os pontos de interseção', 'derivar as duas funções', 'somar as funções', 'calcular a média'],
              0,
              t`Resolvemos $f(x)=g(x)$ para descobrir onde a região começa e termina.`,
            ),
            inter(t`Ajuste a inclinação $m$ da reta $y=mx$ para que a área fechada entre $y=mx$ e $y=x^2$ valha $4{,}5$.`, 'plot', intersectAreaLab().props, (v: any) => v && near(v.p.m, 3, 0.05), t`$m=3$`, t`A área é $\frac{m^3}{6}=4{,}5\implies m^3=27\implies m=3$.`),
            num(t`Calcule a área entre $y=4-x^2$ e o eixo $x$.`, 32 / 3, t`Raízes $\pm2$: $\int_{-2}^2(4-x^2)dx=16-\frac{16}{3}=\frac{32}{3}\approx10{,}667$.`, { tol: 0.01 }),
            num(t`Calcule a área entre $y=x^2$ e $y=2x$.`, 4 / 3, t`Cruzam em $0$ e $2$: $\int_0^2(2x-x^2)dx=4-\frac83=\frac43\approx 1{,}333$.`, { tol: 0.005 }),
            gen((rng) => {
              const m = randInt(rng, 2, 6);
              return num(
                t`A reta $y=${m}x$ e a parábola $y=x^2$ se cruzam em $x=0$ e em $x=b$ ($b>0$). Quanto vale $b$?`,
                m,
                t`$x^2=${m}x\implies x(x-${m})=0\implies b=${m}$.`,
              );
            }),
            gen((rng) => {
              const k = randInt(rng, 1, 3);
              const a = 3 * k;
              const ans = (2 * a ** 3) / 3;
              return num(
                t`Calcule a área entre $y=${a * a}-x^2$ e o eixo $x$ no primeiro quadrante ($0\le x\le ${a}$).`,
                ans,
                t`$\int_0^{${a}}(${a * a}-x^2)\,dx=${a ** 3}-\frac{${a ** 3}}{3}=${ans}$.`,
              );
            }),
            tf(t`$\int_{-1}^{1}x^3\,dx=0$, mas a área entre $y=x^3$ e o eixo nesse intervalo não é zero.`, true, t`As partes negativa e positiva se cancelam na integral; a área usa $|f|$: $\frac12$.`),
            num(
              t`Calcule a área geométrica total entre $y=x^3$ e o eixo $x$ no intervalo $[-1,\,1]$.`,
              0.5,
              t`Separando em $x=0$: $\int_{-1}^0(-x^3)\,dx+\int_0^1 x^3\,dx=\frac14+\frac14=0{,}5$.`,
            ),
          ],
        },
      ],
    },
    {
      id: 'c-def-media',
      title: 'Valor médio e aplicações',
      parts: [
        {
          card: {
            title: 'A altura média',
            body: t`$$\bar f=\frac{1}{b-a}\int_a^b f(x)\,dx$$
É a altura do retângulo de base $b-a$ que tem a **mesma área** da região sob $f$. Ajuste $h$ até as áreas serem iguais:`,
            visual: meanValueLab(),
            tip: t`Pelo Teorema do Valor Médio para Integrais, se $f$ é contínua em $[a,\,b]$, existe pelo menos um ponto $c\in[a,\,b]$ onde $f(c)=\bar f$.`,
          },
          exercises: [
            inter(t`Ajuste $h$ para que o retângulo tenha a mesma área da região sob $x^2$ em $[0,\,3]$.`, 'plot', meanValueLab().props, (v: any) => v && near(v.p.h, 3, 0.051), t`$h=3$ (valor médio)`, t`$\bar f=\frac{1}{3-0}\int_0^3 x^2\,dx=\frac{9}{3}=3$.`),
            num(t`Qual o valor médio de $f(x)=2x$ em $[0,\,4]$?`, 4, t`$\frac14\int_0^42x\,dx=\frac{16}{4}=4$.`),
            gen((rng) => {
              const b = randInt(rng, 2, 6);
              return num(
                t`Qual o valor médio de $f(x)=3x^2$ no intervalo $[0,\,${b}]$?`,
                b * b,
                t`$\bar f=\frac{1}{${b}}\int_0^{${b}} 3x^2\,dx=\frac{${b}^3}{${b}}=${b * b}$.`,
              );
            }),
            gen((rng) => {
              const a = randInt(rng, 0, 2);
              const len = randInt(rng, 2, 5);
              const b = a + len;
              const m = randInt(rng, 2, 8);
              return num(
                t`Sabendo que $\int_{${a}}^{${b}} f(x)\,dx = ${len * m}$, qual é o valor médio de $f$ em $[${a},\,${b}]$?`,
                m,
                t`$\bar f=\frac{1}{${b}-${a}}\int_{${a}}^{${b}} f(x)\,dx=\frac{${len * m}}{${len}}=${m}$.`,
              );
            }),
            mcq(
              t`Geometricamente, o valor médio $\bar f$ de uma função positiva em $[a,\,b]$ representa…`,
              ['a altura do retângulo de base $b-a$ que tem a mesma área sob a curva', 'a metade de $f(b)-f(a)$', 'a inclinação da reta secante', 'o valor máximo dividido por 2'],
              0,
              t`Pois $\bar f\cdot(b-a)=\int_a^b f(x)\,dx$.`,
            ),
            num(t`Qual o valor médio de $f(x)=\operatorname{sen}x$ num período completo $[0,\,2\pi]$?`, 0, t`A área positiva em $[0,\,\pi]$ cancela a negativa em $[\pi,\,2\pi]$, logo $\int_0^{2\pi}\operatorname{sen}x\,dx=0$.`),
            mcqS(
              t`Qual o valor médio de $f(x)=\operatorname{sen}x$ apenas no meio período $[0,\,\pi]$?`,
              t`$\frac{2}{\pi}$`,
              [t`$0$`, t`$\frac{1}{\pi}$`, t`$2$`, t`$\frac{\pi}{2}$`],
              t`$\bar f=\frac{1}{\pi-0}\int_0^\pi\operatorname{sen}x\,dx=\frac{2}{\pi}$.`,
            ),
            num(
              t`Para $f(x)=3x^2$ em $[0,\,2]$, o valor médio é $\bar f=4$. Em qual ponto $c\in[0,\,2]$ vale $f(c)=\bar f$ (com 2 casas)?`,
              Math.sqrt(4 / 3),
              t`$3c^2=4\implies c=\frac{2}{\sqrt 3}\approx 1{,}15$.`,
              { tol: 0.02 },
            ),
          ],
        },
        {
          card: {
            title: 'Deslocamento × distância e taxas',
            body: t`Integrar uma **taxa de variação** calcula a variação acumulada da grandeza:
$$\text{Deslocamento}=\int_a^b v(t)\,dt\qquad\text{Distância percorrida}=\int_a^b |v(t)|\,dt$$

O mesmo vale para vazão $\to$ volume, força $\to$ trabalho ($W=\int_a^b F(x)\,dx$) e custo marginal $\to$ variação do custo ($\int_a^b C'(q)\,dq=C(b)-C(a)$).`,
            example: t`Com $v(t)=t-2$ em $[0,\,4]$: deslocamento $\int_0^4(t-2)\,dt=0\text{ m}$ (foi e voltou à origem), mas a distância percorrida é $\int_0^4|t-2|\,dt=2+2=4\text{ m}$.`,
            tip: t`Para achar a distância percorrida quando $v(t)$ muda de sinal, divida a integral no instante em que $v(t)=0$.`,
          },
          exercises: [
            mcq(
              t`Qual a diferença física entre $\int_a^b v(t)\,dt$ e $\int_a^b |v(t)|\,dt$?`,
              ['a primeira dá o deslocamento líquido e a segunda dá a distância total percorrida', 'a primeira dá a distância total e a segunda dá a aceleração', 'ambas dão sempre o mesmo valor', 'a primeira dá a velocidade média e a segunda dá a posição'],
              0,
              t`Em $\int v(t)\,dt$, trechos com $v<0$ subtraem; em $\int|v(t)|\,dt$, todo movimento soma positivamente.`,
            ),
            num(t`O custo marginal é $C'(q)=10+2q$. Quanto aumenta o custo ao produzir de $q=0$ até $q=10$?`, 200, t`$\int_0^{10}(10+2q)\,dq=[10q+q^2]_0^{10}=100+100=200$.`),
            num(t`Uma vazão de $v(t)=3t^2$ L/min enche um tanque. Quantos litros entram entre $t=0$ e $t=2$ min?`, 8, t`$\int_0^23t^2dt=[t^3]_0^2=8$ L.`, { unit: 'L' }),
            gen((rng) => {
              const t0 = randInt(rng, 1, 4);
              return num(
                t`Uma partícula tem velocidade $v(t)=2t-${2 * t0}$ m/s. Qual é o seu **deslocamento** líquido entre $t=0$ e $t=${2 * t0}$ s?`,
                0,
                t`$\int_0^{${2 * t0}}(2t-${2 * t0})\,dt=[t^2-${2 * t0}t]_0^{${2 * t0}}=0$ m (recua até $t=${t0}$ e volta ao ponto inicial).`,
                { unit: 'm' },
              );
            }),
            gen((rng) => {
              const t0 = randInt(rng, 1, 4);
              return num(
                t`Para a mesma velocidade $v(t)=2t-${2 * t0}$ m/s, qual é a **distância total percorrida** entre $t=0$ e $t=${2 * t0}$ s?`,
                2 * t0 * t0,
                t`De $0$ a $${t0}$ recua $${t0 * t0}$ m e de $${t0}$ a $${2 * t0}$ avança $${t0 * t0}$ m; distância total $=${2 * t0 * t0}$ m.`,
                { unit: 'm' },
              );
            }),
            gen((rng) => {
              const a = randInt(rng, 2, 5);
              const b = randInt(rng, 2, 5);
              return num(
                t`Uma mola exerce força $F(x)=${2 * a}x$ N. Qual o trabalho $W=\int_0^{${b}} F(x)\,dx$ para esticá-la de $x=0$ até $x=${b}$ m?`,
                a * b * b,
                t`$W=\int_0^{${b}} ${2 * a}x\,dx=[${a}x^2]_0^{${b}}=${a * b * b}$ J.`,
                { unit: 'J' },
              );
            }),
            match(
              t`Ligue a integral de cada taxa à grandeza acumulada:`,
              [
                [t`$\int_a^b v(t)\,dt$ (velocidade)`, t`Deslocamento $\Delta s$`],
                [t`$\int_a^b |v(t)|\,dt$ (rapidez)`, t`Distância percorrida`],
                [t`$\int_a^b F(x)\,dx$ (força)`, t`Trabalho realizado $W$`],
                [t`$\int_a^b P(t)\,dt$ (potência)`, t`Energia consumida $E$`],
              ],
              t`Integrar uma taxa no tempo (ou no espaço) acumula a grandeza correspondente.`,
            ),
            num(
              t`Uma bomba opera com vazão $Q(t)=20+6t$ L/min. Quantos litros são bombeados nos primeiros $5$ minutos ($t=0$ a $t=5$)?`,
              175,
              t`$\int_0^5(20+6t)\,dt=[20t+3t^2]_0^5=100+75=175$ L.`,
              { unit: 'L' },
            ),
          ],
        },
      ],
    },
  ],
};

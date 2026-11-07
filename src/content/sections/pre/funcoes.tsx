import React from 'react';
import type { UnitDef } from '../../types';
import { gen, mcq, mcqS, num, tf, fill, match, order, inter, plot, rmcq, near, multi } from '../../helpers';
import { CircleW, FnCurve, InfLine, Label, ParamCurve, Pt, Seg } from '../../../components/plot/Plot';
import { C } from '../../../theme';
import { fmt, pick, randInt, randNZ, polyTex, term } from '../../../lib/random';

const t = String.raw;

const xm = (r: number) => (r === 0 ? 'x' : r < 0 ? `x+${-r}` : `x-${r}`);

/** Horizontal line test on f(x) = x^2 - 2 with slider k. */
const horizLineLab = (k0 = 1.5) =>
  plot({
    view: { xMin: -4, xMax: 4, yMin: -3.5, yMax: 4.5 },
    params: [{ key: 'k', label: 'k', min: -3, max: 4, step: 0.1, value: k0, color: C.gold }],
    render: ({ p }: any) => {
      const d = p.k + 2;
      const xs = d > 1e-6 ? [-Math.sqrt(d), Math.sqrt(d)] : Math.abs(d) <= 1e-6 ? [0] : [];
      return (
        <>
          <FnCurve f={(x) => x * x - 2} color={C.p1} />
          <Seg x1={-4} y1={p.k} x2={4} y2={p.k} color={C.gold} width={2.5} dash="6 4" />
          {xs.map((x, i) => (
            <Pt key={i} x={x} y={p.k} color={C.danger} r={6} />
          ))}
        </>
      );
    },
    info: ({ p }: any) => {
      const d = p.k + 2;
      if (d > 1e-6) {
        const r = Math.sqrt(d);
        return t`Reta $y=${fmt(p.k, 1)}$ corta $f(x)=x^2-2$ em **2 pontos** ($x=\pm ${fmt(r, 2)}$) ⟹ **não é injetora**`;
      }
      if (Math.abs(d) <= 1e-6) return t`Reta $y=-2$ toca o vértice $(0,\,-2)$ em **1 único ponto**`;
      return t`Reta $y=${fmt(p.k, 1)}$ tem **0 interseções** ($y<-2$ está fora da imagem $[-2,\,\infty)$)`;
    },
  });

/** Domain restriction [a, inf) on f(x) = x^2 and its reflection across y = x. */
const restrictLab = (a0 = -1.5) =>
  plot({
    view: { xMin: -3, xMax: 4.5, yMin: -3, yMax: 4.5 },
    equalAspect: true,
    params: [{ key: 'a', label: 'a', min: -2, max: 1.5, step: 0.1, value: a0, color: C.p2 }],
    render: ({ p }: any) => (
      <>
        <FnCurve f={(x) => x} color={C.textDim} width={1.5} dash="5 5" />
        <FnCurve f={(x) => x * x} color={C.textDim} width={1.5} dash="4 4" opacity={0.45} />
        <FnCurve f={(x) => x * x} from={p.a} to={2.2} color={C.p2} width={3.5} />
        <ParamCurve fx={(u) => u * u} fy={(u) => u} t0={p.a} t1={2.2} color={C.p5} width={3} />
        <Pt x={p.a} y={p.a * p.a} color={C.p2} r={5} />
        <Pt x={p.a * p.a} y={p.a} color={C.p5} r={5} />
      </>
    ),
    info: ({ p }: any) =>
      p.a < -0.02
        ? t`Domínio $[${fmt(p.a, 1)},\,\infty)$: $f$ desce e sobe (**não injetora**) ⟹ o reflexo rosa falha no teste vertical`
        : Math.abs(p.a) <= 0.02
          ? t`Domínio $[0,\,\infty)$: $f(x)=x^2$ é **bijetora** em $[0,\,\infty)$ e a curva rosa é $f^{-1}(x)=\sqrt{x}$`
          : t`Domínio $[${fmt(p.a, 1)},\,\infty)$: injetora, mas perde o trecho $[0,\,${fmt(p.a * p.a, 2)})$ da imagem`,
  });

/** End behavior of a * x^n with sliders for degree n and leading coeff a. */
const endBehaviorLab = () =>
  plot({
    view: { xMin: -2.6, xMax: 2.6, yMin: -6, yMax: 6 },
    params: [
      { key: 'n', label: 'n', min: 1, max: 4, step: 1, value: 3, color: C.p1, format: (v: number) => String(v) },
      { key: 'a', label: 'a', min: -2, max: 2, step: 0.2, value: 1, color: C.gold },
    ],
    render: ({ p }: any) => {
      const f = (x: number) => p.a * Math.pow(x, p.n);
      return (
        <>
          <FnCurve f={f} color={C.p1} width={3.5} />
          <Pt x={0} y={0} color={C.gold} r={4} />
        </>
      );
    },
    info: ({ p }: any) => {
      if (Math.abs(p.a) < 1e-6) return t`$a=0\Rightarrow f(x)=0$ (função constante)`;
      const rInf = p.a > 0 ? '+\\infty' : '-\\infty';
      const lInf = p.n % 2 === 0 ? rInf : p.a > 0 ? '-\\infty' : '+\\infty';
      return t`$f(x)=${fmt(p.a, 1)}x^{${p.n}}$ (grau ${p.n % 2 === 0 ? 'par' : 'ímpar'}) · $x\to -\infty:\ ${lInf}$ · $x\to +\infty:\ ${rInf}$`;
    },
  });

/** Roots and multiplicity lab: P(x) = 0.2 (x - a)(x - b)^2 (x - c). */
const multiplicityLab = () =>
  plot({
    view: { xMin: -4.2, xMax: 4.2, yMin: -5, yMax: 5 },
    params: [
      { key: 'a', label: 'a', min: -3.5, max: 3.5, step: 0.5, value: -3, color: C.p2 },
      { key: 'b', label: 'b', min: -3.5, max: 3.5, step: 0.5, value: 0, color: C.gold },
      { key: 'c', label: 'c', min: -3.5, max: 3.5, step: 0.5, value: 2, color: C.p5 },
    ],
    render: ({ p }: any) => (
      <>
        <FnCurve f={(x) => 0.2 * (x - p.a) * (x - p.b) ** 2 * (x - p.c)} color={C.p1} width={3} />
        <Pt x={p.a} y={0} color={C.p2} r={6} label="a" />
        <Pt x={p.b} y={0} color={C.gold} r={7} label="b(×2)" />
        <Pt x={p.c} y={0} color={C.p5} r={6} label="c" />
      </>
    ),
    info: ({ p }: any) =>
      t`$P(x)=\tfrac{1}{5}(x${term(-p.a, '')})(x${term(-p.b, '')})^2(x${term(-p.c, '')})$ · **cruza** em $a=${fmt(p.a)}$ e $c=${fmt(p.c)}$ · **tangencia** em $b=${fmt(p.b)}$`,
  });

/** Rational function f(x) = (a x + b) / (x - c) with dashed asymptotes. */
const rationalLab = (opts: { a?: number; b?: number; c?: number } = {}) =>
  plot({
    view: { xMin: -6, xMax: 6, yMin: -6, yMax: 6 },
    params: [
      { key: 'a', label: 'a', min: -3, max: 3, step: 0.5, value: opts.a ?? 1, color: C.gold },
      { key: 'b', label: 'b', min: -4, max: 4, step: 0.5, value: opts.b ?? 2, color: C.p3 },
      { key: 'c', label: 'c', min: -4, max: 4, step: 0.5, value: opts.c ?? 1, color: C.danger },
    ],
    render: ({ p }: any) => {
      const hole = Math.abs(p.a * p.c + p.b) < 1e-6;
      const f = (x: number) => (p.a * x + p.b) / (x - p.c);
      return (
        <>
          {!hole && <Seg x1={p.c} y1={-6} x2={p.c} y2={6} color={C.danger} dash="6 5" width={2} />}
          <Seg x1={-6} y1={p.a} x2={6} y2={p.a} color={C.gold} dash="6 5" width={2} />
          {hole ? (
            <>
              <FnCurve f={() => p.a} color={C.p2} width={3} />
              <CircleW cx={p.c} cy={p.a} r={0.18} color={C.p2} fill={C.bgDeep} fillOpacity={1} width={2.5} />
            </>
          ) : (
            <>
              <FnCurve f={f} from={-6} to={p.c - 0.04} color={C.p2} width={3} />
              <FnCurve f={f} from={p.c + 0.04} to={6} color={C.p2} width={3} />
            </>
          )}
        </>
      );
    },
    info: ({ p }: any) => {
      const numStr = polyTex([p.b, p.a]);
      const denStr = `x${p.c < 0 ? '+' : '-'}${fmt(Math.abs(p.c))}`;
      if (Math.abs(p.a * p.c + p.b) < 1e-6) {
        return t`$f(x)=\dfrac{${numStr}}{${denStr}}$: fator $(${denStr})$ cancela ⟹ **buraco** em $(${fmt(p.c)},\,${fmt(p.a)})$`;
      }
      return t`$f(x)=\dfrac{${numStr}}{${denStr}}$ · AV (vermelha): $x=${fmt(p.c)}$ · AH (dourada): $y=${fmt(p.a)}$`;
    },
  });

/** Oblique asymptote lab: f(x) = m x + 1 + 1 / (x - c). */
const obliqueLab = () =>
  plot({
    view: { xMin: -6, xMax: 6, yMin: -6, yMax: 6 },
    params: [
      { key: 'm', label: 'm', min: -1.5, max: 1.5, step: 0.5, value: 1, color: C.gold },
      { key: 'c', label: 'c', min: -3, max: 3, step: 0.5, value: 1, color: C.danger },
    ],
    render: ({ p }: any) => {
      const f = (x: number) => p.m * x + 1 + 1 / (x - p.c);
      return (
        <>
          <Seg x1={p.c} y1={-6} x2={p.c} y2={6} color={C.danger} dash="6 5" width={2} />
          <InfLine x1={0} y1={1} x2={1} y2={1 + p.m} color={C.gold} dash="6 5" width={2} />
          <FnCurve f={f} from={-6} to={p.c - 0.05} color={C.p2} width={3} />
          <FnCurve f={f} from={p.c + 0.05} to={6} color={C.p2} width={3} />
          <Label x={p.c} y={-5.3} text={`x = ${fmt(p.c)}`} color={C.danger} anchor="middle" />
        </>
      );
    },
    info: ({ p }: any) =>
      t`$f(x)=${fmt(p.m)}x+1+\dfrac{1}{x${p.c < 0 ? '+' : '-'}${fmt(Math.abs(p.c))}}$ · AV: $x=${fmt(p.c)}$ · Assíntota oblíqua: $y=${fmt(p.m)}x+1$`,
  });

export const classesFuncoes: UnitDef = {
  id: 'p-func',
  title: 'Funções: classificação e famílias',
  subtitle: 'Injetora e bijetora, polinomiais de grau superior e racionais',
  icon: '🧭',
  source: 'Pré-Cálculo · Classificação e famílias de funções',
  guide: t`Nem toda função pode ser invertida de imediato: entender **injetora, sobrejetora e bijetora** mostra quando e como restringir o domínio. Em seguida, dominamos o formato global dos **polinômios de grau superior** (extremidades e multiplicidade das raízes) e das **funções racionais** (buracos e assíntotas verticais, horizontais e oblíquas).`,
  lessons: [
    {
      id: 'p-func-inj',
      title: 'Injetora, sobrejetora e bijetora',
      parts: [
        {
          card: {
            title: 'Contradomínio × imagem e sobrejetora',
            body: t`Na notação $f:A\to B$:
• $A$ é o **domínio** (de onde saem as flechas).
• $B$ é o **contradomínio** (o conjunto de chegada declarado).
• A **imagem** $\operatorname{Im}(f)$ são os elementos de $B$ que **realmente recebem** pelo menos uma flecha ($\operatorname{Im}(f)\subseteq B$).

Uma função é **sobrejetora** quando não sobra ninguém sem flecha em $B$:

$$\operatorname{Im}(f)=B$$`,
            example: t`Em $f:\mathbb R\to\mathbb R$ dada por $f(x)=x^2$, a imagem é $[0,\,\infty)\neq\mathbb R$ (os negativos sobram): **não** é sobrejetora. Mas $g:\mathbb R\to[0,\,\infty)$ com $g(x)=x^2$ **é** sobrejetora!`,
            tip: t`Em conjuntos finitos, $f:A\to B$ só pode ser sobrejetora se $A$ tiver **pelo menos tantos elementos** quanto $B$: $n(A)\ge n(B)$.`,
          },
          exercises: [
            tf(t`Em qualquer função $f:A\to B$, o conjunto imagem está contido no contradomínio ($\operatorname{Im}(f)\subseteq B$).`, true, t`Todo valor $f(x)$ atingido pertence, por definição, ao conjunto de chegada $B$.`),
            mcq(t`Uma função $f:A\to B$ é **sobrejetora** quando…`, ['a imagem é igual ao contradomínio ($\\operatorname{Im}(f)=B$)', 'a imagem é igual ao domínio ($\\operatorname{Im}(f)=A$)', 'cada elemento de $B$ recebe no máximo uma flecha', 'o gráfico não corta o eixo $y$'], 0, t`Sobrejetora significa que todo elemento do contradomínio $B$ é imagem de pelo menos um $x\in A$.`),
            gen((rng) => {
              const a = randInt(rng, 2, 4);
              const b = randInt(rng, 1, 5);
              const y0 = b;
              const y1 = a + b;
              const y2 = 2 * a + b;
              return num(
                t`Considere $f:\{0,\,1,\,2\}\to\mathbb Z$ dada por $f(x)=${a}x+${b}$. Quanto vale a **soma** dos elementos do conjunto imagem $\operatorname{Im}(f)$?`,
                y0 + y1 + y2,
                t`Calculando nos elementos do domínio: $f(0)=${y0}$, $f(1)=${y1}$ e $f(2)=${y2}$. A soma é $${y0}+${y1}+${y2}=${y0 + y1 + y2}$.`,
              );
            }),
            mcqS(
              t`Para qual escolha de contradomínio $B$ a função $f:\mathbb R\to B$ dada por $f(x)=x^2+4$ passa a ser **sobrejetora**?`,
              t`$B=[4,\,\infty)$`,
              [t`$B=\mathbb R$`, t`$B=[0,\,\infty)$`, t`$B=(4,\,\infty)$`, t`$B=[-4,\,\infty)$`],
              t`Como $x^2\ge 0$, os valores atingidos são todos os reais $\ge 4$ (incluindo $4$ em $x=0$). Escolhendo $B=[4,\,\infty)$, temos $\operatorname{Im}(f)=B$.`,
            ),
            fill(
              t`Complete as definições para uma função $f:A\to B$:`,
              t`O conjunto $B$ declarado na chegada é o ___, os valores efetivamente atingidos formam a ___, e quando esses dois conjuntos são iguais a função é ___.`,
              ['contradomínio', 'imagem', 'sobrejetora'],
              ['domínio', 'injetora', 'par'],
              t`Contradomínio é o conjunto de chegada $B$; imagem é $\operatorname{Im}(f)\subseteq B$; $\operatorname{Im}(f)=B$ define função sobrejetora.`,
            ),
            gen((rng) => {
              const k = randNZ(rng, -5, 5);
              return rmcq(
                rng,
                t`Seja $f:\mathbb R\to B$ definida por $f(x)=e^x${term(k, '')}$. Qual contradomínio $B$ torna $f$ **sobrejetora**?`,
                `$(${k},\\,\\infty)$`,
                [`$[${k},\\,\\infty)$`, `$(0,\\,\\infty)$`, `$\\mathbb R$`, `$(${-k},\\,\\infty)$`],
                t`Como $e^x>0$ para todo $x\in\mathbb R$, temos $e^x${term(k, '')}>${k}$ (sem nunca atingir $${k}$). Logo $\operatorname{Im}(f)=(${k},\,\infty)$.`,
              );
            }),
            gen((rng) => {
              const nA = randInt(rng, 4, 9);
              return num(
                t`Um conjunto finito $A$ tem $${nA}$ elementos. Qual é o **maior** número de elementos que o contradomínio $B$ pode ter para que exista uma função **sobrejetora** $f:A\to B$?`,
                nA,
                t`Cada um dos $${nA}$ elementos de $A$ envia exatamente uma flecha, portanto $f$ consegue atingir no máximo $${nA}$ elementos em $B$.`,
              );
            }),
            multi(
              t`Quais das funções abaixo, todas declaradas de $\mathbb R$ em $\mathbb R$, são **sobrejetoras**?`,
              ['$f(x)=2x-5$', '$f(x)=x^3$', '$f(x)=x^2$', '$f(x)=\\cos x$', '$f(x)=e^x$'],
              [0, 1],
              t`$2x-5$ e $x^3$ assumem todos os valores reais ($\operatorname{Im}=\mathbb R$). Já $x^2\ge 0$, $\cos x\in[-1,\,1]$ e $e^x>0$ deixam reais de fora.`,
            ),
          ],
        },
        {
          card: {
            title: 'Injetora e o teste da reta horizontal',
            body: t`Uma função é **injetora** (ou *um-a-um*) quando entradas diferentes **nunca** dão a mesma saída:

$$x_1\ne x_2 \Rightarrow f(x_1)\ne f(x_2) \quad\Longleftrightarrow\quad f(x_1)=f(x_2)\Rightarrow x_1=x_2$$

No gráfico, isso vira o **teste da reta horizontal**:
• **Injetora**: toda reta horizontal $y=k$ corta o gráfico em **no máximo 1 ponto**.
• **Sobrejetora** (em $\mathbb R$): toda reta $y=k$ corta em **pelo menos 1 ponto**.

Mova a altura $k$ da reta horizontal sobre $f(x)=x^2-2$:`,
            visual: horizLineLab(),
            tip: t`Toda função **estritamente crescente** (ou estritamente decrescente) nunca volta à mesma altura — por isso é sempre **injetora**.`,
          },
          exercises: [
            tf(t`Se uma função satisfaz $f(-3)=7$ e $f(3)=7$, então ela **não** é injetora.`, true, t`Dois valores distintos do domínio ($-3\ne 3$) têm a mesma imagem ($7$), violando a definição de injetora.`),
            mcq(
              t`Pelo teste da reta horizontal, uma função é **injetora** se toda reta horizontal $y=k$ corta o gráfico em…`,
              ['no máximo um ponto', 'exatamente dois pontos', 'pelo menos um ponto', 'pelo menos dois pontos'],
              0,
              t`Se uma reta $y=k$ cortar o gráfico em 2 ou mais pontos, existem $x_1\ne x_2$ com $f(x_1)=f(x_2)=k$.`,
            ),
            inter(
              t`Mova a reta horizontal $y=k$ até a **única** altura em que ela corta a parábola $f(x)=x^2-2$ em **exatamente 1 ponto**.`,
              'plot',
              horizLineLab(2).props,
              (v: any) => v && near(v.p.k, -2, 0.05),
              t`$k=-2$ (no vértice $(0,\,-2)$).`,
              t`Acima do vértice ($k>-2$) a reta corta a parábola 2 vezes; no vértice $k=-2$ toca 1 vez; abaixo dele, nenhuma.`,
            ),
            match(
              t`Ligue cada situação no diagrama de flechas ($f:A\to B$) ou no gráfico à conclusão correta:`,
              [
                [t`Duas flechas de $A$ chegam no mesmo elemento de $B$`, t`Não é injetora`],
                [t`Sobra elemento em $B$ sem receber flecha`, t`Não é sobrejetora`],
                [t`Toda reta horizontal corta o gráfico em no máximo 1 ponto`, t`É injetora`],
                [t`Toda reta horizontal de $B$ corta o gráfico em exatamente 1 ponto`, t`É bijetora`],
              ],
              t`Injetora = no máximo 1 flecha por destino; sobrejetora = pelo menos 1; bijetora = exatamente 1.`,
            ),
            gen((rng) => {
              const h = randInt(rng, 1, 5);
              const d = randInt(rng, 1, 4);
              const c = randInt(rng, -4, 4);
              const x1 = h + d;
              const x2 = h - d;
              return num(
                t`Para provar que $f(x)=(x-${h})^2${term(c, '')}$ não é injetora em $\mathbb R$, encontre o outro valor $x\ne ${x1}$ tal que $f(x)=f(${x1})$.`,
                x2,
                t`Em $x=${x1}$ temos $(x-${h})^2=${d * d}$. A outra solução de $(x-${h})^2=${d * d}$ é $x-${h}=-${d}\Rightarrow x=${x2}$ (simétrico em relação a $x=${h}$).`,
              );
            }),
            gen((rng) => {
              const nB = randInt(rng, 4, 9);
              return num(
                t`O contradomínio finito $B$ tem $${nB}$ elementos. Qual é o **maior** número de elementos que o domínio $A$ pode ter para que exista uma função **injetora** $f:A\to B$?`,
                nB,
                t`Para não repetir imagens em $B$, cada elemento de $A$ precisa de uma vaga própria em $B$. Logo $n(A)\le n(B)=${nB}$.`,
              );
            }),
            multi(
              t`Quais das funções abaixo são **injetoras** em todo o seu domínio natural?`,
              ['$f(x)=3x+2$', '$f(x)=e^x$', '$f(x)=\\ln x$', '$f(x)=x^2$', '$f(x)=|x|$'],
              [0, 1, 2],
              t`$3x+2$, $e^x$ e $\ln x$ são estritamente crescentes (portanto injetoras). Já $x^2$ e $|x|$ assumem o mesmo valor em $x$ e $-x$.`,
            ),
            gen((rng) => {
              const k = randInt(rng, 1, 4);
              const item = pick(rng, [
                [`f(x)=${k + 1}x-${k}`, 'Bijetora (injetora e sobrejetora)', 'Reta não horizontal: estritamente crescente e imagem $\\mathbb R$.'],
                [`f(x)=2^x+${k}`, 'Apenas injetora (não é sobrejetora)', 'Estritamente crescente (injetora), mas a imagem é $(' + k + ',\\,\\infty)\\neq\\mathbb R$.'],
                [`f(x)=x^2+${k}`, 'Nem injetora nem sobrejetora', '$f(-1)=f(1)$ (não é injetora) e a imagem é $[' + k + ',\\,\\infty)\\neq\\mathbb R$ (não é sobrejetora).'],
                [`f(x)=x^3-${k * k}x`, 'Apenas sobrejetora (não é injetora)', 'Grau 3 varre todo o $\\mathbb R$ (sobrejetora), mas tem três raízes reais $0$ e $\\pm ' + k + '$ (não é injetora).'],
              ] as const);
              const all = [
                'Bijetora (injetora e sobrejetora)',
                'Apenas injetora (não é sobrejetora)',
                'Apenas sobrejetora (não é injetora)',
                'Nem injetora nem sobrejetora',
              ];
              return rmcq(
                rng,
                t`Classifique a função $f:\mathbb R\to\mathbb R$ dada por $${item[0]}$:`,
                item[1],
                all.filter((s) => s !== item[1]),
                item[2],
              );
            }),
          ],
        },
        {
          card: {
            title: 'Bijetora e restrição de domínio',
            body: t`Uma função $f:A\to B$ é **bijetora** quando é **injetora e sobrejetora** ao mesmo tempo: cada $y\in B$ vem de um **único** $x\in A$.

> Só existe função inversa $f^{-1}:B\to A$ se, e somente se, $f$ for **bijetora**.

Quando uma função não é injetora (como $x^2$, $\operatorname{sen}x$, $\cos x$), **restringimos o domínio** a um trecho monótono e o contradomínio à imagem:
• $x^2$ em $[0,\,\infty)\to[0,\,\infty)$ tem inversa $\sqrt{x}$.
• $\operatorname{sen}x$ em $[-\frac{\pi}{2},\,\frac{\pi}{2}]\to[-1,\,1]$ tem inversa $\operatorname{arcsen}x$.
• $\cos x$ em $[0,\,\pi]\to[-1,\,1]$ tem inversa $\arccos x$.`,
            visual: restrictLab(),
            tip: t`Para tornar $f(x)=a(x-h)^2+k$ injetora, corte o domínio no **vértice** $x=h$: use $[h,\,\infty)$ ou $(-\infty,\,h]$.`,
          },
          exercises: [
            mcq(
              t`Qual é a condição necessária e suficiente para que uma função $f:A\to B$ possua inversa $f^{-1}:B\to A$?`,
              ['Ser bijetora (injetora e sobrejetora)', 'Ser apenas injetora', 'Ser apenas sobrejetora', 'Ter domínio igual a $\\mathbb R$'],
              0,
              t`Sem injetividade, a inversa teria duas saídas para um mesmo $y$; sem sobrejetividade, faltariam elementos de $B$ no domínio de $f^{-1}$.`,
            ),
            inter(
              t`Ajuste o início $a$ do domínio $[a,\,\infty)$ para o **menor** valor que torna $f(x)=x^2$ injetora (fazendo a curva refletida rosa ser a função $\sqrt{x}$).`,
              'plot',
              restrictLab(-1.5).props,
              (v: any) => v && near(v.p.a, 0, 0.05),
              t`$a=0$ (domínio $[0,\,\infty)$).`,
              t`Cortando no vértice $x=0$, eliminamos o ramo esquerdo e mantemos toda a imagem $[0,\,\infty)$.`,
            ),
            match(
              t`Ligue cada função ao domínio padrão ao qual ela é restringida para definir sua inversa:`,
              [
                [t`$f(x)=x^2$ (para obter $\sqrt{x}$)`, t`$[0,\,\infty)$`],
                [t`$f(x)=\operatorname{sen}x$ (para obter $\operatorname{arcsen}x$)`, t`$[-\frac{\pi}{2},\,\frac{\pi}{2}]$`],
                [t`$f(x)=\cos x$ (para obter $\arccos x$)`, t`$[0,\,\pi]$`],
                [t`$f(x)=\operatorname{tg}x$ (para obter $\operatorname{arctg}x$)`, t`$(-\frac{\pi}{2},\,\frac{\pi}{2})$`],
              ],
              t`Cada intervalo escolhe um ramo estritamente monótono que cobre toda a imagem da função original.`,
            ),
            gen((rng) => {
              const h = randNZ(rng, -5, 5);
              const k = randInt(rng, -4, 4);
              const b = -2 * h;
              const c = h * h + k;
              return num(
                t`Qual é o **menor** valor real de $a$ para que $f(x)=${polyTex([c, b, 1])}$, restrita ao domínio $[a,\,\infty)$, seja **injetora**?`,
                h,
                t`A parábola muda de direção no vértice $x_v=-\frac{b}{2a}=-\frac{${b}}{2}=${h}$. Em $[${h},\,\infty)$ ela é estritamente crescente e injetora.`,
              );
            }),
            gen((rng) => {
              const c = randInt(rng, 1, 6);
              return rmcq(
                rng,
                t`Se restringirmos $f(x)=x^2+${c}$ ao ramo esquerdo $(-\infty,\,0]\to[${c},\,\infty)$, qual é a lei da inversa $f^{-1}(x)$?`,
                t`$f^{-1}(x)=-\sqrt{x-${c}}$`,
                [t`$f^{-1}(x)=\sqrt{x-${c}}$`, t`$f^{-1}(x)=-\sqrt{x+${c}}$`, t`$f^{-1}(x)=\sqrt{x}-${c}$`, t`$f^{-1}(x)=-\sqrt{x}-${c}$`],
                t`Trocando $x$ e $y$: $x=y^2+${c}\Rightarrow y=\pm\sqrt{x-${c}}$. Como o domínio escolhido foi $y\le 0$, vale o sinal negativo: $f^{-1}(x)=-\sqrt{x-${c}}$.`,
              );
            }),
            gen((rng) => {
              const q = pick(rng, [
                ['\\operatorname{arcsen}(1)', '\\frac{\\pi}{2}', ['-\\frac{\\pi}{2}', '\\pi', '0', '\\frac{3\\pi}{2}'], 'No intervalo $[-\\frac{\\pi}{2},\\,\\frac{\\pi}{2}]$, o único arco com seno igual a $1$ é $\\frac{\\pi}{2}$.'],
                ['\\operatorname{arcsen}\\left(-\\frac{1}{2}\\right)', '-\\frac{\\pi}{6}', ['\\frac{7\\pi}{6}', '\\frac{5\\pi}{6}', '\\frac{\\pi}{6}', '-\\frac{\\pi}{3}'], 'A imagem de $\\operatorname{arcsen}$ é $[-\\frac{\\pi}{2},\\,\\frac{\\pi}{2}]$, onde $\\operatorname{sen}(-\\frac{\\pi}{6})=-\\frac{1}{2}$.'],
                ['\\arccos(-1)', '\\pi', ['0', '-\\pi', '\\frac{\\pi}{2}', '2\\pi'], 'No intervalo $[0,\\,\\pi]$ de $\\arccos$, o único arco com cosseno igual a $-1$ é $\\pi$.'],
                ['\\arccos\\left(-\\frac{1}{2}\\right)', '\\frac{2\\pi}{3}', ['-\\frac{\\pi}{3}', '\\frac{\\pi}{3}', '\\frac{4\\pi}{3}', '\\frac{5\\pi}{6}'], 'A imagem de $\\arccos$ é $[0,\\,\\pi]$ (1º e 2º quadrantes), onde $\\cos(\\frac{2\\pi}{3})=-\\frac{1}{2}$.'],
              ] as const);
              return rmcq(rng, t`Usando os domínios restritos padrão, quanto vale $${q[0]}$?`, `$${q[1]}$`, q[2].map((w) => `$${w}$`), q[3]);
            }),
            tf(
              t`Vale a igualdade $\operatorname{arcsen}(\operatorname{sen}\pi)=\pi$.`,
              false,
              t`$\operatorname{sen}\pi=0$ e $\operatorname{arcsen}(0)=0\in[-\frac{\pi}{2},\,\frac{\pi}{2}]$. Só vale $\operatorname{arcsen}(\operatorname{sen}x)=x$ quando $x$ está no domínio restrito $[-\frac{\pi}{2},\,\frac{\pi}{2}]$.`,
            ),
            gen((rng) => {
              const h = randInt(rng, 1, 4);
              const d = randInt(rng, 2, 5);
              const k = randInt(rng, -3, 5);
              const y0 = d * d + k;
              return num(
                t`Dada a função bijetora $f:[${h},\,\infty)\to[${k},\,\infty)$ com $f(x)=(x-${h})^2${term(k, '')}$, calcule $f^{-1}(${y0})$.`,
                h + d,
                t`$(x-${h})^2${term(k, '')}=${y0}\Rightarrow (x-${h})^2=${d * d}\Rightarrow x-${h}=\pm ${d}$. Como $x\ge ${h}$, descartamos $${h - d}$ e ficamos com $x=${h + d}$.`,
              );
            }),
          ],
        },
      ],
    },
    {
      id: 'p-func-pol',
      title: 'Polinomiais de grau superior',
      parts: [
        {
          card: {
            title: 'Grau, coeficiente líder e extremidades',
            body: t`Um polinômio de **grau $n$** tem a forma:

$$P(x)=a_nx^n+a_{n-1}x^{n-1}+\dots+a_1x+a_0\quad(a_n\ne 0)$$

• **$a_n$**: **coeficiente líder** (multiplica a maior potência $x^n$).
• **$a_0=P(0)$**: termo independente (onde corta o eixo $y$).

Para $|x|$ muito grande, **o termo líder $a_nx^n$ domina** todo o resto:
• **$n$ par**: as duas pontas vão para o **mesmo lado** ($+\infty$ se $a_n>0$; $-\infty$ se $a_n<0$).
• **$n$ ímpar**: as pontas vão para **lados opostos** (direita vai a $+\infty$ se $a_n>0$, ou a $-\infty$ se $a_n<0$).`,
            visual: endBehaviorLab(),
            tip: t`Cuidado quando os termos estão fora de ordem: em $P(x)=5-2x+4x^3$, o grau é $3$ e o coeficiente líder é $4$ (não $5$).`,
          },
          exercises: [
            gen((rng) => {
              const n = randInt(rng, 3, 6);
              const an = randNZ(rng, -7, 7);
              let c0 = randNZ(rng, -9, 9);
              if (c0 === an) c0 = -an;
              const b = randNZ(rng, -5, 5);
              return num(
                t`Qual é o **coeficiente líder** do polinômio $P(x)=${c0}${term(b, 'x')}${term(an, `x^{${n}}`)}$?`,
                an,
                t`O termo de maior expoente é $${term(an, `x^{${n}}`, true)}$ (grau $${n}$), logo o coeficiente líder é $${an}$.`,
              );
            }),
            gen((rng) => {
              const m1 = randInt(rng, 1, 3);
              const m2 = randInt(rng, 2, 4);
              const m3 = randInt(rng, 1, 2);
              return num(
                t`Qual é o **grau** do polinômio fatorado $P(x)=-2x^{${m1}}(x-1)^{${m2}}(x+3)^{${m3}}$?`,
                m1 + m2 + m3,
                t`Ao expandir o produto, os maiores expoentes de $x$ se somam: $${m1}+${m2}+${m3}=${m1 + m2 + m3}$.`,
              );
            }),
            inter(
              t`Ajuste o grau $n$ e o coeficiente líder $a$ para exibir $f(x)=-x^3$ (sobe para $+\infty$ na esquerda e desce para $-\infty$ na direita, com $|a|=1$).`,
              'plot',
              endBehaviorLab().props,
              (v: any) => v && near(v.p.n, 3, 0.1) && near(v.p.a, -1, 0.05),
              t`$n=3$ e $a=-1$.`,
              t`Grau ímpar ($n=3$) deixa as extremidades opostas; $a=-1<0$ faz a ponta direita descer para $-\infty$.`,
            ),
            match(
              t`Ligue cada combinação de grau $n$ e coeficiente líder $a_n$ ao comportamento nas extremidades:`,
              [
                [t`$n$ par e $a_n>0$`, t`$x\to -\infty:\ +\infty$ e $x\to +\infty:\ +\infty$`],
                [t`$n$ par e $a_n<0$`, t`$x\to -\infty:\ -\infty$ e $x\to +\infty:\ -\infty$`],
                [t`$n$ ímpar e $a_n>0$`, t`$x\to -\infty:\ -\infty$ e $x\to +\infty:\ +\infty$`],
                [t`$n$ ímpar e $a_n<0$`, t`$x\to -\infty:\ +\infty$ e $x\to +\infty:\ -\infty$`],
              ],
              t`Grau par: pontas para o mesmo lado; grau ímpar: pontas opostas. O sinal de $a_n$ decide o destino à direita ($x\to +\infty$).`,
            ),
            gen((rng) => {
              const n = pick(rng, [3, 4, 5, 6]);
              const an = pick(rng, [-4, -3, -2, 2, 3, 4]);
              const rInf = an > 0 ? '+\\infty' : '-\\infty';
              const lInf = n % 2 === 0 ? rInf : an > 0 ? '-\\infty' : '+\\infty';
              const ans = t`$x\to -\infty:\ ${lInf}$ e $x\to +\infty:\ ${rInf}$`;
              const all = [
                t`$x\to -\infty:\ +\infty$ e $x\to +\infty:\ +\infty$`,
                t`$x\to -\infty:\ -\infty$ e $x\to +\infty:\ -\infty$`,
                t`$x\to -\infty:\ -\infty$ e $x\to +\infty:\ +\infty$`,
                t`$x\to -\infty:\ +\infty$ e $x\to +\infty:\ -\infty$`,
              ];
              return rmcq(
                rng,
                t`Qual é o comportamento nas extremidades de $P(x)=${term(an, `x^{${n}}`, true)}+9x^2-4$?`,
                ans,
                all.filter((s) => s !== ans),
                t`Manda o termo líder $${term(an, `x^{${n}}`, true)}$: grau $${n}$ (${n % 2 === 0 ? 'par' : 'ímpar'}) e $a_{${n}}=${an}${an > 0 ? '>0' : '<0'}$.`,
              );
            }),
            tf(
              t`O polinômio $P(x)=-x^4+100x^3$ tende a $+\infty$ quando $x\to +\infty$, pois $100$ é muito maior que $1$.`,
              false,
              t`Para $x$ muito grande (ex.: $x=1000$), a maior potência $-x^4$ supera $100x^3$ com folga e leva $P(x)\to -\infty$.`,
            ),
            gen((rng) => {
              const a = randNZ(rng, -3, 3);
              const r1 = pick(rng, [-3, -2, -1]);
              const r2 = pick(rng, [1, 2, 3]);
              const y0 = a * -r1 * r2 * r2;
              return num(
                t`Em que valor de $y$ o gráfico de $P(x)=${a === 1 ? '' : a === -1 ? '-' : a}(${xm(r1)})(${xm(r2)})^2$ corta o eixo $y$?`,
                y0,
                t`No eixo $y$ temos $x=0$: $P(0)=${a}\cdot(${-r1})\cdot(${-r2})^2=${y0}$.`,
              );
            }),
            mcqS(
              t`O gráfico de um polinômio desce para $-\infty$ tanto quando $x\to -\infty$ quanto quando $x\to +\infty$. O que podemos concluir?`,
              t`O grau é par e o coeficiente líder é negativo`,
              [
                t`O grau é ímpar e o coeficiente líder é negativo`,
                t`O grau é par e o coeficiente líder é positivo`,
                t`O grau é ímpar e o coeficiente líder é positivo`,
                t`O polinômio não possui raízes reais`,
              ],
              t`Pontas para o mesmo lado indicam grau **par**; ambas apontando para $-\infty$ indicam coeficiente líder **negativo**.`,
            ),
          ],
        },
        {
          card: {
            title: 'Raízes e multiplicidade: cruza ou tangencia?',
            body: t`Na forma fatorada:

$$P(x)=a_n(x-r_1)^{m_1}(x-r_2)^{m_2}\cdots(x-r_k)^{m_k}$$

O expoente $m_i$ é a **multiplicidade** da raiz $r_i$:
• **$m_i$ ímpar** ($1, 3, \dots$): o fator $(x-r_i)^{m_i}$ troca de sinal ⟹ o gráfico **cruza** (atravessa) o eixo $x$.
• **$m_i$ par** ($2, 4, \dots$): o fator $(x-r_i)^{m_i}\ge 0$ não troca de sinal ⟹ o gráfico **tangencia** o eixo $x$ ("bate e volta").

Mexa nas raízes $a$, $b$ (dupla) e $c$:`,
            visual: multiplicityLab(),
            example: t`Em $P(x)=(x+2)(x-1)^2$, o gráfico cruza o eixo $x$ em $x=-2$ (multiplicidade $1$) e apenas tangencia em $x=1$ (multiplicidade $2$).`,
          },
          exercises: [
            mcq(
              t`Se $x=4$ é uma raiz de multiplicidade **par** de um polinômio $P(x)$, em $x=4$ o gráfico de $P$…`,
              ['tangencia o eixo $x$ sem mudar de sinal', 'cruza o eixo $x$ mudando de sinal', 'tem uma assíntota vertical', 'apresenta um buraco'],
              0,
              t`Uma potência par $(x-4)^{2k}$ é positiva dos dois lados de $4$: o gráfico encosta no eixo $x$ e volta para o mesmo lado.`,
            ),
            inter(
              t`Posicione as raízes de $P(x)=\tfrac{1}{5}(x-a)(x-b)^2(x-c)$ para que o gráfico **tangencie** o eixo $x$ em $x=1$ e **cruze** em $x=-2$ e $x=3$.`,
              'plot',
              multiplicityLab().props,
              (v: any) =>
                v &&
                near(v.p.b, 1, 0.05) &&
                ((near(v.p.a, -2, 0.05) && near(v.p.c, 3, 0.05)) || (near(v.p.a, 3, 0.05) && near(v.p.c, -2, 0.05))),
              t`$b=1$ (raiz dupla), $a=-2$ e $c=3$.`,
              t`O fator quadrático $(x-b)^2$ produz a tangência em $b=1$, enquanto os fatores simples cruzam em $-2$ e $3$.`,
            ),
            fill(
              t`Analise o comportamento no eixo $x$ de $P(x)=(x+3)^2(x-5)^3$:`,
              t`Na raiz $x=-3$ (multiplicidade par), o gráfico ___ o eixo $x$; já na raiz $x=5$ (multiplicidade ímpar), o gráfico ___ o eixo $x$.`,
              ['tangencia', 'cruza'],
              ['não toca', 'explode em', 'ignora'],
              t`Expoente $2$ (par) tangencia; expoente $3$ (ímpar) cruza o eixo com inflexão horizontal.`,
            ),
            gen((rng) => {
              const r1 = randInt(rng, -5, -2);
              const r2 = randInt(rng, -1, 2);
              const r3 = randInt(rng, 3, 6);
              return num(
                t`Em qual valor de $x$ o gráfico de $P(x)=(${xm(r1)})(${xm(r2)})^2(${xm(r3)})^3$ **tangencia** o eixo $x$ sem atravessá-lo?`,
                r2,
                t`Apenas o fator $(${xm(r2)})^2$ tem expoente **par** ($2$). Em $x=${r1}$ (mult. $1$) e $x=${r3}$ (mult. $3$) o gráfico atravessa o eixo.`,
              );
            }),
            gen((rng) => {
              const r1 = randInt(rng, -4, -1);
              const r2 = randInt(rng, 1, 5);
              return rmcq(
                rng,
                t`Qual polinômio de grau $3$ e coeficiente líder $1$ **cruza** o eixo $x$ em $x=${r1}$ e **tangencia** o eixo $x$ em $x=${r2}$?`,
                t`$(${xm(r1)})(${xm(r2)})^2$`,
                [
                  t`$(${xm(r1)})^2(${xm(r2)})$`,
                  t`$(${xm(r1)})(${xm(r2)})$`,
                  t`$(${xm(-r1)})(${xm(-r2)})^2$`,
                  t`$(${xm(r1)})^2(${xm(r2)})^2$`,
                ],
                t`Cruzar em $${r1}$ pede multiplicidade ímpar ($1$); tangenciar em $${r2}$ pede multiplicidade par ($2$).`,
              );
            }),
            tf(
              t`Em $P(x)=(x-2)^3$, como a raiz $x=2$ tem multiplicidade $3>1$, o gráfico bate no eixo $x$ e volta para o mesmo lado.`,
              false,
              t`Como $3$ é **ímpar**, $(x-2)^3$ é negativo antes de $2$ e positivo depois: o gráfico **atravessa** o eixo $x$ (achatando na passagem).`,
            ),
            gen((rng) => {
              const a = randInt(rng, -4, 0);
              const b = randInt(rng, 1, 5);
              return rmcq(
                rng,
                t`Qual é o conjunto solução da inequação $(${xm(a)})^2(${xm(b)})>0$?`,
                t`$x>${b}$`,
                [t`$x<${a}$ ou $x>${b}$`, t`$${a}<x<${b}$`, t`$x>${a}$ com $x\ne ${b}$`, t`$x<${b}$`],
                t`Para $x\ne ${a}$, o quadrado $(${xm(a)})^2$ é sempre positivo (não troca de sinal em $${a}$!). Logo o produto é positivo quando $${xm(b)}>0\iff x>${b}$.`,
              );
            }),
            multi(
              t`Sobre o polinômio $P(x)=-3x(x+4)^2(x-2)^3$, quais afirmações são **verdadeiras**?`,
              [
                'As raízes reais são $0$, $-4$ e $2$',
                'O gráfico tangencia o eixo $x$ em $x=-4$',
                'O gráfico cruza o eixo $x$ em $x=0$ e em $x=2$',
                'O grau do polinômio é $5$',
                'Quando $x\\to +\\infty$, $P(x)\\to +\\infty$',
              ],
              [0, 1, 2],
              t`Raízes: $0$ (mult. 1, cruza), $-4$ (mult. 2, tangencia) e $2$ (mult. 3, cruza). O grau é $1+2+3=6$ e, como $-3<0$, $P(x)\to -\infty$ quando $x\to\pm\infty$.`,
            ),
          ],
        },
        {
          card: {
            title: 'Voltas, raízes e leitura do gráfico',
            body: t`Todo polinômio de grau $n\ge 1$ obedece a dois limites geométricos:
• **Raízes reais**: no máximo **$n$** (contando multiplicidades). Se $n$ é **ímpar**, há **pelo menos 1** raiz real.
• **Mudanças de direção ("voltas" / extremos locais)**: no máximo **$n-1$**.

**Do gráfico para a fórmula**:
1. Leia as raízes $r_i$ e suas multiplicidades ($1$ se cruza, $2$ se tangencia).
2. Monte $P(x)=a(x-r_1)^{m_1}(x-r_2)^{m_2}\cdots$
3. Substitua um ponto extra (como $P(0)$ no eixo $y$) para encontrar $a$.`,
            example: t`Um gráfico de grau $3$ cruza o eixo $x$ em $-1$, tangencia em $2$ e passa por $(0,\,8)$: $P(x)=a(x+1)(x-2)^2$. Como $P(0)=a(1)(4)=8\Rightarrow a=2$.`,
            tip: t`A diferença entre o grau $n$ e o número de voltas é sempre um número par: uma cúbica ($n=3$) tem $2$ voltas ou $0$ voltas.`,
          },
          exercises: [
            gen((rng) => {
              const n = randInt(rng, 3, 8);
              return num(
                t`Qual é o número **máximo** de extremos locais ("voltas" de máximo ou mínimo local) que o gráfico de um polinômio de grau $${n}$ pode ter?`,
                n - 1,
                t`Um polinômio de grau $n$ muda de direção no máximo $n-1=${n - 1}$ vezes.`,
              );
            }),
            mcq(
              t`O gráfico de um polinômio apresenta $3$ extremos locais ($3$ "voltas" completas). Qual é o **menor** grau possível desse polinômio?`,
              ['$4$', '$3$', '$2$', '$5$'],
              0,
              t`Para ter $k$ voltas, o grau precisa satisfazer $n-1\ge k\Rightarrow n\ge 3+1=4$.`,
            ),
            tf(
              t`Todo polinômio de grau **ímpar** com coeficientes reais possui **pelo menos uma** raiz real.`,
              true,
              t`Como uma ponta vai para $-\infty$ e a outra para $+\infty$, por continuidade o gráfico cruza obrigatoriamente o eixo $x$ ao menos uma vez.`,
            ),
            order(
              t`Ordene os passos para esboçar o gráfico de um polinômio $P(x)$ a partir da forma fatorada:`,
              [
                'Determinar o grau $n$, o sinal de $a_n$ e o comportamento nas extremidades',
                'Calcular $P(0)$ para marcar onde corta o eixo $y$',
                'Marcar as raízes no eixo $x$ e identificar a multiplicidade de cada uma',
                'Traçar a curva contínua cruzando nas raízes ímpares e tangenciando nas pares',
              ],
              t`Extremidades, corte no eixo $y$ e raízes com multiplicidades determinam todo o esboço qualitativo.`,
            ),
            gen((rng) => {
              const r1 = pick(rng, [-3, -2, -1]);
              const r2 = pick(rng, [1, 2, 3]);
              const a = randNZ(rng, -3, 3);
              const k0 = -r1 * r2 * r2;
              const y0 = a * k0;
              return num(
                t`Um polinômio de grau $3$ tem a forma $P(x)=a(${xm(r1)})(${xm(r2)})^2$ e seu gráfico corta o eixo $y$ em $(0,\,${y0})$. Quanto vale o coeficiente $a$?`,
                a,
                t`Substituindo $x=0$: $P(0)=a(${-r1})(${-r2})^2=${k0}a=${y0}\Rightarrow a=${a}$.`,
              );
            }),
            gen((rng) => {
              const a = randNZ(rng, -3, 4);
              const y0 = 2 * a;
              return num(
                t`Um polinômio de grau $3$ tem raízes em $-1$, $1$ e $2$, e corta o eixo $y$ em $(0,\,${y0})$. Quanto vale $P(3)$?`,
                8 * a,
                t`$P(x)=a(x+1)(x-1)(x-2)$. Como $P(0)=a(1)(-1)(-2)=2a=${y0}\Rightarrow a=${a}$. Logo $P(3)=${a}(4)(2)(1)=${8 * a}$.`,
              );
            }),
            mcqS(
              t`Um polinômio de grau $4$ com coeficientes reais tem uma única raiz real em $x=2$, de multiplicidade $2$. Quantas outras raízes **reais** ele possui?`,
              t`Nenhuma (as outras duas são complexas não reais)`,
              [t`Duas raízes reais simples`, t`Mais uma raiz real dupla`, t`Quatro raízes reais`, t`Uma única raiz real simples`],
              t`Como $x=2$ é a única raiz real (ex.: $P(x)=(x-2)^2(x^2+1)$), o fator de 2º grau restante tem $\Delta<0$ e não zera nos reais.`,
            ),
            mcqS(
              t`Qual expressão pode representar um polinômio cujo gráfico sobe para $+\infty$ à esquerda ($x\to -\infty$), desce para $-\infty$ à direita ($x\to +\infty$), tangencia o eixo $x$ na origem e cruza em $x=3$?`,
              t`$P(x)=-x^2(x-3)$`,
              [t`$P(x)=x^2(x-3)$`, t`$P(x)=-x(x-3)^2$`, t`$P(x)=-x^2(x+3)$`, t`$P(x)=x(x-3)^2$`],
              t`Tangenciar em $0$ exige $x^2$; cruzar em $3$ exige $(x-3)$. Grau $3$ descendo para $-\infty$ à direita exige coeficiente líder negativo: $-x^2(x-3)$.`,
            ),
          ],
        },
      ],
    },
    {
      id: 'p-func-rac',
      title: 'Funções racionais e assíntotas',
      parts: [
        {
          card: {
            title: 'Assíntotas verticais × buracos',
            body: t`Uma **função racional** é um quociente de polinômios $f(x)=\dfrac{P(x)}{Q(x)}$.
• **Domínio**: $\{x\in\mathbb R : Q(x)\ne 0\}$ (olhe **antes** de simplificar!).
• Num zero $x=c$ do denominador $Q(c)=0$:
  1. Se $(x-c)$ **sobra no denominador** após simplificar ($P(c)\ne 0$): $|f(x)|\to\infty$ e a reta $x=c$ é uma **assíntota vertical (AV)**.
  2. Se $(x-c)$ **cancela** completamente do denominador: o gráfico não explode; tem apenas um **buraco** em $(c,\,L)$, onde $L$ é o valor na fração simplificada.`,
            visual: rationalLab(),
            example: t`Em $f(x)=\dfrac{x-2}{x^2-4}=\dfrac{x-2}{(x-2)(x+2)}=\dfrac{1}{x+2}$ ($x\ne 2$), há um **buraco** em $(2,\,\frac{1}{4})$ e uma **assíntota vertical** em $x=-2$.`,
          },
          exercises: [
            gen((rng) => {
              const c = randNZ(rng, -7, 7);
              const a = randNZ(rng, -5, 5);
              return num(
                t`Em qual valor de $x$ está a assíntota vertical de $f(x)=\dfrac{${a}}{${xm(c)}}$?`,
                c,
                t`O denominador zera em $${xm(c)}=0\iff x=${c}$ e o numerador vale $${a}\ne 0$.`,
              );
            }),
            inter(
              t`Ajuste o controle $c$ em $f(x)=\dfrac{x+2}{x-c}$ para que a **assíntota vertical** (reta tracejada vermelha) fique em $x=-3$.`,
              'plot',
              rationalLab({ a: 1, b: 2, c: 1 }).props,
              (v: any) => v && near(v.p.c, -3, 0.05),
              t`$c=-3$ (denominador $x+3$).`,
              t`Em $f(x)=\frac{x+2}{x-c}$, o denominador anula-se em $x=c=-3$ (e o numerador vale $-1\ne 0$).`,
            ),
            tf(
              t`A função $f(x)=\dfrac{x-3}{x^2-9}$ possui duas assíntotas verticais: $x=3$ e $x=-3$.`,
              false,
              t`Como $x^2-9=(x-3)(x+3)$, o fator $(x-3)$ cancela: em $x=3$ há apenas um **buraco** $(3,\,\frac{1}{6})$, e a única assíntota vertical é $x=-3$.`,
            ),
            gen((rng) => {
              const r1 = randInt(rng, -5, 1);
              const r2 = r1 + randInt(rng, 1, 5);
              return rmcq(
                rng,
                t`Na função $f(x)=\dfrac{${xm(r1)}}{(${xm(r1)})(${xm(r2)})}$, o que ocorre no gráfico em $x=${r1}$ e em $x=${r2}$?`,
                t`Buraco em $x=${r1}$ e assíntota vertical em $x=${r2}$`,
                [
                  t`Assíntota vertical em $x=${r1}$ e buraco em $x=${r2}$`,
                  t`Assíntotas verticais em $x=${r1}$ e em $x=${r2}$`,
                  t`Buracos em $x=${r1}$ e em $x=${r2}$`,
                  t`Raiz em $x=${r1}$ e assíntota vertical em $x=${r2}$`,
                ],
                t`O fator $(${xm(r1)})$ cancela (buraco em $x=${r1}$); o fator $(${xm(r2)})$ permanece no denominador (assíntota vertical em $x=${r2}$).`,
              );
            }),
            gen((rng) => {
              const r = randNZ(rng, -6, 6);
              return num(
                t`O gráfico de $f(x)=\dfrac{x^2-${r * r}}{${xm(r)}}$ é uma reta com um **buraco** em $x=${r}$. Qual é a ordenada $y$ desse buraco?`,
                2 * r,
                t`Para $x\ne ${r}$, $\frac{(${xm(r)})(${xm(-r)})}{${xm(r)}}=${xm(-r)}$. Em $x=${r}$, a altura do buraco é $${r}+(${r})=${2 * r}$.`,
              );
            }),
            mcqS(
              t`Quantas assíntotas verticais possui o gráfico de $f(x)=\dfrac{2x-1}{x^2+4}$?`,
              t`Nenhuma`,
              [t`Duas ($x=-2$ e $x=2$)`, t`Uma ($x=-4$)`, t`Uma ($x=\frac{1}{2}$)`, t`Três`],
              t`Como $x^2+4\ge 4>0$ para todo $x\in\mathbb R$, o denominador nunca zera.`,
            ),
            match(
              t`Para $f(x)=\dfrac{(x-1)(x+2)}{(x-1)(x-4)}$, ligue cada elemento à resposta correta:`,
              [
                [t`Domínio de $f$`, t`$\mathbb R-\{1,\,4\}$`],
                [t`Assíntota vertical`, t`$x=4$`],
                [t`Abscissa do buraco`, t`$x=1$`],
                [t`Raiz (corte no eixo $x$)`, t`$x=-2$`],
              ],
              t`O domínio exclui $1$ e $4$; $(x-1)$ cancela (buraco em $1$); $(x-4)$ sobra embaixo (AV em $4$); $(x+2)$ sobra em cima (raiz em $-2$).`,
            ),
            gen((rng) => {
              const r1 = randInt(rng, -5, 0);
              const r2 = randInt(rng, 1, 6);
              return num(
                t`Em qual valor de $x$ o gráfico de $f(x)=\dfrac{(${xm(r1)})(${xm(r2)})}{${xm(r2)}}$ corta o eixo $x$ (raiz da função)?`,
                r1,
                t`O numerador zera em $${r1}$ e $${r2}$, mas $x=${r2}$ não pertence ao domínio (é um buraco). Portanto a única raiz é $x=${r1}$.`,
              );
            }),
          ],
        },
        {
          card: {
            title: 'Assíntota horizontal: duelo de graus',
            body: t`Para achar a **assíntota horizontal (AH)** de $f(x)=\dfrac{a_nx^n+\dots+a_0}{b_mx^m+\dots+b_0}$, compare o grau $n$ de cima com o grau $m$ de baixo quando $x\to\pm\infty$:

• **$n<m$** (grau de baixo maior): $f(x)\to 0\implies$ AH é **$y=0$** (eixo $x$).
• **$n=m$** (graus iguais): $f(x)\to\dfrac{a_n}{b_m}\implies$ AH é **$y=\dfrac{a_n}{b_m}$** (razão dos líderes).
• **$n>m$** (grau de cima maior): $|f(x)|\to\infty\implies$ **não há** assíntota horizontal.`,
            visual: rationalLab({ a: 2, b: -1, c: 1 }),
            tip: t`Ao contrário da assíntota vertical (que o gráfico nunca toca), uma curva **pode** cruzar sua assíntota horizontal para valores pequenos de $x$ — ela só dita o comportamento em $x\to\pm\infty$.`,
          },
          exercises: [
            mcq(
              t`Qual é a assíntota horizontal de $f(x)=\dfrac{5x+1}{x^2+3}$?`,
              ['$y=0$', '$y=5$', '$y=\\frac{1}{3}$', 'Não tem assíntota horizontal'],
              0,
              t`Grau do numerador ($1$) menor que o do denominador ($2$): quando $x\to\pm\infty$, a fração tende a $0$.`,
            ),
            gen((rng) => {
              const q = pick(rng, [-3, -2, -1, 1.5, 2, 2.5, 3, 4]);
              const bm = 2;
              const an = 2 * q;
              const deg = pick(rng, [1, 2, 3]);
              return num(
                t`Qual é o valor de $k$ na assíntota horizontal $y=k$ de $f(x)=\dfrac{${an}x^{${deg}}-5}{${bm}x^{${deg}}+3}$?`,
                q,
                t`Como os graus são iguais ($${deg}$), a assíntota horizontal é a razão dos coeficientes líderes: $y=\frac{${an}}{${bm}}=${fmt(q)}$.`,
              );
            }),
            inter(
              t`Em $f(x)=\dfrac{ax+2}{x-c}$, ajuste $a$ e $c$ para que a função tenha **assíntota vertical** em $x=2$ e **assíntota horizontal** em $y=-1$.`,
              'plot',
              rationalLab({ a: 1, b: 2, c: -1 }).props,
              (v: any) => v && near(v.p.a, -1, 0.05) && near(v.p.c, 2, 0.05),
              t`$a=-1$ e $c=2$.`,
              t`A assíntota vertical fica em $x=c=2$ e a horizontal (graus iguais a $1$) em $y=\frac{a}{1}=a=-1$.`,
            ),
            match(
              t`Ligue cada função racional à sua assíntota horizontal (ou ausência dela):`,
              [
                [t`$f(x)=\dfrac{3}{x^2+1}$`, t`$y=0$`],
                [t`$f(x)=\dfrac{6x^2+1}{2x^2-5}$`, t`$y=3$`],
                [t`$f(x)=\dfrac{-4x+7}{2x+1}$`, t`$y=-2$`],
                [t`$f(x)=\dfrac{x^3+1}{x^2+1}$`, t`Não possui assíntota horizontal`],
              ],
              t`Compare os graus: $0<2\Rightarrow y=0$; graus iguais $\Rightarrow$ razão dos líderes ($\frac{6}{2}=3$ e $\frac{-4}{2}=-2$); $3>2\Rightarrow$ sem AH.`,
            ),
            gen((rng) => {
              const c = pick(rng, [-4, -3, -2, 2, 3, 4]);
              const k = pick(rng, [-5, -1, 1, 5]);
              const d = pick(rng, [-6, -2, 2, 6]);
              return rmcq(
                rng,
                t`Quais são as assíntotas vertical (AV) e horizontal (AH) da hipérbole deslocada $f(x)=${k}${term(d, `\\dfrac{1}{${xm(c)}}`)}$?`,
                t`AV: $x=${c}$ e AH: $y=${k}$`,
                [
                  t`AV: $x=${-c}$ e AH: $y=${k}$`,
                  t`AV: $x=${k}$ e AH: $y=${c}$`,
                  t`AV: $x=${c}$ e AH: $y=${d}$`,
                  t`AV: $x=${c}$ e AH: $y=0$`,
                ],
                t`Quando $x\to ${c}$, a fração explode (AV: $x=${c}$); quando $x\to\pm\infty$, a fração vai a $0$ e sobra $y=${k}$ (AH).`,
              );
            }),
            tf(
              t`O gráfico de uma função racional nunca pode cruzar sua assíntota horizontal.`,
              false,
              t`Ele pode cruzar a assíntota horizontal para valores finitos de $x$ (ex.: $f(x)=\frac{x}{x^2+1}$ tem AH $y=0$ e passa por $(0,\,0)$). O que nunca é cruzado é uma assíntota **vertical**.`,
            ),
            gen((rng) => {
              const M = pick(rng, [40, 50, 80, 100, 120]);
              const T = randInt(rng, 2, 10);
              return num(
                t`A concentração (em mg/L) de um reagente num reator após $t$ minutos é $C(t)=\dfrac{${M}t}{t+${T}}$. Qual é a concentração limite (assíntota horizontal) quando $t\to\infty$?`,
                M,
                t`Numerador e denominador têm grau $1$: quando $t\to\infty$, $C(t)\to\frac{${M}}{1}=${M}$ mg/L.`,
                { unit: 'mg/L' },
              );
            }),
            gen((rng) => {
              const c = randInt(rng, 1, 4);
              const a = randInt(rng, 2, 5);
              const r = randInt(rng, -4, -1);
              return rmcq(
                rng,
                t`Qual função racional possui assíntota vertical $x=${c}$, assíntota horizontal $y=${a}$ e raiz $x=${r}$?`,
                t`$f(x)=\dfrac{${a}(${xm(r)})}{${xm(c)}}$`,
                [
                  t`$f(x)=\dfrac{${a}(${xm(c)})}{${xm(r)}}$`,
                  t`$f(x)=\dfrac{${xm(r)}}{${a}(${xm(c)})}$`,
                  t`$f(x)=\dfrac{${a}(${xm(-r)})}{${xm(-c)}}$`,
                  t`$f(x)=\dfrac{${a}x}{${xm(c)}}$`,
                ],
                t`Denominador zera na AV ($x=${c}$), numerador zera na raiz ($x=${r}$) e a razão dos coeficientes líderes vale $${a}$ (AH).`,
              );
            }),
          ],
        },
        {
          card: {
            title: 'Assíntota oblíqua e esboço completo',
            body: t`Quando o grau do numerador supera o do denominador em **exatamente 1** ($\operatorname{grau}(P)=\operatorname{grau}(Q)+1$), dividimos $P(x)$ por $Q(x)$:

$$f(x)=\frac{P(x)}{Q(x)}=\underbrace{mx+q}_{\text{quociente}}+\underbrace{\frac{R(x)}{Q(x)}}_{\to 0\text{ quando }x\to\pm\infty}$$

Quando $x\to\pm\infty$, a fração do resto desaparece e o gráfico cola na reta **$y=mx+q$**, chamada **assíntota oblíqua**!`,
            visual: obliqueLab(),
            example: t`Em $f(x)=\dfrac{x^2+2x+3}{x}=x+2+\dfrac{3}{x}$, quando $x\to\pm\infty$ temos $\frac{3}{x}\to 0$, logo a assíntota oblíqua é $y=x+2$.`,
            tip: t`Uma função racional tem assíntota horizontal **ou** oblíqua, nunca as duas ao mesmo tempo.`,
          },
          exercises: [
            mcq(
              t`Em qual condição sobre os graus do numerador ($n$) e do denominador ($m$) uma função racional possui **assíntota oblíqua**?`,
              ['$n=m+1$ (grau de cima supera o de baixo em $1$)', '$n=m$ (graus iguais)', '$n<m$ (grau de baixo maior)', '$n=m+2$ (diferença de $2$ graus)'],
              0,
              t`Quando $n=m+1$, o quociente da divisão polinomial $P(x)\div Q(x)$ é um polinômio de 1º grau $mx+q$.`,
            ),
            inter(
              t`Ajuste $m$ e $c$ em $f(x)=mx+1+\dfrac{1}{x-c}$ para que a **assíntota oblíqua** tenha inclinação $m=0{,}5$ e a **assíntota vertical** fique em $x=-1$.`,
              'plot',
              obliqueLab().props,
              (v: any) => v && near(v.p.m, 0.5, 0.05) && near(v.p.c, -1, 0.05),
              t`$m=0{,}5$ e $c=-1$.`,
              t`A reta tracejada dourada $y=0{,}5x+1$ é a assíntota oblíqua e $x=-1$ é a assíntota vertical.`,
            ),
            gen((rng) => {
              const m = pick(rng, [-3, -2, 2, 3]);
              const q = pick(rng, [-4, -1, 1, 4]);
              const r = pick(rng, [-5, -2, 2, 5]);
              return rmcq(
                rng,
                t`Qual é a assíntota oblíqua de $f(x)=\dfrac{${polyTex([r, q, m])}}{x}$?`,
                t`$y=${polyTex([q, m])}$`,
                [t`$y=${m}x$`, t`$y=${polyTex([r, m])}$`, t`$y=${polyTex([-q, m])}$`, t`$y=${m}$`],
                t`Separando a divisão por $x$: $f(x)=${polyTex([q, m])}+\frac{${r}}{x}$. Quando $x\to\pm\infty$, $\frac{${r}}{x}\to 0$ e sobra a reta $y=${polyTex([q, m])}$.`,
              );
            }),
            gen((rng) => {
              const m = randInt(rng, 1, 3);
              const q = randNZ(rng, -4, 4);
              const c = randNZ(rng, -3, 3);
              const rem = randNZ(rng, 1, 5);
              const c0 = rem - q * c;
              const c1 = q - m * c;
              return num(
                t`Dividindo o numerador pelo denominador em $f(x)=\dfrac{${polyTex([c0, c1, m])}}{${xm(c)}}$, obtemos a assíntota oblíqua $y=mx+q$. Quanto vale o coeficiente linear $q$?`,
                q,
                t`Como $${polyTex([c0, c1, m])}=(${polyTex([q, m])})(${xm(c)})+${rem}$, temos $f(x)=${polyTex([q, m])}+\frac{${rem}}{${xm(c)}}$, logo $q=${q}$.`,
              );
            }),
            fill(
              t`Complete o resumo do comportamento no infinito de $f(x)=\dfrac{P(x)}{Q(x)}$:`,
              t`Se $\operatorname{grau}(P)<\operatorname{grau}(Q)$, a assíntota é ___; se $\operatorname{grau}(P)=\operatorname{grau}(Q)$, é a razão dos ___; se $\operatorname{grau}(P)=\operatorname{grau}(Q)+1$, há uma assíntota ___.`,
              ['y = 0', 'coeficientes líderes', 'oblíqua'],
              ['vertical', 'termos independentes', 'parabólica'],
              t`Os três casos: grau menor dá $y=0$; graus iguais dão a razão dos coeficientes líderes; grau $1$ unidade maior dá assíntota oblíqua.`,
            ),
            order(
              t`Ordene o roteiro completo para esboçar o gráfico de uma função racional $f(x)=\dfrac{P(x)}{Q(x)}$:`,
              [
                'Fatorar $P(x)$ e $Q(x)$ e explicitar o domínio ($Q(x)\\ne 0$)',
                'Simplificar fatores comuns (anotando os buracos) e achar as assíntotas verticais',
                'Determinar as interseções com os eixos ($f(0)$ e raízes de $P$)',
                'Achar a assíntota horizontal ou oblíqua e traçar os ramos da curva',
              ],
              t`Seguir essa ordem evita confundir buracos com assíntotas verticais ou com raízes.`,
            ),
            multi(
              t`Considere $f(x)=\dfrac{x^2-1}{x-2}$. Quais afirmações sobre seu gráfico são **verdadeiras**?`,
              [
                'Possui assíntota vertical em $x=2$',
                'Corta o eixo $x$ em $x=-1$ e em $x=1$',
                'Corta o eixo $y$ em $(0,\\,\\frac{1}{2})$',
                'Possui assíntota oblíqua $y=x+2$',
                'Possui assíntota horizontal $y=1$',
              ],
              [0, 1, 2, 3],
              t`Denominador zera em $2$ (AV); numerador zera em $\pm 1$ (raízes); $f(0)=\frac{-1}{-2}=\frac{1}{2}$; e $\frac{x^2-1}{x-2}=x+2+\frac{3}{x-2}$ dá a assíntota oblíqua $y=x+2$ (sem AH).`,
            ),
            gen((rng) => {
              const F = pick(rng, [1000, 2000, 5000]);
              const c = pick(rng, [12, 15, 25, 40]);
              return num(
                t`Uma fábrica tem custo total $C(x)=${F}+${c}x$ reais para produzir $x$ peças. O **custo médio por peça** é $\bar{C}(x)=\dfrac{${F}+${c}x}{x}$. Para qual valor (em R\$) tende o custo médio quando $x\to\infty$?`,
                c,
                t`$\bar{C}(x)=\frac{${F}}{x}+${c}$. Quando $x\to\infty$, o custo fixo por peça $\frac{${F}}{x}\to 0$ e o custo médio tende à assíntota horizontal $y=${c}$ reais.`,
                { unit: 'R$' },
              );
            }),
          ],
        },
      ],
    },
  ],
};

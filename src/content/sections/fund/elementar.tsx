import React from 'react';
import type { Unit } from '../../types';
import { gen, mcq, mcqS, num, tf, fill, match, order, inter, plot, rmcq, near } from '../../helpers';
import { FnCurve, Pt, Seg, RectW, Label, PolygonW } from '../../../components/plot/Plot';
import { C } from '../../../theme';
import { fmt, pick, randInt } from '../../../lib/random';

const t = String.raw;

const powerPlot = (target?: number) =>
  plot({
    view: { xMin: -3.5, xMax: 4.5, yMin: -1, yMax: 17 },
    params: [{ key: 'a', label: 'a', min: 0.5, max: 3, step: 0.05, value: 1.5, color: C.p1 }],
    render: ({ p }: any) => (
      <>
        {target ? <Seg x1={-3.5} y1={target} x2={4.5} y2={target} color={C.gold} dash="6 5" /> : null}
        <FnCurve f={(x) => Math.pow(p.a, x)} color={C.p1} />
        {[-2, -1, 0, 1, 2, 3, 4].map((n) => (
          <Pt key={n} x={n} y={Math.pow(p.a, n)} color={n === 3 && target ? C.gold : C.p2} r={5} />
        ))}
      </>
    ),
    info: ({ p }: any) => t`$a^{-1}=${fmt(1 / p.a, 3)}$  ·  $a^{0}=1$  ·  $a^{2}=${fmt(p.a ** 2, 3)}$  ·  $a^{3}=${fmt(p.a ** 3, 3)}$`,
  });

const squarePlot = () =>
  plot(
    {
      view: { xMin: -0.5, xMax: 6.5, yMin: -0.5, yMax: 6.5 },
      equalAspect: true,
      params: [{ key: 'A', label: 'A', min: 0, max: 36, step: 0.5, value: 4, color: C.p2 }],
      render: ({ p }: any) => {
        const s = Math.sqrt(p.A);
        return (
          <>
            <RectW x={0} y={0} w={s} h={s} color={C.p2} opacity={0.35} />
            <Label x={s / 2} y={-0.1} text={`lado = ${fmt(s, 3)}`} anchor="middle" dy={14} color={C.p2} />
            <Label x={s / 2} y={s / 2} text={`área ${fmt(p.A, 2)}`} anchor="middle" color={C.text} />
          </>
        );
      },
      info: ({ p }: any) => t`Área $A=${fmt(p.A, 2)}$  ⟹  lado $=\sqrt{A}=${fmt(Math.sqrt(p.A), 4)}$`,
    },
    260,
  );

const percentGrid = (withTarget = false) =>
  plot(
    {
      view: { xMin: 0, xMax: 10, yMin: 0, yMax: 10 },
      equalAspect: true,
      grid: false,
      tickLabels: false,
      params: [
        { key: 'p', label: t`\%`, min: 0, max: 100, step: 1, value: withTarget ? 10 : 25, color: C.success },
        ...(withTarget ? [] : [{ key: 'V', label: 'V', min: 0, max: 500, step: 10, value: 200, color: C.p3 }]),
      ],
      render: ({ p }: any) => {
        const cells = [];
        for (let i = 0; i < 100; i++) {
          const r = Math.floor(i / 10);
          const c = i % 10;
          cells.push(<RectW key={i} x={c + 0.06} y={9 - r + 0.06} w={0.88} h={0.88} color={i < p.p ? C.success : C.surface3} opacity={i < p.p ? 0.9 : 0.6} />);
        }
        return <>{cells}</>;
      },
      info: withTarget ? ({ p }: any) => t`Pintado: $${p.p}\%$ $=\frac{${p.p}}{100}$` : ({ p }: any) => t`$${p.p}\%$ de $${p.V}$ $=\frac{${p.p}}{100}\cdot ${p.V} = ${fmt((p.p * p.V) / 100, 2)}$`,
    },
    260,
  );

export const elementar: Unit = {
  id: 'f-elem',
  title: 'Matemática Elementar',
  subtitle: 'Potências, raízes, proporção e porcentagem',
  icon: '🔢',
  source: 'Competências Básicas · Matemática Elementar',
  guide: t`A base de toda conta de engenharia. Domine **propriedades das potências**, **raízes como potências fracionárias**, **regra de três** e **porcentagem como fator multiplicativo**.`,
  lessons: [
    {
      id: 'f-elem-pot',
      title: 'Potenciação',
      cards: [
        {
          title: 'Multiplicação repetida',
          body: t`Uma potência é uma **multiplicação repetida** da base por ela mesma:

$$a^n=\underbrace{a\cdot a\cdots a}_{n\ \text{vezes}}$$

$a$ é a **base** e $n$ é o **expoente**. Por exemplo, $2^5=2\cdot2\cdot2\cdot2\cdot2=32$.

Mexa no controle e veja: com $a>1$ a potência **cresce muito rápido**; com $0<a<1$ ela **encolhe**.`,
          visual: powerPlot(),
          tip: t`Cuidado com o sinal: $(-3)^2=9$, mas $-3^2=-(3^2)=-9$. O expoente só "pega" o que está colado nele.`,
        },
        {
          title: 'As propriedades',
          body: t`Com a **mesma base**, multiplicar soma os expoentes e dividir subtrai:

$$a^m\cdot a^n=a^{m+n}\qquad \frac{a^m}{a^n}=a^{m-n}$$

Potência de potência multiplica, e o expoente se distribui no produto:

$$(a^m)^n=a^{m\cdot n}\qquad (a\cdot b)^n=a^n\cdot b^n$$`,
          example: t`$\dfrac{x^7\cdot x^2}{x^4}=x^{7+2-4}=x^5$ e $(2x^3)^2=4x^6$.`,
        },
        {
          title: 'Expoente zero e negativo',
          body: t`Pela regra da divisão, $\frac{a^3}{a^3}=a^{0}$, mas também vale $1$. Então $a^0=1$ (com $a\neq0$).

Expoente negativo **inverte** a base:

$$a^{-n}=\frac{1}{a^n}\qquad \left(\frac{2}{3}\right)^{-2}=\left(\frac{3}{2}\right)^{2}=\frac{9}{4}$$`,
          tip: t`Notação científica usa potências de 10: $0{,}00045=4{,}5\times10^{-4}$ e $320\,000=3{,}2\times10^{5}$.`,
        },
      ],
      exercises: [
        gen((rng) => {
          const a = randInt(rng, 2, 5);
          const n = a <= 3 ? randInt(rng, 2, 5) : randInt(rng, 2, 3);
          return num(t`Calcule $${a}^{${n}}$.`, a ** n, t`$${a}^{${n}}$ é $${a}$ multiplicado por ele mesmo $${n}$ vezes $=${a ** n}$.`);
        }),
        gen((rng) => {
          const m = randInt(rng, 2, 9);
          const n = randInt(rng, 2, 9);
          return rmcq(rng, t`Simplifique $x^{${m}}\cdot x^{${n}}$.`, t`$x^{${m + n}}$`, [t`$x^{${m * n}}$`, t`$x^{${Math.abs(m - n)}}$`, t`$2x^{${m + n}}$`, t`$x^{${m}${n}}$`], t`Mesma base na multiplicação: **somamos** os expoentes, $${m}+${n}=${m + n}$.`);
        }),
        gen((rng) => {
          const m = randInt(rng, 6, 12);
          const n = randInt(rng, 2, 5);
          return rmcq(rng, t`Simplifique $\dfrac{y^{${m}}}{y^{${n}}}$.`, t`$y^{${m - n}}$`, [t`$y^{${m + n}}$`, t`$y^{${m * n}}$`, t`$\frac{${m}}{${n}}y$`, t`$1$`], t`Na divisão de mesma base, **subtraímos** os expoentes: $${m}-${n}=${m - n}$.`);
        }),
        tf(t`$(-2)^4=-16$`, false, t`Expoente par com base negativa dá resultado **positivo**: $(-2)^4=16$. Já $-2^4=-16$.`),
        fill(t`Complete a propriedade:`, t`$(a^3)^4=a^{\,}$___ e $a^3\cdot a^4=a^{\,}$___`, ['12', '7'], ['81', '1', '34'], t`Potência de potência **multiplica** ($3\cdot4=12$); produto de mesma base **soma** ($3+4=7$).`),
        num(t`Quanto vale $2^{-3}$? (pode responder em fração)`, 0.125, t`$2^{-3}=\frac{1}{2^3}=\frac18=0{,}125$.`),
        mcqS(t`Qual é o valor de $\left(\frac{1}{5}\right)^{-2}$?`, '$25$', ['$\\frac{1}{25}$', '$-25$', '$-\\frac{1}{10}$'], t`Expoente negativo inverte a base: $\left(\frac15\right)^{-2}=5^2=25$.`),
        mcqS(t`Escreva $0{,}00045$ em notação científica.`, t`$4{,}5\times10^{-4}$`, [t`$4{,}5\times10^{4}$`, t`$45\times10^{-3}$`, t`$4{,}5\times10^{-5}$`], t`Andamos a vírgula 4 casas para a direita, então o expoente é $-4$ (e $45\times10^{-5}$ também vale, mas não está na forma com 1 algarismo antes da vírgula).`),
        inter(t`Ajuste a base $a$ até que $a^{3}=8$ (o ponto dourado precisa tocar a linha tracejada).`, 'plot', powerPlot(8).props, (v) => v && near(v.p.a, 2, 0.06), t`$a=2$, pois $2^3=8$.`, t`A raiz cúbica de 8 é 2: $\sqrt[3]{8}=2$.`),
      ],
    },
    {
      id: 'f-elem-raiz',
      title: 'Radiciação',
      cards: [
        {
          title: 'A operação inversa',
          body: t`A raiz desfaz a potência:

$$\sqrt[n]{a}=b\iff b^n=a$$

$\sqrt{9}=3$ porque $3^2=9$; $\sqrt[3]{-8}=-2$ porque $(-2)^3=-8$. Geometricamente, $\sqrt{A}$ é o **lado** de um quadrado de área $A$:`,
          visual: squarePlot(),
        },
        {
          title: 'Raiz = expoente fracionário',
          body: t`Toda raiz pode ser escrita como potência:

$$\sqrt[n]{a^m}=a^{\frac{m}{n}}$$

Assim todas as propriedades das potências valem para raízes!`,
          example: t`$8^{2/3}=\left(\sqrt[3]{8}\right)^2=2^2=4$ e $\sqrt{x}\cdot\sqrt[3]{x}=x^{\frac12+\frac13}=x^{\frac56}$.`,
        },
        {
          title: 'Simplificar e racionalizar',
          body: t`**Simplificar**: tire do radical os fatores que são potências perfeitas.
$$\sqrt{12}=\sqrt{4\cdot3}=2\sqrt3\qquad \sqrt{50}=5\sqrt2$$

**Racionalizar**: tirar a raiz do denominador multiplicando em cima e embaixo:
$$\frac{1}{\sqrt2}=\frac{1}{\sqrt2}\cdot\frac{\sqrt2}{\sqrt2}=\frac{\sqrt2}{2}$$`,
          tip: t`Raiz **não** distribui na soma: $\sqrt{9+16}=\sqrt{25}=5$, mas $\sqrt9+\sqrt{16}=7$.`,
        },
      ],
      exercises: [
        gen((rng) => {
          const k = randInt(rng, 4, 15);
          return num(t`Calcule $\sqrt{${k * k}}$.`, k, t`$${k}^2=${k * k}$, logo $\sqrt{${k * k}}=${k}$.`);
        }),
        gen((rng) => {
          const k = randInt(rng, 2, 5);
          return num(t`Calcule $\sqrt[3]{${k ** 3}}$.`, k, t`$${k}^3=${k ** 3}$.`);
        }),
        gen((rng) => {
          const k = randInt(rng, 2, 6);
          const m = pick(rng, [2, 3, 5, 6, 7]);
          return rmcq(rng, t`Simplifique $\sqrt{${k * k * m}}$.`, t`$${k}\sqrt{${m}}$`, [t`$${m}\sqrt{${k}}$`, t`$${k * m}\sqrt{${k}}$`, t`$${k * k}\sqrt{${m}}$`, t`$\sqrt{${k}}\cdot${m}$`], t`$${k * k * m}=${k * k}\cdot${m}$ e $\sqrt{${k * k}}=${k}$.`);
        }),
        num(t`Quanto vale $16^{3/4}$?`, 8, t`$16^{3/4}=(\sqrt[4]{16})^3=2^3=8$.`),
        tf(t`$\sqrt{9+16}=\sqrt9+\sqrt{16}$`, false, t`Lado esquerdo: $\sqrt{25}=5$. Lado direito: $3+4=7$. A raiz não se distribui na soma.`),
        mcqS(t`Racionalize $\dfrac{2}{\sqrt3}$.`, t`$\dfrac{2\sqrt3}{3}$`, [t`$\dfrac{2}{3}$`, t`$\dfrac{\sqrt3}{2}$`, t`$2\sqrt3$`], t`Multiplique por $\frac{\sqrt3}{\sqrt3}$: $\frac{2\sqrt3}{3}$.`),
        match(t`Ligue cada expressão ao seu valor:`, [
          [t`$\sqrt{49}$`, '$7$'],
          [t`$\sqrt[3]{27}$`, '$3$'],
          [t`$32^{1/5}$`, '$2$'],
          [t`$\sqrt{0{,}25}$`, t`$0{,}5$`],
        ]),
        mcqS(t`Escreva $\sqrt[5]{x^3}$ como potência.`, t`$x^{3/5}$`, [t`$x^{5/3}$`, t`$x^{15}$`, t`$x^{-2}$`], t`$\sqrt[n]{x^m}=x^{m/n}$.`),
        inter(t`Ajuste a área $A$ do quadrado para que o **lado** fique igual a $3$.`, 'plot', squarePlot().props, (v) => v && near(v.p.A, 9, 0.01), t`$A=9$`, t`Lado $3$ ⟹ área $3^2=9$.`),
      ],
    },
    {
      id: 'f-elem-prop',
      title: 'Razão, proporção e regra de três',
      cards: [
        {
          title: 'Razão e proporção',
          body: t`**Razão** compara duas grandezas por divisão: $\frac{a}{b}$. Uma escala $1:100$ significa que $1$ cm no desenho vale $100$ cm reais.

**Proporção** é uma igualdade entre razões, e nela o produto dos meios é igual ao produto dos extremos:

$$\frac{a}{b}=\frac{c}{d}\iff a\cdot d=b\cdot c$$`,
          example: t`$\frac{x}{6}=\frac{10}{15}\Rightarrow 15x=60\Rightarrow x=4$.`,
        },
        {
          title: 'Diretamente proporcionais',
          body: t`Duas grandezas são **diretamente proporcionais** quando a razão entre elas é constante: $y=k\,x$. Dobrou uma, dobra a outra. O gráfico é uma **reta pela origem**.`,
          visual: plot({
            view: { xMin: -0.5, xMax: 6, yMin: -0.5, yMax: 12 },
            params: [{ key: 'k', label: 'k', min: 0.5, max: 4, step: 0.1, value: 2, color: C.p2 }],
            render: ({ p }: any) => (
              <>
                <FnCurve f={(x) => p.k * x} color={C.p2} from={0} />
                {[1, 2, 3, 4, 5].map((x) => (
                  <Pt key={x} x={x} y={p.k * x} color={C.p2} r={5} />
                ))}
              </>
            ),
            info: ({ p }: any) => t`$y=${fmt(p.k)}x$: para $x=1,2,3$ temos $y=${fmt(p.k)},\,${fmt(2 * p.k)},\,${fmt(3 * p.k)}$ — razão $\frac{y}{x}=${fmt(p.k)}$ sempre.`,
          }),
        },
        {
          title: 'Inversamente proporcionais',
          body: t`São **inversamente proporcionais** quando o **produto** é constante: $x\cdot y=k$. Dobrou uma, a outra cai pela metade (mais operários ⟹ menos dias).

Arraste o ponto: a área do retângulo $x\cdot y$ nunca muda!`,
          visual: plot({
            view: { xMin: -0.5, xMax: 12.5, yMin: -0.5, yMax: 12.5 },
            equalAspect: true,
            points: [{ id: 'P', x: 3, y: 4, color: C.gold, label: 'P' }],
            constrain: (_id: string, x: number) => {
              const xx = Math.max(1, Math.min(12, x));
              return { x: xx, y: 12 / xx };
            },
            render: ({ pts }: any) => (
              <>
                <RectW x={0} y={0} w={pts.P.x} h={pts.P.y} color={C.p3} opacity={0.3} />
                <FnCurve f={(x) => 12 / x} from={0.9} color={C.p3} />
              </>
            ),
            info: ({ pts }: any) => t`$x=${fmt(pts.P.x, 2)}$, $y=${fmt(pts.P.y, 2)}$, área $x\cdot y=${fmt(pts.P.x * pts.P.y, 2)}$`,
          }),
        },
        {
          title: 'Regra de três',
          body: t`1. Monte uma tabela com as grandezas em colunas.
2. Decida se são **diretas** (setas no mesmo sentido) ou **inversas** (setas opostas).
3. Se for inversa, **inverta** uma das razões e resolva a proporção.`,
          example: t`3 máquinas fazem um serviço em 12 h. Em quanto tempo 4 máquinas fazem?
Mais máquinas ⟹ menos tempo (inversa): $\frac{12}{x}=\frac{4}{3}\Rightarrow x=9$ h.`,
        },
      ],
      exercises: [
        gen((rng) => {
          const kg = randInt(rng, 2, 6);
          const price = kg * randInt(rng, 3, 12);
          const kg2 = randInt(rng, 7, 15);
          return num(t`Se $${kg}$ kg de arroz custam R\$ $${price}$, quanto custam $${kg2}$ kg?`, (price / kg) * kg2, t`Direta: $\frac{${kg}}{${price}}=\frac{${kg2}}{x}\Rightarrow x=${fmt((price / kg) * kg2)}$.`, { unit: 'R$' });
        }),
        gen((rng) => {
          const n = pick(rng, [2, 3, 4, 6]);
          const d = pick(rng, [6, 8, 12, 24]);
          const m = pick(rng, [2, 3, 4, 6, 8, 12].filter((x) => x !== n));
          return num(t`$${n}$ operários constroem um muro em $${d}$ dias. Em quantos dias $${m}$ operários (no mesmo ritmo) constroem o mesmo muro?`, (n * d) / m, t`Inversa: o produto é constante, $${n}\cdot${d}=${m}\cdot x\Rightarrow x=${fmt((n * d) / m)}$ dias.`, { unit: 'dias' });
        }),
        num(t`Resolva a proporção $\dfrac{x}{6}=\dfrac{10}{15}$.`, 4, t`$15x=60\Rightarrow x=4$.`),
        mcq(t`Para percorrer uma **distância fixa**, velocidade e tempo são grandezas…`, ['inversamente proporcionais', 'diretamente proporcionais', 'não proporcionais', 'iguais'], 0, t`$v\cdot t=d$ constante: dobrar a velocidade corta o tempo pela metade.`),
        tf(t`Se uma grandeza aumenta quando a outra aumenta, elas são **sempre** diretamente proporcionais.`, false, t`É preciso que a **razão** seja constante. Ex.: a área de um quadrado cresce com o lado, mas $A=\ell^2$ não é proporcional a $\ell$.`),
        order(t`Ordene os passos para resolver uma regra de três:`, ['Organizar as grandezas em uma tabela', 'Identificar se a relação é direta ou inversa', 'Inverter a razão se for inversa', 'Montar a proporção e isolar o $x$']),
        num(t`Um mapa tem escala $1:50\,000$. Uma distância de $4$ cm no mapa corresponde a quantos **km** reais?`, 2, t`$4\cdot50\,000=200\,000$ cm $=2$ km.`, { unit: 'km' }),
        inter(t`O produto $x\cdot y=12$ é fixo. Arraste o ponto até que $y=2$.`, 'plot', {
          view: { xMin: -0.5, xMax: 12.5, yMin: -0.5, yMax: 12.5 },
          equalAspect: true,
          points: [{ id: 'P', x: 2, y: 6, color: C.gold, label: 'P' }],
          constrain: (_: string, x: number) => {
            const xx = Math.max(1, Math.min(12, Math.round(x * 2) / 2));
            return { x: xx, y: 12 / xx };
          },
          render: ({ pts }: any) => (
            <>
              <RectW x={0} y={0} w={pts.P.x} h={pts.P.y} color={C.p3} opacity={0.3} />
              <FnCurve f={(x) => 12 / x} from={0.9} color={C.p3} />
            </>
          ),
          info: ({ pts }: any) => t`$x=${fmt(pts.P.x, 2)}$, $y=${fmt(pts.P.y, 2)}$`,
        }, (v) => v && near(v.pts.P.y, 2, 0.01), t`$x=6$, pois $6\cdot2=12$.`),
      ],
    },
    {
      id: 'f-elem-porc',
      title: 'Porcentagem',
      cards: [
        {
          title: 'Porcento = por cem',
          body: t`$x\%$ significa $\frac{x}{100}$. Para calcular $x\%$ de um valor $V$, multiplique: $\frac{x}{100}\cdot V$.`,
          visual: percentGrid(),
          example: t`$15\%$ de $80$ $=0{,}15\cdot80=12$.`,
        },
        {
          title: 'Fator multiplicativo',
          body: t`O truque dos engenheiros: transformar aumentos e descontos em **multiplicações**.

• Aumento de $i$: multiplique por $(1+i)$. Ex.: $+12\%\to\times1{,}12$
• Desconto de $i$: multiplique por $(1-i)$. Ex.: $-30\%\to\times0{,}70$

Variações **sucessivas** se multiplicam: $+20\%$ e depois $-20\%$ dá $1{,}2\cdot0{,}8=0{,}96$, ou seja, **perda de 4%**!`,
        },
        {
          title: 'Juros compostos',
          body: t`Aplicando a taxa $i$ por $t$ períodos, o fator é aplicado $t$ vezes:

$$M=C\,(1+i)^t$$

Compare com juros simples ($M=C(1+i\,t)$, uma reta): o composto cresce **exponencialmente**.`,
          visual: plot({
            view: { xMin: -0.5, xMax: 20, yMin: -100, yMax: 5000 },
            params: [{ key: 'i', label: 'i\\%', min: 1, max: 20, step: 0.5, value: 8, color: C.success }],
            render: ({ p }: any) => (
              <>
                <FnCurve f={(x) => 1000 * (1 + (p.i / 100) * x)} color={C.p3} from={0} dash="7 5" />
                <FnCurve f={(x) => 1000 * Math.pow(1 + p.i / 100, x)} color={C.success} from={0} />
              </>
            ),
            info: ({ p }: any) => t`$C=1000$. Em 10 períodos: composto $=${fmt(1000 * Math.pow(1 + p.i / 100, 10), 2)}$ vs. simples (tracejado) $=${fmt(1000 * (1 + (p.i / 100) * 10), 2)}$`,
          }),
        },
      ],
      exercises: [
        gen((rng) => {
          const p = pick(rng, [5, 10, 12, 15, 20, 25, 30, 40, 75]);
          const V = pick(rng, [40, 60, 80, 120, 200, 250, 360, 500]);
          return num(t`Quanto é $${p}\%$ de $${V}$?`, (p * V) / 100, t`$\frac{${p}}{100}\cdot${V}=${fmt((p * V) / 100)}$.`);
        }),
        gen((rng) => {
          const p = randInt(rng, 3, 45);
          const up = rng() < 0.5;
          const f = up ? 1 + p / 100 : 1 - p / 100;
          return rmcq(rng, t`Qual fator multiplicativo representa ${up ? 'um **aumento**' : 'um **desconto**'} de $${p}\%$?`, `$${fmt(f)}$`, [`$${fmt(up ? 1 - p / 100 : 1 + p / 100)}$`, `$${fmt(p / 100)}$`, `$${p}$`, `$${fmt(1 + p / 10)}$`], t`${up ? 'Aumento' : 'Desconto'}: $1${up ? '+' : '-'}${fmt(p / 100)}=${fmt(f)}$.`);
        }),
        gen((rng) => {
          const price = pick(rng, [80, 120, 150, 200, 240, 300]);
          const d = pick(rng, [10, 15, 20, 25, 30]);
          return num(t`Um produto de R\$ $${price}$ tem desconto de $${d}\%$. Qual o novo preço?`, price * (1 - d / 100), t`$${price}\cdot${fmt(1 - d / 100)}=${fmt(price * (1 - d / 100))}$.`, { unit: 'R$' });
        }),
        tf(t`Aumentar um preço em $10\%$ e depois reduzir $10\%$ faz o preço voltar ao valor original.`, false, t`$1{,}1\cdot0{,}9=0{,}99$: o preço final é $1\%$ menor.`),
        num(t`Dois descontos sucessivos de $20\%$ e $10\%$ equivalem a um desconto único de quantos por cento?`, 28, t`$0{,}8\cdot0{,}9=0{,}72$, ou seja, paga-se $72\%$: desconto de $28\%$.`, { unit: '%' }),
        num(t`R\$ $1000$ aplicados a juros compostos de $10\%$ ao mês. Qual o montante após $2$ meses?`, 1210, t`$1000\cdot1{,}1^2=1000\cdot1{,}21=1210$.`, { unit: 'R$' }),
        mcqS(t`$18$ representa que porcentagem de $72$?`, '$25\\%$', ['$18\\%$', '$40\\%$', '$4\\%$'], t`$\frac{18}{72}=0{,}25=25\%$.`),
        inter(t`Pinte exatamente $35\%$ do quadrado.`, 'plot', percentGrid(true).props, (v) => v && v.p.p === 35, t`$35$ quadradinhos de $100$.`),
      ],
    },
  ],
};

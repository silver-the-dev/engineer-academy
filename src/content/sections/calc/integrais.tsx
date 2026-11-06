import React from 'react';
import type { UnitDef } from '../../types';
import { gen, mcq, mcqS, num, tf, fill, match, order, inter, plot, rmcq, near, multi } from '../../helpers';
import { AreaUnder, FnCurve, Pt, RectW, Seg } from '../../../components/plot/Plot';
import { C } from '../../../theme';
import { fmt, pick, randInt, randNZ, polyTex, fracTex, term } from '../../../lib/random';
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
        <Pt x={1} y={0.5 + p.C} color={C.gold} />
      </>
    ),
    info: (p) => t`$F(x)=\frac{x^2}{2}${p.C < 0 ? '' : '+'}${fmt(p.C, 2)}$ · todas têm $F'(x)=x$ (mesma inclinação em cada $x$)`,
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
      </>
    ),
    info: ({ p }: any) => t`Área sob $x^2$ em $[0, 3]$: $9$ · área do retângulo: $3\cdot${fmt(p.h, 1)}=${fmt(3 * p.h, 1)}$`,
  });

export const integrais: UnitDef = {
  id: 'c-int',
  title: 'Integrais indefinidas',
  subtitle: 'Primitivas, valor inicial, substituição e por partes',
  icon: '∫',
  source: 'Cálculo I · Unidade 4 — Integrais',
  guide: t`Integrar é **desfazer a derivada**: achar $F$ com $F'=f$. Sempre some $+C$. Substituição desfaz a regra da cadeia; por partes desfaz a regra do produto.`,
  lessons: [
    {
      id: 'c-int-prim',
      title: 'Primitivas',
      cards: [
        {
          title: 'Derivar ao contrário',
          body: t`$$\int x^n\,dx=\frac{x^{n+1}}{n+1}+C\quad(n\ne-1)\qquad\int\frac{1}{x}\,dx=\ln|x|+C$$

O $+C$ existe porque infinitas funções têm a mesma derivada — são deslocamentos verticais umas das outras:`,
          visual: familyLab(),
        },
        {
          title: 'Tabela imediata',
          body: t`$$\int e^x dx=e^x+C\qquad\int\cos x\,dx=\operatorname{sen}x+C\qquad\int\operatorname{sen}x\,dx=-\cos x+C$$

A integral é **linear**: $\int(af+bg)=a\int f+b\int g$.`,
          example: t`$\int(6x^2-4x+3)\,dx=2x^3-2x^2+3x+C$.`,
          tip: t`Sempre dá para conferir: **derive** sua resposta e veja se volta ao integrando.`,
        },
      ],
      exercises: [
        gen((rng) => {
          const n = randInt(rng, 1, 5);
          const a = (n + 1) * randInt(rng, 1, 4);
          return rmcq(rng, t`Calcule $\int ${a}x^{${n}}\,dx$.`, t`$${a / (n + 1)}x^{${n + 1}}+C$`, [t`$${a * n}x^{${n - 1}}+C$`, t`$${a}x^{${n + 1}}+C$`, t`$${a / (n + 1)}x^{${n}}+C$`], t`$${a}\cdot\frac{x^{${n + 1}}}{${n + 1}}$.`);
        }),
        mcqS(t`Calcule $\int\cos x\,dx$.`, t`$\operatorname{sen}x+C$`, [t`$-\operatorname{sen}x+C$`, t`$\cos x+C$`, t`$-\cos x+C$`]),
        mcqS(t`Calcule $\int\frac{1}{\sqrt{x}}\,dx$.`, t`$2\sqrt{x}+C$`, [t`$\frac{1}{2\sqrt x}+C$`, t`$\ln\sqrt x+C$`, t`$\sqrt x+C$`], t`$\int x^{-1/2}=\frac{x^{1/2}}{1/2}=2\sqrt x$.`),
        mcqS(t`Calcule $\int\frac{3}{x}\,dx$.`, t`$3\ln|x|+C$`, [t`$-\frac{3}{x^2}+C$`, t`$\frac{3x^2}{2}+C$`, t`$\ln|3x|$`]),
        tf(t`$\int x^{-1}dx=\frac{x^0}{0}+C$`, false, t`Para $n=-1$ a regra da potência não vale: $\int\frac1x dx=\ln|x|+C$.`),
        match(t`Ligue integrando e primitiva:`, [
          [t`$e^x$`, t`$e^x+C$`],
          [t`$\operatorname{sen}x$`, t`$-\cos x+C$`],
          [t`$x^2$`, t`$\frac{x^3}{3}+C$`],
          [t`$\frac1x$`, t`$\ln|x|+C$`],
        ]),
      ],
    },
    {
      id: 'c-int-pvi',
      title: 'Valor inicial e EDO simples',
      cards: [
        {
          title: 'Descobrindo o C',
          body: t`Uma **equação diferencial** simples: $\frac{dy}{dx}=f(x)$. A solução geral é $y=\int f\,dx$. Uma **condição inicial** fixa o $C$.

Ajuste $C$ para a curva passar pelo ponto dourado $(1,\,y(1))$:`,
          visual: familyLab(),
          example: t`$y'=2x$, $y(0)=3$: $y=x^2+C$, $3=0+C\Rightarrow y=x^2+3$.`,
          tip: t`Física: $a=\frac{dv}{dt}$ e $v=\frac{ds}{dt}$. Integrar a aceleração dá a velocidade; integrar a velocidade dá a posição.`,
        },
      ],
      exercises: [
        gen((rng) => {
          const k = randInt(rng, -5, 5);
          return num(t`Se $y'=3x^2$ e $y(0)=${k}$, quanto vale $y(2)$?`, 8 + k, t`$y=x^3+C$, $C=${k}$ ⟹ $y(2)=8${k < 0 ? '' : '+'}${k}=${8 + k}$.`);
        }),
        num(t`Um carro parte do repouso com aceleração constante $a=2$ m/s². Qual a velocidade em $t=5$ s?`, 10, t`$v=\int2\,dt=2t+C$, $v(0)=0\Rightarrow v(5)=10$ m/s.`, { unit: 'm/s' }),
        num(t`Com $v(t)=2t$ e $s(0)=0$, qual a posição em $t=5$ s?`, 25, t`$s=t^2$ ⟹ $s(5)=25$ m.`, { unit: 'm' }),
        mcqS(t`Resolva $y'=\cos x$, $y(0)=1$.`, t`$y=\operatorname{sen}x+1$`, [t`$y=\operatorname{sen}x$`, t`$y=-\operatorname{sen}x+1$`, t`$y=\cos x$`]),
      ],
    },
    {
      id: 'c-int-subs',
      title: 'Substituição',
      cards: [
        {
          title: 'Desfazendo a cadeia',
          body: t`Procure "uma função e a derivada dela" no integrando. Chame a de dentro de $u$:
$$\int f(g(x))\,g'(x)\,dx=\int f(u)\,du$$`,
          example: t`$\int2x\cos(x^2)\,dx$: $u=x^2$, $du=2x\,dx$ ⟹ $\int\cos u\,du=\operatorname{sen}(x^2)+C$.

$\int\frac{2x}{x^2+1}dx$: $u=x^2+1$ ⟹ $\ln(x^2+1)+C$.`,
        },
      ],
      exercises: [
        mcqS(t`Calcule $\int 3x^2(x^3+1)^4\,dx$.`, t`$\frac{(x^3+1)^5}{5}+C$`, [t`$(x^3+1)^5+C$`, t`$\frac{(x^3+1)^5}{15}+C$`, t`$12x(x^3+1)^3$`], t`$u=x^3+1$, $du=3x^2dx$: $\int u^4du=\frac{u^5}{5}$.`),
        mcqS(t`Calcule $\int e^{5x}\,dx$.`, t`$\frac{e^{5x}}{5}+C$`, [t`$5e^{5x}+C$`, t`$e^{5x}+C$`, t`$\frac{e^{x}}{5}+C$`], t`$u=5x$, $dx=\frac{du}{5}$.`),
        mcqS(t`Qual a melhor escolha de $u$ para $\int\frac{\ln x}{x}\,dx$?`, t`$u=\ln x$`, [t`$u=x$`, t`$u=\frac1x$`, t`$u=x\ln x$`], t`$du=\frac{dx}{x}$ ⟹ $\int u\,du=\frac{(\ln x)^2}{2}+C$.`),
        mcqS(t`Calcule $\int\operatorname{sen}(3x)\,dx$.`, t`$-\frac{\cos(3x)}{3}+C$`, [t`$-3\cos(3x)+C$`, t`$\frac{\cos(3x)}{3}+C$`, t`$-\cos(3x)+C$`]),
        order(t`Ordene a substituição em $\int x\,e^{x^2}dx$:`, [t`Escolher $u=x^2$`, t`Calcular $du=2x\,dx$, então $x\,dx=\frac{du}{2}$`, t`Reescrever: $\frac12\int e^u\,du$`, t`Integrar e voltar: $\frac{e^{x^2}}{2}+C$`]),
      ],
    },
    {
      id: 'c-int-partes',
      title: 'Integração por partes',
      cards: [
        {
          title: 'Desfazendo o produto',
          body: t`$$\int u\,dv=uv-\int v\,du$$

Escolha $u$ pela ordem **LIATE** (Logarítmica, Inversa trig., Algébrica, Trigonométrica, Exponencial): o que vier primeiro é o $u$.`,
          example: t`$\int x e^x dx$: $u=x$, $dv=e^xdx$ ⟹ $du=dx$, $v=e^x$:
$$xe^x-\int e^xdx=xe^x-e^x+C$$`,
        },
      ],
      exercises: [
        mcqS(t`Em $\int x\cos x\,dx$, pela LIATE, quem é $u$?`, t`$u=x$`, [t`$u=\cos x$`, t`$u=x\cos x$`, t`$u=\operatorname{sen}x$`]),
        mcqS(t`Calcule $\int x\cos x\,dx$.`, t`$x\operatorname{sen}x+\cos x+C$`, [t`$x\operatorname{sen}x-\cos x+C$`, t`$\frac{x^2}{2}\operatorname{sen}x+C$`, t`$-x\operatorname{sen}x+C$`], t`$u=x$, $v=\operatorname{sen}x$: $x\operatorname{sen}x-\int\operatorname{sen}x\,dx$.`),
        mcqS(t`Calcule $\int\ln x\,dx$.`, t`$x\ln x-x+C$`, [t`$\frac1x+C$`, t`$x\ln x+C$`, t`$\frac{(\ln x)^2}{2}+C$`], t`$u=\ln x$, $dv=dx$: $x\ln x-\int x\cdot\frac1x dx$.`),
        tf(t`Na integração por partes, escolher mal o $u$ pode deixar a integral mais difícil.`, true),
        fill(t`Complete a fórmula:`, t`$\int u\,dv =$ ___ $-\int$ ___`, ['$uv$', '$v\\,du$'], ['$u\\,dv$', '$u^2$', '$dv$']),
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
  guide: t`A integral definida é o **limite das somas de Riemann** (área com sinal). O Teorema Fundamental transforma esse limite numa conta: $F(b)-F(a)$.`,
  lessons: [
    {
      id: 'c-def-riem',
      title: 'Somas de Riemann',
      cards: [
        {
          title: 'Fatiar e somar',
          body: t`Divida $[a,b]$ em $n$ retângulos de largura $\Delta x$ e some $f(x_i)\,\Delta x$. Aumente $n$:`,
          visual: riemannLab((x) => 0.3 * x * x + 0.6, 0, 3, 0.3 * 9 + 1.8, { xMin: -0.2, xMax: 3.2, yMin: -0.2, yMax: 3.6 }),
          formula: t`\int_a^b f(x)\,dx=\lim_{n\to\infty}\sum_{i=1}^n f(x_i)\,\Delta x`,
        },
      ],
      exercises: [
        inter(t`Aumente $n$ até o erro ficar menor que $0{,}001$.`, 'plot', riemannLab((x) => 0.3 * x * x + 0.6, 0, 3, 4.5, { xMin: -0.2, xMax: 3.2, yMin: -0.2, yMax: 3.6 }).props, (v: any) => v && v.p.n >= 26, t`$n\ge26$ (com ponto médio)`),
        num(t`Aproxime $\int_0^2x^2dx$ com 2 retângulos de ponto médio (pontos $0{,}5$ e $1{,}5$).`, 2.5, t`$\Delta x=1$: $(0{,}25+2{,}25)\cdot1=2{,}5$ (exato: $\frac83\approx2{,}667$).`),
        tf(t`Se $f$ é negativa em $[a,b]$, a integral definida é negativa.`, true, t`A integral é área **com sinal**: abaixo do eixo conta negativo.`),
        mcq(t`Aumentar o número de retângulos numa soma de Riemann…`, ['em geral diminui o erro', 'sempre aumenta a soma', 'não muda nada', 'só funciona para retas'], 0),
      ],
    },
    {
      id: 'c-def-tfc',
      title: 'Teorema Fundamental do Cálculo',
      cards: [
        {
          title: 'F(b) − F(a)',
          body: t`Se $F'=f$, então $$\int_a^bf(x)\,dx=F(b)-F(a)$$

Arraste o limite superior $b$ e veja a área acumulada:`,
          visual: areaLab((x) => x * x, (x) => (x * x * x) / 3, 0, 2, { xMin: -0.3, xMax: 3.2, yMin: -0.5, yMax: 9.5 }),
          example: t`$\int_1^3(2x+1)\,dx=[x^2+x]_1^3=12-2=10$.`,
          tip: t`Não precisa do $+C$ na integral definida: ele cancela em $F(b)-F(a)$.`,
        },
      ],
      exercises: [
        gen((rng) => {
          const b = randInt(rng, 1, 4);
          return num(t`Calcule $\int_0^{${b}}3x^2\,dx$.`, b ** 3, t`$[x^3]_0^{${b}}=${b ** 3}$.`);
        }),
        gen((rng) => {
          const a = randInt(rng, 0, 2);
          const b = a + randInt(rng, 1, 3);
          const m = randNZ(rng, -3, 4);
          const k = randInt(rng, -3, 3);
          const val = (m / 2) * (b * b - a * a) + k * (b - a);
          return num(t`Calcule $\int_{${a}}^{${b}}(${term(m, 'x', true)}${term(k, '')})\,dx$.`, val, t`$\left[\frac{${term(m, 'x^2', true)}}{2}${term(k, 'x')}\right]_{${a}}^{${b}}=${fmt(val)}$.`);
        }),
        num(t`Calcule $\int_0^{\pi}\operatorname{sen}x\,dx$.`, 2, t`$[-\cos x]_0^\pi=-(-1)-(-1)=2$.`),
        num(t`Calcule $\int_1^{e}\frac{1}{x}\,dx$.`, 1, t`$[\ln x]_1^e=1-0$.`),
        inter(t`Arraste $b$ até a área acumulada sob $y=x^2$ (desde 0) valer $9$.`, 'plot', areaLab((x) => x * x, (x) => (x * x * x) / 3, 0, 1, { xMin: -0.3, xMax: 3.2, yMin: -0.5, yMax: 9.5 }).props, (v: any) => v && near(v.p.b, 3, 0.03), t`$b=3$, pois $\frac{3^3}{3}=9$`),
      ],
    },
    {
      id: 'c-def-area',
      title: 'Área entre curvas',
      cards: [
        {
          title: 'Cima menos baixo',
          body: t`$$A=\int_a^b\big(f(x)-g(x)\big)\,dx\quad\text{com } f\ge g$$
Os limites $a$ e $b$ costumam ser os pontos onde as curvas se cruzam.`,
          visual: betweenLab((x) => x, (x) => x * x, 0, 1, 1 / 6, { xMin: -0.3, xMax: 1.4, yMin: -0.2, yMax: 1.4 }),
          example: t`Entre $y=x$ e $y=x^2$: cruzam em $0$ e $1$. $A=\int_0^1(x-x^2)dx=\frac12-\frac13=\frac16$.`,
        },
      ],
      exercises: [
        num(t`Calcule a área entre $y=4-x^2$ e o eixo $x$.`, 32 / 3, t`Raízes $\pm2$: $\int_{-2}^2(4-x^2)dx=16-\frac{16}{3}=\frac{32}{3}\approx10{,}667$.`, { tol: 0.01 }),
        num(t`Calcule a área entre $y=x^2$ e $y=2x$.`, 4 / 3, t`Cruzam em $0$ e $2$: $\int_0^2(2x-x^2)dx=4-\frac83=\frac43$.`, { tol: 0.005 }),
        mcq(t`Para calcular a área entre duas curvas, o primeiro passo costuma ser…`, ['achar os pontos de interseção', 'derivar as duas funções', 'somar as funções', 'calcular a média'], 0),
        tf(t`$\int_{-1}^{1}x^3\,dx=0$, mas a área entre $y=x^3$ e o eixo nesse intervalo não é zero.`, true, t`As partes negativa e positiva se cancelam na integral; a área usa $|f|$: $\frac12$.`),
      ],
    },
    {
      id: 'c-def-media',
      title: 'Valor médio e aplicações',
      cards: [
        {
          title: 'A altura média',
          body: t`$$\bar f=\frac{1}{b-a}\int_a^bf(x)\,dx$$
É a altura do retângulo de mesma área. Ajuste $h$ até as áreas serem iguais:`,
          visual: meanValueLab(),
          tip: t`**Custo marginal**: se $C'(q)$ é o custo marginal, $\int_a^bC'(q)\,dq=C(b)-C(a)$ é a variação do custo total.`,
        },
      ],
      exercises: [
        inter(t`Ajuste $h$ para que o retângulo tenha a mesma área da região sob $x^2$ em $[0, 3]$.`, 'plot', meanValueLab().props, (v: any) => v && near(v.p.h, 3, 0.051), t`$h=3$ (valor médio)`),
        num(t`Qual o valor médio de $f(x)=2x$ em $[0, 4]$?`, 4, t`$\frac14\int_0^42x\,dx=\frac{16}{4}=4$.`),
        num(t`O custo marginal é $C'(q)=10+2q$. Quanto aumenta o custo ao produzir de $q=0$ até $q=10$?`, 200, t`$\int_0^{10}(10+2q)\,dq=100+100=200$.`),
        num(t`Uma vazão de $v(t)=3t^2$ L/min enche um tanque. Quantos litros entram entre $t=0$ e $t=2$?`, 8, t`$\int_0^23t^2dt=8$ L.`, { unit: 'L' }),
      ],
    },
  ],
};

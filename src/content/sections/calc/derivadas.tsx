import React from 'react';
import type { UnitDef } from '../../types';
import { gen, mcq, mcqS, num, tf, fill, match, order, inter, plot, rmcq, near, multi } from '../../helpers';
import { FnCurve, InfLine, Label, Pt, RectW, Seg } from '../../../components/plot/Plot';
import { C } from '../../../theme';
import { fmt, pick, randInt, randNZ, polyTex } from '../../../lib/random';
import { derivativeSignLab, fnLab, tangentLab } from '../../visuals';

const t = String.raw;

/** derivative of polynomial coefficients */
const dpoly = (c: number[]) => c.slice(1).map((v, i) => v * (i + 1));

const boxLab = () =>
  plot({
    view: { xMin: 0, xMax: 6.2, yMin: 0, yMax: 140 },
    params: [{ key: 'c', label: 'c', min: 0.1, max: 5.9, step: 0.1, value: 1, color: C.p5 }],
    render: ({ p }: any) => {
      const V = (c: number) => c * (12 - 2 * c) ** 2;
      return (
        <>
          <FnCurve f={V} from={0} to={6} color={C.p2} />
          <Pt x={p.c} y={V(p.c)} color={C.gold} />
        </>
      );
    },
    info: ({ p }: any) => t`Folha $12\times12$, corte $c=${fmt(p.c, 1)}$: $V=c(12-2c)^2=${fmt(p.c * (12 - 2 * p.c) ** 2, 1)}$`,
  });

export const derivadas: UnitDef = {
  id: 'c-der',
  title: 'Derivadas',
  subtitle: 'Taxa de variação, regras e regra da cadeia',
  icon: '📉',
  source: 'Cálculo I · Unidade 3 — Derivadas',
  guide: t`A derivada é a **inclinação da reta tangente** e a **taxa de variação instantânea**. Na prática, você vai derivar com regras: potência, produto, quociente e cadeia.`,
  lessons: [
    {
      id: 'c-der-def',
      title: 'Definição e reta tangente',
      cards: [
        {
          title: 'Da secante à tangente',
          body: t`A secante por $(x_0,f(x_0))$ e $(x_0+h,f(x_0+h))$ tem inclinação $\frac{f(x_0+h)-f(x_0)}{h}$. Leve $h\to0$ e ela vira a **tangente** (tracejada):`,
          visual: tangentLab((x) => 0.5 * x * x, (x) => x, 1, { xMin: -1, xMax: 4, yMin: -1, yMax: 6 }),
          formula: t`f'(x)=\lim_{h\to0}\frac{f(x+h)-f(x)}{h}`,
        },
        {
          title: 'Equação da reta tangente',
          body: t`No ponto $x_0$: $$y-f(x_0)=f'(x_0)\,(x-x_0)$$`,
          example: t`$f(x)=x^2$ em $x_0=3$: $f(3)=9$, $f'(x)=2x\Rightarrow f'(3)=6$. Tangente: $y=6x-9$.`,
          tip: t`Notações: $f'(x)$, $\frac{dy}{dx}$, $\frac{d}{dx}f$, $\dot y$ (em física, derivada no tempo).`,
        },
      ],
      exercises: [
        inter(t`Leve $h$ até perto de zero ($h<0{,}05$) e veja a secante coincidir com a tangente.`, 'plot', tangentLab((x) => 0.5 * x * x, (x) => x, 1).props, (v: any) => v && v.p.h < 0.05, t`$h\to0$`),
        num(t`Pela definição, a derivada de $f(x)=x^2$ em $x=3$ é:`, 6, t`$\frac{(3+h)^2-9}{h}=\frac{6h+h^2}{h}=6+h\to6$.`),
        gen((rng) => {
          const a = randNZ(rng, -3, 4);
          return rmcq(rng, t`Qual a reta tangente a $y=x^2$ em $x=${a}$?`, t`$y=${2 * a}x${-a * a < 0 ? '' : '+'}${-a * a}$`, [t`$y=${2 * a}x$`, t`$y=${a}x${-a * a < 0 ? '' : '+'}${-a * a}$`, t`$y=${2 * a}x+${a * a}$`], t`$f'(${a})=${2 * a}$, ponto $(${a},\,${a * a})$: $y=${2 * a}(x-${a})+${a * a}$.`);
        }),
        tf(t`A derivada de uma função num ponto é a inclinação da reta tangente ao gráfico nesse ponto.`, true),
        mcqS(t`Se a posição é $s(t)$ em metros, $s'(t)$ representa…`, 'a velocidade (m/s)', ['a aceleração', 'a distância total', 'o tempo']),
      ],
    },
    {
      id: 'c-der-regras',
      title: 'Regras básicas',
      cards: [
        {
          title: 'Regra do tombo e linearidade',
          body: t`$$\frac{d}{dx}x^n=n\,x^{n-1}\qquad\frac{d}{dx}c=0\qquad (af+bg)'=af'+bg'$$

Vale para $n$ negativo e fracionário: $\left(\frac1x\right)'=(x^{-1})'=-x^{-2}$ e $(\sqrt x)'=\frac{1}{2\sqrt x}$.`,
          example: t`$(4x^3-5x^2+7x-2)'=12x^2-10x+7$.`,
        },
      ],
      exercises: [
        gen((rng) => {
          const c = [randInt(rng, -5, 5), randInt(rng, -6, 6), randInt(rng, -4, 4), randNZ(rng, -3, 3)];
          const d = dpoly(c);
          return rmcq(rng, t`Derive $f(x)=${polyTex(c)}$.`, `$${polyTex(d)}$`, [`$${polyTex(dpoly([0, ...c.slice(1)]).map((v, i) => (i === 0 ? v + 1 : v)))}$`, `$${polyTex([c[1], c[2], c[3]])}$`, `$${polyTex(d.map((v, i) => (i === 1 ? -v : v)))}$`, `$${polyTex([...d, 0].map((v, i) => (i === 2 ? v + c[3] : v)))}$`], t`Termo a termo com a regra do tombo: $${polyTex(d)}$.`);
        }),
        gen((rng) => {
          const n = randInt(rng, 2, 6);
          const a = randNZ(rng, -4, 5);
          const x = randInt(rng, -2, 2);
          return num(t`Se $f(x)=${a}x^{${n}}$, quanto vale $f'(${x})$?`, a * n * Math.pow(x, n - 1), t`$f'(x)=${a * n}x^{${n - 1}}$ ⟹ $f'(${x})=${a * n * Math.pow(x, n - 1)}$.`);
        }),
        mcqS(t`Derive $f(x)=\sqrt{x}$.`, t`$\frac{1}{2\sqrt x}$`, [t`$\frac{\sqrt x}{2}$`, t`$2\sqrt x$`, t`$\frac{1}{\sqrt x}$`], t`$x^{1/2}\to\frac12x^{-1/2}$.`),
        mcqS(t`Derive $f(x)=\dfrac{3}{x^2}$.`, t`$-\frac{6}{x^3}$`, [t`$\frac{6}{x}$`, t`$-\frac{3}{x^3}$`, t`$\frac{3}{2x}$`], t`$3x^{-2}\to-6x^{-3}$.`),
        fill(t`Complete:`, t`$\frac{d}{dx}\left(x^5\right) =$ ___ e $\frac{d}{dx}(7)=$ ___`, ['$5x^4$', '$0$'], ['$x^4$', '$7$', '$5x^5$'], t`Constantes têm derivada zero.`),
      ],
    },
    {
      id: 'c-der-prod',
      title: 'Produto e quociente',
      cards: [
        {
          title: 'As regras',
          body: t`$$(f\,g)'=f'\,g+f\,g'$$
$$\left(\frac fg\right)'=\frac{f'\,g-f\,g'}{g^2}$$

Macete do quociente: "derivada de cima vezes a de baixo, **menos** a de cima vezes a derivada de baixo, tudo sobre a de baixo ao quadrado".`,
          example: t`$(x^2\operatorname{sen}x)'=2x\operatorname{sen}x+x^2\cos x$.`,
        },
      ],
      exercises: [
        mcqS(t`Derive $f(x)=x\,e^x$.`, t`$e^x+xe^x$`, [t`$e^x$`, t`$xe^{x-1}$`, t`$xe^x$`], t`$(x)'e^x+x(e^x)'=e^x+xe^x$.`),
        mcqS(t`Derive $f(x)=\dfrac{x}{x+1}$.`, t`$\frac{1}{(x+1)^2}$`, [t`$\frac{2x+1}{(x+1)^2}$`, t`$1$`, t`$\frac{-1}{(x+1)^2}$`], t`$\frac{1\cdot(x+1)-x\cdot1}{(x+1)^2}=\frac{1}{(x+1)^2}$.`),
        gen((rng) => {
          const a = randInt(rng, 1, 4);
          const b = randInt(rng, 1, 4);
          const x = randInt(rng, -2, 2);
          // f = (x + a)(x^2 + b)
          const val = (x * x + b) + (x + a) * 2 * x;
          return num(t`Se $f(x)=(x+${a})(x^2+${b})$, calcule $f'(${x})$ pela regra do produto.`, val, t`$f'=1\cdot(x^2+${b})+(x+${a})\cdot2x$ ⟹ $f'(${x})=${x * x + b}+${(x + a) * 2 * x}=${val}$.`);
        }),
        tf(t`$(fg)'=f'g'$`, false, t`Erro clássico! O correto é $f'g+fg'$.`),
        order(t`Ordene o cálculo de $\left(\frac{x^2}{x-1}\right)'$:`, [t`Derivada de cima: $2x$; de baixo: $1$`, t`Montar $\frac{2x(x-1)-x^2\cdot1}{(x-1)^2}$`, t`Simplificar o numerador: $x^2-2x$`, t`Resultado: $\frac{x^2-2x}{(x-1)^2}$`]),
      ],
    },
    {
      id: 'c-der-cadeia',
      title: 'Regra da cadeia',
      cards: [
        {
          title: 'Derivada de fora vezes derivada de dentro',
          body: t`$$\frac{d}{dx}f(g(x))=f'(g(x))\cdot g'(x)$$

Em Leibniz, com $u=g(x)$: $\dfrac{dy}{dx}=\dfrac{dy}{du}\cdot\dfrac{du}{dx}$ — as "frações" se cancelam.`,
          example: t`$\left((3x+1)^5\right)'=5(3x+1)^4\cdot3=15(3x+1)^4$

$\left(\operatorname{sen}(x^2)\right)'=\cos(x^2)\cdot2x$`,
        },
      ],
      exercises: [
        gen((rng) => {
          const a = randInt(rng, 2, 5);
          const b = randInt(rng, -5, 5);
          const n = randInt(rng, 2, 6);
          return rmcq(rng, t`Derive $(${a}x${b < 0 ? '' : '+'}${b})^{${n}}$.`, t`$${n * a}(${a}x${b < 0 ? '' : '+'}${b})^{${n - 1}}$`, [t`$${n}(${a}x${b < 0 ? '' : '+'}${b})^{${n - 1}}$`, t`$${n * a}x^{${n - 1}}$`, t`$${a}(${a}x${b < 0 ? '' : '+'}${b})^{${n}}$`], t`De fora: $${n}u^{${n - 1}}$; de dentro: $${a}$.`);
        }),
        mcqS(t`Derive $e^{3x}$.`, t`$3e^{3x}$`, [t`$e^{3x}$`, t`$3xe^{3x-1}$`, t`$e^3$`]),
        mcqS(t`Derive $\ln(x^2+1)$.`, t`$\frac{2x}{x^2+1}$`, [t`$\frac{1}{x^2+1}$`, t`$\frac{2x}{x}$`, t`$2x\ln x$`], t`$\frac{1}{u}\cdot u'$ com $u=x^2+1$.`),
        mcqS(t`Derive $\cos(5x)$.`, t`$-5\operatorname{sen}(5x)$`, [t`$5\operatorname{sen}(5x)$`, t`$-\operatorname{sen}(5x)$`, t`$-5\cos(5x)$`]),
        num(t`Se $f(x)=\sqrt{x^2+16}$, quanto vale $f'(3)$?`, 0.6, t`$f'=\frac{2x}{2\sqrt{x^2+16}}=\frac{x}{\sqrt{x^2+16}}$ ⟹ $\frac{3}{5}=0{,}6$.`),
        fill(t`Complete a regra da cadeia para $\operatorname{sen}(x^3)$:`, t`$\frac{d}{dx}\operatorname{sen}(x^3) =$ ___ $\cdot$ ___`, [t`$\cos(x^3)$`, t`$3x^2$`], [t`$\operatorname{sen}(3x^2)$`, t`$x^3$`, t`$-\cos(x^3)$`]),
      ],
    },
    {
      id: 'c-der-esp',
      title: 'Derivadas de funções especiais',
      cards: [
        {
          title: 'Tabela essencial',
          body: t`$$(\operatorname{sen}x)'=\cos x\qquad(\cos x)'=-\operatorname{sen}x\qquad(\operatorname{tg}x)'=\sec^2x$$
$$(e^x)'=e^x\qquad (a^x)'=a^x\ln a$$
$$(\ln x)'=\frac1x\qquad(\log_a x)'=\frac{1}{x\ln a}$$`,
          visual: fnLab({
            f: (x) => Math.sin(x),
            params: [{ key: 'x0', label: 'x_0', min: -3, max: 3, step: 0.05, value: 0.5, color: C.gold }],
            view: { xMin: -3.5, xMax: 3.5, yMin: -1.6, yMax: 1.6 },
            extra: (p) => (
              <>
                <FnCurve f={(x) => Math.cos(x)} color={C.p2} width={2} dash="6 4" />
                <InfLine x1={p.x0} y1={Math.sin(p.x0)} x2={p.x0 + 1} y2={Math.sin(p.x0) + Math.cos(p.x0)} color={C.gold} width={2} />
                <Pt x={p.x0} y={Math.sin(p.x0)} color={C.gold} />
                <Pt x={p.x0} y={Math.cos(p.x0)} color={C.p2} r={5} />
              </>
            ),
            info: (p) => t`Inclinação da tangente ao seno em $${fmt(p.x0, 2)}$: $${fmt(Math.cos(p.x0), 3)}$ = altura do cosseno (azul tracejado)`,
          }),
        },
      ],
      exercises: [
        match(t`Ligue cada função à sua derivada:`, [
          [t`$\operatorname{sen}x$`, t`$\cos x$`],
          [t`$\cos x$`, t`$-\operatorname{sen}x$`],
          [t`$e^x$`, t`$e^x$`.replace('e^x', 'e^{x}')],
          [t`$\ln x$`, t`$\frac1x$`],
        ]),
        mcqS(t`Derive $f(x)=2^x$.`, t`$2^x\ln2$`, [t`$x\,2^{x-1}$`, t`$2^x$`, t`$\frac{2^x}{\ln2}$`]),
        mcqS(t`Derive $f(x)=e^x\cos x$.`, t`$e^x(\cos x-\operatorname{sen}x)$`, [t`$-e^x\operatorname{sen}x$`, t`$e^x(\cos x+\operatorname{sen}x)$`, t`$e^x\cos x$`]),
        num(t`Calcule a derivada de $f(x)=\ln x$ em $x=4$.`, 0.25),
        tf(t`$e^x$ é a única função (a menos de constante multiplicativa) igual à própria derivada.`, true),
      ],
    },
  ],
};

export const aplicacoes: UnitDef = {
  id: 'c-apl',
  title: 'Aplicações da derivada',
  subtitle: 'Crescimento, máximos e mínimos, otimização e L’Hôpital',
  icon: '🏔️',
  source: 'Cálculo I · Unidade 3 — Comportamento da função',
  extra: false,
  guide: t`O sinal de $f'$ diz se $f$ sobe ou desce; os zeros de $f'$ são candidatos a máximo/mínimo; $f''$ diz a concavidade. Otimização é escrever a grandeza em uma variável, derivar e igualar a zero.`,
  lessons: [
    {
      id: 'c-apl-cresc',
      title: 'Crescimento e pontos críticos',
      cards: [
        {
          title: 'O sinal da derivada',
          body: t`• $f'>0$: $f$ **crescente** · $f'<0$: **decrescente**
• $f'(c)=0$: **ponto crítico** (tangente horizontal)

Arraste o ponto sobre $f(x)=\frac{x^3}{3}-x$:`,
          visual: derivativeSignLab((x) => x ** 3 / 3 - x, (x) => x * x - 1, { xMin: -2.6, xMax: 2.6, yMin: -2, yMax: 2 }, -2),
        },
      ],
      exercises: [
        inter(t`Arraste o ponto até um **ponto crítico** de $f$.`, 'plot', derivativeSignLab((x) => x ** 3 / 3 - x, (x) => x * x - 1, { xMin: -2.6, xMax: 2.6, yMin: -2, yMax: 2 }, -2).props, (v: any) => v && Math.abs(Math.abs(v.pts.P.x) - 1) < 0.08, t`$x=\pm1$`),
        gen((rng) => {
          const a = randInt(rng, -3, 3);
          return num(t`Qual o ponto crítico de $f(x)=x^2${-2 * a < 0 ? '' : '+'}${-2 * a}x+1$?`, a, t`$f'(x)=2x${-2 * a < 0 ? '' : '+'}${-2 * a}=0\Rightarrow x=${a}$.`);
        }),
        mcqS(t`Em que intervalo $f(x)=x^3-3x$ é decrescente?`, t`$(-1,\,1)$`, [t`$(1,\,\infty)$`, t`$(-\infty,\,-1)$`, t`$\mathbb R$`], t`$f'=3x^2-3<0\iff -1<x<1$.`),
        tf(t`Se $f'(c)=0$, então $c$ é obrigatoriamente um máximo ou mínimo.`, false, t`$f(x)=x^3$ tem $f'(0)=0$, mas $0$ é ponto de **inflexão**, não extremo.`),
        multi(t`Quais são pontos críticos de $f(x)=x^4-2x^2$?`, ['$x=0$', '$x=1$', '$x=-1$', '$x=2$'], [0, 1, 2], t`$f'=4x^3-4x=4x(x-1)(x+1)$.`),
      ],
    },
    {
      id: 'c-apl-conc',
      title: 'Concavidade e segunda derivada',
      cards: [
        {
          title: 'Sorriso ou tristeza',
          body: t`• $f''>0$: côncava para **cima** ∪ · $f''<0$: para **baixo** ∩
• **Teste da 2ª derivada**: se $f'(c)=0$ e $f''(c)>0$ ⟹ **mínimo**; se $f''(c)<0$ ⟹ **máximo**
• **Inflexão**: onde $f''$ troca de sinal`,
          example: t`$f(x)=x^3-3x$: $f''(x)=6x$. Em $x=1$: $f''=6>0$ (mín); em $x=-1$: $f''=-6<0$ (máx). Inflexão em $x=0$.`,
        },
      ],
      exercises: [
        mcq(t`Se $f'(2)=0$ e $f''(2)=-3$, então $x=2$ é…`, ['máximo local', 'mínimo local', 'ponto de inflexão', 'nada se pode afirmar'], 0),
        gen((rng) => {
          const c = [randInt(rng, -5, 5), randInt(rng, -5, 5), randInt(rng, -3, 3), randNZ(rng, -2, 2)];
          const d2 = dpoly(dpoly(c));
          const x = randInt(rng, -2, 2);
          return num(t`Calcule $f''(${x})$ para $f(x)=${polyTex(c)}$.`, d2[0] + (d2[1] ?? 0) * x, t`$f''(x)=${polyTex(d2)}$.`);
        }),
        num(t`Onde está o ponto de inflexão de $f(x)=x^3-6x^2+1$?`, 2, t`$f''=6x-12=0\Rightarrow x=2$.`),
        tf(t`A função $e^x$ é côncava para cima em todo $\mathbb R$.`, true, t`$(e^x)''=e^x>0$.`),
      ],
    },
    {
      id: 'c-apl-otim',
      title: 'Otimização',
      cards: [
        {
          title: 'Os passos',
          body: t`1. Entenda o problema e desenhe
2. Escreva a grandeza a otimizar
3. Use as restrições para deixar **uma só variável**
4. Derive, iguale a zero, teste os candidatos (e as extremidades!)`,
          visual: boxLab(),
          example: t`Caixa sem tampa de uma folha $12\times12$ com cortes $c$ nos cantos: $V=c(12-2c)^2$. $V'=(12-2c)(12-6c)=0\Rightarrow c=2$ ⟹ $V=128$.`,
        },
      ],
      exercises: [
        inter(t`Encontre o corte $c$ que dá o volume máximo da caixa.`, 'plot', boxLab().props, (v: any) => v && near(v.p.c, 2, 0.051), t`$c=2$`),
        num(t`Dois números positivos somam 20. Qual o **maior produto** possível?`, 100, t`$P=x(20-x)$, $P'=20-2x=0\Rightarrow x=10$, $P=100$.`),
        num(t`Um retângulo tem área 64. Qual o **menor perímetro** possível?`, 32, t`$P=2x+\frac{128}{x}$, $P'=2-\frac{128}{x^2}=0\Rightarrow x=8$: quadrado, $P=32$.`),
        num(t`Uma bola é lançada com altura $h(t)=-5t^2+20t$ (m). Qual a altura máxima?`, 20, t`$h'=-10t+20=0\Rightarrow t=2$, $h(2)=20$ m.`, { unit: 'm' }),
        order(t`Ordene os passos de um problema de otimização:`, ['Desenhar e nomear as variáveis', 'Escrever a função a otimizar', 'Reduzir a uma variável usando a restrição', 'Derivar e igualar a zero', 'Verificar se é máximo/mínimo']),
      ],
    },
    {
      id: 'c-apl-lhop',
      title: 'Regra de L’Hôpital',
      cards: [
        {
          title: 'Derive em cima e embaixo',
          body: t`Se $\lim\frac{f}{g}$ dá $\frac00$ ou $\frac\infty\infty$:
$$\lim_{x\to a}\frac{f(x)}{g(x)}=\lim_{x\to a}\frac{f'(x)}{g'(x)}$$

Atenção: **não** é a regra do quociente! Derive numerador e denominador **separadamente**.`,
          example: t`$\lim_{x\to0}\frac{e^x-1}{x}=\lim\frac{e^x}{1}=1$ · $\lim_{x\to\infty}\frac{\ln x}{x}=\lim\frac{1/x}{1}=0$.`,
          tip: t`Pode aplicar mais de uma vez: $\lim_{x\to0}\frac{1-\cos x}{x^2}=\lim\frac{\operatorname{sen}x}{2x}=\lim\frac{\cos x}{2}=\frac12$.`,
        },
      ],
      exercises: [
        num(t`Calcule $\lim_{x\to0}\dfrac{1-\cos x}{x^2}$.`, 0.5),
        num(t`Calcule $\lim_{x\to1}\dfrac{\ln x}{x-1}$.`, 1, t`$\frac00$: $\lim\frac{1/x}{1}=1$.`),
        num(t`Calcule $\lim_{x\to0}\dfrac{e^{2x}-1}{x}$.`, 2, t`$\lim\frac{2e^{2x}}{1}=2$.`),
        mcqS(t`$\lim_{x\to\infty}\dfrac{x^2}{e^x}$ vale:`, '$0$', ['$\\infty$', '$1$', '$2$'], t`Duas vezes L'Hôpital: $\frac{2}{e^x}\to0$. A exponencial ganha de qualquer polinômio.`),
        tf(t`L'Hôpital pode ser usado em qualquer limite de quociente.`, false, t`Só para formas indeterminadas $\frac00$ ou $\frac\infty\infty$.`),
      ],
    },
  ],
};

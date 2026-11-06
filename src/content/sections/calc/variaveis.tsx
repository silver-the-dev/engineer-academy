import React from 'react';
import type { UnitDef } from '../../types';
import { gen, mcq, mcqS, num, tf, fill, match, order, inter, plot, rmcq, near, multi } from '../../helpers';
import { Arrow, CircleW, Pt } from '../../../components/plot/Plot';
import { C } from '../../../theme';
import { fmt, pick, randInt, randNZ, term } from '../../../lib/random';
import { doubleIntegralLab, surfaceLab } from '../../visuals3d';

const t = String.raw;

const levelLab = () =>
  plot({
    view: { xMin: -3, xMax: 3, yMin: -3, yMax: 3 },
    equalAspect: true,
    points: [{ id: 'P', x: 1, y: 1, color: C.gold, label: 'P' }],
    render: ({ pts }: any) => (
      <>
        {[0.5, 1, 1.5, 2, 2.5].map((r) => (
          <CircleW key={r} cx={0} cy={0} r={r} color={C.p1} width={1.5} />
        ))}
        <Arrow x1={pts.P.x} y1={pts.P.y} x2={pts.P.x + 0.5 * 2 * pts.P.x} y2={pts.P.y + 0.5 * 2 * pts.P.y} color={C.gold} label="∇f" />
      </>
    ),
    info: ({ pts }: any) => t`$f=x^2+y^2$ · $\nabla f(${fmt(pts.P.x, 1)},\,${fmt(pts.P.y, 1)})=(${fmt(2 * pts.P.x, 1)},\,${fmt(2 * pts.P.y, 1)})$ — perpendicular à curva de nível`,
  });

export const variaveis: UnitDef = {
  id: 'c-var',
  title: 'Funções de várias variáveis',
  subtitle: 'Superfícies, curvas de nível e derivadas parciais',
  icon: '🗻',
  source: 'Cálculo I · Unidades 5 e 6 — Derivadas parciais',
  guide: t`Com $z=f(x,y)$, o gráfico é uma superfície. A derivada parcial em $x$ trata $y$ como constante (e vice-versa). O gradiente reúne as parciais e aponta a direção de maior crescimento.`,
  lessons: [
    {
      id: 'c-var-func',
      title: 'Funções de duas variáveis',
      cards: [
        {
          title: 'Superfícies',
          body: t`$z=f(x,y)$ associa a cada ponto do plano uma altura. Gire a superfície $f(x,y)=x^2-y^2$ (a "sela"):`,
          visual: surfaceLab((x, y) => (x * x - y * y) / 2, (x) => x, (_x, y) => -y, 2),
          tip: t`Domínio agora é uma **região do plano**: $f(x,y)=\sqrt{9-x^2-y^2}$ exige $x^2+y^2\le9$ (um disco).`,
        },
        {
          title: 'Curvas de nível',
          body: t`Cortando a superfície em alturas fixas $f(x,y)=k$ e olhando de cima, obtemos o "mapa topográfico". Para $f=x^2+y^2$, as curvas de nível são círculos:`,
          visual: levelLab(),
        },
      ],
      exercises: [
        gen((rng) => {
          const x = randInt(rng, -3, 3);
          const y = randInt(rng, -3, 3);
          return num(t`Se $f(x,y)=x^2y+3y$, quanto vale $f(${x},\,${y})$?`, x * x * y + 3 * y, t`$(${x})^2\cdot(${y})+3\cdot(${y})=${x * x * y + 3 * y}$.`);
        }),
        mcqS(t`O domínio de $f(x,y)=\sqrt{4-x^2-y^2}$ é:`, 'o disco de raio 2 centrado na origem', ['todo o plano', 'a circunferência de raio 2', 'o quadrado [−2, 2]×[−2, 2]']),
        mcqS(t`As curvas de nível de $f(x,y)=x+y$ são:`, 'retas paralelas', ['círculos', 'parábolas', 'hipérboles'], t`$x+y=k$ são retas de inclinação $-1$.`),
        tf(t`Duas curvas de nível diferentes de uma mesma função nunca se cruzam.`, true, t`Um ponto não pode ter duas alturas diferentes.`),
      ],
    },
    {
      id: 'c-var-parc',
      title: 'Derivadas parciais',
      cards: [
        {
          title: 'Congela uma, deriva a outra',
          body: t`$$\frac{\partial f}{\partial x}=\lim_{h\to0}\frac{f(x+h,y)-f(x,y)}{h}$$
Na prática: derive em $x$ tratando $y$ como **constante**. Na superfície, é a inclinação da fatia vermelha (paralela ao eixo $x$); $\frac{\partial f}{\partial y}$ é a da fatia verde:`,
          visual: surfaceLab((x, y) => 0.25 * x * x * y + 0.3 * y, (x, y) => 0.5 * x * y, (x) => 0.25 * x * x + 0.3, 2),
          example: t`$f=x^2y+3y$: $f_x=2xy$ · $f_y=x^2+3$.

$g=e^{xy}$: $g_x=y\,e^{xy}$ · $g_y=x\,e^{xy}$.`,
        },
      ],
      exercises: [
        gen((rng) => {
          const a = randNZ(rng, -4, 4);
          const b = randNZ(rng, -4, 4);
          return rmcq(rng, t`Calcule $\frac{\partial f}{\partial x}$ de $f(x,y)=${term(a, 'x^2y', true)}${term(b, 'y^3')}$.`, t`$${term(2 * a, 'xy', true)}$`, [t`$${term(a, 'x^2', true)}${term(3 * b, 'y^2')}$`, t`$${term(2 * a, 'x', true)}$`, t`$${term(2 * a, 'xy', true)}${term(3 * b, 'y^2')}$`], t`$y$ é constante: $${term(a, 'y', true)}\cdot2x$, e $${term(b, 'y^3', true)}$ some.`);
        }),
        gen((rng) => {
          const x = randInt(rng, -2, 3);
          const y = randInt(rng, -2, 3);
          return num(t`Para $f(x,y)=x^2y+3y$, calcule $f_y(${x},\,${y})$.`, x * x + 3, t`$f_y=x^2+3$ ⟹ $${x * x}+3=${x * x + 3}$.`);
        }),
        mcqS(t`Calcule $\frac{\partial}{\partial y}\big(\operatorname{sen}(xy)\big)$.`, t`$x\cos(xy)$`, [t`$y\cos(xy)$`, t`$\cos(xy)$`, t`$-x\operatorname{sen}(xy)$`]),
        mcqS(t`Para $f=x^3y^2$, quanto vale $f_{xy}=\frac{\partial^2f}{\partial y\,\partial x}$?`, t`$6x^2y$`, [t`$3x^2y^2$`, t`$6xy^2$`, t`$2x^3y$`], t`$f_x=3x^2y^2$, depois $\partial_y$: $6x^2y$.`),
        tf(t`Para funções "bem comportadas", $f_{xy}=f_{yx}$ (Teorema de Schwarz).`, true),
      ],
    },
    {
      id: 'c-var-cadeia',
      title: 'Regra da cadeia e gradiente',
      cards: [
        {
          title: 'Gradiente',
          body: t`$$\nabla f=\left(\frac{\partial f}{\partial x},\ \frac{\partial f}{\partial y}\right)$$
Aponta para onde $f$ **cresce mais rápido** e é **perpendicular** às curvas de nível. Arraste $P$:`,
          visual: levelLab(),
        },
        {
          title: 'Regra da cadeia',
          body: t`Se $z=f(x,y)$ com $x=x(t)$ e $y=y(t)$:
$$\frac{dz}{dt}=\frac{\partial f}{\partial x}\frac{dx}{dt}+\frac{\partial f}{\partial y}\frac{dy}{dt}$$
Somamos a contribuição de cada "caminho" de $t$ até $z$.`,
          example: t`$z=x^2+y^2$, $x=\cos t$, $y=\operatorname{sen}t$: $\frac{dz}{dt}=2x(-\operatorname{sen}t)+2y\cos t=0$ (o ponto anda num círculo, nível constante!).`,
        },
      ],
      exercises: [
        gen((rng) => {
          const x = randInt(rng, -3, 3);
          const y = randInt(rng, -3, 3);
          return rmcq(rng, t`Qual o gradiente de $f(x,y)=x^2+3xy$ no ponto $(${x},\,${y})$?`, t`$(${2 * x + 3 * y},\,${3 * x})$`, [t`$(${2 * x},\,${3 * y})$`, t`$(${3 * x},\,${2 * x + 3 * y})$`, t`$(${2 * x + 3 * y},\,${3 * y})$`], t`$f_x=2x+3y$, $f_y=3x$.`);
        }),
        num(t`Se $z=xy$, $x=t^2$ e $y=t^3$, quanto vale $\frac{dz}{dt}$ em $t=1$?`, 5, t`$z_x x'+z_y y'=y\cdot2t+x\cdot3t^2=1\cdot2+1\cdot3=5$ (confira: $z=t^5$).`),
        inter(t`Arraste $P$ até um ponto onde $|\nabla f|=4$ para $f=x^2+y^2$.`, 'plot', levelLab().props, (v: any) => v && near(Math.hypot(2 * v.pts.P.x, 2 * v.pts.P.y), 4, 0.15), t`qualquer ponto da circunferência de raio 2`),
        tf(t`O gradiente é tangente às curvas de nível.`, false, t`Ele é **perpendicular** a elas.`),
      ],
    },
  ],
};

export const duplas: UnitDef = {
  id: 'c-dupla',
  title: 'Integrais duplas',
  subtitle: 'Volume, integrais iteradas e áreas',
  icon: '🧊',
  source: 'Cálculo I · Unidade 6 — Integrais duplas',
  guide: t`$\iint_R f\,dA$ soma colunas $f(x,y)\,\Delta A$ sobre a região $R$: é o volume sob a superfície. Calculamos com integrais iteradas, uma variável de cada vez.`,
  lessons: [
    {
      id: 'c-dupla-ideia',
      title: 'A ideia: volume',
      cards: [
        {
          title: 'Riemann em 2D',
          body: t`Divida o retângulo $R$ em $n\times n$ quadradinhos e levante colunas com altura $f$ no centro. Gire e aumente $n$:`,
          visual: doubleIntegralLab((x, y) => 0.6 + 0.35 * x * y, 0, 2, 0, 2, 2.4 + 1.4),
          formula: t`\iint_R f(x,y)\,dA=\lim\sum f(x_i,y_j)\,\Delta A`,
        },
      ],
      exercises: [
        inter(t`Aumente a malha para $n\ge6$ e observe a soma convergir.`, 'space3d', doubleIntegralLab((x, y) => 0.6 + 0.35 * x * y, 0, 2, 0, 2, 3.8).props!, (v: any) => v && v.p.n >= 6, '$n\\ge6$'),
        mcq(t`Se $f(x,y)=1$ em toda a região $R$, $\iint_R f\,dA$ é…`, ['a área de R', 'zero', 'o perímetro de R', 'o volume de uma esfera'], 0),
        num(t`Calcule $\iint_R 3\,dA$ com $R=[0, 2]\times[0, 5]$.`, 30, t`Altura constante 3 sobre área $10$: volume $30$.`),
        tf(t`Se $f\ge0$ em $R$, a integral dupla é o volume do sólido sob a superfície.`, true),
      ],
    },
    {
      id: 'c-dupla-iter',
      title: 'Integrais iteradas',
      cards: [
        {
          title: 'Uma de cada vez (Fubini)',
          body: t`Em um retângulo $[a,b]\times[c,d]$:
$$\iint_R f\,dA=\int_a^b\left(\int_c^d f(x,y)\,dy\right)dx$$
Integre **de dentro para fora**, tratando a outra variável como constante.`,
          example: t`$\int_0^2\!\int_0^1xy\,dy\,dx=\int_0^2\left[\frac{xy^2}{2}\right]_0^1dx=\int_0^2\frac x2dx=1$.`,
        },
      ],
      exercises: [
        gen((rng) => {
          const b = randInt(rng, 1, 3);
          const d = randInt(rng, 1, 3);
          return num(t`Calcule $\int_0^{${b}}\!\int_0^{${d}}(x+y)\,dy\,dx$.`, (b * b * d) / 2 + (b * d * d) / 2, t`$\int_0^{${b}}\left(xy+\frac{y^2}{2}\right)_0^{${d}}dx=\int_0^{${b}}\left(${d}x+${(d * d) / 2}\right)dx=${fmt((b * b * d) / 2 + (b * d * d) / 2)}$.`);
        }),
        num(t`Calcule $\int_0^1\!\int_0^2 x^2y\,dx\,dy$.`, 4 / 3, t`$\int_0^1\frac{8}{3}y\,dy=\frac43$.`, { tol: 0.005 }),
        tf(t`Num retângulo, trocar a ordem de integração não muda o resultado (para $f$ contínua).`, true),
        order(t`Ordene o cálculo de $\int_0^1\int_0^3 2xy\,dy\,dx$:`, [t`Integrar em $y$: $\left[xy^2\right]_0^3=9x$`, t`Integrar em $x$: $\int_0^1 9x\,dx$`, t`Resultado: $\frac92$`]),
      ],
    },
    {
      id: 'c-dupla-reg',
      title: 'Regiões gerais e áreas',
      cards: [
        {
          title: 'Limites variáveis',
          body: t`Se $R=\{a\le x\le b,\ g_1(x)\le y\le g_2(x)\}$:
$$\iint_R f\,dA=\int_a^b\int_{g_1(x)}^{g_2(x)}f(x,y)\,dy\,dx$$
Com $f=1$, isso dá a **área** entre $g_1$ e $g_2$ — conectando com a área entre curvas!`,
          example: t`Área entre $y=x^2$ e $y=x$: $\int_0^1\int_{x^2}^{x}dy\,dx=\int_0^1(x-x^2)dx=\frac16$.`,
          tip: t`Aplicações: massa $\iint\rho\,dA$, centro de massa, momento de inércia.`,
        },
      ],
      exercises: [
        num(t`Calcule $\int_0^1\int_0^{x} 1\,dy\,dx$ (área de um triângulo).`, 0.5),
        num(t`Calcule $\int_0^2\int_0^{x} y\,dy\,dx$.`, 4 / 3, t`$\int_0^2\frac{x^2}{2}dx=\frac{8}{6}=\frac43$.`, { tol: 0.005 }),
        mcqS(t`A região entre $y=0$, $y=\sqrt{x}$ e $x\in[0, 4]$ tem área dada por:`, t`$\int_0^4\int_0^{\sqrt x}dy\,dx$`, [t`$\int_0^4\int_0^{4}dy\,dx$`, t`$\int_0^{\sqrt x}\int_0^4dx\,dy$`, t`$\int_0^2\int_0^{x}dy\,dx$`]),
        num(t`Uma placa ocupa $[0, 1]\times[0, 1]$ com densidade $\rho(x,y)=x+y$. Qual sua massa?`, 1, t`$\int_0^1\int_0^1(x+y)\,dy\,dx=\frac12+\frac12=1$.`),
      ],
    },
  ],
};

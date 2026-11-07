import React from 'react';
import type { UnitDef } from '../../types';
import { gen, mcq, mcqS, num, tf, order, inter, plot, rmcq, near } from '../../helpers';
import { Arrow, CircleW } from '../../../components/plot/Plot';
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
      parts: [
        {
          card: {
            title: 'Superfícies',
            body: t`$z=f(x,y)$ associa a cada ponto do plano uma altura. Gire a superfície $f(x,y)=x^2-y^2$ (a "sela"):`,
            visual: surfaceLab((x, y) => (x * x - y * y) / 2, (x) => x, (_x, y) => -y, 2),
            tip: t`Domínio agora é uma **região do plano**: $f(x,y)=\sqrt{9-x^2-y^2}$ exige $x^2+y^2\le9$ (um disco).`,
          },
          exercises: [
            gen((rng) => {
              const x = randInt(rng, -3, 3);
              const y = randInt(rng, -3, 3);
              return num(t`Se $f(x,y)=x^2y+3y$, quanto vale $f(${x},\,${y})$?`, x * x * y + 3 * y, t`$(${x})^2\cdot(${y})+3\cdot(${y})=${x * x * y + 3 * y}$.`);
            }),
            mcqS(t`O domínio de $f(x,y)=\sqrt{4-x^2-y^2}$ é:`, 'o disco de raio 2 centrado na origem', ['todo o plano', 'a circunferência de raio 2', 'o quadrado [−2, 2]×[−2, 2]'], t`$x^2+y^2\le4$: o disco inteiro, com a borda.`),
            gen((rng) => {
              const [a, b] = [randNZ(rng, -3, 3), randNZ(rng, -3, 3)];
              const [x, y] = [randInt(rng, -2, 2), randInt(rng, -2, 2)];
              return num(t`Se $f(x,y)=${term(a, 'x', true)}${term(b, 'y')}+xy$, quanto vale $f(${x},\,${y})$?`, a * x + b * y + x * y, t`$${a}\cdot(${x})+(${b})\cdot(${y})+(${x})(${y})=${a * x + b * y + x * y}$.`);
            }),
            mcq(t`Qual é o domínio de $f(x,y)=\dfrac{1}{x-y}$?`, ['todo o plano menos a reta $y=x$', 'todo o plano', 'só o primeiro quadrante', 'a reta $y=x$'], 0, t`O denominador zera quando $x=y$.`),
            mcq(t`O gráfico de $f(x,y)=x^2+y^2$ é…`, ['um paraboloide (uma "tigela")', 'um plano', 'uma sela', 'um cilindro'], 0, t`Cresce igual em todas as direções a partir da origem.`),
            tf(t`O gráfico de uma função $z=f(x,y)$ vive no espaço tridimensional.`, true, t`Cada ponto $(x,\,y)$ ganha uma altura $z$.`),
            mcq(t`O domínio de $f(x,y)=\ln(x+y)$ é…`, ['os pontos com $x+y>0$', 'todo o plano', 'os pontos com $x>0$ e $y>0$', 'a reta $x+y=0$'], 0, t`O log exige argumento positivo: o semiplano acima da reta $y=-x$.`),
          ],
        },
        {
          card: {
            title: 'Curvas de nível',
            body: t`Cortando a superfície em alturas fixas $f(x,y)=k$ e olhando de cima, obtemos o "mapa topográfico". Para $f=x^2+y^2$, as curvas de nível são círculos:`,
            visual: levelLab(),
          },
          exercises: [
            mcqS(t`As curvas de nível de $f(x,y)=x+y$ são:`, 'retas paralelas', ['círculos', 'parábolas', 'hipérboles'], t`$x+y=k$ são retas de inclinação $-1$.`),
            tf(t`Duas curvas de nível diferentes de uma mesma função nunca se cruzam.`, true, t`Um ponto não pode ter duas alturas diferentes.`),
            gen((rng) => {
              const r = randInt(rng, 1, 5);
              return num(t`Para $f(x,y)=x^2+y^2$, qual o raio da curva de nível $f=${r * r}$?`, r, t`$x^2+y^2=${r * r}$ é um círculo de raio $${r}$.`);
            }),
            mcq(t`Num mapa topográfico, curvas de nível muito **próximas** indicam…`, ['terreno íngreme', 'terreno plano', 'um vale', 'um erro no mapa'], 0, t`A altura muda muito numa distância curta.`),
            mcq(t`As curvas de nível de $f(x,y)=y-x^2$ são…`, ['parábolas', 'retas', 'círculos', 'elipses'], 0, t`$y=x^2+k$: parábolas deslocadas.`),
            gen((rng) => {
              const [x, y] = [randInt(rng, -3, 3), randInt(rng, -3, 3)];
              return num(t`Em que nível $k$ está o ponto $(${x},\,${y})$ para $f(x,y)=x^2+y^2$?`, x * x + y * y, t`$k=f(${x},\,${y})=${x * x + y * y}$.`);
            }),
            mcq(t`As curvas de nível de $f(x,y)=xy$ são…`, ['hipérboles', 'círculos', 'retas paralelas', 'parábolas'], 0, t`$xy=k$ é uma hipérbole (para $k\neq0$).`),
          ],
        },
      ],
    },
    {
      id: 'c-var-parc',
      title: 'Derivadas parciais',
      parts: [
        {
          card: {
            title: 'Congela uma, deriva a outra',
            body: t`$$\frac{\partial f}{\partial x}=\lim_{h\to0}\frac{f(x+h,y)-f(x,y)}{h}$$
Na prática: derive em $x$ tratando $y$ como **constante**. Na superfície, é a inclinação da fatia vermelha (paralela ao eixo $x$); $\frac{\partial f}{\partial y}$ é a da fatia verde:`,
            visual: surfaceLab((x, y) => 0.25 * x * x * y + 0.3 * y, (x, y) => 0.5 * x * y, (x) => 0.25 * x * x + 0.3, 2),
            example: t`$f=x^2y+3y$: $f_x=2xy$ · $f_y=x^2+3$.`,
          },
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
            mcqS(t`Calcule $\frac{\partial}{\partial y}\big(\operatorname{sen}(xy)\big)$.`, t`$x\cos(xy)$`, [t`$y\cos(xy)$`, t`$\cos(xy)$`, t`$-x\operatorname{sen}(xy)$`], t`Regra da cadeia com $x$ constante: $\cos(xy)\cdot x$.`),
            tf(t`Ao calcular $\frac{\partial f}{\partial x}$, a variável $y$ é tratada como constante.`, true, t`É a ideia central da derivada parcial.`),
            gen((rng) => {
              const [a, b, c] = [randNZ(rng, -4, 4), randNZ(rng, -4, 4), randInt(rng, -5, 5)];
              return rmcq(rng, t`Calcule $\frac{\partial f}{\partial y}$ de $f(x,y)=${term(a, 'x', true)}${term(b, 'y^2')}${term(c, '')}$.`, `$${term(2 * b, 'y', true)}$`, [`$${term(a, '', true)}${term(2 * b, 'y')}$`, `$${term(b, 'y', true)}$`, `$${term(2 * b, 'y', true)}${term(c, '')}$`], t`O termo em $x$ e a constante somem; $(${b}y^2)'=${2 * b}y$.`);
            }),
            mcqS(t`Calcule $g_x$ para $g(x,y)=e^{xy}$.`, t`$y\,e^{xy}$`, [t`$x\,e^{xy}$`, t`$e^{xy}$`, t`$xy\,e^{xy-1}$`], t`Cadeia: $e^{xy}\cdot\frac{\partial}{\partial x}(xy)=y\,e^{xy}$.`),
            gen((rng) => {
              const [x, y] = [randInt(rng, -2, 2), randInt(rng, -2, 2)];
              return num(t`Para $f(x,y)=x^3+2xy^2$, calcule $f_x(${x},\,${y})$.`, 3 * x * x + 2 * y * y, t`$f_x=3x^2+2y^2$ ⟹ $${3 * x * x}+${2 * y * y}=${3 * x * x + 2 * y * y}$.`);
            }),
          ],
        },
        {
          card: {
            title: 'Derivadas de segunda ordem',
            body: t`Derivando de novo: $f_{xx}$, $f_{yy}$ e as **mistas** $f_{xy}$ (primeiro $x$, depois $y$) e $f_{yx}$.

**Teorema de Schwarz**: para funções "bem comportadas", $f_{xy}=f_{yx}$.`,
            example: t`$f=x^3y^2$: $f_x=3x^2y^2$, $f_{xy}=6x^2y$; $f_y=2x^3y$, $f_{yx}=6x^2y$. Iguais!`,
          },
          exercises: [
            mcqS(t`Para $f=x^3y^2$, quanto vale $f_{xy}=\frac{\partial^2f}{\partial y\,\partial x}$?`, t`$6x^2y$`, [t`$3x^2y^2$`, t`$6xy^2$`, t`$2x^3y$`], t`$f_x=3x^2y^2$, depois $\partial_y$: $6x^2y$.`),
            tf(t`Para funções "bem comportadas", $f_{xy}=f_{yx}$ (Teorema de Schwarz).`, true, t`A ordem das derivadas mistas não importa.`),
            gen((rng) => {
              const a = randNZ(rng, -3, 3);
              const n = randInt(rng, 2, 4);
              return rmcq(rng, t`Calcule $f_{xx}$ para $f(x,y)=${term(a, `x^{${n}}`, true)}+y^2$.`, `$${term(a * n * (n - 1), n - 2 === 0 ? '' : n - 2 === 1 ? 'x' : `x^{${n - 2}}`, true)}$`, [`$${term(a * n, `x^{${n - 1}}`, true)}$`, `$${term(a * n * (n - 1), n - 2 === 0 ? '' : n - 2 === 1 ? 'x' : `x^{${n - 2}}`, true)}+2$`, `$${term(a * n * (n - 1), `x^{${n - 1}}`, true)}$`], t`Duas derivadas em $x$; o $y^2$ some.`);
            }),
            num(t`Para $f(x,y)=x^2y^3$, calcule $f_{yy}(1,\,2)$.`, 12, t`$f_y=3x^2y^2$, $f_{yy}=6x^2y$ ⟹ $6\cdot1\cdot2=12$.`),
            mcq(t`Para $f(x,y)=x^2+y^2$, quanto vale $f_{xy}$?`, ['$0$', '$2$', '$2x$', '$4$'], 0, t`$f_x=2x$ não depende de $y$.`),
            gen((rng) => {
              const [x, y] = [randInt(rng, -2, 2), randInt(rng, -2, 2)];
              return num(t`Para $f(x,y)=x^2y+xy^3$, calcule $f_{xy}(${x},\,${y})$.`, 2 * x + 3 * y * y, t`$f_x=2xy+y^3$; $f_{xy}=2x+3y^2=${2 * x + 3 * y * y}$.`);
            }),
            mcqS(t`Para $f(x,y)=e^{x}\operatorname{sen}y$, quanto vale $f_{xx}$?`, t`$e^x\operatorname{sen}y$`, [t`$e^x\cos y$`, t`$-e^x\operatorname{sen}y$`, t`$0$`], t`Derivar $e^x$ em $x$ não muda nada.`),
          ],
        },
      ],
    },
    {
      id: 'c-var-cadeia',
      title: 'Regra da cadeia e gradiente',
      parts: [
        {
          card: {
            title: 'Gradiente',
            body: t`$$\nabla f=\left(\frac{\partial f}{\partial x},\ \frac{\partial f}{\partial y}\right)$$
Aponta para onde $f$ **cresce mais rápido** e é **perpendicular** às curvas de nível. Arraste $P$:`,
            visual: levelLab(),
          },
          exercises: [
            gen((rng) => {
              const x = randInt(rng, -3, 3);
              const y = randInt(rng, -3, 3);
              return rmcq(rng, t`Qual o gradiente de $f(x,y)=x^2+3xy$ no ponto $(${x},\,${y})$?`, t`$(${2 * x + 3 * y},\,${3 * x})$`, [t`$(${2 * x},\,${3 * y})$`, t`$(${3 * x},\,${2 * x + 3 * y})$`, t`$(${2 * x + 3 * y},\,${3 * y})$`, t`$(${2 * x + 3 * y + 1},\,${3 * x})$`], t`$f_x=2x+3y$, $f_y=3x$.`);
            }),
            tf(t`O gradiente é tangente às curvas de nível.`, false, t`Ele é **perpendicular** a elas.`),
            inter(t`Arraste $P$ até um ponto onde $|\nabla f|=4$ para $f=x^2+y^2$.`, 'plot', levelLab().props, (v: any) => v && near(Math.hypot(2 * v.pts.P.x, 2 * v.pts.P.y), 4, 0.15), t`qualquer ponto da circunferência de raio 2`),
            mcq(t`Para subir uma montanha $z=f(x,y)$ o mais rápido possível, ande na direção de…`, ['$\\nabla f$', '$-\\nabla f$', 'uma curva de nível', 'qualquer direção'], 0, t`O gradiente aponta para o maior crescimento.`),
            gen((rng) => {
              const [x, y] = [randInt(rng, -3, 3), randInt(rng, -3, 3)];
              return num(t`Para $f(x,y)=x^2+y^2$, qual o módulo do gradiente em $(${x},\,${y})$? (2 casas)`, Math.hypot(2 * x, 2 * y), t`$\nabla f=(${2 * x},\,${2 * y})$, módulo $${fmt(Math.hypot(2 * x, 2 * y), 2)}$.`, { tol: 0.01 });
            }),
            mcq(t`Num ponto de máximo ou mínimo de uma superfície suave, o gradiente vale…`, ['o vetor nulo', '$(1,\\,1)$', 'um vetor unitário', 'infinito'], 0, t`Tangente horizontal em todas as direções.`),
            num(t`Para $f(x,y)=3x-4y$, qual o módulo do gradiente?`, 5, t`$\nabla f=(3,\,-4)$, constante, com módulo $5$.`),
          ],
        },
        {
          card: {
            title: 'Regra da cadeia',
            body: t`Se $z=f(x,y)$ com $x=x(t)$ e $y=y(t)$:
$$\frac{dz}{dt}=\frac{\partial f}{\partial x}\frac{dx}{dt}+\frac{\partial f}{\partial y}\frac{dy}{dt}$$
Somamos a contribuição de cada "caminho" de $t$ até $z$.`,
            example: t`$z=x^2+y^2$, $x=\cos t$, $y=\operatorname{sen}t$: $\frac{dz}{dt}=2x(-\operatorname{sen}t)+2y\cos t=0$ (o ponto anda num círculo, nível constante!).`,
          },
          exercises: [
            num(t`Se $z=xy$, $x=t^2$ e $y=t^3$, quanto vale $\frac{dz}{dt}$ em $t=1$?`, 5, t`$z_x x'+z_y y'=y\cdot2t+x\cdot3t^2=1\cdot2+1\cdot3=5$ (confira: $z=t^5$).`),
            tf(t`Se uma curva percorre uma curva de nível de $f$, então $\frac{dz}{dt}=0$ ao longo dela.`, true, t`A altura não muda.`),
            gen((rng) => {
              const [a, b] = [randNZ(rng, -3, 3), randNZ(rng, -3, 3)];
              const [p, q] = [randNZ(rng, -3, 3), randNZ(rng, -3, 3)];
              return num(t`$z=${term(a, 'x', true)}${term(b, 'y')}$ com $x=${term(p, 't', true)}$ e $y=${term(q, 't', true)}$. Quanto vale $\frac{dz}{dt}$?`, a * p + b * q, t`$z_x x'+z_y y'=${a}\cdot${p}+(${b})\cdot(${q})=${a * p + b * q}$.`);
            }),
            gen((rng) => {
              const t0 = randInt(rng, 1, 3);
              return num(t`$z=x^2y$ com $x=t$ e $y=t$. Quanto vale $\frac{dz}{dt}$ em $t=${t0}$?`, 3 * t0 * t0, t`$2xy\cdot1+x^2\cdot1=3t^2=${3 * t0 * t0}$ (confira: $z=t^3$).`);
            }),
            mcq(t`Na regra da cadeia para $z=f(x(t),\,y(t))$, quantos termos aparecem em $\frac{dz}{dt}$?`, ['2 (um por variável intermediária)', '1', '3', '4'], 0, t`Um caminho por $x$, outro por $y$.`),
            num(t`$z=x^2+y^2$ com $x=2t$ e $y=t$. Quanto vale $\frac{dz}{dt}$ em $t=1$?`, 10, t`$2x\cdot2+2y\cdot1=8+2=10$ (confira: $z=5t^2$).`),
            num(t`A temperatura numa placa é $T(x,y)=x^2+2y$. Uma formiga anda com $x=t$, $y=3t$. Qual a taxa de variação da temperatura em $t=2$?`, 10, t`$T_x x'+T_y y'=2x\cdot1+2\cdot3=4+6=10$.`),
          ],
        },
      ],
    },
  ],
};

const DLAB = () => doubleIntegralLab((x, y) => 0.6 + 0.35 * x * y, 0, 2, 0, 2, 3.8);

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
      parts: [
        {
          card: {
            title: 'Riemann em 2D',
            body: t`Divida o retângulo $R$ em $n\times n$ quadradinhos e levante colunas com altura $f$ no centro. Gire e aumente $n$:`,
            visual: DLAB(),
            formula: t`\iint_R f(x,y)\,dA=\lim\sum f(x_i,y_j)\,\Delta A`,
          },
          exercises: [
            tf(t`Se $f\ge0$ em $R$, a integral dupla é o volume do sólido sob a superfície.`, true, t`Soma de colunas finíssimas.`),
            inter(t`Aumente a malha para $n\ge6$ e observe a soma convergir.`, 'space3d', DLAB().props!, (v: any) => v && v.p.n >= 6, '$n\\ge6$'),
            mcq(t`Numa soma de Riemann dupla, cada parcela $f(x_i,y_j)\,\Delta A$ é…`, ['o volume de uma coluna', 'a área de um quadradinho', 'a altura da superfície', 'um comprimento'], 0, t`Altura vezes área da base.`),
            gen((rng) => {
              const n = randInt(rng, 2, 6);
              const a = pick(rng, [2, 4, 6]);
              return num(t`O retângulo $[0,\,${a}]\times[0,\,${a}]$ é dividido em $${n}\times${n}$ quadradinhos iguais. Qual a área $\Delta A$ de cada um? (decimal)`, (a / n) ** 2, t`Lado $\frac{${a}}{${n}}$; área $${fmt((a / n) ** 2, 4)}$.`, { tol: 0.001 });
            }),
            num(t`Use 1 coluna (ponto central) para aproximar $\iint_R (x+y)\,dA$ em $R=[0,\,2]\times[0,\,2]$.`, 8, t`Centro $(1,\,1)$: $f=2$; área $4$; volume $\approx8$ (aqui já é exato, pois $f$ é afim).`),
            mcq(t`Aumentar o número de colunas numa soma de Riemann dupla em geral…`, ['diminui o erro', 'aumenta o erro', 'não muda nada', 'só funciona para planos'], 0, t`Como no caso de uma variável.`),
            tf(t`Se $f<0$ numa região, a integral dupla lá contribui negativamente.`, true, t`É volume **com sinal**.`),
          ],
        },
        {
          card: {
            title: 'Funções simples e propriedades',
            body: t`• Com $f=c$ constante: $\iint_R c\,dA=c\cdot\text{Área}(R)$
• Linearidade: $\iint(af+bg)\,dA=a\iint f\,dA+b\iint g\,dA$
• Com $f=1$: $\iint_R 1\,dA$ é a **área** de $R$`,
          },
          exercises: [
            mcq(t`Se $f(x,y)=1$ em toda a região $R$, $\iint_R f\,dA$ é…`, ['a área de R', 'zero', 'o perímetro de R', 'o volume de uma esfera'], 0, t`Altura 1: volume numericamente igual à área da base.`),
            num(t`Calcule $\iint_R 3\,dA$ com $R=[0,\,2]\times[0,\,5]$.`, 30, t`Altura constante 3 sobre área $10$: volume $30$.`),
            gen((rng) => {
              const c = randInt(rng, 2, 9);
              const [a, b] = [randInt(rng, 1, 4), randInt(rng, 1, 4)];
              return num(t`Calcule $\iint_R ${c}\,dA$ com $R=[0,\,${a}]\times[0,\,${b}]$.`, c * a * b, t`$${c}\cdot${a}\cdot${b}=${c * a * b}$.`);
            }),
            gen((rng) => {
              const [I1, I2] = [randInt(rng, 1, 9), randInt(rng, 1, 9)];
              const [p, q] = [randInt(rng, 1, 3), randNZ(rng, -2, 2)];
              return num(t`Se $\iint_R f\,dA=${I1}$ e $\iint_R g\,dA=${I2}$, quanto vale $\iint_R (${p}f${term(q, 'g')})\,dA$?`, p * I1 + q * I2, t`Linearidade: $${p}\cdot${I1}+(${q})\cdot${I2}=${p * I1 + q * I2}$.`);
            }),
            num(t`Qual a área do disco $x^2+y^2\le4$, calculada como $\iint 1\,dA$? (2 casas)`, 4 * Math.PI, t`$\pi\cdot2^2\approx12{,}57$.`, { tol: 0.01 }),
            tf(t`$\iint_R (f+g)\,dA=\iint_R f\,dA+\iint_R g\,dA$`, true, t`A integral dupla é linear.`),
            num(t`Uma caixa tem base $[0,\,3]\times[0,\,4]$ e altura constante $2$. Qual seu volume como integral dupla?`, 24, t`$\iint 2\,dA=2\cdot12=24$.`),
          ],
        },
      ],
    },
    {
      id: 'c-dupla-iter',
      title: 'Integrais iteradas',
      parts: [
        {
          card: {
            title: 'Uma de cada vez (Fubini)',
            body: t`Em um retângulo $[a,b]\times[c,d]$:
$$\iint_R f\,dA=\int_a^b\left(\int_c^d f(x,y)\,dy\right)dx$$
Integre **de dentro para fora**, tratando a outra variável como constante.`,
            example: t`$\int_0^2\!\int_0^1xy\,dy\,dx=\int_0^2\left[\frac{xy^2}{2}\right]_0^1dx=\int_0^2\frac x2dx=1$.`,
          },
          exercises: [
            order(t`Ordene o cálculo de $\int_0^1\int_0^3 2xy\,dy\,dx$:`, [t`Integrar em $y$: $\left[xy^2\right]_0^3=9x$`, t`Integrar em $x$: $\int_0^1 9x\,dx$`, t`Resultado: $\frac92$`]),
            mcq(t`Em $\int_0^2\!\int_0^1 f\,dy\,dx$, qual integral se faz **primeiro**?`, ['a de dentro, em $y$', 'a de fora, em $x$', 'tanto faz a ordem dos limites', 'as duas ao mesmo tempo'], 0, t`De dentro para fora.`),
            gen((rng) => {
              const b = randInt(rng, 1, 3);
              const d = randInt(rng, 1, 3);
              return num(t`Calcule $\int_0^{${b}}\!\int_0^{${d}}(x+y)\,dy\,dx$.`, (b * b * d) / 2 + (b * d * d) / 2, t`$\int_0^{${b}}\left(${d}x+${fmt((d * d) / 2)}\right)dx=${fmt((b * b * d) / 2 + (b * d * d) / 2)}$.`);
            }),
            num(t`Calcule $\int_0^1\!\int_0^2 x^2y\,dx\,dy$.`, 4 / 3, t`$\int_0^1\frac{8}{3}y\,dy=\frac43$.`, { tol: 0.005 }),
            gen((rng) => {
              const b = randInt(rng, 1, 4);
              const d = randInt(rng, 1, 4);
              return num(t`Calcule $\int_0^{${b}}\!\int_0^{${d}} 2\,dy\,dx$.`, 2 * b * d, t`$\int_0^{${b}}2\cdot${d}\,dx=${2 * b * d}$.`);
            }),
            num(t`Calcule $\int_0^1\!\int_0^1 (x^2+y^2)\,dy\,dx$. (fração ou decimal)`, 2 / 3, t`$\int_0^1\left(x^2+\frac13\right)dx=\frac13+\frac13=\frac23$.`, { tol: 0.002 }),
            num(t`Calcule $\int_1^2\!\int_0^3 x\,dy\,dx$.`, 4.5, t`$\int_1^2 3x\,dx=3\cdot\frac{4-1}{2}=4{,}5$.`),
          ],
        },
        {
          card: {
            title: 'Trocar a ordem e separar variáveis',
            body: t`Num retângulo (com $f$ contínua), a ordem $dy\,dx$ ou $dx\,dy$ dá o mesmo resultado (**Fubini**).

Se $f(x,y)=g(x)\,h(y)$, a integral **separa**:
$$\int_a^b\!\int_c^d g(x)h(y)\,dy\,dx=\left(\int_a^b g\,dx\right)\left(\int_c^d h\,dy\right)$$`,
          },
          exercises: [
            tf(t`Num retângulo, trocar a ordem de integração não muda o resultado (para $f$ contínua).`, true, t`É o teorema de Fubini.`),
            gen((rng) => {
              const b = randInt(rng, 1, 3);
              const d = randInt(rng, 1, 3);
              return num(t`Calcule $\int_0^{${b}}\!\int_0^{${d}} xy\,dy\,dx$ separando as variáveis. (decimal)`, (b * b / 2) * (d * d / 2), t`$\left(\int_0^{${b}}x\,dx\right)\left(\int_0^{${d}}y\,dy\right)=\frac{${b * b}}{2}\cdot\frac{${d * d}}{2}=${fmt((b * b * d * d) / 4)}$.`);
            }),
            mcq(t`Qual integrando pode ser separado em um produto $g(x)h(y)$?`, ['$x^2e^y$', '$x+y$', '$\\operatorname{sen}(xy)$', '$\\sqrt{x^2+y^2}$'], 0, t`$x^2\cdot e^y$.`),
            num(t`Calcule $\int_0^{\pi}\!\int_0^1 y\operatorname{sen}x\,dy\,dx$.`, 1, t`$\left(\int_0^\pi\operatorname{sen}x\,dx\right)\left(\int_0^1y\,dy\right)=2\cdot\frac12=1$.`),
            mcqS(t`$\int_0^2\!\int_0^3 f\,dy\,dx$ escrita na outra ordem fica:`, t`$\int_0^3\!\int_0^2 f\,dx\,dy$`, [t`$\int_0^2\!\int_0^3 f\,dx\,dy$`, t`$\int_0^3\!\int_0^3 f\,dx\,dy$`, t`$\int_0^2\!\int_0^2 f\,dy\,dx$`], t`Os limites acompanham suas variáveis.`),
            num(t`Calcule $\int_0^1\!\int_0^2 e^x\cdot 3\,dy\,dx$. (3 casas)`, 6 * (Math.E - 1), t`$\left(\int_0^1e^x\,dx\right)\left(\int_0^2 3\,dy\right)=(e-1)\cdot6\approx10{,}31$.`, { tol: 0.01 }),
            num(t`Calcule $\int_0^1\!\int_0^1 (2x)(3y^2)\,dy\,dx$.`, 1, t`$\left(\int_0^1 2x\,dx\right)\left(\int_0^1 3y^2\,dy\right)=1\cdot1=1$.`),
          ],
        },
      ],
    },
    {
      id: 'c-dupla-reg',
      title: 'Regiões gerais e áreas',
      parts: [
        {
          card: {
            title: 'Limites variáveis',
            body: t`Se $R=\{a\le x\le b,\ g_1(x)\le y\le g_2(x)\}$:
$$\iint_R f\,dA=\int_a^b\int_{g_1(x)}^{g_2(x)}f(x,y)\,dy\,dx$$
Os limites de dentro podem depender da variável de fora; os de fora, **nunca**.`,
            example: t`$\int_0^2\int_0^{x} y\,dy\,dx=\int_0^2\frac{x^2}{2}dx=\frac43$.`,
          },
          exercises: [
            num(t`Calcule $\int_0^1\int_0^{x} 1\,dy\,dx$ (área de um triângulo).`, 0.5, t`$\int_0^1x\,dx=\frac12$.`),
            num(t`Calcule $\int_0^2\int_0^{x} y\,dy\,dx$.`, 4 / 3, t`$\int_0^2\frac{x^2}{2}dx=\frac{8}{6}=\frac43$.`, { tol: 0.005 }),
            tf(t`Na integral de fora, os limites podem depender da variável de dentro.`, false, t`O resultado final tem que ser um número; só os limites de dentro podem variar.`),
            gen((rng) => {
              const b = randInt(rng, 1, 3);
              const k = randInt(rng, 1, 3);
              return num(t`Calcule $\int_0^{${b}}\int_0^{${k}x} 1\,dy\,dx$.`, (k * b * b) / 2, t`$\int_0^{${b}}${k}x\,dx=\frac{${k}\cdot${b * b}}{2}=${fmt((k * b * b) / 2)}$.`);
            }),
            mcqS(t`A região entre $y=0$, $y=\sqrt{x}$ e $x\in[0,\,4]$ tem área dada por:`, t`$\int_0^4\int_0^{\sqrt x}dy\,dx$`, [t`$\int_0^4\int_0^{4}dy\,dx$`, t`$\int_0^{\sqrt x}\int_0^4dx\,dy$`, t`$\int_0^2\int_0^{x}dy\,dx$`], t`Para cada $x$, $y$ vai de $0$ a $\sqrt x$.`),
            num(t`Calcule $\int_0^1\int_0^{x} x\,dy\,dx$. (fração ou decimal)`, 1 / 3, t`$\int_0^1 x\cdot x\,dx=\frac13$.`, { tol: 0.002 }),
            mcq(t`O triângulo de vértices $(0,0)$, $(1,0)$ e $(1,1)$ é descrito por…`, ['$0\\le x\\le1$ e $0\\le y\\le x$', '$0\\le x\\le1$ e $x\\le y\\le1$', '$0\\le y\\le1$ e $0\\le x\\le y$', '$0\\le x\\le1$ e $0\\le y\\le1$'], 0, t`Abaixo da diagonal $y=x$.`),
          ],
        },
        {
          card: {
            title: 'Áreas e massa',
            body: t`Com $f=1$, a integral dupla dá a **área** entre $g_1$ e $g_2$ — conectando com a área entre curvas!

Com uma **densidade** $\rho(x,y)$, ela dá a **massa**: $m=\iint_R\rho\,dA$.`,
            example: t`Área entre $y=x^2$ e $y=x$: $\int_0^1\int_{x^2}^{x}dy\,dx=\int_0^1(x-x^2)dx=\frac16$.`,
            tip: t`Outras aplicações: centro de massa e momento de inércia.`,
          },
          exercises: [
            num(t`Calcule a área entre $y=x^2$ e $y=x$ via $\int_0^1\int_{x^2}^{x}dy\,dx$. (fração ou decimal)`, 1 / 6, t`$\int_0^1(x-x^2)\,dx=\frac12-\frac13=\frac16$.`, { tol: 0.002 }),
            num(t`Uma placa ocupa $[0,\,1]\times[0,\,1]$ com densidade $\rho(x,y)=x+y$. Qual sua massa?`, 1, t`$\int_0^1\int_0^1(x+y)\,dy\,dx=\frac12+\frac12=1$.`),
            gen((rng) => {
              const rho = randInt(rng, 2, 9);
              const [a, b] = [randInt(rng, 1, 4), randInt(rng, 1, 4)];
              return num(t`Uma placa retangular $${a}\times${b}$ tem densidade constante $${rho}$. Qual sua massa?`, rho * a * b, t`$\iint ${rho}\,dA=${rho}\cdot${a * b}=${rho * a * b}$.`);
            }),
            tf(t`A área de uma região $R$ pode ser calculada como $\iint_R 1\,dA$.`, true, t`Volume de altura 1 = área da base.`),
            num(t`Calcule a área sob $y=4-x^2$ e acima de $y=0$ como integral dupla. (3 casas)`, 32 / 3, t`$\int_{-2}^2\int_0^{4-x^2}dy\,dx=\int_{-2}^2(4-x^2)\,dx=\frac{32}{3}\approx10{,}667$.`, { tol: 0.005 }),
            num(t`Placa $[0,\,2]\times[0,\,1]$ com densidade $\rho=xy$. Qual a massa?`, 1, t`$\left(\int_0^2x\,dx\right)\left(\int_0^1y\,dy\right)=2\cdot\frac12=1$.`),
            num(t`Qual a área entre $y=2x$ e $y=x^2$ (de $x=0$ a $x=2$)? (fração ou decimal)`, 4 / 3, t`$\int_0^2\int_{x^2}^{2x}dy\,dx=\int_0^2(2x-x^2)dx=4-\frac83=\frac43$.`, { tol: 0.005 }),
          ],
        },
      ],
    },
  ],
};

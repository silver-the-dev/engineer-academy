import React from 'react';
import type { UnitDef } from '../../types';
import { gen, mcq, mcqS, num, tf, inter, plot, rmcq, near } from '../../helpers';
import { Arrow } from '../../../components/plot/Plot';
import { C } from '../../../theme';
import { fmt, pick, randInt, randNZ, term } from '../../../lib/random';
import { vectorLab, vectors3DLab } from '../../visuals';

const t = String.raw;
const V = (x: number, y: number) => t`(${x},\,${y})`;
const V3 = (x: number, y: number, z: number) => t`(${x},\,${y},\,${z})`;

const vecTarget = (tx: number, ty: number) =>
  plot({
    view: { xMin: -5, xMax: 5, yMin: -4, yMax: 4 },
    equalAspect: true,
    snap: 1,
    points: [{ id: 'u', x: 1, y: 1, color: C.p2, label: 'arraste' }],
    render: ({ pts }: any) => (
      <>
        <Arrow x1={0} y1={0} x2={tx} y2={ty} color={C.gold} width={2} />
        <Arrow x1={0} y1={0} x2={pts.u.x} y2={pts.u.y} color={C.p2} />
      </>
    ),
    info: ({ pts }: any) => t`$\vec u=(${fmt(pts.u.x)},\,${fmt(pts.u.y)})$`,
  });

export const vetoresGeo: UnitDef = {
  id: 'g-vgeo',
  title: 'Vetores: visão geométrica',
  subtitle: 'Soma, subtração, escalar, versor e ângulo',
  icon: '➡️',
  source: 'GA e Álgebra Linear · Unidade 1 — Vetores: viés geométrico',
  guide: t`Vetor = classe de segmentos orientados com mesmo **módulo, direção e sentido**. Soma pela regra do paralelogramo; multiplicar por escalar estica/encolhe (e inverte se negativo).`,
  lessons: [
    {
      id: 'g-vgeo-conc',
      title: 'Conceito e casos particulares',
      parts: [
        {
          card: {
            title: 'Módulo, direção e sentido',
            body: t`Um vetor é uma "flecha" que pode ser transportada paralelamente: o que importa é

• **módulo**: o tamanho
• **direção**: a reta suporte (horizontal, vertical, inclinada…)
• **sentido**: para qual lado da reta ele aponta

Dois vetores são **iguais** quando os três coincidem.`,
            visual: vectorLab('module'),
          },
          exercises: [
            mcq(t`Quais três informações definem um vetor?`, ['módulo, direção e sentido', 'origem, módulo e cor', 'só o módulo', 'direção e ponto final'], 0, t`A posição da flecha não importa: ela pode ser transportada paralelamente.`),
            tf(t`Dois vetores com mesmo módulo e mesma direção são sempre iguais.`, false, t`Falta o **sentido**: $\vec v$ e $-\vec v$ têm mesmo módulo e direção, mas são diferentes.`),
            tf(t`Transportar um vetor paralelamente (sem girar nem esticar) não muda o vetor.`, true, t`Módulo, direção e sentido continuam os mesmos.`),
            mcq(t`Uma reta horizontal tem dois sentidos possíveis. Quantas direções ela define?`, ['uma', 'duas', 'nenhuma', 'infinitas'], 0, t`Direção é a reta; sentido é para qual lado dela se aponta.`),
            inter(t`Arraste $\vec u$ até um vetor de módulo $3$ apontando para a **esquerda**.`, 'plot', vecTarget(3, 0).props, (v: any) => v && v.pts.u.x === -3 && v.pts.u.y === 0, t`$\vec u=(-3,\,0)$`, t`Para a esquerda significa sobre o eixo $x$ negativo; com módulo $3$: $\vec u=(-3,\,0)$.`),
            gen((rng) => {
              const [x, y, m] = pick(rng, [[3, 4, 5], [4, 3, 5], [-3, 4, 5], [0, 3, 3], [-4, 0, 4]] as const);
              return num(t`Qual o módulo da flecha que vai da origem até o ponto $${V(x, y)}$?`, m, t`É a distância até a origem: $\sqrt{${x * x}+${y * y}}=${m}$.`);
            }),
            mcq(t`Um vetor aponta para o nordeste e outro, de mesmo tamanho, para o sudoeste. Eles têm…`, ['mesma direção e sentidos opostos', 'direções diferentes', 'mesmo sentido', 'módulos diferentes'], 0, t`Estão sobre a mesma reta inclinada, apontando para lados contrários.`),
          ],
        },
        {
          card: {
            title: 'Casos particulares',
            body: t`• **Nulo** $\vec0$: módulo zero (um ponto)
• **Unitário**: módulo 1
• **Oposto** $-\vec v$: mesmo módulo e direção, sentido contrário
• **Colineares**: mesma direção (retas paralelas)
• **Coplanares**: cabem num mesmo plano`,
            tip: t`Dois vetores quaisquer são sempre coplanares; três podem não ser.`,
          },
          exercises: [
            mcq(t`O vetor oposto de $\vec v$ tem…`, ['mesmo módulo, mesma direção e sentido contrário', 'módulo oposto', 'direção perpendicular', 'módulo 1'], 0, t`Só o sentido muda.`),
            mcqS(t`Vetores que estão sobre retas paralelas são chamados…`, 'colineares', ['ortogonais', 'opostos', 'unitários'], t`Mesma direção = colineares.`),
            inter(t`Arraste $\vec u$ para formar um vetor **unitário** apontando para cima.`, 'plot', vecTarget(0, 1).props, (v: any) => v && v.pts.u.x === 0 && v.pts.u.y === 1, t`$\vec u=(0,\,1)$`, t`Unitário tem módulo $1$; para cima é a direção do eixo $y$ positivo: $\vec u=(0,\,1)=\vec j$.`),
            tf(t`O vetor nulo tem módulo zero.`, true, t`Por definição: é só um ponto.`),
            gen((rng) => {
              const x = randNZ(rng, -4, 4);
              const y = randNZ(rng, -3, 3);
              return inter(t`A flecha dourada é $\vec v=${V(x, y)}$. Arraste $\vec u$ até o **oposto** de $\vec v$.`, 'plot', vecTarget(x, y).props, (v: any) => v && v.pts.u.x === -x && v.pts.u.y === -y, `$${V(-x, -y)}$`, t`O oposto troca o sinal das duas coordenadas.`);
            }),
            tf(t`Dois vetores quaisquer sempre cabem num mesmo plano.`, true, t`Com as origens juntas, as duas flechas determinam um plano.`),
            mcq(t`Qual destes vetores é unitário?`, ['$(0{,}6,\\,0{,}8)$', '$(1,\\,1)$', '$(0{,}5,\\,0{,}5)$', '$(2,\\,0)$'], 0, t`$\sqrt{0{,}36+0{,}64}=1$. Já $|(1,\,1)|=\sqrt2$.`),
          ],
        },
      ],
    },
    {
      id: 'g-vgeo-soma',
      title: 'Soma e subtração',
      parts: [
        {
          card: {
            title: 'Regra do paralelogramo',
            body: t`Para somar, coloque o início de $\vec v$ na ponta de $\vec u$: a soma vai do início de $\vec u$ à ponta de $\vec v$. É a **diagonal** do paralelogramo. Arraste as pontas:`,
            visual: vectorLab('sum'),
            tip: t`A soma é comutativa ($\vec u+\vec v=\vec v+\vec u$) e associativa. Na física: forças resultantes!`,
          },
          exercises: [
            tf(t`$\vec u+\vec v=\vec v+\vec u$`, true, t`Os dois caminhos levam à mesma diagonal do paralelogramo.`),
            num(t`Duas forças de 3 N e 4 N, perpendiculares, atuam num ponto. Qual o módulo da resultante?`, 5, t`Pitágoras: $\sqrt{9+16}=5$ N.`, { unit: 'N' }),
            gen((rng) => {
              const a = randInt(rng, 2, 9);
              const b = randInt(rng, 1, a - 1);
              const same = rng() < 0.5;
              return num(t`Duas forças de $${a}$ N e $${b}$ N atuam na mesma direção e em sentidos ${same ? 'iguais' : 'opostos'}. Qual o módulo da resultante?`, same ? a + b : a - b, same ? t`Mesmo sentido: somam, $${a + b}$ N.` : t`Sentidos opostos: subtraem, $${a - b}$ N.`, { unit: 'N' });
            }),
            inter(t`Arraste $\vec u$ e $\vec v$ para que $\vec u+\vec v=(4,\,0)$ com $\vec u$ e $\vec v$ **não horizontais**.`, 'plot', vectorLab('sum').props, (v: any) => v && near(v.pts.u.x + v.pts.v.x, 4, 0.01) && near(v.pts.u.y + v.pts.v.y, 0, 0.01) && Math.abs(v.pts.u.y) > 0.1, t`ex.: $\vec u=(2,\,2)$ e $\vec v=(2,\,-2)$`, t`Basta que as componentes $y$ se cancelem: $u_y+v_y=0$ e $u_x+v_x=4$, como $(2,\,2)+(2,\,-2)=(4,\,0)$.`),
            mcq(t`Qual é o resultado de $\vec v+(-\vec v)$?`, ['o vetor nulo', '$2\\vec v$', '$\\vec v$', 'um vetor unitário'], 0, t`Ir e voltar o mesmo tanto: deslocamento zero.`),
            mcq(t`A soma de dois vetores de módulos $3$ e $5$ pode ter módulo…`, ['qualquer valor entre 2 e 8', 'só 8', 'só 2', 'qualquer valor acima de 8'], 0, t`Máximo quando têm o mesmo sentido ($8$), mínimo quando são opostos ($2$).`),
            num(t`Um barco aponta para o norte a $4$ m/s e a correnteza o leva para o leste a $3$ m/s. Qual a velocidade resultante?`, 5, t`Vetores perpendiculares: $\sqrt{16+9}=5$ m/s.`, { unit: 'm/s' }),
          ],
        },
        {
          card: {
            title: 'Subtração',
            body: t`$\vec u-\vec v=\vec u+(-\vec v)$. Geometricamente, é a flecha que vai da ponta de $\vec v$ até a ponta de $\vec u$ — a **outra** diagonal do paralelogramo:`,
            visual: vectorLab('diff'),
          },
          exercises: [
            tf(t`$\vec u-\vec v=\vec v-\vec u$`, false, t`$\vec v-\vec u=-(\vec u-\vec v)$: são opostos.`),
            mcq(t`No paralelogramo de lados $\vec u$ e $\vec v$, as diagonais são…`, [t`$\vec u+\vec v$ e $\vec u-\vec v$`, t`$\vec u$ e $\vec v$`, t`$2\vec u$ e $2\vec v$`, t`$\vec u\cdot\vec v$ e $\vec u\times\vec v$`], 0, t`Uma diagonal é a soma; a outra, a diferença.`),
            inter(t`Arraste para que $\vec u-\vec v=(0,\,3)$.`, 'plot', vectorLab('diff').props, (v: any) => v && near(v.pts.u.x - v.pts.v.x, 0, 0.01) && near(v.pts.u.y - v.pts.v.y, 3, 0.01), t`$\vec u$ exatamente 3 acima de $\vec v$`, t`$\vec u-\vec v$ é o vetor que vai da ponta de $\vec v$ até a ponta de $\vec u$: $(0,\,3)$ significa $\vec u$ exatamente $3$ unidades acima de $\vec v$.`),
            mcq(t`A flecha $\vec u-\vec v$ vai…`, ['da ponta de $\\vec v$ até a ponta de $\\vec u$', 'da ponta de $\\vec u$ até a ponta de $\\vec v$', 'da origem até a ponta de $\\vec u$', 'da origem até a ponta de $\\vec v$'], 0, t`Pense: $\vec v+(\vec u-\vec v)=\vec u$.`),
            tf(t`Se $\vec u-\vec v=\vec 0$, então $\vec u=\vec v$.`, true, t`Somando $\vec v$ dos dois lados.`),
            num(t`$\vec u$ e $\vec v$ são perpendiculares, com $|\vec u|=6$ e $|\vec v|=8$. Quanto vale $|\vec u-\vec v|$?`, 10, t`A diferença também forma um triângulo retângulo com eles: $\sqrt{36+64}=10$.`),
            mcq(t`Sabendo que $\vec a+\vec b=\vec c$, quanto vale $\vec c-\vec a$?`, [t`$\vec b$`, t`$-\vec b$`, t`$\vec a+\vec c$`, t`$\vec 0$`], 0, t`Passe $\vec a$ para o outro lado como na álgebra comum.`),
          ],
        },
      ],
    },
    {
      id: 'g-vgeo-esc',
      title: 'Escalar, versor e ângulo',
      parts: [
        {
          card: {
            title: 'Esticar e encolher',
            body: t`$k\vec u$: módulo $|k|\,|\vec u|$, mesma direção; sentido igual se $k>0$, oposto se $k<0$:`,
            visual: vectorLab('scale'),
          },
          exercises: [
            tf(t`$-2\vec v$ tem o dobro do módulo de $\vec v$ e sentido oposto.`, true, t`$|-2|=2$ dobra; o sinal negativo inverte.`),
            gen((rng) => {
              const k = pick(rng, [-3, -2, 2, 3, 0.5]);
              const m = randInt(rng, 2, 6);
              return num(t`Se $|\vec v|=${m}$, qual o módulo de $${fmt(k)}\vec v$?`, Math.abs(k) * m, t`$|k\vec v|=|k|\,|\vec v|=${fmt(Math.abs(k) * m)}$.`);
            }),
            mcq(t`Multiplicar um vetor por $0{,}5$…`, ['reduz o módulo pela metade, mantendo o sentido', 'inverte o sentido', 'dobra o módulo', 'gira o vetor'], 0, t`$0<k<1$ encolhe.`),
            inter(t`Ajuste $k$ e $\vec u$ para que $k\vec u$ tenha módulo 4 e sentido **oposto** a $\vec u$.`, 'plot', vectorLab('scale').props, (v: any) => v && v.p.k < 0 && near(Math.abs(v.p.k) * Math.hypot(v.pts.u.x, v.pts.u.y), 4, 0.06), t`ex.: $\vec u=(2,\,0)$ e $k=-2$`, t`$|k\vec u|=|k|\,|\vec u|=4$ e sentido oposto exige $k<0$; por exemplo $|\vec u|=2$ e $k=-2$.`),
            mcq(t`Se $\vec u=k\vec v$ para algum número $k$, então $\vec u$ e $\vec v$ são…`, ['colineares (paralelos)', 'perpendiculares', 'unitários', 'sempre iguais'], 0, t`Multiplicar por escalar não muda a direção.`),
            tf(t`$0\cdot\vec v=\vec0$ para qualquer vetor $\vec v$.`, true, t`Módulo $0\cdot|\vec v|=0$.`),
            gen((rng) => {
              const m = randInt(rng, 2, 8);
              const target = m * randInt(rng, 2, 4);
              return num(t`$|\vec v|=${m}$. Qual valor **positivo** de $k$ faz $|k\vec v|=${target}$?`, target / m, t`$k\cdot${m}=${target}\Rightarrow k=${target / m}$.`);
            }),
          ],
        },
        {
          card: {
            title: 'Versor e ângulo',
            body: t`O **versor** de $\vec v$ é o vetor unitário de mesma direção e sentido:
$$\hat v=\frac{\vec v}{|\vec v|}$$

O **ângulo** entre dois vetores (com origens juntas) fica em $[0^\circ,\,180^\circ]$: $0^\circ$ se têm o mesmo sentido, $180^\circ$ se são opostos.`,
            visual: vectorLab('dot'),
          },
          exercises: [
            mcqS(t`Qual o versor de $\vec v=(3,\,4)$?`, t`$\left(\frac35,\,\frac45\right)$`, [t`$(3,\,4)$`, t`$\left(\frac13,\,\frac14\right)$`, t`$(0{,}3,\,0{,}4)$`], t`$|\vec v|=5$; divida as coordenadas por 5.`),
            tf(t`O versor de qualquer vetor não nulo tem módulo 1.`, true, t`$\left|\frac{\vec v}{|\vec v|}\right|=\frac{|\vec v|}{|\vec v|}=1$.`),
            gen((rng) => {
              const [x, y, m] = pick(rng, [[6, 8, 10], [5, 12, 13], [8, 6, 10], [12, 5, 13]] as const);
              return rmcq(rng, t`Qual o versor de $\vec v=${V(x, y)}$?`, `$\\left(\\frac{${x}}{${m}},\\,\\frac{${y}}{${m}}\\right)$`, [`$\\left(\\frac{1}{${x}},\\,\\frac{1}{${y}}\\right)$`, `$${V(x, y)}$`, `$\\left(\\frac{${y}}{${m}},\\,\\frac{${x}}{${m}}\\right)$`], t`$|\vec v|=${m}$: divida cada coordenada por ${m}.`);
            }),
            mcq(t`Qual o ângulo entre $\vec v$ e $-\vec v$?`, ['$180^\\circ$', '$0^\\circ$', '$90^\\circ$', '$360^\\circ$'], 0, t`Mesma direção, sentidos opostos.`),
            inter(t`Arraste os vetores para formarem um ângulo de $90^\circ$.`, 'plot', vectorLab('dot').props, (v: any) => v && Math.abs(v.pts.u.x * v.pts.v.x + v.pts.u.y * v.pts.v.y) < 1e-9 && Math.hypot(v.pts.v.x, v.pts.v.y) > 0, t`ex.: $(2,\,1)$ e $(-1,\,2)$`, t`Vetores perpendiculares têm produto escalar nulo: $(2,\,1)\cdot(-1,\,2)=-2+2=0$.`),
            mcq(t`Qual o ângulo entre $(1,\,0)$ e $(1,\,1)$?`, ['$45^\\circ$', '$90^\\circ$', '$30^\\circ$', '$60^\\circ$'], 0, t`$(1,\,1)$ fica na diagonal do primeiro quadrante.`),
            gen((rng) => {
              const m = randInt(rng, 2, 9);
              const k = randInt(rng, 2, 5);
              return num(t`$\hat v$ é o versor de $\vec v$ e $|\vec v|=${m}$. Qual o módulo de $${k}\hat v$?`, k, t`$|\hat v|=1$, então $|${k}\hat v|=${k}$ (o módulo de $\vec v$ não importa).`);
            }),
          ],
        },
      ],
    },
  ],
};

export const vetoresAlg: UnitDef = {
  id: 'g-valg',
  title: 'Vetores: visão algébrica',
  subtitle: 'Coordenadas, módulo, ponto médio, paralelismo e R³',
  icon: '🔢',
  source: 'GA e Álgebra Linear · Unidade 2 — Vetores: viés algébrico',
  guide: t`Na base $\{\vec i,\vec j\}$, todo vetor é $(x,y)=x\vec i+y\vec j$. As operações viram contas coordenada a coordenada, e o módulo vem de Pitágoras.`,
  lessons: [
    {
      id: 'g-valg-coord',
      title: 'Coordenadas e operações',
      parts: [
        {
          card: {
            title: 'Base canônica',
            body: t`$\vec i=(1,\,0)$ e $\vec j=(0,\,1)$. Todo vetor do plano se escreve como

$$\vec v=(x,\,y)=x\vec i+y\vec j$$

Igualdade: $(a,\,b)=(c,\,d)\iff a=c$ e $b=d$.`,
            visual: vectorLab('module', { snap: 1 }),
          },
          exercises: [
            tf(t`$3\vec i-2\vec j=(3,\,-2)$`, true, t`O coeficiente de $\vec i$ é o $x$ e o de $\vec j$ é o $y$.`),
            mcq(t`Como se escreve $(0,\,-5)$ na base canônica?`, [t`$-5\vec j$`, t`$-5\vec i$`, t`$5\vec i-\vec j$`, t`$\vec i-5\vec j$`], 0, t`$x=0$ e $y=-5$.`),
            gen((rng) => {
              const x = randInt(rng, -4, 4);
              const y = randInt(rng, -3, 3);
              return inter(t`Arraste $\vec u$ até $${term(x, '\\vec i', true) || '0\\vec i'}${term(y, '\\vec j')}$.`, 'plot', vecTarget(x, y).props, (v: any) => v && v.pts.u.x === x && v.pts.u.y === y, `$${V(x, y)}$`, t`$a\vec i+b\vec j$ é o vetor $(a,\,b)$: o coeficiente de $\vec i$ é a coordenada $x$ e o de $\vec j$, a coordenada $y$. Aqui, $${V(x, y)}$.`);
            }),
            num(t`Se $(2a-1,\ 6)=(5,\ 3b)$, quanto vale $a+b$?`, 5, t`$2a-1=5\Rightarrow a=3$; $3b=6\Rightarrow b=2$.`),
            gen((rng) => {
              const x = randInt(rng, -6, 6);
              const y = randInt(rng, -6, 6);
              return rmcq(rng, t`Quais são as coordenadas de $${term(x, '\\vec i', true) || '0\\vec i'}${term(y, '\\vec j')}$?`, `$${V(x, y)}$`, [`$${V(y, x)}$`, `$${V(-x, y)}$`, `$${V(x, -y)}$`, `$${V(x + y, 0)}$`], t`Coeficiente de $\vec i$ primeiro, de $\vec j$ depois.`);
            }),
            gen((rng) => {
              const a = randInt(rng, -4, 5);
              const b = randInt(rng, -4, 5);
              const c = randNZ(rng, -3, 3);
              return num(t`Se $(x+${c},\ y)=(${a + c},\ ${b})$, quanto vale $x\cdot y$?`, a * b, t`$x=${a}$ e $y=${b}$, produto $${a * b}$.`);
            }),
            tf(t`$\vec i+\vec j$ é um vetor unitário.`, false, t`$\vec i+\vec j=(1,\,1)$, com módulo $\sqrt2$.`),
          ],
        },
        {
          card: {
            title: 'Operações com coordenadas',
            body: t`Tudo é feito **coordenada a coordenada**:

$$(x_1,y_1)+(x_2,y_2)=(x_1+x_2,\ y_1+y_2)\qquad k(x,y)=(kx,\ ky)$$

Uma **combinação linear** de $\vec u$ e $\vec v$ é qualquer $a\vec u+b\vec v$.`,
            visual: vectorLab('sum', { snap: 1 }),
          },
          exercises: [
            gen((rng) => {
              const a = [randInt(rng, -5, 5), randInt(rng, -5, 5)];
              const b = [randInt(rng, -5, 5), randInt(rng, -5, 5)];
              return rmcq(rng, t`Calcule $${V(a[0], a[1])}+${V(b[0], b[1])}$.`, `$${V(a[0] + b[0], a[1] + b[1])}$`, [`$${V(a[0] - b[0], a[1] - b[1])}$`, `$${V(a[0] * b[0], a[1] * b[1])}$`, `$${V(a[0] + b[1], a[1] + b[0])}$`], t`Some $x$ com $x$ e $y$ com $y$.`);
            }),
            gen((rng) => {
              const k = pick(rng, [-3, -2, 2, 3, 4]);
              const a = [randInt(rng, -4, 4), randInt(rng, -4, 4)];
              return rmcq(rng, t`Calcule $${k}\cdot${V(a[0], a[1])}$.`, `$${V(k * a[0], k * a[1])}$`, [`$${V(k * a[0], a[1])}$`, `$${V(a[0] + k, a[1] + k)}$`, `$${V(-k * a[0], -k * a[1])}$`], t`O escalar multiplica as duas coordenadas.`);
            }),
            gen((rng) => {
              const a = [randInt(rng, -5, 5), randInt(rng, -5, 5)];
              const b = [randNZ(rng, -5, 5), randInt(rng, -5, 5)];
              const k = pick(rng, [-3, -2, 2, 3]); // k = 1 would make "u + v" both the answer and a distractor
              return rmcq(rng, t`Sendo $\vec u=${V(a[0], a[1])}$ e $\vec v=${V(b[0], b[1])}$, calcule $\vec u+${k}\vec v$.`, `$${V(a[0] + k * b[0], a[1] + k * b[1])}$`, [`$${V(a[0] + b[0], a[1] + b[1])}$`, `$${V(k * (a[0] + b[0]), k * (a[1] + b[1]))}$`, `$${V(a[0] - k * b[0], a[1] - k * b[1])}$`], t`$${V(a[0], a[1])}+${V(k * b[0], k * b[1])}=${V(a[0] + k * b[0], a[1] + k * b[1])}$.`);
            }),
            inter(t`Arraste $\vec u$ e $\vec v$ para que $\vec u+\vec v=(1,\,3)$.`, 'plot', vectorLab('sum', { snap: 1 }).props, (v: any) => v && v.pts.u.x + v.pts.v.x === 1 && v.pts.u.y + v.pts.v.y === 3, t`ex.: $(2,\,1)+(-1,\,2)$`, t`Soma-se coordenada a coordenada: $u_x+v_x=1$ e $u_y+v_y=3$, como $(2,\,1)+(-1,\,2)=(1,\,3)$.`),
            gen((rng) => {
              const a = [randInt(rng, -4, 4), randInt(rng, -4, 4)];
              const s = [randInt(rng, -6, 6), randInt(rng, -6, 6)];
              return rmcq(rng, t`Se $\vec u=${V(a[0], a[1])}$ e $\vec u+\vec v=${V(s[0], s[1])}$, quem é $\vec v$?`, `$${V(s[0] - a[0], s[1] - a[1])}$`, [`$${V(s[0] + a[0], s[1] + a[1])}$`, `$${V(a[0] - s[0], a[1] - s[1])}$`, `$${V(s[1] - a[1], s[0] - a[0])}$`], t`$\vec v=(\vec u+\vec v)-\vec u$.`);
            }),
            num(t`Encontre $a$ tal que $a(1,\,2)+(3,\,-1)=(5,\,3)$.`, 2, t`Na 1ª coordenada: $a+3=5\Rightarrow a=2$ (e confere: $2\cdot2-1=3$).`),
            num(t`Escreva $(7,\,4)$ como $a(1,\,1)+b(1,\,-1)$. Quanto vale $a$?`, 5.5, t`$a+b=7$ e $a-b=4$: somando, $2a=11\Rightarrow a=5{,}5$ (e $b=1{,}5$).`),
          ],
        },
      ],
    },
    {
      id: 'g-valg-pontos',
      title: 'Vetor entre pontos, módulo e ponto médio',
      parts: [
        {
          card: {
            title: 'B − A e módulo',
            body: t`O vetor que vai de $A$ até $B$ é "ponta menos origem":

$$\vec{AB}=B-A=(x_B-x_A,\ y_B-y_A)\qquad |\vec v|=\sqrt{x^2+y^2}$$`,
            visual: vectorLab('module', { snap: 1 }),
            example: t`$A(1,\,2)$, $B(4,\,6)$: $\vec{AB}=(3,\,4)$ e $|\vec{AB}|=5$.`,
          },
          exercises: [
            gen((rng) => {
              const A = [randInt(rng, -4, 4), randInt(rng, -4, 4)];
              const B = [randInt(rng, -4, 4), randInt(rng, -4, 4)];
              return rmcq(rng, t`Dados $A=${V(A[0], A[1])}$ e $B=${V(B[0], B[1])}$, qual é $\vec{AB}$?`, `$${V(B[0] - A[0], B[1] - A[1])}$`, [`$${V(A[0] - B[0], A[1] - B[1])}$`, `$${V(A[0] + B[0], A[1] + B[1])}$`, `$${V(B[0] - A[1], B[1] - A[0])}$`], t`Ponta menos origem.`);
            }),
            tf(t`$\vec{BA}=-\vec{AB}$`, true, t`Mesmo segmento, sentido contrário.`),
            gen((rng) => {
              const [x, y, m] = pick(rng, [[3, 4, 5], [6, 8, 10], [5, 12, 13], [8, 15, 17], [-3, 4, 5], [12, -5, 13]] as const);
              return num(t`Calcule $|\vec v|$ para $\vec v=${V(x, y)}$.`, m, t`$\sqrt{${x * x}+${y * y}}=${m}$.`);
            }),
            inter(t`Arraste $\vec u$ até um vetor de módulo $5$ que não esteja sobre os eixos.`, 'plot', vectorLab('module', { snap: 1 }).props, (v: any) => v && near(Math.hypot(v.pts.u.x, v.pts.u.y), 5, 0.01) && v.pts.u.x !== 0 && v.pts.u.y !== 0, t`ex.: $(3,\,4)$ ou $(-4,\,3)$`, t`$|\vec u|=\sqrt{x^2+y^2}=5$ com $x,y\ne0$: o triângulo $3$-$4$-$5$ dá $(3,\,4)$, $(-4,\,3)$ etc.`),
            gen((rng) => {
              const [dx, dy, d] = pick(rng, [[3, 4, 5], [6, 8, 10], [5, 12, 13]] as const);
              const A = [randInt(rng, -3, 3), randInt(rng, -3, 3)];
              return num(t`Qual a distância entre $A=${V(A[0], A[1])}$ e $B=${V(A[0] + dx, A[1] - dy)}$?`, d, t`$|\vec{AB}|=|${V(dx, -dy)}|=${d}$.`);
            }),
            gen((rng) => {
              const A = [randInt(rng, -4, 4), randInt(rng, -4, 4)];
              const v = [randInt(rng, -4, 4), randInt(rng, -4, 4)];
              return rmcq(rng, t`Partindo de $A=${V(A[0], A[1])}$ e andando o vetor $${V(v[0], v[1])}$, onde se chega?`, `$${V(A[0] + v[0], A[1] + v[1])}$`, [`$${V(A[0] - v[0], A[1] - v[1])}$`, `$${V(v[0] - A[0], v[1] - A[1])}$`, `$${V(A[0] + v[1], A[1] + v[0])}$`], t`$B=A+\vec v$.`);
            }),
            num(t`Um triângulo tem vértices $A(0,\,0)$, $B(6,\,0)$ e $C(6,\,8)$. Qual o comprimento do lado $AC$?`, 10, t`$|\vec{AC}|=|(6,\,8)|=10$.`),
          ],
        },
        {
          card: {
            title: 'Ponto médio e versor',
            body: t`$$M=\frac{A+B}{2}\qquad \hat v=\frac{\vec v}{|\vec v|}$$

O ponto médio é a média das coordenadas; o versor é o vetor dividido pelo próprio módulo.`,
            example: t`$A(1,\,2)$, $B(4,\,6)$: $M=(2{,}5;\ 4)$. Versor de $(3,\,4)$: $\left(\frac35,\,\frac45\right)$.`,
          },
          exercises: [
            num(t`O ponto médio de $A(2,\,-1)$ e $B(6,\,5)$ tem ordenada:`, 2, t`$\frac{-1+5}{2}=2$.`),
            gen((rng) => {
              const A = [2 * randInt(rng, -3, 3), 2 * randInt(rng, -3, 3)];
              const B = [2 * randInt(rng, -3, 3), 2 * randInt(rng, -3, 3)];
              if (A[0] + B[0] === 0 && A[1] + B[1] === 0) B[0] += 2; // B = -A: midpoint and A+B would both be the origin
              return rmcq(rng, t`Qual o ponto médio entre $A=${V(A[0], A[1])}$ e $B=${V(B[0], B[1])}$?`, `$${V((A[0] + B[0]) / 2, (A[1] + B[1]) / 2)}$`, [`$${V(A[0] + B[0], A[1] + B[1])}$`, `$${V((B[0] - A[0]) / 2, (B[1] - A[1]) / 2)}$`, `$${V((A[1] + B[1]) / 2, (A[0] + B[0]) / 2)}$`], t`Média de cada coordenada.`);
            }),
            num(t`Para que valor de $k$ o vetor $(k,\,0{,}6)$ é unitário (com $k>0$)?`, 0.8, t`$k^2+0{,}36=1\Rightarrow k=0{,}8$.`),
            gen((rng) => {
              const [x, y, m] = pick(rng, [[6, 8, 10], [5, 12, 13], [-8, 6, 10], [12, -5, 13]] as const);
              return num(t`Qual a primeira coordenada do versor de $${V(x, y)}$? (decimal)`, x / m, t`$\frac{${x}}{${m}}=${fmt(x / m, 4)}$.`, { tol: 0.002 });
            }),
            gen((rng) => {
              const M = [randInt(rng, -3, 3), randInt(rng, -3, 3)];
              const A = [randInt(rng, -5, 5), randInt(rng, -5, 5)];
              return rmcq(rng, t`$M=${V(M[0], M[1])}$ é o ponto médio de $AB$, com $A=${V(A[0], A[1])}$. Quem é $B$?`, `$${V(2 * M[0] - A[0], 2 * M[1] - A[1])}$`, [`$${V(M[0] - A[0], M[1] - A[1])}$`, `$${V(2 * A[0] - M[0], 2 * A[1] - M[1])}$`, `$${V(M[0] + A[0], M[1] + A[1])}$`], t`$B=2M-A$.`);
            }),
            tf(t`O versor de $(0,\,-7)$ é $(0,\,-1)$.`, true, t`$\frac{(0,\,-7)}{7}=(0,\,-1)$.`),
            gen((rng) => {
              const k = randInt(rng, 2, 6);
              return rmcq(rng, t`Qual vetor tem a direção e o sentido de $(3,\,4)$ e módulo $${k * 5}$?`, `$${V(3 * k, 4 * k)}$`, [`$${V(3 + k, 4 + k)}$`, `$${V(3 * k * 5, 4 * k * 5)}$`, `$${V(-3 * k, -4 * k)}$`], t`Versor $\left(\frac35,\,\frac45\right)$ vezes $${5 * k}$: $${V(3 * k, 4 * k)}$.`);
            }),
          ],
        },
      ],
    },
    {
      id: 'g-valg-r3',
      title: 'Paralelismo e vetores no espaço',
      parts: [
        {
          card: {
            title: 'Paralelismo',
            body: t`$\vec u\parallel\vec v\iff\vec u=k\vec v\iff\frac{x_1}{x_2}=\frac{y_1}{y_2}$ (coordenadas proporcionais).`,
            example: t`$(2,\,-3)\parallel(-4,\,6)$, pois $(-4,\,6)=-2(2,\,-3)$.`,
          },
          exercises: [
            tf(t`$(2,\,-3)$ e $(-4,\,6)$ são paralelos.`, true, t`$(-4,\,6)=-2\cdot(2,\,-3)$.`),
            gen((rng) => {
              const a = randNZ(rng, -4, 4);
              const b = randNZ(rng, -4, 4);
              const k = pick(rng, [2, 3, -2]);
              return num(t`Para que $\vec u=${V(a, b)}$ e $\vec v=(${a * k},\,m)$ sejam paralelos, quanto vale $m$?`, b * k, t`$\vec v=${k}\vec u$ ⟹ $m=${b * k}$.`);
            }),
            gen((rng) => {
              const a = randNZ(rng, -4, 4);
              const b = randNZ(rng, -4, 4);
              const k = pick(rng, [2, 3, -2, -3]);
              const par = rng() < 0.5;
              return tf(t`Os vetores $${V(a, b)}$ e $${V(k * a, k * b + (par ? 0 : 1))}$ são paralelos.`, par, par ? t`O segundo é $${k}$ vezes o primeiro.` : t`$\frac{${k * a}}{${a}}=${k}$, mas $\frac{${k * b + 1}}{${b}}\neq${k}$.`);
            }),
            mcq(t`Qual vetor é paralelo a $(3,\,1)$?`, ['$(-6,\\,-2)$', '$(1,\\,3)$', '$(3,\\,-1)$', '$(6,\\,1)$'], 0, t`$(-6,\,-2)=-2(3,\,1)$.`),
            gen((rng) => {
              const k = pick(rng, [2, 3, 4]);
              const b = randNZ(rng, -3, 3);
              return num(t`Para quais $m$ os vetores $(m,\,${b})$ e $(${k * k},\,${k * b})$ são paralelos? Dê o valor de $m$.`, k, t`$\frac{m}{${k * k}}=\frac{${b}}{${k * b}}=\frac{1}{${k}}\Rightarrow m=${k}$.`);
            }),
            tf(t`O vetor nulo é paralelo a qualquer vetor.`, true, t`$\vec0=0\cdot\vec v$ para qualquer $\vec v$.`),
            num(t`Os pontos $A(1,\,1)$, $B(3,\,5)$ e $C(4,\,k)$ estão alinhados. Quanto vale $k$?`, 7, t`$\vec{AB}=(2,\,4)$ e $\vec{AC}=(3,\,k-1)$ paralelos: $\frac{3}{2}=\frac{k-1}{4}\Rightarrow k=7$.`),
          ],
        },
        {
          card: {
            title: 'No espaço R³',
            body: t`Base $\{\vec i,\vec j,\vec k\}$: $\vec v=(x,\,y,\,z)=x\vec i+y\vec j+z\vec k$, e

$$|\vec v|=\sqrt{x^2+y^2+z^2}$$

As operações continuam coordenada a coordenada. Gire e mexa nas coordenadas:`,
            visual: vectors3DLab(),
          },
          exercises: [
            gen((rng) => {
              const [x, y, z, m] = pick(rng, [[1, 2, 2, 3], [2, 3, 6, 7], [2, 6, 9, 11], [4, 4, 7, 9], [1, 4, 8, 9]] as const);
              return num(t`Calcule $|\vec v|$ para $\vec v=${V3(x, y, z)}$.`, m, t`$\sqrt{${x * x}+${y * y}+${z * z}}=\sqrt{${m * m}}=${m}$.`);
            }),
            mcqS(t`Qual vetor é paralelo a $(1,\,-2,\,3)$?`, t`$(-2,\,4,\,-6)$`, [t`$(2,\,4,\,6)$`, t`$(1,\,2,\,3)$`, t`$(3,\,-2,\,1)$`], t`$(-2,\,4,\,-6)=-2(1,\,-2,\,3)$.`),
            inter(t`Gire a cena e ajuste o vetor para $(2,\,-1{,}5,\,1)$.`, 'space3d', vectors3DLab().props!, (v: any) => v && near(v.p.x, 2, 0.01) && near(v.p.y, -1.5, 0.01) && near(v.p.z, 1, 0.01), t`$x=2$, $y=-1{,}5$, $z=1$`, t`Cada coordenada é a componente em um eixo: $2$ em $x$, $-1{,}5$ em $y$ e $1$ em $z$.`),
            gen((rng) => {
              const a = [randInt(rng, -4, 4), randInt(rng, -4, 4), randInt(rng, -4, 4)];
              const b = [randInt(rng, -4, 4), randInt(rng, -4, 4), randInt(rng, -4, 4)];
              return rmcq(rng, t`Calcule $${V3(a[0], a[1], a[2])}-${V3(b[0], b[1], b[2])}$.`, `$${V3(a[0] - b[0], a[1] - b[1], a[2] - b[2])}$`, [`$${V3(a[0] + b[0], a[1] + b[1], a[2] + b[2])}$`, `$${V3(b[0] - a[0], b[1] - a[1], b[2] - a[2])}$`, `$${V3(a[0] - b[0], a[1] - b[1], a[2] + b[2])}$`], t`Coordenada a coordenada.`);
            }),
            mcq(t`Como se escreve $2\vec i-\vec k$ em coordenadas?`, [t`$(2,\,0,\,-1)$`, t`$(2,\,-1,\,0)$`, t`$(2,\,-1)$`, t`$(0,\,2,\,-1)$`], 0, t`Não há componente em $\vec j$: $y=0$.`),
            gen((rng) => {
              const [dx, dy, dz, d] = pick(rng, [[1, 2, 2, 3], [2, 3, 6, 7], [4, 4, 7, 9]] as const);
              const A = [randInt(rng, -3, 3), randInt(rng, -3, 3), randInt(rng, -3, 3)];
              return num(t`Qual a distância entre $A=${V3(A[0], A[1], A[2])}$ e $B=${V3(A[0] + dx, A[1] + dy, A[2] + dz)}$?`, d, t`$|\vec{AB}|=|${V3(dx, dy, dz)}|=${d}$.`);
            }),
            num(t`Qual a diagonal de uma caixa de $2\times3\times6$ (do canto de baixo ao canto oposto de cima)?`, 7, t`$\sqrt{4+9+36}=7$.`),
          ],
        },
      ],
    },
  ],
};

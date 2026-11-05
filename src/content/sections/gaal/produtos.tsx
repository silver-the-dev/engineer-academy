import React from 'react';
import type { Unit } from '../../types';
import { gen, mcq, mcqS, num, tf, fill, match, order, inter, plot, rmcq, near, multi } from '../../helpers';
import { C } from '../../../theme';
import { fmt, pick, randInt, randNZ } from '../../../lib/random';
import { cross3DLab, vectorLab } from '../../visuals';

const t = String.raw;
const V3 = (a: number[]) => t`(${a[0]},\,${a[1]},\,${a[2]})`;
const dot = (a: number[], b: number[]) => a.reduce((s, v, i) => s + v * b[i], 0);
const cross = (a: number[], b: number[]) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];

export const escalar: Unit = {
  id: 'g-esc',
  title: 'Produto escalar',
  subtitle: 'Definição, ângulo, ortogonalidade e projeção',
  icon: '📏',
  source: 'GA e Álgebra Linear · Unidade 3 — Produto escalar',
  guide: t`$\vec u\cdot\vec v=x_1x_2+y_1y_2+z_1z_2=|\vec u||\vec v|\cos\theta$. Resultado é um **número**. Zero ⟺ ortogonais. Base do trabalho $W=\vec F\cdot\vec d$ e das projeções.`,
  lessons: [
    {
      id: 'g-esc-def',
      title: 'Definição e propriedades',
      cards: [
        {
          title: 'Duas definições, mesma coisa',
          body: t`**Algébrica**: $\vec u\cdot\vec v=x_1x_2+y_1y_2\,(+z_1z_2)$
**Geométrica**: $\vec u\cdot\vec v=|\vec u|\,|\vec v|\cos\theta$

Mexa nos vetores e veja o sinal do produto: positivo (ângulo agudo), zero (reto), negativo (obtuso).`,
          visual: vectorLab('dot', { snap: 0.5 }),
          tip: t`Não confunda **produto escalar** ($\vec u\cdot\vec v$, dá número) com **produto por escalar** ($k\vec v$, dá vetor). E $\vec v\cdot\vec v=|\vec v|^2$.`,
        },
      ],
      exercises: [
        gen((rng) => {
          const a = [randInt(rng, -5, 5), randInt(rng, -5, 5), randInt(rng, -5, 5)];
          const b = [randInt(rng, -5, 5), randInt(rng, -5, 5), randInt(rng, -5, 5)];
          return num(t`Calcule $${V3(a)}\cdot${V3(b)}$.`, dot(a, b), t`$${a[0] * b[0]}+(${a[1] * b[1]})+(${a[2] * b[2]})=${dot(a, b)}$.`);
        }),
        gen((rng) => {
          const m1 = randInt(rng, 2, 6);
          const m2 = randInt(rng, 2, 6);
          const ang = pick(rng, [60, 90, 120, 0, 180]);
          const c = Math.round(Math.cos((ang * Math.PI) / 180) * 1e9) / 1e9;
          return num(t`$|\vec u|=${m1}$, $|\vec v|=${m2}$ e o ângulo entre eles é $${ang}^\circ$. Quanto vale $\vec u\cdot\vec v$?`, m1 * m2 * c, t`$${m1}\cdot${m2}\cdot\cos${ang}^\circ=${fmt(m1 * m2 * c)}$.`);
        }),
        tf(t`$\vec u\cdot\vec v=\vec v\cdot\vec u$`, true),
        mcqS(t`Se $\vec u\cdot\vec v<0$, o ângulo entre eles é:`, 'obtuso', ['agudo', 'reto', 'nulo']),
        num(t`Se $|\vec v|=7$, quanto vale $\vec v\cdot\vec v$?`, 49),
      ],
    },
    {
      id: 'g-esc-ang',
      title: 'Ângulo e ortogonalidade',
      cards: [
        {
          title: 'Calculando ângulos',
          body: t`$$\cos\theta=\frac{\vec u\cdot\vec v}{|\vec u|\,|\vec v|}$$
**Ortogonais** ⟺ $\vec u\cdot\vec v=0$.

**Cossenos diretores** de $\vec v$: $\cos\alpha=\frac{x}{|\vec v|}$, $\cos\beta=\frac{y}{|\vec v|}$, $\cos\gamma=\frac{z}{|\vec v|}$, com $\cos^2\alpha+\cos^2\beta+\cos^2\gamma=1$.`,
          example: t`$\vec u=(1,1,0)$, $\vec v=(0,1,1)$: $\cos\theta=\frac{1}{\sqrt2\sqrt2}=\frac12\Rightarrow\theta=60^\circ$.`,
        },
      ],
      exercises: [
        gen((rng) => {
          const a = randNZ(rng, -4, 4);
          const b = randNZ(rng, -4, 4);
          const c = randNZ(rng, -3, 3);
          // find m such that (a, b, c)·(m, 1, 1) = 0 -> a m + b + c = 0
          if ((b + c) % a !== 0) return num(t`Para que $(${a},\,${b},\,${c})\perp(m,\,1,\,1)$, quanto vale $m$?`, -(b + c) / a, t`$${a}m+${b}+${c}=0\Rightarrow m=${fmt(-(b + c) / a)}$.`, { tol: 0.01 });
          return num(t`Para que $(${a},\,${b},\,${c})\perp(m,\,1,\,1)$, quanto vale $m$?`, -(b + c) / a, t`$${a}m+${b}+${c}=0\Rightarrow m=${-(b + c) / a}$.`);
        }),
        num(t`Calcule o ângulo (em graus) entre $(1,\,0)$ e $(1,\,1)$.`, 45, undefined, { unit: '°' }),
        num(t`Calcule o ângulo (em graus) entre $(1,\,1,\,0)$ e $(0,\,1,\,1)$.`, 60, t`$\cos\theta=\frac12$.`, { unit: '°' }),
        inter(t`Arraste os vetores para formarem $135^\circ$.`, 'plot', vectorLab('dot', { snap: 0.5 }).props, (v: any) => {
          if (!v) return false;
          const { u, v: w } = v.pts;
          const c = (u.x * w.x + u.y * w.y) / (Math.hypot(u.x, u.y) * Math.hypot(w.x, w.y) || 1);
          return Math.abs((Math.acos(Math.max(-1, Math.min(1, c))) * 180) / Math.PI - 135) < 1;
        }, t`ex.: $(1,\,0)$ e $(-1,\,1)$`),
        tf(t`Os vetores $\vec i$, $\vec j$ e $\vec k$ são dois a dois ortogonais.`, true),
      ],
    },
    {
      id: 'g-esc-proj',
      title: 'Projeção e trabalho',
      cards: [
        {
          title: 'A sombra de um vetor',
          body: t`$$\operatorname{proj}_{\vec v}\vec u=\left(\frac{\vec u\cdot\vec v}{\vec v\cdot\vec v}\right)\vec v$$
É a "sombra" de $\vec u$ na direção de $\vec v$. Seu tamanho é $\frac{|\vec u\cdot\vec v|}{|\vec v|}$.`,
          visual: vectorLab('proj', { u: [2, 2.5], v: [3, 0.5] }),
          tip: t`**Trabalho** de uma força: $W=\vec F\cdot\vec d=|\vec F||\vec d|\cos\theta$. Só a componente da força **na direção do deslocamento** trabalha.`,
        },
      ],
      exercises: [
        mcqS(t`Qual a projeção de $\vec u=(3,\,4)$ sobre $\vec v=(1,\,0)$?`, t`$(3,\,0)$`, [t`$(0,\,4)$`, t`$(3,\,4)$`, t`$(5,\,0)$`]),
        gen((rng) => {
          const F = randInt(rng, 10, 50);
          const d = randInt(rng, 2, 10);
          const ang = pick(rng, [0, 60, 90]);
          return num(t`Uma força de $${F}$ N desloca um bloco $${d}$ m, formando $${ang}^\circ$ com o deslocamento. Qual o trabalho (J)?`, F * d * Math.round(Math.cos((ang * Math.PI) / 180) * 1e9) / 1e9, t`$W=${F}\cdot${d}\cdot\cos${ang}^\circ$.`, { unit: 'J' });
        }),
        num(t`Calcule o comprimento da projeção de $\vec u=(2,\,3)$ sobre $\vec v=(4,\,0)$.`, 2, t`$\frac{|\vec u\cdot\vec v|}{|\vec v|}=\frac{8}{4}=2$.`),
        inter(t`Arraste $\vec u$ de modo que sua projeção sobre $\vec v$ seja o **vetor nulo**.`, 'plot', vectorLab('proj', { u: [2, 2.5], v: [3, 0.5] }).props, (v: any) => v && Math.abs(v.pts.u.x * v.pts.v.x + v.pts.u.y * v.pts.v.y) < 1e-9 && Math.hypot(v.pts.u.x, v.pts.u.y) > 0, t`$\vec u\perp\vec v$`),
      ],
    },
  ],
};

export const vetorial: Unit = {
  id: 'g-vet',
  title: 'Produto vetorial e misto',
  subtitle: 'Vetor normal, áreas e volumes',
  icon: '✖️',
  source: 'GA e Álgebra Linear · Unidade 4 — Produto vetorial e produto misto',
  guide: t`$\vec u\times\vec v$ é um **vetor** perpendicular a $\vec u$ e $\vec v$, com módulo = área do paralelogramo. O produto misto $[\vec u,\vec v,\vec w]$ é um número: o volume (com sinal) do paralelepípedo.`,
  lessons: [
    {
      id: 'g-vet-def',
      title: 'Produto vetorial',
      cards: [
        {
          title: 'O determinante simbólico',
          body: t`$$\vec u\times\vec v=\begin{vmatrix}\vec i&\vec j&\vec k\\x_1&y_1&z_1\\x_2&y_2&z_2\end{vmatrix}$$

• perpendicular a $\vec u$ e $\vec v$ (regra da mão direita)
• $\vec v\times\vec u=-\vec u\times\vec v$ (anticomutativo!)
• $\vec u\parallel\vec v\iff\vec u\times\vec v=\vec0$

Gire a cena:`,
          visual: cross3DLab(),
          example: t`$\vec i\times\vec j=\vec k$, $\vec j\times\vec k=\vec i$, $\vec k\times\vec i=\vec j$.`,
        },
      ],
      exercises: [
        gen((rng) => {
          const a = [randInt(rng, -3, 3), randInt(rng, -3, 3), randInt(rng, -3, 3)];
          const b = [randInt(rng, -3, 3), randInt(rng, -3, 3), randInt(rng, -3, 3)];
          const c = cross(a, b);
          return rmcq(rng, t`Calcule $${V3(a)}\times${V3(b)}$.`, `$${V3(c)}$`, [`$${V3(c.map((x) => -x))}$`, `$${V3([a[0] * b[0], a[1] * b[1], a[2] * b[2]])}$`, `$${V3([c[0], -c[1], c[2]])}$`], t`Pelo determinante: $(y_1z_2-z_1y_2,\ z_1x_2-x_1z_2,\ x_1y_2-y_1x_2)=${V3(c)}$.`);
        }),
        mcqS(t`Quanto vale $\vec j\times\vec i$?`, t`$-\vec k$`, [t`$\vec k$`, t`$\vec0$`, t`$1$`]),
        tf(t`O produto vetorial de dois vetores paralelos é o vetor nulo.`, true),
        mcq(t`O vetor $\vec u\times\vec v$ é…`, ['ortogonal a $\\vec u$ e a $\\vec v$', 'paralelo a $\\vec u$', 'a soma de $\\vec u$ e $\\vec v$', 'um número real'], 0),
        inter(t`Ajuste os vetores para que a área do paralelogramo seja $6$.`, 'space3d', cross3DLab().props!, (v: any) => v && near(Math.abs(v.p.ux * v.p.vy), 6, 0.01), t`ex.: $u_x=3$ e $v_y=2$`),
      ],
    },
    {
      id: 'g-vet-area',
      title: 'Áreas com produto vetorial',
      cards: [
        {
          title: 'Paralelogramo e triângulo',
          body: t`$$A_{\text{paralelogramo}}=|\vec u\times\vec v|\qquad A_{\triangle}=\frac12|\vec u\times\vec v|$$

Também vale **Lagrange**: $|\vec u\times\vec v|^2=|\vec u|^2|\vec v|^2-(\vec u\cdot\vec v)^2$, ou seja $|\vec u\times\vec v|=|\vec u||\vec v|\operatorname{sen}\theta$.`,
          visual: vectorLab('area', { snap: 1 }),
        },
      ],
      exercises: [
        gen((rng) => {
          const a = [randInt(rng, 1, 4), 0, 0];
          const b = [randInt(rng, -2, 2), randInt(rng, 1, 4), 0];
          return num(t`Calcule a área do paralelogramo formado por $${V3(a)}$ e $${V3(b)}$.`, Math.abs(cross(a, b)[2]), t`$\vec u\times\vec v=${V3(cross(a, b))}$, módulo $${Math.abs(cross(a, b)[2])}$.`);
        }),
        num(t`Qual a área do triângulo de vértices $A(0,0,0)$, $B(2,0,0)$ e $C(0,3,0)$?`, 3, t`$\frac12|\vec{AB}\times\vec{AC}|=\frac12|(0,0,6)|=3$.`),
        inter(t`Arraste os vetores para formar um paralelogramo de área $8$.`, 'plot', vectorLab('area', { snap: 1 }).props, (v: any) => v && near(Math.abs(v.pts.u.x * v.pts.v.y - v.pts.u.y * v.pts.v.x), 8, 0.01), t`ex.: $(4,\,0)$ e $(1,\,2)$`),
        num(t`$|\vec u|=4$, $|\vec v|=5$, $\theta=30^\circ$. Quanto vale $|\vec u\times\vec v|$?`, 10, t`$4\cdot5\cdot\operatorname{sen}30^\circ=10$.`),
      ],
    },
    {
      id: 'g-vet-misto',
      title: 'Produto misto e volume',
      cards: [
        {
          title: 'Três vetores, um número',
          body: t`$$[\vec u,\vec v,\vec w]=\vec u\cdot(\vec v\times\vec w)=\begin{vmatrix}x_1&y_1&z_1\\x_2&y_2&z_2\\x_3&y_3&z_3\end{vmatrix}$$

• $|[\vec u,\vec v,\vec w]|$ = **volume do paralelepípedo**
• Volume do tetraedro = $\frac16|[\vec u,\vec v,\vec w]|$
• $[\vec u,\vec v,\vec w]=0$ ⟺ **coplanares**`,
          example: t`$[\vec i,\vec j,\vec k]=1$: o cubo unitário tem volume 1.`,
        },
      ],
      exercises: [
        gen((rng) => {
          const a = [randInt(rng, 1, 3), 0, 0];
          const b = [randInt(rng, -1, 1), randInt(rng, 1, 3), 0];
          const c = [randInt(rng, -1, 1), randInt(rng, -1, 1), randInt(rng, 1, 3)];
          const m = dot(a, cross(b, c));
          return num(t`Calcule o volume do paralelepípedo determinado por $${V3(a)}$, $${V3(b)}$ e $${V3(c)}$.`, Math.abs(m), t`Determinante (triangular): $${a[0]}\cdot${b[1]}\cdot${c[2]}=${m}$.`);
        }),
        mcq(t`Se $[\vec u,\vec v,\vec w]=0$, então os três vetores são…`, ['coplanares', 'ortogonais dois a dois', 'unitários', 'paralelos ao eixo z'], 0),
        num(t`Calcule o volume do tetraedro de vértices na origem, $(2,0,0)$, $(0,3,0)$ e $(0,0,6)$.`, 6, t`$\frac16\cdot|2\cdot3\cdot6|=6$.`),
        tf(t`O produto misto pode ser negativo.`, true, t`O sinal indica a orientação (mão direita ou esquerda); o volume é o módulo.`),
      ],
    },
  ],
};

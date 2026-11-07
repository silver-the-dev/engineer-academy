import React from 'react';
import type { UnitDef } from '../../types';
import { gen, mcq, mcqS, num, tf, order, inter, plot, rmcq, near, multi } from '../../helpers';
import { ArcW, Arrow, InfLine, Pt } from '../../../components/plot/Plot';
import { Arrow3, Axes3, Line3, Point3, type V3 as V3T } from '../../../components/visuals/Space3D';
import { C } from '../../../theme';
import { fmt, pick, randInt, randNZ, term } from '../../../lib/random';
import { matrixLab, plane3DLab } from '../../visuals';

const t = String.raw;
const V3 = (a: number[]) => t`(${a[0]},\,${a[1]},\,${a[2]})`;

const paramLine = () =>
  plot({
    view: { xMin: -4, xMax: 6, yMin: -3, yMax: 5 },
    equalAspect: true,
    snap: 0.5,
    points: [
      { id: 'A', x: 1, y: 1, color: C.p2, label: 'A' },
      { id: 'V', x: 3, y: 2, color: C.p3, label: 'A+v' },
    ],
    params: [{ key: 't', label: 't', min: -2, max: 3, step: 0.1, value: 1.5, color: C.gold }],
    render: ({ pts, p }: any) => {
      const vx = pts.V.x - pts.A.x;
      const vy = pts.V.y - pts.A.y;
      return (
        <>
          <InfLine x1={pts.A.x} y1={pts.A.y} x2={pts.V.x} y2={pts.V.y} color={C.p1} width={2} />
          <Arrow x1={pts.A.x} y1={pts.A.y} x2={pts.V.x} y2={pts.V.y} color={C.p3} />
          <Pt x={pts.A.x + p.t * vx} y={pts.A.y + p.t * vy} color={C.gold} label="P" />
        </>
      );
    },
    info: ({ pts, p }: any) => {
      const vx = pts.V.x - pts.A.x;
      const vy = pts.V.y - pts.A.y;
      return t`$P=A+t\vec v=(${fmt(pts.A.x)},\,${fmt(pts.A.y)})+${fmt(p.t, 1)}\,(${fmt(vx)},\,${fmt(vy)})=(${fmt(pts.A.x + p.t * vx, 2)},\,${fmt(pts.A.y + p.t * vy, 2)})$`;
    },
  });

const line3D = () => ({
  name: 'space3d',
  props: {
    params: [{ key: 't', label: 't', min: -1.5, max: 1.5, step: 0.05, value: 0.5, color: C.gold }],
    render: ({ p }: any) => {
      const A: V3T = [1, -1, 0.5];
      const v: V3T = [1, 2, 1.5];
      const P: V3T = [A[0] + p.t * v[0], A[1] + p.t * v[1], A[2] + p.t * v[2]];
      return (
        <>
          <Axes3 size={3.2} />
          <Line3 a={[A[0] - 1.5 * v[0], A[1] - 1.5 * v[1], A[2] - 1.5 * v[2]]} b={[A[0] + 1.5 * v[0], A[1] + 1.5 * v[1], A[2] + 1.5 * v[2]]} color={C.p1} width={2.5} />
          <Arrow3 from={A} to={[A[0] + v[0], A[1] + v[1], A[2] + v[2]]} color={C.p3} label="v" />
          <Point3 at={A} color={C.p2} label="A" />
          <Point3 at={P} color={C.gold} r={6} label="P" />
        </>
      );
    },
    info: ({ p }: any) => t`$r:\ (x,y,z)=(1,\,-1,\,0{,}5)+t\,(1,\,2,\,1{,}5)$ · $t=${fmt(p.t, 2)}$`,
  },
});

/** Acute angle (degrees) between the lines spanned by u and v. */
const lineAngle = (u: { x: number; y: number }, v: { x: number; y: number }) => {
  const nu = Math.hypot(u.x, u.y);
  const nv = Math.hypot(v.x, v.y);
  if (nu < 1e-9 || nv < 1e-9) return NaN;
  return (Math.acos(Math.min(1, Math.abs(u.x * v.x + u.y * v.y) / (nu * nv))) * 180) / Math.PI;
};

const lineAngleLab = (u0: [number, number] = [3, 1], v0: [number, number] = [-1, 2]) =>
  plot({
    view: { xMin: -4, xMax: 4, yMin: -3, yMax: 3.5 },
    equalAspect: true,
    snap: 0.5,
    points: [
      { id: 'U', x: u0[0], y: u0[1], color: C.p2, label: 'u' },
      { id: 'V', x: v0[0], y: v0[1], color: C.p3, label: 'v' },
    ],
    render: ({ pts }: any) => {
      const { U, V } = pts;
      if (Math.hypot(U.x, U.y) < 1e-9 || Math.hypot(V.x, V.y) < 1e-9) return null;
      const au = Math.atan2(U.y, U.x);
      let av = Math.atan2(V.y, V.x);
      if (U.x * V.x + U.y * V.y < 0) av += Math.PI; // use -v: same line, acute angle
      let d = av - au;
      while (d > Math.PI) d -= 2 * Math.PI;
      while (d <= -Math.PI) d += 2 * Math.PI;
      return (
        <>
          <InfLine x1={0} y1={0} x2={U.x} y2={U.y} color={C.p2} width={1.5} dash="6 5" />
          <InfLine x1={0} y1={0} x2={V.x} y2={V.y} color={C.p3} width={1.5} dash="6 5" />
          <ArcW cx={0} cy={0} r={0.8} a0={au} a1={au + d} color={C.gold} fillOpacity={0.25} />
          <Arrow x1={0} y1={0} x2={U.x} y2={U.y} color={C.p2} />
          <Arrow x1={0} y1={0} x2={V.x} y2={V.y} color={C.p3} />
        </>
      );
    },
    info: ({ pts }: any) => {
      const { U, V } = pts;
      const vv = (Math.acos(Math.max(-1, Math.min(1, (U.x * V.x + U.y * V.y) / (Math.hypot(U.x, U.y) * Math.hypot(V.x, V.y) || 1)))) * 180) / Math.PI;
      const ll = lineAngle(U, V);
      if (!isFinite(ll)) return 'Afaste os pontos da origem';
      return t`$\vec u\cdot\vec v=${fmt(U.x * V.x + U.y * V.y, 2)}$ · entre vetores: $${fmt(vv, 1)}^\circ$ · entre **retas**: $${fmt(ll, 1)}^\circ$`;
    },
  });

const r3 = (rng: () => number, lo: number, hi: number) => [randInt(rng, lo, hi), randInt(rng, lo, hi), randInt(rng, lo, hi)];
const nz3 = (rng: () => number, lo: number, hi: number) => [randNZ(rng, lo, hi), randNZ(rng, lo, hi), randNZ(rng, lo, hi)];
const dot3 = (a: number[], b: number[]) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross3 = (a: number[], b: number[]) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];

export const reta: UnitDef = {
  id: 'g-reta',
  title: 'A reta',
  subtitle: 'Equação vetorial, paramétrica, ângulo e ortogonalidade',
  icon: '📍',
  source: 'GA e Álgebra Linear · Unidade 5 — A reta',
  guide: t`Reta = ponto $A$ + direção $\vec v$: $P=A+t\vec v$. As paramétricas separam as coordenadas. Ângulo entre retas = ângulo entre os diretores.`,
  lessons: [
    {
      id: 'g-reta-vet',
      title: 'Equação vetorial e paramétricas',
      parts: [
        {
          card: {
            title: 'P = A + t v',
            body: t`Uma reta fica determinada por um **ponto** $A$ e uma **direção** $\vec v$ (o vetor diretor):

$$P=A+t\,\vec v,\quad t\in\mathbb R$$

Cada valor de $t$ dá um ponto da reta. Arraste $A$, a ponta do diretor e mude $t$:`,
            visual: paramLine(),
          },
          exercises: [
            mcq(t`Na equação $P=A+t\vec v$, o vetor $\vec v$ é chamado de…`, ['vetor diretor', 'vetor normal', 'ponto inicial', 'parâmetro'], 0, t`Ele dá a direção da reta.`),
            gen((rng) => {
              const A = [randInt(rng, -3, 3), randInt(rng, -3, 3)];
              const v = [randNZ(rng, -3, 3), randNZ(rng, -3, 3)];
              const tt = randInt(rng, -2, 3);
              return rmcq(rng, t`Na reta $P=(${A[0]},\,${A[1]})+t\,(${v[0]},\,${v[1]})$, qual ponto corresponde a $t=${tt}$?`, `$(${A[0] + tt * v[0]},\\,${A[1] + tt * v[1]})$`, [`$(${A[0] - tt * v[0]},\\,${A[1] - tt * v[1]})$`, `$(${v[0] + tt * A[0]},\\,${v[1] + tt * A[1]})$`, `$(${A[0] + tt * v[0]},\\,${A[1] + tt * v[1] + 1})$`], t`$(${A[0]},\,${A[1]})+${tt}\cdot(${v[0]},\,${v[1]})$.`);
            }),
            tf(t`O ponto $A$ corresponde a $t=0$ na equação $P=A+t\vec v$.`, true, t`$A+0\cdot\vec v=A$.`),
            inter(t`Monte a reta que passa por $A(0,\,1)$ com diretor $\vec v=(2,\,-1)$.`, 'plot', paramLine().props, (v: any) => v && v.pts.A.x === 0 && v.pts.A.y === 1 && near(v.pts.V.x - v.pts.A.x, 2, 0.01) && near(v.pts.V.y - v.pts.A.y, -1, 0.01), t`$A=(0,\,1)$ e ponta em $(2,\,0)$`),
            tf(t`Os vetores $(1,\,2)$ e $(-2,\,-4)$ servem como diretores da mesma reta.`, true, t`São paralelos: qualquer múltiplo não nulo do diretor também é diretor.`),
            gen((rng) => {
              const A = [randInt(rng, -3, 3), randInt(rng, -3, 3)];
              const v = [randNZ(rng, -3, 3), randNZ(rng, -3, 3)];
              const tt = randInt(rng, -3, 4);
              return num(t`O ponto $(${A[0] + tt * v[0]},\,${A[1] + tt * v[1]})$ está na reta $P=(${A[0]},\,${A[1]})+t\,(${v[0]},\,${v[1]})$. Para qual valor de $t$?`, tt, t`$${A[0]}+${v[0]}t=${A[0] + tt * v[0]}\Rightarrow t=${tt}$.`);
            }),
            num(t`A reta $P=(1,\,2)+t\,(2,\,1)$ corta o eixo $x$ (onde $y=0$) em qual valor de $x$?`, -3, t`$2+t=0\Rightarrow t=-2$; $x=1+2(-2)=-3$.`),
          ],
        },
        {
          card: {
            title: 'No espaço: equações paramétricas',
            body: t`Separando as coordenadas de $P=(x_0,y_0,z_0)+t\,(a,b,c)$:

$$r:\ \begin{cases}x=x_0+a\,t\\y=y_0+b\,t\\z=z_0+c\,t\end{cases}$$

Gire a cena e percorra a reta com $t$:`,
            visual: line3D(),
            tip: t`Para saber se um ponto $Q$ está na reta, ache $t$ pela 1ª equação e confira nas outras.`,
          },
          exercises: [
            mcqS(t`Qual é um vetor diretor da reta $\begin{cases}x=2+3t\\y=-1+t\\z=5-2t\end{cases}$?`, t`$(3,\,1,\,-2)$`, [t`$(2,\,-1,\,5)$`, t`$(3,\,-1,\,2)$`, t`$(5,\,0,\,3)$`], t`São os coeficientes do $t$.`),
            mcqS(t`Qual ponto pertence à reta $\begin{cases}x=2+3t\\y=-1+t\\z=5-2t\end{cases}$ com certeza?`, t`$(2,\,-1,\,5)$`, [t`$(3,\,1,\,-2)$`, t`$(0,\,0,\,0)$`, t`$(5,\,0,\,7)$`], t`Com $t=0$.`),
            gen((rng) => {
              const A = r3(rng, -3, 3);
              const v = nz3(rng, -3, 3);
              const tt = randInt(rng, -2, 3);
              const P = A.map((a, i) => a + tt * v[i]);
              return rmcq(rng, t`A reta $r: P=${V3(A)}+t\,${V3(v)}$ passa por qual ponto quando $t=${tt}$?`, `$${V3(P)}$`, [`$${V3(A.map((a, i) => a - tt * v[i]))}$`, `$${V3(v.map((x, i) => x + tt * A[i]))}$`, `$${V3(P.map((x, i) => (i === 1 ? x + 1 : x)))}$`], t`$${V3(A)}+${tt}\cdot${V3(v)}=${V3(P)}$.`);
            }),
            num(t`O ponto $Q(7,\,a,\,1)$ pertence à reta $x=1+2t$, $y=3-t$, $z=-5+2t$. Quanto vale $a$?`, 0, t`$7=1+2t\Rightarrow t=3$; $z=-5+6=1$ ✓; $a=3-3=0$.`),
            gen((rng) => {
              const A = r3(rng, -3, 3);
              const v = nz3(rng, -3, 3);
              const tt = randInt(rng, -2, 2);
              const P = A.map((a, i) => a + tt * v[i]);
              const on = rng() < 0.5;
              const Q = on ? P : [P[0], P[1], P[2] + 1];
              return tf(t`O ponto $${V3(Q)}$ pertence à reta $P=${V3(A)}+t\,${V3(v)}$.`, on, on ? t`Com $t=${tt}$ as três coordenadas batem.` : t`A 1ª coordenada dá $t=${tt}$, mas aí $z=${P[2]}\neq${Q[2]}$.`);
            }),
            mcq(t`A reta $x=1+t$, $y=2$, $z=3$ é paralela a qual eixo?`, ['eixo $x$', 'eixo $y$', 'eixo $z$', 'nenhum'], 0, t`Só o $x$ varia: diretor $(1,\,0,\,0)=\vec i$.`),
            num(t`Em que valor de $z$ a reta $x=t$, $y=2t$, $z=4-t$ fura o plano $x=3$?`, 1, t`$x=3\Rightarrow t=3$, então $z=4-3=1$.`),
          ],
        },
      ],
    },
    {
      id: 'g-reta-2p',
      title: 'Reta por dois pontos e posições',
      parts: [
        {
          card: {
            title: 'Dois pontos bastam',
            body: t`Por $A$ e $B$: diretor $\vec v=\vec{AB}=B-A$ e $P=A+t\,(B-A)$.

**Retas paralelas aos eixos** têm diretor $\vec i$, $\vec j$ ou $\vec k$: duas coordenadas ficam constantes.`,
            example: t`$A(1,\,2,\,3)$, $B(4,\,0,\,5)$: $\vec v=(3,\,-2,\,2)$, $r:\ (1,\,2,\,3)+t\,(3,\,-2,\,2)$.`,
          },
          exercises: [
            gen((rng) => {
              const A = r3(rng, -3, 3);
              const B = r3(rng, -3, 3);
              return rmcq(rng, t`Qual o diretor da reta por $A=${V3(A)}$ e $B=${V3(B)}$?`, `$${V3(B.map((b, i) => b - A[i]))}$`, [`$${V3(A.map((a, i) => a + B[i]))}$`, `$${V3(A)}$`, `$${V3(B.map((b, i) => (b - A[i]) * (i === 2 ? -1 : 1)))}$`], t`$B-A$.`);
            }),
            mcq(t`A reta $x=2$, $y=3$, $z=t$ é paralela a qual eixo?`, ['eixo z', 'eixo x', 'eixo y', 'nenhum'], 0, t`Só o $z$ varia.`),
            tf(t`Por dois pontos distintos passa exatamente uma reta.`, true, t`O diretor $B-A$ e o ponto $A$ a determinam.`),
            gen((rng) => {
              const A = r3(rng, -3, 3);
              const v = nz3(rng, -2, 2);
              const B = A.map((a, i) => a + v[i]);
              return rmcq(rng, t`Qual equação representa a reta por $A=${V3(A)}$ e $B=${V3(B)}$?`, `$P=${V3(A)}+t\\,${V3(v)}$`, [`$P=${V3(v)}+t\\,${V3(A)}$`, `$P=${V3(A)}+t\\,${V3(B)}$`, `$P=${V3(A)}+t\\,${V3(v.map((x) => x + 1))}$`], t`Ponto $A$ e diretor $B-A=${V3(v)}$.`);
            }),
            mcq(t`Os pontos $(1,\,2,\,0)$ e $(1,\,5,\,0)$ determinam uma reta paralela a qual eixo?`, ['eixo $y$', 'eixo $x$', 'eixo $z$', 'nenhum'], 0, t`Diretor $(0,\,3,\,0)$, múltiplo de $\vec j$.`),
            gen((rng) => {
              const A = r3(rng, -3, 3);
              const v = nz3(rng, -2, 2);
              const k = randInt(rng, 2, 3);
              const C = A.map((a, i) => a + k * v[i]);
              return num(t`Os pontos $A=${V3(A)}$, $B=${V3(A.map((a, i) => a + v[i]))}$ e $C=(${C[0]},\,${C[1]},\,m)$ estão alinhados. Quanto vale $m$?`, C[2], t`$\vec{AC}$ precisa ser múltiplo de $\vec{AB}=${V3(v)}$: pela 1ª coordenada o fator é $${k}$, então $m=${A[2]}+${k}\cdot(${v[2]})=${C[2]}$.`);
            }),
            num(t`O ponto médio do segmento $AB$, com $A(1,\,0,\,2)$ e $B(3,\,4,\,6)$, corresponde a qual valor de $t$ em $P=A+t(B-A)$?`, 0.5, t`$t=0$ dá $A$, $t=1$ dá $B$; o meio é $t=\frac12$.`),
          ],
        },
        {
          card: {
            title: 'Posições relativas',
            body: t`Duas retas no espaço podem ser:

• **coincidentes** ou **paralelas** — diretores proporcionais
• **concorrentes** — se cruzam em um ponto
• **reversas** — não se cruzam e não são paralelas (estão em planos diferentes)`,
            tip: t`No plano não existem retas reversas: ou se cruzam ou são paralelas.`,
          },
          exercises: [
            tf(t`No espaço, duas retas que não se cruzam são necessariamente paralelas.`, false, t`Podem ser **reversas**: em planos diferentes, sem direção comum.`),
            mcqS(t`As retas com diretores $(1,\,2,\,-1)$ e $(-2,\,-4,\,2)$ são:`, 'paralelas ou coincidentes', ['perpendiculares', 'reversas com certeza', 'concorrentes com certeza'], t`Diretores proporcionais ($k=-2$).`),
            mcq(t`No **plano**, duas retas distintas e não paralelas são sempre…`, ['concorrentes', 'reversas', 'coincidentes', 'ortogonais'], 0, t`No plano, direções diferentes sempre se encontram.`),
            gen((rng) => {
              const v = nz3(rng, -3, 3);
              const k = pick(rng, [2, -2, 3]);
              const par = rng() < 0.5;
              const w = par ? v.map((x) => k * x) : [k * v[0], k * v[1], k * v[2] + 1];
              return tf(t`Retas com diretores $${V3(v)}$ e $${V3(w)}$ são paralelas (ou coincidentes).`, par, par ? t`O segundo é $${k}$ vezes o primeiro.` : t`As razões das coordenadas não são todas iguais.`);
            }),
            mcq(t`As retas $r: (0,0,0)+t(1,0,0)$ e $s: (0,0,1)+t(0,1,0)$ são…`, ['reversas', 'concorrentes', 'paralelas', 'coincidentes'], 0, t`Diretores não proporcionais, e $r$ fica em $z=0$ enquanto $s$ fica em $z=1$: nunca se cruzam.`),
            mcq(t`As retas $r: (0,0,0)+t(1,0,0)$ e $s: (0,0,0)+t(0,1,0)$ são…`, ['concorrentes (na origem)', 'reversas', 'paralelas', 'coincidentes'], 0, t`As duas passam pela origem com direções diferentes.`),
            num(t`As retas $r: (t,\,t,\,0)$ e $s: (2,\,2+u,\,u)$ se cruzam. Em que valor de $x$?`, 2, t`Igualando: $t=2$, $t=2+u$, $0=u$. Logo $u=0$, $t=2$: ponto $(2,\,2,\,0)$.`),
          ],
        },
      ],
    },
    {
      id: 'g-reta-ang',
      title: 'Ângulo entre retas e ortogonalidade',
      parts: [
        {
          card: {
            title: 'Ângulo entre diretores',
            body: t`O ângulo entre duas retas é o ângulo entre seus diretores — mas sempre o **menor** deles, entre $0^\circ$ e $90^\circ$. Por isso entra um módulo no produto escalar:

$$\cos\theta=\frac{|\vec v_1\cdot\vec v_2|}{|\vec v_1|\,|\vec v_2|}$$

Arraste as pontas dos diretores: quando o ângulo entre os **vetores** passa de $90^\circ$, o ângulo entre as **retas** continua sendo o agudo.`,
            visual: lineAngleLab(),
          },
          exercises: [
            tf(t`O ângulo entre duas retas está sempre entre $0^\circ$ e $90^\circ$.`, true, t`Duas retas formam dois ângulos suplementares; convenciona-se o menor.`),
            num(t`Calcule o ângulo (graus) entre as retas de diretores $(1,\,0,\,0)$ e $(1,\,1,\,0)$.`, 45, t`$\cos\theta=\frac{1}{1\cdot\sqrt2}$ ⟹ $45^\circ$.`, { unit: '°' }),
            num(t`Calcule o ângulo (graus) entre as retas de diretores $(1,\,1,\,0)$ e $(-1,\,0,\,0)$.`, 45, t`$\cos\theta=\frac{|-1|}{\sqrt2\cdot1}$ ⟹ $45^\circ$ (o ângulo entre **retas** é o menor).`, { unit: '°' }),
            mcqS(t`Por que a fórmula do ângulo entre retas usa $|\vec v_1\cdot\vec v_2|$?`, 'para obter sempre o ângulo agudo', ['para o cosseno nunca passar de 1', 'porque o produto escalar é sempre negativo', 'para o ângulo dar em radianos', 'porque as retas são reversas'], t`Trocar $\vec v_2$ por $-\vec v_2$ descreve a mesma reta e muda o sinal do produto escalar; o módulo elimina essa ambiguidade.`),
            inter(t`Arraste os diretores para que as **retas** formem $45^\circ$.`, 'plot', lineAngleLab().props, (v: any) => v && near(lineAngle(v.pts.U, v.pts.V), 45, 1.5), t`Por exemplo $\vec u=(2,\,0)$ e $\vec v=(2,\,2)$.`),
            num(t`Qual o ângulo (graus) entre $r:\ (1,\,2,\,3)+t\,(1,\,1,\,0)$ e $s:\ (0,\,0,\,1)+t\,(0,\,1,\,1)$?`, 60, t`$\vec v_1\cdot\vec v_2=1$, $|\vec v_1|=|\vec v_2|=\sqrt2$: $\cos\theta=\frac12$ ⟹ $60^\circ$.`, { unit: '°' }),
            gen((rng) => {
              const [u, v] = pick(rng, [
                [[1, 0, 0], [1, 0, 1], 45],
                [[0, 1, 0], [0, -1, -1], 45],
                [[1, 1, 0], [0, 1, 1], 60],
                [[1, 0, 1], [-1, -1, 0], 60],
                [[1, 2, 2], [2, 1, -2], 90],
                [[0, 0, 2], [1, 1, 0], 90],
                [[1, 1, 1], [-1, -1, -1], 0],
              ] as const);
              const d = dot3([...u], [...v]);
              const ang = (Math.acos(Math.min(1, Math.abs(d) / Math.hypot(...u) / Math.hypot(...v))) * 180) / Math.PI;
              return num(t`Calcule o ângulo (graus) entre as retas de diretores $${V3([...u])}$ e $${V3([...v])}$.`, Math.round(ang), t`$|\vec v_1\cdot\vec v_2|=${Math.abs(d)}$, então $\cos\theta=${fmt(Math.cos((ang * Math.PI) / 180), 3)}$ ⟹ $\theta=${Math.round(ang)}^\circ$.`, { unit: '°', tol: 0.5 });
            }),
            gen((rng) => {
              const u = nz3(rng, -3, 3);
              const v = nz3(rng, -3, 3);
              const c = Math.abs(dot3(u, v)) / Math.hypot(u[0], u[1], u[2]) / Math.hypot(v[0], v[1], v[2]);
              return num(t`Calcule $\cos\theta$ entre as retas de diretores $${V3(u)}$ e $${V3(v)}$ (2 casas).`, Math.round(c * 100) / 100, t`$\cos\theta=\frac{|${dot3(u, v)}|}{\sqrt{${dot3(u, u)}}\cdot\sqrt{${dot3(v, v)}}}\approx${fmt(c, 2)}$.`, { tol: 0.011 });
            }),
          ],
        },
        {
          card: {
            title: 'Ortogonalidade e distância',
            body: t`**Retas ortogonais** ⟺ $\vec v_1\cdot\vec v_2=0$. Se, além disso, elas se cruzam, são **perpendiculares**.

**Distância de um ponto $P$ a uma reta** (ponto $A$, diretor $\vec v$): é o comprimento do segmento perpendicular. Com o produto vetorial:

$$d(P,r)=\frac{|\vec{AP}\times\vec v|}{|\vec v|}$$`,
            example: t`$P(3,\,4,\,0)$ e $r$ = eixo $x$ ($A=O$, $\vec v=\vec i$): $\vec{AP}\times\vec i=(0,\,0,\,-4)$, então $d=4$. O pé da perpendicular é $(3,\,0,\,0)$.`,
            tip: t`Retas **reversas** também podem ser ortogonais: ortogonalidade fala só das direções.`,
          },
          exercises: [
            tf(t`Retas ortogonais no espaço precisam se cruzar.`, false, t`Ortogonalidade é sobre as **direções**; retas reversas também podem ser ortogonais.`),
            mcqS(t`Qual destes vetores é diretor de uma reta ortogonal à de diretor $(1,\,2,\,3)$?`, t`$(3,\,0,\,-1)$`, [t`$(2,\,1,\,0)$`, t`$(3,\,0,\,1)$`, t`$(-1,\,2,\,0)$`, t`$(1,\,2,\,3)$`], t`$(1,\,2,\,3)\cdot(3,\,0,\,-1)=3+0-3=0$.`),
            gen((rng) => {
              const a = randNZ(rng, -3, 3);
              const b = randNZ(rng, -3, 3);
              return num(t`Para que as retas de diretores $(${a},\,${b},\,1)$ e $(1,\,1,\,m)$ sejam ortogonais, $m=$?`, -(a + b), t`$${a}+${b}+m=0\Rightarrow m=${-(a + b)}$.`);
            }),
            gen((rng) => {
              const u = nz3(rng, -3, 3);
              const orth = rng() < 0.5;
              const w = orth ? cross3(u, [1, 0, 0]).every((x) => x === 0) ? cross3(u, [0, 1, 0]) : cross3(u, [1, 0, 0]) : [u[0] + 1, u[1], u[2]];
              const ok = dot3(u, w) === 0;
              return tf(t`As retas de diretores $${V3(u)}$ e $${V3(w)}$ são ortogonais.`, ok, t`$${V3(u)}\cdot${V3(w)}=${dot3(u, w)}$${ok ? ' ⟹ ortogonais.' : ' ≠ 0 ⟹ não são ortogonais.'}`);
            }),
            inter(t`Com $\vec u=(2,\,1)$, arraste $\vec v$ para que as retas fiquem **ortogonais**.`, 'plot', lineAngleLab([2, 1], [1, 2]).props, (v: any) => v && near(v.pts.U.x, 2, 0.01) && near(v.pts.U.y, 1, 0.01) && Math.hypot(v.pts.V.x, v.pts.V.y) > 0.1 && near(v.pts.U.x * v.pts.V.x + v.pts.U.y * v.pts.V.y, 0, 0.01), t`$\vec v=(-1,\,2)$ ou $(1,\,-2)$, por exemplo: $2\cdot(-1)+1\cdot2=0$.`),
            multi(t`Quais pares de diretores dão retas **ortogonais**?`, [t`$(1,\,0,\,0)$ e $(0,\,5,\,-2)$`, t`$(1,\,1,\,1)$ e $(1,\,-2,\,1)$`, t`$(2,\,1,\,0)$ e $(1,\,2,\,0)$`, t`$(1,\,2,\,3)$ e $(-2,\,-4,\,-6)$`], [0, 1], t`Produto escalar zero: $0$ e $1-2+1=0$. Os outros dão $4$ e $-28$.`),
            num(t`Qual a distância do ponto $P(3,\,4,\,0)$ ao eixo $x$?`, 4, t`O pé da perpendicular é $(3,\,0,\,0)$; a distância é $|(0,\,4,\,0)|=4$.`),
            gen((rng) => {
              const [a, b, h] = pick(rng, [[3, 4, 5], [6, 8, 10], [5, 12, 13], [8, 6, 10], [12, 5, 13]] as const);
              const z = randInt(rng, -4, 4);
              return num(t`Qual a distância do ponto $P(${a},\,${b},\,${z})$ ao eixo $z$?`, h, t`A reta é $(0,\,0,\,0)+t\,(0,\,0,\,1)$: só $x$ e $y$ contam. $d=\sqrt{${a}^2+${b}^2}=${h}$.`);
            }),
            num(t`Qual a distância de $P(1,\,1,\,1)$ à reta $r:\ (0,\,0,\,0)+t\,(1,\,1,\,0)$? (2 casas)`, 1, t`$\vec{AP}\times\vec v=(1,\,1,\,1)\times(1,\,1,\,0)=(-1,\,1,\,0)$, módulo $\sqrt2$; dividido por $|\vec v|=\sqrt2$: $d=1$.`, { tol: 0.01 }),
          ],
        },
      ],
    },
  ],
};

const planeEq = (n: number[], d: number) => `${term(n[0], 'x', true)}${term(n[1], 'y', n[0] === 0)}${term(n[2], 'z', n[0] === 0 && n[1] === 0)}${term(d, '')}=0`;

export const plano: UnitDef = {
  id: 'g-plano',
  title: 'O plano',
  subtitle: 'Equação geral, paramétrica, ângulos e interseções',
  icon: '🟦',
  source: 'GA e Álgebra Linear · Unidade 6 — O plano',
  guide: t`Plano = ponto + vetor normal: $ax+by+cz+d=0$ com $\vec n=(a,b,c)$. Quase tudo (ângulos, paralelismo, perpendicularismo) vira produto escalar entre normais e diretores.`,
  lessons: [
    {
      id: 'g-plano-geral',
      title: 'Equação geral do plano',
      parts: [
        {
          card: {
            title: 'O vetor normal manda',
            body: t`Se $\vec n=(a,b,c)$ é normal ao plano e $A$ é um ponto dele, para todo $P$ do plano: $\vec n\cdot(P-A)=0$, ou seja
$$ax+by+cz+d=0$$
Gire e mexa nos coeficientes (normal dourada):`,
            visual: plane3DLab(),
            example: t`Normal $(2,\,-1,\,3)$ e ponto $A(1,\,0,\,2)$: $2x-y+3z+d=0$ com $2+6+d=0\Rightarrow d=-8$.`,
          },
          exercises: [
            mcqS(t`Qual é um vetor normal ao plano $3x-2y+z-7=0$?`, t`$(3,\,-2,\,1)$`, [t`$(3,\,2,\,1)$`, t`$(-7,\,1,\,0)$`, t`$(1,\,-2,\,3)$`], t`Os coeficientes de $x$, $y$ e $z$.`),
            tf(t`O ponto $(1,\,2,\,3)$ pertence ao plano $x+y-z=0$.`, true, t`$1+2-3=0$ ✓`),
            gen((rng) => {
              const n = nz3(rng, -3, 3);
              const A = r3(rng, -2, 2);
              const d = -dot3(n, A);
              return num(t`O plano tem normal $${V3(n)}$ e passa por $A=${V3(A)}$. Na equação $${planeEq(n, 0).replace('=0', '')}+d=0$, quanto vale $d$?`, d, t`Substitua $A$: $d=-(${n[0] * A[0]}+(${n[1] * A[1]})+(${n[2] * A[2]}))=${d}$.`);
            }),
            gen((rng) => {
              const n = nz3(rng, -3, 3);
              const d = randInt(rng, -6, 6);
              const P = r3(rng, -3, 3);
              const val = dot3(n, P) + d;
              return tf(t`O ponto $${V3(P)}$ pertence ao plano $${planeEq(n, d)}$.`, val === 0, t`Substituindo: $${val}${val === 0 ? '=0' : '\\neq0'}$.`);
            }),
            inter(t`Ajuste o plano para que fique **horizontal** ($\vec n$ vertical) na altura $z=2$.`, 'space3d', plane3DLab().props!, (v: any) => v && near(v.p.a, 0, 0.01) && near(v.p.b, 0, 0.01) && near(v.p.d, 2, 0.01), t`$a=b=0$, $d=2$`),
            tf(t`Multiplicar toda a equação de um plano por $2$ muda o plano.`, false, t`$2x+2y=2$ e $x+y=1$ são o mesmo plano: a normal só muda de tamanho.`),
            num(t`O plano $2x+y-z+d=0$ passa pela origem. Quanto vale $d$?`, 0, t`$(0,0,0)$ na equação: $d=0$.`),
          ],
        },
        {
          card: {
            title: 'Casos particulares',
            body: t`• Falta uma variável ⟹ o plano é **paralelo** ao eixo dela. Ex.: $x+y=2$ é paralelo ao eixo $z$.
• $z=k$ ⟹ plano **horizontal** (paralelo ao plano $xy$).
• $d=0$ ⟹ o plano passa pela **origem**.
• **Interceptos**: zere duas variáveis. Em $2x+3y+6z=6$: $x=3$, $y=2$, $z=1$.`,
          },
          exercises: [
            mcq(t`O plano $z=4$ é…`, ['paralelo ao plano xy', 'paralelo ao eixo z', 'perpendicular ao plano xy', 'passa pela origem'], 0, t`Todos os pontos têm a mesma altura.`),
            mcq(t`O plano $x+y=2$ é paralelo a qual eixo?`, ['eixo $z$', 'eixo $x$', 'eixo $y$', 'nenhum'], 0, t`Falta o $z$: ele pode valer qualquer coisa.`),
            tf(t`O plano $3x-y+5z=0$ passa pela origem.`, true, t`$d=0$.`),
            gen((rng) => {
              const [a, b, c, k] = pick(rng, [[2, 3, 6, 6], [3, 4, 6, 12], [1, 2, 4, 4], [6, 3, 2, 6]] as const);
              const which = pick(rng, ['x', 'y', 'z'] as const);
              const v = { x: k / a, y: k / b, z: k / c }[which];
              return num(t`Em que valor de $${which}$ o plano $${a}x+${b}y+${c}z=${k}$ corta o eixo $${which}$?`, v, t`Zere as outras duas variáveis: $${which}=${fmt(v)}$.`);
            }),
            mcq(t`Qual é o vetor normal do plano $y=3$?`, [t`$(0,\,1,\,0)$`, t`$(0,\,3,\,0)$ apenas`, t`$(1,\,0,\,1)$`, t`$(3,\,0,\,0)$`], 0, t`$0x+1y+0z-3=0$. (Qualquer múltiplo de $(0,\,1,\,0)$ também serve.)`),
            mcq(t`A equação do plano $xz$ (que contém os eixos $x$ e $z$) é…`, ['$y=0$', '$x=0$', '$z=0$', '$x+z=0$'], 0, t`No plano $xz$, todos os pontos têm $y=0$.`),
            num(t`O plano $\frac{x}{2}+\frac{y}{3}+\frac{z}{4}=1$ corta o eixo $y$ em qual valor?`, 3, t`Forma segmentária: os denominadores são os interceptos.`),
          ],
        },
      ],
    },
    {
      id: 'g-plano-param',
      title: 'Equação vetorial e paramétricas',
      parts: [
        {
          card: {
            title: 'Ponto + dois diretores',
            body: t`Com um ponto $A$ e dois vetores não paralelos $\vec u$, $\vec v$ do plano:
$$P=A+h\,\vec u+t\,\vec v$$
A normal é $\vec n=\vec u\times\vec v$ — conecta com o produto vetorial!

Com $h,t\in[0,\,1]$, $P$ percorre o **paralelogramo** de lados $\vec u$ e $\vec v$.`,
          },
          exercises: [
            mcqS(t`A normal do plano gerado por $\vec u=(1,\,0,\,0)$ e $\vec v=(0,\,1,\,0)$ é paralela a:`, t`$\vec k$`, [t`$\vec i$`, t`$\vec j$`, t`$\vec i+\vec j$`], t`$\vec i\times\vec j=\vec k$.`),
            tf(t`Os diretores $\vec u$ e $\vec v$ de um plano não podem ser paralelos.`, true, t`Se fossem, gerariam só uma reta.`),
            gen((rng) => {
              const A = r3(rng, -2, 2);
              const u = nz3(rng, -2, 2);
              const v = nz3(rng, -2, 2);
              const h = randInt(rng, -1, 2);
              const tt = randInt(rng, -1, 2);
              const P = A.map((a, i) => a + h * u[i] + tt * v[i]);
              return rmcq(rng, t`No plano $P=${V3(A)}+h\,${V3(u)}+t\,${V3(v)}$, qual ponto corresponde a $h=${h}$ e $t=${tt}$?`, `$${V3(P)}$`, [`$${V3(A.map((a, i) => a + tt * u[i] + h * v[i]))}$`, `$${V3(A.map((a, i) => a - h * u[i] - tt * v[i]))}$`, `$${V3(P.map((x, i) => (i === 0 ? x + 1 : x)))}$`], t`$A+${h}\vec u+${tt}\vec v=${V3(P)}$.`);
            }),
            gen((rng) => {
              const u = nz3(rng, -2, 2);
              const v = nz3(rng, -2, 2);
              const n = cross3(u, v);
              if (n.every((x) => x === 0)) return mcq(t`A normal do plano gerado por $\vec u=(1,\,0,\,0)$ e $\vec v=(0,\,0,\,1)$ é paralela a:`, [t`$\vec j$`, t`$\vec i$`, t`$\vec k$`, t`$\vec i+\vec k$`], 0, t`$\vec i\times\vec k=-\vec j$.`);
              return rmcq(rng, t`Qual é um vetor normal ao plano gerado por $\vec u=${V3(u)}$ e $\vec v=${V3(v)}$?`, `$${V3(n)}$`, [`$${V3(u.map((x, i) => x + v[i]))}$`, `$${V3([n[0], -n[1], n[2]])}$`, `$${V3([u[0] * v[0], u[1] * v[1], u[2] * v[2]])}$`], t`$\vec n=\vec u\times\vec v=${V3(n)}$.`);
            }),
            mcq(t`Os pontos $P=A+h\vec u+t\vec v$ com $h,t\in[0,\,1]$ formam…`, ['um paralelogramo', 'uma reta', 'um triângulo', 'o plano inteiro'], 0, t`Limitando os dois parâmetros, sobra o paralelogramo de lados $\vec u$ e $\vec v$.`),
            tf(t`O vetor $\vec u\times\vec v$ é perpendicular a qualquer vetor do plano gerado por $\vec u$ e $\vec v$.`, true, t`Todo vetor do plano é combinação de $\vec u$ e $\vec v$, e ambos são perpendiculares a $\vec u\times\vec v$.`),
            num(t`O plano $P=(0,0,0)+h(1,0,0)+t(0,1,1)$ tem equação geral $y+kz=0$. Quanto vale $k$?`, -1, t`$\vec n=(1,0,0)\times(0,1,1)=(0,\,-1,\,1)$, ou seja $-y+z=0\iff y-z=0$.`),
          ],
        },
        {
          card: {
            title: 'Plano por três pontos',
            body: t`Três pontos **não colineares** $A$, $B$, $C$ determinam um plano:

1. $\vec u=B-A$ e $\vec v=C-A$
2. $\vec n=\vec u\times\vec v$
3. $ax+by+cz+d=0$ com $\vec n=(a,\,b,\,c)$; substitua $A$ para achar $d$`,
            example: t`$A(1,0,0)$, $B(0,1,0)$, $C(0,0,1)$: $\vec n=(1,1,1)$ ⟹ $x+y+z-1=0$.`,
          },
          exercises: [
            mcqS(t`Qual a equação do plano por $(1,0,0)$, $(0,1,0)$ e $(0,0,1)$?`, t`$x+y+z=1$`, [t`$x+y+z=0$`, t`$x-y+z=1$`, t`$xyz=1$`], t`Normal $(1,1,1)$ e $d=-1$.`),
            tf(t`Três pontos colineares determinam um único plano.`, false, t`Pontos colineares estão em infinitos planos; é preciso 3 pontos **não** colineares.`),
            order(t`Ordene os passos para obter a equação geral pelo método dos três pontos:`, [t`Calcular $\vec u=B-A$ e $\vec v=C-A$`, t`Calcular $\vec n=\vec u\times\vec v$`, t`Escrever $ax+by+cz+d=0$ com $\vec n=(a,b,c)$`, t`Substituir $A$ para achar $d$`]),
            gen((rng) => {
              const [a, b, c] = [randInt(rng, 1, 4), randInt(rng, 1, 4), randInt(rng, 1, 4)];
              const k = a * b * c;
              return rmcq(rng, t`Qual o plano que passa por $(${a},0,0)$, $(0,${b},0)$ e $(0,0,${c})$?`, `$${b * c}x+${a * c}y+${a * b}z=${k}$`, [`$${a}x+${b}y+${c}z=1$`, `$x+y+z=${a + b + c}$`, `$${a * b}x+${a * c}y+${b * c}z=${k}$`], t`Forma segmentária $\frac{x}{${a}}+\frac{y}{${b}}+\frac{z}{${c}}=1$; multiplicando por $${k}$.`);
            }),
            num(t`O plano por $A(0,0,0)$, $B(1,0,0)$ e $C(0,1,0)$ é $z=k$. Quanto vale $k$?`, 0, t`Os três pontos têm $z=0$: é o plano $xy$.`),
            gen((rng) => {
              const n = nz3(rng, -3, 3);
              const A = r3(rng, -2, 2);
              const d = -dot3(n, A);
              return num(t`Um plano passa por $A=${V3(A)}$ e tem normal $${V3(n)}$. Quanto vale $d$ na equação geral?`, d, t`$d=-\vec n\cdot A=${d}$.`);
            }),
            num(t`Encontre $d$ no plano $x+y+z+d=0$ que passa por $(2,\,3,\,-1)$.`, -4, t`$2+3-1+d=0\Rightarrow d=-4$.`),
          ],
        },
      ],
    },
    {
      id: 'g-plano-pos',
      title: 'Ângulos, paralelismo e interseções',
      parts: [
        {
          card: {
            title: 'Entre dois planos',
            body: t`Tudo pelas normais:
• Ângulo: $\cos\theta=\frac{|\vec n_1\cdot\vec n_2|}{|\vec n_1||\vec n_2|}$
• **Perpendiculares**: $\vec n_1\cdot\vec n_2=0$
• **Paralelos**: $\vec n_1\parallel\vec n_2$ (coincidentes se as equações forem proporcionais)
• **Interseção**: uma reta de diretor $\vec n_1\times\vec n_2$`,
          },
          exercises: [
            mcqS(t`Os planos $x+2y-z=3$ e $2x+4y-2z=1$ são:`, 'paralelos', ['perpendiculares', 'coincidentes', 'concorrentes'], t`Normais proporcionais, mas $d$ não segue a proporção.`),
            num(t`Para que os planos $x+y+mz=0$ e $2x-y+z=5$ sejam perpendiculares, $m=$?`, -1, t`$2-1+m=0\Rightarrow m=-1$.`),
            num(t`Calcule o ângulo (graus) entre os planos $z=0$ e $x+z=0$.`, 45, t`$\vec n_1=(0,0,1)$, $\vec n_2=(1,0,1)$: $\cos\theta=\frac{1}{\sqrt2}$.`, { unit: '°' }),
            gen((rng) => {
              const n = nz3(rng, -3, 3);
              const k = pick(rng, [2, -2, 3]);
              const same = rng() < 0.5;
              const d = randInt(rng, -5, 5);
              return mcq(t`Os planos $${planeEq(n, d)}$ e $${planeEq(n.map((x) => k * x), same ? k * d : k * d + 1)}$ são…`, ['coincidentes', 'paralelos distintos', 'perpendiculares', 'concorrentes'], same ? 0 : 1, same ? t`A segunda equação é a primeira vezes $${k}$.` : t`Normais proporcionais, mas o termo independente não segue a proporção.`);
            }),
            tf(t`Dois planos não paralelos se cortam segundo uma reta.`, true, t`Seu diretor é $\vec n_1\times\vec n_2$.`),
            mcqS(t`Qual o diretor da reta de interseção de $z=0$ e $y=0$?`, t`$(1,\,0,\,0)$`, [t`$(0,\,1,\,0)$`, t`$(0,\,0,\,1)$`, t`$(1,\,1,\,0)$`], t`É o eixo $x$: $(0,0,1)\times(0,1,0)=(-1,0,0)$, paralelo a $\vec i$.`),
            num(t`Calcule o ângulo (graus) entre os planos $x=0$ e $y=0$.`, 90, t`$(1,0,0)\cdot(0,1,0)=0$: perpendiculares.`, { unit: '°' }),
          ],
        },
        {
          card: {
            title: 'Reta e plano',
            body: t`Com diretor $\vec v$ da reta e normal $\vec n$ do plano:
• Reta **paralela** ao plano (ou contida): $\vec v\cdot\vec n=0$
• Reta **perpendicular** ao plano: $\vec v\parallel\vec n$
• **Interseção**: substitua as paramétricas da reta na equação do plano e ache $t$`,
            example: t`$r:(1,0,0)+t(1,1,1)$ e $\pi: x+y+z=6$: $1+3t=6\Rightarrow t=\frac53$ ⟹ $P=\left(\frac83,\frac53,\frac53\right)$.`,
          },
          exercises: [
            mcq(t`A reta de diretor $\vec v=(2,4,6)$ e o plano de normal $\vec n=(1,2,3)$ são…`, ['perpendiculares', 'paralelos', 'a reta está contida no plano', 'nada se pode afirmar'], 0, t`$\vec v=2\vec n$.`),
            num(t`A reta $(1,0,0)+t(1,1,1)$ intercepta o plano $x+y+z=6$ para $t=$? (fração ou decimal)`, 5 / 3, t`$(1+t)+t+t=6\Rightarrow t=\frac53$.`, { tol: 0.005 }),
            tf(t`Se $\vec v\cdot\vec n=0$, a reta é paralela ao plano ou está contida nele.`, true, t`O diretor fica "deitado" no plano.`),
            gen((rng) => {
              const n = nz3(rng, -2, 2);
              const v = nz3(rng, -2, 2);
              const dv = dot3(n, v);
              const ans = dv === 0 ? 0 : v.every((x, i) => x * n[(i + 1) % 3] === v[(i + 1) % 3] * n[i]) ? 1 : 2;
              return mcq(t`Uma reta de diretor $${V3(v)}$ e um plano de normal $${V3(n)}$: a reta é…`, ['paralela ao plano (ou contida)', 'perpendicular ao plano', 'oblíqua (corta em um ponto, sem ser perpendicular)'], ans, t`$\vec v\cdot\vec n=${dv}$${ans === 1 ? ' e os vetores são proporcionais' : ''}.`);
            }),
            gen((rng) => {
              const tt = randInt(rng, -2, 3);
              const A = r3(rng, -2, 2);
              const k = A[0] + A[1] + A[2] + 3 * tt;
              return num(t`Para qual $t$ a reta $${V3(A)}+t\,(1,\,1,\,1)$ fura o plano $x+y+z=${k}$?`, tt, t`$${A[0] + A[1] + A[2]}+3t=${k}\Rightarrow t=${tt}$.`);
            }),
            mcqS(t`Qual reta é perpendicular ao plano $2x-y+3z=1$?`, t`$P=(0,0,0)+t(2,\,-1,\,3)$`, [t`$P=(0,0,0)+t(1,\,2,\,0)$`, t`$P=(2,\,-1,\,3)+t(1,\,1,\,1)$`, t`$P=(0,0,0)+t(3,\,-1,\,2)$`], t`O diretor precisa ser paralelo à normal $(2,\,-1,\,3)$.`),
            num(t`A reta $x=t$, $y=2t$, $z=3$ fura o plano $x+y+z=9$ em qual valor de $x$?`, 2, t`$t+2t+3=9\Rightarrow t=2$.`),
          ],
        },
      ],
    },
  ],
};

const m2 = (a: number, b: number, c: number, d: number) => `\\begin{pmatrix}${a}&${b}\\\\${c}&${d}\\end{pmatrix}`;

export const transformacoes: UnitDef = {
  id: 'g-trans',
  title: 'Matrizes como transformações',
  subtitle: 'Determinante como área, inversa e autovalores',
  icon: '🌀',
  extra: true,
  source: 'Tópico extra (Álgebra Linear)',
  guide: t`Toda matriz $2\times2$ é uma transformação do plano: as colunas são as imagens de $\vec i$ e $\vec j$. O determinante é o fator de área; autovetores só esticam.`,
  lessons: [
    {
      id: 'g-trans-geo',
      title: 'Transformações lineares',
      parts: [
        {
          card: {
            title: 'As colunas dizem tudo',
            body: t`$A\vec x$: a 1ª coluna é para onde vai $\vec i$, a 2ª é para onde vai $\vec j$. Retas continuam retas e a origem fica parada. Mexa nos números da matriz:`,
            visual: matrixLab([1, 1, 0, 1]),
          },
          exercises: [
            tf(t`Toda transformação linear leva a origem na origem.`, true, t`$A\vec0=\vec0$.`),
            gen((rng) => {
              const [a, b, c, d] = [randInt(rng, -3, 3), randInt(rng, -3, 3), randInt(rng, -3, 3), randInt(rng, -3, 3)];
              return rmcq(rng, t`Para onde a matriz $${m2(a, b, c, d)}$ leva o vetor $\vec i=(1,\,0)$?`, `$(${a},\\,${c})$`, [`$(${a},\\,${b})$`, `$(${b},\\,${d})$`, `$(${c},\\,${d})$`, `$(${a + 1},\\,${c})$`], t`A imagem de $\vec i$ é a **1ª coluna**: $(${a},\,${c})$.`);
            }),
            gen((rng) => {
              const [a, b, c, d] = [randInt(rng, -3, 3), randInt(rng, -3, 3), randInt(rng, -3, 3), randInt(rng, -3, 3)];
              return rmcq(rng, t`Para onde a matriz $${m2(a, b, c, d)}$ leva o vetor $\vec j=(0,\,1)$?`, `$(${b},\\,${d})$`, [`$(${a},\\,${c})$`, `$(${c},\\,${d})$`, `$(${a},\\,${b})$`, `$(${b},\\,${d + 1})$`], t`A imagem de $\vec j$ é a **2ª coluna**: $(${b},\,${d})$.`);
            }),
            gen((rng) => {
              const M = [randInt(rng, -3, 3), randInt(rng, -3, 3), randInt(rng, -3, 3), randInt(rng, -3, 3)];
              const x = [randInt(rng, -2, 2), randInt(rng, -2, 2)];
              const r = [M[0] * x[0] + M[1] * x[1], M[2] * x[0] + M[3] * x[1]];
              return rmcq(rng, t`Calcule $${m2(M[0], M[1], M[2], M[3])}\begin{pmatrix}${x[0]}\\${x[1]}\end{pmatrix}$.`, t`$(${r[0]},\,${r[1]})$`, [t`$(${M[0] * x[0] + M[2] * x[1]},\,${M[1] * x[0] + M[3] * x[1]})$`, t`$(${r[0] + 1},\,${r[1]})$`, t`$(${r[1]},\,${r[0]})$`, t`$(${r[0]},\,${r[1] - 1})$`], t`$x\cdot$(1ª coluna) $+\ y\cdot$(2ª coluna).`);
            }),
            mcq(t`Uma matriz leva $\vec i$ em $(2,\,1)$ e $\vec j$ em $(0,\,3)$. Qual é ela?`, [`$${m2(2, 0, 1, 3)}$`, `$${m2(2, 1, 0, 3)}$`, `$${m2(0, 2, 3, 1)}$`, `$${m2(1, 2, 3, 0)}$`], 0, t`As imagens viram as **colunas**.`),
            tf(t`Uma transformação linear sempre leva retas em retas (ou num ponto).`, true, t`É uma das marcas das transformações lineares.`),
            inter(t`Monte uma matriz que **dobra** todos os vetores (escala por 2).`, 'plot', matrixLab([1, 0, 0, 1]).props, (v: any) => v && near(v.p.a, 2, 0.01) && near(v.p.b, 0, 0.01) && near(v.p.c, 0, 0.01) && near(v.p.d, 2, 0.01), `$${m2(2, 0, 0, 2)}$`),
          ],
        },
        {
          card: {
            title: 'Rotações, reflexões e cisalhamentos',
            body: t`Algumas transformações famosas:

• rotação de $90^\circ$ (anti-horária): $${m2(0, -1, 1, 0)}$
• reflexão no eixo $x$: $${m2(1, 0, 0, -1)}$
• cisalhamento horizontal: $${m2(1, 1, 0, 1)}$
• rotação de $\theta$: $\begin{pmatrix}\cos\theta&-\operatorname{sen}\theta\\\operatorname{sen}\theta&\cos\theta\end{pmatrix}$`,
            visual: matrixLab([0, -1, 1, 0]),
          },
          exercises: [
            inter(t`Monte a **rotação de 90°** anti-horária.`, 'plot', matrixLab([1, 0, 0, 1]).props, (v: any) => v && near(v.p.a, 0, 0.01) && near(v.p.c, 1, 0.01) && near(v.p.b, -1, 0.01) && near(v.p.d, 0, 0.01), t`$${m2(0, -1, 1, 0)}$`),
            inter(t`Monte a reflexão no eixo $y$ (espelho vertical).`, 'plot', matrixLab([1, 0, 0, 1]).props, (v: any) => v && near(v.p.a, -1, 0.01) && near(v.p.c, 0, 0.01) && near(v.p.b, 0, 0.01) && near(v.p.d, 1, 0.01), t`$${m2(-1, 0, 0, 1)}$`),
            gen((rng) => {
              const x = randNZ(rng, -4, 4);
              const y = randNZ(rng, -4, 4);
              return rmcq(rng, t`A rotação de $90^\circ$ anti-horária leva $(${x},\,${y})$ em:`, `$(${-y},\\,${x})$`, [`$(${y},\\,${-x})$`, `$(${-x},\\,${-y})$`, `$(${x},\\,${-y})$`, `$(${y},\\,${x})$`], t`$${m2(0, -1, 1, 0)}\begin{pmatrix}${x}\\${y}\end{pmatrix}=(${-y},\,${x})$.`);
            }),
            gen((rng) => {
              const x = randNZ(rng, -4, 4);
              const y = randNZ(rng, -4, 4);
              return rmcq(rng, t`A reflexão no eixo $x$ leva $(${x},\,${y})$ em:`, `$(${x},\\,${-y})$`, [`$(${-x},\\,${y})$`, `$(${-x},\\,${-y})$`, `$(${y},\\,${x})$`], t`Só a coordenada $y$ troca de sinal.`);
            }),
            mcq(t`Aplicar a rotação de $90^\circ$ **duas vezes** equivale a…`, ['girar $180^\\circ$', 'não fazer nada', 'refletir no eixo $x$', 'dobrar o vetor'], 0, t`$${m2(0, -1, 1, 0)}^2=${m2(-1, 0, 0, -1)}$.`),
            tf(t`O cisalhamento $${m2(1, 1, 0, 1)}$ mantém a área das figuras.`, true, t`$\det=1$: a forma muda, a área não.`),
            num(t`Na rotação de $\theta=60^\circ$, qual é o elemento da linha 1, coluna 1 da matriz? (decimal)`, 0.5, t`$\cos60^\circ=0{,}5$.`),
          ],
        },
      ],
    },
    {
      id: 'g-trans-det',
      title: 'Determinante e inversa',
      parts: [
        {
          card: {
            title: 'Fator de área',
            body: t`O quadrado unitário vira um paralelogramo de área $|\det A|$.

• $\det A<0$: a orientação inverte (como num espelho)
• $\det A=0$: o plano **achata** numa reta (ou num ponto)`,
            visual: matrixLab([2, 1, 0.5, 1.5]),
          },
          exercises: [
            gen((rng) => {
              const a = randInt(rng, 1, 4);
              const d = randInt(rng, 1, 4);
              const b = randInt(rng, -2, 2);
              const c = randInt(rng, -2, 2);
              return num(t`Um quadrado de área 1 é transformado por $${m2(a, b, c, d)}$. Qual a nova área?`, Math.abs(a * d - b * c), t`$|\det|=|${a * d}-(${b * c})|=${Math.abs(a * d - b * c)}$.`);
            }),
            inter(t`Faça a transformação **achatar** o plano ($\det A=0$) sem zerar a matriz.`, 'plot', matrixLab([1, 0, 0, 1]).props, (v: any) => v && Math.abs(v.p.a * v.p.d - v.p.b * v.p.c) < 0.02 && Math.abs(v.p.a) + Math.abs(v.p.b) + Math.abs(v.p.c) + Math.abs(v.p.d) > 0.5, t`colunas paralelas, ex.: $${m2(1, 2, 1, 2)}$`),
            tf(t`$\det(AB)=\det A\cdot\det B$`, true, t`Aplicar $B$ e depois $A$ multiplica as áreas pelos dois fatores.`),
            mcq(t`Se $\det A=-2$, a transformação…`, ['dobra as áreas e inverte a orientação', 'reduz as áreas pela metade', 'achata o plano', 'mantém tudo igual'], 0, t`$|\det|=2$ e o sinal negativo é o "espelho".`),
            gen((rng) => {
              const k = randInt(rng, 2, 5);
              const A = randInt(rng, 2, 10);
              return num(t`Uma figura de área $${A}$ é transformada por $${m2(k, 0, 0, k)}$. Qual a nova área?`, A * k * k, t`$\det=${k * k}$: área $${A}\cdot${k * k}=${A * k * k}$.`);
            }),
            mcq(t`Qual destas matrizes **achata** o plano numa reta?`, [`$${m2(2, 4, 1, 2)}$`, `$${m2(2, 0, 0, 1)}$`, `$${m2(0, -1, 1, 0)}$`, `$${m2(1, 1, 0, 1)}$`], 0, t`$2\cdot2-4\cdot1=0$: colunas paralelas.`),
            num(t`$\det A=3$ e $\det B=-2$. Por quanto a transformação $AB$ multiplica as áreas?`, 6, t`$|\det(AB)|=|3\cdot(-2)|=6$.`),
          ],
        },
        {
          card: {
            title: 'A inversa',
            body: t`A inversa **desfaz** a transformação: $A^{-1}A=I$. Para $2\times2$:

$$A^{-1}=\frac{1}{ad-bc}\begin{pmatrix}d&-b\\-c&a\end{pmatrix}$$

Só existe se $\det A\neq0$.`,
          },
          exercises: [
            mcqS(t`Qual a inversa de $${m2(2, 1, 1, 1)}$?`, `$${m2(1, -1, -1, 2)}$`, [`$${m2(1, 1, 1, 2)}$`, t`$\begin{pmatrix}\frac12&1\\1&1\end{pmatrix}$`, `$${m2(-1, 1, 1, -2)}$`], t`$\det=1$; troca a diagonal e inverte os sinais da outra.`),
            tf(t`Uma matriz com determinante zero não tem inversa.`, true, t`A fórmula divide por $\det A$; geometricamente, o achatamento não pode ser desfeito.`),
            gen((rng) => {
              const k = pick(rng, [2, 4, 5]);
              return rmcq(rng, t`Qual a inversa de $${m2(k, 0, 0, k)}$?`, `$\\begin{pmatrix}\\frac{1}{${k}}&0\\\\0&\\frac{1}{${k}}\\end{pmatrix}$`, [`$${m2(-k, 0, 0, -k)}$`, `$${m2(k, 0, 0, k)}$`, `$${m2(0, k, k, 0)}$`], t`Se a matriz multiplica tudo por $${k}$, a inversa divide por $${k}$.`);
            }),
            mcq(t`Qual a inversa da rotação de $90^\circ$ anti-horária?`, ['a rotação de $90^\\circ$ horária', 'ela mesma', 'a reflexão no eixo $x$', 'não existe'], 0, t`Desfazer o giro é girar de volta.`),
            gen((rng) => {
              const [a, b, c, d] = pick(rng, [[3, 1, 2, 1], [2, 5, 1, 3], [4, 3, 1, 1], [5, 2, 2, 1]] as const);
              return rmcq(rng, t`Qual a inversa de $${m2(a, b, c, d)}$? (seu determinante é $1$)`, `$${m2(d, -b, -c, a)}$`, [`$${m2(a, -b, -c, d)}$`, `$${m2(d, b, c, a)}$`, `$${m2(-d, b, c, -a)}$`], t`$\det=${a * d - b * c}$: troque $a$ com $d$ e mude o sinal de $b$ e $c$.`);
            }),
            num(t`Se $\det A=4$, quanto vale $\det(A^{-1})$? (decimal)`, 0.25, t`$\det A\cdot\det A^{-1}=\det I=1$.`),
            num(t`Resolva $${m2(2, 1, 1, 1)}\begin{pmatrix}x\\y\end{pmatrix}=\begin{pmatrix}5\\3\end{pmatrix}$ usando a inversa. Quanto vale $x$?`, 2, t`$A^{-1}=${m2(1, -1, -1, 2)}$: $x=5-3=2$ (e $y=-5+6=1$).`),
          ],
        },
      ],
    },
    {
      id: 'g-trans-eig',
      title: 'Autovalores e autovetores',
      parts: [
        {
          card: {
            title: 'Vetores que só esticam',
            body: t`$$A\vec v=\lambda\vec v$$
$\vec v$ é **autovetor** (não muda de direção) e $\lambda$ é o **autovalor** (fator de esticamento). As retas douradas tracejadas são as direções dos autovetores:`,
            visual: matrixLab([2, 1, 1, 2], true),
            tip: t`Aplicações: vibrações (modos naturais), estabilidade de sistemas, PageRank, análise de componentes principais.`,
          },
          exercises: [
            mcqS(t`Os autovalores de uma matriz diagonal $${m2(5, 0, 0, -2)}$ são:`, t`$5$ e $-2$`, [t`$3$ e $7$`, t`$0$ e $0$`, t`$-10$`], t`Numa matriz diagonal, $\vec i$ e $\vec j$ já são autovetores.`),
            tf(t`Se $A\vec v=3\vec v$, então $\vec v$ é autovetor de $A$ com autovalor $3$.`, true, t`É exatamente a definição.`),
            gen((rng) => {
              const a = randInt(rng, 1, 4);
              const b = randInt(rng, 1, 3);
              const ok = rng() < 0.5;
              const v = ok ? [1, 1] : [1, -1];
              const lam = ok ? a + b : a - b;
              return num(t`Calcule $${m2(a, b, b, a)}\begin{pmatrix}${v[0]}\\${v[1]}\end{pmatrix}$ e diga por qual número o vetor foi multiplicado (o autovalor).`, lam, t`O resultado é $(${lam * v[0]},\,${lam * v[1]})=${lam}\cdot(${v[0]},\,${v[1]})$.`);
            }),
            mcq(t`Na rotação de $90^\circ$, existe algum autovetor real (não nulo)?`, ['não: todo vetor muda de direção', 'sim, o $\\vec i$', 'sim, todos', 'sim, o $(1,\\,1)$'], 0, t`Girar $90^\circ$ muda a direção de qualquer vetor não nulo.`),
            gen((rng) => {
              const k = randInt(rng, 2, 6);
              return num(t`Qual é o autovalor de $${m2(k, 0, 0, k)}$ (o mesmo para todo vetor)?`, k, t`A matriz multiplica qualquer vetor por $${k}$.`);
            }),
            tf(t`O vetor nulo é considerado autovetor.`, false, t`Por definição, autovetores são **não nulos** (senão todo $\lambda$ serviria).`),
            mcq(t`Para a reflexão no eixo $x$, $${m2(1, 0, 0, -1)}$, quais são os autovalores?`, ['$1$ e $-1$', '$0$ e $1$', 'só $1$', '$-1$ e $-1$'], 0, t`$\vec i$ fica igual ($\lambda=1$) e $\vec j$ inverte ($\lambda=-1$).`),
          ],
        },
        {
          card: {
            title: 'Calculando autovalores',
            body: t`Os autovalores são as raízes do **polinômio característico**:
$$\det(A-\lambda I)=0$$

Para $2\times2$: $\lambda^2-(\text{traço})\,\lambda+\det A=0$. Por isso a **soma** dos autovalores é o traço ($a+d$) e o **produto** é $\det A$.`,
            example: t`$${m2(2, 1, 1, 2)}$: $(2-\lambda)^2-1=0\Rightarrow\lambda=1$ ou $3$.`,
          },
          exercises: [
            multi(t`Quais são autovalores de $${m2(2, 1, 1, 2)}$?`, ['$1$', '$3$', '$2$', '$0$'], [0, 1], t`$(2-\lambda)^2=1\Rightarrow\lambda=1$ ou $3$.`),
            tf(t`A soma dos autovalores de uma matriz é igual ao seu traço (soma da diagonal).`, true, t`Pelo polinômio característico, soma das raízes $=$ traço.`),
            num(t`O produto dos autovalores de $A=${m2(4, 1, 2, 3)}$ vale quanto?`, 10, t`Produto dos autovalores $=\det A=12-2=10$ (eles são $5$ e $2$).`),
            gen((rng) => {
              const l1 = randInt(rng, -2, 5);
              let l2 = randInt(rng, -2, 5);
              if (l2 === l1) l2 = l1 + 2;
              const a = l1;
              const d = l2;
              const b = randInt(rng, -3, 3);
              return num(t`Qual é o **maior** autovalor de $${m2(a, b, 0, d)}$ (triangular)?`, Math.max(l1, l2), t`Em matriz triangular, os autovalores são os elementos da diagonal: $${l1}$ e $${l2}$.`);
            }),
            gen((rng) => {
              const l1 = randInt(rng, 1, 5);
              const l2 = randInt(rng, 1, 5);
              const S = l1 + l2;
              const P = l1 * l2;
              return num(t`Uma matriz $2\times2$ tem traço $${S}$ e determinante $${P}$. Qual é o **maior** autovalor?`, Math.max(l1, l2), t`$\lambda^2-${S}\lambda+${P}=0$: raízes $${l1}$ e $${l2}$.`);
            }),
            mcq(t`Qual é o polinômio característico de $${m2(3, 1, 0, 2)}$?`, ['$\\lambda^2-5\\lambda+6$', '$\\lambda^2+5\\lambda+6$', '$\\lambda^2-6\\lambda+5$', '$\\lambda^2-5\\lambda-6$'], 0, t`Traço $5$, determinante $6$.`),
            num(t`Calcule o maior autovalor de $${m2(4, 1, 2, 3)}$.`, 5, t`$\lambda^2-7\lambda+10=0\Rightarrow\lambda=5$ ou $2$.`),
          ],
        },
      ],
    },
  ],
};

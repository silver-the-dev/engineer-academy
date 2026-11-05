import React from 'react';
import type { Unit } from '../../types';
import { gen, mcq, mcqS, num, tf, fill, match, order, inter, plot, rmcq, near, multi } from '../../helpers';
import { Arrow, InfLine, Pt, Seg } from '../../../components/plot/Plot';
import { Arrow3, Axes3, Line3, Point3, Poly3, type V3 as V3T } from '../../../components/visuals/Space3D';
import { C } from '../../../theme';
import { fmt, pick, randInt, randNZ } from '../../../lib/random';
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

export const reta: Unit = {
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
      cards: [
        {
          title: 'P = A + t v',
          body: t`Cada valor de $t$ dá um ponto da reta. Arraste $A$, a ponta do diretor e mude $t$:`,
          visual: paramLine(),
        },
        {
          title: 'No espaço',
          body: t`$$r:\ \begin{cases}x=x_0+a\,t\\y=y_0+b\,t\\z=z_0+c\,t\end{cases}$$
Gire a cena e percorra a reta com $t$:`,
          visual: line3D(),
          tip: t`Para saber se um ponto $Q$ está na reta, ache $t$ pela 1ª equação e confira nas outras.`,
        },
      ],
      exercises: [
        gen((rng) => {
          const A = [randInt(rng, -3, 3), randInt(rng, -3, 3), randInt(rng, -3, 3)];
          const v = [randNZ(rng, -3, 3), randNZ(rng, -3, 3), randNZ(rng, -3, 3)];
          const tt = randInt(rng, -2, 3);
          const P = A.map((a, i) => a + tt * v[i]);
          return rmcq(rng, t`A reta $r: P=${V3(A)}+t\,${V3(v)}$ passa por qual ponto quando $t=${tt}$?`, `$${V3(P)}$`, [`$${V3(A.map((a, i) => a - tt * v[i]))}$`, `$${V3(v.map((x, i) => x + tt * A[i]))}$`, `$${V3(P.map((x, i) => (i === 1 ? x + 1 : x)))}$`]);
        }),
        mcqS(t`Qual é um vetor diretor da reta $\begin{cases}x=2+3t\\y=-1+t\\z=5-2t\end{cases}$?`, t`$(3,\,1,\,-2)$`, [t`$(2,\,-1,\,5)$`, t`$(3,\,-1,\,2)$`, t`$(5,\,0,\,3)$`]),
        num(t`O ponto $Q(7,\,a,\,1)$ pertence à reta $x=1+2t$, $y=3-t$, $z=-5+2t$. Quanto vale $a$?`, 0, t`$7=1+2t\Rightarrow t=3$; $z=-5+6=1$ ✓; $a=3-3=0$.`),
        inter(t`Monte a reta que passa por $A(0,\,1)$ com diretor $\vec v=(2,\,-1)$.`, 'plot', paramLine().props, (v: any) => v && v.pts.A.x === 0 && v.pts.A.y === 1 && near(v.pts.V.x - v.pts.A.x, 2, 0.01) && near(v.pts.V.y - v.pts.A.y, -1, 0.01), t`$A=(0,\,1)$ e ponta em $(2,\,0)$`),
      ],
    },
    {
      id: 'g-reta-2p',
      title: 'Reta por dois pontos e posições',
      cards: [
        {
          title: 'Dois pontos bastam',
          body: t`Por $A$ e $B$: diretor $\vec v=\vec{AB}=B-A$ e $P=A+t\,(B-A)$.

**Retas paralelas aos eixos**: diretor $\vec i$, $\vec j$ ou $\vec k$ (duas coordenadas constantes).

**Posições relativas** no espaço: concorrentes, paralelas, coincidentes ou **reversas** (não se cruzam e não são paralelas).`,
          example: t`$A(1,2,3)$, $B(4,0,5)$: $\vec v=(3,-2,2)$, $r:(1,2,3)+t(3,-2,2)$.`,
        },
      ],
      exercises: [
        gen((rng) => {
          const A = [randInt(rng, -3, 3), randInt(rng, -3, 3), randInt(rng, -3, 3)];
          const B = [randInt(rng, -3, 3), randInt(rng, -3, 3), randInt(rng, -3, 3)];
          return rmcq(rng, t`Qual o diretor da reta por $A=${V3(A)}$ e $B=${V3(B)}$?`, `$${V3(B.map((b, i) => b - A[i]))}$`, [`$${V3(A.map((a, i) => a + B[i]))}$`, `$${V3(A)}$`, `$${V3(B.map((b, i) => (b - A[i]) * (i === 2 ? -1 : 1)))}$`]);
        }),
        mcq(t`A reta $x=2$, $y=3$, $z=t$ é paralela a qual eixo?`, ['eixo z', 'eixo x', 'eixo y', 'nenhum'], 0),
        tf(t`No espaço, duas retas que não se cruzam são necessariamente paralelas.`, false, t`Podem ser **reversas**: em planos diferentes, sem direção comum.`),
        mcqS(t`As retas com diretores $(1,\,2,\,-1)$ e $(-2,\,-4,\,2)$ são:`, 'paralelas ou coincidentes', ['perpendiculares', 'reversas com certeza', 'concorrentes com certeza'], t`Diretores proporcionais ($k=-2$).`),
      ],
    },
    {
      id: 'g-reta-ang',
      title: 'Ângulo entre retas e ortogonalidade',
      cards: [
        {
          title: 'Ângulo entre diretores',
          body: t`$$\cos\theta=\frac{|\vec v_1\cdot\vec v_2|}{|\vec v_1|\,|\vec v_2|}\quad(0^\circ\le\theta\le90^\circ)$$
Usamos o módulo porque o ângulo entre retas é sempre o menor.

**Retas ortogonais** ⟺ $\vec v_1\cdot\vec v_2=0$.`,
        },
      ],
      exercises: [
        gen((rng) => {
          const a = randNZ(rng, -3, 3);
          const b = randNZ(rng, -3, 3);
          return num(t`Para que as retas de diretores $(${a},\,${b},\,1)$ e $(1,\,1,\,m)$ sejam ortogonais, $m=$?`, -(a + b), t`$${a}+${b}+m=0\Rightarrow m=${-(a + b)}$.`);
        }),
        num(t`Calcule o ângulo (graus) entre as retas de diretores $(1,\,0,\,0)$ e $(1,\,1,\,0)$.`, 45, undefined, { unit: '°' }),
        num(t`Calcule o ângulo (graus) entre as retas de diretores $(1,\,1,\,0)$ e $(-1,\,0,\,0)$.`, 45, t`$\cos\theta=\frac{|-1|}{\sqrt2\cdot1}$ ⟹ $45^\circ$ (o ângulo entre **retas** é o menor).`, { unit: '°' }),
        tf(t`Retas ortogonais no espaço precisam se cruzar.`, false, t`Ortogonalidade é sobre as **direções**; retas reversas também podem ser ortogonais.`),
      ],
    },
  ],
};

export const plano: Unit = {
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
      cards: [
        {
          title: 'O vetor normal manda',
          body: t`Se $\vec n=(a,b,c)$ é normal ao plano e $A$ é um ponto dele, para todo $P$ do plano: $\vec n\cdot(P-A)=0$, ou seja
$$ax+by+cz+d=0$$
Gire e mexa nos coeficientes (normal dourada):`,
          visual: plane3DLab(),
          example: t`Normal $(2,-1,3)$ e ponto $A(1,0,2)$: $2x-y+3z+d=0$ com $2+6+d=0\Rightarrow d=-8$.`,
          tip: t`**Casos particulares**: falta $z$ ⟹ plano paralelo ao eixo $z$; $z=k$ ⟹ plano horizontal.`,
        },
      ],
      exercises: [
        gen((rng) => {
          const n = [randNZ(rng, -3, 3), randNZ(rng, -3, 3), randNZ(rng, -3, 3)];
          const A = [randInt(rng, -2, 2), randInt(rng, -2, 2), randInt(rng, -2, 2)];
          const d = -(n[0] * A[0] + n[1] * A[1] + n[2] * A[2]);
          return num(t`O plano tem normal $${V3(n)}$ e passa por $A=${V3(A)}$. Na equação $${n[0]}x${n[1] < 0 ? '' : '+'}${n[1]}y${n[2] < 0 ? '' : '+'}${n[2]}z+d=0$, quanto vale $d$?`, d, t`Substitua $A$: $d=-(${n[0] * A[0]}+${n[1] * A[1]}+${n[2] * A[2]})=${d}$.`.replace(/\+-/g, '-'));
        }),
        mcqS(t`Qual é um vetor normal ao plano $3x-2y+z-7=0$?`, t`$(3,\,-2,\,1)$`, [t`$(3,\,2,\,1)$`, t`$(-7,\,1,\,0)$`, t`$(1,\,-2,\,3)$`]),
        tf(t`O ponto $(1,\,2,\,3)$ pertence ao plano $x+y-z=0$.`, true, t`$1+2-3=0$ ✓`),
        mcq(t`O plano $z=4$ é…`, ['paralelo ao plano xy', 'paralelo ao eixo z', 'perpendicular ao plano xy', 'passa pela origem'], 0),
        inter(t`Ajuste o plano para que fique **horizontal** ($\vec n$ vertical) na altura $z=2$.`, 'space3d', plane3DLab().props!, (v: any) => v && near(v.p.a, 0, 0.01) && near(v.p.b, 0, 0.01) && near(v.p.d, 2, 0.01), t`$a=b=0$, $d=2$`),
      ],
    },
    {
      id: 'g-plano-param',
      title: 'Equação vetorial e paramétricas',
      cards: [
        {
          title: 'Ponto + dois diretores',
          body: t`Com um ponto $A$ e dois vetores não paralelos $\vec u$, $\vec v$ do plano:
$$P=A+h\,\vec u+t\,\vec v$$
A normal é $\vec n=\vec u\times\vec v$ — conecta com o produto vetorial!

Com $h,t\in[0,1]$, $P$ percorre o **paralelogramo** de lados $\vec u$ e $\vec v$.`,
          example: t`Plano por $A(1,0,0)$, $B(0,1,0)$, $C(0,0,1)$: $\vec u=B-A$, $\vec v=C-A$, $\vec n=\vec u\times\vec v=(1,1,1)$ ⟹ $x+y+z-1=0$.`,
        },
      ],
      exercises: [
        mcqS(t`Qual a equação do plano por $(1,0,0)$, $(0,1,0)$ e $(0,0,1)$?`, t`$x+y+z=1$`, [t`$x+y+z=0$`, t`$x-y+z=1$`, t`$xyz=1$`]),
        mcqS(t`A normal do plano gerado por $\vec u=(1,0,0)$ e $\vec v=(0,1,0)$ é paralela a:`, t`$\vec k$`, [t`$\vec i$`, t`$\vec j$`, t`$\vec i+\vec j$`]),
        tf(t`Três pontos colineares determinam um único plano.`, false, t`Pontos colineares estão em infinitos planos; é preciso 3 pontos **não** colineares.`),
        order(t`Ordene os passos para obter a equação geral pelo método dos três pontos:`, [t`Calcular $\vec u=B-A$ e $\vec v=C-A$`, t`Calcular $\vec n=\vec u\times\vec v$`, t`Escrever $ax+by+cz+d=0$ com $\vec n=(a,b,c)$`, t`Substituir $A$ para achar $d$`]),
      ],
    },
    {
      id: 'g-plano-pos',
      title: 'Ângulos, paralelismo e interseções',
      cards: [
        {
          title: 'Tudo é produto escalar',
          body: t`• Ângulo entre planos: $\cos\theta=\frac{|\vec n_1\cdot\vec n_2|}{|\vec n_1||\vec n_2|}$
• Planos **perpendiculares**: $\vec n_1\cdot\vec n_2=0$ · **paralelos**: $\vec n_1\parallel\vec n_2$
• Reta $\parallel$ plano: $\vec v\cdot\vec n=0$ · Reta $\perp$ plano: $\vec v\parallel\vec n$
• **Interseção de dois planos**: uma reta de diretor $\vec n_1\times\vec n_2$
• **Reta ∩ plano**: substitua as paramétricas na equação do plano e ache $t$`,
          example: t`$r:(1,0,0)+t(1,1,1)$ e $\pi: x+y+z=6$: $1+3t=6\Rightarrow t=\frac53$ ⟹ $P=\left(\frac83,\frac53,\frac53\right)$.`,
        },
      ],
      exercises: [
        mcqS(t`Os planos $x+2y-z=3$ e $2x+4y-2z=1$ são:`, 'paralelos', ['perpendiculares', 'coincidentes', 'concorrentes'], t`Normais proporcionais, mas $d$ não segue a proporção.`),
        num(t`Para que os planos $x+y+mz=0$ e $2x-y+z=5$ sejam perpendiculares, $m=$?`, -1, t`$2-1+m=0\Rightarrow m=-1$.`),
        num(t`A reta $(1,0,0)+t(1,1,1)$ intercepta o plano $x+y+z=6$ para $t=$?`, 5 / 3, undefined, { tol: 0.005 }),
        mcq(t`A reta de diretor $\vec v=(2,4,6)$ e o plano de normal $\vec n=(1,2,3)$ são…`, ['perpendiculares', 'paralelos', 'a reta está contida no plano', 'nada se pode afirmar'], 0, t`$\vec v=2\vec n$.`),
        num(t`Calcule o ângulo (graus) entre os planos $z=0$ e $x+z=0$.`, 45, t`$\vec n_1=(0,0,1)$, $\vec n_2=(1,0,1)$: $\cos\theta=\frac{1}{\sqrt2}$.`, { unit: '°' }),
      ],
    },
  ],
};

export const transformacoes: Unit = {
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
      cards: [
        {
          title: 'As colunas dizem tudo',
          body: t`$A\vec x$: a 1ª coluna é para onde vai $\vec i$, a 2ª é para onde vai $\vec j$. Retas continuam retas e a origem fica parada. Mexa nos números da matriz:`,
          visual: matrixLab([1, 1, 0, 1]),
          tip: t`Exemplos: rotação de $90^\circ$ $\begin{pmatrix}0&-1\\1&0\end{pmatrix}$, reflexão no eixo $x$ $\begin{pmatrix}1&0\\0&-1\end{pmatrix}$, cisalhamento $\begin{pmatrix}1&1\\0&1\end{pmatrix}$.`,
        },
      ],
      exercises: [
        inter(t`Monte a **rotação de 90°** anti-horária.`, 'plot', matrixLab([1, 0, 0, 1]).props, (v: any) => v && near(v.p.a, 0, 0.01) && near(v.p.c, 1, 0.01) && near(v.p.b, -1, 0.01) && near(v.p.d, 0, 0.01), t`$\begin{pmatrix}0&-1\\1&0\end{pmatrix}$`),
        inter(t`Monte a reflexão no eixo $y$ (espelho vertical).`, 'plot', matrixLab([1, 0, 0, 1]).props, (v: any) => v && near(v.p.a, -1, 0.01) && near(v.p.c, 0, 0.01) && near(v.p.b, 0, 0.01) && near(v.p.d, 1, 0.01), t`$\begin{pmatrix}-1&0\\0&1\end{pmatrix}$`),
        gen((rng) => {
          const M = [randInt(rng, -3, 3), randInt(rng, -3, 3), randInt(rng, -3, 3), randInt(rng, -3, 3)];
          const x = [randInt(rng, -2, 2), randInt(rng, -2, 2)];
          const r = [M[0] * x[0] + M[1] * x[1], M[2] * x[0] + M[3] * x[1]];
          return rmcq(rng, t`Calcule $\begin{pmatrix}${M[0]}&${M[1]}\\${M[2]}&${M[3]}\end{pmatrix}\begin{pmatrix}${x[0]}\\${x[1]}\end{pmatrix}$.`, t`$(${r[0]},\,${r[1]})$`, [t`$(${M[0] * x[0] + M[2] * x[1]},\,${M[1] * x[0] + M[3] * x[1]})$`, t`$(${r[0] + 1},\,${r[1]})$`, t`$(${r[1]},\,${r[0]})$`]);
        }),
        tf(t`Toda transformação linear leva a origem na origem.`, true, t`$A\vec0=\vec0$.`),
      ],
    },
    {
      id: 'g-trans-det',
      title: 'Determinante e inversa',
      cards: [
        {
          title: 'Fator de área',
          body: t`O quadrado unitário vira um paralelogramo de área $|\det A|$. Sinal negativo = orientação invertida (espelho). $\det A=0$ ⟹ o plano **achata** numa reta ⟹ não há inversa.

$$A^{-1}=\frac{1}{ad-bc}\begin{pmatrix}d&-b\\-c&a\end{pmatrix}$$`,
          visual: matrixLab([2, 1, 0.5, 1.5]),
        },
      ],
      exercises: [
        inter(t`Faça a transformação **achatar** o plano ($\det A=0$) sem zerar a matriz.`, 'plot', matrixLab([1, 0, 0, 1]).props, (v: any) => v && Math.abs(v.p.a * v.p.d - v.p.b * v.p.c) < 0.02 && Math.abs(v.p.a) + Math.abs(v.p.b) + Math.abs(v.p.c) + Math.abs(v.p.d) > 0.5, t`colunas paralelas, ex.: $\begin{pmatrix}1&2\\1&2\end{pmatrix}$`),
        gen((rng) => {
          const a = randInt(rng, 1, 4);
          const d = randInt(rng, 1, 4);
          const b = randInt(rng, -2, 2);
          const c = randInt(rng, -2, 2);
          return num(t`Um quadrado de área 1 é transformado por $\begin{pmatrix}${a}&${b}\\${c}&${d}\end{pmatrix}$. Qual a nova área?`, Math.abs(a * d - b * c), t`$|\det|=|${a * d}-(${b * c})|=${Math.abs(a * d - b * c)}$.`);
        }),
        mcqS(t`Qual a inversa de $\begin{pmatrix}2&1\\1&1\end{pmatrix}$?`, t`$\begin{pmatrix}1&-1\\-1&2\end{pmatrix}$`, [t`$\begin{pmatrix}1&1\\1&2\end{pmatrix}$`, t`$\begin{pmatrix}\frac12&1\\1&1\end{pmatrix}$`, t`$\begin{pmatrix}-1&1\\1&-2\end{pmatrix}$`], t`$\det=1$; troca a diagonal e inverte os sinais da outra.`),
        tf(t`$\det(AB)=\det A\cdot\det B$`, true, t`Aplicar $B$ e depois $A$ multiplica as áreas pelos dois fatores.`),
      ],
    },
    {
      id: 'g-trans-eig',
      title: 'Autovalores e autovetores',
      cards: [
        {
          title: 'Vetores que só esticam',
          body: t`$$A\vec v=\lambda\vec v$$
$\vec v$ é **autovetor** (não muda de direção) e $\lambda$ é o **autovalor** (fator de esticamento). As retas douradas tracejadas são as direções dos autovetores:`,
          visual: matrixLab([2, 1, 1, 2], true),
          example: t`Ache $\lambda$ por $\det(A-\lambda I)=0$. Para $\begin{pmatrix}2&1\\1&2\end{pmatrix}$: $(2-\lambda)^2-1=0\Rightarrow\lambda=1$ ou $3$.`,
          tip: t`Aplicações: vibrações (modos naturais), estabilidade de sistemas, PageRank, análise de componentes principais.`,
        },
      ],
      exercises: [
        multi(t`Quais são autovalores de $\begin{pmatrix}2&1\\1&2\end{pmatrix}$?`, ['$1$', '$3$', '$2$', '$0$'], [0, 1]),
        mcqS(t`Os autovalores de uma matriz diagonal $\begin{pmatrix}5&0\\0&-2\end{pmatrix}$ são:`, t`$5$ e $-2$`, [t`$3$ e $7$`, t`$0$ e $0$`, t`$-10$`]),
        num(t`O produto dos autovalores de $A$ é igual a qual quantidade de $A=\begin{pmatrix}4&1\\2&3\end{pmatrix}$? (calcule)`, 10, t`Produto dos autovalores $=\det A=12-2=10$ (eles são $5$ e $2$).`),
        tf(t`A soma dos autovalores de uma matriz é igual ao seu traço (soma da diagonal).`, true),
      ],
    },
  ],
};

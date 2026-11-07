import React from 'react';
import type { UnitDef } from '../../types';
import { gen, mcqS, num, tf, fill, match, order, multi, inter, plot, rmcq, near, table } from '../../helpers';
import { Arrow, PolygonW } from '../../../components/plot/Plot';
import { C } from '../../../theme';
import { fmt, par, pick, randInt, randNZ, shuffle } from '../../../lib/random';
import { matrixLab } from '../../visuals';

const t = String.raw;
type M = number[][];
const tex = (m: M) => '\\begin{pmatrix}' + m.map((r) => r.join('&')).join('\\\\') + '\\end{pmatrix}';
const vtex = (m: M) => '\\begin{vmatrix}' + m.map((r) => r.join('&')).join('\\\\') + '\\end{vmatrix}';
const mul = (A: M, B: M): M => A.map((r) => B[0].map((_, j) => r.reduce((s, a, k) => s + a * B[k][j], 0)));
const det2 = (A: M) => A[0][0] * A[1][1] - A[0][1] * A[1][0];
const det3 = (A: M) =>
  A[0][0] * (A[1][1] * A[2][2] - A[1][2] * A[2][1]) - A[0][1] * (A[1][0] * A[2][2] - A[1][2] * A[2][0]) + A[0][2] * (A[1][0] * A[2][1] - A[1][1] * A[2][0]);
const rnd = (rng: () => number, r: number, c: number, lo = -4, hi = 5): M => Array.from({ length: r }, () => Array.from({ length: c }, () => randInt(rng, lo, hi)));
/** 2×2 integer matrix with det = ±1 (so the inverse is an integer matrix). */
const unimod = (rng: () => number): M => {
  const a = randInt(rng, 1, 5);
  const b = randInt(rng, 1, 4);
  const k = randInt(rng, 1, 3);
  return pick(rng, [
    [[a * k + 1, a], [k, 1]],
    [[a, a * b - 1], [1, b]],
    [[2, 1], [2 * k + 1, k + 1]],
  ] as M[]);
};

/** Columns u, v of a 2×2 matrix as draggable vectors; the parallelogram's signed area is det. */
const detLab = () =>
  plot({
    view: { xMin: -4, xMax: 4, yMin: -4, yMax: 4 },
    equalAspect: true,
    snap: 0.5,
    points: [
      { id: 'u', x: 2, y: 0.5, color: C.p2, label: 'col 1' },
      { id: 'v', x: 0.5, y: 2, color: C.p5, label: 'col 2' },
    ],
    render: ({ pts }: any) => {
      const { u, v } = pts;
      const d = u.x * v.y - u.y * v.x;
      return (
        <>
          <PolygonW pts={[[0, 0], [u.x, u.y], [u.x + v.x, u.y + v.y], [v.x, v.y]]} color={d >= 0 ? C.gold : C.danger} opacity={0.3} stroke={d >= 0 ? C.gold : C.danger} />
          <Arrow x1={0} y1={0} x2={u.x} y2={u.y} color={C.p2} />
          <Arrow x1={0} y1={0} x2={v.x} y2={v.y} color={C.p5} />
        </>
      );
    },
    info: ({ pts }: any) => {
      const { u, v } = pts;
      const d = u.x * v.y - u.y * v.x;
      return t`$\det\begin{pmatrix}${fmt(u.x, 1)}&${fmt(v.x, 1)}\\${fmt(u.y, 1)}&${fmt(v.y, 1)}\end{pmatrix}=${fmt(d, 2)}$ · área $${fmt(Math.abs(d), 2)}$${d < 0 ? ' · sinal negativo: a orientação inverteu' : d === 0 ? ' · colunas paralelas: área zero' : ''}`;
    },
  });

export const matrizes: UnitDef = {
  id: 'f-mat',
  title: 'Matrizes e determinantes a fundo',
  subtitle: 'Tipos de matrizes, propriedades do determinante, Laplace e inversa',
  icon: '🔢',
  guide: t`O produto de matrizes é **linha × coluna** e **não comuta**; $(AB)^T=B^TA^T$. O determinante mede a **área/volume com sinal** da transformação: troca de linhas muda o sinal, linha nula ou proporcional zera, $\det(AB)=\det A\cdot\det B$ e $\det(kA)=k^n\det A$. Para matrizes grandes, use **Laplace** pela linha com mais zeros. $A$ é inversível $\iff\det A\ne0$; em $2\times2$: troque a diagonal, troque o sinal da outra e divida pelo determinante.`,
  lessons: [
    {
      id: 'f-mat-tipos',
      title: 'Tipos de matrizes e operações',
      parts: [
        {
          card: [
            {
              title: 'Lei de formação e tipos',
              body: t`$A=(a_{ij})_{m\times n}$: $i$ é a linha, $j$ a coluna. Exemplo: $a_{ij}=2i-j$ em $2\times3$ dá $\begin{pmatrix}1&0&-1\\3&2&1\end{pmatrix}$.

• **Quadrada** ($n\times n$): diagonal principal $a_{11},a_{22},\dots$
• **Diagonal**: zeros fora da diagonal. **Identidade** $I_n$: diagonal de 1.
• **Triangular** superior/inferior: zeros abaixo/acima da diagonal.
• **Transposta** $A^T$: troca linhas por colunas, $(A^T)_{ij}=a_{ji}$.
• **Simétrica**: $A^T=A$. **Antissimétrica**: $A^T=-A$ (diagonal nula).`,
            },
          ],
          exercises: [
            gen((rng) => {
              const p = randInt(rng, 1, 3), q = randInt(rng, 1, 3);
              const i = randInt(rng, 1, 3), j = randInt(rng, 1, 3);
              return num(t`Se $a_{ij}=${p}i-${q}j$, quanto vale $a_{${i}${j}}$?`, p * i - q * j, t`$${p}\cdot${i}-${q}\cdot${j}=${p * i - q * j}$.`);
            }),
            gen((rng) => {
              const i = randInt(rng, 1, 4), j = randInt(rng, 1, 4);
              const A = rnd(rng, 4, 4);
              return num(t`Em $A=${tex(A)}$, quanto vale $a_{${i}${j}}$?`, A[i - 1][j - 1], t`Linha ${i}, coluna ${j}: $${A[i - 1][j - 1]}$.`);
            }),
            gen((rng) => {
              const A = rnd(rng, 2, 3);
              const i = randInt(rng, 1, 3), j = randInt(rng, 1, 2);
              return num(t`Se $A=${tex(A)}$, quanto vale o elemento $(A^T)_{${i}${j}}$?`, A[j - 1][i - 1], t`$(A^T)_{${i}${j}}=a_{${j}${i}}=${A[j - 1][i - 1]}$.`);
            }),
            match('Associe o tipo à característica.', [['identidade', '1 na diagonal, 0 fora'], ['triangular superior', 'zeros abaixo da diagonal'], ['simétrica', 'Aᵀ = A'], ['antissimétrica', 'Aᵀ = −A']], 'São os tipos mais comuns de matrizes quadradas.'),
            tf('Toda matriz antissimétrica tem diagonal principal nula.', true, 'aᵢᵢ = −aᵢᵢ ⇒ aᵢᵢ = 0.'),
            gen((rng) => {
              const x = randInt(rng, -6, 6);
              const y = randInt(rng, -6, 6);
              const c = y - x;
              const a21 = c === 0 ? 'y' : c > 0 ? `y-${c}` : `y+${-c}`;
              return num(t`Para que $\begin{pmatrix}1&${x}\\${a21}&2\end{pmatrix}$ seja simétrica, quanto vale $y$?`, y, t`Simétrica: $a_{12}=a_{21}\Rightarrow ${x}=${a21}\Rightarrow y=${y}$.`);
            }),
            gen((rng) => {
              const m = randInt(rng, 2, 5), n = randInt(rng, 2, 5);
              return num(`Quantos elementos tem uma matriz ${m} × ${n}?`, m * n, `${m} linhas × ${n} colunas = ${m * n}.`);
            }),
            mcqS(t`A transposta de $\begin{pmatrix}1&2&3\\4&5&6\end{pmatrix}$ tem ordem:`, '3 × 2', ['2 × 3', '3 × 3', '2 × 2'], 'Linhas viram colunas.'),
          ],
        },
        {
          card: {
            title: 'Produto: linha × coluna',
            body: t`$A_{m\times n}\cdot B_{n\times p}=C_{m\times p}$ com $c_{ij}=\sum_k a_{ik}b_{kj}$ (linha $i$ de $A$ "vezes" coluna $j$ de $B$). Só existe se o número de **colunas de A** = número de **linhas de B**.

Propriedades: associativo, distributivo, $AI=IA=A$, mas em geral $AB\ne BA$ e $AB=0$ **não** implica $A=0$ ou $B=0$. Transposta do produto: $(AB)^T=B^TA^T$.

Visualmente, uma matriz $2\times2$ transforma o plano; o produto $AB$ é "aplicar $B$, depois $A$".`,
            visual: matrixLab([1, 1, 0, 1]),
          },
          exercises: [
            gen((rng) => {
              const A = rnd(rng, 2, 2), B = rnd(rng, 2, 2);
              const P = mul(A, B);
              const i = randInt(rng, 0, 1), j = randInt(rng, 0, 1);
              return num(t`$A=${tex(A)}$, $B=${tex(B)}$. Quanto vale o elemento $(AB)_{${i + 1}${j + 1}}$?`, P[i][j], t`Linha ${i + 1} de A · coluna ${j + 1} de B: $${A[i][0]}\cdot ${par(B[0][j])}+${par(A[i][1])}\cdot ${par(B[1][j])}=${P[i][j]}$.`);
            }),
            gen((rng) => {
              // three different sizes, otherwise options like "3 × 3" coincide
              const [m, n, p] = shuffle(rng, [2, 3, 4, 5, 6]);
              return rmcq(rng, `A é ${m} × ${n} e B é ${n} × ${p}. A ordem de AB é:`, `${m} × ${p}`, [`${n} × ${n}`, `${m} × ${n}`, `${n} × ${p}`, `${p} × ${m}`], 'Fica o número de linhas de A e de colunas de B.');
            }),
            mcqS('A é 2 × 3 e B é 2 × 3. Qual produto existe?', 'A·Bᵀ', ['A·B', 'B·A', 'nenhum'], 'A (2 × 3) · Bᵀ (3 × 2) = 2 × 2. AB não existe: 3 ≠ 2.'),
            tf(t`Para quaisquer matrizes quadradas, $(A+B)^2=A^2+2AB+B^2$.`, false, t`$(A+B)^2=A^2+AB+BA+B^2$, e $AB\ne BA$ em geral.`),
            gen((rng) => {
              const A = rnd(rng, 2, 2, -3, 3), B = rnd(rng, 2, 2, -3, 3);
              const AB = mul(A, B), BA = mul(B, A);
              const same = AB.flat().every((x, i) => x === BA.flat()[i]);
              return tf(t`Com $A=${tex(A)}$ e $B=${tex(B)}$, temos $AB=BA$.`, same, t`$AB=${tex(AB)}$ e $BA=${tex(BA)}$.`);
            }),
            inter(t`Ajuste a matriz para uma rotação de $90^\circ$ (anti-horária): $\begin{pmatrix}0&-1\\1&0\end{pmatrix}$.`, 'plot', matrixLab([1, 0, 0, 1]).props, (v) => near(v.p.a, 0, 0.05) && near(v.p.b, -1, 0.05) && near(v.p.c, 1, 0.05) && near(v.p.d, 0, 0.05), 'a = 0, b = −1, c = 1, d = 0', 'As colunas são as imagens de î e ĵ: î vai para (0, 1) e ĵ para (−1, 0).'),
            gen((rng) => {
              const k = randNZ(rng, -3, 3);
              const n = randInt(rng, 2, 6);
              return num(t`Para $A=\begin{pmatrix}1&${k}\\0&1\end{pmatrix}$, temos $A^{${n}}=\begin{pmatrix}1&x\\0&1\end{pmatrix}$. Quanto vale $x$?`, n * k, t`Cada multiplicação soma $${k}$ no canto: $x=${n}\cdot${k}=${n * k}$ (cisalhamentos se acumulam).`);
            }),
            mcqS(t`$(AB)^T$ é igual a:`, t`$B^TA^T$`, [t`$A^TB^T$`, t`$AB$`, t`$(BA)$`], 'A ordem inverte, como tirar meias e sapatos.'),
          ],
        },
      ],
    },
    {
      id: 'f-mat-det',
      title: 'Determinantes: regras e propriedades',
      parts: [
        {
          card: {
            title: 'Determinante como área',
            body: t`$$\det\begin{pmatrix}a&b\\c&d\end{pmatrix}=ad-bc$$
É a **área com sinal** do paralelogramo formado pelas colunas: positivo se a orientação se mantém, negativo se inverte, zero se as colunas são paralelas.

Em $3\times3$, **Sarrus**: repita as duas primeiras colunas, some os produtos das três diagonais "descendo" e subtraia os das três "subindo". É o volume com sinal do paralelepípedo das colunas.`,
            visual: detLab(),
          },
          exercises: [
            gen((rng) => {
              const A = rnd(rng, 2, 2, -6, 7);
              return num(t`Calcule $${vtex(A)}$.`, det2(A), t`$${A[0][0]}\cdot${A[1][1]}-(${A[0][1]})\cdot(${A[1][0]})=${det2(A)}$.`);
            }),
            gen((rng) => {
              const A = rnd(rng, 3, 3, -3, 4);
              return num(t`Calcule por Sarrus: $${vtex(A)}$.`, det3(A), t`Descendo menos subindo: $${det3(A)}$.`);
            }),
            inter('Arraste as colunas para que o determinante seja exatamente −4.', 'plot', detLab().props, (v) => near(v.pts.u.x * v.pts.v.y - v.pts.u.y * v.pts.v.x, -4, 0.01), 'ex.: col 1 = (2, 0) e col 2 = (0, −2)', 'Área 4 com orientação invertida (col 2 no sentido horário da col 1).'),
            gen((rng) => {
              const a = randNZ(rng, -4, 4), d = randInt(rng, -5, 5);
              const x = randInt(rng, -6, 6);
              return num(t`Para que valor de $x$ temos $\begin{vmatrix}${a}&x\\2&${d}\end{vmatrix}=${a * d - 2 * x}$?`, x, t`$${a}\cdot${d}-2x=${a * d - 2 * x}\Rightarrow x=${x}$.`);
            }),
            gen((rng) => {
              const a = randInt(rng, 1, 5), b = randInt(rng, 1, 5), c = randInt(rng, 1, 5);
              const x = randInt(rng, -4, 4), y = randInt(rng, -4, 4), z = randInt(rng, -4, 4);
              return num(t`Determinante da matriz triangular $\begin{pmatrix}${a}&${x}&${y}\\0&${b}&${z}\\0&0&${c}\end{pmatrix}$:`, a * b * c, t`Triangular: produto da diagonal $=${a}\cdot${b}\cdot${c}=${a * b * c}$.`);
            }),
            tf('Se as colunas de uma matriz 2 × 2 são vetores paralelos, o determinante é zero.', true, 'O paralelogramo fica achatado: área zero.'),
            mcqS(t`O determinante de $\begin{pmatrix}\cos\theta&-\operatorname{sen}\theta\\\operatorname{sen}\theta&\cos\theta\end{pmatrix}$ vale:`, '1', ['0', '−1', t`$\cos 2\theta$`], t`$\cos^2\theta+\operatorname{sen}^2\theta=1$: rotações preservam área e orientação.`),
            gen((rng) => {
              const [a, b] = [randInt(rng, 1, 5), randInt(rng, 1, 5)];
              const [c, d] = [randInt(rng, -4, 4), randInt(rng, 1, 5)];
              return num(t`Área do triângulo de vértices $(0,\,0)$, $(${a},\,${c})$ e $(${b},\,${d})$ (metade do |det|):`, Math.abs(a * d - b * c) / 2, t`$\frac12\left|${a}\cdot ${par(d)}-${par(b)}\cdot ${par(c)}\right|=${fmt(Math.abs(a * d - b * c) / 2, 1)}$.`);
            }),
          ],
        },
        {
          card: {
            title: 'Propriedades (economizam contas)',
            body: t`• Linha (ou coluna) **nula** ⇒ $\det=0$.
• Duas linhas **iguais** ou **proporcionais** ⇒ $\det=0$.
• **Trocar** duas linhas troca o sinal.
• Multiplicar **uma** linha por $k$ multiplica o det por $k$; logo $\det(kA)=k^n\det A$ ($A$ de ordem $n$).
• Somar a uma linha um múltiplo de outra **não muda** o det (base do escalonamento).
• $\det A^T=\det A$; $\det(AB)=\det A\cdot\det B$ (Binet).`,
            tip: 'Para calcular det de matrizes grandes, escalone até ficar triangular, contando as trocas de linha.',
          },
          exercises: [
            gen((rng) => {
              const d = randNZ(rng, -6, 6);
              const k = randInt(rng, 2, 3);
              const n = randInt(rng, 2, 4);
              return num(`A matriz A de ordem ${n} tem det A = ${d}. Quanto vale det(${k}A)?`, k ** n * d, `det(kA) = kⁿ det A = ${k}^${n}·${d} = ${k ** n * d}.`);
            }),
            gen((rng) => {
              const a = randNZ(rng, -5, 5), b = randNZ(rng, -5, 5);
              return num(`det A = ${a} e det B = ${b} (mesma ordem). Quanto vale det(AB)?`, a * b, `Binet: ${a}·${b} = ${a * b}.`);
            }),
            gen((rng) => {
              const d = randNZ(rng, -9, 9);
              return num(`det A = ${d}. Trocando a 1ª e a 3ª linhas, qual o novo determinante?`, -d, 'Uma troca de linhas inverte o sinal.');
            }),
            gen((rng) => {
              const r1 = [randInt(rng, -4, 4), randInt(rng, -4, 4), randInt(rng, -4, 4)];
              const k = randNZ(rng, -3, 3);
              const r3 = [randInt(rng, -4, 4), randInt(rng, -4, 4), randInt(rng, -4, 4)];
              return num(t`Quanto vale $${vtex([r1, r1.map((x) => k * x), r3])}$?`, 0, `A 2ª linha é ${k} vezes a 1ª: linhas proporcionais ⇒ det = 0.`);
            }),
            multi('Quais operações NÃO alteram o determinante?', ['somar à linha 2 o triplo da linha 1', 'transpor a matriz', 'trocar duas colunas', 'multiplicar uma linha por −1', 'somar à coluna 3 a coluna 1'], [0, 1, 4], 'Trocar colunas e multiplicar por −1 trocam o sinal.'),
            gen((rng) => {
              const d = randNZ(rng, -5, 5);
              return num(`det A = ${d}, A de ordem 3. Quanto vale det(Aᵀ)?`, d, 'det Aᵀ = det A.');
            }),
            tf(t`$\det(A+B)=\det A+\det B$ para quaisquer matrizes quadradas.`, false, t`Falso em geral: com $A=B=I_2$, $\det(2I)=4\ne1+1$.`),
            fill('Complete as propriedades.', 'det(kA) = ___ · det A (A de ordem n) ; det(A·B) = ___', ['kⁿ', 'det A · det B'], ['k', 'nk', 'det A + det B'], 'Cada uma das n linhas leva um fator k; Binet para o produto.'),
          ],
        },
        {
          card: {
            title: 'Expansão de Laplace',
            body: t`O **cofator** de $a_{ij}$ é $A_{ij}=(-1)^{i+j}D_{ij}$, onde $D_{ij}$ é o determinante sem a linha $i$ e a coluna $j$. Então, por **qualquer** linha (ou coluna):
$$\det A=\sum_j a_{ij}A_{ij}$$
Escolha a linha/coluna com **mais zeros**: os termos com $a_{ij}=0$ somem. Os sinais seguem o tabuleiro $\begin{smallmatrix}+&-&+\\-&+&-\\+&-&+\end{smallmatrix}$.`,
            visual: table(['', 'c1', 'c2', 'c3', 'c4'], [['L1', 2, 0, 1, 3], ['L2', 0, 0, 5, 0], ['L3', 1, 4, 2, 1], ['L4', 0, 0, 3, 2]], [1]),
            example: t`Na matriz acima, a linha 2 tem um só elemento não nulo: $\det=5\cdot(-1)^{2+3}D_{23}$. Só falta um $3\times3$.`,
          },
          exercises: [
            gen((rng) => {
              const i = randInt(rng, 1, 4), j = randInt(rng, 1, 4);
              return num(`Sinal (+1 ou −1) do cofator na posição (${i}, ${j}):`, (-1) ** (i + j), `(−1)^(${i}+${j}) = ${(-1) ** (i + j)}.`);
            }),
            gen((rng) => {
              const A = rnd(rng, 3, 3, -3, 4);
              const i = randInt(rng, 0, 2), j = randInt(rng, 0, 2);
              const minor = A.filter((_, r) => r !== i).map((r) => r.filter((_, c) => c !== j));
              const cof = (-1) ** (i + j) * det2(minor);
              return num(t`Em $A=${tex(A)}$, qual o cofator $A_{${i + 1}${j + 1}}$?`, cof, t`$(-1)^{${i + j + 2}}\cdot${vtex(minor)}=${cof}$.`);
            }),
            gen((rng) => {
              const a = randNZ(rng, -4, 4);
              const B = rnd(rng, 3, 3, -3, 3);
              const x = [randInt(rng, -3, 3), randInt(rng, -3, 3), randInt(rng, -3, 3)];
              const M4: M = [[a, x[0], x[1], x[2]], [0, ...B[0]], [0, ...B[1]], [0, ...B[2]]];
              return num(t`Use Laplace pela 1ª coluna: $${vtex(M4)}$.`, a * det3(B), t`Só sobra $${a}\cdot(+1)\cdot D_{11}=${a}\cdot${det3(B)}=${a * det3(B)}$.`);
            }),
            order('Ordene a estratégia para um determinante 4 × 4.', ['Procure a linha ou coluna com mais zeros', 'Se preciso, crie zeros somando múltiplos de outra linha', 'Expanda por Laplace nessa linha', 'Calcule os 3 × 3 restantes (Sarrus)'], 'Zeros primeiro: cada zero elimina um determinante 3 × 3.'),
            mcqS('Quantos determinantes 3 × 3 aparecem na expansão de Laplace de um 4 × 4 sem zeros?', '4', ['3', '12', '16'], 'Um por elemento da linha escolhida.'),
            gen((rng) => {
              const d = [randNZ(rng, -3, 3), randNZ(rng, -3, 3), randNZ(rng, -3, 3), randNZ(rng, -3, 3)];
              const M4: M = [[d[0], 0, 0, 0], [randInt(rng, -3, 3), d[1], 0, 0], [randInt(rng, -3, 3), randInt(rng, -3, 3), d[2], 0], [randInt(rng, -3, 3), randInt(rng, -3, 3), randInt(rng, -3, 3), d[3]]];
              return num(t`Calcule $${vtex(M4)}$.`, d[0] * d[1] * d[2] * d[3], 'Triangular inferior: produto da diagonal.');
            }),
            tf('A expansão de Laplace dá o mesmo resultado qualquer que seja a linha ou coluna escolhida.', true, 'É um teorema: o det é único; só a quantidade de contas muda.'),
          ],
        },
      ],
    },
    {
      id: 'f-mat-inv',
      title: 'Matriz inversa e forma matricial de sistemas',
      parts: [
        {
          card: {
            title: 'A inversa',
            body: t`$A^{-1}$ é a matriz com $AA^{-1}=A^{-1}A=I$. Ela existe **se e somente se** $\det A\ne0$ (uma transformação que achata o plano não pode ser desfeita). Em $2\times2$:
$$\begin{pmatrix}a&b\\c&d\end{pmatrix}^{-1}=\frac{1}{ad-bc}\begin{pmatrix}d&-b\\-c&a\end{pmatrix}$$
Propriedades: $(AB)^{-1}=B^{-1}A^{-1}$, $(A^T)^{-1}=(A^{-1})^T$, $\det(A^{-1})=\frac{1}{\det A}$.`,
            tip: 'Para 3 × 3: escalone [A | I] até virar [I | A⁻¹], ou use A⁻¹ = adj(A)/det A (transposta da matriz dos cofatores).',
          },
          exercises: [
            gen((rng) => {
              const A = unimod(rng);
              const d = det2(A);
              const inv = [[A[1][1] / d, -A[0][1] / d], [-A[1][0] / d, A[0][0] / d]];
              const i = randInt(rng, 0, 1), j = randInt(rng, 0, 1);
              return num(t`$A=${tex(A)}$ (det $=${d}$). Quanto vale o elemento $(A^{-1})_{${i + 1}${j + 1}}$?`, inv[i][j], t`$A^{-1}=\frac{1}{${d}}${tex([[A[1][1], -A[0][1]], [-A[1][0], A[0][0]]])}=${tex(inv)}$.`);
            }),
            gen((rng) => {
              const a = randInt(rng, 1, 6);
              const b = randInt(rng, 1, 6);
              const k = randInt(rng, 2, 4);
              return num(t`Para que valor de $x$ a matriz $\begin{pmatrix}${a}&${b}\\${a * k}&x\end{pmatrix}$ NÃO é inversível?`, b * k, t`$\det=${a}x-${a * b * k}=0\Rightarrow x=${b * k}$ (linhas proporcionais).`);
            }),
            gen((rng) => {
              const d = pick(rng, [2, 4, 5, -2, -4, 8, 10]);
              return num(`det A = ${d}. Quanto vale det(A⁻¹)?`, 1 / d, `det(A⁻¹) = 1/det A = 1/${d} = ${fmt(1 / d, 3)}.`, { tol: 0.001 });
            }),
            mcqS(t`$(AB)^{-1}$ é igual a:`, t`$B^{-1}A^{-1}$`, [t`$A^{-1}B^{-1}$`, t`$\frac{1}{AB}$`, t`$BA$`], 'Desfaz-se na ordem inversa: primeiro B, depois A... ao contrário!'),
            tf('Toda matriz quadrada não nula é inversível.', false, t`$\begin{pmatrix}1&2\\2&4\end{pmatrix}$ é não nula e tem det 0.`),
            inter('Ajuste a matriz para que ela NÃO seja inversível (ad − bc = 0), sem ser a matriz nula.', 'plot', matrixLab([1, 1, 0, 1]).props, (v) => near(v.p.a * v.p.d - v.p.b * v.p.c, 0, 0.011) && Math.abs(v.p.a) + Math.abs(v.p.b) + Math.abs(v.p.c) + Math.abs(v.p.d) > 0.1, 'ex.: a = 1, b = 2, c = 1, d = 2', 'O plano inteiro é achatado numa reta: não há como voltar.'),
            gen((rng) => {
              const A = unimod(rng);
              return num(t`Verifique: $A=${tex(A)}$. Quanto vale $\det A$?`, det2(A), `${A[0][0]}·${A[1][1]} − ${A[0][1]}·${A[1][0]} = ${det2(A)}; como det = ±1, a inversa tem entradas inteiras.`);
            }),
            order('Ordene o cálculo da inversa de uma matriz 2 × 2.', ['Calcule det A e confira que é ≠ 0', 'Troque de lugar os elementos da diagonal principal', 'Troque o sinal dos elementos da outra diagonal', 'Divida tudo por det A'], 'É a fórmula da adjunta para 2 × 2.'),
          ],
        },
        {
          card: {
            title: 'Sistemas na forma AX = B',
            body: t`O sistema $\begin{cases}ax+by=e\\cx+dy=f\end{cases}$ é $AX=B$ com $A=\begin{pmatrix}a&b\\c&d\end{pmatrix}$, $X=\begin{pmatrix}x\\y\end{pmatrix}$, $B=\begin{pmatrix}e\\f\end{pmatrix}$.

Se $\det A\ne0$: $X=A^{-1}B$ — solução **única** (SPD). Se $\det A=0$: ou infinitas soluções (SPI) ou nenhuma (SI).

**Cramer**: $x=\frac{\det A_x}{\det A}$, $y=\frac{\det A_y}{\det A}$, onde $A_x$ troca a coluna de $x$ por $B$.`,
          },
          exercises: [
            gen((rng) => {
              const A = unimod(rng);
              const X = [randInt(rng, -5, 5), randInt(rng, -5, 5)];
              const B = [A[0][0] * X[0] + A[0][1] * X[1], A[1][0] * X[0] + A[1][1] * X[1]];
              return num(t`Resolva $${tex(A)}\begin{pmatrix}x\\y\end{pmatrix}=\begin{pmatrix}${B[0]}\\${B[1]}\end{pmatrix}$. Quanto vale $x$?`, X[0], t`$X=A^{-1}B$; ou Cramer: $x=\frac{${B[0] * A[1][1] - A[0][1] * B[1]}}{${det2(A)}}=${X[0]}$.`);
            }),
            gen((rng) => {
              let A = rnd(rng, 2, 2, -5, 6);
              while (det2(A) === 0) A = rnd(rng, 2, 2, -5, 6);
              const X = [randInt(rng, -4, 4), randInt(rng, -4, 4)];
              const B = [A[0][0] * X[0] + A[0][1] * X[1], A[1][0] * X[0] + A[1][1] * X[1]];
              const dy = A[0][0] * B[1] - B[0] * A[1][0];
              return num(t`Por Cramer, resolva $\begin{cases}${A[0][0]}x+(${A[0][1]})y=${B[0]}\\${A[1][0]}x+(${A[1][1]})y=${B[1]}\end{cases}$. Quanto vale $y$?`, X[1], t`$\det A=${det2(A)}$, $\det A_y=${dy}$; $y=${dy}/${det2(A)}=${X[1]}$.`);
            }),
            gen((rng) => {
              const a = randInt(rng, 1, 5), b = randInt(rng, 1, 5), k = randInt(rng, 2, 4);
              return rmcq(rng, t`Para quais $m$ o sistema $\begin{cases}${a}x+${b}y=1\\${a * k}x+my=2\end{cases}$ tem solução única?`, t`$m\ne ${b * k}$`, [t`$m=${b * k}$`, t`$m\ne ${a * k}$`, 'qualquer m', t`$m=0$`], t`Solução única ⇔ $\det=${a}m-${a * b * k}\ne0\Leftrightarrow m\ne${b * k}$.`);
            }),
            match('Associe a classificação ao que acontece.', [['det A ≠ 0', 'SPD: uma única solução'], ['det A = 0 e equações compatíveis', 'SPI: infinitas soluções'], ['det A = 0 e equações contraditórias', 'SI: nenhuma solução']], 'No plano: retas concorrentes, coincidentes ou paralelas distintas.'),
            tf(t`Se $\det A=0$, o sistema $AX=0$ (homogêneo) tem infinitas soluções.`, true, 'Homogêneo sempre tem a solução nula; com det 0 ela não é única, logo há infinitas.'),
            gen((rng) => {
              const k = randInt(rng, 2, 5);
              return rmcq(rng, t`O sistema $\begin{cases}x+2y=3\\${k}x+${2 * k}y=${3 * k + 1}\end{cases}$ é:`, 'impossível (SI)', ['possível e determinado (SPD)', 'possível e indeterminado (SPI)', 'homogêneo'], `A 2ª equação tem o lado esquerdo ${k} vezes o da 1ª, mas o direito não (${3 * k + 1} ≠ ${3 * k}): retas paralelas.`);
            }),
            mcqS('Um circuito com 3 malhas gera um sistema 3 × 3 com det A = 0. O que isso indica?', 'as equações não são independentes (falta informação ou há contradição)', ['as correntes são todas nulas', 'o circuito tem solução única', 'houve erro de sinal, pois det nunca é 0'], 'det A = 0 ⇔ linhas dependentes: uma equação é combinação das outras.'),
          ],
        },
      ],
    },
  ],
};

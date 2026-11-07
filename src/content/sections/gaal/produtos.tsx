import type { UnitDef } from '../../types';
import { gen, mcq, mcqS, num, tf, inter, rmcq, near } from '../../helpers';
import { fmt, pick, randInt, randNZ, term } from '../../../lib/random';
import { cross3DLab, vectorLab } from '../../visuals';

const t = String.raw;
const V3 = (a: number[]) => t`(${a[0]},\,${a[1]},\,${a[2]})`;
const dot = (a: number[], b: number[]) => a.reduce((s, v, i) => s + v * b[i], 0);
const cross = (a: number[], b: number[]) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];

const r3 = (rng: () => number, lo: number, hi: number) => [randInt(rng, lo, hi), randInt(rng, lo, hi), randInt(rng, lo, hi)];
const cosOf = (ang: number) => Math.round(Math.cos((ang * Math.PI) / 180) * 1e9) / 1e9;
const sinOf = (ang: number) => Math.round(Math.sin((ang * Math.PI) / 180) * 1e9) / 1e9;

export const escalar: UnitDef = {
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
      parts: [
        {
          card: {
            title: 'Definição algébrica',
            body: t`Multiplique coordenada com coordenada e **some**:

$$\vec u\cdot\vec v=x_1x_2+y_1y_2\,(+z_1z_2)$$

O resultado é um **número**, não um vetor. Em particular, $\vec v\cdot\vec v=|\vec v|^2$.`,
            tip: t`Não confunda **produto escalar** ($\vec u\cdot\vec v$, dá número) com **produto por escalar** ($k\vec v$, dá vetor).`,
          },
          exercises: [
            mcq(t`O resultado de $\vec u\cdot\vec v$ é…`, ['um número', 'um vetor', 'uma matriz', 'um ângulo'], 0, t`Soma de produtos de coordenadas: um número real.`),
            gen((rng) => {
              const a = [randInt(rng, -5, 5), randInt(rng, -5, 5)];
              const b = [randInt(rng, -5, 5), randInt(rng, -5, 5)];
              return num(t`Calcule $(${a[0]},\,${a[1]})\cdot(${b[0]},\,${b[1]})$.`, a[0] * b[0] + a[1] * b[1], t`$${a[0]}\cdot${b[0]}+(${a[1]})\cdot(${b[1]})=${a[0] * b[0] + a[1] * b[1]}$.`);
            }),
            gen((rng) => {
              const a = r3(rng, -5, 5);
              const b = r3(rng, -5, 5);
              return num(t`Calcule $${V3(a)}\cdot${V3(b)}$.`, dot(a, b), t`$${a[0] * b[0]}+(${a[1] * b[1]})+(${a[2] * b[2]})=${dot(a, b)}$.`);
            }),
            tf(t`$\vec u\cdot\vec v=\vec v\cdot\vec u$`, true, t`A multiplicação de números é comutativa em cada coordenada.`),
            num(t`Se $|\vec v|=7$, quanto vale $\vec v\cdot\vec v$?`, 49, t`$\vec v\cdot\vec v=|\vec v|^2=49$.`),
            mcq(t`Quanto vale $\vec i\cdot\vec j$?`, ['$0$', '$1$', '$\\vec k$', '$-1$'], 0, t`$(1,\,0,\,0)\cdot(0,\,1,\,0)=0$.`),
            gen((rng) => {
              const a = r3(rng, -3, 3);
              const b = r3(rng, -3, 3);
              const c = r3(rng, -3, 3);
              const s = b.map((v, i) => v + c[i]);
              return num(t`Sendo $\vec u=${V3(a)}$, $\vec v=${V3(b)}$ e $\vec w=${V3(c)}$, calcule $\vec u\cdot(\vec v+\vec w)$.`, dot(a, s), t`$\vec v+\vec w=${V3(s)}$; produto com $\vec u$: $${dot(a, s)}$ (o mesmo que $\vec u\cdot\vec v+\vec u\cdot\vec w=${dot(a, b)}+(${dot(a, c)})$).`);
            }),
          ],
        },
        {
          card: {
            title: 'Definição geométrica',
            body: t`$$\vec u\cdot\vec v=|\vec u|\,|\vec v|\cos\theta$$

Mexa nos vetores e veja o sinal: **positivo** (ângulo agudo), **zero** (reto), **negativo** (obtuso).`,
            visual: vectorLab('dot', { snap: 0.5 }),
          },
          exercises: [
            mcqS(t`Se $\vec u\cdot\vec v<0$, o ângulo entre eles é:`, 'obtuso', ['agudo', 'reto', 'nulo'], t`$\cos\theta<0$ para $90^\circ<\theta\le180^\circ$.`),
            gen((rng) => {
              const m1 = randInt(rng, 2, 6);
              const m2 = randInt(rng, 2, 6);
              const ang = pick(rng, [60, 90, 120, 0, 180]);
              return num(t`$|\vec u|=${m1}$, $|\vec v|=${m2}$ e o ângulo entre eles é $${ang}^\circ$. Quanto vale $\vec u\cdot\vec v$?`, m1 * m2 * cosOf(ang), t`$${m1}\cdot${m2}\cdot\cos${ang}^\circ=${fmt(m1 * m2 * cosOf(ang))}$.`);
            }),
            tf(t`Se dois vetores não nulos são perpendiculares, o produto escalar deles é zero.`, true, t`$\cos90^\circ=0$.`),
            inter(t`Arraste os vetores para que o produto escalar seja **negativo**.`, 'plot', vectorLab('dot', { snap: 0.5 }).props, (v: any) => v && v.pts.u.x * v.pts.v.x + v.pts.u.y * v.pts.v.y < -1e-9, t`ângulo obtuso entre eles`, t`$\vec u\cdot\vec v=|\vec u||\vec v|\cos\theta<0\iff\cos\theta<0\iff\theta>90^\circ$: ângulo obtuso.`),
            mcq(t`Para vetores de módulos fixos, o produto escalar é **máximo** quando o ângulo é…`, ['$0^\\circ$', '$90^\\circ$', '$180^\\circ$', '$45^\\circ$'], 0, t`$\cos0^\circ=1$ é o maior valor do cosseno.`),
            gen((rng) => {
              const m1 = randInt(rng, 2, 6);
              const m2 = randInt(rng, 2, 6);
              return num(t`Vetores de módulos $${m1}$ e $${m2}$ com o **mesmo sentido** têm produto escalar igual a:`, m1 * m2, t`$\theta=0^\circ$: $${m1}\cdot${m2}\cdot1=${m1 * m2}$.`);
            }),
            num(t`Sabendo que $|\vec u|=3$, $|\vec v|=4$ e $\vec u\cdot\vec v=6$, calcule $|\vec u+\vec v|^2$.`, 37, t`$|\vec u+\vec v|^2=|\vec u|^2+2\,\vec u\cdot\vec v+|\vec v|^2=9+12+16=37$.`),
          ],
        },
      ],
    },
    {
      id: 'g-esc-ang',
      title: 'Ângulo e ortogonalidade',
      parts: [
        {
          card: {
            title: 'Calculando ângulos',
            body: t`Isolando o cosseno na definição geométrica:

$$\cos\theta=\frac{\vec u\cdot\vec v}{|\vec u|\,|\vec v|}$$`,
            example: t`$\vec u=(1,\,1,\,0)$, $\vec v=(0,\,1,\,1)$: $\cos\theta=\frac{1}{\sqrt2\sqrt2}=\frac12\Rightarrow\theta=60^\circ$.`,
          },
          exercises: [
            num(t`Calcule o ângulo (em graus) entre $(1,\,0)$ e $(1,\,1)$.`, 45, t`$\cos\theta=\frac{1}{1\cdot\sqrt2}=\frac{\sqrt2}{2}$.`, { unit: '°' }),
            num(t`Calcule o ângulo (em graus) entre $(1,\,1,\,0)$ e $(0,\,1,\,1)$.`, 60, t`$\cos\theta=\frac12$.`, { unit: '°' }),
            gen((rng) => {
              const [a, b, ang] = pick(rng, [[[1, 0], [0, 3], 90], [[2, 0], [-1, 0], 180], [[1, 1], [2, 2], 0], [[1, 0], [-1, 1], 135], [[0, 2], [1, 1], 45]] as const);
              return num(t`Qual o ângulo (em graus) entre $(${a[0]},\,${a[1]})$ e $(${b[0]},\,${b[1]})$?`, ang, t`$\cos\theta=\frac{${a[0] * b[0] + a[1] * b[1]}}{${fmt(Math.hypot(a[0], a[1]), 3)}\cdot${fmt(Math.hypot(b[0], b[1]), 3)}}$, que dá $${ang}^\circ$.`, { unit: '°' });
            }),
            inter(t`Arraste os vetores para formarem $135^\circ$.`, 'plot', vectorLab('dot', { snap: 0.5 }).props, (v: any) => {
              if (!v) return false;
              const { u, v: w } = v.pts;
              const c = (u.x * w.x + u.y * w.y) / (Math.hypot(u.x, u.y) * Math.hypot(w.x, w.y) || 1);
              return Math.abs((Math.acos(Math.max(-1, Math.min(1, c))) * 180) / Math.PI - 135) < 1;
            }, t`ex.: $(1,\,0)$ e $(-1,\,1)$`, t`$\cos\theta=\frac{\vec u\cdot\vec v}{|\vec u||\vec v|}$: com $(1,\,0)$ e $(-1,\,1)$, $\cos\theta=\frac{-1}{\sqrt2}\Rightarrow\theta=135^\circ$.`),
            gen((rng) => {
              const [a, b, c] = pick(rng, [[3, 4, 5], [6, 8, 10], [5, 12, 13]] as const);
              return num(t`Qual o cosseno do ângulo entre $(${a},\,${b})$ e $(1,\,0)$? (decimal)`, a / c, t`$\frac{${a}}{${c}\cdot1}=${fmt(a / c, 4)}$.`, { tol: 0.002 });
            }),
            mcq(t`Se $\cos\theta=-1$, os vetores são…`, ['de mesma direção e sentidos opostos', 'perpendiculares', 'iguais', 'unitários'], 0, t`$\theta=180^\circ$.`),
            num(t`$|\vec u|=2$, $|\vec v|=5$ e $\vec u\cdot\vec v=5$. Qual o ângulo entre eles, em graus?`, 60, t`$\cos\theta=\frac{5}{10}=\frac12\Rightarrow60^\circ$.`, { unit: '°' }),
          ],
        },
        {
          card: {
            title: 'Ortogonalidade e cossenos diretores',
            body: t`**Ortogonais** ⟺ $\vec u\cdot\vec v=0$.

**Cossenos diretores** de $\vec v=(x,\,y,\,z)$ (ângulos com os eixos):
$$\cos\alpha=\frac{x}{|\vec v|},\quad\cos\beta=\frac{y}{|\vec v|},\quad\cos\gamma=\frac{z}{|\vec v|}$$
com $\cos^2\alpha+\cos^2\beta+\cos^2\gamma=1$.`,
          },
          exercises: [
            tf(t`Os vetores $\vec i$, $\vec j$ e $\vec k$ são dois a dois ortogonais.`, true, t`Todos os produtos escalares entre eles dão zero.`),
            gen((rng) => {
              const a = [randNZ(rng, -4, 4), randNZ(rng, -4, 4)];
              const ort = rng() < 0.5;
              const b = ort ? [-a[1], a[0]] : [a[1], a[0] + 1];
              return tf(t`$(${a[0]},\,${a[1]})$ e $(${b[0]},\,${b[1]})$ são ortogonais.`, a[0] * b[0] + a[1] * b[1] === 0, t`O produto escalar dá $${a[0] * b[0] + a[1] * b[1]}$.`);
            }),
            gen((rng) => {
              const a = randNZ(rng, -4, 4);
              const k = randInt(rng, -3, 3);
              const b = randInt(rng, -4, 4);
              const c = -a * k - b;
              return num(t`Para que $(${a},\,${b},\,${c})\perp(m,\,1,\,1)$, quanto vale $m$?`, k, t`$${a}m+${b}+(${c})=0\Rightarrow m=${k}$.`);
            }),
            mcq(t`Qual vetor é ortogonal a $(2,\,3)$?`, ['$(-3,\\,2)$', '$(3,\\,2)$', '$(2,\\,-3)$', '$(4,\\,6)$'], 0, t`$2\cdot(-3)+3\cdot2=0$.`),
            gen((rng) => {
              const [x, y, z, m] = pick(rng, [[1, 2, 2, 3], [2, 3, 6, 7], [2, 6, 9, 11]] as const);
              return num(t`Qual o $\cos\gamma$ (ângulo com o eixo $z$) de $\vec v=(${x},\,${y},\,${z})$? (fração ou decimal)`, z / m, t`$|\vec v|=${m}$ e $\cos\gamma=\frac{${z}}{${m}}$.`, { tol: 0.002 });
            }),
            tf(t`Para qualquer vetor não nulo, $\cos^2\alpha+\cos^2\beta+\cos^2\gamma=1$.`, true, t`$\frac{x^2+y^2+z^2}{|\vec v|^2}=1$.`),
            num(t`Um vetor faz $60^\circ$ com o eixo $x$ e $60^\circ$ com o eixo $y$. Quanto vale $\cos^2\gamma$ (ângulo com o eixo $z$)?`, 0.5, t`$\frac14+\frac14+\cos^2\gamma=1\Rightarrow\cos^2\gamma=\frac12$.`),
          ],
        },
      ],
    },
    {
      id: 'g-esc-proj',
      title: 'Projeção e trabalho',
      parts: [
        {
          card: {
            title: 'A sombra de um vetor',
            body: t`$$\operatorname{proj}_{\vec v}\vec u=\left(\frac{\vec u\cdot\vec v}{\vec v\cdot\vec v}\right)\vec v$$
É a "sombra" de $\vec u$ na direção de $\vec v$. Seu tamanho é $\frac{|\vec u\cdot\vec v|}{|\vec v|}$.`,
            visual: vectorLab('proj', { u: [2, 2.5], v: [3, 0.5] }),
          },
          exercises: [
            mcqS(t`Qual a projeção de $\vec u=(3,\,4)$ sobre $\vec v=(1,\,0)$?`, t`$(3,\,0)$`, [t`$(0,\,4)$`, t`$(3,\,4)$`, t`$(5,\,0)$`], t`Projetar sobre o eixo $x$ é ficar só com a coordenada $x$.`),
            num(t`Calcule o comprimento da projeção de $\vec u=(2,\,3)$ sobre $\vec v=(4,\,0)$.`, 2, t`$\frac{|\vec u\cdot\vec v|}{|\vec v|}=\frac{8}{4}=2$.`),
            inter(t`Arraste $\vec u$ de modo que sua projeção sobre $\vec v$ seja o **vetor nulo**.`, 'plot', vectorLab('proj', { u: [2, 2.5], v: [3, 0.5] }).props, (v: any) => v && Math.abs(v.pts.u.x * v.pts.v.x + v.pts.u.y * v.pts.v.y) < 1e-9 && Math.hypot(v.pts.u.x, v.pts.u.y) > 0, t`$\vec u\perp\vec v$`, t`$\operatorname{proj}_{\vec v}\vec u=\frac{\vec u\cdot\vec v}{|\vec v|^2}\vec v$ é nula quando $\vec u\cdot\vec v=0$, isto é, $\vec u\perp\vec v$.`),
            tf(t`A projeção de $\vec u$ sobre $\vec v$ é sempre paralela a $\vec v$.`, true, t`É um múltiplo de $\vec v$.`),
            gen((rng) => {
              const v = pick(rng, [[0, 2], [3, 0], [0, -1]] as const);
              const u = [randNZ(rng, -5, 5), randNZ(rng, -5, 5)]; // nonzero components: projection never null
              const k = (u[0] * v[0] + u[1] * v[1]) / (v[0] * v[0] + v[1] * v[1]);
              const p = [k * v[0], k * v[1]];
              return rmcq(rng, t`Qual a projeção de $(${u[0]},\,${u[1]})$ sobre $(${v[0]},\,${v[1]})$?`, `$(${fmt(p[0])},\\,${fmt(p[1])})$`, [`$(${fmt(p[1])},\\,${fmt(p[0])})$`, `$(${u[0]},\\,${u[1]})$`, `$(${fmt(-p[0])},\\,${fmt(-p[1])})$`, `$(${fmt(p[0] + 1)},\\,${fmt(p[1] + 1)})$`], t`$\frac{\vec u\cdot\vec v}{\vec v\cdot\vec v}=${fmt(k)}$, vezes $\vec v$.`);
            }),
            num(t`Calcule o fator $\frac{\vec u\cdot\vec v}{\vec v\cdot\vec v}$ da projeção de $\vec u=(4,\,2)$ sobre $\vec v=(1,\,1)$.`, 3, t`$\frac{6}{2}=3$, e a projeção é $(3,\,3)$.`),
            num(t`Decomponha $\vec u=(4,\,2)$ em uma parte paralela a $(1,\,1)$ e outra perpendicular. Qual a primeira coordenada da parte **perpendicular**?`, 1, t`Paralela: $(3,\,3)$. Perpendicular: $(4,\,2)-(3,\,3)=(1,\,-1)$.`),
          ],
        },
        {
          card: {
            title: 'Trabalho de uma força',
            body: t`$$W=\vec F\cdot\vec d=|\vec F|\,|\vec d|\cos\theta$$

Só a componente da força **na direção do deslocamento** realiza trabalho. Força perpendicular ao movimento não trabalha.`,
          },
          exercises: [
            tf(t`Uma força perpendicular ao deslocamento não realiza trabalho.`, true, t`$\cos90^\circ=0$.`),
            gen((rng) => {
              const F = randInt(rng, 10, 50);
              const d = randInt(rng, 2, 10);
              const ang = pick(rng, [0, 60, 90]);
              return num(t`Uma força de $${F}$ N desloca um bloco $${d}$ m, formando $${ang}^\circ$ com o deslocamento. Qual o trabalho (J)?`, F * d * cosOf(ang), t`$W=${F}\cdot${d}\cdot\cos${ang}^\circ=${fmt(F * d * cosOf(ang))}$ J.`, { unit: 'J' });
            }),
            gen((rng) => {
              const F = r3(rng, -4, 6);
              const d = r3(rng, -3, 5);
              return num(t`A força $\vec F=${V3(F)}$ N desloca um objeto por $\vec d=${V3(d)}$ m. Qual o trabalho (J)?`, dot(F, d), t`$W=\vec F\cdot\vec d=${dot(F, d)}$ J.`, { unit: 'J' });
            }),
            mcq(t`Puxar um carrinho com uma corda inclinada a $60^\circ$ realiza, em relação a puxar na horizontal com a mesma força…`, ['metade do trabalho', 'o mesmo trabalho', 'o dobro do trabalho', 'trabalho nenhum'], 0, t`$\cos60^\circ=\frac12$.`),
            mcq(t`O atrito, oposto ao deslocamento, realiza trabalho…`, ['negativo', 'positivo', 'nulo', 'infinito'], 0, t`$\theta=180^\circ$, $\cos\theta=-1$.`),
            num(t`Uma pessoa empurra um carrinho com $40$ N a $60^\circ$ abaixo da horizontal por $10$ m. Qual o trabalho (J)?`, 200, t`$40\cdot10\cdot\cos60^\circ=200$ J.`, { unit: 'J' }),
            num(t`Um bloco sobe uma rampa de $5$ m enquanto a gravidade ($20$ N, para baixo) atua. A rampa eleva o bloco $3$ m. Qual o trabalho da gravidade (J)?`, -60, t`Só conta a parte vertical do deslocamento ($3$ m para cima, contra a força): $W=-20\cdot3=-60$ J.`, { unit: 'J' }),
          ],
        },
      ],
    },
  ],
};

export const vetorial: UnitDef = {
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
      parts: [
        {
          card: {
            title: 'O determinante simbólico',
            body: t`$$\vec u\times\vec v=\begin{vmatrix}\vec i&\vec j&\vec k\\x_1&y_1&z_1\\x_2&y_2&z_2\end{vmatrix}=(y_1z_2-z_1y_2,\ z_1x_2-x_1z_2,\ x_1y_2-y_1x_2)$$

O resultado é um **vetor**. Gire a cena:`,
            visual: cross3DLab(),
          },
          exercises: [
            mcq(t`O resultado de $\vec u\times\vec v$ é…`, ['um vetor', 'um número', 'um ângulo', 'uma matriz'], 0, t`Diferente do produto escalar, o vetorial dá um vetor.`),
            gen((rng) => {
              const a = r3(rng, -3, 3);
              const b = r3(rng, -3, 3);
              const c = cross(a, b);
              return num(t`Calcule a **terceira** coordenada de $${V3(a)}\times${V3(b)}$.`, c[2], t`$x_1y_2-y_1x_2=${a[0]}\cdot(${b[1]})-(${a[1]})\cdot(${b[0]})=${c[2]}$.`);
            }),
            gen((rng) => {
              const a = r3(rng, -3, 3);
              let b = r3(rng, -3, 3);
              let c = cross(a, b);
              // parallel or null vectors give (0,0,0) and every distractor collapses onto it
              for (let i = 0; i < 20 && c.every((x) => x === 0); i++) {
                b = r3(rng, -3, 3);
                c = cross(a, b);
              }
              if (c.every((x) => x === 0)) {
                a[0] = 1;
                b = [0, 1, 2];
                c = cross(a, b);
              }
              return rmcq(rng, t`Calcule $${V3(a)}\times${V3(b)}$.`, `$${V3(c)}$`, [`$${V3(c.map((x) => -x))}$`, `$${V3([a[0] * b[0], a[1] * b[1], a[2] * b[2]])}$`, `$${V3([c[0], -c[1], c[2]])}$`, `$${V3([c[2], c[1], c[0]])}$`], t`Pelo determinante: $${V3(c)}$.`);
            }),
            inter(t`Ajuste os vetores para que a área do paralelogramo seja $6$.`, 'space3d', cross3DLab().props!, (v: any) => v && near(Math.abs(v.p.ux * v.p.vy), 6, 0.01), t`ex.: $u_x=3$ e $v_y=2$`, t`A área é $|\vec u\times\vec v|$; com $\vec u=(3,0,0)$ e $\vec v=(0,2,0)$, $\vec u\times\vec v=(0,0,6)$ e a área vale $6$.`),
            gen((rng) => {
              const a = r3(rng, -3, 3);
              const b = r3(rng, -3, 3);
              const c = cross(a, b);
              return num(t`Sendo $\vec w=${V3(a)}\times${V3(b)}$, quanto vale $\vec w\cdot${V3(a)}$?`, 0, t`$\vec u\times\vec v$ é perpendicular a $\vec u$: o produto escalar dá $0$ (confira: $${V3(c)}\cdot${V3(a)}=${dot(c, a)}$).`);
            }),
            mcqS(t`Calcule $(1,\,0,\,0)\times(0,\,0,\,1)$.`, t`$(0,\,-1,\,0)$`, [t`$(0,\,1,\,0)$`, t`$(0,\,0,\,0)$`, t`$(1,\,0,\,1)$`], t`$\vec i\times\vec k=-\vec j$.`),
            num(t`Calcule o módulo de $(1,\,2,\,0)\times(3,\,1,\,0)$.`, 5, t`$(0,\,0,\,1-6)=(0,\,0,\,-5)$, módulo $5$.`),
          ],
        },
        {
          card: {
            title: 'Propriedades',
            body: t`• $\vec u\times\vec v$ é perpendicular a $\vec u$ e a $\vec v$ (regra da mão direita)
• $\vec v\times\vec u=-\vec u\times\vec v$ (**anticomutativo**!)
• $\vec u\parallel\vec v\iff\vec u\times\vec v=\vec0$`,
            example: t`$\vec i\times\vec j=\vec k$, $\vec j\times\vec k=\vec i$, $\vec k\times\vec i=\vec j$ (ciclo). Na ordem contrária, troca o sinal.`,
          },
          exercises: [
            mcqS(t`Quanto vale $\vec j\times\vec i$?`, t`$-\vec k$`, [t`$\vec k$`, t`$\vec0$`, t`$1$`], t`Ordem contrária do ciclo: sinal trocado.`),
            tf(t`O produto vetorial de dois vetores paralelos é o vetor nulo.`, true, t`Não há "área" entre eles.`),
            mcq(t`O vetor $\vec u\times\vec v$ é…`, ['ortogonal a $\\vec u$ e a $\\vec v$', 'paralelo a $\\vec u$', 'a soma de $\\vec u$ e $\\vec v$', 'um número real'], 0, t`É por isso que ele dá o vetor normal de um plano.`),
            tf(t`$\vec u\times\vec v=\vec v\times\vec u$`, false, t`É anticomutativo: $\vec v\times\vec u=-(\vec u\times\vec v)$.`),
            mcq(t`Quanto vale $\vec v\times\vec v$?`, ['$\\vec0$', '$|\\vec v|^2$', '$\\vec v$', '$1$'], 0, t`Um vetor é paralelo a si mesmo.`),
            gen((rng) => {
              const a = r3(rng, -3, 3);
              const b = r3(rng, -3, 3);
              const c = cross(a, b);
              return rmcq(rng, t`Sabendo que $\vec u\times\vec v=${V3(c)}$, quanto vale $\vec v\times\vec u$?`, `$${V3(c.map((x) => -x))}$`, [`$${V3(c)}$`, `$${V3([0, 0, 0])}$`, `$${V3([c[2], c[1], c[0]])}$`], t`Trocar a ordem troca o sinal.`);
            }),
            num(t`Para que valor de $k$ os vetores $(2,\,k,\,4)$ e $(1,\,3,\,2)$ têm produto vetorial nulo?`, 6, t`Precisam ser paralelos: $(2,\,k,\,4)=2(1,\,3,\,2)\Rightarrow k=6$.`),
          ],
        },
      ],
    },
    {
      id: 'g-vet-area',
      title: 'Áreas com produto vetorial',
      parts: [
        {
          card: {
            title: 'Paralelogramo e triângulo',
            body: t`$$A_{\text{paralelogramo}}=|\vec u\times\vec v|\qquad A_{\triangle}=\frac12|\vec u\times\vec v|$$

Para um triângulo $ABC$, use $\vec u=\vec{AB}$ e $\vec v=\vec{AC}$.`,
            visual: vectorLab('area', { snap: 1 }),
          },
          exercises: [
            gen((rng) => {
              const a = [randInt(rng, 1, 4), 0, 0];
              const b = [randInt(rng, -2, 2), randInt(rng, 1, 4), 0];
              return num(t`Calcule a área do paralelogramo formado por $${V3(a)}$ e $${V3(b)}$.`, Math.abs(cross(a, b)[2]), t`$\vec u\times\vec v=${V3(cross(a, b))}$, módulo $${Math.abs(cross(a, b)[2])}$.`);
            }),
            num(t`Qual a área do triângulo de vértices $A(0,0,0)$, $B(2,0,0)$ e $C(0,3,0)$?`, 3, t`$\frac12|\vec{AB}\times\vec{AC}|=\frac12|(0,0,6)|=3$.`),
            inter(t`Arraste os vetores para formar um paralelogramo de área $8$.`, 'plot', vectorLab('area', { snap: 1 }).props, (v: any) => v && near(Math.abs(v.pts.u.x * v.pts.v.y - v.pts.u.y * v.pts.v.x), 8, 0.01), t`ex.: $(4,\,0)$ e $(1,\,2)$`, t`Em 2D a área é $|u_xv_y-u_yv_x|$: com $(4,\,0)$ e $(1,\,2)$, $|4\cdot2-0\cdot1|=8$.`),
            tf(t`A área do triângulo formado por $\vec u$ e $\vec v$ é metade da área do paralelogramo.`, true, t`A diagonal divide o paralelogramo em dois triângulos iguais.`),
            gen((rng) => {
              const A = [randInt(rng, -2, 2), randInt(rng, -2, 2)];
              const b = randInt(rng, 2, 6);
              const h = 2 * randInt(rng, 1, 4);
              return num(t`Qual a área do triângulo de vértices $(${A[0]},\,${A[1]},\,0)$, $(${A[0] + b},\,${A[1]},\,0)$ e $(${A[0]},\,${A[1] + h},\,0)$?`, (b * h) / 2, t`$\vec{AB}=(${b},\,0,\,0)$, $\vec{AC}=(0,\,${h},\,0)$, produto $(0,\,0,\,${b * h})$: área $\frac{${b * h}}{2}=${(b * h) / 2}$.`);
            }),
            num(t`Calcule a área do paralelogramo formado por $(1,\,1,\,0)$ e $(0,\,1,\,1)$. (3 casas)`, Math.sqrt(3), t`$(1,\,-1,\,1)$, módulo $\sqrt3\approx1{,}732$.`, { tol: 0.005 }),
            num(t`Qual a área do triângulo de vértices $(1,\,0,\,0)$, $(0,\,2,\,0)$ e $(0,\,0,\,2)$? (3 casas)`, Math.sqrt(6), t`$\vec{AB}=(-1,\,2,\,0)$, $\vec{AC}=(-1,\,0,\,2)$: produto $(4,\,2,\,2)$, módulo $\sqrt{24}$. Área $\frac{\sqrt{24}}{2}=\sqrt6\approx2{,}449$.`, { tol: 0.005 }),
          ],
        },
        {
          card: {
            title: 'Módulo pelo seno',
            body: t`$$|\vec u\times\vec v|=|\vec u|\,|\vec v|\operatorname{sen}\theta$$

E vale a identidade de **Lagrange**: $|\vec u\times\vec v|^2=|\vec u|^2|\vec v|^2-(\vec u\cdot\vec v)^2$.`,
          },
          exercises: [
            num(t`$|\vec u|=4$, $|\vec v|=5$, $\theta=30^\circ$. Quanto vale $|\vec u\times\vec v|$?`, 10, t`$4\cdot5\cdot\operatorname{sen}30^\circ=10$.`),
            gen((rng) => {
              const m1 = randInt(rng, 2, 6);
              const m2 = randInt(rng, 2, 6);
              const ang = pick(rng, [30, 90, 150, 0]);
              return num(t`$|\vec u|=${m1}$, $|\vec v|=${m2}$ e o ângulo entre eles é $${ang}^\circ$. Quanto vale $|\vec u\times\vec v|$?`, m1 * m2 * sinOf(ang), t`$${m1}\cdot${m2}\cdot\operatorname{sen}${ang}^\circ=${fmt(m1 * m2 * sinOf(ang))}$.`);
            }),
            mcq(t`Para módulos fixos, $|\vec u\times\vec v|$ é **máximo** quando o ângulo é…`, ['$90^\\circ$', '$0^\\circ$', '$180^\\circ$', '$45^\\circ$'], 0, t`$\operatorname{sen}90^\circ=1$.`),
            tf(t`Se $\vec u$ e $\vec v$ formam $180^\circ$, então $\vec u\times\vec v=\vec0$.`, true, t`$\operatorname{sen}180^\circ=0$: são paralelos.`),
            num(t`$|\vec u|=3$, $|\vec v|=4$ e $\vec u\cdot\vec v=0$. Quanto vale $|\vec u\times\vec v|$?`, 12, t`Perpendiculares: $3\cdot4\cdot1=12$.`),
            num(t`Use Lagrange: $|\vec u|=5$, $|\vec v|=2$ e $\vec u\cdot\vec v=6$. Quanto vale $|\vec u\times\vec v|$?`, 8, t`$|\vec u\times\vec v|^2=25\cdot4-36=64\Rightarrow 8$.`),
            num(t`Um torque é $\vec\tau=\vec r\times\vec F$. Com $|\vec r|=0{,}5$ m, $|\vec F|=40$ N e ângulo de $90^\circ$, qual o módulo do torque (N·m)?`, 20, t`$0{,}5\cdot40\cdot1=20$ N·m.`),
          ],
        },
      ],
    },
    {
      id: 'g-vet-misto',
      title: 'Produto misto e volume',
      parts: [
        {
          card: {
            title: 'Três vetores, um número',
            body: t`$$[\vec u,\vec v,\vec w]=\vec u\cdot(\vec v\times\vec w)=\begin{vmatrix}x_1&y_1&z_1\\x_2&y_2&z_2\\x_3&y_3&z_3\end{vmatrix}$$

É um **número**, calculado pelo determinante das três linhas de coordenadas.`,
            example: t`$[\vec i,\vec j,\vec k]=1$.`,
          },
          exercises: [
            mcq(t`O produto misto $[\vec u,\vec v,\vec w]$ é…`, ['um número', 'um vetor', 'uma matriz', 'um ângulo'], 0, t`Produto escalar de $\vec u$ com um vetor: dá número.`),
            tf(t`O produto misto pode ser negativo.`, true, t`O sinal indica a orientação (mão direita ou esquerda); o volume é o módulo.`),
            gen((rng) => {
              const a = [randNZ(rng, -3, 3), randInt(rng, -2, 2), randInt(rng, -2, 2)];
              const b = [0, randNZ(rng, -3, 3), randInt(rng, -2, 2)];
              const c = [0, 0, randNZ(rng, -3, 3)];
              return num(t`Calcule $[${V3(a)},\,${V3(b)},\,${V3(c)}]$.`, dot(a, cross(b, c)), t`Matriz triangular: produto da diagonal, $${a[0]}\cdot${b[1]}\cdot${c[2]}=${dot(a, cross(b, c))}$.`);
            }),
            gen((rng) => {
              const a = r3(rng, -2, 2);
              const b = r3(rng, -2, 2);
              const c = r3(rng, -2, 2);
              return num(t`Calcule $[${V3(a)},\,${V3(b)},\,${V3(c)}]$ pelo determinante.`, dot(a, cross(b, c)), t`$\vec v\times\vec w=${V3(cross(b, c))}$ e $\vec u\cdot(\vec v\times\vec w)=${dot(a, cross(b, c))}$.`);
            }),
            num(t`Quanto vale $[\vec j,\vec i,\vec k]$?`, -1, t`Trocar duas linhas do determinante troca o sinal: $-[\vec i,\vec j,\vec k]=-1$.`),
            tf(t`Se dois dos três vetores são iguais, o produto misto é zero.`, true, t`Determinante com duas linhas iguais vale zero.`),
            num(t`Sabendo que $[\vec u,\vec v,\vec w]=5$, quanto vale $[2\vec u,\vec v,\vec w]$?`, 10, t`Multiplicar uma linha por $2$ multiplica o determinante por $2$.`),
          ],
        },
        {
          card: {
            title: 'Volumes e coplanaridade',
            body: t`• $|[\vec u,\vec v,\vec w]|$ = **volume do paralelepípedo**
• Volume do **tetraedro** = $\frac16|[\vec u,\vec v,\vec w]|$
• $[\vec u,\vec v,\vec w]=0$ ⟺ os três vetores são **coplanares**`,
          },
          exercises: [
            mcq(t`Se $[\vec u,\vec v,\vec w]=0$, então os três vetores são…`, ['coplanares', 'ortogonais dois a dois', 'unitários', 'paralelos ao eixo z'], 0, t`Volume zero: o "paralelepípedo" é achatado num plano.`),
            gen((rng) => {
              const a = [randInt(rng, 1, 3), 0, 0];
              const b = [randInt(rng, -1, 1), randInt(rng, 1, 3), 0];
              const c = [randInt(rng, -1, 1), randInt(rng, -1, 1), randInt(rng, 1, 3)];
              const m = dot(a, cross(b, c));
              return num(t`Calcule o volume do paralelepípedo determinado por $${V3(a)}$, $${V3(b)}$ e $${V3(c)}$.`, Math.abs(m), t`Determinante (triangular): $${a[0]}\cdot${b[1]}\cdot${c[2]}=${m}$.`);
            }),
            num(t`Calcule o volume do tetraedro de vértices na origem, $(2,0,0)$, $(0,3,0)$ e $(0,0,6)$.`, 6, t`$\frac16\cdot|2\cdot3\cdot6|=6$.`),
            num(t`Qual o volume de uma caixa formada por $(2,\,0,\,0)$, $(0,\,3,\,0)$ e $(0,\,0,\,4)$?`, 24, t`$2\cdot3\cdot4=24$.`),
            gen((rng) => {
              const a = [1, randInt(rng, -2, 2), randInt(rng, -2, 2)];
              const b = [randInt(rng, -2, 2), 1, randInt(rng, -2, 2)];
              const k = randNZ(rng, -2, 2);
              const c = a.map((v, i) => v + k * b[i]);
              return tf(t`Os vetores $${V3(a)}$, $${V3(b)}$ e $${V3(c)}$ são coplanares.`, true, t`O terceiro é $\vec u${term(k, '\\vec v')}$, combinação dos dois primeiros: o produto misto dá $${dot(a, cross(b, c))}$.`);
            }),
            num(t`Para qual $k$ os vetores $(1,\,0,\,0)$, $(0,\,1,\,0)$ e $(1,\,1,\,k)$ são coplanares?`, 0, t`O determinante vale $k$; coplanares quando $k=0$.`),
            num(t`Os pontos $O(0,0,0)$, $A(1,0,0)$, $B(0,2,0)$ e $C(1,1,3)$ formam um tetraedro. Qual seu volume?`, 1, t`$[\vec{OA},\vec{OB},\vec{OC}]=1\cdot2\cdot3=6$; volume $\frac66=1$.`),
          ],
        },
      ],
    },
  ],
};

import React from 'react';
import type { UnitDef } from '../../types';
import { gen, mcq, mcqS, num, tf, match, inter, plot, near, table } from '../../helpers';
import { FnCurve, Pt } from '../../../components/plot/Plot';
import { C } from '../../../theme';
import { fmt, pick, randInt, randNZ, polyTex, term } from '../../../lib/random';
import { eulerLab, interpolationLab, quadratureLab, regressionLab } from '../../visuals';

const t = String.raw;

const runge = () =>
  plot({
    view: { xMin: -1.05, xMax: 1.05, yMin: -0.6, yMax: 1.6 },
    params: [{ key: 'n', label: 'n', min: 2, max: 14, step: 1, value: 4, color: C.p5, format: (v: number) => String(v) }],
    render: ({ p }: any) => {
      const f = (x: number) => 1 / (1 + 25 * x * x);
      const xs = Array.from({ length: p.n + 1 }, (_, i) => -1 + (2 * i) / p.n);
      const P = (x: number) => {
        let s = 0;
        for (let i = 0; i < xs.length; i++) {
          let l = 1;
          for (let j = 0; j < xs.length; j++) if (j !== i) l *= (x - xs[j]) / (xs[i] - xs[j]);
          s += f(xs[i]) * l;
        }
        return s;
      };
      return (
        <>
          <FnCurve f={f} color={C.p2} />
          <FnCurve f={P} color={C.danger} width={2.5} />
          {xs.map((x, i) => (
            <Pt key={i} x={x} y={f(x)} color={C.gold} r={4} />
          ))}
        </>
      );
    },
    info: ({ p }: any) => t`Função $\frac{1}{1+25x^2}$ (azul) e polinômio de grau $${p.n}$ com nós igualmente espaçados (vermelho)`,
  });

export const interpolacao: UnitDef = {
  id: 'n-int',
  title: 'Interpolação polinomial',
  subtitle: 'Sistema linear, Lagrange, Newton e o fenômeno de Runge',
  icon: '〰️',
  source: 'Cálculo Numérico · Unidade 6 — Interpolação polinomial',
  guide: t`Por $n+1$ pontos com abscissas distintas passa **um único** polinômio de grau $\le n$. Lagrange e Newton são formas diferentes de escrevê-lo. Cuidado com graus altos e nós igualmente espaçados (Runge).`,
  lessons: [
    {
      id: 'n-int-sis',
      title: 'A ideia e o sistema linear',
      parts: [
        {
          card: {
            title: 'Passar exatamente pelos pontos',
            body: t`Dados $(x_0,y_0),\ldots,(x_n,y_n)$, buscamos $P(x)=a_0+a_1x+\cdots+a_nx^n$ com $P(x_i)=y_i$.

Por $n+1$ pontos com abscissas distintas passa **um único** polinômio de grau $\le n$. Arraste os pontos e veja o polinômio se adaptar:`,
            visual: interpolationLab(),
          },
          exercises: [
            mcq(t`Quantos pontos (com abscissas distintas) determinam uma parábola interpoladora única?`, ['3', '2', '4', 'infinitos'], 0, t`Grau $2$ precisa de $2+1=3$ pontos.`),
            tf(t`O polinômio interpolador de grau $\le n$ por $n+1$ pontos distintos é único.`, true, t`É o teorema de existência e unicidade da interpolação.`),
            gen((rng) => {
              const a = randInt(rng, -3, 3);
              const b = randNZ(rng, -3, 3);
              const x0 = randInt(rng, -2, 0);
              const x1 = x0 + randInt(rng, 1, 3);
              const xq = (x0 + x1) / 2;
              return num(t`A reta interpoladora por $(${x0},\,${a + b * x0})$ e $(${x1},\,${a + b * x1})$ vale quanto em $x=${fmt(xq)}$?`, a + b * xq, t`Inclinação $${b}$; $P(${fmt(xq)})=${fmt(a + b * xq)}$.`);
            }),
            inter(t`Arraste os 4 pontos para que o polinômio interpolador seja uma **reta**.`, 'plot', interpolationLab().props, (v: any) => {
              if (!v) return false;
              const ps = Object.values(v.pts) as { x: number; y: number }[];
              if (ps.length < 3) return false;
              const [p0, p1] = ps;
              if (Math.abs(p1.x - p0.x) < 1e-9) return false;
              const m = (p1.y - p0.y) / (p1.x - p0.x);
              return ps.every((q) => Math.abs(q.y - (p0.y + m * (q.x - p0.x))) < 0.13);
            }, 'todos os pontos alinhados', t`Se os pontos estão alinhados, o polinômio de grau $\le3$ que passa por eles é a própria reta.`),
            mcq(t`Com 5 pontos de abscissas distintas, o polinômio interpolador tem grau no máximo…`, ['4', '5', '3', '10'], 0, t`$n+1=5$ pontos ⟹ grau $\le4$.`),
            tf(t`Dois pontos com a mesma abscissa e ordenadas diferentes podem ser interpolados por um polinômio.`, false, t`Um polinômio é função: não pode ter dois valores para o mesmo $x$.`),
            gen((rng) => {
              const c = randInt(rng, -5, 5);
              return num(t`Os pontos $(0,\,${c})$, $(1,\,${c})$ e $(2,\,${c})$ são interpolados por qual polinômio? Dê o valor dele em $x=10$.`, c, t`É a constante $P(x)=${c}$ (grau 0, que também tem grau $\le2$).`);
            }),
          ],
        },
        {
          card: {
            title: 'Pelo sistema (Vandermonde)',
            body: t`Para 3 pontos, $P(x)=a_0+a_1x+a_2x^2$ e
$$\begin{cases}a_0+a_1x_0+a_2x_0^2=y_0\\a_0+a_1x_1+a_2x_1^2=y_1\\a_0+a_1x_2+a_2x_2^2=y_2\end{cases}$$
Funciona, mas é caro e mal-condicionado para muitos pontos.`,
            example: t`Pontos $(0,\,1)$, $(1,\,3)$, $(2,\,7)$: $a_0=1$, $a_1+a_2=2$, $2a_1+4a_2=6$ ⟹ $a_2=1$, $a_1=1$: $P=x^2+x+1$.`,
          },
          exercises: [
            num(t`Interpolando $(0,\,1)$, $(1,\,3)$ e $(2,\,7)$ por $a_0+a_1x+a_2x^2$, quanto vale $a_0$?`, 1, t`Em $x=0$ sobra só $a_0=1$.`),
            gen((rng) => {
              const [a0, a1, a2] = [randInt(rng, -3, 3), randInt(rng, -3, 3), randNZ(rng, -2, 2)];
              const P = (x: number) => a0 + a1 * x + a2 * x * x;
              return num(t`Os pontos $(0,\,${P(0)})$, $(1,\,${P(1)})$ e $(2,\,${P(2)})$ são interpolados por $P(x)=a_0+a_1x+a_2x^2$. Quanto vale $P(3)$?`, P(3), t`Resolvendo o sistema: $P(x)=${polyTex([a0, a1, a2])}$, e $P(3)=${P(3)}$.`);
            }),
            mcq(t`Qual é a principal desvantagem do método de Vandermonde?`, ['é caro e mal-condicionado para muitos pontos', 'não dá o polinômio correto', 'só funciona com 2 pontos', 'exige derivadas'], 0, t`A matriz fica quase singular e os erros de arredondamento explodem.`),
            gen((rng) => {
              const [a0, a1] = [randInt(rng, -4, 4), randNZ(rng, -3, 3)];
              return num(t`Por $(0,\,${a0})$ e $(1,\,${a0 + a1})$ passa $P(x)=a_0+a_1x$. Quanto vale $a_1$?`, a1, t`$a_0=${a0}$ e $a_0+a_1=${a0 + a1}$.`);
            }),
            tf(t`Para 3 pontos, o sistema de Vandermonde tem 3 equações e 3 incógnitas.`, true, t`Uma equação por ponto; incógnitas $a_0$, $a_1$, $a_2$.`),
            num(t`Ache $a_2$ na parábola $a_0+a_1x+a_2x^2$ que passa por $(-1,\,4)$, $(0,\,1)$ e $(1,\,2)$.`, 2, t`$a_0=1$; somando as equações de $x=\pm1$: $2+2a_2=6\Rightarrow a_2=2$.`),
            num(t`E o $a_1$ dessa mesma parábola?`, -1, t`$1+a_1+2=2\Rightarrow a_1=-1$.`),
          ],
        },
      ],
    },
    {
      id: 'n-int-lag',
      title: 'Forma de Lagrange',
      parts: [
        {
          card: {
            title: 'Os polinômios de Lagrange',
            body: t`Para cada nó $x_i$ construímos
$$L_i(x)=\prod_{j\ne i}\frac{x-x_j}{x_i-x_j}$$
que vale **1** em $x_i$ e **0** em todos os outros nós.`,
          },
          exercises: [
            mcq(t`Quanto vale $L_i(x_i)$ na forma de Lagrange?`, ['1', '0', '$y_i$', '$x_i$'], 0, t`Cada fator vira $\frac{x_i-x_j}{x_i-x_j}=1$.`),
            mcq(t`Quanto vale $L_0(x_1)$?`, ['0', '1', '$y_1$', '$-1$'], 0, t`O fator $(x-x_1)$ zera em $x_1$.`),
            num(t`Com nós $x_0=0$, $x_1=1$, $x_2=2$, quanto vale $L_1(0{,}5)$?`, 0.75, t`$L_1=\frac{(x-0)(x-2)}{(1-0)(1-2)}=-x(x-2)$ ⟹ $-0{,}5\cdot(-1{,}5)=0{,}75$.`),
            gen((rng) => {
              const a = randInt(rng, -2, 2);
              const b = a + randInt(rng, 1, 4);
              const x = randInt(rng, a - 1, b + 1);
              return num(t`Com nós $x_0=${a}$ e $x_1=${b}$, quanto vale $L_0(${x})$? (fração ou decimal)`, (x - b) / (a - b), t`$L_0(x)=\frac{x-${b}}{${a}-${b}}$: $\frac{${x - b}}{${a - b}}=${fmt((x - b) / (a - b), 4)}$.`, { tol: 0.002 });
            }),
            tf(t`Com 3 nós, cada $L_i$ é um polinômio de grau 2.`, true, t`É o produto de 2 fatores lineares.`),
            mcq(t`Com nós $0$, $1$ e $2$, qual é $L_0(x)$?`, ['$\\frac{(x-1)(x-2)}{2}$', '$x(x-2)$', '$\\frac{x(x-1)}{2}$', '$(x-1)(x-2)$'], 0, t`$\frac{(x-1)(x-2)}{(0-1)(0-2)}=\frac{(x-1)(x-2)}{2}$.`),
            num(t`Para quaisquer nós, quanto vale $L_0(x)+L_1(x)+L_2(x)$?`, 1, t`É o interpolador da função constante $1$, que é ela mesma.`),
          ],
        },
        {
          card: {
            title: 'Montando P(x)',
            body: t`$$P(x)=\sum_{i=0}^n y_i\,L_i(x)$$
Como $L_i(x_i)=1$ e $L_i(x_j)=0$, a soma passa por todos os pontos — **sem resolver sistema**!`,
            example: t`Pontos $(1,\,2)$, $(3,\,4)$: $L_0=\frac{x-3}{1-3}$, $L_1=\frac{x-1}{3-1}$. $P(2)=2\cdot\frac12+4\cdot\frac12=3$.`,
          },
          exercises: [
            num(t`Interpole $(0,\,1)$, $(1,\,3)$, $(2,\,7)$ e estime $P(1{,}5)$.`, 4.75, t`$P=x^2+x+1$ ⟹ $2{,}25+1{,}5+1=4{,}75$.`),
            tf(t`Na forma de Lagrange, acrescentar um ponto novo obriga a recalcular todos os $L_i$.`, true, t`Essa é a principal desvantagem — a forma de Newton resolve isso.`),
            gen((rng) => {
              const x0 = randInt(rng, 0, 2);
              const x1 = x0 + 2;
              const [y0, y1] = [randInt(rng, -4, 6), randInt(rng, -4, 6)];
              const xm = x0 + 1;
              return num(t`Use Lagrange com $(${x0},\,${y0})$ e $(${x1},\,${y1})$ para estimar $P(${xm})$.`, (y0 + y1) / 2, t`No meio, $L_0=L_1=\frac12$: $P=\frac{${y0}+${y1}}{2}=${fmt((y0 + y1) / 2)}$.`);
            }),
            mcq(t`Qual a vantagem da forma de Lagrange?`, ['não precisa resolver sistema linear', 'é a única exata', 'funciona com abscissas repetidas', 'tem grau menor'], 0, t`O polinômio sai direto da fórmula.`),
            num(t`Com $(0,\,2)$, $(1,\,0)$ e $(2,\,4)$: quanto vale $P(1)$?`, 0, t`O interpolador passa pelos pontos: $P(1)=0$.`),
            num(t`Com $(0,\,2)$, $(1,\,0)$ e $(2,\,4)$, estime $P(3)$.`, 14, t`$P=2L_0+0L_1+4L_2=(x-1)(x-2)+2x(x-1)$; em $3$: $2+12=14$.`),
            tf(t`As formas de Lagrange e de Vandermonde dão o mesmo polinômio.`, true, t`O interpolador é único; só muda a maneira de escrever.`),
          ],
        },
      ],
    },
    {
      id: 'n-int-newt',
      title: 'Newton e o fenômeno de Runge',
      parts: [
        {
          card: {
            title: 'Diferenças divididas',
            body: t`$$f[x_i,x_{i+1}]=\frac{f(x_{i+1})-f(x_i)}{x_{i+1}-x_i}$$
$$P(x)=f[x_0]+f[x_0,x_1](x-x_0)+f[x_0,x_1,x_2](x-x_0)(x-x_1)+\cdots$$
Acrescentar um ponto só adiciona **um termo**.`,
            visual: table(['$x$', '$f$', 'ordem 1', 'ordem 2'], [
              ['$0$', '$1$', '$2$', '$1$'],
              ['$1$', '$3$', '$4$', ''],
              ['$2$', '$7$', '', ''],
            ]),
            example: t`$P(x)=1+2x+1\cdot x(x-1)=x^2+x+1$.`,
          },
          exercises: [
            num(t`Calcule a diferença dividida $f[1,\,3]$ para $f(1)=2$ e $f(3)=10$.`, 4, t`$\frac{10-2}{3-1}=4$.`),
            gen((rng) => {
              const a = randInt(rng, -2, 2);
              const b = a + randInt(rng, 1, 3);
              const k = randNZ(rng, -4, 4);
              const fa = randInt(rng, -5, 5);
              return num(t`Calcule $f[${a},\,${b}]$ com $f(${a})=${fa}$ e $f(${b})=${fa + k * (b - a)}$.`, k, t`$\frac{${fa + k * (b - a)}-(${fa})}{${b}-(${a})}=${k}$.`);
            }),
            num(t`Para $f(0)=1$, $f(1)=3$, $f(2)=7$, qual é $f[0,\,1,\,2]$?`, 1, t`$f[0, 1]=2$, $f[1, 2]=4$, $f[0,1,2]=\frac{4-2}{2-0}=1$.`),
            tf(t`Na forma de Newton, acrescentar um ponto só adiciona um termo ao polinômio.`, true, t`Os termos anteriores continuam valendo.`),
            gen((rng) => {
              const [a0, a1, a2] = [randInt(rng, -3, 3), randInt(rng, -3, 3), randNZ(rng, -2, 2)];
              const f = (x: number) => a0 + a1 * x + a2 * x * x;
              const d1 = f(1) - f(0);
              const d2 = f(2) - f(1);
              return num(t`Com $f(0)=${f(0)}$, $f(1)=${f(1)}$ e $f(2)=${f(2)}$, calcule $f[0,\,1,\,2]$.`, (d2 - d1) / 2, t`$f[0,1]=${d1}$, $f[1,2]=${d2}$; $\frac{${d2}-(${d1})}{2}=${fmt((d2 - d1) / 2)}$.`);
            }),
            mcq(t`O coeficiente $f[x_0,x_1]$ na forma de Newton multiplica…`, ['$(x-x_0)$', '$(x-x_0)(x-x_1)$', '$x$', '$1$'], 0, t`$P(x)=f[x_0]+f[x_0,x_1](x-x_0)+\cdots$`),
            num(t`Use Newton com a tabela do card para calcular $P(3)$.`, 13, t`$P(3)=1+2\cdot3+1\cdot3\cdot2=13$.`),
          ],
        },
        {
          card: {
            title: 'Mais pontos nem sempre é melhor',
            body: t`Com nós **igualmente espaçados**, polinômios de grau alto oscilam nas bordas (fenômeno de Runge). Aumente $n$:`,
            visual: runge(),
            tip: t`Soluções: interpolação **por partes** (splines) ou nós de **Chebyshev**, mais concentrados nas pontas.`,
          },
          exercises: [
            inter(t`Aumente $n$ até ver o polinômio (vermelho) passar de $1{,}2$ nas bordas.`, 'plot', runge().props, (v: any) => v && v.p.n >= 10, '$n\\ge10$', t`É o fenômeno de Runge: grau alto + nós equiespaçados = oscilação.`),
            tf(t`Aumentar o número de nós igualmente espaçados sempre melhora a interpolação.`, false, t`Com grau alto, o polinômio oscila nas bordas (Runge).`),
            mcq(t`Uma boa alternativa para muitos pontos experimentais é…`, ['splines (interpolação por partes)', 'aumentar ainda mais o grau', 'usar só o primeiro e o último ponto', 'trocar por um polinômio de grau 0'], 0, t`Vários polinômios de grau baixo, emendados suavemente.`),
            mcq(t`Os nós de Chebyshev ficam…`, ['mais concentrados nas pontas do intervalo', 'igualmente espaçados', 'todos no centro', 'em posições aleatórias'], 0, t`Concentrar nós nas pontas controla a oscilação.`),
            mcq(t`Onde o fenômeno de Runge aparece com mais força?`, ['perto das extremidades do intervalo', 'no centro', 'só nos nós', 'em lugar nenhum'], 0, t`As oscilações crescem nas bordas.`),
            tf(t`Uma spline cúbica usa um polinômio de grau 3 diferente em cada subintervalo.`, true, t`E emenda os pedaços com continuidade da função e das derivadas.`),
            mcq(t`Se os dados têm ruído (medições com erro), em vez de interpolar costuma ser melhor…`, ['fazer um ajuste de curvas (mínimos quadrados)', 'usar grau ainda maior', 'apagar os pontos', 'usar Lagrange'], 0, t`Interpolar força a curva a passar pelo ruído; ajustar suaviza.`),
          ],
        },
      ],
    },
  ],
};

const QLAB = () => quadratureLab((x) => Math.exp(-x * x), 0, 1, 0.746824132812427, { xMin: -0.05, xMax: 1.05, yMin: -0.05, yMax: 1.1 });

export const ajuste: UnitDef = {
  id: 'n-aju',
  title: 'Ajuste de curvas',
  subtitle: 'Mínimos quadrados e linearização',
  icon: '📊',
  source: 'Cálculo Numérico · Unidade 3 — Ajuste de curvas',
  guide: t`Com dados ruidosos, não queremos passar por todos os pontos: queremos a curva que minimiza a **soma dos quadrados dos resíduos**. Modelos exponenciais e de potência viram retas com logaritmos.`,
  lessons: [
    {
      id: 'n-aju-mmq',
      title: 'Mínimos quadrados (reta)',
      parts: [
        {
          card: {
            title: 'Minimize os quadrados',
            body: t`Resíduo $r_i=y_i-(ax_i+b)$. Queremos minimizar $S=\sum r_i^2$ — a área total dos quadradinhos rosa. Mexa em $a$ e $b$ (ou arraste os pontos) e tente bater a melhor reta:`,
            visual: regressionLab(),
          },
          exercises: [
            tf(t`A reta de mínimos quadrados passa necessariamente por todos os pontos.`, false, t`Ela só minimiza a soma dos quadrados dos resíduos.`),
            mcq(t`Por que elevamos os resíduos ao quadrado?`, ['para que positivos e negativos não se cancelem e a função seja derivável', 'para deixar os números maiores', 'porque é mais fácil somar', 'para obter sempre zero'], 0, t`Somar resíduos com sinal poderia dar zero mesmo com reta ruim.`),
            gen((rng) => {
              const a = randNZ(rng, -2, 3);
              const b = randInt(rng, -3, 3);
              const x = randInt(rng, 0, 4);
              const y = a * x + b + pick(rng, [-2, -1, 1, 2]);
              return num(t`Para a reta $y=${term(a, 'x', true)}${term(b, '')}$, qual o resíduo do ponto $(${x},\,${y})$?`, y - (a * x + b), t`$r=y-(ax+b)=${y}-(${a * x + b})=${y - (a * x + b)}$.`);
            }),
            gen((rng) => {
              const r = [randInt(rng, -2, 2), randInt(rng, -2, 2), randInt(rng, -2, 2)];
              return num(t`Os resíduos de uma reta foram $${r[0]}$, $${r[1]}$ e $${r[2]}$. Quanto vale $S=\sum r_i^2$?`, r[0] ** 2 + r[1] ** 2 + r[2] ** 2, t`$${r[0] ** 2}+${r[1] ** 2}+${r[2] ** 2}=${r[0] ** 2 + r[1] ** 2 + r[2] ** 2}$.`);
            }),
            inter(t`Ajuste $a$ e $b$ até a soma dos quadrados ficar abaixo de $0{,}6$.`, 'plot', regressionLab().props, (v: any) => {
              if (!v) return false;
              const ps = Object.values(v.pts) as { x: number; y: number }[];
              return ps.reduce((s, q) => s + (q.y - (v.p.a * q.x + v.p.b)) ** 2, 0) < 0.6;
            }, t`perto de $y\approx0{,}9x+0{,}6$`),
            gen((rng) => {
              const a = randNZ(rng, -2, 3);
              const b = randInt(rng, -3, 3);
              return num(t`Pontos sobre a reta exata $y=${term(a, 'x', true)}${term(b, '')}$ (sem ruído): qual a soma dos quadrados dos resíduos da melhor reta?`, 0, t`A melhor reta é a própria $y=${term(a, 'x', true)}${term(b, '')}$, com resíduos nulos.`);
            }),
            mcq(t`Entre duas retas candidatas, a de mínimos quadrados é a que tem…`, ['a menor soma dos quadrados dos resíduos', 'a maior inclinação', 'o menor coeficiente linear', 'mais pontos exatamente em cima'], 0, t`É o critério que define o método.`),
          ],
        },
        {
          card: {
            title: 'Equações normais',
            body: t`Derivando $S$ em $a$ e $b$ e igualando a zero:
$$\begin{cases}a\sum x_i^2+b\sum x_i=\sum x_iy_i\\a\sum x_i+n\,b=\sum y_i\end{cases}$$`,
            example: t`Pontos $(1,\,1)$, $(2,\,2)$, $(3,\,2)$: $\sum x=6$, $\sum y=5$, $\sum x^2=14$, $\sum xy=11$, $n=3$ ⟹ $a=0{,}5$, $b=\frac23$.`,
            tip: t`A reta de mínimos quadrados sempre passa pelo ponto médio $(\bar x,\,\bar y)$.`,
          },
          exercises: [
            num(t`Para $(1,\,1)$, $(2,\,2)$, $(3,\,2)$, a reta de mínimos quadrados tem inclinação $a=$?`, 0.5, t`$\begin{cases}14a+6b=11\\6a+3b=5\end{cases}$ ⟹ $a=0{,}5$.`),
            gen((rng) => {
              const xs = [1, 2, 3, 4];
              const ys = xs.map(() => randInt(rng, 0, 9));
              return num(t`Para os pontos com $x=1,\ 2,\ 3,\ 4$ e $y=${ys.join(',\\ ')}$, quanto vale $\sum x_iy_i$?`, xs.reduce((s, x, i) => s + x * ys[i], 0), t`$${xs.map((x, i) => `${x}\\cdot${ys[i]}`).join('+')}=${xs.reduce((s, x, i) => s + x * ys[i], 0)}$.`);
            }),
            num(t`Para $x=1,\ 2,\ 3,\ 4$, quanto vale $\sum x_i^2$?`, 30, t`$1+4+9+16=30$.`),
            tf(t`A reta de mínimos quadrados passa pelo ponto $(\bar x,\,\bar y)$.`, true, t`Sai da 2ª equação normal dividida por $n$: $\bar y=a\bar x+b$.`),
            gen((rng) => {
              const xs = [0, 1, 2];
              const a = randNZ(rng, -2, 3);
              const b = randInt(rng, -3, 4);
              const ys = xs.map((x) => a * x + b);
              const xb = 1;
              const yb = (ys[0] + ys[1] + ys[2]) / 3;
              return num(t`Para $(0,\,${ys[0]})$, $(1,\,${ys[1]})$ e $(2,\,${ys[2]})$, a reta ajustada passa por $(\bar x,\,\bar y)$. Quanto vale $\bar y$?`, yb, t`$\frac{${ys[0]}+${ys[1]}+${ys[2]}}{3}=${fmt(yb)}$ (com $\bar x=${xb}$).`);
            }),
            num(t`Para $(1,\,1)$, $(2,\,2)$, $(3,\,2)$, quanto vale o coeficiente $b$? (fração ou decimal)`, 2 / 3, t`$6\cdot0{,}5+3b=5\Rightarrow b=\frac23$.`, { tol: 0.002 }),
            num(t`Com $(0,\,0)$, $(1,\,1)$, $(2,\,4)$, ache a inclinação $a$ da reta de mínimos quadrados.`, 2, t`$\sum x=3$, $\sum y=5$, $\sum x^2=5$, $\sum xy=9$: $\begin{cases}5a+3b=9\\3a+3b=5\end{cases}\Rightarrow a=2$.`),
          ],
        },
      ],
    },
    {
      id: 'n-aju-lin',
      title: 'Ajustes não lineares por linearização',
      parts: [
        {
          card: {
            title: 'Use o logaritmo',
            body: t`• **Exponencial** $y=a\,e^{bx}$ ⟹ $\ln y=\ln a+b\,x$: ajuste reta entre $x$ e $\ln y$.
• **Potência** $y=a\,x^b$ ⟹ $\ln y=\ln a+b\ln x$: reta entre $\ln x$ e $\ln y$.`,
            tip: t`Dados de crescimento populacional, decaimento radioativo e curvas de carga de capacitor costumam ser exponenciais.`,
          },
          exercises: [
            mcqS(t`Para ajustar $y=a\,e^{bx}$ por mínimos quadrados lineares, qual variável usamos no eixo vertical?`, t`$\ln y$`, [t`$y^2$`, t`$e^y$`, t`$\frac1y$`], t`$\ln y=\ln a+bx$ é uma reta em $x$.`),
            mcqS(t`Para ajustar $y=a\,x^b$, a linearização é:`, t`$\ln y=\ln a+b\ln x$`, [t`$y=\ln a+bx$`, t`$\ln y=a+bx$`, t`$y^b=ax$`], t`Logaritmo dos dois lados.`),
            tf(t`Para usar a linearização exponencial, todos os $y$ precisam ser positivos.`, true, t`Não existe $\ln$ de número negativo ou zero.`),
            mcq(t`Se os pontos $(x,\ \ln y)$ ficam quase em linha reta, o melhor modelo é…`, ['exponencial', 'potência', 'reta em $(x,\\,y)$', 'parábola'], 0, t`É exatamente a linearização da exponencial.`),
            mcq(t`Se os pontos $(\ln x,\ \ln y)$ ficam alinhados, o melhor modelo é…`, ['potência $y=ax^b$', 'exponencial $y=ae^{bx}$', 'reta $y=ax+b$', 'logarítmico'], 0, t`$\ln y=\ln a+b\ln x$.`),
            gen((rng) => {
              const b = pick(rng, [0.2, 0.3, 0.5, -0.4]);
              return num(t`Ajustando $(x,\ \ln y)$ obteve-se $\ln y=1{,}2${b < 0 ? '' : '+'}${fmt(b)}x$. Qual o valor de $b$ no modelo $y=ae^{bx}$?`, b, t`O coeficiente de $x$ é o próprio $b$.`);
            }),
            num(t`O ajuste linear de $(x,\ln y)$ deu coeficiente linear $\ln a=1$. Quanto vale $a$ (2 casas)?`, Math.E, t`$a=e^1\approx2{,}72$.`, { tol: 0.01 }),
          ],
        },
        {
          card: {
            title: 'Voltando ao modelo',
            body: t`Depois do ajuste linear, **desfaça** a transformação:
• se $\ln y=A+Bx$, então $y=e^A\,e^{Bx}$, ou seja $a=e^A$ e $b=B$
• se $\ln y=A+B\ln x$, então $y=e^A\,x^B$

O mesmo método de mínimos quadrados também ajusta **polinômios** (com uma equação normal a mais por grau).`,
            example: t`Ajuste deu $\ln y=0{,}7+0{,}3x$ ⟹ $a=e^{0{,}7}\approx2{,}01$ e $b=0{,}3$: $y\approx2{,}01\,e^{0{,}3x}$.`,
          },
          exercises: [
            num(t`O ajuste de $(x,\ln y)$ deu $\ln y=0{,}7+0{,}3x$. Quanto vale $a$ em $y=ae^{bx}$? (2 casas)`, Math.exp(0.7), t`$a=e^{0{,}7}\approx2{,}01$.`, { tol: 0.01 }),
            gen((rng) => {
              const A = pick(rng, [0, 0.5, 1, 1.5]);
              const B = pick(rng, [0.1, 0.2, 0.4]);
              const x = pick(rng, [1, 2, 5]);
              return num(t`O modelo ajustado é $\ln y=${fmt(A)}+${fmt(B)}x$. Qual a previsão de $y$ em $x=${x}$? (2 casas)`, Math.exp(A + B * x), t`$y=e^{${fmt(A)}+${fmt(B)}\cdot${x}}=e^{${fmt(A + B * x)}}\approx${fmt(Math.exp(A + B * x), 2)}$.`, { tol: 0.01 });
            }),
            tf(t`Um polinômio de grau 2 também pode ser ajustado por mínimos quadrados.`, true, t`As incógnitas $a_0$, $a_1$, $a_2$ aparecem de forma linear.`),
            mcq(t`Para ajustar uma parábola $y=a_0+a_1x+a_2x^2$, quantas equações normais aparecem?`, ['3', '2', '1', '4'], 0, t`Uma para cada coeficiente.`),
            num(t`O ajuste de $(\ln x,\ \ln y)$ deu $\ln y=0+2\ln x$. Qual a previsão de $y$ em $x=3$?`, 9, t`$y=e^0\cdot x^2=x^2=9$.`),
            mcq(t`Um modelo $y=a\,e^{bx}$ com $b<0$ representa…`, ['decaimento', 'crescimento', 'oscilação', 'reta'], 0, t`$e^{bx}$ diminui quando $b<0$.`),
            num(t`Com $y=5e^{-0{,}2x}$, em quanto tempo $y$ cai pela metade? (2 casas)`, Math.log(2) / 0.2, t`$e^{-0{,}2x}=\frac12\Rightarrow x=\frac{\ln2}{0{,}2}\approx3{,}47$.`, { tol: 0.01 }),
          ],
        },
      ],
    },
  ],
};

export const integracaoNum: UnitDef = {
  id: 'n-inum',
  title: 'Integração numérica',
  subtitle: 'Trapézios, Simpson e erro',
  icon: '🧮',
  source: 'Cálculo Numérico · Unidade 4 — Integração numérica',
  guide: t`Quando não há primitiva (ou só temos uma tabela de valores), aproximamos a área: trapézios usam retas; Simpson usa parábolas e é muito mais precisa para funções suaves.`,
  lessons: [
    {
      id: 'n-inum-trap',
      title: 'Regra dos trapézios',
      parts: [
        {
          card: {
            title: 'Retas no lugar da curva',
            body: t`Com $n$ subintervalos de largura $h=\frac{b-a}{n}$:
$$T_n=\frac h2\big[f_0+2f_1+2f_2+\cdots+2f_{n-1}+f_n\big]$$
As pontas pesam $1$ e os pontos de dentro pesam $2$.`,
            visual: QLAB(),
          },
          exercises: [
            num(t`Use 1 trapézio para $\int_0^2x^2dx$.`, 4, t`$\frac{2}{2}(0+4)=4$ (exato: $2{,}667$).`),
            num(t`Use 2 trapézios ($h=1$) para $\int_0^2x^2dx$.`, 3, t`$\frac12(0+2\cdot1+4)=3$.`),
            tf(t`A regra dos trapézios é exata para funções afins (retas).`, true, t`Um trapézio sob uma reta é exatamente a área.`),
            gen((rng) => {
              const vals = [randInt(rng, 1, 9), randInt(rng, 1, 9), randInt(rng, 1, 9), randInt(rng, 1, 9), randInt(rng, 1, 9)];
              const h = pick(rng, [0.5, 1, 2]);
              const T = (h / 2) * (vals[0] + 2 * (vals[1] + vals[2] + vals[3]) + vals[4]);
              return num(t`Tabela com $h=${fmt(h)}$: $f_0..f_4=${vals.join(',\\ ')}$. Calcule $T_4$.`, T, t`$\frac{${fmt(h)}}{2}[${vals[0]}+2(${vals[1]}+${vals[2]}+${vals[3]})+${vals[4]}]=${fmt(T)}$.`);
            }),
            gen((rng) => {
              const a = randInt(rng, 0, 2);
              const n = pick(rng, [2, 4, 5, 10]);
              const L = pick(rng, [1, 2, 4]);
              return num(t`Para aplicar trapézios em $[${a},\,${a + L}]$ com $n=${n}$, qual é $h$? (decimal)`, L / n, t`$h=\frac{${L}}{${n}}=${fmt(L / n)}$.`);
            }),
            mcq(t`Na fórmula dos trapézios com $n=3$, quais são os pesos de $f_0,\ f_1,\ f_2,\ f_3$?`, ['$1,\\ 2,\\ 2,\\ 1$', '$1,\\ 4,\\ 4,\\ 1$', '$2,\\ 1,\\ 1,\\ 2$', '$1,\\ 1,\\ 1,\\ 1$'], 0, t`Pontas com peso 1, pontos internos com peso 2.`),
            num(t`Use 2 trapézios para $\int_0^2(2x+1)\,dx$.`, 6, t`$\frac12(1+2\cdot3+5)=6$ — exato, pois o integrando é uma reta.`),
          ],
        },
        {
          card: {
            title: 'Erro e refinamento',
            body: t`O erro dos trapézios é proporcional a $h^2$: **dobrar** $n$ divide o erro por aproximadamente **4**.

Teste com $\int_0^1e^{-x^2}dx$, que não tem primitiva elementar:`,
            visual: QLAB(),
            tip: t`Para funções com concavidade para cima, os trapézios **superestimam** a integral (a reta fica acima da curva).`,
          },
          exercises: [
            inter(t`Usando trapézios, aumente $n$ até o erro ficar abaixo de $0{,}001$.`, 'plot', QLAB().props, (v: any) => v && v.p.s === 0 && v.p.n >= 8, t`$n\ge8$ com trapézios`),
            mcq(t`Se com $n=10$ o erro dos trapézios foi $0{,}004$, com $n=20$ espera-se um erro perto de…`, ['$0{,}001$', '$0{,}002$', '$0{,}008$', '$0{,}0005$'], 0, t`Erro $\propto h^2$: metade de $h$ ⟹ erro dividido por 4.`),
            tf(t`Para $f(x)=x^2$ em $[0,\,2]$, a regra dos trapézios dá um valor maior que o exato.`, true, t`Concavidade para cima: as retas ficam acima da curva ($3>2{,}667$).`),
            mcq(t`A regra dos trapézios é especialmente útil quando…`, ['só temos uma tabela de valores medidos', 'a primitiva é fácil', 'a função é constante', 'nunca'], 0, t`Ela só precisa dos valores nos pontos.`),
            num(t`Use 4 trapézios para $\int_0^2x^2dx$ (com $h=0{,}5$). (3 casas)`, 2.75, t`$\frac{0{,}5}{2}[0+2(0{,}25+1+2{,}25)+4]=0{,}25\cdot11=2{,}75$.`, { tol: 0.001 }),
            num(t`Quais os erros de $T_2=3$ e $T_4=2{,}75$ para $\int_0^2x^2dx=\frac83$? Responda a razão erro$(T_2)$/erro$(T_4)$.`, 4, t`$\frac{3-2{,}667}{2{,}75-2{,}667}=\frac{0{,}333}{0{,}0833}=4$.`, { tol: 0.05 }),
            mcq(t`Por que integrar numericamente $\int_0^1e^{-x^2}dx$?`, ['porque não existe primitiva elementar', 'porque a integral é zero', 'porque a função é descontínua', 'para treinar derivadas'], 0, t`Essa integral aparece muito em probabilidade (distribuição normal).`),
          ],
        },
      ],
    },
    {
      id: 'n-inum-simp',
      title: 'Regra de Simpson',
      parts: [
        {
          card: {
            title: 'Parábolas de dois em dois',
            body: t`Com $n$ **par**:
$$S_n=\frac h3\big[f_0+4f_1+2f_2+4f_3+\cdots+4f_{n-1}+f_n\big]$$
Pesos $1,4,2,4,\ldots,4,1$: a cada par de subintervalos, uma parábola passa pelos três pontos.`,
            visual: QLAB(),
          },
          exercises: [
            mcq(t`Os pesos da regra de Simpson para $n=4$ são:`, ['1, 4, 2, 4, 1', '1, 2, 2, 2, 1', '1, 3, 3, 1', '1, 4, 4, 4, 1'], 0, t`Alternam 4 e 2 no meio, 1 nas pontas.`),
            tf(t`A regra de Simpson pode ser usada com número ímpar de subintervalos.`, false, t`A regra 1/3 exige $n$ par (pares de subintervalos).`),
            num(t`Use Simpson com $n=2$ para $\int_0^2x^2dx$.`, 8 / 3, t`$\frac13(0+4\cdot1+4)=\frac83$ — exato!`, { tol: 0.002 }),
            gen((rng) => {
              const f = [randInt(rng, 1, 9), randInt(rng, 1, 9), randInt(rng, 1, 9)];
              const h = pick(rng, [0.5, 1, 1.5]);
              const S = (h / 3) * (f[0] + 4 * f[1] + f[2]);
              return num(t`Com $h=${fmt(h)}$ e $f_0,f_1,f_2=${f.join(',\\ ')}$, calcule $S_2$. (3 casas)`, S, t`$\frac{${fmt(h)}}{3}(${f[0]}+4\cdot${f[1]}+${f[2]})=${fmt(S, 3)}$.`, { tol: 0.001 });
            }),
            gen((rng) => {
              const f = [randInt(rng, 0, 6), randInt(rng, 0, 6), randInt(rng, 0, 6), randInt(rng, 0, 6), randInt(rng, 0, 6)];
              const S = (1 / 3) * (f[0] + 4 * f[1] + 2 * f[2] + 4 * f[3] + f[4]);
              return num(t`Com $h=1$ e $f_0..f_4=${f.join(',\\ ')}$, calcule $S_4$. (3 casas)`, S, t`$\frac13[${f[0]}+4\cdot${f[1]}+2\cdot${f[2]}+4\cdot${f[3]}+${f[4]}]=${fmt(S, 3)}$.`, { tol: 0.001 });
            }),
            mcq(t`A regra de Simpson aproxima a função, em cada par de subintervalos, por…`, ['uma parábola', 'uma reta', 'uma constante', 'uma exponencial'], 0, t`Por isso ela é mais precisa que os trapézios.`),
            num(t`Use Simpson com $n=2$ para $\int_0^2x^3dx$.`, 4, t`$\frac13(0+4\cdot1+8)=4$ — exato (grau 3).`),
          ],
        },
        {
          card: {
            title: 'Precisão de Simpson',
            body: t`O erro de Simpson é proporcional a $h^4$: **dobrar** $n$ divide o erro por aproximadamente **16**.

Surpresa: Simpson é **exata** para polinômios até grau **3**, mesmo usando parábolas. Alterne para Simpson ($S$) e compare o erro com os trapézios:`,
            visual: QLAB(),
          },
          exercises: [
            inter(t`Com Simpson, qual o menor $n$ que dá erro abaixo de $10^{-5}$? Ajuste os controles.`, 'plot', QLAB().props, (v: any) => v && v.p.s === 1 && v.p.n >= 6, t`Simpson com $n=6$`),
            tf(t`Simpson é exata para qualquer polinômio de grau 3.`, true, t`Os erros do termo cúbico se cancelam por simetria.`),
            mcq(t`Se com $n=4$ o erro de Simpson foi $0{,}0016$, com $n=8$ espera-se um erro perto de…`, ['$0{,}0001$', '$0{,}0008$', '$0{,}0004$', '$0{,}0032$'], 0, t`Erro $\propto h^4$: metade de $h$ ⟹ erro dividido por 16.`),
            mcq(t`Para uma função suave, com o mesmo $n$, qual método costuma errar menos?`, ['Simpson', 'trapézios', 'os dois erram igual', 'depende só do $h$'], 0, t`$h^4$ cai bem mais rápido que $h^2$.`),
            tf(t`Simpson com $n=2$ dá o valor exato de $\int_0^1(3x^2+2x)\,dx$.`, true, t`O integrando tem grau 2: Simpson é exata.`),
            num(t`Calcule $\int_0^1(3x^2+2x)\,dx$ por Simpson com $n=2$.`, 2, t`$h=0{,}5$: $\frac{0{,}5}{3}(0+4\cdot1{,}75+5)=\frac{12}{6}=2$.`),
            mcq(t`Qual afirmação é verdadeira?`, ['trapézios: erro $\\propto h^2$; Simpson: erro $\\propto h^4$', 'os dois têm erro $\\propto h^2$', 'Simpson tem erro $\\propto h$', 'trapézios são exatos para parábolas'], 0, t`Por isso Simpson converge tão mais rápido.`),
          ],
        },
      ],
    },
  ],
};

const ELAB = () => eulerLab((x, y) => y, Math.exp, 0, 1, 2, { xMin: -0.1, xMax: 2.1, yMin: 0, yMax: 8 });

export const edos: UnitDef = {
  id: 'n-edo',
  title: 'Equações diferenciais (numérico)',
  subtitle: 'Euler, Euler melhorado e Runge-Kutta',
  icon: '🚀',
  source: 'Cálculo Numérico · Unidade 5 — Resolução numérica de EDOs',
  guide: t`Problema de valor inicial $y'=f(x,y)$, $y(x_0)=y_0$. Euler dá passos na direção da derivada; Runge-Kutta faz uma média de inclinações e erra muito menos com o mesmo passo.`,
  lessons: [
    {
      id: 'n-edo-euler',
      title: 'Método de Euler',
      parts: [
        {
          card: {
            title: 'Passos na direção da tangente',
            body: t`Num **problema de valor inicial** $y'=f(x,y)$, $y(x_0)=y_0$, a EDO diz a inclinação em cada ponto. Euler anda um passo $h$ nessa direção:
$$y_{k+1}=y_k+h\,f(x_k,y_k),\qquad x_{k+1}=x_k+h$$`,
            visual: ELAB(),
          },
          exercises: [
            mcq(t`No método de Euler, o próximo valor é calculado usando…`, ['a inclinação no ponto atual', 'a inclinação no ponto final', 'a média de 4 inclinações', 'a integral exata'], 0, t`$y_{k+1}=y_k+h\,f(x_k,y_k)$.`),
            gen((rng) => {
              const y0 = randInt(rng, 1, 4);
              const h = pick(rng, [0.1, 0.2, 0.5]);
              return num(t`Euler para $y'=2y$, $y(0)=${y0}$, $h=${fmt(h)}$: calcule $y_1$.`, y0 + h * 2 * y0, t`$y_1=${y0}+${fmt(h)}\cdot2\cdot${y0}=${fmt(y0 + h * 2 * y0)}$.`);
            }),
            num(t`Euler para $y'=x+y$, $y(0)=1$, $h=0{,}1$: calcule $y_1$.`, 1.1, t`$y_1=1+0{,}1\cdot(0+1)=1{,}1$.`),
            num(t`Continuando o anterior, calcule $y_2$ ($x_1=0{,}1$).`, 1.22, t`$y_2=1{,}1+0{,}1\cdot(0{,}1+1{,}1)=1{,}22$.`),
            gen((rng) => {
              const c = randInt(rng, 1, 5);
              const h = pick(rng, [0.1, 0.5, 1]);
              const y0 = randInt(rng, 0, 3);
              return num(t`Euler para $y'=${c}$ (constante), $y(0)=${y0}$, $h=${fmt(h)}$: calcule $y_2$.`, y0 + 2 * h * c, t`Dois passos de $${fmt(h)}\cdot${c}$: $${y0}+${fmt(2 * h * c)}=${fmt(y0 + 2 * h * c)}$ (exato, pois a solução é uma reta).`);
            }),
            tf(t`Para $y'=f(x)$ que não depende de $y$, Euler é igual a somar retângulos (soma de Riemann).`, true, t`$y_n=y_0+h\sum f(x_k)$.`),
            num(t`Euler para $y'=-y$, $y(0)=1$, $h=0{,}5$: calcule $y_2$ (em $x=1$).`, 0.25, t`$y_1=1-0{,}5=0{,}5$; $y_2=0{,}5-0{,}25=0{,}25$ (exato: $e^{-1}\approx0{,}368$).`),
          ],
        },
        {
          card: {
            title: 'Erro e tamanho do passo',
            body: t`Euler tem erro global proporcional a $h$ (**primeira ordem**): metade do passo, metade do erro — mas o dobro de contas.

Para $y'=y$, $y(0)=1$ (solução exata $e^x$, verde), diminua $h$ e veja o erro cair:`,
            visual: ELAB(),
            tip: t`Passo grande demais pode deixar a solução numérica instável, oscilando ou explodindo.`,
          },
          exercises: [
            inter(t`Diminua $h$ (Euler) até o erro em $y(2)$ ficar abaixo de $0{,}7$.`, 'plot', ELAB().props, (v: any) => v && v.p.rk === 0 && v.p.h <= 0.1001, t`$h\le0{,}1$`),
            mcq(t`Se Euler com $h=0{,}1$ errou $0{,}2$, com $h=0{,}05$ espera-se um erro perto de…`, ['$0{,}1$', '$0{,}05$', '$0{,}2$', '$0{,}4$'], 0, t`Primeira ordem: erro proporcional a $h$.`),
            tf(t`Diminuir o passo $h$ aumenta o número de passos necessários.`, true, t`Para ir de $x_0$ a $X$ são $\frac{X-x_0}{h}$ passos.`),
            gen((rng) => {
              const L = pick(rng, [1, 2, 5]);
              const h = pick(rng, [0.1, 0.25, 0.5]);
              return num(t`Quantos passos de Euler com $h=${fmt(h)}$ levam de $x=0$ até $x=${L}$?`, L / h, t`$\frac{${L}}{${fmt(h)}}=${L / h}$ passos.`);
            }),
            mcq(t`Para $y'=y$ com $y(0)=1$, Euler (com $h>0$) dá valores…`, ['menores que $e^x$', 'maiores que $e^x$', 'exatamente $e^x$', 'negativos'], 0, t`A curva é côncava para cima: a tangente fica abaixo dela.`),
            num(t`Euler para $y'=y$, $y(0)=1$, $h=1$: quanto vale $y$ em $x=2$?`, 4, t`$y_1=2$, $y_2=4$. O exato é $e^2\approx7{,}39$: passo grande, erro grande.`),
            mcq(t`Euler aplicado a $y'=-10y$ com $h=0{,}3$ (passo grande) tende a…`, ['oscilar e crescer (instabilidade)', 'convergir rapidamente', 'dar a solução exata', 'parar no zero'], 0, t`$y_{k+1}=(1-3)y_k=-2y_k$: troca de sinal e cresce.`),
          ],
        },
      ],
    },
    {
      id: 'n-edo-rk',
      title: 'Euler melhorado e Runge-Kutta',
      parts: [
        {
          card: {
            title: 'Média de inclinações',
            body: t`**Euler melhorado (Heun)**: $k_1=f(x_k,y_k)$, $k_2=f(x_k+h,\ y_k+hk_1)$, $y_{k+1}=y_k+\frac h2(k_1+k_2)$.

**RK4**:
$$y_{k+1}=y_k+\frac h6(k_1+2k_2+2k_3+k_4)$$
com $k_2,k_3$ no meio do passo e $k_4$ no final. Troque para RK4 e compare:`,
            visual: ELAB(),
            tip: t`RK4 tem erro $\propto h^4$: com $h=0{,}5$ já é melhor que Euler com $h=0{,}01$!`,
          },
          exercises: [
            num(t`Euler melhorado para $y'=y$, $y(0)=1$, $h=0{,}1$: calcule $y_1$.`, 1.105, t`$k_1=1$, $k_2=1{,}1$: $y_1=1+0{,}05\cdot2{,}1=1{,}105$ (exato $1{,}10517$).`),
            mcq(t`Quantas avaliações de $f$ por passo faz o RK4?`, ['4', '1', '2', '6'], 0, t`$k_1$, $k_2$, $k_3$ e $k_4$.`),
            inter(t`Mude para RK4 e use $h=0{,}5$. O erro fica abaixo de $0{,}1$?`, 'plot', ELAB().props, (v: any) => v && v.p.rk === 1 && near(v.p.h, 0.5, 0.01), t`RK4 com $h=0{,}5$`, t`O erro do RK4 com $h=0{,}5$ é cerca de $0{,}005$ — contra $2{,}3$ do Euler com o mesmo passo.`),
            gen((rng) => {
              const k1 = randInt(rng, 1, 5);
              const k2 = randInt(rng, 1, 5);
              const y0 = randInt(rng, 0, 4);
              const h = pick(rng, [0.1, 0.2, 0.5]);
              return num(t`No Heun, com $y_k=${y0}$, $h=${fmt(h)}$, $k_1=${k1}$ e $k_2=${k2}$, quanto vale $y_{k+1}$?`, y0 + (h / 2) * (k1 + k2), t`$${y0}+\frac{${fmt(h)}}{2}(${k1}+${k2})=${fmt(y0 + (h / 2) * (k1 + k2))}$.`);
            }),
            gen((rng) => {
              const k = [randInt(rng, 1, 4), randInt(rng, 1, 4), randInt(rng, 1, 4), randInt(rng, 1, 4)];
              const h = pick(rng, [0.3, 0.6]);
              const y0 = randInt(rng, 0, 3);
              const y1 = y0 + (h / 6) * (k[0] + 2 * k[1] + 2 * k[2] + k[3]);
              return num(t`No RK4, com $y_k=${y0}$, $h=${fmt(h)}$ e $k_1..k_4=${k.join(',\\ ')}$, quanto vale $y_{k+1}$? (3 casas)`, y1, t`$${y0}+\frac{${fmt(h)}}{6}(${k[0]}+2\cdot${k[1]}+2\cdot${k[2]}+${k[3]})=${fmt(y1, 3)}$.`, { tol: 0.001 });
            }),
            tf(t`Os pesos do RK4 dão mais importância às inclinações do meio do passo.`, true, t`$k_2$ e $k_3$ têm peso 2; $k_1$ e $k_4$, peso 1.`),
            match(t`Ligue o método à ordem do erro global:`, [
              ['Euler', '$h$'],
              ['Euler melhorado', '$h^2$'],
              ['RK4', '$h^4$'],
              ['Simpson (integração)', '$h^4$ (fórmula)'],
            ]),
          ],
        },
        {
          card: {
            title: 'Sistemas e ordem superior',
            body: t`Uma EDO de 2ª ordem vira um **sistema** de 1ª ordem chamando a derivada de nova variável:

$$y''=-y\ \Longrightarrow\ \begin{cases}y'=v\\v'=-y\end{cases}$$

Os mesmos métodos se aplicam a cada componente — é assim que se simulam molas, circuitos RLC e órbitas.`,
          },
          exercises: [
            mcqS(t`Como transformar $y''+3y'+2y=0$ em sistema de 1ª ordem?`, t`$y'=v,\ v'=-3v-2y$`, [t`$y'=-3y,\ v'=2v$`, t`$y''=v,\ v'=y$`, t`$y'=3v+2y$`], t`Com $v=y'$: $v'=y''=-3v-2y$.`),
            tf(t`Uma EDO de 3ª ordem vira um sistema de 3 equações de 1ª ordem.`, true, t`Variáveis $y$, $y'$ e $y''$.`),
            mcq(t`Quantas condições iniciais precisa uma EDO de 2ª ordem?`, ['2 (ex.: $y(0)$ e $y\'(0)$)', '1', '3', 'nenhuma'], 0, t`Uma para cada variável do sistema.`),
            num(t`Euler no sistema $y'=v$, $v'=-y$ com $y(0)=1$, $v(0)=0$ e $h=0{,}1$: quanto vale $v_1$?`, -0.1, t`$v_1=v_0+h\cdot(-y_0)=0-0{,}1=-0{,}1$.`),
            num(t`No mesmo passo, quanto vale $y_1$?`, 1, t`$y_1=y_0+h\cdot v_0=1+0=1$.`),
            mcq(t`A equação $m\,x''+c\,x'+k\,x=0$ descreve…`, ['um sistema massa-mola com amortecimento', 'crescimento populacional', 'juros compostos', 'uma reta'], 0, t`Massa $m$, amortecimento $c$ e rigidez $k$.`),
            mcqS(t`Como escrever $x''=-4x$ como sistema?`, t`$x'=v,\ v'=-4x$`, [t`$x'=-4v,\ v'=x$`, t`$x'=4x$`, t`$x''=v,\ v'=-4$`], t`Com $v=x'$: $v'=x''=-4x$.`),
          ],
        },
      ],
    },
  ],
};

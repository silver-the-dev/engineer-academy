import React from 'react';
import type { Unit } from '../../types';
import { gen, mcq, mcqS, num, tf, fill, match, order, inter, plot, rmcq, near, multi, table } from '../../helpers';
import { FnCurve, Pt } from '../../../components/plot/Plot';
import { C } from '../../../theme';
import { fmt, pick, randInt, randNZ } from '../../../lib/random';
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

export const interpolacao: Unit = {
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
      cards: [
        {
          title: 'Passar exatamente pelos pontos',
          body: t`Dados $(x_0,y_0),\ldots,(x_n,y_n)$, buscamos $P(x)=a_0+a_1x+\cdots+a_nx^n$ com $P(x_i)=y_i$. Arraste os pontos e veja o polinômio se adaptar:`,
          visual: interpolationLab(),
        },
        {
          title: 'Pelo sistema (Vandermonde)',
          body: t`Para 3 pontos, $P(x)=a_0+a_1x+a_2x^2$ e
$$\begin{cases}a_0+a_1x_0+a_2x_0^2=y_0\\a_0+a_1x_1+a_2x_1^2=y_1\\a_0+a_1x_2+a_2x_2^2=y_2\end{cases}$$
Funciona, mas é caro e mal-condicionado para muitos pontos.`,
          example: t`Pontos $(0, 1)$, $(1, 3)$, $(2, 7)$: $a_0=1$, $a_1+a_2=2$, $2a_1+4a_2=6$ ⟹ $a_2=1$, $a_1=1$: $P=x^2+x+1$.`,
        },
      ],
      exercises: [
        mcq(t`Quantos pontos (com abscissas distintas) determinam uma parábola interpoladora única?`, ['3', '2', '4', 'infinitos'], 0),
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
        tf(t`O polinômio interpolador de grau $\le n$ por $n+1$ pontos distintos é único.`, true),
      ],
    },
    {
      id: 'n-int-lag',
      title: 'Forma de Lagrange',
      cards: [
        {
          title: 'Polinômios que valem 1 num ponto e 0 nos outros',
          body: t`$$L_i(x)=\prod_{j\ne i}\frac{x-x_j}{x_i-x_j}\qquad P(x)=\sum_{i=0}^n y_i\,L_i(x)$$
Como $L_i(x_i)=1$ e $L_i(x_j)=0$, a soma passa por todos os pontos — sem resolver sistema!`,
          example: t`Pontos $(1, 2)$, $(3, 4)$: $L_0=\frac{x-3}{1-3}$, $L_1=\frac{x-1}{3-1}$. $P(2)=2\cdot\frac12+4\cdot\frac12=3$.`,
        },
      ],
      exercises: [
        num(t`Com nós $x_0=0$, $x_1=1$, $x_2=2$, quanto vale $L_1(0{,}5)$?`, 0.75, t`$L_1=\frac{(x-0)(x-2)}{(1-0)(1-2)}=-x(x-2)$ ⟹ $-0{,}5\cdot(-1{,}5)=0{,}75$.`),
        num(t`Interpole $(0,\,1)$, $(1,\,3)$, $(2,\,7)$ e estime $P(1{,}5)$.`, 4.75, t`$P=x^2+x+1$ ⟹ $2{,}25+1{,}5+1=4{,}75$.`),
        mcq(t`Quanto vale $L_i(x_i)$ na forma de Lagrange?`, ['1', '0', '$y_i$', '$x_i$'], 0),
        tf(t`Na forma de Lagrange, acrescentar um ponto novo obriga a recalcular todos os $L_i$.`, true, t`Essa é a principal desvantagem — a forma de Newton resolve isso.`),
      ],
    },
    {
      id: 'n-int-newt',
      title: 'Newton e o fenômeno de Runge',
      cards: [
        {
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
        {
          title: 'Mais pontos nem sempre é melhor',
          body: t`Com nós **igualmente espaçados**, polinômios de grau alto oscilam nas bordas (Runge). Aumente $n$:`,
          visual: runge(),
          tip: t`Soluções: interpolação **por partes** (splines) ou nós de **Chebyshev**, mais concentrados nas pontas.`,
        },
      ],
      exercises: [
        num(t`Calcule a diferença dividida $f[1,\,3]$ para $f(1)=2$ e $f(3)=10$.`, 4, t`$\frac{10-2}{3-1}=4$.`),
        num(t`Para $f(0)=1$, $f(1)=3$, $f(2)=7$, qual é $f[0,\,1,\,2]$?`, 1, t`$f[0, 1]=2$, $f[1, 2]=4$, $f[0,1,2]=\frac{4-2}{2-0}=1$.`),
        inter(t`Aumente $n$ até ver o polinômio (vermelho) passar de $1{,}2$ nas bordas.`, 'plot', runge().props, (v: any) => v && v.p.n >= 10, '$n\\ge10$', t`É o fenômeno de Runge: grau alto + nós equiespaçados = oscilação.`),
        mcq(t`Uma boa alternativa para muitos pontos experimentais é…`, ['splines (interpolação por partes)', 'aumentar ainda mais o grau', 'usar só o primeiro e o último ponto', 'trocar por um polinômio de grau 0'], 0),
      ],
    },
  ],
};

export const ajuste: Unit = {
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
      cards: [
        {
          title: 'Minimize os quadrados',
          body: t`Resíduo $r_i=y_i-(ax_i+b)$. Queremos minimizar $S=\sum r_i^2$ — a área total dos quadradinhos rosa. Mexa em $a$ e $b$ (ou arraste os pontos) e tente bater a melhor reta:`,
          visual: regressionLab(),
        },
        {
          title: 'Equações normais',
          body: t`Derivando $S$ em $a$ e $b$ e igualando a zero:
$$\begin{cases}a\sum x_i^2+b\sum x_i=\sum x_iy_i\\a\sum x_i+n\,b=\sum y_i\end{cases}$$`,
          example: t`Pontos $(1, 1)$, $(2, 2)$, $(3, 2)$: $\sum x=6$, $\sum y=5$, $\sum x^2=14$, $\sum xy=11$, $n=3$ ⟹ $a=0{,}5$, $b=\frac23$.`,
        },
      ],
      exercises: [
        inter(t`Ajuste $a$ e $b$ até a soma dos quadrados ficar abaixo de $0{,}6$.`, 'plot', regressionLab().props, (v: any) => {
          if (!v) return false;
          const ps = Object.values(v.pts) as { x: number; y: number }[];
          return ps.reduce((s, q) => s + (q.y - (v.p.a * q.x + v.p.b)) ** 2, 0) < 0.6;
        }, t`perto de $y\approx0{,}9x+0{,}6$`),
        num(t`Para $(1, 1)$, $(2, 2)$, $(3, 2)$, a reta de mínimos quadrados tem inclinação $a=$?`, 0.5, t`$\begin{cases}14a+6b=11\\6a+3b=5\end{cases}$ ⟹ $a=0{,}5$.`),
        gen((rng) => {
          const a = randNZ(rng, -2, 3);
          const b = randInt(rng, -3, 3);
          return num(t`Pontos sobre a reta exata $y=${a}x${b < 0 ? '' : '+'}${b}$ (sem ruído): qual a soma dos quadrados dos resíduos da melhor reta?`, 0, t`A melhor reta é a própria $y=${a}x${b < 0 ? '' : '+'}${b}$, com resíduos nulos.`);
        }),
        mcq(t`Por que elevamos os resíduos ao quadrado?`, ['para que positivos e negativos não se cancelem e a função seja derivável', 'para deixar os números maiores', 'porque é mais fácil somar', 'para obter sempre zero'], 0),
        tf(t`A reta de mínimos quadrados passa necessariamente por todos os pontos.`, false),
      ],
    },
    {
      id: 'n-aju-lin',
      title: 'Ajustes não lineares por linearização',
      cards: [
        {
          title: 'Use o logaritmo',
          body: t`• **Exponencial** $y=a\,e^{bx}$ ⟹ $\ln y=\ln a+b\,x$: ajuste reta entre $x$ e $\ln y$.
• **Potência** $y=a\,x^b$ ⟹ $\ln y=\ln a+b\ln x$: reta entre $\ln x$ e $\ln y$.
• **Polinômio** de grau 2: o mesmo método, com uma equação normal a mais.`,
          example: t`Se ao fazer o ajuste em $(x,\ln y)$ você obtém $\ln y=0{,}7+0{,}3x$, então $a=e^{0{,}7}\approx2{,}01$ e $b=0{,}3$.`,
          tip: t`Dados de crescimento populacional, decaimento radioativo e curvas de carga de capacitor costumam ser exponenciais.`,
        },
      ],
      exercises: [
        mcqS(t`Para ajustar $y=a\,e^{bx}$ por mínimos quadrados lineares, qual variável usamos no eixo vertical?`, t`$\ln y$`, [t`$y^2$`, t`$e^y$`, t`$\frac1y$`]),
        mcqS(t`Para ajustar $y=a\,x^b$, a linearização é:`, t`$\ln y=\ln a+b\ln x$`, [t`$y=\ln a+bx$`, t`$\ln y=a+bx$`, t`$y^b=ax$`]),
        num(t`O ajuste linear de $(x,\ln y)$ deu coeficiente linear $\ln a=1$. Quanto vale $a$ (2 casas)?`, Math.E, undefined, { tol: 0.01 }),
        tf(t`Um polinômio de grau 2 também pode ser ajustado por mínimos quadrados.`, true),
      ],
    },
  ],
};

export const integracaoNum: Unit = {
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
      cards: [
        {
          title: 'Retas no lugar da curva',
          body: t`Com $n$ subintervalos de largura $h=\frac{b-a}{n}$:
$$T_n=\frac h2\big[f_0+2f_1+2f_2+\cdots+2f_{n-1}+f_n\big]$$
Teste com $\int_0^1e^{-x^2}dx$ (sem primitiva elementar):`,
          visual: quadratureLab((x) => Math.exp(-x * x), 0, 1, 0.746824132812427, { xMin: -0.05, xMax: 1.05, yMin: -0.05, yMax: 1.1 }),
          tip: t`O erro dos trapézios é proporcional a $h^2$: dobrar $n$ divide o erro por ~4.`,
        },
      ],
      exercises: [
        num(t`Use 1 trapézio para $\int_0^2x^2dx$.`, 4, t`$\frac{2}{2}(0+4)=4$ (exato: $2{,}667$).`),
        num(t`Use 2 trapézios ($h=1$) para $\int_0^2x^2dx$.`, 3, t`$\frac12(0+2\cdot1+4)=3$.`),
        gen((rng) => {
          const vals = [randInt(rng, 1, 9), randInt(rng, 1, 9), randInt(rng, 1, 9), randInt(rng, 1, 9), randInt(rng, 1, 9)];
          const h = pick(rng, [0.5, 1, 2]);
          const T = (h / 2) * (vals[0] + 2 * (vals[1] + vals[2] + vals[3]) + vals[4]);
          return num(t`Tabela com $h=${fmt(h)}$: $f_0..f_4=${vals.join(',\\ ')}$. Calcule $T_4$.`, T, t`$\frac{${fmt(h)}}{2}[${vals[0]}+2(${vals[1]}+${vals[2]}+${vals[3]})+${vals[4]}]=${fmt(T)}$.`);
        }),
        inter(t`Usando trapézios, aumente $n$ até o erro ficar abaixo de $0{,}001$.`, 'plot', quadratureLab((x) => Math.exp(-x * x), 0, 1, 0.746824132812427, { xMin: -0.05, xMax: 1.05, yMin: -0.05, yMax: 1.1 }).props, (v: any) => v && v.p.s === 0 && v.p.n >= 8, t`$n\ge8$ com trapézios`),
        tf(t`A regra dos trapézios é exata para funções afins (retas).`, true),
      ],
    },
    {
      id: 'n-inum-simp',
      title: 'Regra de Simpson',
      cards: [
        {
          title: 'Parábolas de dois em dois',
          body: t`Com $n$ **par**:
$$S_n=\frac h3\big[f_0+4f_1+2f_2+4f_3+\cdots+4f_{n-1}+f_n\big]$$
Pesos $1,4,2,4,\ldots,4,1$. Alterne para Simpson ($S$) e compare o erro:`,
          visual: quadratureLab((x) => Math.exp(-x * x), 0, 1, 0.746824132812427, { xMin: -0.05, xMax: 1.05, yMin: -0.05, yMax: 1.1 }),
          tip: t`Erro de Simpson $\propto h^4$: exata para polinômios até grau **3**!`,
        },
      ],
      exercises: [
        num(t`Use Simpson com $n=2$ para $\int_0^2x^2dx$.`, 8 / 3, t`$\frac13(0+4\cdot1+4)=\frac83$ — exato!`, { tol: 0.002 }),
        num(t`Use Simpson com $n=2$ para $\int_0^2x^3dx$.`, 4, t`$\frac13(0+4\cdot1+8)=4$ — exato (grau 3).`),
        mcq(t`Os pesos da regra de Simpson para $n=4$ são:`, ['1, 4, 2, 4, 1', '1, 2, 2, 2, 1', '1, 3, 3, 1', '1, 4, 4, 4, 1'], 0),
        inter(t`Com Simpson, qual o menor $n$ que dá erro abaixo de $10^{-5}$? Ajuste os controles.`, 'plot', quadratureLab((x) => Math.exp(-x * x), 0, 1, 0.746824132812427, { xMin: -0.05, xMax: 1.05, yMin: -0.05, yMax: 1.1 }).props, (v: any) => v && v.p.s === 1 && v.p.n >= 6, t`Simpson com $n=6$`),
        tf(t`A regra de Simpson pode ser usada com número ímpar de subintervalos.`, false, t`A regra 1/3 exige $n$ par (pares de subintervalos).`),
      ],
    },
  ],
};

export const edos: Unit = {
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
      cards: [
        {
          title: 'Passos na direção da tangente',
          body: t`$$y_{k+1}=y_k+h\,f(x_k,y_k)$$
Para $y'=y$, $y(0)=1$ (solução exata $e^x$, verde). Diminua $h$:`,
          visual: eulerLab((x, y) => y, Math.exp, 0, 1, 2, { xMin: -0.1, xMax: 2.1, yMin: 0, yMax: 8 }),
          tip: t`Euler tem erro global proporcional a $h$ (primeira ordem): metade do passo, metade do erro.`,
        },
      ],
      exercises: [
        gen((rng) => {
          const y0 = randInt(rng, 1, 4);
          const h = pick(rng, [0.1, 0.2, 0.5]);
          return num(t`Euler para $y'=2y$, $y(0)=${y0}$, $h=${fmt(h)}$: calcule $y_1$.`, y0 + h * 2 * y0, t`$y_1=${y0}+${fmt(h)}\cdot2\cdot${y0}=${fmt(y0 + h * 2 * y0)}$.`);
        }),
        num(t`Euler para $y'=x+y$, $y(0)=1$, $h=0{,}1$: calcule $y_1$.`, 1.1, t`$y_1=1+0{,}1\cdot(0+1)=1{,}1$.`),
        num(t`Continuando o anterior, calcule $y_2$ ($x_1=0{,}1$).`, 1.22, t`$y_2=1{,}1+0{,}1\cdot(0{,}1+1{,}1)=1{,}22$.`),
        inter(t`Diminua $h$ (Euler) até o erro em $y(2)$ ficar abaixo de $0{,}7$.`, 'plot', eulerLab((x, y) => y, Math.exp, 0, 1, 2, { xMin: -0.1, xMax: 2.1, yMin: 0, yMax: 8 }).props, (v: any) => v && v.p.rk === 0 && v.p.h <= 0.1001, t`$h\le0{,}1$`),
      ],
    },
    {
      id: 'n-edo-rk',
      title: 'Euler melhorado e Runge-Kutta',
      cards: [
        {
          title: 'Média de inclinações',
          body: t`**Euler melhorado (Heun)**: $k_1=f(x_k,y_k)$, $k_2=f(x_k+h,\ y_k+hk_1)$, $y_{k+1}=y_k+\frac h2(k_1+k_2)$.

**RK4**:
$$y_{k+1}=y_k+\frac h6(k_1+2k_2+2k_3+k_4)$$
com $k_2,k_3$ no meio do passo e $k_4$ no final. Troque para RK4 e compare:`,
          visual: eulerLab((x, y) => y, Math.exp, 0, 1, 2, { xMin: -0.1, xMax: 2.1, yMin: 0, yMax: 8 }),
          tip: t`RK4 tem erro $\propto h^4$: com $h=0{,}5$ já é melhor que Euler com $h=0{,}01$!`,
        },
        {
          title: 'Sistemas e ordem superior',
          body: t`Uma EDO de 2ª ordem vira um **sistema** de 1ª ordem: $y''=-y$ ⟹ $y'=v$, $v'=-y$. Os mesmos métodos se aplicam a cada componente — é assim que se simulam molas, circuitos RLC e órbitas.`,
        },
      ],
      exercises: [
        num(t`Euler melhorado para $y'=y$, $y(0)=1$, $h=0{,}1$: calcule $y_1$.`, 1.105, t`$k_1=1$, $k_2=1{,}1$: $y_1=1+0{,}05\cdot2{,}1=1{,}105$ (exato $1{,}10517$).`),
        inter(t`Mude para RK4 e use $h=0{,}5$. O erro fica abaixo de $0{,}1$?`, 'plot', eulerLab((x, y) => y, Math.exp, 0, 1, 2, { xMin: -0.1, xMax: 2.1, yMin: 0, yMax: 8 }).props, (v: any) => v && v.p.rk === 1 && near(v.p.h, 0.5, 0.01), t`RK4 com $h=0{,}5$`, t`O erro do RK4 com $h=0{,}5$ é cerca de $0{,}005$ — contra $2{,}3$ do Euler com o mesmo passo.`),
        mcq(t`Quantas avaliações de $f$ por passo faz o RK4?`, ['4', '1', '2', '6'], 0),
        mcqS(t`Como transformar $y''+3y'+2y=0$ em sistema de 1ª ordem?`, t`$y'=v,\ v'=-3v-2y$`, [t`$y'=-3y,\ v'=2v$`, t`$y''=v,\ v'=y$`, t`$y'=3v+2y$`]),
        match(t`Ligue o método à ordem do erro global:`, [
          ['Euler', '$h$'],
          ['Euler melhorado', '$h^2$'],
          ['RK4', '$h^4$'],
          ['Simpson (integração)', '$h^4$ (fórmula)'],
        ]),
      ],
    },
  ],
};

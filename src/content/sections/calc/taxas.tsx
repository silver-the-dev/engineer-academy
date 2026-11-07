import React from 'react';
import type { UnitDef } from '../../types';
import { gen, mcqS, num, tf, fill, match, order, inter, plot, rmcq, near, multi } from '../../helpers';
import { Arrow, CircleW, FnCurve, InfLine, Label, Pt, Seg } from '../../../components/plot/Plot';
import { C } from '../../../theme';
import { fmt, pick, polyTex, randInt, randNZ, term } from '../../../lib/random';

const t = String.raw;

/** Particle motion lab: s(t) = t^3 - 6t^2 + 9t on [0, 4] */
const motionLab = () => {
  const s = (tt: number) => tt ** 3 - 6 * tt * tt + 9 * tt;
  const v = (tt: number) => 3 * tt * tt - 12 * tt + 9;
  const a = (tt: number) => 6 * tt - 12;
  return plot({
    view: { xMin: -0.3, xMax: 4.3, yMin: -2.2, yMax: 5.5 },
    params: [{ key: 't', label: 't', min: 0, max: 4, step: 0.1, value: 0.5, color: C.gold }],
    render: ({ p }: any) => {
      const st = s(p.t);
      const vt = v(p.t);
      return (
        <>
          <FnCurve f={s} from={0} to={4.1} color={C.p1} />
          <InfLine x1={p.t} y1={st} x2={p.t + 1} y2={st + vt} color={C.gold} width={2} dash="6 4" />
          <Pt x={p.t} y={st} color={C.gold} label="s(t)" />
          <Seg x1={0} y1={-1.4} x2={4} y2={-1.4} color={C.plotAxis} width={2.5} />
          <Label x={0} y={-1.4} text="trilho (m)" color={C.textDim} dy={-10} size={11} />
          <Pt x={st} y={-1.4} color={C.p2} r={7} />
          {Math.abs(vt) > 0.08 ? <Arrow x1={st} y1={-1.4} x2={st + vt * 0.14} y2={-1.4} color={vt > 0 ? C.success : C.danger} width={3.5} /> : null}
        </>
      );
    },
    info: ({ p }: any) => t`$t=${fmt(p.t, 1)}\text{ s}$ · $s=${fmt(s(p.t), 2)}\text{ m}$ · $v=s'=${fmt(v(p.t), 2)}\text{ m/s}$ · $a=s''=${fmt(a(p.t), 2)}\text{ m/s}^2$`,
  });
};

/** Left and right secants on |x| at x = 0 */
const kinkLab = () =>
  plot({
    view: { xMin: -2.4, xMax: 2.4, yMin: -0.5, yMax: 2.4 },
    equalAspect: true,
    params: [{ key: 'h', label: 'h', min: 0.05, max: 2, step: 0.05, value: 1.2, color: C.p5 }],
    render: ({ p }: any) => (
      <>
        <FnCurve f={(x) => Math.abs(x)} color={C.p1} width={3} />
        <Pt x={-p.h} y={p.h} color={C.p2} label="esq" dy={-10} />
        <Pt x={p.h} y={p.h} color={C.p5} label="dir" dy={-10} />
        <Pt x={0} y={0} color={C.gold} r={7} />
      </>
    ),
    info: ({ p }: any) => t`$h=${fmt(p.h, 2)}$: secante à esq $=-1$ · secante à dir $=+1$ ⟹ em $x=0$ há um **bico** ($\nexists\,f'(0)$)`,
  });

/** Piecewise function f(x) = x^2 (x <= 1) and a*x + b (x > 1) */
const smoothJoinLab = () =>
  plot({
    view: { xMin: -1.4, xMax: 2.8, yMin: -1, yMax: 4.8 },
    params: [
      { key: 'a', label: 'a', min: 0, max: 4, step: 0.5, value: 1, color: C.p2 },
      { key: 'b', label: 'b', min: -3, max: 2, step: 0.5, value: 1, color: C.p3 },
    ],
    render: ({ p }: any) => (
      <>
        <InfLine x1={1} y1={1} x2={2} y2={3} color={C.gold} width={1.5} dash="5 5" />
        <FnCurve f={(x) => (x <= 1 ? x * x : NaN)} to={1} color={C.p1} width={3} />
        <FnCurve f={(x) => (x >= 1 ? p.a * x + p.b : NaN)} from={1} color={C.p2} width={3} />
        <Pt x={1} y={1} color={C.p1} r={6} />
        <CircleW cx={1} cy={p.a + p.b} r={0.07} color={C.p2} fill={C.bgDeep} fillOpacity={1} width={2.5} />
      </>
    ),
    info: ({ p }: any) => {
      const cont = Math.abs(p.a + p.b - 1) < 1e-6;
      const dif = cont && Math.abs(p.a - 2) < 1e-6;
      if (dif) return t`$a=2,\,b=-1$: contínua **e** mesma inclinação ($2=2$) ⟹ **diferenciável** em $x=1$!`;
      if (cont) return t`Contínua em $x=1$, mas $f'_-(1)=2\ne f'_+(1)=${fmt(p.a)}$ ⟹ tem **bico**!`;
      return t`Salto em $x=1$: esq $=1\ne$ dir $=${fmt(p.a + p.b)}$ ⟹ **descontínua** (logo não diferenciável)`;
    },
  });

/** Draggable point on x^2 + y^2 = 25 showing implicit derivative dy/dx = -x/y */
const circleImplicitLab = () => {
  const snaps: [number, number][] = [
    [3, 4], [4, 3], [0, 5], [5, 0],
    [-3, 4], [-4, 3], [-5, 0], [0, -5],
    [-3, -4], [-4, -3], [3, -4], [4, -3],
  ];
  return plot({
    view: { xMin: -6.5, xMax: 6.5, yMin: -6.5, yMax: 6.5 },
    equalAspect: true,
    points: [{ id: 'P', x: 4, y: 3, color: C.gold, label: 'P' }],
    constrain: (_: string, x: number, y: number) => {
      const ang = Math.atan2(y, x);
      const px = 5 * Math.cos(ang);
      const py = 5 * Math.sin(ang);
      for (const [sx, sy] of snaps) {
        if (Math.hypot(px - sx, py - sy) < 0.42) return { x: sx, y: sy };
      }
      return { x: px, y: py };
    },
    render: ({ pts }: any) => {
      const { x, y } = pts.P;
      return (
        <>
          <CircleW cx={0} cy={0} r={5} color={C.p1} width={2.5} />
          <Seg x1={0} y1={0} x2={x} y2={y} color={C.p2} width={2} dash="5 4" />
          <InfLine x1={x} y1={y} x2={x - y} y2={y + x} color={C.gold} width={2.5} />
        </>
      );
    },
    info: ({ pts }: any) => {
      const { x, y } = pts.P;
      if (Math.abs(y) < 0.08) return t`$P=(${fmt(x, 1)},\,0)$ · denominador $y=0$ ⟹ **tangente vertical**`;
      return t`$P=(${fmt(x, 2)},\,${fmt(y, 2)})$ · $\dfrac{dy}{dx}=-\dfrac{x}{y}=${fmt(-x / y, 2)}$ (perpendicular ao raio)`;
    },
  });
};

/** Sliding ladder of length 5 m with base moving at dx/dt = 1 m/s */
const ladderLab = () =>
  plot({
    view: { xMin: -0.8, xMax: 5.8, yMin: -0.8, yMax: 5.8 },
    equalAspect: true,
    params: [{ key: 't', label: 't', min: 0.5, max: 4.8, step: 0.1, value: 2, color: C.p2 }],
    render: ({ p }: any) => {
      const x = p.t;
      const y = Math.sqrt(Math.max(0, 25 - x * x));
      const dydt = y > 0.05 ? -x / y : -10;
      return (
        <>
          <Seg x1={0} y1={0} x2={0} y2={5.4} color={C.plotAxis} width={4} />
          <Seg x1={0} y1={0} x2={5.4} y2={0} color={C.plotAxis} width={4} />
          <Seg x1={x} y1={0} x2={0} y2={y} color={C.gold} width={5} />
          <Arrow x1={x} y1={0} x2={x + 0.7} y2={0} color={C.p2} width={3} />
          <Arrow x1={0} y1={y} x2={0} y2={Math.max(0.1, y + Math.max(-2.2, dydt * 0.6))} color={C.danger} width={3} />
          <Pt x={x} y={0} color={C.p2} r={6} label="x" dy={18} />
          <Pt x={0} y={y} color={C.danger} r={6} label="y" dx={12} />
        </>
      );
    },
    info: ({ p }: any) => {
      const x = p.t;
      const y = Math.sqrt(Math.max(0, 25 - x * x));
      return t`$t=${fmt(p.t, 1)}\text{ s}$: base $x=${fmt(x, 1)}\text{ m}$ ($\frac{dx}{dt}=1\text{ m/s}$) · topo $y=${fmt(y, 2)}\text{ m}$ · $\frac{dy}{dt}=-\frac{x}{y}\frac{dx}{dt}=${fmt(-x / y, 2)}\text{ m/s}$`;
    },
  });

export const taxas: UnitDef = {
  id: 'c-taxa',
  title: 'Derivada como taxa de variação',
  subtitle: 'Movimento, diferenciabilidade, derivação implícita e taxas relacionadas',
  icon: '⚡',
  source: 'Cálculo I · Unidade 3 — Derivadas e Taxas de Variação',
  guide: t`Toda derivada mede a **velocidade com que uma grandeza responde a outra**: posição vira velocidade e aceleração, curvas implícitas revelam sua inclinação sem isolar $y$, e a regra da cadeia no tempo conecta taxas de variáveis acopladas. Também vemos quando uma função tem "bico" ou tangente vertical e não pode ser derivada.`,
  lessons: [
    {
      id: 'c-taxa-fis',
      title: 'Interpretação física e derivadas superiores',
      parts: [
        {
          card: {
            title: 'Taxa média × taxa instantânea',
            body: t`Se $y=f(x)$ mede uma grandeza física (posição, carga, volume, temperatura), temos duas taxas:

• **Taxa média** em $[t_1,\,t_2]$: $\dfrac{\Delta y}{\Delta t}=\dfrac{f(t_2)-f(t_1)}{t_2-t_1}$ (inclinação da **secante**)
• **Taxa instantânea** em $t$: $f'(t)=\dfrac{dy}{dt}=\lim_{\Delta t\to 0}\dfrac{\Delta y}{\Delta t}$ (inclinação da **tangente**)

Na engenharia, cada derivada tem nome próprio: corrente elétrica $I(t)=q'(t)$, vazão $Q(t)=V'(t)$, potência $P(t)=E'(t)$ e custo marginal $C'(x)$.`,
            formula: t`\frac{dy}{dt}=\lim_{\Delta t\to 0}\frac{y(t+\Delta t)-y(t)}{\Delta t}`,
            example: t`Se $s(t)=5t^2\text{ m}$, a velocidade média em $[1,\,3]$ é $\frac{5(9)-5(1)}{3-1}=20\text{ m/s}$, mas a instantânea em $t=1$ é $s'(1)=10(1)=10\text{ m/s}$.`,
            tip: t`A unidade de $\dfrac{dy}{dx}$ é sempre a **unidade de $y$ dividida pela unidade de $x$** (ex.: $\text{m/s}$, $\text{L/min}$, $\text{C/s}=\text{A}$).`,
          },
          exercises: [
            mcqS(
              t`Geometricamente, a taxa de variação **média** no intervalo $[a,\,b]$ e a taxa **instantânea** em $x=a$ correspondem às inclinações…`,
              'da reta secante e da reta tangente',
              ['da reta tangente e da reta secante', 'de duas retas horizontais', 'da reta normal e da secante', 'do eixo x e do eixo y'],
              t`A taxa média liga dois pontos (secante); no limite $\Delta x\to 0$, vira a inclinação num único ponto (tangente).`,
            ),
            match(
              t`Ligue cada derivada ao seu significado físico na engenharia:`,
              [
                [t`$s'(t)=\dfrac{ds}{dt}$`, 'Velocidade instantânea'],
                [t`$q'(t)=\dfrac{dq}{dt}$`, 'Corrente elétrica'],
                [t`$V'(t)=\dfrac{dV}{dt}$`, 'Vazão volumétrica'],
                [t`$E'(t)=\dfrac{dE}{dt}$`, 'Potência instantânea'],
              ],
              t`Velocidade é taxa de posição; corrente é carga por tempo; vazão é volume por tempo; potência é energia por tempo.`,
            ),
            gen((rng) => {
              const a = randInt(rng, 2, 6);
              const t1 = randInt(rng, 1, 3);
              const t2 = t1 + randInt(rng, 1, 3);
              const vm = a * (t1 + t2);
              return num(
                t`Uma partícula tem posição $s(t)=${a}t^2$ (em metros). Qual a **velocidade média** entre $t=${t1}\text{ s}$ e $t=${t2}\text{ s}$?`,
                vm,
                t`$v_{\text{m}}=\frac{s(${t2})-s(${t1})}{${t2}-${t1}}=\frac{${a * t2 * t2}-${a * t1 * t1}}{${t2 - t1}}=${vm}\text{ m/s}$.`,
                { unit: 'm/s' },
              );
            }),
            gen((rng) => {
              const a = randInt(rng, 2, 6);
              const b = randInt(rng, 1, 8);
              const t0 = randInt(rng, 1, 5);
              const ans = 2 * a * t0 + b;
              return num(
                t`A carga elétrica que atravessa um fio é $q(t)=${a}t^2+${b}t$ (em coulombs). Qual a **corrente instantânea** $I(t)=q'(t)$ em $t=${t0}\text{ s}$?`,
                ans,
                t`$I(t)=q'(t)=${2 * a}t+${b}$. Em $t=${t0}$: $I(${t0})=${2 * a}\cdot ${t0}+${b}=${ans}\text{ A}$.`,
                { unit: 'A' },
              );
            }),
            tf(
              t`Se um tanque esvazia, o volume $V(t)$ diminui com o tempo e a taxa $\dfrac{dV}{dt}$ é **negativa**.`,
              true,
              t`Grandeza diminuindo tem derivada negativa; crescendo tem derivada positiva.`,
            ),
            mcqS(
              t`Se $T(t)$ é a temperatura de um reator em graus Celsius ($^\circ\text{C}$) após $t$ minutos, o que significa $T'(10)=-1{,}5$?`,
              t`No instante $t=10\text{ min}$, a temperatura cai à razão de $1{,}5\,^\circ\text{C/min}$`,
              [
                t`A temperatura em $t=10\text{ min}$ vale $-1{,}5\,^\circ\text{C}$`,
                t`Nos primeiros $10\text{ min}$, a temperatura caiu $1{,}5\,^\circ\text{C}$ no total`,
                t`O reator leva $1{,}5\text{ min}$ para esfriar $10\,^\circ\text{C}$`,
                t`A temperatura está subindo $1{,}5\,^\circ\text{C/min}$`,
              ],
              t`A derivada dá a taxa instantânea em $t=10$ (em $^\circ\text{C/min}$), e o sinal negativo indica resfriamento.`,
            ),
            gen((rng) => {
              const c0 = randInt(rng, 100, 300);
              const b = randInt(rng, 10, 30);
              const a = pick(rng, [1, 2, 3]);
              const x0 = randInt(rng, 5, 15);
              const ans = 2 * a * x0 + b;
              return num(
                t`O custo para fabricar $x$ peças é $C(x)=${a === 1 ? '' : a}x^2+${b}x+${c0}$ reais. Calcule o **custo marginal** $C'(${x0})$.`,
                ans,
                t`$C'(x)=${2 * a}x+${b}$. Em $x=${x0}$: $C'(${x0})=${2 * a}\cdot ${x0}+${b}=${ans}$ reais por peça.`,
              );
            }),
            num(
              t`O volume de água num reservatório é $V(t)=100-4t^2$ (em litros, com $t$ em minutos). Com que taxa instantânea $\dfrac{dV}{dt}$ o volume varia em $t=3\text{ min}$?`,
              -24,
              t`$V'(t)=-8t\Rightarrow V'(3)=-24\text{ L/min}$ (negativo porque está esvaziando).`,
              { unit: 'L/min' },
            ),
          ],
        },
        {
          card: {
            title: 'Posição, velocidade e aceleração',
            body: t`No movimento retilíneo com posição $s(t)$:

• **Velocidade**: $v(t)=s'(t)=\dfrac{ds}{dt}$
  — $v(t)>0$: avança · $v(t)<0$: recua · $v(t)=0$: **para** (possível inversão de sentido)
• **Aceleração**: $a(t)=v'(t)=s''(t)=\dfrac{d^2s}{dt^2}$

Teste no laboratório a trajetória $s(t)=t^3-6t^2+9t$:`,
            visual: motionLab(),
            formula: t`v(t)=s'(t)\qquad a(t)=v'(t)=s''(t)`,
            tip: t`A partícula **acelera** (ganha rapidez) quando $v$ e $a$ têm o **mesmo sinal**, e **freia** quando $v$ e $a$ têm **sinais opostos**.`,
          },
          exercises: [
            inter(
              t`Mova o controle de tempo $t$ até o **primeiro** instante em que a partícula para e inverte o sentido ($v(t)=0$).`,
              'plot',
              motionLab().props,
              (v: any) => v && near(v.p.t, 1, 0.05),
              t`$t=1\text{ s}$`,
              t`$v(t)=3t^2-12t+9=3(t-1)(t-3)=0$. O primeiro instante de parada é $t=1\text{ s}$ (onde $s=4\text{ m}$).`,
            ),
            fill(
              t`Complete a cadeia cinemática:`,
              t`A derivada da posição $s(t)$ é a ___ $v(t)$, e a derivada de $v(t)$ é a ___ $a(t)$.`,
              ['velocidade', 'aceleração'],
              ['distância', 'força', 'energia'],
              t`$v(t)=s'(t)$ e $a(t)=v'(t)=s''(t)$.`,
            ),
            tf(
              t`Uma partícula em movimento retilíneo para instantaneamente sempre que $v(t)=s'(t)=0$.`,
              true,
              t`Velocidade instantânea nula significa repouso naquele instante (como no ponto mais alto de um lançamento vertical).`,
            ),
            gen((rng) => {
              const a = randInt(rng, 1, 3);
              const b = randInt(rng, -5, 5);
              const c = randInt(rng, -6, 6);
              const t0 = randInt(rng, 1, 3);
              const vt = 3 * a * t0 * t0 + 2 * b * t0 + c;
              return num(
                t`Se $s(t)=${polyTex([0, c, b, a], 't')}$ (em metros), qual a velocidade $v(${t0})$?`,
                vt,
                t`$v(t)=s'(t)=${polyTex([c, 2 * b, 3 * a], 't')}$. Em $t=${t0}$: $v(${t0})=${vt}\text{ m/s}$.`,
                { unit: 'm/s' },
              );
            }),
            gen((rng) => {
              const a = randInt(rng, 1, 4);
              const b = randInt(rng, -6, 6);
              const t0 = randInt(rng, 1, 4);
              const at = 6 * a * t0 + 2 * b;
              return num(
                t`Se $s(t)=${polyTex([2, -3, b, a], 't')}$ (m), qual a aceleração $a(${t0})$?`,
                at,
                t`$v(t)=${3 * a}t^2${term(2 * b, 't')}-3$ e $a(t)=s''(t)=${6 * a}t${term(2 * b, '')}$. Em $t=${t0}$: $a(${t0})=${at}\text{ m/s}^2$.`,
                { unit: 'm/s²' },
              );
            }),
            gen((rng) => {
              const v0 = pick(rng, [10, 20, 30, 40]);
              const tStop = v0 / 10;
              return num(
                t`Uma pedra é lançada para cima com altura $h(t)=${v0}t-5t^2$ (m). Em que instante $t$ ela atinge a altura máxima?`,
                tStop,
                t`No topo a velocidade zera: $h'(t)=${v0}-10t=0\Rightarrow t=${tStop}\text{ s}$.`,
                { unit: 's' },
              );
            }),
            mcqS(
              t`Para $s(t)=t^3-6t^2+9t$, em qual intervalo de tempo a partícula se move **para trás** ($v(t)<0$)?`,
              t`$(1,\,3)$`,
              [t`$(0,\,1)$`, t`$(3,\,\infty)$`, t`$(0,\,3)$`, t`$(2,\,4)$`],
              t`$v(t)=3(t-1)(t-3)<0$ entre as raízes $t=1$ e $t=3$.`,
            ),
            mcqS(
              t`Em um instante em que $v(t)=-4\text{ m/s}$ e $a(t)=-2\text{ m/s}^2$, o módulo da velocidade (rapidez) da partícula está…`,
              'aumentando (movimento acelerado para trás)',
              [
                'diminuindo (freando)',
                'constante, pois a aceleração é negativa',
                'zero, pois as taxas se cancelam',
                'mudando de sentido',
              ],
              t`Como $v$ e $a$ têm o **mesmo sinal** (ambos negativos), a rapidez $|v|$ está aumentando no sentido negativo.`,
            ),
          ],
        },
        {
          card: {
            title: 'Derivadas de ordem superior',
            body: t`Derivar repetidamente gera as derivadas de ordem $n$, escritas $f''(x)$, $f'''(x)$, $f^{(4)}(x),\ldots,f^{(n)}(x)$ ou $\dfrac{d^ny}{dx^n}$:

• **Polinômio de grau $m$**: para $n>m$, $f^{(n)}(x)=0$ e $(x^n)^{(n)}=n!$
• **Exponencial**: $(e^{kx})^{(n)}=k^n e^{kx}$
• **Seno e cosseno** repetem-se num **ciclo de 4**:
  $$\operatorname{sen}x \to \cos x \to -\operatorname{sen}x \to -\cos x \to \operatorname{sen}x$$`,
            formula: t`\frac{d^n}{dx^n}\left(e^{kx}\right)=k^n e^{kx}\qquad \frac{d^n}{dx^n}(x^n)=n!`,
            example: t`Para achar $(\operatorname{sen}x)^{(50)}$, divida $50$ por $4$: resto $2$. Dando $2$ passos no ciclo: $\operatorname{sen}x\to\cos x\to-\operatorname{sen}x$.`,
            tip: t`Em mecânica, a 3ª derivada da posição $j(t)=s'''(t)$ é a **arrancada** (*jerk*), controlada em elevadores e montanhas-russas para evitar trancos.`,
          },
          exercises: [
            mcqS(
              t`Na notação de Leibniz, como se escreve a **segunda derivada** de $y$ em relação a $x$?`,
              t`$\dfrac{d^2y}{dx^2}$`,
              [t`$\dfrac{dy^2}{dx^2}$`, t`$\left(\dfrac{dy}{dx}\right)^2$`, t`$\dfrac{d^2y}{dx}$`, t`$\dfrac{dy}{d^2x}$`],
              t`É $\frac{d}{dx}\left(\frac{dy}{dx}\right)=\frac{d^2y}{dx^2}$. Note que $\left(\frac{dy}{dx}\right)^2$ seria o quadrado da 1ª derivada!`,
            ),
            gen((rng) => {
              const a = randInt(rng, 1, 4);
              const b = randInt(rng, -4, 4);
              return num(
                t`Calcule $f'''(x)$ para $f(x)=${a}x^3${term(b, 'x^2')}+7x-5$.`,
                6 * a,
                t`$f'(x)=${3 * a}x^2${term(2 * b, 'x')}+7 \Rightarrow f''(x)=${6 * a}x${term(2 * b, '')} \Rightarrow f'''(x)=${6 * a}$.`,
              );
            }),
            num(
              t`Quanto vale a $5^\text{a}$ derivada $f^{(5)}(x)$ de $f(x)=9x^4-3x^3+12x-1$?`,
              0,
              t`O polinômio tem grau $4$: após $4$ derivadas sobra a constante $9\cdot 4!=216$, e a $5^\text{a}$ derivada é $0$.`,
            ),
            gen((rng) => {
              const k = randInt(rng, 2, 4);
              const n = randInt(rng, 2, 4);
              const kn = k ** n;
              return rmcq(
                rng,
                t`Qual é a derivada de ordem $${n}$, $f^{(${n})}(x)$, de $f(x)=e^{${k}x}$?`,
                t`$${kn}e^{${k}x}$`,
                [t`$${k * n}e^{${k}x}$`, t`$e^{${k}x}$`, t`$${kn}xe^{${k}x}$`, t`$${k}^{${n - 1}}e^{${k}x}$`],
                t`Cada derivação desce um fator $${k}$ pela regra da cadeia: $f^{(${n})}(x)=${k}^{${n}}e^{${k}x}=${kn}e^{${k}x}$.`,
              );
            }),
            match(
              t`Ligue cada derivada de $f(x)=\operatorname{sen}x$ ao resultado no ciclo de 4:`,
              [
                [t`$f'(x)$`, t`$\cos x$`],
                [t`$f''(x)$`, t`$-\operatorname{sen}x$`],
                [t`$f'''(x)$`, t`$-\cos x$`],
                [t`$f^{(4)}(x)$`, t`$\operatorname{sen}x$`],
              ],
              t`A cada $4$ derivadas, seno e cosseno voltam exatamente à função original.`,
            ),
            gen((rng) => {
              const q = randInt(rng, 5, 25);
              const r = randInt(rng, 0, 3);
              const n = 4 * q + r;
              const cycle = ['\\operatorname{sen}x', '\\cos x', '-\\operatorname{sen}x', '-\\cos x'] as const;
              const ans = `$${cycle[r]}$`;
              const wrong = cycle.filter((_, i) => i !== r).map((s) => `$${s}$`);
              return rmcq(
                rng,
                t`Usando o ciclo de tamanho $4$, qual é a derivada de ordem $${n}$ de $f(x)=\operatorname{sen}x$?`,
                ans,
                [...wrong, `$${n}\\cos x$`],
                t`$${n}=4\cdot ${q}+${r}$ (resto $${r}$), logo $f^{(${n})}(x)=f^{(${r})}(x)=${cycle[r]}$.`,
              );
            }),
            mcqS(
              t`Qual é a $n$-ésima derivada de $f(x)=\dfrac{1}{x}=x^{-1}$?`,
              t`$(-1)^n\dfrac{n!}{x^{n+1}}$`,
              [t`$\dfrac{n!}{x^{n+1}}$`, t`$(-1)^n\dfrac{1}{x^{n+1}}$`, t`$-\dfrac{n}{x^{n+1}}$`, t`$(-1)^{n+1}\dfrac{n!}{x^n}$`],
              t`$f'=-1\cdot x^{-2}$, $f''=(-1)(-2)x^{-3}=2!\,x^{-3}$, $f'''=-3!\,x^{-4},\ldots,f^{(n)}=(-1)^n n!\,x^{-(n+1)}$.`,
            ),
            num(
              t`Se $y=\cos(2x)$, quanto vale $y''(0)$?`,
              -4,
              t`$y'=-2\operatorname{sen}(2x)$ e $y''=-4\cos(2x)\Rightarrow y''(0)=-4\cos(0)=-4$.`,
            ),
          ],
        },
      ],
    },
    {
      id: 'c-taxa-dif',
      title: 'Diferenciabilidade e continuidade',
      parts: [
        {
          card: {
            title: 'Quando a derivada existe (e quando falha)',
            body: t`$f$ é **diferenciável** em $x=a$ quando as derivadas laterais existem, são finitas e coincidem: $f'_-(a)=f'_+(a)$.

• **Teorema**: toda função diferenciável em $a$ é **contínua** em $a$.
• **Cuidado**: a recíproca é **falsa**! Uma função contínua falha em ter derivada em 3 formatos clássicos:
  1. **Bico (quina)**: $f(x)=|x|$ em $x=0$ ($f'_-=-1\ne f'_+=+1$)
  2. **Tangente vertical**: $f(x)=\sqrt[3]{x}=x^{1/3}$ em $x=0$ ($f'\to +\infty$)
  3. **Cúspide**: $f(x)=x^{2/3}$ em $x=0$ ($f'_-\to -\infty$ e $f'_+\to +\infty$)`,
            visual: kinkLab(),
            formula: t`\text{Diferenciável em }a \implies \text{Contínua em }a`,
            tip: t`Pela contrapositiva: se $f$ **não é contínua** em $a$, ela **jamais** será diferenciável em $a$!`,
          },
          exercises: [
            inter(
              t`Diminua $h$ até perto de zero ($h\le 0{,}15$) e veja que em $f(x)=|x|$ as secantes à esquerda ($-1$) e à direita ($+1$) nunca se alinham.`,
              'plot',
              kinkLab().props,
              (v: any) => v && v.p.h <= 0.15,
              t`$h\le 0{,}15$`,
              t`Por menor que seja $h$, a inclinação à esquerda vale $-1$ e à direita vale $+1$: o limite não existe.`,
            ),
            tf(
              t`Se uma função $f$ é contínua em $x=a$, então ela é obrigatoriamente diferenciável em $x=a$.`,
              false,
              t`Contraexemplo clássico: $f(x)=|x|$ é contínua em $x=0$, mas tem um bico e não possui derivada em $0$.`,
            ),
            tf(
              t`Se uma função $f$ é diferenciável em $x=a$, então $\lim_{x\to a}f(x)=f(a)$ (ela é contínua em $a$).`,
              true,
              t`Para existir reta tangente bem definida, o gráfico não pode ter salto nem buraco no ponto.`,
            ),
            match(
              t`Ligue cada função ao motivo pelo qual $f'(0)$ **não existe**:`,
              [
                [t`$f(x)=|x|$`, 'Bico: derivadas laterais $-1$ e $+1$'],
                [t`$f(x)=\sqrt[3]{x}=x^{1/3}$`, 'Tangente vertical: $f\'(x)\to +\infty$'],
                [t`$f(x)=x^{2/3}$`, 'Cúspide: $f\'_-\to -\infty$ e $f\'_+\to +\infty$'],
                [t`$f(x)=\dfrac{1}{x}$`, 'Descontínua em $x=0$'],
              ],
              t`Bico tem laterais finitas distintas; $\sqrt[3]{x}$ tem tangente vertical; $x^{2/3}$ tem cúspide; $1/x$ nem existe em $0$.`,
            ),
            gen((rng) => {
              const a = randNZ(rng, -7, 7);
              return num(
                t`Em que valor de $x$ a função $f(x)=|x${term(-a, '')}|$ é **contínua, mas não diferenciável**?`,
                a,
                t`O bico do módulo ocorre onde o interior zera: $x${term(-a, '')}=0\iff x=${a}$.`,
              );
            }),
            gen((rng) => {
              const k = randInt(rng, 2, 6);
              const a = randInt(rng, -4, 4);
              const side = pick(rng, ['esq', 'dir'] as const);
              const ans = side === 'esq' ? -k : k;
              return num(
                t`Para $f(x)=${k}|x${term(-a, '')}|$, quanto vale a derivada lateral à **${side === 'esq' ? 'esquerda' : 'direita'}** em $x=${a}$?`,
                ans,
                side === 'esq'
                  ? t`Para $x<${a}$, $f(x)=-${k}(x${term(-a, '')})$, cuja derivada é $-${k}$.`
                  : t`Para $x>${a}$, $f(x)=${k}(x${term(-a, '')})$, cuja derivada é $+${k}$.`,
              );
            }),
            multi(
              t`Quais afirmações são **sempre verdadeiras** para uma função $f$ num ponto $x=a$?`,
              [
                'Se $f$ é diferenciável em $a$, então $f$ é contínua em $a$',
                'Se $f$ é descontínua em $a$, então $f$ não é diferenciável em $a$',
                'Se $f$ é contínua em $a$, então $f$ é diferenciável em $a$',
                'Se $f\'_-(a)=f\'_+(a)\in\mathbb R$, então $f\'(a)$ existe',
              ],
              [0, 1, 3],
              t`Diferenciável $\Rightarrow$ contínua (e descontínua $\Rightarrow$ não diferenciável). Só "contínua $\Rightarrow$ diferenciável" é falsa.`,
            ),
            mcqS(
              t`Por que $f(x)=\sqrt[3]{x}=x^{1/3}$ não é diferenciável em $x=0$, embora seja contínua em todo $\mathbb R$?`,
              t`Porque $f'(x)=\dfrac{1}{3x^{2/3}}\to +\infty$ quando $x\to 0$ (tangente vertical)`,
              [
                t`Porque as derivadas laterais valem $-1$ e $+1$`,
                t`Porque $\sqrt[3]{x}$ não existe para $x<0$`,
                t`Porque $\lim_{x\to 0}\sqrt[3]{x}$ não existe`,
                t`Porque $f'(0)=0$`,
              ],
              t`Em $x=0$ a inclinação explode para $+\infty$ dos dois lados: a reta tangente é o próprio eixo $y$ (vertical).`,
            ),
          ],
        },
        {
          card: {
            title: 'Funções por partes: emenda suave',
            body: t`Para que uma função definida por partes em $x=x_0$ seja **diferenciável** no ponto de emenda, ela precisa passar por **dois testes** na ordem:

1. **Continuidade** (sem salto): $\lim_{x\to x_0^-}f(x)=\lim_{x\to x_0^+}f(x)$
2. **Derivadas laterais iguais** (sem bico): $f'_-(x_0)=f'_+(x_0)$

Ajuste $a$ e $b$ abaixo para que $x^2$ ($x\le 1$) e $ax+b$ ($x>1$) tenham emenda suave em $x=1$:`,
            visual: smoothJoinLab(),
            example: t`Em $x=1$ para $x^2$ e $ax+b$: mesma inclinação $\Rightarrow 2(1)=a\Rightarrow a=2$; mesmo valor $\Rightarrow 1^2=2(1)+b\Rightarrow b=-1$.`,
            tip: t`Se uma função por partes já falha na **continuidade** (tem salto), pare aí: ela já **não é diferenciável**, mesmo que as inclinações dos dois lados sejam iguais!`,
          },
          exercises: [
            inter(
              t`Ajuste $a$ e $b$ para que $f(x)=\begin{cases}x^2,&x\le 1\\ ax+b,&x>1\end{cases}$ seja **diferenciável** em $x=1$.`,
              'plot',
              smoothJoinLab().props,
              (v: any) => v && near(v.p.a, 2, 0.05) && near(v.p.b, -1, 0.05),
              t`$a=2$ e $b=-1$`,
              t`Derivadas iguais em $x=1$: $2(1)=a\Rightarrow a=2$. Valores iguais em $x=1$: $1=2(1)+b\Rightarrow b=-1$.`,
            ),
            order(
              t`Ordene o roteiro para achar $a$ e $b$ que tornam $f(x)=\begin{cases}g(x),&x\le c\\ ax+b,&x>c\end{cases}$ diferenciável em $x=c$:`,
              [
                t`Igualar os limites laterais $g(c)=ac+b$ (continuidade)`,
                t`Derivar cada ramo e igualar $g'(c)=a$ (mesma inclinação)`,
                t`Substituir $a$ na equação de continuidade para isolar $b$`,
                t`Conferir que não há salto nem bico em $x=c$`,
              ],
              t`Continuidade garante que os ramos se tocam; derivadas iguais garantem que se tocam sem formar quina.`,
            ),
            tf(
              t`A função $f(x)=\begin{cases}2x,&x<1\\ 2x+3,&x\ge 1\end{cases}$ é diferenciável em $x=1$, pois a derivada vale $2$ dos dois lados.`,
              false,
              t`Pegadinha clássica! Apesar de a inclinação ser $2$ dos dois lados, há um **salto** em $x=1$ ($2\ne 5$): como não é contínua, não é diferenciável.`,
            ),
            mcqS(
              t`Sobre $f(x)=\begin{cases}x^2,&x\le 0\\ x,&x>0\end{cases}$ em $x=0$, é correto afirmar que:`,
              t`É contínua em $x=0$, mas não é diferenciável ($f'_-(0)=0\ne f'_+(0)=1$)`,
              [
                t`É diferenciável em $x=0$ com $f'(0)=0$`,
                t`É descontínua em $x=0$`,
                t`É diferenciável em $x=0$ com $f'(0)=1$`,
                t`Tem tangente vertical em $x=0$`,
              ],
              t`Os dois ramos valem $0$ em $x=0$ (contínua), mas as inclinações são $2(0)=0$ à esquerda e $1$ à direita (bico).`,
            ),
            gen((rng) => {
              const c = randInt(rng, 1, 4);
              const k = randInt(rng, 1, 3);
              const a = 2 * k * c;
              return num(
                t`Para que $f(x)=\begin{cases}${k === 1 ? '' : k}x^2,&x\le ${c}\\ ax+b,&x>${c}\end{cases}$ seja diferenciável em $x=${c}$, qual deve ser o valor de $a$?`,
                a,
                t`Igualando as derivadas laterais em $x=${c}$: $f'_-(${c})=${2 * k}\cdot ${c}=${a}$ e $f'_+(${c})=a\Rightarrow a=${a}$.`,
              );
            }),
            gen((rng) => {
              const c = randInt(rng, 1, 4);
              const k = randInt(rng, 1, 3);
              const a = 2 * k * c;
              const b = k * c * c - a * c;
              return num(
                t`Para que $f(x)=\begin{cases}${k === 1 ? '' : k}x^2,&x\le ${c}\\ ax+b,&x>${c}\end{cases}$ seja diferenciável em $x=${c}$, qual deve ser o valor de $b$?`,
                b,
                t`Da derivada temos $a=${2 * k}c=${a}$. Da continuidade em $x=${c}$: $${k * c * c}=${a}\cdot ${c}+b\Rightarrow b=${b}$.`,
              );
            }),
            gen((rng) => {
              const a = randInt(rng, 2, 5);
              // f(x) = e^(ax) for x <= 0, mx + n for x > 0 => n = 1, m = a, m + n = a + 1
              return num(
                t`Se $f(x)=\begin{cases}e^{${a}x},&x\le 0\\ mx+n,&x>0\end{cases}$ é diferenciável em $x=0$, quanto vale $m+n$?`,
                a + 1,
                t`Continuidade em $x=0$: $e^0=0+n\Rightarrow n=1$. Derivadas iguais em $x=0$: $${a}e^0=m\Rightarrow m=${a}$. Logo $m+n=${a + 1}$.`,
              );
            }),
            num(
              t`Se $f(x)=\begin{cases}ax^2+bx,&x\le 1\\ 3x-1,&x>1\end{cases}$ é diferenciável em $x=1$, quanto vale $a$?`,
              1,
              t`Continuidade: $a+b=2$. Derivadas iguais em $x=1$: $2a+b=3$. Subtraindo a 1ª da 2ª: $a=3-2=1$ (e $b=1$).`,
            ),
          ],
        },
      ],
    },
    {
      id: 'c-taxa-impl',
      title: 'Derivação implícita e inversas',
      parts: [
        {
          card: {
            title: 'Derivando sem isolar y',
            body: t`Em curvas como a circunferência $x^2+y^2=25$, $y$ não é uma única função explícita de $x$. Na **derivação implícita**, tratamos $y=y(x)$ e derivamos ambos os lados em relação a $x$ usando a **regra da cadeia** sempre que derivamos $y$:

$$\frac{d}{dx}\left(y^n\right)=n\,y^{n-1}\cdot \frac{dy}{dx}\qquad \frac{d}{dx}(xy)=y+x\,\frac{dy}{dx}$$

Na circunferência $x^2+y^2=r^2$: $2x+2y\,\frac{dy}{dx}=0 \implies \dfrac{dy}{dx}=-\dfrac{x}{y}$. Arraste $P$ abaixo:`,
            visual: circleImplicitLab(),
            formula: t`x^2+y^2=r^2 \implies \frac{dy}{dx}=-\frac{x}{y}`,
            tip: t`Derivar $x^2$ em relação a $x$ dá $2x$; derivar $y^2$ em relação a $x$ dá $2y\cdot y'$ (a derivada "de fora" $2y$ vezes a "de dentro" $y'$).`,
          },
          exercises: [
            inter(
              t`Arraste $P$ sobre $x^2+y^2=25$ até o ponto do **1º quadrante** onde a reta tangente tem inclinação $\dfrac{dy}{dx}=-0{,}75$.`,
              'plot',
              circleImplicitLab().props,
              (v: any) => v && near(v.pts.P.x, 3, 0.45) && near(v.pts.P.y, 4, 0.45),
              t`$P=(3,\,4)$`,
              t`Em $P=(3,\,4)$, temos $3^2+4^2=25$ e $\frac{dy}{dx}=-\frac{3}{4}=-0{,}75$.`,
            ),
            mcqS(
              t`Derive $y^3$ em relação a $x$, sabendo que $y=y(x)$:`,
              t`$3y^2\,\dfrac{dy}{dx}$`,
              [t`$3y^2$`, t`$3x^2\,\dfrac{dy}{dx}$`, t`$y^3\,\dfrac{dy}{dx}$`, t`$3y\,\dfrac{dy}{dx}$`],
              t`Pela regra da cadeia, deriva-se a potência ($3y^2$) e multiplica-se pela derivada da função interna ($\frac{dy}{dx}$).`,
            ),
            mcqS(
              t`Qual é a derivada $\dfrac{d}{dx}(x\,y)$ quando $y=y(x)$?`,
              t`$y+x\,\dfrac{dy}{dx}$`,
              [t`$\dfrac{dy}{dx}$`, t`$x\,\dfrac{dy}{dx}$`, t`$y\,\dfrac{dy}{dx}$`, t`$1+\dfrac{dy}{dx}$`],
              t`Regra do produto: $(x)'y+x(y)'=1\cdot y+x\,y'$.`,
            ),
            match(
              t`Ligue cada termo à sua derivada em relação a $x$ (com $y=y(x)$ e $y'=dy/dx$):`,
              [
                [t`$y^2$`, t`$2y\,y'$`],
                [t`$x^2$`, t`$2x$`],
                [t`$\operatorname{sen}y$`, t`$(\cos y)\,y'$`],
                [t`$e^y$`, t`$e^y\,y'$`],
              ],
              t`Termos em $x$ derivam normalmente; termos em $y$ ganham o fator $y'$ pela regra da cadeia.`,
            ),
            gen((rng) => {
              const x0 = randNZ(rng, -5, 5);
              const y0 = randNZ(rng, 2, 6);
              return num(
                t`Na circunferência $x^2+y^2=${x0 * x0 + y0 * y0}$, quanto vale $\dfrac{dy}{dx}$ no ponto $(${x0},\,${y0})$? (fração ou decimal)`,
                -x0 / y0,
                t`$2x+2y\,y'=0\Rightarrow y'=-\frac{x}{y}=-\frac{${x0}}{${y0}}=${fmt(-x0 / y0, 3)}$.`,
                { tol: 0.005 },
              );
            }),
            gen((rng) => {
              const [a, b] = pick(rng, [[2, 3], [3, 2], [3, 5], [4, 3], [5, 2], [2, 5], [5, 4]] as const);
              return rmcq(
                rng,
                t`Derivando implicitamente $${a}x^2+${b}y^2=1$, obtemos $\dfrac{dy}{dx}=$`,
                t`$-\dfrac{${a}x}{${b}y}$`,
                [
                  t`$\dfrac{${a}x}{${b}y}$`,
                  t`$-\dfrac{${b}x}{${a}y}$`,
                  t`$-\dfrac{${a}y}{${b}x}$`,
                  t`$-\dfrac{${a * a}x}{${b * b}y}$`,
                ],
                t`$${2 * a}x+${2 * b}y\,y'=0\Rightarrow y'=-\frac{${a}x}{${b}y}$.`,
              );
            }),
            tf(
              t`Nos pontos onde a circunferência $x^2+y^2=r^2$ corta o eixo $x$ ($y=0$), a reta tangente é **vertical**.`,
              true,
              t`Em $(\pm r,\,0)$, o denominador de $\frac{dy}{dx}=-\frac{x}{y}$ zera enquanto $x\ne 0$: a tangente é vertical.`,
            ),
            num(
              t`A reta tangente a $x^2+y^2=25$ no ponto $(3,\,4)$ tem equação $y=mx+n$. Quanto vale $n$?`,
              6.25,
              t`$m=-\frac{3}{4}=-0{,}75$. Então $y-4=-\frac{3}{4}(x-3)\Rightarrow y=-0{,}75x+\frac{25}{4}$, logo $n=\frac{25}{4}=6{,}25$.`,
              { tol: 0.01 },
            ),
          ],
        },
        {
          card: {
            title: 'Tangentes a curvas implícitas gerais',
            body: t`Para achar $\dfrac{dy}{dx}$ num ponto $(x_0,\,y_0)$ de uma curva implícita qualquer:

1. Derive ambos os lados em relação a $x$ (usando produto e cadeia onde houver $y$)
2. **Dica de ouro**: se o problema pede apenas o valor numérico $y'(x_0)$, substitua $x=x_0$ e $y=y_0$ **imediatamente após derivar**, antes de isolar $y'$!
3. Tangente **horizontal**: numerador de $y'$ igual a $0$ · **vertical**: denominador igual a $0$.`,
            example: t`Em $x^3+y^3=6xy$ no ponto $(3,\,3)$: $3x^2+3y^2y'=6y+6xy'$. Substituindo $(3,\,3)$: $27+27y'=18+18y'\Rightarrow 9y'=-9\Rightarrow y'=-1$.`,
            tip: t`Substituir $(x_0,\,y_0)$ logo depois de derivar troca álgebra pesada por aritmética simples e evita erros de sinal!`,
          },
          exercises: [
            order(
              t`Ordene os passos para encontrar $\dfrac{dy}{dx}$ de uma equação implícita:`,
              [
                t`Derivar ambos os lados em relação a $x$, multiplicando por $y'$ ao derivar $y$`,
                t`Passar todos os termos com $y'$ para a esquerda e os demais para a direita`,
                t`Colocar $y'$ em evidência no lado esquerdo`,
                t`Dividir pelo fator que multiplica $y'$ para isolá-lo`,
              ],
              t`Depois de derivar, a equação é sempre **linear** em $y'$: basta agrupar, pôr em evidência e dividir.`,
            ),
            gen((rng) => {
              const x0 = randInt(rng, 1, 5);
              const y0 = randInt(rng, 1, 5);
              const k = x0 * y0;
              return num(
                t`Na hipérbole $x\,y=${k}$, quanto vale $\dfrac{dy}{dx}$ no ponto $(${x0},\,${y0})$? (fração ou decimal)`,
                -y0 / x0,
                t`$y+x\,y'=0\Rightarrow y'=-\frac{y}{x}=-\frac{${y0}}{${x0}}=${fmt(-y0 / x0, 3)}$.`,
                { tol: 0.005 },
              );
            }),
            gen((rng) => {
              const a = randInt(rng, 1, 4);
              const b = randInt(rng, 1, 4);
              // x^2 + a*x*y + y^2 = b + 2 + a at (1, 1) => 2x + a*y + a*x*y' + 2y*y' = 0 => at (1,1): (2+a) + (a+2)y' = 0 => y' = -1
              const c = 2 + a * b + b * b; // at (1, b): 2(1) + a*b + a(1)y' + 2b*y' = 0 => y' = -(2 + ab)/(a + 2b)
              const ans = -(2 + a * b) / (a + 2 * b);
              return num(
                t`Dada a curva $x^2+${a === 1 ? '' : a}xy+y^2=${c - 1}$, calcule $\dfrac{dy}{dx}$ no ponto $(1,\,${b})$. (fração ou decimal)`,
                ans,
                t`$2x+${a}y+${a}xy'+2yy'=0$. Em $(1,\,${b})$: $${2 + a * b}+${a + 2 * b}y'=0\Rightarrow y'=-\frac{${2 + a * b}}{${a + 2 * b}}=${fmt(ans, 3)}$.`,
                { tol: 0.005 },
              );
            }),
            num(
              t`No folium de Descartes $x^3+y^3=6xy$, quanto vale a inclinação da reta tangente no ponto $(3,\,3)$?`,
              -1,
              t`$3x^2+3y^2y'=6y+6xy'$. Em $(3,\,3)$: $27+27y'=18+18y'\Rightarrow 9y'=-9\Rightarrow y'=-1$.`,
            ),
            mcqS(
              t`Derivando implicitamente $\operatorname{sen}(y)+x^2=y$, qual expressão fornece $\dfrac{dy}{dx}$?`,
              t`$\dfrac{2x}{1-\cos y}$`,
              [t`$\dfrac{-2x}{1-\cos y}$`, t`$\dfrac{2x}{\cos y}$`, t`$2x-\cos y$`, t`$\dfrac{1-\cos y}{2x}$`],
              t`$(\cos y)\,y'+2x=y'\Rightarrow 2x=y'(1-\cos y)\Rightarrow y'=\frac{2x}{1-\cos y}$.`,
            ),
            gen((rng) => {
              const k = randInt(rng, 1, 5);
              // y^2 = x^3 + k*x at (1, sqrt(1+k)) -> better pick integer point: x^2 + y^2 - 2*k*x = ...
              // Horizontal tangent of x^2 - 2kx + y^2 = 10 occurs when 2x - 2k = 0 => x = k
              return num(
                t`Em que valor de $x$ a curva $x^2-${2 * k}x+y^2=15$ possui retas tangentes **horizontais**?`,
                k,
                t`Derivando: $2x-${2 * k}+2yy'=0\Rightarrow y'=\frac{${k}-x}{y}$. A tangente é horizontal quando $y'=0\iff x=${k}$.`,
              );
            }),
            num(
              t`Se $e^y+xy=e$, quanto vale $\dfrac{dy}{dx}$ no ponto $(0,\,1)$? (use $e\approx 2{,}718$ ou pense na fração $-\frac{1}{e}$, dê 3 casas)`,
              -1 / Math.E,
              t`$e^y y'+y+xy'=0$. Em $(0,\,1)$: $e^1 y'+1+0=0\Rightarrow y'=-\frac{1}{e}\approx -0{,}368$.`,
              { tol: 0.005 },
            ),
            mcqS(
              t`Para $x^2+4y^2=16$, qual é a equação da reta tangente no ponto $(2,\,\sqrt{3})$?`,
              t`$y-\sqrt{3}=-\dfrac{1}{2\sqrt{3}}(x-2)$`,
              [
                t`$y-\sqrt{3}=-\dfrac{2}{\sqrt{3}}(x-2)$`,
                t`$y-\sqrt{3}=\dfrac{1}{2\sqrt{3}}(x-2)$`,
                t`$y-2=-\dfrac{1}{2\sqrt{3}}(x-\sqrt{3})$`,
                t`$y=-\dfrac{1}{2\sqrt{3}}x$`,
              ],
              t`$2x+8yy'=0\Rightarrow y'=-\frac{x}{4y}$. Em $(2,\,\sqrt{3})$: $y'=-\frac{2}{4\sqrt{3}}=-\frac{1}{2\sqrt{3}}$.`,
            ),
          ],
        },
        {
          card: {
            title: 'Derivada da inversa, arco-trigonométricas e x^x',
            body: t`A derivação implícita revela três resultados fundamentais:

1. **Derivada da inversa**: se $y=f^{-1}(x)$, então $f(y)=x \implies f'(y)\,y'=1 \implies (f^{-1})'(x)=\dfrac{1}{f'(f^{-1}(x))}$
2. **Trigonométricas inversas**:
   $$(\operatorname{arcsen}x)'=\frac{1}{\sqrt{1-x^2}}\qquad (\operatorname{arccos}x)'=-\frac{1}{\sqrt{1-x^2}}\qquad (\operatorname{arctg}x)'=\frac{1}{1+x^2}$$
3. **Derivação logarítmica** (base e expoente com $x$, como $y=x^x$): aplique $\ln$ dos dois lados ($\ln y=x\ln x$) e derive implicitamente: $\dfrac{y'}{y}=\ln x+1 \implies (x^x)'=x^x(\ln x+1)$.`,
            formula: t`(\operatorname{arctg}x)'=\frac{1}{1+x^2}\qquad (\operatorname{arcsen}x)'=\frac{1}{\sqrt{1-x^2}}`,
            example: t`De $\operatorname{tg}y=x$, derivando em $x$: $(\sec^2 y)\,y'=1\Rightarrow y'=\frac{1}{\sec^2 y}=\frac{1}{1+\operatorname{tg}^2 y}=\frac{1}{1+x^2}$.`,
            tip: t`Para $f(x)=x^x$, **não** vale $x\cdot x^{x-1}$ (base não é constante) nem $x^x\ln x$ (expoente não é constante)! Use derivação logarítmica.`,
          },
          exercises: [
            match(
              t`Ligue cada função inversa à sua derivada:`,
              [
                [t`$\operatorname{arcsen}x$`, t`$\dfrac{1}{\sqrt{1-x^2}}$`],
                [t`$\operatorname{arccos}x$`, t`$-\dfrac{1}{\sqrt{1-x^2}}$`],
                [t`$\operatorname{arctg}x$`, t`$\dfrac{1}{1+x^2}$`],
                [t`$\ln x$`, t`$\dfrac{1}{x}$`],
              ],
              t`As derivadas de $\operatorname{arcsen}x$, $\operatorname{arccos}x$ e $\operatorname{arctg}x$ são algébricas!`,
            ),
            fill(
              t`Complete a demonstração da derivada de $y=\operatorname{arctg}x$:`,
              t`Como $\operatorname{tg}y=x$, derivando temos $(\sec^2 y)\,y'=1$, logo $y'=\dfrac{1}{\sec^2 y}$, em que $\sec^2 y=$ ___ $=$ ___.`,
              [t`$1+\operatorname{tg}^2 y$`, t`$1+x^2$`],
              [t`$1-\operatorname{sen}^2 y$`, t`$1-x^2$`, t`$\sqrt{1-x^2}$`],
              t`Usamos a identidade pitagórica $\sec^2 y=1+\operatorname{tg}^2 y=1+x^2$.`,
            ),
            gen((rng) => {
              const x0 = randInt(rng, 1, 5);
              const den = 1 + x0 * x0;
              return num(
                t`Sendo $f(x)=\operatorname{arctg}x$, quanto vale $f'(${x0})$? (fração ou decimal)`,
                1 / den,
                t`$f'(x)=\frac{1}{1+x^2}\Rightarrow f'(${x0})=\frac{1}{1+${x0}^2}=\frac{1}{${den}}$.`,
                { tol: 0.002 },
              );
            }),
            gen((rng) => {
              const k = randInt(rng, 2, 6);
              return rmcq(
                rng,
                t`Pela regra da cadeia, qual é a derivada de $f(x)=\operatorname{arctg}(${k}x)$?`,
                t`$\dfrac{${k}}{1+${k * k}x^2}$`,
                [
                  t`$\dfrac{1}{1+${k * k}x^2}$`,
                  t`$\dfrac{${k}}{1+${k}x^2}$`,
                  t`$\dfrac{1}{\sqrt{1-${k * k}x^2}}$`,
                  t`$\dfrac{${k}}{\sqrt{1-${k * k}x^2}}$`,
                ],
                t`$(\operatorname{arctg}u)'=\frac{u'}{1+u^2}=\frac{${k}}{1+(${k}x)^2}=\frac{${k}}{1+${k * k}x^2}$.`,
              );
            }),
            mcqS(
              t`Qual é a derivada de $f(x)=\operatorname{arcsen}(3x)$?`,
              t`$\dfrac{3}{\sqrt{1-9x^2}}$`,
              [t`$\dfrac{1}{\sqrt{1-9x^2}}$`, t`$\dfrac{3}{\sqrt{1-3x^2}}$`, t`$-\dfrac{3}{\sqrt{1-9x^2}}$`, t`$\dfrac{3}{1+9x^2}$`],
              t`$(\operatorname{arcsen}u)'=\frac{u'}{\sqrt{1-u^2}}=\frac{3}{\sqrt{1-(3x)^2}}$.`,
            ),
            gen((rng) => {
              const a = randInt(rng, 1, 5);
              const b = randInt(rng, -4, 6);
              const m = randInt(rng, 2, 8);
              // f(a) = b and f'(a) = m => (f^-1)'(b) = 1/m
              return num(
                t`Seja $f$ inversível com $f(${a})=${b}$ e $f'(${a})=${m}$. Quanto vale $(f^{-1})'(${b})$? (fração ou decimal)`,
                1 / m,
                t`$(f^{-1})'(${b})=\frac{1}{f'(f^{-1}(${b}))}=\frac{1}{f'(${a})}=\frac{1}{${m}}$.`,
                { tol: 0.002 },
              );
            }),
            tf(
              t`A derivada de $f(x)=x^x$ (para $x>0$) é $f'(x)=x\cdot x^{x-1}=x^x$.`,
              false,
              t`Falso! A regra do tombo só vale para expoente constante. Pela derivação logarítmica, $(x^x)'=x^x(\ln x+1)$.`,
            ),
            num(
              t`Usando a derivação logarítmica em $f(x)=x^x$, quanto vale $f'(1)$?`,
              1,
              t`$f'(x)=x^x(\ln x+1)\Rightarrow f'(1)=1^1(\ln 1+1)=1(0+1)=1$.`,
            ),
          ],
        },
      ],
    },
    {
      id: 'c-taxa-rel',
      title: 'Taxas relacionadas',
      parts: [
        {
          card: {
            title: 'O roteiro e a escada deslizando',
            body: t`Quando duas ou mais grandezas variam com o tempo $t$ presas por uma relação geométrica, suas taxas de variação estão ligadas pela **regra da cadeia**.

**Roteiro em 5 passos**:
1. Desenhe e dê nome às variáveis que mudam com $t$
2. Anote as taxas dadas e a pedida (diminuindo ⟹ sinal negativo!)
3. Escreva a equação que relaciona as variáveis (ex.: $x^2+y^2=L^2$)
4. Derive **ambos os lados em relação a $t$**: $2x\frac{dx}{dt}+2y\frac{dy}{dt}=0$
5. **Só substitua os valores do instante depois de derivar!**`,
            visual: ladderLab(),
            formula: t`x^2+y^2=L^2 \implies x\,\frac{dx}{dt}+y\,\frac{dy}{dt}=0`,
            tip: t`Erro nº 1 em provas: substituir $x=4$ **antes** de derivar faria a derivada dar $0$! Variáveis só ganham valor numérico depois da derivação.`,
          },
          exercises: [
            inter(
              t`Mova o controle de tempo $t$ até o instante em que o topo da escada de $5\text{ m}$ está na altura $y=3\text{ m}$.`,
              'plot',
              ladderLab().props,
              (v: any) => v && near(v.p.t, 4, 0.11),
              t`$t=4\text{ s}$ ($x=4\text{ m}$ e $y=3\text{ m}$)`,
              t`Quando $y=3\text{ m}$, $x=\sqrt{25-9}=4\text{ m}$ ($t=4\text{ s}$) e o topo desce a $\frac{dy}{dt}=-\frac{4}{3}\cdot 1\approx -1{,}33\text{ m/s}$.`,
            ),
            order(
              t`Ordene o roteiro para resolver um problema de taxas relacionadas:`,
              [
                t`Desenhar a situação e nomear as variáveis que dependem de $t$`,
                t`Escrever a equação geométrica que relaciona as variáveis`,
                t`Derivar ambos os lados em relação ao tempo $t$ (regra da cadeia)`,
                t`Substituir os valores conhecidos do instante e isolar a taxa pedida`,
              ],
              t`Equacionar primeiro, derivar em $t$ depois e substituir os valores particulares por último!`,
            ),
            tf(
              t`Num problema de taxas relacionadas, podemos substituir os valores numéricos das variáveis que mudam com o tempo **antes** de derivar a equação.`,
              false,
              t`Jamais! Se você substituir antes de derivar, a variável vira constante e sua derivada some. Só substitua antes o que for constante durante todo o movimento (como o comprimento da escada).`,
            ),
            mcqS(
              t`Derivando a área do retângulo $A=x\cdot y$ em relação ao tempo $t$ (quando $x$ e $y$ variam com $t$), obtemos:`,
              t`$\dfrac{dA}{dt}=y\dfrac{dx}{dt}+x\dfrac{dy}{dt}$`,
              [
                t`$\dfrac{dA}{dt}=\dfrac{dx}{dt}\cdot\dfrac{dy}{dt}$`,
                t`$\dfrac{dA}{dt}=x\dfrac{dx}{dt}+y\dfrac{dy}{dt}$`,
                t`$\dfrac{dA}{dt}=xy\left(\dfrac{dx}{dt}+\dfrac{dy}{dt}\right)$`,
                t`$\dfrac{dA}{dt}=y\dfrac{dx}{dt}-x\dfrac{dy}{dt}$`,
              ],
              t`Pela regra do produto em relação a $t$: $(xy)'=x'y+xy'$.`,
            ),
            gen((rng) => {
              const [x0, y0] = pick(rng, [[3, 4], [4, 3], [6, 8], [8, 6], [5, 12]] as const);
              const L = Math.hypot(x0, y0);
              const vx = randInt(rng, 1, 3);
              const vy = -(x0 * vx) / y0;
              return num(
                t`Uma escada de $${L}\text{ m}$ apoia-se numa parede. A base afasta-se a $\dfrac{dx}{dt}=${vx}\text{ m/s}$. Qual é $\dfrac{dy}{dt}$ (com sinal) quando $x=${x0}\text{ m}$ e $y=${y0}\text{ m}$?`,
                vy,
                t`$x\frac{dx}{dt}+y\frac{dy}{dt}=0\Rightarrow \frac{dy}{dt}=-\frac{${x0}}{${y0}}\cdot ${vx}=${fmt(vy, 3)}\text{ m/s}$.`,
                { tol: 0.01, unit: 'm/s' },
              );
            }),
            gen((rng) => {
              const x0 = randInt(rng, 4, 10);
              const y0 = randInt(rng, 4, 10);
              const dx = randInt(rng, 2, 5);
              const dy = -randInt(rng, 1, 4);
              const dA = y0 * dx + x0 * dy;
              return num(
                t`O comprimento $x$ de um retângulo cresce a $${dx}\text{ cm/s}$ e a largura $y$ diminui a $${-dy}\text{ cm/s}$ ($\frac{dy}{dt}=${dy}$). Qual a taxa $\dfrac{dA}{dt}$ quando $x=${x0}\text{ cm}$ e $y=${y0}\text{ cm}$?`,
                dA,
                t`$\frac{dA}{dt}=y\frac{dx}{dt}+x\frac{dy}{dt}=${y0}\cdot(${dx})+${x0}\cdot(${dy})=${dA}\text{ cm}^2\text{/s}$.`,
                { unit: 'cm²/s' },
              );
            }),
            num(
              t`Uma escada de $10\text{ m}$ desliza com a base afastando-se a $2\text{ m/s}$. Com que rapidez (em módulo, positiva) o topo desce no instante em que $x=6\text{ m}$?`,
              1.5,
              t`Quando $x=6$, $y=\sqrt{100-36}=8\text{ m}$. Então $\left|\frac{dy}{dt}\right|=\frac{6}{8}\cdot 2=1{,}5\text{ m/s}$.`,
              { unit: 'm/s' },
            ),
            mcqS(
              t`À medida que a base da escada se aproxima de $x=L$ (escada quase deitada no chão, $y\to 0^+$) com $\dfrac{dx}{dt}>0$ constante, a velocidade do topo $\dfrac{dy}{dt}=-\dfrac{x}{y}\dfrac{dx}{dt}$…`,
              t`tende a $-\infty$ (o modelo rígido explode quando $y\to 0$)`,
              [
                t`tende a zero, pois a escada está parando`,
                t`permanece constante igual a $-\dfrac{dx}{dt}$`,
                t`fica positiva`,
                t`vale metade de $\dfrac{dx}{dt}$`,
              ],
              t`Como $y$ está no denominador e tende a zero, a razão $-\frac{x}{y}$ cresce sem limite em módulo.`,
            ),
          ],
        },
        {
          card: {
            title: 'Áreas e volumes: círculo, esfera e cone',
            body: t`Quando figuras geométricas inflam ou esvaziam, derivamos suas fórmulas de área ou volume em relação a $t$:

• **Círculo**: $A=\pi r^2 \implies \dfrac{dA}{dt}=2\pi r\,\dfrac{dr}{dt}$
• **Esfera**: $V=\dfrac{4}{3}\pi r^3 \implies \dfrac{dV}{dt}=4\pi r^2\,\dfrac{dr}{dt}$
• **Tanque cônico** ($V=\frac{1}{3}\pi r^2 h$): use **semelhança de triângulos** $\dfrac{r}{h}=\dfrac{R}{H}$ para escrever $r$ em função de $h$ **antes** de derivar!`,
            formula: t`\frac{dV_{\text{esf}}}{dt}=4\pi r^2\,\frac{dr}{dt}\qquad \frac{dA_{\text{círc}}}{dt}=2\pi r\,\frac{dr}{dt}`,
            example: t`Cone com $R=2\text{ m}$ e $H=4\text{ m}$: $\frac{r}{h}=\frac{2}{4}\Rightarrow r=\frac{h}{2}$. Então $V=\frac{1}{3}\pi\left(\frac{h}{2}\right)^2 h=\frac{\pi}{12}h^3 \implies \frac{dV}{dt}=\frac{\pi}{4}h^2\frac{dh}{dt}$.`,
            tip: t`Repare na beleza geométrica: o coeficiente de $\frac{dr}{dt}$ em $\frac{dA}{dt}$ é o comprimento da circunferência ($2\pi r$), e em $\frac{dV}{dt}$ é a área da superfície da esfera ($4\pi r^2$)!`,
          },
          exercises: [
            match(
              t`Ligue cada grandeza geométrica à sua derivada no tempo $t$:`,
              [
                [t`Área do círculo $A=\pi r^2$`, t`$2\pi r\,\dfrac{dr}{dt}$`],
                [t`Volume da esfera $V=\frac{4}{3}\pi r^3$`, t`$4\pi r^2\,\dfrac{dr}{dt}$`],
                [t`Volume do cubo $V=a^3$`, t`$3a^2\,\dfrac{da}{dt}$`],
                [t`Cilindro de raio fixo $R$: $V=\pi R^2 h$`, t`$\pi R^2\,\dfrac{dh}{dt}$`],
              ],
              t`No cilindro vertical, o raio $R$ da parede é constante; nos demais, a borda se expande em todas as direções.`,
            ),
            gen((rng) => {
              const r = randInt(rng, 2, 7);
              const dr = randInt(rng, 1, 4);
              const coef = 2 * r * dr;
              return num(
                t`Uma pedra jogada num lago cria ondas circulares cujo raio cresce a $\dfrac{dr}{dt}=${dr}\text{ m/s}$. Se $\dfrac{dA}{dt}=k\pi\text{ m}^2\text{/s}$ quando $r=${r}\text{ m}$, quanto vale $k$?`,
                coef,
                t`$\frac{dA}{dt}=2\pi r\frac{dr}{dt}=2\pi(${r})(${dr})=${coef}\pi\Rightarrow k=${coef}$.`,
              );
            }),
            gen((rng) => {
              const a0 = randInt(rng, 2, 6);
              const da = randInt(rng, 1, 3);
              const dV = 3 * a0 * a0 * da;
              return num(
                t`A aresta $a$ de um cubo metálico cresce a $\dfrac{da}{dt}=${da}\text{ cm/s}$. Qual é a taxa $\dfrac{dV}{dt}$ quando $a=${a0}\text{ cm}$?`,
                dV,
                t`$V=a^3\Rightarrow \frac{dV}{dt}=3a^2\frac{da}{dt}=3(${a0}^2)(${da})=${dV}\text{ cm}^3\text{/s}$.`,
                { unit: 'cm³/s' },
              );
            }),
            gen((rng) => {
              const r = randInt(rng, 2, 5);
              const dr = randInt(rng, 1, 3);
              const k = 4 * r * r * dr;
              return num(
                t`Um balão esférico infla com $\dfrac{dr}{dt}=${dr}\text{ cm/s}$. Quando $r=${r}\text{ cm}$, a taxa $\dfrac{dV}{dt}$ vale $k\pi\text{ cm}^3\text{/s}$. Calcule $k$.`,
                k,
                t`$\frac{dV}{dt}=4\pi r^2\frac{dr}{dt}=4\pi(${r}^2)(${dr})=${k}\pi\Rightarrow k=${k}$.`,
              );
            }),
            num(
              t`Um balão esférico recebe ar a uma taxa constante $\dfrac{dV}{dt}=36\pi\text{ cm}^3\text{/s}$. Com que taxa $\dfrac{dr}{dt}$ o raio cresce quando $r=3\text{ cm}$?`,
              1,
              t`$36\pi=4\pi(3^2)\frac{dr}{dt}=36\pi\frac{dr}{dt}\Rightarrow \frac{dr}{dt}=1\text{ cm/s}$.`,
              { unit: 'cm/s' },
            ),
            mcqS(
              t`Num tanque **cilíndrico** vertical de raio fixo $R=2\text{ m}$ recebendo água a vazão constante $\dfrac{dV}{dt}=12\pi\text{ m}^3\text{/min}$, a velocidade $\dfrac{dh}{dt}$ com que o nível sobe…`,
              t`é constante e vale $3\text{ m/min}$ em qualquer altura`,
              [
                t`diminui conforme o nível $h$ sobe`,
                t`aumenta conforme o nível $h$ sobe`,
                t`depende da altura total do tanque`,
                t`vale $6\text{ m/min}$`,
              ],
              t`No cilindro o raio $R=2$ não muda: $V=4\pi h\Rightarrow \frac{dV}{dt}=4\pi\frac{dh}{dt}\Rightarrow \frac{dh}{dt}=\frac{12\pi}{4\pi}=3\text{ m/min}$ (constante!).`,
            ),
            mcqS(
              t`Num tanque **cônico** com vértice para baixo, de raio no topo $R=3\text{ m}$ e altura $H=6\text{ m}$, como expressamos o volume $V=\frac{1}{3}\pi r^2 h$ apenas em função de $h$?`,
              t`$V=\dfrac{\pi}{12}h^3$`,
              [t`$V=3\pi h$`, t`$V=\dfrac{\pi}{3}h^3$`, t`$V=\dfrac{\pi}{6}h^2$`, t`$V=\dfrac{4\pi}{3}h^3$`],
              t`Por semelhança, $\frac{r}{h}=\frac{3}{6}=\frac{1}{2}\Rightarrow r=\frac{h}{2}$. Substituindo: $V=\frac{1}{3}\pi\left(\frac{h}{2}\right)^2 h=\frac{\pi}{12}h^3$.`,
            ),
            num(
              t`No tanque cônico anterior ($V=\dfrac{\pi}{12}h^3$), se entra água a $\dfrac{dV}{dt}=9\pi\text{ m}^3\text{/min}$, quanto vale $\dfrac{dh}{dt}$ quando $h=6\text{ m}$?`,
              1,
              t`$\frac{dV}{dt}=\frac{\pi}{4}h^2\frac{dh}{dt}$. Em $h=6$: $9\pi=\frac{\pi}{4}(36)\frac{dh}{dt}=9\pi\frac{dh}{dt}\Rightarrow \frac{dh}{dt}=1\text{ m/min}$.`,
              { unit: 'm/min' },
            ),
          ],
        },
        {
          card: {
            title: 'Carros, sombras e ângulos',
            body: t`Três modelos clássicos fecham o repertório de taxas relacionadas:

• **Carros em estradas perpendiculares**: distância $z^2=x^2+y^2 \implies z\,\dfrac{dz}{dt}=x\,\dfrac{dx}{dt}+y\,\dfrac{dy}{dt}$
• **Sombra sob um poste**: semelhança de triângulos $\dfrac{s+x}{H}=\dfrac{s}{h}$ (relação **linear**: a sombra cresce a velocidade constante!)
• **Ângulo de visão/rastreamento**: $\operatorname{tg}\theta=\dfrac{y}{D} \implies (\sec^2\theta)\,\dfrac{d\theta}{dt}=\dfrac{1}{D}\dfrac{dy}{dt}$`,
            formula: t`z^2=x^2+y^2 \implies z\,\frac{dz}{dt}=x\,\frac{dx}{dt}+y\,\frac{dy}{dt}`,
            example: t`Poste de $6\text{ m}$ e pessoa de $1{,}5\text{ m}$ andando a $\frac{dx}{dt}=1{,}2\text{ m/s}$: $\frac{s+x}{6}=\frac{s}{1{,}5}\Rightarrow s+x=4s\Rightarrow s=\frac{x}{3}\Rightarrow \frac{ds}{dt}=0{,}4\text{ m/s}$.`,
            tip: t`Quando o problema pede a velocidade angular $\dfrac{d\theta}{dt}$, a resposta sai sempre em **radianos por unidade de tempo** ($\text{rad/s}$)!`,
          },
          exercises: [
            mcqS(
              t`Dois carros partem de um cruzamento em estradas perpendiculares ($z^2=x^2+y^2$). Derivando em relação a $t$, a taxa $\dfrac{dz}{dt}$ com que a distância entre eles cresce é:`,
              t`$\dfrac{dz}{dt}=\dfrac{x\frac{dx}{dt}+y\frac{dy}{dt}}{z}$`,
              [
                t`$\dfrac{dz}{dt}=\sqrt{\left(\frac{dx}{dt}\right)^2+\left(\frac{dy}{dt}\right)^2}$ em qualquer posição`,
                t`$\dfrac{dz}{dt}=\dfrac{dx}{dt}+\dfrac{dy}{dt}$`,
                t`$\dfrac{dz}{dt}=\dfrac{x\frac{dx}{dt}-y\frac{dy}{dt}}{z}$`,
                t`$\dfrac{dz}{dt}=2x\dfrac{dx}{dt}+2y\dfrac{dy}{dt}$`,
              ],
              t`Derivando $z^2=x^2+y^2$ temos $2z\frac{dz}{dt}=2x\frac{dx}{dt}+2y\frac{dy}{dt}$; dividindo por $2z$ sai a fórmula.`,
            ),
            gen((rng) => {
              const vx = randInt(rng, 6, 15);
              const vy = randInt(rng, 5, 12);
              // at x = 3, y = 4, z = 5: dz/dt = (3*vx + 4*vy)/5
              const dz = (3 * vx + 4 * vy) / 5;
              return num(
                t`Um carro vai para leste a $\dfrac{dx}{dt}=${vx}\text{ m/s}$ e outro vai para norte a $\dfrac{dy}{dt}=${vy}\text{ m/s}$. Qual a taxa $\dfrac{dz}{dt}$ com que a distância entre eles cresce quando $x=30\text{ m}$ e $y=40\text{ m}$?`,
                dz,
                t`Em $x=30, y=40$ temos $z=50\text{ m}$. Logo $\frac{dz}{dt}=\frac{30(${vx})+40(${vy})}{50}=${fmt(dz, 2)}\text{ m/s}$.`,
                { tol: 0.01, unit: 'm/s' },
              );
            }),
            gen((rng) => {
              const k = randInt(rng, 2, 4); // H = (k+1)*h => (s+x)/((k+1)h) = s/h => s+x = (k+1)s => x = k*s => ds/dt = (dx/dt)/k
              const v = k * pick(rng, [0.5, 1, 1.5]);
              const ds = v / k;
              return num(
                t`Um poste tem altura $H=${(k + 1) * 2}\text{ m}$ e uma pessoa de $h=2\text{ m}$ caminha afastando-se dele a $\dfrac{dx}{dt}=${fmt(v)}\text{ m/s}$. Com que taxa $\dfrac{ds}{dt}$ o comprimento $s$ da sombra cresce?`,
                ds,
                t`Por semelhança, $\frac{s+x}{${(k + 1) * 2}}=\frac{s}{2}\Rightarrow s+x=${k + 1}s\Rightarrow s=\frac{x}{${k}}\Rightarrow \frac{ds}{dt}=\frac{${fmt(v)}}{${k}}=${fmt(ds)}\text{ m/s}$.`,
                { tol: 0.01, unit: 'm/s' },
              );
            }),
            tf(
              t`No problema da sombra de uma pessoa andando em velocidade constante sob um poste, a velocidade com que a sombra cresce depende da distância $x$ até o poste.`,
              false,
              t`Como $s=\frac{h}{H-h}\,x$ é linear em $x$, a derivada $\frac{ds}{dt}=\frac{h}{H-h}\frac{dx}{dt}$ é **constante** e não depende de $x$!`,
            ),
            mcqS(
              t`Uma câmera no solo, a distância fixa $D$ da base de lançamento, acompanha um foguete na altura $y(t)$ ($\operatorname{tg}\theta=\frac{y}{D}$). Derivando em relação a $t$, obtemos:`,
              t`$(\sec^2\theta)\,\dfrac{d\theta}{dt}=\dfrac{1}{D}\dfrac{dy}{dt}$`,
              [
                t`$(\cos^2\theta)\,\dfrac{d\theta}{dt}=\dfrac{1}{D}\dfrac{dy}{dt}$`,
                t`$\dfrac{d\theta}{dt}=\dfrac{1}{D}\dfrac{dy}{dt}$`,
                t`$(\operatorname{tg}\theta)\,\dfrac{d\theta}{dt}=D\dfrac{dy}{dt}$`,
                t`$(\sec\theta)\,\dfrac{d\theta}{dt}=\dfrac{1}{D}\dfrac{dy}{dt}$`,
              ],
              t`A derivada de $\operatorname{tg}\theta$ em relação a $t$ é $(\sec^2\theta)\,\frac{d\theta}{dt}$, e $D$ é constante.`,
            ),
            num(
              t`Na câmera do exercício anterior, com $D=100\text{ m}$ e o foguete subindo a $\dfrac{dy}{dt}=50\text{ m/s}$, quanto vale $\dfrac{d\theta}{dt}$ (em $\text{rad/s}$) no instante em que $y=100\text{ m}$ ($\theta=\frac{\pi}{4}$)?`,
              0.25,
              t`Quando $y=D=100\text{ m}$, $\operatorname{tg}\theta=1\Rightarrow \sec^2\theta=1+1^2=2$. Então $2\frac{d\theta}{dt}=\frac{50}{100}=0{,}5\Rightarrow \frac{d\theta}{dt}=0{,}25\text{ rad/s}$.`,
              { unit: 'rad/s' },
            ),
            num(
              t`Um avião voa horizontalmente a altitude constante $y=4\text{ km}$ aproximando-se de um radar com $\dfrac{dx}{dt}=-300\text{ km/h}$. Com que taxa $\dfrac{dz}{dt}$ a distância direta $z$ ao radar varia quando $x=3\text{ km}$?`,
              -180,
              t`$z=\sqrt{3^2+4^2}=5\text{ km}$. Como $y$ é constante ($\frac{dy}{dt}=0$), $z\frac{dz}{dt}=x\frac{dx}{dt}\Rightarrow \frac{dz}{dt}=\frac{3}{5}(-300)=-180\text{ km/h}$.`,
              { unit: 'km/h' },
            ),
            mcqS(
              t`No método de Newton-Raphson e na propagação de erros, usamos a **aproximação linear** $\Delta y\approx f'(x)\,\Delta x$. Isso equivale a aproximar o gráfico de $f$ perto de $x_0$ por…`,
              'sua reta tangente em $x_0$',
              [
                'uma reta horizontal $y=f(x_0)$',
                'uma parábola passando pela origem',
                'sua reta normal em $x_0$',
                'uma secante entre $0$ e $x_0$',
              ],
              t`Para variações pequenas $\Delta x$, $\frac{\Delta y}{\Delta x}\approx \frac{dy}{dx}=f'(x_0)$, isto é, usamos a reta tangente $L(x)=f(x_0)+f'(x_0)(x-x_0)$.`,
            ),
          ],
        },
      ],
    },
  ],
};

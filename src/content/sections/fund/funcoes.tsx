import React from 'react';
import type { UnitDef } from '../../types';
import { gen, mcq, mcqS, num, tf, fill, match, order, inter, plot, rmcq, near, multi } from '../../helpers';
import { AreaUnder, FnCurve, Pt, Seg } from '../../../components/plot/Plot';
import { C } from '../../../theme';
import { fmt, pick, randInt, randNZ, polyTex, term } from '../../../lib/random';
import { expLogLab, lineLab, parabolaLab } from '../../visuals';

const t = String.raw;

const ineqLab = () =>
  plot({
    view: { xMin: -5, xMax: 5, yMin: -6, yMax: 8 },
    params: [{ key: 'c', label: 'c', min: -5, max: 5, step: 0.5, value: 4, color: C.p3 }],
    render: ({ p }: any) => {
      const f = (x: number) => x * x - p.c;
      const segs = [];
      if (p.c > 0) {
        const r = Math.sqrt(p.c);
        segs.push(<Seg key="s" x1={-r} y1={0} x2={r} y2={0} color={C.danger} width={7} />);
        segs.push(<FnCurve key="n" f={f} from={-r} to={r} color={C.danger} width={5} />);
      }
      return (
        <>
          <FnCurve f={f} color={C.p1} />
          {segs}
        </>
      );
    },
    info: ({ p }: any) => (p.c > 0 ? t`$x^2-${fmt(p.c)}<0 \iff -${fmt(Math.sqrt(p.c), 2)}<x<${fmt(Math.sqrt(p.c), 2)}$` : t`$x^2-(${fmt(p.c)})<0$ não tem solução real: a parábola nunca fica abaixo do eixo.`),
  });

/** "x<3" style TeX for interval answers */
const ivx = (lo: number | null, hi: number | null, loIn = false, hiIn = false) => {
  if (lo !== null && hi !== null) return `$${lo}${loIn ? '\\le' : '<'} x${hiIn ? '\\le' : '<'} ${hi}$`;
  if (lo !== null) return `$x${loIn ? '\\ge' : '>'} ${lo}$`;
  return `$x${hiIn ? '\\le' : '<'} ${hi}$`;
};
const outside = (a: number, b: number, inc = false) => `$x${inc ? '\\le' : '<'} ${a}$ ou $x${inc ? '\\ge' : '>'} ${b}$`;
const lin = (a: number, b: number) => polyTex([b, a]);

export const funcoes: UnitDef = {
  id: 'f-func',
  title: 'Funções',
  subtitle: 'Afim, quadrática, inequações, exponencial e logaritmo',
  icon: '📈',
  source: 'Competências Básicas · Funções',
  guide: t`Função é uma regra que associa cada $x$ do domínio a **um único** $y$. Os gráficos são a forma mais rápida de entender e resolver equações e inequações.`,
  lessons: [
    {
      id: 'f-func-afim',
      title: 'Função afim',
      parts: [
        {
          card: {
            title: 'Uma reta: f(x) = ax + b',
            body: t`$a$ é o **coeficiente angular** (inclinação): quanto $y$ sobe quando $x$ anda 1.
$b$ é o **coeficiente linear**: onde a reta corta o eixo $y$.

• $a>0$: crescente · $a<0$: decrescente
• Raiz (zero): $x=-\frac{b}{a}$`,
            visual: lineLab(),
          },
          exercises: [
            tf(t`A função $f(x)=-3x+5$ é crescente.`, false, t`$a=-3<0$: decrescente.`),
            mcqS(t`Em $f(x)=4x-7$, em que valor de $y$ a reta corta o eixo $y$?`, '$-7$', ['$4$', '$\\frac74$', '$7$'], t`Em $x=0$: $f(0)=-7$, que é o coeficiente $b$.`),
            gen((rng) => {
              const a = randNZ(rng, -4, 4);
              const b = randInt(rng, -6, 6);
              const x = randInt(rng, -3, 5);
              return num(t`Se $f(x)=${lin(a, b)}$, quanto vale $f(${x})$?`, a * x + b, t`$f(${x})=${a}\cdot(${x})${term(b, '')}=${a * x + b}$.`);
            }),
            gen((rng) => {
              const a = randNZ(rng, -3, 3);
              const r = randInt(rng, -4, 4);
              const b = -a * r;
              return num(t`Qual é a raiz de $f(x)=${lin(a, b)}$?`, r, t`$${lin(a, b)}=0\Rightarrow x=-\frac{${b}}{${a}}=${r}$.`);
            }),
            inter(t`Ajuste $a$ e $b$ para a reta coincidir com a tracejada $y=-2x+3$.`, 'plot', lineLab({ a: 0.5, b: 0, target: [-2, 3] }).props, (v: any) => v && near(v.p.a, -2, 0.01) && near(v.p.b, 3, 0.01), t`$a=-2$, $b=3$`),
            gen((rng) => {
              const a = randNZ(rng, -4, 4);
              const b = randInt(rng, -6, 6);
              const x = randInt(rng, -5, 6);
              return num(t`Se $f(x)=${lin(a, b)}$, para qual $x$ temos $f(x)=${a * x + b}$?`, x, t`$${lin(a, b)}=${a * x + b}\Rightarrow ${a}x=${a * x}\Rightarrow x=${x}$.`);
            }),
            gen((rng) => {
              const a = randNZ(rng, -3, 3);
              const r = randNZ(rng, -4, 4);
              const b = -a * r;
              return rmcq(rng, t`Para quais $x$ temos $f(x)>0$, sendo $f(x)=${lin(a, b)}$?`, a > 0 ? `$x>${r}$` : `$x<${r}$`, [a > 0 ? `$x<${r}$` : `$x>${r}$`, `$x>${-r}$`, `$x<${-r}$`, `$x>${b}$`], t`A raiz é $${r}$ e a reta é ${a > 0 ? 'crescente: positiva à direita da raiz' : 'decrescente: positiva à esquerda da raiz'}.`);
            }),
            gen((rng) => {
              const a = randNZ(rng, -4, 4);
              const b = randInt(rng, -5, 5);
              return num(t`Uma função afim tem $f(1)=${a + b}$ e $f(3)=${3 * a + b}$. Quanto vale $f(5)$?`, 5 * a + b, t`De $x=1$ para $x=3$, $y$ variou $${2 * a}$: $a=${a}$. Mais 2 passos: $f(5)=${3 * a + b}+${2 * a}=${5 * a + b}$.`);
            }),
          ],
        },
        {
          card: {
            title: 'Reta por dois pontos',
            body: t`Dados $(x_1,y_1)$ e $(x_2,y_2)$:
$$a=\frac{y_2-y_1}{x_2-x_1}=\frac{\Delta y}{\Delta x}$$
Depois, $b=y_1-a\,x_1$.`,
            example: t`Pontos $(1, 3)$ e $(3, 7)$: $a=\frac{7-3}{3-1}=2$, $b=3-2=1$ ⟹ $f(x)=2x+1$.`,
            tip: t`Retas **paralelas** têm o mesmo $a$. Para achar onde duas retas se cruzam, iguale as duas expressões.`,
          },
          exercises: [
            gen((rng) => {
              const x1 = randInt(rng, -3, 2);
              const x2 = x1 + randInt(rng, 1, 4);
              const a = randNZ(rng, -3, 3);
              const b = randInt(rng, -4, 4);
              return num(t`Qual o coeficiente angular da reta que passa por $(${x1},\,${a * x1 + b})$ e $(${x2},\,${a * x2 + b})$?`, a, t`$a=\frac{${a * x2 + b}-(${a * x1 + b})}{${x2}-(${x1})}=${a}$.`);
            }),
            mcq(t`Qual é o coeficiente angular de uma reta **horizontal**?`, ['$0$', '$1$', 'não existe', '$-1$'], 0, t`Em uma reta horizontal $y$ não muda: $\Delta y=0$.`),
            gen((rng) => {
              const a = randNZ(rng, -4, 4);
              const x1 = randInt(rng, -3, 4);
              const b = randInt(rng, -6, 6);
              return num(t`Uma reta tem inclinação $${a}$ e passa por $(${x1},\,${a * x1 + b})$. Em que valor ela corta o eixo $y$?`, b, t`$b=y_1-a\,x_1=${a * x1 + b}-(${a})\cdot(${x1})=${b}$.`);
            }),
            tf(t`Retas paralelas (não verticais) têm o mesmo coeficiente angular.`, true, t`Mesma inclinação, alturas diferentes: nunca se encontram.`),
            gen((rng) => {
              const a = randNZ(rng, -3, 3);
              const b = randInt(rng, -4, 4);
              const x1 = randInt(rng, -3, 1);
              const x2 = x1 + randInt(rng, 1, 3);
              return rmcq(rng, t`Qual é a equação da reta que passa por $(${x1},\,${a * x1 + b})$ e $(${x2},\,${a * x2 + b})$?`, `$y=${lin(a, b)}$`, [`$y=${lin(-a, b)}$`, `$y=${lin(a, -b)}$`, `$y=${lin(b, a)}$`, `$y=${lin(a, b + 1)}$`], t`$a=${a}$ e $b=${a * x1 + b}-(${a})(${x1})=${b}$.`);
            }),
            gen((rng) => {
              const a = randNZ(rng, -3, 3);
              const b = randInt(rng, -4, 4);
              const x = randInt(rng, -3, 3);
              const on = rng() < 0.5;
              const y = a * x + b + (on ? 0 : pick(rng, [-2, -1, 1, 2]));
              return tf(t`O ponto $(${x},\,${y})$ está sobre a reta $y=${lin(a, b)}$.`, on, t`Para $x=${x}$, a reta dá $y=${a * x + b}$${on ? '.' : `, não $${y}$.`}`);
            }),
            gen((rng) => {
              const x = randInt(rng, -3, 4);
              const a1 = randNZ(rng, -3, 3);
              let a2 = randNZ(rng, -3, 3);
              if (a2 === a1) a2 = a1 + 1 === 0 ? a1 + 2 : a1 + 1;
              const b1 = randInt(rng, -4, 4);
              const y = a1 * x + b1;
              const b2 = y - a2 * x;
              return num(t`Em que $x$ as retas $y=${lin(a1, b1)}$ e $y=${lin(a2, b2)}$ se cruzam?`, x, t`Igualando: $${lin(a1, b1)}=${lin(a2, b2)}\Rightarrow ${a1 - a2}x=${b2 - b1}\Rightarrow x=${x}$.`);
            }),
            gen((rng) => {
              const a = randNZ(rng, -3, 3);
              const c = randInt(rng, -4, 4);
              const x1 = randInt(rng, -2, 3);
              const y1 = randInt(rng, -4, 4);
              const b = y1 - a * x1;
              return rmcq(rng, t`Qual reta passa por $(${x1},\,${y1})$ e é paralela a $y=${lin(a, c)}$?`, `$y=${lin(a, b)}$`, [`$y=${lin(-a, b)}$`, `$y=${lin(a, c)}$`, `$y=${lin(a, y1)}$`, `$y=${lin(a, b + 2)}$`], t`Paralela: mesmo $a=${a}$. Depois $b=${y1}-(${a})(${x1})=${b}$.`);
            }),
          ],
        },
        {
          card: {
            title: 'Funções afins no dia a dia',
            body: t`Muita coisa é "parte fixa + taxa": conta de luz, táxi, salário com comissão, conversão de unidades.

A **parte fixa** é o $b$ e a **taxa** é o $a$. Quando duas opções competem, **igualar** as funções mostra o ponto de equilíbrio.`,
            example: t`Plano A: R\$ $50$ + R\$ $0{,}10$/min. Plano B: R\$ $20$ + R\$ $0{,}25$/min. $50+0{,}1t=20+0{,}25t\Rightarrow t=200$ min.`,
          },
          exercises: [
            mcqS(t`Um táxi cobra R\$ 5 de bandeirada mais R\$ 2,50 por km. Qual função dá o preço?`, t`$P(x)=2{,}5x+5$`, [t`$P(x)=5x+2{,}5$`, t`$P(x)=7{,}5x$`, t`$P(x)=2{,}5x-5$`], t`A parte fixa é o $b=5$, a taxa por km é o $a=2{,}5$.`),
            gen((rng) => {
              const b = pick(rng, [4, 5, 6]);
              const r = pick(rng, [2, 2.5, 3]);
              const km = randInt(rng, 3, 20);
              return num(t`Um táxi cobra R\$ $${b}$ fixos mais R\$ $${fmt(r)}$ por km. Quanto custa uma corrida de $${km}$ km?`, b + r * km, t`$${b}+${fmt(r)}\cdot${km}=${fmt(b + r * km)}$.`, { unit: 'R$' });
            }),
            gen((rng) => {
              const b = pick(rng, [4, 5, 6]);
              const r = pick(rng, [2, 2.5, 3]);
              const km = randInt(rng, 4, 20);
              return num(t`O táxi cobra R\$ $${b}$ fixos mais R\$ $${fmt(r)}$ por km. A corrida deu R\$ $${fmt(b + r * km)}$. Quantos km foram rodados?`, km, t`$${b}+${fmt(r)}x=${fmt(b + r * km)}\Rightarrow x=\frac{${fmt(r * km)}}{${fmt(r)}}=${km}$.`, { unit: 'km' });
            }),
            gen((rng) => {
              const Cc = pick(rng, [-10, 0, 15, 20, 25, 30, 37, 100]);
              return num(t`Use $F=1{,}8\,C+32$ para converter $${Cc}\,^\circ$C em °F.`, 1.8 * Cc + 32, t`$1{,}8\cdot${Cc}+32=${fmt(1.8 * Cc + 32)}$.`, { unit: '°F' });
            }),
            tf(t`Em $F=1{,}8\,C+32$, aumentar $10\,^\circ$C equivale a aumentar $18\,^\circ$F.`, true, t`A taxa é $1{,}8$ °F por °C: $10\cdot1{,}8=18$. A parte fixa $32$ não interfere na variação.`),
            gen((rng) => {
              const [fa, ra, fb, rb] = pick(rng, [[50, 0.1, 20, 0.25], [80, 0.2, 30, 0.4], [40, 0.5, 100, 0.2], [60, 1, 20, 1.5]]);
              const tt = (fb - fa) / (ra - rb);
              return num(t`Plano A: R\$ $${fa}$ + R\$ $${fmt(ra)}$ por minuto. Plano B: R\$ $${fb}$ + R\$ $${fmt(rb)}$ por minuto. Com quantos minutos os dois custam o mesmo?`, tt, t`$${fa}+${fmt(ra)}t=${fb}+${fmt(rb)}t\Rightarrow t=\frac{${fb - fa}}{${fmt(ra - rb)}}=${fmt(tt)}$ min.`, { unit: 'min' });
            }),
            gen((rng) => {
              const V = pick(rng, [20000, 30000, 50000]);
              const d = V / pick(rng, [10, 20, 25]);
              return num(t`Uma máquina de R\$ $${V}$ perde R\$ $${d}$ de valor por ano (depreciação linear). Em quantos anos o valor chega a zero?`, V / d, t`$${V}-${d}t=0\Rightarrow t=${V / d}$ anos.`, { unit: 'anos' });
            }),
            gen((rng) => {
              const F = pick(rng, [1200, 2000, 3000, 4500]);
              const c = pick(rng, [10, 15, 20]);
              const p = c + pick(rng, [5, 10, 15, 30]);
              return num(t`Uma fábrica tem custo fixo de R\$ $${F}$ e gasta R\$ $${c}$ por peça; vende cada peça por R\$ $${p}$. Quantas peças precisa vender para não ter prejuízo (receita = custo)?`, F / (p - c), t`$${p}x=${F}+${c}x\Rightarrow x=\frac{${F}}{${p - c}}=${fmt(F / (p - c))}$ peças.`);
            }),
          ],
        },
      ],
    },
    {
      id: 'f-func-quad',
      title: 'Função quadrática',
      parts: [
        {
          card: {
            title: 'A parábola',
            body: t`$f(x)=ax^2+bx+c$ com $a\ne0$.

• $a>0$: concavidade para **cima** (sorriso) · $a<0$: para **baixo**
• $c$: onde corta o eixo $y$
• **Discriminante** $\Delta=b^2-4ac$ decide o número de raízes

Mexa nos coeficientes:`,
            visual: parabolaLab(),
            tip: t`$\Delta>0$: duas raízes reais · $\Delta=0$: uma (dupla) · $\Delta<0$: nenhuma raiz real.`,
          },
          exercises: [
            mcq(t`A concavidade de $f(x)=-2x^2+3x+1$ é voltada para…`, ['baixo', 'cima', 'a direita', 'não tem concavidade'], 0, t`$a=-2<0$: "carranca", voltada para baixo.`),
            gen((rng) => {
              const [a, b, c] = [randNZ(rng, -3, 3), randInt(rng, -6, 6), randInt(rng, -9, 9)];
              return num(t`Em que valor de $y$ a parábola $f(x)=${polyTex([c, b, a])}$ corta o eixo $y$?`, c, t`No eixo $y$, $x=0$: $f(0)=c=${c}$.`);
            }),
            gen((rng) => {
              const r1 = randInt(rng, -5, 5);
              const r2 = randInt(rng, -5, 5);
              const a = pick(rng, [1, 1, 2, -1]);
              const b = -a * (r1 + r2);
              const c = a * r1 * r2;
              return num(t`Calcule o discriminante $\Delta$ de $${polyTex([c, b, a])}$.`, b * b - 4 * a * c, t`$\Delta=b^2-4ac=(${b})^2-4\cdot(${a})\cdot(${c})=${b * b - 4 * a * c}$.`);
            }),
            mcq(t`Se $\Delta<0$, a parábola…`, ['não corta o eixo $x$', 'corta o eixo $x$ em dois pontos', 'é uma reta', 'tem vértice na origem'], 0, t`Sem raízes reais: a parábola fica inteira acima ou inteira abaixo do eixo.`),
            gen((rng) => {
              const a = pick(rng, [1, 2, -1]);
              const b = randInt(rng, -6, 6);
              const c = randInt(rng, -6, 6);
              const D = b * b - 4 * a * c;
              const ans = D > 0 ? 'Duas' : D === 0 ? 'Uma (raiz dupla)' : 'Nenhuma';
              return rmcq(rng, t`Quantas raízes reais tem $${polyTex([c, b, a])}=0$?`, ans, ['Duas', 'Uma (raiz dupla)', 'Nenhuma', 'Infinitas'].filter((s) => s !== ans), t`$\Delta=(${b})^2-4\cdot(${a})\cdot(${c})=${D}$${D > 0 ? ', positivo.' : D === 0 ? ', zero.' : ', negativo.'}`);
            }),
            inter(t`Ajuste a parábola para coincidir com a tracejada $y=-x^2+2x+3$.`, 'plot', parabolaLab({ a: 1, b: 0, c: 0, ghost: [-1, 2, 3] }).props, (v: any) => v && near(v.p.a, -1, 0.01) && near(v.p.b, 2, 0.01) && near(v.p.c, 3, 0.01), t`$a=-1,\ b=2,\ c=3$`),
            gen((rng) => {
              const [a, b, c] = [randNZ(rng, -3, 3), randInt(rng, -5, 5), randInt(rng, -5, 5)];
              const x = randInt(rng, -3, 3);
              return num(t`Se $f(x)=${polyTex([c, b, a])}$, quanto vale $f(${x})$?`, a * x * x + b * x + c, t`$${a}\cdot(${x})^2${term(b, `\\cdot(${x})`)}${term(c, '')}=${a * x * x + b * x + c}$.`);
            }),
            gen((rng) => {
              const h = randInt(rng, 1, 7);
              return num(t`Para qual valor de $k$ a equação $x^2+${2 * h}x+k=0$ tem **uma única** raiz real?`, h * h, t`Uma raiz só quando $\Delta=0$: $${4 * h * h}-4k=0\Rightarrow k=${h * h}$.`);
            }),
          ],
        },
        {
          card: {
            title: 'Bhaskara',
            body: t`As raízes de $ax^2+bx+c=0$ são

$$x=\frac{-b\pm\sqrt{\Delta}}{2a}$$

Equações **incompletas** saem mais rápido: $x^2-9=0\Rightarrow x=\pm3$ e $x^2-5x=0\Rightarrow x(x-5)=0\Rightarrow x=0$ ou $x=5$.`,
            example: t`$x^2-6x+5$: $\Delta=36-20=16$, raízes $\frac{6\pm4}{2}=5$ e $1$.`,
          },
          exercises: [
            tf(t`Se $\Delta=0$, as duas raízes da equação são iguais.`, true, t`O $\pm\sqrt{0}$ não muda nada: $x=-\frac{b}{2a}$ (raiz dupla).`),
            gen((rng) => {
              const k = randInt(rng, 2, 9);
              return rmcq(rng, t`Resolva $x^2-${k * k}=0$.`, `$x=\\pm${k}$`, [`$x=${k}$`, `$x=\\pm${k * k}$`, `$x=\\pm\\sqrt{${k}}$`], t`$x^2=${k * k}\Rightarrow x=\pm${k}$.`);
            }),
            gen((rng) => {
              const a = randInt(rng, 1, 3);
              const r = randNZ(rng, -6, 6);
              const b = -a * r;
              return rmcq(rng, t`Resolva $${polyTex([0, b, a])}=0$.`, `$x=0$ ou $x=${r}$`, [`$x=0$ ou $x=${-r}$`, `$x=${r}$`, `$x=\\pm${Math.abs(r)}$`], t`Fatore: $x(${polyTex([b, a])})=0$, então $x=0$ ou $x=${r}$.`);
            }),
            gen((rng) => {
              const r1 = randInt(rng, -5, 3);
              const r2 = r1 + randInt(rng, 1, 6);
              const b = -(r1 + r2);
              const c = r1 * r2;
              return num(t`Qual a **maior** raiz de $${polyTex([c, b, 1])}=0$?`, r2, t`$\Delta=${b * b - 4 * c}$, $x=\frac{${-b}\pm${Math.sqrt(b * b - 4 * c)}}{2}$: raízes $${r1}$ e $${r2}$.`);
            }),
            gen((rng) => {
              const r1 = randInt(rng, -4, 2);
              const r2 = r1 + randInt(rng, 1, 5);
              const a = 2;
              const b = -a * (r1 + r2);
              const c = a * r1 * r2;
              return num(t`Qual a **menor** raiz de $${polyTex([c, b, a])}=0$?`, r1, t`$\Delta=${b * b - 4 * a * c}$ e $x=\frac{${-b}\pm${Math.sqrt(b * b - 4 * a * c)}}{4}$: raízes $${r1}$ e $${r2}$.`);
            }),
            gen((rng) => {
              const a = pick(rng, [1, 2, -1, 3]);
              const r1 = randInt(rng, -5, 5);
              const r2 = randInt(rng, -5, 5);
              return num(t`Quanto vale a **soma** das raízes de $${polyTex([a * r1 * r2, -a * (r1 + r2), a])}=0$?`, r1 + r2, t`Soma das raízes $=-\frac{b}{a}=-\frac{${-a * (r1 + r2)}}{${a}}=${r1 + r2}$.`);
            }),
            num(t`Uma bola é chutada para cima e sua altura é $h(t)=-5t^2+20t$ (metros, segundos). Em que instante ela volta ao chão?`, 4, t`$-5t^2+20t=0\Rightarrow -5t(t-4)=0$: $t=0$ (saída) e $t=4$ s (volta).`, { unit: 's' }),
            gen((rng) => {
              const p = randInt(rng, -4, 4);
              const q = randInt(rng, 1, 6);
              return num(t`Resolva $(x${term(-p, '')})^2=${q * q}$ e dê a **maior** solução.`, p + q, t`$x${term(-p, '')}=\pm${q}\Rightarrow x=${p}\pm${q}$: soluções $${p - q}$ e $${p + q}$.`);
            }),
          ],
        },
        {
          card: {
            title: 'O vértice',
            body: t`O **vértice** é o ponto de máximo ($a<0$) ou de mínimo ($a>0$) da parábola:

$$x_v=-\frac{b}{2a},\qquad y_v=-\frac{\Delta}{4a}=f(x_v)$$`,
            example: t`$x^2-6x+5$: $x_v=3$ e $y_v=9-18+5=-4$. Mínimo $-4$, imagem $[-4,\,\infty)$.`,
            tip: t`Problemas de **área máxima**, **altura máxima** ou **lucro máximo** com função quadrática? A resposta está no vértice.`,
          },
          exercises: [
            mcq(t`Se $a<0$, o vértice da parábola é um ponto de…`, ['máximo', 'mínimo', 'inflexão', 'descontinuidade'], 0, t`Parábola "para baixo": o vértice é o topo.`),
            gen((rng) => {
              const a = pick(rng, [1, 2, -1, -2]);
              const xv = randInt(rng, -3, 3);
              const b = -2 * a * xv;
              const c = randInt(rng, -5, 5);
              return num(t`Qual o $x$ do vértice de $f(x)=${polyTex([c, b, a])}$?`, xv, t`$x_v=-\frac{b}{2a}=-\frac{${b}}{2\cdot(${a})}=${xv}$.`);
            }),
            gen((rng) => {
              const a = pick(rng, [1, -1, 2]);
              const xv = randInt(rng, -3, 3);
              const yv = randInt(rng, -6, 6);
              const b = -2 * a * xv;
              const c = a * xv * xv + yv;
              return num(t`Qual o $y$ do vértice de $f(x)=${polyTex([c, b, a])}$?`, yv, t`$x_v=${xv}$ e $y_v=f(${xv})=${yv}$.`);
            }),
            num(t`Com 40 m de cerca, qual a **maior área** (em m²) de um retângulo?`, 100, t`Lados $x$ e $20-x$: $A=x(20-x)=-x^2+20x$, vértice $x=10$ ⟹ quadrado $10\times10=100$ m².`, { unit: 'm²' }),
            gen((rng) => {
              const v = pick(rng, [10, 20, 30]);
              return num(t`Uma pedra é lançada para cima com altura $h(t)=-5t^2+${v}t$ (m). Qual a altura **máxima**?`, (v * v) / 20, t`$t_v=\frac{${v}}{10}=${v / 10}$ s e $h(${v / 10})=${(v * v) / 20}$ m.`, { unit: 'm' });
            }),
            gen((rng) => {
              const a = pick(rng, [1, 2, -1]);
              const xv = randInt(rng, -3, 3);
              const yv = randInt(rng, -5, 5);
              const b = -2 * a * xv;
              const c = a * xv * xv + yv;
              const ans = a > 0 ? `$[${yv},\\,\\infty)$` : `$(-\\infty,\\,${yv}]$`;
              return rmcq(rng, t`Qual é a imagem de $f(x)=${polyTex([c, b, a])}$?`, ans, [a > 0 ? `$(-\\infty,\\,${yv}]$` : `$[${yv},\\,\\infty)$`, `$[${xv},\\,\\infty)$`, `$\\mathbb R$`, `$(${yv},\\,\\infty)$`], t`Vértice em $y_v=${yv}$, concavidade para ${a > 0 ? 'cima: os valores vão de $' + yv + '$ para cima' : 'baixo: os valores vão de $' + yv + '$ para baixo'}.`);
            }),
            gen((rng) => {
              const b = 2 * randInt(rng, 10, 40);
              const c = randInt(rng, 50, 200);
              return num(t`O lucro de uma loja é $L(x)=-x^2+${b}x-${c}$, com $x$ unidades vendidas. Quantas unidades maximizam o lucro?`, b / 2, t`$x_v=-\frac{${b}}{2\cdot(-1)}=${b / 2}$.`);
            }),
            num(t`Dois números somam $10$. Qual é o **maior** valor possível do produto deles?`, 25, t`$P=x(10-x)=-x^2+10x$, máximo em $x=5$: $P=25$.`),
          ],
        },
      ],
    },
    {
      id: 'f-func-ineq',
      title: 'Inequações',
      parts: [
        {
          card: {
            title: 'Onde a função é positiva ou negativa?',
            body: t`Resolver $f(x)<0$ é encontrar os $x$ onde o gráfico fica **abaixo** do eixo; $f(x)>0$, onde fica **acima**.

Para $x^2-c<0$, veja o trecho vermelho:`,
            visual: ineqLab(),
          },
          exercises: [
            mcq(t`Resolver $f(x)>0$ é achar os $x$ onde o gráfico de $f$ está…`, ['acima do eixo $x$', 'abaixo do eixo $x$', 'sobre o eixo $y$', 'à direita da origem'], 0, t`$f(x)>0$ significa altura positiva.`),
            tf(t`A inequação $x^2+1<0$ não tem solução real.`, true, t`$x^2+1\ge1$ para todo real.`),
            tf(t`$x^2\ge0$ para todo $x$ real.`, true, t`Quadrado de real nunca é negativo.`),
            inter(t`Ajuste $c$ para que a solução de $x^2-c<0$ seja $-3<x<3$.`, 'plot', ineqLab().props, (v: any) => v && near(v.p.c, 9, 0.01), t`$c=9$`),
            gen((rng) => {
              const k = randInt(rng, 2, 7);
              return rmcq(rng, t`Resolva $x^2-${k * k}<0$.`, ivx(-k, k), [outside(-k, k), ivx(null, k), ivx(-k, k, true, true)], t`A parábola corta o eixo em $\pm${k}$ e fica abaixo dele **entre** essas raízes.`);
            }),
            gen((rng) => {
              const k = randInt(rng, 2, 7);
              return rmcq(rng, t`Resolva $x^2-${k * k}>0$.`, outside(-k, k), [ivx(-k, k), ivx(k, null), outside(-k, k, true)], t`Acima do eixo **fora** das raízes $\pm${k}$.`);
            }),
            mcqS(t`Sendo $f(x)=(x-1)(x-4)$, onde $f$ é **negativa**?`, t`$1<x<4$`, [t`$x<1$ ou $x>4$`, t`$x>4$`, t`$x<1$`], t`Parábola com $a>0$ e raízes $1$ e $4$: negativa entre elas.`),
            gen((rng) => {
              let n = randInt(rng, 5, 60);
              while (Number.isInteger(Math.sqrt(n))) n++;
              const m = Math.floor(Math.sqrt(n));
              return num(t`Quantos números **inteiros** satisfazem $x^2<${n}$?`, 2 * m + 1, t`$-\sqrt{${n}}<x<\sqrt{${n}}$ e $\sqrt{${n}}\approx${fmt(Math.sqrt(n), 2)}$: inteiros de $-${m}$ a $${m}$, ou seja, $${2 * m + 1}$.`);
            }),
          ],
        },
        {
          card: {
            title: 'Regras práticas',
            body: t`• **Afim**: resolva como equação, mas **inverta o sinal** ao multiplicar/dividir por negativo: $-2x>6\Rightarrow x<-3$.
• **Quadrática**: ache as raízes e use a concavidade. Para $a>0$ ela é negativa **entre** as raízes e positiva **fora**; para $a<0$, o contrário.`,
            example: t`$x^2-5x+6\le0$: raízes $2$ e $3$, $a>0$ ⟹ $S=[2,\,3]$.`,
          },
          exercises: [
            gen((rng) => {
              const a = randInt(rng, 2, 5);
              const k = randInt(rng, -6, 6);
              const c = randInt(rng, -5, 5);
              return rmcq(rng, t`Resolva $${a}x${term(c, '')}>${a * k + c}$.`, ivx(k, null), [ivx(null, k), ivx(-k, null), ivx(k, null, true)], t`$${a}x>${a * k}\Rightarrow x>${k}$ (dividir por positivo mantém o sinal).`);
            }),
            gen((rng) => {
              const a = randNZ(rng, -4, -1);
              const k = randInt(rng, -6, 6);
              return rmcq(rng, t`Resolva $${a}x>${a * k}$.`, t`$x<${k}$`, [t`$x>${k}$`, t`$x<${-k}$`, t`$x>${-k}$`], t`Dividindo por $${a}$ (negativo) o sinal **inverte**: $x<${k}$.`);
            }),
            gen((rng) => {
              const r1 = randInt(rng, -4, 2);
              const r2 = r1 + randInt(rng, 1, 5);
              return rmcq(rng, t`Resolva $${polyTex([r1 * r2, -(r1 + r2), 1])}<0$.`, ivx(r1, r2), [outside(r1, r2), ivx(r2, null), ivx(null, r1, false, true)], t`Raízes $${r1}$ e $${r2}$; concavidade para cima ⟹ negativa entre as raízes.`);
            }),
            gen((rng) => {
              const r1 = randInt(rng, -4, 2);
              const r2 = r1 + randInt(rng, 1, 5);
              return rmcq(rng, t`Resolva $${polyTex([r1 * r2, -(r1 + r2), 1])}\ge0$.`, outside(r1, r2, true), [ivx(r1, r2, true, true), outside(r1, r2), ivx(r1, null, true)], t`Raízes $${r1}$ e $${r2}$ (incluídas, por causa do $\ge$); para $a>0$ é positiva fora delas.`);
            }),
            mcqS(t`Resolva $-x^2+4>0$.`, t`$-2<x<2$`, [t`$x<-2$ ou $x>2$`, t`$x>2$`, t`sem solução`], t`Raízes $\pm2$ e $a<0$: a parábola fica **acima** do eixo entre as raízes.`),
            num(t`Qual é o **maior inteiro** que satisfaz $3x-7<11$?`, 5, t`$3x<18\Rightarrow x<6$. O maior inteiro menor que $6$ é $5$.`),
            gen((rng) => {
              const r1 = randInt(rng, -4, 1);
              const r2 = r1 + randInt(rng, 1, 5);
              return rmcq(rng, t`Resolva $${polyTex([r1 * r2, -(r1 + r2), 1])}\le0$.`, ivx(r1, r2, true, true), [ivx(r1, r2), outside(r1, r2, true), ivx(r1, r2, true, false)], t`Negativa **ou zero** entre as raízes, com as raízes incluídas: $${r1}\le x\le ${r2}$.`);
            }),
            mcqS(t`Resolva $x^2>2x$.`, t`$x<0$ ou $x>2$`, [t`$x>2$`, t`$0<x<2$`, t`$x>0$`], t`Cuidado: não divida por $x$ (pode ser negativo!). Faça $x^2-2x>0\Rightarrow x(x-2)>0$: fora das raízes $0$ e $2$.`),
          ],
        },
        {
          card: {
            title: 'Quadro de sinais',
            body: t`Para **produto** ou **quociente**, estude o sinal de cada fator separadamente e multiplique os sinais em cada trecho da reta:

1. Ache as raízes de cada fator e marque na reta.
2. Em cada trecho, veja se cada fator é $+$ ou $-$.
3. Multiplique os sinais.

A raiz do **denominador** nunca entra na solução (não se divide por zero).`,
            example: t`$\frac{x-1}{x+2}\ge0$: raízes $1$ e $-2$. Sinais: $(-\infty,-2)$: $+$; $(-2,1)$: $-$; $(1,\infty)$: $+$. Solução: $x<-2$ ou $x\ge1$.`,
          },
          exercises: [
            mcqS(t`Qual o conjunto solução de $\frac{x-1}{x+2}\ge0$?`, t`$x<-2$ ou $x\ge1$`, [t`$-2<x\le1$`, t`$x\ge1$`, t`$x\le-2$ ou $x\ge1$`], t`Numerador zera em 1 (incluído), denominador em $-2$ (excluído). Positivo fora do intervalo.`),
            tf(t`Em $\frac{x-3}{x+1}\ge0$, o valor $x=-1$ faz parte da solução.`, false, t`Em $x=-1$ o denominador zera: a expressão nem existe.`),
            mcq(t`Qual o sinal de $(x-2)(x+3)$ em $x=0$?`, ['negativo', 'positivo', 'zero', 'não existe'], 0, t`$(0-2)(0+3)=-6<0$.`),
            gen((rng) => {
              const a = randInt(rng, -5, 1);
              const b = a + randInt(rng, 1, 5);
              const f = (r: number) => (r < 0 ? `(x+${-r})` : r === 0 ? 'x' : `(x-${r})`);
              return rmcq(rng, t`Resolva $${f(a)}${f(b)}>0$.`, outside(a, b), [ivx(a, b), outside(a, b, true), ivx(b, null)], t`Os dois fatores têm o mesmo sinal fora do intervalo $[${a},\,${b}]$.`);
            }),
            gen((rng) => {
              const a = randInt(rng, -5, 1);
              const b = a + randInt(rng, 1, 5);
              const f = (r: number) => (r < 0 ? `x+${-r}` : r === 0 ? 'x' : `x-${r}`);
              return rmcq(rng, t`Resolva $\dfrac{${f(a)}}{${f(b)}}<0$.`, ivx(a, b), [outside(a, b), ivx(a, b, true, false), ivx(a, b, true, true)], t`Numerador e denominador com sinais opostos só entre $${a}$ e $${b}$. As pontas ficam de fora: em $${a}$ dá zero e em $${b}$ não existe.`);
            }),
            gen((rng) => {
              const k = randInt(rng, 1, 7);
              return rmcq(rng, t`Resolva $x(x-${k})\le0$.`, ivx(0, k, true, true), [outside(0, k, true), ivx(0, k), ivx(k, null, true)], t`Raízes $0$ e $${k}$; o produto é negativo ou zero entre elas, inclusive nas pontas.`);
            }),
            mcqS(t`Resolva $(2-x)(x+1)>0$.`, t`$-1<x<2$`, [t`$x<-1$ ou $x>2$`, t`$x>2$`, t`$x<-1$`], t`Em $x=0$: $(2)(1)>0$ ✓. Os sinais mudam em $-1$ e $2$, então a solução é o trecho do meio.`),
            mcqS(t`Resolva $(x-1)(x-2)(x-3)>0$.`, t`$1<x<2$ ou $x>3$`, [t`$x>3$`, t`$x<1$ ou $2<x<3$`, t`$1<x<3$`], t`À direita de $3$ os três fatores são positivos; a cada raiz o sinal alterna: $+$ em $(3,\infty)$, $-$ em $(2,3)$, $+$ em $(1,2)$, $-$ em $(-\infty,1)$.`),
          ],
        },
      ],
    },
    {
      id: 'f-func-exp',
      title: 'Função exponencial',
      parts: [
        {
          card: {
            title: 'Crescimento que acelera',
            body: t`$f(x)=a^x$ com $a>0$, $a\ne1$.

• $a>1$: crescente (bactérias, juros) · $0<a<1$: decrescente (decaimento radioativo)
• Sempre passa por $(0, 1)$ e nunca toca o eixo $x$.`,
            visual: expLogLab(),
          },
          exercises: [
            mcq(t`Todo gráfico de $f(x)=a^x$ passa pelo ponto…`, ['$(0,\\ 1)$', '$(1,\\ 0)$', '$(0,\\ 0)$', '$(1,\\ 1)$'], 0, t`$a^0=1$ para qualquer base.`),
            mcq(t`O gráfico de $f(x)=\left(\frac12\right)^x$ é:`, ['decrescente e passa por $(0,\\ 1)$', 'crescente e passa por $(0,\\ 1)$', 'decrescente e passa por $(0,\\ 0)$', 'uma reta'], 0, t`Base entre 0 e 1: decrescente, e $a^0=1$.`),
            tf(t`A função $f(x)=2^x$ assume valores negativos para $x<0$.`, false, t`$2^{-1}=\frac12>0$: a exponencial é sempre positiva.`),
            tf(t`$f(x)=0{,}8^x$ é crescente.`, false, t`Base $0{,}8<1$: decrescente.`),
            gen((rng) => {
              const b = pick(rng, [2, 3, 4, 5]);
              const n = randInt(rng, 1, 2);
              return num(t`Calcule $f(-${n})$ para $f(x)=${b}^x$ (pode responder em fração).`, 1 / b ** n, t`$${b}^{-${n}}=\frac{1}{${b ** n}}$.`);
            }),
            inter(t`Ajuste a base para que a curva verde passe pelo ponto $(2,\ 9)$.`, 'plot', expLogLab().props, (v: any) => v && near(v.p.a, 3, 0.01), t`$a=3$, pois $3^2=9$.`),
            mcqS(t`Qual é maior: $2^{10}$ ou $10^3$?`, t`$2^{10}$`, [t`$10^3$`, t`são iguais`, t`depende do contexto`], t`$2^{10}=1024>1000=10^3$.`),
            mcq(t`Para $x$ muito grande, qual função fica maior?`, ['$2^x$', '$x^{10}$', '$100x$', '$x^2$'], 0, t`Qualquer exponencial com base $>1$ acaba passando qualquer potência de $x$.`),
          ],
        },
        {
          card: {
            title: 'Equações exponenciais',
            body: t`Iguale as bases e compare os expoentes:

$$2^{x+1}=32=2^5\Rightarrow x+1=5\Rightarrow x=4$$

O número $e\approx2{,}718$ é a base "natural" da engenharia: $e^x$ é a única função que é a **própria derivada**.`,
            tip: t`Se aparecer $a^{2x}$ e $a^x$ juntos, troque $y=a^x$: vira uma equação do 2º grau.`,
          },
          exercises: [
            gen((rng) => {
              const base = pick(rng, [2, 3, 5]);
              const k = randInt(rng, 2, base === 2 ? 6 : 3);
              const s = randNZ(rng, -2, 2);
              return num(t`Resolva $${base}^{x${term(s, '')}}=${Math.pow(base, k)}$.`, k - s, t`$${Math.pow(base, k)}=${base}^{${k}}$, então $x${term(s, '')}=${k}\Rightarrow x=${k - s}$.`);
            }),
            tf(t`A equação $2^x=0$ tem solução real.`, false, t`$2^x$ é sempre positivo: nunca vale zero.`),
            gen((rng) => {
              const k = randInt(rng, 2, 8);
              return num(t`Resolva $4^x=2^{${k}}$.`, k / 2, t`$4^x=(2^2)^x=2^{2x}$. Então $2x=${k}\Rightarrow x=${fmt(k / 2)}$.`);
            }),
            num(t`Resolva $9^x=27$.`, 1.5, t`$3^{2x}=3^3\Rightarrow 2x=3\Rightarrow x=1{,}5$.`),
            gen((rng) => {
              const k = randInt(rng, 1, 5);
              return num(t`Resolva $\left(\frac12\right)^x=${2 ** k}$.`, -k, t`$\left(\frac12\right)^x=2^{-x}=2^{${k}}\Rightarrow x=-${k}$.`);
            }),
            gen((rng) => {
              const k = 2 * randInt(rng, 1, 5) + 1;
              return num(t`Resolva $2^x\cdot2^{x+1}=2^{${k}}$.`, (k - 1) / 2, t`Some os expoentes: $2x+1=${k}\Rightarrow x=${(k - 1) / 2}$.`);
            }),
            num(t`Qual é a **maior** solução de $5^{x^2-1}=1$?`, 1, t`$1=5^0$, então $x^2-1=0\Rightarrow x=\pm1$.`),
            num(t`Qual é a **maior** solução de $2^{2x}-5\cdot2^x+4=0$?`, 2, t`Com $y=2^x$: $y^2-5y+4=0\Rightarrow y=1$ ou $y=4$. Então $x=0$ ou $x=2$.`),
          ],
        },
        {
          card: {
            title: 'Modelos exponenciais',
            body: t`• **Crescimento** com taxa fixa: $N(t)=N_0\,(1+i)^t$, ou com tempo de dobra $T$: $N(t)=N_0\cdot 2^{t/T}$
• **Decaimento** com meia-vida $T$: $N(t)=N_0\left(\tfrac12\right)^{t/T}$`,
            tip: t`Depois de 3 meias-vidas sobra $\tfrac18$; depois de 10, sobra menos de $0{,}1\%$.`,
          },
          exercises: [
            num(t`Uma cultura dobra a cada hora. Começando com 100 bactérias, quantas há após 5 horas?`, 3200, t`$100\cdot2^5=3200$.`),
            tf(t`Depois de 3 meias-vidas resta $\frac18$ da quantidade inicial.`, true, t`$\left(\frac12\right)^3=\frac18$.`),
            num(t`Uma substância tem meia-vida de 10 anos. De 80 g, quantos gramas restam após 30 anos?`, 10, t`3 meias-vidas: $80\cdot\left(\frac12\right)^3=10$ g.`, { unit: 'g' }),
            gen((rng) => {
              const T = pick(rng, [2, 5, 8, 12]);
              const n = randInt(rng, 2, 4);
              const N0 = 2 ** n * pick(rng, [5, 10, 25]);
              return num(t`Um isótopo tem meia-vida de $${T}$ dias. Começando com $${N0}$ mg, quanto resta após $${n * T}$ dias?`, N0 / 2 ** n, t`São $${n}$ meias-vidas: $${N0}\cdot\left(\frac12\right)^{${n}}=${N0 / 2 ** n}$ mg.`, { unit: 'mg' });
            }),
            gen((rng) => {
              const T = pick(rng, [3, 4, 6]);
              const n = randInt(rng, 2, 5);
              const N0 = pick(rng, [50, 100, 1000]);
              return num(t`Uma população dobra a cada $${T}$ horas. Começando com $${N0}$, quantos indivíduos há após $${n * T}$ horas?`, N0 * 2 ** n, t`$${N0}\cdot2^{${n * T}/${T}}=${N0}\cdot2^{${n}}=${N0 * 2 ** n}$.`);
            }),
            gen((rng) => {
              const P = pick(rng, [10000, 20000, 50000]);
              return num(t`Uma cidade de $${P}$ habitantes cresce $10\%$ ao ano. Quantos habitantes terá em $2$ anos?`, Math.round(P * 1.21), t`$${P}\cdot1{,}1^2=${P}\cdot1{,}21=${Math.round(P * 1.21)}$.`);
            }),
            gen((rng) => {
              const n = randInt(rng, 2, 6);
              return num(t`Quantas meias-vidas são necessárias para restar $\frac{1}{${2 ** n}}$ de uma amostra?`, n, t`$\left(\frac12\right)^n=\frac{1}{${2 ** n}}=\left(\frac12\right)^{${n}}$.`);
            }),
            num(t`Um medicamento é eliminado à taxa de $20\%$ por hora. De uma dose de $100$ mg, quanto resta no corpo após $2$ horas?`, 64, t`A cada hora fica $80\%$: $100\cdot0{,}8^2=64$ mg.`, { unit: 'mg' }),
          ],
        },
      ],
    },
    {
      id: 'f-func-log',
      title: 'Logaritmos',
      parts: [
        {
          card: {
            title: 'A pergunta inversa',
            body: t`$$\log_a b = x \iff a^x=b$$

"A que expoente eu elevo $a$ para obter $b$?" Ex.: $\log_2 8=3$ porque $2^3=8$.

O gráfico do log é o **espelho** da exponencial na reta $y=x$:`,
            visual: expLogLab(),
            tip: t`Só existe $\log_a b$ com $b>0$ e base $a>0$, $a\neq1$. E $\log_a 1=0$ sempre.`,
          },
          exercises: [
            gen((rng) => {
              const a = pick(rng, [2, 3, 5, 10]);
              const k = randInt(rng, 1, a === 2 ? 7 : 3);
              return num(t`Calcule $\log_{${a}} ${Math.pow(a, k)}$.`, k, t`$${a}^{${k}}=${Math.pow(a, k)}$.`);
            }),
            mcq(t`Quanto vale $\log_7 1$?`, ['$0$', '$1$', '$7$', 'não existe'], 0, t`$7^0=1$.`),
            num(t`Calcule $\log_2 \frac{1}{8}$.`, -3, t`$2^{-3}=\frac18$.`),
            gen((rng) => {
              const k = randInt(rng, -4, 4);
              const v = 10 ** k;
              return num(t`Calcule $\log ${k >= 0 ? v : fmt(v, 6)}$ (base 10).`, k, t`$10^{${k}}=${k >= 0 ? v : fmt(v, 6)}$.`);
            }),
            tf(t`$\log_2 0$ é um número real.`, false, t`Nenhuma potência de 2 dá zero: o log de $0$ não existe.`),
            inter(t`Ajuste a base para que a curva rosa ($\log_a x$) passe pelo ponto $(9,\ 2)$.`, 'plot', expLogLab().props, (v: any) => v && near(v.p.a, 3, 0.01), t`$a=3$, pois $\log_3 9=2$.`),
            gen((rng) => {
              const [b, x, num_, ans] = pick(rng, [[4, 8, '8', 1.5], [9, 27, '27', 1.5], [8, 4, '4', 2 / 3], [4, 2, '2', 0.5], [27, 9, '9', 2 / 3]] as const);
              return num(t`Calcule $\log_{${b}} ${num_}$.`, ans, t`Escreva tudo na mesma base: $${b}^{x}=${x}$ dá $x=${fmt(ans, 4)}$.`, { tol: 0.002 });
            }),
            gen((rng) => {
              const [b, bt, x, ans] = pick(rng, [[2, '\\frac12', 8, -3], [3, '\\frac13', 9, -2], [2, '\\frac12', 16, -4], [5, '\\frac15', 25, -2]] as const);
              return num(t`Calcule $\log_{${bt}} ${x}$.`, ans, t`$\left(${bt}\right)^{${ans}}=${b}^{${-ans}}=${x}$.`);
            }),
          ],
        },
        {
          card: {
            title: 'Propriedades',
            body: t`$$\log(ab)=\log a+\log b \qquad \log\frac ab=\log a-\log b$$
$$\log a^n = n\log a \qquad \log_a b=\frac{\log_c b}{\log_c a}$$

$\ln$ é o log na base $e$; $\log$ sem base costuma ser base 10.`,
          },
          exercises: [
            match(t`Ligue cada expressão à sua simplificação:`, [
              [t`$\log a+\log b$`, t`$\log(ab)$`],
              [t`$\log a-\log b$`, t`$\log\frac ab$`],
              [t`$3\log a$`, t`$\log a^3$`],
              [t`$\log_a a$`, '$1$'],
            ]),
            tf(t`$\log(a+b)=\log a+\log b$`, false, t`A propriedade é para **produto**: $\log(ab)=\log a+\log b$.`),
            gen((rng) => {
              const m = randInt(rng, 1, 4);
              const n = randInt(rng, 1, 4);
              return num(t`Calcule $\log_2(${2 ** m}\cdot${2 ** n})$.`, m + n, t`$\log_2 ${2 ** m}+\log_2 ${2 ** n}=${m}+${n}=${m + n}$.`);
            }),
            gen((rng) => {
              const m = randInt(rng, 3, 5);
              const n = randInt(rng, 1, 2);
              return num(t`Calcule $\log_3 ${3 ** m}-\log_3 ${3 ** n}$.`, m - n, t`$${m}-${n}=${m - n}$ (ou $\log_3\frac{${3 ** m}}{${3 ** n}}=\log_3 ${3 ** (m - n)}$).`);
            }),
            num(t`Sabendo que $\log 2\approx0{,}301$ e $\log 3\approx0{,}477$, calcule $\log 12$.`, 1.079, t`$\log12=\log(4\cdot3)=2\log2+\log3\approx0{,}602+0{,}477=1{,}079$.`, { tol: 0.002 }),
            gen((rng) => {
              const [x, ans, why] = pick(rng, [
                ['8', 0.903, '\\log 2^3=3\\log2'],
                ['5', 0.699, '\\log\\frac{10}{2}=1-\\log2'],
                ['20', 1.301, '\\log(2\\cdot10)=\\log2+1'],
                ['0{,}5', -0.301, '\\log 2^{-1}=-\\log 2'],
              ] as const);
              return num(t`Sabendo que $\log 2\approx0{,}301$, calcule $\log ${x}$.`, ans, t`$${why}\approx${fmt(ans, 3)}$.`, { tol: 0.002 });
            }),
            num(t`Use mudança de base para calcular $\log_4 32$.`, 2.5, t`$\log_4 32=\frac{\log_2 32}{\log_2 4}=\frac52=2{,}5$.`),
            num(t`Calcule $\log_2 3\cdot\log_3 8$.`, 3, t`Mudança de base: $\frac{\ln3}{\ln2}\cdot\frac{\ln8}{\ln3}=\frac{\ln8}{\ln2}=\log_2 8=3$.`),
          ],
        },
        {
          card: {
            title: 'Equações com logaritmos',
            body: t`Para tirar o $x$ do expoente, aplique log:

$$a^x=b\ \Rightarrow\ x=\log_a b=\frac{\ln b}{\ln a}$$

Em $\log_a(\text{algo})=c$, volte para a forma exponencial: algo $=a^c$ (e confira se o "algo" é positivo).`,
            example: t`$3^x=20\Rightarrow x=\frac{\ln20}{\ln3}\approx2{,}727$. E $\log_2(x+1)=3\Rightarrow x+1=8\Rightarrow x=7$.`,
          },
          exercises: [
            gen((rng) => {
              const k = randInt(rng, 1, 6);
              return num(t`Resolva $\log_2 x=${k}$.`, 2 ** k, t`$x=2^{${k}}=${2 ** k}$.`);
            }),
            tf(t`Se $\log x=\log 5$, então $x=5$.`, true, t`O log é injetor: logs iguais (mesma base) ⟹ números iguais.`),
            gen((rng) => {
              const k = randInt(rng, 1, 3);
              const s = randInt(rng, 1, 5);
              return num(t`Resolva $\log_3(x-${s})=${k}$.`, 3 ** k + s, t`$x-${s}=3^{${k}}=${3 ** k}\Rightarrow x=${3 ** k + s}$.`);
            }),
            gen((rng) => {
              const b = pick(rng, [10, 20, 50, 100]);
              return num(t`Resolva $2^x=${b}$ (use $x=\frac{\ln ${b}}{\ln 2}$; responda com 2 casas).`, Math.log(b) / Math.log(2), t`$x=\frac{\ln${b}}{\ln2}\approx${fmt(Math.log(b) / Math.log(2), 2)}$.`, { tol: 0.01 });
            }),
            gen((rng) => {
              const k = randInt(rng, 2, 11);
              return num(t`O pH é $-\log[\mathrm{H^+}]$. Qual o pH de uma solução com $[\mathrm{H^+}]=10^{-${k}}$ mol/L?`, k, t`$-\log 10^{-${k}}=${k}$.`);
            }),
            mcqS(t`Quantos anos leva para um capital dobrar a 10% ao ano (compostos)? Use $\frac{\ln 2}{\ln 1{,}1}$.`, 'cerca de 7,3 anos', ['5 anos', '10 anos', 'cerca de 20 anos'], t`$1{,}1^t=2\Rightarrow t=\frac{\ln2}{\ln1{,}1}\approx\frac{0{,}693}{0{,}0953}\approx7{,}3$.`),
            num(t`Resolva $\log x+\log(x-3)=1$.`, 5, t`$\log[x(x-3)]=1\Rightarrow x^2-3x=10\Rightarrow x=5$ ou $x=-2$. Só $x=5$ deixa os logs definidos.`),
            num(t`Em quantos anos um investimento a $5\%$ ao ano **triplica**? Use $t=\frac{\ln 3}{\ln 1{,}05}$ e responda com 1 casa.`, Math.log(3) / Math.log(1.05), t`$t=\frac{1{,}0986}{0{,}0488}\approx22{,}5$ anos.`, { tol: 0.15, unit: 'anos' }),
          ],
        },
      ],
    },
  ],
};

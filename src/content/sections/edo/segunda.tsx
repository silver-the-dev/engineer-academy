import React from 'react';
import type { UnitDef } from '../../types';
import { gen, mcq, mcqS, num, tf, fill, match, order, inter, plot, rmcq, near, multi, table } from '../../helpers';
import { FnCurve, Label, PolylineW, Pt, RectW, Seg } from '../../../components/plot/Plot';
import { C } from '../../../theme';
import { fmt, pick, randInt, randNZ, term } from '../../../lib/random';

const t = String.raw;

/** RK4 for m x'' + c x' + k x = F0 cos(w t), x(0)=x0, x'(0)=v0, sampled on [0, T]. */
function oscPath(m: number, c: number, k: number, F0: number, w: number, x0: number, v0: number, T: number, n = 500): [number, number][] {
  const out: [number, number][] = [[0, x0]];
  const h = T / n;
  let x = x0;
  let v = v0;
  const acc = (tt: number, xx: number, vv: number) => (F0 * Math.cos(w * tt) - c * vv - k * xx) / m;
  for (let i = 0; i < n; i++) {
    const tt = i * h;
    const k1x = v;
    const k1v = acc(tt, x, v);
    const k2x = v + (h / 2) * k1v;
    const k2v = acc(tt + h / 2, x + (h / 2) * k1x, v + (h / 2) * k1v);
    const k3x = v + (h / 2) * k2v;
    const k3v = acc(tt + h / 2, x + (h / 2) * k2x, v + (h / 2) * k2v);
    const k4x = v + h * k3v;
    const k4v = acc(tt + h, x + h * k3x, v + h * k3v);
    x += (h / 6) * (k1x + 2 * k2x + 2 * k3x + k4x);
    v += (h / 6) * (k1v + 2 * k2v + 2 * k3v + k4v);
    out.push([(i + 1) * h, x]);
  }
  return out;
}

const regime = (m: number, c: number, k: number) => {
  const d = c * c - 4 * m * k;
  if (Math.abs(d) < 1e-6) return 'amortecimento **crítico**';
  if (c < 1e-9) return '**sem amortecimento** (oscila para sempre)';
  return d < 0 ? '**subamortecido** (oscila decaindo)' : '**superamortecido** (volta sem oscilar)';
};

/**
 * Mass-spring-damper: x(t) on the right, the spring and mass drawn on the left
 * at the instant chosen by the t slider. Optional forcing F0 cos(w t).
 */
const springLab = (o: { m?: number; c?: number; k?: number; forced?: boolean; showT?: boolean } = {}) => {
  const T = 20;
  const params = [
    { key: 'm', label: 'm', min: 0.5, max: 4, step: 0.1, value: o.m ?? 1, color: C.p2 },
    { key: 'c', label: 'c', min: 0, max: 6, step: 0.1, value: o.c ?? 0.4, color: C.p5 },
    { key: 'k', label: 'k', min: 0.5, max: 8, step: 0.1, value: o.k ?? 4, color: C.p3 },
  ];
  if (o.forced) params.push({ key: 'w', label: '\\omega', min: 0.2, max: 4, step: 0.05, value: 1, color: C.gold });
  if (o.showT !== false) params.push({ key: 'tt', label: 't', min: 0, max: T, step: 0.1, value: 3, color: C.textMuted });
  return plot({
    view: { xMin: -6, xMax: T, yMin: o.forced ? -4 : -1.6, yMax: o.forced ? 4.5 : 2.2 },
    params,
    render: ({ p }: any) => {
      const F0 = o.forced ? 1 : 0;
      const w = o.forced ? p.w : 0;
      const x0 = o.forced ? 0 : 1;
      const path = oscPath(p.m, p.c, p.k, F0, w, x0, 0, T);
      const tt = p.tt ?? 0;
      const xNow = path[Math.min(path.length - 1, Math.round((tt / T) * (path.length - 1)))][1];
      const top = o.forced ? 4.2 : 2;
      const yMass = Math.max(-3.8, Math.min(top - 0.6, xNow));
      const coils: [number, number][] = [];
      const nCoil = 10;
      for (let i = 0; i <= nCoil; i++) coils.push([-3 + (i === 0 || i === nCoil ? 0 : i % 2 ? -0.5 : 0.5), top - ((top - (yMass + 0.3)) * i) / nCoil]);
      return (
        <>
          <Seg x1={-4.5} y1={top} x2={-1.5} y2={top} color={C.textMuted} width={4} />
          <PolylineW pts={coils} color={C.p3} width={2.2} />
          <RectW x={-3.8} y={yMass - 0.3} w={1.6} h={0.6} color={C.p2} opacity={0.85} />
          <Seg x1={-0.2} y1={0} x2={T} y2={0} color={C.textDim} width={1} dash="4 4" />
          <PolylineW pts={path} color={C.p1} width={2.5} />
          {p.tt !== undefined ? <Pt x={tt} y={xNow} color={C.gold} r={5} /> : null}
        </>
      );
    },
    info: ({ p }: any) => {
      const w0 = Math.sqrt(p.k / p.m);
      if (o.forced) {
        const A = 1 / Math.sqrt((p.k - p.m * p.w * p.w) ** 2 + (p.c * p.w) ** 2);
        return t`$\omega_0=\sqrt{k/m}=${fmt(w0, 2)}$ · forçamento $\omega=${fmt(p.w, 2)}$ · amplitude estacionária $\approx${fmt(A, 2)}$`;
      }
      return t`$\omega_0=\sqrt{k/m}=${fmt(w0, 2)}$ · $c^2-4mk=${fmt(p.c * p.c - 4 * p.m * p.k, 2)}$ ⟹ ${regime(p.m, p.c, p.k)}`;
    },
  });
};

/** y'' + b y' + c y = 0 with y(0)=1, y'(0)=0 — shows the roots and the case. */
const charLab = () =>
  plot({
    view: { xMin: -0.2, xMax: 8, yMin: -2, yMax: 2.5 },
    params: [
      { key: 'b', label: 'b', min: -1, max: 5, step: 0.1, value: 1, color: C.p5 },
      { key: 'c', label: 'c', min: 0, max: 8, step: 0.1, value: 4, color: C.p3 },
    ],
    render: ({ p }: any) => (
      <>
        <Seg x1={0} y1={0} x2={8} y2={0} color={C.textDim} width={1} dash="4 4" />
        <PolylineW pts={oscPath(1, p.b, p.c, 0, 0, 1, 0, 8, 300)} color={C.p1} width={3} />
      </>
    ),
    info: ({ p }: any) => {
      const D = p.b * p.b - 4 * p.c;
      if (Math.abs(D) < 1e-6) return t`$r^2${term(Math.round(p.b * 10) / 10, 'r')}${term(Math.round(p.c * 10) / 10, '')}=0$ · $\Delta=0$: raiz **dupla** $r=${fmt(-p.b / 2, 2)}$`;
      if (D > 0) return t`$\Delta=${fmt(D, 2)}>0$: raízes **reais** $${fmt((-p.b - Math.sqrt(D)) / 2, 2)}$ e $${fmt((-p.b + Math.sqrt(D)) / 2, 2)}$`;
      return t`$\Delta=${fmt(D, 2)}<0$: raízes **complexas** $${fmt(-p.b / 2, 2)}\pm${fmt(Math.sqrt(-D) / 2, 2)}\,i$`;
    },
  });

/** e^{rt} written nicely (r integer). */
const ert = (r: number) => (r === 0 ? '' : r === 1 ? 'e^{t}' : r === -1 ? 'e^{-t}' : `e^{${r}t}`);
const ode = (b: number, c: number) => `y''${term(b, "y'")}${term(c, 'y')}=0`;
const charPoly = (b: number, c: number) => `r^2${term(b, 'r')}${term(c, '')}`;

export const edo2: UnitDef = {
  id: 'd-edo2',
  title: 'EDOs lineares de 2ª ordem',
  subtitle: 'Equação característica, osciladores e forçamento',
  icon: '🎛️',
  source: 'Cálculo 4 · Equações diferenciais ordinárias',
  guide: t`$ay''+by'+cy=0$ vira uma equação do 2º grau: chutando $y=e^{rt}$ sai $ar^2+br+c=0$. Raízes reais, dupla ou complexas dão os três tipos de solução — e, na física, os regimes **superamortecido**, **crítico** e **subamortecido** de um amortecedor. Com uma força externa, somamos uma **solução particular** e encontramos a **ressonância**.`,
  lessons: [
    {
      id: 'd-edo2-hom',
      title: 'Homogêneas com coeficientes constantes',
      parts: [
        {
          card: {
            title: 'A equação característica',
            body: t`Para $ay''+by'+cy=0$, tente $y=e^{rt}$: $y'=re^{rt}$, $y''=r^2e^{rt}$. Substituindo:

$$e^{rt}\,(ar^2+br+c)=0\ \Rightarrow\ ar^2+br+c=0$$

Se as raízes $r_1\ne r_2$ são reais: $y=C_1e^{r_1t}+C_2e^{r_2t}$.

**Superposição**: numa EDO linear homogênea, somas e múltiplos de soluções são soluções. Mexa em $b$ e $c$ (com $y(0)=1$, $y'(0)=0$):`,
            visual: charLab(),
          },
          exercises: [
            mcqS(t`Qual a equação característica de $y''-5y'+6y=0$?`, t`$r^2-5r+6=0$`, [t`$r^2+5r+6=0$`, t`$r-5+6=0$`, t`$r^2-5r=6$`, t`$6r^2-5r+1=0$`], t`Troque $y''\to r^2$, $y'\to r$, $y\to1$.`),
            tf(t`Se $y_1$ e $y_2$ resolvem $y''+y=0$, então $3y_1-2y_2$ também resolve.`, true, t`Princípio da superposição (EDO linear e homogênea).`),
            gen((rng) => {
              let r1 = randNZ(rng, -4, 4);
              let r2 = randNZ(rng, -4, 4);
              if (r1 === r2) r2 = r1 === 4 ? -1 : r1 + 1;
              if (r2 === 0) r2 = 2;
              [r1, r2] = [Math.min(r1, r2), Math.max(r1, r2)];
              const b = -(r1 + r2);
              const c = r1 * r2;
              return rmcq(rng, t`Solução geral de $${ode(b, c)}$:`, `$y=C_1${ert(r1)}+C_2${ert(r2)}$`, [`$y=C_1${ert(-r1)}+C_2${ert(-r2)}$`, `$y=(C_1+C_2t)${ert(r1)}$`, `$y=C_1\\cos(${Math.abs(r1)}t)+C_2\\operatorname{sen}(${Math.abs(r2)}t)$`, `$y=C_1${ert(r1 * r2)}+C_2${ert(r1 + r2)}$`], t`$${charPoly(b, c)}=(r${term(-r1, '')})(r${term(-r2, '')})$: raízes $${r1}$ e $${r2}$.`);
            }),
            gen((rng) => {
              const r1 = randInt(rng, -4, -1);
              const r2 = randInt(rng, 1, 4);
              return num(t`A equação $${ode(-(r1 + r2), r1 * r2)}$ tem raízes características $r_1<r_2$. Quanto vale $r_2$?`, r2, t`$${charPoly(-(r1 + r2), r1 * r2)}=(r${term(-r1, '')})(r${term(-r2, '')})$.`);
            }),
            multi(t`Quais funções resolvem $y''-y=0$?`, [t`$e^t$`, t`$e^{-t}$`, t`$\cosh t=\frac{e^t+e^{-t}}{2}$`, t`$\operatorname{sen}t$`], [0, 1, 2], t`Raízes $\pm1$; $\cosh t$ é combinação das duas. $\operatorname{sen}t$ resolve $y''+y=0$.`),
            inter(t`No lab, escolha $b$ e $c$ com raízes reais **distintas** e **negativas** (a solução decai sem oscilar).`, 'plot', charLab().props, (v: any) => v && v.p.b * v.p.b - 4 * v.p.c > 0.05 && v.p.b > 0 && v.p.c > 0.01, t`Por exemplo $b=3$, $c=2$: raízes $-1$ e $-2$.`),
            num(t`Resolva $y''-3y'+2y=0$ com $y(0)=0$, $y'(0)=1$. Quanto vale $C_2$ em $y=C_1e^t+C_2e^{2t}$?`, 1, t`$C_1+C_2=0$ e $C_1+2C_2=1$ ⟹ $C_2=1$, $C_1=-1$.`),
            gen((rng) => {
              const r = randInt(rng, 2, 5);
              return num(t`$y''-${r * r}y=0$ com $y(0)=2$, $y'(0)=0$ tem solução $y=C_1e^{${r}t}+C_2e^{-${r}t}$. Quanto vale $C_1$?`, 1, t`$C_1+C_2=2$ e $${r}C_1-${r}C_2=0$ ⟹ $C_1=C_2=1$ ($y=2\cosh(${r}t)$).`);
            }),
          ],
        },
        {
          card: {
            title: 'Raiz dupla',
            body: t`Se $\Delta=b^2-4ac=0$, só sobra uma raiz $r$. A segunda solução independente é $te^{rt}$:

$$y=(C_1+C_2\,t)\,e^{rt}$$

Confira: para $y''-4y'+4y=0$, $r=2$ dupla, e $y=te^{2t}$ dá $y'=(1+2t)e^{2t}$, $y''=(4+4t)e^{2t}$; somando: $(4+4t-4-8t+4t)e^{2t}=0$ ✓.`,
            tip: t`Em física, a raiz dupla é o **amortecimento crítico**: o sistema volta ao repouso o mais rápido possível sem oscilar.`,
          },
          exercises: [
            mcqS(t`Solução geral de $y''+6y'+9y=0$:`, t`$y=(C_1+C_2t)e^{-3t}$`, [t`$y=C_1e^{-3t}+C_2e^{3t}$`, t`$y=C_1e^{-3t}$`, t`$y=(C_1+C_2t)e^{3t}$`, t`$y=C_1\cos3t+C_2\operatorname{sen}3t$`], t`$r^2+6r+9=(r+3)^2$: $r=-3$ dupla.`),
            gen((rng) => {
              const r = randNZ(rng, -4, 4);
              return rmcq(rng, t`Solução geral de $${ode(-2 * r, r * r)}$:`, `$y=(C_1+C_2t)${ert(r)}$`, [`$y=C_1${ert(r)}+C_2${ert(-r)}$`, `$y=(C_1+C_2t)${ert(-r)}$`, `$y=C_1${ert(r)}$`, `$y=C_1\\cos(${Math.abs(r)}t)+C_2\\operatorname{sen}(${Math.abs(r)}t)$`], t`$${charPoly(-2 * r, r * r)}=(r${term(-r, '')})^2$: raiz dupla $${r}$.`);
            }),
            tf(t`Para $y''-4y'+4y=0$, a função $y=te^{2t}$ é solução.`, true, t`Verificação feita no card: a soma se anula.`),
            gen((rng) => {
              const r = randInt(rng, 1, 5);
              return num(t`Para que valor de $c$ a equação $y''+${2 * r}y'+cy=0$ tem raiz característica dupla?`, r * r, t`$\Delta=${4 * r * r}-4c=0\Rightarrow c=${r * r}$.`);
            }),
            num(t`Resolva $y''+2y'+y=0$, $y(0)=1$, $y'(0)=0$. Quanto vale $C_2$ em $y=(C_1+C_2t)e^{-t}$?`, 1, t`$C_1=1$; $y'(0)=C_2-C_1=0\Rightarrow C_2=1$.`),
            fill(t`Complete a classificação pelo discriminante de $ar^2+br+c$:`, t`$\Delta>0$: ___ ; $\Delta=0$: ___ ; $\Delta<0$: ___`, [t`$C_1e^{r_1t}+C_2e^{r_2t}$`, t`$(C_1+C_2t)e^{rt}$`, t`$e^{\alpha t}(C_1\cos\beta t+C_2\operatorname{sen}\beta t)$`], [t`$C_1e^{rt}$`, t`$C_1t+C_2$`], t`São os três casos da equação característica.`),
            inter(t`Ajuste $b$ e $c$ no lab para obter **raiz dupla** (amortecimento crítico) com $b=2$.`, 'plot', charLab().props, (v: any) => v && near(v.p.b, 2, 0.01) && near(v.p.c, 1, 0.01), t`$b=2$, $c=1$: $r^2+2r+1=(r+1)^2$.`),
            mcq(t`Por que $te^{rt}$ entra na raiz dupla, e não $2e^{rt}$?`, ['$2e^{rt}$ é múltiplo de $e^{rt}$: não traz informação nova', '$2e^{rt}$ não é solução', '$te^{rt}$ é mais simples', 'porque $t$ é o tempo'], 0, t`Precisamos de duas soluções **linearmente independentes** para encaixar duas condições iniciais.`),
          ],
        },
        {
          card: {
            title: 'Raízes complexas',
            body: t`Se $\Delta<0$, as raízes são $r=\alpha\pm\beta i$. Pela fórmula de Euler $e^{i\beta t}=\cos\beta t+i\operatorname{sen}\beta t$, as soluções reais são:

$$y=e^{\alpha t}\left(C_1\cos\beta t+C_2\operatorname{sen}\beta t\right)$$

$\beta$ dá a **frequência** da oscilação e $\alpha$ diz se ela **cresce** ($\alpha>0$), **decai** ($\alpha<0$) ou se mantém ($\alpha=0$).`,
            example: t`$y''+2y'+5y=0$: $r=\frac{-2\pm\sqrt{-16}}{2}=-1\pm2i$ ⟹ $y=e^{-t}(C_1\cos2t+C_2\operatorname{sen}2t)$.`,
          },
          exercises: [
            mcqS(t`Solução geral de $y''+9y=0$:`, t`$y=C_1\cos3t+C_2\operatorname{sen}3t$`, [t`$y=C_1e^{3t}+C_2e^{-3t}$`, t`$y=C_1\cos9t+C_2\operatorname{sen}9t$`, t`$y=(C_1+C_2t)e^{3t}$`, t`$y=e^{3t}\cos t$`], t`$r^2+9=0\Rightarrow r=\pm3i$ ($\alpha=0$, $\beta=3$).`),
            gen((rng) => {
              const a = randInt(rng, -3, 2);
              const b = randInt(rng, 1, 4);
              const B = -2 * a;
              const Cc = a * a + b * b;
              const ea = a === 0 ? '' : `e^{${a === 1 ? '' : a === -1 ? '-' : a}t}`;
              return rmcq(rng, t`Solução geral de $${ode(B, Cc)}$:`, `$y=${ea}(C_1\\cos ${b === 1 ? '' : b}t+C_2\\operatorname{sen}${b === 1 ? '' : b}t)$`, [`$y=${ea}(C_1\\cos ${Cc}t+C_2\\operatorname{sen}${Cc}t)$`, `$y=C_1e^{${a + b}t}+C_2e^{${a - b}t}$`, `$y=e^{${-a === 0 ? 1 : -a}t}(C_1\\cos ${b === 1 ? '' : b}t+C_2\\operatorname{sen}${b === 1 ? '' : b}t)$`, `$y=(C_1+C_2t)e^{${a}t}$`], t`$r=\frac{${-B}\pm\sqrt{${B * B - 4 * Cc}}}{2}=${a}\pm${b}i$.`);
            }),
            tf(t`As soluções de $y''-2y'+10y=0$ oscilam com amplitude crescente.`, true, t`$r=1\pm3i$: $\alpha=1>0$, então $e^{t}$ faz a amplitude crescer.`),
            num(t`Qual o período das oscilações de $y''+4y=0$? (2 casas)`, Math.PI, t`$\beta=2\Rightarrow T=\frac{2\pi}{2}=\pi\approx3{,}14$.`, { tol: 0.01 }),
            inter(t`No lab, deixe $b=0$ e ajuste $c$ para que a solução seja $\cos2t$.`, 'plot', charLab().props, (v: any) => v && near(v.p.b, 0, 0.01) && near(v.p.c, 4, 0.01), t`$y''+4y=0$: $c=4$.`),
            num(t`Resolva $y''+y=0$, $y(0)=2$, $y'(0)=3$. Quanto vale $C_2$ em $y=C_1\cos t+C_2\operatorname{sen}t$?`, 3, t`$y(0)=C_1=2$; $y'(0)=C_2=3$.`),
            gen((rng) => {
              const b = randInt(rng, 1, 5);
              const A = randInt(rng, 1, 4);
              const B = randInt(rng, 1, 4);
              return num(t`$y''+${b * b}y=0$ com $y(0)=${A}$ e $y'(0)=${b * B}$: quanto vale $C_2$ em $y=C_1\cos${b === 1 ? '' : b}t+C_2\operatorname{sen}${b === 1 ? '' : b}t$?`, B, t`$y'(0)=${b}C_2=${b * B}\Rightarrow C_2=${B}$.`);
            }),
            mcqS(t`Qual identidade transforma $e^{(\alpha+\beta i)t}$ em senos e cossenos?`, t`$e^{i\theta}=\cos\theta+i\operatorname{sen}\theta$`, [t`$\operatorname{sen}^2\theta+\cos^2\theta=1$`, t`$e^{\ln x}=x$`, t`$\cos2\theta=1-2\operatorname{sen}^2\theta$`, t`$i^2=-1$ apenas`], t`Fórmula de Euler.`),
          ],
        },
      ],
    },
    {
      id: 'd-edo2-osc',
      title: 'Osciladores',
      parts: [
        {
          card: {
            title: 'Massa-mola',
            body: t`Uma massa $m$ presa a uma mola de constante $k$ (lei de Hooke $F=-kx$), sem atrito:

$$m\,x''+k\,x=0\quad\Rightarrow\quad x=A\cos(\omega_0t)+B\operatorname{sen}(\omega_0t),\quad \omega_0=\sqrt{\frac km}$$

Período $T=\frac{2\pi}{\omega_0}$. Mola **mais dura** ⟹ oscila mais rápido; massa **maior** ⟹ mais devagar. Mova o tempo $t$ e veja a massa acompanhar o gráfico:`,
            visual: springLab({ c: 0 }),
          },
          exercises: [
            gen((rng) => {
              const m = pick(rng, [1, 2, 4]);
              const w = randInt(rng, 1, 4);
              return num(t`Uma massa de $${m}$ kg numa mola com $k=${m * w * w}$ N/m. Qual a frequência angular $\omega_0$ (rad/s)?`, w, t`$\omega_0=\sqrt{${m * w * w}/${m}}=${w}$.`);
            }),
            tf(t`Quadruplicar a massa (mesma mola) dobra o período.`, true, t`$T=2\pi\sqrt{m/k}$: $\sqrt4=2$.`),
            num(t`Qual o período (s) de $x''+16x=0$? (2 casas)`, Math.PI / 2, t`$\omega_0=4$, $T=\frac{2\pi}{4}\approx1{,}57$.`, { tol: 0.01 }),
            inter(t`No lab (sem atrito, $c=0$), ajuste $m$ e $k$ para $\omega_0=2$ com $m=2$.`, 'plot', springLab({ c: 0 }).props, (v: any) => v && near(v.p.c, 0, 0.01) && near(v.p.m, 2, 0.01) && near(v.p.k, 8, 0.05), t`$\omega_0^2=k/m=4\Rightarrow k=8$.`),
            gen((rng) => {
              const w = randInt(rng, 1, 5);
              const x0 = randInt(rng, 1, 4);
              const v0 = w * randInt(rng, 0, 3);
              return num(t`$x''+${w * w}x=0$ com $x(0)=${x0}$, $x'(0)=${v0}$. Qual a amplitude $\sqrt{A^2+B^2}$? (2 casas)`, Math.hypot(x0, v0 / w), t`$A=${x0}$, $B=\frac{${v0}}{${w}}=${fmt(v0 / w)}$; amplitude $=\sqrt{${x0 * x0}+${fmt((v0 / w) ** 2)}}\approx${fmt(Math.hypot(x0, v0 / w), 2)}$.`, { tol: 0.01 });
            }),
            mcq(t`Sem atrito, a energia mecânica do oscilador…`, ['se conserva, por isso ele oscila para sempre', 'decai exponencialmente', 'cresce', 'zera após um período'], 0, t`$\frac12mv^2+\frac12kx^2$ é constante quando $c=0$.`),
            mcqS(t`Uma mola estica $0{,}1$ m com $10$ N. Com uma massa de $1$ kg, quanto vale $\omega_0$?`, t`$10$ rad/s`, [t`$100$ rad/s`, t`$1$ rad/s`, t`$\sqrt{10}$ rad/s`, t`$0{,}1$ rad/s`], t`$k=\frac{10}{0{,}1}=100$ N/m; $\omega_0=\sqrt{100/1}=10$.`),
            num(t`Em $x=3\cos(2t)+4\operatorname{sen}(2t)$, qual a amplitude?`, 5, t`$\sqrt{3^2+4^2}=5$: dá para escrever $x=5\cos(2t-\varphi)$.`),
          ],
        },
        {
          card: {
            title: 'Amortecimento',
            body: t`Com um amortecedor (força $-c\,x'$):

$$m\,x''+c\,x'+k\,x=0,\qquad r=\frac{-c\pm\sqrt{c^2-4mk}}{2m}$$

• $c^2<4mk$: **subamortecido** — oscila com amplitude decaindo
• $c^2=4mk$: **crítico** — volta ao repouso o mais rápido possível
• $c^2>4mk$: **superamortecido** — volta devagar, sem oscilar

Suspensão de carro e portas com mola são projetadas perto do **crítico**.`,
            visual: springLab({ c: 0.6 }),
          },
          exercises: [
            gen((rng) => {
              const m = pick(rng, [1, 2]);
              const k = pick(rng, [2, 4, 8]);
              const c = pick(rng, [1, 2, 4, 6, 8]);
              const d = c * c - 4 * m * k;
              const ans = d < 0 ? 'subamortecido' : d === 0 ? 'crítico' : 'superamortecido';
              return rmcq(rng, t`Com $m=${m}$, $c=${c}$, $k=${k}$, o oscilador é:`, ans, ['subamortecido', 'crítico', 'superamortecido', 'sem amortecimento'].filter((x) => x !== ans), t`$c^2-4mk=${c * c}-${4 * m * k}=${d}$.`);
            }),
            gen((rng) => {
              const m = pick(rng, [1, 2, 4]);
              const k = pick(rng, [1, 4, 9]);
              return num(t`Qual o amortecimento crítico $c$ para $m=${m}$ e $k=${k}$?`, 2 * Math.sqrt(m * k), t`$c=2\sqrt{mk}=2\sqrt{${m * k}}=${fmt(2 * Math.sqrt(m * k), 2)}$.`, { tol: 0.01 });
            }),
            inter(t`Ajuste o lab para amortecimento **crítico** com $m=1$ e $k=4$.`, 'plot', springLab({ c: 1 }).props, (v: any) => v && near(v.p.m, 1, 0.01) && near(v.p.k, 4, 0.05) && near(v.p.c, 4, 0.05), t`$c=2\sqrt{1\cdot4}=4$.`),
            tf(t`Um sistema superamortecido cruza a posição de equilíbrio várias vezes.`, false, t`Sem raízes complexas não há oscilação: no máximo cruza uma vez.`),
            mcq(t`Um amortecedor de carro gasto ($c$ pequeno) faz o carro…`, ['quicar várias vezes após um buraco', 'ficar mais rígido', 'não se mover', 'voltar mais devagar sem oscilar'], 0, t`$c$ pequeno ⟹ subamortecido: oscila.`),
            gen((rng) => {
              const a = randInt(rng, 1, 3);
              const b = randInt(rng, 2, 5);
              return num(t`$x''+${2 * a}x'+${a * a + b * b}x=0$ é subamortecido. Qual a frequência angular da oscilação (a parte imaginária das raízes)?`, b, t`$r=-${a}\pm${b}i$: oscila com $\omega=${b}$ (menor que $\omega_0=\sqrt{${a * a + b * b}}$).`);
            }),
            num(t`Em $x=e^{-0{,}5t}\cos(3t)$, por que fator a amplitude se multiplica a cada $2$ s? (3 casas)`, Math.exp(-1), t`$e^{-0{,}5\cdot2}=e^{-1}\approx0{,}368$.`, { tol: 0.002 }),
            match(t`Ligue o regime à forma das raízes de $mr^2+cr+k=0$:`, [
              ['sem amortecimento', t`$\pm\omega_0 i$`],
              ['subamortecido', t`$\alpha\pm\beta i$, $\alpha<0$`],
              ['crítico', 'raiz real dupla negativa'],
              ['superamortecido', 'duas raízes reais negativas'],
            ], t`O sinal de $c^2-4mk$ decide.`),
          ],
        },
        {
          card: {
            title: 'Pêndulo e circuito RLC',
            body: t`A mesma EDO aparece em sistemas bem diferentes:

• **Pêndulo** (ângulos pequenos, $\operatorname{sen}\theta\approx\theta$): $\theta''+\frac gL\theta=0$, $T=2\pi\sqrt{L/g}$
• **Circuito RLC**: $L\,q''+R\,q'+\frac1C\,q=E(t)$`,
            visual: table(['Mecânico', 'Elétrico'], [['massa $m$', 'indutância $L$'], ['amortecimento $c$', 'resistência $R$'], ['mola $k$', '$1/C$'], ['posição $x$', 'carga $q$'], ['força $F(t)$', 'tensão $E(t)$']]),
            tip: t`Por isso engenheiros simulam suspensões com circuitos — e vice-versa.`,
          },
          exercises: [
            match(t`Ligue cada grandeza mecânica à elétrica análoga:`, [
              [t`massa $m$`, t`indutância $L$`],
              [t`amortecimento $c$`, t`resistência $R$`],
              [t`constante da mola $k$`, t`$1/C$`],
              [t`posição $x$`, t`carga $q$`],
            ], t`Compare $mx''+cx'+kx$ com $Lq''+Rq'+\frac qC$.`),
            num(t`Qual o período (s) de um pêndulo de $L=2{,}45$ m com $g=9{,}8$ m/s²? (2 casas)`, 2 * Math.PI * Math.sqrt(0.25), t`$T=2\pi\sqrt{0{,}25}=\pi\approx3{,}14$ s.`, { tol: 0.01 }),
            tf(t`O período de um pêndulo (oscilações pequenas) não depende da massa.`, true, t`$T=2\pi\sqrt{L/g}$: só comprimento e gravidade.`),
            gen((rng) => {
              const L = pick(rng, [1, 2, 4]);
              const Cc = pick(rng, [0.25, 0.5, 1]);
              return num(t`Num circuito LC ($R=0$) com $L=${L}$ H e $C=${fmt(Cc)}$ F, qual a frequência angular $\omega_0=\frac{1}{\sqrt{LC}}$? (2 casas)`, 1 / Math.sqrt(L * Cc), t`$\omega_0=\frac{1}{\sqrt{${fmt(L * Cc)}}}\approx${fmt(1 / Math.sqrt(L * Cc), 2)}$ rad/s.`, { tol: 0.01 });
            }),
            mcqS(t`Para que o RLC com $L=1$ H e $C=0{,}25$ F seja **criticamente** amortecido, $R$ deve ser:`, t`$4\ \Omega$`, [t`$2\ \Omega$`, t`$1\ \Omega$`, t`$0{,}5\ \Omega$`, t`$16\ \Omega$`], t`$R^2=4L/C=16\Rightarrow R=4$.`),
            num(t`Quadruplicando o comprimento de um pêndulo, o período fica multiplicado por quanto?`, 2, t`$T\propto\sqrt L$.`),
            mcq(t`Por que a aproximação $\operatorname{sen}\theta\approx\theta$ é necessária no pêndulo?`, ['para a EDO ficar linear e ter solução com senos e cossenos', 'porque o seno é sempre igual ao ângulo', 'para eliminar a gravidade', 'porque o pêndulo não oscila'], 0, t`$\theta''+\frac gL\operatorname{sen}\theta=0$ é não linear; para $\theta$ pequeno vira o oscilador harmônico.`),
            gen((rng) => {
              const R = pick(rng, [1, 2, 6, 10]);
              const L = 1;
              const Cc = pick(rng, [0.04, 0.25, 1]);
              const d = R * R - (4 * L) / Cc;
              const ans = Math.abs(d) < 1e-9 ? 'crítico' : d < 0 ? 'subamortecido (oscila)' : 'superamortecido';
              return rmcq(rng, t`RLC com $R=${R}\ \Omega$, $L=1$ H, $C=${fmt(Cc)}$ F é:`, ans, ['crítico', 'subamortecido (oscila)', 'superamortecido', 'instável'].filter((x) => x !== ans), t`$R^2-\frac{4L}{C}=${R * R}-${fmt(4 / Cc)}=${fmt(d)}$.`);
            }),
          ],
        },
      ],
    },
    {
      id: 'd-edo2-nh',
      title: 'Não homogêneas e ressonância',
      parts: [
        {
          card: {
            title: 'Homogênea + particular',
            body: t`Para $ay''+by'+cy=g(t)$, a solução geral é

$$y=y_h+y_p$$

$y_h$: solução da homogênea (com $C_1$, $C_2$). $y_p$: **uma** solução qualquer da completa.

**Coeficientes a determinar**: chute $y_p$ com a mesma "cara" de $g$:
• $g$ polinômio de grau $n$ ⟹ $y_p$ polinômio de grau $n$
• $g=e^{kt}$ ⟹ $y_p=Ae^{kt}$
• $g=\cos\omega t$ ou $\operatorname{sen}\omega t$ ⟹ $y_p=A\cos\omega t+B\operatorname{sen}\omega t$`,
            example: t`$y''-y=3e^{2t}$: chute $Ae^{2t}$: $4A-A=3\Rightarrow A=1$. Logo $y=C_1e^t+C_2e^{-t}+e^{2t}$.`,
          },
          exercises: [
            mcqS(t`Qual chute para $y_p$ em $y''+y'+y=t^2$?`, t`$At^2+Bt+C$`, [t`$At^2$`, t`$Ae^{t}$`, t`$A\cos t$`, t`$At^3$`], t`Polinômio de grau 2: inclua todos os graus menores.`),
            gen((rng) => {
              const k = randNZ(rng, -3, 3);
              const c = pick(rng, [1, 2, 4, 9].filter((x) => x !== k * k));
              const A = randNZ(rng, -3, 3);
              const g = A * (k * k - c);
              return num(t`Em $y''-${c}y=${g}e^{${k}t}$, chutando $y_p=Ae^{${k}t}$, quanto vale $A$?`, A, t`$(${k * k}-${c})A=${g}\Rightarrow A=${A}$.`);
            }),
            gen((rng) => {
              const c = randNZ(rng, -5, 5);
              const d = c * randInt(rng, 1, 4);
              return num(t`Uma solução constante $y_p=A$ de $y''+3y'${term(c, 'y')}=${d}$ tem $A=$?`, d / c, t`Com $y$ constante, $y'=y''=0$: $${c}A=${d}\Rightarrow A=${fmt(d / c)}$.`);
            }),
            tf(t`Toda solução de $y''+y=t$ pode ser escrita como $C_1\cos t+C_2\operatorname{sen}t+t$.`, true, t`$y_p=t$ funciona ($0+t=t$) e somamos a geral da homogênea.`),
            num(t`Em $y''+4y=8t$, chutando $y_p=At+B$, quanto vale $A$?`, 2, t`$4(At+B)=8t\Rightarrow A=2$, $B=0$.`),
            mcqS(t`Qual chute para $y_p$ em $y''+y=5\cos(2t)$?`, t`$A\cos2t+B\operatorname{sen}2t$`, [t`$A\cos2t$ apenas`, t`$At\cos2t$`, t`$Ae^{2t}$`, t`$A\cos t$`], t`Inclua seno e cosseno da mesma frequência (aqui $B$ acabará sendo 0, pois não há $y'$).`),
            num(t`Ainda em $y''+y=5\cos(2t)$, quanto vale $A$?`, -5 / 3, t`$(-4+1)A=5\Rightarrow A=-\frac53$.`),
            order(t`Ordene o método dos coeficientes a determinar:`, [t`resolver a homogênea e achar $y_h$`, t`escolher a forma de $y_p$ olhando para $g(t)$`, t`substituir $y_p$ na EDO e igualar coeficientes`, t`escrever $y=y_h+y_p$`, 'aplicar as condições iniciais'], t`As condições iniciais vêm por último, na solução **completa**.`),
          ],
        },
        {
          card: {
            title: 'O fator t e a variação de parâmetros',
            body: t`Se o chute já é solução da homogênea, ele dá zero: multiplique por $t$ (ou $t^2$).

$y''-y=e^t$: $e^t$ resolve a homogênea, então $y_p=Ate^t$ ⟹ $A=\frac12$.

**Variação de parâmetros** funciona para qualquer $g$: com $y_h=C_1y_1+C_2y_2$ e o **Wronskiano** $W=y_1y_2'-y_1'y_2$,

$$y_p=-y_1\int\frac{y_2\,g}{W}\,dt+y_2\int\frac{y_1\,g}{W}\,dt\quad(a=1)$$`,
            tip: t`$W\neq0$ garante que $y_1$ e $y_2$ são independentes.`,
          },
          exercises: [
            mcqS(t`Qual chute para $y_p$ em $y''-3y'+2y=e^{t}$?`, t`$Ate^{t}$`, [t`$Ae^{t}$`, t`$At^2e^t$`, t`$Ae^{2t}$`, t`$A\cos t$`], t`Raízes $1$ e $2$: $e^t$ já é solução da homogênea, multiplique por $t$.`),
            num(t`Em $y''-y=e^t$ com $y_p=Ate^t$, quanto vale $A$?`, 0.5, t`$y_p''-y_p=2Ae^t=e^t\Rightarrow A=\frac12$.`),
            mcqS(t`Qual chute para $y''+4y=\operatorname{sen}(2t)$?`, t`$t\,(A\cos2t+B\operatorname{sen}2t)$`, [t`$A\cos2t+B\operatorname{sen}2t$`, t`$A\operatorname{sen}2t$`, t`$At^2\operatorname{sen}2t$`, t`$Ae^{2t}$`], t`$\cos2t$ e $\operatorname{sen}2t$ resolvem a homogênea: multiplique por $t$.`),
            gen((rng) => {
              const b = randInt(rng, 1, 4);
              return num(t`Calcule o Wronskiano de $y_1=\cos ${b === 1 ? '' : b}t$ e $y_2=\operatorname{sen}${b === 1 ? '' : b}t$.`, b, t`$W=\cos\cdot${b}\cos-(-${b}\operatorname{sen})\operatorname{sen}=${b}(\cos^2+\operatorname{sen}^2)=${b}$.`);
            }),
            gen((rng) => {
              const r1 = randInt(rng, -3, 0);
              const r2 = r1 + randInt(rng, 1, 3);
              return num(t`Wronskiano de $y_1=e^{${r1}t}$ e $y_2=e^{${r2}t}$ em $t=0$:`, r2 - r1, t`$W=e^{${r1}t}\cdot${r2}e^{${r2}t}-${r1}e^{${r1}t}e^{${r2}t}=(${r2}-(${r1}))e^{${r1 + r2}t}$; em $t=0$: $${r2 - r1}$.`);
            }),
            tf(t`Variação de parâmetros serve para $y''+y=\operatorname{tg}t$, onde coeficientes a determinar falha.`, true, t`$\operatorname{tg}t$ não tem família finita de derivadas; o método geral resolve.`),
            mcq(t`Em $y''+2y'+y=e^{-t}$, qual chute funciona?`, ['$At^2e^{-t}$', '$Ae^{-t}$', '$Ate^{-t}$', '$Ae^{t}$'], 0, t`$r=-1$ é raiz **dupla**: $e^{-t}$ e $te^{-t}$ já são da homogênea, então use $t^2$.`),
            num(t`Ainda em $y''+2y'+y=e^{-t}$ com $y_p=At^2e^{-t}$, quanto vale $A$?`, 0.5, t`Substituindo, sobra $2Ae^{-t}=e^{-t}\Rightarrow A=\frac12$.`),
          ],
        },
        {
          card: {
            title: 'Ressonância',
            body: t`Forçando um oscilador com $F_0\cos\omega t$:

$$m\,x''+c\,x'+k\,x=F_0\cos\omega t$$

A resposta estacionária tem amplitude

$$A(\omega)=\frac{F_0}{\sqrt{(k-m\omega^2)^2+(c\,\omega)^2}}$$

Quando $\omega\approx\omega_0=\sqrt{k/m}$ e $c$ é pequeno, $A$ fica **enorme**: **ressonância** (pontes, taças de cristal, sintonia de rádio). Varra $\omega$ no lab:`,
            visual: springLab({ forced: true, c: 0.3, showT: false }),
          },
          exercises: [
            tf(t`Sem amortecimento, forçar exatamente em $\omega=\omega_0$ faz a amplitude crescer sem limite.`, true, t`A solução particular é do tipo $t\operatorname{sen}\omega_0t$: cresce linearmente.`),
            gen((rng) => {
              const m = pick(rng, [1, 2, 4]);
              const w = randInt(rng, 1, 5);
              return num(t`Uma estrutura com $m=${m}$ e $k=${m * w * w}$ entra em ressonância com qual frequência de forçamento $\omega$?`, w, t`$\omega_0=\sqrt{${m * w * w}/${m}}=${w}$.`);
            }),
            inter(t`Com $m=1$, $k=4$ e $c$ pequeno, encontre a ressonância ajustando $\omega$.`, 'plot', springLab({ forced: true, c: 0.3, showT: false }).props, (v: any) => v && near(v.p.m, 1, 0.01) && near(v.p.k, 4, 0.05) && near(v.p.w, 2, 0.1) && v.p.c <= 1, t`$\omega=\sqrt{4/1}=2$.`),
            gen((rng) => {
              const k = pick(rng, [4, 9, 16]);
              const w = pick(rng, [1, 2, 5].filter((x) => x * x !== k));
              return num(t`Sem amortecimento ($c=0$, $m=1$, $F_0=1$), qual a amplitude da resposta a $\cos(${w}t)$ com $k=${k}$? (3 casas)`, 1 / Math.abs(k - w * w), t`$A=\frac{1}{|${k}-${w * w}|}=${fmt(1 / Math.abs(k - w * w), 3)}$.`, { tol: 0.002 });
            }),
            mcq(t`Aumentar o amortecimento $c$ faz o pico de ressonância…`, ['ficar mais baixo e largo', 'ficar mais alto', 'mudar para frequências muito maiores', 'desaparecer só se $c=0$'], 0, t`O termo $(c\omega)^2$ no denominador limita $A$.`),
            mcqS(t`A ponte de Tacoma Narrows (1940) é citada como exemplo de:`, 'oscilações forçadas e auto-excitadas pelo vento', ['amortecimento crítico', 'decaimento radioativo', 'crescimento logístico', 'convergência de série'], t`Vento + estrutura flexível pouco amortecida: amplitudes catastróficas.`),
            num(t`Com $m=1$, $k=4$, $c=1$ e $F_0=1$, qual a amplitude em $\omega=2$?`, 0.5, t`$A=\frac{1}{\sqrt{0^2+(1\cdot2)^2}}=\frac12$.`),
            multi(t`Onde a ressonância é **desejada**?`, ['sintonizar uma estação de rádio', 'ressonância magnética (MRI)', 'uma ponte sob vento', 'o motor desbalanceado de uma máquina de lavar'], [0, 1], t`Em circuitos de sintonia e na MRI ela é útil; em estruturas e máquinas, perigosa.`),
          ],
        },
      ],
    },
  ],
};

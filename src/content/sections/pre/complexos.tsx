import React from 'react';
import type { UnitDef } from '../../types';
import { gen, mcqS, num, tf, match, order, multi, inter, plot, rmcq, near } from '../../helpers';
import { Arrow, ArcW, CircleW, FnCurve, PolygonW, Pt, Seg } from '../../../components/plot/Plot';
import { C } from '../../../theme';
import { fmt, par, pick, polyTex, randInt, randNZ, term, xm } from '../../../lib/random';

const t = String.raw;
const PI = Math.PI;
const rad = (d: number) => (d * PI) / 180;
const deg = (r: number) => (r * 180) / PI;
const argDeg = (x: number, y: number) => {
  const a = deg(Math.atan2(y, x));
  return a < 0 ? a + 360 : a;
};
/** a + bi in TeX with integer parts. */
const cx = (a: number, b: number) => {
  if (b === 0) return String(a);
  const bi = b === 1 ? 'i' : b === -1 ? '-i' : `${b}i`;
  if (a === 0) return bi;
  return `${a}${b < 0 ? '' : '+'}${bi}`;
};
/** Coefficients (highest degree first) of the monic polynomial with the given roots. */
const fromRoots = (roots: number[]) => roots.reduce<number[]>((c, r) => [...c, 0].map((v, i) => v - (i > 0 ? r * c[i - 1] : 0)), [1]);
const polyStr = (c: number[]) => polyTex([...c].reverse());

/* ---------------- labs ---------------- */

const argandLab = () =>
  plot({
    view: { xMin: -4, xMax: 4, yMin: -4, yMax: 4 },
    equalAspect: true,
    snap: 0.5,
    points: [{ id: 'z', x: 2, y: 2, color: C.gold, label: 'z' }],
    render: ({ pts }: any) => {
      const { x, y } = pts.z;
      const th = Math.atan2(y, x);
      return (
        <>
          <Arrow x1={0} y1={0} x2={x} y2={y} color={C.gold} />
          <ArcW cx={0} cy={0} r={0.6} a0={0} a1={th < 0 ? th + 2 * PI : th} color={C.p5} width={3} />
          <Seg x1={x} y1={y} x2={x} y2={-y} color={C.textDim} dash="4 4" width={1.5} />
          <Pt x={x} y={-y} color={C.p2} label="z̄" />
        </>
      );
    },
    info: ({ pts }: any) => {
      const { x, y } = pts.z;
      const r = Math.hypot(x, y);
      return t`$z=${fmt(x, 1)}${y < 0 ? '' : '+'}${fmt(y, 1)}i$ · $\rho=|z|=${fmt(r, 3)}$ · $\theta=${fmt(argDeg(x, y), 1)}^\circ$ · $\bar z$ é o reflexo no eixo real`;
    },
  });

const productLab = () =>
  plot({
    view: { xMin: -5, xMax: 5, yMin: -5, yMax: 5 },
    equalAspect: true,
    snap: 0.25,
    points: [
      { id: 'z', x: 1.5, y: 0.5, color: C.p2, label: 'z' },
      { id: 'w', x: 0.5, y: 1.5, color: C.p5, label: 'w' },
    ],
    render: ({ pts }: any) => {
      const { z, w } = pts;
      const px = z.x * w.x - z.y * w.y, py = z.x * w.y + z.y * w.x;
      return (
        <>
          <Arrow x1={0} y1={0} x2={z.x} y2={z.y} color={C.p2} />
          <Arrow x1={0} y1={0} x2={w.x} y2={w.y} color={C.p5} />
          <Arrow x1={0} y1={0} x2={px} y2={py} color={C.gold} label="zw" />
        </>
      );
    },
    info: ({ pts }: any) => {
      const { z, w } = pts;
      const px = z.x * w.x - z.y * w.y, py = z.x * w.y + z.y * w.x;
      return t`$|z|\cdot|w|=${fmt(Math.hypot(z.x, z.y), 2)}\cdot${fmt(Math.hypot(w.x, w.y), 2)}=${fmt(Math.hypot(px, py), 2)}=|zw|$ · $\arg z+\arg w=${fmt(argDeg(z.x, z.y), 0)}^\circ+${fmt(argDeg(w.x, w.y), 0)}^\circ\equiv${fmt(argDeg(px, py), 0)}^\circ$`;
    },
  });

const rootsLab = (n0 = 5) =>
  plot({
    view: { xMin: -2.4, xMax: 2.4, yMin: -2.4, yMax: 2.4 },
    equalAspect: true,
    params: [
      { key: 'n', label: 'n', min: 2, max: 10, step: 1, value: n0, color: C.gold, format: (v: number) => String(v) },
      { key: 'r', label: '\\rho', min: 1, max: 32, step: 1, value: 1, color: C.p2, format: (v: number) => String(v) },
      { key: 'f', label: '\\varphi', min: 0, max: 360, step: 15, value: 0, color: C.p5, format: (v: number) => v + '°' },
    ],
    render: ({ p }: any) => {
      const n = Math.round(p.n);
      const R = p.r ** (1 / n);
      const pts: [number, number][] = Array.from({ length: n }, (_, k) => {
        const a = (rad(p.f) + 2 * PI * k) / n;
        return [R * Math.cos(a), R * Math.sin(a)];
      });
      return (
        <>
          <CircleW cx={0} cy={0} r={R} color={C.textDim} width={1.5} dash="5 4" />
          <PolygonW pts={pts} color={C.gold} opacity={0.15} stroke={C.gold} />
          {pts.map(([x, y], k) => <Pt key={k} x={x} y={y} color={k === 0 ? C.p5 : C.gold} r={5} />)}
        </>
      );
    },
    info: ({ p }: any) => {
      const n = Math.round(p.n);
      return t`$z^{${n}}=${p.r}(\cos${p.f}^\circ+i\operatorname{sen}${p.f}^\circ)$: $${n}$ raízes no círculo de raio $\sqrt[${n}]{${p.r}}=${fmt(p.r ** (1 / n), 3)}$, separadas por $${fmt(360 / n, 1)}^\circ$; a primeira (rosa) tem argumento $${fmt(p.f / n, 1)}^\circ$`;
    },
  });

/** p(x) = 0,25 (x − r)^m (x − s)(x − u): roots crossing vs touching. */
const multLab = () =>
  plot({
    view: { xMin: -4, xMax: 4, yMin: -4, yMax: 4 },
    params: [
      { key: 'r', label: 'r', min: -3, max: 3, step: 0.5, value: -1, color: C.p5 },
      { key: 'm', label: 'mult. de r', min: 1, max: 3, step: 1, value: 2, color: C.gold, format: (v: number) => String(v) },
      { key: 's', label: 's', min: -3, max: 3, step: 0.5, value: 2, color: C.p2 },
    ],
    render: ({ p }: any) => {
      const f = (x: number) => 0.25 * (x - p.r) ** Math.round(p.m) * (x - p.s);
      return (
        <>
          <FnCurve f={f} color={C.p2} />
          <Pt x={p.r} y={0} color={C.p5} />
          <Pt x={p.s} y={0} color={C.p2} />
        </>
      );
    },
    info: ({ p }: any) => {
      const m = Math.round(p.m);
      return t`$p(x)=\frac14(${xm(p.r)})^{${m}}(${xm(p.s)})$ · grau $${m + 1}$ · em $r$ o gráfico ${m % 2 ? 'cruza' : 'tangencia'} o eixo (multiplicidade ${m % 2 ? 'ímpar' : 'par'})`;
    },
  });

/* ---------------- units ---------------- */

export const complexos: UnitDef = {
  id: 'p-cpx',
  title: 'Números complexos a fundo',
  subtitle: 'Plano de Argand-Gauss, forma trigonométrica, De Moivre e raízes',
  icon: '🌀',
  guide: t`Todo $z=a+bi$ é um ponto/vetor do plano: módulo $\rho=\sqrt{a^2+b^2}$ e argumento $\theta$. Na forma trigonométrica $z=\rho(\cos\theta+i\operatorname{sen}\theta)=\rho e^{i\theta}$, **multiplicar** é multiplicar módulos e **somar argumentos** (girar e esticar). De Moivre: $z^n=\rho^n(\cos n\theta+i\operatorname{sen}n\theta)$. As $n$ raízes $n$-ésimas formam um **polígono regular** no círculo de raio $\sqrt[n]{\rho}$.`,
  lessons: [
    {
      id: 'p-cpx-polar',
      title: 'Plano de Argand-Gauss e forma trigonométrica',
      parts: [
        {
          card: {
            title: 'O complexo como ponto e como vetor',
            body: t`$z=a+bi$ corresponde ao ponto $(a,\,b)$ (o **afixo**). Daí:
• **módulo** $|z|=\rho=\sqrt{a^2+b^2}$ (distância à origem);
• **argumento** $\theta$: ângulo com o eixo real positivo, com $\cos\theta=\frac a\rho$ e $\operatorname{sen}\theta=\frac b\rho$ — **olhe o quadrante!**
• **conjugado** $\bar z=a-bi$: reflexo no eixo real; $z\bar z=|z|^2$.`,
            visual: argandLab(),
            tip: 'Não use só arctg(b/a): 1 + i e −1 − i têm o mesmo b/a, mas argumentos 45° e 225°.',
          },
          exercises: [
            gen((rng) => {
              const [a, b] = pick(rng, [[3, 4], [5, 12], [6, 8], [-3, 4], [8, -15], [-5, -12]]);
              return num(t`Módulo de $z=${cx(a, b)}$:`, Math.hypot(a, b), t`$\sqrt{${a * a}+${b * b}}=${Math.hypot(a, b)}$.`);
            }),
            gen((rng) => {
              const [a, b, ang] = pick(rng, [[1, 1, 45], [-1, 1, 135], [-1, -1, 225], [1, -1, 315], [0, 2, 90], [-3, 0, 180], [0, -1, 270]]);
              return num(t`Argumento principal (em graus, entre $0^\circ$ e $360^\circ$) de $z=${cx(a, b)}$:`, ang, `O afixo (${a}, ${b}) está ${ang < 90 ? 'no 1º quadrante' : ang < 180 ? 'no 2º quadrante' : ang < 270 ? 'no 3º quadrante' : 'no 4º quadrante'} (ou sobre um eixo): θ = ${ang}°.`, { unit: '°' });
            }),
            inter(t`Arraste $z$ até $|z|=5$ com argumento no 2º quadrante.`, 'plot', argandLab().props, (v) => near(Math.hypot(v.pts.z.x, v.pts.z.y), 5, 0.01) && v.pts.z.x < 0 && v.pts.z.y > 0, 'z = −3 + 4i', 'O ponto (−3, 4) está a distância 5 da origem, no 2º quadrante.'),
            gen((rng) => {
              const a = randInt(rng, -6, 6), b = randNZ(rng, -6, 6);
              return num(t`Calcule $z\cdot\bar z$ para $z=${cx(a, b)}$.`, a * a + b * b, t`$z\bar z=|z|^2=${a * a}+${b * b}=${a * a + b * b}$.`);
            }),
            gen((rng) => {
              const r = randInt(rng, 2, 6);
              const ang = pick(rng, [30, 60, 120, 150, 210, 240, 300, 330]);
              return num(t`Parte real de $z=${r}(\cos${ang}^\circ+i\operatorname{sen}${ang}^\circ)$ (3 casas):`, r * Math.cos(rad(ang)), t`$${r}\cos${ang}^\circ=${fmt(r * Math.cos(rad(ang)), 3)}$.`, { tol: 0.002 });
            }),
            mcqS(t`A forma trigonométrica de $z=1+i\sqrt3$ é:`, t`$2(\cos60^\circ+i\operatorname{sen}60^\circ)$`, [t`$2(\cos30^\circ+i\operatorname{sen}30^\circ)$`, t`$4(\cos60^\circ+i\operatorname{sen}60^\circ)$`, t`$\sqrt3(\cos45^\circ+i\operatorname{sen}45^\circ)$`], t`$\rho=\sqrt{1+3}=2$, $\cos\theta=\frac12$, $\operatorname{sen}\theta=\frac{\sqrt3}2$.`),
            tf(t`$\overline{z\cdot w}=\bar z\cdot\bar w$.`, true, 'Conjugar é refletir no eixo real; o produto de reflexos é o reflexo do produto (argumentos trocam de sinal juntos).'),
            match('Associe à forma exponencial.', [[t`$i$`, t`$e^{i\pi/2}$`], [t`$-1$`, t`$e^{i\pi}$`], [t`$1$`, t`$e^{0}$`], [t`$-i$`, t`$e^{3i\pi/2}$`]], t`Euler: $e^{i\theta}=\cos\theta+i\operatorname{sen}\theta$ (e $e^{i\pi}+1=0$).`),
          ],
        },
        {
          card: {
            title: 'Fórmula de Euler',
            body: t`$$e^{i\theta}=\cos\theta+i\operatorname{sen}\theta$$
Então $z=\rho(\cos\theta+i\operatorname{sen}\theta)=\rho e^{i\theta}$. É só notação compacta — mas deixa claras as regras de potência: $e^{i\alpha}e^{i\beta}=e^{i(\alpha+\beta)}$.

Em engenharia elétrica, tensões e correntes senoidais viram **fasores** $Ve^{i\varphi}$ (e o $i$ costuma ser escrito $j$).`,
          },
          exercises: [
            gen((rng) => {
              const r = randInt(rng, 2, 5);
              const ang = pick(rng, [45, 135, 225, 315]);
              return num(t`Parte imaginária de $${r}e^{i\cdot${ang}^\circ}$ (3 casas):`, r * Math.sin(rad(ang)), t`$${r}\operatorname{sen}${ang}^\circ\approx${fmt(r * Math.sin(rad(ang)), 3)}$.`, { tol: 0.002 });
            }),
            tf(t`$e^{i\pi}+1=0$.`, true, t`$e^{i\pi}=\cos\pi+i\operatorname{sen}\pi=-1$.`),
            gen((rng) => {
              const a = pick(rng, [30, 45, 60, 90]), b = pick(rng, [30, 45, 60, 120]);
              return num(t`Argumento (graus) de $e^{i\cdot${a}^\circ}\cdot e^{i\cdot${b}^\circ}$:`, a + b, 'Na forma exponencial os argumentos somam.', { unit: '°' });
            }),
            mcqS(t`$|e^{i\theta}|$ vale:`, '1 para todo θ', ['θ', 'e', 'depende de θ'], t`$\sqrt{\cos^2\theta+\operatorname{sen}^2\theta}=1$: $e^{i\theta}$ percorre o círculo unitário.`),
            gen((rng) => {
              const r = randInt(rng, 2, 9);
              return num(t`Módulo de $${r}e^{i\cdot 1{,}2}\cdot e^{-i\cdot 0{,}7}$:`, r, 'Fatores eⁱᶿ têm módulo 1: só sobra o módulo r.');
            }),
            order(t`Ordene, do menor para o maior argumento em $[0^\circ,\,360^\circ)$: $1$, $i$, $-1$, $-i$, $1-i$.`, [t`$1$`, t`$i$`, t`$-1$`, t`$-i$`, t`$1-i$`], t`$0^\circ$, $90^\circ$, $180^\circ$, $270^\circ$, $315^\circ$.`),
            multi(t`Quais números têm módulo 2?`, [t`$2i$`, t`$1+i$`, t`$\sqrt3+i$`, t`$2e^{i\pi/7}$`, t`$-2$`], [0, 2, 3, 4], t`$|1+i|=\sqrt2$.`),
            gen((rng) => {
              const r = randInt(rng, 2, 4);
              const ang = pick(rng, [60, 90, 120]);
              return rmcq(rng, t`O conjugado de $${r}e^{i\cdot${ang}^\circ}$ é:`, t`$${r}e^{-i\cdot${ang}^\circ}$`, [t`$-${r}e^{i\cdot${ang}^\circ}$`, t`$\frac1{${r}}e^{i\cdot${ang}^\circ}$`, t`$${r}e^{i\cdot${180 - ang}^\circ}$`], 'Conjugar troca o sinal do argumento.');
            }),
          ],
        },
      ],
    },
    {
      id: 'p-cpx-moivre',
      title: 'Multiplicação, divisão e potências (De Moivre)',
      parts: [
        {
          card: {
            title: 'Multiplicar é girar e esticar',
            body: t`Com $z_1=\rho_1e^{i\theta_1}$ e $z_2=\rho_2e^{i\theta_2}$:
$$z_1z_2=\rho_1\rho_2\,e^{i(\theta_1+\theta_2)}\qquad\frac{z_1}{z_2}=\frac{\rho_1}{\rho_2}\,e^{i(\theta_1-\theta_2)}$$
Multiplicar por $i$ gira $90^\circ$; por $e^{i\alpha}$, gira $\alpha$ sem esticar.`,
            visual: productLab(),
          },
          exercises: [
            gen((rng) => {
              const r1 = randInt(rng, 2, 5), r2 = randInt(rng, 2, 5), a1 = pick(rng, [20, 30, 45, 60]), a2 = pick(rng, [40, 60, 90, 120]);
              return num(t`$z=${r1}(\cos${a1}^\circ+i\operatorname{sen}${a1}^\circ)$ e $w=${r2}(\cos${a2}^\circ+i\operatorname{sen}${a2}^\circ)$. Módulo de $zw$:`, r1 * r2, 'Módulos multiplicam.');
            }),
            gen((rng) => {
              const a1 = pick(rng, [150, 200, 240, 300]), a2 = pick(rng, [30, 60, 90]);
              return num(t`Argumento (graus, em $[0,\,360)$) de $\frac{z}{w}$ com $\arg z=${a1}^\circ$ e $\arg w=${a2}^\circ$:`, a1 - a2, 'Na divisão, os argumentos subtraem.', { unit: '°' });
            }),
            inter('Arraste z e w para que zw caia exatamente sobre o eixo real negativo, com |zw| = 4.', 'plot', productLab().props, (v) => {
              const { z, w } = v.pts;
              const px = z.x * w.x - z.y * w.y, py = z.x * w.y + z.y * w.x;
              return near(px, -4, 0.05) && near(py, 0, 0.05);
            }, 'ex.: z = 2i e w = 2i', 'Argumentos somando 180° e módulos com produto 4.'),
            tf(t`Multiplicar um complexo por $i$ gira o seu vetor $90^\circ$ no sentido anti-horário.`, true, t`$i=e^{i\pi/2}$: soma $90^\circ$ ao argumento e mantém o módulo.`),
            gen((rng) => {
              const a = randInt(rng, -5, 5), b = randNZ(rng, -5, 5);
              return rmcq(rng, t`Quanto é $i\cdot(${cx(a, b)})$?`, t`$${cx(-b, a)}$`, [t`$${cx(b, -a)}$`, t`$${cx(-a, -b)}$`, t`$${cx(a, -b)}$`, t`$${cx(b, a)}$`], t`$i(a+bi)=ai+bi^2=-b+ai$: rotação de $90^\circ$.`);
            }),
            gen((rng) => {
              const a = randInt(rng, 1, 4), b = randInt(rng, 1, 4), c = randInt(rng, 1, 4), d = randNZ(rng, -4, 4);
              const den = c * c + d * d;
              const re = (a * c + b * d) / den;
              return num(t`Parte real de $\frac{${cx(a, b)}}{${cx(c, d)}}$ (3 casas; multiplique pelo conjugado):`, re, t`$\frac{(${cx(a, b)})(${cx(c, -d)})}{${den}}$: parte real $\frac{${a * c + b * d}}{${den}}\approx${fmt(re, 3)}$.`, { tol: 0.002 });
            }),
            mcqS('Uma impedância Z = 3 + 4j Ω recebe corrente I = 2∠0° A. A tensão V = Z·I tem módulo:', '10 V', ['14 V', '7 V', '5 V'], '|Z| = 5 Ω; |V| = |Z|·|I| = 10 V (e a fase é a de Z, ≈ 53°).'),
            match('Associe a operação ao efeito geométrico.', [['multiplicar por 2', 'esticar ×2'], [t`multiplicar por $e^{i\pi/3}$`, 'girar 60°'], ['conjugar', 'refletir no eixo real'], [t`multiplicar por $-1$`, 'girar 180°']], 'Toda multiplicação por complexo é rotação + homotetia.'),
          ],
        },
        {
          card: {
            title: 'Potências: fórmula de De Moivre',
            body: t`$$z^n=\rho^n\big(\cos n\theta+i\operatorname{sen}n\theta\big)$$
Elevar à potência $n$ = elevar o módulo a $n$ e **multiplicar o argumento por $n$**.

Exemplo: $(1+i)^8$: $\rho=\sqrt2$, $\theta=45^\circ$ ⇒ $(\sqrt2)^8(\cos360^\circ+i\operatorname{sen}360^\circ)=16$.

Bônus: expandindo $(\cos\theta+i\operatorname{sen}\theta)^2$ e comparando com $\cos2\theta+i\operatorname{sen}2\theta$ saem as fórmulas do arco duplo.`,
          },
          exercises: [
            gen((rng) => {
              const n = 2 * randInt(rng, 2, 6);
              const v = (n / 2) % 4;
              const re = [1, 0, -1, 0][v] * 2 ** (n / 2);
              return num(t`Parte real de $(1+i)^{${n}}$:`, re, t`$(\sqrt2)^{${n}}=${2 ** (n / 2)}$, argumento $${45 * n}^\circ$: $\cos${45 * n}^\circ=${[1, 0, -1, 0][v]}$.`);
            }),
            gen((rng) => {
              const n = randInt(rng, 5, 60);
              const r = n % 4;
              return rmcq(rng, t`Quanto vale $i^{${n}}$?`, ['1', 'i', '−1', '−i'][r], ['1', 'i', '−1', '−i'].filter((_, k) => k !== r), t`As potências de $i$ repetem de 4 em 4: $${n}=4\cdot${Math.floor(n / 4)}+${r}$.`);
            }),
            gen((rng) => {
              const n = randInt(rng, 3, 9);
              return num(t`Módulo de $(\sqrt3+i)^{${n}}$:`, 2 ** n, t`$|\sqrt3+i|=2$; $2^{${n}}=${2 ** n}$.`);
            }),
            gen((rng) => {
              const n = randInt(rng, 2, 12);
              return num(t`Argumento (graus, em $[0,\,360)$) de $\left(\cos20^\circ+i\operatorname{sen}20^\circ\right)^{${n}}$:`, (20 * n) % 360, `20°·${n} = ${20 * n}° ≡ ${(20 * n) % 360}°.`, { unit: '°' });
            }),
            mcqS(t`Para qual menor $n>0$ o número $(1+i\sqrt3)^n$ é real positivo?`, '6', ['3', '2', '12'], t`Argumento $60^\circ$: $60n$ múltiplo de $360$ ⇒ $n=6$ (e então vale $2^6=64$).`),
            tf(t`$(\cos\theta+i\operatorname{sen}\theta)^{-1}=\cos\theta-i\operatorname{sen}\theta$.`, true, t`De Moivre com $n=-1$: argumento $-\theta$.`),
            order(t`Ordene o cálculo de $(-1+i)^{10}$.`, [t`Módulo $\sqrt2$, argumento $135^\circ$`, t`De Moivre: módulo $(\sqrt2)^{10}=32$`, t`Argumento $1350^\circ\equiv270^\circ$`, t`Resultado: $32(\cos270^\circ+i\operatorname{sen}270^\circ)=-32i$`], 'Forma trigonométrica → De Moivre → reduza o ângulo.'),
            gen((rng) => {
              const k = randInt(rng, 3, 8);
              return num(t`Use $(\cos\theta+i\operatorname{sen}\theta)^2$: se $\cos\theta=0{,}${k}$, quanto vale $\cos2\theta$ (3 casas)?`, 2 * (k / 10) ** 2 - 1, t`Parte real: $\cos^2\theta-\operatorname{sen}^2\theta=2\cos^2\theta-1=${fmt(2 * (k / 10) ** 2 - 1, 3)}$.`, { tol: 0.002 });
            }),
          ],
        },
      ],
    },
    {
      id: 'p-cpx-raizes',
      title: 'Raízes n-ésimas',
      parts: [
        {
          card: {
            title: 'As raízes formam um polígono regular',
            body: t`As soluções de $z^n=w$, com $w=\rho e^{i\varphi}$, são
$$z_k=\sqrt[n]{\rho}\;e^{i\frac{\varphi+2k\pi}{n}},\qquad k=0,1,\dots,n-1$$
Todas têm o mesmo módulo $\sqrt[n]\rho$ e estão separadas por $\frac{360^\circ}{n}$: são os vértices de um **polígono regular**.

As **raízes da unidade** ($w=1$) somam zero — o polígono é equilibrado em torno da origem.`,
            visual: rootsLab(),
          },
          exercises: [
            gen((rng) => {
              const n = randInt(rng, 2, 12);
              return num(t`Quantas raízes complexas distintas tem $z^{${n}}=1$?`, n, `Uma equação zⁿ = w (w ≠ 0) tem exatamente n raízes.`);
            }),
            gen((rng) => {
              const n = pick(rng, [3, 4, 5, 6, 8, 9, 10, 12]);
              return num(`Ângulo (graus) entre duas raízes consecutivas de z^${n} = w:`, 360 / n, `360°/${n}.`, { unit: '°' });
            }),
            inter('Mostre as raízes de z³ = 8 (ajuste n, ρ e φ).', 'plot', rootsLab(3).props, (v) => Math.round(v.p.n) === 3 && v.p.r === 8 && (v.p.f === 0 || v.p.f === 360), 'n = 3, ρ = 8, φ = 0°', 'Raízes 2, 2e^{i120°} e 2e^{i240°}: triângulo equilátero de raio 2.'),
            gen((rng) => {
              const n = pick(rng, [2, 3, 4, 5]);
              const r = pick(rng, [2, 3]);
              return num(t`Módulo das raízes de $z^{${n}}=${r ** n}i$:`, r, t`$\sqrt[${n}]{${r ** n}}=${r}$.`);
            }),
            mcqS(t`As raízes quadradas de $-4$ são:`, t`$2i$ e $-2i$`, [t`$2$ e $-2$`, t`$4i$ e $-4i$`, 'não existem'], t`$-4=4e^{i\pi}$: módulo $2$, argumentos $90^\circ$ e $270^\circ$.`),
            gen((rng) => {
              const n = randInt(rng, 3, 9);
              return num(`Soma de todas as raízes ${n}-ésimas da unidade:`, 0, 'Vértices de um polígono regular centrado na origem: a soma dos vetores é zero (ou por Girard: o coeficiente de zⁿ⁻¹ é 0).');
            }),
            gen((rng) => {
              const n = pick(rng, [3, 4, 6]);
              const f = pick(rng, [90, 180]);
              return num(t`Argumento (graus) da raiz de menor argumento positivo de $z^{${n}}=e^{i\cdot${f}^\circ}$:`, f / n, t`$\frac{${f}^\circ}{${n}}$; as outras somam $\frac{360^\circ}{${n}}$ sucessivamente.`, { unit: '°' });
            }),
            tf(t`As raízes cúbicas de 1 são $1$, $-\frac12+\frac{\sqrt3}2i$ e $-\frac12-\frac{\sqrt3}2i$.`, true, t`Argumentos $0^\circ$, $120^\circ$, $240^\circ$ no círculo unitário.`),
          ],
        },
        {
          card: {
            title: 'Equações em ℂ',
            body: t`Com complexos, toda equação do 2º grau tem solução: se $\Delta<0$, $\sqrt\Delta=i\sqrt{|\Delta|}$.

Para $z^2=w$ com $w$ complexo, use a forma polar, ou escreva $z=x+yi$ e resolva $x^2-y^2=\operatorname{Re}w$, $2xy=\operatorname{Im}w$.`,
            example: t`$z^2-4z+13=0$: $\Delta=-36$, $z=\frac{4\pm6i}{2}=2\pm3i$ (conjugados!).`,
          },
          exercises: [
            gen((rng) => {
              const a = randInt(rng, -4, 4), b = randInt(rng, 1, 5);
              return num(t`As raízes de $z^2${a === 0 ? '' : a > 0 ? `-${2 * a}z` : `+${-2 * a}z`}+${a * a + b * b}=0$ são $p\pm qi$ com $q>0$. Quanto vale $q$?`, b, t`$\Delta=${4 * a * a}-${4 * (a * a + b * b)}=-${4 * b * b}$; $z=${a}\pm${b}i$.`);
            }),
            gen((rng) => {
              const a = randInt(rng, -4, 4), b = randInt(rng, 1, 5);
              return num(t`Mesma ideia: parte real das raízes de $z^2${a === 0 ? '' : a > 0 ? `-${2 * a}z` : `+${-2 * a}z`}+${a * a + b * b}=0$.`, a, t`$z=\frac{${2 * a}\pm\sqrt{-${4 * b * b}}}{2}=${a}\pm${b}i$.`);
            }),
            gen((rng) => {
              const x = randInt(rng, 1, 4), y = randNZ(rng, -4, 4);
              return rmcq(rng, t`Uma raiz quadrada de $${cx(x * x - y * y, 2 * x * y)}$ é:`, t`$${cx(x, y)}$`, [t`$${cx(y, x)}$`, t`$${cx(x, -y)}$`, t`$${cx(x * x, y * y)}$`, t`$${cx(x + 1, y)}$`], t`$(${cx(x, y)})^2=${x * x}-${y * y}${2 * x * y < 0 ? '-' : '+'}${Math.abs(2 * x * y)}i=${cx(x * x - y * y, 2 * x * y)}$.`);
            }),
            tf('Uma equação do 2º grau com coeficientes reais e Δ < 0 tem raízes complexas conjugadas.', true, 'b² − 4ac < 0 ⇒ z = (−b ± i√|Δ|)/2a.'),
            mcqS(t`Resolva $z^4=16$ em $\mathbb C$.`, t`$2,\ 2i,\ -2,\ -2i$`, [t`$2$ e $-2$`, t`$4$ e $-4$`, t`$2,\ -2,\ 4i,\ -4i$`], t`Módulo $2$, argumentos $0^\circ, 90^\circ, 180^\circ, 270^\circ$.`),
            gen((rng) => {
              const n = pick(rng, [4, 6, 8]);
              return num(`Quantas raízes de z^${n} = 1 são números reais?`, 2, 'Só 1 e −1 (argumentos 0° e 180°, que aparecem quando n é par).');
            }),
            order(t`Ordene a resolução de $z^3=-8$.`, [t`$-8=8e^{i\pi}$`, t`Módulo das raízes: $\sqrt[3]8=2$`, t`Argumentos: $\frac{\pi+2k\pi}{3}$ = $60^\circ$, $180^\circ$, $300^\circ$`, t`Raízes: $1+i\sqrt3$, $-2$, $1-i\sqrt3$`], 'Polar, módulo, argumentos, volta para a forma algébrica.'),
            multi(t`Quais são raízes de $z^6=1$?`, [t`$1$`, t`$-1$`, t`$\frac12+\frac{\sqrt3}2i$`, t`$i$`, t`$-\frac12-\frac{\sqrt3}2i$`], [0, 1, 2, 4], t`Argumentos múltiplos de $60^\circ$; $i$ tem $90^\circ$.`),
          ],
        },
      ],
    },
  ],
};

export const polinomiais: UnitDef = {
  id: 'p-pol',
  title: 'Equações polinomiais',
  subtitle: 'Teorema fundamental, multiplicidade, Girard e pesquisa de raízes',
  icon: '🧮',
  guide: t`Todo polinômio de grau $n\ge1$ tem exatamente $n$ raízes complexas (contando multiplicidade) e se fatora como $a_n(x-r_1)\cdots(x-r_n)$. Com coeficientes reais, raízes não reais vêm em **pares conjugados**. **Girard** liga coeficientes e raízes (soma $=-\frac{a_{n-1}}{a_n}$, produto $=(-1)^n\frac{a_0}{a_n}$). Para achar raízes: teste os candidatos racionais $\frac pq$ ($p\mid a_0$, $q\mid a_n$), abaixe o grau com Briot-Ruffini e use a troca de sinal (Bolzano) para localizar raízes reais.`,
  lessons: [
    {
      id: 'p-pol-tfa',
      title: 'Teorema fundamental e decomposição',
      parts: [
        {
          card: {
            title: 'n raízes, contando multiplicidade',
            body: t`**Teorema Fundamental da Álgebra**: todo polinômio de grau $n\ge1$ tem pelo menos uma raiz complexa. Aplicando repetidamente: tem **exatamente $n$** raízes (com repetição) e
$$P(x)=a_n(x-r_1)(x-r_2)\cdots(x-r_n)$$
Se $(x-r)^m$ aparece na fatoração, $r$ tem **multiplicidade** $m$. No gráfico: multiplicidade **ímpar** ⇒ cruza o eixo; **par** ⇒ tangencia.`,
            visual: multLab(),
          },
          exercises: [
            gen((rng) => {
              const n = randInt(rng, 3, 9);
              return num(`Quantas raízes complexas (contando multiplicidade) tem um polinômio de grau ${n}?`, n, 'Teorema Fundamental da Álgebra.');
            }),
            gen((rng) => {
              const a = randNZ(rng, -4, 4), m = randInt(rng, 2, 4), k = randInt(rng, 1, 3);
              let b = randNZ(rng, -4, 4);
              if (b === a) b = -a; // two different roots, otherwise "(x+3)^4(x+3)^1"
              return num(t`Grau de $P(x)=(${xm(a)})^{${m}}(${xm(b)})${k === 1 ? '' : `^{${k}}`}$:`, m + k, `Somam-se as multiplicidades: ${m} + ${k} = ${m + k}.`);
            }),
            inter('Ajuste a multiplicidade de r para que o gráfico apenas TOQUE o eixo em r.', 'plot', multLab().props, (v) => Math.round(v.p.m) === 2 && Math.abs(v.p.r - v.p.s) > 0.1, 'multiplicidade 2 (e r ≠ s)', 'Multiplicidade par: o sinal não muda, o gráfico tangencia.'),
            mcqS(t`Um polinômio de coeficientes reais tem raízes $2$ e $1+3i$. O menor grau possível é:`, '3', ['2', '4', '1'], t`$1-3i$ também é raiz (conjugada): no mínimo 3 raízes.`),
            tf('Todo polinômio de grau ímpar com coeficientes reais tem pelo menos uma raiz real.', true, 'As não reais vêm em pares; com n ímpar, sobra pelo menos uma real (e o gráfico vai de −∞ a +∞).'),
            gen((rng) => {
              const r = [randNZ(rng, -4, 4), randNZ(rng, -4, 4), randNZ(rng, -4, 4)];
              const c = fromRoots(r);
              return rmcq(rng, t`Qual a forma fatorada de $${polyStr(c)}$, sabendo que suas raízes são inteiras e pequenas?`, t`$(x${r[0] < 0 ? '+' : '-'}${Math.abs(r[0])})(x${r[1] < 0 ? '+' : '-'}${Math.abs(r[1])})(x${r[2] < 0 ? '+' : '-'}${Math.abs(r[2])})$`, [t`$(x${r[0] < 0 ? '-' : '+'}${Math.abs(r[0])})(x${r[1] < 0 ? '-' : '+'}${Math.abs(r[1])})(x${r[2] < 0 ? '-' : '+'}${Math.abs(r[2])})$`, t`$(x${r[0] < 0 ? '+' : '-'}${Math.abs(r[0]) + 1})(x${r[1] < 0 ? '+' : '-'}${Math.abs(r[1])})(x${r[2] < 0 ? '+' : '-'}${Math.abs(r[2])})$`, t`$x(x${r[1] < 0 ? '+' : '-'}${Math.abs(r[1])})(x${r[2] < 0 ? '+' : '-'}${Math.abs(r[2])})$`], `Raízes ${r.join(', ')}: P(x) = (x − r₁)(x − r₂)(x − r₃).`);
            }),
            gen((rng) => {
              const a = randInt(rng, 1, 4), b = randInt(rng, 1, 4);
              return num(t`Um polinômio real de grau 4 tem raízes $${cx(a, b)}$ e $${cx(-a, b)}$. Quantas raízes reais ele tem?`, 0, t`Os conjugados $${cx(a, -b)}$ e $${cx(-a, -b)}$ também são raízes: já são 4, todas não reais.`);
            }),
            match('Associe a multiplicidade ao comportamento do gráfico na raiz.', [['1', 'cruza "reto"'], ['2', 'toca e volta'], ['3', 'cruza achatando (inflexão)']], 'Par: tangencia; ímpar > 1: cruza com tangente horizontal.'),
          ],
        },
        {
          card: {
            title: 'Montando polinômios a partir das raízes',
            body: t`Conhecidas as raízes, o polinômio é $a(x-r_1)\cdots(x-r_n)$; o fator $a$ sai de uma condição extra (por exemplo, o valor de $P(0)$).

Com coeficientes **reais**, se $a+bi$ é raiz, $a-bi$ também é, e o par gera um fator **real** de grau 2:
$$(x-(a+bi))(x-(a-bi))=x^2-2ax+(a^2+b^2)$$`,
            example: t`Raízes $3$ e $1\pm2i$: $P(x)=(x-3)(x^2-2x+5)=x^3-5x^2+11x-15$.`,
          },
          exercises: [
            gen((rng) => {
              const a = randNZ(rng, -4, 4), b = randInt(rng, 1, 4);
              return num(t`O fator real de grau 2 que tem raízes $${cx(a, b)}$ e $${cx(a, -b)}$ é $x^2+px+q$. Quanto vale $q$?`, a * a + b * b, t`$q=a^2+b^2=${a * a}+${b * b}=${a * a + b * b}$ (e $p=-2a=${-2 * a}$).`);
            }),
            gen((rng) => {
              const a = randNZ(rng, -4, 4), b = randInt(rng, 1, 4);
              return num(t`Mesmo par $${cx(a, b)}$ e $${cx(a, -b)}$: quanto vale $p$ em $x^2+px+q$?`, -2 * a, t`$p=-(\text{soma})=-2\cdot ${par(a)}=${-2 * a}$.`);
            }),
            gen((rng) => {
              const r = randNZ(rng, -4, 4), a = randInt(rng, -3, 3), b = randInt(rng, 1, 3);
              return num(t`Polinômio mônico de grau 3 com raízes $${r}$ e $${cx(a, b)}$ (coeficientes reais). Quanto vale o termo independente?`, -r * (a * a + b * b), t`$P(x)=(${xm(r)})(x^2${term(-2 * a, 'x')}+${a * a + b * b})$; termo independente $=${par(-r)}\cdot ${a * a + b * b}=${-r * (a * a + b * b)}$.`);
            }),
            gen((rng) => {
              const r1 = randNZ(rng, -4, 4), r2 = randNZ(rng, -4, 4), k = randNZ(rng, -3, 3);
              return num(t`$P$ tem grau 2, raízes $${r1}$ e $${r2}$ e $P(0)=${k * r1 * r2}$. Qual o coeficiente líder?`, k, t`$P(x)=a(${xm(r1)})(${xm(r2)})$, $P(0)=a\cdot ${par(r1 * r2)}=${k * r1 * r2}\Rightarrow a=${k}$.`);
            }),
            tf(t`O polinômio $P(x)=x-i$ tem raiz $i$ mas não tem raiz $-i$.`, true, 'A regra dos conjugados só vale para coeficientes reais; aqui o coeficiente −i não é real.'),
            gen((rng) => {
              const n = randInt(rng, 4, 9);
              const k = pick(rng, Array.from({ length: n + 1 }, (_, i) => i).filter((i) => (n - i) % 2 === 0));
              return num(`Um polinômio real de grau ${n} tem exatamente ${k} raízes reais (contando multiplicidade). Quantas raízes não reais ele tem?`, n - k, `${n} − ${k} = ${n - k} (número par: vêm em pares conjugados).`);
            }),
            order(t`Ordene para montar o polinômio real mônico de raízes $2$ e $i$.`, [t`Inclua a conjugada: raízes $2$, $i$, $-i$`, t`Escreva $(x-2)(x-i)(x+i)$`, t`$(x-i)(x+i)=x^2+1$`, t`$P(x)=(x-2)(x^2+1)=x^3-2x^2+x-2$`], 'Conjugadas primeiro, depois multiplique.'),
            multi('Quais podem ser o conjunto de raízes de um polinômio real de grau 3?', ['1, 2, 3', '1, i, −i', '1, i, 2i', '2 (tripla)', 'i, −i, 2i'], [0, 1, 3], 'Raízes não reais aparecem com as conjugadas; 2i sem −2i não serve.'),
          ],
        },
      ],
    },
    {
      id: 'p-pol-girard',
      title: 'Relações de Girard',
      parts: [
        {
          card: {
            title: 'Coeficientes × raízes',
            body: t`Para $ax^3+bx^2+cx+d=0$ com raízes $r_1, r_2, r_3$:
$$r_1+r_2+r_3=-\frac ba\qquad r_1r_2+r_1r_3+r_2r_3=\frac ca\qquad r_1r_2r_3=-\frac da$$
(Vem de expandir $a(x-r_1)(x-r_2)(x-r_3)$.) Em grau 2: soma $-\frac ba$, produto $\frac ca$. Em grau $n$: soma $-\frac{a_{n-1}}{a_n}$, produto $(-1)^n\frac{a_0}{a_n}$.

Truques: $r_1^2+r_2^2+r_3^2=(\Sigma r)^2-2\Sigma r_ir_j$ e $\frac1{r_1}+\frac1{r_2}+\frac1{r_3}=\frac{\Sigma r_ir_j}{r_1r_2r_3}$.`,
          },
          exercises: [
            gen((rng) => {
              const r = [randNZ(rng, -5, 5), randNZ(rng, -5, 5), randNZ(rng, -5, 5)];
              const c = fromRoots(r);
              return num(t`Soma das raízes de $${polyStr(c)}=0$:`, r[0] + r[1] + r[2], t`$-\frac{b}{a}=${-c[1]}$.`);
            }),
            gen((rng) => {
              const r = [randNZ(rng, -5, 5), randNZ(rng, -5, 5), randNZ(rng, -5, 5)];
              const c = fromRoots(r);
              return num(t`Produto das raízes de $${polyStr(c)}=0$:`, r[0] * r[1] * r[2], t`$-\frac{d}{a}=${-c[3]}$.`);
            }),
            gen((rng) => {
              const r = [randNZ(rng, -4, 4), randNZ(rng, -4, 4), randNZ(rng, -4, 4)];
              const c = fromRoots(r);
              const s1 = -c[1], s2 = c[2];
              return num(t`Para $${polyStr(c)}=0$, calcule $r_1^2+r_2^2+r_3^2$.`, s1 * s1 - 2 * s2, t`$(\Sigma r)^2-2\Sigma r_ir_j=${par(s1)}^2-2\cdot ${par(s2)}=${s1 * s1 - 2 * s2}$.`);
            }),
            gen((rng) => {
              const r = [randNZ(rng, -4, 4), randNZ(rng, -4, 4), randNZ(rng, -4, 4)];
              const c = fromRoots(r);
              return num(t`Para $${polyStr(c)}=0$, calcule $\frac1{r_1}+\frac1{r_2}+\frac1{r_3}$ (3 casas).`, c[2] / -c[3], t`$\frac{\Sigma r_ir_j}{r_1r_2r_3}=\frac{${c[2]}}{${-c[3]}}\approx ${fmt(c[2] / -c[3], 3)}$.`, { tol: 0.002 });
            }),
            gen((rng) => {
              const m = randNZ(rng, -3, 3), d = randInt(rng, 1, 3);
              const roots = [m - d, m, m + d];
              const c = fromRoots(roots);
              return num(t`As raízes de $${polyStr(c)}=0$ estão em PA. Use Girard: qual é a raiz do meio?`, m, t`Em PA, $r_1+r_2+r_3=3r_2=${3 * m}\Rightarrow r_2=${m}$.`);
            }),
            tf(t`Em $2x^3-6x^2+x-4=0$, a soma das raízes é $3$.`, true, t`$-\frac{-6}{2}=3$.`),
            gen((rng) => {
              const s = randInt(rng, -6, 6), p = randInt(rng, -8, 8);
              return rmcq(rng, `Equação do 2º grau cujas raízes têm soma ${s} e produto ${p}:`, t`$${polyStr([1, -s, p])}=0$`, [t`$${polyStr([1, s, p])}=0$`, t`$${polyStr([1, -p, s])}=0$`, t`$${polyStr([1, s, -p])}=0$`], t`$x^2-Sx+P=0$.`);
            }),
            gen((rng) => {
              const r = [randNZ(rng, -3, 3), randNZ(rng, -3, 3), randNZ(rng, -3, 3), randNZ(rng, -3, 3)];
              const c = fromRoots(r);
              return num(t`Produto das raízes de $${polyStr(c)}=0$ (grau 4):`, r[0] * r[1] * r[2] * r[3], t`$(-1)^4\frac{a_0}{a_4}=${c[4]}$.`);
            }),
          ],
        },
        {
          card: {
            title: 'Problemas clássicos com Girard',
            body: t`Girard brilha quando há uma **informação extra** sobre as raízes:
• em **PA**: escreva $m-d,\ m,\ m+d$ — a soma dá $3m$;
• em **PG**: escreva $\frac mq,\ m,\ mq$ — o produto dá $m^3$;
• uma raiz é o **dobro/oposto/inverso** de outra: monte o sistema com soma e produto.

Para criar uma equação cujas raízes são **transformadas** (dobro, inverso, $r+1$…) basta usar as novas soma e produto.`,
            example: t`$x^3-7x^2+14x-8=0$ com raízes em PG: $m^3=8\Rightarrow m=2$. Dividindo por $(x-2)$: $x^2-5x+4$, raízes $1$ e $4$.`,
          },
          exercises: [
            gen((rng) => {
              const m = pick(rng, [1, 2, 3, -2]), q = pick(rng, [2, 3, -2]);
              const roots = [m, m * q, m * q * q];
              const c = fromRoots(roots);
              return num(t`As raízes de $${polyStr(c)}=0$ estão em PG. Qual é o termo do meio?`, m * q, t`Produto $=(mq)^3=${-c[3]}\Rightarrow$ termo do meio $=${m * q}$.`);
            }),
            gen((rng) => {
              const S = randInt(rng, -6, 6), P = randInt(rng, -8, 8);
              return num(t`Raízes de $${polyStr([1, -S, P])}=0$: quanto vale $r_1^2+r_2^2$?`, S * S - 2 * P, t`$S^2-2P=${S * S}-${par(2 * P)}=${S * S - 2 * P}$.`);
            }),
            gen((rng) => {
              const b = randNZ(rng, -5, 5), c = randNZ(rng, -6, 6);
              return rmcq(rng, t`Se $r_1, r_2$ são raízes de $${polyStr([1, b, c])}=0$, qual equação tem raízes $2r_1$ e $2r_2$?`, t`$${polyStr([1, 2 * b, 4 * c])}=0$`, [t`$${polyStr([1, 2 * b, 2 * c])}=0$`, t`$${polyStr([1, b, 4 * c])}=0$`, t`$${polyStr([2, b, c])}=0$`], t`Nova soma $2S=${-2 * b}$, novo produto $4P=${4 * c}$.`);
            }),
            gen((rng) => {
              const b = randNZ(rng, -5, 5), c = pick(rng, [-6, -5, -4, -3, -2, 2, 3, 4, 5, 6]);
              return rmcq(rng, t`Se $r_1, r_2$ são raízes de $${polyStr([1, b, c])}=0$, qual equação tem raízes $\frac1{r_1}$ e $\frac1{r_2}$?`, t`$${polyStr([c, b, 1])}=0$`, [t`$${polyStr([1, -b, c])}=0$`, t`$${polyStr([1, b, c])}=0$`, t`$${polyStr([c, -b, 1])}=0$`], 'Inverter as raízes = inverter a ordem dos coeficientes.');
            }),
            tf(t`Em $x^3+px+q=0$ (sem termo em $x^2$), a soma das raízes é zero.`, true, t`Soma $=-\frac{0}{1}=0$.`),
            gen((rng) => {
              const r = [randNZ(rng, -4, 4), randNZ(rng, -4, 4), randNZ(rng, -4, 4)];
              const c = fromRoots(r);
              return num(t`Para $${polyStr(c)}=0$, calcule $r_1r_2+r_1r_3+r_2r_3$.`, c[2], t`$\frac ca=${c[2]}$.`);
            }),
            gen((rng) => {
              const a = randNZ(rng, -4, 4);
              const S = 3 * a;
              const P = 2 * a * a;
              return num(t`Uma raiz de $${polyStr([1, -S, P])}=0$ é o dobro da outra. Qual a menor raiz em valor absoluto?`, a, t`$r+2r=${S}\Rightarrow r=${a}$ (confira: produto $2r^2=${P}$).`);
            }),
            match('Associe a informação ao "chute" das raízes.', [['raízes em PA', 'm − d, m, m + d'], ['raízes em PG', 'm/q, m, mq'], ['raízes opostas', 'r e −r'], ['raízes inversas', 'r e 1/r']], 'A forma certa faz a soma ou o produto simplificar.'),
          ],
        },
      ],
    },
    {
      id: 'p-pol-racionais',
      title: 'Pesquisa de raízes',
      parts: [
        {
          card: {
            title: 'Candidatos racionais e Briot-Ruffini',
            body: t`**Teorema das raízes racionais**: se $\frac pq$ (irredutível) é raiz de $a_nx^n+\dots+a_0$ com coeficientes inteiros, então $p\mid a_0$ e $q\mid a_n$.

Roteiro:
1. Liste os candidatos $\pm\frac pq$.
2. Teste (ou use Briot-Ruffini) até achar uma raiz $r$.
3. Divida por $(x-r)$: o grau cai em 1.
4. Repita, ou resolva a quadrática que sobrar.

**Raiz múltipla**: $r$ tem multiplicidade $\ge2$ $\iff P(r)=0$ **e** $P'(r)=0$.`,
          },
          exercises: [
            gen((rng) => {
              const a0 = pick(rng, [6, 8, 10, 12, 15]);
              const divs = Array.from({ length: a0 }, (_, i) => i + 1).filter((d) => a0 % d === 0);
              return num(`Quantos candidatos a raiz inteira (positivos e negativos) tem x³ + ... + ${a0} (coeficiente líder 1)?`, 2 * divs.length, `Divisores de ${a0}: ${divs.join(', ')} — com sinais ±: ${2 * divs.length}.`);
            }),
            gen((rng) => {
              const r = [randNZ(rng, -4, 4), randNZ(rng, -4, 4), randNZ(rng, -4, 4)];
              const c = fromRoots(r);
              const ans = Math.max(...r);
              return num(t`Ache a maior raiz de $${polyStr(c)}=0$ (todas são inteiras).`, ans, `Teste os divisores de ${c[3]}; raízes: ${[...r].sort((a, b) => a - b).join(', ')}.`);
            }),
            mcqS(t`Quais são candidatos a raízes racionais de $2x^3-3x^2+1$?`, t`$\pm1,\ \pm\frac12$`, [t`$\pm1,\ \pm2$`, t`$\pm2,\ \pm\frac12$`, t`$\pm1,\ \pm3$`], t`$p\mid1$ e $q\mid2$: $\pm1$, $\pm\frac12$. (De fato $1$ é raiz dupla e $-\frac12$ é raiz.)`),
            gen((rng) => {
              const r = randNZ(rng, -3, 3), a = randInt(rng, 1, 3), b = randInt(rng, 1, 4);
              const K = a * a + b * b;
              const P = [1, -r, K, -r * K];
              return num(t`$x=${r}$ é raiz de $${polyStr(P)}$. Após dividir por $(x${r < 0 ? '+' : '-'}${Math.abs(r)})$, o quociente é $x^2+k$. Quanto vale $k$?`, a * a + b * b, t`Briot-Ruffini dá $x^2+${a * a + b * b}$, cujas raízes são $\pm${fmt(Math.sqrt(a * a + b * b), 3)}i$.`);
            }),
            tf(t`$x=1$ é raiz dupla de $P(x)=x^3-3x+2$.`, true, t`$P(1)=0$ e $P'(x)=3x^2-3$ dá $P'(1)=0$. De fato $P=(x-1)^2(x+2)$.`),
            order('Ordene a pesquisa de raízes de um polinômio de grau 3 com coeficientes inteiros.', ['Liste os candidatos ±p/q', 'Teste até achar uma raiz r', 'Divida por (x − r) com Briot-Ruffini', 'Resolva a equação do 2º grau que sobrou'], 'Uma raiz racional abre caminho para as outras.'),
            gen((rng) => {
              const k = randInt(rng, 2, 6);
              return num(t`Para que valor de $m$ o número $${k}$ é raiz de $x^3-${k}x^2+mx-${k * k}$?`, k, t`$${k ** 3}-${k ** 3}+${k}m-${k * k}=0\Rightarrow m=${k}$.`);
            }),
            multi(t`$P(x)=(x-2)^3(x+1)^2x$. Quais afirmações são verdadeiras?`, ['2 é raiz tripla', 'P tem grau 6', '−1 é raiz simples', 'P(0) = 0', 'o gráfico cruza o eixo em x = −1'], [0, 1, 3], '−1 tem multiplicidade 2 (tangencia, não cruza).'),
          ],
        },
        {
          card: {
            title: 'Localizando raízes reais',
            body: t`**Bolzano**: se $P$ é contínuo e $P(a)$, $P(b)$ têm sinais opostos, há um número **ímpar** de raízes (contadas com multiplicidade) entre $a$ e $b$. Sinais iguais: número par (talvez zero).

**Equações recíprocas** ($a_k=a_{n-k}$, coeficientes "espelhados"): divida por $x^{n/2}$ e use $y=x+\frac1x$. Se $r$ é raiz, $\frac1r$ também é.`,
            visual: multLab(),
            example: t`$x^4-5x^3+8x^2-5x+1=0$: dividindo por $x^2$, $(x^2+\frac1{x^2})-5(x+\frac1x)+8=0$; com $y=x+\frac1x$: $y^2-2-5y+8=0\Rightarrow y=2$ ou $y=3$.`,
          },
          exercises: [
            gen((rng) => {
              const c = randInt(rng, 5, 7);
              const P = (x: number) => x ** 3 - 2 * x - c;
              return rmcq(rng, t`Para $P(x)=x^3-2x-${c}$, em qual intervalo há certeza de uma raiz?`, '[2, 3]', ['[0, 1]', '[−1, 0]', '[−3, −2]'], t`$P(2)=${P(2)}<0$ e $P(3)=${P(3)}>0$ têm sinais opostos; nos outros intervalos $P$ é negativo nas duas pontas.`);
            }),
            tf('Se P(0) > 0 e P(1) > 0, então P não tem raízes em [0, 1].', false, 'Pode ter um número par delas (ex.: duas raízes no meio do caminho).'),
            gen((rng) => {
              const r = pick(rng, [2, 3, 4, 5]);
              return num(t`Uma equação recíproca tem raiz $${r}$. Qual outra raiz ela certamente tem (3 casas)?`, 1 / r, t`$\frac1{${r}}=${fmt(1 / r, 3)}$.`, { tol: 0.002 });
            }),
            mcqS(t`Com $y=x+\frac1x$, quanto vale $x^2+\frac1{x^2}$?`, t`$y^2-2$`, [t`$y^2$`, t`$y^2+2$`, t`$2y$`], t`$\left(x+\frac1x\right)^2=x^2+2+\frac1{x^2}$.`),
            gen((rng) => {
              const y = pick(rng, [2, 3, 4]);
              const xs = (y + Math.sqrt(y * y - 4)) / 2;
              return num(t`Se $x+\frac1x=${y}$, qual a maior solução $x$ (3 casas)?`, xs, y === 2 ? t`$x^2-2x+1=(x-1)^2=0$: raiz dupla $x=1$.` : t`$x^2-${y}x+1=0\Rightarrow x=\frac{${y}+\sqrt{${y * y - 4}}}{2}\approx${fmt(xs, 3)}$.`, { tol: 0.002 });
            }),
            inter('Faça r = s e escolha a multiplicidade de r para que a raiz resultante tenha multiplicidade PAR (o gráfico só toca o eixo).', 'plot', multLab().props, (v) => near(v.p.r, v.p.s, 0.01) && (Math.round(v.p.m) + 1) % 2 === 0, 'r = s e multiplicidade de r igual a 1 ou 3', '(x − r)^(m+1) com m + 1 par: raiz de multiplicidade par, o gráfico só tangencia.'),
            gen((rng) => {
              const n = pick(rng, [3, 5, 7]);
              return num(`Um polinômio de grau ${n} com coeficientes reais tem quantas raízes reais, no mínimo?`, 1, 'Grau ímpar: pelo menos uma.');
            }),
            match('Associe a ferramenta ao objetivo.', [['teorema das raízes racionais', 'listar candidatos p/q'], ['Briot-Ruffini', 'baixar o grau após achar uma raiz'], ['Bolzano', 'localizar raiz real num intervalo'], ['P(r) = P\'(r) = 0', 'detectar raiz múltipla']], 'Cada ferramenta resolve uma etapa.'),
          ],
        },
      ],
    },
  ],
};

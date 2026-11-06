import React from 'react';
import type { UnitDef } from '../../types';
import { gen, mcq, mcqS, num, tf, fill, match, order, inter, plot, rmcq, near } from '../../helpers';
import { ArcW, FnCurve, Label, PolygonW, Pt, Seg } from '../../../components/plot/Plot';
import { C } from '../../../theme';
import { fmt, pick, randInt } from '../../../lib/random';
import { fnLab, unitCircleLab } from '../../visuals';

const t = String.raw;

const rightTriangle = () =>
  plot({
    view: { xMin: -0.5, xMax: 6, yMin: -0.5, yMax: 4.5 },
    equalAspect: true,
    params: [{ key: 'th', label: '\\theta', min: 10, max: 75, step: 1, value: 37, color: C.gold, format: (v: number) => `${v}°` }],
    render: ({ p }: any) => {
      const a = (p.th * Math.PI) / 180;
      const H = 5;
      const x = H * Math.cos(a);
      const y = H * Math.sin(a);
      return (
        <>
          <PolygonW pts={[[0, 0], [x, 0], [x, y]]} color={C.p1} opacity={0.15} />
          <Seg x1={0} y1={0} x2={x} y2={0} color={C.p2} width={4} />
          <Seg x1={x} y1={0} x2={x} y2={y} color={C.p5} width={4} />
          <Seg x1={0} y1={0} x2={x} y2={y} color={C.gold} width={4} />
          <ArcW cx={0} cy={0} r={0.8} a0={0} a1={a} color={C.gold} />
          <Label x={x / 2} y={0} dy={16} text="adjacente" color={C.p2} anchor="middle" size={12} />
          <Label x={x} y={y / 2} dx={6} text="oposto" color={C.p5} size={12} />
        </>
      );
    },
    info: ({ p }: any) => {
      const a = (p.th * Math.PI) / 180;
      return t`hip $=5$ · $\operatorname{sen}\theta=${fmt(Math.sin(a), 3)}$ · $\cos\theta=${fmt(Math.cos(a), 3)}$ · $\operatorname{tg}\theta=${fmt(Math.tan(a), 3)}$`;
    },
  });

export const trigonometria: UnitDef = {
  id: 'f-trig',
  title: 'Trigonometria',
  subtitle: 'Triângulo retângulo, ciclo trigonométrico e funções',
  icon: '🔺',
  source: 'Competências Básicas · Trigonometria',
  guide: t`Seno, cosseno e tangente começam no triângulo retângulo, ganham o ciclo trigonométrico e viram funções periódicas — essenciais para ondas, vibrações e circuitos AC.`,
  lessons: [
    {
      id: 'f-trig-tri',
      title: 'Triângulo retângulo',
      cards: [
        {
          title: 'SOH-CAH-TOA',
          body: t`$$\operatorname{sen}\theta=\frac{\text{oposto}}{\text{hipotenusa}}\quad \cos\theta=\frac{\text{adjacente}}{\text{hipotenusa}}\quad \operatorname{tg}\theta=\frac{\text{oposto}}{\text{adjacente}}$$

Mude o ângulo e veja as razões:`,
          visual: rightTriangle(),
        },
        {
          title: 'Ângulos notáveis',
          body: t`• $\operatorname{sen}30^\circ=\frac12$, $\operatorname{sen}45^\circ=\frac{\sqrt2}2$, $\operatorname{sen}60^\circ=\frac{\sqrt3}2$
• $\cos30^\circ=\frac{\sqrt3}2$, $\cos45^\circ=\frac{\sqrt2}2$, $\cos60^\circ=\frac12$
• $\operatorname{tg}30^\circ=\frac{\sqrt3}3$, $\operatorname{tg}45^\circ=1$, $\operatorname{tg}60^\circ=\sqrt3$`,
          tip: t`Truque: os senos de 30°, 45°, 60° são $\frac{\sqrt1}{2},\frac{\sqrt2}{2},\frac{\sqrt3}{2}$; os cossenos são a mesma lista ao contrário.`,
        },
      ],
      exercises: [
        gen((rng) => {
          const h = pick(rng, [10, 20, 30, 50]);
          return num(t`Uma escada de $${h}$ m está apoiada num muro, formando $30^\circ$ com o chão. A que altura ela toca o muro?`, h / 2, t`altura $=${h}\cdot\operatorname{sen}30^\circ=${h}\cdot\frac12=${h / 2}$ m.`, { unit: 'm' });
        }),
        mcqS(t`Quanto vale $\cos 60^\circ$?`, t`$\frac12$`, [t`$\frac{\sqrt3}{2}$`, t`$\frac{\sqrt2}{2}$`, t`$1$`]),
        num(t`De um ponto a $20$ m de um prédio, vê-se o topo sob $45^\circ$. Qual a altura do prédio?`, 20, t`$\operatorname{tg}45^\circ=\frac{h}{20}=1\Rightarrow h=20$ m.`, { unit: 'm' }),
        inter(t`Ajuste o ângulo para que $\operatorname{sen}\theta=\cos\theta$.`, 'plot', rightTriangle().props, (v: any) => v && v.p.th === 45, '$\\theta=45^\\circ$'),
        match(t`Ligue os valores:`, [
          [t`$\operatorname{sen}30^\circ$`, t`$\frac12$`],
          [t`$\operatorname{tg}45^\circ$`, '$1$'],
          [t`$\cos30^\circ$`, t`$\frac{\sqrt3}{2}$`],
          [t`$\operatorname{tg}60^\circ$`, t`$\sqrt3$`],
        ]),
      ],
    },
    {
      id: 'f-trig-ciclo',
      title: 'Ciclo trigonométrico e radianos',
      cards: [
        {
          title: 'O círculo de raio 1',
          body: t`Gire o ponto $P$ no círculo de raio 1. O **cosseno** é a coordenada $x$ (azul) e o **seno** é a coordenada $y$ (rosa).

Por Pitágoras: $$\operatorname{sen}^2\theta+\cos^2\theta=1$$`,
          visual: unitCircleLab(),
        },
        {
          title: 'Radianos',
          body: t`Um radiano é o ângulo cujo arco tem o comprimento do raio. Uma volta: $2\pi$ rad $=360^\circ$.

$$\theta_{rad}=\theta_{graus}\cdot\frac{\pi}{180}$$

$90^\circ=\frac\pi2$, $180^\circ=\pi$, $270^\circ=\frac{3\pi}{2}$.`,
          tip: t`Sinais por quadrante: 1º tudo positivo; 2º só seno; 3º só tangente; 4º só cosseno.`,
        },
      ],
      exercises: [
        gen((rng) => {
          const g = pick(rng, [30, 45, 60, 90, 120, 135, 150, 180, 270]);
          const map: Record<number, string> = { 30: '\\frac{\\pi}{6}', 45: '\\frac{\\pi}{4}', 60: '\\frac{\\pi}{3}', 90: '\\frac{\\pi}{2}', 120: '\\frac{2\\pi}{3}', 135: '\\frac{3\\pi}{4}', 150: '\\frac{5\\pi}{6}', 180: '\\pi', 270: '\\frac{3\\pi}{2}' };
          const wrong = Object.values(map).filter((v) => v !== map[g]);
          return rmcq(rng, t`Converta $${g}^\circ$ para radianos.`, `$${map[g]}$`, wrong.map((w) => `$${w}$`), t`$${g}\cdot\frac{\pi}{180}=${map[g]}$.`);
        }),
        mcqS(t`Em qual quadrante o seno é positivo e o cosseno é negativo?`, '2º quadrante', ['1º quadrante', '3º quadrante', '4º quadrante']),
        inter(t`Arraste $P$ até o ângulo de $90^\circ$.`, 'plot', unitCircleLab().props, (v: any) => v && near(v.pts.P.x, 0, 0.05) && v.pts.P.y > 0.99, t`$P=(0,\,1)$`),
        inter(t`Arraste $P$ para um ponto onde $\cos\theta=-1$.`, 'plot', unitCircleLab().props, (v: any) => v && v.pts.P.x < -0.995, t`$\theta=180^\circ$, $P=(-1,\,0)$`),
        num(t`Se $\operatorname{sen}\theta=0{,}6$ e $\theta$ está no 1º quadrante, quanto vale $\cos\theta$?`, 0.8, t`$\cos\theta=\sqrt{1-0{,}36}=0{,}8$.`),
        tf(t`$\operatorname{sen}(\pi)=0$`, true),
      ],
    },
    {
      id: 'f-trig-func',
      title: 'Funções trigonométricas',
      cards: [
        {
          title: 'A onda senoidal',
          body: t`Girando sem parar, a altura de $P$ desenha a senoide:`,
          visual: unitCircleLab(true),
        },
        {
          title: 'Amplitude, frequência e fase',
          body: t`$$f(x)=A\operatorname{sen}(Bx+C)$$
• $A$: **amplitude** (altura da onda)
• **Período** $=\frac{2\pi}{B}$
• $C$: deslocamento (fase)`,
          visual: fnLab({
            f: (x, p) => p.A * Math.sin(p.B * x + p.C),
            params: [
              { key: 'A', label: 'A', min: 0.5, max: 3, step: 0.1, value: 1.5, color: C.p5 },
              { key: 'B', label: 'B', min: 0.5, max: 4, step: 0.1, value: 1, color: C.p2 },
              { key: 'C', label: 'C', min: -3.14, max: 3.14, step: 0.05, value: 0, color: C.p3 },
            ],
            view: { xMin: -1, xMax: 12.6, yMin: -3.5, yMax: 3.5 },
            info: (p) => t`$f(x)=${fmt(p.A)}\operatorname{sen}(${fmt(p.B)}x${p.C < 0 ? '' : '+'}${fmt(p.C, 2)})$ · período $=${fmt((2 * Math.PI) / p.B, 3)}$`,
          }),
          tip: t`Identidades úteis: $\operatorname{sen}(2x)=2\operatorname{sen}x\cos x$ e $\cos(2x)=\cos^2x-\operatorname{sen}^2x$.`,
        },
      ],
      exercises: [
        gen((rng) => {
          const B = pick(rng, [1, 2, 3, 4]);
          return rmcq(rng, t`Qual o período de $f(x)=\operatorname{sen}(${B}x)$?`, B === 1 ? t`$2\pi$` : B === 2 ? t`$\pi$` : t`$\frac{2\pi}{${B}}$`, [t`$${2 * B}\pi$`, t`$\frac{\pi}{${2 * B}}$`, t`$${B}\pi$`, t`$4\pi$`], t`Período $=\frac{2\pi}{${B}}$.`);
        }),
        mcqS(t`Qual a amplitude de $f(x)=-3\cos(2x)$?`, '$3$', ['$-3$', '$2$', '$6$'], t`Amplitude é $|A|=3$.`),
        inter(t`Ajuste a onda para ter amplitude 2 e período $\pi$ (sem fase).`, 'plot', fnLab({ f: (x, p) => p.A * Math.sin(p.B * x + p.C), params: [{ key: 'A', label: 'A', min: 0.5, max: 3, step: 0.1, value: 1, color: C.p5 }, { key: 'B', label: 'B', min: 0.5, max: 4, step: 0.1, value: 1, color: C.p2 }, { key: 'C', label: 'C', min: -3.14, max: 3.14, step: 0.05, value: 0, color: C.p3 }], view: { xMin: -1, xMax: 12.6, yMin: -3.5, yMax: 3.5 }, ghost: (x) => 2 * Math.sin(2 * x) }).props, (v: any) => v && near(v.p.A, 2, 0.01) && near(v.p.B, 2, 0.01) && near(v.p.C, 0, 0.01), t`$A=2$, $B=2$, $C=0$`),
        tf(t`$\operatorname{sen}^2x+\cos^2x=1$ para todo $x$ real.`, true),
        num(t`Calcule $\operatorname{sen}(2x)$ sabendo que $\operatorname{sen}x=0{,}6$ e $\cos x=0{,}8$.`, 0.96, t`$2\cdot0{,}6\cdot0{,}8=0{,}96$.`),
      ],
    },
  ],
};

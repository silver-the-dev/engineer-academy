import React from 'react';
import type { UnitDef } from '../../types';
import { gen, mcqS, num, tf, match, order, multi, inter, plot, rmcq, near } from '../../helpers';
import { ArcW, CircleW, FnCurve, InfLine, PolygonW, Pt, Seg } from '../../../components/plot/Plot';
import { C } from '../../../theme';
import { fmt, pick, randInt } from '../../../lib/random';

const t = String.raw;
const PI = Math.PI;
const rad = (d: number) => (d * PI) / 180;
const deg = (r: number) => (r * 180) / PI;
type P2 = { x: number; y: number };
const dist = (a: P2, b: P2) => Math.hypot(a.x - b.x, a.y - b.y);
const angAt = (v: P2, a: P2, b: P2) => {
  const c = ((a.x - v.x) * (b.x - v.x) + (a.y - v.y) * (b.y - v.y)) / (dist(v, a) * dist(v, b) || 1);
  return Math.acos(Math.max(-1, Math.min(1, c)));
};
const onCircle = (R: number) => (_: string, x: number, y: number) => {
  const a = Math.atan2(y, x);
  return { x: R * Math.cos(a), y: R * Math.sin(a) };
};

/* ---------------- labs ---------------- */

/** a / sen A = 2R for a triangle inscribed in a circle of radius 2. */
const sinesLab = () =>
  plot({
    view: { xMin: -2.8, xMax: 2.8, yMin: -2.8, yMax: 2.8 },
    equalAspect: true,
    grid: false,
    points: [
      { id: 'A', x: 2 * Math.cos(2.4), y: 2 * Math.sin(2.4), color: C.p2, label: 'A' },
      { id: 'B', x: 2 * Math.cos(-0.6), y: 2 * Math.sin(-0.6), color: C.p5, label: 'B' },
      { id: 'C', x: 2 * Math.cos(1), y: 2 * Math.sin(1), color: C.gold, label: 'C' },
    ],
    constrain: onCircle(2),
    render: ({ pts }: any) => (
      <>
        <CircleW cx={0} cy={0} r={2} color={C.textDim} width={2} />
        <PolygonW pts={[[pts.A.x, pts.A.y], [pts.B.x, pts.B.y], [pts.C.x, pts.C.y]]} color={C.p2} opacity={0.15} stroke={C.p2} />
        <Pt x={0} y={0} color={C.textMuted} r={3} />
      </>
    ),
    info: ({ pts }: any) => {
      const { A, B, C: Cc } = pts;
      const a = dist(B, Cc), b = dist(A, Cc), c = dist(A, B);
      const sA = Math.sin(angAt(A, B, Cc)), sB = Math.sin(angAt(B, A, Cc)), sC = Math.sin(angAt(Cc, A, B));
      return t`$\frac{a}{\operatorname{sen}A}=${fmt(a / sA, 2)}$ · $\frac{b}{\operatorname{sen}B}=${fmt(b / sB, 2)}$ · $\frac{c}{\operatorname{sen}C}=${fmt(c / sC, 2)}$ · $2R=4$`;
    },
  });

/** Ambiguous case LLA: angle A, side b = AC = 3, side a = BC varies. */
const ambiguousLab = () =>
  plot({
    view: { xMin: -0.5, xMax: 6.5, yMin: -0.8, yMax: 3.6 },
    equalAspect: true,
    grid: false,
    params: [
      { key: 'A', label: '\\hat A', min: 15, max: 75, step: 1, value: 35, color: C.p2, format: (v: number) => v + '°' },
      { key: 'a', label: 'a', min: 0.5, max: 4, step: 0.05, value: 2, color: C.gold },
    ],
    render: ({ p }: any) => {
      const A = rad(p.A);
      const Cp = { x: 3 * Math.cos(A), y: 3 * Math.sin(A) };
      const disc = p.a * p.a - Cp.y * Cp.y;
      const out: React.ReactNode[] = [
        <InfLine key="r" x1={0} y1={0} x2={1} y2={0} color={C.textMuted} />,
        <Seg key="b" x1={0} y1={0} x2={Cp.x} y2={Cp.y} color={C.p2} width={3.5} />,
        <CircleW key="c" cx={Cp.x} cy={Cp.y} r={p.a} color={C.gold} width={1.5} dash="5 4" />,
        <Pt key="A" x={0} y={0} color={C.p2} label="A" />,
        <Pt key="C" x={Cp.x} y={Cp.y} color={C.p2} label="C" />,
      ];
      if (disc >= 0) {
        [Cp.x - Math.sqrt(disc), Cp.x + Math.sqrt(disc)].forEach((bx, i) => {
          if (bx > 0.001) out.push(<Seg key={'s' + i} x1={Cp.x} y1={Cp.y} x2={bx} y2={0} color={i ? C.gold : C.p5} width={3} />, <Pt key={'B' + i} x={bx} y={0} color={i ? C.gold : C.p5} label={i ? 'B₂' : 'B₁'} />);
        });
      }
      return <>{out}</>;
    },
    info: ({ p }: any) => {
      const h = 3 * Math.sin(rad(p.A));
      const nSol = p.a < h - 1e-9 ? 0 : Math.abs(p.a - h) < 0.03 || p.a >= 3 ? 1 : 2;
      return t`$b=3$, altura $h=b\operatorname{sen}A=${fmt(h, 2)}$ · $a=${fmt(p.a, 2)}$ ⇒ **${nSol}** triângulo(s)`;
    },
  });

/** Beats: sen(w1 t) + sen(w2 t) = 2 sen(...)cos(...). */
const beatLab = () =>
  plot({
    view: { xMin: 0, xMax: 20, yMin: -2.4, yMax: 2.4 },
    params: [
      { key: 'w1', label: '\\omega_1', min: 4, max: 8, step: 0.1, value: 6, color: C.p2 },
      { key: 'w2', label: '\\omega_2', min: 4, max: 8, step: 0.1, value: 5.4, color: C.p5 },
    ],
    render: ({ p }: any) => {
      const d = (p.w1 - p.w2) / 2;
      return (
        <>
          <FnCurve f={(x) => 2 * Math.cos(d * x)} color={C.gold} width={1.5} dash="5 4" samples={300} />
          <FnCurve f={(x) => -2 * Math.cos(d * x)} color={C.gold} width={1.5} dash="5 4" samples={300} />
          <FnCurve f={(x) => Math.sin(p.w1 * x) + Math.sin(p.w2 * x)} color={C.p2} width={2} samples={600} />
        </>
      );
    },
    info: ({ p }: any) =>
      t`$\operatorname{sen}(${fmt(p.w1, 1)}t)+\operatorname{sen}(${fmt(p.w2, 1)}t)=2\cos(${fmt((p.w1 - p.w2) / 2, 2)}t)\,\operatorname{sen}(${fmt((p.w1 + p.w2) / 2, 2)}t)$ · envelope (amarelo) = batimento`,
  });

/** sen x > k on the unit circle: the highlighted arc is the solution in [0, 2π). */
const ineqCircleLab = () =>
  plot({
    view: { xMin: -1.6, xMax: 1.6, yMin: -1.5, yMax: 1.5 },
    equalAspect: true,
    grid: false,
    params: [
      { key: 'f', label: 'função', min: 0, max: 1, step: 1, value: 0, color: C.p2, format: (v: number) => (v ? 'cos x > k' : 'sen x > k') },
      { key: 'k', label: 'k', min: -0.95, max: 0.95, step: 0.05, value: 0.5, color: C.gold },
    ],
    render: ({ p }: any) => {
      const k = p.k;
      const isCos = Math.round(p.f) === 1;
      const a0 = isCos ? -Math.acos(k) : Math.asin(k);
      const a1 = isCos ? Math.acos(k) : PI - Math.asin(k);
      return (
        <>
          <CircleW cx={0} cy={0} r={1} color={C.textDim} width={2} />
          {isCos ? <InfLine x1={k} y1={0} x2={k} y2={1} color={C.p5} dash="5 4" /> : <InfLine x1={0} y1={k} x2={1} y2={k} color={C.p5} dash="5 4" />}
          <ArcW cx={0} cy={0} r={1} a0={a0} a1={a1} color={C.success} width={6} />
          <Pt x={Math.cos(a0)} y={Math.sin(a0)} color={C.gold} r={5} />
          <Pt x={Math.cos(a1)} y={Math.sin(a1)} color={C.gold} r={5} />
        </>
      );
    },
    info: ({ p }: any) => {
      const k = p.k;
      if (Math.round(p.f) === 1) {
        const a = Math.acos(k);
        return t`$\cos x>${fmt(k, 2)}$: $x\in[0,\,${fmt(a, 3)})\cup(${fmt(2 * PI - a, 3)},\,2\pi)$ — em graus, até $${fmt(deg(a), 1)}^\circ$ e depois de $${fmt(360 - deg(a), 1)}^\circ$`;
      }
      const a = Math.asin(k);
      const lo = a < 0 ? a + 2 * PI : a;
      return a >= 0
        ? t`$\operatorname{sen}x>${fmt(k, 2)}$: $${fmt(a, 3)}<x<${fmt(PI - a, 3)}$ (de $${fmt(deg(a), 1)}^\circ$ a $${fmt(180 - deg(a), 1)}^\circ$)`
        : t`$\operatorname{sen}x>${fmt(k, 2)}$: $[0,\,${fmt(PI - a, 3)})\cup(${fmt(lo, 3)},\,2\pi)$`;
    },
  });

/* ---------------- unit ---------------- */

export const trigTransf: UnitDef = {
  id: 'p-tri',
  title: 'Triângulos quaisquer e transformações',
  subtitle: 'Leis dos senos e cossenos a fundo, prostaférese e inequações trigonométricas',
  icon: '📐',
  guide: t`Lei dos senos: $\frac{a}{\operatorname{sen}A}=\frac{b}{\operatorname{sen}B}=\frac{c}{\operatorname{sen}C}=2R$. Lei dos cossenos: $a^2=b^2+c^2-2bc\cos A$ (decide se o triângulo é agudo, reto ou obtuso). Área $=\frac12ab\operatorname{sen}C$ ou Heron. As fórmulas de **prostaférese** transformam somas de senos/cossenos em produtos (e vice-versa) — é o batimento das ondas. Inequações trigonométricas se resolvem no **ciclo**: marque o arco e some $2k\pi$.`,
  lessons: [
    {
      id: 'p-tri-res',
      title: 'Resolução de triângulos quaisquer',
      parts: [
        {
          card: [
            {
              title: 'Lei dos senos e o raio circunscrito',
              body: t`Em qualquer triângulo inscrito numa circunferência de raio $R$:
$$\frac{a}{\operatorname{sen}A}=\frac{b}{\operatorname{sen}B}=\frac{c}{\operatorname{sen}C}=2R$$
Use quando conhecer **dois ângulos e um lado** (ALA, LAAo) ou **dois lados e o ângulo oposto a um deles** (LLA — cuidado com o caso ambíguo).`,
              visual: sinesLab(),
            },
            {
              title: 'O caso ambíguo (LLA)',
              body: t`Dados $A$, $b$ e $a$ (oposto a $A$), com $A$ agudo e $h=b\operatorname{sen}A$:
• $a<h$: nenhum triângulo; • $a=h$: um (retângulo);
• $h<a<b$: **dois** triângulos; • $a\ge b$: um.`,
              visual: ambiguousLab(),
            },
          ],
          exercises: [
            gen((rng) => {
              const [A, B] = pick(rng, [[30, 45], [45, 60], [30, 60], [60, 75], [45, 30]]);
              const a = 2 * randInt(rng, 2, 8);
              const b = (a * Math.sin(rad(B))) / Math.sin(rad(A));
              return num(t`Num triângulo, $\hat A=${A}^\circ$, $\hat B=${B}^\circ$ e $a=${a}$. Quanto mede $b$ (2 casas)?`, b, t`$b=\frac{a\operatorname{sen}B}{\operatorname{sen}A}=\frac{${a}\operatorname{sen}${B}^\circ}{\operatorname{sen}${A}^\circ}\approx${fmt(b, 2)}$.`, { tol: 0.01 });
            }),
            gen((rng) => {
              const A = pick(rng, [30, 45, 60, 90, 120, 150]);
              const a = randInt(rng, 2, 12);
              const R = a / (2 * Math.sin(rad(A)));
              return num(t`Lado $a=${a}$ oposto a $\hat A=${A}^\circ$. Raio da circunferência circunscrita (2 casas)?`, R, t`$2R=\frac{a}{\operatorname{sen}A}\Rightarrow R=\frac{${a}}{2\operatorname{sen}${A}^\circ}\approx${fmt(R, 2)}$.`, { tol: 0.01 });
            }),
            inter('Arraste os vértices: confira que a/sen A = 2R sempre. Deixe o triângulo com um ângulo obtuso.', 'plot', sinesLab().props, (v) => {
              const { A, B, C: Cc } = v.pts;
              return Math.max(angAt(A, B, Cc), angAt(B, A, Cc), angAt(Cc, A, B)) > PI / 2 + 0.05;
            }, 'coloque os três vértices no mesmo semicírculo', 'Mesmo obtuso, a razão continua 2R = 4 (sen 120° = sen 60°).'),
            inter('No caso LLA, ajuste A e a para obter DOIS triângulos.', 'plot', ambiguousLab().props, (v) => {
              const h = 3 * Math.sin(rad(v.p.A));
              return v.p.a > h + 0.03 && v.p.a < 3;
            }, 'h < a < 3 (ex.: A = 35°, a = 2)', 'A circunferência de raio a corta a reta em dois pontos à direita de A.'),
            gen((rng) => {
              const A = 30;
              const b = 2 * randInt(rng, 2, 6);
              const h = b / 2;
              const kind = pick(rng, ['0', '1', '2']);
              const a = kind === '0' ? h - 1 : kind === '1' ? h : h + 0.5 * (b - h);
              return num(t`$\hat A=${A}^\circ$, $b=${b}$ e $a=${fmt(a)}$. Quantos triângulos existem?`, Number(kind), t`$h=b\operatorname{sen}30^\circ=${h}$. $a${a < h ? '<' : a === h ? '=' : '>'}h$${a > h ? t` e $a<b$` : ''}: ${kind} triângulo(s).`);
            }),
            tf(t`Se $\hat A$ é obtuso e $a>b$, existe exatamente um triângulo com esses dados.`, true, 'Com A obtuso, só há solução se a > b, e ela é única.'),
            gen((rng) => {
              const A = pick(rng, [40, 50, 55, 65, 70]), B = pick(rng, [35, 45, 60]);
              const c = randInt(rng, 50, 200);
              const Cang = 180 - A - B;
              const a = (c * Math.sin(rad(A))) / Math.sin(rad(Cang));
              return num(`Dois pontos A e B na mesma margem de um rio distam ${c} m. Um ponto P na outra margem forma os ângulos PBA = ${A}° e PAB = ${B}°. Quanto mede AP (m, 1 casa)?`, a, t`$\hat P=${Cang}^\circ$; $\frac{AP}{\operatorname{sen}${A}^\circ}=\frac{${c}}{\operatorname{sen}${Cang}^\circ}\Rightarrow AP\approx${fmt(a, 1)}$ m.`, { tol: 0.1, unit: 'm' });
            }),
            mcqS('Qual informação NÃO determina um único triângulo?', 'dois lados e um ângulo não compreendido entre eles (LLA)', ['três lados', 'dois lados e o ângulo entre eles', 'dois ângulos e um lado'], 'LLA é o caso ambíguo.'),
          ],
        },
        {
          card: {
            title: 'Lei dos cossenos e áreas',
            body: t`$$a^2=b^2+c^2-2bc\cos A$$
É Pitágoras com correção: se $A=90^\circ$, o termo some. Daí a **natureza** do triângulo pelo maior lado $a$:
• $a^2<b^2+c^2$: acutângulo; • $=$: retângulo; • $>$: obtusângulo.

**Área**: $S=\frac12bc\operatorname{sen}A$; ou **Heron**, só com os lados: $S=\sqrt{p(p-a)(p-b)(p-c)}$, $p$ = semiperímetro.`,
            example: t`Lados 7, 8 e 13: $13^2=169>7^2+8^2=113$ ⇒ obtusângulo. $\cos C=\frac{49+64-169}{112}=-\frac12$, $C=120^\circ$.`,
          },
          exercises: [
            gen((rng) => {
              const b = randInt(rng, 3, 10), c = randInt(rng, 3, 10);
              const A = pick(rng, [60, 120, 90]);
              const a2 = b * b + c * c - 2 * b * c * Math.cos(rad(A));
              return num(t`$b=${b}$, $c=${c}$ e $\hat A=${A}^\circ$. Quanto vale $a^2$?`, a2, t`$a^2=${b * b}+${c * c}-2\cdot${b}\cdot${c}\cos${A}^\circ=${fmt(a2, 2)}$.`, { tol: 0.01 });
            }),
            gen((rng) => {
              const [a, b, c, ang] = pick(rng, [[7, 8, 13, 120], [3, 5, 7, 120], [5, 8, 7, 60], [3, 8, 7, 60]]);
              return num(t`Triângulo de lados $${a}$, $${b}$ e $${c}$. Quanto mede o ângulo oposto ao lado $${c}$?`, ang, t`$\cos\theta=\frac{${a * a}+${b * b}-${c * c}}{2\cdot${a}\cdot${b}}=${fmt((a * a + b * b - c * c) / (2 * a * b), 3)}\Rightarrow\theta=${ang}^\circ$.`, { unit: '°' });
            }),
            gen((rng) => {
              const s = [randInt(rng, 3, 12), randInt(rng, 3, 12), randInt(rng, 3, 12)].sort((x, y) => x - y);
              if (s[2] >= s[0] + s[1]) s[2] = s[0] + s[1] - 1;
              const [a, b, c] = s;
              const kind = c * c < a * a + b * b ? 'acutângulo' : c * c === a * a + b * b ? 'retângulo' : 'obtusângulo';
              return rmcq(rng, `Um triângulo de lados ${a}, ${b} e ${c} é:`, kind, ['acutângulo', 'retângulo', 'obtusângulo'].filter((k) => k !== kind), `Compare ${c}² = ${c * c} com ${a}² + ${b}² = ${a * a + b * b}.`);
            }),
            gen((rng) => {
              const b = randInt(rng, 3, 12), c = randInt(rng, 3, 12);
              const A = pick(rng, [30, 45, 60, 90, 120, 150]);
              return num(t`Área do triângulo com lados $${b}$ e $${c}$ formando $${A}^\circ$ (2 casas).`, 0.5 * b * c * Math.sin(rad(A)), t`$\frac12\cdot${b}\cdot${c}\operatorname{sen}${A}^\circ\approx${fmt(0.5 * b * c * Math.sin(rad(A)), 2)}$.`, { tol: 0.01 });
            }),
            gen((rng) => {
              const [a, b, c] = pick(rng, [[13, 14, 15], [5, 5, 6], [7, 15, 20], [9, 10, 17], [3, 4, 5], [10, 13, 13]]);
              const p = (a + b + c) / 2;
              return num(`Área do triângulo de lados ${a}, ${b} e ${c} (Heron):`, Math.sqrt(p * (p - a) * (p - b) * (p - c)), t`$p=${p}$; $S=\sqrt{${p}\cdot${p - a}\cdot${p - b}\cdot${p - c}}=${fmt(Math.sqrt(p * (p - a) * (p - b) * (p - c)), 2)}$.`, { tol: 0.01 });
            }),
            tf(t`Se $\cos A<0$, o lado $a$ é o maior do triângulo.`, true, t`$A$ obtuso ⇒ $a^2=b^2+c^2+2bc|\cos A|$ é maior que $b^2$ e $c^2$.`),
            gen((rng) => {
              const d1 = randInt(rng, 3, 9), d2 = randInt(rng, 3, 9), ang = pick(rng, [60, 90, 120]);
              const d = Math.sqrt(d1 * d1 + d2 * d2 - 2 * d1 * d2 * Math.cos(rad(ang)));
              return num(`Dois navios partem do mesmo porto em rotas que formam ${ang}°, percorrendo ${d1} km e ${d2} km. Distância entre eles (2 casas)?`, d, t`$d^2=${d1 * d1}+${d2 * d2}-2\cdot${d1}\cdot${d2}\cos${ang}^\circ\Rightarrow d\approx${fmt(d, 2)}$ km.`, { tol: 0.01, unit: 'km' });
            }),
            order('Ordene a resolução de um triângulo dado LAL (b, c e Â).', ['Lei dos cossenos para obter a', 'Lei dos senos (ou cossenos) para obter o menor dos ângulos restantes', 'Terceiro ângulo: 180° menos os outros dois', 'Área, se pedida: ½·b·c·sen A'], 'Comece pela lei dos cossenos; use os senos para o ângulo menor (evita o caso ambíguo).'),
          ],
        },
      ],
    },
    {
      id: 'p-tri-prod',
      title: 'Transformação em produto e arco triplo',
      parts: [
        {
          card: {
            title: 'Prostaférese: soma vira produto',
            body: t`$$\operatorname{sen}p+\operatorname{sen}q=2\operatorname{sen}\tfrac{p+q}{2}\cos\tfrac{p-q}{2}$$
$$\operatorname{sen}p-\operatorname{sen}q=2\operatorname{sen}\tfrac{p-q}{2}\cos\tfrac{p+q}{2}$$
$$\cos p+\cos q=2\cos\tfrac{p+q}{2}\cos\tfrac{p-q}{2}$$
$$\cos p-\cos q=-2\operatorname{sen}\tfrac{p+q}{2}\operatorname{sen}\tfrac{p-q}{2}$$
Somar duas ondas de frequências próximas dá uma onda rápida (média) modulada por um envelope lento (metade da diferença): o **batimento**.`,
            visual: beatLab(),
          },
          exercises: [
            mcqS(t`$\operatorname{sen}75^\circ+\operatorname{sen}15^\circ$ é igual a:`, t`$2\operatorname{sen}45^\circ\cos30^\circ=\frac{\sqrt6}{2}$`, [t`$\operatorname{sen}90^\circ=1$`, t`$2\operatorname{sen}30^\circ\cos45^\circ$`, t`$\frac{\sqrt3}{2}$`], t`$\frac{p+q}{2}=45^\circ$, $\frac{p-q}{2}=30^\circ$: $2\cdot\frac{\sqrt2}2\cdot\frac{\sqrt3}2=\frac{\sqrt6}2$.`),
            gen((rng) => {
              const [p, q] = pick(rng, [[75, 15], [105, 15], [80, 40], [70, 50], [100, 20]]);
              const v = Math.cos(rad(p)) + Math.cos(rad(q));
              return num(t`Calcule $\cos${p}^\circ+\cos${q}^\circ$ via prostaférese (3 casas).`, v, t`$2\cos${(p + q) / 2}^\circ\cos${(p - q) / 2}^\circ\approx${fmt(v, 3)}$.`, { tol: 0.002 });
            }),
            inter('Ajuste as frequências para que o envelope (amarelo) fique bem lento: |ω₁ − ω₂| ≤ 0,2.', 'plot', beatLab().props, (v) => Math.abs(v.p.w1 - v.p.w2) <= 0.2 + 1e-9 && Math.abs(v.p.w1 - v.p.w2) > 0, 'ω₁ e ω₂ quase iguais (mas diferentes)', 'Frequência do envelope = |ω₁ − ω₂|/2: quanto mais próximas, mais lento o batimento (é assim que se afina um violão).'),
            gen((rng) => {
              const f1 = randInt(rng, 430, 450), d = randInt(rng, 1, 6);
              return num(`Dois diapasões de ${f1} Hz e ${f1 + d} Hz soam juntos. Quantos batimentos por segundo se ouvem?`, d, 'A intensidade pulsa |f₁ − f₂| vezes por segundo (o envelope tem dois máximos por período).', { unit: 'Hz' });
            }),
            match('Associe a soma/diferença ao produto.', [[t`$\operatorname{sen}p+\operatorname{sen}q$`, t`$2\operatorname{sen}\frac{p+q}2\cos\frac{p-q}2$`], [t`$\cos p+\cos q$`, t`$2\cos\frac{p+q}2\cos\frac{p-q}2$`], [t`$\cos p-\cos q$`, t`$-2\operatorname{sen}\frac{p+q}2\operatorname{sen}\frac{p-q}2$`], [t`$\operatorname{sen}p-\operatorname{sen}q$`, t`$2\operatorname{sen}\frac{p-q}2\cos\frac{p+q}2$`]], 'Atenção ao sinal de menos em cos p − cos q.'),
            mcqS(t`Simplifique $\dfrac{\operatorname{sen}5x+\operatorname{sen}3x}{\cos5x+\cos3x}$.`, t`$\operatorname{tg}4x$`, [t`$\operatorname{tg}x$`, t`$\operatorname{tg}8x$`, t`$\cot4x$`], t`Numerador $2\operatorname{sen}4x\cos x$, denominador $2\cos4x\cos x$.`),
            gen((rng) => {
              const k = randInt(rng, 2, 6);
              return rmcq(rng, t`Soluções de $\operatorname{sen}${k + 1}x+\operatorname{sen}${k - 1}x=0$ incluem as de:`, t`$\operatorname{sen}${k}x=0$ ou $\cos x=0$`, [t`$\operatorname{sen}${2 * k}x=0$ apenas`, t`$\cos${k}x=0$ ou $\operatorname{sen}x=0$`, t`$\operatorname{sen}x=0$ apenas`], t`$2\operatorname{sen}${k}x\cos x=0$.`);
            }),
            tf(t`$\operatorname{sen}a\cos b=\frac12[\operatorname{sen}(a+b)+\operatorname{sen}(a-b)]$.`, true, 'É a prostaférese lida ao contrário (produto em soma) — muito usada para integrar.'),
          ],
        },
        {
          card: {
            title: 'Arco triplo e arco metade',
            body: t`$$\operatorname{sen}3x=3\operatorname{sen}x-4\operatorname{sen}^3x\qquad\cos3x=4\cos^3x-3\cos x$$
(saem de $\operatorname{sen}(2x+x)$ e $\cos(2x+x)$). Arco metade:
$$\cos^2\tfrac x2=\frac{1+\cos x}{2}\qquad\operatorname{sen}^2\tfrac x2=\frac{1-\cos x}{2}\qquad\operatorname{tg}\tfrac x2=\frac{\operatorname{sen}x}{1+\cos x}$$
O sinal da raiz depende do quadrante de $\frac x2$.`,
          },
          exercises: [
            gen((rng) => {
              const s = pick(rng, [0.2, 0.3, 0.5, 0.6]);
              return num(t`Se $\operatorname{sen}x=${fmt(s)}$, quanto vale $\operatorname{sen}3x$ (3 casas)?`, 3 * s - 4 * s ** 3, t`$3\cdot${fmt(s)}-4\cdot${fmt(s)}^3=${fmt(3 * s - 4 * s ** 3, 3)}$.`, { tol: 0.002 });
            }),
            gen((rng) => {
              const c = pick(rng, [0.2, 0.5, 0.6, 0.8]);
              return num(t`Se $\cos x=${fmt(c)}$, quanto vale $\cos3x$ (3 casas)?`, 4 * c ** 3 - 3 * c, t`$4\cdot${fmt(c)}^3-3\cdot${fmt(c)}=${fmt(4 * c ** 3 - 3 * c, 3)}$.`, { tol: 0.002 });
            }),
            gen((rng) => {
              const c = pick(rng, [0.28, 0.5, 0.6, -0.5, 0.8]);
              return num(t`$0<x<\pi$ e $\cos x=${fmt(c)}$. Quanto vale $\cos\frac x2$ (3 casas)?`, Math.sqrt((1 + c) / 2), t`$\frac x2$ está no 1º quadrante: $\sqrt{\frac{1+${fmt(c)}}{2}}\approx${fmt(Math.sqrt((1 + c) / 2), 3)}$.`, { tol: 0.002 });
            }),
            mcqS(t`$\cos15^\circ$ por arco metade:`, t`$\sqrt{\frac{2+\sqrt3}{4}}=\frac{\sqrt{2+\sqrt3}}{2}$`, [t`$\frac{\sqrt3}{4}$`, t`$\frac12\cos30^\circ$`, t`$\sqrt{\frac{1-\sqrt3/2}{2}}$`], t`$\cos^215^\circ=\frac{1+\cos30^\circ}{2}=\frac{2+\sqrt3}{4}$.`),
            tf(t`$\operatorname{sen}3x=3\operatorname{sen}x$ para todo $x$.`, false, t`Falta $-4\operatorname{sen}^3x$. Ex.: $x=90^\circ$: $\operatorname{sen}270^\circ=-1\ne3$.`),
            gen((rng) => {
              const x = pick(rng, [60, 90, 120]);
              return num(t`Use $\operatorname{tg}\frac x2=\frac{\operatorname{sen}x}{1+\cos x}$ para $x=${x}^\circ$ (3 casas).`, Math.tan(rad(x / 2)), t`$\frac{\operatorname{sen}${x}^\circ}{1+\cos${x}^\circ}=\operatorname{tg}${x / 2}^\circ\approx${fmt(Math.tan(rad(x / 2)), 3)}$.`, { tol: 0.002 });
            }),
            order(t`Ordene a dedução de $\cos3x$.`, [t`$\cos3x=\cos(2x+x)$`, t`$=\cos2x\cos x-\operatorname{sen}2x\operatorname{sen}x$`, t`$=(2\cos^2x-1)\cos x-2\operatorname{sen}^2x\cos x$`, t`Troque $\operatorname{sen}^2x=1-\cos^2x$: $4\cos^3x-3\cos x$`], 'Soma de arcos + arco duplo + relação fundamental.'),
            multi(t`Quais expressões valem $\operatorname{sen}^2x$?`, [t`$\frac{1-\cos2x}{2}$`, t`$1-\cos^2x$`, t`$\frac{1+\cos2x}{2}$`, t`$\operatorname{sen}x\cdot\operatorname{sen}x$`], [0, 1, 3], t`$\frac{1+\cos2x}{2}$ é $\cos^2x$.`),
          ],
        },
      ],
    },
    {
      id: 'p-tri-ineq',
      title: 'Inequações e equações trigonométricas gerais',
      parts: [
        {
          card: {
            title: 'Resolvendo no ciclo',
            body: t`Para $\operatorname{sen}x>k$: trace a reta horizontal $y=k$; a solução é o arco **acima** dela. Para $\cos x>k$: reta vertical $x=k$, arco à **direita**. Depois some $2k\pi$ (o período).

Exemplo: $\operatorname{sen}x>\frac12$ em $[0,\,2\pi)$: $\frac\pi6<x<\frac{5\pi}6$. Em $\mathbb R$: $\frac\pi6+2k\pi<x<\frac{5\pi}6+2k\pi$.`,
            visual: ineqCircleLab(),
            tip: 'Com mudança de variável (y = sen x), resolva a inequação em y e depois volte ao ciclo, lembrando que −1 ≤ y ≤ 1.',
          },
          exercises: [
            mcqS(t`Solução de $\cos x\ge\frac12$ em $[0,\,2\pi)$:`, t`$\left[0,\,\frac\pi3\right]\cup\left[\frac{5\pi}3,\,2\pi\right)$`, [t`$\left[\frac\pi3,\,\frac{5\pi}3\right]$`, t`$\left[\frac\pi6,\,\frac{5\pi}6\right]$`, t`$\left[0,\,\frac\pi3\right]$`], 'Arco à direita da reta x = 1/2.'),
            inter(t`Ajuste o lab para mostrar $\operatorname{sen}x>-\frac12$ e observe o arco grande.`, 'plot', ineqCircleLab().props, (v) => Math.round(v.p.f) === 0 && near(v.p.k, -0.5, 0.01), 'sen x > k com k = −0,5', t`Solução: $[0,\,\frac{7\pi}6)\cup(\frac{11\pi}6,\,2\pi)$.`),
            gen((rng) => {
              const [k, a] = pick(rng, [[t`\frac12`, 30], [t`\frac{\sqrt2}2`, 45], [t`\frac{\sqrt3}2`, 60]] as [string, number][]);
              return num(t`Qual a medida (em graus) do arco solução de $\operatorname{sen}x>${k}$ em $[0^\circ,\,360^\circ)$?`, 180 - 2 * a, t`De $${a}^\circ$ a $${180 - a}^\circ$: $${180 - 2 * a}^\circ$.`, { unit: '°' });
            }),
            mcqS(t`Solução de $\operatorname{tg}x\ge1$ em $\left(-\frac\pi2,\,\frac\pi2\right)$:`, t`$\frac\pi4\le x<\frac\pi2$`, [t`$x\ge\frac\pi4$`, t`$-\frac\pi2<x\le\frac\pi4$`, t`$\frac\pi4\le x\le\frac\pi2$`], t`A tangente é crescente nesse intervalo e vale 1 em $\frac\pi4$; $\frac\pi2$ fica de fora (assíntota).`),
            mcqS(t`Resolva $2\operatorname{sen}^2x-\operatorname{sen}x-1<0$ em $[0,\,2\pi)$.`, t`todo $x$ exceto $\frac\pi2$, $\frac{7\pi}6$ e $\frac{11\pi}6$, com $\operatorname{sen}x>-\frac12$`, [t`$\operatorname{sen}x<1$ apenas`, t`$\frac{7\pi}6<x<\frac{11\pi}6$`, t`$\varnothing$`], t`$y=\operatorname{sen}x$: $(2y+1)(y-1)<0\Rightarrow-\frac12<y<1$. Ou seja, $x\in[0,\,\frac{7\pi}6)\cup(\frac{11\pi}6,\,2\pi)$ sem $\frac\pi2$.`),
            tf(t`A inequação $\operatorname{sen}x>1$ não tem solução real.`, true, t`$\operatorname{sen}x\le1$ sempre.`),
            gen((rng) => {
              const a = pick(rng, [30, 45, 60]);
              return num(t`Quantas soluções tem $\cos x=\cos${a}^\circ$ em $[0^\circ,\,720^\circ)$?`, 4, t`Em cada volta: $${a}^\circ$ e $${360 - a}^\circ$. Duas voltas: 4 soluções.`);
            }),
            match('Associe a equação à solução geral.', [[t`$\operatorname{sen}x=\operatorname{sen}\alpha$`, t`$x=\alpha+2k\pi$ ou $x=\pi-\alpha+2k\pi$`], [t`$\cos x=\cos\alpha$`, t`$x=\pm\alpha+2k\pi$`], [t`$\operatorname{tg}x=\operatorname{tg}\alpha$`, t`$x=\alpha+k\pi$`]], 'Seno: simetria em relação ao eixo y; cosseno: ao eixo x; tangente tem período π.'),
          ],
        },
        {
          card: {
            title: 'a sen x + b cos x = c: o ângulo auxiliar',
            body: t`Toda combinação $a\operatorname{sen}x+b\cos x$ é uma única senoide:
$$a\operatorname{sen}x+b\cos x=R\operatorname{sen}(x+\varphi),\quad R=\sqrt{a^2+b^2},\ \operatorname{tg}\varphi=\frac ba$$
Daí: o **máximo** é $R$, o mínimo $-R$, e a equação $a\operatorname{sen}x+b\cos x=c$ só tem solução se $|c|\le R$.`,
            example: t`$\operatorname{sen}x+\sqrt3\cos x=2\operatorname{sen}(x+60^\circ)$. Equação $=1$: $\operatorname{sen}(x+60^\circ)=\frac12$ ⇒ $x=-30^\circ$ ou $x=90^\circ$ (mais $360^\circ k$).`,
          },
          exercises: [
            gen((rng) => {
              const [a, b] = pick(rng, [[3, 4], [5, 12], [1, 1], [6, 8], [8, 15]]);
              return num(t`Valor máximo de $${a}\operatorname{sen}x+${b}\cos x$ (2 casas).`, Math.hypot(a, b), t`$R=\sqrt{${a * a}+${b * b}}=${fmt(Math.hypot(a, b), 2)}$.`, { tol: 0.01 });
            }),
            gen((rng) => {
              const [a, b] = pick(rng, [[3, 4], [5, 12], [6, 8]]);
              const R = Math.hypot(a, b);
              const c = randInt(rng, 1, Math.round(R) + 4);
              return tf(t`A equação $${a}\operatorname{sen}x+${b}\cos x=${c}$ tem solução real.`, c <= R, t`Só há solução se $|c|\le R=${R}$.`);
            }),
            mcqS(t`$\operatorname{sen}x+\cos x$ é igual a:`, t`$\sqrt2\operatorname{sen}\left(x+\frac\pi4\right)$`, [t`$2\operatorname{sen}\left(x+\frac\pi4\right)$`, t`$\operatorname{sen}2x$`, t`$\sqrt2\cos x$`], t`$R=\sqrt2$, $\operatorname{tg}\varphi=1\Rightarrow\varphi=\frac\pi4$.`),
            gen((rng) => {
              const [a, b] = pick(rng, [[1, 1], [1, Math.sqrt(3)], [Math.sqrt(3), 1]]);
              const phi = deg(Math.atan2(b, a));
              return num(t`Em $${a === 1 ? '' : t`\sqrt3`}\operatorname{sen}x+${b === 1 ? '' : t`\sqrt3`}\cos x=R\operatorname{sen}(x+\varphi)$, quanto vale $\varphi$ em graus?`, phi, t`$\operatorname{tg}\varphi=\frac ba$ ⇒ $\varphi=${fmt(phi, 0)}^\circ$.`, { tol: 0.5, unit: '°' });
            }),
            tf('Uma tensão v(t) = 3 sen ωt + 4 cos ωt tem amplitude 7.', false, 'Amplitude = √(3² + 4²) = 5, não 3 + 4.'),
            gen((rng) => {
              const [a, b] = pick(rng, [[3, 4], [5, 12], [8, 6]]);
              return num(t`Valor mínimo de $${a}\operatorname{sen}x-${b}\cos x+10$.`, 10 - Math.hypot(a, b), t`$a\operatorname{sen}x-b\cos x$ varia entre $\pm${Math.hypot(a, b)}$: mínimo $10-${Math.hypot(a, b)}$.`);
            }),
            order(t`Ordene a resolução de $\operatorname{sen}x+\sqrt3\cos x=1$.`, [t`$R=\sqrt{1+3}=2$`, t`Escreva $2\operatorname{sen}(x+60^\circ)=1$`, t`$\operatorname{sen}(x+60^\circ)=\frac12$`, t`$x+60^\circ=30^\circ$ ou $150^\circ$ (+ $360^\circ k$)`, t`$x=-30^\circ+360^\circ k$ ou $x=90^\circ+360^\circ k$`], 'Ângulo auxiliar transforma em uma equação elementar.'),
            mcqS('Somar duas ondas de MESMA frequência e fases diferentes resulta em:', 'outra senoide da mesma frequência', ['uma onda de frequência dobrada', 'um batimento', 'uma onda quadrada'], 'a sen x + b cos x = R sen(x + φ): só muda amplitude e fase.'),
          ],
        },
      ],
    },
  ],
};

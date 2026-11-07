import React from 'react';
import type { UnitDef, VisualSpec } from '../../types';
import { gen, mcq, mcqS, num, tf, fill, match, order, inter, rmcq, near, multi } from '../../helpers';
import { Axes3, Line3, Point3, Poly3, type V3 } from '../../../components/visuals/Space3D';
import { C } from '../../../theme';
import { fmt, pick, randInt, randNZ, term } from '../../../lib/random';

const t = String.raw;
type Spec = VisualSpec & { props: Record<string, any> };
const V = (a: number[]) => t`(${a[0]},\,${a[1]},\,${a[2]})`;

/** Wireframe of a parametric surface r(u, v). */
function wire(r: (u: number, v: number) => V3 | null, u0: number, u1: number, v0: number, v1: number, nu: number, nv: number, color: string, key: string) {
  const out: React.ReactNode[] = [];
  const steps = 24;
  for (let i = 0; i <= nu; i++) {
    const u = u0 + ((u1 - u0) * i) / nu;
    let prev: V3 | null = null;
    for (let j = 0; j <= steps; j++) {
      const p = r(u, v0 + ((v1 - v0) * j) / steps);
      if (p && prev) out.push(<Line3 key={`${key}u${i}-${j}`} a={prev} b={p} color={color} width={1} />);
      prev = p;
    }
  }
  for (let j = 0; j <= nv; j++) {
    const v = v0 + ((v1 - v0) * j) / nv;
    let prev: V3 | null = null;
    for (let i = 0; i <= steps; i++) {
      const p = r(u0 + ((u1 - u0) * i) / steps, v);
      if (p && prev) out.push(<Line3 key={`${key}v${j}-${i}`} a={prev} b={p} color={color} width={1} />);
      prev = p;
    }
  }
  return out;
}

/** Closed or open polyline in 3D. */
function curve3(pts: V3[], color: string, key: string, width = 3) {
  return pts.slice(1).map((p, i) => <Line3 key={key + i} a={pts[i]} b={p} color={color} width={width} />);
}

const circleAt = (r: number, z: number, n = 40): V3[] => Array.from({ length: n + 1 }, (_, i) => [r * Math.cos((2 * Math.PI * i) / n), r * Math.sin((2 * Math.PI * i) / n), z] as V3);

/** Point (x, y, z) with its "box" of projections. */
const pointLab = (): Spec => ({
  name: 'space3d',
  props: {
    scale: 30,
    params: [
      { key: 'x', label: 'x', min: -3, max: 3, step: 0.5, value: 2, color: '#FF6B6B' },
      { key: 'y', label: 'y', min: -3, max: 3, step: 0.5, value: 1.5, color: '#51CF66' },
      { key: 'z', label: 'z', min: -3, max: 3, step: 0.5, value: 2.5, color: '#4DABF7' },
    ],
    render: ({ p }: any) => {
      const P: V3 = [p.x, p.y, p.z];
      return (
        <>
          <Axes3 size={3.5} />
          <Line3 a={[p.x, 0, 0]} b={[p.x, p.y, 0]} color={C.textMuted} dash="4 4" />
          <Line3 a={[0, p.y, 0]} b={[p.x, p.y, 0]} color={C.textMuted} dash="4 4" />
          <Line3 a={[p.x, p.y, 0]} b={P} color={C.textMuted} dash="4 4" />
          <Point3 at={[p.x, p.y, 0]} color={C.textMuted} r={3} />
          <Point3 at={P} color={C.gold} r={6} label="P" />
        </>
      );
    },
    info: ({ p }: any) => {
      const oct = p.x === 0 || p.y === 0 || p.z === 0 ? 'sobre um plano coordenado' : `octante (${p.x > 0 ? '+' : '−'}, ${p.y > 0 ? '+' : '−'}, ${p.z > 0 ? '+' : '−'})`;
      return t`$P=(${fmt(p.x)},\,${fmt(p.y)},\,${fmt(p.z)})$ · ${oct} · $|OP|=${fmt(Math.hypot(p.x, p.y, p.z), 2)}$`;
    },
  },
});

/** Sphere of radius R with draggable centre (sliders). */
const sphereLab = (): Spec => ({
  name: 'space3d',
  props: {
    scale: 26,
    params: [
      { key: 'cx', label: 'x_0', min: -2, max: 2, step: 0.5, value: 1, color: '#FF6B6B' },
      { key: 'cz', label: 'z_0', min: -2, max: 2, step: 0.5, value: 0.5, color: '#4DABF7' },
      { key: 'R', label: 'R', min: 0.5, max: 2.5, step: 0.25, value: 1.5, color: C.gold },
    ],
    render: ({ p }: any) => (
      <>
        <Axes3 size={3.8} />
        {wire((u, v) => [p.cx + p.R * Math.sin(u) * Math.cos(v), p.R * Math.sin(u) * Math.sin(v), p.cz + p.R * Math.cos(u)], 0.2, Math.PI - 0.2, 0, 2 * Math.PI, 6, 10, C.p2, 's')}
        <Point3 at={[p.cx, 0, p.cz]} color={C.gold} r={5} label="C" />
      </>
    ),
    info: ({ p }: any) => t`$(x${term(-p.cx, '')})^2+y^2+(z${term(-p.cz, '')})^2=${fmt(p.R * p.R, 4)}$`,
  },
});

const CYL = [
  { name: 'x^2+y^2=4', surf: (u: number, v: number): V3 => [2 * Math.cos(u), 2 * Math.sin(u), v], u: [0, 2 * Math.PI], v: [-2, 2], trace: (k: number) => [circleAt(2, k)], tdesc: (k: number) => t`traço em $z=${fmt(k, 1)}$: circunferência $x^2+y^2=4$` },
  { name: 'z=y^2', surf: (u: number, v: number): V3 => [u, v, v * v], u: [-2, 2], v: [-1.6, 1.6], trace: (k: number) => (k < 0 ? [] : [[[-2, Math.sqrt(k), k], [2, Math.sqrt(k), k]] as V3[], [[-2, -Math.sqrt(k), k], [2, -Math.sqrt(k), k]] as V3[]]), tdesc: (k: number) => (k < 0 ? t`$z=${fmt(k, 1)}<0$: traço vazio` : t`traço em $z=${fmt(k, 1)}$: duas retas $y=\pm${fmt(Math.sqrt(k), 2)}$`) },
  { name: 'y^2+z^2=1', surf: (u: number, v: number): V3 => [v, Math.cos(u), Math.sin(u)], u: [0, 2 * Math.PI], v: [-2.5, 2.5], trace: (k: number) => (Math.abs(k) > 1 ? [] : [[[-2.5, Math.sqrt(1 - k * k), k], [2.5, Math.sqrt(1 - k * k), k]] as V3[], [[-2.5, -Math.sqrt(1 - k * k), k], [2.5, -Math.sqrt(1 - k * k), k]] as V3[]]), tdesc: (k: number) => (Math.abs(k) > 1 ? t`$|z|>1$: traço vazio` : t`traço em $z=${fmt(k, 1)}$: duas retas paralelas ao eixo $x$`) },
];

/** Cylindrical surfaces with a horizontal cutting plane z = k. */
const cylinderLab = (c0 = 0): Spec => ({
  name: 'space3d',
  props: {
    scale: 30,
    params: [
      { key: 'c', label: 'sup.', min: 0, max: 2, step: 1, value: c0, color: C.p2, format: (v: number) => String(Math.round(v) + 1) },
      { key: 'k', label: 'z=k', min: -2, max: 2.5, step: 0.1, value: 1, color: C.gold },
    ],
    render: ({ p }: any) => {
      const S = CYL[Math.round(p.c)];
      const pl: V3[] = [[-2.6, -2.6, p.k], [2.6, -2.6, p.k], [2.6, 2.6, p.k], [-2.6, 2.6, p.k]];
      return (
        <>
          <Axes3 size={3} />
          {wire(S.surf, S.u[0], S.u[1], S.v[0], S.v[1], 12, 6, C.p1, 'c')}
          <Poly3 pts={pl} color={C.gold} opacity={0.12} />
          {S.trace(p.k).map((pts, i) => curve3(pts, C.gold, 'tr' + i))}
        </>
      );
    },
    info: ({ p }: any) => {
      const S = CYL[Math.round(p.c)];
      return t`$${S.name}$ · ${S.tdesc(p.k)}`;
    },
  },
});

type Q = { name: string; eq: string; surf: (u: number, v: number) => V3 | null; u: [number, number]; v: [number, number]; trace: (k: number) => V3[][]; tdesc: (k: number) => string; second?: (u: number, v: number) => V3 | null };
const ch = Math.cosh;
const sh = Math.sinh;
const QUADS: Q[] = [
  { name: 'elipsoide', eq: '\\frac{x^2}{4}+\\frac{y^2}{2{,}25}+z^2=1', surf: (u, v) => [2 * Math.sin(u) * Math.cos(v), 1.5 * Math.sin(u) * Math.sin(v), Math.cos(u)], u: [0.15, Math.PI - 0.15], v: [0, 2 * Math.PI], trace: (k) => (Math.abs(k) >= 1 ? [] : [Array.from({ length: 41 }, (_, i) => { const a = (2 * Math.PI * i) / 40; const s = Math.sqrt(1 - k * k); return [2 * s * Math.cos(a), 1.5 * s * Math.sin(a), k] as V3; })]), tdesc: (k) => (Math.abs(k) >= 1 ? 'traço vazio (ou um ponto)' : 'traço: **elipse**') },
  { name: 'paraboloide elíptico', eq: 'z=\\frac{x^2+y^2}{2}', surf: (u, v) => [u * Math.cos(v), u * Math.sin(v), (u * u) / 2], u: [0, 2], v: [0, 2 * Math.PI], trace: (k) => (k <= 0 ? [] : [circleAt(Math.sqrt(2 * k), k)]), tdesc: (k) => (k < 0 ? 'traço vazio' : k === 0 ? 'traço: um ponto' : 'traço: **circunferência**') },
  { name: 'paraboloide hiperbólico (sela)', eq: 'z=\\frac{x^2-y^2}{2}', surf: (u, v) => [u, v, (u * u - v * v) / 2], u: [-2, 2], v: [-2, 2], trace: (k) => { if (Math.abs(k) < 0.05) return [[[-2, -2, k], [2, 2, k]], [[-2, 2, k], [2, -2, k]]]; const a = Math.sqrt(2 * Math.abs(k)); const br = (sgn: number) => Array.from({ length: 21 }, (_, i) => { const s = -1.1 + (2.2 * i) / 20; return (k > 0 ? [sgn * a * ch(s), a * sh(s), k] : [a * sh(s), sgn * a * ch(s), k]) as V3; }).filter((q) => Math.abs(q[0]) <= 2.2 && Math.abs(q[1]) <= 2.2); return [br(1), br(-1)]; }, tdesc: (k) => (Math.abs(k) < 0.05 ? 'traço em $z=0$: duas retas' : 'traço: **hipérbole**') },
  { name: 'hiperboloide de uma folha', eq: 'x^2+y^2-z^2=1', surf: (u, v) => [ch(u) * Math.cos(v), ch(u) * Math.sin(v), sh(u)], u: [-1.3, 1.3], v: [0, 2 * Math.PI], trace: (k) => [circleAt(Math.sqrt(1 + k * k), k)], tdesc: () => 'traço: **circunferência** (sempre existe)' },
  { name: 'hiperboloide de duas folhas', eq: 'z^2-x^2-y^2=1', surf: (u, v) => [sh(u) * Math.cos(v), sh(u) * Math.sin(v), ch(u)], second: (u, v) => [sh(u) * Math.cos(v), sh(u) * Math.sin(v), -ch(u)], u: [0, 1.4], v: [0, 2 * Math.PI], trace: (k) => (Math.abs(k) <= 1 ? [] : [circleAt(Math.sqrt(k * k - 1), k)]), tdesc: (k) => (Math.abs(k) < 1 ? 'traço vazio entre as folhas' : 'traço: **circunferência**') },
  { name: 'cone', eq: 'z^2=x^2+y^2', surf: (u, v) => [u * Math.cos(v), u * Math.sin(v), u], u: [-2, 2], v: [0, 2 * Math.PI], trace: (k) => (Math.abs(k) < 0.02 ? [] : [circleAt(Math.abs(k), k)]), tdesc: (k) => (Math.abs(k) < 0.02 ? 'traço: o vértice (um ponto)' : 'traço: **circunferência**') },
];

/** Quadric gallery with a horizontal trace plane. */
const quadricLab = (q0 = 0): Spec => ({
  name: 'space3d',
  props: {
    scale: 30,
    params: [
      { key: 'q', label: 'tipo', min: 0, max: 5, step: 1, value: q0, color: C.p2, format: (v: number) => String(Math.round(v) + 1) },
      { key: 'k', label: 'z=k', min: -2, max: 2, step: 0.1, value: 0.5, color: C.gold },
    ],
    render: ({ p }: any) => {
      const Q = QUADS[Math.round(p.q)];
      return (
        <>
          <Axes3 size={2.8} />
          {wire(Q.surf, Q.u[0], Q.u[1], Q.v[0], Q.v[1], 8, 12, C.p1, 'a')}
          {Q.second ? wire(Q.second, Q.u[0], Q.u[1], Q.v[0], Q.v[1], 8, 12, C.p1, 'b') : null}
          {Q.trace(p.k).map((pts, i) => curve3(pts, C.gold, 't' + i))}
        </>
      );
    },
    info: ({ p }: any) => {
      const Q = QUADS[Math.round(p.q)];
      return t`**${Q.name}**: $${Q.eq}$ · em $z=${fmt(p.k, 1)}$, ${Q.tdesc(Math.round(p.k * 10) / 10)}`;
    },
  },
});

export const superficies: UnitDef = {
  id: 'g-sup',
  title: 'Superfícies no espaço',
  subtitle: 'ℝ³, esferas, cilindros e quádricas',
  icon: '🥚',
  source: 'Cálculo 3 · Geometria no espaço',
  guide: t`No espaço, uma equação em $x,\,y,\,z$ descreve uma **superfície**. Esferas saem de completar quadrados; quando falta uma variável temos um **cilindro**; equações do 2º grau dão as **quádricas** (elipsoide, paraboloides, hiperboloides, cone). A ferramenta para reconhecê-las são os **traços**: as curvas que aparecem quando cortamos a superfície por planos.`,
  lessons: [
    {
      id: 'g-sup-r3',
      title: 'O espaço ℝ³ e a esfera',
      parts: [
        {
          card: {
            title: 'Três coordenadas',
            body: t`Um ponto no espaço é $P=(x,\,y,\,z)$. Os três **planos coordenados** ($xy$: $z=0$; $xz$: $y=0$; $yz$: $x=0$) dividem o espaço em **8 octantes**. A projeção de $P$ no plano $xy$ é $(x,\,y,\,0)$.

Mova os sliders e gire a cena com o dedo:`,
            visual: pointLab(),
            tip: t`Use a "regra da mão direita": $x$ no indicador, $y$ no médio, $z$ no polegar.`,
          },
          exercises: [
            mcq(t`Em qual plano coordenado está o ponto $(3,\,0,\,-2)$?`, ['plano $xz$', 'plano $xy$', 'plano $yz$', 'em nenhum'], 0, t`$y=0$ é o plano $xz$.`),
            gen((rng) => {
              const P = [randNZ(rng, -5, 5), randNZ(rng, -5, 5), randNZ(rng, -5, 5)];
              return rmcq(rng, t`Qual a projeção de $P=${V(P)}$ no plano $xy$?`, `$${V([P[0], P[1], 0])}$`, [`$${V([P[0], 0, P[2]])}$`, `$${V([0, P[1], P[2]])}$`, `$${V([P[0], P[1], -P[2]])}$`], t`Zere a coordenada $z$.`);
            }),
            num(t`Quantos octantes o espaço tem?`, 8, t`$2^3$ combinações de sinais.`),
            tf(t`O ponto $(1,\,-2,\,3)$ está no mesmo octante que $(5,\,-1,\,2)$.`, true, t`Sinais $(+,\,-,\,+)$ nos dois.`),
            inter(t`Posicione o ponto $P=(-2,\,1,\,3)$.`, 'space3d', pointLab().props, (v: any) => v && near(v.p.x, -2, 0.01) && near(v.p.y, 1, 0.01) && near(v.p.z, 3, 0.01), t`$x=-2$, $y=1$, $z=3$.`),
            gen((rng) => {
              const P = [randInt(rng, -4, 4), randInt(rng, -4, 4), randNZ(rng, -5, 5)];
              return num(t`Qual a distância do ponto $${V(P)}$ ao plano $xy$?`, Math.abs(P[2]), t`É $|z|=${Math.abs(P[2])}$.`);
            }),
            mcqS(t`O ponto simétrico de $(2,\,3,\,4)$ em relação ao plano $xy$ é:`, t`$(2,\,3,\,-4)$`, [t`$(-2,\,-3,\,4)$`, t`$(-2,\,-3,\,-4)$`, t`$(2,\,-3,\,4)$`, t`$(4,\,3,\,2)$`], t`Reflexão em $z=0$ troca o sinal de $z$.`),
            gen((rng) => {
              const P = [randNZ(rng, -4, 4), randNZ(rng, -4, 4), randInt(rng, -4, 4)];
              return num(t`Qual a distância do ponto $${V(P)}$ ao eixo $z$? (2 casas)`, Math.hypot(P[0], P[1]), t`$\sqrt{x^2+y^2}=\sqrt{${P[0] ** 2 + P[1] ** 2}}\approx${fmt(Math.hypot(P[0], P[1]), 2)}$.`, { tol: 0.01 });
            }),
          ],
        },
        {
          card: {
            title: 'Distância e esfera',
            body: t`$$d(P,Q)=\sqrt{(x_2-x_1)^2+(y_2-y_1)^2+(z_2-z_1)^2}$$

A **esfera** de centro $C=(x_0,\,y_0,\,z_0)$ e raio $R$ é o conjunto dos pontos a distância $R$ de $C$:

$$(x-x_0)^2+(y-y_0)^2+(z-z_0)^2=R^2$$

Na forma expandida, **complete quadrados** para achar centro e raio.`,
            visual: sphereLab(),
            example: t`$x^2+y^2+z^2-4x+6z=3$: $(x-2)^2+y^2+(z+3)^2=3+4+9=16$ ⟹ centro $(2,\,0,\,-3)$, raio $4$.`,
          },
          exercises: [
            gen((rng) => {
              const [a, b, c, d] = pick(rng, [[1, 2, 2, 3], [2, 3, 6, 7], [1, 4, 8, 9], [2, 6, 9, 11], [4, 4, 7, 9]] as const);
              const P = [randInt(rng, -3, 3), randInt(rng, -3, 3), randInt(rng, -3, 3)];
              const Q = [P[0] + a, P[1] - b, P[2] + c];
              return num(t`Distância entre $${V(P)}$ e $${V(Q)}$:`, d, t`$\sqrt{${a * a}+${b * b}+${c * c}}=\sqrt{${d * d}}=${d}$.`);
            }),
            gen((rng) => {
              const C0 = [randInt(rng, -4, 4), randInt(rng, -4, 4), randInt(rng, -4, 4)];
              const R = randInt(rng, 1, 6);
              const eq = `(x${term(-C0[0], '')})^2+(y${term(-C0[1], '')})^2+(z${term(-C0[2], '')})^2=${R * R}`.replace(/\(x\)/g, 'x').replace(/\(y\)\^2/g, 'y^2').replace(/\(z\)\^2/g, 'z^2');
              return rmcq(rng, t`Centro da esfera $${eq}$:`, `$${V(C0)}$`, [`$${V(C0.map((c) => -c))}$`, `$${V([C0[0], C0[1], R])}$`, `$${V([C0[1], C0[0], C0[2]])}$`, `$${V([C0[0] + 1, C0[1], C0[2]])}$`], t`Leia com o sinal trocado: $(x-x_0)$.`);
            }),
            num(t`Qual o raio da esfera $x^2+y^2+z^2-4x+6z=3$?`, 4, t`Completando: $(x-2)^2+y^2+(z+3)^2=16$.`),
            gen((rng) => {
              const C0 = [randInt(rng, -3, 3), randInt(rng, -3, 3), randInt(rng, -3, 3)];
              const R = randInt(rng, 1, 5);
              const k = R * R - C0[0] ** 2 - C0[1] ** 2 - C0[2] ** 2;
              const lin = `${term(-2 * C0[0], 'x')}${term(-2 * C0[1], 'y')}${term(-2 * C0[2], 'z')}`;
              return num(t`Qual o raio da esfera $x^2+y^2+z^2${lin}=${k}$?`, R, t`Completando quadrados: centro $${V(C0)}$ e $R^2=${k}+${C0[0] ** 2 + C0[1] ** 2 + C0[2] ** 2}=${R * R}$.`);
            }),
            inter(t`Ajuste o lab para a esfera de centro $(-1,\,0,\,1)$ e raio $2$.`, 'space3d', sphereLab().props, (v: any) => v && near(v.p.cx, -1, 0.01) && near(v.p.cz, 1, 0.01) && near(v.p.R, 2, 0.01), t`$x_0=-1$, $z_0=1$, $R=2$.`),
            tf(t`$x^2+y^2+z^2+2x+5=0$ representa uma esfera.`, false, t`$(x+1)^2+y^2+z^2=-4<0$: nenhum ponto satisfaz.`),
            mcqS(t`A esfera de centro $(1,\,2,\,3)$ que tangencia o plano $xy$ tem raio:`, '3', ['1', '2', '√14', '6'], t`O raio é a distância do centro ao plano $z=0$: $|3|$.`),
            num(t`O ponto $(1,\,2,\,2)$ está a que distância da superfície da esfera $x^2+y^2+z^2=16$?`, 1, t`Ele está a $\sqrt{1+4+4}=3$ da origem; a esfera tem raio $4$: falta $1$.`),
          ],
        },
        {
          card: {
            title: 'Uma equação, duas leituras',
            body: t`A mesma equação descreve objetos diferentes no plano e no espaço:

• $x=2$: **reta** vertical em $\mathbb R^2$; **plano** paralelo a $yz$ em $\mathbb R^3$
• $x^2+y^2=4$: **circunferência** em $\mathbb R^2$; **cilindro** em $\mathbb R^3$ ($z$ livre)
• $y=x$: reta no plano; plano vertical no espaço

No espaço, uma equação "costuma" dar uma superfície; duas equações juntas, uma curva.`,
          },
          exercises: [
            mcq(t`Em $\mathbb R^3$, a equação $z=3$ representa:`, ['um plano horizontal', 'uma reta', 'um ponto', 'uma esfera'], 0, t`Todos os pontos com altura 3.`),
            mcq(t`Em $\mathbb R^3$, $x^2+y^2=9$ representa:`, ['um cilindro circular de raio 3', 'uma circunferência', 'uma esfera', 'um cone'], 0, t`$z$ é livre: a circunferência é "esticada" na direção $z$.`),
            match(t`Ligue a equação (em $\mathbb R^3$) ao objeto:`, [
              [t`$y=0$`, 'plano $xz$'],
              [t`$x=0$ e $y=0$`, 'eixo $z$'],
              [t`$x^2+y^2+z^2=1$`, 'esfera unitária'],
              [t`$x^2+y^2=1$ e $z=0$`, 'circunferência no plano $xy$'],
            ], t`Duas equações juntas costumam dar uma curva.`),
            tf(t`Em $\mathbb R^3$, o conjunto $\{(x,y,z):\ x^2+y^2+z^2\le4\}$ é uma bola sólida de raio 2.`, true, t`Desigualdade ⟹ inclui o interior.`),
            mcqS(t`A interseção da esfera $x^2+y^2+z^2=25$ com o plano $z=3$ é:`, 'uma circunferência de raio 4', ['um ponto', 'uma circunferência de raio 5', 'uma reta', 'vazia'], t`$x^2+y^2=25-9=16$.`),
            gen((rng) => {
              const [R, h, r] = pick(rng, [[5, 3, 4], [5, 4, 3], [13, 5, 12], [10, 6, 8], [13, 12, 5]] as const);
              return num(t`Qual o raio da circunferência obtida cortando $x^2+y^2+z^2=${R * R}$ pelo plano $z=${h}$?`, r, t`$x^2+y^2=${R * R}-${h * h}=${r * r}$.`);
            }),
            multi(t`Quais equações representam **planos** em $\mathbb R^3$?`, [t`$x+y=1$`, t`$z=0$`, t`$x^2+y^2=1$`, t`$2x-y+3z=6$`], [0, 1, 3], t`Equações lineares em $x,\,y,\,z$.`),
            mcq(t`A região $\{x\ge0,\ y\ge0,\ z\ge0\}$ é:`, ['o 1º octante', 'um plano', 'o eixo $z$', 'uma esfera'], 0, t`Todas as coordenadas não negativas.`),
          ],
        },
      ],
    },
    {
      id: 'g-sup-cil',
      title: 'Cilindros e traços',
      parts: [
        {
          card: {
            title: 'Superfícies cilíndricas',
            body: t`Se a equação **não tem uma das variáveis**, a superfície é um **cilindro**: a curva do plano é "arrastada" ao longo do eixo da variável ausente.

• $x^2+y^2=4$: cilindro circular ao longo de $z$
• $z=y^2$: cilindro parabólico ao longo de $x$ (uma "calha")
• $y^2+z^2=1$: cilindro ao longo de $x$

Escolha a superfície e mova o plano de corte $z=k$:`,
            visual: cylinderLab(0),
          },
          exercises: [
            mcq(t`$z=y^2$ no espaço é um cilindro ao longo de qual eixo?`, ['eixo $x$', 'eixo $y$', 'eixo $z$', 'nenhum'], 0, t`A variável ausente é $x$.`),
            mcqS(t`Qual variável é "livre" em $x^2+z^2=9$?`, t`$y$`, [t`$x$`, t`$z$`, 'nenhuma', 'todas'], t`Cilindro de raio 3 ao longo do eixo $y$.`),
            inter(t`Escolha a superfície $z=y^2$ (nº 2) e corte com o plano $z=1$.`, 'space3d', cylinderLab(0).props, (v: any) => v && Math.round(v.p.c) === 1 && near(v.p.k, 1, 0.05), t`Superfície 2 e $k=1$: o traço são as duas retas $y=\pm1$.`),
            tf(t`O traço do cilindro $x^2+y^2=4$ em qualquer plano $z=k$ é a mesma circunferência.`, true, t`$z$ não aparece na equação.`),
            gen((rng) => {
              const r = randInt(rng, 2, 6);
              const ax = pick(rng, ['x', 'y', 'z'] as const);
              const eq = ax === 'z' ? `x^2+y^2=${r * r}` : ax === 'y' ? `x^2+z^2=${r * r}` : `y^2+z^2=${r * r}`;
              return rmcq(rng, t`Qual o raio e o eixo do cilindro $${eq}$?`, `raio ${r}, eixo ${ax}`, [`raio ${r * r}, eixo ${ax}`, `raio ${r}, eixo ${ax === 'x' ? 'y' : 'x'}`, `raio ${r * r}, eixo ${ax === 'z' ? 'x' : 'z'}`], t`Raio $\sqrt{${r * r}}=${r}$; eixo = variável ausente.`);
            }),
            mcq(t`$y=\operatorname{sen}x$ em $\mathbb R^3$ é:`, ['uma "telha ondulada" ao longo de $z$', 'uma curva', 'um plano', 'uma esfera'], 0, t`A senoide do plano $xy$ é arrastada na direção $z$.`),
            num(t`Qual a área lateral do cilindro $x^2+y^2=9$ entre $z=0$ e $z=2$? (2 casas)`, 2 * Math.PI * 3 * 2, t`$2\pi rh=2\pi\cdot3\cdot2=12\pi\approx37{,}70$.`, { tol: 0.02 }),
            multi(t`Quais equações em $\mathbb R^3$ são cilindros?`, [t`$x^2+y^2=1$`, t`$z=x^2$`, t`$x^2+y^2+z^2=1$`, t`$z=x^2+y^2$`], [0, 1], t`Falta uma variável nas duas primeiras.`),
          ],
        },
        {
          card: {
            title: 'Traços: fatiando a superfície',
            body: t`O **traço** de uma superfície num plano é a curva da interseção. Para reconhecer uma superfície, fatie com planos paralelos aos coordenados ($x=k$, $y=k$, $z=k$) e identifique as curvas planas (retas, circunferências, elipses, parábolas, hipérboles).`,
            example: t`$z=x^2+y^2$: em $z=k>0$ dá circunferências $x^2+y^2=k$; em $x=0$ dá a parábola $z=y^2$. Conclusão: paraboloide de revolução.`,
          },
          exercises: [
            mcqS(t`O traço de $z=x^2+y^2$ no plano $z=9$ é:`, 'circunferência de raio 3', ['circunferência de raio 9', 'parábola', 'duas retas', 'vazio'], t`$x^2+y^2=9$.`),
            mcqS(t`O traço de $z=x^2+y^2$ no plano $y=0$ é:`, t`a parábola $z=x^2$`, ['uma circunferência', 'uma reta', 'uma hipérbole', 'vazio'], t`Substitua $y=0$.`),
            mcqS(t`O traço de $z=x^2-y^2$ no plano $z=1$ é:`, 'uma hipérbole', ['uma circunferência', 'uma elipse', 'uma parábola', 'duas retas paralelas'], t`$x^2-y^2=1$.`),
            gen((rng) => {
              const a = randInt(rng, 2, 4);
              const b = randInt(rng, 1, 3);
              const k = randInt(rng, 1, 3);
              return rmcq(rng, t`O traço de $z=${a * a}x^2+${b * b}y^2$ no plano $z=${k * k * a * a * b * b}$ é a elipse com semieixos:`, `$${k * b}$ em $x$ e $${k * a}$ em $y$`, [`$${k * a}$ em $x$ e $${k * b}$ em $y$`, `$${k * k}$ em $x$ e $${k}$ em $y$`, `$${k * a * b}$ nos dois`], t`$\frac{x^2}{${k * k * b * b}}+\frac{y^2}{${k * k * a * a}}=1$.`);
            }),
            tf(t`O traço do elipsoide $\frac{x^2}{4}+y^2+z^2=1$ no plano $z=2$ é vazio.`, true, t`$\frac{x^2}{4}+y^2=1-4<0$.`),
            num(t`Para quais $k$ o traço de $x^2+y^2+z^2=4$ em $z=k$ é um único ponto? Dê o positivo.`, 2, t`$x^2+y^2=4-k^2=0\Rightarrow k=\pm2$.`),
            match(t`Ligue a superfície ao traço em $z=1$:`, [
              [t`$x^2+y^2=z^2$`, 'circunferência de raio 1'],
              [t`$z=x^2-y^2$`, 'hipérbole'],
              [t`$z=y^2$`, 'duas retas paralelas'],
              [t`$x^2+4y^2+z^2=5$`, 'elipse'],
            ], t`Substitua $z=1$ em cada uma.`),
            mcq(t`Se todos os traços horizontais de uma superfície são circunferências centradas no eixo $z$, ela é…`, ['de revolução em torno do eixo $z$', 'um plano', 'um cilindro parabólico', 'uma sela'], 0, t`Girar uma curva em torno do eixo $z$ produz traços circulares.`),
          ],
        },
      ],
    },
    {
      id: 'g-sup-quad',
      title: 'Superfícies quádricas',
      parts: [
        {
          card: {
            title: 'Elipsoide e paraboloides',
            body: t`Quádricas são as superfícies do 2º grau. As três primeiras:

• **Elipsoide** $\frac{x^2}{a^2}+\frac{y^2}{b^2}+\frac{z^2}{c^2}=1$: limitado; traços são elipses (esfera se $a=b=c$)
• **Paraboloide elíptico** $z=\frac{x^2}{a^2}+\frac{y^2}{b^2}$: uma "tigela" (antenas, faróis)
• **Paraboloide hiperbólico** $z=\frac{x^2}{a^2}-\frac{y^2}{b^2}$: a **sela** — sobe numa direção e desce na outra

Troque o tipo (1 a 3) e mova o plano de corte:`,
            visual: quadricLab(0),
          },
          exercises: [
            mcqS(t`$\frac{x^2}{9}+\frac{y^2}{4}+z^2=1$ é um:`, 'elipsoide', ['paraboloide', 'hiperboloide', 'cone', 'cilindro'], t`Três quadrados positivos somando 1.`),
            mcqS(t`$z=x^2+3y^2$ é um:`, 'paraboloide elíptico', ['paraboloide hiperbólico', 'elipsoide', 'cone', 'cilindro'], t`Uma variável no 1º grau e as outras duas ao quadrado com o mesmo sinal.`),
            mcqS(t`$z=y^2-x^2$ é um:`, 'paraboloide hiperbólico (sela)', ['paraboloide elíptico', 'hiperboloide', 'cone', 'elipsoide'], t`Sinais opostos nos quadrados.`),
            inter(t`Mostre a **sela** no lab e corte em $z=0$.`, 'space3d', quadricLab(0).props, (v: any) => v && Math.round(v.p.q) === 2 && near(v.p.k, 0, 0.05), t`Tipo 3, $k=0$: o traço são duas retas que se cruzam.`),
            gen((rng) => {
              const a = randInt(rng, 1, 5);
              const b = randInt(rng, 1, 5);
              const c = randInt(rng, 1, 5);
              return num(t`Qual a maior distância da origem a um ponto do elipsoide $\frac{x^2}{${a * a}}+\frac{y^2}{${b * b}}+\frac{z^2}{${c * c}}=1$?`, Math.max(a, b, c), t`O maior semieixo: $\max(${a},\,${b},\,${c})=${Math.max(a, b, c)}$.`);
            }),
            tf(t`O paraboloide hiperbólico tem um ponto de sela na origem.`, true, t`Na direção $x$ a origem é mínimo; na direção $y$, máximo.`),
            num(t`O volume do elipsoide de semieixos $a,\,b,\,c$ é $\frac43\pi abc$. Para $a=3$, $b=2$, $c=1$ (2 casas):`, 8 * Math.PI, t`$\frac43\pi\cdot6=8\pi\approx25{,}13$.`, { tol: 0.02 }),
            mcq(t`Antenas parabólicas têm forma de…`, ['paraboloide elíptico (de revolução)', 'paraboloide hiperbólico', 'hiperboloide de uma folha', 'cone'], 0, t`Raios paralelos ao eixo refletem para o foco.`),
          ],
        },
        {
          card: {
            title: 'Hiperboloides e cone',
            body: t`• **Hiperboloide de uma folha** $x^2+y^2-z^2=1$: um "carretel", conexo (torres de resfriamento!)
• **Hiperboloide de duas folhas** $z^2-x^2-y^2=1$: duas taças separadas
• **Cone** $z^2=x^2+y^2$: o caso de fronteira entre os dois

Dica: conte os sinais. Dois $+$ e um $-$ igualados a $+1$ ⟹ uma folha; um $+$ e dois $-$ ⟹ duas folhas; $=0$ ⟹ cone.`,
            visual: quadricLab(3),
          },
          exercises: [
            mcqS(t`$x^2+y^2-z^2=4$ é um:`, 'hiperboloide de uma folha', ['hiperboloide de duas folhas', 'cone', 'elipsoide', 'paraboloide'], t`Dois sinais $+$, um $-$, igual a positivo.`),
            mcqS(t`$z^2-x^2-y^2=4$ é um:`, 'hiperboloide de duas folhas', ['hiperboloide de uma folha', 'cone', 'esfera', 'sela'], t`Só $z^2$ positivo.`),
            mcqS(t`$x^2+y^2-z^2=0$ é um:`, 'cone', ['hiperboloide de uma folha', 'plano', 'cilindro', 'sela'], t`Igualado a zero.`),
            inter(t`No lab, mostre o hiperboloide de **duas** folhas e escolha um corte $z=k$ que **não** encontra a superfície.`, 'space3d', quadricLab(3).props, (v: any) => v && Math.round(v.p.q) === 4 && Math.abs(v.p.k) < 1 - 1e-9, t`Tipo 5 e $|k|<1$.`),
            tf(t`O hiperboloide de uma folha pode ser construído só com retas.`, true, t`É uma superfície duplamente regrada — por isso torres de resfriamento são feitas com vigas retas.`),
            gen((rng) => {
              const k = randInt(rng, 2, 6);
              return num(t`Qual o raio do traço do cone $z^2=x^2+y^2$ no plano $z=${k}$?`, k, t`$x^2+y^2=${k * k}$.`);
            }),
            num(t`Qual o raio do traço de $x^2+y^2-z^2=1$ no plano $z=0$ (a "cintura")?`, 1, t`$x^2+y^2=1$.`),
            gen((rng) => {
              const k = randInt(rng, 2, 5);
              return num(t`Qual o raio do traço de $z^2-x^2-y^2=1$ no plano $z=${k}$? (2 casas)`, Math.sqrt(k * k - 1), t`$x^2+y^2=${k * k}-1=${k * k - 1}$.`, { tol: 0.01 });
            }),
          ],
        },
        {
          card: {
            title: 'Reconhecendo quádricas',
            body: t`Roteiro:
1. Se for preciso, **complete quadrados** para centralizar.
2. Veja se alguma variável aparece só no **1º grau** ⟹ paraboloide (ou cilindro parabólico).
3. Senão, conte os **sinais** dos quadrados e veja o lado direito ($1$ ou $0$).
4. Confirme com dois ou três **traços**.`,
            visual: quadricLab(1),
          },
          exercises: [
            match(t`Ligue a equação ao nome:`, [
              [t`$x^2+y^2+z^2=9$`, 'esfera'],
              [t`$z=x^2-y^2$`, 'sela'],
              [t`$x^2+y^2=z^2$`, 'cone'],
              [t`$x^2+y^2-z^2=1$`, 'hiperboloide de uma folha'],
            ], t`Use o roteiro: grau de cada variável e sinais.`),
            mcqS(t`$x=y^2+z^2$ é:`, 'um paraboloide ao longo do eixo x', ['um cone', 'um cilindro', 'uma esfera', 'uma sela'], t`$x$ no 1º grau e os outros dois quadrados com mesmo sinal.`),
            mcqS(t`$x^2+y^2+z^2-2z=0$ é:`, 'uma esfera de centro (0, 0, 1) e raio 1', ['um cone', 'um paraboloide', 'um cilindro', 'uma esfera centrada na origem'], t`$x^2+y^2+(z-1)^2=1$.`),
            gen((rng) => {
              const kind = randInt(rng, 0, 4);
              const a = randInt(rng, 2, 5);
              const eqs = [`x^2+${a}y^2+z^2=1`, `z=${a}x^2+y^2`, `z=x^2-${a}y^2`, `x^2+y^2-${a}z^2=1`, `${a}z^2-x^2-y^2=1`];
              const names = ['elipsoide', 'paraboloide elíptico', 'paraboloide hiperbólico', 'hiperboloide de uma folha', 'hiperboloide de duas folhas'];
              return rmcq(rng, t`Classifique: $${eqs[kind]}$`, names[kind], names.filter((_, i) => i !== kind), t`Grau das variáveis e sinais dos quadrados.`);
            }),
            tf(t`$4x^2+9y^2+36z^2=36$ é um elipsoide com semieixos $3$, $2$ e $1$.`, true, t`Dividindo por 36: $\frac{x^2}{9}+\frac{y^2}{4}+z^2=1$.`),
            inter(t`Mostre o **paraboloide elíptico** e um traço circular de raio $2$.`, 'space3d', quadricLab(1).props, (v: any) => v && Math.round(v.p.q) === 1 && near(v.p.k, 2, 0.05), t`$z=\frac{x^2+y^2}{2}$: raio $2$ em $z=2$.`),
            order(t`Ordene o roteiro para reconhecer uma quádrica:`, ['completar quadrados (se preciso)', 'ver se alguma variável aparece só no 1º grau', 'contar os sinais dos termos quadráticos', 'confirmar com dois ou três traços'], t`É o roteiro do card.`),
            mcq(t`Qual quádrica é a única **limitada** (cabe numa caixa)?`, ['elipsoide', 'cone', 'paraboloide', 'hiperboloide'], 0, t`Todas as outras se estendem ao infinito.`),
          ],
        },
      ],
    },
  ],
};

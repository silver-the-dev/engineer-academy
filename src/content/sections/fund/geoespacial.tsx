import React from 'react';
import type { UnitDef, VisualSpec } from '../../types';
import { gen, mcqS, num, tf, match, multi, order, inter, plot, near } from '../../helpers';
import { CircleW, Label, RectW } from '../../../components/plot/Plot';
import { Axes3, Line3, Point3, Poly3, type V3 } from '../../../components/visuals/Space3D';
import { C } from '../../../theme';
import { fmt, pick, randInt } from '../../../lib/random';

const t = String.raw;
const PI = Math.PI;
type Spec = VisualSpec & { props: Record<string, any> };
const PHI = (1 + Math.sqrt(5)) / 2;

/* ---------------- geometry data ---------------- */

const cyc = (a: number, b: number, c: number): V3[] => [[a, b, c], [b, c, a], [c, a, b]];
const signs = (v: V3): V3[] => {
  const out: V3[] = [];
  for (const sx of v[0] ? [1, -1] : [1]) for (const sy of v[1] ? [1, -1] : [1]) for (const sz of v[2] ? [1, -1] : [1]) out.push([v[0] * sx, v[1] * sy, v[2] * sz]);
  return out;
};
const SOLIDS: { name: string; V: V3[]; F: number }[] = (() => {
  const cube = signs([1, 1, 1]);
  const tetra: V3[] = [[1, 1, 1], [1, -1, -1], [-1, 1, -1], [-1, -1, 1]];
  const octa: V3[] = [[1.4, 0, 0], [-1.4, 0, 0], [0, 1.4, 0], [0, -1.4, 0], [0, 0, 1.4], [0, 0, -1.4]];
  const ico: V3[] = cyc(0, 1, PHI).flatMap(signs).map((v) => v.map((c) => c * 0.8) as V3);
  const dode: V3[] = [...cube, ...cyc(0, 1 / PHI, PHI).flatMap(signs)].map((v) => v.map((c) => c * 0.85) as V3);
  return [
    { name: 'tetraedro', V: tetra, F: 4 },
    { name: 'cubo', V: cube, F: 6 },
    { name: 'octaedro', V: octa, F: 8 },
    { name: 'dodecaedro', V: dode, F: 12 },
    { name: 'icosaedro', V: ico, F: 20 },
  ];
})();
const edgesOf = (V: V3[]): [number, number][] => {
  const d = (a: V3, b: V3) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
  let m = Infinity;
  for (let i = 0; i < V.length; i++) for (let j = i + 1; j < V.length; j++) m = Math.min(m, d(V[i], V[j]));
  const E: [number, number][] = [];
  for (let i = 0; i < V.length; i++) for (let j = i + 1; j < V.length; j++) if (d(V[i], V[j]) < m * 1.01) E.push([i, j]);
  return E;
};
const EDGES = SOLIDS.map((s) => edgesOf(s.V));

/* ---------------- labs ---------------- */

const platonicLab = (k0 = 1): Spec => ({
  name: 'space3d',
  props: {
    scale: 46,
    params: [{ key: 'k', label: 'sólido', min: 0, max: 4, step: 1, value: k0, color: C.gold, format: (v: number) => SOLIDS[Math.round(v)].name }],
    render: ({ p }: any) => {
      const k = Math.round(p.k);
      const S = SOLIDS[k];
      return (
        <>
          {EDGES[k].map(([i, j], n) => <Line3 key={n} a={S.V[i]} b={S.V[j]} color={C.p2} width={2.5} />)}
          {S.V.map((v, i) => <Point3 key={'v' + i} at={v} color={C.gold} r={3.5} />)}
        </>
      );
    },
    info: ({ p }: any) => {
      const k = Math.round(p.k);
      const V = SOLIDS[k].V.length, A = EDGES[k].length, F = SOLIDS[k].F;
      return t`${SOLIDS[k].name}: $V=${V}$, $A=${A}$, $F=${F}$ · $V-A+F=${V - A + F}$`;
    },
  },
});

const positionLab = (): Spec => ({
  name: 'space3d',
  props: {
    scale: 40,
    params: [{ key: 'm', label: 'posição', min: 0, max: 2, step: 1, value: 2, color: C.gold, format: (v: number) => ['paralelas', 'concorrentes', 'reversas'][Math.round(v)] }],
    render: ({ p }: any) => {
      const m = Math.round(p.m);
      const s: [V3, V3] = m === 0 ? [[-2, 1.5, 0], [2, 1.5, 0]] : m === 1 ? [[-1.5, -1.5, 0], [1.5, 1.5, 0]] : [[0, -2, 1.5], [0, 2, 1.5]];
      return (
        <>
          <Poly3 pts={[[-2.4, -2.4, 0], [2.4, -2.4, 0], [2.4, 2.4, 0], [-2.4, 2.4, 0]]} color={C.p1} opacity={0.12} />
          <Line3 a={[-2.4, 0, 0]} b={[2.4, 0, 0]} color={C.p2} width={3.5} />
          <Line3 a={s[0]} b={s[1]} color={C.p5} width={3.5} />
          {m === 2 ? <Line3 a={[0, 0, 0]} b={[0, 0, 1.5]} color={C.gold} width={2} dash="5 4" /> : null}
        </>
      );
    },
    info: ({ p }: any) =>
      ['Paralelas: mesmo plano e nenhum ponto comum.', 'Concorrentes: um único ponto comum (mesmo plano).', 'Reversas: NÃO existe plano que contenha as duas; nunca se encontram e não são paralelas. Distância = segmento amarelo.'][Math.round(p.m)],
  },
});

const box = (a: number, b: number, c: number): [V3[], [number, number][]] => {
  const V: V3[] = [[0, 0, 0], [a, 0, 0], [a, b, 0], [0, b, 0], [0, 0, c], [a, 0, c], [a, b, c], [0, b, c]];
  const E: [number, number][] = [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]];
  return [V, E];
};

const boxLab = (): Spec => ({
  name: 'space3d',
  props: {
    scale: 30,
    params: [
      { key: 'a', label: 'a', min: 1, max: 4, step: 0.5, value: 3, color: C.p2 },
      { key: 'b', label: 'b', min: 1, max: 4, step: 0.5, value: 2, color: C.p5 },
      { key: 'c', label: 'c', min: 1, max: 4, step: 0.5, value: 2, color: C.p4 },
    ],
    render: ({ p }: any) => {
      const [V, E] = box(p.a, p.b, p.c);
      const sh = (v: V3): V3 => [v[0] - p.a / 2, v[1] - p.b / 2, v[2] - p.c / 2];
      return (
        <>
          {E.map(([i, j], n) => <Line3 key={n} a={sh(V[i])} b={sh(V[j])} color={C.p2} width={2} />)}
          <Line3 a={sh(V[0])} b={sh(V[2])} color={C.p5} width={2} dash="5 4" />
          <Line3 a={sh(V[0])} b={sh(V[6])} color={C.gold} width={3.5} />
        </>
      );
    },
    info: ({ p }: any) => t`diagonal $D=\sqrt{a^2+b^2+c^2}=${fmt(Math.hypot(p.a, p.b, p.c), 2)}$ · área total $2(ab+ac+bc)=${fmt(2 * (p.a * p.b + p.a * p.c + p.b * p.c), 2)}$ · volume $abc=${fmt(p.a * p.b * p.c, 2)}$`,
  },
});

const pyramidLab = (): Spec => ({
  name: 'space3d',
  props: {
    scale: 34,
    params: [
      { key: 'L', label: '\\ell', min: 1, max: 4, step: 0.5, value: 3, color: C.p2 },
      { key: 'h', label: 'h', min: 1, max: 4, step: 0.5, value: 2, color: C.gold },
    ],
    render: ({ p }: any) => {
      const l = p.L / 2;
      const B: V3[] = [[-l, -l, 0], [l, -l, 0], [l, l, 0], [-l, l, 0]];
      const T: V3 = [0, 0, p.h];
      return (
        <>
          <Poly3 pts={B} color={C.p2} opacity={0.2} stroke={C.p2} />
          {B.map((v, i) => <Line3 key={i} a={v} b={T} color={C.p2} width={2} />)}
          <Line3 a={[0, 0, 0]} b={T} color={C.gold} width={3} />
          <Line3 a={[0, 0, 0]} b={[l, 0, 0]} color={C.p4} width={2.5} />
          <Line3 a={[l, 0, 0]} b={T} color={C.p5} width={3} />
        </>
      );
    },
    info: ({ p }: any) => {
      const ap = Math.hypot(p.h, p.L / 2);
      return t`altura $h=${fmt(p.h, 1)}$ (amarelo) · apótema da pirâmide $g=\sqrt{h^2+(\ell/2)^2}=${fmt(ap, 2)}$ (rosa) · aresta lateral $=${fmt(Math.hypot(p.h, p.L / Math.SQRT2), 2)}$ · $V=\frac{\ell^2h}{3}=${fmt((p.L * p.L * p.h) / 3, 2)}$`;
    },
  },
});

const ringPts = (r: number, z: number, n = 32): V3[] => Array.from({ length: n }, (_, i) => [r * Math.cos((2 * PI * i) / n), r * Math.sin((2 * PI * i) / n), z] as V3);

const coneLab = (): Spec => ({
  name: 'space3d',
  props: {
    scale: 34,
    params: [
      { key: 'r', label: 'r', min: 0.5, max: 2.5, step: 0.1, value: 1.5, color: C.p2 },
      { key: 'h', label: 'h', min: 0.5, max: 4, step: 0.1, value: 3, color: C.gold },
      { key: 's', label: 'corte', min: 0, max: 0.9, step: 0.05, value: 0, color: C.p5, format: (v: number) => (v ? `a ${Math.round(v * 100)}% da altura` : 'sem corte') },
    ],
    render: ({ p }: any) => {
      const base = ringPts(p.r, 0);
      const T: V3 = [0, 0, p.h];
      const cut = p.s > 0 ? ringPts(p.r * (1 - p.s), p.h * p.s) : null;
      return (
        <>
          <Axes3 size={3} labels={false} />
          <Poly3 pts={base} color={C.p2} opacity={0.25} stroke={C.p2} />
          {base.map((v, i) => (i % 4 === 0 ? <Line3 key={i} a={v} b={T} color={C.p2} width={1.5} /> : null))}
          <Line3 a={[p.r, 0, 0]} b={T} color={C.p5} width={3} />
          <Line3 a={[0, 0, 0]} b={T} color={C.gold} width={2.5} />
          {cut ? <Poly3 pts={cut} color={C.p5} opacity={0.45} stroke={C.p5} /> : null}
        </>
      );
    },
    info: ({ p }: any) => {
      const g = Math.hypot(p.r, p.h);
      const V = (PI * p.r * p.r * p.h) / 3;
      const base = t`$g=\sqrt{r^2+h^2}=${fmt(g, 2)}$ · $A_\ell=\pi rg=${fmt(PI * p.r * g, 2)}$ · $V=\frac{\pi r^2h}{3}=${fmt(V, 2)}$`;
      if (!p.s) return base;
      const k = 1 - p.s;
      return base + t` · cone de cima: $V\cdot k^3=${fmt(V * k ** 3, 2)}$ ($k=${fmt(k, 2)}$) · tronco: $${fmt(V * (1 - k ** 3), 2)}$`;
    },
  },
});

const sphereLab = (): Spec => ({
  name: 'space3d',
  props: {
    scale: 34,
    params: [{ key: 'R', label: 'R', min: 0.5, max: 2.5, step: 0.1, value: 1.6, color: C.gold }],
    render: ({ p }: any) => {
      const lines: React.ReactNode[] = [];
      for (let i = 1; i < 6; i++) {
        const ph = (PI * i) / 6;
        const ring = ringPts(p.R * Math.sin(ph), p.R * Math.cos(ph), 28);
        ring.forEach((q, k) => lines.push(<Line3 key={`p${i}-${k}`} a={q} b={ring[(k + 1) % ring.length]} color={C.p2} width={1.2} />));
      }
      for (let k = 0; k < 8; k++) {
        const s = (2 * PI * k) / 8;
        const mer: V3[] = Array.from({ length: 13 }, (_, i) => {
          const ph = (PI * i) / 12;
          return [p.R * Math.sin(ph) * Math.cos(s), p.R * Math.sin(ph) * Math.sin(s), p.R * Math.cos(ph)] as V3;
        });
        mer.slice(1).forEach((q, i) => lines.push(<Line3 key={`m${k}-${i}`} a={mer[i]} b={q} color={C.p2} width={1.2} />));
      }
      return (
        <>
          {lines}
          <Line3 a={[0, 0, 0]} b={[p.R, 0, 0]} color={C.gold} width={3} />
          <Point3 at={[0, 0, 0]} color={C.gold} r={4} />
        </>
      );
    },
    info: ({ p }: any) => t`$A=4\pi R^2=${fmt(4 * PI * p.R ** 2, 2)}$ · $V=\frac43\pi R^3=${fmt((4 / 3) * PI * p.R ** 3, 2)}$`,
  },
});

/** Net of a cylinder: two disks + a 2πr × h rectangle. */
const netLab = () =>
  plot({
    view: { xMin: -0.5, xMax: 13, yMin: -3.2, yMax: 5.5 },
    equalAspect: true,
    grid: false,
    params: [
      { key: 'r', label: 'r', min: 0.4, max: 1.8, step: 0.1, value: 1, color: C.p2 },
      { key: 'h', label: 'h', min: 0.5, max: 3, step: 0.1, value: 2, color: C.gold },
    ],
    render: ({ p }: any) => {
      const w = 2 * PI * p.r;
      return (
        <>
          <RectW x={0} y={0} w={w} h={p.h} color={C.gold} opacity={0.3} stroke={C.gold} />
          <CircleW cx={w / 2} cy={p.h + p.r} r={p.r} color={C.p2} fill={C.p2} fillOpacity={0.25} />
          <CircleW cx={w / 2} cy={-p.r} r={p.r} color={C.p2} fill={C.p2} fillOpacity={0.25} />
          <Label x={w / 2} y={p.h / 2} text="2πr" color={C.text} anchor="middle" />
        </>
      );
    },
    info: ({ p }: any) => t`lateral: retângulo $2\pi r\times h=${fmt(2 * PI * p.r * p.h, 2)}$ · bases: $2\pi r^2=${fmt(2 * PI * p.r ** 2, 2)}$ · total $=${fmt(2 * PI * p.r * (p.r + p.h), 2)}$`,
  });

/** Similar solids: cube of side 1 and of side k. */
const similarSolidLab = (): Spec => ({
  name: 'space3d',
  props: {
    scale: 28,
    params: [{ key: 'k', label: 'k', min: 1, max: 3, step: 0.5, value: 2, color: C.gold }],
    render: ({ p }: any) => {
      const [V1, E] = box(1, 1, 1);
      const [V2] = box(p.k, p.k, p.k);
      const s1 = (v: V3): V3 => [v[0] - 3, v[1], v[2]];
      const s2 = (v: V3): V3 => [v[0] - 0.5, v[1], v[2]];
      return (
        <>
          {E.map(([i, j], n) => <Line3 key={'a' + n} a={s1(V1[i])} b={s1(V1[j])} color={C.p2} width={2.5} />)}
          {E.map(([i, j], n) => <Line3 key={'b' + n} a={s2(V2[i])} b={s2(V2[j])} color={C.gold} width={2.5} />)}
        </>
      );
    },
    info: ({ p }: any) => t`arestas $\times${fmt(p.k, 1)}$ · áreas $\times${fmt(p.k ** 2, 2)}$ · volumes $\times${fmt(p.k ** 3, 2)}$ (cabem $${fmt(p.k ** 3, 2)}$ cubinhos)`,
  },
});

/* ---------------- unit ---------------- */

export const geoEspacial: UnitDef = {
  id: 'f-gesp',
  title: 'Geometria espacial',
  subtitle: 'Poliedros, prismas, pirâmides, cilindro, cone e esfera',
  icon: '🧊',
  guide: t`Em todo poliedro convexo vale **Euler**: $V-A+F=2$. Volumes: prisma e cilindro $B\cdot h$; pirâmide e cone $\frac13B\cdot h$; esfera $\frac43\pi R^3$ (área $4\pi R^2$). Muitas medidas saem de **triângulos retângulos escondidos** (diagonal do bloco, apótema, geratriz $g^2=r^2+h^2$). Sólidos semelhantes de razão $k$: áreas $\times k^2$, volumes $\times k^3$.`,
  lessons: [
    {
      id: 'f-gesp-poli',
      title: 'Posições no espaço e poliedros',
      parts: [
        {
          card: {
            title: 'Retas e planos no espaço',
            body: t`No plano, duas retas distintas ou são paralelas ou concorrentes. No espaço aparece uma terceira possibilidade: retas **reversas** — não se cortam e **não** são paralelas (nenhum plano contém as duas).

Uma reta e um plano podem ser: **contida**, **paralela** (sem ponto comum) ou **secante** (um ponto). Uma reta é **perpendicular** a um plano quando é perpendicular a duas retas concorrentes dele. Dois planos: **paralelos** ou **secantes** (cortam-se numa reta); o ângulo entre eles é o **diedro**.`,
            visual: positionLab(),
            tip: 'Numa sala: a aresta do chão junto à parede da frente e a aresta vertical do fundo de outra parede são reversas.',
          },
          exercises: [
            match('Associe a posição relativa de duas retas.', [['paralelas', 'coplanares, sem ponto comum'], ['concorrentes', 'exatamente um ponto comum'], ['reversas', 'não coplanares'], ['coincidentes', 'todos os pontos em comum']], 'Reversas só existem no espaço.'),
            tf('Duas retas que não se cortam são necessariamente paralelas.', false, 'No espaço podem ser reversas.'),
            inter('Escolha a posição em que NÃO existe plano contendo as duas retas.', 'space3d', positionLab().props, (v) => Math.round(v.p.m) === 2, 'reversas', 'Retas reversas não são coplanares.'),
            mcqS('Num cubo ABCDEFGH (ABCD embaixo, EFGH em cima, AE vertical), as retas AB e EH são:', 'reversas', ['paralelas', 'concorrentes', 'coincidentes'], 'AB está no plano de baixo, EH no de cima, e as direções são diferentes (x e y).'),
            mcqS('Quantos pontos não colineares determinam um plano?', '3', ['2', '4', '1'], 'Três pontos não colineares (ou reta + ponto fora dela, ou duas retas concorrentes/paralelas).'),
            tf('Se uma reta é perpendicular a uma única reta de um plano, ela é perpendicular ao plano.', false, 'Precisa ser perpendicular a duas retas concorrentes do plano.'),
            gen((rng) => {
              const n = randInt(rng, 3, 9);
              return num(`Quantas arestas tem um prisma cuja base é um polígono de ${n} lados?`, 3 * n, `n arestas em cada base + n laterais = 3·${n} = ${3 * n}.`);
            }),
            mcqS('Dois planos distintos e não paralelos se intersectam em:', 'uma reta', ['um ponto', 'dois pontos', 'um plano'], 'A interseção de planos secantes é uma reta.'),
          ],
        },
        {
          card: [
            {
              title: 'Relação de Euler',
              body: t`Em todo poliedro convexo: $$V-A+F=2$$ Para contar arestas a partir das faces: cada aresta pertence a **duas** faces, então $A=\frac{\text{soma dos lados de todas as faces}}{2}$. Da mesma forma, se de cada vértice saem $k$ arestas, $A=\frac{kV}{2}$.`,
              example: t`Poliedro com 6 faces quadradas e 8 triangulares: $A=\frac{6\cdot4+8\cdot3}{2}=24$, $F=14$, logo $V=2+A-F=12$.`,
            },
            {
              title: 'Os 5 poliedros de Platão',
              body: 'Faces todas iguais e regulares, o mesmo número de arestas em cada vértice. Em volta de um vértice os ângulos somam menos que 360°, o que só permite 3, 4 ou 5 triângulos, 3 quadrados ou 3 pentágonos: tetraedro, octaedro, icosaedro, cubo e dodecaedro.',
              visual: platonicLab(1),
            },
          ],
          exercises: [
            gen((rng) => {
              const [V, A, F, nm] = pick(rng, [[4, 6, 4, 'tetraedro'], [8, 12, 6, 'cubo'], [6, 12, 8, 'octaedro'], [20, 30, 12, 'dodecaedro'], [12, 30, 20, 'icosaedro']] as [number, number, number, string][]);
              return num(`O ${nm} tem ${V} vértices e ${F} faces. Quantas arestas ele tem?`, A, `V − A + F = 2 ⇒ A = V + F − 2 = ${V} + ${F} − 2 = ${A}.`);
            }),
            gen((rng) => {
              const t3 = 2 * randInt(rng, 1, 6);
              const q = randInt(rng, 1, 6);
              const A = (3 * t3 + 4 * q) / 2;
              const F = t3 + q;
              return num(`Um poliedro convexo tem ${t3} faces triangulares e ${q} quadrangulares. Quantos vértices ele tem?`, 2 + A - F, `A = (3·${t3} + 4·${q})/2 = ${A}; F = ${F}; V = 2 + A − F = ${2 + A - F}.`);
            }),
            inter('Escolha o poliedro de Platão com 12 vértices.', 'space3d', platonicLab(0).props, (v) => Math.round(v.p.k) === 4, 'icosaedro', 'Icosaedro: V = 12, A = 30, F = 20.'),
            match('Associe o poliedro de Platão ao tipo de face.', [['tetraedro', 'triângulos (3 por vértice)'], ['cubo', 'quadrados'], ['dodecaedro', 'pentágonos'], ['icosaedro', 'triângulos (5 por vértice)']], 'O octaedro também tem triângulos (4 por vértice).'),
            tf('Existe poliedro regular cujas faces são hexágonos regulares.', false, '3 hexágonos num vértice somam 3·120° = 360°: ficam planos (é um ladrilhamento), não fecham um sólido.'),
            gen((rng) => {
              const V = randInt(rng, 6, 20);
              const k = 3;
              if ((k * V) % 2) return num(`Um poliedro convexo tem 10 vértices, e de cada um saem 3 arestas. Quantas faces ele tem?`, 7, 'A = 3·10/2 = 15; F = 2 + A − V = 7.');
              const A = (k * V) / 2;
              return num(`Um poliedro convexo tem ${V} vértices, e de cada um saem 3 arestas. Quantas faces ele tem?`, 2 + A - V, `A = 3·${V}/2 = ${A}; F = 2 + A − V = ${2 + A - V}.`);
            }),
            order('Ordene o raciocínio para achar V num poliedro com 12 faces pentagonais.', ['Soma dos lados das faces: 12·5 = 60', 'Cada aresta é contada duas vezes: A = 30', 'Euler: V = 2 + A − F', 'V = 2 + 30 − 12 = 20'], 'É o dodecaedro.'),
            multi('Quais são poliedros de Platão?', ['cubo', 'octaedro', 'prisma hexagonal regular', 'icosaedro', 'pirâmide quadrangular regular'], [0, 1, 3], 'Prismas e pirâmides em geral têm faces de tipos diferentes.'),
          ],
        },
      ],
    },
    {
      id: 'f-gesp-pp',
      title: 'Prismas e pirâmides',
      parts: [
        {
          card: {
            title: 'Paralelepípedo e prisma',
            body: t`**Paralelepípedo retângulo** de arestas $a$, $b$, $c$:
• diagonal $D=\sqrt{a^2+b^2+c^2}$ (Pitágoras duas vezes: primeiro na base, depois na vertical);
• área total $2(ab+ac+bc)$; volume $abc$.

**Prisma** qualquer: $V=A_{base}\cdot h$. Princípio de Cavalieri: sólidos com mesma altura e seções de mesma área em cada nível têm o mesmo volume — por isso um prisma inclinado (pilha de folhas empurrada) tem o mesmo volume do reto.`,
            visual: boxLab(),
          },
          exercises: [
            gen((rng) => {
              const [a, b, c, D] = pick(rng, [[1, 2, 2, 3], [2, 3, 6, 7], [1, 4, 8, 9], [2, 6, 9, 11], [3, 4, 12, 13], [4, 4, 7, 9], [2, 10, 11, 15]]);
              return num(`Diagonal de um paralelepípedo de arestas ${a}, ${b} e ${c}:`, D, `√(${a * a} + ${b * b} + ${c * c}) = √${D * D} = ${D}.`);
            }),
            gen((rng) => {
              const a = randInt(rng, 2, 9);
              return num(`Diagonal de um cubo de aresta ${a} (2 casas).`, a * Math.sqrt(3), `D = a√3 = ${fmt(a * Math.sqrt(3), 2)}.`, { tol: 0.01 });
            }),
            gen((rng) => {
              const a = randInt(rng, 2, 8), b = randInt(rng, 2, 8), c = randInt(rng, 2, 8);
              return num(`Área total de um paralelepípedo ${a} × ${b} × ${c}:`, 2 * (a * b + a * c + b * c), `2(${a * b} + ${a * c} + ${b * c}) = ${2 * (a * b + a * c + b * c)}.`);
            }),
            inter('Ajuste a, b e c para obter um bloco de volume 12 com diagonal maior que 4,5.', 'space3d', boxLab().props, (v) => near(v.p.a * v.p.b * v.p.c, 12, 0.01) && Math.hypot(v.p.a, v.p.b, v.p.c) > 4.5, 'ex.: 4 × 3 × 1 (diagonal ≈ 5,1)', 'Mesmo volume pode ter diagonais diferentes: o bloco mais "achatado" tem diagonal maior.'),
            gen((rng) => {
              const L = randInt(rng, 2, 8);
              const h = randInt(rng, 3, 12);
              return num(`Volume de um prisma triangular regular de aresta da base ${L} e altura ${h} (2 casas).`, ((L * L * Math.sqrt(3)) / 4) * h, `Base equilátera: ${L}²√3/4 ≈ ${fmt((L * L * Math.sqrt(3)) / 4, 3)}; V = base·h ≈ ${fmt(((L * L * Math.sqrt(3)) / 4) * h, 2)}.`, { tol: 0.02 });
            }),
            gen((rng) => {
              const L = randInt(rng, 1, 6);
              const h = randInt(rng, 2, 10);
              return num(`Volume de um prisma hexagonal regular de aresta da base ${L} e altura ${h} (2 casas).`, ((3 * Math.sqrt(3) * L * L) / 2) * h, `Hexágono = 6 triângulos equiláteros: 6·${L}²√3/4; V ≈ ${fmt(((3 * Math.sqrt(3) * L * L) / 2) * h, 2)}.`, { tol: 0.02 });
            }),
            tf('Um prisma oblíquo tem volume menor que o prisma reto de mesma base e mesma altura.', false, 'Cavalieri: mesma base e mesma altura ⇒ mesmo volume.'),
            gen((rng) => {
              const V = pick(rng, [27, 64, 125, 216, 343, 512]);
              const a = Math.round(Math.cbrt(V));
              return num(`Um cubo tem volume ${V} cm³. Qual a área total?`, 6 * a * a, `a = ∛${V} = ${a}; área = 6a² = ${6 * a * a}.`, { unit: 'cm²' });
            }),
          ],
        },
        {
          card: {
            title: 'Pirâmides',
            body: t`Numa pirâmide regular de base quadrada de lado $\ell$ e altura $h$, aparecem triângulos retângulos com:
• **apótema da pirâmide** (altura de uma face lateral): $g^2=h^2+\left(\frac\ell2\right)^2$;
• **aresta lateral**: $a^2=h^2+\left(\frac{\ell\sqrt2}{2}\right)^2$.

Volume: $V=\frac13A_{base}\cdot h$. O $\frac13$ é real: um cubo pode ser cortado em **três** pirâmides iguais de base quadrada com vértice num mesmo canto.`,
            visual: pyramidLab(),
          },
          exercises: [
            gen((rng) => {
              const L = randInt(rng, 2, 10);
              const h = randInt(rng, 2, 12);
              return num(`Volume da pirâmide de base quadrada de lado ${L} e altura ${h}:`, (L * L * h) / 3, `V = ${L}²·${h}/3 = ${fmt((L * L * h) / 3, 3)}.`, { tol: 0.01 });
            }),
            gen((rng) => {
              const [h, half, g] = pick(rng, [[4, 3, 5], [12, 5, 13], [8, 6, 10], [3, 4, 5], [15, 8, 17]]);
              return num(`Pirâmide regular de base quadrada de lado ${2 * half} e altura ${h}. Quanto mede o apótema (altura da face lateral)?`, g, `g² = h² + (ℓ/2)² = ${h * h} + ${half * half} = ${g * g} ⇒ g = ${g}.`);
            }),
            gen((rng) => {
              const [h, half, g] = pick(rng, [[4, 3, 5], [12, 5, 13], [8, 6, 10], [3, 4, 5]]);
              const L = 2 * half;
              return num(`Mesma pirâmide (lado ${L}, apótema ${g}, altura ${h}): qual a área lateral?`, 4 * ((L * g) / 2), `4 triângulos de base ${L} e altura ${g}: 4·${L}·${g}/2 = ${2 * L * g}.`);
            }),
            inter('Ajuste ℓ e h para obter uma pirâmide de volume 12.', 'space3d', pyramidLab().props, (v) => near((v.p.L * v.p.L * v.p.h) / 3, 12, 0.01), 'ℓ = 3 e h = 4', 'ℓ²·h/3 = 12 ⇒ ℓ²h = 36: com os valores disponíveis, ℓ = 3 e h = 4.'),
            tf('O volume de uma pirâmide é 1/3 do volume do prisma de mesma base e mesma altura.', true, 'É a fórmula V = B·h/3.'),
            gen((rng) => {
              const a = randInt(rng, 2, 9);
              return num(`Volume de um tetraedro regular de aresta ${a} (V = a³√2/12, 2 casas).`, (a ** 3 * Math.SQRT2) / 12, `${a}³·√2/12 ≈ ${fmt((a ** 3 * Math.SQRT2) / 12, 2)}.`, { tol: 0.01 });
            }),
            order('Ordene para obter a aresta lateral de uma pirâmide quadrangular regular (ℓ, h).', ['Ache a semidiagonal da base: ℓ√2/2', 'Monte o triângulo retângulo: altura h, semidiagonal e aresta lateral', 'Aplique Pitágoras: a² = h² + ℓ²/2', 'Tire a raiz'], 'A aresta lateral liga o vértice da base ao topo; a projeção dela é a semidiagonal.'),
            mcqS('Num cubo de aresta a, a pirâmide com base numa face e vértice no centro do cubo tem volume:', 'a³/6', ['a³/3', 'a³/2', 'a³/8'], 'Base a², altura a/2: V = a²·(a/2)/3 = a³/6 (cabem 6 delas no cubo).'),
          ],
        },
      ],
    },
    {
      id: 'f-gesp-red',
      title: 'Cilindro, cone, esfera e troncos',
      parts: [
        {
          card: [
            {
              title: 'Cilindro e cone',
              body: t`**Cilindro** de raio $r$ e altura $h$: planificado, a lateral vira um retângulo $2\pi r\times h$.
$$A_\ell=2\pi rh \qquad V=\pi r^2h$$
**Cone**: geratriz $g=\sqrt{r^2+h^2}$; a lateral planificada é um setor circular de raio $g$ e arco $2\pi r$.
$$A_\ell=\pi rg \qquad V=\frac13\pi r^2h$$`,
              visual: netLab(),
            },
            {
              title: 'O cone em 3D',
              body: 'Mude r e h e observe a geratriz (rosa) formando um triângulo retângulo com o raio e a altura.',
              visual: coneLab(),
            },
          ],
          exercises: [
            gen((rng) => {
              const r = randInt(rng, 1, 6);
              const h = randInt(rng, 2, 10);
              return num(`Volume do cilindro de raio ${r} e altura ${h} (use π ≈ 3,14; 1 casa).`, 3.14 * r * r * h, `πr²h = 3,14·${r * r}·${h} ≈ ${fmt(3.14 * r * r * h, 1)}.`, { tol: 0.1 });
            }),
            gen((rng) => {
              const [r, h, g] = pick(rng, [[3, 4, 5], [5, 12, 13], [6, 8, 10], [8, 15, 17], [9, 12, 15]]);
              return num(`Cone de raio ${r} e altura ${h}. Quanto mede a geratriz?`, g, `g = √(${r * r} + ${h * h}) = ${g}.`);
            }),
            gen((rng) => {
              const [r, , g] = pick(rng, [[3, 4, 5], [5, 12, 13], [6, 8, 10]]);
              return num(`Cone de raio ${r} e geratriz ${g}: área lateral em múltiplos de π (A = k·π). Quanto vale k?`, r * g, `A = πrg = ${r * g}π.`);
            }),
            inter('Ajuste r e h para que a lateral planificada do cilindro seja um QUADRADO.', 'plot', netLab().props, (v) => near(2 * PI * v.p.r, v.p.h, 0.15), 'h = 2πr (ex.: r = 0,4 e h ≈ 2,5)', 'Quadrado ⇔ largura 2πr = altura h.'),
            tf('Um cone e um cilindro de mesma base e mesma altura: o cilindro tem o triplo do volume.', true, 'Cone = πr²h/3.'),
            gen((rng) => {
              const r = randInt(rng, 2, 6);
              const h = 3 * randInt(rng, 1, 5);
              return num(`Volume do cone de raio ${r} e altura ${h}, em múltiplos de π:`, (r * r * h) / 3, `πr²h/3 = π·${r * r}·${h}/3 = ${(r * r * h) / 3}π.`);
            }),
            mcqS('Um cilindro "equilátero" é aquele em que:', 'a seção meridiana é um quadrado (h = 2r)', ['h = r', 'a base é um triângulo equilátero', 'área lateral = área das bases'], 'O corte pelo eixo é um retângulo 2r × h; equilátero quando é quadrado.'),
            gen((rng) => {
              const r = randInt(rng, 1, 5);
              const h = randInt(rng, 2, 9);
              return num(`Área total do cilindro de raio ${r} e altura ${h}, em múltiplos de π:`, 2 * r * (r + h), `2πr² + 2πrh = 2π·${r}(${r} + ${h}) = ${2 * r * (r + h)}π.`);
            }),
          ],
        },
        {
          card: {
            title: 'Esfera',
            body: t`$$A=4\pi R^2 \qquad V=\frac43\pi R^3$$
A área da esfera é **4 vezes** a área do círculo máximo. Uma seção plana a distância $d$ do centro é um círculo de raio $\sqrt{R^2-d^2}$.

**Fuso** (pedaço de casca entre dois meridianos com ângulo $\alpha$): $A=\frac{\alpha}{360^\circ}4\pi R^2$. **Cunha** (o sólido correspondente): $V=\frac{\alpha}{360^\circ}\cdot\frac43\pi R^3$.`,
            visual: sphereLab(),
            tip: 'Arquimedes: a esfera tem 2/3 do volume do cilindro que a circunscreve (r = R, h = 2R).',
          },
          exercises: [
            gen((rng) => {
              const R = randInt(rng, 1, 9);
              return num(`Área da esfera de raio ${R}, em múltiplos de π:`, 4 * R * R, `4πR² = ${4 * R * R}π.`);
            }),
            gen((rng) => {
              const R = 3 * randInt(rng, 1, 4);
              return num(`Volume da esfera de raio ${R}, em múltiplos de π:`, (4 * R ** 3) / 3, `(4/3)π·${R}³ = ${(4 * R ** 3) / 3}π.`);
            }),
            gen((rng) => {
              const [d, rs, R] = pick(rng, [[3, 4, 5], [5, 12, 13], [6, 8, 10], [8, 15, 17]]);
              return num(`Uma esfera de raio ${R} é cortada por um plano a ${d} do centro. Qual o raio da seção?`, rs, `√(${R}² − ${d}²) = √${rs * rs} = ${rs}.`);
            }),
            inter('Ajuste R para que a área da esfera seja 16π (≈ 50,27).', 'space3d', sphereLab().props, (v) => near(v.p.R, 2, 0.01), 'R = 2', '4πR² = 16π ⇒ R² = 4 ⇒ R = 2.'),
            gen((rng) => {
              const a = pick(rng, [30, 45, 60, 90, 120]);
              const R = randInt(rng, 2, 6);
              return num(`Área de um fuso de ${a}° numa esfera de raio ${R}, em múltiplos de π:`, (a / 360) * 4 * R * R, `(${a}/360)·4π·${R}² = ${fmt((a / 360) * 4 * R * R, 3)}π.`, { tol: 0.01 });
            }),
            tf('Dobrando o raio de uma esfera, o volume dobra.', false, 'Volume ∝ R³: dobrar o raio multiplica o volume por 8.'),
            gen((rng) => {
              const R = randInt(rng, 1, 6);
              return num(`Uma esfera de raio ${R} está inscrita num cilindro (r = ${R}, h = ${2 * R}). Razão volume da esfera / volume do cilindro:`, 2 / 3, `(4/3)πR³ / (πR²·2R) = (4/3)/2 = 2/3.`, { tol: 0.01 });
            }),
            mcqS('Uma laranja de raio 4 cm é dividida em 8 gomos iguais (cunhas). Volume de um gomo:', '(32/3)π cm³', ['(256/3)π cm³', '8π cm³', '(16/3)π cm³'], 'Esfera: (4/3)π·64 = (256/3)π; dividido por 8: (32/3)π.'),
          ],
        },
        {
          card: {
            title: 'Troncos e sólidos semelhantes',
            body: t`Cortando um cone (ou pirâmide) por um plano paralelo à base, o pedaço de cima é **semelhante** ao sólido todo. Se a razão entre as alturas é $k$:
$$\text{comprimentos}\times k,\quad \text{áreas}\times k^2,\quad \text{volumes}\times k^3$$
O **tronco** é o que sobra: $V_{tronco}=V\,(1-k^3)$. Fórmula direta (bases $B$, $b$ e altura $h$ do tronco): $V=\frac h3\left(B+\sqrt{Bb}+b\right)$.`,
            visual: similarSolidLab(),
            example: 'Um cone de 9 cm de altura é cortado a 3 cm do vértice: k = 1/3, o cone pequeno tem 1/27 do volume e o tronco 26/27.',
          },
          exercises: [
            gen((rng) => {
              const k = randInt(rng, 2, 5);
              return num(`Dois cubos semelhantes com razão de arestas ${k}. Quantas vezes o volume do maior é o do menor?`, k ** 3, `k³ = ${k ** 3}.`);
            }),
            inter('Ajuste k para que caibam 8 cubinhos no cubo maior.', 'space3d', similarSolidLab().props, (v) => near(v.p.k, 2, 0.01), 'k = 2', 'k³ = 8 ⇒ k = 2.'),
            gen((rng) => {
              const V = 27 * randInt(rng, 1, 5);
              return num(`Um cone de volume ${V} é cortado por um plano paralelo à base a 1/3 da altura, a partir do vértice. Qual o volume do tronco?`, V - V / 27, `Cone pequeno: ${V}·(1/3)³ = ${V / 27}; tronco = ${V} − ${V / 27} = ${V - V / 27}.`);
            }),
            inter('Corte o cone de modo que o tronco tenha exatamente 7/8 do volume.', 'space3d', coneLab().props, (v) => near(v.p.s, 0.5, 0.01), 'corte a 50% da altura', 'Cone de cima com k = 1/2 tem 1/8 do volume; o tronco, 7/8.'),
            gen((rng) => {
              const k = pick(rng, [2, 3, 4]);
              const A = randInt(rng, 2, 9);
              return num(`Uma maquete na escala 1 : ${k * 10} tem área de telhado ${A} dm². Quantos dm² tem o telhado real?`, A * (k * 10) ** 2, `Áreas ×(${k * 10})² = ${(k * 10) ** 2}: ${A}·${(k * 10) ** 2} = ${A * (k * 10) ** 2}.`);
            }),
            gen((rng) => {
              const [b, B] = pick(rng, [[1, 4], [4, 9], [1, 9], [4, 16], [9, 16]]);
              const h = 3 * randInt(rng, 1, 4);
              return num(`Tronco de pirâmide com bases de áreas ${B} e ${b} e altura ${h}. Volume?`, (h / 3) * (B + Math.sqrt(B * b) + b), `(h/3)(B + √(Bb) + b) = ${h / 3}·(${B} + ${Math.sqrt(B * b)} + ${b}) = ${(h / 3) * (B + Math.sqrt(B * b) + b)}.`);
            }),
            tf('Se um balde (tronco de cone) tem altura h, encher até h/2 ocupa metade do volume.', false, 'O tronco é mais largo em cima: a metade de baixo tem menos da metade do volume.'),
            mcqS('Uma bola de raio 2R pesa quantas vezes uma bola de raio R do mesmo material?', '8', ['2', '4', '6'], 'Peso ∝ volume ∝ R³: 2³ = 8.'),
          ],
        },
      ],
    },
  ],
};

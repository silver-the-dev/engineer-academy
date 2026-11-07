import React from 'react';
import type { UnitDef } from '../../types';
import { gen, mcq, mcqS, num, tf, match, order, inter, plot, rmcq, near, multi } from '../../helpers';
import { Arrow, CircleW, PolylineW, Pt } from '../../../components/plot/Plot';
import { C } from '../../../theme';
import { fmt, pick, randInt, randNZ, term } from '../../../lib/random';

const t = String.raw;
type F2 = (x: number, y: number, p: Record<string, number>) => [number, number];
type View = { xMin: number; xMax: number; yMin: number; yMax: number };

/** Grid of arrows for a 2D vector field (length grows with |F|, clamped). */
export function FieldArrows({ F, p, v, n = 9, color = C.p2 }: { F: F2; p: Record<string, number>; v: View; n?: number; color?: string }) {
  const hx = (v.xMax - v.xMin) / n;
  const hy = (v.yMax - v.yMin) / n;
  const h = Math.min(hx, hy);
  const out: React.ReactNode[] = [];
  let maxM = 0;
  const cells: [number, number, number, number][] = [];
  for (let i = 0; i < n; i++)
    for (let j = 0; j < n; j++) {
      const x = v.xMin + (i + 0.5) * hx;
      const y = v.yMin + (j + 0.5) * hy;
      const [a, b] = F(x, y, p);
      const m = Math.hypot(a, b);
      if (isFinite(m)) maxM = Math.max(maxM, m);
      cells.push([x, y, a, b]);
    }
  cells.forEach(([x, y, a, b], k) => {
    const m = Math.hypot(a, b);
    if (!isFinite(m) || m < 1e-9 || maxM < 1e-9) return;
    const L = h * 0.42 * (0.35 + 0.65 * Math.min(1, m / maxM));
    out.push(<Arrow key={k} x1={x - (a / m) * L * 0.5} y1={y - (b / m) * L * 0.5} x2={x + (a / m) * L * 0.5} y2={y + (b / m) * L * 0.5} color={color} width={1.8} head={7} />);
  });
  return <>{out}</>;
}

/** Field a·(x, y) + b·(−y, x) + (c, 0): source/sink, rotation and uniform flow. */
const mixF: F2 = (x, y, p) => [p.a * x - p.b * y + (p.c ?? 0), p.a * y + p.b * x];
const V0: View = { xMin: -3, xMax: 3, yMin: -3, yMax: 3 };

export const divRotLab = (a0 = 1, b0 = 0, withC = false) =>
  plot({
    view: V0,
    equalAspect: true,
    params: [
      { key: 'a', label: 'a', min: -1, max: 1, step: 0.1, value: a0, color: C.p5 },
      { key: 'b', label: 'b', min: -1, max: 1, step: 0.1, value: b0, color: C.p3 },
      ...(withC ? [{ key: 'c', label: 'c', min: -1, max: 1, step: 0.1, value: 0.5, color: C.p2 }] : []),
    ],
    render: ({ p }: any) => <FieldArrows F={mixF} p={p} v={V0} />,
    info: ({ p }: any) => t`$\vec F=${fmt(p.a, 1)}(x,\,y)+${fmt(p.b, 1)}(-y,\,x)${withC ? `+(${fmt(p.c, 1)},\\,0)` : ''}$ · $\nabla\cdot\vec F=${fmt(2 * p.a, 1)}$ · rotacional $=${fmt(2 * p.b, 1)}$`,
  });

/** Work along a circle of radius R for the rotation field or a gradient field, accumulated up to s. */
const workLab = () =>
  plot({
    view: V0,
    equalAspect: true,
    params: [
      { key: 'k', label: 'campo', min: 0, max: 1, step: 1, value: 0, color: C.p2, format: (v: number) => (Math.round(v) ? '(x, y)' : '(−y, x)') },
      { key: 'R', label: 'R', min: 0.5, max: 2.5, step: 0.1, value: 1.5, color: C.p3 },
      { key: 's', label: 't', min: 0, max: 6.28, step: 0.02, value: 2, color: C.gold },
    ],
    render: ({ p }: any) => {
      const F: F2 = Math.round(p.k) ? (x, y) => [x, y] : (x, y) => [-y, x];
      const arc: [number, number][] = [];
      for (let i = 0; i <= 60; i++) {
        const s = (p.s * i) / 60;
        arc.push([p.R * Math.cos(s), p.R * Math.sin(s)]);
      }
      return (
        <>
          <FieldArrows F={F} p={p} v={V0} color={C.textMuted} />
          <CircleW cx={0} cy={0} r={p.R} color={C.p1} width={1.5} dash="5 5" />
          <PolylineW pts={arc} color={C.p1} width={4} />
          <Pt x={p.R * Math.cos(p.s)} y={p.R * Math.sin(p.s)} color={C.gold} />
        </>
      );
    },
    info: ({ p }: any) => {
      const W = Math.round(p.k) ? 0 : p.R * p.R * p.s;
      return t`$\vec r(t)=(R\cos t,\,R\operatorname{sen}t)$ · trabalho acumulado $\int_0^{t}\vec F\cdot\vec r\,'\,dt=${fmt(W, 3)}$` + (Math.round(p.k) ? ' (campo radial: sempre ⟂ ao caminho)' : t` $=R^2t$`);
    },
  });

/** Two paths from A to B: straight vs. a bump of height h. */
const A0: [number, number] = [-2, -1];
const B0: [number, number] = [2, 1.5];
const pathPt = (s: number, h: number): [number, number] => [A0[0] + (B0[0] - A0[0]) * s, A0[1] + (B0[1] - A0[1]) * s + h * Math.sin(Math.PI * s)];
const pathD = (s: number, h: number): [number, number] => [B0[0] - A0[0], B0[1] - A0[1] + h * Math.PI * Math.cos(Math.PI * s)];
const FIELDS: { name: string; F: (x: number, y: number) => [number, number]; tex: string }[] = [
  { name: '(y, x)', F: (x, y) => [y, x], tex: '(y,\\,x)=\\nabla(xy)' },
  { name: '(−y, x)', F: (x, y) => [-y, x], tex: '(-y,\\,x)' },
];
const workAlong = (F: (x: number, y: number) => [number, number], h: number) => {
  let W = 0;
  const n = 400;
  for (let i = 0; i < n; i++) {
    const s = (i + 0.5) / n;
    const [x, y] = pathPt(s, h);
    const [dx, dy] = pathD(s, h);
    const [a, b] = F(x, y);
    W += (a * dx + b * dy) / n;
  }
  return W;
};
const twoPathsLab = () =>
  plot({
    view: V0,
    equalAspect: true,
    params: [
      { key: 'k', label: 'campo', min: 0, max: 1, step: 1, value: 0, color: C.p2, format: (v: number) => FIELDS[Math.round(v)].name },
      { key: 'h', label: 'h', min: -2, max: 2, step: 0.1, value: 1, color: C.p5 },
    ],
    render: ({ p }: any) => {
      const curved = Array.from({ length: 61 }, (_, i) => pathPt(i / 60, p.h));
      const straight = Array.from({ length: 2 }, (_, i) => pathPt(i, 0));
      return (
        <>
          <FieldArrows F={(x, y) => FIELDS[Math.round(p.k)].F(x, y)} p={p} v={V0} color={C.textMuted} />
          <PolylineW pts={straight} color={C.p3} width={3} />
          <PolylineW pts={curved} color={C.p1} width={3} />
          <Pt x={A0[0]} y={A0[1]} color={C.gold} label="A" />
          <Pt x={B0[0]} y={B0[1]} color={C.gold} label="B" />
        </>
      );
    },
    info: ({ p }: any) => {
      const F = FIELDS[Math.round(p.k)];
      return t`$\vec F=${F.tex}$ · trabalho no caminho reto: $${fmt(workAlong(F.F, 0), 2)}$ · no curvo: $${fmt(workAlong(F.F, p.h), 2)}$`;
    },
  });

export const campos: UnitDef = {
  id: 'v-campo',
  title: 'Campos vetoriais e integrais de linha',
  subtitle: 'Divergente, rotacional, trabalho e campos conservativos',
  icon: '🌬️',
  source: 'Cálculo 4 · Cálculo vetorial',
  guide: t`Um **campo vetorial** associa uma seta a cada ponto (vento, correnteza, força). O **divergente** mede quanto o campo "nasce" ou "some" num ponto; o **rotacional**, quanto ele gira. A **integral de linha** $\int_C\vec F\cdot d\vec r$ soma a componente do campo ao longo de um caminho — o trabalho. Nos campos **conservativos** ($\vec F=\nabla f$) ela só depende das pontas: $f(B)-f(A)$.`,
  lessons: [
    {
      id: 'v-campo-def',
      title: 'Campos vetoriais',
      parts: [
        {
          card: {
            title: 'Uma seta em cada ponto',
            body: t`$\vec F(x,y)=(P(x,y),\,Q(x,y))$ — em cada ponto do plano, um vetor. Exemplos:

• $(x,\,y)$: aponta para fora da origem (**fonte**)
• $(-y,\,x)$: gira em torno da origem (**rotação**)
• $(1,\,0)$: escoamento uniforme
• gravidade: $-\frac{GM}{|\vec r|^3}\vec r$ aponta para a massa

Misture fonte ($a$) e rotação ($b$):`,
            visual: divRotLab(1, 0),
          },
          exercises: [
            gen((rng) => {
              const x = randNZ(rng, -3, 3);
              const y = randNZ(rng, -3, 3);
              return rmcq(rng, t`Quanto vale $\vec F(${x},\,${y})$ para $\vec F=(-y,\,x)$?`, `$(${-y},\\,${x})$`, [`$(${y},\\,${-x})$`, `$(${x},\\,${y})$`, `$(${-x},\\,${y})$`, `$(${y},\\,${x})$`], t`Troque as coordenadas e o sinal da primeira.`);
            }),
            match(t`Ligue o campo ao comportamento:`, [
              [t`$(x,\,y)$`, 'sai da origem (fonte)'],
              [t`$(-x,\,-y)$`, 'entra na origem (sumidouro)'],
              [t`$(-y,\,x)$`, 'gira no sentido anti-horário'],
              [t`$(2,\,0)$`, 'escoamento uniforme para a direita'],
            ], t`Avalie em alguns pontos e imagine as setas.`),
            inter(t`No lab, monte um campo de **rotação pura** no sentido anti-horário.`, 'plot', divRotLab(1, 0).props, (v: any) => v && near(v.p.a, 0, 0.01) && v.p.b > 0.05, t`$a=0$ e $b>0$.`, t`O campo $b(-y,\,x)$ gira em torno da origem sem fonte nem sumidouro; $b>0$ dá o sentido anti-horário.`),
            tf(t`No campo $(-y,\,x)$, cada vetor é perpendicular ao vetor posição $(x,\,y)$.`, true, t`$(x,\,y)\cdot(-y,\,x)=0$.`),
            gen((rng) => {
              const x = randNZ(rng, -4, 4);
              const y = randNZ(rng, -4, 4);
              return num(t`Qual o módulo de $\vec F=(x,\,y)$ no ponto $(${x},\,${y})$? (2 casas)`, Math.hypot(x, y), t`$\sqrt{${x * x}+${y * y}}\approx${fmt(Math.hypot(x, y), 2)}$.`, { tol: 0.01 });
            }),
            mcqS(t`O campo gradiente de $f(x,y)=x^2+3y$ é:`, t`$(2x,\,3)$`, [t`$(x^2,\,3y)$`, t`$(2,\,3)$`, t`$(2x,\,3y)$`, t`$(3,\,2x)$`], t`$\nabla f=(f_x,\,f_y)$.`),
            mcq(t`As **linhas de fluxo** de um campo são curvas…`, ['tangentes ao campo em cada ponto', 'perpendiculares ao campo', 'onde o campo é zero', 'de nível do campo'], 0, t`Uma partícula levada pelo campo percorre uma linha de fluxo.`),
            mcqS(t`As linhas de fluxo de $\vec F=(-y,\,x)$ são:`, 'circunferências centradas na origem', ['retas pela origem', 'parábolas', 'hipérboles', 'espirais'], t`O campo é sempre tangente às circunferências.`),
          ],
        },
        {
          card: {
            title: 'Campos gradiente',
            body: t`Se $\vec F=\nabla f$, dizemos que $f$ é o **potencial** de $\vec F$. As setas apontam para onde $f$ cresce mais rápido e cortam as curvas de nível de $f$ em ângulo reto.

Exemplos na física: força gravitacional e elétrica ($\vec F=-\nabla U$, energia potencial), fluxo de calor ($-k\nabla T$, do quente para o frio).`,
            tip: t`Nem todo campo é gradiente: $(-y,\,x)$ não é (veremos o teste em breve).`,
          },
          exercises: [
            mcqS(t`$\nabla(xy^2)=$`, t`$(y^2,\,2xy)$`, [t`$(2xy,\,y^2)$`, t`$(y^2,\,2y)$`, t`$(xy,\,y^2)$`, t`$(1,\,2y)$`], t`$f_x=y^2$, $f_y=2xy$.`),
            gen((rng) => {
              const a = randNZ(rng, -4, 4);
              const b = randNZ(rng, -4, 4);
              return rmcq(rng, t`Um potencial para $\vec F=(${a},\,${b})$ é:`, `$f=${a}x${term(b, 'y')}$`, [`$f=${b}x${term(a, 'y')}$`, `$f=${a}x^2${term(b, 'y^2')}$`, `$f=${a * b}xy$`, `$f=x${term(1, 'y')}$`], t`$f_x=${a}$ e $f_y=${b}$.`);
            }),
            tf(t`O fluxo de calor $-k\nabla T$ aponta do quente para o frio.`, true, t`$\nabla T$ aponta para o quente; o sinal de menos inverte.`),
            mcqS(t`Um potencial para $\vec F=(x,\,y)$ é:`, t`$\frac{x^2+y^2}{2}$`, [t`$x+y$`, t`$xy$`, t`$x^2+y^2$`, t`$\sqrt{x^2+y^2}$`], t`$\nabla\frac{x^2+y^2}{2}=(x,\,y)$.`),
            num(t`Para $f=x^2y$, quanto vale a 2ª componente de $\nabla f$ em $(3,\,1)$?`, 9, t`$f_y=x^2=9$.`),
            mcq(t`O vetor $\nabla f$ num ponto é…`, ['perpendicular à curva de nível de f que passa por ali', 'tangente à curva de nível', 'sempre unitário', 'sempre nulo'], 0, t`Propriedade fundamental do gradiente.`),
            gen((rng) => {
              const k = randInt(rng, 1, 4);
              const x = randNZ(rng, -3, 3);
              const y = randNZ(rng, -3, 3);
              return num(t`Para $f=${k}(x^2+y^2)$, qual a 1ª componente de $\nabla f$ em $(${x},\,${y})$?`, 2 * k * x, t`$f_x=${2 * k}x=${2 * k * x}$.`);
            }),
            multi(t`Quais campos são gradientes (têm potencial)?`, [t`$(2x,\,2y)$`, t`$(y,\,x)$`, t`$(\cos x,\,1)$`, t`$(-y,\,x)$`], [0, 1, 2], t`Potenciais: $x^2+y^2$, $xy$, $\operatorname{sen}x+y$. O último gira.`),
          ],
        },
      ],
    },
    {
      id: 'v-campo-divrot',
      title: 'Divergente e rotacional',
      parts: [
        {
          card: {
            title: 'Divergente: fonte ou sumidouro',
            body: t`$$\nabla\cdot\vec F=\frac{\partial P}{\partial x}+\frac{\partial Q}{\partial y}\ \left(+\frac{\partial R}{\partial z}\right)$$

Mede a **taxa de expansão** do fluido por unidade de área (volume): positivo = **fonte** (sai mais do que entra), negativo = **sumidouro**, zero = **incompressível**. No lab, $\nabla\cdot\vec F=2a$:`,
            visual: divRotLab(0.6, 0.4),
          },
          exercises: [
            gen((rng) => {
              const a = randNZ(rng, -4, 4);
              const b = randNZ(rng, -4, 4);
              return num(t`Divergente de $\vec F=(${a}x,\,${b}y)$:`, a + b, t`$\partial_x(${a}x)+\partial_y(${b}y)=${a + b}$.`);
            }),
            mcqS(t`$\nabla\cdot(x^2,\,xy)=$`, t`$3x$`, [t`$2x+y$`, t`$2x$`, t`$x^2+xy$`, t`$3x^2$`], t`$2x+x=3x$.`),
            tf(t`O campo de rotação $(-y,\,x)$ tem divergente zero.`, true, t`$\partial_x(-y)+\partial_y(x)=0$: gira sem comprimir.`),
            inter(t`No lab, deixe o campo **incompressível** mas girando.`, 'plot', divRotLab(0.6, 0.4).props, (v: any) => v && near(v.p.a, 0, 0.01) && Math.abs(v.p.b) > 0.05, t`$a=0$ (divergente nulo), $b\ne0$.`, t`Incompressível significa $\operatorname{div}\vec F=0$ (parte radial $a=0$); o termo de rotação $b\ne0$ mantém o giro.`),
            num(t`Divergente de $\vec F=(xy,\,yz,\,zx)$ em $(1,\,2,\,3)$:`, 6, t`$y+z+x=2+3+1=6$.`),
            mcq(t`Água saindo de um ralo invertido (fonte) tem divergente…`, ['positivo', 'negativo', 'zero', 'imaginário'], 0, t`O fluido "nasce" ali.`),
            gen((rng) => {
              const a = randNZ(rng, -3, 3);
              const x = randInt(rng, -2, 3);
              return num(t`Divergente de $\vec F=(${a}x^2,\,-y)$ no ponto $x=${x}$:`, 2 * a * x - 1, t`$${2 * a}x-1=${2 * a * x - 1}$.`);
            }),
            mcqS(t`Para um fluido incompressível (como a água), o campo de velocidade satisfaz:`, t`$\nabla\cdot\vec v=0$`, [t`$\nabla\times\vec v=\vec 0$`, t`$\vec v=\vec 0$`, t`$|\vec v|=1$`, t`$\nabla\cdot\vec v=1$`], t`Não se cria nem se destrói volume.`),
          ],
        },
        {
          card: {
            title: 'Rotacional: a rodinha de pás',
            body: t`Em 3D:

$$\nabla\times\vec F=\begin{vmatrix}\vec i&\vec j&\vec k\\ \partial_x&\partial_y&\partial_z\\ P&Q&R\end{vmatrix}$$

Em 2D só sobra a componente $z$: $\dfrac{\partial Q}{\partial x}-\dfrac{\partial P}{\partial y}$ (o "rotacional escalar").

Imagine uma rodinha de pás no fluido: o rotacional mede com que velocidade ela gira (positivo = anti-horário). Identidades: $\nabla\times(\nabla f)=\vec 0$ e $\nabla\cdot(\nabla\times\vec F)=0$.`,
            visual: divRotLab(0, 0.7, true),
          },
          exercises: [
            num(t`Rotacional escalar de $(-y,\,x)$:`, 2, t`$\partial_x(x)-\partial_y(-y)=1+1=2$.`),
            gen((rng) => {
              const a = randNZ(rng, -4, 4);
              const b = randNZ(rng, -4, 4);
              return num(t`Rotacional escalar de $\vec F=(${a}y,\,${b}x)$:`, b - a, t`$\partial_x(${b}x)-\partial_y(${a}y)=${b}-(${a})=${b - a}$.`);
            }),
            tf(t`Todo campo gradiente tem rotacional zero.`, true, t`$\partial_x f_y-\partial_y f_x=0$ (derivadas mistas iguais).`),
            mcqS(t`$\nabla\times(yz,\,xz,\,xy)=$`, t`$\vec 0$`, [t`$(1,\,1,\,1)$`, t`$(x,\,y,\,z)$`, t`$(z,\,x,\,y)$`, t`$(0,\,0,\,2z)$`], t`É $\nabla(xyz)$: gradientes não giram.`),
            inter(t`No lab, crie um escoamento uniforme para a direita **sem** rotação nem fonte.`, 'plot', divRotLab(0, 0.7, true).props, (v: any) => v && near(v.p.a, 0, 0.01) && near(v.p.b, 0, 0.01) && v.p.c > 0.05, t`$a=b=0$, $c>0$.`, t`Campo constante $(c,\,0)$ com $c>0$: divergente e rotacional nulos, pois nenhuma componente varia.`),
            mcq(t`Um rio onde a água é mais rápida no meio do que nas margens tem rotacional…`, ['não nulo (uma rodinha perto da margem gira)', 'zero, pois a água anda em linha reta', 'sempre negativo', 'infinito'], 0, t`Mesmo com linhas de fluxo retas, a diferença de velocidade entre as pás faz a rodinha girar.`),
            num(t`$\vec F=(x^2,\,y^2,\,z^2)$: quanto vale $\nabla\cdot\vec F$ em $(1,\,1,\,1)$?`, 6, t`$2x+2y+2z=6$.`),
            match(t`Ligue o campo à descrição:`, [
              [t`$(x,\,y)$`, 'divergente 2, rotacional 0'],
              [t`$(-y,\,x)$`, 'divergente 0, rotacional 2'],
              [t`$(1,\,0)$`, 'divergente 0, rotacional 0'],
              [t`$(x-y,\,x+y)$`, 'divergente 2, rotacional 2'],
            ], t`$\nabla\cdot=P_x+Q_y$ e rot $=Q_x-P_y$.`),
          ],
        },
      ],
    },
    {
      id: 'v-campo-linha',
      title: 'Integrais de linha',
      parts: [
        {
          card: {
            title: 'Trabalho ao longo de um caminho',
            body: t`Parametrizando $C$ por $\vec r(t)$, $a\le t\le b$:

$$W=\int_C\vec F\cdot d\vec r=\int_a^b\vec F(\vec r(t))\cdot\vec r\,'(t)\,dt$$

Só conta a componente de $\vec F$ **na direção do movimento**. Força a favor ⟹ trabalho positivo; contra ⟹ negativo; perpendicular ⟹ zero. Compare os dois campos na circunferência:`,
            visual: workLab(),
          },
          exercises: [
            num(t`Trabalho de $\vec F=(-y,\,x)$ numa volta completa de $x^2+y^2=1$ (anti-horária) (2 casas):`, 2 * Math.PI, t`$\vec F\cdot\vec r\,'=\operatorname{sen}^2t+\cos^2t=1$; $\int_0^{2\pi}1\,dt=2\pi$.`, { tol: 0.01 }),
            tf(t`O campo radial $(x,\,y)$ realiza trabalho zero ao longo de uma circunferência centrada na origem.`, true, t`Ele é perpendicular ao deslocamento em todo ponto.`),
            inter(t`No lab, faça uma volta completa no campo $(-y,\,x)$ com $R=2$ e confira $W=8\pi$.`, 'plot', workLab().props, (v: any) => v && Math.round(v.p.k) === 0 && near(v.p.R, 2, 0.01) && v.p.s > 6.2, t`$W=R^2\cdot2\pi=8\pi\approx25{,}13$.`, t`Na circunferência, $\vec F$ é tangente e $|\vec F|=R$; o trabalho é $|\vec F|\cdot$ comprimento $=R\cdot2\pi R=2\pi R^2=8\pi$.`),
            gen((rng) => {
              const a = randNZ(rng, -4, 4);
              const b = randNZ(rng, -4, 4);
              const L = randInt(rng, 1, 5);
              return num(t`Trabalho de $\vec F=(${a},\,${b})$ ao longo do segmento de $(0,\,0)$ a $(${L},\,0)$:`, a * L, t`$\vec F\cdot(${L},\,0)=${a * L}$ (só a componente $x$ conta).`);
            }),
            mcqS(t`Para $C$: $\vec r(t)=(t,\,t^2)$, $0\le t\le1$, e $\vec F=(y,\,x)$, a integral vira:`, t`$\int_0^1(t^2+2t^2)\,dt=1$`, [t`$\int_0^1(t+t^2)\,dt$`, t`$\int_0^1 2t\,dt$`, t`$\int_0^1(t^2+t)\,dt$`, t`$\int_0^1 t^3\,dt$`], t`$\vec F=(t^2,\,t)$, $\vec r\,'=(1,\,2t)$: $t^2+2t^2=3t^2$.`),
            tf(t`Inverter o sentido do caminho troca o sinal de $\int_C\vec F\cdot d\vec r$.`, true, t`$\vec r\,'$ muda de sinal.`),
            gen((rng) => {
              const R = randInt(rng, 1, 4);
              return num(t`Trabalho de $(-y,\,x)$ em meia volta (anti-horária) de raio $${R}$ (2 casas):`, Math.PI * R * R, t`$R^2\cdot\pi=${R * R}\pi\approx${fmt(Math.PI * R * R, 2)}$.`, { tol: 0.02 });
            }),
            mcq(t`Um barco subindo um rio contra a correnteza: o trabalho da correnteza sobre o barco é…`, ['negativo', 'positivo', 'zero', 'depende do barco'], 0, t`Força e deslocamento em sentidos opostos.`),
          ],
        },
        {
          card: {
            title: 'Integral de linha de campo escalar',
            body: t`Para uma função escalar $f$ (densidade, temperatura) ao longo de $C$:

$$\int_C f\,ds=\int_a^b f(\vec r(t))\,|\vec r\,'(t)|\,dt$$

Exemplos: **massa** de um fio com densidade $\rho$, área de uma "cerca" de altura $f$ sobre a curva. Com $f=1$ obtemos o comprimento.`,
          },
          exercises: [
            num(t`$\int_C 1\,ds$ na circunferência de raio $3$ (2 casas):`, 6 * Math.PI, t`É o comprimento $6\pi\approx18{,}85$.`, { tol: 0.02 }),
            gen((rng) => {
              const rho = randInt(rng, 2, 6);
              const [a, b, c] = pick(rng, [[3, 4, 5], [6, 8, 10], [5, 12, 13]] as const);
              return num(t`Fio reto de $(0,\,0)$ a $(${a},\,${b})$ com densidade constante $${rho}$: massa?`, rho * c, t`Comprimento $${c}$, massa $${rho}\cdot${c}=${rho * c}$.`);
            }),
            mcqS(t`Para $\vec r(t)=(\cos t,\,\operatorname{sen}t)$, $ds=$`, t`$dt$`, [t`$2\,dt$`, t`$\operatorname{sen}t\,dt$`, t`$t\,dt$`, t`$\pi\,dt$`], t`$|\vec r\,'|=1$.`),
            num(t`$\int_C x^2\,ds$, com $C$ o segmento de $(0,\,0)$ a $(3,\,0)$:`, 9, t`$\int_0^3x^2\,dx=9$.`),
            tf(t`$\int_C f\,ds$ não depende do sentido de percurso.`, true, t`$ds=|\vec r\,'|dt\ge0$: diferente da integral de campo vetorial.`),
            num(t`$\int_C(x+y)\,ds$ na circunferência unitária:`, 0, t`$\int_0^{2\pi}(\cos t+\operatorname{sen}t)\,dt=0$.`),
            mcq(t`Qual integral dá a massa de uma mola helicoidal com densidade $\rho(x,y,z)$?`, ['$\\int_C\\rho\\,ds$', '$\\int_C\\vec F\\cdot d\\vec r$', '$\\iint\\rho\\,dA$', '$\\rho\\cdot$ volume'], 0, t`Integral de linha escalar ao longo da hélice.`),
            gen((rng) => {
              const k = randInt(rng, 1, 5);
              const R = randInt(rng, 1, 4);
              return num(t`Fio circular de raio $${R}$ com densidade $\rho=${k}$: massa (2 casas)?`, 2 * Math.PI * R * k, t`$${k}\cdot2\pi\cdot${R}\approx${fmt(2 * Math.PI * R * k, 2)}$.`, { tol: 0.02 });
            }),
          ],
        },
      ],
    },
    {
      id: 'v-campo-cons',
      title: 'Campos conservativos',
      parts: [
        {
          card: {
            title: 'O teorema fundamental das integrais de linha',
            body: t`Se $\vec F=\nabla f$:

$$\int_C\nabla f\cdot d\vec r=f(B)-f(A)$$

Só importam as **pontas**: o trabalho **independe do caminho**, e em todo caminho **fechado** vale zero. Esses campos se chamam **conservativos** (conservam energia mecânica). Mude a forma do caminho curvo:`,
            visual: twoPathsLab(),
          },
          exercises: [
            inter(t`No lab, escolha o campo $(-y,\,x)$ e ache um $h$ em que os dois caminhos dão trabalhos **diferentes**.`, 'plot', twoPathsLab().props, (v: any) => v && Math.round(v.p.k) === 1 && Math.abs(v.p.h) > 0.15, t`Qualquer $h\ne0$: o campo de rotação não é conservativo.`, t`Se o trabalho depende do caminho, o campo não é conservativo; para $(-y,\,x)$, $\operatorname{rot}\vec F=2\ne0$.`),
            gen((rng) => {
              const A = [randInt(rng, -3, 3), randInt(rng, -3, 3)];
              const B = [randInt(rng, -3, 3), randInt(rng, -3, 3)];
              return num(t`$\vec F=\nabla(xy)$. Trabalho de $A(${A[0]},\,${A[1]})$ até $B(${B[0]},\,${B[1]})$ por qualquer caminho:`, B[0] * B[1] - A[0] * A[1], t`$f(B)-f(A)=${B[0] * B[1]}-(${A[0] * A[1]})=${B[0] * B[1] - A[0] * A[1]}$.`);
            }),
            tf(t`Num campo conservativo, o trabalho num caminho fechado é zero.`, true, t`$f(A)-f(A)=0$.`),
            num(t`Trabalho de $\vec F=(2x,\,2y)$ de $(1,\,0)$ a $(0,\,3)$:`, 8, t`$f=x^2+y^2$: $9-1=8$.`),
            mcqS(t`A gravidade perto da Terra, $\vec F=(0,\,0,\,-mg)$, é conservativa com potencial:`, t`$f=-mgz$`, [t`$f=mgz$`, t`$f=-mg$`, t`$f=\frac12mz^2$`, t`não tem potencial`], t`$\nabla(-mgz)=(0,\,0,\,-mg)$; a energia potencial é $U=-f=mgz$.`),
            mcq(t`Por que o atrito **não** é uma força conservativa?`, ['o trabalho depende do caminho (sempre contra o movimento)', 'porque é pequeno', 'porque é constante', 'é conservativa'], 0, t`Caminhos mais longos dissipam mais energia.`),
            num(t`Trabalho de $\nabla(x^2y+z)$ de $(0,\,0,\,0)$ a $(1,\,2,\,3)$:`, 5, t`$f(1,2,3)=2+3=5$.`),
            mcqS(t`Se $\int_C\vec F\cdot d\vec r$ depende do caminho, então $\vec F$:`, 'não é conservativo', ['é conservativo', 'tem rotacional zero', 'é um gradiente', 'é constante'], t`Conservativo ⟺ independe do caminho.`),
          ],
        },
        {
          card: {
            title: 'Teste e cálculo do potencial',
            body: t`Em 2D (numa região sem buracos): $\vec F=(P,\,Q)$ é conservativo ⟺

$$\frac{\partial Q}{\partial x}=\frac{\partial P}{\partial y}$$

(em 3D: $\nabla\times\vec F=\vec 0$). Para achar $f$: integre $P$ em $x$, derive o resultado em $y$ e compare com $Q$.`,
            example: t`$\vec F=(2xy,\,x^2+3)$: $Q_x=2x=P_y$ ✓. $f=\int2xy\,dx=x^2y+g(y)$; $f_y=x^2+g'(y)=x^2+3\Rightarrow g=3y$. Logo $f=x^2y+3y$.`,
            tip: t`Atenção a buracos: $\left(\frac{-y}{x^2+y^2},\,\frac{x}{x^2+y^2}\right)$ passa no teste fora da origem, mas dá $2\pi$ numa volta em torno dela.`,
          },
          exercises: [
            gen((rng) => {
              const a = randNZ(rng, -3, 3);
              const b = randNZ(rng, -3, 3);
              const cons = rng() < 0.5;
              const c = cons ? a : a + pick(rng, [1, -1, 2]);
              return tf(t`$\vec F=(${a}y,\,${c}x${term(b, '')})$ é conservativo.`, cons, t`$P_y=${a}$ e $Q_x=${c}$: ${cons ? 'iguais ⟹ conservativo' : 'diferentes ⟹ não conservativo'}.`);
            }),
            mcqS(t`Potencial de $\vec F=(2xy,\,x^2+3)$:`, t`$x^2y+3y$`, [t`$x^2y$`, t`$2xy+3$`, t`$x^2+3y$`, t`$xy^2+3x$`], t`Exemplo do card.`),
            mcqS(t`Potencial de $\vec F=(e^y,\,xe^y)$:`, t`$xe^y$`, [t`$e^{xy}$`, t`$e^y+xe^y$`, t`$x+e^y$`, t`não existe`], t`$Q_x=e^y=P_y$ ✓; $f=xe^y$.`),
            gen((rng) => {
              const a = randInt(rng, 1, 4);
              const b = randInt(rng, 1, 4);
              return num(t`$\vec F=(${2 * a}x,\,${2 * b}y)$ tem potencial $f=${a}x^2+${b}y^2$. Trabalho de $(0,\,0)$ a $(1,\,1)$:`, a + b, t`$f(1,1)-f(0,0)=${a + b}$.`);
            }),
            order(t`Ordene o cálculo do potencial de $(P,\,Q)$:`, [t`verificar $Q_x=P_y$`, t`integrar $P$ em $x$: $f=\int P\,dx+g(y)$`, t`derivar em $y$ e igualar a $Q$`, t`achar $g(y)$ e escrever $f$`], t`Teste, integra, compara, completa.`),
            num(t`Para $\left(\frac{-y}{x^2+y^2},\,\frac{x}{x^2+y^2}\right)$, o trabalho numa volta anti-horária em torno da origem vale (2 casas):`, 2 * Math.PI, t`$2\pi$: a origem é um "buraco", o teste local não basta.`, { tol: 0.01 }),
            multi(t`Quais campos são conservativos em $\mathbb R^2$?`, [t`$(y,\,x)$`, t`$(2x,\,1)$`, t`$(y,\,-x)$`, t`$(\cos y,\,-x\operatorname{sen}y)$`], [0, 1, 3], t`Teste $Q_x=P_y$: o terceiro dá $-1\ne1$.`),
            mcq(t`Em 3D, $\vec F$ (definido em todo o espaço) é conservativo se e somente se…`, ['∇ × F = 0', '∇ · F = 0', 'F é constante', '|F| = 1'], 0, t`Rotacional nulo numa região simplesmente conexa.`),
          ],
        },
      ],
    },
  ],
};

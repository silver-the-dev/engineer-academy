import React from 'react';
import type { UnitDef, VisualSpec } from '../../types';
import { gen, mcq, mcqS, num, tf, match, order, inter, plot, near } from '../../helpers';
import { ArcW, PolygonW } from '../../../components/plot/Plot';
import { Arrow3, Axes3, Line3, Point3, Poly3, type V3 } from '../../../components/visuals/Space3D';
import { C } from '../../../theme';
import { fmt, pick, randInt, randNZ } from '../../../lib/random';
import { FieldArrows } from './campos';

const t = String.raw;
const PI = Math.PI;
type Spec = VisualSpec & { props: Record<string, any> };

/** Green: square region split into n×n cells, each with its little circulation. */
const greenLab = () =>
  plot({
    view: { xMin: -3, xMax: 3, yMin: -3, yMax: 3 },
    equalAspect: true,
    params: [
      { key: 'b', label: 'b', min: -1, max: 1, step: 0.1, value: 0.6, color: C.p3 },
      { key: 'L', label: 'L', min: 1, max: 2.5, step: 0.1, value: 2, color: C.gold },
      { key: 'n', label: 'n', min: 1, max: 6, step: 1, value: 3, color: C.p5, format: (v: number) => String(v) },
    ],
    render: ({ p }: any) => {
      const n = Math.round(p.n);
      const h = (2 * p.L) / n;
      const cells: React.ReactNode[] = [];
      for (let i = 0; i < n; i++)
        for (let j = 0; j < n; j++) {
          const cx = -p.L + (i + 0.5) * h;
          const cy = -p.L + (j + 0.5) * h;
          if (Math.abs(p.b) > 0.01) cells.push(<ArcW key={i + '-' + j} cx={cx} cy={cy} r={h * 0.28} a0={p.b > 0 ? 0.3 : 5.98} a1={p.b > 0 ? 5.98 : 0.3} color={C.p3} width={1.6} />);
        }
      const sq: [number, number][] = [[-p.L, -p.L], [p.L, -p.L], [p.L, p.L], [-p.L, p.L]];
      return (
        <>
          <FieldArrows F={(x, y) => [-p.b * y, p.b * x]} p={p} v={{ xMin: -3, xMax: 3, yMin: -3, yMax: 3 }} color={C.textDim} n={8} />
          <PolygonW pts={sq} color={C.gold} opacity={0.12} stroke={C.gold} strokeWidth={3} />
          {cells}
        </>
      );
    },
    info: ({ p }: any) => t`$\vec F=${fmt(p.b, 1)}(-y,\,x)$ · $\oint_{\partial D}\vec F\cdot d\vec r=\iint_D 2b\,dA=2\cdot${fmt(p.b, 1)}\cdot(2\cdot${fmt(p.L, 1)})^2=${fmt(2 * p.b * (2 * p.L) ** 2, 2)}$ · as rodinhas internas se cancelam nas fronteiras comuns`,
  });

/** Flux of the uniform field (0,0,1) through a disk of radius 1.5 tilted by α. */
const fluxLab = (): Spec => ({
  name: 'space3d',
  props: {
    scale: 34,
    params: [{ key: 'al', label: '\\alpha', min: 0, max: 90, step: 5, value: 30, color: C.p5, format: (v: number) => v + '°' }],
    render: ({ p }: any) => {
      const a = (p.al * PI) / 180;
      const R = 1.5;
      const disk: V3[] = Array.from({ length: 32 }, (_, i) => {
        const s = (2 * PI * i) / 32;
        const x = R * Math.cos(s);
        const y = R * Math.sin(s);
        return [x * Math.cos(a), y, x * Math.sin(a) + 0.5] as V3;
      });
      const nrm: V3 = [-Math.sin(a), 0, Math.cos(a)];
      const arrows: React.ReactNode[] = [];
      for (let i = -1; i <= 1; i++)
        for (let j = -1; j <= 1; j++) arrows.push(<Arrow3 key={i + '_' + j} from={[i * 1.1, j * 1.1, -1.4]} to={[i * 1.1, j * 1.1, -0.4]} color={C.p2} width={2} />);
      return (
        <>
          <Axes3 size={2.4} />
          {arrows}
          <Poly3 pts={disk} color={C.gold} opacity={0.4} stroke={C.gold} />
          <Arrow3 from={[0, 0, 0.5]} to={[nrm[0] * 1.2, nrm[1] * 1.2, 0.5 + nrm[2] * 1.2]} color={C.danger} label="n" />
        </>
      );
    },
    info: ({ p }: any) => t`$\vec F=(0,\,0,\,1)$ (azul) · fluxo $=\iint\vec F\cdot\vec n\,dS=\pi R^2\cos\alpha=${fmt(PI * 2.25 * Math.cos((p.al * PI) / 180), 3)}$`,
  },
});

/** Stokes: cap z = h(1 - r^2) over the unit disk; same boundary for every h. */
const stokesLab = (): Spec => ({
  name: 'space3d',
  props: {
    scale: 40,
    params: [{ key: 'h', label: 'h', min: 0, max: 2, step: 0.1, value: 1.2, color: C.p3 }],
    render: ({ p }: any) => {
      const lines: React.ReactNode[] = [];
      for (let i = 1; i <= 5; i++) {
        const r = i / 5;
        const ring: V3[] = Array.from({ length: 33 }, (_, k) => [r * Math.cos((2 * PI * k) / 32), r * Math.sin((2 * PI * k) / 32), p.h * (1 - r * r)] as V3);
        ring.slice(1).forEach((q, k) => lines.push(<Line3 key={`r${i}-${k}`} a={ring[k]} b={q} color={i === 5 ? C.gold : C.p1} width={i === 5 ? 3.5 : 1} />));
      }
      for (let k = 0; k < 12; k++) {
        const s = (2 * PI * k) / 12;
        const mer: V3[] = Array.from({ length: 11 }, (_, i) => { const r = i / 10; return [r * Math.cos(s), r * Math.sin(s), p.h * (1 - r * r)] as V3; });
        mer.slice(1).forEach((q, i) => lines.push(<Line3 key={`m${k}-${i}`} a={mer[i]} b={q} color={C.p1} width={1} />));
      }
      const arrowsOnEdge = [0, 1, 2, 3].map((k) => {
        const s = (PI / 2) * k + 0.3;
        return <Arrow3 key={'e' + k} from={[Math.cos(s), Math.sin(s), 0]} to={[Math.cos(s) - 0.5 * Math.sin(s), Math.sin(s) + 0.5 * Math.cos(s), 0]} color={C.gold} width={2.5} />;
      });
      return (
        <>
          <Axes3 size={1.8} />
          {lines}
          {arrowsOnEdge}
        </>
      );
    },
    info: ({ p }: any) => t`$\vec F=(-y,\,x,\,0)$, $\nabla\times\vec F=(0,\,0,\,2)$ · superfície $z=${fmt(p.h, 1)}(1-r^2)$ · $\iint_S(\nabla\times\vec F)\cdot d\vec S=2\pi=\oint_{C}\vec F\cdot d\vec r$ para **qualquer** $h$`,
  },
});

/** Gauss: outward flux of F = (x, y, z) through a sphere of radius R. */
const gaussLab = (): Spec => ({
  name: 'space3d',
  props: {
    scale: 32,
    params: [{ key: 'R', label: 'R', min: 0.5, max: 2, step: 0.1, value: 1.4, color: C.gold }],
    render: ({ p }: any) => {
      const lines: React.ReactNode[] = [];
      for (let i = 1; i < 6; i++) {
        const ph = (PI * i) / 6;
        const ring: V3[] = Array.from({ length: 25 }, (_, k) => [p.R * Math.sin(ph) * Math.cos((2 * PI * k) / 24), p.R * Math.sin(ph) * Math.sin((2 * PI * k) / 24), p.R * Math.cos(ph)] as V3);
        ring.slice(1).forEach((q, k) => lines.push(<Line3 key={`p${i}-${k}`} a={ring[k]} b={q} color={C.p1} width={1} />));
      }
      for (let k = 0; k < 8; k++) {
        const s = (2 * PI * k) / 8;
        const mer: V3[] = Array.from({ length: 13 }, (_, i) => { const ph = (PI * i) / 12; return [p.R * Math.sin(ph) * Math.cos(s), p.R * Math.sin(ph) * Math.sin(s), p.R * Math.cos(ph)] as V3; });
        mer.slice(1).forEach((q, i) => lines.push(<Line3 key={`m${k}-${i}`} a={mer[i]} b={q} color={C.p1} width={1} />));
      }
      const dirs: V3[] = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1], [0.7, 0.7, 0], [-0.7, -0.7, 0]];
      const arrows = dirs.map((d, i) => <Arrow3 key={'a' + i} from={[d[0] * p.R, d[1] * p.R, d[2] * p.R]} to={[d[0] * p.R * 1.5, d[1] * p.R * 1.5, d[2] * p.R * 1.5]} color={C.danger} width={2.5} />);
      return (
        <>
          <Axes3 size={3} />
          {lines}
          {arrows}
          <Point3 at={[0, 0, 0]} color={C.gold} r={4} />
        </>
      );
    },
    info: ({ p }: any) => t`$\vec F=(x,\,y,\,z)$, $\nabla\cdot\vec F=3$ · fluxo $=\iiint3\,dV=3\cdot\frac43\pi R^3=4\pi R^3\approx${fmt(4 * PI * p.R ** 3, 2)}$`,
  },
});

export const teoremas: UnitDef = {
  id: 'v-teo',
  title: 'Green, Stokes e Gauss',
  subtitle: 'Fluxo, circulação e os grandes teoremas do cálculo vetorial',
  icon: '🌐',
  source: 'Cálculo 4 · Cálculo vetorial',
  guide: t`Os três teoremas dizem a mesma coisa em dimensões diferentes: **o que acontece na fronteira é a soma do que acontece dentro**. Green: circulação na borda de uma região plana = integral do rotacional. Stokes: o mesmo para uma superfície no espaço. Gauss (divergência): fluxo por uma superfície fechada = integral do divergente no volume. São generalizações do Teorema Fundamental do Cálculo.`,
  lessons: [
    {
      id: 'v-teo-green',
      title: 'Teorema de Green',
      parts: [
        {
          card: {
            title: 'Circulação na borda = rotação por dentro',
            body: t`Para uma região $D$ do plano com borda $C$ orientada no sentido **anti-horário**:

$$\oint_C P\,dx+Q\,dy=\iint_D\left(\frac{\partial Q}{\partial x}-\frac{\partial P}{\partial y}\right)dA$$

Intuição: divida $D$ em quadradinhos, cada um com sua pequena circulação ("rodinha"). Nas fronteiras internas as contribuições se **cancelam**; só sobra a borda externa. Aumente $n$:`,
            visual: greenLab(),
          },
          exercises: [
            tf(t`No teorema de Green, a curva $C$ deve ser percorrida no sentido anti-horário (região à esquerda).`, true, t`Essa é a orientação positiva.`),
            gen((rng) => {
              const b = randNZ(rng, -3, 3);
              const R = randInt(rng, 1, 4);
              return num(t`Use Green: $\oint_C(-${b}y)\,dx+(${b}x)\,dy$ na circunferência de raio $${R}$ (2 casas).`, 2 * b * PI * R * R, t`$Q_x-P_y=${b}+${b}=${2 * b}$; vezes a área $${R * R}\pi$: $\approx${fmt(2 * b * PI * R * R, 2)}$.`, { tol: 0.03 });
            }),
            inter(t`No lab, deixe o campo **sem rotação** ($b=0$): a circulação na borda zera.`, 'plot', greenLab().props, (v: any) => v && near(v.p.b, 0, 0.01), t`Rotacional nulo ⟹ circulação nula.`, t`Pelo Teorema de Green, a circulação na borda é $\iint(Q_x-P_y)\,dA$; sem rotação o integrando é zero.`),
            mcqS(t`$\oint_C x\,dy$ (anti-horário) é igual a:`, 'a área da região', ['zero', 'o perímetro', 'o dobro da área', 'a área com sinal trocado'], t`$P=0$, $Q=x$: $Q_x-P_y=1$.`),
            gen((rng) => {
              const a = randInt(rng, 1, 5);
              return num(t`Use Green para calcular $\oint_C x^2y\,dx+(x^3+${a}x)\,dy$ na borda do quadrado $[0,\,1]^2$, sentido anti-horário (3 casas).`, 2 / 3 + a, t`$Q_x-P_y=(3x^2+${a})-x^2=2x^2+${a}$; $\iint_{[0,1]^2}(2x^2+${a})\,dA=\frac23+${a}\approx${fmt(2 / 3 + a, 3)}$.`, { tol: 0.002 });
            }),
            num(t`Área da elipse $x=3\cos t$, $y=2\operatorname{sen}t$ via $\frac12\oint x\,dy-y\,dx$ (2 casas):`, 6 * PI, t`$\frac12\int_0^{2\pi}6(\cos^2t+\operatorname{sen}^2t)\,dt=6\pi\approx18{,}85$.`, { tol: 0.03 }),
            mcq(t`Se $\vec F$ é conservativo, Green dá $\oint_C\vec F\cdot d\vec r=$…`, ['0, pois Q_x − P_y = 0', 'a área', '2π', 'depende de C'], 0, t`Campo gradiente: rotacional zero.`),
            mcqS(t`O **planímetro**, instrumento que mede áreas percorrendo a borda de um mapa, funciona por causa de:`, 'Teorema de Green', ['Teorema de Pitágoras', 'Regra da cadeia', 'Teorema de Taylor', 'Lei de Hooke'], t`Área $=\oint x\,dy$.`),
          ],
        },
        {
          card: {
            title: 'Green na forma de fluxo',
            body: t`Trocando a componente tangente pela **normal**, Green também diz:

$$\oint_C\vec F\cdot\vec n\,ds=\iint_D\nabla\cdot\vec F\,dA$$

O fluxo **para fora** pela borda é a soma do divergente dentro: se só há fontes, sai fluido; se há sumidouros, entra. É a versão 2D do teorema de Gauss.`,
          },
          exercises: [
            gen((rng) => {
              const a = randNZ(rng, -3, 3);
              const R = randInt(rng, 1, 3);
              return num(t`Fluxo para fora de $\vec F=(${a}x,\,${a}y)$ pela circunferência de raio $${R}$ (2 casas):`, 2 * a * PI * R * R, t`$\nabla\cdot\vec F=${2 * a}$; vezes $${R * R}\pi$: $\approx${fmt(2 * a * PI * R * R, 2)}$.`, { tol: 0.03 });
            }),
            tf(t`O fluxo do campo de rotação $(-y,\,x)$ através de qualquer curva fechada é zero.`, true, t`Divergente zero.`),
            mcqS(t`Um campo com $\nabla\cdot\vec F<0$ em toda a região tem fluxo pela borda:`, 'negativo (entra fluido)', ['positivo', 'zero', 'infinito', 'depende da orientação de t'], t`Só há sumidouros dentro.`),
            match(t`Ligue cada forma de Green ao que ela mede:`, [
              [t`$\oint\vec F\cdot\vec T\,ds$`, 'circulação (giro)'],
              [t`$\oint\vec F\cdot\vec n\,ds$`, 'fluxo (vazão)'],
              [t`$Q_x-P_y$`, 'rotação local'],
              [t`$P_x+Q_y$`, 'expansão local'],
            ], t`Tangente ↔ rotacional; normal ↔ divergente.`),
            num(t`Fluxo para fora de $\vec F=(x,\,0)$ pelo quadrado $[0,\,2]^2$:`, 4, t`$\nabla\cdot\vec F=1$, área $4$.`),
            mcq(t`Por que o teorema de Green é uma "versão 2D" do Teorema Fundamental do Cálculo?`, ['relaciona a integral de uma derivada no interior com valores na fronteira', 'porque usa derivadas parciais', 'porque calcula áreas', 'não tem relação'], 0, t`TFC: $\int_a^bF'=F(b)-F(a)$ — interior ↔ fronteira.`),
            gen((rng) => {
              const k = randInt(rng, 1, 4);
              return num(t`Fluxo para fora de $\vec F=(${k}x,\,${k}y)$ pelo quadrado $[0,\,1]^2$:`, 2 * k, t`$\nabla\cdot\vec F=${2 * k}$, área $1$.`);
            }),
            tf(t`Num fluido incompressível sem fontes, a vazão que entra numa região é igual à que sai.`, true, t`$\nabla\cdot\vec v=0$ ⟹ fluxo total zero.`),
          ],
        },
      ],
    },
    {
      id: 'v-teo-sup',
      title: 'Integrais de superfície e fluxo',
      parts: [
        {
          card: {
            title: 'Superfícies parametrizadas',
            body: t`Uma superfície pode ser dada por $\vec r(u,v)$. Os vetores $\vec r_u$ e $\vec r_v$ são tangentes; o produto vetorial dá a **normal**:

$$\vec N=\vec r_u\times\vec r_v,\qquad dS=|\vec r_u\times\vec r_v|\,du\,dv$$

Para um gráfico $z=g(x,y)$: $dS=\sqrt{1+g_x^2+g_y^2}\,dA$. Área da superfície $=\iint dS$; massa de uma casca $=\iint\rho\,dS$.`,
            example: t`Esfera de raio $R$ com $(\varphi,\,\theta)$: $|\vec r_\varphi\times\vec r_\theta|=R^2\operatorname{sen}\varphi$ ⟹ área $\int_0^{2\pi}\!\int_0^\pi R^2\operatorname{sen}\varphi=4\pi R^2$.`,
          },
          exercises: [
            gen((rng) => {
              const R = randInt(rng, 1, 5);
              return num(t`Área da esfera de raio $${R}$ (2 casas):`, 4 * PI * R * R, t`$4\pi R^2=${4 * R * R}\pi\approx${fmt(4 * PI * R * R, 2)}$.`, { tol: 0.05 });
            }),
            mcqS(t`Para $z=g(x,y)$, o elemento de área é:`, t`$\sqrt{1+g_x^2+g_y^2}\,dA$`, [t`$dA$`, t`$(1+g_x+g_y)\,dA$`, t`$\sqrt{g_x^2+g_y^2}\,dA$`, t`$g\,dA$`], t`Vem de $|\vec r_x\times\vec r_y|$ com $\vec r=(x,\,y,\,g)$.`),
            num(t`Área do pedaço do plano $z=2x+2y$ acima do quadrado $[0,\,1]^2$:`, 3, t`$\sqrt{1+4+4}=3$, vezes área $1$.`),
            tf(t`O vetor $\vec r_u\times\vec r_v$ é perpendicular à superfície.`, true, t`É perpendicular aos dois vetores tangentes.`),
            mcqS(t`Para o cilindro $\vec r(\theta,z)=(R\cos\theta,\,R\operatorname{sen}\theta,\,z)$, $|\vec r_\theta\times\vec r_z|=$`, t`$R$`, [t`$1$`, t`$R^2$`, t`$z$`, t`$2\pi R$`], t`$\vec r_\theta=(-R\operatorname{sen}\theta,\,R\cos\theta,\,0)$, $\vec r_z=(0,\,0,\,1)$.`),
            gen((rng) => {
              const R = randInt(rng, 1, 4);
              const h = randInt(rng, 1, 5);
              return num(t`Área lateral do cilindro de raio $${R}$ e altura $${h}$ via $\int_0^{${h}}\!\int_0^{2\pi}${R}\,d\theta\,dz$ (2 casas):`, 2 * PI * R * h, t`$2\pi Rh\approx${fmt(2 * PI * R * h, 2)}$.`, { tol: 0.03 });
            }),
            mcq(t`A massa de uma casca esférica fina com densidade superficial $\sigma$ constante é…`, ['σ · 4πR²', 'σ · (4/3)πR³', 'σ · 2πR', 'σ'], 0, t`$\iint\sigma\,dS=\sigma\cdot$ área.`),
            num(t`Área do hemisfério superior de raio $3$ (2 casas):`, 18 * PI, t`$2\pi R^2=18\pi\approx56{,}55$.`, { tol: 0.05 }),
          ],
        },
        {
          card: {
            title: 'Fluxo através de uma superfície',
            body: t`Quanto de um fluido (ou campo) **atravessa** uma membrana $S$ com normal unitária $\vec n$:

$$\Phi=\iint_S\vec F\cdot\vec n\,dS=\iint\vec F(\vec r(u,v))\cdot(\vec r_u\times\vec r_v)\,du\,dv$$

Só conta a componente **normal** do campo: um disco paralelo ao escoamento não deixa passar nada. Incline o disco no fluxo vertical:`,
            visual: fluxLab(),
          },
          exercises: [
            inter(t`No lab, ache o ângulo em que o fluxo pelo disco é **zero**.`, 'space3d', fluxLab().props, (v: any) => v && near(v.p.al, 90, 0.5), t`$\alpha=90^\circ$: o disco fica paralelo ao campo.`, t`Fluxo $=\vec F\cdot\vec n\,A=|\vec F|A\cos\alpha$: zera em $\alpha=90^\circ$, quando o campo passa rente ao disco.`),
            gen((rng) => {
              const k = randInt(rng, 1, 5);
              const A = randInt(rng, 1, 6);
              return num(t`Campo uniforme $\vec F=(0,\,0,\,${k})$ através de uma placa horizontal de área $${A}$ (normal para cima):`, k * A, t`$\vec F\cdot\vec n=${k}$; vezes a área: $${k * A}$.`);
            }),
            num(t`Mesmo campo $(0,\,0,\,1)$, placa de área $2$ inclinada $60^\circ$:`, 1, t`$2\cos60^\circ=1$.`),
            tf(t`Invertendo a orientação da normal, o fluxo troca de sinal.`, true, t`$\vec n\to-\vec n$.`),
            mcqS(t`Fluxo de $\vec F=(x,\,y,\,z)$ pela esfera de raio $R$ (normal para fora), direto pela definição: em cada ponto $\vec F\cdot\vec n=$`, t`$R$`, [t`$1$`, t`$R^2$`, t`$0$`, t`$3$`], t`$\vec n=\frac{\vec r}{R}$, $\vec F\cdot\vec n=\frac{|\vec r|^2}{R}=R$. Fluxo $=R\cdot4\pi R^2$.`),
            gen((rng) => {
              const R = randInt(rng, 1, 3);
              return num(t`Logo, o fluxo de $(x,\,y,\,z)$ pela esfera de raio $${R}$ é (2 casas):`, 4 * PI * R ** 3, t`$R\cdot4\pi R^2=4\pi R^3\approx${fmt(4 * PI * R ** 3, 2)}$.`, { tol: 0.05 });
            }),
            mcq(t`Numa rede de pesca colocada num rio, o fluxo de água é máximo quando a rede está…`, ['perpendicular à correnteza', 'paralela à correnteza', 'inclinada 45°', 'tanto faz'], 0, t`$\cos\alpha=1$.`),
            match(t`Ligue a grandeza à integral:`, [
              ['área de superfície', t`$\iint_S dS$`],
              ['massa de uma casca', t`$\iint_S\rho\,dS$`],
              ['fluxo de um campo', t`$\iint_S\vec F\cdot\vec n\,dS$`],
              ['volume', t`$\iiint_E dV$`],
            ], t`Escalar × vetorial; superfície × volume.`),
          ],
        },
      ],
    },
    {
      id: 'v-teo-stokes',
      title: 'Teorema de Stokes',
      parts: [
        {
          card: {
            title: 'Green no espaço',
            body: t`Para uma superfície $S$ com borda $C$ (orientadas pela **regra da mão direita**: polegar na normal, dedos no sentido de $C$):

$$\oint_C\vec F\cdot d\vec r=\iint_S(\nabla\times\vec F)\cdot\vec n\,dS$$

Consequência surpreendente: o lado direito dá **o mesmo valor para qualquer superfície com a mesma borda**. Deforme o "chapéu":`,
            visual: stokesLab(),
          },
          exercises: [
            inter(t`No lab, achate o chapéu até virar o disco plano ($h=0$). O valor muda?`, 'space3d', stokesLab().props, (v: any) => v && near(v.p.h, 0, 0.01), t`Não: continua $2\pi$, pois a borda é a mesma.`, t`Pelo Teorema de Stokes, $\iint_S\operatorname{rot}\vec F\cdot d\vec S=\oint_C\vec F\cdot d\vec r$ só depende da borda $C$, que não mudou.`),
            tf(t`O teorema de Green é o caso particular de Stokes para superfícies planas no plano $xy$.`, true, t`Aí $\vec n=\vec k$ e $(\nabla\times\vec F)\cdot\vec k=Q_x-P_y$.`),
            gen((rng) => {
              const R = randInt(rng, 1, 4);
              return num(t`Circulação de $\vec F=(-y,\,x,\,0)$ na circunferência de raio $${R}$ no plano $z=5$ (2 casas):`, 2 * PI * R * R, t`$\nabla\times\vec F=(0,\,0,\,2)$; fluxo pelo disco: $2\cdot${R * R}\pi\approx${fmt(2 * PI * R * R, 2)}$.`, { tol: 0.03 });
            }),
            mcqS(t`Se $\nabla\times\vec F=\vec 0$ em todo o espaço, a circulação em qualquer curva fechada é:`, '0', ['2π', 'a área', 'infinita', 'depende da curva'], t`Stokes com integrando nulo.`),
            mcq(t`Pela regra da mão direita, se a borda é percorrida no sentido anti-horário visto de cima, a normal aponta…`, ['para cima', 'para baixo', 'para dentro', 'para o lado'], 0, t`Dedos no sentido da curva, polegar para cima.`),
            num(t`$\vec F=(0,\,x,\,0)$: quanto vale $(\nabla\times\vec F)_z$?`, 1, t`$\partial_x(x)-\partial_y(0)=1$.`),
            gen((rng) => {
              const a = randInt(rng, 1, 3);
              const b = randInt(rng, 1, 3);
              return num(t`Use Stokes: circulação de $\vec F=(0,\,x,\,0)$ na elipse $\frac{x^2}{${a * a}}+\frac{y^2}{${b * b}}=1$ (plano $xy$, anti-horário), 2 casas:`, PI * a * b, t`$(\nabla\times\vec F)\cdot\vec k=1$: dá a área $${a * b}\pi\approx${fmt(PI * a * b, 2)}$.`, { tol: 0.03 });
            }),
            mcqS(t`Uma rede de borboleta (superfície) com o mesmo aro (curva) que um disco: o fluxo do rotacional nos dois é:`, 'igual', ['maior na rede', 'maior no disco', 'sempre zero', 'não dá para comparar'], t`Ambos são iguais à circulação no aro.`),
          ],
        },
        {
          card: {
            title: 'Stokes na física',
            body: t`Stokes conecta as formas integral e diferencial das leis do eletromagnetismo:

• **Ampère**: $\oint_C\vec B\cdot d\vec r=\mu_0I$ ⟺ $\nabla\times\vec B=\mu_0\vec J$
• **Faraday**: $\oint_C\vec E\cdot d\vec r=-\frac{d\Phi_B}{dt}$ ⟺ $\nabla\times\vec E=-\frac{\partial\vec B}{\partial t}$

É por Faraday que geradores e transformadores funcionam: variar o fluxo magnético numa espira induz uma tensão nela.`,
            tip: t`"Circulação na borda = fluxo do rotacional": a forma local (rotacional) e a global (circulação) são a mesma lei.`,
          },
          exercises: [
            mcqS(t`Pela lei de Ampère, a circulação de $\vec B$ ao redor de um fio com corrente $I$ é:`, t`$\mu_0I$`, [t`$0$`, t`$I$`, t`$\frac{\mu_0}{I}$`, t`$2\pi I$`], t`$\oint\vec B\cdot d\vec r=\mu_0I$.`),
            gen((rng) => {
              const I = randInt(rng, 1, 10);
              const r = pick(rng, [0.01, 0.02, 0.05, 0.1]);
              const B = (4e-7 * PI * I) / (2 * PI * r);
              return num(t`Campo magnético a $${fmt(r)}$ m de um fio com $${I}$ A: $B=\frac{\mu_0I}{2\pi r}$ com $\mu_0=4\pi\cdot10^{-7}$. Em microtesla (μT), 2 casas:`, B * 1e6, t`$B=\frac{2\cdot10^{-7}\cdot${I}}{${fmt(r)}}\approx${fmt(B * 1e6, 2)}$ μT.`, { tol: 0.02 });
            }),
            tf(t`Um ímã parado dentro de uma espira parada induz corrente constante.`, false, t`Só há indução se o fluxo **variar** (Faraday).`),
            mcq(t`Transformadores só funcionam com corrente alternada porque…`, ['precisam de fluxo magnético variável', 'a corrente contínua é perigosa', 'o cobre não conduz CC', 'por convenção'], 0, t`$\frac{d\Phi}{dt}\ne0$.`),
            num(t`$\vec B$ uniforme com fluxo $\Phi=3t$ Wb através de uma espira. Módulo da tensão induzida (V):`, 3, t`$|\mathcal E|=\left|\frac{d\Phi}{dt}\right|=3$.`),
            match(t`Ligue a lei à forma diferencial:`, [
              ['Ampère', t`$\nabla\times\vec B=\mu_0\vec J$`],
              ['Faraday', t`$\nabla\times\vec E=-\partial_t\vec B$`],
              ['Gauss (elétrica)', t`$\nabla\cdot\vec E=\rho/\varepsilon_0$`],
              ['Gauss (magnética)', t`$\nabla\cdot\vec B=0$`],
            ], t`São as quatro equações de Maxwell.`),
            mcqS(t`Qual teorema transforma $\oint_C\vec E\cdot d\vec r$ em $\iint_S(\nabla\times\vec E)\cdot d\vec S$?`, 'Stokes', ['Gauss', 'Green na forma de fluxo', 'Fubini', 'Taylor'], t`Circulação ↔ rotacional.`),
            tf(t`$\nabla\cdot\vec B=0$ significa que não existem "cargas magnéticas" (monopolos) conhecidas.`, true, t`Linhas de campo magnético não começam nem terminam.`),
          ],
        },
      ],
    },
    {
      id: 'v-teo-gauss',
      title: 'Teorema da Divergência',
      parts: [
        {
          card: {
            title: 'O que sai = o que nasce dentro',
            body: t`Para um sólido $E$ com superfície fechada $S$ (normal para fora):

$$\iint_S\vec F\cdot\vec n\,dS=\iiint_E\nabla\cdot\vec F\,dV$$

O fluxo total que **sai** é a soma das fontes (divergente) **dentro**. Para $\vec F=(x,\,y,\,z)$, $\nabla\cdot\vec F=3$ em todo lugar:`,
            visual: gaussLab(),
          },
          exercises: [
            gen((rng) => {
              const R = randInt(rng, 1, 3);
              return num(t`Fluxo de $(x,\,y,\,z)$ para fora da esfera de raio $${R}$ via Gauss (2 casas):`, 4 * PI * R ** 3, t`$3\cdot\frac43\pi R^3=4\pi R^3\approx${fmt(4 * PI * R ** 3, 2)}$.`, { tol: 0.05 });
            }),
            inter(t`No lab, ajuste o raio para o fluxo valer $4\pi\approx12{,}57$.`, 'space3d', gaussLab().props, (v: any) => v && near(v.p.R, 1, 0.01), t`$4\pi R^3=4\pi\Rightarrow R=1$.`, t`Pelo Teorema de Gauss, fluxo $=\iiint\operatorname{div}\vec F\,dV=3\cdot\frac43\pi R^3=4\pi R^3$; vale $4\pi$ com $R=1$.`),
            num(t`Fluxo de $\vec F=(x,\,0,\,0)$ para fora do cubo $[0,\,2]^3$:`, 8, t`$\nabla\cdot\vec F=1$, volume $8$.`),
            gen((rng) => {
              const a = randInt(rng, 1, 3);
              const b = randInt(rng, 1, 3);
              const c = randInt(rng, 1, 3);
              const L = randInt(rng, 1, 3);
              return num(t`Fluxo de $\vec F=(${a}x,\,${b}y,\,${c}z)$ para fora do cubo $[0,\,${L}]^3$:`, (a + b + c) * L ** 3, t`$\nabla\cdot\vec F=${a + b + c}$, volume $${L ** 3}$.`);
            }),
            tf(t`Para um campo com divergente zero, o fluxo por qualquer superfície fechada é zero.`, true, t`$\iiint0\,dV=0$.`),
            mcqS(t`Fluxo do campo de rotação $(-y,\,x,\,0)$ por uma esfera:`, '0', ['4π', '2π', '8π/3', 'depende do raio'], t`$\nabla\cdot\vec F=0$.`),
            num(t`Fluxo de $\vec F=(x^2,\,0,\,0)$ para fora do cubo $[0,\,1]^3$:`, 1, t`$\iiint2x\,dV=1$.`),
            mcq(t`O teorema da divergência transforma uma integral de **superfície** em uma integral…`, ['de volume', 'de linha', 'dupla no plano xy', 'simples'], 0, t`Fronteira (2D) ↔ interior (3D).`),
          ],
        },
        {
          card: {
            title: 'Lei de Gauss e o mapa dos teoremas',
            body: t`**Lei de Gauss**: o fluxo elétrico por qualquer superfície fechada é $\frac{Q_{\text{int}}}{\varepsilon_0}$. Por simetria, isso dá o campo de uma carga: $E\cdot4\pi r^2=\frac{Q}{\varepsilon_0}\Rightarrow E=\frac{Q}{4\pi\varepsilon_0r^2}$.

Os grandes teoremas formam uma família — sempre **fronteira** ↔ **interior**:
• TFC: $\int_a^bf'=f(b)-f(a)$
• Linha: $\int_C\nabla f\cdot d\vec r=f(B)-f(A)$
• Green/Stokes: $\oint_C\vec F\cdot d\vec r=\iint_S(\nabla\times\vec F)\cdot d\vec S$
• Gauss: $\iint_S\vec F\cdot d\vec S=\iiint_E\nabla\cdot\vec F\,dV$`,
          },
          exercises: [
            match(t`Ligue o teorema ao par fronteira ↔ interior:`, [
              ['TFC', 'pontas de um intervalo ↔ intervalo'],
              ['Teorema das integrais de linha', 'pontas de uma curva ↔ curva'],
              ['Stokes', 'curva fechada ↔ superfície'],
              ['Gauss', 'superfície fechada ↔ sólido'],
            ], t`Todos dizem: integral de uma "derivada" no interior = valores na fronteira.`),
            tf(t`Pela lei de Gauss, o fluxo elétrico por uma esfera não depende do raio dela (com a mesma carga dentro).`, true, t`Só importa $Q_{\text{int}}$.`),
            mcqS(t`O campo de uma carga pontual decai como:`, t`$\frac{1}{r^2}$`, [t`$\frac1r$`, t`$\frac{1}{r^3}$`, t`$e^{-r}$`, 'não decai'], t`$E\cdot4\pi r^2$ constante.`),
            gen((rng) => {
              const k = randInt(rng, 2, 4);
              return num(t`Afastando-se de uma carga pontual $${k}$ vezes mais, o campo elétrico fica dividido por:`, k * k, t`$\frac{1}{r^2}$: dividido por $${k * k}$.`);
            }),
            mcq(t`Uma superfície fechada sem carga dentro tem fluxo elétrico…`, ['zero (o que entra, sai)', 'positivo', 'negativo', 'infinito'], 0, t`$Q_{\text{int}}=0$.`),
            order(t`Ordene do **menor** para o **maior** número de dimensões do domínio de integração do lado "interior":`, ['TFC (intervalo, 1D)', 'Green/Stokes (superfície, 2D)', 'Gauss (sólido, 3D)'], t`1D, 2D, 3D.`),
            mcqS(t`Qual teorema usar para trocar o fluxo de $\vec F$ por um cubo fechado por uma integral tripla?`, 'Divergência (Gauss)', ['Stokes', 'Green', 'Fubini', 'TFC'], t`Superfície fechada ↔ volume.`),
            num(t`Uma carga de $\varepsilon_0$ coulombs dentro de uma superfície fechada produz fluxo elétrico de quanto?`, 1, t`$\Phi=\frac{Q}{\varepsilon_0}=1$.`),
          ],
        },
      ],
    },
  ],
};

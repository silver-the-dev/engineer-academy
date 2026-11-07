import React from 'react';
import type { UnitDef } from '../../types';
import { gen, mcq, mcqS, num, tf, match, inter, plot, rmcq, near } from '../../helpers';
import { ArcW, Label, PolygonW, Seg } from '../../../components/plot/Plot';
import { C } from '../../../theme';
import { fmt, pick, randInt, randNZ, term } from '../../../lib/random';
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

const TRI = [[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25]] as const;
const fr = (p: number, q: number) => `\\frac{${p}}{${q}}`;
/** exact values: degrees -> [sen, cos] as TeX */
const NOTAVEIS: Record<number, [string, string]> = {
  0: ['0', '1'],
  30: ['\\frac12', '\\frac{\\sqrt3}{2}'],
  45: ['\\frac{\\sqrt2}{2}', '\\frac{\\sqrt2}{2}'],
  60: ['\\frac{\\sqrt3}{2}', '\\frac12'],
  90: ['1', '0'],
};
const neg = (s: string) => (s === '0' ? '0' : `-${s}`);
/** sen/cos of angles that reduce to 30/45/60 */
function trigVal(deg: number, fn: 'sen' | 'cos'): string {
  const q = Math.floor(deg / 90) % 4;
  const r =q === 0 ? deg : q === 1 ? 180 - deg : q === 2 ? deg - 180 : 360 - deg;
  const [s, c] = NOTAVEIS[r];
  const sinPos = q === 0 || q === 1;
  const cosPos = q === 0 || q === 3;
  return fn === 'sen' ? (sinPos ? s : neg(s)) : cosPos ? c : neg(c);
}
const ALL_VALS = ['0', '1', '-1', '\\frac12', '-\\frac12', '\\frac{\\sqrt2}{2}', '-\\frac{\\sqrt2}{2}', '\\frac{\\sqrt3}{2}', '-\\frac{\\sqrt3}{2}'];

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
      parts: [
        {
          card: {
            title: 'SOH-CAH-TOA',
            body: t`$$\operatorname{sen}\theta=\frac{\text{oposto}}{\text{hipotenusa}}\quad \cos\theta=\frac{\text{adjacente}}{\text{hipotenusa}}\quad \operatorname{tg}\theta=\frac{\text{oposto}}{\text{adjacente}}$$

Mude o ângulo e veja as razões:`,
            visual: rightTriangle(),
            tip: t`A hipotenusa é sempre o maior lado, então seno e cosseno ficam entre $0$ e $1$ no triângulo retângulo.`,
          },
          exercises: [
            mcq(t`Num triângulo retângulo, o lado oposto ao ângulo reto se chama…`, ['hipotenusa', 'cateto oposto', 'cateto adjacente', 'altura'], 0, t`A hipotenusa fica "de frente" para o ângulo de $90^\circ$.`),
            gen((rng) => {
              const [a, b, c] = pick(rng, TRI);
              return rmcq(rng, t`Num triângulo retângulo, o cateto oposto a $\theta$ mede $${a}$, o adjacente mede $${b}$ e a hipotenusa $${c}$. Quanto vale $\operatorname{sen}\theta$?`, `$${fr(a, c)}$`, [`$${fr(b, c)}$`, `$${fr(a, b)}$`, `$${fr(c, a)}$`], t`$\operatorname{sen}\theta=\frac{\text{oposto}}{\text{hipotenusa}}=${fr(a, c)}$.`);
            }),
            gen((rng) => {
              const [a, b, c] = pick(rng, TRI);
              return rmcq(rng, t`No mesmo tipo de triângulo (oposto $${a}$, adjacente $${b}$, hipotenusa $${c}$), quanto vale $\cos\theta$?`, `$${fr(b, c)}$`, [`$${fr(a, c)}$`, `$${fr(b, a)}$`, `$${fr(c, b)}$`], t`$\cos\theta=\frac{\text{adjacente}}{\text{hipotenusa}}=${fr(b, c)}$.`);
            }),
            gen((rng) => {
              const [a, b, c] = pick(rng, TRI);
              return rmcq(rng, t`Com cateto oposto $${a}$, adjacente $${b}$ e hipotenusa $${c}$, quanto vale $\operatorname{tg}\theta$?`, `$${fr(a, b)}$`, [`$${fr(b, a)}$`, `$${fr(a, c)}$`, `$${fr(b, c)}$`], t`$\operatorname{tg}\theta=\frac{\text{oposto}}{\text{adjacente}}=${fr(a, b)}$.`);
            }),
            inter(t`Ajuste o ângulo para que $\operatorname{sen}\theta=\cos\theta$.`, 'plot', rightTriangle().props, (v: any) => v && v.p.th === 45, '$\\theta=45^\\circ$', t`Com $45^\circ$ os dois catetos são iguais.`),
            tf(t`Num triângulo retângulo, $\operatorname{sen}\theta$ pode ser maior que $1$.`, false, t`O oposto nunca é maior que a hipotenusa.`),
            gen((rng) => {
              const h = pick(rng, [5, 10, 15, 20]);
              const s = pick(rng, [0.6, 0.8]);
              return num(t`A hipotenusa de um triângulo retângulo mede $${h}$ e $\operatorname{sen}\theta=${fmt(s)}$. Quanto mede o cateto oposto a $\theta$?`, h * s, t`oposto $=${h}\cdot${fmt(s)}=${fmt(h * s)}$.`);
            }),
            gen((rng) => {
              const [a, b, c] = pick(rng, TRI);
              return rmcq(rng, t`Se $\operatorname{tg}\theta=${fr(a, b)}$ (com $\theta$ agudo), quanto vale $\operatorname{sen}\theta$?`, `$${fr(a, c)}$`, [`$${fr(b, c)}$`, `$${fr(a, b + 1)}$`, `$${fr(c, a)}$`], t`Monte o triângulo com oposto $${a}$ e adjacente $${b}$: hipotenusa $\sqrt{${a * a}+${b * b}}=${c}$, então $\operatorname{sen}\theta=${fr(a, c)}$.`);
            }),
          ],
        },
        {
          card: {
            title: 'Ângulos notáveis',
            body: t`• $\operatorname{sen}30^\circ=\frac12$, $\operatorname{sen}45^\circ=\frac{\sqrt2}2$, $\operatorname{sen}60^\circ=\frac{\sqrt3}2$
• $\cos30^\circ=\frac{\sqrt3}2$, $\cos45^\circ=\frac{\sqrt2}2$, $\cos60^\circ=\frac12$
• $\operatorname{tg}30^\circ=\frac{\sqrt3}3$, $\operatorname{tg}45^\circ=1$, $\operatorname{tg}60^\circ=\sqrt3$`,
            tip: t`Truque: os senos de 30°, 45°, 60° são $\frac{\sqrt1}{2},\frac{\sqrt2}{2},\frac{\sqrt3}{2}$; os cossenos são a mesma lista ao contrário.`,
          },
          exercises: [
            mcqS(t`Quanto vale $\cos 60^\circ$?`, t`$\frac12$`, [t`$\frac{\sqrt3}{2}$`, t`$\frac{\sqrt2}{2}$`, t`$1$`], t`$\cos60^\circ=\operatorname{sen}30^\circ=\frac12$.`),
            match(t`Ligue os valores:`, [
              [t`$\operatorname{sen}30^\circ$`, t`$\frac12$`],
              [t`$\operatorname{tg}45^\circ$`, '$1$'],
              [t`$\cos30^\circ$`, t`$\frac{\sqrt3}{2}$`],
              [t`$\operatorname{tg}60^\circ$`, t`$\sqrt3$`],
            ]),
            gen((rng) => {
              const g = pick(rng, [30, 45, 60]);
              const fn = pick(rng, ['sen', 'cos'] as const);
              const ans = NOTAVEIS[g][fn === 'sen' ? 0 : 1];
              const fnTex = fn === 'sen' ? '\\operatorname{sen}' : '\\cos';
              return rmcq(rng, t`Quanto vale $${fnTex}${g}^\circ$?`, `$${ans}$`, ['\\frac12', '\\frac{\\sqrt2}{2}', '\\frac{\\sqrt3}{2}', '1'].filter((v) => v !== ans).map((v) => `$${v}$`), t`Pela tabela dos ângulos notáveis: $${ans}$.`);
            }),
            gen((rng) => {
              const h = pick(rng, [10, 20, 30, 50]);
              return num(t`Uma escada de $${h}$ m está apoiada num muro, formando $30^\circ$ com o chão. A que altura ela toca o muro?`, h / 2, t`altura $=${h}\cdot\operatorname{sen}30^\circ=${h}\cdot\frac12=${h / 2}$ m.`, { unit: 'm' });
            }),
            num(t`De um ponto a $20$ m de um prédio, vê-se o topo sob $45^\circ$. Qual a altura do prédio?`, 20, t`$\operatorname{tg}45^\circ=\frac{h}{20}=1\Rightarrow h=20$ m.`, { unit: 'm' }),
            gen((rng) => {
              const L = pick(rng, [4, 6, 8, 10]);
              return num(t`Uma rampa de $${L}$ m de comprimento faz $60^\circ$ com o chão. Qual a altura que ela alcança? (2 casas)`, (L * Math.sqrt(3)) / 2, t`$${L}\cdot\operatorname{sen}60^\circ=${L}\cdot\frac{\sqrt3}{2}=${L / 2}\sqrt3\approx${fmt((L * Math.sqrt(3)) / 2, 2)}$ m.`, { tol: 0.01, unit: 'm' });
            }),
            gen((rng) => {
              const h = pick(rng, [3, 6, 9, 12]);
              return num(t`Um poste de $${h}$ m projeta uma sombra quando o Sol está a $60^\circ$ de elevação. Qual o comprimento da sombra? (2 casas)`, h / Math.sqrt(3), t`$\operatorname{tg}60^\circ=\frac{${h}}{s}\Rightarrow s=\frac{${h}}{\sqrt3}\approx${fmt(h / Math.sqrt(3), 2)}$ m.`, { tol: 0.01, unit: 'm' });
            }),
            num(t`De dois pontos A e B, alinhados com a base de uma torre e distantes $20$ m entre si, vê-se o topo sob $30^\circ$ (de A, mais longe) e $60^\circ$ (de B). Qual a altura da torre? (2 casas)`, 10 * Math.sqrt(3), t`Com $x$ = distância de B até a torre: $h=x\sqrt3$ e $h=\frac{x+20}{\sqrt3}$. Igualando: $3x=x+20\Rightarrow x=10$, $h=10\sqrt3\approx17{,}32$ m.`, { tol: 0.05, unit: 'm' }),
          ],
        },
        {
          card: {
            title: 'Leis dos senos e dos cossenos',
            body: t`Para **qualquer** triângulo de lados $a,b,c$ opostos aos ângulos $A,B,C$:

$$\frac{a}{\operatorname{sen}A}=\frac{b}{\operatorname{sen}B}=\frac{c}{\operatorname{sen}C}$$
$$c^2=a^2+b^2-2ab\cos C$$

A lei dos cossenos generaliza Pitágoras: com $C=90^\circ$, $\cos C=0$.`,
            tip: t`Dois lados e o ângulo **entre eles**? Lei dos cossenos. Um lado e os ângulos? Lei dos senos.`,
          },
          exercises: [
            tf(t`Se $C=90^\circ$, a lei dos cossenos vira o teorema de Pitágoras.`, true, t`$\cos90^\circ=0$ e sobra $c^2=a^2+b^2$.`),
            mcq(t`Para achar o terceiro lado conhecendo dois lados e o ângulo **entre** eles, use…`, ['a lei dos cossenos', 'a lei dos senos', 'só Pitágoras', 'a tangente'], 0, t`$c^2=a^2+b^2-2ab\cos C$ usa exatamente esses dados.`),
            mcq(t`Num triângulo de lados $3$, $5$ e $7$, o **maior** ângulo é oposto ao lado…`, ['$7$', '$3$', '$5$', 'todos iguais'], 0, t`Maior lado, maior ângulo oposto.`),
            gen((rng) => {
              const [a, b, c] = pick(rng, [[3, 8, 7], [5, 8, 7], [7, 15, 13], [8, 15, 13], [10, 16, 14], [6, 16, 14]] as const);
              return num(t`Num triângulo, dois lados medem $${a}$ e $${b}$ e o ângulo entre eles é $60^\circ$. Quanto mede o terceiro lado?`, c, t`$c^2=${a * a}+${b * b}-2\cdot${a}\cdot${b}\cdot\frac12=${c * c}\Rightarrow c=${c}$.`);
            }),
            gen((rng) => {
              const [a, b, c] = pick(rng, [[3, 5, 7], [7, 8, 13], [5, 16, 19], [5, 3, 7]] as const);
              return num(t`Dois lados de um triângulo medem $${a}$ e $${b}$, com $120^\circ$ entre eles. Quanto mede o terceiro lado?`, c, t`$\cos120^\circ=-\frac12$: $c^2=${a * a}+${b * b}+${a * b}=${c * c}\Rightarrow c=${c}$.`);
            }),
            gen((rng) => {
              const a = pick(rng, [3, 4, 5, 6, 8]);
              return num(t`Num triângulo, o lado $a=${a}$ é oposto a $A=30^\circ$ e o lado $b$ é oposto a $B=90^\circ$. Quanto mede $b$?`, 2 * a, t`$\frac{${a}}{\operatorname{sen}30^\circ}=\frac{b}{\operatorname{sen}90^\circ}\Rightarrow b=\frac{${a}}{1/2}=${2 * a}$.`);
            }),
            num(t`Um triângulo tem lados $5$, $7$ e $8$. Quanto mede, em graus, o ângulo oposto ao lado $7$?`, 60, t`$49=25+64-80\cos\theta\Rightarrow\cos\theta=\frac{40}{80}=\frac12\Rightarrow\theta=60^\circ$.`, { unit: '°' }),
            num(t`Dois navios saem do mesmo porto em rotas que formam $60^\circ$. Depois de um tempo, um está a $3$ km do porto e o outro a $8$ km. Qual a distância entre eles?`, 7, t`$d^2=9+64-2\cdot3\cdot8\cdot\frac12=49\Rightarrow d=7$ km.`, { unit: 'km' }),
          ],
        },
      ],
    },
    {
      id: 'f-trig-ciclo',
      title: 'Ciclo trigonométrico e radianos',
      parts: [
        {
          card: {
            title: 'O círculo de raio 1',
            body: t`Gire o ponto $P$ no círculo de raio 1. O **cosseno** é a coordenada $x$ (azul) e o **seno** é a coordenada $y$ (rosa).

Por Pitágoras: $$\operatorname{sen}^2\theta+\cos^2\theta=1$$`,
            visual: unitCircleLab(),
          },
          exercises: [
            mcq(t`No ciclo trigonométrico, o cosseno de um ângulo é a coordenada…`, ['$x$ do ponto', '$y$ do ponto', 'distância até a origem', 'inclinação do raio'], 0, t`Cosseno no eixo horizontal, seno no vertical.`),
            tf(t`$\operatorname{sen}(\pi)=0$`, true, t`$\pi$ rad $=180^\circ$: o ponto é $(-1,\,0)$, altura zero.`),
            inter(t`Arraste $P$ até o ângulo de $90^\circ$.`, 'plot', unitCircleLab().props, (v: any) => v && near(v.pts.P.x, 0, 0.05) && v.pts.P.y > 0.99, t`$P=(0,\,1)$`),
            inter(t`Arraste $P$ para um ponto onde $\cos\theta=-1$.`, 'plot', unitCircleLab().props, (v: any) => v && v.pts.P.x < -0.995, t`$\theta=180^\circ$, $P=(-1,\,0)$`),
            mcq(t`Quais valores $\operatorname{sen}\theta$ pode assumir?`, ['qualquer valor entre $-1$ e $1$', 'qualquer número real', 'só valores positivos', 'só $0$ e $1$'], 0, t`É a altura de um ponto num círculo de raio 1.`),
            num(t`Se $\operatorname{sen}\theta=0{,}6$ e $\theta$ está no 1º quadrante, quanto vale $\cos\theta$?`, 0.8, t`$\cos\theta=\sqrt{1-0{,}36}=0{,}8$.`),
            gen((rng) => {
              const [a, b, c] = pick(rng, TRI);
              return num(t`Se $\cos\theta=${fr(b, c)}$ e $\theta$ está no 1º quadrante, quanto vale $\operatorname{sen}\theta$? (fração ou decimal)`, a / c, t`$\operatorname{sen}\theta=\sqrt{1-\frac{${b * b}}{${c * c}}}=\sqrt{\frac{${a * a}}{${c * c}}}=${fr(a, c)}$.`, { tol: 0.002 });
            }),
            gen((rng) => {
              const [a, b, c] = pick(rng, TRI);
              const q = pick(rng, [2, 3] as const);
              return num(t`Se $\operatorname{sen}\theta=${q === 2 ? '' : '-'}${fr(a, c)}$ e $\theta$ está no ${q}º quadrante, quanto vale $\cos\theta$? (fração ou decimal)`, -b / c, t`$|\cos\theta|=\sqrt{1-\frac{${a * a}}{${c * c}}}=${fr(b, c)}$, e no ${q}º quadrante o cosseno é **negativo**: $-${fr(b, c)}$.`, { tol: 0.002 });
            }),
          ],
        },
        {
          card: {
            title: 'Radianos',
            body: t`Um radiano é o ângulo cujo arco tem o comprimento do raio. Uma volta: $2\pi$ rad $=360^\circ$.

$$\theta_{rad}=\theta_{graus}\cdot\frac{\pi}{180}$$

$90^\circ=\frac\pi2$, $180^\circ=\pi$, $270^\circ=\frac{3\pi}{2}$. O comprimento de um arco é $s=r\,\theta$ (com $\theta$ em radianos).`,
          },
          exercises: [
            gen((rng) => {
              const g = pick(rng, [30, 45, 60, 90, 120, 135, 150, 180, 270]);
              const map: Record<number, string> = { 30: '\\frac{\\pi}{6}', 45: '\\frac{\\pi}{4}', 60: '\\frac{\\pi}{3}', 90: '\\frac{\\pi}{2}', 120: '\\frac{2\\pi}{3}', 135: '\\frac{3\\pi}{4}', 150: '\\frac{5\\pi}{6}', 180: '\\pi', 270: '\\frac{3\\pi}{2}' };
              const wrong = Object.values(map).filter((v) => v !== map[g]);
              return rmcq(rng, t`Converta $${g}^\circ$ para radianos.`, `$${map[g]}$`, wrong.map((w) => `$${w}$`), t`$${g}\cdot\frac{\pi}{180}=${map[g]}$.`);
            }),
            gen((rng) => {
              const [tex, g] = pick(rng, [['\\frac{\\pi}{6}', 30], ['\\frac{\\pi}{4}', 45], ['\\frac{2\\pi}{3}', 120], ['\\frac{5\\pi}{4}', 225], ['\\frac{7\\pi}{6}', 210], ['\\frac{5\\pi}{3}', 300]] as const);
              return num(t`Converta $${tex}$ rad para graus.`, g, t`Troque $\pi$ por $180^\circ$: $${g}^\circ$.`, { unit: '°' });
            }),
            tf(t`$1$ radiano vale aproximadamente $57{,}3^\circ$.`, true, t`$\frac{180^\circ}{\pi}\approx57{,}3^\circ$.`),
            num(t`Quantos radianos tem uma volta completa? (2 casas)`, 2 * Math.PI, t`$2\pi\approx6{,}28$.`, { tol: 0.01 }),
            gen((rng) => {
              const [g, tex] = pick(rng, [[72, '\\frac{2\\pi}{5}'], [36, '\\frac{\\pi}{5}'], [20, '\\frac{\\pi}{9}'], [240, '\\frac{4\\pi}{3}'], [315, '\\frac{7\\pi}{4}']] as const);
              return rmcq(rng, t`Converta $${g}^\circ$ para radianos.`, `$${tex}$`, ['\\frac{2\\pi}{5}', '\\frac{\\pi}{5}', '\\frac{\\pi}{9}', '\\frac{4\\pi}{3}', '\\frac{7\\pi}{4}', '\\frac{5\\pi}{4}'].filter((v) => v !== tex).map((v) => `$${v}$`), t`$${g}\cdot\frac{\pi}{180}=${tex}$.`);
            }),
            gen((rng) => {
              const r = randInt(rng, 2, 10);
              const [th, tex] = pick(rng, [[Math.PI / 2, '\\frac{\\pi}{2}'], [Math.PI, '\\pi'], [Math.PI / 3, '\\frac{\\pi}{3}'], [2, '2']] as const);
              return num(t`Qual o comprimento do arco de ângulo $${tex}$ rad numa circunferência de raio $${r}$? (2 casas)`, r * th, t`$s=r\theta=${r}\cdot${tex}\approx${fmt(r * th, 2)}$.`, { tol: 0.01 });
            }),
            gen((rng) => {
              const r = pick(rng, [0.3, 0.5, 0.7]);
              const n = pick(rng, [5, 10, 20]);
              return num(t`Uma roda de raio $${fmt(r)}$ m dá $${n}$ voltas sem deslizar. Que distância ela percorre? (2 casas)`, 2 * Math.PI * r * n, t`Cada volta: $2\pi\cdot${fmt(r)}$. Total: $${n}\cdot2\pi\cdot${fmt(r)}\approx${fmt(2 * Math.PI * r * n, 2)}$ m.`, { tol: 0.05, unit: 'm' });
            }),
            num(t`Um ventilador gira a $3$ voltas por segundo. Quantos radianos ele gira em $1$ segundo? (2 casas)`, 6 * Math.PI, t`$3\cdot2\pi=6\pi\approx18{,}85$ rad.`, { tol: 0.02 }),
          ],
        },
        {
          card: {
            title: 'Simetrias e redução ao 1º quadrante',
            body: t`Ângulos dos outros quadrantes têm os mesmos valores (a menos do sinal) de um ângulo do 1º:

• 2º quadrante: $180^\circ-\theta$ · 3º: $180^\circ+\theta$ · 4º: $360^\circ-\theta$

Sinais: 1º tudo positivo; 2º só **seno**; 3º só **tangente**; 4º só **cosseno**.`,
            example: t`$\operatorname{sen}150^\circ=\operatorname{sen}30^\circ=\frac12$ e $\cos150^\circ=-\cos30^\circ=-\frac{\sqrt3}{2}$.`,
            tip: t`Ângulo negativo: $\cos(-\theta)=\cos\theta$ e $\operatorname{sen}(-\theta)=-\operatorname{sen}\theta$.`,
          },
          exercises: [
            mcqS(t`Em qual quadrante o seno é positivo e o cosseno é negativo?`, '2º quadrante', ['1º quadrante', '3º quadrante', '4º quadrante'], t`2º quadrante: $x<0$ e $y>0$.`),
            tf(t`$\cos120^\circ=-\frac12$`, true, t`$120^\circ=180^\circ-60^\circ$, no 2º quadrante o cosseno é negativo: $-\cos60^\circ=-\frac12$.`),
            gen((rng) => {
              const g = pick(rng, [120, 135, 150, 210, 225, 240, 300, 315, 330]);
              return num(t`Qual ângulo do 1º quadrante tem os mesmos valores trigonométricos (a menos do sinal) que $${g}^\circ$?`, g < 180 ? 180 - g : g < 270 ? g - 180 : 360 - g, t`${g < 180 ? `$180^\\circ-${g}^\\circ$` : g < 270 ? `$${g}^\\circ-180^\\circ$` : `$360^\\circ-${g}^\\circ$`} $=${g < 180 ? 180 - g : g < 270 ? g - 180 : 360 - g}^\circ$.`, { unit: '°' });
            }),
            gen((rng) => {
              const g = pick(rng, [120, 135, 150, 210, 225, 240, 300, 315, 330]);
              const ans = trigVal(g, 'sen');
              return rmcq(rng, t`Quanto vale $\operatorname{sen}${g}^\circ$?`, `$${ans}$`, ALL_VALS.filter((v) => v !== ans).map((v) => `$${v}$`), t`Reduza ao 1º quadrante e ajuste o sinal do quadrante: $${ans}$.`);
            }),
            mcq(t`Qual o sinal de $\operatorname{tg}200^\circ$?`, ['positivo', 'negativo', 'zero', 'não existe'], 0, t`$200^\circ$ está no 3º quadrante, onde seno e cosseno são negativos: a tangente (razão) é positiva.`),
            gen((rng) => {
              const g = pick(rng, [120, 135, 150, 210, 225, 240, 300, 315, 330]);
              const ans = trigVal(g, 'cos');
              return rmcq(rng, t`Quanto vale $\cos${g}^\circ$?`, `$${ans}$`, ALL_VALS.filter((v) => v !== ans).map((v) => `$${v}$`), t`Reduza ao 1º quadrante e ajuste o sinal do quadrante: $${ans}$.`);
            }),
            gen((rng) => {
              const g = pick(rng, [30, 45, 60]);
              const fn = pick(rng, ['sen', 'cos'] as const);
              const isTrue = rng() < 0.5;
              const claim = fn === 'cos' ? (isTrue ? `\\cos(-${g}^\\circ)=\\cos${g}^\\circ` : `\\cos(-${g}^\\circ)=-\\cos${g}^\\circ`) : isTrue ? `\\operatorname{sen}(-${g}^\\circ)=-\\operatorname{sen}${g}^\\circ` : `\\operatorname{sen}(-${g}^\\circ)=\\operatorname{sen}${g}^\\circ`;
              return tf(`$${claim}$`, isTrue, t`O cosseno é **par** ($\cos(-\theta)=\cos\theta$) e o seno é **ímpar** ($\operatorname{sen}(-\theta)=-\operatorname{sen}\theta$).`);
            }),
            num(t`Calcule $\operatorname{sen}30^\circ+\cos120^\circ+\operatorname{tg}225^\circ$.`, 1, t`$\frac12+\left(-\frac12\right)+1=1$ (a $\operatorname{tg}225^\circ=\operatorname{tg}45^\circ=1$, positiva no 3º quadrante).`),
          ],
        },
      ],
    },
    {
      id: 'f-trig-func',
      title: 'Funções trigonométricas',
      parts: [
        {
          card: {
            title: 'A onda senoidal',
            body: t`Girando sem parar, a altura de $P$ desenha a senoide:

• $\operatorname{sen}x$ e $\cos x$ variam entre $-1$ e $1$ e se repetem a cada $2\pi$
• $\operatorname{sen}x=0$ em $x=0,\ \pi,\ 2\pi,\ldots$
• $\cos x$ é a mesma onda deslocada: $\cos x=\operatorname{sen}\left(x+\frac{\pi}{2}\right)$`,
            visual: unitCircleLab(true),
          },
          exercises: [
            mcq(t`Qual é a imagem de $f(x)=\operatorname{sen}x$?`, ['$[-1,\\,1]$', '$\\mathbb R$', '$[0,\\,1]$', '$[0,\\,2\\pi]$'], 0, t`O seno é uma altura no círculo de raio 1.`),
            mcq(t`Qual é o período de $\operatorname{sen}x$?`, ['$2\\pi$', '$\\pi$', '$1$', '$360$'], 0, t`Uma volta completa no ciclo: $2\pi$.`),
            tf(t`$\operatorname{sen}x=0$ em $x=0,\ \pi,\ 2\pi,\ \ldots$`, true, t`Nesses ângulos o ponto está no eixo horizontal.`),
            gen((rng) => {
              const [tex, fn, v] = pick(rng, [['\\frac{\\pi}{2}', 'sen', '1'], ['\\frac{3\\pi}{2}', 'sen', '-1'], ['\\pi', 'cos', '-1'], ['0', 'cos', '1'], ['\\frac{\\pi}{2}', 'cos', '0'], ['2\\pi', 'sen', '0']] as const);
              return rmcq(rng, t`Quanto vale $${fn === 'sen' ? '\\operatorname{sen}' : '\\cos'}\left(${tex}\right)$?`, `$${v}$`, ['1', '-1', '0', '\\frac12'].filter((x) => x !== v).map((x) => `$${x}$`), t`Localize o ângulo no ciclo e leia a coordenada ${fn === 'sen' ? '$y$' : '$x$'}.`);
            }),
            mcq(t`O gráfico de $\cos x$ é o de $\operatorname{sen}x$ deslocado…`, ['$\\frac{\\pi}{2}$ para a esquerda', '$\\pi$ para a direita', '$1$ para cima', 'nada: são iguais'], 0, t`$\cos x=\operatorname{sen}\left(x+\frac{\pi}{2}\right)$.`),
            gen((rng) => {
              const A = randInt(rng, 1, 4);
              const D = randInt(rng, -3, 5);
              return num(t`Qual o valor **máximo** de $f(x)=${A === 1 ? '' : A}\operatorname{sen}x${term(D, '')}$?`, A + D, t`O seno vai até $1$: $${A}\cdot1${term(D, '')}=${A + D}$.`);
            }),
            gen((rng) => {
              const k = randInt(rng, 2, 6);
              return num(t`Quantas vezes $\operatorname{sen}x=0$ no intervalo $[0,\,${k}\pi]$?`, k + 1, t`Zeros em $0,\ \pi,\ 2\pi,\ldots,\ ${k}\pi$: são $${k + 1}$.`);
            }),
            gen((rng) => {
              const a = randNZ(rng, -4, 4);
              const d = randInt(rng, -3, 5);
              return num(t`Qual o valor **mínimo** de $f(x)=${a === 1 ? '' : a === -1 ? '-' : a}\cos x${term(d, '')}$?`, d - Math.abs(a), t`$\cos x$ varia em $[-1,\,1]$, então $${a}\cos x$ varia em $[-${Math.abs(a)},\,${Math.abs(a)}]$. Mínimo: $${d}-${Math.abs(a)}=${d - Math.abs(a)}$.`);
            }),
          ],
        },
        {
          card: {
            title: 'Amplitude, frequência e fase',
            body: t`$$f(x)=A\operatorname{sen}(Bx+C)$$
• $A$: **amplitude** (altura da onda)
• **Período** $=\frac{2\pi}{B}$ (e frequência $=\frac{1}{\text{período}}$)
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
          },
          exercises: [
            mcqS(t`Qual a amplitude de $f(x)=-3\cos(2x)$?`, '$3$', ['$-3$', '$2$', '$6$'], t`Amplitude é $|A|=3$.`),
            gen((rng) => {
              const B = pick(rng, [1, 2, 3, 4]);
              return rmcq(rng, t`Qual o período de $f(x)=\operatorname{sen}(${B}x)$?`, B === 1 ? t`$2\pi$` : B === 2 ? t`$\pi$` : t`$\frac{2\pi}{${B}}$`, [t`$${2 * B}\pi$`, t`$\frac{\pi}{${2 * B}}$`, t`$${B}\pi$`, t`$4\pi$`], t`Período $=\frac{2\pi}{${B}}$.`);
            }),
            tf(t`Aumentar $B$ em $\operatorname{sen}(Bx)$ deixa a onda mais "apertada" (período menor).`, true, t`Período $\frac{2\pi}{B}$ diminui quando $B$ cresce.`),
            inter(t`Ajuste a onda para ter amplitude 2 e período $\pi$ (sem fase).`, 'plot', fnLab({ f: (x, p) => p.A * Math.sin(p.B * x + p.C), params: [{ key: 'A', label: 'A', min: 0.5, max: 3, step: 0.1, value: 1, color: C.p5 }, { key: 'B', label: 'B', min: 0.5, max: 4, step: 0.1, value: 1, color: C.p2 }, { key: 'C', label: 'C', min: -3.14, max: 3.14, step: 0.05, value: 0, color: C.p3 }], view: { xMin: -1, xMax: 12.6, yMin: -3.5, yMax: 3.5 }, ghost: (x) => 2 * Math.sin(2 * x) }).props, (v: any) => v && near(v.p.A, 2, 0.01) && near(v.p.B, 2, 0.01) && near(v.p.C, 0, 0.01), t`$A=2$, $B=2$, $C=0$`),
            gen((rng) => {
              const A = randInt(rng, 2, 5);
              const B = pick(rng, [2, 3, 4]);
              return rmcq(rng, t`Qual função tem amplitude $${A}$ e período $\frac{2\pi}{${B}}$?`, t`$${A}\operatorname{sen}(${B}x)$`, [t`$${B}\operatorname{sen}(${A}x)$`, t`$${A}\operatorname{sen}\left(\frac{x}{${B}}\right)$`, t`$\operatorname{sen}(${A * B}x)$`], t`Amplitude na frente ($${A}$) e $B=${B}$ dentro do seno.`);
            }),
            gen((rng) => {
              const f = pick(rng, [50, 60]);
              const V = pick(rng, [127, 311, 179]);
              return num(t`A tensão da tomada é $v(t)=${V}\operatorname{sen}(${2 * f}\pi t)$ (t em segundos). Qual a frequência, em Hz?`, f, t`$2\pi f=${2 * f}\pi\Rightarrow f=${f}$ Hz.`, { unit: 'Hz' });
            }),
            gen((rng) => {
              const A = randInt(rng, 1, 4);
              const D = randInt(rng, -2, 4);
              return rmcq(rng, t`Qual é a imagem de $f(x)=${A}\operatorname{sen}x${term(D, '')}$?`, `$[${D - A},\\,${D + A}]$`, [`$[${-A},\\,${A}]$`, `$[${D},\\,${D + A}]$`, `$[${D - 1},\\,${D + 1}]$`, `$[${D - A},\\,${D + A + 1}]$`], t`O seno vai de $-1$ a $1$; vezes $${A}$ e somando $${D}$: de $${D - A}$ a $${D + A}$.`);
            }),
            num(t`Qual o período de $f(x)=3\operatorname{sen}\left(\frac{\pi x}{2}\right)$?`, 4, t`$B=\frac{\pi}{2}$: período $=\frac{2\pi}{\pi/2}=4$.`),
          ],
        },
        {
          card: {
            title: 'Identidades e equações',
            body: t`Identidades úteis:
$$\operatorname{tg}x=\frac{\operatorname{sen}x}{\cos x}\qquad \operatorname{sen}(2x)=2\operatorname{sen}x\cos x\qquad\cos(2x)=\cos^2x-\operatorname{sen}^2x$$

Equações têm **várias** soluções por causa das simetrias: em $[0,\,2\pi)$, $\operatorname{sen}x=\frac12$ dá $x=\frac{\pi}{6}$ e $x=\frac{5\pi}{6}$.`,
          },
          exercises: [
            tf(t`$\operatorname{sen}^2x+\cos^2x=1$ para todo $x$ real.`, true, t`É Pitágoras no círculo de raio 1.`),
            num(t`Calcule $\operatorname{sen}(2x)$ sabendo que $\operatorname{sen}x=0{,}6$ e $\cos x=0{,}8$.`, 0.96, t`$2\cdot0{,}6\cdot0{,}8=0{,}96$.`),
            gen((rng) => {
              const [a, b, c] = pick(rng, TRI);
              return num(t`Se $\operatorname{sen}x=${fr(a, c)}$ e $\cos x=${fr(b, c)}$, quanto vale $\operatorname{tg}x$? (fração ou decimal)`, a / b, t`$\operatorname{tg}x=\frac{${a}/${c}}{${b}/${c}}=${fr(a, b)}$.`, { tol: 0.002 });
            }),
            gen((rng) => {
              const [a, b, c] = pick(rng, TRI);
              return num(t`Se $\operatorname{sen}x=${fr(a, c)}$ e $\cos x=${fr(b, c)}$, quanto vale $\cos(2x)$? (fração ou decimal)`, (b * b - a * a) / (c * c), t`$\cos^2x-\operatorname{sen}^2x=\frac{${b * b}-${a * a}}{${c * c}}=${fr(b * b - a * a, c * c)}$.`, { tol: 0.002 });
            }),
            mcq(t`Quantas soluções tem $\operatorname{sen}x=\frac12$ em $[0,\,2\pi)$?`, ['$2$', '$1$', '$4$', 'infinitas'], 0, t`Uma no 1º quadrante ($\frac{\pi}{6}$) e outra no 2º ($\frac{5\pi}{6}$).`),
            mcqS(t`Resolva $\operatorname{sen}x=\frac12$ em $[0,\,2\pi)$.`, t`$\frac{\pi}{6}$ e $\frac{5\pi}{6}$`, [t`$\frac{\pi}{6}$ e $\frac{7\pi}{6}$`, t`$\frac{\pi}{3}$ e $\frac{2\pi}{3}$`, t`só $\frac{\pi}{6}$`], t`O seno é positivo no 1º e 2º quadrantes: $\frac{\pi}{6}$ e $\pi-\frac{\pi}{6}=\frac{5\pi}{6}$.`),
            mcqS(t`Resolva $\cos x=0$ em $[0,\,2\pi)$.`, t`$\frac{\pi}{2}$ e $\frac{3\pi}{2}$`, [t`$0$ e $\pi$`, t`só $\frac{\pi}{2}$`, t`$\frac{\pi}{4}$ e $\frac{3\pi}{4}$`], t`O cosseno (coordenada $x$) zera no topo e no fundo do ciclo.`),
            num(t`Qual a **maior** solução de $2\operatorname{sen}^2x=1$ no intervalo $[0^\circ,\,180^\circ]$? (em graus)`, 135, t`$\operatorname{sen}^2x=\frac12\Rightarrow\operatorname{sen}x=\frac{\sqrt2}{2}$ (em $[0^\circ,180^\circ]$ o seno não é negativo): $x=45^\circ$ ou $135^\circ$.`, { unit: '°' }),
          ],
        },
      ],
    },
  ],
};

import React from 'react';
import type { UnitDef } from '../../types';
import { gen, inter, mcq, num, plot, tf } from '../../helpers';
import { vectorLab, vectors3DLab } from '../../visuals';
import { FnCurve, Pt } from '../../../components/plot/Plot';
import { C } from '../../../theme';
import { fmt, randInt } from '../../../lib/random';

const t = String.raw;

// Lançamento e queda no mesmo nível; o gráfico termina no impacto.
const projectile = () => plot({
  view: { xMin: 0, xMax: 45, yMin: -1, yMax: 22 },
  params: [
    { key: 'v', label: 'v₀ (m/s)', min: 10, max: 20, step: 1, value: 15, color: C.p2 },
    { key: 'angle', label: 'ângulo (°)', min: 15, max: 75, step: 5, value: 30, color: C.p3 },
  ],
  render: ({ p }: any) => {
    const a = p.angle * Math.PI / 180;
    const vx = p.v * Math.cos(a);
    const range = p.v * p.v * Math.sin(2 * a) / 9.8;
    const y = (x: number) => x * Math.tan(a) - 9.8 * x * x / (2 * vx * vx);
    return <><FnCurve f={y} from={0} to={range} color={C.p2} /><Pt x={range} y={0} color={C.gold} /></>;
  },
  info: ({ p }: any) => t`Alcance $${fmt(p.v * p.v * Math.sin(2 * p.angle * Math.PI / 180) / 9.8, 1)}\,\text{m}$ · sem resistência do ar`,
});

const vectorExercise = (prompt: string, x: number, y: number, explanation: string) => inter(
  prompt, 'plot', vectorLab('module', { u: [1, 1], snap: 1 }).props,
  (v) => !!v && v.pts.u.x === x && v.pts.u.y === y,
  t`Ponta em $(${x},\,${y})$.`, explanation,
);

export const movimento2d: UnitDef = {
  id: 'm-2d', title: 'Movimento em 2D e 3D', icon: '🎯',
  subtitle: 'Vetores, projéteis, movimento circular e referenciais',
  source: 'Física Aplicada I · Aula 07 e Prova A1, questão 1 · Halliday, capítulo 4',
  guide: t`$\vec r=x\hat{\imath}+y\hat{\jmath}+z\hat{k}$, $\Delta\vec r=\vec r_f-\vec r_i$, $\vec v=d\vec r/dt$ e $\vec a=d\vec v/dt$. O módulo em 2D é $\sqrt{x^2+y^2}$; determine o quadrante ao achar o ângulo a partir de $+x$. Sem ar, $x=x_0+v_0\cos\theta\,t$ e $y=y_0+v_0\sin\theta\,t-gt^2/2$. No MCU, $v=\omega R$ e $a_c=v^2/R$. Em referenciais que se movem por translação, $\vec v_{A/C}=\vec v_{A/B}+\vec v_{B/C}$.`,
  lessons: [
    { id: 'm-2d-pos', title: 'Posição e deslocamento vetoriais', parts: [
      { card: { title: 'Localize a partícula', body: t`O vetor posição vai da origem à partícula: $\vec r=x\hat{\imath}+y\hat{\jmath}+z\hat{k}$. Seu módulo é $\sqrt{x^2+y^2+z^2}$. Arraste as componentes e observe a distância à origem.`, visual: vectors3DLab() }, exercises: [
        mcq(t`O vetor posição liga quais pontos?`, ['Origem e posição da partícula', 'Posição final e inicial', 'Duas velocidades', 'Centro da Terra e qualquer origem'], 0, t`Por definição, ele parte da origem escolhida e termina na posição da partícula.`),
        tf(t`Mudar a origem pode mudar o vetor posição da mesma partícula.`, true, t`A posição é medida a partir da origem escolhida.`),
        num(t`Para $\vec r=3\hat{\imath}+4\hat{\jmath}$ em metros, qual o módulo em m, sem casas decimais?`, 5, t`$|\vec r|=\sqrt{3^2+4^2}=5\,\text{m}$.`, { unit: 'm', tol: 0.5 }),
        gen((rng) => { const x = randInt(rng, 2, 6); return num(t`Uma posição é $(${x},\,0,\,0)\,\text{m}$. Qual a distância à origem em m, sem casas decimais?`, x, t`$\sqrt{${x}^2}=${x}\,\text{m}$.`, { unit: 'm', tol: 0.5 }); }),
        vectorExercise(t`Arraste a ponta do vetor posição até $(3,\,2)\,\text{m}$.`, 3, 2, t`A componente horizontal é $3\,\text{m}$ e a vertical é $2\,\text{m}$.`),
        num(t`Para $\vec r=(2,\,3,\,6)\,\text{m}$, calcule o módulo em m, sem casas decimais.`, 7, t`$|\vec r|=\sqrt{4+9+36}=7\,\text{m}$.`, { unit: 'm', tol: 0.5 }),
        mcq(t`Em que quadrante está $\vec r=(-3,\,4)$?`, ['Segundo', 'Primeiro', 'Terceiro', 'Quarto'], 0, t`$x<0$ e $y>0$: segundo quadrante.`),
      ] },
      { card: { title: 'Deslocamento e direção', body: t`O deslocamento depende dos extremos: $\Delta\vec r=\vec r_f-\vec r_i$. Seu módulo não é, em geral, a distância percorrida. Em 2D, use as componentes e o quadrante para obter o ângulo medido de $+x$ no sentido anti-horário.`, visual: vectorLab('diff') }, exercises: [
        tf(t`Uma volta completa pode ter deslocamento nulo e distância percorrida positiva.`, true, t`A posição final coincide com a inicial, mas houve percurso.`),
        mcq(t`De $(1,\,2)$ a $(4,\,6)$ em metros, qual o deslocamento?`, [t`$(3,\,4)\,\text{m}$`, t`$(5,\,8)\,\text{m}$`, t`$(-3,\,-4)\,\text{m}$`, t`$(4,\,6)\,\text{m}$`], 0, t`Subtraia componente a componente: $(4-1,\,6-2)=(3,\,4)\,\text{m}$.`),
        num(t`Nesse deslocamento $(3,\,4)\,\text{m}$, qual o módulo em m, sem casas decimais?`, 5, t`$\sqrt{3^2+4^2}=5\,\text{m}$.`, { unit: 'm', tol: 0.5 }),
        gen((rng) => { const x = randInt(rng, 1, 5); return num(t`Uma partícula vai de $x=${x}\,\text{m}$ a $x=${x+4}\,\text{m}$, sem mudar $y$. Qual $\Delta x$ em m, sem casas decimais?`, 4, t`$\Delta x=${x+4}-${x}=4\,\text{m}$.`, { unit: 'm', tol: 0.5 }); }),
        num(t`Qual o ângulo de $(1,\,1)$ a partir de $+x$, em graus, sem casas decimais?`, 45, t`No primeiro quadrante, $\tan\theta=1$, logo $\theta=45^\circ$.`, { unit: '°', tol: 0.5 }),
        mcq(t`O ângulo de $(-1,\,1)$ medido de $+x$ no sentido anti-horário é:`, [t`$135^\circ$`, t`$45^\circ$`, t`$225^\circ$`, t`$315^\circ$`], 0, t`O ângulo de referência é $45^\circ$ e o vetor está no segundo quadrante: $180^\circ-45^\circ=135^\circ$.`),
        num(t`De $(1,\,2,\,3)$ a $(3,\,5,\,9)$ em m, qual o módulo do deslocamento em m, sem casas decimais?`, 7, t`$\Delta\vec r=(2,\,3,\,6)\,\text{m}$ e $|\Delta\vec r|=\sqrt{4+9+36}=7\,\text{m}$.`, { unit: 'm', tol: 0.5 }),
      ] },
    ] },
    { id: 'm-2d-vel', title: 'Velocidade e aceleração vetoriais', parts: [
      { card: { title: 'Da posição à velocidade', body: t`A velocidade média é $\Delta\vec r/\Delta t$. A instantânea é $\vec v=d\vec r/dt$: derive cada componente. O vetor instantâneo é tangente à trajetória.`, visual: vectorLab('module') }, exercises: [
        tf(t`A velocidade média depende do deslocamento, não da distância total percorrida.`, true, t`$\vec v_m=\Delta\vec r/\Delta t$.`),
        num(t`Um deslocamento de $8\,\text{m}$ em $+x$ leva $2\,\text{s}$. Qual $v_{m,x}$ em m/s, sem casas decimais?`, 4, t`$v_{m,x}=8/2=4\,\text{m/s}$.`, { unit: 'm/s', tol: 0.5 }),
        gen((rng) => { const a = randInt(rng, 2, 6); return num(t`Se $x(t)=${a}t^2\,\text{m}$, qual $v_x$ em $t=2\,\text{s}$, em m/s, sem casas decimais?`, 4*a, t`$v_x=2\cdot${a}t$; em $t=2$, $v_x=${4*a}\,\text{m/s}$.`, { unit: 'm/s', tol: 0.5 }); }),
        mcq(t`Se $x=2t$ e $y=3t^2$, com SI, qual é $\vec v(t)$?`, [t`$2\hat{\imath}+6t\hat{\jmath}$`, t`$2t\hat{\imath}+3t\hat{\jmath}$`, t`$2\hat{\imath}+3\hat{\jmath}$`, t`$6t\hat{\imath}+2\hat{\jmath}$`], 0, t`Derivando separadamente: $v_x=2$ e $v_y=6t$.`),
        vectorExercise(t`Represente $\vec v=(3,\,4)\,\text{m/s}$ arrastando a ponta.`, 3, 4, t`As componentes são $v_x=3$ e $v_y=4\,\text{m/s}$.`),
        num(t`Para $\vec v=(3,\,4)\,\text{m/s}$, calcule o módulo em m/s, sem casas decimais.`, 5, t`$|\vec v|=\sqrt{3^2+4^2}=5\,\text{m/s}$.`, { unit: 'm/s', tol: 0.5 }),
        num(t`Para $\vec v=(-1,\,1)\,\text{m/s}$, calcule o ângulo anti-horário desde $+x$, em graus, sem casas decimais.`, 135, t`O vetor está no segundo quadrante, com ângulo de referência $45^\circ$: $135^\circ$.`, { unit: '°', tol: 0.5 }),
      ] },
      { card: { title: 'Aceleração e prova', body: t`$\vec a_m=\Delta\vec v/\Delta t$ e $\vec a=d\vec v/dt=d^2\vec r/dt^2$. Mesmo com módulo da velocidade constante, uma mudança de direção produz aceleração. Para módulo e ângulo, calcule as componentes no instante antes de usar Pitágoras e o quadrante.` }, exercises: [
        tf(t`Velocidade de módulo constante implica aceleração nula.`, false, t`A direção da velocidade pode mudar, como no movimento circular.`),
        num(t`$v_x$ passa de $2$ a $8\,\text{m/s}$ em $3\,\text{s}$. Qual a aceleração média em m/s², sem casas decimais?`, 2, t`$a_{m,x}=(8-2)/3=2\,\text{m/s}^2$.`, { unit: 'm/s²', tol: 0.5 }),
        gen((rng) => { const a = randInt(rng, 2, 6); return num(t`Se $x(t)=${a}t^2\,\text{m}$, qual $a_x$ em m/s², sem casas decimais?`, 2*a, t`$v_x=${2*a}t$ e $a_x=${2*a}\,\text{m/s}^2$.`, { unit: 'm/s²', tol: 0.5 }); }),
        mcq(t`Para $x=2t^2$ e $y=3t^2$, em SI, qual a aceleração?`, [t`$(4,\,6)\,\text{m/s}^2$`, t`$(2,\,3)\,\text{m/s}^2$`, t`$(4t,\,6t)\,\text{m/s}^2$`, t`$(0,\,0)\,\text{m/s}^2$`], 0, t`Duas derivadas dão $a_x=4$ e $a_y=6\,\text{m/s}^2$.`),
        num(t`Em SI, $x=t^2+1$, $y=2t^2$. Em $t=1\,\text{s}$, qual o módulo de $\vec r$ em m, com uma casa decimal?`, Math.sqrt(8), t`$\vec r=(2,\,2)\,\text{m}$; $|\vec r|=\sqrt8\approx2,8\,\text{m}$.`, { unit: 'm', tol: 0.05 }),
        num(t`Para as mesmas funções $x=t^2+1$, $y=2t^2$, em $t=1\,\text{s}$, qual o módulo de $\vec v$ em m/s, com uma casa decimal?`, Math.sqrt(20), t`$\vec v=(2t,\,4t)$; em $1\,\text{s}$, $|\vec v|=\sqrt{2^2+4^2}\approx4,5\,\text{m/s}$.`, { unit: 'm/s', tol: 0.05 }),
        num(t`Para $x=t^2+1$, $y=2t^2$ em SI, qual o ângulo de $\vec a$ desde $+x$, em graus, com uma casa decimal?`, Math.atan2(4,2)*180/Math.PI, t`$\vec a=(2,\,4)\,\text{m/s}^2$; no primeiro quadrante, $\theta=\arctan(4/2)\approx63,4^\circ$.`, { unit: '°', tol: 0.05 }),
      ] },
    ] },
    { id: 'm-2d-proj', title: 'Movimento de projéteis', parts: [
      { card: { title: 'Independência dos movimentos', body: t`Sem resistência do ar, $a_x=0$ e $a_y=-g$, com $g=9,8\,\text{m/s}^2$. Para lançamento a partir da origem: $x=v_0\cos\theta\,t$ e $y=v_0\sin\theta\,t-gt^2/2$. Ajuste a velocidade e o ângulo; o ponto marca a queda no nível de lançamento.`, visual: projectile() }, exercises: [
        tf(t`Sem resistência do ar, a velocidade horizontal de um projétil é constante.`, true, t`Como $a_x=0$, $v_x=v_0\cos\theta$ não muda.`),
        mcq(t`Qual é a aceleração durante o voo, com $+y$ para cima e $g=9,8\,\text{m/s}^2$?`, [t`$(0,\,-9,8)\,\text{m/s}^2$`, t`$(0,\,0)\,\text{m/s}^2$`, t`$(9,8,\,0)\,\text{m/s}^2$`, t`$(0,\,9,8)\,\text{m/s}^2$`], 0, t`A gravidade aponta para baixo durante todo o voo.`),
        gen((rng) => { const v = randInt(rng, 2, 9); return num(t`Um projétil tem $v_x=${v}\,\text{m/s}$. Sem ar, quanto vale $v_x$ em m/s após $2\,\text{s}$, sem casas decimais?`, v, t`$a_x=0$, então $v_x=${v}\,\text{m/s}$.`, { unit: 'm/s', tol: 0.5 }); }),
        num(t`Com $v_x=6\,\text{m/s}$ constante, qual o deslocamento horizontal após $3\,\text{s}$, em m, sem casas decimais?`, 18, t`$\Delta x=v_xt=6\cdot3=18\,\text{m}$.`, { unit: 'm', tol: 0.5 }),
        inter(t`No laboratório, ajuste $v_0=20\,\text{m/s}$ e $\theta=45^\circ$.`, 'plot', projectile().props, (v) => !!v && v.p.v === 20 && v.p.angle === 45, t`$v_0=20\,\text{m/s}$ e $\theta=45^\circ$.`, t`Os controles ajustam o módulo e a direção iniciais independentemente.`),
        num(t`Uma bola é lançada com $v_{0y}=19,6\,\text{m/s}$. Sem ar, após $1\,\text{s}$, qual $v_y$ em m/s, com uma casa decimal? Use $g=9,8\,\text{m/s}^2$.`, 9.8, t`$v_y=v_{0y}-gt=19,6-9,8=9,8\,\text{m/s}$.`, { unit: 'm/s', tol: 0.05 }),
        num(t`Para $v_{0y}=19,6\,\text{m/s}$, qual o deslocamento vertical após $1\,\text{s}$, em m, com uma casa decimal? Use $g=9,8\,\text{m/s}^2$.`, 14.7, t`$\Delta y=19,6(1)-4,9(1)^2=14,7\,\text{m}$.`, { unit: 'm', tol: 0.05 }),
      ] },
      { card: { title: 'Ápice e alcance', body: t`No ápice, $v_y=0$, mas $v_x$ continua. Se o projétil parte e cai na mesma altura, $T=2v_0\sin\theta/g$ e $R=v_0^2\sin(2\theta)/g$. Para velocidade inicial fixa e sem ar, ângulos complementares têm o mesmo alcance.` }, exercises: [
        tf(t`No ápice de um lançamento oblíquo, a aceleração é zero.`, false, t`A aceleração continua sendo $-g$ na vertical; apenas $v_y$ é zero.`),
        num(t`Com $v_{0y}=19,6\,\text{m/s}$, quanto tempo até o ápice em s, com uma casa decimal? Use $g=9,8\,\text{m/s}^2$.`, 2, t`$0=19,6-9,8t$, logo $t=2,0\,\text{s}$.`, { unit: 's', tol: 0.05 }),
        gen((rng) => { const n = randInt(rng, 1, 4); return num(t`Um projétil retorna à mesma altura após subir por $${n}\,\text{s}$. Sem ar, qual o tempo total em s, sem casas decimais?`, 2*n, t`A subida e a descida entre os mesmos níveis duram o mesmo: $T=2\cdot${n}=${2*n}\,\text{s}$.`, { unit: 's', tol: 0.5 }); }),
        mcq(t`Para a mesma velocidade inicial e alturas iguais de lançamento e queda, qual par tem o mesmo alcance?`, [t`$30^\circ$ e $60^\circ$`, t`$30^\circ$ e $45^\circ$`, t`$15^\circ$ e $60^\circ$`, t`$45^\circ$ e $60^\circ$`], 0, t`$\sin(60^\circ)=\sin(120^\circ)$; portanto $30^\circ$ e $60^\circ$ produzem o mesmo alcance.`),
        num(t`Se $v_x=5\,\text{m/s}$ e o voo dura $4\,\text{s}$, qual o alcance em m, sem casas decimais?`, 20, t`$R=v_xT=5\cdot4=20\,\text{m}$.`, { unit: 'm', tol: 0.5 }),
        num(t`Com $v_{0y}=19,6\,\text{m/s}$, qual a altura máxima acima do lançamento em m, com uma casa decimal? Use $g=9,8\,\text{m/s}^2$.`, 19.6, t`$H=v_{0y}^2/(2g)=19,6^2/19,6=19,6\,\text{m}$.`, { unit: 'm', tol: 0.05 }),
        num(t`Um lançamento a $45^\circ$ tem $v_0=14\,\text{m/s}$ e cai na mesma altura. Qual o alcance em m, sem casas decimais? Use $g=9,8\,\text{m/s}^2$.`, 20, t`$R=14^2\sin90^\circ/9,8=20\,\text{m}$.`, { unit: 'm', tol: 0.5 }),
      ] },
    ] },
    { id: 'm-2d-mcu', title: 'Movimento circular uniforme', parts: [
      { card: { title: 'Período e velocidade', body: t`No MCU o módulo da velocidade é constante e sua direção muda. O período $T$ é o tempo de uma volta; $f=1/T$, $\omega=2\pi/T$ e $v=\omega R$. O vetor velocidade é tangente à circunferência.`, visual: vectorLab('module') }, exercises: [
        mcq(t`No MCU, a velocidade instantânea aponta:`, ['Na direção tangente à trajetória', 'Sempre para o centro', 'Sempre para fora', 'Sempre para cima'], 0, t`A velocidade instantânea é tangente à trajetória no ponto considerado.`),
        tf(t`No MCU, a velocidade vetorial é constante.`, false, t`Seu módulo é constante, mas a direção muda ao longo da volta.`),
        gen((rng) => { const n = randInt(rng, 2, 6); return num(t`Um corpo completa uma volta em $${n}\,\text{s}$. Qual o período em s, sem casas decimais?`, n, t`Por definição, o período é o tempo de uma volta: $${n}\,\text{s}$.`, { unit: 's', tol: 0.5 }); }),
        num(t`Um disco completa $4$ voltas em $2\,\text{s}$. Qual a frequência em Hz, sem casas decimais?`, 2, t`$f=4/2=2\,\text{Hz}$.`, { unit: 'Hz', tol: 0.5 }),
        vectorExercise(t`No ponto à direita do centro, para movimento anti-horário, represente uma velocidade tangente de componentes $(0,\,2)\,\text{m/s}$.`, 0, 2, t`Nesse ponto a tangente aponta para cima, na direção do movimento.`),
        num(t`Se $\omega=3\,\text{rad/s}$ e $R=2\,\text{m}$, qual $v$ em m/s, sem casas decimais?`, 6, t`$v=\omega R=3\cdot2=6\,\text{m/s}$.`, { unit: 'm/s', tol: 0.5 }),
        num(t`Com período $T=2\,\text{s}$, qual $\omega$ em rad/s, com duas casas decimais?`, Math.PI, t`$\omega=2\pi/T=\pi\approx3,14\,\text{rad/s}$.`, { unit: 'rad/s', tol: 0.005 }),
      ] },
      { card: { title: 'Aceleração centrípeta', body: t`A variação da direção da velocidade produz aceleração para o centro: $a_c=v^2/R=\omega^2R$. No MCU, ela é perpendicular à velocidade; não altera seu módulo.` }, exercises: [
        mcq(t`A aceleração centrípeta aponta:`, ['Para o centro da trajetória', 'Na direção tangente', 'Para fora da trajetória', 'Sempre na direção da velocidade'], 0, t`A mudança instantânea de direção da velocidade aponta para o centro.`),
        tf(t`A aceleração centrípeta é perpendicular à velocidade no MCU.`, true, t`A velocidade é tangente e a aceleração é radial para dentro.`),
        gen((rng) => { const v = randInt(rng, 2, 6); return num(t`Em MCU, $v=${v}\,\text{m/s}$ e $R=${v}\,\text{m}$. Calcule $a_c$ em m/s², sem casas decimais.`, v, t`$a_c=v^2/R=${v}^2/${v}=${v}\,\text{m/s}^2$.`, { unit: 'm/s²', tol: 0.5 }); }),
        num(t`Com $v=6\,\text{m/s}$ e $R=3\,\text{m}$, calcule $a_c$ em m/s², sem casas decimais.`, 12, t`$a_c=6^2/3=12\,\text{m/s}^2$.`, { unit: 'm/s²', tol: 0.5 }),
        mcq(t`Mantido o raio, ao dobrar $v$, o módulo de $a_c$ fica:`, ['Quatro vezes maior', 'Duas vezes maior', 'Igual', 'Metade'], 0, t`Como $a_c=v^2/R$, dobrar $v$ multiplica $a_c$ por $2^2=4$.`),
        num(t`Com $\omega=2\,\text{rad/s}$ e $R=3\,\text{m}$, calcule $a_c$ em m/s², sem casas decimais.`, 12, t`$a_c=\omega^2R=2^2\cdot3=12\,\text{m/s}^2$.`, { unit: 'm/s²', tol: 0.5 }),
        mcq(t`Uma partícula no ponto direito de uma circunferência move-se para cima em MCU. Qual o sentido de sua aceleração?`, ['Para a esquerda', 'Para cima', 'Para baixo', 'Para a direita'], 0, t`No ponto direito, o centro fica à esquerda; a aceleração aponta para ele.`),
      ] },
    ] },
    { id: 'm-2d-rel', title: 'Movimento relativo', parts: [
      { card: { title: 'Troca de referencial', body: t`$\vec r_{A/C}=\vec r_{A/B}+\vec r_{B/C}$. Derivando em referenciais em translação: $\vec v_{A/C}=\vec v_{A/B}+\vec v_{B/C}$. A ordem dos índices importa: inverter uma velocidade relativa troca seu sinal.`, visual: vectorLab('sum') }, exercises: [
        tf(t`A velocidade de um passageiro pode ser zero em relação ao ônibus e não zero em relação à rua.`, true, t`O passageiro acompanha o ônibus: sua velocidade depende do referencial.`),
        mcq(t`Se $\vec v_{A/B}=(2,\,0)\,\text{m/s}$, qual é $\vec v_{B/A}$?`, [t`$(-2,\,0)\,\text{m/s}$`, t`$(2,\,0)\,\text{m/s}$`, t`$(0,\,2)\,\text{m/s}$`, t`$(0,\,0)\,\text{m/s}$`], 0, t`Inverter a ordem dos referenciais troca o sinal: $\vec v_{B/A}=-\vec v_{A/B}$.`),
        gen((rng) => { const a = randInt(rng, 1, 4); const b = randInt(rng, 2, 5); return num(t`Um ônibus vai a $${b}\,\text{m/s}$ para leste e uma pessoa anda nele a $${a}\,\text{m/s}$ para leste. Qual a velocidade da pessoa em relação ao solo, em m/s para leste, sem casas decimais?`, a+b, t`Na mesma direção, some: $${a}+${b}=${a+b}\,\text{m/s}$.`, { unit: 'm/s', tol: 0.5 }); }),
        num(t`Um trem vai a $10\,\text{m/s}$ para leste e uma pessoa anda nele a $2\,\text{m/s}$ para oeste. Qual a velocidade da pessoa em relação ao solo em m/s, positiva para leste, sem casas decimais?`, 8, t`Escolhendo leste positivo, $v=10-2=8\,\text{m/s}$.`, { unit: 'm/s', tol: 0.5 }),
        vectorExercise(t`A velocidade de um barco em relação ao solo tem componentes $(3,\,4)\,\text{m/s}$. Represente-a.`, 3, 4, t`Arraste a ponta para $x=3$ e $y=4$: a seta representa a velocidade resultante.`),
        num(t`Um barco tem velocidade de $3\,\text{m/s}$ para leste relativa à água, e a água flui a $4\,\text{m/s}$ para norte. Qual o módulo da velocidade em relação à margem, em m/s, sem casas decimais?`, 5, t`As componentes perpendiculares somam $(3,\,4)\,\text{m/s}$; o módulo é $\sqrt{3^2+4^2}=5\,\text{m/s}$.`, { unit: 'm/s', tol: 0.5 }),
        num(t`No mesmo caso, qual o ângulo da velocidade em relação ao leste, para norte, em graus, com uma casa decimal?`, Math.atan2(4,3)*180/Math.PI, t`$\theta=\arctan(4/3)\approx53,1^\circ$ ao norte do leste.`, { unit: '°', tol: 0.05 }),
      ] },
      { card: { title: 'Encontro e travessia', body: t`Para comparar dois móveis, subtraia suas velocidades no mesmo referencial: $\vec v_{A/B}=\vec v_{A/C}-\vec v_{B/C}$. Numa travessia perpendicular, a componente através do rio determina o tempo; a corrente causa deriva ao longo da margem.` }, exercises: [
        mcq(t`Dois carros seguem no mesmo sentido a $20$ e $15\,\text{m/s}$. Qual a rapidez de aproximação do mais rápido em relação ao outro?`, [t`$5\,\text{m/s}$`, t`$35\,\text{m/s}$`, t`$20\,\text{m/s}$`, t`$15\,\text{m/s}$`], 0, t`A diferença é $20-15=5\,\text{m/s}$.`),
        gen((rng) => { const d = randInt(rng, 2, 6); return num(t`Dois móveis em sentidos opostos aproximam-se a $${d}$ e $2\,\text{m/s}$. Qual a rapidez de aproximação em m/s, sem casas decimais?`, d+2, t`Em sentidos opostos, as distâncias fecham à taxa $${d}+2=${d+2}\,\text{m/s}$.`, { unit: 'm/s', tol: 0.5 }); }),
        num(t`Dois carros a $100\,\text{m}$ um do outro aproximam-se em linha reta com rapidez relativa de $5\,\text{m/s}$. Qual o tempo até o encontro em s, sem casas decimais?`, 20, t`$t=100/5=20\,\text{s}$.`, { unit: 's', tol: 0.5 }),
        tf(t`Para um barco apontado perpendicularmente à margem, a corrente paralela à margem não altera sua componente de velocidade de travessia.`, true, t`Somar uma velocidade paralela à margem não muda a componente perpendicular.`),
        num(t`Um rio tem largura $60\,\text{m}$. O barco aponta perpendicularmente à margem a $3\,\text{m/s}$ em relação à água, que corre paralelamente à margem. Qual o tempo de travessia em s, sem casas decimais?`, 20, t`A componente transversal é $3\,\text{m/s}$: $t=60/3=20\,\text{s}$.`, { unit: 's', tol: 0.5 }),
        num(t`Na travessia de $20\,\text{s}$, uma corrente de $2\,\text{m/s}$ paralela à margem causa qual deriva em m, sem casas decimais?`, 40, t`$d=v_{corrente}t=2\cdot20=40\,\text{m}$.`, { unit: 'm', tol: 0.5 }),
        num(t`Um avião deve voar exatamente para norte. O vento sopra para leste a $30\,\text{m/s}$. Qual deve ser a componente leste da velocidade do avião relativa ao ar, em m/s, com sinal e sem casas decimais?`, -30, t`Para componente leste nula em relação ao solo, $v_{ar,x}+30=0$, logo $v_{ar,x}=-30\,\text{m/s}$.`, { unit: 'm/s', tol: 0.5 }),
      ] },
    ] },
  ],
};

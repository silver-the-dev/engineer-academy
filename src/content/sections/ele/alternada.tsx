import React from 'react';
import type { UnitDef } from '../../types';
import { gen, inter, mcq, num, plot, tf, near } from '../../helpers';
import { circuit, circuitEx, circuitVisual, R, VAC, wires } from '../../circuits';
import { FnCurve } from '../../../components/plot/Plot';
import { C } from '../../../theme';
import { fmt, randInt } from '../../../lib/random';

const t = String.raw;

// O eixo horizontal representa tempo normalizado ou frequência, conforme o contexto.
const lab = (kind: 'seno' | 'rms' | 'reat' | 'fasor' | 'resson') => plot({
  view: { xMin: 0, xMax: 4, yMin: -3.5, yMax: 3.5 },
  params: [{ key: 'a', label: kind === 'reat' ? 'L' : kind === 'resson' ? 'f_0' : 'A', min: 1, max: 3, step: 1, value: 1, color: C.p2 }],
  render: ({ p }: any) => <FnCurve f={(x: number) => {
    if (kind === 'reat') return p.a * x / 4;
    if (kind === 'resson') return 3 / Math.sqrt(1 + 4 * (x - p.a) ** 2);
    if (kind === 'fasor') return p.a * Math.sin(Math.PI * x + Math.PI / 2);
    return p.a * Math.sin(Math.PI * x);
  }} color={C.p2} />,
  info: ({ p }: any) => kind === 'reat' ? t`$X_L$ cresce com $f$; escala ilustrativa $L=${p.a}$.` : kind === 'resson' ? t`Pico deslocado para $f=${p.a}$ em escala ilustrativa.` : t`Amplitude $A=${p.a}$ em escala ilustrativa.`,
});
const labEx = (kind: 'rms' | 'reat' | 'fasor' | 'resson', prompt: string, explanation: string) => {
  const spec = lab(kind);
  return inter(prompt, 'plot', spec.props, (v) => v.p.a === 2, t`Ajuste o controle para $2$.`, explanation);
};
const ac = (peak: number) => circuit(
  VAC('fonte', [0, 0], [0, 3], peak, 60, { locked: true, values: [10, 20, 30], min: 10, max: 30 }),
  wires([0, 0], [2, 0]), R('carga', [2, 0], [5, 0], 1000, { fixed: true, locked: true }),
  wires([5, 0], [5, 3], [0, 3]),
);
const scope = (peak: number) => ({ comps: ac(peak), mode: 'adjust' as const, scope: { ids: ['carga'], window: 1 / 30 } });
const adjustPeak = (target: number, initial: number) => circuitEx(
  t`No osciloscópio, ajuste a fonte para a tensão na carga ter pico de $${target}\,\text{V}$.`, scope(initial),
  (v) => near(v.wave('carga').max, target, 0.2), t`Pico de $${target}\,\text{V}$.`,
  t`A carga está diretamente ligada à fonte ideal: seu pico é igual ao pico da fonte, $${target}\,\text{V}$.`, { set: { fonte: target } },
);
const adjustPP = (target: number, initial: number) => circuitEx(
  t`Ajuste a fonte até a tensão na carga medir $${2 * target}\,\text{V}$ pico a pico no osciloscópio.`, scope(initial),
  (v) => near(v.wave('carga').pp, 2 * target, 0.3), t`Pico de $${target}\,\text{V}$.`,
  t`Como a senoide é centrada em zero, $V_{pp}=2V_p$: escolha $V_p=${target}\,\text{V}$.`, { set: { fonte: target } },
);

export const alternada: UnitDef = {
  id: 'el-ca', title: 'Corrente alternada', icon: '〰️',
  subtitle: 'Senoides, valor eficaz, impedância e ressonância',
  source: 'Eletrônica I · Aula 5 — tensão alternada e valor eficaz; reatância, fasores e ressonância complementam a aula',
  guide: t`Para $v(t)=V_p\sin(2\pi ft+\phi)$, $T=1/f$ e, para senoide sem componente contínua, $V_{ef}=V_p/\sqrt2$. Na rede brasileira usam-se valores nominais de $127$ ou $220\,\text{V}$ eficazes, a $60\,\text{Hz}$.

Em regime senoidal: $X_L=2\pi fL$, $X_C=1/(2\pi fC)$ e, em série, $Z=R+j(X_L-X_C)$. A ressonância ideal ocorre em $f_0=1/(2\pi\sqrt{LC})$.`,
  lessons: [
    { id: 'el-ca-seno', title: 'Senoide: período, frequência e pico', parts: [
      { card: { title: 'Um ciclo no osciloscópio', body: t`Uma senoide completa um ciclo em $T$ segundos. A frequência $f=1/T$ conta ciclos por segundo (hertz). A fonte do simulador informa o **pico**, não o valor eficaz.`, visual: circuitVisual(scope(10)), tip: t`Na rede de $60\,\text{Hz}$, $T=1/60\,\text{s}\approx16{,}67\,\text{ms}$.` }, exercises: [
        mcq(t`O período é o tempo de…`, ['um ciclo completo', 'meio ciclo sempre', 'um segundo', 'um pico apenas'], 0, t`Um ciclo é a menor repetição completa da forma de onda.`),
        tf(t`Uma frequência de $60\,\text{Hz}$ corresponde a 60 ciclos por segundo.`, true, t`Hertz significa ciclos por segundo.`),
        num(t`Uma onda de $50\,\text{Hz}$ tem período de quantos ms? Responda sem casas decimais.`, 20, t`$T=1/50\,\text{s}=20\,\text{ms}$.`, { unit: 'ms', tol: 0.5 }),
        gen((rng) => { const f = randInt(rng, 2, 10) * 10; return num(t`Uma onda tem frequência $${f}\,\text{Hz}$. Quantos ciclos ocorrem em $2\,\text{s}$? Responda sem casas decimais.`, 2*f, t`Ciclos $=ft=${f}\cdot2=${2*f}$.`, { unit: 'ciclos', tol: 0.5 }); }),
        mcq(t`Observe a carga no osciloscópio. Qual é aproximadamente a tensão de pico em V?`, ['$10$', '$20$', '$5$', '$0$'], 0, t`A curva vai de aproximadamente $-10$ a $+10\,\text{V}$; o pico é $10\,\text{V}$.`, { visual: circuitVisual(scope(10)) }),
        adjustPeak(20, 10), adjustPP(30, 10),
      ] },
      { card: { title: 'Pico e fase', body: t`Em $v(t)=V_p\sin(2\pi ft+\phi)$, $V_p$ é a amplitude, $2\pi f$ é a frequência angular e $\phi$ é a fase inicial. Para senoide centrada em zero, $V_{pp}=2V_p$.`, visual: circuitVisual(scope(20)) }, exercises: [
        mcq(t`Uma senoide centrada em zero tem extremos $+20$ e $-20\,\text{V}$. Qual é o pico a pico?`, [t`$40\,\text{V}$`, t`$20\,\text{V}$`, t`$10\,\text{V}$`, t`$0\,\text{V}$`], 0, t`$V_{pp}=20-(-20)=40\,\text{V}$.`),
        tf(t`A fase inicial desloca a senoide no tempo sem mudar sua frequência.`, true, t`A fase altera o argumento por uma constante; o período permanece $1/f$.`),
        num(t`Para $f=50\,\text{Hz}$, calcule $\omega$ em rad/s com uma casa decimal.`, 100*Math.PI, t`$\omega=2\pi f=100\pi\approx314{,}2\,\text{rad/s}$.`, { unit: 'rad/s', tol: 0.05 }),
        gen((rng) => { const p = randInt(rng, 2, 9); return num(t`Uma senoide sem deslocamento DC tem pico $${p}\,\text{V}$. Qual o pico a pico em V, sem casas decimais?`, 2*p, t`$V_{pp}=2V_p=2\cdot${p}=${2*p}\,\text{V}$.`, { unit: 'V', tol: 0.5 }); }),
        mcq(t`Leia a curva da carga no osciloscópio: qual é aproximadamente seu pico a pico?`, [t`$40\,\text{V}$`, t`$20\,\text{V}$`, t`$10\,\text{V}$`, t`$60\,\text{V}$`], 0, t`Os extremos são aproximadamente $+20$ e $-20\,\text{V}$; a diferença é $40\,\text{V}$.`, { visual: circuitVisual(scope(20)) }),
        adjustPeak(30, 20), adjustPP(10, 20),
      ] },
    ] },
    { id: 'el-ca-rms', title: 'Valor eficaz', parts: [
      { card: { title: 'Efeito térmico', body: t`O valor eficaz (RMS) é a raiz da média do quadrado ao longo de um período. É o valor DC que produz a mesma potência média em um resistor. Para senoide sem offset: $V_{ef}=V_p/\sqrt2$.`, visual: lab('rms') }, exercises: [
        tf(t`O valor eficaz permite comparar o aquecimento em um mesmo resistor com o de uma tensão contínua.`, true, t`Ambas produzem a mesma potência média no resistor.`),
        mcq(t`Uma senoide sem offset tem pico $10\sqrt2\,\text{V}$. Qual o eficaz?`, [t`$10\,\text{V}$`, t`$20\,\text{V}$`, t`$10\sqrt2\,\text{V}$`, t`$5\,\text{V}$`], 0, t`$V_{ef}=V_p/\sqrt2=10\,\text{V}$.`),
        num(t`Qual o valor eficaz de uma senoide de pico $20\,\text{V}$, em V com uma casa decimal?`, 20/Math.SQRT2, t`$20/\sqrt2\approx14{,}1\,\text{V}$.`, { unit: 'V', tol: 0.05 }),
        gen((rng) => { const k = randInt(rng, 2, 9); return num(t`Uma senoide tem pico $${k}\sqrt2\,\text{V}$. Qual o eficaz em V, sem casas decimais?`, k, t`Divida o pico por $\sqrt2$: $V_{ef}=${k}\,\text{V}$.`, { unit: 'V', tol: 0.5 }); }),
        mcq(t`A média da tensão de uma senoide simétrica em um período é zero. Seu RMS é…`, ['positivo se o pico é positivo', 'sempre zero', 'negativo', 'igual à média'], 0, t`O quadrado é positivo nos dois semiciclos; portanto sua média e sua raiz são positivas.`),
        labEx('rms', t`Ajuste a amplitude para 2. Qualquer senoide exibida continua tendo RMS igual à amplitude dividida por $\sqrt2$.`, t`Com amplitude 2, $V_{ef}=2/\sqrt2=\sqrt2$ na escala do gráfico.`),
        num(t`Uma senoide de $10\,\text{V}$ eficazes alimenta $20\,\Omega$. Qual a potência média em W, sem casas decimais?`, 5, t`$P=V_{ef}^2/R=10^2/20=5\,\text{W}$.`, { unit: 'W', tol: 0.5 }),
      ] },
      { card: { title: 'Rede e outras ondas', body: t`As tensões nominais $127$ e $220\,\text{V}$ da rede são valores eficazes. Para uma senoide, multiplique por $\sqrt2$ para obter o pico. A relação $V_p/\sqrt2$ não vale para toda forma de onda.`, visual: lab('rms') }, exercises: [
        mcq(t`Os $127\,\text{V}$ nominais de uma tomada representam, aproximadamente, o valor…`, ['eficaz', 'de pico', 'pico a pico', 'médio da senoide'], 0, t`A tensão nominal da rede é expressa em RMS.`),
        num(t`Calcule o pico de uma senoide de $220\,\text{V}$ eficazes, em V com uma casa decimal.`, 220*Math.SQRT2, t`$V_p=220\sqrt2\approx311{,}1\,\text{V}$.`, { unit: 'V', tol: 0.05 }),
        gen((rng) => { const r = randInt(rng, 2, 9)*10; return num(t`Um resistor de $${r}\,\Omega$ recebe $10\,\text{V}$ eficazes. Calcule a potência média em W com duas casas decimais.`, 100/r, t`$P=V_{ef}^2/R=100/${r}\approx${fmt(100/r, 2)}\,\text{W}$.`, { unit: 'W', tol: 0.005 }); }),
        tf(t`Uma onda quadrada simétrica entre $+10$ e $-10\,\text{V}$ tem RMS de $10\,\text{V}$.`, true, t`Seu quadrado é sempre $100\,\text{V}^2$; a raiz da média é $10\,\text{V}$.`),
        mcq(t`Para uma forma de onda periódica qualquer, como se calcula o RMS?`, ['Raiz da média do quadrado em um período', 'Média da tensão em um período', 'Pico dividido sempre por 2', 'Média dos extremos'], 0, t`Primeiro eleve ao quadrado, depois faça a média temporal e extraia a raiz.`),
        num(t`Uma senoide de $127\,\text{V}$ eficazes tem pico de quantos V? Use uma casa decimal.`, 127*Math.SQRT2, t`$127\sqrt2\approx179{,}6\,\text{V}$.`, { unit: 'V', tol: 0.05 }),
        mcq(t`Se a tensão eficaz dobrar no mesmo resistor, a potência média…`, ['quadruplica', 'dobra', 'cai à metade', 'não muda'], 0, t`Como $P=V_{ef}^2/R$, multiplicar $V_{ef}$ por 2 multiplica $P$ por 4.`),
      ] },
    ] },
    { id: 'el-ca-reat', title: 'Reatância capacitiva e indutiva', parts: [
      { card: { title: 'Indutor em CA', body: t`Em regime senoidal, $X_L=\omega L=2\pi fL$, em ohms. Num indutor ideal, a corrente atrasa a tensão em $90^\circ$.`, visual: lab('reat') }, exercises: [
        tf(t`A reatância indutiva aumenta com a frequência, mantendo $L$ constante.`, true, t`$X_L=2\pi fL$ é proporcional a $f$.`),
        mcq(t`Em um indutor ideal, a corrente em relação à tensão…`, ['atrasa 90°', 'adianta 90°', 'está sempre em fase', 'adianta 180°'], 0, t`De $v=L\,di/dt$, a tensão senoidal adianta a corrente em $90^\circ$.`),
        num(t`Para $L=1\,\text{H}$ e $f=50\,\text{Hz}$, calcule $X_L$ em Ω com uma casa decimal.`, 100*Math.PI, t`$X_L=2\pi\cdot50\cdot1\approx314{,}2\,\Omega$.`, { unit: 'Ω', tol: 0.05 }),
        gen((rng) => { const f = randInt(rng, 1, 9)*10; return num(t`Para $L=1\,\text{H}$ e $f=${f}\,\text{Hz}$, calcule $X_L$ em Ω com uma casa decimal.`, 2*Math.PI*f, t`$X_L=2\pi\cdot${f}\cdot1\approx${fmt(2*Math.PI*f,1)}\,\Omega$.`, { unit: 'Ω', tol: 0.05 }); }),
        labEx('reat', t`No gráfico ilustrativo de $X_L$ em função da frequência, ajuste a indutância para 2.`, t`Com $L=2$ na escala ilustrativa, a inclinação é positiva: $X_L$ cresce com a frequência.`),
        mcq(t`Se $f$ dobrar e $L$ for mantida, $X_L$…`, ['dobra', 'cai à metade', 'quadruplica', 'não muda'], 0, t`Na fórmula $X_L=2\pi fL$, a frequência aparece como fator.`),
        num(t`Um indutor ideal tem $X_L=20\,\Omega$ e recebe $10\,\text{V}$ eficazes. Qual a corrente eficaz em A com duas casas decimais?`, 0.5, t`$I_{ef}=V_{ef}/X_L=10/20=0{,}50\,\text{A}$.`, { unit: 'A', tol: 0.005 }),
      ] },
      { card: { title: 'Capacitor em CA', body: t`Para um capacitor ideal, $X_C=1/(\omega C)=1/(2\pi fC)$. A corrente adianta a tensão em $90^\circ$. Aqui supomos frequência positiva e regime senoidal permanente.` }, exercises: [
        tf(t`Com capacitância fixa, aumentar a frequência diminui $X_C$.`, true, t`$X_C$ é inversamente proporcional a $f$.`),
        mcq(t`Num capacitor ideal, a corrente em relação à tensão…`, ['adianta 90°', 'atrasa 90°', 'está em fase', 'atrasa 180°'], 0, t`De $i=C\,dv/dt$, a corrente adianta a tensão em $90^\circ$.`),
        num(t`Para $C=100\,\mu\text{F}$ e $f=50\,\text{Hz}$, calcule $X_C$ em Ω com uma casa decimal.`, 1/(2*Math.PI*50*100e-6), t`$C=10^{-4}\,\text{F}$ e $X_C=1/(2\pi\cdot50\cdot10^{-4})\approx31{,}8\,\Omega$.`, { unit: 'Ω', tol: 0.05 }),
        gen((rng) => { const c = randInt(rng, 1, 5)*100; const x = 1/(2*Math.PI*50*c*1e-6); return num(t`Para $f=50\,\text{Hz}$ e $C=${c}\,\mu\text{F}$, calcule $X_C$ em Ω com uma casa decimal.`, x, t`$X_C=1/(2\pi\cdot50\cdot${c}\cdot10^{-6})\approx${fmt(x,1)}\,\Omega$.`, { unit: 'Ω', tol: 0.05 }); }),
        mcq(t`Se $C$ dobrar com frequência fixa, $X_C$…`, ['cai à metade', 'dobra', 'quadruplica', 'não muda'], 0, t`Como $C$ está no denominador, dobrá-la divide $X_C$ por 2.`),
        num(t`Um capacitor ideal tem $X_C=40\,\Omega$ e recebe $20\,\text{V}$ eficazes. Qual a corrente eficaz em A com duas casas decimais?`, 0.5, t`$I_{ef}=V_{ef}/X_C=20/40=0{,}50\,\text{A}$.`, { unit: 'A', tol: 0.005 }),
        mcq(t`Ao dobrar a frequência, mantendo $L$ e $C$ fixos, o que ocorre?`, ['$X_L$ dobra e $X_C$ cai à metade', '$X_L$ cai à metade e $X_C$ dobra', 'Ambas dobram', 'Ambas caem à metade'], 0, t`$X_L\propto f$, enquanto $X_C\propto1/f$.`),
      ] },
    ] },
    { id: 'el-ca-fasor', title: 'Fasores e impedância', parts: [
      { card: { title: 'Fasores complexos', body: t`Um fasor representa amplitude e fase de uma senoide em frequência fixa. Aqui usamos módulos eficazes e referência cosseno: $V=V_{ef}\angle\phi$. O fator $j$ gira um fasor $90^\circ$; $j^2=-1$.`, visual: lab('fasor') }, exercises: [
        mcq(t`Quanto vale $j^2$?`, ['$-1$', '$1$', '$j$', '$0$'], 0, t`A unidade imaginária satisfaz $j^2=-1$.`),
        tf(t`Dois fasores podem ser somados diretamente quando representam senoides de mesma frequência.`, true, t`A dependência temporal comum pode ser omitida e as componentes complexas somadas.`),
        mcq(t`Qual é o módulo de $3+j4$?`, ['$5$', '$7$', '$1$', '$25$'], 0, t`$|3+j4|=\sqrt{3^2+4^2}=5$.`),
        gen((rng) => { const k = randInt(rng, 1, 5); return num(t`Qual o módulo de $${3*k}+j${4*k}$? Responda sem casas decimais.`, 5*k, t`$\sqrt{${3*k}^2+${4*k}^2}=${5*k}$.`, { tol: 0.5 }); }),
        labEx('fasor', t`Ajuste a amplitude para 2. O gráfico usa fase inicial de $90^\circ$ em relação ao seno.`, t`A curva é $2\sin(\pi x+\pi/2)$; o deslocamento de fase não altera a amplitude.`),
        mcq(t`Qual é a forma retangular de $2\angle90^\circ$?`, ['$j2$', '$2$', '$-2$', '$-j2$'], 0, t`$2(\cos90^\circ+j\sin90^\circ)=j2$.`),
        mcq(t`Com referência cosseno, $v(t)=10\sqrt2\cos(\omega t+30^\circ)$ corresponde a qual fasor eficaz?`, [t`$10\angle30^\circ\,\text{V}$`, t`$10\sqrt2\angle30^\circ\,\text{V}$`, t`$10\angle0^\circ\,\text{V}$`, t`$20\angle30^\circ\,\text{V}$`], 0, t`O pico é $10\sqrt2$ e o módulo eficaz é $10$; a fase continua $30^\circ$.`),
      ] },
      { card: { title: 'Impedância em série', body: t`A lei de Ohm fasorial é $V=ZI$. Num RLC série ideal, $Z=R+j(X_L-X_C)$ e $|Z|=\sqrt{R^2+(X_L-X_C)^2}$. Reatância líquida positiva é indutiva; negativa é capacitiva.` }, exercises: [
        mcq(t`Qual a impedância de um resistor ideal de $10\,\Omega$?`, [t`$10\,\Omega$`, t`$j10\,\Omega$`, t`$-j10\,\Omega$`, t`$0\,\Omega$`], 0, t`A impedância do resistor é real: $Z_R=R$.`),
        mcq(t`Qual a impedância de um capacitor com $X_C=5\,\Omega$?`, [t`$-j5\,\Omega$`, t`$j5\,\Omega$`, t`$5\,\Omega$`, t`$-5\,\Omega$`], 0, t`Para capacitor ideal, $Z_C=-jX_C$.`),
        num(t`Em série, $R=3\,\Omega$ e $X_L-X_C=4\,\Omega$. Qual $|Z|$ em Ω, sem casas decimais?`, 5, t`$|Z|=\sqrt{3^2+4^2}=5\,\Omega$.`, { unit: 'Ω', tol: 0.5 }),
        gen((rng) => { const k = randInt(rng, 1, 5); return num(t`Um circuito série tem $R=${3*k}\,\Omega$ e reatância líquida $${4*k}\,\Omega$. Qual $|Z|$ em Ω, sem casas decimais?`, 5*k, t`$|Z|=\sqrt{${3*k}^2+${4*k}^2}=${5*k}\,\Omega$.`, { unit: 'Ω', tol: 0.5 }); }),
        tf(t`Se $X_C>X_L$, a impedância série tem parte imaginária negativa.`, true, t`$\operatorname{Im}(Z)=X_L-X_C<0$.`),
        num(t`Um circuito tem $|Z|=5\,\Omega$ e recebe $10\,\text{V}$ eficazes. Qual $I_{ef}$ em A, com uma casa decimal?`, 2, t`Pelos módulos de $V=ZI$, $I_{ef}=10/5=2{,}0\,\text{A}$.`, { unit: 'A', tol: 0.05 }),
        mcq(t`Se $Z=3+j4\,\Omega$ e $I=2\angle0^\circ\,\text{A}$, qual é o fasor da tensão?`, [t`$6+j8\,\text{V}$`, t`$3+j4\,\text{V}$`, t`$6-j8\,\text{V}$`, t`$10+j0\,\text{V}$`], 0, t`$V=ZI=(3+j4)\cdot2=6+j8\,\text{V}$.`),
      ] },
    ] },
    { id: 'el-ca-resson', title: 'Ressonância', parts: [
      { card: { title: 'Ressonância série', body: t`Num RLC série ideal com $R>0$, a ressonância ocorre quando $X_L=X_C$: $f_0=1/(2\pi\sqrt{LC})$. Então $Z=R$, tensão e corrente estão em fase e a corrente é máxima para uma fonte de tensão eficaz fixa.`, visual: lab('resson') }, exercises: [
        mcq(t`Na ressonância série, as reatâncias ideais satisfazem…`, ['$X_L=X_C$', '$X_L=0$ e $X_C=0$', '$X_L=2X_C$', '$X_C=0$'], 0, t`As partes imaginárias $jX_L$ e $-jX_C$ se cancelam.`),
        tf(t`Em ressonância série, a impedância total de um RLC ideal é igual a $R$.`, true, t`$Z=R+j(X_L-X_C)=R$.`),
        num(t`No RLC série em ressonância, $R=10\,\Omega$ e $V_{ef}=20\,\text{V}$. Qual $I_{ef}$ em A com uma casa decimal?`, 2, t`$I_{ef}=V_{ef}/R=20/10=2{,}0\,\text{A}$.`, { unit: 'A', tol: 0.05 }),
        gen((rng) => { const r = randInt(rng, 2, 9)*10; return num(t`Em ressonância série, $R=${r}\,\Omega$ e $V_{ef}=${2*r}\,\text{V}$. Qual a corrente eficaz em A com uma casa decimal?`, 2, t`$I_{ef}=V_{ef}/R=${2*r}/${r}=2{,}0\,\text{A}$.`, { unit: 'A', tol: 0.05 }); }),
        labEx('resson', t`Desloque o pico da curva ilustrativa de corrente até a marca de frequência 2.`, t`No modelo ilustrativo o controle desloca o máximo para $f=2$.`),
        num(t`Para $L=1\,\text{H}$ e $C=100\,\mu\text{F}$, calcule $f_0$ em Hz com uma casa decimal.`, 1/(2*Math.PI*Math.sqrt(100e-6)), t`$f_0=1/(2\pi\sqrt{1\cdot10^{-4}})\approx15{,}9\,\text{Hz}$.`, { unit: 'Hz', tol: 0.05 }),
        mcq(t`Se $L$ quadruplicar e $C$ permanecer constante, $f_0$…`, ['cai à metade', 'dobra', 'quadruplica', 'não muda'], 0, t`$f_0\propto1/\sqrt L$; a raiz de 4 é 2.`),
      ] },
      { card: { title: 'Sintonia e fator de qualidade', body: t`No RLC série, abaixo de $f_0$ predomina a reatância capacitiva; acima, a indutiva. O fator de qualidade ideal é $Q=\omega_0L/R$. Uma resistência menor aumenta $Q$ e torna a resposta em frequência mais seletiva.`, visual: lab('resson') }, exercises: [
        tf(t`Abaixo de $f_0$, um RLC série ideal tem reatância líquida capacitiva.`, true, t`Abaixo da frequência de equilíbrio, $X_C>X_L$, logo $X_L-X_C<0$.`),
        mcq(t`Acima de $f_0$, o RLC série ideal se comporta como…`, ['indutivo', 'capacitivo', 'puramente resistivo', 'fonte de corrente'], 0, t`Acima de $f_0$, $X_L>X_C$, então a parte imaginária de $Z$ é positiva.`),
        num(t`Na ressonância, $\omega_0=100\,\text{rad/s}$, $L=2\,\text{H}$ e $R=20\,\Omega$. Calcule $Q$ sem casas decimais.`, 10, t`$Q=\omega_0 L/R=100\cdot2/20=10$.`, { tol: 0.5 }),
        gen((rng) => { const r = randInt(rng, 1, 5)*10; return num(t`Em um RLC série, $\omega_0L=200\,\Omega$ e $R=${r}\,\Omega$. Calcule $Q$ com uma casa decimal.`, 200/r, t`$Q=\omega_0 L/R=200/${r}\approx${fmt(200/r,1)}$.`, { tol: 0.05 }); }),
        mcq(t`Mantendo $L$ e $C$ fixos, reduzir $R$ num RLC série ideal…`, ['aumenta $Q$', 'reduz $Q$', 'muda $f_0$', 'elimina a ressonância'], 0, t`$Q=\omega_0L/R$; reduzir o denominador aumenta $Q$.`),
        tf(t`Na ressonância série, as tensões eficazes individuais no indutor e no capacitor podem ser maiores que a tensão da fonte.`, true, t`Suas tensões têm fases opostas e se cancelam na soma fasorial; seus módulos podem ser grandes.`),
        num(t`Em ressonância, $I_{ef}=2\,\text{A}$ e $X_L=X_C=30\,\Omega$. Qual a tensão eficaz no indutor em V, sem casas decimais?`, 60, t`$V_L=I_{ef}X_L=2\cdot30=60\,\text{V}$.`, { unit: 'V', tol: 0.5 }),
      ] },
    ] },
  ],
};

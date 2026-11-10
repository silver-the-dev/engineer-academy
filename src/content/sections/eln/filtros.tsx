import type { UnitDef } from '../../types';
import { gen, inter, mcq, near, num, tf } from '../../helpers';
import { fnLab } from '../../visuals';
import { circuit, circuitEx, circuitVisual, C, R, VAC, wires } from '../../circuits';
import { fmt, randInt } from '../../../lib/random';

const t = String.raw;
const bode = (high = false, gain = 1) => fnLab({
  f: (x) => 20 * Math.log10(gain * (high ? 10 ** x / Math.sqrt(1 + 10 ** (2 * x)) : 1 / Math.sqrt(1 + 10 ** (2 * x)))),
  params: [{ key: 'x', label: 'log₁₀(f/fc)', min: -2, max: 2, step: 0.1, value: 0 }],
  view: { xMin: -2, xMax: 2, yMin: -45, yMax: 15 },
  info: (p) => t`Eixo horizontal: $\log_{10}(f/f_c)$. Em $f/f_c=${fmt(10 ** p.x, 2)}$, ganho $=${fmt(20 * Math.log10(gain * (high ? 10 ** p.x / Math.sqrt(1 + 10 ** (2 * p.x)) : 1 / Math.sqrt(1 + 10 ** (2 * p.x)))), 1)}\,\text{dB}$.`,
});
const bandLab = () => fnLab({
  f: (x, p) => x <= 0 ? 0 : 1 / Math.sqrt(1 + (p.q * (x - 1 / x)) ** 2),
  params: [{ key: 'q', label: 'Q', min: 1, max: 5, step: 1, value: 1 }],
  view: { xMin: 0, xMax: 3, yMin: 0, yMax: 1.1 },
  info: (p) => t`RLC série, saída em R: eixo horizontal $f/f_0$, vertical $|H|$. Para $Q=${p.q}$, $BW=f_0/${p.q}$.`,
});
const bandQuestion = () => inter(t`Ajuste o fator de qualidade para que $BW=f_0/4$.`, 'plot', bandLab().props, (v) => near(v.p.q, 4, 0.01), t`$Q=4$`, t`Como $Q=f_0/BW$, para $BW=f_0/4$ temos $Q=4$.`);
const plotQuestion = (high = false) => inter(t`Ajuste o controle para $f=f_c$ no gráfico de Bode.`, 'plot', bode(high).props, (v) => near(v.p.x, 0, 0.01), t`$\log_{10}(f/f_c)=0$`, t`Como $f/f_c=1$, seu logaritmo decimal é zero e o ganho é aproximadamente $-3,0\,\text{dB}$.`);

const rc = (high: boolean, r: number) => circuit(
  VAC('fonte', [0, 0], [0, 3], 1, 100, { locked: true }),
  wires([0, 0], [1, 0]),
  ...(high ? [C('c1', [1, 0], [4, 0], 1e-6, { locked: true, fixed: true }), R('r1', [4, 0], [4, 3], r, { locked: true, values: [1000, 2000, 4000] })] : [R('r1', [1, 0], [4, 0], r, { locked: true, values: [1000, 2000, 4000] }), C('c1', [4, 0], [4, 3], 1e-6, { locked: true, fixed: true })]),
  wires([4, 3], [0, 3]),
);
const rcSpec = (high: boolean, r: number) => ({ comps: rc(high, r), mode: 'adjust' as const, scope: { ids: [high ? 'r1' : 'c1'], of: 'v' as const }, caption: 'Toque na fonte para alterar a frequência; observe a saída no osciloscópio.' });
const measure = (high: boolean) => num(t`Com a fonte em $100\,\text{Hz}$, observe o osciloscópio em regime permanente. Qual a tensão de saída pico a pico em V? Dê uma casa decimal.`, high ? 1.06 : 1.69, high ? t`$2V_p=2(0,628)/\sqrt{1+0,628^2}\approx1,1\,\text{V}$.` : t`$2V_p=2/\sqrt{1+0,628^2}\approx1,7\,\text{V}$.`, { unit: 'V', tol: 0.1, visual: circuitVisual(rcSpec(high, 1000)) });
const practical = (high: boolean, targetR: number) => {
  const ratio = 2 * Math.PI * 100 * targetR * 1e-6;
  const pp = 2 * (high ? ratio : 1) / Math.sqrt(1 + ratio * ratio);
  return circuitEx(t`Com a fonte em $100\,\text{Hz}$ e pico de $1\,\text{V}$, ajuste $R$ para que a saída em regime permanente tenha cerca de $${fmt(pp, 2)}\,\text{V}$ pico a pico.`, rcSpec(high, targetR === 1000 ? 2000 : 1000), (v) => near(v.wave(high ? 'r1' : 'c1').pp, pp, 0.08), t`$R=${targetR / 1000}\,\text{k}\Omega$`, t`Para $R=${targetR / 1000}\,\text{k}\Omega$ e $C=1\,\mu\text{F}$, $2\pi fRC\approx${fmt(ratio, 3)}$. Aplicando o módulo do filtro, a saída vale aproximadamente $${fmt(pp, 2)}\,\text{V}$ pico a pico.`, { set: { r1: targetR } });
};
const fcGen = () => gen((rng) => { const r = randInt(rng, 1, 5); const f = 1000 / (2 * Math.PI * r); return num(t`Com $R=${r}\,\text{k}\Omega$ e $C=1\,\mu\text{F}$, calcule $f_c$ em Hz, com uma casa decimal.`, f, t`$RC=${fmt(r / 1000, 3)}\,\text{s}$ e $f_c=1/(2\pi RC)\approx${fmt(f, 1)}\,\text{Hz}$.`, { unit: 'Hz', tol: 0.05 }); });

export const filtros: UnitDef = {
  id: 'ea-filt', title: 'Filtros e resposta em frequência', icon: '🎛️',
  subtitle: 'RC, decibéis, Bode, ressonância e filtros ativos',
  source: 'Conteúdo complementar: Boylestad e Nashelsky, Dispositivos eletrônicos; Sedra e Smith, Microeletrônica.', extra: true,
  guide: t`Para RC sem carga, $f_c=1/(2\pi RC)$ e, no corte, $|H|=1/\sqrt2$ do ganho da banda passante. Ganho de tensão em decibéis: $20\log_{10}|V_o/V_i|$. Num passa-faixa, $BW=f_H-f_L$ e $Q=f_0/BW$. Para RLC ideal, $f_0=1/(2\pi\sqrt{LC})$. Filtros ativos usam amplificadores e têm limites reais de alimentação e largura de banda.`,
  lessons: [
    { id: 'ea-filt-pb', title: 'Passa-baixas RC', parts: [
      { card: { title: 'Saída no capacitor', body: t`Num passa-baixas RC sem carga, o resistor fica em série e a saída é medida no capacitor. Sinais lentos passam; rápidos são atenuados. $|H|=1/\sqrt{1+(f/f_c)^2}$ e $f_c=1/(2\pi RC)$. Toque na fonte e varie a frequência; veja a tensão de saída no osciloscópio.`, visual: circuitVisual(rcSpec(false, 1000)) }, exercises: [
        tf(t`Um passa-baixas idealizado atenua mais as frequências muito acima do corte.`, true, t`O módulo diminui quando $f/f_c$ cresce.`),
        mcq(t`Onde se mede a saída deste passa-baixas RC?`, ['No capacitor', 'Apenas na fonte', 'No resistor em série', 'Em um indutor'], 0, t`O divisor RC entrega a saída sobre o capacitor.`),
        measure(false), fcGen(),
        num(t`Se $RC=1\,\text{ms}$, calcule $f_c$ em Hz com uma casa decimal.`, 159.1549, t`$f_c=1/(2\pi\cdot0,001)\approx159,2\,\text{Hz}$.`, { unit: 'Hz', tol: 0.05 }),
        practical(false, 1000), practical(false, 2000),
      ] },
      { card: { title: 'Corte e inclinação', body: t`Em $f_c$, a saída tem $1/\sqrt2\approx0,707$ da amplitude da entrada e a fase é $-45^\circ$. Para frequências bem maiores que $f_c$, a inclinação de Bode tende a $-20\,\text{dB}$ por década. A fórmula supõe carga de impedância muito alta.`, visual: bode() }, exercises: [
        tf(t`No corte, a amplitude do passa-baixas é metade da amplitude de entrada.`, false, t`A razão é $1/\sqrt2\approx0,707$, não $0,5$.`),
        measure(false),
        num(t`Na frequência de corte, com entrada de pico $10\,\text{V}$, qual o pico da saída em V? Use uma casa decimal.`, 10 / Math.sqrt(2), t`$10/\sqrt2\approx7,1\,\text{V}$.`, { unit: 'V', tol: 0.05 }),
        fcGen(),
        mcq(t`Se $R$ dobra e $C$ não muda, o corte…`, ['cai à metade', 'dobra', 'quadruplica', 'não muda'], 0, t`Como $f_c=1/(2\pi RC)$, dobrar $R$ divide $f_c$ por dois.`),
        practical(false, 2000), practical(false, 1000),
      ] },
    ] },
    { id: 'ea-filt-pa', title: 'Passa-altas RC', parts: [
      { card: { title: 'Saída no resistor', body: t`Troque as posições: capacitor em série, resistor ao retorno, saída sobre o resistor. Em regime senoidal e sem carga, $|H|=(f/f_c)/\sqrt{1+(f/f_c)^2}$. Frequências baixas são atenuadas; a componente contínua é bloqueada em regime permanente.`, visual: circuitVisual(rcSpec(true, 1000)) }, exercises: [
        tf(t`O passa-altas RC atenua a componente contínua em regime permanente.`, true, t`Em corrente contínua permanente, o capacitor ideal se comporta como circuito aberto.`),
        mcq(t`A saída do passa-altas RC mostrado é medida sobre qual componente?`, ['Resistor', 'Capacitor em série', 'Fonte', 'Indutor'], 0, t`A saída está entre os terminais do resistor.`),
        measure(true), fcGen(),
        num(t`No corte de um passa-altas com entrada de pico $4\,\text{V}$, qual a saída de pico em V com uma casa decimal?`, 4 / Math.sqrt(2), t`$4/\sqrt2\approx2,8\,\text{V}$.`, { unit: 'V', tol: 0.05 }),
        practical(true, 1000), practical(true, 2000),
      ] },
      { card: { title: 'Fase e resposta', body: t`O passa-altas de primeira ordem tem fase $+45^\circ$ em $f_c$. Muito abaixo do corte, a inclinação de amplitude tende a $+20\,\text{dB}$ por década; muito acima, o ganho tende a unidade. Aumentar $C$ reduz $f_c$.`, visual: bode(true) }, exercises: [
        tf(t`Muito acima do corte, o ganho de tensão do RC passa-altas sem carga tende a 1.`, true, t`Quando $f/f_c$ cresce, a razão da expressão tende a $1$.`),
        measure(true),
        mcq(t`Se a capacitância dobra e o resistor permanece fixo, o corte…`, ['cai à metade', 'dobra', 'permanece igual', 'quadruplica'], 0, t`$f_c$ é inversamente proporcional a $C$.`),
        fcGen(),
        num(t`Se $f_c=200\,\text{Hz}$ e $R$ dobra, qual o novo corte em Hz? Dê um inteiro.`, 100, t`Dobrar $R$ reduz o corte à metade: $200/2=100\,\text{Hz}$.`, { unit: 'Hz', tol: 0.5 }),
        practical(true, 2000), practical(true, 1000),
      ] },
    ] },
    { id: 'ea-filt-bode', title: 'Decibéis e diagrama de Bode', parts: [
      { card: { title: 'Razão em decibéis', body: t`Para amplitudes de tensão, $G_{dB}=20\log_{10}|V_o/V_i|$. Para razões de potência, use $10\log_{10}(P_o/P_i)$. Ganhos de etapas em cascata somam em dB, desde que os ganhos usados incluam o carregamento entre elas.`, visual: bode() }, exercises: [
        tf(t`Ganho de tensão unitário equivale a $0\,\text{dB}$.`, true, t`$20\log_{10}1=0\,\text{dB}$.`),
        num(t`Uma razão de tensão igual a 10 corresponde a quantos dB? Dê um inteiro.`, 20, t`$20\log_{10}10=20\,\text{dB}$.`, { unit: 'dB', tol: 0.5 }),
        plotQuestion(),
        num(t`Duas etapas têm ganhos carregados de $6\,\text{dB}$ e $-3\,\text{dB}$. Qual o ganho total em dB? Dê um inteiro.`, 3, t`Somam-se os ganhos: $6-3=3\,\text{dB}$.`, { unit: 'dB', tol: 0.5 }),
        gen((rng) => { const k = randInt(rng, 1, 3); return num(t`Uma razão de tensão é $10^{${k}}$. Qual o ganho em dB? Dê um inteiro.`, 20*k, t`$20\log_{10}(10^{${k}})=20\cdot${k}=${20*k}\,\text{dB}$.`, { unit: 'dB', tol: 0.5 }); }),
        mcq(t`Uma razão de potência igual a 100 corresponde a…`, ['$20\\,\\text{dB}$', '$40\\,\\text{dB}$', '$100\\,\\text{dB}$', '$10\\,\\text{dB}$'], 0, t`Para potência, $10\log_{10}100=20\,\text{dB}$.`),
        num(t`Se $V_o/V_i=0,1$, qual o ganho em dB? Dê um inteiro.`, -20, t`$20\log_{10}(0,1)=-20\,\text{dB}$.`, { unit: 'dB', tol: 0.5 }),
      ] },
      { card: { title: 'Lendo Bode', body: t`O eixo horizontal usa frequência logarítmica: uma década é fator 10. O gráfico mostra ganho em dB e, separadamente, fase. No gráfico abaixo, $x=\log_{10}(f/f_c)$; o ponto de corte tem $x=0$ e ganho aproximadamente $-3,01\,\text{dB}$ para ganho passante unitário.`, visual: bode() }, exercises: [
        tf(t`De $100\,\text{Hz}$ a $1\,\text{kHz}$ há uma década.`, true, t`A razão é $1000/100=10$.`),
        plotQuestion(),
        num(t`No corte de um RC de ganho passante unitário, qual o ganho em dB com uma casa decimal?`, -3.0103, t`$20\log_{10}(1/\sqrt2)\approx-3,0\,\text{dB}$.`, { unit: 'dB', tol: 0.05 }),
        gen((rng) => { const f = randInt(rng, 1, 9)*100; return num(t`Uma década acima de $${f}\,\text{Hz}$ está qual frequência em Hz? Dê um inteiro.`, f*10, t`Uma década multiplica por 10: $${f}\cdot10=${f*10}\,\text{Hz}$.`, { unit: 'Hz', tol: 0.5 }); }),
        mcq(t`Qual a inclinação assintótica de um passa-baixas RC bem acima do corte?`, ['$-20\\,\\text{dB/década}$', '$+20\\,\\text{dB/década}$', '$0\\,\\text{dB/década}$', '$-40\\,\\text{dB/década}$'], 0, t`Um polo de primeira ordem contribui com $-20\,\text{dB}$ por década.`),
        num(t`Uma assíntota cai $20\,\text{dB}$ por década. Se está em $-20\,\text{dB}$ em $10\,\text{kHz}$, quanto estará em $100\,\text{kHz}$? Em dB, inteiro.`, -40, t`Há uma década; $-20-20=-40\,\text{dB}$.`, { unit: 'dB', tol: 0.5 }),
        tf(t`O valor exato no corte coincide com a interseção das assíntotas de ganho do RC.`, false, t`As assíntotas se encontram em $0\,\text{dB}$, enquanto o valor exato é aproximadamente $-3,01\,\text{dB}$.`),
      ] },
    ] },
    { id: 'ea-filt-pf', title: 'Passa-faixa e ressonância', parts: [
      { card: { title: 'Faixa de passagem', body: t`Um passa-faixa atenua frequências baixas e altas e deixa passar uma faixa intermediária. Para frequências de meia potência $f_L$ e $f_H$, a largura de banda é $BW=f_H-f_L$. O fator de qualidade é $Q=f_0/BW$, com $f_0$ a frequência central.`, visual: bandLab() }, exercises: [
        tf(t`Um passa-faixa favorece uma faixa intermediária de frequências.`, true, t`Sua resposta é atenuada abaixo e acima da faixa passante.`),
        mcq(t`O que representa $BW=f_H-f_L$?`, ['Largura de banda', 'Ganho em tensão', 'Potência de entrada', 'Fase no corte'], 0, t`A diferença entre os limites de meia potência é a largura de banda.`),
        bandQuestion(),
        num(t`Se $f_L=800\,\text{Hz}$ e $f_H=1200\,\text{Hz}$, qual $BW$ em Hz? Dê um inteiro.`, 400, t`$BW=1200-800=400\,\text{Hz}$.`, { unit: 'Hz', tol: 0.5 }),
        gen((rng) => { const a = randInt(rng, 2, 8)*100; return num(t`Uma faixa vai de $${a}\,\text{Hz}$ a $${a+300}\,\text{Hz}$. Qual a largura em Hz? Dê um inteiro.`, 300, t`$BW=${a+300}-${a}=300\,\text{Hz}$.`, { unit: 'Hz', tol: 0.5 }); }),
        num(t`Para $f_0=1000\,\text{Hz}$ e $BW=200\,\text{Hz}$, calcule $Q$ com uma casa decimal.`, 5, t`$Q=f_0/BW=1000/200=5,0$.`, { tol: 0.05 }),
        tf(t`Para a mesma frequência central, maior $Q$ significa menor largura de banda.`, true, t`De $BW=f_0/Q$, aumentar $Q$ diminui $BW$ quando $f_0$ é fixo.`),
      ] },
      { card: { title: 'Ressonância RLC', body: t`Num RLC ideal, a ressonância ocorre quando $X_L=X_C$ e $f_0=1/(2\pi\sqrt{LC})$. Em um RLC série, a impedância é mínima na ressonância; a saída sobre $R$ forma um passa-faixa. A resistência determina o amortecimento e a largura de banda.`, visual: bandLab() }, exercises: [
        tf(t`Na ressonância RLC ideal, os módulos das reatâncias indutiva e capacitiva são iguais.`, true, t`A condição é $\omega L=1/(\omega C)$.`),
        mcq(t`Em RLC série ideal, a impedância na ressonância é…`, ['mínima e igual a R', 'infinita', 'igual à reatância do capacitor', 'sempre zero'], 0, t`As reatâncias se cancelam e resta a resistência $R$.`),
        bandQuestion(),
        num(t`Se $f_0=2000\,\text{Hz}$ e $BW=500\,\text{Hz}$, calcule $Q$ com uma casa decimal.`, 4, t`$Q=2000/500=4,0$.`, { tol: 0.05 }),
        gen((rng) => { const q = randInt(rng, 2, 8); return num(t`Um passa-faixa tem $f_0=${q*200}\,\text{Hz}$ e $BW=200\,\text{Hz}$. Qual $Q$ com uma casa decimal?`, q, t`$Q=${q*200}/200=${q},0$.`, { tol: 0.05 }); }),
        num(t`Para $L=1\,\text{mH}$ e $C=1\,\mu\text{F}$, calcule $f_0$ em Hz com uma casa decimal.`, 1/(2*Math.PI*Math.sqrt(1e-9)), t`$LC=10^{-9}$ e $f_0=1/(2\pi\sqrt{10^{-9}})\approx5032,9\,\text{Hz}$.`, { unit: 'Hz', tol: 0.05 }),
        mcq(t`Se $L$ quadruplica e $C$ permanece fixo, $f_0$…`, ['cai à metade', 'dobra', 'quadruplica', 'não muda'], 0, t`$f_0\propto1/\sqrt L$; portanto o fator é $1/\sqrt4=1/2$.`),
      ] },
    ] },
    { id: 'ea-filt-ativos', title: 'Filtros ativos', parts: [
      { card: { title: 'Ganho e isolamento', body: t`Filtros ativos combinam componentes reativos e amplificadores alimentados. Um seguidor de tensão após um RC pode isolar uma carga de alta impedância de entrada; um amplificador pode fornecer ganho. Um passa-baixas RC ideal seguido de estágio ideal de ganho $K$ tem $|H|=K/\sqrt{1+(f/f_c)^2}$.`, visual: bode(false, 2) }, exercises: [
        tf(t`Um filtro ativo pode fornecer ganho de tensão.`, true, t`A energia adicional vem da alimentação do amplificador.`),
        mcq(t`Qual a função de um seguidor ideal depois de um RC?`, ['Isolar a carga do RC', 'Eliminar a alimentação do amplificador', 'Transformar sempre o filtro em passa-altas', 'Gerar uma fonte independente'], 0, t`O seguidor ideal tem entrada de alta impedância e saída de baixa impedância.`),
        plotQuestion(),
        num(t`Um estágio ideal de ganho 2 recebe $0,5\,\text{V}$ de pico dentro de sua faixa linear. Qual a saída de pico em V com uma casa decimal?`, 1, t`$V_o=2\cdot0,5=1,0\,\text{V}$.`, { unit: 'V', tol: 0.05 }),
        gen((rng) => { const k = randInt(rng, 2, 6); return num(t`Um estágio ideal linear tem ganho ${k} e entrada de pico $1\,\text{V}$. Qual a saída de pico em V com uma casa decimal?`, k, t`$V_o=${k}\cdot1=${k},0\,\text{V}$.`, { unit: 'V', tol: 0.05 }); }),
        num(t`Um passa-baixas ideal tem ganho passante 2. No corte, qual o módulo do ganho com duas casas decimais?`, Math.SQRT2, t`$2/\sqrt2\approx1,41$.`, { tol: 0.005 }),
        tf(t`Em um filtro com ganho passante 2, o corte corresponde a aproximadamente $-3\,\text{dB}$ em relação ao ganho passante.`, true, t`No corte a amplitude é dividida por $\sqrt2$, diferença de $20\log_{10}(1/\sqrt2)\approx-3,01\,\text{dB}$.`),
      ] },
      { card: { title: 'Limites reais', body: t`Amplificadores operacionais reais exigem alimentação e têm faixa limitada de saída, largura de banda e slew rate. Fora da região linear, a saída pode saturar ou distorcer. A ordem do filtro depende de seus polos: cada polo de primeira ordem contribui assintoticamente com $-20\,\text{dB/década}$ acima dele.`, visual: bode(false, 2) }, exercises: [
        tf(t`A saída real de um amplificador não pode crescer sem limite mantendo alimentação fixa.`, true, t`A faixa de saída é limitada pelas tensões de alimentação e pelo circuito.`),
        plotQuestion(),
        mcq(t`Ao exigir uma saída além da faixa disponível do amplificador, pode ocorrer…`, ['saturação e distorção', 'ganho infinito', 'ausência de alimentação', 'frequência negativa'], 0, t`A saída atinge seu limite e a senoide pode ser recortada.`),
        num(t`Dois polos de primeira ordem contribuem com qual inclinação assintótica total em dB por década, bem acima de ambos? Dê um inteiro.`, -40, t`Cada polo contribui com $-20\,\text{dB/década}$; a soma é $-40\,\text{dB/década}$.`, { unit: 'dB/década', tol: 0.5 }),
        gen((rng) => { const n = randInt(rng, 1, 4); return num(t`Quantos dB por década contribuem ${n} polos de primeira ordem, bem acima de todos? Dê um inteiro.`, -20*n, t`A contribuição é $${n}\cdot(-20)=${-20*n}\,\text{dB/década}$.`, { unit: 'dB/década', tol: 0.5 }); }),
        tf(t`Mesmo dentro da faixa de tensão, a largura de banda e o slew rate podem limitar um amplificador real.`, true, t`A resposta em frequência e a velocidade máxima de variação limitam sinais rápidos.`),
        num(t`Um filtro tem ganho passante $20\,\text{dB}$. Qual o ganho no corte em dB, aproximadamente, com uma casa decimal?`, 20 - 10*Math.log10(2), t`O corte fica $3,01\,\text{dB}$ abaixo da banda: $20-3,01\approx17,0\,\text{dB}$.`, { unit: 'dB', tol: 0.05 }),
      ] },
    ] },
  ],
};

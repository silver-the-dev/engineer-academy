import type { ExerciseSource, UnitDef } from '../../types';
import { gen, inter, mcq, near, num, tf } from '../../helpers';
import { randInt } from '../../../lib/random';
import { fnLab } from '../../visuals';
import { circuit, circuitEx, circuitVisual, GND, OPAMP, R, V, wires } from '../../circuits';

const t = String.raw;
const q = (p: string, a: string, b: string, c: string, d: string, e: string) => mcq(p, [a, b, c, d], 0, e);
const n = (p: string, a: number, e: string, unit = 'V') => num(p, a, e, { unit, tol: 0.05 });
const randomScale = (label: string, factor: number, unit = 'V') => gen(rng => {
  const x = randInt(rng, 1, 4);
  return num(t`${label} $${x}$? Responda em ${unit}, com uma casa decimal.`, x * factor,
    t`Multiplicando pelo fator $${factor}$, obtemos $${x}\cdot(${factor})=${x * factor}\,\text{${unit}}$.`, { unit, tol: 0.05 });
});

// O nó inversor é [3,1]; os fios se conectam apenas pelas pontas.
const inv = (rf = 2000, vin = 1) => circuit(
  OPAMP('op', [3, 1], { locked: true, rails: [-15, 15] }),
  GND([3, 3]), V('vin', [0, 1], [0, 3], vin, { fixed: true, locked: true }),
  wires([0, 3], [3, 3]), R('ri', [0, 1], [3, 1], 1000, { fixed: true, locked: true, label: 'Ri' }),
  wires([3, 1], [3, 0]), R('rf', [3, 0], [6, 0], rf, { locked: true, label: 'Rf', min: 1000, max: 6000, values: [1000, 2000, 3000, 4000, 6000] }),
  wires([6, 0], [6, 2]),
);
const non = (rf = 2000, vin = 1) => circuit(
  OPAMP('op', [3, 1], { locked: true, rails: [-15, 15] }),
  GND([0, 3]), V('vin', [3, 3], [0, 3], vin, { fixed: true, locked: true }),
  R('ri', [0, 1], [3, 1], 1000, { fixed: true, locked: true, label: 'Ri' }), wires([0, 1], [0, 3]),
  wires([3, 1], [3, 0]), R('rf', [3, 0], [6, 0], rf, { locked: true, label: 'Rf', min: 1000, max: 6000, values: [1000, 2000, 3000, 4000, 6000] }), wires([6, 0], [6, 2]),
);
const cmp = (vin = 1) => circuit(
  OPAMP('op', [3, 1], { locked: true, rails: [-15, 15] }), GND([3, 1]),
  V('vin', [3, 3], [0, 3], vin, { locked: true, label: 'Vin', min: -2, max: 2, values: [-2, -1, 1, 2] }),
  wires([0, 3], [0, 1], [3, 1]),
);
type Kind = 'inv' | 'non' | 'cmp';
const spec = (k: Kind, value = 2000) => ({ comps: k === 'inv' ? inv(value) : k === 'non' ? non(value) : cmp(value === 2000 ? 1 : -1), mode: 'adjust' as const });
const practice = (k: Kind): ExerciseSource[] => {
  if (k === 'cmp') return [
    mcq(t`Meça a saída do amp-op no circuito. Qual é a leitura aproximada?`, [t`$+15\,\text{V}$`, t`$-15\,\text{V}$`, t`$+1\,\text{V}$`, t`$0\,\text{V}$`], 0, t`$V_+=1\,\text{V}$ supera $V_-=0$, então a saída vai ao trilho positivo.`, { visual: circuitVisual(spec('cmp')) }),
    circuitEx(t`Ajuste a fonte para levar a saída ao trilho negativo, abaixo de $-14\,\text{V}$.`, spec('cmp'), v => v.v('op') < -14, t`Ajuste Vin para $-1\,\text{V}$.`, t`Com $V_+=-1\,\text{V}<V_-=0$, a saída satura em $-15\,\text{V}$.`, { set: { vin: -1 } }),
    circuitEx(t`Ajuste a fonte para levar a saída ao trilho positivo, acima de $14\,\text{V}$.`, spec('cmp', 1000), v => v.v('op') > 14, t`Ajuste Vin para $1\,\text{V}$.`, t`Com $V_+=1\,\text{V}>V_-=0$, a saída satura em $+15\,\text{V}$.`, { set: { vin: 1 } }),
  ];
  const a = k === 'inv' ? -2 : 3;
  const b = k === 'inv' ? -3 : 4;
  const c = k === 'inv' ? -4 : 5;
  const formula = k === 'inv' ? t`$V_o=-R_f V_i/R_i$` : t`$V_o=(1+R_f/R_i)V_i$`;
  return [
    mcq(t`Meça a saída do amp-op no circuito. Qual leitura é aproximada?`, [`$${a}\\,\\text{V}$`, `$${-a}\\,\\text{V}$`, '$0\\,\\text{V}$', '$15\\,\\text{V}$'], 0,
      t`Com $R_i=1\,\text{k}\Omega$, $R_f=2\,\text{k}\Omega$ e $V_i=1\,\text{V}$, ${formula} resulta em $${a}\,\text{V}$.`, { visual: circuitVisual(spec(k)) }),
    circuitEx(t`Ajuste $R_f$ para obter aproximadamente $${b}\,\text{V}$ na saída.`, spec(k), v => near(v.v('op'), b, 0.05), t`Use $R_f=3\,\text{k}\Omega$.`, t`Com $R_i=1\,\text{k}\Omega$ e entrada de $1\,\text{V}$, ${formula} dá $${b}\,\text{V}$.`, { set: { rf: 3000 } }),
    circuitEx(t`Ajuste $R_f$ para obter aproximadamente $${c}\,\text{V}$ na saída.`, spec(k), v => near(v.v('op'), c, 0.05), t`Use $R_f=4\,\text{k}\Omega$.`, t`Com $R_i=1\,\text{k}\Omega$ e entrada de $1\,\text{V}$, ${formula} dá $${c}\,\text{V}$.`, { set: { rf: 4000 } }),
  ];
};
type Data = { title: string; body: string; questions: ExerciseSource[]; kind: Kind };
const part = (d: Data) => ({
  card: { title: d.title, body: d.body, visual: circuitVisual({ ...spec(d.kind), caption: 'Toque nos componentes para medir e varie os valores disponíveis.' }) },
  exercises: [...d.questions, ...practice(d.kind)],
});
const lab = () => fnLab({ f: (x, p) => Math.max(-15, Math.min(15, p.a * x)), view: { xMin: -4, xMax: 4, yMin: -16, yMax: 16 }, params: [{ key: 'a', label: 'inclinação', min: -4, max: 4, step: 1, value: 1 }], info: p => t`A inclinação é $${p.a}$; a curva é limitada a $\pm15\,\text{V}$.` });
const labExercise = () => inter(t`Ajuste a inclinação para $-2$.`, 'plot', lab().props, v => near(v.p.a, -2, 0.01), t`Inclinação $-2$.`, t`Uma rampa de entrada com coeficiente $-2$ tem inclinação $-2$.`);

export const ampOp: UnitDef = {
  id: 'ea-opamp', title: 'Amplificadores operacionais', icon: '🔼',
  subtitle: 'Realimentação, comparação e operações com sinais',
  source: 'Conteúdo extra · Sedra e Smith, Microeletrônica; Boylestad e Nashelsky, Dispositivos Eletrônicos e Teoria de Circuitos', extra: true,
  guide: t`No modelo ideal, as entradas não absorvem corrente. Com realimentação negativa e saída linear, $V_-=V_+$; isso não implica ligação física. Inversor: $V_o=-R_fV_i/R_i$; não inversor: $V_o=(1+R_f/R_i)V_i$. Fora da faixa linear, limite a saída aos trilhos $\pm15\,\text{V}$. Somador inversor: $V_o=-R_f\sum V_k/R_k$. Diferencial com razões casadas: $V_o=(R_f/R_i)(V_2-V_1)$. Integrador: $V_o(t)=V_o(0)-\frac1{RC}\int_0^t V_i(\tau)\,d\tau$; diferenciador: $V_o=-RC\,dV_i/dt$.`,
  lessons: [
    { id: 'ea-opamp-ideal', title: 'O amp-op ideal', parts: [
      part({ title: 'Entradas e saída', kind: 'inv', body: t`O amp-op amplifica a diferença $V_+-V_-$. No ideal, as entradas não absorvem corrente; a saída é limitada pela alimentação. Aqui os trilhos são $-15$ e $+15\,\text{V}$. O simulador usa ganho aberto finito $10^5$.`, questions: [
        q('Quais são as duas entradas do amp-op?', 'Não inversora (+) e inversora (−)', 'Fase e neutro', 'Coletor e emissor', 'Ânodo e cátodo', 'Os sinais indicam como cada entrada afeta a saída em malha aberta.'),
        tf('No modelo ideal, a corrente nas entradas é nula.', true, 'A resistência de entrada ideal é infinita, portanto nenhuma corrente entra nos terminais.'),
        n(t`Com ganho aberto idealizado de $100$ e diferença $0,02\,\text{V}$, qual a saída linear em V, com uma casa decimal?`, 2, t`$100\cdot0,02=2\,\text{V}$, dentro dos trilhos.`),
        randomScale(t`Para ganho aberto $2$, ainda sem saturação, qual saída em V corresponde à diferença de entrada em V`, 2),
      ] }),
      part({ title: 'Curto virtual e saturação', kind: 'inv', body: t`Com realimentação negativa, ganho ideal infinito e saída não saturada, $V_-\approx V_+$. Chama-se **curto virtual**: tensões iguais não significam um fio entre as entradas. Uma saída calculada além dos trilhos satura e essa aproximação pode falhar.`, questions: [
        q('Quando se aplica o curto virtual?', 'Com realimentação negativa e saída linear', 'Em qualquer comparador', 'Com saída sempre saturada', 'Somente com entradas fisicamente ligadas', 'A realimentação negativa mantém a diferença pequena apenas enquanto a saída pode responder linearmente.'),
        tf('Curto virtual significa corrente elevada entre as entradas.', false, 'As entradas ideais não absorvem corrente; não existe fio entre elas.'),
        n(t`O cálculo linear prevê $20\,\text{V}$ e os trilhos são $\pm15\,\text{V}$. Qual a saída em V, com uma casa decimal?`, 15, t`A saída é limitada ao trilho positivo: $+15\,\text{V}$.`),
        randomScale(t`Em realimentação negativa linear, qual $V_-$ em V quando $V_+$ vale, em V`, 1),
      ] }),
    ] },
    { id: 'ea-opamp-inv', title: 'Amplificador inversor', parts: [
      part({ title: 'Ganho inversor', kind: 'inv', body: t`A entrada passa por $R_i$ até o terminal inversor; o terminal não inversor está aterrado. Com realimentação negativa linear, o nó inversor é terra virtual e $V_o=-\frac{R_f}{R_i}V_i$.`, questions: [
        q('Qual o sinal do ganho inversor?', 'Negativo', 'Sempre positivo', 'Sempre zero', 'Indeterminado', 'A realimentação exige tensão de saída oposta à entrada para equilibrar as correntes.'),
        tf('Terra virtual é um fio ligado ao terra.', false, 'O nó tem aproximadamente zero volt, mas não está fisicamente aterrado.'),
        n(t`Com $R_f=6\,\text{k}\Omega$, $R_i=2\,\text{k}\Omega$ e $V_i=2\,\text{V}$, ache $V_o$ em V, com uma casa decimal.`, -6, t`$V_o=-(6/2)\cdot2=-6\,\text{V}$.`),
        randomScale(t`Num inversor de ganho $-2$, qual a saída em V para entrada em V`, -2),
      ] }),
      part({ title: 'Corrente e limite', kind: 'inv', body: t`A corrente pelo resistor de entrada é $I_i=(V_i-V_-)/R_i$. Como não entra corrente no amp-op ideal, ela percorre $R_f$. Calcule o resultado linear e depois confira os trilhos.`, questions: [
        q('Qual corrente entra no terminal inversor ideal?', t`$0\,\text{A}$`, t`$1\,\text{A}$`, t`$15\,\text{A}$`, 'Depende de $R_f$', 'A resistência de entrada ideal é infinita.'),
        n(t`Se $V_i=2\,\text{V}$ e $R_i=1\,\text{k}\Omega$, ache a corrente de entrada em mA, com uma casa decimal.`, 2, t`$I_i=2/1000=0,002\,\text{A}=2\,\text{mA}$.`, 'mA'),
        tf(t`Um inversor de ganho $-10$ e entrada $2\,\text{V}$ pode fornecer $-20\,\text{V}$ com trilhos $\pm15\,\text{V}$.`, false, t`O resultado linear excede o trilho; no modelo adotado a saída satura em $-15\,\text{V}$.`),
        randomScale(t`Para $R_i=1\,\text{k}\Omega$ e terra virtual, qual corrente em mA resulta de entrada em V`, 1, 'mA'),
      ] }),
    ] },
    { id: 'ea-opamp-ninv', title: 'Não inversor e seguidor', parts: [
      part({ title: 'Ganho não inversor', kind: 'non', body: t`A entrada vai ao terminal $+$. O divisor $R_i$ para o terra e $R_f$ para a saída realimenta o terminal $-$. Em regime linear, $V_o=(1+R_f/R_i)V_i$.`, questions: [
        q('Qual a polaridade do ganho não inversor?', 'Positiva', 'Negativa', 'Nula', 'Alterna a cada ciclo', 'O sinal aplicado ao terminal positivo é reproduzido com ganho positivo.'),
        n(t`Se $R_i=2\,\text{k}\Omega$, $R_f=4\,\text{k}\Omega$ e $V_i=2\,\text{V}$, determine $V_o$ em V, com uma casa decimal.`, 6, t`$(1+4/2)\cdot2=6\,\text{V}$.`),
        tf('Com resistores positivos, o ganho não inversor é maior que 1.', true, t`$1+R_f/R_i>1$ para ambos resistores positivos.`),
        randomScale(t`Para ganho não inversor $3$, qual a saída em V se a entrada em V é`, 3),
      ] }),
      part({ title: 'Seguidor de tensão', kind: 'non', body: t`No seguidor, a saída é ligada diretamente à entrada inversora: $V_o\approx V_i$. Ele oferece alta resistência de entrada e pode isolar a fonte da carga. Na prática sua corrente de saída e sua excursão são limitadas.`, questions: [
        q('Qual é o ganho ideal do seguidor?', '$+1$', '$-1$', '$0$', '$+10$', t`A realimentação direta força $V_o=V_+=V_i$ em regime linear.`),
        tf('O seguidor ideal não solicita corrente da fonte de sinal.', true, 'Sua entrada ideal tem resistência infinita; uma carga ligada à saída pode receber corrente do amplificador.'),
        n(t`Um seguidor recebe $-4\,\text{V}$. Qual sua saída em V, com uma casa decimal?`, -4, t`$V_o=V_i=-4\,\text{V}$.`),
        randomScale(t`No seguidor linear, qual a saída em V para entrada em V`, 1),
      ] }),
    ] },
    { id: 'ea-opamp-soma', title: 'Somador e diferencial', parts: [
      part({ title: 'Somador inversor', kind: 'inv', body: t`No somador inversor, cada entrada $V_k$ chega ao nó inversor por seu resistor $R_k$. As correntes se somam e $V_o=-R_f(V_1/R_1+V_2/R_2)$. O circuito abaixo ilustra um ramo isolado do somador.`, questions: [
        q('O que se soma no nó inversor do somador?', 'As correntes dos ramos de entrada', 'As resistências em série', 'As correntes das entradas do amp-op ideal', 'Os trilhos da fonte', 'Pela lei dos nós, a soma das correntes dos ramos percorre o resistor de realimentação.'),
        tf('Entradas com resistores diferentes podem ter pesos diferentes.', true, t`O peso de cada tensão é $-R_f/R_k$.`),
        n(t`Com três resistores iguais e entradas $1$ e $2\,\text{V}$, qual a saída em V, com uma casa decimal?`, -3, t`$V_o=-(1+2)=-3\,\text{V}$.`),
        gen(rng => { const x = randInt(rng, 1, 4); return num(t`No somador com resistores iguais, $V_1=${x}\,\text{V}$ e $V_2=1\,\text{V}$. Calcule a saída em V, com uma casa decimal.`, -(x + 1), t`$V_o=-(${x}+1)=-${x + 1}\,\text{V}$.`, { unit: 'V', tol: 0.05 }); }),
      ] }),
      part({ title: 'Amplificador diferencial', kind: 'non', body: t`Com os pares de resistores em razões casadas, o diferencial fornece $V_o=(R_f/R_i)(V_2-V_1)$. O casamento permite rejeitar a componente comum no modelo ideal. O circuito abaixo é uma etapa não inversora para explorar realimentação.`, questions: [
        q('Que grandeza o diferencial ideal amplifica?', 'A diferença entre as entradas', 'A soma das alimentações', 'O produto das entradas', 'Só a tensão comum', t`Com razões casadas, $V_o=(R_f/R_i)(V_2-V_1)$.`),
        tf('Entradas iguais geram saída zero no diferencial ideal balanceado.', true, t`$V_2-V_1=0$, portanto $V_o=0$.`),
        n(t`Se a razão é $2$, $V_2=4\,\text{V}$ e $V_1=1\,\text{V}$, determine a saída em V, com uma casa decimal.`, 6, t`$2(4-1)=6\,\text{V}$.`),
        randomScale(t`Num diferencial com razão $2$, qual a saída em V para diferença de entrada em V`, 2),
      ] }),
    ] },
    { id: 'ea-opamp-comp', title: 'Comparador', parts: [
      part({ title: 'Comparar tensões', kind: 'cmp', body: t`Sem realimentação negativa, o comparador usa o sinal de $V_+-V_-$. No modelo com trilhos $\pm15\,\text{V}$, saída positiva indica $V_+>V_-$; saída negativa indica $V_+<V_-$. Não aplique curto virtual.`, questions: [
        q(t`Se $V_+>V_-$, qual saída do comparador ideal com trilhos $\pm15\,\text{V}$?`, '$+15\\,\\text{V}$', '$-15\\,\\text{V}$', '$0\\,\\text{V}$', '$+1\\,\\text{V}$', 'A diferença positiva faz a saída atingir o trilho positivo.'),
        tf('O comparador aberto deve obedecer sempre a $V_+=V_-$.', false, 'Sem realimentação negativa linear não há condição de curto virtual.'),
        n(t`Se $V_+=-2\,\text{V}$ e $V_-=0$, qual saída em V, com uma casa decimal?`, -15, t`A diferença é negativa; a saída atinge $-15\,\text{V}$.`),
        gen(rng => { const x = randInt(rng, 1, 5); return num(t`Para $V_+=${x}\,\text{V}$ e $V_-=0$, determine a saída em V, com uma casa decimal, nos trilhos $\pm15\,\text{V}$.`, 15, t`Como $${x}>0$, a saída satura em $+15\,\text{V}$.`, { unit: 'V', tol: 0.05 }); }),
      ] }),
      part({ title: 'Limiar e inversão', kind: 'cmp', body: t`Uma referência pode ser aplicada a uma entrada e o sinal à outra. Se o sinal estiver em $V_+$, a saída sobe quando ele supera a referência em $V_-$. Trocando as entradas, inverte-se a decisão. Na igualdade, o estado ideal é indeterminado.`, questions: [
        q(t`Com sinal em $V_+$ e referência em $V_-$, quando a saída é positiva?`, 'Quando o sinal supera a referência', 'Quando o sinal é menor', 'Quando os dois são sempre iguais', 'Somente quando o sinal é zero', 'A saída acompanha o sinal da diferença $V_+-V_-$. '),
        tf('Um comparador ideal simples tem estado definido na igualdade exata das entradas.', false, 'Na igualdade, o sinal da diferença não seleciona um dos trilhos; não se deve presumir um estado.'),
        n(t`Sinal em $V_+$ vale $3\,\text{V}$; referência em $V_-$ vale $2\,\text{V}$. Qual saída em V, com uma casa decimal?`, 15, t`$3>2$, logo a saída atinge $+15\,\text{V}$.`),
        gen(rng => { const ref = randInt(rng, 1, 5); return num(t`A referência em $V_-$ é $${ref}\,\text{V}$ e o sinal em $V_+$ é $${ref + 1}\,\text{V}$. Qual saída em V, com uma casa decimal, com trilhos $\pm15\,\text{V}$?`, 15, t`A diferença é $1\,\text{V}>0$; a saída é $+15\,\text{V}$.`, { unit: 'V', tol: 0.05 }); }),
      ] }),
    ] },
    { id: 'ea-opamp-int', title: 'Integrador e diferenciador', parts: [
      { card: { title: 'Integrador inversor', body: t`Com resistor na entrada e capacitor na realimentação, em regime ideal linear, $V_o(t)=V_o(0)-\frac1{RC}\int_0^t V_i(\tau)\,d\tau$. Entrada constante gera rampa de saída; a condição inicial importa. O gráfico permite variar a inclinação, limitada a $\pm15\,\text{V}$.`, visual: lab() }, exercises: [
        q('Uma entrada constante positiva produz qual saída no integrador inversor ideal?', 'Uma rampa decrescente', 'Uma rampa crescente', 'Uma senoide', 'Uma saída sempre constante', t`$dV_o/dt=-V_i/(RC)$ é negativo para entrada positiva.`),
        tf('A tensão inicial da saída influencia a resposta do integrador.', true, 'A integral determina a variação; a tensão inicial soma-se a ela.'),
        n(t`Para $RC=1\,\text{s}$, $V_i=2\,\text{V}$ e $V_o(0)=0$, qual a inclinação em V/s, com uma casa decimal?`, -2, t`$dV_o/dt=-2/1=-2\,\text{V/s}$.`, 'V/s'),
        n(t`Na situação anterior, qual $V_o$ após $3\,\text{s}$, em V, com uma casa decimal?`, -6, t`$V_o=0-2\cdot3=-6\,\text{V}$, dentro dos trilhos.`),
        gen(rng => { const x = randInt(rng, 1, 4); return num(t`Um integrador tem $RC=1\,\text{s}$, entrada constante de $${x}\,\text{V}$ e saída inicial zero. Qual a saída após $2\,\text{s}$, em V, com uma casa decimal?`, -2*x, t`$V_o=0-${x}\cdot2=-${2*x}\,\text{V}$; não há saturação.`, { unit: 'V', tol: 0.05 }); }),
        tf(t`Uma rampa calculada até $-20\,\text{V}$ continua linear com trilhos $\pm15\,\text{V}$.`, false, t`A saída chega ao trilho de $-15\,\text{V}$ antes; o modelo linear deixa de valer.`),
        labExercise(),
      ] },
      { card: { title: 'Diferenciador inversor', body: t`Com capacitor na entrada e resistor na realimentação, o modelo ideal linear dá $V_o=-RC\,dV_i/dt$. Uma rampa de entrada gera saída constante; sinais rápidos e ruído são muito amplificados, exigindo limitação prática de banda. O gráfico representa uma entrada em rampa.`, visual: lab() }, exercises: [
        q('Qual grandeza da entrada determina a saída do diferenciador ideal?', 'Sua taxa de variação', 'Seu valor inicial isoladamente', 'Sua integral acumulada', 'A resistência da carga apenas', t`A fórmula é $V_o=-RC\,dV_i/dt$.`),
        tf('Uma entrada constante gera saída zero no diferenciador ideal linear.', true, 'A derivada de uma constante é zero.'),
        n(t`Para $RC=2\,\text{s}$ e rampa de inclinação $3\,\text{V/s}$, calcule a saída em V, com uma casa decimal.`, -6, t`$V_o=-2\cdot3=-6\,\text{V}$.`),
        n(t`Para $RC=1\,\text{s}$ e rampa de inclinação $-4\,\text{V/s}$, calcule a saída em V, com uma casa decimal.`, 4, t`$V_o=-1\cdot(-4)=4\,\text{V}$.`),
        gen(rng => { const x = randInt(rng, 1, 4); return num(t`Um diferenciador com $RC=2\,\text{s}$ recebe rampa de inclinação $${x}\,\text{V/s}$. Qual a saída em V, com uma casa decimal?`, -2*x, t`$V_o=-2\cdot${x}=-${2*x}\,\text{V}$, dentro dos trilhos.`, { unit: 'V', tol: 0.05 }); }),
        tf('O diferenciador ideal amplifica mais as variações rápidas que as lentas.', true, t`Quanto maior o módulo de $dV_i/dt$, maior o módulo da saída, até os limites reais.`),
        labExercise(),
      ] },
    ] },
  ],
};

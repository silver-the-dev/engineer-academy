import React from 'react';
import type { UnitDef } from '../../types';
import { gen, inter, match, mcq, num, plot, tf } from '../../helpers';
import { FnCurve } from '../../../components/plot/Plot';
import { C } from '../../../theme';
import { fmt, randInt } from '../../../lib/random';

const t = String.raw;

// O controle representa a razão N2/N1; as ondas são tensões normalizadas ideais.
const lab = () => plot({
  view: { xMin: 0, xMax: 6.3, yMin: -3.2, yMax: 3.2 },
  params: [{ key: 'r', label: 'N₂/N₁', min: 0.5, max: 3, step: 0.5, value: 1, color: C.p2 }],
  render: ({ p }: any) => <><FnCurve f={(x: number) => Math.sin(x)} color={C.p5} /><FnCurve f={(x: number) => p.r * Math.sin(x)} color={C.p2} /></>,
  info: ({ p }: any) => t`Primário: amplitude $1$ (roxo). Secundário: amplitude $${fmt(p.r)}$ (azul). A frequência é igual.`,
});
const ajuste = (target: number, prompt: string) => inter(prompt, 'plot', lab().props, (v) => Math.abs(v.p.r - target) < 0.01, t`Ajuste a razão para $${fmt(target)}$.`, t`No modelo ideal, a razão das amplitudes é $N_2/N_1=${fmt(target)}$.`);

export const transformadores: UnitDef = {
  id: 'el-trafo', title: 'Transformadores', icon: '🔁',
  subtitle: 'Indução, espiras, perdas e aplicações',
  source: 'Eletrônica I · Aula 6 — Transformador; Aula Transformadores (slides em imagem)',
  guide: t`Um fluxo magnético variável acopla os enrolamentos. No modelo ideal, com tensões e correntes eficazes: $\frac{V_1}{V_2}=\frac{N_1}{N_2}=\frac{I_2}{I_1}$. A frequência não muda. Potências aparentes ideais são iguais; para potência ativa, $\eta=P_{\text{saída}}/P_{\text{entrada}}$ e $P_{\text{perdas}}=P_{\text{entrada}}-P_{\text{saída}}$.`,
  lessons: [
    { id: 'el-trafo-princ', title: 'Princípio de funcionamento', parts: [
      { card: { title: 'Indução mútua', body: t`Uma tensão alternada no primário produz fluxo magnético variável no núcleo. Esse fluxo atravessa o secundário e induz tensão nele: é a **indução mútua**. O núcleo facilita o acoplamento; os enrolamentos de um transformador isolador são eletricamente separados.`, visual: lab(), tip: 'Mova a razão de espiras e observe as duas ondas idealizadas; a frequência permanece igual.' }, exercises: [
        mcq('Qual fenômeno produz tensão no secundário?', ['Indução eletromagnética', 'Atrito entre fios', 'Reação química', 'Luz emitida pelo núcleo'], 0, 'O fluxo magnético variável induz tensão nas espiras do secundário.'),
        tf('O núcleo magnético ajuda a acoplar os enrolamentos.', true, 'O núcleo oferece um caminho para o fluxo que atravessa os dois enrolamentos.'),
        match('Associe cada elemento à sua função.', [['Primário', 'Recebe energia da fonte'], ['Secundário', 'Fornece energia à carga'], ['Núcleo', 'Conduz o fluxo magnético']], 'O primário recebe energia, o núcleo acopla o fluxo e o secundário alimenta a carga.'),
        tf('Em um transformador isolador ideal, os enrolamentos precisam estar ligados por um fio.', false, 'O acoplamento é magnético; os enrolamentos são eletricamente separados.'),
        ajuste(2, 'No gráfico ideal, ajuste a razão para que a amplitude secundária seja o dobro da primária.'),
        num(t`Um fluxo varia de $0$ a $0{,}02\,\text{Wb}$ em $0{,}1\,\text{s}$ linearmente. Qual é o módulo da variação média em Wb/s, com uma casa decimal?`, 0.2, t`$|\Delta\Phi/\Delta t|=0{,}02/0{,}1=0{,}2\,\text{Wb/s}$.`, { unit: 'Wb/s', tol: 0.05 }),
        gen((rng) => { const n = randInt(rng, 2, 9) * 10; return num(t`Com $${n}$ espiras e fluxo variando linearmente a $0{,}1\,\text{Wb/s}$, qual o módulo da tensão induzida média em V, sem casas decimais?`, n / 10, t`Pela lei de Faraday, $|e|=N|\Delta\Phi/\Delta t|=${n}\cdot0{,}1=${n / 10}\,\text{V}$.`, { unit: 'V', tol: 0.5 }); }),
      ] },
      { card: { title: 'Fluxo variável e frequência', body: t`Pela lei de Faraday, $e=-N\frac{d\Phi}{dt}$. O sinal expressa a oposição à variação do fluxo (lei de Lenz). Em regime permanente, uma tensão contínua constante não mantém fluxo variável; ligá-la a um transformador de CA pode causar corrente excessiva e aquecimento.`, tip: 'A tensão induzida pode existir durante o transitório de ligação; isso não é operação contínua normal.' }, exercises: [
        tf('Fluxo constante induz tensão permanente em uma bobina estacionária.', false, t`Se $d\Phi/dt=0$, a tensão induzida é zero.`),
        mcq('O sinal negativo na lei de Faraday expressa:', ['A lei de Lenz', 'Uma perda obrigatória de tensão', 'Uma frequência negativa', 'A ausência de núcleo'], 0, 'A tensão induzida se opõe à variação de fluxo que a produz.'),
        tf('Um transformador ideal muda a frequência de uma senoide de 60 Hz para 120 Hz.', false, 'A frequência da tensão secundária é a mesma da primária: 60 Hz.'),
        num(t`A entrada é senoidal de $60\,\text{Hz}$. Qual a frequência secundária ideal em Hz, sem casas decimais?`, 60, t`O transformador não altera a frequência: $60\,\text{Hz}$.`, { unit: 'Hz', tol: 0.5 }),
        mcq('Por que não se deve ligar diretamente uma fonte CC constante a um transformador projetado para CA?', ['Pode haver corrente excessiva e aquecimento', 'A frequência dobra', 'O secundário fornece CA indefinidamente', 'O núcleo impede toda corrente'], 0, 'Após o transitório, falta a variação normal de fluxo e a corrente pode ficar limitada principalmente pela resistência do enrolamento.'),
        gen((rng) => { const n = randInt(rng, 2, 8) * 100; return num(t`Uma bobina de $${n}$ espiras sofre variação linear de fluxo de $0{,}01\,\text{Wb}$ em $0{,}1\,\text{s}$. Calcule o módulo da tensão média em V, sem casas decimais.`, n / 10, t`$|e|=${n}\cdot(0{,}01/0{,}1)=${n / 10}\,\text{V}$.`, { unit: 'V', tol: 0.5 }); }),
        num(t`Em $200$ espiras, o fluxo varia linearmente $0{,}03\,\text{Wb}$ em $0{,}2\,\text{s}$. Qual o módulo da tensão média em V, sem casas decimais?`, 30, t`$|e|=200\cdot0{,}03/0{,}2=30\,\text{V}$.`, { unit: 'V', tol: 0.5 }),
      ] },
    ] },
    { id: 'el-trafo-rel', title: 'Relação de espiras', parts: [
      { card: { title: 'Tensão e espiras', body: t`No transformador ideal, as tensões eficazes obedecem a $V_2/V_1=N_2/N_1$. Mais espiras no secundário elevam a tensão; menos espiras a reduzem. A relação também vale para amplitudes de senoides, se a mesma convenção for usada nos dois lados.`, visual: lab() }, exercises: [
        mcq('Se o secundário tem menos espiras que o primário, o transformador ideal é:', ['Abaixador', 'Elevador', 'Retificador', 'Gerador de frequência'], 0, 'Como N₂/N₁ é menor que 1, a tensão secundária é menor.'),
        tf('Dobrar N₂ mantendo N₁ e V₁ fixos dobra V₂ no modelo ideal.', true, t`$V_2=V_1N_2/N_1$, portanto a tensão dobra.`),
        ajuste(0.5, 'Ajuste o gráfico para obter uma amplitude secundária igual à metade da primária.'),
        num(t`Um transformador ideal tem $N_1=400$, $N_2=100$ e $V_1=120\,\text{V}$ eficazes. Qual $V_2$ eficaz em V, sem casas decimais?`, 30, t`$V_2=120\cdot100/400=30\,\text{V}$.`, { unit: 'V', tol: 0.5 }),
        gen((rng) => { const k = randInt(rng, 2, 6); return num(t`Um transformador ideal tem $N_1=100$ e $N_2=${k * 100}$. Com $V_1=10\,\text{V}$ eficazes, calcule $V_2$ em V, sem casas decimais.`, k * 10, t`$V_2=10\cdot${k * 100}/100=${k * 10}\,\text{V}$.`, { unit: 'V', tol: 0.5 }); }),
        num(t`Um ideal recebe $220\,\text{V}$ eficazes em $1100$ espiras. Quantas espiras são necessárias no secundário para $22\,\text{V}$ eficazes?`, 110, t`$N_2=1100\cdot22/220=110$ espiras.`, { unit: 'espiras', tol: 0.5 }),
        num(t`Num ideal, $V_1=24\,\text{V}$ e $V_2=120\,\text{V}$ eficazes. Se $N_2=1000$, quantas espiras tem o primário?`, 200, t`$N_1=1000\cdot24/120=200$ espiras.`, { unit: 'espiras', tol: 0.5 }),
      ] },
      { card: { title: 'Correntes e carga', body: t`Em um transformador ideal alimentando carga, as correntes eficazes têm razão inversa à das espiras: $I_2/I_1=N_1/N_2$. Assim, elevar tensão reduz corrente na mesma proporção para a mesma potência aparente. O modelo desconsidera corrente de magnetização e perdas.`, tip: 'As correntes na relação são módulos eficazes; polaridades e fases exigem convenção de pontos.' }, exercises: [
        tf('Num ideal sob carga, ao elevar a tensão a corrente também sobe na mesma razão.', false, 'A corrente cai na razão inversa; a potência aparente se conserva.'),
        mcq('Num ideal com N₁/N₂ = 4, a razão I₂/I₁ é:', ['$4$', '$1/4$', '$16$', '$1$'], 0, t`A relação inversa de corrente dá $I_2/I_1=N_1/N_2=4$.`),
        num(t`Um ideal tem $N_1/N_2=5$ e $I_1=2\,\text{A}$. Ache $I_2$ eficaz em A, sem casas decimais.`, 10, t`$I_2=5I_1=10\,\text{A}$.`, { unit: 'A', tol: 0.5 }),
        gen((rng) => { const k = randInt(rng, 2, 6); return num(t`Num ideal, $N_1/N_2=${k}$ e $I_2=${k * 2}\,\text{A}$. Ache $I_1$ eficaz em A, sem casas decimais.`, 2, t`$I_1=I_2/(N_1/N_2)=${k * 2}/${k}=2\,\text{A}$.`, { unit: 'A', tol: 0.5 }); }),
        tf('A relação ideal de corrente inclui exatamente as perdas reais e a corrente de magnetização.', false, 'O modelo ideal despreza ambas; num dispositivo real a relação é aproximada.'),
        num(t`Um ideal fornece $12\,\text{V}$ e $4\,\text{A}$ eficazes. Com $V_1=120\,\text{V}$, qual $I_1$ eficaz em A, com uma casa decimal?`, 0.4, t`$V_1I_1=V_2I_2$: $I_1=12\cdot4/120=0{,}4\,\text{A}$.`, { unit: 'A', tol: 0.05 }),
        mcq('Se a carga for desligada, como interpretar a corrente de um transformador real energizado?', ['Pode existir corrente de magnetização', 'Ela é sempre igual à corrente nominal', 'A frequência se torna zero', 'A tensão secundária necessariamente zera'], 0, 'Mesmo sem carga, o núcleo requer corrente de excitação e há perdas no núcleo.'),
      ] },
    ] },
    { id: 'el-trafo-pot', title: 'Potência, perdas e rendimento', parts: [
      { card: { title: 'Potência e rendimento', body: t`Para grandezas eficazes senoidais, $S=VI$ em VA e $P=VI\cos\varphi$ em W. No ideal, $S_1=S_2$ e $P_1=P_2$. Num transformador real, $\eta=P_2/P_1$ e $P_{\text{perdas}}=P_1-P_2$, usando potências ativas.`, visual: lab() }, exercises: [
        mcq('Qual unidade mede potência aparente?', ['VA', 'Wb', 'Hz', 'Ω'], 0, 'Potência aparente é o produto das grandezas eficazes V e I, em VA.'),
        tf('A potência ativa é sempre igual a VI para qualquer fator de potência.', false, t`Em regime senoidal, $P=VI\cos\varphi$; só são iguais quando o fator de potência é 1.`),
        ajuste(3, 'No modelo ideal, ajuste a razão para triplicar a amplitude da tensão secundária.'),
        num(t`A saída fornece $20\,\text{V}$ e $3\,\text{A}$ eficazes. Calcule a potência aparente em VA, sem casas decimais.`, 60, t`$S=VI=20\cdot3=60\,\text{VA}$.`, { unit: 'VA', tol: 0.5 }),
        gen((rng) => { const p = randInt(rng, 2, 9) * 100; return num(t`A entrada ativa é $${p}\,\text{W}$ e a saída ativa é $${p * 0.9}\,\text{W}$. Qual o rendimento em %, sem casas decimais?`, 90, t`$\eta=100\cdot${p * 0.9}/${p}=90\%$.`, { unit: '%', tol: 0.5 }); }),
        num(t`Um transformador recebe $500\,\text{W}$ e entrega $460\,\text{W}$ de potência ativa. Qual a perda em W, sem casas decimais?`, 40, t`$P_{\text{perdas}}=500-460=40\,\text{W}$.`, { unit: 'W', tol: 0.5 }),
        num(t`Uma carga recebe $100\,\text{V}$ e $2\,\text{A}$ eficazes, com fator de potência $0{,}8$. Calcule a potência ativa em W, sem casas decimais.`, 160, t`$P=100\cdot2\cdot0{,}8=160\,\text{W}$.`, { unit: 'W', tol: 0.5 }),
      ] },
      { card: { title: 'De onde vêm as perdas?', body: t`Nos enrolamentos, a resistência dissipa potência por efeito Joule, aproximadamente $I^2R$. No núcleo, histerese e correntes parasitas também geram calor. Chapas isoladas reduzem correntes parasitas; materiais adequados reduzem perdas por histerese.`, tip: 'A potência nominal em VA limita o aquecimento associado às tensões e correntes previstas.' }, exercises: [
        mcq('Qual perda ocorre na resistência dos enrolamentos?', ['Efeito Joule', 'Refração', 'Radiação visível obrigatória', 'Eletrólise'], 0, t`A resistência dos fios dissipa aproximadamente $I^2R$ em calor.`),
        tf('Lâminas isoladas no núcleo ajudam a reduzir correntes parasitas.', true, 'O isolamento entre lâminas dificulta os caminhos das correntes parasitas.'),
        match('Associe a perda à sua origem.', [['Cobre', 'Resistência dos enrolamentos'], ['Histerese', 'Ciclos de magnetização'], ['Correntes parasitas', 'Correntes induzidas no núcleo']], 'As perdas no cobre dependem da corrente; as demais citadas ocorrem no núcleo.'),
        num(t`Um enrolamento tem resistência de $2\,\Omega$ e corrente eficaz de $3\,\text{A}$. Ache a perda Joule em W, sem casas decimais.`, 18, t`$P=I^2R=3^2\cdot2=18\,\text{W}$.`, { unit: 'W', tol: 0.5 }),
        gen((rng) => { const i = randInt(rng, 2, 6); return num(t`Um enrolamento de $1\,\Omega$ conduz $${i}\,\text{A}$ eficazes. Qual a perda Joule em W, sem casas decimais?`, i * i, t`$P=I^2R=${i}^2\cdot1=${i * i}\,\text{W}$.`, { unit: 'W', tol: 0.5 }); }),
        tf('Se a corrente eficaz dobra, a perda Joule no mesmo enrolamento quadruplica.', true, t`Como $P=I^2R$, dobrar $I$ multiplica a perda por $2^2=4$.`),
        num(t`Um transformador entrega $900\,\text{W}$ com rendimento de $90\%$. Qual a potência ativa de entrada em W, sem casas decimais?`, 1000, t`$P_1=P_2/\eta=900/0{,}9=1000\,\text{W}$.`, { unit: 'W', tol: 0.5 }),
      ] },
    ] },
    { id: 'el-trafo-apl', title: 'Aplicações', parts: [
      { card: { title: 'Fontes e derivação central', body: t`Uma fonte pode usar transformador abaixador para obter uma CA menor, seguida de retificação e filtragem. Um secundário com derivação central simétrica fornece, entre a derivação e cada ponta, metade da tensão eficaz entre as pontas. Essas tensões são medidas em relação à derivação.`, visual: lab(), tip: 'O transformador sozinho não retifica: sua saída continua alternada.' }, exercises: [
        mcq('Em uma fonte convencional, o transformador abaixador atua principalmente para:', ['Reduzir a tensão alternada', 'Retificar a tensão', 'Armazenar carga como capacitor', 'Dobrar a frequência'], 0, 'A relação de espiras reduz a tensão CA; a retificação é tarefa dos diodos.'),
        tf('A saída de um transformador alimentado por senoide é contínua sem retificador.', false, 'A saída continua alternada; diodos são usados para retificação.'),
        ajuste(0.5, 'Ajuste o modelo para representar um abaixador de tensão pela metade.'),
        num(t`Um secundário simétrico tem $24\,\text{V}$ eficazes entre pontas. Qual a tensão eficaz entre a derivação central e uma ponta, em V, sem casas decimais?`, 12, t`Metade do enrolamento fornece $24/2=12\,\text{V}$.`, { unit: 'V', tol: 0.5 }),
        gen((rng) => { const v = randInt(rng, 2, 9) * 2; return num(t`Um secundário simétrico fornece $${v}\,\text{V}$ eficazes de ponta a ponta. Quanto há de cada ponta à derivação central, em V, sem casas decimais?`, v / 2, t`As metades têm o mesmo número de espiras: $${v}/2=${v / 2}\,\text{V}$.`, { unit: 'V', tol: 0.5 }); }),
        mcq('Em uma fonte com transformador, retificador e filtro, qual é a sequência típica da rede até a carga?', ['Transformar, retificar, filtrar', 'Filtrar, gerar rede, transformar', 'Retificar, aumentar frequência, gerar rede', 'Transformar, inverter fluxo, gerar rede'], 0, 'O transformador ajusta a CA, o retificador produz sinal pulsante e o filtro suaviza a saída.'),
        num(t`Um ideal recebe $120\,\text{V}$ eficazes em $1000$ espiras. Para obter $12\,\text{V}$ eficazes entre as pontas, quantas espiras totais deve ter o secundário?`, 100, t`$N_2=1000\cdot12/120=100$ espiras no total.`, { unit: 'espiras', tol: 0.5 }),
      ] },
      { card: { title: 'Transmissão e isolamento', body: t`Para transmitir uma potência ativa fixa com fator de potência e resistência de linha constantes, elevar a tensão reduz a corrente e, portanto, a perda $I^2R$ na linha. Perto dos consumidores a tensão é reduzida. Um transformador isolador separa galvanicamente os enrolamentos, mas sua saída ainda pode causar choque.`, tip: 'Não confunda isolamento galvânico com ausência de tensão perigosa.' }, exercises: [
        mcq('Por que elevar a tensão na transmissão?', ['Reduzir a corrente para a mesma potência', 'Aumentar a resistência da linha', 'Eliminar toda perda', 'Converter CA diretamente em CC'], 0, 'Para a mesma potência e fator de potência, maior tensão permite menor corrente e menor perda resistiva.'),
        tf('Um transformador isolador garante que sua saída não possa causar choque.', false, 'A separação galvânica não elimina a tensão entre os terminais secundários.'),
        num(t`Uma linha de resistência total $2\,\Omega$ conduz $10\,\text{A}$ eficazes. Qual a perda resistiva em W, sem casas decimais?`, 200, t`$P_{\text{linha}}=I^2R=10^2\cdot2=200\,\text{W}$.`, { unit: 'W', tol: 0.5 }),
        gen((rng) => { const i = randInt(rng, 2, 9); return num(t`Uma linha de resistência total $2\,\Omega$ conduz $${i}\,\text{A}$ eficazes. Calcule sua perda resistiva em W, sem casas decimais.`, 2 * i * i, t`$P=I^2R=${i}^2\cdot2=${2 * i * i}\,\text{W}$.`, { unit: 'W', tol: 0.5 }); }),
        mcq('Para potência e fator de potência constantes, ao dobrar a tensão de transmissão a corrente idealmente:', ['Cai à metade', 'Dobra', 'Quadruplica', 'Não muda'], 0, t`De $P=VI\cos\varphi$, dobrar $V$ com os demais fatores fixos reduz $I$ à metade.`),
        num(t`A corrente de uma mesma linha cai de $20\,\text{A}$ para $10\,\text{A}$. A perda final é quantos por cento da inicial? Responda em %, sem casas decimais.`, 25, t`A razão das perdas é $(10/20)^2=1/4=25\%$.`, { unit: '%', tol: 0.5 }),
        num(t`Uma carga resistiva recebe $2\,\text{kW}$ a $200\,\text{V}$ eficazes. Desprezando perdas e usando modelo monofásico, qual a corrente em A, sem casas decimais?`, 10, t`Com fator de potência 1, $I=P/V=2000/200=10\,\text{A}$.`, { unit: 'A', tol: 0.5 }),
      ] },
    ] },
  ],
};

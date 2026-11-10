import React from 'react';
import type { UnitDef } from '../../types';
import { gen, inter, match, mcq, num, plot, tf } from '../../helpers';
import { Pt, Seg } from '../../../components/plot/Plot';
import { C } from '../../../theme';
import { fmt, randInt } from '../../../lib/random';

const t = String.raw;

// Modelos didáticos: degraus ideais e sinais digitais normalizados.
const codeLab = () => plot({
  view: { xMin: -0.5, xMax: 16, yMin: -0.4, yMax: 4.5 },
  params: [{ key: 'd', label: 'código', min: 0, max: 15, step: 1, value: 3, color: C.p2 }],
  render: ({ p }: any) => <><Seg x1={p.d} y1={0} x2={p.d} y2={p.d / 4} color={C.p2} /><Pt x={p.d} y={p.d / 4} color={C.gold} /></>,
  info: ({ p }: any) => t`Código $${p.d}$ · saída ideal $${fmt(p.d / 4, 2)}\,\text{V}$`,
});
const adcLab = () => plot({
  view: { xMin: -0.2, xMax: 4.2, yMin: -0.5, yMax: 16 },
  params: [{ key: 'v', label: 'entrada (V)', min: 0, max: 3.75, step: 0.25, value: 0.5, color: C.p2 }],
  render: ({ p }: any) => <><Seg x1={p.v} y1={0} x2={p.v} y2={Math.floor(p.v * 4)} color={C.p2} /><Pt x={p.v} y={Math.floor(p.v * 4)} color={C.gold} /></>,
  info: ({ p }: any) => t`Entrada $${fmt(p.v, 2)}\,\text{V}$ · código $${Math.floor(p.v * 4)}$`,
});
const thresholdLab = () => plot({
  view: { xMin: -0.2, xMax: 5.2, yMin: -0.3, yMax: 1.5 },
  params: [{ key: 'v', label: 'entrada (V)', min: 0, max: 5, step: 0.1, value: 1, color: C.p2 }],
  render: ({ p }: any) => <><Seg x1={0.8} y1={0} x2={2} y2={0} color={C.danger} width={5} /><Pt x={p.v} y={0.5} color={C.gold} /></>,
  info: ({ p }: any) => p.v <= 0.8 ? 'Entrada garantida como baixa' : p.v >= 2 ? 'Entrada garantida como alta' : 'Região sem nível lógico garantido',
});
const pulseLab = () => plot({
  view: { xMin: 0, xMax: 10, yMin: -0.3, yMax: 1.5 },
  params: [{ key: 'd', label: 'alto (%)', min: 0, max: 100, step: 10, value: 20, color: C.p2 }],
  render: ({ p }: any) => <><Seg x1={0} y1={1} x2={p.d / 10} y2={1} color={C.p2} width={3} /><Seg x1={p.d / 10} y1={0} x2={10} y2={0} color={C.gold} width={3} /></>,
  info: ({ p }: any) => t`Fração em nível alto: $${p.d}\%$`,
});
const serialLab = () => plot({
  view: { xMin: 0, xMax: 10, yMin: -0.3, yMax: 1.5 },
  params: [{ key: 'b', label: 'kbit/s', min: 1, max: 10, step: 1, value: 2, color: C.p2 }],
  render: ({ p }: any) => <><Seg x1={0} y1={1} x2={10 / p.b} y2={1} color={C.p2} width={3} /><Seg x1={10 / p.b} y1={0} x2={10} y2={0} color={C.gold} width={3} /></>,
  info: ({ p }: any) => t`Um bit dura $${fmt(1 / p.b, 3)}\,\text{ms}$`,
});

export const conversores: UnitDef = {
  id: 'dg-conv', title: 'Conversores e microcontroladores', icon: '🖥️',
  subtitle: 'Do sinal analógico aos sistemas embarcados',
  source: 'Conteúdo complementar · Tocci, Widmer e Moss: Sistemas Digitais; Malvino e Brown: Eletrônica Digital',
  guide: t`Para um conversor ideal unipolar de $N$ bits e referência $V_{ref}$, use $q=V_{ref}/2^N$. Um DAC com código $D$ produz $V_{out}=Dq$; um ADC por truncamento fornece $D=\lfloor V_{in}/q\rfloor$, limitado aos códigos disponíveis. A frequência de amostragem deve superar o dobro da maior frequência do sinal limitado em banda. Em PWM, $D=t_{alto}/T$ e a média ideal é $DV_{alto}$. Consulte o datasheet para níveis, correntes, temporizações e pinagem.`,
  extra: true,
  lessons: [
    { id: 'dg-conv-dac', title: 'Conversor D/A', parts: [
      { card: { title: 'Código vira tensão', body: t`Um DAC transforma um código digital em uma grandeza analógica. Neste modelo ideal unipolar, $N$ bits dão $2^N$ códigos, de $0$ a $2^N-1$. Com referência de $4\,\text{V}$ e 4 bits, o degrau é $q=4/16=0,25\,\text{V}$ e $V_{out}=Dq$. Mova o código.`, visual: codeLab() }, exercises: [
        mcq('Qual é a função de um DAC?', ['Converter código digital em saída analógica', 'Medir apenas frequência', 'Converter tensão em código', 'Armazenar instruções'], 0, 'O DAC recebe código e produz uma saída analógica.'),
        tf('Um DAC de 4 bits possui 16 códigos distintos.', true, t`$2^4=16$ códigos, de 0 a 15.`),
        num('Quantos códigos existem em 3 bits? Responda em códigos inteiros.', 8, t`$2^3=8$ códigos.`, { unit: 'códigos', tol: 0.01 }),
        gen(rng => { const n = randInt(rng, 2, 6); return num(t`Quantos códigos possui um DAC de $${n}$ bits? Responda em códigos inteiros.`, 2 ** n, t`$2^{${n}}=${2 ** n}$ códigos.`, { unit: 'códigos', tol: 0.01 }); }),
        num(t`Para $q=0,25\,\text{V}$ e código 6, qual a saída ideal em V, com duas casas decimais?`, 1.5, t`$V_{out}=6\cdot0,25=1,50\,\text{V}$.`, { unit: 'V', tol: 0.005 }),
        inter('No gráfico, ajuste o código para produzir 2 V.', 'plot', codeLab().props, v => v.p.d === 8, 'Código 8', t`$D=2/0,25=8$.`),
        mcq(t`Nesse DAC de 4 bits e $4\,\text{V}$ de referência, qual é a maior saída?`, [t`$3,75\,\text{V}$`, t`$4\,\text{V}$`, t`$15\,\text{V}$`, t`$0,25\,\text{V}$`], 0, t`O maior código é 15: $15\cdot0,25=3,75\,\text{V}$.`),
      ] },
      { card: { title: 'Resolução e implementação', body: t`O degrau ideal $q=V_{ref}/2^N$ diminui pela metade ao acrescentar um bit, mantendo a referência. Uma rede R–2R usa resistores de dois valores para ponderar bits; erros de componentes e referência limitam a precisão real. Resolução e precisão não são sinônimos.` }, exercises: [
        tf('Mais bits, com referência fixa, reduzem o degrau ideal.', true, t`Cada bit dobra $2^N$ e reduz $q$ à metade.`),
        mcq('Uma rede R–2R usa quais valores nominais de resistência?', ['R e 2R', 'R e 4R apenas', 'Somente 1 Ω', 'Nenhum resistor'], 0, 'A rede usa resistores de valores R e 2R.'),
        match('Associe os conceitos.', [['Resolução', 'Tamanho do menor degrau'], ['Precisão', 'Proximidade do valor real ao ideal'], ['Referência', 'Define a escala de tensão']], 'O degrau descreve resolução; desvios reais afetam a precisão; a referência define a escala.'),
        num(t`Um DAC ideal de 8 bits tem referência de $2,56\,\text{V}$. Qual o degrau em mV, com uma casa decimal?`, 10, t`$2,56/256=0,01\,\text{V}=10,0\,\text{mV}$.`, { unit: 'mV', tol: 0.05 }),
        gen(rng => { const n = randInt(rng, 3, 6); const ref = 2 ** n; return num(t`Um DAC ideal de $${n}$ bits tem referência de $${ref}\,\text{V}$. Qual o degrau em V, com duas casas decimais?`, 1, t`$q=${ref}/${2 ** n}=1,00\,\text{V}$.`, { unit: 'V', tol: 0.005 }); }),
        tf('Um degrau pequeno garante ausência de erro de referência.', false, 'A resolução não elimina erros de referência ou dos componentes.'),
        mcq(t`Se a referência dobrar e os bits não mudarem, o degrau ideal…`, ['dobra', 'cai à metade', 'não muda', 'cai a zero'], 0, t`Como $q=V_{ref}/2^N$, dobrar a referência dobra $q$.`),
      ] },
    ] },
    { id: 'dg-conv-adc', title: 'Conversor A/D', parts: [
      { card: { title: 'Amostras e códigos', body: t`Um ADC mede uma tensão em instantes discretos e a quantiza em códigos. No modelo ideal por truncamento de 4 bits e referência de $4\,\text{V}$, $q=0,25\,\text{V}$ e $D=\lfloor V_{in}/q\rfloor$, limitado a 15. Cada código representa uma faixa, não uma medida exata.`, visual: adcLab() }, exercises: [
        mcq('O que um ADC produz a partir de uma tensão?', ['Um código digital', 'Uma resistência fixa', 'Uma corrente alternada necessariamente', 'Um campo magnético'], 0, 'O ADC associa um código digital à tensão amostrada.'),
        tf('Quantização associa uma faixa de tensões a um código.', true, 'Um número finito de códigos representa faixas de entrada.'),
        num(t`No modelo do card, qual o código de $1\,\text{V}$? Responda em códigos inteiros.`, 4, t`$\lfloor1/0,25\rfloor=4$.`, { unit: 'código', tol: 0.01 }),
        gen(rng => { const d = randInt(rng, 1, 14); return num(t`No ADC do card, a entrada é $${fmt(d / 4, 2)}\,\text{V}$. Qual o código inteiro?`, d, t`$\lfloor ${fmt(d / 4, 2)}/0,25\rfloor=${d}$.`, { unit: 'código', tol: 0.01 }); }),
        inter(t`Ajuste a entrada para obter o código 10.`, 'plot', adcLab().props, v => Math.floor(v.p.v * 4) === 10, t`$2,50\,\text{V}$`, t`$\lfloor 2,50/0,25\rfloor=10$.`),
        mcq(t`Qual faixa gera código 3 nesse modelo?`, [t`$0,75\le V_{in}<1,00\,\text{V}$`, t`$0,50\le V_{in}<0,75\,\text{V}$`, t`$1,00\le V_{in}<1,25\,\text{V}$`, t`$3\le V_{in}<4\,\text{V}$`], 0, t`Código 3 corresponde a $3q\le V_{in}<4q$, isto é, de $0,75$ até menos de $1,00\,\text{V}$.`),
        tf('Aumentar bits elimina todos os erros de um ADC real.', false, 'Offset, ganho, ruído e referência ainda podem causar erros.'),
      ] },
      { card: { title: 'Amostragem e aliasing', body: t`A taxa $f_s$ é o número de amostras por segundo; $T_s=1/f_s$. Para reconstruir idealmente um sinal limitado em banda, escolha $f_s>2f_{max}$ e use filtro antialias antes do ADC. Sinais acima da banda podem aparecer como frequências falsas.`, tip: 'A condição exige sinal limitado em banda; só aumentar bits não evita aliasing.' }, exercises: [
        mcq('A taxa de amostragem é medida em…', ['amostras por segundo', 'volts por bit', 'ohms por segundo', 'bits por código'], 0, 'Ela conta amostras a cada segundo, em Hz ou amostras/s.'),
        tf('Mais bits, sozinhos, impedem aliasing.', false, 'Aliasing depende da amostragem temporal e da banda do sinal, não apenas dos bits.'),
        num(t`Para $f_s=1000\,\text{Hz}$, qual o intervalo entre amostras em ms, com duas casas decimais?`, 1, t`$T_s=1/1000\,\text{s}=1,00\,\text{ms}$.`, { unit: 'ms', tol: 0.005 }),
        gen(rng => { const k = randInt(rng, 2, 9); return num(t`Um sinal limitado a $${k}\,\text{kHz}$ precisa de taxa acima de quantos kHz pelo critério de Nyquist? Responda com uma casa decimal.`, 2 * k, t`A taxa deve superar $2\cdot${k}=${2 * k},0\,\text{kHz}$.`, { unit: 'kHz', tol: 0.05 }); }),
        match('Associe cada conceito.', [['Filtro antialias', 'Atenua frequências acima da banda útil'], ['Taxa de amostragem', 'Amostras por segundo'], ['Quantização', 'Mapeamento em códigos finitos']], 'O filtro limita a banda; a taxa define instantes; a quantização define códigos.'),
        mcq(t`Para sinal limitado a $3\,\text{kHz}$, qual taxa satisfaz estritamente o critério ideal?`, [t`$8\,\text{kHz}$`, t`$6\,\text{kHz}$`, t`$3\,\text{kHz}$`, t`$2\,\text{kHz}$`], 0, t`É preciso $f_s>6\,\text{kHz}$; só $8\,\text{kHz}$ satisfaz.`),
        tf('Uma frequência acima da banda de Nyquist pode aparecer como outra frequência nas amostras.', true, 'A amostragem pode tornar frequências distintas indistinguíveis: é o aliasing.'),
      ] },
    ] },
    { id: 'dg-conv-fam', title: 'Famílias lógicas TTL e CMOS', parts: [
      { card: { title: 'Níveis e margens', body: t`TTL e CMOS são famílias de circuitos lógicos. Para um exemplo de entrada TTL a $5\,\text{V}$, suponha baixo garantido até $0,8\,\text{V}$ e alto garantido a partir de $2,0\,\text{V}$. Entre eles, o nível não é garantido. Arraste a tensão. Esses valores são exemplos, não regras para toda família.`, visual: thresholdLab() }, exercises: [
        mcq('Qual região é segura para interpretar uma entrada como nível baixo no exemplo?', [t`$0$ a $0,8\,\text{V}$`, t`$1,0$ a $1,5\,\text{V}$`, t`$2,0$ a $5,0\,\text{V}$`, t`Somente $5,0\,\text{V}$`], 0, t`O enunciado garante baixo até $0,8\,\text{V}$.`),
        tf(t`No exemplo, $1,5\,\text{V}$ tem nível lógico garantido.`, false, t`$1,5\,\text{V}$ fica entre $0,8$ e $2,0\,\text{V}$, região não garantida.`),
        inter('Ajuste uma tensão garantida como alta no exemplo.', 'plot', thresholdLab().props, v => v.p.v >= 2, t`$2,0\,\text{V}$ ou mais`, t`A entrada alta é garantida a partir de $2,0\,\text{V}$ nesse exemplo.`),
        num(t`Se $V_{OH(min)}=2,4\,\text{V}$ e $V_{IH(min)}=2,0\,\text{V}$, calcule a margem alta em V, com uma casa decimal.`, 0.4, t`$NM_H=V_{OH(min)}-V_{IH(min)}=2,4-2,0=0,4\,\text{V}$.`, { unit: 'V', tol: 0.05 }),
        gen(rng => { const a = randInt(rng, 1, 4); return num(t`Uma saída garante pelo menos $${a + 2}\,\text{V}$ e a entrada exige pelo menos $${a}\,\text{V}$ para alto. Calcule a margem alta em V, com uma casa decimal.`, 2, t`$NM_H=${a + 2}-${a}=2,0\,\text{V}$.`, { unit: 'V', tol: 0.05 }); }),
        match('Associe o parâmetro ao significado.', [['VIH mínimo', 'Menor tensão de entrada garantida como alta'], ['VIL máximo', 'Maior tensão de entrada garantida como baixa'], ['VOH mínimo', 'Menor tensão de saída garantida como alta']], 'Os limites de entrada e saída são especificações distintas do fabricante.'),
        tf('Uma tensão entre os limiares garantidos deve ser tratada como logicamente indefinida.', true, 'Nessa região o fabricante não garante baixo nem alto.'),
      ] },
      { card: { title: 'Compatibilidade prática', body: t`Compare $V_{OH(min)}$ com $V_{IH(min)}$ e $V_{OL(max)}$ com $V_{IL(max)}$ sob as correntes especificadas. CMOS costuma ter alta impedância de entrada; entradas flutuantes devem receber nível definido. Tensão de alimentação, fan-out, velocidade e consumo dependem da série e do datasheet.` }, exercises: [
        tf('É seguro deixar entradas CMOS sem conexão em qualquer situação.', false, 'Uma entrada flutuante pode assumir nível indefinido e aumentar o consumo; defina seu nível.'),
        mcq('Para verificar compatibilidade lógica, consulte…', ['Limiares e correntes nos datasheets', 'A cor do encapsulamento', 'Somente o número de pinos', 'Somente o preço'], 0, 'A comparação exige limites elétricos, correntes e condições de operação.'),
        match('Associe.', [['Fan-out', 'Capacidade de uma saída acionar entradas'], ['Pull-up', 'Resistor que tende a levar o nó ao nível alto'], ['Atraso de propagação', 'Tempo entre mudança na entrada e resposta na saída']], 'Fan-out trata de carga; pull-up define nível; atraso descreve resposta temporal.'),
        num(t`Uma saída garante no máximo $0,3\,\text{V}$ em baixo e a entrada aceita até $0,8\,\text{V}$. Qual a margem baixa em V, com uma casa decimal?`, 0.5, t`$NM_L=V_{IL(max)}-V_{OL(max)}=0,8-0,3=0,5\,\text{V}$.`, { unit: 'V', tol: 0.05 }),
        gen(rng => { const n = randInt(rng, 2, 8); return num(t`Uma saída suporta $${n}\,\text{mA}$ e cada entrada consome $1\,\text{mA}$ nas mesmas condições. Pelo limite de corrente, quantas entradas inteiras pode acionar?`, n, t`$${n}/1=${n}$ entradas pelo limite dado; outros limites também devem ser verificados.`, { unit: 'entradas', tol: 0.01 }); }),
        mcq('Uma saída de 3,3 V ligada a uma entrada de 5 V é sempre compatível?', ['Não: confira os limites garantidos e as tensões permitidas', 'Sim, para qualquer circuito', 'Sim, se os fios forem curtos', 'Não, porque sinais digitais não usam tensão'], 0, 'A compatibilidade depende dos limiares, alimentação e limites absolutos especificados.'),
        tf('Margens de ruído positivas ajudam a tolerar perturbações sem perder o nível garantido.', true, 'A margem é a diferença entre o limite garantido da saída e o limite exigido pela entrada.'),
      ] },
    ] },
    { id: 'dg-conv-mcu', title: 'Microcontroladores: GPIO, PWM e ADC', parts: [
      { card: { title: 'Entradas e saídas', body: t`Um microcontrolador reúne processador, memória e periféricos. GPIO pode ser configurado como entrada ou saída digital; um botão pode usar pull-up, e um LED precisa de resistor adequado. Uma placa Arduino contém um microcontrolador, mas pinos e limites dependem do modelo. O visual mostra um ciclo PWM.`, visual: pulseLab() }, exercises: [
        mcq('Qual configuração permite ler um botão?', ['GPIO como entrada', 'GPIO como saída fixa', 'DAC obrigatório', 'Memória como saída'], 0, 'Uma entrada GPIO lê o nível lógico presente no pino.'),
        tf('Um microcontrolador integra processador, memória e periféricos.', true, 'Esses blocos permitem executar um programa e interagir com o ambiente.'),
        match('Associe o recurso.', [['GPIO de entrada', 'Lê um nível digital'], ['GPIO de saída', 'Comanda um nível digital'], ['ADC', 'Converte tensão em código']], 'GPIO lê ou comanda níveis digitais; o ADC mede uma faixa de tensões.'),
        num(t`Com $5\,\text{V}$, LED de $2\,\text{V}$ e resistor de $300\,\Omega$, estime a corrente em mA, com uma casa decimal.`, 10, t`$I=(5-2)/300=0,010\,\text{A}=10,0\,\text{mA}$. Confira os limites do pino.`, { unit: 'mA', tol: 0.05 }),
        gen(rng => { const r = randInt(rng, 2, 8) * 100; const i = 3000 / r; return num(t`Com fonte de $5\,\text{V}$, queda do LED de $2\,\text{V}$ e resistor de $${r}\,\Omega$, estime a corrente em mA, com duas casas decimais.`, i, t`$I=(5-2)/${r}\,\text{A}=${fmt(i, 2)}\,\text{mA}$.`, { unit: 'mA', tol: 0.005 }); }),
        tf('Um pino GPIO pode alimentar qualquer motor diretamente.', false, 'Motores podem exigir mais corrente e proteção; use estágio de acionamento apropriado.'),
        mcq('Por que usar pull-up com botão para o terra?', ['Para definir alto quando o botão está aberto', 'Para curto-circuitar a alimentação', 'Para gerar tensão negativa', 'Para substituir o programa'], 0, 'O resistor mantém a entrada alta quando o botão está aberto; pressionado, o botão a leva ao terra.'),
      ] },
      { card: { title: 'PWM e leitura analógica', body: t`PWM alterna níveis digitais: ciclo de trabalho $D=t_{alto}/T$. Para níveis ideais de 0 e $V_{alto}$, a média é $DV_{alto}$. Um filtro ou a própria carga pode responder à média; PWM não é uma saída analógica contínua por si só. O ADC lê tensão, respeitando a referência e os limites do pino.` }, exercises: [
        mcq('O ciclo de trabalho é…', ['A fração do período em nível alto', 'A tensão de alimentação', 'A quantidade de pinos', 'O número de bits do ADC'], 0, t`$D=t_{alto}/T$.`),
        tf('PWM ideal de 0 a 5 V com ciclo de 50% tem média de 2,5 V.', true, t`$0,5\cdot5=2,5\,\text{V}$.`),
        inter('Ajuste o ciclo PWM para 60%.', 'plot', pulseLab().props, v => v.p.d === 60, '60%', t`Um nível alto durante $60\%$ do período corresponde a $D=0,6$.`),
        num(t`Um PWM de período $10\,\text{ms}$ fica alto por $2\,\text{ms}$. Qual o ciclo em %, com uma casa decimal?`, 20, t`$D=2/10=0,2=20,0\%$.`, { unit: '%', tol: 0.05 }),
        gen(rng => { const d = randInt(rng, 1, 9); return num(t`PWM ideal entre 0 e $10\,\text{V}$ tem ciclo de $${d * 10}\%$. Qual a média em V, com uma casa decimal?`, d, t`$V_{médio}=${fmt(d / 10, 1)}\cdot10=${d},0\,\text{V}$.`, { unit: 'V', tol: 0.05 }); }),
        tf('O sinal PWM no pino é sempre uma tensão contínua igual à sua média.', false, 'No pino ele alterna entre níveis; a média descreve um período, não o valor instantâneo.'),
        mcq('Antes de ligar um sensor ao ADC de uma placa, o que verificar?', ['Faixa de tensão, referência e limites do pino', 'Apenas a cor do fio', 'Apenas o nome Arduino', 'Se a saída do sensor é sempre digital'], 0, 'A tensão do sensor deve estar dentro dos limites e da faixa útil de conversão da placa.'),
      ] },
    ] },
    { id: 'dg-conv-com', title: 'Comunicação serial: UART, I²C e SPI', parts: [
      { card: { title: 'UART e tempo de bit', body: t`UART é comunicação serial assíncrona: transmissor e receptor combinam taxa e formato. Em 8N1 há um bit de início, 8 de dados e um de parada: 10 bits por quadro, sem paridade. TX de um lado vai ao RX do outro, com referência de terra comum e níveis compatíveis.`, visual: serialLab() }, exercises: [
        mcq('UART assíncrona exige combinar…', ['Taxa e formato do quadro', 'Uma linha de clock compartilhada obrigatória', 'O mesmo nome para os pinos', 'A mesma cor de fio'], 0, 'Sem clock compartilhado, os dois lados precisam concordar na taxa e no formato.'),
        tf('Em uma ligação UART simples, TX de um dispositivo vai ao RX do outro.', true, 'TX transmite e RX recebe; também confira terra e níveis elétricos.'),
        num('Quantos bits há num quadro UART 8N1, incluindo início e parada? Responda em bits inteiros.', 10, 'São 1 bit de início + 8 de dados + 1 de parada = 10 bits.', { unit: 'bits', tol: 0.01 }),
        gen(rng => { const k = randInt(rng, 1, 9); return num(t`Em UART 8N1 a $${k * 1000}\,\text{bit/s}$, quanto tempo leva um quadro de 10 bits em ms, com duas casas decimais?`, 10 / k, t`$10/(${k * 1000})\,\text{s}=${fmt(10 / k, 2)}\,\text{ms}$.`, { unit: 'ms', tol: 0.005 }); }),
        inter(t`Ajuste a taxa para que um bit dure $0,25\,\text{ms}$.`, 'plot', serialLab().props, v => v.p.b === 4, t`$4\,\text{kbit/s}$`, t`$1/(4\,\text{kbit/s})=0,25\,\text{ms}$.`),
        num(t`Em $1000\,\text{bit/s}$ e 8N1, qual a taxa máxima teórica de bytes úteis por segundo, sem intervalos? Responda em bytes/s inteiros.`, 100, t`Cada byte ocupa 10 bits: $1000/10=100\,\text{bytes/s}$.`, { unit: 'bytes/s', tol: 0.01 }),
        tf('Em UART 8N1, todos os bits transmitidos são dados úteis.', false, 'Há um bit de início e um de parada para cada oito bits de dados.'),
      ] },
      { card: { title: 'Barramentos I²C e SPI', body: t`I²C usa SDA e SCL compartilhadas, endereçamento e normalmente resistores pull-up; dispositivos precisam de endereços compatíveis. SPI usa clock, dados nas duas direções e seleção de dispositivo; não há endereçamento padronizado no próprio barramento. Confira tensão, pinagem, velocidade e configuração no datasheet.` }, exercises: [
        mcq('Quais são as duas linhas principais do I²C?', ['SDA e SCL', 'TX e RX', 'MOSI e MISO apenas', 'VCC e GND apenas'], 0, 'SDA carrega dados e SCL carrega clock.'),
        tf('Em I²C, resistores pull-up são normalmente necessários nas linhas do barramento.', true, 'As linhas de dreno aberto precisam de pull-up para atingir o nível alto.'),
        match('Associe o protocolo à característica.', [['UART', 'Serial assíncrona com quadros'], ['I²C', 'Duas linhas compartilhadas e endereçamento'], ['SPI', 'Clock e seleção de dispositivo']], 'UART usa enquadramento assíncrono; I²C compartilha linhas e endereços; SPI seleciona dispositivos.'),
        num('Num SPI com linha de seleção independente por periférico, quantas linhas de seleção são necessárias para 3 periféricos? Responda em linhas inteiras.', 3, 'Com seleção independente, é uma linha por periférico: 3 linhas.', { unit: 'linhas', tol: 0.01 }),
        gen(rng => { const n = randInt(rng, 2, 7); return num(t`Um SPI transmite $${n}$ bytes de 8 bits a $1000\,\text{bit/s}$, sem pausas ou sobrecarga. Quanto tempo leva em ms, com uma casa decimal?`, n * 8, t`São $${n}\cdot8=${n * 8}$ bits; a $1000\,\text{bit/s}$ levam $${n * 8},0\,\text{ms}$.`, { unit: 'ms', tol: 0.05 }); }),
        mcq('Dois periféricos I²C com o mesmo endereço fixo no mesmo barramento podem causar…', ['Conflito de endereço', 'Aumento automático da resolução ADC', 'Conversão do barramento em SPI', 'Eliminação da necessidade de clock'], 0, 'Ambos podem responder ao mesmo endereço; é preciso separar ou mudar o endereço quando possível.'),
        tf('SPI e I²C devem ter níveis elétricos e temporização compatíveis entre os dispositivos.', true, 'Além do protocolo, tensões, velocidades e limites elétricos precisam ser compatíveis.'),
      ] },
    ] },
  ],
};

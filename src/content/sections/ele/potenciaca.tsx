import React from 'react';
import type { UnitDef } from '../../types';
import { gen, inter, mcq, num, plot, tf } from '../../helpers';
import { Arrow } from '../../../components/plot/Plot';
import { C } from '../../../theme';
import { fmt, randInt } from '../../../lib/random';
import { fnLab } from '../../visuals';

const t = String.raw;

// P e Q em kW e kvar; desenhamos o caso indutivo senoidal.
const triangulo = () => plot({
  view: { xMin: -0.5, xMax: 7, yMin: -0.5, yMax: 6 }, equalAspect: true,
  params: [
    { key: 'p', label: 'P', min: 1, max: 6, step: 1, value: 4, color: C.p2 },
    { key: 'q', label: 'Q', min: 0, max: 5, step: 1, value: 3, color: C.p3 },
  ],
  render: ({ p }: any) => <>
    <Arrow x1={0} y1={0} x2={p.p} y2={0} color={C.p2} label="P" />
    <Arrow x1={p.p} y1={0} x2={p.p} y2={p.q} color={C.p3} label="Q" />
    <Arrow x1={0} y1={0} x2={p.p} y2={p.q} color={C.gold} label="S" />
  </>,
  info: ({ p }: any) => t`$S=${fmt(Math.hypot(p.p, p.q), 2)}\,\text{kVA}$ · $FP=${fmt(p.p / Math.hypot(p.p, p.q), 2)}$`,
}, 250);

const ondas = () => fnLab({
  view: { xMin: 0, xMax: 6.5, yMin: -1.5, yMax: 1.5 },
  params: [{ key: 'fase', label: 'fase', min: 0, max: 2, step: 1, value: 0, color: C.p2 }],
  f: (x, p) => Math.sin(x - p.fase * 2 * Math.PI / 3),
  info: (p) => t`Fase ${p.fase + 1}: defasagem de $${p.fase * 120}^{\circ}$ em relação à primeira.`,
});

const correnteLab = () => fnLab({
  view: { xMin: 0, xMax: 10, yMin: 0, yMax: 10 },
  params: [{ key: 'r', label: 'R (kΩ)', min: 1, max: 5, step: 1, value: 2, color: C.p2 }],
  f: (x, p) => x / p.r,
  info: (p) => t`Modelo resistivo: $I=V/R$. Com $R=${p.r}\,\text{k}\Omega$, a inclinação é $${fmt(1 / p.r, 2)}\,\text{mA/V}$.`,
});

export const potenciaCA: UnitDef = {
  id: 'el-pot', title: 'Potência em CA e sistemas trifásicos', icon: '🏭',
  subtitle: 'Potências, correção, trifásico e proteção',
  source: 'Eletricidade Aplicada · Eficiência Energética; complementos de potência em CA, trifásico e segurança',
  guide: t`Em regime senoidal: $P=VI\cos\varphi$, $Q=VI\sin\varphi$, $S=VI=\sqrt{P^2+Q^2}$ e $FP=P/S$. Para carga indutiva, $Q_c=Q_i-Q_f$. Em trifásico equilibrado, $P=\sqrt3 V_L I_L FP$; em estrela $V_L=\sqrt3 V_f$ e $I_L=I_f$; em triângulo $V_L=V_f$ e $I_L=\sqrt3 I_f$. Na proteção, considere carga, condutores, instalação e dispositivos em conjunto.`,
  extra: true,
  lessons: [
    { id: 'el-pot-pqs', title: 'Potência ativa, reativa e aparente', parts: [
      { card: { title: 'P, Q e S', body: t`Para tensão e corrente senoidais em valores eficazes, a potência ativa $P=VI\cos\varphi$ mede a taxa média de transferência de energia, em W. A reativa $Q=VI\sin\varphi$, em var, representa a troca periódica de energia com campos. A aparente $S=VI$, em VA, é o produto dos valores eficazes.`, visual: triangulo(), tip: 'Arraste P e Q: a hipotenusa representa S no caso indutivo.' }, exercises: [
        mcq('Qual grandeza mede a potência média transferida à carga?', ['ativa', 'reativa', 'aparente', 'frequência'], 0, 'A potência ativa P é a média temporal da potência instantânea.'),
        tf('A unidade de potência reativa é var.', true, 'Usamos var para Q, W para P e VA para S.'),
        num(t`Uma carga senoidal recebe $V=100\,\text{V}$ e $I=2\,\text{A}$ eficazes. Calcule $S$ em VA, sem casas decimais.`, 200, t`$S=VI=100\cdot2=200\,\text{VA}$.`, { unit: 'VA', tol: 0.5 }),
        gen(rng => { const i = randInt(rng, 1, 5); return num(t`Em CA senoidal, $V=100\,\text{V}$ e $I=${i}\,\text{A}$ eficazes. Calcule $S$ em VA, sem casas decimais.`, 100*i, t`$S=VI=100\cdot${i}=${100*i}\,\text{VA}$.`, { unit: 'VA', tol: 0.5 }); }),
        num(t`Uma carga tem $S=500\,\text{VA}$ e $FP=0,8$. Ache $P$ em W, sem casas decimais.`, 400, t`$P=S\cdot FP=500\cdot0,8=400\,\text{W}$.`, { unit: 'W', tol: 0.5 }),
        inter(t`No triângulo indutivo, ajuste $P=3\,\text{kW}$ e $Q=4\,\text{kvar}$.`, 'plot', triangulo().props, v => v.p.p === 3 && v.p.q === 4, 'P = 3; Q = 4', t`A hipotenusa é $S=\sqrt{3^2+4^2}=5\,\text{kVA}$.`),
        num(t`Para $P=3\,\text{kW}$ e $Q=4\,\text{kvar}$, calcule $S$ em kVA, sem casas decimais.`, 5, t`$S=\sqrt{3^2+4^2}=5\,\text{kVA}$.`, { unit: 'kVA', tol: 0.5 }),
      ] },
      { card: { title: 'Sinais e energia', body: t`Adotando a convenção de carga, $Q>0$ indica comportamento indutivo e $Q<0$, capacitivo. Com formas senoidais, $P=S\cos\varphi$ e $Q=S\sin\varphi$. A energia ativa consumida a potência constante é $E=Pt$: kW vezes horas resulta em kWh.`, tip: 'Potência é taxa; energia também depende do tempo.' }, exercises: [
        mcq('Na convenção de carga, Q positivo representa comportamento predominantemente…', ['indutivo', 'capacitivo', 'sem corrente', 'de circuito aberto'], 0, 'Nesta convenção, a carga indutiva absorve potência reativa positiva.'),
        tf('Uma carga puramente resistiva senoidal ideal tem Q nulo.', true, 'Tensão e corrente estão em fase: seno do ângulo é zero.'),
        num(t`Um aquecedor de $2\,\text{kW}$ funciona por $3\,\text{h}$. Qual energia em kWh, sem casas decimais?`, 6, t`$E=Pt=2\cdot3=6\,\text{kWh}$.`, { unit: 'kWh', tol: 0.5 }),
        gen(rng => { const h = randInt(rng, 2, 6); return num(t`Uma carga de $3\,\text{kW}$ opera por $${h}\,\text{h}$. Ache a energia em kWh, sem casas decimais.`, 3*h, t`$E=3\cdot${h}=${3*h}\,\text{kWh}$.`, { unit: 'kWh', tol: 0.5 }); }),
        num(t`Se $S=10\,\text{kVA}$ e $\sin\varphi=0,6$, qual $Q$ em kvar, sem casas decimais?`, 6, t`$Q=S\sin\varphi=10\cdot0,6=6\,\text{kvar}$.`, { unit: 'kvar', tol: 0.5 }),
        mcq('Dois aparelhos de mesma potência ativa funcionam por tempos diferentes. Qual consome mais energia?', ['o que funciona por mais tempo', 'o que funciona por menos tempo', 'ambos sempre consomem igual', 'o de menor tempo, necessariamente'], 0, 'Para potência constante, E = P vezes o tempo.'),
        num(t`Um equipamento de $1,5\,\text{kW}$ funciona por $4\,\text{h}$. Calcule a energia em kWh, sem casas decimais.`, 6, t`$E=1,5\cdot4=6\,\text{kWh}$.`, { unit: 'kWh', tol: 0.5 }),
      ] },
    ] },
    { id: 'el-pot-fp', title: 'Fator de potência e correção', parts: [
      { card: { title: 'O que o fator de potência mede', body: t`O fator de potência é $FP=P/S$. Para tensão e corrente senoidais, $FP=\cos\varphi$. Com $P$ e tensão fixos, elevar o FP reduz $S$ e a corrente fornecida. Isso pode reduzir perdas nos condutores; não muda por si só a energia ativa exigida pela carga.`, visual: triangulo() }, exercises: [
        mcq('Qual razão define o fator de potência?', ['$P/S$', '$Q/P$', '$S/P$', '$VI/P$'], 0, t`Por definição, $FP=P/S$.`),
        tf('Para uma carga senoidal resistiva ideal, o fator de potência é 1.', true, 'P e S são iguais porque tensão e corrente estão em fase.'),
        num(t`Uma carga recebe $P=8\,\text{kW}$ e $S=10\,\text{kVA}$. Calcule o FP com uma casa decimal.`, 0.8, t`$FP=8/10=0,8$.`, { unit: '', tol: 0.05 }),
        gen(rng => { const p = randInt(rng, 2, 8); return num(t`Uma carga tem $P=${p}\,\text{kW}$ e $S=${2*p}\,\text{kVA}$. Qual o FP com uma casa decimal?`, 0.5, t`$FP=${p}/${2*p}=0,5$.`, { unit: '', tol: 0.05 }); }),
        inter(t`Com $P=4\,\text{kW}$, ajuste $Q$ para obter $FP=1$.`, 'plot', triangulo().props, v => v.p.p === 4 && v.p.q === 0, 'P = 4; Q = 0', t`Com $Q=0$, $S=P=4\,\text{kVA}$ e $FP=1$.`),
        num(t`Para $P=12\,\text{kW}$ e $FP=0,8$, calcule $S$ em kVA, sem casas decimais.`, 15, t`$S=P/FP=12/0,8=15\,\text{kVA}$.`, { unit: 'kVA', tol: 0.5 }),
        tf('A correção ideal do FP, mantendo a carga e sua potência ativa, reduz a corrente de alimentação.', true, 'Com tensão e P fixos, S = P/FP diminui e, portanto, I também diminui.'),
      ] },
      { card: { title: 'Banco de capacitores', body: t`Um capacitor em paralelo fornece potência reativa capacitiva, compensando parte da reativa indutiva. Para $P$ constante: $Q_c=Q_i-Q_f=P(\tan\varphi_i-\tan\varphi_f)$, com $Q_c$ expresso como magnitude positiva. Evite sobrecompensação e considere variação da carga e harmônicas no projeto.`, tip: 'O banco corrige reativo; não elimina automaticamente as perdas ou o consumo ativo da carga.' }, exercises: [
        mcq('Para compensar uma carga indutiva, usa-se tipicamente um banco de…', ['capacitores em paralelo', 'resistores em série', 'fusíveis em paralelo', 'indutores em paralelo'], 0, 'O reativo capacitivo compensa parte do reativo indutivo na alimentação.'),
        tf('Uma compensação excessiva pode deixar o conjunto com comportamento capacitivo.', true, 'Se a magnitude capacitiva superar a reativa indutiva, Q total fica negativo.'),
        num(t`Uma carga absorve $6\,\text{kvar}$ indutivos e o banco fornece $2\,\text{kvar}$ capacitivos. Ache o Q líquido indutivo em kvar, sem casas decimais.`, 4, t`$Q_f=6-2=4\,\text{kvar}$.`, { unit: 'kvar', tol: 0.5 }),
        gen(rng => { const q = randInt(rng, 3, 8); return num(t`Uma carga absorve $${q}\,\text{kvar}$ indutivos. Um banco fornece $2\,\text{kvar}$ capacitivos. Qual o Q líquido indutivo em kvar, sem casas decimais?`, q-2, t`$Q_f=${q}-2=${q-2}\,\text{kvar}$.`, { unit: 'kvar', tol: 0.5 }); }),
        num(t`Com $Q_i=9\,\text{kvar}$ e meta $Q_f=3\,\text{kvar}$ indutivos, qual a magnitude do banco em kvar, sem casas decimais?`, 6, t`$Q_c=Q_i-Q_f=9-3=6\,\text{kvar}$.`, { unit: 'kvar', tol: 0.5 }),
        mcq('Qual condição merece atenção ao projetar um banco real?', ['variação da carga e harmônicas', 'somente a cor do painel', 'apenas o valor de P em um instante', 'a forma dos parafusos isoladamente'], 0, 'Variações de carga podem causar sobrecompensação, e harmônicas podem interagir com o banco.'),
        num(t`Para $P=8\,\text{kW}$, $\tan\varphi_i=0,75$ e $\tan\varphi_f=0,25$, ache a magnitude do banco em kvar, sem casas decimais.`, 4, t`$Q_c=8(0,75-0,25)=4\,\text{kvar}$.`, { unit: 'kvar', tol: 0.5 }),
      ] },
    ] },
    { id: 'el-pot-tri', title: 'Sistemas trifásicos', parts: [
      { card: { title: 'Três fases e ligação estrela', body: t`Num sistema trifásico senoidal equilibrado, as três tensões de fase têm mesma amplitude e frequência e diferem de $120^\circ$. Em estrela equilibrada, cada carga fica entre fase e ponto comum: $V_L=\sqrt3 V_f$ e $I_L=I_f$. $V_L$ é tensão entre linhas.`, visual: ondas(), tip: 'Altere o seletor para comparar as três senoides.' }, exercises: [
        mcq('Qual é a defasagem entre fases consecutivas de um sistema trifásico equilibrado?', [t`$120^\circ$`, t`$90^\circ$`, t`$180^\circ$`, t`$360^\circ$`], 0, t`Uma volta de $360^\circ$ dividida igualmente por três dá $120^\circ$.`),
        tf('Em estrela equilibrada, a corrente de linha é igual à corrente de fase.', true, 'Cada condutor de linha conduz a corrente de sua carga de fase.'),
        num(t`Em estrela equilibrada, $I_f=8\,\text{A}$. Determine $I_L$ em A, sem casas decimais.`, 8, t`Em estrela $I_L=I_f=8\,\text{A}$.`, { unit: 'A', tol: 0.5 }),
        gen(rng => { const i = randInt(rng, 2, 12); return num(t`Em estrela equilibrada, $I_f=${i}\,\text{A}$. Determine $I_L$ em A, sem casas decimais.`, i, t`Em estrela $I_L=I_f=${i}\,\text{A}$.`, { unit: 'A', tol: 0.5 }); }),
        inter('Selecione a segunda fase, defasada de 120° em relação à primeira.', 'plot', ondas().props, v => v.p.fase === 1, 'fase = 1', t`O controle $1$ seleciona a segunda senoide, atrasada de $120^\circ$.`),
        num(t`Em estrela equilibrada, $V_f=100\,\text{V}$. Use $\sqrt3=1,73$ e calcule $V_L$ em V, sem casas decimais.`, 173, t`$V_L=\sqrt3 V_f=1,73\cdot100=173\,\text{V}$.`, { unit: 'V', tol: 0.5 }),
        mcq('Em estrela equilibrada, a tensão de linha é medida entre…', ['duas linhas', 'uma linha e o ponto comum', 'as extremidades de um único elemento de fase', 'dois pontos de um mesmo fio ideal'], 0, 'Tensão de linha é entre linhas; a de fase da carga estrela é entre linha e ponto comum.'),
      ] },
      { card: { title: 'Triângulo e potência trifásica', body: t`Em triângulo equilibrado, cada carga liga duas linhas: $V_L=V_f$ e $I_L=\sqrt3 I_f$. Para qualquer dessas ligações equilibradas, usando valores eficazes de linha: $P=\sqrt3 V_L I_L FP$. A relação exige equilíbrio e, para $FP=\cos\varphi$, formas senoidais.`, tip: 'Não confunda tensão de linha com tensão de fase nem corrente de linha com corrente de fase.' }, exercises: [
        tf('Na ligação triângulo, cada carga de fase recebe a tensão entre duas linhas.', true, 'Cada ramo do triângulo está diretamente entre duas linhas.'),
        mcq('Em triângulo equilibrado, como se relacionam as correntes?', [t`$I_L=\sqrt3 I_f$`, '$I_L=I_f$', '$I_L=3I_f$', '$I_L=I_f/3$'], 0, t`A diferença fasorial das correntes de dois ramos dá $I_L=\sqrt3 I_f$.`),
        num(t`Em triângulo, $V_L=220\,\text{V}$. Qual $V_f$ em V, sem casas decimais?`, 220, t`Cada ramo está entre linhas: $V_f=V_L=220\,\text{V}$.`, { unit: 'V', tol: 0.5 }),
        gen(rng => { const v = 10*randInt(rng, 10, 25); return num(t`Em triângulo, $V_L=${v}\,\text{V}$. Qual $V_f$ em V, sem casas decimais?`, v, t`$V_f=V_L=${v}\,\text{V}$.`, { unit: 'V', tol: 0.5 }); }),
        num(t`Em triângulo equilibrado, $I_f=10\,\text{A}$. Use $\sqrt3=1,73$ e calcule $I_L$ em A, com uma casa decimal.`, 17.3, t`$I_L=1,73\cdot10=17,3\,\text{A}$.`, { unit: 'A', tol: 0.05 }),
        num(t`Um sistema trifásico equilibrado tem $V_L=100\,\text{V}$, $I_L=10\,\text{A}$ e $FP=1$. Use $\sqrt3=1,73$. Ache $P$ em W, sem casas decimais.`, 1730, t`$P=1,73\cdot100\cdot10\cdot1=1730\,\text{W}$.`, { unit: 'W', tol: 0.5 }),
        num(t`Em regime trifásico equilibrado, $V_L=200\,\text{V}$, $I_L=10\,\text{A}$ e $FP=0,8$. Use $\sqrt3=1,73$. Ache $P$ em W, sem casas decimais.`, 2768, t`$P=1,73\cdot200\cdot10\cdot0,8=2768\,\text{W}$.`, { unit: 'W', tol: 0.5 }),
      ] },
    ] },
    { id: 'el-pot-inst', title: 'Instalações e segurança', parts: [
      { card: { title: 'Corrente, condutor e disjuntor', body: t`Para uma carga resistiva monofásica ideal, $I=P/V$. O condutor deve suportar a corrente nas condições reais de instalação; o disjuntor protege contra sobrecorrentes e deve ser coordenado com a carga e o condutor. A seção depende também de método de instalação, temperatura, agrupamento e queda de tensão.`, visual: correnteLab(), tip: 'O gráfico é apenas um modelo resistivo, não uma tabela de bitolas.' }, exercises: [
        mcq('Qual é a função principal de um disjuntor termomagnético?', ['proteger contra sobrecorrentes', 'medir energia em kWh', 'elevar o fator de potência', 'substituir o aterramento'], 0, 'O disjuntor protege contra sobrecarga e curto-circuito quando adequadamente escolhido.'),
        tf('A capacidade de corrente de um condutor depende das condições de instalação.', true, 'Temperatura, agrupamento e método de instalação influenciam a dissipação de calor.'),
        num(t`Uma carga resistiva de $2200\,\text{W}$ em $220\,\text{V}$ consome quantos A? Dê o valor sem casas decimais.`, 10, t`$I=P/V=2200/220=10\,\text{A}$.`, { unit: 'A', tol: 0.5 }),
        gen(rng => { const i = randInt(rng, 3, 15); return num(t`Uma carga resistiva de $${220*i}\,\text{W}$ opera em $220\,\text{V}$. Calcule I em A, sem casas decimais.`, i, t`$I=${220*i}/220=${i}\,\text{A}$.`, { unit: 'A', tol: 0.5 }); }),
        inter(t`No modelo resistivo, ajuste $R=4\,\text{k}\Omega$.`, 'plot', correnteLab().props, v => v.p.r === 4, 'R = 4 kΩ', t`Em $4\,\text{k}\Omega$, $10\,\text{V}$ produziriam $2,5\,\text{mA}$ no modelo.`),
        mcq('Uma instalação apresenta desarmes frequentes. Qual atitude é apropriada?', ['pedir avaliação profissional da causa', 'trocar por disjuntor maior sem avaliar fios', 'prender a alavanca ligada', 'remover a proteção'], 0, 'Desarmes podem indicar sobrecarga ou falha; aumentar o disjuntor sem avaliar os condutores é perigoso.'),
        mcq(t`Exemplo didático: carga de $12\,\text{A}$, condutor com capacidade corrigida de $20\,\text{A}$ e opções de disjuntor de 10, 16 e 25 A. Qual atende $I_b\le I_n\le I_z$?`, ['16 A', '10 A', '25 A', 'nenhum'], 0, t`$12\le16\le20$. O projeto real exige outras verificações, inclusive curto-circuito e queda de tensão.`),
      ] },
      { card: { title: 'Choque, aterramento e DR', body: t`Choque é a passagem de corrente pelo corpo; seus efeitos dependem de intensidade, duração e caminho. O DR detecta diferença entre correntes que entram e saem do circuito e pode desligar diante de fuga. DR, aterramento e proteção contra sobrecorrente têm funções complementares; o DR não garante proteção em toda situação.`, tip: 'Em acidente, afaste-se do contato e desligue a alimentação se for seguro; chame emergência. Não toque na vítima energizada.' }, exercises: [
        mcq('O DR atua ao detectar principalmente…', ['corrente diferencial residual', 'aumento de tensão em qualquer situação', 'consumo mensal elevado', 'baixa frequência da rede'], 0, 'O DR compara as correntes nos condutores monitorados e atua quando a diferença atinge suas condições de disparo.'),
        tf('O DR substitui obrigatoriamente toda proteção contra sobrecorrente.', false, 'Um DR sem proteção de sobrecorrente integrada deve ser associado à proteção apropriada.'),
        num(t`Num modelo, passam $5,00\,\text{A}$ pela fase e $4,98\,\text{A}$ pelo neutro monitorados. Qual a diferença em mA, sem casas decimais?`, 20, t`$5,00-4,98=0,02\,\text{A}=20\,\text{mA}$.`, { unit: 'mA', tol: 0.5 }),
        gen(rng => { const m = 5*randInt(rng, 1, 5); return num(t`Um modelo apresenta $100\,\text{mA}$ na ida e $${100-m}\,\text{mA}$ no retorno monitorado. Qual a diferença em mA, sem casas decimais?`, m, t`$100-${100-m}=${m}\,\text{mA}$.`, { unit: 'mA', tol: 0.5 }); }),
        mcq('Ao encontrar uma pessoa em contato com uma fonte elétrica, qual é a primeira medida segura?', ['interromper a alimentação se for seguro e chamar emergência', 'tocar diretamente na vítima', 'jogar água no equipamento', 'religar o disjuntor'], 0, 'Não toque na vítima energizada; desligue a alimentação se puder fazê-lo com segurança e acione o socorro.'),
        tf('Um DR pode não detectar um choque quando as correntes de ida e retorno pelo aparelho permanecem equilibradas.', true, 'Nesse caso pode não haver corrente diferencial suficiente para o DR atuar; ele não cobre todos os contatos.'),
        mcq('Qual conjunto descreve melhor a segurança elétrica?', ['isolação, aterramento e proteções coordenadas', 'apenas aumentar o disjuntor', 'apenas usar DR, dispensando demais medidas', 'apenas reduzir o tempo de contato'], 0, 'As medidas são complementares e devem ser projetadas e mantidas conforme as condições da instalação.'),
      ] },
    ] },
  ],
};

import React from 'react';
import type { UnitDef } from '../../types';
import { gen, inter, match, mcq, num, order, plot, tf } from '../../helpers';
import { FnCurve } from '../../../components/plot/Plot';
import { C } from '../../../theme';
import { randInt } from '../../../lib/random';

const t = String.raw;
const repr = (n: number, base: number) => n.toString(base).toUpperCase();
const bits = (n: number, width: number) => repr(n, 2).padStart(width, '0');

// O controle mostra a mesma quantidade em várias representações posicionais.
const baseLab = () => plot({
  view: { xMin: 0, xMax: 16, yMin: 0, yMax: 16 },
  params: [{ key: 'n', label: 'Quantidade', min: 0, max: 15, step: 1, value: 0, color: C.p2 }],
  render: ({ p }: any) => <FnCurve f={() => p.n} color={C.p2} />,
  info: ({ p }: any) => t`Decimal $${p.n}$ · binário $(${bits(p.n, 4)})_2$ · octal $(${repr(p.n, 8)})_8$ · hexadecimal $(${repr(p.n, 16)})_{16}$`,
});
const analogLab = () => plot({
  view: { xMin: 0, xMax: 4, yMin: -0.2, yMax: 4.2 },
  params: [{ key: 'v', label: 'Entrada', min: 0, max: 4, step: 0.1, value: 0, color: C.p2 }],
  render: ({ p }: any) => <FnCurve f={() => p.v} color={C.p2} />,
  info: ({ p }: any) => p.v >= 2 ? 'Entrada no intervalo alto: saída lógica 1.' : 'Entrada no intervalo baixo: saída lógica 0.',
});
const adjust = (target: number, prompt: string, explanation: string) =>
  inter(prompt, 'plot', baseLab().props, (v) => v.p.n === target, `Quantidade ${target}`, explanation);

// Todos os pares ordenados de bases são cobertos; os distratores representam outras quantidades.
const conversion = (from: number, to: number) => gen((rng) => {
  const n = randInt(rng, 10, 63);
  return mcq(t`Converta $(${repr(n, from)})_{${from}}$ para a base $${to}$.`,
    [n, n + 1, n + 2, n + 3].map((x) => t`$(${repr(x, to)})_{${to}}$`), 0,
    t`A quantidade é $${n}$ em decimal. Na base $${to}$ ela se escreve $(${repr(n, to)})_{${to}}$.`);
});

export const numeracao: UnitDef = {
  id: 'dg-num', title: 'Sistemas de numeração', icon: '🔢',
  subtitle: 'Sinais, bases e códigos digitais',
  source: 'Eletrônica Digital 01 — Sistemas de Numeração; Tocci, Sistemas Digitais, cap. 2',
  guide: t`Em base $b$, cada posição tem peso $b^k$. Para converter inteiros do decimal, divida sucessivamente pela base e leia os restos de baixo para cima. Agrupe bits em trios para octal ou quartetos para hexadecimal. BCD 8421 codifica cada algarismo decimal separadamente; Gray refletido muda um bit entre valores consecutivos; ASCII é um código de 7 bits.`,
  lessons: [
    { id: 'dg-num-ad', title: 'Analógico e digital', parts: [
      { card: { title: 'Sinais e níveis', body: t`Um sinal **analógico** pode variar continuamente em uma faixa. Um sinal digital usa níveis discretos para representar símbolos; no caso binário, $0$ e $1$. A tensão física ainda é contínua: circuitos interpretam faixas de tensão como níveis lógicos.`, visual: analogLab(), tip: 'Neste modelo didático, entradas abaixo de 2 são baixas e as demais são altas; circuitos reais têm limites e margens próprios.' }, exercises: [
        mcq('Qual grandeza é tipicamente analógica?', ['Tensão de um microfone variando continuamente', 'Um bit armazenado', 'Uma sequência de bits', 'Um dígito binário'], 0, 'A tensão do microfone pode assumir valores ao longo de uma faixa.'),
        tf('Um bit pode representar dois estados lógicos.', true, 'Os estados são 0 e 1.'),
        mcq('Qual afirmação descreve um sinal digital binário?', ['Usa dois níveis lógicos', 'Tem infinitos símbolos lógicos', 'Nunca é implementado por tensão', 'É sempre uma onda senoidal'], 0, 'Os dois símbolos lógicos são 0 e 1; sua implementação física pode usar faixas de tensão.'),
        inter('No modelo do gráfico, ajuste a entrada para o nível alto.', 'plot', analogLab().props, (v) => v.p.v >= 2, 'Entrada de 2 a 4', 'Neste modelo, o limiar é 2; valores a partir dele são interpretados como 1.'),
        tf('Uma tensão física usada em circuito digital só pode assumir exatamente dois valores.', false, 'A tensão física varia continuamente; faixas são interpretadas como níveis lógicos.'),
        gen((rng) => { const n = randInt(rng, 2, 8); return num(t`Quantas combinações distintas existem em $${n}$ bits?`, 2 ** n, t`Há duas escolhas independentes por bit: $2^{${n}}=${2 ** n}$ combinações.`); }),
        num('Quantas combinações diferentes existem em 4 bits?', 16, t`$2^4=16$ combinações, de 0000 a 1111.`),
      ] },
      { card: { title: 'Da medida ao código', body: 'Uma conversão analógico-digital amostra o sinal em instantes e quantiza cada amostra em um dos níveis disponíveis. Mais bits permitem mais níveis, mas não eliminam todos os erros de medição.' }, exercises: [
        mcq('A amostragem de um sinal seleciona…', ['valores em instantes determinados', 'todos os instantes possíveis', 'somente letras', 'a base hexadecimal obrigatoriamente'], 0, 'Amostragem observa o sinal em instantes determinados.'),
        mcq('Quantização associa uma amostra a…', ['um nível de um conjunto finito', 'um instante infinitamente preciso', 'uma letra ASCII obrigatória', 'um número de bits infinito'], 0, 'A quantização escolhe um nível dentre os disponíveis.'),
        tf('Com mais bits por amostra, o número de níveis possíveis cresce.', true, t`Com $n$ bits há até $2^n$ códigos distintos.`),
        num('Quantos níveis distintos podem ser codificados com 3 bits?', 8, t`$2^3=8$ níveis.`),
        gen((rng) => { const n = randInt(rng, 3, 7); return num(t`Um conversor usa $${n}$ bits por amostra. Quantos códigos distintos há?`, 2 ** n, t`Cada bit tem duas possibilidades, então $2^{${n}}=${2 ** n}$.`); }),
        mcq('Ao dobrar o número de níveis em uma mesma faixa, o passo uniforme ideal de quantização aproximadamente…', ['cai pela metade', 'dobra', 'quadruplica', 'permanece igual'], 0, 'Ao dividir a mesma faixa em duas vezes mais intervalos, cada intervalo tem metade da largura.'),
        order('Ordene as etapas de uma digitalização simples.', ['Sinal analógico', 'Amostragem', 'Quantização', 'Codificação em bits'], 'Primeiro medimos em instantes, depois escolhemos níveis e os codificamos.'),
      ] },
    ] },
    { id: 'dg-num-bin', title: 'Sistema binário', parts: [
      { card: { title: 'Pesos binários', body: t`Um bit é um dígito $0$ ou $1$. Em um inteiro binário, os pesos da direita para a esquerda são $1$, $2$, $4$, $8$ e assim por diante. Por exemplo, $(1011)_2=8+2+1=11$. O bit mais à esquerda é o MSB; o mais à direita é o LSB.`, visual: baseLab() }, exercises: [
        mcq('Quais são os dígitos da base 2?', ['0 e 1', '1 e 2', '0 a 2', '0 a 9'], 0, 'A base 2 tem dois dígitos: 0 e 1.'),
        num(t`Qual o peso do terceiro bit da direita em um inteiro binário?`, 4, t`Os pesos são $2^0=1$, $2^1=2$ e $2^2=4$.`),
        num(t`Converta $(101)_2$ para decimal.`, 5, t`$1\cdot4+0\cdot2+1=5$.`),
        adjust(6, 'Ajuste a quantidade para representar $(0110)_2$.', t`$0110_2=4+2=6$; ajuste a quantidade para 6.`),
        tf(t`Em $(1000)_2$, o bit mais significativo tem peso 8.`, true, t`A posição mais à esquerda tem peso $2^3=8$.`),
        conversion(2, 10),
        num(t`Qual é o maior inteiro sem sinal em 5 bits?`, 31, t`Todos os bits em 1: $16+8+4+2+1=31=2^5-1$.`),
      ] },
      { card: { title: 'Decimal para binário', body: t`Para converter um inteiro decimal, divida por 2 sucessivamente até o quociente ser zero. Leia os restos do último para o primeiro. Exemplo: $13=6\cdot2+1$, $6=3\cdot2+0$, $3=1\cdot2+1$, $1=0\cdot2+1$; logo $(13)_{10}=(1101)_2$. Zeros à esquerda não mudam o valor.` }, exercises: [
        mcq(t`Qual é $(2)_{10}$ em binário?`, ['$(10)_2$', '$(11)_2$', '$(100)_2$', '$(1)_2$'], 0, t`$2=1\cdot2+0$, portanto $(10)_2$.`),
        num(t`Converta $(5)_{10}$ para binário; digite apenas os dígitos.`, 101, t`$5=4+1=(101)_2$.`),
        tf(t`$(00101)_2$ e $(101)_2$ representam a mesma quantidade.`, true, 'Zeros à esquerda têm contribuição zero e não mudam o valor.'),
        conversion(10, 2),
        num(t`Converta $(14)_{10}$ para binário; digite apenas os dígitos.`, 1110, t`$14=8+4+2=(1110)_2$.`),
        order('Ordene os passos da conversão de inteiro decimal para binário.', ['Dividir por 2', 'Registrar o resto', 'Repetir com o quociente até zero', 'Ler os restos na ordem inversa'], 'Cada resto fornece um bit, do menos significativo para o mais significativo.'),
        num(t`Quantos bits são necessários para representar 32 sem sinal?`, 6, t`$32=2^5=(100000)_2$, que tem 6 bits; 5 bits vão só até 31.`),
      ] },
    ] },
    { id: 'dg-num-hex', title: 'Octal e hexadecimal', parts: [
      { card: { title: 'Base 8', body: t`O sistema octal usa dígitos de $0$ a $7$ e pesos $1$, $8$, $64$, … Por exemplo, $(25)_8=2\cdot8+5=21$ em decimal. Cada dígito octal corresponde a três bits.`, visual: baseLab() }, exercises: [
        mcq('Qual dígito não pertence à base 8?', ['8', '7', '0', '5'], 0, 'Os dígitos octais vão de 0 a 7.'),
        num(t`Qual o peso da segunda posição da direita em octal?`, 8, t`A segunda posição tem peso $8^1=8$.`),
        num(t`Converta $(17)_8$ para decimal.`, 15, t`$1\cdot8+7=15$.`),
        adjust(10, 'Ajuste a quantidade equivalente a $(12)_8$.', t`$1\cdot8+2=10$.`),
        tf(t`$(10)_8$ representa oito em decimal.`, true, t`$1\cdot8+0=8$.`),
        conversion(8, 10),
        conversion(10, 8),
      ] },
      { card: { title: 'Base 16', body: t`A base 16 usa $0$ a $9$ e as letras A a F para os valores decimais 10 a 15. Cada dígito hexadecimal corresponde a quatro bits. Assim, $(2E)_{16}=2\cdot16+14=46$.` }, exercises: [
        mcq('Quanto vale o dígito hexadecimal A em decimal?', ['10', '11', '12', '16'], 0, 'Após 9 vêm A = 10, B = 11 e assim por diante.'),
        num('Quanto vale F hexadecimal em decimal?', 15, 'F representa 15, o maior dígito da base 16.'),
        num(t`Converta $(1A)_{16}$ para decimal.`, 26, t`$1\cdot16+10=26$.`),
        tf('G é um dígito hexadecimal válido.', false, 'Os símbolos hexadecimais terminam em F, que vale 15.'),
        conversion(16, 10),
        conversion(10, 16),
        num(t`Quantos bits são necessários para representar exatamente um dígito hexadecimal?`, 4, t`$2^4=16$ combinações, uma para cada dígito de 0 a F.`),
      ] },
    ] },
    { id: 'dg-num-conv', title: 'Conversões entre bases', parts: [
      { card: { title: 'Agrupando bits', body: t`Para passar de binário a octal, agrupe bits de três em três a partir da direita. Para hexadecimal, agrupe de quatro em quatro. Complete o grupo mais à esquerda com zeros, se necessário. Exemplo: $(101101)_2=(55)_8=(2D)_{16}$.`, visual: baseLab() }, exercises: [
        mcq('Quantos bits formam um dígito octal?', ['3', '2', '4', '8'], 0, t`$2^3=8$: três bits cobrem os oito dígitos octais.`),
        mcq(t`Qual dígito hexadecimal representa $(1010)_2$?`, ['A', 'B', '8', 'F'], 0, t`$1010_2=8+2=10$, que é A em hexadecimal.`),
        adjust(13, 'Ajuste o valor do grupo binário 1101.', t`$1101_2=8+4+1=13$, ou D em hexadecimal.`),
        conversion(2, 8),
        conversion(8, 2),
        conversion(2, 16),
        conversion(16, 2),
      ] },
      { card: { title: 'Entre octal e hexadecimal', body: t`Para converter octal em hexadecimal, troque cada dígito octal por 3 bits e reagrupe em 4 bits. No sentido inverso, expanda cada dígito hexadecimal em 4 bits e reagrupe em trios. Exemplo: $(73)_8=(111011)_2=(3B)_{16}$.` }, exercises: [
        mcq(t`Qual grupo de três bits representa o dígito octal 7?`, ['111', '101', '100', '011'], 0, t`$7=4+2+1=(111)_2$.`),
        mcq(t`Qual grupo de quatro bits representa o dígito hexadecimal C?`, ['1100', '1010', '1110', '1001'], 0, t`C vale 12, e $12=8+4=(1100)_2$.`),
        tf('Ao reagrupar bits de um inteiro, zeros à esquerda podem completar o primeiro grupo.', true, 'Zeros à esquerda não alteram a quantidade e completam o grupo.'),
        conversion(8, 16),
        conversion(16, 8),
        mcq(t`Converta $(17)_8$ para hexadecimal.`, ['$(F)_{16}$', '$(17)_{16}$', '$(E)_{16}$', '$(10)_{16}$'], 0, t`$(17)_8=(001111)_2=(1111)_2=(F)_{16}$.`),
        mcq(t`Converta $(20)_{16}$ para octal.`, ['$(40)_8$', '$(20)_8$', '$(32)_8$', '$(50)_8$'], 0, t`$(20)_{16}=(00100000)_2=(000\,100\,000)_2=(40)_8$.`),
      ] },
    ] },
    { id: 'dg-num-cod', title: 'Códigos BCD, Gray e ASCII', parts: [
      { card: { title: 'BCD 8421', body: t`Em BCD 8421, cada algarismo decimal recebe seu próprio grupo de quatro bits com pesos $8$, $4$, $2$, $1$. Exemplo: $39$ vira $0011\ 1001$. Os grupos de 1010 a 1111 não representam algarismos decimais válidos em BCD 8421.`, visual: baseLab() }, exercises: [
        mcq('Quantos bits codificam cada algarismo decimal em BCD 8421?', ['4', '3', '7', '8'], 0, 'Cada algarismo de 0 a 9 usa um grupo de quatro bits.'),
        mcq('Qual é o BCD 8421 do algarismo 9?', ['1001', '1010', '1111', '0111'], 0, t`$9=8+1$, portanto o grupo é 1001.`),
        adjust(9, 'Ajuste o valor representado pelo grupo BCD 1001.', t`$1001$ tem pesos ativos $8+1=9$.`),
        tf('O grupo 1010 é um algarismo BCD 8421 válido.', false, '1010 vale 10 em binário; BCD 8421 só aceita grupos de 0000 a 1001.'),
        gen((rng) => { const a = randInt(rng, 1, 9); const b = randInt(rng, 0, 9); return num(t`Qual número decimal corresponde ao BCD 8421 ${bits(a, 4)} ${bits(b, 4)}?`, 10 * a + b, t`Os grupos representam os algarismos $${a}$ e $${b}$; juntos formam $${10 * a + b}$.`); }),
        mcq('Qual número decimal é representado pelo BCD 0101 0010?', ['52', '82', '25', '50'], 0, 'Os grupos 0101 e 0010 representam os algarismos 5 e 2, respectivamente.'),
        tf('O BCD de 12 é igual à representação binária comum de 12 com 8 bits.', false, t`BCD: $0001\ 0010$; binário comum: $00001100$.`),
      ] },
      { card: { title: 'Gray e ASCII', body: t`No código Gray binário refletido, valores consecutivos diferem em um único bit. Para converter binário em Gray, copie o primeiro bit e faça XOR entre cada par de bits binários adjacentes. Para voltar, copie o primeiro bit Gray e faça XOR do bit binário anterior com o próximo Gray. ASCII básico usa 7 bits: por exemplo, A vale 65 decimal e a vale 97.` }, exercises: [
        mcq('Em Gray refletido, quantos bits mudam entre valores consecutivos?', ['1', '2', '3', 'Todos'], 0, 'A propriedade do código Gray refletido é a mudança de exatamente um bit entre valores consecutivos.'),
        tf('No ASCII básico, A e a são caracteres distintos com códigos diferentes.', true, 'A vale 65 decimal; a vale 97 decimal.'),
        mcq(t`Converta binário 101 para Gray refletido.`, ['111', '101', '110', '100'], 0, 'Copie o primeiro 1; depois 1 XOR 0 = 1 e 0 XOR 1 = 1: Gray 111.'),
        mcq(t`Converta Gray 111 para binário.`, ['101', '111', '110', '100'], 0, 'Copie 1; 1 XOR 1 = 0; depois 0 XOR 1 = 1: binário 101.'),
        gen((rng) => { const n = randInt(rng, 0, 15); const g = n ^ (n >> 1); return mcq(t`Converta o binário de 4 bits ${bits(n, 4)} para Gray refletido.`, [bits(g, 4), ...[1, 2, 3].map((d) => bits(g ^ d, 4))], 0, t`Copie o primeiro bit e aplique XOR aos pares adjacentes: ${bits(n, 4)} resulta em ${bits(g, 4)}.`); }),
        match('Associe os caracteres aos seus valores ASCII decimais.', [['A', '65'], ['a', '97'], ['0', '48']], 'No ASCII, A = 65, a = 97 e o caractere 0 = 48; o código do caractere não é o valor numérico que ele escreve.'),
        num('Quantos códigos distintos existem no ASCII básico de 7 bits?', 128, t`$2^7=128$ códigos, de 0 a 127.`),
      ] },
    ] },
  ],
};

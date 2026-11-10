import React from 'react';
import type { UnitDef } from '../../types';
import { gen, inter, mcq, num, order, tf } from '../../helpers';
import { randInt } from '../../../lib/random';
import { Label } from '../../../components/plot/Plot';

const t = String.raw;
const bin = (n: number) => n.toString(2);
const passos = (lines: string[]) => ({
  name: 'stepper',
  props: {
    steps: lines.length,
    view: { xMin: 0, xMax: 10, yMin: 0, yMax: 3 },
    render: (k: number) => <Label x={5} y={1.5} text={`Etapa ${k + 1}`} anchor="middle" size={20} />,
    info: (k: number) => lines[k],
  },
});
const marcador = (prompt: string, target: number, min: number, max: number, explain: string) =>
  inter(prompt, 'numberline', { min, max, step: 1, value: min }, (v: number) => v === target, `$${target}$`, explain);

export const aritBinaria: UnitDef = {
  id: 'dg-arit', title: 'Aritmética binária', icon: '➕',
  subtitle: 'Operações, complemento de 2 e overflow',
  source: 'Eletrônica Digital · Unidade 2 — Aritmética Binária',
  guide: t`Some e subtraia da direita para a esquerda. Em base 2, $1+1=10_2$ e um empréstimo vale $10_2$ na coluna. Em $n$ bits, o complemento de 2 inverte os bits e soma 1; os valores com sinal vão de $-2^{n-1}$ a $2^{n-1}-1$. Na soma com sinal, operandos de mesmo sinal e resultado de sinal oposto indicam overflow. Multiplique por produtos parciais deslocados; na divisão inteira, dividendo = divisor × quociente + resto.`,
  lessons: [
    { id: 'dg-arit-soma', title: 'Adição binária', parts: [
      { card: { title: 'Bits e vai-um', body: t`Some da direita para a esquerda. $0+0=0$, $0+1=1$ e $1+1=10_2$: escreva 0 e leve 1 à próxima coluna. Com transporte de entrada, $1+1+1=11_2$: escreva 1 e leve 1.`, visual: passos([t`Some $(11)_2+(01)_2$ pela direita.`, t`Unidades: $1+1=10_2$; escreva 0 e leve 1.`, t`Próxima coluna: $1+0+1=10_2$; escreva 0 e leve 1.`, t`O transporte final dá $(100)_2$, isto é, $3+1=4$.`]) }, exercises: [
        mcq(t`Quanto é $1+1$ em binário?`, ['$10_2$', '$11_2$', '$1_2$', '$100_2$'], 0, t`Dois em base 2 é $10_2$: escreve-se 0 e leva-se 1.`),
        tf(t`Em $1+1+1$, escreve-se 1 e leva-se 1.`, true, t`$3=11_2$: o bit baixo é 1 e o transporte é 1.`),
        num(t`Calcule $10_2+1_2$. Digite os dígitos binários.`, 11, t`$2+1=3=11_2$.`),
        mcq(t`Na coluna $1+1+1$, qual é o transporte de saída?`, ['$1$', '$0$', '$2$', '$3$'], 0, t`$1+1+1=11_2$, com transporte 1.`),
        marcador(t`Marque na reta decimal o valor do transporte final de $11_2+1_2$, em duas colunas.`, 1, 0, 3, t`$11_2+01_2=100_2$; o bit além das duas colunas é 1.`),
        gen((rng) => { const a = randInt(rng, 1, 7), b = randInt(rng, 1, 7); return num(t`Calcule $(${bin(a)})_2+(${bin(b)})_2$. Digite os dígitos binários.`, Number(bin(a+b)), t`Em decimal, $${a}+${b}=${a+b}$; em binário, $(${bin(a+b)})_2$.`); }),
        num(t`Calcule $111_2+1_2$. Digite os dígitos binários.`, 1000, t`As três colunas propagam o vai-um: $7+1=8=1000_2$.`),
      ] },
      { card: { title: 'Largura e transporte', body: t`Em um registrador de $n$ bits, apenas os $n$ bits inferiores ficam armazenados. O transporte que sai da última coluna informa que uma soma **sem sinal** excedeu $2^n-1$. O resultado completo pode exigir mais um bit.`, example: t`Em 4 bits: $1111_2+0001_2=1\,0000_2$. Guardam-se $0000$ e o transporte é 1.` }, exercises: [
        num(t`Em 4 bits sem sinal, qual o maior valor decimal?`, 15, t`$1111_2=8+4+2+1=15$.`),
        tf(t`Em 4 bits sem sinal, $1111_2+1_2$ gera transporte final.`, true, t`$15+1=16=10000_2$; o quinto bit é o transporte.`),
        mcq(t`Que 4 bits ficam em $1110_2+0011_2$?`, ['$0001$', '$10001$', '$1111$', '$0011$'], 0, t`$14+3=17=10001_2$; retêm-se os quatro bits baixos: $0001$.`),
        num(t`Qual é o transporte final de $1000_2+0111_2$ em 4 bits?`, 0, t`$8+7=15=1111_2$ cabe em quatro bits, sem transporte.`),
        gen((rng) => { const a = randInt(rng, 8, 15), b = randInt(rng, 8, 15); return num(t`Some $(${bin(a)})_2+(${bin(b)})_2$ sem limitar a largura. Digite os dígitos binários.`, Number(bin(a+b)), t`$${a}+${b}=${a+b}=(${bin(a+b)})_2$.`); }),
        order('Ordene os passos para somar em 4 bits.', ['Somar da direita para a esquerda', 'Propagar os transportes', 'Guardar os quatro bits baixos', 'Verificar o transporte final'], 'Cada transporte entra na coluna seguinte; depois separam-se os bits guardados e o transporte final.'),
        mcq(t`Em 4 bits sem sinal, $1010_2+1001_2$ produz quais bits e transporte?`, ['$0011$ e transporte 1', '$0011$ e transporte 0', '$1011$ e transporte 1', '$1111$ e transporte 0'], 0, t`$10+9=19=10011_2$; os quatro bits baixos são $0011$ e sai 1.`),
      ] },
    ] },
    { id: 'dg-arit-sub', title: 'Subtração binária', parts: [
      { card: { title: 'Emprestar em base 2', body: t`Subtraia da direita para a esquerda. Para $0-1$, empreste 1 da coluna à esquerda: ele vale $10_2$ na coluna atual, e $10_2-1=1$. A coluna que emprestou diminui em 1.`, visual: passos([t`Calcule $110_2-011_2$.`, t`Unidades: $0-1$ pede empréstimo; $10_2-1=1$.`, t`Na coluna dos dois, o 1 virou 0; empreste do 1 à esquerda: $10_2-1=1$.`, t`Na coluna dos quatro resta 0: resultado $011_2$, pois $6-3=3$.`]) }, exercises: [
        mcq(t`Quanto vale $10_2-1_2$?`, ['$1_2$', '$0_2$', '$10_2$', '$11_2$'], 0, t`$10_2$ representa 2; $2-1=1$.`),
        tf('Ao emprestar 1 da coluna vizinha, a coluna atual recebe 2 unidades de seu próprio peso.', true, t`Cada coluna vale o dobro da coluna à direita; por isso recebe $10_2$ unidades.`),
        num(t`Calcule $11_2-1_2$. Digite os dígitos binários.`, 10, t`$3-1=2=10_2$.`),
        num(t`Calcule $100_2-1_2$. Digite os dígitos binários.`, 11, t`O empréstimo atravessa a coluna zero: $4-1=3=11_2$.`),
        marcador(t`Em $110_2-011_2$, marque o resultado em decimal.`, 3, 0, 7, t`$110_2=6$ e $011_2=3$; logo $6-3=3$.`),
        gen((rng) => { const a = randInt(rng, 5, 15), b = randInt(rng, 1, a-1); return num(t`Calcule $(${bin(a)})_2-(${bin(b)})_2$. Digite os dígitos binários.`, Number(bin(a-b)), t`$${a}-${b}=${a-b}=(${bin(a-b)})_2$.`); }),
        num(t`Calcule $10000_2-11_2$. Digite os dígitos binários.`, 1101, t`$16-3=13=1101_2$; o empréstimo se propaga pelos zeros.`),
      ] },
      { card: { title: 'Subtração por complemento', body: t`Para $A-B$ em $n$ bits, inverta os $n$ bits de $B$, some 1 e depois some a $A$. Descarte apenas o transporte além dos $n$ bits. A interpretação depende de os operandos serem sem sinal ou em complemento de 2.`, example: t`Em 4 bits, $1100-1001$: complemento de $1001$ é $0111$; $1100+0111=1\,0011$. Retendo 4 bits, $0011=3$.` }, exercises: [
        mcq(t`Qual o complemento de 2 de $0011$ em 4 bits?`, ['$1101$', '$1100$', '$1011$', '$0100$'], 0, t`Inverta $0011$ para $1100$ e some 1: $1101$.`),
        num(t`Em $1100_2+0111_2=10011_2$, quantos bits ficam ao reter 4 bits?`, 4, t`Retêm-se os quatro bits baixos $0011$ e descarta-se o transporte.`),
        tf(t`O complemento de 2 depende da largura escolhida.`, true, t`Por exemplo, $3$ é $0011$ em 4 bits e $00000011$ em 8; seus complementos têm larguras diferentes.`),
        mcq(t`Em 4 bits, $0110_2-0010_2$ por complemento produz…`, ['$0100$', '$1000$', '$0011$', '$1110$'], 0, t`O complemento de $0010$ é $1110$; $0110+1110=10100$, retendo $0100$.`),
        gen((rng) => { const a = randInt(rng, 4, 15), b = randInt(rng, 1, a-1); return num(t`Calcule $(${bin(a)})_2-(${bin(b)})_2$ e digite os dígitos binários.`, Number(bin(a-b)), t`A diferença é $${a}-${b}=${a-b}=(${bin(a-b)})_2$; a soma com o complemento dá os mesmos quatro bits.`); }),
        order('Ordene a subtração por complemento de 2.', ['Fixar a largura', 'Inverter os bits do subtraendo', 'Somar 1 ao complemento', 'Somar ao minuendo e reter a largura'], 'O complemento é calculado na largura fixada; a soma final conserva somente os bits dessa largura.'),
        mcq(t`Em 4 bits sem sinal, $0010-0101$ deixa $1101$. Como interpretar a diferença matemática?`, ['$-3$, fora da faixa sem sinal', '$13$, sem perda', '$3$', '$-13$'], 0, t`$2-5=-3$; $1101$ representa $-3$ em complemento de 2, mas não é uma resposta sem sinal válida.`),
      ] },
    ] },
    { id: 'dg-arit-c2', title: 'Complemento de 2 e números com sinal', parts: [
      { card: { title: 'Representar valores com sinal', body: t`Em complemento de 2 com $n$ bits, o bit mais significativo tem peso $-2^{n-1}$ e os demais têm pesos positivos. A faixa é $-2^{n-1}$ até $2^{n-1}-1$. Para obter o oposto, inverta os bits e some 1, mantendo a largura.`, visual: passos([t`Represente $-5$ em 4 bits.`, t`$+5=0101_2$. Inverta: $1010_2$.`, t`Some 1: $1011_2$.`, t`Confira pelos pesos: $-8+2+1=-5$.`]) }, exercises: [
        num(t`Em 4 bits com sinal, qual o peso decimal do bit mais à esquerda?`, -8, t`O peso é $-2^3=-8$.`),
        mcq(t`Em 4 bits com sinal, $1111$ representa…`, ['$-1$', '$15$', '$-7$', '$1$'], 0, t`$-8+4+2+1=-1$.`),
        num(t`Qual o menor valor decimal em complemento de 2 com 4 bits?`, -8, t`A faixa é de $-2^3=-8$ a $2^3-1=7$.`),
        tf(t`Em 4 bits com sinal, $1000$ representa $-8$.`, true, t`O único bit ligado tem peso $-8$.`),
        marcador(t`Marque em decimal o valor de $1011$ em complemento de 2 com 4 bits.`, -5, -8, 7, t`$-8+2+1=-5$.`),
        gen((rng) => { const x = randInt(rng, 1, 7), bits = bin(16-x).padStart(4, '0'); return mcq(t`Qual é o valor decimal de $${bits}$ em complemento de 2 com 4 bits?`, [`$-${x}$`, `$${16-x}$`, `$${x}$`, `$-${x+8}$`], 0, t`O padrão vale $${16-x}-16=-${x}$ em complemento de 2 de 4 bits.`); }),
        mcq(t`Qual padrão representa $-6$ em 4 bits?`, ['$1010$', '$0110$', '$1001$', '$1110$'], 0, t`$+6=0110$; inverta para $1001$ e some 1: $1010$.`),
      ] },
      { card: { title: 'Overflow com sinal', body: t`A soma com sinal tem overflow quando o resultado matemático sai da faixa representável. Na soma de dois operandos de mesmo sinal, um resultado com sinal oposto indica overflow. Transporte final sozinho não decide overflow com sinal.`, example: t`Em 4 bits, $0111+0001=1000$: $7+1=8$ está fora de $[-8,\,7]$, embora não haja transporte final.` }, exercises: [
        tf(t`Em 4 bits com sinal, $7+1$ causa overflow.`, true, t`$8$ excede o máximo $7$; os bits $1000$ seriam interpretados como $-8$.`),
        mcq('Qual soma com sinal em 4 bits causa overflow?', ['$7+2$', '$3+2$', '$-3+2$', '$-2-1$'], 0, t`$7+2=9$ excede 7; as demais somas pertencem à faixa de $-8$ a $7$.`),
        tf('Somar dois números de sinais opostos causa overflow em complemento de 2.', false, t`A soma fica entre os operandos, ambos representáveis, portanto cabe na mesma faixa.`),
        mcq(t`Em 4 bits com sinal, $1111+1111=1\,1110$. O que ocorre?`, ['Resultado $-2$, sem overflow', 'Overflow positivo', 'Resultado $14$, com overflow', 'Resultado $0$'], 0, t`$-1-1=-2$, representado por $1110$; o transporte final é descartado e não há overflow.`),
        gen((rng) => { const a = randInt(rng, 4, 7), b = randInt(rng, 1, 3); const over = a+b > 7; return tf(t`Em 4 bits com sinal, $${a}+${b}$ causa overflow.`, over, t`$${a}+${b}=${a+b}$; a faixa é de $-8$ a $7$, portanto ${over ? 'há' : 'não há'} overflow.`); }),
        num(t`Em 4 bits com sinal, qual é o resultado matemático decimal de $(-6)+(-4)$?`, -10, t`$-6-4=-10$, abaixo de $-8$: ocorre overflow no registrador.`),
        mcq(t`Em 4 bits com sinal, $1001+1101=0110$ após descartar o transporte. Por quê?`, ['Há overflow: $-7-3=-10$ não cabe', 'Não há overflow: $6$ cabe', 'Há overflow porque os sinais são opostos', 'O resultado matemático é $6$'], 0, t`$1001=-7$ e $1101=-3$; $-10$ não cabe. O padrão $0110$ tem sinal incorreto.`),
      ] },
    ] },
    { id: 'dg-arit-mult', title: 'Multiplicação e divisão', parts: [
      { card: { title: 'Produtos parciais', body: t`Cada bit do multiplicador produz uma linha: bit 0 dá zero; bit 1 copia o multiplicando. Desloque cada linha uma posição à esquerda por coluna e some. Deslocar um inteiro sem sinal uma posição à esquerda multiplica por 2, se nenhum bit for perdido.`, visual: passos([t`Calcule $101_2\times11_2$.`, t`O bit das unidades é 1: primeiro parcial $101_2$.`, t`O próximo bit é 1: desloque para obter $1010_2$.`, t`Some: $0101_2+1010_2=1111_2$, isto é, $5\times3=15$.`]) }, exercises: [
        num(t`Quanto é $1_2\times 0_2$?`, 0, t`Qualquer bit multiplicado por zero é zero.`),
        tf(t`Multiplicar $101_2$ por $10_2$ dá $1010_2$.`, true, t`Multiplicar por 2 desloca o padrão uma posição à esquerda: $5\times2=10$.`),
        num(t`Calcule $11_2\times 10_2$. Digite os dígitos binários.`, 110, t`$3\times2=6=110_2$.`),
        marcador(t`Marque em decimal o produto $101_2\times11_2$.`, 15, 0, 16, t`$101_2=5$ e $11_2=3$; $5\times3=15$.`),
        mcq(t`Qual produto parcial corresponde ao bit de peso 4 em $101_2\times101_2$?`, ['$10100_2$', '$101_2$', '$1010_2$', '$0_2$'], 0, t`O bit é 1 e está duas posições à esquerda: $101_2$ deslocado duas posições é $10100_2$.`),
        gen((rng) => { const a = randInt(rng, 2, 7), b = randInt(rng, 2, 5); return num(t`Calcule $(${bin(a)})_2\times(${bin(b)})_2$. Digite os dígitos binários.`, Number(bin(a*b)), t`$${a}\times${b}=${a*b}=(${bin(a*b)})_2$.`); }),
        num(t`Calcule $101_2\times101_2$. Digite os dígitos binários.`, 11001, t`$101_2+10100_2=11001_2$; em decimal, $5\times5=25$.`),
      ] },
      { card: { title: 'Divisão e resto', body: t`Na divisão inteira, examine o dividendo da esquerda para a direita: quando o divisor cabe no trecho atual, escreva 1 no quociente e subtraia; quando não cabe, escreva 0. Baixe o próximo bit. Confira: dividendo = divisor × quociente + resto, com $0\le r<divisor$.`, example: t`$1101_2\div 11_2$: $13=3\times4+1$, logo quociente $100_2$ e resto $1_2$.` }, exercises: [
        num(t`Qual o quociente de $110_2\div10_2$? Digite os dígitos binários.`, 11, t`$6\div2=3=11_2$, sem resto.`),
        tf(t`Na divisão inteira de $1101_2$ por $11_2$, o resto é $1_2$.`, true, t`$13=3\times4+1$, então o resto é 1.`),
        mcq(t`Em $1011_2\div 10_2$, qual é o quociente inteiro e o resto?`, ['$101_2$ e $1_2$', '$110_2$ e $0_2$', '$101_2$ e $10_2$', '$11_2$ e $1_2$'], 0, t`$11=2\times5+1$; $5=101_2$ e o resto é 1.`),
        num(t`Qual o resto decimal de $1010_2\div 11_2$?`, 1, t`$10=3\times3+1$; o resto é 1.`),
        gen((rng) => { const d = randInt(rng, 2, 5), q = randInt(rng, 2, 7), r = randInt(rng, 0, d-1), a = d*q+r; return num(t`Na divisão inteira $(${bin(a)})_2\div(${bin(d)})_2$, qual o quociente? Digite os dígitos binários.`, Number(bin(q)), t`$${a}=${d}\times${q}+${r}$, com resto menor que o divisor. Quociente $(${bin(q)})_2$.`); }),
        order('Ordene uma etapa da divisão longa binária.', ['Comparar o trecho atual com o divisor', 'Escrever o bit do quociente', 'Subtrair o divisor se ele couber', 'Baixar o próximo bit do dividendo'], 'A comparação determina o bit; subtraia quando ele for 1 e continue com o próximo bit.'),
        mcq(t`Na divisão inteira $1011001_2\div111_2$, qual é o resultado?`, ['quociente $1100_2$, resto $101_2$', 'quociente $1101_2$, resto $0_2$', 'quociente $1011_2$, resto $1_2$', 'quociente $1100_2$, resto $111_2$'], 0, t`$1011001_2=89$ e $111_2=7$; $89=7\times12+5$. Logo $12=1100_2$ e $5=101_2$.`),
      ] },
    ] },
  ],
};

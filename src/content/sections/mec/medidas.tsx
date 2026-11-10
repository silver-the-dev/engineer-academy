import React from 'react';
import type { UnitDef } from '../../types';
import { gen, inter, mcq, num, plot, tf } from '../../helpers';
import { randInt } from '../../../lib/random';
import { Pt, Seg } from '../../../components/plot/Plot';
import { C } from '../../../theme';

const t = String.raw;

// A single adjustable quantity connects the visual scale to its equivalent expression.
const escala = (label: string, factor: number, unit: string) => plot({
  view: { xMin: 0, xMax: 10, yMin: -1, yMax: 2 },
  params: [{ key: 'x', label, min: 1, max: 9, step: 1, value: 1, color: C.p2 }],
  render: ({ p }: any) => <><Seg x1={0} y1={0} x2={p.x} y2={0} color={C.p2} width={4} /><Pt x={p.x} y={0} color={C.gold} /></>,
  info: ({ p }: any) => t`${p.x} ${label} corresponde a $${p.x * factor}\,\text{${unit}}$`,
});
const ajuste = (label: string, factor: number, unit: string, target: number) => inter(
  t`Ajuste ${label} para obter $${target * factor}\,\text{${unit}}$ na leitura.`,
  'plot', escala(label, factor, unit).props, (v) => v.p.x === target,
  t`Ajuste para $${target}$ ${label}.`, t`Como cada ${label} corresponde a $${factor}\,\text{${unit}}$, dividimos $${target * factor}$ por $${factor}$ e obtemos $${target}$.`,
);

export const medidas: UnitDef = {
  id: 'm-med', title: 'Medidas e unidades', icon: '📏',
  subtitle: 'SI, conversões e precisão das medidas',
  source: 'Física Aplicada I · Aula 1 — Medição',
  guide: t`No SI, comprimento, massa e tempo têm unidades $\text{m}$, $\text{kg}$ e $\text{s}$. Use fatores iguais a 1 para converter e eleve o fator à potência correspondente à área ou ao volume. $1\,\text{m/s}=3,6\,\text{km/h}$. Em $a\times10^n$, $1\le a<10$. Em produtos, limite os algarismos significativos; em somas, limite as casas decimais.`,
  lessons: [
    { id: 'm-med-si', title: 'Grandezas e o SI', parts: [
      { card: { title: 'Medir e comparar', body: t`Medir é comparar uma grandeza com uma unidade padrão. O SI tem sete grandezas de base: comprimento (metro, m), massa (quilograma, kg), tempo (segundo, s), corrente elétrica (ampere, A), temperatura termodinâmica (kelvin, K), quantidade de matéria (mol) e intensidade luminosa (candela, cd).`, visual: escala('m', 100, 'cm'), tip: 'Mude o comprimento e observe a mesma medida em centímetros.' }, exercises: [
        mcq('Qual é a unidade SI de comprimento?', ['metro', 'segundo', 'quilograma', 'litro'], 0, 'O metro é a unidade de base de comprimento.'),
        mcq('Qual grandeza tem o segundo como unidade SI?', ['tempo', 'massa', 'comprimento', 'corrente elétrica'], 0, 'O segundo mede intervalos de tempo.'),
        tf('O quilograma é a unidade SI de massa.', true, 'A grandeza massa tem o quilograma como unidade de base no SI.'),
        mcq('Qual destas é uma grandeza de base do SI?', ['corrente elétrica', 'velocidade', 'área', 'volume'], 0, 'Corrente elétrica é de base; as outras são derivadas.'),
        gen((rng) => { const n = randInt(rng, 2, 9); return num(t`Uma régua mede $${n}\,\text{m}$. Qual a leitura em cm, sem casas decimais?`, n * 100, t`Cada metro tem $100\,\text{cm}$: $${n}\cdot100=${n * 100}\,\text{cm}$.`, { unit: 'cm', tol: 1e-6 }); }),
        ajuste('m', 100, 'cm', 4),
        mcq('Uma medida de comprimento precisa de quais elementos?', ['valor numérico e unidade', 'apenas o número', 'apenas a unidade', 'massa e tempo'], 0, 'O número informa quantas vezes a unidade cabe na grandeza medida.'),
      ] },
      { card: { title: 'Grandezas derivadas', body: t`Grandezas derivadas combinam grandezas de base. Velocidade é comprimento dividido por tempo: $v=\Delta x/\Delta t$, em $\text{m/s}$. A área usa $\text{m}^2$ e a força, $\text{kg}\,\text{m/s}^2$. Dimensões verificam se os termos de uma equação são compatíveis.`, visual: escala('s', 2, 'm'), tip: t`Nesta escala, a distância cresce $2\,\text{m}$ a cada segundo.` }, exercises: [
        mcq('Qual é uma grandeza derivada?', ['velocidade', 'tempo', 'massa', 'comprimento'], 0, 'Velocidade combina comprimento e tempo.'),
        mcq(t`A unidade SI de área é…`, [t`$\text{m}^2$`, t`$\text{m}$`, t`$\text{m/s}$`, t`$\text{s}^2$`], 0, t`Área é comprimento vezes comprimento: $\text{m}^2$.`),
        num(t`Um móvel percorre $12\,\text{m}$ em $3\,\text{s}$. Qual a velocidade média em m/s, sem casas decimais?`, 4, t`$v=12/3=4\,\text{m/s}$.`, { unit: 'm/s', tol: 1e-6 }),
        gen((rng) => { const v = randInt(rng, 2, 8); const s = randInt(rng, 2, 6); return num(t`Um corpo percorre $${v * s}\,\text{m}$ em $${s}\,\text{s}$. Qual a velocidade média em m/s, sem casas decimais?`, v, t`$v=${v * s}/${s}=${v}\,\text{m/s}$.`, { unit: 'm/s', tol: 1e-6 }); }),
        tf(t`É dimensionalmente coerente somar $3\,\text{m}$ a $2\,\text{s}$.`, false, 'Comprimento e tempo têm dimensões diferentes e não podem ser somados.'),
        mcq(t`Se $x=vt$, qual a dimensão de $v$?`, [t`$L/T$`, '$L T$', '$T/L$', '$L$'], 0, t`De $v=x/t$, dividimos comprimento por tempo: $L/T$.`),
        mcq(t`Qual expressão pode representar uma distância, se $v$ é velocidade e $t$ é tempo?`, ['$vt$', '$v+t$', '$v/t$', '$t/v$'], 0, t`$[vt]=(L/T)T=L$; as demais não têm dimensão de comprimento.`),
      ] },
    ] },
    { id: 'm-med-conv', title: 'Conversão de unidades', parts: [
      { card: { title: 'Prefixos e fatores', body: t`Prefixos multiplicam a unidade: quilo ($\text{k}$) é $10^3$, centi ($\text{c}$) é $10^{-2}$, mili ($\text{m}$) é $10^{-3}$ e micro ($\mu$) é $10^{-6}$. Um fator de conversão é uma razão igual a 1, como $1000\,\text{m}/1\,\text{km}$. Cancele as unidades em cadeia.`, visual: escala('km', 1000, 'm') }, exercises: [
        mcq('O prefixo quilo representa qual fator?', ['$10^3$', '$10^{-3}$', '$10^2$', '$10^{-6}$'], 0, t`Quilo significa $10^3=1000$.`),
        mcq('O prefixo mili representa qual fator?', ['$10^{-3}$', '$10^3$', '$10^{-2}$', '$10^{-6}$'], 0, t`Mili significa um milésimo: $10^{-3}$.`),
        num(t`Converta $3\,\text{km}$ para m, sem casas decimais.`, 3000, t`$3\,\text{km}\cdot1000\,\text{m}/\text{km}=3000\,\text{m}$.`, { unit: 'm', tol: 1e-6 }),
        gen((rng) => { const n = randInt(rng, 2, 9); return num(t`Converta $${n}\,\text{cm}$ para mm, sem casas decimais.`, n * 10, t`$1\,\text{cm}=10\,\text{mm}$; logo $${n}\cdot10=${n * 10}\,\text{mm}$.`, { unit: 'mm', tol: 1e-6 }); }),
        ajuste('km', 1000, 'm', 5),
        num(t`Converta $0,8\,\text{km}$ para cm, sem casas decimais.`, 80000, t`$0,8\cdot1000\cdot100=80000\,\text{cm}$.`, { unit: 'cm', tol: 1e-6 }),
        mcq(t`Para converter $\text{km/h}$ em $\text{m/s}$, multiplique por…`, [t`$\frac{1000}{3600}$`, t`$\frac{3600}{1000}$`, '$1000$', '$3600$'], 0, t`Troque km por $1000\,\text{m}$ e h por $3600\,\text{s}$.`),
      ] },
      { card: { title: 'Velocidade, área e volume', body: t`Como $1\,\text{km}=1000\,\text{m}$ e $1\,\text{h}=3600\,\text{s}$, divida km/h por $3,6$ para obter m/s. Para áreas e volumes, eleve o fator linear ao quadrado ou ao cubo: $1\,\text{cm}^2=10^{-4}\,\text{m}^2$ e $1\,\text{cm}^3=10^{-6}\,\text{m}^3$.` }, exercises: [
        num(t`Converta $72\,\text{km/h}$ para m/s, sem casas decimais.`, 20, t`$72/3,6=20\,\text{m/s}$.`, { unit: 'm/s', tol: 1e-6 }),
        num(t`Converta $5\,\text{m/s}$ para km/h, sem casas decimais.`, 18, t`$5\cdot3,6=18\,\text{km/h}$.`, { unit: 'km/h', tol: 1e-6 }),
        gen((rng) => { const n = randInt(rng, 2, 9); return num(t`Converta $${n * 36}\,\text{km/h}$ para m/s, sem casas decimais.`, n * 10, t`$${n * 36}/3,6=${n * 10}\,\text{m/s}$.`, { unit: 'm/s', tol: 1e-6 }); }),
        mcq(t`Quanto vale $1\,\text{m}^2$ em $\text{cm}^2$?`, ['$10000$', '$100$', '$1000$', '$1000000$'], 0, t`$(100\,\text{cm})^2=10000\,\text{cm}^2$.`),
        num(t`Converta $2\,\text{m}^3$ para litros, sem casas decimais. Use $1\,\text{L}=1\,\text{dm}^3$.`, 2000, t`$1\,\text{m}^3=(10\,\text{dm})^3=1000\,\text{L}$; portanto são $2000\,\text{L}$.`, { unit: 'L', tol: 1e-6 }),
        tf(t`$60\,\text{mm}^2=0,00006\,\text{m}^2$.`, true, t`$60(10^{-3})^2=60\cdot10^{-6}=0,00006\,\text{m}^2$.`),
        num(t`Uma placa mede $20\,\text{cm}$ por $30\,\text{cm}$. Qual sua área em m², com duas casas decimais?`, 0.06, t`$0,20\cdot0,30=0,06\,\text{m}^2$.`, { unit: 'm²', tol: 0.005 }),
      ] },
    ] },
    { id: 'm-med-nc', title: 'Notação científica e ordem de grandeza', parts: [
      { card: { title: 'Potências de dez', body: t`Na notação científica, escrevemos $a\times10^n$, com $1\le |a|<10$ e $n$ inteiro. Mover a vírgula para a esquerda aumenta o expoente; para a direita, diminui. Por exemplo, $4500=4,5\times10^3$ e $0,0045=4,5\times10^{-3}$.`, visual: escala('km', 1000, 'm') }, exercises: [
        mcq(t`Qual é a forma científica de $4500$?`, ['$4{,}5\\times10^3$', '$45\\times10^2$', '$4{,}5\\times10^{-3}$', '$0{,}45\\times10^4$'], 0, t`$4,5\cdot1000=4500$ e $4,5$ está entre 1 e 10.`),
        mcq(t`Qual é a forma científica de $0,0045$?`, ['$4{,}5\\times10^{-3}$', '$4{,}5\\times10^3$', '$45\\times10^{-4}$', '$0{,}45\\times10^{-2}$'], 0, t`$4,5/1000=0,0045$.`),
        num(t`Qual é o expoente de 10 em $72000=7,2\times10^n$? Digite o inteiro.`, 4, t`A vírgula anda quatro casas: $n=4$.`, { tol: 1e-6 }),
        gen((rng) => { const n = randInt(rng, 2, 6); return num(t`Qual o expoente inteiro $n$ em $10^{${n}}=1\times10^n$?`, n, t`As potências são iguais: $n=${n}$.`, { tol: 1e-6 }); }),
        ajuste('km', 1000, 'm', 3),
        num(t`Quanto é $(2\times10^3)(3\times10^2)$? Dê o valor inteiro.`, 600000, t`Multiplique os coeficientes e some os expoentes: $6\times10^5=600000$.`, { tol: 1e-6 }),
        mcq(t`Qual é a forma científica de $(8\times10^4)/(2\times10^2)$?`, ['$4\\times10^2$', '$4\\times10^6$', '$6\\times10^2$', '$4\\times10^{-2}$'], 0, t`Divida os coeficientes e subtraia os expoentes: $4\times10^{4-2}$.`),
      ] },
      { card: { title: 'Estimando a ordem de grandeza', body: t`Aqui, ordem de grandeza é a potência de 10 mais próxima em escala logarítmica. Para $a\times10^n$, compare $a$ com $\sqrt{10}\approx3,16$: abaixo fica $10^n$; acima fica $10^{n+1}$. No empate as duas potências estão igualmente próximas nessa escala.`, visual: escala('milhares', 1000, 'm') }, exercises: [
        mcq(t`A ordem de grandeza de $2\times10^3$ é…`, ['$10^3$', '$10^2$', '$10^4$', '$2\\times10^3$'], 0, t`Como $2<\sqrt{10}$, a potência mais próxima é $10^3$.`),
        mcq(t`A ordem de grandeza de $8\times10^3$ é…`, ['$10^4$', '$10^3$', '$10^2$', '$8\\times10^3$'], 0, t`Como $8>\sqrt{10}$, subimos para $10^4$.`),
        tf(t`Nesta convenção, a ordem de grandeza de $0,002$ é $10^{-3}$.`, true, t`$0,002=2\times10^{-3}$ e $2<\sqrt{10}$.`),
        gen((rng) => { const n = randInt(rng, 2, 6); return num(t`A ordem de grandeza de $2\times10^{${n}}$ é $10^k$. Qual é o inteiro $k$?`, n, t`Como $2<\sqrt{10}$, $k=${n}$.`, { tol: 1e-6 }); }),
        ajuste('milhares', 1000, 'm', 6),
        mcq(t`A ordem de grandeza de $0,0008$ é…`, ['$10^{-3}$', '$10^{-4}$', '$10^3$', '$10^{-5}$'], 0, t`$0,0008=8\times10^{-4}$ e $8>\sqrt{10}$, então usamos $10^{-3}$.`),
        num(t`Uma distância é $4\times10^5\,\text{m}$. Sua ordem de grandeza é $10^k\,\text{m}$. Qual o inteiro $k$?`, 6, t`Como $4>\sqrt{10}$, a ordem é $10^6\,\text{m}$ e $k=6$.`, { tol: 1e-6 }),
      ] },
    ] },
    { id: 'm-med-alg', title: 'Algarismos significativos', parts: [
      { card: { title: 'Contar algarismos', body: t`Algarismos significativos expressam a resolução informada de uma medida. Zeros à esquerda não contam; zeros entre dígitos não nulos contam; zeros finais após a vírgula contam. Em inteiros terminados em zero, use notação científica para evitar ambiguidade: $3,00\times10^3$ tem três algarismos.`, visual: escala('m', 100, 'cm'), tip: 'Converter a unidade não aumenta a precisão da medida.' }, exercises: [
        num(t`Quantos algarismos significativos há em $0,00356$? Digite o inteiro.`, 3, t`Os zeros iniciais apenas localizam a vírgula; contam 3, 5 e 6.`, { tol: 1e-6 }),
        num(t`Quantos algarismos significativos há em $2,040$? Digite o inteiro.`, 4, t`O zero entre 2 e 4 e o zero final após a vírgula contam: são quatro.`, { tol: 1e-6 }),
        mcq(t`Qual escrita expressa três algarismos significativos para 3000?`, ['$3{,}00\\times10^3$', '$3\\times10^3$', '$3{,}0\\times10^3$', '$3{,}000\\times10^3$'], 0, t`O coeficiente $3,00$ contém três algarismos significativos.`),
        gen((rng) => { const n = randInt(rng, 1, 9); return num(t`Quantos algarismos significativos há em $${n},00$? Digite o inteiro.`, 3, t`O dígito $${n}$ e os dois zeros finais decimais contam: três.`, { tol: 1e-6 }); }),
        ajuste('m', 100, 'cm', 2),
        tf(t`$1,20\,\text{m}$ e $120\,\text{cm}$ têm necessariamente a mesma precisão explícita na escrita.`, false, t`$1,20$ explicita três algarismos; o zero final de $120$ pode ser ambíguo. Use $1,20\times10^2\,\text{cm}$.`),
        mcq(t`Qual número tem dois algarismos significativos?`, ['$0{,}040$', '$0{,}004$', '$4{,}000$', '$4{,}04$'], 0, t`Em $0,040$, o 4 e o zero final decimal são significativos.`),
      ] },
      { card: { title: 'Arredondar e calcular', body: t`Para arredondar, adotamos aqui: dígito descartado menor que 5 mantém o anterior; 5 ou mais aumenta-o. Em multiplicação e divisão, o resultado tem tantos algarismos significativos quanto o dado menos preciso. Em soma e subtração, conserve a menor quantidade de casas decimais. Fatores de conversão definidos são exatos.`, visual: escala('m', 100, 'cm') }, exercises: [
        mcq(t`Arredonde $2,746$ para três algarismos significativos.`, ['$2{,}75$', '$2{,}74$', '$2{,}7$', '$2{,}746$'], 0, t`Conserve $2,74$ e observe o 6 seguinte: sobe para $2,75$.`),
        mcq(t`Arredonde $1,25$ para dois algarismos significativos pela regra apresentada.`, ['$1{,}3$', '$1{,}2$', '$1{,}25$', '$2$'], 0, t`O dígito descartado é 5, então aumentamos o 2 para 3.`),
        gen((rng) => { const n = randInt(rng, 2, 9); return num(t`Uma medida é $${n},26\,\text{m}$. Converta para cm, sem casas decimais.`, n * 100 + 26, t`$${n},26\cdot100=${n * 100 + 26}\,\text{cm}$; o fator de conversão é exato.`, { unit: 'cm', tol: 1e-6 }); }),
        tf(t`Em produtos, o resultado deve respeitar o menor número de algarismos significativos dos dados medidos.`, true, 'O fator menos preciso limita os algarismos significativos do produto.'),
        mcq(t`Calcule $2,4\times3,12$ e apresente com os algarismos significativos adequados.`, ['$7{,}5$', '$7{,}49$', '$7{,}488$', '$7$'], 0, t`$2,4\cdot3,12=7,488$; com dois algarismos, $7,5$.`),
        mcq(t`Calcule $12,11+0,3$ com as casas decimais adequadas.`, ['$12{,}4$', '$12{,}41$', '$12$', '$12{,}410$'], 0, t`A soma é $12,41$; o dado $0,3$ limita o resultado a uma casa: $12,4$.`),
        mcq(t`Uma área usa lados medidos de $2,0\,\text{m}$ e $3,00\,\text{m}$. Como relatar o produto?`, [t`$6,0\,\text{m}^2$`, t`$6,000\,\text{m}^2$`, t`$6\,\text{m}^2$`, t`$6,00\,\text{m}^2$`], 0, t`O produto é $6$; o lado $2,0$ tem dois algarismos significativos, então escreva $6,0\,\text{m}^2$.`),
      ] },
    ] },
  ],
};

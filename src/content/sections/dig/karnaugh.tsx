import type { UnitDef } from '../../types';
import { gen, inter, mcq, num, table, tf } from '../../helpers';
import { randInt } from '../../../lib/random';
import { circuit, circuitEx, circuitVisual, GATE, IN, OUT } from '../../circuits';
import type { GateType } from '../../../lib/circuit/types';

const t = String.raw;
const line = { min: 0, max: 15, step: 1, value: 0 };
const marker = (prompt: string, n: number, explain: string) =>
  inter(prompt, 'numberline', line, (v: number) => v === n, `$${n}$`, explain);
const lab = { name: 'numberline', props: line };
const map2 = table(['A/B', '0', '1'], [['0', '0', '1'], ['1', '0', '1']]);
const map3 = table(['A/BC', '00', '01', '11', '10'], [['0', '0', '1', '1', '0'], ['1', '0', '1', '1', '0']]);
const map4 = table(['AB/CD', '00', '01', '11', '10'], [['00', '1', '0', '0', '1'], ['01', '0', '0', '0', '0'], ['11', '0', '0', '0', '0'], ['10', '1', '0', '0', '1']]);
const base = () => circuit(IN('A', [2, 1], false, { locked: true }), IN('B', [2, 3], false, { locked: true }), OUT('Y', [5, 2], { locked: true }));
const ready = (kind: GateType) => circuit(base(), GATE(kind, 'g', [2, 1], 2, { locked: true }));
const probe = (kind: GateType) => circuitVisual({ comps: ready(kind), mode: 'view', cols: 7, rows: 5 });
const build = (kind: GateType, vals: number[], name: string, explanation: string) => circuitEx(
  t`Monte a função ${name}: coloque uma porta na grade, com entradas em A e B e saída em Y. A tabela em ordem $00, 01, 10, 11$ deve ser $${vals.join('') }$.`,
  { comps: base(), mode: 'build', cols: 7, rows: 5, palette: [kind] },
  v => v.truth(['A', 'B'], 'Y').join('') === vals.join('') && v.count(kind) === 1,
  `Uma porta ${kind.toUpperCase()} entre as entradas e Y.`, explanation,
  { add: [GATE(kind, 'g', [2, 1], 2)] },
);

export const karnaugh: UnitDef = {
  id: 'dg-karn', title: 'Mapas de Karnaugh', icon: '🗺️',
  subtitle: 'Da tabela-verdade ao circuito simplificado',
  source: 'Eletrônica Digital · Lógica Combinacional — Mapa de Karnaugh',
  guide: t`Um mintermo vale 1 em uma única linha. Em $\Sigma m$, liste os índices das linhas com saída 1, tomando a primeira variável como bit mais significativo. No mapa, use código Gray $00, 01, 11, 10$: vizinhos diferem em um bit, inclusive pelas bordas. Agrupe 1 em retângulos de tamanho potência de 2; conserve apenas os literais constantes. Cubra todos os 1, sem incluir 0; grupos podem se sobrepor. X pode ser usado como 0 ou 1 para simplificar, mas não precisa ser coberto. Implemente a expressão e teste todas as entradas.`,
  lessons: [
    { id: 'dg-karn-min', title: 'Mintermos e formas canônicas', parts: [
      { card: { title: 'Uma linha, um mintermo', body: t`Com ordem $A,B,C$, o índice é o valor binário de $ABC$: $101_2=5$. O mintermo $m_5=A\bar B C$ vale 1 somente nessa linha. Bit 0 gera variável complementada; bit 1 gera variável direta. Arraste o marcador até o índice de outras linhas.`, visual: lab }, exercises: [
        mcq(t`Qual produto representa a linha $AB=01$?`, [t`$\bar A B$`, t`$A\bar B$`, t`$AB$`, t`$\bar A\bar B$`], 0, t`A é 0 e B é 1, portanto $\bar A B$.`),
        num(t`Qual o índice decimal da linha $ABC=101$?`, 5, t`$101_2=4+1=5$.`),
        tf(t`Um mintermo de três variáveis vale 1 em exatamente uma linha.`, true, t`Cada literal fixa um bit; só uma combinação satisfaz os três.`),
        gen(rng => { const n = randInt(rng, 0, 7); return num(t`Qual o índice decimal de $ABC=${n.toString(2).padStart(3, '0')}$?`, n, t`Lendo $ABC$ como binário, o índice é $${n}$.`); }),
        marker(t`Arraste até o índice de $ABC=110$.`, 6, t`$110_2=4+2=6$.`),
        mcq(t`Qual é $m_2$ em $A,B,C$?`, [t`$\bar A B\bar C$`, t`$A\bar B C$`, t`$\bar A\bar B C$`, t`$AB\bar C$`], 0, t`$2=010_2$: apenas B fica direto.`),
        num(t`Quantos mintermos distintos existem para 3 variáveis?`, 8, t`São $2^3=8$ combinações de entrada.`),
      ] },
      { card: { title: 'Soma e produto canônicos', body: t`Na soma de mintermos, $F=\Sigma m(1, 3)$ significa saída 1 nas linhas 1 e 3. Na forma produto de maxtermos, $F=\Pi M(0, 2)$ lista as linhas de saída 0. Para $AB$, as duas expressões descrevem $F=B$.`, visual: map2 }, exercises: [
        mcq(t`$F=\Sigma m(1, 3)$ em duas variáveis é 1 em quais linhas?`, ['1 e 3', '0 e 2', '0 e 3', '1 e 2'], 0, t`A lista após $\Sigma m$ identifica as linhas de saída 1.`),
        tf(t`$\Pi M$ lista os índices das linhas onde a função é 0.`, true, t`Cada maxtermo é zero somente na linha de seu índice.`),
        gen(rng => { const n = randInt(rng, 0, 3); return num(t`Uma função de duas variáveis é 1 só na linha $AB=${n.toString(2).padStart(2, '0')}$. Qual índice aparece em $\Sigma m$?`, n, t`O valor binário da linha é $${n}$.`); }),
        mcq(t`Para $F=\Sigma m(1, 3)$, qual é a lista de zeros?`, ['0 e 2', '1 e 3', '0 e 1', '2 e 3'], 0, t`Das quatro linhas, as não listadas como 1 são 0 e 2.`),
        num(t`Quantos literais há em cada mintermo canônico de 4 variáveis?`, 4, t`Cada variável aparece uma vez, direta ou complementada.`),
        marker(t`Arraste até o índice da linha $ABCD=1001$.`, 9, t`$1001_2=8+1=9$.`),
        mcq(t`Qual função simplificada corresponde a $\Sigma m(1, 3)$ em $A,B$?`, [t`$B$`, t`$A$`, t`$\bar B$`, t`$AB$`], 0, t`Nas linhas 01 e 11, B é 1 e A varia; logo $F=B$.`),
      ] },
    ] },
    { id: 'dg-karn-23', title: 'Mapas de 2 e 3 variáveis', parts: [
      { card: { title: 'Preencha o mapa', body: t`Para duas variáveis, cada célula corresponde a uma linha da tabela. No mapa abaixo os 1 estão em $01$ e $11$: a coluna $B=1$ forma um par, portanto $F=B$.`, visual: map2 }, exercises: [
        num(t`Quantas células tem um mapa de 2 variáveis?`, 4, t`Há $2^2=4$ combinações.`),
        tf(t`No mapa de duas variáveis, células que diferem em um bit são adjacentes.`, true, t`Um único bit muda entre células adjacentes.`),
        mcq(t`No mapa de $A,B$, o par $00$ e $01$ corresponde a:`, [t`$\bar A$`, t`$A$`, t`$B$`, t`$\bar B$`], 0, t`A fica em 0; B varia e desaparece.`),
        gen(rng => { const n = randInt(rng, 0, 1); return num(t`Na linha $A=${n}$, qual índice tem a célula $B=1$?`, 2*n+1, t`O índice é $2A+B=2\cdot${n}+1=${2*n+1}$.`); }),
        marker(t`Arraste até o índice da célula $AB=11$.`, 3, t`$11_2=3$.`),
        mcq(t`No mapa acima, os dois 1 formam qual termo?`, [t`$B$`, t`$A$`, t`$\bar B$`, t`$AB$`], 0, t`A coluna inteira tem $B=1$ enquanto A varia.`, { visual: map2 }),
        num(t`Quantas variáveis um par elimina?`, 1, t`Entre as duas células muda um bit, que é eliminado.`),
      ] },
      { card: [{ title: 'Três variáveis e Gray', body: t`Nas colunas $BC$ use $00, 01, 11, 10$. As extremidades também são vizinhas. No mapa, quatro 1 cobrem as colunas 01 e 11 nas duas linhas: só $C=1$ permanece.`, visual: map3 }, { title: 'Índice da célula', body: t`Arraste o marcador até o índice de uma célula: por exemplo, $ABC=111$ corresponde a $7$.`, visual: lab }], exercises: [
        num(t`Quantas células há no mapa de 3 variáveis?`, 8, t`$2^3=8$.`),
        mcq(t`Qual ordem é Gray para duas variáveis?`, ['00, 01, 11, 10', '00, 01, 10, 11', '00, 11, 01, 10', '00, 10, 01, 11'], 0, t`Em cada passagem, inclusive da última à primeira, só um bit muda.`),
        tf(t`As colunas 00 e 10 são adjacentes pelas bordas.`, true, t`Elas diferem só no bit B.`),
        gen(rng => { const a = randInt(rng, 0, 1); return num(t`Em $ABC$, qual o índice da célula $A=${a}$ e $BC=11$?`, 4*a+3, t`$4A+2B+C=4\cdot${a}+3=${4*a+3}$.`); }),
        mcq(t`Qual termo representa os quatro 1 do mapa?`, [t`$C$`, t`$B$`, t`$A$`, t`$\bar C$`], 0, t`A e B variam; C permanece 1.`, { visual: map3 }),
        marker(t`Arraste até o índice da célula $ABC=111$.`, 7, t`$111_2=4+2+1=7$.`),
        mcq(t`Em três variáveis, um grupo de quatro células elimina quantas variáveis?`, ['2', '1', '3', '0'], 0, t`Quatro combinações fazem dois bits variar, restando um literal.`),
      ] },
    ] },
    { id: 'dg-karn-4', title: 'Mapas de 4 variáveis', parts: [
      { card: { title: 'Bordas e cantos', body: t`Use $AB$ nas linhas e $CD$ nas colunas, ambos em ordem Gray $00, 01, 11, 10$. Os quatro cantos são adjacentes por continuidade das bordas. No mapa abaixo eles dão $\bar B\bar D$.`, visual: map4 }, exercises: [
        num(t`Quantas células tem o mapa de quatro variáveis?`, 16, t`$2^4=16$.`),
        tf(t`Os quatro cantos podem formar uma quadra.`, true, t`Linhas e colunas extremas são vizinhas; os quatro cantos formam um retângulo com bordas unidas.`),
        mcq(t`Qual termo representa os quatro 1 do mapa?`, [t`$\bar B\bar D$`, t`$\bar A\bar C$`, t`$BD$`, t`$AC$`], 0, t`Nos cantos B e D são sempre 0; A e C variam.`, { visual: map4 }),
        gen(rng => { const n = randInt(rng, 0, 15); return num(t`Qual índice decimal corresponde a $ABCD=${n.toString(2).padStart(4, '0')}$?`, n, t`A leitura binária de $ABCD$ dá $${n}$.`); }),
        marker(t`Marque o índice de $ABCD=1010$.`, 10, t`$1010_2=8+2=10$.`),
        num(t`Quantos literais restam ao agrupar 8 células num mapa de 4 variáveis?`, 1, t`O octeto elimina três variáveis: $4-3=1$.`),
        tf(t`Duas células em diagonal que diferem em dois bits são adjacentes.`, false, t`A adjacência exige diferença de apenas um bit.`),
      ] },
      { card: { title: 'Escolha os grupos', body: t`Cubra todos os 1 com grupos retangulares de $1, 2, 4, 8$ ou $16$ células. Não inclua 0. Sobreposição é permitida. Prefira grupos grandes e uma cobertura com poucos termos; confira alternativas quando houver empate.`, visual: lab }, exercises: [
        mcq(t`Qual tamanho de grupo é permitido?`, ['8', '3', '6', '5'], 0, t`Os tamanhos são potências de 2.`),
        tf(t`Um mesmo 1 pode participar de dois grupos úteis.`, true, t`A sobreposição pode ampliar grupos e reduzir literais.`),
        gen(rng => { const k = randInt(rng, 0, 3); return num(t`Em 4 variáveis, um grupo de $${2**k}$ células elimina quantas variáveis?`, k, t`$${2**k}=2^{${k}}$, logo variam $${k}$ bits.`); }),
        num(t`Quantos literais restam em um par de um mapa de quatro variáveis?`, 3, t`O par elimina um bit: $4-1=3$.`),
        marker(t`Marque o tamanho de uma quadra.`, 4, t`Uma quadra contém 4 células.`),
        tf(t`Um grupo de 4 pode incluir um zero se isso reduzir a expressão.`, false, t`Um zero obrigatório não pode ser coberto por um grupo de 1.`),
        mcq(t`Se os 16 valores da função são 1, qual sua expressão mínima?`, [t`$1$`, t`$0$`, t`$A$`, t`$AB$`], 0, t`Um grupo de 16 elimina as quatro variáveis: a função é constante 1.`),
      ] },
    ] },
    { id: 'dg-karn-dc', title: 'Condições irrelevantes', parts: [
      { card: { title: 'Células X', body: t`Uma condição irrelevante X representa uma entrada impossível ou cuja saída pode ser escolhida livremente. Ao agrupar 1, trate X como 1 somente se ajudar; caso contrário, como 0. Entradas válidas que exigem 0 ou 1 continuam obrigatórias.`, visual: lab }, exercises: [
        mcq(t`O que significa X no mapa?`, ['saída livre para essa combinação', 'saída obrigatoriamente 1', 'saída obrigatoriamente 0', 'variável negada'], 0, t`O projeto não exige valor específico nessa combinação.`),
        tf(t`Todo X precisa ser coberto por algum grupo.`, false, t`Apenas os 1 obrigatórios precisam ser cobertos.`),
        gen(rng => { const n = randInt(rng, 1, 4); return num(t`Há $${n}$ células X. Quantas são obrigatórias de cobrir?`, 0, t`Nenhuma: os X são opcionais, mesmo quando há $${n}$.`); }),
        mcq(t`Em $AB$, há 1 em 00, X em 01 e 0 nas demais. Usando X, obtenha:`, [t`$\bar A$`, t`$A$`, t`$B$`, t`$\bar B$`], 0, t`Agrupe 00 e 01: A é 0 e B varia.`),
        marker(t`Marque o índice do X em $AB=01$.`, 1, t`$01_2=1$.`),
        tf(t`É permitido incluir um 0 obrigatório no grupo junto com um X.`, false, t`A função precisa continuar 0 nessa entrada válida.`),
        num(t`Um par formado por um 1 e um X elimina quantas variáveis?`, 1, t`As células adjacentes diferem em um bit, eliminado no termo.`),
      ] },
      { card: { title: 'Usar ou ignorar', body: t`Exemplo: $F=\Sigma m(1, 3)$, com X em 5 e 7. Os quatro índices têm $C=1$; agrupar os quatro dá $F=C$. Sem usar X, o par daria $\bar A C$. As saídas nas linhas X podem mudar.`, visual: map3 }, exercises: [
        num(t`No exemplo, quantos 1 obrigatórios precisam de cobertura?`, 2, t`A lista $\Sigma m(1, 3)$ tem duas células obrigatórias.`),
        mcq(t`No exemplo, usando os dois X, qual termo cobre as quatro células?`, [t`$C$`, t`$A$`, t`$B$`, t`$\bar C$`], 0, t`Índices 1, 3, 5 e 7 têm C igual a 1.`),
        gen(rng => { const n = randInt(rng, 0, 3); return num(t`No mapa de 3 variáveis, qual índice é obtido somando 4 ao índice $${n}$?`, n+4, t`Adicionar 4 muda A de 0 para 1 e dá $${n+4}$.`); }),
        tf(t`Uma implementação pode dar 1 em uma célula X.`, true, t`A saída nessa combinação foi deixada livre pelo projeto.`),
        marker(t`Marque o índice $ABC=101$, um X do exemplo.`, 5, t`$101_2=5$.`),
        mcq(t`Se usar um X não aumenta nenhum grupo nem reduz a cobertura, é necessário usá-lo?`, ['Não', 'Sim, sempre', 'Sim, como zero em um grupo de 1', 'Só em mapas de duas variáveis'], 0, t`X é opcional; ignore-o quando não traz benefício.`),
        num(t`Quantos literais há em $\bar A C$?`, 2, t`Os literais são $\bar A$ e $C$.`),
      ] },
    ] },
    { id: 'dg-karn-proj', title: 'Projeto de circuitos combinacionais', parts: [
      { card: { title: 'Da tabela à porta AND', body: t`Para $AB$, a tabela $00, 01, 10, 11$ produz $0, 0, 0, 1$. O único 1 fica isolado no mapa e dá $F=AB$. Toque nas entradas do simulador e teste as quatro linhas.`, visual: probe('and') }, exercises: [
        num(t`Quantos 1 há na tabela de $AB$?`, 1, t`Só a linha 11 produz 1.`),
        mcq(t`Com A e B em 1 no circuito, qual a saída Y?`, ['1', '0', 'depende da ordem dos testes', 'indefinida'], 0, t`A porta AND produz 1 apenas com ambas as entradas em 1.`, { visual: probe('and') }),
        gen(rng => { const a = randInt(rng, 0, 1); const b = randInt(rng, 0, 1); return num(t`Para $A=${a}$ e $B=${b}$, quanto vale $AB$?`, a*b, t`$${a}\cdot${b}=${a*b}$.`); }),
        tf(t`O único mintermo da função AND é $m_3$.`, true, t`A linha 11 tem índice 3.`),
        build('and', [0,0,0,1], '$AB$', t`O único 1 está em 11; uma porta AND implementa a função com uma porta.`),
        marker(t`Marque o índice da única linha com saída 1 da AND.`, 3, t`$11_2=3$.`),
        build('or', [0,1,1,1], '$A+B$', t`Os 1 estão em 01, 10 e 11. Os pares fornecem $A+B$, implementado por uma porta OR.`),
      ] },
      { card: { title: 'Cobertura e verificação', body: t`Para $A+B$, os 1 estão em $01, 10, 11$. Os pares $01$–$11$ e $10$–$11$ produzem $B$ e $A$; sobreponha-os em 11. Uma porta OR implementa a expressão. Teste também as linhas que devem produzir zero.`, visual: probe('or') }, exercises: [
        num(t`Quantas linhas têm saída 1 em $A+B$?`, 3, t`São 01, 10 e 11.`),
        mcq(t`No circuito OR, com A=0 e B=1, quanto vale Y?`, ['1', '0', '2', 'indefinida'], 0, t`A entrada B em 1 basta para Y ser 1.`, { visual: probe('or') }),
        gen(rng => { const a = randInt(rng, 0, 1); const b = randInt(rng, 0, 1); return num(t`Para $A=${a}$ e $B=${b}$, quanto vale $A+B$ na álgebra booleana?`, Math.max(a,b), t`OR vale 1 se pelo menos uma entrada é 1; aqui vale $${Math.max(a,b)}$.`); }),
        tf(t`Os dois pares que geram $A+B$ compartilham a célula 11.`, true, t`Os pares 01–11 e 10–11 se sobrepõem em 11.`),
        build('or', [0,1,1,1], '$A+B$', t`Os grupos geram $A$ e $B$; uma única OR realiza a tabela.`),
        marker(t`Marque o índice da única linha de saída 0 de $A+B$.`, 0, t`A OR só é 0 em $00$, índice 0.`),
        build('and', [0,0,0,1], '$AB$', t`O mapa tem 1 apenas em 11; a porta AND realiza exatamente essa tabela.`),
      ] },
    ] },
  ],
};

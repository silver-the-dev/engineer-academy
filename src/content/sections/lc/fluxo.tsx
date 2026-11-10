import React from 'react';
import type { UnitDef } from '../../types';
import { code, gen, inter, mcq, num, order, plot, tf } from '../../helpers';
import { Pt } from '../../../components/plot/Plot';
import { randInt } from '../../../lib/random';
import { C } from '../../../theme';

// O passo mostra o estado após cada etapa, não outra listagem de código.
const trilha = (etapas: string[]) => ({
  name: 'stepper',
  props: {
    steps: etapas.length,
    view: { xMin: -0.5, xMax: etapas.length - 0.5, yMin: -1, yMax: 1 },
    render: (k: number) => <Pt x={k} y={0} color={C.gold} r={6} />,
    info: (k: number) => etapas[k],
  },
});

// O controle representa uma entrada inteira; a legenda mostra o efeito.
const entrada = (tipo: 'if' | 'switch' | 'while' | 'for') => plot({
  view: { xMin: -0.5, xMax: 5.5, yMin: -1, yMax: 1 },
  params: [{ key: 'n', label: 'entrada', min: 0, max: 5, step: 1, value: 0 }],
  render: ({ p }: any) => <Pt x={p.n} y={0} color={C.gold} r={6} />,
  info: ({ p }: any) => {
    const n = p.n as number;
    if (tipo === 'if') return `Entrada ${n}: ${n >= 3 ? 'ramo verdadeiro' : 'ramo alternativo'}.`;
    if (tipo === 'switch') return `Entrada ${n}: ${n === 1 ? 'caso 1' : n === 2 ? 'caso 2' : 'caso padrão'}.`;
    if (tipo === 'while') return `De zero até antes de ${n}: ${n} iterações.`;
    return `De 1 até ${n}, inclusive: ${n} iterações.`;
  },
});

const decisao = `int x = 4;
int y = 0;
if (x > 3) {
  y = 2;
} else {
  y = 7;
}`;
const logica = `int x = 2;
int y = 5;
int ok = (x > 0 && y < 6);`;
const escolha = `int modo = 2;
int saida = 0;
switch (modo) {
  case 1: saida = 10; break;
  case 2: saida = 20; break;
  default: saida = 30;
}`;
const queda = `int x = 1;
int y = 0;
switch (x) {
  case 1: y += 2;
  case 2: y += 3; break;
  default: y = 9;
}`;
const enquanto = `int i = 0;
int soma = 0;
while (i < 3) {
  soma += i;
  i++;
}`;
const faca = `int i = 4;
int n = 0;
do {
  n++;
  i++;
} while (i < 4);`;
const para = `int soma = 0;
for (int i = 1; i <= 3; i++) {
  soma += i;
}`;
const desvio = `int soma = 0;
for (int i = 0; i < 5; i++) {
  if (i == 2) continue;
  if (i == 4) break;
  soma += i;
}`;

export const cFluxo: UnitDef = {
  id: 'lc-fluxo',
  title: 'Decisões e laços',
  icon: '🔁',
  subtitle: 'Condições, escolhas e repetição em C',
  source: 'Passo 2 — Eletrônica Completa · Fase 9: Programação em C para Embarcados',
  guide: 'Uma condição escolhe um caminho; uma seleção por casos escolhe entre valores inteiros. Laços repetem ações enquanto sua condição permitir. Acompanhe inicialização, teste, corpo e atualização para conferir a parada.',
  lessons: [
    {
      id: 'lc-fluxo-if', title: 'if, else e operadores lógicos', parts: [
        {
          card: [
            { title: 'Escolha um caminho', body: 'Em C, zero é falso e qualquer valor diferente de zero é verdadeiro. A condição escolhe o primeiro bloco ou o bloco alternativo. Veja o valor final da saída.', visual: code(decisao, [3, 4, 6], 'Decisão') },
            { title: 'Acompanhe a decisão', body: 'Avance para seguir a avaliação e a atribuição.', visual: trilha(['Começo: entrada 4 e saída 0.', '4 é maior que 3: condição verdadeira.', 'Primeiro ramo: saída passa a 2.']) },
          ],
          exercises: [
            tf('Uma condição de valor zero é falsa em C.', true, 'Zero representa falso; qualquer valor não nulo representa verdadeiro.'),
            num('Na listagem, qual é o valor final de y?', 2, 'A entrada é 4, maior que 3; o primeiro ramo atribui 2.', { visual: code(decisao) }),
            mcq('Na listagem, qual ramo é executado?', ['o primeiro', 'o alternativo', 'os dois', 'nenhum'], 0, 'A comparação é verdadeira, portanto somente o primeiro ramo é executado.', { visual: code(decisao) }),
            gen((rng) => { const x = randInt(rng, 1, 8); const lim = 4; return num('Qual é o valor final de y na listagem?', x > lim ? 1 : 0, `A entrada é ${x}; a comparação com 4 é ${x > lim ? 'verdadeira' : 'falsa'}, então a saída é ${x > lim ? 1 : 0}.`, { visual: code(`int x = ${x};\nint y = 0;\nif (x > 4) y = 1;`) }); }),
            mcq('Qual operador compara igualdade entre valores?', ['==', '=', '+=', '++'], 0, 'O operador de igualdade compara os valores; o sinal simples atribui.'),
            inter('Ajuste a entrada para 3 e observe qual ramo é escolhido.', 'plot', entrada('if').props, (v) => v?.p.n === 3, 'Entrada 3.', 'Como 3 alcança o limite, o ramo verdadeiro é escolhido.'),
            mcq('No teste destacado, qual é o erro provável se a intenção era comparar igualdade?', ['Há uma atribuição em vez de comparação.', 'A variável é incrementada.', 'O teste sempre compara igualdade.', 'O bloco alternativo é obrigatório.'], 0, 'A atribuição grava 1 e também produz valor não nulo; para comparar igualdade use o operador de comparação.', { visual: code('int x = 0;\nif (x = 1) {\n  x = 2;\n}', [2], 'Erro de comparação') }),
          ],
        },
        {
          card: { title: 'Combine condições', body: 'A conjunção exige as duas condições verdadeiras; a disjunção exige ao menos uma. A negação inverte o resultado. C avalia da esquerda para a direita e pode deixar de avaliar o lado direito quando o resultado já está decidido.', visual: code(logica, [3], 'Conjunção') },
          exercises: [
            num('Qual valor inteiro fica em ok?', 1, 'A primeira comparação e a segunda são verdadeiras; a conjunção vale 1.', { visual: code(logica) }),
            tf('Uma disjunção é verdadeira quando pelo menos uma das condições é verdadeira.', true, 'Basta um dos dois lados ser verdadeiro para a disjunção ser verdadeira.'),
            mcq('Qual operador lógico inverte uma condição?', ['!', '&&', '||', '=='], 0, 'A negação troca falso por verdadeiro e verdadeiro por falso.'),
            gen((rng) => { const x = randInt(rng, 0, 7); return num('Qual o valor final de ok?', x >= 2 && x <= 5 ? 1 : 0, `A entrada ${x} ${x >= 2 && x <= 5 ? 'está' : 'não está'} entre 2 e 5, inclusive; o resultado é ${x >= 2 && x <= 5 ? 1 : 0}.`, { visual: code(`int x = ${x};\nint ok = (x >= 2 && x <= 5);`) }); }),
            tf('Na conjunção, o lado direito pode deixar de ser avaliado se o esquerdo for falso.', true, 'O resultado já é falso, então C aplica curto-circuito e não avalia o lado direito.'),
            num('Qual é o valor final de ok?', 1, 'A primeira comparação é falsa, mas a segunda é verdadeira; a disjunção vale 1.', { visual: code('int x = 0;\nint ok = (x > 1 || x == 0);') }),
            mcq('Com a entrada mostrada, qual valor fica em x?', ['0', '1', '2', 'indeterminado'], 0, 'A comparação à esquerda é falsa, portanto o incremento à direita não é avaliado e x permanece zero.', { visual: code('int x = 0;\nif (x != 0 && ++x > 1) {\n  x = 2;\n}') }),
          ],
        },
      ],
    },
    {
      id: 'lc-fluxo-switch', title: 'switch e enum', parts: [
        {
          card: [
            { title: 'Escolha por valor', body: 'A seleção compara uma expressão inteira com rótulos constantes. A interrupção sai da seleção; o caso padrão trata os valores sem rótulo correspondente.', visual: code(escolha, [3, 5], 'Seleção') },
            { title: 'Acompanhe a seleção', body: 'Siga o caminho para a entrada 2.', visual: trilha(['Entrada 2 e saída 0.', 'O caso 2 corresponde à entrada.', 'A saída recebe 20 e a interrupção encerra a seleção.']) },
          ],
          exercises: [
            num('Qual valor final de saida?', 20, 'A entrada é 2: o segundo caso atribui 20 e interrompe a seleção.', { visual: code(escolha) }),
            tf('O caso padrão pode atender valores sem caso correspondente.', true, 'Quando nenhum rótulo corresponde, o caso padrão é escolhido se estiver presente.'),
            mcq('O que a interrupção faz dentro de uma seleção?', ['Sai da seleção.', 'Reinicia a seleção.', 'Apaga a variável.', 'Sai necessariamente da função.'], 0, 'A interrupção sai da seleção envolvente e continua após ela.'),
            gen((rng) => { const x = randInt(rng, 0, 3); return num('Qual é o valor final de y?', x === 1 ? 5 : 9, `A entrada é ${x}; ${x === 1 ? 'o caso 1 atribui 5' : 'nenhum caso corresponde e o padrão atribui 9'}.`, { visual: code(`int x = ${x};\nint y = 0;\nswitch (x) {\n  case 1: y = 5; break;\n  default: y = 9;\n}`) }); }),
            inter('Ajuste a entrada para escolher o caso 2 no laboratório.', 'plot', entrada('switch').props, (v) => v?.p.n === 2, 'Entrada 2.', 'O valor 2 corresponde ao rótulo do segundo caso.'),
            num('Qual valor final de y?', 5, 'O caso 1 soma 2; sem interrupção, a execução continua no caso 2 e soma 3, chegando a 5.', { visual: code(queda) }),
            mcq('Se nenhum caso corresponder e não houver caso padrão, o que acontece?', ['A seleção termina sem executar seus casos.', 'O primeiro caso é executado.', 'O programa reinicia.', 'O último caso é executado.'], 0, 'Sem correspondência e sem padrão, o fluxo segue depois da seleção.'),
          ],
        },
        {
          card: { title: 'Estados com nomes', body: 'Uma enumeração dá nomes a constantes inteiras. Sem valores explícitos, a primeira começa em zero e as seguintes aumentam de um. Esses nomes deixam uma máquina de estados mais legível.', visual: code('enum Estado { OCIOSO, ATIVO, ALARME };\nenum Estado estado = ATIVO;\nint saida = 0;\nswitch (estado) {\n  case OCIOSO: saida = 0; break;\n  case ATIVO: saida = 1; break;\n  case ALARME: saida = 2; break;\n}', undefined, 'Estados') },
          exercises: [
            num('Na listagem do card, qual o valor numérico de ATIVO?', 1, 'A numeração implícita começa em 0: OCIOSO é 0 e ATIVO é 1.'),
            num('Na listagem do card, qual o valor final de saida?', 1, 'O estado inicial é ATIVO; o caso correspondente atribui 1 e termina a seleção.'),
            tf('Os nomes de uma enumeração podem representar estados de um dispositivo.', true, 'Eles fornecem nomes legíveis para valores inteiros usados nas decisões.'),
            gen((rng) => { const a = randInt(rng, 1, 6); return num('Qual o valor numérico da segunda constante?', a + 1, `A primeira vale ${a}; a seguinte, sem valor explícito, vale ${a + 1}.`, { visual: code(`enum Modo { A = ${a}, B, C };`) }); }),
            order('Ordene o raciocínio para processar um estado:', ['Ler o estado atual', 'Encontrar o caso correspondente', 'Executar a ação do caso', 'Sair da seleção'], 'Primeiro lê-se o estado, encontra-se o caso, executa-se a ação e, com interrupção, sai-se da seleção.'),
            num('Qual é o valor final de y?', 3, 'O segundo nome tem valor 3 porque sucede o valor explícito 2; seu caso atribui 3.', { visual: code('enum Modo { A = 2, B };\nint y = 0;\nswitch (B) {\n  case A: y = 2; break;\n  case B: y = 3; break;\n}') }),
            tf('A enumeração impede, por si só, qualquer valor inteiro não listado de chegar à seleção em C.', false, 'Em C, uma variável de enumeração não garante sozinha que o valor corresponda a um dos nomes; trate entradas inesperadas.'),
          ],
        },
      ],
    },
    {
      id: 'lc-fluxo-while', title: 'while e do-while', parts: [
        {
          card: [
            { title: 'Teste antes do corpo', body: 'O laço testa a condição antes de cada passagem. Se ela começar falsa, o corpo não executa. Atualizar a variável de controle ajuda a chegar à parada.', visual: code(enquanto, [3, 4, 5], 'Enquanto') },
            { title: 'Rastreie a soma', body: 'Avance e observe os estados após cada passagem.', visual: trilha(['Início: contador 0, soma 0.', 'Após somar 0: contador 1, soma 0.', 'Após somar 1: contador 2, soma 1.', 'Após somar 2: contador 3, soma 3; o teste falha.']) },
          ],
          exercises: [
            num('Quantas vezes o corpo da listagem executa?', 3, 'O contador assume 0, 1 e 2 no corpo; em 3 o teste falha.', { visual: code(enquanto) }),
            num('Qual o valor final de soma?', 3, 'As passagens somam 0, depois 1 e depois 2: resultado 3.', { visual: code(enquanto) }),
            tf('Se a condição inicial for falsa, o corpo pode executar zero vezes.', true, 'O teste ocorre antes da primeira passagem.'),
            gen((rng) => { const n = randInt(rng, 1, 6); return num('Quantas vezes o corpo executa?', n, `O contador percorre de 0 até ${n - 1}, totalizando ${n} passagens.`, { visual: code(`int i = 0;\nwhile (i < ${n}) {\n  i++;\n}`) }); }),
            inter('Ajuste a entrada para obter 4 iterações.', 'plot', entrada('while').props, (v) => v?.p.n === 4, 'Entrada 4.', 'A contagem de zero até antes de 4 percorre 0, 1, 2 e 3: quatro passagens.'),
            mcq('Qual problema ocorre na listagem?', ['A condição permanece verdadeira e o laço não termina.', 'O corpo executa uma vez.', 'O contador chega a 3.', 'A condição começa falsa.'], 0, 'O contador começa em zero e não muda; portanto permanece menor que 3.', { visual: code('int i = 0;\nwhile (i < 3) {\n  int x = 1;\n}') }),
            num('Qual o valor final de i?', 6, 'O contador passa por 0, 2 e 4 no corpo; depois avança para 6, quando o teste falha.', { visual: code('int i = 0;\nwhile (i < 5) {\n  i += 2;\n}') }),
          ],
        },
        {
          card: { title: 'Teste depois do corpo', body: 'Neste laço, o corpo executa antes do primeiro teste. Por isso há pelo menos uma passagem; depois a condição decide se haverá outra. A instrução termina com ponto e vírgula.', visual: code(faca, [3, 6], 'Faça e teste') },
          exercises: [
            num('Quantas vezes o corpo executa?', 1, 'O corpo executa uma vez; o contador passa a 5 e o teste falha.', { visual: code(faca) }),
            num('Qual valor final de n?', 1, 'A única passagem incrementa a contagem de zero para 1.', { visual: code(faca) }),
            tf('O teste depois do corpo garante pelo menos uma passagem.', true, 'O primeiro teste só acontece após executar o corpo uma vez.'),
            gen((rng) => { const n = randInt(rng, 1, 6); return num('Qual valor final de i?', n, `O contador começa em zero e é incrementado até ${n}; então o teste falha.`, { visual: code(`int i = 0;\ndo {\n  i++;\n} while (i < ${n});`) }); }),
            order('Ordene as etapas da primeira passagem deste tipo de laço:', ['Executar o corpo', 'Testar a condição', 'Decidir entre repetir ou sair'], 'O corpo vem primeiro; só depois se testa a condição para repetir ou sair.'),
            num('Quantas vezes o corpo executa?', 3, 'As passagens deixam o contador em 1, 2 e 3; após a terceira, a condição falha.', { visual: code('int i = 0;\ndo {\n  i++;\n} while (i < 3);') }),
            mcq('A intenção é aguardar uma entrada válida. Qual cuidado evita repetição infinita?', ['Atualizar a entrada dentro do corpo.', 'Manter sempre a mesma entrada inválida.', 'Retirar todo teste.', 'Reiniciar a contagem em cada teste.'], 0, 'A leitura deve ser renovada; uma entrada inválida constante mantém a condição de repetição verdadeira.'),
          ],
        },
      ],
    },
    {
      id: 'lc-fluxo-for', title: 'for, break e continue', parts: [
        {
          card: [
            { title: 'Contagem controlada', body: 'O cabeçalho reúne inicialização, condição e atualização. A inicialização ocorre uma vez; cada passagem testa a condição, executa o corpo e atualiza o contador.', visual: code(para, [2, 3], 'Contagem') },
            { title: 'Rastreie o acumulador', body: 'Percorra as passagens e confira a soma.', visual: trilha(['Início: soma 0.', 'Contador 1: soma 1.', 'Contador 2: soma 3.', 'Contador 3: soma 6; depois o contador chega a 4 e o teste falha.']) },
          ],
          exercises: [
            num('Quantas vezes o corpo executa?', 3, 'Os valores do contador no corpo são 1, 2 e 3.', { visual: code(para) }),
            num('Qual é o valor final de soma?', 6, 'Somam-se 1, 2 e 3, obtendo 6.', { visual: code(para) }),
            tf('A inicialização do laço ocorre uma vez antes dos testes.', true, 'A inicialização prepara o contador; a condição é testada antes de cada passagem.'),
            gen((rng) => { const n = randInt(rng, 2, 6); return num('Quantas vezes o corpo executa?', n, `A contagem vai de 0 até ${n - 1}, com ${n} valores.`, { visual: code(`int n = 0;\nfor (int i = 0; i < ${n}; i++) {\n  n++;\n}`) }); }),
            inter('Ajuste a entrada para que a contagem de 1 até ela, inclusive, tenha 5 passagens.', 'plot', entrada('for').props, (v) => v?.p.n === 5, 'Entrada 5.', 'A contagem percorre 1, 2, 3, 4 e 5, totalizando cinco passagens.'),
            num('Quantas vezes o corpo executa?', 4, 'A comparação inclui o limite: o contador assume 0, 1, 2 e 3. Esse detalhe pode causar um erro de uma posição.', { visual: code('int n = 0;\nfor (int i = 0; i <= 3; i++) {\n  n++;\n}') }),
            order('Ordene as etapas depois da inicialização, numa passagem que ocorre:', ['Testar a condição', 'Executar o corpo', 'Atualizar o contador', 'Testar novamente'], 'Com condição verdadeira, o corpo executa, o contador é atualizado e a condição é testada de novo.'),
          ],
        },
        {
          card: { title: 'Interromper ou pular', body: 'A interrupção sai do laço envolvente. A continuação pula o restante do corpo e segue para a atualização do contador neste tipo de laço. No exemplo, a passagem de 2 é pulada e a de 4 encerra a repetição.', visual: code(desvio, [3, 4], 'Desvios') },
          exercises: [
            num('Qual o valor final de soma?', 4, 'Somam-se 0, 1 e 3; o valor 2 é pulado e 4 encerra o laço. O total é 4.', { visual: code(desvio) }),
            tf('A continuação encerra definitivamente o laço.', false, 'Ela pula o restante da passagem atual; a atualização e o próximo teste ainda acontecem.'),
            mcq('Em um laço de contagem, o que acontece após a continuação?', ['Executa-se a atualização e depois o teste.', 'O laço sempre termina.', 'A inicialização é refeita.', 'O corpo termina e a função retorna.'], 0, 'A continuação leva à atualização do laço de contagem, seguida do próximo teste.'),
            gen((rng) => { const stop = randInt(rng, 2, 5); return num('Quantas vezes a contagem n é incrementada?', stop, `Os valores anteriores a ${stop} são processados; ao chegar a ${stop}, a interrupção sai antes do incremento.`, { visual: code(`int n = 0;\nfor (int i = 0; i < 6; i++) {\n  if (i == ${stop}) break;\n  n++;\n}`) }); }),
            num('Quantas vezes n é incrementado?', 3, 'Há quatro valores de 0 a 3; o valor 2 é pulado, sobrando três incrementos.', { visual: code('int n = 0;\nfor (int i = 0; i < 4; i++) {\n  if (i == 2) continue;\n  n++;\n}') }),
            mcq('Em dois laços aninhados, a interrupção dentro do mais interno sai de qual laço?', ['Somente do mais interno.', 'Dos dois ao mesmo tempo.', 'Somente do mais externo.', 'De toda a função.'], 0, 'A interrupção sai da estrutura repetitiva ou de seleção envolvente mais próxima.'),
            num('Qual o valor final de n?', 2, 'Para cada uma das duas passagens externas, o laço interno incrementa uma vez e é interrompido: total 2.', { visual: code('int n = 0;\nfor (int i = 0; i < 2; i++) {\n  for (int j = 0; j < 3; j++) {\n    n++;\n    break;\n  }\n}') }),
          ],
        },
      ],
    },
  ],
};

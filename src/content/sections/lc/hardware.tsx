import type { UnitDef } from '../../types';
import { code, fill, gen, inter, mcq, num, order, plot, tf } from '../../helpers';
import { randInt } from '../../../lib/random';
import { Pt } from '../../../components/plot/Plot';
import React from 'react';

// Um controle discreto permite experimentar valores sem depender de hardware real.
const lab = (label: string, max: number, describe: (n: number) => string) => plot({
  view: { xMin: -1, xMax: max + 1, yMin: -1, yMax: 2 },
  params: [{ key: 'n', label, min: 0, max, step: 1, value: 0 }],
  render: ({ p }: any) => <Pt x={p.n} y={0} label={String(p.n)} />,
  info: ({ p }: any) => describe(p.n),
});
const bitsLab = () => lab('bit', 7, n => `Bit ${n}: peso ${2 ** n} em decimal.`);
const faixaLab = () => lab('valor', 15, n => `Valor ${n}: em binário, ${n.toString(2).padStart(4, '0')}.`);
const estadoLab = () => lab('evento', 3, n => `Após ${n} eventos: ${n % 2 ? 'LIGADO' : 'DESLIGADO'}.`);
const acessoLab = () => lab('interrupções', 5, n => `A interrupção registrou ${n} evento(s). A leitura deve observar atualizações.`);
const desafio = (prompt: string, spec: ReturnType<typeof lab>, target: number, explain: string) =>
  inter(prompt, 'plot', spec.props, v => v.p.n === target, `Ajuste para ${target}.`, explain);
const escolha = (prompt: string, correct: string, wrong: string[], explain: string) => mcq(prompt, [correct, ...wrong], 0, explain);
const visualNum = (prompt: string, answer: number, explain: string, src: string) => num(prompt, answer, explain, { visual: code(src, undefined, 'C') });
const desloc = (prompt: string, answer: number, explain: string, src: string) => ({ ...fill(prompt, '___', [String(answer)], ['0', '8', '16'].filter(x => x !== String(answer)), explain), visual: code(src, undefined, 'C') });

export const cHardware: UnitDef = {
  id: 'lc-bits', title: 'C perto do hardware', icon: '🧠',
  subtitle: 'Tipos fixos, bits, registradores e estados',
  source: 'Conteúdo complementar de Sistemas Embarcados', extra: true,
  guide: 'Tipos de largura fixa tornam explícita a faixa. Em inteiros sem sinal a aritmética é modular. Máscaras isolam bits; estados organizam o comportamento e variáveis compartilhadas com interrupções exigem cuidados de acesso.',
  lessons: [
    { id: 'lc-bits-fixos', title: 'Inteiros de tamanho fixo e overflow', parts: [
      { card: [
        { title: 'Largura e faixa', body: 'O cabeçalho padrão oferece tipos de largura exata quando a implementação os suporta. Um inteiro sem sinal de 8 bits representa de 0 a 255; um inteiro com sinal de 16 bits, de −32768 a 32767.', visual: code('#include <stdint.h>\nuint8_t amostra = 200;\nint16_t saldo = -300;', undefined, 'Tipos fixos') },
        { title: 'Explore os bits', body: 'Mova o controle para ver a representação de quatro bits.', visual: faixaLab() },
      ], exercises: [
        desafio('Ajuste o valor para 9 e observe sua representação em quatro bits.', faixaLab(), 9, 'Nove corresponde aos bits 1001: 8 + 1.'),
        escolha('Qual é o maior valor de um inteiro sem sinal de 8 bits?', '255', ['127', '256', '65535'], 'São 256 combinações, de 0 até 255.'),
        tf('Um inteiro com sinal de 16 bits pode representar −32768.', true, 'Essa é a extremidade inferior da faixa de 16 bits com sinal.'),
        num('Quantas combinações existem em 8 bits?', 256, 'Cada bit tem dois valores: 2 elevado a 8 é 256.'),
        gen(rng => { const n = randInt(rng, 1, 7); return num(`Qual é o peso decimal do bit ${n}, contando a partir do bit zero?`, 2 ** n, `O peso é 2 elevado a ${n}, ou ${2 ** n}.`); }),
        visualNum('Qual valor decimal está armazenado?', 26, 'O dígito 1 vale 16 e o dígito A vale 10: 16 + 10 = 26.', '#include <stdint.h>\nuint8_t x = 0x1A;'),
        escolha('Qual cabeçalho declara os tipos de largura fixa?', 'stdint.h', ['stdio.h', 'math.h', 'string.h'], 'O cabeçalho stdint.h define os tipos inteiros de largura fixa disponíveis.'),
        visualNum('Qual é o valor final, em decimal?', 255, 'A soma dos pesos dos oito bits é 255.', '#include <stdint.h>\nuint8_t x = 0xFF;'),
      ] },
      { card: { title: 'Quando o valor ultrapassa a faixa', body: 'A conversão para um tipo sem sinal reduz o valor módulo 256 no caso de 8 bits. Overflow em operação com tipo assinado é comportamento indefinido: não conte com uma volta ao mínimo. Promoções inteiras também importam: a soma pode ocorrer em tipo mais largo antes da conversão.', visual: code('#include <stdint.h>\nuint8_t x = 255;\nx = x + 1;', [3], 'Conversão para 8 bits') }, exercises: [
        tf('Ao converter 256 para um inteiro sem sinal de 8 bits, o resultado é zero.', true, '256 deixa resto zero na divisão por 256.'),
        num('Qual é o resto de 260 por 256?', 4, '260 = 256 + 4; o resto é 4.'),
        visualNum('Qual é o valor final?', 3, 'A soma é 259 e a conversão sem sinal deixa resto 3 por 256.', '#include <stdint.h>\nuint8_t x = 250;\nx = x + 9;'),
        gen(rng => { const a = randInt(rng, 250, 255); const b = randInt(rng, 7, 15); return visualNum('Qual é o valor final em decimal?', (a + b) % 256, `A soma é ${a + b}; ao converter, o resto por 256 é ${(a + b) % 256}.`, `#include <stdint.h>\nuint8_t x = ${a};\nx = x + ${b};`); }),
        escolha('O que a linguagem garante para overflow em uma operação de inteiro assinado?', 'Comportamento indefinido', ['Sempre volta ao mínimo', 'Sempre satura no máximo', 'Sempre gera exceção'], 'O padrão de C não define o resultado de overflow aritmético assinado.'),
        tf('A soma de dois valores pequenos de 8 bits pode ser promovida a um tipo inteiro mais largo antes da atribuição.', true, 'As promoções inteiras ocorrem antes da operação; a atribuição converte o resultado de volta.'),
        visualNum('Qual é o valor final em decimal?', 255, 'O valor −1 convertido para sem sinal de 8 bits é congruente a 255 módulo 256.', '#include <stdint.h>\nuint8_t x = 0;\nx = x - 1;'),
      ] },
    ] },
    { id: 'lc-bits-oper', title: 'Operações bit a bit', parts: [
      { card: [
        { title: 'AND, OR e XOR', body: 'Compare os bits na mesma posição: AND dá 1 apenas com dois 1; OR dá 1 com pelo menos um 1; XOR dá 1 quando os bits diferem.', visual: code('#include <stdint.h>\nuint8_t a = 12;\nuint8_t b = 10;\nuint8_t c = a & b;', [4], 'Operação AND') },
        { title: 'Pesos', body: 'Mova o controle para escolher a posição do bit e ver seu peso.', visual: bitsLab() },
      ], exercises: [
        desafio('Ajuste o controle para o bit de peso 8.', bitsLab(), 3, 'O peso 8 corresponde à posição 3, pois 2 elevado a 3 é 8.'),
        escolha('Qual operação resulta em 1 quando ambos os bits são 1?', 'AND', ['OR exclusivo', 'NOT', 'deslocamento'], 'AND exige os dois bits iguais a 1.'),
        num('Qual é o resultado decimal do AND entre 12 e 10?', 8, '12 é 1100 e 10 é 1010 em binário; o AND é 1000, ou 8.'),
        visualNum('Qual é o valor decimal final?', 14, '1100 OR 1010 resulta em 1110, isto é, 14.', '#include <stdint.h>\nuint8_t x = 12 | 10;'),
        gen(rng => { const n = randInt(rng, 0, 7); const mask = 2 ** n; return visualNum('Qual é o valor decimal final?', mask, `O único bit ligado tem peso ${mask}.`, `#include <stdint.h>\nuint8_t x = 0;\nx = x | (1u << ${n});`); }),
        tf('XOR de dois bits iguais produz zero.', true, 'Tanto 0 XOR 0 quanto 1 XOR 1 produzem 0.'),
        visualNum('Qual é o valor decimal final?', 6, '1100 XOR 1010 resulta em 0110, ou 6.', '#include <stdint.h>\nuint8_t x = 12 ^ 10;'),
        escolha('Qual operação alterna um bit quando a máscara nesse bit é 1?', 'XOR', ['AND', 'OR', 'comparação de igualdade'], 'XOR com 1 troca 0 por 1 e 1 por 0.'),
      ] },
      { card: { title: 'Deslocamentos', body: 'Deslocar um valor sem sinal para a esquerda por uma posição multiplica por 2 quando não há perda de bits relevantes; para a direita, descarta o bit menos significativo. Use contagens válidas e operandos sem sinal.', visual: code('unsigned int x = 3u;\nunsigned int y = x << 2;', [2], 'Deslocamento') }, exercises: [
        num('Qual o peso decimal do bit 3?', 8, 'A contagem começa em zero: 2 elevado a 3 é 8.'),
        visualNum('Qual é o valor final?', 12, 'Três deslocado duas posições à esquerda é 3 vezes 4, ou 12.', 'unsigned int x = 3u;\nunsigned int y = x << 2;'),
        gen(rng => { const n = randInt(rng, 1, 6); return visualNum('Qual é o valor final?', 2 ** n, `O bit 1 foi movido ${n} posições: seu peso é ${2 ** n}.`, `unsigned int x = 1u << ${n};`); }),
        visualNum('Qual é o valor final?', 3, '14 em binário é 1110; ao descartar dois bits à direita sobra 11, ou 3.', 'unsigned int x = 14u >> 2;'),
        tf('Uma contagem de deslocamento negativa é válida em C.', false, 'Contagens negativas ou maiores ou iguais à largura do operando promovido causam comportamento indefinido.'),
        desloc('Escolha a posição que produz o valor 8.', 3, 'O bit de peso 8 está na posição 3.', 'unsigned int x = 1u << /* ? */;'),
        escolha('Por que preferir operandos sem sinal em operações de bits?', 'Suas regras de bits evitam armadilhas de sinal', ['Impedem toda promoção inteira', 'Tornam qualquer deslocamento válido', 'Garantem acesso atômico'], 'Tipos sem sinal têm regras apropriadas para manipulação de bits, mas ainda exigem deslocamentos válidos.'),
      ] },
    ] },
    { id: 'lc-bits-masc', title: 'Máscaras e registradores', parts: [
      { card: [
        { title: 'Ligar e limpar', body: 'Uma máscara seleciona posições. OR com a máscara liga bits; AND com o complemento da máscara limpa os bits selecionados. Outros bits são preservados no valor calculado.', visual: code('#include <stdint.h>\nuint8_t r = 5;\nr |= (1u << 1);\nr &= ~(1u << 0);', undefined, 'Máscaras') },
        { title: 'Escolha a posição', body: 'O peso mostrado é a máscara de um único bit.', visual: bitsLab() },
      ], exercises: [
        desafio('Ajuste o controle para o bit cuja máscara vale 16.', bitsLab(), 4, 'A máscara de um bit na posição 4 vale 16.'),
        escolha('Que operação liga um bit selecionado sem alterar os demais no valor calculado?', 'OR com a máscara', ['AND com a máscara', 'XOR com zero', 'divisão por dois'], 'OR com 1 liga o bit; OR com 0 preserva os outros.'),
        visualNum('Qual é o valor final?', 7, '5 é 0101; ligar o bit 1 produz 0111, ou 7.', '#include <stdint.h>\nuint8_t r = 5;\nr |= (1u << 1);'),
        gen(rng => { const n = randInt(rng, 0, 7); return visualNum('Qual é o valor final?', 2 ** n, `Partindo de zero, ligar o bit ${n} produz ${2 ** n}.`, `#include <stdint.h>\nuint8_t r = 0;\nr |= (1u << ${n});`); }),
        visualNum('Qual é o valor final?', 5, '7 é 0111; limpar o bit 1 deixa 0101, ou 5.', '#include <stdint.h>\nuint8_t r = 7;\nr &= ~(1u << 1);'),
        tf('AND com o complemento da máscara limpa os bits selecionados no valor calculado.', true, 'O complemento tem zero nas posições selecionadas e um nas demais.'),
        gen(rng => { const n = randInt(rng, 0, 7); return visualNum('Qual é o valor final?', 255 - 2 ** n, `De 255, remover o peso ${2 ** n} deixa ${255 - 2 ** n}.`, `#include <stdint.h>\nuint8_t r = 255;\nr &= ~(1u << ${n});`); }),
        escolha('Antes de alterar um registrador real, qual cuidado é essencial?', 'Consultar o manual do periférico', ['Supor que todos os bits são comuns', 'Escrever sempre 255', 'Desativar o compilador'], 'Alguns bits têm efeitos especiais de leitura ou escrita; o manual define o procedimento seguro.'),
      ] },
      { card: { title: 'Alternar e testar', body: 'XOR com uma máscara alterna o bit selecionado. Para testar, faça AND e compare o resultado com zero. Registradores reais podem ter efeitos especiais: uma leitura seguida de escrita não é universalmente segura.', visual: code('#include <stdint.h>\nuint8_t r = 4;\nr ^= (1u << 2);\nint ativo = (r & 4u) != 0;', undefined, 'Alternar e testar') }, exercises: [
        tf('Alternar duas vezes o mesmo bit devolve seu valor inicial.', true, 'XOR com 1 troca o bit a cada aplicação; duas trocas restauram o original.'),
        visualNum('Qual é o valor final?', 0, 'O bit 2 de 4 estava ligado; XOR com 4 o desliga.', '#include <stdint.h>\nuint8_t r = 4;\nr ^= (1u << 2);'),
        gen(rng => { const n = randInt(rng, 0, 7); return visualNum('Qual é o valor final?', 255 - 2 ** n, `O bit ${n} estava ligado e é alternado para zero: 255 − ${2 ** n} = ${255 - 2 ** n}.`, `#include <stdint.h>\nuint8_t r = 255;\nr ^= (1u << ${n});`); }),
        visualNum('Qual é o valor final de ativo?', 1, '10 contém o bit de peso 2; o AND é diferente de zero, então a comparação produz 1.', 'unsigned int r = 10u;\nint ativo = (r & 2u) != 0;'),
        escolha('Qual resultado indica que o bit testado está desligado?', 'AND com a máscara igual a zero', ['AND com a máscara diferente de zero', 'OR com a máscara diferente de zero', 'XOR com zero igual à máscara'], 'Se o bit selecionado é zero, o AND com sua máscara é zero.'),
        desloc('Escolha a posição do bit de peso 4.', 2, 'O peso da posição 2 é 2 elevado a 2, isto é, 4.', 'unsigned int mask = 1u << /* ? */;'),
        escolha('Em um registrador com bits que limpam ao escrever 1, o que fazer?', 'Seguir a sequência indicada no manual', ['Usar qualquer leitura e escrita', 'Supor que OR sempre preserva tudo', 'Tratar todos os bits como memória comum'], 'Escritas podem ter efeitos especiais; leia a especificação do periférico.'),
      ] },
    ] },
    { id: 'lc-bits-estado', title: 'Máquinas de estado', parts: [
      { card: [
        { title: 'Estados e eventos', body: 'Uma máquina de estados guarda uma situação atual e decide a próxima a partir de um evento. Um enum dá nomes aos estados e um switch seleciona o comportamento correspondente.', visual: code('enum Estado { DESLIGADO, LIGADO };\nenum Estado estado = DESLIGADO;\nif (evento) {\n  estado = LIGADO;\n}', undefined, 'Estado inicial') },
        { title: 'Experimente transições', body: 'Nesta máquina, cada evento alterna entre desligado e ligado.', visual: estadoLab() },
      ], exercises: [
        desafio('Ajuste para dois eventos e observe o estado final.', estadoLab(), 2, 'Duas alternâncias devolvem o estado inicial desligado.'),
        escolha('O que representa o estado atual?', 'A situação guardada pela máquina', ['O nome do processador', 'A quantidade de memória', 'Um número sempre aleatório'], 'O estado resume a situação relevante para decidir o próximo comportamento.'),
        tf('Um evento pode provocar uma transição de estado.', true, 'A transição depende do estado atual e das regras para o evento.'),
        num('Uma máquina começa desligada e alterna a cada evento. Após 3 eventos, qual o estado: 0 desligado ou 1 ligado?', 1, 'Desligado → ligado → desligado → ligado; portanto, 1.'),
        gen(rng => { const n = randInt(rng, 1, 8); return num(`A máquina começa desligada e alterna a cada evento. Após ${n} eventos, informe 0 para desligado ou 1 para ligado.`, n % 2, `${n} alternâncias deixam o estado ${n % 2 ? 'ligado' : 'desligado'}, pois a quantidade é ${n % 2 ? 'ímpar' : 'par'}.`); }),
        visualNum('Qual é o valor final de estado?', 1, 'O evento é verdadeiro e atribui o valor 1.', 'int estado = 0;\nint evento = 1;\nif (evento) estado = 1;'),
        order('Ordene o ciclo conceitual de uma máquina de estados:', ['Ler o evento', 'Consultar o estado atual', 'Aplicar a regra de transição', 'Guardar o próximo estado'], 'Primeiro obtenha o evento e consulte o estado; a regra determina e guarda o próximo estado.'),
        escolha('Qual é a vantagem de nomear estados?', 'Tornar as transições mais legíveis', ['Eliminar a necessidade de eventos', 'Garantir ausência de bugs', 'Impedir qualquer estado inválido'], 'Nomes ajudam a entender as regras; ainda é preciso tratar valores inválidos.'),
      ] },
      { card: { title: 'Seleção com switch', body: 'Cada caso descreve uma situação. A interrupção de fluxo ao final de um caso evita executar o seguinte acidentalmente. Um caso padrão pode tratar estados inesperados.', visual: code('switch (estado) {\n  case 0:\n    estado = 1;\n    break;\n  case 1:\n    estado = 0;\n    break;\n  default:\n    estado = 0;\n}', undefined, 'Transição') }, exercises: [
        escolha('Qual ramo trata valores não previstos explicitamente?', 'O caso padrão', ['O primeiro caso sempre', 'O último caso sempre', 'Nenhum ramo pode tratá-los'], 'O caso padrão recebe os valores que não correspondem aos demais casos.'),
        tf('Sem uma interrupção de fluxo, a execução pode continuar no caso seguinte.', true, 'Em C, os rótulos de caso não interrompem a execução automaticamente.'),
        visualNum('Qual é o valor final?', 1, 'O caso zero atribui 1 e interrompe o switch.', 'int e = 0;\nswitch (e) {\n  case 0: e = 1; break;\n  default: e = 2;\n}'),
        gen(rng => { const n = randInt(rng, 0, 1); return visualNum('Qual é o valor final?', 1 - n, `O caso correspondente troca ${n} por ${1 - n} e interrompe o switch.`, `int e = ${n};\nswitch (e) {\n  case 0: e = 1; break;\n  case 1: e = 0; break;\n}`); }),
        escolha('Qual é o erro em omitir a interrupção de fluxo entre casos quando se quer executar apenas um?', 'Pode executar também o caso seguinte', ['O switch vira laço infinito', 'Todos os estados viram zero', 'O enum deixa de existir'], 'A execução prossegue até encontrar uma interrupção de fluxo ou o fim do switch.'),
        visualNum('Qual é o valor final?', 2, 'O caso zero atribui 1 e, sem interrupção, continua no caso 1 e atribui 2.', 'int e = 0;\nswitch (e) {\n  case 0: e = 1;\n  case 1: e = 2; break;\n}'),
        order('Ordene o planejamento de uma máquina de estados:', ['Identificar estados', 'Identificar eventos', 'Definir transições', 'Tratar estado inesperado'], 'Liste estados e eventos, defina o destino de cada transição e trate valores inesperados.'),
      ] },
    ] },
    { id: 'lc-bits-volatile', title: 'volatile, const e interrupções', parts: [
      { card: [
        { title: 'Mudanças externas', body: 'Uma variável compartilhada com uma rotina de interrupção pode mudar fora do fluxo principal. Em sistemas embarcados, volatile informa ao compilador que acessos são observáveis e devem seguir as regras da implementação; consulte a plataforma para a comunicação com interrupções.', visual: code('volatile int evento = 0;\nvoid interrupcao(void) {\n  evento = 1;\n}', undefined, 'Sinal compartilhado') },
        { title: 'Eventos externos', body: 'Mova o controle para representar eventos registrados pela interrupção.', visual: acessoLab() },
      ], exercises: [
        desafio('Represente três eventos registrados pela interrupção.', acessoLab(), 3, 'Três eventos correspondem à contagem 3; o acesso compartilhado exige cuidados.'),
        escolha('Por que uma variável alterada por interrupção costuma ser volatile?', 'Para que acessos observáveis não sejam eliminados como valores invariáveis', ['Para torná-la automaticamente atômica', 'Para impedir a interrupção', 'Para armazená-la sempre em registrador'], 'O valor pode mudar fora do fluxo normal; volatile informa que os acessos são observáveis.'),
        tf('Volatile, sozinho, garante atomicidade de uma operação composta.', false, 'Uma leitura, modificação e escrita pode ser interrompida; volatile não fornece exclusão mútua.'),
        gen(rng => { const n = randInt(rng, 1, 8); return num(`Um contador começa em zero e recebe exatamente ${n} incrementos, sem perdas. Qual é seu valor final?`, n, `Cada incremento acrescenta 1; com ${n} incrementos sem perdas o resultado é ${n}.`); }),
        visualNum('Suponha uma chamada completa da rotina. Qual é o valor final?', 1, 'O sinal começa em zero e a rotina atribui 1.', 'volatile int evento = 0;\nvoid interrupcao(void) {\n  evento = 1;\n}\n/* rotina chamada uma vez */'),
        escolha('O que pode ocorrer numa leitura de vários bytes interrompida no meio, se a plataforma não a tornar atômica?', 'Obter uma mistura de partes antigas e novas', ['A leitura sempre se corrige', 'A variável vira constante', 'A interrupção deixa de existir'], 'Partes podem ser lidas antes e depois da atualização; use o mecanismo de sincronização da plataforma.'),
        tf('A forma correta de proteger dados compartilhados depende da plataforma e do contexto.', true, 'Pode ser necessário um acesso atômico ou uma seção crítica apropriada à plataforma.'),
        escolha('Qual propriedade volatile não fornece por si só?', 'Sincronização completa entre contextos', ['Acessos observáveis conforme a implementação', 'Possibilidade de qualificar uma variável', 'Uso em acesso a hardware'], 'Volatile não substitui atomicidade, exclusão mútua nem os mecanismos de sincronização adequados.'),
      ] },
      { card: { title: 'Const e responsabilidades', body: 'Const restringe modificações por aquele acesso no programa; volatile indica que acessos têm efeitos observáveis. Os qualificadores podem coexistir, por exemplo num registrador de status somente para leitura pelo programa, mas alterado pelo hardware.', visual: code('const volatile unsigned int *status;\nunsigned int copia = *status;', undefined, 'Status de hardware') }, exercises: [
        escolha('O que const expressa em um objeto declarado constante?', 'O programa não deve modificá-lo por esse nome', ['O hardware nunca pode mudar', 'Acesso sempre atômico', 'Interrupções desativadas'], 'Const impede a atribuição por esse acesso; não garante que uma fonte externa jamais altere o valor.'),
        tf('Const e volatile podem qualificar o mesmo acesso.', true, 'O programa pode apenas ler um valor que o hardware atualiza externamente.'),
        escolha('Por que ler um registrador de status do hardware como const volatile?', 'O programa lê sem escrever e o hardware pode alterá-lo', ['O hardware fica impedido de atualizá-lo', 'Toda leitura se torna atômica', 'Nenhum acesso à memória ocorre'], 'Const restringe escrita pelo programa; volatile torna os acessos relevantes para a implementação.'),
        gen(rng => { const n = randInt(rng, 1, 7); return visualNum('O status foi inicializado com o valor mostrado. Qual é a cópia?', n, `A cópia recebe o valor lido, ${n}; suponha que não haja mudança entre as operações.`, `const volatile unsigned int status = ${n};\nunsigned int copia = status;`); }),
        escolha('Para uma contagem compartilhada que pode ser atualizada durante a leitura, qual estratégia é adequada?', 'Usar mecanismo atômico ou seção crítica da plataforma', ['Acrescentar apenas const', 'Acrescentar apenas volatile', 'Ignorar atualizações'], 'A estratégia deve impedir leituras inconsistentes e obedecer às regras da plataforma.'),
        visualNum('Qual é o valor da cópia, supondo nenhuma atualização externa?', 5, 'A leitura do objeto qualificado devolve 5, que é atribuído à cópia.', 'const volatile unsigned int status = 5;\nunsigned int copia = status;'),
        order('Ordene uma leitura protegida em uma plataforma que usa seção crítica:', ['Entrar na seção crítica', 'Copiar o dado compartilhado', 'Sair da seção crítica', 'Processar a cópia'], 'Proteja a cópia contra a interrupção relevante e processe o valor local após sair da seção crítica.'),
      ] },
    ] },
  ],
};

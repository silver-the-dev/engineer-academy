import { cLab, codePuzzle as puzzle, functionLab as fn, program, type PracticeByLesson } from '../../codePractice';

export const cPractice: PracticeByLesson = {
  'lc-base-prog': [
    program('Edite a mensagem para que o programa escreva **Ola, C!**. Rode o código para conferir.', 'printf("Ola!\\n");\nreturn 0;', 'printf("Ola, C!\\n");\nreturn 0;', 'Ola, C!\n', 'O texto entre aspas vira a saída. A sequência barra invertida + n muda de linha.'),
    program('Conserte a sintaxe: o programa deve escrever **Pronto** e terminar com sucesso.', 'printf("Pronto\\n")\nreturn 0;', 'printf("Pronto\\n");\nreturn 0;', 'Pronto\n', 'O ponto e vírgula encerra a chamada de printf.'),
  ],
  'lc-base-tipos': [
    program('A variável pulsos já tem 3. Some mais 4 pulsos e imprima o total.', 'int pulsos = 3;\nprintf("%d\\n", pulsos);', 'int pulsos = 3;\npulsos += 4;\nprintf("%d\\n", pulsos);', '7\n', 'A atribuição com += lê o valor atual e soma os novos pulsos.'),
    puzzle('Monte o trecho que conserva a parte decimal da divisão de 5 por 2 e imprime o resultado com uma casa.', ['double razao = 5 / 2.0;', 'printf("%.1f\\n", razao);'], ['double razao = 5 / 2;', 'printf("%d\\n", razao);'], 'O literal 2.0 faz a divisão em ponto flutuante. Use %.1f para uma casa decimal.'),
  ],
  'lc-base-oper': [
    fn('Calcule o **dobro da soma** de a e b. A função será testada com três pares.', 'dobro(int a, int b)', 'return 2 * a + b;', 'return 2 * (a + b);', [[[3, 4], 14], [[0, 5], 10], [[-2, 2], 0]], 'Agrupe a soma antes da multiplicação.'),
    fn('Um pacote comporta 5 peças. Devolva quantas peças sobram depois de montar todos os pacotes completos.', 'sobras(int pecas)', 'return pecas / 5;', 'return pecas % 5;', [[[17], 2], [[20], 0], [[4], 4]], 'O operador % devolve o resto da divisão inteira.'),
  ],
  'lc-base-io': [
    program('Imprima exatamente **Pulsos: 12**, usando a variável n com printf.', 'int n = 12;\nprintf("%d\\n", n);', 'int n = 12;\nprintf("Pulsos: %d\\n", n);', 'Pulsos: 12\n', 'O formato mistura texto literal e %d, que é substituído pelo inteiro.'),
    program('Mostre o mesmo valor duas vezes, uma em decimal e outra em hexadecimal minúsculo. A saída deve ser **26 = 1a**.', 'int x = 26;\nprintf("%d = %d\\n", x, x);', 'int x = 26;\nprintf("%d = %x\\n", x, x);', '26 = 1a\n', 'O especificador %x converte o inteiro para hexadecimal minúsculo.'),
  ],
  'lc-fluxo-if': [
    fn('O alarme deve devolver 1 quando a temperatura for **30 ou mais**. Senão, devolva 0.', 'alarme(int temp)', 'if (temp > 30) return 1;\nreturn 0;', 'if (temp >= 30) return 1;\nreturn 0;', [[[29], 0], [[30], 1], [[31], 1]], 'A condição inclui o limite de 30.'),
    fn('Autorize o motor só se o botão está ativo e a proteção está fechada. Cada entrada é 0 ou 1.', 'motor(int botao, int fechado)', 'return botao || fechado;', 'return botao && fechado;', [[[0, 0], 0], [[0, 1], 0], [[1, 0], 0], [[1, 1], 1]], 'Com &&, as duas condições precisam ser verdadeiras.'),
  ],
  'lc-fluxo-switch': [
    puzzle('Monte um switch: modo 1 liga o LED; outros valores desligam. Evite executar os dois ramos.', ['switch (modo) {', '  case 1: digitalWrite(13, HIGH); break;', '  default: digitalWrite(13, LOW);', '}'], ['  case 1: digitalWrite(13, HIGH);', '  default: digitalWrite(13, HIGH);'], 'O break encerra o ramo 1 antes de chegar a default.'),
    puzzle('Defina os modos e trate LIGADO com um ramo exclusivo. A função desligar cobre todos os demais modos.', ['enum Modo { PARADO, LIGADO };', 'switch (modo) {', '  case LIGADO: ligar(); break;', '  default: desligar();', '}'], ['  case PARADO: ligar(); break;', '  case LIGADO: ligar();'], 'O enum dá nomes aos valores. Declare os nomes antes do switch.'),
  ],
  'lc-fluxo-while': [
    fn('Conte quantas vezes é preciso dividir n por 2 até chegar a 1 ou 0.', 'passos(int n)', 'int total = 0;\nwhile (n > 1) {\n  n /= 2;\n}\nreturn total;', 'int total = 0;\nwhile (n > 1) {\n  n /= 2;\n  total++;\n}\nreturn total;', [[[1], 0], [[2], 1], [[7], 2], [[16], 4]], 'Incremente o contador dentro do laço, uma vez por divisão.'),
    puzzle('Monte um do-while que tente ler pelo menos uma vez e repita enquanto leitura for negativa.', ['do {', '  leitura = ler();', '} while (leitura < 0);'], ['} while (leitura >= 0);', '  leitura = 0;'], 'No do-while, o corpo executa antes da primeira checagem.'),
  ],
  'lc-fluxo-for': [
    fn('Some os números de **1 até n**, incluindo n. Se n for zero, devolva zero.', 'soma(int n)', 'int total = 0;\nfor (int i = 1; i < n; i++) {\n  total += i;\n}\nreturn total;', 'int total = 0;\nfor (int i = 1; i <= n; i++) {\n  total += i;\n}\nreturn total;', [[[0], 0], [[1], 1], [[5], 15], [[10], 55]], 'Use i <= n para incluir o último termo.'),
    puzzle('Passe pelos 8 índices. Pare ao encontrar o primeiro −1, pule zeros e some os demais valores.', ['for (int i = 0; i < 8; i++) {', '  if (v[i] == -1) break;', '  if (v[i] == 0) continue;', '  soma += v[i];', '}'], ['  if (v[i] == -1) continue;', 'for (int i = 0; i <= 8; i++) {'], 'break sai do laço, continue pula só a iteração atual.'),
  ],
  'lc-func-def': [
    fn('Implemente a área de um retângulo inteiro. A função deve devolver o produto de largura e altura.', 'area(int largura, int altura)', 'return 0;', 'return largura * altura;', [[[2, 4], 8], [[5, 3], 15], [[0, 7], 0]], 'Os parâmetros recebem os dados de cada chamada. return entrega o produto.'),
    cLab('A função dobro já existe. Use-a nas duas entradas e devolva a soma dos resultados.', {
      starter: 'int dobro(int x) { return 2 * x; }\n\nint total(int a, int b) {\n  return a + b;\n}',
      entry: 'total', cases: [{ args: [3, 5], value: 16 }, { args: [1, -1], value: 0 }, { args: [0, 4], value: 8 }],
    }, 'int dobro(int x) { return 2 * x; }\n\nint total(int a, int b) {\n  return dobro(a) + dobro(b);\n}', 'Cada chamada de dobro recebe uma entrada. Some os dois valores retornados.'),
  ],
  'lc-func-escopo': [
    fn('Corrija a função para que o bloco interno **atualize** o contador de fora em vez de criar outro com o mesmo nome.', 'contar(int ativa)', 'int total = 0;\nif (ativa) {\n  int total = 1;\n}\nreturn total;', 'int total = 0;\nif (ativa) {\n  total = 1;\n}\nreturn total;', [[[0], 0], [[1], 1]], 'Dentro do bloco, int total declara outra variável. Atribuir sem int atualiza a de fora.'),
    puzzle('Monte uma função que guarda a contagem entre chamadas e devolve o total já incrementado.', ['int proximo(void) {', '  static int n = 0;', '  n++;', '  return n;', '}'], ['  int n = 0;', '  return 0;'], 'static preserva o valor da variável local entre chamadas.'),
  ],
  'lc-func-mod': [
    puzzle('Monte o cabeçalho conta.h com proteção contra inclusão repetida e um protótipo público.', ['#ifndef CONTA_H', '#define CONTA_H', 'int dobro(int x);', '#endif'], ['#ifdef CONTA_H', 'int dobro(int x) { return 2 * x; }'], 'Na primeira inclusão a macro não existe. A definição evita repetir o corpo do cabeçalho nas próximas.'),
    puzzle('Monte conta.c: importe o próprio cabeçalho e implemente a função anunciada nele.', ['#include "conta.h"', 'int dobro(int x) {', '  return 2 * x;', '}'], ['int dobro(int x);', '  return x + 2;'], 'A implementação inclui seu cabeçalho para conferir a assinatura declarada.'),
  ],
  'lc-dados-vet': [
    puzzle('Monte uma soma dos quatro valores do vetor v. O acumulador começa em zero.', ['int soma = 0;', 'for (int i = 0; i < 4; i++) {', '  soma += v[i];', '}'], ['for (int i = 1; i <= 4; i++) {', '  soma = v[i];'], 'O primeiro índice é 0 e o último é 3. Use += para acumular.'),
    puzzle('Monte o trecho que primeiro copia o elemento de índice 0 para temp e então troca os elementos 0 e 1.', ['int temp = v[0];', 'v[0] = v[1];', 'v[1] = temp;'], ['int temp = v[1];', 'v[1] = v[0];'], 'Guarde o valor antigo de v[0] antes de sobrescrevê-lo.'),
  ],
  'lc-dados-str': [
    puzzle('Monte uma string com espaço para **Oi** e o terminador. Depois imprima o texto.', ['char msg[3] = "Oi";', 'printf("%s\\n", msg);'], ['char msg[2] = "Oi";', 'printf("%c\\n", msg);'], 'A string precisa de um elemento extra para o byte zero. %s imprime até esse terminador.'),
    puzzle('Monte um laço que conta os caracteres antes do primeiro byte zero.', ['int n = 0;', "while (msg[n] != '\\0') {", '  n++;', '}'], ["while (msg[n] == '\\0') {", '  n = 0;'], 'Percorra a string até encontrar o terminador sem contá-lo.'),
  ],
  'lc-dados-pont': [
    puzzle('Declare valor, aponte p para seu endereço e troque o conteúdo apontado para 7.', ['int valor = 3;', 'int *p = &valor;', '*p = 7;'], ['int *p = valor;', 'p = 7;'], '&valor obtém o endereço. *p escreve no objeto apontado.'),
    puzzle('Monte a função que soma 1 ao objeto apontado. A função só escreve se o ponteiro for válido e diferente de NULL.', ['void inc(int *p) {', '  if (p != NULL) {', '    (*p)++;', '  }', '}'], ['  if (p == NULL) {', '    p++;'], 'Teste contra NULL antes da desreferência. Os parênteses fazem o incremento atuar no valor.'),
  ],
  'lc-dados-struct': [
    puzzle('Defina o tipo Ponto e então crie uma instância com x igual a 2 e y igual a 5.', ['typedef struct { int x; int y; } Ponto;', 'Ponto p = { .x = 2, .y = 5 };'], ['Ponto p = { .x = 5, .y = 2 };', 'typedef int Ponto;'], 'A declaração do tipo vem antes da instância. Os inicializadores nomeiam cada campo.'),
    puzzle('Monte uma função que atualiza o campo x de um Ponto recebido por ponteiro válido.', ['void mover(Ponto *p) {', '  p->x += 1;', '}'], ['  p.x += 1;', '  p->y += 1;'], 'Use -> para acessar um campo por meio do ponteiro.'),
  ],
  'lc-bits-fixos': [
    puzzle('Monte o trecho que usa o tipo de **8 bits sem sinal** da biblioteca padrão e incrementa a contagem.', ['#include <stdint.h>', 'uint8_t n = 255;', 'n++;'], ['int8_t n = 255;', '#include <stdio.h>'], 'uint8_t tem faixa 0 a 255. Ao converter 256 de volta para o tipo, o resultado é 0.'),
    fn('Calcule um incremento circular de 8 bits **sem usar uint8_t**: devolva 0 depois de 255.', 'proximo(int n)', 'return n + 1;', 'return (n + 1) & 255;', [[[0], 1], [[127], 128], [[255], 0]], 'A máscara 255 conserva apenas os oito bits inferiores.'),
  ],
  'lc-bits-oper': [
    fn('Ative o bit 2, de valor 4, mantendo todos os outros bits como chegaram.', 'ativar(int n)', 'return n & 4;', 'return n | 4;', [[[0], 4], [[4], 4], [[9], 13], [[15], 15]], 'OR força o bit da máscara a 1 e preserva os demais.'),
    fn('Extraia o nibble superior de um byte não negativo. Por exemplo, 0xA3 vira 10.', 'alto(int n)', 'return n & 15;', 'return (n >> 4) & 15;', [[[0], 0], [[163], 10], [[255], 15], [[16], 1]], 'Desloque quatro posições e mantenha os quatro bits inferiores.'),
  ],
  'lc-bits-masc': [
    fn('Limpe somente o bit 3, de valor 8. Preserve os outros bits.', 'limpar(int reg)', 'return reg & 8;', 'return reg & ~8;', [[[8], 0], [[15], 7], [[16], 16], [[0], 0]], 'Inverta a máscara e faça AND para zerar apenas o bit selecionado.'),
    fn('Alterne apenas o bit 0 a cada chamada: 1 vira 0 e 0 vira 1.', 'alternar(int reg)', 'return reg | 1;', 'return reg ^ 1;', [[[0], 1], [[1], 0], [[6], 7], [[9], 8]], 'XOR com 1 troca o estado daquele bit.'),
  ],
  'lc-bits-estado': [
    fn('O LED só alterna o estado quando chega um evento. estado e evento valem 0 ou 1.', 'transicao(int estado, int evento)', 'return estado;', 'if (evento) return !estado;\nreturn estado;', [[[0, 0], 0], [[1, 0], 1], [[0, 1], 1], [[1, 1], 0]], 'Sem evento, conserve o estado. Com evento, inverta-o.'),
    puzzle('Ao pressionar, passe de ESPERA para ATIVO. Estruture o trecho para atualizar somente quando a condição for verdadeira.', ['if (estado == ESPERA && pressionado) {', '  estado = ATIVO;', '}'], ['if (estado == ATIVO && pressionado) {', '  estado = ESPERA;'], 'A transição depende tanto do estado atual quanto do evento.'),
  ],
  'lc-bits-volatile': [
    puzzle('Monte a flag compartilhada com a interrupção. A rotina deve apenas registrar que o evento aconteceu.', ['volatile int evento = 0;', 'void aoEvento(void) {', '  evento = 1;', '}'], ['const int evento = 0;', '  evento = 0;'], 'volatile avisa que o valor pode mudar de modo assíncrono. Não torna operações atômicas.'),
    puzzle('Declare um limite constante de 500 e compare a leitura com ele para ligar o LED acima do limite.', ['const int limite = 500;', 'if (leitura > limite) {', '  ligarLED();', '}'], ['if (leitura < limite) {', '  desligarLED();'], 'const protege o limite contra atribuições. O teste usa > para excluir 500.'),
  ],
};

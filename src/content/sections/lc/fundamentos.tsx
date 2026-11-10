import type { UnitDef } from '../../types';
import { code, fill, gen, inter, match, mcq, num, order, tf } from '../../helpers';
import { fnLab } from '../../visuals';
import { randInt } from '../../../lib/random';

// O controle representa um valor inteiro; o gráfico mostra sua transformação.
const lab = (factor: number, offset = 0) => fnLab({
  f: (x) => factor * x + offset,
  params: [{ key: 'n', label: 'valor', min: 0, max: 10, step: 1, value: 1 }],
  view: { xMin: 0, xMax: 10, yMin: 0, yMax: 12 },
  info: (p) => `Valor escolhido: ${p.n} · resultado: ${factor * p.n + offset}`,
  extra: () => null,
});
// O parâmetro é a entrada; a informação do gráfico calcula o resultado.
const ajuste = (prompt: string, factor: number, offset: number, target: number) => {
  const v = lab(factor, offset);
  return inter(prompt, 'plot', v.props, (v) => factor * v.p.n + offset === target,
    `Escolha ${ (target - offset) / factor }.`,
    `O resultado é ${factor} vezes o valor escolhido mais ${offset}; para obter ${target}, escolha ${(target - offset) / factor}.`);
};

export const cFundamentos: UnitDef = {
  id: 'lc-base', title: 'Fundamentos de C', icon: '🔤',
  subtitle: 'Do primeiro programa à saída formatada',
  source: 'Passo 2 — Eletrônica Completa · Fase 9: Programação em C para Embarcados',
  guide: 'Um arquivo fonte é traduzido e ligado antes de executar. Tipos definem como os valores são representados; operações inteiras preservam a divisão inteira. A saída formatada deve usar especificadores compatíveis com os argumentos.',
  lessons: [
    {
      id: 'lc-base-prog', title: 'Primeiro programa e compilação', parts: [
        {
          card: [
            { title: 'Uma primeira execução', body: 'O programa começa pela função principal. A biblioteca declarada no início fornece a declaração da função de saída. A instrução de retorno informa sucesso ao ambiente.', visual: code('#include <stdio.h>\n\nint main(void) {\n  printf("Ola!\\n");\n  return 0;\n}', [3, 4], 'primeiro.c') },
            { title: 'Experimente um valor', body: 'Mova o controle para representar quantas vezes uma mensagem seria exibida. A leitura mostra esse mesmo número; o gráfico é um modelo da contagem, não um compilador.', visual: lab(1) },
          ],
          exercises: [
            mcq('Qual função é o ponto de entrada do programa mostrado?', ['main', 'printf', 'stdio', 'return'], 0, 'A execução de um programa C hospedado começa em main.'),
            tf('O arquivo fonte é um texto que o programador pode editar.', true, 'O arquivo fonte guarda as instruções escritas em C.'),
            mcq('O que a linha destacada de saída mostra antes da quebra de linha?', ['Ola!', 'main', '0', 'stdio'], 0, 'A função de saída escreve os caracteres entre aspas.', { visual: code('#include <stdio.h>\nint main(void) {\n  printf("Ola!\\n");\n  return 0;\n}', [3], 'Saída') }),
            fill('Complete a ideia:', 'A função ___ inicia o programa.', ['main'], ['printf', 'arquivo', 'compilador'], 'A função main é o ponto de entrada no ambiente hospedado.'),
            order('Ordene o ciclo de trabalho:', ['Escrever o arquivo fonte', 'Compilar e ligar o programa', 'Executar o programa', 'Observar a saída'], 'Primeiro escrevemos, depois traduzimos e ligamos, executamos e observamos o resultado.'),
            gen((rng) => { const n = randInt(rng, 2, 8); return num('Quantas linhas iguais aparecem nesta listagem de saída?', n, `Há ${n} chamadas, cada uma com uma quebra de linha, portanto aparecem ${n} linhas.`, { visual: code(Array(n).fill('printf("Oi\\n");').join('\n'), [], 'Trecho de main') }); }),
            ajuste('Ajuste o controle para representar 4 mensagens.', 1, 0, 4),
          ],
        },
        {
          card: { title: 'Do fonte ao executável', body: 'O pré-processador trata diretivas; o compilador traduz o código; o ligador reúne as partes necessárias. Então o sistema executa o resultado. Erros de sintaxe precisam ser corrigidos antes da execução. Em embarcados, a ferramenta de compilação pode gerar código para outro processador.', visual: code('gcc primeiro.c -o primeiro\n./primeiro', [], 'Exemplo de terminal') },
          exercises: [
            mcq('Qual ferramenta traduz o código C?', ['compilador', 'editor de imagens', 'planilha', 'alto-falante'], 0, 'O compilador traduz o código fonte para uma representação executável pelo alvo, com a etapa de ligação.'),
            tf('Um erro de sintaxe pode impedir a geração do executável.', true, 'O compilador precisa entender as instruções para traduzi-las.'),
            mcq('Qual problema aparece na linha destacada?', ['falta ponto e vírgula', 'falta o nome da função', 'há duas funções principais', 'há um número negativo'], 0, 'Uma instrução de retorno deve terminar com ponto e vírgula.', { visual: code('int main(void) {\n  return 0\n}', [2], 'Erro de sintaxe') }),
            order('Ordene as etapas conceituais:', ['Pré-processamento', 'Compilação', 'Ligação', 'Execução'], 'As diretivas são processadas, o código é traduzido, as partes são ligadas e o programa executa.'),
            fill('Complete:', 'O ___ reúne as partes traduzidas e bibliotecas necessárias.', ['ligador'], ['editor', 'sensor', 'teclado'], 'O ligador resolve referências e reúne as partes do programa.'),
            gen((rng) => { const n = randInt(rng, 2, 8); return num(`Um projeto tem ${n} arquivos fonte e cada um é compilado uma vez. Quantas compilações de arquivo são feitas?`, n, `Uma por arquivo: ${n} compilações; a ligação vem depois.`); }),
            tf('Compilar para um microcontrolador a partir de um PC pode exigir uma ferramenta para o processador alvo.', true, 'A arquitetura do alvo pode ser diferente da arquitetura do computador que compila.'),
          ],
        },
      ],
    },
    {
      id: 'lc-base-tipos', title: 'Tipos e variáveis', parts: [
        {
          card: [
            { title: 'Guardar valores', body: 'Uma variável tem nome e tipo. Um inteiro guarda valores inteiros; tipos de ponto flutuante representam aproximações de números reais; um caractere pode guardar um símbolo. Inicializar dá um valor antes da leitura.', visual: code("int pulsos = 3;\nfloat tensao = 2.5f;\nchar letra = 'A';", [], 'Declarações') },
            { title: 'Contagem', body: 'Explore uma contagem de pulsos pelo controle. O gráfico representa a identidade entre o valor escolhido e o número exibido.', visual: lab(1) },
          ],
          exercises: [
            mcq('Qual tipo da listagem representa um inteiro?', ['int', 'float', 'char', 'main'], 0, 'O tipo int representa valores inteiros.', { visual: code('int pulsos = 3;\nfloat tensao = 2.5f;\nchar letra = \'A\';', [], 'Tipos') }),
            tf('Uma variável deve receber um valor válido antes de ser lida.', true, 'Ler uma variável automática não inicializada pode produzir comportamento indefinido.'),
            num('Qual o valor final de pulsos?', 5, 'A variável começa em 3 e recebe 3 + 2, isto é, 5.', { visual: code('int pulsos = 3;\npulsos = pulsos + 2;', [2], 'Atualização') }),
            fill('Complete:', 'Dar o primeiro valor a uma variável é ___ a variável.', ['inicializar'], ['compilar', 'imprimir', 'ligar'], 'Inicialização associa um valor inicial à variável em sua definição.'),
            match('Associe tipo e uso típico:', [['int', 'contagem inteira'], ['float', 'medida aproximada'], ['char', 'um caractere']], 'Inteiros servem a contagens; ponto flutuante aproxima medidas; char pode representar um caractere.'),
            gen((rng) => { const a = randInt(rng, 1, 6); const b = randInt(rng, 1, 4); return num('Qual é o valor final da variável?', a + b, `Ela começa em ${a} e aumenta ${b}, chegando a ${a + b}.`, { visual: code(`int x = ${a};\nx = x + ${b};`, [], 'Atualização') }); }),
            ajuste('Ajuste a contagem para 6 pulsos.', 1, 0, 6),
          ],
        },
        {
          card: { title: 'Conversões e tamanhos', body: 'Ao atribuir um valor fracionário finito representável a um inteiro, a parte fracionária é descartada em direção a zero. Em operações mistas, o inteiro pode ser convertido para ponto flutuante. Os tamanhos de tipos comuns dependem da implementação; em embarcados, tipos de largura definida ajudam quando disponíveis.', visual: code('#include <stdint.h>\nint a = 3.9;\ndouble b = 5 / 2;\ndouble c = 5 / 2.0;\nuint8_t porta = 200;', [2, 3, 4], 'Conversões') },
          exercises: [
            num('Qual o valor inteiro armazenado em a?', 3, 'Na atribuição ao inteiro, 3,9 perde a parte fracionária e vira 3.', { visual: code('int a = 3.9;', [], 'Conversão') }),
            num('Qual valor é armazenado em b?', 2, 'A divisão entre inteiros produz 2 antes da conversão para double.', { visual: code('double b = 5 / 2;', [], 'Divisão') }),
            mcq('Qual o valor de c?', ['2,5', '2', '3', '0'], 0, 'Um operando é de ponto flutuante, então a divisão produz 2,5.', { visual: code('double c = 5 / 2.0;', [], 'Divisão mista') }),
            tf('O tamanho de int em bytes é obrigatoriamente o mesmo em todo sistema C.', false, 'A implementação escolhe o tamanho dentro dos requisitos do padrão; não suponha uma largura fixa.'),
            mcq('Quando disponível, qual a largura de uint8_t?', ['8 bits', '8 bytes', '16 bits', '32 bits'], 0, 'O tipo inteiro sem sinal de largura exata uint8_t tem 8 bits e é declarado em stdint.h.'),
            gen((rng) => { const n = randInt(rng, 2, 9); return num('Qual inteiro resulta da atribuição?', n, `A parte fracionária de ${n},7 é descartada, restando ${n}.`, { visual: code(`int a = ${n}.7;`, [], 'Conversão') }); }),
            mcq('Qual intervalo um uint8_t disponível pode representar?', ['0 a 255', '−128 a 127', '0 a 256', '−255 a 255'], 0, 'Oito bits sem sinal representam 256 valores, de 0 até 255.'),
          ],
        },
      ],
    },
    {
      id: 'lc-base-oper', title: 'Operadores e expressões', parts: [
        {
          card: [
            { title: 'Prioridade das operações', body: 'Parênteses agrupam primeiro. Multiplicação, divisão e resto têm prioridade sobre soma e subtração; operadores do mesmo nível associam da esquerda para a direita.', visual: code('int a = 2 + 3 * 4;\nint b = (2 + 3) * 4;', [], 'Precedência') },
            { title: 'Entrada e resultado', body: 'O controle escolhe uma entrada; o modelo dobra a entrada e soma um. Experimente diferentes valores e acompanhe o resultado.', visual: lab(2, 1) },
          ],
          exercises: [
            num('Qual o valor de a?', 14, 'Primeiro 3 vezes 4 é 12; depois 2 + 12 = 14.', { visual: code('int a = 2 + 3 * 4;', [], 'Precedência') }),
            num('Qual o valor de b?', 20, 'Os parênteses dão 2 + 3 = 5; depois 5 vezes 4 = 20.', { visual: code('int b = (2 + 3) * 4;', [], 'Parênteses') }),
            tf('Parênteses podem alterar a ordem de avaliação de uma expressão aritmética.', true, 'Eles agrupam as operações e podem mudar o valor obtido.'),
            fill('Complete:', 'Multiplicação tem prioridade ___ que adição.', ['maior'], ['menor', 'igual', 'desconhecida'], 'Multiplicação é feita antes da soma quando não há parênteses que alterem o agrupamento.'),
            num('Qual o valor final?', 5, 'As divisões associam à esquerda: 20 dividido por 2 dá 10, depois 10 dividido por 2 dá 5.', { visual: code('int x = 20 / 2 / 2;', [], 'Associação') }),
            gen((rng) => { const a = randInt(rng, 1, 4); const b = randInt(rng, 2, 4); return num('Qual o valor de x?', a + 2 * b, `Primeiro 2 vezes ${b} é ${2 * b}; somando ${a}, obtemos ${a + 2 * b}.`, { visual: code(`int x = ${a} + 2 * ${b};`, [], 'Expressão') }); }),
            ajuste('Ajuste a entrada para obter resultado 9 no modelo.', 2, 1, 9),
          ],
        },
        {
          card: { title: 'Quociente e resto', body: 'Com dois operandos inteiros, a divisão descarta a parte fracionária em direção a zero. O operador de resto atua sobre inteiros. O divisor nunca pode ser zero. Uma conversão antes da divisão permite obter resultado fracionário.', visual: code('int q = 17 / 5;\nint r = 17 % 5;\ndouble x = 17 / 5.0;', [], 'Divisão e resto') },
          exercises: [
            num('Qual o quociente inteiro?', 3, 'Cinco cabe três vezes em 17; a parte fracionária é descartada.', { visual: code('int q = 17 / 5;', [], 'Quociente') }),
            num('Qual o resto?', 2, '17 é 3 vezes 5 mais 2; portanto o resto é 2.', { visual: code('int r = 17 % 5;', [], 'Resto') }),
            mcq('Qual valor de x?', ['3,4', '3', '4', '2'], 0, 'O divisor de ponto flutuante faz a divisão produzir 3,4.', { visual: code('double x = 17 / 5.0;', [], 'Divisão real') }),
            tf('Dividir um inteiro por zero é uma operação válida em C.', false, 'Divisão ou resto por zero causa comportamento indefinido.'),
            num('Qual o valor de q?', -3, 'A divisão inteira trunca em direção a zero: menos 17 dividido por 5 resulta em menos 3.', { visual: code('int q = -17 / 5;', [], 'Inteiro negativo') }),
            gen((rng) => { const d = randInt(rng, 2, 5); const q = randInt(rng, 2, 5); const r = randInt(rng, 1, d - 1); const a = d * q + r; return num('Qual é o resto da divisão?', r, `${a} = ${d} vezes ${q} mais ${r}; o resto é ${r}.`, { visual: code(`int r = ${a} % ${d};`, [], 'Resto') }); }),
            num('Qual é o valor final de x?', 7, 'O resto de 17 por 5 é 2; multiplicado por 3 dá 6; mais 1 resulta em 7.', { visual: code('int x = 1 + 17 % 5 * 3;', [], 'Expressão') }),
          ],
        },
      ],
    },
    {
      id: 'lc-base-io', title: 'Saída formatada com printf', parts: [
        {
          card: [
            { title: 'Texto e valores', body: 'A função de saída usa uma cadeia de formato. Cada especificador indica como apresentar um argumento; a ordem e os tipos precisam corresponder. Uma sequência de escape encerra a linha.', visual: code('#include <stdio.h>\nint main(void) {\n  int n = 7;\n  printf("Pulsos: %d\\n", n);\n  return 0;\n}', [4], 'Saída formatada') },
            { title: 'Número exibido', body: 'Escolha um inteiro no controle. O modelo exibe o mesmo número, como uma saída decimal de uma contagem.', visual: lab(1) },
          ],
          exercises: [
            mcq('Qual texto aparece antes da quebra de linha?', ['Pulsos: 7', 'Pulsos: n', 'Pulsos: %d', '7: Pulsos'], 0, 'O especificador decimal é substituído pelo valor inteiro 7.', { visual: code('int n = 7;\nprintf("Pulsos: %d\\n", n);', [], 'Saída') }),
            mcq('Qual especificador apresenta um int em decimal?', ['%d', '%f', '%c', '%s'], 0, 'O especificador %d interpreta o argumento como int e o apresenta em decimal.'),
            tf('A ordem dos argumentos deve corresponder à ordem dos especificadores.', true, 'Cada especificador consome o argumento correspondente na sequência.'),
            fill('Complete:', 'A sequência de escape de nova linha termina a linha e começa outra; seu nome é ___.', ['barra n'], ['barra t', 'porcento d', 'aspas'], 'A sequência formada por barra invertida seguida de n produz uma quebra de linha.'),
            num('Qual número aparece na saída?', 9, 'A variável recebe 4 + 5 = 9 e o especificador decimal imprime esse valor.', { visual: code('int n = 4 + 5;\nprintf("%d", n);', [], 'Saída') }),
            gen((rng) => { const n = randInt(rng, 2, 9); return num('Qual número aparece na saída?', n * 2, `A variável é ${n}; seu dobro é ${n * 2}, valor mostrado em decimal.`, { visual: code(`int n = ${n};\nprintf("%d", 2 * n);`, [], 'Saída') }); }),
            ajuste('Ajuste o valor para exibir a contagem 8.', 1, 0, 8),
          ],
        },
        {
          card: { title: 'Formatos compatíveis', body: 'Use %d para int, %u para unsigned int, %c para caractere e %s para cadeia terminada em caractere nulo. Em printf, %f recebe um double: argumentos float são promovidos automaticamente. A precisão em %.2f pede duas casas após o ponto. Um percentual literal é escrito com %% na cadeia de formato.', visual: code('int n = 4;\ndouble v = 2.5;\nprintf("%d %.2f\\n", n, v);\nprintf("Carga: 50%%\\n");', [], 'Formatos') },
          exercises: [
            mcq('Qual texto aparece na primeira linha de saída?', ['inteiro 4 seguido de 2.50', 'inteiro 4 seguido de 2.5', '2.50 seguido do inteiro 4', 'inteiro 4 seguido de 2,50'], 0, 'O inteiro aparece primeiro; a precisão pede duas casas decimais. Considere a configuração usual com ponto decimal.', { visual: code('int n = 4;\ndouble v = 2.5;\nprintf("%d %.2f\\n", n, v);', [], 'Formatação') }),
            mcq('Qual especificador mostra um caractere?', ['%c', '%d', '%f', '%u'], 0, '%c mostra o caractere correspondente ao argumento inteiro promovido.'),
            tf('Na chamada de printf, um argumento float é promovido a double.', true, 'Argumentos variádicos passam pelas promoções padrão; float é promovido a double.'),
            mcq('Como se representa um percentual literal na cadeia de formato?', ['%%', '%d', '%f', '%c'], 0, 'Dois sinais de percentual na cadeia de formato produzem um percentual literal.'),
            match('Associe cada especificador ao argumento esperado:', [['%d', 'int'], ['%u', 'unsigned int'], ['%f', 'double'], ['%s', 'cadeia de caracteres']], 'A função usa os especificadores para interpretar os argumentos; tipos incompatíveis causam comportamento indefinido.'),
            gen((rng) => { const n = randInt(rng, 1, 9); return num('Qual número inteiro aparece antes do percentual?', n * 10, `O argumento vale ${n * 10}; o percentual duplicado no formato escreve um único sinal.`, { visual: code(`printf("%d%%", ${n * 10});`, [], 'Percentual') }); }),
            mcq('Qual é o erro da chamada destacada?', ['o argumento inteiro não corresponde ao formato de ponto flutuante', 'falta uma quebra de linha obrigatória', 'a saída deve ter duas variáveis', 'o inteiro precisa ser negativo'], 0, 'O formato de ponto flutuante exige double; passar int causa comportamento indefinido.', { visual: code('int n = 3;\nprintf("%f", n);', [2], 'Tipo incompatível') }),
          ],
        },
      ],
    },
  ],
};

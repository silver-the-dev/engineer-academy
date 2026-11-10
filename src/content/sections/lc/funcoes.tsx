import type { UnitDef } from '../../types';
import { code, fill, gen, inter, mcq, num, order, tf } from '../../helpers';
import { fnLab } from '../../visuals';
import { randInt } from '../../../lib/random';

// O gráfico representa valores, não executa código C.
const lab = (label: string, offset: number) => fnLab({
  view: { xMin: 0, xMax: 6, yMin: 0, yMax: 10 },
  params: [{ key: 'n', label, min: 0, max: 6, step: 1, value: 1 }],
  f: (x) => x + offset,
  info: (p) => `Entrada: ${p.n}; resultado: ${p.n + offset}.`,
});
const desafio = (label: string, offset: number, alvo: number) => {
  const v = lab(label, offset);
  return inter(`Ajuste ${label} para obter resultado ${alvo}.`, 'plot', v.props,
    (v) => v.p.n + offset === alvo, `Use ${alvo - offset}.`,
    `O resultado é a entrada mais ${offset}; portanto a entrada é ${alvo - offset}.`);
};

export const cFuncoes: UnitDef = {
  id: 'lc-func', title: 'Funções e organização do código', icon: '🧩',
  subtitle: 'Divida, reutilize e organize programas em C',
  source: 'Passo 2 — Eletrônica Completa, fase 9: fundamentos de C e organização em funções; módulos e pré-processador como complemento.',
  guide: 'Funções recebem argumentos e podem devolver resultados. Parâmetros comuns recebem cópias dos valores. O escopo limita onde um nome é visível; o tempo de armazenamento determina sua duração. Cabeçalhos compartilham declarações, arquivos de implementação contêm definições e guardas evitam inclusão repetida na mesma unidade de tradução.',
  lessons: [
    {
      id: 'lc-func-def', title: 'Funções, parâmetros e retorno', parts: [
        {
          card: [
            { title: 'Uma função para cada tarefa', body: 'Uma função reúne instruções sob um nome. Na chamada, os argumentos fornecem valores aos parâmetros. O retorno entrega um resultado ao chamador; o tipo antes do nome indica o tipo desse resultado.', visual: code('int dobro(int x) {\n  return 2 * x;\n}\n\nint main(void) {\n  int valor = dobro(3);\n}', [1, 2, 6], 'Uma chamada') },
            { title: 'Experimente a entrada', body: 'O controle representa o argumento; o resultado é a entrada acrescida de dois. O gráfico é um modelo dos valores, não um compilador.', visual: lab('argumento', 2) },
          ],
          exercises: [
            mcq('Na listagem, qual é o argumento passado à função?', ['3', '2', 'valor', '1'], 0, 'A chamada fornece 3 como argumento.', { visual: code('int dobro(int x) {\n  return 2 * x;\n}\nint main(void) {\n  int valor = dobro(3);\n}') }),
            tf('Um parâmetro recebe o valor do argumento correspondente na chamada.', true, 'O argumento é avaliado na chamada e seu valor inicializa o parâmetro.'),
            num('Qual é o valor de resultado ao final?', 8, 'A função multiplica 4 por 2 e retorna 8.', { visual: code('int dobro(int x) {\n  return 2 * x;\n}\nint main(void) {\n  int resultado = dobro(4);\n}') }),
            fill('Complete a ideia: a palavra que devolve um resultado é ___.', '___', ['return'], ['static', 'include', 'define'], 'A palavra return encerra a execução da função e entrega o valor indicado.'),
            desafio('argumento', 2, 6),
            gen((rng) => { const n = randInt(rng, 2, 8); return num('Qual valor fica em resultado?', n * 2, `O argumento é ${n}; seu dobro é ${n * 2}.`, { visual: code(`int dobro(int x) {\n  return 2 * x;\n}\nint main(void) {\n  int resultado = dobro(${n});\n}`) }); }),
            mcq('Qual afirmação descreve uma função sem valor de retorno?', ['Seu tipo de retorno é void.', 'Seu tipo de retorno é sempre int.', 'Ela não pode receber parâmetros.', 'Ela não pode chamar outra função.'], 0, 'O tipo void indica ausência de valor de retorno; a função ainda pode receber parâmetros e chamar outras funções.'),
          ],
        },
        {
          card: { title: 'Cópias e protótipos', body: 'Em C, argumentos são passados por valor: cada parâmetro recebe uma cópia. Alterar essa cópia não altera a variável original. Um protótipo declara o tipo de retorno e os parâmetros antes de uma chamada, permitindo a verificação dos tipos.', visual: code('int soma(int a, int b);\n\nint soma(int a, int b) {\n  return a + b;\n}', [1], 'Protótipo e definição') },
          exercises: [
            tf('Alterar um parâmetro inteiro comum altera automaticamente a variável do chamador.', false, 'O parâmetro inteiro é uma cópia independente; a variável do chamador permanece igual.'),
            num('Após a chamada, quanto vale original?', 4, 'A função altera apenas sua cópia; original continua 4.', { visual: code('void muda(int x) {\n  x = 9;\n}\nint main(void) {\n  int original = 4;\n  muda(original);\n}') }),
            mcq('Para que serve o protótipo antes de uma chamada?', ['Declarar a interface para verificar a chamada.', 'Executar o corpo da função.', 'Reservar uma cópia de cada argumento para sempre.', 'Substituir a definição durante a ligação.'], 0, 'O protótipo informa ao compilador o retorno e os parâmetros; a definição fornece o corpo.'),
            order('Ordene as etapas de uma chamada que usa o retorno.', ['avaliar os argumentos', 'inicializar os parâmetros', 'executar o corpo', 'receber o resultado'], 'Primeiro os argumentos são avaliados; seus valores inicializam os parâmetros, o corpo executa e o resultado retorna.'),
            num('Qual valor fica em resultado?', 9, 'As cópias começam em 3 e 5; a primeira vira 4, então o retorno é 4 + 5 = 9.', { visual: code('int soma(int a, int b) {\n  a = a + 1;\n  return a + b;\n}\nint main(void) {\n  int resultado = soma(3, 5);\n}') }),
            gen((rng) => { const n = randInt(rng, 2, 8); return num('Depois da chamada, quanto vale original?', n, `A função modifica sua cópia, portanto original continua ${n}.`, { visual: code(`void altera(int x) {\n  x = x + 3;\n}\nint main(void) {\n  int original = ${n};\n  altera(original);\n}`) }); }),
            mcq('O que é necessário para tornar disponível uma definição colocada em outro arquivo C?', ['Compilar e ligar os arquivos de implementação.', 'Incluir o arquivo executável no cabeçalho.', 'Declarar a função apenas dentro do seu corpo.', 'Eliminar todos os protótipos.'], 0, 'A declaração permite verificar a chamada; o arquivo com a definição também deve ser compilado e ligado.'),
          ],
        },
      ],
    },
    {
      id: 'lc-func-escopo', title: 'Escopo, static e tempo de vida', parts: [
        {
          card: [
            { title: 'Onde um nome é visível', body: 'Uma variável local declarada em um bloco só pode ser usada dentro de seu escopo. Uma variável declarada fora das funções tem escopo de arquivo a partir de sua declaração. Um nome local pode ocultar outro de escopo externo.', visual: code('int nivel = 2;\n\nvoid tarefa(void) {\n  int nivel = 5;\n  nivel = nivel + 1;\n}', [1, 4, 5], 'Nome local e global') },
            { title: 'Mudança local', body: 'Modele um valor local que aumenta em um; escolha a entrada e acompanhe o resultado.', visual: lab('valor local', 1) },
          ],
          exercises: [
            mcq('Onde uma variável local de bloco é visível?', ['Dentro de seu escopo no bloco.', 'Em todos os arquivos do projeto.', 'Somente em outras funções.', 'Em todo o programa antes de sua declaração.'], 0, 'Seu nome é visível no escopo que começa na declaração e termina no fim do bloco.'),
            tf('Uma variável local pode ocultar uma variável de mesmo nome de escopo externo.', true, 'No escopo interno, o nome local é o encontrado; a variável externa continua existindo.'),
            num('Quanto vale a variável global depois da chamada?', 2, 'A variável local oculta a global e é a única alterada; a global continua 2.', { visual: code('int nivel = 2;\nvoid tarefa(void) {\n  int nivel = 5;\n  nivel = nivel + 1;\n}\nint main(void) {\n  tarefa();\n}') }),
            fill('Complete: o alcance em que um nome é visível chama-se ___.', '___', ['escopo'], ['retorno', 'argumento', 'protótipo'], 'Escopo descreve onde o nome pode ser usado; não determina sozinho por quanto tempo o objeto existe.'),
            desafio('valor local', 1, 5),
            gen((rng) => { const n = randInt(rng, 2, 7); return num('Quanto vale a variável global após a chamada?', n, `A alteração usa a variável local; a global continua ${n}.`, { visual: code(`int valor = ${n};\nvoid tarefa(void) {\n  int valor = 1;\n  valor = valor + 2;\n}\nint main(void) {\n  tarefa();\n}`) }); }),
            mcq('Qual é a consequência de tentar usar fora do bloco um nome local que só foi declarado nesse bloco?', ['O nome não está visível ali.', 'Seu valor passa a ser global automaticamente.', 'O nome vira um protótipo.', 'O compilador sempre reinicia o programa.'], 0, 'A declaração local não torna o nome visível fora do seu escopo.'),
          ],
        },
        {
          card: { title: 'Tempo de armazenamento', body: 'Uma variável local automática normalmente existe durante a execução do bloco. Uma local static mantém seu valor entre chamadas e tem armazenamento durante toda a execução do programa; seu nome continua local. Sem inicializador explícito, ela começa em zero. Em escopo de arquivo, static também restringe a ligação do nome àquela unidade de tradução.', visual: code('int proximo(void) {\n  static int n = 0;\n  n = n + 1;\n  return n;\n}', [2], 'Estado entre chamadas') },
          exercises: [
            tf('Uma variável local static preserva seu valor entre chamadas da função.', true, 'Ela tem duração de armazenamento estática, embora o nome só seja visível no escopo local.'),
            num('Qual é o segundo valor retornado, em chamadas sequenciais?', 2, 'A primeira chamada retorna 1; a segunda parte de 1 e retorna 2.', { visual: code('int proximo(void) {\n  static int n = 0;\n  return ++n;\n}\nint main(void) {\n  int a = proximo();\n  int b = proximo();\n}') }),
            mcq('Qual é o valor inicial de uma variável local static sem inicializador explícito?', ['Zero.', 'Sempre um valor aleatório.', 'O valor do último argumento.', 'O endereço da função.'], 0, 'Objetos com duração de armazenamento estática são inicializados implicitamente a zero quando não há inicializador explícito.'),
            tf('Uma variável local static fica acessível por nome em qualquer outra função.', false, 'A duração é estática, mas o escopo do nome continua sendo o bloco.'),
            num('Depois de três chamadas sequenciais, qual valor é retornado na terceira?', 8, 'O contador começa em 2 e soma 2 em cada chamada: 4, 6 e 8.', { visual: code('int proximo(void) {\n  static int n = 2;\n  n += 2;\n  return n;\n}') }),
            gen((rng) => { const n = randInt(rng, 1, 5); return num('Qual valor retorna a segunda chamada sequencial?', n + 2, `Começa em ${n}; as duas chamadas retornam ${n + 1} e ${n + 2}.`, { visual: code(`int proximo(void) {\n  static int n = ${n};\n  return ++n;\n}`) }); }),
            mcq('Uma função definida com static em escopo de arquivo tem qual ligação?', ['Interna à unidade de tradução.', 'Externa obrigatoriamente a todo o projeto.', 'Nenhuma, pois não pode ser chamada.', 'Ligação com todos os cabeçalhos.'], 0, 'Nesse contexto static dá ligação interna: o nome não é exportado para outras unidades de tradução.'),
          ],
        },
      ],
    },
    {
      id: 'lc-func-mod', title: 'Arquivos .h e .c e o pré-processador', parts: [
        {
          card: [
            { title: 'Separe interface e implementação', body: 'O cabeçalho costuma declarar a interface compartilhada; o arquivo de implementação define as funções. A inclusão insere o conteúdo do cabeçalho durante o pré-processamento. Compile e ligue os arquivos de implementação necessários.', visual: code('// sensor.h\nint ler(void);\n\n// sensor.c\n#include "sensor.h"\nint ler(void) {\n  return 4;\n}', [2, 5, 6], 'Interface e implementação') },
            { title: 'Modelo de leitura', body: 'Represente a leitura de um sensor e uma correção fixa de dois. Ajuste a leitura para observar o valor corrigido.', visual: lab('leitura', 2) },
          ],
          exercises: [
            mcq('Onde geralmente fica a declaração compartilhada de uma função?', ['No cabeçalho.', 'Somente no arquivo executável.', 'Em um comentário do programa.', 'No valor de retorno.'], 0, 'Um cabeçalho fornece declarações para os arquivos que precisam conhecer a interface.'),
            tf('Incluir uma declaração de função dispensa ligar a implementação usada pelo programa.', false, 'A declaração informa a interface; a definição necessária deve estar disponível na ligação.'),
            fill('Complete: a diretiva que inclui um cabeçalho é ___.', '___', ['include'], ['return', 'static', 'void'], 'A diretiva de inclusão insere o conteúdo do arquivo durante o pré-processamento.'),
            desafio('leitura', 2, 7),
            num('Qual valor é retornado pela função definida na listagem?', 4, 'A definição devolve diretamente 4.', { visual: code('// sensor.c\nint ler(void) {\n  return 4;\n}') }),
            gen((rng) => { const n = randInt(rng, 1, 8); return num('Qual valor retorna a leitura corrigida?', n + 2, `A leitura é ${n} e a correção acrescenta 2: ${n + 2}.`, { visual: code(`int ler(void) {\n  return ${n};\n}\nint corrigir(void) {\n  return ler() + 2;\n}`) }); }),
            order('Ordene as etapas gerais para produzir um programa a partir de fontes C.', ['pré-processar', 'compilar', 'ligar'], 'O pré-processador trata diretivas; a compilação traduz as unidades e a ligação reúne as definições necessárias.'),
          ],
        },
        {
          card: { title: 'Macros e guardas', body: 'Uma macro definida pelo pré-processador substitui tokens antes da compilação. Guardas condicionais impedem que o conteúdo de um cabeçalho seja processado repetidas vezes na mesma unidade de tradução. Use nomes de guarda distintos para cabeçalhos distintos.', visual: code('#ifndef SENSOR_H\n#define SENSOR_H\n\n#define LIMITE 10\nint ler(void);\n\n#endif', [1, 2, 4, 7], 'sensor.h') },
          exercises: [
            mcq('Qual é o papel de uma guarda de cabeçalho?', ['Evitar o processamento repetido do conteúdo na mesma unidade de tradução.', 'Impedir qualquer arquivo de incluir o cabeçalho.', 'Compilar o cabeçalho como executável.', 'Garantir que toda função seja chamada.'], 0, 'A primeira inclusão define a macro da guarda; inclusões posteriores na mesma unidade ignoram o conteúdo protegido.'),
            tf('O pré-processador substitui os usos de uma macro de objeto pelos seus tokens de substituição.', true, 'A substituição ocorre durante o pré-processamento, antes da compilação da unidade resultante.'),
            num('Qual é o valor de margem?', 7, 'A macro representa 10; a expressão calcula 10 − 3 = 7.', { visual: code('#define LIMITE 10\nint margem = LIMITE - 3;') }),
            fill('Complete: a diretiva que define uma macro é ___.', '___', ['define'], ['include', 'return', 'static'], 'A diretiva define associa o nome aos tokens de substituição.'),
            order('Ordene as etapas lógicas de uma guarda quando o cabeçalho é incluído pela primeira vez.', ['testar se a macro ainda não foi definida', 'definir a macro da guarda', 'processar as declarações', 'encerrar a região condicional'], 'Na primeira inclusão o teste passa, a macro é definida e as declarações são processadas até o fim da região condicional.'),
            gen((rng) => { const n = randInt(rng, 4, 9); return num('Qual é o valor de margem?', n - 2, `O limite é ${n}; ao subtrair 2, a margem é ${n - 2}.`, { visual: code(`#define LIMITE ${n}\nint margem = LIMITE - 2;`) }); }),
            mcq('Dois cabeçalhos diferentes usam a mesma macro como guarda. Qual problema pode ocorrer?', ['Um deles pode ter seu conteúdo ignorado indevidamente.', 'As duas funções serão automaticamente combinadas.', 'As macros passam a ser variáveis locais.', 'A ligação cria uma segunda chamada para cada função.'], 0, 'Após o primeiro cabeçalho definir a macro, o teste do segundo pode falhar e ocultar suas declarações.'),
          ],
        },
      ],
    },
  ],
};

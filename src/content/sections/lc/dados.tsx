import type { UnitDef } from '../../types';
import { code, fill, gen, inter, mcq, num, order, table, tf } from '../../helpers';
import { fnLab } from '../../visuals';
import { randInt } from '../../../lib/random';

// Modelo de posições ou valores; não executa código C.
const lab = (label: string, offset: number) => fnLab({
  view: { xMin: 0, xMax: 5, yMin: 0, yMax: 10 },
  params: [{ key: 'n', label, min: 0, max: 5, step: 1, value: 0 }],
  f: (x) => x + offset,
  info: (p) => `${label}: ${p.n}; resultado do modelo: ${p.n + offset}.`,
});
const desafio = (label: string, offset: number, alvo: number) => {
  const v = lab(label, offset);
  return inter(`Ajuste ${label} para obter resultado ${alvo}.`, 'plot', v.props,
    (v) => v.p.n + offset === alvo, `Ajuste para ${alvo - offset}.`,
    `O modelo soma ${offset}; ${alvo} menos ${offset} é ${alvo - offset}.`);
};

export const cDados: UnitDef = {
  id: 'lc-dados', title: 'Vetores, ponteiros e structs', icon: '📦',
  subtitle: 'Organize dados e acesse a memória com segurança',
  source: 'Passo 2 — Eletrônica Completa, fase 9: arrays, strings, ponteiros e estruturas para dispositivos.',
  guide: 'Vetores guardam elementos do mesmo tipo em posições consecutivas, indexadas a partir de zero. Strings C terminam no caractere nulo e precisam de espaço para ele. Um ponteiro guarda um endereço; o acesso indireto permite ler ou alterar o objeto apontado. Structs agrupam campos, e typedef cria um apelido de tipo. Respeite os limites e a duração dos objetos.',
  lessons: [
    {
      id: 'lc-dados-vet', title: 'Vetores', parts: [
        {
          card: [
            { title: 'Posições começam em zero', body: 'Um vetor reúne elementos do mesmo tipo em posições consecutivas. Neste exemplo há três leituras: os índices válidos são 0, 1 e 2.', visual: code('int leituras[3] = {4, 7, 9};\nint valor = leituras[1];', [2], 'Leitura de um vetor') },
            { title: 'Mapa da memória', body: 'Cada coluna representa um elemento; a posição 1 contém 7. A tabela mostra valores, não endereços numéricos.', visual: table(['Índice', '0', '1', '2'], [['Valor', 4, 7, 9]]) },
            { title: 'Explore o índice', body: 'Neste modelo, o valor é o índice mais 4. Mova o controle para observar a correspondência; o gráfico não executa C.', visual: lab('índice', 4) },
          ],
          exercises: [
            num('Qual é o primeiro índice de um vetor C?', 0, 'A contagem dos índices começa em zero.'),
            num('Qual valor é armazenado em resultado?', 7, 'A posição 1 é a segunda e contém 7.', { visual: code('int v[3] = {4, 7, 9};\nint resultado = v[1];') }),
            tf('Um vetor de 3 elementos tem índice válido 3.', false, 'Os três índices válidos são 0, 1 e 2; 3 fica fora do vetor.'),
            desafio('índice', 4, 7),
            gen((rng) => { const n = randInt(rng, 3, 9); return num('Qual é o último índice válido?', n - 1, `Com ${n} elementos, os índices vão de 0 a ${n - 1}.`, { visual: code(`int amostras[${n}];`) }); }),
            mcq('Qual é o valor de resultado?', ['13', '8', '5', '10'], 0, 'A posição 0 vale 5 e a posição 2 vale 8; a soma é 13.', { visual: code('int v[3] = {5, 2, 8};\nint resultado = v[0] + v[2];') }),
            mcq('Qual é o problema da última linha?', ['Acesso fora dos limites.', 'O vetor tem elementos demais.', 'O índice começa em 1.', 'A declaração exige quatro tipos.'], 0, 'Um vetor de quatro elementos termina no índice 3; acessar o índice 4 tem comportamento indefinido.', { visual: code('int v[4] = {1, 2, 3, 4};\nint x = v[4];', [2]) }),
          ],
        },
        {
          card: { title: 'Percorrer e atualizar', body: 'Para percorrer um vetor, comece no índice zero e pare antes do número de elementos. Cada atribuição altera apenas a posição escolhida.', visual: code('int v[3] = {2, 4, 6};\nint soma = 0;\nfor (int i = 0; i < 3; i++) {\n  soma += v[i];\n}', [3, 4], 'Soma das leituras') },
          exercises: [
            num('Qual é a soma das três leituras da listagem?', 12, 'A soma é 2 + 4 + 6 = 12.', { visual: code('int v[3] = {2, 4, 6};\nint soma = 0;\nfor (int i = 0; i < 3; i++)\n  soma += v[i];') }),
            tf('Uma atribuição a um elemento altera necessariamente todos os elementos do vetor.', false, 'A atribuição altera o elemento selecionado; os demais permanecem como estavam.'),
            fill('Complete: para percorrer um vetor de tamanho n, o índice deve ser menor que ___.', '___', ['n'], ['zero', 'n mais um', 'n menos um'], 'Os índices vão de zero até n menos um; a condição usa limite superior exclusivo.'),
            order('Ordene as etapas para somar os elementos de um vetor.', ['inicializar a soma em zero', 'visitar cada índice válido', 'acumular o valor do elemento', 'usar a soma obtida'], 'Primeiro prepare o acumulador; visite os índices, acumule cada elemento e use o resultado.'),
            gen((rng) => { const a = randInt(rng, 2, 8); const b = randInt(rng, 2, 8); return num('Qual valor fica em soma?', a + b, `As posições contêm ${a} e ${b}; a soma é ${a + b}.`, { visual: code(`int v[2] = {${a}, ${b}};\nint soma = v[0] + v[1];`) }); }),
            num('Quanto vale resultado após a alteração?', 11, 'O segundo elemento passa de 3 para 3 + 8 = 11.', { visual: code('int v[2] = {5, 3};\nv[1] += 8;\nint resultado = v[1];') }),
            mcq('Qual mudança evita o acesso inválido no laço?', ['Usar condição menor que 3.', 'Começar em 1 e manter o limite.', 'Aumentar o limite para 4.', 'Começar em menos 1.'], 0, 'O laço deve visitar 0, 1 e 2; o teste menor ou igual a 3 também acessa a posição 3.', { visual: code('int v[3] = {1, 2, 3};\nfor (int i = 0; i <= 3; i++)\n  v[i] = 0;', [2]) }),
          ],
        },
      ],
    },
    {
      id: 'lc-dados-str', title: 'Strings', parts: [
        {
          card: [
            { title: 'Texto como vetor', body: 'Uma string C é uma sequência de caracteres encerrada pelo caractere nulo. Um literal usado para inicializar o vetor inclui esse terminador.', visual: code('char nome[4] = "Luz";', [], 'Texto e terminador') },
            { title: 'Memória da string', body: 'As letras ocupam três posições; o terminador nulo ocupa a quarta. Ele não é o caractere dígito zero.', visual: table(['Índice', '0', '1', '2', '3'], [['Conteúdo', 'L', 'u', 'z', 'nulo']]) },
            { title: 'Espaço necessário', body: 'O controle representa a quantidade de caracteres visíveis; o resultado inclui uma posição para o terminador. É um modelo de capacidade, não um compilador.', visual: lab('caracteres', 1) },
          ],
          exercises: [
            mcq('O que marca o fim de uma string C?', ['O caractere nulo.', 'Um espaço obrigatório.', 'O caractere de nova linha.', 'O último índice de qualquer vetor.'], 0, 'As operações usuais de string procuram o caractere nulo para encontrar o fim.'),
            num('Quantas posições são necessárias para três caracteres e seu terminador?', 4, 'Três caracteres mais um terminador ocupam quatro posições.'),
            tf('O caractere nulo e o caractere que representa o dígito zero são o mesmo valor.', false, 'O terminador tem valor zero; o caractere do dígito zero é outro caractere.'),
            desafio('caracteres', 1, 5),
            gen((rng) => { const n = randInt(rng, 1, 5); return num(`Uma string tem ${n} caracteres de um byte cada. Quantos elementos char são necessários incluindo o terminador?`, n + 1, `${n} caracteres mais o terminador exigem ${n + 1} elementos.`); }),
            num('Qual é o índice do terminador?', 2, 'As letras ocupam os índices 0 e 1; o terminador está no índice 2.', { visual: code('char texto[3] = "Oi";') }),
            mcq('Qual é o risco de usar como string o vetor da listagem?', ['Não há terminador nulo no vetor.', 'Ele contém caracteres demais para dois elementos.', 'Toda string deve começar com nulo.', 'Os índices de caracteres começam em 1.'], 0, 'Os dois elementos foram preenchidos com letras e não há nulo; uma função de string pode ler além do vetor.', { visual: code("char texto[2] = {'O', 'i'};") }),
          ],
        },
        {
          card: { title: 'Comprimento e capacidade', body: 'O comprimento conta os caracteres antes do terminador; a capacidade é o total de elementos reservados. Ao copiar ou acrescentar texto, reserve espaço para todos os caracteres e para o nulo.', visual: code('#include <string.h>\nchar texto[8] = "sol";\nsize_t n = strlen(texto);', [2, 3], 'Comprimento') },
          exercises: [
            num('Qual valor fica em n?', 3, 'O comprimento de sol é 3; o terminador não entra na contagem.', { visual: code('#include <string.h>\nchar texto[8] = "sol";\nsize_t n = strlen(texto);') }),
            tf('Uma capacidade maior que o comprimento permite guardar caracteres adicionais, desde que também caiba o terminador.', true, 'A posição do terminador também consome um elemento; verifique a capacidade total.'),
            fill('Complete: a função que mede os caracteres antes do terminador chama-se ___.', '___', ['strlen'], ['sizeof', 'printf', 'return'], 'A função strlen conta os caracteres até encontrar o terminador, sem contá-lo.'),
            num('Quantas posições sobram depois de armazenar quatro caracteres e o terminador em um vetor de capacidade 8?', 3, 'Quatro caracteres mais o terminador ocupam 5 posições; 8 menos 5 é 3.'),
            gen((rng) => { const n = randInt(rng, 2, 6); return num(`Uma capacidade de ${n + 3} elementos guarda ${n} caracteres e o terminador. Quantas posições ficam livres?`, 2, `O uso é ${n} + 1 = ${n + 1}; restam ${n + 3} − ${n + 1} = 2.`); }),
            order('Ordene as etapas para acrescentar texto com segurança.', ['medir o texto existente', 'verificar espaço para o acréscimo e o terminador', 'copiar os novos caracteres', 'garantir o terminador ao final'], 'Conheça o comprimento e confira a capacidade antes de copiar; mantenha o nulo no fim.'),
            mcq('Qual afirmação descreve a cópia para um destino pequeno demais?', ['Pode escrever fora do vetor e causar comportamento indefinido.', 'O C aumenta automaticamente o vetor.', 'O terminador sempre corrige o excesso.', 'O compilador sempre amplia o destino.'], 0, 'Se a cópia ultrapassar a capacidade, escrever fora do vetor tem comportamento indefinido.'),
          ],
        },
      ],
    },
    {
      id: 'lc-dados-pont', title: 'Ponteiros', parts: [
        {
          card: [
            { title: 'Endereço e acesso indireto', body: 'Um ponteiro para inteiro guarda o endereço de um inteiro. O operador de endereço obtém esse endereço; o acesso indireto lê ou altera o objeto apontado.', visual: code('int x = 4;\nint *p = &x;\n*p = 7;', [2, 3], 'Alteração indireta') },
            { title: 'Relação na memória', body: 'O endereço é simbólico: p aponta para x. Após a última linha, o objeto x contém 7.', visual: table(['Objeto', 'Conteúdo'], [['x', '7'], ['p', 'endereço de x']]) },
            { title: 'Altere o valor', body: 'O controle modela o valor de x e o resultado mostra esse valor acrescido de 1; não executa código.', visual: lab('valor de x', 1) },
          ],
          exercises: [
            mcq('O que guarda um ponteiro válido para uma variável?', ['O endereço da variável.', 'Uma cópia obrigatória do conteúdo.', 'O nome da variável como texto.', 'O tamanho de toda a memória.'], 0, 'O valor do ponteiro identifica o objeto apontado por seu endereço.'),
            num('Quanto vale x ao final?', 7, 'O ponteiro guarda o endereço de x; a atribuição indireta escreve 7 no próprio x.', { visual: code('int x = 4;\nint *p = &x;\n*p = 7;') }),
            tf('Ler através de um ponteiro nulo é uma forma válida de obter zero.', false, 'Um ponteiro nulo não aponta para objeto acessível; desreferenciá-lo tem comportamento indefinido.'),
            desafio('valor de x', 1, 5),
            gen((rng) => { const n = randInt(rng, 2, 8); return num('Quanto vale x ao final?', n + 2, `O ponteiro aponta para x; a atualização soma 2 a ${n}, resultando em ${n + 2}.`, { visual: code(`int x = ${n};\nint *p = &x;\n*p += 2;`) }); }),
            fill('Complete: o operador usado para obter o endereço de um objeto é ___.', '___', ['&'], ['*', '+', '='], 'O operador de endereço obtém o endereço do objeto, que pode ser guardado num ponteiro compatível.'),
            mcq('Qual é o erro na última linha?', ['O ponteiro não foi inicializado com endereço válido.', 'Um inteiro não pode ter endereço.', 'Todo ponteiro aponta automaticamente para zero.', 'A escrita indireta é sempre proibida.'], 0, 'O valor do ponteiro local não foi inicializado; usá-lo para acessar memória tem comportamento indefinido.', { visual: code('int *p;\n*p = 3;', [2]) }),
          ],
        },
        {
          card: { title: 'Percorrer e modificar', body: 'Ao avançar um ponteiro dentro de um vetor, o deslocamento é medido em elementos do tipo apontado. C passa o valor do ponteiro à função; essa cópia ainda pode alcançar o objeto do chamador. Um ponteiro para uma posição após o último elemento pode ser formado, mas não desreferenciado.', visual: code('void soma_um(int *p) {\n  *p += 1;\n}\nint main(void) {\n  int x = 3;\n  soma_um(&x);\n}', [2, 6], 'Alterar pelo endereço') },
          exercises: [
            num('Quanto vale x após a chamada?', 4, 'A função recebe o endereço de x e soma 1 ao objeto apontado: 3 + 1 = 4.', { visual: code('void inc(int *p) {\n  *p += 1;\n}\nint main(void) {\n  int x = 3;\n  inc(&x);\n}') }),
            tf('Ao passar um ponteiro a uma função, C passa uma cópia do valor do ponteiro.', true, 'O parâmetro é uma cópia do endereço; acessá-lo indiretamente alcança o mesmo objeto.'),
            num('Qual valor fica em resultado?', 8, 'O ponteiro avança do primeiro para o segundo elemento, cujo valor é 8.', { visual: code('int v[3] = {5, 8, 2};\nint *p = v;\nint resultado = *(p + 1);') }),
            fill('Complete: avançar um ponteiro de inteiro em uma unidade avança um ___.', '___', ['elemento'], ['bit', 'nome', 'arquivo'], 'A aritmética é escalada pelo tamanho do tipo apontado; avança um elemento inteiro.'),
            gen((rng) => { const n = randInt(rng, 2, 8); return num('Qual é o valor de x depois da chamada?', n + 3, `A função recebe o endereço e soma 3 ao valor inicial ${n}: ${n + 3}.`, { visual: code(`void inc(int *p) {\n  *p += 3;\n}\nint main(void) {\n  int x = ${n};\n  inc(&x);\n}`) }); }),
            order('Ordene a alteração de uma variável por uma função que recebe ponteiro.', ['obter o endereço da variável', 'passar o endereço à função', 'acessar o objeto pelo ponteiro', 'alterar o valor do objeto'], 'O endereço é passado por valor; a função usa a cópia para acessar e alterar o objeto original.'),
            mcq('Qual operação é permitida para um ponteiro uma posição após o último elemento de um vetor?', ['Usá-lo como limite de comparação sem desreferenciá-lo.', 'Ler o elemento nessa posição.', 'Escrever nessa posição.', 'Avançar mais uma posição no mesmo vetor.'], 0, 'A posição imediatamente após o vetor serve como limite; ela não é um elemento acessível.'),
          ],
        },
      ],
    },
    {
      id: 'lc-dados-struct', title: 'Structs e typedef', parts: [
        {
          card: [
            { title: 'Um registro para o sensor', body: 'Uma estrutura agrupa campos que podem ter tipos diferentes. Cada instância guarda seus próprios campos; use o operador ponto para acessar um campo da instância.', visual: code('struct Sensor {\n  int id;\n  int valor;\n};\nstruct Sensor s = {2, 25};', [], 'Registro de sensor') },
            { title: 'Campos do registro', body: 'A tabela representa os valores dos campos, sem supor tamanhos ou alinhamento físico.', visual: table(['Campo', 'Valor'], [['id', 2], ['valor', 25]]) },
            { title: 'Ajuste a leitura', body: 'O controle representa uma leitura; o resultado inclui uma correção de duas unidades. O gráfico é apenas um modelo dos valores.', visual: lab('leitura', 2) },
          ],
          exercises: [
            mcq('Para que serve uma estrutura?', ['Agrupar campos relacionados, inclusive de tipos diferentes.', 'Garantir que todos os campos sejam do mesmo tipo.', 'Executar funções automaticamente.', 'Eliminar a necessidade de declarar variáveis.'], 0, 'Uma estrutura reúne campos nomeados em um único tipo de registro.'),
            num('Qual é o valor do campo leitura?', 25, 'O segundo inicializador corresponde ao segundo campo e vale 25.', { visual: code('struct Sensor {\n  int id;\n  int leitura;\n};\nstruct Sensor s = {2, 25};') }),
            tf('Duas instâncias de uma estrutura obrigatoriamente compartilham o mesmo valor para cada campo.', false, 'Cada instância tem seus próprios campos e pode conter valores distintos.'),
            desafio('leitura', 2, 6),
            gen((rng) => { const n = randInt(rng, 2, 8); return num('Qual é o valor de resultado?', n + 1, `O campo começa em ${n} e recebe mais 1: ${n + 1}.`, { visual: code(`struct Sensor { int valor; };\nstruct Sensor s = {${n}};\ns.valor += 1;\nint resultado = s.valor;`) }); }),
            fill('Complete: o operador para acessar um campo diretamente em uma instância é ___.', '___', ['.'], ['&', '*', '+'], 'O operador ponto seleciona um campo de uma instância de estrutura.'),
            mcq('Qual valor fica em resultado?', ['12', '10', '2', '22'], 0, 'A leitura começa em 10 e a correção soma 2; o campo passa a 12.', { visual: code('struct Sensor { int valor; };\nstruct Sensor s = {10};\ns.valor += 2;\nint resultado = s.valor;') }),
          ],
        },
        {
          card: { title: 'Apelido e ponteiro', body: 'Um typedef cria um apelido para um tipo, sem criar outro tipo de estrutura. Com um ponteiro válido para estrutura, a seta acessa um campo do objeto apontado. Copiar uma estrutura copia seus campos; depois, as duas instâncias são independentes.', visual: code('typedef struct {\n  int valor;\n} Sensor;\nSensor s = {20};\nSensor *p = &s;\np->valor = 21;', [3, 5, 6], 'Apelido e acesso') },
          exercises: [
            mcq('O que typedef cria?', ['Um apelido para um tipo.', 'Uma nova leitura de sensor.', 'Um endereço de memória obrigatório.', 'Uma função que inicializa tudo.'], 0, 'O apelido pode ser usado onde o tipo correspondente seria usado.'),
            num('Quanto vale o campo do sensor ao final?', 21, 'O ponteiro aponta para o sensor e a seta escreve 21 em seu campo.', { visual: code('typedef struct { int valor; } Sensor;\nSensor s = {20};\nSensor *p = &s;\np->valor = 21;') }),
            tf('Alterar um campo de uma cópia de estrutura também altera o campo inteiro correspondente da instância original.', false, 'A atribuição copia os campos; alterar depois um campo inteiro da cópia não muda o original.'),
            fill('Complete: o operador de acesso a campo através de um ponteiro para estrutura é ___.', '___', ['->'], ['.', '&', '+'], 'A seta seleciona um campo do objeto de estrutura apontado.'),
            gen((rng) => { const n = randInt(rng, 2, 8); return num('Quanto vale o campo da cópia ao final?', n + 2, `A cópia começa em ${n} e é incrementada em 2, chegando a ${n + 2}; o original não muda.`, { visual: code(`typedef struct { int v; } Sensor;\nSensor a = {${n}};\nSensor b = a;\nb.v += 2;`) }); }),
            num('Quanto vale o campo da instância original ao final?', 5, 'A cópia recebe 5 e depois muda para 9; a instância original conserva 5.', { visual: code('typedef struct { int v; } Sensor;\nSensor a = {5};\nSensor b = a;\nb.v = 9;') }),
            mcq('Qual cuidado é necessário antes de acessar um campo por um ponteiro?', ['O ponteiro deve apontar para uma estrutura válida.', 'O ponteiro deve ser sempre nulo.', 'A estrutura deve ser um vetor de caracteres.', 'O nome do campo deve ser numérico.'], 0, 'O acesso indireto exige um ponteiro válido para um objeto de estrutura ainda existente.'),
          ],
        },
      ],
    },
  ],
};

import React from 'react';
import type { UnitDef, VisualSpec } from '../../types';
import { code, fill, gen, match, mcq, multi, num, tf } from '../../helpers';
import { codePuzzle } from '../../codePractice';
import { TableView } from '../../../components/visuals/Misc';
import { randInt } from '../../../lib/random';

// Todas as listagens Rust são programas completos; comandos têm título Terminal.
const main = (body: string, imports = '') =>
  `${imports ? `${imports}\n\n` : ''}fn main() {\n${body.split('\n').map((line) => `    ${line}`).join('\n')}\n}`;
const hashMap = 'use std::collections::HashMap;';
const hashSet = 'use std::collections::HashSet;';
const treeMap = 'use std::collections::BTreeMap;';
const deque = 'use std::collections::VecDeque;';

type State = { label: string; rows: (string | number)[][]; note: string };
const trace = (head: string[], states: State[]): VisualSpec => ({
  name: 'stepper',
  props: {
    steps: states.length,
    labels: states.map((state) => state.label),
    render: (k: number, width: number) => (
      <TableView width={width} head={head} rows={states[k].rows} />
    ),
    info: (k: number) => states[k].note,
  },
});

const vecStart = main(`let mut v = vec![10, 20];
v.push(30);
println!("{:?}", v.get(1));
println!("{:?}", v.pop());
println!("{}", v.len());`);
const threeLoops = main(`let mut v = vec![2, 4];
for x in &v {
    println!("{x}");
}
for x in &mut v {
    *x += 1;
}
for x in v {
    println!("{x}");
}`);
const wordCount = main(`let text = "luz fio luz";
let mut counts = HashMap::new();
for w in text.split_whitespace() {
    let n = counts.entry(w)
        .or_insert(0);
    *n += 1;
}
println!("{:?}", counts.get("luz"));
println!("{:?}", counts.get("fio"));`, hashMap);
const borrowError = main(`let mut v = vec![10, 20];
let first = &v[0];
v.push(30);
println!("{first}");`);
const movedKey = main(`let name = String::from("Ana");
let mut m = HashMap::new();
m.insert(name, 1);
println!("{name}");`, hashMap);

export const rustColecoes: UnitDef = {
  id: 'rt-col',
  title: 'Coleções',
  icon: '🗃️',
  subtitle: 'Listas, dicionários, conjuntos e filas com ownership',
  source: 'The Rust Programming Language, edição 2024, cap. 8 (8.1 e 8.3): https://doc.rust-lang.org/book/ch08-01-vectors.html e https://doc.rust-lang.org/book/ch08-03-hash-maps.html · std::collections: https://doc.rust-lang.org/std/collections/ · Desafio 50 Dias — Rust, módulo 5, dias 29–32; retomada dos dias 9, 12 e 13.',
  guide: 'Vec<T> guarda uma sequência de um mesmo tipo: push acrescenta ao fim e pop devolve Option<T>. Índices começam em zero; get devolve Option<&T>, enquanto um índice inexistente causa panic. Percorrer por & empresta para leitura; por &mut permite alterar elementos; por valor consome a coleção. HashMap<K, V> associa chaves únicas a valores, sem ordem de iteração garantida; entry com or_insert permite atualizar um valor existente ou inicializá-lo. HashSet<T> guarda valores únicos e exige Eq + Hash (Eq depende de PartialEq). BTreeMap<K, V> percorre chaves em ordem e exige Ord nas operações de busca/inserção. VecDeque<T> atende filas com inserção ao fim e remoção no início. len conta elementos, capacity conta espaço alocado para elementos. Vec pode realocar ao crescer; uma referência usada depois de push conflita com o empréstimo mutável, mesmo havendo capacidade sobrando. String e Vec são movidos; clone duplica explicitamente e i32 é Copy.',
  extra: true,
  lessons: [
    {
      id: 'rt-col-vec', title: 'Vec', parts: [
        {
          card: [
            {
              title: 'Uma lista que cresce',
              body: 'Vec<T> guarda elementos do mesmo tipo, em sequência contígua no heap. A macro vec! cria a lista; Vec::new cria uma vazia, cujo tipo pode ser inferido pelo primeiro push. Com mut, push acrescenta ao fim e pop retira o último, devolvendo Some com o valor ou None se estiver vazio. len conta os elementos. No exemplo, as linhas de saída são Some(20), Some(30) e 2.',
              visual: code(vecStart, [3, 4, 5], 'Criar, consultar e retirar'),
              tip: 'Índices começam em zero. get permite tratar ausência com Option; acessar por índice exige que você garanta a posição. Não precisamos de unwrap nem expect.',
            },
            {
              title: 'Veja o último entrar e sair',
              body: 'Avance pelos estados da mesma lista. O índice 1 continua apontando para o segundo elemento. O último que entrou é o primeiro a sair: esse uso do Vec é uma pilha.',
              visual: trace(['Índice', 'Valor'], [
                { label: 'Criar', rows: [[0, 10], [1, 20]], note: 'Dois elementos: comprimento 2.' },
                { label: 'Acrescentar', rows: [[0, 10], [1, 20], [2, 30]], note: 'O novo elemento ocupa o índice 2. Comprimento 3.' },
                { label: 'Retirar', rows: [[0, 10], [1, 20]], note: 'A retirada entrega Some(30). Comprimento volta a 2.' },
              ]),
            },
          ],
          exercises: [
            tf('Um Vec<i32> pode crescer, mas seus elementos continuam tendo o mesmo tipo i32.', true,
              'O tamanho pode mudar em execução; o parâmetro T fixa o tipo de todos os elementos. Para representar alternativas diferentes, use um tipo comum, como um enum.'),
            num('Qual número é impresso?', 3,
              'Vec::new começa vazio. Os três push acrescentam três elementos; len retorna 3.',
              { visual: code(main(`let mut v = Vec::new();
v.push(4);
v.push(6);
v.push(8);
println!("{}", v.len());`)) }),
            mcq('Qual é a linha de saída?', ['Some(8)', 'Some(4)', 'None', '8'], 0,
              'pop retira o último elemento, 8, e o devolve dentro de Some. A formatação Debug mostra Some(8).',
              { visual: code(main(`let mut v = vec![4, 8];
println!("{:?}", v.pop());`), [3]) }),
            fill('Qual enum permite tratar uma posição ausente?', 'O retorno de get usa ___.',
              ['Option'], ['Vec', 'String', 'bool'],
              'get devolve Option com uma referência: Some quando o índice existe e None quando não existe. O chamador decide o que fazer em cada caso.'),
            gen((rng) => {
              const a = randInt(rng, 2, 9);
              const i = randInt(rng, 0, 2);
              return num('Qual valor a indexação imprime?', a + 2 * i,
                `O índice ${i} é a posição ${i + 1}. A lista começa em ${a} e aumenta 2 por posição, então o valor é ${a} + 2 × ${i} = ${a + 2 * i}.`,
                { visual: code(main(`let v = vec![${a}, ${a + 2}, ${a + 4}];
println!("{}", v[${i}]);`)) });
            }),
            match('Associe cada operação ao resultado:', [
              ['push', 'Acrescenta ao fim'], ['pop', 'Retira o último e retorna Option<T>'],
              ['get', 'Consulta e retorna Option<&T>'], ['len', 'Conta os elementos atuais'],
            ], 'push altera a lista; pop também altera e pode não encontrar elemento; get só empresta para consulta; len mede o comprimento.'),
            mcq('Compila ou não? O que ocorre ao executar?', [
              'Compila, mas o índice causa panic.', 'Não compila: índice fora do tipo.',
              'Compila e imprime None.', 'Compila e imprime zero.',
            ], 0, 'O Vec tem índices 0 e 1. A indexação aceita o código, mas verifica limites em execução e causa panic no índice 2. Isso não é um erro E0xxx do compilador. Para ausência esperada, consulte com get e trate None.',
            { visual: code(main(`let v = vec![4, 8];
println!("{}", v[2]);`), [3], 'Índice fora dos limites') }),
            codePuzzle('Monte a pilha: crie [4], acrescente 7, retire o último e imprima Some(7).', [
              'fn main() {', '    let mut v = vec![4];', '    v.push(7);',
              '    let top = v.pop();', '    println!("{top:?}");', '}',
            ], ['    v.push(9);', '    let top = v.get(0);'],
            'A lista nasce com 4, recebe 7 e devolve esse 7 na retirada. A saída é Some(7). Acrescentar 9 mudaria o resultado; consultar o índice 0 devolveria o primeiro elemento sem retirar nada.'),
          ],
        },
        {
          card: [
            {
              title: 'Três maneiras de percorrer',
              body: 'No primeiro for, &v empresta a coleção e x é &i32: as saídas são 2 e 4. No segundo, &mut v fornece &mut i32; o asterisco acessa o elemento para somar 1. No terceiro, v é entregue ao laço e consumido: as saídas são 3 e 5. Mesmo com elementos i32, que são Copy, o próprio Vec não é Copy.',
              visual: code(threeLoops, [3, 6, 9], 'Ler, alterar e consumir'),
            },
            {
              title: 'Organize antes de filtrar',
              body: 'sort ordena os inteiros. dedup remove somente repetições vizinhas; ordenar antes aproxima os valores iguais. retain mantém os que passam num teste. A escrita entre barras é uma closure: uma função curta; aqui o teste conserva apenas valores positivos. A saída é [1, 3]. contains consulta a presença de um valor por referência.',
              visual: code(main(`let mut v = vec![3, 1, 3, 0];
v.sort();
v.dedup();
v.retain(|n| *n > 0);
println!("{v:?}");`), [3, 4, 5]),
            },
            {
              title: 'No seu computador',
              body: 'Base: dia 29 do roteiro. Crie produtos com nome e estoque: motor com 4, fio com 0 e led com 2. Guarde em Vec; ordene por estoque com sort_by_key e uma closure que lê o campo estoque. Depois use retain para manter estoque positivo. Pronto: cargo run imprime led: 2 e motor: 4, nessa ordem. Em outro Vec de inteiros, confirme com assert_eq! que ordenar e aplicar dedup em [3, 1, 3] produz [1, 3]; confira contains para 1 e 9. Use edição 2024, cargo fmt e clippy sem avisos; não use unwrap nem expect.',
              visual: code('cargo new produtos\ncd produtos\ncargo fmt\ncargo run\ncargo clippy -- -D warnings', [], 'Terminal — após editar src/main.rs'),
            },
          ],
          exercises: [
            mcq('Qual é o tipo de x durante este empréstimo de leitura?', ['&i32', 'i32', '&mut i32', 'Vec<i32>'], 0,
              'O laço sobre &v visita referências de leitura aos elementos. A anotação no Vec fixa o elemento como i32, então x é &i32.',
              { visual: code(main(`let v: Vec<i32> = vec![2, 4];
for x in &v {
    println!("{x}");
}`), [3]) }),
            num('Qual número é impresso depois da alteração?', 7,
              'O empréstimo mutável visita 2 e 4. Somar 3 em cada posição produz [5, 7]; o índice 1 contém 7.',
              { visual: code(main(`let mut v = vec![2, 4];
for x in &mut v {
    *x += 3;
}
println!("{}", v[1]);`)) }),
            tf('Depois de um for por valor sobre um Vec<i32>, o vetor ainda pode ser usado porque i32 é Copy.', false,
              'Quem foi entregue ao laço foi o Vec inteiro. O vetor não é Copy e foi movido. Percorrer por & preserva sua posse para usos posteriores.'),
            fill('Complete a regra de alteração:', 'Para alterar elementos no laço, use um empréstimo ___.',
              ['mutável'], ['somente de leitura', 'já encerrado', 'sem dono'],
              'O laço sobre &mut v fornece referências mutáveis aos elementos. Cada referência permite mudar o valor apontado; a coleção precisa ter sido declarada com mut.'),
            gen((rng) => {
              const a = randInt(rng, 1, 7);
              const d = randInt(rng, 2, 5);
              const n = randInt(rng, 2, 5);
              return num('Qual é a soma do primeiro com o último elemento após o laço?', 2 * (a + d),
                `A macro cria ${n} cópias de ${a}. Cada elemento recebe mais ${d}, ficando ${a + d}. Primeiro e último somam 2 × ${a + d} = ${2 * (a + d)}.`,
                { visual: code(main(`let mut v = vec![${a}; ${n}];
for x in &mut v {
    *x += ${d};
}
let last = v.len() - 1;
println!("{}", v[0] + v[last]);`)) });
            }),
            mcq('Sem ordenar antes, o que dedup deixa na lista?', ['[2, 1, 2]', '[1, 2]', '[2, 1]', '[2]'], 0,
              'Somente os dois 2 finais são vizinhos. dedup mantém o primeiro de cada sequência consecutiva; o 2 inicial fica separado pelo 1.',
              { visual: code(main(`let mut v = vec![2, 1, 2, 2];
v.dedup();
println!("{v:?}");`)) }),
            multi('Em quais situações Vec é uma escolha direta?', [
              'Guardar amostras na ordem de aquisição.', 'Implementar uma pilha de desfazer.',
              'Exigir chaves únicas com busca por nome.', 'Exigir remoção eficiente sempre no início de uma fila.',
            ], [0, 1], 'Vec preserva a ordem dos elementos e oferece push/pop no fim. Para associar nomes a valores, escolha um mapa; para a fila com retirada pela frente, VecDeque evita deslocar todos os elementos.'),
            codePuzzle('Monte a sequência: ordenar, remover repetidos, medir e imprimir 2.', [
              'fn main() {', '    let mut v = vec![3, 1, 3];', '    v.sort();',
              '    v.dedup();', '    let n = v.len();', '    println!("{n}");', '}',
            ], ['    v.clear();', '    let n = v.capacity();'],
            'Ordenar produz [1, 3, 3]; dedup produz [1, 3]. Só então medimos len, que vale 2. Limpar apagaria tudo; capacity mede espaço, não a quantidade de valores. Aplicar dedup antes de ordenar não juntaria os dois 3.'),
          ],
        },
      ],
    },
    {
      id: 'rt-col-map', title: 'HashMap', parts: [
        {
          card: [
            {
              title: 'Uma chave leva a um valor',
              body: 'HashMap<K, V> associa cada chave a um valor. Importe o tipo de std::collections. insert cria ou substitui a associação; inserir a mesma chave novamente não aumenta len. get devolve Option<&V>. Aqui os dois resultados são Some("gato") e None. HashMap não promete ordem de iteração: não use a posição impressa para identificar uma chave.',
              visual: code(main(`let mut dict = HashMap::new();
dict.insert("cat", "gato");
println!("{:?}", dict.get("cat"));
println!("{:?}", dict.get("dog"));`, hashMap)),
            },
            {
              title: 'Atualizar não duplica a chave',
              body: 'O mapa de estoque é mostrado como tabela apenas para localizar as associações. A ordem das linhas desta ilustração não é uma garantia da coleção.',
              visual: trace(['Chave', 'Estoque'], [
                { label: 'Inserir led', rows: [['led', 2]], note: 'Uma chave: comprimento 1.' },
                { label: 'Inserir fio', rows: [['led', 2], ['fio', 5]], note: 'Duas chaves: comprimento 2.' },
                { label: 'Atualizar led', rows: [['led', 7], ['fio', 5]], note: 'O valor do led muda de 2 para 7; comprimento continua 2.' },
              ]),
            },
          ],
          exercises: [
            mcq('O que identifica uma associação num HashMap?', ['A chave', 'O índice de inserção', 'A capacidade livre', 'A última linha impressa'], 0,
              'Você consulta o valor pela chave. A coleção não fornece uma sequência com índices de inserção e não promete uma ordem de impressão.'),
            num('Quantas associações restam?', 1,
              'As duas inserções usam a mesma chave led. A segunda substitui 2 por 7, então continua existindo apenas uma associação.',
              { visual: code(main(`let mut m = HashMap::new();
m.insert("led", 2);
m.insert("led", 7);
println!("{}", m.len());`, hashMap)) }),
            mcq('O que a consulta ausente imprime?', ['None', 'Some(0)', '0', 'Causa panic'], 0,
              'Não há uma entrada para fio. get retorna None e Debug imprime esse nome; get não causa panic por uma chave ausente.',
              { visual: code(main(`let mut m = HashMap::new();
m.insert("led", 2);
println!("{:?}", m.get("fio"));`, hashMap)) }),
            fill('Complete o tipo da consulta:', 'Para valores i32, get retorna Option de ___.',
              ['&i32'], ['i32', '&mut i32', 'String'],
              'A consulta get empresta o valor armazenado para leitura, portanto retorna Option<&i32>. O mapa continua dono do valor.'),
            tf('Um for sobre &map imprime as chaves de HashMap sempre em ordem alfabética.', false,
              'HashMap não garante ordem. Para um relatório naturalmente ordenado pelas chaves, use BTreeMap, que veremos adiante.'),
            gen((rng) => {
              const a = randInt(rng, 1, 8);
              const b = a + randInt(rng, 1, 5);
              return num('Qual é o valor consultado ao final?', b,
                `A chave led recebe ${a} e depois ${b}; a segunda inserção substitui a primeira. copied copia o i32 da referência. unwrap_or usa zero somente se a consulta for None; aqui ela é Some(${b}).`,
                { visual: code(main(`let mut m = HashMap::new();
m.insert("led", ${a});
m.insert("led", ${b});
let n = m.get("led").copied()
    .unwrap_or(0);
println!("{n}");`, hashMap)) });
            }),
            match('Associe o objetivo à operação:', [
              ['Criar ou substituir associação', 'insert'], ['Consultar sem retirar', 'get'],
              ['Verificar existência de chave', 'contains_key'], ['Retirar associação', 'remove'],
            ], 'insert escreve; get retorna uma referência opcional; contains_key responde com bool; remove retira e devolve o valor dentro de Option, ou None se não houver chave.'),
            codePuzzle('Monte um mapa com led = 2. Capture o retorno da inserção, consulte depois e imprima None Some(2).', [
              'fn main() {\n    use std::collections::HashMap;',
              '    let mut m = HashMap::new();', '    let old = m.insert("led", 2);',
              '    let now = m.get("led");', '    println!("{old:?} {now:?}");', '}',
            ], ['    let old = m.insert("led", 9);', '    let now = m.get("fio");'],
            'O primeiro bloco abre main e importa o tipo. insert retorna None porque ainda não havia valor para led. Depois get retorna Some com uma referência ao 2. A consulta precisa vir após a inserção; ler fio daria None, e inserir 9 mudaria o valor.'),
          ],
        },
        {
          card: [
            {
              title: 'Contar palavras com entry',
              body: 'split_whitespace separa por espaços em branco e fornece fatias de texto. entry procura a chave; or_insert inicializa com zero se ela faltar e retorna &mut para o contador. O asterisco permite somar ao número guardado. As saídas são Some(2) e Some(1). A forma compacta faz tudo numa expressão, mostrada no próximo card.',
              visual: code(wordCount, [7, 8, 9], 'Dia 30 — frequência de palavras'),
              tip: 'Nesta contagem, "Luz", "luz" e "luz," são chaves diferentes. Separar espaços não remove pontuação nem converte maiúsculas.',
            },
            {
              title: 'Uma entrada, uma atualização',
              body: 'or_insert não sobrescreve um valor que já existe. Na expressão compacta, o asterisco acessa o contador e a soma o atualiza. A saída é Some(5).',
              visual: code(main(`let mut m = HashMap::new();
m.insert("luz", 4);
*m.entry("luz").or_insert(0) += 1;
println!("{:?}", m.get("luz"));`, hashMap), [6]),
            },
            {
              title: 'No seu computador',
              body: 'Base: dia 30. Faça um dicionário inglês-português com insert e get; consulte uma palavra presente e outra ausente com match. Depois conte as palavras de "luz fio luz fio luz" usando entry e or_insert. Pronto: o relatório de consultas mostra luz: 3 e fio: 2, e a consulta ausente informa "não encontrada". Consulte essas chaves explicitamente para ter saída previsível. Não use unwrap nem expect; deixe cargo fmt e clippy sem avisos. Na próxima lição você poderá imprimir o relatório ordenado com BTreeMap.',
              visual: code('cargo new palavras\ncd palavras\ncargo fmt\ncargo run\ncargo clippy -- -D warnings', [], 'Terminal — após editar src/main.rs'),
            },
          ],
          exercises: [
            mcq('Se a chave já tem contador 4, qual valor or_insert(0) preserva?', ['4', '0', '1', 'Remove a chave'], 0,
              'or_insert só usa o valor inicial se a chave estiver ausente. Com 4 já armazenado, ele retorna uma referência mutável para esse mesmo 4.'),
            num('Qual é a frequência da palavra luz no exemplo?', 2,
              'A primeira ocorrência cria o contador 0 e soma 1; a segunda encontra 1 e soma 1 de novo. A frequência final de luz é 2.',
              { visual: code(wordCount, [4, 7, 8, 9]) }),
            fill('Que valor inicial faz a primeira ocorrência virar 1 após o incremento?', 'O contador ausente deve começar em ___.',
              ['0'], ['1', '-1', '2'],
              'A primeira ocorrência também executa a soma de 1. Começar com zero resulta em 1; começar com 1 contaria uma ocorrência a mais.'),
            tf('or_insert devolve uma cópia independente do contador; alterá-la não muda o mapa.', false,
              'O retorno é &mut V, uma referência ao valor dentro do mapa. Alterar o valor apontado altera o contador armazenado.'),
            match('Associe cada etapa da contagem ao seu papel:', [
              ['split_whitespace', 'Separa o texto em fatias'], ['entry', 'Seleciona a entrada da chave'],
              ['or_insert', 'Inicializa se faltar e empresta o valor'], ['Asterisco no contador', 'Acessa o número para atualizar'],
            ], 'O texto fornece palavras; entry seleciona cada chave; or_insert garante um valor e fornece &mut; o asterisco permite incrementar o número armazenado.'),
            gen((rng) => {
              const n = randInt(rng, 2, 6);
              const words = [...Array<string>(n).fill('led'), 'fio', 'fio'];
              return num('Qual é a frequência de led ao final?', n,
                `O vetor tem ${n} ocorrências de led e duas de fio. Cada ocorrência de led soma 1 ao seu próprio contador, partindo de zero: frequência ${n}.`,
                { visual: code(main(`let words = vec![
${words.map((word) => `    "${word}",`).join('\n')}
];
let mut m = HashMap::new();
for w in words {
    *m.entry(w).or_insert(0) += 1;
}
println!("{:?}", m.get("led"));`, hashMap)) });
            }),
            mcq('Qual é o defeito lógico deste contador, que compila?', [
              'Ele substitui por 1 em toda ocorrência.', 'Ele soma automaticamente a frequência.',
              'Ele ordena as palavras.', 'Ele conta somente os espaços.',
            ], 0, 'Cada insert escreve 1 na mesma chave e substitui o valor anterior. A saída é Some(1), embora luz apareça duas vezes. Para acumular, use entry com or_insert e incremente o valor apontado.',
            { visual: code(main(`let text = "luz luz";
let mut m = HashMap::new();
for w in text.split_whitespace() {
    m.insert(w, 1);
}
println!("{:?}", m.get("luz"));`, hashMap), [7], 'Compila, mas não acumula') }),
            codePuzzle('Monte a atualização: comece com luz = 2, obtenha a entrada, some 1 e imprima Some(3).', [
              'fn main() {\n    use std::collections::HashMap;',
              '    let mut m = HashMap::new();', '    m.insert("luz", 2);',
              '    let n = m.entry("luz").or_insert(0);', '    *n += 1;',
              '    println!("{:?}", m.get("luz"));', '}',
            ], ['    let n = m.entry("fio").or_insert(0);', '    *n = 0;'],
            'Primeiro criamos a associação com 2. or_insert preserva esse número e fornece a referência n. O incremento termina o uso de n; depois a consulta de leitura encontra 3. Atualizar fio alteraria outra chave; atribuir zero apagaria a frequência.'),
          ],
        },
      ],
    },
    {
      id: 'rt-col-set', title: 'HashSet, BTreeMap e VecDeque', parts: [
        {
          card: [
            {
              title: 'Só interessa se já apareceu',
              body: 'HashSet<T> guarda valores únicos. insert retorna true se acrescentou um valor novo e false se ele já existia; contains testa presença. Não há contador associado nem ordem de iteração garantida. As quatro linhas de saída são true, false, 1 e true.',
              visual: code(main(`let mut seen = HashSet::new();
println!("{}", seen.insert(7));
println!("{}", seen.insert(7));
println!("{}", seen.len());
println!("{}", seen.contains(&7));`, hashSet), [5, 6, 8]),
            },
            {
              title: 'Veja a duplicata desaparecer',
              body: 'Avance como se cada número fosse o identificador de um sensor que enviou dados. Repetir um identificador não cria um segundo elemento.',
              visual: trace(['Valor único', 'Presente'], [
                { label: 'Receber 7', rows: [[7, 'sim']], note: 'Inserção nova: true. Comprimento 1.' },
                { label: 'Repetir 7', rows: [[7, 'sim']], note: 'Inserção repetida: false. Comprimento continua 1.' },
                { label: 'Receber 9', rows: [[7, 'sim'], [9, 'sim']], note: 'Outro valor novo: true. Comprimento 2. A tabela não promete ordem.' },
              ]),
            },
            {
              title: 'Igualdade e hash devem concordar',
              body: 'O conjunto exige Eq e Hash; Eq também exige PartialEq. Se dois valores são iguais, seus hashes devem ser iguais. derive gera implementações coerentes considerando todos os campos. Aqui Cpf tem só um campo, logo textos iguais representam o mesmo identificador. A saída é 1. Numa Pessoa com nome e CPF, derivar nas duas propriedades NÃO define igualdade apenas pelo CPF; seria preciso implementar as traits com esse mesmo critério.',
              visual: code(`use std::collections::HashSet;

#[derive(PartialEq, Eq, Hash)]
struct Cpf(String);

fn main() {
    let mut ids = HashSet::new();
    let a = Cpf("123".to_string());
    let b = Cpf("123".to_string());
    ids.insert(a);
    ids.insert(b);
    println!("{}", ids.len());
}`, [3, 4], 'Identidade simplificada, sem validar CPF'),
            },
          ],
          exercises: [
            mcq('Você só precisa saber quais sensores já enviaram dados, sem contar envios. Qual coleção se encaixa?',
              ['HashSet', 'HashMap com frequência obrigatória', 'VecDeque para ordenar chaves', 'String para indexar sensores'], 0,
              'Um conjunto representa presença ou ausência de cada identificador. HashSet elimina duplicatas sem exigir um valor associado a cada chave.'),
            num('Quantos valores únicos ficam no conjunto?', 3,
              'As inserções visitam 2, 5, 2 e 8. O segundo 2 é duplicado; restam 2, 5 e 8, totalizando três valores.',
              { visual: code(main(`let mut s = HashSet::new();
for id in [2, 5, 2, 8] {
    s.insert(id);
}
println!("{}", s.len());`, hashSet)) }),
            mcq('O que a segunda inserção imprime?', ['false', 'true', 'Some(7)', 'None'], 0,
              'O valor 7 já está presente. insert devolve false porque essa chamada não acrescentou um elemento novo.',
              { visual: code(main(`let mut s = HashSet::new();
s.insert(7);
println!("{}", s.insert(7));`, hashSet), [6]) }),
            tf('HashSet garante que a impressão de seus elementos seguirá a ordem de inserção.', false,
              'A coleção não garante ordem de iteração. Presença e unicidade são suas propriedades; a ordem de chegada precisa ser representada separadamente se for relevante.'),
            fill('Complete a regra de consistência:', 'Valores iguais precisam ter hashes ___.',
              ['iguais'], ['sempre diferentes', 'sempre zero', 'em ordem crescente'],
              'A busca usa o hash para encontrar candidatos e a igualdade para decidir se é o mesmo valor. Igualdade e Hash precisam usar critérios compatíveis. Valores diferentes ainda podem ter o mesmo hash.'),
            gen((rng) => {
              const a = randInt(rng, 1, 8);
              const b = a + randInt(rng, 1, 4);
              const n = randInt(rng, 2, 5);
              return num('Quantas inserções retornam true?', 2,
                `O laço tenta inserir ${a} ${n} vezes, mas só a primeira é nova. Depois insere ${b}, diferente de ${a}, uma vez. Logo existem duas inserções novas.`,
                { visual: code(main(`let mut s = HashSet::new();
let mut fresh = 0;
for id in [${a}; ${n}] {
    if s.insert(id) {
        fresh += 1;
    }
}
if s.insert(${b}) {
    fresh += 1;
}
println!("{fresh}");`, hashSet)) });
            }),
            multi('Para usar um tipo próprio como elemento de HashSet, quais afirmações são corretas?', [
              'É necessário implementar Eq e Hash.', 'Eq depende da implementação de PartialEq.',
              'Valores iguais devem produzir hashes iguais.', 'Só implementar Debug já garante unicidade.',
            ], [0, 1, 2], 'Eq e Hash são os contratos usados pelo conjunto, com PartialEq para comparação. Hash precisa concordar com igualdade. Debug controla formatação e não determina se dois valores são iguais.'),
            codePuzzle('Monte: insira 4, capture a tentativa repetida e imprima false 1.', [
              'fn main() {\n    use std::collections::HashSet;',
              '    let mut s = HashSet::new();', '    s.insert(4);',
              '    let fresh = s.insert(4);', '    println!("{fresh} {}", s.len());', '}',
            ], ['    let fresh = s.insert(5);', '    println!("{fresh} {}", 2);'],
            'A primeira inserção cria o elemento 4. A segunda retorna false, pois 4 já existe. len mede um elemento, portanto a saída é false 1. Inserir 5 criaria outro elemento; imprimir 2 confundiria a quantidade de tentativas com a quantidade de elementos únicos.'),
          ],
        },
        {
          card: [
            {
              title: 'Relatório por chave: BTreeMap',
              body: 'Quando a ordem das chaves é parte do resultado, use BTreeMap. Ele percorre pelas chaves ordenadas, não pelos valores nem pela chegada. As operações de busca e inserção usam Ord nas chaves. O relatório abaixo imprime fio: 5 e depois led: 2. insert, get e entry têm papéis semelhantes aos do HashMap.',
              visual: code(main(`let mut stock = BTreeMap::new();
stock.insert("led", 2);
stock.insert("fio", 5);
for (name, n) in &stock {
    println!("{name}: {n}");
}`, treeMap), [7, 8]),
            },
            {
              title: 'Fila: entrar atrás, sair pela frente',
              body: 'VecDeque é uma fila de duas pontas. push_back acrescenta ao fim e pop_front retira do início, devolvendo Option. Esses métodos evitam deslocar todos os elementos a cada atendimento. VecDeque::from também cria uma fila a partir de um array, preservando a ordem. As linhas abaixo são Some("Ana") e Some("Bia"). Para desfazer a última ação, use a pilha Vec com push/pop.',
              visual: code(main(`let mut queue = VecDeque::new();
queue.push_back("Ana");
queue.push_back("Bia");
println!("{:?}", queue.pop_front());
println!("{:?}", queue.pop_front());`, deque), [7, 8]),
            },
            {
              title: 'No seu computador',
              body: 'Base: dias 30–32. No projeto, reúna três tarefas: conte "luz fio luz" em BTreeMap e imprima fio: 1, depois luz: 2; guarde os identificadores [7, 7, 9] em HashSet e imprima 2 como quantidade de sensores; atenda Ana, Bia e Caio numa VecDeque, nessa ordem, tratando também a fila vazia com match. Pronto: ordem do relatório e dos três atendimentos conferida, mensagem "fila vazia" no quarto atendimento e clippy sem avisos. Sem crates externas, unwrap ou expect.',
              visual: code('cargo new colecoes\ncd colecoes\ncargo fmt\ncargo run\ncargo clippy -- -D warnings', [], 'Terminal — após editar src/main.rs'),
            },
          ],
          exercises: [
            match('Escolha a coleção pelo requisito:', [
              ['Leituras em sequência e acesso por índice', 'Vec'], ['Identificadores sem repetição', 'HashSet'],
              ['Relatório em ordem de chave', 'BTreeMap'], ['Atendimento pela ordem de chegada', 'VecDeque'],
            ], 'Vec representa sequência; HashSet representa presença única; BTreeMap mantém ordem de chaves; VecDeque oferece as duas pontas necessárias para a fila.'),
            mcq('Qual é a primeira linha de saída?', ['fio: 5', 'led: 2', 'fio: 2', 'Não há ordem definida'], 0,
              'BTreeMap percorre as chaves ordenadas. fio vem antes de led; seu valor é 5, embora led tenha sido inserida primeiro.',
              { visual: code(main(`let mut m = BTreeMap::new();
m.insert("led", 2);
m.insert("fio", 5);
for (key, value) in &m {
    println!("{key}: {value}");
}`, treeMap)) }),
            mcq('Qual pessoa é retirada primeiro?', ['Ana', 'Bia', 'Caio', 'Nenhuma'], 0,
              'push_back coloca cada pessoa no fim. pop_front retira a primeira que chegou: Ana. A saída Debug é Some("Ana").',
              { visual: code(main(`let mut q = VecDeque::new();
q.push_back("Ana");
q.push_back("Bia");
q.push_back("Caio");
println!("{:?}", q.pop_front());`, deque)) }),
            tf('BTreeMap ordena pelos valores associados, portanto um estoque menor sai primeiro.', false,
              'A ordenação é pelas chaves. Valores só definiriam a ordem se você os usasse explicitamente como critério numa outra estrutura ou numa etapa de ordenação.'),
            fill('Qual comportamento a fila deve preservar?', 'O primeiro que entra deve ser o primeiro que ___.',
              ['sai'], ['é duplicado', 'é ordenado por nome', 'fica por último'],
              'Uma fila FIFO atende na ordem de chegada. Inserir atrás e retirar pela frente preserva esse comportamento; retirar atrás faria uma pilha.'),
            gen((rng) => {
              const a = randInt(rng, 10, 30);
              const n = randInt(rng, 3, 6);
              const served = randInt(rng, 1, n - 1);
              return num('Qual senha é retirada pela última chamada, depois do laço?', a + served,
                `As senhas vão de ${a} a ${a + n - 1}. O laço retira as primeiras ${served}, até ${a + served - 1}. A próxima senha é ${a + served}.`,
                { visual: code(main(`let mut q = VecDeque::new();
for id in ${a}..${a + n} {
    q.push_back(id);
}
for _ in 0..${served} {
    q.pop_front();
}
println!("{:?}", q.pop_front());`, deque)) });
            }),
            mcq('Você precisa desfazer a ação mais recente, sem manter chaves nem atender uma fila. Qual uso é direto?', [
              'Vec com push e pop', 'BTreeMap ordenado por nome', 'HashSet para eliminar a ordem', 'VecDeque com push_back e pop_front',
            ], 0, 'Desfazer exige último a entrar, primeiro a sair: uma pilha. Vec acrescenta e retira no fim. A combinação de VecDeque oferecida na alternativa atende o primeiro que chegou, não o último.'),
            codePuzzle('Monte a fila com as senhas 4 e 7, nessa ordem; retire pela frente e imprima Some(4).', [
              'fn main() {\n    use std::collections::VecDeque;',
              '    let mut q = VecDeque::from([4, 7]);', '    let first = q.pop_front();',
              '    println!("{first:?}");', '}',
            ], ['    let first = q.pop_back();', '    let mut q = VecDeque::from([7, 4]);'],
            'A criação preserva a ordem [4, 7]. pop_front retira o primeiro elemento, produzindo Some(4). Retirar pela outra ponta entregaria 7; inverter a ordem inicial também mudaria o resultado. A retirada depende da criação e a impressão depende do valor retirado.'),
          ],
        },
      ],
    },
    {
      id: 'rt-col-own', title: 'Ownership dentro das coleções', parts: [
        {
          card: [
            {
              title: 'A coleção passa a ser dona',
              body: 'Colocar uma String num Vec transfere sua posse para a coleção. Inserir String como chave ou valor de HashMap também move esses valores. Já i32 é Copy: inserir copia o número. No exemplo, a String é movida para o Vec e o laço sobre &v só a empresta. A saída é Ana e depois 1. Um laço por valor entregaria a String ao corpo do laço e consumiria o vetor.',
              visual: code(main(`let name = String::from("Ana");
let v = vec![name];
for item in &v {
    println!("{item}");
}
println!("{}", v.len());`), [3, 4]),
            },
            {
              title: 'Acompanhe dono e memória',
              body: 'Este é um modelo conceitual de variáveis locais na pilha e dados no heap. Mover a String transfere seu controle; não duplica o texto. Avance para ver a posse entrar e sair do vetor.',
              visual: trace(['Controle local', 'Dados no heap'], [
                { label: 'Antes', rows: [['name: dona da String', 'Texto Ana'], ['v: ainda não existe', '—']], note: 'A String local controla seu texto.' },
                { label: 'Inserir', rows: [['name: movida', 'Sem acesso por name'], ['v: dono dos elementos', 'String no buffer → texto Ana']], note: 'O Vec controla a String que aponta para o texto. O texto não foi clonado.' },
                { label: 'Retirar', rows: [['v: vazio', 'Buffer pode continuar alocado'], ['last: Some(String)', 'Texto Ana']], note: 'pop entrega a posse do elemento dentro de Option para last. Quando o último dono sai de escopo, o texto é liberado.' },
              ]),
            },
            {
              title: 'Clone é uma decisão explícita',
              body: 'Se você precisa manter o texto original e também dar um texto próprio ao mapa, clone duplica a String. Aqui name continua válido; o mapa tem uma chave independente. As linhas impressas são Ana e 1. Para só ler textos de um Vec, prefira emprestar em vez de clonar toda a lista.',
              visual: code(main(`let name = String::from("Ana");
let mut m = HashMap::new();
m.insert(name.clone(), 1);
println!("{name}");
println!("{}", m.len());`, hashMap), [6]),
            },
          ],
          exercises: [
            mcq('Depois de inserir uma String por valor no Vec, quem controla esse elemento?', [
              'O Vec', 'A variável original e o Vec ao mesmo tempo', 'Ninguém', 'O compilador copia o texto automaticamente',
            ], 0, 'String não é Copy. A inserção por valor transfere a posse; o Vec fica responsável por guardar e depois liberar ou entregar o elemento.'),
            mcq('Compila ou não? Qual é o diagnóstico principal?', [
              'Não: E0382 por usar name após o move.', 'Sim: imprime Ana e mantém a chave.',
              'Não: E0502 por criar um mapa vazio.', 'Sim: clona a String implicitamente.',
            ], 0, 'E0382: borrow of moved value: `name`. insert move a String para a chave do HashMap. A impressão posterior tenta emprestar a variável movida. Corrija lendo pelo mapa ou clonando explicitamente antes da inserção quando as duas cópias forem necessárias.',
            { visual: code(movedKey, [6, 7], 'Erro intencional — E0382') }),
            tf('Inserir um i32 num Vec move o inteiro e impede usar a variável original.', false,
              'i32 implementa Copy. A inserção copia esse valor, mantendo a variável original utilizável. Isso não torna o próprio Vec Copy.'),
            match('Associe a operação ao efeito na posse:', [
              ['Laço sobre &v', 'Empresta os elementos para leitura'], ['Laço sobre &mut v', 'Empresta os elementos para alteração'],
              ['Laço sobre v', 'Consome o vetor e entrega os elementos'], ['pop em Vec<String>', 'Entrega Option<String> com posse'],
            ], 'As duas formas com referência preservam a posse do vetor. O laço por valor move a coleção. pop retira um elemento e entrega a String, não uma referência ao espaço do Vec.'),
            gen((rng) => {
              const a = randInt(rng, 2, 12);
              const d = randInt(rng, 1, 6);
              return num('Qual número a variável original ainda imprime?', a,
                `O i32 ${a} é copiado para o Vec. Alterar o elemento para ${a + d} não altera a variável original n, que ainda vale ${a}.`,
                { visual: code(main(`let n = ${a};
let mut v = vec![n];
v[0] += ${d};
println!("{n}");`)) });
            }),
            mcq('O laço consome o vetor. Qual erro o uso posterior causa?', [
              'E0382: uso de v depois do move.', 'E0502: duas referências durante len.',
              'E0596: falta mut no println.', 'Nenhum: o laço só empresta.',
            ], 0, 'E0382: borrow of moved value: `v`. O for por valor chama a conversão que consome o Vec. Para imprimir os nomes e ainda consultar len, percorra por &v.',
            { visual: code(main(`let v = vec![String::from("Ana")];
for name in v {
    println!("{name}");
}
println!("{}", v.len());`), [3, 6], 'Erro intencional — E0382') }),
            mcq('Qual saída confirma que a retirada devolveu uma String com posse?', [
              'Ana e depois 0', 'Ana e depois 1', 'None e depois 0', 'Não compila: a String foi destruída',
            ], 0, 'pop remove a String e retorna Some com esse valor. O if let move o valor para name, que pode imprimi-lo. O vetor agora tem comprimento zero.',
            { visual: code(main(`let mut v = vec![
    String::from("Ana"),
];
if let Some(name) = v.pop() {
    println!("{name}");
}
println!("{}", v.len());`)) }),
            codePuzzle('Monte: mova a String para o vetor, retire-a e imprima 0 Some("Ana").', [
              'fn main() {', '    let name = String::from("Ana");',
              '    let mut v = vec![name];', '    let last = v.pop();',
              '    println!("{} {last:?}", v.len());', '}',
            ], ['    let last = v.get(0);', '    let last = v.len();'],
            'A String entra por move. pop a entrega dentro de Option e deixa o vetor vazio; a saída é 0 Some("Ana"). get só emprestaria sem retirar, mantendo comprimento 1. len não entrega o elemento.'),
          ],
        },
        {
          card: [
            {
              title: 'Comprimento não é capacidade',
              body: 'len mede elementos existentes; capacity mede quantos elementos cabem sem nova alocação. with_capacity reserva espaço, mas começa com len zero. Este programa imprime 0, depois true e depois 1. Não fixe no gabarito a sequência de capacidades: a estratégia de crescimento não é um contrato. Para i32, um push quando len já é igual a capacity precisa aumentar a alocação; os elementos podem mudar de endereço.',
              visual: code(main(`let mut v: Vec<i32> =
    Vec::with_capacity(4);
println!("{}", v.len());
println!("{}", v.capacity() >= 4);
v.push(10);
println!("{}", v.len());`), [2, 3, 5]),
            },
            {
              title: 'Referência antiga e push: E0502',
              body: 'Este exemplo está errado. first empresta um elemento para leitura e é usado depois do push. push exige emprestar o Vec para alteração. O compilador impede essa sobreposição, pois crescer pode realocar o buffer e invalidar a referência antiga. A mensagem é E0502: cannot borrow `v` as mutable because it is also borrowed as immutable. Há duas correções: concluir o uso da referência antes de alterar, ou guardar um valor independente. Para i32, basta copiar; para String, uma cópia independente exige clone.',
              visual: code(borrowError, [3, 4, 5], 'Erro intencional — E0502'),
              tip: 'Reservar capacidade não torna essa sobreposição de empréstimos válida. O contrato de push continua exigindo &mut do vetor.',
            },
            {
              title: 'Termine o empréstimo antes de alterar',
              body: 'Aqui o último uso de first vem antes do push. O empréstimo pode terminar ali, mesmo que a variável ainda esteja no bloco. As linhas de saída são 10 e 3. Se quiser guardar o primeiro número para usar depois, copie o i32 em vez de guardar uma referência.',
              visual: code(main(`let mut v = vec![10, 20];
let first = &v[0];
println!("{first}");
v.push(30);
println!("{}", v.len());`), [4, 5]),
            },
            {
              title: 'No seu computador',
              body: 'Base: dias 9, 12 e 13. Crie um Vec<i32> vazio, acrescente os números de 1 a 20 e imprima len e capacity após cada push. Pronto: comprimentos de 1 até 20 e capacidade sempre pelo menos igual ao comprimento; nenhuma sequência exata de crescimento é exigida. Reproduza separadamente o E0502 do card; depois corrija e volte a ter build limpo. Com Vec<String> de Ana e Bia, percorra por referência, altere os nomes para maiúsculas por referência mutável e por fim consuma por valor. Na fase final, imprima ANA e BIA. Confirme separadamente que usar o Vec consumido causa E0382; retire o erro e finalize com cargo fmt e clippy sem avisos. Sem unwrap nem expect.',
              visual: code('cargo new posse_colecoes\ncd posse_colecoes\ncargo fmt\ncargo run\ncargo clippy -- -D warnings', [], 'Terminal — após editar src/main.rs'),
            },
          ],
          exercises: [
            num('Quantos elementos existem logo depois da reserva?', 0,
              'with_capacity reserva espaço, mas não cria elementos. O comprimento inicial é zero, independentemente da capacidade alocada.',
              { visual: code(main(`let v: Vec<i32> =
    Vec::with_capacity(12);
println!("{}", v.len());`)) }),
            tf('A capacidade de um Vec<i32> é sempre igual ao seu comprimento.', false,
              'Ela pode ser maior: espaço reservado não é elemento inicializado. len é sempre menor ou igual a capacity; remover elementos não exige reduzir a capacidade.'),
            mcq('Qual linha tenta fazer o empréstimo incompatível com first?', ['Linha 4: push', 'Linha 2: criação', 'Linha 3: referência', 'Linha 5: impressão'], 0,
              'A linha 3 inicia o empréstimo de leitura e a linha 5 ainda o usa. A linha 4 tenta emprestar v como mutável para push: E0502, cannot borrow `v` as mutable because it is also borrowed as immutable. Termine o uso de first antes do push ou guarde uma cópia do valor.',
              { visual: code(borrowError, [2, 3, 4, 5], 'Ache o conflito — E0502') }),
            mcq('Guardar o primeiro valor por cópia permite usar o número depois do push. O que sai?', ['10', '20', '30', 'Não compila: E0502'], 0,
              'i32 é Copy. first é um número independente, não uma referência para o buffer. push pode alterar o vetor e first continua valendo 10.',
              { visual: code(main(`let mut v = vec![10, 20];
let first = v[0];
v.push(30);
println!("{first}");`), [3]) }),
            gen((rng) => {
              const n = randInt(rng, 2, 7);
              const extra = randInt(rng, 2, 6);
              return num('Qual é o comprimento depois dos push?', n,
                `A reserva de ${n + extra} posições não cria elementos. O intervalo 0..${n} tem ${n} números, cada um acrescentado uma vez; len final é ${n}.`,
                { visual: code(main(`let mut v = Vec::with_capacity(${n + extra});
for n in 0..${n} {
    v.push(n);
}
println!("{}", v.len());`)) });
            }),
            mcq('Há espaço sobrando. Este programa compila?', [
              'Não: E0502, os empréstimos se sobrepõem.', 'Sim: a capacidade desativa o borrow checker.',
              'Sim: push só precisa de referência de leitura.', 'Não: with_capacity não permite push.',
            ], 0, 'E0502: cannot borrow `v` as mutable because it is also borrowed as immutable. first é usado depois de push. A assinatura de push exige &mut do Vec mesmo com capacidade sobrando. Corrija movendo o último uso de first para antes do push ou copiando o i32.',
            { visual: code(main(`let mut v = Vec::with_capacity(10);
v.push(1);
let first = &v[0];
v.push(2);
println!("{first}");`), [4, 5, 6], 'Erro intencional — E0502') }),
            multi('Quais mudanças resolvem o conflito do exemplo sem unsafe?', [
              'Usar a referência pela última vez antes de push.', 'Guardar uma cópia do i32, em vez de &i32.',
              'Clonar a String, se for preciso um texto independente.', 'Apenas reservar mais capacidade e manter os empréstimos.',
            ], [0, 1, 2], 'As três primeiras alternativas encerram o empréstimo antes da alteração ou guardam um valor independente do buffer. A última só muda o espaço disponível: a regra de empréstimos de push continua a mesma.'),
            codePuzzle('Monte: copie 6, acrescente seu sucessor, retire-o e imprima 6 Some(7).', [
              'fn main() {', '    let mut v = vec![6];', '    let first = v[0];',
              '    v.push(first + 1);', '    let last = v.pop();',
              '    println!("{first} {last:?}");', '}',
            ], ['    let first = 9;', '    v.push(first + 2);'],
            'A cópia de i32 não mantém um empréstimo do buffer. O sucessor de 6 é 7, que entra no fim e é retirado por pop. A saída é 6 Some(7). Guardar 9 ou somar 2 produziria outros valores.'),
          ],
        },
      ],
    },
  ],
};

import React from 'react';
import type { UnitDef } from '../../types';
import { code, fill, gen, match, mcq, num, order, table, tf } from '../../helpers';
import { codePuzzle } from '../../codePractice';
import { Pt } from '../../../components/plot/Plot';
import { randInt } from '../../../lib/random';
import { C } from '../../../theme';

const trilha = (etapas: string[]) => ({
  name: 'stepper',
  props: {
    steps: etapas.length,
    view: { xMin: -0.5, xMax: etapas.length - 0.5, yMin: -1, yMax: 1 },
    render: (k: number) => <Pt x={k} y={0} color={C.gold} r={6} />,
    info: (k: number) => etapas[k],
  },
});

export const rustIteradores: UnitDef = {
  id: 'rt-iter',
  title: 'Closures e iteradores',
  icon: '🔁',
  subtitle: 'Funções anônimas, captura de ambiente e pipelines preguiçosos de custo zero',
  source: 'The Rust Programming Language (Edição 2024), cap. 13 · Desafio 50 Dias — Rust, módulo 6 (ex. 36 a 38)',
  extra: true,
  guide:
    'Uma **closure** `|x| x + 1` é uma função anônima que infere tipos pelo uso e pode capturar variáveis do escopo onde nasceu: por referência imutável (`&T`), por referência mutável (`&mut T`) ou por valor (`T`, inclusive com `move`). Os traits `Fn`, `FnMut` e `FnOnce` dependem do uso dos valores capturados no corpo: uma closure `move` também pode implementar `Fn` ou `FnMut`.\n\n' +
    'Um **iterador** é qualquer tipo que implementa o trait `Iterator`, definindo `type Item` e `fn next(&mut self) -> Option<Self::Item>`. Em um `Vec<T>`, `.iter()` entrega `&T`, `.iter_mut()` entrega `&mut T` e `.into_iter()` consome o vetor entregando `T`.\n\n' +
    '**Adaptadores** como `map`, `filter`, `take`, `skip`, `rev`, `enumerate`, `zip` e `chain` são **preguiçosos**: só montam o pipeline e não processam itens até que um **consumidor** (`collect`, `sum`, `fold`, `count`, `any`, `all`, `find`, `max_by_key` ou um laço `for`) puxe os elementos. Esses adaptadores não criam vetores intermediários por si mesmos. Com otimizações habilitadas, a cadeia pode virar código tão eficiente quanto um laço manual (abstração de custo zero); essa otimização não é garantida em toda compilação.',
  lessons: [
    {
      id: 'rt-iter-closure',
      title: 'Closures e captura',
      parts: [
        {
          card: [
            {
              title: 'Funções anônimas com |...|',
              body: 'Uma **closure** é uma função anônima que você pode guardar numa variável ou passar como argumento. Os parâmetros ficam entre barras verticais `|x|`, e não entre parênteses.\n\nDiferente de `fn`, você quase nunca precisa anotar os tipos: o compilador deduz os tipos pelo contexto e pelas chamadas, fixando uma única assinatura.',
              visual: code(
                'let add_one = |x| x + 1;\nlet sum = |a, b| a + b;\nlet fixed = || 42;\n\nlet r = sum(add_one(4), fixed());\nprintln!("{r}"); // 47',
                [1, 2, 3],
                'Sintaxe de closures',
              ),
              tip: 'Em C você passava ponteiros de função (`int (*f)(int)`), que não carregam estado. Em Rust, cada closure tem seu próprio tipo anônimo gerado pelo compilador.',
            },
            {
              title: 'Como o compilador trava o tipo',
              body: 'Sem anotação explícita, os tipos dos parâmetros e do retorno são inferidos pelo uso. No exemplo abaixo, a primeira chamada determina o tipo inteiro; tentar chamar a mesma closure depois com outro tipo gera o erro `E0308` (`mismatched types`).',
              visual: trilha([
                'Declaração: let id = |x| x; (tipo ainda em aberto).',
                '1ª chamada: let a = id(5); fixa x: i32 -> i32.',
                '2ª chamada: id("oi") falha com E0308 (esperava i32).',
              ]),
            },
          ],
          exercises: [
            mcq(
              'Quais símbolos delimitam a lista de parâmetros de uma closure em Rust?',
              ['Barras verticais: |x|', 'Parênteses: (x)', 'Colchetes: [x]', 'Sinais de menor e maior: <x>'],
              0,
              'Em Rust, os parâmetros de uma closure ficam entre barras verticais, como em `|x| x + 1` ou `|a, b| a + b`.',
            ),
            num(
              'Qual número é armazenado em `res` ao final deste trecho?',
              13,
              'A closure `step` recebe `4`, calcula `4 * 3 + 1` e devolve `13`.',
              {
                visual: code(
                  'let step = |x| x * 3 + 1;\nlet res = step(4);',
                  [1, 2],
                  'Avaliando uma closure',
                ),
              },
            ),
            tf(
              'Diferente de uma função declarada com `fn`, uma closure pode omitir as anotações de tipo dos parâmetros quando o compilador consegue deduzi-las pelo uso.',
              true,
              'Closures costumam ser curtas e usadas num contexto local, então o compilador infere os tipos dos parâmetros e do retorno automaticamente.',
            ),
            fill(
              'Complete a closure que não recebe parâmetros e devolve sempre `100`:',
              'let base = ___ 100;\nlet v = base();',
              ['||'],
              ['()', '|_|', 'fn()'],
              'Uma closure sem parâmetros usa duas barras verticais seguidas `||`, equivalentes a `()` numa função comum.',
            ),
            mcq(
              'O que acontece ao compilar esta listagem?',
              [
                'Erro E0308 na linha 3: a linha 2 fixou o parâmetro de id como inteiro.',
                'Imprime 7 e depois oi, pois id funciona como função genérica.',
                'Erro de sintaxe na linha 1 por falta de tipo em |x|.',
                'Erro E0382 na linha 3 porque a closure id foi movida.',
              ],
              0,
              'Na primeira chamada `id(7)`, o compilador infere e fixa `id` como `|i32| -> i32`. Passar `"oi"` (`&str`) na linha 3 falha com `error[E0308]: mismatched types`.',
              {
                visual: code(
                  'let id = |x| x;\nlet a = id(7);\nlet b = id("oi");',
                  [3],
                  'Inferência travada',
                ),
              },
            ),
            gen((rng) => {
              const a = randInt(rng, 2, 5);
              const b = randInt(rng, 1, 9);
              const x = randInt(rng, 3, 7);
              const ans = a * x + b;
              return num(
                'Qual é o valor final de `y` neste código?',
                ans,
                `Substituindo \`v = ${x}\` na closure: \`${x} * ${a} + ${b} = ${a * x} + ${b} = ${ans}\`.`,
                {
                  visual: code(
                    `let f = |v| v * ${a} + ${b};\nlet y = f(${x});`,
                    [1, 2],
                    'Cálculo com closure',
                  ),
                },
              );
            }),
            codePuzzle(
              'Monte o programa que define uma closure `clamp_zero` com bloco `{ ... }` (devolvendo `0` se `n < 0`, ou `n` caso contrário) e imprime o resultado para `-5`.',
              [
                'fn main() {',
                '    let clamp_zero = |n: i32| {',
                '        if n < 0 { 0 } else { n }',
                '    };',
                '    println!("{}", clamp_zero(-5));',
                '}',
              ],
              [
                '    let clamp_zero = (n: i32) => {',
                '        if n < 0 { 0; } else { n; }',
              ],
              'Parâmetros usam `|n: i32|`, e a expressão `if` sem ponto e vírgula nas chaves entrega o valor de retorno do bloco.',
            ),
            mcq(
              'Por que este código falha ao compilar com `E0308` (`mismatched types`)?',
              [
                'O ponto e vírgula após x * 2 faz a closure devolver () em vez de i32.',
                'Closures com chaves { } exigem a palavra-chave return.',
                'Não é permitido anotar o tipo i32 no parâmetro da closure.',
                'A variável res deveria ser declarada como let mut res.',
              ],
              0,
              'Dentro de `{ x * 2; }`, o `;` transforma a expressão em instrução descartada, fazendo o bloco devolver `()` (unit). Ao atribuir a `res: i32`, o compilador aponta `E0308: expected i32, found ()`. Basta remover o `;` interno.',
              {
                visual: code(
                  'let dbl = |x: i32| {\n    x * 2;\n};\nlet res: i32 = dbl(6);',
                  [2, 4],
                  'Armadilha do ponto e vírgula',
                ),
              },
            ),
          ],
        },
        {
          card: [
            {
              title: 'Capturando o ambiente',
              body: 'Diferente de uma `fn` comum, uma closure enxerga as variáveis do escopo onde foi criada. O compilador analisa o corpo da closure e escolhe automaticamente a captura menos restritiva:\n\n• **Empréstimo imutável (`&T`)**: quando a closure só lê a variável.\n• **Empréstimo mutável (`&mut T`)**: quando a closure altera a variável.\n• **Por valor (`T`)**: quando a closure move ou consome a variável (ou quando você escreve `move` antes de `|...|`).',
              visual: code(
                'let limit = 10;\n// captura &limit:\nlet ok = |x: i32| x <= limit;\n\nlet tag = String::from("RPM");\nlet take = move || println!("{tag}");',
                [3, 6],
                'Captura automática e move',
              ),
            },
            {
              title: 'Os três modos de captura na memória',
              body: 'Enquanto uma closure mantém um empréstimo (`&T` ou `&mut T`) ativo para ser chamada mais adiante, as regras normais do borrow checker continuam valendo.',
              visual: table(
                ['Captura', 'O que a closure guarda', 'Efeito na variável externa'],
                [
                  ['`&T`', 'Referência compartilhada', 'Pode ser lida, mas não alterada até o último uso da closure'],
                  ['`&mut T`', 'Referência exclusiva', 'Não pode ser lida nem alterada por fora até o último uso da closure'],
                  ['`move` / `T`', 'O próprio valor', 'Se for `Copy` (ex.: `i32`), copia; se não for (ex.: `String`), move'],
                ],
              ),
            },
            {
              title: 'No seu computador',
              body: 'Crie um projeto com `cargo new closures_captura` e abra `src/main.rs`.\n\n1. Declare `let offset = 10;` e uma closure `aplicar_offset` que some `offset` ao parâmetro.\n2. Declare `let mut leituras = 0;` e uma closure `let mut registrar = |v: i32| { leituras += 1; v + offset };` (tente imprimir `leituras` entre duas chamadas de `registrar` para observar o conflito de empréstimos; depois mova a impressão para após a última chamada).\n3. Crie uma `String` e mova-a para dentro de uma closure `move || ...`.\n\n**Critério de pronto:** `cargo run` imprime os resultados calculados e a contagem final de `leituras`, e `cargo clippy -- -D warnings` termina sem nenhum aviso.',
              visual: code(
                'fn main() {\n    let offset = 10;\n    let mut count = 0;\n    let mut reg = |v: i32| {\n        count += 1;\n        v + offset\n    };\n    println!("{}", reg(25));\n    println!("total: {count}");\n}',
                [4, 5, 6],
                'src/main.rs',
              ),
            },
          ],
          exercises: [
            match(
              'Associe cada forma de captura na closure ao que acontece com a variável externa:',
              [
                ['Captura por &T', 'A closure apenas lê a variável sem alterá-la'],
                ['Captura por &mut T', 'A closure modifica a variável externa no lugar'],
                ['Captura com move (String)', 'A posse do texto passa para dentro da closure'],
              ],
              'O compilador empresta por `&T` para leitura, por `&mut T` para escrita e transfere a posse quando o valor é movido ou quando usamos `move`.',
            ),
            num(
              'Qual valor é impresso por este programa?',
              22,
              'A closure `shift` captura `offset` por referência imutável (`&i32`), então `offset` continua acessível fora dela. Temos `shift(12) = 12 + 5 = 17`, e `17 + 5 = 22`.',
              {
                visual: code(
                  'let offset = 5;\nlet shift = |x| x + offset;\nlet r = shift(12) + offset;\nprintln!("{r}");',
                  [2, 3],
                  'Leitura compartilhada',
                ),
              },
            ),
            tf(
              'Uma função declarada com `fn` dentro de `main` pode capturar variáveis locais de `main` da mesma forma que uma closure.',
              false,
              'Funções `fn` não capturam o ambiente local (erro `E0434`). Apenas closures podem capturar variáveis do escopo onde foram definidas.',
            ),
            mcq(
              'Por que a linha 3 não compila neste código?',
              [
                'Erro E0502: v está emprestado como imutável por show até a linha 4, impedindo v.push(4).',
                'Erro E0382: a closure show tomou posse do vetor v por move.',
                'Erro E0596: a variável show precisava ser declarada como let mut show.',
                'Não é permitido usar println! dentro de uma closure.',
              ],
              0,
              'A closure `show` captura `&v` na linha 2 e usa esse empréstimo na linha 4. Chamar `v.push(4)` na linha 3 exige `&mut v` enquanto `&v` ainda está ativo, disparando `error[E0502]: cannot borrow v as mutable because it is also borrowed as immutable`.',
              {
                visual: code(
                  'let mut v = vec![1, 2];\nlet show = || println!("{:?}", v);\nv.push(4);\nshow();',
                  [2, 3, 4],
                  'Conflito de empréstimo',
                ),
              },
            ),
            mcq(
              'Qual erro o compilador aponta na linha 3?',
              [
                'Erro E0382: name foi movida para dentro de greet por causa do move.',
                'Erro E0502: conflito entre empréstimo mutável e imutável.',
                'Erro E0308: tipos incompatíveis no println!.',
                'Erro E0594: name não foi declarada como mut.',
              ],
              0,
              'Como `String` não implementa `Copy`, a palavra-chave `move` transfere a posse de `name` para dentro de `greet` na linha 2. Tentar ler `name` na linha 3 falha com `error[E0382]: borrow of moved value: name`.',
              {
                visual: code(
                  'let name = String::from("Ana");\nlet greet = move || println!("{name}");\nprintln!("{name}");\ngreet();',
                  [2, 3],
                  'Posse transferida com move',
                ),
              },
            ),
            gen((rng) => {
              const base = randInt(rng, 10, 30);
              const d1 = randInt(rng, 2, 8);
              const d2 = randInt(rng, 3, 9);
              const total = base + d1 + d2;
              return num(
                'Qual é o valor de `acc` impresso na última linha?',
                total,
                `A closure \`add\` captura \`&mut acc\`. Após somar \`${d1}\` e \`${d2}\` ao valor inicial \`${base}\`, o empréstimo mutável termina e \`println!\` imprime \`${base} + ${d1} + ${d2} = ${total}\`.`,
                {
                  visual: code(
                    `let mut acc = ${base};\nlet mut add = |d| acc += d;\nadd(${d1});\nadd(${d2});\nprintln!("{acc}");`,
                    [2, 3, 4, 5],
                    'Captura mutável (&mut T)',
                  ),
                },
              );
            }),
            codePuzzle(
              'Monte o trecho que captura `total` por `&mut`, soma dois valores pela closure e só lê `total` depois que a closure termina de ser usada.',
              [
                'let mut total = 10;',
                'let mut add = |x| total += x;',
                'add(4);\nadd(6);',
                'println!("{total}");',
              ],
              [
                'let total = 10;',
                'let add = |x| total += x;',
              ],
              'Tanto `total` quanto a própria closure `add` precisam de `let mut`. Como `println!("{total}")` vem depois da última chamada a `add`, o empréstimo `&mut total` já se encerrou (Non-Lexical Lifetimes).',
            ),
            mcq(
              'O que acontece ao compilar e rodar este código com `move`?',
              [
                'Compila e imprime 15, pois i32 é Copy e move copia factor para a closure.',
                'Falha com E0382 na linha 3 porque factor foi movido na linha 2.',
                'Falha com E0502 na linha 3 porque factor está emprestado.',
                'Compila e imprime 12, pois factor passa a valer 0 fora da closure.',
              ],
              0,
              'Para tipos que implementam `Copy` (como `i32`), capturar por valor com `move` faz uma cópia independente de `factor` para dentro da closure. O `factor` original continua válido em `main`, resultando em `4 * 3 + 3 = 15`.',
              {
                visual: code(
                  'let factor = 3;\nlet mul = move |x| x * factor;\nlet res = mul(4) + factor;\nprintln!("{res}");',
                  [2, 3],
                  'move com tipo Copy',
                ),
              },
            ),
          ],
        },
      ],
    },
    {
      id: 'rt-iter-fn',
      title: 'Fn, FnMut e FnOnce',
      parts: [
        {
          card: [
            {
              title: 'Os três traits de closure',
              body: 'A forma como uma closure usa os valores capturados determina quais dos três traits da biblioteca padrão ela implementa:\n\n• **`FnOnce`**: pode ser chamada pelo menos uma vez. Toda closure implementa `FnOnce` (as que movem um valor capturado não-`Copy` para fora do corpo implementam **apenas** `FnOnce`).\n• **`FnMut`**: não move valores capturados para fora do seu corpo, mas pode alterá-los (`&mut`). Pode ser chamada várias vezes.\n• **`Fn`**: não precisa de acesso mutável ao próprio ambiente nem move valores capturados para fora. Pode ser chamada várias vezes mesmo por referência compartilhada, inclusive se capturou valores com `move`. Mutabilidade interior (como `Cell`) ainda pode permitir alterações por referência compartilhada.',
              visual: code(
                'let mut count = 0;\nlet mut inc = || {\n    count += 1;\n    count\n};\nprintln!("{}", inc()); // 1\nprintln!("{}", inc()); // 2',
                [2, 3, 4],
                'Closure FnMut exige let mut',
              ),
            },
            {
              title: 'Hierarquia: quem implementa o quê',
              body: 'Os traits formam uma hierarquia de subtraits: `Fn: FnMut` e `FnMut: FnOnce`. Isso significa que uma closure `Fn` pode ser usada em qualquer lugar que peça `Fn`, `FnMut` ou `FnOnce`.',
              visual: table(
                ['O que o corpo faz com o ambiente', 'Traits implementados', 'Quantas chamadas?'],
                [
                  ['Não captura nada ou só lê (`&T`)', '`Fn`, `FnMut`, `FnOnce`', 'Quantas quiser (sem `mut`)'],
                  ['Altera variável capturada (`&mut T`)', '`FnMut`, `FnOnce`', 'Quantas quiser (exige `let mut`)'],
                  ['Move valor capturado não-`Copy` para fora do corpo', 'Apenas `FnOnce`', 'Uma única vez (consome a closure)'],
                ],
              ),
            },
          ],
          exercises: [
            mcq(
              'Qual trait é implementado por **toda e qualquer** closure em Rust?',
              ['FnOnce', 'Fn', 'FnMut', 'Copy'],
              0,
              'Toda closure pode ser chamada ao menos uma vez, portanto toda closure implementa `FnOnce`. As que não movem valores para fora também implementam `FnMut`, e as que também não alteram o ambiente implementam `Fn`.',
            ),
            tf(
              'Toda closure que implementa `Fn` também implementa automaticamente `FnMut` e `FnOnce`.',
              true,
              'Na biblioteca padrão, `Fn` é subtrait de `FnMut`, que por sua vez é subtrait de `FnOnce`. Logo, quem satisfaz `Fn` satisfaz os três.',
            ),
            mcq(
              'Por que este código falha ao compilar na linha 3?',
              [
                'Erro E0596: inc implementa FnMut e precisa ser declarada como let mut inc.',
                'Erro E0594: count não pode ser alterado dentro de uma closure.',
                'Erro E0382: count foi movido para dentro de inc.',
                'Erro E0308: a closure deveria retornar um inteiro.',
              ],
              0,
              'Como o corpo altera `count`, a closure implementa `FnMut`, cujo método de chamada recebe `&mut self`. Para chamá-la na linha 3, a própria variável `inc` precisa ser mutável (`let mut inc`), senão ocorre `error[E0596]: cannot borrow inc as mutable, as it is not declared as mutable`.',
              {
                visual: code(
                  'let mut count = 0;\nlet inc = || count += 1;\ninc();',
                  [2, 3],
                  'Faltou mut na closure',
                ),
              },
            ),
            num(
              'Qual valor é impresso ao final deste trecho?',
              6,
              'Na 1ª chamada, `acc` passa de `1` para `2` e retorna `2` (`a = 2`). Na 2ª chamada, `acc` passa de `2` para `4` e retorna `4` (`b = 4`). A soma `a + b` vale `6`.',
              {
                visual: code(
                  'let mut acc = 1;\nlet mut step = || {\n    acc *= 2;\n    acc\n};\nlet a = step();\nlet b = step();\nprintln!("{}", a + b);',
                  [2, 6, 7],
                  'Estado mutável entre chamadas',
                ),
              },
            ),
            match(
              'Para uma variável mutável `s: String`, considere cada closure separadamente e associe ao trait mais específico que ela consegue implementar:',
              [
                ['|| println!("{}", s.len())', 'Fn (apenas lê s por &String)'],
                ['|| s.push_str("!")', 'FnMut (altera s por &mut String)'],
                ['|| drop(s)', 'FnOnce (consome e descarta s por valor)'],
              ],
              'Ler `s.len()` só requer `&s` (`Fn`); `s.push_str("!")` modifica `s` sem destruí-la (`FnMut`); `drop(s)` move `s` para fora da closure, permitindo apenas uma chamada (`FnOnce`).',
            ),
            gen((rng) => {
              const start = randInt(rng, 2, 10);
              const step = randInt(rng, 3, 7);
              const ans = start + 3 * step;
              return num(
                'Qual é o valor de `ans` após as três chamadas de `tick()`?',
                ans,
                `A variável \`n\` começa em \`${start}\` e aumenta \`${step}\` a cada chamada: \`${start} + 3 * ${step} = ${ans}\`.`,
                {
                  visual: code(
                    `let mut n = ${start};\nlet mut tick = || {\n    n += ${step};\n    n\n};\ntick();\ntick();\nlet ans = tick();`,
                    [6, 7, 8],
                    'Três chamadas FnMut',
                  ),
                },
              );
            }),
            codePuzzle(
              'Monte o código que cria um acumulador `sum`, define uma closure `FnMut` chamada `add`, acumula `10` e `15` e imprime `sum`.',
              [
                'let mut sum = 0;',
                'let mut add = |x: i32| sum += x;',
                'add(10);\nadd(15);',
                'println!("{sum}");',
              ],
              [
                'let add = |x: i32| sum += x;',
                'let sum = 0;',
              ],
              'Tanto a variável capturada `sum` quanto a closure `add` (que é `FnMut`) precisam de `let mut`.',
            ),
            mcq(
              'O que acontece na linha 4 ao chamar `consume()` pela segunda vez?',
              [
                'Erro E0382: consume implementa apenas FnOnce e foi consumida na linha 3.',
                'Imprime o texto normalmente duas vezes.',
                'Compila, mas entra em pânico na segunda chamada.',
                'Erro E0596: falta let mut consume na linha 2.',
              ],
              0,
              '`std::mem::drop(s)` move `s: String` para fora da closure, portanto `consume` implementa apenas `FnOnce`. A chamada na linha 3 consome a própria closure `consume` por valor; a linha 4 falha com `error[E0382]: use of moved value: consume`.',
              {
                visual: code(
                  'let s = String::from("log");\nlet consume = || drop(s);\nconsume();\nconsume();',
                  [2, 3, 4],
                  'Closure FnOnce chamada duas vezes',
                ),
              },
            ),
          ],
        },
        {
          card: [
            {
              title: 'Recebendo closures em funções',
              body: 'Para escrever uma função que recebe uma closure (como no exercício 36 do roteiro), usamos um parâmetro genérico `F` restrito por `Fn`, `FnMut` ou `FnOnce`:\n\n`fn apply<F: Fn(i32) -> i32>(x: i32, f: F) -> i32`\n\nO compilador gera uma versão especializada da função para cada closure passada (**monomorfização**), permitindo fazer *inlining* da chamada sem custo de ponteiro de função.',
              visual: code(
                'fn apply<F>(\n    list: &[i32],\n    f: F,\n) -> Vec<i32>\nwhere\n    F: Fn(i32) -> i32,\n{\n    let mut out = Vec::new();\n    for &x in list {\n        out.push(f(x));\n    }\n    out\n}',
                [1, 6, 10],
                'Função de ordem superior',
              ),
              tip: 'Regra prática ao projetar APIs: se sua função chama o callback uma única vez, peça `FnOnce`; se chama várias vezes em sequência, peça `FnMut`; se precisa chamá-lo sem mutabilidade exclusiva, peça `Fn`.',
            },
            {
              title: 'Acompanhando a execução de apply',
              body: 'Veja o que acontece passo a passo ao chamar `apply(&[2, 5], |x| x * 10)`.',
              visual: trilha([
                'Início: list = &[2, 5], out = [] (vazio).',
                '1ª iteração: x = 2 -> f(2) devolve 20 -> out = [20].',
                '2ª iteração: x = 5 -> f(5) devolve 50 -> out = [20, 50].',
                'Retorno: devolve o Vec<i32> com [20, 50].',
              ]),
            },
            {
              title: 'No seu computador',
              body: 'Hora do **Exercício 36** do roteiro! Crie um projeto com `cargo new closures_fn`.\n\n1. Escreva `fn aplicar<F: Fn(i32) -> i32>(lista: &[i32], f: F) -> Vec<i32>`.\n2. No `main`, teste `aplicar` com pelo menos três closures diferentes: `|x| x * 2`, `|x| x * x` e uma que capture uma variável local `ganho`.\n3. Depois crie `let mut contador = 0; let mut inc = || contador += 1;`, chame `inc()` três vezes e imprima `contador`.\n\n**Critério de pronto:** `cargo run` exibe os vetores transformados e o contador final `3`, e `cargo clippy -- -D warnings` passa sem avisos.',
              visual: code(
                'fn main() {\n    let nums = [1, 2, 3, 4];\n    let gain = 5;\n    let r1 = apply(&nums, |x| x * 2);\n    let r2 = apply(&nums, |x| x + gain);\n    println!("{r1:?} {r2:?}");\n}',
                [4, 5],
                'main (junto da função apply do card anterior)',
              ),
            },
          ],
          exercises: [
            fill(
              'Complete a assinatura para aceitar qualquer closure que receba um `i32`, possa ser chamada várias vezes sem mutação e devolva `bool`:',
              'fn test_val<F: ___(i32) -> ___>(x: i32, f: F) -> bool {\n    f(x)\n}',
              ['Fn', 'bool'],
              ['FnOnce', 'i32', 'mut'],
              'O trait `Fn(i32) -> bool` descreve um chamável por referência imutável que recebe `i32` e devolve `bool`.',
            ),
            num(
              'Qual valor é impresso por este programa?',
              11,
              'A função `twice` aplica `f` duas vezes: `f(3) = 3 + 4 = 7`, e `f(7) = 7 + 4 = 11`.',
              {
                visual: code(
                  'fn twice<F>(x: i32, f: F) -> i32\nwhere\n    F: Fn(i32) -> i32,\n{\n    f(f(x))\n}\nfn main() {\n    println!("{}", twice(3, |n| n + 4));\n}',
                  [3, 5, 8],
                  'Aplicando duas vezes',
                ),
              },
            ),
            tf(
              'Uma função cuja assinatura pede `F: FnOnce(i32) -> i32` aceita receber uma closure que implementa `Fn(i32) -> i32`.',
              true,
              'Como `Fn` é subtrait de `FnMut` e de `FnOnce`, toda closure `Fn` também satisfaz o bound `FnOnce`. `FnOnce` é o bound mais flexível para quem passa a closure.',
            ),
            mcq(
              'Por que a função `run_twice` abaixo não compila?',
              [
                'Erro E0382 na linha 3: como F só garante FnOnce(), a 1ª chamada f() consome f.',
                'Erro E0308: falta o tipo de retorno -> () na assinatura.',
                'Erro E0596: uma função genérica não pode chamar f() sem ponteiro.',
                'Não é permitido chamar um parâmetro genérico mais de uma vez em Rust.',
              ],
              0,
              'O bound `F: FnOnce()` só garante que `f` pode ser chamada uma vez (por valor, movendo `f`). Na linha 3, `f` já foi movida na linha 2 (`error[E0382]: use of moved value: f`). Para chamar duas vezes, use `F: FnMut()` com o parâmetro `mut f: F`, ou `F: Fn()`.',
              {
                visual: code(
                  'fn run_twice<F: FnOnce()>(f: F) {\n    f();\n    f();\n}',
                  [1, 2, 3],
                  'Bound insuficiente',
                ),
              },
            ),
            mcq(
              'Por que a closure na linha 6 falha ao compilar?',
              [
                'Erro E0507: call_fn exige Fn(), mas o corpo tenta mover s para drop.',
                'Erro E0382: s foi usada depois do drop.',
                'Erro E0308: drop(s) devolve i32 em vez de ().',
                'Erro E0502: s está emprestada como mutável e imutável.',
              ],
              0,
              '`call_fn` exige `F: Fn()`, então a closure passada diretamente na chamada é verificada como `Fn`. Seu corpo tenta mover `s: String` para `drop(s)`, o que gera `E0507`: não se pode mover um valor capturado para fora de uma closure `Fn`. Um bound `FnOnce()` permitiria esse consumo.',
              {
                visual: code(
                  'fn call_fn<F: Fn()>(f: F) {\n    f();\n}\nfn main() {\n    let s = String::from("oi");\n    call_fn(|| drop(s));\n}',
                  [1, 6],
                  'Movendo uma captura de uma closure Fn',
                ),
              },
            ),
            gen((rng) => {
              const x = randInt(rng, 1, 5);
              const k = randInt(rng, 2, 3);
              const c = randInt(rng, 1, 4);
              const step1 = x * k + c;
              const step2 = step1 * k + c;
              return num(
                'Qual número `apply_twice` devolve na chamada mostrada?',
                step2,
                `Na 1ª aplicação: \`f(${x}) = ${x} * ${k} + ${c} = ${step1}\`. Na 2ª aplicação: \`f(${step1}) = ${step1} * ${k} + ${c} = ${step2}\`.`,
                {
                  visual: code(
                    `fn apply_twice<F: Fn(i32) -> i32>(\n    v: i32,\n    f: F,\n) -> i32 {\n    f(f(v))\n}\nlet step = |n| n * ${k} + ${c};\nlet r = apply_twice(${x}, step);`,
                    [5, 7, 8],
                    'Composição de chamadas',
                  ),
                },
              );
            }),
            codePuzzle(
              'Monte a função genérica `eval` que recebe `x: i32` e uma closure `f: F` (com `F: Fn(i32) -> i32`) e devolve o dobro do resultado de `f(x)`.',
              [
                'fn eval<F>(x: i32, f: F) -> i32',
                'where',
                '    F: Fn(i32) -> i32,',
                '{',
                '    f(x) * 2',
                '}',
              ],
              [
                '    F: FnOnce() -> i32,',
                '    f(x) * 2;',
              ],
              'A cláusula `where F: Fn(i32) -> i32` declara a assinatura da closure, e `f(x) * 2` sem ponto e vírgula devolve o valor calculado.',
            ),
            order(
              'Ordene o que acontece na compilação e execução de `eval(5, |x| x + 1)` com `F: Fn(i32) -> i32`:',
              [
                'O compilador gera um struct anônimo único para a closure |x| x + 1',
                'O compilador monomorfiza eval criando uma versão específica para esse tipo F',
                'A chamada à closure usa despacho estático; o otimizador pode fazer inlining de x + 1',
                'Na execução, eval devolve (5 + 1) * 2, isto é, 12',
              ],
              'O tipo concreto `F` permite despacho estático. Inlining e cálculo antecipado são otimizações possíveis, mas não são garantidos, especialmente em builds de debug.',
            ),
          ],
        },
      ],
    },
    {
      id: 'rt-iter-trait',
      title: 'O trait Iterator',
      parts: [
        {
          card: [
            {
              title: 'O método next() e os três iteradores',
              body: 'Em Rust, todo iterador implementa o trait `Iterator`, cujo único método obrigatório é `next(&mut self) -> Option<Self::Item>`. Cada chamada a `next()` entrega `Some(item)` com o próximo elemento e avança o cursor interno; quando a sequência acaba, entrega `None`. Em geral, um iterador pode voltar a entregar `Some` depois de `None`; `.fuse()` garante que isso não aconteça.\n\nUma coleção como `Vec<T>` oferece três métodos para criar um iterador:\n• **`.iter()`**: produz `&T` (empréstimo imutável).\n• **`.iter_mut()`**: produz `&mut T` (empréstimo mutável, altera no lugar).\n• **`.into_iter()`**: consome a coleção e produz `T` por valor.',
              visual: code(
                'let v = vec![10, 20];\nlet mut it = v.iter();\nassert_eq!(it.next(), Some(&10));\nassert_eq!(it.next(), Some(&20));\nassert_eq!(it.next(), None);',
                [2, 3, 4, 5],
                'Avançando com next()',
              ),
              tip: 'No Módulo 2 (exercício 13), você viu `for x in &v`, `for x in &mut v` e `for x in v`. O laço chama `IntoIterator::into_iter` sobre a expressão; para `v: Vec<T>`, os iteradores resultantes equivalem aos de `v.iter()`, `v.iter_mut()` e `v.into_iter()`, respectivamente.',
            },
            {
              title: 'Comparando iter, iter_mut e into_iter',
              body: 'Escolher o método certo define se a coleção original continua disponível após a iteração.',
              visual: table(
                ['Método', 'Laço equivalente', 'Tipo do item', 'Coleção original depois'],
                [
                  ['`v.iter()`', '`for x in &v`', '`&T`', 'Continua intacta e acessível'],
                  ['`v.iter_mut()`', '`for x in &mut v`', '`&mut T`', 'Continua acessível, com valores alterados'],
                  ['`v.into_iter()`', '`for x in v`', '`T`', 'Foi consumida (movida); usar `v` gera `E0382`'],
                ],
              ),
            },
          ],
          exercises: [
            mcq(
              'O que o método `next()` de um iterador devolve quando não há mais elementos na sequência?',
              ['None', 'Some(0)', 'Um erro Result::Err', 'Entra em panic!'],
              0,
              '`next(&mut self)` devolve `Option<Self::Item>`: `Some(valor)` enquanto houver itens e `None` quando a sequência termina.',
            ),
            match(
              'Para `v: Vec<String>`, associe cada método ao tipo retornado por cada chamada a `next()`:',
              [
                ['v.iter()', 'Option<&String>'],
                ['v.iter_mut()', 'Option<&mut String>'],
                ['v.into_iter()', 'Option<String>'],
              ],
              '`iter()` empresta cada elemento por `&String`, `iter_mut()` empresta por `&mut String` e `into_iter()` move cada `String` para fora do vetor.',
            ),
            mcq(
              'Por que este código falha ao compilar na linha 3?',
              [
                'Erro E0596: it precisa ser declarada como let mut it porque next(&mut self) altera o iterador.',
                'Erro E0594: v precisa ser declarado como let mut v para poder usar .iter().',
                'Erro E0382: v.iter() move o vetor v na linha 2.',
                'Erro E0308: next() exige um índice inteiro como argumento.',
              ],
              0,
              'Cada chamada a `next(&mut self)` avança o estado interno do iterador. Mesmo que o vetor `v` seja imutável, a variável do iterador `it` precisa ser `let mut it` (`error[E0596]: cannot borrow it as mutable, as it is not declared as mutable`).',
              {
                visual: code(
                  'let v = vec![10, 20];\nlet it = v.iter();\nlet first = it.next();',
                  [2, 3],
                  'Iterador precisa de mut',
                ),
              },
            ),
            num(
              'Qual valor é impresso ao final deste trecho?',
              20,
              'O laço com `iter_mut()` dobra cada elemento no próprio vetor: `v` passa a ser `[6, 10, 14]`. A soma `v[0] + v[2]` é `6 + 14 = 20`.',
              {
                visual: code(
                  'let mut v = vec![3, 5, 7];\nfor x in v.iter_mut() {\n    *x *= 2;\n}\nprintln!("{}", v[0] + v[2]);',
                  [2, 3, 5],
                  'Alterando no lugar com iter_mut()',
                ),
              },
            ),
            mcq(
              'Qual erro o compilador aponta na linha 5?',
              [
                'Erro E0382: into_iter() consumiu o vetor names na linha 2.',
                'Erro E0502: names ainda está emprestado mutavelmente.',
                'Erro E0596: names precisava ser let mut names.',
                'Erro E0308: names.len() devolve usize e println! espera i32.',
              ],
              0,
              '`names.into_iter()` recebe `self` por valor e move o `Vec<String>` para dentro do iterador. Tentar chamar `names.len()` na linha 5 falha com `error[E0382]: borrow of moved value: names`.',
              {
                visual: code(
                  'let names = vec![String::from("Ana")];\nfor s in names.into_iter() {\n    println!("{s}");\n}\nprintln!("{}", names.len());',
                  [2, 5],
                  'Vetor consumido por into_iter()',
                ),
              },
            ),
            gen((rng) => {
              const a = randInt(rng, 10, 25);
              const b = randInt(rng, 30, 55);
              const c = randInt(rng, 60, 90);
              return num(
                'Qual número fica guardado em `ans`?',
                b,
                `A 1ª chamada a \`it.next()\` consome e descarta \`Some(${a})\`. A 2ª chamada devolve \`Some(${b})\`, e \`unwrap_or(0)\` extrai \`${b}\`.`,
                {
                  visual: code(
                    `let v = vec![${a}, ${b}, ${c}];\nlet mut it = v.into_iter();\nit.next();\nlet ans = it.next().unwrap_or(0);`,
                    [3, 4],
                    'Duas chamadas a next()',
                  ),
                },
              );
            }),
            codePuzzle(
              'Monte o trecho que percorre `scores` com `iter_mut()`, soma `10` a cada nota usando desreferência `*s` e imprime a primeira nota.',
              [
                'let mut scores = vec![75, 80];',
                'for s in scores.iter_mut() {',
                '    *s += 10;',
                '}',
                'println!("{}", scores[0]);',
              ],
              [
                'for s in scores.iter() {',
                '    s += 10;',
              ],
              '`iter_mut()` entrega `s: &mut i32`. Para somar ao inteiro apontado, desreferenciamos com `*s += 10;`.',
            ),
            mcq(
              'Por que a linha 3 não compila neste código?',
              [
                'Erro E0594: v.iter() entrega referências imutáveis &i32, que não permitem *x += 1.',
                'Erro E0382: v foi movido na chamada v.iter().',
                'Erro E0308: *x deveria ser escrito como &x.',
                'Erro E0502: x e v disputam empréstimo mutável.',
              ],
              0,
              '`v.iter()` produz itens do tipo `&i32` (somente leitura), mesmo que `v` seja `mut`. Tentar atribuir a `*x` gera `error[E0594]: cannot assign to *x, which is behind a & reference`. Para alterar os elementos, use `v.iter_mut()`.',
              {
                visual: code(
                  'let mut v = vec![1, 2, 3];\nfor x in v.iter() {\n    *x += 1;\n}',
                  [2, 3],
                  'Tentando mutar com .iter()',
                ),
              },
            ),
          ],
        },
        {
          card: [
            {
              title: 'Implementando seu próprio Iterator',
              body: 'Qualquer `struct` criada por você vira um iterador ao implementar o trait `Iterator` (exercício 38 do roteiro). Você só precisa especificar duas coisas:\n\n1. O tipo associado `type Item = ...;`.\n2. O método `fn next(&mut self) -> Option<Self::Item>`.\n\nAssim que `next()` está pronto, dezenas de métodos padrão do trait `Iterator` (`take`, `skip`, `filter`, `map`, `fold`, `sum`, `collect`...) passam a funcionar no seu tipo gratuitamente!',
              visual: code(
                'struct Counter {\n    curr: u32,\n    max: u32,\n}\nimpl Iterator for Counter {\n    type Item = u32;\n    fn next(&mut self) -> Option<u32> {\n        if self.curr < self.max {\n            self.curr += 1;\n            Some(self.curr)\n        } else {\n            None\n        }\n    }\n}',
                [5, 6, 7, 10, 12],
                'Implementando Iterator',
              ),
            },
            {
              title: 'Passo a passo do Counter',
              body: 'Acompanhe as chamadas a `next()` para `Counter { curr: 0, max: 3 }`.',
              visual: trilha([
                '1ª chamada: curr (0) < 3 -> curr vira 1 -> devolve Some(1).',
                '2ª chamada: curr (1) < 3 -> curr vira 2 -> devolve Some(2).',
                '3ª chamada: curr (2) < 3 -> curr vira 3 -> devolve Some(3).',
                '4ª chamada: curr (3) < 3 é falso -> devolve None (fim!).',
              ]),
            },
            {
              title: 'No seu computador',
              body: 'Hora do **Exercício 38** do roteiro! Crie um projeto com `cargo new iter_fibonacci`.\n\n1. Crie `struct Fibonacci { curr: u64, next: u64 }` com `Fibonacci::new()` iniciando em `curr: 0, next: 1`.\n2. Implemente `Iterator for Fibonacci` com `type Item = u64;`. Em cada `next(&mut self)`, guarde `self.curr`, atualize o par para `(self.next, self.curr + self.next)` e devolva `Some(atual)`. Esse modelo tem capacidade limitada pelo `u64`: ao excedê-la, entra em pânico com checagens de overflow habilitadas (padrão em debug) ou faz wrap sem elas (padrão em release).\n3. No `main`, use `for x in Fibonacci::new().take(10)` para imprimir os 10 primeiros termos e calcule a soma deles com `Fibonacci::new().take(10).sum::<u64>()`.\n\n**Critério de pronto:** `cargo run` imprime os 10 termos (`0, 1, 1, 2, 3, 5, 8, 13, 21, 34`) e a soma `88`, e `cargo clippy -- -D warnings` passa sem avisos.',
              visual: code(
                'struct Fibonacci {\n    curr: u64,\n    next: u64,\n}\nimpl Iterator for Fibonacci {\n    type Item = u64;\n    fn next(&mut self) -> Option<u64> {\n        let out = self.curr;\n        self.curr = self.next;\n        self.next += out;\n        Some(out)\n    }\n}',
                [5, 6, 7, 11],
                'Gerador de Fibonacci',
              ),
            },
          ],
          exercises: [
            fill(
              'Complete os dois itens obrigatórios dentro de `impl Iterator for MeuTipo`:',
              'type ___ = i32;\nfn ___(&mut self) -> Option<Self::Item>',
              ['Item', 'next'],
              ['Output', 'iter', 'into_iter'],
              'O trait `Iterator` exige o tipo associado `Item` e o método `next(&mut self) -> Option<Self::Item>`.',
            ),
            tf(
              'Depois de implementar apenas `type Item` e `fn next` no trait `Iterator` para uma struct, métodos como `.take()`, `.map()`, `.filter()` e `.sum()` já podem ser usados nela sem código extra.',
              true,
              'Todos os adaptadores e consumidores do trait `Iterator` possuem implementações padrão escritas em termos de `next()`.',
            ),
            num(
              'Qual valor é impresso por este programa que usa o `Counter` de `1` até `max`?',
              6,
              'O `Counter` com `curr: 0, max: 3` entrega `Some(1)`, `Some(2)`, `Some(3)` e depois `None`. A soma é `1 + 2 + 3 = 6`.',
              {
                visual: code(
                  'let c = Counter { curr: 0, max: 3 };\nlet s: u32 = c.sum();\nprintln!("{s}");',
                  [1, 2],
                  'Somando um iterador próprio',
                ),
              },
            ),
            mcq(
              'No iterador `Fibonacci` do card (cujo `next` sempre devolve `Some(out)` e nunca devolve `None`), o que aconteceria se fizéssemos `let s: u64 = Fibonacci::new().sum();` sem `.take(10)`?',
              [
                'Com checagens de overflow, entraria em pânico; sem elas, faria wrap e nunca terminaria, pois next() não devolve None.',
                'O compilador recusaria compilar com erro E0277 porque next() não contém a palavra None.',
                'O método sum() pararia sozinho após 100 elementos por segurança.',
                'Retornaria 0 imediatamente.',
              ],
              0,
              'Esse `next()` não tem condição de término. Com checagens de overflow (padrão em debug), a soma ou a atualização do estado entra em pânico ao ultrapassar `u64`. Sem elas (padrão em release), os valores fazem wrap e `sum()` não termina. Usar `.take(n)` limita a quantidade de itens, mas `n` também precisa ser pequeno o bastante para evitar overflow.',
            ),
            gen((rng) => {
              const n = randInt(rng, 3, 7);
              const ans = (n * (n + 1)) / 2;
              return num(
                'Considerando o `Counter` que produz de `1` até `max`, qual valor fica em `total`?',
                ans,
                `O iterador produz os inteiros de \`1\` até \`${n}\`. A soma é \`1 + 2 + ... + ${n} = ${ans}\`.`,
                {
                  visual: code(
                    `let c = Counter { curr: 0, max: ${n} };\nlet total: u32 = c.sum();`,
                    [1, 2],
                    'Soma de 1 até max',
                  ),
                },
              );
            }),
            codePuzzle(
              'Monte a implementação de `Iterator` para `Countdown { n: u32 }`, que devolve `Some(self.n)` e decrementa `self.n` enquanto `self.n > 0`, ou `None` quando chega a `0`.',
              [
                'struct Countdown { n: u32 }\nimpl Iterator for Countdown {\n    type Item = u32;',
                '    fn next(&mut self) -> Option<u32> {',
                '        if self.n == 0 {\n            return None;\n        }\n        let out = self.n;',
                '        self.n -= 1;',
                '        Some(out)',
                '    }',
                '}',
              ],
              [
                '    fn next(self) -> Option<u32> {',
                '        out',
              ],
              '`next` recebe `&mut self` para poder atualizar `self.n` e embrulha o valor produzido em `Some(out)`.',
            ),
            order(
              'Ordene o que acontece no laço `for x in (Counter { curr: 0, max: 2 }) { println!("{x}"); }`:',
              [
                'O laço for obtém o iterador mutável a partir de Counter',
                '1ª chamada a next() muda curr para 1, devolve Some(1) e executa o corpo com x = 1',
                '2ª chamada a next() muda curr para 2, devolve Some(2) e executa o corpo com x = 2',
                '3ª chamada a next() vê curr == max, devolve None e encerra o laço for',
              ],
              'O laço `for` chama `next(&mut it)` repetidamente enquanto o retorno casar com `Some(x)` e para no primeiro `None`.',
            ),
            num(
              'Usando o gerador `Fibonacci` do card (que começa com `curr: 0, next: 1`), qual é o valor de `ans`?',
              7,
              'Os 5 primeiros valores entregues por `next()` são `0, 1, 1, 2, 3`. A soma deles é `0 + 1 + 1 + 2 + 3 = 7`.',
              {
                visual: code(
                  'let fib = Fibonacci {\n    curr: 0,\n    next: 1,\n};\nlet ans: u64 = fib.take(5).sum();',
                  [5],
                  'Primeiros 5 termos de Fibonacci',
                ),
              },
            ),
          ],
        },
      ],
    },
    {
      id: 'rt-iter-adapt',
      title: 'map, filter, fold e collect',
      parts: [
        {
          card: [
            {
              title: 'Transformar e filtrar: map e filter',
              body: 'Em vez de escrever laços `for` com variáveis temporárias e `if` aninhados, podemos encadear **adaptadores de iterador**:\n\n• **`.map(|x| ...)`**: recebe cada item por valor (`Self::Item`) e devolve o item transformado.\n• **`.filter(|x| ...)`**: recebe uma **referência** ao item (`&Self::Item`) e devolve `bool`. Só os itens para os quais a closure retorna `true` seguem adiante.\n\nPor que `filter` passa `&Self::Item`? Porque se o item for aprovado no teste, ele ainda precisa continuar inteiro pelo fluxo até o próximo passo!',
              visual: code(
                'let v = vec![2, 7, 4, 9];\nlet out: Vec<i32> = v\n    .into_iter()\n    .filter(|&x| x >= 5)\n    .map(|x| x * 10)\n    .collect();\n// out == [70, 90]',
                [4, 5, 6],
                'Pipeline filter + map',
              ),
            },
            {
              title: 'Rastreando os itens pela tubulação',
              body: 'Veja o que passa por cada etapa em `vec![2, 7, 4, 9].into_iter().filter(|&x| x >= 5).map(|x| x * 10)`.',
              visual: table(
                ['Entrada (`into_iter`)', 'Teste `x >= 5` (`filter`)', 'Saída de `map(|x| x * 10)`'],
                [
                  ['`2`', '`false` (descartado)', '—'],
                  ['`7`', '`true` (passa `7`)', '`70`'],
                  ['`4`', '`false` (descartado)', '—'],
                  ['`9`', '`true` (passa `9`)', '`90`'],
                ],
              ),
            },
          ],
          exercises: [
            mcq(
              'Qual deve ser o tipo de retorno da closure passada para `.filter(...)`?',
              ['bool', 'Option<T>', 'Self::Item', 'usize'],
              0,
              'O predicado de `filter` devolve `true` para manter o elemento no fluxo ou `false` para descartá-lo.',
            ),
            num(
              'Qual é o valor final de `s` neste código?',
              18,
              '`filter` mantém apenas os pares (`2` e `4`). Em seguida, `map` multiplica cada um por `3` (`6` e `12`), e `sum()` calcula `6 + 12 = 18`.',
              {
                visual: code(
                  'let v = vec![1, 2, 3, 4];\nlet s: i32 = v\n    .into_iter()\n    .filter(|&x| x % 2 == 0)\n    .map(|x| x * 3)\n    .sum();',
                  [4, 5, 6],
                  'Filtrando pares e triplicando',
                ),
              },
            ),
            mcq(
              'Quando iteramos com `v.into_iter()` sobre `Vec<i32>`, os itens são `i32`. Por que a closure de `filter` recebe `&i32` enquanto a de `map` recebe `i32`?',
              [
                'Porque filter só inspeciona o item para decidir se ele continua no fluxo, sem consumi-lo.',
                'Porque map altera o vetor original in-place e filter cria uma cópia.',
                'Porque filter exige que o tipo implemente Copy, enquanto map não.',
                'É apenas uma convenção opcional: filter e map têm exatamente a mesma assinatura.',
              ],
              0,
              'Se `filter` recebesse `Self::Item` por valor, tipos não-`Copy` (como `String`) seriam consumidos dentro do predicado e não poderiam ser entregues caso o retorno fosse `true`. Por isso `filter` passa `&Self::Item`.',
            ),
            fill(
              'Complete o encadeamento que mantém apenas números positivos e depois eleva cada um ao quadrado:',
              'let res: Vec<i32> = nums\n    .into_iter()\n    .___(|&x| x > 0)\n    .___(|x| x * x)\n    .collect();',
              ['filter', 'map'],
              ['fold', 'find', 'any'],
              '`filter` seleciona os elementos que satisfazem `x > 0` e `map` transforma cada elemento aprovado em `x * x`.',
            ),
            mcq(
              'Por que este código falha ao compilar?',
              [
                'O ponto e vírgula em { x + 1; } faz map produzir () em vez de i32, e () não pode ser somado em i32.',
                'O método sum() não pode ser chamado depois de map().',
                'A variável v precisava ser declarada como let mut v.',
                'O método into_iter() não existe para Vec<i32>.',
              ],
              0,
              'Com `{ x + 1; }`, a closure devolve `()`. O adaptador `map` passa a ser um iterador de `()`, que falha ao tentar somar num `i32` (`E0277: the trait bound i32: Sum<()> is not satisfied`).',
              {
                visual: code(
                  'let v = vec![1, 2, 3];\nlet s: i32 = v\n    .into_iter()\n    .map(|x| { x + 1; })\n    .sum();',
                  [4, 5],
                  'Erro no retorno do map',
                ),
              },
            ),
            gen((rng) => {
              const lim = randInt(rng, 2, 5);
              const mult = randInt(rng, 2, 4);
              // numbers in 1..=6 strictly greater than lim: (lim+1)..=6
              let sum = 0;
              for (let x = lim + 1; x <= 6; x++) sum += x * mult;
              return num(
                'Qual é o valor de `ans` após executar o pipeline?',
                sum,
                `Da faixa \`1..=6\`, passam pelo \`filter(|&x| x > ${lim})\` os números de \`${lim + 1}\` a \`6\`. Multiplicando cada um por \`${mult}\` e somando, obtemos \`${sum}\`.`,
                {
                  visual: code(
                    `let ans: i32 = (1..=6)\n    .filter(|&x| x > ${lim})\n    .map(|x| x * ${mult})\n    .sum();`,
                    [2, 3, 4],
                    'Faixa filtrada e mapeada',
                  ),
                },
              );
            }),
            codePuzzle(
              'Monte o pipeline que consome `temps`, mantém apenas as leituras estritamente maiores que `25`, subtrai `25` de cada uma e coleta num `Vec<i32>`.',
              [
                'let temps = vec![20, 28, 30];',
                'let excess: Vec<i32> = temps',
                '    .into_iter()',
                '    .filter(|&t| t > 25)',
                '    .map(|t| t - 25)',
                '    .collect();',
              ],
              [
                '    .map(|&t| t > 25)',
                '    .filter(|t| t - 25)',
              ],
              'Primeiro filtramos com `filter(|&t| t > 25)` (mantendo `28` e `30`), depois calculamos o excesso com `map(|t| t - 25)` e juntamos tudo com `collect()`.',
            ),
            num(
              'A ordem dos adaptadores importa! Qual é o valor de `s` quando `map` vem **antes** de `filter`?',
              26,
              'Primeiro `map` dobra `[2, 5, 8]` para `[4, 10, 16]`. Depois `filter(|&x| x > 8)` testa os valores já dobrados, mantendo `10` e `16`. A soma é `10 + 16 = 26`.',
              {
                visual: code(
                  'let v = vec![2, 5, 8];\nlet s: i32 = v\n    .into_iter()\n    .map(|x| x * 2)\n    .filter(|&x| x > 8)\n    .sum();',
                  [4, 5],
                  'map antes de filter',
                ),
              },
            ),
          ],
        },
        {
          card: [
            {
              title: 'Consumidores: fold, collect, sum, any, all, find e max_by_key',
              body: 'Um **consumidor** puxa itens do iterador até produzir um resultado final:\n\n• **`collect()`**: junta os itens numa coleção (`Vec<T>`, `String`, `HashSet`...). Como pode construir vários tipos, exige tipo anotado na variável ou *turbofish* `.collect::<Vec<_>>()`.\n• **`fold(init, |acc, x| ...)`**: reduz a sequência a um único valor atualizando o acumulador `acc` a cada item.\n• **`sum()`** e **`count()`**: somam todos os itens ou contam quantos existem.\n• **`any(p)`**, **`all(p)`** e **`find(p)`**: param assim que acham a resposta (curto-circuito!).\n• **`max_by_key(|x| chave)`**: devolve `Option<Self::Item>` com o elemento de maior chave.',
              visual: code(
                'let v = [3, 8, 2, 10];\nlet s = v.iter().fold(0, |a, &x| a + x);\nlet neg = v.iter().any(|&x| x < 0);\nlet big = v.iter().find(|&&x| x > 5);\n// s = 23, neg = false, big = Some(&8)',
                [2, 3, 4],
                'Principais consumidores',
              ),
            },
            {
              title: 'Acompanhando o acumulador no fold',
              body: 'Veja como `vec![2, 3, 4].into_iter().fold(10, |acc, x| acc + x)` evolui a cada elemento.',
              visual: trilha([
                'Início: acumulador acc começa com o valor inicial 10.',
                '1º item (x = 2): acc = 10 + 2 = 12.',
                '2º item (x = 3): acc = 12 + 3 = 15.',
                '3º item (x = 4): acc = 15 + 4 = 19 (resultado final!).',
              ]),
            },
            {
              title: 'No seu computador',
              body: 'Hora do **Exercício 37** do roteiro! Crie um projeto com `cargo new iter_empresa`.\n\n1. Defina `struct Employee { name: String, salary: f64 }` e monte um `Vec<Employee>` com 4 funcionários (alguns ganhando acima de `5000.0` e outros abaixo).\n2. **Sem usar nenhum `for`**, obtenha um `Vec<&str>` (ou `Vec<String>`) com os nomes de quem ganha acima de `5000.0` usando `.iter().filter(...).map(...).collect::<Vec<_>>()`.\n3. Calcule a folha salarial total com `.iter().map(|f| f.salary).sum::<f64>()`.\n\n**Critério de pronto:** `cargo run` imprime a lista de nomes filtrados e a soma dos salários, e `cargo clippy -- -D warnings` termina sem avisos.',
              visual: code(
                'struct Emp {\n    name: &\'static str,\n    salary: i32,\n}\nfn main() {\n    let team = [\n        Emp { name: "Ana", salary: 6200 },\n        Emp { name: "Bia", salary: 4100 },\n        Emp { name: "Leo", salary: 7500 },\n    ];\n    let top: Vec<&str> = team\n        .iter()\n        .filter(|e| e.salary > 5000)\n        .map(|e| e.name)\n        .collect();\n    let total: i32 = team\n        .iter()\n        .map(|e| e.salary)\n        .sum();\n    println!("{top:?} -> {total}");\n}',
                [11, 13, 14, 15, 18, 19],
                'Exercício 37 sem laço for',
              ),
            },
          ],
          exercises: [
            match(
              'Associe cada método consumidor ao que ele devolve:',
              [
                ['fold(init, f)', 'O valor final do acumulador após processar todos os itens'],
                ['collect()', 'Uma coleção construída com os itens (como Vec ou String)'],
                ['find(pred)', 'Option<Self::Item> com o primeiro item que satisfaz pred'],
                ['all(pred)', 'bool indicando se todos os itens satisfazem pred'],
              ],
              '`fold` reduz a um acumulador, `collect` monta uma coleção, `find` devolve o primeiro elemento aprovado em `Option` e `all` verifica se todos cumprem a condição.',
            ),
            num(
              'Qual é o valor de `r` ao final deste `fold`?',
              24,
              'O acumulador começa em `1`. Para `x = 1`, `acc = 1 * 2 = 2`; para `x = 2`, `acc = 2 * 3 = 6`; para `x = 3`, `acc = 6 * 4 = 24`.',
              {
                visual: code(
                  'let v = vec![1, 2, 3];\nlet r = v\n    .into_iter()\n    .fold(1, |acc, x| acc * (x + 1));',
                  [4],
                  'Acumulador multiplicativo com fold',
                ),
              },
            ),
            mcq(
              'Por que este código falha ao compilar com `E0283` (`type annotations needed`)?',
              [
                'Porque collect() é genérico sobre o tipo de coleção de saída e precisa de anotação em out ou turbofish ::<Vec<_>>().',
                'Porque map(|x| x * 2) exige anotar o tipo de x.',
                'Porque vec![1, 2, 3] não tem tipo conhecido.',
                'Porque println!("{:?}", out) não funciona com vetores.',
              ],
              0,
              '`collect()` pode construir um `Vec<i32>`, um `VecDeque<i32>`, um `HashSet<i32>`, etc. Sem `let out: Vec<i32>` ou `.collect::<Vec<_>>()`, o compilador não sabe qual coleção escolher e emite `error[E0283]: type annotations needed`.',
              {
                visual: code(
                  'let v = vec![1, 2, 3];\nlet out = v\n    .into_iter()\n    .map(|x| x * 2)\n    .collect();\nprintln!("{:?}", out);',
                  [2, 5],
                  'collect() sem tipo alvo',
                ),
              },
            ),
            tf(
              'Os consumidores `.any(...)`, `.all(...)` e `.find(...)` aplicam curto-circuito: eles param de chamar `next()` assim que o resultado já está decidido.',
              true,
              '`any` para no primeiro `true`, `all` para no primeiro `false` e `find` para no primeiro elemento que satisfaz o predicado, sem percorrer o restante da sequência.',
            ),
            num(
              'Qual número é impresso por este programa que usa `max_by_key`?',
              10,
              '`max_by_key(|s| s.len())` escolhe a palavra de maior comprimento (`"engenharia"`, que tem `10` bytes/caracteres ASCII). `best.len()` imprime `10`.',
              {
                visual: code(
                  'let w = ["sol", "engenharia", "mar"];\nlet best = w\n    .iter()\n    .max_by_key(|s| s.len())\n    .unwrap();\nprintln!("{}", best.len());',
                  [4, 6],
                  'Buscando o maior pela chave',
                ),
              },
            ),
            gen((rng) => {
              const init = randInt(rng, 5, 20);
              const a = randInt(rng, 1, 5);
              const b = randInt(rng, 2, 6);
              const c = randInt(rng, 3, 7);
              const ans = init + 2 * (a + b + c);
              return num(
                'Qual é o valor final de `total` calculado por `fold`?',
                ans,
                `O acumulador parte de \`${init}\` e soma o dobro de cada elemento: \`${init} + 2 * (${a} + ${b} + ${c}) = ${ans}\`.`,
                {
                  visual: code(
                    `let v = vec![${a}, ${b}, ${c}];\nlet total = v\n    .into_iter()\n    .fold(${init}, |a, x| a + x * 2);`,
                    [4],
                    'Rastreando fold',
                  ),
                },
              );
            }),
            codePuzzle(
              'Monte o pipeline que soma apenas os salários estritamente maiores que `5000` do array `salaries`.',
              [
                'let salaries = [4200, 6000, 7500];',
                'let payroll: i32 = salaries',
                '    .iter()',
                '    .copied()',
                '    .filter(|&s| s > 5000)',
                '    .sum();',
              ],
              [
                '    .find(|&s| s > 5000)',
                '    .collect();',
              ],
              '`filter(|&s| s > 5000)` seleciona `6000` e `7500`, e `.sum()` acumula o total em `payroll: i32`.',
            ),
            mcq(
              'Qual é o valor de `found` após executar este código?',
              ['Some(25)', 'Some(30)', '25', 'Some(15)'],
              0,
              '`find` percorre da esquerda para a direita e para no **primeiro** elemento que satisfaz `x > 20` (que é `25`), devolvendo `Some(25)` sem sequer testar `30` ou `15`.',
              {
                visual: code(
                  'let v = vec![10, 25, 30, 15];\nlet found = v\n    .into_iter()\n    .find(|&x| x > 20);',
                  [4],
                  'Busca com find()',
                ),
              },
            ),
          ],
        },
      ],
    },
    {
      id: 'rt-iter-lazy',
      title: 'Preguiça, encadeamento e desempenho',
      parts: [
        {
          card: [
            {
              title: 'Combinando fluxos: take, skip, rev, enumerate, zip e chain',
              body: 'O trait `Iterator` traz adaptadores poderosos para fatiar, numerar e combinar sequências sem usar índices manuais propensos a erro de *off-by-one*:\n\n• **`skip(n)`** e **`take(n)`**: pulam os primeiros `n` itens e pegam no máximo `n` itens.\n• **`rev()`**: inverte a ordem (disponível em iteradores de duas pontas, como os de fatias e faixas finitas de inteiros).\n• **`enumerate()`**: transforma cada `item` no par `(indice, item)` começando em `0`.\n• **`zip(outro)`**: caminha em dois iteradores ao mesmo tempo entregando pares `(a, b)`, parando assim que o menor acabar.\n• **`chain(outro)`**: emenda um segundo iterador logo após o término do primeiro.',
              visual: code(
                'let a = [10, 20, 30];\nlet b = [1, 2];\nlet dot: i32 = a\n    .iter()\n    .zip(b.iter())\n    .map(|(x, y)| x * y)\n    .sum();\n// dot = 10*1 + 20*2 = 50',
                [5, 6, 7],
                'Emparelhando com zip()',
              ),
            },
            {
              title: 'Resumo visual dos adaptadores de sequência',
              body: 'Veja o efeito de cada adaptador sobre a sequência base `[10, 20, 30, 40]`.',
              visual: table(
                ['Adaptador', 'Itens produzidos a partir de `[10, 20, 30, 40]`'],
                [
                  ['`.skip(1).take(2)`', '`20, 30` (pula `10` e pega 2 itens)'],
                  ['`.rev()`', '`40, 30, 20, 10` (ordem inversa)'],
                  ['`.enumerate()`', '`(0, 10), (1, 20), (2, 30), (3, 40)`'],
                  ['`.zip([1, 2])`', '`(10, 1), (20, 2)` (para no menor)'],
                ],
              ),
            },
          ],
          exercises: [
            match(
              'Associe cada adaptador ao seu comportamento:',
              [
                ['enumerate()', 'Produz tuplas (índice, elemento) começando em 0'],
                ['zip(outro)', 'Forma pares (a, b) de dois iteradores até um deles acabar'],
                ['chain(outro)', 'Percorre todos os itens do primeiro e depois todos os do segundo'],
                ['skip(n)', 'Descarta os primeiros n elementos e entrega o restante'],
              ],
              'Esses quatro adaptadores substituem a manipulação manual de múltiplos índices em laços `for`.',
            ),
            num(
              'Qual é o valor de `s` neste trecho?',
              90,
              '`skip(1)` descarta o primeiro elemento (`10`). Em seguida, `take(3)` pega os três próximos (`20, 30, 40`), cuja soma é `20 + 30 + 40 = 90`.',
              {
                visual: code(
                  'let v = vec![10, 20, 30, 40, 50];\nlet s: i32 = v\n    .into_iter()\n    .skip(1)\n    .take(3)\n    .sum();',
                  [4, 5],
                  'Fatiando com skip e take',
                ),
              },
            ),
            num(
              'Quantos pares o consumidor `.count()` conta ao emparelhar `a` (4 itens) e `b` (2 itens) com `zip`?',
              2,
              '`zip` avança os dois iteradores juntos e devolve `None` assim que qualquer um dos dois retorna `None`. Como `b` só tem 2 itens, são formados `2` pares.',
              {
                visual: code(
                  'let a = [1, 2, 3, 4];\nlet b = [10, 20];\nlet n = a.iter().zip(b.iter()).count();',
                  [3],
                  'zip para no menor iterador',
                ),
              },
            ),
            num(
              'Qual valor é calculado em `s` usando `enumerate()`?',
              40,
              '`enumerate()` entrega `(0, 5)`, `(1, 10)` e `(2, 15)`. Multiplicando índice por valor: `0*5 + 1*10 + 2*15 = 0 + 10 + 30 = 40`.',
              {
                visual: code(
                  'let v = vec![5, 10, 15];\nlet s: usize = v\n    .into_iter()\n    .enumerate()\n    .map(|(i, val)| i * val)\n    .sum();',
                  [4, 5],
                  'Índice e valor com enumerate()',
                ),
              },
            ),
            fill(
              'Complete o trecho que inverte a ordem dos valores escalares Unicode de `texto`:',
              'let inv: String = texto\n    .chars()\n    .___()\n    .___();',
              ['rev', 'collect'],
              ['skip', 'zip', 'sum'],
              '`chars()` percorre valores escalares Unicode, `rev()` inverte sua ordem e `collect()` monta uma `String` com UTF-8 válido. Isso não preserva necessariamente grafemas: acentos combinantes e emojis compostos podem ser separados.',
            ),
            gen((rng) => {
              const s = randInt(rng, 1, 3);
              const t = randInt(rng, 2, 4);
              // (1..=10).skip(s).take(t): starts at s + 1, takes t items
              let ans = 0;
              for (let k = 0; k < t; k++) ans += s + 1 + k;
              return num(
                'Qual é o resultado de `ans` para esta faixa?',
                ans,
                `Na faixa \`1..=10\`, \`skip(${s})\` pula de \`1\` até \`${s}\`. Depois \`take(${t})\` pega \`${t}\` números seguidos a partir de \`${s + 1}\`, cuja soma vale \`${ans}\`.`,
                {
                  visual: code(
                    `let ans: i32 = (1..=10)\n    .skip(${s})\n    .take(${t})\n    .sum();`,
                    [2, 3, 4],
                    'Previsão com skip e take',
                  ),
                },
              );
            }),
            codePuzzle(
              'Monte o cálculo do produto escalar entre `a` e `b` emparelhando os elementos com `zip`, multiplicando cada par e somando tudo.',
              [
                'let a = [2, 3, 4];\nlet b = [10, 20, 30];',
                'let dot: i32 = a.iter()',
                '    .zip(b.iter())',
                '    .map(|(x, y)| x * y)',
                '    .sum();',
              ],
              [
                '    .chain(b.iter())',
                '    .enumerate()',
              ],
              '`zip` forma os pares `(&a[i], &b[i])`, `map(|(x, y)| x * y)` calcula cada produto e `sum()` acumula o produto escalar.',
            ),
            num(
              'Qual número fica em `first` ao combinar `rev()` e `chain()`?',
              2,
              '`a.iter().rev()` produz `2` e depois `1`, seguidos por `3` e `4` de `b.iter()`. A primeira chamada a `.next()` entrega o primeiro item dessa cadeia, que é `2`.',
              {
                visual: code(
                  'let a = [1, 2];\nlet b = [3, 4];\nlet first = *a\n    .iter()\n    .rev()\n    .chain(b.iter())\n    .next()\n    .unwrap();',
                  [5, 6, 7],
                  'Combinando rev() e chain()',
                ),
              },
            ),
          ],
        },
        {
          card: [
            {
              title: 'Avaliação preguiçosa e custo zero',
              body: 'Os adaptadores `map`, `filter`, `take` e `zip` são **preguiçosos** (*lazy*): construí-los não chama as closures sobre os itens e **não cria vetores intermediários no heap**. Eles guardam o estado necessário para cada etapa; o código das próprias closures ainda pode fazer alocações quando executado.\n\nO trabalho sobre os itens só acontece quando o iterador é consumido. Com os tipos concretos conhecidos e otimizações habilitadas, o otimizador (LLVM) pode transformar a cadeia em código tão eficiente quanto um laço manual (**abstração de custo zero**) e eliminar checagens de limite (*bounds checks*). Isso não garante um único laço nem o mesmo desempenho em debug e release.',
              visual: code(
                'let mut calls = 0;\nlet s: i32 = (1..=1000)\n    .map(|x| {\n        calls += 1;\n        x * 10\n    })\n    .take(2)\n    .sum();\n// s == 30 e calls == 2 (não 1000!)',
                [3, 7, 8],
                'Avaliação sob demanda',
              ),
              tip: 'Se você escrever `v.iter().map(|x| println!("{x}"));` sem um consumidor no fim, nada é impresso e o compilador avisa `unused Map that must be used: iterators are lazy and do nothing unless consumed`.',
            },
            {
              title: 'Como o consumidor puxa apenas o necessário',
              body: 'Veja por que `(1..=1000).filter(|x| x % 2 == 0).map(|x| x * 10).take(2).sum::<i32>()` para no número `4` sem tocar no `5..=1000`.',
              visual: trilha([
                'sum() pede o 1º item a take(2), que pede a map, que pede a filter.',
                'filter testa 1 (falso) e 2 (verdadeiro) -> map calcula 20 -> sum acumula 20.',
                'sum() pede o 2º item a take(2): filter testa 3 (falso) e 4 (verdadeiro) -> map calcula 40 -> sum acumula 60.',
                'sum() pede o 3º item: take(2) já atingiu a cota e devolve None na hora!',
              ]),
            },
            {
              title: 'No seu computador',
              body: 'Crie um projeto com `cargo new iter_lazy` para comprovar a preguiça e o desempenho dos iteradores.\n\n1. Crie um contador `let mut avaliados = 0;` e encadeie `(1..=1_000_000).filter(...).map(...).take(5).collect::<Vec<_>>()`, incrementando `avaliados` dentro do `map`. Imprima o vetor e `avaliados` (que deve ser exatamente `5`).\n2. Use `zip` e `skip(1)` sobre uma fatia de leituras `sinais` para calcular a maior variação entre leituras consecutivas: `sinais.iter().zip(sinais.iter().skip(1)).map(|(a, b)| (b - a).abs()).max()`.\n3. Experimente apagar o consumidor `.collect()` de uma linha para ler o aviso `unused_must_use` do compilador e depois restaure.\n\n**Critério de pronto:** `cargo run` mostra apenas `5` chamadas ao `map` e a variação máxima correta, e `cargo clippy -- -D warnings` passa sem nenhum aviso.',
              visual: code(
                'fn main() {\n    let sig = [10_i32, 14, 13, 22, 19];\n    let max_diff = sig\n        .iter()\n        .zip(sig.iter().skip(1))\n        .map(|(a, b)| (b - a).abs())\n        .max()\n        .unwrap_or(0);\n    println!("max_diff = {max_diff}");\n}',
                [5, 6, 7],
                'Diferença entre vizinhos com zip + skip',
              ),
            },
          ],
          exercises: [
            tf(
              'Em Rust, encadear `.filter(...)` seguido de `.map(...)` cria um `Vec` temporário no heap entre o `filter` e o `map`.',
              false,
              '`filter` e `map` não criam vetores intermediários por si mesmos: os itens são processados sob demanda. As closures ainda podem fazer alocações se seu código pedir isso.',
            ),
            num(
              'Qual é o valor de `calls` ao final deste código?',
              3,
              'Por ser preguiçoso, `take(3)` só puxa 3 elementos de `map` e depois encerra a iteração. Mesmo a faixa tendo 100 números, a closure de `map` roda apenas `3` vezes.',
              {
                visual: code(
                  'let mut calls = 0;\nlet _s: i32 = (1..=100)\n    .map(|x| {\n        calls += 1;\n        x * 2\n    })\n    .take(3)\n    .sum();',
                  [3, 4, 7],
                  'Contando execuções de map',
                ),
              },
            ),
            num(
              'Quantas vezes a closure dentro de `filter` é executada até que `take(2)` encerre o pipeline?',
              4,
              'Para entregar 2 números pares a `take(2)`, `filter` precisa testar `1` (falso), `2` (1º par), `3` (falso) e `4` (2º par). Ao receber o 2º par, `take(2)` para e o `5` nunca é testado: total de `4` chamadas.',
              {
                visual: code(
                  'let mut tests = 0;\nlet _s: i32 = (1..=100)\n    .filter(|x| {\n        tests += 1;\n        x % 2 == 0\n    })\n    .take(2)\n    .sum();',
                  [3, 4, 7],
                  'Demanda puxada por take(2)',
                ),
              },
            ),
            mcq(
              'Para um `v: Vec<i32>` já criado e valores sem overflow, quantas alocações no heap são feitas pela cadeia `v.iter().filter(|&&x| x > 0).map(|&x| x * 2).sum::<i32>()`?',
              [
                'Zero (0 alocações no heap).',
                'Duas: uma no filter e outra no map.',
                'Três: uma no iter, uma no filter e uma no map.',
                'Uma alocação obrigatória dentro do sum.',
              ],
              0,
              '`Iter`, `Filter` e `Map` guardam apenas o estado da iteração, e `sum()` acumula em um `i32`. Essa cadeia não exige alocações no heap; o compilador decide onde manter o estado e o acumulador.',
            ),
            gen((rng) => {
              const k = randInt(rng, 2, 5);
              const m = randInt(rng, 2, 4);
              // first k positive even numbers: 2, 4, ..., 2k. Sum = k*(k+1). Multiplied by m: m*k*(k+1).
              const ans = m * k * (k + 1);
              return num(
                'Qual é o valor de `ans` produzido por esta cadeia preguiçosa?',
                ans,
                `O \`filter\` aprova os números pares \`2, 4, ...\`; \`take(${k})\` pega os \`${k}\` primeiros pares (cuja soma é \`${k * (k + 1)}\`), e \`map\` multiplica cada um por \`${m}\`, totalizando \`${ans}\`.`,
                {
                  visual: code(
                    `let ans: i32 = (1..=50)\n    .filter(|x| x % 2 == 0)\n    .take(${k})\n    .map(|x| x * ${m})\n    .sum();`,
                    [2, 3, 4, 5],
                    'Cadeia filter + take + map + sum',
                  ),
                },
              );
            }),
            codePuzzle(
              'Monte o pipeline preguiçoso que percorre `1..=1000`, pula os 2 primeiros números, filtra apenas múltiplos de `3`, pega os `4` primeiros aprovados e soma tudo em `ans: i32`.',
              [
                'let ans: i32 = (1..=1000)',
                '    .skip(2)',
                '    .filter(|x| x % 3 == 0)',
                '    .take(4)',
                '    .sum();',
              ],
              [
                '    .map(|x| x % 3 == 0)',
                '    .collect();',
              ],
              '`skip(2)` avança para o `3`, `filter(|x| x % 3 == 0)` mantém os múltiplos de 3, `take(4)` limita aos 4 primeiros (`3, 6, 9, 12`) e `sum()` calcula a soma.',
            ),
            mcq(
              'O que é impresso na tela quando este programa executa?',
              [
                'Nada, porque map é preguiçoso e nenhum consumidor puxou os elementos.',
                'Os números 1, 2 e 3 em linhas separadas.',
                'Apenas o número 1.',
                'O código não compila porque println! não pode ser usado em map.',
              ],
              0,
              'Sem um consumidor (como `for`, `collect()` ou `count()`), o iterador retornado por `map` é criado e imediatamente descartado sem chamar `next()` nenhuma vez. O compilador inclusive emite um aviso `unused Map that must be used`.',
              {
                visual: code(
                  'fn main() {\n    (1..=3).map(|x| {\n        println!("{x}");\n        x\n    });\n}',
                  [2, 3],
                  'Adaptador sem consumidor',
                ),
              },
            ),
            order(
              'Supondo que exista um item aprovado por `p`, ordene o caminho de uma chamada a `.next()` em `v.iter().filter(p).map(f).next()`:',
              [
                'O chamador invoca next() no adaptador externo Map',
                'Map chama next() no adaptador interno Filter pedindo um item aprovado',
                'Filter puxa itens do iterador base até encontrar um que satisfaça o predicado p',
                'Map aplica a função f a esse item e devolve Some(f(item)) ao chamador',
              ],
              'Nos iteradores preguiçosos, a demanda caminha de fora para dentro (do consumidor para a fonte) e o dado aprovado retorna de dentro para fora.',
            ),
          ],
        },
      ],
    },
  ],
};

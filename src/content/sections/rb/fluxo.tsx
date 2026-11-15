import React from 'react';
import type { UnitDef, VisualSpec } from '../../types';
import { code, fill, gen, match, mcq, num, rmcq, table, tf } from '../../helpers';
import { codePuzzle } from '../../codePractice';
import { TableView } from '../../../components/visuals/Misc';
import { randInt } from '../../../lib/random';

const passoAPasso = (
  head: string[],
  etapas: { rows: (string | number)[][]; info: string; label?: string }[],
): VisualSpec => ({
  name: 'stepper',
  props: {
    steps: etapas.length,
    labels: etapas.map((e, i) => e.label ?? `Passo ${i + 1}/${etapas.length}`),
    render: (k: number, width: number) => (
      <TableView head={head} rows={etapas[k].rows} width={width} />
    ),
    info: (k: number) => etapas[k].info,
  },
});

export const rustFluxo: UnitDef = {
  id: 'rb-fluxo',
  title: 'Controle de fluxo',
  icon: '🔀',
  subtitle: 'if como expressão, laços loop/while/for, ranges e match exaustivo',
  source: 'The Rust Programming Language (edição 2024), cap. 3.5 e 6.2 · Desafio 50 Dias — Rust #2 e #3',
  extra: true,
  guide:
    'Em Rust, condições de `if` e `while` precisam ter tipo `bool` (inteiros não são convertidos automaticamente: erro `E0308`).\n\n' +
    '• **Tudo é expressão:** `let y = if cond { a } else { b };` e `let s = match x { ... };` devolvem valor. Os dois ramos precisam ter o **mesmo tipo** e a expressão final de cada bloco vai **sem ponto e vírgula**.\n' +
    '• **Laços:** `loop` repete até `break` e pode devolver um valor com `break expr;`. Rótulos como `\'outer: loop` permitem que `break \'outer` ou `continue \'outer` atuem no laço externo.\n' +
    '• **Intervalos no `for`:** `a..b` vai de `a` até `b - 1` (fim exclusivo); `a..=b` inclui `b` (fim inclusivo). Use `.rev()` para inverter a ordem e `.step_by(k)` para avançar de `k` em `k`.\n' +
    '• **`match` exaustivo:** compara um valor com padrões (`0`, `1 | 2`, `0..=4`, `_`), não cai de um braço para o próximo e obriga a cobrir todos os casos possíveis (`E0004`).',
  lessons: [
    {
      id: 'rb-fluxo-if',
      title: 'if como expressão',
      parts: [
        {
          card: [
            {
              title: 'A condição precisa ser bool',
              body:
                'Em Rust, a condição de um `if` não leva parênteses em volta, mas as chaves `{ }` do bloco são obrigatórias.\n\n' +
                'Diferente de C — onde `0` é falso e qualquer outro número é verdadeiro —, o compilador do Rust exige que a condição seja estritamente do tipo `bool`. Escrever `if n` com um inteiro gera o erro `E0308` (`mismatched types: expected bool, found integer`).',
              visual: code(
                `fn main() {
    let temp = 28;
    if temp > 25 {
        println!("quente");
    } else {
        println!("ameno");
    }
}`,
                [3],
                'src/main.rs',
              ),
              tip: 'Para testar se um inteiro `n` é diferente de zero em Rust, escreva explicitamente `if n != 0 { ... }`.',
            },
            {
              title: 'Avaliação passo a passo',
              body:
                'Em uma cadeia `if` / `else if` / `else`, os testes são avaliados de cima para baixo e **apenas o primeiro bloco verdadeiro** executa. Os operadores `&&` (E) e `||` (OU) têm curto-circuito, como em C.',
              visual: passoAPasso(
                ['Etapa', 'Teste', 'Resultado'],
                [
                  {
                    label: 'Entrada',
                    rows: [['n = 12', '—', 'início']],
                    info: 'A variável `n` começa com o valor `12`.',
                  },
                  {
                    label: '1º teste',
                    rows: [['n % 5 == 0', '12 % 5 == 2', 'false']],
                    info: '`12` dividido por `5` deixa resto `2`, então o primeiro `if` dá `false`.',
                  },
                  {
                    label: '2º teste',
                    rows: [['n % 3 == 0', '12 % 3 == 0', 'true']],
                    info: '`12` é divisível por `3`. O ramo `else if n % 3 == 0` executa e os demais são ignorados.',
                  },
                ],
              ),
            },
          ],
          exercises: [
            mcq(
              'O que o programa abaixo imprime na saída?',
              ['alto', 'baixo', '12', 'nada'],
              0,
              'Como `v` vale `12`, a comparação `12 >= 10` avalia para `true` e o primeiro bloco imprime `"alto"`.',
              {
                visual: code(
                  `fn main() {
    let v = 12;
    if v >= 10 {
        println!("alto");
    } else {
        println!("baixo");
    }
}`,
                  [3, 4],
                ),
              },
            ),
            tf(
              'Em Rust, o trecho `let n = 1; if n { println!("ok"); }` compila e imprime `ok` porque `1` equivale a verdadeiro.',
              false,
              'Ao contrário de C, Rust não converte inteiros em `bool`. O compilador recusa o código com `error[E0308]: mismatched types` (`expected bool, found integer`). É preciso escrever `if n != 0`.',
            ),
            mcq(
              'Ao tentar compilar o código abaixo, qual erro o `rustc` aponta na linha destacada?',
              [
                'E0308: esperado `bool`, encontrado inteiro',
                'E0384: variável `errors` não é mutável',
                'E0004: faltam parênteses na condição',
                'Compila sem erro e imprime "alerta"',
              ],
              0,
              'A variável `errors` é um inteiro (`i32`), não um `bool`. O `rustc` emite `error[E0308]: mismatched types — expected bool, found integer`. Para corrigir, use `if errors != 0`.',
              {
                visual: code(
                  `fn main() {
    let errors = 3;
    if errors {
        println!("alerta");
    }
}`,
                  [3],
                  'Não compila',
                ),
              },
            ),
            fill(
              'Complete a condição para executar o bloco quando `count` for diferente de zero:',
              'if count ___ 0 {',
              ['!='],
              ['==', '=', '&&'],
              'O operador `!=` compara desigualdade e produz um `bool` (`true` quando `count` não é zero).',
            ),
            num(
              'Qual é o valor impresso por este programa?',
              20,
              'Para `n = 6`, `n > 10` é `false`, mas `n % 2 == 0` é `true` (`6` é par). O segundo ramo atribui `20` e encerra a cadeia, sem testar o `else`.',
              {
                visual: code(
                  `fn main() {
    let n = 6;
    let mut out = 0;
    if n > 10 {
        out = 10;
    } else if n % 2 == 0 {
        out = 20;
    } else {
        out = 30;
    }
    println!("{out}");
}`,
                  [6, 7],
                ),
              },
            ),
            gen((rng) => {
              const temp = randInt(rng, 15, 35);
              const limit = 25;
              const ans = temp > limit ? temp * 2 : temp + 5;
              return num(
                'Qual número o programa imprime na saída?',
                ans,
                `Aqui \`temp\` vale \`${temp}\`. A condição \`${temp} > ${limit}\` é \`${temp > limit}\`, portanto \`fan\` recebe \`${temp > limit ? `${temp} * 2 = ${ans}` : `${temp} + 5 = ${ans}`}\`.`,
                {
                  visual: code(
                    `fn main() {
    let temp = ${temp};
    let mut fan = 0;
    if temp > ${limit} {
        fan = temp * 2;
    } else {
        fan = temp + 5;
    }
    println!("{fan}");
}`,
                  ),
                },
              );
            }),
            codePuzzle(
              'Monte a estrutura condicional que imprime `"critico"` quando `temp >= 80` e `"normal"` caso contrário.',
              [
                'let temp = 85;',
                'if temp >= 80 {',
                '    println!("critico");',
                '} else {',
                '    println!("normal");',
                '}',
              ],
              ['if temp {', '    println!("normal")'],
              'A condição precisa ser uma comparação booleana (`temp >= 80`), e cada `println!` dentro dos blocos termina com `;`.',
            ),
            mcq(
              'Por que este programa imprime `"multiplo de 2"` em vez de `"multiplo de 4"` para `n = 8`?',
              [
                'Porque `8 % 2 == 0` vem primeiro e dá `true`, pulando os ramos `else if` seguintes',
                'Porque `8 % 4 == 0` avalia para `false` em Rust',
                'Porque `else if` só funciona com números ímpares',
                'Porque faltou um `break` dentro do primeiro bloco',
              ],
              0,
              'Numa cadeia `if / else if`, apenas o primeiro ramo cuja condição é `true` executa. Como todo múltiplo de 4 também é múltiplo de 2, o teste mais específico (`n % 4 == 0`) deveria vir antes de `n % 2 == 0`.',
              {
                visual: code(
                  `fn main() {
    let n = 8;
    if n % 2 == 0 {
        println!("multiplo de 2");
    } else if n % 4 == 0 {
        println!("multiplo de 4");
    }
}`,
                  [3, 5],
                ),
              },
            ),
          ],
        },
        {
          card: [
            {
              title: 'if no lado direito de um let',
              body:
                'Em Rust, blocos e `if` são **expressões**: eles produzem um valor. Assim, podemos inicializar uma variável imutável direto com `let kind = if ... { ... } else { ... };` (Desafio 50 Dias #3).\n\n' +
                'Repare em duas regras fundamentais:\n' +
                '• A última expressão de cada bloco vai **sem `;`** (para devolver o valor), mas a declaração `let ... = ...;` termina com `;` depois do `}`.\n' +
                '• Os dois ramos precisam devolver **exatamente o mesmo tipo**, pois toda variável em Rust tem um único tipo definido na compilação.',
              visual: code(
                `fn main() {
    let n = 7;
    let kind = if n % 2 == 0 {
        "par"
    } else {
        "ímpar"
    };
    println!("{kind}");
}`,
                [3, 4, 6, 7],
                'if como expressão',
              ),
            },
            {
              title: 'Regras de tipo no if como expressão',
              body: 'Veja o que o compilador faz em cada caso quando usamos `if` para produzir um valor:',
              visual: table(
                ['Construção', 'Tipo / Erro'],
                [
                  ['`if c { 10 } else { 20 }`', 'Compila: tipo `i32`'],
                  ['`if c { 10; } else { 20 }`', 'Erro `E0308`: `()` vs `i32`'],
                  ['`if c { 10 } else { "dez" }`', 'Erro `E0308`: `i32` vs `&str`'],
                  ['`let x = if c { 10 };`', 'Erro `E0317`: falta `else`'],
                ],
                [0],
              ),
            },
            {
              title: 'No seu computador 💻',
              body:
                'Crie um projeto com `cargo new paridade`, entre na pasta e edite `src/main.rs`:\n\n' +
                '• Crie uma variável `n` e use `let tipo = if n % 2 == 0 { "par" } else { "ímpar" };` para classificar o número sem usar `mut`.\n' +
                '• Calcule também o valor absoluto de um `x: i32` com `let abs = if x < 0 { -x } else { x };`.\n' +
                '• **Critério de pronto:** `cargo run` imprime o número, seu módulo e se é par ou ímpar, e `cargo clippy -- -D warnings` termina sem nenhum aviso.',
              visual: code(
                `fn main() {
    let x = -14;
    let abs = if x < 0 {
        -x
    } else {
        x
    };
    let tipo = if x % 2 == 0 {
        "par"
    } else {
        "ímpar"
    };
    println!("{x} -> |{abs}| ({tipo})");
}`,
                [3, 8],
                'Desafio no Cargo',
              ),
            },
          ],
          exercises: [
            num(
              'Qual valor é atribuído a `fee` e impresso na tela?',
              12,
              'Como `weight` é `8`, o teste `8 > 10` dá `false`. A expressão `if` avalia o bloco `else`, devolvendo `12`.',
              {
                visual: code(
                  `fn main() {
    let weight = 8;
    let fee = if weight > 10 {
        25
    } else {
        12
    };
    println!("{fee}");
}`,
                  [3, 6],
                ),
              },
            ),
            mcq(
              'O que acontece ao compilar o código abaixo?',
              [
                'Falha com E0308: os ramos `if` e `else` têm tipos incompatíveis (`i32` e `&str`)',
                'Compila e `val` recebe `"zero"`',
                'Compila e `val` vira um tipo dinâmico',
                'Falha com E0384: falta `mut` em `val`',
              ],
              0,
              'O ramo `if` devolve um inteiro (`5`) e o ramo `else` devolve um texto (`"zero"`). O compilador rejeita com `error[E0308]: if and else have incompatible types` (`expected integer, found &str`).',
              {
                visual: code(
                  `fn main() {
    let ok = false;
    let val = if ok {
        5
    } else {
        "zero"
    };
    println!("{val}");
}`,
                  [3, 4, 6],
                  'Tipos incompatíveis',
                ),
              },
            ),
            mcq(
              'Qual é o defeito na linha destacada deste programa?',
              [
                'O `;` depois de `10` transforma o primeiro bloco em `()`, causando erro E0308',
                'Falta um `;` depois de `20` na linha 6',
                'Falta a palavra `return` antes de `10` e `20`',
                'Não é permitido anotar o tipo `: i32` em um `let` com `if`',
              ],
              0,
              'Colocar `;` após `10` descarta o número e faz o primeiro bloco valer `()` (tipo unit), enquanto o `else` vale `20` (`i32`). O `rustc` acusa `error[E0308]: mismatched types — expected i32, found ()`.',
              {
                visual: code(
                  `fn main() {
    let x = 4;
    let y: i32 = if x > 0 {
        10;
    } else {
        20
    };
    println!("{y}");
}`,
                  [4],
                  'Ponto e vírgula a mais',
                ),
              },
            ),
            mcq(
              'Por que a atribuição abaixo não compila?',
              [
                'Erro E0317: um `if` usado para produzir um valor precisa ter um ramo `else`',
                'Erro E0384: `bonus` precisaria ser `let mut bonus`',
                'Erro E0004: `sales` precisa ser do tipo `bool`',
                'Porque `50` deveria terminar com ponto e vírgula',
              ],
              0,
              'Se `sales > 100` fosse `false`, `bonus` ficaria sem valor. Por isso o compilador exige um bloco `else` do mesmo tipo e emite `error[E0317]: if may be missing an else clause`.',
              {
                visual: code(
                  `fn main() {
    let sales = 120;
    let bonus = if sales > 100 { 50 };
    println!("{bonus}");
}`,
                  [3],
                  'Falta o else',
                ),
              },
            ),
            match(
              'Associe cada trecho ao resultado da compilação em Rust:',
              [
                ['`let y = if x > 0 { 1 } else { -1 };`', 'Compila: `y` é `i32`'],
                ['`if x { println!("oi"); }` (com `x: i32`)', 'Erro `E0308`: condição não é `bool`'],
                ['`let y = if x > 0 { 1 } else { "um" };`', 'Erro `E0308`: ramos de tipos distintos'],
                ['`let y = if x > 0 { 1 };`', 'Erro `E0317`: `if` sem `else` em valor'],
              ],
              'Em Rust, a condição é sempre `bool`, e um `if` que produz valor exige `else` com o mesmo tipo nos dois ramos.',
            ),
            gen((rng) => {
              const a = randInt(rng, 2, 9);
              const b = randInt(rng, 2, 9);
              const same = a === b ? b + 1 : b;
              const ans = a > same ? a * 3 : same + 10;
              return num(
                'Qual é o valor de `res` ao final da execução?',
                ans,
                `Temos \`a = ${a}\` e \`b = ${same}\`. Como \`a > b\` é \`${a > same}\`, a expressão \`if\` devolve \`${a > same ? `${a} * 3 = ${ans}` : `${same} + 10 = ${ans}`}\`.`,
                {
                  visual: code(
                    `fn main() {
    let a = ${a};
    let b = ${same};
    let res = if a > b {
        a * 3
    } else {
        b + 10
    };
    println!("{res}");
}`,
                  ),
                },
              );
            }),
            codePuzzle(
              'Monte a atribuição que usa `if` como expressão para definir `rate` (10 se `vip` for `true`, 25 caso contrário) e imprimir seu valor.',
              [
                'let vip = true;',
                'let rate = if vip {',
                '    10',
                '} else {',
                '    25',
                '};',
                'println!("{rate}");',
              ],
              ['    10;', '}'],
              'Os valores `10` e `25` não levam `;` dentro dos blocos, mas o `let rate = ...;` precisa do `;` fechando a declaração na linha `};`.',
            ),
            num(
              'Como `if` é uma expressão, ele pode entrar no meio de uma soma. Qual valor é impresso?',
              35,
              'A base é `20`. Como `urgent` é `true`, a expressão `if urgent { 15 } else { 5 }` vale `15`. Somando `20 + 15`, obtemos `35`.',
              {
                visual: code(
                  `fn main() {
    let base = 20;
    let urgent = true;
    let total = base + if urgent {
        15
    } else {
        5
    };
    println!("{total}");
}`,
                  [4, 5, 7],
                ),
              },
            ),
          ],
        },
      ],
    },
    {
      id: 'rb-fluxo-loop',
      title: 'loop, while e break com valor',
      parts: [
        {
          card: [
            {
              title: 'loop e break com valor',
              body:
                'Rust tem um laço dedicado para repetir até que você mande parar: `loop { ... }`. Diferente de `while true`, o compilador sabe com certeza que o corpo do `loop` começa a executar.\n\n' +
                'Por isso, o `loop` também é uma expressão que pode devolver um resultado: basta colocar o valor depois do `break`, como `break n + 1;`. Já o laço `while cond { ... }` testa uma condição `bool` antes de cada passagem e **não** pode devolver valor pelo `break` (erro `E0571`).',
              visual: code(
                `fn main() {
    let mut n = 1;
    let res = loop {
        n *= 2;
        if n >= 10 {
            break n + 1;
        }
    };
    println!("{res}");
}`,
                [3, 6],
                'loop devolvendo valor',
              ),
              tip: 'Toda variável alterada dentro de um laço (`n *= 2`, `i += 1`) precisa ser declarada com `let mut`. Sem `mut`, o compilador aponta o erro `E0384`.',
            },
            {
              title: 'Rastreando o loop passo a passo',
              body: 'Acompanhe os valores de `n` em cada iteração até o `break n + 1;` encerrar o `loop` e inicializar `res`:',
              visual: passoAPasso(
                ['Iteração', 'n após n *= 2', 'n >= 10?'],
                [
                  {
                    label: '1ª passagem',
                    rows: [['1', '2', 'false']],
                    info: '`n` dobra de `1` para `2`. Como `2 >= 10` é `false`, o `loop` continua.',
                  },
                  {
                    label: '2ª passagem',
                    rows: [['2', '4', 'false']],
                    info: '`n` dobra para `4`. Ainda menor que `10`.',
                  },
                  {
                    label: '3ª passagem',
                    rows: [['3', '8', 'false']],
                    info: '`n` dobra para `8`. Ainda menor que `10`.',
                  },
                  {
                    label: '4ª passagem',
                    rows: [['4', '16', 'true -> break 17']],
                    info: '`n` chega a `16`. O `if` entra e executa `break n + 1;`, entregando `17` para `res`.',
                  },
                ],
              ),
            },
          ],
          exercises: [
            num(
              'Qual número é atribuído a `ans` pelo `loop` abaixo?',
              30,
              'O contador `c` sobe de `0` até `3`. Quando `c == 3`, o `break c * 10;` encerra o laço e devolve `3 * 10 = 30` para `ans`.',
              {
                visual: code(
                  `fn main() {
    let mut c = 0;
    let ans = loop {
        c += 1;
        if c == 3 {
            break c * 10;
        }
    };
    println!("{ans}");
}`,
                  [3, 6],
                ),
              },
            ),
            tf(
              'Em um laço `while`, se a condição já for `false` na primeira verificação, o corpo do laço executa zero vezes.',
              true,
              'O `while` testa a condição antes de cada passagem. Se ela começar `false`, o corpo nunca é executado.',
            ),
            mcq(
              'Por que este programa não compila?',
              [
                'Erro E0384: `i` foi declarada sem `mut` e não pode ser alterada em `i += 1`',
                'Erro E0308: `i < 4` não produz um `bool`',
                'Erro E0571: `while` exige um `break` explícito',
                'Porque Rust não possui o operador `+=`',
              ],
              0,
              'Em Rust variáveis são imutáveis por padrão. Alterar `i` com `i += 1` sem declarar `let mut i = 0;` gera `error[E0384]: cannot assign twice to immutable variable i`.',
              {
                visual: code(
                  `fn main() {
    let i = 0;
    while i < 4 {
        i += 1;
    }
}`,
                  [2, 4],
                  'Imutabilidade',
                ),
              },
            ),
            mcq(
              'Qual erro o compilador aponta na linha destacada?',
              [
                'E0571: `break` com valor não é permitido dentro de um laço `while`',
                'E0308: `30` não é do tipo `bool`',
                'E0384: `i` não pode ser comparada com `3`',
                'E0004: falta um ramo `else` depois do `if`',
              ],
              0,
              'Como a condição de um `while` pode começar `false`, o compilador não sabe o que o laço devolveria se nunca entrasse no corpo. Por isso `break 30;` num `while` gera `error[E0571]: break with value from a while loop`. Para devolver valor, use `loop`.',
              {
                visual: code(
                  `fn main() {
    let mut i = 0;
    while i < 5 {
        if i == 3 {
            break 30;
        }
        i += 1;
    }
}`,
                  [5],
                  'break em while',
                ),
              },
            ),
            num(
              'Quantas vezes o corpo do `while` executa até o laço terminar?',
              3,
              'A variável `n` começa em `16`: 1ª passagem `16 -> 8` (`steps = 1`); 2ª passagem `8 -> 4` (`steps = 2`); 3ª passagem `4 -> 2` (`steps = 3`). Agora `2 > 2` é `false` e o laço para.',
              {
                visual: code(
                  `fn main() {
    let mut n = 16;
    let mut steps = 0;
    while n > 2 {
        n /= 2;
        steps += 1;
    }
    println!("{steps}");
}`,
                  [4, 5, 6],
                ),
              },
            ),
            gen((rng) => {
              const step = randInt(rng, 2, 5);
              const k = randInt(rng, 3, 5);
              const target = step * k;
              const ans = target + 10;
              return num(
                'Qual é o valor de `out` impresso ao final do programa?',
                ans,
                `Em cada volta \`acc\` aumenta de \`${step}\`. Após \`${k}\` voltas, \`acc\` atinge \`${target}\`, entra no \`if\` e executa \`break acc + 10;\`, devolvendo \`${target} + 10 = ${ans}\`.`,
                {
                  visual: code(
                    `fn main() {
    let mut acc = 0;
    let out = loop {
        acc += ${step};
        if acc >= ${target} {
            break acc + 10;
        }
    };
    println!("{out}");
}`,
                  ),
                },
              );
            }),
            codePuzzle(
              'Monte o trecho que acumula `n` em um `loop` e devolve `n * 2` para `res` assim que `n` chega a `5`.',
              [
                'let mut n = 0;',
                'let res = loop {',
                '    n += 1;',
                '    if n == 5 {',
                '        break n * 2;',
                '    }',
                '};',
              ],
              ['let n = 0;', '        break;'],
              'O contador `n` exige `let mut`, o `break n * 2;` entrega o valor do `loop` e a declaração `let res = loop { ... };` fecha com `;`.',
            ),
            num(
              'O comando `continue` pula o resto da iteração atual. Qual é o valor final de `sum`?',
              9,
              'A variável `i` assume `1, 2, 3, 4, 5`. Quando `i` é par (`2` e `4`), o `continue` pula `sum += i`. Assim, somam-se apenas os ímpares: `1 + 3 + 5 = 9`.',
              {
                visual: code(
                  `fn main() {
    let mut i = 0;
    let mut sum = 0;
    while i < 5 {
        i += 1;
        if i % 2 == 0 {
            continue;
        }
        sum += i;
    }
    println!("{sum}");
}`,
                  [6, 7, 9],
                ),
              },
            ),
          ],
        },
        {
          card: [
            {
              title: "Rótulos de laço: 'outer: loop",
              body:
                'Quando temos um laço dentro de outro, `break` e `continue` atuam por padrão no **laço mais interno**.\n\n' +
                'Em Rust, você pode dar um **rótulo** (loop label) a um laço começando com um apóstrofo: `\'outer: loop { ... }`. Aí, escrever `break \'outer;` ou `continue \'outer;` lá dentro encerra ou avança diretamente o laço externo — sem precisar de variáveis de controle extras como em C!',
              visual: code(
                `fn main() {
    let mut hits = 0;
    'outer: loop {
        let mut j = 0;
        loop {
            if j == 2 {
                break 'outer;
            }
            hits += 1;
            j += 1;
        }
    }
    println!("{hits}");
}`,
                [3, 7],
                'Rótulo de laço',
              ),
            },
            {
              title: 'Alcance de break e continue',
              body: 'Compare o efeito de cada desvio dentro de dois laços aninhados:',
              visual: table(
                ['Comando', 'Efeito nos laços aninhados'],
                [
                  ['`break;`', 'Sai apenas do laço interno'],
                  ['`continue;`', 'Próxima volta do laço interno'],
                  ["`break 'outer;`", "Encerra o laço externo `'outer`"],
                  ["`break 'outer v;`", "Encerra `'outer` devolvendo `v`"],
                ],
                [2, 3],
              ),
            },
            {
              title: 'No seu computador 💻',
              body:
                'Crie um projeto com `cargo new busca_grade` e use dois laços aninhados com um rótulo `\'busca: loop` para encontrar o primeiro par de inteiros positivos `(x, y)` (com `1 <= x <= 10` e `1 <= y <= 10`) tal que `x * y == 12` e `x + y == 7`:\n\n' +
                '• Quando achar o par, devolva `x * 10 + y` direto com `break \'busca x * 10 + y;`.\n' +
                '• **Critério de pronto:** `cargo run` encontra `x = 3, y = 4` (imprimindo `34`) e `cargo clippy -- -D warnings` passa sem avisos.',
              visual: code(
                `fn main() {
    let mut x = 1;
    let code = 'busca: loop {
        let mut y = 1;
        while y <= 10 {
            let p = x * y == 12;
            if p && x + y == 7 {
                break 'busca x * 10 + y;
            }
            y += 1;
        }
        x += 1;
    };
    println!("{code}");
}`,
                [3, 8],
                'Desafio no Cargo',
              ),
            },
          ],
          exercises: [
            mcq(
              'Qual é a sintaxe correta em Rust para rotular um laço `loop` com o nome `busca`?',
              ["'busca: loop {", 'busca: loop {', '@busca: loop {', 'label busca: loop {'],
              0,
              'Rótulos de laço em Rust sempre começam com um apóstrofo (`\'`) seguido do identificador e de dois-pontos antes da palavra-chave do laço: `\'busca: loop {`.',
            ),
            num(
              'Qual é o valor de `hits` impresso ao final deste programa?',
              2,
              'Na primeira volta do laço externo, `j` vale `0` (`hits = 1`), depois `1` (`hits = 2`). Quando `j` chega a `2`, `break \'outer;` encerra imediatamente os dois laços.',
              {
                visual: code(
                  `fn main() {
    let mut hits = 0;
    'outer: loop {
        let mut j = 0;
        loop {
            if j == 2 {
                break 'outer;
            }
            hits += 1;
            j += 1;
        }
    }
    println!("{hits}");
}`,
                  [3, 7],
                ),
              },
            ),
            num(
              'Agora o `break;` NÃO tem rótulo. Qual é o valor final de `hits`?',
              6,
              'Sem rótulo, `break;` sai apenas do laço interno (depois de somar `2` em `hits`). Como o laço externo roda `3` vezes (`i = 0, 1, 2`), `hits` acumula `3 * 2 = 6`.',
              {
                visual: code(
                  `fn main() {
    let mut i = 0;
    let mut hits = 0;
    while i < 3 {
        let mut j = 0;
        loop {
            if j == 2 {
                break;
            }
            hits += 1;
            j += 1;
        }
        i += 1;
    }
    println!("{hits}");
}`,
                  [8],
                ),
              },
            ),
            fill(
              'Complete o comando para encerrar o laço externo rotulado `\'scan` devolvendo o valor `found`:',
              'break ___ found;',
              ["'scan"],
              ['scan:', "'scan:", 'return'],
              'Na chamada do `break`, usamos o rótulo com apóstrofo (`\'scan`) sem dois-pontos, seguido do valor a devolver.',
            ),
            match(
              'Em dois laços aninhados (sendo o externo rotulado `\'ext`), associe cada comando à sua ação:',
              [
                ['`break;`', 'Sai somente do laço interno'],
                ['`continue;`', 'Vai para a próxima volta do laço interno'],
                ["`break 'ext;`", 'Encerra imediatamente o laço externo'],
                ["`continue 'ext;`", 'Pula para a próxima volta do laço externo'],
              ],
              'O rótulo após `break` ou `continue` indica exatamente qual laço envolvente deve receber o desvio.',
            ),
            gen((rng) => {
              const rows = randInt(rng, 2, 4);
              const stopCol = randInt(rng, 2, 4);
              const ans = rows * stopCol;
              return num(
                'Qual é o valor de `total` impresso ao final?',
                ans,
                `O \`break;\` sem rótulo encerra só o laço interno quando \`c == ${stopCol}\` (após incrementar \`total\` \`${stopCol}\` vezes por linha). Em \`${rows}\` linhas do laço externo, \`total\` chega a \`${rows} * ${stopCol} = ${ans}\`.`,
                {
                  visual: code(
                    `fn main() {
    let mut r = 0;
    let mut total = 0;
    while r < ${rows} {
        let mut c = 0;
        loop {
            if c == ${stopCol} {
                break;
            }
            total += 1;
            c += 1;
        }
        r += 1;
    }
    println!("{total}");
}`,
                  ),
                },
              );
            }),
            codePuzzle(
              'Monte os dois laços aninhados em que o laço interno usa `break \'top ans;` para encerrar o laço externo devolvendo `ans`.',
              [
                'let mut ans = 1;',
                "let val = 'top: loop {",
                '    loop {',
                '        ans += 4;',
                "        break 'top ans;",
                '    }',
                '};',
              ],
              ['let val = top: loop {', '        break top ans;'],
              'O rótulo na definição do laço leva apóstrofo e dois-pontos (`\'top: loop`), e no `break` leva apenas o apóstrofo (`break \'top ans;`).',
            ),
            num(
              'Um `break` rotulado também pode devolver valor! Que número é impresso por este programa?',
              21,
              'Na primeira volta externa (`i = 1`), `j` percorre `1, 2, 3` sem entrar no `if`. Na segunda volta (`i = 2`), logo em `j = 1` a condição `i == 2 && j == 1` é `true` e `break \'calc i * 10 + j;` encerra o laço externo devolvendo `2 * 10 + 1 = 21`.',
              {
                visual: code(
                  `fn main() {
    let mut i = 1;
    let res = 'calc: loop {
        let mut j = 1;
        while j <= 3 {
            if i == 2 && j == 1 {
                break 'calc i * 10 + j;
            }
            j += 1;
        }
        i += 1;
    };
    println!("{res}");
}`,
                  [3, 6, 7],
                ),
              },
            ),
          ],
        },
      ],
    },
    {
      id: 'rb-fluxo-for',
      title: 'for, ranges e iteração',
      parts: [
        {
          card: [
            {
              title: 'for com intervalos a..b e a..=b',
              body:
                'Em C escrevemos `for (int i = 0; i < n; i++)` e qualquer descuido entre `<` e `<=` lê memória fora do lugar. Em Rust, o `for` percorre diretamente um **intervalo (range)** ou uma coleção:\n\n' +
                '• `a..b` gera os inteiros de `a` até **`b - 1`** (limite superior **exclusivo**).\n' +
                '• `a..=b` gera os inteiros de `a` até **`b`** (limite superior **inclusivo**).\n\n' +
                'Veja no código o fatorial do **Desafio 50 Dias #2**, escrito com `u64` e `1..=n`:',
              visual: code(
                `fn main() {
    let n = 5u64;
    let mut fact = 1u64;
    for i in 1..=n {
        fact *= i;
    }
    println!("{fact}");
}`,
                [4, 5],
                'Fatorial com 1..=n',
              ),
              tip: 'A variável de iteração `i` no `for i in 1..=n` é criada e avançada pelo próprio laço — você não precisa declará-la antes nem escrever `i += 1`.',
            },
            {
              title: 'Passo a passo do fatorial em 1..=4',
              body: 'Acompanhe como `i` percorre `1, 2, 3, 4` (incluindo o `4` por causa do `..=`) e multiplica `fact`:',
              visual: passoAPasso(
                ['Passo', 'Valor de i', 'fact após fact *= i'],
                [
                  {
                    label: 'i = 1',
                    rows: [['1ª volta', '1', '1 * 1 = 1']],
                    info: '`i` começa em `1`. O acumulador `fact` vale `1`.',
                  },
                  {
                    label: 'i = 2',
                    rows: [['2ª volta', '2', '1 * 2 = 2']],
                    info: 'Na segunda passagem, `i = 2` e `fact` passa a `2`.',
                  },
                  {
                    label: 'i = 3',
                    rows: [['3ª volta', '3', '2 * 3 = 6']],
                    info: 'Na terceira passagem, `i = 3` e `fact` passa a `6`.',
                  },
                  {
                    label: 'i = 4',
                    rows: [['4ª volta', '4', '6 * 4 = 24']],
                    info: 'Como o intervalo é `1..=4`, o `4` entra! `fact` chega a `24` e o laço termina.',
                  },
                ],
              ),
            },
          ],
          exercises: [
            num(
              'Quantas vezes o corpo deste laço `for` é executado?',
              5,
              'O intervalo exclusivo `0..5` produz os valores `0, 1, 2, 3, 4`, totalizando `5` iterações.',
              {
                visual: code(
                  `fn main() {
    let mut count = 0;
    for _ in 0..5 {
        count += 1;
    }
    println!("{count}");
}`,
                  [3],
                ),
              },
            ),
            num(
              'Qual é o valor final de `sum` impresso pelo programa?',
              10,
              'O intervalo inclusivo `1..=4` inclui o `4`, somando `1 + 2 + 3 + 4 = 10`.',
              {
                visual: code(
                  `fn main() {
    let mut sum = 0;
    for i in 1..=4 {
        sum += i;
    }
    println!("{sum}");
}`,
                  [3, 4],
                ),
              },
            ),
            tf(
              'No laço `for x in 2..6`, o último valor assumido por `x` dentro do corpo é `6`.',
              false,
              'O operador `..` exclui o limite final: `2..6` produz `2, 3, 4, 5` (o último é `5`). Para incluir o `6`, usa-se `2..=6`.',
            ),
            num(
              'O que é impresso quando o início e o fim de `a..b` são iguais?',
              0,
              'Em `3..3`, não há nenhum inteiro `i` tal que `3 <= i < 3`. O intervalo é vazio e o corpo executa `0` vezes.',
              {
                visual: code(
                  `fn main() {
    let mut runs = 0;
    for _ in 3..3 {
        runs += 1;
    }
    println!("{runs}");
}`,
                  [3],
                ),
              },
            ),
            gen((rng) => {
              const a = randInt(rng, 1, 4);
              const b = randInt(rng, 7, 12);
              const count = b - a;
              return num(
                'Quantas iterações este laço `for` executa?',
                count,
                `No intervalo exclusivo \`${a}..${b}\`, a variável percorre de \`${a}\` até \`${b - 1}\`, o que dá \`${b} - ${a} = ${count}\` iterações.`,
                {
                  visual: code(
                    `fn main() {
    let mut n = 0;
    for _ in ${a}..${b} {
        n += 1;
    }
    println!("{n}");
}`,
                  ),
                },
              );
            }),
            gen((rng) => {
              const n = randInt(rng, 3, 7);
              const sum = (n * (n + 1)) / 2;
              return num(
                'Qual é o valor de `sum` impresso ao final?',
                sum,
                `O intervalo \`1..=${n}\` soma todos os inteiros de \`1\` até \`${n}\` inclusive: \`(${n} * ${n + 1}) / 2 = ${sum}\`.`,
                {
                  visual: code(
                    `fn main() {
    let mut sum = 0;
    for i in 1..=${n} {
        sum += i;
    }
    println!("{sum}");
}`,
                  ),
                },
              );
            }),
            codePuzzle(
              'Monte a função `fatorial(n: u64) -> u64` usando um intervalo inclusivo (Desafio 50 Dias #2).',
              [
                'fn fatorial(n: u64) -> u64 {',
                '    let mut fact = 1;',
                '    for i in 1..=n {',
                '        fact *= i;',
                '    }',
                '    fact',
                '}',
              ],
              ['    for i in 1..n {', '    let fact = 1;'],
              'Para multiplicar de `1` até `n` incluindo o próprio `n`, usamos `1..=n`, `let mut fact` e devolvemos `fact` sem `;` no final da função.',
            ),
            mcq(
              'No Desafio 50 Dias #2, ao calcular o fatorial com `u64` (`for i in 1..=n`) rodando `cargo run` (modo debug), o que acontece quando `n = 21`?',
              [
                'O programa aborta (panic) porque 21! ultrapassa o limite máximo de `u64` (overflow)',
                'O compilador recusa o código com erro E0308',
                'O tipo `u64` cresce automaticamente para `u128`',
                'O laço para sozinho em `i = 20` sem erro',
              ],
              0,
              'O maior valor de um `u64` é cerca de $1{,}84 \\times 10^{19}$, enquanto $21! \\approx 5{,}11 \\times 10^{19}$. Em modo debug (`cargo run`), o Rust verifica overflow de inteiros e aborta a execução com `panic`: `attempt to multiply with overflow`.',
            ),
          ],
        },
        {
          card: [
            {
              title: 'rev(), step_by() e arrays',
              body:
                'Os intervalos do Rust podem ser combinados com métodos que mudam a forma de percorrer:\n\n' +
                '• `(a..b).rev()` **inverte** a ordem (do fim para o começo).\n' +
                '• `(a..b).step_by(k)` avança de **`k` em `k`** a partir do primeiro elemento.\n' +
                '• E para percorrer um array como `let v = [10, 20, 30];`, basta fazer `for x in v` — sem índices manuais!',
              visual: code(
                `fn main() {
    for n in (1..=3).rev() {
        print!("{n} ");
    }
    let v = [10, 20, 30];
    for x in v {
        print!("{x} ");
    }
}`,
                [2, 6],
                'rev() e iteração direta',
              ),
            },
            {
              title: 'Comparando intervalos e adaptadores',
              body: 'Veja exatamente quais valores cada expressão entrega ao `for`:',
              visual: table(
                ['Expressão', 'Valores gerados', 'Total'],
                [
                  ['`1..5`', '`1, 2, 3, 4`', '4'],
                  ['`1..=5`', '`1, 2, 3, 4, 5`', '5'],
                  ['`(1..5).rev()`', '`4, 3, 2, 1`', '4'],
                  ['`(0..8).step_by(3)`', '`0, 3, 6`', '3'],
                ],
                [2, 3],
              ),
            },
            {
              title: 'No seu computador 💻',
              body:
                'Hora de fazer o **Exercício 2 do Desafio 50 Dias — Rust**:\n\n' +
                '• Rode `cargo new fatorial`, entre na pasta e escreva `fn fatorial(n: u64) -> u64` usando `for i in 1..=n`.\n' +
                '• No `main`, use um laço `for n in 1..=20` para imprimir `n! = ...` e, em seguida, faça uma contagem regressiva com `for k in (1..=5).rev()`.\n' +
                '• Teste trocar o limite para `21` e rode `cargo run` para ver o aborto por overflow ao calcular `21!`; depois volte para `20`.\n' +
                '• **Critério de pronto:** `cargo run` imprime até `20! = 2432902008176640000` e `cargo clippy -- -D warnings` termina sem avisos.',
              visual: code(
                `fn fatorial(n: u64) -> u64 {
    let mut acc = 1u64;
    for i in 1..=n {
        acc *= i;
    }
    acc
}

fn main() {
    for n in 1..=20 {
        let f = fatorial(n);
        println!("{n}! = {f}");
    }
}`,
                [3, 6, 11],
                'Desafio 50 Dias #2',
              ),
            },
          ],
          exercises: [
            mcq(
              'O que o código abaixo imprime na tela?',
              ['3->2->1->', '4->3->2->1->', '1->2->3->', '4->3->2->'],
              0,
              'O intervalo `1..4` contém `1, 2, 3` (o `4` é exclusivo). O método `.rev()` inverte essa sequência para `3, 2, 1`, imprimindo `3->2->1->`.',
              {
                visual: code(
                  `fn main() {
    for i in (1..4).rev() {
        print!("{i}->");
    }
}`,
                  [2, 3],
                ),
              },
            ),
            num(
              'Quantas vezes o corpo do laço executa com `.step_by(3)` neste intervalo?',
              4,
              'Começando em `0` e avançando de `3` em `3` enquanto menor que `10`, os valores gerados são `0, 3, 6, 9` — portanto, `4` iterações.',
              {
                visual: code(
                  `fn main() {
    let mut count = 0;
    for _ in (0..10).step_by(3) {
        count += 1;
    }
    println!("{count}");
}`,
                  [3],
                ),
              },
            ),
            num(
              'Qual é o último valor de `x` somado em `last` neste laço?',
              10,
              'O intervalo `2..=10` é inclusivo no `10`. Pulando de `4` em `4` a partir de `2`, o iterador produz `2`, `6` e `10`.',
              {
                visual: code(
                  `fn main() {
    let mut last = 0;
    for x in (2..=10).step_by(4) {
        last = x;
    }
    println!("{last}");
}`,
                  [3],
                ),
              },
            ),
            num(
              'Qual é o valor de `sum` após percorrer diretamente o array `data`?',
              16,
              'O laço `for x in data` visita `4, 7, 2, 5`. Apenas os maiores que `3` entram na soma: `4 + 7 + 5 = 16`.',
              {
                visual: code(
                  `fn main() {
    let data = [4, 7, 2, 5];
    let mut sum = 0;
    for x in data {
        if x > 3 {
            sum += x;
        }
    }
    println!("{sum}");
}`,
                  [4, 5],
                ),
              },
            ),
            match(
              'Associe cada iterador à sequência exata de números que ele produz:',
              [
                ['`0..3`', '`0, 1, 2`'],
                ['`0..=3`', '`0, 1, 2, 3`'],
                ['`(1..=3).rev()`', '`3, 2, 1`'],
                ['`(0..6).step_by(2)`', '`0, 2, 4`'],
              ],
              '`..` exclui o fim, `..=` inclui o fim, `.rev()` inverte a ordem e `.step_by(2)` avança de 2 em 2.',
            ),
            gen((rng) => {
              const step = randInt(rng, 2, 4);
              const k = randInt(rng, 3, 6);
              const limit = step * k - 1;
              return num(
                'Quantas vezes `count += 1` executa neste laço?',
                k,
                `O intervalo \`0..=${limit}\` tem os múltiplos de \`${step}\` desde \`0\` até \`${step * (k - 1)}\`, totalizando \`${k}\` passagens.`,
                {
                  visual: code(
                    `fn main() {
    let mut count = 0;
    let r = (0..=${limit}).step_by(${step});
    for _ in r {
        count += 1;
    }
    println!("{count}");
}`,
                  ),
                },
              );
            }),
            codePuzzle(
              'Monte a função que percorre todos os elementos do array `vals` e devolve a soma.',
              [
                'fn somar(vals: [i32; 3]) -> i32 {',
                '    let mut sum = 0;',
                '    for v in vals {',
                '        sum += v;',
                '    }',
                '    sum',
                '}',
              ],
              ['    for v in 0..vals {', '        sum = v;'],
              'Iteramos direto sobre o array com `for v in vals`, acumulamos em `sum` com `sum += v;` e devolvemos `sum` sem `;` no fim.',
            ),
            num(
              'Combinando `.rev()` e `.step_by(2)`: qual é o valor final de `sum`?',
              9,
              '`(1..=5).rev()` gera `5, 4, 3, 2, 1`. Aplicando `.step_by(2)`, pegamos o primeiro e avançamos de 2 em 2: `5, 3, 1`. A soma é `5 + 3 + 1 = 9`.',
              {
                visual: code(
                  `fn main() {
    let mut sum = 0;
    for x in (1..=5).rev().step_by(2) {
        sum += x;
    }
    println!("{sum}");
}`,
                  [3],
                ),
              },
            ),
          ],
        },
      ],
    },
    {
      id: 'rb-fluxo-match',
      title: 'match: primeiro contato',
      parts: [
        {
          card: [
            {
              title: 'match: seleção exaustiva',
              body:
                'O `match` do Rust lembra o `switch` de C, mas com superpoderes e segurança de compilação:\n\n' +
                '• Os braços (`padrao => expressao,`) são testados **de cima para baixo** e apenas o primeiro que casar executa — **não existe queda automática (fallthrough)** nem `break`.\n' +
                '• O compilador exige que o `match` seja **exaustivo**: todos os valores possíveis do tipo precisam estar cobertos (senão ocorre o erro `E0004`).\n' +
                '• O padrão curinga `_` significa **"qualquer outro valor"** e costuma fechar o `match`.',
              visual: code(
                `fn main() {
    let code = 2;
    let msg = match code {
        0 => "parar",
        1 => "iniciar",
        2 => "pausar",
        _ => "inválido",
    };
    println!("{msg}");
}`,
                [3, 6, 7],
                'match como expressão',
              ),
            },
            {
              title: 'switch de C vs. match de Rust',
              body: 'Veja por que o `match` elimina de uma vez os bugs clássicos do `switch` de C:',
              visual: table(
                ['Aspecto', 'switch (C)', 'match (Rust)'],
                [
                  ['Sem `break`', 'Cai no próximo `case`', 'Cada braço é isolado'],
                  ['Caso esquecido', 'Silencioso em vários casos', 'Erro `E0004` na compilação'],
                  ['Devolve valor', 'Não (é só instrução)', 'Sim (é expressão)'],
                  ['Caso padrão', '`default:`', '`_ =>` (ou variável)'],
                ],
                [0, 1],
              ),
            },
          ],
          exercises: [
            mcq(
              'O que o programa abaixo imprime?',
              ['pausar', 'iniciar', 'inválido', 'pausar inválido'],
              0,
              'O valor `2` casa com o braço `2 => "pausar"`. Em Rust não há fallthrough: apenas esse braço é avaliado e atribuído a `msg`.',
              {
                visual: code(
                  `fn main() {
    let code = 2;
    let msg = match code {
        0 => "parar",
        1 => "iniciar",
        2 => "pausar",
        _ => "inválido",
    };
    println!("{msg}");
}`,
                  [6],
                ),
              },
            ),
            tf(
              'Em Rust, se você não escrever `break` ao final de um braço do `match`, a execução continua no braço de baixo como no `switch` de C.',
              false,
              'No `match` de Rust nunca há queda para o próximo braço; cada braço executa apenas a sua expressão e encerra o `match`.',
            ),
            mcq(
              'Ao compilar o código abaixo, qual erro o `rustc` aponta?',
              [
                'E0004: padrões não exaustivos (`3_u8..=u8::MAX` não cobertos)',
                'E0308: `level` deveria ser do tipo `bool`',
                'E0384: falta `mut` na variável `msg`',
                'Compila sem erro e imprime "alto"',
              ],
              0,
              'Como `level` é `u8` (0 a 255), listar apenas `0`, `1` e `2` deixa `3..=255` sem tratamento. O compilador recusa com `error[E0004]: non-exhaustive patterns: 3_u8..=u8::MAX not covered`.',
              {
                visual: code(
                  `fn main() {
    let level: u8 = 2;
    let msg = match level {
        0 => "parado",
        1 => "baixo",
        2 => "alto",
    };
    println!("{msg}");
}`,
                  [3],
                  'Falta o curinga _',
                ),
              },
            ),
            fill(
              'Complete o último braço do `match` com o padrão curinga que aceita qualquer outro valor sem criar variável:',
              '___ => "desconhecido",',
              ['_'],
              ['default', '*', '...'],
              'O sublinhado `_` é o padrão curinga (wildcard) em Rust: casa com qualquer valor e ignora seu conteúdo.',
            ),
            mcq(
              'Por que este `match` não compila?',
              [
                'Erro E0308: os braços do `match` devolvem tipos incompatíveis (`i32` e `&str`)',
                'Erro E0004: o padrão `_` não pode ser usado com inteiros',
                'Erro E0571: falta `break` depois de `100`',
                'Porque `match` não pode ser usado dentro de `let`',
              ],
              0,
              'Assim como no `if`, todos os braços de um `match` usado como expressão precisam produzir o mesmo tipo. Misturar `100` (`i32`) e `"erro"` (`&str`) gera `error[E0308]: match arms have incompatible types`.',
              {
                visual: code(
                  `fn main() {
    let status = 1;
    let out = match status {
        1 => 100,
        _ => "erro",
    };
    println!("{out}");
}`,
                  [4, 5],
                  'Braços incompatíveis',
                ),
              },
            ),
            gen((rng) => {
              const a = randInt(rng, 4, 9);
              const b = randInt(rng, 2, 5);
              const op = randInt(rng, 1, 3);
              const ans = op === 1 ? a + b : op === 2 ? a * b : a - b;
              return num(
                'Qual é o valor de `res` impresso por este `match`?',
                ans,
                `Como \`op\` vale \`${op}\`, o \`match\` escolhe o braço \`${op === 1 ? `1 => a + b (${a} + ${b} = ${ans})` : op === 2 ? `2 => a * b (${a} * ${b} = ${ans})` : `_ => a - b (${a} - ${b} = ${ans})`}\`.`,
                {
                  visual: code(
                    `fn main() {
    let a = ${a};
    let b = ${b};
    let op = ${op};
    let res = match op {
        1 => a + b,
        2 => a * b,
        _ => a - b,
    };
    println!("{res}");
}`,
                  ),
                },
              );
            }),
            codePuzzle(
              'Monte a expressão `match` que converte `gear` em velocidade máxima, cobrindo qualquer outro valor com `0`.',
              [
                'let gear = 2;',
                'let max_v = match gear {',
                '    1 => 20,',
                '    2 => 45,',
                '    _ => 0,',
                '};',
              ],
              ['    default => 0,', '}'],
              'Em Rust usamos `_ => 0,` para o caso geral, e o `let max_v = match gear { ... };` fecha com `;`.',
            ),
            num(
              'Em vez de `_`, o último braço pode usar um nome (`other`) para usar o valor! O que é impresso?',
              15,
              'Como `n = 5` não casa com `0` nem com `1`, ele cai no braço `other => other * 3`, onde `other` recebe `5` e devolve `5 * 3 = 15`.',
              {
                visual: code(
                  `fn main() {
    let n = 5;
    let ans = match n {
        0 => 0,
        1 => 10,
        other => other * 3,
    };
    println!("{ans}");
}`,
                  [6],
                ),
              },
            ),
          ],
        },
        {
          card: [
            {
              title: 'Padrões com | e intervalos a..=b',
              body:
                'Um único braço do `match` pode aceitar vários valores sem repetir código:\n\n' +
                '• **Alternativas com `|`:** `1 | 2 | 3 => "baixo"` casa se o valor for `1`, `2` **ou** `3`.\n' +
                '• **Intervalos com `..=`:** `0..=4 => "reprovado"` casa com qualquer valor de `0` até `4`, inclusive.\n\n' +
                'Veja a função do **Desafio 50 Dias #3**! Repare também que a última expressão da função (`match grade { ... }`, sem `;` no fim) é automaticamente o valor de retorno:',
              visual: code(
                `fn status(grade: u8) -> &'static str {
    match grade {
        0..=4 => "reprovado",
        5..=6 => "recuperação",
        7..=10 => "aprovado",
        _ => "inválida",
    }
}`,
                [2, 3, 4, 5, 6],
                'Desafio 50 Dias #3',
              ),
            },
            {
              title: 'Avaliando notas no match',
              body: 'Siga como `status(grade)` testa os intervalos de cima para baixo para diferentes entradas:',
              visual: passoAPasso(
                ['Entrada', 'Padrão testado', 'Resultado'],
                [
                  {
                    label: 'grade = 6',
                    rows: [
                      ['6', '0..=4', 'não casa'],
                      ['6', '5..=6', 'casa! -> "recuperação"'],
                    ],
                    info: 'Para `grade = 6`, `0..=4` falha e `5..=6` casa imediatamente, retornando `"recuperação"`.',
                  },
                  {
                    label: 'grade = 9',
                    rows: [
                      ['9', '0..=4 e 5..=6', 'não casam'],
                      ['9', '7..=10', 'casa! -> "aprovado"'],
                    ],
                    info: 'Para `grade = 9`, o terceiro braço (`7..=10`) casa e retorna `"aprovado"`.',
                  },
                  {
                    label: 'grade = 12',
                    rows: [
                      ['12', '0..=4, 5..=6, 7..=10', 'não casam'],
                      ['12', '_', 'casa! -> "inválida"'],
                    ],
                    info: 'Qualquer `u8` acima de `10` (de `11` a `255`) cai no curinga `_`, mantendo o `match` exaustivo.',
                  },
                ],
              ),
            },
            {
              title: 'No seu computador 💻',
              body:
                'Hora de fazer o **Exercício 3 do Desafio 50 Dias — Rust**:\n\n' +
                '• Crie o projeto com `cargo new notas` e escreva a função `fn situacao(nota: u8) -> &\'static str` usando `match nota` com os braços `0..=4 => "reprovado"`, `5..=6 => "recuperação"`, `7..=10 => "aprovado"` e `_ => "inválida"`.\n' +
                '• Deixe o `match` como última expressão da função, **sem `;`** depois da chave `}`.\n' +
                '• No `main`, percorra `for n in 0..=11` imprimindo a nota e sua situação.\n' +
                '• **Critério de pronto:** `cargo run` classifica todas as notas corretamente e `cargo clippy -- -D warnings` não emite nenhum aviso.',
              visual: code(
                `fn situacao(nota: u8) -> &'static str {
    match nota {
        0..=4 => "reprovado",
        5..=6 => "recuperação",
        7..=10 => "aprovado",
        _ => "inválida",
    }
}

fn main() {
    for n in [3, 6, 8, 11] {
        let s = situacao(n);
        println!("{n}: {s}");
    }
}`,
                [2, 7, 12],
                'Desafio 50 Dias #3',
              ),
            },
          ],
          exercises: [
            mcq(
              'Na função `status(grade: u8)` abaixo, qual texto é devolvido pela chamada `status(6)`?',
              ['recuperação', 'reprovado', 'aprovado', 'inválida'],
              0,
              'O número `6` pertence ao intervalo inclusivo `5..=6`, portanto o segundo braço devolve `"recuperação"`.',
              {
                visual: code(
                  `fn status(grade: u8) -> &'static str {
    match grade {
        0..=4 => "reprovado",
        5..=6 => "recuperação",
        7..=10 => "aprovado",
        _ => "inválida",
    }
}`,
                  [4],
                ),
              },
            ),
            num(
              'Qual valor é impresso para `day = 7`?',
              20,
              'O padrão `1 | 7` casa quando `day` é `1` **ou** `7`. Como `day = 7`, o primeiro braço devolve `20`.',
              {
                visual: code(
                  `fn main() {
    let day = 7;
    let fee = match day {
        1 | 7 => 20,
        2..=6 => 10,
        _ => 0,
    };
    println!("{fee}");
}`,
                  [4],
                ),
              },
            ),
            mcq(
              'Dentro do padrão de um braço de `match`, qual símbolo une vários valores alternativos (como "2, 3 ou 5")?',
              ['|', '||', '..', '&&'],
              0,
              'Em padrões de `match`, usa-se uma barra vertical simples `|` (`2 | 3 | 5 => ...`). Já `||` é o operador lógico booleano usado em expressões.',
            ),
            mcq(
              'Na função `status(grade: u8) -> &\'static str`, por que não há `;` após a chave `}` do `match`?',
              [
                'Porque em Rust a última expressão de uma função, sem `;`, é o seu valor de retorno',
                'Porque blocos `match` nunca aceitam `;` depois da chave',
                'Porque `&\'static str` dispensa ponto e vírgula',
                'Porque o compilador insere um `break` automático',
              ],
              0,
              'Em Rust, funções devolvem o valor da sua última expressão quando ela não termina com `;`. Se colocássemos `;` ali, o bloco devolveria `()` e causaria erro `E0308`.',
            ),
            match(
              'Associe cada padrão de `match` ao conjunto de inteiros `u8` que ele aceita:',
              [
                ['`2 | 5`', 'Apenas `2` ou `5`'],
                ['`2..=5`', '`2, 3, 4` ou `5`'],
                ['`0`', 'Apenas `0`'],
                ['`_`', 'Qualquer valor restante'],
              ],
              '`|` une valores avulsos, `..=` define um intervalo fechado e `_` captura todos os demais casos.',
            ),
            gen((rng) => {
              const grade = randInt(rng, 0, 12);
              const correct =
                grade <= 4
                  ? 'reprovado'
                  : grade <= 6
                    ? 'recuperação'
                    : grade <= 10
                      ? 'aprovado'
                      : 'inválida';
              return rmcq(
                rng,
                `Qual string o programa imprime quando \`grade\` vale \`${grade}\`?`,
                correct,
                ['reprovado', 'recuperação', 'aprovado', 'inválida'],
                `Para \`grade = ${grade}\`, o padrão que casa é \`${grade <= 4 ? '0..=4' : grade <= 6 ? '5..=6' : grade <= 10 ? '7..=10' : '_'}\`, que devolve \`"${correct}"\`.`,
                {
                  visual: code(
                    `fn main() {
    let grade: u8 = ${grade};
    let s = match grade {
        0..=4 => "reprovado",
        5..=6 => "recuperação",
        7..=10 => "aprovado",
        _ => "inválida",
    };
    println!("{s}");
}`,
                  ),
                },
              );
            }),
            codePuzzle(
              'Monte a função do Desafio 50 Dias #3 que devolve a situação da nota usando `match` como expressão de retorno.',
              [
                "fn status(grade: u8) -> &'static str {",
                '    match grade {',
                '        0..=4 => "reprovado",',
                '        5..=6 => "recuperação",',
                '        7..=10 => "aprovado",',
                '        _ => "inválida",',
                '    }',
                '}',
              ],
              ['    };', '        7..10 => "aprovado",'],
              'Padrões de intervalo usam `..=` (`7..=10`), e o `match` no fim da função vai sem `;` (`}` na linha 7) para devolver o `&\'static str`.',
            ),
            num(
              'Juntando `for`, intervalos e `match`: qual é o valor final de `pts`?',
              21,
              'O laço percorre `x` de `1` a `6`: para `1` e `2` soma `1 + 1 = 2`; para `3, 4, 5` soma `3 + 3 + 3 = 9`; para `6` cai em `_ => 10`. Total: `2 + 9 + 10 = 21`.',
              {
                visual: code(
                  `fn main() {
    let mut pts = 0;
    for x in 1..=6 {
        pts += match x {
            1 | 2 => 1,
            3..=5 => 3,
            _ => 10,
        };
    }
    println!("{pts}");
}`,
                  [3, 4, 5, 6, 7],
                ),
              },
            ),
          ],
        },
      ],
    },
  ],
};

import React from 'react';
import type { UnitDef, VisualSpec } from '../../types';
import { code, fill, gen, match, mcq, num, order, table, tf } from '../../helpers';
import { codePuzzle } from '../../codePractice';
import { TableView } from '../../../components/visuals/Misc';
import { randInt } from '../../../lib/random';

const memStepper = (
  steps: { label: string; head: string[]; rows: (string | number)[][]; highlight?: number[]; info: string }[],
): VisualSpec => ({
  name: 'stepper',
  props: {
    steps: steps.length,
    labels: steps.map((s) => s.label),
    render: (k: number, width: number) => (
      <TableView width={width} head={steps[k].head} rows={steps[k].rows} highlight={steps[k].highlight} />
    ),
    info: (k: number) => steps[k].info,
  },
});

export const rustStructs: UnitDef = {
  id: 'rt-struct',
  title: 'Structs e métodos',
  icon: '🏗️',
  subtitle: 'Agrupe dados com nome, associe comportamento em blocos impl e controle a posse de cada campo',
  source: 'The Rust Programming Language (edição 2024), cap. 5 · Desafio 50 Dias — Rust, módulo 3',
  extra: true,
  guide:
    'Uma `struct` agrupa campos nomeados de tipos diferentes. Em Rust seguro, os campos não ficam com valores não inicializados: toda instância precisa inicializar todos os campos (`E0063` se faltar algum). Para atribuir diretamente a campos de uma variável dona da instância, use `let mut` (`E0594` sem ele); não se declara `mut` por campo. Quando uma variável tem o mesmo nome do campo, use o *field init shorthand* (`Sensor { id, active: true }`); para copiar ou mover o restante de outra instância, termine com a *update syntax* (`..base`).\n\n' +
    'O comportamento fica em blocos `impl`: métodos recebem `&self` (empréstimo de leitura), `&mut self` (empréstimo de escrita) ou `self` (por valor: move se o tipo não for `Copy`, cópia se for). Na chamada `x.metodo()`, o compilador referencia ou desreferencia `x` automaticamente — não existe o operador `->` de C em chamadas de método. Funções dentro de `impl` sem `self`, como `Self::new(...)`, são funções associadas chamadas com `::`.\n\n' +
    'Além das structs com campos nomeados, existem *tuple structs* (`struct Meters(i32);`, ótimas para criar tipos distintos com o padrão *newtype*) e *unit-like structs* (`struct Marker;`, de zero bytes). Para inspecionar valores em depuração, adicione `#[derive(Debug)]` e use `{:?}`, `{:#?}` ou a macro `dbg!(&x)`.\n\n' +
    'Por fim, cada campo tem sua própria posse: mover uma `String` de dentro de uma struct sem `Drop` causa um **move parcial** (*partial move*) — a struct inteira e o campo movido não podem mais ser usados (`E0382`), mas os demais campos permanecem acessíveis. Se uma struct guardar referências (`&str`), elas precisam de um *lifetime* explícito, como em `struct Excerpt<\'a> { text: &\'a str }` (erro `E0106` se omitido); também é possível usar `&\'static str` sem parâmetro genérico.',
  lessons: [
    {
      id: 'rt-struct-def',
      title: 'Definir e instanciar structs',
      parts: [
        {
          card: [
            {
              title: 'Moldes com campos nomeados',
              body:
                'Assim como em C, uma `struct` em Rust agrupa dados relacionados sob um único tipo, mas sem precisar de `typedef` e sem risco de campos com lixo de memória.\n\n' +
                'Para criar uma instância, informe `campo: valor` entre chaves em **qualquer ordem**. O compilador exige que **todos** os campos recebam valor (esquecer um gera o erro `E0063`).\n\n' +
                'Para ler ou gravar um campo, use o ponto (`.`). Atenção à regra de ouro: em Rust **não existe `mut` por campo**. Para atribuir diretamente a campos de uma variável dona da instância, declare-a com `let mut` (`E0594` sem ele). Também é possível alterar campos por uma referência `&mut T` sem que o vínculo da referência seja `mut`; tipos como `Cell` e `RefCell` permitem mutabilidade interior.',
              visual: code(
                `struct Sensor {
    id: u8,
    active: bool,
    value: i32,
}

fn main() {
    let mut s = Sensor {
        id: 1,
        active: true,
        value: 25,
    };
    s.value = 30;
    println!("{}: {}", s.id, s.value);
}`,
                [8, 13],
                'main.rs',
              ),
              tip: 'Em C, `struct Sensor s = {1};` zera os campos omitidos. Em Rust, omitir qualquer campo na criação sem sintaxe explícita é erro de compilação (`E0063`).',
            },
            {
              title: 'Pilha e mutabilidade passo a passo',
              body:
                'Acompanhe no passo a passo como os campos de `s` ficam na pilha (*stack*) e por que o `let mut` na variável `s` libera a escrita em qualquer campo da instância.',
              visual: memStepper([
                {
                  label: '1. Instanciar s',
                  head: ['Campo', 'Tipo', 'Valor na pilha'],
                  rows: [
                    ['s.id', 'u8', '1'],
                    ['s.active', 'bool', 'true'],
                    ['s.value', 'i32', '25'],
                  ],
                  info: '`let mut s = Sensor { ... };` inicializa todos os três campos na pilha.',
                },
                {
                  label: '2. Alterar s.value',
                  head: ['Campo', 'Tipo', 'Valor na pilha'],
                  rows: [
                    ['s.id', 'u8', '1'],
                    ['s.active', 'bool', 'true'],
                    ['s.value', 'i32', '30 (alterado)'],
                  ],
                  highlight: [2],
                  info: 'Como `s` tem `let mut`, a atribuição `s.value = 30;` atualiza o campo no lugar.',
                },
                {
                  label: '3. E sem let mut?',
                  head: ['Binding', 'Escrita em s.value', 'Resultado'],
                  rows: [
                    ['let mut s', 'Permitida', 'Compila e grava 30'],
                    ['let s', 'Proibida', 'Erro E0594 em compilação'],
                  ],
                  highlight: [1],
                  info: 'Sem `mut` na variável `s`, o compilador bloqueia `s.value = 30` com `E0594`.',
                },
              ]),
            },
          ],
          exercises: [
            mcq(
              'O que este programa imprime na saída padrão?',
              ['x=4, y=9', 'x=9, y=4', 'Erro: campos fora da ordem declarada', 'x=0, y=0'],
              0,
              'Ao instanciar uma `struct`, a ordem dos pares `campo: valor` entre chaves é livre porque cada valor está identificado pelo nome. Assim, `p.x` vale `4` e `p.y` vale `9`.',
              {
                visual: code(
                  `struct Point {
    x: i32,
    y: i32,
}

fn main() {
    let p = Point { y: 9, x: 4 };
    println!("x={}, y={}", p.x, p.y);
}`,
                  [7],
                  'Ordem dos campos',
                ),
              },
            ),
            tf(
              'Em Rust, é possível declarar apenas um campo específico como mutável dentro da definição da struct, como `struct User { id: u32, mut score: i32 }`.',
              false,
              'Rust não permite `mut` na declaração de campos de uma `struct`. Para atribuir diretamente a campos de uma variável dona da instância, usamos `let mut u = User { ... };`.',
            ),
            mcq(
              'A linha destacada impede a compilação. Qual erro o `rustc` emite e qual é a causa?',
              [
                'E0594: cannot assign to `p.x`, as `p` is not declared as mutable',
                'E0063: missing field `x` in initializer of `Point`',
                'E0308: mismatched types (expected `i32`, found `u32`)',
                'E0382: use of moved value: `p.x`',
              ],
              0,
              'A variável `p` foi criada com `let p` (imutável). Tentar alterar `p.x = 5;` produz o erro `E0594` (*cannot assign to `p.x`, as `p` is not declared as mutable*). Para corrigir, declare `let mut p = ...;`.',
              {
                visual: code(
                  `struct Point {
    x: i32,
    y: i32,
}

fn main() {
    let p = Point { x: 2, y: 3 };
    p.x = 5;
}`,
                  [8],
                  'Instância imutável',
                ),
              },
            ),
            fill(
              'Complete a criação de uma instância mutável e a leitura do seu campo:',
              'Para alterar campos depois de criar a variável, usamos let ___ s = Sensor { id: 1, val: 10 }; e lemos o valor com s___val.',
              ['mut', '.'],
              ['const', '->', '::'],
              '`let mut s` torna a instância mutável, e o operador ponto (`.`) acessa o campo `val`.',
            ),
            mcq(
              'O que acontece ao compilar este trecho com a linha destacada?',
              [
                'Falha com E0063: missing field `height` in initializer of `Rect`',
                'Compila e inicializa `height` automaticamente com 0',
                'Compila, mas `r.height` fica com lixo de memória como em C',
                'Falha com E0594 porque falta `mut` em `r`',
              ],
              0,
              'Em Rust, toda instanciação de `struct` precisa fornecer valor para todos os campos declarados. Omitir `height` gera o erro `E0063` (*missing field `height` in initializer of `Rect`*).',
              {
                visual: code(
                  `struct Rect {
    width: u32,
    height: u32,
}

fn main() {
    let r = Rect { width: 10 };
    println!("{}", r.width);
}`,
                  [7],
                  'Campo ausente',
                ),
              },
            ),
            codePuzzle(
              'Monte o programa que define `Counter`, cria uma instância mutável iniciando em 10, soma 5 ao campo `count` e imprime o resultado:',
              [
                'struct Counter { count: i32 }\n\nfn main() {',
                '    let mut c = Counter { count: 10 };',
                '    c.count += 5;',
                '    println!("{}", c.count);\n}',
              ],
              [
                '    let c = Counter { count: 10 };',
                '    c->count += 5;',
                'struct Counter { mut count: i32 }',
              ],
              'A definição da `struct` vem fora do `main` sem `mut` no campo; dentro do `main`, `let mut c` habilita `c.count += 5;` usando o operador ponto.',
            ),
            gen((rng) => {
              const base = randInt(rng, 10, 40);
              const delta = randInt(rng, 3, 15);
              return num(
                'Qual número inteiro é impresso na saída padrão?',
                base + delta,
                `O campo \`rpm\` começa valendo ${base}. Como \`m\` foi declarado com \`let mut\`, a linha \`m.rpm += m.step;\` soma ${delta}, resultando em ${base + delta}.`,
                {
                  visual: code(
                    `struct Motor {
    rpm: i32,
    step: i32,
}

fn main() {
    let mut m = Motor {
        rpm: ${base},
        step: ${delta},
    };
    m.rpm += m.step;
    println!("{}", m.rpm);
}`,
                    [11],
                    'Atualizando campo',
                  ),
                },
              );
            }),
            match(
              'Associe cada situação ao comportamento do compilador Rust:',
              [
                ['Omitir um campo na criação', 'Erro E0063 (missing field)'],
                ['Atribuir a campo sem let mut', 'Erro E0594 (cannot assign)'],
                ['Trocar a ordem dos campos nas chaves', 'Permitido sem alterar o resultado'],
                ['Escrever mut dentro de struct { ... }', 'Erro de sintaxe (mut vai no let)'],
              ],
              'Rust exige todos os campos na criação (`E0063`), permite qualquer ordem porque os campos têm nome e controla a mutabilidade na variável (`let mut`, erro `E0594`).',
            ),
          ],
        },
        {
          card: [
            {
              title: 'Atalho de campos e atualização ..base',
              body:
                'Criar structs em funções construtoras seria repetitivo se precisássemos escrever `port: port, retries: retries`. Quando uma variável ou parâmetro tem **exatamente o mesmo nome** do campo, Rust oferece o *field init shorthand*: basta escrever `port,` uma única vez.\n\n' +
                'Outra mão na roda é a *struct update syntax* (`..base`): quando você quer criar uma instância mudando só alguns campos de outra já existente, liste os campos novos e termine com `..base` (sem vírgula depois dele!).',
              visual: code(
                `struct Config {
    port: u16,
    retries: u8,
    debug: bool,
}

fn make(port: u16) -> Config {
    Config {
        port,
        retries: 3,
        debug: false,
    }
}

fn main() {
    let c1 = make(8080);
    let c2 = Config {
        debug: true,
        ..c1
    };
    println!(
        "{} {}",
        c2.port, c2.retries
    );
}`,
                [9, 18, 19],
                'Shorthand e ..c1',
              ),
              tip: 'O trecho `..c1` deve ser obrigatoriamente o **último** item dentro das chaves `{ ... }` e não leva vírgula no final.',
            },
            {
              title: 'Comparando c1 e c2 campo a campo',
              body:
                'Veja na tabela de onde vem cada campo de `c2` quando escrevemos `Config { debug: true, ..c1 }`:',
              visual: table(
                ['Campo', 'Em c1', 'Em c2 (com ..c1)'],
                [
                  ['port (u16)', 8080, '8080 (copiado de c1)'],
                  ['retries (u8)', 3, '3 (copiado de c1)'],
                  ['debug (bool)', 'false', 'true (definido em c2)'],
                ],
                [2],
              ),
            },
            {
              title: 'No seu computador 💻',
              body:
                'Hora de praticar com o Cargo! Crie um projeto novo e modele leituras de sensores usando *shorthand* e atualização `..base`:\n\n' +
                '• Rode `cargo new leituras` e abra `src/main.rs`.\n' +
                '• Defina `struct Reading { sensor_id: u8, temp_c: i32, valid: bool }`.\n' +
                '• Escreva `fn make_reading(sensor_id: u8, temp_c: i32) -> Reading` usando o *field init shorthand* para `sensor_id` e `temp_c`, com `valid: true`.\n' +
                '• No `main`, crie `r1 = make_reading(1, 24)` e crie `r2 = Reading { temp_c: 29, ..r1 }`.\n' +
                '• **Critério de pronto:** `cargo run` deve imprimir `1: 24 -> 29 (true)` e `cargo clippy -- -D warnings` deve terminar sem nenhum aviso.',
              visual: code(
                `struct Reading {
    sensor_id: u8,
    temp_c: i32,
    valid: bool,
}

fn make_reading(
    sensor_id: u8,
    temp_c: i32,
) -> Reading {
    Reading {
        sensor_id,
        temp_c,
        valid: true,
    }
}

fn main() {
    let r1 = make_reading(1, 24);
    let r2 = Reading {
        temp_c: 29,
        ..r1
    };
    println!(
        "{}: {} -> {} ({})",
        r2.sensor_id,
        r1.temp_c,
        r2.temp_c,
        r2.valid
    );
}`,
                [12, 13, 21, 22],
                'src/main.rs',
              ),
            },
          ],
          exercises: [
            mcq(
              'Quando podemos usar o atalho `Point { x, y: 0 }` em vez de `Point { x: x, y: 0 }`?',
              [
                'Quando existe no escopo uma variável ou parâmetro chamado `x` do mesmo tipo do campo `x`',
                'Sempre que `x` for o primeiro campo declarado na `struct`',
                'Quando queremos inicializar o campo `x` automaticamente com zero',
                'Apenas dentro de métodos que recebem `&mut self`',
              ],
              0,
              'O *field init shorthand* funciona sempre que a variável local ou parâmetro da função tem o mesmo nome e tipo do campo da `struct`.',
            ),
            num(
              'Qual valor numérico é impresso por este programa?',
              19,
              'Em `p2`, o campo `x` foi substituído por `10`, enquanto `..p1` copiou `y: 7` e `z: 2` de `p1`. A soma `10 + 7 + 2` vale `19`.',
              {
                visual: code(
                  `struct Vec3 {
    x: i32,
    y: i32,
    z: i32,
}

fn main() {
    let p1 = Vec3 { x: 3, y: 7, z: 2 };
    let p2 = Vec3 { x: 10, ..p1 };
    println!("{}", p2.x + p2.y + p2.z);
}`,
                  [9],
                  'Update syntax',
                ),
              },
            ),
            tf(
              'Na sintaxe de atualização de struct, `..base` precisa aparecer por último dentro das chaves e não aceita vírgula depois dele.',
              true,
              'Em Rust, a expressão base `..base` fecha o inicializador da struct: colocar campos ou uma vírgula após `..base` causa erro de sintaxe.',
            ),
            fill(
              'Complete a função construtora usando o atalho de campo e a atualização a partir de `base`:',
              'Em fn with_id(id: u32, base: Item) -> Item, escrevemos Item { ___, ___ } para aproveitar o parâmetro id e copiar o restante de base.',
              ['id', '..base'],
              ['id: u32', '...base', 'base.id'],
              'O atalho `id` equivale a `id: id`, e `..base` preenche os demais campos com os valores de `base`.',
            ),
            mcq(
              'Por que a criação de `c2` na linha destacada não compila?',
              [
                'Porque `..c1` foi colocado antes de `port: 9000`, e a base `..c1` precisa vir por último',
                'Porque `..c1` exige três pontos (`...c1`) como em JavaScript',
                'Porque `c1` precisava ser declarada como `let mut c1`',
                'Porque `u16` não pode ser copiado com `..c1`',
              ],
              0,
              'Diferente do operador *spread* (`...`) de JavaScript, a *struct update syntax* do Rust (`..c1`) só pode aparecer no final do bloco `{ port: 9000, ..c1 }`, especificando o que sobrou.',
              {
                visual: code(
                  `struct Net {
    port: u16,
    tls: bool,
}

fn main() {
    let c1 = Net {
        port: 80,
        tls: true,
    };
    let c2 = Net { ..c1, port: 9000 };
    println!("{}", c2.port);
}`,
                  [11],
                  'Posição de ..c1',
                ),
              },
            ),
            codePuzzle(
              'Monte a função `build` com *field init shorthand* e o `main` que cria `b2` a partir de `..b1` trocando `on` para `false`:',
              [
                'struct Badge { id: i32, on: bool }\n\nfn build(id: i32) -> Badge {',
                '    Badge { id, on: true }',
                '}\n\nfn main() {',
                '    let b1 = build(42);',
                '    let b2 = Badge { on: false, ..b1 };',
                '    println!("{} {}", b2.id, b2.on);\n}',
              ],
              [
                '    let b2 = Badge { ..b1, on: false };',
                '    Badge { id = id, on: true }',
              ],
              '`Badge { id, on: true }` usa o *shorthand* para `id`, e `Badge { on: false, ..b1 }` coloca `..b1` no final.',
            ),
            gen((rng) => {
              const w1 = randInt(rng, 2, 5);
              const h1 = randInt(rng, 2, 6);
              const d1 = randInt(rng, 2, 4);
              const w2 = randInt(rng, 6, 9);
              return num(
                'Qual é o volume (`w * h * d`) de `b2` impresso pelo programa?',
                w2 * h1 * d1,
                `O bloco \`b2\` redefine \`w\` como ${w2} e reaproveita \`h = ${h1}\` e \`d = ${d1}\` de \`b1\` via \`..b1\`. O produto é $${w2} \\times ${h1} \\times ${d1} = ${w2 * h1 * d1}$.`,
                {
                  visual: code(
                    `struct Box3D {
    w: i32,
    h: i32,
    d: i32,
}

fn main() {
    let b1 = Box3D {
        w: ${w1},
        h: ${h1},
        d: ${d1},
    };
    let b2 = Box3D { w: ${w2}, ..b1 };
    println!("{}", b2.w * b2.h * b2.d);
}`,
                    [13],
                    'Volume com ..b1',
                  ),
                },
              );
            }),
            order(
              'Ordene o que acontece na execução de `let c1 = make(80); let c2 = Config { tls: true, ..c1 };`:',
              [
                'A chamada make(80) recebe port = 80',
                'O shorthand cria c1 com port: 80 e tls: false',
                'A expressão de c2 define tls como true',
                'O trecho ..c1 copia port: 80 de c1 para c2',
              ],
              'Primeiro `make(80)` monta `c1` usando o *shorthand*; depois `c2` define o campo explícito `tls` e copia os campos restantes de `c1`.',
            ),
          ],
        },
      ],
    },
    {
      id: 'rt-struct-impl',
      title: 'Métodos e funções associadas',
      parts: [
        {
          card: [
            {
              title: 'Comportamento em blocos impl',
              body:
                'Rust não tem classes nem herança: os dados moram na `struct` e as ações moram num bloco `impl NomeDaStruct { ... }`.\n\n' +
                'Dentro de `impl Rect`, o tipo `Self` (com `S` maiúsculo) é um apelido para `Rect`. Nos métodos de leitura abaixo, o primeiro parâmetro é `&self`, abreviação de `self: &Self` — um empréstimo imutável da instância que chamou o método.\n\n' +
                'Diferente de C (onde ponteiros exigem `r->area`), em Rust você **sempre usa `.`**. O compilador aplica *automatic referencing and dereferencing*: se `r` for `Rect` ou `&Rect`, `r.area()` passa `&self` automaticamente!',
              visual: code(
                `struct Rect {
    width: u32,
    height: u32,
}

impl Rect {
    fn area(&self) -> u32 {
        self.width * self.height
    }

    fn fits(&self, o: &Rect) -> bool {
        self.width > o.width
            && self.height > o.height
    }
}

fn main() {
    let r1 = Rect {
        width: 8,
        height: 5,
    };
    let r2 = Rect {
        width: 6,
        height: 4,
    };
    println!(
        "{} {}",
        r1.area(),
        r1.fits(&r2)
    );
}`,
                [7, 11, 29],
                'impl Rect',
              ),
              tip: 'É permitido criar um método com o mesmo nome de um campo (por exemplo, `fn width(&self) -> u32`). O compilador distingue os dois pelos parênteses: `r.width` lê o campo e `r.width()` chama o método.',
            },
            {
              title: 'Chamada de método vs acesso em C',
              body:
                'Compare como C e Rust tratam chamadas sobre um valor ou sobre uma referência/ponteiro para struct:',
              visual: table(
                ['Operação', 'Em C', 'Em Rust'],
                [
                  ['Sobre valor r', 'area(&r)', 'r.area() (insere & sozinho)'],
                  ['Sobre referência p', 'p->width ou area(p)', 'p.width e p.area() (usa .)'],
                  ['Receptor de leitura', 'const Rect *self', '&self (atalho de self: &Self)'],
                ],
                [0, 1],
              ),
            },
          ],
          exercises: [
            mcq(
              'Dentro de um bloco `impl Rect`, de que anotação completa o parâmetro `&self` é uma abreviação?',
              ['`self: &Self` (isto é, `self: &Rect`)', '`self: Rect`', '`mut self: &Rect`', '`&mut Self`'],
              0,
              'Dentro de `impl Rect`, `Self` é um apelido para `Rect` e `&self` é o atalho oficial da linguagem para `self: &Self`.',
            ),
            num(
              'Qual valor inteiro é impresso por `r.perimeter()`?',
              22,
              'O método calcula `2 * (self.w + self.h) = 2 * (7 + 4) = 22`. Como recebe `&self`, `r` é apenas emprestado para leitura.',
              {
                visual: code(
                  `struct Rect {
    w: u32,
    h: u32,
}

impl Rect {
    fn perimeter(&self) -> u32 {
        2 * (self.w + self.h)
    }
}

fn main() {
    let r = Rect { w: 7, h: 4 };
    println!("{}", r.perimeter());
}`,
                  [7, 14],
                  'Perímetro',
                ),
              },
            ),
            tf(
              'Se `p` for uma referência `&Rect`, em Rust precisamos escrever `p->area()` com seta em vez de `p.area()`.',
              false,
              'Rust não usa o operador `->` para acessar campos ou métodos. Graças à referenciação e desreferenciação automáticas, `p.area()` funciona tanto para `Rect` quanto para `&Rect`.',
            ),
            mcq(
              'Na chamada `r1.fits(&r2)` da linha destacada, quem é passado para cada parâmetro de `fn fits(&self, other: &Rect) -> bool`?',
              [
                '`&r1` entra em `&self` (antes do ponto) e `&r2` entra em `other`',
                '`&r2` entra em `&self` e `r1` entra em `other`',
                'Apenas `&r2` é passado; `&self` fica vazio',
                '`r1` é movido para `self` e `r2` é copiado',
              ],
              0,
              'Na sintaxe de método `objeto.metodo(arg)`, o receptor antes do ponto (`r1`) é emprestado automaticamente como `&self`, e os argumentos entre parênteses (`&r2`) preenchem os parâmetros seguintes (`other`).',
              {
                visual: code(
                  `struct Rect {
    w: u32,
    h: u32,
}

impl Rect {
    fn fits(
        &self,
        other: &Rect,
    ) -> bool {
        self.w > other.w
            && self.h > other.h
    }
}

fn main() {
    let r1 = Rect { w: 9, h: 6 };
    let r2 = Rect { w: 5, h: 4 };
    println!("{}", r1.fits(&r2));
}`,
                  [7, 19],
                  'Dois parâmetros',
                ),
              },
            ),
            fill(
              'Complete o método que empresta a struct para leitura e verifica se a temperatura passou do limite:',
              'impl Probe {\n    fn is_hot(___) -> bool {\n        ___.temp > 80\n    }\n}',
              ['&self', 'self'],
              ['&mut self', 'this', 'Self'],
              'O receptor de leitura é `&self`, e dentro do corpo acessamos os campos da instância através de `self.temp`.',
            ),
            codePuzzle(
              'Monte o programa com o bloco `impl Rect` e o método `area` que lê `w` e `h` via `&self` e devolve `w * h`:',
              [
                'struct Rect { w: u32, h: u32 }\n\nimpl Rect {',
                '    fn area(&self) -> u32 {',
                '        self.w * self.h',
                '    }',
                '}\n\nfn main() {\n    let r = Rect { w: 3, h: 4 };\n    println!("{}", r.area());\n}',
              ],
              [
                '    fn area(Rect) -> u32 {',
                '        self.w * self.h;',
                '        this.w * this.h',
              ],
              'O método recebe `&self` e a última linha sem ponto e vírgula devolve a expressão `self.w * self.h`.',
            ),
            gen((rng) => {
              const w = randInt(rng, 3, 8);
              const h = randInt(rng, 2, 6);
              const k = randInt(rng, 2, 4);
              return num(
                'Qual número inteiro é impresso na saída padrão?',
                w * h * k,
                `O método \`scaled_area\` calcula \`self.w * self.h * k\`, que vale $${w} \\times ${h} \\times ${k} = ${w * h * k}$.`,
                {
                  visual: code(
                    `struct Panel {
    w: u32,
    h: u32,
}

impl Panel {
    fn scaled_area(
        &self,
        k: u32,
    ) -> u32 {
        self.w * self.h * k
    }
}

fn main() {
    let p = Panel { w: ${w}, h: ${h} };
    println!("{}", p.scaled_area(${k}));
}`,
                    [7, 17],
                    'Método com argumento',
                  ),
                },
              );
            }),
            mcq(
              'Por que o método `clear` falha na linha destacada ao ser compilado?',
              [
                'Erro E0594: `self` é uma referência imutável `&self`; para alterar `self.val`, a assinatura precisa ser `&mut self`',
                'Erro E0063: falta retornar `Self` no final de `clear`',
                'Erro E0382: `self.val` foi movido na linha anterior',
                'Erro E0308: `0` não pode ser atribuído a um `i32`',
              ],
              0,
              'Com `&self`, o método só tem permissão de leitura (`cannot assign to self.val, which is behind a & reference`, erro `E0594`). Para alterar campos, o receptor deve ser `&mut self`.',
              {
                visual: code(
                  `struct Meter {
    val: i32,
}

impl Meter {
    fn clear(&self) {
        self.val = 0;
    }
}`,
                  [6, 7],
                  'Escrita em &self',
                ),
              },
            ),
          ],
        },
        {
          card: [
            {
              title: 'Os três receptores e Self::new',
              body:
                'Todo método escolhe como recebe a instância no primeiro parâmetro:\n' +
                '• `&self`: empresta para **leitura**.\n' +
                '• `&mut self`: empresta para **alteração** (ao chamar sobre uma variável dona da instância, exige `let mut`, senão dá `E0596`; também pode ser chamado por uma referência `&mut T`).\n' +
                '• `self`: recebe **por valor** (move a instância se ela não for `Copy`, e usá-la depois dá `E0382`; se for `Copy`, recebe uma cópia).\n\n' +
                'E quando uma função dentro do `impl` **não recebe `self`**? Ela é uma **função associada** ao tipo, chamada com `::` — como `Person::new(...)`, que faz o papel de construtor em Rust! Uma mesma struct também pode ter vários blocos `impl` separados.',
              visual: code(
                `struct Person {
    name: String,
    age: u8,
}

impl Person {
    fn new(
        name: String,
        age: u8,
    ) -> Self {
        Self { name, age }
    }

    fn birthday(&mut self) {
        self.age += 1;
    }

    fn into_name(self) -> String {
        self.name
    }
}

fn main() {
    let mut p = Person::new(
        String::from("Ana"), 20,
    );
    p.birthday();
    let age = p.age;
    println!(
        "{} {}",
        age,
        p.into_name()
    );
}`,
                [7, 14, 18, 24],
                'new, &mut self e self',
              ),
              tip: 'No exercício 14 do roteiro, `age` usa `u8` (0 a 255): assim, idades negativas ficam impossíveis pelo próprio sistema de tipos, sem precisar de `if age < 0`!',
            },
            {
              title: 'Rastreando posse e empréstimos nos métodos',
              body:
                'Use os botões do passo a passo para ver o que acontece com `p` em `Person::new`, `p.birthday()` e `p.into_name()`:',
              visual: memStepper([
                {
                  label: '1. Person::new(...)',
                  head: ['Chamada', 'Receptor', 'Estado de p'],
                  rows: [
                    ['Person::new', 'Sem self (::)', 'Cria e devolve posse a mut p'],
                    ['p.name', 'String', '"Ana"'],
                    ['p.age', 'u8', '20'],
                  ],
                  highlight: [0],
                  info: '`Person::new` não recebe `self`: constrói um `Person` novo e entrega a posse para `mut p`.',
                },
                {
                  label: '2. p.birthday()',
                  head: ['Chamada', 'Receptor', 'Estado de p'],
                  rows: [
                    ['p.birthday()', '&mut self', 'Empréstimo mutável temporário'],
                    ['p.name', 'String', '"Ana"'],
                    ['p.age', 'u8', '21 (incrementado)'],
                  ],
                  highlight: [2],
                  info: '`p.birthday()` empresta `p` com `&mut self`, soma 1 em `p.age` e devolve o controle a `p`.',
                },
                {
                  label: '3. p.into_name()',
                  head: ['Chamada', 'Receptor', 'Estado de p'],
                  rows: [
                    ['p.into_name()', 'self (por valor)', 'Consome p por move!'],
                    ['Retorno', 'String', '"Ana" (extraído)'],
                    ['Variável p', 'Movida', 'Inacessível após a linha (E0382)'],
                  ],
                  highlight: [0, 2],
                  info: 'Como `into_name(self)` recebe `self` por valor, `p` é consumida e não pode mais ser usada depois.',
                },
              ]),
            },
            {
              title: 'No seu computador 💻',
              body:
                'Faça agora o **Exercício 14 (Struct Pessoa)** do roteiro *Desafio 50 Dias — Rust*:\n\n' +
                '• Rode `cargo new pessoa` e edite `src/main.rs`.\n' +
                '• Crie `struct Person { name: String, age: u8 }` (ou `Pessoa` com `nome` e `idade`).\n' +
                '• Num bloco `impl Person`, implemente:\n' +
                '  - `fn new(name: String, age: u8) -> Self` (construtor chamado com `Person::new`);\n' +
                '  - `fn is_adult(&self) -> bool` (devolve `self.age >= 18`);\n' +
                '  - `fn birthday(&mut self)` (incrementa `self.age += 1`).\n' +
                '• **Critério de pronto:** crie uma pessoa com 17 anos, mostre `is_adult()`, chame `birthday()` e mostre a nova idade e `is_adult()`. Confirme que `cargo clippy -- -D warnings` passa sem avisos.',
              visual: code(
                `struct Person {
    name: String,
    age: u8,
}

impl Person {
    fn new(
        name: String,
        age: u8,
    ) -> Self {
        Self { name, age }
    }

    fn is_adult(&self) -> bool {
        self.age >= 18
    }

    fn birthday(&mut self) {
        self.age += 1;
    }
}

fn main() {
    let mut p = Person::new(
        String::from("Caio"), 17,
    );
    println!("{}", p.is_adult());
    p.birthday();
    println!(
        "{}: {} ({})",
        p.name, p.age, p.is_adult()
    );
}`,
                [7, 14, 18, 27, 28],
                'Exercício 14 — Person',
              ),
            },
          ],
          exercises: [
            match(
              'Para uma struct `Counter` sem `Copy`, associe cada assinatura em `impl Counter` ao seu efeito sobre a instância:',
              [
                ['fn value(&self) -> i32', 'Empresta só para leitura'],
                ['fn inc(&mut self)', 'Empresta para alterar campos'],
                ['fn into_raw(self) -> i32', 'Consome a instância por move'],
                ['fn new() -> Self', 'Função associada chamada com ::'],
              ],
              'O primeiro parâmetro define o contrato: `&self` lê, `&mut self` altera, `self` consome um `Counter` sem `Copy` e a ausência de `self` cria uma função associada ao tipo.',
            ),
            mcq(
              'Como devemos chamar a função associada `square` definida no bloco `impl Rect` abaixo?',
              ['`Rect::square(6)`', '`Rect.square(6)`', '`new Rect::square(6)`', '`square(&Rect, 6)`'],
              0,
              'Funções dentro de um bloco `impl` que não têm `self` são funções associadas ao tipo e são chamadas com o operador de caminho `::`, como `Rect::square(6)`.',
              {
                visual: code(
                  `struct Rect {
    w: u32,
    h: u32,
}

impl Rect {
    fn square(size: u32) -> Self {
        Self { w: size, h: size }
    }
}`,
                  [7],
                  'Função associada',
                ),
              },
            ),
            mcq(
              'A chamada destacada falha na compilação. Qual erro o `rustc` aponta?',
              [
                'E0596: cannot borrow `c` as mutable, as it is not declared as mutable',
                'E0382: use of moved value: `c`',
                'E0063: missing field in initializer of `Counter`',
                'E0308: mismatched types',
              ],
              0,
              'O método `inc(&mut self)` exige um empréstimo mutável de `c`. Como `c` foi declarada com `let c` sem `mut`, o compilador recusa com o erro `E0596` (*cannot borrow `c` as mutable, as it is not declared as mutable*).',
              {
                visual: code(
                  `struct Counter {
    n: i32,
}

impl Counter {
    fn inc(&mut self) {
        self.n += 1;
    }
}

fn main() {
    let c = Counter { n: 0 };
    c.inc();
}`,
                  [12, 13],
                  'Falta let mut no chamador',
                ),
              },
            ),
            mcq(
              'Por que a segunda chamada na linha destacada não compila?',
              [
                'Erro E0382: `t.finish()` recebeu `self` por valor e consumiu `t`',
                'Erro E0596: `t` precisava ser declarada com `let mut t`',
                'Erro E0594: `finish` tentou alterar `t.secs`',
                'Erro E0277: `Timer` não implementa `Display`',
              ],
              0,
              'Como `fn finish(self) -> u32` recebe `self` por valor (sem `&`), a chamada `t.finish()` transfere a posse de `t` para dentro do método e a consome. Tentar usar `t` na linha seguinte dispara `E0382` (*use of moved value: `t`*).',
              {
                visual: code(
                  `struct Timer {
    secs: u32,
}

impl Timer {
    fn finish(self) -> u32 {
        self.secs
    }
}

fn main() {
    let t = Timer { secs: 15 };
    let a = t.finish();
    let b = t.finish();
    println!("{} {}", a, b);
}`,
                  [6, 14],
                  'Consumo com self',
                ),
              },
            ),
            tf(
              'Em Rust, é permitido dividir os métodos de uma mesma `struct` em dois ou mais blocos `impl` separados.',
              true,
              'Uma `struct` pode ter quantos blocos `impl` você quiser. Isso é útil para organizar métodos ou, mais adiante, implementar métodos específicos para certos tipos genéricos.',
            ),
            codePuzzle(
              'Monte o programa com o bloco `impl Account`, o construtor `new` e o método `deposit` que altera `balance`:',
              [
                'struct Account { balance: i32 }\n\nimpl Account {',
                '    fn new(balance: i32) -> Self {',
                '        Self { balance }',
                '    }\n    fn deposit(&mut self, v: i32) {',
                '        self.balance += v;',
                '    }',
                '}\n\nfn main() {\n    let mut acc = Account::new(10);\n    acc.deposit(5);\n    println!("{}", acc.balance);\n}',
              ],
              [
                '    fn new(&self, v: i32) -> Self {',
                '    fn deposit(&self, v: i32) {',
              ],
              '`new` não recebe `self` e devolve `Self { balance }`; já `deposit` altera o saldo, por isso exige `&mut self`.',
            ),
            gen((rng) => {
              const init = randInt(rng, 10, 50);
              const d1 = randInt(rng, 5, 20);
              const d2 = randInt(rng, 5, 20);
              return num(
                'Qual saldo final é impresso na saída padrão?',
                init + d1 + d2,
                `A conta começa com ${init} em \`Account::new(${init})\`. As duas chamadas \`acc.deposit\` somam ${d1} e ${d2} via \`&mut self\`, totalizando $${init} + ${d1} + ${d2} = ${init + d1 + d2}$.`,
                {
                  visual: code(
                    `struct Account {
    balance: i32,
}

impl Account {
    fn new(balance: i32) -> Self {
        Self { balance }
    }
    fn deposit(&mut self, v: i32) {
        self.balance += v;
    }
}

fn main() {
    let mut acc = Account::new(${init});
    acc.deposit(${d1});
    acc.deposit(${d2});
    println!("{}", acc.balance);
}`,
                    [15, 16, 17],
                    'Construtor e mutação',
                  ),
                },
              );
            }),
            mcq(
              'No Exercício 14 do roteiro, declaramos `age: u8` em `struct Person` em vez de `age: i32`. Qual é a vantagem prática dessa escolha em Rust?',
              [
                'O tipo `u8` (0 a 255) torna impossível representar idades negativas, dispensando validação contra negativos',
                'O compilador só permite implementar `Person::new` se todos os números forem `u8`',
                'Campos `i32` não podem ser alterados por métodos com `&mut self`',
                'O tipo `u8` permite números negativos até -255 com metade da memória',
              ],
              0,
              'Modelar o domínio com o tipo certo (`u8`, inteiro sem sinal de 0 a 255) faz o próprio compilador impedir idades negativas sem nenhum teste em tempo de execução.',
            ),
          ],
        },
      ],
    },
    {
      id: 'rt-struct-tuple',
      title: 'Tuple structs, unit structs e derive Debug',
      parts: [
        {
          card: [
            {
              title: 'Tuple structs, newtype e unit structs',
              body:
                'Nem toda struct precisa dar nome a cada campo. Uma **tuple struct** dá um nome ao **tipo**, mas declara apenas os tipos dos campos entre parênteses: `struct Color(u8, u8, u8);`.\n\n' +
                'Duas tuple structs com os mesmos tipos internos — como `struct Meters(i32);` e `struct Seconds(i32);` — são **tipos incompatíveis** (`E0308` se você tentar passar um onde se espera o outro). Quando ela tem um único campo, como `struct Money(i64);` (Exercício 20 do roteiro), chamamos isso de padrão **newtype**: segurança de tipo sem acrescentar dados! Para garantir o mesmo layout do campo interno, use `#[repr(transparent)]`.\n\n' +
                'Já uma **unit-like struct** (`struct Marker;`) não tem campo nenhum e ocupa **0 bytes** na memória.',
              visual: code(
                `struct Color(u8, u8, u8);
struct Meters(i32);
struct Marker;

fn main() {
    let c = Color(255, 128, 0);
    let d = Meters(12);
    let _m = Marker;
    let Color(r, g, _) = c;
    println!("{} {} {}", r, g, d.0);
}`,
                [1, 2, 3, 9, 10],
                'Três formatos de struct',
              ),
              tip: 'Para ler campos de uma tuple struct, use ponto + índice começando em zero (`d.0`, `c.1`) ou desestruture com `let Color(r, g, b) = c;`.',
            },
            {
              title: 'Explorando os três formatos',
              body:
                'Avance pelos passos para comparar a declaração, o tamanho em memória e a forma de acesso de cada tipo de struct:',
              visual: memStepper([
                {
                  label: '1. Campos nomeados',
                  head: ['Sintaxe', 'Acesso', 'Quando usar'],
                  rows: [
                    ['struct Pt { x: i32, y: i32 }', 'p.x, p.y', 'Vários campos com papel distinto'],
                  ],
                  info: 'Structs clássicas dão nome a cada campo e deixam o código autodocumentado.',
                },
                {
                  label: '2. Tuple struct / Newtype',
                  head: ['Sintaxe', 'Acesso', 'Quando usar'],
                  rows: [
                    ['struct Color(u8, u8, u8);', 'c.0, c.1, c.2', 'Tupla que merece tipo próprio'],
                    ['struct Money(i64);', 'm.0', 'Newtype: impede misturar unidades'],
                  ],
                  highlight: [1],
                  info: '`Money(i64)` impede somar dinheiro com um inteiro comum por engano. Com `#[repr(transparent)]`, seu layout é garantidamente o mesmo do `i64` (8 bytes).',
                },
                {
                  label: '3. Unit-like struct',
                  head: ['Sintaxe', 'Tamanho na RAM', 'Quando usar'],
                  rows: [
                    ['struct AlwaysEqual;', '0 bytes (ZST)', 'Implementar traits sem guardar dados'],
                  ],
                  info: 'Uma *unit-like struct* é um *Zero-Sized Type* (ZST): existe na compilação e custa 0 bytes em execução.',
                },
              ]),
            },
          ],
          exercises: [
            num(
              'Qual número inteiro é impresso por `println!("{}", c.1);`?',
              40,
              'Os campos de uma *tuple struct* são indexados a partir de zero: `c.0` é `10`, `c.1` é `40` e `c.2` é `90`.',
              {
                visual: code(
                  `struct Rgb(u8, u8, u8);

fn main() {
    let c = Rgb(10, 40, 90);
    println!("{}", c.1);
}`,
                  [5],
                  'Índice de tuple struct',
                ),
              },
            ),
            mcq(
              'A chamada destacada tenta passar `Seconds(10)` para uma função que espera `Meters`. O que acontece?',
              [
                'Não compila com E0308 (mismatched types: expected `Meters`, found `Seconds`)',
                'Compila normalmente porque ambas guardam um `i32` por dentro',
                'Compila, mas converte o valor para zero em tempo de execução',
                'Não compila com E0063 por falta de nome nos campos',
              ],
              0,
              'Cada *tuple struct* define um tipo nominal único. Mesmo tendo o mesmo campo interno `i32`, `Seconds` e `Meters` são tipos distintos e incompatíveis (`E0308`: *mismatched types*).',
              {
                visual: code(
                  `struct Meters(i32);
struct Seconds(i32);

fn walk(d: Meters) {
    println!("{}", d.0);
}

fn main() {
    let t = Seconds(10);
    walk(t);
}`,
                  [10],
                  'Segurança de tipos',
                ),
              },
            ),
            tf(
              'Uma unit-like struct como `struct Empty;` ocupa 0 bytes na memória em tempo de execução.',
              true,
              'Unit-like structs não têm campos e são representadas como tipos de tamanho zero (*Zero-Sized Types* — ZST), não ocupando espaço na memória.',
            ),
            fill(
              'Complete a declaração do padrão newtype (Exercício 20 do roteiro) e a leitura do seu único campo:',
              'struct Money(___);\nfn main() {\n    let m = Money(500);\n    println!("{}", m.___);\n}',
              ['i64', '0'],
              ['cents: i64', '1', 'val'],
              '`struct Money(i64);` define uma tuple struct de um único campo sem nome, acessado com `m.0`.',
            ),
            mcq(
              'O que faz a linha destacada `let Pair(a, b) = p;` e qual valor é impresso?',
              [
                'Desestrutura `p` nas variáveis `a = 7` e `b = 15`, imprimindo `8`',
                'Cria uma nova struct `Pair` e imprime `22`',
                'Falha ao compilar porque tuple structs não suportam desestruturação',
                'Compara `p` com `(a, b)` e imprime `true`',
              ],
              0,
              'Para desestruturar uma *tuple struct*, usamos o nome do tipo no padrão: `let Pair(a, b) = p;` extrai `a = 7` e `b = 15`, de modo que `b - a` imprime `8`.',
              {
                visual: code(
                  `struct Pair(i32, i32);

fn main() {
    let p = Pair(7, 15);
    let Pair(a, b) = p;
    println!("{}", b - a);
}`,
                  [5],
                  'Desestruturação',
                ),
              },
            ),
            codePuzzle(
              'Monte o programa que declara a newtype `Money(i64)`, implementa o método `cents` e imprime o valor guardado:',
              [
                'struct Money(i64);\n\nimpl Money {',
                '    fn cents(&self) -> i64 { self.0 }',
                '}\n\nfn main() {',
                '    let m = Money(250);',
                '    println!("{}", m.cents());\n}',
              ],
              [
                '    fn cents(&self) -> i64 { self.1 }',
                'struct Money { i64 }',
              ],
              'A *tuple struct* usa parênteses `struct Money(i64);` e seu único campo é lido com `self.0`.',
            ),
            gen((rng) => {
              const r = randInt(rng, 10, 50);
              const g = randInt(rng, 10, 50);
              const b = randInt(rng, 10, 50);
              return num(
                'Qual é a soma impressa pelo programa após desestruturar `c`?',
                r + g + b,
                `A desestruturação \`let Color(x, y, z) = c;\` extrai \`x = ${r}\`, \`y = ${g}\` e \`z = ${b}\`. A soma é $${r} + ${g} + ${b} = ${r + g + b}$.`,
                {
                  visual: code(
                    `struct Color(u16, u16, u16);

fn main() {
    let c = Color(${r}, ${g}, ${b});
    let Color(x, y, z) = c;
    println!("{}", x + y + z);
}`,
                    [5, 6],
                    'Soma RGB',
                  ),
                },
              );
            }),
            match(
              'Associe cada declaração de struct ao seu caso de uso ideal:',
              [
                ['struct User { id: u32, active: bool }', 'Registro com vários campos de papéis distintos'],
                ['struct Money(i64);', 'Newtype para impedir mistura de unidades'],
                ['struct Point3(i32, i32, i32);', 'Coordenadas ordenadas com tipo próprio'],
                ['struct Marker;', 'Tipo sem dados (0 bytes) para implementar traits'],
              ],
              'Use campos nomeados quando os nomes ajudam na leitura, *tuple structs* quando a posição basta ou para criar um *newtype*, e *unit structs* quando não há dados a guardar.',
            ),
          ],
        },
        {
          card: [
            {
              title: 'Inspecionando structs com Debug e dbg!',
              body:
                'Se você tentar `println!("{}", p)` numa `struct` recém-criada, o compilador recusa com o erro `E0277`: structs não implementam `Display` automaticamente porque não existe um formato único óbvio para o usuário final.\n\n' +
                'Para inspecionar valores durante o desenvolvimento, basta colocar `#[derive(Debug)]` na linha acima da `struct`! Isso libera:\n' +
                '• `{:?}` no `println!`: imprime a struct em **uma linha**.\n' +
                '• `{:#?}` no `println!`: imprime com quebras de linha e indentação (*pretty-print*).\n' +
                '• `dbg!(&x)`: imprime no `stderr` o arquivo, a linha, a expressão e o valor, e **devolve o valor** avaliado!',
              visual: code(
                `#[derive(Debug)]
struct Point {
    x: i32,
    y: i32,
}

fn main() {
    let p = Point {
        x: dbg!(2 * 3),
        y: 5,
    };
    println!("{:?}", p);
    dbg!(&p);
}`,
                [1, 9, 12, 13],
                'derive(Debug) e dbg!',
              ),
              tip: 'Cuidado: `dbg!(p)` recebe `p` **por valor** (e devolve `p`). Se você escrever `dbg!(p);` e descartar o retorno, `p` será consumida se não for `Copy`! Por isso passamos uma referência `dbg!(&p);` quando só queremos espiar.',
            },
            {
              title: 'Comparando {}, {:?}, {:#?} e dbg!',
              body:
                'Veja na tabela qual ferramenta escolher em cada situação:',
              visual: table(
                ['Recurso', 'Exige na struct', 'Saída e destino'],
                [
                  ['"{}"', 'impl Display manual', 'Texto para usuário (stdout)'],
                  ['"{:?}"', 'Debug (derive ou impl)', 'Uma linha: Point { x: 6, y: 5 }'],
                  ['"{:#?}"', 'Debug (derive ou impl)', 'Várias linhas indentadas (stdout)'],
                  ['dbg!(&p)', 'Debug (derive ou impl)', '[arquivo:linha:coluna] &p = ... (stderr)'],
                ],
                [1, 3],
              ),
            },
            {
              title: 'No seu computador 💻',
              body:
                'Hora de juntar *tuple structs* e depuração (inspirado nos **Exercícios 19 e 20** do roteiro):\n\n' +
                '• Rode `cargo new depuracao` e abra `src/main.rs`.\n' +
                '• Crie `#[derive(Debug, Clone, Copy, PartialEq)] struct Money(i64);` para representar centavos.\n' +
                '• Crie `#[derive(Debug)] struct Item { name: String, price: Money }`.\n' +
                '• No `main`, instancie um `Item` usando `dbg!(150 * 3)` ao construir o `Money`, imprima o item com `{:?}` e `{:#?}`, e mostre também `item.name` e `item.price.0`.\n' +
                '• **Critério de pronto:** observe no terminal a diferença entre `stderr` (`dbg!`) e `stdout` (`println!`), e confirme zero avisos em `cargo clippy -- -D warnings`.',
              visual: code(
                `#[derive(Debug, Clone, Copy, PartialEq)]
struct Money(i64);

#[derive(Debug)]
struct Item {
    name: String,
    price: Money,
}

fn main() {
    let item = Item {
        name: String::from("Cabo"),
        price: Money(dbg!(150 * 3)),
    };
    println!("{:?}", item);
    println!("{:#?}", item);
    println!(
        "{}: {} centavos",
        item.name, item.price.0
    );
}`,
                [1, 4, 13, 15, 16],
                'src/main.rs',
              ),
            },
          ],
          exercises: [
            mcq(
              'O que acontece ao compilar este código sem atributos na struct `Point`?',
              [
                'Falha com E0277: `Point` doesn\'t implement `Debug` (sugerindo adicionar `#[derive(Debug)]`)',
                'Imprime `Point { x: 1, y: 2 }` normalmente',
                'Imprime o endereço de memória de `p` em hexadecimal',
                'Falha com E0382 porque `println!` move `p`',
              ],
              0,
              'O especificador `{:?}` exige a trait `std::fmt::Debug`. Sem `#[derive(Debug)]` na definição de `Point`, o compilador emite o erro `E0277` e sugere anotar `#[derive(Debug)]`.',
              {
                visual: code(
                  `struct Point {
    x: i32,
    y: i32,
}

fn main() {
    let p = Point { x: 1, y: 2 };
    println!("{:?}", p);
}`,
                  [8],
                  'Sem derive(Debug)',
                ),
              },
            ),
            mcq(
              'Qual é a saída exata impressa em `stdout` por este programa?',
              [
                'Point { x: 2, y: 9 } seguido de uma quebra de linha',
                '{ "x": 2, "y": 9 }',
                '(2, 9)',
                'Point(2, 9)',
              ],
              0,
              'A implementação gerada por `#[derive(Debug)]` para uma struct com campos nomeados formata em uma linha no padrão `Nome { campo1: valor1, campo2: valor2 }`.',
              {
                visual: code(
                  `#[derive(Debug)]
struct Point {
    x: i32,
    y: i32,
}

fn main() {
    let p = Point { x: 2, y: 9 };
    println!("{:?}", p);
}`,
                  [9],
                  'Saída de {:?}',
                ),
              },
            ),
            mcq(
              'Qual é a diferença entre usar `{:?}` e `{:#?}` no `println!` ao imprimir uma struct grande?',
              [
                '`{:?}` imprime tudo em uma linha só, enquanto `{:#?}` quebra linhas e indenta cada campo',
                '`{:?}` exige `#[derive(Debug)]` e `{:#?}` exige `#[derive(Display)]`',
                '`{:#?}` imprime apenas os valores numéricos em hexadecimal',
                '`{:?}` escreve em `stdout` e `{:#?}` escreve em `stderr`',
              ],
              0,
              'Ambos usam a trait `Debug`, mas `{:#?}` ativa o modo *pretty-print*, formatando structs aninhadas em várias linhas com indentação.',
            ),
            tf(
              'A macro `dbg!(expr)` avalia a expressão, imprime arquivo, linha e resultado em `stderr` e devolve o valor da expressão para que o cálculo continue normalmente.',
              true,
              'Por devolver o próprio valor avaliado, você pode envolver uma subexpressão cujo tipo implemente `Debug` com `dbg!(...)`, como `width: dbg!(3 * factor)`, preservando o valor e acrescentando o log em `stderr`.',
            ),
            mcq(
              'Por que a última linha destacada falha com o erro `E0382` (*borrow of moved value: `u`*)?',
              [
                'Porque `dbg!(u);` recebeu `u` por valor e o consumiu; deveria ser `dbg!(&u);` ou `let u = dbg!(u);`',
                'Porque `#[derive(Debug)]` não funciona em structs que possuem `String`',
                'Porque `println!` exige `{}` em vez de `{:?}` depois de `dbg!`',
                'Porque `u` precisava ser declarada com `let mut u`',
              ],
              0,
              'Ao contrário de `println!` (que empresta os valores a formatar), `dbg!(u)` recebe a posse de `u` e a devolve como retorno. Como o retorno de `dbg!(u);` foi descartado, `u` foi destruído ao fim da linha! Para apenas inspecionar sem mover, passe `dbg!(&u);`. Expressões usadas como argumentos de `println!` ainda podem mover valores ao serem avaliadas.',
              {
                visual: code(
                  `#[derive(Debug)]
struct User {
    name: String,
}

fn main() {
    let u = User {
        name: String::from("Ana"),
    };
    dbg!(u);
    println!("{:?}", u);
}`,
                  [10, 11],
                  'dbg! consome por valor',
                ),
              },
            ),
            fill(
              'Complete o atributo e o especificador para imprimir a struct em formato de depuração de uma linha:',
              '___\nstruct Node { id: u8 }\nfn main() {\n    let n = Node { id: 4 };\n    println!("___", n);\n}',
              ['#[derive(Debug)]', '{:?}'],
              ['#[debug]', '{}', '{:x}'],
              'O atributo `#[derive(Debug)]` implementa a trait `Debug`, que é acionada pelo especificador `{:?}`.',
            ),
            codePuzzle(
              'Monte o programa que deriva `Debug` para a tuple struct `Pair`, usa `dbg!(3 + 4)` ao criar o primeiro campo e imprime `p` com `{:?}`:',
              [
                '#[derive(Debug)]\nstruct Pair(i32, i32);\n\nfn main() {',
                '    let p = Pair(dbg!(3 + 4), 10);',
                '    println!("{:?}", p);\n}',
              ],
              [
                '#[derive(Display)]',
                '    println!("{}", p);',
              ],
              '`#[derive(Debug)]` vem imediatamente antes da `struct Pair(i32, i32);`, `dbg!(3 + 4)` avalia e devolve `7`, e `println!("{:?}", p);` imprime `Pair(7, 10)`.',
            ),
            gen((rng) => {
              const a = randInt(rng, 2, 8);
              const b = randInt(rng, 2, 6);
              const h = randInt(rng, 1, 9);
              return num(
                'Qual número inteiro o `println!` final escreve em `stdout`?',
                a * b + h,
                `A macro \`dbg!(${a} * ${b})\` escreve o log em \`stderr\` e devolve o resultado $${a} \\times ${b} = ${a * b}$ para o campo \`w\`. Em seguida, \`println!\` soma \`r.w + r.h\` = $${a * b} + ${h} = ${a * b + h}$ em \`stdout\`.`,
                {
                  visual: code(
                    `struct Rect {
    w: i32,
    h: i32,
}

fn main() {
    let r = Rect {
        w: dbg!(${a} * ${b}),
        h: ${h},
    };
    println!("{}", r.w + r.h);
}`,
                    [8, 11],
                    'Retorno de dbg!',
                  ),
                },
              );
            }),
          ],
        },
      ],
    },
    {
      id: 'rt-struct-own',
      title: 'Ownership dentro de structs',
      parts: [
        {
          card: [
            {
              title: 'Posse por campo e o move parcial',
              body:
                'Quando todos os campos de uma struct são `Copy` (como `i32` e `bool`), podemos anotar `#[derive(Clone, Copy)]` (Exercício 7 do roteiro) e a struct inteira passa a ser copiada ao atribuir. Mas se houver um único campo dono de memória no heap, como `String` ou `Vec<T>`, tentar derivar `Copy` falha com o erro `E0204`!\n\n' +
                'O que acontece quando movemos **apenas um campo** `String` para fora de uma struct (seja com `let n = u1.name;` ou com `..u1` na *update syntax*)? Ocorre um **move parcial** (*partial move*):\n' +
                '• O campo movido (`u1.name`) e a struct **como um todo** (`u1`) não podem mais ser usados (`E0382`).\n' +
                '• Porém, os **outros campos** que continuam válidos em `u1` (como `u1.id`) ainda podem ser lidos normalmente!',
              visual: code(
                `struct User {
    id: u32,
    name: String,
}

fn main() {
    let u1 = User {
        id: 7,
        name: String::from("Ana"),
    };
    let u2 = User {
        id: 8,
        ..u1
    };
    println!("{} {}", u1.id, u2.name);
}`,
                [11, 12, 13, 15],
                'Move parcial com ..u1',
              ),
              tip: 'E se fizermos o inverso: `let u2 = User { name: String::from("Bia"), ..u1 };`? Como demos uma `String` nova para `u2`, o `..u1` só precisou copiar `u1.id` (`u32` é `Copy`). Nesse caso, nada foi movido de `u1` e `u1` continua 100% válido!',
            },
            {
              title: 'Vendo o move parcial acontecer',
              body:
                'Avance pelos passos para ver o estado de cada campo de `u1` antes e depois de `let u2 = User { id: 8, ..u1 };`:',
              visual: memStepper([
                {
                  label: '1. Após criar u1',
                  head: ['Acesso', 'Tipo', 'Estado'],
                  rows: [
                    ['u1.id', 'u32 (Copy)', 'Válido (7)'],
                    ['u1.name', 'String (dona)', 'Válido ("Ana" no heap)'],
                    ['u1 (inteiro)', 'User', 'Válido'],
                  ],
                  info: 'No início, `u1` é dona da `String` `"Ana"` e do inteiro `7`.',
                },
                {
                  label: '2. let u2 = User { id: 8, ..u1 }',
                  head: ['Acesso', 'Tipo', 'Estado'],
                  rows: [
                    ['u1.id', 'u32 (Copy)', 'Válido (7 permanece em u1)'],
                    ['u1.name', 'String (dona)', 'MOVIDO para u2.name!'],
                    ['u1 (inteiro)', 'User', 'Parcialmente movido'],
                  ],
                  highlight: [1],
                  info: '`..u1` transfere a posse de `u1.name` para `u2.name` sem clonar o heap.',
                },
                {
                  label: '3. O que compila depois?',
                  head: ['Expressão após ..u1', 'Compila?', 'Explicação'],
                  rows: [
                    ['println!("{}", u1.id)', 'Sim!', 'u1.id não foi movido'],
                    ['println!("{}", u1.name)', 'Não (E0382)', 'u1.name foi movido para u2'],
                    ['usar u1 inteiro', 'Não (E0382)', 'u1 está incompleto (partial move)'],
                  ],
                  highlight: [0],
                  info: 'O compilador rastreia a posse campo a campo: `u1.id` continua legível, mas `u1.name` e `u1` inteiro são bloqueados.',
                },
              ]),
            },
          ],
          exercises: [
            mcq(
              'Por que o atributo destacado `#[derive(Clone, Copy)]` faz a compilação falhar neste código?',
              [
                'Erro E0204: `Copy` não pode ser implementado porque o campo `label: String` não é `Copy`',
                'Erro E0063: structs com `Copy` precisam ter pelo menos dois campos inteiros',
                'Erro E0277: falta adicionar `#[derive(Debug)]` junto com `Copy`',
                'Erro E0594: `id` precisava ser `i32` em vez de `u32`',
              ],
              0,
              'Uma struct só pode derivar `Copy` se **todos** os seus campos também implementarem `Copy`. Como `String` é dona de um buffer no heap e não implementa `Copy`, o compilador emite o erro `E0204` (*the trait `Copy` cannot be implemented for this type*).',
              {
                visual: code(
                  `#[derive(Clone, Copy)]
struct Tag {
    id: u32,
    label: String,
}`,
                  [1, 4],
                  'String impede Copy',
                ),
              },
            ),
            mcq(
              'Na linha 11 (`let name = u.name;`), o campo `String` é movido para fora de `u`. O que acontece na linha 12 destacada?',
              [
                'Compila e imprime `10 Ana`, pois apenas `u.name` foi movido e `u.id` continua válido',
                'Falha com E0382 porque mover um campo invalida todos os outros campos de `u`',
                'Falha com E0594 porque `u` não foi declarada como `mut`',
                'Imprime `0 Ana` porque `u.id` é zerado no move parcial',
              ],
              0,
              'Isso é o **move parcial**: mover `u.name` invalida `u.name` e o uso de `u` como um todo, mas o compilador sabe que `u.id` (`u32`) permaneceu intacto e permite sua leitura!',
              {
                visual: code(
                  `struct User {
    id: u32,
    name: String,
}

fn main() {
    let u = User {
        id: 10,
        name: String::from("Ana"),
    };
    let name = u.name;
    println!("{} {}", u.id, name);
}`,
                  [11, 12],
                  'Leitura após move parcial',
                ),
              },
            ),
            mcq(
              'Por que a linha destacada falha ao compilar após `let u2 = User { id: 2, ..u1 };`?',
              [
                'Erro E0382: `..u1` moveu a `String` `u1.name` para dentro de `u2`',
                'Erro E0063: faltou inicializar `name` em `u2`',
                'Erro E0596: `u1` precisava ser mutável para usar `..u1`',
                'Erro E0308: `u1.name` mudou de tipo após `..u1`',
              ],
              0,
              'Na atualização `User { id: 2, ..u1 }`, o campo `name: String` não foi redefinido, então sua posse foi **movida** de `u1.name` para `u2.name`. Tentar ler `u1.name` depois causa `E0382` (*borrow of moved value: `u1.name`*).',
              {
                visual: code(
                  `struct User {
    id: u32,
    name: String,
}

fn main() {
    let u1 = User {
        id: 1,
        name: String::from("Leo"),
    };
    let u2 = User { id: 2, ..u1 };
    println!("{} {}", u1.name, u2.id);
}`,
                  [11, 12],
                  'Campo String movido em ..u1',
                ),
              },
            ),
            tf(
              'Se `u1` for um `User { id: u32, name: String }` e criarmos `let u2 = User { name: String::from("Bia"), ..u1 };`, a variável `u1` continua inteiramente válida (inclusive `u1.name`).',
              true,
              'Como fornecemos uma nova `String` para `u2.name`, a sintaxe `..u1` só precisou copiar o campo `u1.id` (que é `u32`, logo `Copy`). Nenhum campo de `u1` foi movido!',
            ),
            fill(
              'Complete a regra do move parcial em structs:',
              'Ao mover um campo String de uma struct u, ocorre um move ___: não podemos passar u inteira para uma função, mas ainda podemos ler seus campos ___ restantes.',
              ['parcial', 'Copy'],
              ['total', 'movidos', 'mutáveis'],
              'O *move parcial* bloqueia o uso da struct inteira e do campo movido, mas preserva o acesso individual aos demais campos que não foram movidos.',
            ),
            codePuzzle(
              'Monte o programa (Exercício 7 do roteiro) que deriva `Clone` e `Copy` para `Point`, copia `p1` para `p2` sem move e imprime a soma de `p1.x` e `p2.x`:',
              [
                '#[derive(Clone, Copy)]\nstruct Point { x: i32, y: i32 }\n\nfn main() {',
                '    let p1 = Point { x: 4, y: 1 };',
                '    let p2 = p1;',
                '    println!("{}", p1.x + p2.x);\n}',
              ],
              [
                '#[derive(Copy)]',
                'struct Point { x: i32, name: String }',
              ],
              'Derivar `Copy` exige que a supertrait `Clone` também esteja implementada (aqui, por `#[derive(Clone, Copy)]`), e como `i32` é `Copy`, `let p2 = p1;` copia o ponto mantendo `p1` válido.',
            ),
            gen((rng) => {
              const code1 = randInt(rng, 10, 40);
              const bonus = randInt(rng, 5, 25);
              return num(
                'Qual número inteiro é impresso na última linha após o move parcial de `b.owner`?',
                code1 + bonus,
                `A linha \`let _who = b.owner;\` move apenas o campo \`String\`, deixando \`b.code\` (${code1}) intacto. A soma \`b.code + ${bonus}\` imprime $${code1} + ${bonus} = ${code1 + bonus}$.`,
                {
                  visual: code(
                    `struct Boxed {
    code: i32,
    owner: String,
}

fn main() {
    let b = Boxed {
        code: ${code1},
        owner: String::from("Ana"),
    };
    let _who = b.owner;
    println!("{}", b.code + ${bonus});
}`,
                    [11, 12],
                    'Campo intacto após move parcial',
                  ),
                },
              );
            }),
            match(
              'Dado `u1: User { id: u32, name: String }`, associe cada operação ao estado resultante de `u1`:',
              [
                ['let s = u1.name;', 'Move parcial: u1.id válido, u1.name movido'],
                ['let s = &u1.name;', 'Empréstimo: u1 continua 100% válido'],
                ['let u2 = User { id: 9, ..u1 };', 'Move parcial: name foi movido para u2'],
                ['let u2 = User { name: novo, ..u1 };', 'Apenas id copiado: u1 continua 100% válido'],
              ],
              'Para não mover um campo `String`, empreste-o com `&u1.name` (ou clone com `u1.name.clone()`), ou forneça uma nova `String` ao usar `..u1`.',
            ),
          ],
        },
        {
          card: [
            {
              title: 'Empréstimos de campos e lifetimes em structs',
              body:
                'Como o *borrow checker* sabe que `p.x` e `p.y` são campos separados, você pode **emprestar campos diferentes ao mesmo tempo** (*split borrow*): por exemplo, criar `&mut p.x` e `&p.y` juntos funciona! Mas atenção: chamar um método `p.metodo()` com `&self` ou `&mut self` empresta a **struct inteira**. Um empréstimo compartilhado de campo pode coexistir com `&self`, mas conflita com `&mut self` (`E0502`); um empréstimo mutável de campo ainda em uso conflita com ambos (`E0502` ou `E0499`). O conflito deixa de existir após o último uso da referência, mesmo antes do fim do escopo.\n\n' +
                'E se quisermos que uma `struct` guarde uma **referência** (`&str` ou `&[i32]`) em vez de ser dona dos dados? O campo exige um **lifetime** explícito, normalmente um parâmetro (`\'a`): `struct Excerpt<\'a> { text: &\'a str }`. Omitir o lifetime da referência causa `E0106`; `&\'static str` também é válido e dispensa parâmetro genérico. Isso impede usar a referência depois que o dado emprestado deixa de ser válido!',
              visual: code(
                `struct Excerpt<'a> {
    text: &'a str,
}

fn main() {
    let msg = String::from("ola mundo");
    let first = &msg[0..3];
    let e = Excerpt { text: first };
    println!("{}", e.text);
}`,
                [1, 2, 8],
                'Struct com lifetime \'a',
              ),
              tip: 'Na dúvida entre guardar `String` ou `&\'a str` numa struct nova, prefira `String`: a struct fica dona dos próprios dados e pode ser movida livremente sem carregar anotações `<\'a>`.',
            },
            {
              title: 'Regras do borrow checker em structs',
              body:
                'Confira na tabela o que o *borrow checker* permite e o que ele bloqueia ao trabalhar com campos e referências:',
              visual: table(
                ['Situação', 'Compila?', 'Motivo'],
                [
                  ['&mut p.x e &mut p.y juntos', 'Sim!', 'Campos disjuntos não se sobrepõem'],
                  ['&p.x vivo + chamada p.mut_method()', 'Não (E0502)', '&mut self empresta a struct p inteira'],
                  ['struct View { s: &str }', 'Não (E0106)', 'O campo precisa de lifetime explícito'],
                  ['fn name(&self) -> &str { &self.name }', 'Sim!', 'Empresta a String como &str sem mover'],
                ],
                [0, 1, 2],
              ),
            },
            {
              title: 'No seu computador 💻',
              body:
                'Hora de consolidar toda a unidade num exercício prático completo!\n\n' +
                '• Rode `cargo new cofre_dados` e edite `src/main.rs`.\n' +
                '• Crie `struct SensorLog { id: u32, label: String, last: i32 }` com:\n' +
                '  - `fn new(id: u32, label: String) -> Self` (iniciando `last: 0`);\n' +
                '  - `fn label(&self) -> &str` (devolvendo `&self.label` sem mover a `String`!);\n' +
                '  - `fn record(&mut self, v: i32)` (atualizando `self.last = v`).\n' +
                '• Crie também `struct View<\'a> { tag: &\'a str, val: i32 }` com `#[derive(Debug)]`, construa um `View` emprestando `log.label()` e imprima `log.id`, `v.tag`, `v.val` e `{:?}`.\n' +
                '• **Critério de pronto:** `cargo run` deve imprimir `#1 Temp=42 -> View { tag: "Temp", val: 42 }` e `cargo clippy -- -D warnings` não deve apontar nenhum aviso.',
              visual: code(
                `#[derive(Debug)]
struct View<'a> {
    tag: &'a str,
    val: i32,
}

struct SensorLog {
    id: u32,
    label: String,
    last: i32,
}

impl SensorLog {
    fn new(
        id: u32,
        label: String,
    ) -> Self {
        Self { id, label, last: 0 }
    }
    fn label(&self) -> &str {
        &self.label
    }
    fn record(&mut self, v: i32) {
        self.last = v;
    }
}

fn main() {
    let mut log = SensorLog::new(
        1, String::from("Temp"),
    );
    log.record(42);
    let v = View {
        tag: log.label(),
        val: log.last,
    };
    println!(
        "#{} {}={} -> {:?}",
        log.id, v.tag, v.val, v
    );
}`,
                [2, 3, 20, 21, 33, 34],
                'src/main.rs',
              ),
            },
          ],
          exercises: [
            mcq(
              'A declaração destacada tenta guardar uma fatia `&str` numa struct sem anotar lifetime. Qual erro o compilador emite?',
              [
                'E0106: missing lifetime specifier (corrigível com `struct Excerpt<\'a> { text: &\'a str }`)',
                'E0063: missing field in initializer',
                'E0594: cannot assign to immutable field `text`',
                'E0204: the trait `Copy` cannot be implemented',
              ],
              0,
              'O campo `text: &str` precisa de um lifetime explícito. Para aceitar texto emprestado por um tempo de vida genérico, declaramos `<\'a>` e usamos `&\'a str`; outra opção, mais restrita, é `&\'static str`, sem parâmetro genérico. Omitir o lifetime da referência gera `E0106` (*missing lifetime specifier*).',
              {
                visual: code(
                  `struct Excerpt {
    text: &str,
}`,
                  [2],
                  'Referência sem lifetime',
                ),
              },
            ),
            mcq(
              'Por que chamar `u.name()` no código abaixo NÃO causa move parcial de `u`?',
              [
                'Porque `name(&self) -> &str` apenas empresta `&self.name` como uma fatia de leitura `&str`',
                'Porque o compilador clona a `String` automaticamente ao retornar `&str`',
                'Porque `String` passa a ser `Copy` dentro de blocos `impl`',
                'Porque `u` foi declarada como imutável',
              ],
              0,
              'Devolver `&str` a partir de `&self.name` empresta uma visão somente-leitura do texto sem transferir a posse da `String`. Assim, `u` permanece 100% válido!',
              {
                visual: code(
                  `struct User {
    name: String,
}

impl User {
    fn name(&self) -> &str {
        &self.name
    }
}

fn main() {
    let u = User {
        name: String::from("Eva"),
    };
    println!(
        "{} {}",
        u.name(),
        u.name()
    );
}`,
                  [6, 7, 15],
                  'Getter que empresta &str',
                ),
              },
            ),
            tf(
              'O borrow checker de Rust permite criar referências mutáveis para dois campos diferentes da mesma struct ao mesmo tempo, como `let rx = &mut p.x; let ry = &mut p.y;`.',
              true,
              'O compilador rastreia empréstimos em nível de campo (*split borrows*): como `p.x` e `p.y` ocupam regiões disjuntas da struct, emprestar ambos mutavelmente ao mesmo tempo é totalmente seguro.',
            ),
            mcq(
              'Mesmo `inc_y` alterando apenas `self.y`, a linha destacada falha ao compilar enquanto `rx` (`&p.x`) está em uso. Qual é o erro e o motivo?',
              [
                'E0502: a assinatura `fn inc_y(&mut self)` pede empréstimo mutável da struct `p` inteira, conflitando com `&p.x`',
                'E0382: `p.x` foi movido ao criar `rx`',
                'E0106: falta anotar um lifetime em `inc_y`',
                'E0596: `rx` precisava ser `&mut p.x`',
              ],
              0,
              'O compilador verifica chamadas de método pela **assinatura**, não pelo corpo: como `inc_y(&mut self)` pede `&mut self`, ela empresta toda a struct `p` de forma exclusiva enquanto `p.x` já está emprestado para leitura em `rx`, disparando `E0502` (*cannot borrow `p` as mutable because it is also borrowed as immutable*).',
              {
                visual: code(
                  `struct Point {
    x: i32,
    y: i32,
}

impl Point {
    fn inc_y(&mut self) {
        self.y += 1;
    }
}

fn main() {
    let mut p = Point { x: 5, y: 1 };
    let rx = &p.x;
    p.inc_y();
    println!("{}", rx);
}`,
                  [7, 14, 15, 16],
                  '&mut self empresta a struct toda',
                ),
              },
            ),
            fill(
              'Complete a definição da struct que guarda uma referência de texto com parâmetro de lifetime:',
              'struct Slice<___> {\n    part: ___ str,\n}',
              ["'a", "&'a"],
              ['T', '&mut', 'Self'],
              'Declaramos o lifetime `<\'a>` após o nome da struct e anotamos a referência como `&\'a str`.',
            ),
            codePuzzle(
              'Monte o programa que faz empréstimos mutáveis simultâneos dos campos disjuntos `p.a` e `p.b`, soma valores aos dois e imprime o total:',
              [
                'struct Pair { a: i32, b: i32 }\n\nfn main() {',
                '    let mut p = Pair { a: 3, b: 4 };',
                '    let ra = &mut p.a;\n    let rb = &mut p.b;',
                '    *ra += 2;\n    *rb += 5;',
                '    println!("{}", p.a + p.b);\n}',
              ],
              [
                '    let p = Pair { a: 3, b: 4 };',
                '    let ra = &mut p.a;\n    let rb = &mut p;',
              ],
              'Como `p.a` e `p.b` são campos distintos de `mut p`, podemos manter `ra = &mut p.a` e `rb = &mut p.b` ativos ao mesmo tempo (ao contrário de `&mut p`, que emprestaria a struct toda).',
            ),
            gen((rng) => {
              const x0 = randInt(rng, 2, 10);
              const y0 = randInt(rng, 2, 10);
              const dx = randInt(rng, 3, 9);
              const dy = randInt(rng, 3, 9);
              return num(
                'Qual número inteiro é impresso ao final após alterar os dois campos emprestados?',
                x0 + dx + y0 + dy,
                `Os empréstimos disjuntos \`rx = &mut p.x\` e \`ry = &mut p.y\` atualizam \`p.x\` para $${x0} + ${dx} = ${x0 + dx}$ e \`p.y\` para $${y0} + ${dy} = ${y0 + dy}$. A soma final é $${(x0 + dx) + (y0 + dy)}$.`,
                {
                  visual: code(
                    `struct Pair {
    x: i32,
    y: i32,
}

fn main() {
    let mut p = Pair {
        x: ${x0},
        y: ${y0},
    };
    let rx = &mut p.x;
    let ry = &mut p.y;
    *rx += ${dx};
    *ry += ${dy};
    println!("{}", p.x + p.y);
}`,
                    [11, 12, 13, 14],
                    'Empréstimo disjunto de campos',
                  ),
                },
              );
            }),
            order(
              'Ordene o ciclo de vida seguro de uma struct `Excerpt<\'a>` que empresta uma fatia de uma `String`:',
              [
                'A String dona do texto é alocada na variável msg',
                'Criamos a fatia &msg[0..3] apontando para msg',
                'Instanciamos Excerpt guardando a referência com lifetime \'a',
                'Usamos Excerpt enquanto msg ainda está em escopo e viva',
              ],
              'A referência dentro de `Excerpt<\'a>` nunca pode viver mais do que a `String` `msg` que é dona dos bytes.',
            ),
          ],
        },
      ],
    },
  ],
};

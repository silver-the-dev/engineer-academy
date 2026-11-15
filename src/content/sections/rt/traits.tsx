import React from 'react';
import type { UnitDef, VisualSpec } from '../../types';
import { code, fill, gen, match, mcq, multi, num, order, table, tf } from '../../helpers';
import { codePuzzle } from '../../codePractice';
import { TableView } from '../../../components/visuals/Misc';
import { randInt } from '../../../lib/random';

const stepTable = (
  head: string[],
  steps: { label?: string; rows: (string | number)[][]; highlight?: number[]; info: string }[],
): VisualSpec => ({
  name: 'stepper',
  props: {
    steps: steps.length,
    labels: steps.map((s, i) => s.label ?? `Passo ${i + 1} de ${steps.length}`),
    render: (k: number, width: number) => (
      <TableView head={head} rows={steps[k].rows} highlight={steps[k].highlight} width={width} />
    ),
    info: (k: number) => steps[k].info,
  },
});

export const rustTraits: UnitDef = {
  id: 'rt-trait',
  title: 'Traits',
  icon: '🧬',
  subtitle: 'Contratos de comportamento, conversões, despacho dinâmico e sobrecarga',
  source: 'The Rust Programming Language (Edição 2024) · Cap. 10.2 e 18 · Desafio 50 Dias (Módulos 3 e 5)',
  extra: true,
  guide: [
    'Em Rust não existe herança de classes: dados vivem em `struct` e `enum`, e contratos de comportamento vivem em **traits**.',
    '• **Contrato (`trait` e `impl Trait for Tipo`)**: declara assinaturas obrigatórias e pode fornecer métodos com corpo padrão. Omitir um método obrigatório gera o erro `E0046`.',
    '• **Polimorfismo estático (`impl Trait`)**: em parâmetros (`fn f(x: &impl Trait)`), o compilador gera código especializado para cada tipo concreto (**monomorfização**); no retorno (`-> impl Trait`), todos os ramos da função precisam devolver **um único tipo concreto** (`E0308`).',
    '• **Traits da biblioteca padrão**: `#[derive(...)]` pode gerar `Debug` (`{:?}`), `Clone` (`.clone()`), `Copy` (cópia implícita dos bytes; falha com `E0204` se houver `String` ou `Vec`), `PartialEq`, `Eq`, `PartialOrd`, `Ord`, `Default` e `Hash`, respeitando os requisitos de cada trait para os campos. A biblioteca padrão não oferece `derive(Display)` para `{}`.',
    '• **Regra do órfão**: a trait deve ser local, ou o tipo que recebe a implementação ou um argumento de tipo da trait deve ser local, respeitando as restrições sobre parâmetros genéricos. Implementar uma trait externa para um tipo externo como `Display for Vec<i32>` gera `E0117`.',
    '• **Conversões (`From`, `Into`, `TryFrom`)**: implemente `From<A> for B` para conversões infalíveis e ganhe `Into<B> for A` gratuitamente; use `TryFrom<A> for B` (que devolve `Result<Self, Self::Error>`) quando a conversão validar dados.',
    '• **Trait objects (`&dyn Trait`, `Box<dyn Trait>`)**: usam um **ponteiro gordo** (endereço do dado + endereço da `vtable`) para despacho dinâmico, permitindo listas heterogêneas como `Vec<Box<dyn Trait>>`. Exigem compatibilidade com `dyn` (`E0038`): métodos que retornam `Self` ou têm parâmetros de tipo devem ficar restritos a `Self: Sized`; a trait em si não pode exigir `Sized`.',
    '• **Operadores e tipos associados**: `a + b` chama `std::ops::Add::add` (`type Output`), e `Iterator` define `type Item` + `fn next(&mut self) -> Option<Self::Item>`, habilitando `map`, `filter`, `take` e `sum`.',
  ].join('\n'),
  lessons: [
    {
      id: 'rt-trait-def',
      title: 'Definir e implementar traits',
      parts: [
        {
          card: [
            {
              title: 'Contratos com trait e impl',
              body: [
                'Em C, para tratar tipos diferentes de forma genérica, você precisava passar ponteiros de função manualmente. Em Rust, uma **`trait`** declara um contrato: o conjunto de assinaturas de métodos que um tipo promete oferecer.',
                'Os dados continuam na `struct` (ou `enum`), enquanto o cumprimento do contrato fica num bloco separado `impl NomeTrait for Tipo`. Se faltar qualquer método sem corpo padrão, o compilador recusa o programa com o erro `E0046`.',
              ].join('\n\n'),
              visual: code(
                `trait Taxable {
    fn tax(&self) -> i32;
}

struct Product { price: i32 }

impl Taxable for Product {
    fn tax(&self) -> i32 {
        self.price / 10
    }
}

fn main() {
    let p = Product { price: 250 };
    println!("Imposto: {}", p.tax());
}`,
                [1, 2, 7, 8],
                'taxable.rs',
              ),
              tip: 'Diferente de linguagens com classes, o bloco `impl Trait for Tipo` fica fora da declaração da `struct`.',
            },
            {
              title: 'Execução passo a passo',
              body: 'Acompanhe no painel abaixo como a instância na pilha é emprestada como `&self` quando chamamos `p.tax()`.',
              visual: stepTable(
                ['Etapa', 'Pilha (Stack)', 'Resultado'],
                [
                  {
                    label: 'Passo 1: Criar struct',
                    rows: [
                      ['p.price', '250', '—'],
                      ['&self', '—', '—'],
                    ],
                    highlight: [0],
                    info: '`let p = Product { price: 250 };` grava o campo `price` na pilha.',
                  },
                  {
                    label: 'Passo 2: Emprestar &self',
                    rows: [
                      ['p.price', '250', '—'],
                      ['self (&Product)', '-> p', 'lê 250'],
                    ],
                    highlight: [1],
                    info: 'Na chamada `p.tax()`, o Rust passa `&p` automaticamente para o parâmetro `&self`.',
                  },
                  {
                    label: 'Passo 3: Retorno',
                    rows: [
                      ['p.price', '250 (válido)', '—'],
                      ['p.tax()', '250 / 10', '25'],
                    ],
                    highlight: [1],
                    info: '`self.price / 10` devolve `25` e `p` continua válido porque foi apenas emprestado.',
                  },
                ],
              ),
            },
          ],
          exercises: [
            mcq(
              'No trecho abaixo, qual construção declara que `Temp` passa a cumprir o contrato da trait `Sensor`?',
              ['impl Sensor for Temp', 'trait Sensor', 'struct Temp', 'fn read(&self)'],
              0,
              'A sintaxe `impl Trait for Tipo` implementa os métodos exigidos pela trait `Sensor` para o tipo `Temp`.',
              {
                visual: code(
                  `trait Sensor {
    fn read(&self) -> i32;
}
struct Temp { val: i32 }

impl Sensor for Temp {
    fn read(&self) -> i32 { self.val }
}`,
                  [6],
                  'sensor.rs',
                ),
              },
            ),
            num(
              'Qual número inteiro é impresso na saída ao executar `main`?',
              42,
              'O método `apply` multiplica `self.val` (`14`) por `3`, retornando `14 * 3 = 42`.',
              {
                visual: code(
                  `trait Gain {
    fn apply(&self) -> i32;
}
struct Amp { val: i32 }
impl Gain for Amp {
    fn apply(&self) -> i32 {
        self.val * 3
    }
}
fn main() {
    let a = Amp { val: 14 };
    println!("{}", a.apply());
}`,
                  [6, 7, 12],
                  'gain.rs',
                ),
              },
            ),
            tf(
              'Em Rust, a implementação `impl MinhaTrait for MeuTipo` precisa ser escrita dentro das chaves de `struct MeuTipo { ... }`.',
              false,
              'Em Rust, `struct` declara apenas os campos de dados. Métodos próprios e implementações de traits ficam em blocos `impl` separados.',
            ),
            fill(
              'Complete o cabeçalho para implementar a trait `Meter` no tipo `Volt`:',
              'impl ___ for ___ {',
              ['Meter', 'Volt'],
              ['trait', 'struct', 'Self'],
              'Na forma `impl Trait for Tipo`, o nome da trait vem antes de `for` e o tipo concreto vem depois.',
            ),
            mcq(
              'Por que o código abaixo falha ao compilar?',
              [
                'Erro E0046: falta implementar o método obrigatório stop no bloco impl.',
                'Erro E0382: a variável f foi movida duas vezes.',
                'Uma trait não pode declarar mais de um método.',
                'O método rpm não pode retornar u32.',
              ],
              0,
              'A trait `Motor` exige dois métodos sem corpo padrão (`rpm` e `stop`). Como `impl Motor for Fan` só definiu `rpm`, o compilador emite `error[E0046]: not all trait items implemented, missing: \'stop\'`.',
              {
                visual: code(
                  `trait Motor {
    fn rpm(&self) -> u32;
    fn stop(&mut self);
}
struct Fan { speed: u32 }

impl Motor for Fan {
    fn rpm(&self) -> u32 {
        self.speed
    }
}`,
                  [3, 7],
                  'erro_e0046.rs',
                ),
              },
            ),
            match(
              'Associe o primeiro parâmetro de um método de trait ao seu efeito sobre a instância:',
              [
                ['&self', 'Empresta a instância apenas para leitura'],
                ['&mut self', 'Empresta a instância permitindo alterá-la'],
                ['self', 'Consome a instância, tomando posse dela'],
                ['Sem self', 'Função associada chamada com Tipo::func()'],
              ],
              'O receptor define a regra de ownership da chamada: leitura (`&self`), mutação (`&mut self`), consumo (`self`) ou função associada ao tipo.',
            ),
            codePuzzle(
              'Monte a declaração da trait `Area` e sua implementação para `Square`:',
              [
                'trait Area { fn calc(&self) -> i32; }\nstruct Square { side: i32 }\nimpl Area for Square {',
                '    fn calc(&self) -> i32 {',
                '        self.side * self.side',
                '    } }',
              ],
              [
                'impl Square for Area {',
                '    fn calc(self) -> i32;',
              ],
              'Primeiro declaramos a `trait Area` e a `struct Square`; depois abrimos `impl Area for Square` e fornecemos o corpo de `calc(&self) -> i32`.',
            ),
            gen((rng) => {
              const p = randInt(rng, 2, 9) * 10;
              const r = randInt(rng, 2, 5);
              const ans = (p * r) / 10;
              return num(
                'Qual valor inteiro o programa abaixo imprime?',
                ans,
                `O método \`tax\` calcula \`${p} * ${r} / 10 = ${ans}\`.`,
                {
                  visual: code(
                    `trait Taxable {
    fn tax(&self) -> i32;
}
struct Service { price: i32 }
impl Taxable for Service {
    fn tax(&self) -> i32 {
        self.price * ${r} / 10
    }
}
fn main() {
    let s = Service { price: ${p} };
    println!("{}", s.tax());
}`,
                    [6, 7, 11],
                    'service_tax.rs',
                  ),
                },
              );
            }),
          ],
        },
        {
          card: [
            {
              title: 'Métodos padrão e impl Trait',
              body: [
                'Uma trait pode fornecer um **corpo padrão** para um método. Esse método padrão pode inclusive chamar outros métodos da própria trait (mesmo aqueles que não têm corpo padrão!). Quem implementa a trait escolhe entre herdar o comportamento padrão ou sobrescrevê-lo.',
                'Para escrever funções que aceitam ou devolvem qualquer tipo que implemente uma trait, usamos **`impl Trait`**. No parâmetro (`b: &impl Bill`), qualquer tipo que implemente `Bill` é aceito com despacho estático; no retorno (`-> impl Bill`), a função esconde o tipo concreto, mas **todos os ramos** precisam devolver o mesmo tipo concreto.',
              ].join('\n\n'),
              visual: code(
                `trait Bill {
    fn base(&self) -> i32;
    fn total(&self) -> i32 {
        self.base() + 10
    }
}

struct Plan { val: i32 }
impl Bill for Plan {
    fn base(&self) -> i32 { self.val }
}

fn charge(b: &impl Bill) -> i32 {
    b.total()
}`,
                [3, 4, 13],
                'default_impl.rs',
              ),
            },
            {
              title: 'Resumo de impl Trait',
              body: 'Compare onde `impl Trait` pode aparecer na assinatura de uma função e qual regra o compilador aplica em cada posição.',
              visual: table(
                ['Posição', 'Exemplo', 'Regra do compilador'],
                [
                  ['Parâmetro', 'fn f(x: &impl Bill)', 'Aceita qualquer tipo que implemente Bill (açúcar para genérico)'],
                  ['Retorno único', 'fn g() -> impl Bill', 'O chamador só vê a trait, mas o corpo retorna 1 tipo concreto'],
                  ['Retorno misto', 'if ok { Plan } else { Vip }', 'Não compila com -> impl Bill (erro E0308: tipos diferentes)'],
                ],
                [2],
              ),
            },
            {
              title: 'No seu computador',
              body: [
                'Hora de praticar o **Exercício 18 (Traits)** do roteiro no Cargo:',
                '• Rode `cargo new tributos` e abra `src/main.rs`.',
                '• Crie `trait Taxable` com um método obrigatório `fn tax(&self) -> f64;` e um método padrão `fn summary(&self) -> f64 { self.tax() + 5.0 }`.',
                '• Implemente `Taxable` para `struct Product { price: f64 }` (imposto de 10%: `self.price * 0.10`) e para `struct Service { price: f64 }` (imposto de 15%: `self.price * 0.15`).',
                '• Escreva `fn print_tax(item: &impl Taxable)` e chame-a no `main` para um `Product` de `100.0` e um `Service` de `200.0`.',
                '• **Critério de pronto**: `cargo run` exibe `10` e `30` para os impostos (e `15` e `35` em `summary`), e `cargo clippy -- -D warnings` termina sem nenhum aviso.',
              ].join('\n'),
              visual: code(
                `trait Taxable {
    fn tax(&self) -> f64;
    fn summary(&self) -> f64 {
        self.tax() + 5.0
    }
}
struct Product { price: f64 }
struct Service { price: f64 }

fn print_tax(item: &impl Taxable) {
    println!("{}", item.tax());
    println!("{}", item.summary());
}`,
                [1, 2, 3, 11, 12, 13],
                'src/main.rs',
              ),
            },
          ],
          exercises: [
            tf(
              'Um método com implementação padrão dentro de uma `trait` pode chamar outro método da mesma `trait` que não possui corpo padrão.',
              true,
              'Como todo tipo que implementar a trait será obrigado a definir os métodos sem corpo padrão, o método padrão pode chamá-los com segurança através de `self`.',
            ),
            num(
              'Qual número é impresso por `main` quando `Ticket` usa a implementação padrão de `total`?',
              45,
              '`Ticket` define `base(&self)` retornando `40` e herda o método padrão `total(&self)`, que calcula `self.base() + 5 = 45`.',
              {
                visual: code(
                  `trait Price {
    fn base(&self) -> i32;
    fn total(&self) -> i32 {
        self.base() + 5
    }
}
struct Ticket { v: i32 }
impl Price for Ticket {
    fn base(&self) -> i32 { self.v }
}
fn main() {
    let t = Ticket { v: 40 };
    println!("{}", t.total());
}`,
                  [3, 4, 9, 13],
                  'ticket.rs',
                ),
              },
            ),
            num(
              'E se o tipo sobrescrever o método padrão no seu bloco `impl`? Qual valor `main` imprime agora?',
              35,
              'Como `Vip` forneceu sua própria versão de `total(&self)`, ela substitui o padrão da trait e retorna `40 - 5 = 35`.',
              {
                visual: code(
                  `trait Price {
    fn base(&self) -> i32;
    fn total(&self) -> i32 {
        self.base() + 5
    }
}
struct Vip { v: i32 }
impl Price for Vip {
    fn base(&self) -> i32 { self.v }
    fn total(&self) -> i32 {
        self.base() - 5
    }
}
fn main() {
    let v = Vip { v: 40 };
    println!("{}", v.total());
}`,
                  [10, 11],
                  'vip.rs',
                ),
              },
            ),
            mcq(
              'Na assinatura `fn notify(item: &impl Summary)`, o que `&impl Summary` representa?',
              [
                'Qualquer referência a um tipo concreto que implemente Summary, resolvida em compilação.',
                'Uma alocação obrigatória no heap com tabela virtual.',
                'Uma nova struct chamada Summary criada dentro da função.',
                'Um ponteiro nulo caso o tipo não implemente Summary.',
              ],
              0,
              '`item: &impl Summary` é açúcar sintático para um parâmetro genérico `fn notify<T: Summary>(item: &T)`. O compilador resolve o tipo em tempo de compilação.',
            ),
            mcq(
              'Por que a função `pick` destacada abaixo não compila?',
              [
                'Erro E0308: -> impl Bill exige que todos os ramos retornem o mesmo tipo concreto.',
                'Erro E0046: falta implementar um método na trait Bill.',
                'Não é permitido usar if/else em funções que retornam structs.',
                'O tipo bool não pode ser parâmetro de função em Rust.',
              ],
              0,
              'Embora `Plan` e `Extra` implementem `Bill`, são structs concretas diferentes. O compilador emite `error[E0308]: \'if\' and \'else\' have incompatible types`, pois `-> impl Trait` precisa de um único tipo concreto no retorno.',
              {
                visual: code(
                  `trait Bill { fn val(&self) -> i32; }
struct Plan;
struct Extra;
impl Bill for Plan {
    fn val(&self) -> i32 { 10 }
}
impl Bill for Extra {
    fn val(&self) -> i32 { 20 }
}
fn pick(ok: bool) -> impl Bill {
    if ok { Plan } else { Extra }
}`,
                  [10, 11],
                  'erro_e0308.rs',
                ),
              },
            ),
            order(
              'Ordene as linhas para definir uma função que recebe qualquer tipo que implemente `Metric` por referência e devolve o dobro de `read()`:',
              [
                'fn double_read(m: &impl Metric) -> i32 {',
                '    let v = m.read();',
                '    v * 2',
                '}',
              ],
              'A assinatura recebe `m: &impl Metric` e declara retorno `-> i32`; o corpo lê `m.read()` e devolve `v * 2` como expressão final sem ponto e vírgula.',
            ),
            codePuzzle(
              'Monte a trait `Score` com método padrão `bonus` e a função `eval` que recebe `&impl Score`:',
              [
                'trait Score {\n    fn points(&self) -> i32;\n    fn bonus(&self) -> i32 {',
                '        self.points() + 10',
                '    } }\nfn eval(s: &impl Score) -> i32 {',
                '    s.bonus() }',
              ],
              [
                'fn eval(s: impl &Score) -> i32 {',
                '    fn bonus(&self) -> i32;',
              ],
              'O método padrão `bonus` usa `self.points() + 10` dentro da trait, e `eval` recebe `s: &impl Score` para chamar `s.bonus()`.',
            ),
            gen((rng) => {
              const base = randInt(rng, 10, 30);
              const fee = randInt(rng, 2, 9);
              const ans = (base + fee) * 2;
              return num(
                'Qual número o programa abaixo imprime?',
                ans,
                `O método padrão \`total\` soma \`${base} + ${fee} = ${base + fee}\`, e \`checkout\` multiplica por 2: \`${ans}\`.`,
                {
                  visual: code(
                    `trait Shipping {
    fn cost(&self) -> i32;
    fn total(&self) -> i32 {
        self.cost() + ${fee}
    }
}
struct BoxItem { c: i32 }
impl Shipping for BoxItem {
    fn cost(&self) -> i32 { self.c }
}
fn checkout(x: &impl Shipping) -> i32 {
    x.total() * 2
}
fn main() {
    let b = BoxItem { c: ${base} };
    println!("{}", checkout(&b));
}`,
                    [3, 4, 11, 12],
                    'shipping.rs',
                  ),
                },
              );
            }),
          ],
        },
      ],
    },
    {
      id: 'rt-trait-padrao',
      title: 'Traits da biblioteca padrão',
      parts: [
        {
          card: [
            {
              title: 'Derive, Debug, Display, Clone e Copy',
              body: [
                'O atributo **`#[derive(...)]`** pede ao compilador que gere implementações automáticas de traits comuns da biblioteca padrão. Com `#[derive(Debug)]`, você inspeciona uma struct com `{:?}` em `println!`, desde que seus campos também implementem `Debug`.',
                'Já **`std::fmt::Display`** define a formatação para o usuário final com `{}` (o equivalente ao `toString()`). Ela **nunca** pode ser derivada na biblioteca padrão: você a implementa manualmente usando `write!(f, ...)`.',
                'Para cópias, **`Clone`** cria duplicatas explícitas com `.clone()` (podendo copiar dados no heap), enquanto **`Copy`** permite copiar os bytes automaticamente ao atribuir, sem invalidar a origem, independentemente de onde o valor está armazenado. Tipos donos de heap como `String` e `Vec<T>` não implementam `Copy` — tentar derivar `Copy` em uma struct que os contenha gera o erro `E0204`.',
              ].join('\n\n'),
              visual: code(
                `use std::fmt;

#[derive(Debug, Clone, Copy)]
struct Point { x: i32, y: i32 }

impl fmt::Display for Point {
    fn fmt(
        &self,
        f: &mut fmt::Formatter<'_>,
    ) -> fmt::Result {
        write!(
            f,
            "({}, {})",
            self.x,
            self.y,
        )
    }
}`,
                [3, 6, 11, 12],
                'point_fmt.rs',
              ),
            },
            {
              title: 'Copy na pilha vs Clone no heap',
              body: 'Use os botões abaixo para comparar o que acontece na memória com um tipo `Copy`, com um move padrão e com `.clone()`.',
              visual: stepTable(
                ['Expressão', 'Variável original', 'Memória'],
                [
                  {
                    label: '1. Tipo Copy (Point)',
                    rows: [
                      ['let p1 = Point { x: 2, y: 5 };', 'p1 válido', 'Pilha: (2, 5)'],
                      ['let p2 = p1;', 'p1 continua válido!', 'Pilha: p1(2,5) e p2(2,5)'],
                    ],
                    highlight: [1],
                    info: 'Como `i32` é `Copy` e `Point` derivou `Clone, Copy`, atribuir copia os bytes na pilha sem invalidar `p1`.',
                  },
                  {
                    label: '2. Move (String sem Copy)',
                    rows: [
                      ['let s1 = String::from("Oi");', 's1 válido', 'Heap: buffer "Oi"'],
                      ['let s2 = s1;', 's1 movido (uso posterior: E0382)', 's2 assume o buffer'],
                    ],
                    highlight: [1],
                    info: '`String` guarda ponteiro para o heap e não é `Copy`: `let s2 = s1;` move a posse para `s2`.',
                  },
                  {
                    label: '3. Clone explícito (.clone())',
                    rows: [
                      ['let s1 = String::from("Oi");', 's1 válido', 'Heap #1: "Oi"'],
                      ['let s2 = s1.clone();', 's1 e s2 válidos!', 'Heap #1 e Heap #2'],
                    ],
                    highlight: [1],
                    info: 'Chamar `.clone()` aloca um segundo buffer no heap, deixando `s1` e `s2` independentes.',
                  },
                ],
              ),
            },
          ],
          exercises: [
            mcq(
              'Qual marcador de formatação em `println!` utiliza a trait `Debug`?',
              ['{:?}', '{}', '%d', '{:f}'],
              0,
              'O marcador `{:?}` (ou `{:#?}` em múltiplas linhas) usa `std::fmt::Debug`, enquanto `{}` exige `std::fmt::Display`.',
            ),
            tf(
              'A trait `std::fmt::Display` pode ser gerada automaticamente com `#[derive(Display)]` usando apenas a biblioteca padrão.',
              false,
              'A biblioteca padrão não oferece `derive(Display)` porque não há uma única forma universal de exibir um tipo para o usuário final; implemente `fmt::Display` à mão.',
            ),
            mcq(
              'O que acontece ao compilar o código abaixo?',
              [
                'Erro E0204: Copy não pode ser implementado para User porque String não é Copy.',
                'Compila e faz cópia profunda da String automaticamente.',
                'Erro E0046: falta implementar o método copy manualmente.',
                'Compila, mas apaga o campo name em tempo de execução.',
              ],
              0,
              'Uma struct só pode derivar `Copy` se todos os seus campos também forem `Copy`. Como `String` aloca no heap e não implementa `Copy`, o compilador recusa com `error[E0204]: the trait \'Copy\' cannot be implemented for this type`.',
              {
                visual: code(
                  `#[derive(Clone, Copy)]
struct User {
    name: String,
    age: u8,
}`,
                  [1, 3],
                  'erro_e0204.rs',
                ),
              },
            ),
            mcq(
              'Qual é a saída impressa pelo programa abaixo?',
              ['3:7 e 3:7', '3:7 e erro E0382', 'Pair(3, 7)', '10'],
              0,
              'Como `Pair` implementa `Copy`, `let p2 = p1;` copia o valor na pilha sem invalidar `p1`. O `Display` formata cada par como `3:7`.',
              {
                visual: code(
                  `use std::fmt;
#[derive(Clone, Copy)]
struct Pair { a: i32, b: i32 }
impl fmt::Display for Pair {
    fn fmt(
        &self,
        f: &mut fmt::Formatter<'_>,
    ) -> fmt::Result {
        write!(
            f, "{}:{}", self.a, self.b
        )
    }
}
fn main() {
    let p1 = Pair { a: 3, b: 7 };
    let p2 = p1;
    println!("{} e {}", p1, p2);
}`,
                  [2, 9, 10, 16, 17],
                  'pair_display.rs',
                ),
              },
            ),
            fill(
              'Complete a implementação manual de `Display` para `Tag`:',
              'impl fmt::___ for Tag {\n    fn fmt(&self, f: &mut fmt::Formatter<\'_>) -> fmt::Result {\n        ___!(f, "ID-{}", self.id)\n    }\n}',
              ['Display', 'write'],
              ['Debug', 'println', 'format'],
              'Implementamos `fmt::Display` e escrevemos no `Formatter` usando a macro `write!(f, ...)` sem ponto e vírgula para retornar o `fmt::Result`.',
            ),
            multi(
              'Quais das traits abaixo podem ser derivadas com `#[derive(...)]` para `struct Point { x: i32, y: i32 }` usando apenas a biblioteca padrão?',
              ['Debug', 'Clone', 'Copy', 'Display'],
              [0, 1, 2],
              '`Debug`, `Clone` e `Copy` podem ser derivadas automaticamente porque `i32` implementa as três. `Display` exige implementação manual.',
            ),
            codePuzzle(
              'Monte o programa em que `Sensor` deriva `Debug`, `Clone` e `Copy`, permitindo usar `a` e `b` após `let b = a;`:',
              [
                '#[derive(Debug, Clone, Copy)]\nstruct Sensor { id: u8, val: i32 }\nfn main() {',
                '    let a = Sensor { id: 1, val: 50 };',
                '    let b = a;',
                '    println!("{} {}", a.val, b.val);',
                '}',
              ],
              [
                '#[derive(Display, Copy)]',
                '    let b = a.copy();',
              ],
              '`#[derive(Debug, Clone, Copy)]` habilita a cópia implícita na atribuição `let b = a;`, mantendo `a` válido na linha do `println!`.',
            ),
            gen((rng) => {
              const a = randInt(rng, 2, 9);
              const b = randInt(rng, 2, 9);
              const ans = 2 * a + b;
              return num(
                'Qual número o programa abaixo imprime?',
                ans,
                `Como \`Counter\` é \`Copy\`, \`c2\` guarda uma cópia independente com \`v = ${a}\`. Depois \`c1.v\` passa a \`${a} + ${b} = ${a + b}\`. A soma é \`${a + b} + ${a} = ${ans}\`.`,
                {
                  visual: code(
                    `#[derive(Clone, Copy)]
struct Counter { v: i32 }

fn main() {
    let mut c1 = Counter { v: ${a} };
    let c2 = c1;
    c1.v += ${b};
    println!("{}", c1.v + c2.v);
}`,
                    [1, 6, 7, 8],
                    'copy_counter.rs',
                  ),
                },
              );
            }),
          ],
        },
        {
          card: [
            {
              title: 'Igualdade, ordem, Hash e regra do órfão',
              body: [
                '• **`PartialEq` e `Eq`**: `PartialEq` habilita os operadores de igualdade e diferença. Quando derivada, compara todos os campos. `Eq` é uma trait marcadora cujo contrato exige uma relação de equivalência, incluindo reflexividade (todo valor é igual a si mesmo); o compilador não prova essa propriedade. `f64` implementa `PartialEq`, mas **não** `Eq`, porque `f64::NAN` não é igual a `f64::NAN`.',
                '• **`PartialOrd`, `Ord` e `Default`**: `PartialOrd` habilita `<`, `<=`, `>` e `>=`; `Default` fornece `T::default()` (zeros, coleções vazias ou um padrão seu).',
                '• **`Hash`**: exigida junto com `Eq` nas chaves de `HashSet` e `HashMap`. Valores iguais por `PartialEq` **devem** produzir o mesmo hash. Se a igualdade de `User` compara só `cpf`, usar apenas `cpf` em `Hash` atende ao contrato; incluir `name` pode violá-lo.',
                '• **Regra do órfão**: a trait deve ser local, ou o tipo que recebe a implementação ou um argumento de tipo da trait deve ser local, respeitando as restrições sobre parâmetros genéricos. `Display for Vec<i32>` viola a regra (`E0117`).',
              ].join('\n\n'),
              visual: code(
                `use std::hash::{Hash, Hasher};

#[derive(Eq)]
struct User { cpf: u64, name: String }

impl PartialEq for User {
    fn eq(&self, other: &Self) -> bool {
        self.cpf == other.cpf
    }
}
impl Hash for User {
    fn hash<H: Hasher>(
        &self,
        s: &mut H,
    ) {
        self.cpf.hash(s);
    }
}`,
                [6, 8, 11, 16],
                'user_hash.rs',
              ),
            },
            {
              title: 'Mapa das traits da biblioteca padrão',
              body: 'Consulte na tabela o papel de cada trait e o cuidado essencial ao derivar ou implementar à mão.',
              visual: table(
                ['Trait', 'Papel', 'Regra importante'],
                [
                  ['PartialEq / Eq', 'Igualdade entre valores', 'f64 é PartialEq, mas não Eq (por causa de NaN)'],
                  ['PartialOrd / Ord', 'Comparação de ordem (<, >)', 'sort() em Vec exige Ord; f64 exige sort_by'],
                  ['Default', 'Valor inicial T::default()', 'Números dão 0, bool dá false, String dá ""'],
                  ['Hash', 'Chave de HashSet / HashMap', 'Valores iguais por PartialEq devem gerar o mesmo hash'],
                  ['Regra do órfão', 'Coerência entre crates', 'Exige trait local ou tipo local na implementação, com restrições para genéricos'],
                ],
                [0, 3, 4],
              ),
            },
            {
              title: 'No seu computador',
              body: [
                'Pratique os **Exercícios 19 e 31** do roteiro (`Display`, `PartialEq`, `Eq` e `Hash`):',
                '• Crie `cargo new cadastro_hash` e defina `struct Person { cpf: String, name: String }`.',
                '• Implemente `std::fmt::Display` para imprimir `"Nome (CPF)"`.',
                '• Implemente `PartialEq`, `Eq` e `Hash` à mão para `Person` levando em conta **apenas o campo `cpf`**.',
                '• No `main`, insira duas instâncias de `Person` com o mesmo `cpf` (`"11122233344"`) e nomes diferentes num `std::collections::HashSet<Person>` e imprima `set.len()`.',
                '• **Critério de pronto**: `cargo run` imprime `1` (pois o segundo cadastro tem o mesmo CPF) e `cargo clippy -- -D warnings` passa sem avisos.',
              ].join('\n'),
              visual: code(
                `use std::collections::HashSet;
use std::hash::{Hash, Hasher};

struct Person { cpf: String, name: String }
impl std::fmt::Display for Person {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{} ({})", self.name, self.cpf)
    }
}
impl PartialEq for Person {
    fn eq(&self, other: &Self) -> bool {
        self.cpf == other.cpf
    }
}
impl Eq for Person {}
impl Hash for Person {
    fn hash<H: Hasher>(&self, s: &mut H) {
        self.cpf.hash(s);
    }
}

fn main() {
    let mut s = HashSet::new();
    s.insert(Person { cpf: "11122233344".into(), name: "Ana".into() });
    s.insert(Person { cpf: "11122233344".into(), name: "Bia".into() });
    println!("{}", s.len());
}`,
                [24, 25, 26],
                'src/main.rs',
              ),
            },
          ],
          exercises: [
            mcq(
              'Por que o tipo de ponto flutuante `f64` implementa `PartialEq` e `PartialOrd`, mas **não** implementa `Eq` nem `Ord`?',
              [
                'Porque o valor IEEE 754 NaN não é igual nem comparável a si mesmo.',
                'Porque f64 ocupa 8 bytes e Eq só aceita tipos de até 4 bytes.',
                'Porque números decimais ficam armazenados no heap em Rust.',
                'Porque PartialEq só funciona para referências e não para valores.',
              ],
              0,
              'Pelo padrão IEEE 754, comparar `f64::NAN` consigo mesmo resulta em `false`. Como `Eq` exige reflexividade (todo valor igual a si mesmo), `f64` só pode implementar `PartialEq`.',
            ),
            tf(
              'Quando usamos `#[derive(PartialEq)]` em uma struct, a implementação gerada compara todos os campos da struct.',
              true,
              'O `derive(PartialEq)` verifica se cada campo da primeira instância é igual ao campo correspondente da segunda.',
            ),
            num(
              'Qual número inteiro é impresso pelo programa abaixo ao usar `Default::default()`?',
              0,
              'O `#[derive(Default)]` inicializa cada campo com o seu próprio `default()`: para `i32`, o padrão é `0`. Assim, `0 + 0 = 0`.',
              {
                visual: code(
                  `#[derive(Default)]
struct Config {
    retries: i32,
    port: i32,
}
fn main() {
    let c = Config::default();
    println!("{}", c.retries + c.port);
}`,
                  [1, 7],
                  'default_cfg.rs',
                ),
              },
            ),
            mcq(
              'Um programador tenta compilar o trecho abaixo na sua própria crate. Qual erro o compilador aponta?',
              [
                'Erro E0117 (regra do órfão): nem Display nem Vec foram definidos na crate atual.',
                'Erro E0204: Vec<i32> não pode ser copiado.',
                'Erro E0038: Display não pode ser usada com genéricos.',
                'Nenhum erro: qualquer crate pode implementar Display para Vec<i32>.',
              ],
              0,
              'A regra do órfão impede implementar uma trait externa (`std::fmt::Display`) para um tipo externo (`Vec<i32>`): `error[E0117]: only traits defined in the current crate can be implemented for arbitrary types`. Para contornar, embrulhe o vetor numa struct local (`struct MeuVec(Vec<i32>);`).',
              {
                visual: code(
                  `use std::fmt;

impl fmt::Display for Vec<i32> {
    fn fmt(
        &self,
        f: &mut fmt::Formatter<'_>,
    ) -> fmt::Result {
        write!(f, "tam {}", self.len())
    }
}`,
                  [3],
                  'erro_e0117.rs',
                ),
              },
            ),
            match(
              'Associe cada trait da biblioteca padrão à sua finalidade:',
              [
                ['Default', 'Construir um valor padrão inicial com T::default()'],
                ['Eq', 'Declarar que a igualdade é uma relação de equivalência, inclusive reflexiva'],
                ['Hash', 'Alimentar o Hasher para chaves de HashSet e HashMap'],
                ['PartialOrd', 'Comparar valores com operadores de ordem (<, >)'],
              ],
              'Cada trait habilita uma capacidade específica verificada pelo compilador nos tipos genéricos e coleções.',
            ),
            mcq(
              'Você implementou `PartialEq` à mão para `Person` comparando apenas o campo `cpf`, mas manteve `#[derive(Hash)]` (que inclui `cpf` e `name` no hash). O que acontece num `HashSet<Person>`?',
              [
                'Pode violar o contrato de Hash: pessoas iguais por cpf podem ter hashes diferentes, e a detecção de duplicatas deixa de ser garantida.',
                'O compilador ignora automaticamente o campo name dentro do derive(Hash).',
                'O programa funciona normalmente porque HashSet não usa PartialEq.',
                'O HashSet ordena as pessoas em ordem alfabética pelo nome.',
              ],
              0,
              'O contrato de `Hash` exige que valores iguais por `PartialEq` produzam **obrigatoriamente** o mesmo hash. Usar só `cpf` atende ao contrato. Incluir nomes diferentes pode gerar hashes diferentes (colisões também são possíveis), violando essa garantia.',
            ),
            codePuzzle(
              'Monte a implementação manual de `PartialEq` para `Badge` que compara apenas o campo `id`:',
              [
                'struct Badge { id: u32, tag: String }\nimpl PartialEq for Badge {\n    fn eq(&self, other: &Self) -> bool {',
                '        self.id == other.id',
                '    } }',
              ],
              [
                '    fn eq(self, other: Self) -> bool {',
                '        self.id == other.tag',
              ],
              '`PartialEq::eq` recebe `&self` e `other: &Self` por referência e devolve `bool`. Comparar apenas o campo `id` ignora diferenças em `tag`.',
            ),
            gen((rng) => {
              const id = randInt(rng, 10, 50);
              const v1 = randInt(rng, 2, 9);
              const v2 = randInt(rng, 11, 25);
              const ans = v1 + v2;
              return num(
                'Qual número o programa abaixo imprime?',
                ans,
                `Como \`PartialEq\` compara apenas \`id\` e ambos têm \`id = ${id}\`, \`a.eq(&b)\` é verdadeiro e o programa imprime \`${v1} + ${v2} = ${ans}\`.`,
                {
                  visual: code(
                    `struct Key { id: i32, ver: i32 }
impl PartialEq for Key {
    fn eq(&self, other: &Self) -> bool {
        self.id == other.id
    }
}
fn main() {
    let a = Key { id: ${id}, ver: ${v1} };
    let b = Key { id: ${id}, ver: ${v2} };
    let r = if a.eq(&b) {
        a.ver + b.ver
    } else {
        0
    };
    println!("{r}");
}`,
                    [3, 4, 10, 11],
                    'partial_eq.rs',
                  ),
                },
              );
            }),
          ],
        },
      ],
    },
    {
      id: 'rt-trait-conv',
      title: 'From, Into e TryFrom',
      parts: [
        {
          card: [
            {
              title: 'Conversões infalíveis: From e Into',
              body: [
                'Rust evita conversões implícitas silenciosas entre tipos. Quando uma conversão **nunca falha** (como transformar `i32` em uma struct `Meters(i32)` ou `&str` em `String`), usamos o par de traits **`From<T>`** e **`Into<U>`**.',
                'A biblioteca padrão traz uma implementação genérica (*blanket implementation*): sempre que você implementa `From<A> for B`, o Rust implementa **`Into<B> for A` automaticamente**! Por isso, a regra de ouro é: **implemente `From`**, e ganhe os dois modos de chamar (`B::from(a)` e `a.into()`).',
              ].join('\n\n'),
              visual: code(
                `struct Meters(i32);

impl From<i32> for Meters {
    fn from(v: i32) -> Self {
        Meters(v)
    }
}

fn main() {
    let a = Meters::from(12);
    let b: Meters = 8.into();
    println!("{}", a.0 + b.0);
}`,
                [3, 4, 10, 11],
                'from_into.rs',
              ),
              tip: 'Ao usar `.into()`, o compilador precisa conhecer o tipo de destino (por exemplo, pela anotação `let b: Meters = ...` ou pelo parâmetro de uma função).',
            },
            {
              title: 'Como From alimenta Into',
              body: 'Acompanhe passo a passo o que acontece quando implementamos `From<Km> for Meters` e chamamos `.into()`.',
              visual: stepTable(
                ['Passo', 'Código executado', 'Valor produzido'],
                [
                  {
                    label: 'Passo 1: Valor inicial',
                    rows: [
                      ['Origem', 'let d = Km(3);', 'Km(3)'],
                      ['Destino', '—', '—'],
                    ],
                    highlight: [0],
                    info: 'Temos `d` do tipo `Km`, com valor `Km(3)`, na pilha.',
                  },
                  {
                    label: 'Passo 2: Chamada .into()',
                    rows: [
                      ['Chamada', 'let m: Meters = d.into();', 'delega para From'],
                      ['Blanket impl', 'Meters::from(d)', '3 * 1000'],
                    ],
                    highlight: [1],
                    info: 'A implementação padrão de `Into` na `std` chama `Meters::from(d)` consumindo `d`.',
                  },
                  {
                    label: 'Passo 3: Resultado final',
                    rows: [
                      ['Origem d', 'movido / consumido', '—'],
                      ['Destino m', 'Meters(3000)', 'm.0 vale 3000'],
                    ],
                    highlight: [1],
                    info: '`m` recebe `Meters(3000)` com segurança de tipos.',
                  },
                ],
              ),
            },
          ],
          exercises: [
            mcq(
              'Para permitir conversões infalíveis de `Km` para `Meters`, qual é a recomendação idiomática em Rust?',
              [
                'Implementar From<Km> for Meters, pois Into<Meters> for Km é gerada automaticamente.',
                'Implementar apenas Into<Meters> for Km e nunca usar From.',
                'Usar blocos unsafe para reinterpretar os bytes de Km como Meters.',
                'Derivar #[derive(From, Into)] da biblioteca padrão.',
              ],
              0,
              'A biblioteca padrão possui `impl<T, U> Into<U> for T where U: From<T>`. Implementar `From<Km> for Meters` habilita tanto `Meters::from(km)` quanto `km.into()`.',
            ),
            num(
              'Qual número inteiro é impresso pelo programa abaixo?',
              180,
              '`Secs::from(Mins(3))` executa `3 * 60`, produzindo `Secs(180)`.',
              {
                visual: code(
                  `struct Mins(i32);
struct Secs(i64);

impl From<Mins> for Secs {
    fn from(m: Mins) -> Self {
        Secs(i64::from(m.0) * 60)
    }
}
fn main() {
    let s = Secs::from(Mins(3));
    println!("{}", s.0);
}`,
                  [4, 5, 10],
                  'mins_secs.rs',
                ),
              },
            ),
            tf(
              'O método `from(v: T) -> Self` da trait `From<T>` recebe o valor `v` por valor (tomando posse dele).',
              true,
              'Tanto `From::from(v)` quanto `v.into()` consomem o valor de entrada para construir o valor convertido (sem cópia extra se você reaproveitar um buffer como de `String` para `Vec<u8>`).',
            ),
            mcq(
              'Por que a linha `let x = 10.into();` isolada abaixo não compila?',
              [
                'Erro E0283: faltam anotações de tipo para o compilador escolher a conversão para o tipo de destino de x.',
                'O tipo i32 não implementa a trait Into para nenhum tipo.',
                'O método into() só pode ser chamado dentro de blocos impl.',
                'Literais inteiros não possuem métodos em Rust.',
              ],
              0,
              'Como vários tipos implementam `From<i32>` (por exemplo, `i64` ou uma struct sua), o compilador não consegue escolher a conversão sem uma anotação como `let x: i64 = 10.into();` (`error[E0283]: type annotations needed`).',
              {
                visual: code(
                  `fn main() {
    let x = 10.into();
}`,
                  [2],
                  'erro_e0283.rs',
                ),
              },
            ),
            fill(
              'Complete a função que aceita qualquer valor conversível em `Meters`:',
              'fn walk(d: impl ___<Meters>) -> i32 {\n    let m: Meters = d.___();\n    m.0\n}',
              ['Into', 'into'],
              ['From', 'from', 'TryFrom'],
              'O limite `impl Into<Meters>` aceita tanto `Meters` quanto qualquer tipo que possa ser convertido em `Meters` chamando `d.into()`.',
            ),
            order(
              'Ordene as linhas para implementar `From<(i32, i32)>` para a struct `Point`:',
              [
                'struct Point { x: i32, y: i32 }\nimpl From<(i32, i32)> for Point {',
                '    fn from(p: (i32, i32)) -> Self {',
                '        Point { x: p.0, y: p.1 }',
                '    } }',
              ],
              'Declaramos a struct `Point`, abrimos `impl From<(i32, i32)> for Point` e definimos `fn from` retornando `Point { x: p.0, y: p.1 }`.',
            ),
            codePuzzle(
              'Monte a implementação de `From<i32>` para `Cents(i64)` (que multiplica reais por 100 sem transbordar):',
              [
                'struct Cents(i64);\nimpl From<i32> for Cents {',
                '    fn from(reais: i32) -> Self {',
                '        Cents(i64::from(reais) * 100)',
                '    } }',
              ],
              [
                'impl Into<Cents> for i32 {',
                '    fn from(&self) -> Self {',
              ],
              'Implementamos `From<i32> for Cents` com `fn from(reais: i32) -> Self`. Converter para `i64` antes de multiplicar por `100` evita overflow para qualquer entrada `i32`, mantendo a conversão infalível.',
            ),
            gen((rng) => {
              const kg = randInt(rng, 2, 9);
              const extra = randInt(rng, 100, 500);
              const ans = kg * 1000 + extra;
              return num(
                'Qual número inteiro é impresso pelo programa abaixo?',
                ans,
                `\`Kg(${kg}).into()\` chama \`Grams::from\`, produzindo \`${kg * 1000}\` gramas. Somando \`${extra}\`, obtemos \`${ans}\`.`,
                {
                  visual: code(
                    `struct Kg(i32);
struct Grams(i64);
impl From<Kg> for Grams {
    fn from(k: Kg) -> Self {
        Grams(i64::from(k.0) * 1000)
    }
}
fn main() {
    let g: Grams = Kg(${kg}).into();
    println!("{}", g.0 + ${extra});
}`,
                    [3, 4, 9],
                    'kg_grams.rs',
                  ),
                },
              );
            }),
          ],
        },
        {
          card: [
            {
              title: 'Validação na fronteira com TryFrom',
              body: [
                'Nem toda conversão é garantida: converter um `i32` negativo para `u8` ou um `&str` qualquer para um `Cpf` pode falhar. Para isso existem **`TryFrom<T>`** e **`TryInto<U>`**.',
                'Ao implementar `TryFrom<T>`, você define o tipo associado **`type Error`** (que indica qual erro será devolvido) e o método `fn try_from(v: T) -> Result<Self, Self::Error>`. Assim como em `From`, implementar `TryFrom` gera `TryInto` gratuitamente!',
              ].join('\n\n'),
              visual: code(
                `struct Percent(u8);

impl TryFrom<i32> for Percent {
    type Error = &'static str;
    fn try_from(
        v: i32,
    ) -> Result<Self, Self::Error> {
        if (0..=100).contains(&v) {
            Ok(Percent(v as u8))
        } else {
            Err("Fora de 0..=100")
        }
    }
}`,
                [3, 4, 8, 9, 11],
                'try_from.rs',
              ),
              tip: 'Campos privados impedem a construção direta fora do módulo que define a struct. Para preservar a validade, todas as APIs de construção e mutação precisam respeitar a mesma regra; o próprio módulo ainda pode acessar os campos diretamente.',
            },
            {
              title: 'Comparativo: From vs TryFrom',
              body: 'Veja na tabela quando escolher `From` e quando escolher `TryFrom`.',
              visual: table(
                ['Critério', 'From<T> / Into<U>', 'TryFrom<T> / TryInto<U>'],
                [
                  ['Pode falhar?', 'Não (conversão sempre válida)', 'Sim (entrada fora da faixa ou inválida)'],
                  ['Retorno', 'Self', 'Result<Self, Self::Error>'],
                  ['Tipo associado', 'Nenhum', 'type Error'],
                  ['Exemplo std', 'u32::from(25_u8)', 'u8::try_from(300_i32) -> Err(...)'],
                ],
                [1, 3],
              ),
            },
            {
              title: 'No seu computador',
              body: [
                'Resolva o **Exercício 35 (Tipos que validam)** do roteiro:',
                '• Crie `cargo new valida_cpf` e edite `src/main.rs`.',
                '• Declare `#[derive(Debug)] struct Cpf(String);` e `#[derive(Debug)] enum CpfError { InvalidLen, NotDigits }`.',
                '• Implemente `TryFrom<&str> for Cpf` com `type Error = CpfError;`: retorne `Err(CpfError::InvalidLen)` se `s.len() != 11`, `Err(CpfError::NotDigits)` se `!s.chars().all(|c| c.is_ascii_digit())`, e `Ok(Cpf(s.to_string()))` caso contrário.',
                '• No `main`, teste `"12345678901"` e `"1234a678901"` usando `match` (sem `unwrap()`), lendo `cpf.0` ao exibir o texto aprovado. Esta regra verifica só formato, não os dígitos verificadores de um CPF real.',
                '• **Critério de pronto**: `cargo run` mostra o CPF válido aprovado e o inválido recusado com `NotDigits`, e `cargo clippy -- -D warnings` passa sem avisos.',
              ].join('\n'),
              visual: code(
                `#[derive(Debug)]
struct Cpf(String);
#[derive(Debug)]
enum CpfError { InvalidLen, NotDigits }

impl TryFrom<&str> for Cpf {
    type Error = CpfError;
    fn try_from(
        s: &str,
    ) -> Result<Self, Self::Error> {
        if s.len() != 11 {
            return Err(CpfError::InvalidLen);
        }
        if !s.chars().all(|c| c.is_ascii_digit()) {
            return Err(CpfError::NotDigits);
        }
        Ok(Cpf(s.to_string()))
    }
}`,
                [6, 7, 11, 14],
                'src/main.rs',
              ),
            },
          ],
          exercises: [
            mcq(
              'Qual é o tipo de retorno do método `try_from` na trait `TryFrom<T>`?',
              ['Result<Self, Self::Error>', 'Option<Self>', 'Self', 'bool'],
              0,
              '`TryFrom::try_from` retorna `Result<Self, Self::Error>`, entregando `Ok(valor)` quando a conversão tem sucesso ou `Err(erro)` quando falha.',
            ),
            tf(
              'Implementar `TryFrom<A> for B` faz com que a biblioteca padrão disponibilize automaticamente `TryInto<B> for A`.',
              true,
              'Assim como `From` gera `Into`, a biblioteca padrão traz uma implementação genérica que fornece `TryInto` para todo tipo que implementa `TryFrom`.',
            ),
            mcq(
              'O que `u8::try_from(300_i32)` devolve em execução?',
              [
                'Err(...), pois 300 está fora da faixa 0..=255 de u8.',
                'Ok(44), truncando os bits superiores como 300 as u8.',
                'Ok(255), saturando no limite máximo de u8.',
                'Aborta o programa imediatamente com panic!.',
              ],
              0,
              'Diferente do cast `300 as u8` (que trunca silenciosamente para 44), `u8::try_from(300)` verifica os limites de `u8` (`0` a `255`) e devolve `Err(TryFromIntError)`.',
              {
                visual: code(
                  `fn main() {
    let r = u8::try_from(300_i32);
    println!("{}", r.is_err());
}`,
                  [2],
                  'u8_try_from.rs',
                ),
              },
            ),
            num(
              'Qual número inteiro é impresso pelo programa abaixo?',
              80,
              '`Port::try_from(80)` passa no teste `v > 0` e devolve `Ok(Port(80))`; já `Port::try_from(-5)` devolve `Err("invalida")`, caindo no valor padrão `0`. A soma é `80 + 0 = 80`.',
              {
                visual: code(
                  `struct Port(i32);
impl TryFrom<i32> for Port {
    type Error = &'static str;
    fn try_from(
        v: i32,
    ) -> Result<Self, Self::Error> {
        if v > 0 {
            Ok(Port(v))
        } else {
            Err("invalida")
        }
    }
}
fn main() {
    let a = Port::try_from(80)
        .map_or(0, |p| p.0);
    let b = Port::try_from(-5)
        .map_or(0, |p| p.0);
    println!("{}", a + b);
}`,
                  [7, 8, 10, 15, 17],
                  'port.rs',
                ),
              },
            ),
            match(
              'Associe cada conversão à trait adequada em Rust:',
              [
                ['u8 para u32 (sempre cabe)', 'From (sempre infalível)'],
                ['i64 para u8 (pode estourar 255)', 'TryFrom (checa intervalo)'],
                ['&str para Cpf de 11 dígitos', 'TryFrom (valida regra de negócio)'],
                ['&str para String alocada', 'From (aloca cópia do texto)'],
              ],
              'Conversões que valem para todo valor do tipo de origem usam `From`; conversões que precisam rejeitar entradas inválidas usam `TryFrom`.',
            ),
            fill(
              'Complete os itens obrigatórios dentro de `impl TryFrom<&str> for Cpf`:',
              'type ___ = CpfError;\nfn ___(s: &str) -> Result<Self, Self::Error>',
              ['Error', 'try_from'],
              ['Output', 'Item', 'from'],
              'A trait `TryFrom` exige definir o tipo associado `type Error` e a função `fn try_from`.',
            ),
            codePuzzle(
              'Monte a implementação de `TryFrom<i32>` para `NonZero` que rejeita o valor `0`:',
              [
                'struct NonZero(i32);\nimpl TryFrom<i32> for NonZero {\n    type Error = &\'static str;\n    fn try_from(v: i32)',
                '        -> Result<Self, Self::Error> {',
                '        if v == 0 { Err("zero") }',
                '        else { Ok(NonZero(v)) } } }',
              ],
              [
                "    type Output = &'static str;",
                '        else { NonZero(v) } } }',
              ],
              'Definimos `type Error = &\'static str;` e, em `try_from`, retornamos `Err("zero")` quando `v` vale `0` ou `Ok(NonZero(v))` para valores não nulos.',
            ),
            gen((rng) => {
              const lim = randInt(rng, 20, 50);
              const a = randInt(rng, 5, 19);
              const b = randInt(rng, 55, 90);
              const ans = a + 1;
              return num(
                'Qual número o programa abaixo imprime?',
                ans,
                `Como \`${a} <= ${lim}\`, a primeira conversão retorna \`Ok(Small(${a}))\` -> \`${a}\`. Já \`${b} > ${lim}\` retorna \`Err\`, que \`map_or\` transforma em \`1\`. Total: \`${a} + 1 = ${ans}\`.`,
                {
                  visual: code(
                    `struct Small(i32);
impl TryFrom<i32> for Small {
    type Error = &'static str;
    fn try_from(
        v: i32,
    ) -> Result<Self, Self::Error> {
        if v <= ${lim} {
            Ok(Small(v))
        } else {
            Err("alto")
        }
    }
}
fn main() {
    let x = Small::try_from(${a})
        .map_or(0, |s| s.0);
    let y = Small::try_from(${b})
        .map_or(1, |s| s.0);
    println!("{}", x + y);
}`,
                    [7, 15, 17],
                    'small_try.rs',
                  ),
                },
              );
            }),
          ],
        },
      ],
    },
    {
      id: 'rt-trait-dyn',
      title: 'Trait objects e dyn',
      parts: [
        {
          card: [
            {
              title: 'Coleções heterogêneas com dyn Trait',
              body: [
                'Um `Vec<T>` comum só pode guardar elementos de **um único tipo concreto** `T`. E se você quiser guardar `Manager` e `Dev` na mesma lista porque ambos implementam `Employee`?',
                'Para isso usamos um **trait object** com a palavra-chave **`dyn`**: por exemplo, `Box<dyn Employee>` ou `&dyn Employee`. Como structs diferentes têm tamanhos diferentes na memória, `dyn Trait` não tem tamanho fixo em compilação e precisa sempre viver atrás de um ponteiro (`&` ou `Box`).',
                'Em vez de escolher o método na compilação (*despacho estático*), o programa descobre qual função chamar em tempo de execução (*despacho dinâmico*) consultando uma tabela de ponteiros de função chamada **`vtable`**.',
              ].join('\n\n'),
              visual: code(
                `trait Employee {
    fn bonus(&self) -> i32;
}
struct Manager { pay: i32 }
struct Dev { pay: i32 }

impl Employee for Manager {
    fn bonus(&self) -> i32 {
        self.pay / 5
    }
}
impl Employee for Dev {
    fn bonus(&self) -> i32 {
        self.pay / 10
    }
}

fn total(
    v: &[Box<dyn Employee>],
) -> i32 {
    v.iter().map(|e| e.bonus()).sum()
}`,
                [1, 18, 19, 21],
                'dyn_employee.rs',
              ),
            },
            {
              title: 'Na memória: o ponteiro gordo (fat pointer)',
              body: 'Avance pelos passos para ver a representação atual de um `Box<dyn Employee>` local: dois ponteiros (16 bytes em um alvo de 64 bits) para alcançar o dado no heap e a `vtable`. O layout exato não é uma garantia estável da linguagem.',
              visual: stepTable(
                ['Região', 'Campo / Conteúdo', 'Valor / Destino'],
                [
                  {
                    label: '1. Pilha: Ponteiro Gordo',
                    rows: [
                      ['Pilha (palavra 1)', 'ptr_dados (8 bytes)', '-> Heap (Manager)'],
                      ['Pilha (palavra 2)', 'ptr_vtable (8 bytes)', '-> Vtable de Manager'],
                    ],
                    highlight: [0, 1],
                    info: 'Na implementação atual do rustc, `&dyn Trait` e `Box<dyn Trait>` usam 2 palavras (16 bytes em alvos de 64 bits). Eles também podem ser campos de valores armazenados no heap.',
                  },
                  {
                    label: '2. Heap e Vtable estática',
                    rows: [
                      ['Heap', 'Manager { pay: 5000 }', '4 bytes do i32'],
                      ['Vtable (estática)', 'drop, size, align, bonus', 'fn Manager::bonus'],
                    ],
                    highlight: [1],
                    info: 'O dado vive no heap, enquanto a `vtable` fica em memória estática somente-leitura com o endereço de `Manager::bonus`.',
                  },
                  {
                    label: '3. Chamada e.bonus()',
                    rows: [
                      ['Consulta vtable', 'lê fn Manager::bonus', 'chama passando ptr_dados'],
                      ['Retorno', '5000 / 5', '1000'],
                    ],
                    highlight: [0, 1],
                    info: 'Em tempo de execução, `e.bonus()` segue `ptr_vtable`, chama `Manager::bonus(ptr_dados)` e obtém `1000`.',
                  },
                ],
              ),
            },
          ],
          exercises: [
            mcq(
              'Por que não podemos declarar uma variável ou parâmetro `x: dyn Employee` diretamente por valor, sem `&` nem `Box`?',
              [
                'Porque diferentes tipos que implementam Employee têm tamanhos diferentes, então dyn Employee não tem tamanho fixo em compilação.',
                'Porque a palavra-chave dyn só pode ser usada dentro de módulos unsafe.',
                'Porque traits em Rust só podem ser implementadas por referências.',
                'Porque Box<T> é a única forma de chamar métodos em Rust.',
              ],
              0,
              'A pilha precisa saber exatamente quantos bytes reservar para cada variável em tempo de compilação (`Sized`). Como um `dyn Employee` pode ser qualquer struct, ele deve ser referenciado por um ponteiro de tamanho fixo (`&dyn Employee` ou `Box<dyn Employee>`).',
            ),
            num(
              'Na representação atual do rustc em um alvo de 64 bits (ponteiro simples de 8 bytes), quantos bytes ocupa uma referência `&dyn Employee`?',
              16,
              'Um ponteiro para `dyn Trait` é um *ponteiro gordo* (*fat pointer*) formado por dois ponteiros de 8 bytes: um para os dados do objeto e outro para a `vtable` (`8 + 8 = 16` bytes).',
            ),
            num(
              'Qual número inteiro é impresso pelo programa abaixo?',
              300,
              'O vetor guarda um `Manager` com bônus `1000 / 5 = 200` e um `Dev` com bônus `1000 / 10 = 100`. A soma no laço resulta em `200 + 100 = 300`.',
              {
                visual: code(
                  `trait Employee {
    fn bonus(&self) -> i32;
}
struct Manager { pay: i32 }
struct Dev { pay: i32 }
impl Employee for Manager {
    fn bonus(&self) -> i32 {
        self.pay / 5
    }
}
impl Employee for Dev {
    fn bonus(&self) -> i32 {
        self.pay / 10
    }
}
fn main() {
    let m = Manager { pay: 1000 };
    let d = Dev { pay: 1000 };
    let team: Vec<Box<dyn Employee>> =
        vec![Box::new(m), Box::new(d)];
    let mut s = 0;
    for e in &team { s += e.bonus(); }
    println!("{s}");
}`,
                  [17, 18, 20, 21],
                  'team_bonus.rs',
                ),
              },
            ),
            tf(
              'Em uma função genérica `fn calc<T: Employee>(e: &T)`, o compilador usa despacho estático (monomorfização), sem consultar `vtable` em tempo de execução.',
              true,
              'Com genéricos (`<T: Trait>` ou `impl Trait`), o compilador gera uma versão especializada da função para cada tipo concreto usado, permitindo inclusive *inlining* sem custo de `vtable`.',
            ),
            fill(
              'Complete a declaração do vetor para armazenar structs diferentes que implementam `Sensor`:',
              'let list: Vec<___<___ Sensor>> = vec![\n    Box::new(Temp),\n    Box::new(Press),\n];',
              ['Box', 'dyn'],
              ['impl', 'Vec', 'Self'],
              'Usamos `Vec<Box<dyn Sensor>>`: os boxes têm tamanho conhecido e `dyn Sensor` habilita o despacho dinâmico. As structs unitárias `Temp` e `Press` têm tamanho zero, por isso seus boxes não precisam alocar dados no heap.',
            ),
            match(
              'Associe cada mecanismo à sua característica em Rust:',
              [
                ['Vec<T>', 'Armazena elementos de um único tipo concreto T'],
                ['Vec<Box<dyn Trait>>', 'Armazena tipos concretos diferentes que implementam a Trait'],
                ['Monomorfização', 'Gera código especializado em compilação (despacho estático)'],
                ['Vtable', 'Tabela de ponteiros de função consultada em execução'],
              ],
              'O despacho estático prioriza desempenho máximo para um tipo por vez; o despacho dinâmico com `dyn` permite coleções heterogêneas em tempo de execução.',
            ),
            codePuzzle(
              'Monte o código que cria um `Vec<Box<dyn Draw>>` com duas figuras distintas e chama `draw()` em cada uma:',
              [
                'trait Draw { fn draw(&self); }\nstruct Circle { r: i32 }\nstruct Square { s: i32 }\nimpl Draw for Circle { fn draw(&self) { println!("Círculo: {}", self.r); } }\nimpl Draw for Square { fn draw(&self) { println!("Quadrado: {}", self.s); } }\nfn main() {\n    let shapes: Vec<Box<dyn Draw>> = vec![',
                '        Box::new(Circle { r: 3 }),\n        Box::new(Square { s: 4 }),',
                '    ];\n    for s in &shapes {',
                '    s.draw();',
                '    } }',
              ],
              [
                'let shapes: Vec<impl Draw> = vec![',
                '    Circle { r: 3 },',
              ],
              'Cada figura é embrulhada em `Box::new(...)` para entrar no `Vec<Box<dyn Draw>>`, e o laço `for s in &shapes` despacha `s.draw()` dinamicamente.',
            ),
            gen((rng) => {
              const m = randInt(rng, 2, 6) * 100;
              const d = randInt(rng, 2, 6) * 100;
              const ans = m / 5 + d / 10;
              return num(
                'Qual número o programa abaixo imprime?',
                ans,
                `O bônus de \`Manager\` é \`${m} / 5 = ${m / 5}\` e o de \`Dev\` é \`${d} / 10 = ${d / 10}\`. A soma total é \`${ans}\`.`,
                {
                  visual: code(
                    `trait Employee {
    fn bonus(&self) -> i32;
}
struct Manager { pay: i32 }
struct Dev { pay: i32 }
impl Employee for Manager {
    fn bonus(&self) -> i32 {
        self.pay / 5
    }
}
impl Employee for Dev {
    fn bonus(&self) -> i32 {
        self.pay / 10
    }
}
fn main() {
    let m = Manager { pay: ${m} };
    let d = Dev { pay: ${d} };
    let v: Vec<Box<dyn Employee>> =
        vec![Box::new(m), Box::new(d)];
    let ans: i32 = v
        .iter()
        .map(|e| e.bonus())
        .sum();
    println!("{ans}");
}`,
                    [17, 18, 20, 23],
                    'dyn_sum.rs',
                  ),
                },
              );
            }),
          ],
        },
        {
          card: [
            {
              title: 'Regras de dyn (E0038) e enum vs trait',
              body: [
                'Nem toda trait pode virar um `dyn Trait`. Para ser **compatível com `dyn`** (*dyn-compatible* / *object-safe*), os métodos da trait precisam caber numa `vtable` e funcionar sem que o chamador conheça o tipo concreto. Tentar usar `dyn` numa trait incompatível gera o erro **`E0038`**.',
                'Entre as restrições de compatibilidade com `dyn`:\n• A trait não pode exigir `Self: Sized` (como faz `Clone`) nem ter supertraits incompatíveis com `dyn`.\n• Métodos que retornam `Self` por valor, métodos com parâmetros de tipo e funções sem receptor precisam ser excluídos do despacho com `where Self: Sized`.\n• Constantes associadas e tipos associados genéricos impedem `dyn`; métodos `async fn` e com retorno `impl Trait` também precisam da restrição `Self: Sized`.',
                'Na modelagem (**Exercício 23**), escolha **`enum`** quando o conjunto de tipos for **fechado e conhecido** (sem `Box` extra e com `match` exaustivo), e **`dyn Trait`** quando o conjunto for **aberto** ou para injeção de dependência (`Box<dyn Notifier>`).',
              ].join('\n\n'),
              visual: code(
                `trait BadClone {
    fn duplicate(&self) -> Self;
}

// Erro E0038: retorna Self sem Self: Sized!
fn use_object(_: &dyn BadClone) {}`,
                [2, 6],
                'erro_e0038.rs',
              ),
            },
            {
              title: 'Modelagem: enum vs dyn Trait',
              body: 'Compare as duas abordagens do Exercício 23 para modelar uma família de tipos no seu projeto.',
              visual: table(
                ['Critério', 'enum com variantes', 'dyn Trait (Box<dyn ...>)'],
                [
                  ['Conjunto de tipos', 'Fechado (conhecido na definição)', 'Aberto (novas structs sem mexer nas antigas)'],
                  ['Memória em Vec', 'Contígua, sem Box por item', 'Ponteiro gordo + alocação por item de tamanho não zero'],
                  ['Adicionar nova operação', 'Fácil: basta mais uma função com match', 'Método obrigatório exige mudar os impls; método padrão pode ser herdado'],
                  ['Injeção de dependência', 'Acoplada às variantes do enum', 'Excelente (ex.: Box<dyn Notifier>)'],
                ],
                [0, 3],
              ),
            },
            {
              title: 'No seu computador',
              body: [
                'Pratique os **Exercícios 21, 22 e 23** do roteiro (polimorfismo e composição no lugar de herança):',
                '• Crie `cargo new folha_pagamento` e edite `src/main.rs`.',
                '• Crie `struct EmployeeData { name: String, salary: f64 }` para guardar os campos comuns por **composição**.',
                '• Crie `trait Employee { fn salary(&self) -> f64; fn bonus(&self) -> f64; }` e implemente para `struct Manager { data: EmployeeData }` (bônus de 20%) e `struct Developer { data: EmployeeData }` (bônus de 10%).',
                '• Guarde um `Manager` (salário `10000.0`) e um `Developer` (salário `6000.0`) num `Vec<Box<dyn Employee>>` e some os bônus num laço.',
                '• Implemente o bônus usando `self.salary()` e confira que os nomes não estão vazios com `assert!(!manager.data.name.is_empty())` e `assert!(!developer.data.name.is_empty())` antes de mover os funcionários para o vetor.',
                '• **Critério de pronto**: `cargo run` imprime `2600.0` com `println!("{:.1}", total)` (`2000.0 + 600.0`) e `cargo clippy -- -D warnings` termina sem nenhum aviso.',
              ].join('\n'),
              visual: code(
                `struct EmployeeData {
    name: String,
    salary: f64,
}
struct Manager {
    data: EmployeeData,
}
trait Employee {
    fn salary(&self) -> f64;
    fn bonus(&self) -> f64;
}`,
                [1, 6, 8],
                'src/main.rs',
              ),
            },
          ],
          exercises: [
            mcq(
              'Por que o tipo `Box<dyn Clone>` não compila em Rust?',
              [
                'Erro E0038: Clone exige Self: Sized, o que impede sua utilização como dyn Clone.',
                'Erro E0117: Clone pertence à biblioteca padrão e não à crate atual.',
                'Porque Box<T> já clona todos os objetos automaticamente sem precisar de Clone.',
                'Porque traits com apenas um método não podem usar dyn.',
              ],
              0,
              '`Clone` é declarada como `pub trait Clone: Sized`. Essa exigência na própria trait impede `dyn Clone`, gerando `E0038` (trait não compatível com dyn). Seu método `clone(&self) -> Self` também devolve o tipo concreto por valor.',
            ),
            tf(
              'Uma trait que declara um método genérico `fn format_item<T>(&self, x: T) -> String` pode ser usada como `dyn Formatter`.',
              false,
              'Métodos genéricos exigem monomorfização para cada tipo `T` utilizado, o que é incompatível com uma `vtable` de tamanho fixo em tempo de execução (erro `E0038`).',
            ),
            mcq(
              'Qual cláusula permite manter uma função construtora `fn new() -> Self` dentro de uma trait sem impedir o uso de `dyn Trait` nos demais métodos?',
              ['where Self: Sized', 'where Self: Send', 'where Self: Sync', 'where Self: std::fmt::Debug'],
              0,
              'A restrição `where Self: Sized` no método diz ao compilador que aquele método específico não estará disponível em `dyn Trait` (que não é `Sized`), permitindo criar a `vtable` com os demais métodos.',
              {
                visual: code(
                  `trait Plugin {
    fn new() -> Self
    where
        Self: Sized;
    fn run(&self);
}`,
                  [2, 3, 4],
                  'plugin_sized.rs',
                ),
              },
            ),
            multi(
              'Quais das assinaturas de método abaixo são compatíveis com `dyn Trait` (podem entrar normalmente na `vtable`)?',
              [
                'fn area(&self) -> f64;',
                'fn reset(&mut self);',
                'fn duplicate(&self) -> Self;',
                'fn convert<T>(&self) -> T;',
              ],
              [0, 1],
              '`fn area(&self) -> f64` e `fn reset(&mut self)` recebem `&self` / `&mut self`, não retornam `Self` por valor e não têm parâmetros genéricos, sendo 100% compatíveis com `dyn`.',
            ),
            mcq(
              'Você está modelando um protocolo com exatamente 3 comandos fixos (`Ping`, `Data(Vec<u8>)`, `Close`), conhecidos desde o início. Qual escolha é mais idiomática e evita alocações extras no heap?',
              [
                'Um enum com dados nas variantes e pattern matching exaustivo.',
                'Três structs vazias guardadas num Vec<Box<dyn Any>>.',
                'Uma hierarquia de classes com herança múltipla.',
                'Três variáveis globais mutáveis com blocos unsafe.',
              ],
              0,
              'Quando todas as variantes são conhecidas, um `enum` guarda os dados de forma compacta sem exigir `Box` por elemento, e o compilador garante que todo `match` trate todas as variantes.',
            ),
            order(
              'Ordene os passos para aplicar injeção de dependência com `Box<dyn Notifier>` em uma struct de serviço:',
              [
                'Declarar a trait Notifier com fn notify(&self, msg: &str)',
                'Guardar um campo Box<dyn Notifier> dentro de AccountService',
                'Receber o Box<dyn Notifier> no construtor AccountService::new',
                'Chamar self.notifier.notify(...) nos métodos do serviço',
              ],
              'Com `Box<dyn Notifier>` guardado por composição na struct, o serviço funciona com qualquer implementação (`Email`, `Sms` ou um mock de teste) sem mudar seu código.',
            ),
            codePuzzle(
              'Monte a struct `Service` que guarda um `Box<dyn Logger>` por composição e o aciona em `run`:',
              [
                'trait Logger { fn log(&self, m: &str); }\nstruct Service {',
                '    logger: Box<dyn Logger>,',
                '}\nimpl Service {\n    fn run(&self) {',
                '        self.logger.log("ok"); } }',
              ],
              [
                '    logger: Box<Logger>,',
                '        Logger::log("ok"); } }',
              ],
              'O campo `logger` usa `Box<dyn Logger>` para ter tamanho fixo na struct, e `self.logger.log("ok")` faz a chamada polimórfica.',
            ),
            gen((rng) => {
              const q1 = randInt(rng, 2, 5);
              const p1 = randInt(rng, 10, 30);
              const p2 = randInt(rng, 15, 40);
              const ans = q1 * p1 + p2;
              return num(
                'Qual é o valor total do estoque impresso pelo programa abaixo?',
                ans,
                `O item \`Bulk\` vale \`${q1} * ${p1} = ${q1 * p1}\` e o item \`Single\` vale \`${p2}\`. A soma total é \`${ans}\`.`,
                {
                  visual: code(
                    `trait Item { fn val(&self) -> i32; }
struct Bulk { qty: i32, unit: i32 }
struct Single { price: i32 }
impl Item for Bulk {
    fn val(&self) -> i32 {
        self.qty * self.unit
    }
}
impl Item for Single {
    fn val(&self) -> i32 { self.price }
}
fn main() {
    let s: Vec<Box<dyn Item>> = vec![
        Box::new(Bulk {
            qty: ${q1},
            unit: ${p1},
        }),
        Box::new(Single { price: ${p2} }),
    ];
    let ans: i32 = s
        .iter()
        .map(|i| i.val())
        .sum();
    println!("{ans}");
}`,
                    [5, 6, 13, 22],
                    'stock_dyn.rs',
                  ),
                },
              );
            }),
          ],
        },
      ],
    },
    {
      id: 'rt-trait-op',
      title: 'Operadores e tipos associados',
      parts: [
        {
          card: [
            {
              title: 'Operadores como traits: std::ops::Add',
              body: [
                'Em Rust, operadores aritméticos como `+`, `-` e `*` são açúcar sintático para chamadas de métodos das traits em **`std::ops`**. Escrever `a + b` equivale a chamar `std::ops::Add::add(a, b)`.',
                'Repare na linha `type Output = Self;` dentro do bloco `impl Add`: **`Output` é um tipo associado** da trait `Add` que informa ao compilador qual é o tipo do resultado da soma. Criar um tipo próprio como `struct Money(i64)` (padrão *newtype* do **Exercício 20**) impede somar centavos com um inteiro qualquer por engano!',
              ].join('\n\n'),
              visual: code(
                `use std::ops::Add;

#[derive(Debug, Clone, Copy, PartialEq)]
struct Money(i64);

impl Add for Money {
    type Output = Self;
    fn add(self, rhs: Self) -> Self {
        Money(self.0 + rhs.0)
    }
}

fn main() {
    let total = Money(150) + Money(250);
    println!("{}", total.0);
}`,
                [6, 7, 8, 14],
                'money_add.rs',
              ),
            },
            {
              title: 'O que acontece em a + b',
              body: 'Percorra os passos para ver como o compilador traduz o operador `+` na chamada da trait `Add`.',
              visual: stepTable(
                ['Etapa', 'Expressão', 'Estado / Tipo'],
                [
                  {
                    label: 'Passo 1: Operandos',
                    rows: [
                      ['Esquerda (self)', 'Money(150)', '150 centavos'],
                      ['Direita (rhs)', 'Money(250)', '250 centavos'],
                    ],
                    highlight: [0, 1],
                    info: 'Temos dois valores do tipo `Money` (que implementa `Copy`).',
                  },
                  {
                    label: 'Passo 2: Desaçucarar +',
                    rows: [
                      ['Operador', 'Money(150) + Money(250)', 'chama Add::add'],
                      ['Reescrita', 'Money(150).add(Money(250))', 'Output = Money'],
                    ],
                    highlight: [1],
                    info: 'O compilador substitui `a + b` por `Add::add(a, b)` e verifica `type Output`.',
                  },
                  {
                    label: 'Passo 3: Resultado',
                    rows: [
                      ['Soma interna', '150 + 250', '400'],
                      ['Retorno', 'Money(400)', 'total.0 vale 400'],
                    ],
                    highlight: [1],
                    info: 'O método devolve uma nova instância `Money(400)` com segurança de tipos.',
                  },
                ],
              ),
            },
          ],
          exercises: [
            mcq(
              'Quando você escreve `a + b` em Rust, qual método e qual trait da biblioteca padrão são acionados?',
              [
                'O método add da trait std::ops::Add.',
                'O método sum da trait std::iter::Iterator.',
                'O método plus da trait std::fmt::Display.',
                'O método into da trait std::convert::Into.',
              ],
              0,
              'A expressão `a + b` é traduzida pelo compilador para `std::ops::Add::add(a, b)`.',
            ),
            num(
              'Qual número inteiro é impresso pelo programa abaixo?',
              200,
              '`Money(120) + Money(80)` chama `add`, retornando `Money(120 + 80) = Money(200)`.',
              {
                visual: code(
                  `use std::ops::Add;
struct Money(i64);
impl Add for Money {
    type Output = Self;
    fn add(self, rhs: Self) -> Self {
        Money(self.0 + rhs.0)
    }
}
fn main() {
    let c = Money(120) + Money(80);
    println!("{}", c.0);
}`,
                  [4, 5, 10],
                  'add_run.rs',
                ),
              },
            ),
            tf(
              'Na trait `std::ops::Add`, o método `fn add(self, rhs: Rhs)` recebe ambos os operandos por valor (movendo-os, ou copiando-os caso implementem `Copy`).',
              true,
              '`add` consome `self` e `rhs` por valor. Por isso tipos numéricos e pequenas structs como `Money(i64)` costumam derivar `Clone` e `Copy`.',
            ),
            mcq(
              'Se definirmos `struct Volts(i32);` sem implementar `std::ops::Add`, o que acontece ao escrever `Volts(5) + Volts(3)`?',
              [
                'Não compila: o compilador informa que std::ops::Add não está implementada para Volts.',
                'Soma automaticamente os campos internos e retorna Volts(8).',
                'Retorna o inteiro 8 perdendo o tipo Volts.',
                'Compila, mas aborta com panic! ao executar.',
              ],
              0,
              'Rust nunca aplica `+` a uma struct sem que `std::ops::Add` tenha sido explicitamente implementada para ela (`error[E0369]: cannot add \'Volts\' to \'Volts\'`).',
            ),
            fill(
              'Complete a implementação da subtração para `Money(i64)`, com `use std::ops::Sub;` já importado:',
              'impl Sub for Money {\n    type ___ = Self;\n    fn ___(self, rhs: Self) -> Self {\n        Money(self.0 - rhs.0)\n    }\n}',
              ['Output', 'sub'],
              ['Item', 'Error', 'add'],
              'Assim como `Add`, a trait `std::ops::Sub` declara o tipo associado `type Output` e exige o método `fn sub(self, rhs: Self) -> Self::Output`.',
            ),
            mcq(
              'Na declaração da biblioteca padrão `pub trait Add<Rhs = Self> { type Output; ... }`, o que `Rhs = Self` significa?',
              [
                'Que o parâmetro genérico Rhs vale Self por padrão se você escrever apenas impl Add for MeuTipo.',
                'Que é proibido somar dois tipos diferentes em Rust.',
                'Que o resultado da soma sempre precisa ser um booleano.',
                'Que Rhs é uma variável global mutável.',
              ],
              0,
              '`Rhs = Self` é um parâmetro de tipo padrão (*default type parameter*): escrever `impl Add for Money` equivale a `impl Add<Money> for Money`, mas você também pode implementar `impl Add<i64> for Money` se quiser.',
            ),
            codePuzzle(
              'Monte a implementação de `std::ops::Add` para o vetor bidimensional `Vec2(i32, i32)`:',
              [
                'use std::ops::Add;\nstruct Vec2(i32, i32);\nimpl Add for Vec2 {\n    type Output = Self;\n    fn add(self, r: Self) -> Self {',
                '        Vec2(self.0 + r.0, self.1 + r.1)',
                '    } }',
              ],
              [
                '    type Item = Self;',
                '    fn add(&self, r: &Self) -> Self {',
              ],
              '`Add` define `type Output = Self;` e o método `fn add(self, r: Self) -> Self`, somando coordenada a coordenada.',
            ),
            gen((rng) => {
              const x1 = randInt(rng, 1, 9);
              const y1 = randInt(rng, 1, 9);
              const x2 = randInt(rng, 1, 9);
              const y2 = randInt(rng, 1, 9);
              const ans = x1 + y1 + x2 + y2;
              return num(
                'Qual número o programa abaixo imprime?',
                ans,
                `A soma de vetores produz \`Vec2(${x1} + ${x2}, ${y1} + ${y2}) = Vec2(${x1 + x2}, ${y1 + y2})\`. Somando as duas coordenadas: \`${x1 + x2} + ${y1 + y2} = ${ans}\`.`,
                {
                  visual: code(
                    `use std::ops::Add;
struct Vec2(i32, i32);
impl Add for Vec2 {
    type Output = Self;
    fn add(self, r: Self) -> Self {
        Vec2(self.0 + r.0, self.1 + r.1)
    }
}
fn main() {
    let a = Vec2(${x1}, ${y1});
    let b = Vec2(${x2}, ${y2});
    let v = a + b;
    println!("{}", v.0 + v.1);
}`,
                    [5, 6, 12],
                    'vec2_add.rs',
                  ),
                },
              );
            }),
          ],
        },
        {
          card: [
            {
              title: 'Tipos associados e Iterator::Item',
              body: [
                'Por que algumas traits usam um **tipo associado** (`type Item;`) em vez de um parâmetro genérico (`trait Iterator<T>`)? Com um parâmetro genérico, uma mesma struct poderia implementar `Iterator<u32>` e `Iterator<String>` ao mesmo tempo, podendo exigir anotações de tipo em chamadas ambíguas.',
                'Com o tipo associado **`type Item`**, cada tipo implementa **`Iterator`** uma única vez e fixa qual elemento ele produz. Você só precisa definir `type Item` e o método **`fn next(&mut self) -> Option<Self::Item>`**: de brinde, ganha dezenas de métodos padrão da trait `Iterator`, como `take`, `map`, `filter`, `sum` e `collect`, desde que os limites de cada método sejam satisfeitos (por exemplo, `sum` exige um tipo que implemente `Sum` para os itens)!',
              ].join('\n\n'),
              visual: code(
                `struct Step { cur: u32, max: u32 }

impl Iterator for Step {
    type Item = u32;
    fn next(&mut self) -> Option<u32> {
        if self.cur < self.max {
            self.cur += 1;
            Some(self.cur)
        } else {
            None
        }
    }
}

fn main() {
    let s = Step { cur: 0, max: 4 };
    println!("{}", s.sum::<u32>());
}`,
                [4, 5, 8, 10, 17],
                'step_iter.rs',
              ),
            },
            {
              title: 'Parâmetro genérico vs Tipo associado',
              body: 'Compare quando uma trait deve usar parâmetro genérico (`Trait<T>`) e quando deve usar tipo associado (`type Item`).',
              visual: table(
                ['Abordagem', 'Quantas impls por tipo?', 'Exemplo clássico'],
                [
                  ['Genérico: trait From<T>', 'Várias (uma para cada tipo T de entrada)', 'From<u8> e From<u16> para u32'],
                  ['Associado: type Item', 'Uma única implementação por tipo', 'Iterator::Item em um gerador'],
                  ['Associado: type Output', 'Uma única saída por par de operandos', 'Add::Output na soma a + b'],
                ],
                [1],
              ),
            },
            {
              title: 'No seu computador',
              body: [
                'Implemente os **Exercícios 20 e 38** do roteiro (`Dinheiro` com `Add`/`Sub` e gerador `Fibonacci` com `Iterator`):',
                '• Crie `cargo new fib_iter` e abra `src/main.rs`.',
                '• Defina `struct Fibonacci { a: u64, b: u64 }` com `fn new() -> Self { Fibonacci { a: 0, b: 1 } }`.',
                '• Implemente `Iterator for Fibonacci` com `type Item = u64;`. Em `next(&mut self)`, guarde `let cur = self.a;`, atualize `self.a = self.b;` e `self.b = cur + self.b;`, e retorne `Some(cur)`.',
                '• No `main`, calcule a soma dos 10 primeiros termos com `Fibonacci::new().take(10).sum::<u64>()` e imprima o resultado. Limite o consumo: a sequência cresce além de `u64`; a adição comum causa panic com checagem de overflow (padrão em debug) ou dá a volta sem a checagem (padrão em release).',
                '• **Critério de pronto**: `cargo run` imprime `88` (soma de `0, 1, 1, 2, 3, 5, 8, 13, 21, 34`) e `cargo clippy -- -D warnings` termina sem avisos.',
              ].join('\n'),
              visual: code(
                `struct Fibonacci { a: u64, b: u64 }

impl Iterator for Fibonacci {
    type Item = u64;
    fn next(&mut self) -> Option<u64> {
        let cur = self.a;
        self.a = self.b;
        self.b = cur + self.b;
        Some(cur)
    }
}`,
                [4, 5, 9],
                'src/main.rs',
              ),
            },
          ],
          exercises: [
            mcq(
              'Ao implementar a trait `std::iter::Iterator` para uma struct própria, qual é o único método que você precisa escrever (além de declarar `type Item`)?',
              [
                'fn next(&mut self) -> Option<Self::Item>',
                'fn collect(&self) -> Vec<Self::Item>',
                'fn map(&mut self) -> Self::Item',
                'fn iter(&self) -> bool',
              ],
              0,
              '`Iterator` exige apenas `type Item` e `fn next(&mut self) -> Option<Self::Item>`. Adaptadores como `map`, `filter` e `take`, e consumidores como `sum` e `collect`, têm implementações padrão construídas sobre `next`.',
            ),
            mcq(
              'Por que a trait `Iterator` define `type Item;` como tipo associado em vez de ser `trait Iterator<T>`?',
              [
                'Porque cada tipo iterador fixa um único tipo de elemento, simplificando a inferência de tipos no código cliente.',
                'Porque Rust não permite traits com parâmetros genéricos.',
                'Porque tipos associados só aceitam inteiros sem sinal.',
                'Porque next() não pode retornar um enum genérico como Option.',
              ],
              0,
              'Um tipo associado restringe a implementação a uma única escolha de `Item` por tipo iterador, simplificando a inferência de tipos em cadeias de `.map(...).filter(...)`.',
            ),
            num(
              'Qual número inteiro o programa abaixo imprime?',
              12,
              '`Step { cur: 0, max: 3 }` produz `1, 2, 3`. O `.map(|x| x * 2)` transforma em `2, 4, 6`, cuja soma em `.sum::<u32>()` é `2 + 4 + 6 = 12`.',
              {
                visual: code(
                  `struct Step { cur: u32, max: u32 }
impl Iterator for Step {
    type Item = u32;
    fn next(&mut self) -> Option<u32> {
        if self.cur < self.max {
            self.cur += 1;
            Some(self.cur)
        } else {
            None
        }
    }
}
fn main() {
    let s = Step { cur: 0, max: 3 };
    let ans: u32 = s
        .map(|x| x * 2)
        .sum();
    println!("{ans}");
}`,
                  [5, 7, 16, 17],
                  'iter_map_sum.rs',
                ),
              },
            ),
            tf(
              'Depois de implementar `type Item` e `fn next` em `impl Iterator for MeuTipo`, métodos como `.take(5)`, `.filter(...)` e `.sum()` ficam disponíveis sem reimplementá-los, respeitando os limites de tipos de cada método.',
              true,
              'Esses métodos possuem implementações padrão baseadas em `next`. Ainda é preciso fornecer um predicado válido para `filter` e um tipo de resultado que implemente `Sum<Self::Item>` para `sum`.',
            ),
            match(
              'Associe cada trait da biblioteca padrão ao nome do seu tipo associado:',
              [
                ['Iterator', 'type Item'],
                ['std::ops::Add', 'type Output'],
                ['TryFrom', 'type Error'],
                ['std::ops::Deref', 'type Target'],
              ],
              'Reconhecer os tipos associados mais comuns da biblioteca padrão facilita ler assinaturas e mensagens do compilador.',
            ),
            order(
              'Ordene o que acontece em cada passo de um laço `for x in iterador`:',
              [
                'O laço chama iterador.next() passando &mut self',
                'Se next() retorna Some(v), x recebe v e o corpo executa',
                'Se next() retorna None, o laço for é encerrado',
              ],
              'O laço `for` em Rust consome um iterador chamando `next(&mut self)` repetidamente até receber `None`.',
            ),
            codePuzzle(
              'Monte a implementação de `Iterator` para `Countdown` que entrega `n, n - 1, ..., 1` e para em `0`:',
              [
                'struct Countdown { n: u32 }\nimpl Iterator for Countdown {\n    type Item = u32;\n    fn next(&mut self) -> Option<u32> {',
                '        if self.n == 0 { return None; }',
                '        let v = self.n; self.n -= 1;',
                '        Some(v) } }',
              ],
              [
                '    fn next(&self) -> Option<u32> {',
                '    type Output = u32;',
              ],
              '`Iterator` usa `type Item = u32;` e `fn next(&mut self) -> Option<u32>` (mutável para decrementar `self.n` a cada passo).',
            ),
            gen((rng) => {
              const n = randInt(rng, 3, 6);
              const k = randInt(rng, 2, 5);
              const ans = (k * n * (n + 1)) / 2;
              return num(
                'Qual número o programa abaixo imprime?',
                ans,
                `O iterador produz os múltiplos \`${k} * 1\` até \`${k} * ${n}\`. A soma é \`${k} * (1 + ... + ${n}) = ${k} * ${(n * (n + 1)) / 2} = ${ans}\`.`,
                {
                  visual: code(
                    `struct Mult { i: u32, max: u32 }
impl Iterator for Mult {
    type Item = u32;
    fn next(&mut self) -> Option<u32> {
        if self.i < self.max {
            self.i += 1;
            Some(self.i * ${k})
        } else {
            None
        }
    }
}
fn main() {
    let m = Mult { i: 0, max: ${n} };
    let s: u32 = m.sum();
    println!("{s}");
}`,
                    [6, 7, 15],
                    'mult_iter.rs',
                  ),
                },
              );
            }),
          ],
        },
      ],
    },
  ],
};

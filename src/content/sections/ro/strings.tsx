import React from 'react';
import type { UnitDef, VisualSpec } from '../../types';
import { code, fill, gen, match, mcq, multi, num, order, table, tf } from '../../helpers';
import { codePuzzle } from '../../codePractice';
import { pick, randInt } from '../../../lib/random';
import { TableView } from '../../../components/visuals/Misc';

const t = String.raw;

type StepSpec = {
  label: string;
  head: string[];
  rows: (string | number)[][];
  highlight?: number[];
  info: string;
};

const memStepper = (steps: StepSpec[]): VisualSpec => ({
  name: 'stepper',
  props: {
    steps: steps.length,
    labels: steps.map((s) => s.label),
    render: (k: number, width: number) => (
      <TableView
        width={width}
        head={steps[k].head}
        rows={steps[k].rows}
        highlight={steps[k].highlight}
      />
    ),
    info: (k: number) => steps[k].info,
  },
});

export const rustStrings: UnitDef = {
  id: 'ro-str',
  title: 'Strings e slices',
  icon: '🧵',
  subtitle: 'String vs &str, fatias de memória, UTF-8 e formatação',
  source: 'The Rust Programming Language (Ed. 2024) · Cap. 4.3 e 8.2 · Desafio 50 Dias (#4, #10, #41)',
  extra: true,
  guide: t`Em Rust, texto válido está sempre em **UTF-8** e aparece em duas formas principais:

• ` + '`**`String`**' + t`: dona do texto no **heap**, redimensionável, guardada na pilha como três palavras (` + '`(ptr, len, cap)`' + t`).
• ` + '`**`&str`**' + t`: visão emprestada somente-leitura, guardada na pilha como um **ponteiro gordo** (` + '`(ptr, len)`' + t`). Literais como ` + '`"oi"`' + t` têm tipo ` + '`&\'static str`' + t`.
• **Deref coercion**: passar ` + '`&String`' + t` onde se espera ` + '`&str`' + t` converte automaticamente sem copiar bytes.
• **Slices**: ` + '`&s[a..b]`' + t` (em bytes UTF-8 válidos) e ` + '`&v[a..b]`' + t` (` + '`&[T]`' + t`) emprestam um trecho contíguo; o *borrow checker* impede alterar a coleção original enquanto a fatia estiver viva (` + '`E0502`' + t`).
• **UTF-8**: ` + '`s[0]`' + t` não compila (` + '`E0277`' + t`); ` + '`s.len()`' + t` conta **bytes** e ` + '`s.chars().count()`' + t` conta **caracteres Unicode**.
• **Métodos e formatação**: ` + '`push`' + t`, ` + '`push_str`' + t`, ` + '`format!`' + t`, ` + '`trim`' + t`, ` + '`split`' + t`, ` + '`to_uppercase`' + t`, ` + '`parse::<T>()`' + t` e especificadores ` + '`{:>8}`' + t`, ` + '`{:.2}`' + t` e ` + '`{:08b}`' + t`.`,
  lessons: [
    {
      id: 'ro-str-string',
      title: 'String × &str',
      parts: [
        {
          card: [
            {
              title: 'Dois tipos de texto na memória',
              body: `Diferente de C, onde \`char *\` serve tanto para um literal estático quanto para memória vinda de \`malloc\`, Rust separa no sistema de tipos **quem é dono** de **quem só enxerga**:

• \`&str\` (*string slice*): visão imutável formada por \`(ptr, len)\`. Literais como \`"motor"\` ficam gravados no executável e têm tipo \`&'static str\`.
• \`String\`: dona de um buffer no **heap**, formada por \`(ptr, len, cap)\`. Pode crescer e libera sua memória sozinha no fim do escopo (\`Drop\`).`,
              visual: code(
                `fn main() {
    let fixo: &str = "motor";
    let mut s = String::from("eixo");
    s.push_str(" Z");
    println!("{fixo}: {s}");
}`,
                [2, 3, 4],
                'main.rs',
              ),
              tip: 'Em C você precisava lembrar se um char * veio de um literal ou de malloc para saber se devia chamar free. Em Rust, só String é dona do heap.',
            },
            {
              title: 'Pilha e heap: String vs &str',
              body: 'Avance pelos passos para ver como `lit: &str`, `s: String` e o empréstimo `fatia: &str = &s` ficam organizados na pilha e no heap.',
              visual: memStepper([
                {
                  label: '1. let lit: &str = "oi"',
                  head: ['Variável (pilha)', 'Campos na pilha', 'Onde estão os bytes'],
                  rows: [['lit (&str)', 'ptr | len = 2', 'Binário estático: "oi"']],
                  highlight: [0],
                  info: '`lit` é um ponteiro gordo `(ptr, len)` que aponta para `"oi"` no segmento somente-leitura do programa.',
                },
                {
                  label: '2. let s = String::from("sol")',
                  head: ['Variável (pilha)', 'Campos na pilha', 'Onde estão os bytes'],
                  rows: [
                    ['lit (&str)', 'ptr | len = 2', 'Binário estático: "oi"'],
                    ['s (String)', 'ptr | len = 3 | cap = 3', 'Heap (dona): ["s", "o", "l"]'],
                  ],
                  highlight: [1],
                  info: '`s` aloca 3 bytes no heap e guarda `(ptr, len, cap)` na pilha. Quando `s` sair de escopo, o heap será liberado.',
                },
                {
                  label: '3. let fatia: &str = &s',
                  head: ['Variável (pilha)', 'Campos na pilha', 'Onde estão os bytes'],
                  rows: [
                    ['lit (&str)', 'ptr | len = 2', 'Binário estático: "oi"'],
                    ['s (String)', 'ptr | len = 3 | cap = 3', 'Heap (dona): ["s", "o", "l"]'],
                    ['fatia (&str)', 'ptr | len = 3', 'Empresta o heap de s (sem copiar)'],
                  ],
                  highlight: [2],
                  info: '`fatia` aponta para o mesmo texto de `s` no heap sem copiar bytes e sem tomar a posse.',
                },
              ]),
            },
          ],
          exercises: [
            mcq(
              'Qual é o tipo de um literal de texto como `"ativo"` escrito diretamente no código-fonte em Rust?',
              [
                "&str (mais especificamente, &'static str)",
                'String alocada no heap',
                'char de tamanho variável',
                'Vec<u8> mutável na pilha',
              ],
              0,
              'Literais entre aspas duplas ficam embutidos no binário do programa e são enxergados por uma referência imutável `&str` com tempo de vida `\'static`.',
            ),
            tf(
              'Uma variável do tipo `String` é dona do seu buffer no heap e libera essa memória automaticamente ao sair de escopo.',
              true,
              'A `String` aplica a regra de ownership (RAII): ao final do escopo da variável dona, o compilador insere a chamada de `Drop`, evitando vazamentos de memória.',
            ),
            mcq(
              'O que acontece ao tentar compilar este programa?',
              [
                'Erro E0382 na linha 4: a posse de a foi movida para b na linha 3',
                'Imprime placa normalmente, pois String implementa Copy',
                'Erro E0596 na linha 2: falta a palavra-chave mut em a',
                'Compila, mas duplica os bytes de placa no heap automaticamente',
              ],
              0,
              'Como `String` é dona de memória no heap, ela não implementa `Copy`. Fazer `let b = a;` move a posse para `b` e invalida `a`, gerando `error[E0382]: borrow of moved value: \`a\`` na linha 4.',
              {
                visual: code(
                  `fn main() {
    let a = String::from("placa");
    let b = a;
    println!("{a}");
}`,
                  [3, 4],
                  'Move de String',
                ),
              },
            ),
            match(
              'Associe cada tipo ou operação em Rust ao seu papel na memória:',
              [
                ['&str', 'Visão emprestada somente-leitura (ptr, len)'],
                ['String', 'Dona do texto redimensionável no heap (ptr, len, cap)'],
                ['String::from("ok")', 'Cria uma String no heap a partir de um &str'],
                ['s.clone()', 'Duplica os bytes no heap criando uma nova String'],
              ],
              '`&str` apenas referencia um texto existente; `String` possui o buffer no heap; `String::from` aloca no heap e `.clone()` faz cópia profunda explícita.',
            ),
            fill(
              'Complete a declaração para criar no heap uma `String` que possa receber novos caracteres depois:',
              'let ___ s = ___::from("ok");',
              ['mut', 'String'],
              ['&str', 'const', 'str'],
              'Variáveis em Rust são imutáveis por padrão: precisamos de `let mut s` e do construtor `String::from(...)`.',
            ),
            num(
              'Em uma arquitetura de 64 bits (onde cada ponteiro ou `usize` ocupa 8 bytes), quantos bytes o cabeçalho de uma `String` ocupa na **pilha** (sem contar os bytes do texto no heap)?',
              24,
              'Na pilha, a `String` guarda exatamente 3 palavras de 8 bytes (`ptr`, `len` e `cap`), totalizando $3 \\times 8 = 24$ bytes. Já um `&str` guarda apenas `ptr` e `len` ($2 \\times 8 = 16$ bytes).',
              {
                visual: table(
                  ['Tipo', 'Campos na pilha', 'Palavras (64 bits)'],
                  [
                    ['&str', 'ptr, len', '2 × 8 B = 16 B'],
                    ['String', 'ptr, len, cap', '3 × 8 B'],
                  ],
                  [1],
                ),
              },
            ),
            gen((rng) => {
              const a = randInt(rng, 2, 6);
              const b = randInt(rng, 3, 8);
              const txt = 'x'.repeat(a);
              return num(
                'Qual número inteiro é impresso na saída deste programa?',
                a + b,
                `O literal \`"${txt}"\` tem ${a} letras ASCII de 1 byte, logo \`s.len()\` vale ${a}. Somando ${b}, o programa imprime $${a} + ${b} = ${a + b}$.`,
                {
                  visual: code(
                    `fn main() {
    let s = String::from("${txt}");
    let total = s.len() + ${b};
    println!("{total}");
}`,
                    [2, 3],
                    'Tamanho em bytes',
                  ),
                },
              );
            }),
            codePuzzle(
              'Monte a função `main` que cria uma `String` com `"sensor"` no heap, empresta uma visão `&str` em `fatia` sem mover a posse e imprime as duas variáveis.',
              [
                'fn main() {',
                '    let s = String::from("sensor");',
                '    let fatia: &str = &s;',
                '    println!("{s} -> {fatia}");',
                '}',
              ],
              [
                '    let fatia: String = s;',
                '    let s: &str = String::from("sensor");',
              ],
              'Primeiro criamos a dona `s` no heap; depois tomamos o empréstimo `&s` em `fatia: &str`, o que mantém `s` válida para o `println!`.',
            ),
          ],
        },
        {
          card: [
            {
              title: 'Crescendo texto: push, push_str, format! e coerção',
              body: `Para alterar uma \`String\`, a variável precisa ser \`mut\`:

• \`s.push('!')\`: acrescenta **um único \`char\`** (aspas simples).
• \`s.push_str("fim")\`: acrescenta uma fatia **\`&str\`** (aspas duplas) sem tomar posse do argumento.
• \`format!("{a}-{b}")\`: monta uma nova \`String\` **emprestando** \`a\` e \`b\`, ao contrário de \`a + &b\`, que move \`a\`.
• **Deref coercion**: como \`String\` implementa \`Deref<Target = str>\`, passar \`&minha_string\` para \`fn exibir(msg: &str)\` converte para \`&str\` automaticamente.`,
              visual: code(
                `fn exibir(msg: &str) {
    println!("[{msg}]");
}

fn main() {
    let mut s = String::from("V");
    s.push('=');
    s.push_str("12V");
    let log = format!("OK: {s}");
    exibir(&log);
    exibir("fim");
}`,
                [1, 7, 8, 9, 10],
                'Coerção e format!',
              ),
              tip: 'Prefira declarar parâmetros de leitura como msg: &str em vez de msg: &String. Assim a função aceita tanto &String quanto literais "texto" e fatias.',
            },
            {
              title: 'Comparativo: formas de juntar texto',
              body: 'Compare o tipo aceito e o efeito sobre a posse (*ownership*) em cada operação com strings.',
              visual: table(
                ['Operação', 'Argumento', 'Move variáveis?'],
                [
                  ["s.push('x')", '1 char (aspas simples)', 'Não (altera mut s)'],
                  ['s.push_str("xy")', '&str (aspas duplas)', 'Não (só empresta)'],
                  ['a + &b', 'String + &str', 'Sim: move a (1º operando)'],
                  ['format!("{a}{b}")', 'Qualquer Display', 'Não: só empresta a e b'],
                ],
                [2, 3],
              ),
            },
            {
              title: 'No seu computador',
              body: `**Desafio (Roteiro #4 e #8):** Crie um projeto com \`cargo new etiquetas\` e implemente duas funções:

• \`fn anexar_unidade(medida: &mut String, un: &str)\`, que usa \`push(' ')\` e \`push_str(un)\`.
• \`fn resumir(nome: &str, valor: &str) -> String\`, que usa \`format!("{nome}: {valor}")\`.

No \`main\`, crie \`let mut v = String::from("12");\`, chame \`anexar_unidade(&mut v, "V")\`, passe \`&v\` para \`resumir("Tensao", &v)\` (veja a *deref coercion* atuando!) e imprima o resultado.`,
              visual: code(
                `cargo new etiquetas
cd etiquetas
cargo run
cargo clippy -- -D warnings`,
                [3, 4],
                'Terminal',
              ),
              tip: 'Critério de pronto: cargo run imprime exatamente "Tensao: 12 V" e cargo clippy -- -D warnings termina sem nenhum aviso.',
            },
          ],
          exercises: [
            mcq(
              'Qual é a diferença entre `s.push(...)` e `s.push_str(...)` em uma `String` mutável?',
              [
                "push acrescenta um único char ('a') e push_str acrescenta uma fatia &str (\"abc\")",
                'push aloca uma nova String e push_str altera na pilha',
                'push toma posse do argumento e push_str move a String original',
                'push aceita números inteiros e push_str só aceita letras',
              ],
              0,
              '`push` recebe um único caractere Unicode (`char`, entre aspas simples), enquanto `push_str` recebe uma fatia de texto `&str` (entre aspas duplas).',
            ),
            tf(
              'Declarar um parâmetro como `msg: &str` permite chamar a função tanto com um literal `"ok"` quanto com `&s` (onde `s` é uma `String`), graças à *deref coercion*.',
              true,
              'O compilador converte `&String` em `&str` automaticamente porque `String` implementa a trait `Deref<Target = str>`.',
            ),
            mcq(
              'Por que este programa falha ao compilar?',
              [
                'Erro E0596 na linha 3: s não foi declarada como let mut s',
                'Erro E0308 na linha 3: push_str exige aspas simples',
                'Erro E0382 na linha 4: push_str moveu a variável s',
                'Erro E0277 na linha 4: String não pode ser impressa com {}',
              ],
              0,
              '`push_str` precisa de um empréstimo mutável (`&mut self`). Sem `let mut s`, o compilador recusa com `error[E0596]: cannot borrow \`s\` as mutable, as it is not declared as mutable`.',
              {
                visual: code(
                  `fn main() {
    let s = String::from("modo");
    s.push_str(": auto");
    println!("{s}");
}`,
                  [2, 3],
                  'Falta de mut',
                ),
              },
            ),
            mcq(
              'O que acontece ao compilar este trecho que concatena textos com o operador `+`?',
              [
                'Erro E0382 na linha 5: o operador + move a posse de a para construir c',
                'Erro E0382 na linha 5: &b foi movida e não pode mais ser lida',
                'Compila e imprime on -> online',
                'Erro E0308 na linha 4: o operador + não existe para String',
              ],
              0,
              'Em Rust, `a + &b` chama `fn add(self, s: &str) -> String`: ele toma posse do primeiro operando (`a`), reaproveita seu buffer e o invalida (`error[E0382]: borrow of moved value: \`a\``).',
              {
                visual: code(
                  `fn main() {
    let a = String::from("on");
    let b = String::from("line");
    let c = a + &b;
    println!("{a} -> {c}");
}`,
                  [4, 5],
                  'Operador + em String',
                ),
              },
            ),
            fill(
              'Complete a linha para montar uma nova `String` combinando `prefixo` e `numero` **sem** mover nenhuma das duas variáveis:',
              'let codigo = ___("{prefixo}-{numero}");',
              ['format!'],
              ['println!', 'push_str', 'String::from'],
              'A macro `format!` funciona como `println!`, mas devolve uma nova `String` alocada no heap e apenas empresta os argumentos.',
            ),
            match(
              'Associe cada erro ou chamada ao comportamento correspondente do compilador:',
              [
                ["s.push(\"!\")", 'Erro E0308: esperado char (\'!\'), encontrado &str ("!")'],
                ['s.push_str(\'!\')', 'Erro E0308: esperado &str ("!"), encontrado char (\'!\')'],
                ['let c = a + &b;', 'Move a (invalidando-a) e apenas empresta b'],
                ['let c = format!("{a}{b}");', 'Empresta a e b; ambas continuam válidas depois'],
              ],
              'Aspas simples (`\'!\'`) criam `char` para `push`; aspas duplas (`"!"`) criam `&str` para `push_str`; `format!` evita mover as variáveis originais.',
            ),
            gen((rng) => {
              const base = pick(rng, ['id', 'pino', 'canal', 'sensor'] as const);
              const k = randInt(rng, 1, 4);
              const sufixo = 'x'.repeat(k);
              const ans = base.length + 1 + k;
              return num(
                'Qual valor inteiro é impresso na saída deste programa (todos os caracteres são ASCII de 1 byte)?',
                ans,
                `\`s\` começa com \`"${base}"\` (${base.length} bytes), recebe \`':'\` (+1 byte com \`push\`) e depois \`"${sufixo}"\` (+${k} bytes com \`push_str\`), totalizando $${base.length} + 1 + ${k} = ${ans}$ bytes.`,
                {
                  visual: code(
                    `fn main() {
    let mut s = String::from("${base}");
    s.push(':');
    s.push_str("${sufixo}");
    println!("{}", s.len());
}`,
                    [2, 3, 4],
                    'Crescimento da String',
                  ),
                },
              );
            }),
            codePuzzle(
              'Monte o programa que cria a `String` mutável `"R"`, anexa `"10"` com `push_str`, guarda o tamanho atual em `n`, acrescenta o caractere `\'0\'` com `push` e formata `"{s} ({n})"` antes de imprimir.',
              [
                'fn main() {',
                '    let mut s = String::from("R");',
                '    s.push_str("10");',
                '    let n = s.len();',
                "    s.push('0');",
                '    let msg = format!("{s} ({n})");',
                '    println!("{msg}");',
                '}',
              ],
              [
                '    let s = String::from("R");',
                '    s.push("0");',
              ],
              '`s` precisa ser `mut`; `push_str("10")` leva `s` para `"R10"` (`n = 3`), `push(\'0\')` completa `"R100"` e `format!` monta `"R100 (3)"`.',
            ),
          ],
        },
      ],
    },
    {
      id: 'ro-str-slice',
      title: 'Slices de strings e de arrays',
      parts: [
        {
          card: [
            {
              title: 'Fatias: referências para um trecho contíguo',
              body: `Uma **slice** (fatia) referencia uma sequência contígua de elementos dentro de uma coleção, **sem copiar** dados:

• Em texto: \`&s[a..b]\` tem tipo \`&str\` e aponta do byte \`a\` (incluso) até \`b\` (**excluso**), com tamanho \`b - a\`.
• Atalhos de intervalo: \`&s[..b]\` (do início a \`b\`), \`&s[a..]\` (de \`a\` ao fim) e \`&s[..]\` (tudo).
• Em arrays e \`Vec<T>\`: \`&v[1..4]\` tem tipo \`&[i32]\` e enxerga os elementos de índices 1, 2 e 3.`,
              visual: code(
                `fn main() {
    let s = String::from("motor_1");
    let nome: &str = &s[..5];
    let v = [10, 20, 30, 40, 50];
    let meio: &[i32] = &v[1..4];
    println!("{nome} {:?}", meio);
}`,
                [3, 5],
                'Slices de texto e array',
              ),
              tip: 'Para incluir também o índice final b, Rust oferece o intervalo inclusivo &v[a..=b], que tem b - a + 1 elementos.',
            },
            {
              title: 'Inspecionando fatias de um array',
              body: 'Use os botões para ver para onde o ponteiro gordo `(ptr, len)` aponta em diferentes fatias de `v = [10, 20, 30, 40, 50]`.',
              visual: memStepper([
                {
                  label: '1. Array original v',
                  head: ['Índice', '0', '1', '2', '3', '4'],
                  rows: [['Valor em v', 10, 20, 30, 40, 50]],
                  highlight: [0],
                  info: '`v` tem tipo `[i32; 5]` e guarda os 5 inteiros contíguos na memória (índices 0 a 4).',
                },
                {
                  label: '2. Fatia &v[1..4]',
                  head: ['Fatia', 'ptr aponta para', 'len', 'Elementos visíveis'],
                  rows: [['&v[1..4]', 'v[1] (valor 20)', 3, '[20, 30, 40]']],
                  highlight: [0],
                  info: 'O índice 1 entra e o índice 4 fica de fora: `len = 4 - 1 = 3` elementos (`20, 30, 40`).',
                },
                {
                  label: '3. Fatia &v[3..]',
                  head: ['Fatia', 'ptr aponta para', 'len', 'Elementos visíveis'],
                  rows: [['&v[3..]', 'v[3] (valor 40)', 2, '[40, 50]']],
                  highlight: [0],
                  info: 'Omitir o fim (`3..`) vai do índice 3 até o final do array: `len = 5 - 3 = 2` elementos (`40, 50`).',
                },
              ]),
            },
          ],
          exercises: [
            mcq(
              'O que é impresso na saída deste programa?',
              ['ten', 'tens', 'ens', 'tesa'],
              0,
              'O intervalo `0..3` pega os bytes de índices `0`, `1` e `2` (3 bytes no total, parando antes do índice 3): `"ten"`.',
              {
                visual: code(
                  `fn main() {
    let texto = String::from("tensao");
    let parte = &texto[0..3];
    println!("{parte}");
}`,
                  [3],
                  'Fatia 0..3',
                ),
              },
            ),
            tf(
              'Na sintaxe de intervalo `&v[a..b]`, o índice inicial `a` é incluído e o índice final `b` fica de fora, resultando em `b - a` elementos.',
              true,
              'Intervalos `a..b` são semiabertos $[a,\\,b)$: começam em `a` e param imediatamente antes de `b`, logo contêm $b - a$ posições.',
            ),
            mcq(
              'Se `v` é um array `[i32; 6]` (ou um `Vec<i32>`), qual é o tipo da expressão `&v[2..5]`?',
              ['&[i32]', '[i32; 3]', 'Vec<i32>', '&i32'],
              0,
              'Fatiar um array `[T; N]` ou um `Vec<T>` com `&v[a..b]` produz sempre uma slice `&[T]`, aqui `&[i32]`.',
            ),
            match(
              'Considere `let s = "abcdef";` (índices 0 a 5). Associe cada fatia ao texto resultante:',
              [
                ['&s[..2]', '"ab" (do início até antes do índice 2)'],
                ['&s[2..5]', '"cde" (índices 2, 3 e 4)'],
                ['&s[4..]', '"ef" (do índice 4 até o fim)'],
                ['&s[..]', '"abcdef" (a string inteira)'],
              ],
              'Omitir o início equivale a `0`; omitir o fim equivale a `s.len()`; omitir ambos referencia a string completa.',
            ),
            fill(
              'Dado `let leituras = [12, 15, 18, 21, 24];`, complete a expressão com intervalo semiaberto `a..b` para obter a fatia `[15, 18, 21]` (índices 1, 2 e 3):',
              'let janela: &[i32] = &leituras[___..___];',
              ['1', '4'],
              ['0', '3', '2'],
              'O elemento `15` está no índice `1` e queremos incluir até o índice `3` (`21`), então o limite exclusivo superior é `3 + 1 = 4`: `&leituras[1..4]`.',
            ),
            mcq(
              'A linha 3 usa o operador de intervalo inclusivo `1..=2`. O que este programa imprime?',
              ['[10, 15]', '[10]', '[5, 10, 15]', '[15, 20]'],
              0,
              'Com `..=`, o limite direito também entra na fatia: `1..=2` seleciona os índices 1 e 2, que valem `10` e `15`.',
              {
                visual: code(
                  `fn main() {
    let v = [5, 10, 15, 20];
    let s = &v[1..=2];
    println!("{:?}", s);
}`,
                  [3],
                  'Intervalo inclusivo',
                ),
              },
            ),
            gen((rng) => {
              const a = randInt(rng, 0, 2);
              const tam = randInt(rng, 2, 3);
              const b = a + tam;
              const vals = [10, 20, 30, 40, 50, 60];
              const ans = vals[a] + tam;
              return num(
                'Qual número é impresso na saída deste programa?',
                ans,
                `A fatia \`&v[${a}..${b}]\` começa em \`v[${a}] = ${vals[a]}\`, logo \`f[0]\` é ${vals[a]}. Como o tamanho \`f.len()\` é $${b} - ${a} = ${tam}$, a soma impressa é $${vals[a]} + ${tam} = ${ans}$.`,
                {
                  visual: code(
                    `fn main() {
    let v = [10, 20, 30, 40, 50, 60];
    let f = &v[${a}..${b}];
    println!("{}", f[0] + f.len());
}`,
                    [3, 4],
                    'Fatia de array',
                  ),
                },
              );
            }),
            codePuzzle(
              'Monte a função `soma_dois` que recebe uma fatia de inteiros `&[i32]`, cria a subfatia `par` com os dois primeiros elementos (`..2`), calcula a soma em `total` e a retorna.',
              [
                'fn soma_dois(v: &[i32]) -> i32 {',
                '    let par = &v[..2];',
                '    let total = par[0] + par[1];',
                '    total',
                '}',
              ],
              [
                '    let par = v[..2];',
                '    total;',
              ],
              'Para criar uma subfatia é obrigatório emprestar com `&v[..2]`; e a última linha da função retorna `total` sem ponto e vírgula.',
            ),
          ],
        },
        {
          card: [
            {
              title: 'Por que uma slice trava alterações no dono',
              body: `No capítulo 4.3 do livro (e no exercício 10 do roteiro), escrevemos uma função que devolve uma fatia \`&str\` apontando para dentro de uma \`String\`.

Como a fatia é um **empréstimo imutável** (\`&s\`) do buffer original, a regra dos empréstimos vale por completo: enquanto a fatia ainda for usada mais adiante, você **não pode** pedir \`&mut s\` (por exemplo, com \`s.clear()\` ou \`s.push_str()\`). O compilador barra com o erro **E0502**.`,
              visual: code(
                `fn inicio(s: &str) -> &str {
    &s[..3]
}

fn main() {
    let mut s = String::from("valvula");
    let p = inicio(&s);
    // s.clear(); // ERRO E0502!
    println!("{p}");
}`,
                [7, 8, 9],
                'Fatia viva vs clear()',
              ),
              tip: 'Em C ou C++, apagar ou realocar a string antes de imprimir p deixaria um ponteiro pendurado (dangling pointer). Em Rust, o erro aparece antes de rodar.',
            },
            {
              title: 'Tempo de vida do empréstimo da fatia (NLL)',
              body: 'Veja na tabela por que `s.clear()` antes de `println!("{p}")` falha com `E0502`, mas `s.clear()` **depois** do último uso de `p` compila normalmente.',
              visual: table(
                ['Linha executada', 'Empréstimo em p', 'Status no compilador'],
                [
                  ['let mut s = String::from("motor");', 'nenhum', 'OK (dona mutável)'],
                  ['let p = &s[..5];', '&s ativo', 'OK (empréstimo imutável)'],
                  ['s.clear(); // se vier AQUI', '&s ativo + &mut s', 'ERRO E0502 (conflito!)'],
                  ['println!("{p}");', 'último uso de p', 'OK (encerra &s após esta linha)'],
                  ['s.clear(); // se vier AQUI', 'nenhum ativo', 'OK (&mut s liberado!)'],
                ],
                [2, 4],
              ),
            },
            {
              title: 'No seu computador',
              body: `**Desafio (Roteiro #10 — Slices):** Crie um projeto com \`cargo new fatias\` e escreva \`fn primeira_palavra(s: &str) -> &str\`, que percorre \`for (i, b) in s.bytes().enumerate()\` e devolve \`&s[..i]\` ao achar \`b == b' '\`, ou \`s\` inteira no fim.

No \`main\`, crie \`let mut texto = String::from("motor ligado");\`, guarde \`let p = primeira_palavra(&texto);\`, imprima \`p\` e **depois** chame \`texto.clear()\`. Teste também mover \`texto.clear()\` para antes do \`println!\` para ler o erro \`E0502\` no terminal.`,
              visual: code(
                `fn primeira_palavra(s: &str) -> &str {
    for (i, b) in s.bytes().enumerate() {
        if b == b' ' {
            return &s[..i];
        }
    }
    s
}`,
                [2, 3, 4],
                'src/main.rs',
              ),
              tip: 'Critério de pronto: com texto.clear() após o println!, cargo run imprime "motor" e cargo clippy -- -D warnings passa sem avisos.',
            },
          ],
          exercises: [
            tf(
              'Uma fatia `&s[0..4]` faz uma cópia independente dos 4 bytes no heap; por isso `s.clear()` pode ser chamado antes de imprimir a fatia.',
              false,
              'Uma slice **não** copia os dados: ela apenas aponta para o buffer de `s`. Se `s.clear()` apagasse o buffer enquanto a fatia ainda é usada, a fatia ficaria inválida — por isso o compilador proíbe.',
            ),
            mcq(
              'Qual erro o compilador aponta ao analisar este programa?',
              [
                'Erro E0502 na linha 4: s.clear() pede &mut s enquanto p ainda empresta &s até a linha 5',
                'Erro E0382 na linha 5: p foi movido para dentro de s.clear()',
                'Erro E0277 na linha 3: não é permitido fatiar uma String mutável',
                'Nenhum erro: o programa compila e imprime bomba',
              ],
              0,
              '`let p = &s[0..5];` empresta `s` de forma imutável, e `s.clear()` tenta pegar `&mut s` antes do `println!("{p}")`. O compilador emite `error[E0502]: cannot borrow \`s\` as mutable because it is also borrowed as immutable`.',
              {
                visual: code(
                  `fn main() {
    let mut s = String::from("bomba 1");
    let p = &s[0..5];
    s.clear();
    println!("{p}");
}`,
                  [3, 4, 5],
                  'Conflito de empréstimo',
                ),
              },
            ),
            mcq(
              'Agora `s.clear()` foi movido para **depois** do último uso de `p`. O que acontece?',
              [
                'Compila e imprime bomba seguido de tam=0',
                'Continua falhando com erro E0502 na linha 5',
                'Falha em execução (panic!) ao chamar s.clear()',
                'Compila e imprime bomba seguido de tam=7',
              ],
              0,
              'Pela regra de *Non-Lexical Lifetimes* (NLL), o empréstimo imutável `p` termina na linha 4 (seu último uso). Na linha 5 não há mais empréstimos ativos, então `s.clear()` funciona e zera o tamanho.',
              {
                visual: code(
                  `fn main() {
    let mut s = String::from("bomba 1");
    let p = &s[0..5];
    println!("{p}");
    s.clear();
    println!("tam={}", s.len());
}`,
                  [4, 5],
                  'Empréstimo encerrado',
                ),
              },
            ),
            fill(
              'Complete a assinatura idiomática de `primeira_palavra` (capítulo 4.3 do livro) para que ela aceite tanto `&String` quanto `&str` e devolva uma fatia ligada ao texto recebido:',
              'fn primeira_palavra(s: ___) -> ___',
              ['&str', '&str'],
              ['String', '&mut String', 'char'],
              'Receber `s: &str` aproveita a *deref coercion* e retornar `&str` devolve uma fatia emprestada da mesma string de entrada.',
            ),
            order(
              'Ordene o raciocínio do *borrow checker* ao recusar `let p = &s[..3]; s.clear(); println!("{p}");`:',
              [
                '&s[..3] cria um empréstimo imutável (&s) guardado em p',
                'O empréstimo de p precisa permanecer vivo até o println!("{p}")',
                's.clear() tenta criar um empréstimo mutável (&mut s) durante esse intervalo',
                'O compilador recusa com E0502 por haver &s e &mut s ativos ao mesmo tempo',
              ],
              'A verificação segue a linha de vida do empréstimo: criação em `&s[..3]`, exigência de validade até o `println!`, tentativa de `&mut s` em `clear()` e bloqueio com `E0502`.',
            ),
            mcq(
              '(Roteiro #9) Por que esta função que tenta devolver uma fatia `&str` de uma `String` criada dentro dela não compila?',
              [
                'Porque s é destruída no fim da função e a fatia apontaria para memória já liberada',
                'Porque o intervalo 0..3 exige que a String seja declarada como mut',
                'Porque faltou a palavra-chave return na linha 3',
                'Porque funções em Rust nunca podem retornar o tipo &str',
              ],
              0,
              '`s` pertence ao escopo de `fazer_fatia` e sofre `Drop` ao fechar a chave `}`. Retornar `&s[0..3]` criaria uma referência pendurada (*dangling reference*), barrada pelo compilador (`E0106` / `E0515`). Para devolver texto novo criado na função, retorne `String`.',
              {
                visual: code(
                  `fn fazer_fatia() -> &str {
    let s = String::from("local");
    &s[0..3]
}`,
                  [1, 2, 3],
                  'Referência pendurada',
                ),
              },
            ),
            gen((rng) => {
              const w1 = pick(rng, ['motor', 'valvula', 'sensor', 'bateria'] as const);
              const w2 = pick(rng, ['ativo', 'pronto', 'ligado', 'ok'] as const);
              return num(
                'Qual número inteiro é impresso na saída deste programa?',
                w2.length,
                `A função \`ate_espaco\` encontra o espaço no índice \`pos = ${w1.length}\` (tamanho de \`"${w1}"\`). A fatia \`&txt[pos + 1..]\` pega o texto após o espaço (\`"${w2}"\`), cujo comprimento em bytes é ${w2.length}.`,
                {
                  visual: code(
                    `fn ate_espaco(s: &str) -> usize {
    for (i, b) in s.bytes().enumerate() {
        if b == b' ' {
            return i;
        }
    }
    s.len()
}

fn main() {
    let txt = "${w1} ${w2}";
    let pos = ate_espaco(txt);
    println!("{}", txt[pos + 1..].len());
}`,
                    [11, 12, 13],
                    'Recorte após o espaço',
                  ),
                },
              );
            }),
            codePuzzle(
              'Monte a sequência no `main` que cria `s` mutável, tira a fatia `p` dos 5 primeiros bytes, imprime `p` enquanto o empréstimo está ativo e **só depois** limpa `s` com `clear()` e imprime o novo tamanho.',
              [
                'let mut s = String::from("motor 1");',
                'let p = &s[..5];',
                'println!("antes: {p}");',
                's.clear();',
                'println!("depois: {}", s.len());',
              ],
              [
                'let s = String::from("motor 1");',
                'let p = s[..5];',
              ],
              '`p` precisa ser impressa antes de `s.clear()` para encerrar o empréstimo imutável `&s` antes do empréstimo mutável `&mut s`.',
            ),
          ],
        },
      ],
    },
    {
      id: 'ro-str-utf8',
      title: 'UTF-8: bytes, chars e índices',
      parts: [
        {
          card: [
            {
              title: 'UTF-8 na prática: len() em bytes vs chars().count()',
              body: `Em Rust, toda \`String\` e todo \`&str\` guardam texto codificado em **UTF-8**. Nessa codificação, cada caractere ocupa de **1 a 4 bytes**:

• ASCII (\`'a'\`, \`'7'\`, \`'_'\`): **1 byte**
• Letras latinas acentuadas e \`'ç'\` (\`'ã'\`, \`'ç'\`, \`'é'\`, \`'ó'\`): **2 bytes**
• Símbolos e ideogramas comuns (\`'€'\`, \`'→'\`): **3 bytes**
• Emojis (\`'🦀'\`, \`'🧵'\`): **4 bytes**

Por isso, \`s.len()\` devolve o número de **bytes**, enquanto \`s.chars().count()\` conta quantos **valores escalares Unicode (\`char\`)** existem na string.`,
              visual: code(
                `fn main() {
    let s = "ação";
    println!("bytes: {}", s.len());
    println!("chars: {}", s.chars().count());
}`,
                [2, 3, 4],
                'Bytes vs chars',
              ),
              tip: 'Em "ação", \'a\' e \'o\' ocupam 1 byte cada, mas \'ç\' e \'ã\' ocupam 2 bytes cada: s.len() vale 1 + 2 + 2 + 1 = 6 bytes, enquanto s.chars().count() vale 4.',
            },
            {
              title: 'Mapa de bytes de "ação" em UTF-8',
              body: 'Avance pelos 4 caracteres de `"ação"` para ver como os 6 bytes se distribuem na memória.',
              visual: memStepper([
                {
                  label: "1. Caractere 'a' (1 byte)",
                  head: ['Caractere', 'Índices de byte', 'Bytes em hex', 'Acumulado (len / chars)'],
                  rows: [["'a' (ASCII)", '0..1', '0x61', '1 byte / 1 char']],
                  highlight: [0],
                  info: "`'a'` faz parte da tabela ASCII e ocupa apenas o byte de índice `0`.",
                },
                {
                  label: "2. Caractere 'ç' (2 bytes)",
                  head: ['Caractere', 'Índices de byte', 'Bytes em hex', 'Acumulado (len / chars)'],
                  rows: [
                    ["'a' (ASCII)", '0..1', '0x61', '1 byte / 1 char'],
                    ["'ç' (UTF-8 2B)", '1..3', '0xC3 0xA7', '3 bytes / 2 chars'],
                  ],
                  highlight: [1],
                  info: "`'ç'` ocupa 2 bytes em UTF-8 (índices `1` e `2`). O acumulado vai a 3 bytes para apenas 2 caracteres.",
                },
                {
                  label: "3. Caractere 'ã' (2 bytes)",
                  head: ['Caractere', 'Índices de byte', 'Bytes em hex', 'Acumulado (len / chars)'],
                  rows: [
                    ["'a' (ASCII)", '0..1', '0x61', '1 byte / 1 char'],
                    ["'ç' (UTF-8 2B)", '1..3', '0xC3 0xA7', '3 bytes / 2 chars'],
                    ["'ã' (UTF-8 2B)", '3..5', '0xC3 0xA3', '5 bytes / 3 chars'],
                  ],
                  highlight: [2],
                  info: "`'ã'` também ocupa 2 bytes (índices `3` e `4`). Agora temos 5 bytes acumulados e 3 caracteres.",
                },
                {
                  label: "4. Caractere 'o' (1 byte)",
                  head: ['Caractere', 'Índices de byte', 'Bytes em hex', 'Acumulado (len / chars)'],
                  rows: [
                    ["'a' (ASCII)", '0..1', '0x61', '1 byte / 1 char'],
                    ["'ç' (UTF-8 2B)", '1..3', '0xC3 0xA7', '3 bytes / 2 chars'],
                    ["'ã' (UTF-8 2B)", '3..5', '0xC3 0xA3', '5 bytes / 3 chars'],
                    ["'o' (ASCII)", '5..6', '0x6F', '6 bytes / 4 chars'],
                  ],
                  highlight: [3],
                  info: "`'o'` ocupa o byte `5`. No total, `\"ação\".len()` é 6 e `\"ação\".chars().count()` é 4!",
                },
              ]),
            },
          ],
          exercises: [
            mcq(
              'O que o método `s.len()` retorna quando chamado em uma `String` ou `&str`?',
              [
                'A quantidade de bytes que o texto ocupa em UTF-8',
                'A quantidade de letras visíveis (contando acentuadas como 1)',
                'A capacidade total alocada no heap em palavras de 64 bits',
                'O índice do caractere nulo terminador \\0',
              ],
              0,
              '`s.len()` retorna sempre o comprimento em **bytes** da representação UTF-8 (e strings em Rust não usam `\\0` terminador como em C).',
            ),
            num(
              'Em UTF-8, `\'c\'`, `\'a\'` e `\'f\'` ocupam 1 byte cada, e `\'é\'` ocupa 2 bytes. Que número este programa imprime?',
              5,
              'Somando os bytes de cada caractere de `"café"`: $1 + 1 + 1 + 2 = 5$ bytes.',
              {
                visual: code(
                  `fn main() {
    let s = "café";
    println!("{}", s.len());
}`,
                  [2, 3],
                  'Bytes de "café"',
                ),
              },
            ),
            num(
              'E o que é impresso quando usamos `s.chars().count()` na mesma palavra `"café"`?',
              4,
              '`s.chars()` percorre os valores escalares Unicode (`\'c\'`, `\'a\'`, `\'f\'`, `\'é\'`), portanto `.count()` devolve `4`.',
              {
                visual: code(
                  `fn main() {
    let s = "café";
    println!("{}", s.chars().count());
}`,
                  [3],
                  'Chars de "café"',
                ),
              },
            ),
            tf(
              'Um valor isolado do tipo `char` em Rust (como `\'ã\'` ou `\'🦀\'`) tem tamanho fixo de 4 bytes na memória, mesmo que dentro de uma `String` UTF-8 os caracteres ocupem de 1 a 4 bytes.',
              true,
              'Na memória, um `char` representa um valor escalar Unicode completo de 32 bits (4 bytes). Já dentro de `String` / `&str`, o texto usa a codificação compacta UTF-8 de largura variável (1 a 4 bytes por caractere).',
            ),
            match(
              'Associe cada literal de string ao seu par `(s.len(), s.chars().count())` em UTF-8:',
              [
                ['"sol"', '3 bytes e 3 chars'],
                ['"pão"', '4 bytes e 3 chars'],
                ['"ação"', '6 bytes e 4 chars'],
                ['"🦀"', '4 bytes e 1 char'],
              ],
              '`"sol"` tem só ASCII (3 B); `"pão"` tem 1 acento de 2 B (1+2+1 = 4 B); `"ação"` tem `ç` e `ã` de 2 B (1+2+2+1 = 6 B); o emoji `"🦀"` é 1 `char` de 4 bytes.',
            ),
            fill(
              '(Roteiro #4) Para inverter uma palavra com acentos como `"ação"` sem quebrar os caracteres multibyte, encadeamos o iterador de caracteres, `rev()` e `collect()`:',
              'let inv: String = s.___().rev().___();',
              ['chars', 'collect'],
              ['bytes', 'len', 'split'],
              'Inverter `bytes()` quebraria os pares de bytes de `ç` e `ã`; `s.chars().rev().collect::<String>()` inverte na unidade certa (`char`) e produz `"oãça"`.',
            ),
            gen((rng) => {
              const [palavra, nChars, nBytes] = pick(
                rng,
                [
                  ['pão', 3, 4],
                  ['café', 4, 5],
                  ['ação', 4, 6],
                  ['avião', 5, 6],
                  ['maçã', 4, 6],
                  ['coração', 7, 9],
                  ['órgão', 5, 7],
                ] as const,
              );
              const k = randInt(rng, 1, 4);
              const sufixo = 'x'.repeat(k);
              const ans = nBytes + 1 + k;
              return num(
                `Lembrando que letras sem acento e \`'_'\` ocupam 1 byte e cada letra acentuada ou \`'ç'\` ocupa 2 bytes em UTF-8, qual número este programa imprime?`,
                ans,
                `A palavra \`"${palavra}"\` tem ${nChars} caracteres, sendo ${nBytes - nChars} com 2 bytes, logo ocupa ${nBytes} bytes. Somando \`'_'\` (1 byte) e \`"${sufixo}"\` (${k} bytes), \`s.len()\` imprime $${nBytes} + 1 + ${k} = ${ans}$.`,
                {
                  visual: code(
                    `fn main() {
    let s = "${palavra}_${sufixo}";
    println!("{}", s.len());
}`,
                    [2, 3],
                    'Contagem UTF-8',
                  ),
                },
              );
            }),
            codePuzzle(
              '(Roteiro #4) Monte o programa que define `s = "ação"`, cria o iterador reverso de caracteres em `it`, coleta o resultado em `inv: String` e imprime `"{s} -> {inv}"`.',
              [
                'fn main() {',
                '    let s = "ação";',
                '    let it = s.chars().rev();',
                '    let inv: String = it.collect();',
                '    println!("{s} -> {inv}");',
                '}',
              ],
              [
                '    let it = s.bytes().rev();',
                '    let inv: &str = it.collect();',
              ],
              '`s.chars().rev()` percorre os caracteres de trás para frente, e `it.collect()` aloca uma nova `String` (`"oãça"`) no heap.',
            ),
          ],
        },
        {
          card: [
            {
              title: 'Por que s[0] é proibido (E0277) e fronteiras de char',
              body: `Em Rust, tentar acessar \`s[0]\` em uma \`String\` ou \`&str\` **não compila** (\`error[E0277]: the type \\\`str\\\` cannot be indexed by \\\`{integer}\\\`\`). Há duas razões:

1. **Segurança**: em \`"ação"\`, o byte \`1\` é só metade do caractere \`'ç'\`. Devolver um byte solto enganaria quem esperava uma letra.
2. **Desempenho $O(1)$**: como cada caractere UTF-8 tem de 1 a 4 bytes, descobrir o $k$-ésimo \`char\` exige varrer desde o início em $O(k)$.

Já fatiar bytes com \`&s[a..b]\` é permitido em $O(1)$, mas \`a\` e \`b\` **precisam cair exatamente na fronteira entre caracteres**. Cortar um caractere ao meio (como \`&"ação"[0..2]\`) aborta em execução com \`panic!\`.`,
              visual: code(
                `fn main() {
    let s = "ação";
    // let c = s[0]; // ERRO E0277!
    let fatia = &s[0..3]; // "aç" (ok!)
    let ch = s.chars().nth(1);
    println!("{fatia} {:?}", ch);
}`,
                [3, 4, 5],
                'Indexação vs fatiamento',
              ),
              tip: 'Quando quiser o k-ésimo caractere com segurança, use s.chars().nth(k), que devolve Option<char> (Some(c) ou None).',
            },
            {
              title: 'Fronteiras válidas em "ação" (6 bytes)',
              body: 'Confira na tabela quais índices de byte podem ser usados em `&s[a..b]` para `let s = "ação";`.',
              visual: table(
                ['Índice', 'Posição em "ação"', 'Fronteira de char?'],
                [
                  ['0', "Início de 'a' (byte 0)", 'Sim (válido)'],
                  ['1', "Início de 'ç' (bytes 1..3)", 'Sim (válido)'],
                  ['2', "Meio de 'ç' (2º byte)", 'NÃO -> panic!'],
                  ['3', "Início de 'ã' (bytes 3..5)", 'Sim (válido)'],
                  ['4', "Meio de 'ã' (2º byte)", 'NÃO -> panic!'],
                  ['5', "Início de 'o' (byte 5)", 'Sim (válido)'],
                  ['6', 'Fim da string (após byte 5)', 'Sim (válido)'],
                ],
                [2, 4],
              ),
            },
            {
              title: 'No seu computador',
              body: `**Desafio (Roteiro #4 — Strings e UTF-8):** Crie um projeto com \`cargo new utf8_lab\` e escreva uma função \`fn inspecionar(s: &str)\` que calcula \`bytes = s.len()\`, \`chars = s.chars().count()\` e \`inv: String = s.chars().rev().collect()\`, imprimindo tudo em uma linha.

No \`main\`, chame \`inspecionar("ação")\` e \`inspecionar("coração")\`. Compare com o que aconteceria em C ao inverter o array de \`char\` byte a byte!`,
              visual: code(
                `fn inspecionar(s: &str) {
    let b = s.len();
    let c = s.chars().count();
    let inv: String = s.chars().rev().collect();
    println!("{s}: {b}B, {c}c, {inv}");
}`,
                [2, 3, 4, 5],
                'src/main.rs',
              ),
              tip: 'Critério de pronto: para "ação" o programa imprime "ação: 6B, 4c, oãça", para "coração" imprime "coração: 9B, 7c, oãçaroc", e cargo clippy -- -D warnings termina sem avisos.',
            },
          ],
          exercises: [
            mcq(
              'O que acontece ao tentar compilar este programa que acessa `s[0]`?',
              [
                'Não compila (erro E0277): str não pode ser indexado por um inteiro',
                'Compila e imprime a letra m',
                'Compila e imprime o código ASCII 109',
                'Compila, mas aborta com panic! em tempo de execução',
              ],
              0,
              'Mesmo quando o texto contém apenas ASCII, `String` e `str` não implementam indexação por inteiro (`s[0]`): o compilador rejeita com `error[E0277]: the type \`str\` cannot be indexed by \`{integer}\``.',
              {
                visual: code(
                  `fn main() {
    let s = String::from("motor");
    let letra = s[0];
    println!("{letra}");
}`,
                  [3],
                  'Tentativa de s[0]',
                ),
              },
            ),
            mcq(
              'Na palavra `"ação"`, `\'a\'` ocupa o byte `0` e `\'ç\'` ocupa os bytes `1` e `2` (`1..3`). O que acontece ao rodar `&s[0..2]`?',
              [
                'Compila, mas sofre panic! em execução porque o índice 2 corta o caractere ç ao meio',
                'Não compila com erro E0277 na linha 3',
                'Imprime aç normalmente',
                'Imprime apenas a letra a e descarta o byte incompleto',
              ],
              0,
              'Fatiar com um intervalo `0..2` tem tipos válidos (por isso compila), mas em execução o Rust confere se os índices `0` e `2` são fronteiras UTF-8. Como `2` cai dentro de `\'ç\'` (`1..3`), o programa aborta com `panic!`.',
              {
                visual: code(
                  `fn main() {
    let s = "ação";
    println!("{}", &s[0..2]);
}`,
                  [3],
                  'Fatia fora de fronteira',
                ),
              },
            ),
            mcq(
              'Ainda em `"ação"` (`\'a\'` em `0..1`, `\'ç\'` em `1..3`, `\'ã\'` em `3..5`, `\'o\'` em `5..6`), o que `&s[1..3]` imprime?',
              ['ç', 'aç', 'çã', 'a'],
              0,
              'Tanto `1` quanto `3` são fronteiras de caractere válidas, e os bytes `1..3` codificam exatamente o caractere `\'ç\'`.',
              {
                visual: code(
                  `fn main() {
    let s = "ação";
    println!("{}", &s[1..3]);
}`,
                  [3],
                  'Fatia em fronteira válida',
                ),
              },
            ),
            multi(
              'Quais das alternativas abaixo explicam por que Rust proíbe indexar strings diretamente com `s[i]`?',
              [
                'Em UTF-8 cada caractere tem de 1 a 4 bytes, logo achar o i-ésimo char exige varrer desde o início e não é O(1)',
                'Indexar um byte arbitrário poderia cair no meio de um caractere multibyte e não corresponder a nenhum char válido',
                'Strings em Rust são guardadas apenas na pilha e não possuem endereço de memória',
                'A linguagem Rust só suporta caracteres da tabela ASCII de 7 bits',
              ],
              [0, 1],
              'O capítulo 8.2 destaca exatamente esses dois motivos: evitar a ambiguidade entre byte e caractere (que poderia cortar um ponto de código UTF-8) e não esconder uma busca $O(n)$ atrás da sintaxe `s[i]` que promete $O(1)$.',
            ),
            fill(
              'Complete a expressão que obtém com segurança o caractere de índice `0` de `s` na forma de um `Option<char>`:',
              'let primeiro = s.___().___(0);',
              ['chars', 'nth'],
              ['bytes', 'len', 'split'],
              '`s.chars()` cria o iterador de caracteres Unicode e `.nth(0)` avança até o índice pedido devolvendo `Some(char)` (ou `None` se a string estiver vazia).',
            ),
            match(
              'Considere `let s = "pão";` (`\'p\'` = 1 B em `0..1`, `\'ã\'` = 2 B em `1..3`, `\'o\'` = 1 B em `3..4`). Associe cada expressão ao seu resultado:',
              [
                ['&s[0..1]', 'Devolve a fatia &str "p"'],
                ['&s[1..3]', 'Devolve a fatia &str "ã"'],
                ['&s[0..2]', 'Aborta com panic! em execução (corta "ã" ao meio)'],
                ['s.chars().nth(1)', "Devolve Some('ã') do tipo Option<char>"],
              ],
              'Os índices `0`, `1`, `3` e `4` são fronteiras válidas em `"pão"`, enquanto o índice `2` cai no meio dos dois bytes de `\'ã\'`.',
            ),
            gen((rng) => {
              const a = randInt(rng, 1, 4);
              const prefixo = 'a'.repeat(a);
              const fim = a + 2;
              return num(
                `Na string \`let s = "${prefixo}çã";\`, cada \`'a'\` ocupa 1 byte e \`'ç'\` ocupa 2 bytes. Qual deve ser o índice inteiro \`fim\` em \`&s[0..fim]\` para que a fatia contenha exatamente \`"${prefixo}ç"\`?`,
                fim,
                `Os ${a} caracteres \`'a'\` ocupam os bytes \`0..${a}\` (${a} bytes) e o \`'ç'\` ocupa os 2 bytes seguintes (\`${a}..${fim}\`). Logo, a fronteira válida logo após \`'ç'\` é $\\text{fim} = ${a} + 2 = ${fim}$.`,
                {
                  visual: code(
                    `fn main() {
    let s = "${prefixo}çã";
    let fatia = &s[0..fim];
    println!("{fatia}");
}`,
                    [2, 3],
                    'Calculando a fronteira',
                  ),
                },
              );
            }),
            codePuzzle(
              'Monte o programa que define `s = "coração"`, recorta em `f` a fatia válida `"coraç"` (`0..6`), extrai o 5º caractere (índice 4, `\'ç\'`) com `chars().nth(4).unwrap()` e imprime `"{f}: {c}"`.',
              [
                'fn main() {',
                '    let s = "coração";',
                '    let f = &s[0..6];',
                '    let c = f.chars().nth(4).unwrap();',
                '    println!("{f}: {c}");',
                '}',
              ],
              [
                '    let f = &s[0..5];',
                '    let c = f[4];',
              ],
              'Em `"coração"`, `"cora"` ocupa 4 bytes (`0..4`) e `\'ç\'` ocupa 2 bytes (`4..6`), então `&s[0..6]` recorta `"coraç"` na fronteira exata; depois `f.chars().nth(4).unwrap()` obtém `\'ç\'`.',
            ),
          ],
        },
      ],
    },
    {
      id: 'ro-str-metodos',
      title: 'Métodos úteis e formatação',
      parts: [
        {
          card: [
            {
              title: 'Limpando, dividindo e convertendo: trim, split, to_uppercase e parse',
              body: `A biblioteca padrão traz métodos prontos em \`str\` para tratar entradas de usuário, arquivos e sensores:

• \`s.trim() -> &str\`: devolve uma fatia sem espaços, \`\\t\` ou \`\\n\` nas pontas (sem alocar no heap).
• \`s.to_uppercase() -> String\`: devolve uma nova \`String\` em maiúsculas (respeitando acentos UTF-8).
• \`s.split(sep)\`: devolve um iterador sobre as subfatias \`&str\` separadas por \`sep\`.
• \`s.parse::<T>() -> Result<T, _>\`: converte o texto para um tipo numérico (\`i32\`, \`f64\`…), exigindo que o texto já esteja sem espaços extras.`,
              visual: code(
                `fn main() {
    let s = " 42\\n".trim();
    let n: i32 = s.parse().unwrap();
    for p in "a,b".split(',') {
        println!("{}", p.to_uppercase());
    }
    println!("n={n}");
}`,
                [2, 3, 4, 5],
                'Métodos de str',
              ),
              tip: 'Diferente do scanf("%d") de C, o método .parse::<i32>() não ignora espaços nem \\n: sempre chame .trim().parse() ao converter texto lido do terminal.',
            },
            {
              title: 'Pipeline: da leitura bruta ao número',
              body: 'Acompanhe passo a passo o que acontece com os tipos e com a memória ao processar `"  125 \\n"`.',
              visual: memStepper([
                {
                  label: '1. Entrada bruta (&str)',
                  head: ['Expressão', 'Tipo', 'Valor / Efeito'],
                  rows: [['bruto', '&str', '"  125 \\n" (7 bytes)']],
                  highlight: [0],
                  info: 'A leitura chega com espaços no início e uma quebra de linha `\\n` no final.',
                },
                {
                  label: '2. bruto.trim()',
                  head: ['Expressão', 'Tipo', 'Valor / Efeito'],
                  rows: [
                    ['bruto', '&str', '"  125 \\n" (7 bytes)'],
                    ['bruto.trim()', '&str', '"125" (fatia de 3 bytes, zero alocação)'],
                  ],
                  highlight: [1],
                  info: '`trim()` apenas ajusta o ponteiro e o tamanho da fatia para apontar para `"125"`, sem copiar nada no heap.',
                },
                {
                  label: '3. .parse::<i32>()',
                  head: ['Expressão', 'Tipo', 'Valor / Efeito'],
                  rows: [
                    ['bruto', '&str', '"  125 \\n" (7 bytes)'],
                    ['bruto.trim()', '&str', '"125" (fatia de 3 bytes, zero alocação)'],
                    ['limpo.parse::<i32>()', 'Result<i32, ParseIntError>', 'Ok(125)'],
                  ],
                  highlight: [2],
                  info: 'Como `"125"` contém apenas dígitos válidos, `parse::<i32>()` devolve `Ok(125)`.',
                },
              ]),
            },
          ],
          exercises: [
            mcq(
              'O que o método `s.trim()` devolve quando chamado sobre `"  ola \\n"`?',
              [
                'Uma fatia &str valendo "ola", sem alocar memória nova no heap',
                'Uma nova String alocada no heap valendo "ola"',
                'O número de espaços removidos na forma de um usize',
                'Um Result<&str, Error> que falha se não houver espaços',
              ],
              0,
              '`trim()` apenas avança o início e recua o fim da fatia sobre os bytes já existentes, devolvendo um `&str` em $O(1)$ alocações.',
            ),
            mcq(
              'O que este programa imprime e qual é o tipo da variável `grito`?',
              [
                'Imprime AÇÃO e grito é do tipo String',
                'Imprime ACAO (sem acentos) e grito é do tipo &str',
                'Imprime ação porque to_uppercase altera apenas ASCII',
                'Não compila porque falta mut em s',
              ],
              0,
              '`to_uppercase()` cria e devolve uma nova `String` no heap com as letras convertidas para maiúsculas segundo o padrão Unicode (`"AÇÃO"`).',
              {
                visual: code(
                  `fn main() {
    let s = "ação";
    let grito = s.to_uppercase();
    println!("{grito}");
}`,
                  [3],
                  'to_uppercase()',
                ),
              },
            ),
            num(
              'Quantos pedaços o iterador `linha.split(\';\')` produz (número impresso na saída)?',
              4,
              'Separar `"10;20;30;40"` pelo caractere `\';\'` gera 4 fatias (`"10"`, `"20"`, `"30"` e `"40"`), portanto `.count()` retorna `4`.',
              {
                visual: code(
                  `fn main() {
    let linha = "10;20;30;40";
    let qtd = linha.split(';').count();
    println!("{qtd}");
}`,
                  [3],
                  'split e count',
                ),
              },
            ),
            mcq(
              'Neste código, chamamos `entrada.parse::<i32>()` **sem** usar `.trim()` antes. O que é impresso?',
              [
                'true (parse devolve Err porque há espaço e quebra de linha na string)',
                'false (parse ignora espaços e quebras de linha automaticamente)',
                '18',
                'O programa não compila porque parse não aceita ::<i32>',
              ],
              0,
              '`parse::<i32>()` exige que todos os caracteres da fatia sejam dígitos (ou sinal). Como há espaço e `\\n`, ele retorna `Err(...)`, e `r.is_err()` imprime `true`.',
              {
                visual: code(
                  `fn main() {
    let entrada = " 18\\n";
    let r = entrada.parse::<i32>();
    println!("{}", r.is_err());
}`,
                  [2, 3, 4],
                  'parse sem trim',
                ),
              },
            ),
            match(
              'Associe cada método de `str` ao seu retorno e papel:',
              [
                ['.trim()', 'Devolve &str sem espaços ou \\n nas extremidades'],
                ['.to_uppercase()', 'Aloca e devolve uma nova String em maiúsculas'],
                [".split(',')", 'Devolve um iterador sobre subfatias &str'],
                ['.parse::<i32>()', 'Converte o texto em Result<i32, ParseIntError>'],
              ],
              '`trim` e `split` trabalham com fatias emprestadas `&str`; `to_uppercase` aloca uma `String`; `parse` devolve um `Result` porque a conversão pode falhar.',
            ),
            fill(
              'Complete a linha que limpa as pontas de `bruto` e converte o texto para `f64` usando a sintaxe *turbofish* `::<f64>`:',
              'let tensao = bruto.___().___::<f64>();',
              ['trim', 'parse'],
              ['split', 'chars', 'format'],
              'Primeiro `.trim()` remove espaços e quebras de linha; em seguida `.parse::<f64>()` faz a conversão numérica.',
            ),
            gen((rng) => {
              const a = randInt(rng, 2, 9);
              const b = randInt(rng, 10, 20);
              const c = randInt(rng, 3, 9);
              const ans = a + b + c;
              return num(
                'Qual valor numérico é impresso ao final do laço?',
                ans,
                `\`csv.split(',')\` produz \`"${a}"\`, \`"${b}"\` e \`"${c}"\`. Cada fatia é convertida por \`parse()\` e somada: $${a} + ${b} + ${c} = ${ans}$.`,
                {
                  visual: code(
                    `fn main() {
    let csv = "${a},${b},${c}";
    let mut soma = 0;
    for p in csv.split(',') {
        let n: i32 = p.parse().unwrap();
        soma += n;
    }
    println!("{soma}");
}`,
                    [4, 5, 6],
                    'Soma de CSV',
                  ),
                },
              );
            }),
            codePuzzle(
              'Monte o trecho que guarda `"  25 \\n"` em `bruto`, limpa as bordas em `limpo` com `trim()`, converte para `i32` em `n`, calcula o dobro e imprime o resultado.',
              [
                'let bruto = "  25 \\n";',
                'let limpo = bruto.trim();',
                'let n: i32 = limpo.parse().unwrap();',
                'let dobro = n * 2;',
                'println!("{dobro}");',
              ],
              [
                "let n: i32 = bruto.split(' ');",
                'let limpo = bruto.to_uppercase();',
              ],
              'Sem `bruto.trim()`, o `.parse()` falharia por causa dos espaços e do `\\n`; depois de converter para `n: i32`, calculamos `dobro = n * 2` (`50`).',
            ),
          ],
        },
        {
          card: [
            {
              title: 'Formatação avançada: {:>8}, {:.2} e {:08b}',
              body: `As macros \`println!\` e \`format!\` aceitam especificadores depois de \`:\` dentro de \`{...}\`:

• \`{:>8}\` e \`{:<8}\`: alinham à **direita** (\`>\`) ou à **esquerda** (\`<\`) em um campo de largura mínima 8.
• \`{:.2}\`: formata números de ponto flutuante com **2 casas decimais**. Pode ser combinado com largura e alinhamento: \`{:>10.2}\` (Roteiro #41).
• \`{:08b}\`: formata um inteiro em **binário** (\`b\`) com 8 dígitos preenchidos com zeros à esquerda (\`0\`). Para hexadecimal, use \`{:x}\` ou \`{:04X}\`.`,
              visual: code(
                `fn main() {
    let nome = "VCC";
    let v = 3.3;
    let reg = 5u8;
    println!("{:<6}{:>6.2}", nome, v);
    println!("bits: {:08b}", reg);
}`,
                [5, 6],
                'Especificadores de formato',
              ),
              tip: 'Você também pode colocar o nome da variável direto dentro das chaves: format!("{nome:<6}{v:>6.2}") e format!("{reg:08b}").',
            },
            {
              title: 'Guia rápido de especificadores {:...}',
              body: 'Veja na tabela como cada especificador transforma o valor (usamos `·` para representar cada espaço em branco adicionado no alinhamento).',
              visual: table(
                ['Formato', 'Entrada', 'Resultado (· = espaço)'],
                [
                  ['{:>8}', '"oi"', '"······oi" (8 colunas, à direita)'],
                  ['{:<6}', '"oi"', '"oi····" (6 colunas, à esquerda)'],
                  ['{:.2}', '3.5', '"3.50" (2 casas decimais)'],
                  ['{:>8.2}', '3.5', '"····3.50" (8 colunas, 2 casas)'],
                  ['{:08b}', '13', '"00001101" (binário de 8 bits)'],
                ],
                [3, 4],
              ),
            },
            {
              title: 'No seu computador',
              body: `**Desafio (Roteiro #41 — Relatório em colunas):** Crie um projeto com \`cargo new relatorio\`. Dado um array de leituras \`["motor:12.5", "sensor:3.3", "valvula:24.0"]\`, percorra cada item, separe o nome e o valor com \`split(':')\`, converta o número com \`.trim().parse::<f64>().unwrap()\` e imprima uma tabela alinhada usando \`println!("{:<12}{:>8.2}", nome.to_uppercase(), valor)\`, além da soma total no final.`,
              visual: code(
                `fn main() {
    let dados = ["motor:12.5", "sensor:3.3"];
    let mut total = 0.0;
    for item in dados {
        let mut p = item.split(':');
        let n = p.next().unwrap().to_uppercase();
        let v: f64 = p.next().unwrap().parse().unwrap();
        total += v;
        println!("{n:<12}{v:>8.2}");
    }
    println!("{:<12}{total:>8.2}", "TOTAL");
}`,
                [6, 7, 9, 11],
                'src/main.rs',
              ),
              tip: 'Critério de pronto: cargo run imprime as colunas alinhadas com 2 casas decimais e cargo clippy -- -D warnings passa sem nenhum aviso.',
            },
          ],
          exercises: [
            mcq(
              'O que é impresso na saída por esta chamada com o especificador `{:.2}`?',
              ['v=7.50', 'v=7.5', 'v=07.50', 'v=7,50'],
              0,
              '`{:.2}` fixa a precisão em 2 casas após o ponto decimal padrão da formatação (`v=7.50`).',
              {
                visual: code(
                  `fn main() {
    let x = 7.5;
    println!("v={:.2}", x);
}`,
                  [3],
                  'Precisão decimal',
                ),
              },
            ),
            num(
              'O especificador `{:>8}` alinha `"sol"` (3 letras ASCII) à direita preenchendo com espaços em branco até completar a largura mínima. Qual é o valor impresso por `s.len()`?',
              8,
              'O campo de largura mínima 8 coloca 5 espaços à esquerda das 3 letras de `"sol"` (`"     sol"`), totalizando $5 + 3 = 8$ bytes.',
              {
                visual: code(
                  `fn main() {
    let s = format!("{:>8}", "sol");
    println!("{}", s.len());
}`,
                  [2, 3],
                  'Largura de campo',
                ),
              },
            ),
            mcq(
              'Sabendo que $5 = 4 + 1 = (101)_2$, o que esta chamada com `{:08b}` imprime na tela?',
              ['b=00000101', 'b=10100000', 'b=00000005', 'b=101'],
              0,
              '`b` formata em base 2 (`101`), `8` define a largura de 8 caracteres e o `0` inicial preenche à esquerda com zeros: `b=00000101`.',
              {
                visual: code(
                  `fn main() {
    let mascara = 5u8;
    println!("b={:08b}", mascara);
}`,
                  [3],
                  'Formatação binária',
                ),
              },
            ),
            tf(
              'No formato `format!("{:<20}{:>10.2}", nome, valor)` (exercício 41 do roteiro), `nome` é alinhado à esquerda em 20 colunas e `valor` é alinhado à direita em 10 colunas com 2 casas decimais.',
              true,
              '`<20` alinha à esquerda ocupando 20 colunas e `>10.2` alinha à direita ocupando 10 colunas com 2 casas após o ponto.',
            ),
            match(
              'Associe cada especificador de formatação ao seu efeito:',
              [
                ['{:>8}', 'Alinha à direita preenchendo com espaços até 8 colunas'],
                ['{:<8}', 'Alinha à esquerda preenchendo com espaços até 8 colunas'],
                ['{:.2}', 'Mostra número de ponto flutuante com 2 casas decimais'],
                ['{:08b}', 'Mostra inteiro em binário com 8 bits e zeros à esquerda'],
              ],
              '`>` alinha à direita, `<` alinha à esquerda, `.N` controla casas decimais e `08b` formata em binário de 8 dígitos.',
            ),
            fill(
              'Complete a chamada para formatar o registrador `porta` em binário com 8 bits preenchidos com zeros à esquerda:',
              'let bits = format!("{:___}", porta);',
              ['08b'],
              ['.2', '>8', '8x'],
              'O especificador `08b` junta preenchimento com zero (`0`), largura `8` e base binária (`b`).',
            ),
            gen((rng) => {
              const w1 = randInt(rng, 6, 10);
              const w2 = randInt(rng, 6, 9);
              const item = pick(rng, ['R1', 'C2', 'U3', 'L4'] as const);
              const ans = w1 + w2;
              return num(
                `Como \`"${item}"\` tem 2 caracteres (menor que ${w1}) e \`"12.50"\` tem 5 caracteres (menor que ${w2}), qual é o comprimento total \`linha.len()\` impresso pelo programa?`,
                ans,
                `O primeiro campo \`{:<${w1}}\` preenche com espaços até ocupar exatamente ${w1} colunas, e o segundo \`{:>${w2}.2}\` ocupa exatamente ${w2} colunas. Portanto, \`linha.len()\` vale $${w1} + ${w2} = ${ans}$.`,
                {
                  visual: code(
                    `fn main() {
    let nome = "${item}";
    let v = 12.5;
    let linha = format!("{:<${w1}}{:>${w2}.2}", nome, v);
    println!("{}", linha.len());
}`,
                    [4, 5],
                    'Colunas de relatório',
                  ),
                },
              );
            }),
            codePuzzle(
              '(Roteiro #41) Monte o programa que define a tupla `(k, v) = ("VCC", 3.3)`, formata `k` à esquerda em 6 colunas e `v` à direita em 6 colunas com 2 casas decimais em `s`, guarda `s.len()` em `n` e imprime `"[{s}] ({n})"`.',
              [
                'fn main() {',
                '    let (k, v) = ("VCC", 3.3);',
                '    let s = format!("{k:<6}{v:>6.2}");',
                '    let n = s.len();',
                '    println!("[{s}] ({n})");',
                '}',
              ],
              [
                '    let s = format!("{k:>6}{v:.0}");',
                '    let s = println!("{k:<6}{v:>6.2}");',
              ],
              '`format!("{k:<6}{v:>6.2}")` produz `"VCC     3.30"` (6 + 6 = 12 caracteres), guarda em `s` e permite medir `n = s.len()` antes de imprimir.',
            ),
          ],
        },
      ],
    },
  ],
};

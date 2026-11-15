import type { UnitDef } from '../../types';
import { code, fill, gen, match, mcq, multi, num, order, table, tf } from '../../helpers';
import { codePuzzle } from '../../codePractice';
import { randInt } from '../../../lib/random';

export const rustOwnership: UnitDef = {
  id: 'ro-own',
  title: 'Ownership',
  icon: '👑',
  subtitle: 'Pilha, heap, dono único, move, Copy, Clone e Drop',
  source: 'The Rust Programming Language (ed. 2024), cap. 4.1 · Desafio 50 Dias — Rust, Módulo 2',
  extra: true,
  guide:
    'Em Rust, o sistema de **ownership** (posse) verifica o uso dos valores em tempo de compilação; a alocação e a liberação da memória acontecem em execução, sem coletor de lixo e sem chamadas manuais a `free()` nestes exemplos.\n\n' +
    '• **As três regras do ownership**: (1) cada valor tem um **dono** (*owner*); (2) só pode existir **um único dono** por vez; (3) quando o dono sai de escopo (`}`), o valor é descartado automaticamente (**drop**).\n' +
    '• **Pilha vs. heap**: nos diagramas desta unidade, representamos as variáveis locais na **pilha** (*stack*). `String` e `Vec<T>` têm tamanho fixo e guardam `ptr`, `len` e `capacity`; seus buffers podem crescer no **heap**. `Box<T>` também tem tamanho fixo: para `T: Sized`, guarda um único ponteiro para o valor no heap. O tipo sozinho não determina onde um valor fica: um `i32` também pode estar no heap, e otimizações podem manter valores em registradores ou eliminá-los.\n' +
    '• **Move vs. Copy vs. Clone**: atribuir ou passar por valor um tipo não-`Copy`, como `String` (`let s2 = s1;`), **move** a posse para `s2` e invalida `s1` (tentar lê-la antes de reinicializá-la gera **E0382**). `.clone()` duplica uma `String` explicitamente. É a trait `Copy`, e não a região da memória, que permite copiar um valor sem invalidar a variável original.\n' +
    '• **Escopo, RAII e funções**: ao sair normalmente de um bloco, as variáveis locais que ainda possuem valores são descartadas na ordem inversa da declaração (LIFO), chamando `Drop::drop` se o tipo o implementar e descartando seus campos. Para liberar antes do fim do bloco, passa-se o valor para `drop(v)`. Funções que recebem posse podem devolvê-la pelo valor de retorno.',
  lessons: [
    {
      id: 'ro-own-pilha',
      title: 'Pilha e heap',
      parts: [
        {
          card: [
            {
              title: 'Memória em ordem: a pilha',
              body:
                'Em Rust, a **pilha** (*stack*) e o **heap** são regiões de memória; quem determina se uma atribuição copia ou move um valor é a trait `Copy`. Aqui usamos o modelo de variáveis locais na pilha, desconsiderando otimizações.\n\n' +
                'A pilha funciona no modelo **LIFO** (*last in, first out* — último a entrar, primeiro a sair). Quando uma função é chamada, um quadro (*stack frame*) é empilhado para guardar suas variáveis locais; quando a função retorna, esse quadro é desempilhado de uma só vez.\n\n' +
                'Para morar diretamente na pilha, o tipo precisa ter **tamanho fixo e conhecido em tempo de compilação**, como `i32` (4 bytes), `u64` (8 bytes), `f64` (8 bytes), `bool` (1 byte), `char` (4 bytes) e arrays fixos `[i32; 3]`.',
              visual: code(
                `fn dobro(x: i32) -> i32 {
    let r = x * 2;
    r
}

fn main() {
    let a: i32 = 7;
    let b = dobro(a);
    println!("{a} -> {b}");
}`,
                [1, 2, 7, 8],
                'Quadro na pilha',
              ),
              tip: 'Alocar na pilha é extremamente rápido porque o programa nunca precisa procurar espaço livre: basta mover o ponteiro do topo da pilha.',
            },
            {
              title: 'Retrato da pilha em execução',
              body:
                'Durante a execução de `dobro(a)` no código anterior, os quadros de `main` e de `dobro` coexistem na pilha. Assim que `dobro` termina e devolve `14`, as variáveis `x` e `r` desaparecem do topo da pilha.',
              visual: table(
                ['Quadro', 'Variável', 'Tipo (Bytes)', 'Valor'],
                [
                  ['main', 'a', 'i32 (4 B)', '7'],
                  ['dobro', 'x', 'i32 (4 B)', '7'],
                  ['dobro', 'r', 'i32 (4 B)', '14'],
                ],
                [1, 2],
              ),
            },
          ],
          exercises: [
            mcq(
              'Qual regra define a ordem de entrada e saída dos quadros de memória na pilha (*stack*)?',
              [
                'Último a entrar, primeiro a sair (LIFO)',
                'Primeiro a entrar, primeiro a sair (FIFO)',
                'Ordem alfabética do nome das variáveis',
                'Busca dinâmica pelo menor bloco livre',
              ],
              0,
              'A pilha (*stack*) segue a disciplina LIFO (*last in, first out*): o último quadro empilhado por uma chamada de função é o primeiro a sair quando ela retorna.',
            ),
            tf(
              'Para que um valor seja armazenado diretamente na pilha, seu tamanho em bytes precisa ser fixo e conhecido em tempo de compilação.',
              true,
              'O compilador calcula o deslocamento exato de cada variável no quadro de pilha; por isso exige tamanho conhecido e fixo em compilação.',
            ),
            num(
              'Sabendo que `i32` ocupa 4 bytes e `bool` ocupa 1 byte, qual é a soma dos tamanhos dos três valores locais de `main`, sem contar alinhamento nem otimizações?',
              9,
              'Temos duas variáveis `i32` ($2 \\times 4 = 8$ bytes) e uma variável `bool` ($1$ byte), totalizando $8 + 1 = 9$ bytes.',
              {
                unit: 'bytes',
                visual: code(
                  `fn main() {
    let x: i32 = 10;
    let y: i32 = 20;
    let ativo: bool = true;
}`,
                  [2, 3, 4],
                  'Variáveis na pilha',
                ),
              },
            ),
            fill(
              'Complete a regra sobre chamadas de função na pilha:',
              'Ao chamar uma função, seu quadro é ___ no topo; ao retornar, ele é ___.',
              ['empilhado', 'desempilhado'],
              ['fragmentado', 'clonado'],
              'Cada chamada empilha (*push*) um novo quadro com os parâmetros e variáveis locais, e o retorno desempilha (*pop*) esse quadro.',
            ),
            match(
              'Associe cada tipo de tamanho fixo ao espaço que ele ocupa na pilha:',
              [
                ['bool', '1 byte'],
                ['i32', '4 bytes'],
                ['u64', '8 bytes'],
                ['[i32; 4]', '16 bytes'],
              ],
              'Um `bool` usa 1 byte, `i32` usa 4 bytes (32 bits), `u64` usa 8 bytes (64 bits) e um array de quatro `i32` ocupa $4 \\times 4 = 16$ bytes contíguos.',
            ),
            mcq(
              'O que o programa abaixo imprime na saída?',
              ['11', '10', '1', 'Não compila: passo sai de escopo antes do retorno'],
              0,
              'A expressão `n + passo` avalia `10 + 1 = 11` e devolve esse valor para `res` antes de o quadro de `somar_um` ser desempilhado.',
              {
                visual: code(
                  `fn somar_um(n: i32) -> i32 {
    let passo = 1;
    n + passo
}

fn main() {
    let base = 10;
    let res = somar_um(base);
    println!("{res}");
}`,
                  [2, 3, 8],
                  'Chamada na pilha',
                ),
              },
            ),
            codePuzzle(
              'Monte a função `area` que recebe `lado: i32`, calcula o quadrado na variável local `total` na pilha e devolve `total` como expressão final:',
              [
                'fn area(lado: i32) -> i32 {',
                '    let total = lado * lado;',
                '    total',
                '}',
              ],
              [
                '    total;',
                'fn area(lado: i32) {',
                '    let total = lado + lado;',
              ],
              'Em Rust, a última linha da função sem ponto e vírgula (`total`) é a expressão de retorno. Se tivesse `;`, retornaria `()` em vez de `i32`.',
            ),
            gen((rng) => {
              const n = randInt(rng, 3, 9);
              const v = randInt(rng, 2, 7);
              return num(
                'Sabendo que cada `i32` ocupa 4 bytes, quantos bytes o array `dados` ocupa na pilha?',
                n * 4,
                `O array \`[i32; ${n}]\` guarda ${n} inteiros de 4 bytes seguidos na pilha, ocupando $${n} \\times 4 = ${n * 4}$ bytes.`,
                {
                  unit: 'bytes',
                  visual: code(
                    `fn main() {
    let dados = [${v}i32; ${n}];
    println!("{}", dados[0]);
}`,
                    [2],
                    'Array fixo na pilha',
                  ),
                },
              );
            }),
          ],
        },
        {
          card: [
            {
              title: 'Quando o tamanho pode mudar: o heap',
              body:
                'Textos digitados pelo usuário ou listas que crescem durante a execução não têm tamanho fixo na compilação. Para eles, Rust usa o **heap**: o alocador procura um bloco livre de memória, marca-o como ocupado e devolve um **ponteiro** (endereço).\n\n' +
                'Compare os dois tipos de texto em Rust:\n' +
                '• Um literal `"ola"` tem tipo `&str`: é imutável e seu conteúdo já vem gravado dentro do executável.\n' +
                '• Uma `String` criada com `String::from("ola")` guarda os caracteres num buffer no **heap** e pode crescer com `push_str`.',
              visual: code(
                `fn main() {
    let mut s = String::from("ola");
    s.push_str(", Rust!");
    println!("{} ({})", s, s.len());
}`,
                [2, 3],
                'String no heap',
              ),
            },
            {
              title: 'Cabeçalho na pilha, bytes no heap',
              body:
                'Uma variável `s` do tipo `String` divide seus dados entre as duas regiões: na **pilha** ficam apenas 3 campos de tamanho fixo (`ptr`, `len` e `capacity`, somando 24 bytes em 64 bits), enquanto os bytes UTF-8 do texto ficam no **heap**, no endereço apontado por `ptr`.',
              visual: table(
                ['Região', 'Campo / Posição', 'Valor em let s = String::from("ola")'],
                [
                  ['Pilha (s)', 'ptr', '→ 0x7f00 (endereço no heap)'],
                  ['Pilha (s)', 'len', '3 (bytes em uso)'],
                  ['Pilha (s)', 'capacity', '3 (bytes reservados)'],
                  ['Heap (0x7f00)', 'bytes [0..3]', '"o", "l", "a"'],
                ],
                [0, 3],
              ),
            },
            {
              title: 'No seu computador 💻',
              body:
                'Crie um projeto com `cargo new pilha_heap` e faça o experimento do exercício 12 do roteiro: crie um `Vec<i32>` vazio com `Vec::new()`, adicione os números de `1` a `8` com `push` e imprima `len()` e `capacity()` a cada passo para observar o crescimento do buffer do heap quando enche.',
              visual: code(
                `fn main() {
    let mut v = Vec::new();
    for i in 1..=8 {
        v.push(i);
        println!(
            "len={} cap={}",
            v.len(),
            v.capacity()
        );
    }
}`,
                [2, 4, 7, 8],
                'src/main.rs',
              ),
              tip: 'Critério de pronto: ao rodar cargo run, len cresce de 1 até 8 e cap é sempre pelo menos len. A capacidade pode crescer em saltos, mas Rust não garante que dobre nem valores específicos (como 4 e 8); cargo clippy -- -D warnings deve terminar sem avisos.',
            },
          ],
          exercises: [
            mcq(
              'Quais são os três campos armazenados na **pilha** por uma variável do tipo `String`?',
              [
                'Ponteiro para o heap (ptr), tamanho atual (len) e capacidade (capacity)',
                'Primeiro caractere, último caractere e byte nulo terminador',
                'Todos os caracteres do texto seguidos de um contador de referências',
                'Apenas o endereço do texto no código-fonte original',
              ],
              0,
              'Na pilha, uma `String` guarda apenas a estrutura de controle com 3 palavras de máquina: `ptr` (endereço do buffer no heap), `len` (bytes usados) e `capacity` (bytes alocados no buffer).',
            ),
            tf(
              'Em uma variável do tipo `String`, os bytes do texto ficam armazenados no heap, enquanto o cabeçalho (`ptr`, `len`, `capacity`) fica na pilha.',
              true,
              'O cabeçalho tem tamanho fixo (24 bytes em sistemas de 64 bits) e fica na pilha; já o texto pode crescer e por isso fica no heap.',
            ),
            mcq(
              'Observe o estado do cabeçalho de uma `String` na tabela abaixo. Quantos bytes o texto ocupa atualmente e quantos bytes ainda cabem no buffer sem realocar?',
              [
                '5 bytes ocupados e ainda cabem mais 3 bytes (capacidade total 8)',
                '8 bytes ocupados e ainda cabem mais 5 bytes',
                '13 bytes ocupados no heap',
                '3 bytes ocupados de um total de 5 bytes',
              ],
              0,
              '`len` vale 5 (bytes atualmente usados pelo texto) e `capacity` vale 8 (total reservado no heap), logo ainda cabem $8 - 5 = 3$ bytes antes de precisar realocar.',
              {
                visual: table(
                  ['Campo na pilha', 'Valor'],
                  [
                    ['ptr', '→ 0x7f10 (heap)'],
                    ['len', '5'],
                    ['capacity', '8'],
                  ],
                  [1, 2],
                ),
              },
            ),
            order(
              'Ordene o que acontece na memória quando executamos `let s = String::from("oi");`:',
              [
                'Pedir ao alocador um bloco no heap para 2 bytes',
                'Gravar os bytes "o" e "i" no endereço devolvido pelo alocador',
                'Guardar ptr, len (2) e capacity na variável s na pilha',
              ],
              'Primeiro o alocador reserva espaço no heap, depois os bytes do texto são copiados para lá e, por fim, o cabeçalho na pilha recebe o ponteiro, o tamanho e a capacidade.',
            ),
            multi(
              'Entre uma `String` não vazia, um `Vec<i32>` com elementos, um `Box<u64>` e um `i32` local, quais guardam os dados apontados no **heap**?',
              ['String', 'Vec<i32>', 'Box<u64>', 'i32'],
              [0, 1, 2],
              '`String`, `Vec<i32>` e `Box<u64>` alocam dados no heap e guardam apenas o cabeçalho/ponteiro na pilha. Já `i32` é um inteiro primitivo de 4 bytes que fica direto na pilha.',
            ),
            num(
              'Qual número é impresso por `println!("{}", s.len());` ao executar este programa?',
              10,
              '`"Eng"` tem 3 bytes ASCII e `"enharia"` acrescenta mais 7 bytes com `push_str`, resultando em `s.len() == 10`.',
              {
                visual: code(
                  `fn main() {
    let mut s = String::from("Eng");
    s.push_str("enharia");
    println!("{}", s.len());
}`,
                  [2, 3, 4],
                  'Crescendo no heap',
                ),
              },
            ),
            codePuzzle(
              'Monte a função `main` que cria uma `String` mutável com `"Rust"`, acrescenta `" 2024"` no buffer do heap e imprime o texto resultante:',
              [
                'fn main() {',
                '    let mut s = String::from("Rust");',
                '    s.push_str(" 2024");',
                '    println!("{s}");',
                '}',
              ],
              [
                '    let s = String::from("Rust");',
                '    s.push(" 2024");',
                '    println!("{s.len()}");',
              ],
              'Para alterar o conteúdo da `String` com `push_str`, a variável precisa ser declarada com `let mut s`. Em seguida, `println!("{s}")` exibe `"Rust 2024"`.',
            ),
            gen((rng) => {
              const a = randInt(rng, 2, 5);
              const b = randInt(rng, 2, 6);
              const sa = 'a'.repeat(a);
              const sb = 'b'.repeat(b);
              return num(
                'Qual número é impresso na saída após concatenar os dois trechos ASCII na `String`?',
                a + b,
                `A \`String\` começa com \`"${sa}"\` (${a} bytes) e recebe \`"${sb}"\` (${b} bytes) via \`push_str\`, totalizando $${a} + ${b} = ${a + b}$ bytes em \`s.len()\`.`,
                {
                  visual: code(
                    `fn main() {
    let mut s = String::from("${sa}");
    s.push_str("${sb}");
    println!("{}", s.len());
}`,
                    [2, 3, 4],
                    'Tamanho após push_str',
                  ),
                },
              );
            }),
          ],
        },
      ],
    },
    {
      id: 'ro-own-move',
      title: 'Dono único e move',
      parts: [
        {
          card: [
            {
              title: 'As três regras do ownership',
              body:
                'Todo o controle de memória do Rust se apoia em três regras verificadas pelo compilador:\n' +
                '• Cada valor em Rust tem uma variável que é sua **dona** (*owner*).\n' +
                '• Só pode existir **um único dono** por vez.\n' +
                '• Quando o dono sai de escopo, o valor é descartado (*dropped*).\n\n' +
                'Por causa da segunda regra, quando fazemos `let s2 = s1;` com uma `String`, a posse do texto **move** (*moves*) de `s1` para `s2`, e `s1` deixa de ser válida imediatamente.',
              visual: code(
                `fn main() {
    let s1 = String::from("posse");
    let s2 = s1; // move s1 -> s2
    println!("{s2}");
}`,
                [2, 3],
                'Transferência de posse',
              ),
              tip: 'Em C, dois ponteiros apontando para o mesmo bloco do malloc causam double free se ambos chamarem free(). Em Rust, o move invalida s1 na hora e evita esse bug em compilação.',
            },
            {
              title: 'O que muda na memória durante o move',
              body:
                'Em `let s2 = s1;`, o Rust **não** copia os bytes do texto no heap (o que seria lento para textos grandes). No modelo de pilha, transfere apenas o cabeçalho (`ptr`, `len`, `capacity`: 24 bytes em 64 bits) para `s2` e invalida `s1`; a cópia física do cabeçalho pode ser eliminada por otimização. Assim, apenas `s2` liberará o heap no fim do escopo.',
              visual: table(
                ['Local', 'Estado após let s2 = s1;', 'Aponta para'],
                [
                  ['s1 (pilha)', 'Invalidada (movida)', '—'],
                  ['s2 (pilha)', 'Única dona ativa', 'heap: "posse"'],
                  ['Heap', '1 única alocação (sem cópia)', '"posse" (5 B)'],
                ],
                [0, 1],
              ),
            },
          ],
          exercises: [
            mcq(
              'Pelas regras fundamentais de ownership do Rust, quantos donos (*owners*) um valor pode ter ao mesmo tempo?',
              [
                'Exatamente um único dono por vez',
                'Dois donos: um na pilha e outro no heap',
                'Quantos donos forem atribuídos com let',
                'Nenhum, pois todas as variáveis são apenas apelidos',
              ],
              0,
              'A segunda regra do ownership estabelece que só pode existir um único dono por vez para cada valor.',
            ),
            tf(
              'Ao executar `let s2 = s1;` onde `s1` é uma `String`, os bytes do texto no heap não são duplicados: apenas o cabeçalho na pilha é copiado e `s1` é invalidada.',
              true,
              'O move é barato e seguro: copia apenas `ptr`, `len` e `capacity` na pilha e marca `s1` como movida, mantendo uma única alocação no heap.',
            ),
            fill(
              'Complete a explicação sobre a atribuição `let b = a;` entre duas variáveis `String`:',
              'A operação realiza um ___ da posse, tornando ___ a única dona válida do texto.',
              ['move', 'b'],
              ['clone', 'a'],
              'Sem chamar `.clone()`, a atribuição de uma `String` faz um *move* de `a` para `b`, invalidando `a`.',
            ),
            mcq(
              'Por que o Rust invalida `s1` após `let s2 = s1;` em vez de deixar `s1` e `s2` ativas apontando para o mesmo buffer no heap?',
              [
                'Porque no fim do escopo tanto s1 quanto s2 tentariam liberar o mesmo buffer no heap (double free)',
                'Porque a pilha não tem espaço para dois cabeçalhos de 24 bytes',
                'Porque o texto no heap é apagado no momento da atribuição',
                'Porque variáveis imutáveis não podem apontar para o heap',
              ],
              0,
              'Se `s1` e `s2` continuassem donas do mesmo endereço no heap, ao fechar o bloco `}` ambas chamariam `drop` sobre o mesmo buffer, causando dupla liberação (*double free*).',
              {
                visual: code(
                  `fn main() {
    let s1 = String::from("dados");
    let s2 = s1;
} // fim do escopo`,
                  [2, 3, 4],
                  'Evitando double free',
                ),
              },
            ),
            order(
              'Ordene o ciclo de vida do buffer de texto neste programa:',
              [
                'let s1 = String::from("ok"); aloca o texto no heap tendo s1 como dona',
                'let s2 = s1; move a posse do buffer para s2 e invalida s1',
                'println!("{s2}"); lê o texto a partir da dona atual s2',
                'Ao fechar o "}" de main, s2 sai de escopo e libera o buffer do heap',
              ],
              'O buffer nasce com `s1`, muda de dono para `s2` no move, é lido por `s2` e finalmente é liberado uma única vez quando `s2` sai de escopo.',
            ),
            mcq(
              'Ao chegar na linha 5 do programa abaixo, qual variável é a dona válida do texto `"foguete"`?',
              ['Apenas c', 'Apenas a', 'Todas as três (a, b e c)', 'Apenas b e c'],
              0,
              'Na linha 3 a posse move de `a` para `b` (invalidando `a`); na linha 4 a posse move de `b` para `c` (invalidando `b`). Na linha 5, somente `c` é válida.',
              {
                visual: code(
                  `fn main() {
    let a = String::from("foguete");
    let b = a;
    let c = b;
    println!("{c}");
}`,
                  [2, 3, 4, 5],
                  'Cadeia de moves',
                ),
              },
            ),
            codePuzzle(
              'Monte o programa que cria a `String` em `s1`, transfere a posse para a variável mutável `s2`, acrescenta `"!"` usando a nova dona e imprime `s2`:',
              [
                'fn main() {',
                '    let s1 = String::from("Oi");',
                '    let mut s2 = s1;',
                '    s2.push_str("!");',
                '    println!("{s2}");',
                '}',
              ],
              [
                '    println!("{s1}");',
                '    let s2 = s1;',
                '    s1.push_str("!");',
              ],
              'Ao mover `s1` para `let mut s2 = s1;`, a nova dona `s2` passa a ter permissão de mutabilidade para chamar `s2.push_str("!")` e ser impressa.',
            ),
            gen((rng) => {
              const n = randInt(rng, 2, 7);
              return num(
                'Qual número é impresso na saída depois que o vetor muda de dono duas vezes e recebe mais um elemento?',
                n + 1,
                `O vetor nasce em \`v1\` com ${n} elementos, move para \`v2\` e depois para \`v3\`. Após \`v3.push(1)\`, \`v3.len()\` vale $${n} + 1 = ${n + 1}$.`,
                {
                  visual: code(
                    `fn main() {
    let v1 = vec![1; ${n}];
    let v2 = v1;
    let mut v3 = v2;
    v3.push(1);
    println!("{}", v3.len());
}`,
                    [2, 3, 4, 5],
                    'Move de Vec<i32>',
                  ),
                },
              );
            }),
          ],
        },
        {
          card: [
            {
              title: 'Erro E0382: valor já movido',
              body:
                'Se você tentar ler ou usar uma variável depois que a posse do valor dela foi movida para outro lugar, o compilador recusa o programa com o erro **E0382** (`borrow of moved value` ou `use of moved value`).\n\n' +
                'A mensagem de erro do `rustc` aponta exatamente três linhas: onde a variável foi criada (e que seu tipo não implementa `Copy`), onde ocorreu o move e onde você tentou usá-la depois.',
              visual: code(
                `fn main() {
    let s1 = String::from("alerta");
    let s2 = s1; // move ocorre aqui
    // ERRO E0382 na linha abaixo:
    println!("{s1}, {s2}");
}`,
                [3, 5],
                'Erro E0382',
              ),
            },
            {
              title: 'Reatribuir descarta o valor antigo',
              body:
                'O que acontece quando uma variável `mut` recebe um **novo** valor?\n' +
                '• Se ela ainda era dona de um valor (como `"antigo"` no código abaixo), esse valor antigo fica sem dono e sofre **drop imediatamente** na linha da atribuição.\n' +
                '• Se o valor anterior dela já havia sido movido para outra variável, atribuir um novo valor torna a variável `mut` válida novamente!',
              visual: code(
                `fn main() {
    let mut s = String::from("antigo");
    // "antigo" sofre drop nesta linha:
    s = String::from("novo");
    println!("{s}");
}`,
                [2, 4],
                'Reatribuição imediata',
              ),
            },
            {
              title: 'No seu computador 💻',
              body:
                'Faça o exercício 6 do roteiro: crie um projeto com `cargo new teste_move`, escreva um programa que move uma `String` de `a` para `b` e tenta imprimir `a`. Rode `cargo build` para ler o diagnóstico **E0382** e consulte `rustc --explain E0382`. Depois corrija o programa para imprimir apenas a partir da nova dona `b`.',
              visual: code(
                `fn main() {
    let a = String::from("Rust");
    let b = a;
    println!("Dono atual: {b}");
}`,
                [2, 3, 4],
                'src/main.rs',
              ),
              tip: 'Critério de pronto: após inspecionar o erro E0382 no terminal, o código corrigido imprime "Dono atual: Rust" e passa em cargo clippy -- -D warnings sem avisos.',
            },
          ],
          exercises: [
            mcq(
              'O que acontece ao tentar compilar o programa abaixo?',
              [
                'Não compila: erro E0382 (borrow of moved value: a) na linha 4',
                'Compila e imprime "chave"',
                'Compila, mas aborta com panic! ao executar a linha 4',
                'Não compila: erro E0384 porque falta mut na declaração de a',
              ],
              0,
              'Na linha 3, `let b = a;` move a `String` para `b` e invalida `a`. Tentar imprimir `a` na linha 4 dispara o erro de compilação **E0382** (`borrow of moved value: \`a\``).',
              {
                visual: code(
                  `fn main() {
    let a = String::from("chave");
    let b = a;
    println!("{a}");
}`,
                  [3, 4],
                  'Tentando usar após move',
                ),
              },
            ),
            tf(
              'No trecho abaixo, a memória do texto `"v1"` no heap é liberada na linha 3, no exato momento em que `msg` recebe `"v2"`.',
              true,
              'Quando `msg = String::from("v2");` é executado, o texto antigo `"v1"` perde seu único dono e sofre `drop` imediatamente na linha 3, antes do fim de `main`.',
              {
                visual: code(
                  `fn main() {
    let mut msg = String::from("v1");
    msg = String::from("v2");
    println!("{msg}");
}`,
                  [2, 3],
                  'Reatribuição de String',
                ),
              },
            ),
            mcq(
              'Em qual linha destacada o compilador aponta o uso inválido que causa o erro **E0382**?',
              [
                'Linha 5, onde v1.len() tenta usar v1 depois de seu valor ter sido movido para v2 na linha 3',
                'Linha 2, porque todo Vec precisa ser declarado com let mut',
                'Linha 3, porque um Vec não pode ser atribuído a outra variável',
                'Linha 4, porque chamar v2.len() consome e destrói v2',
              ],
              0,
              'Na linha 3 a posse do vetor é movida de `v1` para `v2`. Na linha 4 o uso de `v2` é válido, mas na linha 5 tentar acessar `v1.len()` falha com **E0382**.',
              {
                visual: code(
                  `fn main() {
    let v1 = vec![10, 20, 30];
    let v2 = v1;
    println!("v2 = {}", v2.len());
    println!("v1 = {}", v1.len());
}`,
                  [2, 3, 4, 5],
                  'Rastreando o erro E0382',
                ),
              },
            ),
            mcq(
              'Analise o que acontece com a variável mutável `s` na linha 4. Este programa compila?',
              [
                'Sim: compila e imprime "um e dois", pois s recebeu uma nova String na linha 4 antes de ser lida',
                'Não: falha na linha 4 com E0382 porque uma variável movida nunca mais pode receber valor',
                'Não: falha na linha 5 com E0382 ao imprimir outro',
                'Sim: compila e imprime "dois e dois"',
              ],
              0,
              'Mover `s` para `outro` na linha 3 deixa `s` temporariamente sem valor, mas como `s` é `mut`, a linha 4 entrega uma nova `String` (`"dois"`) para `s`, tornando-a válida novamente!',
              {
                visual: code(
                  `fn main() {
    let mut s = String::from("um");
    let outro = s;
    s = String::from("dois");
    println!("{outro} e {s}");
}`,
                  [3, 4, 5],
                  'Reinicializando variável movida',
                ),
              },
            ),
            match(
              'Associe cada código ou operação ao seu efeito em Rust, considerando que `s` ainda possui o valor antigo na reatribuição:',
              [
                ['Erro E0382', 'Uso de variável cujo valor já foi movido'],
                ['Erro E0384', 'Tentativa de reatribuir variável sem mut'],
                ['let b = a; (em String)', 'Transfere a posse para b e invalida a'],
                ['s = String::from("novo");', 'Descarta na hora o valor antigo que estava em s'],
              ],
              '`E0382` indica valor movido; `E0384` indica falta de `mut` ao reatribuir; `let b = a` move a posse; e reatribuir uma variável ativa descarta imediatamente o valor anterior.',
            ),
            fill(
              'Complete o comando de terminal que exibe a explicação detalhada oficial do compilador sobre o erro de valor movido:',
              'rustc ___ ___',
              ['--explain', 'E0382'],
              ['--fix', 'E0308'],
              'O comando `rustc --explain E0382` mostra no próprio terminal exemplos completos do erro de uso de valor movido e como corrigi-lo.',
            ),
            codePuzzle(
              'Monte o programa em que `s` começa com `"A"`, move seu valor para `backup`, recebe uma nova `String` `"B"` e imprime os dois textos:',
              [
                'fn main() {',
                '    let mut s = String::from("A");',
                '    let backup = s;',
                '    s = String::from("B");',
                '    println!("{backup} -> {s}");',
                '}',
              ],
              [
                '    let s = String::from("A");',
                '    let backup = &s;',
                '    println!("{s} -> {s}");',
              ],
              'Com `let mut s`, podemos mover o valor `"A"` para `backup` e em seguida atribuir uma nova `String` `"B"` a `s`, imprimindo `"A -> B"`.',
            ),
            gen((rng) => {
              const a = randInt(rng, 10, 40);
              const b = randInt(rng, 50, 90);
              return num(
                'Qual número é impresso na saída deste programa?',
                a + b,
                `O vetor com \`${a}\` é movido para \`guardado\`, e \`v\` recebe um novo vetor com \`${b}\`. A soma \`guardado[0] + v[0]\` vale $${a} + ${b} = ${a + b}$.`,
                {
                  visual: code(
                    `fn main() {
    let mut v = vec![${a}];
    let guardado = v;
    v = vec![${b}];
    println!("{}", guardado[0] + v[0]);
}`,
                    [2, 3, 4, 5],
                    'Move e nova atribuição',
                  ),
                },
              );
            }),
          ],
        },
      ],
    },
    {
      id: 'ro-own-clone',
      title: 'Clone e Copy',
      parts: [
        {
          card: [
            {
              title: 'Cópia profunda explícita: .clone()',
              body:
                'Quando você realmente precisa de duas variáveis `String` ou `Vec` independentes, cada uma dona de seu próprio buffer no heap, chame o método **`.clone()`**. Buffers vazios e vetores de elementos de tamanho zero não precisam de alocação.\n\n' +
                'Diferente do move (que transfere apenas o cabeçalho), para uma `String` não vazia, `let s2 = s1.clone();` pede um **novo bloco no heap** e duplica todos os bytes do conteúdo. Essa cópia pode custar tempo e memória. Em geral, `Clone` depende do tipo: não significa sempre cópia profunda (em um `Vec<T>`, cada elemento é clonado conforme seu próprio tipo).',
              visual: code(
                `fn main() {
    let s1 = String::from("matriz");
    let s2 = s1.clone();
    println!("s1={s1}, s2={s2}");
}`,
                [2, 3],
                'Duplicando com .clone()',
              ),
            },
            {
              title: 'Dois donos, dois buffers no heap',
              body:
                'Após `let mut s2 = s1.clone();`, `s1` e `s2` continuam ambas válidas porque cada uma é dona de um endereço diferente no heap. Alterar `s2` nunca afeta `s1`.',
              visual: table(
                ['Variável (pilha)', 'Ponteiro (ptr)', 'Buffer próprio no heap'],
                [
                  ['s1', '0x7f00', '"matriz" (6 B)'],
                  ['s2 = s1.clone()', '0x7f80 (novo!)', '"matriz" (6 B)'],
                ],
                [0, 1],
              ),
            },
          ],
          exercises: [
            mcq(
              'O que o método `.clone()` faz ao ser chamado em `let s2 = s1.clone();` para uma `String` não vazia?',
              [
                'Aloca um segundo buffer no heap, copia os bytes do texto e mantém s1 e s2 válidas',
                'Apenas transfere a posse de s1 para s2 e invalida s1',
                'Faz s1 e s2 apontarem para o mesmo endereço no heap sem copiar bytes',
                'Apaga s1 da pilha e move os bytes para o código executável',
              ],
              0,
              '`.clone()` realiza uma cópia profunda (*deep copy*): cria uma nova alocação no heap com uma cópia dos bytes, de modo que `s1` e `s2` são donas de buffers independentes.',
            ),
            tf(
              'Se fizermos `let mut s2 = s1.clone();` e depois `s2.push_str("!");`, o texto guardado em `s1` permanece inalterado.',
              true,
              'Como `s2` recebeu um buffer próprio no heap via `.clone()`, qualquer modificação em `s2` afeta apenas o buffer de `s2`.',
            ),
            mcq(
              'Qual é a saída impressa por este programa?',
              ['sol / solar', 'solar / solar', 'sol / sol', 'Não compila: erro E0382 ao imprimir s1'],
              0,
              '`s1` permanece intacta com `"sol"`, enquanto a cópia independente `s2` recebe `"ar"` e vira `"solar"`. A saída é `"sol / solar"`.',
              {
                visual: code(
                  `fn main() {
    let s1 = String::from("sol");
    let mut s2 = s1.clone();
    s2.push_str("ar");
    println!("{s1} / {s2}");
}`,
                  [3, 4, 5],
                  'Modificando o clone',
                ),
              },
            ),
            fill(
              'Complete a linha para criar uma cópia independente do vetor no heap sem invalidar `a`:',
              'let b = a.___();',
              ['clone'],
              ['copy', 'move', 'drop'],
              'O método `.clone()` duplica o buffer do `Vec` no heap e conserva a variável original `a` válida.',
            ),
            num(
              'Quantos buffers de texto distintos existem alocados no heap imediatamente antes do `println!` na linha 5?',
              2,
              '`a` aloca o 1º buffer; `b = a.clone()` aloca o 2º buffer no heap; já `let c = b;` apenas move a posse do 2º buffer de `b` para `c` sem criar um 3º buffer.',
              {
                visual: code(
                  `fn main() {
    let a = String::from("abc");
    let b = a.clone();
    let c = b;
    println!("{a} {c}");
}`,
                  [2, 3, 4],
                  'Contando alocações no heap',
                ),
              },
            ),
            mcq(
              'Por que este programa não compila e em qual linha destacada o erro **E0382** se manifesta?',
              [
                'Na linha 5, porque a foi movida para c na linha 4 (apenas a linha 3 usou .clone())',
                'Na linha 3, porque chamar a.clone() invalida a variável a',
                'Na linha 4, porque é proibido mover uma variável que já foi clonada antes',
                'Na linha 2, porque falta mut na declaração de a',
              ],
              0,
              'Na linha 3 `a.clone()` mantém `a` válida, mas na linha 4 `let c = a;` faz um move de `a` para `c`. Por isso, tentar ler `a` na linha 5 dispara o erro **E0382**.',
              {
                visual: code(
                  `fn main() {
    let a = String::from("item");
    let b = a.clone();
    let c = a;
    println!("{a} {b} {c}");
}`,
                  [2, 3, 4, 5],
                  'Clone seguido de move',
                ),
              },
            ),
            codePuzzle(
              'Monte o programa que cria o vetor `v1`, faz uma cópia independente em `v2` com `.clone()`, adiciona `4` apenas em `v2` e imprime os dois vetores:',
              [
                'fn main() {',
                '    let v1 = vec![1, 2, 3];',
                '    let mut v2 = v1.clone();',
                '    v2.push(4);',
                '    println!("{:?} {:?}", v1, v2);',
                '}',
              ],
              [
                '    let mut v2 = v1;',
                '    let v2 = v1.clone();',
                '    v1.push(4);',
              ],
              '`let mut v2 = v1.clone();` cria um segundo vetor mutável no heap. Assim podemos fazer `v2.push(4)` e imprimir `v1` e `v2` lado a lado.',
            ),
            gen((rng) => {
              const x = randInt(rng, 2, 8);
              const y = randInt(rng, 3, 9);
              return num(
                'Qual número é impresso na saída após clonar o vetor e alterar apenas `v2[0]`?',
                x + 10 + y,
                `Como \`v2\` é um clone independente, \`v1[0]\` continua valendo ${x} e \`v1[1]\` vale ${y}, enquanto \`v2[0]\` passa a ser 10. A soma é $${x} + 10 + ${y} = ${x + 10 + y}$.`,
                {
                  visual: code(
                    `fn main() {
    let v1 = vec![${x}, ${y}];
    let mut v2 = v1.clone();
    v2[0] = 10;
    let r = v1[0] + v2[0] + v1[1];
    println!("{r}");
}`,
                    [2, 3, 4, 5],
                    'Independência do clone',
                  ),
                },
              );
            }),
          ],
        },
        {
          card: [
            {
              title: 'Tipos Copy: cópia automática na pilha',
              body:
                'Por que `let x = 5; let y = x;` **não** invalida `x`? Porque o tipo inteiro de `x` implementa a trait **`Copy`**, independentemente da região de memória onde está.\n\n' +
                'Quando um tipo é `Copy`, atribuir ou passar por valor copia o valor e a variável original continua válida; o compilador pode otimizar a cópia física dos bytes. São `Copy` por padrão:\n' +
                '• Todos os inteiros (`i8`, `i32`, `u64`, `usize`...) e pontos flutuantes (`f32`, `f64`).\n' +
                '• Booleanos (`bool`) e caracteres Unicode (`char`).\n' +
                '• Arrays `[T; N]` e tuplas `(T1, T2)` **somente se** todos os seus elementos também forem `Copy`.',
              visual: code(
                `fn main() {
    let x: i32 = 42;
    let y = x; // Copy: x segue válido!
    let par = (10, true);
    let outro = par;
    println!("{x} {y} {}", par.0);
}`,
                [2, 3, 4, 5],
                'Tipos Copy na pilha',
              ),
            },
            {
              title: '#[derive(Clone, Copy)] em structs',
              body:
                'Suas próprias `struct`s **não** são `Copy` por padrão: atribuir `let p2 = p1;` move `p1`! Mas se todos os campos da `struct` forem `Copy` e ela não implementar `Drop`, basta colocar `#[derive(Clone, Copy)]` acima dela para que ela passe a ser copiada automaticamente.\n\n' +
                'Se algum campo não for `Copy` (como `String`), tentar derivar `Copy` falha com o erro **E0204**.',
              visual: code(
                `#[derive(Clone, Copy)]
struct Ponto {
    x: i32,
    y: i32,
}

fn main() {
    let p1 = Ponto { x: 3, y: 4 };
    let p2 = p1; // Copy!
    println!("{} {}", p1.x, p2.y);
}`,
                [1, 8, 9],
                'Struct com Clone e Copy',
              ),
            },
            {
              title: 'No seu computador 💻',
              body:
                'Faça o exercício 7 do roteiro: crie `struct Ponto { x: i32, y: i32 }` primeiro sem `#[derive(Clone, Copy)]` e veja o erro **E0382** ao usar `p1` depois de `let p2 = p1;`. Em seguida, adicione `#[derive(Clone, Copy)]` acima da `struct` e confirme que `p1` e `p2` funcionam como um `i32`.',
              visual: code(
                `#[derive(Clone, Copy)]
struct Ponto {
    x: i32,
    y: i32,
}

fn main() {
    let p1 = Ponto { x: 2, y: 5 };
    let p2 = p1;
    println!("({}, {})", p1.x, p2.y);
}`,
                [1, 8, 9, 10],
                'src/main.rs',
              ),
              tip: 'Critério de pronto: cargo run imprime "(2, 5)" lendo p1.x e p2.y sem precisar de .clone(), e cargo clippy -- -D warnings termina sem avisos.',
            },
          ],
          exercises: [
            multi(
              'Quais dos tipos abaixo implementam a trait `Copy` na biblioteca padrão do Rust?',
              ['i32 e u64', 'bool e char', '(i32, f64)', 'String e Vec<i32>'],
              [0, 1, 2],
              'Inteiros, ponto flutuante, `bool`, `char` e tuplas formadas apenas por tipos `Copy` implementam `Copy`. Já `String` e `Vec<i32>` alocam no heap e não são `Copy`.',
            ),
            tf(
              'Uma tupla do tipo `(i32, String)` implementa `Copy` automaticamente porque seu primeiro campo é um `i32`.',
              false,
              'Uma tupla só é `Copy` quando **todos** os seus elementos são `Copy`. Como `String` não é `Copy`, a tupla `(i32, String)` inteira sofre move na atribuição.',
            ),
            mcq(
              'O que acontece ao compilar o código abaixo, em que `Ponto` foi declarada **sem** `#[derive(Clone, Copy)]`?',
              [
                'Não compila: erro E0382 ao ler p1.x, pois structs sofrem move por padrão mesmo tendo só campos i32',
                'Compila e imprime "1 1", pois todos os campos internos são i32',
                'Não compila: erro E0204 na declaração de Ponto',
                'Compila, mas zera os campos de p1 após a linha 8',
              ],
              0,
              'Em Rust, uma `struct` só é `Copy` se você optar explicitamente por isso (por exemplo, com `#[derive(Clone, Copy)]`). Sem essa anotação, `let p2 = p1;` move `p1` e a linha 9 falha com **E0382**.',
              {
                visual: code(
                  `struct Ponto {
    x: i32,
    y: i32,
}

fn main() {
    let p1 = Ponto { x: 1, y: 2 };
    let p2 = p1;
    println!("{} {}", p1.x, p2.x);
}`,
                  [1, 8, 9],
                  'Struct sem derive(Copy)',
                ),
              },
            ),
            mcq(
              'Por que o compilador recusa este código com o erro **E0204** (`the trait Copy cannot be implemented for this type`)?',
              [
                'Porque o campo nome é do tipo String, que não implementa Copy',
                'Porque o tipo u32 não implementa Copy',
                'Porque structs com dois campos nunca podem derivar Copy',
                'Porque Copy precisa aparecer antes de Clone dentro do derive',
              ],
              0,
              'Para derivar `Copy` em uma `struct`, todos os seus campos precisam implementar `Copy`. Como `nome: String` é dono de um buffer no heap e não é `Copy`, o compilador emite o erro **E0204**.',
              {
                visual: code(
                  `#[derive(Clone, Copy)]
struct Aluno {
    id: u32,
    nome: String,
}`,
                  [1, 4],
                  'Erro E0204',
                ),
              },
            ),
            match(
              'Associe cada tipo ao que ocorre ao executar `let b = a;`:',
              [
                ['i32', 'Copy: copia 4 bytes na pilha e mantém a válido'],
                ['(i32, bool)', 'Copy: tupla apenas de tipos Copy é copiada'],
                ['(i32, String)', 'Move: contém String, portanto invalida a'],
                ['Vec<u8>', 'Move: dono de memória no heap, exige .clone() para duplicar'],
              ],
              'Tipos inteiramente `Copy` (`i32` e `(i32, bool)`) são copiados na atribuição; tipos que possuem `String` ou `Vec` sofrem move.',
            ),
            fill(
              'Complete o atributo para que uma `struct` só de campos numéricos implemente cópia automática na atribuição:',
              '#[derive(Clone, ___)]',
              ['Copy'],
              ['Drop', 'Move', 'Clone'],
              '`Copy` tem `Clone` como supertrait. Aqui derivamos os dois juntos com `#[derive(Clone, Copy)]`; a ordem inversa também seria válida.',
            ),
            codePuzzle(
              'Monte o programa com a `struct Par` copiável e a função `main` que cria `p1`, copia para `p2` por atribuição e imprime a soma `p1.a + p2.b`:',
              [
                '#[derive(Clone, Copy)]',
                'struct Par { a: i32, b: i32 }\n\nfn main() {',
                'let p1 = Par { a: 4, b: 6 };',
                'let p2 = p1;',
                'println!("{}", p1.a + p2.b);',
                '}',
              ],
              [
                '#[derive(Drop, Copy)]',
                '#[derive(Copy)]',
                'println!("{}", p1.0 + p2.1);',
              ],
              'Com `#[derive(Clone, Copy)]` antes de `struct Par`, a atribuição `let p2 = p1;` faz uma cópia na pilha e permite usar tanto `p1.a` quanto `p2.b`.',
            ),
            gen((rng) => {
              const a = randInt(rng, 3, 9);
              const b = randInt(rng, 2, 8);
              return num(
                'Qual número é impresso na saída deste programa?',
                2 * a + b + 5,
                `Como \`Vet2\` implementa \`Copy\`, \`v1.x\` continua valendo ${a} e \`v1.y\` vale ${b}, enquanto \`v2.x\` passa a valer $${a} + 5 = ${a + 5}$. A soma é $${a} + ${a + 5} + ${b} = ${2 * a + b + 5}$.`,
                {
                  visual: code(
                    `#[derive(Clone, Copy)]
struct Vet2 { x: i32, y: i32 }

fn main() {
    let v1 = Vet2 { x: ${a}, y: ${b} };
    let mut v2 = v1;
    v2.x += 5;
    println!("{}", v1.x + v2.x + v1.y);
}`,
                    [1, 6, 7, 8],
                    'Cópia independente na pilha',
                  ),
                },
              );
            }),
          ],
        },
      ],
    },
    {
      id: 'ro-own-drop',
      title: 'Escopo, drop e RAII',
      parts: [
        {
          card: [
            {
              title: 'Escopo e limpeza automática (RAII)',
              body:
                'O **escopo** de uma variável começa na linha `let` onde ela é declarada e vai até a chave de fechamento **`}`** do bloco em que ela vive.\n\n' +
                'Pela 3ª regra do ownership, ao sair normalmente do escopo, os valores ainda pertencentes às variáveis são descartados. Rust chama **`Drop::drop`** quando o tipo implementa **`Drop`** e também descarta seus campos (padrão conhecido como **RAII** — *Resource Acquisition Is Initialization*). Em uma `String`, isso libera o buffer no heap.\n\n' +
                'Quando há várias variáveis no mesmo bloco, elas sofrem `drop` na **ordem inversa da declaração** (LIFO: a última criada é a primeira a ser destruída).',
              visual: code(
                `fn main() {
    let a = String::from("primeiro");
    {
        let b = String::from("interno");
        println!("{b}");
    } // b sofre drop aqui!
    println!("{a}");
} // a sofre drop aqui!`,
                [4, 6, 8],
                'Escopo de blocos',
              ),
              tip: 'Em C, esquecer um free() vaza memória e chamar free() cedo demais cria ponteiro pendurado. Em Rust, a limpeza automática acompanha a saída do escopo, inclusive por return antes do "}" final, para os valores que ainda pertencem às variáveis.',
            },
            {
              title: 'Ordem inversa de destruição (LIFO)',
              body:
                'Podemos observar o `drop` implementando a trait `Drop` em uma `struct`. Veja na tabela a ordem de criação e de destruição de duas variáveis `x` e `y` declaradas no mesmo bloco:',
              visual: table(
                ['Momento no bloco', 'Variável', 'Ação executada'],
                [
                  ['1ª declaração let', 'x', 'Criada primeiro'],
                  ['2ª declaração let', 'y', 'Criada por último'],
                  ['Fechamento "}"', 'y', '1ª a sofrer drop (LIFO)'],
                  ['Fechamento "}"', 'x', '2ª a sofrer drop'],
                ],
                [2, 3],
              ),
            },
          ],
          exercises: [
            mcq(
              'Ao chegar normalmente ao fim de um bloco, sem move, reatribuição nem descarte antecipado, quando o Rust libera o buffer de uma `String` local?',
              [
                'Na chave de fechamento "}" do escopo da variável que é sua dona atual',
                'Apenas quando o sistema operacional encerra o processo inteiro',
                'Periodicamente, quando o coletor de lixo pausa as threads',
                'Nunca automaticamente: é obrigatório chamar free() antes do return',
              ],
              0,
              'Rust não usa coletor de lixo: ao chegar ao `}` do bloco, a limpeza automática da `String` descarta seu campo `Vec<u8>`, liberando o buffer no heap.',
            ),
            tf(
              'Se um bloco declara primeiro `let a = String::from("1");` e depois `let b = String::from("2");`, ao final desse bloco `b` sofre `drop` antes de `a`.',
              true,
              'Variáveis de um mesmo escopo são destruídas na ordem inversa da declaração (LIFO): como `b` foi criada depois de `a`, `b` é descartada primeiro.',
            ),
            mcq(
              'O que acontece ao tentar compilar o programa abaixo?',
              [
                'Não compila: erro E0425 (cannot find value segredo in this scope) na linha 5',
                'Não compila: erro E0382 (use of moved value) na linha 5',
                'Compila e imprime "x"',
                'Compila e imprime uma linha em branco',
              ],
              0,
              'A variável `segredo` foi declarada dentro do bloco interno das linhas 2 a 4. Ao fechar o `}` na linha 4, ela sai de escopo e deixa de existir; na linha 5 o compilador aponta **E0425** (`cannot find value \`segredo\` in this scope`).',
              {
                visual: code(
                  `fn main() {
    {
        let segredo = String::from("x");
    }
    println!("{segredo}");
}`,
                  [3, 4, 5],
                  'Fora de escopo (E0425)',
                ),
              },
            ),
            order(
              'Em `main`, declaramos `let s1`, abrimos e fechamos um bloco interno `{ let s2; }`, e depois declaramos `let s3` até o fim de `main`. Ordene a sequência em que `s1`, `s2` e `s3` sofrem `drop`:',
              [
                's2 (ao fechar a chave "}" do bloco interno)',
                's3 (ao fechar main, pois foi declarada depois de s1)',
                's1 (ao fechar main, pois foi declarada primeiro)',
              ],
              '`s2` morre primeiro ao final do bloco interno; no `}` final de `main`, `s3` e `s1` são destruídas na ordem inversa da declaração (`s3` antes de `s1`).',
            ),
            mcq(
              'Qual será a saída exata impressa por este programa que implementa a trait `Drop`?',
              ['inicio B A ', 'inicio A B ', 'A B inicio ', 'B A inicio '],
              0,
              'Primeiro `print!("inicio ")` é executado; depois, ao fechar o `}` de `main`, `_b` (declarada por último) sofre `drop` imprimindo `"B "` e, em seguida, `_a` sofre `drop` imprimindo `"A "`.',
              {
                visual: code(
                  `struct Aviso(&'static str);
impl Drop for Aviso {
    fn drop(&mut self) {
        print!("{} ", self.0);
    }
}
fn main() {
    let _a = Aviso("A");
    let _b = Aviso("B");
    print!("inicio ");
}`,
                  [3, 8, 9, 10],
                  'Ordem de execução do Drop',
                ),
              },
            ),
            fill(
              'Complete a regra que relaciona destrutores próprios e cópia automática (erro E0184):',
              'Um destrutor próprio é implementado pela trait ___; um tipo que a implementa nunca pode implementar também a trait ___.',
              ['Drop', 'Copy'],
              ['Clone', 'Sized'],
              'O compilador proíbe implementar `Drop` e `Copy` no mesmo tipo (**E0184**): copiar implicitamente os bits de um dono de recursos poderia levar a liberar o mesmo recurso duas vezes. Tipos sem `Drop` próprio ainda podem ter campos que precisam ser descartados.',
            ),
            codePuzzle(
              'Monte a função `main` em que um bloco interno cria a `String` temporária `temp`, soma o tamanho dela a `total` e encerra o bloco para descartar `temp` antes do `println!`:',
              [
                'fn main() {',
                'let mut total = 0;',
                '{',
                '    let temp = String::from("bloco");',
                '    total += temp.len();',
                '}',
                'println!("{total}");',
                '}',
              ],
              [
                'println!("{temp}");',
                'let total = 0;',
                '    temp.drop();',
              ],
              'O bloco interno `{ ... }` limita a vida de `temp`: seu tamanho é somado a `total` e, ao fechar `}`, a memória de `temp` no heap é liberada antes do `println!`.',
            ),
            gen((rng) => {
              const a = randInt(rng, 2, 6);
              const b = randInt(rng, 3, 7);
              const sa = 'x'.repeat(a);
              const sb = 'y'.repeat(b);
              return num(
                'Quantos bytes de texto continuam alocados no heap no momento em que a linha 7 (`println!("{s1}");`) é executada?',
                a,
                `A \`String\` \`s2\` (${b} bytes) já sofreu \`drop\` na linha 6 ao fechar o bloco interno. Na linha 7, resta apenas o buffer de \`s1\` com ${a} bytes no heap.`,
                {
                  unit: 'bytes',
                  visual: code(
                    `fn main() {
    let s1 = String::from("${sa}");
    {
        let s2 = String::from("${sb}");
        println!("{}", s2.len());
    }
    println!("{s1}");
}`,
                    [2, 4, 6, 7],
                    'Memória viva após bloco interno',
                  ),
                },
              );
            }),
          ],
        },
        {
          card: [
            {
              title: 'Liberando cedo com drop(v)',
              body:
                'Às vezes queremos liberar um valor pesado (ou soltar um bloqueio) **antes** de chegar ao `}` final da função.\n\n' +
                'Rust proíbe chamar o método `Drop::drop` diretamente, como em `v.drop()` para um `Vec` (erro **E0040**: `explicit use of destructor method`), porque o compilador chamaria o destrutor de novo no fim do bloco, podendo causar *double free*. A forma correta é chamar a função **`drop(v)`** (`std::mem::drop`), que recebe `v` por valor (tomando a posse se não for `Copy`) e o descarta imediatamente quando seu próprio escopo vazio termina!',
              visual: code(
                `fn main() {
    let v = vec![1, 2, 3, 4];
    drop(v); // move v e libera agora!
    // Usar v aqui daria erro E0382
    println!("Vetor já foi liberado");
}`,
                [2, 3],
                'Liberando antes do fim do bloco',
              ),
            },
            {
              title: 'Box<T>: um único dono no heap',
              body:
                'Quer guardar um único valor no heap em vez da pilha? Use **`Box<T>`** com `Box::new(valor)` (exercício 12 do roteiro). O `Box` coloca o dado no heap, guarda o ponteiro na pilha como único dono e libera o heap automaticamente no `drop`. Para acessar o valor apontado, usamos o operador de desreferência `*b`.',
              visual: code(
                `fn main() {
    let b = Box::new(25);
    println!("dobro = {}", *b * 2);
} // b sai de escopo e libera o heap`,
                [2, 3],
                'Box<i32> no heap',
              ),
            },
            {
              title: 'No seu computador 💻',
              body:
                'Combine os exercícios 12 e 46 do roteiro: crie `struct Recurso(i32)` e implemente `Drop` para ela imprimindo `"Liberando <n>"`. No `main`, aloque `let r = Box::new(Recurso(1));`, libere-o antecipadamente com `drop(r);` e imprima `"Fim do main"` na linha seguinte.',
              visual: code(
                `struct Recurso(i32);
impl Drop for Recurso {
    fn drop(&mut self) {
        let id = self.0;
        println!("Liberando {id}");
    }
}
fn main() {
    let r = Box::new(Recurso(1));
    drop(r);
    println!("Fim do main");
}`,
                [9, 10, 11],
                'src/main.rs',
              ),
              tip: 'Critério de pronto: cargo run imprime "Liberando 1" ANTES de "Fim do main", comprovando o descarte antecipado, e cargo clippy -- -D warnings termina sem avisos.',
            },
          ],
          exercises: [
            mcq(
              'O que acontece ao tentar chamar o método destrutor diretamente com `s.drop()` neste `Vec<i32>`?',
              [
                'Não compila: erro E0040 (explicit use of destructor method); deve-se usar drop(s)',
                'Compila e libera o vetor normalmente na linha 3',
                'Não compila: erro E0384 porque s não deveria ser mut',
                'Compila, mas ignora a linha 3 em modo release',
              ],
              0,
              'Chamar `s.drop()` diretamente é proibido com o erro **E0040** porque `s` continuaria no escopo e sofreria um segundo `drop` no `}` final. O compilador sugere usar `drop(s)`.',
              {
                visual: code(
                  `fn main() {
    let mut s = vec![1, 2, 3];
    s.drop();
}`,
                  [3],
                  'Erro E0040',
                ),
              },
            ),
            mcq(
              'Veja a implementação de `std::mem::drop`. Por que essa função de corpo vazio descarta um valor não-`Copy` passado por valor, como uma `String`?',
              [
                'Porque ela recebe _x por valor (tomando a posse) e seu escopo termina imediatamente no "}", descartando _x',
                'Porque o nome _x aciona um coletor de lixo especial em tempo de execução',
                'Porque ela zera toda a pilha da função main',
                'Porque ela transforma o tipo T em Copy antes de retornar',
              ],
              0,
              '`pub fn drop<T>(_x: T) {}` usa as próprias regras de ownership do Rust: para um valor não-`Copy`, `drop(v)` move a posse para `_x`, que sai de escopo ao fechar `{}` e é descartado. Para um valor `Copy`, apenas uma cópia é passada e a variável original continua válida.',
              {
                visual: code(
                  `pub fn drop<T>(_x: T) {}`,
                  [1],
                  'std::mem::drop',
                ),
              },
            ),
            mcq(
              'Se descomentarmos a linha 4 deste programa, qual erro o compilador apontará?',
              [
                'Erro E0382 (borrow of moved value: dados), pois drop(dados) moveu e consumiu dados na linha 3',
                'Erro E0040 (explicit use of destructor method)',
                'Erro E0425 (cannot find value dados in this scope)',
                'Nenhum erro: dados passa a ser um vetor vazio de tamanho 0',
              ],
              0,
              'Como `drop(dados)` recebe `dados` por valor, a posse de `dados` foi movida na linha 3. Tentar usá-la na linha 4 produz o erro **E0382**.',
              {
                visual: code(
                  `fn main() {
    let dados = vec![10, 20];
    drop(dados);
    // println!("{}", dados.len());
}`,
                  [3, 4],
                  'Uso após drop(dados)',
                ),
              },
            ),
            tf(
              'O tipo `Box<i32>` implementa a trait `Copy` porque o inteiro `i32` guardado dentro dele é `Copy`.',
              false,
              '`Box<T>` é dono de uma alocação no heap e possui destrutor (`Drop`), portanto **nunca** implementa `Copy`: atribuir `let b2 = b1;` move o `Box` e invalida `b1`.',
            ),
            match(
              'Associe cada expressão ao seu papel no gerenciamento de memória:',
              [
                ['Box::new(5)', 'Aloca o inteiro 5 no heap e devolve o dono Box<i32>'],
                ['*b', 'Desreferencia o Box b para ler o valor guardado no heap'],
                ['drop(b)', 'Move a posse de b para std::mem::drop e libera o heap já'],
                ['b.drop()', 'Chamada direta proibida pelo compilador com erro E0040'],
              ],
              '`Box::new` aloca no heap, `*b` acessa o valor apontado, `drop(b)` consome a posse para liberar antes do fim do escopo e `b.drop()` é recusado com `E0040`.',
            ),
            num(
              'Qual número é impresso na saída deste programa?',
              20,
              '`b1` aloca `12` no heap; `let b2 = b1;` move a posse do `Box` para `b2`; e `*b2 + 8` calcula $12 + 8 = 20$.',
              {
                visual: code(
                  `fn main() {
    let b1 = Box::new(12);
    let b2 = b1;
    println!("{}", *b2 + 8);
}`,
                  [2, 3, 4],
                  'Move e desreferência de Box',
                ),
              },
            ),
            codePuzzle(
              'Monte a função `main` que aloca `15` no heap com `Box::new`, move a posse para `b2`, imprime o dobro do valor desreferenciado e libera `b2` antes do fim com `drop`:',
              [
                'fn main() {',
                '    let b1 = Box::new(15);',
                '    let b2 = b1;',
                '    println!("{}", *b2 * 2);',
                '    drop(b2);',
                '}',
              ],
              [
                '    b2.drop();',
                '    println!("{}", *b1 * 2);',
                '    println!("{}", b2 * 2);',
              ],
              'Depois que `let b2 = b1;` move o `Box`, lemos o valor no heap com `*b2 * 2` antes de chamar `drop(b2)` (pois `drop(b2)` consome `b2`).',
            ),
            gen((rng) => {
              const a = randInt(rng, 4, 12);
              const b = randInt(rng, 2, 6);
              return num(
                'Qual número é impresso na saída deste programa?',
                a * b + b,
                `\`soma\` calcula \`*x * *y\` $= ${a} \\times ${b} = ${a * b}$. Em seguida \`drop(x)\` libera apenas \`x\`, enquanto \`y\` continua válido para somar \`soma + *y\` $= ${a * b} + ${b} = ${a * b + b}$.`,
                {
                  visual: code(
                    `fn main() {
    let x = Box::new(${a});
    let y = Box::new(${b});
    let soma = *x * *y;
    drop(x);
    println!("{}", soma + *y);
}`,
                    [2, 3, 4, 5, 6],
                    'Descarte seletivo com drop',
                  ),
                },
              );
            }),
          ],
        },
      ],
    },
    {
      id: 'ro-own-func',
      title: 'Ownership em funções',
      parts: [
        {
          card: [
            {
              title: 'Passar argumento funciona como atribuir',
              body:
                'Passar uma variável para uma função segue **exatamente** a mesma mecânica da atribuição `let`:\n' +
                '• Se o parâmetro **não é `Copy`** (como `fn consumir(texto: String)`), a posse **move** do argumento para o parâmetro `texto`. Se ele não for movido adiante, `texto` sai de escopo e sofre `drop` ao terminar a função!\n' +
                '• Se o parâmetro **é `Copy`** (como `fn mostrar(n: i32)`), o valor é copiado na pilha e a variável original em `main` continua válida.',
              visual: code(
                `fn consumir(texto: String) {
    println!("Recebi: {texto}");
} // texto sofre drop aqui!

fn mostrar(n: i32) {
    println!("Número: {n}");
}

fn main() {
    let s = String::from("nota");
    consumir(s); // move s
    let x = 10;
    mostrar(x); // Copy x
    println!("x ainda vale {x}");
}`,
                [1, 3, 11, 13, 14],
                'Move vs. Copy em argumentos',
              ),
            },
            {
              title: 'Quem é o dono em cada etapa?',
              body:
                'Acompanhe na tabela o estado de `s` (`String`) e de `x` (`i32`) antes, durante e depois das chamadas de `consumir(s)` e `mostrar(x)`:',
              visual: table(
                ['Etapa', 's (String)', 'x (i32)'],
                [
                  ['Antes da chamada', 'Dona em main', 'Válido em main (10)'],
                  ['Dentro da função', 'Movida para texto', 'Copiado para n (10)'],
                  ['Após retornar a main', 'Inválida (já sofreu drop)', 'Continua válido (10)'],
                ],
                [1, 2],
              ),
            },
          ],
          exercises: [
            mcq(
              'O que acontece com uma variável `s: String` declarada em `main` quando chamamos `processar(s);` para `fn processar(entrada: String)`, cujo corpo apenas imprime `entrada`?',
              [
                'A posse move para o parâmetro entrada, e o buffer no heap é liberado quando processar termina',
                'Uma cópia profunda automática é feita no heap antes de entrar na função',
                's continua válida em main depois que processar retorna',
                'O código não compila porque funções não podem receber String por valor',
              ],
              0,
              'Passar `s` por valor transfere a posse para o parâmetro `entrada`. Como `processar` não devolve a `String`, ela sai de escopo e sofre `drop` no `}` final de `processar`.',
            ),
            tf(
              'Se passarmos uma variável `n: i32` para `fn exibir(v: i32)`, podemos continuar usando `n` normalmente na linha seguinte à chamada.',
              true,
              'Como `i32` implementa `Copy`, a chamada `exibir(n)` copia os 4 bytes na pilha para o parâmetro `v` e mantém `n` intacta no chamador.',
            ),
            mcq(
              'Por que o programa abaixo não compila e qual é o código do erro emitido pelo `rustc`?',
              [
                'Erro E0382 (use of moved value: nome) na segunda chamada imprimir(nome)',
                'Erro E0384 porque nome não foi declarada com mut',
                'Erro E0308 porque imprimir não tem tipo de retorno',
                'Erro E0040 na primeira chamada imprimir(nome)',
              ],
              0,
              'Na linha 7, a primeira chamada `imprimir(nome);` move a posse de `nome` para o parâmetro `s`, que sofre `drop` ao final de `imprimir`. Na linha 8, tentar passar `nome` de novo falha com **E0382** (`use of moved value: \`nome\``).',
              {
                visual: code(
                  `fn imprimir(s: String) {
    println!("{s}");
}

fn main() {
    let nome = String::from("Ada");
    imprimir(nome);
    imprimir(nome);
}`,
                  [7, 8],
                  'Duas chamadas por valor (E0382)',
                ),
              },
            ),
            mcq(
              'Mantendo a assinatura `fn imprimir(s: String)` que recebe por valor, como podemos chamar `imprimir` duas vezes seguidas a partir de `nome`?',
              [
                'Passando imprimir(nome.clone()); na primeira chamada e imprimir(nome); na segunda',
                'Apenas trocando let nome por let mut nome na declaração',
                'Passando imprimir(nome); nas duas linhas e chamando drop(nome); no final',
                'Adicionando #[derive(Copy)] acima de fn main()',
              ],
              0,
              'Em `imprimir(nome.clone());`, a função consome o clone enquanto `nome` continua válida em `main`, podendo então ser movida na segunda chamada `imprimir(nome);`.',
            ),
            match(
              'Dada uma função `fn f(x: T)` que apenas lê `x` e o deixa sair de escopo ao retornar, associe cada tipo `T` ao efeito da chamada `f(a);`:',
              [
                ['T = String', 'Move a para x; a fica inválida após a chamada'],
                ['T = Vec<i32>', 'Move o vetor para x; o buffer sofre drop no fim de f'],
                ['T = i32', 'Copia 4 bytes na pilha; a segue válida após a chamada'],
                ['T = (u8, bool)', 'Copia a tupla na pilha; a segue válida após a chamada'],
              ],
              'Tipos não-`Copy` (`String`, `Vec<i32>`) têm sua posse movida para o parâmetro `x` e sofrem `drop` ao final de `f`; tipos `Copy` (`i32`, `(u8, bool)`) são copiados.',
            ),
            fill(
              'Complete a regra sobre passagem de argumentos não-`Copy` para funções:',
              'Passar uma String por valor transfere a ___ para o parâmetro; tentar ler a variável original sem reinicializá-la causa o erro ___.',
              ['posse', 'E0382'],
              ['capacidade', 'E0384'],
              'A chamada por valor move a **posse** (*ownership*) para o parâmetro da função. Tentar ler a variável original no chamador antes de reinicializá-la dispara **E0382**.',
            ),
            codePuzzle(
              'Monte o programa que define `consumir` e, em `main`, cria `msg`, passa um clone na primeira chamada (preservando `msg`) e move `msg` na segunda chamada:',
              [
                'fn consumir(texto: String) { println!("{texto}"); }\n\nfn main() {',
                '    let msg = String::from("ok");',
                '    consumir(msg.clone());',
                '    consumir(msg);',
                '}',
              ],
              [
                '    println!("fim: {msg}");',
                '    consumir(msg.copy());',
              ],
              'O clone precisa vir na primeira chamada (`consumir(msg.clone());`), pois a segunda chamada (`consumir(msg);`) move e consome `msg` definitivamente.',
            ),
            gen((rng) => {
              const a = randInt(rng, 3, 8);
              const b = randInt(rng, 2, 5);
              const s = 'k'.repeat(a);
              return num(
                'Qual número é impresso na saída deste programa?',
                a + 2 * b,
                `\`txt\` (${a} bytes) é movida para \`somar\`, enquanto \`num\` (${b}) é copiado (\`i32\` é \`Copy\`). \`r\` recebe $${a} + ${b} = ${a + b}$, e o \`println!\` soma \`r + num\` $= ${a + b} + ${b} = ${a + 2 * b}$.`,
                {
                  visual: code(
                    `fn somar(s: String, n: i32) -> usize {
    s.len() + (n as usize)
}

fn main() {
    let txt = String::from("${s}");
    let num = ${b};
    let r = somar(txt, num);
    println!("{}", r + (num as usize));
}`,
                    [1, 8, 9],
                    'Misturando move e Copy',
                  ),
                },
              );
            }),
          ],
        },
        {
          card: [
            {
              title: 'Devolvendo a posse pelo retorno',
              body:
                'Retornar um valor não-`Copy` de uma função também transfere a posse: em vez de sofrer `drop` no fim da função, o valor é **movido para a variável que recebe o retorno** no chamador.\n\n' +
                'Assim, uma função pode receber a posse de uma `String`, modificá-la e **devolver a posse** pelo retorno para que o chamador continue usando o texto!',
              visual: code(
                `fn enfatizar(mut s: String) -> String {
    s.push_str("!");
    s // devolve a posse ao chamador
}

fn main() {
    let s1 = String::from("pronto");
    let s2 = enfatizar(s1);
    println!("{s2}");
}`,
                [1, 3, 8],
                'Tomando e devolvendo a posse',
              ),
            },
            {
              title: 'Retornando posse + dados com tupla',
              body:
                'E se a função precisar calcular uma medida (como o tamanho `usize`) **e** devolver a própria `String` para que o chamador não a perca? Devolvemos uma **tupla** `(String, usize)` e desestruturamos o retorno com `let (s2, tam) = medir(s1);`.\n\n' +
                'Repare que calculamos `let n = s.len();` **antes** de montar `(s, n)`, pois colocar `s` na tupla move `s`!',
              visual: code(
                `fn medir(s: String) -> (String, usize) {
    let n = s.len();
    (s, n)
}

fn main() {
    let s1 = String::from("motor");
    let (s2, tam) = medir(s1);
    println!("{s2}: {tam} bytes");
}`,
                [1, 2, 3, 8],
                'Devolvendo tupla (String, usize)',
              ),
            },
            {
              title: 'No seu computador 💻',
              body:
                'Feche a unidade juntando os exercícios 6 e 7 do roteiro em um programa completo: escreva `fn carimbar(mut s: String) -> String` que acrescenta `" [OK]"` e devolve a posse, e `fn medir(s: String) -> (String, usize)` que devolve o texto e seu tamanho em bytes.',
              visual: code(
                `fn carimbar(mut s: String) -> String {
    s.push_str(" [OK]");
    s
}
fn medir(s: String) -> (String, usize) {
    let n = s.len();
    (s, n)
}
fn main() {
    let s = String::from("sensor");
    let (s, n) = medir(carimbar(s));
    println!("{s} ({n} B)");
}`,
                [1, 5, 11, 12],
                'src/main.rs',
              ),
              tip: 'Critério de pronto: cargo run imprime "sensor [OK] (11 B)" e cargo clippy -- -D warnings passa sem avisos. Na próxima unidade você aprenderá a emprestar (&s) para não precisar devolver a String numa tupla!',
            },
          ],
          exercises: [
            mcq(
              'Após a criação da `String` no programa abaixo, quantas vezes a passagem e o retorno de `identidade` duplicam seu buffer no heap e quando ele sofre `drop`?',
              [
                'Zero cópias no heap; o buffer sofre drop uma única vez no fim de main, quando b sai de escopo',
                'Duas cópias no heap: uma ao entrar em identidade e outra ao retornar',
                'Zero cópias no heap, mas sofre drop duas vezes (no fim de identidade e no fim de main)',
                'Uma cópia no heap no momento do retorno para b',
              ],
              0,
              'Tanto a entrada quanto o retorno de `identidade` fazem apenas *move* do cabeçalho. Essas transferências não duplicam os bytes no heap, e o buffer sofre `drop` uma única vez quando `b` sai de escopo no fim de `main`. A criação inicial com `String::from` copia os bytes do literal para o heap.',
              {
                visual: code(
                  `fn identidade(s: String) -> String {
    s
}

fn main() {
    let a = String::from("dados");
    let b = identidade(a);
    println!("{b}");
}`,
                  [1, 2, 7],
                  'Passagem e retorno sem clonar',
                ),
              },
            ),
            mcq(
              'Por que a função `criar` abaixo falha ao compilar com o erro **E0308** (`mismatched types: expected String, found ()`)?',
              [
                'Porque o ponto e vírgula após s na linha 3 transforma a expressão em instrução que devolve ()',
                'Porque uma função em Rust nunca pode devolver uma variável criada dentro dela',
                'Porque falta a palavra mut em let s',
                'Porque o tipo de retorno deveria ser Box<String>',
              ],
              0,
              'Em Rust, colocar `;` após `s` na última linha descarta o valor de `s` e faz a função retornar a tupla vazia `()` (*unit*), causando incompatibilidade de tipos (**E0308**) com o retorno `String`.',
              {
                visual: code(
                  `fn criar() -> String {
    let s = String::from("novo");
    s;
}`,
                  [3],
                  'Erro E0308 no retorno',
                ),
              },
            ),
            tf(
              'Em `fn medir(s: String) -> (String, usize)`, calcular `let n = s.len();` antes de montar a tupla `(s, n)` é necessário porque escrever `(s, s.len())` moveria `s` no primeiro elemento antes de chamar `s.len()`.',
              true,
              'Os elementos de uma tupla são avaliados da esquerda para a direita: em `(s, s.len())`, o primeiro elemento move `s` e a chamada `s.len()` logo ao lado falha com **E0382**!',
              {
                visual: code(
                  `fn medir(s: String) -> (String, usize) {
    let n = s.len();
    (s, n)
}`,
                  [2, 3],
                  'Ordem de avaliação na tupla',
                ),
              },
            ),
            order(
              'Ordene o caminho percorrido pela posse do texto durante a execução de `let s1 = criar(); let s2 = assinar(s1);`:',
              [
                'criar() aloca a String no heap e move a posse pelo retorno para s1 em main',
                'A chamada assinar(s1) move a posse de s1 para o parâmetro da função assinar',
                'assinar modifica o texto e devolve a posse pelo retorno para s2 em main',
                'Ao fechar o "}" de main, s2 sai de escopo e libera o texto no heap',
              ],
              'A posse nasce em `criar`, move para `s1`, entra em `assinar`, volta pelo retorno para `s2` e finalmente sofre `drop` quando `s2` sai de escopo.',
            ),
            mcq(
              'Qual é a saída impressa por este programa que encadeia transferências de posse?',
              ['ABC', 'A', 'AC', 'Não compila: erro E0382 ao passar msg na linha 11'],
              0,
              'Na linha 10, `anexar` recebe a posse de `msg` (`"A"`), acrescenta `"B"` e devolve a posse de `"AB"` de volta para `msg`. Na linha 11, `msg` recebe `"C"` do mesmo jeito e vira `"ABC"`.',
              {
                visual: code(
                  `fn anexar(
    mut s: String,
    f: &str,
) -> String {
    s.push_str(f);
    s
}
fn main() {
    let mut msg = String::from("A");
    msg = anexar(msg, "B");
    msg = anexar(msg, "C");
    println!("{msg}");
}`,
                  [1, 6, 10, 11],
                  'Devolvendo a posse para msg',
                ),
              },
            ),
            fill(
              'Complete a assinatura e o retorno da função que devolve a `String` junto com seu tamanho `n: usize`:',
              'fn medir(s: String) -> (___, usize) { let n = s.len(); (s, ___) }',
              ['String', 'n'],
              ['Copy', 'drop'],
              'O tipo de retorno `(String, usize)` combina a `String` (cuja posse é devolvida no primeiro elemento) e o tamanho `n` calculado antes do move.',
            ),
            codePuzzle(
              'Monte a função `medir` que recebe a posse de `s: String`, guarda o tamanho em `n` antes de mover `s` e devolve a tupla `(s, n)`:',
              [
                'fn medir(s: String) -> (String, usize) {',
                '    let n = s.len();',
                '    (s, n)',
                '}',
              ],
              [
                '    (s, n);',
                '    let n = s.drop();',
                'fn medir(s: String) -> usize {',
              ],
              'Calculamos `let n = s.len();` enquanto `s` ainda não foi movida e retornamos `(s, n)` sem ponto e vírgula no final.',
            ),
            gen((rng) => {
              const a = randInt(rng, 2, 6);
              const b = randInt(rng, 2, 5);
              const sa = 'a'.repeat(a);
              const sb = 'b'.repeat(b);
              return num(
                'Qual número é impresso na saída após `juntar` devolver a posse da `String` para `main`?',
                a + b,
                `\`s1\` começa com \`"${sa}"\` (${a} bytes), move para \`juntar\`, recebe \`"${sb}"\` (${b} bytes) e sua posse volta para \`s2\`. Logo, \`s2.len()\` vale $${a} + ${b} = ${a + b}$.`,
                {
                  visual: code(
                    `fn juntar(mut s: String) -> String {
    s.push_str("${sb}");
    s
}

fn main() {
    let s1 = String::from("${sa}");
    let s2 = juntar(s1);
    println!("{}", s2.len());
}`,
                    [2, 3, 8, 9],
                    'Retornando a posse atualizada',
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

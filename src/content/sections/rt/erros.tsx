import React from 'react';
import { View } from 'react-native';
import type { UnitDef, VisualSpec } from '../../types';
import { code, fill, gen, match, mcq, multi, num, order, table, tf } from '../../helpers';
import { codePuzzle } from '../../codePractice';
import { CodeBlock } from '../../../components/visuals/Code';
import { TableView } from '../../../components/visuals/Misc';
import { pick, randInt } from '../../../lib/random';

function traceStepper(opts: {
  title?: string;
  src: string;
  head: string[];
  frames: {
    line: number[];
    rows: (string | number)[][];
    highlightRow?: number[];
    label?: string;
    info: string;
  }[];
}): VisualSpec & { props: Record<string, any> } {
  return {
    name: 'stepper',
    props: {
      steps: opts.frames.length,
      labels: opts.frames.map((f, i) => f.label ?? `Passo ${i + 1} de ${opts.frames.length}`),
      render: (k: number, width: number) => {
        const f = opts.frames[k] ?? opts.frames[0];
        return (
          <View style={{ gap: 10 }}>
            <CodeBlock code={opts.src} highlight={f.line} title={opts.title} width={width} />
            <TableView head={opts.head} rows={f.rows} highlight={f.highlightRow} width={width} />
          </View>
        );
      },
      info: (k: number) => (opts.frames[k] ?? opts.frames[0]).info,
    },
  };
}

export const rustErros: UnitDef = {
  id: 'rt-erro',
  title: 'Tratamento de erros',
  icon: '🚨',
  subtitle: 'panic!, Result, operador ?, erros customizados e boas práticas',
  source: 'The Rust Programming Language (Edição 2024), cap. 9 · Desafio 50 Dias — Rust (Módulo 4)',
  extra: true,
  guide:
    'Rust divide as falhas em duas categorias:\n\n' +
    '• **Erros irrecuperáveis (`panic!`)**: sintomas de **bugs do programador** (como acessar um índice fora do vetor ou violar uma invariante com `assert!`). Por padrão, o pânico faz o **desenrolamento da pilha** (*unwinding*), executando o `Drop` de cada variável local antes de encerrar a thread, ou aborta imediatamente se `panic = "abort"` estiver no `Cargo.toml`. Use `RUST_BACKTRACE=1` para inspecionar a pilha de chamadas.\n' +
    '• **Erros recuperáveis (`Result<T, E>`)**: falhas esperadas do mundo externo (arquivo inexistente, texto inválido, saldo insuficiente). O enum tem as variantes `Ok(T)` e `Err(E)`, e o compilador exige que você trate ambas.\n' +
    '• **Operador `?`**: colocado após um `Result` (ou `Option`), desembrulha o valor em caso de sucesso ou retorna o erro imediatamente da função atual, convertendo-o via `From::from`. Pode ser usado no `main` quando ele retorna `Result<(), Box<dyn std::error::Error>>`.\n' +
    '• **Erros próprios e crates**: bibliotecas definem um `enum` de erro implementando `Debug`, `Display` e `std::error::Error` (ou derivando com `thiserror`), enquanto aplicações costumam agregar erros variados com `anyhow::Result<T>`.\n' +
    '• **Boas práticas**: evite `unwrap()` e `expect()` em código de produção (reserve-os para testes `#[test]` ou invariantes provadas) e use tipos próprios (*newtypes* + `TryFrom`) para validar dados na fronteira do sistema.',
  lessons: [
    {
      id: 'rt-erro-panic',
      title: 'panic! e erros irrecuperáveis',
      parts: [
        {
          card: [
            {
              title: 'Quando tudo dá errado: panic!',
              body:
                'Em C, quando uma função encontra um estado impossível, você chama `abort()` ou deixa um bug invadir a memória vizinha. Em Rust, falhas são divididas em **recuperáveis** (tratadas com `Result`) e **irrecuperáveis** (tratadas com a macro `panic!`).\n\n' +
                'Quando `panic!("mensagem")` executa, o programa imprime a mensagem com arquivo e linha e, por padrão, inicia o **desenrolamento da pilha** (*unwinding*): ele sobe cada função ativa chamando o destrutor (`Drop`) das variáveis locais donas de memória (como `String` e `Vec`).\n\n' +
                'Se você quiser um executável menor (comum em sistemas embarcados), basta configurar `panic = "abort"` em `[profile.release]` no `Cargo.toml` para encerrar o processo na hora, deixando a limpeza para o sistema operacional.',
              visual: code(
                `fn set_speed(rpm: i32) {
    if rpm < 0 {
        panic!("rpm negativo: {rpm}");
    }
    println!("rpm = {rpm}");
}

fn main() {
    set_speed(1500);
    set_speed(-10);
}`,
                [3, 10],
                'src/main.rs',
              ),
              tip: 'Regra de ouro: `panic!` é para **bug do programador** (uma condição que nunca deveria acontecer se o código estiver certo), nunca para entrada inválida digitada pelo usuário.',
            },
            {
              title: 'Passo a passo: desenrolamento da pilha',
              body: 'Avance pelos passos abaixo para ver como o *unwinding* percorre a pilha de chamadas de trás para frente e libera o `Vec` alocado no heap antes de encerrar o programa.',
              visual: traceStepper({
                title: 'unwinding em ação',
                src: `fn work() {
    let v = vec![1, 2, 3];
    panic!("falha interna");
}

fn main() {
    work();
    println!("fim");
}`,
                head: ['Quadro na pilha', 'Heap (v)', 'Estado'],
                frames: [
                  {
                    line: [7],
                    rows: [['main()', '—', 'chamando work()']],
                    label: 'Passo 1: chamada',
                    info: '`main()` inicia e empilha uma chamada para `work()`.',
                  },
                  {
                    line: [2],
                    rows: [
                      ['main()', '—', 'aguardando work()'],
                      ['work()', '[1, 2, 3] (12 B)', 'v criado no heap'],
                    ],
                    highlightRow: [1],
                    label: 'Passo 2: alocação',
                    info: '`work()` aloca o vetor `v` no heap. `v` é dono dessa memória.',
                  },
                  {
                    line: [3],
                    rows: [
                      ['main()', '—', 'aguardando work()'],
                      ['work()', '[1, 2, 3] (12 B)', 'panic! disparado'],
                    ],
                    highlightRow: [1],
                    label: 'Passo 3: panic!',
                    info: '`panic!("falha interna")` interrompe a execução normal na linha 3.',
                  },
                  {
                    line: [4],
                    rows: [
                      ['main()', '—', 'desenrolando pilha'],
                      ['work() [Drop]', 'liberado (free)', 'Drop::drop(&mut v)'],
                    ],
                    highlightRow: [1],
                    label: 'Passo 4: Drop em work',
                    info: 'Ao sair de `work()`, o *unwinding* chama `Drop` de `v` e libera o heap. A linha 8 (`println!("fim")`) nunca roda.',
                  },
                ],
              }),
            },
          ],
          exercises: [
            mcq(
              'O que o comportamento padrão de `panic!` (*unwinding*) faz antes de encerrar a thread?',
              [
                'Sobe a pilha executando o `Drop` das variáveis locais de cada função ativa',
                'Ignora a linha com erro e continua na próxima linha da função',
                'Converte automaticamente a falha em um valor `0`',
                'Reinicia a função `main` desde o começo',
              ],
              0,
              'Por padrão, `panic!` desenrola a pilha (*unwinding*), chamando os destrutores (`Drop`) das variáveis locais de cada função antes de abortar a thread.',
            ),
            tf(
              'Em Rust, `panic!` deve ser usado como mecanismo padrão para tratar erros esperados, como um arquivo de configuração que ainda não existe.',
              false,
              'Arquivo ausente ou entrada inválida do usuário são erros esperados e recuperáveis: devem usar `Result<T, E>`. O `panic!` é reservado para bugs e estados irrecuperáveis.',
            ),
            mcq(
              'O que aparece na saída padrão antes de o programa abortar em pânico?',
              ['Apenas `inicio` e `meio`', 'Apenas `inicio`', '`inicio`, `meio` e `fim`', 'Nada é impresso'],
              0,
              '`main` imprime `inicio` e chama `step()`. Dentro de `step()`, `meio` é impresso antes do `panic!("pare")`. O `println!("fim")` na volta para `main` nunca é alcançado.',
              {
                visual: code(
                  `fn step() {
    println!("meio");
    panic!("pare");
}

fn main() {
    println!("inicio");
    step();
    println!("fim");
}`,
                  [3, 9],
                  'Execução até o pânico',
                ),
              },
            ),
            fill(
              'Complete a configuração do `Cargo.toml` para que um pânico em modo *release* encerre o programa imediatamente sem desenrolar a pilha:',
              '[profile.release]\npanic = "___"',
              ['abort'],
              ['unwind', 'exit', 'stop'],
              '`panic = "abort"` desativa o desenrolamento da pilha e encerra o processo imediatamente, reduzindo o tamanho do binário gerado.',
            ),
            match(
              'Associe cada conceito ao seu significado no tratamento de erros irrecuperáveis:',
              [
                ['panic!', 'Macro que sinaliza um erro irrecuperável e interrompe a thread'],
                ['unwinding', 'Subir a pilha executando o Drop de cada variável local'],
                ['panic = "abort"', 'Encerrar o processo na hora sem desenrolar a pilha'],
                ['Drop', 'Trait cujo método limpa recursos quando o valor sai de escopo'],
              ],
              'O desenrolamento (*unwinding*) chama `Drop` ao subir a pilha; já `panic = "abort"` delega a limpeza da memória diretamente ao sistema operacional.',
            ),
            gen((rng) => {
              const lim = randInt(rng, 40, 80);
              const okVal = randInt(rng, 10, lim - 5);
              const badVal = lim + randInt(rng, 5, 25);
              return num(
                'Qual número inteiro é impresso na tela antes de a segunda chamada entrar em pânico?',
                okVal * 2,
                `Na primeira chamada, \`x = ${okVal}\` não ultrapassa \`${lim}\`, então a função imprime \`${okVal} * 2 = ${okVal * 2}\`. Na segunda chamada (\`${badVal}\`), o \`if\` dispara \`panic!\` antes do \`println!\`.`,
                {
                  visual: code(
                    `fn check(x: i32) {
    if x > ${lim} {
        panic!("acima de ${lim}");
    }
    println!("{}", x * 2);
}

fn main() {
    check(${okVal});
    check(${badVal});
}`,
                    [2, 3, 5],
                    'Rastreando valores',
                  ),
                },
              );
            }),
            order(
              'Ordene o que acontece quando uma função interna chama `panic!` com a configuração padrão (*unwind*):',
              [
                'A macro panic! interrompe a execução normal na linha da falha',
                'A mensagem do pânico e a posição no arquivo são exibidas',
                'A pilha é desenrolada chamando Drop nas variáveis locais',
                'O processo termina com código de saída indicando erro',
              ],
              'Primeiro a falha é registrada e impressa; em seguida a pilha é desenrolada de dentro para fora executando os destrutores e, por fim, o processo termina com erro.',
            ),
            codePuzzle(
              'Monte a função `check_pin` que entra em pânico se `pin > 13` e, caso contrário, imprime o número do pino:',
              [
                'fn check_pin(pin: u8) {',
                '    if pin > 13 {',
                '        panic!("pino invalido");',
                '    }',
                '    println!("pino {pin} ok");',
                '}',
              ],
              [
                '    if pin <= 13 {',
                '        return "pino invalido";',
              ],
              'A condição `if pin > 13` barra pinos fora da faixa do Arduino Uno com `panic!("pino invalido");`. Se não entrou no `if`, a execução segue até o `println!`.',
            ),
          ],
        },
        {
          card: [
            {
              title: 'Limites de vetor, asserts e backtrace',
              body:
                'Em C, acessar `v[10]` num vetor de 3 posições lê lixo da memória (*buffer overread*), uma brecha clássica de segurança. Em Rust, o acesso por colchetes verifica o tamanho em tempo de execução e dispara `panic!` imediatamente se o índice estiver fora de `0..v.len()`.\n\n' +
                'No seu próprio código, você também pode proteger invariantes com macros que entram em pânico quando a condição falha:\n' +
                '• `assert!(cond)` — exige que `cond` seja `true`\n' +
                '• `assert_eq!(a, b)` e `assert_ne!(a, b)` — exigem `a == b` ou `a != b` e imprimem os dois valores se falharem\n' +
                '• `todo!()` e `unreachable!()` — marcam código ainda não escrito ou ramos que a lógica garante serem inalcançáveis\n\n' +
                'Para descobrir toda a sequência de chamadas que levou ao pânico, rode o programa com `RUST_BACKTRACE=1 cargo run`.',
              visual: code(
                `fn main() {
    let v = vec![10, 20, 30];
    assert_eq!(v.len(), 3);
    // indices validos: 0, 1 e 2
    println!("{}", v[10]);
}`,
                [5],
                'index out of bounds',
              ),
              tip: 'Se você não tem certeza se o índice existe e quer evitar pânico, use `v.get(10)`, que devolve `Option<&T>` (`None` quando o índice está fora dos limites).',
            },
            {
              title: 'No seu computador: rastreando um panic! (Exercício 24)',
              body:
                'Hora de praticar o **Exercício 24** do roteiro no terminal:\n\n' +
                '• Crie o projeto com `cargo new panico` e entre na pasta.\n' +
                '• No `src/main.rs`, crie `let v = vec![10, 20, 30];` e tente imprimir `v[10]`.\n' +
                '• Rode com `RUST_BACKTRACE=1 cargo run` e localize no *backtrace* o número exato da linha do seu `main.rs`.\n' +
                '• Depois, troque o índice fora dos limites por um acesso válido protegido por `assert!(idx < v.len())`.\n\n' +
                '**Critério de pronto:** você viu o *backtrace* apontar para a linha do acesso inválido e, após corrigir o índice, `cargo run` imprime `30` e `cargo clippy -- -D warnings` termina sem nenhum aviso.',
              visual: code(
                `$ cargo new panico && cd panico
$ RUST_BACKTRACE=1 cargo run
thread 'main' panicked at
src/main.rs:3:20:
index out of bounds: len is 3
$ cargo clippy -- -D warnings`,
                [2, 4, 5],
                'Terminal',
              ),
            },
          ],
          exercises: [
            mcq(
              'O que acontece ao executar a linha destacada?',
              [
                'O programa entra em pânico com `index out of bounds: the len is 3 but the index is 3`',
                'Imprime `0` como valor padrão para posições inexistentes',
                'Imprime `30`, pois os índices começam em `1`',
                'Lê um inteiro vizinho na memória sem avisar',
              ],
              0,
              'Um vetor de tamanho 3 possui índices `0`, `1` e `2`. O índice `3` já está fora dos limites e dispara `panic!` em tempo de execução.',
              {
                visual: code(
                  `fn main() {
    let v = vec![10, 20, 30];
    println!("{}", v[3]);
}`,
                  [3],
                  'Acesso por índice',
                ),
              },
            ),
            tf(
              'O método `v.get(10)` em um `Vec<i32>` de 3 elementos devolve `None` em vez de disparar `panic!`.',
              true,
              'Enquanto `v[i]` exige que o índice exista e entra em pânico se não existir, `v.get(i)` devolve `Option<&T>`: `Some(&valor)` ou `None`.',
            ),
            fill(
              'Qual variável de ambiente ativa a exibição da pilha de chamadas completa quando um programa Rust entra em pânico?',
              '___=1 cargo run',
              ['RUST_BACKTRACE'],
              ['RUST_TRACE', 'CARGO_PANIC', 'RUST_DEBUG'],
              '`RUST_BACKTRACE=1` instrui o runtime do Rust a imprimir todas as funções na pilha até a linha exata onde ocorreu o `panic!`.',
            ),
            mcq(
              'Qual das linhas destacadas dispara `panic!` quando `main` é executada?',
              [
                'Linha 5 (`assert_eq!(x, 12)`)',
                'Linha 3 (`assert!(x > 0)`)',
                'Linha 4 (`assert_ne!(x, 5)`)',
                'Nenhuma linha entra em pânico',
              ],
              0,
              'Com `x = 10`, `x > 0` é verdadeiro (linha 3 passa) e `x != 5` é verdadeiro (linha 4 passa). Na linha 5, `10 == 12` é falso, então `assert_eq!` entra em pânico mostrando `left: 10, right: 12`.',
              {
                visual: code(
                  `fn main() {
    let x = 10;
    assert!(x > 0);
    assert_ne!(x, 5);
    assert_eq!(x, 12);
}`,
                  [3, 4, 5],
                  'Qual assert falha?',
                ),
              },
            ),
            multi(
              'Segundo o capítulo 9 do livro de Rust, em quais situações abaixo faz sentido entrar em `panic!` em vez de retornar `Result`?',
              [
                'Um contrato interno da função foi violado por bug de quem a chamou (ex.: índice fora da faixa prometida)',
                'Dentro de um teste automatizado quando o valor calculado difere do esperado',
                'O usuário digitou letras num campo que pedia a idade no terminal',
                'Um servidor web externo demorou demais para responder na rede',
              ],
              [0, 1],
              'Violações de contrato interno (bugs do programador) e falhas de testes usam `panic!` / `assert_eq!`. Entrada do usuário e falhas de rede são esperadas em produção e devem usar `Result`.',
            ),
            gen((rng) => {
              const a = randInt(rng, 2, 7);
              const b = randInt(rng, 8, 15);
              const c = randInt(rng, 16, 25);
              const idx = pick(rng, [0, 1, 2] as const);
              const vals = [a, b, c];
              const chosen = vals[idx];
              return num(
                'O `assert!` passa sem pânico. Qual número é impresso na saída?',
                chosen + 10,
                `O vetor tem tamanho 3 e \`idx = ${idx}\` é menor que 3, então \`assert!(idx < v.len())\` passa. Em seguida, \`v[${idx}] + 10 = ${chosen} + 10 = ${chosen + 10}\`.`,
                {
                  visual: code(
                    `fn main() {
    let v = vec![${a}, ${b}, ${c}];
    let idx = ${idx};
    assert!(idx < v.len());
    println!("{}", v[idx] + 10);
}`,
                    [4, 5],
                    'Acesso verificado',
                  ),
                },
              );
            }),
            match(
              'Associe cada macro da biblioteca padrão ao seu propósito:',
              [
                ['assert!(cond)', 'Entra em pânico se a expressão booleana for false'],
                ['assert_eq!(a, b)', 'Entra em pânico se a != b, imprimindo ambos os valores'],
                ['todo!()', 'Marca um trecho ainda não implementado que compila, mas aborta se chamado'],
                ['unreachable!()', 'Sinaliza ao compilador e ao leitor um ramo que nunca deve executar'],
              ],
              'Essas quatro macros documentam e verificam invariantes no código; se acionadas em execução, disparam `panic!` com uma mensagem clara.',
            ),
            codePuzzle(
              'Monte a função `avg` que primeiro guarda o tamanho em `n`, exige `assert!(n > 0)`, soma os elementos em `sum` e devolve `sum / n`:',
              [
                'fn avg(v: &[i32]) -> i32 {',
                '    let n = v.len() as i32;',
                '    assert!(n > 0);',
                '    let sum: i32 = v.iter().sum();',
                '    sum / n',
                '}',
              ],
              [
                '    assert!(n == 0);',
                '    sum / n;',
              ],
              'Primeiro obtemos `n` e garantimos `n > 0` com `assert!` para evitar divisão por zero; depois calculamos `sum` e retornamos `sum / n` sem ponto e vírgula.',
            ),
          ],
        },
      ],
    },
    {
      id: 'rt-erro-result',
      title: 'Result e match',
      parts: [
        {
          card: [
            {
              title: 'O enum Result<T, E>',
              body:
                'Em C, funções costumam devolver `-1` ou `NULL` quando algo falha, mas o compilador não impede você de esquecer o `if` e usar `-1` como se fosse uma medição válida.\n\n' +
                'Em Rust, operações que podem falhar devolvem o enum genérico `Result<T, E>`, já incluído no prelúdio padrão:\n' +
                '• `Ok(valor)` — a operação deu certo e carrega o resultado de tipo `T`\n' +
                '• `Err(erro)` — a operação falhou e carrega o motivo de tipo `E`\n\n' +
                'Como `Result<i32, &str>` e `i32` são tipos diferentes, tentar somar `1` direto ao retorno sem tratar o erro nem sequer compila (`E0308`). E ao abrir o `Result` com `match`, o compilador exige que você cubra tanto `Ok` quanto `Err` (`E0004`).',
              visual: code(
                `fn divide(
    a: i32,
    b: i32,
) -> Result<i32, &'static str> {
    if b == 0 {
        Err("divisao por zero")
    } else {
        Ok(a / b)
    }
}`,
                [4, 6, 8],
                'Result na assinatura',
              ),
              tip: 'Se você chamar uma função que devolve `Result` e ignorar o valor de retorno (`divide(10, 2);`), o compilador emite o aviso `unused_must_use` porque `Result` é marcado com `#[must_use]`.',
            },
            {
              title: 'C, exceções e Rust lado a lado',
              body: 'Compare na tabela como cada abordagem informa e obriga o tratamento de falhas recuperáveis:',
              visual: table(
                ['Linguagem', 'Como devolve falha', 'Se o programador esquecer'],
                [
                  ['C', 'Código -1, NULL ou errno', 'Compila e usa lixo em silêncio'],
                  ['C++ / Java', 'Exceção (throw)', 'Aborta em produção se não houver catch'],
                  ['Rust', 'Enum Result<T, E>', 'Não compila (E0308 / E0004)'],
                ],
                [2],
              ),
            },
          ],
          exercises: [
            mcq(
              'Quais são as duas variantes que compõem o enum `Result<T, E>`?',
              ['`Ok(T)` e `Err(E)`', '`Some(T)` e `None`', '`True(T)` e `False(E)`', '`Value(T)` e `Panic(E)`'],
              0,
              '`Result<T, E>` tem exatamente duas variantes no prelúdio padrão: `Ok(T)` para o valor de sucesso e `Err(E)` para o valor de erro. (`Some` e `None` pertencem ao `Option<T>`).',
            ),
            tf(
              'Um valor do tipo `Result<i32, String>` pode ser somado diretamente com um `i32` sem precisar extrair o conteúdo de `Ok`.',
              false,
              '`Result<i32, String>` é um enum que pode conter um erro, não um `i32`. O compilador recusa a soma com erro de tipos incompatíveis (`E0308`) até que você trate o `Result`.',
            ),
            mcq(
              'Este código compila? Se não, qual erro o compilador aponta na linha 6 destacada?',
              [
                'Não compila (`E0308: mismatched types`): esperava `Result<i32, &str>`, mas encontrou `i32`; faltou embrulhar em `Ok(n / 2)`',
                'Compila normalmente e converte `n / 2` em `Ok(n / 2)` sozinho',
                'Não compila (`E0382`): a variável `n` foi movida no `if`',
                'Não compila (`E0004`): faltou um `match` dentro da função',
              ],
              0,
              'Em Rust não há conversão implícita de `T` para `Ok(T)`. Como a função promete devolver `Result<i32, &\'static str>`, o ramo `else` precisa devolver `Ok(n / 2)`. Sem o `Ok(...)`, o compilador aponta `error[E0308]: mismatched types` e sugere `try wrapping the expression in Ok`.',
              {
                visual: code(
                  `fn half(
    n: i32,
) -> Result<i32, &'static str> {
    if n % 2 != 0 {
        Err("impar")
    } else {
        n / 2
    }
}`,
                  [7],
                  'Faltou Ok(...)',
                ),
              },
            ),
            mcq(
              'O que o compilador informa ao analisar o `match` destacado abaixo?',
              [
                'Erro `E0004` (`non-exhaustive patterns: \'Err(_)\' not covered`), pois o caso `Err` não foi tratado',
                'Compila e ignora silenciosamente quando `divide` retorna `Err`',
                'Erro `E0382`, pois `10` e `2` foram movidos',
                'Erro `E0502`, pois há empréstimo mutável e imutável ao mesmo tempo',
              ],
              0,
              'O `match` em Rust é obrigatório e exaustivo. Cobrir apenas `Ok(v)` deixa a variante `Err(_)` descoberta, gerando `error[E0004]: non-exhaustive patterns: \'Err(_)\' not covered`.',
              {
                visual: code(
                  `fn main() {
    match divide(10, 2) {
        Ok(v) => println!("{v}"),
    }
}`,
                  [2, 3, 4],
                  'Match incompleto',
                ),
              },
            ),
            fill(
              'Complete a assinatura da função que recebe um texto e devolve um `u16` em caso de sucesso ou uma `String` descrevendo a falha:',
              'fn parse_port(s: &str) -> ___<___, ___>',
              ['Result', 'u16', 'String'],
              ['Option', 'Ok', 'Err'],
              'O primeiro parâmetro genérico de `Result<T, E>` é o tipo do valor de sucesso (`u16`) e o segundo é o tipo do erro (`String`).',
            ),
            gen((rng) => {
              const b = randInt(rng, 2, 6);
              const q = randInt(rng, 3, 9);
              const a = b * q;
              const bonus = randInt(rng, 1, 10);
              return num(
                'Qual número é impresso na tela ao executar este programa?',
                q + bonus,
                `Como \`b = ${b}\` é diferente de zero, \`div(${a}, ${b})\` devolve \`Ok(${q})\`. No \`match\`, o braço \`Ok(v) => v + ${bonus}\` calcula \`${q} + ${bonus} = ${q + bonus}\`.`,
                {
                  visual: code(
                    `fn div(
    a: i32,
    b: i32,
) -> Result<i32, &'static str> {
    if b == 0 {
        Err("zero")
    } else {
        Ok(a / b)
    }
}

fn main() {
    let ans = match div(${a}, ${b}) {
        Ok(v) => v + ${bonus},
        Err(_) => -1,
    };
    println!("{ans}");
}`,
                    [13, 14, 15],
                    'Avaliando match com Result',
                  ),
                },
              );
            }),
            match(
              'Associe cada descuido com `Result` à reação do compilador Rust:',
              [
                ['Retornar T em vez de Ok(T)', 'Erro E0308: tipos incompatíveis (mismatched types)'],
                ['Esquecer o braço Err(e) no match', 'Erro E0004: padrões não exaustivos (non-exhaustive patterns)'],
                ['Chamar divide(4, 2); sem usar o retorno', 'Aviso unused_must_use alertando que o Result foi descartado'],
              ],
              'O sistema de tipos e o atributo `#[must_use]` garantem que nenhum erro passe despercebido em tempo de compilação.',
            ),
            codePuzzle(
              'Monte o corpo de `safe_rem(a: i32, b: i32)` que devolve `Err("zero")` quando `b == 0` e `Ok(a % b)` caso contrário:',
              [
                '    if b == 0 {',
                '        Err("zero")',
                '    } else {',
                '        Ok(a % b)',
                '    }',
              ],
              [
                '        a % b',
                '        return "zero";',
              ],
              'Os dois ramos do `if / else` precisam devolver o mesmo tipo `Result<i32, &\'static str>`: o primeiro com `Err("zero")` e o segundo com `Ok(a % b)`.',
            ),
          ],
        },
        {
          card: [
            {
              title: 'Métodos úteis e posse dentro do match',
              body:
                'Além do `match`, `Result<T, E>` oferece métodos que deixam os casos comuns bem concisos:\n' +
                '• `.is_ok()` e `.is_err()` — emprestam `&self` e devolvem `bool` sem consumir o `Result`\n' +
                '• `.unwrap_or(padrao)` — devolve o valor de `Ok(v)` ou o valor `padrao` se for `Err` (nunca entra em pânico!)\n' +
                '• `.unwrap_or_else(|e| ...)` — calcula o valor substituto sob demanda usando uma closure\n\n' +
                '**Atenção ao ownership:** fazer `match res { Ok(s) => ..., Err(e) => ... }` quando `res` guarda uma `String` **move** o conteúdo para dentro do braço. Se você quiser apenas inspecionar `res` sem movê-lo, faça `match &res` ou `match res.as_ref()`, que converte `&Result<T, E>` em `Result<&T, &E>`.',
              visual: code(
                `fn main() {
    let a = "42".parse().unwrap_or(0);
    let b = "abc".parse().unwrap_or(0);
    println!("a={a}, b={b}");
}`,
                [2, 3],
                'unwrap_or com valor padrão',
              ),
              tip: 'Use `.unwrap_or(padrao)` quando o valor substituto é uma constante simples, e `.unwrap_or_else(|| caro())` quando calculá-lo exige uma chamada que só deve rodar se der erro.',
            },
            {
              title: 'Passo a passo: match por valor vs as_ref()',
              body: 'Veja no passo a passo por que inspecionar um `Result<String, String>` com `.as_ref()` preserva o dono original:',
              visual: traceStepper({
                title: 'Posse de Result<String, &str>',
                src: `fn main() {
    let r: Result<String, &str> =
        Ok(String::from("ativo"));
    if let Ok(s) = r.as_ref() {
        println!("lendo: {s}");
    }
    println!("valido: {:?}", r);
}`,
                head: ['Variável', 'Tipo', 'Estado da posse'],
                frames: [
                  {
                    line: [2, 3],
                    rows: [['r', 'Result<String, &str>', 'dona de "ativo"']],
                    label: 'Passo 1: criação',
                    info: '`r` é dona da `String` `"ativo"` alocada no heap.',
                  },
                  {
                    line: [4, 5],
                    rows: [
                      ['r', 'Result<String, &str>', 'emprestada (&r)'],
                      ['s', '&String', 'aponta para "ativo"'],
                    ],
                    highlightRow: [1],
                    label: 'Passo 2: r.as_ref()',
                    info: '`r.as_ref()` cria um `Result<&String, &&str>` temporário. `s` recebe apenas `&String`, sem mover o texto de `r`.',
                  },
                  {
                    line: [7],
                    rows: [['r', 'Result<String, &str>', 'dona de "ativo" (válida!)']],
                    highlightRow: [0],
                    label: 'Passo 3: reuso de r',
                    info: 'O empréstimo de `s` terminou na linha 6, então `r` continua válida na linha 7! Sem `.as_ref()`, a linha 7 falharia com `E0382`.',
                  },
                ],
              }),
            },
            {
              title: 'No seu computador: conversor seguro com match',
              body:
                'Pratique o tratamento exaustivo de `Result` no Cargo:\n\n' +
                '• Crie um projeto com `cargo new conversor`.\n' +
                '• Escreva `fn parse_and_div(txt: &str, div: i32) -> Result<i32, String>` que converte `txt.trim().parse::<i32>()` usando `match` e depois verifica se `div == 0`.\n' +
                '• No `main`, teste três chamadas: `("100", 4)`, `("abc", 4)` e `("100", 0)`, imprimindo o sucesso ou a mensagem de erro com `match`.\n\n' +
                '**Critério de pronto:** as três chamadas imprimem `Ok: 25`, `Erro: numero invalido` e `Erro: divisao por zero`, sem nenhum `unwrap()` no código e com `cargo clippy -- -D warnings` limpo.',
              visual: code(
                `fn main() {
    let cases = [
        ("100", 4),
        ("abc", 4),
        ("100", 0),
    ];
    for (s, d) in cases {
        match parse_and_div(s, d) {
            Ok(v) => {
                println!("Ok: {v}");
            }
            Err(e) => {
                println!("Erro: {e}");
            }
        }
    }
}`,
                [8, 10, 13],
                'src/main.rs',
              ),
            },
          ],
          exercises: [
            mcq(
              'O que o programa abaixo imprime?',
              ['`15 e 0`', '`15 e erro`', 'Entra em pânico na segunda linha', 'Não compila'],
              0,
              '`"15".parse::<i32>()` devolve `Ok(15)`, então `unwrap_or(0)` entrega `15`. Já `"dez".parse::<i32>()` devolve `Err(...)`, então `unwrap_or(0)` entrega o padrão `0` sem pânico.',
              {
                visual: code(
                  `fn main() {
    let a: i32 =
        "15".parse().unwrap_or(0);
    let b: i32 =
        "dez".parse().unwrap_or(0);
    println!("{a} e {b}");
}`,
                  [2, 3, 4, 5],
                  'unwrap_or na prática',
                ),
              },
            ),
            tf(
              'Chamar `res.is_ok()` ou `res.is_err()` apenas empresta `res` (`&self`), permitindo que `res` continue sendo usado nas linhas seguintes.',
              true,
              'Ambos os métodos recebem `&self` (empréstimo imutável) e retornam `bool`, sem mover o valor guardado dentro do `Result`.',
            ),
            mcq(
              'Por que a linha 8 destacada não compila?',
              [
                'Erro `E0382` (`borrow of moved value: \'res\'`): o `match res` moveu a `String` para `s` na linha 4',
                'Erro `E0004`: faltou um terceiro braço no `match`',
                'Erro `E0308`: `println!` não aceita `{:?}` com `Result`',
                'Erro `E0502`: `s` e `e` são referências mutáveis simultâneas',
              ],
              0,
              'Como `String` não é `Copy`, fazer `match res` por valor move a `String` para a variável `s` (ou `e`). Para manter `res` válido na linha 8, basta trocar `match res` por `match &res` ou `match res.as_ref()`.',
              {
                visual: code(
                  `fn main() {
    let res: Result<String, String> =
        Ok(String::from("ok"));
    match res {
        Ok(s) => println!("{s}"),
        Err(e) => println!("{e}"),
    }
    println!("{:?}", res);
}`,
                  [4, 8],
                  'Move dentro do match',
                ),
              },
            ),
            fill(
              'Complete a chamada que converte `&Result<T, E>` em `Result<&T, &E>` para inspecionar o conteúdo sem mover o valor original:',
              'match res.___() {\n    Ok(s) => println!("{s}"),\n    Err(e) => println!("{e}"),\n}',
              ['as_ref'],
              ['unwrap', 'into', 'is_ok'],
              '`.as_ref()` transforma uma referência ao `Result` num `Result` contendo referências (`Result<&T, &E>`), preservando a posse do valor original.',
            ),
            gen((rng) => {
              const valid = randInt(rng, 10, 40);
              const fallback = randInt(rng, 2, 9);
              return num(
                'Qual é o valor final impresso para `total`?',
                valid + fallback,
                `\`"${valid}".parse::<i32>()\` produz \`Ok(${valid})\`, que com \`unwrap_or(${fallback})\` vale \`${valid}\`. Já \`"falha".parse::<i32>()\` produz \`Err\`, que com \`unwrap_or(${fallback})\` vale \`${fallback}\`. A soma é \`${valid} + ${fallback} = ${valid + fallback}\`.`,
                {
                  visual: code(
                    `fn main() {
    let x: i32 =
        "${valid}".parse().unwrap_or(${fallback});
    let y: i32 =
        "falha".parse().unwrap_or(${fallback});
    let total = x + y;
    println!("{total}");
}`,
                    [2, 3, 4, 5],
                    'Soma com fallback',
                  ),
                },
              );
            }),
            multi(
              'Quais das expressões abaixo extraem um `i32` de `res: Result<i32, &str>` **sem nunca entrar em pânico**, mesmo quando `res` é `Err`?',
              [
                '`res.unwrap_or(0)`',
                '`res.unwrap_or_else(|_| -1)`',
                '`res.unwrap()`',
                '`res.expect("valor ausente")`',
              ],
              [0, 1],
              '`unwrap_or` e `unwrap_or_else` devolvem um valor substituto quando `res` é `Err`, nunca entrando em pânico. Já `unwrap()` e `expect(...)` abortam em pânico se `res` for `Err`.',
            ),
            order(
              'Ordene o que acontece na avaliação de `let v = "25".parse::<i32>()` seguido de um `match v`:',
              [
                'O método parse::<i32>() analisa os caracteres de "25"',
                'Como todos os dígitos são válidos, parse retorna Ok(25)',
                'O match compara o valor com o padrão Ok(n) e liga n = 25',
                'A expressão do braço Ok(n) é executada com n valendo 25',
              ],
              'Primeiro `parse` produz `Ok(25)`; em seguida o `match` faz o casamento de padrão extraindo `n = 25` e avalia o braço correspondente.',
            ),
            codePuzzle(
              'Monte o trecho que converte `"25"` com `parse::<i32>()`, trata primeiro `Ok(n)` dobrando o número e depois `Err(_)` devolvendo `0`, e imprime `dob`:',
              [
                'let dob = match "25".parse::<i32>() {',
                '    Ok(n) => n * 2,',
                '    Err(_) => 0,',
                '};',
                'println!("{dob}");',
              ],
              [
                '    Some(n) => n * 2,',
                '}',
              ],
              'Como `let dob = match ...` é uma declaração `let`, a chave de fechamento do `match` precisa terminar com `};` antes do `println!`.',
            ),
          ],
        },
      ],
    },
    {
      id: 'rt-erro-interrog',
      title: 'O operador ?',
      parts: [
        {
          card: [
            {
              title: 'Propagando erros em um caractere: ?',
              body:
                'Na prática, muitas funções não sabem como resolver um erro na hora: o papel delas é **propagar** a falha para quem as chamou decidir o que fazer.\n\n' +
                'Escrever um `match` inteiro para cada linha que pode falhar deixaria o código enorme. Por isso o Rust tem o operador `?`, colocado logo após uma expressão que devolve `Result<T, E>`:\n' +
                '• Se o resultado for `Ok(v)`, o `?` extrai `v` e o código continua na mesma linha.\n' +
                '• Se o resultado for `Err(e)`, o `?` **retorna imediatamente da função inteira** entregando `Err(From::from(e))` para quem chamou!\n\n' +
                'Se a função chegar até o fim sem tropeçar em nenhum `?`, você ainda precisa embrulhar o valor final em `Ok(...)`.',
              visual: code(
                `use std::num::ParseIntError;

fn sum_strs(
    a: &str,
    b: &str,
) -> Result<i32, ParseIntError> {
    let x: i32 = a.trim().parse()?;
    let y: i32 = b.trim().parse()?;
    Ok(x + y)
}`,
                [7, 8, 9],
                'Dois ? em sequência',
              ),
              tip: 'O `?` também pode ser encadeado no meio de uma expressão: `fs::read_to_string(path)?.trim().parse()?`.',
            },
            {
              title: 'Passo a passo: retorno antecipado com ?',
              body: 'Acompanhe no `stepper` o que acontece quando a primeira conversão dá `Ok`, mas a segunda falha no `?`:',
              visual: traceStepper({
                title: 'sum_strs("10", "xyz")',
                src: `fn sum_strs(
    a: &str,
    b: &str,
) -> Result<i32, ParseIntError> {
    let x: i32 = a.parse()?;
    let y: i32 = b.parse()?;
    Ok(x + y)
}

fn main() {
    let r = sum_strs("10", "xyz");
}`,
                head: ['Expressão avaliada', 'Resultado do parse', 'Ação do ?'],
                frames: [
                  {
                    line: [11],
                    rows: [['sum_strs("10", "xyz")', '—', 'inicia chamada']],
                    label: 'Passo 1: chamada',
                    info: '`main` chama `sum_strs` com `a = "10"` e `b = "xyz"`.',
                  },
                  {
                    line: [5],
                    rows: [['"10".parse::<i32>()?', 'Ok(10)', 'desembrulha x = 10']],
                    highlightRow: [0],
                    label: 'Passo 2: 1º ? (Ok)',
                    info: '`"10".parse()` devolve `Ok(10)`. O `?` extrai `10`, guarda em `x` e avança para a linha 6.',
                  },
                  {
                    line: [6],
                    rows: [
                      ['"10".parse::<i32>()?', 'Ok(10)', 'x = 10'],
                      ['"xyz".parse::<i32>()?', 'Err(ParseIntError)', 'return Err(...) imediato!'],
                    ],
                    highlightRow: [1],
                    label: 'Passo 3: 2º ? (Err)',
                    info: '`"xyz".parse()` devolve `Err`. O `?` **aborta a função na hora** e retorna `Err` para `main`. A linha 7 (`Ok(x + y)`) nunca executa!',
                  },
                  {
                    line: [11],
                    rows: [['r em main()', 'Err(ParseIntError)', 'recebeu o erro propagado']],
                    highlightRow: [0],
                    label: 'Passo 4: retorno em main',
                    info: '`main` recebe `r = Err(ParseIntError)` e pode tratá-lo com `match`.',
                  },
                ],
              }),
            },
          ],
          exercises: [
            mcq(
              'Dentro de uma função que retorna `Result<T, E>`, o que faz o operador `?` quando a expressão à esquerda avalia para `Err(e)`?',
              [
                'Retorna imediatamente da função atual devolvendo `Err(From::from(e))`',
                'Dispara `panic!` e encerra o programa na hora',
                'Substitui o erro por `0` e continua na linha seguinte',
                'Imprime o erro no terminal e repete a chamada',
              ],
              0,
              'O operador `?` propaga a falha: em caso de `Err(e)`, ele faz um `return Err(From::from(e))` imediato para quem chamou a função.',
            ),
            tf(
              'Mesmo usando `?` nas linhas internas de uma função que retorna `Result<i32, E>`, a última expressão de sucesso ainda precisa ser escrita como `Ok(valor)`.',
              true,
              'O `?` desembrulha os valores intermediários, mas o tipo de retorno da função continua sendo `Result<i32, E>`. Por isso o retorno final de sucesso deve ser `Ok(valor)`.',
            ),
            mcq(
              'O que é impresso na tela ao executar este programa?',
              [
                'Apenas `passo 1` e `erro capturado`',
                '`passo 1`, `passo 2` e `erro capturado`',
                'Apenas `erro capturado`',
                'O programa entra em pânico na linha 6',
              ],
              0,
              '`"7".parse()` funciona, então `passo 1` é impresso. Na linha 6, `"ruim".parse()?` retorna `Err` imediatamente da função `run()`, pulando `println!("passo 2")`. No `main`, o `match` cai em `Err(_)` e imprime `erro capturado`.',
              {
                visual: code(
                  `use std::num::ParseIntError;

fn run() -> Result<i32, ParseIntError> {
    let a: i32 = "7".parse()?;
    println!("passo 1");
    let b: i32 = "ruim".parse()?;
    println!("passo 2");
    Ok(a + b)
}

fn main() {
    match run() {
        Ok(v) => println!("ok: {v}"),
        Err(_) => {
            println!("erro capturado");
        }
    }
}`,
                  [4, 6, 7],
                  'Retorno antecipado com ?',
                ),
              },
            ),
            fill(
              'Complete a função para extrair `n` de `s.parse()` propagando erros e devolver o triplo em caso de sucesso:',
              'fn triple(s: &str) -> Result<i32, ParseIntError> {\n    let n: i32 = s.parse()___;\n    ___(n * 3)\n}',
              ['?', 'Ok'],
              ['!', 'unwrap', 'Some'],
              'O `?` após `s.parse()` desembrulha o `i32` ou retorna o `Err`, e `Ok(n * 3)` embrulha o resultado final no `Result`.',
            ),
            gen((rng) => {
              const a = randInt(rng, 3, 12);
              const b = randInt(rng, 2, 9);
              return num(
                'Qual número é impresso na saída quando as duas strings contêm inteiros válidos?',
                a * 3 + b,
                `Os dois \`?\` extraem \`a = ${a}\` e \`b = ${b}\` sem erro. A função devolve \`Ok(${a} * 3 + ${b}) = Ok(${a * 3 + b})\`, que é impresso pelo \`unwrap_or(0)\`.`,
                {
                  visual: code(
                    `use std::num::ParseIntError;

fn calc(
    x: &str,
    y: &str,
) -> Result<i32, ParseIntError> {
    let a: i32 = x.parse()?;
    let b: i32 = y.parse()?;
    Ok(a * 3 + b)
}

fn main() {
    let r = calc("${a}", "${b}");
    println!("{}", r.unwrap_or(0));
}`,
                    [7, 8, 9],
                    'Propagação bem-sucedida',
                  ),
                },
              );
            }),
            match(
              'Associe cada expressão ao seu papel dentro de uma função que usa `?`:',
              [
                ['let x = expr?;', 'Extrai o valor de Ok ou retorna Err imediatamente da função'],
                ['Ok(x + 1)', 'Envolve o valor calculado no final da função em um Result de sucesso'],
                ['expr.unwrap()', 'Extrai o valor de Ok ou aborta a thread inteira com panic!'],
              ],
              'Diferente de `unwrap()` (que derruba o programa), `expr?` devolve o controle ao chamador retornando `Err`.',
            ),
            order(
              'Ordene o que acontece quando `let n: i32 = s.trim().parse()?;` é executado com `s = " 40 "`:',
              [
                's.trim() remove os espaços nas pontas e devolve "40"',
                'parse::<i32>() converte "40" e produz Ok(40)',
                'O operador ? vê que é Ok(40) e extrai o inteiro 40',
                'A variável n recebe o valor 40 e a função segue para a próxima linha',
              ],
              'As chamadas encadeadas são avaliadas da esquerda para a direita: primeiro `trim()`, depois `parse()` e então o `?` desembrulha o `Ok(40)`.',
            ),
            codePuzzle(
              'Monte o corpo da função que remove espaços de `s` com `trim()`, converte para `i32` usando `?` e devolve o dobro em `Ok`:',
              [
                '    let clean = s.trim();',
                '    let n: i32 = clean.parse()?;',
                '    let dob = n * 2;',
                '    Ok(dob)',
              ],
              [
                '    let n: i32 = clean.parse();',
                '    dob',
              ],
              'Primeiro limpamos os espaços em `clean`, depois usamos `clean.parse()?` para extrair o `i32`, calculamos `dob` e o retornamos dentro de `Ok(dob)`.',
            ),
          ],
        },
        {
          card: [
            {
              title: 'Regras do ?: Option, Result e o retorno de main',
              body:
                'O operador `?` faz um `return` por baixo dos panos. Por isso, ele **só compila** se o tipo de retorno da função atual for compatível com o valor antes do `?` (caso contrário, o compilador emite o erro **`E0277`**):\n' +
                '• Em funções que retornam `Result<T, E>`, você pode usar `?` em valores `Result`.\n' +
                '• Em funções que retornam `Option<T>`, você pode usar `?` em valores `Option` (`Some(v)` extrai `v`; `None` retorna `None` na hora).\n' +
                '• **Não misture os dois direto:** usar `?` num `Option` dentro de uma função que retorna `Result` gera `E0277`. Converta antes com `.ok_or("erro")?` (de `Option` para `Result`) ou `.ok()?` (de `Result` para `Option`).\n\n' +
                'E se você quiser usar `?` dentro do `main`? Basta declarar `fn main() -> Result<(), Box<dyn std::error::Error>>` e terminar o `main` com `Ok(())`!',
              visual: code(
                `use std::error::Error;

fn first_num(
    v: &[&str],
) -> Result<i32, Box<dyn Error>> {
    let s = v.first().ok_or("vazio")?;
    let n: i32 = s.parse()?;
    Ok(n)
}

fn main()
-> Result<(), Box<dyn Error>> {
    let n = first_num(&["42"])?;
    println!("{n}");
    Ok(())
}`,
                [6, 12, 15],
                '? com ok_or e no main',
              ),
              tip: '`Box<dyn std::error::Error>` lê-se "qualquer tipo de erro que implemente a trait `Error`", permitindo usar `?` tanto em erros de arquivo quanto em erros de `parse` na mesma função.',
            },
            {
              title: 'No seu computador: somador de arquivo com ? (Exercício 25)',
              body:
                'Vamos implementar o **Exercício 25** do roteiro:\n\n' +
                '• Crie o projeto com `cargo new somador` e crie um arquivo `numeros.txt` na raiz com três linhas (`10`, `20`, `30`).\n' +
                '• Escreva `fn sum_file(path: &str) -> Result<i64, Box<dyn std::error::Error>>` que lê o arquivo com `std::fs::read_to_string(path)?`, percorre `content.lines()` convertendo cada linha com `line.trim().parse::<i64>()?` e devolve `Ok(total)`.\n' +
                '• Mude a assinatura do `main` para `fn main() -> Result<(), Box<dyn std::error::Error>>` e chame `let s = sum_file("numeros.txt")?;`.\n\n' +
                '**Critério de pronto:** `cargo run` imprime `Soma: 60`, se você colocar uma palavra no arquivo o programa encerra mostrando o `ParseIntError` sem usar nenhum `unwrap()`, e `cargo clippy -- -D warnings` passa sem avisos.',
              visual: code(
                `use std::error::Error;
use std::fs;

fn sum_file(
    path: &str,
) -> Result<i64, Box<dyn Error>> {
    let txt = fs::read_to_string(path)?;
    let mut sum = 0;
    for line in txt.lines() {
        let n: i64 =
            line.trim().parse()?;
        sum += n;
    }
    Ok(sum)
}`,
                [6, 7, 10, 11],
                'Exercício 25 — src/main.rs',
              ),
            },
          ],
          exercises: [
            mcq(
              'Por que este programa não compila na linha 2 destacada?',
              [
                'Erro `E0277`: o operador `?` não pode ser usado em `fn main()` quando ela retorna `()`; `main` precisa retornar `Result`',
                'Erro `E0308`: `"42".parse()` devolve `f64` e não `i32`',
                'Erro `E0382`: a string `"42"` foi movida duas vezes',
                'Erro `E0004`: faltou um bloco `unsafe` em volta do `?`',
              ],
              0,
              'Por padrão `fn main()` retorna `()`. Usar `?` exige que a função retorne `Result` ou `Option`; caso contrário o compilador emite `error[E0277]: the \'?\' operator can only be used in a function that returns \'Result\' or \'Option\'`.',
              {
                visual: code(
                  `fn main() {
    let n: i32 = "42".parse()?;
    println!("{n}");
}`,
                  [1, 2],
                  '? em função que retorna ()',
                ),
              },
            ),
            mcq(
              'Qual é o motivo do erro `E0277` na linha 4 destacada abaixo?',
              [
                '`s.chars().next()` devolve `Option<char>`, mas a função retorna `Result`; é preciso converter com `.ok_or("vazio")?`',
                'O método `.chars()` só existe para `String` e não para `&str`',
                'A função deveria retornar `char` sem `Result`',
                'O operador `?` nunca pode ser usado com caracteres UTF-8',
              ],
              0,
              'Não se pode aplicar `?` diretamente sobre um `Option` dentro de uma função que retorna `Result` (`error[E0277]: the \'?\' operator can only be used on \'Result\'s, not \'Option\'s, in a function that returns \'Result\'`). Use `.ok_or("vazio")?` para transformar `None` em `Err("vazio")`.',
              {
                visual: code(
                  `fn first_char(
    s: &str,
) -> Result<char, &'static str> {
    let c = s.chars().next()?;
    Ok(c)
}`,
                  [4],
                  'Misturando Option e Result com ?',
                ),
              },
            ),
            fill(
              'Complete a linha que transforma o `Option<&i32>` de `.first()` em `Result<&i32, &\'static str>` antes de aplicar o `?`:',
              'let x = v.first().___("vetor vazio")?;',
              ['ok_or'],
              ['unwrap', 'as_ref', 'is_some'],
              '`.ok_or("vetor vazio")` converte `Some(x)` em `Ok(x)` e `None` em `Err("vetor vazio")`, permitindo usar `?` numa função que retorna `Result`.',
            ),
            tf(
              'Em uma função que retorna `Option<u32>`, o operador `?` pode ser usado em expressões do tipo `Option`, retornando `None` imediatamente se alguma delas for `None`.',
              true,
              'O operador `?` funciona tanto para `Result` (em funções que retornam `Result`) quanto para `Option` (em funções que retornam `Option`).',
            ),
            gen((rng) => {
              const first = randInt(rng, 5, 20);
              const mid = randInt(rng, 1, 9);
              const last = randInt(rng, 10, 30);
              return num(
                'Qual número é impresso pela execução deste programa que usa `?` com `Option`?',
                first + last,
                `\`v.first()?\` extrai \`&${first}\` e \`v.last()?\` extrai \`&${last}\`. A função retorna \`Some(${first} + ${last}) = Some(${first + last})\`, e \`unwrap_or(0)\` imprime \`${first + last}\`.`,
                {
                  visual: code(
                    `fn ends(v: &[i32]) -> Option<i32> {
    let a = *v.first()?;
    let b = *v.last()?;
    Some(a + b)
}

fn main() {
    let v = [${first}, ${mid}, ${last}];
    let s = ends(&v).unwrap_or(0);
    println!("{s}");
}`,
                    [2, 3, 4],
                    '? em função Option',
                  ),
                },
              );
            }),
            multi(
              'Quais tipos de retorno na assinatura de uma função permitem usar `s.parse::<i32>()?` diretamente dentro dela?',
              [
                '`Result<i32, std::num::ParseIntError>`',
                '`Result<(), Box<dyn std::error::Error>>`',
                '`i32`',
                '`Option<i32>`',
              ],
              [0, 1],
              '`s.parse::<i32>()` devolve `Result<i32, ParseIntError>`. O `?` funciona quando a função retorna um `Result` cujo tipo de erro aceita `ParseIntError` (diretamente ou via `From`, como `Box<dyn Error>`). Não funciona se o retorno for `i32` ou `Option<i32>`.',
            ),
            match(
              'Associe cada método de conversão entre `Option` e `Result` ao que ele produz:',
              [
                ['opt.ok_or(err)', 'Converte Option<T> em Result<T, E>, usando err quando for None'],
                ['opt.ok_or_else(|| cria_err())', 'Converte Option<T> em Result<T, E>, só criando o erro se for None'],
                ['res.ok()', 'Converte Result<T, E> em Option<T>, descartando o erro se for Err'],
                ['res.err()', 'Converte Result<T, E> em Option<E>, ficando com Some(erro) se for Err'],
              ],
              'Esses quatro métodos fazem a ponte limpa entre `Option` e `Result` quando você precisa combinar APIs diferentes com `?`.',
            ),
            codePuzzle(
              'Monte a função `main` que retorna `Result<(), Box<dyn Error>>`, converte `"42"` com `?`, imprime o número e encerra com sucesso:',
              [
                'fn main()',
                '-> Result<(), Box<dyn Error>> {',
                '    let n: i32 = "42".parse()?;',
                '    println!("{n}");',
                '    Ok(())',
                '}',
              ],
              [
                'fn main() {',
                '    return 0;',
              ],
              'Quando `main` retorna `Result<(), Box<dyn Error>>`, podemos usar `?` diretamente nele e finalizar com `Ok(())` (o valor unidade `()` dentro de `Ok`).',
            ),
          ],
        },
      ],
    },
    {
      id: 'rt-erro-proprio',
      title: 'Erros próprios, From e Box<dyn Error>',
      parts: [
        {
          card: [
            {
              title: 'Criando seu próprio enum de erro',
              body:
                'Quando você escreve um módulo de domínio — como a conta bancária do **Exercício 26** do roteiro — devolver `Err("erro")` como texto solto obriga quem chama a adivinhar as mensagens possíveis.\n\n' +
                'O padrão em Rust é criar um **`enum` de erro** com uma variante para cada falha do domínio:\n' +
                '• Derive `#[derive(Debug, PartialEq)]` para formatar com `{:?}` e comparar em testes.\n' +
                '• Implemente `std::fmt::Display` para descrever o erro em português claro quando impresso com `{}`.\n' +
                '• Implemente `std::error::Error` (que exige `Debug` + `Display`) para que o seu erro funcione com `Box<dyn Error>` e com todo o ecossistema.',
              visual: code(
                `use std::error::Error;
use std::fmt;

#[derive(Debug, PartialEq)]
enum AccountError {
    NoFunds,
    BadAmount,
}

impl fmt::Display for AccountError {
    fn fmt(
        &self,
        f: &mut fmt::Formatter<'_>,
    ) -> fmt::Result {
        match self {
            Self::NoFunds => {
                write!(f, "sem saldo")
            }
            Self::BadAmount => {
                write!(f, "invalido")
            }
        }
    }
}

impl Error for AccountError {}`,
                [5, 10, 26],
                'Erro de domínio completo',
              ),
              tip: 'Com um `enum`, quem chama `match withdraw(...)` recebe ajuda do compilador (`E0004`) se esquecer de tratar qualquer variante de erro!',
            },
            {
              title: 'O papel de cada trait num tipo de erro',
              body: 'Veja na tabela o que cada trait habilita no seu tipo de erro:',
              visual: table(
                ['Trait', 'Como implementar', 'O que habilita'],
                [
                  ['fmt::Debug', '#[derive(Debug)]', 'Imprimir com {:?} e usar em assert_eq!'],
                  ['fmt::Display', 'impl fmt::Display', 'Mensagem amigável para o usuário com {}'],
                  ['error::Error', 'impl Error (exige Debug + Display)', 'Usar em Box<dyn Error> e encadear causas'],
                  ['PartialEq', '#[derive(PartialEq)]', 'Comparar erros com == nos testes'],
                ],
                [1, 2],
              ),
            },
          ],
          exercises: [
            mcq(
              'Quais duas traits um tipo `MeuErro` precisa implementar antes de poder declarar `impl std::error::Error for MeuErro {}`?',
              [
                '`std::fmt::Debug` e `std::fmt::Display`',
                '`Clone` e `Copy`',
                '`PartialEq` e `PartialOrd`',
                '`Default` e `FromStr`',
              ],
              0,
              'Na biblioteca padrão, a definição da trait `Error` é `pub trait Error: Debug + Display`. Portanto, todo tipo que implementa `Error` deve implementar tanto `Debug` quanto `Display`.',
            ),
            tf(
              'Escrever `#[derive(Debug)]` acima de um `enum AccountError` já gera automaticamente a implementação de `std::fmt::Display` para usar `{}` no `println!`.',
              false,
              '`Debug` (`{:?}`) pode ser derivado com `#[derive(Debug)]`, mas `Display` (`{}`) exige mensagens pensadas para o usuário final e deve ser implementado com `impl fmt::Display` (ou usando a crate `thiserror`).',
            ),
            mcq(
              'Por que este código falha ao compilar na linha 8 destacada?',
              [
                'Erro `E0277`: `AppError` não implementa `std::fmt::Display`, exigido pelo formato `{}`',
                'Erro `E0004`: `AppError` precisa ter pelo menos duas variantes',
                'Erro `E0382`: `e` foi movido antes do `println!`',
                'Erro `E0308`: `println!` só aceita tipos numéricos',
              ],
              0,
              'O especificador `{}` chama a trait `std::fmt::Display`. Como `AppError` só derivou `Debug`, usar `{e}` gera `error[E0277]: \'AppError\' doesn\'t implement \'std::fmt::Display\'` (para `Debug` seria `{e:?}`, ou implementa-se `Display`).',
              {
                visual: code(
                  `#[derive(Debug)]
enum AppError {
    Empty,
}

fn main() {
    let e = AppError::Empty;
    println!("{e}");
}`,
                  [1, 8],
                  'Faltou Display',
                ),
              },
            ),
            mcq(
              'O que acontece ao compilar o `match` destacado sobre o retorno de `withdraw` (que devolve `Result<i32, AccountError>`)?',
              [
                'Não compila com `E0004` (`non-exhaustive patterns`), pois falta cobrir `Err(AccountError::BadAmount)`',
                'Compila normalmente porque `NoFunds` é a primeira variante',
                'Não compila com `E0308`, pois `Ok(bal)` não é um número',
                'Entra em pânico apenas se o valor sacado for negativo',
              ],
              0,
              'Essa é a grande vantagem de um `enum` de erro: o compilador recusa o `match` com `error[E0004]: non-exhaustive patterns: \'Err(AccountError::BadAmount)\' not covered` até que todas as variantes sejam tratadas.',
              {
                visual: code(
                  `match withdraw(100, 50) {
    Ok(bal) => println!("saldo: {bal}"),
    Err(AccountError::NoFunds) => {
        println!("sem saldo");
    }
}`,
                  [1, 3],
                  'Variante esquecida no match',
                ),
              },
            ),
            fill(
              'Complete a assinatura do método exigido pela trait `std::fmt::Display`:',
              'impl fmt::Display for AccountError {\n    fn fmt(&self, f: &mut fmt::Formatter<\'_>) -> fmt::___ {\n        write!(f, "erro na conta")\n    }\n}',
              ['Result'],
              ['Error', 'String', 'Option'],
              'O método `fmt` devolve `fmt::Result` (um apelido para `Result<(), fmt::Error>`), que é exatamente o que a macro `write!(f, ...)` retorna.',
            ),
            gen((rng) => {
              const bal = randInt(rng, 200, 500);
              const amt = randInt(rng, 50, 150);
              return num(
                'Qual é o saldo impresso após executar a chamada válida de `withdraw`?',
                bal - amt,
                `Como \`amt = ${amt}\` é positivo e menor ou igual a \`bal = ${bal}\`, \`withdraw\` devolve \`Ok(${bal} - ${amt}) = Ok(${bal - amt})\`, e o braço \`Ok(rest)\` imprime \`${bal - amt}\`.`,
                {
                  visual: code(
                    `#[derive(Debug)]
enum AccountError {
    NoFunds,
    BadAmount,
}

fn withdraw(
    bal: i32,
    amt: i32,
) -> Result<i32, AccountError> {
    if amt <= 0 {
        Err(AccountError::BadAmount)
    } else if amt > bal {
        Err(AccountError::NoFunds)
    } else {
        Ok(bal - amt)
    }
}

fn main() {
    if let Ok(r) = withdraw(${bal}, ${amt}) {
        println!("{r}");
    }
}`,
                    [10, 16, 20],
                    'Saque com enum de erro',
                  ),
                },
              );
            }),
            match(
              'Associe cada elemento de um erro customizado à sua responsabilidade:',
              [
                ['enum AccountError', 'Lista em variantes fechadas todos os motivos possíveis de falha'],
                ['write!(f, "...") em Display', 'Escreve a mensagem legível sem precisar alocar uma String intermediária'],
                ['impl std::error::Error', 'Marca o tipo como um erro oficial compatível com Box<dyn Error>'],
                ['#[derive(Debug, PartialEq)]', 'Permite inspecionar com {:?} e testar com assert_eq!'],
              ],
              'Juntos, esses quatro blocos formam um tipo de erro idiomático em Rust puro, sem depender de nenhuma biblioteca externa.',
            ),
            codePuzzle(
              'Monte o corpo de `withdraw`: retorne `Err(AccountError::BadAmount)` se `amt <= 0`, `Err(AccountError::NoFunds)` se `amt > bal` e `Ok(bal - amt)` caso contrário:',
              [
                '    if amt <= 0 {',
                '        Err(AccountError::BadAmount)',
                '    } else if amt > bal {',
                '        Err(AccountError::NoFunds)',
                '    } else {',
                '        Ok(bal - amt)',
                '    }',
              ],
              [
                '        Ok(amt - bal)',
                '        AccountError::BadAmount',
              ],
              'A cadeia `if / else if / else` testa primeiro se o valor é menor ou igual a zero (`BadAmount`), depois se excede o saldo (`NoFunds`) e, por fim, devolve `Ok(bal - amt)`.',
            ),
          ],
        },
        {
          card: [
            {
              title: 'Conversão com From, thiserror e anyhow',
              body:
                'O que acontece quando sua função chama `fs::read_to_string` (que falha com `io::Error`) **e** `.parse::<i32>()` (que falha com `ParseIntError`), mas retorna `Result<i32, AppError>`?\n\n' +
                'Lembre-se de que o operador `?` chama `From::from(erro)`! Se você implementar `From<ParseIntError> for AppError` e `From<io::Error> for AppError`, o `?` converte cada erro para o seu `AppError` automaticamente. Para casos pontuais, você também pode usar `.map_err(AppError::Parse)?`.\n\n' +
                'No dia a dia (**Exercício 27** do roteiro), duas crates eliminam o código repetitivo:\n' +
                '• **`thiserror`**: gera `Display`, `Error` e `From` com atributos `#[error("...")]` e `#[from]`. Convenção: use em **bibliotecas**.\n' +
                '• **`anyhow`**: fornece `anyhow::Result<T>`, que aceita qualquer erro e permite anexar contexto com `.context("falha ao ler config")?`. Convenção: use em **aplicações** (`main`).',
              visual: code(
                `use std::num::ParseIntError;

#[derive(Debug)]
enum AppError {
    Empty,
    Parse(ParseIntError),
}

impl From<ParseIntError> for AppError {
    fn from(e: ParseIntError) -> Self {
        Self::Parse(e)
    }
}

fn read_num(
    s: &str,
) -> Result<i32, AppError> {
    if s.is_empty() {
        return Err(AppError::Empty);
    }
    let n: i32 = s.parse()?;
    Ok(n)
}`,
                [9, 10, 11, 21],
                'Conversão automática com From',
              ),
              tip: 'Com a crate `thiserror`, aquelas 15 linhas de `Display`, `Error` e `From` viram apenas `#[derive(Debug, thiserror::Error)]` e `#[error("numero invalido: {0}")] Parse(#[from] ParseIntError)`.',
            },
            {
              title: 'Passo a passo: o ? acionando From::from',
              body: 'Veja passo a passo como `s.parse()?` transforma um `ParseIntError` em `AppError::Parse` sem precisar de `map_err`:',
              visual: traceStepper({
                title: 'read_num("abc")',
                src: `impl From<ParseIntError> for AppError {
    fn from(e: ParseIntError) -> Self {
        Self::Parse(e)
    }
}

fn read_num(
    s: &str,
) -> Result<i32, AppError> {
    if s.is_empty() {
        return Err(AppError::Empty);
    }
    let n: i32 = s.parse()?;
    Ok(n)
}`,
                head: ['Etapa', 'Valor em trânsito', 'Tipo'],
                frames: [
                  {
                    line: [10],
                    rows: [['1. Checa vazio', 's = "abc" (não vazio)', '&str']],
                    label: 'Passo 1: validação inicial',
                    info: '`s` vale `"abc"`, então `s.is_empty()` é `false` e a execução segue para a linha 13.',
                  },
                  {
                    line: [13],
                    rows: [['2. s.parse::<i32>()', 'Err(ParseIntError)', 'Result<i32, ParseIntError>']],
                    highlightRow: [0],
                    label: 'Passo 2: falha no parse',
                    info: '`"abc".parse::<i32>()` falha e devolve `Err(ParseIntError)`.',
                  },
                  {
                    line: [2, 3],
                    rows: [['3. AppError::from(e)', 'AppError::Parse(e)', 'AppError']],
                    highlightRow: [0],
                    label: 'Passo 3: From::from',
                    info: 'O operador `?` enxerga que a função retorna `AppError` e chama `AppError::from(e)` automaticamente!',
                  },
                  {
                    line: [13],
                    rows: [['4. Retorno de read_num', 'Err(AppError::Parse(e))', 'Result<i32, AppError>']],
                    highlightRow: [0],
                    label: 'Passo 4: retorno convertido',
                    info: '`read_num` retorna `Err(AppError::Parse(e))` pronto para o chamador.',
                  },
                ],
              }),
            },
            {
              title: 'No seu computador: ErroConta, thiserror e anyhow (Exercícios 26 e 27)',
              body:
                'Hora de fazer os **Exercícios 26 e 27** do roteiro:\n\n' +
                '• Crie o projeto com `cargo new banco_erros`.\n' +
                '• **Parte 1 (Ex. 26):** crie `enum ErroConta { SaldoInsuficiente, ValorInvalido }`, implemente `Display` à mão e faça `sacar(&mut self, v: i64) -> Result<(), ErroConta>`. Trate no `main` com `match conta.sacar(500)`.\n' +
                '• **Parte 2 (Ex. 27):** rode `cargo add thiserror anyhow`, substitua o `impl Display` manual por `#[derive(Debug, thiserror::Error)]` com `#[error("...")]` em cada variante e mude o `main` para retornar `anyhow::Result<()>`.\n\n' +
                '**Critério de pronto:** o programa compila e roda nas duas versões, exibe as mensagens definidas em `#[error("...")]` e passa em `cargo clippy -- -D warnings`.',
              visual: code(
                `// Cargo.toml:
// thiserror = "2"
// anyhow = "1"
use thiserror::Error;

#[derive(Debug, Error)]
enum ErroConta {
    #[error("saldo insuficiente")]
    SaldoInsuficiente,
    #[error("valor invalido")]
    ValorInvalido,
}`,
                [6, 8, 10],
                'Exercício 27 com thiserror',
              ),
            },
          ],
          exercises: [
            mcq(
              'Qual trait o operador `?` utiliza automaticamente para converter um erro do tipo `E1` no tipo de erro `E2` do retorno da função?',
              ['`From<E1> for E2`', '`Display for E2`', '`Clone for E1`', '`Copy for E2`'],
              0,
              'Quando `expr?` encontra `Err(e)`, ele se expande para `return Err(From::from(e))`, acionando a implementação de `From<E1> for E2`.',
            ),
            mcq(
              'Por que a linha 11 destacada não compila neste trecho?',
              [
                'Erro `E0277`: `AppError` não implementa `From<ParseIntError>`, então o `?` não sabe converter o erro de `parse()`',
                'Erro `E0308`: `s.parse()` devolve `Option<i32>` em vez de `Result`',
                'Erro `E0382`: a referência `s` foi movida em `s.parse()`',
                'Erro `E0004`: `AppError` precisa implementar `Copy`',
              ],
              0,
              'Sem `impl From<ParseIntError> for AppError` (ou sem `.map_err(AppError::Parse)?`), o compilador recusa o `?` com `error[E0277]: \'?\' couldn\'t convert the error to \'AppError\'`.',
              {
                visual: code(
                  `use std::num::ParseIntError;

#[derive(Debug)]
enum AppError {
    Parse(ParseIntError),
}

fn load(
    s: &str,
) -> Result<i32, AppError> {
    let n: i32 = s.parse()?;
    Ok(n)
}`,
                  [11],
                  'Faltou From<ParseIntError>',
                ),
              },
            ),
            tf(
              'A convenção amplamente adotada na comunidade Rust é usar `thiserror` em bibliotecas (para expor enums de erro tipados) e `anyhow` em aplicações (para juntar erros variados com contexto).',
              true,
              'Em bibliotecas, quem chama precisa poder fazer `match` nas variantes (`thiserror`). Em aplicações binárias (`main`), o objetivo costuma ser agregar e relatar os erros com contexto (`anyhow`).',
            ),
            fill(
              'Complete a chamada que converte manualmente o erro de `parse()` em `AppError::Parse` na própria linha, sem precisar implementar `From`:',
              'let n: i32 = s.parse().___(AppError::Parse)?;',
              ['map_err'],
              ['map', 'unwrap_or', 'ok_or'],
              '`.map_err(f)` aplica a função (ou construtor de variante `AppError::Parse`) apenas se o `Result` for `Err(e)`, mantendo `Ok(v)` intocado.',
            ),
            gen((rng) => {
              const numVal = randInt(rng, 10, 45);
              const bonus = randInt(rng, 5, 20);
              return num(
                'Qual número é impresso na tela quando `read_bonus` executa?',
                numVal + bonus,
                `Como \`s = "${numVal}"\` contém um inteiro válido, \`s.parse()?\` produz \`${numVal}\`. A função retorna \`Ok(${numVal} + ${bonus}) = Ok(${numVal + bonus})\`, que é impresso no \`main\`.`,
                {
                  visual: code(
                    `use std::num::ParseIntError;

#[derive(Debug)]
enum AppError {
    Parse(ParseIntError),
}

impl From<ParseIntError> for AppError {
    fn from(e: ParseIntError) -> Self {
        Self::Parse(e)
    }
}

fn read_bonus(
    s: &str,
) -> Result<i32, AppError> {
    let n: i32 = s.parse()?;
    Ok(n + ${bonus})
}

fn main() {
    if let Ok(v) = read_bonus("${numVal}") {
        println!("{v}");
    }
}`,
                    [17, 18, 22],
                    'Usando From com ?',
                  ),
                },
              );
            }),
            match(
              'Associe cada ferramenta ao cenário em que ela se encaixa melhor:',
              [
                ['thiserror', 'Criar enums de erro bem tipados em uma biblioteca reutilizável'],
                ['anyhow', 'Juntar erros variados e adicionar mensagens de contexto no binário principal'],
                ['Box<dyn Error>', 'Tipo dinâmico da biblioteca padrão que aceita qualquer Error sem crates externas'],
                ['map_err', 'Converter o erro de uma chamada específica antes do ? sem implementar From'],
              ],
              'Conhecer as quatro opções permite escolher desde o Rust 100% padrão (`enum` + `From` ou `Box<dyn Error>`) até as crates padrão da indústria (`thiserror` e `anyhow`).',
            ),
            order(
              'Ordene o que acontece quando `s.parse::<i32>()?` falha dentro de `fn load(s: &str) -> Result<i32, AppError>`:',
              [
                's.parse::<i32>() encontra texto inválido e retorna Err(ParseIntError)',
                'O operador ? intercepta a variante Err(ParseIntError)',
                'O ? chama AppError::from(err) usando a trait From<ParseIntError>',
                'A função load retorna imediatamente Err(AppError::Parse(err))',
              ],
              'O operador `?` combina o desvio condicional de erro com a chamada automática a `From::from`.',
            ),
            codePuzzle(
              'Monte a implementação de `From<ParseIntError> for AppError` que embrulha o erro recebido na variante `AppError::Parse(e)`:',
              [
                'impl From<ParseIntError> for AppError {',
                '    fn from(e: ParseIntError) -> Self {',
                '        Self::Parse(e)',
                '    }',
                '}',
              ],
              [
                '    fn from(e: AppError) -> Self {',
                '        Ok(Self::Parse(e))',
              ],
              'O método `from` recebe o erro de origem (`e: ParseIntError`) e devolve diretamente `Self` (`AppError::Parse(e)`), sem `Result` nem `Ok`.',
            ),
          ],
        },
      ],
    },
    {
      id: 'rt-erro-boas',
      title: 'unwrap, expect e boas práticas',
      parts: [
        {
          card: [
            {
              title: 'unwrap(), expect() e onde eles são permitidos',
              body:
                'Tanto `Result<T, E>` quanto `Option<T>` possuem dois métodos de atalho que extraem o valor interno ou entram em pânico na hora se não houver valor:\n' +
                '• `.unwrap()` — devolve `v` se for `Ok(v)`/`Some(v)` ou chama `panic!` com uma mensagem genérica.\n' +
                '• `.expect("motivo")` — faz o mesmo, mas exibe a sua mensagem junto com o erro, documentando **por que** você tinha certeza de que aquela operação não falharia.\n\n' +
                '**Regra do Desafio 50 Dias (Módulo 4):** em código de produção, `unwrap()` e `expect()` escondem erros que deveriam ser tratados com `Result` e `?`. Por isso, reserve-os para **testes automatizados** (`#[test]`, onde entrar em pânico é justamente como o teste falha!) ou para literais fixos validados na mão.',
              visual: code(
                `#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn withdraw_works() {
        let mut acc = Account::new(100);
        acc.withdraw(40).expect("ok");
        assert_eq!(acc.balance(), 60);
        let r = acc.withdraw(200);
        assert!(r.is_err());
    }
}`,
                [5, 8, 11],
                'Testes nativos (Exercício 28)',
              ),
              tip: 'Entre `unwrap()` e `expect("...")`, prefira sempre `expect` descrevendo o motivo da sua certeza: se um dia o pânico acontecer, você saberá imediatamente qual premissa quebrou.',
            },
            {
              title: 'Guia rápido de escolha',
              body: 'Compare os métodos de extração de `Result<T, E>` e quando usar cada um:',
              visual: table(
                ['Método', 'Se for Err(e)', 'Onde usar'],
                [
                  ['expr?', 'Retorna Err(From::from(e))', 'Código de produção (propaga o erro)'],
                  ['unwrap_or(padrao)', 'Devolve padrao sem pânico', 'Quando há um valor substituto natural'],
                  ['expect("motivo")', 'Dispara panic! com o motivo', 'Testes #[test] ou invariantes provadas'],
                  ['unwrap()', 'Dispara panic! genérico', 'Apenas rascunhos rápidos ou testes curtos'],
                ],
                [0, 2],
              ),
            },
          ],
          exercises: [
            mcq(
              'Qual é a diferença entre `.unwrap()` e `.expect("config fixa deve ser valida")` quando chamados sobre um `Err(e)`?',
              [
                'Ambos disparam `panic!`, mas `expect` inclui a mensagem personalizada explicando a premissa violada',
                '`expect` corrige o erro automaticamente, enquanto `unwrap` aborta o programa',
                '`unwrap` retorna `None`, enquanto `expect` entra em pânico',
                '`expect` só funciona dentro da função `main`',
              ],
              0,
              'Os dois entram em pânico se o `Result` for `Err`, mas `expect` imprime a sua mensagem personalizada antes do erro, tornando o diagnóstico muito mais rápido.',
            ),
            tf(
              'Dentro de uma função marcada com `#[test]`, usar `.unwrap()` ou `.expect()` é adequado porque um teste em Rust falha justamente quando ocorre um `panic!`.',
              true,
              'O executor do `cargo test` roda cada `#[test]` e considera que o teste passou se ele terminar normalmente, ou que falhou se ele entrar em pânico (`assert!`, `assert_eq!`, `unwrap`, `expect`).',
            ),
            mcq(
              'O que acontece ao rodar `cargo test` com o teste abaixo?',
              [
                'O teste **passa**, pois `withdraw(100, 500)` retorna `Err` e `.is_err()` avalia para `true`',
                'O teste **falha**, pois `withdraw(100, 500)` retorna `Err`',
                'O código não compila porque `assert!` não aceita chamadas de método',
                'O teste é ignorado pelo Cargo',
              ],
              0,
              'Como `500 > 100`, `withdraw(100, 500)` devolve `Err(...)`. O método `.is_err()` devolve `true`, portanto `assert!(true)` passa sem pânico e o teste é aprovado!',
              {
                visual: code(
                  `#[test]
fn reject_overdraft() {
    let res = withdraw(100, 500);
    assert!(res.is_err());
}`,
                  [3, 4],
                  'Testando se deu erro',
                ),
              },
            ),
            fill(
              'Complete os dois atributos padrão usados para criar um módulo de testes unitários no mesmo arquivo (Exercício 28):',
              '#[cfg(___)]\nmod tests {\n    #[___]\n    fn soma_basica() {\n        assert_eq!(2 + 2, 4);\n    }\n}',
              ['test', 'test'],
              ['debug', 'main', 'bench'],
              '`#[cfg(test)]` faz o módulo só ser compilado durante o `cargo test`, e `#[test]` marca cada função de teste para o executor.',
            ),
            gen((rng) => {
              const init = randInt(rng, 100, 300);
              const dep = randInt(rng, 20, 90);
              const saq = randInt(rng, 30, 80);
              const finalBal = init + dep - saq;
              return num(
                'Qual número deve estar no `assert_eq!` da linha 6 para que este teste unitário passe?',
                finalBal,
                `O saldo começa em \`${init}\`, soma \`${dep}\` (\`${init + dep}\`) e desconta o saque válido de \`${saq}\`, terminando em \`${init} + ${dep} - ${saq} = ${finalBal}\`.`,
                {
                  visual: code(
                    `#[test]
fn account_flow() {
    let mut b = ${init};
    b += ${dep};
    b = withdraw(b, ${saq}).unwrap();
    assert_eq!(b, ${finalBal});
}`,
                    [5, 6],
                    'Cálculo no #[test]',
                  ),
                },
              );
            }),
            multi(
              'Em quais situações o capítulo 9.3 do livro oficial considera adequado usar `.expect("...")` ou `.unwrap()`?',
              [
                'Em testes automatizados (`#[test]`), onde qualquer erro inesperado deve reprovar o teste',
                'Quando a lógica do código prova que o `Result` sempre será `Ok` (ex.: converter o literal fixo `"127.0.0.1".parse()`)',
                'Ao abrir um arquivo cujo caminho foi digitado pelo usuário na linha de comando',
                'Ao ler uma resposta HTTP vinda da internet em produção',
              ],
              [0, 1],
              'Arquivos informados pelo usuário e conexões de rede podem falhar a qualquer momento sem que haja bug no programa, então devem usar `Result` e `?`. Já testes e literais fixos provados em código podem usar `expect`.',
            ),
            match(
              'Associe cada verificação de teste ao que ela confirma durante o `cargo test`:',
              [
                ['assert!(res.is_err())', 'Confirma que a operação recusou uma entrada inválida retornando Err'],
                ['assert_eq!(res, Ok(50))', 'Confirma que a operação teve sucesso e produziu exatamente 50'],
                ['res.expect("saque valido")', 'Extrai o valor no teste ou falha o teste mostrando "saque valido"'],
                ['#[should_panic]', 'Atributo que faz o teste passar somente se a função entrar em pânico'],
              ],
              'Com `assert!`, `assert_eq!`, `expect` e `#[should_panic]` você testa tanto os caminhos felizes quanto os erros esperados sem instalar nenhuma biblioteca externa.',
            ),
            codePuzzle(
              'Monte um teste unitário marcado com `#[test]` que cria `let mut acc = Account::new(100);`, primeiro verifica que `acc.withdraw(250)` retorna erro e depois confirma que o saldo continua `100`:',
              [
                '#[test]',
                'fn overdraft_keeps_balance() {',
                '    let mut acc = Account::new(100);',
                '    assert!(acc.withdraw(250).is_err());',
                '    assert_eq!(acc.balance(), 100);',
                '}',
              ],
              [
                '    assert!(acc.withdraw(250).is_ok());',
                '    acc.withdraw(250).unwrap();',
              ],
              'O teste tenta sacar `250` de um saldo de `100`, confere que o retorno é `Err` com `assert!(...is_err())` e garante que o saldo permaneceu intacto em `100`.',
            ),
          ],
        },
        {
          card: [
            {
              title: 'Tipos que validam na construção (Newtype e TryFrom)',
              body:
                'A seção 9.3 do livro e os **Exercícios 14 e 35** do roteiro mostram a melhor prática de todas: **usar o sistema de tipos para tornar estados inválidos impossíveis**.\n\n' +
                '• Se uma idade vai de 0 a 255, use `u8` em vez de `i32`: idade negativa deixa de existir sem nenhum `if`!\n' +
                '• Se um palpite (`Guess`) precisa estar entre `1` e `100` (ou um `Cpf` precisa ter 11 dígitos), crie uma `struct` com **campo privado** e valide uma única vez no construtor `Guess::new(v) -> Result<Guess, ...>` ou implementando a trait `TryFrom`.\n\n' +
                'Como o campo `value` é privado, ninguém fora do módulo consegue criar um `Guess` inválido (`E0451`). Todas as funções que recebem `Guess` sabem, por construção, que o número já está entre `1` e `100`!',
              visual: code(
                `pub struct Guess {
    value: i32, // privado!
}

impl Guess {
    pub fn new(
        v: i32,
    ) -> Result<Self, &'static str> {
        if !(1..=100).contains(&v) {
            return Err("fora da faixa");
        }
        Ok(Self { value: v })
    }

    pub fn value(&self) -> i32 {
        self.value
    }
}`,
                [2, 9, 10, 12],
                'Validação por construção',
              ),
              tip: 'A trait `std::convert::TryFrom<T>` padroniza conversões que podem falhar: ao implementar `TryFrom<&str> for Cpf`, você ganha o método `Cpf::try_from(texto)` retornando `Result<Cpf, Self::Error>`.',
            },
            {
              title: 'Passo a passo: validando na fronteira',
              body: 'Veja no `stepper` como validar na entrada do sistema evita repetir checagens em todas as funções internas:',
              visual: traceStepper({
                title: 'Fronteira vs Domínio',
                src: `fn apply_discount(g: Guess) -> i32 {
    // g.value() ja e 1..=100!
    g.value() * 2
}

fn main() {
    if let Ok(g) = Guess::new(40) {
        let r = apply_discount(g);
        println!("{r}");
    }
}`,
                head: ['Camada', 'Dado', 'Garantia do compilador'],
                frames: [
                  {
                    line: [7],
                    rows: [['Fronteira (main)', 'i32 cru (40)', 'Ainda pode ser qualquer i32']],
                    label: 'Passo 1: entrada bruta',
                    info: 'Na fronteira (`main`), o número `40` é apenas um `i32` comum e precisa ser validado.',
                  },
                  {
                    line: [7],
                    rows: [['Guess::new(40)', 'Ok(Guess { value: 40 })', 'Intervalo 1..=100 verificado']],
                    highlightRow: [0],
                    label: 'Passo 2: construção',
                    info: '`Guess::new(40)` checa `(1..=100).contains(&40)` uma única vez e devolve `Ok(Guess)`.',
                  },
                  {
                    line: [1, 3, 8],
                    rows: [['Domínio (apply_discount)', 'g: Guess', '1..=100 garantido pelo tipo!']],
                    highlightRow: [0],
                    label: 'Passo 3: uso sem revalidar',
                    info: '`apply_discount` recebe `Guess` e não precisa retornar `Result` nem repetir `if`: o tipo já garante a validade!',
                  },
                ],
              }),
            },
            {
              title: 'No seu computador: conta testada sem unwrap (Exercício 28)',
              body:
                'Feche a unidade com o **Exercício 28** do roteiro e a regra de ouro do Módulo 4:\n\n' +
                '• No projeto da `Conta` (`cargo new conta_testada`), implemente `Conta::new`, `depositar`, `sacar(&mut self, valor: i64) -> Result<(), ErroConta>` e `saldo(&self) -> i64`.\n' +
                '• No final do `src/main.rs`, crie o bloco `#[cfg(test)] mod tests { ... }` com pelo menos três funções `#[test]`: depósito válido (`assert_eq!(conta.saldo(), 100)`), saque válido e saque acima do saldo (`assert!(conta.sacar(1000).is_err())`).\n' +
                '• Confira que não há **nenhum** `unwrap()` ou `expect()` fora do módulo `tests`.\n\n' +
                '**Critério de pronto:** `cargo test` mostra os 3 testes passando (`test result: ok. 3 passed; 0 failed`) e `cargo clippy -- -D warnings` termina sem nenhum aviso.',
              visual: code(
                `$ cargo test
running 3 tests
test tests::deposito_ok ... ok
test tests::saque_ok ... ok
test tests::saque_sem_saldo ... ok

test result: ok. 3 passed; 0 failed
$ cargo clippy -- -D warnings`,
                [1, 7, 8],
                'Rodando a suíte nativa',
              ),
            },
          ],
          exercises: [
            mcq(
              'Na struct `pub struct Guess { value: i32 }`, por que o campo `value` **não** é marcado com `pub`?',
              [
                'Para obrigar o código externo a usar `Guess::new(v)`, impedindo a criação de um `Guess` sem passar pela validação',
                'Porque structs em Rust nunca podem ter campos públicos',
                'Porque `i32` só pode ser lido dentro de blocos `unsafe`',
                'Para fazer o compilador alocar `value` no heap em vez da pilha',
              ],
              0,
              'Se `value` fosse `pub`, qualquer módulo poderia escrever `Guess { value: -999 }` diretamente, burlando a checagem de `1..=100` feita em `Guess::new`.',
            ),
            tf(
              'Escolher o tipo `u8` (0 a 255) para guardar a idade de uma pessoa já impede valores negativos em tempo de compilação, sem precisar de validação manual para `< 0`.',
              true,
              'Tipos inteiros sem sinal (`u8`, `u16`, `u32`, `usize`) não representam números negativos; usar o tipo certo elimina classes inteiras de erros na origem.',
            ),
            mcq(
              'Se `Guess` está no módulo `game` com campo `value` privado, o que acontece ao compilar a linha 8 destacada?',
              [
                'Não compila com `E0451` (`field \'value\' of struct \'game::Guess\' is private`); é preciso chamar `game::Guess::new(500)`',
                'Compila normalmente e trunca `500` para `100`',
                'Compila, mas entra em pânico na linha 8',
                'Não compila com `E0382`, pois `500` foi movido',
              ],
              0,
              'Em Rust a privacidade vale na fronteira do módulo. Fora de `mod game`, construir `Guess { value: 500 }` diretamente gera `error[E0451]: field \'value\' of struct \'game::Guess\' is private`.',
              {
                visual: code(
                  `mod game {
    pub struct Guess {
        value: i32,
    }
}

fn main() {
    let g = game::Guess { value: 500 };
}`,
                  [3, 8],
                  'Campo privado protege a invariante',
                ),
              },
            ),
            fill(
              'Complete a implementação da trait padrão para conversões que podem falhar (Exercício 35):',
              'impl std::convert::___<&str> for Cpf {\n    type Error = &\'static str;\n    fn ___(s: &str) -> Result<Self, Self::Error> {\n        if s.len() == 11 { Ok(Cpf(s.to_string())) } else { Err("invalido") }\n    }\n}',
              ['TryFrom', 'try_from'],
              ['From', 'from', 'Into'],
              'Enquanto `From::from` é para conversões infalíveis, `TryFrom::try_from` define conversões que validam a entrada e retornam `Result<Self, Self::Error>`.',
            ),
            gen((rng) => {
              const okVal = randInt(rng, 10, 90);
              const badVal = randInt(rng, 120, 200);
              const fallback = randInt(rng, 1, 5);
              return num(
                'Qual número é impresso na tela ao testar uma entrada válida e uma fora do intervalo `1..=100`?',
                okVal + fallback,
                `\`check_guess(${okVal})\` está em \`1..=100\` e retorna \`Ok(${okVal})\`. Já \`check_guess(${badVal})\` retorna \`Err\`, que com \`unwrap_or(${fallback})\` vira \`${fallback}\`. A soma é \`${okVal} + ${fallback} = ${okVal + fallback}\`.`,
                {
                  visual: code(
                    `fn check_guess(
    v: i32,
) -> Result<i32, &'static str> {
    if !(1..=100).contains(&v) {
        return Err("fora da faixa");
    }
    Ok(v)
}

fn main() {
    let a = check_guess(${okVal})
        .unwrap_or(${fallback});
    let b = check_guess(${badVal})
        .unwrap_or(${fallback});
    println!("{}", a + b);
}`,
                    [4, 11, 13],
                    'Validando intervalo 1..=100',
                  ),
                },
              );
            }),
            match(
              'Associe cada situação à decisão de projeto recomendada em Rust:',
              [
                ['Operação que pode falhar por entrada externa', 'Retornar Result<T, E> e propagar com ?'],
                ['Regra de domínio como CPF de 11 dígitos ou nota de 0 a 100', 'Criar uma struct com campo privado e validar em new / TryFrom'],
                ['Bug interno impossível se o código estiver correto', 'Usar assert! ou panic! para detectar o defeito cedo'],
                ['Verificar comportamento da conta com cargo test', 'Escrever funções #[test] dentro de #[cfg(test)] mod tests'],
              ],
              'Combinar tipos que validam na fronteira, `Result` para falhas recuperáveis, `assert!` para invariantes internas e testes com `#[test]` forma a arquitetura de erros de Rust.',
            ),
            order(
              'Ordene o fluxo da arquitetura "validar na fronteira" ao processar um dado externo:',
              [
                'Ler o texto bruto vindo do usuário, arquivo ou rede',
                'Chamar Guess::new ou TryFrom::try_from retornando Result',
                'Tratar o caso Err na fronteira (ex.: exibir mensagem ou abortar a requisição)',
                'Passar o valor Guess já validado para as funções internas do domínio',
              ],
              'Validar uma única vez na fronteira libera todo o núcleo do programa de checagens repetidas.',
            ),
            codePuzzle(
              'Monte o método `Guess::new` que rejeita valores fora de `1..=100` com `None` e devolve `Some(Guess { value: v })` quando válido:',
              [
                'impl Guess {',
                '    pub fn new(v: i32) -> Option<Self> {',
                '        if !(1..=100).contains(&v) {',
                '            return None;',
                '        }',
                '        Some(Self { value: v })',
                '    }',
                '}',
              ],
              [
                '        Self { value: v }',
                '        if (1..=100).contains(&v) {',
              ],
              'Quando `!(1..=100).contains(&v)` é verdadeiro, `return None;` encerra cedo; caso contrário, `Some(Self { value: v })` constrói o tipo validado.',
            ),
          ],
        },
      ],
    },
  ],
};

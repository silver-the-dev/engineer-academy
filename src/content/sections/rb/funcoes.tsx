import type { UnitDef } from '../../types';
import { code, fill, gen, match, mcq, num, order, table, tf } from '../../helpers';
import { codePuzzle } from '../../codePractice';
import { randInt } from '../../../lib/random';

const callExample = `fn scale(x: i32, k: i32) -> i32 {
    x * k
}
fn main() {
    let out = scale(6, 3);
    println!("{out}");
}`;

const returnExample = `fn positive(x: i32) -> i32 {
    if x < 0 {
        return 0;
    }
    x
}
fn main() {
    println!("{}", positive(-4));
    println!("{}", positive(7));
}`;

const blockExample = `fn main() {
    let out = {
        let x = 3;
        x + 1
    };
    println!("{out}");
}`;

const unitExample = `fn report() {
    println!("Pronto");
}
fn main() {
    let out: () = report();
    println!("{out:?}");
}`;

const scopeExample = `fn main() {
    let x = 5;
    let out = {
        let x = x + 2;
        x * 3
    };
    println!("{x} {out}");
}`;

const docExample = `/// Retorna o quadrado da entrada.
/// Use valores entre -100 e 100.
pub fn square(x: i32) -> i32 {
    // Multiplica o valor por ele mesmo.
    x * x
}
fn main() {
    println!("{}", square(4));
}`;

const readExample = `use std::io;
fn main() {
    let mut text = String::new();
    match io::stdin()
        .read_line(&mut text) {
        Ok(0) => return,
        Ok(_) => {},
        Err(_) => {
            println!("Falha ao ler");
            return;
        }
    }
    println!("Lido: {}", text.trim());
}`;

const parseExample = `fn main() {
    let text = " 42\\n";
    let guess = match text.trim()
        .parse::<i32>() {
        Ok(n) => n,
        Err(_) => {
            println!("Inteiro!");
            return;
        }
    };
    let secret = 42;
    if guess == secret {
        println!("Acertou!");
    } else {
        println!("Tente de novo");
    }
}`;

export const rustFuncoes: UnitDef = {
  id: 'rb-func', title: 'Funções e expressões', icon: '🧩',
  subtitle: 'Transforme entradas em valores e monte seus primeiros programas',
  source: 'The Rust Programming Language, edição 2024: capítulos 2 e 3.3; escopo em 3.1/4.1 e documentação em 14.2. https://doc.rust-lang.org/book/ · Desafio 50 Dias — Rust, exercícios 3 e 5.',
  guide: 'Declare funções com `fn`, tipos nos parâmetros e uma seta para o tipo de retorno. A expressão final sem ponto e vírgula fornece o valor do bloco; `return` encerra a função imediatamente. Um bloco sem expressão final produz unit, escrito `()`. `let` é uma instrução; chamadas, operações e blocos podem ser expressões. Variáveis locais só existem no seu escopo; shadowing cria uma nova ligação. `///` documenta o item seguinte, e `cargo doc --open` gera sua documentação. Na entrada, `read_line` acrescenta texto a uma `String` mutável e retorna um `Result` com a contagem de bytes. `trim` remove espaços nas pontas, e `parse` tenta converter o texto. Use `match` para separar sucesso de falha. O app monta e analisa código; execute os desafios no computador, com Cargo e edição 2024.',
  extra: true,
  lessons: [
    {
      id: 'rb-func-def', title: 'Funções, parâmetros e retorno', parts: [
        {
          card: [
            {
              title: 'Uma entrada, uma transformação, uma saída',
              body: 'Uma função reúne uma tarefa que você pode chamar de novo. `fn` inicia a definição; `scale` é o nome. Os parâmetros `x` e `k` recebem tipos explícitos, separados por vírgula. A seta anuncia o retorno `i32`. A chamada fornece os argumentos na mesma ordem. O programa imprime 18, seguido de uma quebra de linha.',
              visual: code(callExample, [1, 2, 5], 'src/main.rs · função e chamada'),
              tip: 'Use snake_case nos nomes. Diferentemente dos protótipos de C, aqui a função pode aparecer antes ou depois de quem a chama, desde que esteja visível no escopo.',
            },
            {
              title: 'Siga os valores',
              body: 'O argumento vira o valor do parâmetro durante a chamada. O resultado volta para o ponto da chamada; imprimir é uma tarefa separada.',
              visual: table(['Etapa', 'Valor'], [
                ['Argumentos na chamada', '6 e 3'], ['Parâmetros na função', 'x = 6; k = 3'],
                ['Multiplicação', '18'], ['Variável out em main', '18'],
              ]),
            },
          ],
          exercises: [
            mcq('Qual palavra inicia uma definição de função em Rust?', ['fn', 'function', 'def', 'void'], 0, '`fn` inicia a definição; os parâmetros ficam entre parênteses e o corpo entre chaves.'),
            match('Associe os nomes ao papel no exemplo:', [['x e k', 'parâmetros'], ['6 e 3', 'argumentos'], ['i32 após a seta', 'tipo do retorno']], 'Parâmetros são os nomes declarados; argumentos são os valores fornecidos; o tipo após a seta descreve o valor devolvido.'),
            num('Qual número o programa imprime?', 18, '`scale` recebe 6 e 3, calcula 6 vezes 3 e devolve 18; main imprime esse retorno.', { visual: code(callExample, [2, 5, 6], 'Preveja a saída') }),
            tf('Uma função definida depois de main precisa de um protótipo como em C.', false, 'Não é necessário um protótipo separado. A definição pode vir depois de main se o nome estiver visível para a chamada.'),
            fill('Complete os papéis na definição:', 'Cada parâmetro precisa de um ___ explícito; o tipo após a seta descreve o ___.', ['tipo', 'retorno'], ['endereço', 'arquivo'], 'Rust exige o tipo de cada parâmetro na assinatura. A seta indica o tipo do valor devolvido.'),
            gen((rng) => {
              const x = randInt(rng, 2, 9); const k = randInt(rng, 2, 5);
              return num('Qual número aparece na saída?', x * k, `Os argumentos são ${x} e ${k}; o produto devolvido e impresso é ${x * k}.`, { visual: code(`fn scale(x: i32, k: i32) -> i32 {
    x * k
}
fn main() {
    println!("{}", scale(${x}, ${k}));
}`, [2, 5], 'Nova chamada') });
            }),
            mcq('O programa compila? Identifique o problema na chamada.', ['Não: o argumento é texto, mas o parâmetro é i32', 'Sim: Rust converte o texto automaticamente', 'Não: a definição precisa vir depois de main', 'Sim: a função imprime 6'], 0, 'E0308: "mismatched types", com "expected `i32`, found `&str`". O argumento é texto; substitua-o pelo inteiro 3 para imprimir 6.', { visual: code(`fn double(x: i32) -> i32 {
    x * 2
}
fn main() {
    println!("{}", double("3"));
}`, [5], 'Código com erro · E0308') }),
            codePuzzle('Monte o programa que calcula o dobro de 6, acrescenta 1 e imprime 13. O primeiro bloco já reúne a função auxiliar e a abertura de main.', [
              'fn double(x: i32) -> i32 {\n    x * 2\n}\nfn main() {',
              '    let value = double(6);',
              '    let out = value + 1;',
              '    println!("{out}");',
              '}',
            ], ['    let value = double(3);', '    let out = value - 1;'], '`double(6)` devolve 12; a próxima ligação soma 1 e a impressão mostra 13. Os blocos usam valores definidos pelos blocos anteriores.'),
          ],
        },
        {
          card: [
            {
              title: 'Retornar não é imprimir',
              body: 'A expressão final sem ponto e vírgula é o retorno implícito. `return` devolve um valor e sai da função imediatamente, útil para uma saída antecipada. A função do exemplo limita números negativos a zero: o programa imprime 0 na primeira linha e 7 na segunda. Você pode guardar um retorno sem mostrá-lo na tela.',
              visual: code(returnExample, [3, 5, 8, 9], 'Retorno antecipado e final'),
            },
            {
              title: 'No seu computador',
              body: 'Crie o projeto com `cargo new signal_functions` e entre na pasta. Implemente uma função com dois parâmetros `i32` que multiplica uma leitura por um ganho, e outra que limita negativos a zero. Em main, imprima o ganho aplicado a 6 e 3, e o limite aplicado a -4 e 7. Pronto quando `cargo run` mostrar 18, 0 e 7 em linhas separadas, `cargo fmt` formatar o projeto e `cargo clippy -- -D warnings` terminar sem avisos. Confira a edição 2024 no Cargo.toml.',
              visual: code(`fn main() {
    let reading = 6;
    let gain = 3;
    println!("{}", reading * gain);
}`, [], 'Ponto de partida · extraia funções'),
            },
          ],
          exercises: [
            mcq('O que acontece quando return é executado?', ['A função atual termina devolvendo o valor indicado', 'Somente a linha atual é pulada', 'O valor é sempre impresso', 'Todo o programa sempre termina'], 0, '`return` encerra a função em que aparece. O chamador recebe o valor; não há impressão automática.'),
            num('Qual número aparece na primeira linha de saída?', 0, 'Com -4, a condição é verdadeira. O retorno antecipado devolve 0 e a expressão final não é alcançada nessa chamada.', { visual: code(returnExample, [2, 3, 8], 'Caminho negativo') }),
            num('Qual número aparece na segunda linha de saída?', 7, 'Com 7, a condição é falsa; a execução chega à expressão final x e devolve 7.', { visual: code(returnExample, [5, 9], 'Caminho não negativo') }),
            tf('Uma função que devolve um i32 precisa executar println! dentro dela.', false, 'Devolver e imprimir são tarefas distintas. A função pode apenas calcular e retornar; main decide o que fazer com o resultado.'),
            order('Ordene o caminho de uma chamada que usa retorno antecipado:', ['O chamador fornece o argumento', 'O parâmetro recebe esse valor', 'A condição seleciona o caminho antecipado', 'return devolve o resultado ao chamador'], 'A função recebe o argumento, avalia sua condição e devolve o valor sem executar o restante do corpo.'),
            gen((rng) => {
              const n = randInt(rng, 2, 9);
              return num('Qual número o programa imprime?', n + 3, `A função devolve ${n} + 3, isto é, ${n + 3}. O chamador imprime esse número.`, { visual: code(`fn offset(x: i32) -> i32 {
    return x + 3;
}
fn main() {
    println!("{}", offset(${n}));
}`, [2], 'Retorno explícito · válido') });
            }),
            mcq('Quantas linhas o programa imprime?', ['Uma linha, contendo 10', 'Duas linhas, contendo 5 e 10', 'Nenhuma linha', 'Uma linha, contendo 5'], 0, 'A chamada não imprime: só devolve 10. O único println! está em main, depois de guardar o retorno.', { visual: code(`fn double(x: i32) -> i32 {
    x * 2
}
fn main() {
    let out = double(5);
    println!("{out}");
}`, [2, 6], 'Calcular e depois mostrar') }),
            codePuzzle('Monte o programa que chama positive com -3, soma 2 ao retorno e imprime 2.', [
              'fn positive(x: i32) -> i32 {\n    if x < 0 { return 0; }\n    x\n}\nfn main() {',
              '    let base = positive(-3);',
              '    println!("{}", base + 2);',
              '}',
            ], ['    let base = positive(3);', '    println!("{}", base - 2);'], 'O retorno antecipado produz 0 para -3. A soma posterior produz 2; somente main imprime.'),
          ],
        },
      ],
    },
    {
      id: 'rb-func-expr', title: 'Instruções × expressões', parts: [
        {
          card: [
            {
              title: 'Um bloco também calcula',
              body: '`let` é uma instrução: cria uma ligação, sem fornecer um valor para outra ligação. Soma, chamada de função e bloco são exemplos de expressões. No bloco destacado, a instrução cria `x`; a expressão final calcula 4 e fornece esse valor para `out`. O ponto e vírgula depois da chave encerra o let externo. A saída é 4.',
              visual: code(blockExample, [2, 3, 4, 5], 'O valor sai do bloco'),
            },
            {
              title: 'De dentro para fora',
              body: 'O bloco termina, mas o valor calculado por ele pode ser guardado fora. Você não precisa devolver a variável local inteira: devolve o resultado da expressão.',
              visual: table(['Momento', 'Estado'], [
                ['Dentro do bloco', 'x = 3'], ['Expressão final', '3 + 1 resulta em 4'],
                ['Fim do let externo', 'out = 4'], ['Impressão', '4'],
              ]),
            },
          ],
          exercises: [
            mcq('O que caracteriza uma expressão?', ['Ser avaliada e produzir um valor', 'Sempre imprimir uma mensagem', 'Sempre criar uma variável mutável', 'Ser necessariamente uma função inteira'], 0, 'Expressões são avaliadas e produzem um valor. Esse valor pode ser numérico, texto, unit ou outro tipo.'),
            mcq('Qual linha fornece o valor do bloco interno?', ['A linha 4, com a soma sem ponto e vírgula', 'A linha 3, que declara x', 'A linha 6, que imprime out', 'A linha 1, que abre main'], 0, 'A expressão final da linha 4 produz 4. O let da linha 3 prepara o dado; a impressão acontece depois.', { visual: code(blockExample, [3, 4, 6], 'Encontre a expressão final') }),
            num('Qual número aparece na saída?', 4, 'O bloco cria x com 3 e termina na soma 3 + 1. Seu valor é 4 e inicializa out.', { visual: code(blockExample, [4, 5], 'Bloco como expressão') }),
            tf('Toda linha dentro de um bloco precisa terminar em ponto e vírgula.', false, 'Uma expressão final sem ponto e vírgula pode fornecer o valor do bloco. Acrescentar o sinal nesse ponto descarta esse resultado.'),
            fill('Complete a diferença:', 'Uma ___ executa uma ação; uma ___ é avaliada e produz um valor.', ['instrução', 'expressão'], ['assinatura', 'biblioteca'], 'O let é uma instrução. A soma à direita de uma ligação é uma expressão e pode determinar o valor guardado.'),
            gen((rng) => {
              const n = randInt(rng, 2, 8); const d = randInt(rng, 2, 5);
              return num('Qual é o valor impresso?', n * d + 1, `Dentro do bloco, ${n} vezes ${d} mais 1 resulta em ${n * d + 1}; esse é o valor de out.`, { visual: code(`fn main() {
    let out = {
        let n = ${n};
        n * ${d} + 1
    };
    println!("{out}");
}`, [4], 'Outro bloco') });
            }),
            mcq('Por que o ponto e vírgula após a chave interna é usado?', ['Ele encerra a instrução let que cria out', 'Ele elimina o valor 4 antes da atribuição', 'Ele faz o bloco repetir', 'Ele transforma out em texto'], 0, 'A expressão final interna continua sem ponto e vírgula e produz 4. O sinal depois da chave pertence ao let externo, que guarda esse valor.', { visual: code(blockExample, [4, 5], 'Dois lugares diferentes') }),
            codePuzzle('Monte o programa que calcula 3 ao quadrado em um bloco e imprime 9.', [
              'fn main() {',
              '    let out = {',
              '        let side = 3;',
              '        side * side',
              '    };',
              '    println!("{out}");',
              '}',
            ], ['        side + side', '        side * 2'], 'O let interno cria side; a multiplicação final sem ponto e vírgula fornece 9 ao bloco. Os distratores calculam 6 e não atendem à saída pedida.'),
          ],
        },
        {
          card: [
            {
              title: 'O valor unit e o ponto e vírgula',
              body: 'Unit é o tipo escrito `()` e tem um único valor, também escrito `()`. Uma função sem tipo de retorno explícito retorna unit. Um bloco sem expressão final também produz unit. Aqui `report` imprime Pronto e retorna unit; a formatação Debug mostra esse retorno como (). A saída tem duas linhas: Pronto e ().',
              visual: code(unitExample, [1, 2, 5, 6], 'Mostrar unit com Debug'),
              tip: 'Se uma função promete i32 e termina apenas em uma instrução com ponto e vírgula, seu corpo produz (), incompatível com a promessa: E0308. O sinal não muda o tipo declarado; muda o valor produzido pelo corpo.',
            },
            {
              title: 'No seu computador',
              body: 'Adapte a classificação de notas do exercício 3 do Desafio 50 Dias: crie `cargo new expression_lab`. Receba uma nota u8 e devolva um código u8: 0 para reprovado (0 a 4), 1 para recuperação (5 a 6), 2 para aprovado (7 a 10) e 3 para nota inválida. O match é uma expressão: escolhe o primeiro padrão compatível e fornece o valor desse braço. Os intervalos com `..=` incluem os extremos; `_` cobre o restante. O exemplo imprime 2. Pronto quando main chamar a função com 4, 6, 8 e 11 e imprimir 0, 1, 2 e 3 em linhas separadas. Acrescente temporariamente ponto e vírgula após a chave do match, observe E0308 com `cargo check` e corrija. Termine com `cargo fmt` e `cargo clippy -- -D warnings` sem avisos.',
              visual: code(`fn classify(grade: u8) -> u8 {
    match grade {
        0..=4 => 0,
        5..=6 => 1,
        7..=10 => 2,
        _ => 3,
    }
}
fn main() {
    println!("{}", classify(8));
}`, [2, 7], 'Match também fornece um valor'),
            },
          ],
          exercises: [
            mcq('Qual é o tipo de retorno implícito de uma função sem seta de retorno?', ['Unit, escrito ()', 'i32', 'String', 'bool'], 0, 'Sem seta de retorno, a assinatura equivale a retornar unit. Unit é um tipo real, com um único valor.'),
            mcq('Qual é a segunda linha de saída?', ['()', 'Pronto', '0', 'out'], 0, '`report` imprime Pronto e retorna (). A segunda impressão usa Debug e mostra ().', { visual: code(unitExample, [5, 6], 'Retorno unit') }),
            match('Associe cada situação ao resultado:', [['Bloco sem expressão final', 'produz unit'], ['Expressão final numérica sem ponto e vírgula', 'fornece o número ao bloco'], ['Corpo unit onde se prometeu i32', 'incompatibilidade E0308']], 'O tipo declarado exige um valor compatível. Descartar a expressão final deixa o corpo sem o inteiro prometido.'),
            mcq('Este programa não compila. Qual mudança preserva o retorno i32 prometido?', ['Retirar o ponto e vírgula da soma', 'Retirar o argumento da chamada', 'Transformar a soma em comentário', 'Adicionar outro ponto e vírgula'], 0, 'E0308: "mismatched types", "expected `i32`, found `()`". O corpo descarta a soma e produz unit. Retire o ponto e vírgula final para devolver x + 1.', { visual: code(`fn next(x: i32) -> i32 {
    x + 1;
}
fn main() {
    println!("{}", next(4));
}`, [2], 'Erro intencional · E0308') }),
            tf('O ponto e vírgula em return com valor impede esse retorno.', false, '`return` com valor encerra a função e devolve o valor mesmo quando a instrução termina em ponto e vírgula. O caso problemático é descartar a expressão que deveria fornecer o retorno implícito.'),
            gen((rng) => {
              const n = randInt(rng, 2, 9);
              return mcq('O bloco calcula uma soma e a descarta. Qual texto Debug aparece?', ['()', String(n + 2), String(n), 'Erro de compilação'], 0, 'O ponto e vírgula descarta o valor da soma. O bloco produz unit; Debug consegue imprimi-lo como (). O código compila, embora a soma sem uso possa gerar aviso.', { visual: code(`fn main() {
    let out = {
        let n = ${n};
        n + 2;
    };
    println!("{out:?}");
}`, [4, 6], 'Valor descartado') });
            }),
            num('Depois da correção mostrada, qual número aparece?', 5, 'Agora a soma é a expressão final de next. Ela devolve 4 + 1 = 5, que main imprime.', { visual: code(`fn next(x: i32) -> i32 {
    x + 1
}
fn main() {
    println!("{}", next(4));
}`, [2], 'Retorno corrigido') }),
            codePuzzle('Monte o programa que obtém 7 do bloco, soma 1 e imprime 8.', [
              'fn main() {',
              '    let base: i32 = { 7 };',
              '    let out = base + 1;',
              '    println!("{out}");',
              '}',
            ], ['    let base: i32 = { 7; };', '    let out = base - 1;'], 'O bloco fornece 7 ao i32; a soma produz 8. O bloco com ponto e vírgula produziria (), gerando E0308: "mismatched types", pois a variável exige i32.'),
          ],
        },
      ],
    },
    {
      id: 'rb-func-escopo', title: 'Blocos, escopo e comentários de documentação', parts: [
        {
          card: [
            {
              title: 'Nomes têm uma região de validade',
              body: 'Uma ligação local fica disponível de sua declaração até o fim do bloco correspondente. Um bloco interno pode ler nomes externos. Outro let com o mesmo nome cria uma nova ligação: shadowing. No exemplo, o novo `x` começa em 7; o `x` externo continua 5. O bloco devolve 21, e a saída é 5 21.',
              visual: code(scopeExample, [2, 4, 5, 7], 'Escopo interno e externo'),
            },
            {
              title: 'Veja qual ligação está visível',
              body: 'O valor calculado atravessa o fim do bloco por meio da expressão final. O nome local não atravessa: fora do bloco, volta a valer o x externo.',
              visual: table(['Ponto', 'x visível', 'out'], [
                ['Antes do bloco interno', '5', 'ainda não inicializado'],
                ['Após o let interno', '7', 'ainda não inicializado'],
                ['Depois do bloco interno', '5', '21'],
              ]),
            },
          ],
          exercises: [
            mcq('Até onde uma ligação local criada dentro de um bloco pode ser usada?', ['Até o fim desse bloco, depois da declaração', 'Em qualquer arquivo do projeto', 'Somente na linha da declaração', 'Antes da declaração, em qualquer função'], 0, 'O escopo local começa na declaração e termina com o bloco. Blocos internos podem acessar ligações externas visíveis.'),
            num('Qual é o primeiro número impresso?', 5, 'A impressão ocorre fora do bloco interno. O x interno já saiu de escopo; o externo ainda vale 5.', { visual: code(scopeExample, [2, 4, 7], 'Qual x?') }),
            num('Qual é o segundo número impresso?', 21, 'O x interno recebe o externo mais 2: 7. A expressão final calcula 7 vezes 3 = 21, guardado em out.', { visual: code(scopeExample, [4, 5, 7], 'Valor exportado pelo bloco') }),
            tf('Shadowing em um bloco interno necessariamente altera a ligação externa.', false, 'O novo let cria outra ligação. Ao terminar o bloco interno, a ligação externa volta a estar visível com seu valor anterior.'),
            fill('Complete o raciocínio:', 'O bloco pode fornecer seu ___, mas seu nome local sai de ___.', ['valor', 'escopo'], ['arquivo', 'cargo'], 'A expressão final fornece um valor para fora; a variável local só pode ser mencionada na região em que foi declarada.'),
            gen((rng) => {
              const n = randInt(rng, 2, 7);
              return num('Qual número é impresso?', 2 * (n + 1) + n, `O x interno vale ${n + 1}, e o bloco fornece ${2 * (n + 1)}. Fora dele, x vale ${n}; a soma é ${3 * n + 2}.`, { visual: code(`fn main() {
    let x = ${n};
    let y = {
        let x = x + 1;
        x * 2
    };
    println!("{}", x + y);
}`, [4, 7], 'Siga os dois escopos') });
            }),
            mcq('O código compila? Qual é o motivo?', ['Não: temp só existe no bloco interno', 'Sim: imprime 8', 'Não: println! não aceita inteiros', 'Sim: temp é global'], 0, 'E0425: "cannot find value `temp` in this scope". A ligação terminou com o bloco. Para corrigir, imprima dentro dele ou devolva seu valor para uma ligação externa.', { visual: code(`fn main() {
    {
        let temp = 8;
    }
    println!("{temp}");
}`, [3, 5], 'Erro intencional · E0425') }),
            codePuzzle('Monte o programa que guarda fora do bloco o triplo de 4 e imprime 12.', [
              'fn main() {',
              '    let out = {',
              '        let temp = 4;',
              '        temp * 3',
              '    };',
              '    println!("{out}");',
              '}',
            ], ['        temp + 3', '    println!("{temp}");'], 'O bloco produz 12, guardado em out. Tentar imprimir temp fora do bloco geraria E0425: "cannot find value `temp` in this scope".'),
          ],
        },
        {
          card: [
            {
              title: 'Explique a intenção de quem usa a função',
              body: '`//` é comentário comum; `///` documenta o item seguinte e aceita Markdown. Descreva o que a função recebe, devolve e quais limites deve respeitar. Aqui `pub` torna a função pública, útil em bibliotecas. O comentário comum explica a implementação. Nenhum comentário imprime texto: a saída continua sendo 16. `cargo doc --open` gera e abre a documentação.',
              visual: code(docExample, [1, 2, 3, 4], 'Documentar o contrato'),
              tip: 'A descrição deve acompanhar o comportamento real. O limite pequeno deste exemplo evita overflow no quadrado; documentar um limite não o verifica automaticamente.',
            },
            {
              title: 'No seu computador',
              body: 'Crie `cargo new scope_notes`. Escreva uma função pública que recebe um i32 entre -100 e 100 e devolve seu quadrado. Acrescente `///` com descrição e intervalo aceito, e um comentário comum dentro do corpo. Use um bloco em main para calcular a entrada 4 e imprima 16. Pronto quando `cargo doc --open` mostrar a descrição da função, `cargo run` imprimir 16, e `cargo fmt` e `cargo clippy -- -D warnings` passarem. Experimente um nome local fora de seu bloco, observe E0425 e corrija antes de concluir.',
              visual: code(docExample, [1, 2, 4], 'Adicione documentação ao seu programa'),
            },
          ],
          exercises: [
            mcq('Qual marcador documenta o item que vem em seguida?', ['///', '//', '#', '--'], 0, 'Três barras iniciam um comentário de documentação externo, associado ao próximo item.'),
            match('Associe cada recurso ao papel:', [['//', 'comentário comum'], ['///', 'documentação do próximo item'], ['cargo doc --open', 'gerar e abrir documentação']], 'O comentário comum ajuda a ler a implementação. O comentário de documentação descreve o item e é processado pelo rustdoc via Cargo.'),
            num('Qual número o programa imprime?', 16, 'Os comentários não são executados. A função multiplica 4 por 4 e devolve 16.', { visual: code(docExample, [5, 8], 'Documentação não é saída') }),
            tf('Dizer na documentação que o argumento deve estar entre -100 e 100 valida esse intervalo automaticamente.', false, 'Comentários informam o contrato, mas não executam validações. O código teria de conferir o intervalo se quisesse rejeitar entradas fora dele.'),
            mcq('Qual descrição combina melhor com a função mostrada?', ['Retorna o quadrado da entrada; use valores entre -100 e 100', 'Imprime o dobro de qualquer inteiro possível', 'Lê um número do teclado', 'Muda o argumento original para zero'], 0, 'A função só calcula x vezes x; a impressão é responsabilidade de main. O limite documentado evita prometer suporte a produtos que podem exceder i32.', { visual: code(docExample, [3, 5], 'Documente o que o código faz') }),
            gen((rng) => {
              const n = randInt(rng, 2, 9);
              return num('Qual número aparece, independentemente do comentário?', n * n, `A função calcula ${n} vezes ${n} = ${n * n}. O comentário descreve o cálculo, mas não muda a execução.`, { visual: code(`/// Retorna o quadrado da entrada.
/// Use valores entre -100 e 100.
fn square(x: i32) -> i32 {
    x * x
}
fn main() {
    println!("{}", square(${n}));
}`, [1, 4, 7], 'Documentação e resultado') });
            }),
            order('Ordene a tarefa de documentar uma função já escrita:', ['Conferir o que a função recebe e devolve', 'Escrever a descrição acima do item com três barras', 'Gerar a documentação com Cargo', 'Ler a página gerada e conferir o contrato'], 'Primeiro confirme o comportamento, depois documente, gere a página e revise a correspondência entre descrição e implementação.'),
            codePuzzle('Monte o programa documentado que calcula o quadrado de 5, soma 1 ao retorno e imprime 26. O primeiro bloco mantém a documentação junto da função.', [
              '/// Retorna o quadrado da entrada.\nfn square(x: i32) -> i32 {\n    x * x\n}\nfn main() {',
              '    let base = square(5);',
              '    println!("{}", base + 1);',
              '}',
            ], ['    let base = square(4);', '    println!("{}", base - 1);'], 'A documentação fica antes da função; o corpo devolve 25. main acrescenta 1 na expressão passada à impressão e mostra 26 em uma única linha.'),
          ],
        },
      ],
    },
    {
      id: 'rb-func-io', title: 'Entrada do usuário e parse', parts: [
        {
          card: [
            {
              title: 'Do teclado para uma String',
              body: '`use` traz `std::io` para o escopo. `String::new` cria um texto vazio; `mut` permite alterá-lo. `stdin` dá acesso à entrada padrão; `read_line` acrescenta a linha ao texto recebido por empréstimo mutável. Seu Result contém `Ok` com a quantidade de bytes lidos ou `Err` com o erro. O match separa os casos. `Ok(0)` indica fim da entrada e encerra main. Digitando 12 e Enter, o programa imprime Lido: 12.',
              visual: code(readExample, [3, 4, 5, 6, 7, 8, 13], 'Entrada de uma linha'),
              tip: '`&mut` permite que read_line escreva na String existente. A quebra de linha lida também fica no texto. `trim` dá uma visão sem espaços nas pontas; não modifica a String original.',
            },
            {
              title: 'Uma linha, duas informações diferentes',
              body: 'Considere a entrada ASCII 12 seguida de LF, a quebra de linha de um byte. O valor em Ok é uma contagem de bytes, não o número digitado. Em terminais que enviam CRLF, a contagem pode incluir dois bytes de quebra de linha.',
              visual: table(['Etapa', 'Resultado'], [
                ['Antes da leitura', 'String vazia'], ['Texto após leitura com LF', '12 + quebra de linha'],
                ['Contagem em Ok', '3 bytes'], ['Visão após trim', 'texto 12, ainda não inteiro'],
              ]),
            },
          ],
          exercises: [
            mcq('Onde read_line coloca os caracteres lidos?', ['Na String passada por empréstimo mutável', 'No número guardado em Ok', 'Dentro de println!', 'Em uma variável global automática'], 0, 'A String é alterada para receber o texto. Ok carrega a quantidade de bytes acrescentados na leitura.'),
            mcq('Por que text é declarado com mut?', ['Porque read_line precisa alterar esse texto', 'Porque qualquer texto deve ser global', 'Porque mut converte texto em inteiro', 'Porque mut remove a quebra de linha'], 0, 'O método recebe um empréstimo mutável para acrescentar os caracteres à String. O texto precisa poder ser alterado.', { visual: code(readExample, [3, 4], 'Permissão para escrever') }),
            mcq('Com a entrada 12 seguida de Enter, qual linha aparece, se a leitura funcionar?', ['Lido: 12', 'Lido: 3', 'Falha ao ler', 'Lido: text'], 0, 'A String recebe os caracteres e a quebra de linha. trim remove as bordas em branco; a impressão mostra Lido: 12.', { visual: code(readExample, [13], 'Leitura e saída') }),
            tf('trim altera a String original, apagando sua quebra de linha.', false, '`trim` retorna uma visão do texto sem os espaços nas pontas. O conteúdo da String original permanece igual.'),
            match('Associe cada resultado da leitura ao significado:', [['Ok com valor positivo', 'quantidade de bytes acrescentados'], ['Ok com zero', 'fim da entrada'], ['Err', 'falha de leitura']], 'Uma leitura bem-sucedida informa a contagem de bytes. Zero indica fim da entrada; Err representa uma falha, que deve ser tratada.'),
            gen((rng) => {
              const digits = randInt(rng, 1, 4);
              const n = randInt(rng, 10 ** (digits - 1), 10 ** digits - 1);
              return num(`Considere que a entrada contém exatamente ${n} seguido de LF (um byte). Quantos bytes read_line retorna em Ok?`, digits + 1, `São ${digits} dígitos ASCII de ${n}, um byte cada, mais um byte de LF: ${digits} + 1 = ${digits + 1}. Não é o valor numérico digitado.`, { visual: code(readExample, [4, 5, 7], 'Contagem de bytes · entrada especificada') });
            }),
            mcq('Se a mesma String guardar uma linha antiga, o que acontece na próxima leitura bem-sucedida?', ['A nova linha é acrescentada ao conteúdo antigo', 'A String é sempre apagada primeiro', 'A linha antiga vira um inteiro', 'A leitura falha obrigatoriamente'], 0, '`read_line` acrescenta texto. Para cada nova tentativa, crie uma String vazia ou limpe a existente com clear antes da leitura. Isso evita juntar palpites.'),
            codePuzzle('Monte o programa que recebe 12 e Enter e imprime 12 com uma única quebra de linha. Trate fim da entrada e falha antes do caso geral de sucesso; nesses casos, encerre sem imprimir.', [
              'fn main() {',
              '    let mut s = String::new();',
              '    match std::io::stdin()',
              '        .read_line(&mut s) {',
              '        Ok(0) | Err(_) => return,',
              '        Ok(_) => print!("{s}"),',
              '    }\n}',
            ], ['    let mut s = String::from("x");', '        Ok(_) => println!("{s}"),'], 'A String começa vazia e recebe a entrada com sua quebra de linha. O padrão com barra vertical cobre fim da entrada ou erro; ele precisa vir antes do Ok geral. print! escreve o texto sem acrescentar outra quebra. println! acrescentaria uma quebra extra; começar com x faria a leitura acrescentar 12 depois desse x.'),
          ],
        },
        {
          card: [
            {
              title: 'Texto não é número: converta e trate a falha',
              body: '`parse::<i32>()` pede a conversão para inteiro com sinal de 32 bits. O retorno é Result: `Ok(n)` traz o número; `Err` informa falha. O match abaixo é uma expressão: em caso de sucesso fornece o inteiro para `guess`; em caso de falha imprime uma mensagem e sai de main. Como o texto contém 42 e a comparação confere com o segredo, a saída é Acertou!.',
              visual: code(parseExample, [3, 4, 5, 6, 9, 12], 'Uma tentativa · segredo fixo'),
              tip: 'Texto inválido e número fora do intervalo de i32 geram Err em tempo de execução; o programa continua compilando. Isso é diferente de E0308, um erro de tipos que impede a compilação.',
            },
            {
              title: 'Planeje o jogo completo',
              body: 'Aqui usamos segredo fixo 42 para focar a entrada, sem dependências externas. O capítulo 2 do livro também ensina a obter um segredo aleatório usando a crate rand; essa dependência não é necessária neste desafio. No seu programa, um loop repetirá as tentativas. `continue` passa à próxima volta e `break` encerra o loop.',
              visual: table(['Resultado', 'Próxima ação'], [
                ['Texto inválido', 'mostrar mensagem e pedir de novo'], ['Fim da entrada ou falha de leitura', 'encerrar'],
                ['Inteiro menor que 42', 'avisar: muito baixo'], ['Inteiro maior que 42', 'avisar: muito alto'],
                ['Inteiro igual a 42', 'contar, comemorar e encerrar'],
              ]),
            },
            {
              title: 'No seu computador',
              body: 'Faça o exercício 5 do Desafio 50 Dias com segredo fixo: `cargo new guessing_game`. Leia linhas dentro de um loop, criando uma String vazia em cada volta. Trate o Result da leitura e encerre em fim de entrada ou erro; use trim, parse para i32 e match. Texto inválido deve pedir de novo sem contar tentativa. Conte cada inteiro convertido, diga se está abaixo ou acima de 42 e encerre no acerto. Para até 5 tentativas válidas, mostre também Excelente!. Pronto quando as entradas abc, 20, 60, 42 produzirem aviso de inteiro, Muito baixo, Muito alto e Acertou em 3 tentativas, seguido de Excelente!. Confira também 6 tentativas válidas: não deve haver Excelente!. `cargo fmt` e `cargo clippy -- -D warnings` devem passar.',
              visual: code(`fn main() {
    let text = " 42\\n";
    match text.trim().parse::<i32>() {
        Ok(n) => println!("Lido: {n}"),
        Err(_) => println!("Inteiro!"),
    }
}`, [], 'Base de conversão · troque por stdin'),
            },
          ],
          exercises: [
            mcq('O que parse devolve antes de você tratar o resultado?', ['Um Result com sucesso ou falha', 'Sempre um i32 válido', 'Sempre uma String', 'A contagem de bytes lidos'], 0, '`parse` tenta converter. O Result contém Ok com o inteiro ou Err com o erro de conversão.'),
            mcq('Qual mensagem o programa mostra?', ['Acertou!', 'Tente de novo', 'Inteiro!', '42'], 0, 'trim remove os espaços e a quebra de linha; parse converte o texto 42 para i32. Como o segredo também é 42, a comparação escolhe Acertou!.', { visual: code(parseExample, [2, 3, 4, 12, 13], 'Uma tentativa válida') }),
            mcq('Com este texto inválido, o programa compila e o que acontece?', ['Compila e imprime Inteiro!', 'Não compila: E0308', 'Compila e imprime Lido: 0', 'Compila e imprime Lido: abc'], 0, 'O código compila. A falha acontece na conversão do conteúdo: parse retorna Err e o match imprime Inteiro!. Não há panic nem conversão automática para zero.', { visual: code(`fn main() {
    let text = "abc";
    match text.trim().parse::<i32>() {
        Ok(n) => println!("Lido: {n}"),
        Err(_) => println!("Inteiro!"),
    }
}`, [2, 5], 'Falha tratada em tempo de execução') }),
            tf('Qualquer sequência de dígitos, por mais longa que seja, cabe em i32 e terá parse bem-sucedido.', false, 'i32 tem intervalo limitado. Um texto numérico fora dele gera Err, assim como texto incompatível com o formato inteiro.'),
            order('Ordene o caminho de uma tentativa válida:', ['Ler a linha na String', 'Obter o texto sem espaços nas pontas', 'Tentar converter para i32', 'Extrair o número no braço Ok', 'Comparar o número com o segredo'], 'A leitura fornece texto. Só depois de aparar as bordas e converter com sucesso existe um número para comparar.'),
            gen((rng) => {
              const n = randInt(rng, 10, 90);
              return num('Qual é o número impresso após a conversão?', n + 1, `trim deixa o texto ${n}; parse obtém o inteiro ${n}. O braço Ok soma 1 e imprime ${n + 1}.`, { visual: code(`fn main() {
    let text = " ${n}\\n";
    match text.trim().parse::<i32>() {
        Ok(n) => println!("{}", n + 1),
        Err(_) => println!("Inteiro!"),
    }
}`, [2, 4], 'Converta antes de calcular') });
            }),
            mcq('No jogo, abc não conta; cada inteiro convertido conta. Para abc, 20, 60 e 42, quantas tentativas válidas há?', ['3 tentativas; recebe a mensagem especial', '4 tentativas; recebe a mensagem especial', '3 tentativas; não recebe a mensagem especial', '1 tentativa; só o acerto conta'], 0, 'abc gera Err e não conta. Os inteiros 20, 60 e 42 somam três tentativas válidas. Como o acerto veio em até cinco, aparece a mensagem especial do roteiro.'),
            codePuzzle('Monte o programa que converte o texto 12, soma 1 e imprime 13. A falha deve encerrar main.', [
              'fn main() {',
              '    let text = " 12\\n";',
              '    let n = match text.trim()\n        .parse::<i32>() {\n        Ok(n) => n, Err(_) => return,\n    };',
              '    println!("{}", n + 1);',
              '}',
            ], ['    let text = "abc";', '    println!("{}", n - 1);'], 'O texto aparado vira o inteiro 12 em Ok. O match fornece esse valor para n; a soma produz 13. Se parse falhasse, o braço Err terminaria main antes da soma.'),
          ],
        },
      ],
    },
  ],
};

import React from 'react';
import type { UnitDef, VisualSpec } from '../../types';
import { code, fill, gen, match, mcq, multi, num, order, tf } from '../../helpers';
import { codePuzzle } from '../../codePractice';
import { randInt } from '../../../lib/random';
import { Label, Pt, Seg } from '../../../components/plot/Plot';
import { C } from '../../../theme';

// O aluno avança para ver o estado e a decisão; não executa Rust no app.
const trace = (states: { label: string; value: string; detail: string }[]): VisualSpec => ({
  name: 'stepper',
  height: 155,
  props: {
    steps: states.length,
    view: { xMin: -0.5, xMax: states.length - 0.5, yMin: -1, yMax: 2 },
    render: (k: number) => (
      <>
        <Seg x1={0} y1={0} x2={states.length - 1} y2={0} color={C.textMuted} />
        {states.map((state, i) => <Pt key={state.label} x={i} y={0} color={i === k ? C.gold : C.textMuted} r={i === k ? 8 : 4} />)}
        <Label x={(states.length - 1) / 2} y={1.4} text={states[k].label} anchor="middle" size={17} color={C.gold} />
        <Label x={(states.length - 1) / 2} y={0.7} text={states[k].value} anchor="middle" size={16} />
      </>
    ),
    info: (k: number) => states[k].detail,
  },
});

const commandDef = `enum Command {
    Stop,
    Level(u8),
    Move { x: i32, y: i32 },
    Text(String),
}`;

const commandExample = `${commandDef}
fn main() {
    let cmd = Command::Move {
        x: 2,
        y: 5,
    };
    let value = match cmd {
        Command::Stop => 0,
        Command::Level(n) => {
            i32::from(n)
        }
        Command::Move { x, y } => x + y,
        Command::Text(s) => {
            s.len() as i32
        }
    };
    println!("{value}");
}`;

const shapeProgram = `enum Shape {
    Square(f64),
    Circle(f64),
    Rectangle(f64, f64),
}
impl Shape {
    fn area(&self) -> f64 {
        match self {
            Self::Square(s) => *s * *s,
            Self::Circle(r) => {
                std::f64::consts::PI
                    * *r * *r
            }
            Self::Rectangle(w, h) => {
                *w * *h
            }
        }
    }
}
fn main() {
    let shape = Shape::Square(3.0);
    println!("{:.1}", shape.area());
}`;

const findProgram = `fn find_name(
    names: &[String],
    target: &str,
) -> Option<usize> {
    for (i, name) in
        names.iter().enumerate()
    {
        if name == target {
            return Some(i);
        }
    }
    None
}
fn main() {
    let names = vec![
        String::from("Ana"),
    ];
    let found =
        find_name(&names, "Bia");
    println!("{found:?}");
}`;

const packetProgram = `struct Point {
    x: i32,
    y: i32,
}
enum Packet {
    Move(Point),
    Quit,
}
fn main() {
    let p = Packet::Move(Point {
        x: 4,
        y: 0,
    });
    let value = match p {
        Packet::Move(Point { x, y: 0 })
            => x,
        Packet::Move(Point { x, y })
            => x + y,
        Packet::Quit => -1,
    };
    println!("{value}");
}`;

const guardProgram = `fn main() {
    let reading = Some(12);
    let label = match reading {
        Some(n @ 10..=20)
            if n % 2 == 0 => {
                "faixa par"
            }
        Some(0 | 1) => "baixo",
        Some(_) => "outro",
        None => "ausente",
    };
    println!("{label}");
}`;

const earlyProgram = `fn show(reading: Option<i32>) {
    let Some(value) = reading else {
        println!("sem leitura");
        return;
    };
    println!("{value}");
}
fn main() {
    show(Some(8));
    show(None);
}`;

const popProgram = `fn main() {
    let mut stack = vec![1, 2, 3];
    let mut total = 0;
    while let Some(n) = stack.pop() {
        total += n;
    }
    println!("{total}");
}`;

export const rustEnums: UnitDef = {
  id: 'rt-enum',
  title: 'Enums e pattern matching',
  icon: '🎛️',
  subtitle: 'Modele alternativas e trate cada estado com segurança',
  source: 'The Rust Programming Language, edição 2024, capítulos 6 e 19: https://doc.rust-lang.org/book/ · std::option::Option: https://doc.rust-lang.org/std/option/enum.Option.html · Desafio 50 Dias — Rust, desafios 16 e 17.',
  guide: 'Um enum representa uma alternativa por vez; cada variante pode carregar dados próprios. Um bloco `impl` acrescenta comportamento. `Option<T>` distingue presença (`Some`) de ausência (`None`), inclusive quando zero é um valor válido. `match` testa braços na ordem e precisa cobrir todas as possibilidades do tipo: esquecer uma gera E0004. Padrões abrem structs, tuplas e enums; guardas acrescentam condições e `@` nomeia um valor enquanto testa seu padrão. `map` transforma o conteúdo, `unwrap_or` fornece um padrão, `ok_or` converte ausência em erro e `is_some` consulta presença. Use `if let` para um caso, `let else` para sair cedo e `while let` para repetir enquanto um padrão casar.',
  extra: true,
  lessons: [
    {
      id: 'rt-enum-def', title: 'Enums com dados', parts: [
        {
          card: [
            {
              title: 'Uma alternativa com seus próprios dados',
              body: 'Em C, uma tagged union precisa manter a etiqueta e os dados coerentes. Um enum Rust reúne essa regra no tipo: um valor tem exatamente uma variante ativa. Aqui há uma variante sem dados, uma com inteiro, uma com campos nomeados e uma com texto dono de memória. O `match` abre apenas a variante encontrada e devolve o resultado do braço escolhido. A saída é 7.',
              visual: code(commandExample, [1, 2, 3, 4, 5, 17], 'Variantes e seus dados'),
              tip: 'Os nomes antes de `::` indicam o enum. No padrão, `x` e `y` passam a nomear os campos extraídos; nenhum campo de outra variante pode ser lido por engano.',
            },
            {
              title: 'Siga a etiqueta até o resultado',
              body: 'Avance nas setas. A etiqueta escolhe o formato dos dados; só então o padrão fornece os nomes usados na conta.',
              visual: trace([
                { label: 'Entrada', value: 'mover: (2; 5)', detail: 'O comando ativo contém duas coordenadas. Não há um texto escondido nesse valor.' },
                { label: 'Variante encontrada', value: 'movimento', detail: 'O braço de movimento combina com a etiqueta. Os demais braços não executam.' },
                { label: 'Dados extraídos', value: 'x = 2; y = 5', detail: 'O padrão dá nomes aos dois campos da variante ativa.' },
                { label: 'Saída', value: '7', detail: 'O braço soma as coordenadas: 2 + 5 = 7. Esse é o valor do match.' },
              ]),
            },
          ],
          exercises: [
            mcq('Quantas variantes ficam ativas ao mesmo tempo em um único valor de enum?', ['Exatamente uma', 'Todas as declaradas', 'Sempre duas', 'Nenhuma, mesmo após construir'], 0, 'Construir o valor escolhe uma variante. Os dados guardados pertencem a essa alternativa.'),
            tf('Todas as variantes de um enum precisam carregar o mesmo número e os mesmos tipos de campos.', false, 'Cada variante tem seu próprio formato: pode não carregar dados, carregar uma tupla ou ter campos nomeados.'),
            num('Qual número este programa imprime?', 7, 'O valor é um movimento. O padrão extrai x = 2 e y = 5; esse braço devolve 2 + 5 = 7.', { visual: code(commandExample, [17, 22], 'Preveja a saída') }),
            fill('Complete a ideia: o padrão dá nomes aos dados da variante que foi encontrada.', 'Extrair campos por um padrão é ___.', ['desestruturar'], ['converter para C', 'ativar todas as variantes', 'alocar sempre no heap'], 'Desestruturar abre a estrutura do valor. Não muda sua variante nem ativa campos inexistentes.'),
            match('Associe as variantes do exemplo a seus dados:', [['Stop', 'sem campos'], ['Level', 'um inteiro de 8 bits sem sinal'], ['Move', 'duas coordenadas com nomes'], ['Text', 'uma String']], 'O formato é declarado individualmente em cada variante; o enum aceita todas essas alternativas como um único tipo.'),
            gen((rng) => {
              const n = randInt(rng, 2, 20);
              return num('Qual número sai do braço escolhido?', n + 1, `A variante ativa é Level e carrega ${n}. O padrão extrai esse inteiro e o braço soma 1: ${n + 1}.`, { visual: code(`${commandDef}
fn main() {
    let cmd = Command::Level(${n});
    let value = match cmd {
        Command::Level(n) => n + 1,
        _ => 0,
    };
    println!("{value}");
}`, [10], 'Uma leitura sorteada') });
            }),
            {
              ...codePuzzle('Monte dentro de main o trecho que imprime 10. Use o braço específico antes do curinga, que aceita qualquer variante.', [
                'let cmd = Command::Level(4);',
                'let value = match cmd {',
                '    Command::Level(n) => n + 1,',
                '    _ => 0,',
                '};',
                'let doubled = value * 2;',
                'println!("{doubled}");',
              ], ['let cmd = Command::Level("alto");', 'let doubled = value / 2;'], 'Level carrega 4. O primeiro braço devolve 5, o dobro é 10 e a impressão usa esse resultado. Se o curinga vier antes, ele devolve zero para qualquer comando.'),
              visual: code(`${commandDef}
fn main() {
    // Insira os blocos aqui.
}`, [], 'Contexto da montagem'),
            },
            mcq('Compila? O argumento destacado tem o tipo exigido pela variante?', ['Não: E0308, tipos incompatíveis', 'Sim: o texto vira inteiro', 'Não: E0004, falta um braço', 'Sim: o enum ignora o argumento'], 0, 'E0308: "mismatched types". Level exige u8, mas o argumento é &str. Corrija passando um inteiro que caiba em u8, como 3; isso é diferente de esquecer um braço de match.', { visual: code(`${commandDef}
fn main() {
    let cmd = Command::Level("alto");
    let _ = cmd;
}`, [8], 'Erro intencional: E0308') }),
          ],
        },
        {
          card: [
            {
              title: 'O enum também tem métodos',
              body: 'Um bloco `impl` pode reunir operações que fazem sentido para todas as variantes. O método `area` recebe `&self`, portanto lê a forma sem consumir sua posse. Ao casar sobre essa referência, os campos numéricos são emprestados; `*` lê cada número para a conta. `Self` é o tipo do próprio enum. Este programa imprime 9.0.',
              visual: code(shapeProgram, [6, 7, 8, 22], 'Área com impl'),
              tip: 'As áreas são lado ao quadrado, pi vezes raio ao quadrado e largura vezes altura. Acrescentar uma variante exige pensar no comportamento dela.',
            },
            {
              title: 'No seu computador',
              body: 'Desafio 16 do roteiro: crie um projeto para formas com Cargo, na edição 2024. Implemente o enum do exemplo e seu método de área. Construa e use as três variantes. Primeiro experimente adicionar o retângulo sem atualizar o match e leia E0004; depois corrija. Pronto quando o quadrado de lado 3 imprimir 9.00, o círculo de raio 1 imprimir 3.14 e o retângulo de lados 2 e 5 imprimir 10.00, uma linha por forma, com duas casas decimais. Use todas as variantes, rode a formatação e termine com clippy sem avisos.',
              visual: code(`cargo new formas --edition 2024
cd formas
cargo run
cargo fmt
cargo clippy -- -D warnings`, [], 'Terminal: depois edite src/main.rs'),
            },
          ],
          exercises: [
            mcq('Qual é o papel de um bloco impl associado a um enum?', ['Definir funções e métodos do tipo', 'Ativar todas as variantes', 'Trocar o enum por uma struct', 'Remover a checagem de tipos'], 0, 'O enum declara as alternativas; impl acrescenta comportamento, como o cálculo de área.'),
            tf('Um método que recebe &self precisa consumir a forma para calcular a área.', false, 'O recebimento por &self é um empréstimo de leitura. A forma continua pertencendo ao chamador.'),
            num('Se apenas a construção em main for trocada por um retângulo de lados 2 e 5, qual será a área numérica impressa?', 10, 'O método seleciona Rectangle e multiplica a largura pela altura: 2 × 5 = 10. Com a formatação do exemplo, a linha é 10.0.', { visual: code(shapeProgram.replace('let shape = Shape::Square(3.0);', 'let shape =\n        Shape::Rectangle(2.0, 5.0);'), [21, 22, 23], 'Mesmo método, outra variante') }),
            match('Associe a parte do método à função que ela cumpre:', [['impl', 'agrupa comportamento do tipo'], ['Self', 'nomeia o tipo deste bloco'], ['&self', 'empresta o valor para leitura'], ['area', 'nome do método de cálculo']], 'O bloco implementa comportamento para Shape. O método usa uma referência compartilhada, e Self evita repetir o nome do tipo dentro de impl.'),
            gen((rng) => {
              const side = randInt(rng, 2, 9);
              return num('Qual área numérica será impressa?', side * side, `O quadrado tem lado ${side}. O braço Square calcula ${side} × ${side} = ${side * side}; a impressão tem uma casa após o ponto.`, { visual: code(shapeProgram.replace('Shape::Square(3.0)', `Shape::Square(${side}.0)`), [9, 21], 'Lado sorteado') });
            }),
            multi('Quais escolhas mantêm a modelagem de formas coerente?', ['Guardar lado apenas no quadrado', 'Guardar raio apenas no círculo', 'Guardar dois lados no retângulo', 'Usar um número secreto para adivinhar qual campo vale'], [0, 1, 2], 'Cada variante deve carregar exatamente os dados necessários ao seu significado. O padrão revela esses dados depois de identificar a variante; uma convenção numérica externa perderia essa garantia.'),
            {
              ...codePuzzle('Com Shape e area do exemplo já definidos, monte dentro de main o trecho que imprime 32.', [
                'let side = 4.0;',
                'let shape = Shape::Square(side);',
                'let area = shape.area();',
                'let doubled = area * 2.0;',
                'println!("{doubled}");',
              ], ['let shape = Shape::Circle(side);', 'let doubled = area / 2.0;'], 'A construção depende do lado, a chamada depende da forma e o dobro depende da área. O quadrado tem área 16; o programa imprime 32. O empréstimo do método preserva a forma.'),
              visual: code(shapeProgram.replace('    let shape = Shape::Square(3.0);\n    println!("{:.1}", shape.area());', '    // Insira os blocos aqui.'), [], 'Definições disponíveis'),
            },
            mcq('O novo enum tem retângulo, mas a função só trata quadrado. O que ocorre?', ['E0004: falta cobrir a variante Rectangle', 'Compila e calcula zero para retângulos', 'E0308: dois lados nunca podem ser f64', 'Compila e usa o braço do quadrado'], 0, 'E0004: "non-exhaustive patterns". Mesmo que main use apenas Square, a função aceita qualquer Shape. Acrescente um braço para Rectangle que multiplique os dois lados.', { visual: code(`enum Shape {
    Square(f64),
    Rectangle(f64, f64),
}
fn area(shape: Shape) -> f64 {
    match shape {
        Shape::Square(s) => s * s,
    }
}
fn main() {
    println!("{}", area(
        Shape::Square(2.0)
    ));
}`, [6, 7], 'Erro intencional: E0004') }),
          ],
        },
      ],
    },
    {
      id: 'rt-enum-option', title: 'Option no lugar de null', parts: [
        {
          card: [
            {
              title: 'Ausência também faz parte do tipo',
              body: 'Um inteiro comum não aceita uma ausência implícita. Para dizer que uma busca pode falhar, devolva `Option<usize>`: `Some` guarda um índice e `None` informa que não houve resultado. O índice zero continua sendo um índice válido! `Option`, `Some` e `None` já estão disponíveis sem importação. Neste exemplo, a busca imprime None.',
              visual: code(findProgram, [4, 9, 12], 'Busca sem sentinela numérica'),
              tip: 'Rust não tem um null universal que caiba em qualquer tipo. Ponteiros crus podem ser nulos, mas são outro assunto: para ausência em código seguro, modele a possibilidade com Option. `is_some` consulta se existe conteúdo e devolve um bool.',
            },
            {
              title: 'Zero é presença, ausência é outro estado',
              body: 'Avance para comparar uma busca bem-sucedida com uma busca sem resultado. O chamador pode distinguir os casos pelo enum, sem reservar um índice especial.',
              visual: trace([
                { label: 'Lista', value: 'Ana no índice 0', detail: 'A lista tem um elemento. O primeiro índice é zero, como em um vetor C.' },
                { label: 'Busca por Ana', value: 'presente: índice 0', detail: 'O retorno é Some com conteúdo zero. Existe uma posição válida.' },
                { label: 'Busca por Bia', value: 'ausente', detail: 'O retorno é None. Não há índice para usar; a ausência precisa ser tratada.' },
              ]),
            },
          ],
          exercises: [
            mcq('Qual tipo expressa que uma busca devolve um índice ou não encontra nada?', ['Option<usize>', 'usize sem outra informação', 'bool com índice embutido', 'String obrigatória'], 0, 'Option<usize> tem duas alternativas: Some com um índice e None sem índice. O tipo usize sozinho só representa um número.'),
            tf('Some contendo zero e None representam a mesma situação.', false, 'Some com zero diz que há um valor, e esse valor é zero. None diz que nenhum valor foi encontrado.'),
            mcq('Qual é a linha de saída deste programa?', ['None', 'Some(0)', 'Some(1)', 'Bia'], 0, 'A única string guardada é Ana. Nenhuma comparação com Bia é verdadeira, então a função chega ao retorno None.', { visual: code(findProgram, [12, 19], 'Busca que não encontra') }),
            fill('Complete sem usar um número sentinela:', 'Quando não existe resultado, a variante de Option é ___.', ['None'], ['Some', 'zero', 'usize'], 'None não carrega um índice. Essa alternativa separa ausência de todos os índices válidos, incluindo zero.'),
            match('Associe os conceitos:', [['Option', 'tipo que permite presença ou ausência'], ['Some', 'variante que carrega um valor'], ['None', 'variante sem valor'], ['is_some', 'consulta de presença com resposta bool']], 'O tipo declara as duas situações, as variantes escolhem uma delas e is_some apenas consulta a etiqueta, sem extrair o conteúdo.'),
            gen((rng) => {
              const n = randInt(rng, 2, 15);
              return num('Qual número o match imprime?', n + 2, `Some guarda ${n}. O padrão extrai n e soma 2, produzindo ${n + 2}. O braço de ausência não roda.`, { visual: code(`fn main() {
    let reading = Some(${n});
    let value = match reading {
        Some(n) => n + 2,
        None => -1,
    };
    println!("{value}");
}`, [4], 'Leitura opcional sorteada') });
            }),
            codePuzzle('Monte o programa que confirma a presença do índice zero e imprime true.', [
              'fn main() {',
              '    let index = 0usize;',
              '    let found = Some(index);',
              '    let present = found.is_some();',
              '    println!("{present}");',
              '}',
            ], ['    let present = found == None;', '    let present = !found.is_some();'], 'O índice zero entra em Some. is_some vê a variante presente e devolve true, independentemente de o conteúdo ser zero. Os distratores testam ausência e devolveriam false.'),
            mcq('Este código compila? A linha destacada tenta guardar uma opção em um inteiro.', ['Não: E0308, Option e i32 são tipos diferentes', 'Sim: Some é removido automaticamente', 'Sim: o inteiro vira opcional sozinho', 'Não: E0004, falta uma variante no enum'], 0, 'E0308: "mismatched types". O destino exige i32 e a expressão é Option de inteiro. Declare o destino como Option<i32>, ou trate Some e None para produzir um i32.', { visual: code(`fn main() {
    let count: i32 = Some(3);
    println!("{count}");
}`, [2], 'Erro intencional: E0308') }),
          ],
        },
        {
          card: [
            {
              title: 'Transformar, escolher padrão e criar erro',
              body: '`map` recebe uma função curta, chamada closure: `|n|` nomeia o conteúdo e o restante calcula o novo valor. Ela só roda no caso Some; None continua None. `unwrap_or` extrai o conteúdo ou devolve o padrão fornecido, sem pânico por ausência. `ok_or` transforma Some em Ok e None em Err: é a ponte para Result, que estudaremos depois. Este programa imprime 11 e depois Err("ausente").',
              visual: code(`fn main() {
    let reading = Some(5);
    let scaled = reading.map(|n| n * 2);
    let value = scaled.unwrap_or(0) + 1;
    println!("{value}");
    let missing: Option<i32> = None;
    let out = missing.ok_or("ausente");
    println!("{out:?}");
}`, [3, 4, 7], 'Métodos que preservam a decisão'),
              tip: '`map`, `unwrap_or` e `ok_or` recebem a opção por valor; com String, isso pode mover a posse. Os inteiros destes exemplos são Copy. `is_some` recebe uma referência e só informa presença. O argumento de unwrap_or é avaliado mesmo quando existe conteúdo.',
            },
            {
              title: 'No seu computador',
              body: 'Continue o desafio 16: crie o projeto de busca e implemente a função de busca do card anterior. Com uma lista contendo Ana e Bia, imprima o retorno para Ana e para Caio: as linhas devem ser Some(0) e None. Depois transforme o índice encontrado em posição humana com map, forneça zero como padrão com unwrap_or e imprima 1 para Ana e 0 para Caio. Converta a ausência com ok_or e mostre Err("ausente"). Pronto quando essas cinco linhas aparecerem nessa ordem, sem unwrap ou expect, com formatação aplicada e clippy sem avisos.',
              visual: code(`cargo new busca --edition 2024
cd busca
cargo run
cargo fmt
cargo clippy -- -D warnings`, [], 'Terminal: implemente em src/main.rs'),
            },
          ],
          exercises: [
            mcq('Quando a função passada a map é executada em um Option?', ['Somente quando há Some', 'Somente quando há None', 'Sempre duas vezes', 'Nunca: map só consulta presença'], 0, 'map precisa de um conteúdo para aplicar a função. Some fornece esse conteúdo; para None ele devolve None sem chamar a função.'),
            num('Qual número este programa imprime?', 13, 'Some carrega 4; map calcula 4 × 3 = 12 e produz outra opção. unwrap_or extrai 12 e a soma final dá 13.', { visual: code(`fn main() {
    let raw = Some(4);
    let scaled = raw.map(|n| n * 3);
    let shown = scaled.unwrap_or(9) + 1;
    println!("{shown}");
}`, [3, 4], 'Transformação e padrão') }),
            tf('Ao receber None, map cria Some contendo zero automaticamente.', false, 'map preserva a ausência. Quem fornece um valor alternativo é uma operação como unwrap_or, com um padrão explícito.'),
            match('Associe os métodos ao resultado conceitual:', [['map', 'outra opção com conteúdo transformado'], ['unwrap_or', 'conteúdo ou valor padrão'], ['ok_or', 'Result com sucesso ou erro escolhido'], ['is_some', 'bool que indica presença']], 'map mantém o contêiner opcional; unwrap_or resolve a ausência com um valor; ok_or troca o contêiner por Result; is_some apenas consulta a variante.'),
            gen((rng) => {
              const n = randInt(rng, 2, 12);
              const factor = randInt(rng, 2, 5);
              const present = rng() < 0.5;
              const expected = present ? n * factor : -1;
              return num('Qual número será impresso?', expected, present ? `A opção contém ${n}; map multiplica por ${factor} e o padrão não é usado. Sai ${expected}.` : 'A opção é None. map não chama a função e unwrap_or escolhe o padrão -1.', { visual: code(`fn main() {
    let raw: Option<i32> = ${present ? `Some(${n})` : 'None'};
    let scaled = raw.map(|n| n * ${factor});
    let shown = scaled.unwrap_or(-1);
    println!("{shown}");
}`, [2, 3, 4], 'Presença ou ausência sorteada') });
            }),
            mcq('Qual linha é impressa após converter a ausência?', ['Err("ausente")', 'Ok(0)', 'None', 'Some("ausente")'], 0, 'ok_or transforma None em Err com o argumento fornecido. A impressão com Debug inclui a variante, os parênteses e as aspas da string.', { visual: code(`fn main() {
    let index: Option<usize> = None;
    let result = index.ok_or("ausente");
    println!("{result:?}");
}`, [3], 'Ausência passa a ser erro') }),
            codePuzzle('Monte o programa que transforma 3 em seu dobro e imprime 7 após somar 1.', [
              'fn main() {',
              '    let raw = Some(3);',
              '    let scaled = raw.map(|n| n * 2);',
              '    let value = scaled.unwrap_or(0);',
              '    let shown = value + 1;',
              '    println!("{shown}");',
              '}',
            ], ['    let scaled = raw.map(|n| n / 2);', '    let value = scaled.ok_or(0);'], 'As dependências determinam a ordem: criar a opção, transformar seu conteúdo, extrair ou usar padrão, somar e imprimir. O resultado é 3 × 2 + 1 = 7.'),
            mcq('Qual saída mostra que is_some não consome uma Option<String>?', ['true e depois Some("oi")', 'false e depois None', 'Só true: o segundo println não compila', 'Só oi, sem variante'], 0, 'is_some recebe uma referência e devolve true. A String permanece dentro da opção, que ainda pode ser lida pelo segundo println; Debug mostra Some("oi").', { visual: code(`fn main() {
    let text = Some(String::from("oi"));
    println!("{}", text.is_some());
    println!("{text:?}");
}`, [3, 4], 'Consultar sem consumir') }),
          ],
        },
      ],
    },
    {
      id: 'rt-enum-match', title: 'match exaustivo e padrões', parts: [
        {
          card: [
            {
              title: 'Abrir cada camada e cobrir cada caso',
              body: 'Um padrão pode entrar no enum e depois na struct que ele carrega. O primeiro braço exige uma coordenada vertical zero e extrai a horizontal; o segundo aceita os demais movimentos. O terceiro cobre a saída. Só o primeiro braço compatível executa, então o exemplo imprime 4. E0004 aparece se algum caso possível do tipo ficar sem cobertura.',
              visual: code(packetProgram, [15, 17, 19], 'Enum contendo struct'),
              tip: 'Os nomes criados por padrões têm seu próprio escopo e podem esconder nomes externos. Você também encontrará `ref` e `ref mut` em padrões para criar empréstimos; aqui basta conhecer os nomes. Ao casar sobre &valor ou &mut valor, Rust já ajusta os empréstimos em muitos casos.',
            },
            {
              title: 'Tuplas também se abrem por padrão',
              body: 'Os parênteses descrevem a posição de cada campo. Aqui o padrão abre uma opção e uma tupla dentro dela. O curinga final cobre todas as alternativas restantes. O programa imprime 6.',
              visual: code(`fn main() {
    let reading = Some((6, 0));
    let value = match reading {
        Some((x, 0)) => x,
        _ => -1,
    };
    println!("{value}");
}`, [4], 'Enum contendo tupla'),
            },
            {
              title: 'Por que o primeiro braço vence?',
              body: 'Avance para observar o teste das camadas. A segunda regra também aceitaria esse movimento, mas não é alcançada.',
              visual: trace([
                { label: 'Etiqueta', value: 'movimento', detail: 'A variante de movimento contém uma struct com duas coordenadas.' },
                { label: 'Teste do campo', value: 'vertical = 0', detail: 'O primeiro padrão exige zero no campo vertical, exatamente o valor guardado.' },
                { label: 'Vínculo e saída', value: 'horizontal = 4', detail: 'A coordenada horizontal vira x no braço escolhido. O match devolve 4 e termina, sem executar o segundo braço.' },
              ]),
            },
          ],
          exercises: [
            mcq('O que significa um match ser exaustivo?', ['Cobrir todo valor possível do tipo', 'Executar todos os braços', 'Ter exatamente três braços', 'Usar apenas números inteiros'], 0, 'Exaustividade exige que qualquer valor permitido pelo tipo encontre um braço. Não exige executar mais de um braço nem ter uma quantidade fixa deles.'),
            num('Qual número o programa imprime?', 4, 'O valor é Move com x = 4 e y = 0. O primeiro padrão combina, vincula x a 4 e devolve 4. O braço seguinte não executa.', { visual: code(packetProgram, [15, 16], 'Padrão dentro de padrão') }),
            tf('Se dois braços combinam com um valor, ambos executam, como um switch C sem break.', false, 'match escolhe apenas o primeiro braço compatível. Não há queda automática de um braço para o seguinte.'),
            fill('Complete o papel do curinga:', 'O curinga aceita qualquer valor e não cria um novo ___.', ['nome para o conteúdo'], ['caso possível', 'tipo numérico', 'enum'], 'O curinga cobre o caso sem vincular seu conteúdo a um nome; use um nome no padrão se precisar do valor no corpo do braço.'),
            match('Associe cada camada do exemplo ao que o padrão revela:', [['Packet', 'qual alternativa da mensagem está ativa'], ['Point', 'os campos da struct interna'], ['Tupla', 'os campos por posição'], ['Curinga', 'qualquer valor ainda não escolhido']], 'Você pode combinar essas camadas: primeiro a variante, depois o formato interno e então literais ou nomes nos campos.'),
            gen((rng) => {
              const x = randInt(rng, 2, 12);
              const y = randInt(rng, 0, 1);
              return num('Qual número sai deste match de tupla?', y === 0 ? x : -1, y === 0 ? `A segunda posição é zero. O primeiro padrão combina e extrai ${x}.` : 'A segunda posição é 1, não zero. O primeiro padrão falha e o curinga devolve -1.', { visual: code(`fn main() {
    let point = (${x}, ${y});
    let value = match point {
        (x, 0) => x,
        _ => -1,
    };
    println!("{value}");
}`, [4, 5], 'Coordenadas sorteadas') });
            }),
            codePuzzle('Monte o programa que extrai a coordenada horizontal de um ponto sobre o eixo e imprime 3.', [
              'fn main() {',
              '    let point = (3, 0);',
              '    let value = match point {',
              '        (x, 0) => x,',
              '        _ => -1,',
              '    };',
              '    println!("{value}");',
              '}',
            ], ['        (0, y) => y,', '    let point = (3, 1);'], 'A tupla é criada antes do match. O braço específico precisa preceder o curinga: ele reconhece a segunda coordenada zero e retorna a primeira, 3.'),
            mcq('Por que este match não compila mesmo que a variável esteja inicializada com Some?', ['E0004: None ainda pertence ao tipo', 'E0308: Some não aceita inteiros', 'E0004: faltam todos os inteiros positivos', 'Compila: a inicialização dispensa exaustividade'], 0, 'E0004: "non-exhaustive patterns". O tipo examinado é Option<i32>, e None é uma possibilidade desse tipo. Acrescente um braço para None ou um curinga; o corpo de Some já aceita qualquer inteiro.', { visual: code(`fn main() {
    let reading: Option<i32> = Some(3);
    let value = match reading {
        Some(n) => n,
    };
    println!("{value}");
}`, [3, 4], 'Erro intencional: E0004') }),
          ],
        },
        {
          card: [
            {
              title: 'Condição extra e nome para a faixa',
              body: 'Uma guarda é o `if` depois do padrão: o braço só vale se a estrutura e a condição combinarem. `@` guarda o número em um nome enquanto exige que ele pertença à faixa inclusiva. O operador `|` oferece padrões alternativos. O exemplo imprime faixa par: 12 está entre 10 e 20 e é par. Mantenha braços sem guarda para cobrir o restante, pois guardas não comprovam exaustividade.',
              visual: code(guardProgram, [4, 5, 8, 9], 'Faixas, guardas e @'),
            },
            {
              title: 'No seu computador',
              body: 'Desafio 17: crie StatusPedido com variantes para pendente, enviado com código de rastreio em String e entregue. Use um match que desestruture o código e uma guarda que exija texto não vazio. Mostre pendente, enviado com AB123, enviado com texto vazio e entregue. Pronto quando as linhas forem pendente, rastreio: AB123, rastreio ausente e entregue, nessa ordem. Faça ainda uma função que classifique um número opcional com uma faixa ligada por @ e uma guarda de paridade; confira os casos 12, 13 e ausência. Use todas as variantes e termine com clippy sem avisos.',
              visual: code(`cargo new pedidos --edition 2024
cd pedidos
cargo run
cargo fmt
cargo clippy -- -D warnings`, [], 'Terminal: adapte o desafio 17'),
            },
          ],
          exercises: [
            mcq('Para que serve @ em um padrão com faixa?', ['Dar um nome ao valor que também deve passar pelo padrão', 'Buscar um endereço de memória', 'Repetir o braço várias vezes', 'Converter o enum em inteiro'], 0, 'O vínculo com @ permite usar o valor inteiro no corpo ou na guarda enquanto outro padrão restringe quais valores combinam.'),
            num('Qual número é impresso?', 10, 'Cinco pertence à faixa inclusiva de 3 a 8. O vínculo captura esse mesmo número em n e o braço devolve 5 × 2 = 10.', { visual: code(`fn main() {
    let reading = 5;
    let value = match reading {
        n @ 3..=8 => n * 2,
        _ => 0,
    };
    println!("{value}");
}`, [4], 'Capturar e restringir') }),
            tf('Uma guarda que parece verdadeira para os dados do exemplo dispensa os casos restantes do tipo.', false, 'A checagem de cobertura não assume que a guarda sempre será verdadeira. Acrescente braços sem guarda para os valores que ela pode rejeitar.'),
            mcq('Qual texto aparece?', ['pequeno', 'grande', 'ausente', 'Os três textos'], 0, 'Some permite extrair 3, mas a guarda exige um número maior que 10 e falha. O próximo braço Some sem guarda aceita o valor e imprime pequeno.', { visual: code(`fn main() {
    let reading = Some(3);
    let label = match reading {
        Some(n) if n > 10 => "grande",
        Some(_) => "pequeno",
        None => "ausente",
    };
    println!("{label}");
}`, [4, 5], 'A guarda pode rejeitar') }),
            gen((rng) => {
              const n = randInt(rng, 2, 15);
              const accepted = n >= 5 && n <= 10 && n % 2 === 0;
              const expected = accepted ? n + 1 : n - 1;
              return num('Qual número será impresso?', expected, accepted ? `${n} está na faixa de 5 a 10 e é par. O primeiro braço soma 1 e devolve ${expected}.` : `${n} falha na faixa ou na paridade. O segundo braço captura o conteúdo de Some e subtrai 1, devolvendo ${expected}.`, { visual: code(`fn main() {
    let reading = Some(${n});
    let value = match reading {
        Some(n @ 5..=10)
            if n % 2 == 0 => n + 1,
        Some(n) => n - 1,
        None => 0,
    };
    println!("{value}");
}`, [4, 5, 6], 'Faixa e paridade sorteadas') });
            }),
            match('Associe os recursos do padrão:', [['Guarda', 'condição booleana adicional'], ['@', 'captura o valor e testa outro padrão'], ['|', 'alternativas de padrão'], ['Faixa inclusiva', 'aceita também os dois limites']], 'Uma guarda usa if; @ mantém um vínculo; | combina alternativas; a faixa inclusiva aceita seus extremos. No exemplo, None tem seu próprio braço, sem guarda.'),
            codePuzzle('Monte o programa que captura 6 na faixa inclusiva e imprime 12. A faixa precisa vir antes do curinga.', [
              'fn main() {',
              '    let reading = 6;',
              '    let value = match reading {',
              '        n @ 3..=8 => n * 2,',
              '        _ => 0,',
              '    };',
              '    println!("{value}");',
              '}',
            ], ['        n @ 3..=5 => n * 2,', '        n @ 3..=8 => n / 2,'], 'Seis pertence à faixa de 3 a 8. O padrão captura n = 6 e o braço calcula 12; o curinga cobre tudo que sobra. Com o curinga antes, sairia zero.'),
            mcq('Por que a guarda e o braço None ainda deixam um erro?', ['E0004: falta Some rejeitado pela guarda', 'E0308: guardas não aceitam comparações', 'Compila: Some sempre é maior que 10', 'Compila: None cobre todos os Some restantes'], 0, 'E0004: "non-exhaustive patterns". A guarda não cobre Some de modo incondicional. Valores como Some(3) ficam sem braço. Acrescente um Some sem guarda ou um curinga depois do braço condicionado.', { visual: code(`fn main() {
    let reading = Some(12);
    let value = match reading {
        Some(n) if n > 10 => n,
        None => 0,
    };
    println!("{value}");
}`, [4, 5], 'Erro intencional: E0004') }),
          ],
        },
      ],
    },
    {
      id: 'rt-enum-iflet', title: 'if let, let else e while let', parts: [
        {
          card: [
            {
              title: 'Um caso interessante ou uma saída antecipada',
              body: '`if let` executa um bloco quando o padrão combina e permite um else para os demais casos; ele não exige enumerar todas as variantes. `let else` deixa os nomes do caso bem-sucedido disponíveis depois da instrução. Seu else precisa sair daquele caminho, por exemplo com return; ele não pode simplesmente produzir um valor e continuar. O exemplo imprime 8 e depois sem leitura, em duas linhas.',
              visual: code(earlyProgram, [2, 4, 6], 'Continuar somente com conteúdo'),
              tip: 'O ponto e vírgula depois do bloco else termina a declaração. O vínculo value só existe depois dela porque o caminho sem conteúdo já saiu da função.',
            },
            {
              title: 'Tratar um caso sem mover a String',
              body: 'Aqui o padrão é aplicado a uma referência à opção. O texto é emprestado para a impressão; a opção continua disponível depois do if let. A saída tem oi na primeira linha e true na segunda.',
              visual: code(`fn main() {
    let text = Some(String::from("oi"));
    if let Some(word) = &text {
        println!("{word}");
    }
    println!("{}", text.is_some());
}`, [3, 6], 'Só o caso presente interessa'),
            },
            {
              title: 'Veja o caminho curto',
              body: 'Avance para acompanhar a chamada sem leitura. Ela volta antes de chegar à impressão do valor.',
              visual: trace([
                { label: 'Entrada', value: 'ausente', detail: 'A função recebe None, sem inteiro para vincular.' },
                { label: 'Teste do padrão', value: 'não combina', detail: 'O padrão pede Some. Como não encontrou, a execução entra no else.' },
                { label: 'Saída antecipada', value: 'sem leitura', detail: 'A função imprime a mensagem e retorna. Nenhum acesso a um conteúdo ausente ocorre.' },
              ]),
            },
          ],
          exercises: [
            mcq('Quando if let é uma escolha direta?', ['Quando só um padrão exige ação especial', 'Quando todos os braços devem executar', 'Quando é preciso desligar os tipos', 'Quando ausência deve causar pânico'], 0, 'if let concentra o fluxo em um padrão. Se ele não combinar, o bloco é pulado ou o else é executado, quando existe.'),
            num('Qual número este programa imprime?', 10, 'O padrão Some encontra o conteúdo 9 e o nomeia value dentro do bloco. A impressão soma 1 e mostra 10.', { visual: code(`fn main() {
    let reading = Some(9);
    if let Some(value) = reading {
        println!("{}", value + 1);
    }
}`, [3, 4], 'Um único caso') }),
            tf('Depois de um let else bem-sucedido, o nome criado pelo padrão pode ser usado no restante do mesmo escopo.', true, 'O padrão garantiu a existência dos dados. Se falhar, o else deve desviar o fluxo; por isso o nome é válido depois da declaração.'),
            fill('Complete a ideia sobre o caminho de falha:', 'No let else dentro de uma função, return permite ___ imediatamente.', ['sair da função'], ['tentar o mesmo padrão para sempre', 'inventar o conteúdo ausente', 'executar todos os braços'], 'return encerra a chamada. Isso impede que o fluxo continue em um ponto onde o nome exigido pelo padrão não foi criado.'),
            gen((rng) => {
              const n = randInt(rng, 2, 15);
              const present = rng() < 0.5;
              return num('Qual número aparece nesta única linha de saída?', present ? n * 2 : -1, present ? `O padrão encontra Some com ${n}; o else é pulado e a última impressão mostra ${n * 2}.` : 'O padrão falha. O else imprime -1 e return encerra main; a impressão do dobro não acontece.', { visual: code(`fn main() {
    let reading: Option<i32> = ${present ? `Some(${n})` : 'None'};
    let Some(value) = reading else {
        println!("-1");
        return;
    };
    println!("{}", value * 2);
}`, [3, 5, 7], 'Caminho sorteado') });
            }),
            mcq('O que impede este let else de compilar?', ['E0308: o else pode continuar em vez de desviar o fluxo', 'E0004: if let exige todos os casos', 'Compila e usa zero como conteúdo', 'E0308: Some não aceita o número 5'], 0, 'E0308: "`else` clause of `let...else` does not diverge". O bloco devolve um inteiro, mas deveria encerrar esse caminho. Troque o zero por return; para escolher um valor padrão e continuar, use match ou unwrap_or.', { visual: code(`fn main() {
    let reading = Some(5);
    let Some(value) = reading else {
        0
    };
    println!("{value}");
}`, [4], 'Erro intencional: E0308') }),
            codePuzzle('Monte o programa que sai cedo se não houver leitura e, com a leitura fornecida, imprime 5.', [
              'fn main() {',
              '    let reading = Some(4);',
              '    let Some(value) = reading else {',
              '        return;',
              '    };',
              '    let shown = value + 1;',
              '    println!("{shown}");',
              '}',
            ], ['        0', '    let shown = value - 1;'], 'Some contém 4, então o vínculo value fica disponível e a soma imprime 5. O else contém return para não continuar sem esse vínculo caso a entrada seja None.'),
            mcq('Por que a segunda impressão ainda pode consultar text?', ['O padrão empresta o conteúdo por usar &text', 'is_some recria a String depois de movida', 'if let nunca pode mover nenhum valor', 'String sempre é Copy'], 0, 'O valor examinado é uma referência compartilhada à opção. O padrão empresta o conteúdo; não há transferência da String para word. Por isso o programa imprime oi e depois true.', { visual: code(`fn main() {
    let text = Some(String::from("oi"));
    if let Some(word) = &text {
        println!("{word}");
    }
    println!("{}", text.is_some());
}`, [3, 6], 'Padrão sobre referência') }),
          ],
        },
        {
          card: [
            {
              title: 'Repetir enquanto houver conteúdo',
              body: '`Vec::pop` remove o último elemento e devolve Some com ele; se o vetor estiver vazio, devolve None. `while let` repete enquanto o retorno combina com o padrão. A expressão é reavaliada em cada teste: neste exemplo saem 3, depois 2, depois 1, e a soma impressa é 6. A primeira tentativa que devolve None encerra o laço.',
              visual: code(popProgram, [4, 5], 'Consumindo uma pilha'),
              tip: 'O corpo deve fazer o processo avançar. Aqui pop já remove um elemento em cada teste. Um laço que sempre volta a examinar o mesmo Some pode nunca terminar.',
            },
            {
              title: 'A pilha diminui a cada teste',
              body: 'Avance e acompanhe simultaneamente a pilha restante e o total acumulado.',
              visual: trace([
                { label: 'Inicial', value: 'pilha: 1; 2; 3', detail: 'O topo é o último elemento, 3. O total começa em zero.' },
                { label: 'Primeira remoção', value: 'pilha: 1; 2', detail: 'pop devolve Some com 3. O corpo soma 3 ao total, que passa a 3.' },
                { label: 'Segunda remoção', value: 'pilha: 1', detail: 'pop devolve Some com 2. O total passa de 3 para 5.' },
                { label: 'Terceira remoção', value: 'pilha vazia', detail: 'pop devolve Some com 1. O total chega a 6; o corpo ainda executa nessa remoção.' },
                { label: 'Próximo teste', value: 'ausência: parar', detail: 'Só agora pop devolve None. O corpo não executa e a impressão final mostra 6.' },
              ]),
            },
            {
              title: 'No seu computador',
              body: 'Estenda o desafio 17 com uma pilha de códigos de rastreio: insira AB123 e CD456 em um Vec de strings. Use if let sobre uma referência ao último código para mostrá-lo sem removê-lo. Faça uma função com let else que imprima sem código para uma opção ausente e retorne cedo. Por fim, esvazie a pilha com while let e pop. Pronto quando a saída tiver CD456, sem código, CD456 e AB123, uma linha por vez; confirme que uma pilha inicialmente vazia não imprime nenhum código no laço. Rode Cargo, formate e termine com clippy sem avisos, sem unwrap ou expect.',
              visual: code(`cargo new rastreio --edition 2024
cd rastreio
cargo run
cargo fmt
cargo clippy -- -D warnings`, [], 'Terminal: consolide os três fluxos'),
            },
          ],
          exercises: [
            mcq('Quando while let encerra o laço que usa pop?', ['Quando pop retorna None', 'Antes da primeira remoção sempre', 'Ao encontrar o número zero', 'Somente depois de um pânico'], 0, 'O padrão Some só combina quando houve um elemento removido. Ao receber None, o teste falha e o corpo não executa nessa tentativa.'),
            mcq('Em que ordem os números são impressos, uma linha por número?', ['3, depois 2, depois 1', '1, depois 2, depois 3', 'Apenas 3', '6 em uma linha'], 0, 'pop remove o último elemento: primeiro 3, depois 2, depois 1. O teste seguinte retorna None e encerra o laço.', { visual: code(`fn main() {
    let mut stack = vec![1, 2, 3];
    while let Some(n) = stack.pop() {
        println!("{n}");
    }
}`, [3, 4], 'Ordem da pilha') }),
            tf('Se a pilha começar vazia, o corpo do while let com pop não executa nenhuma vez.', true, 'O primeiro pop já devolve None. Como o padrão exige Some, o teste inicial falha e não se entra no corpo.'),
            fill('Complete o comportamento de pop:', 'Em um Vec não vazio, pop remove o elemento ___.', ['do fim'], ['do começo', 'de índice aleatório', 'sem alterar o vetor'], 'Vec funciona como pilha quando combinamos push e pop: o último elemento inserido é o primeiro removido.'),
            gen((rng) => {
              const n = randInt(rng, 3, 10);
              const expected = n * (n + 1) / 2;
              return num('Qual total será impresso ao esvaziar a pilha?', expected, `A pilha contém os inteiros de 1 até ${n}. pop os visita do fim para o começo, mas a soma é a mesma: ${n} × ${n + 1} ÷ 2 = ${expected}.`, { visual: code(`fn main() {
    let mut stack: Vec<i32> =
        (1..=${n}).collect();
    let mut total = 0;
    while let Some(n) = stack.pop() {
        total += n;
    }
    println!("{total}");
}`, [3, 5, 6], 'Tamanho sorteado') });
            }),
            order('Ordene as etapas de uma execução completa com uma pilha não vazia:', ['Retirar o último elemento com pop', 'Combinar Some e somar o conteúdo', 'Repetir testes e somas até remover o último', 'Fazer o teste que devolve None', 'Continuar depois do laço'], 'Cada teste remove um elemento. O último elemento ainda chega em Some e seu corpo executa; só a tentativa seguinte devolve None e permite sair.'),
            {
              ...codePuzzle('Monte dentro de main o trecho que soma a pilha e imprime o dobro, 14. A primeira remoção inicializa o acumulador.', [
                'let mut stack = vec![2, 5];',
                'let mut sum = stack.pop().unwrap_or(0);',
                'while let Some(value) = stack.pop() {',
                '    sum += value;',
                '}',
                'let shown = sum * 2;',
                'println!("{shown}");',
              ], ['let sum = stack.pop().unwrap_or(0);', '    sum = value;'], 'A primeira remoção retira 5 e inicializa sum. O laço remove 2 e soma, chegando a 7. O próximo teste recebe None; o dobro impresso é 14. sum precisa de mut para acumular.'),
              visual: code(`fn main() {
    // Insira os blocos aqui.
}`, [], 'Trecho dentro de main'),
            },
            mcq('Você quer ignorar uma ausência isolada, voltar da função se faltar entrada e consumir uma pilha até acabar. Qual sequência de ferramentas é adequada?', ['if let; let else com return; while let', 'while let para os três casos, sempre', 'let else sem desvio para todos os casos', 'match sem braço para ausência em todos'], 0, 'if let trata um padrão sem exigir ação para o resto. let else deixa o caminho bem-sucedido seguir e sai cedo no caso inválido. while let repete o processo enquanto o padrão continua combinando.'),
          ],
        },
      ],
    },
  ],
};

import React from 'react';
import type { UnitDef, VisualSpec } from '../../types';
import { code, fill, gen, match, mcq, num, order, table, tf } from '../../helpers';
import { codePuzzle } from '../../codePractice';
import { randInt } from '../../../lib/random';
import { TableView } from '../../../components/visuals/Misc';

// Cada passo troca o estado inteiro da tabela; o aluno controla o avanço.
const trace = (
  head: string[],
  states: (string | number)[][][],
  notes: string[],
): VisualSpec => ({
  name: 'stepper',
  props: {
    steps: states.length,
    render: (k: number, width: number) => (
      <TableView width={width} head={head} rows={states[k]} />
    ),
    info: (k: number) => notes[k],
  },
});

const identity = `fn identity<T>(value: T) -> T {
    value
}`;

const first = `fn first<T>(list: &[T]) -> Option<&T> {
    list.first()
}`;

const slot = `struct Slot<T> {
    value: T,
}
impl<T> Slot<T> {
    fn get(&self) -> &T {
        &self.value
    }
}
impl Slot<i32> {
    fn doubled(&self) -> i32 {
        self.value * 2
    }
}`;

const largest = `fn largest<T: PartialOrd>(
    list: &[T],
) -> Option<&T> {
    let mut best = list.first()?;
    for item in &list[1..] {
        if item > best {
            best = item;
        }
    }
    Some(best)
}`;

const report = `use std::fmt::Display;
fn report<T>(value: &T, limit: &T)
where
    T: Display + PartialOrd,
{
    println!("{value}");
    println!("{}", value > limit);
}`;

const echo = `use std::fmt::Display;
fn echo<T: Display>(value: T) {
    println!("{value}");
}`;

export const rustGenerics: UnitDef = {
  id: 'rt-gen',
  title: 'Generics',
  icon: '🧪',
  subtitle: 'Um algoritmo, vários tipos, regras explícitas',
  source: 'The Rust Programming Language, edição 2024, cap. 10.1 e bounds do cap. 10.2: https://doc.rust-lang.org/book/ch10-01-syntax.html · https://doc.rust-lang.org/book/ch10-02-traits.html · Desafio 50 Dias — Rust, módulo 5, exercícios 33 e 34.',
  guide: 'Generics substituem tipos concretos por parâmetros de tipo, preservando a verificação estática. Cada T representa um mesmo tipo em uma instanciação; T e U podem ser diferentes. O turbofish explicita os tipos na chamada quando necessário. Um bound declara as operações disponíveis: PartialOrd permite comparações de ordem, Display permite formatação com chaves e Clone permite clonar. A cláusula where organiza essas exigências. Um impl genérico atende todos os tipos permitidos; um impl de tipo concreto acrescenta métodos só àquele tipo. A monomorfização resolve os tipos na compilação e evita despacho dinâmico introduzido pelos generics; mais instanciações podem aumentar tempo de compilação e tamanho do binário. Isso não elimina custos do próprio algoritmo, de alocações ou de clones.',
  extra: true,
  lessons: [
    {
      id: 'rt-gen-fn',
      title: 'Funções genéricas',
      parts: [
        {
          card: [
            {
              title: 'Do código duplicado ao parâmetro de tipo',
              body: 'As duas primeiras funções fazem a mesma coisa: recebem um valor e o devolvem. A terceira troca o tipo concreto por `T`, declarado depois do nome. `T` é um tipo, enquanto `value` é um valor. A mesma definição passa a servir para inteiros, textos e outros tipos, sem perder a checagem do compilador.',
              visual: code(`fn keep_i32(value: i32) -> i32 {
    value
}
fn keep_char(value: char) -> char {
    value
}
${identity}
fn main() {
    println!("{}", keep_i32(4));
    println!("{}", keep_char('R'));
    println!("{}", identity(4));
    println!("{}", identity('R'));
}`, [7, 8], 'Uma definição substitui duas'),
              tip: 'Diferente de um ponteiro genérico de C, o parâmetro de tipo conserva a informação de tipo. Não é preciso converter um ponteiro manualmente.',
            },
            {
              title: 'Veja os tipos serem preenchidos',
              body: 'Avance para separar a definição genérica das duas chamadas. Cada chamada escolhe um tipo concreto; o tipo não muda enquanto aquela chamada executa.',
              visual: trace(['Etapa', 'Tipo de entrada e retorno'], [
                [['Definição', 'T ainda é parâmetro']],
                [['Entrada inteira', 'i32 → i32']],
                [['Entrada caractere', 'char → char']],
              ], [
                'O corpo só devolve value, então não precisa de operação extra sobre T.',
                'O inteiro sem outra restrição assume i32 neste programa.',
                'O literal entre aspas simples determina char nesta chamada.',
              ]),
            },
          ],
          exercises: [
            mcq('O que o parâmetro T representa?', ['Um tipo escolhido para a chamada', 'Um contador global', 'Um valor sorteado ao executar', 'Um ponteiro sem tipo'], 0,
              'T é um parâmetro de tipo. Na chamada, a inferência ou uma anotação determina qual tipo concreto ocupa esse lugar.'),
            tf('Duas chamadas da mesma função genérica podem usar tipos concretos diferentes.', true,
              'Cada chamada é verificada com sua própria escolha de tipo; uma chamada com i32 não obriga outra chamada a usar i32.'),
            num('Qual número aparece na saída?', 12,
              'O argumento vale 12. identity devolve esse mesmo valor, e a variável n é impressa sem transformação.',
              { visual: code(`${identity}
fn main() {
    let n = identity(12);
    println!("{n}");
}`) }),
            fill('Complete a distinção:', 'T é um ___; value é um ___.', ['tipo', 'valor'], ['laço', 'arquivo'],
              'O parâmetro T descreve a categoria dos dados. O parâmetro value recebe um dado dessa categoria.'),
            match('Relacione cada papel à descrição:', [
              ['Parâmetro de tipo', 'Escolhe a categoria dos dados'],
              ['Parâmetro de valor', 'Recebe o dado da chamada'],
              ['Tipo de retorno', 'Restringe o resultado da função'],
            ], 'Tipo e valor têm papéis diferentes: T descreve, value transporta o dado, e o retorno precisa respeitar o tipo declarado.'),
            gen((rng) => {
              const n = randInt(rng, 3, 90);
              return num('Qual número este programa imprime?', n,
                `identity recebe ${n} e o devolve sem alteração; por isso a saída é ${n}.`,
                { visual: code(`${identity}
fn main() {
    let n = identity(${n});
    println!("{n}");
}`) });
            }),
            mcq('Esta chamada compila?', ['Não: o argumento tem tipo diferente do exigido', 'Sim: o texto vira número automaticamente', 'Não: generics proíbem inteiros', 'Sim: T muda durante a chamada'], 0,
              'E0308: “mismatched types”. O turbofish fixa T como u8, mas o argumento é &str. Passe um número u8 ou use &str como tipo, mantendo argumento e retorno coerentes.',
              { visual: code(`${identity}
fn main() {
    let n = identity::<u8>("3");
    println!("{n}");
}`, [5], 'Não compila: tipos incompatíveis') }),
            codePuzzle('Monte para imprimir 8. Coloque a definição genérica antes de main e use o turbofish para fixar i32.', [
              'fn identity<T>(x: T) -> T { x',
              '} fn main() {',
              '    let n = identity::<i32>(8);',
              '    println!("{n}");',
              '}',
            ], [
              '    let n = identity::<i32>("8");',
              'fn identity<T>(x: T) -> T { x;',
            ], 'A definição vem primeiro conforme o pedido. A chamada fixa i32 e recebe 8, então a impressão mostra 8. O argumento textual causa E0308 (“mismatched types”). No corpo da função, x com ponto e vírgula também causa E0308: o bloco devolve (), mas o retorno declarado é T.'),
          ],
        },
        {
          card: [
            {
              title: 'Inferência, turbofish e ausência de dados',
              body: 'Na chamada, a sintaxe com dois-pontos duplos e ângulos é chamada turbofish: ela fornece tipos explicitamente. Aqui `first` recebe uma slice emprestada e devolve uma referência opcional. Slice vazia produz `None`; uma slice com dados produz `Some`. O dado continua pertencendo à coleção.',
              visual: code(`${first}
fn main() {
    let data = [7, 2];
    let answer = first::<i32>(&data);
    println!("{answer:?}");
    let empty: [i32; 0] = [];
    println!("{:?}", first(&empty));
}`, [6, 9], 'Saída: Some(7), depois None'),
              tip: 'O retorno é Option<&T>, não Option<T>. Emprestar o primeiro item não exige copiar nem clonar esse item.',
            },
            {
              title: 'No seu computador',
              body: 'Crie `generics_fn` com Cargo, edição 2024. Prepare o exercício 33 do roteiro: implemente `first` genérica e chame com inteiros e com valores String. Trate o retorno com match ou if let, sem unwrap nem expect. Pronto quando os primeiros itens forem impressos como 7 e motor, a slice vazia imprimir vazio e o projeto passar na formatação e no Clippy. Na lição de bounds você ampliará a busca para encontrar o maior.',
              visual: code(`cargo new generics_fn --edition 2024
cd generics_fn
cargo run
cargo fmt --check
cargo clippy -- -D warnings`, undefined, 'Comandos no terminal'),
            },
          ],
          exercises: [
            mcq('Qual é o papel do turbofish?', ['Informar tipos na chamada', 'Repetir a função em um laço', 'Alocar um valor no heap', 'Converter qualquer texto em número'], 0,
              'O turbofish fornece argumentos de tipo. Ele não faz conversão de dados nem introduz uma alocação.'),
            mcq('Qual é a saída?', ['Some(9)', 'Some(4)', 'None', '9 4'], 0,
              'A slice não está vazia. first devolve uma referência ao elemento de índice zero, 9; a formatação Debug mostra Some(9).',
              { visual: code(`${first}
fn main() {
    let data = [9, 4];
    println!("{:?}", first(&data));
}`) }),
            tf('Para devolver uma referência ao primeiro item, first precisa exigir Clone.', false,
              'first empresta um item já existente. Nenhuma clonagem acontece e nenhum bound Clone é necessário.'),
            fill('Complete o tratamento de uma slice vazia:', 'Sem primeiro item, o resultado é ___.', ['None'], ['Some', 'panic', 'Clone'],
              'O método first da slice devolve None quando não há item. Esse caso está representado no próprio tipo Option.'),
            gen((rng) => {
              const a = randInt(rng, 2, 35);
              const b = a + randInt(rng, 1, 20);
              return num('Qual número é impresso pelo ramo Some?', a,
                `first acessa a posição zero, cujo valor é ${a}. O segundo valor, ${b}, não altera essa escolha.`,
                { visual: code(`${first}
fn main() {
    let data = [${a}, ${b}];
    if let Some(n) = first(&data) {
        println!("{n}");
    }
}`) });
            }),
            mcq('O que falta para compilar?', ['Informar o tipo dos elementos do vetor', 'Tornar v mutável', 'Trocar len por capacity', 'Adicionar uma quebra de linha'], 0,
              'E0282: “type annotations needed”. O comprimento não informa o tipo dos elementos. Anote Vec<i32> na variável ou informe i32 no turbofish do construtor.',
              { visual: code(`fn main() {
    let v = Vec::new();
    println!("{}", v.len());
}`, [2], 'Não compila: tipo indeterminado') }),
            order('Ordene o raciocínio para uma chamada de first:', [
              'Identificar o tipo dos itens da slice',
              'Substituir T por esse tipo',
              'Obter uma referência opcional ao primeiro item',
              'Tratar Some e None no chamador',
            ], 'O tipo dos itens determina T. A função consulta a slice e devolve a referência opcional; quem chama trata a presença ou a ausência.'),
            codePuzzle('Monte um vetor vazio de i32 e imprima 0. Declare o vetor antes de medir seu tamanho.', [
              'fn main() {',
              '    let v = Vec::<i32>::new();',
              '    let size = v.len();',
              '    println!("{size}");',
              '}',
            ], [
              '    let v = Vec::new();',
              '    let size: i32 = v.len();',
            ], 'O turbofish resolve o tipo mesmo sem elementos. len retorna 0 do tipo usize. Sem o turbofish, falta informação sobre o elemento: E0282 (“type annotations needed”). Exigir i32 para o comprimento causa E0308 (“mismatched types”), pois len devolve usize.'),
          ],
        },
      ],
    },
    {
      id: 'rt-gen-struct',
      title: 'Structs e enums genéricos',
      parts: [
        {
          card: [
            {
              title: 'Os campos podem carregar parâmetros de tipo',
              body: 'Com apenas `T`, os dois campos de Pair têm o mesmo tipo. Com `T` e `U`, cada campo pode escolher um tipo diferente. Os parâmetros podem coincidir, mas não são obrigados a isso. Enums também podem carregar um parâmetro nas variantes, como fazem Option e Result.',
              visual: code(`struct Pair<T, U> {
    left: T,
    right: U,
}
enum Reading<T> {
    Value(T),
    Missing,
}
fn main() {
    let p = Pair {
        left: 3,
        right: "V",
    };
    let r = Reading::Value(p.left);
    if let Reading::Value(n) = r {
        println!("{n} {}", p.right);
    }
    let r = Reading::<i32>::Missing;
    if let Reading::Missing = r {
        println!("sem leitura");
    }
}`, [1, 5], 'Saída: 3 V, depois sem leitura'),
            },
            {
              title: 'Siga os dados de uma pilha genérica',
              body: 'Uma Stack guarda um Vec de itens do mesmo tipo. Avance por dois pushes e um pop. O tipo permanece i32; o conteúdo muda. O pop devolve o último item dentro de Some, porque a pilha poderia estar vazia.',
              visual: trace(['Estado', 'Itens', 'Resultado'], [
                [['Stack de i32', '[]', '—']],
                [['Após push de 3', '[3]', '—']],
                [['Após push de 8', '[3, 8]', '—']],
                [['Após pop', '[3]', 'Some(8)']],
              ], [
                'O tipo do Vec já foi fixado; estar vazio não permite misturar tipos depois.',
                'O primeiro push acrescenta 3 ao final.',
                'O segundo push acrescenta 8 depois de 3.',
                'O pop retira 8; 3 continua na pilha. Este é o comportamento LIFO.',
              ]),
            },
          ],
          exercises: [
            mcq('Se os dois campos de uma struct usam o mesmo T, o que isso exige?', ['Os dois campos têm o mesmo tipo', 'Os dois campos têm o mesmo valor', 'Os campos são sempre i32', 'Os campos ficam no heap'], 0,
              'T representa um único tipo concreto por instanciação. Os valores dos campos podem ser diferentes.'),
            tf('Uma struct com parâmetros T e U permite que os dois sejam i32.', true,
              'Parâmetros distintos permitem tipos diferentes, mas não obrigam essa diferença. T e U podem receber o mesmo tipo.'),
            num('Qual número é impresso?', 6,
              'O campo left recebe 6. O campo right é &str, permitido pelo segundo parâmetro U, mas não participa da impressão.',
              { visual: code(`struct Pair<T, U> {
    left: T,
    right: U,
}
fn main() {
    let p = Pair {
        left: 6,
        right: "A",
    };
    println!("{}", p.left);
}`) }),
            match('Relacione cada abstração ao que ela representa:', [
              ['Option', 'Valor presente ou ausente'],
              ['Result', 'Sucesso ou erro, com tipos próprios'],
              ['Vec', 'Sequência de itens do mesmo tipo'],
            ], 'Option usa um parâmetro para o valor presente. Result separa os tipos do sucesso e do erro. Vec fixa um tipo de item para toda a sequência.'),
            gen((rng) => {
              const n = randInt(rng, 4, 70);
              return num('Qual valor é extraído da variante?', n,
                `A variante Value guarda ${n}. O padrão extrai esse valor para x, que é impresso.`,
                { visual: code(`enum Reading<T> {
    Value(T),
}
fn main() {
    let r = Reading::Value(${n});
    let Reading::Value(x) = r;
    println!("{x}");
}`) });
            }),
            mcq('Por que este par não compila?', ['O segundo campo não tem o tipo i32', 'Structs genéricas não podem ter dois campos', 'T exige valores iguais', 'Falta alocar a struct com Box'], 0,
              'E0308: “mismatched types”. Pair<i32> fixa ambos os campos como i32, mas right recebe &str. Use dois inteiros ou declare dois parâmetros de tipo.',
              { visual: code(`struct Pair<T> {
    left: T,
    right: T,
}
fn main() {
    let p = Pair::<i32> {
        left: 3,
        right: "V",
    };
    println!("{}", p.left);
}`, [7, 8], 'Não compila: um T para dois campos') }),
            fill('Complete a relação:', 'Em Result, o sucesso e o erro podem usar tipos ___.', ['diferentes'], ['obrigatoriamente iguais', 'sorteados', 'sem checagem'],
              'Result tem dois parâmetros independentes: um para o valor Ok e outro para o valor Err.'),
            codePuzzle('Monte para imprimir 5. Defina a struct antes de main; depois construa, extraia e imprima o campo.', [
              'struct Slot<T> { value: T',
              '} fn main() {',
              '    let s = Slot { value: 5 };',
              '    let n = s.value;',
              '    println!("{n}");',
              '}',
            ], [
              'struct Slot<T> { value: i32',
              '    let s = Slot::<i32> { value: "5" };',
            ], 'A struct declara e usa T no campo. O inicializador infere i32; n recebe 5 e é impresso. Trocar o campo por i32 deixa T sem uso: E0392 (“type parameter `T` is never used”). Inicializar Slot<i32> com texto causa E0308 (“mismatched types”).'),
          ],
        },
        {
          card: [
            {
              title: 'Um impl geral e outro para um tipo concreto',
              body: 'O `T` depois de impl declara o parâmetro usado no bloco. O método get existe para qualquer Slot e empresta o campo. Já doubled aparece apenas no bloco de Slot com i32. É um método adicional para um tipo concreto; não é a funcionalidade instável de especialização de traits.',
              visual: code(`${slot}
fn main() {
    let s = Slot { value: 6 };
    println!("{}", s.get());
    println!("{}", s.doubled());
}`, [4, 9], 'Saída: 6, depois 12'),
            },
            {
              title: 'Quais métodos estão disponíveis?',
              body: 'Os métodos são determinados pelo tipo de Slot. A tabela mostra a decisão do compilador antes de executar.',
              visual: table(['Tipo do campo', 'get', 'doubled'], [
                ['i32', 'Sim', 'Sim'],
                ['String', 'Sim', 'Não'],
                ['f64', 'Sim', 'Não'],
              ]),
            },
            {
              title: 'No seu computador',
              body: 'Faça o exercício 34 do roteiro: crie `generic_stack` com Cargo, edição 2024. Implemente Stack com Vec, os métodos push, pop e top e um construtor new. top deve emprestar o último item em Option; pop deve retirar e devolver o item em Option. Use uma pilha de i32 e outra de String. Pronto quando empilhar 3 e 8 permitir imprimir 8 no topo, retirar 8 e depois ver 3; uma pilha vazia deve devolver None. Trate os casos sem unwrap nem expect e termine sem avisos.',
              visual: code(`cargo new generic_stack --edition 2024
cd generic_stack
cargo run
cargo fmt --check
cargo clippy -- -D warnings`, undefined, 'Comandos no terminal'),
            },
          ],
          exercises: [
            mcq('Por que declarar T depois de impl?', ['Para introduzir o parâmetro usado no bloco', 'Para criar uma variável local', 'Para chamar o construtor', 'Para impedir inferência'], 0,
              'O T da declaração da struct não fica automaticamente declarado no cabeçalho do impl. O bloco genérico precisa declarar seu próprio parâmetro.'),
            mcq('Qual método existe para Slot com String no exemplo da teoria?', ['Somente get', 'Somente doubled', 'Os dois', 'Nenhum'], 0,
              'O bloco genérico fornece get para qualquer T. doubled só foi definido no bloco concreto de Slot<i32>.'),
            num('Qual é a saída?', 18,
              'O valor do campo é 9, inferido como i32. O método doubled multiplica esse valor por 2, resultando em 18.',
              { visual: code(`${slot}
fn main() {
    let s = Slot { value: 9 };
    println!("{}", s.doubled());
}`) }),
            tf('O método get precisa mover uma String para devolvê-la.', false,
              'get recebe &self e devolve &T. Se T for String, o retorno é &String: apenas um empréstimo, sem retirar o campo.'),
            gen((rng) => {
              const n = randInt(rng, 2, 40);
              return num('Qual número será impresso?', n * 2,
                `Slot guarda ${n} como i32. doubled calcula ${n} vezes 2, que resulta em ${n * 2}.`,
                { visual: code(`${slot}
fn main() {
    let s = Slot { value: ${n} };
    println!("{}", s.doubled());
}`) });
            }),
            mcq('A linha destacada compila?', ['Não: esse tipo de Slot não tem doubled', 'Sim: o texto é convertido em i32', 'Não: get consome o campo antes', 'Sim: qualquer método do impl concreto serve para todo T'], 0,
              'E0599: “no method named `doubled` found”. A variável é Slot<&str>; doubled só existe para Slot<i32>. Use um valor i32 ou escolha get para consultar o texto.',
              { visual: code(`${slot}
fn main() {
    let s = Slot { value: "V" };
    println!("{}", s.doubled());
}`, [16], 'Não compila: método indisponível') }),
            match('Relacione o método da pilha ao efeito:', [
              ['push', 'Acrescenta um item'],
              ['pop', 'Retira e devolve o último item'],
              ['top', 'Empresta o último item sem retirar'],
            ], 'push altera a coleção acrescentando; pop altera retirando e devolve Option<T>; top só consulta e devolve Option<&T>.'),
            codePuzzle('Monte para imprimir Some(4). Declare a struct antes do impl e o impl antes de main.', [
              'struct Stack<T> { data: Vec<T> }',
              'impl<T> Stack<T> {',
              '    fn pop(&mut self) -> Option<T> {',
              '        self.data.pop()',
              '    } }',
              'fn main() {',
              '    let mut s = Stack { data: vec![4] };',
              '    println!("{:?}", s.pop()); }',
            ], [
              '    fn pop(&self) -> Option<T> {',
              '        self.data.pop();',
            ], 'pop altera o Vec, exige &mut self e devolve a expressão sem ponto e vírgula. O valor retirado aparece em Some(4). Usar &self causa E0596 (“cannot borrow” os dados como mutáveis através de uma referência compartilhada). O ponto e vírgula causa E0308 (“mismatched types”): o corpo passa a devolver () em vez de Option<T>.'),
          ],
        },
      ],
    },
    {
      id: 'rt-gen-bounds',
      title: 'Trait bounds e where',
      parts: [
        {
          card: [
            {
              title: 'T sozinho não promete comparação',
              body: 'Trocar o tipo por T não autoriza qualquer operação. Esta tentativa de largest compara referências com maior que, mas não exige que T tenha ordem. O compilador rejeita o corpo mesmo que você só planeje chamar com inteiros. E0369 informa que a operação binária não pode ser aplicada a referências de T.',
              visual: code(`${largest.replace('<T: PartialOrd>', '<T>')}
fn main() {
    let data = [4, 9];
    println!("{:?}", largest(&data));
}`, [6], 'Não compila: E0369'),
              tip: 'Mensagem: “binary operation `>` cannot be applied to type `&T`”. A ajuda sugere restringir T com PartialOrd.',
            },
            {
              title: 'O bound autoriza a operação',
              body: 'PartialOrd permite usar comparações de ordem. A primeira consulta devolve None se a slice estiver vazia; nesse caso o operador ? encerra a função com None. Com dados, best começa emprestando o primeiro item e passa a apontar para um item maior. Só as referências mudam: nenhum item precisa de Copy nem Clone.',
              visual: code(`${largest}
fn main() {
    let data = [4, 9, 6];
    println!("{:?}", largest(&data));
}`, [1, 4, 6], 'Saída: Some(9)'),
            },
            {
              title: 'Veja o candidato mudar',
              body: 'Siga a varredura da slice. Para estes inteiros, todas as comparações têm resultado definido.',
              visual: trace(['Item', 'Comparação', 'best aponta para'], [
                [['4', 'Inicialização', '4']],
                [['9', '9 > 4: verdadeiro', '9']],
                [['6', '6 > 9: falso', '9']],
              ], [
                'A primeira referência é o candidato inicial.',
                'Encontramos um item maior: trocamos a referência candidata.',
                'O último item não vence o candidato; o retorno será Some com referência a 9.',
              ]),
            },
          ],
          exercises: [
            mcq('Qual bound permite comparar itens com maior que?', ['PartialOrd', 'Display', 'Clone', 'Default'], 0,
              'PartialOrd fornece comparações de ordem. Display formata, Clone clona e Default cria um valor padrão; essas capacidades não substituem a comparação.'),
            mcq('Que diagnóstico corresponde à versão sem bound mostrada?', ['E0369: operação binária indisponível para o tipo', 'E0382: uso depois de move', 'E0499: dois empréstimos mutáveis', 'E0308: retorno inteiro no lugar de texto'], 0,
              'A comparação entre referências a T exige que T implemente PartialOrd. Sem o bound, o compilador aponta E0369 no corpo genérico.'),
            num('Qual número é impresso?', 11,
              'best começa em 3, muda para 11 e não muda para 5. Some contém a referência a 11, que o if let imprime.',
              { visual: code(`${largest}
fn main() {
    let data = [3, 11, 5];
    if let Some(n) = largest(&data) {
        println!("{n}");
    }
}`) }),
            tf('Retornar Option<&T> evita exigir Copy para retirar o maior item da slice.', true,
              'A função devolve uma referência e mantém todos os itens na slice. Não tenta mover um valor para fora de dados emprestados.'),
            gen((rng) => {
              const a = randInt(rng, 2, 20);
              const b = a + randInt(rng, 2, 15);
              const c = a - 1;
              return num('Qual é o maior número impresso?', b,
                `A varredura começa em ${a}, troca o candidato por ${b} e mantém esse candidato ao comparar ${c}. O resultado é ${b}.`,
                { visual: code(`${largest}
fn main() {
    let data = [${a}, ${b}, ${c}];
    if let Some(n) = largest(&data) {
        println!("{n}");
    }
}`) });
            }),
            mcq('O que largest devolve para a slice vazia?', ['None', 'Some(0)', 'Uma referência inventada', 'Sempre causa panic'], 0,
              'list.first() devolve None. O operador ? propaga esse None antes de chegar ao fatiamento que começa em 1.',
              { visual: code(`${largest}
fn main() {
    let data: [i32; 0] = [];
    println!("{:?}", largest(&data));
}`) }),
            tf('PartialOrd garante que todo par de valores de ponto flutuante tenha uma ordem definida.', false,
              'A ordem é parcial: NaN não é menor, igual nem maior que outro valor. A função compila com f64, mas um NaN exige uma política explícita se você precisa de um máximo numérico bem definido.'),
            codePuzzle('Monte a função max2 antes de main. Ela compara dois i32 e imprime 9; o mesmo T deve valer para entradas e retorno.', [
              'fn max2<T: PartialOrd>(a: T, b: T)',
              '    -> T {',
              '    if a > b { a } else { b }',
              '}',
              'fn main() {',
              '    let n = max2(4, 9);',
              '    println!("{n}"); }',
            ], [
              'fn max2<T>(a: T, b: T)',
              '    if a > b { a; } else { b; }',
            ], 'PartialOrd autoriza a comparação. Cada ramo entrega um argumento por valor, sem ponto e vírgula nem exigência de Copy. Como 4 não é maior que 9, o retorno é 9. Sem o bound, a comparação causa E0369 (“binary operation `>` cannot be applied to type `T`”). Com ponto e vírgula nos ramos, surge E0308 (“mismatched types”), pois os ramos devolvem () em vez de T.'),
          ],
        },
        {
          card: [
            {
              title: 'where deixa as exigências à vista',
              body: 'Bounds também podem ficar em uma cláusula where, entre a assinatura e o corpo. O sinal de mais reúne exigências sobre o mesmo tipo: aqui T precisa de Display para imprimir e PartialOrd para comparar. Escrever os mesmos bounds junto de T teria o mesmo significado.',
              visual: code(`${report}
fn main() {
    report(&7, &10);
}`, [3, 4], 'Saída: 7, depois false'),
              tip: 'Os dois argumentos usam o mesmo T. Aqui a comparação verifica se 7 supera o limite 10.',
            },
            {
              title: 'Métodos disponíveis só com um bound',
              body: 'Você pode oferecer métodos gerais num impl e acrescentar outro impl com bound. Neste caso, show só fica disponível quando o conteúdo pode ser formatado com Display. Isso não cria uma implementação de Display para o tipo: apenas exige uma que já exista.',
              visual: code(`use std::fmt::Display;
struct Slot<T> {
    value: T,
}
impl<T: Display> Slot<T> {
    fn show(&self) {
        println!("{}", self.value);
    }
}
fn main() {
    let s = Slot { value: "motor" };
    s.show();
}`, [5], 'Saída: motor'),
            },
            {
              title: 'No seu computador',
              body: 'Complete o exercício 33: crie `generic_largest`, edição 2024, e implemente largest devolvendo Option de referência, com bound PartialOrd escrito em where. Para os números 4, 9 e 6 imprima 9; para as strings String motor e sensor imprima sensor, pela ordem lexicográfica. A entrada vazia deve imprimir vazio. Tente também chamar com uma struct sem PartialOrd e observe E0277; remova essa tentativa antes da verificação final. Como extra do exercício 34, acrescente show à Stack apenas quando o item implementar Display. Pronto quando todas as saídas baterem, sem unwrap nem expect e com Clippy sem avisos.',
              visual: code(`cargo new generic_largest \\
    --edition 2024
cd generic_largest
cargo run
cargo fmt --check
cargo clippy -- -D warnings`, undefined, 'Comandos no terminal'),
            },
          ],
          exercises: [
            mcq('Trocar bounds junto de T por uma cláusula where equivalente muda o quê?', ['A organização da assinatura', 'O tipo dos valores em execução', 'A função passa a aceitar qualquer tipo', 'A função passa a usar despacho dinâmico'], 0,
              'As mesmas exigências continuam sendo verificadas. where é uma forma de organizar a assinatura, especialmente com vários parâmetros e bounds.'),
            match('Relacione cada capacidade ao bound correspondente:', [
              ['Formatar com chaves simples', 'Display'],
              ['Comparar ordem', 'PartialOrd'],
              ['Clonar explicitamente', 'Clone'],
            ], 'Cada bound autoriza operações específicas; pedir um deles não concede automaticamente os outros.'),
            mcq('O que o programa imprime, em duas linhas?', ['7 e false', '7 e true', 'false e 7', 'Nada, pois where impede executar'], 0,
              'Display imprime 7. A comparação 7 > 10 é falsa; portanto a segunda linha é false.',
              { visual: code(`${report}
fn main() {
    report(&7, &10);
}`) }),
            fill('Complete o significado dos bounds combinados:', 'T precisa satisfazer Display ___ PartialOrd.', ['e'], ['ou', 'em vez de', 'somente depois de'],
              'O sinal de mais exige as duas traits ao mesmo tempo. Não é uma escolha entre capacidades.'),
            gen((rng) => {
              const n = randInt(rng, 3, 80);
              const limit = n + 2;
              return num('Qual número aparece na primeira linha?', n,
                `report recebe referências a ${n} e ${limit}. A primeira linha formata ${n} com Display. A segunda compara ${n} com ${limit} e imprime false.`,
                { visual: code(`${report}
fn main() {
    report(&${n}, &${limit});
}`) });
            }),
            mcq('Por que a chamada com Sensor é rejeitada?', ['Sensor não implementa PartialOrd', 'Todo tipo próprio é proibido em generics', 'A slice contém só um elemento', 'A função precisa receber um Vec por valor'], 0,
              'E0277: “can\'t compare `Sensor` with `Sensor`”. A função declara o bound corretamente, mas o tipo fornecido não o satisfaz. Para uma struct com campos ordenáveis, você pode derivar PartialEq e PartialOrd se essa ordem fizer sentido para o modelo.',
              { visual: code(`${largest}
struct Sensor;
fn main() {
    let data = [Sensor];
    let _ = largest(&data);
}`, [15], 'Não compila: bound não satisfeito') }),
            tf('Um bound implementa automaticamente a trait que ele menciona.', false,
              'O bound exige uma implementação existente. Para um tipo próprio, você precisa implementar a trait ou derivá-la quando isso for permitido e adequado.'),
            codePuzzle('Monte para imprimir 5. Defina show antes de main e coloque o bound em where.', [
              'fn show<T>(x: T)',
              'where',
              '    T: std::fmt::Display,',
              '{ println!("{x}"); }',
              'fn main() {',
              '    show(5);',
              '}',
            ], [
              '    T: Clone,',
              '    T: std::fmt::Debug,',
            ], 'A cláusula where fica antes do corpo e exige Display usando dois-pontos. i32 satisfaz a exigência e a chamada imprime 5. Clone ou Debug sozinhos não autorizam formatação com chaves simples: os dois distratores causam E0277 (“`T` doesn\'t implement `std::fmt::Display`”).'),
          ],
        },
      ],
    },
    {
      id: 'rt-gen-mono',
      title: 'Monomorfização e custo zero',
      parts: [
        {
          card: [
            {
              title: 'O compilador preenche os tipos',
              body: 'Monomorfização transforma usos de código genérico em código para tipos concretos durante a compilação. Aqui echo é usada com i32 e char. Duas chamadas com i32 compartilham a mesma instanciação; mudar o valor não cria um novo tipo. O otimizador ainda pode embutir ou eliminar código, então a contagem de tipos não é uma promessa sobre quantos símbolos estarão no binário final.',
              visual: code(`${echo}
fn main() {
    echo(3_i32);
    echo(8_i32);
    echo('R');
}`, [6, 7, 8], 'Saída: 3, 8 e R, uma por linha'),
            },
            {
              title: 'Da definição aos tipos usados',
              body: 'Avance para agrupar as chamadas por tipo. A tabela é um modelo da compilação, não uma medição de tempo ou de tamanho.',
              visual: trace(['Chamada', 'Instanciação conceitual'], [
                [['Definição de echo', 'T com Display']],
                [['Entrada 3_i32', 'i32'], ['Entrada 8_i32', 'i32']],
                [['Entradas inteiras', 'i32'], ['Entrada caractere', 'char']],
              ], [
                'Há uma definição no fonte e um requisito declarado pelo bound.',
                'Os dois valores inteiros usam o mesmo tipo concreto.',
                'O caractere acrescenta outro tipo. São dois tipos usados, embora existam três chamadas.',
              ]),
            },
          ],
          exercises: [
            mcq('Em que etapa acontece a monomorfização?', ['Durante a compilação', 'A cada impressão no terminal', 'Depois de encerrar o programa', 'Só quando ocorre um panic'], 0,
              'O compilador usa os tipos concretos das chamadas para gerar código especializado antes da execução.'),
            tf('Trocar o valor de um i32 em outra chamada exige uma nova instanciação por tipo.', false,
              'Instanciações dependem dos tipos concretos. Valores diferentes do mesmo tipo não criam novos parâmetros de tipo.'),
            num('Quantos tipos concretos diferentes são usados nas chamadas de echo?', 2,
              'As duas primeiras chamadas usam i32 e a terceira usa char. Há três chamadas e dois tipos concretos para T.',
              { visual: code(`${echo}
fn main() {
    echo(3_i32);
    echo(8_i32);
    echo('R');
}`) }),
            match('Relacione cada quantidade ao que ela conta:', [
              ['Definições no fonte', 'Quantas vezes você escreveu o algoritmo'],
              ['Chamadas', 'Quantos usos aparecem no programa'],
              ['Tipos concretos usados', 'Quais substituições de T são necessárias'],
            ], 'Uma definição pode atender várias chamadas. Chamadas com o mesmo tipo reutilizam a mesma substituição de T, e a otimização pode alterar o código final.'),
            gen((rng) => {
              const count = randInt(rng, 2, 6);
              return num('Quantos tipos concretos de T este laço usa em echo?', 1,
                `O laço chama echo ${count} vezes, mas n é i32 em todas elas. Só uma substituição de T, por i32, é necessária.`,
                { visual: code(`${echo}
fn main() {
    for n in 0_i32..${count} {
        echo(n);
    }
}`) });
            }),
            mcq('Ao usar echo com i32 e depois com char, o que ocorre?', ['O compilador resolve uma instanciação para cada tipo', 'O programa testa o nome do tipo a cada chamada', 'Cada valor é convertido para String antes de chamar', 'O parâmetro T troca de tipo dentro da função'], 0,
              'Os dois tipos são conhecidos na compilação. A geração de código usa essas escolhas; os generics não introduzem uma escolha de tipo em tempo de execução.'),
            order('Ordene o modelo de compilação e execução:', [
              'Escrever a definição genérica e suas chamadas',
              'Verificar tipos e bounds',
              'Gerar e otimizar código para os tipos usados',
              'Executar o programa compilado',
            ], 'Primeiro há código fonte com requisitos. O compilador verifica esses requisitos e prepara código concreto; a execução usa o programa já compilado.'),
            codePuzzle('Monte para imprimir 2 e depois R. Defina identity antes de main, faça a chamada inteira e imprima-a antes de criar o caractere.', [
              'fn identity<T>(x: T) -> T { x',
              '} fn main() {',
              '    let n = identity::<i32>(2);',
              '    println!("{n}"); let c =',
              "        identity::<char>('R');",
              '    println!("{c}");',
              '}',
            ], [
              "        identity::<i32>('R');",
              'fn identity<T>(x: T) -> T { x;',
            ], 'A primeira chamada fixa i32 e imprime 2; a segunda fixa char e imprime R. A ordem foi pedida explicitamente. Usar i32 com argumento char causa E0308 (“mismatched types”). O ponto e vírgula no corpo de identity também causa E0308, pois o corpo devolve () em vez de T.'),
          ],
        },
        {
          card: [
            {
              title: 'Custo zero tem um significado preciso',
              body: 'Generics não acrescentam por si só uma busca dinâmica pelo tipo nem exigem colocar dados em Box. Isso não torna o algoritmo gratuito: clonar uma String pode alocar e copiar bytes; imprimir também faz trabalho. O custo deve ser comparado com código concreto que realiza as mesmas operações. Muitas instanciações podem aumentar tempo de compilação e tamanho do executável.',
              visual: code(`fn cloned<T: Clone>(value: &T) -> T {
    T::clone(value)
}
fn main() {
    let text = String::from("motor");
    let other = cloned(&text);
    println!("{text} {other}");
}`, [2, 6], 'Saída: motor motor'),
            },
            {
              title: 'Veja o custo que vem dos dados',
              body: 'Esta tabela é conceitual: não fixa capacidade, endereços nem o layout da String. Para o texto não vazio do exemplo, clonar cria outro dono com seu próprio conteúdo no heap.',
              visual: table(['Etapa', 'Donos de String', 'Conteúdo no heap'], [
                ['Criar text', 'text', 'motor'],
                ['Clonar', 'text e other', 'motor e motor'],
                ['Fim do escopo', 'Nenhum', 'Liberado pelos donos'],
              ]),
            },
            {
              title: 'No seu computador',
              body: 'Retome o exercício 33 em `generic_cost`, edição 2024. Compare a função largest genérica com duas versões concretas, uma para i32 e outra para String, mantendo o mesmo algoritmo e o retorno emprestado. Use 4, 9 e 6 e os textos motor e sensor. Pronto quando cada par de versões imprimir o mesmo resultado: 9 e sensor. Rode em debug e release, mas não conclua que um arquivo maior ou uma única medição prova um custo fixo dos generics: otimização, biblioteca padrão e configuração influenciam os resultados. Registre que foram usados dois tipos e que não houve clone na busca. Finalize com formatação e Clippy sem avisos, sem unwrap nem expect.',
              visual: code(`cargo new generic_cost --edition 2024
cd generic_cost
cargo run
cargo run --release
cargo fmt --check
cargo clippy -- -D warnings`, undefined, 'Comandos no terminal'),
            },
          ],
          exercises: [
            mcq('O que custo zero dos generics quer dizer aqui?', ['Ausência de sobrecarga de despacho dinâmico causada pelos generics', 'Execução sem nenhuma instrução', 'Clones e alocações deixam de custar', 'Tempo de compilação sempre igual'], 0,
              'A escolha dos tipos ocorre na compilação. O algoritmo concreto ainda executa operações e pode alocar, copiar, comparar e imprimir.'),
            tf('Usar generics obriga a guardar o valor no heap.', false,
              'Uma função genérica pode receber um i32 direto, por exemplo. Alocações dependem dos tipos e das operações escolhidas, não do simples uso de T.'),
            mcq('Qual é a saída?', ['motor motor', 'motor', 'other other', 'O programa não compila'], 0,
              'cloned chama Clone sobre a String emprestada e devolve outra String. text continua válido e ambos os valores contêm motor.',
              { visual: code(`fn cloned<T: Clone>(value: &T) -> T {
    T::clone(value)
}
fn main() {
    let text = String::from("motor");
    let other = cloned(&text);
    println!("{text} {other}");
}`) }),
            fill('Complete o cuidado ao avaliar desempenho:', 'Compare implementações que realizam as ___ operações.', ['mesmas'], ['menores', 'aleatórias', 'nenhumas'],
              'Uma comparação justa mantém o trabalho do algoritmo. Uma diferença causada por clone ou por impressão não é automaticamente uma sobrecarga dos generics.'),
            gen((rng) => {
              const n = randInt(rng, 2, 30);
              const value = n * 3;
              return num('Qual número é impresso após passar pela função genérica?', value,
                `identity devolve ${n}; a multiplicação concreta por 3 produz ${value}. Custo zero não elimina a multiplicação nem altera o resultado.`,
                { visual: code(`${identity}
fn main() {
    let n = identity::<i32>(${n});
    println!("{}", n * 3);
}`) });
            }),
            mcq('Qual troca pode ocorrer quando muitos tipos usam uma função genérica?', ['Mais código gerado e mais trabalho de compilação', 'Toda chamada passa a usar uma vtable', 'Todos os itens viram String', 'Bounds deixam de ser verificados'], 0,
              'Monomorfização pode produzir código para várias combinações de tipos. Isso pode aumentar compilação e binário, embora inlining, deduplicação e eliminação de código também influenciem o resultado.'),
            tf('O número de tipos usados determina exatamente o tamanho final do executável.', false,
              'A contagem de tipos ajuda a entender a monomorfização, mas não prevê bytes. O otimizador pode embutir, juntar ou eliminar código, e outras partes do programa também ocupam espaço.'),
            codePuzzle('Monte para imprimir 7 e depois 10. Defina identity antes de main; imprima a antes de calcular b a partir de a.', [
              'fn identity<T>(x: T) -> T { x',
              '} fn main() {',
              '    let a = identity::<i32>(7);',
              '    println!("{a}"); let b =',
              '        identity::<i32>(a + 3);',
              '    println!("{b}");',
              '}',
            ], [
              '        identity::<char>(a + 3);',
              '        identity::<i32>(&a);',
            ], 'As duas chamadas usam i32: o novo valor 10 não cria um novo tipo. A segunda recebe 7 + 3. Os distratores causam E0308 (“mismatched types”): um exige char, mas recebe i32; o outro exige i32, mas recebe uma referência &i32.'),
          ],
        },
      ],
    },
  ],
};

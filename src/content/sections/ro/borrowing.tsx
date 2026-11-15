import React from 'react';
import type { UnitDef, VisualSpec } from '../../types';
import { code, fill, gen, match, mcq, num, table, tf } from '../../helpers';
import { codePuzzle } from '../../codePractice';
import { randInt } from '../../../lib/random';
import { Arrow, Label, RectW } from '../../../components/plot/Plot';
import { C } from '../../../theme';

// Esquema de permissões, não de endereços: avançar muda quem pode acessar.
const borrowSteps = (states: { access: string; info: string }[]): VisualSpec => ({
  name: 'stepper',
  props: {
    steps: states.length,
    height: 180,
    view: { xMin: 0, xMax: 10, yMin: 0, yMax: 5 },
    render: (k: number) => (
      <>
        <RectW x={0.5} y={3} w={3} h={1.3} color={C.p1} />
        <Label x={2} y={3.6} text="Dono: s" anchor="middle" />
        <RectW x={6.5} y={3} w={3} h={1.3} color={C.gold} />
        <Label x={8} y={3.6} text="String" anchor="middle" />
        <Arrow x1={3.7} y1={3.6} x2={6.2} y2={3.6} color={C.p1} />
        <Label x={5} y={1.2} text={states[k].access} anchor="middle" color={C.gold} />
      </>
    ),
    info: (k: number) => states[k].info,
  },
});

const readString = `fn main() {
    let s = String::from("metal");
    let r = &s;
    println!("{r}");
    println!("{s}");
}`;

const sizeFunction = `fn length(s: &str) -> usize {
    s.len()
}

fn main() {
    let s = String::from("metal");
    let n = length(&s);
    println!("{n}");
    println!("{s}");
}`;

const sharedWrite = `fn change(s: &String) {
    s.push_str("!");
}

fn main() {
    let s = String::from("metal");
    change(&s);
}`;

const mutateNumber = `fn main() {
    let mut n = 10;
    let r = &mut n;
    *r += 3;
    println!("{n}");
}`;

const missingMut = `fn main() {
    let s = String::from("metal");
    let r = &mut s;
    r.push('!');
    println!("{r}");
}`;

const exclaimFunction = `fn exclaim(s: &mut String) {
    s.push('!');
}

fn main() {
    let mut s = String::from("metal");
    exclaim(&mut s);
    println!("{s}");
}`;

const twoWriters = `fn main() {
    let mut s = String::from("metal");
    let a = &mut s;
    let b = &mut s;
    println!("{a} {b}");
}`;

const mixedBorrows = `fn main() {
    let mut s = String::from("metal");
    let r = &s;
    let w = &mut s;
    println!("{r} {w}");
}`;

const lastUse = `fn main() {
    let mut s = String::from("metal");
    let r = &s;
    println!("{r}");
    let w = &mut s;
    w.push('!');
    println!("{w}");
}`;

const noSource = `fn bad() -> &String {
    let s = String::from("metal");
    &s
}

fn main() {
    println!("{}", bad());
}`;

// A entrada permite elidir o lifetime da assinatura, isolando o E0515 no corpo.
const localReturn = `fn bad(_input: &str) -> &str {
    let local = String::from("metal");
    &local
}

fn main() {
    println!("{}", bad("entrada"));
}`;

const ownedReturn = `fn create() -> String {
    String::from("metal")
}

fn main() {
    let s = create();
    println!("{s}");
}`;

const echoFunction = `fn echo(s: &str) -> &str {
    s
}

fn main() {
    let mut s = String::from("metal");
    let r = echo(&s);
    println!("{r}");
    s.clear();
    println!("{}", s.len());
}`;

const clearTooEarly = `fn main() {
    let mut s = String::from("metal");
    let r = &s;
    s.clear();
    println!("{r}");
}`;

export const rustBorrowing: UnitDef = {
  id: 'ro-borrow', title: 'Referências e borrowing', icon: '🤝',
  subtitle: 'Empreste para ler ou alterar, mantendo a posse',
  source: 'The Rust Programming Language, edição 2024, cap. 4.2: https://doc.rust-lang.org/book/ch04-02-references-and-borrowing.html · Índice oficial de erros: https://doc.rust-lang.org/error_codes/ · Desafio 50 dias Rust, dias 8 e 9.',
  guide: 'Uma referência empresta acesso sem transferir a posse. `&` cria um empréstimo compartilhado de leitura; `&mut` cria um empréstimo exclusivo que permite alterar. `*` acessa o valor referenciado. Para os valores comuns desta unidade: muitos leitores OU um escritor para o mesmo dado enquanto os empréstimos se sobrepõem. E0596: falta permissão de mutação; E0499: dois empréstimos mutáveis incompatíveis; E0502: leitura e escrita incompatíveis. O empréstimo pode terminar no último uso da referência, antes da chave final (non-lexical lifetimes). Isso não destrói o dono. Referências precisam apontar para dados vivos: E0106 denuncia um lifetime ausente na assinatura; E0515 impede devolver referência a um valor local. Devolver o valor com posse ou emprestar uma entrada ainda válida são soluções diferentes. Anotar um lifetime não prolonga a vida dos dados.',
  extra: true,
  lessons: [
    {
      id: 'ro-borrow-ref', title: 'Referências imutáveis', parts: [
        {
          card: [
            {
              title: 'Olhar sem tomar posse',
              body: '`s` é dona da `String`; `r` apenas a referencia. O operador `&` cria o empréstimo. Ler por `r` não move nem clona a string. A saída tem duas linhas iguais: metal e metal. Em C você já passou endereços; aqui o compilador também verifica as permissões e a validade do acesso.',
              visual: code(readString, [3, 4, 5], 'Leitura emprestada'),
            },
            {
              title: 'A posse permanece',
              body: 'Avance os passos: a referência deixa de ser usada, mas o dono continua responsável por liberar os dados quando sair do escopo. O desenho representa a posse, não o layout físico da memória.',
              visual: borrowSteps([
                { access: 'Somente o dono', info: '`s` possui a string metal.' },
                { access: 'r: leitura emprestada', info: '`r` lê os dados de `s`. Nenhuma cópia da string foi criada.' },
                { access: 'Último uso de r passou', info: 'O empréstimo terminou. `s` ainda possui a mesma string e pode ser usada.' },
              ]),
            },
          ],
          exercises: [
            mcq('Quem é o dono da String nesta listagem?', ['s', 'r', 'println!', 'ninguém'], 0, '`s` recebeu a String. A referência `r` só permite acesso; não recebe a posse.', { visual: code(readString, [2, 3]) }),
            tf('Criar uma referência imutável exige clonar a String.', false, 'O empréstimo acessa os mesmos dados. Clonar criaria outra String com posse própria.'),
            mcq('Qual é a saída, na ordem das linhas?', ['metal / metal', 'metal / vazio', 'vazio / metal', 'Não compila: a posse foi movida'], 0, 'A primeira impressão lê por referência. A segunda usa a dona, que continua válida. A barra separa as duas linhas da saída.', { visual: code(readString) }),
            num('Que número é impresso?', 12, '`r` aponta para o inteiro 12. A desreferência `*r` lê esse valor; não é multiplicação.', { visual: code(`fn main() {
    let n = 12;
    let r = &n;
    println!("{}", *r);
}`, [4]) }),
            match('Associe cada elemento ao seu papel:', [['&', 'cria uma referência'], ['*', 'desreferencia'], ['String', 'tipo com posse do texto'], ['&String', 'tipo que empresta acesso à String']], 'O operador de referência empresta; a desreferência chega ao valor. O tipo com & descreve uma referência, não uma segunda dona.'),
            gen((rng) => {
              const n = randInt(rng, 4, 35);
              const add = randInt(rng, 2, 8);
              return num('Qual número é impresso ao ler a referência?', n + add, `A referência aponta para ${n}. A expressão lê esse valor e soma ${add}: ${n + add}. O original não muda.`, { visual: code(`fn main() {
    let n = ${n};
    let r = &n;
    println!("{}", *r + ${add});
}`) });
            }),
            codePuzzle('Monte um programa que lê por referência e imprime 21.', [
              'fn main() {',
              '    let n = 21;',
              '    let r = &n;',
              '    let value = *r;',
              '    println!("{value}");',
              '}',
            ], ['    let r = n;', '    let value = *n;'], 'Primeiro o dado, depois sua referência, depois a leitura com *. A impressão depende de value. O distrator que copia n não cria uma referência; n é um inteiro, não uma referência para desreferenciar.'),
            mcq('Duas referências imutáveis da mesma String: compila?', ['Sim; imprime metal metal', 'Não; E0499, dois escritores', 'Não; E0596, falta mut', 'Sim; imprime uma string vazia'], 0, 'Ambas as referências só leem. Vários empréstimos imutáveis do mesmo valor podem se sobrepor.', { visual: code(`fn main() {
    let s = String::from("metal");
    let a = &s;
    let b = &s;
    println!("{a} {b}");
}`) }),
          ],
        },
        {
          card: [
            {
              title: 'Funções também podem emprestar',
              body: '`length` recebe `&str`, uma vista de texto para leitura. Ao passar uma referência à String, Rust a adapta a essa vista. A função devolve um número; não precisa devolver o texto para restituir a posse. A saída é 5 e depois metal, em linhas separadas. `len` conta bytes; aqui usamos apenas letras ASCII, cada uma com um byte.',
              visual: code(sizeFunction, [1, 7], 'Medir sem consumir'),
            },
            {
              title: 'O que existe durante a chamada',
              body: 'O parâmetro tem acesso ao texto, mas a variável de quem chamou continua sendo a dona.',
              visual: table(['Elemento', 'Papel'], [['s em main', 'Dona da String'], ['s em length', 'Texto emprestado'], ['n', 'Número com o tamanho']]),
            },
            {
              title: 'No seu computador',
              body: 'Dia 8 do roteiro: crie o projeto pelo terminal abaixo. Implemente a função `length` (tamanho) do card e chame-a com uma referência ao texto metal. Imprima primeiro o tamanho e depois o texto original. Pronto quando a execução mostrar 5 e metal, em duas linhas, e o Clippy terminar sem avisos. Confira a edição 2024 no Cargo.toml.',
              visual: code('cargo new borrow_read --edition 2024\ncd borrow_read\ncargo run\ncargo clippy -- -D warnings', [], 'Terminal'),
            },
          ],
          exercises: [
            mcq('Por que main ainda consegue imprimir s depois de chamar length?', ['A função só recebeu acesso emprestado', 'Toda chamada clona a String', 'usize devolve a posse da String', 'println! recupera valores movidos'], 0, 'O parâmetro é uma referência de leitura. A posse da String nunca sai de main.', { visual: code(sizeFunction, [7, 9]) }),
            fill('Complete a ideia de borrowing:', 'A função recebe acesso, mas não recebe a ___.', ['posse'], ['cópia obrigatória', 'permissão de escrita'], 'Borrowing separa acesso e posse: o dono continua responsável pelo valor.'),
            num('Qual é a primeira linha da saída?', 5, 'metal tem cinco letras ASCII, portanto cinco bytes. O retorno da função é 5.', { visual: code(sizeFunction) }),
            tf('Em uma referência imutável a um inteiro, * permite ler o valor apontado.', true, 'Desreferenciar permite acessar o valor, mas não acrescenta permissão para alterá-lo.'),
            gen((rng) => {
              const n = randInt(rng, 3, 12);
              const text = 'a'.repeat(n);
              return num('Quantos bytes a função imprime?', n, `O texto tem ${n} caracteres ASCII a. Cada um ocupa um byte; o empréstimo não altera o texto.`, { visual: code(`fn length(s: &str) -> usize {
    s.len()
}
fn main() {
    let s =
        String::from("${text}");
    println!("{}", length(&s));
}`) });
            }),
            mcq('A função change compila?', ['Não; E0596, tentou alterar por &String', 'Sim; imprime metal!', 'Não; E0499, dois empréstimos mutáveis', 'Sim; altera uma cópia independente'], 0, 'E0596: cannot borrow `*s` as mutable, as it is behind a `&` reference. O método precisa alterar a String, mas o parâmetro só permite leitura. Corrija a assinatura, a variável dona e a chamada para usar empréstimo mutável.', { visual: code(sharedWrite, [1, 2], 'Tentativa inválida') }),
            codePuzzle('Monte uma leitura emprestada. A saída deve ser 5 metal, em uma linha.', [
              'fn main() {',
              '    let s = String::from("metal");',
              '    let r = &s;',
              '    let n = r.len();',
              '    println!("{n} {s}");',
              '}',
            ], ['    let r = s;', '    let n = *r;'], 'A referência permite chamar len sem mover s. Mover s para r impediria a impressão de s; desreferenciar a String não produz seu tamanho.'),
            mcq('Para calcular o tamanho e continuar usando o texto, qual projeto de função faz sentido?', ['Receber texto por referência e devolver usize', 'Receber a posse e devolver apenas usize', 'Clonar sempre antes de qualquer leitura', 'Exigir acesso mutável para contar bytes'], 0, 'Uma leitura só precisa de empréstimo imutável. O número retornado é independente da String, que continua com quem chamou.'),
          ],
        },
      ],
    },
    {
      id: 'ro-borrow-mut', title: 'Referências mutáveis', parts: [
        {
          card: [
            {
              title: 'Emprestar permissão de escrita',
              body: '`n` é mutável; `&mut` empresta acesso exclusivo; `*r` permite alterar o inteiro. A saída é 13. O nome `r` não precisa ser declarado com mut para escrever no valor apontado: não estamos trocando a referência guardada em `r`.',
              visual: code(mutateNumber, [2, 3, 4], 'Alterar o dado emprestado'),
            },
            {
              title: 'Uma permissão temporária',
              body: 'Avance e acompanhe a passagem da permissão. A posse nunca sai do dono.',
              visual: borrowSteps([
                { access: 'Dono pode alterar', info: '`s` é uma String mutável, sem empréstimo ativo.' },
                { access: 'r: acesso exclusivo', info: 'Durante o uso de `r`, acessos incompatíveis a `s` ficam impedidos.' },
                { access: 'Dono volta a acessar', info: 'Depois do último uso de `r`, `s` pode ser acessada diretamente outra vez.' },
              ]),
            },
          ],
          exercises: [
            mcq('Qual operador cria o empréstimo que permite alterar?', ['&mut', '&', 'clone', 'len'], 0, 'O empréstimo mutável dá acesso exclusivo ao dado durante o intervalo em que é necessário.'),
            num('Qual número aparece na saída?', 13, 'O inteiro começa em 10. A escrita por *r soma 3 ao próprio n, chegando a 13.', { visual: code(mutateNumber) }),
            tf('É obrigatório escrever mut também na declaração de r para alterar *r neste exemplo.', false, 'r já tem tipo &mut i32. Alterar o inteiro apontado não é reatribuir a variável r.', { visual: code(mutateNumber, [3, 4]) }),
            mcq('Por que esta tentativa não compila?', ['E0596: s não foi declarada mutável', 'E0499: duas referências mutáveis', 'E0106: falta lifetime de retorno', 'Compila; imprime metal!'], 0, 'E0596: cannot borrow `s` as mutable, as it is not declared as mutable. Declare a dona com mut para permitir o empréstimo de escrita.', { visual: code(missingMut, [2, 3], 'Faltou mut no dono') }),
            match('Associe as permissões:', [['&i32', 'empresta leitura de inteiro'], ['&mut i32', 'empresta escrita de inteiro'], ['mut no dono', 'permite alterar a variável dona']], 'O mut da variável e o mut da referência cumprem papéis diferentes. Para emprestar escrita de um inteiro local, precisamos dos dois nos lugares apropriados.'),
            gen((rng) => {
              const n = randInt(rng, 8, 40);
              const add = randInt(rng, 2, 9);
              return num('Qual valor o dono imprime após a escrita?', n + add, `*r acessa n. A soma modifica ${n} para ${n + add}; a impressão ocorre depois do último uso de r.`, { visual: code(`fn main() {
    let mut n = ${n};
    let r = &mut n;
    *r += ${add};
    println!("{n}");
}`) });
            }),
            codePuzzle('Monte a alteração por referência: a saída deve ser 17.', [
              'fn main() {',
              '    let mut n = 12;',
              '    let r = &mut n;',
              '    *r += 5;',
              '    let result = *r;',
              '    println!("{result}");',
              '}',
            ], ['    let n = 12;', '    let r = &n;'], 'A variável permite mutação e a referência empresta essa permissão. A leitura de result precisa vir depois da soma para a saída ser 17.'),
            mcq('Compila mesmo sem mut no nome r?', ['Sim; imprime metal!', 'Não; E0596 no nome r', 'Não; E0499 no método push', 'Sim; imprime metal sem alteração'], 0, 'Sim. r guarda uma referência mutável e o método altera a String apontada. Não há reatribuição de r.', { visual: code(`fn main() {
    let mut s = String::from("metal");
    let r = &mut s;
    r.push('!');
    println!("{r}");
}`) }),
          ],
        },
        {
          card: [
            {
              title: 'Alterar por uma função',
              body: 'Dia 8 do roteiro: `exclaim` recebe uma referência mutável à String e acrescenta um ponto de exclamação. Observe os três lugares: mut na dona, empréstimo mutável na chamada e referência mutável no parâmetro. A saída é metal!. A função termina sem levar a posse do texto.',
              visual: code(exclaimFunction, [1, 6, 7], 'Função que altera o texto'),
            },
            {
              title: 'Três verificações',
              body: 'Uma chamada de escrita precisa combinar a capacidade do dado com a permissão da referência.',
              visual: table(['Lugar', 'Necessidade'], [['Dona', 'Aceita mutação'], ['Chamada', 'Empresta escrita'], ['Parâmetro', 'Recebe escrita']]),
            },
            {
              title: 'No seu computador',
              body: 'Continue o dia 8: crie o projeto abaixo e implemente `exclaim` (exclamar) como no exemplo. Chame a função duas vezes sobre a mesma String metal, uma chamada depois da outra, e imprima o texto ao final. Pronto quando a saída for metal!! e o Clippy terminar sem avisos. Não clone nem devolva a String pela função.',
              visual: code('cargo new borrow_write --edition 2024\ncd borrow_write\ncargo run\ncargo clippy -- -D warnings', [], 'Terminal'),
            },
          ],
          exercises: [
            mcq('O que exclaim devolve ao chamador?', ['Nenhum texto; o retorno implícito é ()', 'Uma String clonada', 'Uma referência nova obrigatória', 'O tamanho do texto'], 0, 'A função altera o dado por empréstimo. Ela não precisa retornar a String, pois nunca recebeu sua posse.', { visual: code(exclaimFunction, [1, 2, 3]) }),
            mcq('Qual texto é impresso?', ['metal!', 'metal', '!', 'Não compila: a chamada move s'], 0, 'push acrescenta o caractere ! à String original. Depois da chamada, main continua sendo dona dela.', { visual: code(exclaimFunction) }),
            tf('Duas chamadas sucessivas de exclaim sobre a mesma String são permitidas.', true, 'Cada chamada usa um empréstimo temporário que termina antes da chamada seguinte.'),
            mcq('Qual mudança corrige a função que recebe &String e tenta escrever?', ['Usar &mut String, dona mutável e chamada com &mut', 'Só renomear o parâmetro', 'Só trocar o texto acrescentado', 'Acrescentar println! antes do método'], 0, 'A falha é E0596: o parâmetro compartilhado não permite emprestar *s para escrita. A assinatura, a dona e o argumento devem permitir a alteração.', { visual: code(sharedWrite, [1, 2]) }),
            gen((rng) => {
              const n = randInt(rng, 3, 10);
              const text = 'x'.repeat(n);
              return num('Quantos bytes a String tem após as duas chamadas?', n + 2, `A String começa com ${n} bytes ASCII. Cada chamada acrescenta um byte (!): ${n} + 2 = ${n + 2}.`, { visual: code(`fn exclaim(s: &mut String) {
    s.push('!');
}
fn main() {
    let mut s =
        String::from("${text}");
    exclaim(&mut s);
    exclaim(&mut s);
    println!("{}", s.len());
}`) });
            }),
            fill('Complete a responsabilidade da função:', 'Uma função que altera a String por empréstimo precisa receber acesso ___.', ['mutável'], ['só de leitura', 'sem dono'], 'O empréstimo mutável permite escrever sem transferir a posse.'),
            codePuzzle('Monte a escrita emprestada. A saída deve ser 6 metal!, em uma linha.', [
              'fn main() {',
              '    let mut s = String::from("metal");',
              '    let r = &mut s;',
              "    r.push('!');",
              '    let n = r.len();',
              '    println!("{n} {s}");',
              '}',
            ], ['    let r = &s;', '    let s = String::from("metal");'], 'O programa imprime 6 metal!: a escrita acrescenta um byte; n mede o resultado; depois do último uso de r, s pode ser lida diretamente.'),
            mcq('O asterisco aparece em *n na função. Por quê?', ['Para alterar o inteiro apontado', 'Para multiplicar o endereço', 'Para clonar o inteiro', 'Para devolver a posse'], 0, 'O parâmetro n é uma referência mutável. *n acessa o inteiro emprestado para somar 1. O programa imprime 5.', { visual: code(`fn increment(n: &mut i32) {
    *n += 1;
}
fn main() {
    let mut count = 4;
    increment(&mut count);
    println!("{count}");
}`, [2]) }),
          ],
        },
      ],
    },
    {
      id: 'ro-borrow-regras', title: 'As regras do borrow checker', parts: [
        {
          card: [
            {
              title: 'Muitos leitores OU um escritor',
              body: 'Para a mesma String, empréstimos compartilhados podem coexistir. Um empréstimo mutável exige exclusividade enquanto estiver em uso. No código abaixo, `a` ainda será usado na impressão quando tentamos criar `b`: os dois empréstimos de escrita se sobrepõem. O resultado é E0499, antes da execução.',
              visual: code(twoWriters, [3, 4, 5], 'Não compila: E0499'),
            },
            {
              title: 'Permissões que não se misturam',
              body: 'Avance para comparar situações. O erro é sobre empréstimos incompatíveis do mesmo dado, mesmo em um programa com uma única thread.',
              visual: borrowSteps([
                { access: 'Dois leitores: permitido', info: 'Referências imutáveis podem ler a mesma String durante intervalos sobrepostos.' },
                { access: 'Dois escritores: E0499', info: 'Criar outro empréstimo mutável falha se o anterior ainda será usado.' },
                { access: 'Leitor + escritor: E0502', info: 'Criar um empréstimo mutável falha se a referência de leitura ainda será usada.' },
              ]),
            },
          ],
          exercises: [
            mcq('Qual combinação é permitida para o mesmo dado?', ['Vários leitores compartilhados', 'Dois escritores sobrepostos', 'Leitor e escritor incompatíveis sobrepostos', 'Qualquer combinação se houver só uma thread'], 0, 'Várias leituras compartilhadas são permitidas. A exclusividade da escrita é verificada também em uma única thread.'),
            mcq('O programa com a e b compila?', ['Não; E0499, dois empréstimos mutáveis sobrepostos', 'Sim; imprime metal metal', 'Não; E0106 na assinatura', 'Sim; b recebe uma cópia'], 0, 'E0499: cannot borrow `s` as mutable more than once at a time. a será usado depois da criação de b. Termine o uso de a antes de criar b.', { visual: code(twoWriters, [4]) }),
            mcq('Em qual linha começa o segundo empréstimo incompatível?', ['Linha 4', 'Linha 2', 'Linha 3', 'Linha 6'], 0, 'Na linha 4 criamos b enquanto o empréstimo de a precisa durar até a impressão da linha 5. A linha 3 é a origem do primeiro empréstimo.', { visual: code(twoWriters, [3, 4, 5]) }),
            mcq('Agora r só lê. O novo programa compila?', ['Não; E0502, leitura ainda ativa ao criar escrita', 'Não; E0499, duas referências mutáveis', 'Sim; imutável não conta como empréstimo', 'Sim; imprime metal metal'], 0, 'E0502: cannot borrow `s` as mutable because it is also borrowed as immutable. r ainda será lido na impressão. Use r antes de criar w, sem voltar a usá-lo depois.', { visual: code(mixedBorrows, [3, 4, 5]) }),
            match('Associe o código de erro à causa:', [['E0499', 'dois empréstimos mutáveis incompatíveis'], ['E0502', 'empréstimos incompatíveis de leitura e escrita'], ['E0596', 'tentativa de escrita sem permissão mutável']], 'E0499 e E0502 tratam de conflitos entre acessos; E0596 aparece quando o acesso solicitado não tem permissão de mutação.'),
            gen((rng) => {
              const n = randInt(rng, 2, 9);
              return mcq('Mudar o valor inicial resolve este erro?', ['Não; continua E0499', `Sim; imprime ${n} ${n}`, 'Não; passa a ser E0106', 'Sim; referências clonam o inteiro'], 0, 'O valor numérico não muda a regra. E0499 ocorre porque a e b tomam empréstimos mutáveis do mesmo n e ambos são usados depois. Separe os intervalos de uso.', { visual: code(`fn main() {
    let mut n = ${n};
    let a = &mut n;
    let b = &mut n;
    println!("{a} {b}");
}`) });
            }),
            codePuzzle('Separe os empréstimos mutáveis. Imprima metal e depois metal!, em duas linhas.', [
              'fn main() {',
              '    let mut s = String::from("metal");',
              '    let a = &mut s;',
              '    println!("{a}");',
              '    let b = &mut s;',
              "    b.push('!');",
              '    println!("{b}");',
              '}',
            ], ['    println!("{a} {b}");', '    let b = &s;'], 'O último uso de a vem antes de criar b. b pode alterar a mesma String porque os empréstimos não se sobrepõem; as duas impressões mostram a mudança.'),
            mcq('Qual correção mantém a intenção de ler e só depois alterar?', ['Imprimir r antes de criar w e não usar r depois', 'Só acrescentar mut no nome r', 'Só trocar os nomes r e w', 'Criar ainda outra referência imutável'], 0, 'O conflito é temporal. Se a última leitura de r vier antes do empréstimo mutável, a alteração pode ocorrer com exclusividade.', { visual: code(mixedBorrows) }),
          ],
        },
        {
          card: [
            {
              title: 'O último uso importa',
              body: 'Este programa compila e imprime metal e metal!, em duas linhas. O último uso de `r` acontece antes de criarmos `w`. O borrow checker não exige esperar pela chave final de main: esse comportamento é conhecido como non-lexical lifetimes (NLL). Colocar outra impressão de `r` depois de criar `w` faria o empréstimo anterior durar mais e causaria E0502.',
              visual: code(lastUse, [4, 5], 'Leitura termina; escrita começa'),
            },
            {
              title: 'Linha do tempo das permissões',
              body: 'A variável pode continuar escrita no código do mesmo bloco mesmo depois de o empréstimo ter terminado.',
              visual: table(['Trecho', 'Acesso necessário'], [['Até imprimir r', 'Leitura por r'], ['Depois da impressão', 'r não é mais usado'], ['Criar e usar w', 'Escrita exclusiva']]),
            },
            {
              title: 'No seu computador',
              body: 'Dia 8 do roteiro: no projeto abaixo, tente primeiro criar duas referências mutáveis à String metal e imprimir ambas depois. Rode a verificação e confirme E0499. Corrija imprimindo a primeira referência antes de criar a segunda; use a segunda para acrescentar ! e imprimi-la. Pronto quando a saída tiver metal e metal!, em duas linhas, e o Clippy não emitir avisos. Guarde a versão errada só como comentário ou fora do arquivo compilado.',
              visual: code('cargo new borrow_rules --edition 2024\ncd borrow_rules\ncargo check\ncargo run\ncargo clippy -- -D warnings', [], 'Terminal'),
            },
          ],
          exercises: [
            tf('O empréstimo de uma referência local sempre precisa durar até a chave final do bloco.', false, 'Quando a referência deixa de ser necessária, o empréstimo pode terminar antes do fim do bloco. O compilador considera seus usos.'),
            mcq('Por que o exemplo com r e depois w compila?', ['O último uso de r vem antes de criar w', 'A String foi clonada', 'println! transforma & em &mut', 'NLL desativa a regra de exclusividade'], 0, 'Os empréstimos são compatíveis porque não se sobrepõem. NLL encurta o intervalo necessário; a regra de exclusividade continua valendo.', { visual: code(lastUse, [4, 5]) }),
            mcq('Dois empréstimos mutáveis de dados diferentes: compila?', ['Sim; imprime 3 6', 'Não; E0499 por existir mais de um &mut', 'Não; E0502 na impressão', 'Sim; imprime 2 4'], 0, 'a aponta para x; b aponta para y. Como os dados são diferentes, cada um pode ter seu empréstimo exclusivo. Os incrementos produzem 3 e 6.', { visual: code(`fn main() {
    let mut x = 2;
    let mut y = 4;
    let a = &mut x;
    let b = &mut y;
    *a += 1;
    *b += 2;
    println!("{a} {b}");
}`) }),
            mcq('As chaves internas tornam esta sequência válida?', ['Sim; imprime metal!', 'Não; E0499 dura até o fim de main', 'Não; E0596 porque r não tem mut', 'Sim; imprime metal sem !'], 0, 'r modifica a String no bloco interno. O empréstimo termina ali; depois s pode ser lida diretamente. A saída é metal!.', { visual: code(`fn main() {
    let mut s = String::from("metal");
    {
        let r = &mut s;
        r.push('!');
    }
    println!("{s}");
}`) }),
            gen((rng) => {
              const n = randInt(rng, 3, 25);
              const later = rng() < 0.5;
              return mcq('Esta ordem de usos compila?', later
                ? ['Não; E0502, r será usado depois da escrita', 'Sim; imprime o valor alterado', 'Não; E0106 na função main', 'Não; E0499, dois empréstimos mutáveis']
                : [`Sim; imprime ${n} e depois ${n + 1}`, 'Não; E0502 mesmo após o último uso de r', 'Não; E0106 na função main', 'Não; E0499, dois empréstimos mutáveis'], 0, later
                ? 'E0502: o empréstimo imutável de r precisa chegar à impressão final, atravessando a criação do mutável w. Mova a leitura de r para antes de criar w.'
                : `O último uso de r termina antes de criar w. As linhas de saída são ${n} e ${n + 1}; os intervalos de leitura e escrita não se sobrepõem.`, { visual: code(`fn main() {
    let mut n = ${n};
    let r = &n;
${later ? '' : '    println!("{r}");\n'}    let w = &mut n;
    *w += 1;
    println!("{w}");
${later ? '    println!("{r}");\n' : ''}}`) });
            }),
            codePuzzle('Leia primeiro e altere depois. A saída deve ter metal e metal!, nessa ordem.', [
              'fn main() {',
              '    let mut s = String::from("metal");',
              '    let r = &s;',
              '    println!("{r}");',
              '    let w = &mut s;',
              "    w.push('!');",
              '    println!("{w}");',
              '}',
            ], ['    println!("{r} {w}");', '    let w = &s;'], 'A impressão é o último uso de r antes do empréstimo mutável. Depois, w altera a String e imprime a segunda linha. O distrator que usa r e w juntos manteria os empréstimos sobrepostos.'),
            mcq('Se imprimirmos r novamente depois da impressão de w, o exemplo continua válido?', ['Não; E0502, a leitura de r passa a atravessar a escrita', 'Sim; o primeiro println! destrói r', 'Sim; o nome r saiu do escopo', 'Não; E0106, falta um tipo em main'], 0, 'Um uso posterior de r estende a necessidade do empréstimo imutável. Assim, criar w entra em conflito com ele. Retire esse uso posterior ou faça todas as leituras antes da escrita.', { visual: code(lastUse) }),
            mcq('No laço abaixo, por que acrescentar um elemento falha?', ['E0502: o laço ainda mantém o vetor emprestado para leitura', 'E0499: há dois laços mutáveis', 'E0106: falta lifetime em main', 'Compila; o laço só visita os itens antigos'], 0, 'Dia 9 do roteiro. E0502: v.push solicita escrita enquanto o laço usa um empréstimo de leitura do mesmo vetor. Faça as leituras primeiro e acrescente depois do laço. A inserção também pode realocar os dados, por isso não se deve manter referências aos elementos durante ela.', { visual: code(`fn main() {
    let mut v = vec![1, 2];
    for x in &v {
        println!("{x}");
        v.push(1);
    }
}`, [3, 5]) }),
          ],
        },
      ],
    },
    {
      id: 'ro-borrow-dangling', title: 'Referências penduradas e tempo de vida do empréstimo', parts: [
        {
          card: [
            {
              title: 'Uma referência precisa de dados vivos',
              body: 'Esta tentativa não compila: E0106, missing lifetime specifier. A assinatura promete devolver uma referência, mas não recebe nenhuma entrada da qual emprestar. Além disso, `s` é local e será destruída ao sair da função: devolver uma referência a ela deixaria acesso a dados inválidos. Rust impede esse problema antes de executar. Escrever uma anotação de lifetime não faz a String viver mais.',
              visual: code(noSource, [1, 3], 'Tentativa inválida: E0106'),
            },
            {
              title: 'Devolva a posse do valor criado',
              body: 'Se a função cria uma String para o chamador, devolva a própria String. A posse passa para `s` em main; o texto continua vivo e a saída é metal. Esse retorno não clona a String.',
              visual: code(ownedReturn, [1, 2, 6], 'Retorno com posse'),
            },
            {
              title: 'Dois caminhos na memória',
              body: 'Compare o caminho válido com a tentativa rejeitada. O esquema acompanha a versão com retorno de posse.',
              visual: borrowSteps([
                { access: 'Função cria o valor', info: 'Na versão válida, a String nasce dentro de create.' },
                { access: 'Posse vai para main', info: 'O retorno transfere a String ao chamador. Não fica uma referência a uma variável local destruída.' },
                { access: 's mantém os dados vivos', info: '`s` em main possui a String retornada e pode imprimi-la.' },
              ]),
            },
          ],
          exercises: [
            mcq('O que seria uma referência pendurada?', ['Acesso a dados que já não são válidos', 'Duas leituras válidas do mesmo texto', 'Uma String retornada com posse', 'Um inteiro copiado para outra variável'], 0, 'Uma referência precisa apontar para dados vivos durante seu uso. Se o dono liberasse os dados antes disso, o acesso seria inválido.'),
            mcq('Qual erro aparece na assinatura de bad?', ['E0106: falta especificador de lifetime', 'E0499: dois escritores', 'E0596: falta mut na variável', 'Compila; imprime metal'], 0, 'E0106: missing lifetime specifier. Não há entrada emprestada que dê origem ao retorno. Como o texto é criado na função, a correção adequada aqui é retornar a String com posse.', { visual: code(noSource, [1]) }),
            mcq('A versão que devolve String compila e imprime o quê?', ['metal', 'Uma referência inválida', 'Uma string vazia', 'Não compila: E0106'], 0, 'A posse da String é transferida ao chamador. O valor continua válido em main e a impressão mostra metal.', { visual: code(ownedReturn) }),
            tf('Uma anotação de lifetime pode manter viva uma String local depois que seu dono foi destruído.', false, 'Anotações descrevem relações entre referências. Não mudam quando valores são destruídos nem recuperam dados liberados.'),
            gen((rng) => {
              const n = randInt(rng, 4, 30);
              return num('Qual número é impresso após devolver o valor com posse?', n, `create devolve o inteiro ${n}, não uma referência à variável local. main guarda o valor retornado e o imprime.`, { visual: code(`fn create() -> i32 {
    let n = ${n};
    n
}
fn main() {
    let value = create();
    println!("{value}");
}`) });
            }),
            mcq('A entrada resolve a assinatura. Mas devolver local compila?', ['Não; E0515, referência a variável local', 'Sim; a entrada mantém qualquer String viva', 'Não; E0499, dois empréstimos mutáveis', 'Sim; imprime metal'], 0, 'E0515: cannot return reference to local variable `local`. Com uma entrada emprestada, Rust consegue relacionar os tipos da assinatura, mas o corpo devolve outro texto, criado localmente. Retorne um valor com posse ou uma referência à entrada, sem criar esse local.', { visual: code(localReturn, [2, 3], 'Tentativa inválida: E0515') }),
            codePuzzle('Mova a posse de s para owned, só então empreste para r e imprima metal.', [
              'fn main() {',
              '    let s = String::from("metal");',
              '    let owned = s;',
              '    let r = &owned;',
              '    println!("{r}");',
              '}',
            ], ['    let owned = &s;', '    println!("{s}");'], 's move a String para owned, que se torna a dona. Só então criamos uma referência à nova dona. O objetivo exige transferir a posse, não apenas criar outra referência.'),
            match('Associe cada situação:', [['E0106 na assinatura', 'falta uma relação de lifetime exigida pelo tipo'], ['E0515 no retorno', 'referência aponta para valor local que será descartado'], ['Retornar String', 'chamador recebe a posse do texto criado']], 'Uma assinatura bem formada ainda pode ter um corpo inválido. Retornar o valor com posse resolve o caso em que o texto precisa nascer na função e sobreviver ao retorno.'),
          ],
        },
        {
          card: [
            {
              title: 'Emprestar a entrada é diferente de criar um local',
              body: '`echo` só devolve o acesso recebido. Como há uma única referência de entrada, Rust deduz a relação com o retorno, sem anotação explícita. O dono continua em main. A saída é metal e depois 0, em duas linhas: depois do último uso de `r`, podemos apagar o texto. Apagar antes dessa leitura daria E0502.',
              visual: code(echoFunction, [1, 7, 8, 9], 'O dono continua vivo'),
            },
            {
              title: 'Fim do empréstimo não é fim do dono',
              body: 'Um número calculado a partir do texto pode sobreviver à alteração do texto. Uma referência ainda em uso exige que o dado continue válido e que os acessos sejam compatíveis.',
              visual: table(['Valor guardado', 'Depende do texto vivo?'], [['Número do tamanho', 'Não; é um valor separado'], ['Referência ao texto', 'Sim, durante seu uso'], ['String retornada', 'Tem sua própria posse']]),
            },
            {
              title: 'No seu computador',
              body: 'Dia 9 do roteiro: crie o projeto abaixo. Escreva uma função que cria e devolve a String metal com posse. Em main, calcule o tamanho com uma função que recebe texto por referência, guarde o número, apague o texto e imprima o número guardado e o novo tamanho: 5 e 0, em duas linhas. Em uma tentativa separada, devolva referência a uma String local e confira E0106; com a função bad que recebe entrada mostrada na parte anterior, confira E0515. Pronto quando a versão válida passar no Clippy sem avisos. Não deixe as funções inválidas no arquivo compilado.',
              visual: code('cargo new borrow_valid --edition 2024\ncd borrow_valid\ncargo check\ncargo run\ncargo clippy -- -D warnings', [], 'Terminal'),
            },
          ],
          exercises: [
            mcq('Na função echo, de onde vem a referência devolvida?', ['Do texto recebido por referência', 'De uma nova String local', 'De uma cópia criada por println!', 'De uma variável global obrigatória'], 0, 'echo devolve a própria entrada emprestada. O dono continua no chamador; o retorno não cria nem prolonga a vida dos dados.', { visual: code(echoFunction, [1, 2]) }),
            mcq('Qual é a saída da versão com echo?', ['metal / 0', 'metal / 5', '0 / metal', 'Não compila: qualquer retorno de referência é proibido'], 0, 'r é impresso enquanto s contém metal. Esse é seu último uso. s.clear pode então apagar o texto e len passa a ser zero. A barra separa as linhas.', { visual: code(echoFunction) }),
            mcq('Apagar antes do último uso de r compila?', ['Não; E0502, clear precisa de escrita durante o empréstimo de leitura', 'Sim; r guarda uma cópia do texto', 'Não; E0106 na declaração de r', 'Sim; imprime uma linha vazia'], 0, 'E0502: s.clear precisa de empréstimo mutável, mas r ainda será usado para ler. Mova a impressão de r para antes de clear ou não use r após a alteração.', { visual: code(clearTooEarly, [3, 4, 5]) }),
            num('Por que o número continua disponível? Qual é a primeira linha?', 5, 'len devolve um usize separado. Esse número vale 5 e não aponta para a String. Depois de clear, o tamanho atual é 0, mas o número guardado continua 5.', { visual: code(`fn main() {
    let mut s = String::from("metal");
    let n = s.len();
    s.clear();
    println!("{n}");
    println!("{}", s.len());
}`) }),
            gen((rng) => {
              const n = randInt(rng, 3, 14);
              const text = 'z'.repeat(n);
              return num('Que número o programa imprime depois de apagar o texto?', n, `O número ${n} foi calculado antes de clear e guardado por valor. Ele não é uma referência, portanto continua ${n} mesmo quando a String fica vazia.`, { visual: code(`fn main() {
    let mut s =
        String::from("${text}");
    let r = &s;
    let n = r.len();
    s.clear();
    println!("{n}");
}`) });
            }),
            codePuzzle('Termine a leitura antes de apagar. A saída deve ter metal e 0, nessa ordem.', [
              'fn main() {',
              '    let mut s = String::from("metal");',
              '    let r = &s;',
              '    println!("{r}");',
              '    s.clear();',
              '    let n = s.len();',
              '    println!("{n}");',
              '}',
            ], ['    let n = r.len();', '    println!("{r} {n}");'], 'A referência é usada pela última vez antes de clear. Depois medimos a String vazia. Reutilizar r depois da alteração estenderia o empréstimo e causaria E0502.'),
            mcq('Declarar r fora do bloco mantém a String local viva?', ['Não; E0597, local não vive até a impressão', 'Sim; a referência vira dona', 'Não; E0499, dois escritores', 'Sim; imprime metal'], 0, 'E0597: `local` does not live long enough. local é destruída na chave do bloco interno, mas r seria usado depois. Mova a dona para o bloco externo ou faça a leitura antes de terminar o bloco interno.', { visual: code(`fn main() {
    let r;
    {
        let local =
            String::from("metal");
        r = &local;
    }
    println!("{r}");
}`, [4, 5, 6, 7, 8]) }),
            mcq('Qual regra explica tanto NLL quanto a rejeição de referências penduradas?', ['O acesso precisa ser compatível e os dados precisam viver durante todos os usos', 'Toda referência vive exatamente até a próxima linha', 'Uma referência sempre clona os dados para sobreviver', 'Anotar lifetime impede a destruição de qualquer dono'], 0, 'O compilador considera o intervalo necessário para cada uso. O empréstimo pode acabar cedo quando não há mais usos, mas não pode continuar acessando um dado já destruído nem atravessar uma escrita incompatível.'),
          ],
        },
      ],
    },
  ],
};

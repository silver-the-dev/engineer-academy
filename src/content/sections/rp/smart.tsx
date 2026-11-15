import React from 'react';
import type { UnitDef, VisualSpec } from '../../types';
import { code, fill, gen, match, mcq, multi, num, order, table, tf } from '../../helpers';
import { codePuzzle } from '../../codePractice';
import { randInt } from '../../../lib/random';
import { Arrow, Label, RectW } from '../../../components/plot/Plot';

// Cada avanço altera os donos/guardas e o estado do mesmo valor.
const trace = (states: [string, string, string][]): VisualSpec => ({
  name: 'stepper',
  props: {
    steps: states.length,
    height: 150,
    view: { xMin: 0, xMax: 10, yMin: 0, yMax: 4 },
    render: (k: number) => (
      <>
        <RectW x={0.3} y={1} w={3.9} h={2} />
        <RectW x={5.8} y={1} w={3.9} h={2} />
        <Label x={2.25} y={2} text={states[k][0]} anchor="middle" size={12} />
        <Arrow x1={4.4} y1={2} x2={5.6} y2={2} />
        <Label x={7.75} y={2} text={states[k][1]} anchor="middle" size={12} />
      </>
    ),
    info: (k: number) => states[k][2],
  },
});

const boxBasic = `fn main() {
    let b = Box::new(5);
    println!("{}", *b);
}`;
const boxMove = `fn main() {
    let a = Box::new(5);
    let b = a;
    println!("{}", *a);
    println!("{}", *b);
}`;
const infiniteList = `enum List {
    Cons(i32, List),
    Nil,
}
fn main() {}`;
const listDef = `enum List {
    Cons(i32, Box<List>),
    Nil,
}
fn sum(list: &List) -> i32 {
    match list {
        List::Nil => 0,
        List::Cons(n, tail) => {
            n + sum(tail)
        }
    }
}`;
const listProgram = `${listDef}
fn main() {
    let tail = List::Cons(
        3, Box::new(List::Nil),
    );
    let list = List::Cons(
        2, Box::new(tail),
    );
    println!("{}", sum(&list));
}`;
const rcBasic = `use std::rc::Rc;
fn main() {
    let a = Rc::new(String::from("oi"));
    let b = Rc::clone(&a);
    println!("{}",
        Rc::strong_count(&a));
    println!("{}", Rc::ptr_eq(&a, &b));
}`;
const rcScope = `use std::rc::Rc;
fn main() {
    let a = Rc::new(7);
    let b = Rc::clone(&a);
    {
        let c = Rc::clone(&b);
        println!("{}",
            Rc::strong_count(&c));
    }
    println!("{}",
        Rc::strong_count(&a));
}`;
const rcWrite = `use std::rc::Rc;
fn main() {
    let mut a = Rc::new(5);
    *a = 8;
    println!("{}", a);
}`;
const refBasic = `use std::cell::RefCell;
fn main() {
    let c = RefCell::new(4);
    {
        let mut w = c.borrow_mut();
        *w += 3;
    }
    println!("{}", c.borrow());
}`;
const refPanic = `use std::cell::RefCell;
fn main() {
    let c = RefCell::new(4);
    let first = c.borrow_mut();
    let second = c.borrow_mut();
    println!("{} {}", first, second);
}`;
const shared = `use std::cell::RefCell;
use std::rc::Rc;
fn main() {
    let a = Rc::new(RefCell::new(10));
    let b = Rc::clone(&a);
    *b.borrow_mut() += 2;
    println!("{}", a.borrow());
}`;
const weakBasic = `use std::rc::Rc;
fn main() {
    let a = Rc::new(5);
    let w = Rc::downgrade(&a);
    println!("{}",
        w.upgrade().is_some());
    drop(a);
    println!("{}",
        w.upgrade().is_none());
}`;
const treeDef = `use std::cell::RefCell;
use std::rc::{Rc, Weak};
struct Node {
    parent: RefCell<Weak<Node>>,
    children: RefCell<Vec<Rc<Node>>>,
}
fn node() -> Rc<Node> {
    Rc::new(Node {
        parent:
            RefCell::new(Weak::new()),
        children: RefCell::new(vec![]),
    })
}`;
const tree = `${treeDef}
fn main() {
    let leaf = node();
    {
        let root = node();
        *leaf.parent.borrow_mut() =
            Rc::downgrade(&root);
        root.children.borrow_mut()
            .push(Rc::clone(&leaf));
        println!("{}",
            Rc::strong_count(&leaf));
    }
    let p = leaf.parent.borrow();
    println!("{}",
        p.upgrade().is_none());
}`;
const wrapDef = `use std::ops::Deref;
struct Wrap<T>(T);
impl<T> Deref for Wrap<T> {
    type Target = T;
    fn deref(&self) -> &Self::Target {
        &self.0
    }
}`;
const derefProgram = `${wrapDef}
fn main() {
    let x = Wrap(9);
    println!("{}", *x);
}`;
const dropDef = `struct Tag(&'static str);
impl Drop for Tag {
    fn drop(&mut self) {
        println!("{}", self.0);
    }
}`;
const dropProgram = `${dropDef}
fn main() {
    let _a = Tag("A");
    let _b = Tag("B");
    println!("fim");
}`;

export const rustSmart: UnitDef = {
  id: 'rp-smart',
  title: 'Smart pointers',
  icon: '🧷',
  subtitle: 'Heap, donos compartilhados e limpeza automática',
  source: 'The Rust Programming Language, edição 2024, cap. 15 (https://doc.rust-lang.org/book/ch15-00-smart-pointers.html); Desafio 50 Dias — Rust, módulo 6, desafio 39; retomada do desafio 12.',
  extra: true,
  guide: 'Box tem um dono e coloca o valor no heap; a indireção permite tipos recursivos de tamanho finito. Rc compartilha a posse numa única thread: clone soma um dono, drop retira um, e o último libera o valor. RefCell controla empréstimos em execução: várias leituras OU uma escrita; conflito em borrow/borrow_mut causa pânico. Rc com RefCell combina compartilhamento e mutabilidade interior. Weak observa sem manter o valor vivo: upgrade retorna Option. Em árvores, filhos são Rc e o elo para o pai é Weak. Deref permite acessar o alvo e converter referências; Drop faz a limpeza. Variáveis locais são destruídas em ordem inversa à declaração no mesmo escopo; campos de uma struct, na ordem de declaração. Prefira posse simples quando ela basta.',
  lessons: [
    {
      id: 'rp-smart-box', title: 'Box e tipos recursivos',
      parts: [
        {
          card: [
            {
              title: 'Um dono, um valor no heap',
              body: 'Box coloca um valor no heap e é dono dele. Na variável local fica o ponteiro que administra essa alocação. O asterisco acessa o valor: este programa imprime 5. Quando o Box é destruído, o valor e a alocação são liberados. Você não escreve uma chamada a free como em C.',
              visual: code(boxBasic, [2, 3], 'main.rs · imprime 5'),
              tip: 'Mover um Box transfere a posse; não duplica o conteúdo. Aqui falamos de Box de um inteiro, sem metadados adicionais.',
            },
            {
              title: 'Siga a posse',
              body: 'Avance: a alocação permanece a mesma durante o move. Só muda o dono. O último passo representa o fim do escopo do novo dono.',
              visual: trace([
                ['pilha: a', 'heap: 5', 'Após criar o Box, a é o único dono do inteiro no heap.'],
                ['pilha: b', 'heap: 5', 'Após mover para b, a fica indisponível; o inteiro não foi copiado.'],
                ['sem dono', 'liberado', 'Quando b é destruído, o Box libera sua alocação.'],
              ]),
            },
          ],
          exercises: [
            mcq('Onde fica o inteiro administrado pelo Box deste programa?', ['No heap', 'No nome da variável', 'No arquivo fonte durante a execução', 'Obrigatoriamente num registrador'], 0, 'O Box é o dono de uma alocação no heap que contém o inteiro. A variável local guarda o Box.', { visual: code(boxBasic) }),
            num('Que número o programa imprime?', 5, 'O asterisco desreferencia o Box e lê o inteiro 5.', { visual: code(boxBasic) }),
            tf('Mover um Box cria automaticamente outra alocação com uma cópia do valor.', false, 'O move transfere o Box e sua posse. Não executa clone nem duplica a alocação.'),
            match('Associe cada operação ao efeito:', [['Criação de Box', 'Aloca e assume a posse'], ['Move de Box', 'Transfere o dono'], ['Destruição de Box', 'Libera o valor e a alocação']], 'A criação estabelece a posse, o move a transfere e a destruição faz a limpeza.'),
            gen((rng) => {
              const n = randInt(rng, 3, 18);
              const d = randInt(rng, 2, 6);
              return num('Que número aparece na saída?', n + d, `O inteiro no heap começa em ${n}. O acesso mutável soma ${d}: resultado ${n + d}.`, { visual: code(`fn main() {
    let mut b = Box::new(${n});
    *b += ${d};
    println!("{}", *b);
}`) });
            }),
            fill('Complete a regra de posse:', 'Um move torna o nome anterior ___ para acessar o valor movido.', ['indisponível'], ['um segundo dono', 'uma cópia independente'], 'O nome antigo não pode mais acessar o valor que foi transferido.'),
            mcq('A listagem compila? Qual é a primeira tentativa de usar o valor movido?', ['Não; a leitura de a na linha 4', 'Sim; imprime 5 duas vezes', 'Não; Box não aceita inteiros', 'Sim; mover equivale a clonar'], 0, 'E0382: “borrow of moved value: `a`”. A linha 3 move o Box para b; a linha 4 tenta acessá-lo. Leia por b ou use um empréstimo se precisar conservar a posse em a.', { visual: code(boxMove, [3, 4, 5], 'Erro intencional · E0382') }),
            codePuzzle('Monte o programa que move o Box, altera pelo novo dono e imprime 9.', ['fn main() {', '    let a = Box::new(7);', '    let mut b = a;', '    *b += 2;', '    println!("{}", *b);', '}'], ['    let b = a;', '    *a += 2;'], 'a passa a posse para b. b precisa ser mutável para alterar o inteiro; depois da soma, a leitura por b imprime 9.'),
          ],
        },
        {
          card: [
            {
              title: 'Uma lista precisa de indireção',
              body: 'Se cada nó contivesse outra lista diretamente, calcular seu tamanho exigiria conhecer o tamanho de outra lista, sem fim. A variante Cons guarda um inteiro e um Box para o restante; Nil encerra a lista. O Box tem tamanho conhecido mesmo que a lista tenha muitos nós. A função sum empresta a lista e soma seus valores; o programa imprime 5.',
              visual: code(listProgram, [2, 7, 9], '2 → 3 → Nil · soma 5'),
              tip: 'O erro E0072 diz “recursive type `List` has infinite size”. Option sozinho não acrescenta indireção: uma lista com Option também precisa de um ponteiro no elo recursivo.',
            },
            {
              title: 'Tamanho finito não é comprimento fixo',
              body: 'Cada nó tem espaço para um ponteiro, independentemente da quantidade de nós seguintes. O tamanho exato do enum depende do alvo e do alinhamento; não precisamos supor um total de bytes.',
              visual: table(['Parte', 'Guarda'], [['Cons', 'inteiro + Box do resto'], ['Box do resto', 'ponteiro de tamanho conhecido'], ['Nil', 'fim da lista']]),
            },
            {
              title: 'No seu computador',
              body: 'Crie um projeto com cargo new lista_box, edição 2024. Retome o Box do desafio 12 e monte a lista 2 → 3 → 5 → Nil usando um enum e Box. Implemente uma função que empresta a lista e soma os valores. Pronto quando cargo run imprimir 10, cargo test verificar a lista vazia e a lista de três nós, cargo fmt --check passar e cargo clippy -- -D warnings terminar sem avisos. Não use unwrap ou expect.',
            },
          ],
          exercises: [
            mcq('Para que serve Nil na lista?', ['Representar o fim', 'Alocar outro inteiro', 'Clonar todos os nós', 'Proibir listas vazias'], 0, 'Nil é a variante sem próximo nó. Ela dá o caso base da recursão.'),
            mcq('Qual diagnóstico corresponde à definição mostrada?', ['E0072: tipo recursivo de tamanho infinito', 'E0382: uso após move', 'E0308: tipos incompatíveis na soma', 'Nenhum: todo enum recursivo tem tamanho finito'], 0, 'E0072: “recursive type `List` has infinite size”. Cons contém List diretamente. Troque o segundo campo por Box<List> e crie o elo com Box::new.', { visual: code(infiniteList, [2], 'Erro intencional · E0072') }),
            tf('Só trocar o elo recursivo direto por Option<List> resolve o tamanho infinito.', false, 'Option pode representar ausência, mas seu caso Some ainda contém List diretamente. Use Option<Box<List>> ou um enum com Box no elo.'),
            num('Qual a soma impressa pela lista?', 5, 'sum visita o nó 2, depois o nó 3 e por fim Nil, que vale 0. Total: 2 + 3 + 0 = 5.', { visual: code(listProgram) }),
            gen((rng) => {
              const a = randInt(rng, 2, 9);
              const b = randInt(rng, 10, 18);
              return num('Qual soma o programa imprime?', a + b, `Há dois nós com ${a} e ${b}. Nil contribui 0, portanto a soma é ${a + b}.`, { visual: code(`${listDef}
fn main() {
    let end = List::Cons(
        ${b}, Box::new(List::Nil),
    );
    let list = List::Cons(
        ${a}, Box::new(end),
    );
    println!("{}", sum(&list));
}`) });
            }),
            fill('Complete o papel da indireção:', 'O nó guarda um ___ de tamanho conhecido para o restante da lista.', ['ponteiro'], ['número ilimitado de nós embutidos', 'arquivo executável'], 'O Box guarda o ponteiro; os nós seguintes ficam em outras alocações. Assim a definição deixa de se expandir dentro de si mesma.'),
            order('Ordene a avaliação da soma da lista 2 → 3 → Nil:', ['Visitar o nó 2', 'Visitar o nó 3', 'Encontrar Nil e devolver 0', 'Devolver 3 ao primeiro nó', 'Devolver 5 ao chamador'], 'A descida chega ao caso base. Na volta, 3 + 0 dá 3 e 2 + 3 dá 5.'),
            codePuzzle('Monte um programa que aloca um par, empresta o par e imprime sua soma, 7.', ['fn main() {', '    let b = Box::new((2, 5));', '    let pair = &*b;', '    let sum = pair.0 + pair.1;', '    println!("{}", sum);', '}'], ['    let pair = &b.0;', '    let sum = pair.0 - pair.1;'], 'O Box torna o par acessível por desreferência. pair empresta o par inteiro; seus campos somam 2 + 5 = 7. A posse continua em b.'),
          ],
        },
      ],
    },
    {
      id: 'rp-smart-rc', title: 'Rc e contagem de referências',
      parts: [
        {
          card: [
            {
              title: 'Vários donos do mesmo valor',
              body: 'Rc permite posse compartilhada numa única thread. Rc::clone cria outro ponteiro para a mesma alocação e incrementa strong_count; não clona a String interna. Aqui a saída é 2 e depois true: dois donos, um único texto. O último dono a sair libera o valor.',
              visual: code(rcBasic, [4, 5, 6], 'Dois donos · uma alocação'),
              tip: 'Não confunda clonar o Rc com clonar o conteúdo. Rc não é a ferramenta para compartilhar posse entre threads; isso será assunto de Arc.',
            },
            {
              title: 'Veja o contador mudar',
              body: 'Cada clone soma um dono. Cada destruição de um Rc retira um. Avance e confira quando o valor pode ser liberado.',
              visual: trace([
                ['a', 'strong: 1', 'A criação estabelece o primeiro dono.'],
                ['a e b', 'strong: 2', 'Rc::clone cria b, apontando para o mesmo valor.'],
                ['só a', 'strong: 1', 'A destruição de b deixa a como único dono.'],
                ['nenhum', 'valor liberado', 'A destruição de a leva a contagem forte a zero.'],
              ]),
            },
          ],
          exercises: [
            mcq('O que Rc::clone duplica?', ['O ponteiro dono, compartilhando a alocação', 'Todo o texto numa alocação independente', 'O programa inteiro', 'A thread atual'], 0, 'O clone do Rc compartilha a mesma alocação e aumenta a contagem forte. Clonar o conteúdo é outra operação.'),
            num('Qual é a primeira linha numérica da saída?', 2, 'a e b são dois donos do mesmo texto. A contagem forte é 2.', { visual: code(rcBasic) }),
            tf('Rc::ptr_eq verifica se dois Rc apontam para a mesma alocação.', true, 'Essa comparação olha a identidade da alocação, não apenas a igualdade dos valores internos.'),
            match('Associe operação e efeito na contagem forte:', [['Criar Rc novo', 'Começa em 1'], ['Clonar esse Rc', 'Soma 1'], ['Destruir um clone', 'Subtrai 1']], 'Cada ponteiro Rc vivo é um dono forte. A alocação começa com um dono e acompanha clones e destruições.'),
            gen((rng) => {
              const n = randInt(rng, 2, 6);
              return num('Qual contagem o programa imprime?', n + 1, `Além de a, o vetor guarda ${n} clones. Total: 1 + ${n} = ${n + 1}.`, { visual: code(`use std::rc::Rc;
fn main() {
    let a = Rc::new(8);
    let mut owners = Vec::new();
    for _ in 0..${n} {
        owners.push(Rc::clone(&a));
    }
    println!("{}",
        Rc::strong_count(&a));
}`) });
            }),
            mcq('Um empréstimo comum de a acrescenta um dono forte?', ['Não; só criar outro Rc acrescenta um dono', 'Sim; qualquer referência soma um', 'Sim; cada leitura soma dois', 'Não; a contagem nunca muda'], 0, 'Emprestar o Rc não cria outro Rc. Por isso passar uma referência a strong_count não altera o contador.'),
            multi('Selecione as afirmações corretas sobre Rc:', ['Vários Rc podem manter o mesmo valor vivo', 'Rc::clone copia sempre o conteúdo inteiro', 'Rc é adequado para posse compartilhada numa thread', 'Todo empréstimo de Rc aumenta strong_count'], [0, 2], 'Rc compartilha a alocação e usa contagem não atômica. Clones somam donos; empréstimos comuns não.'),
            codePuzzle('Monte o programa: crie dois donos, imprima pelo clone e libere-o em seguida. Saída: 6.', ['fn main() {', '    let a = std::rc::Rc::new(6);', '    let b = std::rc::Rc::clone(&a);', '    println!("{}", *b);', '    drop(b);', '}'], ['    let b = *a;', '    println!("{}", b + 1);'], 'O clone mantém o mesmo inteiro. Primeiro imprima 6 usando b; só depois consuma b com drop. a segue dono até o fim de main.'),
          ],
        },
        {
          card: [
            {
              title: 'Escopo também altera a contagem',
              body: 'O bloco interno cria c como terceiro dono. A primeira saída é 3. Ao fechar o bloco, c é destruído; a segunda saída é 2, pois a e b ainda existem. Um move apenas muda o nome do dono, sem incrementar a contagem.',
              visual: code(rcScope, [6, 9, 10, 11], 'Saída: 3 e depois 2'),
            },
            {
              title: 'Rc não dá escrita compartilhada',
              body: 'Ter um Rc mutável permite trocar o próprio ponteiro, mas não dá uma referência mutável ao valor compartilhado. Mais adiante combinaremos Rc com RefCell. Se houver um único dono e nenhum Weak, Rc::get_mut pode fornecer acesso mutável; o retorno Option obriga a tratar a possibilidade de falha.',
              visual: table(['Operação', 'Contagem forte'], [['Clone de a', 'Aumenta'], ['Move de a', 'Não muda'], ['Fim do bloco de c', 'Diminui'], ['Empréstimo de a', 'Não muda']]),
            },
            {
              title: 'No seu computador',
              body: 'Crie cargo new donos_rc, edição 2024. Comece o desafio 39 pelo contador: crie um Rc, um clone no escopo externo e outro num bloco interno. Imprima strong_count antes do bloco, dentro dele e depois. Pronto quando cargo run mostrar 2, 3 e 2 em linhas separadas, um teste com Rc::ptr_eq confirmar a mesma alocação, cargo fmt --check passar e cargo clippy -- -D warnings não emitir avisos. Não use unwrap ou expect.',
            },
          ],
          exercises: [
            num('Qual contagem é impressa dentro do bloco interno?', 3, 'a, b e c existem ao mesmo tempo. A contagem é 3.', { visual: code(rcScope, [6, 7, 8]) }),
            num('Qual contagem aparece depois do bloco?', 2, 'c saiu de escopo e seu Rc foi destruído. Restam a e b.', { visual: code(rcScope, [9, 10, 11]) }),
            tf('Mover um Rc para outra variável aumenta strong_count.', false, 'O move transfere um ponteiro já existente. Só a criação de outro dono forte, por exemplo com clone, aumenta a contagem.'),
            gen((rng) => {
              const n = randInt(rng, 2, 7);
              const removed = randInt(rng, 1, n - 1);
              return num('Qual contagem fica após truncate?', 1 + n - removed, `O vetor tinha ${n} donos e conserva ${n - removed}. Somando a, ficam ${1 + n - removed}. truncate destrói os clones retirados.`, { visual: code(`use std::rc::Rc;
fn main() {
    let a = Rc::new(4);
    let mut v = vec![Rc::clone(&a); ${n}];
    v.truncate(${n - removed});
    println!("{}",
        Rc::strong_count(&a));
}`) });
            }),
            mcq('A atribuição destacada compila?', ['Não; E0594, não há escrita por esse Rc', 'Sim; mut no nome permite escrita no inteiro', 'Não; E0072, tamanho infinito', 'Sim; Rc cria uma cópia ao escrever'], 0, 'E0594: “cannot assign to data in an `Rc`”. Rc não implementa DerefMut para dar escrita direta no valor compartilhado. Use RefCell para mutabilidade interior ou trate Rc::get_mut quando a posse for exclusiva.', { visual: code(rcWrite, [3, 4], 'Erro intencional · E0594') }),
            order('Um Rc a tem um clone b. Ordene a limpeza após drop(b) e depois drop(a):', ['Consumir b', 'Reduzir a contagem de 2 para 1', 'Consumir a', 'Reduzir a contagem de 1 para 0', 'Destruir o valor compartilhado'], 'O primeiro drop retira um dono. Somente o segundo retira o último e destrói o valor.'),
            mcq('Um nó tem quatro donos fortes. Três saem de escopo. O valor já é destruído?', ['Não; ainda resta um dono forte', 'Sim; basta um dono sair', 'Sim; quatro clones criam quatro valores', 'Não; Rc nunca libera valores'], 0, 'A contagem cai de 4 para 1. Enquanto há pelo menos um dono forte, o valor permanece vivo.'),
            codePuzzle('Monte o programa que conserva o clone b após destruir a e imprime 8.', ['fn main() {', '    let a = std::rc::Rc::new(8);', '    let b = std::rc::Rc::clone(&a);', '    drop(a);', '    println!("{}", *b);', '}'], ['    let b = a;', '    println!("{}", *a);'], 'b compartilha a posse antes de a ser destruído. Depois do drop(a), b mantém o inteiro vivo e imprime 8.'),
          ],
        },
      ],
    },
    {
      id: 'rp-smart-refcell', title: 'RefCell e mutabilidade interior',
      parts: [
        {
          card: [
            {
              title: 'O empréstimo tem uma guarda',
              body: 'RefCell guarda um valor e confere a regra de empréstimos durante a execução. borrow devolve uma guarda Ref para leitura; borrow_mut devolve RefMut para escrita exclusiva. O nome c não precisa de mut. A guarda w precisa de mut para alterar o inteiro. Ao fim do bloco, w é destruída, liberando a escrita. O programa imprime 7.',
              visual: code(refBasic, [4, 5, 6, 7], 'Guarda curta · sem conflito'),
              tip: 'A regra continua sendo várias leituras OU uma escrita. RefCell não a elimina: muda quando ela é conferida. A guarda deve ser destruída, não apenas deixar de ser usada.',
            },
            {
              title: 'Veja quem pode acessar',
              body: 'Avance pelos estados. Durante a escrita, nenhuma leitura pode ser aberta; depois da destruição da guarda, o acesso volta a ficar livre.',
              visual: trace([
                ['sem guarda', 'valor: 4', 'Nenhum empréstimo ativo: é possível pedir leitura ou escrita.'],
                ['w: escrita', 'valor: 4', 'Uma RefMut está viva. Pedir outra escrita ou uma leitura agora causaria pânico.'],
                ['w: escrita', 'valor: 7', 'A escrita exclusiva soma 3 ao valor.'],
                ['sem guarda', 'valor: 7', 'O fim do bloco destrói w. Uma nova leitura pode ser aberta.'],
              ]),
            },
          ],
          exercises: [
            match('Associe método e resultado:', [['borrow', 'Guarda de leitura Ref'], ['borrow_mut', 'Guarda de escrita RefMut'], ['try_borrow_mut', 'Result que pode recusar a escrita']], 'borrow e borrow_mut entram em pânico em caso de conflito. try_borrow_mut comunica o conflito em Err.'),
            num('Qual valor o programa imprime?', 7, 'A guarda exclusiva altera 4 para 7. Ela termina no bloco; a leitura seguinte pode abrir e observar 7.', { visual: code(refBasic) }),
            tf('Duas guardas de leitura da mesma RefCell podem coexistir.', true, 'Várias leituras são permitidas desde que não exista uma guarda de escrita ativa.'),
            gen((rng) => {
              const n = randInt(rng, 3, 16);
              const d = randInt(rng, 2, 7);
              return num('Qual é a saída numérica?', n + d, `A primeira chamada soma ${d} a ${n}. Sua guarda temporária termina no ponto e vírgula, e a leitura seguinte imprime ${n + d}.`, { visual: code(`use std::cell::RefCell;
fn main() {
    let c = RefCell::new(${n});
    *c.borrow_mut() += ${d};
    println!("{}", c.borrow());
}`) });
            }),
            mcq('O programa compila? O que acontece ao executar a linha 5?', ['Compila; a segunda escrita causa pânico', 'Não compila, com E0499', 'Compila e imprime dois valores', 'Não compila, com E0072'], 0, 'As duas chamadas a borrow_mut compilam, mas a segunda encontra first ainda viva. Ocorre pânico com BorrowMutError, antes do println. Não há código E0xxx: é falha em tempo de execução. Destrua first antes de pedir outra escrita.', { visual: code(refPanic, [4, 5], 'Compila · pânico intencional') }),
            fill('Complete a regra operacional:', 'Antes de pedir escrita, destrua todas as ___ ativas da célula.', ['guardas'], ['variáveis inteiras do programa', 'funções do arquivo'], 'Tanto as guardas Ref quanto RefMut impedem uma nova escrita enquanto estiverem vivas.'),
            mcq('Como tentar escrever sem provocar pânico quando houver conflito?', ['Usar try_borrow_mut e tratar o Result', 'Usar dois borrow_mut seguidos', 'Adicionar mut ao nome c e ignorar as guardas', 'Usar Rc::clone em qualquer valor'], 0, 'try_borrow_mut retorna Ok com uma guarda ou Err se houver empréstimo incompatível. Trate o resultado com match ou if let.'),
            codePuzzle('Monte o programa que altera a célula, libera a guarda e só então imprime 5.', ['fn main() {', '    let c = std::cell::RefCell::new(2);', '    let mut w = c.borrow_mut();', '    *w += 3;', '    drop(w);', '    println!("{}", c.borrow());', '}'], ['    let w = c.borrow_mut();', '    println!("{}", c.borrow_mut());'], 'A guarda mutável soma 3 ao inteiro. drop(w) encerra a escrita exclusiva; somente depois disso uma guarda de leitura pode imprimir 5.'),
          ],
        },
        {
          card: [
            {
              title: 'Compartilhar e alterar o mesmo valor',
              body: 'Rc e RefCell têm responsabilidades diferentes: Rc administra vários donos e RefCell administra os empréstimos do valor. Os dois nomes acessam a mesma célula. A alteração por b aparece na leitura por a, que imprime 12. Nenhum clone do inteiro foi criado.',
              visual: code(shared, [4, 5, 6, 7], 'Rc<RefCell<i32>> · saída 12'),
            },
            {
              title: 'Uma célula, várias portas de entrada',
              body: 'Clonar o Rc não cria outra RefCell. Uma guarda aberta por um dono também restringe os acessos feitos pelos outros donos. Abra guardas em blocos pequenos e não as mantenha sem necessidade.',
              visual: table(['Camada', 'Responsabilidade'], [['Rc externo', 'Contar donos'], ['RefCell interna', 'Conferir empréstimos'], ['Ref / RefMut', 'Manter o acesso ativo'], ['Inteiro', 'Valor compartilhado']]),
            },
            {
              title: 'No seu computador',
              body: 'Crie cargo new departamento_cell, edição 2024. Comece o desafio 39: modele Departamento com um contador e compartilhe-o entre dois nomes usando Rc<RefCell<Departamento>>. Some 3 por um nome e 4 pelo outro. Pronto quando cargo run imprimir 7 ao ler pelo dono original, um teste provar que try_borrow_mut falha enquanto uma leitura está viva e volta a funcionar após drop da guarda, cargo fmt --check passar e cargo clippy -- -D warnings não emitir avisos. Em uma execução separada, provoque o pânico com duas escritas; depois remova esse conflito do programa final. Não use unwrap ou expect.',
            },
          ],
          exercises: [
            mcq('Qual camada permite compartilhar a posse da célula?', ['Rc', 'RefMut', 'i32', 'println'], 0, 'Rc conta os donos. A RefCell fica dentro da alocação compartilhada e confere cada empréstimo.'),
            num('Que valor a leitura por a imprime?', 12, 'a e b acessam a mesma RefCell. A escrita por b soma 2 a 10; por isso a observa 12.', { visual: code(shared) }),
            tf('Clonar um Rc de RefCell cria uma célula independente e evita conflitos entre guardas.', false, 'O clone continua apontando para a mesma célula. Um empréstimo ativo nela vale para todos os donos.'),
            gen((rng) => {
              const start = randInt(rng, 5, 15);
              const inc = randInt(rng, 2, 6);
              return num('Qual valor compartilhado é impresso?', start + 2 * inc, `São duas escritas sucessivas e já encerradas: ${start} + ${inc} + ${inc} = ${start + 2 * inc}. A contagem de donos não é somada ao inteiro.`, { visual: code(`use std::cell::RefCell;
use std::rc::Rc;
fn main() {
    let a = Rc::new(RefCell::new(${start}));
    let b = Rc::clone(&a);
    *a.borrow_mut() += ${inc};
    *b.borrow_mut() += ${inc};
    println!("{}", a.borrow());
}`) });
            }),
            mcq('Que valor booleano o programa imprime?', ['true', 'false', 'Não compila: E0502', 'Ocorre pânico antes da saída'], 0, 'A guarda r mantém uma leitura na mesma célula acessada por b. try_borrow_mut encontra conflito e retorna Err, então is_err imprime true. O conflito foi tratado sem pânico.', { visual: code(`use std::cell::RefCell;
use std::rc::Rc;
fn main() {
    let a = Rc::new(RefCell::new(4));
    let b = Rc::clone(&a);
    let r = a.borrow();
    let blocked =
        b.try_borrow_mut().is_err();
    println!("{}", blocked);
    drop(r);
}`) }),
            multi('Quais situações respeitam a regra de uma mesma célula?', ['Duas guardas de leitura simultâneas', 'Uma guarda de escrita e uma de leitura simultâneas', 'Uma escrita após destruir todas as leituras', 'Duas guardas de escrita porque vieram de Rc diferentes'], [0, 2], 'Pode haver várias leituras ou uma única escrita. O nome do Rc usado para chegar à célula não muda essa regra.'),
            order('Ordene uma atualização enquanto já existe uma guarda de leitura:', ['Ler o valor pela guarda atual', 'Destruir a guarda de leitura', 'Abrir uma guarda de escrita', 'Alterar o valor por essa guarda', 'Destruir a guarda de escrita', 'Abrir uma nova leitura para conferir'], 'Cada acesso de escrita exige exclusividade. Feche a leitura anterior, altere, feche a escrita e só então confira por uma nova leitura.'),
            codePuzzle('Monte a atualização compartilhada que imprime 9 pelo dono original. Faça o drop do clone após a saída.', ['fn main() {', '    let c = std::cell::RefCell::new(4);', '    let a = std::rc::Rc::new(c);', '    let b = std::rc::Rc::clone(&a);', '    *b.borrow_mut() += 5;', '    println!("{}", a.borrow());', '    drop(b);', '}'], ['    *b.borrow() += 5;', '    let b = a;'], 'O Rc compartilha a única célula. A guarda de escrita temporária termina após somar 5, e a leitura por a imprime 9. b é destruído depois da saída, como pedido.'),
          ],
        },
      ],
    },
    {
      id: 'rp-smart-weak', title: 'Weak e ciclos de referência',
      parts: [
        {
          card: [
            {
              title: 'Observar sem ser dono',
              body: 'Um ciclo de donos fortes pode manter valores vivos para sempre: A possui B e B possui A, mesmo depois de os nomes externos sumirem. Weak representa um elo que não mantém o valor vivo. Rc::downgrade cria esse observador; upgrade tenta obter um Rc e retorna Option. A saída abaixo é true e true: primeiro o valor existe, depois ele já foi destruído.',
              visual: code(weakBasic, [4, 5, 6, 7, 8, 9], 'Weak não mantém o inteiro vivo'),
              tip: 'Um Weak vivo pode manter a estrutura de controle da alocação, mas não conserva o valor T depois que a contagem forte chega a zero. Trate None; não use unwrap para buscar o valor.',
            },
            {
              title: 'O último dono decide',
              body: 'Avance para separar contagem forte e fraca. O exemplo usa um único Weak explícito, que continua existindo após o inteiro ser destruído.',
              visual: trace([
                ['a: dono', 'forte 1; fraca 0', 'Um Rc mantém o inteiro vivo.'],
                ['a + w', 'forte 1; fraca 1', 'downgrade cria w sem aumentar a contagem forte.'],
                ['só w', 'valor destruído', 'drop(a) retira o último dono forte. O Weak permanece, mas upgrade agora devolve None.'],
              ]),
            },
          ],
          exercises: [
            mcq('Qual elo ajuda a evitar que um filho mantenha seu pai vivo?', ['Weak para o pai', 'Rc forte nas duas direções', 'Outro clone forte do pai', 'Box para copiar o pai inteiro'], 0, 'O elo Weak observa o pai sem possuir seu valor. Assim a referência de volta não fecha um ciclo de posse forte.'),
            num('Após criar um Rc e um Weak com downgrade, quantos donos fortes existem?', 1, 'downgrade cria um observador fraco, não outro dono forte. O único dono forte continua sendo o Rc original.'),
            mcq('Quais são as duas linhas da saída?', ['true e true', 'true e false', 'false e true', 'false e false'], 0, 'A primeira tentativa encontra a vivo e dá Some. O Rc temporário é destruído ao fim da instrução. Depois de drop(a), não há dono forte, então a segunda tentativa dá None.', { visual: code(weakBasic) }),
            match('Associe operação e significado:', [['Rc::downgrade', 'Criar observador fraco'], ['Weak::upgrade', 'Tentar criar um dono forte'], ['Rc::strong_count', 'Consultar quantos donos fortes existem']], 'downgrade não mantém T vivo. upgrade devolve Some(Rc) enquanto ainda há um dono forte e None quando o valor já foi destruído.'),
            gen((rng) => {
              const n = randInt(rng, 2, 7);
              return num('Qual weak_count o programa imprime?', n, `O vetor conserva ${n} Weak explícitos para a. Nenhum é Rc, então a contagem fraca consultada é ${n}, e a forte continua 1.`, { visual: code(`use std::rc::Rc;
fn main() {
    let a = Rc::new(3);
    let mut watchers = Vec::new();
    for _ in 0..${n} {
        watchers.push(
            Rc::downgrade(&a),
        );
    }
    println!("{}", Rc::weak_count(&a));
}`) });
            }),
            tf('Rust impede em compilação qualquer vazamento causado por um ciclo de Rc.', false, 'Ciclos fortes podem ser memória segura e ainda vazar. Cabe ao projeto distinguir relações de posse e de observação, usando Weak quando adequado.'),
            mcq('Você guardou o Some(Rc) de upgrade numa variável. Destruir o Rc original basta para destruir o valor?', ['Não; o Rc obtido também é dono forte', 'Sim; upgrade só cria um empréstimo', 'Sim; Weak proíbe novos donos', 'Não; Weak sempre torna o valor eterno'], 0, 'Um upgrade bem-sucedido cria um Rc normal. Enquanto você conservar esse Rc, ele mantém o valor vivo.'),
            codePuzzle('Monte o programa que cria um observador, destrói o último dono e imprime true para a ausência.', ['fn main() {', '    let a = std::rc::Rc::new(5);', '    let w = std::rc::Rc::downgrade(&a);', '    drop(a);', '    let gone = w.upgrade().is_none();', '    println!("{}", gone);', '}'], ['    let w = std::rc::Rc::clone(&a);', '    let gone = w.upgrade().is_some();'], 'w é Weak e não conserva o inteiro. Depois de drop(a), upgrade retorna None e is_none imprime true.'),
          ],
        },
        {
          card: [
            {
              title: 'Árvore: dono para baixo, Weak para cima',
              body: 'Node guarda filhos como Rc e o pai como Weak. RefCell permite preencher os elos depois da criação. root possui leaf, mas leaf só observa root. A primeira saída é 2: leaf tem o dono externo e o Rc no vetor de filhos. Ao sair do bloco, root é destruído, seu vetor solta um dono de leaf, e a segunda saída é true, pois o pai deixou de existir.',
              visual: code(tree, [4, 5, 18, 19, 20, 21], 'Árvore · saída 2 e true'),
            },
            {
              title: 'Quem mantém quem vivo?',
              body: 'Os elos fortes formam a árvore de posse. Um caminho de observação de volta é permitido; ele não fecha um ciclo forte. A folha externa pode continuar viva mesmo depois de perder o pai.',
              visual: table(['Elo', 'Mantém o alvo vivo?'], [['root → leaf: Rc', 'Sim'], ['leaf → root: Weak', 'Não'], ['variável leaf: Rc', 'Sim, mantém a folha'], ['upgrade guardado em Some', 'Sim, enquanto conservar esse Rc']]),
            },
            {
              title: 'No seu computador',
              body: 'Crie cargo new departamento_weak, edição 2024, e conclua o desafio 39. Departamento guarda seus funcionários por Rc; Funcionario guarda um Weak<RefCell<Departamento>> para o departamento. Crie um departamento com dois funcionários e conserve um funcionário fora do bloco do departamento. Trate upgrade com match: imprima “com departamento” dentro do bloco e “sem departamento” depois dele. Pronto quando o programa produzir essas duas linhas, um teste confirmar None após a destruição do último dono do departamento, cargo fmt --check passar e cargo clippy -- -D warnings não emitir avisos. Não use unwrap ou expect; não guarde o Rc de um upgrade além do bloco que está sendo testado.',
            },
          ],
          exercises: [
            mcq('Qual campo da árvore evita o ciclo de posse entre pai e filho?', ['parent com Weak', 'children com Rc', 'O vetor por si só', 'A ausência de um campo numérico'], 0, 'O caminho de volta para o pai é Weak. Os filhos podem ser donos fortes sem que esse caminho de volta mantenha o pai vivo.', { visual: code(treeDef, [4, 5], 'Definição e construtor') }),
            num('Quantos donos fortes de leaf existem dentro do bloco após push?', 2, 'A variável leaf tem um Rc e o vetor de root conserva outro. O elo Weak para root não acrescenta donos de leaf.', { visual: code(tree) }),
            mcq('Depois do fim do bloco de root, o que acontece ao pai observado pela folha?', ['upgrade retorna None', 'upgrade recria o pai destruído', 'A folha passa a possuir o pai', 'O programa não compila'], 0, 'root era o único dono forte do pai. Sua destruição também destrói o vetor, mas a folha externa continua viva. O Weak dela já não consegue obter o pai.', { visual: code(tree) }),
            gen((rng) => {
              const n = randInt(rng, 2, 6);
              return num('Qual contagem forte de leaf é impressa?', n + 1, `O vetor guarda ${n} clones do Rc da mesma folha, além do dono externo leaf. A contagem é ${n + 1}. Guardar clones repetidos é só uma experiência de contagem, não a árvore desejada.`, { visual: code(`${treeDef}
fn main() {
    let leaf = node();
    let root = node();
    *leaf.parent.borrow_mut() =
        Rc::downgrade(&root);
    for _ in 0..${n} {
        root.children.borrow_mut()
            .push(Rc::clone(&leaf));
    }
    println!("{}",
        Rc::strong_count(&leaf));
}`) });
            }),
            tf('Se pai e filho se possuem por Rc fortes, os nomes externos podem desaparecer e ainda restar um ciclo vivo.', true, 'O elo interno de cada nó mantém o outro com contagem pelo menos 1. Sair dos escopos externos não quebra esse ciclo de donos.'),
            order('Ordene o teste de um elo Weak sem conservar upgrades:', ['Criar o pai com Rc', 'Criar o elo Weak para o pai', 'Conferir presença sem guardar o Rc retornado', 'Destruir o último Rc do pai', 'Conferir que upgrade retorna None'], 'Primeiro o alvo precisa existir. A conferência temporária não deve criar um dono duradouro, pois isso alteraria o instante de destruição do pai.'),
            mcq('Por que tratar upgrade com match em vez de presumir presença?', ['Porque o alvo pode ter perdido todos os donos fortes', 'Porque Weak sempre contém um valor novo', 'Porque match aumenta a contagem fraca para sempre', 'Porque a presença é garantida pelo compilador'], 0, 'Weak não garante a sobrevivência do alvo. O Option devolvido explicita a ausência possível e permite decidir o que fazer sem pânico.'),
            codePuzzle('Monte o teste: enquanto o pai existe, guarde a presença; destrua-o e imprima true e true.', ['fn main() {', '    let p = std::rc::Rc::new(7);', '    let w = std::rc::Rc::downgrade(&p);', '    let alive = w.upgrade().is_some();', '    drop(p);', '    let gone = w.upgrade().is_none();', '    println!("{} {}", alive, gone);', '}'], ['    let gone = w.upgrade().is_some();', '    let alive = w.upgrade().is_none();'], 'alive guarda somente um bool. O Rc temporário de upgrade termina na instrução; drop(p) destrói o último dono. Depois, gone também é true.'),
          ],
        },
      ],
    },
    {
      id: 'rp-smart-deref', title: 'Deref e Drop',
      parts: [
        {
          card: [
            {
              title: 'Deref dá acesso ao alvo',
              body: 'Deref define qual tipo uma estrutura permite acessar como alvo. Target é esse tipo, e deref devolve uma referência a ele. Neste exemplo, a operação com asterisco usa essa referência para ler 9. Wrap só embrulha T: não aloca no heap. O comportamento de ponteiro e a alocação são decisões diferentes.',
              visual: code(derefProgram, [4, 5, 6, 11, 12], 'Wrap · imprime 9'),
              tip: 'Deref fornece acesso de leitura. Para escrita por desreferência existe DerefMut, que Rc não implementa para acesso direto ao valor compartilhado.',
            },
            {
              title: 'Coerção de referências',
              body: 'Em argumentos de função, Rust pode aplicar coerções de desreferência. O caminho abaixo começa com uma referência ao Box de String e chega a uma referência de texto. A função recebe um empréstimo; não recebe a posse do Box.',
              visual: trace([
                ['referência', '&Box<String>', 'O chamador empresta o Box.'],
                ['Deref do Box', '&String', 'A coerção pode acessar uma referência à String interna.'],
                ['Deref da String', '&str', 'A função que espera uma fatia de texto pode ler o mesmo texto sem copiá-lo.'],
              ]),
            },
          ],
          exercises: [
            mcq('O que o método deref deve devolver?', ['Uma referência ao alvo', 'Sempre uma cópia do alvo', 'Um novo Rc', 'Uma contagem de donos'], 0, 'A trait exige uma referência ao tipo Target. Isso permite acessar o alvo sem transferir sua posse.', { visual: code(derefProgram, [4, 5, 6]) }),
            num('Que inteiro o programa imprime?', 9, 'Wrap guarda 9. A implementação de Deref fornece uma referência ao seu campo e o asterisco permite ler esse inteiro.', { visual: code(derefProgram) }),
            tf('Implementar Deref obriga uma struct a guardar seu alvo no heap.', false, 'A trait define acesso ao alvo, não sua localização na memória. O Wrap do exemplo contém T diretamente.'),
            match('Associe elemento e função:', [['Target', 'Tipo do alvo'], ['deref', 'Método que empresta o alvo'], ['DerefMut', 'Trait para acesso mutável ao alvo']], 'Deref define o alvo e seu acesso de leitura. DerefMut acrescenta o acesso mutável, respeitando as regras de empréstimos.'),
            gen((rng) => {
              const n = randInt(rng, 2, 12);
              const factor = randInt(rng, 2, 5);
              return num('Qual número o programa imprime?', n * factor, `O asterisco lê ${n} de Wrap. Multiplicar por ${factor} produz ${n * factor}; nenhum valor foi somado pela coerção.`, { visual: code(`${wrapDef}
fn main() {
    let x = Wrap(${n});
    println!("{}", *x * ${factor});
}`) });
            }),
            mcq('O que o programa imprime ao chamar show?', ['oi', 'Box', 'String', 'Não compila por falta de clone'], 0, 'O argumento empresta Box<String>. As coerções chegam a &str, que show pode imprimir como oi. A posse do texto continua em b.', { visual: code(`fn show(s: &str) {
    println!("{}", s);
}
fn main() {
    let text = String::from("oi");
    let b = Box::new(text);
    show(&b);
}`) }),
            mcq('Qual diagnóstico impede o uso do asterisco nesta struct?', ['E0614: Bare não pode ser desreferenciado', 'E0072: todo campo numérico é recursivo', 'E0382: o valor já foi movido', 'Nenhum: toda struct já implementa Deref'], 0, 'E0614: “type `Bare` cannot be dereferenced”. Bare não é ponteiro nem implementa Deref. Leia seu campo diretamente ou implemente Deref com Target e uma referência ao campo.', { visual: code(`struct Bare(i32);
fn main() {
    let b = Bare(4);
    println!("{}", *b);
}`, [4], 'Erro intencional · E0614') }),
            codePuzzle('Monte a leitura do Box que calcula o dobro e imprime 12.', ['fn main() {', '    let b = Box::new(6);', '    let n = *b;', '    let doubled = n * 2;', '    println!("{}", doubled);', '}'], ['    let n = &b;', '    let doubled = n + 2;'], 'O asterisco lê o inteiro 6. doubled depende dessa leitura e calcula 6 vezes 2; a saída é 12.'),
          ],
        },
        {
          card: [
            {
              title: 'Drop executa a limpeza',
              body: 'Drop personaliza o que acontece antes da limpeza dos campos de um valor. O método recebe uma referência mutável a self. Variáveis locais nomeadas no mesmo escopo são destruídas na ordem inversa da declaração: este programa imprime fim, B e A, em linhas separadas. Não é o instante do último uso que determina a destruição desses valores.',
              visual: code(dropProgram, [3, 4, 8, 9, 10], 'Saída: fim → B → A'),
              tip: 'Use a função std::mem::drop, disponível como drop, para consumir um valor antecipadamente. Chamar o método Drop::drop diretamente é proibido: E0040, “explicit use of destructor method”.',
            },
            {
              title: 'Saída de escopo passo a passo',
              body: 'Avance para ver a ordem. Os nomes com sublinhado ainda são variáveis nomeadas e mantêm os valores até a saída de escopo; não são o padrão isolado que descarta um valor.',
              visual: trace([
                ['_a e _b vivos', 'saída: fim', 'A mensagem do corpo aparece enquanto os dois valores continuam vivos.'],
                ['_a vivo', 'saída: B', 'Ao sair de main, _b é destruído primeiro. Seu Drop imprime B.'],
                ['nenhum vivo', 'saída: A', 'Depois, _a é destruído e imprime A.'],
              ]),
            },
            {
              title: 'Campos seguem outra ordem',
              body: 'Não generalize a regra das variáveis locais para campos: após o Drop da própria struct, seus campos são destruídos na ordem em que foram declarados. Para Rc, destruir um ponteiro só destrói o valor interno quando sai o último dono forte. Para RefCell, destruir uma guarda libera aquele empréstimo.',
              visual: table(['O que sai', 'Efeito'], [['Local nomeado', 'Ordem inversa no escopo'], ['Campos de struct', 'Ordem de declaração'], ['Um Rc', 'Retira um dono forte'], ['Uma guarda RefMut', 'Encerra a escrita']]),
            },
            {
              title: 'No seu computador',
              body: 'Crie cargo new ciclo_de_vida, edição 2024. Instrumente o Departamento do desafio 39 com Drop para imprimir “departamento liberado”. Faça dois Rc possuírem o mesmo departamento e um Weak observá-lo. Destrua o primeiro Rc, imprima “ainda vivo”, destrua o segundo e trate upgrade com match para imprimir “ausente”. Pronto quando cargo run mostrar ainda vivo, departamento liberado e ausente, nessa ordem, cargo test conferir o Weak antes e depois da última destruição, cargo fmt --check passar e cargo clippy -- -D warnings não emitir avisos. Não use unwrap ou expect. Extra: implemente um invólucro de inteiro com Deref e verifique a leitura por asterisco em um teste.',
            },
          ],
          exercises: [
            mcq('Qual assinatura corresponde ao método exigido por Drop?', ['Recebe &mut self e não retorna um valor útil', 'Recebe self por valor e retorna Rc', 'Recebe &self e retorna o campo', 'Não recebe self e retorna String'], 0, 'O método drop recebe &mut self e retorna o tipo unit. A trait permite executar ações antes da destruição dos campos.', { visual: code(dropProgram, [3, 4]) }),
            mcq('Qual é a ordem completa da saída?', ['fim, depois B, depois A', 'A, depois B, depois fim', 'fim, depois A, depois B', 'B, depois A, depois fim'], 0, 'Primeiro roda o corpo de main. Na saída de escopo, _b foi declarado depois de _a, então B aparece antes de A.', { visual: code(dropProgram) }),
            tf('Destruir um clone de Rc sempre chama o Drop do valor interno imediatamente.', false, 'Se ainda houver outro dono forte, só o ponteiro Rc é destruído. O valor interno é destruído quando a contagem forte chega a zero.'),
            gen((rng) => {
              const n = randInt(rng, 2, 7);
              return num('Quantas linhas contendo apenas item são impressas?', n, `Cada uma das ${n} iterações cria uma Tag nomeada. O fim do corpo da iteração a destrói e imprime item uma vez. Total: ${n} linhas.`, { visual: code(`${dropDef}
fn main() {
    for _ in 0..${n} {
        let _item = Tag("item");
    }
}`) });
            }),
            mcq('Como corrigir a linha destacada para antecipar a destruição?', ['Consumir t com a função drop(t)', 'Chamar t.drop duas vezes', 'Tornar t mutável e manter t.drop()', 'Clonar t e esquecer o original'], 0, 'E0040: “explicit use of destructor method”. Rust não permite chamar o método destrutor diretamente. A função std::mem::drop consome o valor e executa a destruição com segurança.', { visual: code(`${dropDef}
fn main() {
    let t = Tag("T");
    t.drop();
}`, [9], 'Erro intencional · E0040') }),
            order('Uma struct tem Drop e dois campos, primeiro e segundo, também com Drop. Ordene:', ['Executar Drop da própria struct', 'Destruir o campo primeiro', 'Destruir o campo segundo'], 'A limpeza customizada da struct roda enquanto seus campos ainda existem. Depois os campos são destruídos na ordem de declaração.'),
            mcq('Qual sequência o programa imprime?', ['A, depois meio, depois B', 'meio, depois B, depois A', 'A, depois B, depois meio', 'B, depois meio, depois A'], 0, 'drop(a) consome a e imprime A imediatamente. Depois vem meio. No fim de main resta _b, cujo Drop imprime B. a não é destruído de novo.', { visual: code(`${dropDef}
fn main() {
    let a = Tag("A");
    let _b = Tag("B");
    drop(a);
    println!("meio");
}`) }),
            codePuzzle('Monte o programa que lê o Box, consome-o e só depois imprime 5 usando a cópia inteira.', ['fn main() {', '    let b = Box::new(5);', '    let n = *b;', '    drop(b);', '    println!("{}", n);', '}'], ['    b.drop();', '    println!("{}", *b);'], 'A leitura copia o i32 para n. drop(b) destrói o Box e libera sua alocação. n é uma cópia independente e ainda pode ser impresso. Usar b depois do drop seria uso após move.'),
          ],
        },
      ],
    },
  ],
};

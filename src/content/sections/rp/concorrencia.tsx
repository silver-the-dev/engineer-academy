import React from 'react';
import type { UnitDef, VisualSpec } from '../../types';
import { code, gen, match, mcq, multi, num, order, table, tf } from '../../helpers';
import { codePuzzle } from '../../codePractice';
import { randInt } from '../../../lib/random';
import { Label, Pt, Seg } from '../../../components/plot/Plot';
import { C } from '../../../theme';

// O aluno avança uma execução possível e acompanha o estado dos recursos.
const estados = (passos: [string, string, string][]): VisualSpec => ({
  name: 'stepper',
  props: {
    steps: passos.length,
    height: 160,
    view: { xMin: -1, xMax: 5, yMin: -1, yMax: 3 },
    render: (k: number) => (
      <>
        <Seg x1={0} y1={2} x2={4} y2={2} color={C.cyan} />
        <Seg x1={0} y1={0} x2={4} y2={0} color={C.gold} />
        <Pt x={4 * k / (passos.length - 1)} y={2} color={C.cyan} />
        <Pt x={4 * k / (passos.length - 1)} y={0} color={C.gold} />
        <Label x={2} y={2.65} text={passos[k][0]} anchor="middle" size={12} />
        <Label x={2} y={0.65} text={passos[k][1]} anchor="middle" size={12} />
      </>
    ),
    info: (k: number) => passos[k][2],
  },
});

const threadCode = `use std::thread;
fn main() {
    let h = thread::spawn(|| 6 * 7);
    match h.join() {
        Ok(n) => println!("{n}"),
        Err(_) => eprintln!("pânico"),
    }
}`;

const moveCode = `use std::thread;
fn main() {
    let v = vec![2, 4, 6];
    let h = thread::spawn(move || {
        v.iter().sum::<i32>()
    });
    match h.join() {
        Ok(n) => println!("{n}"),
        Err(_) => eprintln!("pânico"),
    }
}`;

const borrowError = `use std::thread;
fn main() {
    let v = vec![2, 4];
    let h = thread::spawn(|| v.len());
    if let Ok(n) = h.join() {
        println!("{n}");
    }
}`;

const canalCode = `use std::sync::mpsc;
use std::thread;
fn main() -> Result<(), &'static str> {
    let (tx, rx) = mpsc::channel();
    let h = thread::spawn(move || {
        tx.send(12)
    });
    let n = rx.recv()
        .map_err(|_| "canal")?;
    h.join().map_err(|_| "pânico")?
        .map_err(|_| "envio")?;
    println!("{n}");
    Ok(())
}`;

const produtoresCode = `use std::sync::mpsc;
use std::thread;
fn main() -> Result<(), &'static str> {
    let (tx, rx) = mpsc::channel();
    let mut hs = Vec::new();
    for n in [4, 7] {
        let tx = tx.clone();
        hs.push(thread::spawn(move || {
            tx.send(n)
        }));
    }
    drop(tx);
    let total: i32 = rx.iter().sum();
    for h in hs {
        h.join().map_err(|_| "pânico")?
            .map_err(|_| "envio")?;
    }
    println!("{total}");
    Ok(())
}`;

const sentError = `use std::sync::mpsc;
fn main() {
    let (tx, _rx) = mpsc::channel();
    let s = String::from("dado");
    if tx.send(s).is_err() {
        return;
    }
    println!("{s}");
}`;

const mutexCode = `use std::sync::{Arc, Mutex};
use std::thread;
fn main() -> Result<(), &'static str> {
    let total = Arc::new(Mutex::new(0));
    let c = Arc::clone(&total);
    let h = thread::spawn(move || {
        let mut n = c.lock()
            .map_err(|_| "trava")?;
        *n += 1;
        Ok::<(), &'static str>(())
    });
    h.join().map_err(|_| "pânico")??;
    let n = total.lock()
        .map_err(|_| "trava")?;
    println!("{}", *n);
    Ok(())
}`;

const lockCode = `use std::sync::Mutex;
fn main() -> Result<(), &'static str> {
    let m = Mutex::new(5);
    {
        let mut g = m.lock()
            .map_err(|_| "trava")?;
        *g += 2;
    }
    let g = m.lock()
        .map_err(|_| "trava")?;
    println!("{}", *g);
    Ok(())
}`;

const rcError = `use std::rc::Rc;
use std::thread;
fn main() {
    let n = Rc::new(3);
    let h = thread::spawn(move || *n);
    if let Ok(v) = h.join() {
        println!("{v}");
    }
}`;

const sendCode = `use std::sync::Arc;
use std::thread;
fn main() {
    let a = Arc::new(vec![2, 3]);
    let b = Arc::clone(&a);
    let h = thread::spawn(move || {
        b.iter().sum::<i32>()
    });
    if let Ok(n) = h.join() {
        println!("{n} {}", a.len());
    }
}`;

const traitsCode = `use std::sync::{Arc, Mutex};
fn send<T: Send>() {}
fn sync<T: Sync>() {}
fn main() {
    send::<String>();
    sync::<String>();
    send::<Arc<Mutex<i32>>>();
    sync::<Arc<Mutex<i32>>>();
}`;

const refcellError = `use std::cell::RefCell;
use std::sync::Arc;
fn sync<T: Sync>() {}
fn main() {
    sync::<Arc<RefCell<i32>>>();
}`;

const lazyCode = `async fn medir() -> i32 {
    println!("medindo");
    8
}
fn main() {
    let f = medir();
    println!("criada");
    drop(f);
}`;

const awaitCode = `// src/lib.rs: funções públicas
pub async fn medir() -> i32 {
    8
}
pub async fn dobro() -> i32 {
    let n = medir().await;
    n * 2
}`;

const awaitError = `async fn medir() -> i32 {
    8
}
fn main() {
    let n = medir().await;
    println!("{n}");
}`;

const sequencialCode = `// src/lib.rs
pub async fn soma() -> i32 {
    let a = async { 3 }.await;
    let b = async { 5 }.await;
    a + b
}`;

export const rustConcorrencia: UnitDef = {
  id: 'rp-conc', title: 'Concorrência', icon: '🧵',
  subtitle: 'Threads, mensagens, estado compartilhado e uma primeira visão de async',
  source: 'The Rust Programming Language, edição 2024, capítulos 16 e 17: https://doc.rust-lang.org/book/ch16-00-concurrency.html e https://doc.rust-lang.org/book/ch17-00-async-await.html. Biblioteca padrão: https://doc.rust-lang.org/std/. Desafio 50 Dias — Rust, módulo 7, exercícios 43, 44 e 47 (Anexo B).',
  guide: 'Concorrência é lidar com tarefas cujos períodos de execução se sobrepõem; paralelismo é executá-las simultaneamente. `spawn` cria uma thread do sistema; `join` espera e entrega um Result. `move` captura por valor, sem tornar um tipo automaticamente seguro entre threads. Canais mpsc transferem mensagens de vários produtores para um consumidor. Descarte todos os remetentes para encerrar a recepção após esvaziar a fila. `Arc` compartilha a posse com contagem atômica; `Mutex` protege o acesso e seu guard libera a trava ao ser descartado. Rust seguro impede data races, mas não impede deadlocks ou erros de lógica. `Send` permite transferir valores; `Sync` permite compartilhar referências imutáveis entre threads. Uma `async fn` devolve uma future preguiçosa; `.await` espera seu resultado dentro de um contexto async, que também precisa ser conduzido por um executor. Threads favorecem trabalho de CPU e APIs bloqueantes; async favorece muitas esperas de I/O compatíveis com async. Tokio é um runtime do ecossistema, apenas citado aqui; os exemplos usam somente a biblioteca padrão.',
  extra: true,
  lessons: [
    {
      id: 'rp-conc-thread', title: 'Threads e closures move', parts: [
        {
          card: [
            { title: 'Criar trabalho e esperar por ele', body: 'Uma thread é um fluxo de execução. `thread::spawn` recebe uma closure e devolve um JoinHandle. `join` consome esse handle, bloqueia até a thread terminar e devolve Ok com seu retorno ou Err se ela entrar em panic. Neste exemplo sem falhas, a única saída é 42. Uma thread não significa automaticamente ganho de velocidade: criar e coordenar trabalho tem custo.', visual: code(threadCode, [3, 4], 'src/main.rs') },
            { title: 'Avance até o resultado', body: 'As duas trilhas mostram os estados da thread principal e da trabalhadora, em uma execução possível. Avance para localizar onde a principal precisa esperar. A posição horizontal indica uma etapa lógica, não tempo medido.', visual: estados([
              ['principal: cria handle', 'trabalhadora: criada', 'spawn devolve o handle; a trabalhadora pode já estar executando.'],
              ['principal: em join', 'trabalhadora: calcula 42', 'Se o cálculo ainda não terminou, join bloqueia a principal.'],
              ['principal: recebe Ok(42)', 'trabalhadora: terminou', 'O resultado da closure agora pode ser usado na principal.'],
              ['principal: imprime 42', 'trabalhadora: terminou', 'A impressão acontece depois do join bem-sucedido.'],
            ]) },
          ],
          exercises: [
            mcq('O que spawn devolve para você acompanhar a thread?', ['Um JoinHandle', 'O resultado já calculado', 'Um Mutex', 'Um canal de mensagens'], 0, 'O JoinHandle representa a thread criada. Seu método join espera a conclusão e recupera o resultado.'),
            tf('Chamar join inicia uma thread que ainda não começou.', false, 'spawn já cria a thread, que pode executar imediatamente. join espera sua conclusão; não é um comando de início.'),
            num('Sem panic, qual número este programa imprime?', 42, 'A closure calcula 6 × 7 = 42. join devolve Ok(42), e o braço Ok imprime 42.', { visual: code(threadCode, [3, 5], 'Calcule antes de avançar') }),
            match('Associe a etapa ao seu papel:', [['spawn', 'criar o fluxo de execução'], ['JoinHandle', 'acompanhar uma thread criada'], ['join', 'esperar e obter o Result']], 'spawn cria a thread; o handle permite acompanhá-la; join consome o handle e recupera a conclusão.'),
            gen((rng) => {
              const n = randInt(rng, 3, 12);
              return num('Sem panic, qual número é impresso?', n * 3, `A thread retorna ${n} × 3 = ${n * 3}. A principal só imprime após receber Ok pelo join.`, { visual: code(threadCode.replace('6 * 7', `${n} * 3`), [3], 'Um novo trabalho') });
            }),
            mcq('Se o handle for descartado sem join, o que acontece?', ['A thread fica desacoplada; não se espera por ela', 'A thread é cancelada no mesmo instante', 'O compilador rejeita todo programa assim', 'O resultado aparece automaticamente'], 0, 'Descartar o handle desacopla a thread. Ela pode continuar enquanto o processo vive, mas terminar main não garante que ela termine; o encerramento do processo encerra suas threads.'),
            codePuzzle('Dentro de main que retorna Result<(), &\'static str>, monte uma thread que retorna 9, trate join e imprima esse resultado.', [
              'let h = std::thread::spawn(|| 9);',
              'let n = h.join()',
              '    .map_err(|_| "pânico")?;',
              'println!("{n}");',
              'Ok(())',
            ], ['let h = std::thread::join(|| 9);', 'let n = h;'], 'spawn cria o handle; join entrega o Result. map_err converte a falha em mensagem e ? a propaga. No sucesso, n vale 9 e a impressão acontece antes de Ok(()).'),
          ],
        },
        {
          card: [
            { title: 'O trabalho leva a posse', body: 'Uma closure que só lê um Vec normalmente o empresta. Porém, spawn exige capturas válidas por todo o tempo necessário: a thread pode sobreviver ao escopo chamador. Mesmo um join posterior não muda essa exigência. Use `move` para capturar por valor: aqui o Vec passa à closure, que soma 2 + 4 + 6 e retorna 12. Valores Copy são copiados. Isso não obriga os dados a viver para sempre; impede que a closure dependa de empréstimos locais de vida curta.', visual: code(moveCode, [4, 5], 'Posse da coleção') },
            { title: 'Uma alternativa com escopo', body: '`thread::scope` espera as threads do escopo antes de retornar. Assim elas podem emprestar dados locais, quando os tipos e empréstimos permitem. O código imprime 3 na trabalhadora e depois 3 na principal. É uma preparação para dividir uma coleção em fatias sem cloná-la.', visual: code(`use std::thread;
fn main() {
    let v = vec![2, 4, 6];
    thread::scope(|s| {
        s.spawn(|| {
            println!("{}", v.len());
        });
    });
    println!("{}", v.len());
}`, [4, 5], 'Empréstimo com prazo garantido') },
            { title: 'No seu computador', body: 'Roteiro 43, parte 1: crie um projeto com Cargo chamado soma_threads. Some os inteiros de 1 a 100, guardados num Vec, dividindo-o com chunks(25) em quatro fatias. Dentro de thread::scope, lance uma thread por fatia; recupere e some os quatro resultados. Pronto: imprime 5050, trata falhas de join, mantém o Vec utilizável e passa cargo fmt e cargo clippy -- -D warnings. Depois faça uma versão com spawn e quatro Vec próprios; compare onde a posse muda.', visual: code('cargo new soma_threads\ncd soma_threads\ncargo run\ncargo fmt\ncargo clippy -- -D warnings', [], 'Terminal • desafio do roteiro 43') },
          ],
          exercises: [
            mcq('Que captura permite entregar este Vec à thread?', ['Captura por valor com move', 'Empréstimo local sem prazo', 'Uma referência mutável criada depois', 'Apenas chamar join mais cedo'], 0, 'move transfere o Vec para a closure. O Vec deixa de depender da variável local do chamador.', { visual: code(moveCode, [3, 4], 'A closure passa a ser dona') }),
            tf('move duplica profundamente todo valor capturado.', false, 'move captura por valor. Um Vec é movido, sem duplicar seus elementos; um i32 é copiado porque é Copy. clone é uma operação explícita diferente.'),
            num('Sem panic, qual soma a thread devolve?', 12, 'Os elementos são 2, 4 e 6; a soma é 12. O Vec é consumido como captura, mas sua leitura dentro da closure é válida.', { visual: code(moveCode, [5], 'Leia o retorno') }),
            mcq('Este programa compila? Qual é o problema principal?', ['Não: E0373, a closure empresta v', 'Sim: join prova o prazo ao compilador', 'Não: E0308, len retorna String', 'Sim: Vec é sempre copiado'], 0, 'E0373: “closure may outlive the current function, but it borrows `v`, which is owned by the current function”. spawn exige uma closure sem esse empréstimo local. Acrescente move antes de || ou use thread::scope com s.spawn.', { visual: code(borrowError, [4], 'Exemplo propositalmente incorreto') }),
            gen((rng) => {
              const a = randInt(rng, 2, 8);
              const b = randInt(rng, 3, 9);
              return num('Que soma será impressa no sucesso?', a + b, `move entrega o Vec com ${a} e ${b}. A soma é ${a + b}; join devolve esse inteiro à principal.`, { visual: code(moveCode.replace('vec![2, 4, 6]', `vec![${a}, ${b}]`), [3, 4], 'Dados novos, mesma posse') });
            }),
            multi('Selecione as duas afirmações corretas:', ['scope permite empréstimos locais válidos nas threads do escopo', 'spawn com move ainda exige capturas Send', 'move torna qualquer Rc seguro entre threads', 'join devolve diretamente o inteiro, sem Result'], [0, 1], 'scope garante esperar suas threads antes de sair. spawn ainda exige Send; move não altera as traits do tipo. join retorna Result, inclusive quando a closure retorna um inteiro.'),
            codePuzzle('Dentro de main que retorna Result<(), &\'static str>, monte uma closure move que leva uma String, lance-a numa thread e imprima seu tamanho (4) após join.', [
              'let s = String::from("dado");',
              'let job = move || s.len();',
              'let h = std::thread::spawn(job);',
              'let n = h.join()',
              '    .map_err(|_| "pânico")?;',
              'println!("{n}");',
              'Ok(())',
            ], ['let job = move || s;', 'println!("{s}");'], 'A String tem quatro bytes ASCII. move a leva à closure; s.len() retorna 4, recuperado por join. O distrator que devolve s entregaria uma String, imprimindo dado em vez de 4. Tentar imprimir s na principal após o move causaria E0382: “borrow of moved value: `s`”.'),
          ],
        },
      ],
    },
    {
      id: 'rp-conc-canal', title: 'Canais', parts: [
        {
          card: [
            { title: 'Entregar uma mensagem', body: 'Um canal mpsc tem remetente tx e receptor rx: vários produtores podem enviar, um consumidor recebe. Aqui a thread leva tx, envia 12 e termina. recv espera uma mensagem ou devolve erro quando não pode mais recebê-la. O programa trata send, recv e join: no caminho de sucesso imprime 12. O ? propaga falhas convertidas para mensagens curtas; o retorno da thread também é um Result.', visual: code(canalCode, [4, 6, 8], 'Um produtor, um consumidor') },
            { title: 'Siga a posse pela fila', body: 'Avance uma execução possível. Uma mensagem pode já estar na fila quando recv é chamado; nesse caso, ele a entrega sem esperar uma nova mensagem.', visual: estados([
              ['produtor: dono da mensagem', 'consumidor: sem mensagem', 'Antes de send, uma String pertence ao produtor.'],
              ['produtor: executa send', 'canal: mensagem na fila', 'send recebe a String por valor: o produtor perde a posse dela.'],
              ['produtor: pode continuar', 'consumidor: executa recv', 'channel usa uma fila sem limite fixo; enviar não espera o consumo.'],
              ['produtor: sem a String', 'consumidor: dono da String', 'recv entrega a mensagem; o consumidor agora controla seu uso.'],
            ]) },
          ],
          exercises: [
            match('Associe cada nome ao seu papel:', [['tx', 'lado que envia'], ['rx', 'lado que recebe'], ['mpsc', 'vários produtores e um consumidor']], 'O canal separa responsabilidades: produtores usam remetentes, o consumidor usa o receptor.'),
            tf('recv sempre devolve imediatamente, mesmo com a fila vazia e um remetente vivo.', false, 'Com fila vazia e algum remetente vivo, recv bloqueia a thread. try_recv permite consultar sem bloquear, mas exige tratar fila vazia.'),
            num('Sem falhas, qual número chega ao consumidor?', 12, 'tx.send(12) coloca 12 no canal. rx.recv() entrega esse mesmo inteiro; a impressão ocorre depois de verificar a conclusão da thread.', { visual: code(canalCode, [6, 8, 11], 'Uma mensagem') }),
            mcq('A String enviada pode ser usada nesta impressão?', ['Não: E0382, foi movida para send', 'Sim: send empresta qualquer valor', 'Não: E0277, String nunca é Send', 'Sim: o receptor ainda não leu'], 0, 'E0382: “borrow of moved value: `s`”. send recebe a String por valor. Estar pendente na fila não devolve a posse ao produtor. Se precisar manter uma cópia, envie s.clone(); se send falhar, o SendError contém a mensagem que não foi entregue.', { visual: code(sentError, [5, 8], 'Exemplo propositalmente incorreto') }),
            gen((rng) => {
              const n = randInt(rng, 2, 15);
              return num('Sem falhas, qual valor será impresso?', n, `A única mensagem enviada vale ${n}. recv recupera essa mensagem sem alterar seu valor.`, { visual: code(canalCode.replace('tx.send(12)', `tx.send(${n})`), [6], 'Leitura pelo canal') });
            }),
            order('Coloque em ordem o caminho de uma String transferida com sucesso:', ['Produtor cria a String', 'send recebe a posse', 'Canal mantém a mensagem pendente', 'recv entrega a posse ao consumidor'], 'A criação vem antes do envio. O envio transfere a posse; a fila guarda a mensagem até o consumidor recebê-la. A fila pode ser esvaziada rapidamente, sem uma espera perceptível.'),
            codePuzzle('Monte dentro de main um envio local de 7 e a recepção correspondente. Importe std::sync::mpsc; main retorna Result<(), Box<dyn std::error::Error>>. A fila permite enviar antes de receber.', [
              'let (tx, rx) = mpsc::channel();',
              'tx.send(7)?;',
              'let n = rx.recv()?;',
              'println!("{n}");',
              'Ok(())',
            ], ['let n = rx.recv();', 'tx.recv(7)?;'], 'Crie o canal, envie, depois receba e imprima 7. Os dois ? propagam erros. Receber antes de enviar nesta mesma thread bloquearia. Sem ? na recepção, n seria um Result, que não tem o Display usado na impressão; tx possui send, não recv.'),
          ],
        },
        {
          card: [
            { title: 'Vários produtores, fechamento explícito', body: 'clone cria outro remetente para o mesmo canal, não outra fila. As threads enviam 4 e 7; sua ordem relativa não é garantida. rx.iter() espera mensagens e só termina quando todos os remetentes foram descartados e a fila ficou vazia. Por isso a principal descarta o tx original antes de somar. A saída final é sempre 11 no sucesso.', visual: code(produtoresCode, [7, 12, 13], 'Dois produtores') },
            { title: 'Quem ainda mantém o canal aberto?', body: 'Apenas os remetentes vivos impedem o fim da recepção depois de esvaziar a fila. Os clones de cada thread são descartados quando as closures terminam. Quando a principal termina de criar os clones, zero, um ou dois deles podem continuar vivos.', visual: table(['Momento', 'Remetentes vivos'], [['Após criar o canal', 'original'], ['Após dois clones, antes de drop(tx)', 'original + até 2 clones'], ['Após drop na principal', 'até 2 clones'], ['Após drop e ambas terminarem', 'nenhum → drenar e encerrar']]) },
            { title: 'No seu computador', body: 'Roteiro 44: crie com Cargo o projeto fila_trabalho. Lance três produtores; cada um envia quatro inteiros, respectivamente 1 a 4, 5 a 8 e 9 a 12. Clone o remetente para cada produtor e descarte o original. Um único consumidor deve contar e somar até o canal fechar. Pronto: imprime quantidade 12 e soma 78, termina sozinho, verifica send e join e passa cargo fmt e cargo clippy -- -D warnings. A ordem das mensagens entre produtores pode variar.', visual: code('cargo new fila_trabalho\ncd fila_trabalho\ncargo run\ncargo fmt\ncargo clippy -- -D warnings', [], 'Terminal • produtor-consumidor') },
          ],
          exercises: [
            mcq('O clone de tx envia para onde?', ['O mesmo canal e receptor', 'Um novo receptor independente', 'Um Mutex criado automaticamente', 'A saída padrão'], 0, 'Os remetentes clonados apontam para a mesma fila. O receptor mpsc continua sendo único.'),
            tf('No exemplo, a mensagem 4 necessariamente chega antes da 7.', false, 'Threads diferentes podem ser escalonadas em qualquer ordem. A soma não depende dessa ordem. A ordem de envios sucessivos de um mesmo produtor é preservada.'),
            num('Sem falhas, qual total é impresso?', 11, 'O receptor recebe 4 e 7, em alguma ordem, e soma 4 + 7 = 11. O fechamento permite terminar iter().sum().', { visual: code(produtoresCode, [6, 12, 13], 'Agregação determinística') }),
            mcq('O que pode acontecer se remover apenas drop(tx)?', ['A soma espera para sempre após esvaziar a fila', 'O total passa a ser 12', 'O receptor se clona', 'O compilador acusa E0382 nessa remoção'], 0, 'A principal ainda possui um remetente, mesmo sem usá-lo. rx.iter() espera mais mensagens; a execução não alcança a impressão. Descarte esse remetente antes do laço receptor.', { visual: code(produtoresCode, [12], 'Localize a condição de término') }),
            gen((rng) => {
              const a = randInt(rng, 2, 8);
              const b = randInt(rng, 9, 15);
              return num('Sem falhas, qual total sai independentemente da ordem?', a + b, `Cada produtor envia uma mensagem: ${a} e ${b}. A soma é ${a + b}; a ordem de chegada não muda esse total.`, { visual: code(produtoresCode.replace('[4, 7]', `[${a}, ${b}]`), [6, 13], 'Outros produtores') });
            }),
            multi('Quais duas ações permitem terminar um consumo até o fechamento?', ['Descartar o remetente original não usado', 'Deixar terminar e descartar todos os clones produtores', 'Manter um clone guardado sem enviar', 'Esperar que a fila vazia feche o canal sozinha'], [0, 1], 'Fila vazia não significa fim: ainda pode haver produção. O fim ocorre após todos os remetentes desaparecerem; o consumidor então drena o que restou e encerra.'),
            codePuzzle('Use dois remetentes na mesma fila: envie 3 pelo original, clone-o, receba o valor, envie seu sucessor pelo clone e imprima 4. Importe std::sync::mpsc; insira os blocos em main antes do Ok(()) já existente, com retorno Result<(), Box<dyn std::error::Error>>.', [
              'let (tx, rx) = mpsc::channel();',
              'let tx2 = {',
              '    tx.send(3)?;',
              '    tx.clone()',
              '};',
              'let n = rx.recv()?;',
              'tx2.send(n + 1)?;',
              'println!("{}", rx.recv()?);',
            ], ['    rx.clone()', 'tx2.send(&n)?;'], 'O bloco primeiro envia 3 e então produz o clone tx2. O receptor recupera n = 3. tx2 envia n + 1 = 4 para a mesma fila; a segunda recepção imprime 4. Aqui são duas recepções explícitas, sem iterar até o fechamento: os remetentes podem permanecer vivos até o fim de main.'),
          ],
        },
      ],
    },
    {
      id: 'rp-conc-mutex', title: 'Mutex e Arc', parts: [
        {
          card: [
            { title: 'Compartilhar a posse e proteger o dado', body: '`Arc` usa contagem atômica para compartilhar a posse; `Mutex` concede acesso exclusivo ao dado. Arc::clone copia o ponteiro contado, sem copiar o contador protegido. lock pode esperar e devolve um Result com um guard. O guard permite ler ou alterar o valor com desreferência e libera a trava ao sair do escopo. A thread retorna outro Result: o primeiro ? depois de join trata panic; o segundo trata a falha devolvida pela closure. Sem falhas, imprime 1.', visual: code(mutexCode, [4, 5, 7, 9, 12], 'Um contador compartilhado') },
            { title: 'Uma trava, dois donos', body: 'Avance esta execução possível e veja que clonar a posse não duplica o dado. A região protegida é o tempo em que o guard está vivo.', visual: estados([
              ['principal: Arc original', 'thread: clone do Arc', 'Dois donos compartilham o mesmo Mutex com valor inicial 0.'],
              ['principal: espera em join', 'thread: obtém guard', 'lock concede acesso exclusivo. Só o guard permite alterar o inteiro.'],
              ['principal: ainda espera', 'thread: valor passa a 1', 'O guard é descartado ao fim da closure e a trava é liberada.'],
              ['principal: lock e leitura', 'thread: terminou', 'Após join, a principal obtém seu guard e lê 1 no mesmo dado.'],
            ]) },
          ],
          exercises: [
            match('Associe os dois mecanismos e o acesso:', [['Arc', 'posse compartilhada com contagem atômica'], ['Mutex', 'exclusão mútua sobre o dado'], ['MutexGuard', 'acesso enquanto a trava está retida']], 'Arc mantém o recurso vivo entre donos; Mutex serializa o acesso; o guard representa a trava adquirida.'),
            tf('Arc::clone cria outro contador independente com o mesmo valor inicial.', false, 'Ele cria outro dono do mesmo Mutex. Copiar o dado produziria contadores separados, sem o total compartilhado desejado.'),
            num('Sem falhas, qual valor final será impresso?', 1, 'O contador começa em 0, a única thread soma 1 e a principal espera com join antes de ler. Logo 0 + 1 = 1.', { visual: code(mutexCode, [4, 9, 12], 'Contador protegido') }),
            mcq('Por que o guard n é declarado mut na thread?', ['Para alterar o inteiro por *n', 'Para tornar Arc atômico', 'Para iniciar a thread', 'Para impedir que join bloqueie'], 0, 'A escrita por desreferência exige um guard mutável. O Mutex já gerencia exclusão mútua, mas mut continua necessário para usar acesso mutável pelo guard.', { visual: code(mutexCode, [7, 9], 'Acesso de escrita') }),
            gen((rng) => {
              const base = randInt(rng, 2, 10);
              const inc = randInt(rng, 2, 6);
              return num('Sem falhas, qual contador será impresso?', base + inc, `O único incremento protegido soma ${inc} ao valor inicial ${base}, dando ${base + inc}. join acontece antes da leitura.`, { visual: code(mutexCode.replace('Mutex::new(0)', `Mutex::new(${base})`).replace('*n += 1;', `*n += ${inc};`), [4, 9], 'Novo estado inicial') });
            }),
            mcq('O que lock faz quando outra thread possui o guard?', ['Espera a liberação da trava', 'Copia o inteiro para contornar a trava', 'Descarta o dado de outra thread', 'Sempre produz um erro de compilação'], 0, 'lock é bloqueante: espera conseguir a trava. Seu Result também informa envenenamento, que pode ocorrer quando há panic durante a região protegida.'),
            codePuzzle('Dentro de main que retorna Result<(), &\'static str>, monte um incremento de 2 para 5 e libere a trava explicitamente. Importe std::sync::Mutex.', [
              'let m = Mutex::new(2);',
              'let mut g = m.lock()',
              '    .map_err(|_| "trava")?;',
              '*g += 3;',
              'println!("{}", *g);',
              'drop(g);',
              'Ok(())',
            ], ['let g = m.lock();', 'g += 3;'], 'A chamada lock é tratada por map_err e ?. O guard mutável permite alterar o dado: 2 + 3 = 5. Após imprimir, drop(g) libera a trava; Ok encerra a função com sucesso.'),
          ],
        },
        {
          card: [
            { title: 'Regiões curtas e ordem de travas', body: 'As chaves internas fazem o primeiro guard sair de escopo antes do segundo lock. A saída é 7. Mantenha regiões protegidas curtas: não espere join ou recepção de canal segurando uma trava de que a outra thread precisa. Com duas travas, todas as threads devem adquiri-las na mesma ordem global para evitar espera circular. O compilador não prova ausência de deadlock.', visual: code(lockCode, [4, 8, 9], 'Destruição do guard libera a trava') },
            { title: 'A espera circular', body: 'Este quadro descreve um deadlock possível: A já possui X e espera Y, enquanto B já possui Y e espera X. Nenhuma alcança a liberação. Não é um diagnóstico E0xxx: pode compilar e travar ao executar. Adquirir X antes de Y em todas as threads remove este ciclo específico.', visual: table(['Thread', 'Possui', 'Espera'], [['A', 'trava X', 'trava Y'], ['B', 'trava Y', 'trava X']]) },
            { title: 'No seu computador', body: 'Roteiro 43, parte 2: crie contador_seguro com Cargo. Quatro threads devem somar 1000 vezes cada uma ao mesmo Arc<Mutex<i64>>. Clone o Arc antes de cada move, trate lock e junte todos os handles antes de ler. Pronto: imprime 4000 em execuções repetidas, sem unwrap ou expect, e passa cargo fmt e cargo clippy -- -D warnings. Cada thread deve reter a trava só pelo tempo do incremento. Explique por que o resultado final não depende da ordem das threads.', visual: code('cargo new contador_seguro\ncd contador_seguro\ncargo run\ncargo fmt\ncargo clippy -- -D warnings', [], 'Terminal • um dado compartilhado') },
          ],
          exercises: [
            mcq('Quando o primeiro guard libera a trava neste programa?', ['Ao terminar o bloco interno', 'Somente quando main termina', 'Somente se usar unlock manualmente', 'Quando o segundo lock começa'], 0, 'O guard g interno é descartado ao fechar o bloco. Sua destruição libera a trava antes da nova aquisição.', { visual: code(lockCode, [4, 8, 9], 'Marque a fronteira do escopo') }),
            num('Sem falhas, qual inteiro é impresso?', 7, 'O valor protegido começa em 5 e aumenta 2 no bloco. Depois de liberar e readquirir a trava, o segundo guard lê 7.', { visual: code(lockCode, [7, 11], 'Duas aquisições, um dado') }),
            tf('Se o código compila em Rust seguro, nenhum deadlock é possível.', false, 'Rust seguro impede data races, mas uma espera circular é um erro de coordenação que pode passar pela compilação. É preciso planejar a ordem de aquisição e a duração dos guards.'),
            mcq('A principal segura o contador e espera join; a thread tenta lock no contador. Qual é o risco?', ['Ambas podem ficar esperando para sempre', 'O guard é automaticamente liberado pelo join', 'O compilador sempre emite E0277', 'A thread ganha uma cópia do contador'], 0, 'A principal espera a thread terminar, mas a thread espera a trava que a principal só soltaria depois do join. Solte o guard antes de esperar a thread.'),
            gen((rng) => {
              const n = randInt(rng, 2, 6);
              const k = randInt(rng, 3, 9);
              return num(`Um contador começa em zero. ${n} threads fazem ${k} incrementos de 1 cada, todos sob o mesmo mutex, e todos os joins têm sucesso. Qual é o valor final?`, n * k, `Cada thread contribui ${k}; com ${n} threads, o total é ${n} × ${k} = ${n * k}. A exclusão mútua impede perder incrementos, e os joins garantem que a leitura é posterior ao trabalho.`);
            }),
            order('Ordene o protocolo de duas travas usado por todas as threads:', ['Adquirir X', 'Adquirir Y mantendo X', 'Atualizar o estado protegido', 'Liberar Y e X'], 'Uma ordem global X antes de Y impede que uma thread segure Y esperando X enquanto outra segura X esperando Y. Libere os guards assim que a atualização terminar.'),
            codePuzzle('Dentro de main que retorna Result<(), &\'static str>, atualize 4 para 5, libere o primeiro guard e só então faça a leitura com outro guard. Importe std::sync::Mutex. Mostre apenas o valor lido ao final.', [
              'let m = Mutex::new(4);',
              'let mut a = m.lock()',
              '    .map_err(|_| "trava")?;',
              '*a += 1;',
              'drop(a);',
              'let b = m.lock().map_err(|_| "trava")?;',
              'println!("{}", *b);',
              'Ok(())',
            ], ['drop(m);', 'let b = a;'], 'O primeiro guard altera 4 para 5. É necessário descartá-lo antes do segundo lock no mesmo mutex. b é o novo guard, usado apenas para ler e imprimir 5.'),
          ],
        },
      ],
    },
    {
      id: 'rp-conc-send', title: 'Send e Sync', parts: [
        {
          card: [
            { title: 'O compilador verifica a travessia', body: '`Send` indica que valores do tipo podem ser transferidos com segurança entre threads. `Sync` indica que referências imutáveis podem ser compartilhadas entre threads: T é Sync quando &T é Send. São traits marcadoras, normalmente derivadas automaticamente a partir dos componentes. Não são métodos para chamar. Um Arc<Vec<i32>> permite leitura compartilhada: aqui a thread soma 5, e a principal ainda lê tamanho 2. A saída é 5 2 no sucesso.', visual: code(sendCode, [4, 5, 6, 10], 'Duas posses, leitura compartilhada') },
            { title: 'Mover o handle, manter o dado', body: 'Avance para separar contagem de donos e conteúdo. As contagens abaixo são deste exemplo, sem outros clones nem referências Weak.', visual: estados([
              ['principal: a', 'antes de clonar: 1 dono', 'O Arc mantém o vetor vivo, inicialmente com um dono forte.'],
              ['principal: a', 'closure: b → 2 donos', 'clone acrescenta um dono; move transfere b para a closure sem criar outro.'],
              ['principal: a', 'thread lê [2, 3]', 'Vec<i32> permite leitura compartilhada; o dado não é alterado.'],
              ['principal: a → 1 dono', 'thread: terminou', 'Após o fim da closure e join, b foi descartado. O vetor ainda existe porque a permanece.'],
            ]) },
          ],
          exercises: [
            match('Associe cada propriedade à garantia:', [['Send', 'transferir valores com segurança entre threads'], ['Sync', 'compartilhar referências imutáveis entre threads'], ['move', 'capturar variáveis por valor']], 'Send e Sync descrevem garantias dos tipos. move define a forma de captura da closure e não muda essas garantias.'),
            tf('Um tipo ser Send garante que ele também é Sync.', false, 'As propriedades são diferentes. RefCell<i32> é Send, pois pode ter sua posse transferida; não é Sync, pois seus empréstimos internos não podem ser verificados por várias threads ao mesmo tempo.'),
            mcq('Sem panic, quais valores aparecem, na ordem?', ['Soma 5 e tamanho 2', 'Soma 2 e tamanho 5', 'Soma 5 e tamanho 1', 'Soma 3 e tamanho 2'], 0, 'A thread lê 2 + 3 = 5. A principal mantém a, cujo vetor tem dois elementos. O formato imprime a linha 5 2: a soma e depois o tamanho.', { visual: code(sendCode, [7, 10], 'Leia o estado compartilhado') }),
            mcq('Por que este exemplo com Rc não compila?', ['E0277: Rc<i32> não é Send', 'E0382: i32 não pode ser copiado', 'E0728: faltou await', 'E0308: spawn exige String'], 0, 'E0277: “`Rc<i32>` cannot be sent between threads safely”. A contagem de referências de Rc não é atômica. move transfere a captura, mas não remove a exigência Send de spawn. Para este dado imutável, substitua Rc por Arc.', { visual: code(rcError, [5], 'Exemplo propositalmente incorreto') }),
            gen((rng) => {
              const a = randInt(rng, 2, 8);
              const b = randInt(rng, 9, 15);
              return num('Sem panic, qual número será impresso primeiro?', a + b, `O Arc compartilha o vetor [${a}, ${b}]. A thread soma os dois valores, dando ${a + b}; o tamanho impresso em seguida continua sendo 2.`, { visual: code(sendCode.replace('vec![2, 3]', `vec![${a}, ${b}]`), [4, 7], 'Mesmo tipo, novos dados') });
            }),
            multi('Selecione os dois tipos que podem atravessar threads por valor:', ['String', 'Arc<Mutex<i32>>', 'Rc<i32>', 'Rc<Mutex<i32>>'], [0, 1], 'String é Send. Arc<Mutex<i32>> combina posse contada atômica e dado protegido. Envolver o dado num Mutex não torna atômica a contagem de um Rc; os dois tipos com Rc continuam não Send.'),
            codePuzzle('Dentro de main que retorna Result<(), &\'static str>, monte uma leitura de Arc<i32> numa thread. Crie a, clone em b, capture b na closure e imprima o resultado 3 após join.', [
              'let a = std::sync::Arc::new(3);',
              'let b = std::sync::Arc::clone(&a);',
              'let work = move || *b;',
              'let h = std::thread::spawn(work);',
              'let n = h.join()',
              '    .map_err(|_| "pânico")?;',
              'println!("{n}");',
              'Ok(())',
            ], ['let work = move || *a;', 'let work = move || b.len();'], 'a e b são donos do mesmo inteiro. A closure captura b por valor; spawn verifica Send. join devolve 3 e a principal o imprime. Capturar a não cumpre a tarefa pedida, que deixa a na principal; o inteiro não possui len.'),
          ],
        },
        {
          card: [
            { title: 'Arc não conserta qualquer interior', body: 'Neste programa, os limites genéricos pedem Send e Sync sem criar threads. Ele compila e não imprime nada. Arc só é Send e Sync quando o interior satisfaz as condições necessárias. RefCell não é Sync: Arc<RefCell<i32>> não serve como substituto de Arc<Mutex<i32>> para mutação compartilhada entre threads. Não implemente essas traits manualmente com unsafe para contornar um erro; ajuste a estrutura de dados.', visual: code(traitsCode, [5, 6, 7, 8], 'Restrições verificadas em compilação') },
            { title: 'Escolha pela forma de acesso', body: 'A tabela refere-se a estes tipos concretos. “Não Sync” não significa que o tipo é inútil: ele pode ser apropriado em uma única thread.', visual: table(['Tipo', 'Send', 'Sync'], [['String', 'sim', 'sim'], ['Rc<i32>', 'não', 'não'], ['RefCell<i32>', 'sim', 'não'], ['Arc<Mutex<i32>>', 'sim', 'sim'], ['Arc<RefCell<i32>>', 'não', 'não']]) },
            { title: 'No seu computador', body: 'Roteiro 43, diagnóstico: crie com Cargo o projeto travessia. Comece com a versão Arc<Mutex<i64>> do contador anterior e confirme o total 4000. Troque Arc por Rc em uma variante e rode cargo check: registre E0277 e a nota sobre Send. Restaure Arc e explique por escrito por que move não corrigia Rc. Pronto: versão final imprime 4000, não usa unsafe nem unwrap/expect e passa cargo fmt e cargo clippy -- -D warnings; guarde o experimento que falha apenas como anotação, fora do código compilado.', visual: code('cargo new travessia\ncd travessia\ncargo check\ncargo run\ncargo fmt\ncargo clippy -- -D warnings', [], 'Terminal • ler a proteção do compilador') },
          ],
          exercises: [
            mcq('Qual combinação protege um inteiro mutável e compartilha sua posse entre threads?', ['Arc<Mutex<i32>>', 'Rc<RefCell<i32>>', 'Arc<RefCell<i32>>', 'Rc<Mutex<i32>>'], 0, 'Mutex fornece acesso protegido e é adequado para i32; Arc fornece contagem atômica entre donos. Rc não cruza threads, e RefCell não oferece a sincronização necessária.'),
            tf('String ser Sync permite a várias threads alterarem a mesma String sem trava.', false, 'Sync diz respeito a compartilhar &String com segurança. A referência imutável não permite mutação comum. Para mutar um mesmo dado compartilhado, é preciso um mecanismo apropriado, como Mutex.'),
            mcq('Qual é o resultado deste teste de limite genérico?', ['E0277: RefCell<i32> não pode ser compartilhado com segurança', 'Compila: Arc torna qualquer interior Sync', 'E0382: não é permitido escrever i32', 'Compila e imprime zero'], 0, 'E0277: “`RefCell<i32>` cannot be shared between threads safely”. A restrição Sync não é satisfeita: a verificação de empréstimos de RefCell não é sincronizada. Troque RefCell por Mutex para este uso entre threads.', { visual: code(refcellError, [5], 'Exemplo propositalmente incorreto') }),
            match('Associe o problema à solução adequada:', [['Rc em spawn', 'usar Arc com interior compatível'], ['mutação compartilhada entre threads', 'proteger o dado com Mutex'], ['espera circular entre travas', 'planejar uma ordem global de aquisição']], 'A troca Rc → Arc resolve a contagem de donos entre threads. Mutex protege o dado mutável. Deadlock é um problema de protocolo; não se resolve apenas com traits.'),
            gen((rng) => {
              const k = randInt(rng, 2, 6);
              return num(`Neste trecho só há os donos mostrados, sem concorrência. Qual contagem forte é impressa após ${k} clones?`, k + 1, `O Arc original conta como um dono. O vetor guarda ${k} clones fortes ainda vivos: 1 + ${k} = ${k + 1}. Eles apontam para o mesmo inteiro; não são ${k + 1} inteiros distintos.`, { visual: code(`use std::sync::Arc;
fn main() {
    let a = Arc::new(7);
    let copies: Vec<_> = (0..${k})
        .map(|_| Arc::clone(&a))
        .collect();
    let n = Arc::strong_count(&a);
    println!("{n}");
    drop(copies);
}`, [4, 7, 8], 'Contagem em uma thread') });
            }),
            multi('Quais duas afirmações expressam “concorrência sem medo” corretamente?', ['Rust seguro impede data races', 'Ownership e traits rejeitam travessias inseguras', 'O compilador garante a ordem de todas as mensagens', 'Um programa que compila nunca fica em deadlock'], [0, 1], 'O sistema de tipos e as APIs seguras bloqueiam acessos concorrentes de memória que violam suas regras. Isso não garante o protocolo do programa: ordem entre produtores, deadlock e resultados de negócio ainda precisam de projeto.'),
            {
              ...codePuzzle('Com Arc e Mutex importados, monte dentro de main uma checagem de Sync usando a função mostrada. Crie o mutex, envolva-o em Arc, passe-o à checagem e imprima a contagem forte (1).', [
                'let m = Mutex::new(3);',
                'let a = Arc::new(m);',
                'let checked = sync(a);',
                'let n = Arc::strong_count(&checked);',
                'println!("{n}");',
              ], ['let a = std::rc::Rc::new(m);', 'let m = std::cell::RefCell::new(3);'], 'sync devolve o valor recebido, exigindo que seu tipo seja Sync. Arc<Mutex<i32>> satisfaz a restrição e tem apenas um dono forte, agora chamado checked. O programa imprime 1. As variantes com Rc ou RefCell não satisfazem a restrição, produzindo E0277.'),
              visual: code(`fn sync<T: Sync>(value: T) -> T {
    value
}`, [1], 'Função disponível antes de main'),
            },
          ],
        },
      ],
    },
    {
      id: 'rp-conc-async', title: 'async e await em visão geral', parts: [
        {
          card: [
            { title: 'Chamar não é executar o corpo', body: 'Uma async fn devolve uma future. O corpo não roda só por chamar a função: a future precisa ser conduzida por polling, normalmente por um executor. Aqui a saída inteira é criada. O texto medindo não aparece: f foi descartada sem ser conduzida. Uma future não é uma thread, e criar uma future não agenda automaticamente uma tarefa.', visual: code(lazyCode, [6, 8], 'Uma future preguiçosa') },
            { title: 'Esperar dentro de async', body: 'Este código de biblioteca compila sem crate externa. Quando um executor conduzir dobro até concluir, medir().await entrega 8, e dobro conclui com 16. Não há impressão. await pode suspender a tarefa se o resultado ainda não estiver pronto; se estiver pronto, pode continuar imediatamente. await não cria outra thread. A biblioteca padrão fornece os blocos básicos; um runtime como Tokio integra execução e I/O async em aplicações reais, mas não será usado nos exemplos desta unidade.', visual: code(awaitCode, [5, 6, 7], 'Composição • src/lib.rs') },
            { title: 'Avance a vida de uma future', body: 'Os estados descrevem uma operação de I/O hipotética, e não a função medir do exemplo, que fica pronta sem I/O. Use as setas para distinguir criar, esperar e concluir.', visual: estados([
              ['chamador: cria future', 'corpo: ainda não iniciou', 'Chamar async fn produz um valor que guarda o trabalho pendente.'],
              ['executor: consulta tarefa', 'corpo: inicia operação', 'Ao ser conduzida, a tarefa avança até poder concluir ou precisar esperar.'],
              ['executor: pode rodar outra', 'tarefa: espera I/O', 'Se a future retorna Pending e organiza uma notificação, o executor pode atender outra tarefa.'],
              ['executor: consulta novamente', 'tarefa: entrega resultado', 'Após a notificação, a tarefa pode continuar. await produz o resultado quando estiver pronto.'],
            ]) },
          ],
          exercises: [
            mcq('O que chamar uma async fn produz?', ['Uma future que representa o trabalho', 'Uma thread do sistema obrigatoriamente', 'O valor final já calculado', 'Um MutexGuard'], 0, 'A chamada devolve uma future. O corpo async avança quando essa future é conduzida, não apenas por existir.'),
            mcq('Qual é toda a saída deste programa?', ['Apenas criada', 'medindo e depois criada', 'criada e depois medindo', 'Apenas o número 8'], 0, 'medir() cria f, mas ninguém conduz f. A única impressão executada fica em main: criada. drop descarta a future sem executar seu corpo.', { visual: code(lazyCode, [6, 7, 8], 'Siga o que realmente executa') }),
            tf('Cada await obriga a criação de uma thread nova.', false, 'await espera a conclusão de uma future no contexto async. Não cria uma thread. Se houver suspensão, o executor poderá usar a thread para outras tarefas prontas.'),
            num('Se um executor conduzir dobro até concluir, que inteiro será seu resultado?', 16, 'medir conclui com 8; await fornece esse inteiro a n; a expressão final n × 2 é 16. O trecho define funções de biblioteca e não imprime nada sozinho.', { visual: code(awaitCode, [6, 7], 'Resultado, não saída do terminal') }),
            gen((rng) => {
              const n = randInt(rng, 3, 12);
              return num('Ao conduzir dobro até concluir, qual resultado ele entrega?', n * 2, `A future medir entrega ${n}. Depois do await, n vale ${n}; o resultado de dobro é ${n * 2}. Sem um executor, apenas definir ou chamar essas funções não faz o corpo rodar.`, { visual: code(awaitCode.replace('    8', `    ${n}`), [3, 6, 7], 'Componha resultados') });
            }),
            mcq('Por que este uso de await falha?', ['E0728: main não é um contexto async', 'E0277: i32 não é Send', 'E0382: println moveu o número', 'E0373: toda async fn exige move'], 0, 'E0728: “`await` is only allowed inside `async` functions and blocks”. Coloque a espera em uma async fn ou bloco async e providencie um executor para conduzir a future externa. Mudar apenas main para async não funciona com a entrada padrão do executável.', { visual: code(awaitError, [5], 'Exemplo propositalmente incorreto') }),
            codePuzzle('Monte uma função pública em src/lib.rs que cria uma future com 5, espera seu resultado e retorna 6. Ela será conduzida pelo chamador; o trecho não imprime nada.', [
              'pub async fn proximo() -> i32 {',
              '    let f = async { 5 };',
              '    let n = f.await;',
              '    n + 1',
              '}',
            ], ['    let n = f;', '    n + 1;'], 'f representa o cálculo que retorna 5. await fornece o inteiro n; a expressão final sem ponto e vírgula retorna 6. Sem await, n seria a future, e com ponto e vírgula o corpo não retornaria o i32 exigido.'),
          ],
        },
        {
          card: [
            { title: 'Threads ou async?', body: 'Threads podem executar cálculo em paralelo quando há núcleos disponíveis; também acomodam APIs bloqueantes. Async é útil para coordenar muitas operações de I/O que passam tempo esperando e oferecem APIs async. Os dois podem coexistir. Duas esperas escritas em sequência não criam concorrência automaticamente: na função soma, a primeira conclui antes de começar a segunda. Ao ser conduzida, ela retorna 8, sem imprimir.', visual: code(sequencialCode, [3, 4, 5], 'Duas esperas sequenciais') },
            { title: 'Escolha o tipo de espera', body: 'Executores podem usar uma ou várias threads. Em qualquer caso, bloquear uma thread do executor com cálculo longo ou I/O bloqueante atrapalha as outras tarefas que dependem dela. Não retenha um MutexGuard de std durante uma espera async: reduza o escopo e solte a trava antes.', visual: table(['Situação', 'Ponto de partida'], [['Quatro cálculos intensivos independentes', 'threads / trabalho paralelo'], ['Muitas conexões esperando rede', 'I/O async + executor'], ['Biblioteca com leitura bloqueante', 'thread ou isolamento do bloqueio'], ['Dois awaits em sequência', 'execução sequencial dessas etapas']]) },
            { title: 'No seu computador', body: 'Preparação para o roteiro 47, sem dependências: crie futuro_preguicoso com Cargo. Em src/lib.rs, escreva uma async fn pública que imprime medindo e retorna 8; outra async fn pública deve esperar a primeira e retornar o dobro. Em main, chame a segunda, imprima criada e descarte a future sem conduzi-la. Pronto: cargo run imprime só criada; explique por que medindo não aparece e por que o resultado seria 16 se conduzido. Rode cargo check, cargo fmt e cargo clippy -- -D warnings. O servidor de eco da porta 9000 do roteiro é um passo posterior com runtime; Tokio fica apenas como indicação de estudo nesta visão geral.', visual: code('cargo new futuro_preguicoso\ncd futuro_preguicoso\ncargo check\ncargo run\ncargo fmt\ncargo clippy -- -D warnings', [], 'Terminal • antes do servidor async') },
          ],
          exercises: [
            mcq('Para milhares de conexões que esperam rede, com biblioteca async, qual abordagem costuma ser adequada?', ['Tarefas async conduzidas por um runtime', 'Uma thread nova por byte recebido', 'Rc para sincronizar todos os clientes', 'Remover todo tratamento de erro'], 0, 'Async permite aproveitar o tempo de espera para avançar outras tarefas, sem exigir uma thread do sistema dedicada a cada espera. Ainda é preciso um runtime e operações de I/O compatíveis.'),
            tf('Escrever dois awaits sucessivos inicia automaticamente as duas operações ao mesmo tempo.', false, 'A execução alcança o primeiro await e espera sua conclusão antes de alcançar a próxima linha. Para coordenar futures concorrentemente, é preciso uma construção apropriada; apenas escrever async não basta.'),
            num('Ao conduzir soma até concluir, qual inteiro ela entrega?', 8, 'O primeiro await fornece 3; o segundo fornece 5; a expressão final soma os resultados: 3 + 5 = 8. Não há impressão no trecho.', { visual: code(sequencialCode, [3, 4, 5], 'Sequência explícita') }),
            match('Associe o trabalho à preocupação principal:', [['Cálculo pesado em quatro núcleos', 'distribuir CPU entre threads'], ['Muitas esperas de I/O async', 'alternar tarefas prontas no executor'], ['Função bloqueante num executor', 'evitar prender a thread que serve outras tarefas']], 'Paralelizar CPU exige recursos de execução. Async organiza esperas sem ocupar uma thread por espera. Uma chamada bloqueante não passa a ser cooperativa por estar dentro de async.'),
            gen((rng) => {
              const a = randInt(rng, 2, 8);
              const b = randInt(rng, 9, 15);
              return num('Ao conduzir a função até concluir, qual soma será entregue?', a + b, `A primeira future entrega ${a}, a segunda entrega ${b}. A expressão final dá ${a} + ${b} = ${a + b}; os awaits continuam sequenciais.`, { visual: code(sequencialCode.replace('async { 3 }', `async { ${a} }`).replace('async { 5 }', `async { ${b} }`), [3, 4, 5], 'Outros resultados assíncronos') });
            }),
            multi('Quais duas decisões evitam bloquear outras tarefas async desnecessariamente?', ['Isolar trabalho de CPU longo em execução apropriada', 'Soltar o guard de um mutex antes de uma espera async', 'Chamar uma leitura bloqueante supondo que async a transforma', 'Manter a trava enquanto espera quem também precisa dela'], [0, 1], 'Cálculo longo e I/O bloqueante ocupam a thread do executor. Retirar esse trabalho do caminho cooperativo e não atravessar esperas com guards reduz bloqueios e riscos de deadlock.'),
            codePuzzle('Monte em src/lib.rs uma composição sequencial: espere a future de 4, crie outra dependente desse resultado, espere por ela e retorne 12. O chamador deverá conduzir a função.', [
              'pub async fn triplo() -> i32 {',
              '    let f = async { 4 };',
              '    let a = f.await;',
              '    let g = async { a * 3 };',
              '    let b = g.await;',
              '    b',
              '}',
            ], ['    let b = g;', '    b;'], 'O primeiro await entrega a = 4. Só depois g é criada e, quando conduzida, entrega 4 × 3 = 12. O último b é a expressão de retorno; nenhum executor ou paralelismo é criado por esta definição.'),
          ],
        },
      ],
    },
  ],
};

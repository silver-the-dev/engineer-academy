import React from 'react';
import type { UnitDef } from '../../types';
import { code, fill, gen, match, mcq, num, order, table, tf } from '../../helpers';
import { codePuzzle } from '../../codePractice';
import { randInt } from '../../../lib/random';
import { Label, Pt, Seg } from '../../../components/plot/Plot';

// Avançar mostra o estado do modelo, não executa Rust no app.
const track = (states: string[], labels: string[]) => ({
  name: 'stepper',
  props: {
    steps: states.length,
    height: 200,
    view: { xMin: 0, xMax: 6, yMin: -0.5, yMax: states.length - 0.5, grid: false, axes: false },
    render: (k: number) => <>
      <Seg x1={0.5} y1={0} x2={0.5} y2={states.length - 1} />
      {labels.map((label, i) => {
        const y = states.length - 1 - i;
        const color = i <= k ? '#58CC02' : '#9CA3AF';
        return <React.Fragment key={label}>
          <Pt x={0.5} y={y} color={color} r={7} hollow={i !== k} />
          <Label x={0.85} y={y} text={label} color={color} size={13} />
        </React.Fragment>;
      })}
    </>,
    info: (k: number) => states[k],
  },
});

const plan = `#[derive(Debug, PartialEq)]
enum Error {
    Empty,
}
struct Task {
    title: String,
}
impl Task {
    fn new(s: &str)
        -> Result<Self, Error>
    {
        if s.trim().is_empty() {
            return Err(Error::Empty);
        }
        Ok(Self { title: s.to_owned() })
    }
}
trait Summary {
    fn summary(&self) -> &str;
}
impl Summary for Task {
    fn summary(&self) -> &str {
        &self.title
    }
}
fn main() {
    match Task::new("estudar") {
        Ok(t) => {
            println!("{}", t.summary());
        }
        Err(e) => eprintln!("{e:?}"),
    }
}
#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn rejects_empty() {
        assert!(matches!(
            Task::new("  "),
            Err(Error::Empty)
        ));
    }
}`;

const moveError = `fn main() {
    let title = String::from("estudar");
    let saved = title;
    println!("{title}");
    println!("{saved}");
}`;

const taskModel = `#[derive(Debug, PartialEq)]
enum Error {
    Missing,
}
struct Task {
    title: String,
    done: bool,
}
fn finish(
    tasks: &mut [Task],
    id: usize,
) -> Result<(), Error> {
    let t = tasks.get_mut(id)
        .ok_or(Error::Missing)?;
    t.done = true;
    Ok(())
}
fn main() {
    let mut tasks = vec![Task {
        title: "estudar".into(),
        done: false,
    }];
    match finish(&mut tasks, 0) {
        Ok(()) => println!(
            "{}: {}",
            tasks[0].title,
            tasks[0].done
        ),
        Err(e) => eprintln!("{e:?}"),
    }
}`;

// Programa completo: gerenciador em memória durante uma sessão.
const tasks = `use std::io::{self, BufRead};

struct Task {
    title: String,
    done: bool,
}
#[derive(Debug, PartialEq)]
enum Error {
    Command,
    Empty,
    Missing,
}
fn apply(
    tasks: &mut Vec<Task>,
    line: &str,
) -> Result<(), Error> {
    if let Some(s) = line.strip_prefix(
        "add "
    ) {
        if s.trim().is_empty() {
            return Err(Error::Empty);
        }
        tasks.push(Task {
            title: s.to_owned(),
            done: false,
        });
    } else if let Some(s) =
        line.strip_prefix("done ")
    {
        let id = s.parse::<usize>()
            .map_err(|_| {
                Error::Command
            })?;
        let t = tasks.get_mut(id)
            .ok_or(Error::Missing)?;
        t.done = true;
    } else if line != "list" {
        return Err(Error::Command);
    }
    Ok(())
}
fn main() -> io::Result<()> {
    let mut tasks = Vec::new();
    let input = io::stdin();
    for line in input.lock().lines() {
        let line = line?;
        match apply(&mut tasks, &line) {
            Ok(()) => {
                let items =
                    tasks.iter();
                for (id, t) in
                    items.enumerate() {
                    println!(
                        "{id}: {} [{}]",
                        t.title, t.done
                    );
                }
            }
            Err(e) => {
                eprintln!("{e:?}");
            }
        }
    }
    Ok(())
}
#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn flow() {
        let mut v = Vec::new();
        assert_eq!(
            apply(
                &mut v, "add estudar"
            ),
            Ok(())
        );
        assert_eq!(
            apply(&mut v, "done 0"),
            Ok(())
        );
        assert!(v[0].done);
        assert_eq!(
            apply(&mut v, "done 9"),
            Err(Error::Missing)
        );
        assert_eq!(
            apply(&mut v, "add  "),
            Err(Error::Empty)
        );
    }
}`;

const borrowError = `fn main() {
    let mut tasks = vec![
        String::from("estudar")
    ];
    let first = &tasks[0];
    tasks.push(String::from("testar"));
    println!("{first}");
}`;

const logModel = `#[derive(Debug, PartialEq)]
enum Level {
    Info,
    Error,
}
type Entry<'a> = (Level, &'a str);
fn parse(s: &str)
    -> Result<Entry<'_>, &'static str> {
    let (level, message) = s
        .split_once(' ')
        .ok_or("sem separador")?;
    if message.trim().is_empty() {
        return Err("mensagem vazia");
    }
    let level = match level {
        "INFO" => Level::Info,
        "ERROR" => Level::Error,
        _ => {
            return Err(
                "nível inválido"
            );
        }
    };
    Ok((level, message))
}
fn main() {
    let line = "ERROR falha no sensor";
    match parse(line) {
        Ok((level, message)) => {
            println!(
                "{level:?}: {message}"
            );
        }
        Err(e) => eprintln!("{e}"),
    }
}`;

// A chave do mapa é própria; nenhuma chave aponta para uma linha temporária.
const logs = `use std::collections::BTreeMap;
use std::error::Error;
use std::io;

#[derive(Debug, PartialEq, Eq,
    PartialOrd, Ord)]
enum Level {
    Info,
    Error,
}
fn parse(s: &str)
    -> Result<Level, &'static str>
{
    let (level, message) = s
        .split_once(' ')
        .ok_or("sem separador")?;
    if message.trim().is_empty() {
        return Err("mensagem vazia");
    }
    match level {
        "INFO" => Ok(Level::Info),
        "ERROR" => Ok(Level::Error),
        _ => Err("nível inválido"),
    }
}
type Counts = BTreeMap<Level, usize>;
fn count(text: &str)
    -> Result<Counts, String> {
    let mut counts = BTreeMap::new();
    for (i, line) in
        text.lines().enumerate()
    {
        let level = parse(line)
            .map_err(|e| {
                format!(
                    "linha {}: {e}",
                    i + 1
                )
            })?;
        *counts.entry(level)
            .or_insert(0) += 1;
    }
    Ok(counts)
}
fn main()
    -> Result<(), Box<dyn Error>> {
    let path = std::env::args().nth(1)
        .ok_or("informe o arquivo")?;
    let text =
        std::fs::read_to_string(path)?;
    let counts = count(&text)
        .map_err(io::Error::other)?;
    for (level, n) in counts {
        println!("{level:?}: {n}");
    }
    Ok(())
}
#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn flow() {
        let text =
            "INFO ok\\nERROR falha";
        let c = count(text)
            .expect("entrada válida");
        assert_eq!(c.get(&Level::Info),
            Some(&1));
        assert_eq!(c.get(&Level::Error),
            Some(&1));
        let invalid = "INFO ok\\nRUIM x";
        let message =
            "linha 2: nível inválido";
        assert_eq!(count(invalid),
            Err(message.to_owned()));
        assert_eq!(count(""),
            Ok(BTreeMap::new()));
    }
}`;

const route = `#[derive(Debug, PartialEq)]
enum Route {
    Home,
    Missing,
}
fn route(line: &str) -> Route {
    match line.trim_end() {
        "GET / HTTP/1.1" => Route::Home,
        _ => Route::Missing,
    }
}
fn main() {
    println!("{:?}",
        route("GET / HTTP/1.1\\r\\n"));
}`;

const http = `use std::io::{self, BufRead, BufReader};
use std::io::Write;
use std::net::{TcpListener, TcpStream};
use std::time::Duration;

#[derive(Debug, PartialEq)]
enum Route {
    Home,
    Missing,
}
fn route(line: &str) -> Route {
    match line.trim_end() {
        "GET / HTTP/1.1" => Route::Home,
        _ => Route::Missing,
    }
}
fn response(route: Route) -> String {
    let (status, body) = match route {
        Route::Home => {
            ("200 OK", "Olá!")
        }
        Route::Missing => {
            ("404 Not Found", "Ausente")
        }
    };
    let n = body.len();
    format!(
        "HTTP/1.1 {status}\\r\\n\\
Content-Length: {n}\\r\\n\\
Connection: close\\r\\n\\
\\r\\n{body}"
    )
}
fn send(w: &mut impl Write, r: Route)
    -> io::Result<()>
{
    w.write_all(response(r).as_bytes())
}
fn handle(mut s: TcpStream)
    -> io::Result<()>
{
    s.set_read_timeout(Some(
        Duration::from_secs(2)
    ))?;
    s.set_write_timeout(Some(
        Duration::from_secs(2)
    ))?;
    let mut reader = BufReader::new(&s);
    let mut first = String::new();
    let n =
        reader.read_line(&mut first)?;
    if n == 0 {
        return Ok(());
    }
    loop {
        let mut header = String::new();
        let n = reader.read_line(
            &mut header
        )?;
        if n == 0 || header == "\\r\\n" {
            break;
        }
    }
    send(&mut s, route(&first))
}
fn main() -> io::Result<()> {
    let listener = TcpListener::bind(
        "127.0.0.1:7878"
    )?;
    for stream in listener.incoming() {
        match stream.and_then(handle) {
            Ok(()) => {}
            Err(e) => eprintln!("{e}"),
        }
    }
    Ok(())
}
#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn flow() -> io::Result<()> {
        assert_eq!(
            route("GET / HTTP/1.1\\r\\n"),
            Route::Home
        );
        assert_eq!(
            route("GET /x HTTP/1.1"),
            Route::Missing
        );
        let mut out = Vec::new();
        send(&mut out, Route::Home)?;
        let expected = concat!(
            "HTTP/1.1 200 OK\\r\\n",
            "Content-Length: 5\\r\\n",
            "Connection: close\\r\\n",
            "\\r\\nOlá!"
        );
        assert_eq!(
            out, expected.as_bytes()
        );
        Ok(())
    }
}`;

const library = `//! Núcleo de uma lista de tarefas.

/// Conta os itens ainda pendentes.
///
/// # Examples
///
/// \`\`\`
/// use task_core::pending;
/// let done = [true, false];
/// assert_eq!(pending(&done), 1);
/// \`\`\`
pub fn pending(done: &[bool]) -> usize {
    done.iter().filter(|&&d| !d).count()
}
#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn empty() {
        assert_eq!(pending(&[]), 0);
    }
}`;

export const rustProjetos: UnitDef = {
  id: 'rp-proj', title: 'Seus próprios programas', icon: '🏁',
  subtitle: 'Modele, implemente, teste e compartilhe programas Rust',
  source: 'The Rust Programming Language, edição 2024, caps. 12, 14.2 e 21: https://doc.rust-lang.org/book/ · Cargo Book: https://doc.rust-lang.org/cargo/commands/cargo-publish.html · Desafio 50 Dias — Rust, exercícios 28, 30, 36–37, 42, 48 e projetos de consolidação 1–3.',
  guide: 'Comece por entradas, saídas e casos de falha. Structs agrupam dados; enums enumeram estados e erros; traits descrevem capacidades que precisam variar. O núcleo recebe referências e devolve Result; a borda cuida de arquivos, terminal ou rede. Vec mantém a sequência; BTreeMap entrega chaves ordenadas. Iteradores filtram e agregam sem transferir a posse quando você usa iter(). Teste vazio, válido, inválido e limites. Para HTTP didático: linha inicial → rota → status e corpo → bytes com Content-Length. Antes de compartilhar: cargo fmt, cargo test, cargo clippy -- -D warnings, documentação, licença e cargo publish --dry-run. O app só mostra e monta código; execute os projetos no computador com edition = "2024". Todos os projetos desta unidade usam apenas std.',
  extra: true,
  lessons: [
    {
      id: 'rp-proj-plano', title: 'Do problema ao desenho de tipos', parts: [
        {
          card: [
            { title: 'Um requisito vira um tipo', body: 'Queremos guardar uma tarefa com título não vazio e mostrar um resumo. A struct é dona do texto; o enum descreve a falha esperada. O construtor valida antes de criar a tarefa. A trait Summary é uma fronteira de comportamento: só vale mantê-la se outras entidades também precisarem oferecer um resumo. O programa completo imprime estudar.', visual: code(plan, [3, 6, 10], 'src/main.rs · edição 2024') },
            { title: 'Siga a posse', body: 'Avance para acompanhar uma construção válida. A cópia do texto é uma decisão da fronteira: a tarefa deve continuar válida depois que a entrada desaparecer.', visual: track(['Entrada emprestada: &str aponta para estudar.', 'Validação: trim não é vazio; nenhuma tarefa inválida é criada.', 'Construção: Task é dona de uma nova String no heap.', 'summary empresta &str; a Task continua dona do texto.', 'Ao sair do escopo, Task e seu texto são liberados.'], ['Entrada: &str', 'Validação', 'Task possui String', 'summary empresta &str', 'Drop libera o texto']) },
          ],
          exercises: [
            mcq('Qual tipo reúne os campos de uma tarefa?', ['Uma struct', 'Um comentário', 'Um Result sem dados', 'Um comando Cargo'], 0, 'A struct agrupa dados da mesma entidade. O enum descreve alternativas, e Result descreve sucesso ou falha.'),
            mcq('Qual tipo representa título ausente OU título fornecido, sem usar texto vazio como sentinela?', ['Option<String>', 'String sempre vazia', 'usize', 'Vec<bool>'], 0, 'Option distingue None de Some(String). Validar o conteúdo de Some continua sendo uma etapa separada.'),
            mcq('O que este programa imprime?', ['estudar', 'Empty', '0', 'true'], 0, 'A entrada não é vazia. O construtor cria Task e summary devolve uma referência ao título.', { visual: code(plan, [27, 28, 29], 'Construir e observar') }),
            match('Associe cada decisão à responsabilidade.', [['struct Task', 'Guardar os dados próprios'], ['enum Error', 'Distinguir falhas previstas'], ['trait Summary', 'Definir uma capacidade comum'], ['Task::new', 'Validar a entrada']], 'Dados, alternativas, capacidades e validação têm papéis diferentes. Um nome para cada papel deixa o desenho mais fácil de testar.'),
            tf('Para mostrar o título por referência, é obrigatório clonar a Task inteira.', false, 'summary recebe &self e empresta o texto. Ler não exige transferir a posse nem clonar a tarefa.'),
            gen((rng) => {
              const n = randInt(rng, 2, 8);
              return num('Quantos títulos passam pelo filtro?', n, `Há ${n} títulos iguais a estudar e um título vazio. O filtro rejeita só o vazio; count devolve ${n}.`, { visual: code(`fn main() {
    let mut titles = vec!["estudar"; ${n}];
    titles.push("");
    let n = titles.iter()
        .filter(|s| {
            !s.trim().is_empty()
        })
        .count();
    println!("{n}");
}`, [4, 5, 6], 'Filtrar requisitos') });
            }),
            codePuzzle('Monte um programa que empresta o título e depois reutiliza o dono.', ['fn main() {', '    let title = String::from("estudar");', '    let view = title.as_str();', '    let n = view.len();', '    println!("{title}: {n}");', '}'], ['    let view = title;', '    let n = view.push_str("!");'], 'title é dona da String. view empresta o texto e len retorna 7 bytes. O último uso de view ocorre antes da impressão, que mostra estudar: 7.'),
            mcq('Compila? Identifique o diagnóstico principal.', ['Não: E0382, uso após move', 'Sim: imprime estudar duas vezes', 'Não: E0308, inteiro no lugar de texto', 'Sim: a atribuição clona a String'], 0, 'E0382: borrow of moved value: `title`. A atribuição move a String para saved. Corrija com um empréstimo ao criar saved, se ambos só precisam ler.', { visual: code(moveError, [3, 4], 'Exemplo incorreto') }),
          ],
        },
        {
          card: [
            { title: 'Um núcleo que você consegue testar', body: 'No mesmo programa, o teste chama o construtor diretamente: nenhum terminal e nenhum arquivo. A interface de entrada só escolhe como apresentar Ok e Err. Comece com o menor caminho que funciona e adicione uma exigência por vez. Evite criar uma trait para cada função; uma função concreta basta quando não há comportamentos alternativos.', visual: code(plan, [37, 38, 39, 40, 41], 'Validação testável') },
            { title: 'Contrato antes da implementação', body: 'Escreva exemplos observáveis antes de programar. O domínio não precisa saber se a entrada veio do terminal ou de um arquivo.', visual: table(['Entrada', 'Resultado do núcleo'], [['estudar', 'Ok(Task)'], ['apenas espaços', 'Err(Empty)'], ['texto válido, leitura de resumo', '&str; dono preservado']]) },
            { title: 'No seu computador', body: 'Crie um projeto com cargo new task_plan e edition = "2024". Copie o programa completo. Inspirado no exercício 48 do roteiro, separe o núcleo testável da entrada e saída: depois mova Task, Error e Summary para um módulo. Pronto quando cargo run imprime estudar, cargo test aceita o teste do vazio e um teste novo do título válido, e cargo fmt e cargo clippy -- -D warnings terminam sem avisos. Adicione um caso com acento e confira que o título é preservado.', visual: code('cargo new task_plan\ncd task_plan\ncargo run\ncargo test\ncargo fmt\ncargo clippy -- -D warnings', undefined, 'Terminal · desafio local') },
          ],
          exercises: [
            mcq('Onde deve morar a regra “título não pode ser vazio”?', ['No construtor do núcleo', 'Só na cor do botão', 'Só no println do main', 'Em um comentário sem teste'], 0, 'Centralizar a validação no construtor evita que uma segunda interface crie valores inválidos por esquecer a regra.'),
            tf('Um erro de leitura de arquivo e um título vazio têm a mesma causa.', false, 'Leitura é uma falha de entrada e saída; título vazio é uma falha do domínio. Separá-las permite mensagens e testes específicos.'),
            mcq('Qual resultado o teste procura?', ['Err(Error::Empty)', 'Ok com título vazio', 'Uma impressão em stdout', 'Um panic obrigatório'], 0, 'matches! verifica a variante Err(Error::Empty), pois uma entrada só de espaços não passa pela validação.', { visual: code(plan, [39, 40, 41], 'Teste sem terminal') }),
            fill('Complete a regra de responsabilidade.', 'O núcleo calcula; a ___ apresenta o resultado.', ['interface'], ['heap', 'macro', 'licença'], 'A interface converte a entrada e mostra a saída. O núcleo mantém as regras independentes dessa apresentação.'),
            order('Ordene a evolução de um requisito.', ['Escrever exemplos válidos e inválidos', 'Definir dados e retorno de erro', 'Implementar o menor núcleo', 'Rodar testes e integrar a interface'], 'Exemplos dão o contrato; tipos tornam o contrato explícito; a implementação satisfaz os testes; por fim a interface usa esse núcleo.'),
            gen((rng) => {
              const n = randInt(rng, 2, 7);
              return num('Quantas entradas são rejeitadas?', n, `Os ${n} itens contêm apenas espaços. trim produz texto vazio em todos; o título estudar não é contado.`, { visual: code(`fn main() {
    let mut input = vec!["  "; ${n}];
    input.push("estudar");
    let invalid = input.iter()
        .filter(|s| s.trim().is_empty())
        .count();
    println!("{invalid}");
}`) });
            }),
            codePuzzle('Monte um teste mínimo para a regra do título vazio.', ['#[test]', 'fn rejects_spaces() {', '    let input = "  ";', '    let empty = input.trim().is_empty();', '    assert!(empty);', '}'], ['    assert!(!empty);', '    let empty = input.len() == 0;'], 'O teste recebe espaços, normaliza com trim e verifica vazio. Em um projeto real, chame também o construtor para testar a regra pública, como no card.'),
            mcq('Chegou uma segunda interface web. Qual desenho permite reaproveitar os testes?', ['Manter o núcleo e trocar só a borda', 'Mover toda validação para HTML', 'Duplicar a regra em cada tela', 'Trocar Result por encerramento do processo'], 0, 'O mesmo núcleo pode atender CLI e web. Erros tipados permitem que cada borda escolha sua forma de apresentação sem duplicar a regra.'),
          ],
        },
      ],
    },
    {
      id: 'rp-proj-tarefas', title: 'Projeto: gerenciador de tarefas', parts: [
        {
          card: [
            { title: 'Lista própria, acesso emprestado', body: 'Vamos construir um gerenciador de sessão: add cria, done conclui e list mostra. Vec é dono das tarefas; cada Task é dona do título. O índice começa em zero e serve como identificador enquanto não removemos nem reordenamos itens. finish recebe uma slice mutável porque não precisa aumentar a lista. O programa imprime estudar: true.', visual: code(taskModel, [11, 14, 15], 'Primeira versão completa') },
            { title: 'Concluir sem copiar a lista', body: 'Avance e veja o empréstimo terminar antes da listagem. Um índice inexistente vira um erro esperado, sem acesso fora do vetor.', visual: track(['Vec possui Task { estudar, false }.', 'finish empresta a slice com &mut; o chamador aguarda.', 'get_mut(0) devolve Some(&mut Task).', 'done muda de false para true; o título permanece.', 'finish retorna Ok; o chamador volta a ler o vetor.'], ['Vec possui Task', '&mut [Task]', 'Some(&mut Task)', 'done: false → true', 'Empréstimo encerrado']) },
          ],
          exercises: [
            mcq('Qual coleção mantém as tarefas na ordem de inserção?', ['Vec<Task>', 'Um bool isolado', 'Uma referência a texto temporário', 'Um enum sem campos'], 0, 'Vec reúne tarefas e preserva a sequência. A posição pode servir como identificador neste projeto sem remoções.'),
            mcq('Por que o título é uma String?', ['A tarefa deve ser dona do texto', 'String é sempre Copy', 'String aceita só ASCII', 'String dispensa qualquer validação'], 0, 'O título deve sobreviver à linha de entrada. Uma String própria não depende do tempo de vida do buffer do terminal.'),
            mcq('O que a primeira versão imprime?', ['estudar: true', 'estudar: false', 'Missing', 'estudar: 1'], 0, 'get_mut(0) encontra a tarefa; finish marca done como true e retorna Ok. O main lê o mesmo objeto alterado.', { visual: code(taskModel, [15, 23, 26, 27], 'Uma conclusão') }),
            match('Associe a operação à forma de acesso.', [['Só listar', 'Empréstimo compartilhado'], ['Marcar como feita', 'Empréstimo mutável'], ['Adicionar uma Task', 'Mover a Task para Vec'], ['Buscar índice inválido', 'Receber None de get_mut']], 'A lista mantém os donos. Leituras usam referências compartilhadas; mudanças usam exclusivas; adicionar transfere posse; busca segura explicita ausência.'),
            tf('Usar get_mut evita que um índice inexistente cause panic por indexação.', true, 'get_mut devolve Option. ok_or transforma None em Err(Error::Missing), e ? devolve essa falha ao chamador.'),
            gen((rng) => {
              const n = randInt(rng, 3, 9);
              const done = randInt(rng, 1, n - 1);
              return num('Quantas tarefas continuam pendentes?', n - done, `Há ${n} posições, com índices de 0 a ${n - 1}. O predicado marca ${done} delas; filter conta as ${n - done} restantes.`, { visual: code(`fn main() {
    let done: Vec<bool> = (0..${n})
        .map(|i| i < ${done})
        .collect();
    let pending = done.iter()
        .filter(|&&d| !d).count();
    println!("{pending}");
}`) });
            }),
            codePuzzle('Monte a lista e conclua sua única tarefa, imprimindo true.', ['fn main() {', '    let mut done = vec![false];', '    let first = &mut done[0];', '    *first = true;', '    println!("{}", done[0]);', '}'], ['    let done = vec![false];', '    first = true;'], 'O vetor precisa ser mutável. first é uma referência exclusiva ao bool; *first altera o elemento. Esse empréstimo termina antes da leitura no println.'),
            mcq('Por que este trecho não compila?', ['E0502: push conflita com o empréstimo ainda usado', 'E0382: todo Vec foi consumido por um laço', 'E0308: push exige bool', 'Compila: referências nunca impedem push'], 0, 'E0502: cannot borrow `tasks` as mutable because it is also borrowed as immutable. first ainda é usado após push; uma realocação poderia invalidá-lo. Imprima first antes de chamar push.', { visual: code(borrowError, [5, 6, 7], 'Exemplo incorreto') }),
          ],
        },
        {
          card: [
            { title: 'Um programa inteiro, de comandos a testes', body: 'Copie o arquivo completo. Cada linha da entrada é um comando; após sucesso, a lista inteira é impressa. add estudar imprime 0: estudar [false]; depois done 0 imprime 0: estudar [true]. list imprime a lista sem mudar nada. Comandos inválidos são relatados em stderr e a sessão continua. EOF encerra. O estado vive só nesta execução; persistência é uma extensão.', visual: code(tasks, [23, 34, 36, 47], 'src/main.rs · gerenciador completo') },
            { title: 'Onde mora cada erro?', body: 'Separar falhas de domínio das de I/O deixa claro quem pode recuperar. A leitura usa a trait BufRead; o núcleo não precisa saber dela.', visual: table(['Caso', 'Resultado'], [['done abc', 'Error::Command'], ['done 9 em lista pequena', 'Error::Missing'], ['add seguido só de espaços', 'Error::Empty'], ['Falha ao ler stdin', 'io::Error; main devolve Err']]) },
            { title: 'No seu computador', body: 'Execute cargo new task_session e copie o gerenciador. Na mesma sessão, forneça add estudar, done 0 e list, cada um em sua linha; as últimas duas listagens devem mostrar 0: estudar [true]. Encerre a entrada com EOF. Pronto quando cargo test cobre adicionar, concluir e índice inexistente; adicione testes para comando desconhecido e entrada numérica inválida; rode cargo fmt e cargo clippy -- -D warnings. Extensão dos exercícios 42 e 48: salve e recarregue tarefas com Result, mantendo índices estáveis e testando arquivo inválido antes de substituir a lista atual.', visual: code('cargo new task_session\ncd task_session\ncargo run\ncargo test\ncargo fmt\ncargo clippy -- -D warnings', undefined, 'Terminal · projeto de sessão') },
          ],
          exercises: [
            mcq('No gerenciador completo, que comando apenas consulta?', ['list', 'add estudar', 'done 0', 'done 1'], 0, 'list passa pela validação sem modificar o vetor. O main imprime a lista depois de qualquer comando bem-sucedido.'),
            tf('O gerenciador completo recupera as tarefas ao abrir uma nova execução.', false, 'O Vec está apenas em memória. Ao encerrar, ele é descartado. Persistência em arquivo é a extensão proposta, não uma função já implementada.'),
            mcq('O que este filtro imprime?', ['1', '2', '0', '3'], 0, 'Só false representa tarefa pendente. iter empresta os elementos, e a closure desempacota as duas referências recebidas pelo filtro.', { visual: code(`fn main() {
    let done = [true, false, true];
    let n = done.iter()
        .filter(|&&d| !d).count();
    println!("{n}");
}`, [3, 4]) }),
            fill('Complete o contrato de uma atualização que pode falhar.', 'Sucesso sem valor útil: ___; falha prevista: Err(Error).', ['Ok(())'], ['None', 'true', 'panic!'], 'A atualização retorna Result<(), Error>. O tipo unit representa sucesso sem conteúdo extra; Err carrega a causa.'),
            order('Ordene um teste de aceitação para uma sessão vazia.', ['Enviar add estudar', 'Conferir estudar com false', 'Enviar done 0', 'Conferir estudar com true'], 'Primeiro criamos a tarefa, observamos seu estado inicial e depois verificamos a transição para concluída.'),
            gen((rng) => {
              const n = randInt(rng, 3, 8);
              return num('Qual é o maior índice válido desta lista?', n - 1, `A lista tem ${n} elementos. Como a indexação começa em zero, seu último índice é ${n - 1}.`, { visual: code(`fn main() {
    let tasks = vec![false; ${n}];
    println!("{}", tasks.len() - 1);
}`) });
            }),
            codePuzzle('Monte um programa que trata um índice inexistente sem panic.', ['fn main() {', '    let tasks = [false];', '    let result = tasks.get(3);', '    let missing = result.is_none();', '    println!("{missing}");', '}'], ['    let result = tasks[3];', '    let missing = result.is_some();'], 'get(3) retorna None porque só há o índice zero. is_none é true; o programa imprime true e não acessa memória fora da coleção.'),
            mcq('Ao acrescentar persistência, qual teste protege os dados atuais?', ['Arquivo inválido não substitui a lista válida', 'O arquivo sempre é considerado correto', 'Falha de parse apaga tudo primeiro', 'Toda falha vira unwrap no main'], 0, 'Leia e valide em uma coleção temporária. Só troque o estado atual depois de obter Ok; assim um arquivo inválido não destrói dados válidos.'),
          ],
        },
      ],
    },
    {
      id: 'rp-proj-log', title: 'Projeto: analisador de logs', parts: [
        {
          card: [
            { title: 'Uma linha vira dados ou erro', body: 'O Projeto 1 do roteiro amplia um grep; aqui extraímos estatísticas dos registros. O formato é nível, um espaço e mensagem não vazia. Só INFO e ERROR são aceitos. O parser devolve um enum e uma fatia da mensagem sem alocar outra String. O programa imprime Error: falha no sensor. Depois agregaremos os níveis e leremos um arquivo.', visual: code(logModel, [10, 16, 24], 'Parser completo e executável') },
            { title: 'Texto original e fatias', body: 'Avance e veja por que o parser pode emprestar. Nenhuma fatia pode sobreviver ao texto que a sustenta.', visual: track(['String do arquivo possui todos os bytes no heap.', 'lines empresta uma fatia por linha.', 'split_once separa nível e mensagem em duas fatias.', 'O enum Level guarda a classificação; não aponta para o texto.', 'A mensagem emprestada só é válida enquanto o texto original existir.'], ['String possui bytes', 'lines empresta &str', 'split_once: duas fatias', 'Level: valor próprio', 'Dono limita a referência']) },
          ],
          exercises: [
            mcq('Qual tipo fecha o conjunto de níveis aceitos?', ['enum Level', 'String sem validação', 'Um ponteiro cru', 'Um inteiro com qualquer valor'], 0, 'Level só tem Info e Error. Após a validação, o restante do programa não precisa lidar com nomes de níveis desconhecidos.'),
            mcq('Por que split_once é adequado ao formato?', ['Separa no primeiro espaço e preserva o restante', 'Apaga todos os espaços da mensagem', 'Ordena as palavras', 'Converte a mensagem em inteiro'], 0, 'A mensagem pode conter vários espaços. split_once separa apenas o primeiro, deixando o conteúdo restante unido.'),
            mcq('Que resultado este programa mostra?', ['Error: falha no sensor', 'Info: falha', 'nível inválido', 'sem separador'], 0, 'ERROR é reconhecido como Level::Error; a mensagem contém todo o texto depois do primeiro espaço.', { visual: code(logModel, [27, 28, 31]) }),
            match('Associe entrada ao resultado do parser.', [['INFO pronto', 'Sucesso: Info'], ['ERROR falha', 'Sucesso: Error'], ['DEBUG detalhe', 'Erro: nível inválido'], ['INFO', 'Erro: sem separador']], 'A classificação valida o nível depois de encontrar o separador e verificar mensagem não vazia. Nenhuma entrada inválida vira Info silenciosamente.'),
            tf('No parser, a mensagem retornada é uma String nova e independente.', false, 'O retorno contém &str, uma fatia da entrada. A regra de elisão liga a vida dessa referência ao argumento s.'),
            gen((rng) => {
              const n = randInt(rng, 2, 8);
              return num('Quantas linhas têm o prefixo ERROR seguido de espaço?', n, `repeat cria ${n} linhas ERROR e uma INFO é acrescentada. lines não cria uma linha extra pelo separador final; o filtro conta ${n}.`, { visual: code(`fn main() {
    let mut log = "ERROR falha\\n"
        .repeat(${n});
    log.push_str("INFO pronto\\n");
    let errors = log.lines()
        .filter(|s| s.starts_with(
            "ERROR "
        )).count();
    println!("{errors}");
}`) });
            }),
            codePuzzle('Monte uma busca que mantém apenas linhas de erro.', ['fn main() {', '    let log = "INFO ok\\nERROR falha";', '    let lines = log.lines();', '    let errors = lines.filter(', '        |s| s.starts_with("ERROR ")', '    );', '    println!("{}", errors.count());', '}'], ['    let errors = lines.map(', '    let lines = log.chars();'], 'lines produz linhas; filter preserva só ERROR falha; count consome o iterador e retorna 1. O programa imprime 1.'),
            mcq('Qual decisão preserva informação útil sobre linhas ruins?', ['Retornar erro com número da linha', 'Ignorar qualquer linha que não pareça correta', 'Transformar toda linha em INFO', 'Usar panic para entrada inválida'], 0, 'Uma linha malformada é entrada esperada, não bug de memória. Um Result com contexto permite localizar o problema e escolher uma política explícita.'),
          ],
        },
        {
          card: [
            { title: 'Arquivo → parser → mapa → relatório', body: 'Este é o analisador completo. Passe o caminho do arquivo como argumento. count devolve um BTreeMap com chaves Level próprias. A ordem é a declaração do enum, graças ao derive Ord: Info vem antes de Error, mesmo que ERROR apareça primeiro no arquivo. Erros de parse recebem número da linha; o main converte o texto da falha em io::Error. O programa para na primeira linha inválida.', visual: code(logs, [33, 37, 40, 41, 53], 'src/main.rs · analisador completo') },
            { title: 'Estado da agregação', body: 'Avance após cada linha. entry encontra ou cria o contador; não há uma busca separada para testar a existência.', visual: track(['Mapa vazio: nenhuma chave.', 'ERROR falha → Error: 1.', 'INFO pronto → Info: 1; Error: 1.', 'ERROR parada → Info: 1; Error: 2.', 'Relatório final segue a ordem das chaves: Info, Error.'], ['Mapa vazio', 'Error: 1', 'Info: 1; Error: 1', 'Info: 1; Error: 2', 'Iteração ordenada']) },
            { title: 'No seu computador', body: 'Crie cargo new log_report e copie o analisador. Crie um arquivo com três linhas: ERROR falha, INFO pronto e ERROR parada. cargo run -- sample.log deve imprimir Info: 1 e Error: 2, nessa ordem. Pronto quando cargo test passa, cargo fmt e cargo clippy -- -D warnings não avisam, e uma linha DEBUG detalhe é rejeitada com o número correto. Baseado no grep do Projeto 1 e na contagem do exercício 30: acrescente filtro por palavra e teste linhas vazias, acentos e arquivo inexistente. Não descarte falhas sem registrar.', visual: code('cargo new log_report\ncd log_report\ncargo run -- sample.log\ncargo test\ncargo fmt\ncargo clippy -- -D warnings', undefined, 'Terminal · relatório de logs') },
          ],
          exercises: [
            mcq('Por que escolher BTreeMap neste relatório?', ['Itera pelas chaves em ordem', 'Nunca pode falhar ao alocar', 'Lê o arquivo sozinho', 'Elimina a validação de níveis'], 0, 'BTreeMap mantém chaves ordenadas. Neste projeto Level deriva Ord; por isso o relatório é determinístico.'),
            tf('A ordem das chaves Level deriva da ordem das variantes, não do texto INFO e ERROR no arquivo.', true, 'O derive Ord para este enum sem campos ordena Info antes de Error porque Info foi declarada primeiro.'),
            mcq('O que será impresso?', ['Some(2)', 'Some(1)', 'None', '2 0'], 0, 'A primeira entry insere zero e soma um; a segunda reutiliza o mesmo contador e soma outro. get devolve Some(&2), impresso como Some(2).', { visual: code(`use std::collections::BTreeMap;
fn main() {
    let mut counts = BTreeMap::new();
    *counts.entry("ERROR").or_insert(0)
        += 1;
    *counts.entry("ERROR").or_insert(0)
        += 1;
    println!("{:?}",
        counts.get("ERROR"));
}`, [4, 6]) }),
            fill('Complete a responsabilidade do contexto.', 'enumerate começa em zero; para o leitor do arquivo mostramos índice ___.', ['mais um'], ['menos um', 'vezes dois', 'sem conversão'], 'A primeira linha tem índice 0 no iterador, mas número 1 no arquivo. Somar um deixa o diagnóstico natural para quem lê.'),
            match('Associe cada etapa ao seu erro.', [['read_to_string', 'Falha de I/O'], ['parse', 'Formato ou nível inválido'], ['count', 'Contexto com número da linha'], ['main', 'Propagação para a borda do programa']], 'O erro nasce onde a operação falha. As camadas superiores acrescentam contexto e decidem a apresentação, mantendo Result.'),
            gen((rng) => {
              const good = randInt(rng, 1, 7);
              return num('Em qual número de linha o formato é inválido?', good + 1, `Há ${good} linhas válidas antes de RUIM. Sua posição de índice ${good} vira linha ${good + 1} para o usuário.`, { visual: code(`fn main() {
    let mut log = "INFO pronto\\n"
        .repeat(${good});
    log.push_str("RUIM");
    let lines = log.lines();
    for (i, s) in lines.enumerate() {
        if !s.contains(' ') {
            println!("{}", i + 1);
        }
    }
}`) });
            }),
            codePuzzle('Monte um contador de linhas usando o iterador sem mover o texto.', ['fn main() {', '    let text = String::from("a\\nb");', '    let lines = text.lines();', '    let count = lines.count();', '    let size = text.len() + count;', '    println!("{count}: {size}");', '}'], ['    let count = lines.len();', '    let lines = text.into_bytes();'], 'lines empresta a String e count consome só o iterador. O texto ainda existe: len vale 3 e count vale 2. size soma os dois e o programa imprime 2: 5.'),
            mcq('Como testar a contagem sem criar arquivos temporários?', ['Chamar count com &str nos testes do núcleo', 'Abrir a rede em cada teste', 'Usar só inspeção manual do terminal', 'Substituir todo erro por um mapa vazio'], 0, 'count recebe texto e não depende de I/O. Testes de arquivo podem existir na borda, mas a regra de agregação já é testável diretamente.'),
          ],
        },
      ],
    },
    {
      id: 'rp-proj-http', title: 'Projeto: servidor HTTP mínimo', parts: [
        {
          card: [
            { title: 'Separe o protocolo da regra de rota', body: 'No capítulo 21, o livro constrói um servidor para reunir tipos, I/O e testes. Nosso recorte aceita GET / HTTP/1.1 e responde 200; qualquer outra linha vira 404. Isso é uma política didática de roteamento, não um parser HTTP completo. Primeiro teste a função pura route: o programa imprime Home. Depois conectaremos socket e resposta.', visual: code(route, [6, 8, 9], 'Rota sem abrir porta') },
            { title: 'Da conexão à resposta', body: 'Avance e observe as fronteiras. O socket transporta bytes; o enum evita espalhar comparações de texto pelo código.', visual: track(['TcpListener espera uma conexão local.', 'TcpStream é dono da conexão aceita.', 'BufReader empresta o stream e lê a primeira linha e os cabeçalhos.', 'route transforma a linha em Home ou Missing.', 'response monta bytes; Write envia; o stream é descartado e fecha.'], ['Listener aceita', 'Stream possui conexão', 'Reader empresta stream', 'Route decide', 'Write envia; stream fecha']) },
          ],
          exercises: [
            mcq('Qual tipo representa a decisão de roteamento?', ['enum Route', 'Um TcpListener por caractere', 'usize sem significado', 'Um ponteiro cru para a resposta'], 0, 'Route nomeia as alternativas Home e Missing. O transporte não precisa tomar decisões com texto solto.'),
            mcq('O que deve ser testado sem abrir uma porta?', ['A função route com linhas de requisição', 'A disponibilidade mundial da internet', 'O estado de outro navegador', 'A tabela de roteamento do sistema operacional'], 0, 'route é uma função pura. Seus testes comparam entradas de texto e valores de Route, sem depender do ambiente.'),
            mcq('Qual é a saída?', ['Home', 'Missing', '200', 'GET'], 0, 'trim_end remove a quebra CRLF. A linha restante coincide exatamente com o padrão da rota Home.', { visual: code(route, [7, 8, 13, 14]) }),
            match('Associe a peça ao papel.', [['TcpListener', 'Aceitar conexões'], ['TcpStream', 'Ler e escrever bytes na conexão'], ['Route', 'Representar a decisão do domínio'], ['Write', 'Capacidade de receber bytes']], 'Dados e transporte ficam separados. A trait Write permite enviar para um socket ou para um buffer usado por testes.'),
            tf('Uma única chamada read é garantida a receber a requisição TCP inteira.', false, 'TCP é um fluxo de bytes, sem as fronteiras de mensagens de HTTP. Leitura por linhas e uma regra de enquadramento são necessárias; read pode devolver só uma parte.'),
            gen((rng) => {
              const n = randInt(rng, 2, 8);
              return num('Qual Content-Length corresponde ao corpo gerado?', 2 * n, `Cada á ocupa dois bytes em UTF-8. String::len mede bytes, então ${n} caracteres ocupam ${2 * n} bytes.`, { visual: code(`fn main() {
    let body = "á".repeat(${n});
    println!("{}", body.len());
}`, [2, 3], 'Tamanho do corpo em bytes') });
            }),
            codePuzzle('Monte a escolha do status sem acessar a rede.', ['fn main() {', '    let request = "GET / HTTP/1.1";', '    let home =\n        request == "GET / HTTP/1.1";', '    let status = if home { 200 }\n        else { 404 };', '    println!("{status}");', '}'], ['    let home = request == "POST /";', '    let status = if home { 404 }\n        else { 200 };'], 'A comparação reconhece a rota principal; if produz o inteiro 200, depois impresso. A decisão é testável sem socket.'),
            mcq('Chegou GET /x HTTP/1.1. Onde decidir 404?', ['Na função de rota, antes de escrever bytes', 'No alocador de memória', 'Dentro de String::len', 'Ao ignorar a linha recebida'], 0, 'Roteamento transforma a entrada em Route::Missing. Outra função transforma essa decisão em status, cabeçalhos e corpo.'),
          ],
        },
        {
          card: [
            { title: 'Servidor completo, serial e local', body: 'Copie o arquivo completo. O main aceita conexões em 127.0.0.1:7878; falha ao abrir a porta é propagada. Cada conexão é tratada por vez, com timeout de leitura e escrita. handle lê até a linha vazia dos cabeçalhos, send usa a trait Write e write_all envia todos os bytes ou retorna erro. A resposta inclui CRLF, tamanho em bytes e Connection: close. O teste usa Vec<u8> no lugar da rede e confere a resposta exata de 200.', visual: code(http, [26, 37, 60, 64], 'src/main.rs · servidor completo') },
            { title: 'Limites que orientam o próximo desenho', body: 'Este servidor é um laboratório para GET sem corpo: não implementa HTTP geral, limite de cabeçalhos, keep-alive nem TLS. Mantenha o teste local. Um cliente sem enviar dados ainda ocupa a única execução até o timeout; ele não limita a duração total se chegarem bytes aos poucos. No restante do capítulo 21, uma fila de trabalhos e um conjunto limitado de threads permitem atender outras conexões; cada tarefa precisa levar a posse do seu stream. Em uma aplicação real, use uma biblioteca HTTP mantida.', visual: table(['Falha ou decisão', 'Responsável'], [['Porta ocupada', 'bind → io::Error no main'], ['Cliente fecha ou leitura falha', 'handle → io::Result'], ['Erro em uma conexão', 'main registra e continua aceitando'], ['Rota desconhecida', 'Resposta 404, sem panic'], ['Cliente lento', 'Timeout; serial limita o atendimento']]) },
            { title: 'No seu computador', body: 'Crie cargo new tiny_http e copie o servidor. Pronto quando cargo test valida rota e bytes, cargo fmt e cargo clippy -- -D warnings passam, e curl -i http://127.0.0.1:7878/ mostra status 200, Content-Length: 5 e corpo Olá!. /x deve retornar 404 com corpo Ausente. Encerre com Ctrl+C. Baseado no cap. 21 e no exercício 47 do roteiro, compare o servidor serial com o desenho concorrente: descreva quem possui cada stream e adicione teste de resposta 404 antes de experimentar threads ou async.', visual: code('cargo new tiny_http\ncd tiny_http\ncargo test\ncargo fmt\ncargo clippy -- -D warnings\ncargo run', undefined, 'Terminal · servidor local') },
          ],
          exercises: [
            mcq('Qual função garante envio completo ou erro?', ['write_all', 'Uma única chamada read', 'len', 'trim_end'], 0, 'Write::write_all tenta escrever todo o buffer. Uma chamada simples a write pode enviar apenas parte dos bytes.'),
            tf('O corpo Olá! tem Content-Length igual a 4.', false, 'São quatro caracteres, mas cinco bytes: O, l, dois bytes para á e um para !. HTTP conta bytes do corpo.'),
            mcq('O que este teste verifica?', ['Bytes escritos por meio da trait Write', 'Que uma porta foi aberta', 'Que toda requisição é válida', 'Que o Vec precisa de threads'], 0, 'Vec<u8> implementa Write. A mesma abstração permite exercitar saída em memória; nenhum socket aparece no teste.', { visual: code(`use std::io::{self, Write};
fn main() -> io::Result<()> {
    let mut bytes = Vec::new();
    bytes.write_all("Olá!".as_bytes())?;
    assert_eq!(bytes.len(), 5);
    Ok(())
}`, [4, 5]) }),
            fill('Complete a estrutura de uma resposta HTTP/1.1.', 'Linha de status → cabeçalhos → linha ___ → corpo.', ['vazia'], ['com o caminho', 'com Rust', 'com um índice'], 'O par CRLF CRLF termina os cabeçalhos: uma quebra fecha a última linha e outra representa a linha vazia antes do corpo.'),
            order('Ordene o atendimento de uma conexão.', ['Aceitar o stream', 'Ler a linha e consumir cabeçalhos', 'Escolher rota e montar resposta', 'Enviar bytes e fechar a conexão'], 'O transporte fornece a entrada; o núcleo decide a rota; a resposta volta pelo mesmo stream. O descarte fecha a conexão.'),
            gen((rng) => {
              const n = randInt(rng, 2, 6);
              return num('Sem concorrência, quantos segundos levam estes atendimentos, ignorando outros custos?', n * 2, `Cada um dos ${n} atendimentos leva 2 segundos e começa depois do anterior. O tempo total é ${n} vezes 2, ou ${n * 2} segundos.`, { visual: code(`fn main() {
    let seconds: u64 = (0..${n})
        .map(|_| 2_u64).sum();
    println!("{seconds}");
}`, undefined, 'Modelo do custo serial') });
            }),
            codePuzzle('Monte um programa que transforma corpo em bytes e verifica seu comprimento.', ['fn main() {', '    let body = String::from("Olá!");', '    let bytes = body.as_bytes();', '    let length = bytes.len();', '    println!("{length}");', '}'], ['    let length = body.chars().count();', '    let bytes = body.chars();'], 'as_bytes empresta os bytes UTF-8. len conta cinco bytes; chars().count() contaria quatro caracteres e seria inadequado ao Content-Length.'),
            mcq('Ao passar o atendimento para uma thread com spawn, qual desenho é coerente?', ['Mover o stream para a tarefa e limitar trabalhadores', 'Emprestar um stream local que morre antes da thread', 'Criar threads ilimitadas para qualquer entrada', 'Compartilhar &mut TcpStream sem sincronização'], 0, 'A tarefa precisa possuir a conexão enquanto a usa. Um conjunto limitado de trabalhadores controla recursos; é o próximo passo do capítulo 21. Erros continuam sendo tratados por conexão.'),
          ],
        },
      ],
    },
    {
      id: 'rp-proj-prox', title: 'Publicar e continuar aprendendo', parts: [
        {
          card: [
            { title: 'Extraia uma API pequena e documentada', body: 'Agora extraia uma função útil do gerenciador para uma biblioteca chamada task_core. Este é o src/lib.rs completo: recebe uma slice emprestada e conta pendências sem I/O. O comentário de documentação inclui um exemplo que cargo test executa como doctest. O nome no use deve coincidir com o nome da biblioteca. Nenhuma dependência externa é necessária.', visual: code(library, [10, 12, 13], 'task_core/src/lib.rs') },
            { title: 'Revisão em camadas', body: 'Avance pelos sinais de qualidade antes de compartilhar. Os checks têm propósitos diferentes e nenhum substitui os testes de comportamento.', visual: track(['API: pending empresta &[bool] e devolve usize.', 'Teste de unidade: lista vazia tem zero pendências.', 'Doctest: [true, false] tem uma pendência.', 'fmt e clippy: formato e diagnósticos de qualidade.', 'Empacotamento: revisar arquivos e ensaiar sem upload.'], ['API empresta a slice', 'Teste de unidade', 'Doctest', 'fmt e clippy', 'Ensaio do pacote']) },
          ],
          exercises: [
            mcq('Qual assinatura permite usar a contagem sem entregar a posse da lista?', ['Uma função que recebe &[bool]', 'Uma função que sempre exige Vec por valor', 'Uma função que lê stdin por dentro', 'Uma função que só chama panic'], 0, 'A slice emprestada permite trabalhar com arrays e vetores, preservando o dono. A API só precisa ler os estados.'),
            tf('Um doctest ajuda a manter o exemplo público compatível com a API.', true, 'cargo test compila e executa exemplos Rust de documentação que não foram marcados para ignorar. Uma mudança incompatível pode quebrá-los.'),
            mcq('Qual é a saída deste uso da API?', ['2', '1', '0', '3'], 0, 'Dois elementos são false, portanto duas tarefas estão pendentes. O iterador só empresta a slice.', { visual: code(`fn pending(done: &[bool]) -> usize {
    done.iter().filter(|&&d| !d).count()
}
fn main() {
    let done = [false, true, false];
    println!("{}", pending(&done));
}`, [2, 6]) }),
            match('Associe o comando ao seu objetivo.', [['cargo fmt', 'Formatar fontes'], ['cargo test', 'Executar testes e doctests'], ['cargo clippy -- -D warnings', 'Reprovar avisos do linter'], ['cargo doc --open', 'Gerar e abrir documentação']], 'Formatação, testes, lint e documentação verificam aspectos diferentes. Uma biblioteca deve passar por todos antes de ser compartilhada.'),
            fill('Complete a intenção de uma API mínima.', 'Exponha com pub apenas o contrato que você pretende ___.', ['manter'], ['esconder de todos', 'apagar a cada teste', 'substituir por panic'], 'Itens públicos viram pontos de dependência dos usuários. Um contrato pequeno reduz mudanças incompatíveis e deixa espaço para reorganizar o interior.'),
            gen((rng) => {
              const n = randInt(rng, 2, 7);
              return num('Quantos itens esta versão de teste considera pendentes?', n, `O array contém ${n} valores false. O filtro !d aceita todos, então o resultado é ${n}.`, { visual: code(`fn main() {
    let done = [false; ${n}];
    let n = done.iter()
        .filter(|&&d| !d).count();
    println!("{n}");
}`) });
            }),
            codePuzzle('Monte um teste de regressão para contar só false.', ['#[test]', 'fn pending_count() {', '    let done = [true, false, false];', '    let n = done.iter()\n        .filter(|&&d| !d).count();', '    assert_eq!(n, 2);', '}'], ['    assert_eq!(n, 3);', '    let n = done.len();'], 'O teste constrói três estados, filtra dois pendentes e compara com 2. Ele falha se alguém trocar a contagem de pendências pela contagem total.'),
            mcq('Uma nova implementação mantém assinatura, resultados e erros documentados. O que os testes devem favorecer?', ['Verificar o contrato observado pelo usuário', 'Depender do nome de toda variável local', 'Proibir qualquer refatoração interna', 'Exigir uma alocação que a API não promete'], 0, 'Testes de contrato permitem mudar detalhes internos sem alterar a função pública. Também ajudam a detectar regressões reais para quem usa a crate.'),
          ],
        },
        {
          card: [
            { title: 'Publicação é uma etapa verificável', body: 'No Cargo.toml de task_core, mantenha edition = "2024", acrescente descrição e licença e escolha um nome disponível antes de publicar. Se renomear a crate, atualize o caminho do doctest. Confira os arquivos com cargo package --list e ensaie com cargo publish --dry-run, que verifica sem enviar. Só depois da revisão use cargo login e cargo publish. Guarde o token fora do código. Uma versão publicada não pode ser sobrescrita; correções exigem outra versão.', visual: code('[package]\nname = "task_core"\nversion = "0.1.0"\nedition = "2024"\ndescription = "Contagem de pendências"\nlicense = "MIT OR Apache-2.0"', undefined, 'Cargo.toml · nome local de exemplo') },
            { title: 'Ler crates e escolher o próximo projeto', body: 'Comece pela documentação de uma crate, rode um exemplo mínimo e siga o link de código-fonte de uma função usada. Localize tipos, erros, traits exigidas e testes; explique quem é dono dos dados antes de tentar reescrever. Use o roteiro como trilha: semana 1, ampliar o analisador rumo ao grep; semana 2, lexer com tokens em enum; semana 3, parser com árvore e Box; semana 4, escolher WebAssembly ou firmware e ler a documentação do alvo. Revise Result, ownership e testes em cada entrega.', visual: table(['Etapa', 'Evidência de progresso'], [['Ler API e exemplo', 'Descrever entrada, saída e erro'], ['Seguir o código-fonte', 'Identificar donos e empréstimos'], ['Ler os testes', 'Reproduzir um caso limite'], ['Modificar um projeto próprio', 'Teste novo e relatório do que mudou']]) },
            { title: 'No seu computador', body: 'Crie cargo new task_core --lib. Copie a biblioteca e os metadados; coloque os textos das licenças escolhidas em arquivos no pacote. Pronto quando testes e doctest passam, cargo fmt e cargo clippy -- -D warnings não avisam, cargo package --list contém só arquivos pretendidos e cargo publish --dry-run termina com sucesso. Publicar de verdade é uma decisão posterior: escolha nome disponível, autentique e use cargo publish quando quiser compartilhar. Como continuidade dos Projetos 1–3 do roteiro, escreva um plano de quatro semanas com uma entrega testável por semana e um registro de leitura de código de crate.', visual: code('cargo new task_core --lib\ncd task_core\ncargo fmt\ncargo test\ncargo clippy -- -D warnings\ncargo doc --open\ncargo package --list\ncargo publish --dry-run', undefined, 'Terminal · preparar a biblioteca') },
          ],
          exercises: [
            mcq('Qual comando ensaia a publicação sem enviar o pacote?', ['cargo publish --dry-run', 'cargo publish', 'cargo login', 'cargo run'], 0, 'A opção --dry-run realiza as verificações sem fazer upload. cargo publish sem essa opção envia a versão ao registro.'),
            tf('Depois de publicar, é possível substituir silenciosamente os arquivos da mesma versão.', false, 'Uma versão publicada não pode ser sobrescrita. Uma correção precisa de outra versão, de acordo com a compatibilidade da API.'),
            mcq('Qual campo seleciona a edição dos exemplos?', ['edition', 'license', 'description', 'name'], 0, 'edition = "2024" seleciona as regras da edição 2024. A versão do pacote e a edição são conceitos separados.', { visual: code('[package]\nname = "task_core"\nversion = "0.1.0"\nedition = "2024"\ndescription = "Contagem de pendências"\nlicense = "MIT OR Apache-2.0"', [4], 'Manifesto') }),
            order('Ordene a preparação para compartilhar a crate.', ['Revisar API, documentação e testes', 'Conferir metadados, licença e arquivos', 'Executar cargo publish --dry-run', 'Autenticar e publicar a versão revisada'], 'Primeiro consolide o contrato e o conteúdo do pacote. O ensaio detecta problemas antes do upload; a publicação vem depois da revisão.'),
            match('Associe a leitura da crate à pergunta que ela resolve.', [['Assinatura pública', 'Que dados entram e saem?'], ['Tipo de erro', 'Quais falhas o chamador trata?'], ['Implementação', 'Quem possui e quem empresta?'], ['Testes', 'Quais limites já foram previstos?']], 'Ler código com perguntas concretas evita apenas copiar chamadas. O objetivo é entender o contrato e as decisões de posse e erro.'),
            gen((rng) => {
              const perWeek = randInt(rng, 2, 5);
              return num('Neste plano de quatro semanas, quantos casos de teste serão planejados?', 4 * perWeek, `São quatro semanas com ${perWeek} casos por semana. A soma planejada é 4 vezes ${perWeek}, ou ${4 * perWeek}. Qualidade dos casos continua sendo mais importante que só quantidade.`, { visual: code(`fn main() {
    let cases = [${perWeek}; 4];
    let total: usize =
        cases.iter().sum();
    println!("{total}");
}`, undefined, 'Plano com entregas mensuráveis') });
            }),
            codePuzzle('Monte um programa que verifica se todas as etapas locais foram concluídas.', ['fn main() {', '    let checks = [true, true, false];', '    let ready = checks.iter()\n        .all(|&ok| ok);', '    let message = if ready { "pronto" }\n        else { "revisar" };', '    println!("{message}");', '}'], ['    let ready = checks.iter()\n        .any(|&ok| ok);', '    let message = "pronto";'], 'all exige que todos os valores sejam true. Como há um false, ready é false e o programa imprime revisar. any esconderia a etapa pendente.'),
            mcq('Qual plano demonstra autonomia ao fim da unidade?', ['Escolher um projeto, dividir entregas e testar limites', 'Só acumular links sem executar exemplos', 'Copiar uma crate inteira sem ler seus erros', 'Publicar antes de conferir o pacote'], 0, 'Um projeto pequeno com entregas observáveis fecha o ciclo: requisito, tipos, implementação, testes e documentação. Ler crates fornece exemplos reais para a próxima decisão.'),
          ],
        },
      ],
    },
  ],
};

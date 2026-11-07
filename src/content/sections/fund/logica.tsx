import React from 'react';
import type { UnitDef } from '../../types';
import { gen, mcq, mcqS, num, tf, fill, match, order, multi, inter, plot, rmcq } from '../../helpers';
import { CircleW, Label, Pt, RectW, Seg } from '../../../components/plot/Plot';
import { C } from '../../../theme';
import { fmt, pick, randInt } from '../../../lib/random';

const t = String.raw;
const V = (b: boolean) => (b ? 'V' : 'F');
const vennIs = (v: any, want: string[]) => Array.isArray(v) && v.length === want.length && [...v].sort().join() === [...want].sort().join();

/* ---------------- labs ---------------- */

/** Two circuits: switches in series (p ∧ q) and in parallel (p ∨ q). */
const circuitLab = () =>
  plot({
    view: { xMin: 0, xMax: 10, yMin: 0, yMax: 6.4 },
    grid: false,
    axes: false,
    tickLabels: false,
    params: [
      { key: 'p', label: 'p', min: 0, max: 1, step: 1, value: 1, color: C.p2, format: (v: number) => (v ? 'V (fechada)' : 'F (aberta)') },
      { key: 'q', label: 'q', min: 0, max: 1, step: 1, value: 0, color: C.p5, format: (v: number) => (v ? 'V (fechada)' : 'F (aberta)') },
    ],
    render: ({ p }: any) => {
      const P = p.p > 0.5;
      const Q = p.q > 0.5;
      const sw = (x: number, y: number, on: boolean, color: string, name: string) => (
        <>
          {on ? <Seg x1={x} y1={y} x2={x + 1} y2={y} color={color} width={5} /> : <Seg x1={x} y1={y} x2={x + 0.85} y2={y + 0.55} color={color} width={5} />}
          <Pt x={x} y={y} color={color} r={4} />
          <Pt x={x + 1} y={y} color={color} r={4} />
          <Label x={x + 0.5} y={y - 0.55} text={name} color={color} anchor="middle" />
        </>
      );
      const lamp = (x: number, y: number, on: boolean) => <CircleW cx={x} cy={y} r={0.38} color={on ? C.gold : C.textDim} width={3} fill={on ? C.gold : 'none'} fillOpacity={0.85} />;
      const w = (x1: number, y1: number, x2: number, y2: number) => <Seg x1={x1} y1={y1} x2={x2} y2={y2} color={C.textMuted} width={2.5} />;
      return (
        <>
          <Label x={0.3} y={6} text="Série: p ∧ q" color={C.text} />
          {w(0.5, 4.8, 2.5, 4.8)}
          {sw(2.5, 4.8, P, C.p2, 'p')}
          {w(3.5, 4.8, 5, 4.8)}
          {sw(5, 4.8, Q, C.p5, 'q')}
          {w(6, 4.8, 8, 4.8)}
          {lamp(8.4, 4.8, P && Q)}
          <Label x={0.3} y={3} text="Paralelo: p ∨ q" color={C.text} />
          {w(0.5, 1.6, 2.5, 1.6)}
          {w(2.5, 0.8, 2.5, 2.4)}
          {w(2.5, 2.4, 3.5, 2.4)}
          {w(2.5, 0.8, 3.5, 0.8)}
          {sw(3.5, 2.4, P, C.p2, '')}
          {sw(3.5, 0.8, Q, C.p5, '')}
          {w(4.5, 2.4, 6, 2.4)}
          {w(4.5, 0.8, 6, 0.8)}
          {w(6, 0.8, 6, 2.4)}
          {w(6, 1.6, 8, 1.6)}
          {lamp(8.4, 1.6, P || Q)}
        </>
      );
    },
    info: ({ p }: any) => {
      const P = p.p > 0.5;
      const Q = p.q > 0.5;
      return t`$p=${V(P)}$, $q=${V(Q)}$ · $p\wedge q=${V(P && Q)}$ (série) · $p\vee q=${V(P || Q)}$ (paralelo) · $\neg p=${V(!P)}$`;
    },
  });

/** p → q seen as "P ⊂ Q": drag the point; slide P out of Q to create a counterexample. */
const condLab = () =>
  plot({
    view: { xMin: -4, xMax: 4, yMin: -3, yMax: 3 },
    equalAspect: true,
    grid: false,
    params: [{ key: 's', label: 'desloca P', min: 0, max: 2.5, step: 0.1, value: 0, color: C.p2 }],
    points: [{ id: 'X', x: -0.8, y: 0.2, color: C.gold, label: 'x' }],
    render: ({ p }: any) => (
      <>
        <CircleW cx={0} cy={0} r={2.4} color={C.p5} fill={C.p5} fillOpacity={0.12} />
        <CircleW cx={-0.7 + p.s} cy={0} r={1.1} color={C.p2} fill={C.p2} fillOpacity={0.2} />
        <Label x={1.7} y={2.3} text="Q" color={C.p5} />
        <Label x={-0.7 + p.s} y={1.35} text="P" color={C.p2} anchor="middle" />
      </>
    ),
    info: ({ p, pts }: any) => {
      const X = pts.X;
      const inP = Math.hypot(X.x - (-0.7 + p.s), X.y) <= 1.1;
      const inQ = Math.hypot(X.x, X.y) <= 2.4;
      const imp = !inP || inQ;
      return t`$p$: "x está em P" $=${V(inP)}$ · $q$: "x está em Q" $=${V(inQ)}$ · $p\to q=${V(imp)}$${imp ? '' : ' ← contraexemplo!'}`;
    },
  });

/** 1 + 3 + 5 + … + (2n − 1) = n²: each odd number is an L-shaped layer. */
const oddSquareLab = () =>
  plot({
    view: { xMin: -0.5, xMax: 8.5, yMin: -0.5, yMax: 8.5 },
    equalAspect: true,
    grid: false,
    params: [{ key: 'n', label: 'n', min: 1, max: 8, step: 1, value: 4, color: C.gold, format: (v: number) => String(v) }],
    render: ({ p }: any) => {
      const n = Math.round(p.n);
      const cols = [C.p1, C.p2, C.p3, C.p4, C.p5, C.p6];
      const out: React.ReactNode[] = [];
      for (let k = 1; k <= n; k++) {
        const c = cols[(k - 1) % cols.length];
        out.push(<RectW key={'h' + k} x={0} y={k - 1} w={k} h={1} color={c} opacity={0.55} stroke={C.bg} />);
        if (k > 1) out.push(<RectW key={'v' + k} x={k - 1} y={0} w={1} h={k - 1} color={c} opacity={0.55} stroke={C.bg} />);
      }
      return <>{out}</>;
    },
    info: ({ p }: any) => {
      const n = Math.round(p.n);
      const terms = Array.from({ length: n }, (_, i) => 2 * i + 1).join('+');
      return t`$${terms}=${n * n}=${n}^2$ · a camada $k$ (em L) tem $2k-1$ quadradinhos`;
    },
  });

/* ---------------- unit ---------------- */

export const logica: UnitDef = {
  id: 'f-log',
  title: 'Lógica e demonstração',
  subtitle: 'Proposições, conectivos, negação, quantificadores e indução',
  icon: '🧠',
  guide: t`A matemática é escrita em **proposições** ligadas por conectivos ($\neg$, $\wedge$, $\vee$, $\to$, $\leftrightarrow$). Saber montar a **tabela-verdade**, **negar** frases (De Morgan, "nem todo") e reconhecer a **contrapositiva** é o que permite ler e escrever teoremas do Cálculo. A **indução finita** prova uma afirmação para todo $n$ natural: base + passo.`,
  lessons: [
    {
      id: 'f-log-prop',
      title: 'Proposições e conectivos',
      parts: [
        {
          card: [
            {
              title: 'O que é uma proposição',
              body: t`Uma **proposição** é uma frase declarativa que é **verdadeira (V)** ou **falsa (F)** — nunca as duas, nunca nenhuma.

• "$7$ é primo" → proposição (V).
• "$2+2=5$" → proposição (F).
• "Que horas são?" → **não** (pergunta).
• "$x+1=3$" → **não**: é uma **sentença aberta**; o valor depende de $x$.`,
              tip: 'Ordens, perguntas e exclamações não são proposições. Sentenças com variável livre também não — até alguém dizer quem é x.',
            },
            {
              title: 'Negação, "e" e "ou"',
              body: t`• **Negação** $\neg p$: troca o valor de $p$.
• **Conjunção** $p\wedge q$ ("p **e** q"): só é V quando **as duas** são V.
• **Disjunção** $p\vee q$ ("p **ou** q"): só é F quando **as duas** são F.

Em matemática, o "ou" é **inclusivo**: "$x>0$ ou $x$ é par" é V para $x=4$. O "ou exclusivo" ($p\veebar q$, "ou… ou…") é V só quando exatamente uma é V.`,
              visual: circuitLab(),
              example: t`Interruptores em **série** acendem a lâmpada só se os dois estão fechados ($\wedge$); em **paralelo**, basta um ($\vee$).`,
            },
          ],
          exercises: [
            multi('Quais são proposições?', ['"9 é um quadrado perfeito"', '"Feche a porta."', '"x + 2 = 5"', '"Todo número par é divisível por 2"', '"Será que vai chover?"'], [0, 3], 'Proposição tem valor V ou F definido. Ordem, pergunta e sentença aberta (depende de x) não são.'),
            tf(t`"$x^2 \ge 0$ para todo real $x$" é uma proposição.`, true, 'Com o quantificador "para todo", x deixa de ser livre: a frase inteira é V.'),
            tf(t`Se $p$ é V e $q$ é F, $p\wedge q$ é verdadeira.`, false, 'Conjunção só é V quando as duas são V.'),
            tf(t`Se $p$ é F e $q$ é V, $p\vee q$ é verdadeira.`, true, 'Disjunção só é F quando as duas são F; aqui q é V.'),
            match('Associe o conectivo ao símbolo.', [['não', t`$\neg$`], ['e', t`$\wedge$`], ['ou', t`$\vee$`], ['se… então', t`$\to$`], ['se e somente se', t`$\leftrightarrow$`]], 'São os cinco conectivos usuais.'),
            inter(t`Ajuste $p$ e $q$ para que $p\vee q$ seja **V** mas $p\wedge q$ seja **F**.`, 'plot', circuitLab().props, (v) => Math.round(v.p.p) + Math.round(v.p.q) === 1, 'exatamente um interruptor fechado', 'Paralelo aceso e série apagada: um V e um F.'),
            gen((rng) => {
              const p = rng() < 0.5;
              const q = rng() < 0.5;
              const which = randInt(rng, 0, 2);
              const exprs = [t`\neg p\wedge q`, t`p\vee\neg q`, t`\neg(p\wedge q)`];
              const vals = [!p && q, p || !q, !(p && q)];
              return tf(t`Com $p=${V(p)}$ e $q=${V(q)}$, a expressão $${exprs[which]}$ é verdadeira.`, vals[which], t`Substitua: $\neg p=${V(!p)}$, $\neg q=${V(!q)}$, $p\wedge q=${V(p && q)}$. Resultado: ${V(vals[which])}.`);
            }),
            tf('A frase "ou estudo, ou vou à festa" (não dá para fazer as duas) usa o "ou" inclusivo.', false, 'O "ou… ou…" que proíbe as duas é o ou exclusivo; o ∨ da matemática é inclusivo.'),
          ],
        },
        {
          card: {
            title: 'Montando a tabela-verdade',
            body: t`Com $n$ proposições simples há $2^n$ combinações de V/F, então a tabela tem $2^n$ linhas. Preencha coluna por coluna, das partes menores para a expressão inteira.

$$\begin{array}{c|c|c|c} p & q & \neg q & p\wedge\neg q\\ \hline V&V&F&F\\ V&F&V&V\\ F&V&F&F\\ F&F&V&F\end{array}$$`,
            tip: 'Organize as linhas sempre na mesma ordem (VV, VF, FV, FF): fica fácil comparar tabelas e achar equivalências.',
          },
          exercises: [
            num('Quantas linhas tem a tabela-verdade de uma expressão com 3 proposições simples (p, q, r)?', 8, '2³ = 8 combinações de V/F.'),
            gen((rng) => {
              const n = randInt(rng, 2, 6);
              return num(`Quantas linhas tem a tabela-verdade com ${n} proposições simples?`, 2 ** n, `Cada proposição dobra as possibilidades: 2^${n} = ${2 ** n}.`);
            }),
            fill(t`Complete a coluna de $p\vee\neg q$ na ordem VV, VF, FV, FF:`, '___ , ___ , ___ , ___', ['V', 'V', 'F', 'V'], ['?'], t`$\neg q$ = F, V, F, V. Então $p\vee\neg q$ = V, V, F, V: só é F quando $p$ = F e $\neg q$ = F (linha FV).`),
            mcq(t`Em quantas linhas $p\wedge q\wedge r$ é verdadeira?`, ['1', '3', '4', '7'], 0, 'Só quando as três são V: uma linha das 8.'),
            mcq(t`Em quantas linhas $p\vee q\vee r$ é falsa?`, ['1', '0', '3', '7'], 0, 'Só quando as três são F.'),
            gen((rng) => {
              const p = rng() < 0.5;
              const q = rng() < 0.5;
              const r = rng() < 0.5;
              const val = (p || q) && !r;
              return tf(t`Com $p=${V(p)}$, $q=${V(q)}$, $r=${V(r)}$, a expressão $(p\vee q)\wedge\neg r$ é verdadeira.`, val, t`$p\vee q=${V(p || q)}$ e $\neg r=${V(!r)}$, logo o "e" dá ${V(val)}.`);
            }),
            gen((rng) => {
              const p = rng() < 0.5;
              const q = rng() < 0.5;
              const val = !(p || q) || (p && q);
              return tf(t`Com $p=${V(p)}$ e $q=${V(q)}$, a expressão $\neg(p\vee q)\vee(p\wedge q)$ é verdadeira.`, val, t`$\neg(p\vee q)=${V(!(p || q))}$, $p\wedge q=${V(p && q)}$; o "ou" dá ${V(val)}. (Essa expressão é V exatamente quando $p$ e $q$ têm o mesmo valor.)`);
            }),
            tf(t`As expressões $\neg(p\wedge q)$ e $\neg p\wedge\neg q$ têm a mesma tabela-verdade.`, false, t`Na linha V,F: $\neg(p\wedge q)$ = V, mas $\neg p\wedge\neg q$ = F. A equivalente correta é $\neg p\vee\neg q$ (De Morgan).`),
          ],
        },
        {
          card: {
            title: 'Tautologia, contradição e contingência',
            body: t`• **Tautologia**: V em todas as linhas. Ex.: $p\vee\neg p$ (terceiro excluído).
• **Contradição**: F em todas as linhas. Ex.: $p\wedge\neg p$.
• **Contingência**: às vezes V, às vezes F. Ex.: $p\to q$.

Duas expressões são **equivalentes** ($\equiv$) quando têm a mesma tabela — ou seja, quando $A\leftrightarrow B$ é tautologia.`,
            example: t`$p\vee(p\wedge q)\equiv p$ (absorção): se $p$ é V, tudo é V; se $p$ é F, $p\wedge q$ também é F.`,
          },
          exercises: [
            mcqS(t`$p\vee\neg p$ é:`, 'tautologia', ['contradição', 'contingência', 'não é proposição'], 'Em qualquer linha, uma das duas partes é V.'),
            mcqS(t`$p\wedge\neg p$ é:`, 'contradição', ['tautologia', 'contingência', 'equivalente a p'], 'p e ¬p nunca são V ao mesmo tempo.'),
            mcqS(t`$p\wedge q$ é:`, 'contingência', ['tautologia', 'contradição', 'equivalente a p ∨ q'], 'É V na linha VV e F nas outras.'),
            match('Associe cada expressão ao que ela é equivalente.', [[t`$p\vee(p\wedge q)$`, t`$p$`], [t`$\neg\neg p$`, t`$p$ (dupla negação)`], [t`$p\wedge(q\vee r)$`, t`$(p\wedge q)\vee(p\wedge r)$`], [t`$\neg(p\vee q)$`, t`$\neg p\wedge\neg q$`]], 'Absorção, dupla negação, distributiva e De Morgan.'),
            tf(t`$(p\wedge q)\to p$ é uma tautologia.`, true, 'Se p∧q é V, então p é V; a única forma de a condicional falhar (V→F) nunca ocorre.'),
            tf(t`$p\to(p\wedge q)$ é uma tautologia.`, false, 'Na linha p = V, q = F: V → F = F.'),
            gen((rng) => {
              const items: [string, string][] = [
                [t`(p\wedge q)\vee\neg p`, 'contingência'],
                [t`(p\to q)\vee(q\to p)`, 'tautologia'],
                [t`\neg(p\vee\neg p)`, 'contradição'],
                [t`p\vee q\vee\neg q`, 'tautologia'],
                [t`(p\vee q)\wedge\neg p\wedge\neg q`, 'contradição'],
              ];
              const [e, ans] = pick(rng, items);
              return rmcq(rng, t`Classifique $${e}$.`, ans, ['tautologia', 'contradição', 'contingência'].filter((x) => x !== ans), 'Teste as 4 linhas (VV, VF, FV, FF) e veja se o resultado é sempre V, sempre F ou varia.');
            }),
            inter(t`No diagrama, $p$ = "está em A" e $q$ = "está em B". Pinte onde $p\wedge\neg q$ é verdadeira.`, 'venn', {}, (v: string[]) => vennIs(v, ['A']), 'só a parte de A fora de B', t`"$\wedge$" é interseção e "$\neg q$" é o complementar de B: sobra $A - B$.`),
            inter(t`Pinte onde $\neg(p\vee q)$ é verdadeira.`, 'venn', {}, (v: string[]) => vennIs(v, ['U']), 'só a região fora dos dois círculos', 'Fora de A e fora de B: é o complementar da união (De Morgan).'),
          ],
        },
      ],
    },
    {
      id: 'f-log-cond',
      title: 'Condicional, equivalências e negação',
      parts: [
        {
          card: [
            {
              title: 'A condicional p → q',
              body: t`"Se $p$, então $q$" só é **falsa** quando $p$ é V e $q$ é F — a promessa foi quebrada. Se $p$ é F, a condicional é V ("por vacuidade").

$$\begin{array}{c|c|c} p & q & p\to q\\ \hline V&V&V\\ V&F&\mathbf{F}\\ F&V&V\\ F&F&V\end{array}$$

Pense em conjuntos: $p\to q$ sempre verdadeira significa "**todo** ponto de P está em Q", isto é, $P\subset Q$.`,
              visual: condLab(),
            },
            {
              title: 'Necessário × suficiente',
              body: t`Em $p\to q$:
• $p$ é **condição suficiente** para $q$ (basta $p$ para garantir $q$);
• $q$ é **condição necessária** para $p$ (sem $q$, não há $p$).

Ex.: "se $f$ é derivável em $a$, então $f$ é contínua em $a$". Derivabilidade é **suficiente** para continuidade; continuidade é **necessária** para derivabilidade — mas não suficiente ($|x|$ em 0).`,
            },
          ],
          exercises: [
            tf(t`Com $p$ = V e $q$ = F, $p\to q$ é verdadeira.`, false, 'É a única linha falsa da condicional.'),
            tf(t`Com $p$ = F e $q$ = F, $p\to q$ é verdadeira.`, true, 'Antecedente falso: a promessa não foi testada, então a condicional é V.'),
            gen((rng) => {
              const p = rng() < 0.5;
              const q = rng() < 0.5;
              const r = rng() < 0.5;
              const val = !(p && q) || r;
              return tf(t`Com $p=${V(p)}$, $q=${V(q)}$, $r=${V(r)}$, a expressão $(p\wedge q)\to r$ é verdadeira.`, val, t`Antecedente $p\wedge q=${V(p && q)}$, consequente $r=${V(r)}$. Só seria F com V → F.`);
            }),
            inter('Desloque o conjunto P até aparecer um contraexemplo e arraste x para lá: um ponto onde p → q é falsa.', 'plot', condLab().props, (v) => {
              const X = v.pts.X;
              return Math.hypot(X.x - (-0.7 + v.p.s), X.y) <= 1.1 && Math.hypot(X.x, X.y) > 2.4;
            }, 'x dentro de P e fora de Q', 'p V e q F: é exatamente quando P não está contido em Q.'),
            mcqS('"Ser múltiplo de 4 é ____ para ser par."', 'suficiente, mas não necessário', ['necessário, mas não suficiente', 'necessário e suficiente', 'nem necessário nem suficiente'], 'Múltiplo de 4 ⇒ par (suficiente). Mas 6 é par e não é múltiplo de 4 (não necessário).'),
            mcqS('"Ser contínua em a é ____ para ser derivável em a."', 'necessário, mas não suficiente', ['suficiente, mas não necessário', 'necessário e suficiente', 'nem necessário nem suficiente'], 'Derivável ⇒ contínua, então continuidade é necessária. |x| é contínua em 0 e não derivável: não é suficiente.'),
            mcqS(t`Para inteiros, "$n^2$ é par" é ____ para "$n$ é par".`, 'necessário e suficiente', ['só necessário', 'só suficiente', 'nem necessário nem suficiente'], 'n par ⇔ n² par: vale nos dois sentidos (bicondicional).'),
            tf(t`$p\leftrightarrow q$ é V exatamente quando $p$ e $q$ têm o mesmo valor lógico.`, true, 'Bicondicional = (p → q) ∧ (q → p): V em VV e FF.'),
          ],
        },
        {
          card: {
            title: 'Recíproca, contrária e contrapositiva',
            body: t`A partir de $p\to q$:
• **Recíproca**: $q\to p$
• **Contrária** (inversa): $\neg p\to\neg q$
• **Contrapositiva**: $\neg q\to\neg p$

A contrapositiva é **equivalente** à original (mesma tabela). A recíproca **não** é — e a contrária é equivalente à recíproca.`,
            example: t`"Se chove, a rua molha." Contrapositiva: "se a rua não está molhada, não choveu" (equivalente). Recíproca: "se a rua está molhada, choveu" (pode ser falsa: alguém lavou a calçada).`,
            tip: 'Muitos "erros de lógica" do dia a dia são confundir uma afirmação com sua recíproca.',
          },
          exercises: [
            match(t`Para "se $p$, então $q$", associe:`, [['recíproca', t`$q\to p$`], ['contrária', t`$\neg p\to\neg q$`], ['contrapositiva', t`$\neg q\to\neg p$`]], 'Recíproca troca a ordem; contrária nega as duas; contrapositiva faz as duas coisas.'),
            mcqS('Qual é equivalente a "se n é múltiplo de 6, então n é par"?', 'se n é ímpar, então n não é múltiplo de 6', ['se n é par, então n é múltiplo de 6', 'se n não é múltiplo de 6, então n é ímpar', 'n é múltiplo de 6 e n é ímpar'], 'A contrapositiva (¬q → ¬p) é a equivalente.'),
            mcqS('Contrapositiva de "se uma série converge, então seu termo geral tende a 0":', 'se o termo geral não tende a 0, a série diverge', ['se o termo geral tende a 0, a série converge', 'se a série diverge, o termo geral não tende a 0', 'a série converge e o termo não tende a 0'], 'É o famoso teste da divergência — a contrapositiva do teorema.'),
            tf('A recíproca de um teorema verdadeiro é sempre verdadeira.', false, 'Ex.: "derivável ⇒ contínua" é V; "contínua ⇒ derivável" é F.'),
            tf(t`$\neg p\to\neg q$ é equivalente a $q\to p$.`, true, 'A contrária é a contrapositiva da recíproca.'),
            fill(t`Uma condicional e sua ___ são equivalentes; uma condicional e sua ___ podem ter valores diferentes.`, '___ … ___', ['contrapositiva', 'recíproca'], ['negação', 'conjunção'], 'Mesma tabela: original e contrapositiva.'),
            gen((rng) => {
              const S: [string, string, string][] = [
                ['x > 3', 'x > 1', 'x ≤ 1'],
                ['o triângulo é equilátero', 'ele é isósceles', 'ele não é isósceles'],
                ['f é derivável', 'f é contínua', 'f não é contínua'],
                ['n termina em 0', 'n é par', 'n é ímpar'],
              ];
              const [a, b, nb] = pick(rng, S);
              const na = a === 'x > 3' ? 'x ≤ 3' : a === 'o triângulo é equilátero' ? 'ele não é equilátero' : a === 'f é derivável' ? 'f não é derivável' : 'n não termina em 0';
              return rmcq(rng, `Contrapositiva de "se ${a}, então ${b}":`, `se ${nb}, então ${na}`, [`se ${b}, então ${a}`, `se ${na}, então ${nb}`, `${a} e ${nb}`], 'Contrapositiva: nega as duas e inverte a ordem.');
            }),
            mcq(t`Qual expressão é equivalente a $p\to q$?`, [t`$\neg p\vee q$`, t`$p\vee\neg q$`, t`$\neg p\wedge q$`, t`$p\wedge\neg q$`], 0, t`$p\to q$ só é F quando $p$ V e $q$ F; $\neg p\vee q$ também só falha aí.`),
          ],
        },
        {
          card: {
            title: 'Negando frases: De Morgan e quantificadores',
            body: t`• $\neg(p\wedge q)\equiv\neg p\vee\neg q$
• $\neg(p\vee q)\equiv\neg p\wedge\neg q$
• $\neg(p\to q)\equiv p\wedge\neg q$ (a negação de uma condicional **não** é outra condicional!)

Quantificadores: $\forall$ ("para todo") e $\exists$ ("existe").
• $\neg(\forall x,\ P(x))\equiv\exists x,\ \neg P(x)$ — "nem todo" = "existe um que não".
• $\neg(\exists x,\ P(x))\equiv\forall x,\ \neg P(x)$ — "não existe" = "todos não".`,
            example: '"Todo aluno passou" → negação: "algum aluno não passou" (e não "nenhum aluno passou").',
          },
          exercises: [
            mcqS('Negação de "João estuda e trabalha":', 'João não estuda ou não trabalha', ['João não estuda e não trabalha', 'João estuda ou trabalha', 'João não estuda'], 'De Morgan: ¬(p ∧ q) ≡ ¬p ∨ ¬q.'),
            mcqS('Negação de "vou de ônibus ou de metrô":', 'não vou de ônibus e não vou de metrô', ['não vou de ônibus ou não vou de metrô', 'vou de ônibus e de metrô', 'vou a pé ou de metrô'], 'De Morgan: ¬(p ∨ q) ≡ ¬p ∧ ¬q.'),
            mcqS('Negação de "todo número primo é ímpar":', 'existe um número primo que é par', ['nenhum número primo é ímpar', 'todo número primo é par', 'todo número ímpar é primo'], '¬∀ = ∃¬. (E a negação é V: 2 é primo e par.)'),
            mcqS('Negação de "existe um real x com x² < 0":', 'para todo real x, x² ≥ 0', ['existe um real x com x² ≥ 0', 'para todo real x, x² < 0', 'não existe x com x² ≥ 0'], '¬∃ = ∀¬, e a negação de "<" é "≥".'),
            mcqS('Negação de "se chover, eu fico em casa":', 'chove e eu não fico em casa', ['se não chover, eu não fico em casa', 'se eu ficar em casa, choveu', 'não chove ou fico em casa'], '¬(p → q) ≡ p ∧ ¬q: a promessa quebrada.'),
            tf(t`A negação de "$\forall\varepsilon>0,\ \exists\delta>0$ tal que …" começa com "$\exists\varepsilon>0$ tal que $\forall\delta>0$ …".`, true, 'Cada quantificador troca (∀ ↔ ∃) e a condição final é negada — é assim que se mostra que um limite NÃO existe.'),
            gen((rng) => {
              const S: [string, string, string[]][] = [
                ['todos os pinos estão apertados', 'algum pino não está apertado', ['nenhum pino está apertado', 'todos os pinos estão soltos', 'algum pino está apertado']],
                ['nenhuma viga tem trinca', 'alguma viga tem trinca', ['todas as vigas têm trinca', 'nenhuma viga está sem trinca', 'alguma viga não tem trinca']],
                ['algum sensor falhou', 'nenhum sensor falhou', ['algum sensor não falhou', 'todos os sensores falharam', 'nem todo sensor falhou']],
                ['todo resistor está acima de 10 Ω', 'algum resistor está em no máximo 10 Ω', ['todo resistor está abaixo de 10 Ω', 'nenhum resistor está acima de 10 Ω', 'algum resistor está acima de 10 Ω']],
              ];
              const [f, ans, wrong] = pick(rng, S);
              return rmcq(rng, `Negação de "${f}":`, ans, wrong, '"todos" ↔ "algum… não"; "nenhum" ↔ "algum"; "algum" ↔ "nenhum".');
            }),
            order(t`Ordene os passos para negar "$\forall x\in\mathbb R,\ x>0\to x^2>0$".`, [t`Troque $\forall$ por $\exists$`, t`Negue a condicional: $\neg(p\to q)\equiv p\wedge\neg q$`, t`Negue a desigualdade: $x^2>0$ vira $x^2\le 0$`, t`Resultado: $\exists x\in\mathbb R,\ x>0\wedge x^2\le 0$`], 'Quantificador primeiro, depois o conectivo, depois a relação.'),
          ],
        },
      ],
    },
    {
      id: 'f-log-dem',
      title: 'Técnicas de demonstração e indução',
      parts: [
        {
          card: [
            {
              title: 'Como se prova uma afirmação',
              body: t`• **Prova direta**: assuma $p$ e deduza $q$.
• **Contrapositiva**: prove $\neg q\to\neg p$ (equivalente!).
• **Absurdo (contradição)**: suponha que a tese é falsa e chegue a um absurdo.
• **Contraexemplo**: para **derrubar** um "para todo", basta **um** caso que falha.

Exemplos não provam um "para todo"; um contraexemplo derruba.`,
              example: t`Direta: se $a$ e $b$ são pares, $a=2m$, $b=2n$, então $a+b=2(m+n)$ é par. ∎`,
            },
            {
              title: 'Clássico por absurdo: √2 é irracional',
              body: t`Suponha $\sqrt2=\dfrac{a}{b}$ com a fração **irredutível**. Então $a^2=2b^2$, logo $a^2$ é par e $a$ é par: $a=2k$. Daí $4k^2=2b^2$, $b^2=2k^2$, e $b$ também é par. Mas então $\frac ab$ **não** era irredutível — absurdo! ∎`,
              tip: 'Na prova por absurdo, a hipótese extra ("é racional") é o que produz a contradição.',
            },
          ],
          exercises: [
            mcqS('Para mostrar que "todo número da forma n² + n + 41 é primo" é FALSO, basta:', 'exibir um n para o qual ele não é primo', ['testar n = 1, 2, …, 10 e ver que funciona', 'provar por indução', 'mostrar que 41 é primo'], 'Um contraexemplo derruba um "para todo" (n = 40 dá 41²).'),
            num('Para n = 40, quanto vale n² + n + 41?', 1681, '1600 + 40 + 41 = 1681 = 41²: não é primo. Contraexemplo!'),
            mcqS('Para provar "se n² é ímpar, então n é ímpar", o caminho mais simples é:', 'contrapositiva: se n é par, então n² é par', ['contraexemplo', 'testar vários n', 'recíproca: se n é ímpar, então n² é ímpar'], 'Se n = 2k, n² = 4k² = 2(2k²) é par. A recíproca não prova a original.'),
            order(t`Ordene a prova por absurdo de que $\sqrt2$ é irracional.`, [t`Suponha $\sqrt2=a/b$ irredutível`, t`Então $a^2=2b^2$, logo $a$ é par`, t`Com $a=2k$: $b^2=2k^2$, logo $b$ é par`, t`$a$ e $b$ pares contradiz "irredutível"`, t`Logo $\sqrt2$ é irracional`], 'Hipótese contrária → consequências → contradição → conclusão.'),
            tf('Verificar uma afirmação para 1 milhão de casos prova que ela vale para todo n natural.', false, 'Há afirmações que só falham em números enormes. Só uma demonstração cobre todos os casos.'),
            mcqS('A prova de Euclides de que existem infinitos primos usa:', 'absurdo: supõe uma lista finita p₁…pₖ e analisa p₁·…·pₖ + 1', ['indução sobre o número de primos', 'contraexemplo', 'prova direta pela fórmula dos primos'], 'O número p₁⋯pₖ + 1 não é divisível por nenhum da lista — contradição.'),
            gen((rng) => {
              const a = randInt(rng, 2, 9);
              const b = randInt(rng, 2, 9);
              const s = 2 * a + 2 * b;
              return num(t`Na prova "par + par = par", com $a=2m$ e $b=2n$, se $m=${a}$ e $n=${b}$, quanto vale $m+n$ (o número tal que $a+b=2(m+n)$)?`, a + b, t`$a+b=${2 * a}+${2 * b}=${s}=2\cdot${a + b}$.`);
            }),
            multi('Quais afirmações são derrubadas por um contraexemplo?', ['"Todo primo é ímpar"', '"Toda função contínua é derivável"', '"Existe um número par primo"', '"Para todo real x, x² > x"'], [0, 1, 3], 'Contraexemplos: 2; |x| em 0; x = 1/2 (x² = 1/4 < 1/2). "Existe…" é verdadeira (2).'),
          ],
        },
        {
          card: [
            {
              title: 'Princípio da indução finita',
              body: t`Para provar $P(n)$ para todo $n\ge n_0$:
1. **Base**: prove $P(n_0)$.
2. **Passo**: suponha $P(k)$ (hipótese de indução) e prove $P(k+1)$.

É o efeito dominó: a primeira peça cai, e cada peça derruba a seguinte.`,
              visual: oddSquareLab(),
              example: t`$1+3+\dots+(2n-1)=n^2$. Base: $1=1^2$. Passo: $\underbrace{1+\dots+(2k-1)}_{k^2}+(2k+1)=k^2+2k+1=(k+1)^2$. ∎`,
            },
          ],
          exercises: [
            order(t`Ordene uma prova por indução de $1+2+\dots+n=\frac{n(n+1)}{2}$.`, [t`Base: para $n=1$, $1=\frac{1\cdot2}{2}$`, t`Hipótese: suponha $1+\dots+k=\frac{k(k+1)}{2}$`, t`Some $k+1$: $\frac{k(k+1)}{2}+(k+1)$`, t`Fatore: $\frac{(k+1)(k+2)}{2}$, que é a fórmula para $k+1$`, t`Pelo princípio da indução, vale para todo $n\ge1$`], 'Base, hipótese, passo, conclusão.'),
            inter(t`Ajuste $n$ até a figura mostrar $1+3+5+\dots=36$.`, 'plot', oddSquareLab().props, (v) => Math.round(v.p.n) === 6, 'n = 6', 'A soma dos 6 primeiros ímpares é 6² = 36.'),
            gen((rng) => {
              const n = randInt(rng, 10, 60);
              return num(t`Use a fórmula: $1+2+\dots+${n}=$ ?`, (n * (n + 1)) / 2, t`$\frac{${n}\cdot${n + 1}}{2}=${(n * (n + 1)) / 2}$.`);
            }),
            gen((rng) => {
              const n = randInt(rng, 5, 30);
              return num(t`Soma dos ${n} primeiros números ímpares: $1+3+\dots+${2 * n - 1}=$ ?`, n * n, t`$n^2=${n}^2=${n * n}$.`);
            }),
            mcqS('Na indução, a "hipótese de indução" é:', 'supor que P(k) vale para um k qualquer e usar isso para provar P(k + 1)', ['supor que P(n) vale para todo n', 'verificar P(1)', 'provar P(k) a partir de P(k + 1)'], 'Supor para todo n seria assumir o que se quer provar.'),
            tf('Se o passo P(k) ⇒ P(k + 1) está provado mas a base é falsa, a afirmação pode ser falsa para todo n.', true, 'Ex.: "n = n + 1" satisfaz o passo (de uma falsidade segue outra), mas é falsa sempre. A base é indispensável.'),
            gen((rng) => {
              const n = randInt(rng, 3, 9);
              return num(t`Por indução prova-se $1^2+2^2+\dots+n^2=\frac{n(n+1)(2n+1)}{6}$. Quanto vale para $n=${n}$?`, (n * (n + 1) * (2 * n + 1)) / 6, t`$\frac{${n}\cdot${n + 1}\cdot${2 * n + 1}}{6}=${(n * (n + 1) * (2 * n + 1)) / 6}$.`);
            }),
            mcq(t`No passo da prova de $2^n>n$: se $2^k>k$, então $2^{k+1}=2\cdot2^k>$ ?`, [t`$2k\ge k+1$ (para $k\ge1$)`, t`$k^2$`, t`$k-1$`, t`$2^k$ apenas`], 0, t`$2^{k+1}=2\cdot 2^k>2k=k+k\ge k+1$. Logo vale para $k+1$.`),
          ],
        },
        {
          card: {
            title: 'Indução com divisibilidade e desigualdades',
            body: t`O mesmo esquema prova divisibilidades: para mostrar que $3\mid n^3-n$, escreva $(k+1)^3-(k+1)=(k^3-k)+3k^2+3k$. A primeira parcela é múltipla de 3 pela hipótese, e $3k^2+3k$ também. ∎

Também prova desigualdades (Bernoulli): $(1+x)^n\ge1+nx$ para $x>-1$.`,
            tip: 'O truque do passo é sempre "achar P(k) dentro de P(k + 1)": reescreva a expressão de k + 1 usando a de k.',
          },
          exercises: [
            gen((rng) => {
              const n = randInt(rng, 2, 12);
              return num(t`Verifique: $n^3-n$ para $n=${n}$ vale quanto? (É múltiplo de 6.)`, n ** 3 - n, t`$${n}^3-${n}=${n ** 3 - n}=6\cdot${(n ** 3 - n) / 6}$. Produto de três consecutivos $(n-1)n(n+1)$.`);
            }),
            fill(t`Complete o passo: $(k+1)^3-(k+1)=(k^3-k)+$ ___ $k^2+$ ___ $k$.`, '___ e ___', ['3', '3'], ['1', '2', '6'], t`$(k+1)^3=k^3+3k^2+3k+1$; subtraindo $k+1$: $k^3-k+3k^2+3k$.`),
            mcqS(t`Para provar que $4^n-1$ é múltiplo de 3, o passo usa:`, t`$4^{k+1}-1=4(4^k-1)+3$`, [t`$4^{k+1}-1=(4^k-1)+1$`, t`$4^{k+1}-1=4^k\cdot 4-4$`, t`$4^{k+1}=3^{k+1}+1$`], t`$4\cdot4^k-1=4\cdot4^k-4+3=4(4^k-1)+3$: as duas parcelas são múltiplas de 3.`),
            gen((rng) => {
              const n = randInt(rng, 1, 6);
              return num(t`Calcule $4^{${n}}-1$ (deve ser múltiplo de 3).`, 4 ** n - 1, t`$4^{${n}}-1=${4 ** n - 1}=3\cdot${(4 ** n - 1) / 3}$.`);
            }),
            tf(t`Pela desigualdade de Bernoulli, $(1{,}01)^{50}\ge 1{,}5$.`, true, t`$(1+0{,}01)^{50}\ge1+50\cdot0{,}01=1{,}5$. (O valor real é ≈ 1,64.)`),
            mcqS(t`Entre os naturais $n\ge 2$, para quais vale $2^n>n^2$?`, t`$n\ge5$ (base em 5)`, [t`todo $n\ge2$`, t`só $2\le n\le4$`, t`nenhum`], t`$n=2,3,4$ falham ($4=4$, $8<9$, $16=16$); a partir de 5 vale ($32>25$) e o passo funciona. A base nem sempre é 1!`),
            mcqS('Qual é o erro na "prova" de que todos os cavalos têm a mesma cor (o passo de k para k + 1 usa dois grupos de k cavalos que se sobrepõem)?', 'o passo falha de k = 1 para k = 2: os dois grupos não têm cavalo em comum', ['a base n = 1 é falsa', 'indução não vale para cavalos', 'o passo deveria ir de k + 1 para k'], 'Com 2 cavalos, os grupos {1} e {2} não se sobrepõem: o argumento quebra exatamente aí.'),
            gen((rng) => {
              const n = randInt(rng, 2, 8);
              const x = pick(rng, [0.1, 0.2, 0.05]);
              const lb = 1 + n * x;
              return rmcq(rng, t`Bernoulli garante que $(1+${fmt(x)})^{${n}}\ge$ ?`, fmt(lb), [fmt(1 + x), fmt(n * x), fmt(1 + 2 * n * x), fmt(n + x)], t`$1+nx=1+${n}\cdot${fmt(x)}=${fmt(lb)}$.`);
            }),
          ],
        },
      ],
    },
  ],
};

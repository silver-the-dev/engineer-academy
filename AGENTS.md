This is an Expo/React Native mobile application. Prioritize mobile-first patterns, performance, and cross-platform compatibility.

## Expo has changed — do not trust your training data

Expo ships breaking changes every SDK release. APIs you remember are likely renamed, moved, or removed. Before writing any code that touches an Expo, EAS, or React Native API:

1. Read the major version of the `expo` package in `package.json`.
2. Fetch the matching versioned docs: `https://docs.expo.dev/versions/v<major>.0.0/`
3. For anything else, fetch https://docs.expo.dev/llms.txt — an index of all Expo docs with corrections to common LLM misconceptions. Follow its links to the specific page you need; never answer from memory.

## Commands

Use `bunx` instead of `npx` if the project uses bun (`bun.lock` present).

```bash
npx expo install <package>  # ALWAYS use instead of npm/yarn/pnpm/bun add — resolves SDK-compatible versions
npx expo start              # start the dev server
npx expo lint               # lint
npx tsc --noEmit            # typecheck
npx expo-doctor             # diagnose dependency and config issues
npx expo install --fix      # fix incompatible package versions
```

Run lint and typecheck before declaring any task done.

## Navigation & Routing

- Use **Expo Router** for all navigation. Routes live in `src/app/` — every file there is a screen, `_layout.tsx` files define navigators. Keep non-route code (components, hooks, utils) outside `src/app/`.
- Import `Link`, `router`, and `useLocalSearchParams` from `expo-router`.
- Docs: https://docs.expo.dev/router/introduction.md

## Building with EAS

Use EAS to build, sign, and submit the app in the cloud (`eas build`, `eas submit`) and to ship over-the-air updates (`eas update`) — no local Xcode or Android Studio required. Run EAS CLI as `bunx eas-cli <command>` in Bun projects, or `npx eas-cli@latest <command>` otherwise; substitute that for bare `eas` in docs examples.
Docs: https://docs.expo.dev/eas/index.md

## Rules

- If `ios/` and `android/` directories do not exist, they are generated (Continuous Native Generation). Never create or edit them by hand — configure native behavior in `app.json` and config plugins.
- Expo Go only includes its bundled native modules. After adding a library with native code, the app needs a development build: `npx expo run:ios|android` locally, or `eas build --profile development`.
- Prefer recommended Expo modules over third-party libraries, and check your available skills before adding dependencies. Docs: https://docs.expo.dev/versions/latest/index.md

---

# Engineer Academy — instruções específicas do projeto (pt-BR)

Veja o [`README.md`](README.md) para dependências e configuração do ambiente.

## Build

- O projeto não usa EAS: o APK é gerado localmente com `bash scripts/build-apk.sh [--clean]` (detalhes e variáveis de ambiente no README). A pasta `android/` é gerada pelo `expo prebuild --clean` dentro do script.
- Ao publicar uma versão nova, suba `expo.version` **e** `android.versionCode` em `app.json`.

## Stack

Expo SDK 58 (`expo ~58.0.23`), React Native 0.88.1, Expo Router, Hermes, nova arquitetura, Zustand 5 (persistido em AsyncStorage), `mathjax-full` 3.2 (TeX → SVG) e `react-native-svg` 15.16.

## Mapa do código

| Caminho | O que é |
|---|---|
| `src/app/(tabs)/index.tsx` | caminho de lições: bolinhas (`Node`), anel segmentado (`PartRing`), popup com lista de partes (`LessonParts`) |
| `src/app/lesson/[id].tsx` | tela da lição (`?part=N`), também usada para treino (`mode=practice`) e revisão de unidade (`mode=review`) |
| `src/app/unit/[id].tsx` | guia da unidade (lista os cards de teoria) |
| `src/app/debug.tsx` | **QA de conteúdo** (abra `/debug` no preview web) |
| `src/components/lesson/` | `CardView`, `ExerciseHost`, `LessonComplete` (mostra "Parte k de n" e o botão "Próxima parte") |
| `src/components/exercises/` | tipos de exercício; `parseNumber` aceita vírgula e frações `a/b` |
| `src/components/math/tex.ts` | MathJax TeX → SVG com cache; regra da vírgula decimal (ver abaixo) |
| `src/components/visuals/` | widgets: `plot` (PlotLab), `space3d`, `venn`, `numberline`, `bars`, `simulator`, `stepper`, `table` |
| `src/content/types.ts` | modelo de conteúdo e `normalizeLesson`/`normalizeSection` |
| `src/content/helpers.ts` | construtores de exercícios (`mcq`, `mcqS`, `rmcq`, `num`, `tf`, `fill`, `match`, `order`, `multi`, `inter`, `gen`, `plot`, `table`, `near`) |
| `src/content/visuals.tsx`, `visuals3d.tsx` | laboratórios interativos reutilizáveis (`lineLab`, `parabolaLab`, `tangentLab`, `riemannLab`, `vectorLab`, `matrixLab`…) |
| `src/content/sections/<seção>/*.tsx` | o conteúdo; registrado em `src/content/sections/index.ts`. Seções: `fund` (Fundamentos: inclui lógica, matrizes, matemática financeira, binômio de Newton, geometria plana e espacial), `pre` (Pré-Cálculo: inclui exponenciais/logaritmos, triângulos quaisquer, complexos e equações polinomiais), `calc` (Cálculo 1–3), `gaal` (GA e Álgebra Linear, inclui superfícies quádricas), `vet` (Cálculo Vetorial: integrais múltiplas, campos, Green/Stokes/Gauss), `edo` (EDOs, Laplace, Fourier), `num`, `est` |
| `src/lib/qa.ts`, `scripts/qa-content.cjs` | QA de conteúdo (o mesmo do `/debug`), também por linha de comando |
| `src/lib/texEval.ts` | avaliador numérico das opções de múltipla escolha (só QA): acha opções erradas iguais à resposta como expressão |
| `src/app/audit.tsx` | `/audit?id=<lição>` mostra todos os cards e exercícios de uma lição de uma vez (para conferir layout em 375 px) |
| `src/content/index.ts` | `buildQueue(lesson, part)`, `partsDone`, desbloqueio, treino e revisão |
| `src/state/store.ts` | estado persistido (chave `engineer-academy-v1`): XP, vidas, dias, `lessons`, `parts`, erros, missões, conquistas |
| `src/lib/` | `random.ts` (`fmt`, `term`, `polyTex`, `fracTex`, `par`, `xm`, `randInt`, `randNZ`, `pick`, `shuffle`), `notifications.ts`, `widget.ts`, `feedback.ts` |
| `modules/streak-widget/` | módulo Expo local em Kotlin: widget de tela inicial com o mapa de dias estudados |

## Modelo de conteúdo e sublições

- Um conteúdo é `Section → Unit → Lesson`. Arquivos de conteúdo exportam `UnitDef`.
- Uma lição pode ser escrita de dois jeitos (`LessonDef`):
  - **com partes**: `parts: [{ card, exercises }, …]` — cada parte é uma sublição (um segmento do anel). `card` pode ser um card ou uma lista de cards.
  - **formato antigo**: `cards: […]` e `exercises: […]` — vira uma parte única.
- `normalizeLesson` achata tudo: `lesson.cards` e `lesson.exercises` ficam planos e `lesson.parts` guarda `{ title, cards, start, count }`. O índice de um exercício (usado em `mistakes` e no treino) é a **posição na lista plana**.
- Os exercícios de cada parte são apresentados **na ordem escrita** (do mais fácil ao mais difícil). Só as opções de múltipla escolha são embaralhadas.
- Progresso: `lessons[id].done > 0` = lição concluída (desbloqueia a próxima); `parts[id]` = quantas partes já foram feitas numa lição ainda não concluída. Concluir a última parte marca a lição.
- **Nunca mude o `id` de uma lição existente**: ele é a chave do progresso salvo no celular do usuário.
- Dá para inserir unidades novas no meio de uma seção: `isLessonUnlocked` mantém aberta qualquer lição já feita e tudo antes de uma lição já concluída mais adiante.

## Convenções para escrever conteúdo

- Use `const t = String.raw` e escreva TeX entre `$…$` (ou `$$…$$`). Dentro de `t\`…\``, use uma barra só (`\frac`); em strings normais, duas (`'\\frac'`).
- **Vírgula decimal**: `tex.ts` transforma `dígito,dígito` em vírgula decimal. Por isso pares, intervalos e conjuntos de inteiros devem ter espaço ou `\,` depois da vírgula: `$(2,\,3)$`, `$[0,\,4]$`, `$\{1, 2\}$`. Listas com 2 ou mais vírgulas seguidas de inteiros (`1,2,3`) já são protegidas.
- Números decimais gerados: sempre `fmt(x)` (vírgula pt-BR). Monômios com sinal: `term(c, 'x')`, `term(c, 'x', true)` para o primeiro termo; polinômios: `polyTex([c0, c1, c2])`. Negativo como fator: `par(n)` dá `(-3)`; fator `x-a` com o sinal certo: `xm(a)` dá `x+3` para `a=-3`.
- **Limpeza automática** (`tidyOnes` em `tex.ts`, aplicada a toda fórmula antes do MathJax): esconde coeficiente e expoente 1 (`1x`, `-1e^{t}`, `x^{1}`, `(x+3)^{1}`), dobra sinais (`x+-2` → `x-2`, `x--4` → `x+4`), põe parênteses em negativo depois de `\cdot` (`4\cdot(-3)`), tira `+0` antes de `)`/`}` e, dentro de um par/intervalo que tenha decimal, troca a vírgula separadora por `;` (`(1,5;\ 2)`). Não depende disso para o que é pedagógico: expoente 1 em dígitos (`2^{1}`) e `0+0` ficam como estão.
- Geradores: evite sorteios degenerados (vetor nulo, `k=1`, denominador zero, `B=-A`); o QA roda 30 sementes e avisa quando sobram menos de 3 opções.
- Dinheiro em template raw: `R\$`; em string normal: `'R\\$'`.
- Depois de macros como `\le`, `\ge`, `\to`, deixe espaço antes de letras (`\le x`, `\to a`), senão o TeX lê `\lex`.
- `rmcq` remove distratores iguais à resposta ou repetidos: passe **4 ou 5 candidatos** para sempre sobrarem 3 opções erradas. `mcq(prompt, opções, índiceCorreto, explicação)` não precisa embaralhar (a tela embaralha).
- `num(…)`: a tolerância padrão é relativa 1e-6. Para respostas arredondadas ("2 casas"), passe `{ tol: … }`. Unidade: `{ unit: 'm' }`.
- Valor recebido pelo `check` de `inter(…)`: `plot` → `v.p` (sliders) e `v.pts` (pontos arrastáveis); `venn` → lista de regiões (`'A'`, `'AB'`, `'B'`, `'U'`, compare ordenando); `numberline` → número; `bars` → lista de alturas; `simulator` → número de lançamentos; `space3d` → `v.p`.
- O `RichText` não tem tabelas em markdown: para tabelas use `$$\begin{array}…\end{array}$$` ou o visual `table(...)`. Toda lição precisa de pelo menos 2 partes (o QA avisa "lição sem partes" se tiver uma só).
- Padrão usado nas lições já convertidas: 2 ou 3 partes por lição, 7 a 9 exercícios por parte, do mais fácil ao mais difícil, misturando tipos e com ao menos um gerador aleatório (`gen`) por parte. Exemplos completos: `sections/fund/elementar.tsx`, `sections/calc/limites.tsx`, `sections/num/numerico1.tsx`.

## Fluxo de trabalho recomendado

1. Preview web: `npx expo start --web` (o QA fica em `/debug`).
2. Edite um arquivo de conteúdo por vez.
3. `npx tsc --noEmit -p .` precisa passar.
4. Rode `node scripts/qa-content.cjs` (ou `--file src/content/sections/<seção>/<arquivo>.tsx` para checar um arquivo ainda não registrado; argumentos extras filtram por id). Sai com código 1 se houver erro. Também dá para abrir `/debug`. O esperado é `erros=1` (a linha "autoteste detector", que é o teste do próprio detector) e `avisos=0`. Avisos comuns: "múltipla escolha com só 2 opções" (faltaram distratores ou o sorteio é degenerado), "parte com só N exercícios", "sem explicação", "opção errada … é igual à resposta como expressão" (duas respostas certas; perguntas de "fatore/simplifique/escreva na forma" são ignoradas) e "difere da resposta só por uma constante" (duas primitivas válidas).
5. Teste o fluxo na UI quando mexer em telas: anel na bolinha, popup com as partes, tela de conclusão com "Próxima parte".
6. Commit por unidade.

## Notificações e widget

- `src/lib/notifications.ts` agenda gatilhos `DATE` (lembrete diário e alerta de ofensiva em risco). A permissão `USE_EXACT_ALARM` está em `app.json` para os alarmes chegarem na hora.
- `app.json` bloqueia permissões desnecessárias (`blockedPermissions`): o app só pede notificações.
- `syncWidget()` (`src/lib/widget.ts`) atualiza o widget depois de cada lição.

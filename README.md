# Engineer Academy

App Android para estudar a matemática dos primeiros anos de Engenharia de forma gamificada, no estilo Duolingo/Brilliant.

- **5 seções**: Fundamentos, Cálculo, GA e Álgebra Linear, Cálculo Numérico, Probabilidade e Estatística
- **Caminho de lições** com sublições: cada lição é dividida em partes (um card de teoria + exercícios do mais fácil ao mais difícil), mostradas como um anel segmentado na bolinha do caminho
- **Exercícios variados**: múltipla escolha, verdadeiro/falso, resposta numérica, completar, ligar, ordenar e exercícios interativos (gráficos arrastáveis, diagrama de Venn, reta numérica, cenas 3D); muitos são gerados aleatoriamente a cada tentativa
- **Gamificação**: XP, níveis, ofensiva diária, vidas, gemas, missões diárias e conquistas
- **Lembretes** diários por notificação e **widget** de tela inicial com o mapa de dias estudados
- Fórmulas renderizadas com MathJax, tudo funcionando **offline**; o progresso fica salvo no aparelho

## Baixar

Os APKs prontos para instalar (Android 7.0 ou mais novo, arm64) ficam na página de [Releases](https://gitlab.com/silveriodev/engineer-academy/-/releases) do GitLab, um por versão. Todas as versões têm a mesma assinatura, então uma versão nova instala por cima da anterior e mantém o progresso.

## Stack

| | |
|---|---|
| Framework | [Expo](https://expo.dev) SDK 58 + React Native 0.88 (Hermes, nova arquitetura) |
| Navegação | Expo Router |
| Estado | Zustand (persistido com AsyncStorage) |
| Fórmulas | `mathjax-full` (TeX → SVG) + `react-native-svg` |
| Widget | módulo Expo local em Kotlin (`modules/streak-widget`) |

## Dependências

Instale como preferir (gerenciador de pacotes do sistema, instaladores oficiais, gerenciadores de versão, Android Studio etc.). As versões abaixo são as usadas no desenvolvimento.

### Obrigatórias

| Dependência | Versão usada | Para quê |
|---|---|---|
| **Node.js** e **npm** | Node 24.19 / npm 11.17 | instalar pacotes, rodar o Expo e o preview web |

### Para gerar builds Android

| Dependência | Versão usada | Observação |
|---|---|---|
| **JDK** | 17 | exportar `JAVA_HOME` ou ter o `java` 17 no `PATH` |
| **Android SDK** | — | exportar `ANDROID_HOME` (ou `ANDROID_SDK_ROOT`) |
| ↳ SDK Platform | Android 37 | `compileSdk` usado pelo Expo SDK 58 |
| ↳ Build-Tools | 36.0.0 / 37.0.0 | |
| ↳ NDK | 27.1.12297006 | exigido pelo React Native |
| ↳ CMake | 3.22.1 | exigido pelo React Native |
| ↳ Platform-Tools | atual | `adb`, para instalar em aparelho/emulador |
| **Gradle** | 9.4.1 | baixado automaticamente pelo wrapper (`android/gradlew`) |

Com as licenças do SDK aceitas (`sdkmanager --licenses`), o Gradle costuma baixar sozinho os componentes do SDK que estiverem faltando.

### Opcionais

| Dependência | Para quê |
|---|---|
| Aparelho Android (USB/Wi-Fi) ou emulador | testar o app nativo |
| Python 3 + [Pillow](https://pypi.org/project/pillow/) | regenerar ícones e imagens (`scripts/generate-assets.py`) |
| Python 3 | regenerar os efeitos sonoros (`scripts/generate-sounds.py`) |

Os assets gerados já estão no repositório; os scripts Python só são necessários para alterá-los.

> **Expo Go não funciona** com este projeto: ele tem um módulo nativo próprio (o widget). Use o preview web, um *development build* ou o APK de release.

## Configuração

```bash
git clone <url-do-repositório>
cd EngineerAcademy
npm install
```

O `.npmrc` do projeto já ativa `legacy-peer-deps`.

### Preview web (o jeito mais rápido de desenvolver conteúdo)

```bash
npx expo start --web
```

Abra o endereço mostrado no terminal. A página **`/debug`** faz o QA de todo o conteúdo: valida cada fórmula TeX, a estrutura dos exercícios (testando várias sementes dos geradores aleatórios) e mostra quantas lições/partes/exercícios cada seção tem. O esperado é `erros=1` (a linha do autoteste do detector) e nenhum aviso novo.

### Verificação de tipos

```bash
npx tsc --noEmit
```

### Rodar no Android (development build)

Com `JAVA_HOME` e `ANDROID_HOME` configurados e um aparelho/emulador conectado:

```bash
npx expo run:android
```

### APK de release

```bash
bash scripts/build-apk.sh          # usa a pasta android/ existente
bash scripts/build-apk.sh --clean  # regenera android/ com expo prebuild antes
```

O APK é copiado para `dist/EngineerAcademy-v<versão>.apk`. Variáveis de ambiente aceitas pelo script:

| Variável | Obrigatória | Padrão |
|---|---|---|
| `ANDROID_HOME` (ou `ANDROID_SDK_ROOT`) | sim | — |
| `JAVA_HOME` | se o `java` do `PATH` não for o 17 | — |
| `APK_OUT_DIR` | não | `./dist` |
| `GRADLE_JVM_ARGS` | não | `-Xmx4g -XX:MaxMetaspaceSize=1g` |
| `GRADLE_WORKERS` | não | definido pelo Gradle |
| `GRADLE_USER_HOME` | não | definido pelo Gradle |

Para não exportar tudo a cada vez, crie um `scripts/env.local.sh` (ignorado pelo git) com os seus valores; o script carrega esse arquivo automaticamente:

```bash
export JAVA_HOME=/caminho/para/jdk-17
export ANDROID_HOME=/caminho/para/android-sdk
```

**Arquiteturas**: o build de release gera só `arm64-v8a` (ver `expo-build-properties` em `app.json`), que cobre os celulares atuais. Emuladores x86_64 precisam de um build para essa arquitetura, por exemplo:

```bash
cd android && ./gradlew assembleRelease -PreactNativeArchitectures=x86_64
```

**Assinatura**: o build de release usa a keystore de debug gerada pelo template do Expo, suficiente para instalar e testar. Para publicar em loja, configure a sua própria assinatura.

**Publicar uma versão**: suba `version` e `android.versionCode` no `app.json`, gere o APK e crie uma Release no GitLab com a tag da versão, anexando o APK (com o SHA-256 na descrição). A pasta local `releases/` (se usada como `APK_OUT_DIR`) é ignorada pelo git.

## Estrutura

```
src/
├── app/                    telas (Expo Router)
│   ├── (tabs)/             caminho, treino, missões, perfil
│   ├── lesson/[id].tsx     lição (?part=N), treino e revisão de unidade
│   ├── unit/[id].tsx       guia da unidade
│   └── debug.tsx           QA de conteúdo
├── components/             UI, exercícios, renderização de TeX, gráficos e widgets interativos
├── content/
│   ├── types.ts            modelo de conteúdo (seção → unidade → lição → partes)
│   ├── helpers.ts          construtores de exercícios
│   └── sections/<seção>/   o conteúdo em si
├── lib/                    aleatoriedade/formatação, notificações, widget, feedback
└── state/store.ts          estado persistido (XP, progresso, vidas, missões…)
modules/streak-widget/      widget de tela inicial (Kotlin)
scripts/                    build do APK e geração de assets
```

## Contribuindo com conteúdo

O modelo de conteúdo, as convenções para escrever exercícios (TeX, vírgula decimal, distratores, tolerâncias, widgets interativos) e o fluxo de verificação estão descritos em [`AGENTS.md`](AGENTS.md), na seção do projeto. Antes de abrir um pull request:

1. `npx tsc --noEmit` sem erros;
2. `/debug` sem erros ou avisos novos;
3. não altere o `id` de lições existentes (é a chave do progresso salvo nos aparelhos).

## Licença

Copyright (C) 2026 silveriodev

Este programa é software livre, distribuído sob a [GNU General Public License, versão 3](LICENSE) (GPL-3.0). Você pode usá-lo, estudá-lo, modificá-lo e redistribuí-lo; quem distribuir versões modificadas precisa mantê-las sob a mesma licença e com o código-fonte disponível. O programa é fornecido sem nenhuma garantia; veja o arquivo [`LICENSE`](LICENSE) para os termos completos.

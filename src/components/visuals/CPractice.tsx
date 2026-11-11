import React, { useMemo, useState } from 'react';
import { Keyboard, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { C, F } from '../../theme';
import { checkC, type CChallenge, type CCheck } from '../../lib/c/challenge';
import { C_SOURCE_LIMIT } from '../../lib/c/run';
import { makeRng, shuffle } from '../../lib/random';

const mono = Platform.select({ ios: 'Menlo', default: 'monospace' });
const label = { color: C.textMuted, fontFamily: F.bold, fontSize: 14 } as const;
const codeText = { color: C.text, fontFamily: mono, fontSize: 15, lineHeight: 22 } as const;
const panel = { backgroundColor: C.bgDeep, borderColor: C.border, borderWidth: 1, borderRadius: 12, padding: 12 } as const;

function Action({ title, onPress, muted = false }: { title: string; onPress: () => void; muted?: boolean }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={{ paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12, backgroundColor: muted ? C.surface2 : C.primary }}>
      <Text style={{ color: C.text, fontFamily: F.black }}>{title}</Text>
    </Pressable>
  );
}

export function CLab({ starter, entry = 'main', cases, onChange }: CChallenge & { onChange: (value: CCheck | null, ready?: boolean) => void }) {
  const [source, setSource] = useState(starter);
  const [result, setResult] = useState<CCheck | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const edit = (value: string) => { setSource(value); setResult(null); onChange(null, false); };
  const run = () => {
    Keyboard.dismiss();
    const checked = checkC(source, { entry, cases });
    setResult(checked);
    onChange(checked, checked.passed);
  };
  return (
    <View style={{ gap: 10 }}>
      <Text style={label}>{entry === 'main' ? 'Edite o programa e confira a saída.' : `Implemente ${entry} e rode os testes com várias entradas.`}</Text>
      <TextInput
        accessibilityLabel="Editor de código C"
        value={source}
        onChangeText={edit}
        maxLength={C_SOURCE_LIMIT}
        multiline
        autoCapitalize="none"
        autoCorrect={false}
        spellCheck={false}
        textAlignVertical="top"
        selectionColor={C.cyan}
        style={[panel, codeText, { minHeight: 170, maxHeight: 300 }]}
      />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        <Action title="Rodar código" onPress={run} />
        <Action title="Restaurar exemplo" muted onPress={() => edit(starter)} />
        <Action title={showHelp ? 'Fechar ajuda' : 'Comandos aceitos'} muted onPress={() => setShowHelp(!showHelp)} />
      </View>
      {showHelp ? <Text style={label}>Use int de 32 bits, funções, if/else, for e while. Para escrever na saída, use printf com %d, %i, %u, %x, %X, %c ou %%. O exercício roda no app; entradas e saída são simuladas.</Text> : null}
      {result ? (
        <View style={[panel, { gap: 8 }]} accessibilityLiveRegion="polite">
          <Text style={{ ...label, color: result.passed ? C.success : C.gold }}>
            {result.passed ? 'Todos os testes passaram. Toque em Verificar para continuar.' : 'Ajuste o código e rode novamente.'}
          </Text>
          {result.cases.map(({ result: actual, passed, args, value, output }, i) => (
            <View key={i} style={{ gap: 3 }}>
              <Text style={{ ...label, color: passed ? C.success : C.danger }}>
                {passed ? '✓' : '✗'} {entry}({(args ?? []).join(', ')})
              </Text>
              {!actual.ok ? <Text style={codeText}>{actual.error}</Text> : null}
              {actual.ok && value !== undefined ? <Text style={codeText}>Retorno: {actual.value} · esperado: {value}</Text> : null}
              {actual.output || output !== undefined ? <Text style={codeText}>Saída: {actual.output || '(vazia)'}</Text> : null}
              {!passed && output !== undefined ? <Text style={codeText}>Esperado: {output}</Text> : null}
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

export function CodePuzzle({ pieces, slots, onChange }: { pieces: string[]; slots: number; onChange: (value: string[], ready?: boolean) => void }) {
  const [selected, setSelected] = useState<number[]>([]);
  const order = useMemo(() => shuffle(makeRng(Math.floor(Math.random() * 1e9)), pieces.map((_, i) => i)), [pieces]);
  const change = (next: number[]) => { setSelected(next); onChange(next.map((i) => pieces[i]), next.length === slots); };
  const piece = (i: number, remove: boolean) => (
    <Pressable
      key={i}
      accessibilityRole="button"
      accessibilityLabel={`${remove ? 'Remover' : 'Adicionar'}: ${pieces[i].trim()}`}
      onPress={() => remove ? change(selected.filter((j) => j !== i)) : change([...selected, i])}
      disabled={!remove && selected.length === slots}
      style={{ ...panel, borderColor: remove ? C.cyan : C.border, paddingVertical: 8 }}
    >
      <Text style={codeText}>{pieces[i]}</Text>
    </Pressable>
  );
  return (
    <View style={{ gap: 9 }}>
      <Text style={label}>Seu código ({selected.length}/{slots}) · toque numa linha para remover</Text>
      <View style={{ ...panel, minHeight: 52, gap: 5 }}>
        {selected.length ? selected.map((i) => piece(i, true)) : <Text style={label}>Toque nos blocos para montar o trecho.</Text>}
      </View>
      <Text style={label}>Blocos disponíveis</Text>
      {order.filter((i) => !selected.includes(i)).map((i) => piece(i, false))}
    </View>
  );
}

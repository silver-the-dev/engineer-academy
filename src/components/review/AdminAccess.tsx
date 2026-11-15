import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { activateAdmin, adminConfigured, adminSupported, signInAdmin } from '../../lib/adminAuth';
import { C, F } from '../../theme';
import { Button, Card } from '../ui/Button';

export function AdminAccess({ onBeginSignIn }: { onBeginSignIn: () => () => void }) {
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [reset, setReset] = useState(false);
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const submitting = useRef(false);
  const activating = configured === false || reset;

  useEffect(() => {
    if (!adminSupported) return;
    let active = true;
    adminConfigured().then(value => { if (active) setConfigured(value); })
      .catch(() => {
        if (!active) return;
        setConfigured(false);
        setError('Não foi possível ler o acesso salvo neste aparelho. Use o código de ativação para criar uma nova senha.');
      });
    return () => { active = false; };
  }, []);

  async function submit() {
    if (submitting.current || !password) return;
    if (activating && password.normalize('NFC') !== confirmation.normalize('NFC')) {
      setError('As senhas precisam ser iguais.');
      return;
    }
    submitting.current = true;
    setBusy(true);
    setError('');
    const unlock = onBeginSignIn();
    try {
      if (activating) {
        await activateAdmin(code, password);
        setConfigured(true);
        setReset(false);
      }
      else await signInAdmin(password);
      setPassword('');
      setConfirmation('');
      setCode('');
      unlock();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível entrar.');
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }

  function switchReset() {
    setReset(value => !value);
    setPassword('');
    setConfirmation('');
    setCode('');
    setError('');
  }

  if (!adminSupported) return <Text style={styles.body}>Abra o aplicativo instalado para acessar a administração.</Text>;
  if (configured === null) return <View style={{ gap: 12 }}>
    <Text style={styles.body}>Abrindo acesso administrativo…</Text>
  </View>;

  return <Card style={{ gap: 14 }}>
    <Text style={styles.title}>{reset ? 'Redefinir senha' : activating ? 'Ativar administração' : 'Entrar na administração'}</Text>
    <Text style={styles.body}>{activating ? 'Use o código privado de ativação e escolha uma senha para este aparelho.' : 'Entre com a senha administrativa deste aparelho.'}</Text>
    {activating ? <>
      <Text style={styles.label}>Código de ativação</Text>
      <TextInput style={styles.field} accessibilityLabel="Código de ativação" value={code} onChangeText={setCode}
        autoCapitalize="none" autoCorrect={false} secureTextEntry maxLength={100} editable={!busy} />
    </> : null}
    <Text style={styles.label}>{activating ? 'Nova senha' : 'Senha administrativa'}</Text>
    <TextInput style={styles.field} accessibilityLabel={activating ? 'Nova senha' : 'Senha administrativa'} value={password} onChangeText={setPassword}
      autoCapitalize="none" autoCorrect={false} secureTextEntry maxLength={128} editable={!busy}
      onSubmitEditing={activating ? undefined : submit} />
    {activating ? <>
      <Text style={styles.label}>Confirmar senha</Text>
      <TextInput style={styles.field} accessibilityLabel="Confirmar senha" value={confirmation} onChangeText={setConfirmation}
        autoCapitalize="none" autoCorrect={false} secureTextEntry maxLength={128} editable={!busy} onSubmitEditing={submit} />
    </> : null}
    {error ? <Text accessibilityLiveRegion="polite" style={styles.error}>{error}</Text> : null}
    <Button silent title={busy ? 'Aguarde…' : activating ? 'Salvar senha e entrar' : 'Entrar'} onPress={submit}
      disabled={busy || !password || (activating && (!code || !confirmation))} />
    {configured ? <Button silent small variant="ghost" title={reset ? 'Voltar ao login' : 'Esqueci a senha'} disabled={busy} onPress={switchReset} /> : null}
  </Card>;
}

const styles = StyleSheet.create({
  title: { color: C.text, fontFamily: F.black, fontSize: 22 },
  body: { color: C.textMuted, fontFamily: F.semibold, fontSize: 15, lineHeight: 22 },
  label: { color: C.text, fontFamily: F.bold, fontSize: 14 },
  field: { color: C.text, fontFamily: F.semibold, fontSize: 17, backgroundColor: C.bg, borderColor: C.border, borderWidth: 1, borderRadius: 12, padding: 12, minHeight: 48 },
  error: { color: C.danger, fontFamily: F.bold, fontSize: 14 },
});

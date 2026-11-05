import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { emailValido, regrasSenha } from "../lib/auth";
import { supabase } from "../lib/supabase";
import { BRAND, useTheme } from "../theme";
import { Aviso, Button, Card, Checkbox, Col, Field, Input, Link, Row, T } from "../components/ui";
import { LogoMark, Wordmark } from "../components/Logo";

type Modo = "login" | "signup" | "forgot";
const SITE = "https://nutriperform.vercel.app";

export default function Auth() {
  const t = useTheme();
  const ins = useSafeAreaInsets();
  const [modo, setModo] = useState<Modo>("login");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [conf, setConf] = useState("");
  const [nome, setNome] = useState("");
  const [ver, setVer] = useState(false);
  const [aceite, setAceite] = useState(false);
  const [msg, setMsg] = useState<{ t: string; ok?: boolean } | null>(null);
  const [busy, setBusy] = useState(false);
  const regras = regrasSenha(senha);

  async function enviar() {
    const e = email.trim().toLowerCase();
    if (!emailValido(e)) return setMsg({ t: "Informe um e-mail válido." });
    setBusy(true);
    try {
      if (modo === "forgot") {
        await supabase.auth.resetPasswordForEmail(e, { redirectTo: SITE });
        return setMsg({ t: "Se este e-mail tiver conta, enviamos um link para redefinir a senha.", ok: true });
      }
      if (modo === "signup") {
        if (!nome.trim()) return setMsg({ t: "Informe o seu nome." });
        if (regras.some((r) => !r.ok)) return setMsg({ t: "A senha não atende aos requisitos." });
        if (senha !== conf) return setMsg({ t: "As senhas não coincidem." });
        if (!aceite) return setMsg({ t: "Aceite os termos e o tratamento de dados de saúde para continuar." });
        const { data, error } = await supabase.auth.signUp({ email: e, password: senha, options: { data: { name: nome.trim() }, emailRedirectTo: SITE } });
        if (error) return setMsg({ t: error.message.includes("registered") ? "Já existe uma conta com este e-mail." : "Não foi possível criar a conta. Tente de novo." });
        if (!data.session) return setMsg({ t: "Conta criada! Confirme pelo link que enviamos ao seu e-mail e depois entre.", ok: true });
        return;
      }
      const { error } = await supabase.auth.signInWithPassword({ email: e, password: senha });
      if (error) return setMsg({ t: error.message.toLowerCase().includes("confirm") ? "Confirme seu e-mail antes de entrar." : "E-mail ou senha incorretos." });
    } catch {
      setMsg({ t: "Sem conexão. Verifique a internet e tente de novo." });
    } finally {
      setBusy(false);
    }
  }

  const trocar = (m: Modo) => { setModo(m); setMsg(null); setSenha(""); setConf(""); };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ flexGrow: 1, justifyContent: "center", paddingHorizontal: 20, paddingTop: ins.top + 24, paddingBottom: ins.bottom + 24, gap: 22, maxWidth: 460, width: "100%", alignSelf: "center" }}>
        <Row gap={12}>
          <LogoMark size={54} />
          <Col gap={0}>
            <Wordmark size={21} />
            <T size={10.5} w={700} color={t.mute} upper track={1.8}>Treino · Nutrição · Performance</T>
          </Col>
        </Row>
        <Col gap={4}>
          <T size={30} w={800} style={{ letterSpacing: -0.6, lineHeight: 36 }}>{modo === "login" ? "Que bom te ver" : modo === "signup" ? "Crie sua conta" : "Recuperar senha"}</T>
          <T size={13.5} color={t.soft}>{modo === "login" ? "Entre para continuar seu acompanhamento." : modo === "signup" ? "Leva menos de um minuto." : "Enviaremos um link para o seu e-mail."}</T>
        </Col>
        <Card pad={20} gap={16}>
          {modo === "signup" ? <Field label="Nome"><Input value={nome} onChangeText={setNome} placeholder="Como quer ser chamado" textContentType="name" /></Field> : null}
          <Field label="E-mail">
            <Input value={email} onChangeText={setEmail} placeholder="voce@email.com" keyboardType="email-address" autoCapitalize="none" autoCorrect={false} textContentType="emailAddress" autoComplete="email" />
          </Field>
          {modo !== "forgot" ? (
            <Field label="Senha">
              <View>
                <Input value={senha} onChangeText={setSenha} placeholder="Sua senha" secureTextEntry={!ver} autoCapitalize="none" textContentType={modo === "signup" ? "newPassword" : "password"} style={{ paddingRight: 80 }} />
                <Pressable onPress={() => setVer(!ver)} style={{ position: "absolute", right: 14, top: 0, bottom: 0, justifyContent: "center" }}>
                  <T size={12} w={700} color={BRAND}>{ver ? "Ocultar" : "Mostrar"}</T>
                </Pressable>
              </View>
            </Field>
          ) : null}
          {modo === "signup" ? (
            <>
              <Row gap={6} wrap>
                {regras.map((r) => (
                  <View key={r.id} style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: r.ok ? t.brandSoft : t.raised }}>
                    <T size={11} w={600} color={r.ok ? BRAND : t.mute}>{r.ok ? "✓ " : ""}{r.label}</T>
                  </View>
                ))}
              </Row>
              <Field label="Confirmar senha"><Input value={conf} onChangeText={setConf} secureTextEntry autoCapitalize="none" textContentType="newPassword" /></Field>
              <Pressable onPress={() => setAceite(!aceite)}>
                <Row gap={10} style={{ alignItems: "flex-start" }}>
                  <Checkbox on={aceite} size={20} />
                  <T size={11.5} color={t.soft} style={{ flex: 1 }}>Aceito os termos de uso e autorizo o tratamento dos meus dados de saúde (LGPD, art. 11).</T>
                </Row>
              </Pressable>
            </>
          ) : null}
          {msg ? <Aviso tone={msg.ok ? "brand" : "danger"}>{msg.t}</Aviso> : null}
          <Button size="lg" onPress={enviar} disabled={busy}>{modo === "login" ? "Entrar" : modo === "signup" ? "Criar conta" : "Enviar link"}</Button>
          {modo === "login" ? <View style={{ alignItems: "center" }}><Link onPress={() => trocar("forgot")}>Esqueci a senha</Link></View> : null}
        </Card>
        <Row gap={6} style={{ justifyContent: "center" }}>
          <T size={13} color={t.soft}>{modo === "login" ? "Ainda não tem conta?" : "Já tem conta?"}</T>
          <Link size={13} onPress={() => trocar(modo === "login" ? "signup" : "login")}>{modo === "login" ? "Criar conta" : "Entrar"}</Link>
        </Row>
        <T size={11} color={t.mute} center>Seus dados ficam salvos na sua conta e aparecem no app e no site.</T>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

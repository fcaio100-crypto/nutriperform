import { useRef, useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";
import * as Sharing from "expo-sharing";
import { captureRef } from "react-native-view-shot";
import { ImagePlus, Share2 } from "lucide-react-native";
import { useStore } from "../state/store";
import { useUi } from "../state/ui";
import { addDays, parseISO } from "../lib/calc";
import { corDe, fmtDur, fmtKm, inicioSemana, isoDoTreino, kmDoTreino, pace, tituloTreino } from "../lib/treinos";
import type { Workout } from "../lib/types";
import { LIMA, PRETO, fonte, useTheme } from "../theme";
import { LogoMark } from "../components/Logo";
import { Button, Muted, Segmented, Sheet, T } from "../components/ui";

type Estilo = "foto" | "escuro" | "transparente";
type Formato = "post" | "story" | "quadrado";
const MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];

function numerosDoCard(w: Workout) {
  const km = kmDoTreino(w);
  const destaque: [string, string] = km > 0 ? [fmtKm(km), "km"] : [fmtDur(w.duracaoMin), ""];
  const outros: [string, string][] = [];
  if (km > 0) { outros.push(["Pace", `${pace(w.duracaoMin, km)} /km`]); outros.push(["Tempo", fmtDur(w.duracaoMin)]); }
  if (w.kcal) outros.push(["Calorias", `${Math.round(w.kcal)} kcal`]);
  if (w.fcMedia) outros.push(["FC média", `${w.fcMedia} bpm`]);
  if (w.pse) outros.push(["Esforço", `${w.pse}/10`]);
  return { destaque, outros: outros.slice(0, 3) };
}

/** O card em si (mesmo desenho do app web, agora em componentes nativos). Medidas pensadas em 1080 px e escaladas por k. */
function CardTreino({ w, todos, estilo, formato, foto, nome, largura }: { w: Workout; todos: Workout[]; estilo: Estilo; formato: Formato; foto: string | null; nome: string; largura: number }) {
  const k = largura / 1080;
  const H = (formato === "story" ? 1920 : formato === "quadrado" ? 1080 : 1350) * k;
  const M = 72 * k;
  const iso = isoDoTreino(w);
  const d = parseISO(iso);
  const { destaque, outros } = numerosDoCard(w);
  const sombra = estilo !== "escuro" ? { textShadowColor: "rgba(0,0,0,.45)", textShadowRadius: 18 * k, textShadowOffset: { width: 0, height: 3 * k } } : null;
  const txt = (size: number, w8: 600 | 700 | 800, color = "#fff", italic = false) => [{ fontFamily: fonte(w8, italic), fontSize: size * k, color, includeFontPadding: false }, sombra];
  const grande = formato === "quadrado" ? 170 : 220;
  const tag = (w.modalidade + (w.nivel ? ` · Nível ${w.nivel}` : w.sensacao ? ` · ${w.sensacao}` : "")).toUpperCase();
  const ini = inicioSemana(iso);
  const vals = Array.from({ length: 7 }, (_, i) => todos.filter((x) => isoDoTreino(x) === addDays(ini, i)).reduce((s, x) => s + (x.duracaoMin || 0), 0));
  const mx = Math.max(30, ...vals);

  return (
    <View style={{ width: largura, height: H, backgroundColor: estilo === "transparente" ? "transparent" : PRETO, overflow: "hidden" }}>
      {estilo === "foto" && foto ? (
        <>
          <Image source={{ uri: foto }} style={StyleSheet.absoluteFill} resizeMode="cover" />
          <LinearGradient colors={["rgba(5,8,6,.55)", "rgba(5,8,6,0)"]} style={{ position: "absolute", left: 0, right: 0, top: 0, height: 280 * k }} />
          <LinearGradient colors={["rgba(5,8,6,0)", "rgba(5,8,6,.9)"]} style={{ position: "absolute", left: 0, right: 0, top: H * 0.35, bottom: 0 }} />
        </>
      ) : estilo !== "transparente" ? (
        <>
          <View style={{ position: "absolute", width: 1400 * k, height: 1400 * k, borderRadius: 700 * k, right: -620 * k, top: -560 * k, backgroundColor: "rgba(163,230,53,.16)" }} />
          <View style={{ position: "absolute", width: 700 * k, height: 700 * k, borderRadius: 350 * k, right: -180 * k, top: -160 * k, backgroundColor: "rgba(163,230,53,.16)" }} />
          {Array.from({ length: 6 }, (_, i) => (
            <View key={i} style={{ position: "absolute", left: 560 * k + i * 120 * k, top: -200 * k, width: 26 * k, height: 1500 * k, borderRadius: 13 * k, backgroundColor: "rgba(163,230,53,.08)", transform: [{ rotate: "-35deg" }] }} />
          ))}
          {estilo === "foto" ? <Text style={[txt(32, 600, "rgba(255,255,255,.55)"), { position: "absolute", top: H * 0.38, width: "100%", textAlign: "center" }]}>Escolha uma foto abaixo</Text> : null}
        </>
      ) : null}

      {/* marca */}
      <View style={{ position: "absolute", left: M, top: M, flexDirection: "row", alignItems: "center", gap: 20 * k }}>
        <LogoMark size={84 * k} />
        <Text style={txt(50, 800, "#fff", true)}>NUTRI<Text style={{ color: LIMA }}>PERFORM</Text></Text>
      </View>
      <View style={{ position: "absolute", right: M, top: M + 108 * k, alignItems: "flex-end", gap: 10 * k }}>
        <Text style={txt(30, 600, "rgba(255,255,255,.85)")}>{`${String(d.getDate()).padStart(2, "0")} de ${MESES[d.getMonth()]} de ${d.getFullYear()}`}</Text>
        {nome ? <Text style={txt(30, 600, "rgba(255,255,255,.85)")}>{nome}</Text> : null}
      </View>

      {/* semana (estilo escuro) */}
      {estilo === "escuro" && formato !== "quadrado" ? (
        <View style={{ position: "absolute", left: M, right: M, top: M + 230 * k, gap: 20 * k }}>
          <Text style={txt(26, 700, "rgba(255,255,255,.7)")}>MINHA SEMANA</Text>
          <View style={{ flexDirection: "row", alignItems: "flex-end", height: 160 * k }}>
            {vals.map((v, i) => (
              <View key={i} style={{ flex: 1, alignItems: "center" }}>
                <View style={{ width: "60%", height: Math.max(8, (v / mx) * 160) * k, borderRadius: 10 * k, backgroundColor: addDays(ini, i) === iso ? LIMA : v ? "rgba(255,255,255,.45)" : "rgba(255,255,255,.14)" }} />
              </View>
            ))}
          </View>
          <View style={{ flexDirection: "row" }}>{"STQQSSD".split("").map((l, i) => <Text key={i} style={[txt(24, 700, "rgba(255,255,255,.6)"), { flex: 1, textAlign: "center" }]}>{l}</Text>)}</View>
        </View>
      ) : null}

      {/* bloco de baixo */}
      <View style={{ position: "absolute", left: M, right: M, bottom: M }}>
        <View style={{ alignSelf: "flex-start", paddingHorizontal: 24 * k, height: 58 * k, borderRadius: 29 * k, backgroundColor: corDe(w.modalidade), justifyContent: "center", marginBottom: 20 * k }}>
          <Text style={{ fontFamily: fonte(800), fontSize: 28 * k, color: "#fff" }}>{tag}</Text>
        </View>
        <Text numberOfLines={1} style={[txt(46, 800), { marginBottom: 6 * k }]}>{tituloTreino(w)}</Text>
        <Text style={[txt(grande, 800, "#fff", true), { marginLeft: -8 * k, lineHeight: grande * 1.05 * k }]}>
          {destaque[0]}{destaque[1] ? <Text style={{ color: LIMA, fontSize: 76 * k }}> {destaque[1]}</Text> : null}
        </Text>
        <View style={{ height: 3 * k, backgroundColor: "rgba(255,255,255,.25)", marginTop: 16 * k, marginBottom: 36 * k }} />
        <View style={{ flexDirection: "row" }}>
          {outros.map(([kk, v]) => (
            <View key={kk} style={{ flex: 1, gap: 10 * k }}>
              <Text style={txt(26, 700, "rgba(255,255,255,.7)")}>{kk.toUpperCase()}</Text>
              <Text style={txt(54, 800)} numberOfLines={1} adjustsFontSizeToFit>{v}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

export default function ShareTreino() {
  const { state } = useStore();
  const { shareWorkout: w, close, notify } = useUi();
  const t = useTheme();
  const ref = useRef<React.ComponentRef<typeof View>>(null);
  const [foto, setFoto] = useState<string | null>(null);
  const [estilo, setEstilo] = useState<Estilo>("escuro");
  const [formato, setFormato] = useState<Formato>("post");
  const [ocupado, setOcupado] = useState(false);
  const nome = state.profile.nome ? state.profile.nome.split(" ")[0] : "";
  if (!w) return null;

  const largura = formato === "story" ? 200 : formato === "quadrado" ? 300 : 260;

  async function escolherFoto() {
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.9 });
    if (!r.canceled && r.assets[0]) { setFoto(r.assets[0].uri); setEstilo("foto"); }
  }

  async function compartilhar() {
    setOcupado(true);
    try {
      // renderiza o card em 1080 px de largura, como no app web
      const uri = await captureRef(ref as never, { format: "png", quality: 1, width: 1080, result: "tmpfile" });
      if (!(await Sharing.isAvailableAsync())) throw new Error();
      await Sharing.shareAsync(uri, { mimeType: "image/png", UTI: "public.png", dialogTitle: tituloTreino(w!) });
    } catch {
      notify("Não deu para compartilhar agora.");
    } finally {
      setOcupado(false);
    }
  }

  return (
    <Sheet title="Compartilhar treino" onClose={close} footer={<Button size="lg" icon={<Share2 size={17} color="#fff" />} onPress={compartilhar} disabled={ocupado}>Compartilhar / salvar imagem</Button>}>
      <Segmented value={estilo} onChange={setEstilo} options={[["escuro", "Escuro"], ["foto", "Com foto"], ["transparente", "Transparente"]]} />
      <Segmented value={formato} onChange={setFormato} options={[["post", "Post 4:5"], ["story", "Story 9:16"], ["quadrado", "Quadrado"]]} />
      <View style={{ alignItems: "center", padding: 12, borderRadius: 20, backgroundColor: estilo === "transparente" ? "#DDE4E0" : t.raised }}>
        <View ref={ref} collapsable={false} style={{ borderRadius: 4, overflow: "hidden" }}>
          <CardTreino w={w} todos={state.workouts} estilo={estilo} formato={formato} foto={foto} nome={nome} largura={largura} />
        </View>
      </View>
      <Pressable onPress={escolherFoto} style={{ flexDirection: "row", gap: 8, alignItems: "center", justifyContent: "center", paddingVertical: 13, borderRadius: 14, borderWidth: 1, borderStyle: "dashed", borderColor: t.line }}>
        <ImagePlus size={17} color={t.soft} /><T size={13} w={700} color={t.soft}>{foto ? "Trocar foto" : "Usar uma foto do treino"}</T>
      </Pressable>
      <Muted size={11.5} center>“Transparente” gera um adesivo PNG para colocar por cima da sua foto no Instagram. “Compartilhar” abre Instagram, WhatsApp e a opção de salvar na galeria.</Muted>
    </Sheet>
  );
}

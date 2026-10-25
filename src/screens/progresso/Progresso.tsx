import { useUi } from "../../state/ui";
import { PageTitle, Tabs } from "../../components/ui";
import Corpo from "./Corpo";
import Evolucao from "./Evolucao";
import Metas from "./Metas";

const ABAS = [
  { id: "corpo", label: "Peso e corpo" },
  { id: "evolucao", label: "Evolução" },
  { id: "metas", label: "Metas" },
] as const;
type Aba = (typeof ABAS)[number]["id"];

export default function Progresso() {
  const { sub, setSub } = useUi();
  const aba = (sub.progresso as Aba) || "corpo";
  return (
    <>
      <PageTitle title="Progresso" subtitle="Seu corpo, sua evolução e suas metas" />
      <Tabs value={aba} onChange={(v) => setSub("progresso", v)} items={ABAS.map((a) => ({ id: a.id, label: a.label }))} />
      {aba === "corpo" && <Corpo />}
      {aba === "evolucao" && <Evolucao />}
      {aba === "metas" && <Metas />}
    </>
  );
}

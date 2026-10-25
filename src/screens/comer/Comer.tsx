import { useStore } from "../../state/store";
import { useUi } from "../../state/ui";
import { PageTitle, Tabs } from "../../components/ui";
import Diario from "./Diario";
import Plano from "./Plano";
import Agua from "./Agua";
import Suplementos from "./Suplementos";

const ABAS = [
  { id: "diario", label: "Diário" },
  { id: "plano", label: "Plano alimentar" },
  { id: "agua", label: "Água" },
  { id: "supl", label: "Suplementos" },
] as const;
type Aba = (typeof ABAS)[number]["id"];

export default function Comer() {
  const { sub, setSub } = useUi();
  useStore();
  const aba = (sub.comer as Aba) || "diario";
  return (
    <>
      <PageTitle title="Comer" subtitle="Diário, plano, água e suplementos" />
      <Tabs value={aba} onChange={(v) => setSub("comer", v)} items={ABAS.map((a) => ({ id: a.id, label: a.label }))} />
      {aba === "diario" && <Diario />}
      {aba === "plano" && <Plano />}
      {aba === "agua" && <Agua />}
      {aba === "supl" && <Suplementos />}
    </>
  );
}

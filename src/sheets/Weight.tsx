import { useState } from "react";
import { useStore } from "../state/store";
import { useUi } from "../state/ui";
import { Button, Field, Input, Sheet } from "../components/ui";

export default function Weight() {
  const { state, dispatch } = useStore();
  const { close, notify } = useUi();
  const [v, setV] = useState(String(state.profile.peso).replace(".", ","));
  function salvar() {
    const peso = parseFloat(v.replace(",", "."));
    if (!peso) return;
    const d = new Date();
    dispatch({ type: "ADD_WEIGHT", entry: { data: `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`, peso } });
    notify("Peso registrado");
    close();
  }
  return (
    <Sheet title="Registrar peso" onClose={close} footer={<Button size="lg" onClick={salvar}>Salvar</Button>}>
      <Field label="Peso de hoje (kg)" hint="Pese-se sempre no mesmo horário. A tendência usa a média dos últimos registros.">
        <Input autoFocus inputMode="decimal" value={v} onChange={(e) => setV(e.target.value)} className="text-[22px] font-mono text-center py-4" />
      </Field>
    </Sheet>
  );
}

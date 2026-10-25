/** Abre uma página simples para imprimir/salvar em PDF. */
export function printDoc(titulo: string, corpo: string) {
  const data = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>${titulo}</title>
<style>body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#14211A;padding:28px;max-width:720px;margin:0 auto}
h1{font-size:19px;margin:0 0 2px}.sub{font-size:11.5px;color:#666;margin-bottom:22px}h2{font-size:14px;margin:18px 0 2px}
.foco{font-size:11.5px;color:#555;margin-bottom:7px}table{width:100%;border-collapse:collapse;font-size:12.5px}
td{padding:5px 0;border-bottom:1px solid #eee}td.qtd{text-align:right;color:#555}.desc{font-size:12px;margin:3px 0 5px}
.sub-box{font-size:11px;color:#555;background:#F0F4F1;border-radius:8px;padding:8px 10px}.footer{font-size:10px;color:#999;margin-top:26px}</style>
</head><body><h1>${titulo}</h1><div class="sub">${data}</div>${corpo}
<div class="footer">Gerado pelo NutriPerform. Não substitui a avaliação de um profissional.</div></body></html>`;
  const w = window.open("", "_blank");
  if (!w) return window.print();
  w.document.open();
  w.document.write(html);
  w.document.close();
  setTimeout(() => { w.focus(); w.print(); }, 250);
}

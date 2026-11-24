import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft, Check, Clock, Copy, Loader2, Lock, XCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { PixCheckout } from "@/components/app/PixCheckout";
import { useEuId } from "@/hooks/use-app";
import { formatarReais } from "@/lib/pix";

export const Route = createFileRoute("/_authenticated/sensi/$id")({
  head: () => ({
    meta: [
      { title: "Sensi — RED SENSI PRO FF" },
      { name: "description", content: "Tabela completa da sensi de Free Fire: geral, ponto vermelho, miras, AWM, olhadinha e DPI." },
      { property: "og:title", content: "Sensi Free Fire — RED SENSI PRO FF" },
      { property: "og:description", content: "Tabela completa da sensi com botão COPIAR." },
      { property: "og:type", content: "product" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SensiPage,
});

const LINHAS = [
  ["geral", "Geral"],
  ["vermelho", "Ponto Vermelho"],
  ["mira2x", "Mira 2x"],
  ["mira4x", "Mira 4x"],
  ["awm", "Mira AWM"],
  ["olhadinha", "Olhadinha"],
  ["botao", "Tamanho do botão"],
  ["dpi", "DPI"],
] as const;

type Valores = Record<(typeof LINHAS)[number][0], number>;

function SensiPage() {
  const { id } = Route.useParams();
  const euId = useEuId();
  const [checkout, setCheckout] = useState(false);

  const { data: sensi, isLoading } = useQuery({
    queryKey: ["sensi", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("sensis").select("id,marca,modelo,geral,preco,destaque").eq("id", id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
  const { data: valores } = useQuery({
    queryKey: ["sensi-valores", id, euId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("sensi_valores", { _sensi_id: id });
      if (error) throw error;
      return ((data ?? [])[0] as Valores | undefined) ?? null;
    },
  });
  const { data: pedidos = [] } = useQuery({
    queryKey: ["meus-pedidos", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pedidos")
        .select("id,status,created_at")
        .eq("sensi_id", id)
        .eq("usuario_id", euId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
  const { data: meusDados } = useQuery({
    queryKey: ["meus-dados-privados", euId],
    queryFn: async () => {
      const { data } = await supabase.rpc("meus_dados_privados");
      return data?.[0] ?? null;
    },
  });

  if (isLoading) return <Loader2 className="mx-auto mt-20 animate-spin text-primary" />;
  if (!sensi) {
    return (
      <div className="p-8 text-center">
        <p className="font-display text-3xl uppercase">Sensi não encontrada</p>
        <Button asChild variant="neonOutline" className="mt-4"><Link to="/loja">VOLTAR PRA LOJA</Link></Button>
      </div>
    );
  }

  const ultimo = pedidos[0];
  const liberada = !!valores;

  function copiar() {
    if (!valores || !sensi) return;
    const texto = [`🔴 SENSI ${sensi.modelo.toUpperCase()} — RED SENSI PRO FF`, ...LINHAS.map(([k, l]) => `${l}: ${valores[k]}`)].join("\n");
    navigator.clipboard.writeText(texto).then(() => toast.success("Sensi copiada! Cola no jogo e amassa."));
  }

  return (
    <div className="mx-auto max-w-lg pb-6">
      <header className="sticky top-0 z-30 flex items-center gap-2 border-b border-border bg-background/90 px-2 py-2 backdrop-blur-md">
        <Button asChild size="icon" variant="ghost" aria-label="Voltar"><Link to="/loja"><ArrowLeft /></Link></Button>
        <span className="font-display text-xl uppercase text-muted-foreground">{sensi.marca}</span>
      </header>

      <section className="relative overflow-hidden px-5 pb-6 pt-8">
        <div className="pointer-events-none absolute inset-0 bg-grid-red opacity-50 [mask-image:linear-gradient(to_bottom,black,transparent)]" />
        <p className="relative text-xs uppercase tracking-[0.3em] text-muted-foreground">Sensi Free Fire</p>
        <h1 className="relative font-display text-6xl uppercase leading-none">{sensi.modelo}</h1>
        <p className="relative mt-2 font-display text-3xl neon-text">{formatarReais(Number(sensi.preco))}</p>
      </section>

      <div className="mx-4 overflow-hidden rounded-2xl border border-border bg-card">
        <table className="w-full">
          <tbody>
            {LINHAS.map(([k, label]) => (
              <tr key={k} className="border-b border-border last:border-0">
                <td className="px-4 py-3 text-sm text-muted-foreground">{label}</td>
                <td className="px-4 py-3 text-right font-display text-2xl">
                  {liberada ? (
                    valores[k]
                  ) : k === "geral" ? (
                    sensi.geral
                  ) : (
                    <span className="inline-flex items-center gap-1 text-muted-foreground"><Lock className="size-4" /> ●●●</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mx-4 mt-5 space-y-3">
        {liberada ? (
          <Button variant="neon" size="xl" className="w-full" onClick={copiar}>
            <Copy /> COPIAR SENSI
          </Button>
        ) : ultimo?.status === "pendente" ? (
          <div className="flex items-center gap-3 rounded-xl border border-warning/50 bg-card p-4 text-sm">
            <Clock className="size-5 shrink-0 text-warning" />
            Pagamento em análise. Assim que o admin aprovar, a tabela libera aqui.
          </div>
        ) : (
          <>
            {ultimo?.status === "reprovado" && (
              <div className="flex items-center gap-3 rounded-xl border border-destructive/50 bg-card p-4 text-sm">
                <XCircle className="size-5 shrink-0 text-destructive" /> Seu último pagamento foi reprovado. Fale com o suporte ou tente de novo.
              </div>
            )}
            <Button variant="neon" size="xl" className="w-full" onClick={() => setCheckout(true)}>
              <Lock /> DESBLOQUEAR POR {formatarReais(Number(sensi.preco))}
            </Button>
          </>
        )}
        {liberada && (
          <p className="flex items-center justify-center gap-1 text-xs text-success"><Check className="size-3" /> Sensi liberada na sua conta</p>
        )}
      </div>

      <PixCheckout
        sensi={{ id: sensi.id, modelo: sensi.modelo, preco: Number(sensi.preco) }}
        aberto={checkout}
        onOpenChange={setCheckout}
        whatsappPadrao={meusDados?.whatsapp ?? ""}
      />
    </div>
  );
}

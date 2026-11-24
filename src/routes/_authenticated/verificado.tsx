import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { ArrowLeft, ImagePlus, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEuId } from "@/hooks/use-app";
import { enviarArquivo } from "@/lib/midia";

export const Route = createFileRoute("/_authenticated/verificado")({
  head: () => ({
    meta: [
      { title: "Pedir selo verificado — RED SENSI PRO FF" },
      { name: "description", content: "Envie seu ID do Free Fire, print do perfil e sua rede social para ganhar o selo azul." },
      { property: "og:title", content: "Pedir selo verificado — RED SENSI PRO FF" },
      { property: "og:description", content: "Ganhe o selo azul de criador de conteúdo." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PedirVerificado,
});

const REDES = ["TikTok", "Kwai", "Instagram", "YouTube"] as const;

function PedirVerificado() {
  const euId = useEuId();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [print, setPrint] = useState<File | null>(null);
  const [rede, setRede] = useState<(typeof REDES)[number] | "">("");
  const [enviando, setEnviando] = useState(false);

  async function enviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const idFF = String(f.get("id_ff")).trim();
    let arroba = String(f.get("arroba")).trim();
    if (!/^\d{3,20}$/.test(idFF)) return void toast.error("ID do Free Fire deve ter só números.");
    if (!print) return void toast.error("Envie o print do seu perfil FF com selo Garena.");
    if (!rede) return void toast.error("Escolha a rede social.");
    if (arroba.length < 2) return void toast.error("Digite seu @.");
    if (!arroba.startsWith("@")) arroba = `@${arroba}`;

    setEnviando(true);
    try {
      const caminho = await enviarArquivo("prints", euId, "verificacao", print);
      const { error } = await supabase.from("verificados").insert({ id_ff: idFF, print_url: caminho, rede_social: rede, arroba: arroba.slice(0, 60) });
      if (error) throw error;
      toast.success("Pedido enviado! O admin vai analisar.");
      qc.invalidateQueries({ queryKey: ["minha-verificacao", euId] });
      navigate({ to: "/perfil" });
    } catch {
      toast.error("Não foi possível enviar. Tente de novo.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg pb-8">
      <header className="sticky top-0 z-30 flex items-center gap-2 border-b border-border bg-background/90 px-2 py-2 backdrop-blur-md">
        <Button asChild size="icon" variant="ghost" aria-label="Voltar"><Link to="/perfil"><ArrowLeft /></Link></Button>
        <span className="font-display text-xl uppercase">Pedir Verificado</span>
      </header>
      <div className="px-5 pt-6">
        <ShieldCheck className="size-12 text-verified" />
        <h1 className="mt-2 font-display text-4xl uppercase leading-none">Selo azul ✅</h1>
        <p className="mt-2 text-sm text-muted-foreground">Para criadores de conteúdo de Free Fire. Envie os dados e o admin aprova ou reprova.</p>

        <form onSubmit={enviar} className="mt-6 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="id_ff" className="font-display text-base uppercase">ID do Free Fire</Label>
            <Input id="id_ff" name="id_ff" inputMode="numeric" required placeholder="123456789" className="h-11 bg-card" />
          </div>
          <div className="space-y-1.5">
            <Label className="font-display text-base uppercase">Print do perfil FF com selo Garena</Label>
            <label className="flex h-40 cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-primary/60 bg-card">
              {print ? (
                <img src={URL.createObjectURL(print)} alt="Print" className="size-full object-contain" />
              ) : (
                <span className="text-center text-sm text-muted-foreground"><ImagePlus className="mx-auto mb-1 size-8 text-primary" />Toque para enviar o print</span>
              )}
              <input type="file" accept="image/*" className="sr-only" onChange={(e) => setPrint(e.target.files?.[0] ?? null)} />
            </label>
          </div>
          <div className="space-y-1.5">
            <Label className="font-display text-base uppercase">Rede social</Label>
            <Select value={rede} onValueChange={(v) => setRede(v as (typeof REDES)[number])}>
              <SelectTrigger className="h-11 bg-card"><SelectValue placeholder="Escolha" /></SelectTrigger>
              <SelectContent>{REDES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="arroba" className="font-display text-base uppercase">Seu @</Label>
            <Input id="arroba" name="arroba" required placeholder="@seunick" maxLength={60} className="h-11 bg-card" />
          </div>
          <Button type="submit" variant="neon" size="xl" className="w-full" disabled={enviando}>
            {enviando && <Loader2 className="animate-spin" />} ENVIAR PEDIDO
          </Button>
        </form>
      </div>
    </div>
  );
}

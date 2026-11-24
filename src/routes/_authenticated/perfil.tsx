import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Camera, Clock, LogOut, Minus, Plus, Settings, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Logo } from "@/components/app/Logo";
import { InstallButton } from "@/components/app/InstallButton";
import { CabecalhoPerfil, GradePosts } from "@/components/app/PerfilView";
import { PATENTES, perfilQuery, type Perfil, useEuId, useIsAdmin } from "@/hooks/use-app";
import { capasDeHoje } from "@/lib/idade";
import { enviarArquivo } from "@/lib/midia";

export const Route = createFileRoute("/_authenticated/perfil")({
  head: () => ({
    meta: [
      { title: "Meu perfil — RED SENSI PRO FF" },
      { name: "description", content: "Seu perfil gamer: foto, idade, patente, bio, capas de hoje e selo verificado." },
      { property: "og:title", content: "Meu perfil — RED SENSI PRO FF" },
      { property: "og:description", content: "Seu perfil gamer de Free Fire." },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MeuPerfil,
});

function MeuPerfil() {
  const euId = useEuId();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { data: perfil } = useQuery(perfilQuery(euId));
  const { data: souAdmin } = useIsAdmin(euId);
  const [editar, setEditar] = useState(false);
  const { data: verif } = useQuery({
    queryKey: ["minha-verificacao", euId],
    queryFn: async () => {
      const { data } = await supabase.from("verificados").select("status,created_at").eq("usuario_id", euId).order("created_at", { ascending: false }).limit(1);
      return data?.[0] ?? null;
    },
  });

  async function sair() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  if (!perfil) return null;

  return (
    <div className="mx-auto max-w-lg">
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-background/90 px-4 py-2 backdrop-blur-md">
        <Logo size="sm" />
        <div className="flex gap-1">
          {souAdmin && (
            <Button asChild size="icon" variant="ghost" aria-label="Painel admin"><Link to="/admin"><Settings /></Link></Button>
          )}
          <Button size="icon" variant="ghost" aria-label="Sair" onClick={sair}><LogOut /></Button>
        </div>
      </header>

      <CabecalhoPerfil
        perfil={perfil}
        acoes={
          <div className="space-y-3">
            <CapasHoje perfil={perfil} />
            <div className="grid grid-cols-2 gap-2">
              <Button variant="secondary" onClick={() => setEditar(true)}>Editar perfil</Button>
              {perfil.verificado ? (
                <Button variant="secondary" disabled className="text-verified"><ShieldCheck /> Verificado</Button>
              ) : verif?.status === "pendente" ? (
                <Button variant="secondary" disabled><Clock /> Em análise</Button>
              ) : (
                <Button asChild variant="neonOutline" className="text-base"><Link to="/verificado">Pedir Verificado ✅</Link></Button>
              )}
            </div>
            {verif?.status === "reprovado" && !perfil.verificado && (
              <p className="text-xs text-destructive">Seu último pedido de verificado foi reprovado. Você pode enviar de novo.</p>
            )}
            <InstallButton className="w-full" />
          </div>
        }
      />
      <div className="mt-5 border-t border-border">
        <GradePosts usuarioId={perfil.id} euId={euId} />
      </div>
      <EditarPerfil perfil={perfil} aberto={editar} onOpenChange={setEditar} />
    </div>
  );
}

function CapasHoje({ perfil }: { perfil: Perfil }) {
  const qc = useQueryClient();
  const atual = capasDeHoje(perfil.capas_hoje, perfil.capas_dia);
  const [valor, setValor] = useState(atual);
  const m = useMutation({
    mutationFn: async (n: number) => {
      const { error } = await supabase.from("usuarios").update({ capas_hoje: n }).eq("id", perfil.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Capas atualizadas no ranking!");
      qc.invalidateQueries({ queryKey: ["perfil", perfil.id] });
      qc.invalidateQueries({ queryKey: ["ranking-capa"] });
    },
    onError: () => toast.error("Não foi possível salvar."),
  });
  return (
    <div className="flex items-center gap-2 rounded-xl border border-border bg-card p-2">
      <span className="flex-1 pl-2 text-sm text-muted-foreground">Capas de hoje</span>
      <Button size="icon" variant="secondary" aria-label="Menos" onClick={() => setValor(Math.max(0, valor - 1))}><Minus /></Button>
      <Input
        type="number"
        inputMode="numeric"
        value={valor}
        onChange={(e) => setValor(Math.max(0, Math.min(9999, Number(e.target.value) || 0)))}
        className="h-9 w-16 bg-background text-center font-display text-xl"
      />
      <Button size="icon" variant="secondary" aria-label="Mais" onClick={() => setValor(Math.min(9999, valor + 1))}><Plus /></Button>
      <Button size="sm" disabled={valor === atual || m.isPending} onClick={() => m.mutate(valor)}>Salvar</Button>
    </div>
  );
}

function EditarPerfil({ perfil, aberto, onOpenChange }: { perfil: Perfil; aberto: boolean; onOpenChange: (v: boolean) => void }) {
  const qc = useQueryClient();
  const [nome, setNome] = useState(perfil.nome);
  const [bio, setBio] = useState(perfil.bio);
  const [patente, setPatente] = useState(perfil.patente);
  const [foto, setFoto] = useState<File | null>(null);
  const [salvando, setSalvando] = useState(false);

  async function salvar() {
    if (nome.trim().length < 2) return void toast.error("Nome muito curto.");
    setSalvando(true);
    try {
      const dados: { nome: string; bio: string; patente: string; foto?: string } = { nome: nome.trim(), bio: bio.trim().slice(0, 300), patente };
      if (foto) dados.foto = await enviarArquivo("midia", perfil.id, "avatar", foto);
      const { error } = await supabase.from("usuarios").update(dados).eq("id", perfil.id);
      if (error) throw error;
      toast.success("Perfil atualizado!");
      qc.invalidateQueries({ queryKey: ["perfil", perfil.id] });
      onOpenChange(false);
    } catch {
      toast.error("Não foi possível salvar.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Dialog open={aberto} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm border-border bg-popover">
        <DialogHeader><DialogTitle className="font-display text-3xl uppercase">Editar perfil</DialogTitle></DialogHeader>
        <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-primary/60 p-3 text-sm">
          <Camera className="size-5 text-primary" /> {foto ? foto.name : "Trocar foto"}
          <input type="file" accept="image/*" className="sr-only" onChange={(e) => setFoto(e.target.files?.[0] ?? null)} />
        </label>
        <div className="space-y-1.5"><Label>Nome</Label><Input value={nome} onChange={(e) => setNome(e.target.value)} maxLength={80} className="bg-card" /></div>
        <div className="space-y-1.5">
          <Label>Patente</Label>
          <Select value={patente} onValueChange={setPatente}>
            <SelectTrigger className="bg-card"><SelectValue /></SelectTrigger>
            <SelectContent>{PATENTES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5"><Label>Bio</Label><Textarea value={bio} onChange={(e) => setBio(e.target.value)} maxLength={300} className="bg-card" /></div>
        <Button variant="neon" disabled={salvando} onClick={salvar}>SALVAR</Button>
      </DialogContent>
    </Dialog>
  );
}

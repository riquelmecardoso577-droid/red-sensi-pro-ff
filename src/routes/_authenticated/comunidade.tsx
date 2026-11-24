import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Crown, Loader2, Plus, Shield, Swords, Trophy } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Logo } from "@/components/app/Logo";
import { UserAvatar } from "@/components/app/UserAvatar";
import { VerifiedBadge } from "@/components/app/VerifiedBadge";
import { useEuId } from "@/hooks/use-app";
import { hojeBrasilia } from "@/lib/idade";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/comunidade")({
  head: () => ({
    meta: [
      { title: "Comunidade — RED SENSI PRO FF" },
      { name: "description", content: "Ranking de capa do dia, clãs e desafios da comunidade Free Fire." },
      { property: "og:title", content: "Comunidade — RED SENSI PRO FF" },
      { property: "og:description", content: "Ranking de capa, clãs e desafios." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Comunidade,
});

function Comunidade() {
  return (
    <div className="mx-auto max-w-lg">
      <header className="sticky top-0 z-30 flex items-end justify-between border-b border-border bg-background/90 px-4 py-2 backdrop-blur-md">
        <Logo size="sm" />
        <span className="font-display text-xl uppercase text-muted-foreground">Comunidade</span>
      </header>
      <Tabs defaultValue="ranking" className="p-4">
        <TabsList className="grid w-full grid-cols-3 bg-card">
          <TabsTrigger value="ranking" className="font-display text-lg uppercase data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Ranking</TabsTrigger>
          <TabsTrigger value="clas" className="font-display text-lg uppercase data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Clãs</TabsTrigger>
          <TabsTrigger value="desafios" className="font-display text-lg uppercase data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Desafios</TabsTrigger>
        </TabsList>
        <TabsContent value="ranking"><Ranking /></TabsContent>
        <TabsContent value="clas"><Clas /></TabsContent>
        <TabsContent value="desafios"><Desafios /></TabsContent>
      </Tabs>
    </div>
  );
}

function Ranking() {
  const euId = useEuId();
  const hoje = hojeBrasilia();
  const { data = [], isLoading } = useQuery({
    queryKey: ["ranking-capa", hoje],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("usuarios")
        .select("id,nome,foto,nick_ff,patente,capas_hoje,verificado")
        .eq("capas_dia", hoje)
        .gt("capas_hoje", 0)
        .order("capas_hoje", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <div className="mt-4 space-y-2">
      <div className="rounded-xl border border-primary/40 bg-card p-3 text-sm text-muted-foreground">
        <Trophy className="mr-1 inline size-4 text-primary" /> Ranking de capas de <strong className="text-foreground">hoje</strong>. Atualize suas capas no{" "}
        <Link to="/perfil" className="text-primary underline">Perfil</Link>. Zera à meia-noite.
      </div>
      {isLoading && <Loader2 className="mx-auto my-6 animate-spin text-primary" />}
      {!isLoading && data.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">Ninguém marcou capa hoje. Seja o primeiro!</p>}
      {data.map((u, i) => (
        <Link
          key={u.id}
          to="/u/$id"
          params={{ id: u.id }}
          className={cn(
            "flex items-center gap-3 rounded-xl border bg-card p-3",
            i === 0 ? "border-primary neon-box" : "border-border",
            u.id === euId && "ring-1 ring-primary",
          )}
        >
          <span className={cn("w-7 text-center font-display text-3xl", i < 3 ? "neon-text" : "text-muted-foreground")}>{i + 1}</span>
          <UserAvatar foto={u.foto} nome={u.nome} className="size-11" />
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1 truncate font-semibold">
              {i === 0 && <Crown className="size-4 text-warning" />}
              <span className="truncate">{u.nome}</span>
              {u.verificado && <VerifiedBadge />}
            </p>
            <p className="truncate text-xs text-muted-foreground">{u.nick_ff} · {u.patente}</p>
          </div>
          <div className="text-right">
            <p className="font-display text-3xl leading-none">{u.capas_hoje}</p>
            <p className="text-[10px] uppercase text-muted-foreground">capas</p>
          </div>
        </Link>
      ))}
    </div>
  );
}

function Clas() {
  const euId = useEuId();
  const qc = useQueryClient();
  const [criar, setCriar] = useState(false);
  const { data: clas = [], isLoading } = useQuery({
    queryKey: ["clas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clas")
        .select("id,nome,tag,descricao,lider_id,lider:usuarios(nome),cla_membros(count)")
        .order("created_at");
      if (error) throw error;
      return (data ?? []) as unknown as { id: string; nome: string; tag: string; descricao: string; lider_id: string | null; lider: { nome: string } | null; cla_membros: { count: number }[] }[];
    },
  });
  const { data: meuCla } = useQuery({
    queryKey: ["meu-cla", euId],
    queryFn: async () => {
      const { data } = await supabase.from("cla_membros").select("cla_id").eq("usuario_id", euId).maybeSingle();
      return data?.cla_id ?? null;
    },
  });

  const entrar = useMutation({
    mutationFn: async (claId: string | null) => {
      await supabase.from("cla_membros").delete().eq("usuario_id", euId);
      if (claId) {
        const { error } = await supabase.from("cla_membros").insert({ cla_id: claId });
        if (error) throw error;
      }
    },
    onSuccess: (_d, claId) => {
      toast.success(claId ? "Você entrou no clã!" : "Você saiu do clã.");
      qc.invalidateQueries({ queryKey: ["clas"] });
      qc.invalidateQueries({ queryKey: ["meu-cla", euId] });
    },
    onError: () => toast.error("Não foi possível agora."),
  });

  return (
    <div className="mt-4 space-y-3">
      <Button variant="neonOutline" className="w-full" onClick={() => setCriar(true)}><Plus /> CRIAR CLÃ</Button>
      {isLoading && <Loader2 className="mx-auto my-6 animate-spin text-primary" />}
      {clas.map((c) => {
        const membro = meuCla === c.id;
        return (
          <div key={c.id} className={cn("rounded-xl border bg-card p-4", membro ? "border-primary" : "border-border")}>
            <div className="flex items-start gap-3">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-red-gradient font-display text-lg text-primary-foreground">
                {c.tag || <Shield className="size-5" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-display text-2xl uppercase leading-none">{c.nome}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {c.cla_membros[0]?.count ?? 0} membros{c.lider ? ` · líder ${c.lider.nome}` : ""}
                </p>
              </div>
            </div>
            {c.descricao && <p className="mt-3 text-sm text-muted-foreground">{c.descricao}</p>}
            <Button
              size="sm"
              variant={membro ? "secondary" : "default"}
              className="mt-3 w-full"
              disabled={entrar.isPending}
              onClick={() => entrar.mutate(membro ? null : c.id)}
            >
              {membro ? "Sair do clã" : meuCla ? "Trocar para esse clã" : "Entrar no clã"}
            </Button>
          </div>
        );
      })}
      <CriarCla aberto={criar} onOpenChange={setCriar} />
    </div>
  );
}

function CriarCla({ aberto, onOpenChange }: { aberto: boolean; onOpenChange: (v: boolean) => void }) {
  const euId = useEuId();
  const qc = useQueryClient();
  const [nome, setNome] = useState("");
  const [tag, setTag] = useState("");
  const [desc, setDesc] = useState("");
  const m = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("clas").insert({ nome: nome.trim(), tag: tag.trim().toUpperCase().slice(0, 6), descricao: desc.trim(), lider_id: euId });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Clã criado! Você é o líder.");
      setNome(""); setTag(""); setDesc("");
      onOpenChange(false);
      qc.invalidateQueries({ queryKey: ["clas"] });
      qc.invalidateQueries({ queryKey: ["meu-cla", euId] });
    },
    onError: (e: { code?: string }) => toast.error(e.code === "23505" ? "Já existe um clã com esse nome." : "Não foi possível criar."),
  });
  return (
    <Dialog open={aberto} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm border-border bg-popover">
        <DialogHeader><DialogTitle className="font-display text-3xl uppercase">Novo clã</DialogTitle></DialogHeader>
        <Input placeholder="Nome do clã" value={nome} onChange={(e) => setNome(e.target.value)} maxLength={40} className="bg-card" />
        <Input placeholder="TAG (até 6)" value={tag} onChange={(e) => setTag(e.target.value)} maxLength={6} className="bg-card uppercase" />
        <Textarea placeholder="Descrição" value={desc} onChange={(e) => setDesc(e.target.value)} maxLength={300} className="bg-card" />
        <Button variant="neon" disabled={nome.trim().length < 2 || m.isPending} onClick={() => m.mutate()}>CRIAR</Button>
      </DialogContent>
    </Dialog>
  );
}

function Desafios() {
  const { data = [], isLoading } = useQuery({
    queryKey: ["desafios"],
    queryFn: async () => {
      const { data, error } = await supabase.from("desafios").select("*").order("termina_em", { ascending: true, nullsFirst: false });
      if (error) throw error;
      return data ?? [];
    },
  });
  return (
    <div className="mt-4 space-y-3">
      {isLoading && <Loader2 className="mx-auto my-6 animate-spin text-primary" />}
      {data.map((d) => {
        const acabou = d.termina_em ? new Date(d.termina_em) < new Date() : false;
        return (
          <div key={d.id} className={cn("relative overflow-hidden rounded-xl border bg-card p-4", acabou ? "border-border opacity-60" : "border-primary/60")}>
            <Swords className="absolute -right-3 -top-3 size-20 text-primary/10" />
            <p className="font-display text-2xl uppercase leading-none">{d.titulo}</p>
            <p className="mt-2 text-sm text-muted-foreground">{d.descricao}</p>
            {d.premio && <p className="mt-3 text-sm"><Trophy className="mr-1 inline size-4 text-warning" /> {d.premio}</p>}
            {d.termina_em && (
              <p className="mt-1 text-xs text-muted-foreground">
                {acabou ? "Encerrado" : `Termina em ${new Date(d.termina_em).toLocaleDateString("pt-BR")}`}
              </p>
            )}
          </div>
        );
      })}
      {!isLoading && data.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">Nenhum desafio ativo.</p>}
    </div>
  );
}

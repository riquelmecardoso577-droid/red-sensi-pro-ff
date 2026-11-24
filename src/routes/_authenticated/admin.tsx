import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ArrowLeft, Check, ExternalLink, Loader2, Pencil, Plus, ShieldAlert, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Logo } from "@/components/app/Logo";
import { UserAvatar } from "@/components/app/UserAvatar";
import { VerifiedBadge } from "@/components/app/VerifiedBadge";
import { useEuId, useIsAdmin } from "@/hooks/use-app";
import { useMidiaUrl } from "@/lib/midia";
import { formatarReais } from "@/lib/pix";
import { linkWhatsApp } from "@/lib/whatsapp";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Painel admin — RED SENSI PRO FF" },
      { name: "description", content: "Gerencie pedidos PIX, sensis, verificados, usuários e configurações." },
      { property: "og:title", content: "Painel admin — RED SENSI PRO FF" },
      { property: "og:description", content: "Painel de administração." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Admin,
});

type Status = "pendente" | "aprovado" | "reprovado";

const corStatus: Record<Status, string> = {
  pendente: "border-warning/60 text-warning",
  aprovado: "border-success/60 text-success",
  reprovado: "border-destructive/60 text-destructive",
};

function StatusTag({ s }: { s: string }) {
  return <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase", corStatus[s as Status])}>{s}</span>;
}

const abaCls = "font-display text-base uppercase data-[state=active]:bg-primary data-[state=active]:text-primary-foreground";

function Admin() {
  const euId = useEuId();
  const qc = useQueryClient();
  const { data: souAdmin, isLoading } = useIsAdmin(euId);
  const { data: existeAdmin } = useQuery({
    queryKey: ["existe-admin"],
    enabled: souAdmin === false,
    queryFn: async () => (await supabase.rpc("existe_admin")).data ?? true,
  });
  const reivindicar = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc("reivindicar_admin");
      if (error) throw error;
      return data;
    },
    onSuccess: (ok) => {
      if (ok) toast.success("Agora você é o admin!");
      else toast.error("Já existe um admin.");
      qc.invalidateQueries({ queryKey: ["is-admin", euId] });
      qc.invalidateQueries({ queryKey: ["existe-admin"] });
    },
  });

  if (isLoading) return <Loader2 className="mx-auto mt-20 animate-spin text-primary" />;

  if (!souAdmin) {
    return (
      <div className="mx-auto max-w-md p-8 text-center">
        <ShieldAlert className="mx-auto size-12 text-primary" />
        <h1 className="mt-3 font-display text-4xl uppercase">Área do admin</h1>
        {existeAdmin === false ? (
          <>
            <p className="mt-2 text-sm text-muted-foreground">Ainda não existe admin. A primeira conta que ativar vira a dona do painel.</p>
            <Button variant="neon" size="xl" className="mt-6 w-full" disabled={reivindicar.isPending} onClick={() => reivindicar.mutate()}>
              ATIVAR MINHA CONTA COMO ADMIN
            </Button>
          </>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">Sua conta não tem acesso a esta área.</p>
        )}
        <Button asChild variant="ghost" className="mt-4"><Link to="/inicio">Voltar ao app</Link></Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl pb-10">
      <header className="sticky top-0 z-30 flex items-center gap-2 border-b border-border bg-background/90 px-3 py-2 backdrop-blur-md">
        <Button asChild size="icon" variant="ghost" aria-label="Voltar"><Link to="/perfil"><ArrowLeft /></Link></Button>
        <Logo size="sm" />
        <span className="ml-auto font-display text-xl uppercase text-primary">Admin</span>
      </header>
      <Tabs defaultValue="pedidos" className="p-3">
        <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 bg-card p-1">
          <TabsTrigger value="pedidos" className={abaCls}>Pedidos</TabsTrigger>
          <TabsTrigger value="verificados" className={abaCls}>Verificados</TabsTrigger>
          <TabsTrigger value="sensis" className={abaCls}>Sensis</TabsTrigger>
          <TabsTrigger value="usuarios" className={abaCls}>Usuários</TabsTrigger>
          <TabsTrigger value="desafios" className={abaCls}>Desafios</TabsTrigger>
          <TabsTrigger value="config" className={abaCls}>PIX/WhatsApp</TabsTrigger>
        </TabsList>
        <TabsContent value="pedidos"><Pedidos /></TabsContent>
        <TabsContent value="verificados"><Verificados /></TabsContent>
        <TabsContent value="sensis"><Sensis /></TabsContent>
        <TabsContent value="usuarios"><Usuarios /></TabsContent>
        <TabsContent value="desafios"><DesafiosAdmin /></TabsContent>
        <TabsContent value="config"><Config /></TabsContent>
      </Tabs>
    </div>
  );
}

function FiltroStatus({ valor, onChange }: { valor: Status | "todos"; onChange: (v: Status | "todos") => void }) {
  return (
    <div className="flex gap-1.5 overflow-x-auto scrollbar-none">
      {(["pendente", "aprovado", "reprovado", "todos"] as const).map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onChange(s)}
          className={cn("rounded-full border px-3 py-1 text-xs font-semibold uppercase", valor === s ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground")}
        >
          {s}
        </button>
      ))}
    </div>
  );
}

/* ---------- PEDIDOS ---------- */
function Pedidos() {
  const qc = useQueryClient();
  const [filtro, setFiltro] = useState<Status | "todos">("pendente");
  const { data = [], isLoading } = useQuery({
    queryKey: ["admin-pedidos", filtro],
    queryFn: async () => {
      let q = supabase
        .from("pedidos")
        .select("id,status,valor,whatsapp_cliente,created_at,sensi:sensis(modelo,marca),cliente:usuarios(nome,nick_ff)")
        .order("created_at", { ascending: false })
        .limit(200);
      if (filtro !== "todos") q = q.eq("status", filtro);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as unknown as { id: string; status: Status; valor: number; whatsapp_cliente: string; created_at: string; sensi: { modelo: string; marca: string } | null; cliente: { nome: string; nick_ff: string } | null }[];
    },
  });
  const { data: totais } = useQuery({
    queryKey: ["admin-pedidos-totais"],
    queryFn: async () => {
      const { data } = await supabase.from("pedidos").select("status,valor").limit(5000);
      const t = { pendente: 0, aprovado: 0, receita: 0 };
      for (const p of data ?? []) {
        if (p.status === "pendente") t.pendente++;
        if (p.status === "aprovado") { t.aprovado++; t.receita += Number(p.valor); }
      }
      return t;
    },
  });
  const decidir = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: Status }) => {
      const { error } = await supabase.from("pedidos").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_d, v) => {
      toast.success(v.status === "aprovado" ? "Pedido aprovado — sensi liberada." : "Pedido reprovado.");
      qc.invalidateQueries({ queryKey: ["admin-pedidos"] });
      qc.invalidateQueries({ queryKey: ["admin-pedidos-totais"] });
    },
    onError: () => toast.error("Falha ao atualizar."),
  });

  return (
    <div className="mt-3 space-y-3">
      <div className="grid grid-cols-3 gap-2">
        <Kpi titulo="Pendentes" valor={String(totais?.pendente ?? "–")} destaque />
        <Kpi titulo="Aprovados" valor={String(totais?.aprovado ?? "–")} />
        <Kpi titulo="Receita" valor={totais ? formatarReais(totais.receita) : "–"} />
      </div>
      <FiltroStatus valor={filtro} onChange={setFiltro} />
      {isLoading && <Loader2 className="mx-auto animate-spin text-primary" />}
      {!isLoading && data.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">Nenhum pedido aqui.</p>}
      {data.map((p) => (
        <div key={p.id} className="rounded-xl border border-border bg-card p-3">
          <div className="flex items-center justify-between gap-2">
            <p className="font-display text-xl uppercase leading-none">{p.sensi?.modelo ?? "Sensi removida"}</p>
            <StatusTag s={p.status} />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {p.cliente?.nome} ({p.cliente?.nick_ff}) · {formatarReais(Number(p.valor))} · {new Date(p.created_at).toLocaleString("pt-BR")}
          </p>
          <a href={linkWhatsApp(p.whatsapp_cliente, "Fala! Sobre seu pedido no RED SENSI PRO FF:")} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-sm text-primary">
            WhatsApp {p.whatsapp_cliente} <ExternalLink className="size-3" />
          </a>
          <div className="mt-3 grid grid-cols-2 gap-2">
              <Button size="sm" className="bg-success text-background hover:bg-success/90" disabled={p.status === "aprovado" || decidir.isPending} onClick={() => decidir.mutate({ id: p.id, status: "aprovado" })}>
                <Check /> APROVAR
              </Button>
              <Button size="sm" variant="destructive" disabled={p.status === "reprovado" || decidir.isPending} onClick={() => decidir.mutate({ id: p.id, status: "reprovado" })}>
                <X /> REPROVAR
              </Button>
            </div>
        </div>
      ))}
    </div>
  );
}

function Kpi({ titulo, valor, destaque }: { titulo: string; valor: string; destaque?: boolean }) {
  return (
    <div className={cn("rounded-xl border bg-card p-3", destaque ? "border-primary neon-box" : "border-border")}>
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{titulo}</p>
      <p className="font-display text-2xl leading-none">{valor}</p>
    </div>
  );
}

/* ---------- VERIFICADOS ---------- */
function PrintThumb({ caminho }: { caminho: string }) {
  const { data: url } = useMidiaUrl(caminho, "prints");
  if (!url) return <div className="size-20 animate-pulse rounded-lg bg-muted" />;
  return (
    <a href={url} target="_blank" rel="noreferrer" className="block size-20 shrink-0 overflow-hidden rounded-lg border border-border">
      <img src={url} alt="Print do perfil FF" className="size-full object-cover" />
    </a>
  );
}

function Verificados() {
  const qc = useQueryClient();
  const [filtro, setFiltro] = useState<Status | "todos">("pendente");
  const { data = [], isLoading } = useQuery({
    queryKey: ["admin-verificados", filtro],
    queryFn: async () => {
      let q = supabase
        .from("verificados")
        .select("id,id_ff,print_url,rede_social,arroba,status,created_at,usuario:usuarios(id,nome,idade,foto,nick_ff)")
        .order("created_at", { ascending: false })
        .limit(200);
      if (filtro !== "todos") q = q.eq("status", filtro);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as unknown as { id: string; id_ff: string; print_url: string; rede_social: string; arroba: string; status: Status; created_at: string; usuario: { id: string; nome: string; idade: number; foto: string | null; nick_ff: string } | null }[];
    },
  });
  const decidir = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: Status }) => {
      const { error } = await supabase.from("verificados").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_d, v) => {
      toast.success(v.status === "aprovado" ? "Selo azul liberado!" : "Pedido reprovado.");
      qc.invalidateQueries({ queryKey: ["admin-verificados"] });
      qc.invalidateQueries({ queryKey: ["admin-usuarios"] });
    },
    onError: () => toast.error("Falha ao atualizar."),
  });

  return (
    <div className="mt-3 space-y-3">
      <FiltroStatus valor={filtro} onChange={setFiltro} />
      {isLoading && <Loader2 className="mx-auto animate-spin text-primary" />}
      {!isLoading && data.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">Nenhum pedido de verificado.</p>}
      {data.map((v) => (
        <div key={v.id} className="rounded-xl border border-border bg-card p-3">
          <div className="flex gap-3">
            <PrintThumb caminho={v.print_url} />
            <div className="min-w-0 flex-1 text-sm">
              <div className="flex items-center justify-between gap-2">
                <p className="truncate font-semibold">{v.usuario?.nome}</p>
                <StatusTag s={v.status} />
              </div>
              <p className="text-muted-foreground">Idade: <span className="text-foreground">{v.usuario?.idade} anos</span></p>
              <p className="text-muted-foreground">ID FF: <span className="text-foreground">{v.id_ff}</span></p>
              <p className="text-muted-foreground">{v.rede_social}: <span className="text-foreground">{v.arroba}</span></p>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Button size="sm" className="bg-success text-background hover:bg-success/90" disabled={v.status === "aprovado" || decidir.isPending} onClick={() => decidir.mutate({ id: v.id, status: "aprovado" })}>
              <Check /> APROVAR
            </Button>
            <Button size="sm" variant="destructive" disabled={v.status === "reprovado" || decidir.isPending} onClick={() => decidir.mutate({ id: v.id, status: "reprovado" })}>
              <X /> REPROVAR
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ---------- SENSIS ---------- */
type Sensi = Tables<"sensis">;
const CAMPOS_NUM = [
  ["geral", "Geral"],
  ["vermelho", "Ponto Vermelho"],
  ["mira2x", "Mira 2x"],
  ["mira4x", "Mira 4x"],
  ["awm", "AWM"],
  ["olhadinha", "Olhadinha"],
  ["botao", "Botão"],
  ["dpi", "DPI"],
] as const;

function Sensis() {
  const qc = useQueryClient();
  const [editando, setEditando] = useState<Partial<Sensi> | null>(null);
  const { data = [], isLoading } = useQuery({
    queryKey: ["admin-sensis"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_listar_sensis");
      if (error) throw error;
      return (data ?? []) as Sensi[];
    },
  });
  const apagar = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("sensis").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Sensi apagada.");
      qc.invalidateQueries({ queryKey: ["admin-sensis"] });
      qc.invalidateQueries({ queryKey: ["sensis-loja"] });
    },
  });

  return (
    <div className="mt-3 space-y-2">
      <Button variant="neonOutline" className="w-full" onClick={() => setEditando({ marca: "Universal", preco: 7.9, destaque: false })}>
        <Plus /> NOVA SENSI
      </Button>
      {isLoading && <Loader2 className="mx-auto animate-spin text-primary" />}
      {data.map((s) => (
        <div key={s.id} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
          <div className="min-w-0 flex-1">
            <p className="font-display text-xl uppercase leading-none">{s.modelo} {s.destaque && <span className="text-primary">★</span>}</p>
            <p className="truncate text-xs text-muted-foreground">
              {s.marca} · {formatarReais(Number(s.preco))} · G{s.geral} PV{s.vermelho} 2x{s.mira2x} 4x{s.mira4x} AWM{s.awm} OL{s.olhadinha} DPI{s.dpi}
            </p>
          </div>
          <Button size="icon" variant="ghost" aria-label="Editar" onClick={() => setEditando(s)}><Pencil /></Button>
          <Button size="icon" variant="ghost" aria-label="Apagar" onClick={() => confirm(`Apagar ${s.modelo}?`) && apagar.mutate(s.id)}><Trash2 /></Button>
        </div>
      ))}
      <EditarSensi sensi={editando} onClose={() => setEditando(null)} />
    </div>
  );
}

function EditarSensi({ sensi, onClose }: { sensi: Partial<Sensi> | null; onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState<Partial<Sensi>>({});
  useEffect(() => setForm(sensi ?? {}), [sensi]);
  const salvar = useMutation({
    mutationFn: async () => {
      const dados = {
        marca: String(form.marca ?? "").trim(),
        modelo: String(form.modelo ?? "").trim(),
        preco: Number(form.preco ?? 7.9),
        destaque: !!form.destaque,
        ...Object.fromEntries(CAMPOS_NUM.map(([k]) => [k, Number(form[k] ?? 0)])),
      } as Omit<Sensi, "id" | "created_at">;
      if (!dados.marca || !dados.modelo) throw new Error("Preencha marca e nome.");
      const { error } = form.id
        ? await supabase.from("sensis").update(dados).eq("id", form.id)
        : await supabase.from("sensis").insert(dados);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Sensi salva!");
      qc.invalidateQueries({ queryKey: ["admin-sensis"] });
      qc.invalidateQueries({ queryKey: ["sensis-loja"] });
      onClose();
    },
    onError: (e: Error) => toast.error(e.message || "Falha ao salvar."),
  });

  return (
    <Dialog open={!!sensi} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[92dvh] max-w-md overflow-y-auto border-border bg-popover">
        <DialogHeader><DialogTitle className="font-display text-3xl uppercase">{form.id ? "Editar sensi" : "Nova sensi"}</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2 space-y-1"><Label>Nome</Label><Input value={form.modelo ?? ""} onChange={(e) => setForm({ ...form, modelo: e.target.value })} className="bg-card" /></div>
          <div className="space-y-1">
            <Label>Marca</Label>
            <select value={form.marca ?? "Universal"} onChange={(e) => setForm({ ...form, marca: e.target.value })} className="h-9 w-full rounded-md border border-input bg-card px-2 text-sm">
              {["Samsung", "Motorola", "Xiaomi", "iPhone", "Universal", "Xit"].map((m) => <option key={m}>{m}</option>)}
            </select>
          </div>
          <div className="space-y-1"><Label>Preço (R$)</Label><Input type="number" step="0.01" value={form.preco ?? 7.9} onChange={(e) => setForm({ ...form, preco: Number(e.target.value) })} className="bg-card" /></div>
          {CAMPOS_NUM.map(([k, l]) => (
            <div key={k} className="space-y-1">
              <Label>{l}</Label>
              <Input type="number" value={form[k] ?? 0} onChange={(e) => setForm({ ...form, [k]: Number(e.target.value) })} className="bg-card" />
            </div>
          ))}
          <label className="col-span-2 flex items-center justify-between rounded-lg border border-border p-3 text-sm">
            Destaque na loja <Switch checked={!!form.destaque} onCheckedChange={(v) => setForm({ ...form, destaque: v })} />
          </label>
        </div>
        <Button variant="neon" disabled={salvar.isPending} onClick={() => salvar.mutate()}>SALVAR</Button>
      </DialogContent>
    </Dialog>
  );
}

/* ---------- USUÁRIOS ---------- */
function Usuarios() {
  const [busca, setBusca] = useState("");
  const { data = [], isLoading } = useQuery({
    queryKey: ["admin-usuarios"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_listar_usuarios");
      if (error) throw error;
      return data ?? [];
    },
  });
  const lista = data.filter((u) => `${u.nome} ${u.nick_ff}`.toLowerCase().includes(busca.toLowerCase()));
  return (
    <div className="mt-3 space-y-2">
      <Input placeholder="Buscar por nome ou nick" value={busca} onChange={(e) => setBusca(e.target.value)} className="bg-card" />
      <p className="text-xs text-muted-foreground">{data.length} usuários</p>
      {isLoading && <Loader2 className="mx-auto animate-spin text-primary" />}
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[560px] text-sm">
          <thead className="bg-card text-left text-xs uppercase text-muted-foreground">
            <tr><th className="p-2">Nome</th><th className="p-2">Idade</th><th className="p-2">Nascimento</th><th className="p-2">Nick FF</th><th className="p-2">WhatsApp</th></tr>
          </thead>
          <tbody>
            {lista.map((u) => (
              <tr key={u.id} className="border-t border-border">
                <td className="p-2">
                  <span className="flex items-center gap-2">
                    <UserAvatar foto={u.foto} nome={u.nome} className="size-7" />
                    {u.nome} {u.verificado && <VerifiedBadge />}
                  </span>
                </td>
                <td className="p-2">{u.idade}</td>
                <td className="p-2">{u.data_nascimento ? new Date(`${u.data_nascimento}T12:00:00`).toLocaleDateString("pt-BR") : "–"}</td>
                <td className="p-2">{u.nick_ff}</td>
                <td className="p-2">{u.whatsapp}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ---------- DESAFIOS ---------- */
function DesafiosAdmin() {
  const qc = useQueryClient();
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [premio, setPremio] = useState("");
  const [termina, setTermina] = useState("");
  const { data = [] } = useQuery({
    queryKey: ["desafios"],
    queryFn: async () => (await supabase.from("desafios").select("*").order("created_at", { ascending: false })).data ?? [],
  });
  const criar = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("desafios").insert({
        titulo: titulo.trim(),
        descricao: descricao.trim(),
        premio: premio.trim(),
        termina_em: termina ? new Date(`${termina}T23:59:00`).toISOString() : null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Desafio criado!");
      setTitulo(""); setDescricao(""); setPremio(""); setTermina("");
      qc.invalidateQueries({ queryKey: ["desafios"] });
    },
  });
  return (
    <div className="mt-3 space-y-3">
      <div className="space-y-2 rounded-xl border border-border bg-card p-3">
        <Input placeholder="Título" value={titulo} onChange={(e) => setTitulo(e.target.value)} className="bg-background" />
        <Textarea placeholder="Descrição" value={descricao} onChange={(e) => setDescricao(e.target.value)} className="bg-background" />
        <Input placeholder="Prêmio" value={premio} onChange={(e) => setPremio(e.target.value)} className="bg-background" />
        <Input type="date" value={termina} onChange={(e) => setTermina(e.target.value)} className="bg-background" />
        <Button className="w-full" disabled={titulo.trim().length < 3 || criar.isPending} onClick={() => criar.mutate()}><Plus /> Criar desafio</Button>
      </div>
      {data.map((d) => (
        <div key={d.id} className="flex items-center gap-2 rounded-xl border border-border bg-card p-3">
          <div className="min-w-0 flex-1">
            <p className="font-semibold">{d.titulo}</p>
            <p className="truncate text-xs text-muted-foreground">{d.premio}</p>
          </div>
          <Button
            size="icon"
            variant="ghost"
            aria-label="Apagar"
            onClick={async () => {
              await supabase.from("desafios").delete().eq("id", d.id);
              qc.invalidateQueries({ queryKey: ["desafios"] });
            }}
          >
            <Trash2 />
          </Button>
        </div>
      ))}
    </div>
  );
}

/* ---------- CONFIG ---------- */
function Config() {
  const qc = useQueryClient();
  const { data: config } = useQuery({
    queryKey: ["config"],
    queryFn: async () => (await supabase.from("config").select("*").eq("id", 1).maybeSingle()).data,
  });
  const [form, setForm] = useState({ chave_pix: "", nome_recebedor: "", cidade: "", whatsapp: "" });
  useEffect(() => {
    if (config) setForm({ chave_pix: config.chave_pix, nome_recebedor: config.nome_recebedor, cidade: config.cidade, whatsapp: config.whatsapp });
  }, [config]);
  const salvar = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("config").update({ ...form, updated_at: new Date().toISOString() }).eq("id", 1);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Configurações salvas!");
      qc.invalidateQueries({ queryKey: ["config"] });
      qc.invalidateQueries({ queryKey: ["config-checkout"] });
    },
    onError: () => toast.error("Falha ao salvar."),
  });
  return (
    <div className="mt-3 space-y-3 rounded-xl border border-border bg-card p-4">
      <div className="space-y-1"><Label>Chave PIX</Label><Input value={form.chave_pix} onChange={(e) => setForm({ ...form, chave_pix: e.target.value })} placeholder="CPF, e-mail, telefone (+55...) ou aleatória" className="bg-background" /></div>
      <div className="space-y-1"><Label>Nome do recebedor</Label><Input value={form.nome_recebedor} onChange={(e) => setForm({ ...form, nome_recebedor: e.target.value })} maxLength={25} className="bg-background" /></div>
      <div className="space-y-1"><Label>Cidade</Label><Input value={form.cidade} onChange={(e) => setForm({ ...form, cidade: e.target.value })} maxLength={15} className="bg-background" /></div>
      <div className="space-y-1"><Label>WhatsApp que recebe os comprovantes</Label><Input value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} placeholder="(11) 99999-9999" className="bg-background" /></div>
      <Button variant="neon" className="w-full" disabled={salvar.isPending} onClick={() => salvar.mutate()}>SALVAR</Button>
    </div>
  );
}

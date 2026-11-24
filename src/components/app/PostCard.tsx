import { Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { formatDistanceToNowStrict } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Heart, Loader2, MessageCircle, Send, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { UserAvatar } from "./UserAvatar";
import { VerifiedBadge } from "./VerifiedBadge";
import { Midia } from "./Midia";
import { AUTOR_COLS, type Autor } from "@/hooks/use-app";
import { cn } from "@/lib/utils";

export interface PostFeed {
  id: string;
  foto_video: string;
  tipo: "foto" | "video";
  legenda: string;
  curtidas: number;
  created_at: string;
  usuario_id: string;
  autor: Autor | null;
  comentarios: { count: number }[];
  curtido: boolean;
}

export function tempoAtras(data: string) {
  return formatDistanceToNowStrict(new Date(data), { locale: ptBR, addSuffix: true });
}

export function NomeAutor({ autor, className }: { autor: Autor | null; className?: string }) {
  if (!autor) return <span className={className}>Jogador</span>;
  return (
    <Link to="/u/$id" params={{ id: autor.id }} className={cn("inline-flex items-center gap-1 font-semibold", className)}>
      <span className="truncate">{autor.nome}</span>
      {autor.verificado && <VerifiedBadge />}
    </Link>
  );
}

export function SeguirBotao({ euId, alvoId, seguindo }: { euId: string; alvoId: string; seguindo: boolean }) {
  const qc = useQueryClient();
  const m = useMutation({
    mutationFn: async () => {
      if (seguindo) {
        const { error } = await supabase.from("seguidores").delete().eq("seguidor_id", euId).eq("seguido_id", alvoId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("seguidores").insert({ seguido_id: alvoId });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["seguindo", euId] });
      qc.invalidateQueries({ queryKey: ["contagem-social", alvoId] });
    },
    onError: () => toast.error("Não deu pra seguir agora."),
  });
  if (euId === alvoId) return null;
  return (
    <Button
      size="sm"
      variant={seguindo ? "secondary" : "neonOutline"}
      className={seguindo ? "" : "h-7 px-3 text-base"}
      disabled={m.isPending}
      onClick={() => m.mutate()}
    >
      {seguindo ? "Seguindo" : "Seguir"}
    </Button>
  );
}

export function PostCard({ post, euId, seguindo, souAdmin }: { post: PostFeed; euId: string; seguindo: boolean; souAdmin?: boolean }) {
  const qc = useQueryClient();
  const [curtido, setCurtido] = useState(post.curtido);
  const [total, setTotal] = useState(post.curtidas);
  const [coracao, setCoracao] = useState(0);
  const [comentariosAbertos, setComentariosAbertos] = useState(false);
  const ultimoToque = useRef(0);
  const nComentarios = post.comentarios[0]?.count ?? 0;

  async function alternarCurtida(forcarCurtir = false) {
    if (forcarCurtir && curtido) return;
    const novo = !curtido;
    setCurtido(novo);
    setTotal((t) => t + (novo ? 1 : -1));
    const { error } = novo
      ? await supabase.from("curtidas_posts").insert({ post_id: post.id })
      : await supabase.from("curtidas_posts").delete().eq("post_id", post.id).eq("usuario_id", euId);
    if (error && error.code !== "23505") {
      setCurtido(!novo);
      setTotal((t) => t + (novo ? -1 : 1));
    }
  }

  function toqueDuplo() {
    const agora = Date.now();
    if (agora - ultimoToque.current < 300) {
      setCoracao((n) => n + 1);
      alternarCurtida(true);
    }
    ultimoToque.current = agora;
  }

  async function apagar() {
    const { error } = await supabase.from("posts").delete().eq("id", post.id);
    if (error) return void toast.error("Não foi possível apagar.");
    toast.success("Post apagado.");
    qc.invalidateQueries({ queryKey: ["feed"] });
    qc.invalidateQueries({ queryKey: ["posts-usuario", post.usuario_id] });
  }

  return (
    <article className="border-b border-border pb-3">
      <header className="flex items-center gap-3 px-4 py-3">
        <UserAvatar foto={post.autor?.foto} nome={post.autor?.nome ?? "?"} className="size-9" />
        <div className="min-w-0 flex-1">
          <NomeAutor autor={post.autor} className="max-w-full text-sm" />
          <p className="truncate text-xs text-muted-foreground">
            {post.autor?.nick_ff ? `${post.autor.nick_ff} · ` : ""}
            {tempoAtras(post.created_at)}
          </p>
        </div>
        <SeguirBotao euId={euId} alvoId={post.usuario_id} seguindo={seguindo} />
        {(post.usuario_id === euId || souAdmin) && (
          <Button size="icon" variant="ghost" aria-label="Apagar post" onClick={apagar}>
            <Trash2 />
          </Button>
        )}
      </header>

      <div className="relative bg-card" onClick={post.tipo === "foto" ? toqueDuplo : undefined}>
        <Midia caminho={post.foto_video} tipo={post.tipo} className="aspect-square w-full" />
        {coracao > 0 && (
          <Heart key={coracao} className="pointer-events-none absolute left-1/2 top-1/2 size-24 -translate-x-1/2 -translate-y-1/2 fill-primary text-primary animate-heart-pop" />
        )}
      </div>

      <div className="flex items-center gap-4 px-4 pt-3">
        <button type="button" aria-label="Curtir" onClick={() => alternarCurtida()} className="flex items-center gap-1.5">
          <Heart className={cn("size-6 transition-transform active:scale-125", curtido ? "fill-primary text-primary" : "")} />
          <span className="text-sm font-semibold">{total}</span>
        </button>
        <button type="button" aria-label="Comentar" onClick={() => setComentariosAbertos(true)} className="flex items-center gap-1.5">
          <MessageCircle className="size-6" />
          <span className="text-sm font-semibold">{nComentarios}</span>
        </button>
      </div>
      {post.legenda && (
        <p className="px-4 pt-2 text-sm">
          <span className="mr-1.5 font-semibold">{post.autor?.nome}</span>
          {post.legenda}
        </p>
      )}
      {nComentarios > 0 && (
        <button type="button" onClick={() => setComentariosAbertos(true)} className="px-4 pt-1 text-sm text-muted-foreground">
          Ver {nComentarios === 1 ? "1 comentário" : `os ${nComentarios} comentários`}
        </button>
      )}
      <Comentarios postId={post.id} euId={euId} aberto={comentariosAbertos} onOpenChange={setComentariosAbertos} />
    </article>
  );
}

interface Comentario {
  id: string;
  texto: string;
  created_at: string;
  usuario_id: string;
  autor: Autor | null;
}

function Comentarios({ postId, euId, aberto, onOpenChange }: { postId: string; euId: string; aberto: boolean; onOpenChange: (v: boolean) => void }) {
  const qc = useQueryClient();
  const [texto, setTexto] = useState("");
  const { data, isLoading } = useQuery({
    queryKey: ["comentarios", postId],
    enabled: aberto,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("comentarios")
        .select(`id,texto,created_at,usuario_id,autor:usuarios(${AUTOR_COLS})`)
        .eq("post_id", postId)
        .order("created_at", { ascending: true })
        .limit(200);
      if (error) throw error;
      return (data ?? []) as unknown as Comentario[];
    },
  });
  const enviar = useMutation({
    mutationFn: async () => {
      const t = texto.trim();
      if (!t) return;
      const { error } = await supabase.from("comentarios").insert({ post_id: postId, texto: t.slice(0, 500) });
      if (error) throw error;
    },
    onSuccess: () => {
      setTexto("");
      qc.invalidateQueries({ queryKey: ["comentarios", postId] });
      qc.invalidateQueries({ queryKey: ["feed"] });
    },
    onError: () => toast.error("Comentário não enviado."),
  });

  return (
    <Sheet open={aberto} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="flex max-h-[80dvh] flex-col rounded-t-2xl border-border bg-popover">
        <SheetHeader>
          <SheetTitle className="font-display text-2xl uppercase">Comentários</SheetTitle>
        </SheetHeader>
        <div className="flex-1 space-y-4 overflow-y-auto px-4">
          {isLoading && <Loader2 className="mx-auto animate-spin text-primary" />}
          {data?.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">Seja o primeiro a comentar.</p>}
          {data?.map((c) => (
            <div key={c.id} className="flex gap-3">
              <UserAvatar foto={c.autor?.foto} nome={c.autor?.nome ?? "?"} className="size-8 shrink-0" />
              <div className="min-w-0 text-sm">
                <NomeAutor autor={c.autor} className="text-sm" />{" "}
                <span className="text-xs text-muted-foreground">{tempoAtras(c.created_at)}</span>
                <p className="break-words">{c.texto}</p>
              </div>
              {c.usuario_id === euId && (
                <button
                  type="button"
                  aria-label="Apagar comentário"
                  className="ml-auto text-muted-foreground"
                  onClick={async () => {
                    await supabase.from("comentarios").delete().eq("id", c.id);
                    qc.invalidateQueries({ queryKey: ["comentarios", postId] });
                  }}
                >
                  <Trash2 className="size-4" />
                </button>
              )}
            </div>
          ))}
        </div>
        <form
          className="flex gap-2 border-t border-border p-4"
          onSubmit={(e) => {
            e.preventDefault();
            enviar.mutate();
          }}
        >
          <Input value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Escreva um comentário..." maxLength={500} className="bg-card" />
          <Button type="submit" size="icon" disabled={!texto.trim() || enviar.isPending} aria-label="Enviar">
            <Send />
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}

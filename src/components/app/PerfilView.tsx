import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Loader2, Play } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { UserAvatar } from "./UserAvatar";
import { VerifiedBadge } from "./VerifiedBadge";
import { Midia } from "./Midia";
import { PostCard, type PostFeed } from "./PostCard";
import { AUTOR_COLS, type Perfil } from "@/hooks/use-app";
import { capasDeHoje } from "@/lib/idade";

export function useContagemSocial(id: string) {
  return useQuery({
    queryKey: ["contagem-social", id],
    queryFn: async () => {
      const [seg, pst] = await Promise.all([
        supabase.rpc("contagem_seguidores", { _usuario_id: id }),
        supabase.from("posts").select("id", { count: "exact", head: true }).eq("usuario_id", id),
      ]);
      const linha = seg.data?.[0];
      return { seguidores: Number(linha?.seguidores ?? 0), seguindo: Number(linha?.seguindo ?? 0), posts: pst.count ?? 0 };
    },
  });
}

export function CabecalhoPerfil({ perfil, acoes }: { perfil: Perfil; acoes?: ReactNode }) {
  const { data: c } = useContagemSocial(perfil.id);
  const capas = capasDeHoje(perfil.capas_hoje, perfil.capas_dia);
  return (
    <section className="px-4 pt-5">
      <div className="flex items-center gap-5">
        <UserAvatar foto={perfil.foto} nome={perfil.nome} ring className="size-24 neon-box-lg" />
        <div className="grid flex-1 grid-cols-3 text-center">
          {[
            ["posts", c?.posts],
            ["seguidores", c?.seguidores],
            ["seguindo", c?.seguindo],
          ].map(([l, n]) => (
            <div key={l as string}>
              <p className="font-display text-3xl leading-none">{(n as number | undefined) ?? "–"}</p>
              <p className="text-xs text-muted-foreground">{l as string}</p>
            </div>
          ))}
        </div>
      </div>
      <h1 className="mt-4 flex items-center gap-1.5 text-xl font-bold">
        {perfil.nome} {perfil.verificado && <VerifiedBadge className="size-5" />}
      </h1>
      <p className="text-sm text-muted-foreground">
        {perfil.nick_ff} · {perfil.idade} anos
      </p>
      {perfil.bio && <p className="mt-2 whitespace-pre-line text-sm">{perfil.bio}</p>}
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-border bg-card p-3">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Patente</p>
          <p className="font-display text-2xl uppercase leading-none">{perfil.patente}</p>
        </div>
        <div className="rounded-xl border border-primary/50 bg-card p-3">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Capas hoje</p>
          <p className="font-display text-2xl leading-none neon-text">{capas}</p>
        </div>
      </div>
      {acoes && <div className="mt-4">{acoes}</div>}
    </section>
  );
}

export function GradePosts({ usuarioId, euId }: { usuarioId: string; euId: string }) {
  const [aberto, setAberto] = useState<PostFeed | null>(null);
  const { data = [], isLoading } = useQuery({
    queryKey: ["posts-usuario", usuarioId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("posts")
        .select(`id,foto_video,tipo,legenda,curtidas,created_at,usuario_id,autor:usuarios!posts_usuario_id_fkey(${AUTOR_COLS}),comentarios(count)`)
        .eq("usuario_id", usuarioId)
        .order("created_at", { ascending: false })
        .limit(60);
      if (error) throw error;
      return ((data ?? []) as unknown as Omit<PostFeed, "curtido">[]).map((p) => ({ ...p, curtido: false }));
    },
  });
  if (isLoading) return <Loader2 className="mx-auto my-8 animate-spin text-primary" />;
  if (data.length === 0) return <p className="py-10 text-center text-sm text-muted-foreground">Nenhum post ainda.</p>;
  return (
    <>
      <div className="grid grid-cols-3 gap-0.5">
        {data.map((p) => (
          <button key={p.id} type="button" className="relative aspect-square bg-card" onClick={() => setAberto(p)}>
            <Midia caminho={p.foto_video} tipo={p.tipo} className="size-full" controls={false} />
            {p.tipo === "video" && <Play className="absolute right-1.5 top-1.5 size-4 fill-foreground" />}
          </button>
        ))}
      </div>
      <Dialog open={!!aberto} onOpenChange={(v) => !v && setAberto(null)}>
        <DialogContent className="max-h-[92dvh] max-w-md overflow-y-auto border-border bg-background p-0">
          <DialogTitle className="sr-only">Post</DialogTitle>
          {aberto && <PostCard post={aberto} euId={euId} seguindo />}
        </DialogContent>
      </Dialog>
    </>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { Loader2, PlusSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/app/Logo";
import { PostCard, type PostFeed } from "@/components/app/PostCard";
import { StoriesBar } from "@/components/app/Stories";
import { NovoPost } from "@/components/app/NovoPost";
import { AUTOR_COLS, perfilQuery, useEuId, useIsAdmin, useSeguindo } from "@/hooks/use-app";

export const Route = createFileRoute("/_authenticated/inicio")({
  head: () => ({
    meta: [
      { title: "Início — RED SENSI PRO FF" },
      { name: "description", content: "Feed da comunidade Free Fire: stories, posts, curtidas e comentários." },
      { property: "og:title", content: "Início — RED SENSI PRO FF" },
      { property: "og:description", content: "Feed da comunidade Free Fire." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Inicio,
});

const POR_PAGINA = 10;

function Inicio() {
  const euId = useEuId();
  const { data: eu } = useQuery(perfilQuery(euId));
  const { data: seguindo } = useSeguindo(euId);
  const { data: souAdmin } = useIsAdmin(euId);
  const [novoPost, setNovoPost] = useState(false);

  const feed = useInfiniteQuery({
    queryKey: ["feed"],
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      const de = pageParam * POR_PAGINA;
      const { data, error } = await supabase
        .from("posts")
        .select(`id,foto_video,tipo,legenda,curtidas,created_at,usuario_id,autor:usuarios!posts_usuario_id_fkey(${AUTOR_COLS}),comentarios(count)`)
        .order("created_at", { ascending: false })
        .range(de, de + POR_PAGINA - 1);
      if (error) throw error;
      const lista = (data ?? []) as unknown as Omit<PostFeed, "curtido">[];
      let curtidos = new Set<string>();
      if (lista.length) {
        const { data: c } = await supabase
          .from("curtidas_posts")
          .select("post_id")
          .eq("usuario_id", euId)
          .in("post_id", lista.map((p) => p.id));
        curtidos = new Set((c ?? []).map((x) => x.post_id));
      }
      return {
        itens: lista.map((p) => ({ ...p, curtido: curtidos.has(p.id) })) as PostFeed[],
        proxima: lista.length === POR_PAGINA ? pageParam + 1 : undefined,
      };
    },
    getNextPageParam: (ultima) => ultima.proxima,
  });

  const sentinela = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = sentinela.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e?.isIntersecting && feed.hasNextPage && !feed.isFetchingNextPage) feed.fetchNextPage();
    }, { rootMargin: "400px" });
    obs.observe(el);
    return () => obs.disconnect();
  }, [feed]);

  const posts = feed.data?.pages.flatMap((p) => p.itens) ?? [];

  return (
    <div className="mx-auto max-w-lg">
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-background/90 px-4 py-2 backdrop-blur-md">
        <Logo size="sm" />
        <Button size="icon" variant="ghost" aria-label="Novo post" onClick={() => setNovoPost(true)}>
          <PlusSquare className="size-6! text-primary" />
        </Button>
      </header>

      {eu && <StoriesBar eu={eu} />}

      <div className="border-t border-border">
        {feed.isLoading && <Loader2 className="mx-auto my-10 animate-spin text-primary" />}
        {!feed.isLoading && posts.length === 0 && (
          <div className="px-6 py-16 text-center">
            <p className="font-display text-3xl uppercase">Feed vazio</p>
            <p className="mt-1 text-sm text-muted-foreground">Seja o primeiro a postar uma jogada.</p>
            <Button variant="neon" className="mt-5" onClick={() => setNovoPost(true)}>POSTAR AGORA</Button>
          </div>
        )}
        {posts.map((p) => (
          <PostCard key={p.id} post={p} euId={euId} seguindo={seguindo?.has(p.usuario_id) ?? false} souAdmin={!!souAdmin} />
        ))}
        <div ref={sentinela} className="py-6 text-center">
          {feed.isFetchingNextPage && <Loader2 className="mx-auto animate-spin text-primary" />}
          {feed.hasNextPage && !feed.isFetchingNextPage && (
            <Button variant="neonOutline" onClick={() => feed.fetchNextPage()}>CARREGAR MAIS</Button>
          )}
          {!feed.hasNextPage && posts.length > 0 && <p className="text-xs text-muted-foreground">Você viu tudo por enquanto 🔥</p>}
        </div>
      </div>
      <NovoPost euId={euId} aberto={novoPost} onOpenChange={setNovoPost} />
    </div>
  );
}

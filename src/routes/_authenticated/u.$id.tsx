import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CabecalhoPerfil, GradePosts } from "@/components/app/PerfilView";
import { SeguirBotao } from "@/components/app/PostCard";
import { perfilQuery, useEuId, useSeguindo } from "@/hooks/use-app";

export const Route = createFileRoute("/_authenticated/u/$id")({
  head: () => ({
    meta: [
      { title: "Perfil do jogador — RED SENSI PRO FF" },
      { name: "description", content: "Perfil de jogador de Free Fire no RED SENSI PRO FF." },
      { property: "og:title", content: "Perfil do jogador — RED SENSI PRO FF" },
      { property: "og:description", content: "Veja posts, patente e capas do jogador." },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PerfilJogador,
});

function PerfilJogador() {
  const { id } = Route.useParams();
  const euId = useEuId();
  const { data: perfil, isLoading } = useQuery(perfilQuery(id));
  const { data: seguindo } = useSeguindo(euId);

  if (id === euId) return <Navigate to="/perfil" replace />;
  if (isLoading) return <Loader2 className="mx-auto mt-20 animate-spin text-primary" />;
  if (!perfil) return <p className="p-10 text-center text-muted-foreground">Jogador não encontrado.</p>;

  return (
    <div className="mx-auto max-w-lg">
      <header className="sticky top-0 z-30 flex items-center gap-2 border-b border-border bg-background/90 px-2 py-2 backdrop-blur-md">
        <Button asChild size="icon" variant="ghost" aria-label="Voltar"><Link to="/inicio"><ArrowLeft /></Link></Button>
        <span className="truncate font-display text-xl uppercase">{perfil.nick_ff || perfil.nome}</span>
      </header>
      <CabecalhoPerfil
        perfil={perfil}
        acoes={
          <div className="[&>button]:h-10 [&>button]:w-full">
            <SeguirBotao euId={euId} alvoId={perfil.id} seguindo={seguindo?.has(perfil.id) ?? false} />
          </div>
        }
      />
      <div className="mt-5 border-t border-border">
        <GradePosts usuarioId={perfil.id} euId={euId} />
      </div>
    </div>
  );
}

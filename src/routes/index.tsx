import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Crosshair, Flame, ShieldCheck, Trophy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/app/Logo";
import { InstallButton } from "@/components/app/InstallButton";
import logoMark from "@/assets/logo-mark.png";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "RED SENSI PRO FF — Rede social gamer de Free Fire" },
      { name: "description", content: "Poste clipes, pegue as melhores sensis, suba no ranking de capa e entre em clãs de Free Fire." },
      { property: "og:title", content: "RED SENSI PRO FF" },
      { property: "og:description", content: "A rede social gamer de Free Fire: sensis, clipes, ranking de capa e clãs." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const destaques = [
  { Icon: Crosshair, titulo: "18 sensis PRO", texto: "Samsung, Motorola, Xiaomi, iPhone, Universal e Xit." },
  { Icon: Flame, titulo: "Clipes estilo TikTok", texto: "Desliza, curte e usa a sensi do vídeo." },
  { Icon: Trophy, titulo: "Ranking de capa", texto: "Mostre quantas capas fez hoje." },
  { Icon: ShieldCheck, titulo: "Selo verificado", texto: "Criador de conteúdo ganha o selo azul." },
];

function Landing() {
  const navigate = useNavigate();
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/inicio", replace: true });
    });
  }, [navigate]);

  return (
    <main className="relative min-h-dvh overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0 bg-grid-red opacity-60 [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" />
      <div className="relative mx-auto flex min-h-dvh max-w-md flex-col px-6 pb-10 pt-12">
        <img src={logoMark} alt="" className="mx-auto size-40 rounded-3xl neon-box-lg" />
        <Logo size="lg" className="mt-8 text-center" />
        <p className="mt-4 text-center text-muted-foreground">
          A rede social de quem vive Free Fire. Sensi, clipe, capa e clã num lugar só.
        </p>

        <div className="mt-8 grid grid-cols-2 gap-3">
          {destaques.map(({ Icon, titulo, texto }) => (
            <div key={titulo} className="rounded-xl border border-border bg-card p-3">
              <Icon className="size-5 text-primary" />
              <p className="mt-2 font-display text-lg uppercase leading-none">{titulo}</p>
              <p className="mt-1 text-xs text-muted-foreground">{texto}</p>
            </div>
          ))}
        </div>

        <div className="mt-auto flex flex-col gap-3 pt-10">
          <Button asChild variant="neon" size="xl">
            <Link to="/auth" search={{ modo: "cadastro" }}>CRIAR CONTA</Link>
          </Button>
          <Button asChild variant="neonOutline" size="xl">
            <Link to="/auth" search={{ modo: "entrar" }}>JÁ TENHO CONTA</Link>
          </Button>
          <InstallButton variant="ghost" size="xl" />
        </div>
      </div>
    </main>
  );
}

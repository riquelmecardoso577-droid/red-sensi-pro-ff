import { createFileRoute, Outlet, redirect, useLocation } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Camera, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { BottomNav } from "@/components/app/BottomNav";
import { Logo } from "@/components/app/Logo";
import { Button } from "@/components/ui/button";
import { perfilQuery } from "@/hooks/use-app";
import { enviarArquivo } from "@/lib/midia";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      throw redirect({ to: "/auth", search: { redirect: location.href } });
    }
    return { user: data.user };
  },
  component: AppShell,
});

function AppShell() {
  const { user } = Route.useRouteContext();
  const { data: perfil, isLoading } = useQuery(perfilQuery(user.id));
  const { pathname } = useLocation();

  if (isLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <Logo size="md" className="animate-pulse text-center" />
      </div>
    );
  }

  if (perfil && !perfil.foto) return <FotoObrigatoria userId={user.id} nome={perfil.nome} />;

  const semNav = pathname.startsWith("/admin");
  return (
    <div className={semNav ? "min-h-dvh" : "min-h-dvh pb-16"}>
      <Outlet />
      {!semNav && <BottomNav />}
    </div>
  );
}

function FotoObrigatoria({ userId, nome }: { userId: string; nome: string }) {
  const qc = useQueryClient();
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [enviando, setEnviando] = useState(false);
  const preview = arquivo ? URL.createObjectURL(arquivo) : null;

  async function salvar() {
    if (!arquivo) return;
    setEnviando(true);
    try {
      const caminho = await enviarArquivo("midia", userId, "avatar", arquivo);
      const { error } = await supabase.from("usuarios").update({ foto: caminho }).eq("id", userId);
      if (error) throw error;
      await qc.invalidateQueries({ queryKey: ["perfil", userId] });
      toast.success("Foto salva! Bem-vindo ao RED SENSI.");
    } catch {
      toast.error("Não foi possível enviar a foto. Tente outra imagem.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col px-6 pb-10 pt-12">
      <Logo size="md" className="text-center" />
      <p className="mt-10 text-xs uppercase tracking-widest text-muted-foreground">Passo 2 de 2</p>
      <h1 className="font-display text-4xl uppercase">Sua foto de perfil</h1>
      <p className="text-sm text-muted-foreground">Fala, {nome || "jogador"}! A foto é obrigatória para entrar na comunidade.</p>
      <label className="mx-auto mt-10 flex size-44 cursor-pointer items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-primary bg-card neon-box">
        {preview ? <img src={preview} alt="Prévia" className="size-full object-cover" /> : <Camera className="size-12 text-primary" />}
        <input type="file" accept="image/*" className="sr-only" onChange={(e) => setArquivo(e.target.files?.[0] ?? null)} />
      </label>
      <Button variant="neon" size="xl" className="mt-auto w-full" disabled={!arquivo || enviando} onClick={salvar}>
        {enviando && <Loader2 className="animate-spin" />} SALVAR E ENTRAR
      </Button>
    </main>
  );
}

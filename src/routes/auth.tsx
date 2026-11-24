import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type ComponentProps, type FormEvent } from "react";
import { toast } from "sonner";
import { mensagemErroAuth } from "@/lib/auth-erros";
import { Loader2, MailCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/app/Logo";
import { IDADE_MINIMA, idadePermitida } from "@/lib/idade";
import { whatsappValido } from "@/lib/whatsapp";
import { cn } from "@/lib/utils";

interface BuscaAuth {
  modo?: "entrar" | "cadastro";
  redirect?: string;
}

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>): BuscaAuth => ({
    ...(s["modo"] === "cadastro" || s["modo"] === "entrar" ? { modo: s["modo"] } : {}),
    ...(typeof s["redirect"] === "string" ? { redirect: s["redirect"] } : {}),
  }),
  head: () => ({
    meta: [
      { title: "Entrar ou criar conta — RED SENSI PRO FF" },
      { name: "description", content: "Crie sua conta no RED SENSI PRO FF com nome, nick do Free Fire e WhatsApp." },
      { property: "og:title", content: "Entrar no RED SENSI PRO FF" },
      { property: "og:description", content: "Crie sua conta gamer de Free Fire." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function destinoSeguro(r: string | undefined): string {
  if (!r) return "/inicio";
  try {
    const u = new URL(r, window.location.origin);
    if (u.origin !== window.location.origin) return "/inicio";
    return u.pathname + u.search;
  } catch {
    return "/inicio";
  }
}

function AuthPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const [modo, setModo] = useState<"entrar" | "cadastro">(search.modo ?? "entrar");
  const [carregando, setCarregando] = useState(false);
  const [confirmar, setConfirmar] = useState<string | null>(null);

  async function entrar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setCarregando(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: String(f.get("email")).trim(),
      password: String(f.get("senha")),
    });
    setCarregando(false);
    if (error) {
      toast.error(mensagemErroAuth(error, "entrar"));
      return;
    }
    navigate({ href: destinoSeguro(search.redirect), replace: true });
  }

  async function cadastrar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const nome = String(f.get("nome")).trim();
    const nascimento = String(f.get("nascimento"));
    const nick = String(f.get("nick")).trim();
    const whatsapp = String(f.get("whatsapp")).trim();
    const email = String(f.get("email")).trim();
    const senha = String(f.get("senha"));

    if (nome.length < 2) return void toast.error("Digite seu nome.");
    if (!nascimento) return void toast.error("Informe sua data de nascimento.");
    if (!idadePermitida(nascimento)) {
      return void toast.error(`Cadastro bloqueado: é preciso ter pelo menos ${IDADE_MINIMA} anos.`);
    }
    if (nick.length < 2) return void toast.error("Digite seu nick do Free Fire.");
    if (!whatsappValido(whatsapp)) return void toast.error("WhatsApp inválido. Use DDD + número.");
    if (senha.length < 6) return void toast.error("A senha precisa ter pelo menos 6 caracteres.");

    setCarregando(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password: senha,
      options: {
        emailRedirectTo: `${window.location.origin}/inicio`,
        data: { nome, data_nascimento: nascimento, nick_ff: nick, whatsapp },
      },
    });
    setCarregando(false);
    if (error) {
      toast.error(mensagemErroAuth(error, "cadastrar"));
      return;
    }
    if (data.session) {
      navigate({ to: "/inicio", replace: true });
    } else {
      setConfirmar(email);
    }
  }

  return (
    <main className="min-h-dvh bg-background">
      <div className="mx-auto max-w-md px-6 pb-12 pt-10">
        <Logo size="md" className="text-center" />

        {confirmar ? (
          <div className="mt-10 rounded-2xl border border-primary/50 bg-card p-6 text-center neon-box">
            <MailCheck className="mx-auto size-10 text-primary" />
            <h1 className="mt-3 font-display text-3xl uppercase">Confirme seu e-mail</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Mandamos um link para <strong className="text-foreground">{confirmar}</strong>. Clique nele e depois entre
              aqui. No primeiro acesso você coloca sua foto de perfil.
            </p>
            <Button variant="neonOutline" className="mt-6 w-full" onClick={() => { setConfirmar(null); setModo("entrar"); }}>
              IR PARA O LOGIN
            </Button>
          </div>
        ) : (
          <>
            <div className="mt-8 grid grid-cols-2 rounded-xl border border-border bg-card p-1">
              {(["entrar", "cadastro"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setModo(m)}
                  className={cn(
                    "rounded-lg py-2 font-display text-xl uppercase transition-colors",
                    modo === m ? "bg-primary text-primary-foreground" : "text-muted-foreground",
                  )}
                >
                  {m === "entrar" ? "Entrar" : "Criar conta"}
                </button>
              ))}
            </div>

            {modo === "entrar" ? (
              <form onSubmit={entrar} className="mt-6 space-y-4">
                <Campo label="E-mail" name="email" type="email" autoComplete="email" />
                <Campo label="Senha" name="senha" type="password" autoComplete="current-password" />
                <Button type="submit" variant="neon" size="xl" className="w-full" disabled={carregando}>
                  {carregando && <Loader2 className="animate-spin" />} ENTRAR
                </Button>
              </form>
            ) : (
              <form onSubmit={cadastrar} className="mt-6 space-y-4">
                <p className="text-xs uppercase tracking-widest text-muted-foreground">Passo 1 de 2 · a foto vem no primeiro acesso</p>
                <Campo label="Nome" name="nome" autoComplete="name" maxLength={80} />
                <Campo label="Data de nascimento" name="nascimento" type="date" hint="No perfil aparece só a sua idade." />
                <Campo label="Nick no Free Fire" name="nick" maxLength={40} />
                <Campo label="WhatsApp" name="whatsapp" type="tel" inputMode="tel" placeholder="(11) 99999-9999" />
                <Campo label="E-mail" name="email" type="email" autoComplete="email" />
                <Campo label="Senha" name="senha" type="password" autoComplete="new-password" minLength={6} hint="Use uma senha forte: senhas fáceis como 123456 são recusadas." />
                <Button type="submit" variant="neon" size="xl" className="w-full" disabled={carregando}>
                  {carregando && <Loader2 className="animate-spin" />} CRIAR CONTA
                </Button>
                <p className="text-center text-xs text-muted-foreground">Proibido para menores de {IDADE_MINIMA} anos.</p>
              </form>
            )}
          </>
        )}
      </div>
    </main>
  );
}

function Campo({ label, name, hint, ...props }: { label: string; name: string; hint?: string } & ComponentProps<typeof Input>) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name} className="font-display text-base uppercase tracking-wide">{label}</Label>
      <Input id={name} name={name} required className="h-11 bg-card" {...props} />
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

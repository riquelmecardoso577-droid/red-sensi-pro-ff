import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Crosshair, Flame, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/app/Logo";
import { formatarReais } from "@/lib/pix";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/loja")({
  head: () => ({
    meta: [
      { title: "Loja de Sensis — RED SENSI PRO FF" },
      { name: "description", content: "18 sensis de Free Fire para Samsung, Motorola, Xiaomi, iPhone, Universal e Xit." },
      { property: "og:title", content: "Loja de Sensis — RED SENSI PRO FF" },
      { property: "og:description", content: "As melhores sensis de Free Fire por R$ 7,90." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Loja,
});

const FILTROS = ["Todas", "Samsung", "Motorola", "Xiaomi", "iPhone", "Universal", "Xit"] as const;

function Loja() {
  const [filtro, setFiltro] = useState<(typeof FILTROS)[number]>("Todas");
  const { data: sensis = [], isLoading } = useQuery({
    queryKey: ["sensis-loja"],
    queryFn: async () => {
      const { data, error } = await supabase.from("sensis").select("id,marca,modelo,geral,preco,destaque,created_at").order("created_at");
      if (error) throw error;
      return data ?? [];
    },
  });
  const lista = (filtro === "Todas" ? sensis : sensis.filter((s) => s.marca === filtro)).sort(
    (a, b) => Number(b.destaque) - Number(a.destaque),
  );

  return (
    <div className="mx-auto max-w-lg">
      <header className="sticky top-0 z-30 border-b border-border bg-background/90 px-4 pb-3 pt-2 backdrop-blur-md">
        <div className="flex items-end justify-between">
          <Logo size="sm" />
          <span className="font-display text-xl uppercase text-muted-foreground">Loja</span>
        </div>
        <div className="-mx-4 mt-3 flex gap-2 overflow-x-auto px-4 scrollbar-none">
          {FILTROS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFiltro(f)}
              className={cn(
                "shrink-0 rounded-full border px-4 py-1 font-display text-lg uppercase transition-colors",
                filtro === f ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground",
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </header>

      {isLoading && <Loader2 className="mx-auto my-10 animate-spin text-primary" />}
      <div className="grid grid-cols-2 gap-3 p-4">
        {lista.map((s) => (
          <Link
            key={s.id}
            to="/sensi/$id"
            params={{ id: s.id }}
            className={cn(
              "group relative overflow-hidden rounded-2xl border bg-card p-3 transition-transform active:scale-[0.98]",
              s.destaque ? "border-primary neon-box" : "border-border",
            )}
          >
            <div className="pointer-events-none absolute inset-0 bg-grid-red opacity-40" />
            <div className="relative">
              <div className="flex items-center justify-between">
                <span className="rounded bg-secondary px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {s.marca}
                </span>
                {s.destaque && <Flame className="size-4 text-primary" />}
              </div>
              <Crosshair className="mt-4 size-8 text-primary" />
              <p className="mt-2 font-display text-2xl uppercase leading-none">{s.modelo}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Geral <span className="font-semibold text-foreground">{s.geral}</span>
              </p>
              <p className="mt-3 font-display text-2xl neon-text">{formatarReais(Number(s.preco))}</p>
            </div>
          </Link>
        ))}
      </div>
      {!isLoading && lista.length === 0 && <p className="p-8 text-center text-sm text-muted-foreground">Nenhuma sensi nessa marca ainda.</p>}
    </div>
  );
}

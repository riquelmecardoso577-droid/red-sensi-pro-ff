import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Loader2, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { UserAvatar } from "./UserAvatar";
import { VerifiedBadge } from "./VerifiedBadge";
import { Midia } from "./Midia";
import { AUTOR_COLS, type Autor, type Perfil } from "@/hooks/use-app";
import { ehVideo, enviarArquivo } from "@/lib/midia";
import { tempoAtras } from "./PostCard";

interface Story {
  id: string;
  midia_url: string;
  created_at: string;
  usuario_id: string;
  autor: Autor | null;
}

export function StoriesBar({ eu }: { eu: Perfil }) {
  const qc = useQueryClient();
  const [enviando, setEnviando] = useState(false);
  const [aberto, setAberto] = useState<Story[] | null>(null);

  const { data: grupos = [] } = useQuery({
    queryKey: ["stories"],
    queryFn: async () => {
      const desde = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { data, error } = await supabase
        .from("stories")
        .select(`id,midia_url,created_at,usuario_id,autor:usuarios(${AUTOR_COLS})`)
        .gte("created_at", desde)
        .order("created_at", { ascending: true })
        .limit(300);
      if (error) throw error;
      const mapa = new Map<string, Story[]>();
      for (const s of (data ?? []) as unknown as Story[]) {
        mapa.set(s.usuario_id, [...(mapa.get(s.usuario_id) ?? []), s]);
      }
      return [...mapa.values()].sort((a, b) => (a[0]!.usuario_id === eu.id ? -1 : b[0]!.usuario_id === eu.id ? 1 : 0));
    },
  });

  const meus = grupos.find((g) => g[0]?.usuario_id === eu.id);
  const outros = grupos.filter((g) => g[0]?.usuario_id !== eu.id);

  async function postarStory(file: File | undefined) {
    if (!file) return;
    setEnviando(true);
    try {
      const caminho = await enviarArquivo("midia", eu.id, "stories", file);
      const { error } = await supabase.from("stories").insert({ midia_url: caminho });
      if (error) throw error;
      toast.success("Story publicado! Fica no ar por 24h.");
      qc.invalidateQueries({ queryKey: ["stories"] });
    } catch {
      toast.error("Não foi possível publicar o story.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="flex gap-4 overflow-x-auto px-4 py-3 scrollbar-none">
      <div className="flex w-16 shrink-0 flex-col items-center gap-1">
        <div className="relative">
          <button type="button" onClick={() => meus && setAberto(meus)} className="block size-16">
            <UserAvatar foto={eu.foto} nome={eu.nome} ring={!!meus} className="size-16" />
          </button>
          <label className="absolute -bottom-0.5 -right-0.5 flex size-6 cursor-pointer items-center justify-center rounded-full border-2 border-background bg-primary text-primary-foreground">
            {enviando ? <Loader2 className="size-3 animate-spin" /> : <Plus className="size-3.5" />}
            <input type="file" accept="image/*,video/*" className="sr-only" onChange={(e) => postarStory(e.target.files?.[0])} />
          </label>
        </div>
        <span className="w-full truncate text-center text-xs">Seu story</span>
      </div>
      {outros.map((g) => {
        const a = g[0]!.autor;
        return (
          <button key={g[0]!.usuario_id} type="button" onClick={() => setAberto(g)} className="flex w-16 shrink-0 flex-col items-center gap-1">
            <UserAvatar foto={a?.foto} nome={a?.nome ?? "?"} ring className="size-16" />
            <span className="flex w-full items-center justify-center gap-0.5 text-xs">
              <span className="truncate">{a?.nome.split(" ")[0]}</span>
              {a?.verificado && <VerifiedBadge className="size-3" />}
            </span>
          </button>
        );
      })}
      {outros.length === 0 && (
        <p className="self-center text-xs text-muted-foreground">Os stories da galera aparecem aqui.</p>
      )}
      <StoryViewer stories={aberto} onClose={() => setAberto(null)} />
    </div>
  );
}

function StoryViewer({ stories, onClose }: { stories: Story[] | null; onClose: () => void }) {
  const [i, setI] = useState(0);
  useEffect(() => setI(0), [stories]);
  const atual = stories?.[i];
  useEffect(() => {
    if (!atual || ehVideo(atual.midia_url)) return;
    const t = setTimeout(() => {
      if (stories && i < stories.length - 1) setI(i + 1);
      else onClose();
    }, 5000);
    return () => clearTimeout(t);
  }, [atual, i, stories, onClose]);

  return (
    <Dialog open={!!stories} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="h-dvh max-w-md border-0 bg-background p-0 sm:h-[90dvh] [&>button]:hidden">
        <DialogTitle className="sr-only">Story</DialogTitle>
        {atual && (
          <div className="relative size-full">
            <div className="absolute inset-x-2 top-2 z-10 flex gap-1">
              {stories!.map((s, idx) => (
                <div key={s.id} className={idx <= i ? "h-0.5 flex-1 rounded bg-primary" : "h-0.5 flex-1 rounded bg-muted"} />
              ))}
            </div>
            <div className="absolute inset-x-3 top-5 z-10 flex items-center gap-2">
              <UserAvatar foto={atual.autor?.foto} nome={atual.autor?.nome ?? "?"} className="size-8" />
              <span className="text-sm font-semibold">{atual.autor?.nome}</span>
              <span className="text-xs text-muted-foreground">{tempoAtras(atual.created_at)}</span>
              <button type="button" aria-label="Fechar" className="ml-auto" onClick={onClose}>
                <X />
              </button>
            </div>
            <Midia
              key={atual.id}
              caminho={atual.midia_url}
              tipo={ehVideo(atual.midia_url) ? "video" : "foto"}
              className="size-full object-contain"
              controls={false}
            />
            <button type="button" aria-label="Anterior" className="absolute inset-y-0 left-0 w-1/3" onClick={() => setI(Math.max(0, i - 1))} />
            <button
              type="button"
              aria-label="Próximo"
              className="absolute inset-y-0 right-0 w-2/3"
              onClick={() => (i < stories!.length - 1 ? setI(i + 1) : onClose())}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

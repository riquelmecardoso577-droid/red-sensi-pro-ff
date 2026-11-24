import { createFileRoute, Link } from "@tanstack/react-router";
import { useInfiniteQuery, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { Crosshair, Heart, Loader2, Plus, Trash2, Volume2, VolumeX } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserAvatar } from "@/components/app/UserAvatar";
import { NomeAutor, SeguirBotao } from "@/components/app/PostCard";
import { AUTOR_COLS, type Autor, useEuId, useIsAdmin, useSeguindo } from "@/hooks/use-app";
import { enviarArquivo, useMidiaUrl } from "@/lib/midia";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/videos")({
  head: () => ({
    meta: [
      { title: "Vídeos — RED SENSI PRO FF" },
      { name: "description", content: "Clipes de Free Fire em tela cheia. Deslize, curta e use a sensi do vídeo." },
      { property: "og:title", content: "Vídeos — RED SENSI PRO FF" },
      { property: "og:description", content: "Clipes de Free Fire estilo TikTok." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Videos,
});

interface VideoItem {
  id: string;
  video_url: string;
  legenda: string;
  curtidas: number;
  sensi_id: string | null;
  usuario_id: string;
  created_at: string;
  autor: Autor | null;
  sensi: { modelo: string } | null;
  curtido: boolean;
}

const POR_PAGINA = 10;

function Videos() {
  const euId = useEuId();
  const { data: seguindo } = useSeguindo(euId);
  const { data: souAdmin } = useIsAdmin(euId);
  const [mudo, setMudo] = useState(true);
  const [upload, setUpload] = useState(false);

  const q = useInfiniteQuery({
    queryKey: ["videos"],
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      const de = pageParam * POR_PAGINA;
      const { data, error } = await supabase
        .from("videos")
        .select(`id,video_url,legenda,curtidas,sensi_id,usuario_id,created_at,autor:usuarios!videos_usuario_id_fkey(${AUTOR_COLS}),sensi:sensis(modelo)`)
        .order("created_at", { ascending: false })
        .range(de, de + POR_PAGINA - 1);
      if (error) throw error;
      const lista = (data ?? []) as unknown as Omit<VideoItem, "curtido">[];
      let curtidos = new Set<string>();
      if (lista.length) {
        const { data: c } = await supabase.from("curtidas_videos").select("video_id").eq("usuario_id", euId).in("video_id", lista.map((v) => v.id));
        curtidos = new Set((c ?? []).map((x) => x.video_id));
      }
      return { itens: lista.map((v) => ({ ...v, curtido: curtidos.has(v.id) })), proxima: lista.length === POR_PAGINA ? pageParam + 1 : undefined };
    },
    getNextPageParam: (u) => u.proxima,
  });
  const videos = q.data?.pages.flatMap((p) => p.itens) ?? [];

  return (
    <div className="relative mx-auto max-w-lg">
      <div className="absolute inset-x-0 top-0 z-20 flex items-center justify-between px-4 pt-3">
        <h1 className="font-display text-3xl uppercase drop-shadow">Vídeos</h1>
        <div className="flex gap-2">
          <Button size="icon" variant="glass" aria-label={mudo ? "Ativar som" : "Silenciar"} onClick={() => setMudo(!mudo)}>
            {mudo ? <VolumeX /> : <Volume2 />}
          </Button>
          <Button size="icon" variant="default" aria-label="Postar vídeo" onClick={() => setUpload(true)}>
            <Plus />
          </Button>
        </div>
      </div>

      <div className="h-[calc(100dvh-4rem)] snap-y snap-mandatory overflow-y-scroll scrollbar-none">
        {q.isLoading && <div className="flex h-full items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>}
        {!q.isLoading && videos.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center px-8 text-center">
            <p className="font-display text-4xl uppercase">Nenhum clipe ainda</p>
            <p className="mt-1 text-sm text-muted-foreground">Poste o primeiro clipe e marque a sensi que você usou.</p>
            <Button variant="neon" className="mt-5" onClick={() => setUpload(true)}>POSTAR CLIPE</Button>
          </div>
        )}
        {videos.map((v, idx) => (
          <VideoTela
            key={v.id}
            v={v}
            euId={euId}
            mudo={mudo}
            seguindo={seguindo?.has(v.usuario_id) ?? false}
            souAdmin={!!souAdmin}
            onVisivel={() => {
              if (idx >= videos.length - 2 && q.hasNextPage && !q.isFetchingNextPage) q.fetchNextPage();
            }}
          />
        ))}
      </div>
      <UploadVideo euId={euId} aberto={upload} onOpenChange={setUpload} />
    </div>
  );
}

function VideoTela({ v, euId, mudo, seguindo, souAdmin, onVisivel }: { v: VideoItem; euId: string; mudo: boolean; seguindo: boolean; souAdmin: boolean; onVisivel: () => void }) {
  const qc = useQueryClient();
  const ref = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { data: url } = useMidiaUrl(v.video_url);
  const [curtido, setCurtido] = useState(v.curtido);
  const [total, setTotal] = useState(v.curtidas);
  const visivelRef = useRef(onVisivel);
  visivelRef.current = onVisivel;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      const vid = videoRef.current;
      if (!vid || !e) return;
      if (e.isIntersecting) {
        vid.play().catch(() => {});
        visivelRef.current();
      } else vid.pause();
    }, { threshold: 0.6 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [url]);

  async function curtir() {
    const novo = !curtido;
    setCurtido(novo);
    setTotal((t) => t + (novo ? 1 : -1));
    const { error } = novo
      ? await supabase.from("curtidas_videos").insert({ video_id: v.id })
      : await supabase.from("curtidas_videos").delete().eq("video_id", v.id).eq("usuario_id", euId);
    if (error && error.code !== "23505") {
      setCurtido(!novo);
      setTotal((t) => t + (novo ? -1 : 1));
    }
  }

  return (
    <section ref={ref} className="relative h-full snap-start snap-always bg-background">
      {url && (
        <video
          ref={videoRef}
          src={url}
          className="absolute inset-0 size-full object-cover"
          loop
          playsInline
          muted={mudo}
          preload="metadata"
          onClick={(e) => (e.currentTarget.paused ? e.currentTarget.play() : e.currentTarget.pause())}
        />
      )}
      <div className="pointer-events-none absolute inset-0 bg-fade-bottom" />

      <div className="absolute bottom-6 right-3 z-10 flex flex-col items-center gap-5">
        <button type="button" onClick={curtir} aria-label="Curtir" className="flex flex-col items-center">
          <Heart className={cn("size-9 drop-shadow", curtido ? "fill-primary text-primary" : "")} />
          <span className="text-sm font-semibold">{total}</span>
        </button>
        {(v.usuario_id === euId || souAdmin) && (
          <button
            type="button"
            aria-label="Apagar vídeo"
            onClick={async () => {
              await supabase.from("videos").delete().eq("id", v.id);
              qc.invalidateQueries({ queryKey: ["videos"] });
            }}
          >
            <Trash2 className="size-6" />
          </button>
        )}
      </div>

      <div className="absolute inset-x-0 bottom-0 z-10 space-y-3 p-4 pr-16">
        <div className="flex items-center gap-2">
          <UserAvatar foto={v.autor?.foto} nome={v.autor?.nome ?? "?"} className="size-10 border-2 border-primary" />
          <NomeAutor autor={v.autor} className="text-base" />
          <SeguirBotao euId={euId} alvoId={v.usuario_id} seguindo={seguindo} />
        </div>
        {v.legenda && <p className="line-clamp-3 text-sm">{v.legenda}</p>}
        <Button asChild variant="neon" size="lg" className="w-full animate-pulse-neon">
          {v.sensi_id ? (
            <Link to="/sensi/$id" params={{ id: v.sensi_id }}>
              <Crosshair /> USAR ESSA SENSI{v.sensi ? ` · ${v.sensi.modelo}` : ""}
            </Link>
          ) : (
            <Link to="/loja"><Crosshair /> USAR ESSA SENSI</Link>
          )}
        </Button>
      </div>
    </section>
  );
}

function UploadVideo({ euId, aberto, onOpenChange }: { euId: string; aberto: boolean; onOpenChange: (v: boolean) => void }) {
  const qc = useQueryClient();
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [legenda, setLegenda] = useState("");
  const [sensiId, setSensiId] = useState<string>("nenhuma");
  const [enviando, setEnviando] = useState(false);
  const { data: sensis = [] } = useQuery({
    queryKey: ["sensis-lista"],
    queryFn: async () => {
      const { data, error } = await supabase.from("sensis").select("id,modelo,marca").order("modelo");
      if (error) throw error;
      return data ?? [];
    },
  });

  async function publicar() {
    if (!arquivo) return;
    if (!arquivo.type.startsWith("video/")) return void toast.error("Escolha um arquivo de vídeo.");
    setEnviando(true);
    try {
      const caminho = await enviarArquivo("midia", euId, "videos", arquivo);
      const { error } = await supabase.from("videos").insert({
        video_url: caminho,
        legenda: legenda.trim().slice(0, 500),
        sensi_id: sensiId === "nenhuma" ? null : sensiId,
      });
      if (error) throw error;
      toast.success("Clipe postado!");
      setArquivo(null);
      setLegenda("");
      onOpenChange(false);
      qc.invalidateQueries({ queryKey: ["videos"] });
    } catch {
      toast.error("Falha ao enviar. O vídeo pode ter no máximo 50 MB.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Dialog open={aberto} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md border-border bg-popover">
        <DialogHeader>
          <DialogTitle className="font-display text-3xl uppercase">Postar clipe</DialogTitle>
        </DialogHeader>
        <label className="flex h-40 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-primary/60 bg-card text-sm text-muted-foreground">
          <Plus className="size-8 text-primary" />
          {arquivo ? arquivo.name : "Escolher vídeo (até 50 MB)"}
          <input type="file" accept="video/*" className="sr-only" onChange={(e) => setArquivo(e.target.files?.[0] ?? null)} />
        </label>
        <Textarea value={legenda} onChange={(e) => setLegenda(e.target.value)} placeholder="Legenda do clipe" maxLength={500} className="bg-card" />
        <Select value={sensiId} onValueChange={setSensiId}>
          <SelectTrigger className="bg-card"><SelectValue placeholder="Sensi usada" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="nenhuma">Sem sensi marcada</SelectItem>
            {sensis.map((s) => (
              <SelectItem key={s.id} value={s.id}>{s.modelo} · {s.marca}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="neon" size="xl" disabled={!arquivo || enviando} onClick={publicar}>
          {enviando && <Loader2 className="animate-spin" />} POSTAR
        </Button>
      </DialogContent>
    </Dialog>
  );
}

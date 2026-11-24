import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ImagePlus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { ehVideo, enviarArquivo } from "@/lib/midia";

export function NovoPost({ euId, aberto, onOpenChange }: { euId: string; aberto: boolean; onOpenChange: (v: boolean) => void }) {
  const qc = useQueryClient();
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [legenda, setLegenda] = useState("");
  const [enviando, setEnviando] = useState(false);
  const preview = arquivo ? URL.createObjectURL(arquivo) : null;

  async function publicar() {
    if (!arquivo) return;
    setEnviando(true);
    try {
      const caminho = await enviarArquivo("midia", euId, "posts", arquivo);
      const { error } = await supabase
        .from("posts")
        .insert({ foto_video: caminho, tipo: ehVideo(arquivo) ? "video" : "foto", legenda: legenda.trim().slice(0, 1000) });
      if (error) throw error;
      toast.success("Post publicado!");
      setArquivo(null);
      setLegenda("");
      onOpenChange(false);
      qc.invalidateQueries({ queryKey: ["feed"] });
      qc.invalidateQueries({ queryKey: ["posts-usuario", euId] });
    } catch {
      toast.error("Falha ao publicar. Tente um arquivo menor.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Dialog open={aberto} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md border-border bg-popover">
        <DialogHeader>
          <DialogTitle className="font-display text-3xl uppercase">Novo post</DialogTitle>
        </DialogHeader>
        <label className="flex aspect-square cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-primary/60 bg-card">
          {preview ? (
            arquivo && ehVideo(arquivo) ? (
              <video src={preview} className="size-full object-cover" muted playsInline autoPlay loop />
            ) : (
              <img src={preview} alt="Prévia" className="size-full object-cover" />
            )
          ) : (
            <div className="text-center text-muted-foreground">
              <ImagePlus className="mx-auto size-10 text-primary" />
              <p className="mt-2 text-sm">Escolha uma foto ou vídeo</p>
            </div>
          )}
          <input type="file" accept="image/*,video/*" className="sr-only" onChange={(e) => setArquivo(e.target.files?.[0] ?? null)} />
        </label>
        <Textarea value={legenda} onChange={(e) => setLegenda(e.target.value)} placeholder="Legenda... #capa #REDSENSI" maxLength={1000} className="bg-card" />
        <Button variant="neon" size="xl" disabled={!arquivo || enviando} onClick={publicar}>
          {enviando && <Loader2 className="animate-spin" />} PUBLICAR
        </Button>
      </DialogContent>
    </Dialog>
  );
}

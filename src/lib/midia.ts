import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Bucket = "midia" | "prints";

export async function enviarArquivo(bucket: Bucket, userId: string, pasta: string, file: File): Promise<string> {
  const ext = (file.name.split(".").pop() || "bin").toLowerCase().replace(/[^a-z0-9]/g, "");
  const caminho = `${userId}/${pasta}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage.from(bucket).upload(caminho, file, {
    contentType: file.type || undefined,
    upsert: false,
  });
  if (error) throw error;
  return caminho;
}

export function useMidiaUrl(caminho: string | null | undefined, bucket: Bucket = "midia") {
  return useQuery({
    queryKey: ["midia-url", bucket, caminho],
    enabled: !!caminho,
    staleTime: 50 * 60 * 1000,
    gcTime: 55 * 60 * 1000,
    queryFn: async () => {
      if (!caminho) return null;
      if (/^https?:\/\//.test(caminho)) return caminho;
      const { data, error } = await supabase.storage.from(bucket).createSignedUrl(caminho, 60 * 60);
      if (error) throw error;
      return data.signedUrl;
    },
  });
}

export function ehVideo(file: File | string): boolean {
  if (typeof file === "string") return /\.(mp4|webm|mov|m4v|ogg)$/i.test(file);
  return file.type.startsWith("video/");
}

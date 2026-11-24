import { useMidiaUrl } from "@/lib/midia";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

export function Midia({
  caminho,
  tipo,
  className,
  controls = true,
}: {
  caminho: string;
  tipo: "foto" | "video";
  className?: string;
  controls?: boolean;
}) {
  const { data: url, isLoading } = useMidiaUrl(caminho);
  if (isLoading || !url) return <Skeleton className={cn("bg-muted", className)} />;
  if (tipo === "video") {
    return <video src={url} className={cn("bg-background object-cover", className)} controls={controls} playsInline preload="metadata" />;
  }
  return <img src={url} alt="" className={cn("object-cover", className)} loading="lazy" />;
}

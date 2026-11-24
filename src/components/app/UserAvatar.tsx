import { useMidiaUrl } from "@/lib/midia";
import { cn } from "@/lib/utils";

export function UserAvatar({
  foto,
  nome,
  className,
  ring = false,
}: {
  foto: string | null | undefined;
  nome: string;
  className?: string;
  ring?: boolean;
}) {
  const { data: url } = useMidiaUrl(foto);
  const inicial = (nome || "?").trim().charAt(0).toUpperCase();
  const img = (
    <div className={cn("overflow-hidden rounded-full bg-secondary", ring ? "size-full border-2 border-background" : className)}>
      {url ? (
        <img src={url} alt={nome} className="size-full object-cover" loading="lazy" />
      ) : (
        <div className="flex size-full items-center justify-center font-display text-lg text-primary">{inicial}</div>
      )}
    </div>
  );
  if (!ring) return img;
  return <div className={cn("rounded-full bg-story-ring p-[2px]", className)}>{img}</div>;
}

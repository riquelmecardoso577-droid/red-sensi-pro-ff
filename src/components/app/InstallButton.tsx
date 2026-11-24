import { Download } from "lucide-react";
import { toast } from "sonner";
import { Button, type ButtonProps } from "@/components/ui/button";
import { useInstallPrompt } from "@/hooks/use-install";

export function InstallButton({ variant = "neonOutline", className, size }: Pick<ButtonProps, "variant" | "className" | "size">) {
  const { instalado, ios, instalar } = useInstallPrompt();
  if (instalado) return null;
  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={className}
      onClick={async () => {
        const r = await instalar();
        if (r === "manual") {
          toast.info(
            ios
              ? "No iPhone: toque em Compartilhar e depois em \"Adicionar à Tela de Início\"."
              : "Abra o app publicado no Chrome e use o menu ⋮ → \"Instalar app\".",
          );
        } else if (r === "aceito") toast.success("RED SENSI instalado!");
      }}
    >
      <Download /> INSTALAR APP
    </Button>
  );
}

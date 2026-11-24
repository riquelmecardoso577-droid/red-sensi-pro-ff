import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

let eventoGuardado: BeforeInstallPromptEvent | null = null;
const ouvintes = new Set<() => void>();

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    eventoGuardado = e as BeforeInstallPromptEvent;
    ouvintes.forEach((f) => f());
  });
  window.addEventListener("appinstalled", () => {
    eventoGuardado = null;
    ouvintes.forEach((f) => f());
  });
}

export function useInstallPrompt() {
  const [, forcar] = useState(0);
  const [instalado, setInstalado] = useState(false);
  const [ios, setIos] = useState(false);

  useEffect(() => {
    const atualizar = () => forcar((n) => n + 1);
    ouvintes.add(atualizar);
    setInstalado(
      window.matchMedia?.("(display-mode: standalone)").matches ||
        (navigator as Navigator & { standalone?: boolean }).standalone === true,
    );
    setIos(/iphone|ipad|ipod/i.test(navigator.userAgent));
    return () => {
      ouvintes.delete(atualizar);
    };
  }, []);

  async function instalar(): Promise<"aceito" | "recusado" | "manual"> {
    if (!eventoGuardado) return "manual";
    await eventoGuardado.prompt();
    const escolha = await eventoGuardado.userChoice;
    eventoGuardado = null;
    forcar((n) => n + 1);
    return escolha.outcome === "accepted" ? "aceito" : "recusado";
  }

  return { podeInstalar: !!eventoGuardado, instalado, ios, instalar };
}

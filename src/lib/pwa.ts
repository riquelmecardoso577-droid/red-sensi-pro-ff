// Único ponto que registra o service worker. Nunca registra no preview do editor nem em dev.
const PREVIEW_LABEL = /^(?:id-preview|preview)(?:-[a-z0-9]+)?--.+$/;
const DOMINIOS_LOVABLE = [".lovable.app", ".gpt-eng.com", ".gptengineer.run"];

function contextoBloqueado(): boolean {
  if (!import.meta.env.PROD) return true;
  let emIframe = false;
  try {
    emIframe = window.self !== window.top;
  } catch {
    emIframe = true;
  }
  if (emIframe) return true;
  const host = window.location.hostname.toLowerCase();
  const primeiro = host.split(".")[0] ?? "";
  if (DOMINIOS_LOVABLE.some((d) => host.endsWith(d))) {
    if (PREVIEW_LABEL.test(primeiro) || /^project--.+-dev$/.test(primeiro)) return true;
  }
  if (host === "lovableproject.com" || host.endsWith(".lovableproject.com")) return true;
  if (host === "lovableproject-dev.com" || host.endsWith(".lovableproject-dev.com")) return true;
  if (host === "beta.lovable.dev" || host.endsWith(".beta.lovable.dev")) return true;
  if (new URLSearchParams(window.location.search).get("sw") === "off") return true;
  return false;
}

async function removerSwDoApp() {
  const regs = await navigator.serviceWorker.getRegistrations();
  await Promise.all(
    regs
      .filter((r) =>
        [r.active, r.waiting, r.installing].some((w) => w?.scriptURL.endsWith("/sw.js")),
      )
      .map((r) => r.unregister()),
  );
}

export async function registrarServiceWorker() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
  if (contextoBloqueado()) {
    await removerSwDoApp().catch(() => {});
    return;
  }
  const { registerSW } = await import("virtual:pwa-register");
  registerSW({ immediate: true });
}

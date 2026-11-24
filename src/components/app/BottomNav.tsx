import { Link } from "@tanstack/react-router";
import { Clapperboard, Home, ShoppingBag, User, Users } from "lucide-react";

const abas = [
  { to: "/inicio", label: "Início", Icon: Home },
  { to: "/videos", label: "Vídeos", Icon: Clapperboard },
  { to: "/comunidade", label: "Comunidade", Icon: Users },
  { to: "/loja", label: "Loja", Icon: ShoppingBag },
  { to: "/perfil", label: "Perfil", Icon: User },
] as const;

export function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 pb-safe backdrop-blur-md">
      <ul className="mx-auto grid max-w-lg grid-cols-5">
        {abas.map(({ to, label, Icon }) => (
          <li key={to}>
            <Link
              to={to}
              className="flex h-14 flex-col items-center justify-center gap-0.5 text-muted-foreground transition-colors"
              activeProps={{ className: "text-primary [&_svg]:drop-shadow-[0_0_6px_var(--primary)]" }}
            >
              <Icon className="size-5" />
              <span className="font-display text-sm uppercase leading-none tracking-wide">{label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

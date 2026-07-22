import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { Backpack, Coins, Home, Swords, Trophy, Users } from "lucide-react";

export const Route = createFileRoute("/_authenticated/jogo")({
  component: JogoLayout,
});

const TABS: ReadonlyArray<{ to: string; label: string; icon: typeof Home; exact?: boolean }> = [
  { to: "/jogo", label: "Bastião", icon: Home, exact: true },
  { to: "/jogo/arena", label: "Incursão", icon: Swords },
  { to: "/jogo/coorte", label: "Coorte", icon: Users },
  { to: "/jogo/inventario", label: "Inventário", icon: Backpack },
  { to: "/jogo/carteira", label: "Carteira", icon: Coins },
  { to: "/ranking", label: "Ranking", icon: Trophy },
];

function JogoLayout() {
  return (
    <div>
      <div className="sticky top-16 z-30 border-b border-border/60 bg-background/85 backdrop-blur">
        <nav className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 py-2 md:px-6">
          {TABS.map((t) => (
            <Link
              key={t.to}
              to={t.to}
              className="inline-flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground"
              activeProps={{
                className:
                  "inline-flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-sm bg-primary/15 text-primary",
              }}
              activeOptions={{ exact: t.exact ?? false }}
            >
              <t.icon className="h-4 w-4" />
              {t.label}
            </Link>
          ))}
        </nav>
      </div>
      <Outlet />
    </div>
  );
}

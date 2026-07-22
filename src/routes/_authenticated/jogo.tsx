import { createFileRoute, Link, Outlet, useLocation } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

const tabs = [
  { to: "/jogo", label: "Bastião", exact: true },
  { to: "/jogo/equipe", label: "Equipe" },
];

export const Route = createFileRoute("/_authenticated/jogo")({
  component: JogoLayout,
});

function JogoLayout() {
  const { pathname } = useLocation();
  return (
    <div className="min-h-screen">
      <nav className="sticky top-14 z-30 border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-2 py-2">
          {tabs.map((t) => {
            const active = t.exact ? pathname === t.to : pathname.startsWith(t.to);
            return (
              <Link
                key={t.to}
                to={t.to}
                className={cn(
                  "whitespace-nowrap rounded-md px-3 py-1.5 text-sm transition",
                  active
                    ? "bg-primary text-primary-foreground shadow-gold"
                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                )}
              >
                {t.label}
              </Link>
            );
          })}
        </div>
      </nav>
      <Outlet />
    </div>
  );
}

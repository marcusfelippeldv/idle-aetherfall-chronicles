import { Link, useRouter } from "@tanstack/react-router";
import { Menu, Sparkles, LogOut, LayoutDashboard, Shield } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

import { useSession } from "@/hooks/use-session";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";

const NAV = [
  { to: "/", label: "Início" },
  { to: "/roadmap", label: "Roadmap" },
  { to: "/ranking", label: "Ranking" },
];

export function SiteHeader() {
  const { user, loading } = useSession();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    toast.success("Você saiu da sua conta.");
    router.navigate({ to: "/", replace: true });
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 md:px-6">
        <Link to="/" className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-md bg-gold-gradient text-primary-foreground shadow-gold">
            <Sparkles className="h-5 w-5" />
          </span>
          <span className="font-display text-lg font-semibold tracking-wide">
            Aetherfall
          </span>
        </Link>

        <nav className="ml-6 hidden items-center gap-1 md:flex">
          {NAV.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className="rounded-md px-3 py-2 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground"
              activeProps={{
                className:
                  "rounded-md px-3 py-2 text-sm text-foreground bg-muted",
              }}
              activeOptions={{ exact: true }}
            >
              {n.label}
            </Link>
          ))}
          <a
            href="https://discord.com"
            target="_blank"
            rel="noreferrer"
            className="rounded-md px-3 py-2 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            Comunidade
          </a>
        </nav>

        <div className="ml-auto hidden items-center gap-2 md:flex">
          {loading ? null : user ? (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link to="/jogo">
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  Painel
                </Link>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    {user.email?.split("@")[0]}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <DropdownMenuLabel className="truncate text-xs text-muted-foreground">
                    {user.email}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/jogo">
                      <LayoutDashboard className="mr-2 h-4 w-4" /> Painel
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/admin">
                      <Shield className="mr-2 h-4 w-4" /> Administração
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" /> Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link to="/login">Entrar</Link>
              </Button>
              <Button asChild size="sm" className="shadow-gold">
                <Link to="/cadastro">Criar conta</Link>
              </Button>
            </>
          )}
        </div>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="ml-auto md:hidden"
              aria-label="Abrir menu"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-72 bg-card">
            <SheetTitle className="font-display">Menu</SheetTitle>
            <div className="mt-6 flex flex-col gap-1">
              {NAV.map((n) => (
                <Link
                  key={n.to}
                  to={n.to}
                  onClick={() => setOpen(false)}
                  className="rounded-md px-3 py-2 text-sm text-foreground hover:bg-muted"
                >
                  {n.label}
                </Link>
              ))}
              <div className="mt-4 flex flex-col gap-2 border-t border-border pt-4">
                {user ? (
                  <>
                    <Button asChild variant="outline">
                      <Link to="/jogo" onClick={() => setOpen(false)}>
                        Painel
                      </Link>
                    </Button>
                    <Button asChild variant="outline">
                      <Link to="/admin" onClick={() => setOpen(false)}>
                        Administração
                      </Link>
                    </Button>
                    <Button
                      onClick={() => {
                        setOpen(false);
                        handleSignOut();
                      }}
                    >
                      Sair
                    </Button>
                  </>
                ) : (
                  <>
                    <Button asChild variant="outline">
                      <Link to="/login" onClick={() => setOpen(false)}>
                        Entrar
                      </Link>
                    </Button>
                    <Button asChild>
                      <Link to="/cadastro" onClick={() => setOpen(false)}>
                        Criar conta
                      </Link>
                    </Button>
                  </>
                )}
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, Coins, Gem } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getMyProfile } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/jogo/carteira")({
  head: () => ({
    meta: [
      { title: "Carteira — Aetherfall Online" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CarteiraPage,
});

function CarteiraPage() {
  const profileFn = useServerFn(getMyProfile);
  const q = useQuery({ queryKey: ["me", "profile"], queryFn: () => profileFn() });

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 md:px-6 md:py-14">
      <div className="mb-4">
        <Button asChild variant="ghost" size="sm">
          <Link to="/jogo/arena"><ArrowLeft className="mr-2 h-4 w-4" /> Voltar</Link>
        </Button>
      </div>
      <header className="mb-6">
        <p className="font-display text-sm uppercase tracking-[0.3em] text-primary">Bastião</p>
        <h1 className="mt-1 font-display text-4xl">Carteira</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Ouro é ganho em incursões. Cristais serão obtidos em eventos e pacotes.
        </p>
      </header>
      {q.isLoading ? (
        <Skeleton className="h-32 w-full" />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="border-border/60 bg-card/60">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="grid h-12 w-12 place-items-center rounded-md bg-amber-500/20 text-amber-400">
                <Coins className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Ouro</p>
                <p className="font-display text-3xl">
                  {Number(q.data?.wallet.gold_balance ?? 0).toLocaleString("pt-BR")}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/60 bg-card/60">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="grid h-12 w-12 place-items-center rounded-md bg-violet-500/20 text-violet-400">
                <Gem className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Cristais</p>
                <p className="font-display text-3xl">
                  {Number(q.data?.wallet.premium_balance ?? 0).toLocaleString("pt-BR")}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

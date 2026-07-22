import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Backpack, Sparkles } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getMyCharacter } from "@/lib/character.functions";

export const Route = createFileRoute("/_authenticated/jogo/inventario")({
  head: () => ({
    meta: [
      { title: "Inventário — Aetherfall Online" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: InventarioPage,
});

function InventarioPage() {
  const characterFn = useServerFn(getMyCharacter);
  const q = useQuery({ queryKey: ["me", "character"], queryFn: () => characterFn() });

  if (q.isLoading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10 md:px-6 md:py-14">
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }
  if (!q.data?.character) return <Navigate to="/criar-heroi" replace />;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 md:px-6 md:py-14">
      <header className="mb-6">
        <p className="font-display text-sm uppercase tracking-[0.3em] text-primary">Bastião</p>
        <h1 className="mt-1 font-display text-4xl">Inventário</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Loot obtido em incursões aparecerá aqui. Equipe, funde gemas e forje relíquias raras.
        </p>
      </header>

      <div className="grid grid-cols-4 gap-3 md:grid-cols-6 lg:grid-cols-8">
        {Array.from({ length: 24 }).map((_, i) => (
          <div
            key={i}
            className="aspect-square rounded-md border border-dashed border-border/50 bg-card/30"
          />
        ))}
      </div>

      <Card className="mt-6 border-dashed border-primary/40 bg-card/40">
        <CardContent className="flex flex-wrap items-center justify-between gap-3 p-6">
          <div>
            <p className="flex items-center gap-2 font-display text-sm text-primary">
              <Backpack className="h-4 w-4" /> Sistema de loot em construção
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Itens, forja, gemas e imbuements virão nos próximos ciclos. Por ora, incursões geram XP e ouro.
            </p>
          </div>
          <Button asChild>
            <Link to="/jogo/arena"><Sparkles className="mr-2 h-4 w-4" /> Ir para Incursão</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

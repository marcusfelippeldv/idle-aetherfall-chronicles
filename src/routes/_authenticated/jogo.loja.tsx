import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Coins, ShoppingBag, Shield, Swords, Heart, Zap, Wind } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { listShop, buyItem } from "@/lib/shop.functions";
import { getMyCharacter } from "@/lib/character.functions";
import { RarityBadge } from "@/components/game/RarityBadge";
import { RARITY_CLASSES, SLOT_LABELS, type Rarity, type ItemSlot } from "@/lib/game/rarity";

export const Route = createFileRoute("/_authenticated/jogo/loja")({
  head: () => ({
    meta: [
      { title: "Loja — Aetherfall Online" },
      { name: "description", content: "Compre equipamentos e suprimentos para sua coorte em Aetherfall Online." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: LojaPage,
});

function LojaPage() {
  const qc = useQueryClient();
  const shopFn = useServerFn(listShop);
  const meFn = useServerFn(getMyCharacter);
  const buyFn = useServerFn(buyItem);

  const shopQ = useQuery({ queryKey: ["shop"], queryFn: () => shopFn() });
  const meQ = useQuery({ queryKey: ["me", "character"], queryFn: () => meFn() });

  const buyMut = useMutation({
    mutationFn: (itemId: string) => buyFn({ data: { itemId, quantity: 1 } }),
    onSuccess: (r: any) => {
      toast.success(`${r.name} comprado — -${r.cost} ouro`);
      qc.invalidateQueries({ queryKey: ["me", "character"] });
      qc.invalidateQueries({ queryKey: ["inventory"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : String(e)),
  });

  if (meQ.isLoading || shopQ.isLoading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10 md:px-6 md:py-14">
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }
  if (!meQ.data?.character) return <Navigate to="/criar-heroi" replace />;

  const gold = Number(meQ.data.wallet?.gold_balance ?? 0);
  const items = shopQ.data?.items ?? [];
  const grouped = new Map<string, typeof items>();
  for (const it of items) {
    const g = grouped.get(it.slot) ?? [];
    g.push(it);
    grouped.set(it.slot, g);
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 md:px-6 md:py-14">
      <header className="mb-6 flex items-end justify-between gap-4">
        <div>
          <p className="font-display text-sm uppercase tracking-[0.3em] text-primary">Bazar</p>
          <h1 className="mt-1 font-display text-4xl">Loja</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Equipamentos comuns e incomuns forjados pelos mercadores. Raros e superiores só caem em incursões.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-md border border-border/60 bg-card/50 px-3 py-2">
          <Coins className="h-4 w-4 text-amber-400" />
          <span className="font-display text-lg">{gold.toLocaleString("pt-BR")}</span>
          <span className="text-xs text-muted-foreground">ouro</span>
        </div>
      </header>

      <div className="space-y-8">
        {[...grouped.entries()].map(([slot, list]) => (
          <section key={slot}>
            <h2 className="mb-3 font-display text-lg text-muted-foreground">
              {SLOT_LABELS[slot as ItemSlot] ?? slot}
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {list.map((it) => {
                const cls = RARITY_CLASSES[it.rarity as Rarity];
                const affordable = gold >= it.gold_value;
                return (
                  <Card key={it.id} className={cn("border bg-card/60 transition", cls.border)}>
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className={cn("font-display text-base", cls.text)}>{it.name}</CardTitle>
                        <RarityBadge rarity={it.rarity as Rarity} />
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex flex-wrap gap-1 text-xs text-muted-foreground">
                        {it.attack_bonus  ? <Chip icon={<Swords className="h-3 w-3" />}>+{it.attack_bonus}</Chip> : null}
                        {it.defense_bonus ? <Chip icon={<Shield className="h-3 w-3" />}>+{it.defense_bonus}</Chip> : null}
                        {it.hp_bonus      ? <Chip icon={<Heart className="h-3 w-3" />}>+{it.hp_bonus}</Chip> : null}
                        {it.mana_bonus    ? <Chip icon={<Zap className="h-3 w-3" />}>+{it.mana_bonus}</Chip> : null}
                        {it.speed_bonus   ? <Chip icon={<Wind className="h-3 w-3" />}>+{it.speed_bonus}</Chip> : null}
                        <Chip>Tier {it.tier}</Chip>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1 font-display text-amber-300">
                          <Coins className="h-4 w-4" /> {it.gold_value.toLocaleString("pt-BR")}
                        </span>
                        <Button
                          size="sm"
                          disabled={!affordable || buyMut.isPending}
                          onClick={() => buyMut.mutate(it.id)}
                        >
                          <ShoppingBag className="mr-1 h-3 w-3" />
                          {affordable ? "Comprar" : "Ouro insuf."}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      <div className="mt-8 text-center text-xs text-muted-foreground">
        Procurando algo raro?{" "}
        <Link to="/jogo/arena" className="text-primary hover:underline">
          Enfrente uma incursão
        </Link>{" "}
        — chefes derrubam relíquias lendárias.
      </div>
    </div>
  );
}

function Chip({ icon, children }: { icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded border border-border/50 bg-background/40 px-1.5 py-0.5">
      {icon}
      {children}
    </span>
  );
}

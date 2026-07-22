import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ShoppingBag, Coins } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { listShop, buyItem } from "@/lib/shop.functions";
import { listWallet } from "@/lib/inventory.functions";
import { RARITY_CLASSES, RARITY_LABEL, SLOT_LABELS, type Rarity, type ItemSlot } from "@/lib/game/rarity";

export const Route = createFileRoute("/_authenticated/jogo/loja")({
  head: () => ({
    meta: [
      { title: "Loja — Aetherfall Online" },
      { name: "description", content: "Compre equipamentos e consumíveis para sua equipe." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: LojaPage,
});

function LojaPage() {
  const qc = useQueryClient();
  const list = useServerFn(listShop);
  const wallet = useServerFn(listWallet);
  const buy = useServerFn(buyItem);

  const itemsQ = useQuery({ queryKey: ["shop"], queryFn: () => list() });
  const walletQ = useQuery({ queryKey: ["wallet"], queryFn: () => wallet() });

  const [slotFilter, setSlotFilter] = useState<string>("all");
  const [rarityFilter, setRarityFilter] = useState<string>("all");

  const items = useMemo(() => {
    return (itemsQ.data ?? []).filter((i) =>
      (slotFilter === "all" || i.slot === slotFilter) &&
      (rarityFilter === "all" || i.rarity === rarityFilter),
    );
  }, [itemsQ.data, slotFilter, rarityFilter]);

  const buyMut = useMutation({
    mutationFn: (id: string) => buy({ data: { itemId: id, quantity: 1 } }),
    onSuccess: (r) => {
      toast.success(`Compra confirmada (${r.spent} ouro)`);
      qc.invalidateQueries({ queryKey: ["wallet"] });
      qc.invalidateQueries({ queryKey: ["inventory"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold"><ShoppingBag className="h-6 w-6 text-primary" /> Loja</h1>
          <p className="text-sm text-muted-foreground">Equipe sua coorte para as próximas incursões.</p>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-card/60 px-3 py-2">
          <Coins className="h-4 w-4 text-amber-300" />
          <span className="text-sm font-medium">{walletQ.data?.gold ?? 0} ouro</span>
        </div>
      </header>

      <div className="flex flex-wrap gap-2">
        <Select value={slotFilter} onValueChange={setSlotFilter}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Slot" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os slots</SelectItem>
            {(Object.keys(SLOT_LABELS) as ItemSlot[]).map((s) => (
              <SelectItem key={s} value={s}>{SLOT_LABELS[s]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={rarityFilter} onValueChange={setRarityFilter}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Raridade" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas raridades</SelectItem>
            {(Object.keys(RARITY_LABEL) as Rarity[]).map((r) => (
              <SelectItem key={r} value={r}>{RARITY_LABEL[r]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {itemsQ.isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando catálogo...</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((it) => {
            const r = RARITY_CLASSES[it.rarity as Rarity];
            return (
              <Card key={it.id} className={cn("border bg-card/60", r.border, r.bg)}>
                <CardContent className="flex flex-col gap-2 p-3">
                  <div className={cn("flex h-24 items-center justify-center rounded-md border bg-background/50", r.border)}>
                    {it.icon_url ? (
                      <img src={it.icon_url} alt={it.name} className="h-20 w-20 object-contain" loading="lazy" />
                    ) : (
                      <span className="text-xs text-muted-foreground">Sem ícone</span>
                    )}
                  </div>
                  <div className="min-h-[3rem]">
                    <p className="text-sm font-semibold leading-tight">{it.name}</p>
                    <p className={cn("text-xs", r.text)}>{RARITY_LABEL[it.rarity as Rarity]} · {SLOT_LABELS[it.slot as ItemSlot]}</p>
                  </div>
                  <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
                    {it.attack_bonus ? <span>ATK +{it.attack_bonus}</span> : null}
                    {it.defense_bonus ? <span>DEF +{it.defense_bonus}</span> : null}
                    {it.hp_bonus ? <span>HP +{it.hp_bonus}</span> : null}
                    {it.mana_bonus ? <span>MANA +{it.mana_bonus}</span> : null}
                    {it.speed_bonus ? <span>SPD +{it.speed_bonus}</span> : null}
                  </div>
                  {it.class_restriction?.length ? (
                    <p className="text-[10px] uppercase tracking-wide text-amber-300/80">Exclusivo: {it.class_restriction.join(", ")}</p>
                  ) : null}
                  <Button
                    size="sm"
                    className="mt-auto"
                    disabled={buyMut.isPending || (walletQ.data?.gold ?? 0) < it.gold_value}
                    onClick={() => buyMut.mutate(it.id)}
                  >
                    <Coins className="mr-1 h-3.5 w-3.5" /> {it.gold_value}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

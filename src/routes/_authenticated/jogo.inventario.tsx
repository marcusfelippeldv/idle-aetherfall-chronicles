import { useMemo, useState } from "react";
import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Backpack, Coins, Package, ShieldCheck, Sparkles, Swords } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { listInventory, equipItem, unequipItem, sellItem } from "@/lib/inventory.functions";
import { getMyCharacter } from "@/lib/character.functions";
import { RarityBadge } from "@/components/game/RarityBadge";
import {
  RARITY_CLASSES,
  RARITY_ORDER,
  SLOT_LABELS,
  type Rarity,
  type EquipSlot,
} from "@/lib/game/rarity";

export const Route = createFileRoute("/_authenticated/jogo/inventario")({
  head: () => ({
    meta: [
      { title: "Inventário — Aetherfall Online" },
      { name: "description", content: "Gerencie itens, equipe relíquias e venda excedentes em Aetherfall Online." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: InventarioPage,
});

const RARITY_FILTERS: (Rarity | "todas")[] = ["todas", ...RARITY_ORDER];

function InventarioPage() {
  const qc = useQueryClient();
  const meFn = useServerFn(getMyCharacter);
  const invFn = useServerFn(listInventory);
  const equipFn = useServerFn(equipItem);
  const unequipFn = useServerFn(unequipItem);
  const sellFn = useServerFn(sellItem);

  const meQ = useQuery({ queryKey: ["me", "character"], queryFn: () => meFn() });
  const invQ = useQuery({ queryKey: ["inventory"], queryFn: () => invFn() });

  const [rarity, setRarity] = useState<Rarity | "todas">("todas");
  const [slotF, setSlotF] = useState<string>("todos");

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["me", "character"] });
    qc.invalidateQueries({ queryKey: ["inventory"] });
  };
  const equipMut = useMutation({
    mutationFn: (inventoryId: string) => equipFn({ data: { inventoryId } }),
    onSuccess: () => { toast.success("Equipado"); invalidate(); },
    onError: (e) => toast.error(e instanceof Error ? e.message : String(e)),
  });
  const unequipMut = useMutation({
    mutationFn: (slot: EquipSlot) => unequipFn({ data: { slot } }),
    onSuccess: () => { toast.info("Desequipado"); invalidate(); },
    onError: (e) => toast.error(e instanceof Error ? e.message : String(e)),
  });
  const sellMut = useMutation({
    mutationFn: (inventoryId: string) => sellFn({ data: { inventoryId } }),
    onSuccess: (r: any) => { toast.success(`Vendido: +${r.gold} ouro`); invalidate(); },
    onError: (e) => toast.error(e instanceof Error ? e.message : String(e)),
  });

  const filtered = useMemo(() => {
    return (invQ.data?.items ?? []).filter(
      (r) =>
        (rarity === "todas" || r.item.rarity === rarity) &&
        (slotF === "todos" || r.item.slot === slotF),
    );
  }, [invQ.data, rarity, slotF]);

  if (meQ.isLoading || invQ.isLoading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10 md:px-6 md:py-14">
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }
  if (!meQ.data?.character) return <Navigate to="/criar-heroi" replace />;

  const items = invQ.data?.items ?? [];
  const slots = Array.from(new Set(items.map((r) => r.item.slot)));

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 md:px-6 md:py-14">
      <header className="mb-6 flex items-end justify-between gap-4 flex-wrap">
        <div>
          <p className="font-display text-sm uppercase tracking-[0.3em] text-primary">Bastião</p>
          <h1 className="mt-1 font-display text-4xl">Inventário</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {items.length} item(ns) coletado(s). Equipe as melhores relíquias no{" "}
            <Link to="/jogo/heroi" className="text-primary hover:underline">painel do herói</Link>.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            className="rounded border border-border/60 bg-background px-2 py-1 text-sm"
            value={rarity}
            onChange={(e) => setRarity(e.target.value as any)}
          >
            {RARITY_FILTERS.map((r) => (
              <option key={r} value={r}>
                {r === "todas" ? "Todas raridades" : r.charAt(0).toUpperCase() + r.slice(1)}
              </option>
            ))}
          </select>
          <select
            className="rounded border border-border/60 bg-background px-2 py-1 text-sm"
            value={slotF}
            onChange={(e) => setSlotF(e.target.value)}
          >
            <option value="todos">Todos slots</option>
            {slots.map((s) => (
              <option key={s} value={s}>{SLOT_LABELS[s as keyof typeof SLOT_LABELS] ?? s}</option>
            ))}
          </select>
        </div>
      </header>

      {items.length === 0 ? (
        <Card className="border-dashed border-primary/40 bg-card/40">
          <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
            <Backpack className="h-10 w-10 text-primary/60" />
            <p className="font-display text-lg">Sacolas vazias</p>
            <p className="max-w-md text-sm text-muted-foreground">
              Enfrente incursões para receber loot ou visite a loja para adquirir itens iniciais.
            </p>
            <div className="flex gap-2">
              <Button asChild><Link to="/jogo/arena"><Sparkles className="mr-2 h-4 w-4" />Iniciar incursão</Link></Button>
              <Button asChild variant="outline"><Link to="/jogo/loja"><Coins className="mr-2 h-4 w-4" />Visitar loja</Link></Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((row) => {
            const cls = RARITY_CLASSES[row.item.rarity as Rarity];
            const canEquip = ["arma","ofmao","elmo","peito","pernas","pes","amuleto","anel"].includes(row.item.slot);
            return (
              <Card key={row.id} className={cn("border bg-card/60", cls.border, row.equippedSlot && "ring-1", row.equippedSlot && cls.ring)}>
                <CardContent className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={cn("font-display text-base", cls.text)}>{row.item.name}</span>
                        {row.quantity > 1 && <span className="text-xs text-muted-foreground">×{row.quantity}</span>}
                      </div>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        {SLOT_LABELS[row.item.slot as keyof typeof SLOT_LABELS] ?? row.item.slot} · Tier {row.item.tier}
                      </p>
                    </div>
                    <RarityBadge rarity={row.item.rarity as Rarity} />
                  </div>

                  <div className="flex flex-wrap gap-1 text-[10px] text-muted-foreground">
                    {row.item.attack_bonus  ? <span>ATK +{row.item.attack_bonus}</span> : null}
                    {row.item.defense_bonus ? <span>DEF +{row.item.defense_bonus}</span> : null}
                    {row.item.hp_bonus      ? <span>HP +{row.item.hp_bonus}</span> : null}
                    {row.item.mana_bonus    ? <span>MP +{row.item.mana_bonus}</span> : null}
                    {row.item.speed_bonus   ? <span>VEL +{row.item.speed_bonus}</span> : null}
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1 text-xs text-amber-300">
                      <Coins className="h-3 w-3" /> vende por {row.item.sell_price}
                    </span>
                    <div className="flex gap-1">
                      {row.equippedSlot ? (
                        <Button size="sm" variant="outline" onClick={() => unequipMut.mutate(row.equippedSlot!)}>
                          <ShieldCheck className="mr-1 h-3 w-3" />Desequipar
                        </Button>
                      ) : canEquip ? (
                        <Button size="sm" onClick={() => equipMut.mutate(row.id)}>
                          <Swords className="mr-1 h-3 w-3" />Equipar
                        </Button>
                      ) : null}
                      <Button size="sm" variant="ghost" onClick={() => sellMut.mutate(row.id)}>
                        <Package className="mr-1 h-3 w-3" />Vender
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

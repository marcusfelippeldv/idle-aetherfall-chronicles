import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Backpack, Shield, Coins } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { listInventory, equipItem, unequipItem } from "@/lib/inventory.functions";
import { sellItem } from "@/lib/shop.functions";
import { getMyHeroes } from "@/lib/hero.functions";
import { RARITY_CLASSES, RARITY_LABEL, SLOT_LABELS, EQUIP_SLOTS, type Rarity, type ItemSlot, type EquipSlot } from "@/lib/game/rarity";

export const Route = createFileRoute("/_authenticated/jogo/inventario")({
  head: () => ({
    meta: [
      { title: "Inventário — Aetherfall Online" },
      { name: "description", content: "Gerencie seus itens, equipamentos e vendas." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: InventarioPage,
});

function InventarioPage() {
  const qc = useQueryClient();
  const listInv = useServerFn(listInventory);
  const listHeroes = useServerFn(getMyHeroes);
  const equip = useServerFn(equipItem);
  const unequip = useServerFn(unequipItem);
  const sell = useServerFn(sellItem);

  const invQ = useQuery({ queryKey: ["inventory"], queryFn: () => listInv() });
  const heroesQ = useQuery({ queryKey: ["my-heroes"], queryFn: () => listHeroes() });

  const [selectedHero, setSelectedHero] = useState<string>("");
  const heroes = heroesQ.data ?? [];
  const currentHero = heroes.find((h) => h.id === (selectedHero || heroes[0]?.id));

  const invById = useMemo(() => new Map(invQ.data?.map((r) => [r.id, r]) ?? []), [invQ.data]);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["inventory"] });
    qc.invalidateQueries({ queryKey: ["my-heroes"] });
    qc.invalidateQueries({ queryKey: ["wallet"] });
  };

  const equipMut = useMutation({
    mutationFn: (inventoryId: string) => equip({ data: { heroId: currentHero!.id, inventoryId } }),
    onSuccess: () => { toast.success("Item equipado"); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });
  const unequipMut = useMutation({
    mutationFn: (slot: EquipSlot) => unequip({ data: { heroId: currentHero!.id, slot } }),
    onSuccess: () => { toast.success("Item desequipado"); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });
  const sellMut = useMutation({
    mutationFn: (inventoryId: string) => sell({ data: { inventoryId, quantity: 1 } }),
    onSuccess: (r) => { toast.success(`+${r.gold} ouro`); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="flex items-center gap-2 text-2xl font-semibold"><Backpack className="h-6 w-6 text-primary" /> Inventário</h1>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Equipar em:</span>
          <Select value={currentHero?.id ?? ""} onValueChange={setSelectedHero}>
            <SelectTrigger className="w-56"><SelectValue placeholder="Selecione um herói" /></SelectTrigger>
            <SelectContent>
              {heroes.map((h) => (
                <SelectItem key={h.id} value={h.id}>{h.name} — {h.class_slug}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </header>

      {currentHero ? (
        <Card className="border border-border/60 bg-card/60">
          <CardContent className="p-4">
            <p className="mb-3 flex items-center gap-2 text-sm font-medium"><Shield className="h-4 w-4 text-primary" /> Equipamentos de {currentHero.name}</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8">
              {EQUIP_SLOTS.map((slot) => {
                const invId = (currentHero as unknown as Record<string, string | null>)[`equipped_${slot}`] ?? null;
                const inv = invId ? invById.get(invId) : null;
                const r = inv?.items ? RARITY_CLASSES[inv.items.rarity as Rarity] : null;
                return (
                  <div key={slot} className={cn("flex flex-col items-center gap-1 rounded-md border bg-background/40 p-2", r?.border ?? "border-border/60")}>
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{SLOT_LABELS[slot]}</p>
                    <div className="flex h-14 w-14 items-center justify-center rounded border border-border/50 bg-background/60">
                      {inv?.items?.icon_url ? <img src={inv.items.icon_url} alt="" className="h-12 w-12 object-contain" /> : <span className="text-[10px] text-muted-foreground">vazio</span>}
                    </div>
                    <p className="min-h-[1rem] truncate text-[11px]">{inv?.items?.name ?? "—"}</p>
                    {inv ? (
                      <Button size="sm" variant="ghost" className="h-6 px-2 text-[11px]" onClick={() => unequipMut.mutate(slot)}>Remover</Button>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ) : null}

      <div>
        <p className="mb-2 text-sm font-medium">Mochila ({invQ.data?.length ?? 0} itens)</p>
        {invQ.isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando...</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {(invQ.data ?? []).map((row) => {
              if (!row.items) return null;
              const r = RARITY_CLASSES[row.items.rarity as Rarity];
              const equipable = EQUIP_SLOTS.includes(row.items.slot as EquipSlot);
              const classOk = !row.items.class_restriction?.length || (currentHero && row.items.class_restriction.includes(currentHero.class_slug));
              return (
                <Card key={row.id} className={cn("border bg-card/60", r.border, r.bg)}>
                  <CardContent className="flex flex-col gap-2 p-3">
                    <div className={cn("flex h-20 items-center justify-center rounded border bg-background/50", r.border)}>
                      {row.items.icon_url ? <img src={row.items.icon_url} alt={row.items.name} className="h-16 w-16 object-contain" loading="lazy" /> : <span className="text-xs text-muted-foreground">sem ícone</span>}
                    </div>
                    <p className="text-sm font-semibold leading-tight">{row.items.name}</p>
                    <p className={cn("text-xs", r.text)}>{RARITY_LABEL[row.items.rarity as Rarity]} · {SLOT_LABELS[row.items.slot as ItemSlot]} {row.quantity > 1 ? `· x${row.quantity}` : ""}</p>
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
                      {row.items.attack_bonus ? <span>ATK +{row.items.attack_bonus}</span> : null}
                      {row.items.defense_bonus ? <span>DEF +{row.items.defense_bonus}</span> : null}
                      {row.items.hp_bonus ? <span>HP +{row.items.hp_bonus}</span> : null}
                      {row.items.mana_bonus ? <span>MANA +{row.items.mana_bonus}</span> : null}
                    </div>
                    <div className="mt-auto flex gap-2">
                      {equipable ? (
                        <Button size="sm" className="flex-1" disabled={!classOk || !currentHero || equipMut.isPending} onClick={() => equipMut.mutate(row.id)}>
                          {classOk ? "Equipar" : "Classe errada"}
                        </Button>
                      ) : null}
                      <Button size="sm" variant="outline" className="flex-1" disabled={sellMut.isPending} onClick={() => sellMut.mutate(row.id)}>
                        <Coins className="mr-1 h-3.5 w-3.5" /> {row.items.sell_price}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

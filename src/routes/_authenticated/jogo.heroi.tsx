import { useMemo, useState } from "react";
import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Coins, Heart, Package, Shield, Swords, Wind, Zap, X } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { listInventory, equipItem, unequipItem } from "@/lib/inventory.functions";
import { getMyCharacter } from "@/lib/character.functions";
import { RarityBadge } from "@/components/game/RarityBadge";
import {
  EQUIP_SLOTS,
  RARITY_CLASSES,
  SLOT_LABELS,
  type EquipSlot,
  type Rarity,
} from "@/lib/game/rarity";

export const Route = createFileRoute("/_authenticated/jogo/heroi")({
  head: () => ({
    meta: [
      { title: "Herói — Aetherfall Online" },
      { name: "description", content: "Equipe seu herói e visualize os atributos totais em Aetherfall Online." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: HeroiPage,
});

function HeroiPage() {
  const qc = useQueryClient();
  const meFn = useServerFn(getMyCharacter);
  const invFn = useServerFn(listInventory);
  const equipFn = useServerFn(equipItem);
  const unequipFn = useServerFn(unequipItem);

  const meQ = useQuery({ queryKey: ["me", "character"], queryFn: () => meFn() });
  const invQ = useQuery({ queryKey: ["inventory"], queryFn: () => invFn() });
  const [openSlot, setOpenSlot] = useState<EquipSlot | null>(null);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["me", "character"] });
    qc.invalidateQueries({ queryKey: ["inventory"] });
  };
  const equipMut = useMutation({
    mutationFn: (inventoryId: string) => equipFn({ data: { inventoryId } }),
    onSuccess: () => { toast.success("Item equipado"); setOpenSlot(null); invalidate(); },
    onError: (e) => toast.error(e instanceof Error ? e.message : String(e)),
  });
  const unequipMut = useMutation({
    mutationFn: (slot: EquipSlot) => unequipFn({ data: { slot } }),
    onSuccess: () => { toast.info("Item desequipado"); invalidate(); },
    onError: (e) => toast.error(e instanceof Error ? e.message : String(e)),
  });

  const equippedRows = useMemo(() => {
    const map = new Map<EquipSlot, any>();
    for (const row of invQ.data?.items ?? []) {
      if (row.equippedSlot) map.set(row.equippedSlot, row);
    }
    return map;
  }, [invQ.data]);

  const bonuses = useMemo(() => {
    const b = { attack: 0, defense: 0, hp: 0, mana: 0, speed: 0 };
    for (const [, row] of equippedRows) {
      b.attack  += row.item.attack_bonus;
      b.defense += row.item.defense_bonus;
      b.hp      += row.item.hp_bonus;
      b.mana    += row.item.mana_bonus;
      b.speed   += row.item.speed_bonus;
    }
    return b;
  }, [equippedRows]);

  if (meQ.isLoading || invQ.isLoading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10 md:px-6 md:py-14">
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }
  if (!meQ.data?.character) return <Navigate to="/criar-heroi" replace />;

  const character = meQ.data.character as any;
  const arche = Array.isArray(character.archetypes) ? character.archetypes[0] : character.archetypes;

  const compatible = (invQ.data?.items ?? []).filter(
    (r) => openSlot && r.item.slot === openSlot && r.equippedSlot !== openSlot,
  );

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 md:px-6 md:py-14">
      <header className="mb-6">
        <p className="font-display text-sm uppercase tracking-[0.3em] text-primary">Bastião</p>
        <h1 className="mt-1 font-display text-4xl">Herói</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Equipe {character.name} para dominar as incursões. Itens equipados somam bônus aos atributos base.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Card className="border-primary/30 bg-gradient-to-br from-card via-card to-primary/5">
          <CardContent className="p-6">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {EQUIP_SLOTS.map((slot) => {
                const row = equippedRows.get(slot);
                const cls = row ? RARITY_CLASSES[row.item.rarity as Rarity] : null;
                return (
                  <button
                    key={slot}
                    onClick={() => setOpenSlot(slot)}
                    className={cn(
                      "group flex aspect-square flex-col items-center justify-center gap-1 rounded-lg border p-2 text-center transition hover:border-primary/60",
                      row && cls ? `${cls.border} ${cls.bg}` : "border-dashed border-border/60 bg-background/30",
                    )}
                  >
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      {SLOT_LABELS[slot]}
                    </span>
                    {row ? (
                      <>
                        {row.item.icon_url ? (
                          <img src={row.item.icon_url} alt="" className="h-10 w-10 object-contain" />
                        ) : null}
                        <span className={cn("line-clamp-1 font-display text-xs", cls?.text)}>{row.item.name}</span>
                        <RarityBadge rarity={row.item.rarity as Rarity} />
                      </>
                    ) : (
                      <span className="font-display text-xs text-muted-foreground">Vazio</span>
                    )}
                  </button>

                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/60">
          <CardContent className="p-6">
            <p className="font-display text-xs uppercase tracking-[0.3em] text-primary">{arche?.name}</p>
            <h2 className="mt-1 font-display text-2xl">{character.name}</h2>
            <p className="mt-1 text-xs text-muted-foreground">Nível {character.level}</p>

            <div className="mt-4 space-y-2">
              <StatLine icon={<Heart className="h-3 w-3" />} label="HP máx"
                base={character.max_hp} bonus={bonuses.hp} />
              <StatLine icon={<Zap className="h-3 w-3" />} label="Mana"
                base={character.max_mana} bonus={bonuses.mana} />
              <StatLine icon={<Swords className="h-3 w-3" />} label="Ataque"
                base={character.attack} bonus={bonuses.attack} />
              <StatLine icon={<Shield className="h-3 w-3" />} label="Defesa"
                base={character.defense} bonus={bonuses.defense} />
              <StatLine icon={<Wind className="h-3 w-3" />} label="Velocidade"
                base={character.speed} bonus={bonuses.speed} />
            </div>

            <Button asChild variant="outline" size="sm" className="mt-4 w-full">
              <Link to="/jogo/inventario"><Package className="mr-1 h-3 w-3" /> Ver inventário</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {openSlot ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setOpenSlot(null)}
        >
          <Card
            className="w-full max-w-lg border-primary/30 bg-card"
            onClick={(e) => e.stopPropagation()}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-lg">{SLOT_LABELS[openSlot]}</h3>
                <button onClick={() => setOpenSlot(null)} className="rounded p-1 hover:bg-muted">
                  <X className="h-4 w-4" />
                </button>
              </div>
              {equippedRows.get(openSlot) ? (
                <div className="mt-3">
                  <p className="text-xs text-muted-foreground">Equipado agora</p>
                  <div className="mt-1 flex items-center justify-between rounded border border-border/60 p-2">
                    <span className="text-sm">{equippedRows.get(openSlot)!.item.name}</span>
                    <Button size="sm" variant="outline" onClick={() => unequipMut.mutate(openSlot)}>
                      Desequipar
                    </Button>
                  </div>
                </div>
              ) : null}
              <p className="mt-4 text-xs text-muted-foreground">Compatíveis no inventário</p>
              <div className="mt-2 max-h-80 space-y-2 overflow-y-auto">
                {compatible.length === 0 ? (
                  <p className="rounded border border-dashed border-border/50 p-4 text-center text-sm text-muted-foreground">
                    Nenhum item de {SLOT_LABELS[openSlot].toLowerCase()} no inventário.
                  </p>
                ) : (
                  compatible.map((row) => {
                    const cls = RARITY_CLASSES[row.item.rarity as Rarity];
                    return (
                      <div
                        key={row.id}
                        className={cn("flex items-center justify-between gap-2 rounded border p-2", cls.border, cls.bg)}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {row.item.icon_url ? (
                            <img src={row.item.icon_url} alt="" className="h-10 w-10 shrink-0 object-contain" />
                          ) : null}
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className={cn("truncate font-display text-sm", cls.text)}>{row.item.name}</span>
                              <RarityBadge rarity={row.item.rarity as Rarity} />
                            </div>
                            <div className="mt-1 flex flex-wrap gap-1 text-[10px] text-muted-foreground">
                              {row.item.attack_bonus  ? <span>ATK +{row.item.attack_bonus}</span> : null}
                              {row.item.defense_bonus ? <span>DEF +{row.item.defense_bonus}</span> : null}
                              {row.item.hp_bonus      ? <span>HP +{row.item.hp_bonus}</span> : null}
                              {row.item.mana_bonus    ? <span>MP +{row.item.mana_bonus}</span> : null}
                              {row.item.speed_bonus   ? <span>VEL +{row.item.speed_bonus}</span> : null}
                            </div>
                          </div>
                        </div>
                        <Button size="sm" onClick={() => equipMut.mutate(row.id)}>Equipar</Button>
                      </div>
                    );
                  })

                )}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}

function StatLine({
  icon, label, base, bonus,
}: { icon: React.ReactNode; label: string; base: number; bonus: number }) {
  return (
    <div className="flex items-center justify-between rounded border border-border/50 bg-background/30 px-3 py-1.5 text-sm">
      <span className="flex items-center gap-2 text-muted-foreground">{icon}{label}</span>
      <span className="font-display">
        {base + bonus}
        {bonus > 0 ? <span className="ml-1 text-xs text-emerald-400">(+{bonus})</span> : null}
      </span>
    </div>
  );
}



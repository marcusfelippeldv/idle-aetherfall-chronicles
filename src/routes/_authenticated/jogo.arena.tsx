import { useEffect, useState } from "react";
import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  Coins,
  Gem,
  Heart,
  Shield,
  Sparkles,
  Swords,
  Wind,
  Timer,
  Package,
  MapPin,
  Skull,
  Award,
  CalendarDays,
  MessageCircle,
  Flame,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { getMyProfile } from "@/lib/admin.functions";
import { getMyCharacter } from "@/lib/character.functions";
import { listRegions } from "@/lib/catalog.functions";
import {
  cancelExpedition,
  claimExpedition,
  startExpedition,
} from "@/lib/expedition.functions";
import {
  equipItem,
  getInventory,
  sellItem,
  unequipItem,
} from "@/lib/inventory.functions";
import { fightBoss } from "@/lib/combat.functions";
import { CombatStage } from "@/components/arena/CombatStage";
import { PatrolScene } from "@/components/arena/PatrolScene";
import { AnimatedNumber } from "@/components/ui/animated-number";

export const Route = createFileRoute("/_authenticated/jogo/arena")({
  head: () => ({
    meta: [
      { title: "Arena — Aetherfall Online" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ArenaPage,
});

const RARITY_COLORS: Record<string, string> = {
  common: "text-slate-300 border-slate-500/40",
  uncommon: "text-emerald-300 border-emerald-500/40",
  rare: "text-sky-300 border-sky-500/40",
  epic: "text-violet-300 border-violet-500/40",
  legendary: "text-amber-300 border-amber-500/40",
};

const RARITY_LABEL: Record<string, string> = {
  common: "Comum",
  uncommon: "Incomum",
  rare: "Raro",
  epic: "Épico",
  legendary: "Lendário",
};

function ArenaPage() {
  const characterFn = useServerFn(getMyCharacter);
  const profileFn = useServerFn(getMyProfile);
  const characterQ = useQuery({ queryKey: ["me", "character"], queryFn: () => characterFn(), refetchInterval: 15_000 });
  const profileQ = useQuery({ queryKey: ["me", "profile"], queryFn: () => profileFn() });

  if (characterQ.isLoading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10 md:px-6 md:py-14 space-y-4">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  const character = characterQ.data?.character;
  if (!character) {
    if (characterQ.isFetching) {
      return (
        <div className="mx-auto max-w-6xl px-4 py-10 md:px-6 md:py-14 space-y-4">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      );
    }
    return <Navigate to="/criar-heroi" replace />;
  }


  const expedition = characterQ.data?.expedition ?? null;
  const wallet = profileQ.data?.wallet;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 md:px-6 md:py-14">
      <div className="mb-4 flex flex-wrap justify-end gap-2">
        <Button asChild variant="outline" size="sm">
          <Link to="/jogo/diario"><CalendarDays className="mr-2 h-4 w-4" /> Diário</Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link to="/jogo/conquistas"><Award className="mr-2 h-4 w-4" /> Conquistas</Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link to="/jogo/temporada"><Sparkles className="mr-2 h-4 w-4" /> Temporada</Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link to="/jogo/guilda"><Shield className="mr-2 h-4 w-4" /> Guilda</Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link to="/jogo/chat"><MessageCircle className="mr-2 h-4 w-4" /> Chat</Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link to="/jogo/raides"><Flame className="mr-2 h-4 w-4" /> Raides</Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link to="/jogo/loja"><Gem className="mr-2 h-4 w-4" /> Loja</Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link to="/jogo/carteira"><Coins className="mr-2 h-4 w-4" /> Carteira</Link>
        </Button>
      </div>
      <HeroHeader character={character} wallet={wallet} />

      <Tabs defaultValue="expedicoes" className="mt-8">
        <TabsList className="grid w-full grid-cols-3 max-w-lg">
          <TabsTrigger value="expedicoes">
            <MapPin className="mr-2 h-4 w-4" /> Expedições
          </TabsTrigger>
          <TabsTrigger value="inventario">
            <Package className="mr-2 h-4 w-4" /> Inventário
          </TabsTrigger>
          <TabsTrigger value="combate">
            <Skull className="mr-2 h-4 w-4" /> Chefes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="expedicoes" className="mt-6">
          <ExpeditionsPanel character={character} expedition={expedition} classSlug={character.classes?.slug} />
        </TabsContent>
        <TabsContent value="inventario" className="mt-6">
          <InventoryPanel />
        </TabsContent>
        <TabsContent value="combate" className="mt-6">
          <BossPanel character={character} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function HeroHeader({ character, wallet }: { character: any; wallet: any }) {
  const cls = character.classes;
  const xpNext = Math.round(50 * Math.pow(character.level, 1.8));
  const xpPct = Math.min(100, Math.round((Number(character.current_xp) / xpNext) * 100));
  return (
    <Card className="border-primary/30 bg-gradient-to-br from-card via-card to-primary/5">
      <CardContent className="grid gap-6 p-6 md:grid-cols-[1fr_auto]">
        <div>
          <p className="font-display text-xs uppercase tracking-[0.3em] text-primary">
            {cls?.name}
          </p>
          <h1 className="font-display text-4xl">{character.name}</h1>
          <div className="mt-3 flex items-center gap-3">
            <Badge className="bg-primary/20 text-primary" variant="outline">
              Nível {character.level}
            </Badge>
            <div className="flex-1 max-w-xs">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>XP</span>
                <span>{Number(character.current_xp)} / {xpNext}</span>
              </div>
              <Progress value={xpPct} className="h-1.5" />
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <StatChip icon={<Heart className="h-3 w-3" />} label="HP" value={`${character.current_hp}/${character.max_hp}`} />
            <StatChip icon={<Swords className="h-3 w-3" />} label="ATK" value={character.attack} />
            <StatChip icon={<Shield className="h-3 w-3" />} label="DEF" value={character.defense} />
            <StatChip icon={<Wind className="h-3 w-3" />} label="VEL" value={character.speed} />
            <StatChip icon={<Sparkles className="h-3 w-3" />} label="Poder" value={character.power} />
          </div>
        </div>
        <div className="grid content-start gap-2 md:text-right">
          <div className="flex items-center gap-2 md:justify-end">
            <Coins className="h-4 w-4 text-amber-400" />
            <AnimatedNumber value={Number(wallet?.gold_balance ?? 0)} className="font-display text-xl" />
            <span className="text-xs text-muted-foreground">ouro</span>
          </div>
          <div className="flex items-center gap-2 md:justify-end">
            <Gem className="h-4 w-4 text-violet-400" />
            <AnimatedNumber value={Number(wallet?.premium_balance ?? 0)} className="font-display text-xl" />
            <span className="text-xs text-muted-foreground">cristais</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StatChip({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded border border-border/60 bg-background/40 px-2 py-1 text-xs">
      {icon}
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </span>
  );
}

/* --------------------------- Expeditions --------------------------- */

function ExpeditionsPanel({ character, expedition, classSlug }: { character: any; expedition: any; classSlug?: string }) {
  const qc = useQueryClient();
  const regionsFn = useServerFn(listRegions);
  const startFn = useServerFn(startExpedition);
  const claimFn = useServerFn(claimExpedition);
  const cancelFn = useServerFn(cancelExpedition);
  const regionsQ = useQuery({ queryKey: ["catalog", "regions"], queryFn: () => regionsFn() });
  const [duration, setDuration] = useState(5);

  const invalidateAll = () => {
    qc.invalidateQueries({ queryKey: ["me", "character"] });
    qc.invalidateQueries({ queryKey: ["me", "profile"] });
    qc.invalidateQueries({ queryKey: ["me", "inventory"] });
  };

  const startMut = useMutation({
    mutationFn: (input: { regionId: string; durationMinutes: number }) => startFn({ data: input }),
    onSuccess: () => { toast.success("Expedição iniciada!"); invalidateAll(); },
    onError: (e) => toast.error(e instanceof Error ? e.message : String(e)),
  });
  const claimMut = useMutation({
    mutationFn: (id: string) => claimFn({ data: { expeditionId: id } }),
    onSuccess: (r) => {
      if ((r as any).alreadyClaimed) toast.info("Recompensa já reclamada.");
      else {
        toast.success(`+${(r as any).xp} XP · +${(r as any).gold} ouro`);
        if ((r as any).leveledUp) toast.success(`Nível ${(r as any).newLevel}!`);
      }
      invalidateAll();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : String(e)),
  });
  const cancelMut = useMutation({
    mutationFn: (id: string) => cancelFn({ data: { expeditionId: id } }),
    onSuccess: () => { toast.info("Expedição cancelada."); invalidateAll(); },
    onError: (e) => toast.error(e instanceof Error ? e.message : String(e)),
  });

  if (expedition) {
    return <ActiveExpeditionCard expedition={expedition} classSlug={classSlug} onClaim={() => claimMut.mutate(expedition.id)} onCancel={() => cancelMut.mutate(expedition.id)} loading={claimMut.isPending || cancelMut.isPending} />;
  }

  const durations = [1, 5, 15, 30];

  return (
    <div className="space-y-6">
      <Card className="border-border/60 bg-card/60">
        <CardHeader>
          <CardTitle className="font-display text-lg">Duração da expedição</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {durations.map((d) => (
              <Button key={d} variant={duration === d ? "default" : "outline"} size="sm" onClick={() => setDuration(d)}>
                {d} min
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {(regionsQ.data ?? []).map((r) => {
          const locked = character.level < r.required_level;
          return (
            <Card key={r.id} className={cn("border-border/60 bg-card/60", locked && "opacity-60")}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="font-display text-lg">{r.name}</CardTitle>
                  <Badge variant="outline" className="text-xs">Nv. {r.required_level}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">{r.description}</p>
                <Button className="w-full" disabled={locked || startMut.isPending} onClick={() => startMut.mutate({ regionId: r.id, durationMinutes: duration })}>
                  {locked ? `Requer nível ${r.required_level}` : `Explorar (${duration} min)`}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function ActiveExpeditionCard({ expedition, onClaim, onCancel, loading, classSlug }: { expedition: any; onClaim: () => void; onCancel: () => void; loading: boolean; classSlug?: string }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const endMs = new Date(expedition.expected_end_at).getTime();
  const startMs = new Date(expedition.started_at).getTime();
  const total = endMs - startMs;
  const elapsed = Math.min(total, now - startMs);
  const remainingS = Math.max(0, Math.ceil((endMs - now) / 1000));
  const pct = Math.min(100, (elapsed / total) * 100);
  const done = remainingS === 0;
  const region = expedition.regions;

  const mm = Math.floor(remainingS / 60).toString().padStart(2, "0");
  const ss = (remainingS % 60).toString().padStart(2, "0");

  return (
    <Card className="border-primary/40 bg-gradient-to-br from-card via-card to-primary/10">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="font-display text-2xl">{region?.name}</CardTitle>
          <Badge className="bg-primary/20 text-primary" variant="outline">
            <Timer className="mr-1 h-3 w-3" /> {done ? "Concluída" : `${mm}:${ss}`}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <PatrolScene regionSlug={region?.slug} classSlug={classSlug} progress={pct / 100} />
        <Progress value={pct} className="h-2" />
        <p className="text-sm text-muted-foreground">
          Seu herói explora <strong className="text-foreground">{region?.name}</strong> por {expedition.duration_minutes} minutos.
        </p>
        <div className="flex gap-2">
          <Button onClick={onClaim} disabled={!done || loading} className="flex-1">
            {done ? (loading ? "Reclamando…" : "Reclamar recompensa") : "Aguarde…"}
          </Button>
          {!done && (
            <Button variant="outline" onClick={onCancel} disabled={loading}>Cancelar</Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/* --------------------------- Inventory --------------------------- */

function InventoryPanel() {
  const qc = useQueryClient();
  const invFn = useServerFn(getInventory);
  const equipFn = useServerFn(equipItem);
  const unequipFn = useServerFn(unequipItem);
  const sellFn = useServerFn(sellItem);
  const invQ = useQuery({ queryKey: ["me", "inventory"], queryFn: () => invFn() });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["me", "inventory"] });
    qc.invalidateQueries({ queryKey: ["me", "character"] });
    qc.invalidateQueries({ queryKey: ["me", "profile"] });
  };

  const equipMut = useMutation({
    mutationFn: (id: string) => equipFn({ data: { inventoryItemId: id } }),
    onSuccess: () => { toast.success("Equipado."); invalidate(); },
    onError: (e) => toast.error(e instanceof Error ? e.message : String(e)),
  });
  const unequipMut = useMutation({
    mutationFn: (id: string) => unequipFn({ data: { inventoryItemId: id } }),
    onSuccess: () => { toast.info("Desequipado."); invalidate(); },
    onError: (e) => toast.error(e instanceof Error ? e.message : String(e)),
  });
  const sellMut = useMutation({
    mutationFn: (id: string) => sellFn({ data: { inventoryItemId: id } }),
    onSuccess: (r) => { toast.success(`Vendido por ${r.gold} ouro.`); invalidate(); },
    onError: (e) => toast.error(e instanceof Error ? e.message : String(e)),
  });

  if (invQ.isLoading) return <Skeleton className="h-64 w-full" />;
  const items = invQ.data?.items ?? [];
  if (items.length === 0) {
    return (
      <Card className="border-dashed border-border/60 bg-card/40">
        <CardContent className="p-10 text-center text-sm text-muted-foreground">
          Seu inventário está vazio. Explore regiões para coletar itens.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
      {items.map((row: any) => {
        const it = row.items;
        if (!it) return null;
        return (
          <Card key={row.id} className={cn("border-border/60 bg-card/60", row.equipped && "border-primary/60 shadow-gold")}>
            <CardContent className="space-y-3 p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="font-display">{it.name} {row.quantity > 1 && <span className="text-xs text-muted-foreground">×{row.quantity}</span>}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className={cn("text-[10px]", RARITY_COLORS[it.rarity] ?? "")}>
                      {RARITY_LABEL[it.rarity] ?? it.rarity}
                    </Badge>
                    <span className="text-[10px] uppercase text-muted-foreground">{it.item_type}</span>
                    {row.equipped && <Badge className="bg-primary/20 text-primary text-[10px]">Equipado</Badge>}
                  </div>
                </div>
              </div>
              {it.description && <p className="text-xs text-muted-foreground">{it.description}</p>}
              <div className="flex flex-wrap gap-1 text-[11px]">
                {it.attack_bonus > 0 && <span className="text-emerald-300">+{it.attack_bonus} ATK</span>}
                {it.defense_bonus > 0 && <span className="text-emerald-300">+{it.defense_bonus} DEF</span>}
                {it.hp_bonus > 0 && <span className="text-emerald-300">+{it.hp_bonus} HP</span>}
                {it.speed_bonus > 0 && <span className="text-emerald-300">+{it.speed_bonus} VEL</span>}
              </div>
              <div className="flex gap-2">
                {row.equipped ? (
                  <Button size="sm" variant="outline" onClick={() => unequipMut.mutate(row.id)} disabled={unequipMut.isPending}>Desequipar</Button>
                ) : (
                  <Button size="sm" onClick={() => equipMut.mutate(row.id)} disabled={equipMut.isPending}>Equipar</Button>
                )}
                <Button size="sm" variant="ghost" onClick={() => sellMut.mutate(row.id)} disabled={sellMut.isPending || row.equipped}>
                  Vender · {it.sell_price}
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

/* --------------------------- Bosses --------------------------- */

function BossPanel({ character }: { character: any }) {
  const qc = useQueryClient();
  const regionsFn = useServerFn(listRegions);
  const fightFn = useServerFn(fightBoss);
  const regionsQ = useQuery({ queryKey: ["catalog", "regions"], queryFn: () => regionsFn() });
  const [log, setLog] = useState<any>(character.last_combat ?? null);
  const [replayKey, setReplayKey] = useState(0);
  const [showRaw, setShowRaw] = useState(false);

  const fightMut = useMutation({
    mutationFn: (regionId: string) => fightFn({ data: { regionId } }),
    onSuccess: (r) => {
      setLog(r);
      setReplayKey((k) => k + 1);
      qc.invalidateQueries({ queryKey: ["me", "character"] });
      qc.invalidateQueries({ queryKey: ["me", "profile"] });
      if (r.winner === "hero") toast.success(`Vitória contra ${r.bossName}!`);
      else toast.error(`Você foi derrotado por ${r.bossName}.`);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : String(e)),
  });

  const defeated: string[] = character.defeated_bosses ?? [];
  const regionSlug = log
    ? (regionsQ.data ?? []).find((r) => r.id === log.regionId)?.slug
    : undefined;
  const classSlug = character.classes?.slug;
  const enrichedLog = log ? { ...log, regionSlug } : null;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
      <div className="space-y-3">
        {(regionsQ.data ?? []).map((r) => {
          const locked = character.level < r.required_level;
          const done = defeated.includes(r.id);
          return (
            <Card key={r.id} className={cn("border-border/60 bg-card/60", locked && "opacity-60")}>
              <CardContent className="flex items-center justify-between gap-3 p-4">
                <div>
                  <h4 className="font-display">{r.name}</h4>
                  <p className="text-xs text-muted-foreground">Requer nível {r.required_level}</p>
                  {done && <Badge className="mt-1 bg-primary/20 text-primary" variant="outline">Chefe derrotado</Badge>}
                </div>
                <Button size="sm" disabled={locked || fightMut.isPending} onClick={() => fightMut.mutate(r.id)}>
                  Enfrentar
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
      <div className="space-y-3">
        {enrichedLog ? (
          <>
            <CombatStage
              key={replayKey}
              log={enrichedLog}
              heroMaxHp={character.max_hp}
              classSlug={classSlug}
              onReplay={() => setReplayKey((k) => k + 1)}
            />
            <button
              type="button"
              onClick={() => setShowRaw((v) => !v)}
              className="text-[11px] uppercase tracking-widest text-muted-foreground hover:text-primary"
            >
              {showRaw ? "Ocultar" : "Ver"} log detalhado
            </button>
            {showRaw && (
              <Card className="border-border/60 bg-card/60">
                <CardContent className="p-4">
                  <div className="space-y-1 text-xs font-mono max-h-72 overflow-y-auto">
                    <p className="text-primary">
                      {enrichedLog.heroName} vs {enrichedLog.bossName} — {enrichedLog.winner === "hero" ? "VITÓRIA" : "DERROTA"}
                    </p>
                    {enrichedLog.turns.map((t: any, i: number) => (
                      <p key={i} className={t.actor === "hero" ? "text-emerald-300" : "text-rose-300"}>
                        T{i + 1} · {t.actor === "hero" ? enrichedLog.heroName : enrichedLog.bossName} causa {t.damage}{t.crit ? " (CRÍTICO!)" : ""} · alvo HP: {t.targetHpAfter}
                      </p>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        ) : (
          <Card className="border-dashed border-border/60 bg-card/40">
            <CardContent className="p-10 text-center text-sm text-muted-foreground">
              Escolha um chefe à esquerda para começar o duelo. O combate acontece em tempo real na arena.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

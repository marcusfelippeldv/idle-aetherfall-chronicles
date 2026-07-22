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
  MapPin,
  Zap,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { getMyCharacter } from "@/lib/character.functions";
import { listZones } from "@/lib/catalog.functions";
import { startIncursion, claimIncursion, cancelIncursion } from "@/lib/incursion.functions";
import { PatrolScene } from "@/components/arena/PatrolScene";

export const Route = createFileRoute("/_authenticated/jogo/arena")({
  head: () => ({
    meta: [
      { title: "Incursão — Aetherfall Online" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ArenaPage,
});

function ArenaPage() {
  const characterFn = useServerFn(getMyCharacter);
  const characterQ = useQuery({
    queryKey: ["me", "character"],
    queryFn: () => characterFn(),
    refetchInterval: 15_000,
  });

  if (characterQ.isLoading) {
    return (
      <div className="mx-auto max-w-6xl space-y-4 px-4 py-10 md:px-6 md:py-14">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  const character = characterQ.data?.character as any;
  if (!character) {
    if (characterQ.isFetching) {
      return (
        <div className="mx-auto max-w-6xl space-y-4 px-4 py-10 md:px-6 md:py-14">
          <Skeleton className="h-40 w-full" />
        </div>
      );
    }
    return <Navigate to="/criar-heroi" replace />;
  }

  const wallet = characterQ.data?.wallet as any;
  const incursion = characterQ.data?.incursion as any;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 md:px-6 md:py-14">
      <HeroHeader character={character} wallet={wallet} />

      <div className="mt-8">
        {incursion ? (
          <ActiveIncursionCard incursion={incursion} character={character} />
        ) : (
          <ZoneSelector characterLevel={character.level} />
        )}
      </div>
    </div>
  );
}

function HeroHeader({ character, wallet }: { character: any; wallet: any }) {
  const arche = Array.isArray(character.archetypes) ? character.archetypes[0] : character.archetypes;
  const xpNext = 100 * character.level;
  const xpPct = Math.min(100, Math.round((Number(character.current_xp) / xpNext) * 100));
  return (
    <Card className="border-primary/30 bg-gradient-to-br from-card via-card to-primary/5">
      <CardContent className="grid gap-6 p-6 md:grid-cols-[1fr_auto]">
        <div>
          <p className="font-display text-xs uppercase tracking-[0.3em] text-primary">{arche?.name}</p>
          <h1 className="font-display text-4xl">{character.name}</h1>
          <div className="mt-3 flex items-center gap-3">
            <Badge className="bg-primary/20 text-primary" variant="outline">Nível {character.level}</Badge>
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
            <StatChip icon={<Zap className="h-3 w-3" />} label="Mana" value={`${character.current_mana}/${character.max_mana}`} />
            <StatChip icon={<Swords className="h-3 w-3" />} label="ATK" value={character.attack} />
            <StatChip icon={<Shield className="h-3 w-3" />} label="DEF" value={character.defense} />
            <StatChip icon={<Wind className="h-3 w-3" />} label="VEL" value={character.speed} />
          </div>
        </div>
        <div className="grid content-start gap-2 md:text-right">
          <div className="flex items-center gap-2 md:justify-end">
            <Coins className="h-4 w-4 text-amber-400" />
            <span className="font-display text-xl">{Number(wallet?.gold_balance ?? 0).toLocaleString("pt-BR")}</span>
            <span className="text-xs text-muted-foreground">ouro</span>
          </div>
          <div className="flex items-center gap-2 md:justify-end">
            <Gem className="h-4 w-4 text-violet-400" />
            <span className="font-display text-xl">{Number(wallet?.premium_balance ?? 0).toLocaleString("pt-BR")}</span>
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

function ZoneSelector({ characterLevel }: { characterLevel: number }) {
  const qc = useQueryClient();
  const zonesFn = useServerFn(listZones);
  const startFn = useServerFn(startIncursion);
  const zonesQ = useQuery({ queryKey: ["catalog", "zones"], queryFn: () => zonesFn() });

  const startMut = useMutation({
    mutationFn: (zoneId: string) => startFn({ data: { zoneId } }),
    onSuccess: () => {
      toast.success("Incursão iniciada — sua coorte marchou!");
      qc.invalidateQueries({ queryKey: ["me", "character"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : String(e)),
  });

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {(zonesQ.data ?? []).map((z) => {
        const locked = characterLevel < z.required_level;
        return (
          <Card key={z.id} className={cn("border-border/60 bg-card/60", locked && "opacity-60")}>
            <CardHeader>
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="font-display text-lg">{z.name}</CardTitle>
                <div className="flex flex-col items-end gap-1">
                  <Badge variant="outline" className="text-xs">Nv. {z.required_level}</Badge>
                  <span className="text-[10px] text-muted-foreground">{"★".repeat(z.difficulty_stars)}</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">{z.description}</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" /> 10 ondas · {z.duration_minutes} min
              </div>
              <Button
                className="w-full"
                disabled={locked || startMut.isPending}
                onClick={() => startMut.mutate(z.id)}
              >
                {locked ? `Requer nível ${z.required_level}` : `Iniciar incursão (${z.duration_minutes} min)`}
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function ActiveIncursionCard({ incursion, character }: { incursion: any; character: any }) {
  const qc = useQueryClient();
  const claimFn = useServerFn(claimIncursion);
  const cancelFn = useServerFn(cancelIncursion);
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const zone = Array.isArray(incursion.zones) ? incursion.zones[0] : incursion.zones;
  const arche = Array.isArray(character.archetypes) ? character.archetypes[0] : character.archetypes;
  const endMs = new Date(incursion.expected_end_at).getTime();
  const startMs = new Date(incursion.started_at).getTime();
  const total = Math.max(1, endMs - startMs);
  const elapsed = Math.min(total, now - startMs);
  const remainingS = Math.max(0, Math.ceil((endMs - now) / 1000));
  const pct = Math.min(100, (elapsed / total) * 100);
  const done = remainingS === 0;
  const currentWave = Math.min(10, Math.max(1, Math.ceil((elapsed / total) * 10)));

  const mm = Math.floor(remainingS / 60).toString().padStart(2, "0");
  const ss = (remainingS % 60).toString().padStart(2, "0");

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["me", "character"] });
    qc.invalidateQueries({ queryKey: ["me", "profile"] });
  };

  const claimMut = useMutation({
    mutationFn: () => claimFn({ data: { incursionId: incursion.id } }),
    onSuccess: (r: any) => {
      toast.success(`+${r.xp} XP · +${r.gold} ouro`);
      if (r.leveledUp) toast.success(`Nível ${r.newLevel}!`, { icon: "✨" });
      invalidate();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : String(e)),
  });
  const cancelMut = useMutation({
    mutationFn: () => cancelFn({ data: { incursionId: incursion.id } }),
    onSuccess: () => { toast.info("Incursão abortada."); invalidate(); },
    onError: (e) => toast.error(e instanceof Error ? e.message : String(e)),
  });

  return (
    <Card className="border-primary/40 bg-gradient-to-br from-card via-card to-primary/10">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="font-display text-2xl">{zone?.name}</CardTitle>
          <Badge className="bg-primary/20 text-primary" variant="outline">
            <Timer className="mr-1 h-3 w-3" /> {done ? "Concluída" : `${mm}:${ss}`}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {done ? (
          <div className="rounded-lg border border-primary/40 bg-background/40 p-8 text-center">
            <div className="text-6xl">🏆</div>
            <p className="mt-4 font-display text-2xl text-amber-300">Vitória!</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Sua coorte completou as 10 ondas de {zone?.name}. Reclame as recompensas.
            </p>
          </div>
        ) : (
          <div className="relative">
            <PatrolScene
              regionSlug={zone?.slug}
              classSlug={arche?.slug}
              progress={elapsed / total}
            />
            <div className="pointer-events-none absolute inset-x-0 bottom-2 flex justify-center">
              <span className="rounded-md bg-black/60 px-3 py-1 font-display text-sm text-white shadow-lg">
                Onda {currentWave} / 10
              </span>
            </div>
          </div>
        )}
        <Progress value={pct} className="h-2" />
        <div className="flex gap-2">
          <Button onClick={() => claimMut.mutate()} disabled={!done || claimMut.isPending} className="flex-1">
            {done ? (claimMut.isPending ? "Reclamando…" : "Reclamar recompensa") : "Aguarde…"}
          </Button>
          {!done && (
            <Button variant="outline" onClick={() => cancelMut.mutate()} disabled={cancelMut.isPending}>
              Abortar
            </Button>
          )}
          <Button asChild variant="outline" size="icon" title="Carteira">
            <Link to="/jogo/carteira"><Coins className="h-4 w-4" /></Link>
          </Button>
        </div>
        {done ? (
          <p className="text-center text-xs text-muted-foreground">
            <Sparkles className="mr-1 inline h-3 w-3" /> Sua coorte espera pelo comando.
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Swords, Trophy, Skull, Infinity as InfinityIcon, Coins, Sparkles, WifiOff, Wifi, Square, Gift } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { listStages, simulateFight } from "@/lib/combat.functions";
import type { CombatResult, CombatSnapshot } from "@/lib/combat/types";
import { ABILITY_LABELS } from "@/lib/combat/defaults";
import { claimIdleRewards, getIdleStatus, heartbeatIdleRun, startIdleRun, stopIdleRun } from "@/lib/idle.functions";

export const Route = createFileRoute("/_authenticated/jogo/combate")({
  head: () => ({
    meta: [
      { title: "Combate — Aetherfall Online" },
      { name: "description", content: "Enfrente estágios das regiões de Aetherfall." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CombatePage,
});

function CombatePage() {
  const list = useServerFn(listStages);
  const sim = useServerFn(simulateFight);

  const stagesQ = useQuery({ queryKey: ["combat-stages"], queryFn: () => list() });
  const [regionSlug, setRegionSlug] = useState<string>("");
  const [stageId, setStageId] = useState<string>("");

  const regions = stagesQ.data?.regions ?? [];
  const stages = useMemo(
    () => (stagesQ.data?.stages ?? []).filter((s) => s.region_slug === regionSlug),
    [stagesQ.data, regionSlug],
  );

  const [result, setResult] = useState<CombatResult | null>(null);
  const [step, setStep] = useState(0);

  const fightMut = useMutation({
    mutationFn: (id: string) => sim({ data: { stageId: id } }),
    onSuccess: (r) => {
      setResult(r);
      setStep(0);
      runPlayback(r.events.length, setStep);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const snapshot = useMemo<CombatSnapshot[] | null>(() => {
    if (!result) return null;
    if (step === 0) {
      return [
        ...result.heroes.map((h, i) => ({ side: "hero" as const, index: i, name: h.name, hp: h.maxHp, maxHp: h.maxHp, mana: h.maxMana, maxMana: h.maxMana, awakening: 0 })),
        ...result.enemies.map((e, i) => ({ side: "enemy" as const, index: i, name: e.name, hp: e.maxHp, maxHp: e.maxHp, mana: 0, maxMana: 0, awakening: 0 })),
      ];
    }
    return result.events[step - 1]?.snapshot ?? null;
  }, [result, step]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 md:px-6">
      <header className="mb-6">
        <h1 className="font-display text-3xl">Arena de Combate</h1>
        <p className="text-sm text-muted-foreground">Deixe sua party farmando idle 24/7 ou simule uma batalha manual.</p>
      </header>

      <IdlePanel regions={regions} stages={stagesQ.data?.stages ?? []} />


      <Card className="mb-6 border-border/60 bg-card/70">
        <CardContent className="grid gap-3 p-4 md:grid-cols-[1fr_1fr_auto] md:items-end md:p-6">
          <div className="space-y-1">
            <label className="text-xs uppercase tracking-wide text-muted-foreground">Região</label>
            <Select value={regionSlug} onValueChange={(v) => { setRegionSlug(v); setStageId(""); }}>
              <SelectTrigger><SelectValue placeholder="Escolha uma região" /></SelectTrigger>
              <SelectContent>
                {regions.map((r) => (
                  <SelectItem key={r.slug} value={r.slug}>
                    {r.name} · nv. {r.recommended_level}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-xs uppercase tracking-wide text-muted-foreground">Estágio</label>
            <Select value={stageId} onValueChange={setStageId} disabled={!regionSlug}>
              <SelectTrigger><SelectValue placeholder="Escolha um estágio" /></SelectTrigger>
              <SelectContent>
                {stages.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    Estágio {s.stage_number}{s.is_boss ? " · Chefe" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            disabled={!stageId || fightMut.isPending}
            onClick={() => fightMut.mutate(stageId)}
            className="shadow-gold"
          >
            <Swords className="mr-2 h-4 w-4" />
            {fightMut.isPending ? "Lutando…" : "Iniciar combate"}
          </Button>
        </CardContent>
      </Card>

      {result && snapshot && (
        <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
          <Card className="border-border/60 bg-card/70">
            <CardContent className="space-y-4 p-4 md:p-6">
              <div className="grid gap-4 md:grid-cols-2">
                <SideColumn title="Sua equipe" side="hero" snapshot={snapshot} />
                <SideColumn title="Inimigos" side="enemy" snapshot={snapshot} />
              </div>
              <div className="flex items-center justify-between">
                <div className="text-xs text-muted-foreground">
                  Turno {step} / {result.events.length}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setStep((s) => Math.max(0, s - 1))}>Anterior</Button>
                  <Button size="sm" variant="outline" onClick={() => setStep((s) => Math.min(result.events.length, s + 1))}>Próximo</Button>
                  <Button size="sm" variant="ghost" onClick={() => { setStep(0); runPlayback(result.events.length, setStep); }}>Rever</Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-3">
            <Card className={cn("border-border/60", result.outcome === "victory" ? "bg-emerald-950/40" : "bg-rose-950/40")}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 font-display text-xl">
                  {result.outcome === "victory" ? (
                    <><Trophy className="h-5 w-5 text-amber-300" /> Vitória</>
                  ) : (
                    <><Skull className="h-5 w-5 text-rose-300" /> Derrota</>
                  )}
                </div>
                {result.outcome === "victory" && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    +{result.rewardXp} XP · +{result.rewardGold} ouro <span className="text-xs">(recompensas serão persistidas na próxima etapa)</span>
                  </p>
                )}
              </CardContent>
            </Card>

            <Card className="border-border/60 bg-card/70">
              <CardContent className="space-y-1 p-4 text-xs">
                <div className="mb-1 font-display text-sm">Registro</div>
                <div className="max-h-64 space-y-1 overflow-y-auto pr-1">
                  {result.events.slice(0, step).map((ev, i) => (
                    <div key={i} className="rounded border border-border/40 bg-background/40 px-2 py-1">
                      <span className={cn("font-medium", ev.actor.side === "hero" ? "text-primary" : "text-rose-300")}>
                        {ev.actor.name}
                      </span>{" "}
                      → {ABILITY_LABELS[ev.ability] ?? ev.abilityName}
                      {ev.targets.length > 0 && (
                        <span className="text-muted-foreground">
                          {" "}em{" "}
                          {ev.targets.map((t) => `${t.name}${t.damage ? ` (-${t.damage})` : t.healing ? ` (+${t.healing})` : ""}`).join(", ")}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

function SideColumn({ title, side, snapshot }: { title: string; side: "hero" | "enemy"; snapshot: CombatSnapshot[] }) {
  const rows = snapshot.filter((s) => s.side === side);
  return (
    <div>
      <div className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">{title}</div>
      <div className="space-y-2">
        <AnimatePresence>
          {rows.map((c) => {
            const pct = Math.max(0, (c.hp / Math.max(1, c.maxHp)) * 100);
            const manaPct = c.maxMana ? Math.max(0, (c.mana / c.maxMana) * 100) : 0;
            const dead = c.hp <= 0;
            return (
              <motion.div
                key={`${c.side}-${c.index}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: dead ? 0.4 : 1 }}
                className={cn("rounded-md border p-2", dead ? "border-border/30" : "border-border/60 bg-background/40")}
              >
                <div className="flex items-baseline justify-between text-sm">
                  <span className={cn("font-display", dead && "line-through")}>{c.name}</span>
                  <span className="font-mono text-[11px] text-muted-foreground">{c.hp}/{c.maxHp}</span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded bg-white/10">
                  <motion.div
                    className={cn("h-full bg-gradient-to-r", pct > 55 ? "from-emerald-500 to-emerald-300" : pct > 25 ? "from-amber-500 to-yellow-300" : "from-rose-600 to-rose-400")}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.35 }}
                  />
                </div>
                {c.maxMana > 0 && (
                  <div className="mt-1 h-1 overflow-hidden rounded bg-white/10">
                    <motion.div className="h-full bg-gradient-to-r from-sky-500 to-indigo-400" animate={{ width: `${manaPct}%` }} transition={{ duration: 0.3 }} />
                  </div>
                )}
                {c.awakening > 0 && (
                  <div className="mt-1 h-0.5 overflow-hidden rounded bg-white/10">
                    <motion.div className="h-full bg-amber-400" animate={{ width: `${Math.min(100, c.awakening)}%` }} transition={{ duration: 0.3 }} />
                  </div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}

function runPlayback(total: number, setStep: (n: number) => void) {
  let i = 0;
  const interval = window.setInterval(() => {
    i++;
    setStep(i);
    if (i >= total) window.clearInterval(interval);
  }, 550);
}

type Region = { slug: string; name: string; recommended_level: number };
type Stage = { id: string; region_slug: string; stage_number: number; is_boss: boolean };

function IdlePanel({ regions, stages }: { regions: Region[]; stages: Stage[] }) {
  const qc = useQueryClient();
  const status = useServerFn(getIdleStatus);
  const start = useServerFn(startIdleRun);
  const stop = useServerFn(stopIdleRun);
  const claim = useServerFn(claimIdleRewards);
  const beat = useServerFn(heartbeatIdleRun);

  const statusQ = useQuery({
    queryKey: ["idle-status"],
    queryFn: () => status(),
    refetchInterval: 5000,
    refetchOnWindowFocus: true,
  });

  const [regionSlug, setRegionSlug] = useState<string>("");
  const [stageId, setStageId] = useState<string>("");
  const regionStages = useMemo(() => stages.filter((s) => s.region_slug === regionSlug), [stages, regionSlug]);

  const active = statusQ.data?.active ? statusQ.data : null;

  // Heartbeat while the tab is open and there's an active run.
  useEffect(() => {
    if (!active) return;
    const id = window.setInterval(() => {
      beat().catch(() => {});
    }, 20_000);
    return () => window.clearInterval(id);
  }, [active, beat]);

  // Local tick between server polls for smooth counters.
  const [localTickMs, setLocalTickMs] = useState<number>(0);
  useEffect(() => {
    if (!active) return;
    setLocalTickMs(0);
    const start = Date.now();
    const id = window.setInterval(() => setLocalTickMs(Date.now() - start), 1000);
    return () => window.clearInterval(id);
  }, [active?.lastTickAt, active?.pendingXp, active?.pendingGold]);

  const displayXp = active
    ? Math.floor(active.pendingXp + localTickMs * active.xpPerSec * (active.offline ? active.offlineXpMultiplier : 1) / 1000)
    : 0;
  const displayGold = active
    ? Math.floor(active.pendingGold + (localTickMs * active.goldPerSec) / 1000)
    : 0;

  const startMut = useMutation({
    mutationFn: (id: string) => start({ data: { stageId: id } }),
    onSuccess: () => {
      toast.success("Expedição idle iniciada.");
      qc.invalidateQueries({ queryKey: ["idle-status"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const stopMut = useMutation({
    mutationFn: () => stop(),
    onSuccess: () => {
      toast.info("Expedição encerrada.");
      qc.invalidateQueries({ queryKey: ["idle-status"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const claimMut = useMutation({
    mutationFn: () => claim(),
    onSuccess: (r) => {
      toast.success(`Coletado: +${r.xp} XP · +${r.gold} ouro`);
      qc.invalidateQueries({ queryKey: ["idle-status"] });
      qc.invalidateQueries({ queryKey: ["my-heroes"] });
      qc.invalidateQueries({ queryKey: ["wallet"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Card className="mb-6 border-amber-500/30 bg-gradient-to-br from-indigo-950/40 to-violet-950/30">
      <CardContent className="space-y-4 p-4 md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <InfinityIcon className="h-5 w-5 text-amber-300" />
            <h2 className="font-display text-xl">Expedição Idle</h2>
            {active && (
              <Badge variant={active.offline ? "secondary" : "default"} className="gap-1">
                {active.offline ? <WifiOff className="h-3 w-3" /> : <Wifi className="h-3 w-3" />}
                {active.offline ? `Offline · XP ${Math.round(active.offlineXpMultiplier * 100)}%` : "Online · XP 100%"}
              </Badge>
            )}
          </div>
          {active && (
            <div className="text-xs text-muted-foreground">
              {active.regionName} · Estágio {active.stageNumber}{active.isBoss ? " · Chefe" : ""}
            </div>
          )}
        </div>

        {active ? (
          <div className="grid gap-4 md:grid-cols-[1fr_1fr_auto] md:items-center">
            <div className="rounded-md border border-border/50 bg-background/40 p-3">
              <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
                <Sparkles className="h-3.5 w-3.5" /> XP acumulado
              </div>
              <div className="mt-1 font-mono text-2xl text-amber-200">{displayXp.toLocaleString("pt-BR")}</div>
              <div className="text-[11px] text-muted-foreground">
                {(active.xpPerSec * 60).toFixed(1)} XP/min (base)
              </div>
            </div>
            <div className="rounded-md border border-border/50 bg-background/40 p-3">
              <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
                <Coins className="h-3.5 w-3.5" /> Ouro acumulado
              </div>
              <div className="mt-1 font-mono text-2xl text-yellow-200">{displayGold.toLocaleString("pt-BR")}</div>
              <div className="text-[11px] text-muted-foreground">
                {(active.goldPerSec * 60).toFixed(1)} ouro/min
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Button
                onClick={() => claimMut.mutate()}
                disabled={claimMut.isPending || (displayXp <= 0 && displayGold <= 0)}
                className="shadow-gold"
              >
                <Gift className="mr-2 h-4 w-4" />
                {claimMut.isPending ? "Coletando…" : "Coletar"}
              </Button>
              <Button variant="outline" onClick={() => stopMut.mutate()} disabled={stopMut.isPending}>
                <Square className="mr-2 h-4 w-4" />
                Parar
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto] md:items-end">
            <div className="space-y-1">
              <label className="text-xs uppercase tracking-wide text-muted-foreground">Região</label>
              <Select value={regionSlug} onValueChange={(v) => { setRegionSlug(v); setStageId(""); }}>
                <SelectTrigger><SelectValue placeholder="Escolha uma região" /></SelectTrigger>
                <SelectContent>
                  {regions.map((r) => (
                    <SelectItem key={r.slug} value={r.slug}>{r.name} · nv. {r.recommended_level}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-xs uppercase tracking-wide text-muted-foreground">Estágio</label>
              <Select value={stageId} onValueChange={setStageId} disabled={!regionSlug}>
                <SelectTrigger><SelectValue placeholder="Escolha um estágio" /></SelectTrigger>
                <SelectContent>
                  {regionStages.map((s) => (
                    <SelectItem key={s.id} value={s.id}>Estágio {s.stage_number}{s.is_boss ? " · Chefe" : ""}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button disabled={!stageId || startMut.isPending} onClick={() => startMut.mutate(stageId)} className="shadow-gold">
              <InfinityIcon className="mr-2 h-4 w-4" />
              {startMut.isPending ? "Iniciando…" : "Iniciar expedição"}
            </Button>
          </div>
        )}

        <p className="text-[11px] text-muted-foreground">
          Sua party continua farmando mesmo com o jogo fechado. Enquanto offline, o XP acumula a 50% (o ouro permanece 100%). Volte e clique em <strong>Coletar</strong> para creditar as recompensas.
        </p>
      </CardContent>
    </Card>
  );
}

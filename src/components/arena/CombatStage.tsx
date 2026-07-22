import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Coins, RotateCcw, Sparkles, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { HeroSprite, EnemySprite } from "./sprites";

type Turn = {
  actor: "hero" | "enemy";
  damage: number;
  targetHpAfter: number;
  crit?: boolean;
};

export type CombatLog = {
  heroName: string;
  bossName: string;
  turns: Turn[];
  winner: "hero" | "enemy";
  heroHpAfter: number;
  rewardXp: number;
  rewardGold: number;
  unlocked?: boolean;
  regionName?: string;
  regionSlug?: string;
  at?: string;
};

type Floater = { id: number; side: "hero" | "enemy"; text: string; crit: boolean; kind: "damage" };

export function CombatStage({
  log,
  heroMaxHp,
  classSlug,
  onReplay,
  turnDurationMs = 460,
}: {
  log: CombatLog;
  heroMaxHp: number;
  classSlug?: string;
  onReplay?: () => void;
  turnDurationMs?: number;
}) {
  const reduce = useReducedMotion();
  const bossMaxHp = useMemo(() => reconstructBossMaxHp(log), [log]);

  const [index, setIndex] = useState(-1); // -1 antes de começar
  const [heroHp, setHeroHp] = useState(heroMaxHp);
  const [enemyHp, setEnemyHp] = useState(bossMaxHp);
  const [floaters, setFloaters] = useState<Floater[]>([]);
  const [heroPose, setHeroPose] = useState<"idle" | "attack" | "hurt">("idle");
  const [enemyPose, setEnemyPose] = useState<"idle" | "attack" | "hurt">("idle");
  const [finished, setFinished] = useState(false);
  const nextId = useRef(1);

  // Reinicia quando o log muda
  useEffect(() => {
    setIndex(-1);
    setHeroHp(heroMaxHp);
    setEnemyHp(bossMaxHp);
    setFloaters([]);
    setHeroPose("idle");
    setEnemyPose("idle");
    setFinished(false);
    if (reduce) {
      // Salta direto para o final
      setHeroHp(Math.max(0, log.heroHpAfter));
      setEnemyHp(log.winner === "hero" ? 0 : bossMaxHp);
      setIndex(log.turns.length);
      setFinished(true);
      return;
    }
    const start = window.setTimeout(() => setIndex(0), 350);
    return () => window.clearTimeout(start);
  }, [log, heroMaxHp, bossMaxHp, reduce]);

  useEffect(() => {
    if (reduce) return;
    if (index < 0 || index >= log.turns.length) return;
    const t = log.turns[index];

    // Aplica pose de ataque no atacante
    if (t.actor === "hero") setHeroPose("attack");
    else setEnemyPose("attack");

    // Meio do turno: aplica dano, pose de dano no alvo, spawn de floater
    const impactId = window.setTimeout(() => {
      if (t.actor === "hero") {
        setEnemyHp(Math.max(0, t.targetHpAfter));
        setEnemyPose("hurt");
      } else {
        setHeroHp(Math.max(0, t.targetHpAfter));
        setHeroPose("hurt");
      }
      const id = nextId.current++;
      setFloaters((f) => [
        ...f,
        {
          id,
          side: t.actor === "hero" ? "enemy" : "hero",
          text: `-${t.damage}`,
          crit: !!t.crit,
          kind: "damage",
        },
      ]);
      window.setTimeout(() => {
        setFloaters((f) => f.filter((x) => x.id !== id));
      }, 900);
    }, turnDurationMs * 0.45);

    // Fim do turno: volta poses e avança
    const endId = window.setTimeout(() => {
      setHeroPose("idle");
      setEnemyPose("idle");
      const next = index + 1;
      if (next >= log.turns.length) setFinished(true);
      setIndex(next);
    }, turnDurationMs);

    return () => {
      window.clearTimeout(impactId);
      window.clearTimeout(endId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  const heroPct = Math.max(0, Math.min(100, (heroHp / Math.max(1, heroMaxHp)) * 100));
  const enemyPct = Math.max(0, Math.min(100, (enemyHp / Math.max(1, bossMaxHp)) * 100));
  const total = log.turns.length;
  const progressPct = Math.min(100, ((Math.max(0, index) + (finished ? 1 : 0)) / Math.max(1, total)) * 100);

  return (
    <div className="relative overflow-hidden rounded-lg border border-border/60 bg-gradient-to-br from-[#0d1120] via-[#141a2f] to-[#1a1030]">
      {/* Cabeçalho com HP */}
      <div className="grid grid-cols-2 gap-4 border-b border-border/40 bg-black/30 px-4 py-3 text-xs">
        <CombatantBar
          side="hero"
          name={log.heroName}
          hp={heroHp}
          maxHp={heroMaxHp}
          pct={heroPct}
        />
        <CombatantBar
          side="enemy"
          name={log.bossName}
          hp={enemyHp}
          maxHp={bossMaxHp}
          pct={enemyPct}
        />
      </div>

      {/* Palco */}
      <div className="relative h-64 overflow-hidden md:h-72">
        {/* fundo em camadas */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(139,124,255,0.25),transparent_60%),radial-gradient(circle_at_80%_80%,rgba(247,197,107,0.18),transparent_55%)]" />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/70 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-16 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.05),transparent_70%)]" />

        {/* Herói */}
        <motion.div
          className="absolute bottom-6 left-8 h-40 w-28 md:h-48 md:w-32"
          animate={
            heroPose === "attack"
              ? { x: 60, y: -6, transition: { duration: turnDurationMs / 2000, ease: "easeOut" } }
              : heroPose === "hurt"
                ? { x: -14, y: 0, transition: { duration: 0.14 } }
                : { x: 0, y: 0, transition: { duration: 0.22 } }
          }
        >
          <HeroSprite classSlug={classSlug} pose={heroPose} />
          <FloaterStack floaters={floaters.filter((f) => f.side === "hero")} />
        </motion.div>

        {/* Chefe */}
        <motion.div
          className="absolute bottom-6 right-8 h-44 w-32 md:h-52 md:w-36"
          animate={
            enemyPose === "attack"
              ? { x: -60, y: -6, transition: { duration: turnDurationMs / 2000, ease: "easeOut" } }
              : enemyPose === "hurt"
                ? { x: 14, y: 0, transition: { duration: 0.14 } }
                : { x: 0, y: 0, transition: { duration: 0.22 } }
          }
        >
          <EnemySprite regionSlug={log.regionSlug} isBoss pose={enemyPose} />
          <FloaterStack floaters={floaters.filter((f) => f.side === "enemy")} />
        </motion.div>

        {/* Explosão de vitória / derrota */}
        <AnimatePresence>
          {finished && log.winner === "hero" && !reduce && <VictoryBurst />}
          {finished && log.winner === "enemy" && !reduce && <DefeatOverlay />}
        </AnimatePresence>
      </div>

      {/* Rodapé de progresso / resultado */}
      <div className="border-t border-border/40 bg-black/40 px-4 py-3">
        {!finished ? (
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] uppercase tracking-wider text-muted-foreground">
              <span>Turno {Math.min(total, Math.max(0, index) + 1)} / {total}</span>
              <span>{log.regionName}</span>
            </div>
            <div className="h-1 overflow-hidden rounded bg-white/10">
              <motion.div
                className="h-full bg-gradient-to-r from-primary/70 to-primary"
                animate={{ width: `${progressPct}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p
                className={cn(
                  "font-display text-lg",
                  log.winner === "hero" ? "text-amber-300" : "text-rose-300",
                )}
              >
                {log.winner === "hero" ? "Vitória!" : "Derrota"}
              </p>
              {log.winner === "hero" ? (
                <p className="text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1"><Sparkles className="h-3 w-3 text-primary" /> +{log.rewardXp} XP</span>
                  <span className="mx-2">·</span>
                  <span className="inline-flex items-center gap-1"><Coins className="h-3 w-3 text-amber-400" /> +{log.rewardGold} ouro</span>
                  {log.unlocked && <span className="ml-2 text-primary">· nova região desbloqueada</span>}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">Você recua para se recuperar.</p>
              )}
            </div>
            {onReplay && (
              <Button size="sm" variant="outline" onClick={onReplay}>
                <RotateCcw className="mr-2 h-3.5 w-3.5" /> Rever
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function CombatantBar({
  side,
  name,
  hp,
  maxHp,
  pct,
}: {
  side: "hero" | "enemy";
  name: string;
  hp: number;
  maxHp: number;
  pct: number;
}) {
  const color =
    pct > 55
      ? side === "hero"
        ? "from-emerald-500 to-emerald-300"
        : "from-rose-500 to-amber-400"
      : pct > 25
        ? "from-amber-500 to-yellow-300"
        : "from-rose-600 to-rose-400";
  return (
    <div className={cn("space-y-1", side === "enemy" && "text-right")}>
      <div className="flex items-center justify-between gap-2">
        <span className={cn("font-display text-sm", side === "enemy" && "order-2")}>{name}</span>
        <span className="font-mono text-[11px] text-muted-foreground">
          {Math.round(hp)}/{maxHp}
        </span>
      </div>
      <div className={cn("h-2 overflow-hidden rounded bg-white/10", side === "enemy" && "flex justify-end")}>
        <motion.div
          className={cn("h-full rounded bg-gradient-to-r", color)}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          style={{ minWidth: pct > 0 ? 4 : 0 }}
        />
      </div>
    </div>
  );
}

function FloaterStack({ floaters }: { floaters: Floater[] }) {
  return (
    <div className="pointer-events-none absolute inset-0">
      <AnimatePresence>
        {floaters.map((f) => (
          <motion.div
            key={f.id}
            initial={{ opacity: 0, y: 0, scale: f.crit ? 0.6 : 0.9 }}
            animate={{ opacity: 1, y: -60, scale: f.crit ? 1.4 : 1 }}
            exit={{ opacity: 0, y: -90 }}
            transition={{ duration: 0.85, ease: "easeOut" }}
            className={cn(
              "absolute left-1/2 top-2 -translate-x-1/2 whitespace-nowrap font-display",
              f.crit ? "text-amber-300" : "text-rose-300",
              f.crit ? "text-3xl drop-shadow-[0_0_10px_rgba(247,197,107,0.7)]" : "text-xl drop-shadow-[0_0_6px_rgba(255,80,80,0.55)]",
            )}
          >
            {f.crit && <Zap className="mr-1 inline h-4 w-4" />}
            {f.text}
            {f.crit && "!"}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

function VictoryBurst() {
  const rays = Array.from({ length: 12 });
  return (
    <motion.div
      className="pointer-events-none absolute inset-0"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_60%,rgba(247,197,107,0.35),transparent_60%)]" />
      {rays.map((_, i) => (
        <motion.div
          key={i}
          className="absolute left-1/2 top-1/2 h-1 w-40 origin-left bg-gradient-to-r from-amber-300/80 to-transparent"
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: [0, 1, 0] }}
          transition={{ duration: 0.9, delay: i * 0.04 }}
          style={{ transform: `translate(-0%, -50%) rotate(${(i * 360) / 12}deg)` }}
        />
      ))}
      {Array.from({ length: 18 }).map((_, i) => (
        <motion.span
          key={`p${i}`}
          className="absolute h-1.5 w-1.5 rounded-full bg-amber-300 shadow-[0_0_10px_rgba(247,197,107,0.9)]"
          initial={{ x: "50%", y: "50%", opacity: 1, scale: 0.6 }}
          animate={{
            x: `${50 + (Math.random() - 0.5) * 60}%`,
            y: `${50 + (Math.random() - 0.5) * 60}%`,
            opacity: 0,
            scale: 1.2,
          }}
          transition={{ duration: 1.1, delay: 0.1 + Math.random() * 0.3 }}
        />
      ))}
    </motion.div>
  );
}

function DefeatOverlay() {
  return (
    <motion.div
      className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(200,30,60,0.35),transparent_65%)]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    />
  );
}

function reconstructBossMaxHp(log: CombatLog): number {
  const heroTurns = log.turns.filter((t) => t.actor === "hero");
  const totalDamage = heroTurns.reduce((a, t) => a + t.damage, 0);
  const lastHero = heroTurns[heroTurns.length - 1];
  const finalBossHp = lastHero?.targetHpAfter ?? 0;
  return Math.max(1, totalDamage + finalBossHp);
}

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { HeroSprite, EnemySprite } from "./sprites";

/**
 * Cena de patrulha idle. Puramente cosmética — não altera drops nem timers.
 * Um inimigo surge por ciclo (~4s), é abatido e conta para o "abates" visual.
 */
export function PatrolScene({
  regionSlug,
  classSlug,
  progress,
}: {
  regionSlug?: string;
  classSlug?: string;
  progress: number; // 0..1
}) {
  const reduce = useReducedMotion();
  const palette = useMemo(() => bgFor(regionSlug), [regionSlug]);
  const [tick, setTick] = useState(0);
  const [kills, setKills] = useState(0);
  const [phase, setPhase] = useState<"approach" | "hit" | "gone">("approach");

  useEffect(() => {
    if (reduce) return;
    const id = window.setInterval(() => setTick((t) => t + 1), 3800);
    return () => window.clearInterval(id);
  }, [reduce]);

  useEffect(() => {
    if (reduce) return;
    setPhase("approach");
    const t1 = window.setTimeout(() => setPhase("hit"), 1800);
    const t2 = window.setTimeout(() => {
      setPhase("gone");
      setKills((k) => k + 1);
    }, 2400);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [tick, reduce]);

  return (
    <div className="relative h-40 overflow-hidden rounded-md border border-border/40" style={{ background: palette.sky }}>
      {/* Camadas de paralaxe */}
      <ParallaxLayer speed={40} y={64} opacity={0.55} color={palette.far} />
      <ParallaxLayer speed={22} y={82} opacity={0.75} color={palette.mid} />
      <ParallaxLayer speed={12} y={104} opacity={1} color={palette.near} />

      {/* Chão */}
      <div className="absolute inset-x-0 bottom-0 h-8 bg-black/50" />
      <div className="absolute inset-x-0 bottom-8 h-px bg-white/10" />

      {/* Herói caminhando (bob) */}
      <motion.div
        className="absolute bottom-4 left-10 h-24 w-16"
        animate={reduce ? {} : { y: [0, -3, 0, -2, 0] }}
        transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }}
      >
        <HeroSprite classSlug={classSlug} pose="idle" />
      </motion.div>

      {/* Inimigo entrando */}
      <AnimatePresence mode="wait">
        {phase !== "gone" && (
          <motion.div
            key={tick}
            className="absolute bottom-4 h-24 w-20"
            initial={{ right: -80, opacity: 0 }}
            animate={
              phase === "approach"
                ? { right: 60, opacity: 1 }
                : { right: 80, opacity: 0.6 }
            }
            exit={{ opacity: 0, scale: 0.6, filter: "blur(6px)" }}
            transition={{ duration: phase === "hit" ? 0.35 : 1.4, ease: "easeOut" }}
          >
            <EnemySprite regionSlug={regionSlug} pose={phase === "hit" ? "hurt" : "idle"} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Flash de impacto */}
      <AnimatePresence>
        {phase === "hit" && (
          <motion.div
            className="pointer-events-none absolute bottom-10 right-16 h-16 w-16 rounded-full bg-white/70 blur-md"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1.6, opacity: 0 }}
            transition={{ duration: 0.4 }}
          />
        )}
      </AnimatePresence>

      {/* HUD */}
      <div className="absolute left-2 top-2 rounded bg-black/45 px-2 py-0.5 text-[10px] font-mono uppercase tracking-widest text-white/80">
        Patrulhando · {Math.round(progress * 100)}%
      </div>
      <div className="absolute right-2 top-2 rounded bg-black/45 px-2 py-0.5 text-[10px] font-mono text-amber-200">
        abates: {kills}
      </div>
    </div>
  );
}

function ParallaxLayer({
  speed,
  y,
  opacity,
  color,
}: {
  speed: number;
  y: number;
  opacity: number;
  color: string;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className="absolute inset-x-0 pointer-events-none"
      style={{ top: y, height: 40, opacity }}
      animate={reduce ? {} : { x: [0, -400] }}
      transition={{ duration: speed, repeat: Infinity, ease: "linear" }}
    >
      <svg viewBox="0 0 800 40" width="1600" height="40" preserveAspectRatio="none">
        <path
          d="M0 40 L0 25 L60 12 L120 22 L180 8 L240 20 L300 14 L360 24 L420 10 L480 22 L540 12 L600 20 L660 8 L720 22 L800 14 L800 40 Z"
          fill={color}
        />
        <path
          d="M800 40 L800 25 L860 12 L920 22 L980 8 L1040 20 L1100 14 L1160 24 L1220 10 L1280 22 L1340 12 L1400 20 L1460 8 L1520 22 L1600 14 L1600 40 Z"
          fill={color}
          transform="translate(-800 0)"
        />
      </svg>
    </motion.div>
  );
}

function bgFor(slug?: string) {
  switch (slug) {
    case "bosque-cinza":
      return {
        sky: "linear-gradient(to bottom, #0f1a1c, #1e2f2a 60%, #0b1310)",
        far: "#1c2a26",
        mid: "#243b32",
        near: "#0f1a15",
      };
    case "areias-do-crepusculo":
      return {
        sky: "linear-gradient(to bottom, #2a1a10, #6b3520 60%, #1a0d07)",
        far: "#3d1f10",
        mid: "#5a2c15",
        near: "#180a04",
      };
    case "torre-arcana":
      return {
        sky: "linear-gradient(to bottom, #10102a, #241a44 60%, #08061a)",
        far: "#1f1740",
        mid: "#2f2258",
        near: "#0a0820",
      };
    case "abismo-de-obsidiana":
      return {
        sky: "linear-gradient(to bottom, #0a0a10, #22111a 60%, #05030a)",
        far: "#170a12",
        mid: "#22111c",
        near: "#0a0407",
      };
    default:
      return {
        sky: "linear-gradient(to bottom, #10142a, #1e243f 60%, #0a0d1c)",
        far: "#1c2140",
        mid: "#252b52",
        near: "#0a0d1c",
      };
  }
}

import { cn } from "@/lib/utils";

type Pose = "idle" | "attack" | "hurt";

const CLASS_ACCENT: Record<string, string> = {
  guardiao: "#f7c56b",
  arcanista: "#8b7cff",
  cacador: "#5ce0a4",
  clerigo: "#f2e9c9",
  duelista: "#ff8888",
};

/** Silhueta estilizada do herói. Poses ligeiramente diferentes. */
export function HeroSprite({
  classSlug,
  pose = "idle",
  className,
}: {
  classSlug?: string;
  pose?: Pose;
  className?: string;
}) {
  const accent = CLASS_ACCENT[classSlug ?? ""] ?? "#f7c56b";
  const tilt = pose === "attack" ? -8 : pose === "hurt" ? 6 : 0;

  return (
    <svg
      viewBox="0 0 120 160"
      className={cn("h-full w-full drop-shadow-[0_8px_18px_rgba(0,0,0,0.55)]", className)}
      style={{ transform: `rotate(${tilt}deg)`, transition: "transform 180ms ease-out" }}
    >
      {/* sombra base */}
      <ellipse cx="60" cy="150" rx="26" ry="5" fill="rgba(0,0,0,0.5)" />
      {/* capa */}
      <path
        d="M32 60 Q30 110 40 145 L80 145 Q90 110 88 60 Q60 48 32 60 Z"
        fill={accent}
        opacity="0.85"
      />
      {/* corpo */}
      <path
        d="M40 62 Q40 100 46 138 L74 138 Q80 100 80 62 Q60 54 40 62 Z"
        fill="#1f2233"
      />
      {/* cinto */}
      <rect x="42" y="100" width="36" height="6" fill={accent} opacity="0.9" />
      {/* cabeça */}
      <circle cx="60" cy="42" r="18" fill="#f2d6b0" />
      {/* capuz */}
      <path
        d="M40 42 Q40 20 60 18 Q80 20 80 42 Q80 30 60 30 Q40 30 40 42 Z"
        fill="#101425"
      />
      {/* olho */}
      <circle cx="60" cy="44" r="2" fill={accent} />
      {/* espada / cajado */}
      {pose === "attack" ? (
        <>
          <rect x="82" y="30" width="4" height="70" rx="2" fill="#d4d8e6" transform="rotate(35 84 65)" />
          <circle cx="112" cy="34" r="6" fill={accent} opacity="0.9" />
        </>
      ) : (
        <rect x="86" y="60" width="4" height="72" rx="2" fill="#d4d8e6" />
      )}
    </svg>
  );
}

/** Silhueta genérica de inimigo/chefe com variação por região. */
export function EnemySprite({
  regionSlug,
  isBoss = false,
  pose = "idle",
  className,
}: {
  regionSlug?: string;
  isBoss?: boolean;
  pose?: Pose;
  className?: string;
}) {
  const palette = paletteFor(regionSlug);
  const tilt = pose === "attack" ? 10 : pose === "hurt" ? -8 : 0;
  const scale = isBoss ? 1.15 : 1;

  return (
    <svg
      viewBox="0 0 140 160"
      className={cn("h-full w-full drop-shadow-[0_10px_20px_rgba(0,0,0,0.55)]", className)}
      style={{
        transform: `rotate(${tilt}deg) scale(${scale}) scaleX(-1)`,
        transition: "transform 180ms ease-out",
      }}
    >
      <ellipse cx="70" cy="150" rx="34" ry="6" fill="rgba(0,0,0,0.55)" />
      {/* corpo massa */}
      <path
        d="M28 90 Q20 60 50 42 Q70 30 90 42 Q120 60 112 100 Q108 138 70 140 Q32 138 28 90 Z"
        fill={palette.body}
      />
      {/* armadura/escamas */}
      <path
        d="M40 92 Q50 78 70 78 Q90 78 100 92 Q90 108 70 108 Q50 108 40 92 Z"
        fill={palette.armor}
        opacity="0.9"
      />
      {/* chifres */}
      <path d="M40 46 L28 22 L46 40 Z" fill={palette.horn} />
      <path d="M100 46 L112 22 L94 40 Z" fill={palette.horn} />
      {/* olhos ardentes */}
      <circle cx="56" cy="70" r="4" fill={palette.eye} />
      <circle cx="86" cy="70" r="4" fill={palette.eye} />
      <circle cx="56" cy="70" r="1.6" fill="#fff" opacity="0.9" />
      <circle cx="86" cy="70" r="1.6" fill="#fff" opacity="0.9" />
      {/* boca / presas */}
      <path
        d="M52 108 L60 118 L68 108 L76 118 L84 108"
        stroke={palette.eye}
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}

function paletteFor(slug?: string) {
  switch (slug) {
    case "bosque-cinza":
      return { body: "#3a4a3a", armor: "#25311f", horn: "#c0b280", eye: "#f5c15c" };
    case "areias-do-crepusculo":
      return { body: "#7a4a2a", armor: "#4a2812", horn: "#f2d199", eye: "#ff6a3a" };
    case "torre-arcana":
      return { body: "#3a2f5c", armor: "#231a3a", horn: "#c9b0ff", eye: "#a86bff" };
    case "abismo-de-obsidiana":
      return { body: "#1c1a24", armor: "#0b0a10", horn: "#ff3a6a", eye: "#ff2b55" };
    default:
      return { body: "#3c3a4a", armor: "#22212c", horn: "#c9b898", eye: "#ff8a4c" };
  }
}

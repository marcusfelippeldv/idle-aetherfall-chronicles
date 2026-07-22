import { RARITY_CLASSES, RARITY_LABEL, type Rarity } from "@/lib/game/rarity";
import { cn } from "@/lib/utils";

export function RarityBadge({ rarity, className }: { rarity: Rarity; className?: string }) {
  const c = RARITY_CLASSES[rarity];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider",
        c.text, c.border, c.bg,
        className,
      )}
    >
      {RARITY_LABEL[rarity]}
    </span>
  );
}

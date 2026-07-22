export type Rarity = "comum" | "incomum" | "raro" | "epico" | "lendario" | "mitico";
export type EquipSlot = "arma" | "ofmao" | "elmo" | "peito" | "pernas" | "pes" | "amuleto" | "anel";
export type ItemSlot = EquipSlot | "consumivel" | "material";

export const EQUIP_SLOTS: EquipSlot[] = [
  "arma", "ofmao", "elmo", "peito", "pernas", "pes", "amuleto", "anel",
];

export const SLOT_LABELS: Record<ItemSlot, string> = {
  arma: "Arma",
  ofmao: "Ofensiva secundária",
  elmo: "Elmo",
  peito: "Peitoral",
  pernas: "Grevas",
  pes: "Botas",
  amuleto: "Amuleto",
  anel: "Anel",
  consumivel: "Consumível",
  material: "Material",
};

export const RARITY_ORDER: Rarity[] = ["comum", "incomum", "raro", "epico", "lendario", "mitico"];

export const RARITY_LABEL: Record<Rarity, string> = {
  comum: "Comum",
  incomum: "Incomum",
  raro: "Raro",
  epico: "Épico",
  lendario: "Lendário",
  mitico: "Mítico",
};

export const RARITY_CLASSES: Record<Rarity, { text: string; border: string; bg: string; ring: string }> = {
  comum:    { text: "text-slate-300", border: "border-slate-500/40", bg: "bg-slate-500/10", ring: "ring-slate-400/30" },
  incomum:  { text: "text-emerald-300", border: "border-emerald-500/40", bg: "bg-emerald-500/10", ring: "ring-emerald-400/40" },
  raro:     { text: "text-sky-300", border: "border-sky-500/40", bg: "bg-sky-500/10", ring: "ring-sky-400/40" },
  epico:    { text: "text-violet-300", border: "border-violet-500/40", bg: "bg-violet-500/10", ring: "ring-violet-400/50" },
  lendario: { text: "text-amber-300", border: "border-amber-500/50", bg: "bg-amber-500/10", ring: "ring-amber-400/60" },
  mitico:   { text: "text-rose-300", border: "border-rose-500/50", bg: "bg-rose-500/15", ring: "ring-rose-400/70" },
};

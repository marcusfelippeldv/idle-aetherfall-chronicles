import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, RotateCcw, Save, Trash2, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getMyHeroes, getMyParty, updateHeroPriorities, resetHeroPriorities } from "@/lib/hero.functions";
import { ABILITY_LABELS, CONDITION_LABELS, TARGET_LABELS } from "@/lib/combat/defaults";
import type { AbilitySlug, ConditionKind, PriorityRule, TargetKind } from "@/lib/combat/types";

export const Route = createFileRoute("/_authenticated/jogo/prioridades")({
  head: () => ({
    meta: [
      { title: "Prioridades — Aetherfall Online" },
      { name: "description", content: "Configure a IA de cada herói da sua equipe." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PrioridadesPage,
});

const ABILITY_OPTIONS: AbilitySlug[] = ["basic", "skill_1", "skill_2", "awakening", "defend"];
const TARGET_OPTIONS: TargetKind[] = ["lowest_hp_enemy", "highest_atk_enemy", "random_enemy", "lowest_hp_ally", "self"];
const CONDITION_OPTIONS: ConditionKind[] = ["always", "hp_below_50", "hp_below_25", "mana_ok", "awakening_ready"];

function PrioridadesPage() {
  const queryClient = useQueryClient();
  const listHeroes = useServerFn(getMyHeroes);
  const listParty = useServerFn(getMyParty);
  const update = useServerFn(updateHeroPriorities);
  const reset = useServerFn(resetHeroPriorities);

  const heroesQ = useQuery({ queryKey: ["my-heroes"], queryFn: () => listHeroes() });
  const partyQ = useQuery({ queryKey: ["my-party"], queryFn: () => listParty() });

  const partyIds = partyQ.data
    ? [partyQ.data.slot1, partyQ.data.slot2, partyQ.data.slot3, partyQ.data.slot4].filter((x): x is string => !!x)
    : [];
  const heroesById = new Map((heroesQ.data ?? []).map((h) => [h.id, h]));
  const partyHeroes = partyIds.map((id) => heroesById.get(id)).filter((h): h is NonNullable<typeof h> => !!h);

  const [selected, setSelected] = useState<string | null>(null);
  useEffect(() => {
    if (!selected && partyHeroes[0]) setSelected(partyHeroes[0].id);
  }, [partyHeroes, selected]);

  const hero = partyHeroes.find((h) => h.id === selected);
  const [rules, setRules] = useState<PriorityRule[]>([]);
  useEffect(() => {
    if (hero) setRules((hero.priorities as unknown as PriorityRule[]) ?? []);
  }, [hero?.id]);

  const saveMut = useMutation({
    mutationFn: (payload: { heroId: string; priorities: PriorityRule[] }) => update({ data: payload }),
    onSuccess: async () => {
      toast.success("Prioridades salvas.");
      await queryClient.invalidateQueries({ queryKey: ["my-heroes"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const resetMut = useMutation({
    mutationFn: (heroId: string) => reset({ data: { heroId } }),
    onSuccess: async (res) => {
      setRules(res.priorities);
      toast.success("Prioridades restauradas.");
      await queryClient.invalidateQueries({ queryKey: ["my-heroes"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 md:px-6">
      <header className="mb-6">
        <h1 className="font-display text-3xl">Prioridades da IA</h1>
        <p className="text-sm text-muted-foreground">
          Cada herói executa a primeira regra cuja condição seja verdadeira. Se nenhuma valer, ataca com o básico.
        </p>
      </header>

      <div className="mb-4 flex flex-wrap gap-2">
        {partyHeroes.map((h) => (
          <button
            key={h.id}
            type="button"
            onClick={() => setSelected(h.id)}
            className={`rounded-md border px-3 py-1.5 text-sm transition ${
              selected === h.id ? "border-primary bg-primary/10 text-foreground" : "border-border/60 text-muted-foreground hover:text-foreground"
            }`}
          >
            {h.name} <span className="text-xs text-muted-foreground">· {h.class_slug}</span>
          </button>
        ))}
      </div>

      {!hero ? (
        <p className="text-sm text-muted-foreground">Selecione um herói.</p>
      ) : (
        <Card className="border-border/60 bg-card/70">
          <CardContent className="space-y-3 p-4 md:p-6">
            {rules.length === 0 && (
              <p className="text-sm text-muted-foreground">Nenhuma regra. Adicione a primeira ou restaure o padrão.</p>
            )}
            {rules.map((r, i) => (
              <div key={i} className="grid grid-cols-[auto_1fr_1fr_1fr_auto] items-center gap-2 rounded-md border border-border/50 bg-background/50 p-2">
                <span className="w-6 text-center font-mono text-xs text-muted-foreground">{i + 1}</span>
                <SelectField
                  value={r.ability}
                  onChange={(v) => setRules((rs) => rs.map((x, idx) => (idx === i ? { ...x, ability: v as AbilitySlug } : x)))}
                  options={ABILITY_OPTIONS}
                  labels={ABILITY_LABELS}
                />
                <SelectField
                  value={r.target}
                  onChange={(v) => setRules((rs) => rs.map((x, idx) => (idx === i ? { ...x, target: v as TargetKind } : x)))}
                  options={TARGET_OPTIONS}
                  labels={TARGET_LABELS}
                />
                <SelectField
                  value={r.condition}
                  onChange={(v) => setRules((rs) => rs.map((x, idx) => (idx === i ? { ...x, condition: v as ConditionKind } : x)))}
                  options={CONDITION_OPTIONS}
                  labels={CONDITION_LABELS}
                />
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" disabled={i === 0} onClick={() => setRules((rs) => swap(rs, i, i - 1))}>
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" disabled={i === rules.length - 1} onClick={() => setRules((rs) => swap(rs, i, i + 1))}>
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => setRules((rs) => rs.filter((_, idx) => idx !== i))}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}

            <div className="flex flex-wrap justify-between gap-2 pt-2">
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={rules.length >= 8}
                  onClick={() => setRules((rs) => [...rs, { ability: "basic", target: "lowest_hp_enemy", condition: "always" }])}
                >
                  <Plus className="mr-1 h-4 w-4" /> Regra
                </Button>
                <Button size="sm" variant="ghost" onClick={() => resetMut.mutate(hero.id)} disabled={resetMut.isPending}>
                  <RotateCcw className="mr-1 h-4 w-4" /> Restaurar padrão
                </Button>
              </div>
              <Button
                size="sm"
                onClick={() => saveMut.mutate({ heroId: hero.id, priorities: rules })}
                disabled={saveMut.isPending}
              >
                <Save className="mr-1 h-4 w-4" /> Salvar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function SelectField({
  value,
  onChange,
  options,
  labels,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  labels: Record<string, string>;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o} value={o}>{labels[o] ?? o}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function swap<T>(arr: T[], i: number, j: number): T[] {
  const copy = arr.slice();
  [copy[i], copy[j]] = [copy[j], copy[i]];
  return copy;
}

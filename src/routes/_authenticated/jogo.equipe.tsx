import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { Users, X } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getMyHeroes, getMyParty, setPartySlot } from "@/lib/hero.functions";

import guardiaoImg from "@/assets/classes/guardiao.jpg";
import espadachimImg from "@/assets/classes/espadachim.jpg";
import arqueiroImg from "@/assets/classes/arqueiro.jpg";
import arcanistaImg from "@/assets/classes/arcanista.jpg";
import videnteImg from "@/assets/classes/vidente.jpg";
import punhoImg from "@/assets/classes/punho.jpg";

const portraits: Record<string, string> = {
  guardiao: guardiaoImg,
  espadachim: espadachimImg,
  arqueiro: arqueiroImg,
  arcanista: arcanistaImg,
  vidente: videnteImg,
  punho: punhoImg,
};

const SLOTS = ["slot1", "slot2", "slot3", "slot4"] as const;
type Slot = (typeof SLOTS)[number];

export const Route = createFileRoute("/_authenticated/jogo/equipe")({
  head: () => ({
    meta: [
      { title: "Equipe — Aetherfall Online" },
      { name: "description", content: "Monte sua equipe de 4 heróis em Aetherfall Online." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: EquipePage,
});

function EquipePage() {
  const queryClient = useQueryClient();
  const listHeroes = useServerFn(getMyHeroes);
  const getParty = useServerFn(getMyParty);
  const setSlot = useServerFn(setPartySlot);

  const heroesQ = useQuery({ queryKey: ["my-heroes"], queryFn: () => listHeroes() });
  const partyQ = useQuery({ queryKey: ["my-party"], queryFn: () => getParty() });

  const [pickerSlot, setPickerSlot] = useState<Slot | null>(null);

  const mutation = useMutation({
    mutationFn: (payload: { slot: Slot; heroId: string | null }) => setSlot({ data: payload }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["my-party"] });
      setPickerSlot(null);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const heroes = heroesQ.data ?? [];
  const party = partyQ.data;
  const heroById = new Map(heroes.map((h) => [h.id, h]));

  if (heroesQ.isLoading || partyQ.isLoading) {
    return <div className="mx-auto max-w-4xl px-4 py-12 text-center text-muted-foreground">Reunindo sua equipe…</div>;
  }
  if (!party) {
    return <div className="mx-auto max-w-4xl px-4 py-12 text-center text-muted-foreground">Nenhuma equipe encontrada.</div>;
  }

  const slotIds: Record<Slot, string | null> = {
    slot1: party.slot1, slot2: party.slot2, slot3: party.slot3, slot4: party.slot4,
  };
  const inParty = new Set(Object.values(slotIds).filter(Boolean) as string[]);
  const reserve = heroes.filter((h) => !inParty.has(h.id));

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 md:px-6">
      <header className="mb-6 flex items-center gap-3">
        <Users className="h-6 w-6 text-primary" />
        <div>
          <h1 className="font-display text-3xl">Sua equipe</h1>
          <p className="text-sm text-muted-foreground">
            Selecione até 4 heróis para as batalhas. Toque em um slot para trocá-lo.
          </p>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {SLOTS.map((slot, i) => {
          const heroId = slotIds[slot];
          const hero = heroId ? heroById.get(heroId) : undefined;
          return (
            <Card
              key={slot}
              className={cn(
                "border-border/60 bg-card/70 backdrop-blur transition hover:border-primary",
                pickerSlot === slot && "border-primary ring-2 ring-primary",
              )}
            >
              <CardContent className="p-3">
                <button
                  type="button"
                  onClick={() => setPickerSlot(pickerSlot === slot ? null : slot)}
                  className="block w-full text-left"
                >
                  <div className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">
                    Slot {i + 1}
                  </div>
                  {hero ? (
                    <div className="space-y-2">
                      <div className="aspect-square overflow-hidden rounded-md">
                        <img
                          src={portraits[hero.class_slug]}
                          alt={hero.name}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div>
                        <div className="font-display text-lg leading-tight">{hero.name}</div>
                        <div className="text-xs text-muted-foreground capitalize">
                          {hero.class_slug} · Nv {hero.level}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="grid aspect-square place-items-center rounded-md border border-dashed border-border/60 text-sm text-muted-foreground">
                      Vazio
                    </div>
                  )}
                </button>
                {hero && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2 h-7 w-full text-xs"
                    onClick={() => mutation.mutate({ slot, heroId: null })}
                    disabled={mutation.isPending}
                  >
                    <X className="mr-1 h-3 w-3" /> Remover
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <section className="mt-8">
        <h2 className="mb-3 font-display text-xl">
          {pickerSlot ? `Escolha um herói para o slot ${pickerSlot.slice(-1)}` : "Reserva"}
        </h2>
        {reserve.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Todos os seus heróis estão na equipe.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {reserve.map((h) => (
              <button
                key={h.id}
                type="button"
                disabled={!pickerSlot || mutation.isPending}
                onClick={() => pickerSlot && mutation.mutate({ slot: pickerSlot, heroId: h.id })}
                className={cn(
                  "overflow-hidden rounded-md border border-border/60 bg-card text-left transition",
                  pickerSlot
                    ? "hover:border-primary hover:shadow-gold"
                    : "opacity-70",
                )}
              >
                <div className="aspect-square overflow-hidden">
                  <img
                    src={portraits[h.class_slug]}
                    alt={h.name}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="p-2">
                  <div className="truncate text-sm font-medium">{h.name}</div>
                  <div className="text-[11px] capitalize text-muted-foreground">
                    {h.class_slug} · Nv {h.level}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

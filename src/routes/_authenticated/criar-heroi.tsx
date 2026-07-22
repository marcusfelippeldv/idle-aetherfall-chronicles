import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { Sparkles, Shield, Swords, Target, Wand2, Sun, Zap } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { listBaseClasses, createProtagonist, getMyHeroes } from "@/lib/hero.functions";

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

const icons: Record<string, React.ComponentType<{ className?: string }>> = {
  guardiao: Shield,
  espadachim: Swords,
  arqueiro: Target,
  arcanista: Wand2,
  vidente: Sun,
  punho: Zap,
};

export const Route = createFileRoute("/_authenticated/criar-heroi")({
  head: () => ({
    meta: [
      { title: "Criar Condutor — Aetherfall Online" },
      { name: "description", content: "Escolha a classe do seu Condutor e comece sua jornada em Aetherfall." },
      { property: "og:title", content: "Criar Condutor — Aetherfall Online" },
      { property: "og:description", content: "Escolha sua classe inicial e inicie a saga dos Núcleos Astrais." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CreateHeroPage,
});

function CreateHeroPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const listClasses = useServerFn(listBaseClasses);
  const listHeroes = useServerFn(getMyHeroes);
  const create = useServerFn(createProtagonist);

  const heroesQ = useQuery({ queryKey: ["my-heroes"], queryFn: () => listHeroes() });
  const classesQ = useQuery({ queryKey: ["base-classes"], queryFn: () => listClasses() });

  const [name, setName] = useState("");
  const [selected, setSelected] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: (payload: { name: string; classSlug: string }) =>
      create({ data: payload }),
    onSuccess: async () => {
      toast.success("Condutor forjado! Bem-vindo a Aetherfall.");
      await queryClient.invalidateQueries({ queryKey: ["my-heroes"] });
      navigate({ to: "/jogo" });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  if (heroesQ.data && heroesQ.data.some((h) => h.is_protagonist)) {
    navigate({ to: "/jogo", replace: true });
    return null;
  }

  const classes = classesQ.data ?? [];

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 md:px-6">
      <header className="text-center">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-gold-gradient text-primary-foreground shadow-gold">
          <Sparkles className="h-7 w-7" />
        </div>
        <h1 className="mt-4 font-display text-4xl">Forje seu Condutor</h1>
        <p className="mt-2 text-muted-foreground">
          Escolha a classe inicial do seu protagonista. Cada classe evolui em duas trilhas mais adiante.
        </p>
      </header>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {classes.map((c) => {
          const Icon = icons[c.slug] ?? Sparkles;
          const active = selected === c.slug;
          return (
            <button
              key={c.slug}
              type="button"
              onClick={() => setSelected(c.slug)}
              className={cn(
                "group relative overflow-hidden rounded-xl border bg-card text-left transition",
                active
                  ? "border-primary shadow-gold ring-2 ring-primary"
                  : "border-border/60 hover:border-primary/60",
              )}
            >
              <div className="aspect-[4/5] w-full overflow-hidden">
                <img
                  src={portraits[c.slug]}
                  alt={c.name}
                  width={1024}
                  height={1280}
                  loading="lazy"
                  className="h-full w-full object-cover transition group-hover:scale-105"
                />
              </div>
              <div className="space-y-2 p-4">
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-primary" />
                  <h2 className="font-display text-xl">{c.name}</h2>
                  <span className="ml-auto text-xs uppercase tracking-wide text-muted-foreground">
                    {c.role}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{c.description}</p>
                <dl className="grid grid-cols-5 gap-1 pt-2 text-center text-[11px]">
                  <Stat label="HP" value={c.base_hp} />
                  <Stat label="MP" value={c.base_mana} />
                  <Stat label="ATK" value={c.base_atk} />
                  <Stat label="DEF" value={c.base_def} />
                  <Stat label="SPD" value={c.base_spd} />
                </dl>
                <p className="pt-2 text-xs text-primary">
                  Despertar: <span className="text-foreground">{c.awakening_name}</span>
                </p>
              </div>
            </button>
          );
        })}
      </div>

      <Card className="mt-8 border-border/60 bg-card/70 backdrop-blur">
        <CardContent className="grid gap-4 p-6 md:grid-cols-[1fr_auto] md:items-end">
          <div className="space-y-2">
            <Label htmlFor="hero-name">Nome do Condutor</Label>
            <Input
              id="hero-name"
              maxLength={24}
              placeholder="ex.: Kael, Sylvaine, Aetherius"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <Button
            className="shadow-gold"
            disabled={mutation.isPending || !selected || name.trim().length < 2}
            onClick={() => selected && mutation.mutate({ name: name.trim(), classSlug: selected })}
          >
            {mutation.isPending ? "Forjando…" : "Iniciar jornada"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md bg-muted/40 py-1">
      <div className="text-muted-foreground">{label}</div>
      <div className="font-semibold">{value}</div>
    </div>
  );
}

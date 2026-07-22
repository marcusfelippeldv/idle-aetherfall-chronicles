import { useEffect, useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Dices, Heart, Shield, Sparkles, Swords, Wind, Zap } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { listArchetypes } from "@/lib/catalog.functions";
import { createCharacter } from "@/lib/character.functions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/criar-heroi")({
  head: () => ({
    meta: [
      { title: "Criar herói — Aetherfall Online" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: NewCharacterPage,
});

const ROLE_LABEL: Record<string, string> = {
  tank_melee: "Tanque",
  tank_agile: "Tanque ágil",
  ranger: "Distância",
  mage_dps: "Mago ofensivo",
  mage_support: "Suporte místico",
};

function NewCharacterPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const archesFn = useServerFn(listArchetypes);
  const createFn = useServerFn(createCharacter);
  const [name, setName] = useState(() => randomHeroName());
  const [archetypeId, setArchetypeId] = useState<string | null>(null);

  const archesQ = useQuery({ queryKey: ["catalog", "archetypes"], queryFn: () => archesFn() });
  const selected = useMemo(
    () => (archesQ.data ?? []).find((a) => a.id === archetypeId) ?? null,
    [archesQ.data, archetypeId],
  );

  useEffect(() => {
    if (!archetypeId && archesQ.data?.[0]?.id) setArchetypeId(archesQ.data[0].id);
  }, [archetypeId, archesQ.data]);

  const mut = useMutation({
    mutationFn: (input: { name: string; archetypeId: string }) => createFn({ data: input }),
    onSuccess: async () => {
      await qc.refetchQueries({ queryKey: ["me", "character"] });
      toast.success("Herói forjado! Bem-vindo(a) a Aetherfall.");
      navigate({ to: "/jogo/arena" });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : String(e)),
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return toast.error("Digite um nome para o herói.");
    if (!archetypeId) return toast.error("Escolha um arquétipo.");
    mut.mutate({ name: trimmed, archetypeId });
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 md:px-6 md:py-14">
      <header className="mb-8">
        <p className="font-display text-sm uppercase tracking-[0.3em] text-primary">Bastião · Forja</p>
        <h1 className="mt-1 font-display text-4xl">Escolha seu arquétipo</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Cada arquétipo tem um papel diferente na coorte. Mais adiante você recrutará dois aliados para formar seu trio.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {(archesQ.data ?? []).map((a) => (
          <button
            key={a.id}
            type="button"
            onClick={() => setArchetypeId(a.id)}
            className={cn(
              "text-left rounded-lg border p-5 transition hover:border-primary/60 hover:shadow-lg",
              archetypeId === a.id ? "border-primary bg-primary/10 shadow-gold" : "border-border/60 bg-card/60",
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-display text-xl">{a.name}</h3>
              <Badge variant="outline" className="text-[10px]">{ROLE_LABEL[a.role] ?? a.role}</Badge>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{a.description}</p>
            <div className="mt-4 grid grid-cols-5 gap-2 text-xs">
              <Stat icon={<Heart className="h-3 w-3" />} value={a.base_hp} />
              <Stat icon={<Zap className="h-3 w-3" />} value={a.base_mana} />
              <Stat icon={<Swords className="h-3 w-3" />} value={a.base_attack} />
              <Stat icon={<Shield className="h-3 w-3" />} value={a.base_defense} />
              <Stat icon={<Wind className="h-3 w-3" />} value={a.base_speed} />
            </div>
          </button>
        ))}
      </div>

      <Card className="mt-8 border-border/60 bg-card/60">
        <CardHeader>
          <CardTitle className="font-display flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" /> Nomeie seu herói
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <div className="flex items-end justify-between gap-3">
                <Label htmlFor="name">Nome</Label>
                <Button type="button" variant="ghost" size="sm" onClick={() => setName(randomHeroName())}>
                  <Dices className="h-4 w-4" /> Aleatório
                </Button>
              </div>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex.: Kaelen Nightbringer"
                maxLength={20}
              />
              <p className="mt-1 text-xs text-muted-foreground">3 a 20 caracteres.</p>
            </div>
            <div className="rounded-md border border-border/60 bg-background/40 px-4 py-3 text-sm text-muted-foreground">
              Arquétipo selecionado:{" "}
              <span className="font-medium text-foreground">{selected?.name ?? "carregando…"}</span>
            </div>
            <Button
              type="submit"
              size="lg"
              disabled={archesQ.isLoading || !name.trim() || !archetypeId || mut.isPending}
            >
              {mut.isPending ? "Forjando…" : "Iniciar jornada"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function randomHeroName() {
  const titles = ["Ari", "Kael", "Luma", "Nero", "Talon", "Vera", "Zyn", "Orin", "Sable", "Rion"];
  const suffix = Math.floor(1000 + Math.random() * 9000);
  return `${titles[Math.floor(Math.random() * titles.length)]} ${suffix}`;
}

function Stat({ icon, value }: { icon: React.ReactNode; value: number }) {
  return (
    <div className="flex items-center gap-1 rounded bg-background/40 px-2 py-1">
      {icon}
      <span className="font-medium">{value}</span>
    </div>
  );
}

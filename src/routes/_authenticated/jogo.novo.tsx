import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Heart, Shield, Swords, Wind } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { listClasses } from "@/lib/catalog.functions";
import { createCharacter } from "@/lib/character.functions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/jogo/novo")({
  head: () => ({
    meta: [
      { title: "Criar herói — Aetherfall Online" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: NewCharacterPage,
});

function NewCharacterPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const classesFn = useServerFn(listClasses);
  const createFn = useServerFn(createCharacter);
  const [name, setName] = useState("");
  const [classId, setClassId] = useState<string | null>(null);

  const classesQ = useQuery({ queryKey: ["catalog", "classes"], queryFn: () => classesFn() });

  const mut = useMutation({
    mutationFn: (input: { name: string; classId: string }) => createFn({ data: input }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["me", "character"] });
      toast.success("Herói criado! Bem-vindo(a) a Aetherfall.");
      navigate({ to: "/jogo/arena" });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : String(e)),
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 md:px-6 md:py-14">
      <header className="mb-8">
        <p className="font-display text-sm uppercase tracking-[0.3em] text-primary">Etapa 1</p>
        <h1 className="mt-1 font-display text-4xl">Crie seu herói</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Escolha a classe que definirá o estilo de combate e os atributos base.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {(classesQ.data ?? []).map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setClassId(c.id)}
            className={cn(
              "text-left rounded-lg border p-5 transition hover:border-primary/60 hover:shadow-lg",
              classId === c.id ? "border-primary bg-primary/10 shadow-gold" : "border-border/60 bg-card/60",
            )}
          >
            <h3 className="font-display text-xl">{c.name}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{c.description}</p>
            <div className="mt-4 grid grid-cols-4 gap-2 text-xs">
              <Stat icon={<Heart className="h-3 w-3" />} value={c.base_hp} />
              <Stat icon={<Swords className="h-3 w-3" />} value={c.base_attack} />
              <Stat icon={<Shield className="h-3 w-3" />} value={c.base_defense} />
              <Stat icon={<Wind className="h-3 w-3" />} value={c.base_speed} />
            </div>
          </button>
        ))}
      </div>

      <Card className="mt-8 border-border/60 bg-card/60">
        <CardHeader>
          <CardTitle className="font-display">Nome do herói</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="name">Nome</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex.: Kaelen Nightbringer"
              maxLength={20}
            />
            <p className="mt-1 text-xs text-muted-foreground">3 a 20 caracteres.</p>
          </div>
          <Button
            size="lg"
            disabled={!name.trim() || !classId || mut.isPending}
            onClick={() => mut.mutate({ name: name.trim(), classId: classId! })}
          >
            {mut.isPending ? "Criando…" : "Iniciar jornada"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({ icon, value }: { icon: React.ReactNode; value: number }) {
  return (
    <div className="flex items-center gap-1 rounded bg-background/40 px-2 py-1">
      {icon}
      <span className="font-medium">{value}</span>
    </div>
  );
}

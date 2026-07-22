import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Crown, Lock, Users } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getMyCharacter } from "@/lib/character.functions";

export const Route = createFileRoute("/_authenticated/jogo/coorte")({
  head: () => ({
    meta: [
      { title: "Coorte — Aetherfall Online" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CoortePage,
});

function CoortePage() {
  const characterFn = useServerFn(getMyCharacter);
  const q = useQuery({ queryKey: ["me", "character"], queryFn: () => characterFn() });

  if (q.isLoading) {
    return (
      <div className="mx-auto max-w-4xl space-y-3 px-4 py-10 md:px-6 md:py-14">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  const character = q.data?.character as any;
  if (!character) return <Navigate to="/criar-heroi" replace />;
  const arche = Array.isArray(character.archetypes) ? character.archetypes[0] : character.archetypes;

  const slots = [
    { filled: true, character, arche },
    { filled: false, unlockLevel: 5 },
    { filled: false, unlockLevel: 10 },
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 md:px-6 md:py-14">
      <header className="mb-6">
        <p className="font-display text-sm uppercase tracking-[0.3em] text-primary">Bastião</p>
        <h1 className="mt-1 font-display text-4xl">Coorte</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Sua coorte comporta até 3 heróis. Novos slots são desbloqueados conforme o líder avança.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        {slots.map((s, i) => (
          <Card
            key={i}
            className={s.filled ? "border-primary/40 bg-card/70" : "border-dashed border-border/60 bg-card/30"}
          >
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between font-display text-base">
                <span>Slot {i + 1}</span>
                {i === 0 ? (
                  <Badge variant="outline" className="bg-primary/15 text-primary">
                    <Crown className="mr-1 h-3 w-3" /> Líder
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-muted-foreground">
                    <Lock className="mr-1 h-3 w-3" /> Nv. {s.unlockLevel}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {s.filled ? (
                <div>
                  <p className="font-display text-2xl">{s.character.name}</p>
                  <p className="text-xs uppercase tracking-widest text-primary">{s.arche?.name}</p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Nível {s.character.level} · HP {s.character.max_hp} · ATK {s.character.attack}
                  </p>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Recrute um companheiro ao atingir o nível {s.unlockLevel}. Em breve.
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mt-6 border-dashed border-primary/40 bg-card/40">
        <CardContent className="flex flex-wrap items-center justify-between gap-3 p-6">
          <div>
            <p className="flex items-center gap-2 font-display text-sm text-primary">
              <Users className="h-4 w-4" /> Recrutamento em construção
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Guildas, party matchmaking e recrutas de aliados chegam nos próximos ciclos.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link to="/jogo/arena">Voltar à Incursão</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { ArrowLeft, Award, Lock, Gem, Coins, Check } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { getMyAchievements, claimAchievement } from "@/lib/achievements.functions";

export const Route = createFileRoute("/_authenticated/jogo/conquistas")({
  head: () => ({
    meta: [
      { title: "Conquistas — Aetherfall Online" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ConquistasPage,
});

const CATEGORY_LABEL: Record<string, string> = {
  level: "Progressão",
  expeditions: "Expedições",
  combat: "Combate",
  economy: "Economia",
  collection: "Coleção",
  general: "Geral",
};

function ConquistasPage() {
  const qc = useQueryClient();
  const listFn = useServerFn(getMyAchievements);
  const claimFn = useServerFn(claimAchievement);
  const q = useQuery({ queryKey: ["me", "achievements"], queryFn: () => listFn() });
  const claim = useMutation({
    mutationFn: (templateId: string) => claimFn({ data: { templateId } }),
    onSuccess: (r) => {
      toast.success(`Recompensa: +${r.premium} cristais${r.gold ? ` +${r.gold} ouro` : ""}`);
      qc.invalidateQueries({ queryKey: ["me"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : String(e)),
  });

  const grouped = (q.data?.items ?? []).reduce<Record<string, any[]>>((acc, it) => {
    (acc[it.category] ??= []).push(it);
    return acc;
  }, {});

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 md:px-6 md:py-14">
      <Button asChild variant="ghost" size="sm" className="mb-6">
        <Link to="/jogo/arena"><ArrowLeft className="mr-2 h-4 w-4" /> Voltar à arena</Link>
      </Button>
      <header className="mb-8">
        <p className="font-display text-sm uppercase tracking-[0.3em] text-primary">Conquistas</p>
        <h1 className="mt-1 font-display text-4xl">Marcos do herói</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Ganhe cristais permanentes ao atingir metas de longo prazo.
        </p>
      </header>

      {q.isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <div className="space-y-8">
          {Object.entries(grouped).map(([cat, items]) => (
            <section key={cat}>
              <h2 className="mb-3 font-display text-lg text-muted-foreground">
                {CATEGORY_LABEL[cat] ?? cat}
              </h2>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {items.map((a: any) => {
                  const state = a.claimed_at
                    ? "claimed"
                    : a.unlocked
                      ? "unlocked"
                      : "locked";
                  return (
                    <Card
                      key={a.id}
                      className={cn(
                        "border-border/60 bg-card/60 transition",
                        state === "locked" && "opacity-60",
                        state === "unlocked" && "border-primary/50 shadow-gold/20",
                      )}
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between gap-2">
                          <CardTitle className="font-display text-base">{a.title}</CardTitle>
                          {state === "locked" ? (
                            <Lock className="h-4 w-4 text-muted-foreground" />
                          ) : state === "claimed" ? (
                            <Check className="h-4 w-4 text-emerald-400" />
                          ) : (
                            <Award className="h-4 w-4 text-primary" />
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <p className="text-xs text-muted-foreground">{a.description}</p>
                        <div className="flex flex-wrap gap-1 text-[11px]">
                          {a.reward_premium > 0 && (
                            <Badge variant="outline" className="text-violet-300 border-violet-500/40">
                              <Gem className="mr-1 h-3 w-3" /> {a.reward_premium}
                            </Badge>
                          )}
                          {a.reward_gold > 0 && (
                            <Badge variant="outline" className="text-amber-300 border-amber-500/40">
                              <Coins className="mr-1 h-3 w-3" /> {a.reward_gold}
                            </Badge>
                          )}
                        </div>
                        {state === "unlocked" && (
                          <Button
                            className="w-full"
                            size="sm"
                            disabled={claim.isPending}
                            onClick={() => claim.mutate(a.id)}
                          >
                            Resgatar
                          </Button>
                        )}
                        {state === "claimed" && (
                          <p className="text-center text-[11px] text-emerald-400">Recompensa recebida</p>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

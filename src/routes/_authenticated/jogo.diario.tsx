import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { ArrowLeft, Coins, Sparkles, Target } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { getDailyQuests, claimDailyQuest } from "@/lib/quests.functions";

export const Route = createFileRoute("/_authenticated/jogo/diario")({
  head: () => ({
    meta: [
      { title: "Missões diárias — Aetherfall Online" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: DiarioPage,
});

function DiarioPage() {
  const qc = useQueryClient();
  const listFn = useServerFn(getDailyQuests);
  const claimFn = useServerFn(claimDailyQuest);
  const q = useQuery({ queryKey: ["me", "daily-quests"], queryFn: () => listFn() });
  const claim = useMutation({
    mutationFn: (questId: string) => claimFn({ data: { questId } }),
    onSuccess: (r) => {
      toast.success(
        `Recompensa recebida: +${r.rewardGold} ouro, +${r.rewardXp} XP, +${r.rewardSeasonXp} XP de temporada`,
      );
      qc.invalidateQueries({ queryKey: ["me"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : String(e)),
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 md:px-6 md:py-14">
      <Button asChild variant="ghost" size="sm" className="mb-6">
        <Link to="/jogo/arena"><ArrowLeft className="mr-2 h-4 w-4" /> Voltar à arena</Link>
      </Button>
      <header className="mb-8">
        <p className="font-display text-sm uppercase tracking-[0.3em] text-primary">Missões</p>
        <h1 className="mt-1 font-display text-4xl">Diárias</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Novas missões todos os dias à meia-noite (UTC). Complete e resgate antes do reset.
        </p>
      </header>

      {q.isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {(q.data?.quests ?? []).map((quest: any) => {
            const tpl = quest.daily_quest_templates;
            const done = quest.progress >= quest.target;
            const claimed = !!quest.claimed_at;
            return (
              <Card key={quest.id} className="border-border/60 bg-card/60">
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="font-display text-lg">{tpl.title}</CardTitle>
                    <Target className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-xs text-muted-foreground">{tpl.description}</p>
                  <div className="space-y-1">
                    <Progress value={(quest.progress / quest.target) * 100} />
                    <div className="text-right text-[11px] text-muted-foreground">
                      {quest.progress} / {quest.target}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1 text-[11px]">
                    {tpl.reward_gold > 0 && (
                      <Badge variant="outline" className="text-amber-300 border-amber-500/40">
                        <Coins className="mr-1 h-3 w-3" /> {tpl.reward_gold}
                      </Badge>
                    )}
                    {tpl.reward_xp > 0 && (
                      <Badge variant="outline" className="text-sky-300 border-sky-500/40">
                        +{tpl.reward_xp} XP
                      </Badge>
                    )}
                    {tpl.reward_season_xp > 0 && (
                      <Badge variant="outline" className="text-violet-300 border-violet-500/40">
                        <Sparkles className="mr-1 h-3 w-3" /> {tpl.reward_season_xp} passe
                      </Badge>
                    )}
                  </div>
                  <Button
                    className="w-full"
                    size="sm"
                    disabled={!done || claimed || claim.isPending}
                    onClick={() => claim.mutate(quest.id)}
                  >
                    {claimed ? "Resgatada" : done ? "Resgatar" : "Em progresso"}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

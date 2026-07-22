import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { ArrowLeft, Coins, Gem, Sparkles, Lock, Check } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getSeasonStatus, claimSeasonLevel } from "@/lib/season.functions";

export const Route = createFileRoute("/_authenticated/jogo/temporada")({
  head: () => ({
    meta: [
      { title: "Temporada — Aetherfall Online" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: TemporadaPage,
});

function TemporadaPage() {
  const qc = useQueryClient();
  const statusFn = useServerFn(getSeasonStatus);
  const claimFn = useServerFn(claimSeasonLevel);
  const q = useQuery({ queryKey: ["me", "season"], queryFn: () => statusFn() });
  const claim = useMutation({
    mutationFn: (level: number) => claimFn({ data: { level } }),
    onSuccess: () => {
      toast.success("Recompensa da temporada resgatada!");
      qc.invalidateQueries({ queryKey: ["me"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : String(e)),
  });

  if (q.isLoading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10 md:px-6 md:py-14">
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const season = q.data?.season;
  const progress = q.data?.progress ?? { season_xp: 0, claimed_levels: [] };
  const rewards = q.data?.rewards ?? [];

  if (!season) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10 md:px-6 md:py-14 text-center">
        <p className="text-sm text-muted-foreground">Nenhuma temporada ativa no momento.</p>
      </div>
    );
  }

  const maxXp = rewards[rewards.length - 1]?.xp_required ?? 1;
  const xp = Number(progress.season_xp ?? 0);
  const pct = Math.min(100, (xp / maxXp) * 100);
  const daysLeft = Math.max(
    0,
    Math.ceil((new Date(season.ends_at).getTime() - Date.now()) / 86_400_000),
  );

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 md:px-6 md:py-14">
      <Button asChild variant="ghost" size="sm" className="mb-6">
        <Link to="/jogo/arena"><ArrowLeft className="mr-2 h-4 w-4" /> Voltar à arena</Link>
      </Button>

      <header className="mb-8">
        <p className="font-display text-sm uppercase tracking-[0.3em] text-primary">
          <Sparkles className="mr-1 inline h-3 w-3" /> Temporada
        </p>
        <h1 className="mt-1 font-display text-4xl">{season.name}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{season.description}</p>
        <p className="mt-1 text-xs text-muted-foreground">Termina em {daysLeft} dias.</p>
      </header>

      <Card className="mb-8 border-primary/30 bg-gradient-to-br from-card via-card to-primary/10">
        <CardContent className="p-6">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span>XP da temporada</span>
            <span className="font-display">{xp.toLocaleString("pt-BR")} / {maxXp.toLocaleString("pt-BR")}</span>
          </div>
          <Progress value={pct} className="h-3" />
          <p className="mt-2 text-xs text-muted-foreground">
            Ganhe XP completando expedições, derrotando chefes e resgatando missões diárias.
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
        {rewards.map((r: any) => {
          const canClaim = xp >= r.xp_required && !progress.claimed_levels.includes(r.level);
          const claimed = progress.claimed_levels.includes(r.level);
          const locked = xp < r.xp_required;
          return (
            <Card
              key={r.level}
              className={cn(
                "border-border/60 bg-card/60 transition",
                canClaim && "border-primary/60",
                locked && "opacity-60",
              )}
            >
              <CardContent className="space-y-2 p-4 text-center">
                <div className="font-display text-xs uppercase tracking-wider text-muted-foreground">
                  Nível {r.level}
                </div>
                <div className="text-[11px] text-muted-foreground">
                  {r.xp_required.toLocaleString("pt-BR")} XP
                </div>
                <div className="flex flex-wrap justify-center gap-1">
                  {r.reward_gold > 0 && (
                    <Badge variant="outline" className="text-amber-300 border-amber-500/40">
                      <Coins className="mr-1 h-3 w-3" /> {r.reward_gold}
                    </Badge>
                  )}
                  {r.reward_premium > 0 && (
                    <Badge variant="outline" className="text-violet-300 border-violet-500/40">
                      <Gem className="mr-1 h-3 w-3" /> {r.reward_premium}
                    </Badge>
                  )}
                </div>
                {claimed ? (
                  <div className="pt-2 text-xs text-emerald-400">
                    <Check className="mr-1 inline h-3 w-3" /> Recebido
                  </div>
                ) : locked ? (
                  <div className="pt-2 text-xs text-muted-foreground">
                    <Lock className="mr-1 inline h-3 w-3" /> Bloqueado
                  </div>
                ) : (
                  <Button
                    size="sm"
                    className="mt-2 w-full"
                    disabled={!canClaim || claim.isPending}
                    onClick={() => claim.mutate(r.level)}
                  >
                    Resgatar
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

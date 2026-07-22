import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { CheckCircle2, Trophy, Coins, Gem } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { listDailyMissions, listAchievements, claimReward } from "@/lib/progression.functions";

export const Route = createFileRoute("/_authenticated/jogo/missoes")({
  head: () => ({
    meta: [
      { title: "Missões — Aetherfall Online" },
      { name: "description", content: "Missões diárias e conquistas de longo prazo." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: MissoesPage,
});

function MissoesPage() {
  const qc = useQueryClient();
  const dailyFn = useServerFn(listDailyMissions);
  const achFn = useServerFn(listAchievements);
  const claim = useServerFn(claimReward);

  const dailyQ = useQuery({ queryKey: ["daily-missions"], queryFn: () => dailyFn() });
  const achQ = useQuery({ queryKey: ["achievements"], queryFn: () => achFn() });

  const claimMut = useMutation({
    mutationFn: (v: { kind: "daily" | "achievement"; slug: string }) => claim({ data: v }),
    onSuccess: (r) => {
      toast.success(`Recompensa: +${r.gold} ouro${"premium" in r && r.premium ? ` · +${r.premium} cristais` : ""}`);
      qc.invalidateQueries({ queryKey: ["daily-missions"] });
      qc.invalidateQueries({ queryKey: ["achievements"] });
      qc.invalidateQueries({ queryKey: ["wallet"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 space-y-6">
      <section>
        <h2 className="mb-3 flex items-center gap-2 text-xl font-semibold"><Trophy className="h-5 w-5 text-primary" /> Missões diárias</h2>
        <div className="grid gap-2 sm:grid-cols-2">
          {(dailyQ.data ?? []).map((m) => (
            <Card key={m.slug} className="border border-border/60 bg-card/60">
              <CardContent className="p-3">
                <div className="mb-2 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">{m.name}</p>
                    <p className="text-xs text-muted-foreground">{m.description}</p>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-amber-300"><Coins className="h-3.5 w-3.5" /> {m.reward_gold}</div>
                </div>
                <Progress value={(m.progress / m.target) * 100} className="h-1.5" />
                <div className="mt-2 flex items-center justify-between">
                  <p className="text-[11px] text-muted-foreground">{m.progress}/{m.target}</p>
                  <Button size="sm" variant={m.claimed ? "ghost" : "default"} disabled={m.claimed || !m.complete || claimMut.isPending}
                    onClick={() => claimMut.mutate({ kind: "daily", slug: m.slug })}>
                    {m.claimed ? <><CheckCircle2 className="mr-1 h-3.5 w-3.5" /> Resgatado</> : m.complete ? "Resgatar" : "Em andamento"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 flex items-center gap-2 text-xl font-semibold"><Gem className="h-5 w-5 text-primary" /> Conquistas</h2>
        <div className="grid gap-2 sm:grid-cols-2">
          {(achQ.data ?? []).map((a) => {
            const complete = a.progress >= a.target;
            return (
              <Card key={a.slug} className="border border-border/60 bg-card/60">
                <CardContent className="p-3">
                  <div className="mb-2 flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold">{a.name}</p>
                      <p className="text-xs text-muted-foreground">{a.description}</p>
                    </div>
                    <div className="flex flex-col items-end gap-0.5 text-xs">
                      <span className="flex items-center gap-1 text-amber-300"><Coins className="h-3 w-3" /> {a.reward_gold}</span>
                      {a.reward_premium ? <span className="flex items-center gap-1 text-fuchsia-300"><Gem className="h-3 w-3" /> {a.reward_premium}</span> : null}
                    </div>
                  </div>
                  <Progress value={(a.progress / a.target) * 100} className="h-1.5" />
                  <div className="mt-2 flex items-center justify-between">
                    <p className="text-[11px] text-muted-foreground">{a.progress}/{a.target}</p>
                    <Button size="sm" variant={a.claimed ? "ghost" : "default"} disabled={a.claimed || !complete || claimMut.isPending}
                      onClick={() => claimMut.mutate({ kind: "achievement", slug: a.slug })}>
                      {a.claimed ? <><CheckCircle2 className="mr-1 h-3.5 w-3.5" /> Resgatado</> : complete ? "Resgatar" : "Bloqueada"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>
    </div>
  );
}

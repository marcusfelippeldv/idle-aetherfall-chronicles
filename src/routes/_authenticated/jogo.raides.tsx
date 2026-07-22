import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { ArrowLeft, Coins, Flame, Gem, Skull, Sparkles, Swords, Timer } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  attackRaid,
  claimRaidRewards,
  getRaidDetails,
  listActiveRaids,
} from "@/lib/raid.functions";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/jogo/raides")({
  head: () => ({
    meta: [
      { title: "Raides — Aetherfall Online" },
      {
        name: "description",
        content: "Enfrente chefes de elite ao lado de outros heróis em raids assíncronas.",
      },
      { property: "og:title", content: "Raides — Aetherfall Online" },
      {
        property: "og:description",
        content: "Chefes lendários de Aetheril esperam por sua investida. Contribua e receba recompensas.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: RaidesPage,
});

function RaidesPage() {
  const qc = useQueryClient();
  const listFn = useServerFn(listActiveRaids);
  const claimFn = useServerFn(claimRaidRewards);
  const q = useQuery({ queryKey: ["raids", "list"], queryFn: () => listFn(), refetchInterval: 15000 });

  useEffect(() => {
    const ch = supabase
      .channel("raids-realtime")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "raids" }, () => {
        qc.invalidateQueries({ queryKey: ["raids"] });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [qc]);

  const claimMut = useMutation({
    mutationFn: () => claimFn(),
    onSuccess: (r) => {
      if (r.claimed === 0) toast.info("Nenhuma recompensa pendente.");
      else toast.success(`+${r.gold} ouro · +${r.crystals} cristais de ${r.claimed} raid(s).`);
      qc.invalidateQueries({ queryKey: ["me"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : String(e)),
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 md:px-6 md:py-14">
      <Button variant="ghost" size="sm" asChild className="mb-4">
        <Link to="/jogo/arena"><ArrowLeft className="mr-2 h-4 w-4" /> Voltar à Arena</Link>
      </Button>

      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Flame className="h-6 w-6 text-primary" />
            <h1 className="font-display text-3xl md:text-4xl">Raides Assíncronas</h1>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Coordene ataques com outros heróis. Recompensas são distribuídas conforme o dano causado.
          </p>
        </div>
        <Button onClick={() => claimMut.mutate()} disabled={claimMut.isPending}>
          <Sparkles className="mr-2 h-4 w-4" /> Reclamar recompensas
        </Button>
      </div>

      {q.isLoading ? (
        <Skeleton className="h-96 w-full" />
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {(q.data ?? []).map((r: any) => (
            <RaidCard key={r.id} raid={r} />
          ))}
        </div>
      )}
    </div>
  );
}

function RaidCard({ raid }: { raid: any }) {
  const qc = useQueryClient();
  const detailsFn = useServerFn(getRaidDetails);
  const attackFn = useServerFn(attackRaid);
  const detailsQ = useQuery({
    queryKey: ["raid", raid.id],
    queryFn: () => detailsFn({ data: { raidId: raid.id } }),
    refetchInterval: 10000,
  });

  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const attackMut = useMutation({
    mutationFn: () => attackFn({ data: { raidId: raid.id } }),
    onSuccess: (r) => {
      toast.success(`Você causou ${r.damage.toLocaleString("pt-BR")} de dano!`);
      if (r.defeated) toast.success("Raid derrotada!");
      qc.invalidateQueries({ queryKey: ["raid", raid.id] });
      qc.invalidateQueries({ queryKey: ["raids"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : String(e)),
  });

  const tpl = raid.raid_templates;
  const hpPct = Math.max(0, (Number(raid.current_hp) / Number(raid.total_hp)) * 100);
  const remainingMs = Math.max(0, new Date(raid.ends_at).getTime() - now);
  const hours = Math.floor(remainingMs / 3600000);
  const minutes = Math.floor((remainingMs % 3600000) / 60000);
  const my = detailsQ.data?.my;
  const cooldownMs = my?.last_hit_at
    ? Math.max(0, 5 * 60 * 1000 - (now - new Date(my.last_hit_at).getTime()))
    : 0;
  const cdSec = Math.ceil(cooldownMs / 1000);

  const isActive = raid.status === "active" && remainingMs > 0;

  return (
    <Card className="border-primary/30 bg-gradient-to-br from-card via-card to-primary/5">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="font-display text-2xl">{tpl?.name}</CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">{tpl?.description}</p>
          </div>
          <Badge variant="outline">
            <Timer className="mr-1 h-3 w-3" />
            {isActive ? `${hours}h ${minutes}m` : raid.status === "defeated" || raid.status === "settled" ? "Derrotada" : "Encerrada"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span><Skull className="mr-1 inline h-3 w-3" /> HP</span>
            <span>{Number(raid.current_hp).toLocaleString("pt-BR")} / {Number(raid.total_hp).toLocaleString("pt-BR")}</span>
          </div>
          <Progress value={hpPct} className="h-2 mt-1" />
        </div>

        <div className="flex flex-wrap gap-2 text-xs">
          <Badge variant="outline"><Coins className="mr-1 h-3 w-3" /> {tpl?.reward_gold} ouro base</Badge>
          <Badge variant="outline"><Gem className="mr-1 h-3 w-3" /> {tpl?.reward_crystals} cristais base</Badge>
          <Badge variant="outline">Nv. mín. {tpl?.min_level}</Badge>
        </div>

        <Button
          className="w-full"
          disabled={!isActive || attackMut.isPending || cdSec > 0}
          onClick={() => attackMut.mutate()}
        >
          <Swords className="mr-2 h-4 w-4" />
          {cdSec > 0
            ? `Aguarde ${Math.floor(cdSec / 60)}:${(cdSec % 60).toString().padStart(2, "0")}`
            : isActive
              ? "Investir agora"
              : "Encerrada"}
        </Button>

        {detailsQ.data?.contribs && detailsQ.data.contribs.length > 0 && (
          <div>
            <h4 className="mb-2 font-display text-sm">Contribuintes</h4>
            <ul className="space-y-1 text-xs">
              {detailsQ.data.contribs.slice(0, 5).map((c: any, i: number) => (
                <li key={i} className="flex justify-between">
                  <span>#{i + 1} {c.characters?.name ?? "—"}</span>
                  <span className="text-primary">{Number(c.damage).toLocaleString("pt-BR")} dano</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

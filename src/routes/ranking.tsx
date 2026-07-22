import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";

import { listRanking } from "@/lib/catalog.functions";
import { listTopGuilds } from "@/lib/guild.functions";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, Trophy } from "lucide-react";

const searchSchema = z.object({
  sort: z.enum(["power", "level", "bosses", "guilds"]).catch("power"),
});

export const Route = createFileRoute("/ranking")({
  validateSearch: (s) => searchSchema.parse(s),
  head: () => ({
    meta: [
      { title: "Ranking — Aetherfall Online" },
      {
        name: "description",
        content:
          "Os heróis e guildas mais poderosos de Aetherfall Online, atualizados em tempo real.",
      },
      { property: "og:title", content: "Ranking — Aetherfall Online" },
      {
        property: "og:description",
        content: "Descubra quem lidera as expedições e guildas no continente de Aetheril.",
      },
    ],
  }),
  component: RankingPage,
});

function RankingPage() {
  const { sort } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const heroesQ = useQuery({
    queryKey: ["public", "ranking", sort],
    queryFn: () => listRanking({ data: { sortBy: sort === "guilds" ? "power" : sort } }),
    enabled: sort !== "guilds",
  });
  const guildsQ = useQuery({
    queryKey: ["public", "guild-ranking"],
    queryFn: () => listTopGuilds(),
    enabled: sort === "guilds",
  });

  const valueOf = (r: any) => {
    if (sort === "level") return `Nv. ${r.level}`;
    if (sort === "bosses") return `${r.bossesCount} chefes`;
    return r.power.toLocaleString("pt-BR");
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 md:px-6 md:py-24">
      <div className="text-center">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-gold-gradient text-primary-foreground shadow-gold">
          <Trophy className="h-7 w-7" />
        </div>
        <h1 className="mt-4 font-display text-4xl md:text-5xl">Ranking Global</h1>
        <p className="mt-3 text-muted-foreground">
          Os heróis e guildas mais poderosos do reino.
        </p>
      </div>

      <Tabs
        value={sort}
        onValueChange={(v) => navigate({ search: { sort: v as any } })}
        className="mt-8"
      >
        <TabsList className="grid w-full grid-cols-4 max-w-md mx-auto">
          <TabsTrigger value="power">Poder</TabsTrigger>
          <TabsTrigger value="level">Nível</TabsTrigger>
          <TabsTrigger value="bosses">Chefes</TabsTrigger>
          <TabsTrigger value="guilds">Guildas</TabsTrigger>
        </TabsList>
      </Tabs>

      <Card className="mt-6 border-border/60 bg-card/60">
        <CardContent className="p-0">
          {sort === "guilds" ? (
            (guildsQ.data ?? []).length === 0 ? (
              <div className="py-16 text-center text-sm text-muted-foreground">
                Nenhuma guilda registrada ainda.
              </div>
            ) : (
              <ul className="divide-y divide-border/60">
                {(guildsQ.data ?? []).map((g: any, i: number) => (
                  <li key={g.id} className="flex items-center gap-4 px-6 py-3 hover:bg-muted/40">
                    <span
                      className={
                        "grid h-9 w-9 place-items-center rounded-md font-display text-sm " +
                        (i === 0
                          ? "bg-gold-gradient text-primary-foreground shadow-gold"
                          : i < 3
                            ? "bg-secondary text-secondary-foreground"
                            : "bg-muted text-muted-foreground")
                      }
                    >
                      #{i + 1}
                    </span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 font-medium">
                        <Shield className="h-3 w-3 text-primary" /> [{g.tag}] {g.name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {g.member_count} membros
                      </div>
                    </div>
                    <div className="font-display text-primary">
                      {Number(g.total_power).toLocaleString("pt-BR")}
                    </div>
                  </li>
                ))}
              </ul>
            )
          ) : (heroesQ.data ?? []).length === 0 ? (
            <div className="py-16 text-center text-sm text-muted-foreground">
              Ainda não há heróis registrados. Seja o primeiro a criar sua conta e reservar seu lugar no topo.
            </div>
          ) : (
            <ul className="divide-y divide-border/60">
              {(heroesQ.data ?? []).map((r, i) => (
                <li key={r.id} className="flex items-center gap-4 px-6 py-3 hover:bg-muted/40">
                  <span
                    className={
                      "grid h-9 w-9 place-items-center rounded-md font-display text-sm " +
                      (i === 0
                        ? "bg-gold-gradient text-primary-foreground shadow-gold"
                        : i < 3
                          ? "bg-secondary text-secondary-foreground"
                          : "bg-muted text-muted-foreground")
                    }
                  >
                    #{i + 1}
                  </span>
                  <div className="flex-1">
                    <div className="font-medium">{r.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {r.className ?? "—"} · Nível {r.level} · Poder{" "}
                      {r.power.toLocaleString("pt-BR")}
                    </div>
                  </div>
                  <div className="font-display text-primary">{valueOf(r)}</div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

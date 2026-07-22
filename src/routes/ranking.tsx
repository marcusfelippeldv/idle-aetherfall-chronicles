import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";

import { listRanking } from "@/lib/catalog.functions";
import { Card, CardContent } from "@/components/ui/card";
import { Trophy } from "lucide-react";

const rankingQuery = queryOptions({
  queryKey: ["public", "ranking"],
  queryFn: () => listRanking(),
});

export const Route = createFileRoute("/ranking")({
  head: () => ({
    meta: [
      { title: "Ranking — Aetherfall Online" },
      {
        name: "description",
        content:
          "Os heróis mais poderosos de Aetherfall Online, atualizados em tempo real.",
      },
      { property: "og:title", content: "Ranking — Aetherfall Online" },
      {
        property: "og:description",
        content: "Descubra quem lidera as expedições no continente de Aetheril.",
      },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(rankingQuery),
  component: RankingPage,
});

function RankingPage() {
  const { data: ranking } = useSuspenseQuery(rankingQuery);
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 md:px-6 md:py-24">
      <div className="text-center">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-gold-gradient text-primary-foreground shadow-gold">
          <Trophy className="h-7 w-7" />
        </div>
        <h1 className="mt-4 font-display text-4xl md:text-5xl">Ranking Global</h1>
        <p className="mt-3 text-muted-foreground">
          Os heróis mais poderosos do reino. Atualizado a cada expedição
          concluída.
        </p>
      </div>

      <Card className="mt-10 border-border/60 bg-card/60">
        <CardContent className="p-0">
          {ranking.length === 0 ? (
            <div className="py-16 text-center text-sm text-muted-foreground">
              Ainda não há heróis registrados. Seja o primeiro a criar sua
              conta e reservar seu lugar no topo.
            </div>
          ) : (
            <ul className="divide-y divide-border/60">
              {ranking.map((r, i) => (
                <li
                  key={r.id}
                  className="flex items-center gap-4 px-6 py-3 hover:bg-muted/40"
                >
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
                      {r.className ?? "—"} · Nível {r.level}
                    </div>
                  </div>
                  <div className="font-display text-primary">
                    {r.power.toLocaleString("pt-BR")}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { Trophy } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/ranking")({
  head: () => ({
    meta: [
      { title: "Ranking — Aetherfall Online" },
      { name: "description", content: "Ranking global dos heróis de Aetherfall Online — em reconstrução." },
      { property: "og:title", content: "Ranking — Aetherfall Online" },
      { property: "og:description", content: "O ranking retorna em breve com o ciclo Eternal Shards." },
    ],
  }),
  component: RankingPage,
});

function RankingPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 md:px-6 md:py-24">
      <div className="text-center">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-gold-gradient text-primary-foreground shadow-gold">
          <Trophy className="h-7 w-7" />
        </div>
        <h1 className="mt-4 font-display text-4xl md:text-5xl">Ranking Global</h1>
        <p className="mt-3 text-muted-foreground">Em reconstrução para o ciclo Eternal Shards.</p>
      </div>
      <Card className="mt-8 border-border/60 bg-card/60">
        <CardContent className="py-16 text-center text-sm text-muted-foreground">
          O ranking volta assim que os primeiros heróis forem forjados no novo sistema.
        </CardContent>
      </Card>
    </div>
  );
}

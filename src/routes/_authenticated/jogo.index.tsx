import { createFileRoute, Link } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/jogo/")({
  head: () => ({
    meta: [
      { title: "Bastião — Aetherfall Online" },
      { name: "description", content: "Bastião de Aetherfall Online — em reconstrução." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: JogoIndex,
});

function JogoIndex() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 md:px-6 md:py-24 text-center">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-gold-gradient text-primary-foreground shadow-gold">
        <Sparkles className="h-7 w-7" />
      </div>
      <h1 className="mt-6 font-display text-4xl">Bastião em reconstrução</h1>
      <p className="mt-3 text-muted-foreground">
        O ciclo <strong>Eternal Shards</strong> substituiu o sistema anterior. Classes, party, entidades ancestrais
        e regiões novas serão liberadas em breve.
      </p>
      <Card className="mt-8 border-border/60 bg-card/60">
        <CardContent className="py-10 text-sm text-muted-foreground">
          Próximo passo: criação de herói protagonista e escolha de classe inicial.
        </CardContent>
      </Card>
      <div className="mt-8">
        <Button asChild variant="outline"><Link to="/">Voltar ao início</Link></Button>
      </div>
    </div>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Aetherfall Online — RPG Idle épico" },
      {
        name: "description",
        content:
          "Aetherfall Online: RPG idle de party de quatro heróis, entidades ancestrais e regiões épicas. Em reconstrução para o ciclo Eternal Shards.",
      },
      { property: "og:title", content: "Aetherfall Online — RPG Idle épico" },
      {
        property: "og:description",
        content: "Forje sua party, desperte entidades ancestrais e conquiste as regiões de Aetherfall.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LandingPage,
});

function LandingPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-24 text-center md:px-6">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-gold-gradient text-primary-foreground shadow-gold">
        <Sparkles className="h-7 w-7" />
      </div>
      <h1 className="mt-6 font-display text-4xl md:text-6xl">Aetherfall Online</h1>
      <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
        O ciclo <strong>Eternal Shards</strong> está sendo reconstruído: novas classes, party de quatro heróis,
        entidades ancestrais e regiões épicas. Volte em breve para forjar seu grupo.
      </p>
      <div className="mt-8 flex justify-center gap-3">
        <Button asChild size="lg"><Link to="/cadastro">Criar conta</Link></Button>
        <Button asChild size="lg" variant="outline"><Link to="/login">Entrar</Link></Button>
      </div>
    </div>
  );
}

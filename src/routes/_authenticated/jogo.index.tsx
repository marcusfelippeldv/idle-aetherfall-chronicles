import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect } from "react";
import { Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getMyHeroes } from "@/lib/hero.functions";

export const Route = createFileRoute("/_authenticated/jogo/")({
  head: () => ({
    meta: [
      { title: "Bastião — Aetherfall Online" },
      { name: "description", content: "Bastião de Aetherfall Online — quartel-general do seu Condutor." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: JogoIndex,
});

function JogoIndex() {
  const navigate = useNavigate();
  const listHeroes = useServerFn(getMyHeroes);
  const heroesQ = useQuery({ queryKey: ["my-heroes"], queryFn: () => listHeroes() });

  const protagonist = heroesQ.data?.find((h) => h.is_protagonist);

  useEffect(() => {
    if (!heroesQ.isLoading && !protagonist) {
      navigate({ to: "/criar-heroi", replace: true });
    }
  }, [heroesQ.isLoading, protagonist, navigate]);

  if (heroesQ.isLoading || !protagonist) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center text-muted-foreground">
        Convocando seu Condutor…
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 md:px-6">
      <header className="text-center">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-gold-gradient text-primary-foreground shadow-gold">
          <Sparkles className="h-7 w-7" />
        </div>
        <h1 className="mt-4 font-display text-4xl">Bastião de {protagonist.name}</h1>
        <p className="mt-2 text-muted-foreground">
          Condutor da linhagem <strong>{protagonist.class_slug}</strong> — nível {protagonist.level}.
        </p>
      </header>

      <Card className="mt-8 border-border/60 bg-card/70 backdrop-blur">
        <CardContent className="space-y-3 p-6 text-center text-sm text-muted-foreground">
          <p>
            Sua equipe de 4 heróis, expedições pelas 5 regiões e o combate por iniciativa serão liberados nas próximas etapas do ciclo <strong>Eternal Shards</strong>.
          </p>
          <p>
            Por enquanto, seu Condutor aguarda no Bastião. Traga companheiros em breve.
          </p>
          <div className="pt-2">
            <Button asChild variant="outline"><Link to="/">Voltar ao início</Link></Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";

import { listClasses } from "@/lib/catalog.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const classesQuery = queryOptions({
  queryKey: ["public", "classes"],
  queryFn: () => listClasses(),
});

export const Route = createFileRoute("/classes")({
  head: () => ({
    meta: [
      { title: "Classes — Aetherfall Online" },
      {
        name: "description",
        content:
          "Conheça as cinco classes iniciais de Aetherfall Online: Guardião, Arcanista, Caçador, Clérigo e Duelista.",
      },
      { property: "og:title", content: "Classes — Aetherfall Online" },
      {
        property: "og:description",
        content:
          "Cinco caminhos para começar sua lenda. Cada classe evolui para uma especialização no nível 30.",
      },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(classesQuery),
  component: ClassesPage,
});

function ClassesPage() {
  const { data: classes } = useSuspenseQuery(classesQuery);
  return (
    <div className="mx-auto max-w-6xl px-4 py-16 md:px-6 md:py-24">
      <div className="mx-auto max-w-2xl text-center">
        <p className="font-display text-sm uppercase tracking-[0.3em] text-primary">
          Classes iniciais
        </p>
        <h1 className="mt-3 font-display text-4xl md:text-5xl text-balance">
          Escolha o começo da sua lenda
        </h1>
        <p className="mt-4 text-muted-foreground text-balance">
          No nível 30, cada classe se ramifica em uma especialização. Você pode
          criar múltiplos personagens para explorar todos os caminhos.
        </p>
      </div>

      <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {classes.map((c) => (
          <Card key={c.id} className="border-border/60 bg-card/60">
            <CardHeader>
              <CardTitle className="flex items-center justify-between font-display text-xl">
                {c.name}
                <Badge variant="secondary">Base</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{c.description}</p>
              <dl className="mt-4 grid grid-cols-4 gap-2 text-xs">
                <Stat label="HP" value={c.base_hp} />
                <Stat label="ATQ" value={c.base_attack} />
                <Stat label="DEF" value={c.base_defense} />
                <Stat label="VEL" value={c.base_speed} />
              </dl>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-border/60 bg-muted/40 p-2 text-center">
      <dt className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1 font-display text-base text-primary">{value}</dd>
    </div>
  );
}

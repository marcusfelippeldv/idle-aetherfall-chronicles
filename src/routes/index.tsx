import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import {
  Sparkles,
  Sword,
  Shield,
  Wand2,
  Crown,
  Trophy,
  Timer,
  Gem,
  ChevronRight,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { listClasses, listRegions } from "@/lib/catalog.functions";

const classesQuery = queryOptions({
  queryKey: ["public", "classes"],
  queryFn: () => listClasses(),
});
const regionsQuery = queryOptions({
  queryKey: ["public", "regions"],
  queryFn: () => listRegions(),
});

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Aetherfall Online — RPG Idle direto do navegador" },
      {
        name: "description",
        content:
          "Sua jornada continua, mesmo quando você está offline. Aetherfall Online é um RPG Idle de fantasia medieval mágica, jogável direto do navegador.",
      },
      { property: "og:title", content: "Aetherfall Online" },
      {
        property: "og:description",
        content:
          "RPG Idle inspirado nos JRPGs clássicos. Explore, evolua, derrote chefes — mesmo enquanto está offline.",
      },
    ],
  }),
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(classesQuery),
      context.queryClient.ensureQueryData(regionsQuery),
    ]),
  component: LandingPage,
});

function LandingPage() {
  const { data: classes } = useSuspenseQuery(classesQuery);
  const { data: regions } = useSuspenseQuery(regionsQuery);

  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{ background: "var(--gradient-arcane)" }}
        />
        <div
          className="pointer-events-none absolute -top-40 left-1/2 h-96 w-[64rem] -translate-x-1/2 rounded-full opacity-30 blur-3xl"
          style={{ background: "var(--gradient-gold)" }}
        />
        <div className="relative mx-auto max-w-6xl px-4 py-24 text-center md:px-6 md:py-32">
          <Badge
            variant="outline"
            className="mb-6 border-primary/40 bg-background/40 text-primary"
          >
            <Sparkles className="mr-1 h-3 w-3" /> Acesso antecipado em breve
          </Badge>
          <h1 className="mx-auto max-w-4xl font-display text-4xl leading-tight text-balance md:text-6xl">
            Sua jornada continua, mesmo quando você está{" "}
            <span className="bg-gold-gradient bg-clip-text text-transparent">
              offline
            </span>
            .
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground text-balance">
            Aetherfall Online é um RPG Idle de fantasia medieval mágica.
            Direto do navegador, sem downloads: forme sua party, explore
            regiões, derrote chefes e progrida enquanto vive sua vida.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg" className="shadow-gold">
              <Link to="/cadastro">
                Criar conta gratuita <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/classes">Ver as 5 classes</Link>
            </Button>
          </div>
          <p className="mt-6 text-xs text-muted-foreground">
            Sem instalação · Roda no celular · Progresso na nuvem
          </p>
        </div>
      </section>

      {/* IDLE */}
      <Section
        eyebrow="Progressão Idle"
        title="Combate automático. Recompensa constante."
        subtitle="Escolha a região e a duração da expedição. Sua equipe combate por conta própria e traz relatórios detalhados quando você volta."
      >
        <div className="grid gap-6 md:grid-cols-3">
          <Feature
            icon={<Timer className="h-6 w-6" />}
            title="Até 8h offline"
            body="Volte no fim do dia e receba tudo o que sua equipe conquistou — inimigos derrotados, XP, ouro e itens."
          />
          <Feature
            icon={<Gem className="h-6 w-6" />}
            title="Equipamentos raros"
            body="Comum, incomum, rara, épica e lendária. Compare atributos e equipe seus heróis para as próximas batalhas."
          />
          <Feature
            icon={<Trophy className="h-6 w-6" />}
            title="Chefes e regiões"
            body="Derrote o chefe de cada área para desbloquear novas terras, novos inimigos e novos loot."
          />
        </div>
      </Section>

      {/* CLASSES */}
      <Section
        eyebrow="Classes iniciais"
        title="Cinco caminhos, uma só lenda."
        subtitle="No nível 30, cada classe pode escolher uma especialização. Escolha o começo da sua história."
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {classes.map((c) => (
            <Card
              key={c.id}
              className="border-border/60 bg-card/60 backdrop-blur transition hover:-translate-y-1 hover:border-primary/40 hover:shadow-elegant"
            >
              <CardHeader className="pb-2">
                <div className="mb-3 grid h-10 w-10 place-items-center rounded-md bg-arcane-gradient">
                  <ClassIcon slug={c.slug} />
                </div>
                <CardTitle className="font-display text-lg">{c.name}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                {c.description}
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="mt-6 text-center">
          <Button asChild variant="ghost">
            <Link to="/classes">
              Explorar todas as classes <ChevronRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </Section>

      {/* REGIONS */}
      <Section
        eyebrow="Mundo"
        title="Do Vale de Nyros às Catacumbas de Vorhal."
        subtitle="Um universo original, sem referências a franquias existentes. Cada região tem sua história, seus inimigos e seu chefe."
      >
        <div className="grid gap-4 md:grid-cols-3">
          {regions.map((r) => (
            <Card
              key={r.id}
              className="border-border/60 bg-card/60"
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="font-display text-xl">
                    {r.name}
                  </CardTitle>
                  <Badge variant="secondary">Nível {r.required_level}+</Badge>
                </div>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                {r.description}
              </CardContent>
            </Card>
          ))}
        </div>
      </Section>

      {/* ROADMAP */}
      <Section
        eyebrow="Roadmap"
        title="Nossa jornada de desenvolvimento."
        subtitle="Estamos construindo o Aetherfall passo a passo, com foco no ciclo divertido antes de qualquer complexidade."
      >
        <ol className="grid gap-4 md:grid-cols-5">
          {[
            { n: 1, t: "Fundação", d: "Landing, contas, banco e admin." },
            { n: 2, t: "Jogo funcional", d: "Personagem, expedições, inventário." },
            { n: 3, t: "Economia", d: "Loja, cristais, pedidos e transações." },
            { n: 4, t: "Retenção", d: "Missões, conquistas, ranking, passe." },
            { n: 5, t: "Social", d: "Guildas, chat, party e raid coop." },
          ].map((s) => (
            <li
              key={s.n}
              className="rounded-lg border border-border/60 bg-card/50 p-4"
            >
              <div className="font-display text-2xl text-primary">
                0{s.n}
              </div>
              <div className="mt-2 font-medium">{s.t}</div>
              <div className="mt-1 text-xs text-muted-foreground">{s.d}</div>
            </li>
          ))}
        </ol>
        <div className="mt-6 text-center">
          <Button asChild variant="outline">
            <Link to="/roadmap">Ver detalhes do roadmap</Link>
          </Button>
        </div>
      </Section>

      {/* CTA */}
      <section className="mx-auto max-w-5xl px-4 pb-24 md:px-6">
        <div className="relative overflow-hidden rounded-2xl border border-primary/30 bg-arcane-gradient p-10 text-center shadow-elegant">
          <h2 className="font-display text-3xl md:text-4xl">
            O cristal foi quebrado. O mundo precisa de heróis.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            Crie sua conta e reserve seu nome antes do lançamento. Fundadores
            recebem título e emblema permanentes.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg" className="shadow-gold">
              <Link to="/cadastro">Criar minha conta</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/login">Já tenho conta</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}

function Section({
  eyebrow,
  title,
  subtitle,
  children,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16 md:px-6 md:py-24">
      <div className="mx-auto mb-10 max-w-2xl text-center">
        <p className="font-display text-sm uppercase tracking-[0.3em] text-primary">
          {eyebrow}
        </p>
        <h2 className="mt-3 font-display text-3xl md:text-4xl text-balance">
          {title}
        </h2>
        {subtitle ? (
          <p className="mt-3 text-muted-foreground text-balance">{subtitle}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function Feature({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-lg border border-border/60 bg-card/60 p-6">
      <div className="grid h-11 w-11 place-items-center rounded-md bg-gold-gradient text-primary-foreground shadow-gold">
        {icon}
      </div>
      <h3 className="mt-4 font-display text-lg">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{body}</p>
    </div>
  );
}

function ClassIcon({ slug }: { slug: string }) {
  const cn = "h-5 w-5 text-primary-foreground";
  switch (slug) {
    case "guardiao":
      return <Shield className={cn} />;
    case "arcanista":
      return <Wand2 className={cn} />;
    case "cacador":
      return <Sword className={cn} />;
    case "clerigo":
      return <Sparkles className={cn} />;
    case "duelista":
      return <Crown className={cn} />;
    default:
      return <Sparkles className={cn} />;
  }
}

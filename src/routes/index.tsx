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
import { listArchetypes, listZones } from "@/lib/catalog.functions";

const archetypesQuery = queryOptions({
  queryKey: ["public", "archetypes"],
  queryFn: () => listArchetypes(),
});
const zonesQuery = queryOptions({
  queryKey: ["public", "zones"],
  queryFn: () => listZones(),
});

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Aetherfall Online — RPG Idle de coortes e incursões" },
      {
        name: "description",
        content:
          "Forje sua coorte de três heróis, explore Zonas em incursões idle e cresça mesmo offline. RPG idle original direto no navegador.",
      },
      { property: "og:title", content: "Aetherfall Online — RPG Idle de coortes e incursões" },
      {
        property: "og:description",
        content:
          "Forje sua coorte de três heróis, explore Zonas em incursões idle e cresça mesmo offline.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(archetypesQuery),
      context.queryClient.ensureQueryData(zonesQuery),
    ]),
  component: LandingPage,
});

function LandingPage() {
  const { data: archetypes } = useSuspenseQuery(archetypesQuery);
  const { data: zones } = useSuspenseQuery(zonesQuery);

  return (
    <>
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 opacity-40" style={{ background: "var(--gradient-arcane)" }} />
        <div className="pointer-events-none absolute -top-40 left-1/2 h-96 w-[64rem] -translate-x-1/2 rounded-full opacity-30 blur-3xl" style={{ background: "var(--gradient-gold)" }} />
        <div className="relative mx-auto max-w-6xl px-4 py-24 text-center md:px-6 md:py-32">
          <Badge variant="outline" className="mb-6 border-primary/40 bg-background/40 text-primary">
            <Sparkles className="mr-1 h-3 w-3" /> Acesso antecipado em breve
          </Badge>
          <h1 className="mx-auto max-w-4xl font-display text-4xl leading-tight text-balance md:text-6xl">
            Sua coorte marcha, mesmo quando você está{" "}
            <span className="bg-gold-gradient bg-clip-text text-transparent">offline</span>.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground text-balance">
            Aetherfall Online é um RPG idle original: escolha um arquétipo, forme sua coorte de três heróis e conduza incursões por dez ondas até derrotar os chefes de cada Zona.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg" className="shadow-gold">
              <Link to="/cadastro">Criar conta gratuita <ChevronRight className="ml-1 h-4 w-4" /></Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/ranking">Ver ranking global</Link>
            </Button>
          </div>
          <p className="mt-6 text-xs text-muted-foreground">
            Sem instalação · Roda no celular · Progresso na nuvem
          </p>
        </div>
      </section>

      <Section
        eyebrow="Progressão Idle"
        title="Coorte automática. Recompensa constante."
        subtitle="Escolha uma Zona e envie sua coorte. Ela combate por dez ondas enquanto você vive sua vida — volte para reclamar XP, ouro e itens."
      >
        <div className="grid gap-6 md:grid-cols-3">
          <Feature icon={<Timer className="h-6 w-6" />} title="Progresso offline" body="Volte no fim do dia e receba tudo que a sua coorte conquistou nas incursões." />
          <Feature icon={<Gem className="h-6 w-6" />} title="Itens e forja" body="Comum a lendário — equipe seus três heróis para próximas Zonas e chefes." />
          <Feature icon={<Trophy className="h-6 w-6" />} title="Zonas e chefes" body="Cada Zona termina com um chefe único. Vença para desbloquear a próxima região." />
        </div>
      </Section>

      <Section
        eyebrow="Arquétipos originais"
        title="Cinco caminhos, uma só lenda."
        subtitle="Cada arquétipo tem papel distinto na coorte — combine forças para dominar toda incursão."
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {archetypes.map((a) => (
            <Card key={a.id} className="border-border/60 bg-card/60 backdrop-blur transition hover:-translate-y-1 hover:border-primary/40 hover:shadow-elegant">
              <CardHeader className="pb-2">
                <div className="mb-3 grid h-10 w-10 place-items-center rounded-md bg-arcane-gradient">
                  <ArchetypeIcon slug={a.slug} />
                </div>
                <CardTitle className="font-display text-lg">{a.name}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">{a.description}</CardContent>
            </Card>
          ))}
        </div>
      </Section>

      <Section
        eyebrow="O Mundo"
        title="Do Vilarejo Esquecido às Ruínas de Veyr."
        subtitle="Um universo original — cada Zona tem sua história, seus inimigos, seus chefes."
      >
        <div className="grid gap-4 md:grid-cols-3">
          {zones.map((z) => (
            <Card key={z.id} className="border-border/60 bg-card/60">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="font-display text-xl">{z.name}</CardTitle>
                  <Badge variant="secondary">Nível {z.required_level}+</Badge>
                </div>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                <p>{z.description}</p>
                <p className="mt-2 text-xs">Dificuldade {"★".repeat(z.difficulty_stars)} · {z.duration_minutes} min por incursão</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </Section>

      <section className="mx-auto max-w-5xl px-4 pb-24 md:px-6">
        <div className="relative overflow-hidden rounded-2xl border border-primary/30 bg-arcane-gradient p-10 text-center shadow-elegant">
          <h2 className="font-display text-3xl md:text-4xl">O véu se rompeu. Aetherfall precisa de heróis.</h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            Crie sua conta e reserve seu nome. Fundadores recebem título e emblema permanentes.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg" className="shadow-gold"><Link to="/cadastro">Criar minha conta</Link></Button>
            <Button asChild size="lg" variant="outline"><Link to="/login">Já tenho conta</Link></Button>
          </div>
        </div>
      </section>
    </>
  );
}

function Section({ eyebrow, title, subtitle, children }: { eyebrow: string; title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16 md:px-6 md:py-24">
      <div className="mx-auto mb-10 max-w-2xl text-center">
        <p className="font-display text-sm uppercase tracking-[0.3em] text-primary">{eyebrow}</p>
        <h2 className="mt-3 font-display text-3xl md:text-4xl text-balance">{title}</h2>
        {subtitle ? <p className="mt-3 text-muted-foreground text-balance">{subtitle}</p> : null}
      </div>
      {children}
    </section>
  );
}

function Feature({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="rounded-lg border border-border/60 bg-card/60 p-6">
      <div className="grid h-11 w-11 place-items-center rounded-md bg-gold-gradient text-primary-foreground shadow-gold">{icon}</div>
      <h3 className="mt-4 font-display text-lg">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{body}</p>
    </div>
  );
}

function ArchetypeIcon({ slug }: { slug: string }) {
  const cn = "h-5 w-5 text-primary-foreground";
  switch (slug) {
    case "guardiao": return <Shield className={cn} />;
    case "arcanista": return <Wand2 className={cn} />;
    case "arqueiro-astral": return <Sword className={cn} />;
    case "vidente": return <Sparkles className={cn} />;
    case "punho-da-aurora": return <Crown className={cn} />;
    default: return <Sparkles className={cn} />;
  }
}

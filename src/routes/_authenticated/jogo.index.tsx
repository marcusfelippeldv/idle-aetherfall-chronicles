import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  Backpack,
  Coins,
  Gem,
  Heart,
  ShieldCheck,
  Sparkles,
  Swords,
  Trophy,
  Users,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  claimBootstrapAdmin,
  getMyProfile,
  getMyRoles,
} from "@/lib/admin.functions";
import { getMyCharacter } from "@/lib/character.functions";

export const Route = createFileRoute("/_authenticated/jogo/")({
  head: () => ({
    meta: [
      { title: "Bastião — Aetherfall Online" },
      { name: "description", content: "Seu bastião em Aetherfall Online." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: BastionDashboard,
});

const SHORTCUTS = [
  { to: "/jogo/arena", label: "Incursão", desc: "Envie sua coorte às 10 ondas.", icon: Swords },
  { to: "/jogo/coorte", label: "Coorte", desc: "Composição do seu grupo.", icon: Users },
  { to: "/jogo/inventario", label: "Inventário", desc: "Loot e equipamentos.", icon: Backpack },
  { to: "/jogo/carteira", label: "Carteira", desc: "Ouro e cristais.", icon: Coins },
  { to: "/ranking", label: "Ranking", desc: "Top heróis de Aetherfall.", icon: Trophy },
] as const;

function BastionDashboard() {
  const profileFn = useServerFn(getMyProfile);
  const rolesFn = useServerFn(getMyRoles);
  const characterFn = useServerFn(getMyCharacter);
  const bootstrap = useServerFn(claimBootstrapAdmin);

  const profileQ = useQuery({ queryKey: ["me", "profile"], queryFn: () => profileFn() });
  const rolesQ = useQuery({ queryKey: ["me", "roles"], queryFn: () => rolesFn() });
  const characterQ = useQuery({ queryKey: ["me", "character"], queryFn: () => characterFn() });

  const bootstrapMut = useMutation({
    mutationFn: () => bootstrap(),
    onSuccess: (r) => {
      if (r.granted) {
        toast.success("Você agora é administrador do projeto.");
        rolesQ.refetch();
      } else toast.info("Um administrador já existe.");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : String(e)),
  });

  const roles = rolesQ.data?.roles ?? [];
  const isAdmin = roles.includes("admin");
  const character = characterQ.data?.character as any;
  const wallet = characterQ.data?.wallet as any;
  const arche = character && (Array.isArray(character.archetypes) ? character.archetypes[0] : character.archetypes);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 md:px-6 md:py-14">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-display text-sm uppercase tracking-[0.3em] text-primary">Bastião</p>
          <h1 className="mt-1 font-display text-4xl">
            Olá, {profileQ.data?.profile?.display_name ?? "herói"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {character
              ? "Seu bastião central. Acesse Incursão, Coorte, Inventário e Carteira."
              : "Forje seu primeiro herói para desbravar as Zonas de Aetherfall."}
          </p>
        </div>
        {isAdmin ? (
          <Button asChild variant="outline">
            <Link to="/admin">
              <ShieldCheck className="mr-2 h-4 w-4" /> Painel administrativo
            </Link>
          </Button>
        ) : null}
      </header>

      {characterQ.isLoading ? (
        <Skeleton className="h-32 w-full" />
      ) : character ? (
        <Card className="border-primary/40 bg-gradient-to-br from-card via-card to-primary/10">
          <CardContent className="grid gap-4 p-6 md:grid-cols-[1fr_auto]">
            <div>
              <p className="font-display text-xs uppercase tracking-[0.3em] text-primary">
                {arche?.name} · Nível {character.level}
              </p>
              <p className="font-display text-3xl">{character.name}</p>
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                <Badge variant="outline"><Heart className="mr-1 h-3 w-3" /> {character.current_hp}/{character.max_hp}</Badge>
                <Badge variant="outline"><Swords className="mr-1 h-3 w-3" /> ATK {character.attack}</Badge>
                <Badge variant="outline"><Coins className="mr-1 h-3 w-3 text-amber-400" /> {Number(wallet?.gold_balance ?? 0).toLocaleString("pt-BR")}</Badge>
                <Badge variant="outline"><Gem className="mr-1 h-3 w-3 text-violet-400" /> {Number(wallet?.premium_balance ?? 0).toLocaleString("pt-BR")}</Badge>
              </div>
            </div>
            <div className="flex items-center md:justify-end">
              <Button asChild size="lg">
                <Link to="/jogo/arena"><Swords className="mr-2 h-4 w-4" /> Ir à Incursão</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-primary/40 bg-gradient-to-br from-card via-card to-primary/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-display text-2xl">
              <Swords className="h-6 w-6 text-primary" /> Comece sua jornada
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Escolha um dos cinco arquétipos originais, dê nome ao seu herói e envie-o para a primeira Zona.
            </p>
            <Button asChild size="lg">
              <Link to="/criar-heroi">Forjar herói</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SHORTCUTS.map((s) => (
          <Link key={s.to} to={s.to} className="group">
            <Card className="h-full border-border/60 bg-card/60 transition group-hover:-translate-y-0.5 group-hover:border-primary/40 group-hover:bg-card">
              <CardContent className="flex items-start gap-4 p-6">
                <div className="grid h-11 w-11 place-items-center rounded-md bg-gold-gradient text-primary-foreground shadow-gold">
                  <s.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-display text-lg">{s.label}</p>
                  <p className="text-sm text-muted-foreground">{s.desc}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {!isAdmin ? (
        <Card className="mt-6 border-dashed border-primary/40 bg-card/40">
          <CardContent className="flex flex-wrap items-center justify-between gap-3 p-6">
            <div>
              <p className="font-display text-sm text-primary">Bootstrap</p>
              <p className="text-sm text-muted-foreground">
                Ainda não existe um administrador. Se você é o(a) dono(a) do projeto, torne-se admin agora — este botão só funciona uma única vez.
              </p>
            </div>
            <Button onClick={() => bootstrapMut.mutate()} disabled={bootstrapMut.isPending}>
              {bootstrapMut.isPending ? "Concedendo…" : "Tornar-me admin"}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="mt-6">
          <Badge className="bg-primary/20 text-primary" variant="outline">
            <ShieldCheck className="mr-1 h-3 w-3" /> Você é administrador
          </Badge>
          <p className="mt-2 text-xs text-muted-foreground">
            <Sparkles className="mr-1 inline h-3 w-3" /> Recompensas, loja e guildas retornam nos próximos ciclos.
          </p>
        </div>
      )}
    </div>
  );
}

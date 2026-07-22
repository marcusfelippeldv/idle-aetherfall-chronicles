import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Coins, Gem, ShieldCheck, Sparkles, Swords } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  claimBootstrapAdmin,
  getMyProfile,
  getMyRoles,
} from "@/lib/admin.functions";
import { getMyCharacter } from "@/lib/character.functions";

export const Route = createFileRoute("/_authenticated/jogo/")({
  head: () => ({
    meta: [
      { title: "Painel — Aetherfall Online" },
      { name: "description", content: "Painel do jogador Aetherfall Online." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: GameDashboard,
});

function GameDashboard() {
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
  const character = characterQ.data?.character;

  if (characterQ.isSuccess && character) {
    return <Navigate to="/jogo/arena" replace />;
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 md:px-6 md:py-14">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-display text-sm uppercase tracking-[0.3em] text-primary">
            Painel do jogador
          </p>
          <h1 className="mt-1 font-display text-4xl">
            Olá, {profileQ.data?.profile?.display_name ?? "herói"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Crie seu herói para começar a explorar Aetherfall.
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

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard icon={<Coins className="h-5 w-5" />} label="Ouro" value={profileQ.data?.wallet.gold_balance ?? 0} />
        <StatCard icon={<Gem className="h-5 w-5" />} label="Cristais" value={profileQ.data?.wallet.premium_balance ?? 0} />
        <StatCard icon={<Sparkles className="h-5 w-5" />} label="Herói" value={0} hint="Nenhum criado" />
      </div>

      <Card className="mt-8 border-primary/40 bg-gradient-to-br from-card via-card to-primary/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-display text-2xl">
            <Swords className="h-6 w-6 text-primary" />
            Comece sua jornada
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Escolha uma classe, dê um nome ao seu herói e envie-o em expedições
            para ganhar XP, ouro e equipamentos raros.
          </p>
          <Button asChild size="lg">
            <Link to="/criar-heroi">Criar herói</Link>
          </Button>
        </CardContent>
      </Card>

      {!isAdmin ? (
        <Card className="mt-6 border-dashed border-primary/40 bg-card/40">
          <CardContent className="flex flex-wrap items-center justify-between gap-3 p-6">
            <div>
              <p className="font-display text-sm text-primary">Bootstrap</p>
              <p className="text-sm text-muted-foreground">
                Ainda não existe um administrador. Se você é o(a) dono(a) do
                projeto, torne-se admin agora — este botão só funciona uma
                única vez.
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
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, hint }: { icon: React.ReactNode; label: string; value: number; hint?: string }) {
  return (
    <Card className="border-border/60 bg-card/60">
      <CardContent className="flex items-center gap-4 p-6">
        <div className="grid h-11 w-11 place-items-center rounded-md bg-gold-gradient text-primary-foreground shadow-gold">
          {icon}
        </div>
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
          <p className="font-display text-2xl">{value.toLocaleString("pt-BR")}</p>
          {hint ? <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{hint}</p> : null}
        </div>
      </CardContent>
    </Card>
  );
}
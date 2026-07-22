import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Users, Sparkles, Coins, BadgeCheck, Timer, ArrowRight } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getAdminMetrics } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/_admin/admin")({
  head: () => ({
    meta: [
      { title: "Administração — Aetherfall Online" },
      { name: "description", content: "Painel administrativo." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminDashboard,
});

function AdminDashboard() {
  const fn = useServerFn(getAdminMetrics);
  const q = useQuery({ queryKey: ["admin", "metrics"], queryFn: () => fn() });
  const m = q.data;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 md:px-6 md:py-14">
      <header className="mb-8">
        <p className="font-display text-sm uppercase tracking-[0.3em] text-primary">Administração</p>
        <h1 className="mt-1 font-display text-4xl">Painel geral</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Métricas do serviço em tempo real. Toda ação sensível é registrada em auditoria.
        </p>
      </header>

      {q.isLoading ? (
        <div className="grid gap-3 md:grid-cols-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-lg border border-border/60 bg-muted/40" />
          ))}
        </div>
      ) : q.error ? (
        <p className="text-sm text-destructive">
          {q.error instanceof Error ? q.error.message : "Erro ao carregar."}
        </p>
      ) : m ? (
        <>
          <div className="grid gap-3 md:grid-cols-4">
            <Metric icon={<Users className="h-5 w-5" />} label="Contas totais" value={m.accountsTotal} />
            <Metric icon={<Sparkles className="h-5 w-5" />} label="Novas (7d)" value={m.accountsLast7d} />
            <Metric icon={<BadgeCheck className="h-5 w-5" />} label="Heróis ativos" value={m.charactersActive} />
            <Metric icon={<Timer className="h-5 w-5" />} label="Incursões" value={m.incursionsTotal} />
            <Metric icon={<Coins className="h-5 w-5" />} label="Ouro em circulação" value={m.totalGold} />
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild variant="outline">
              <Link to="/admin/auditoria">
                <BadgeCheck className="mr-2 h-4 w-4" /> Auditoria <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </>
      ) : null}
    </div>
  );
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <Card className="border-border/60 bg-card/60">
      <CardContent className="flex items-center gap-3 p-4">
        <div className="grid h-10 w-10 place-items-center rounded-md bg-secondary text-secondary-foreground">
          {icon}
        </div>
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
          <p className="font-display text-xl">{value.toLocaleString("pt-BR")}</p>
        </div>
      </CardContent>
    </Card>
  );
}

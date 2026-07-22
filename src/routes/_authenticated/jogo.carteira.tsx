import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, ArrowUpRight, ArrowDownRight, Coins, Gem } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getMyTransactions, getMyOrders } from "@/lib/store.functions";
import { getMyProfile } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/jogo/carteira")({
  head: () => ({
    meta: [
      { title: "Carteira — Aetherfall Online" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CarteiraPage,
});

const SOURCE_LABEL: Record<string, string> = {
  expedition_reward: "Expedição",
  boss_reward: "Chefe derrotado",
  sell_item: "Item vendido",
  shop_purchase: "Compra na loja",
  purchase: "Compra com dinheiro real",
};

const ORDER_STATUS_LABEL: Record<string, string> = {
  pending: "Aguardando pagamento",
  paid: "Pago",
  delivered: "Entregue",
  refunded: "Reembolsado",
  cancelled: "Cancelado",
};

function CarteiraPage() {
  const profileFn = useServerFn(getMyProfile);
  const txFn = useServerFn(getMyTransactions);
  const ordersFn = useServerFn(getMyOrders);

  const profileQ = useQuery({ queryKey: ["me", "profile"], queryFn: () => profileFn() });
  const txQ = useQuery({ queryKey: ["me", "transactions"], queryFn: () => txFn({ data: {} }) });
  const ordersQ = useQuery({ queryKey: ["me", "orders"], queryFn: () => ordersFn() });

  const wallet = profileQ.data?.wallet;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 md:px-6 md:py-14">
      <div className="mb-6">
        <Button asChild variant="ghost" size="sm">
          <Link to="/jogo/arena">
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar à arena
          </Link>
        </Button>
      </div>

      <header className="mb-8">
        <p className="font-display text-sm uppercase tracking-[0.3em] text-primary">Carteira</p>
        <h1 className="mt-1 font-display text-4xl">Seu tesouro</h1>
      </header>

      <div className="mb-8 grid gap-4 md:grid-cols-2">
        <BalanceCard icon={<Coins className="h-5 w-5" />} label="Ouro" value={Number(wallet?.gold_balance ?? 0)} tone="amber" />
        <BalanceCard icon={<Gem className="h-5 w-5" />} label="Cristais" value={Number(wallet?.premium_balance ?? 0)} tone="violet" />
      </div>

      <Tabs defaultValue="tx">
        <TabsList>
          <TabsTrigger value="tx">Extrato</TabsTrigger>
          <TabsTrigger value="orders">Compras</TabsTrigger>
        </TabsList>

        <TabsContent value="tx" className="mt-6">
          <Card className="border-border/60 bg-card/60">
            <CardHeader><CardTitle className="font-display text-lg">Últimas 100 movimentações</CardTitle></CardHeader>
            <CardContent>
              {txQ.isLoading ? <Skeleton className="h-40 w-full" /> :
                (txQ.data?.transactions ?? []).length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhuma movimentação ainda.</p>
                ) : (
                  <ul className="divide-y divide-border/40">
                    {txQ.data!.transactions.map((t: any) => {
                      const isCredit = t.transaction_kind === "credit";
                      const isGold = t.currency_type === "gold";
                      return (
                        <li key={t.id} className="flex items-center justify-between gap-3 py-3">
                          <div className="flex items-center gap-3">
                            <div className={`grid h-9 w-9 place-items-center rounded-md ${isCredit ? "bg-emerald-500/15 text-emerald-300" : "bg-rose-500/15 text-rose-300"}`}>
                              {isCredit ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                            </div>
                            <div>
                              <p className="text-sm">{t.description ?? SOURCE_LABEL[t.source_type] ?? t.source_type}</p>
                              <p className="text-xs text-muted-foreground">{new Date(t.created_at).toLocaleString("pt-BR")}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`font-display ${isCredit ? "text-emerald-300" : "text-rose-300"}`}>
                              {isCredit ? "+" : "−"}{Number(t.amount).toLocaleString("pt-BR")}
                              {isGold ? <Coins className="ml-1 inline h-3 w-3" /> : <Gem className="ml-1 inline h-3 w-3" />}
                            </p>
                            <p className="text-xs text-muted-foreground">Saldo: {Number(t.balance_after).toLocaleString("pt-BR")}</p>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders" className="mt-6">
          <Card className="border-border/60 bg-card/60">
            <CardHeader><CardTitle className="font-display text-lg">Compras com dinheiro real</CardTitle></CardHeader>
            <CardContent>
              {ordersQ.isLoading ? <Skeleton className="h-40 w-full" /> :
                (ordersQ.data?.orders ?? []).length === 0 ? (
                  <p className="text-sm text-muted-foreground">Você ainda não fez nenhuma compra.</p>
                ) : (
                  <ul className="divide-y divide-border/40">
                    {ordersQ.data!.orders.map((o: any) => (
                      <li key={o.id} className="flex items-center justify-between gap-3 py-3">
                        <div>
                          <p className="text-sm">{o.products?.name ?? "Pedido"}</p>
                          <p className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleString("pt-BR")}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-display">R$ {(o.amount_cents / 100).toFixed(2).replace(".", ",")}</p>
                          <Badge variant="outline" className="text-[10px]">{ORDER_STATUS_LABEL[o.status] ?? o.status}</Badge>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function BalanceCard({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: number; tone: "amber" | "violet" }) {
  const toneClass = tone === "amber" ? "text-amber-400" : "text-violet-400";
  return (
    <Card className="border-border/60 bg-card/60">
      <CardContent className="flex items-center gap-4 p-6">
        <div className={`grid h-11 w-11 place-items-center rounded-md bg-background/40 ${toneClass}`}>{icon}</div>
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
          <p className="font-display text-3xl">{value.toLocaleString("pt-BR")}</p>
        </div>
      </CardContent>
    </Card>
  );
}

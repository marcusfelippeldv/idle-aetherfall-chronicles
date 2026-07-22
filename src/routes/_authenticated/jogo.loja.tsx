import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Coins, Gem, Package, ArrowLeft } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { listStoreCatalog, purchaseWithCurrency } from "@/lib/store.functions";
import { getMyProfile } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/jogo/loja")({
  head: () => ({
    meta: [
      { title: "Loja — Aetherfall Online" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: LojaPage,
});

const RARITY_COLORS: Record<string, string> = {
  common: "text-slate-300 border-slate-500/40",
  uncommon: "text-emerald-300 border-emerald-500/40",
  rare: "text-sky-300 border-sky-500/40",
  epic: "text-violet-300 border-violet-500/40",
  legendary: "text-amber-300 border-amber-500/40",
};

function LojaPage() {
  const qc = useQueryClient();
  const catalogFn = useServerFn(listStoreCatalog);
  const profileFn = useServerFn(getMyProfile);
  const purchaseFn = useServerFn(purchaseWithCurrency);

  const catalogQ = useQuery({ queryKey: ["store", "catalog"], queryFn: () => catalogFn() });
  const profileQ = useQuery({ queryKey: ["me", "profile"], queryFn: () => profileFn() });

  const purchaseMut = useMutation({
    mutationFn: (productId: string) => purchaseFn({ data: { productId } }),
    onSuccess: (r) => {
      toast.success(`Comprado: ${r.productName}`);
      qc.invalidateQueries({ queryKey: ["me", "profile"] });
      qc.invalidateQueries({ queryKey: ["me", "inventory"] });
      qc.invalidateQueries({ queryKey: ["me", "transactions"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : String(e)),
  });

  const wallet = profileQ.data?.wallet;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 md:px-6 md:py-14">
      <div className="mb-6 flex items-center justify-between">
        <Button asChild variant="ghost" size="sm">
          <Link to="/jogo/arena">
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar à arena
          </Link>
        </Button>
        <div className="flex gap-4 text-sm">
          <span className="inline-flex items-center gap-1">
            <Coins className="h-4 w-4 text-amber-400" />
            <span className="font-display">{Number(wallet?.gold_balance ?? 0).toLocaleString("pt-BR")}</span>
          </span>
          <span className="inline-flex items-center gap-1">
            <Gem className="h-4 w-4 text-violet-400" />
            <span className="font-display">{Number(wallet?.premium_balance ?? 0).toLocaleString("pt-BR")}</span>
          </span>
        </div>
      </div>

      <header className="mb-8">
        <p className="font-display text-sm uppercase tracking-[0.3em] text-primary">Loja</p>
        <h1 className="mt-1 font-display text-4xl">Comércio de Aetherfall</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Cristais para acelerar sua jornada, itens raros no bazar arcano e consumíveis no mercado de ouro.
        </p>
      </header>

      <Tabs defaultValue="cristais">
        <TabsList className="grid w-full grid-cols-3 max-w-lg">
          <TabsTrigger value="cristais"><Gem className="mr-2 h-4 w-4" /> Cristais</TabsTrigger>
          <TabsTrigger value="bazar"><Package className="mr-2 h-4 w-4" /> Bazar Arcano</TabsTrigger>
          <TabsTrigger value="mercado"><Coins className="mr-2 h-4 w-4" /> Mercado</TabsTrigger>
        </TabsList>

        <TabsContent value="cristais" className="mt-6">
          {catalogQ.isLoading ? <Skeleton className="h-64 w-full" /> : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {(catalogQ.data?.crystals ?? []).map((p: any) => (
                <Card key={p.id} className="border-primary/30 bg-gradient-to-br from-card via-card to-primary/10">
                  <CardHeader>
                    <CardTitle className="font-display text-lg">{p.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Gem className="h-5 w-5 text-violet-400" />
                      <span className="font-display text-2xl">{Number(p.premium_amount).toLocaleString("pt-BR")}</span>
                    </div>
                    {p.description && <p className="text-xs text-muted-foreground">{p.description}</p>}
                    <p className="font-display text-lg">R$ {(p.price_cents / 100).toFixed(2).replace(".", ",")}</p>
                    <Button className="w-full" disabled title="Pagamentos serão habilitados em breve">
                      Em breve
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="bazar" className="mt-6">
          <ShopGrid
            items={catalogQ.data?.bazar ?? []}
            loading={catalogQ.isLoading}
            currency="crystals"
            wallet={wallet}
            onBuy={(id) => purchaseMut.mutate(id)}
            busy={purchaseMut.isPending}
          />
        </TabsContent>

        <TabsContent value="mercado" className="mt-6">
          <ShopGrid
            items={catalogQ.data?.mercado ?? []}
            loading={catalogQ.isLoading}
            currency="gold"
            wallet={wallet}
            onBuy={(id) => purchaseMut.mutate(id)}
            busy={purchaseMut.isPending}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ShopGrid({ items, loading, currency, wallet, onBuy, busy }: {
  items: any[];
  loading: boolean;
  currency: "gold" | "crystals";
  wallet: any;
  onBuy: (id: string) => void;
  busy: boolean;
}) {
  if (loading) return <Skeleton className="h-64 w-full" />;
  if (items.length === 0) {
    return (
      <Card className="border-dashed border-border/60 bg-card/40">
        <CardContent className="p-10 text-center text-sm text-muted-foreground">
          Nenhum item disponível no momento.
        </CardContent>
      </Card>
    );
  }
  const balance = currency === "gold" ? Number(wallet?.gold_balance ?? 0) : Number(wallet?.premium_balance ?? 0);
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {items.map((p) => {
        const price = currency === "gold" ? Number((p.metadata as any)?.gold_price ?? 0) : Number(p.premium_amount);
        const canAfford = balance >= price;
        const it = p.item;
        return (
          <Card key={p.id} className="border-border/60 bg-card/60">
            <CardHeader>
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="font-display text-lg">{it?.name ?? p.name}</CardTitle>
                {it && (
                  <Badge variant="outline" className={cn("text-[10px]", RARITY_COLORS[it.rarity] ?? "")}>
                    {it.rarity}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {(it?.description || p.description) && (
                <p className="text-xs text-muted-foreground">{it?.description ?? p.description}</p>
              )}
              {it && (
                <div className="flex flex-wrap gap-1 text-[11px]">
                  {it.attack_bonus > 0 && <span className="text-emerald-300">+{it.attack_bonus} ATK</span>}
                  {it.defense_bonus > 0 && <span className="text-emerald-300">+{it.defense_bonus} DEF</span>}
                  {it.hp_bonus > 0 && <span className="text-emerald-300">+{it.hp_bonus} HP</span>}
                  {it.speed_bonus > 0 && <span className="text-emerald-300">+{it.speed_bonus} VEL</span>}
                </div>
              )}
              <div className="flex items-center justify-between pt-2">
                <span className="inline-flex items-center gap-1 font-display text-lg">
                  {currency === "gold"
                    ? <Coins className="h-4 w-4 text-amber-400" />
                    : <Gem className="h-4 w-4 text-violet-400" />}
                  {price.toLocaleString("pt-BR")}
                </span>
                <Button size="sm" disabled={!canAfford || busy} onClick={() => onBuy(p.id)}>
                  {!canAfford ? "Sem saldo" : "Comprar"}
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

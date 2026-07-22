import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import {
  Search,
  ShieldOff,
  ShieldCheck,
  Ban,
  UserPlus,
  Coins,
  Gift,
  Timer,
  Crown,
} from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { JustificationDialog } from "@/components/admin/JustificationDialog";
import { listClasses } from "@/lib/catalog.functions";
import {
  listPlayers,
  setAccountStatus,
  adminCreateCharacter,
  adminAdjustWallet,
  adminGrantItem,
  adminListItems,
  adminSetRole,
  adminResetCooldowns,
  getPlayerFullView,
} from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/_admin/admin/jogadores")({
  head: () => ({
    meta: [
      { title: "Jogadores — Administração — Aetherfall" },
      { name: "description", content: "Gestão de contas de jogadores." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PlayersPage,
});

type Player = Awaited<ReturnType<typeof listPlayers>>[number];

function PlayersPage() {
  const [search, setSearch] = useState("");
  const [applied, setApplied] = useState("");
  const listFn = useServerFn(listPlayers);
  const q = useQuery({
    queryKey: ["admin", "players", applied],
    queryFn: () => listFn({ data: { search: applied || undefined } }),
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 md:px-6 md:py-14">
      <header className="mb-6">
        <p className="font-display text-sm uppercase tracking-[0.3em] text-primary">
          Administração
        </p>
        <h1 className="mt-1 font-display text-4xl">Jogadores</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Busque por e-mail ou nome. Todas as ações são registradas em auditoria.
        </p>
      </header>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          setApplied(search.trim());
        }}
        className="mb-6 flex gap-2"
      >
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="e-mail, nome de jogador…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button type="submit">Buscar</Button>
      </form>

      <Card className="border-border/60 bg-card/60">
        <CardContent className="p-0">
          {q.isLoading ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              Carregando…
            </div>
          ) : q.data && q.data.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              Nenhum jogador encontrado.
            </div>
          ) : (
            <ul className="divide-y divide-border/60">
              {(q.data ?? []).map((p) => (
                <PlayerRow key={p.id} player={p} />
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function PlayerRow({ player }: { player: Player }) {
  const qc = useQueryClient();
  const setStatusFn = useServerFn(setAccountStatus);
  const viewFn = useServerFn(getPlayerFullView);

  const view = useQuery({
    queryKey: ["admin", "player-view", player.id],
    queryFn: () => viewFn({ data: { user_id: player.id } }),
  });

  const statusMut = useMutation({
    mutationFn: (input: {
      status: "active" | "suspended" | "banned";
      justification: string;
    }) =>
      setStatusFn({
        data: {
          target_user_id: player.id,
          status: input.status,
          justification: input.justification,
        },
      }),
    onSuccess: () => {
      toast.success("Status atualizado.");
      qc.invalidateQueries({ queryKey: ["admin", "players"] });
      qc.invalidateQueries({ queryKey: ["admin", "player-view", player.id] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : String(e)),
  });

  const statusVariant =
    player.account_status === "active"
      ? "outline"
      : player.account_status === "suspended"
        ? "secondary"
        : "destructive";

  const activeChar = view.data?.characters.find((c) => c.is_active);
  const wallet = view.data?.wallet;
  const isAdmin = view.data?.roles.includes("admin") ?? false;

  return (
    <li className="flex flex-wrap items-center gap-4 px-6 py-4">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium">{player.username}</span>
          <Badge variant={statusVariant}>{player.account_status}</Badge>
          {isAdmin ? (
            <Badge className="border-primary/40 bg-primary/10 text-primary" variant="outline">
              <Crown className="mr-1 h-3 w-3" /> admin
            </Badge>
          ) : null}
        </div>
        <div className="truncate text-xs text-muted-foreground">
          {player.email} · criada em{" "}
          {new Date(player.created_at).toLocaleDateString("pt-BR")}
        </div>
        <div className="mt-1 flex flex-wrap gap-3 text-xs text-muted-foreground">
          {activeChar ? (
            <span>
              Herói: <strong className="text-foreground">{activeChar.name}</strong> · Lv {activeChar.level} · ⚔ {activeChar.power}
            </span>
          ) : (
            <span className="italic">Sem herói ativo</span>
          )}
          {wallet ? (
            <span>
              💰 {Number(wallet.gold_balance).toLocaleString("pt-BR")} · 💎{" "}
              {Number(wallet.premium_balance).toLocaleString("pt-BR")}
            </span>
          ) : null}
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {!activeChar ? (
          <CreateHeroAction userId={player.id} />
        ) : null}
        <AdjustWalletAction userId={player.id} />
        {activeChar ? <GrantItemAction userId={player.id} /> : null}
        <ResetCooldownsAction userId={player.id} />
        <RoleAction userId={player.id} currentIsAdmin={isAdmin} />
        {player.account_status === "active" ? (
          <>
            <JustificationDialog
              trigger={
                <Button variant="outline" size="sm">
                  <ShieldOff className="mr-1 h-4 w-4" /> Suspender
                </Button>
              }
              title="Suspender conta"
              onConfirm={(j) =>
                statusMut.mutateAsync({ status: "suspended", justification: j })
              }
              pending={statusMut.isPending}
            />
            <JustificationDialog
              trigger={
                <Button variant="destructive" size="sm">
                  <Ban className="mr-1 h-4 w-4" /> Banir
                </Button>
              }
              title="Banir conta"
              destructive
              onConfirm={(j) =>
                statusMut.mutateAsync({ status: "banned", justification: j })
              }
              pending={statusMut.isPending}
            />
          </>
        ) : (
          <JustificationDialog
            trigger={
              <Button size="sm">
                <ShieldCheck className="mr-1 h-4 w-4" /> Reativar
              </Button>
            }
            title="Reativar conta"
            onConfirm={(j) =>
              statusMut.mutateAsync({ status: "active", justification: j })
            }
            pending={statusMut.isPending}
          />
        )}
      </div>
    </li>
  );
}

function CreateHeroAction({ userId }: { userId: string }) {
  const qc = useQueryClient();
  const createFn = useServerFn(adminCreateCharacter);
  const classesFn = useServerFn(listClasses);
  const [name, setName] = useState("");
  const [classId, setClassId] = useState<string>("");
  const classesQ = useQuery({
    queryKey: ["catalog", "classes"],
    queryFn: () => classesFn(),
  });

  const mut = useMutation({
    mutationFn: (j: string) =>
      createFn({
        data: {
          target_user_id: userId,
          name: name.trim(),
          class_id: classId,
          justification: j,
        },
      }),
    onSuccess: () => {
      toast.success("Herói criado.");
      setName("");
      setClassId("");
      qc.invalidateQueries({ queryKey: ["admin", "player-view", userId] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : String(e)),
  });

  return (
    <JustificationDialog
      trigger={
        <Button size="sm">
          <UserPlus className="mr-1 h-4 w-4" /> Criar herói
        </Button>
      }
      title="Criar herói para este jogador"
      description="Cria um herói ativo em nome do jogador. Use quando o fluxo público de criação falhar."
      onConfirm={(j) => {
        if (!name.trim() || !classId) {
          toast.error("Preencha nome e classe.");
          return;
        }
        return mut.mutateAsync(j);
      }}
      pending={mut.isPending}
      confirmLabel="Criar herói"
    >
      <div className="space-y-2">
        <Label>Nome (3–20)</Label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={20}
          placeholder="Ex.: Kaelen"
        />
      </div>
      <div className="space-y-2">
        <Label>Classe</Label>
        <Select value={classId} onValueChange={setClassId}>
          <SelectTrigger>
            <SelectValue placeholder="Escolha uma classe" />
          </SelectTrigger>
          <SelectContent>
            {(classesQ.data ?? []).map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </JustificationDialog>
  );
}

function AdjustWalletAction({ userId }: { userId: string }) {
  const qc = useQueryClient();
  const fn = useServerFn(adminAdjustWallet);
  const [gold, setGold] = useState(0);
  const [premium, setPremium] = useState(0);

  const mut = useMutation({
    mutationFn: (j: string) =>
      fn({
        data: {
          target_user_id: userId,
          gold_delta: Math.trunc(gold),
          premium_delta: Math.trunc(premium),
          justification: j,
        },
      }),
    onSuccess: () => {
      toast.success("Carteira ajustada.");
      setGold(0);
      setPremium(0);
      qc.invalidateQueries({ queryKey: ["admin", "player-view", userId] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : String(e)),
  });

  return (
    <JustificationDialog
      trigger={
        <Button variant="outline" size="sm">
          <Coins className="mr-1 h-4 w-4" /> Carteira
        </Button>
      }
      title="Ajustar carteira"
      description="Valores positivos creditam, negativos debitam. Registro em transações."
      onConfirm={(j) => {
        if (gold === 0 && premium === 0) {
          toast.error("Informe um valor.");
          return;
        }
        return mut.mutateAsync(j);
      }}
      pending={mut.isPending}
      confirmLabel="Aplicar"
    >
      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Ouro (Δ)</Label>
          <Input
            type="number"
            value={gold}
            onChange={(e) => setGold(Number(e.target.value))}
          />
        </div>
        <div className="space-y-2">
          <Label>Cristais (Δ)</Label>
          <Input
            type="number"
            value={premium}
            onChange={(e) => setPremium(Number(e.target.value))}
          />
        </div>
      </div>
    </JustificationDialog>
  );
}

function GrantItemAction({ userId }: { userId: string }) {
  const qc = useQueryClient();
  const fn = useServerFn(adminGrantItem);
  const itemsFn = useServerFn(adminListItems);
  const itemsQ = useQuery({
    queryKey: ["admin", "items"],
    queryFn: () => itemsFn(),
  });
  const [itemId, setItemId] = useState("");
  const [qty, setQty] = useState(1);

  const mut = useMutation({
    mutationFn: (j: string) =>
      fn({
        data: {
          target_user_id: userId,
          item_id: itemId,
          quantity: Math.max(1, Math.trunc(qty)),
          justification: j,
        },
      }),
    onSuccess: () => {
      toast.success("Item entregue.");
      setItemId("");
      setQty(1);
      qc.invalidateQueries({ queryKey: ["admin", "player-view", userId] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : String(e)),
  });

  return (
    <JustificationDialog
      trigger={
        <Button variant="outline" size="sm">
          <Gift className="mr-1 h-4 w-4" /> Item
        </Button>
      }
      title="Conceder item"
      onConfirm={(j) => {
        if (!itemId) {
          toast.error("Selecione o item.");
          return;
        }
        return mut.mutateAsync(j);
      }}
      pending={mut.isPending}
      confirmLabel="Entregar"
    >
      <div className="space-y-2">
        <Label>Item</Label>
        <Select value={itemId} onValueChange={setItemId}>
          <SelectTrigger>
            <SelectValue placeholder="Escolha um item" />
          </SelectTrigger>
          <SelectContent className="max-h-72">
            {(itemsQ.data ?? []).map((i) => (
              <SelectItem key={i.id} value={i.id}>
                {i.name} · {i.rarity} · Lv {i.required_level}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Quantidade</Label>
        <Input
          type="number"
          min={1}
          max={999}
          value={qty}
          onChange={(e) => setQty(Number(e.target.value))}
        />
      </div>
    </JustificationDialog>
  );
}

function ResetCooldownsAction({ userId }: { userId: string }) {
  const qc = useQueryClient();
  const fn = useServerFn(adminResetCooldowns);
  const mut = useMutation({
    mutationFn: (j: string) =>
      fn({ data: { target_user_id: userId, justification: j } }),
    onSuccess: () => {
      toast.success("Cooldowns zerados.");
      qc.invalidateQueries({ queryKey: ["admin", "player-view", userId] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : String(e)),
  });

  return (
    <JustificationDialog
      trigger={
        <Button variant="outline" size="sm">
          <Timer className="mr-1 h-4 w-4" /> Cooldowns
        </Button>
      }
      title="Zerar cooldowns e expedições"
      description="Cancela expedições ativas e limpa o último combate."
      onConfirm={(j) => mut.mutateAsync(j)}
      pending={mut.isPending}
    />
  );
}

function RoleAction({
  userId,
  currentIsAdmin,
}: {
  userId: string;
  currentIsAdmin: boolean;
}) {
  const qc = useQueryClient();
  const fn = useServerFn(adminSetRole);
  const mut = useMutation({
    mutationFn: (j: string) =>
      fn({
        data: {
          target_user_id: userId,
          role: "admin",
          grant: !currentIsAdmin,
          justification: j,
        },
      }),
    onSuccess: () => {
      toast.success(currentIsAdmin ? "Admin removido." : "Promovido a admin.");
      qc.invalidateQueries({ queryKey: ["admin", "player-view", userId] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : String(e)),
  });

  return (
    <JustificationDialog
      trigger={
        <Button variant="outline" size="sm">
          <Crown className="mr-1 h-4 w-4" />
          {currentIsAdmin ? "Rebaixar" : "Promover"}
        </Button>
      }
      title={currentIsAdmin ? "Remover papel de admin" : "Promover a admin"}
      onConfirm={(j) => mut.mutateAsync(j)}
      pending={mut.isPending}
      destructive={currentIsAdmin}
    />
  );
}

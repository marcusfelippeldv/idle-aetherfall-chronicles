import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { Search, ShieldOff, ShieldCheck, Ban } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { listPlayers, setAccountStatus } from "@/lib/admin.functions";

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
          Busque por e-mail, nome de jogador ou nome de exibição.
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
  const setFn = useServerFn(setAccountStatus);
  const [justification, setJustification] = useState("");
  const [open, setOpen] = useState<null | "suspend" | "reactivate" | "ban">(
    null,
  );

  const mut = useMutation({
    mutationFn: (status: "active" | "suspended" | "banned") =>
      setFn({
        data: {
          target_user_id: player.id,
          status,
          justification,
        },
      }),
    onSuccess: () => {
      toast.success("Status atualizado.");
      setOpen(null);
      setJustification("");
      qc.invalidateQueries({ queryKey: ["admin", "players"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : String(e)),
  });

  const statusVariant =
    player.account_status === "active"
      ? "outline"
      : player.account_status === "suspended"
        ? "secondary"
        : "destructive";

  return (
    <li className="flex flex-wrap items-center gap-4 px-6 py-4">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium">{player.username}</span>
          <Badge variant={statusVariant}>{player.account_status}</Badge>
        </div>
        <div className="truncate text-xs text-muted-foreground">
          {player.email} · criada em{" "}
          {new Date(player.created_at).toLocaleDateString("pt-BR")}
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {player.account_status === "active" ? (
          <>
            <ActionDialog
              open={open === "suspend"}
              onOpenChange={(v) => setOpen(v ? "suspend" : null)}
              trigger={
                <Button variant="outline" size="sm">
                  <ShieldOff className="mr-1 h-4 w-4" /> Suspender
                </Button>
              }
              title="Suspender conta"
              value={justification}
              onChange={setJustification}
              onConfirm={() => mut.mutate("suspended")}
              pending={mut.isPending}
            />
            <ActionDialog
              open={open === "ban"}
              onOpenChange={(v) => setOpen(v ? "ban" : null)}
              trigger={
                <Button variant="destructive" size="sm">
                  <Ban className="mr-1 h-4 w-4" /> Banir
                </Button>
              }
              title="Banir conta"
              value={justification}
              onChange={setJustification}
              onConfirm={() => mut.mutate("banned")}
              pending={mut.isPending}
            />
          </>
        ) : (
          <ActionDialog
            open={open === "reactivate"}
            onOpenChange={(v) => setOpen(v ? "reactivate" : null)}
            trigger={
              <Button size="sm">
                <ShieldCheck className="mr-1 h-4 w-4" /> Reativar
              </Button>
            }
            title="Reativar conta"
            value={justification}
            onChange={setJustification}
            onConfirm={() => mut.mutate("active")}
            pending={mut.isPending}
          />
        )}
      </div>
    </li>
  );
}

function ActionDialog({
  open,
  onOpenChange,
  trigger,
  title,
  value,
  onChange,
  onConfirm,
  pending,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  trigger: React.ReactNode;
  title: string;
  value: string;
  onChange: (s: string) => void;
  onConfirm: () => void;
  pending: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          <label className="text-sm font-medium">
            Justificativa (obrigatória)
          </label>
          <Textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Explique brevemente o motivo desta ação. Será registrado nos logs administrativos."
            minLength={5}
            maxLength={500}
            rows={4}
          />
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancelar</Button>
          </DialogClose>
          <Button
            onClick={onConfirm}
            disabled={pending || value.trim().length < 5}
          >
            {pending ? "Salvando…" : "Confirmar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

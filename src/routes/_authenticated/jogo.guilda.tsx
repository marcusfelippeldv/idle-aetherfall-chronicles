import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { ArrowLeft, Crown, LogOut, Shield, Sparkles, Users } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  createGuild,
  getMyGuild,
  joinGuild,
  kickMember,
  leaveGuild,
  listGuilds,
  promoteMember,
} from "@/lib/guild.functions";

export const Route = createFileRoute("/_authenticated/jogo/guilda")({
  head: () => ({
    meta: [
      { title: "Guilda — Aetherfall Online" },
      {
        name: "description",
        content: "Funde, gerencie e explore o mundo ao lado de uma guilda em Aetherfall Online.",
      },
      { property: "og:title", content: "Guilda — Aetherfall Online" },
      {
        property: "og:description",
        content: "Reúna heróis, some poder e combata raids ao lado de sua guilda.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: GuildaPage,
});

function GuildaPage() {
  const myFn = useServerFn(getMyGuild);
  const myQ = useQuery({ queryKey: ["me", "guild"], queryFn: () => myFn() });

  if (myQ.isLoading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10 md:px-6 md:py-14 space-y-4">
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 md:px-6 md:py-14">
      <Button variant="ghost" size="sm" asChild className="mb-4">
        <Link to="/jogo/arena">
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar à Arena
        </Link>
      </Button>

      {myQ.data?.guild ? (
        <GuildDashboard data={myQ.data} />
      ) : (
        <BrowseGuilds />
      )}
    </div>
  );
}

function GuildDashboard({ data }: { data: any }) {
  const qc = useQueryClient();
  const leaveFn = useServerFn(leaveGuild);
  const kickFn = useServerFn(kickMember);
  const promoteFn = useServerFn(promoteMember);

  const leaveMut = useMutation({
    mutationFn: () => leaveFn(),
    onSuccess: (r) => {
      toast.success(r.dissolved ? "Guilda dissolvida." : "Você saiu da guilda.");
      qc.invalidateQueries({ queryKey: ["me", "guild"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : String(e)),
  });
  const kickMut = useMutation({
    mutationFn: (memberId: string) => kickFn({ data: { memberId } }),
    onSuccess: () => {
      toast.success("Membro removido.");
      qc.invalidateQueries({ queryKey: ["me", "guild"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : String(e)),
  });
  const promoteMut = useMutation({
    mutationFn: (v: { memberId: string; role: "officer" | "member" }) => promoteFn({ data: v }),
    onSuccess: () => {
      toast.success("Cargo atualizado.");
      qc.invalidateQueries({ queryKey: ["me", "guild"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : String(e)),
  });

  const g = data.guild;
  const isLeader = data.role === "leader";
  const canManage = data.role === "leader" || data.role === "officer";

  return (
    <div className="space-y-6">
      <Card className="border-primary/30 bg-gradient-to-br from-card via-card to-primary/5">
        <CardContent className="grid gap-4 p-6 md:grid-cols-[1fr_auto]">
          <div>
            <div className="flex items-center gap-2 text-xs font-display uppercase tracking-[0.3em] text-primary">
              <Shield className="h-3 w-3" /> [{g.tag}]
            </div>
            <h1 className="mt-1 font-display text-4xl">{g.name}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{g.description || "Sem descrição."}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge variant="outline"><Users className="mr-1 h-3 w-3" /> {g.member_count} membros</Badge>
              <Badge variant="outline"><Sparkles className="mr-1 h-3 w-3" /> {Number(g.total_power).toLocaleString("pt-BR")} de poder</Badge>
            </div>
          </div>
          <div className="grid content-start gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (confirm(isLeader ? "Isso irá DISSOLVER a guilda. Continuar?" : "Sair da guilda?"))
                  leaveMut.mutate();
              }}
              disabled={leaveMut.isPending}
            >
              <LogOut className="mr-2 h-4 w-4" /> {isLeader ? "Dissolver" : "Sair"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/60 bg-card/60">
        <CardHeader>
          <CardTitle className="font-display text-lg">Membros</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ul className="divide-y divide-border/60">
            {data.members.map((m: any) => {
              const c = m.characters;
              return (
                <li key={m.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 font-medium">
                      {m.role === "leader" && <Crown className="h-3 w-3 text-amber-400" />}
                      {c?.name ?? "—"}
                      <Badge variant="outline" className="text-[10px]">
                        {m.role === "leader" ? "Líder" : m.role === "officer" ? "Oficial" : "Membro"}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {c?.classes?.name ?? "—"} · Nv. {c?.level ?? "?"} · Poder {Number(c?.power ?? 0).toLocaleString("pt-BR")}
                    </div>
                  </div>
                  {canManage && m.role !== "leader" && (
                    <div className="flex gap-1">
                      {isLeader && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            promoteMut.mutate({
                              memberId: m.id,
                              role: m.role === "officer" ? "member" : "officer",
                            })
                          }
                        >
                          {m.role === "officer" ? "Rebaixar" : "Promover"}
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          if (confirm(`Remover ${c?.name ?? "membro"}?`)) kickMut.mutate(m.id);
                        }}
                      >
                        Expulsar
                      </Button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </CardContent>
      </Card>

      <div className="text-center">
        <Button asChild>
          <Link to="/jogo/chat">Abrir chat da guilda</Link>
        </Button>
      </div>
    </div>
  );
}

function BrowseGuilds() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const listFn = useServerFn(listGuilds);
  const joinFn = useServerFn(joinGuild);
  const createFn = useServerFn(createGuild);
  const listQ = useQuery({ queryKey: ["guilds", "list"], queryFn: () => listFn() });

  const [name, setName] = useState("");
  const [tag, setTag] = useState("");
  const [desc, setDesc] = useState("");
  const [open, setOpen] = useState(false);

  const joinMut = useMutation({
    mutationFn: (guildId: string) => joinFn({ data: { guildId } }),
    onSuccess: () => {
      toast.success("Bem-vindo à guilda!");
      qc.invalidateQueries({ queryKey: ["me", "guild"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : String(e)),
  });
  const createMut = useMutation({
    mutationFn: () => createFn({ data: { name, tag, description: desc } }),
    onSuccess: () => {
      toast.success("Guilda fundada!");
      setOpen(false);
      qc.invalidateQueries({ queryKey: ["me", "guild"] });
      qc.invalidateQueries({ queryKey: ["me", "profile"] });
      navigate({ to: "/jogo/guilda" });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : String(e)),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl md:text-4xl">Guildas de Aetheril</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Junte-se a uma guilda existente ou funde a sua (custo: 50 cristais).
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Shield className="mr-2 h-4 w-4" /> Fundar guilda</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-display">Fundar uma nova guilda</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground">Nome (3–32)</label>
                <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={32} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Tag (2–5, A–Z 0–9)</label>
                <Input value={tag} onChange={(e) => setTag(e.target.value)} maxLength={5} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Descrição (até 400)</label>
                <Textarea value={desc} onChange={(e) => setDesc(e.target.value)} maxLength={400} rows={4} />
              </div>
              <Button
                className="w-full"
                onClick={() => createMut.mutate()}
                disabled={createMut.isPending || name.length < 3 || tag.length < 2}
              >
                {createMut.isPending ? "Fundando…" : "Fundar (−50 cristais)"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {listQ.isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : listQ.data && listQ.data.length > 0 ? (
        <div className="grid gap-3 md:grid-cols-2">
          {listQ.data.map((g: any) => (
            <Card key={g.id} className="border-border/60 bg-card/60">
              <CardContent className="space-y-3 p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-xs font-display uppercase tracking-[0.3em] text-primary">[{g.tag}]</div>
                    <h3 className="font-display text-lg">{g.name}</h3>
                  </div>
                  <Badge variant="outline">{g.member_count} membros</Badge>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">{g.description || "Sem descrição."}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    Poder {Number(g.total_power).toLocaleString("pt-BR")}
                  </span>
                  <Button size="sm" onClick={() => joinMut.mutate(g.id)} disabled={joinMut.isPending}>
                    Entrar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-dashed border-border/60 bg-card/40">
          <CardContent className="p-10 text-center text-sm text-muted-foreground">
            Nenhuma guilda fundada ainda. Seja o primeiro líder de Aetheril.
          </CardContent>
        </Card>
      )}
    </div>
  );
}

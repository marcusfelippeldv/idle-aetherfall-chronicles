import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Users, Send, Skull, Flame, MessageSquare } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { listGuilds, myGuild, createGuild, joinGuild, leaveGuild, listChat, postChat, listWorldBosses, hitWorldBoss } from "@/lib/social.functions";

export const Route = createFileRoute("/_authenticated/jogo/social")({
  head: () => ({
    meta: [
      { title: "Social — Aetherfall Online" },
      { name: "description", content: "Guildas, chat global e chefes mundiais." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SocialPage,
});

function SocialPage() {
  return (
    <div className="mx-auto grid max-w-6xl gap-4 px-4 py-6 lg:grid-cols-2">
      <GuildaPanel />
      <ChatPanel />
      <WorldBossPanel />
    </div>
  );
}

function GuildaPanel() {
  const qc = useQueryClient();
  const myFn = useServerFn(myGuild);
  const listFn = useServerFn(listGuilds);
  const createFn = useServerFn(createGuild);
  const joinFn = useServerFn(joinGuild);
  const leaveFn = useServerFn(leaveGuild);

  const mineQ = useQuery({ queryKey: ["my-guild"], queryFn: () => myFn() });
  const listQ = useQuery({ queryKey: ["guilds"], queryFn: () => listFn() });

  const [name, setName] = useState("");
  const [tag, setTag] = useState("");
  const [desc, setDesc] = useState("");

  const inv = () => { qc.invalidateQueries({ queryKey: ["my-guild"] }); qc.invalidateQueries({ queryKey: ["guilds"] }); };
  const createMut = useMutation({ mutationFn: () => createFn({ data: { name, tag, description: desc } }), onSuccess: () => { toast.success("Guilda fundada"); setName(""); setTag(""); setDesc(""); inv(); }, onError: (e: Error) => toast.error(e.message) });
  const joinMut = useMutation({ mutationFn: (id: string) => joinFn({ data: { guildId: id } }), onSuccess: () => { toast.success("Você entrou na guilda"); inv(); }, onError: (e: Error) => toast.error(e.message) });
  const leaveMut = useMutation({ mutationFn: () => leaveFn(), onSuccess: () => { toast.success("Você saiu da guilda"); inv(); }, onError: (e: Error) => toast.error(e.message) });

  return (
    <Card className="border border-border/60 bg-card/60">
      <CardContent className="space-y-3 p-4">
        <h2 className="flex items-center gap-2 text-lg font-semibold"><Users className="h-5 w-5 text-primary" /> Guilda</h2>
        {mineQ.data?.guild ? (
          <div className="space-y-2">
            <p className="text-sm"><span className="font-semibold">[{mineQ.data.guild.tag}]</span> {mineQ.data.guild.name}</p>
            <p className="text-xs text-muted-foreground">{mineQ.data.guild.description}</p>
            <p className="text-xs">Membros: {mineQ.data.guild.member_count}</p>
            <ul className="max-h-40 space-y-1 overflow-y-auto text-xs">
              {mineQ.data.members.map((m) => (
                <li key={m.user_id} className="flex justify-between">
                  <span>{m.profiles?.display_name ?? m.profiles?.username ?? "—"}</span>
                  <span className="text-muted-foreground">{m.role}</span>
                </li>
              ))}
            </ul>
            <Button size="sm" variant="outline" onClick={() => leaveMut.mutate()} disabled={leaveMut.isPending}>Sair da guilda</Button>
          </div>
        ) : (
          <>
            <div className="rounded border border-border/60 bg-background/40 p-3 space-y-2">
              <p className="text-sm font-medium">Fundar guilda</p>
              <Input placeholder="Nome" value={name} onChange={(e) => setName(e.target.value)} maxLength={30} />
              <Input placeholder="Tag (2–5 letras)" value={tag} onChange={(e) => setTag(e.target.value.toUpperCase())} maxLength={5} />
              <Textarea placeholder="Descrição" value={desc} onChange={(e) => setDesc(e.target.value)} rows={2} maxLength={280} />
              <Button size="sm" onClick={() => createMut.mutate()} disabled={createMut.isPending || name.length < 3 || tag.length < 2}>Fundar</Button>
            </div>
            <div>
              <p className="mb-1 text-sm font-medium">Guildas ativas</p>
              <ul className="max-h-56 space-y-1 overflow-y-auto text-xs">
                {(listQ.data ?? []).map((g) => (
                  <li key={g.id} className="flex items-center justify-between rounded border border-border/60 bg-background/40 px-2 py-1.5">
                    <span><span className="font-semibold">[{g.tag}]</span> {g.name} <span className="text-muted-foreground">· {g.member_count} membros</span></span>
                    <Button size="sm" variant="ghost" onClick={() => joinMut.mutate(g.id)} disabled={joinMut.isPending}>Entrar</Button>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function ChatPanel() {
  const qc = useQueryClient();
  const listFn = useServerFn(listChat);
  const postFn = useServerFn(postChat);
  const chatQ = useQuery({ queryKey: ["chat", "global"], queryFn: () => listFn({ data: { channel: "global" } }), refetchInterval: 8000 });
  const [body, setBody] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chatQ.data]);

  const postMut = useMutation({
    mutationFn: () => postFn({ data: { channel: "global", body } }),
    onSuccess: () => { setBody(""); qc.invalidateQueries({ queryKey: ["chat", "global"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Card className="border border-border/60 bg-card/60">
      <CardContent className="flex h-[420px] flex-col gap-2 p-4">
        <h2 className="flex items-center gap-2 text-lg font-semibold"><MessageSquare className="h-5 w-5 text-primary" /> Chat global</h2>
        <div className="flex-1 overflow-y-auto rounded border border-border/60 bg-background/40 p-2 text-xs">
          {(chatQ.data ?? []).map((m) => (
            <div key={m.id} className="mb-1">
              <span className="font-semibold text-primary">{m.username}: </span>
              <span>{m.body}</span>
            </div>
          ))}
          <div ref={endRef} />
        </div>
        <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); if (body.trim()) postMut.mutate(); }}>
          <Input value={body} onChange={(e) => setBody(e.target.value)} placeholder="Diga algo…" maxLength={280} />
          <Button type="submit" size="sm" disabled={postMut.isPending || !body.trim()}><Send className="h-4 w-4" /></Button>
        </form>
      </CardContent>
    </Card>
  );
}

function WorldBossPanel() {
  const qc = useQueryClient();
  const listFn = useServerFn(listWorldBosses);
  const hitFn = useServerFn(hitWorldBoss);
  const bossesQ = useQuery({ queryKey: ["world-bosses"], queryFn: () => listFn(), refetchInterval: 10000 });

  const hitMut = useMutation({
    mutationFn: (slug: string) => hitFn({ data: { slug } }),
    onSuccess: (r) => {
      toast[r.killed ? "success" : "message"](r.killed ? `Chefe derrotado! Você causou ${r.damage} de dano.` : `Você atingiu por ${r.damage}. HP restante: ${r.remaining}.`);
      qc.invalidateQueries({ queryKey: ["world-bosses"] });
      qc.invalidateQueries({ queryKey: ["wallet"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Card className="border border-border/60 bg-card/60 lg:col-span-2">
      <CardContent className="space-y-3 p-4">
        <h2 className="flex items-center gap-2 text-lg font-semibold"><Skull className="h-5 w-5 text-primary" /> Chefes mundiais</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {(bossesQ.data?.bosses ?? []).map((b) => {
            const pct = (b.current_hp / b.max_hp) * 100;
            return (
              <div key={b.slug} className="rounded border border-border/60 bg-background/40 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-semibold">{b.name}</p>
                  <span className="text-[10px] uppercase text-muted-foreground">{b.element}</span>
                </div>
                <p className="mb-2 text-xs text-muted-foreground">{b.description}</p>
                <Progress value={pct} className="h-2" />
                <p className="mt-1 text-[11px] text-muted-foreground">{b.current_hp.toLocaleString()} / {b.max_hp.toLocaleString()} HP</p>
                <Button size="sm" className="mt-2 w-full" onClick={() => hitMut.mutate(b.slug)} disabled={hitMut.isPending || b.current_hp === 0}>
                  <Flame className="mr-1 h-3.5 w-3.5" /> Atacar
                </Button>
              </div>
            );
          })}
        </div>
        <div>
          <p className="mb-1 text-sm font-medium">Últimos golpes</p>
          <ul className="max-h-40 space-y-1 overflow-y-auto text-xs">
            {(bossesQ.data?.hits ?? []).map((h, i) => (
              <li key={i} className="flex justify-between">
                <span>{h.username} → {h.boss_slug}</span>
                <span className="text-amber-300">{h.damage}</span>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { ArrowLeft, MessageCircle, Send } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { listMessages, sendMessage } from "@/lib/chat.functions";
import { getMyGuild } from "@/lib/guild.functions";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/jogo/chat")({
  head: () => ({
    meta: [
      { title: "Chat — Aetherfall Online" },
      {
        name: "description",
        content: "Converse com heróis do reino ou com sua guilda em tempo real.",
      },
      { property: "og:title", content: "Chat — Aetherfall Online" },
      {
        property: "og:description",
        content: "Comunicação em tempo real entre aventureiros de Aetherfall Online.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ChatPage,
});

function ChatPage() {
  const myGuildFn = useServerFn(getMyGuild);
  const guildQ = useQuery({ queryKey: ["me", "guild"], queryFn: () => myGuildFn() });
  const guildId = guildQ.data?.guild?.id ?? null;
  const [channel, setChannel] = useState<string>("global");
  const activeChannel = channel === "guild" && guildId ? `guild:${guildId}` : "global";

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 md:px-6 md:py-14">
      <Button variant="ghost" size="sm" asChild className="mb-4">
        <Link to="/jogo/arena"><ArrowLeft className="mr-2 h-4 w-4" /> Voltar à Arena</Link>
      </Button>
      <div className="flex items-center gap-3 mb-4">
        <MessageCircle className="h-6 w-6 text-primary" />
        <h1 className="font-display text-3xl">Chat</h1>
      </div>

      <Tabs value={channel} onValueChange={setChannel} className="mb-4">
        <TabsList>
          <TabsTrigger value="global">Global</TabsTrigger>
          <TabsTrigger value="guild" disabled={!guildId}>
            Guilda {guildId ? "" : "(entre em uma)"}
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <ChatChannel channel={activeChannel} />
    </div>
  );
}

function ChatChannel({ channel }: { channel: string }) {
  const qc = useQueryClient();
  const listFn = useServerFn(listMessages);
  const sendFn = useServerFn(sendMessage);
  const q = useQuery({
    queryKey: ["chat", channel],
    queryFn: () => listFn({ data: { channel } }),
    refetchInterval: 15000,
  });
  const messages = useMemo(() => q.data ?? [], [q.data]);
  const [content, setContent] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  useEffect(() => {
    const ch = supabase
      .channel(`chat-${channel}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages", filter: `channel_key=eq.${channel}` },
        () => {
          qc.invalidateQueries({ queryKey: ["chat", channel] });
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [channel, qc]);

  const sendMut = useMutation({
    mutationFn: () => sendFn({ data: { channel, content } }),
    onSuccess: () => {
      setContent("");
      qc.invalidateQueries({ queryKey: ["chat", channel] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : String(e)),
  });

  return (
    <Card className="border-border/60 bg-card/60">
      <CardContent className="p-0">
        <div className="max-h-[60vh] min-h-[400px] overflow-y-auto p-4 space-y-2">
          {q.isLoading ? (
            <Skeleton className="h-40 w-full" />
          ) : messages.length === 0 ? (
            <p className="py-16 text-center text-sm text-muted-foreground">
              Nenhuma mensagem ainda. Seja o primeiro a falar.
            </p>
          ) : (
            messages.map((m: any) => (
              <div key={m.id} className="flex gap-2 text-sm">
                <span className="font-display text-primary">{m.character_name}</span>
                <span className="text-muted-foreground">·</span>
                <span className="flex-1 break-words">{m.content}</span>
                <span className="text-[10px] text-muted-foreground shrink-0">
                  {new Date(m.created_at).toLocaleTimeString("pt-BR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>
        <form
          className="flex gap-2 border-t border-border/60 p-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (content.trim()) sendMut.mutate();
          }}
        >
          <Input
            value={content}
            onChange={(e) => setContent(e.target.value)}
            maxLength={500}
            placeholder="Escreva uma mensagem…"
          />
          <Button type="submit" size="sm" disabled={sendMut.isPending || !content.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
        <div className="px-3 pb-2 text-right text-[10px] text-muted-foreground">{content.length}/500</div>
      </CardContent>
    </Card>
  );
}

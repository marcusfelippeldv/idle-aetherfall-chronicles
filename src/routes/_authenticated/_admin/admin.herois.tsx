import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { Search, Pencil, Trash2 } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { JustificationDialog } from "@/components/admin/JustificationDialog";
import {
  adminListCharacters,
  adminUpdateCharacter,
  adminDeleteCharacter,
} from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/_admin/admin/herois")({
  head: () => ({
    meta: [
      { title: "Heróis — Administração — Aetherfall" },
      { name: "description", content: "Gestão global de heróis." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: HeroesPage,
});

type Row = Awaited<ReturnType<typeof adminListCharacters>>[number];

function HeroesPage() {
  const [search, setSearch] = useState("");
  const [applied, setApplied] = useState("");
  const fn = useServerFn(adminListCharacters);
  const q = useQuery({
    queryKey: ["admin", "characters", applied],
    queryFn: () => fn({ data: { search: applied || undefined } }),
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 md:px-6 md:py-14">
      <header className="mb-6">
        <p className="font-display text-sm uppercase tracking-[0.3em] text-primary">
          Administração
        </p>
        <h1 className="mt-1 font-display text-4xl">Heróis</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Ajuste atributos, desative ou remova heróis. Toda ação vai para
          auditoria.
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
            placeholder="nome do herói…"
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
              Nenhum herói encontrado.
            </div>
          ) : (
            <ul className="divide-y divide-border/60">
              {(q.data ?? []).map((c) => (
                <HeroRow key={c.id} row={c} />
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function HeroRow({ row }: { row: Row }) {
  const qc = useQueryClient();
  const updFn = useServerFn(adminUpdateCharacter);
  const delFn = useServerFn(adminDeleteCharacter);

  const [level, setLevel] = useState<number>(row.level);
  const [xp, setXp] = useState<number>(Number(row.current_xp));
  const [maxHp, setMaxHp] = useState<number>(row.max_hp);
  const [atk, setAtk] = useState<number>(row.attack);
  const [def, setDef] = useState<number>(row.defense);
  const [spd, setSpd] = useState<number>(row.speed);

  const updMut = useMutation({
    mutationFn: (j: string) =>
      updFn({
        data: {
          character_id: row.id,
          justification: j,
          patch: {
            level,
            current_xp: xp,
            max_hp: maxHp,
            current_hp: Math.min(row.current_hp, maxHp),
            attack: atk,
            defense: def,
            speed: spd,
          },
        },
      }),
    onSuccess: () => {
      toast.success("Herói atualizado.");
      qc.invalidateQueries({ queryKey: ["admin", "characters"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : String(e)),
  });

  const delMut = useMutation({
    mutationFn: (j: string) =>
      delFn({ data: { character_id: row.id, justification: j } }),
    onSuccess: () => {
      toast.success("Herói removido.");
      qc.invalidateQueries({ queryKey: ["admin", "characters"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : String(e)),
  });

  const p: any = row.profiles;
  const cls: any = row.classes;
  const owner = Array.isArray(p) ? p[0] : p;
  const className = Array.isArray(cls) ? cls[0]?.name : cls?.name;

  return (
    <li className="flex flex-wrap items-center gap-4 px-6 py-4">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium">{row.name}</span>
          <Badge variant="outline">Lv {row.level}</Badge>
          <Badge variant="secondary">{className ?? "—"}</Badge>
          {!row.is_active ? (
            <Badge variant="destructive">inativo</Badge>
          ) : null}
        </div>
        <div className="truncate text-xs text-muted-foreground">
          Dono: {owner?.username ?? "—"} ({owner?.email ?? "—"}) · ⚔ {row.power} · HP {row.current_hp}/{row.max_hp}
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <JustificationDialog
          trigger={
            <Button variant="outline" size="sm">
              <Pencil className="mr-1 h-4 w-4" /> Editar
            </Button>
          }
          title={`Editar ${row.name}`}
          onConfirm={(j) => updMut.mutateAsync(j)}
          pending={updMut.isPending}
        >
          <div className="grid gap-3 md:grid-cols-3">
            <Field label="Nível" value={level} onChange={setLevel} />
            <Field label="XP" value={xp} onChange={setXp} />
            <Field label="HP máx." value={maxHp} onChange={setMaxHp} />
            <Field label="Ataque" value={atk} onChange={setAtk} />
            <Field label="Defesa" value={def} onChange={setDef} />
            <Field label="Velocidade" value={spd} onChange={setSpd} />
          </div>
        </JustificationDialog>
        <JustificationDialog
          trigger={
            <Button variant="destructive" size="sm">
              <Trash2 className="mr-1 h-4 w-4" /> Remover
            </Button>
          }
          title={`Remover ${row.name}?`}
          description="Cancela expedições ativas e apaga o herói. Não recupera."
          destructive
          confirmLabel="Remover"
          onConfirm={(j) => delMut.mutateAsync(j)}
          pending={delMut.isPending}
        />
      </div>
    </li>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      <Input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}

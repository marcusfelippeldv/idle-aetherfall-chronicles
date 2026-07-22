import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { adminListAudit } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/_admin/admin/auditoria")({
  head: () => ({
    meta: [
      { title: "Auditoria — Administração — Aetherfall" },
      { name: "description", content: "Log de ações administrativas." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuditPage,
});

function AuditPage() {
  const fn = useServerFn(adminListAudit);
  const q = useQuery({
    queryKey: ["admin", "audit"],
    queryFn: () => fn({ data: { limit: 200 } }),
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 md:px-6 md:py-14">
      <header className="mb-6">
        <p className="font-display text-sm uppercase tracking-[0.3em] text-primary">
          Administração
        </p>
        <h1 className="mt-1 font-display text-4xl">Auditoria</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Últimas 200 ações administrativas registradas.
        </p>
      </header>

      <Card className="border-border/60 bg-card/60">
        <CardContent className="p-0">
          {q.isLoading ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              Carregando…
            </div>
          ) : q.data && q.data.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              Nenhum registro.
            </div>
          ) : (
            <ul className="divide-y divide-border/60">
              {(q.data ?? []).map((r) => {
                const admin: any = (r as any).profiles;
                const adminInfo = Array.isArray(admin) ? admin[0] : admin;
                return (
                  <li key={r.id} className="px-6 py-4 text-sm">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline">{r.action}</Badge>
                      <span className="text-muted-foreground">
                        em {r.target_type}
                      </span>
                      <span className="ml-auto text-xs text-muted-foreground">
                        {new Date(r.created_at).toLocaleString("pt-BR")}
                      </span>
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      por{" "}
                      <strong className="text-foreground">
                        {adminInfo?.username ?? r.admin_user_id.slice(0, 8)}
                      </strong>
                      {adminInfo?.email ? ` (${adminInfo.email})` : ""} · alvo{" "}
                      <code className="text-[10px]">{(r.target_id ?? "").slice(0, 8)}</code>
                    </div>
                    <p className="mt-2 text-sm">{r.justification}</p>
                    {(r.previous_data || r.new_data) && (
                      <details className="mt-2 text-xs text-muted-foreground">
                        <summary className="cursor-pointer">Payload</summary>
                        <pre className="mt-1 overflow-x-auto rounded bg-background/60 p-2">
                          {JSON.stringify(
                            { previous: r.previous_data, new: r.new_data },
                            null,
                            2,
                          )}
                        </pre>
                      </details>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

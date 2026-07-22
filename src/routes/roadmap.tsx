import { createFileRoute } from "@tanstack/react-router";
import { Check, Circle } from "lucide-react";

export const Route = createFileRoute("/roadmap")({
  head: () => ({
    meta: [
      { title: "Roadmap — Aetherfall Online" },
      {
        name: "description",
        content:
          "Nossa jornada de desenvolvimento em 5 etapas: fundação, jogo funcional, economia, retenção e social.",
      },
      { property: "og:title", content: "Roadmap — Aetherfall Online" },
      {
        property: "og:description",
        content:
          "Como estamos construindo o Aetherfall passo a passo, com foco no ciclo divertido primeiro.",
      },
    ],
  }),
  component: RoadmapPage,
});

const STAGES = [
  {
    n: 1,
    title: "Fundação",
    status: "current" as const,
    body: "Landing pública, cadastro, login, recuperação de senha, banco de dados com regras de segurança e painel administrativo básico.",
  },
  {
    n: 2,
    title: "Jogo funcional",
    status: "next" as const,
    body: "Criação de personagem, escolha de classe, expedições Idle, combate automático, inventário e equipamentos.",
  },
  {
    n: 3,
    title: "Economia",
    status: "planned" as const,
    body: "Loja de cosméticos, cristais, registro de transações, pedidos e integração de pagamentos (Pix, cartão).",
  },
  {
    n: 4,
    title: "Retenção",
    status: "planned" as const,
    body: "Missões diárias, conquistas, ranking, eventos sazonais e passe de temporada.",
  },
  {
    n: 5,
    title: "Social",
    status: "planned" as const,
    body: "Guildas, chat, party assíncrona e raids cooperativas contra chefes compartilhados.",
  },
];

export default function RoadmapPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 md:px-6 md:py-24">
      <div className="text-center">
        <p className="font-display text-sm uppercase tracking-[0.3em] text-primary">
          Roadmap
        </p>
        <h1 className="mt-3 font-display text-4xl md:text-5xl text-balance">
          Um jogo construído com paciência
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-muted-foreground text-balance">
          Preferimos entregar um ciclo básico divertido antes de adicionar
          complexidade. PvP em tempo real, por exemplo, fica para depois de
          termos certeza que a progressão é boa.
        </p>
      </div>

      <ol className="mt-12 space-y-4">
        {STAGES.map((s) => (
          <li
            key={s.n}
            className="flex gap-4 rounded-lg border border-border/60 bg-card/60 p-6"
          >
            <div
              className={
                "grid h-10 w-10 shrink-0 place-items-center rounded-md " +
                (s.status === "current"
                  ? "bg-gold-gradient text-primary-foreground shadow-gold"
                  : s.status === "next"
                    ? "bg-secondary text-secondary-foreground"
                    : "bg-muted text-muted-foreground")
              }
            >
              {s.status === "current" ? (
                <Check className="h-5 w-5" />
              ) : (
                <Circle className="h-5 w-5" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display text-lg">
                  Etapa 0{s.n} · {s.title}
                </span>
                <span
                  className={
                    "rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wider " +
                    (s.status === "current"
                      ? "bg-primary/20 text-primary"
                      : s.status === "next"
                        ? "bg-accent/20 text-accent"
                        : "bg-muted text-muted-foreground")
                  }
                >
                  {s.status === "current"
                    ? "Em desenvolvimento"
                    : s.status === "next"
                      ? "A seguir"
                      : "Planejado"}
                </span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{s.body}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

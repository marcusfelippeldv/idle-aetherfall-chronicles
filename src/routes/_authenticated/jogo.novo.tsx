import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/jogo/novo")({
  head: () => ({
    meta: [
      { title: "Criar herói — Aetherfall Online" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => <Navigate to="/criar-heroi" replace />,
});
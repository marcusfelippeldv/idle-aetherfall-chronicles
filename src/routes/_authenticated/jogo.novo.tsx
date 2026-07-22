import { createFileRoute } from "@tanstack/react-router";

import { NewCharacterPage } from "./criar-heroi";

export const Route = createFileRoute("/_authenticated/jogo/novo")({
  head: () => ({
    meta: [
      { title: "Criar herói — Aetherfall Online" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: NewCharacterPage,
});
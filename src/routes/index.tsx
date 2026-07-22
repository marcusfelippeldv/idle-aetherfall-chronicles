import { createFileRoute, Link } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";

import guardiaoImg from "@/assets/classes/guardiao.jpg";
import espadachimImg from "@/assets/classes/espadachim.jpg";
import arqueiroImg from "@/assets/classes/arqueiro.jpg";
import arcanistaImg from "@/assets/classes/arcanista.jpg";
import videnteImg from "@/assets/classes/vidente.jpg";
import punhoImg from "@/assets/classes/punho.jpg";

const CANONICAL = "https://idle.alphoracubo.com/";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Aetherfall Online — RPG idle épico de party e éter" },
      {
        name: "description",
        content:
          "Aetherfall Online é um RPG idle cinematográfico: monte sua party de quatro heróis, configure prioridades de combate, enfrente chefes mundiais e forje itens lendários.",
      },
      { property: "og:title", content: "Aetherfall Online — RPG idle épico" },
      {
        property: "og:description",
        content:
          "Party de quatro heróis, IA por prioridades, incursões regionais e chefes mundiais. Sua jornada continua mesmo offline.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: CANONICAL },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: CANONICAL }],
  }),
  component: LandingPage,
});

const archetypes = [
  { name: "Guardião", tag: "Defesa Inabalável", img: guardiaoImg },
  { name: "Espadachim", tag: "Corte Celestial", img: espadachimImg },
  { name: "Arqueiro Astral", tag: "Precisão Estelar", img: arqueiroImg },
  { name: "Arcanista", tag: "Domínio do Caos", img: arcanistaImg },
  { name: "Vidente", tag: "Luz da Profecia", img: videnteImg },
  { name: "Punho da Aurora", tag: "Impacto Solar", img: punhoImg },
] as const;

const pillars = [
  { n: "01", title: "Party de 4", desc: "Combine quatro heróis complementares e monte a formação perfeita para cada desafio." },
  { n: "02", title: "IA por Prioridades", desc: "Configure regras táticas — seus heróis continuam agindo mesmo com o jogo fechado." },
  { n: "03", title: "Incursões Regionais", desc: "Explore vales, bosques e ruínas em ondas progressivas com chefes de área." },
  { n: "04", title: "Chefes Mundiais", desc: "Enfrente Leviatã, Titã e Fênix junto de toda a comunidade em HP compartilhado." },
  { n: "05", title: "Economia & Raridade", desc: "Itens específicos por classe em 6 níveis de raridade, forjados no éter." },
] as const;

type Phase = { title: string; desc: string; state: "done" | "current" | "next" };
const roadmap: Phase[] = [
  { title: "Fase 1 · Fundação", desc: "Seis arquétipos jogáveis, criação da party e retratos únicos.", state: "done" },
  { title: "Fase 2 · Combate & Prioridades", desc: "Motor de combate por iniciativa, roda elemental e IA idle configurável.", state: "done" },
  { title: "Fase 3 · Economia, Missões e Social", desc: "Loja, inventário com raridade, missões diárias, guildas e chat global.", state: "current" },
  { title: "Fase 4 · Guildas ativas & PvP", desc: "Guerra de guildas, ranking sazonal e arena classificatória.", state: "next" },
];

function LandingPage() {
  return (
    <div
      className="w-full bg-aether-night text-white selection:bg-aether-violet/40"
      style={{ fontFamily: "var(--font-jakarta)" }}
    >
      {/* HERO */}
      <section className="relative flex min-h-[92vh] flex-col items-center justify-center overflow-hidden px-6 py-24">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at 50% 45%, #1B1147 0%, #0B1024 65%)",
          }}
        />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07] mix-blend-screen"
          style={{
            backgroundImage:
              "url('https://www.transparenttextures.com/patterns/carbon-fibre.png')",
          }}
        />
        {/* Halo dourado no fundo */}
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 h-[480px] w-[480px] -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(244,193,90,0.18) 0%, rgba(244,193,90,0) 65%)",
          }}
        />

        <div className="relative z-10 max-w-4xl text-center">
          <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-aether-violet/40 bg-aether-violet/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-aether-gold">
            <Sparkles className="h-3.5 w-3.5" /> Ciclo Eternal Shards
          </div>
          <h1
            className="aether-halo text-6xl font-extrabold uppercase tracking-tight text-aether-gold md:text-8xl"
            style={{ fontFamily: "var(--font-display-syne)" }}
          >
            Aetherfall
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-300 md:text-xl">
            O destino do Éter está em suas mãos. Lidere uma party de quatro heróis
            em um RPG idle cinematográfico de alta fantasia — mesmo enquanto você
            descansa.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              to="/cadastro"
              className="w-full rounded-lg border-b-4 border-aether-violet-lo bg-aether-violet px-10 py-4 text-sm font-bold uppercase tracking-widest text-white shadow-[0_10px_30px_-10px_rgba(106,61,245,0.6)] transition-all hover:-translate-y-0.5 hover:bg-aether-violet-hi active:translate-y-0 sm:w-auto"
            >
              Criar conta
            </Link>
            <Link
              to="/login"
              className="w-full rounded-lg border-2 border-aether-violet px-10 py-4 text-sm font-bold uppercase tracking-widest text-aether-violet transition-all hover:bg-aether-violet/10 sm:w-auto"
            >
              Entrar
            </Link>
          </div>
        </div>
      </section>

      {/* ARQUÉTIPOS */}
      <section className="mx-auto max-w-7xl px-6 py-24">
        <div className="mb-16 text-center">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.32em] text-aether-violet">
            Seis linhagens do Éter
          </p>
          <h2
            className="text-4xl font-bold text-aether-gold md:text-5xl"
            style={{ fontFamily: "var(--font-display-syne)" }}
          >
            Arquétipos jogáveis
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {archetypes.map((a) => (
            <div
              key={a.name}
              className="group relative overflow-hidden rounded-2xl border border-aether-violet/20 bg-aether-violet-deep p-1 transition-all hover:border-aether-violet hover:shadow-[0_20px_60px_-20px_rgba(106,61,245,0.55)]"
            >
              <div className="relative aspect-[3/4] overflow-hidden rounded-xl">
                <img
                  src={a.img}
                  alt={`Retrato de ${a.name}, arquétipo jogável de Aetherfall Online`}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-aether-night via-aether-night/40 to-transparent" />
                <div className="absolute bottom-0 left-0 w-full p-6">
                  <h3
                    className="mb-1 text-2xl font-bold text-white"
                    style={{ fontFamily: "var(--font-display-syne)" }}
                  >
                    {a.name}
                  </h3>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-aether-violet transition-colors group-hover:text-aether-gold">
                    {a.tag}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* PILARES */}
      <section className="border-y border-aether-violet/10 bg-aether-violet-deep/30 py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-16 text-center">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.32em] text-aether-violet">
              O que faz Aetherfall vibrar
            </p>
            <h2
              className="text-4xl font-bold text-aether-gold md:text-5xl"
              style={{ fontFamily: "var(--font-display-syne)" }}
            >
              Pilares do mundo
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3 lg:grid-cols-5">
            {pillars.map((p) => (
              <div
                key={p.n}
                className="group rounded-xl border-t border-aether-violet/30 bg-aether-violet-deep p-8 text-center transition-colors hover:bg-aether-violet/10"
              >
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-aether-violet/20 font-bold text-aether-gold">
                  {p.n}
                </div>
                <h4
                  className="mb-2 font-bold text-white"
                  style={{ fontFamily: "var(--font-display-syne)" }}
                >
                  {p.title}
                </h4>
                <p className="text-sm leading-relaxed text-slate-400">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ROADMAP */}
      <section className="mx-auto max-w-4xl px-6 py-24">
        <div className="mb-16 text-center">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.32em] text-aether-violet">
            Onde estamos
          </p>
          <h2
            className="text-4xl font-bold text-aether-gold md:text-5xl"
            style={{ fontFamily: "var(--font-display-syne)" }}
          >
            Roadmap · Eternal Shards
          </h2>
        </div>
        <ol className="space-y-10">
          {roadmap.map((phase, i) => {
            const isLast = i === roadmap.length - 1;
            const dot =
              phase.state === "done"
                ? "bg-aether-gold shadow-[0_0_12px_#F4C15A]"
                : phase.state === "current"
                  ? "bg-aether-violet shadow-[0_0_14px_#6A3DF5]"
                  : "bg-aether-violet-deep border border-aether-violet";
            const title =
              phase.state === "next" ? "text-slate-500" : phase.state === "current" ? "text-white" : "text-aether-gold";
            const badgeText =
              phase.state === "done" ? "Concluído" : phase.state === "current" ? "Em curso" : "Em breve";
            const badgeCls =
              phase.state === "done"
                ? "bg-aether-gold/15 text-aether-gold"
                : phase.state === "current"
                  ? "bg-aether-violet/25 text-white"
                  : "bg-aether-violet-deep text-slate-500 border border-aether-violet/30";
            return (
              <li key={phase.title} className="flex gap-6">
                <div className="flex flex-col items-center">
                  <span className={`h-4 w-4 rounded-full ${dot}`} />
                  {!isLast && <span className="mt-2 h-full w-px flex-1 bg-aether-violet/30" />}
                </div>
                <div className="pb-4">
                  <div className="mb-2 flex flex-wrap items-center gap-3">
                    <h5 className={`text-lg font-bold ${title}`}>{phase.title}</h5>
                    <span className={`rounded-full px-3 py-0.5 text-[10px] font-bold uppercase tracking-[0.18em] ${badgeCls}`}>
                      {badgeText}
                    </span>
                  </div>
                  <p className="text-slate-400">{phase.desc}</p>
                </div>
              </li>
            );
          })}
        </ol>
      </section>

      {/* CTA FINAL */}
      <section className="relative overflow-hidden border-t border-aether-violet/10 px-6 py-24 text-center">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at 50% 50%, rgba(106,61,245,0.18) 0%, rgba(11,16,36,0) 70%)",
          }}
        />
        <div className="relative z-10 mx-auto max-w-2xl">
          <h2
            className="text-4xl font-bold text-white md:text-5xl"
            style={{ fontFamily: "var(--font-display-syne)" }}
          >
            Sua party aguarda.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-slate-300">
            Escolha suas linhagens, defina as prioridades e deixe o Éter fazer o
            resto. Aetherfall joga com você — e por você.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              to="/cadastro"
              className="rounded-lg border-b-4 border-aether-violet-lo bg-aether-violet px-10 py-4 text-sm font-bold uppercase tracking-widest text-white shadow-[0_10px_30px_-10px_rgba(106,61,245,0.6)] transition-all hover:-translate-y-0.5 hover:bg-aether-violet-hi"
            >
              Criar conta grátis
            </Link>
            <Link
              to="/login"
              className="text-sm font-bold uppercase tracking-widest text-aether-gold hover:text-white"
            >
              Já tenho conta →
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-aether-violet/10 py-10 text-center">
        <p className="text-xs italic text-slate-500">
          Aetherfall Online © {new Date().getFullYear()} — Todos os direitos reservados.
        </p>
      </footer>
    </div>
  );
}

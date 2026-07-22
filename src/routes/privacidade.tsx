import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/privacidade")({
  head: () => ({
    meta: [
      { title: "Privacidade — Aetherfall Online" },
      {
        name: "description",
        content:
          "Como o Aetherfall Online coleta, usa e protege seus dados pessoais.",
      },
      { property: "og:title", content: "Privacidade — Aetherfall Online" },
      {
        property: "og:description",
        content: "Política de privacidade do Aetherfall Online.",
      },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-16 md:px-6 md:py-24">
      <h1 className="font-display text-4xl">Política de privacidade</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Última atualização: {new Date().toLocaleDateString("pt-BR")}
      </p>

      <Sec title="Dados coletados">
        <p>
          Coletamos e-mail, nome de jogador, atividade dentro do jogo
          (personagens, expedições, inventário, transações) e dados técnicos
          mínimos para operação (endereço IP, tipo de dispositivo).
        </p>
      </Sec>
      <Sec title="Uso dos dados">
        <p>
          Usamos seus dados para autenticar, operar o jogo, prevenir fraude e
          nos comunicar sobre atualizações. Não vendemos seus dados.
        </p>
      </Sec>
      <Sec title="Armazenamento">
        <p>
          Seus dados ficam armazenados em provedores em nuvem com criptografia
          em trânsito e em repouso. Aplicamos regras de acesso rígidas por
          usuário.
        </p>
      </Sec>
      <Sec title="Seus direitos">
        <p>
          Você pode solicitar acesso, correção ou exclusão dos seus dados a
          qualquer momento, escrevendo para{" "}
          <a
            href="mailto:privacidade@aetherfall.example"
            className="text-primary underline"
          >
            privacidade@aetherfall.example
          </a>
          .
        </p>
      </Sec>
      <Sec title="Cookies">
        <p>
          Usamos apenas cookies estritamente necessários para manter você
          conectado. Não usamos rastreadores de terceiros para publicidade.
        </p>
      </Sec>
    </article>
  );
}

function Sec({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="font-display text-2xl">{title}</h2>
      <div className="mt-2 text-muted-foreground">{children}</div>
    </section>
  );
}

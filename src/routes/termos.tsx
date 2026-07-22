import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/termos")({
  head: () => ({
    meta: [
      { title: "Termos de uso — Aetherfall Online" },
      {
        name: "description",
        content:
          "Termos de uso do serviço Aetherfall Online. Regras, condutas e responsabilidades.",
      },
      { property: "og:title", content: "Termos de uso — Aetherfall Online" },
      {
        property: "og:description",
        content: "Regras de uso do Aetherfall Online.",
      },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <article className="prose-invert mx-auto max-w-3xl px-4 py-16 md:px-6 md:py-24">
      <h1 className="font-display text-4xl">Termos de uso</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Última atualização: {new Date().toLocaleDateString("pt-BR")}
      </p>

      <Section title="1. Aceitação">
        <p>
          Ao criar uma conta ou usar o Aetherfall Online, você concorda com
          estes termos. Se não concordar, não utilize o serviço.
        </p>
      </Section>
      <Section title="2. Conta">
        <p>
          Você é responsável pela segurança das suas credenciais e por toda
          atividade realizada na sua conta. Use uma senha forte e não
          compartilhe seu acesso.
        </p>
      </Section>
      <Section title="3. Conduta">
        <p>
          É proibido usar cheats, bots, exploits, engenharia reversa ou
          qualquer forma de fraude. Contas envolvidas em comportamento
          suspeito podem ser suspensas ou banidas.
        </p>
      </Section>
      <Section title="4. Compras e moeda premium">
        <p>
          Cristais e itens comprados não têm valor monetário fora do jogo e
          não são reembolsáveis, exceto quando exigido por lei. Todas as
          movimentações ficam registradas na sua conta.
        </p>
      </Section>
      <Section title="5. Limitação de responsabilidade">
        <p>
          O serviço é fornecido "como está". Nos esforçamos para manter tudo
          online, mas não garantimos disponibilidade contínua.
        </p>
      </Section>
      <Section title="6. Contato">
        <p>
          Dúvidas sobre estes termos:{" "}
          <a
            className="text-primary underline"
            href="mailto:suporte@aetherfall.example"
          >
            suporte@aetherfall.example
          </a>
          .
        </p>
      </Section>
    </article>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-8">
      <h2 className="font-display text-2xl">{title}</h2>
      <div className="mt-2 text-muted-foreground">{children}</div>
    </section>
  );
}

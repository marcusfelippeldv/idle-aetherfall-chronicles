import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AuthShell } from "@/components/auth-shell";
import { CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/confirmar-email")({
  head: () => ({
    meta: [
      { title: "Confirmar e-mail — Aetherfall Online" },
      {
        name: "description",
        content: "Sua conta Aetherfall Online foi confirmada.",
      },
      { property: "og:title", content: "Confirmar e-mail — Aetherfall Online" },
      {
        property: "og:description",
        content: "E-mail confirmado com sucesso.",
      },
    ],
  }),
  component: ConfirmPage,
});

function ConfirmPage() {
  const [confirmed, setConfirmed] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Supabase parses the hash tokens automatically and sets session.
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setConfirmed(true);
    });
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") setConfirmed(true);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  return (
    <AuthShell
      title={confirmed ? "E-mail confirmado" : "Confirmando seu e-mail"}
      subtitle={
        confirmed
          ? "Sua conta está pronta. Bem-vindo a Aetherfall."
          : "Se abrir o link algumas vezes, pode acontecer de o navegador armazenar um estado antigo — se demorar, volte ao login."
      }
    >
      <Card className="border-border/60 bg-card/80 shadow-elegant backdrop-blur">
        <CardContent className="space-y-4 p-6 text-center">
          {confirmed ? (
            <>
              <CheckCircle2 className="mx-auto h-12 w-12 text-primary" />
              <Button
                className="w-full shadow-gold"
                onClick={() => navigate({ to: "/jogo", replace: true })}
              >
                Entrar no jogo
              </Button>
            </>
          ) : (
            <Button asChild variant="outline" className="w-full">
              <Link to="/login">Ir para o login</Link>
            </Button>
          )}
        </CardContent>
      </Card>
    </AuthShell>
  );
}

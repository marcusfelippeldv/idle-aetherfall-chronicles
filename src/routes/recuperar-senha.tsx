import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { AuthShell } from "@/components/auth-shell";

const schema = z.object({ email: z.string().trim().email().max(254) });

export const Route = createFileRoute("/recuperar-senha")({
  head: () => ({
    meta: [
      { title: "Recuperar senha — Aetherfall Online" },
      {
        name: "description",
        content: "Recupere o acesso à sua conta Aetherfall Online.",
      },
      { property: "og:title", content: "Recuperar senha — Aetherfall Online" },
      {
        property: "og:description",
        content: "Enviaremos um link para redefinir sua senha.",
      },
    ],
  }),
  component: ForgotPage,
});

function ForgotPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse({ email });
    if (!parsed.success) {
      toast.error("Informe um e-mail válido.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(
      parsed.data.email,
      { redirectTo: `${window.location.origin}/reset-password` },
    );
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setSent(true);
    toast.success("Se o e-mail existir, um link foi enviado.");
  }

  return (
    <AuthShell
      title="Recuperar senha"
      subtitle="Enviaremos um link para você redefinir sua senha."
    >
      <Card className="border-border/60 bg-card/80 shadow-elegant backdrop-blur">
        <CardContent className="p-6">
          {sent ? (
            <div className="space-y-4 text-center">
              <p className="text-sm text-muted-foreground">
                Se existir uma conta com esse e-mail, você receberá um link
                em instantes.
              </p>
              <Button asChild variant="outline" className="w-full">
                <Link to="/login">Voltar ao login</Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <Button
                type="submit"
                className="w-full shadow-gold"
                disabled={loading}
              >
                {loading ? "Enviando…" : "Enviar link"}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                Lembrou?{" "}
                <Link to="/login" className="text-primary hover:underline">
                  Voltar ao login
                </Link>
              </p>
            </form>
          )}
        </CardContent>
      </Card>
    </AuthShell>
  );
}

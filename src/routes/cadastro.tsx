import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { AuthShell } from "@/components/auth-shell";

const schema = z.object({
  username: z
    .string()
    .trim()
    .min(3, "Mínimo 3 caracteres")
    .max(20, "Máximo 20 caracteres")
    .regex(/^[a-zA-Z0-9_]+$/, "Use apenas letras, números e _"),
  email: z.string().trim().email("E-mail inválido").max(254),
  password: z.string().min(8, "Mínimo 8 caracteres").max(72),
});

export const Route = createFileRoute("/cadastro")({
  head: () => ({
    meta: [
      { title: "Criar conta — Aetherfall Online" },
      {
        name: "description",
        content:
          "Crie sua conta Aetherfall Online e reserve seu nome antes do lançamento.",
      },
      { property: "og:title", content: "Criar conta — Aetherfall Online" },
      {
        property: "og:description",
        content: "Sua jornada começa aqui.",
      },
    ],
  }),
  component: SignupPage,
});

function SignupPage() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const navigate = useNavigate();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse({ username, email, password });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Dados inválidos");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        emailRedirectTo: `${window.location.origin}/confirmar-email`,
        data: { username: parsed.data.username },
      },
    });
    setLoading(false);
    if (error) {
      toast.error(
        error.message.includes("already")
          ? "Este e-mail já está cadastrado."
          : error.message.includes("Password")
            ? "Escolha uma senha mais forte (evite senhas comuns)."
            : error.message,
      );
      return;
    }
    setDone(true);
    toast.success("Conta criada. Verifique seu e-mail para confirmar.");
  }

  if (done) {
    return (
      <AuthShell
        title="Verifique seu e-mail"
        subtitle="Enviamos um link de confirmação para o endereço informado."
      >
        <Card className="border-border/60 bg-card/80 shadow-elegant backdrop-blur">
          <CardContent className="space-y-4 p-6 text-center">
            <p className="text-sm text-muted-foreground">
              Clique no link do e-mail para ativar sua conta e depois entre em{" "}
              <Link to="/login" className="text-primary hover:underline">
                Aetherfall
              </Link>
              .
            </p>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => navigate({ to: "/login" })}
            >
              Ir para o login
            </Button>
          </CardContent>
        </Card>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Criar sua conta"
      subtitle="Reserve seu nome antes do lançamento."
    >
      <Card className="border-border/60 bg-card/80 shadow-elegant backdrop-blur">
        <CardContent className="p-6">
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Nome de jogador</Label>
              <Input
                id="username"
                type="text"
                autoComplete="username"
                required
                minLength={3}
                maxLength={20}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="ex.: caçador_da_lua"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Mínimo 8 caracteres. Evitamos senhas expostas em vazamentos
                conhecidos.
              </p>
            </div>
            <Button
              type="submit"
              className="w-full shadow-gold"
              disabled={loading}
            >
              {loading ? "Criando…" : "Criar conta"}
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              Ao continuar, você concorda com nossos{" "}
              <Link to="/termos" className="text-primary hover:underline">
                termos
              </Link>{" "}
              e{" "}
              <Link
                to="/privacidade"
                className="text-primary hover:underline"
              >
                política de privacidade
              </Link>
              .
            </p>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Já tem conta?{" "}
            <Link to="/login" className="text-primary hover:underline">
              Entrar
            </Link>
          </p>
        </CardContent>
      </Card>
    </AuthShell>
  );
}

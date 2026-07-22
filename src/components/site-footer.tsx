import { Link } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 bg-card/40">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 md:grid-cols-4 md:px-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-md bg-gold-gradient text-primary-foreground">
              <Sparkles className="h-4 w-4" />
            </span>
            <span className="font-display text-lg">Aetherfall</span>
          </div>
          <p className="mt-3 max-w-xs text-sm text-muted-foreground">
            Um RPG Idle original inspirado nos JRPGs clássicos. Universo,
            classes, artes e história próprios.
          </p>
        </div>
        <FooterCol title="Jogo">
          <FooterLink to="/">Início</FooterLink>
          <FooterLink to="/classes">Classes</FooterLink>
          <FooterLink to="/roadmap">Roadmap</FooterLink>
          <FooterLink to="/ranking">Ranking</FooterLink>
        </FooterCol>
        <FooterCol title="Conta">
          <FooterLink to="/login">Entrar</FooterLink>
          <FooterLink to="/cadastro">Criar conta</FooterLink>
          <FooterLink to="/recuperar-senha">Recuperar senha</FooterLink>
        </FooterCol>
        <FooterCol title="Legal">
          <FooterLink to="/termos">Termos de uso</FooterLink>
          <FooterLink to="/privacidade">Privacidade</FooterLink>
          <a
            href="mailto:suporte@aetherfall.example"
            className="text-sm text-muted-foreground transition hover:text-foreground"
          >
            Suporte
          </a>
        </FooterCol>
      </div>
      <div className="border-t border-border/60 py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Aetherfall Online — Todos os direitos
        reservados. Nome e arte provisórios.
      </div>
    </footer>
  );
}

function FooterCol({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="font-display text-sm uppercase tracking-wider text-primary">
        {title}
      </p>
      <div className="mt-3 flex flex-col gap-2">{children}</div>
    </div>
  );
}

function FooterLink({
  to,
  children,
}: {
  to: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      to={to}
      className="text-sm text-muted-foreground transition hover:text-foreground"
    >
      {children}
    </Link>
  );
}

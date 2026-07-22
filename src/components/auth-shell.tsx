import { Sparkles } from "lucide-react";
import { Link } from "@tanstack/react-router";

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative isolate mx-auto flex min-h-[calc(100vh-16rem)] w-full max-w-md flex-col items-center justify-center px-4 py-16 md:py-24">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-40"
        style={{ background: "var(--gradient-arcane)" }}
      />
      <Link to="/" className="mb-6 flex items-center gap-2">
        <span className="grid h-10 w-10 place-items-center rounded-md bg-gold-gradient text-primary-foreground shadow-gold">
          <Sparkles className="h-5 w-5" />
        </span>
        <span className="font-display text-xl">Aetherfall</span>
      </Link>
      <h1 className="text-center font-display text-3xl">{title}</h1>
      {subtitle ? (
        <p className="mt-2 text-center text-sm text-muted-foreground text-balance">
          {subtitle}
        </p>
      ) : null}
      <div className="mt-6 w-full">{children}</div>
    </div>
  );
}

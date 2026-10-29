import { Link } from "@tanstack/react-router";

const nav = [
  { to: "/features", label: "Features" },
  { to: "/integrity", label: "Integrity engine" },
  { to: "/venues", label: "Venues" },
] as const;

export function SiteHeader() {
  return (
    <header className="border-b border-border bg-background">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Link to="/" className="flex items-center gap-2 font-serif text-xl text-foreground">
          <span className="inline-block h-3 w-3 rounded-sm bg-accent" aria-hidden />
          Research Workspace
        </Link>
        <nav className="flex items-center gap-6 text-sm">
          {nav.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className="hidden text-muted-foreground hover:text-foreground sm:inline"
              activeProps={{ className: "text-primary font-medium" }}
            >
              {n.label}
            </Link>
          ))}
          <Link
            to="/features"
            className="press rounded-full bg-primary px-4 py-2 font-medium text-primary-foreground hover:opacity-90"
          >
            Get started
          </Link>
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-6 py-10 text-sm text-muted-foreground sm:flex-row sm:justify-between">
        <p className="font-serif text-base text-foreground">Research Workspace</p>
        <p>Write, format and verify your paper in one place. A 7th semester B.Tech project.</p>
      </div>
    </footer>
  );
}

export function PageIntro({ eyebrow, title, children }: { eyebrow: string; title: string; children?: React.ReactNode }) {
  return (
    <section className="mx-auto max-w-3xl px-6 pt-20 pb-12">
      <p className="text-sm font-medium uppercase tracking-widest text-primary">{eyebrow}</p>
      <h1 className="mt-4 font-serif text-4xl sm:text-5xl leading-tight text-foreground">{title}</h1>
      {children && <p className="mt-6 text-lg leading-relaxed text-muted-foreground">{children}</p>}
    </section>
  );
}

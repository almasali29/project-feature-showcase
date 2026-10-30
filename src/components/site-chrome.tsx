import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Menu, X, LogOut } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-session";
import { profileQuery } from "@/lib/projects";
import { UserAvatar } from "@/components/user-avatar";

function AccountArea() {
  const { user, loading } = useSession();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { data: profile } = useQuery({ ...profileQuery(user?.id ?? ""), enabled: !!user });
  if (loading) return <span className="h-9 w-24" />;
  if (!user)
    return (
      <Link to="/auth" className="press rounded-full bg-primary px-4 py-2 font-medium text-primary-foreground">
        Sign in
      </Link>
    );
  return (
    <div className="flex items-center gap-3">
      <Link to="/dashboard" className="hidden font-medium text-foreground hover:text-primary sm:inline">Dashboard</Link>
      <Link to="/profile" aria-label="Profile" className="press rounded-full">
        <UserAvatar name={profile?.display_name ?? user.email} url={profile?.avatar_url} />
      </Link>
      <button
        aria-label="Sign out"
        className="press rounded-full p-2 text-muted-foreground hover:text-foreground"
        onClick={async () => {
          await qc.cancelQueries();
          qc.clear();
          await supabase.auth.signOut();
          navigate({ to: "/auth", replace: true });
        }}
      >
        <LogOut className="h-4 w-4" />
      </button>
    </div>
  );
}

const nav = [
  { to: "/features", label: "Features" },
  { to: "/integrity", label: "Integrity engine" },
  { to: "/venues", label: "Venues" },
] as const;

function useScrollEffects() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [progress, setProgress] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(h > 0 ? window.scrollY / h : 0);
      setScrolled(window.scrollY > 8);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>("main section, main li, main ol > li"));
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && (e.target.classList.add("in"), io.unobserve(e.target))),
      { threshold: 0.12 },
    );
    els.forEach((el, i) => {
      if (el.closest(".animate-rise")) return;
      el.classList.add("reveal");
      el.style.transitionDelay = `${(i % 4) * 70}ms`;
      io.observe(el);
    });
    return () => io.disconnect();
  }, [path]);
  return { progress, scrolled, path };
}

export function SiteHeader() {
  const { progress, scrolled, path } = useScrollEffects();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [path]);
  return (
    <header className={`sticky top-0 z-50 border-b bg-background/85 backdrop-blur transition-all ${scrolled ? "border-border shadow-sm" : "border-transparent"}`}>
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link to="/" className="group flex items-center gap-2 font-serif text-xl font-semibold text-foreground">
          <span className="inline-block h-3 w-3 rounded-sm bg-accent transition-transform duration-500 group-hover:rotate-45" aria-hidden />
          Research Workspace
        </Link>
        <nav className="flex items-center gap-6 text-sm">
          {nav.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className="hidden text-muted-foreground transition-colors hover:text-foreground md:inline"
              activeProps={{ className: "text-primary font-semibold" }}
            >
              {n.label}
            </Link>
          ))}
          <AccountArea />
          <button aria-label="Menu" onClick={() => setOpen(!open)} className="press rounded-full p-2 text-foreground md:hidden">
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </nav>
      </div>
      {open && (
        <div className="animate-rise border-t border-border px-6 py-4 md:hidden">
          {nav.map((n) => (
            <Link key={n.to} to={n.to} className="block py-3 font-serif text-2xl text-foreground" activeProps={{ className: "text-primary" }}>
              {n.label}
            </Link>
          ))}
        </div>
      )}
      <div className="absolute bottom-0 left-0 h-0.5 bg-accent transition-[width] duration-150" style={{ width: `${progress * 100}%` }} />
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-6 py-10 text-sm text-muted-foreground sm:flex-row sm:justify-between">
        <p className="font-serif text-base text-foreground">Research Workspace</p>
        <p>Write, format and verify your paper in one place.</p>
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

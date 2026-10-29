import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { lovable } from "@/integrations/lovable/index";
import { useSession } from "@/hooks/use-session";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Research Workspace" },
      { name: "description", content: "Sign in to Research Workspace with your Google account." },
      { property: "og:title", content: "Sign in — Research Workspace" },
      { property: "og:description", content: "Continue with Google to open your projects." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { user, loading } = useSession();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!loading && user) navigate({ to: "/dashboard", replace: true });
  }, [user, loading, navigate]);

  async function signIn() {
    setBusy(true);
    const res = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin + "/auth",
      extraParams: { prompt: "select_account" },
    });
    if (res.error) {
      toast.error("Couldn't sign in with Google. Please try again.");
      setBusy(false);
      return;
    }
    if (res.redirected) return;
    navigate({ to: "/dashboard", replace: true });
  }

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-6">
      <div className="animate-rise rounded-2xl border border-border bg-card p-10 text-center shadow-sm">
        <span className="mx-auto block h-4 w-4 rounded-sm bg-accent" aria-hidden />
        <h1 className="mt-6 font-serif text-4xl text-foreground">Welcome back</h1>
        <p className="mt-3 text-muted-foreground">Sign in with your Gmail account to open your research projects.</p>
        <button
          onClick={signIn}
          disabled={busy}
          className="press mt-8 inline-flex w-full items-center justify-center gap-3 rounded-full border border-border bg-background px-6 py-3 font-medium text-foreground disabled:opacity-60"
        >
          <svg viewBox="0 0 48 48" className="h-5 w-5" aria-hidden>
            <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/>
            <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
            <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/>
            <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/>
          </svg>
          {busy ? "Opening Google…" : "Continue with Google"}
        </button>
      </div>
    </main>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-session";
import { profileQuery } from "@/lib/projects";
import { UserAvatar } from "@/components/user-avatar";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({ meta: [{ title: "Profile — Research Workspace" }, { name: "description", content: "Manage your Research Workspace name and avatar." }, { property: "og:title", content: "Profile — Research Workspace" }, { property: "og:description", content: "Your researcher profile settings." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" }] }),
  component: Profile,
});

function Profile() {
  const { user } = useSession();
  const qc = useQueryClient();
  const { data } = useQuery({ ...profileQuery(user?.id ?? ""), enabled: !!user });
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState("");
  useEffect(() => { if (data) { setName(data.display_name ?? ""); setAvatar(data.avatar_url ?? ""); } }, [data]);
  const field = "mt-2 w-full rounded-lg border border-input bg-background px-4 py-3 text-foreground outline-none focus:border-primary";

  return (
    <main className="mx-auto max-w-xl px-6 pt-14">
      <p className="text-sm font-medium uppercase tracking-widest text-primary">Profile</p>
      <div className="animate-rise mt-6 flex items-center gap-5">
        <UserAvatar name={name} url={avatar} size="lg" />
        <div><p className="font-serif text-3xl text-foreground">{name || "Your name"}</p><p className="text-muted-foreground">{user?.email}</p></div>
      </div>
      <form className="mt-10 space-y-6" onSubmit={async (e) => {
        e.preventDefault();
        if (!user) return;
        const { error } = await supabase.from("profiles").upsert({ id: user.id, display_name: name.trim().slice(0, 100) || null, avatar_url: avatar.trim() || null });
        if (error) { toast.error("Couldn't save your profile."); return; }
        toast.success("Profile saved");
        qc.invalidateQueries({ queryKey: ["profile", user.id] });
      }}>
        <label className="block text-sm font-medium text-foreground">Name<input className={field} value={name} onChange={(e) => setName(e.target.value)} maxLength={100} /></label>
        <label className="block text-sm font-medium text-foreground">Avatar image link<input type="url" className={field} value={avatar} onChange={(e) => setAvatar(e.target.value)} placeholder="https://…" /></label>
        <button className="press rounded-full bg-primary px-6 py-3 font-medium text-primary-foreground">Save profile</button>
      </form>
    </main>
  );
}

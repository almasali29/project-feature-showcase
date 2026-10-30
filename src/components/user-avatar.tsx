export function UserAvatar({ name, url, size = "sm" }: { name?: string | null | undefined; url?: string | null | undefined; size?: "sm" | "lg" }) {
  const cls = size === "lg" ? "h-16 w-16 text-2xl" : "h-9 w-9 text-sm";
  const initial = (name || "?").trim().charAt(0).toUpperCase();
  return url ? (
    <img src={url} alt="" referrerPolicy="no-referrer" className={`${cls} rounded-full border border-border object-cover`} />
  ) : (
    <span className={`${cls} inline-flex items-center justify-center rounded-full bg-primary font-semibold text-primary-foreground`}>{initial}</span>
  );
}

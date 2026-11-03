<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Auth is Google-only via Lovable Cloud (`lovable.auth.signInWithOAuth`); signed-in pages live under `src/routes/_authenticated/` — keeps one managed gate.
- App data is read/written from the browser client with RLS owner policies (`user_id = auth.uid()`); query options live in `src/lib/projects.ts`.
- Structured manuscripts are project-owned JSON documents with optimistic revision checks; editing and related sources stay together to preserve stable citation and figure IDs.
- Load rich editing and preview tools lazily inside the authenticated workspace; browser-only export and sanitization must not execute during SSR.
- Venue layouts use configurable starting rules and local CSL styles; never describe their output as publisher-certified without rule-accuracy validation.
- Readiness findings are recalculated from current content; blockers cannot be acknowledged away, and heuristic semantic findings must remain warnings.
- Read document files on the device and import extracted sections only; original uploaded files are not retained, limiting document exposure.
- AI review reads owner-scoped saved manuscripts inside an authenticated server function; gateway requests stay server-only and access denials persist without automatic replay.

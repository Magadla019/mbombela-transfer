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

- Keep Mbombela page views and local demo data in shared client modules with thin TanStack route leaves; this makes the multi-page prototype consistent without a connected backend.
- Treat access-code dashboard entry as demo-only presentation, never server-side authorization; browser storage cannot secure business data.

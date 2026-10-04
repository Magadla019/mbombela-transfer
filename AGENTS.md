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

- Treat access-code dashboard entry as demo-only presentation, never server-side authorization; browser storage cannot secure business data.
- Orders, drivers_live and staff review moderation go through server functions (src/lib/orders.functions.ts) with a signed staff token; those tables have no public RLS policies because access codes are not real accounts and customer data must not be publicly readable.
- Dashboards and tracking refresh every 3s via server functions instead of browser realtime, since browser realtime would require public read access to orders.

- Public restaurant catalogue rows use read-only RLS; manual items remain tagged with their supplied source rather than presented as verified official updates. This prevents unverified menu data from masquerading as live prices.
- Client order dashboard reads only order IDs retained on the placing device until account-bound ownership exists; this avoids broad public order queries that expose customer details.

- Home-screen installation uses only a manifest and CDN-hosted icons, with no offline service worker, because preview and deployments must not serve stale pages.

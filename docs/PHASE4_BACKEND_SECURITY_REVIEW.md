# Phase 4 Backend Security Review

**Scope:** source audit; NOT an authenticated staging penetration test. Any production migration requires review and approval.

| Threat | Source safeguard / action | Verification still needed |
|---|---|---|
| Unauthenticated ordering updates | `/api/admin/service-arrangement` calls `getAdmin`; server validates role returned by `cms_staff_role`; `sameOrigin` required for PUT | Real unauthenticated/Editor/Publisher/Admin staging requests |
| Unknown or retired service IDs in menu | Eligible IDs are read from `cms_services where status='published'`; placement flags validated | Publish/unpublish/race tests |
| Malformed/duplicate IDs | `asServiceArrangement` validates slug shape, max 100, uniqueness, both arrays | Fuzz malformed JSON, oversized payloads |
| Concurrent changes | Single `cms_site_settings` row; `updated_at` compare-and-set, HTTP 409 | Two concurrent publisher sessions with actual database |
| Settings accidentally private | Saved arrangement `is_public=true`; public read explicitly checks public flag | Verify RLS grants in staging |
| Draft data leaks | Public reader queries status published; public refresh sends timestamp only; ordering rejects unpublished IDs | Anonymous SQL/RLS read tests |
| Media promotion before permission | CMS PATCH now resolves current status and rejects unauthorized Editor changes before image promotion | Editor attempting to publish a staged image |
| Gallery reorder partial writes | Optional security-definer `cms_reorder_gallery` RPC is transactional, with server-side publisher check and locked rows | Deploy SQL in staging with approval, test rollbacks. Until deployed, legacy fallback remains non-atomic. |
| Public refresh forged signals | Public browser verifies version against `/api/public/content-version` before `router.refresh` | Browser reconnect, concurrent publish, cache tests |
| Stale fallback content hides outages | Public reader now logs database read failures with table/code | Production logging/alert routing |
| Storage key confidentiality | Secret Supabase key remains server-only in `serviceClient`; new admin API uses user-scoped client | Verify deployment variables and network traces |

**Open risks:** Full staged environment tests have not run; source archive lacks package.json/dependencies. `cms_publication_state` migration applied status is unknown. Gallery fallback is non-transactional until migration is reviewed and applied. Browser pull/push updates cannot be guaranteed subsecond under network disruptions. User permissions depend on live Supabase RLS deployment matching repository migrations.

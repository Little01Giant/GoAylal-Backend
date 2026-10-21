# Frontend migration checklist (phase 2)

Written against `D:\Travel project` as of the backend refactor. Nothing here was changed in the frontend.
The backend keeps the **Transitional** measures from `API_CONTRACT.md` until the items below are done; each has a test that fails when the measure is removed, so removal is deliberate.

## What breaks today (verified by reading the source, not by running the UI)

| Workflow | Effect with the new backend | Why |
|---|---|---|
| Guest taps "Proceed to payment" in `PlannerSummary` | `POST /itineraries` returns **401**. The call is wrapped in `try/catch` and `finally` opens the payment modal anyway, so the user still sees the QR, but `createdItineraryId` is unset and the invoice is created without an itinerary. | Saving requires login. |
| Guest pays | Still works **only while `GUEST_CHECKOUT_ENABLED=true`** (default). The payment is a guest payment: it is linked to an account only after the payer signs in with the same verified email. | `PaymentModal` has no login gate. |
| Displayed price | The QR/amount line shows `invoice.amount`, i.e. the server fee, because it reads `invoice.amount \|\| unlockFee`. Wherever the literal `unlockFee` is shown (fallback) it still says 100. | `unlockFee={100}`. |
| Cached invoice reuse | `PaymentModal` only reuses a cached invoice when `invoice.amount === unlockFee`; with a 20,000 fee and a prop of 100 it never matches, so each remount asks for an invoice again (the backend returns the same pending one). Harmless, wasteful. | Same prop. |
| `simulate: true` verify | Ignored unless the backend runs with `QPAY_MOCK=true`. | Security. |
| Profile, receipts, history | Require a token (as before). Receipts for another user's payment are 404. | Ownership. |
| Anything calling `GET/DELETE/PUT /itineraries/:id` without a token | 401 | Ownership. |

Not verified: the live guest flow in a browser (the dev servers were not started in this phase).

## api-client.ts

| Method | Change |
|---|---|
| `fetchApi` | Handle **401** by routing to `/login?callbackUrl=…` instead of silently continuing; handle **429** (`code: RATE_LIMITED`) and **503** (`SERVICE_UNAVAILABLE`, QPay down) with a retry message. Read `code` for logic, `error` for display. |
| `createBackendItinerary` | Only call when logged in. Read `id` (not `_id`). Send one entry per day in `days` (today everything is in `days[0]`). Stop sending fields the API ignores. |
| `createBackendQPayInvoice` | Send `{ itineraryId, email?, title?, planSnapshot? }`. **Drop `amount`**. Do not default `itineraryId` to `'itn-temp'` or the email to `traveler@goaylal.mn`. Read `transactionNumber`, `currency`, `qpayInvoice.qPayShortUrl` from the response (all present). |
| verify call | Send an empty body; remove `simulate`. |
| `loginWithGoogle` | Send only `{ idToken }`. |
| `getMe` / `AuthUser` | Use `id`. |
| AI chat | Send/read `sessionId` only (drop `conversationId`). Keep a stored `sessionId` per signed-in user; after logout a previous id yields a new conversation. |
| payment and receipt normalizers in `api-client.ts` | **Remove the default that turns an unrecognised status into `completed`.** The API emits exactly `pending, completed, failed, expired, refunded`. Remove `cancelled`. Remove the `amount = 100` fallback and the invented title. |
| itinerary list/detail | Use `id`; add `unlocked` handling (status `draft|saved|unlocked`). |
| destinations | Remove the local de-duplication of hotels/transports/attractions (the backend returns every row, with stable ids). Keep the offline fallback. |

## Types (`src/types/index.ts`, `api-client.ts`)
- `ItineraryStatus`: `'draft' | 'saved' | 'unlocked'` (drop `booked`, `completed` for new data; the backend can still return them for legacy rows).
- `PaymentStatus`: `'pending' | 'completed' | 'failed' | 'expired' | 'refunded'`.
- `BackendItinerary`: `id`; `userId` is a string.
- Invoice response: `transactionId`, `transactionNumber`, `invoiceNumber`, `amount`, `currency`, `qpayInvoice { invoiceId, qrText, qrImage, qPayShortUrl, urls[] }`.
- Admin lists: `{ items, total, page, totalPages }` (users now include `totalPages`).

## Components and workflows
1. **Login gate before saving and paying** (`PlannerSummary`, `SuggestionDetailView`, `PaymentModal`). If there is no token, store the draft locally, send the user to `/login?callbackUrl=<current page>`, and on return `POST /itineraries` with the stored draft, then open the payment modal with the returned `id`. This is the "transfer the guest draft after sign-in" step; the backend treats it as an ordinary create.
2. `PlannerSummary` / `SuggestionDetailView`: pass `unlockFee={20000}` (or read the fee from the first invoice) so the fallback display and the cached-invoice reuse agree with the server.
3. `PaymentModal`: remove the `traveler@goaylal.mn` and `itn-temp` fallbacks; show a login prompt on 401; show the 15-minute timer from the invoice, and on expiry request a new invoice (the backend expires or settles the old one correctly).
4. Post-unlock "Хадгалах": the snapshot now lives in the payment (`GET /payments/my`, `GET /payments/receipt/:id`). `ProfileView` and `SnapshotPlanDetailView` should render it instead of rebuilding it from itineraries with fixed 35/45/20 ratios and a 240,000 per-night guess. Drop the `goaylal_payments`, `goaylal_saved_snapshots` and `goaylal_user_email` caches as sources of truth.
5. Admin dashboard (`/admin/page.tsx`): remove `handleDevAdminLogin`; the server decides who is an admin. Remove the hard-coded super-admin email check in `auth-hooks.ts` (`useIsAdmin`, `isCurrentUserAdmin`) and use `user.role` from `/auth/me`.
6. Token expiry: tokens last 7 days with no refresh. Treat a 401 as "signed out" everywhere, not only when a stored token existed.

## Order of work and the removal gate
1. Add the login gate and draft transfer (items 1 and 3), fix the status mapper and the fee (item 2 and api-client).
2. Verify the whole flow against a staging backend with real QPay test credentials.
3. Set `GUEST_CHECKOUT_ENABLED=false` in the backend environment.
4. Then delete the backend's transitional code: guest branch in `PaymentsService.createQPayInvoice`, the `_id` aliases, the `conversationId`/`amount`/`userId`/`name`/`image` ignored fields, the single-`days[0]` allowance, and switch the global `ValidationPipe` to `forbidNonWhitelisted: true`.

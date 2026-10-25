# GoAylal API contract (target) — backend phase 1

Base URL `/api/v1`. This file is the contract the backend is built and tested against
(`test/*.e2e-spec.ts`). It lives in the backend repo because `travel-docs/` is read-only during this phase.

**Tags.** Every deviation from the end state is tagged so it can be removed deliberately:
**Target** = intended behaviour. **Transitional** = temporary compatibility for the current frontend, with a removal condition.
**Frontend change** = something the frontend must do (see `FRONTEND_MIGRATION.md`).

## Conventions

| Topic | Rule |
|---|---|
| Success | `{ "success": true, "data": … }` |
| Error | `{ "success": false, "error": "<Mongolian message>", "code": "<CODE>" }` |
| Error codes | `VALIDATION_FAILED` 400, `UNAUTHORIZED` 401, `FORBIDDEN` 403, `NOT_FOUND` 404, `CONFLICT` 409, `PAYLOAD_TOO_LARGE` 413, `RATE_LIMITED` 429, `SERVICE_UNAVAILABLE` 503, `INTERNAL_SERVER_ERROR` 500 (message hidden, logged). Other `HTTP_<status>` for anything else. |
| Auth | `Authorization: Bearer <JWT>`. The user (role, `isActive`) is loaded from the database on every request, so demotion/deactivation is immediate. Token lifetime `JWT_EXPIRES_IN` (7d), no refresh. |
| Optional auth | A missing token is a guest. A token that is present but invalid is **401**, never silently a guest. |
| Money | Integer MNT. The server owns the unlock fee (`UNLOCK_FEE_MNT`, default 20000). |
| Ids | Resources expose `id`. `_id` is also emitted where the frontend still reads it (**Transitional**, remove with the frontend id cleanup). |
| Pagination | Admin lists only: `page ≥ 1` (default 1), `1 ≤ limit ≤ 100` (default 30). Out-of-range/non-numeric → 400. Response `{ items, total, page, totalPages }`. Itinerary/payment lists are newest first, capped at 100. |
| Unknown properties | Stripped, not rejected (**Transitional**, becomes `forbidNonWhitelisted` once the frontend stops sending extras). |
| Body limit | 256 kB. |
| Rate limits (per client IP, per route) | `POST /auth/google` 20/min, `POST /payments/qpay/create-invoice` 10/min, callback and verify 60/min, `POST /ai/chat` 20/min. In-memory: per process under PM2 cluster. Needs `TRUST_PROXY=1` behind Nginx. |

## Payment and itinerary states

- **Payment status** (only these five are ever emitted): `pending → completed | failed | expired`; `refunded` is reserved for a manual support action (no endpoint). Transitions are atomic and one-way: a terminal state never moves back. `completed` is set **only** after QPay's `/payment/check` confirms the invoice.
- **Itinerary status:** `draft | saved | unlocked` (`booked`, `completed` exist in legacy data). `POST /itineraries` stores `saved`; settlement of a payment for it sets `unlocked`; an unlocked itinerary is read-only (reorder → 409) and cannot be charged again (409).

## Routes

### Auth
| Route | Auth | Request | Response / errors |
|---|---|---|---|
| `POST /auth/google` | public | `{ idToken }`. `name`, `image` accepted but **ignored** (**Transitional**; **Frontend change**: stop sending). | `200 { accessToken, user: { id, email, name, image, role } }`. Identity comes from the verified token only (signature, expiry, `aud`, `email_verified=true`); there is no tokeninfo fallback. 401 invalid token or an email already bound to another Google identity; 403 deactivated account. Addresses in `ADMIN_EMAILS` get `role: "admin"`. |
| `GET /auth/me` | JWT | – | `200 { id, _id, email, name, image, role, isActive, createdAt }` (`_id` **Transitional**). |

### Destinations (public, read-only)
| Route | Response |
|---|---|
| `GET /destinations?countryKey&popular` | destinations. |
| `GET /destinations/suggested-trips` | active curated trips (`id` = slug). Registered before `:key`. |
| `GET /destinations/:key` | `{ key, name, country, countryKey, flag, tag, description, attractions[], hotels[], transports[] }`; each item has a stable `id`. All rows are returned (no de-duplication). 404 `NOT_FOUND` for an unknown key. |

Catalog rules: prices are integer MNT taken directly from Trip.com (AGENTS.md). Attraction `estimatedCost` ≥ 0 per adult (`0` = free). Exactly three hotel tiers `starRating` 2, 3, 5. Transport `type ∈ flight | overland | combined`, `pricePerPerson` > 0. Cities live only in the database: add or edit one with `PUT /admin/destinations/:key` (idempotent upsert by `(destinationKey, seedId)`; ids are stable). There is no seed file, boot seeding or code fallback.

### Itineraries — permanent saving requires login
Guests plan and keep drafts **in the frontend only**. They never reach the API.

| Route | Auth / ownership | Request | Response / errors |
|---|---|---|---|
| `POST /itineraries` | JWT. Owner = token subject (a body `userId` is ignored). | `{ destinationKey, title, description?, startDate?, endDate?, totalDays (1–30), days: [{ dayNumber (1–30), title, date?, accommodationCost?, transportCost?, items: [{ attractionId, name, orderIndex?, cost?, durationHours? }] }] }`. Costs are numbers 0…1e9. | `201 { id, _id, destinationKey, title, totalDays, totalCost, currency: "MNT", status: "saved", userId, days, createdAt, … }`. `totalCost` is recomputed by the server from line costs. 400 on a violated limit. **Frontend change**: log in before saving; read `id`. |
| `GET /itineraries/my` | JWT | – | the caller's itineraries (≤ 100, newest first). |
| `GET /itineraries/:id` | JWT; owner or admin | – | the itinerary; **404 for anyone else** (existence not disclosed). |
| `DELETE /itineraries/:id` | JWT; owner only | – | `{ deleted: true, id }`; 404 otherwise. |
| `PUT /itineraries/:id/reorder-items` | JWT; owner only; not when `unlocked` (409) | `{ sourceDayNumber, destinationDayNumber, itemId, newOrderIndex ≥ 0 }`; `itemId` is the item `_id` (or its `attractionId` when unambiguous). | `{ updated, totalCost, recalculatedTotalCost }` (the two cost fields are equal; `totalCost` **Transitional**). |

Limits (PROJECT_RULES): at most 30 days and **8 items per day**. A plan with several `days` entries is capped at 8 per day. **Transitional**: the current frontend sends one `days[0]` holding every item while `totalDays` is larger, so a single-day payload is accepted when the total is ≤ `8 × totalDays` (its default of 10 items over 5 days passes). **Frontend change**: send one entry per day.

### Payments
| Route | Auth / ownership | Request | Response / errors |
|---|---|---|---|
| `POST /payments/qpay/create-invoice` | **Target:** JWT. **Transitional:** guests allowed while `GUEST_CHECKOUT_ENABLED=true` (default); with `false` a guest gets 401. Optional-auth route: invalid token → 401. | `{ itineraryId?, email? (valid email; required for guests), title?, planSnapshot? }`. `amount`, `userId` are accepted but **ignored**. | `201 { transactionId, transactionNumber, invoiceNumber, amount, currency: "MNT", qpayInvoice: { invoiceId, qrText, qrImage, qPayShortUrl, urls: [{ name, description, logo, link }] } }`. `amount` is always the server fee. |
| `POST /payments/verify/:transactionId` | public (safe: only QPay's confirmation settles) | `{ simulate? }` (honoured only with `QPAY_MOCK=true`, impossible in production) | `200 { verified, transactionNumber, status }`. 404 unknown. |
| `POST /payments/qpay/callback` | public (QPay) | `{ payment_id }` or `?qpay_payment_id=`. The body is never trusted; the payment is re-checked with QPay. | `200 { received, verified, transactionNumber }`. 404 unknown. |
| `GET /payments/my` | JWT | – | history: `[{ id, transactionNumber, invoiceNumber, title, destinationName, paymentMethod, paymentMethodLabel, bankName, paidAt, amount, status, statusLabel, items, planSnapshot }]` (≤ 100). |
| `GET /payments/receipt/:id` | JWT; payer or admin; others 404 | `:id` is the id, transaction, invoice or QPay invoice number | the stored transaction. |

Rules:
- **Authenticated payer:** the transaction is tied to the token subject and to **their own** itinerary (another user's → 404; an `unlocked` one → 409). An invalid placeholder id such as `itn-temp` means "no itinerary".
- **Guest payer (transitional):** `userId` is empty, `itineraryId` is never linked, the email is required. When a user later signs in, completed guest payments whose `customerEmail` equals their **verified** Google email are linked to them once, atomically (`/payments/my`, receipt).
- **One pending invoice per payer and plan**, enforced by a partial unique index on `dedupeKey` (payer + itinerary, or payer + plan hash). A repeat request within 15 minutes returns the same invoice. An older pending invoice is first re-checked with QPay: paid → settled and returned; unpaid → `expired` and replaced.
- **Settlement** is one code path shared by verify, callback and admin recheck. A conditional update `pending → completed` makes it atomic, so concurrent calls yield exactly one transition and one set of side effects (itinerary → `unlocked`; optional email when `PAYMENT_EMAIL_ENABLED=true`).
- `planSnapshot` is reduced to known display fields with bounded types; it never affects the charge.
- Reference numbers `TRX-YYYY-MMDD-NNNN` / `INV-…` come from an atomic per-day counter (Ulaanbaatar time), so they are unique across instances.
- Without valid QPay credentials (and without `QPAY_MOCK`) invoice creation fails with 503; there are no fake invoices.

### AI planner
| Route | Auth | Request | Response |
|---|---|---|---|
| `POST /ai/chat` | optional JWT; 20/min | `{ message (1–1000 chars), sessionId? }`. `conversationId` is an alias (**Transitional**). | `200 { sessionId, conversationId, messageId, role: "assistant", content, plan?, quickSuggestions[] }`. |

Ownership: a conversation started with a token belongs to that user; anyone else supplying its `sessionId` simply gets a **new** conversation (nothing is exposed or extended). An anonymous conversation is adopted by the first signed-in user who continues it. No destination in the message → no `plan` (the planner asks instead of guessing Beijing). Trip length is read only from numbers attached to a day unit (`5 өдөр`, `12 хоног`); party size from `N хүн/найз` or phrases. Sessions are capped at 100 messages.

### Admin (`JWT` + role `admin` read from the database)
All routes return 401 without a token and 403 for a non-admin.

| Route | Notes |
|---|---|
| `GET /admin/stats` | totals computed in the database. |
| `GET /admin/transactions?search&status&page&limit` | `status ∈ all|pending|completed|failed|expired|refunded`; `search` is a literal (regex-escaped). |
| `GET /admin/transactions/:id`, `POST /admin/transactions/:id/recheck` | recheck asks QPay and settles only on confirmation. |
| `GET /admin/users?search&page&limit` | adds `totalPages`; `totalSpent`/`transactionsCount` from two grouped queries (no per-user queries). |
| `PATCH /admin/users/:id/role` | `{ role }` → `{ id, _id, email, name, role, isActive }`. 409 when demoting the last admin or an `ADMIN_EMAILS` account. |
| `GET/POST /admin/trips`, `PUT/DELETE /admin/trips/:id` | whitelisted DTO with bounds; the `slug` is immutable. |

## Environment

| Variable | Rule |
|---|---|
| `JWT_SECRET` | **Required everywhere, no default.** ≥ 32 chars in production (≥ 16 elsewhere), not repetitive, not a placeholder (`your_…`, `change…`). Startup fails otherwise. |
| `MONGODB_URI` (canonical) / `DATABASE_URI` (alias) | `MONGODB_URI` wins. One is required in production, and the in-memory fallback is refused there. |
| `NODE_ENV` | `development | test | production`. |
| `GOOGLE_CLIENT_ID` | required in production. |
| `QPAY_CLIENT_ID`, `QPAY_CLIENT_SECRET`, `QPAY_INVOICE_CODE`, `QPAY_CALLBACK_URL` | required in production. `QPAY_MOCK` and `ALLOW_DEV_ADMIN_TOKEN` and `RATE_LIMIT_DISABLED` are refused in production. |
| `UNLOCK_FEE_MNT` | positive integer, default 20000. |
| `ADMIN_EMAILS` | comma list; defaults to the project's existing super-admin so access is preserved. |
| `GUEST_CHECKOUT_ENABLED` | default `true` (**Transitional**). |
| `PAYMENT_EMAIL_ENABLED` | default `false` (a code comment records that the product owner did not want the PDF/email sent yet; the docs say otherwise). |
| `DEEPSEEK_API_KEY/BASE_URL/MODEL` | the AI provider is DeepSeek via The Hive. Optional: without a key the built-in cost plan is returned. `GEMINI_API_KEY` from the docs is **not** used. |
| `CORS_ORIGIN` | comma list; localhost is added only outside production. |
| `TRUST_PROXY`, `SMTP_*` | see `.env.example`. |

## Deployment implications
1. Set a real `JWT_SECRET` before deploying; a deployment still using a short, repetitive or placeholder secret will refuse to start. **Rotating it logs everyone out.**
2. In production Mongoose no longer builds indexes at boot. Before (or right after) the first deploy run `npm run build && npm run migrate:payment-indexes` (dry run), review the report, then re-run with `--apply --allow-production --confirm-backup`. It never deletes: surplus duplicate pending invoices are moved to `expired`.
3. The catalog is read only from the database: there is no seed file, boot seeding or in-code fallback. A database without cities serves an empty list.
4. `userId` on payments is optional now. Legacy rows created with a random placeholder user id remain as they are (they never match a real user).
5. The pending-invoice dedupe, rate limits and token checks assume `TRUST_PROXY=1` behind Nginx.

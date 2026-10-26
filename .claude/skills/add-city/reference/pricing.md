# Route pricing (round trip, per person, MNT)

Reuse the legs already in the catalog; only look up legs that are new.

| Leg | Source | Value |
|---|---|---|
| Улаанбаатар -> Бээжин, flight | `tr-bj-flight` (Trip.com, MIAT, 2 талдаа) | 916,300 |
| Улаанбаатар -> Замын-Үүд -> Эрээн -> Бээжин, overland | `tr-bj-overland` | 418,260 |
| Улаанбаатар -> Замын-Үүд -> Эрээн, Эрээн -> Бээжин flight | `tr-bj-combined` | 598,000 |
| Бээжин -> Пукет nonstop (Air China) | Trip.com 2026-11-23..28 | 1,399,100 |

Pricing the user's two usual shapes for a city X reached via Beijing:
- Route "Улаанбаатар - Бээжин - X" -> `type: flight`, price = `916,300 + (Бээжин -> X round-trip)`.
- Route "Улаанбаатар - Замын-Үүд - Эрээн - Бээжин - X" -> `type: combined`, price = `418,260 + (Бээжин -> X round-trip)`.

Other routes: price each new leg on Trip.com the same way and sum them. Dates: depart about 31 days from today, return 5 days later (the catalog's "1 сарын өмнөх эрт захиалгын үнэ"). Put the date basis in the transport `description`. Duration text for multi-leg trips is an estimate; say so in the report.

Hotels (1 night, 1 room): tiers 2 / 3 / 5 star, each priced as the average of several hotels (hostels, capsules and dorm beds excluded; name them in `locationDesc`). Unsplash stand-in images are shared across cities (the ones in `reference/city-spec.example.json`).

## Source URLs (needed for price refreshes)

Every price keeps its Trip.com page in `sourceUrl` plus `priceCheckedAt`. A refresh re-opens each `sourceUrl` with `curr=MNT`, re-reads the same ticket/room/flight, updates the price and `priceCheckedAt`, and re-seeds. Beijing and Shanghai were added before source URLs were kept, so they have none yet; the first refresh of those cities must add their Trip.com links. Shared legs (the Улаанбаатар -> Бээжин part) are priced by the `beijing` entry, not by the new city.

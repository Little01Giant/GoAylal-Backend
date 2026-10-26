---
name: add-city
description: Add a new destination city to the GoAylal travel catalog (attractions, 2/3/5-star hotels, transport routes, photos, AI-planner keyword, seed). Use when the user names a city and gives route descriptions and/or Trip.com attraction links, e.g. "Хойд Ан нэмье, маршрут: ..., үзвэрүүд: <links>".
---

# Add a city to the catalog

Input from the user: a **city**, its **routes** (e.g. "Улаанбаатар - Бээжин - Пукет"), and **Trip.com attraction links** (`?curr=MNT`). Output: the city in the database (Atlas), photos on R2 and its ready plan. **Cities live only in the database: there is no seed file or code fallback, so adding a city needs no code change or deploy** (the one exception is the AI planner keyword in step 4).

Everything below was learned adding Пукет. Follow the order; stop at the two confirmation gates.

## 0. Rules that never bend
- **Prices are direct MNT from Trip.com** (`AGENTS.md`): integer MNT, free sites are `0`, adult ticket price, 3 hotel tiers (exactly 2, 3, 5 star), transport prices per person round trip. Never convert currencies or guess; if a price cannot be read, ask the user.
- **Photos come from the Trip.com attraction gallery** (the user decided this when adding Ханой; before that Wikimedia Commons / Pexels were used). Trip.com photos are copyrighted, so tell the user once that publishing them on R2 carries a rights risk. Use the Commons (CC BY / CC BY-SA / CC0 / public domain) -> Pexels/Unsplash/Pixabay route only for an attraction whose Trip.com page has no usable gallery image, or when the user asks for licensed photos; record credits for those. Never take photos from other copyrighted sites. Skip promo banners and images with overlaid text.
- Texts the planner shows are **Mongolian** (name, description, highlights, hotel/transport text); `nameEn` is the English name from Trip.com.
- Existing seed values for shared route legs are reused, not re-queried: Улаанбаатар -> Бээжин flight and the overland legs come from the `beijing` entry (`tr-bj-flight`, `tr-bj-overland`, `tr-bj-combined`).
- **Keep the Trip.com source of every price.** Each attraction, hotel and transport stores `sourceUrl` (the Trip.com page the price was read from) and `priceCheckedAt` (YYYY-MM-DD). They are written to Atlas (internal, for later price refreshes) and are stripped from public API responses. `insert-city.mjs` rejects a spec without them. Use the clean page URL the user gave (drop `lasttraceid` / `ext-searchpage` tracking params); for hotels use the list URL with city and dates, for flights the search URL with dates.
- Do not read or print secrets from `.env`; only check that variables are set. Never paste the Atlas URI.

## 1. Collect facts from Trip.com (browser)
- Use **Claude in Chrome** (`mcp__claude-in-chrome__*`; load tools with one ToolSearch). The built-in browser gets a `whaleguard block` bot page and WebFetch/WebSearch return no MNT prices - do not try to get around a block.
- Open each attraction link with `curr=MNT&locale=en-XX`, wait ~3 s, then read with `javascript_tool` (tool output is truncated at ~1.2k chars, so extract compactly):
  - head: `document.title.split(' Tickets')[0]`, `/(\d\.\d)\/5\s*\n\s*([\d,]+) Review/` (rating), `/\n(Open[^\n]*|Closed[^\n]*)/` (hours), `/Recommended sightseeing time: ([^\n]+)/` (hours -> `estimatedHours`), `Free entry` present -> cost 0.
  - tickets: `t.slice(t.indexOf('Select date')+11, +700)`; take the **Adult** ticket "From MNT x" (cheapest official adult admission, not a tour or transfer package unless that is all there is - say so).
  - `/things-to-do/detail/...` and `/hotspoi/...` pages have a different layout: read `document.body.innerText.slice(0,1400)`.
- Flights: `https://www.trip.com/flights/<from>-to-<to>/tickets-<iata>-<iata>/?dcity=..&acity=..&ddate=<today+31d>&rdate=<+5d>&flighttype=rt&curr=MNT&locale=en-XX&quantity=1`, wait ~16 s, take the cheapest **nonstop** round-trip. Route price = sum of legs (see `reference/pricing.md`).
- Hotels: `https://www.trip.com/hotels/list?city=<id>&cityName=<name>&checkin=..&checkout=..&adult=1&crn=1&curr=MNT&locale=en-XX`, tick the star checkboxes in the left filter (the `star=` URL param is ignored). Price each tier as the **average** of several hotels (user's rule, not a single hotel): tick the star filter, take the first ~5-10 listed hotels, drop hostels, capsules and dorm beds (and suites that are outliers), and average the listed 1-night, 1-room rate. Name the hotels used in `locationDesc`.
- Close the Chrome tab you opened when done.

## 2. Write the spec
Copy `reference/city-spec.example.json` to a scratch folder, fill it in (including `sourceUrl` on every attraction, hotel and transport, and a spec-level `priceCheckedAt`). `code` is a 2-3 letter prefix used in ids (`bj`, `sh`, `ph`); it must be unused. `rank` 1..N is popularity order (the planner preselects the first 10). Categories: nature, historical, cultural, adventure, city, culinary. Transport `type`s: `flight`, `combined`, `overland`, at most one of each; a user route that mixes ground + flight is `combined`.

## 3. Photos (staging only, nothing uploaded yet)
Staging layout: `<stage>/<code>-att-NN/{1,2,3}.webp`.
1. **Trip.com gallery (default).** While each attraction page is open (step 1), collect up to 3 gallery image ids with `javascript_tool`:
```js
(()=>{const seen=new Set(),out=[];for(const i of document.querySelectorAll('img')){const m=(i.currentSrc||i.src).match(/tripcdn\.com\/images\/([^_?\/]+)_/);if(!m||i.naturalWidth<400||i.getBoundingClientRect().top+scrollY>700||seen.has(m[1]))continue;seen.add(m[1]);out.push(m[1])}return out.slice(0,3).join(',')})()
```
(use a limit of 900 on `/things-to-do/detail/` pages). Put them in a plan `{ "<code>-att-NN": ["id", ...] }` and run `node .claude/skills/add-city/scripts/fetch-trip-images.mjs <plan.json> <stage>`.
2. **Look at the photos** (build a contact sheet with `sharp`, open it with Read). Drop promo banners and images with overlaid text, then renumber the files so `1.webp` is the best one. Every attraction needs at least one image.
3. **Fallback for gaps:** Commons / Pexels with `fetch-images.mjs commons|pexels <plan.json> <stage>` (plan format is in the script header; Pexels slugs from `https://www.pexels.com/search/<query>/` via `a[href*="/photo/"]`). Generic stock photos of a named venue must be disclosed to the user as generic.

## 4. Validate, planner keyword
1. `node .claude/skills/add-city/scripts/insert-city.mjs <spec.json> --images <stage> --dry-run` and fix every rejected rule. The real write to the database happens at GATE 2 (step 6).
2. Only if the city's name is not already in `CITY_KEYWORDS` in `src/modules/ai-planner/trip-request.parser.ts`: add `[key, [mongolian spellings..., english]]` **above** any country-level entry that would also match (first match wins) plus a case in `trip-request.parser.spec.ts`. This is the only code a new city can need, and then it is deployed with the next release.

## 4b. Ready plan (suggested trip) - required for every city
A city is not done until it has its ready plan `trip-<key>`, otherwise it never shows on the home page or `/suggestions`. It is a `suggested_trips` document in Atlas; the code has no fallback list.
1. Fields: `slug: 'trip-<key>'`, `title: '<Хотын нэр> хотын аяллын хөтөлбөр'`, `destination: '<Хот>, <Улс>'`, `country`, `countryKey`, `countryFlag`, `durationText: '3 – 10 өдөр'`, `daysCount: 5`, `category` (the city's main category), `categoryLabel: 'Бэлэн төлөвлөгөө'`, `startingPrice`, `imageUrl` (rank-1 attraction photo on R2), `rating`, `reviewsCount`, `highlights` (4 strings: top attractions + the transport option), `isActive: true`.
2. `startingPrice` = cheapest tier hotel x 4 nights + cheapest transport + the first 10 attractions (rank 1..10), per person, MNT integer. Compute it from the spec, do not guess.
3. Written at GATE 2 together with the city: upsert by `slug` with a one-off script (copy it next to `package.json`, delete after) or `POST /admin/trips`. Verify with `GET /destinations/suggested-trips` that `trip-<key>` is returned.

## 5. GATE 1 - upload photos (public, writes to the user's R2)
Show the user a table: per attraction, image count and source (Trip.com gallery, or license and author for Commons/Pexels), plus which are generic. Wait for a yes unless the request already told you to upload. Then:
```
node .claude/skills/add-city/scripts/upload-images.mjs <stage> --dry-run
node .claude/skills/add-city/scripts/upload-images.mjs <stage>
```
It never overwrites. Check each URL with `curl -I` (expect 200). Save credits to `docs/<key>-image-credits.json` for Commons/Pexels photos (CC BY / BY-SA need on-site attribution).

## 6. GATE 2 - write to Atlas (writes to the production-like DB)
`.env` `MONGODB_URI` points to Atlas. Ask before writing unless already told to. Then `npm run build` and `node .claude/skills/add-city/scripts/insert-city.mjs <spec.json> --images <stage>` (idempotent upsert by `(destinationKey, seedId)`, deletes nothing), then the ready plan from step 4b. Verify with `GET /destinations/<key>`: counts, hotel tiers, transport prices, no attraction without an image, and no `sourceUrl` in the public response.

## 7. Report
Summarise: what was added (including the ready plan `trip-<key>` and its `startingPrice`), that every price has its Trip.com `sourceUrl`/`priceCheckedAt`, every price that is an estimate or a package/transfer price, generic or other-location photos, the credits file. Photos on R2 and the Atlas rows are already live; no deploy is needed unless step 4.2 changed the parser.

# Renovo Music

Internal app for the Renovo Music worship ministry: schedules, repertoire, execution history and push notifications. A PWA in Brazilian Portuguese, dark and light theme, zero hosting cost.

## The domain in two sentences

A **Schedule** (Escala) is a service or event with a date, a **Team** (who plays what) and a **Repertoire** (an ordered list of songs, excerpts or medleys, each with the key it will be played in). When the day ends the Schedule becomes *Realizada* on its own and every item turns into an **Execution** derived from the plan, which is what answers "who has played this song" and "when did we last play it"; there is no attendance log to fill in afterwards.

The vocabulary and rules live in [CONTEXT.md](./CONTEXT.md) and [docs/dominio/escala.md](./docs/dominio/escala.md) (Portuguese). The reasoning behind deriving Executions from the plan is in [ADR 0001](./docs/adr/0001-execucao-derivada-do-plano.md); finding the song on Cifra Club so the leader can read the original key there, and why the app no longer reads the page itself, is in [ADR 0002](./docs/adr/0002-ler-o-tom-no-cifra-club.md).

## What it does

- **Schedules**: a whole month of Sundays in one go (the second Sunday is born as *Santa Ceia*, the communion service) or a single event with its own date and time; cancel, undo, postpone, and edit past Schedules to correct history.
- **Team**: members with one or more roles (vocal, guitar, acoustic guitar, bass, drums, keys, sound), grouped by role group; a reusable **Formation** applies the usual band in one tap; the worship leader (*Ministro*) is a mark on top of the roles.
- **Repertoire**: whole songs, excerpts delimited by start/end timestamps in the reference video, and medleys; each item carries its key and an optional note for the group; drag to reorder.
- **Keys**: a twelve-note keyboard with major/minor; the suggested key is the last Execution, then the hand-filled last known key, then the original key, which the leader looks up on the Cifra Club chart the app finds.
- **Catalogue**: songs added by pasting a YouTube link (oEmbed) or by searching by name (YouTube Data API); a legacy import from the ministry's playlist; archive instead of delete when a song has history; title clean-up for review.
- **Lyrics (Sequência)**: a Word document attached to a song or to a medley item, parsed in the Worker (markers, emphasis, versions) and shown as written.
- **Service mode (Modo culto)**: a full-screen, offline view for the day of the Schedule that follows the chosen theme, fed by a bundle downloaded in the background; swipe, arrow keys or a foot pedal to move between items.
- **Suggestions**: any member proposes a song; others support it; the leader promotes it into a Schedule, keeps it or declines it.
- **Member view**: home with the next Schedule, song list with filters, profile with photo, Schedules in the year and consecutive weekends; a WhatsApp-ready text and a YouTube playlist per Schedule.
- **Access**: no passwords. Members enter by invite link; the Admin generates one link per member and a "forgot" page lists members who changed phones.
- **Admin**: members, roles, formations, songs to review, lyrics, invites and settings.
- **Notifications**: Web Push for "you were scheduled", "song added to your Schedule" (grouped, at most one push per hour per Schedule), "Schedule cancelled or moved" and a reminder at 10:00 the day before; editing a past Schedule never notifies anyone; each member can mute everything from the profile.

## Stack

Cloudflare Workers + D1 + Cron Triggers, with the static front end served by the same Worker (Workers Static Assets).

- Front end: Vite + React + TypeScript, `react-router`, `vite-plugin-pwa`, hand-written CSS with design tokens.
- API: Hono inside the Worker, routes under `/api/*`, cookie session.
- Database: D1 (SQLite), migrations in `migrations/`.
- Push: Web Push with VAPID written directly in the Worker on top of WebCrypto, no dependency.
- Tests: Vitest running inside the Workers runtime (`@cloudflare/vitest-pool-workers`) against a real D1, plus `happy-dom` for React components.

## Repository structure

| Folder | Contents |
| --- | --- |
| `src/` | React front end |
| `src/dominio/` | pure TypeScript domain, shared by front end and Worker |
| `src/semente/` | CSV readers and SQL generation for the initial load |
| `src/fumaca/` | the pure part of the smoke test (report and parsing of script output) |
| `src/letra/` | `.docx` lyrics extraction |
| `src/culto/` | service mode |
| `worker/` | Hono API, push triggers and the `scheduled` handler for the cron |
| `migrations/` | D1 SQL migrations |
| `seed/` | CSVs for the initial load |
| `scripts/` | TypeScript utilities run with `tsx` |
| `public/` | static assets and the `push.js` that is imported into the service worker |
| `docs/` | domain notes, ADRs, brand assets and build records (Portuguese) |
| `dist/` | front-end build, served by the Worker (git-ignored) |

Tests sit next to the code as `*.test.ts` and `*.test.tsx`.

## First-time setup

```sh
npm install
npm run vapid          # prints the three VAPID lines for .dev.vars
```

Create a `.dev.vars` file at the repository root and paste what `npm run vapid` printed:

```
VAPID_PUBLIC=...
VAPID_PRIVATE=...
VAPID_SUBJECT=mailto:you@example.com
YOUTUBE_API_KEY=...
```

`.dev.vars` is git-ignored. **Rotating the VAPID keys invalidates every existing push subscription**: anyone who had enabled notifications has to enable them again.

`YOUTUBE_API_KEY` is a **YouTube Data API v3** key, used only for the search-by-name flow when adding a song (pasting a link does not need it). Get one in the [Google Cloud console](https://console.cloud.google.com): create a project, enable the YouTube Data API v3 in the Library, create an API key under Credentials and restrict it to that API. The free quota is 10,000 units a day and each search costs 100, so **100 searches a day**. Without the key the app does not break: search-by-name answers asking for the link instead.

Then a single command:

```sh
npm run dev
```

`dev` applies the migrations, runs the seed, cleans up the titles pending review, builds the front end and serves the app at `http://localhost:8787` with a local D1. Migrations and seed are idempotent, so running it again duplicates nothing. To start with the demo Schedules, run `npm run db:seed -- --demo` once.

For front-end work with hot reload, run `npm run dev:front` (Vite on 5173, proxying `/api` and `/entrar` to 8787) with `npm run dev` running in another terminal.

## Entering the app for the first time

There are no passwords. Everyone enters through an invite link:

```sh
npm run convite -- "Gabriel"
```

The script inserts the invite straight into the local D1 and prints `http://localhost:8787/entrar/<token>`. Opening that link in the browser creates the session (a one-year cookie) and lands on `/instalar`. The invite does not expire and can be reopened on another device: each opening creates a new session.

After the first Admin exists, invites come from the UI: **Admin → Convites e acesso → Gerar link**, one per member. The `/esqueci` page lists members for whoever changed phones, and the Admin can turn that list off once everybody has the app installed.

## Seed

`npm run db:seed` is idempotent and loads:

- the 7 roles (vocal in the Vocal group; guitar, acoustic guitar, bass, drums and keys in Músicos; sound in Som);
- the members from `seed/membros.csv`, which starts with a single `Gabriel,guitarra,0,1` row;
- the "Banda" Formation, empty until someone fills it;
- the 102 songs from `seed/playlist.csv`, all flagged as legacy and marked for review.

The `funcoes` column accepts more than one role separated by `;` or `|` (`Marcos,"vocal;violão",1,0`), since the comma is the file separator. `ministro` and `admin` accept `1`, `sim` or `true`.

`npm run db:seed -- --demo` adds 3 past Schedules in August and 1 upcoming one with Team and Repertoire, using the prototype's names. It is meant for demos and is what the smoke test uses.

To start over (for example after `npm run smoke`, which leaves its test Schedules and Suggestions in the local database), delete the local D1 and run `dev` again:

```sh
rm -rf .wrangler/state/v3/d1
npm run dev
```

On PowerShell the equivalent of `rm -rf` is `Remove-Item -Recurse -Force .wrangler\state\v3\d1`.

## Adding members

Two ways, both valid:

1. **From the UI**, at `/admin/membros`: create, assign roles, mark leader and Admin. This is the everyday path.
2. **From the CSV**, editing `seed/membros.csv` and running `npm run db:seed` again. The seed derives the id from the name, so running it twice duplicates nobody.

Removing a member has two outcomes and the app picks one on its own: whoever never served in a past Schedule is actually deleted; whoever already served becomes **inactive**, disappearing from lists and future Teams and losing sessions, invites and push, but staying in past Schedules, because Executions are derived from the Team and deleting the member would rewrite history. "Bring back" undoes it.

## Commands

| Command | What it does |
| --- | --- |
| `npm run dev` | migrations, seed, title clean-up, front-end build and local Worker on port 8787 |
| `npm run dev:front` | Vite with hot reload, proxying `/api` and `/entrar` |
| `npm run build` | front-end build into `dist/` |
| `npm run check` | type check (`tsc -b`) |
| `npm test` | tests |
| `npm run db:migrate` | applies the migrations to the local D1 |
| `npm run db:seed` | loads roles, members and catalogue (`-- --demo` for sample data) |
| `npm run titulos` | cleans up the titles of songs pending review (`-- --remote` for the published database) |
| `npm run convite -- "Name"` | generates an invite link through the local database |
| `npm run letra -- "<file.docx>"` | prints how a lyrics Word file will be read |
| `npm run vapid` | generates a VAPID key pair and shows where to put it |
| `npm run smoke` | walks the whole app over HTTP against the local server |
| `npm run deploy` | publishes to Cloudflare (requires `wrangler login`) |

## The smoke test

`npm run smoke` is the proof that the app stands. It **deletes the local D1**, migrates, seeds with `--demo`, starts `wrangler dev` by itself, generates the first Admin's invite and walks over HTTP through:

- the nine scripts from the prototype (build the month, add by link, excerpt with timestamps, medley, promote a Suggestion, WhatsApp text, fix last Sunday, cancel, Schedule created one at a time);
- the member screens (home, songs with filters and search, Suggestions, profile) and the role gate;
- the Admin screens (members, roles, formations, songs to review, lyrics, invites and the "forgot" list);
- service mode and Suggestions with their states;
- Web Push end to end, against a fake push service that **decrypts** what the Worker sends, plus the cron through `/__scheduled`.

It needs three things before running: `npm run build` already done (the Worker serves `dist/`), `.dev.vars` with the VAPID keys, and internet access, because the scripts hit YouTube's real oEmbed. It kills any `wrangler dev` left behind and shuts down the one it started when it finishes. Every check prints one line; at the end comes the summary per group and the list of failures, and the process exits with code 1 if any failed.

## Publishing to Cloudflare

All of this is a human step, done once:

```sh
npx wrangler login
npx wrangler d1 create renovo-hub
```

`d1 create` prints a `database_id`. Put it in `wrangler.toml`:

```toml
[[d1_databases]]
binding = "DB"
database_name = "renovo-hub"
database_id = "<the id the command printed>"
migrations_dir = "migrations"
```

Then:

```sh
npx wrangler d1 migrations apply renovo-hub --remote
npx wrangler secret put VAPID_PUBLIC
npx wrangler secret put VAPID_PRIVATE
npx wrangler secret put VAPID_SUBJECT
npx wrangler secret put YOUTUBE_API_KEY
npm run deploy
```

`deploy` builds and publishes the Worker with the front end. The cron every 15 minutes (`[triggers]` in `wrangler.toml`) ships with it.

To load roles, members and the catalogue into the published database, generate the SQL by running the local seed once (it writes `.wrangler/tmp/semente.sql`) and apply it:

```sh
npm run db:seed
npx wrangler d1 execute renovo-hub --remote --file .wrangler/tmp/semente.sql
```

After that, generate the first invite from the Admin screen, or, if there is no Admin there yet, apply an invite `insert` through the same `d1 execute --remote`.

## Notifications

The catalogue is the one from the spec: "you were scheduled", "song added to your Schedule" (grouped, at most one push per hour per Schedule), "Schedule cancelled or moved" and the 10:00 reminder the day before. Editing a past Schedule never notifies anyone. Each member can mute everything from the profile, which keeps the subscription.

On iPhone, Web Push **only works with the app on the home screen**. That is why the enable-notifications button stays disabled until the app is installed, with the text explaining it. The path is: open the invite in Safari → Share → Add to Home Screen → open from the icon → Profile or `/instalar` → enable notifications → send a test push.

**Verification on a real device is still pending.** The whole path up to the push service is proven in the smoke test (`aes128gcm` body decrypted, VAPID JWT checked against the advertised key, dead subscription removed on 410, cron delivering), but against a fake service on the same machine. Installing on an iPhone or Android, allowing the notification and receiving the test push is the step only the device can close.

## Design notes

- **Zero cost as a constraint, not a goal.** Fifteen volunteers do not justify a monthly bill, so everything runs inside the Cloudflare free tier: one Worker serves API and static assets, D1 is the only database (attachments and member photos are stored as blobs in it), and the cron runs the reminders. There is no queue, no object storage and no third-party auth provider.
- **PWA on iOS.** The app only matters on the phone, and on iPhone Web Push requires the installed app. The onboarding is built around that: the invite link lands on an install page, the notification toggle is gated on standalone mode, and the service worker caches API responses so the Schedule opens without signal.
- **Push without dependencies.** VAPID signing (ES256 JWT) and the `aes128gcm` payload encryption are implemented on WebCrypto inside the Worker, which keeps the bundle small and avoids Node-only libraries. The smoke test runs a fake push service that decrypts what the Worker sends, so the protocol is tested end to end on every run.
- **History derived from the plan.** There is no attendance registry: a past Schedule, its Team and its Repertoire are the history. Fixing the past is editing the Schedule, silently. See ADR 0001.
- **Database columns and URLs stay in Portuguese.** They are the contract with the production D1 and with links already shared with members; the UI is in Brazilian Portuguese by design.

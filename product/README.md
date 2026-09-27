# Hangova — AI Trip Planning & Booking System

The working product described in the Review-1 presentation
*“AI Trip Planning & Booking System”*, built as the four modules the
presentation specifies, on the exact stack it lists.

> The 3D presentation site that already existed in this repository is untouched.
> It still runs from the repository root; this project lives in `product/`.

---

## What this is

| | |
|---|---|
**Live:** presentation at <https://manisaineeli.github.io/hangova> ·
source at <https://github.com/manisaineeli/hangova>

| | |
|---|---|
| **Front end** | React 19 + Vite, `product/frontend` |
| **Edge** | Spring Cloud Gateway, `product/backend/api-gateway` |
| **Backend** | Java 25 + Spring Boot 4.0.8, four microservices |
| **Database** | MongoDB (the presentation allows MongoDB **or** PostgreSQL) |
| **AI** | Google Gemini, with a built-in planner engine as fallback |
| **Live APIs** | Open-Meteo forecast + geocoding (no API key required) |
| **Auth** | Spring Security + JWT (HS256) |

```
React app  ──▶  API Gateway :8080  ──┬──▶  user-service    :8081   Module 1
                                      ├──▶  trip-service    :8082   Module 2
                                      ├──▶  booking-service :8083   Module 3
                                      └──▶  info-service    :8084   Module 4
```

Each service owns its own MongoDB database, so no module reaches into
another's collections.

| Service | Database | Module |
|---|---|---|
| user-service | `hangova_users` | 1 — User & Admin |
| trip-service | `hangova_trips` | 2 — AI Trip Planning |
| booking-service | `hangova_bookings` | 3 — Borrow & Booking |
| info-service | `hangova_info` | 4 — Travel Information |

---

## Public access

Two different things can be shared, and they work differently.

### 1. The presentation (already live)

**https://manisaineeli.github.io/hangova**

Static, hosted on GitHub Pages, published from the `gh-pages` branch. To
republish after changing `src/`:

```bat
publish-presentation.cmd
```

### 2. The application (needs a running host)

The app is a Spring Boot + MongoDB system, so a static host cannot run it. The
gateway serves the React bundle *and* the API on a single port, which is what
makes a one-URL deploy possible.

**Permanent, recommended — Render Blueprint.** `render.yaml` describes the whole
stack: the gateway, the three internal services and a free MongoDB.

1. Sign in at <https://render.com> with the GitHub account `manisaineeli`
2. Open <https://render.com/deploy?repo=https://github.com/manisaineeli/hangova>
3. Accept the plan. Five services plus a database are created.
4. Render prints a URL like `https://hangova.onrender.com` — that is the link to
   share.

Add `HANGOVA_GEMINI_API_KEY` on the `hangova-trip` service to enable AI-written
itineraries. Two caveats worth knowing before you demo: the free tier **sleeps
idle services**, so the first request after a pause can take up to a minute;
and free MongoDB **expires after 30 days**, after which data resets but the URL
keeps working. Set a real `HANGOVA_JWT_SECRET` on `hangova-user` and
`hangova` before exposing it.

**Temporary, for a quick demo — local tunnel.** With the stack running
locally:

```bat
public-link.cmd
```

This prints a `*.trycloudflare.com` URL that works while the tunnel and your
machine are both up. It is fine for a walkthrough and is **not** a permanent
address. Note that Cloudflare's anti-bot layer returns 403 to automated and
headless browsers, so a plain `curl` succeeds while a scripted browser does
not; open it in a normal browser.

#### Before you share any link

The seeded accounts are `admin@hangova.ai / admin123` and
`demo@hangova.ai / demo123`, and the JWT secret defaults to a value that is in
the public repository. On a public URL, change the admin password (Profile →
Password) and set a real `HANGOVA_JWT_SECRET` first. Anyone who can reach the
site can otherwise sign in as an administrator.

## Running it locally

Prerequisites: **Java 25**, **Node 24**, **MongoDB** on `localhost:27017`.
Maven is not required to be installed — a copy lives in
`%TEMP%\opencode\tools\apache-maven-3.9.11`.

```bat
cd product
start-all.cmd          :: backend + front end, then prints the URLs
```

Or step by step:

```bat
start-services.cmd      :: five Spring Boot services
start-frontend.cmd      :: Vite dev server on :5174
health.cmd              :: confirms all five services are UP
restart.cmd             :: stop, rebuild, start
stop-services.cmd       :: stop only
```

Open **http://localhost:5174**.

| Account | Email | Password |
|---|---|---|
| Administrator | `admin@hangova.ai` | `admin123` |
| Traveller | `demo@hangova.ai` | `demo123` |

The administrator is the **nominee** who approves travel loans.

### Enabling Gemini (optional)

The planner works out of the box using a curated destination engine. To have
Gemini write the itineraries instead, set a key and restart `trip-service`:

```bat
set HANGOVA_GEMINI_API_KEY=your-key-here
```

`GET /api/weather/status` always reports which providers are live. If the key is
missing, invalid or the call fails, the request falls back to the built-in
planner and says so in `generatedBy` and `aiNote` — a trip request never fails
because of the AI.

---

## Feature map — presentation slide → implementation

### Module 1 · User & Admin (`user-service`)

| Presentation | Where |
|---|---|
| User registration and login | `POST /api/auth/register`, `POST /api/auth/login` |
| JWT-based authentication | Issued here, validated at the gateway (`SecurityConfig`, `JwtTokenService`) |
| User and Admin profiles | `GET/PUT /api/users/me` |
| Store user and admin data | MongoDB `hangova_users` |
| Secure data management | BCrypt hashing, role checks, gateway-stripped identity headers |

### Module 2 · AI Trip Planning (`trip-service`)

| Presentation | Where |
|---|---|
| Destination, budget and duration input | `POST /api/trips/plan` |
| AI-generated day-wise itinerary | `GeminiService`, falling back to `OfflinePlanner` |
| Tourist place recommendations | `places[]` on the trip, drawn from the curated catalogue |
| Activity recommendations | `activities[]`, ranked against the traveller's interests |
| Budget-based suggestions | `budgetTips[]`, generated from the stay tier and real figures |
| Personalised trip planning | Interests plus the saved profile drive ordering and costs |
| Weather information | `GET /api/weather` — live via Open-Meteo, seasonal estimate otherwise |

Ten destinations are hand-curated (Manali, Goa, Jaipur, Ranthambore, Munnar,
Port Blair, Coorg, Varanasi, Hampi, Rishikesh) with real entry costs, opening
context and activities. Any other place is resolved through live geocoding, and
a state name such as “Kerala” resolves to that state's best base.

### Module 3 · Borrow & Booking (`booking-service`)

| Presentation | Where |
|---|---|
| Hotel recommendations | `GET /api/hotels` |
| Flight / train / bus information | `GET /api/transport` |
| Borrowing money option | `POST /api/borrow/apply` |
| Weather information | `GET /api/availability/weather` — delegated to `trip-service` |
| Booking and cancellation | `POST /api/bookings`, `POST /api/bookings/{id}/cancel` |
| Booking history | `GET /api/bookings`, `GET /api/bookings/summary` |

The loan flow is **apply → admin approves → admin disburses**, and an approved
loan can then pay for a booking. Cancellation computes a real refund from the
policy: full inside 72 hours, 50% inside 24 hours, nothing on the day.

### Module 4 · Travel Information (`info-service`)

| Presentation | Where |
|---|---|
| View and modify trip plans | `GET /api/info/trips`, `PUT /api/info/trips/{id}` |
| Booking history | `GET /api/info/bookings` |
| Expense summary | `GET /api/info/expenses/summary` |
| Save and update itineraries | Trip writes are proxied to `trip-service` |
| Manage users and destinations | `GET /api/users/admin`, `PUT /api/trips/destinations/{id}` |
| Monitor bookings | `GET /api/admin/bookings` |
| Summarised trip data | `GET /api/admin/overview`, `GET /api/admin/activity` |

`info-service` reads trips and bookings from the other services rather than
duplicating them, and owns expenses plus the audit log.

---

## The interface

React front end, no UI framework.

**Immersive 3D.** A single persistent WebGL layer renders one of five nature
biomes — coast, forest, waterfall, peaks, dunes — and the biome follows the
traveller: their saved interests pick the ambient scene, and a trip's
destination state picks the scene in the hero and on the trip page. The
pointer parallaxes the camera, the ocean and falls animate on the GPU, and
mist, motes and sand drift in real time.

**Animation.** `framer-motion` drives page transitions, staggered reveals,
count-up statistics, animated budget bars, tilt-on-hover cards and magnetic
buttons. Everything respects `prefers-reduced-motion`.

**Rendering budget.** Two WebGL contexts at most: the ambient layer and the
hero. The ambient layer is sky-and-light only, heavily blurred, so a close-up
tree trunk can never read as a UI artefact. Destination cards in a grid use
`BiomeArt` — vector scenery in the same palette — because a list of six WebGL
contexts exhausts the browser's context budget and stalls the GPU.

**Build.** `three.js` is split into its own long-cached chunk; the app shell is
about 114 kB and paints before the 3D arrives.

---

## Tests

Backend, against a running stack:

```powershell
powershell -File tools\test-module1.ps1        # 20 checks, Module 1
powershell -File tools\test-modules234.ps1     # 57 checks, Modules 2-4
```

Front end, driven through real Chrome:

```bat
node tools\ui-shots.mjs     # walks all screens, screenshots to %TEMP%\opencode\shots
node tools\ui-test.mjs      # same walk, asserting behaviour
```

Current state: **77/77 backend checks pass, 0 console errors across 18 screens.**

---

## Layout

```
product/
├─ backend/
│  ├─ pom.xml                    parent POM
│  ├─ api-gateway/               :8080  routes, JWT validation, identity headers
│  ├─ user-service/              :8081  Module 1
│  ├─ trip-service/              :8082  Module 2
│  ├─ booking-service/           :8083  Module 3
│  └─ info-service/              :8084  Module 4
├─ frontend/
│  ├─ src/three/                 biome definitions, scenes, sky dome, vector art
│  ├─ src/components/            destination cards, shared UI
│  ├─ src/pages/                 one screen per feature area
│  ├─ src/motion.jsx             animation primitives
│  └─ src/styles.css             glass design system
├─ start-all.cmd                 start everything
├─ restart.cmd                   stop, rebuild, start
├─ start-services.cmd
├─ start-frontend.cmd
├─ health.ps1 / health.cmd
└─ stop-services.ps1
```

---

## Notes on two decisions

**MongoDB over PostgreSQL.** The presentation lists “MongoDB or PostgreSQL”.
PostgreSQL 17 is installed here but its superuser password is unknown and the
service cannot be restarted without administrator rights, so connecting to it
was not possible. MongoDB was already running and reachable, so the project
uses it. The choice is per-service configuration (`spring.data.mongodb.uri`),
so switching to PostgreSQL means changing the driver and the repository
interfaces, not the design.

**Trust boundary.** Only the gateway is exposed. It validates the JWT and
replaces any client-supplied `X-User-*` header with the verified identity
before forwarding. The services read that identity and apply their own
ownership and role checks. Every service binds to localhost, so this is a
sound boundary for a single-host deployment; if the services were ever exposed
directly, each would need to verify the JWT itself.

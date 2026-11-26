# Roamstead

**Go further. Stay somewhere worth it.**

Roamstead is a hotel booking portal built with **Spring Boot (Java 17)**, **Angular 18** and **MySQL 8**. Guests can browse hotels, search by location and dates, see live availability and the exact total before confirming, book a room, and later find or cancel the booking with its reference and email.

The extra feature is **Flex Dates**. Each hotel page shows how many rooms are left on each night. When the chosen dates are full, Roamstead suggests the nearest stays of the same length that still have a room, with their prices.

| Document | What it covers |
|---|---|
| [`SETUP_GUIDE.md`](SETUP_GUIDE.md) | Full step-by-step installation, configuration and troubleshooting |
| [`DESIGN.md`](DESIGN.md) | Architecture, database, API, booking logic, decisions, concurrency, Flex Dates, limitations |
| [`docs/screenshots/`](docs/screenshots/) | Screenshots of the main flow |

---

## Features

**Core flow**
- Browse six sample hotels with name, location, description, amenities, photos and price per night
- Search by city, region or hotel name, with check-in and check-out dates
- Hotel page with a photo gallery slider, amenities, the room, and how many rooms are left for the chosen dates
- Book one room with a name and email. The total is calculated by the backend and shown before confirming
- Confirmation page with a unique reference (for example `RS-K7Q4M9PX`), a copy button and an *Add to calendar* (.ics) download
- **My trip** page: look up a booking by reference and email, then cancel it. Cancelling frees the room for those nights

**Booking rules (enforced on the server)**
- Check-in cannot be in the past, and check-out must be after check-in (max 30 nights, max 365 days ahead)
- Availability is tracked per night, and a booking can never exceed the number of rooms
- Two guests competing for the last room cannot both get it (atomic conditional update, see `DESIGN.md` section 6)
- All errors use the same JSON shape with a code your code can check and a message a guest can read

**Surprise feature: Flex Dates**
- A 28-night availability calendar on each hotel page, colour-coded: plenty, 1–2 left, full
- Tap a night to set check-in, then tap another to set check-out
- If the dates are full: the 4 closest alternatives within ±7 days, each with rooms left and total price, one tap to switch

**UI**
- Responsive from 360 px phones to wide desktops
- "Roamstead" visual theme: forest green and lime on warm cream, Syne + Outfit typefaces, 2px ink outlines and solid offset shadows. Solid colours, square corners, no gradients
- Split hero with a wipe-transition image slider and progress bar, scrolling city marquee, sliding card rails, swipeable gallery with thumbnails, scroll-reveal and press/hover micro-animations
- Respects `prefers-reduced-motion`

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | Angular 18 (standalone components, signals, reactive forms), SCSS |
| Backend | Java 17, Spring Boot 3.3 (Web, Data JPA, Validation), Flyway |
| Database | MySQL 8.0.16+ |
| Tests | JUnit 5, Mockito, AssertJ, Spring MockMvc, H2 (MySQL mode) for integration tests |

---

## Prerequisites

| Tool | Version | Check |
|---|---|---|
| JDK | 17 or newer | `java -version` |
| Maven | 3.9+ | `mvn -v` |
| Node.js | 18.19+ / 20.11+ / 22 | `node -v` |
| npm | 9+ | `npm -v` |
| MySQL Server | 8.0.16+ | `mysql --version` |

---

## Run locally

> The short version is below. [`SETUP_GUIDE.md`](SETUP_GUIDE.md) explains every step in more detail, with Windows commands and troubleshooting.

### 1. Clone

```bash
git clone https://github.com/<your-username>/roamstead.git
cd roamstead
```

### 2. Create the database and user

```bash
mysql -u root -p < database/00_create_database.sql
```

This creates the `roamstead` database and a `roamstead_app` user. Change the password in the script first if you like. **Tables and sample data are created automatically by Flyway** the first time the backend starts.

### 3. Start the backend (port 8080)

macOS / Linux:
```bash
cd backend
export DB_USERNAME=roamstead_app
export DB_PASSWORD=change-me
mvn spring-boot:run
```

Windows PowerShell:
```powershell
cd backend
$env:DB_USERNAME="roamstead_app"
$env:DB_PASSWORD="change-me"
mvn spring-boot:run
```

Check it: <http://localhost:8080/api/hotels> should return six hotels.

### 4. Start the frontend (port 4200)

```bash
cd frontend
npm install
npm start
```

Open <http://localhost:4200>. The dev server forwards `/api` calls to the backend, so no CORS setup is needed.

### 5. Run the tests

```bash
cd backend
mvn test
```

The tests do **not** need MySQL. Unit tests use mocks, and the integration test runs the real Flyway migrations on an in-memory H2 database in MySQL mode.

---

## Try the main flow

1. On the home page, search **Udaipur** with check-in a week from today for 2 nights.
2. Open **Lakeshore Mahal**. It has only 2 rooms, so it fills up quickly. The panel shows `₹14,800 × 2 nights = ₹29,600`.
3. **Continue to book**, enter a name and email, review, and **Confirm booking**. Note the reference.
4. Book the same dates again with another email. Now try a third time: the hotel shows *Sold out* and **Flex Dates** offers the nearest free dates.
5. Go to **My trip**, enter a reference and email, and **Cancel booking**. The room is available again for those nights.

---

## Project structure

```
roamstead/
├── backend/                         Spring Boot API
│   ├── src/main/java/com/roamstead/
│   │   ├── config/                  Typed settings, CORS, clock
│   │   ├── domain/                  JPA entities (Hotel, RoomType, RoomInventory, Booking)
│   │   ├── dto/                     Request/response records
│   │   ├── exception/               Error types + global handler (one JSON error shape)
│   │   ├── repository/              Spring Data repositories (incl. atomic inventory updates)
│   │   ├── service/                 Business rules: dates, pricing, availability, booking, Flex Dates
│   │   └── web/                     REST controllers
│   ├── src/main/resources/
│   │   ├── application.yml          No secrets: reads env vars
│   │   └── db/migration/            Flyway: V1 schema, V2 sample data
│   └── src/test/                    Unit + integration tests
├── frontend/                        Angular app
│   └── src/app/
│       ├── core/                    API client, models, error interceptor, date helpers
│       ├── layout/                  Header, footer
│       ├── shared/                  Search bar, sliders, cards, pipes, directives
│       └── pages/                   home, results, hotel-detail, booking, confirmation, manage
├── database/                        Plain SQL copies of the schema + seed data
├── docs/screenshots/                Main-flow screenshots
├── .env.example                     Template for local credentials (real .env is git-ignored)
├── README.md
├── DESIGN.md
└── SETUP_GUIDE.md
```

---

## API at a glance

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/hotels?location=&checkIn=&checkOut=` | Browse or search; with dates adds rooms left and stay total |
| GET | `/api/hotels/locations` | Cities for search suggestions |
| GET | `/api/hotels/{id}?checkIn=&checkOut=` | Hotel details and room availability |
| GET | `/api/hotels/{id}/quote?checkIn=&checkOut=` | Server-calculated price + availability before confirming |
| GET | `/api/hotels/{id}/calendar?from=&days=` | Flex Dates: rooms left per night |
| GET | `/api/hotels/{id}/flex-dates?checkIn=&checkOut=` | Flex Dates: nearest alternative stays |
| POST | `/api/bookings` | Book one room → `201` with reference |
| GET | `/api/bookings/{reference}?email=` | Find a booking |
| POST | `/api/bookings/{reference}/cancel` | Cancel a booking (`{ "email": "..." }`) |

Full request/response examples are in [`DESIGN.md`](DESIGN.md#3-api-design).

---

## Secrets

No credentials are stored in the repository. `application.yml` reads `DB_USERNAME` and `DB_PASSWORD` from the environment. You can also use a git-ignored `backend/application-local.yml` (see `backend/application-local.yml.example`). `.env` files are git-ignored too, and only `.env.example` with placeholder values is committed.

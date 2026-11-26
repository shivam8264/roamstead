# Roamstead: design write-up

This document explains how Roamstead is built and why. It follows the eight topics in the brief:

1. [Architecture](#1-architecture)
2. [Database design](#2-database-design)
3. [API design](#3-api-design)
4. [Booking logic](#4-booking-logic)
5. [Design decisions](#5-design-decisions)
6. [Simultaneous bookings](#6-simultaneous-bookings)
7. [Surprise feature: Flex Dates](#7-surprise-feature-flex-dates)
8. [Limitations and improvements](#8-limitations-and-improvements)

[Assumptions](#assumptions) are listed at the end, including how overlapping stays are handled.

---

## 1. Architecture

```
┌─────────────────────────┐   HTTP/JSON    ┌──────────────────────────────────────────┐   JDBC   ┌──────────┐
│  Angular 18 SPA         │ ─────────────▶ │  Spring Boot API                         │ ───────▶ │ MySQL 8  │
│                         │   /api/...     │                                          │          │          │
│  pages/  (routed views) │ ◀───────────── │  web/        controllers (HTTP only)     │          │ hotel    │
│  shared/ (UI pieces)    │                │  service/    business rules              │          │ room_type│
│  core/   ApiService,    │                │  repository/ Spring Data + atomic SQL    │          │ room_    │
│          interceptor    │                │  domain/     JPA entities                │          │ inventory│
└─────────────────────────┘                │  exception/  one error shape             │          │ booking  │
     dev: ng serve proxy                   └──────────────────────────────────────────┘          └──────────┘
     /api → localhost:8080                          Flyway creates schema + seed on startup
```

**Frontend.** The frontend is a single-page Angular app built from standalone components. Each page is lazy-loaded. All HTTP calls go through one `ApiService`, so components never build URLs. An HTTP interceptor turns every failure into the same `ApiError` object (`code`, `message`, `fieldErrors`), and pages show `error.message` directly. The browser never calculates a price. It only displays the amount the backend returns.

**Backend.** The backend is a layered Spring Boot application:

| Layer | Responsibility | Example |
|---|---|---|
| `web` | HTTP mapping, status codes, request validation (`@Valid`) | `BookingController` returns `201 Created` + `Location` |
| `service` | All business rules and transactions | `BookingService.create`, `StayDatesValidator`, `PricingService` |
| `repository` | Data access, including the atomic inventory updates | `RoomInventoryRepository.reserveNights` |
| `domain` | JPA entities that map 1:1 to tables | `Booking`, `RoomInventory` |
| `exception` | Typed errors and the global handler | `Errors.RoomUnavailable` → `409 ROOM_UNAVAILABLE` |

**Database.** MySQL stores hotels, rooms, the per-night inventory and bookings. Flyway owns the schema. `V1__create_schema.sql` and `V2__seed_hotels.sql` run automatically on first start, and Hibernate is set to `ddl-auto: none` so it never changes tables.

**Request flow for a booking:**
`POST /api/bookings` → bean validation on the body → `StayDatesValidator` (date rules) → resolve the hotel's room → `AvailabilityService.ensureNights` (create missing per-night rows) → `AvailabilityService.reserve` (atomic +1 on every night, or fail) → `PricingService.total` → generate the reference → save the `Booking` → `201` with the booking.

---

## 2. Database design

### Entity relationships

```
hotel 1 ──── * hotel_amenity          (amenity names)
hotel 1 ──── * hotel_image            (ordered gallery)
hotel 1 ──── * room_type              (one category per hotel in the sample data)
room_type 1 ── * room_inventory       (one row per night that has ever been booked)
room_type 1 ── * booking
hotel 1 ──── * booking                (denormalised for simple lookups)
```

### Tables

| Table | Key columns | Notes |
|---|---|---|
| `hotel` | `id`, `name`, `city`, `region`, `address`, `tagline`, `description`, `star_rating`, `cover_image` | `UNIQUE(name, city)`, `CHECK star_rating 1–5`, index on `city` |
| `hotel_amenity` | `(hotel_id, amenity)` PK | No duplicate amenity per hotel |
| `hotel_image` | `(hotel_id, position)` PK, `url` | `position` keeps gallery order |
| `room_type` | `id`, `hotel_id`, `name`, `price_per_night DECIMAL(10,2)`, `total_rooms`, `max_guests`, `bed_type`, `size_sqm` | `CHECK price > 0`, `CHECK total_rooms > 0`, `UNIQUE(hotel_id, name)` |
| `room_inventory` | `id`, `room_type_id`, `stay_date`, `total_rooms`, `booked_rooms` | **`UNIQUE(room_type_id, stay_date)`**, **`CHECK 0 ≤ booked_rooms ≤ total_rooms`** |
| `booking` | `id`, **`reference` UNIQUE**, `hotel_id`, `room_type_id`, `guest_name`, `guest_email`, `check_in`, `check_out`, `nights`, `price_per_night`, `total_amount`, `status`, `created_at`, `cancelled_at` | `CHECK check_out > check_in`, `CHECK nights > 0`, `CHECK status IN ('CONFIRMED','CANCELLED')`, indexes on `guest_email` and `(room_type_id, check_in, check_out)` |

### Important constraints and why

- **`room_inventory` unique per room type and night.** Each night has exactly one counter, which is what makes the atomic update in section 6 safe.
- **`CHECK (booked_rooms <= total_rooms)`.** If application code ever had a bug, the database still refuses to overbook. The rule is enforced in two places.
- **Price snapshot on `booking`.** `price_per_night` and `total_amount` are copied at booking time, so a later price change never changes an existing booking.
- **`booking.reference` unique.** References are random (see section 4), and the unique key catches the extremely unlikely collision.
- **Money as `DECIMAL`, never floating point.** All amounts use `BigDecimal` in Java and `DECIMAL` in MySQL.
- **Status as a `VARCHAR` + `CHECK`** rather than a MySQL `ENUM`. This makes it easier to add a state later (for example `NO_SHOW`).

### Sample data

Six hotels (Jaipur, Goa, Manali, Mumbai, Alleppey, Udaipur), each with one room category, 4–6 amenities and a 3-photo gallery. Room counts range from 2 to 8, so capacity is easy to reach while testing. **Lakeshore Mahal** (Udaipur) has only 2 rooms.

---

## 3. API design

Base path: `/api`. All bodies are JSON and all dates are ISO `YYYY-MM-DD`.

### Hotels

| Method & path | Purpose | Success |
|---|---|---|
| `GET /hotels?location=&checkIn=&checkOut=` | List or search hotels. `location` matches city, region or name (case-insensitive). If both dates are given, each result includes `availableRooms`, `nights` and `stayTotal`. | `200 HotelSummary[]` |
| `GET /hotels/locations` | Distinct cities for the search suggestions | `200 string[]` |
| `GET /hotels/{id}?checkIn=&checkOut=` | Hotel details: gallery, amenities, rooms (with `availableRooms` if dates are given) | `200 HotelDetail` |
| `GET /hotels/{id}/quote?checkIn=&checkOut=` | Price and availability before confirming. Nothing is reserved. | `200 Quote` |
| `GET /hotels/{id}/calendar?from=&days=28` | Flex Dates: rooms left per night (1–62 days, never before today) | `200 Calendar` |
| `GET /hotels/{id}/flex-dates?checkIn=&checkOut=` | Flex Dates: up to 4 nearest same-length stays with a room | `200 FlexDates` |

### Bookings

| Method & path | Purpose | Success |
|---|---|---|
| `POST /bookings` | Book one room | `201 Booking` + `Location` header |
| `GET /bookings/{reference}?email=` | Find a booking (reference and email must both match) | `200 Booking` |
| `POST /bookings/{reference}/cancel` body `{ "email": "..." }` | Cancel and free the nights | `200 Booking` |

**Example: create a booking**

```http
POST /api/bookings
Content-Type: application/json

{ "hotelId": 6, "checkIn": "2026-12-10", "checkOut": "2026-12-12",
  "guestName": "Ananya Sharma", "guestEmail": "ananya@example.com" }
```
```json
201 Created
{
  "reference": "RS-K7Q4M9PX", "status": "CONFIRMED",
  "hotelId": 6, "hotelName": "Lakeshore Mahal", "roomTypeName": "Jharokha Lake Suite",
  "guestName": "Ananya Sharma", "guestEmail": "ananya@example.com",
  "checkIn": "2026-12-10", "checkOut": "2026-12-12", "nights": 2,
  "pricePerNight": 14800.00, "totalAmount": 29600.00,
  "createdAt": "2026-11-24T10:15:02", "cancelledAt": null, "cancellable": true
}
```

The client never sends a price. `roomTypeId` is optional and defaults to the hotel's only category.

### One error shape

Every failure, whether validation, a business rule or an unexpected error, returns:

```json
{
  "timestamp": "2026-11-24T04:45:10Z",
  "status": 409,
  "error": "Conflict",
  "code": "ROOM_UNAVAILABLE",
  "message": "Sorry, there are no rooms left for every night of this stay. Try one of the nearby dates instead.",
  "path": "/api/bookings"
}
```

| HTTP | `code` | When |
|---|---|---|
| 400 | `VALIDATION_FAILED` | Body fields invalid; `fieldErrors: [{field, message}]` lists each one |
| 400 | `INVALID_DATES` | Past check-in, check-out not after check-in, > 30 nights, > 365 days ahead, or only one date given |
| 400 | `INVALID_PARAMETER` / `MISSING_PARAMETER` / `MALFORMED_REQUEST` | Bad date format, missing query parameter, unreadable JSON |
| 404 | `NOT_FOUND` | Unknown hotel, or reference/email do not match |
| 409 | `ROOM_UNAVAILABLE` | At least one night of the stay is full |
| 409 | `ALREADY_CANCELLED` | Cancelling twice |
| 409 | `CANCELLATION_CLOSED` | Check-in date has already passed |
| 409 | `CONCURRENT_UPDATE` | Database lock timeout under heavy contention; safe to retry |
| 500 | `INTERNAL_ERROR` | Anything unexpected (details are logged, never returned) |

`code` is stable for code to check, and `message` is written for guests. The frontend shows `message` as-is and uses `code` for special handling, for example offering Flex Dates on `ROOM_UNAVAILABLE`.

---

## 4. Booking logic

### Date validation (`StayDatesValidator`)
One class handles date validation for search, quote, calendar, Flex Dates and booking, so the rules cannot drift between endpoints:

- both dates required (search may omit both to just browse, but not only one)
- `checkIn >= today`, where *today* comes from an injected `Clock` in the hotel time zone (`Asia/Kolkata`, configurable)
- `checkOut > checkIn`
- at most **30 nights**, check-in at most **365 days ahead** (configurable in `application.yml`)

The Angular app checks the same rules for instant feedback, but the backend is the source of truth.

### Pricing (`PricingService`)
`nights = DAYS.between(checkIn, checkOut)` and `total = pricePerNight × nights`, rounded to 2 decimal places with `HALF_UP`, using `BigDecimal` throughout. The same method produces the quote the guest sees and the amount stored on the booking. The price per night is copied onto the booking.

### Availability (`AvailabilityService`)
Availability is tracked **per night** in `room_inventory`:

- A stay covers the half-open range **[checkIn, checkOut)**. A 10→12 December stay uses the nights of the 10th and the 11th.
- **Rooms free for a stay = the minimum free rooms across its nights.** One full night means the stay is unavailable.
- Rows are created lazily. A night with no row has nothing booked, so all `room_type.total_rooms` are free. This avoids pre-filling a year of rows for every hotel.

**To book:**
1. `ensureNights` runs `INSERT IGNORE` for each night of the stay in its own short transaction, so rows exist before the booking transaction starts.
2. `reserve` runs a single statement:
   ```sql
   UPDATE room_inventory SET booked_rooms = booked_rooms + 1
   WHERE room_type_id = ? AND stay_date >= :checkIn AND stay_date < :checkOut
     AND booked_rooms < total_rooms
   ```
3. If the number of updated rows is **less than the number of nights**, some night was full. The service throws `RoomUnavailable`, and the transaction rolls back, including the nights that were taken.
4. Otherwise the reference is generated and the booking is saved **in the same transaction**. The inventory change and the booking are committed together or not at all.

### Booking reference (`ReferenceGenerator`)
`RS-` plus 8 characters from `SecureRandom`, using an alphabet without look-alike characters (no `0/O`, `1/I/L`). That gives about 852 billion combinations, so references cannot be guessed. Uniqueness is checked before saving and backed by the unique key.

### Lookup and cancellation
- Lookup needs both **reference and email** (case-insensitive, whitespace-trimmed). A wrong email gets exactly the same `404` as a wrong reference, so the API never reveals which references exist.
- Cancelling loads the booking with `SELECT … FOR UPDATE` (pessimistic row lock), so two simultaneous cancel clicks cannot both free the nights.
- Rules: already cancelled → `409 ALREADY_CANCELLED`. Check-in date already passed → `409 CANCELLATION_CLOSED`. Otherwise run `booked_rooms - 1` on every night of the stay, set `status = CANCELLED` and `cancelled_at`, all in one transaction.
- Cancelled bookings are kept (soft state), not deleted, so there is a history.

---

## 5. Design decisions

| Decision | Alternatives considered | Why this one / trade-off |
|---|---|---|
| **Per-night inventory table** with a counter | (a) Count overlapping bookings at query time; (b) one row per physical room per night | (a) is simple but needs a lock on the whole room type to be correct under concurrency, and gets slower as bookings grow. (b) is needed only when assigning specific rooms. A counter per night is easy to read, easy to lock row-by-row, and the calendar feature reads it directly. Cost: one extra table to keep in step, which is handled inside the booking transaction. |
| **Atomic conditional `UPDATE`** to reserve | Optimistic locking with `@Version`; `SELECT … FOR UPDATE` then check | One statement checks and changes together, and needs no retry loop. Optimistic locking would make one of two competing guests retry even when there were rooms for both. |
| **Lazy inventory rows** (`INSERT IGNORE`) | Pre-generate rows for 365 days per room type | No nightly job and no wasted rows. The `INSERT` runs in its own small transaction so the booking transaction only locks rows that already exist. |
| **Server-side quote endpoint** | Calculate the total in Angular | The brief requires backend calculation. One `PricingService` means the shown amount and the stored amount always match. |
| **Flyway migrations** | `ddl-auto: update`, manual scripts | Repeatable, versioned schema and seed data. `database/` also has plain SQL copies for reviewers. |
| **Layered packages** (`web/service/repository/domain`) | Package-by-feature | The project is small, and layers make responsibilities obvious to a reviewer. Package-by-feature would scale better for a larger team. |
| **Records for DTOs** | Expose entities directly | Entities never leave the service layer, so no lazy-loading surprises in JSON and no leaking internal fields. |
| **Reference + email** for lookup instead of accounts | Login / JWT | Authentication is out of scope. Two factors plus a random, unguessable reference give reasonable privacy. |
| **Same error shape everywhere** | Spring's default error JSON | The frontend handles every failure with the same code, and messages are written for guests. |
| **Signals + standalone components** (Angular 18) | NgModules, NgRx | Less boilerplate for an app of this size. There is little shared state (only the just-made booking, held in a small service). |
| **Booking state not in URL** | Put email in confirmation URL | Avoids leaking an email in browser history or logs. A refresh on the confirmation page sends the guest to the lookup form. |
| **Pay at hotel** (no payment step) | Payment gateway | Out of scope. The UI says plainly that nothing is charged online. |

---

## 6. Simultaneous bookings

**Scenario:** Lakeshore Mahal has 1 room left for 10–12 December. Guest A and Guest B press *Confirm* at the same moment.

**What happens:**

1. Both requests run `ensureNights`. The rows already exist, so `INSERT IGNORE` does nothing.
2. Both run the conditional `UPDATE … SET booked_rooms = booked_rooms + 1 WHERE … AND booked_rooms < total_rooms`.
3. InnoDB takes an **exclusive row lock** on each night row it updates. Say A gets there first: A's update matches both nights (`1 < 2`) and holds the locks.
4. B's update **waits** on the same rows. When A commits, MySQL re-reads the rows (an UPDATE always reads the latest committed version). Now `booked_rooms = 2`, so `2 < 2` is false and B updates **0 rows**.
5. B's service sees `0 ≠ 2 nights` and throws `RoomUnavailable`. B's transaction rolls back and B gets `409 ROOM_UNAVAILABLE`. The UI says the room was just taken and offers Flex Dates.

**Why this is safe:**
- Checking and changing happen in **one SQL statement**, so there is no gap between "is there a room?" and "take it" for another request to slip into.
- Partial success is impossible. If one night of a multi-night stay is full, the earlier nights updated in the same transaction are rolled back.
- **Deadlocks are avoided** because every booking locks night rows in the same order (ascending `stay_date` through the unique index).
- **A second safeguard in the database:** `CHECK (booked_rooms <= total_rooms)` rejects overbooking even if the application logic were wrong.
- If lock waits time out under extreme load, the API returns `409 CONCURRENT_UPDATE` ("please try again"), never a wrong booking.

**Proof in the tests:** `BookingFlowIntegrationTest.concurrentBookingsNeverOversell` starts **10 threads** that try to book the same 2-room hotel for the same nights at the same moment. It asserts that **exactly 2 succeed** and 0 rooms are left.

**How it could scale further:** for very high contention (flash sales), use a short-lived **hold** (`PENDING` booking with an expiry, released by a scheduled job) or a queue per room type. Idempotency keys on `POST /bookings` would also protect against double-clicks and network retries.

---

## 7. Surprise feature: Flex Dates

### What it does
- **Live availability calendar.** Each hotel page shows the next 28 nights (pageable in 14-day steps) colour-coded as *plenty*, *1–2 left* or *full*, with the exact number of rooms left. Guests can tap a night to set check-in and another to set check-out, without a date picker.
- **Closest alternatives.** For the selected dates, Roamstead finds stays of **the same length** within **±7 days** that still have a room on every night. It ranks them by closeness (1 day earlier, 1 day later, 2 days earlier…) and shows up to 4 with rooms left and the total price. One tap applies them and refreshes the quote.
- When the chosen dates are full, the panel says so and points to the suggestions. The results list shows *See nearby dates* instead of a dead button, and a booking that loses a race links straight to them.

### Why I chose it
Sold-out dates are the biggest dead end in hotel booking. Guests usually have some flexibility but cannot see it, so they go back and try dates one at a time. Flex Dates shows that flexibility directly. It also builds on the per-night inventory model rather than being added on top, and it stays small: two read-only endpoints and one component.

### How it works
- **Backend:** `FlexDateService`
  - `calendar(hotelId, from, days)` reads `room_inventory` once for the range and fills in nights with no row as fully free.
  - `suggest(hotelId, checkIn, checkOut)` validates the dates, reads **one** calendar slice covering every candidate (`max(today, checkIn−7)` to `checkIn+7+nights`), and slides a window of `nights` across it. Each candidate's availability is the minimum over its window, so the whole search takes one query.
  - Candidates in the past or beyond the booking window are skipped. Totals use the same `PricingService`.
  - Window size and number of suggestions are configurable (`roamstead.flex.*`).
- **Frontend:** `FlexDatesComponent` renders the calendar and suggestions and emits the chosen range. `HotelDetailComponent` applies it, updates the URL query parameters (so the link can be shared) and fetches a fresh server quote.
- **Tests:** `FlexDateServiceTest` checks ranking, skipping of past dates and the sliding-window minimum. The integration test checks suggestions when a stay is sold out.

A small extra on the confirmation page: **Add to calendar** downloads an `.ics` file for the stay.

---

## 8. Limitations and improvements

**Current limitations**
- **One room per booking, one room category per hotel** (as the brief allows). The model already supports several room types per hotel.
- **No guest count / occupancy filter.** `max_guests` is shown but not used in search.
- **No authentication.** Lookup relies on reference + email. A real system would add accounts or emailed magic links, plus rate limiting on lookup to stop guessing.
- **No emails are sent.** The confirmation exists only on screen and as an `.ics` download.
- **No payments.** Guests pay at the hotel.
- **Flat pricing.** No weekend or seasonal rates, taxes or discounts.
- **No admin panel.** Hotels and prices come from migrations.
- **Hotel photos are linked from Unsplash.** If they cannot load, the UI shows solid colour tiles with the hotel's initials.
- **Changing `room_type.total_rooms` later** does not update existing inventory rows (they keep their snapshot). An admin feature would need to adjust these in a migration.

**What I would do with more time**
1. Rate-limit and add CAPTCHA to booking lookup. Send a confirmation email with a signed manage link.
2. Prices that vary by date (a `rate` table per night), with taxes shown as a separate line.
3. Several rooms per booking and an occupancy filter.
4. Idempotency key on `POST /bookings`, and short-lived holds during checkout.
5. Testcontainers MySQL in CI so the concurrency test runs on the exact production engine, plus Angular component and e2e tests (Playwright).
6. OpenAPI/Swagger documentation generated from the controllers.
7. Docker Compose for one-command setup (MySQL + API + web).
8. Accessibility audit (screen reader labels for the calendar grid are in place, but it would benefit from full keyboard grid navigation).

---

## Assumptions

- **Overlapping stays.** Stays are half-open intervals `[checkIn, checkOut)`. Two stays overlap only if they share at least one **night**. Checking out on the 12th and checking in on the 12th do **not** conflict, so back-to-back stays can use the same room. This is covered by `enforcesCapacityPerNight` in the integration test.
- **Capacity is counted per night**, not per stay. A stay is available only if **every** night has a free room. Rooms are not assigned to specific room numbers.
- **"Today"** is the current date in the hotel's time zone (`Asia/Kolkata` by default). Check-in **today** is allowed.
- **Limits:** max 30 nights per booking and check-in up to 365 days ahead. Both are configurable.
- **Prices** are in Indian Rupees, taxes included, paid at the hotel. Totals are rounded to 2 decimals.
- **Cancellation** is free and allowed up to and including the check-in day. After check-in it is closed online.
- **Emails** are stored in lower case and compared case-insensitively. Names have extra whitespace removed.
- **Cancelled bookings** are kept with `status = CANCELLED` for history, and their nights are released immediately.
- **The quote is not a hold.** The room is only secured when `POST /bookings` succeeds, and the booking endpoint re-checks availability.

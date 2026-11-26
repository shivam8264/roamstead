# Roamstead: setup guide

This guide takes you from a fresh machine to Roamstead running locally, step by step. It covers macOS, Linux and Windows.

**Time needed:** about 15 minutes (most of it is the first `mvn` and `npm install` downloads).

---

## Contents

1. [What you need](#1-what-you-need)
2. [Get the code](#2-get-the-code)
3. [Set up MySQL](#3-set-up-mysql)
4. [Configure credentials (kept out of Git)](#4-configure-credentials-kept-out-of-git)
5. [Run the backend](#5-run-the-backend)
6. [Run the frontend](#6-run-the-frontend)
7. [Check everything works](#7-check-everything-works)
8. [Run the automated tests](#8-run-the-automated-tests)
9. [Production build (optional)](#9-production-build-optional)
10. [Reset the sample data](#10-reset-the-sample-data)
11. [Configuration reference](#11-configuration-reference)
12. [Troubleshooting](#12-troubleshooting)

---

## 1. What you need

| Tool | Version | Download | Verify with |
|---|---|---|---|
| Java JDK | **17 or newer** | <https://adoptium.net> | `java -version` |
| Apache Maven | **3.9+** | <https://maven.apache.org/download.cgi> | `mvn -v` |
| Node.js | **18.19+, 20.11+ or 22** (LTS recommended) | <https://nodejs.org> | `node -v` |
| npm | 9+ (comes with Node) | – | `npm -v` |
| MySQL Server | **8.0.16 or newer** | <https://dev.mysql.com/downloads/mysql/> | `mysql --version` |
| Git | any | <https://git-scm.com> | `git --version` |

> MySQL 8.0.16+ is required because the schema uses `CHECK` constraints, which older versions ignore.

Ports used: **3306** (MySQL), **8080** (API), **4200** (web app). Make sure they are free.

---

## 2. Get the code

```bash
git clone https://github.com/<your-username>/roamstead.git
cd roamstead
```

---

## 3. Set up MySQL

Make sure the MySQL server is running:

- **macOS (Homebrew):** `brew services start mysql`
- **Linux:** `sudo systemctl start mysql`
- **Windows:** open *Services* and start **MySQL80**, or use MySQL Workbench / XAMPP

Create the database and an application user. Open `database/00_create_database.sql` and **change the password `change-me`** to one of your own, then run:

```bash
mysql -u root -p < database/00_create_database.sql
```

On Windows, if `mysql` is not on your PATH:
```powershell
& "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -p -e "source database/00_create_database.sql"
```

This creates:
- database **`roamstead`** (utf8mb4)
- user **`roamstead_app`** with access only to that database

**You do not need to create tables or load data.** When the backend starts, **Flyway** runs:
- `V1__create_schema.sql`: tables, keys and constraints
- `V2__seed_hotels.sql`: 6 hotels, amenities, photos and rooms

The same scripts are also in `database/01_schema.sql` and `database/02_seed_data.sql` if you want to read them or load them by hand. If you do load them by hand, start the backend with `SPRING_FLYWAY_ENABLED=false` so Flyway doesn't try to create the tables again.

---

## 4. Configure credentials (kept out of Git)

The backend reads its database login from **environment variables**. Nothing secret is stored in the repository.

| Variable | Required | Default |
|---|---|---|
| `DB_USERNAME` | yes | – |
| `DB_PASSWORD` | yes | – |
| `DB_URL` | no | `jdbc:mysql://localhost:3306/roamstead?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC` |
| `SERVER_PORT` | no | `8080` |
| `CORS_ORIGINS` | no | `http://localhost:4200` |

Choose **one** of these options:

**Option A: environment variables in the terminal** (simplest)

macOS / Linux:
```bash
export DB_USERNAME=roamstead_app
export DB_PASSWORD='your-password'
```

Windows PowerShell:
```powershell
$env:DB_USERNAME="roamstead_app"
$env:DB_PASSWORD="your-password"
```

Windows Command Prompt:
```cmd
set DB_USERNAME=roamstead_app
set DB_PASSWORD=your-password
```

**Option B: a local config file** (no need to re-export each time)

```bash
cd backend
cp application-local.yml.example application-local.yml     # Windows: copy application-local.yml.example application-local.yml
```
Edit `backend/application-local.yml` and set the password. This file is listed in `.gitignore`, so it is never committed.

**Option C: IntelliJ IDEA / Eclipse**
Add `DB_USERNAME` and `DB_PASSWORD` under *Run Configuration → Environment variables* for `RoamsteadApplication`.

---

## 5. Run the backend

```bash
cd backend
mvn spring-boot:run
```

The first run downloads dependencies. Once it has started you should see:

```
Migrating schema `roamstead` to version "1 - create schema"
Migrating schema `roamstead` to version "2 - seed hotels"
Tomcat started on port 8080 (http)
Started RoamsteadApplication in ... seconds
```

Quick check in another terminal or a browser:

```bash
curl http://localhost:8080/api/hotels
```

You should get a JSON list of 6 hotels.

> **IDE alternative:** open the `backend` folder as a Maven project and run `com.roamstead.RoamsteadApplication`, with the environment variables from step 4 set.

---

## 6. Run the frontend

In a **new terminal**:

```bash
cd frontend
npm install
npm start
```

Then open **<http://localhost:4200>**.

`npm start` runs `ng serve` with `proxy.conf.json`, which forwards every `/api/...` call to `http://localhost:8080`. The browser sees one origin, so no CORS setup is needed during development.

> If the Angular CLI asks whether to share analytics, either answer is fine.

---

## 7. Check everything works

Follow the main flow:

| # | Do this | You should see |
|---|---|---|
| 1 | Home page | Split hero with image slider, search bar, city marquee, destination and featured-stay sliders |
| 2 | Search **Udaipur**, check-in 7 days from today, check-out 2 days later | *Lakeshore Mahal* with "2 rooms left" and the total for 2 nights |
| 3 | Open the hotel | Gallery, amenities, room, booking panel with `₹14,800 × 2 nights = ₹29,600`, and the Flex Dates calendar |
| 4 | *Continue to book* → enter name and email → *Review booking* → *Confirm booking* | Confirmation page with a reference such as `RS-K7Q4M9PX` |
| 5 | Book the same dates again with a different email | Second booking succeeds. The hotel now shows **Sold out** |
| 6 | Open the hotel again for those dates | "No rooms left" plus **Flex Dates** suggestions for nearby dates |
| 7 | *My trip* → enter a reference + email → *Cancel booking* → confirm | Status changes to **Cancelled**, and the room is free again for those nights |
| 8 | Try a past check-in, or check-out before check-in | Clear validation messages, no request is accepted |

### Taking screenshots for submission
Capture the steps above, plus one phone-width view (browser dev tools → device toolbar → iPhone 12/14). Save them in `docs/screenshots/` using the file names listed in `docs/screenshots/README.md`.

---

## 8. Run the automated tests

```bash
cd backend
mvn test
```

**MySQL is not needed for tests.** They include:

| Test class | What it checks |
|---|---|
| `PricingServiceTest` | Nights × price, year-end and leap-day nights, rounding, invalid input |
| `StayDatesValidatorTest` | Past check-in, same-day/reversed dates, max nights, booking window, today allowed |
| `AvailabilityServiceTest` | Missing rows = fully free, busiest night wins, check-out night excluded, reserve fails if any night full |
| `BookingServiceTest` | Backend total stored, nothing saved when sold out, cancel releases nights, no double cancel, wrong email = not found |
| `FlexDateServiceTest` | Closest alternatives ranked correctly, no past dates, sliding-window minimum |
| `BookingFlowIntegrationTest` | Full HTTP flow on real Flyway schema (H2 in MySQL mode): book → look up → cancel → room released; capacity and back-to-back stays; **10 concurrent guests for 2 rooms → exactly 2 succeed**; consistent error responses; Flex Dates when sold out |

Run a single class: `mvn test -Dtest=BookingServiceTest`

---

## 9. Production build (optional)

**Backend: runnable JAR**
```bash
cd backend
mvn clean package
java -jar target/roamstead-api-1.0.0.jar
```
(Environment variables from step 4 still apply.)

**Frontend: static files**
```bash
cd frontend
npm run build
```
The output is in `frontend/dist/frontend/browser/`. Serve it from any web server and route `/api` to the backend, for example with an Nginx `location /api { proxy_pass http://localhost:8080; }`. Also set `CORS_ORIGINS` if the API is on a different domain.

---

## 10. Reset the sample data

To start again with an empty set of bookings:

```sql
-- in the mysql client, connected as root
DROP DATABASE roamstead;
CREATE DATABASE roamstead CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
GRANT ALL PRIVILEGES ON roamstead.* TO 'roamstead_app'@'localhost';
```

Then restart the backend. Flyway rebuilds the tables and reloads the hotels.

To clear only the bookings and keep the hotels:

```sql
USE roamstead;
DELETE FROM booking;
DELETE FROM room_inventory;
```

---

## 11. Configuration reference

From `backend/src/main/resources/application.yml`:

| Property | Default | Meaning |
|---|---|---|
| `roamstead.timezone` | `Asia/Kolkata` | Time zone that decides what "today" is for date rules |
| `roamstead.booking.max-nights` | `30` | Longest stay in one booking |
| `roamstead.booking.max-days-ahead` | `365` | Furthest check-in date allowed |
| `roamstead.flex.search-window-days` | `7` | Flex Dates looks this many days before and after |
| `roamstead.flex.max-suggestions` | `4` | Number of alternative stays returned |
| `roamstead.cors.allowed-origins` | `http://localhost:4200` | Origins allowed to call the API directly |

Any of these can be overridden with an environment variable, for example `ROAMSTEAD_BOOKING_MAX_NIGHTS=14`.

---

## 12. Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| `Could not resolve placeholder 'DB_USERNAME'` | Credentials not set | Do step 4 in the **same** terminal where you run `mvn` |
| `Access denied for user 'roamstead_app'@'localhost'` | Wrong password, or user not created | Re-run `database/00_create_database.sql` and check `DB_PASSWORD` |
| `Communications link failure` | MySQL not running, or on another port | Start MySQL. Set `DB_URL` if the port is not 3306 |
| `Public Key Retrieval is not allowed` | Custom `DB_URL` without the flag | Add `allowPublicKeyRetrieval=true` to the URL |
| `Unknown database 'roamstead'` | Step 3 skipped | Run `database/00_create_database.sql` |
| `Found non-empty schema ... without schema history table` | Tables were created by hand before Flyway ran | Drop and recreate the database (section 10), or run with `SPRING_FLYWAY_ENABLED=false` |
| `Port 8080 was already in use` | Another app on 8080 | Stop it, or set `SERVER_PORT=8081` **and** change the target in `frontend/proxy.conf.json` |
| Site loads but shows "We can't reach Roamstead right now" | Backend not running, or the frontend was started without the proxy | Start the backend. Use `npm start` (not plain `ng serve`) |
| `ng: command not found` | Using a global CLI that isn't installed | Use `npm start` / `npm run build`, which use the local CLI |
| `npm install` fails with engine errors | Node version too old | Install Node 20 or 22 LTS |
| Hotel photos show coloured tiles with initials | No internet access to the image host | Expected offline. The layout still works |
| Dates look one day off | System clock / time zone | Rules use `Asia/Kolkata`. Change `roamstead.timezone` if needed |
| `mvn test` fails on Java version | JDK older than 17 | Install JDK 17+ and check `JAVA_HOME` |

Still stuck? Run the backend with debug logs: `mvn spring-boot:run -Dspring-boot.run.arguments=--logging.level.com.roamstead=DEBUG`

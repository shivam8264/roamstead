package com.roamstead;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.roamstead.dto.BookingDtos.CreateBookingRequest;
import com.roamstead.service.BookingService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.time.Clock;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * End-to-end checks through the real controllers, services, Flyway schema and
 * seed data. Each test uses its own dates so the tests do not affect each other.
 * Hotel 6 (Lakeshore Mahal) has only 2 rooms, which makes capacity easy to exhaust.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class BookingFlowIntegrationTest {

    private static final long SMALL_HOTEL = 6L;

    @Autowired private MockMvc mvc;
    @Autowired private ObjectMapper json;
    @Autowired private BookingService bookingService;
    @Autowired private Clock clock;

    private LocalDate day(int offset) {
        return LocalDate.now(clock).plusDays(offset);
    }

    @Test
    @DisplayName("seed data lists at least five hotels")
    void listsSeedHotels() throws Exception {
        mvc.perform(get("/api/hotels"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(6))
                .andExpect(jsonPath("$[0].pricePerNight").exists());
    }

    @Test
    @DisplayName("full flow: quote, book, look up, cancel - and the room comes back")
    void bookLookUpAndCancel() throws Exception {
        LocalDate in = day(40), out = day(43);

        mvc.perform(get("/api/hotels/{id}/quote", SMALL_HOTEL)
                        .param("checkIn", in.toString()).param("checkOut", out.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nights").value(3))
                .andExpect(jsonPath("$.availableRooms").value(2));

        JsonNode booking = book(in, out, "Meera Iyer", "meera@example.com");
        String ref = booking.get("reference").asText();
        assertThat(ref).matches("RS-[A-Z0-9]{8}");
        assertThat(booking.get("totalAmount").decimalValue()).isEqualByComparingTo("44400.00");
        assertThat(roomsLeft(in, out)).isEqualTo(1);

        mvc.perform(get("/api/bookings/{ref}", ref.toLowerCase()).param("email", "MEERA@example.com"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CONFIRMED"));

        mvc.perform(post("/api/bookings/{ref}/cancel", ref)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"email\":\"meera@example.com\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CANCELLED"));
        assertThat(roomsLeft(in, out)).isEqualTo(2);

        mvc.perform(post("/api/bookings/{ref}/cancel", ref)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"email\":\"meera@example.com\"}"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("ALREADY_CANCELLED"));
    }

    @Test
    @DisplayName("capacity is enforced, overlapping stays count, back-to-back stays do not")
    void enforcesCapacityPerNight() throws Exception {
        book(day(60), day(63), "Guest One", "one@example.com");
        book(day(61), day(62), "Guest Two", "two@example.com"); // overlaps one night -> last room on day 61

        // A stay touching night 61 is now refused...
        mvc.perform(post("/api/bookings").contentType(MediaType.APPLICATION_JSON)
                        .content(body(day(59), day(62), "Guest Three", "three@example.com")))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("ROOM_UNAVAILABLE"));

        // ...but checking in on the day the first guest checks out is fine.
        book(day(63), day(65), "Guest Four", "four@example.com");
        book(day(63), day(65), "Guest Five", "five@example.com");
    }

    @Test
    @DisplayName("ten guests racing for two rooms: exactly two win")
    void concurrentBookingsNeverOversell() throws Exception {
        LocalDate in = day(90), out = day(92);
        // Warm-up: book and cancel once so the per-night rows exist and the race
        // below is purely about the atomic "take a room" update.
        String warm = book(in, out, "Warm Up", "warm@example.com").get("reference").asText();
        bookingService.cancel(warm, "warm@example.com");
        assertThat(roomsLeft(in, out)).isEqualTo(2);

        int guests = 10;
        ExecutorService pool = Executors.newFixedThreadPool(guests);
        CountDownLatch start = new CountDownLatch(1);
        List<Future<Boolean>> results = new ArrayList<>();
        for (int i = 0; i < guests; i++) {
            int n = i;
            results.add(pool.submit(() -> {
                start.await();
                try {
                    bookingService.create(new CreateBookingRequest(SMALL_HOTEL, null, in, out,
                            "Racer " + (char) ('A' + n), "racer" + n + "@example.com"));
                    return true;
                } catch (RuntimeException e) { // sold out, lock timeout or constraint - all count as a loss
                    return false;
                }
            }));
        }
        start.countDown();
        int wins = 0;
        for (Future<Boolean> f : results) {
            if (f.get(30, TimeUnit.SECONDS)) {
                wins++;
            }
        }
        pool.shutdown();

        assertThat(wins).isEqualTo(2);
        assertThat(roomsLeft(in, out)).isZero();
    }

    @Test
    @DisplayName("validation errors come back in one consistent shape")
    void consistentErrors() throws Exception {
        mvc.perform(post("/api/bookings").contentType(MediaType.APPLICATION_JSON)
                        .content(body(day(5), day(7), "", "not-an-email")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"))
                .andExpect(jsonPath("$.fieldErrors.length()").value(org.hamcrest.Matchers.greaterThanOrEqualTo(2)));

        mvc.perform(post("/api/bookings").contentType(MediaType.APPLICATION_JSON)
                        .content(body(day(-1), day(2), "Ravi Kumar", "ravi@example.com")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("INVALID_DATES"));

        mvc.perform(get("/api/hotels/999"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("NOT_FOUND"));

        mvc.perform(get("/api/hotels").param("checkIn", "tomorrow").param("checkOut", "2026-01-01"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("INVALID_PARAMETER"));
    }

    @Test
    @DisplayName("flex dates suggests nearby stays when the requested one is sold out")
    void flexDatesWhenSoldOut() throws Exception {
        LocalDate in = day(120), out = day(122);
        book(in, out, "Full One", "full1@example.com");
        book(in, out, "Full Two", "full2@example.com");

        mvc.perform(get("/api/hotels/{id}/flex-dates", SMALL_HOTEL)
                        .param("checkIn", in.toString()).param("checkOut", out.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.requestedAvailable").value(false))
                .andExpect(jsonPath("$.options.length()").value(4))
                .andExpect(jsonPath("$.options[0].offsetDays").value(org.hamcrest.Matchers.anyOf(
                        org.hamcrest.Matchers.is(-2), org.hamcrest.Matchers.is(2))));
    }

    private JsonNode book(LocalDate in, LocalDate out, String name, String email) throws Exception {
        MvcResult result = mvc.perform(post("/api/bookings").contentType(MediaType.APPLICATION_JSON)
                        .content(body(in, out, name, email)))
                .andExpect(status().isCreated())
                .andReturn();
        return json.readTree(result.getResponse().getContentAsString());
    }

    private int roomsLeft(LocalDate in, LocalDate out) throws Exception {
        MvcResult result = mvc.perform(get("/api/hotels/{id}/quote", SMALL_HOTEL)
                        .param("checkIn", in.toString()).param("checkOut", out.toString()))
                .andReturn();
        return json.readTree(result.getResponse().getContentAsString()).get("availableRooms").asInt();
    }

    private String body(LocalDate in, LocalDate out, String name, String email) throws Exception {
        return json.writeValueAsString(new CreateBookingRequest(SMALL_HOTEL, null, in, out, name, email));
    }
}

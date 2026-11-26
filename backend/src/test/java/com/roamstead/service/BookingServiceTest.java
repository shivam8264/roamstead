package com.roamstead.service;

import com.roamstead.domain.Booking;
import com.roamstead.domain.BookingStatus;
import com.roamstead.domain.RoomType;
import com.roamstead.dto.BookingDtos.BookingResponse;
import com.roamstead.dto.BookingDtos.CreateBookingRequest;
import com.roamstead.dto.BookingDtos.Quote;
import com.roamstead.exception.Errors;
import com.roamstead.repository.BookingRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Optional;

import static com.roamstead.service.TestFixtures.TODAY;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class BookingServiceTest {

    private final BookingRepository bookings = mock(BookingRepository.class);
    private final HotelService hotels = mock(HotelService.class);
    private final AvailabilityService availability = mock(AvailabilityService.class);
    private final ReferenceGenerator references = mock(ReferenceGenerator.class);
    private BookingService service;

    private final RoomType room = TestFixtures.room(2, "14800.00");
    private final LocalDate in = TODAY.plusDays(5);
    private final LocalDate out = TODAY.plusDays(8);

    @BeforeEach
    void setUp() {
        service = new BookingService(bookings, hotels, availability, new PricingService(),
                TestFixtures.validator(), references, TestFixtures.CLOCK);
        when(hotels.resolveRoomType(6L, null)).thenReturn(room);
        when(references.next(any())).thenReturn("RS-ABCD2345");
        when(bookings.save(any(Booking.class))).thenAnswer(inv -> inv.getArgument(0));
    }

    @Test
    @DisplayName("quote shows the server-calculated total and rooms left")
    void quoteCalculatesTotal() {
        when(availability.availableRooms(room, in, out)).thenReturn(1);

        Quote quote = service.quote(6L, null, in, out);

        assertThat(quote.nights()).isEqualTo(3);
        assertThat(quote.totalAmount()).isEqualByComparingTo("44400.00");
        assertThat(quote.available()).isTrue();
        assertThat(quote.availableRooms()).isEqualTo(1);
    }

    @Test
    @DisplayName("creating a booking reserves the nights and stores the backend total")
    void createReservesAndPrices() {
        BookingResponse response = service.create(request("  Asha   Rao ", " Asha.Rao@Example.com "));

        verify(availability).ensureNights(room, in, out);
        verify(availability).reserve(room, in, out, 3);
        assertThat(response.reference()).isEqualTo("RS-ABCD2345");
        assertThat(response.status()).isEqualTo(BookingStatus.CONFIRMED);
        assertThat(response.totalAmount()).isEqualByComparingTo("44400.00");
        assertThat(response.guestName()).isEqualTo("Asha Rao");
        assertThat(response.guestEmail()).isEqualTo("asha.rao@example.com");
        assertThat(response.cancellable()).isTrue();
    }

    @Test
    @DisplayName("no booking is saved when the room is sold out")
    void soldOutSavesNothing() {
        doThrow(new Errors.RoomUnavailable("full")).when(availability).reserve(room, in, out, 3);

        assertThatThrownBy(() -> service.create(request("Asha Rao", "asha@example.com")))
                .isInstanceOf(Errors.RoomUnavailable.class);
        verify(bookings, never()).save(any());
    }

    @Test
    @DisplayName("invalid dates are rejected before touching availability")
    void invalidDatesStopEarly() {
        CreateBookingRequest pastStay = new CreateBookingRequest(6L, null, TODAY.minusDays(1), TODAY.plusDays(1),
                "Asha Rao", "asha@example.com");

        assertThatThrownBy(() -> service.create(pastStay)).isInstanceOf(Errors.InvalidStay.class);
        verify(availability, never()).reserve(any(), any(), any(), org.mockito.ArgumentMatchers.anyInt());
    }

    @Test
    @DisplayName("cancelling releases the nights and marks the booking cancelled")
    void cancelReleasesNights() {
        Booking booking = existingBooking();
        when(bookings.findByReferenceForUpdate("RS-ABCD2345")).thenReturn(Optional.of(booking));

        BookingResponse response = service.cancel(" rs-abcd2345 ", "ASHA@example.com");

        verify(availability).release(room, in, out);
        assertThat(response.status()).isEqualTo(BookingStatus.CANCELLED);
        assertThat(response.cancellable()).isFalse();
    }

    @Test
    @DisplayName("cancelling twice is refused and releases nothing the second time")
    void cannotCancelTwice() {
        Booking booking = existingBooking();
        booking.cancel(LocalDateTime.now(TestFixtures.CLOCK));
        when(bookings.findByReferenceForUpdate("RS-ABCD2345")).thenReturn(Optional.of(booking));

        assertThatThrownBy(() -> service.cancel("RS-ABCD2345", "asha@example.com"))
                .isInstanceOf(Errors.AlreadyCancelled.class);
        verify(availability, never()).release(any(), any(), any());
    }

    @Test
    @DisplayName("a wrong email gives the same not-found answer as a wrong reference")
    void wrongEmailLooksLikeNotFound() {
        when(bookings.findByReference("RS-ABCD2345")).thenReturn(Optional.of(existingBooking()));

        assertThatThrownBy(() -> service.find("RS-ABCD2345", "someone.else@example.com"))
                .isInstanceOf(Errors.NotFound.class);
    }

    private CreateBookingRequest request(String name, String email) {
        return new CreateBookingRequest(6L, null, in, out, name, email);
    }

    private Booking existingBooking() {
        return new Booking("RS-ABCD2345", room, "Asha Rao", "asha@example.com", in, out, 3,
                new BigDecimal("14800.00"), new BigDecimal("44400.00"), LocalDateTime.now(TestFixtures.CLOCK));
    }
}

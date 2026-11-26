package com.roamstead.service;

import com.roamstead.domain.Booking;
import com.roamstead.domain.Hotel;
import com.roamstead.domain.RoomType;
import com.roamstead.dto.BookingDtos.BookingResponse;
import com.roamstead.dto.BookingDtos.CreateBookingRequest;
import com.roamstead.dto.BookingDtos.Quote;
import com.roamstead.exception.Errors;
import com.roamstead.repository.BookingRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Locale;
import java.util.Optional;

@Service
public class BookingService {

    private static final String NOT_FOUND_MESSAGE =
            "We couldn't find a booking with that reference and email. Check both and try again.";

    private final BookingRepository bookings;
    private final HotelService hotels;
    private final AvailabilityService availability;
    private final PricingService pricing;
    private final StayDatesValidator stayDates;
    private final ReferenceGenerator references;
    private final Clock clock;

    public BookingService(BookingRepository bookings, HotelService hotels, AvailabilityService availability,
                          PricingService pricing, StayDatesValidator stayDates, ReferenceGenerator references,
                          Clock clock) {
        this.bookings = bookings;
        this.hotels = hotels;
        this.availability = availability;
        this.pricing = pricing;
        this.stayDates = stayDates;
        this.references = references;
        this.clock = clock;
    }

    /** The price and availability the guest sees before confirming. Nothing is reserved. */
    @Transactional(readOnly = true)
    public Quote quote(Long hotelId, Long roomTypeId, LocalDate checkIn, LocalDate checkOut) {
        int nights = stayDates.validate(checkIn, checkOut);
        RoomType room = hotels.resolveRoomType(hotelId, roomTypeId);
        int free = availability.availableRooms(room, checkIn, checkOut);
        BigDecimal total = pricing.total(room.getPricePerNight(), nights);
        return new Quote(hotelId, room.getHotel().getName(), room.getId(), room.getName(),
                checkIn, checkOut, nights, room.getPricePerNight(), total, free, free > 0);
    }

    /**
     * Books one room. Either every night is reserved and the booking is saved,
     * or nothing changes and a ROOM_UNAVAILABLE error is returned.
     */
    @Transactional
    public BookingResponse create(CreateBookingRequest request) {
        int nights = stayDates.validate(request.checkIn(), request.checkOut());
        RoomType room = hotels.resolveRoomType(request.hotelId(), request.roomTypeId());
        Hotel hotel = room.getHotel();
        hotel.getName(); // load now, before the inventory update runs

        availability.ensureNights(room, request.checkIn(), request.checkOut());
        availability.reserve(room, request.checkIn(), request.checkOut(), nights);

        BigDecimal total = pricing.total(room.getPricePerNight(), nights);
        String reference = references.next(bookings::existsByReference);

        Booking booking = new Booking(reference, room,
                normaliseName(request.guestName()), normaliseEmail(request.guestEmail()),
                request.checkIn(), request.checkOut(), nights,
                room.getPricePerNight(), total, now());
        return toResponse(bookings.save(booking));
    }

    @Transactional(readOnly = true)
    public BookingResponse find(String reference, String email) {
        return toResponse(findOwned(bookings.findByReference(normaliseReference(reference)), email));
    }

    /** Cancels a booking and gives its nights back to the pool. */
    @Transactional
    public BookingResponse cancel(String reference, String email) {
        Booking booking = findOwned(bookings.findByReferenceForUpdate(normaliseReference(reference)), email);
        if (booking.isCancelled()) {
            throw new Errors.AlreadyCancelled(booking.getReference());
        }
        if (booking.getCheckIn().isBefore(stayDates.today())) {
            throw new Errors.CancellationClosed();
        }
        availability.release(booking.getRoomType(), booking.getCheckIn(), booking.getCheckOut());
        booking.cancel(now());
        return toResponse(booking);
    }

    /**
     * Reference and email must both match. Either mismatch gives the same
     * answer, so the API never reveals which references exist.
     */
    private Booking findOwned(Optional<Booking> candidate, String email) {
        String wanted = normaliseEmail(email);
        return candidate
                .filter(b -> b.getGuestEmail().equalsIgnoreCase(wanted))
                .orElseThrow(() -> new Errors.NotFound(NOT_FOUND_MESSAGE));
    }

    private BookingResponse toResponse(Booking b) {
        Hotel h = b.getHotel();
        boolean cancellable = !b.isCancelled() && !b.getCheckIn().isBefore(stayDates.today());
        return new BookingResponse(b.getReference(), b.getStatus(), h.getId(), h.getName(), h.getCity(),
                h.getAddress(), h.getCoverImage(), b.getRoomType().getName(), b.getGuestName(),
                b.getGuestEmail(), b.getCheckIn(), b.getCheckOut(), b.getNights(), b.getPricePerNight(),
                b.getTotalAmount(), b.getCreatedAt(), b.getCancelledAt(), cancellable);
    }

    private LocalDateTime now() {
        return LocalDateTime.now(clock);
    }

    private static String normaliseReference(String reference) {
        if (reference == null || reference.isBlank()) {
            throw new Errors.InvalidRequest("Enter your booking reference.");
        }
        return reference.trim().toUpperCase(Locale.ROOT);
    }

    private static String normaliseEmail(String email) {
        if (email == null || email.isBlank()) {
            throw new Errors.InvalidRequest("Enter the email used for the booking.");
        }
        return email.trim().toLowerCase(Locale.ROOT);
    }

    private static String normaliseName(String name) {
        return name.trim().replaceAll("\\s+", " ");
    }
}

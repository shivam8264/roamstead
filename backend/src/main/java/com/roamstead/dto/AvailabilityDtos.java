package com.roamstead.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/** Response shapes for the availability calendar and Flex Dates. */
public final class AvailabilityDtos {

    private AvailabilityDtos() {
    }

    /** Rooms left for a single night. */
    public record NightAvailability(LocalDate date, int availableRooms, int totalRooms) { }

    public record Calendar(Long hotelId,
                           Long roomTypeId,
                           BigDecimal pricePerNight,
                           List<NightAvailability> nights) { }

    /** An alternative stay of the same length that still has a room. */
    public record FlexOption(LocalDate checkIn,
                             LocalDate checkOut,
                             int offsetDays,
                             int availableRooms,
                             BigDecimal totalAmount) { }

    public record FlexDates(Long hotelId,
                            LocalDate requestedCheckIn,
                            LocalDate requestedCheckOut,
                            int nights,
                            boolean requestedAvailable,
                            int requestedAvailableRooms,
                            List<FlexOption> options) { }
}

package com.roamstead.service;

import com.roamstead.config.AppProperties;
import com.roamstead.domain.RoomType;
import com.roamstead.dto.AvailabilityDtos.Calendar;
import com.roamstead.dto.AvailabilityDtos.FlexDates;
import com.roamstead.dto.AvailabilityDtos.FlexOption;
import com.roamstead.dto.AvailabilityDtos.NightAvailability;
import com.roamstead.exception.Errors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

/**
 * Surprise feature: "Flex Dates".
 * <p>
 * Instead of a dead-end "sold out" message, the guest sees a night-by-night
 * availability calendar and the closest alternative stays of the same length
 * (within +/- N days) that still have a room, each with its exact price.
 */
@Service
@Transactional(readOnly = true)
public class FlexDateService {

    static final int MAX_CALENDAR_DAYS = 62;

    private final HotelService hotels;
    private final AvailabilityService availability;
    private final PricingService pricing;
    private final StayDatesValidator stayDates;
    private final AppProperties.Flex settings;
    private final AppProperties.Booking rules;

    public FlexDateService(HotelService hotels, AvailabilityService availability, PricingService pricing,
                           StayDatesValidator stayDates, AppProperties properties) {
        this.hotels = hotels;
        this.availability = availability;
        this.pricing = pricing;
        this.stayDates = stayDates;
        this.settings = properties.flex();
        this.rules = properties.booking();
    }

    /** Rooms left per night, starting at {@code from} (never earlier than today). */
    public Calendar calendar(Long hotelId, LocalDate from, int days) {
        if (days < 1 || days > MAX_CALENDAR_DAYS) {
            throw new Errors.InvalidRequest("days must be between 1 and " + MAX_CALENDAR_DAYS + ".");
        }
        LocalDate today = stayDates.today();
        LocalDate start = (from == null || from.isBefore(today)) ? today : from;
        RoomType room = hotels.resolveRoomType(hotelId, null);
        List<NightAvailability> nights = availability.nightly(room, start, start.plusDays(days));
        return new Calendar(hotelId, room.getId(), room.getPricePerNight(), nights);
    }

    /** Closest same-length stays around the requested dates that still have a room. */
    public FlexDates suggest(Long hotelId, LocalDate checkIn, LocalDate checkOut) {
        int nights = stayDates.validate(checkIn, checkOut);
        RoomType room = hotels.resolveRoomType(hotelId, null);

        LocalDate today = stayDates.today();
        LocalDate lastAllowedStart = today.plusDays(rules.maxDaysAhead());
        int window = settings.searchWindowDays();

        LocalDate firstStart = max(today, checkIn.minusDays(window));
        LocalDate lastStart = min(lastAllowedStart, checkIn.plusDays(window));

        // One read covers every night any candidate could use.
        List<NightAvailability> calendar =
                availability.nightly(room, firstStart, max(lastStart, checkIn).plusDays(nights));

        int requestedFree = minOver(calendar, firstStart, checkIn, nights);

        List<FlexOption> options = new ArrayList<>();
        for (LocalDate start = firstStart; !start.isAfter(lastStart); start = start.plusDays(1)) {
            if (start.equals(checkIn)) {
                continue;
            }
            int free = minOver(calendar, firstStart, start, nights);
            if (free > 0) {
                int offset = (int) ChronoUnit.DAYS.between(checkIn, start);
                options.add(new FlexOption(start, start.plusDays(nights), offset, free,
                        pricing.total(room.getPricePerNight(), nights)));
            }
        }
        options.sort(Comparator.comparingInt((FlexOption o) -> Math.abs(o.offsetDays()))
                .thenComparingInt(FlexOption::offsetDays));

        List<FlexOption> closest = options.stream().limit(settings.maxSuggestions()).toList();
        return new FlexDates(hotelId, checkIn, checkOut, nights, requestedFree > 0, requestedFree, closest);
    }

    /** Minimum rooms free over {@code nights} nights starting at {@code start}. */
    static int minOver(List<NightAvailability> calendar, LocalDate calendarStart, LocalDate start, int nights) {
        int from = (int) ChronoUnit.DAYS.between(calendarStart, start);
        int min = Integer.MAX_VALUE;
        for (int i = from; i < from + nights; i++) {
            if (i < 0 || i >= calendar.size()) {
                return 0;
            }
            min = Math.min(min, calendar.get(i).availableRooms());
        }
        return min == Integer.MAX_VALUE ? 0 : min;
    }

    private static LocalDate max(LocalDate a, LocalDate b) {
        return a.isAfter(b) ? a : b;
    }

    private static LocalDate min(LocalDate a, LocalDate b) {
        return a.isBefore(b) ? a : b;
    }
}

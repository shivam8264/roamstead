package com.roamstead.service;

import com.roamstead.config.AppProperties;
import com.roamstead.exception.Errors;
import org.springframework.stereotype.Component;

import java.time.Clock;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;

/**
 * The single place where stay dates are checked. Every endpoint that accepts
 * dates goes through here, so the rules cannot drift between search, quote and booking.
 */
@Component
public class StayDatesValidator {

    private final Clock clock;
    private final AppProperties.Booking rules;

    public StayDatesValidator(Clock clock, AppProperties properties) {
        this.clock = clock;
        this.rules = properties.booking();
    }

    /**
     * Validates the stay and returns the number of nights.
     *
     * @throws Errors.InvalidStay with a guest-friendly message when a rule is broken
     */
    public int validate(LocalDate checkIn, LocalDate checkOut) {
        if (checkIn == null || checkOut == null) {
            throw new Errors.InvalidStay("Select both a check-in and a check-out date.");
        }
        LocalDate today = today();
        if (checkIn.isBefore(today)) {
            throw new Errors.InvalidStay("Check-in cannot be in the past.");
        }
        if (!checkOut.isAfter(checkIn)) {
            throw new Errors.InvalidStay("Check-out must be at least one day after check-in.");
        }
        if (checkIn.isAfter(today.plusDays(rules.maxDaysAhead()))) {
            throw new Errors.InvalidStay("Bookings open up to " + rules.maxDaysAhead() + " days ahead.");
        }
        long nights = ChronoUnit.DAYS.between(checkIn, checkOut);
        if (nights > rules.maxNights()) {
            throw new Errors.InvalidStay("A single booking can cover at most " + rules.maxNights() + " nights.");
        }
        return (int) nights;
    }

    /** Validates only when both dates are present; rejects a half-filled pair. */
    public Integer validateOptional(LocalDate checkIn, LocalDate checkOut) {
        if (checkIn == null && checkOut == null) {
            return null;
        }
        return validate(checkIn, checkOut);
    }

    public LocalDate today() {
        return LocalDate.now(clock);
    }
}

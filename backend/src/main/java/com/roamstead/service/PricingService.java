package com.roamstead.service;

import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;

/**
 * Prices are always computed here on the server. The frontend only displays
 * what this service returns; it never sends an amount to be trusted.
 */
@Service
public class PricingService {

    public int nightsBetween(LocalDate checkIn, LocalDate checkOut) {
        long nights = ChronoUnit.DAYS.between(checkIn, checkOut);
        if (nights <= 0) {
            throw new IllegalArgumentException("Check-out must be after check-in");
        }
        return Math.toIntExact(nights);
    }

    /** total = price per night x number of nights, rounded to 2 decimal places. */
    public BigDecimal total(BigDecimal pricePerNight, int nights) {
        if (pricePerNight == null || pricePerNight.signum() <= 0) {
            throw new IllegalArgumentException("Price per night must be positive");
        }
        if (nights <= 0) {
            throw new IllegalArgumentException("Nights must be positive");
        }
        return pricePerNight.multiply(BigDecimal.valueOf(nights)).setScale(2, RoundingMode.HALF_UP);
    }

    public BigDecimal total(BigDecimal pricePerNight, LocalDate checkIn, LocalDate checkOut) {
        return total(pricePerNight, nightsBetween(checkIn, checkOut));
    }
}

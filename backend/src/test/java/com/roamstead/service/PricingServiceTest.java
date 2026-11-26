package com.roamstead.service;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class PricingServiceTest {

    private final PricingService pricing = new PricingService();

    @Test
    @DisplayName("total = nightly price x number of nights")
    void multipliesPriceByNights() {
        BigDecimal total = pricing.total(new BigDecimal("6200.00"),
                LocalDate.of(2026, 12, 10), LocalDate.of(2026, 12, 13));

        assertThat(total).isEqualByComparingTo("18600.00");
    }

    @Test
    @DisplayName("a one-night stay costs exactly one night")
    void singleNight() {
        assertThat(pricing.total(new BigDecimal("14800"), 1)).isEqualByComparingTo("14800.00");
    }

    @Test
    @DisplayName("nights are counted across month and year boundaries")
    void countsNightsAcrossYearEnd() {
        assertThat(pricing.nightsBetween(LocalDate.of(2026, 12, 30), LocalDate.of(2027, 1, 2))).isEqualTo(3);
    }

    @Test
    @DisplayName("nights are counted correctly across a leap day")
    void countsLeapDay() {
        assertThat(pricing.nightsBetween(LocalDate.of(2028, 2, 28), LocalDate.of(2028, 3, 1))).isEqualTo(2);
    }

    @Test
    @DisplayName("totals are rounded to two decimal places")
    void roundsToPaise() {
        assertThat(pricing.total(new BigDecimal("999.995"), 1)).isEqualByComparingTo("1000.00");
        assertThat(pricing.total(new BigDecimal("1234.5"), 3).scale()).isEqualTo(2);
    }

    @Test
    @DisplayName("zero-night or reversed stays are rejected")
    void rejectsNonPositiveNights() {
        LocalDate day = LocalDate.of(2026, 12, 10);
        assertThatThrownBy(() -> pricing.nightsBetween(day, day)).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> pricing.nightsBetween(day, day.minusDays(1)))
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> pricing.total(BigDecimal.TEN, 0)).isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @DisplayName("a zero or negative price is rejected")
    void rejectsBadPrice() {
        assertThatThrownBy(() -> pricing.total(BigDecimal.ZERO, 2)).isInstanceOf(IllegalArgumentException.class);
    }
}

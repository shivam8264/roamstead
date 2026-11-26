package com.roamstead.service;

import com.roamstead.exception.Errors;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static com.roamstead.service.TestFixtures.TODAY;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class StayDatesValidatorTest {

    private final StayDatesValidator validator = TestFixtures.validator();

    @Test
    @DisplayName("a stay starting today is allowed and returns the night count")
    void allowsCheckInToday() {
        assertThat(validator.validate(TODAY, TODAY.plusDays(2))).isEqualTo(2);
    }

    @Test
    @DisplayName("check-in in the past is rejected")
    void rejectsPastCheckIn() {
        assertThatThrownBy(() -> validator.validate(TODAY.minusDays(1), TODAY.plusDays(1)))
                .isInstanceOf(Errors.InvalidStay.class)
                .hasMessageContaining("past");
    }

    @Test
    @DisplayName("check-out on the same day as check-in is rejected")
    void rejectsSameDayCheckOut() {
        assertThatThrownBy(() -> validator.validate(TODAY.plusDays(3), TODAY.plusDays(3)))
                .isInstanceOf(Errors.InvalidStay.class)
                .hasMessageContaining("after check-in");
    }

    @Test
    @DisplayName("check-out before check-in is rejected")
    void rejectsReversedDates() {
        assertThatThrownBy(() -> validator.validate(TODAY.plusDays(5), TODAY.plusDays(2)))
                .isInstanceOf(Errors.InvalidStay.class);
    }

    @Test
    @DisplayName("stays longer than the maximum are rejected")
    void rejectsVeryLongStays() {
        assertThat(validator.validate(TODAY, TODAY.plusDays(30))).isEqualTo(30);
        assertThatThrownBy(() -> validator.validate(TODAY, TODAY.plusDays(31)))
                .isInstanceOf(Errors.InvalidStay.class);
    }

    @Test
    @DisplayName("check-in further ahead than the booking window is rejected")
    void rejectsFarFutureCheckIn() {
        assertThatThrownBy(() -> validator.validate(TODAY.plusDays(366), TODAY.plusDays(368)))
                .isInstanceOf(Errors.InvalidStay.class);
    }

    @Test
    @DisplayName("only one of the two dates is rejected; neither is fine for browsing")
    void handlesOptionalDates() {
        assertThat(validator.validateOptional(null, null)).isNull();
        assertThatThrownBy(() -> validator.validateOptional(TODAY, null)).isInstanceOf(Errors.InvalidStay.class);
    }
}

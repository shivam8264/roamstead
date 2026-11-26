package com.roamstead.service;

import com.roamstead.domain.RoomType;
import com.roamstead.dto.AvailabilityDtos.FlexDates;
import com.roamstead.dto.AvailabilityDtos.FlexOption;
import com.roamstead.dto.AvailabilityDtos.NightAvailability;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.List;
import java.util.Set;

import static com.roamstead.service.TestFixtures.TODAY;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class FlexDateServiceTest {

    private final HotelService hotels = mock(HotelService.class);
    private final AvailabilityService availability = mock(AvailabilityService.class);
    private final FlexDateService flex = new FlexDateService(hotels, availability, new PricingService(),
            TestFixtures.validator(), TestFixtures.PROPS);
    private final RoomType room = TestFixtures.room(2, "1000");

    /** Builds a calendar where the given dates are sold out. */
    private void soldOutOn(Set<LocalDate> full) {
        when(availability.nightly(any(), any(), any())).thenAnswer(inv -> {
            LocalDate from = inv.getArgument(1);
            LocalDate to = inv.getArgument(2);
            return from.datesUntil(to)
                    .map(d -> new NightAvailability(d, full.contains(d) ? 0 : 2, 2))
                    .toList();
        });
    }

    @Test
    @DisplayName("when the requested stay is full, the nearest free stays are suggested first")
    void suggestsClosestAlternatives() {
        when(hotels.resolveRoomType(6L, null)).thenReturn(room);
        LocalDate in = TODAY.plusDays(20);
        // The requested 2-night stay is blocked by a sold-out night on day 21.
        soldOutOn(Set.of(in.plusDays(1)));

        FlexDates result = flex.suggest(6L, in, in.plusDays(2));

        assertThat(result.requestedAvailable()).isFalse();
        assertThat(result.options()).hasSize(4);
        // +1 still uses the sold-out night; -1 (nights in-1, in) does not.
        assertThat(result.options()).extracting(FlexOption::offsetDays).containsExactly(-1, -2, 2, -3);
        assertThat(result.options()).allSatisfy(o -> {
            assertThat(o.checkOut()).isEqualTo(o.checkIn().plusDays(2));
            assertThat(o.totalAmount()).isEqualByComparingTo("2000.00");
        });
    }

    @Test
    @DisplayName("never suggests a check-in date in the past")
    void neverSuggestsPastDates() {
        when(hotels.resolveRoomType(6L, null)).thenReturn(room);
        soldOutOn(Set.of(TODAY.plusDays(1)));

        FlexDates result = flex.suggest(6L, TODAY.plusDays(1), TODAY.plusDays(2));

        assertThat(result.options()).allSatisfy(o -> assertThat(o.checkIn()).isAfterOrEqualTo(TODAY));
    }

    @Test
    @DisplayName("minOver returns the tightest night in the window")
    void minOverFindsTightestNight() {
        List<NightAvailability> cal = List.of(
                new NightAvailability(TODAY, 2, 2),
                new NightAvailability(TODAY.plusDays(1), 1, 2),
                new NightAvailability(TODAY.plusDays(2), 2, 2));

        assertThat(FlexDateService.minOver(cal, TODAY, TODAY, 3)).isEqualTo(1);
        assertThat(FlexDateService.minOver(cal, TODAY, TODAY.plusDays(2), 2)).isZero(); // runs off the end
    }
}

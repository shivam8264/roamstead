package com.roamstead.service;

import com.roamstead.domain.RoomInventory;
import com.roamstead.domain.RoomType;
import com.roamstead.dto.AvailabilityDtos.NightAvailability;
import com.roamstead.exception.Errors;
import com.roamstead.repository.RoomInventoryRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.List;

import static com.roamstead.service.TestFixtures.TODAY;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class AvailabilityServiceTest {

    private final RoomInventoryRepository repo = mock(RoomInventoryRepository.class);
    private final AvailabilityService availability = new AvailabilityService(repo);
    private final RoomType room = TestFixtures.room(3, "5000");

    private final LocalDate in = TODAY.plusDays(10);
    private final LocalDate out = TODAY.plusDays(13);

    @Test
    @DisplayName("nights nobody has booked count as fully available")
    void missingRowsMeanAllRoomsFree() {
        when(repo.findNights(60L, in, out)).thenReturn(List.of());

        assertThat(availability.availableRooms(room, in, out)).isEqualTo(3);
    }

    @Test
    @DisplayName("availability for a stay is the tightest night in it")
    void usesTheBusiestNight() {
        when(repo.findNights(60L, in, out)).thenReturn(List.of(
                new RoomInventory(60L, in, 3, 1),
                new RoomInventory(60L, in.plusDays(1), 3, 3), // sold out
                new RoomInventory(60L, in.plusDays(2), 3, 0)));

        assertThat(availability.availableRooms(room, in, out)).isZero();
    }

    @Test
    @DisplayName("the check-out night is not part of the stay")
    void checkOutDayIsNotANight() {
        when(repo.findNights(60L, in, out)).thenReturn(List.of());

        List<NightAvailability> nights = availability.nightly(room, in, out);

        assertThat(nights).extracting(NightAvailability::date)
                .containsExactly(in, in.plusDays(1), in.plusDays(2))
                .doesNotContain(out);
    }

    @Test
    @DisplayName("reserve succeeds when every night was updated")
    void reserveSucceeds() {
        when(repo.reserveNights(60L, in, out)).thenReturn(3);

        availability.reserve(room, in, out, 3);

        verify(repo).reserveNights(60L, in, out);
    }

    @Test
    @DisplayName("reserve fails when any night had no room left")
    void reserveFailsIfAnyNightFull() {
        when(repo.reserveNights(60L, in, out)).thenReturn(2);

        assertThatThrownBy(() -> availability.reserve(room, in, out, 3))
                .isInstanceOf(Errors.RoomUnavailable.class);
    }

    @Test
    @DisplayName("ensureNights creates one counter row per night")
    void ensureNightsCreatesRowPerNight() {
        availability.ensureNights(room, in, out);

        verify(repo, times(3)).insertNightIfAbsent(eq(60L), any(LocalDate.class), eq(3));
    }
}

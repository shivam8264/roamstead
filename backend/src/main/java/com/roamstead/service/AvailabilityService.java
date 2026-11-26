package com.roamstead.service;

import com.roamstead.domain.RoomInventory;
import com.roamstead.domain.RoomType;
import com.roamstead.dto.AvailabilityDtos.NightAvailability;
import com.roamstead.exception.Errors;
import com.roamstead.repository.RoomInventoryRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Reads and changes per-night room counters.
 * <p>
 * A stay is the half-open range [checkIn, checkOut): the guest occupies the
 * room on the night of every date from check-in up to, but not including,
 * check-out. Two stays overlap only if they share at least one night, so a
 * guest checking out on the 12th never blocks a guest checking in on the 12th.
 */
@Service
public class AvailabilityService {

    private final RoomInventoryRepository inventory;

    public AvailabilityService(RoomInventoryRepository inventory) {
        this.inventory = inventory;
    }

    /** Rooms free on every night of the stay = the minimum across those nights. */
    @Transactional(readOnly = true)
    public int availableRooms(RoomType roomType, LocalDate checkIn, LocalDate checkOut) {
        List<NightAvailability> nights = nightly(roomType, checkIn, checkOut);
        return minAvailable(nights);
    }

    /** Batch version used by the search results page (one query for all hotels). */
    @Transactional(readOnly = true)
    public Map<Long, Integer> availableRooms(Collection<RoomType> roomTypes, LocalDate checkIn, LocalDate checkOut) {
        Map<Long, RoomType> byId = roomTypes.stream()
                .collect(Collectors.toMap(RoomType::getId, Function.identity()));
        if (byId.isEmpty()) {
            return Map.of();
        }
        Map<Long, Map<LocalDate, RoomInventory>> rows = new HashMap<>();
        for (RoomInventory row : inventory.findNightsForRoomTypes(byId.keySet(), checkIn, checkOut)) {
            rows.computeIfAbsent(row.getRoomTypeId(), k -> new HashMap<>()).put(row.getStayDate(), row);
        }
        Map<Long, Integer> result = new HashMap<>();
        byId.forEach((id, roomType) -> {
            Map<LocalDate, RoomInventory> nights = rows.getOrDefault(id, Map.of());
            int min = checkIn.datesUntil(checkOut)
                    .mapToInt(d -> availableOn(roomType, nights.get(d)))
                    .min().orElse(0);
            result.put(id, min);
        });
        return result;
    }

    /** One entry per night in [from, toExclusive), filling in nights nobody has booked yet. */
    @Transactional(readOnly = true)
    public List<NightAvailability> nightly(RoomType roomType, LocalDate from, LocalDate toExclusive) {
        Map<LocalDate, RoomInventory> rows = inventory.findNights(roomType.getId(), from, toExclusive).stream()
                .collect(Collectors.toMap(RoomInventory::getStayDate, Function.identity()));
        return from.datesUntil(toExclusive)
                .map(d -> {
                    RoomInventory row = rows.get(d);
                    int total = row == null ? roomType.getTotalRooms() : row.getTotalRooms();
                    return new NightAvailability(d, availableOn(roomType, row), total);
                })
                .toList();
    }

    /**
     * Makes sure a counter row exists for every night of the stay. Runs in its own
     * short transaction so the booking transaction only has to lock existing rows.
     * Empty rows are harmless if the booking later fails.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void ensureNights(RoomType roomType, LocalDate checkIn, LocalDate checkOut) {
        checkIn.datesUntil(checkOut)
                .forEach(d -> inventory.insertNightIfAbsent(roomType.getId(), d, roomType.getTotalRooms()));
    }

    /**
     * Takes one room for every night of the stay, or fails without changing anything.
     * Must run inside the caller's booking transaction so a failure rolls back cleanly.
     */
    @Transactional(propagation = Propagation.MANDATORY)
    public void reserve(RoomType roomType, LocalDate checkIn, LocalDate checkOut, int nights) {
        int updated = inventory.reserveNights(roomType.getId(), checkIn, checkOut);
        if (updated != nights) {
            // Throwing marks the transaction for rollback, undoing the nights we did take.
            throw new Errors.RoomUnavailable(
                    "Sorry, there are no rooms left for every night of this stay. "
                            + "Try one of the nearby dates instead.");
        }
    }

    /** Gives back one room for every night of a cancelled stay. */
    @Transactional(propagation = Propagation.MANDATORY)
    public void release(RoomType roomType, LocalDate checkIn, LocalDate checkOut) {
        inventory.releaseNights(roomType.getId(), checkIn, checkOut);
    }

    static int minAvailable(List<NightAvailability> nights) {
        return nights.stream().mapToInt(NightAvailability::availableRooms).min().orElse(0);
    }

    private static int availableOn(RoomType roomType, RoomInventory row) {
        return row == null ? roomType.getTotalRooms() : row.getAvailableRooms();
    }
}

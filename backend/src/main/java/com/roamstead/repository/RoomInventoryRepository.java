package com.roamstead.repository;

import com.roamstead.domain.RoomInventory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;

public interface RoomInventoryRepository extends JpaRepository<RoomInventory, Long> {

    /** Inventory rows for the nights in [from, to). */
    @Query("""
            select i from RoomInventory i
            where i.roomTypeId = :roomTypeId and i.stayDate >= :from and i.stayDate < :to
            order by i.stayDate
            """)
    List<RoomInventory> findNights(@Param("roomTypeId") Long roomTypeId,
                                   @Param("from") LocalDate from,
                                   @Param("to") LocalDate to);

    /** Same as {@link #findNights} for several room types at once (search results). */
    @Query("""
            select i from RoomInventory i
            where i.roomTypeId in :roomTypeIds and i.stayDate >= :from and i.stayDate < :to
            """)
    List<RoomInventory> findNightsForRoomTypes(@Param("roomTypeIds") Collection<Long> roomTypeIds,
                                               @Param("from") LocalDate from,
                                               @Param("to") LocalDate to);

    /**
     * Creates the counter row for a night if it does not exist yet.
     * INSERT IGNORE makes this safe when two requests create the same night.
     */
    @Modifying
    @Query(value = """
            INSERT IGNORE INTO room_inventory (room_type_id, stay_date, total_rooms, booked_rooms)
            VALUES (:roomTypeId, :stayDate, :totalRooms, 0)
            """, nativeQuery = true)
    int insertNightIfAbsent(@Param("roomTypeId") Long roomTypeId,
                            @Param("stayDate") LocalDate stayDate,
                            @Param("totalRooms") int totalRooms);

    /**
     * Atomically takes one room on every night in [from, to) that still has one free.
     * The caller compares the returned row count with the number of nights:
     * anything less means at least one night was full, and the transaction is rolled back.
     * Because MySQL re-reads each row under an exclusive lock, two concurrent
     * requests for the last room can never both succeed.
     */
    @Modifying(flushAutomatically = true)
    @Query("""
            update RoomInventory i set i.bookedRooms = i.bookedRooms + 1
            where i.roomTypeId = :roomTypeId and i.stayDate >= :from and i.stayDate < :to
              and i.bookedRooms < i.totalRooms
            """)
    int reserveNights(@Param("roomTypeId") Long roomTypeId,
                      @Param("from") LocalDate from,
                      @Param("to") LocalDate to);

    /** Gives one room back on every night in [from, to). */
    @Modifying(flushAutomatically = true)
    @Query("""
            update RoomInventory i set i.bookedRooms = i.bookedRooms - 1
            where i.roomTypeId = :roomTypeId and i.stayDate >= :from and i.stayDate < :to
              and i.bookedRooms > 0
            """)
    int releaseNights(@Param("roomTypeId") Long roomTypeId,
                      @Param("from") LocalDate from,
                      @Param("to") LocalDate to);
}

package com.roamstead.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.LocalDate;

/**
 * Booked-room counter for one room type on one night.
 * A night is the date the guest sleeps there, so a stay from 10 to 12 uses
 * the nights of the 10th and the 11th (check-out day is not counted).
 */
@Entity
@Table(name = "room_inventory")
public class RoomInventory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "room_type_id", nullable = false)
    private Long roomTypeId;

    @Column(name = "stay_date", nullable = false)
    private LocalDate stayDate;

    @Column(name = "total_rooms", nullable = false)
    private int totalRooms;

    @Column(name = "booked_rooms", nullable = false)
    private int bookedRooms;

    protected RoomInventory() {
    }

    public RoomInventory(Long roomTypeId, LocalDate stayDate, int totalRooms, int bookedRooms) {
        this.roomTypeId = roomTypeId;
        this.stayDate = stayDate;
        this.totalRooms = totalRooms;
        this.bookedRooms = bookedRooms;
    }

    public Long getId() { return id; }
    public Long getRoomTypeId() { return roomTypeId; }
    public LocalDate getStayDate() { return stayDate; }
    public int getTotalRooms() { return totalRooms; }
    public int getBookedRooms() { return bookedRooms; }

    public int getAvailableRooms() {
        return Math.max(0, totalRooms - bookedRooms);
    }
}

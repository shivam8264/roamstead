package com.roamstead.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import java.math.BigDecimal;

/** A bookable room category. Each hotel has one in the sample data. */
@Entity
@Table(name = "room_type")
public class RoomType {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "hotel_id", nullable = false)
    private Hotel hotel;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false, length = 500)
    private String description;

    @Column(name = "max_guests", nullable = false)
    private int maxGuests;

    @Column(name = "bed_type", nullable = false, length = 60)
    private String bedType;

    @Column(name = "size_sqm", nullable = false)
    private int sizeSqm;

    @Column(name = "price_per_night", nullable = false, precision = 10, scale = 2)
    private BigDecimal pricePerNight;

    @Column(name = "total_rooms", nullable = false)
    private int totalRooms;

    protected RoomType() {
    }

    public RoomType(Hotel hotel, String name, String description, int maxGuests, String bedType,
                    int sizeSqm, BigDecimal pricePerNight, int totalRooms) {
        this.hotel = hotel;
        this.name = name;
        this.description = description;
        this.maxGuests = maxGuests;
        this.bedType = bedType;
        this.sizeSqm = sizeSqm;
        this.pricePerNight = pricePerNight;
        this.totalRooms = totalRooms;
    }

    public Long getId() { return id; }
    public Hotel getHotel() { return hotel; }
    public String getName() { return name; }
    public String getDescription() { return description; }
    public int getMaxGuests() { return maxGuests; }
    public String getBedType() { return bedType; }
    public int getSizeSqm() { return sizeSqm; }
    public BigDecimal getPricePerNight() { return pricePerNight; }
    public int getTotalRooms() { return totalRooms; }

    /** Test helper. */
    public void setId(Long id) { this.id = id; }
}

package com.roamstead.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/** Response shapes for hotel browsing. */
public final class HotelDtos {

    private HotelDtos() {
    }

    /** One card in the hotel list. {@code availableRooms} is null when no dates were given. */
    public record HotelSummary(Long id,
                               String name,
                               String city,
                               String region,
                               String tagline,
                               int starRating,
                               String coverImage,
                               List<String> amenities,
                               String roomTypeName,
                               BigDecimal pricePerNight,
                               int totalRooms,
                               Integer availableRooms,
                               Integer nights,
                               BigDecimal stayTotal) { }

    public record Room(Long id,
                       String name,
                       String description,
                       int maxGuests,
                       String bedType,
                       int sizeSqm,
                       BigDecimal pricePerNight,
                       int totalRooms,
                       Integer availableRooms) { }

    public record HotelDetail(Long id,
                              String name,
                              String city,
                              String region,
                              String address,
                              String tagline,
                              String description,
                              int starRating,
                              String coverImage,
                              List<String> images,
                              List<String> amenities,
                              List<Room> rooms,
                              LocalDate checkIn,
                              LocalDate checkOut,
                              Integer nights) { }
}

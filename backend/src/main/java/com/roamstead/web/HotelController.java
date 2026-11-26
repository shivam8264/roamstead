package com.roamstead.web;

import com.roamstead.dto.AvailabilityDtos.Calendar;
import com.roamstead.dto.AvailabilityDtos.FlexDates;
import com.roamstead.dto.BookingDtos.Quote;
import com.roamstead.dto.HotelDtos.HotelDetail;
import com.roamstead.dto.HotelDtos.HotelSummary;
import com.roamstead.service.BookingService;
import com.roamstead.service.FlexDateService;
import com.roamstead.service.HotelService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

import static org.springframework.format.annotation.DateTimeFormat.ISO.DATE;

@RestController
@RequestMapping("/api/hotels")
public class HotelController {

    private final HotelService hotels;
    private final BookingService bookings;
    private final FlexDateService flexDates;

    public HotelController(HotelService hotels, BookingService bookings, FlexDateService flexDates) {
        this.hotels = hotels;
        this.bookings = bookings;
        this.flexDates = flexDates;
    }

    /** Browse or search hotels. With dates, each result includes rooms left and the stay total. */
    @GetMapping
    public List<HotelSummary> search(@RequestParam(required = false) String location,
                                     @RequestParam(required = false) @DateTimeFormat(iso = DATE) LocalDate checkIn,
                                     @RequestParam(required = false) @DateTimeFormat(iso = DATE) LocalDate checkOut) {
        return hotels.search(location, checkIn, checkOut);
    }

    /** Distinct cities, used for the location suggestions in the search bar. */
    @GetMapping("/locations")
    public List<String> locations() {
        return hotels.locations();
    }

    @GetMapping("/{hotelId}")
    public HotelDetail detail(@PathVariable Long hotelId,
                              @RequestParam(required = false) @DateTimeFormat(iso = DATE) LocalDate checkIn,
                              @RequestParam(required = false) @DateTimeFormat(iso = DATE) LocalDate checkOut) {
        return hotels.detail(hotelId, checkIn, checkOut);
    }

    /** Server-side price and availability for a stay, shown before the guest confirms. */
    @GetMapping("/{hotelId}/quote")
    public Quote quote(@PathVariable Long hotelId,
                       @RequestParam(required = false) Long roomTypeId,
                       @RequestParam @DateTimeFormat(iso = DATE) LocalDate checkIn,
                       @RequestParam @DateTimeFormat(iso = DATE) LocalDate checkOut) {
        return bookings.quote(hotelId, roomTypeId, checkIn, checkOut);
    }

    /** Flex Dates: rooms left per night. */
    @GetMapping("/{hotelId}/calendar")
    public Calendar calendar(@PathVariable Long hotelId,
                             @RequestParam(required = false) @DateTimeFormat(iso = DATE) LocalDate from,
                             @RequestParam(defaultValue = "28") int days) {
        return flexDates.calendar(hotelId, from, days);
    }

    /** Flex Dates: nearest alternative stays of the same length that still have a room. */
    @GetMapping("/{hotelId}/flex-dates")
    public FlexDates flex(@PathVariable Long hotelId,
                          @RequestParam @DateTimeFormat(iso = DATE) LocalDate checkIn,
                          @RequestParam @DateTimeFormat(iso = DATE) LocalDate checkOut) {
        return flexDates.suggest(hotelId, checkIn, checkOut);
    }
}

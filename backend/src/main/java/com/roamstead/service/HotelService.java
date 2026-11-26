package com.roamstead.service;

import com.roamstead.domain.Hotel;
import com.roamstead.domain.RoomType;
import com.roamstead.dto.HotelDtos.HotelDetail;
import com.roamstead.dto.HotelDtos.HotelSummary;
import com.roamstead.dto.HotelDtos.Room;
import com.roamstead.exception.Errors;
import com.roamstead.repository.HotelRepository;
import com.roamstead.repository.RoomTypeRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
@Transactional(readOnly = true)
public class HotelService {

    private final HotelRepository hotels;
    private final RoomTypeRepository roomTypes;
    private final AvailabilityService availability;
    private final PricingService pricing;
    private final StayDatesValidator stayDates;

    public HotelService(HotelRepository hotels, RoomTypeRepository roomTypes, AvailabilityService availability,
                        PricingService pricing, StayDatesValidator stayDates) {
        this.hotels = hotels;
        this.roomTypes = roomTypes;
        this.availability = availability;
        this.pricing = pricing;
        this.stayDates = stayDates;
    }

    /** Lists hotels, optionally filtered by location and annotated with availability for the dates. */
    public List<HotelSummary> search(String location, LocalDate checkIn, LocalDate checkOut) {
        Integer nights = stayDates.validateOptional(checkIn, checkOut);
        List<Hotel> found = StringUtils.hasText(location)
                ? hotels.search(location.trim())
                : hotels.findAllByOrderByNameAsc();

        List<RoomType> primaryRooms = found.stream()
                .map(this::primaryRoomOf)
                .toList();
        Map<Long, Integer> free = nights == null
                ? Map.of()
                : availability.availableRooms(primaryRooms, checkIn, checkOut);

        List<HotelSummary> result = new ArrayList<>();
        for (int i = 0; i < found.size(); i++) {
            Hotel h = found.get(i);
            RoomType room = primaryRooms.get(i);
            BigDecimal stayTotal = nights == null ? null : pricing.total(room.getPricePerNight(), nights);
            result.add(new HotelSummary(h.getId(), h.getName(), h.getCity(), h.getRegion(), h.getTagline(),
                    h.getStarRating(), h.getCoverImage(), List.copyOf(h.getAmenities()),
                    room.getName(), room.getPricePerNight(), room.getTotalRooms(),
                    free.get(room.getId()), nights, stayTotal));
        }
        return result;
    }

    public HotelDetail detail(Long hotelId, LocalDate checkIn, LocalDate checkOut) {
        Integer nights = stayDates.validateOptional(checkIn, checkOut);
        Hotel h = getHotel(hotelId);
        List<Room> rooms = h.getRoomTypes().stream()
                .map(rt -> new Room(rt.getId(), rt.getName(), rt.getDescription(), rt.getMaxGuests(),
                        rt.getBedType(), rt.getSizeSqm(), rt.getPricePerNight(), rt.getTotalRooms(),
                        nights == null ? null : availability.availableRooms(rt, checkIn, checkOut)))
                .toList();
        return new HotelDetail(h.getId(), h.getName(), h.getCity(), h.getRegion(), h.getAddress(),
                h.getTagline(), h.getDescription(), h.getStarRating(), h.getCoverImage(),
                List.copyOf(h.getImages()), List.copyOf(h.getAmenities()), rooms,
                checkIn, checkOut, nights);
    }

    public List<String> locations() {
        return hotels.findDistinctCities();
    }

    public Hotel getHotel(Long hotelId) {
        return hotels.findById(hotelId)
                .orElseThrow(() -> new Errors.NotFound("We couldn't find that hotel."));
    }

    /**
     * Resolves the room to book: the requested category if given (and it belongs
     * to the hotel), otherwise the hotel's first and only category.
     */
    public RoomType resolveRoomType(Long hotelId, Long roomTypeId) {
        getHotel(hotelId);
        if (roomTypeId != null) {
            return roomTypes.findByIdAndHotelId(roomTypeId, hotelId)
                    .orElseThrow(() -> new Errors.NotFound("That room is not offered by this hotel."));
        }
        return roomTypes.findFirstByHotelIdOrderByIdAsc(hotelId)
                .orElseThrow(() -> new Errors.NotFound("This hotel has no rooms to book yet."));
    }

    private RoomType primaryRoomOf(Hotel hotel) {
        if (hotel.getRoomTypes().isEmpty()) {
            throw new IllegalStateException("Hotel " + hotel.getId() + " has no room types");
        }
        return hotel.getRoomTypes().get(0);
    }
}

package com.roamstead.dto;

import com.roamstead.domain.BookingStatus;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/** Request and response shapes for quoting, booking and cancelling. */
public final class BookingDtos {

    private BookingDtos() {
    }

    public record CreateBookingRequest(
            @NotNull(message = "Choose a hotel.")
            Long hotelId,

            /* Optional: defaults to the hotel's (single) room category. */
            Long roomTypeId,

            @NotNull(message = "Choose a check-in date.")
            LocalDate checkIn,

            @NotNull(message = "Choose a check-out date.")
            LocalDate checkOut,

            @NotBlank(message = "Enter the guest's full name.")
            @Size(min = 2, max = 100, message = "Name must be between 2 and 100 characters.")
            @Pattern(regexp = "^[\\p{L} .'-]+$",
                    message = "Name can contain letters, spaces, apostrophes, dots and hyphens only.")
            String guestName,

            @NotBlank(message = "Enter an email address.")
            @Email(message = "Enter a valid email address.")
            @Size(max = 160, message = "Email must be 160 characters or fewer.")
            String guestEmail) { }

    public record CancelBookingRequest(
            @NotBlank(message = "Enter the email used for the booking.")
            @Email(message = "Enter a valid email address.")
            String email) { }

    /** Price and availability shown to the guest before they confirm. */
    public record Quote(Long hotelId,
                        String hotelName,
                        Long roomTypeId,
                        String roomTypeName,
                        LocalDate checkIn,
                        LocalDate checkOut,
                        int nights,
                        BigDecimal pricePerNight,
                        BigDecimal totalAmount,
                        int availableRooms,
                        boolean available) { }

    public record BookingResponse(String reference,
                                  BookingStatus status,
                                  Long hotelId,
                                  String hotelName,
                                  String hotelCity,
                                  String hotelAddress,
                                  String coverImage,
                                  String roomTypeName,
                                  String guestName,
                                  String guestEmail,
                                  LocalDate checkIn,
                                  LocalDate checkOut,
                                  int nights,
                                  BigDecimal pricePerNight,
                                  BigDecimal totalAmount,
                                  LocalDateTime createdAt,
                                  LocalDateTime cancelledAt,
                                  boolean cancellable) { }
}

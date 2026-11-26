package com.roamstead.web;

import com.roamstead.dto.BookingDtos.BookingResponse;
import com.roamstead.dto.BookingDtos.CancelBookingRequest;
import com.roamstead.dto.BookingDtos.CreateBookingRequest;
import com.roamstead.service.BookingService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;

@RestController
@RequestMapping("/api/bookings")
public class BookingController {

    private final BookingService bookings;

    public BookingController(BookingService bookings) {
        this.bookings = bookings;
    }

    /** Books one room. Returns 201 with the booking and its reference. */
    @PostMapping
    public ResponseEntity<BookingResponse> create(@Valid @RequestBody CreateBookingRequest request) {
        BookingResponse created = bookings.create(request);
        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{reference}").buildAndExpand(created.reference()).toUri();
        return ResponseEntity.created(location).body(created);
    }

    /** Looks up a booking. The email must match the one used when booking. */
    @GetMapping("/{reference}")
    public BookingResponse find(@PathVariable String reference, @RequestParam String email) {
        return bookings.find(reference, email);
    }

    @PostMapping("/{reference}/cancel")
    public BookingResponse cancel(@PathVariable String reference,
                                  @Valid @RequestBody CancelBookingRequest request) {
        return bookings.cancel(reference, request.email());
    }
}

package com.roamstead.exception;

import org.springframework.http.HttpStatus;

/** The concrete failures the API can report. */
public final class Errors {

    private Errors() {
    }

    public static class NotFound extends ApiException {
        public NotFound(String message) {
            super(HttpStatus.NOT_FOUND, "NOT_FOUND", message);
        }
    }

    public static class InvalidStay extends ApiException {
        public InvalidStay(String message) {
            super(HttpStatus.BAD_REQUEST, "INVALID_DATES", message);
        }
    }

    public static class InvalidRequest extends ApiException {
        public InvalidRequest(String message) {
            super(HttpStatus.BAD_REQUEST, "INVALID_REQUEST", message);
        }
    }

    public static class RoomUnavailable extends ApiException {
        public RoomUnavailable(String message) {
            super(HttpStatus.CONFLICT, "ROOM_UNAVAILABLE", message);
        }
    }

    public static class AlreadyCancelled extends ApiException {
        public AlreadyCancelled(String reference) {
            super(HttpStatus.CONFLICT, "ALREADY_CANCELLED",
                    "Booking " + reference + " has already been cancelled.");
        }
    }

    public static class CancellationClosed extends ApiException {
        public CancellationClosed() {
            super(HttpStatus.CONFLICT, "CANCELLATION_CLOSED",
                    "This stay has already started, so it can no longer be cancelled online.");
        }
    }
}

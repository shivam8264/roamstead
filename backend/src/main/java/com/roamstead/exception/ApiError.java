package com.roamstead.exception;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.Instant;
import java.util.List;

/**
 * The single error shape returned by every endpoint.
 * <pre>
 * { "timestamp": "...", "status": 409, "error": "Conflict",
 *   "code": "ROOM_UNAVAILABLE", "message": "...", "path": "/api/bookings",
 *   "fieldErrors": [ { "field": "guestEmail", "message": "..." } ] }
 * </pre>
 */
@JsonInclude(JsonInclude.Include.NON_EMPTY)
public record ApiError(Instant timestamp,
                       int status,
                       String error,
                       String code,
                       String message,
                       String path,
                       List<FieldError> fieldErrors) {

    public record FieldError(String field, String message) { }
}

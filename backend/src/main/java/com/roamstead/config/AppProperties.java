package com.roamstead.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;

import java.util.List;

/**
 * Typed view of the {@code roamstead.*} settings in application.yml.
 */
@ConfigurationProperties(prefix = "roamstead")
public record AppProperties(
        @DefaultValue("Asia/Kolkata") String timezone,
        @DefaultValue Cors cors,
        @DefaultValue Booking booking,
        @DefaultValue Flex flex) {

    public record Cors(@DefaultValue("http://localhost:4200") List<String> allowedOrigins) { }

    /** Limits applied to every stay request. */
    public record Booking(@DefaultValue("30") int maxNights,
                          @DefaultValue("365") int maxDaysAhead) { }

    /** Settings for the Flex Dates feature. */
    public record Flex(@DefaultValue("7") int searchWindowDays,
                       @DefaultValue("4") int maxSuggestions) { }
}

package com.roamstead.service;

import com.roamstead.config.AppProperties;
import com.roamstead.domain.Hotel;
import com.roamstead.domain.RoomType;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;

/** Shared builders for unit tests. "Today" is fixed at 1 Dec 2026. */
final class TestFixtures {

    static final ZoneId ZONE = ZoneId.of("Asia/Kolkata");
    static final LocalDate TODAY = LocalDate.of(2026, 12, 1);
    static final Clock CLOCK = Clock.fixed(TODAY.atStartOfDay(ZONE).plusHours(10).toInstant(), ZONE);

    static final AppProperties PROPS = new AppProperties("Asia/Kolkata",
            new AppProperties.Cors(List.of("http://localhost:4200")),
            new AppProperties.Booking(30, 365),
            new AppProperties.Flex(7, 4));

    private TestFixtures() {
    }

    static Hotel hotel() {
        Hotel h = new Hotel("Lakeshore Mahal", "Udaipur", "Rajasthan", "Lal Ghat", "Lake views",
                "A palace hotel", 5, "cover.jpg");
        h.setId(6L);
        return h;
    }

    static RoomType room(int totalRooms, String price) {
        RoomType rt = new RoomType(hotel(), "Jharokha Lake Suite", "Suite", 2, "King bed", 40,
                new BigDecimal(price), totalRooms);
        rt.setId(60L);
        return rt;
    }

    static StayDatesValidator validator() {
        return new StayDatesValidator(CLOCK, PROPS);
    }
}

-- Roamstead schema (MySQL 8.0.16+; CHECK constraints are enforced from 8.0.16)

CREATE TABLE hotel (
    id           BIGINT        NOT NULL AUTO_INCREMENT,
    name         VARCHAR(120)  NOT NULL,
    city         VARCHAR(80)   NOT NULL,
    region       VARCHAR(80)   NOT NULL,
    address      VARCHAR(255)  NOT NULL,
    tagline      VARCHAR(160)  NOT NULL,
    description  VARCHAR(2000) NOT NULL,
    star_rating  INT           NOT NULL,
    cover_image  VARCHAR(500)  NOT NULL,
    created_at   TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT uq_hotel_name_city UNIQUE (name, city),
    CONSTRAINT ck_hotel_stars CHECK (star_rating BETWEEN 1 AND 5),
    INDEX ix_hotel_city (city)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

CREATE TABLE hotel_amenity (
    hotel_id  BIGINT       NOT NULL,
    amenity   VARCHAR(60)  NOT NULL,
    PRIMARY KEY (hotel_id, amenity),
    CONSTRAINT fk_amenity_hotel FOREIGN KEY (hotel_id) REFERENCES hotel (id) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

CREATE TABLE hotel_image (
    hotel_id  BIGINT        NOT NULL,
    position  INT           NOT NULL,
    url       VARCHAR(500)  NOT NULL,
    PRIMARY KEY (hotel_id, position),
    CONSTRAINT fk_image_hotel FOREIGN KEY (hotel_id) REFERENCES hotel (id) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

-- One category per hotel is seeded, but the model supports several.
CREATE TABLE room_type (
    id               BIGINT         NOT NULL AUTO_INCREMENT,
    hotel_id         BIGINT         NOT NULL,
    name             VARCHAR(100)   NOT NULL,
    description      VARCHAR(500)   NOT NULL,
    max_guests       INT            NOT NULL,
    bed_type         VARCHAR(60)    NOT NULL,
    size_sqm         INT            NOT NULL,
    price_per_night  DECIMAL(10, 2) NOT NULL,
    total_rooms      INT            NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_room_type_hotel FOREIGN KEY (hotel_id) REFERENCES hotel (id) ON DELETE CASCADE,
    CONSTRAINT uq_room_type_name UNIQUE (hotel_id, name),
    CONSTRAINT ck_room_price CHECK (price_per_night > 0),
    CONSTRAINT ck_room_total CHECK (total_rooms > 0),
    CONSTRAINT ck_room_guests CHECK (max_guests > 0)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

-- One row per room type per night. Rows are created lazily the first time a
-- night is booked; a missing row means "nothing booked yet".
CREATE TABLE room_inventory (
    id            BIGINT  NOT NULL AUTO_INCREMENT,
    room_type_id  BIGINT  NOT NULL,
    stay_date     DATE    NOT NULL,
    total_rooms   INT     NOT NULL,
    booked_rooms  INT     NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    CONSTRAINT fk_inventory_room_type FOREIGN KEY (room_type_id) REFERENCES room_type (id) ON DELETE CASCADE,
    CONSTRAINT uq_inventory_night UNIQUE (room_type_id, stay_date),
    CONSTRAINT ck_inventory_bounds CHECK (booked_rooms >= 0 AND booked_rooms <= total_rooms)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

CREATE TABLE booking (
    id               BIGINT         NOT NULL AUTO_INCREMENT,
    reference        VARCHAR(12)    NOT NULL,
    hotel_id         BIGINT         NOT NULL,
    room_type_id     BIGINT         NOT NULL,
    guest_name       VARCHAR(100)   NOT NULL,
    guest_email      VARCHAR(160)   NOT NULL,
    check_in         DATE           NOT NULL,
    check_out        DATE           NOT NULL,
    nights           INT            NOT NULL,
    price_per_night  DECIMAL(10, 2) NOT NULL,
    total_amount     DECIMAL(12, 2) NOT NULL,
    status           VARCHAR(16)    NOT NULL,
    created_at       TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    cancelled_at     TIMESTAMP      NULL,
    PRIMARY KEY (id),
    CONSTRAINT uq_booking_reference UNIQUE (reference),
    CONSTRAINT fk_booking_hotel FOREIGN KEY (hotel_id) REFERENCES hotel (id),
    CONSTRAINT fk_booking_room_type FOREIGN KEY (room_type_id) REFERENCES room_type (id),
    CONSTRAINT ck_booking_dates CHECK (check_out > check_in),
    CONSTRAINT ck_booking_nights CHECK (nights > 0),
    CONSTRAINT ck_booking_status CHECK (status IN ('CONFIRMED', 'CANCELLED')),
    INDEX ix_booking_email (guest_email),
    INDEX ix_booking_stay (room_type_id, check_in, check_out)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

package com.roamstead.repository;

import com.roamstead.domain.RoomType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface RoomTypeRepository extends JpaRepository<RoomType, Long> {

    Optional<RoomType> findFirstByHotelIdOrderByIdAsc(Long hotelId);

    Optional<RoomType> findByIdAndHotelId(Long id, Long hotelId);
}

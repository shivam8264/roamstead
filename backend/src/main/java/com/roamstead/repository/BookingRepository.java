package com.roamstead.repository;

import com.roamstead.domain.Booking;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface BookingRepository extends JpaRepository<Booking, Long> {

    boolean existsByReference(String reference);

    @Query("""
            select b from Booking b join fetch b.hotel join fetch b.roomType
            where b.reference = :reference
            """)
    Optional<Booking> findByReference(@Param("reference") String reference);

    /** Row lock so that two cancel requests cannot both release the same nights. */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select b from Booking b where b.reference = :reference")
    Optional<Booking> findByReferenceForUpdate(@Param("reference") String reference);
}

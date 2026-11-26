package com.roamstead.repository;

import com.roamstead.domain.Hotel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface HotelRepository extends JpaRepository<Hotel, Long> {

    /** Matches the search text against city, region or hotel name (case-insensitive). */
    @Query("""
            select h from Hotel h
            where lower(h.city) like lower(concat('%', :q, '%'))
               or lower(h.region) like lower(concat('%', :q, '%'))
               or lower(h.name) like lower(concat('%', :q, '%'))
            order by h.name
            """)
    List<Hotel> search(@Param("q") String query);

    List<Hotel> findAllByOrderByNameAsc();

    @Query("select distinct h.city from Hotel h order by h.city")
    List<String> findDistinctCities();
}

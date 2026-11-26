package com.roamstead.domain;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.OrderColumn;
import jakarta.persistence.Table;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

@Entity
@Table(name = "hotel")
public class Hotel {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 120)
    private String name;

    @Column(nullable = false, length = 80)
    private String city;

    @Column(nullable = false, length = 80)
    private String region;

    @Column(nullable = false)
    private String address;

    @Column(nullable = false, length = 160)
    private String tagline;

    @Column(nullable = false, length = 2000)
    private String description;

    @Column(name = "star_rating", nullable = false)
    private int starRating;

    @Column(name = "cover_image", nullable = false, length = 500)
    private String coverImage;

    @ElementCollection
    @CollectionTable(name = "hotel_amenity", joinColumns = @JoinColumn(name = "hotel_id"))
    @Column(name = "amenity", nullable = false, length = 60)
    @OrderBy
    private Set<String> amenities = new LinkedHashSet<>();

    @ElementCollection
    @CollectionTable(name = "hotel_image", joinColumns = @JoinColumn(name = "hotel_id"))
    @OrderColumn(name = "position")
    @Column(name = "url", nullable = false, length = 500)
    private List<String> images = new ArrayList<>();

    @OneToMany(mappedBy = "hotel")
    @OrderBy("id")
    private List<RoomType> roomTypes = new ArrayList<>();

    protected Hotel() {
    }

    public Hotel(String name, String city, String region, String address, String tagline,
                 String description, int starRating, String coverImage) {
        this.name = name;
        this.city = city;
        this.region = region;
        this.address = address;
        this.tagline = tagline;
        this.description = description;
        this.starRating = starRating;
        this.coverImage = coverImage;
    }

    public Long getId() { return id; }
    public String getName() { return name; }
    public String getCity() { return city; }
    public String getRegion() { return region; }
    public String getAddress() { return address; }
    public String getTagline() { return tagline; }
    public String getDescription() { return description; }
    public int getStarRating() { return starRating; }
    public String getCoverImage() { return coverImage; }
    public Set<String> getAmenities() { return amenities; }
    public List<String> getImages() { return images; }
    public List<RoomType> getRoomTypes() { return roomTypes; }

    /** Test helper: entities are normally created by the seed migration. */
    public void setId(Long id) { this.id = id; }
}

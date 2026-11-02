package com.example.roadmaintenance.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "locations")
public class LocationEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name;

    @Column(nullable = false, columnDefinition = "double default 11.2742")
    private double latitude = 11.2742;

    @Column(nullable = false, columnDefinition = "double default 77.6070")
    private double longitude = 77.6070;

    public LocationEntity() {
    }

    public LocationEntity(String name) {
        this.name = name;
        applyDefaultCoordinates(name);
    }

    public LocationEntity(String name, double latitude, double longitude) {
        this.name = name;
        this.latitude = latitude;
        this.longitude = longitude;
    }

    public void applyDefaultCoordinates(String locName) {
        if (locName == null) return;
        String lower = locName.toLowerCase().trim();
        if (lower.contains("kongu")) {
            this.latitude = 11.2742;
            this.longitude = 77.6070;
        } else if (lower.contains("erode") && lower.contains("bus")) {
            this.latitude = 11.3400;
            this.longitude = 77.7172;
        } else if (lower.contains("bus") || lower.contains("stand")) {
            this.latitude = 11.2789;
            this.longitude = 77.5843;
        } else if (lower.contains("railway") || lower.contains("junction") || lower.contains("station")) {
            this.latitude = 11.3284;
            this.longitude = 77.7275;
        } else if (lower.contains("collectorate")) {
            this.latitude = 11.3340;
            this.longitude = 77.7100;
        } else if (lower.contains("thindal")) {
            this.latitude = 11.3145;
            this.longitude = 77.6740;
        } else if (lower.contains("bhavani")) {
            this.latitude = 11.4420;
            this.longitude = 77.6830;
        } else if (lower.contains("solar")) {
            this.latitude = 11.2980;
            this.longitude = 77.7420;
        } else {
            // Distinct deterministically scattered municipal coordinates within metropolitan radius
            int hash = Math.abs(lower.hashCode());
            this.latitude = 11.2600 + (hash % 1000) * 0.00012;
            this.longitude = 77.5700 + ((hash / 1000) % 1000) * 0.00015;
        }
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public double getLatitude() {
        return latitude;
    }

    public void setLatitude(double latitude) {
        this.latitude = latitude;
    }

    public double getLongitude() {
        return longitude;
    }

    public void setLongitude(double longitude) {
        this.longitude = longitude;
    }
}

package com.example.roadmaintenance.dto;

public record LocationDto(
        Long id,
        String name,
        double latitude,
        double longitude
) {
}

package com.example.roadmaintenance.dto;

public record RoadDto(Long id, String source, String destination, int travelTime, boolean closed) {
}

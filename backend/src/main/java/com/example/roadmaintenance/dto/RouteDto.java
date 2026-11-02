package com.example.roadmaintenance.dto;

import java.util.List;

public record RouteDto(
        String from,
        String to,
        List<String> path,
        int travelTime,
        boolean reachable,
        List<LocationDto> pathLocations
) {
    public RouteDto(String from, String to, List<String> path, int travelTime, boolean reachable) {
        this(from, to, path, travelTime, reachable, List.of());
    }
}

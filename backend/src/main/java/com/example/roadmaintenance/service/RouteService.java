package com.example.roadmaintenance.service;

import com.example.roadmaintenance.algorithm.PathResult;
import com.example.roadmaintenance.algorithm.RoadNetwork;
import com.example.roadmaintenance.dto.LocationDto;
import com.example.roadmaintenance.dto.RouteDto;
import com.example.roadmaintenance.entity.LocationEntity;
import com.example.roadmaintenance.repository.LocationRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@Service
public class RouteService {

    private final RoadService roadService;
    private final LocationRepository locationRepository;

    public RouteService(RoadService roadService, LocationRepository locationRepository) {
        this.roadService = roadService;
        this.locationRepository = locationRepository;
    }

    public RouteDto findRoute(String from, String to) {
        if (from == null || to == null || from.isBlank() || to.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Source and destination are required.");
        }
        String normalizedFrom = from.trim();
        String normalizedTo = to.trim();

        if (locationRepository.findByNameIgnoreCase(normalizedFrom) == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Source location '" + normalizedFrom + "' does not exist.");
        }
        if (locationRepository.findByNameIgnoreCase(normalizedTo) == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Destination location '" + normalizedTo + "' does not exist.");
        }

        RoadNetwork network = roadService.buildNetwork();
        PathResult result = network.dijkstra(normalizedFrom, normalizedTo);
        if (!result.isReachable()) {
            return new RouteDto(normalizedFrom, normalizedTo, Collections.emptyList(), 0, false, Collections.emptyList());
        }

        List<LocationDto> pathLocations = new ArrayList<>();
        for (String step : result.getPath()) {
            LocationEntity entity = locationRepository.findByNameIgnoreCase(step);
            if (entity != null) {
                pathLocations.add(new LocationDto(entity.getId(), entity.getName(), entity.getLatitude(), entity.getLongitude()));
            } else {
                LocationEntity fallback = new LocationEntity(step);
                pathLocations.add(new LocationDto(null, step, fallback.getLatitude(), fallback.getLongitude()));
            }
        }

        return new RouteDto(normalizedFrom, normalizedTo, result.getPath(), result.getTravelTime(), true, pathLocations);
    }
}

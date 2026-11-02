package com.example.roadmaintenance.service;

import com.example.roadmaintenance.algorithm.RoadNetwork;
import com.example.roadmaintenance.dto.RoadDto;
import com.example.roadmaintenance.entity.RoadEntity;
import com.example.roadmaintenance.repository.LocationRepository;
import com.example.roadmaintenance.repository.RoadRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.List;

@Service
public class RoadService {

    private final RoadRepository roadRepository;
    private final LocationRepository locationRepository;

    public RoadService(RoadRepository roadRepository, LocationRepository locationRepository) {
        this.roadRepository = roadRepository;
        this.locationRepository = locationRepository;
    }

    public List<RoadDto> getAllRoads() {
        return roadRepository.findAll().stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional
    public RoadDto createRoad(String source, String destination, int travelTime) {
        String from = normalize(source);
        String to = normalize(destination);
        if (from.isEmpty() || to.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Road endpoints are required.");
        }
        if (from.equalsIgnoreCase(to)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Road cannot connect a location to itself.");
        }
        if (travelTime <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Travel time must be positive.");
        }
        if (locationRepository.findByNameIgnoreCase(from) == null || locationRepository.findByNameIgnoreCase(to) == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Both locations must already exist.");
        }
        if (roadRepository.existsBySourceAndDestinationAndTravelTime(from, to, travelTime)
                || roadRepository.existsBySourceAndDestinationAndTravelTime(to, from, travelTime)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Exact duplicate road already exists.");
        }

        RoadEntity saved = roadRepository.save(new RoadEntity(from, to, travelTime));
        return toDto(saved);
    }

    @Transactional
    public RoadDto closeRoad(Long id) {
        RoadEntity road = roadRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Road not found."));
        road.setClosed(true);
        roadRepository.save(road);
        return toDto(road);
    }

    @Transactional
    public RoadDto openRoad(Long id) {
        RoadEntity road = roadRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Road not found."));
        road.setClosed(false);
        roadRepository.save(road);
        return toDto(road);
    }

    public RoadNetwork buildNetwork() {
        RoadNetwork network = new RoadNetwork();
        for (var location : locationRepository.findAll()) {
            network.addLocation(location.getName());
        }
        for (RoadEntity road : roadRepository.findAll()) {
            network.addRoad(road.getSource(), road.getDestination(), road.getTravelTime());
            if (road.isClosed()) {
                network.closeRoad(road.getSource(), road.getDestination());
            }
        }
        return network;
    }

    public List<String> findClosedRoadKeys() {
        List<String> keys = new ArrayList<>();
        for (RoadEntity road : roadRepository.findByClosed(true)) {
            keys.add(road.getSource() + " <-> " + road.getDestination());
        }
        return keys;
    }

    private RoadDto toDto(RoadEntity road) {
        return new RoadDto(road.getId(), road.getSource(), road.getDestination(), road.getTravelTime(), road.isClosed());
    }

    private String normalize(String value) {
        return value == null ? "" : value.trim();
    }
}

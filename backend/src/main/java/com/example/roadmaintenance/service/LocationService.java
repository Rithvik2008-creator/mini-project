package com.example.roadmaintenance.service;

import com.example.roadmaintenance.dto.LocationDto;
import com.example.roadmaintenance.entity.LocationEntity;
import com.example.roadmaintenance.repository.LocationRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class LocationService {

    private final LocationRepository locationRepository;

    public LocationService(LocationRepository locationRepository) {
        this.locationRepository = locationRepository;
    }

    public List<LocationDto> getAllLocations() {
        return locationRepository.findAll().stream()
                .map(this::toDto)
                .toList();
    }

    public LocationDto createLocation(String name) {
        String normalized = normalizeName(name);
        if (normalized.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Location name is required.");
        }
        if (locationRepository.existsByNameIgnoreCase(normalized)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Location already exists.");
        }
        LocationEntity entity = new LocationEntity(normalized);
        LocationEntity saved = locationRepository.save(entity);
        return toDto(saved);
    }

    public LocationDto toDto(LocationEntity entity) {
        return new LocationDto(entity.getId(), entity.getName(), entity.getLatitude(), entity.getLongitude());
    }

    private String normalizeName(String name) {
        return name == null ? "" : name.trim();
    }
}

package com.example.roadmaintenance.controller;

import com.example.roadmaintenance.dto.LocationDto;
import com.example.roadmaintenance.service.LocationService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(originPatterns = "*")
@RestController
@RequestMapping("/api")
public class LocationsController {

    private final LocationService locationService;

    public LocationsController(LocationService locationService) {
        this.locationService = locationService;
    }

    @GetMapping("/locations")
    public List<LocationDto> getLocations() {
        return locationService.getAllLocations();
    }

    @PostMapping("/locations")
    public LocationDto createLocation(@RequestBody LocationDto request) {
        return locationService.createLocation(request.name());
    }
}

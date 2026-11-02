package com.example.roadmaintenance.controller;

import com.example.roadmaintenance.dto.RoadDto;
import com.example.roadmaintenance.security.RequireRole;
import com.example.roadmaintenance.security.UserRole;
import com.example.roadmaintenance.service.RoadService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(originPatterns = "*")
@RestController
@RequestMapping("/api")
public class RoadsController {

    private final RoadService roadService;

    public RoadsController(RoadService roadService) {
        this.roadService = roadService;
    }

    @GetMapping("/roads")
    public List<RoadDto> getRoads() {
        return roadService.getAllRoads();
    }

    @RequireRole(UserRole.ADMIN)
    @PostMapping("/roads")
    public RoadDto createRoad(@RequestBody RoadDto request) {
        return roadService.createRoad(request.source(), request.destination(), request.travelTime());
    }

    @RequireRole(UserRole.ADMIN)
    @PatchMapping("/roads/{roadId}/close")
    public RoadDto closeRoad(@PathVariable Long roadId) {
        return roadService.closeRoad(roadId);
    }

    @RequireRole(UserRole.ADMIN)
    @PatchMapping("/roads/{roadId}/open")
    public RoadDto openRoad(@PathVariable Long roadId) {
        return roadService.openRoad(roadId);
    }
}

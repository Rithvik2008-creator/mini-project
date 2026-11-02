package com.example.roadmaintenance.controller;

import com.example.roadmaintenance.dto.RouteDto;
import com.example.roadmaintenance.service.RouteService;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@CrossOrigin(originPatterns = "*")
@RestController
@RequestMapping("/api")
public class RouteController {

    private final RouteService routeService;

    public RouteController(RouteService routeService) {
        this.routeService = routeService;
    }

    @GetMapping("/routes")
    public RouteDto getRoute(@RequestParam String from, @RequestParam String to) {
        return routeService.findRoute(from, to);
    }
}

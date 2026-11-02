package com.example.roadmaintenance.controller;

import com.example.roadmaintenance.dto.CreateTeamRequest;
import com.example.roadmaintenance.dto.TeamDto;
import com.example.roadmaintenance.security.RequireRole;
import com.example.roadmaintenance.security.UserRole;
import com.example.roadmaintenance.service.TeamService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(originPatterns = "*")
@RestController
@RequestMapping("/api")
public class TeamsController {

    private final TeamService teamService;

    public TeamsController(TeamService teamService) {
        this.teamService = teamService;
    }

    @GetMapping("/teams")
    public List<TeamDto> getTeams() {
        return teamService.getAllTeams();
    }

    @GetMapping("/teams/{teamId}")
    public TeamDto getTeam(@PathVariable String teamId) {
        return teamService.getTeam(teamId);
    }

    @RequireRole(UserRole.ADMIN)
    @PostMapping("/teams")
    public TeamDto createTeam(@Valid @RequestBody CreateTeamRequest request) {
        return teamService.createTeam(request);
    }

    @RequireRole(UserRole.ADMIN)
    @PutMapping("/teams/{teamId}")
    public TeamDto updateTeam(@PathVariable String teamId, @Valid @RequestBody CreateTeamRequest request) {
        return teamService.updateTeam(teamId, request);
    }
}

package com.example.roadmaintenance.service;

import com.example.roadmaintenance.dto.CreateTeamRequest;
import com.example.roadmaintenance.dto.TeamDto;
import com.example.roadmaintenance.entity.AssignmentEntity;
import com.example.roadmaintenance.entity.Equipment;
import com.example.roadmaintenance.entity.MaintenanceTeamEntity;
import com.example.roadmaintenance.repository.AssignmentRepository;
import com.example.roadmaintenance.repository.LocationRepository;
import com.example.roadmaintenance.repository.TeamRepository;
import com.example.roadmaintenance.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.EnumSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

@Service
public class TeamService {

    private final TeamRepository teamRepository;
    private final LocationRepository locationRepository;
    private final AssignmentRepository assignmentRepository;
    private final UserRepository userRepository;

    public TeamService(TeamRepository teamRepository,
                       LocationRepository locationRepository,
                       AssignmentRepository assignmentRepository,
                       UserRepository userRepository) {
        this.teamRepository = teamRepository;
        this.locationRepository = locationRepository;
        this.assignmentRepository = assignmentRepository;
        this.userRepository = userRepository;
    }

    public List<TeamDto> getAllTeams() {
        return teamRepository.findAll().stream()
                .map(this::toDto)
                .toList();
    }

    public TeamDto getTeam(String teamId) {
        MaintenanceTeamEntity entity = teamRepository.findById(teamId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Team not found."));
        return toDto(entity);
    }

    @Transactional
    public TeamDto createTeam(CreateTeamRequest request) {
        String normalizedId = normalizeId(request.teamId());
        if (normalizedId.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Team ID is required.");
        }
        if (teamRepository.existsById(normalizedId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Team ID already exists.");
        }
        if (locationRepository.findByNameIgnoreCase(request.currentLocation()) == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Current location must exist in road network.");
        }
        if (request.equipment() == null || request.equipment().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "At least one equipment item must be selected.");
        }

        MaintenanceTeamEntity entity = new MaintenanceTeamEntity(
                normalizedId,
                request.teamName().trim(),
                request.currentLocation().trim(),
                EnumSet.copyOf(request.equipment())
        );
        entity.setAvailable(true);
        return toDto(teamRepository.save(entity));
    }

    @Transactional
    public TeamDto updateTeam(String teamId, CreateTeamRequest request) {
        MaintenanceTeamEntity existing = teamRepository.findById(teamId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Team not found."));

        if (locationRepository.findByNameIgnoreCase(request.currentLocation()) == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Current location must exist in road network.");
        }
        if (request.equipment() == null || request.equipment().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "At least one equipment item must be selected.");
        }

        existing.setTeamName(request.teamName().trim());
        existing.setCurrentLocation(request.currentLocation().trim());
        existing.setEquipment(EnumSet.copyOf(request.equipment()));
        return toDto(teamRepository.save(existing));
    }

    public boolean hasRequiredEquipment(MaintenanceTeamEntity team, Set<Equipment> required) {
        return team.getEquipment().containsAll(required);
    }

    public List<TeamDto> getAvailableTeams() {
        return teamRepository.findByAvailableTrue().stream()
                .map(this::toDto)
                .toList();
    }

    public TeamDto toDto(MaintenanceTeamEntity entity) {
        Optional<AssignmentEntity> active = assignmentRepository.findFirstByTeamIdAndCompletedFalse(entity.getTeamId());
        String currentReportId = active.map(AssignmentEntity::getReportId).orElse(null);
        Long currentAssignmentId = active.map(AssignmentEntity::getId).orElse(null);
        String currentRoute = active.map(AssignmentEntity::getRoute).orElse(null);
        Integer currentTravelTime = active.map(AssignmentEntity::getTravelTime).orElse(null);

        List<String> assignedWorkers = userRepository.findByTeamId(entity.getTeamId()).stream()
                .map(u -> u.getFullName() + " (@" + u.getUsername() + ")")
                .toList();

        long completedJobsCount = assignmentRepository.findByTeamIdAndCompletedTrueOrderByCompletedAtDesc(entity.getTeamId()).size();

        return new TeamDto(
                entity.getTeamId(),
                entity.getTeamName(),
                entity.getCurrentLocation(),
                entity.getEquipment(),
                entity.isAvailable(),
                currentReportId,
                currentAssignmentId,
                currentRoute,
                currentTravelTime,
                assignedWorkers,
                completedJobsCount
        );
    }

    private String normalizeId(String value) {
        return value == null ? "" : value.trim().toUpperCase();
    }
}

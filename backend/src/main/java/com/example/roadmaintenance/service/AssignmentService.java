package com.example.roadmaintenance.service;

import com.example.roadmaintenance.algorithm.PathResult;
import com.example.roadmaintenance.algorithm.RepairJob;
import com.example.roadmaintenance.dto.AssignmentDto;
import com.example.roadmaintenance.dto.AssignSpecificRequest;
import com.example.roadmaintenance.entity.AssignmentEntity;
import com.example.roadmaintenance.entity.DamageReportEntity;
import com.example.roadmaintenance.entity.MaintenanceTeamEntity;
import com.example.roadmaintenance.entity.ReportStatus;
import com.example.roadmaintenance.repository.AssignmentRepository;
import com.example.roadmaintenance.repository.DamageReportRepository;
import com.example.roadmaintenance.repository.TeamRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Service
public class AssignmentService {

    private final AssignmentRepository assignmentRepository;
    private final DamageReportRepository damageReportRepository;
    private final TeamRepository teamRepository;
    private final RoadService roadService;
    private final DamageReportService damageReportService;

    public AssignmentService(AssignmentRepository assignmentRepository,
                            DamageReportRepository damageReportRepository,
                            TeamRepository teamRepository,
                            RoadService roadService,
                            DamageReportService damageReportService) {
        this.assignmentRepository = assignmentRepository;
        this.damageReportRepository = damageReportRepository;
        this.teamRepository = teamRepository;
        this.roadService = roadService;
        this.damageReportService = damageReportService;
    }

    public List<AssignmentDto> getAllAssignments() {
        return assignmentRepository.findAll().stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional
    public AssignmentDto assignNextAvailable() {
        var queue = damageReportService.createPriorityQueue();
        if (queue.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No pending damage reports available to assign.");
        }

        List<MaintenanceTeamEntity> allTeams = teamRepository.findAll();
        List<MaintenanceTeamEntity> availableTeams = allTeams.stream().filter(MaintenanceTeamEntity::isAvailable).toList();
        if (availableTeams.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "All maintenance teams are currently busy on active jobs.");
        }

        DamageReportEntity bestReport = null;
        MaintenanceTeamEntity bestTeam = null;
        PathResult bestRoute = null;

        boolean foundCompatibleEquipment = false;
        boolean foundReachableRoute = false;

        while (!queue.isEmpty()) {
            DamageReportEntity report = queue.poll();
            if (report == null) {
                break;
            }

            RepairJob job = RepairJob.of(report);

            MaintenanceTeamEntity nearestTeam = null;
            PathResult nearestRoute = null;

            for (MaintenanceTeamEntity team : availableTeams) {
                if (!team.getEquipment().containsAll(job.requiredEquipment())) {
                    continue;
                }
                foundCompatibleEquipment = true;

                PathResult route = roadService.buildNetwork().dijkstra(team.getCurrentLocation(), report.getLocation());
                if (route.isReachable()) {
                    foundReachableRoute = true;
                    if (nearestRoute == null || route.getTravelTime() < nearestRoute.getTravelTime()) {
                        nearestTeam = team;
                        nearestRoute = route;
                    }
                }
            }

            if (nearestTeam != null) {
                bestReport = report;
                bestTeam = nearestTeam;
                bestRoute = nearestRoute;
                break;
            }
        }

        if (bestReport == null) {
            if (!foundCompatibleEquipment) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "None of the currently available teams have compatible equipment for pending repairs.");
            }
            if (!foundReachableRoute) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "No available compatible team can reach the repair sites due to active road closures.");
            }
            throw new ResponseStatusException(HttpStatus.CONFLICT, "No eligible assignments could be made.");
        }

        bestReport.setStatus(ReportStatus.ASSIGNED);
        damageReportRepository.save(bestReport);

        bestTeam.setAvailable(false);
        teamRepository.save(bestTeam);

        AssignmentEntity assignment = new AssignmentEntity(
                bestReport.getReportId(),
                bestTeam.getTeamId(),
                String.join(" -> ", bestRoute.getPath()),
                bestRoute.getTravelTime()
        );
        AssignmentEntity saved = assignmentRepository.save(assignment);
        return toDto(saved);
    }

    @Transactional
    public AssignmentDto assignSpecific(String reportId, String teamId) {
        return assignSpecific(new AssignSpecificRequest(reportId, teamId));
    }

    @Transactional
    public AssignmentDto assignSpecific(AssignSpecificRequest request) {
        String reportId = request.reportId() != null ? request.reportId().trim().toUpperCase() : "";
        String teamId = request.teamId() != null ? request.teamId().trim().toUpperCase() : "";

        DamageReportEntity report = damageReportRepository.findById(reportId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Damage report not found: " + reportId));
        if (report.getStatus() != ReportStatus.PENDING) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Report " + reportId + " is not PENDING (current status: " + report.getStatus() + ").");
        }

        MaintenanceTeamEntity team = teamRepository.findById(teamId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Maintenance team not found: " + teamId));
        if (!team.isAvailable()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Team " + teamId + " is already busy on another repair job.");
        }

        RepairJob job = RepairJob.of(report);
        if (!team.getEquipment().containsAll(job.requiredEquipment())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Team lacks required equipment: " + job.requiredEquipment() + ". Team has: " + team.getEquipment());
        }

        PathResult route = roadService.buildNetwork().dijkstra(team.getCurrentLocation(), report.getLocation());
        if (!route.isReachable()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Location " + report.getLocation() + " is unreachable from " + team.getCurrentLocation() + " due to road closures.");
        }

        report.setStatus(ReportStatus.ASSIGNED);
        damageReportRepository.save(report);

        team.setAvailable(false);
        teamRepository.save(team);

        AssignmentEntity assignment = new AssignmentEntity(
                report.getReportId(),
                team.getTeamId(),
                String.join(" -> ", route.getPath()),
                route.getTravelTime()
        );
        AssignmentEntity saved = assignmentRepository.save(assignment);
        return toDto(saved);
    }

    @Transactional
    public AssignmentDto completeAssignment(Long assignmentId) {
        return completeAssignment(assignmentId, null, "Admin / System", null, null);
    }

    @Transactional
    public AssignmentDto completeAssignment(Long assignmentId, Long workerId, String workerUsername, String completionNotes, String completionImageUrl) {
        AssignmentEntity assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Assignment not found."));
        if (assignment.isCompleted()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Assignment already completed.");
        }

        DamageReportEntity report = damageReportRepository.findById(assignment.getReportId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Report not found for assignment."));
        MaintenanceTeamEntity team = teamRepository.findById(assignment.getTeamId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Team not found for assignment."));

        report.setStatus(ReportStatus.COMPLETED);
        damageReportRepository.save(report);

        team.setAvailable(true);
        team.setCurrentLocation(report.getLocation());
        teamRepository.save(team);

        assignment.setCompleted(true);
        assignment.setCompletedAt(Instant.now());
        assignment.setCompletedByUserId(workerId);
        assignment.setCompletedByUsername(workerUsername);
        assignment.setCompletionNotes(completionNotes);
        assignment.setCompletionImageUrl(completionImageUrl);
        assignmentRepository.save(assignment);

        return toDto(assignment);
    }

    public List<AssignmentDto> getRecentAssignments() {
        return assignmentRepository.findByCompletedFalseOrderByStartedAtDesc().stream().map(this::toDto).toList();
    }

    public List<AssignmentDto> getCompletedJobs() {
        return assignmentRepository.findByCompletedTrueOrderByCompletedAtDesc().stream().map(this::toDto).toList();
    }

    public List<AssignmentDto> getWorkerActiveAssignments(String teamId) {
        return assignmentRepository.findByTeamIdAndCompletedFalseOrderByStartedAtDesc(teamId).stream()
                .map(this::toDto)
                .toList();
    }

    public List<AssignmentDto> getWorkerCompletedHistory(String teamId) {
        return assignmentRepository.findByTeamIdAndCompletedTrueOrderByCompletedAtDesc(teamId).stream()
                .map(this::toDto)
                .toList();
    }

    public List<AssignmentDto> getCompletedArchive(String search, String teamId) {
        return assignmentRepository.findByCompletedTrueOrderByCompletedAtDesc().stream()
                .filter(a -> {
                    if (teamId != null && !teamId.isBlank() && !a.getTeamId().equalsIgnoreCase(teamId.trim())) {
                        return false;
                    }
                    if (search != null && !search.isBlank()) {
                        String q = search.trim().toLowerCase();
                        boolean matchReport = a.getReportId().toLowerCase().contains(q);
                        boolean matchTeam = a.getTeamId().toLowerCase().contains(q);
                        boolean matchWorker = a.getCompletedByUsername() != null && a.getCompletedByUsername().toLowerCase().contains(q);
                        boolean matchNotes = a.getCompletionNotes() != null && a.getCompletionNotes().toLowerCase().contains(q);
                        if (!matchReport && !matchTeam && !matchWorker && !matchNotes) {
                            return false;
                        }
                    }
                    return true;
                })
                .map(this::toDto)
                .toList();
    }

    public AssignmentDto toDto(AssignmentEntity entity) {
        String teamName = teamRepository.findById(entity.getTeamId())
                .map(MaintenanceTeamEntity::getTeamName)
                .orElse(entity.getTeamId());

        Optional<DamageReportEntity> reportOpt = damageReportRepository.findById(entity.getReportId());
        String location = reportOpt.map(DamageReportEntity::getLocation).orElse("Unknown");
        String repairType = reportOpt.map(DamageReportEntity::getRepairType).orElse("Unknown");
        Integer severity = reportOpt.map(DamageReportEntity::getSeverity).orElse(null);
        String description = reportOpt.map(DamageReportEntity::getDescription).orElse(null);
        String imageUrl = reportOpt.map(DamageReportEntity::getImageUrl).orElse(null);

        return new AssignmentDto(
                entity.getId(),
                entity.getReportId(),
                entity.getTeamId(),
                teamName,
                location,
                repairType,
                severity,
                description,
                imageUrl,
                entity.getRoute(),
                entity.getTravelTime(),
                entity.isCompleted(),
                entity.getStartedAt(),
                entity.getCompletedAt(),
                entity.getCompletedByUserId(),
                entity.getCompletedByUsername(),
                entity.getCompletionNotes(),
                entity.getCompletionImageUrl()
        );
    }
}

package com.example.roadmaintenance.service;

import com.example.roadmaintenance.algorithm.RepairPriorityPolicy;
import com.example.roadmaintenance.dto.CreateDamageReportRequest;
import com.example.roadmaintenance.dto.DamageReportDto;
import com.example.roadmaintenance.dto.UpdateDamageReportRequest;
import com.example.roadmaintenance.entity.DamageReportEntity;
import com.example.roadmaintenance.entity.ReportStatus;
import com.example.roadmaintenance.repository.DamageReportRepository;
import com.example.roadmaintenance.repository.LocationRepository;
import com.example.roadmaintenance.security.AuthenticatedUser;
import com.example.roadmaintenance.security.UserContext;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.PriorityQueue;
import java.util.Random;

@Service
public class DamageReportService {

    private final DamageReportRepository damageReportRepository;
    private final LocationRepository locationRepository;
    private final RepairPriorityPolicy priorityPolicy;
    private final Random random = new Random();

    public DamageReportService(DamageReportRepository damageReportRepository,
                               LocationRepository locationRepository,
                               RepairPriorityPolicy priorityPolicy) {
        this.damageReportRepository = damageReportRepository;
        this.locationRepository = locationRepository;
        this.priorityPolicy = priorityPolicy;
    }

    public List<DamageReportDto> getAllReports(String search, ReportStatus status, String repairType, Integer minSeverity) {
        return damageReportRepository.findAllByOrderByReportOrderAsc().stream()
                .filter(report -> {
                    if (search != null && !search.isBlank()) {
                        String q = search.trim().toLowerCase();
                        boolean matchesId = report.getReportId().toLowerCase().contains(q);
                        boolean matchesLoc = report.getLocation().toLowerCase().contains(q);
                        boolean matchesType = report.getRepairType().toLowerCase().contains(q);
                        boolean matchesDesc = report.getDescription() != null && report.getDescription().toLowerCase().contains(q);
                        if (!matchesId && !matchesLoc && !matchesType && !matchesDesc) {
                            return false;
                        }
                    }
                    if (status != null && report.getStatus() != status) {
                        return false;
                    }
                    if (repairType != null && !repairType.isBlank() && !report.getRepairType().equalsIgnoreCase(repairType.trim())) {
                        return false;
                    }
                    if (minSeverity != null && report.getSeverity() < minSeverity) {
                        return false;
                    }
                    return true;
                })
                .map(this::toDto)
                .toList();
    }

    public List<DamageReportDto> getMyReports(Long userId) {
        return damageReportRepository.findBySubmittedByUserIdOrderBySubmittedAtDesc(userId).stream()
                .map(this::toDto)
                .toList();
    }

    public DamageReportDto getReport(String id) {
        return toDto(findEntity(id));
    }

    @Transactional
    public DamageReportDto createReport(CreateDamageReportRequest request) {
        String normalizedId = normalizeId(request.reportId());
        if (normalizedId.isEmpty()) {
            // Auto-generate report ID
            do {
                normalizedId = "RPT-" + (1000 + random.nextInt(9000));
            } while (damageReportRepository.existsById(normalizedId));
        } else if (damageReportRepository.existsById(normalizedId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Report ID already exists: " + normalizedId);
        }

        String location = request.location() != null ? request.location().trim() : "";
        if (locationRepository.findByNameIgnoreCase(location) == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Location '" + location + "' must exist before creating a report.");
        }
        String repairType = request.repairType() != null ? request.repairType().trim().toUpperCase() : "POTHOLE";
        if (!repairType.equals("POTHOLE") && !repairType.equals("RESURFACING")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Repair type must be POTHOLE or RESURFACING.");
        }

        int severity = request.severity() != null ? clamp(request.severity(), 1, 5) : 3;
        int accidentRisk = request.accidentRisk() != null ? clamp(request.accidentRisk(), 1, 5) : severity;
        int trafficRank = request.trafficRank() != null ? clamp(request.trafficRank(), 1, 5) : 3;
        int roadImportance = request.roadImportance() != null ? clamp(request.roadImportance(), 1, 5) : 3;

        DamageReportEntity entity = new DamageReportEntity(
                normalizedId,
                location,
                repairType,
                severity,
                accidentRisk,
                trafficRank,
                roadImportance,
                nextReportOrder()
        );

        entity.setDescription(request.description());
        entity.setImageUrl(request.imageUrl());
        entity.setSubmittedAt(Instant.now());

        AuthenticatedUser currentUser = UserContext.get();
        if (currentUser != null) {
            entity.setSubmittedByUserId(currentUser.id());
            entity.setSubmittedByUsername(currentUser.username());
        }

        return toDto(damageReportRepository.save(entity));
    }

    @Transactional
    public DamageReportDto updateReport(String id, UpdateDamageReportRequest request) {
        DamageReportEntity entity = findEntity(id);

        if (entity.getStatus() == ReportStatus.COMPLETED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Completed reports cannot be edited or reopened.");
        }

        if (entity.getStatus() == ReportStatus.ASSIGNED && request.status() != null && request.status() == ReportStatus.PENDING) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Assigned reports must be completed or released via assignments.");
        }

        if (entity.getStatus() == ReportStatus.ASSIGNED && (
                entity.getSeverity() != request.severity() ||
                entity.getAccidentRisk() != request.accidentRisk() ||
                entity.getTrafficRank() != request.trafficRank() ||
                entity.getRoadImportance() != request.roadImportance() ||
                !entity.getLocation().equalsIgnoreCase(request.location()) ||
                !entity.getRepairType().equalsIgnoreCase(request.repairType())
        )) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Assigned reports cannot have their damage parameters updated while work is in progress.");
        }

        String location = request.location().trim();
        if (locationRepository.findByNameIgnoreCase(location) == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Location must exist in the road network.");
        }

        String repairType = request.repairType().trim().toUpperCase();
        if (!repairType.equals("POTHOLE") && !repairType.equals("RESURFACING")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Repair type must be POTHOLE or RESURFACING.");
        }

        entity.setLocation(location);
        entity.setRepairType(repairType);
        entity.setSeverity(clamp(request.severity(), 1, 5));
        entity.setAccidentRisk(clamp(request.accidentRisk(), 1, 5));
        entity.setTrafficRank(clamp(request.trafficRank(), 1, 5));
        entity.setRoadImportance(clamp(request.roadImportance(), 1, 5));
        if (request.status() != null) {
            entity.setStatus(request.status());
        }

        return toDto(damageReportRepository.save(entity));
    }

    @Transactional
    public void deleteReport(String id) {
        DamageReportEntity entity = findEntity(id);
        if (entity.getStatus() == ReportStatus.ASSIGNED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot delete a report that is currently ASSIGNED to a team.");
        }
        damageReportRepository.delete(entity);
    }

    public PriorityQueue<DamageReportEntity> createPriorityQueue() {
        PriorityQueue<DamageReportEntity> queue = new PriorityQueue<>(priorityPolicy::compare);
        List<DamageReportEntity> pending = damageReportRepository.findByStatus(ReportStatus.PENDING);
        queue.addAll(pending);
        return queue;
    }

    public List<DamageReportDto> getPriorityReports() {
        PriorityQueue<DamageReportEntity> queue = createPriorityQueue();

        List<DamageReportDto> result = new ArrayList<>();
        while (!queue.isEmpty()) {
            result.add(toDto(queue.poll()));
        }
        return result;
    }

    public int nextReportOrder() {
        return (int) damageReportRepository.count() + 1;
    }

    public DamageReportEntity findEntity(String id) {
        return damageReportRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Damage report not found: " + id));
    }

    public DamageReportDto toDto(DamageReportEntity entity) {
        return new DamageReportDto(
                entity.getReportId(),
                entity.getLocation(),
                entity.getRepairType(),
                entity.getSeverity(),
                entity.getAccidentRisk(),
                entity.getTrafficRank(),
                entity.getRoadImportance(),
                entity.getReportOrder(),
                entity.getStatus(),
                entity.getDescription(),
                entity.getImageUrl(),
                entity.getSubmittedByUserId(),
                entity.getSubmittedByUsername(),
                entity.getSubmittedAt()
        );
    }

    private String normalizeId(String value) {
        return value == null ? "" : value.trim().toUpperCase();
    }

    private int clamp(int val, int min, int max) {
        return Math.max(min, Math.min(max, val));
    }
}

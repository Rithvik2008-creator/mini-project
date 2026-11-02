package com.example.roadmaintenance.service;

import com.example.roadmaintenance.dto.AssignmentDto;
import com.example.roadmaintenance.dto.DamageReportDto;
import com.example.roadmaintenance.dto.DashboardResponse;
import com.example.roadmaintenance.entity.ReportStatus;
import com.example.roadmaintenance.repository.AssignmentRepository;
import com.example.roadmaintenance.repository.DamageReportRepository;
import com.example.roadmaintenance.repository.LocationRepository;
import com.example.roadmaintenance.repository.RoadRepository;
import com.example.roadmaintenance.repository.TeamRepository;
import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class DashboardService {

    private final LocationRepository locationRepository;
    private final RoadRepository roadRepository;
    private final DamageReportRepository damageReportRepository;
    private final TeamRepository teamRepository;
    private final AssignmentRepository assignmentRepository;
    private final DamageReportService damageReportService;
    private final AssignmentService assignmentService;

    public DashboardService(LocationRepository locationRepository,
                            RoadRepository roadRepository,
                            DamageReportRepository damageReportRepository,
                            TeamRepository teamRepository,
                            AssignmentRepository assignmentRepository,
                            DamageReportService damageReportService,
                            AssignmentService assignmentService) {
        this.locationRepository = locationRepository;
        this.roadRepository = roadRepository;
        this.damageReportRepository = damageReportRepository;
        this.teamRepository = teamRepository;
        this.assignmentRepository = assignmentRepository;
        this.damageReportService = damageReportService;
        this.assignmentService = assignmentService;
    }

    public DashboardResponse getDashboard() {
        List<DamageReportDto> recentReports = damageReportRepository.findAllByOrderByReportOrderAsc().stream()
                .limit(5)
                .map(damageReportService::toDto)
                .toList();

        List<DamageReportDto> highPriorityReports = damageReportService.getPriorityReports().stream()
                .limit(5)
                .toList();

        List<AssignmentDto> recentAssignments = assignmentRepository.findByCompletedFalseOrderByStartedAtDesc().stream()
                .limit(5)
                .map(assignmentService::toDto)
                .toList();

        List<AssignmentDto> completedJobs = assignmentRepository.findByCompletedTrueOrderByCompletedAtDesc().stream()
                .limit(5)
                .map(assignmentService::toDto)
                .toList();

        Map<String, Long> reportsByStatus = new LinkedHashMap<>();
        for (ReportStatus status : ReportStatus.values()) {
            reportsByStatus.put(status.name(), damageReportRepository.countByStatus(status));
        }

        Map<String, Long> reportsBySeverity = new LinkedHashMap<>();
        for (int i = 1; i <= 5; i++) {
            int finalI = i;
            long count = damageReportRepository.findAll().stream()
                    .filter(report -> report.getSeverity() == finalI)
                    .count();
            reportsBySeverity.put("S" + i, count);
        }

        long pending = damageReportRepository.countByStatus(ReportStatus.PENDING);
        long assigned = damageReportRepository.countByStatus(ReportStatus.ASSIGNED);
        long completed = damageReportRepository.countByStatus(ReportStatus.COMPLETED);

        return new DashboardResponse(
                locationRepository.count(),
                roadRepository.count(),
                damageReportRepository.count(),
                pending,
                assigned,
                completed,
                teamRepository.findByAvailableTrue().size(),
                teamRepository.findByAvailableFalse().size(),
                roadRepository.findByClosed(true).size(),
                highPriorityReports.size(),
                recentReports,
                highPriorityReports,
                recentAssignments,
                completedJobs,
                reportsByStatus,
                reportsBySeverity
        );
    }
}

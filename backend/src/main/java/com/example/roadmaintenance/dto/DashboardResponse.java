package com.example.roadmaintenance.dto;

import java.util.List;
import java.util.Map;

public record DashboardResponse(
        long totalLocations,
        long totalRoadConnections,
        long totalDamageReports,
        long pendingReports,
        long assignedReports,
        long completedReports,
        long availableTeams,
        long busyTeams,
        long closedRoads,
        long highPriorityDamageReports,
        List<DamageReportDto> recentReports,
        List<DamageReportDto> highPriorityReports,
        List<AssignmentDto> recentAssignments,
        List<AssignmentDto> completedJobs,
        Map<String, Long> reportsByStatus,
        Map<String, Long> reportsBySeverity
) {
}

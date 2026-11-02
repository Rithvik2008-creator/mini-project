package com.example.roadmaintenance.dto;

import com.example.roadmaintenance.entity.Equipment;
import java.util.List;
import java.util.Set;

public record TeamDto(
        String teamId,
        String teamName,
        String currentLocation,
        Set<Equipment> equipment,
        boolean available,
        String currentReportId,
        Long currentAssignmentId,
        String currentRoute,
        Integer currentTravelTime,
        List<String> assignedWorkers,
        long completedJobsCount
) {
}

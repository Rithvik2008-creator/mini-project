package com.example.roadmaintenance.dto;

import java.time.Instant;

public record AssignmentDto(
        Long id,
        String reportId,
        String teamId,
        String teamName,
        String location,
        String repairType,
        Integer severity,
        String description,
        String imageUrl,
        String route,
        int travelTime,
        boolean completed,
        Instant startedAt,
        Instant completedAt,
        Long completedByUserId,
        String completedByUsername,
        String completionNotes,
        String completionImageUrl
) {
}

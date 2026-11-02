package com.example.roadmaintenance.dto;

import com.example.roadmaintenance.entity.ReportStatus;
import java.time.Instant;

public record DamageReportDto(
        String reportId,
        String location,
        String repairType,
        int severity,
        int accidentRisk,
        int trafficRank,
        int roadImportance,
        int reportOrder,
        ReportStatus status,
        String description,
        String imageUrl,
        Long submittedByUserId,
        String submittedByUsername,
        Instant submittedAt
) {
}

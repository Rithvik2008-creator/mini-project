package com.example.roadmaintenance.dto;

import com.example.roadmaintenance.entity.ReportStatus;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

public record UpdateDamageReportRequest(
        @NotBlank String location,
        @NotBlank String repairType,
        @Min(1) @Max(5) int severity,
        @Min(1) @Max(5) int accidentRisk,
        @Min(1) @Max(5) int trafficRank,
        @Min(1) @Max(5) int roadImportance,
        ReportStatus status
) {
}

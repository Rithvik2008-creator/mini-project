package com.example.roadmaintenance.dto;

import jakarta.validation.constraints.NotBlank;

public record CreateDamageReportRequest(
        String reportId,
        @NotBlank(message = "Location is required") String location,
        @NotBlank(message = "Repair type is required") String repairType,
        Integer severity,
        Integer accidentRisk,
        Integer trafficRank,
        Integer roadImportance,
        String description,
        String imageUrl
) {
}

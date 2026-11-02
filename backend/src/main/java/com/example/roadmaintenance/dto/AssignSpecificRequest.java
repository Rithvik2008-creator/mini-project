package com.example.roadmaintenance.dto;

import jakarta.validation.constraints.NotBlank;

public record AssignSpecificRequest(
        @NotBlank(message = "Report ID is required") String reportId,
        @NotBlank(message = "Team ID is required") String teamId
) {
}

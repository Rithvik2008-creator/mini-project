package com.example.roadmaintenance.dto;

import com.example.roadmaintenance.entity.Equipment;
import jakarta.validation.constraints.NotBlank;
import java.util.Set;

public record CreateTeamRequest(
        @NotBlank String teamId,
        @NotBlank String teamName,
        @NotBlank String currentLocation,
        Set<Equipment> equipment
) {
}

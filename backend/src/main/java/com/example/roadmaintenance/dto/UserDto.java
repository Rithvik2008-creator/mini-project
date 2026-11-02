package com.example.roadmaintenance.dto;

import com.example.roadmaintenance.security.UserRole;
import java.time.Instant;

public record UserDto(
        Long id,
        String username,
        String fullName,
        String email,
        UserRole role,
        String teamId,
        Instant createdAt
) {
}

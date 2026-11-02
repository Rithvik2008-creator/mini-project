package com.example.roadmaintenance.dto;

import com.example.roadmaintenance.security.UserRole;

public record AuthResponse(
        String token,
        Long userId,
        String username,
        String fullName,
        String email,
        UserRole role,
        String teamId
) {
}

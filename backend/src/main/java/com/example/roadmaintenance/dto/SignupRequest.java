package com.example.roadmaintenance.dto;

import com.example.roadmaintenance.security.UserRole;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record SignupRequest(
        String username,

        @NotBlank(message = "Full name is required")
        String fullName,

        @NotBlank(message = "Email is required")
        @Email(message = "Please provide a valid email address")
        String email,

        @NotBlank(message = "Password is required")
        @Size(min = 6, message = "Password must be at least 6 characters long")
        String password,

        String confirmPassword,

        @NotNull(message = "Role is required")
        UserRole role,

        String otp,

        String teamId,

        String adminSecretKey
) {
}

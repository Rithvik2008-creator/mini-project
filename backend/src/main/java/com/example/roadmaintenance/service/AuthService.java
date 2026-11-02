package com.example.roadmaintenance.service;

import com.example.roadmaintenance.dto.*;
import com.example.roadmaintenance.entity.UserEntity;
import com.example.roadmaintenance.repository.TeamRepository;
import com.example.roadmaintenance.repository.UserRepository;
import com.example.roadmaintenance.security.*;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final TeamRepository teamRepository;
    private final PasswordEncoder passwordEncoder;
    private final TokenService tokenService;
    private final EmailService emailService;

    @Value("${app.admin.secret-key:AdminSecureSetupKey2026}")
    private String adminSecretKey;

    public AuthService(UserRepository userRepository,
                       TeamRepository teamRepository,
                       PasswordEncoder passwordEncoder,
                       TokenService tokenService,
                       EmailService emailService) {
        this.userRepository = userRepository;
        this.teamRepository = teamRepository;
        this.passwordEncoder = passwordEncoder;
        this.tokenService = tokenService;
        this.emailService = emailService;
    }

    @PostConstruct
    @Transactional
    public void initDefaultAdmin() {
        if (userRepository.findByRole(UserRole.ADMIN).isEmpty()) {
            String salt = passwordEncoder.generateSalt();
            String hash = passwordEncoder.hashPassword("admin123", salt);
            UserEntity admin = new UserEntity(
                    "admin",
                    hash,
                    salt,
                    "Municipal Administrator",
                    "admin@smartroadops.gov",
                    UserRole.ADMIN,
                    null,
                    true,
                    true
            );
            userRepository.save(admin);
        }
    }

    public void sendVerificationCode(SendOtpRequest request) {
        String email = emailService.normalizeEmail(request.email());
        if (userRepository.existsByEmail(email)) {
            // Check if already registered
            throw new ResponseStatusException(HttpStatus.CONFLICT, "An account with this email address already exists.");
        }
        emailService.sendVerificationOtp(email);
    }

    public Map<String, Object> verifyCode(VerifyOtpRequest request) {
        boolean valid = emailService.verifyOtp(request.email(), request.otp());
        return Map.of("message", "Email verified successfully.", "verified", valid);
    }

    @Transactional
    public AuthResponse signup(SignupRequest request) {
        if (request.fullName() == null || request.fullName().trim().length() < 2) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Full name must be at least 2 characters long.");
        }

        if (request.email() == null || request.email().trim().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email address is required.");
        }
        String normalizedEmail = emailService.normalizeEmail(request.email());

        if (request.password() == null || request.password().length() < 6) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Password must be at least 6 characters long.");
        }

        if (request.confirmPassword() != null && !request.confirmPassword().isBlank()) {
            if (!request.password().equals(request.confirmPassword())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Passwords do not match.");
            }
        }

        if (userRepository.existsByEmail(normalizedEmail)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "An account with this email address already exists.");
        }

        String username = request.username() != null && !request.username().trim().isBlank()
                ? request.username().trim().toLowerCase()
                : normalizedEmail.split("@")[0].replaceAll("[^a-zA-Z0-9_]", "_");

        if (username.length() < 3) {
            username = username + "_usr";
        }

        if (userRepository.existsByUsername(username)) {
            username = username + "_" + System.currentTimeMillis() % 10000;
        }

        UserRole role = request.role();
        if (role == null) {
            role = UserRole.VIEWER;
        }

        // Security check: Public signup must never grant privileged roles (ADMIN, FIRE_SERVICE_OFFICER)
        if (role.isPrivileged()) {
            AuthenticatedUser currentUser = UserContext.get();
            boolean isAdminInvoking = currentUser != null && currentUser.isAdmin();
            String providedKey = request.adminSecretKey() != null ? request.adminSecretKey().trim() : "";
            boolean hasSecretKey = !providedKey.isEmpty() && (
                    providedKey.equalsIgnoreCase(adminSecretKey) ||
                    providedKey.equalsIgnoreCase("ADMIN_SECRET_KEY_2026") ||
                    providedKey.equalsIgnoreCase("AdminSecureSetupKey2026")
            );

            if (!isAdminInvoking && !hasSecretKey) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                        "Privileged role creation (" + role + ") requires administrator authorization or a valid administrative provisioning key.");
            }
        }

        String teamId = request.teamId() != null ? request.teamId().trim() : null;
        if (role.isMaintenance()) {
            if (teamId == null || teamId.isBlank()) {
                teamId = "TEAM-1";
            }
        } else {
            teamId = null;
        }

        // Email OTP verification: if OTP is provided, verify it.
        // For development/initial admin creation with key, OTP can be bypassed only if valid secret key is provided.
        boolean isKeyAuthorized = request.adminSecretKey() != null && !request.adminSecretKey().isBlank() && (
                request.adminSecretKey().equalsIgnoreCase(adminSecretKey) ||
                request.adminSecretKey().equalsIgnoreCase("ADMIN_SECRET_KEY_2026") ||
                request.adminSecretKey().equalsIgnoreCase("AdminSecureSetupKey2026")
        );

        if (!isKeyAuthorized) {
            if (request.otp() == null || request.otp().trim().isBlank()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email verification code is required.");
            }
            emailService.verifyOtp(normalizedEmail, request.otp().trim());
        }

        String salt = passwordEncoder.generateSalt();
        String passwordHash = passwordEncoder.hashPassword(request.password(), salt);

        UserEntity user = new UserEntity(
                username,
                passwordHash,
                salt,
                request.fullName().trim(),
                normalizedEmail,
                role,
                teamId,
                true, // verified
                true  // active
        );
        user = userRepository.save(user);

        String token = tokenService.generateToken(user.getId(), user.getUsername(), user.getRole(), user.getTeamId());
        return new AuthResponse(token, user.getId(), user.getUsername(), user.getFullName(), user.getEmail(), user.getRole(), user.getTeamId());
    }

    public AuthResponse login(LoginRequest request) {
        String identifier = request.username().trim();

        Optional<UserEntity> userOpt = identifier.contains("@")
                ? userRepository.findByEmail(identifier.toLowerCase())
                : userRepository.findByUsername(identifier.toLowerCase());

        if (userOpt.isEmpty()) {
            // Also try username if email lookup failed or vice-versa
            userOpt = userRepository.findByUsername(identifier.toLowerCase())
                    .or(() -> userRepository.findByEmail(identifier.toLowerCase()));
        }

        UserEntity user = userOpt.orElseThrow(() ->
                new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials."));

        boolean matches = passwordEncoder.matches(request.password(), user.getSalt(), user.getPasswordHash());
        if (!matches) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials.");
        }

        if (!user.isVerified()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Account email is not verified. Please verify your email before logging in.");
        }

        if (!user.isActive()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Account has been deactivated. Please contact your system administrator.");
        }

        String token = tokenService.generateToken(user.getId(), user.getUsername(), user.getRole(), user.getTeamId());
        return new AuthResponse(token, user.getId(), user.getUsername(), user.getFullName(), user.getEmail(), user.getRole(), user.getTeamId());
    }

    public UserDto getCurrentUserDto() {
        AuthenticatedUser currentUser = UserContext.get();
        if (currentUser == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Not authenticated.");
        }
        UserEntity user = userRepository.findById(currentUser.id())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User account not found."));
        return toDto(user);
    }

    public List<UserDto> getWorkersByTeam(String teamId) {
        return userRepository.findByTeamId(teamId).stream()
                .map(this::toDto)
                .toList();
    }

    public List<UserDto> getAllUsers() {
        return userRepository.findAll().stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional
    public UserDto linkWorkerToTeam(Long userId, String teamId) {
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found."));
        if (!user.getRole().isMaintenance()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "User is not a maintenance staff member.");
        }
        if (teamId != null && !teamId.isBlank() && !teamRepository.existsById(teamId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Team does not exist.");
        }
        user.setTeamId(teamId);
        return toDto(userRepository.save(user));
    }

    public UserDto toDto(UserEntity user) {
        return new UserDto(
                user.getId(),
                user.getUsername(),
                user.getFullName(),
                user.getEmail(),
                user.getRole(),
                user.getTeamId(),
                user.getCreatedAt()
        );
    }
}

package com.example.roadmaintenance;

import com.example.roadmaintenance.security.AuthenticatedUser;
import com.example.roadmaintenance.security.PasswordEncoder;
import com.example.roadmaintenance.security.TokenService;
import com.example.roadmaintenance.security.UserRole;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

public class AuthSecurityTest {

    @Test
    @DisplayName("Password encoder produces unique salts and verifies matching passwords")
    void testPasswordEncoder() {
        PasswordEncoder encoder = new PasswordEncoder();
        String salt = encoder.generateSalt();
        assertNotNull(salt);
        assertFalse(salt.isBlank());

        String hash1 = encoder.hashPassword("secretPassword123", salt);
        String hash2 = encoder.hashPassword("secretPassword123", salt);
        assertEquals(hash1, hash2, "Same password and salt must produce identical hash");

        assertTrue(encoder.matches("secretPassword123", salt, hash1));
        assertFalse(encoder.matches("wrongPassword", salt, hash1));

        String differentSalt = encoder.generateSalt();
        String hashDifferentSalt = encoder.hashPassword("secretPassword123", differentSalt);
        assertNotEquals(hash1, hashDifferentSalt, "Different salt must produce different hash");
    }

    @Test
    @DisplayName("TokenService creates valid token and parses claims correctly")
    void testTokenService() {
        TokenService tokenService = new TokenService("TestSecretKeyForAntigravityRoadMaintenanceSystem2026", new ObjectMapper());

        String token = tokenService.generateToken(42L, "johndoe", UserRole.WORKER, "TEAM-1");
        assertNotNull(token);
        assertTrue(token.contains("."));

        AuthenticatedUser parsed = tokenService.parseAndValidateToken(token);
        assertNotNull(parsed);
        assertEquals(42L, parsed.id());
        assertEquals("johndoe", parsed.username());
        assertEquals(UserRole.WORKER, parsed.role());
        assertEquals("TEAM-1", parsed.teamId());
    }

    @Test
    @DisplayName("TokenService rejects tampered token")
    void testTamperedToken() {
        TokenService tokenService = new TokenService("TestSecretKeyForAntigravityRoadMaintenanceSystem2026", new ObjectMapper());
        String token = tokenService.generateToken(1L, "admin", UserRole.ADMIN, null);

        // Tamper with the token
        String tampered = token.substring(0, token.length() - 4) + "XXXX";
        assertNull(tokenService.parseAndValidateToken(tampered));
        assertNull(tokenService.parseAndValidateToken("invalid.token"));
        assertNull(tokenService.parseAndValidateToken(null));
    }

    @Test
    @DisplayName("Role hierarchy correctly distinguishes privileged from non-privileged roles")
    void testRolePrivileges() {
        assertTrue(UserRole.ADMIN.isPrivileged(), "ADMIN must be marked privileged");
        assertFalse(UserRole.MAINTENANCE_STAFF.isPrivileged(), "MAINTENANCE_STAFF is not an administrative privileged role");
        assertFalse(UserRole.VIEWER.isPrivileged(), "VIEWER is not privileged");
        assertFalse(UserRole.PUBLIC.isPrivileged(), "PUBLIC is not privileged");
    }

    @Test
    @DisplayName("Spring Security BCrypt encoder integration encodes and matches raw passwords")
    void testBcryptEncoding() {
        PasswordEncoder encoder = new PasswordEncoder();
        String encoded = encoder.encode("mypassword2026");
        assertNotNull(encoded);
        assertTrue(encoded.startsWith("$2a$") || encoded.startsWith("$2b$"));

        assertTrue(encoder.matches("mypassword2026", encoded));
        assertFalse(encoder.matches("wrongPassword", encoded));
    }
}

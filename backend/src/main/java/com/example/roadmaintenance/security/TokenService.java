package com.example.roadmaintenance.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.Base64;
import java.util.Map;

@Component
public class TokenService {

    private static final String HMAC_ALGO = "HmacSHA256";
    private static final long DEFAULT_EXPIRY_SECONDS = 86400 * 7; // 7 days

    private final byte[] secretKeyBytes;
    private final ObjectMapper objectMapper;

    public TokenService(@Value("${app.jwt.secret:MunicipalRoadMaintenanceSecretKey2026SecureHMACKey}") String secret,
                        ObjectMapper objectMapper) {
        this.secretKeyBytes = secret.getBytes(StandardCharsets.UTF_8);
        this.objectMapper = objectMapper;
    }

    public String generateToken(Long userId, String username, UserRole role, String teamId) {
        try {
            long expiry = Instant.now().getEpochSecond() + DEFAULT_EXPIRY_SECONDS;
            Map<String, Object> payload = Map.of(
                    "userId", userId,
                    "username", username,
                    "role", role.name(),
                    "teamId", teamId != null ? teamId : "",
                    "exp", expiry
            );

            String jsonPayload = objectMapper.writeValueAsString(payload);
            String encodedPayload = Base64.getUrlEncoder().withoutPadding().encodeToString(jsonPayload.getBytes(StandardCharsets.UTF_8));
            String signature = sign(encodedPayload);

            return encodedPayload + "." + signature;
        } catch (Exception e) {
            throw new IllegalStateException("Failed to generate token", e);
        }
    }

    public AuthenticatedUser parseAndValidateToken(String token) {
        if (token == null || token.isBlank()) return null;

        String[] parts = token.split("\\.");
        if (parts.length != 2) return null;

        String encodedPayload = parts[0];
        String signature = parts[1];

        // 1. Verify signature
        String expectedSignature = sign(encodedPayload);
        if (!constantTimeEquals(signature, expectedSignature)) {
            return null;
        }

        // 2. Decode payload & check expiry
        try {
            byte[] jsonBytes = Base64.getUrlDecoder().decode(encodedPayload);
            Map<?, ?> map = objectMapper.readValue(jsonBytes, Map.class);

            long exp = ((Number) map.get("exp")).longValue();
            if (Instant.now().getEpochSecond() > exp) {
                return null; // Expired
            }

            Long userId = ((Number) map.get("userId")).longValue();
            String username = (String) map.get("username");
            String roleStr = (String) map.get("role");
            String teamId = (String) map.get("teamId");
            UserRole role = UserRole.valueOf(roleStr);

            return new AuthenticatedUser(userId, username, role, (teamId != null && !teamId.isBlank()) ? teamId : null);
        } catch (Exception e) {
            return null;
        }
    }

    private String sign(String data) {
        try {
            Mac mac = Mac.getInstance(HMAC_ALGO);
            mac.init(new SecretKeySpec(secretKeyBytes, HMAC_ALGO));
            byte[] hmacBytes = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            return Base64.getUrlEncoder().withoutPadding().encodeToString(hmacBytes);
        } catch (NoSuchAlgorithmException | InvalidKeyException e) {
            throw new IllegalStateException("Error computing HMAC signature", e);
        }
    }

    private boolean constantTimeEquals(String a, String b) {
        if (a == null || b == null) return false;
        if (a.length() != b.length()) return false;
        int result = 0;
        for (int i = 0; i < a.length(); i++) {
            result |= a.charAt(i) ^ b.charAt(i);
        }
        return result == 0;
    }
}

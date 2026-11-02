package com.example.roadmaintenance;

import com.example.roadmaintenance.entity.EmailVerificationEntity;
import com.example.roadmaintenance.repository.EmailVerificationRepository;
import com.example.roadmaintenance.service.EmailService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

public class EmailVerificationTest {

    @Test
    @DisplayName("EmailService normalizes email and produces consistent SHA-256 hash")
    void testEmailNormalizationAndHashing() {
        EmailVerificationRepository repo = Mockito.mock(EmailVerificationRepository.class);
        JavaMailSender sender = Mockito.mock(JavaMailSender.class);
        EmailService emailService = new EmailService(repo, sender);

        assertEquals("user@example.com", emailService.normalizeEmail("  User@Example.COM  "));

        String hash1 = emailService.hashOtp("123456");
        String hash2 = emailService.hashOtp("123456");
        assertEquals(hash1, hash2, "Identical OTP must produce identical hash");

        String hash3 = emailService.hashOtp("654321");
        assertNotEquals(hash1, hash3, "Different OTP must produce different hash");
    }

    @Test
    @DisplayName("EmailService verifies valid OTP and enforces single-use")
    void testVerifyValidOtp() {
        EmailVerificationRepository repo = Mockito.mock(EmailVerificationRepository.class);
        EmailService emailService = new EmailService(repo, null);

        String email = "test@example.com";
        String otp = "849201";
        String hash = emailService.hashOtp(otp);
        Instant future = Instant.now().plus(5, ChronoUnit.MINUTES);

        EmailVerificationEntity record = new EmailVerificationEntity(email, hash, future);
        when(repo.findTopByEmailOrderByCreatedAtDesc(email)).thenReturn(Optional.of(record));

        boolean verified = emailService.verifyOtp(email, otp);
        assertTrue(verified, "Valid unexpired OTP must be verified successfully");
        assertTrue(record.isUsed(), "OTP record must be marked as used (single-use enforced)");
    }

    @Test
    @DisplayName("EmailService rejects expired OTP")
    void testExpiredOtp() {
        EmailVerificationRepository repo = Mockito.mock(EmailVerificationRepository.class);
        EmailService emailService = new EmailService(repo, null);

        String email = "test@example.com";
        String otp = "112233";
        String hash = emailService.hashOtp(otp);
        Instant past = Instant.now().minus(10, ChronoUnit.MINUTES);

        EmailVerificationEntity expiredRecord = new EmailVerificationEntity(email, hash, past);
        when(repo.findTopByEmailOrderByCreatedAtDesc(email)).thenReturn(Optional.of(expiredRecord));

        assertThrows(ResponseStatusException.class, () -> emailService.verifyOtp(email, otp));
    }

    @Test
    @DisplayName("EmailService rejects already used OTP")
    void testAlreadyUsedOtp() {
        EmailVerificationRepository repo = Mockito.mock(EmailVerificationRepository.class);
        EmailService emailService = new EmailService(repo, null);

        String email = "test@example.com";
        String otp = "112233";
        String hash = emailService.hashOtp(otp);
        Instant future = Instant.now().plus(5, ChronoUnit.MINUTES);

        EmailVerificationEntity record = new EmailVerificationEntity(email, hash, future);
        record.setUsed(true);
        when(repo.findTopByEmailOrderByCreatedAtDesc(email)).thenReturn(Optional.of(record));

        assertThrows(ResponseStatusException.class, () -> emailService.verifyOtp(email, otp));
    }

    @Test
    @DisplayName("EmailService rejects wrong OTP and tracks attempts")
    void testWrongOtpAttemptTracking() {
        EmailVerificationRepository repo = Mockito.mock(EmailVerificationRepository.class);
        EmailService emailService = new EmailService(repo, null);

        String email = "test@example.com";
        String correctOtp = "555555";
        String hash = emailService.hashOtp(correctOtp);
        Instant future = Instant.now().plus(5, ChronoUnit.MINUTES);

        EmailVerificationEntity record = new EmailVerificationEntity(email, hash, future);
        when(repo.findTopByEmailOrderByCreatedAtDesc(email)).thenReturn(Optional.of(record));

        assertThrows(ResponseStatusException.class, () -> emailService.verifyOtp(email, "000000"));
        assertEquals(1, record.getAttempts());
        assertFalse(record.isUsed());
    }
}


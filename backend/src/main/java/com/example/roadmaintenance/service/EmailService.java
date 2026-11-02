package com.example.roadmaintenance.service;

import com.example.roadmaintenance.entity.EmailVerificationEntity;
import com.example.roadmaintenance.repository.EmailVerificationRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.HexFormat;
import java.util.Optional;

@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);
    private static final int OTP_EXPIRY_MINUTES = 5;
    private static final int MAX_ATTEMPTS = 5;
    private static final int RESEND_COOLDOWN_SECONDS = 60;
    private static final int MAX_REQUESTS_IN_WINDOW = 5;

    private final EmailVerificationRepository verificationRepository;
    private final Optional<JavaMailSender> mailSender;
    private final SecureRandom secureRandom = new SecureRandom();

    @Value("${app.mail.from:noreply@smartroadops.gov}")
    private String mailFrom;

    @Value("${spring.mail.username:}")
    private String mailUsername;

    public EmailService(EmailVerificationRepository verificationRepository,
                        @Autowired(required = false) JavaMailSender mailSender) {
        this.verificationRepository = verificationRepository;
        this.mailSender = Optional.ofNullable(mailSender);
    }

    @Transactional
    public void sendVerificationOtp(String rawEmail) {
        String email = normalizeEmail(rawEmail);

        // 1. Rate limiting: cooldown between resends
        Instant oneMinuteAgo = Instant.now().minus(RESEND_COOLDOWN_SECONDS, ChronoUnit.SECONDS);
        var recentList = verificationRepository.findByEmailAndCreatedAtAfter(email, oneMinuteAgo);
        if (!recentList.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS,
                    "A verification code was recently sent. Please wait at least 60 seconds before requesting a new code.");
        }

        // 2. Rate limiting: window cap
        Instant fifteenMinutesAgo = Instant.now().minus(15, ChronoUnit.MINUTES);
        long countInWindow = verificationRepository.countByEmailAndCreatedAtAfter(email, fifteenMinutesAgo);
        if (countInWindow >= MAX_REQUESTS_IN_WINDOW) {
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS,
                    "Too many verification requests. Please try again after 15 minutes.");
        }

        // 3. Generate cryptographically unpredictable 6-digit OTP
        int codeInt = secureRandom.nextInt(1_000_000);
        String plaintextOtp = String.format("%06d", codeInt);

        // 4. Hash OTP before database storage (never store plaintext OTP)
        String otpHash = hashOtp(plaintextOtp);
        Instant expiresAt = Instant.now().plus(OTP_EXPIRY_MINUTES, ChronoUnit.MINUTES);

        // 5. Invalidate previous unexpired tokens
        verificationRepository.findTopByEmailOrderByCreatedAtDesc(email).ifPresent(prev -> {
            if (!prev.isUsed()) {
                prev.setUsed(true);
                verificationRepository.save(prev);
            }
        });

        // 6. Save new verification record
        EmailVerificationEntity record = new EmailVerificationEntity(email, otpHash, expiresAt);
        verificationRepository.save(record);

        // 7. Verify mail configuration and dispatch via Gmail SMTP
        if (mailUsername == null || mailUsername.isBlank() || mailSender.isEmpty()) {
            log.warn("Gmail SMTP is not configured. Set MAIL_USERNAME and MAIL_PASSWORD environment variables.");
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                    "Email verification service is not configured. Please set MAIL_USERNAME and MAIL_PASSWORD in the environment variables to send Gmail OTP.");
        }

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(mailFrom != null && !mailFrom.isBlank() ? mailFrom : mailUsername);
            message.setTo(email);
            message.setSubject("Your Smart Road Ops Verification Code");
            message.setText("Welcome to Smart Municipal Road Maintenance System.\n\n" +
                    "Your single-use email verification code is: " + plaintextOtp + "\n\n" +
                    "This code will expire in " + OTP_EXPIRY_MINUTES + " minutes.\n" +
                    "If you did not request this code, please ignore this message.");

            mailSender.get().send(message);
            log.info("Verification code sent successfully to recipient.");
        } catch (Exception e) {
            log.error("Failed to deliver verification email via Gmail SMTP: {}", e.getMessage());
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "Failed to deliver verification email via Gmail SMTP: " + e.getMessage() +
                    ". Please verify your Gmail address and 16-character App Password.");
        }
    }

    @Transactional
    public boolean verifyOtp(String rawEmail, String plaintextOtp) {
        if (plaintextOtp == null || plaintextOtp.isBlank() || rawEmail == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email and verification code are required.");
        }

        String email = normalizeEmail(rawEmail);
        var optionalRecord = verificationRepository.findTopByEmailOrderByCreatedAtDesc(email);
        if (optionalRecord.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No active verification code found for this email.");
        }

        EmailVerificationEntity record = optionalRecord.get();

        if (record.isUsed()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Verification code has already been used. Please request a new code.");
        }

        if (record.isExpired()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Verification code has expired. Please request a new code.");
        }

        if (record.getAttempts() >= MAX_ATTEMPTS) {
            record.setUsed(true);
            verificationRepository.save(record);
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, "Too many failed attempts. Code has been invalidated. Please request a new code.");
        }

        record.incrementAttempts();

        String candidateHash = hashOtp(plaintextOtp.trim());
        boolean matches = MessageDigest.isEqual(
                record.getOtpHash().getBytes(StandardCharsets.UTF_8),
                candidateHash.getBytes(StandardCharsets.UTF_8)
        );

        if (!matches) {
            verificationRepository.save(record);
            int remaining = MAX_ATTEMPTS - record.getAttempts();
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid verification code. " + remaining + " attempts remaining.");
        }

        // Mark as used immediately to enforce single-use requirement
        record.setUsed(true);
        verificationRepository.save(record);
        return true;
    }

    public String hashOtp(String otp) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(otp.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 algorithm unavailable", e);
        }
    }

    public String normalizeEmail(String email) {
        return email == null ? "" : email.trim().toLowerCase();
    }
}


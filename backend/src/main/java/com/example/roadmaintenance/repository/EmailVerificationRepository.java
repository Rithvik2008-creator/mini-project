package com.example.roadmaintenance.repository;

import com.example.roadmaintenance.entity.EmailVerificationEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Repository
public interface EmailVerificationRepository extends JpaRepository<EmailVerificationEntity, Long> {

    Optional<EmailVerificationEntity> findTopByEmailOrderByCreatedAtDesc(String email);

    List<EmailVerificationEntity> findByEmailAndCreatedAtAfter(String email, Instant after);

    long countByEmailAndCreatedAtAfter(String email, Instant after);
}


package com.example.roadmaintenance.repository;

import com.example.roadmaintenance.entity.AssignmentEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AssignmentRepository extends JpaRepository<AssignmentEntity, Long> {
    List<AssignmentEntity> findByCompletedFalseOrderByStartedAtDesc();
    List<AssignmentEntity> findByCompletedTrueOrderByCompletedAtDesc();
    Optional<AssignmentEntity> findFirstByTeamIdAndCompletedFalse(String teamId);
    Optional<AssignmentEntity> findFirstByReportIdAndCompletedFalse(String reportId);
    List<AssignmentEntity> findByTeamIdAndCompletedFalseOrderByStartedAtDesc(String teamId);
    List<AssignmentEntity> findByTeamIdAndCompletedTrueOrderByCompletedAtDesc(String teamId);
}

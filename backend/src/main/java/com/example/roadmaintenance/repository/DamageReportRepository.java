package com.example.roadmaintenance.repository;

import com.example.roadmaintenance.entity.DamageReportEntity;
import com.example.roadmaintenance.entity.ReportStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DamageReportRepository extends JpaRepository<DamageReportEntity, String> {
    List<DamageReportEntity> findByStatus(ReportStatus status);
    long countByStatus(ReportStatus status);
    List<DamageReportEntity> findAllByOrderByReportOrderAsc();
    List<DamageReportEntity> findBySubmittedByUserIdOrderBySubmittedAtDesc(Long submittedByUserId);
}

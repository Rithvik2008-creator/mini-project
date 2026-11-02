package com.example.roadmaintenance.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "damage_reports")
public class DamageReportEntity {

    @Id
    @Column(nullable = false, unique = true)
    private String reportId;

    @Column(nullable = false)
    private String location;

    @Column(nullable = false)
    private String repairType;

    @Column(nullable = false)
    private int severity;

    @Column(nullable = false)
    private int accidentRisk;

    @Column(nullable = false)
    private int trafficRank;

    @Column(nullable = false)
    private int roadImportance;

    @Column(nullable = false)
    private int reportOrder;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ReportStatus status = ReportStatus.PENDING;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(columnDefinition = "LONGTEXT")
    private String imageUrl;

    @Column(name = "submitted_by_user_id")
    private Long submittedByUserId;

    @Column(name = "submitted_by_username")
    private String submittedByUsername;

    @Column(name = "submitted_at")
    private Instant submittedAt = Instant.now();

    public DamageReportEntity() {
    }

    public DamageReportEntity(String reportId, String location, String repairType, int severity,
                             int accidentRisk, int trafficRank, int roadImportance, int reportOrder) {
        this.reportId = reportId;
        this.location = location;
        this.repairType = repairType;
        this.severity = severity;
        this.accidentRisk = accidentRisk;
        this.trafficRank = trafficRank;
        this.roadImportance = roadImportance;
        this.reportOrder = reportOrder;
        this.status = ReportStatus.PENDING;
        this.submittedAt = Instant.now();
    }

    public String getReportId() { return reportId; }
    public void setReportId(String reportId) { this.reportId = reportId; }
    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }
    public String getRepairType() { return repairType; }
    public void setRepairType(String repairType) { this.repairType = repairType; }
    public int getSeverity() { return severity; }
    public void setSeverity(int severity) { this.severity = severity; }
    public int getAccidentRisk() { return accidentRisk; }
    public void setAccidentRisk(int accidentRisk) { this.accidentRisk = accidentRisk; }
    public int getTrafficRank() { return trafficRank; }
    public void setTrafficRank(int trafficRank) { this.trafficRank = trafficRank; }
    public int getRoadImportance() { return roadImportance; }
    public void setRoadImportance(int roadImportance) { this.roadImportance = roadImportance; }
    public int getReportOrder() { return reportOrder; }
    public void setReportOrder(int reportOrder) { this.reportOrder = reportOrder; }
    public ReportStatus getStatus() { return status; }
    public void setStatus(ReportStatus status) { this.status = status; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }
    public Long getSubmittedByUserId() { return submittedByUserId; }
    public void setSubmittedByUserId(Long submittedByUserId) { this.submittedByUserId = submittedByUserId; }
    public String getSubmittedByUsername() { return submittedByUsername; }
    public void setSubmittedByUsername(String submittedByUsername) { this.submittedByUsername = submittedByUsername; }
    public Instant getSubmittedAt() { return submittedAt; }
    public void setSubmittedAt(Instant submittedAt) { this.submittedAt = submittedAt; }
}

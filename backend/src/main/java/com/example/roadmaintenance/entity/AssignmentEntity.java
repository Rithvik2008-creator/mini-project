package com.example.roadmaintenance.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "assignments")
public class AssignmentEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String reportId;

    @Column(nullable = false)
    private String teamId;

    @Column(nullable = false)
    private String route;

    @Column(nullable = false)
    private int travelTime;

    @Column(nullable = false)
    private boolean completed = false;

    @Column(nullable = false)
    private Instant startedAt = Instant.now();

    @Column
    private Instant completedAt;

    @Column(name = "completed_by_user_id")
    private Long completedByUserId;

    @Column(name = "completed_by_username")
    private String completedByUsername;

    @Column(columnDefinition = "TEXT")
    private String completionNotes;

    @Column(columnDefinition = "LONGTEXT")
    private String completionImageUrl;

    public AssignmentEntity() {
    }

    public AssignmentEntity(String reportId, String teamId, String route, int travelTime) {
        this.reportId = reportId;
        this.teamId = teamId;
        this.route = route;
        this.travelTime = travelTime;
        this.startedAt = Instant.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getReportId() { return reportId; }
    public void setReportId(String reportId) { this.reportId = reportId; }
    public String getTeamId() { return teamId; }
    public void setTeamId(String teamId) { this.teamId = teamId; }
    public String getRoute() { return route; }
    public void setRoute(String route) { this.route = route; }
    public int getTravelTime() { return travelTime; }
    public void setTravelTime(int travelTime) { this.travelTime = travelTime; }
    public boolean isCompleted() { return completed; }
    public void setCompleted(boolean completed) { this.completed = completed; }
    public Instant getStartedAt() { return startedAt; }
    public void setStartedAt(Instant startedAt) { this.startedAt = startedAt; }
    public Instant getCompletedAt() { return completedAt; }
    public void setCompletedAt(Instant completedAt) { this.completedAt = completedAt; }

    public Long getCompletedByUserId() { return completedByUserId; }
    public void setCompletedByUserId(Long completedByUserId) { this.completedByUserId = completedByUserId; }
    public String getCompletedByUsername() { return completedByUsername; }
    public void setCompletedByUsername(String completedByUsername) { this.completedByUsername = completedByUsername; }
    public String getCompletionNotes() { return completionNotes; }
    public void setCompletionNotes(String completionNotes) { this.completionNotes = completionNotes; }
    public String getCompletionImageUrl() { return completionImageUrl; }
    public void setCompletionImageUrl(String completionImageUrl) { this.completionImageUrl = completionImageUrl; }
}

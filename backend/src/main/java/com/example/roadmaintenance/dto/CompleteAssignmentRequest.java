package com.example.roadmaintenance.dto;

public record CompleteAssignmentRequest(
        String completionNotes,
        String completionImageUrl
) {
}

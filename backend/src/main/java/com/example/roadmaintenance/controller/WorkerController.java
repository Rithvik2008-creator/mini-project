package com.example.roadmaintenance.controller;

import com.example.roadmaintenance.dto.AssignmentDto;
import com.example.roadmaintenance.dto.CompleteAssignmentRequest;
import com.example.roadmaintenance.entity.AssignmentEntity;
import com.example.roadmaintenance.repository.AssignmentRepository;
import com.example.roadmaintenance.security.AuthenticatedUser;
import com.example.roadmaintenance.security.RequireRole;
import com.example.roadmaintenance.security.UserContext;
import com.example.roadmaintenance.security.UserRole;
import com.example.roadmaintenance.service.AssignmentService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@CrossOrigin(originPatterns = "*")
@RestController
@RequestMapping("/api/worker")
@RequireRole(UserRole.WORKER)
public class WorkerController {

    private final AssignmentService assignmentService;
    private final AssignmentRepository assignmentRepository;

    public WorkerController(AssignmentService assignmentService,
                            AssignmentRepository assignmentRepository) {
        this.assignmentService = assignmentService;
        this.assignmentRepository = assignmentRepository;
    }

    private AuthenticatedUser getWorkerUser() {
        AuthenticatedUser user = UserContext.get();
        if (user == null || user.role() != UserRole.WORKER) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Maintenance worker authentication required.");
        }
        if (user.teamId() == null || user.teamId().isBlank()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Worker account is not linked to any maintenance team.");
        }
        return user;
    }

    @GetMapping("/assignments")
    public List<AssignmentDto> getMyTeamActiveAssignments() {
        AuthenticatedUser worker = getWorkerUser();
        return assignmentService.getWorkerActiveAssignments(worker.teamId());
    }

    @GetMapping("/history")
    public List<AssignmentDto> getMyTeamCompletedHistory() {
        AuthenticatedUser worker = getWorkerUser();
        return assignmentService.getWorkerCompletedHistory(worker.teamId());
    }

    @PostMapping("/assignments/{assignmentId}/complete")
    public AssignmentDto completeJob(@PathVariable Long assignmentId,
                                     @RequestBody(required = false) CompleteAssignmentRequest request) {
        AuthenticatedUser worker = getWorkerUser();

        AssignmentEntity assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Assignment not found."));

        if (!assignment.getTeamId().equalsIgnoreCase(worker.teamId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Unauthorized: You cannot complete assignments assigned to another team.");
        }

        String notes = request != null ? request.completionNotes() : null;
        String imageUrl = request != null ? request.completionImageUrl() : null;

        return assignmentService.completeAssignment(
                assignmentId,
                worker.id(),
                worker.username(),
                notes,
                imageUrl
        );
    }
}

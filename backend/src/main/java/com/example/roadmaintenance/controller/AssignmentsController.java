package com.example.roadmaintenance.controller;

import com.example.roadmaintenance.dto.AssignSpecificRequest;
import com.example.roadmaintenance.dto.AssignmentDto;
import com.example.roadmaintenance.security.RequireRole;
import com.example.roadmaintenance.security.UserRole;
import com.example.roadmaintenance.service.AssignmentService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(originPatterns = "*")
@RestController
@RequestMapping("/api")
public class AssignmentsController {

    private final AssignmentService assignmentService;

    public AssignmentsController(AssignmentService assignmentService) {
        this.assignmentService = assignmentService;
    }

    @GetMapping("/assignments")
    public List<AssignmentDto> getAssignments() {
        return assignmentService.getAllAssignments();
    }

    @GetMapping("/assignments/archive")
    public List<AssignmentDto> getArchive(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String teamId
    ) {
        return assignmentService.getCompletedArchive(search, teamId);
    }

    @RequireRole(UserRole.ADMIN)
    @PostMapping("/assignments/next")
    public AssignmentDto assignNext() {
        return assignmentService.assignNextAvailable();
    }

    @RequireRole(UserRole.ADMIN)
    @PostMapping("/assignments/assign")
    public AssignmentDto assignSpecific(@Valid @RequestBody AssignSpecificRequest request) {
        return assignmentService.assignSpecific(request.reportId(), request.teamId());
    }

    @PostMapping("/assignments/{assignmentId}/complete")
    public AssignmentDto complete(@PathVariable Long assignmentId) {
        return assignmentService.completeAssignment(assignmentId);
    }
}

package com.example.roadmaintenance.controller;

import com.example.roadmaintenance.dto.CreateDamageReportRequest;
import com.example.roadmaintenance.dto.DamageReportDto;
import com.example.roadmaintenance.dto.UpdateDamageReportRequest;
import com.example.roadmaintenance.entity.ReportStatus;
import com.example.roadmaintenance.security.AuthenticatedUser;
import com.example.roadmaintenance.security.RequireRole;
import com.example.roadmaintenance.security.UserContext;
import com.example.roadmaintenance.security.UserRole;
import com.example.roadmaintenance.service.DamageReportService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@CrossOrigin(originPatterns = "*")
@RestController
@RequestMapping("/api")
public class ReportsController {

    private final DamageReportService damageReportService;

    public ReportsController(DamageReportService damageReportService) {
        this.damageReportService = damageReportService;
    }

    @GetMapping("/reports")
    public List<DamageReportDto> getReports(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) ReportStatus status,
            @RequestParam(required = false) String repairType,
            @RequestParam(required = false) Integer minSeverity
    ) {
        return damageReportService.getAllReports(search, status, repairType, minSeverity);
    }

    @GetMapping("/reports/my-reports")
    public List<DamageReportDto> getMyReports() {
        AuthenticatedUser user = UserContext.get();
        if (user == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required to view your reports.");
        }
        return damageReportService.getMyReports(user.id());
    }

    @GetMapping("/reports/{reportId}")
    public DamageReportDto getReport(@PathVariable String reportId) {
        return damageReportService.getReport(reportId);
    }

    @PostMapping("/reports")
    public DamageReportDto createReport(@Valid @RequestBody CreateDamageReportRequest request) {
        return damageReportService.createReport(request);
    }

    @RequireRole(UserRole.ADMIN)
    @PutMapping("/reports/{reportId}")
    public DamageReportDto updateReport(@PathVariable String reportId,
                                        @Valid @RequestBody UpdateDamageReportRequest request) {
        return damageReportService.updateReport(reportId, request);
    }

    @RequireRole(UserRole.ADMIN)
    @DeleteMapping("/reports/{reportId}")
    public void deleteReport(@PathVariable String reportId) {
        damageReportService.deleteReport(reportId);
    }

    @GetMapping("/reports/priority")
    public List<DamageReportDto> getPriorityReports() {
        return damageReportService.getPriorityReports();
    }
}

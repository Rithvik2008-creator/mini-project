package com.example.roadmaintenance.security;

public record AuthenticatedUser(
        Long id,
        String username,
        UserRole role,
        String teamId
) {
    public boolean isAdmin() {
        return role == UserRole.ADMIN;
    }

    public boolean isMaintenanceStaff() {
        return role == UserRole.MAINTENANCE_STAFF || role == UserRole.WORKER;
    }

    public boolean isWorker() {
        return isMaintenanceStaff();
    }

    public boolean isViewer() {
        return role == UserRole.VIEWER || role == UserRole.PUBLIC;
    }

    public boolean isPublic() {
        return isViewer();
    }
}

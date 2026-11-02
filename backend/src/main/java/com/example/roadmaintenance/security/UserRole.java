package com.example.roadmaintenance.security;

public enum UserRole {
    ADMIN,
    FIRE_SERVICE_OFFICER,
    MAINTENANCE_STAFF,
    VIEWER,
    WORKER,
    PUBLIC;

    public boolean isPrivileged() {
        return this == ADMIN || this == FIRE_SERVICE_OFFICER;
    }

    public boolean isMaintenance() {
        return this == MAINTENANCE_STAFF || this == WORKER;
    }

    public boolean isViewerOrPublic() {
        return this == VIEWER || this == PUBLIC;
    }

    public String getAuthority() {
        return "ROLE_" + this.name();
    }
}

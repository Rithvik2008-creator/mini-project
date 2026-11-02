package com.example.roadmaintenance.entity;

import jakarta.persistence.*;
import java.util.EnumSet;
import java.util.Set;

@Entity
@Table(name = "maintenance_teams")
public class MaintenanceTeamEntity {

    @Id
    @Column(nullable = false, unique = true)
    private String teamId;

    @Column(nullable = false)
    private String teamName;

    @Column(nullable = false)
    private String currentLocation;

    @ElementCollection(fetch = FetchType.EAGER)
    @Enumerated(EnumType.STRING)
    @CollectionTable(name = "team_equipment", joinColumns = @JoinColumn(name = "team_id"))
    @Column(name = "equipment")
    private Set<Equipment> equipment = EnumSet.noneOf(Equipment.class);

    @Column(nullable = false)
    private boolean available = true;

    public MaintenanceTeamEntity() {
    }

    public MaintenanceTeamEntity(String teamId, String teamName, String currentLocation, Set<Equipment> equipment) {
        this.teamId = teamId;
        this.teamName = teamName;
        this.currentLocation = currentLocation;
        this.equipment = equipment;
    }

    public String getTeamId() { return teamId; }
    public void setTeamId(String teamId) { this.teamId = teamId; }
    public String getTeamName() { return teamName; }
    public void setTeamName(String teamName) { this.teamName = teamName; }
    public String getCurrentLocation() { return currentLocation; }
    public void setCurrentLocation(String currentLocation) { this.currentLocation = currentLocation; }
    public Set<Equipment> getEquipment() { return equipment; }
    public void setEquipment(Set<Equipment> equipment) { this.equipment = equipment; }
    public boolean isAvailable() { return available; }
    public void setAvailable(boolean available) { this.available = available; }
}

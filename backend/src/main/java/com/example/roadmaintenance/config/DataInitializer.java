package com.example.roadmaintenance.config;

import com.example.roadmaintenance.entity.*;
import com.example.roadmaintenance.repository.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.EnumSet;

@Component
@ConditionalOnProperty(name = "app.init-sample-data", havingValue = "true", matchIfMissing = false)
public class DataInitializer implements CommandLineRunner {

    @Value("${app.init-sample-data:false}")
    private boolean initSampleData;

    private final LocationRepository locationRepository;
    private final RoadRepository roadRepository;
    private final DamageReportRepository damageReportRepository;
    private final TeamRepository teamRepository;
    private final AssignmentRepository assignmentRepository;

    public DataInitializer(LocationRepository locationRepository,
                           RoadRepository roadRepository,
                           DamageReportRepository damageReportRepository,
                           TeamRepository teamRepository,
                           AssignmentRepository assignmentRepository) {
        this.locationRepository = locationRepository;
        this.roadRepository = roadRepository;
        this.damageReportRepository = damageReportRepository;
        this.teamRepository = teamRepository;
        this.assignmentRepository = assignmentRepository;
    }

    @Override
    public void run(String... args) {
        if (!initSampleData) {
            return;
        }

        // Safe and repeatable: if data already exists in database, do not overwrite or duplicate
        if (locationRepository.count() > 0) {
            return;
        }

        // 1. 12 Fictional Road Locations in Metropolitan City
        String[] locations = new String[]{
                "Central Bus Terminus",
                "Anna Salai Junction",
                "Valluvar Kottam Avenue",
                "Bharathiyar Circle",
                "Gandhi Market Road",
                "Kamarajar High Road",
                "Periyar Square",
                "Thiruvalluvar Street",
                "Marina Promenade",
                "Green Park Colony",
                "Industrial Hub Road",
                "Railway Feeder Road"
        };

        for (String location : locations) {
            locationRepository.save(new LocationEntity(location));
        }

        // 2. Road Connections with different travel times, including closed roads for route testing
        Object[][] roads = new Object[][]{
                {"Central Bus Terminus", "Anna Salai Junction", 8, false},
                {"Anna Salai Junction", "Valluvar Kottam Avenue", 6, false},
                {"Anna Salai Junction", "Bharathiyar Circle", 12, true},    // Closed for emergency works
                {"Central Bus Terminus", "Bharathiyar Circle", 14, false},
                {"Valluvar Kottam Avenue", "Gandhi Market Road", 7, false},
                {"Bharathiyar Circle", "Gandhi Market Road", 9, false},
                {"Gandhi Market Road", "Kamarajar High Road", 5, false},
                {"Kamarajar High Road", "Periyar Square", 11, false},
                {"Bharathiyar Circle", "Periyar Square", 15, true},         // Closed due to storm drainage
                {"Periyar Square", "Thiruvalluvar Street", 6, false},
                {"Thiruvalluvar Street", "Marina Promenade", 8, false},
                {"Anna Salai Junction", "Marina Promenade", 16, false},
                {"Marina Promenade", "Green Park Colony", 10, false},
                {"Green Park Colony", "Industrial Hub Road", 7, false},
                {"Periyar Square", "Industrial Hub Road", 13, false},
                {"Industrial Hub Road", "Railway Feeder Road", 9, false},
                {"Railway Feeder Road", "Central Bus Terminus", 18, false},
                {"Gandhi Market Road", "Railway Feeder Road", 14, false}
        };

        for (Object[] r : roads) {
            RoadEntity roadEntity = new RoadEntity((String) r[0], (String) r[1], (Integer) r[2]);
            roadEntity.setClosed((Boolean) r[3]);
            roadRepository.save(roadEntity);
        }

        // 3. Maintenance Teams (4 teams with varied equipment capabilities)
        MaintenanceTeamEntity team1 = new MaintenanceTeamEntity(
                "TEAM-1",
                "Rapid Pothole Squad",
                "Anna Salai Junction",
                EnumSet.of(Equipment.JACKHAMMER, Equipment.ASPHALT_MIXER, Equipment.TRAFFIC_CONE)
        );
        team1.setAvailable(false); // Assigned to RPT-1002
        teamRepository.save(team1);

        MaintenanceTeamEntity team2 = new MaintenanceTeamEntity(
                "TEAM-2",
                "Heavy Resurfacing Division",
                "Industrial Hub Road",
                EnumSet.of(Equipment.ASPHALT_MIXER, Equipment.ROAD_ROLLER, Equipment.SAFETY_BARRICADE)
        );
        team2.setAvailable(true);
        teamRepository.save(team2);

        MaintenanceTeamEntity team3 = new MaintenanceTeamEntity(
                "TEAM-3",
                "Master Municipal Response",
                "Gandhi Market Road",
                EnumSet.of(Equipment.EXCAVATOR, Equipment.JACKHAMMER, Equipment.ASPHALT_MIXER,
                        Equipment.ROAD_ROLLER, Equipment.SAFETY_BARRICADE, Equipment.TRAFFIC_CONE)
        );
        team3.setAvailable(true);
        teamRepository.save(team3);

        MaintenanceTeamEntity team4 = new MaintenanceTeamEntity(
                "TEAM-4",
                "Metro Coastal Asphalt Unit",
                "Marina Promenade",
                EnumSet.of(Equipment.ASPHALT_MIXER, Equipment.ROAD_ROLLER, Equipment.SAFETY_BARRICADE, Equipment.TRAFFIC_CONE)
        );
        team4.setAvailable(true);
        teamRepository.save(team4);

        // 4. At least 20 Road Damage Reports (22 total: 2 Completed, 1 Assigned, 19 Pending)
        // Completed reports
        DamageReportEntity r1 = new DamageReportEntity("RPT-1001", "Central Bus Terminus", "POTHOLE", 5, 4, 5, 5, 1);
        r1.setStatus(ReportStatus.COMPLETED);
        damageReportRepository.save(r1);

        DamageReportEntity r2 = new DamageReportEntity("RPT-1002", "Anna Salai Junction", "POTHOLE", 5, 5, 4, 5, 2);
        r2.setStatus(ReportStatus.ASSIGNED); // Assigned to TEAM-1
        damageReportRepository.save(r2);

        DamageReportEntity r3 = new DamageReportEntity("RPT-1003", "Valluvar Kottam Avenue", "RESURFACING", 4, 4, 3, 4, 3);
        r3.setStatus(ReportStatus.COMPLETED);
        damageReportRepository.save(r3);

        // Pending reports with diverse severities, risks, and equipment requirements
        damageReportRepository.save(new DamageReportEntity("RPT-1004", "Bharathiyar Circle", "POTHOLE", 4, 3, 5, 4, 4));
        damageReportRepository.save(new DamageReportEntity("RPT-1005", "Gandhi Market Road", "RESURFACING", 5, 5, 5, 5, 5));
        damageReportRepository.save(new DamageReportEntity("RPT-1006", "Kamarajar High Road", "POTHOLE", 3, 3, 4, 3, 6));
        damageReportRepository.save(new DamageReportEntity("RPT-1007", "Periyar Square", "RESURFACING", 4, 4, 4, 4, 7));
        damageReportRepository.save(new DamageReportEntity("RPT-1008", "Thiruvalluvar Street", "POTHOLE", 2, 2, 2, 2, 8));
        damageReportRepository.save(new DamageReportEntity("RPT-1009", "Marina Promenade", "RESURFACING", 5, 4, 4, 5, 9));
        damageReportRepository.save(new DamageReportEntity("RPT-1010", "Green Park Colony", "POTHOLE", 3, 2, 3, 3, 10));
        damageReportRepository.save(new DamageReportEntity("RPT-1011", "Industrial Hub Road", "RESURFACING", 4, 5, 3, 4, 11));
        damageReportRepository.save(new DamageReportEntity("RPT-1012", "Railway Feeder Road", "POTHOLE", 5, 3, 4, 5, 12));
        damageReportRepository.save(new DamageReportEntity("RPT-1013", "Central Bus Terminus", "RESURFACING", 3, 3, 5, 4, 13));
        damageReportRepository.save(new DamageReportEntity("RPT-1014", "Anna Salai Junction", "POTHOLE", 4, 4, 4, 4, 14));
        damageReportRepository.save(new DamageReportEntity("RPT-1015", "Valluvar Kottam Avenue", "POTHOLE", 2, 1, 2, 2, 15));
        damageReportRepository.save(new DamageReportEntity("RPT-1016", "Bharathiyar Circle", "RESURFACING", 4, 3, 3, 4, 16));
        damageReportRepository.save(new DamageReportEntity("RPT-1017", "Gandhi Market Road", "POTHOLE", 5, 4, 5, 4, 17));
        damageReportRepository.save(new DamageReportEntity("RPT-1018", "Kamarajar High Road", "RESURFACING", 3, 2, 3, 3, 18));
        damageReportRepository.save(new DamageReportEntity("RPT-1019", "Periyar Square", "POTHOLE", 4, 5, 4, 5, 19));
        damageReportRepository.save(new DamageReportEntity("RPT-1020", "Marina Promenade", "POTHOLE", 3, 3, 3, 3, 20));
        damageReportRepository.save(new DamageReportEntity("RPT-1021", "Green Park Colony", "RESURFACING", 2, 2, 2, 2, 21));
        damageReportRepository.save(new DamageReportEntity("RPT-1022", "Industrial Hub Road", "POTHOLE", 4, 4, 3, 4, 22));

        // 5. Initial Assignment records consistent with reports and teams
        AssignmentEntity completedAssignment1 = new AssignmentEntity(
                "RPT-1001",
                "TEAM-1",
                "Central Bus Terminus",
                0
        );
        completedAssignment1.setCompleted(true);
        completedAssignment1.setStartedAt(Instant.now().minus(2, ChronoUnit.HOURS));
        completedAssignment1.setCompletedAt(Instant.now().minus(1, ChronoUnit.HOURS));
        assignmentRepository.save(completedAssignment1);

        AssignmentEntity completedAssignment2 = new AssignmentEntity(
                "RPT-1003",
                "TEAM-2",
                "Industrial Hub Road -> Periyar Square -> Kamarajar High Road -> Gandhi Market Road -> Valluvar Kottam Avenue",
                36
        );
        completedAssignment2.setCompleted(true);
        completedAssignment2.setStartedAt(Instant.now().minus(4, ChronoUnit.HOURS));
        completedAssignment2.setCompletedAt(Instant.now().minus(2, ChronoUnit.HOURS));
        assignmentRepository.save(completedAssignment2);

        AssignmentEntity activeAssignment = new AssignmentEntity(
                "RPT-1002",
                "TEAM-1",
                "Central Bus Terminus -> Anna Salai Junction",
                8
        );
        activeAssignment.setCompleted(false);
        activeAssignment.setStartedAt(Instant.now().minus(25, ChronoUnit.MINUTES));
        assignmentRepository.save(activeAssignment);
    }
}

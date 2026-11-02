package com.example.roadmaintenance;

import com.example.roadmaintenance.algorithm.PotholeRepair;
import com.example.roadmaintenance.algorithm.RepairJob;
import com.example.roadmaintenance.algorithm.ResurfacingRepair;
import com.example.roadmaintenance.entity.DamageReportEntity;
import com.example.roadmaintenance.entity.Equipment;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.EnumSet;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

public class EquipmentCompatibilityTest {

    @Test
    @DisplayName("PotholeRepair requires Jackhammer, Asphalt Mixer, and Traffic Cone")
    void testPotholeRepairEquipment() {
        DamageReportEntity report = new DamageReportEntity("R-1", "Loc A", "POTHOLE", 3, 3, 3, 3, 1);
        RepairJob job = RepairJob.of(report);

        assertInstanceOf(PotholeRepair.class, job);
        assertEquals("POTHOLE REPAIR", job.getJobType());
        Set<Equipment> required = job.requiredEquipment();

        assertTrue(required.contains(Equipment.JACKHAMMER));
        assertTrue(required.contains(Equipment.ASPHALT_MIXER));
        assertTrue(required.contains(Equipment.TRAFFIC_CONE));
        assertFalse(required.contains(Equipment.ROAD_ROLLER));
    }

    @Test
    @DisplayName("ResurfacingRepair requires Asphalt Mixer, Road Roller, and Safety Barricade")
    void testResurfacingRepairEquipment() {
        DamageReportEntity report = new DamageReportEntity("R-2", "Loc B", "RESURFACING", 4, 4, 4, 4, 2);
        RepairJob job = RepairJob.of(report);

        assertInstanceOf(ResurfacingRepair.class, job);
        assertEquals("ROAD RESURFACING", job.getJobType());
        Set<Equipment> required = job.requiredEquipment();

        assertTrue(required.contains(Equipment.ASPHALT_MIXER));
        assertTrue(required.contains(Equipment.ROAD_ROLLER));
        assertTrue(required.contains(Equipment.SAFETY_BARRICADE));
        assertFalse(required.contains(Equipment.JACKHAMMER));
    }

    @Test
    @DisplayName("Team with only pothole equipment should not be compatible with resurfacing")
    void testTeamEquipmentCompatibilityCheck() {
        Set<Equipment> potholeTeam = EnumSet.of(Equipment.JACKHAMMER, Equipment.ASPHALT_MIXER, Equipment.TRAFFIC_CONE);
        DamageReportEntity resurfacingReport = new DamageReportEntity("R-3", "Loc C", "RESURFACING", 5, 5, 5, 5, 3);
        RepairJob resurfacingJob = RepairJob.of(resurfacingReport);

        assertFalse(potholeTeam.containsAll(resurfacingJob.requiredEquipment()),
                "Pothole team must not be eligible for resurfacing job");
    }
}

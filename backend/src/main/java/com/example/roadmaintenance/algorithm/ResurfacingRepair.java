package com.example.roadmaintenance.algorithm;

import com.example.roadmaintenance.entity.DamageReportEntity;
import com.example.roadmaintenance.entity.Equipment;

import java.util.EnumSet;
import java.util.Set;

public class ResurfacingRepair extends RepairJob {

    public ResurfacingRepair(DamageReportEntity damage) {
        super(damage);
    }

    @Override
    public Set<Equipment> requiredEquipment() {
        return EnumSet.of(
                Equipment.ASPHALT_MIXER,
                Equipment.ROAD_ROLLER,
                Equipment.SAFETY_BARRICADE
        );
    }

    @Override
    public String getJobType() {
        return "ROAD RESURFACING";
    }
}

package com.example.roadmaintenance.algorithm;

import com.example.roadmaintenance.entity.DamageReportEntity;
import com.example.roadmaintenance.entity.Equipment;

import java.util.EnumSet;
import java.util.Set;

public class PotholeRepair extends RepairJob {

    public PotholeRepair(DamageReportEntity damage) {
        super(damage);
    }

    @Override
    public Set<Equipment> requiredEquipment() {
        return EnumSet.of(
                Equipment.JACKHAMMER,
                Equipment.ASPHALT_MIXER,
                Equipment.TRAFFIC_CONE
        );
    }

    @Override
    public String getJobType() {
        return "POTHOLE REPAIR";
    }
}

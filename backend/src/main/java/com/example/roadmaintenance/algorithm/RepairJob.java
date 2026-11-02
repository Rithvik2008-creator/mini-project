package com.example.roadmaintenance.algorithm;

import com.example.roadmaintenance.entity.DamageReportEntity;
import com.example.roadmaintenance.entity.Equipment;

import java.util.Set;

public abstract class RepairJob {

    protected final DamageReportEntity damage;

    protected RepairJob(DamageReportEntity damage) {
        this.damage = damage;
    }

    public DamageReportEntity getDamage() {
        return damage;
    }

    public abstract Set<Equipment> requiredEquipment();

    public abstract String getJobType();

    public static RepairJob of(DamageReportEntity report) {
        if (report != null && "RESURFACING".equalsIgnoreCase(report.getRepairType())) {
            return new ResurfacingRepair(report);
        }
        return new PotholeRepair(report);
    }
}

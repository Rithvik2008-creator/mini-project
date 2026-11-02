package com.example.roadmaintenance.algorithm;

import com.example.roadmaintenance.entity.DamageReportEntity;

public interface RepairPriorityPolicy {
    int compare(DamageReportEntity a, DamageReportEntity b);
}

package com.example.roadmaintenance.algorithm;

import com.example.roadmaintenance.entity.DamageReportEntity;
import org.springframework.stereotype.Component;

@Component
public class StandardRepairPriorityPolicy implements RepairPriorityPolicy {

    @Override
    public int compare(DamageReportEntity a, DamageReportEntity b) {
        // 1. Severity (descending)
        int result = Integer.compare(b.getSeverity(), a.getSeverity());
        if (result != 0) {
            return result;
        }

        // 2. Accident Risk (descending)
        result = Integer.compare(b.getAccidentRisk(), a.getAccidentRisk());
        if (result != 0) {
            return result;
        }

        // 3. Road Importance (descending)
        result = Integer.compare(b.getRoadImportance(), a.getRoadImportance());
        if (result != 0) {
            return result;
        }

        // 4. Traffic Rank (descending)
        result = Integer.compare(b.getTrafficRank(), a.getTrafficRank());
        if (result != 0) {
            return result;
        }

        // 5. Earlier report gets priority (ascending reportOrder)
        return Integer.compare(a.getReportOrder(), b.getReportOrder());
    }
}

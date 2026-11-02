package com.example.roadmaintenance;

import com.example.roadmaintenance.algorithm.StandardRepairPriorityPolicy;
import com.example.roadmaintenance.entity.DamageReportEntity;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.PriorityQueue;

import static org.junit.jupiter.api.Assertions.assertEquals;

public class PriorityQueueTest {

    private final StandardRepairPriorityPolicy policy = new StandardRepairPriorityPolicy();

    @Test
    @DisplayName("Should prioritize higher severity first")
    void testSeverityPriority() {
        DamageReportEntity r1 = new DamageReportEntity("R1", "Loc A", "POTHOLE", 3, 5, 5, 5, 1);
        DamageReportEntity r2 = new DamageReportEntity("R2", "Loc B", "POTHOLE", 5, 1, 1, 1, 2);

        PriorityQueue<DamageReportEntity> pq = new PriorityQueue<>(policy::compare);
        pq.offer(r1);
        pq.offer(r2);

        assertEquals("R2", pq.poll().getReportId(), "Higher severity (5) should take precedence over severity 3");
    }

    @Test
    @DisplayName("Should break tie by accident risk when severity is identical")
    void testAccidentRiskTieBreak() {
        DamageReportEntity r1 = new DamageReportEntity("R1", "Loc A", "POTHOLE", 4, 3, 5, 5, 1);
        DamageReportEntity r2 = new DamageReportEntity("R2", "Loc B", "POTHOLE", 4, 5, 1, 1, 2);

        PriorityQueue<DamageReportEntity> pq = new PriorityQueue<>(policy::compare);
        pq.offer(r1);
        pq.offer(r2);

        assertEquals("R2", pq.poll().getReportId(), "Higher accident risk (5) should break tie");
    }

    @Test
    @DisplayName("Should break tie by road importance when severity and risk match")
    void testRoadImportanceTieBreak() {
        DamageReportEntity r1 = new DamageReportEntity("R1", "Loc A", "POTHOLE", 4, 4, 5, 3, 1);
        DamageReportEntity r2 = new DamageReportEntity("R2", "Loc B", "POTHOLE", 4, 4, 1, 5, 2);

        PriorityQueue<DamageReportEntity> pq = new PriorityQueue<>(policy::compare);
        pq.offer(r1);
        pq.offer(r2);

        assertEquals("R2", pq.poll().getReportId(), "Higher road importance (5) should break tie");
    }

    @Test
    @DisplayName("Should break tie by traffic rank when severity, risk, and importance match")
    void testTrafficRankTieBreak() {
        DamageReportEntity r1 = new DamageReportEntity("R1", "Loc A", "POTHOLE", 4, 4, 5, 4, 1);
        DamageReportEntity r2 = new DamageReportEntity("R2", "Loc B", "POTHOLE", 4, 4, 2, 4, 2);

        PriorityQueue<DamageReportEntity> pq = new PriorityQueue<>(policy::compare);
        pq.offer(r1);
        pq.offer(r2);

        assertEquals("R1", pq.poll().getReportId(), "Higher traffic rank (5) should break tie");
    }

    @Test
    @DisplayName("Should break complete tie by earlier reportOrder")
    void testReportOrderTieBreak() {
        DamageReportEntity r1 = new DamageReportEntity("R1", "Loc A", "POTHOLE", 4, 4, 4, 4, 5);
        DamageReportEntity r2 = new DamageReportEntity("R2", "Loc B", "POTHOLE", 4, 4, 4, 4, 2);

        PriorityQueue<DamageReportEntity> pq = new PriorityQueue<>(policy::compare);
        pq.offer(r1);
        pq.offer(r2);

        assertEquals("R2", pq.poll().getReportId(), "Earlier reportOrder (2) should break complete tie");
    }
}

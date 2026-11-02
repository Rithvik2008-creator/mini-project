package com.example.roadmaintenance;

import com.example.roadmaintenance.algorithm.PathResult;
import com.example.roadmaintenance.algorithm.RoadNetwork;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

public class RoadNetworkDijkstraTest {

    private RoadNetwork network;

    @BeforeEach
    void setUp() {
        network = new RoadNetwork();
        network.addLocation("A");
        network.addLocation("B");
        network.addLocation("C");
        network.addLocation("D");
        network.addLocation("Isolated");

        network.addRoad("A", "B", 10);
        network.addRoad("B", "C", 15);
        network.addRoad("A", "C", 30);
        network.addRoad("C", "D", 5);
    }

    @Test
    @DisplayName("Should find fastest route between connected locations")
    void testDijkstraShortestRoute() {
        PathResult result = network.dijkstra("A", "C");
        assertTrue(result.isReachable(), "Path should be reachable");
        assertEquals(25, result.getTravelTime(), "Route A -> B -> C (10+15=25) should be faster than direct A -> C (30)");
        assertEquals(List.of("A", "B", "C"), result.getPath());
    }

    @Test
    @DisplayName("Should exclude closed roads and reroute")
    void testDijkstraWithClosedRoad() {
        network.closeRoad("A", "B");
        PathResult result = network.dijkstra("A", "C");
        assertTrue(result.isReachable(), "Alternative path should be reachable");
        assertEquals(30, result.getTravelTime(), "Should take direct road A -> C since A-B is closed");
        assertEquals(List.of("A", "C"), result.getPath());
    }

    @Test
    @DisplayName("Should return unreachable when no path exists or destination is isolated")
    void testDijkstraUnreachable() {
        PathResult result = network.dijkstra("A", "Isolated");
        assertFalse(result.isReachable(), "Isolated node should be unreachable");
        assertTrue(result.getPath().isEmpty(), "Unreachable path should be empty");
    }

    @Test
    @DisplayName("Should dynamically allow reopening closed roads")
    void testOpenRoad() {
        network.closeRoad("A", "B");
        network.openRoad("A", "B");
        PathResult result = network.dijkstra("A", "C");
        assertEquals(25, result.getTravelTime(), "Reopened road should restore fastest path");
    }

    @Test
    @DisplayName("Should handle identical source and destination correctly")
    void testIdenticalSourceAndDestination() {
        PathResult result = network.dijkstra("A", "A");
        assertTrue(result.isReachable(), "Path to self should be reachable");
        assertEquals(0, result.getTravelTime(), "Travel time to self should be 0");
        assertEquals(List.of("A"), result.getPath());
    }

    @Test
    @DisplayName("Should return clear unreachable result for unknown locations")
    void testUnknownLocations() {
        PathResult result1 = network.dijkstra("NonExistentStart", "B");
        assertFalse(result1.isReachable(), "Unknown source must be unreachable");

        PathResult result2 = network.dijkstra("A", "NonExistentEnd");
        assertFalse(result2.isReachable(), "Unknown destination must be unreachable");

        PathResult result3 = network.dijkstra("Unknown1", "Unknown2");
        assertFalse(result3.isReachable(), "Both unknown locations must be unreachable");
    }

    @Test
    @DisplayName("Should ignore negative or zero road weights")
    void testNonNegativeEdgeWeightsEnforced() {
        network.addRoad("A", "Isolated", -10);
        PathResult result = network.dijkstra("A", "Isolated");
        assertFalse(result.isReachable(), "Negative edge must not be added to road graph");
    }
}

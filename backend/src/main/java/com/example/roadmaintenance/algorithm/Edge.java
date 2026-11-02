package com.example.roadmaintenance.algorithm;

public class Edge {
    private final String destination;
    private final int travelTime;

    public Edge(String destination, int travelTime) {
        this.destination = destination;
        this.travelTime = travelTime;
    }

    public String getDestination() {
        return destination;
    }

    public int getTravelTime() {
        return travelTime;
    }
}

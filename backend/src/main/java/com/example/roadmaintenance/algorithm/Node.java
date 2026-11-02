package com.example.roadmaintenance.algorithm;

public class Node {
    private final String location;
    private final int distance;

    public Node(String location, int distance) {
        this.location = location;
        this.distance = distance;
    }

    public String getLocation() {
        return location;
    }

    public int getDistance() {
        return distance;
    }
}

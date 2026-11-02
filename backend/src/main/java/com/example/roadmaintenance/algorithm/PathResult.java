package com.example.roadmaintenance.algorithm;

import java.util.Collections;
import java.util.List;

public class PathResult {
    private final int travelTime;
    private final List<String> path;

    public PathResult(int travelTime, List<String> path) {
        this.travelTime = travelTime;
        this.path = path;
    }

    public static PathResult unreachable() {
        return new PathResult(Integer.MAX_VALUE, Collections.emptyList());
    }

    public boolean isReachable() {
        return travelTime != Integer.MAX_VALUE;
    }

    public int getTravelTime() {
        return travelTime;
    }

    public List<String> getPath() {
        return path;
    }
}

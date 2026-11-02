package com.example.roadmaintenance.algorithm;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.PriorityQueue;
import java.util.Set;

public class RoadNetwork {

    private final Map<String, List<Edge>> graph = new HashMap<>();
    private final Set<String> closedRoads = new HashSet<>();

    public void addLocation(String location) {
        String key = normalize(location);
        if (key.isEmpty() || graph.containsKey(key)) {
            return;
        }
        graph.put(key, new ArrayList<>());
    }

    public boolean hasLocation(String location) {
        return graph.containsKey(normalize(location));
    }

    public void addRoad(String source, String destination, int travelTime) {
        String normalizedSource = normalize(source);
        String normalizedDestination = normalize(destination);
        if (normalizedSource.isEmpty() || normalizedDestination.isEmpty() || normalizedSource.equals(normalizedDestination) || travelTime <= 0) {
            return;
        }
        addLocation(normalizedSource);
        addLocation(normalizedDestination);
        graph.get(normalizedSource).add(new Edge(normalizedDestination, travelTime));
        graph.get(normalizedDestination).add(new Edge(normalizedSource, travelTime));
    }

    public void closeRoad(String source, String destination) {
        closedRoads.add(roadKey(source, destination));
    }

    public void openRoad(String source, String destination) {
        closedRoads.remove(roadKey(source, destination));
    }

    public PathResult dijkstra(String source, String destination) {
        String normalizedSource = normalize(source);
        String normalizedDestination = normalize(destination);

        if (!graph.containsKey(normalizedSource) || !graph.containsKey(normalizedDestination)) {
            return PathResult.unreachable();
        }

        Map<String, Integer> distance = new HashMap<>();
        Map<String, String> previous = new HashMap<>();
        PriorityQueue<Node> queue = new PriorityQueue<>(Comparator.comparingInt(Node::getDistance));

        for (String location : graph.keySet()) {
            distance.put(location, Integer.MAX_VALUE);
        }

        distance.put(normalizedSource, 0);
        queue.offer(new Node(normalizedSource, 0));

        while (!queue.isEmpty()) {
            Node current = queue.poll();
            if (current.getDistance() != distance.get(current.getLocation())) {
                continue;
            }
            if (current.getLocation().equals(normalizedDestination)) {
                break;
            }
            for (Edge edge : graph.get(current.getLocation())) {
                if (isRoadClosed(current.getLocation(), edge.getDestination())) {
                    continue;
                }
                int newDistance = current.getDistance() + edge.getTravelTime();
                if (newDistance < distance.get(edge.getDestination())) {
                    distance.put(edge.getDestination(), newDistance);
                    previous.put(edge.getDestination(), current.getLocation());
                    queue.offer(new Node(edge.getDestination(), newDistance));
                }
            }
        }

        if (distance.get(normalizedDestination) == Integer.MAX_VALUE) {
            return PathResult.unreachable();
        }

        List<String> path = new ArrayList<>();
        String current = normalizedDestination;
        while (current != null) {
            path.add(current);
            current = previous.get(current);
        }
        java.util.Collections.reverse(path);
        return new PathResult(distance.get(normalizedDestination), path);
    }

    private boolean isRoadClosed(String a, String b) {
        return closedRoads.contains(roadKey(a, b));
    }

    private String roadKey(String a, String b) {
        String left = normalize(a);
        String right = normalize(b);
        return left.compareTo(right) < 0 ? left + "|" + right : right + "|" + left;
    }

    private String normalize(String value) {
        return value == null ? "" : value.trim();
    }
}

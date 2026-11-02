import java.util.*;

/*
 * SMART MUNICIPAL ROAD MAINTENANCE
 * AND RESOURCE ALLOCATION SYSTEM
 *
 * Java OOP + Data Structures + PriorityQueue + Dijkstra Algorithm
 *
 * Features:
 * - Dynamic locations, roads, teams and damage reports
 * - OOP: Encapsulation, Inheritance, Abstraction, Polymorphism
 * - PriorityQueue for repair priority
 * - Dijkstra for fastest route
 * - Equipment-based team selection
 * - Road closing/opening
 * - Automatic report status management
 * - Manual report status update
 */

// ============================================================
// ENUM: EQUIPMENT
// ============================================================

enum Equipment {
    EXCAVATOR,
    ASPHALT_MIXER,
    ROAD_ROLLER,
    SAFETY_BARRICADE,
    JACKHAMMER,
    TRAFFIC_CONE
}

// ============================================================
// ENUM: REPORT STATUS
// ============================================================

enum ReportStatus {
    PENDING,
    ASSIGNED,
    COMPLETED
}

// ============================================================
// CLASS: ROAD DAMAGE
// ============================================================

class RoadDamage {

    private final String reportId;
    private final String location;
    private final String repairType;

    private int severity;
    private int accidentRisk;
    private int trafficRank;
    private int roadImportance;

    private final int reportOrder;

    private ReportStatus status;

    public RoadDamage(
            String reportId,
            String location,
            String repairType,
            int severity,
            int accidentRisk,
            int trafficRank,
            int roadImportance,
            int reportOrder) {

        this.reportId = reportId;
        this.location = location;
        this.repairType = repairType;

        this.severity = severity;
        this.accidentRisk = accidentRisk;
        this.trafficRank = trafficRank;
        this.roadImportance = roadImportance;

        this.reportOrder = reportOrder;

        // Every new report starts as PENDING
        this.status = ReportStatus.PENDING;
    }

    // ========================================================
    // GETTERS
    // ========================================================

    public String getReportId() {
        return reportId;
    }

    public String getLocation() {
        return location;
    }

    public String getRepairType() {
        return repairType;
    }

    public int getSeverity() {
        return severity;
    }

    public int getAccidentRisk() {
        return accidentRisk;
    }

    public int getTrafficRank() {
        return trafficRank;
    }

    public int getRoadImportance() {
        return roadImportance;
    }

    public int getReportOrder() {
        return reportOrder;
    }

    public ReportStatus getStatus() {
        return status;
    }

    // ========================================================
    // STATUS METHODS
    // ========================================================

    public boolean isAssigned() {
        return status == ReportStatus.ASSIGNED;
    }

    public boolean isCompleted() {
        return status == ReportStatus.COMPLETED;
    }

    public boolean isPending() {
        return status == ReportStatus.PENDING;
    }

    public void setAssigned() {
        status = ReportStatus.ASSIGNED;
    }

    public void setCompleted() {
        status = ReportStatus.COMPLETED;
    }

    public void setPending() {
        status = ReportStatus.PENDING;
    }

    // ========================================================
    // MANUAL STATUS UPDATE
    // ========================================================

    public boolean updateStatus(ReportStatus newStatus) {

        if (newStatus == null) {
            return false;
        }

        status = newStatus;
        return true;
    }

    // ========================================================
    // UPDATE DAMAGE
    // ========================================================

    public void updateDamage(
            int severity,
            int accidentRisk,
            int trafficRank,
            int roadImportance) {

        if (isAssigned() || isCompleted()) {
            System.out.println(
                    "Assigned or completed reports cannot be updated."
            );
            return;
        }

        this.severity = severity;
        this.accidentRisk = accidentRisk;
        this.trafficRank = trafficRank;
        this.roadImportance = roadImportance;

        System.out.println("Damage report updated successfully.");
    }

    // ========================================================
    // DISPLAY
    // ========================================================

    public void display() {

        System.out.printf(
                "%-8s %-18s %-18s Sev:%d Risk:%d Traffic:%d Importance:%d Status:%s%n",
                reportId,
                location,
                repairType,
                severity,
                accidentRisk,
                trafficRank,
                roadImportance,
                status
        );
    }
}

// ============================================================
// ABSTRACT CLASS: REPAIR JOB
// ============================================================

abstract class RepairJob {

    protected final RoadDamage damage;

    protected RepairJob(RoadDamage damage) {
        this.damage = damage;
    }

    public RoadDamage getDamage() {
        return damage;
    }

    public abstract Set<Equipment> requiredEquipment();

    public abstract String getJobType();
}

// ============================================================
// SUBCLASS: POTHOLE REPAIR
// ============================================================

class PotholeRepair extends RepairJob {

    public PotholeRepair(RoadDamage damage) {
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

// ============================================================
// SUBCLASS: RESURFACING REPAIR
// ============================================================

class ResurfacingRepair extends RepairJob {

    public ResurfacingRepair(RoadDamage damage) {
        super(damage);
    }

    @Override
    public Set<Equipment> requiredEquipment() {

        return EnumSet.of(
                Equipment.ASPHALT_MIXER,
                Equipment.ROAD_ROLLER,
                Equipment.SAFETY_BARRICADE
        );
    }

    @Override
    public String getJobType() {
        return "ROAD RESURFACING";
    }
}

// ============================================================
// INTERFACE: PRIORITY POLICY
// ============================================================

interface RepairPriorityPolicy {

    int compare(RoadDamage a, RoadDamage b);
}

// ============================================================
// PRIORITY POLICY
// ============================================================

class StandardRepairPriorityPolicy
        implements RepairPriorityPolicy {

    @Override
    public int compare(RoadDamage a, RoadDamage b) {

        // 1. Severity
        int result = Integer.compare(
                b.getSeverity(),
                a.getSeverity()
        );

        if (result != 0) {
            return result;
        }

        // 2. Accident Risk
        result = Integer.compare(
                b.getAccidentRisk(),
                a.getAccidentRisk()
        );

        if (result != 0) {
            return result;
        }

        // 3. Road Importance
        result = Integer.compare(
                b.getRoadImportance(),
                a.getRoadImportance()
        );

        if (result != 0) {
            return result;
        }

        // 4. Traffic Rank
        result = Integer.compare(
                b.getTrafficRank(),
                a.getTrafficRank()
        );

        if (result != 0) {
            return result;
        }

        // 5. Earlier report gets priority
        return Integer.compare(
                a.getReportOrder(),
                b.getReportOrder()
        );
    }
}

// ============================================================
// CLASS: MAINTENANCE TEAM
// ============================================================

class MaintenanceTeam {

    private final String teamId;
    private final String teamName;

    private String currentLocation;

    private final Set<Equipment> equipment;

    private RepairJob currentJob;

    public MaintenanceTeam(
            String teamId,
            String teamName,
            String currentLocation,
            Set<Equipment> equipment) {

        this.teamId = teamId;
        this.teamName = teamName;
        this.currentLocation = currentLocation;

        this.equipment = EnumSet.copyOf(equipment);
    }

    // ========================================================
    // GETTERS
    // ========================================================

    public String getTeamId() {
        return teamId;
    }

    public String getTeamName() {
        return teamName;
    }

    public String getCurrentLocation() {
        return currentLocation;
    }

    // ========================================================
    // TEAM AVAILABILITY
    // ========================================================

    public boolean isAvailable() {
        return currentJob == null;
    }

    // ========================================================
    // EQUIPMENT CHECK
    // ========================================================

    public boolean hasRequiredEquipment(
            Set<Equipment> required) {

        return equipment.containsAll(required);
    }

    // ========================================================
    // ASSIGN JOB
    // ========================================================

    public boolean assignJob(RepairJob job) {

        if (!isAvailable()) {

            System.out.println(
                    "Team is already busy."
            );

            return false;
        }

        if (!hasRequiredEquipment(
                job.requiredEquipment())) {

            System.out.println(
                    "Team does not have the required equipment."
            );

            return false;
        }

        currentJob = job;

        job.getDamage().setAssigned();

        System.out.println(
                teamName + " assigned to "
                        + job.getDamage().getReportId()
        );

        return true;
    }

    // ========================================================
    // COMPLETE REPAIR
    // ========================================================

    public void completeRepair() {

        if (currentJob == null) {

            System.out.println(
                    "This team has no active repair."
            );

            return;
        }

        RoadDamage damage =
                currentJob.getDamage();

        damage.setCompleted();

        // Team moves to repaired location
        currentLocation =
                damage.getLocation();

        // Team becomes available
        currentJob = null;

        System.out.println(
                teamName + " completed "
                        + damage.getReportId()
        );
    }

    // ========================================================
    // DISPLAY TEAM
    // ========================================================

    public void display() {

        System.out.println(
                "\nTeam ID: " + teamId
        );

        System.out.println(
                "Team Name: " + teamName
        );

        System.out.println(
                "Location: " + currentLocation
        );

        System.out.println(
                "Available: " + isAvailable()
        );

        System.out.println(
                "Equipment: " + equipment
        );

        if (currentJob != null) {

            System.out.println(
                    "Current Job: "
                            + currentJob
                            .getDamage()
                            .getReportId()
            );
        }
    }
}

// ============================================================
// CLASS: EDGE
// ============================================================

class Edge {

    final String destination;
    final int travelTime;

    Edge(
            String destination,
            int travelTime) {

        this.destination = destination;
        this.travelTime = travelTime;
    }
}

// ============================================================
// CLASS: ROAD NETWORK
// ============================================================

class RoadNetwork {

    private final Map<String, List<Edge>> graph =
            new HashMap<>();

    private final Set<String> closedRoads =
            new HashSet<>();

    // ========================================================
    // ADD LOCATION
    // ========================================================

    public boolean addLocation(String location) {

        String key = normalize(location);

        if (key.isEmpty()
                || graph.containsKey(key)) {

            return false;
        }

        graph.put(
                key,
                new ArrayList<>()
        );

        return true;
    }

    // ========================================================
    // CHECK LOCATION
    // ========================================================

    public boolean hasLocation(String location) {

        return graph.containsKey(
                normalize(location)
        );
    }

    // ========================================================
    // ADD ROAD
    // ========================================================

    public boolean addRoad(
            String source,
            String destination,
            int travelTime) {

        source = normalize(source);
        destination = normalize(destination);

        if (source.isEmpty()
                || destination.isEmpty()
                || source.equals(destination)
                || travelTime <= 0) {

            return false;
        }

        addLocation(source);
        addLocation(destination);

        // Undirected graph
        graph.get(source).add(
                new Edge(
                        destination,
                        travelTime
                )
        );

        graph.get(destination).add(
                new Edge(
                        source,
                        travelTime
                )
        );

        return true;
    }

    // ========================================================
    // CLOSE ROAD
    // ========================================================

    public void closeRoad(
            String source,
            String destination) {

        closedRoads.add(
                roadKey(source, destination)
        );

        System.out.println(
                "Road closed: "
                        + source
                        + " <-> "
                        + destination
        );
    }

    // ========================================================
    // OPEN ROAD
    // ========================================================

    public void openRoad(
            String source,
            String destination) {

        closedRoads.remove(
                roadKey(source, destination)
        );

        System.out.println(
                "Road opened: "
                        + source
                        + " <-> "
                        + destination
        );
    }

    // ========================================================
    // ROAD KEY
    // ========================================================

    private String roadKey(
            String a,
            String b) {

        a = normalize(a);
        b = normalize(b);

        return a.compareTo(b) < 0
                ? a + "|" + b
                : b + "|" + a;
    }

    // ========================================================
    // CHECK CLOSED ROAD
    // ========================================================

    private boolean isRoadClosed(
            String a,
            String b) {

        return closedRoads.contains(
                roadKey(a, b)
        );
    }

    // ========================================================
    // NORMALIZE LOCATION
    // ========================================================

    private String normalize(String value) {

        return value == null
                ? ""
                : value.trim();
    }

    // ========================================================
    // DIJKSTRA'S ALGORITHM
    // ========================================================

    public PathResult dijkstra(
            String source,
            String destination) {

        source = normalize(source);
        destination = normalize(destination);

        if (!graph.containsKey(source)
                || !graph.containsKey(destination)) {

            return PathResult.unreachable();
        }

        // Stores shortest known distance
        Map<String, Integer> distance =
                new HashMap<>();

        // Stores previous node
        Map<String, String> previous =
                new HashMap<>();

        // PriorityQueue selects smallest distance
        PriorityQueue<Node> queue =
                new PriorityQueue<>(
                        Comparator.comparingInt(
                                n -> n.distance
                        )
                );

        // Initially all distances are infinity
        for (String location :
                graph.keySet()) {

            distance.put(
                    location,
                    Integer.MAX_VALUE
            );
        }

        // Source distance is zero
        distance.put(source, 0);

        queue.offer(
                new Node(source, 0)
        );

        while (!queue.isEmpty()) {

            Node current = queue.poll();

            // Ignore outdated queue entry
            if (current.distance
                    != distance.get(
                    current.location)) {

                continue;
            }

            // Destination reached
            if (current.location
                    .equals(destination)) {

                break;
            }

            // Explore neighboring roads
            for (Edge edge :
                    graph.get(
                            current.location)) {

                // Ignore closed roads
                if (isRoadClosed(
                        current.location,
                        edge.destination)) {

                    continue;
                }

                int newDistance =
                        current.distance
                                + edge.travelTime;

                // Relaxation
                if (newDistance
                        < distance.get(
                        edge.destination)) {

                    distance.put(
                            edge.destination,
                            newDistance
                    );

                    previous.put(
                            edge.destination,
                            current.location
                    );

                    queue.offer(
                            new Node(
                                    edge.destination,
                                    newDistance
                            )
                    );
                }
            }
        }

        // Destination cannot be reached
        if (distance.get(destination)
                == Integer.MAX_VALUE) {

            return PathResult.unreachable();
        }

        // Reconstruct path
        List<String> path =
                new ArrayList<>();

        String current = destination;

        while (current != null) {

            path.add(current);

            current =
                    previous.get(current);
        }

        Collections.reverse(path);

        return new PathResult(
                distance.get(destination),
                path
        );
    }
}

// ============================================================
// PATH RESULT
// ============================================================

class PathResult {

    final int travelTime;
    final List<String> path;

    PathResult(
            int travelTime,
            List<String> path) {

        this.travelTime = travelTime;
        this.path = path;
    }

    static PathResult unreachable() {

        return new PathResult(
                Integer.MAX_VALUE,
                Collections.emptyList()
        );
    }

    boolean isReachable() {

        return travelTime
                != Integer.MAX_VALUE;
    }
}

// ============================================================
// DIJKSTRA NODE
// ============================================================

class Node {

    final String location;
    final int distance;

    Node(
            String location,
            int distance) {

        this.location = location;
        this.distance = distance;
    }
}

// ============================================================
// MAIN SYSTEM
// ============================================================

public class Main {

    private static final Scanner scanner =
            new Scanner(System.in);

    private static final Map<String, RoadDamage> reports =
            new LinkedHashMap<>();

    private static final Map<String, MaintenanceTeam> teams =
            new LinkedHashMap<>();

    private static final RoadNetwork network =
            new RoadNetwork();

    private static final RepairPriorityPolicy priorityPolicy =
            new StandardRepairPriorityPolicy();

    private static int reportCounter = 1;

    // ========================================================
    // MAIN METHOD
    // ========================================================

    public static void main(String[] args) {

        int choice;

        do {

            showMenu();

            choice = readMenuChoice();

            switch (choice) {

                case 1 ->
                        displayReports();

                case 2 ->
                        displayTeams();

                case 3 ->
                        showPriorityQueue();

                case 4 ->
                        assignHighestPriorityJob();

                case 5 ->
                        completeTeamJob();

                case 6 ->
                        updateDamageReport();

                case 7 ->
                        closeRoad();

                case 8 ->
                        openRoad();

                case 9 ->
                        findRoute();

                case 10 ->
                        addDamageReport();

                case 11 ->
                        addLocation();

                case 12 ->
                        addRoad();

                case 13 ->
                        addTeam();

                case 14 ->
                        updateReportStatus();

                case 0 ->
                        System.out.println(
                                "\nApplication closed."
                        );

                default ->
                        System.out.println(
                                "Invalid choice."
                        );
            }

        } while (choice != 0);

        scanner.close();
    }

    // ========================================================
    // MENU
    // ========================================================

    private static void showMenu() {

        System.out.println(
                "\n=============================================="
        );

        System.out.println(
                " SMART MUNICIPAL ROAD MAINTENANCE SYSTEM"
        );

        System.out.println(
                "=============================================="
        );

        System.out.println(
                "1. Display Damage Reports"
        );

        System.out.println(
                "2. Display Maintenance Teams"
        );

        System.out.println(
                "3. Display Repair Priority"
        );

        System.out.println(
                "4. Assign Highest Priority Repair"
        );

        System.out.println(
                "5. Complete Team Repair"
        );

        System.out.println(
                "6. Update Damage Report"
        );

        System.out.println(
                "7. Close Road"
        );

        System.out.println(
                "8. Open Road"
        );

        System.out.println(
                "9. Find Fastest Route"
        );

        System.out.println(
                "10. Add Damage Report"
        );

        System.out.println(
                "11. Add Location"
        );

        System.out.println(
                "12. Add Road"
        );

        System.out.println(
                "13. Add Maintenance Team"
        );

        // NEW OPTION
        System.out.println(
                "14. Update Report Status"
        );

        System.out.println(
                "0. Exit"
        );

        System.out.println(
                "=============================================="
        );
    }

    // ========================================================
    // ADD LOCATION
    // ========================================================

    private static void addLocation() {

        String location =
                readText(
                        "Enter location name: "
                );

        if (network.addLocation(location)) {

            System.out.println(
                    "Location added successfully."
            );

        } else {

            System.out.println(
                    "Location already exists or is invalid."
            );
        }
    }

    // ========================================================
    // ADD ROAD
    // ========================================================

    private static void addRoad() {

        String source =
                readText(
                        "Enter first location: "
                );

        String destination =
                readText(
                        "Enter second location: "
                );

        int travelTime =
                readPositiveInt(
                        "Enter travel time in minutes: "
                );

        if (network.addRoad(
                source,
                destination,
                travelTime)) {

            System.out.println(
                    "Road added successfully."
            );

        } else {

            System.out.println(
                    "Unable to add road."
            );
        }
    }

    // ========================================================
    // ADD TEAM
    // ========================================================

    private static void addTeam() {

        String id =
                readText(
                        "Enter Team ID: "
                ).toUpperCase();

        if (teams.containsKey(id)) {

            System.out.println(
                    "Team ID already exists."
            );

            return;
        }

        String name =
                readText(
                        "Enter Team Name: "
                );

        String location =
                readText(
                        "Enter current location: "
                );

        if (!network.hasLocation(location)) {

            System.out.println(
                    "Location does not exist. "
                            + "Add the location first."
            );

            return;
        }

        Set<Equipment> equipment =
                readEquipment();

        teams.put(
                id,
                new MaintenanceTeam(
                        id,
                        name,
                        location,
                        equipment
                )
        );

        System.out.println(
                "Maintenance team added successfully."
        );
    }

    // ========================================================
    // READ EQUIPMENT
    // ========================================================

    private static Set<Equipment> readEquipment() {

        Set<Equipment> selected =
                EnumSet.noneOf(
                        Equipment.class
                );

        System.out.println(
                "\nAvailable equipment:"
        );

        Equipment[] values =
                Equipment.values();

        for (int i = 0;
             i < values.length;
             i++) {

            System.out.println(
                    (i + 1)
                            + ". "
                            + values[i]
            );
        }

        String input =
                readText(
                        "Enter equipment numbers "
                                + "separated by commas "
                                + "(example: 1,2,6): "
                );

        for (String part :
                input.split(",")) {

            try {

                int number =
                        Integer.parseInt(
                                part.trim()
                        );

                if (number >= 1
                        && number <= values.length) {

                    selected.add(
                            values[number - 1]
                    );
                }

            } catch (NumberFormatException ignored) {
                // Ignore invalid entries
            }
        }

        return selected;
    }

    // ========================================================
    // DISPLAY TEAMS
    // ========================================================

    private static void displayTeams() {

        System.out.println(
                "\n------------- MAINTENANCE TEAMS -------------"
        );

        if (teams.isEmpty()) {

            System.out.println(
                    "No maintenance teams available."
            );

            return;
        }

        for (MaintenanceTeam team :
                teams.values()) {

            team.display();
        }
    }

    // ========================================================
    // ADD DAMAGE REPORT
    // ========================================================

    private static void addDamageReport() {

        String id =
                readText(
                        "Enter Report ID: "
                ).toUpperCase();

        if (reports.containsKey(id)) {

            System.out.println(
                    "Duplicate report ID."
            );

            return;
        }

        String location =
                readText(
                        "Enter location: "
                );

        if (!network.hasLocation(location)) {

            System.out.println(
                    "Location does not exist."
            );

            return;
        }

        String repairType =
                readRepairType();

        int severity =
                readRating("Severity");

        int risk =
                readRating("Accident Risk");

        int traffic =
                readRating("Traffic Rank");

        int importance =
                readRating("Road Importance");

        RoadDamage damage =
                new RoadDamage(
                        id,
                        location,
                        repairType,
                        severity,
                        risk,
                        traffic,
                        importance,
                        reportCounter++
                );

        reports.put(id, damage);

        System.out.println(
                "Damage report added successfully."
        );

        System.out.println(
                "Initial Status: PENDING"
        );
    }

    // ========================================================
    // READ REPAIR TYPE
    // ========================================================

    private static String readRepairType() {

        while (true) {

            System.out.println(
                    "\nRepair Type:"
            );

            System.out.println(
                    "1. Pothole Repair"
            );

            System.out.println(
                    "2. Road Resurfacing"
            );

            int choice =
                    readInt(
                            "Enter choice: "
                    );

            if (choice == 1) {
                return "POTHOLE";
            }

            if (choice == 2) {
                return "RESURFACING";
            }

            System.out.println(
                    "Enter 1 or 2."
            );
        }
    }

    // ========================================================
    // DISPLAY REPORTS
    // ========================================================

    private static void displayReports() {

        System.out.println(
                "\n------------- DAMAGE REPORTS -------------"
        );

        if (reports.isEmpty()) {

            System.out.println(
                    "No damage reports available."
            );

            return;
        }

        for (RoadDamage report :
                reports.values()) {

            report.display();
        }
    }

    // ========================================================
    // UPDATE DAMAGE REPORT
    // ========================================================

    private static void updateDamageReport() {

        String id =
                readText(
                        "Enter Report ID: "
                ).toUpperCase();

        RoadDamage report =
                reports.get(id);

        if (report == null) {

            System.out.println(
                    "Report not found."
            );

            return;
        }

        if (report.isAssigned()
                || report.isCompleted()) {

            System.out.println(
                    "Assigned or completed "
                            + "reports cannot be updated."
            );

            return;
        }

        int severity =
                readRating(
                        "New Severity"
                );

        int risk =
                readRating(
                        "New Accident Risk"
                );

        int traffic =
                readRating(
                        "New Traffic Rank"
                );

        int importance =
                readRating(
                        "New Road Importance"
                );

        report.updateDamage(
                severity,
                risk,
                traffic,
                importance
        );
    }

    // ========================================================
    // NEW: UPDATE REPORT STATUS
    // ========================================================

    private static void updateReportStatus() {

        System.out.println(
                "\n------------- UPDATE REPORT STATUS -------------"
        );

        String id =
                readText(
                        "Enter Report ID: "
                ).toUpperCase();

        RoadDamage report =
                reports.get(id);

        if (report == null) {

            System.out.println(
                    "Report not found."
            );

            return;
        }

        System.out.println(
                "\nCurrent Status: "
                        + report.getStatus()
        );

        System.out.println(
                "\nSelect New Status:"
        );

        System.out.println(
                "1. PENDING"
        );

        System.out.println(
                "2. ASSIGNED"
        );

        System.out.println(
                "3. COMPLETED"
        );

        System.out.println(
                "0. Cancel"
        );

        int choice =
                readInt(
                        "Enter choice: "
                );

        ReportStatus newStatus;

        switch (choice) {

            case 1:
                newStatus =
                        ReportStatus.PENDING;
                break;

            case 2:
                newStatus =
                        ReportStatus.ASSIGNED;
                break;

            case 3:
                newStatus =
                        ReportStatus.COMPLETED;
                break;

            case 0:
                System.out.println(
                        "Status update cancelled."
                );
                return;

            default:
                System.out.println(
                        "Invalid status choice."
                );
                return;
        }

        report.updateStatus(newStatus);

        System.out.println(
                "Report status updated successfully."
        );

        System.out.println(
                "Report ID: "
                        + report.getReportId()
        );

        System.out.println(
                "New Status: "
                        + report.getStatus()
        );
    }

    // ========================================================
    // CREATE PRIORITY QUEUE
    // ========================================================

    private static PriorityQueue<RoadDamage>
    createPriorityQueue() {

        PriorityQueue<RoadDamage> queue =
                new PriorityQueue<>(
                        priorityPolicy::compare
                );

        for (RoadDamage report :
                reports.values()) {

            if (!report.isAssigned()
                    && !report.isCompleted()) {

                queue.offer(report);
            }
        }

        return queue;
    }

    // ========================================================
    // DISPLAY PRIORITY
    // ========================================================

    private static void showPriorityQueue() {

        PriorityQueue<RoadDamage> queue =
                createPriorityQueue();

        System.out.println(
                "\n------------- REPAIR PRIORITY -------------"
        );

        if (queue.isEmpty()) {

            System.out.println(
                    "No pending repair jobs."
            );

            return;
        }

        while (!queue.isEmpty()) {

            queue.poll().display();
        }
    }

    // ========================================================
    // ASSIGN HIGHEST PRIORITY JOB
    // ========================================================

    private static void assignHighestPriorityJob() {

        PriorityQueue<RoadDamage> queue =
                createPriorityQueue();

        if (queue.isEmpty()) {

            System.out.println(
                    "No pending repair jobs."
            );

            return;
        }

        RoadDamage selected = null;

        MaintenanceTeam selectedTeam = null;

        PathResult selectedRoute = null;

        while (!queue.isEmpty()) {

            RoadDamage damage =
                    queue.poll();

            RepairJob job =
                    createRepairJob(damage);

            MaintenanceTeam nearestTeam =
                    null;

            PathResult nearestRoute =
                    null;

            for (MaintenanceTeam team :
                    teams.values()) {

                if (!team.isAvailable()
                        || !team.hasRequiredEquipment(
                        job.requiredEquipment())) {

                    continue;
                }

                PathResult route =
                        network.dijkstra(
                                team.getCurrentLocation(),
                                damage.getLocation()
                        );

                if (route.isReachable()
                        && (nearestRoute == null
                        || route.travelTime
                        < nearestRoute.travelTime)) {

                    nearestTeam = team;
                    nearestRoute = route;
                }
            }

            if (nearestTeam != null) {

                selected = damage;
                selectedTeam = nearestTeam;
                selectedRoute = nearestRoute;

                break;
            }
        }

        if (selected == null) {

            System.out.println(
                    "No reachable team with "
                            + "compatible equipment."
            );

            return;
        }

        RepairJob job =
                createRepairJob(selected);

        System.out.println(
                "\nSelected Report: "
                        + selected.getReportId()
        );

        System.out.println(
                "Job Type: "
                        + job.getJobType()
        );

        System.out.println(
                "Assigned Team: "
                        + selectedTeam.getTeamName()
        );

        System.out.println(
                "Required Equipment: "
                        + job.requiredEquipment()
        );

        System.out.println(
                "Route: "
                        + String.join(
                        " -> ",
                        selectedRoute.path
                )
        );

        System.out.println(
                "Travel Time: "
                        + selectedRoute.travelTime
                        + " minutes"
        );

        selectedTeam.assignJob(job);
    }

    // ========================================================
    // CREATE REPAIR JOB
    // ========================================================

    private static RepairJob createRepairJob(
            RoadDamage damage) {

        if ("RESURFACING".equals(
                damage.getRepairType())) {

            return new ResurfacingRepair(
                    damage
            );
        }

        return new PotholeRepair(
                damage
        );
    }

    // ========================================================
    // COMPLETE TEAM JOB
    // ========================================================

    private static void completeTeamJob() {

        String id =
                readText(
                        "Enter Team ID: "
                ).toUpperCase();

        MaintenanceTeam team =
                teams.get(id);

        if (team == null) {

            System.out.println(
                    "Team not found."
            );

            return;
        }

        if (team.isAvailable()) {

            System.out.println(
                    "This team has no active job."
            );

            return;
        }

        team.completeRepair();
    }

    // ========================================================
    // CLOSE ROAD
    // ========================================================

    private static void closeRoad() {

        String a =
                readText(
                        "Enter first location: "
                );

        String b =
                readText(
                        "Enter second location: "
                );

        if (!network.hasLocation(a)
                || !network.hasLocation(b)) {

            System.out.println(
                    "One or both locations do not exist."
            );

            return;
        }

        network.closeRoad(a, b);
    }

    // ========================================================
    // OPEN ROAD
    // ========================================================

    private static void openRoad() {

        String a =
                readText(
                        "Enter first location: "
                );

        String b =
                readText(
                        "Enter second location: "
                );

        if (!network.hasLocation(a)
                || !network.hasLocation(b)) {

            System.out.println(
                    "One or both locations do not exist."
            );

            return;
        }

        network.openRoad(a, b);
    }

    // ========================================================
    // FIND FASTEST ROUTE
    // ========================================================

    private static void findRoute() {

        String source =
                readText(
                        "Enter source location: "
                );

        String destination =
                readText(
                        "Enter destination location: "
                );

        PathResult result =
                network.dijkstra(
                        source,
                        destination
                );

        if (!result.isReachable()) {

            System.out.println(
                    "Destination is not reachable."
            );

            return;
        }

        System.out.println(
                "\nFastest Route:"
        );

        System.out.println(
                String.join(
                        " -> ",
                        result.path
                )
        );

        System.out.println(
                "Total Travel Time: "
                        + result.travelTime
                        + " minutes"
        );
    }

    // ========================================================
    // INPUT VALIDATION
    // ========================================================

    private static int readMenuChoice() {

        return readInt(
                "Enter your choice: "
        );
    }

    private static int readRating(
            String name) {

        while (true) {

            int value =
                    readInt(
                            name + " (1-3): "
                    );

            if (value >= 1
                    && value <= 3) {

                return value;
            }

            System.out.println(
                    "Enter a value between 1 and 3."
            );
        }
    }

    private static int readPositiveInt(
            String message) {

        while (true) {

            int value =
                    readInt(message);

            if (value > 0) {

                return value;
            }

            System.out.println(
                    "Enter a positive number."
            );
        }
    }

    private static int readInt(
            String message) {

        while (true) {

            System.out.print(message);

            try {

                return Integer.parseInt(
                        scanner
                                .nextLine()
                                .trim()
                );

            } catch (NumberFormatException e) {

                System.out.println(
                        "Please enter a valid number."
                );
            }
        }
    }

    private static String readText(
            String message) {

        while (true) {

            System.out.print(message);

            String value =
                    scanner
                            .nextLine()
                            .trim();

            if (!value.isEmpty()) {

                return value;
            }

            System.out.println(
                    "Input cannot be empty."
            );
        }
    }
}
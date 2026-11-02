# SMART MUNICIPAL ROAD MAINTENANCE AND RESOURCE ALLOCATION SYSTEM

A complete enterprise-grade full-stack web application designed for municipal infrastructure monitoring, damage assessment, automated work crew dispatching, shortest-path emergency navigation, and priority-driven repairs.

Built with **React (TypeScript + Vite + Tailwind CSS)**, **Java (Spring Boot 3 + Spring Data JPA + Spring Security)**, and **MySQL**.

**GitHub Repository**: [https://github.com/Rithvik2008-creator/mini-project.git](https://github.com/Rithvik2008-creator/mini-project.git)

---

## 1. System Architecture & Algorithms

The system implements core object-oriented software engineering principles and algorithms:

1. **5-Tier Repair Priority Queue (`StandardRepairPriorityPolicy`)**:
   - Ranked strictly by:
     1. **Severity** (5 &rarr; 1, descending)
     2. **Accident Risk** (5 &rarr; 1, descending)
     3. **Road Importance** (5 &rarr; 1, descending)
     4. **Traffic Rank** (5 &rarr; 1, descending)
     5. **Report Order** (earlier report order FIFO tie-breaker)
2. **Dijkstra Shortest-Path Algorithm (`RoadNetwork`)**:
   - Weighted graph with non-negative weights representing municipal road connections.
   - Calculates minimum total travel time ($O((V + E) \log V)$) using a priority queue.
   - Dynamic road closure handling (`closeRoad` / `openRoad`) automatically bypasses blocked segments.
   - Handles identical source/destination, disconnected locations, and unknown location queries gracefully.
3. **Equipment Compatibility (`RepairJob` Polymorphism)**:
   - `PotholeRepair`: Requires `JACKHAMMER`, `ASPHALT_MIXER`, `TRAFFIC_CONE`.
   - `ResurfacingRepair`: Requires `ASPHALT_MIXER`, `ROAD_ROLLER`, `SAFETY_BARRICADE`.
   - Dispatched crews must satisfy all required equipment specifications before assignment.
4. **Automated Team Allocation & Relocation**:
   - Scans the priority queue for highest-priority pending jobs.
   - Identifies compatible, available teams with reachable Dijkstra routes.
   - Dispatches the nearest team (minimum travel time).
   - Upon job completion, releases the team back to available status and relocates them to the repaired site.

---

## 2. Security & Role-Based Access Control

- **Spring Security Filter Chain**: Configured with stateless session management, CORS headers, and standard BCrypt password hashing.
- **Gmail SMTP OTP Verification**:
  - Cryptographically secure 6-digit random verification codes.
  - Codes expire after 5 minutes and enforce single-use consumption.
  - Stored exclusively as SHA-256 hashes in MySQL (`email_verifications` table).
  - Rate limited (60-second resend cooldown and 5 attempts per window).
- **Supported Roles**:
  - `ADMIN`: Full administrative access to dashboard, reports, teams, roads, closures, assignments, and audit logs.
  - `MAINTENANCE_STAFF`: Field crew portal to view assignments, navigation routes, and submit completion details.
  - `VIEWER`: Public citizen portal to view live road statuses and submit road damage reports.
- **Privileged Account Protection**: Public signup cannot grant `ADMIN` role without an authorized administrative provisioning key.

---

## 3. Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS v4, Lucide React, Recharts, Axios |
| **Backend** | Java 21 / 26, Spring Boot 3.4.0, Spring Security, Spring Web, Spring Data JPA, Spring Mail |
| **Database** | MySQL Server / MariaDB via MySQL Connector/J (`road_maintenance_db`) |
| **Testing** | JUnit 5, Mockito, Spring Security Test (25 automated test cases) |
| **Build Tools** | Apache Maven 3.9.9, Node.js & npm |

---

## 4. Project Directory Structure

```text
d:/mp/
├── .env.example                               # Environment variable template
├── .gitignore                                 # Git ignore rules for build & secrets
├── README.md                                  # Complete documentation guide
├── run_all.ps1                                # Automated Windows launcher script
├── backend/                                   # Spring Boot Java application
│   ├── pom.xml                                # Maven dependencies & plugins
│   └── src/
│       ├── main/
│       │   ├── java/com/example/roadmaintenance/
│       │   │   ├── RoadMaintenanceApplication.java
│       │   │   ├── algorithm/                 # Dijkstra, PriorityQueue, RepairJob OOP
│       │   │   ├── config/                    # Spring Security & WebSecurityConfig
│       │   │   ├── controller/                # Spring REST API controllers
│       │   │   ├── dto/                       # Request & Response records
│       │   │   ├── entity/                    # JPA Entities (User, Location, Road, Report, etc.)
│       │   │   ├── repository/                # Spring Data JPA Repositories
│       │   │   └── service/                   # Business logic, AuthService, EmailService
│       │   └── resources/
│       │       └── application.properties     # Configurable MySQL & Gmail properties
│       └── test/java/com/example/roadmaintenance/
│           ├── AuthSecurityTest.java          # Spring Security, BCrypt, token & role tests
│           ├── EmailVerificationTest.java     # OTP single-use, expiry, and hashing tests
│           ├── EquipmentCompatibilityTest.java# Tooling & repair job tests
│           ├── PriorityQueueTest.java         # 5-tier tie-breaking JUnit tests
│           └── RoadNetworkDijkstraTest.java   # Dijkstra route & closed road exclusion tests
└── frontend/                                  # React + TypeScript + Vite frontend
    ├── package.json
    ├── vite.config.ts
    ├── tsconfig.json
    └── src/
        ├── App.tsx                            # Root routing layout & role guards
        ├── api.ts                             # Centralized Axios API instance
        ├── types.ts                           # Shared TypeScript models
        ├── components/
        │   ├── Sidebar.tsx                    # Dark-blue municipal sidebar
        │   ├── ProtectedRoute.tsx             # Role-based route authorization
        │   └── StatusBadge.tsx                # Status indicators
        └── pages/
            ├── LoginPage.tsx                  # Secure user authentication
            ├── SignupPage.tsx                 # Registration with Gmail OTP verification
            ├── DashboardPage.tsx              # Municipal analytics & charts
            ├── DamageReportsPage.tsx          # Incident management
            ├── PriorityQueuePage.tsx          # Live ranking queue display
            ├── MaintenanceTeamsPage.tsx       # Equipment & crew availability
            ├── RoadNetworkPage.tsx            # Road connections & dynamic closures
            └── AssignmentsPage.tsx            # Crew dispatching & completion
```

---

## 5. Prerequisites & Environment Setup

### Prerequisites
1. **Java Development Kit (JDK 21 or higher)**
2. **Node.js (v20+ or v24+) & npm**
3. **MySQL Server / XAMPP MariaDB (Port 3306)**
4. **Apache Maven 3.9+**

### Configuration (`.env`)
Create a `.env` file in the root or set the following environment variables:

```bash
# Database Settings
DB_URL=jdbc:mysql://localhost:3306/road_maintenance_db?createDatabaseIfNotExist=true&useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC
DB_USERNAME=root
DB_PASSWORD=

# Gmail SMTP OTP Settings (for account email verification)
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your_email@gmail.com
MAIL_PASSWORD=your_16_character_app_password
MAIL_FROM=your_email@gmail.com

# Administrative Provisioning Secret Key
ADMIN_SECRET_KEY=ADMIN_SECRET_KEY_2026
```

> **Gmail App Password Setup**:
> 1. Go to your Google Account &rarr; Security &rarr; 2-Step Verification.
> 2. Under "App passwords", create an app password named "SmartRoadOps".
> 3. Copy the 16-character code and paste into `MAIL_PASSWORD`.

---

## 6. How to Run the Application Locally

### Option A: One-Click Windows PowerShell Launcher
From the project root:
```powershell
.\run_all.ps1
```

### Option B: Manual Startup

#### 1. Start MySQL Server
```powershell
# Using XAMPP
& "C:\xampp\mysql\bin\mysqld.exe" --defaults-file="C:\xampp\mysql\bin\my.ini" --standalone
```

#### 2. Start Spring Boot Backend
```powershell
cd d:\mp\backend
& "C:\tools\maven\apache-maven-3.9.9\bin\mvn.cmd" spring-boot:run
```
The backend starts at `http://localhost:8080`.

#### 3. Start React Frontend
```powershell
cd d:\mp\frontend
npm.cmd run dev
```
The frontend is accessible at `http://localhost:5173`.

---

## 7. Automated Testing & Verification

### Run Backend Unit & Integration Tests (25 Tests)
```powershell
cd d:\mp\backend
& "C:\tools\maven\apache-maven-3.9.9\bin\mvn.cmd" test
```

### Run Frontend Production Build Check
```powershell
cd d:\mp\frontend
npm.cmd run build
```

---

## 8. Deployment Architecture

- **Frontend**: Deploy `frontend/dist` to **Vercel**, **Netlify**, or **Cloudflare Pages**.
- **Backend**: Containerize `backend` or deploy JAR via **Render**, **Railway**, or **AWS ECS/EC2**.
- **Database**: Cloud MySQL instance (e.g. **Aiven**, **PlanetScale**, or **AWS RDS**).

---

## 9. Default Demo Credentials

| Role | Username / Email | Password |
|---|---|---|
| **Administrator** | `admin` / `admin@smartroadops.gov` | `admin123` |
| **Field Worker** | `sivaslm10@gmail.com` | `admin123` |
| **Citizen / Public** | `rithvik007@gmail.com` | `admin123` |
| **Admin Provisioning Key** | `ADMIN_SECRET_KEY_2026` | *(Used during registration)* |

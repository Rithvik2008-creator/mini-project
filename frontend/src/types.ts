export type ReportStatus = 'PENDING' | 'ASSIGNED' | 'COMPLETED' | 'RESOLVED'

export type RepairType = 'POTHOLE' | 'RESURFACING'

export type UserRole =
  | 'ADMIN'
  | 'MAINTENANCE_STAFF'
  | 'VIEWER'
  | 'WORKER'
  | 'PUBLIC'

export type EquipmentType =
  | 'EXCAVATOR'
  | 'ASPHALT_MIXER'
  | 'ROAD_ROLLER'
  | 'SAFETY_BARRICADE'
  | 'JACKHAMMER'
  | 'TRAFFIC_CONE'

export interface User {
  id: number
  username: string
  fullName: string
  email?: string
  role: UserRole
  teamId?: string | null
  createdAt?: string
}

export interface AuthResponse {
  token: string
  userId: number
  username: string
  fullName: string
  email?: string
  role: UserRole
  teamId?: string | null
}

export interface DamageReport {
  reportId: string
  location: string
  repairType: string
  severity: number
  accidentRisk: number
  trafficRank: number
  roadImportance: number
  reportOrder: number
  status: ReportStatus
  description?: string | null
  imageUrl?: string | null
  latitude?: number | null
  longitude?: number | null
  submittedByUserId?: number | null
  submittedByUsername?: string | null
  submittedAt?: string | null
}

export interface Team {
  teamId: string
  teamName: string
  currentLocation: string
  equipment: EquipmentType[]
  available: boolean
  currentReportId: string | null
  currentAssignmentId: number | null
  currentRoute: string | null
  currentTravelTime: number | null
  assignedWorkers?: string[]
  completedJobsCount?: number
}

export interface Assignment {
  id: number
  reportId: string
  teamId: string
  teamName: string
  location: string
  repairType: string
  route: string
  travelTime: number
  completed: boolean
  startedAt: string
  completedAt: string | null
  severity?: number
  description?: string | null
  imageUrl?: string | null
  completedByUserId?: number | null
  completedByUsername?: string | null
  completionNotes?: string | null
  completionImageUrl?: string | null
}

export interface LocationItem {
  id: number
  name: string
  latitude?: number
  longitude?: number
}

export interface RoadItem {
  id: number
  source: string
  destination: string
  travelTime: number
  closed: boolean
}

export interface DashboardData {
  totalLocations: number
  totalRoadConnections: number
  totalDamageReports: number
  pendingReports: number
  assignedReports: number
  completedReports: number
  availableTeams: number
  busyTeams: number
  closedRoads: number
  highPriorityDamageReports: number
  recentReports: DamageReport[]
  highPriorityReports: DamageReport[]
  recentAssignments: Assignment[]
  completedJobs: Assignment[]
  reportsByStatus: Record<string, number>
  reportsBySeverity: Record<string, number>
}

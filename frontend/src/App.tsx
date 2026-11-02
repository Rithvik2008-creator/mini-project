import React from 'react'
import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { Sidebar } from './components/Sidebar'

import { LoginPage } from './pages/LoginPage'
import { SignupPage } from './pages/SignupPage'
import { DashboardPage } from './pages/DashboardPage'
import { DamageReportsPage } from './pages/DamageReportsPage'
import { PriorityQueuePage } from './pages/PriorityQueuePage'
import { MaintenanceTeamsPage } from './pages/MaintenanceTeamsPage'
import { RoadNetworkPage } from './pages/RoadNetworkPage'
import { RouteFinderPage } from './pages/RouteFinderPage'
import { MapRoutePlannerPage } from './pages/MapRoutePlannerPage'
import { AssignmentsPage } from './pages/AssignmentsPage'
import { CompletedArchivePage } from './pages/CompletedArchivePage'
import { WorkerDashboardPage } from './pages/WorkerDashboardPage'
import { PublicDashboardPage } from './pages/PublicDashboardPage'

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f3f7fb] text-slate-800">
      <div className="flex min-h-screen flex-col lg:flex-row">
        <Sidebar />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Authentication Pages */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />

          {/* Map & Route Planner (Interactive Google Map + Dijkstra) */}
          <Route
            path="/map"
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'FIRE_SERVICE_OFFICER', 'MAINTENANCE_STAFF', 'WORKER', 'VIEWER', 'PUBLIC']}>
                <Layout>
                  <MapRoutePlannerPage />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* Admin & Fire Officer Operations Overview */}
          <Route
            path="/"
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'FIRE_SERVICE_OFFICER']}>
                <Layout>
                  <DashboardPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports"
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'FIRE_SERVICE_OFFICER']}>
                <Layout>
                  <DamageReportsPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/priority"
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'FIRE_SERVICE_OFFICER']}>
                <Layout>
                  <PriorityQueuePage />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* Administrative Resource Management */}
          <Route
            path="/teams"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <Layout>
                  <MaintenanceTeamsPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/assignments"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <Layout>
                  <AssignmentsPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/archive"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <Layout>
                  <CompletedArchivePage />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* Maintenance Staff / Field Worker Protected Routes */}
          <Route
            path="/worker"
            element={
              <ProtectedRoute allowedRoles={['MAINTENANCE_STAFF', 'WORKER']}>
                <Layout>
                  <WorkerDashboardPage />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* Citizen / Public Viewer Protected Routes */}
          <Route
            path="/public"
            element={
              <ProtectedRoute allowedRoles={['VIEWER', 'PUBLIC', 'ADMIN']}>
                <Layout>
                  <PublicDashboardPage />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* Shared Road Network & Route Tools */}
          <Route
            path="/network"
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'FIRE_SERVICE_OFFICER', 'MAINTENANCE_STAFF', 'WORKER', 'VIEWER', 'PUBLIC']}>
                <Layout>
                  <RoadNetworkPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/routes"
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'FIRE_SERVICE_OFFICER', 'MAINTENANCE_STAFF', 'WORKER']}>
                <Layout>
                  <RouteFinderPage />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* Catch-all Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App

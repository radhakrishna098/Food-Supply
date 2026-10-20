import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';

// Navigation Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';

// Public Pages
import Home from './pages/Home';
import HowItWorks from './pages/HowItWorks';
import ImpactOverview from './pages/ImpactOverview';
import Login from './pages/Login';
import Register from './pages/Register';

// Core Workflow Pages
import AvailableDonations from './pages/AvailableDonations';
import DonationDetail from './pages/DonationDetail';
import CreateDonation from './pages/CreateDonation';
import SmartMatchingCenter from './pages/SmartMatchingCenter';
import RequestsManagement from './pages/RequestsManagement';
import PickupTracker from './pages/PickupTracker';
import DonationHistory from './pages/DonationHistory';
import ProfileSettings from './pages/ProfileSettings';
import NotificationsPage from './pages/NotificationsPage';

// Dashboards
import DashboardRouter from './pages/DashboardRouter';

// Admin Pages
import AdminVerifications from './pages/AdminVerifications';
import AdminAuditLogs from './pages/AdminAuditLogs';
import AdminUsers from './pages/AdminUsers';

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <NotificationProvider>
          <div className="flex flex-col min-h-screen bg-[#FAF7F2]">
            <Navbar />
            <main className="flex-1">
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Home />} />
                <Route path="/how-it-works" element={<HowItWorks />} />
                <Route path="/impact" element={<ImpactOverview />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/donations" element={<AvailableDonations />} />
                <Route path="/donations/:id" element={<DonationDetail />} />

                {/* Authenticated Routes */}
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <DashboardRouter />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/donations/create"
                  element={
                    <ProtectedRoute allowedRoles={['donor', 'admin']}>
                      <CreateDonation />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/matching/:donationId"
                  element={
                    <ProtectedRoute>
                      <SmartMatchingCenter />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/requests"
                  element={
                    <ProtectedRoute>
                      <RequestsManagement />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/pickups"
                  element={
                    <ProtectedRoute>
                      <PickupTracker />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/pickups/:id"
                  element={
                    <ProtectedRoute>
                      <PickupTracker />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/history"
                  element={
                    <ProtectedRoute>
                      <DonationHistory />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <ProfileSettings />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/notifications"
                  element={
                    <ProtectedRoute>
                      <NotificationsPage />
                    </ProtectedRoute>
                  }
                />

                {/* Admin-Only Routes */}
                <Route
                  path="/admin/verifications"
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <AdminVerifications />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/audit-logs"
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <AdminAuditLogs />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/users"
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <AdminUsers />
                    </ProtectedRoute>
                  }
                />

                {/* Catch-all fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </NotificationProvider>
      </AuthProvider>
    </Router>
  );
}

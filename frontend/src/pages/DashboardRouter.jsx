import React from 'react';
import { useAuth } from '../context/AuthContext';
import DonorDashboard from './DonorDashboard';
import NgoDashboard from './NgoDashboard';
import VolunteerDashboard from './VolunteerDashboard';
import AdminDashboard from './AdminDashboard';

export default function DashboardRouter() {
  const { user } = useAuth();

  if (!user) return null;

  switch (user.role) {
    case 'donor':
      return <DonorDashboard />;
    case 'recipient':
      return <NgoDashboard />;
    case 'volunteer':
      return <VolunteerDashboard />;
    case 'admin':
      return <AdminDashboard />;
    default:
      return <div>Unknown user role. Please contact support.</div>;
  }
}

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';

// Auth Pages
import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';


// Admin Pages
import AdminDashboard from '../pages/admin/Dashboard';
import AdminNGOs from '../pages/admin/NGOs';
import AdminDonors from '../pages/admin/Donors';
import AdminVolunteers from '../pages/admin/Volunteers';
import AdminDonations from '../pages/admin/Donations';
import AdminRequests from '../pages/admin/Requests';
import AdminAssignments from '../pages/admin/Assignments';
import AdminLiveTracking from '../pages/admin/LiveTracking';
import AdminReports from '../pages/admin/Reports';
import AdminNotifications from '../pages/admin/Notifications';
import AdminLogs from '../pages/admin/Logs';

// Donor Pages
import DonorDashboard from '../pages/donor/Dashboard';
import DonorPostFood from '../pages/donor/PostFood';
import DonorMyDonations from '../pages/donor/MyDonations';
import DonorDonationDetails from '../pages/donor/DonationDetails';
import DonorRequests from '../pages/donor/Requests';
import DonorTracking from '../pages/donor/Tracking';
import DonorNotifications from '../pages/donor/Notifications';
import DonorHistory from '../pages/donor/History';

// NGO Pages
import NGODashboard from '../pages/ngo/Dashboard';
import NGOAvailableFood from '../pages/ngo/AvailableFood';
import NGORequests from '../pages/ngo/Requests';
import NGORequestDetails from '../pages/ngo/RequestDetails';
import NGOTracking from '../pages/ngo/Tracking';
import NGODeliveries from '../pages/ngo/Deliveries';
import NGOBeneficiaries from '../pages/ngo/Beneficiaries';
import NGONotifications from '../pages/ngo/Notifications';
import NGOHistory from '../pages/ngo/History';

// Volunteer Pages
import VolunteerDashboard from '../pages/volunteer/Dashboard';
import VolunteerMyAssignments from '../pages/volunteer/MyAssignments';
import VolunteerAssignmentDetails from '../pages/volunteer/AssignmentDetails';
import VolunteerTracking from '../pages/volunteer/Tracking';
import VolunteerNotifications from '../pages/volunteer/Notifications';
import VolunteerHistory from '../pages/volunteer/History';

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Auth Routes */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      

      {/* Admin Protected Routes */}
      <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/ngos" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminNGOs /></ProtectedRoute>} />
      <Route path="/admin/donors" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminDonors /></ProtectedRoute>} />
      <Route path="/admin/volunteers" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminVolunteers /></ProtectedRoute>} />
      <Route path="/admin/donations" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminDonations /></ProtectedRoute>} />
      <Route path="/admin/requests" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminRequests /></ProtectedRoute>} />
      <Route path="/admin/assignments" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminAssignments /></ProtectedRoute>} />
      <Route path="/admin/tracking" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminLiveTracking /></ProtectedRoute>} />
      <Route path="/admin/reports" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminReports /></ProtectedRoute>} />
     
      <Route path="/admin/notifications" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminNotifications /></ProtectedRoute>} />
      <Route path="/admin/logs" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminLogs /></ProtectedRoute>} />
    
      {/* Donor Protected Routes */}
      <Route path="/donor/dashboard" element={<ProtectedRoute allowedRoles={['DONOR']}><DonorDashboard /></ProtectedRoute>} />
      <Route path="/donor/post-food" element={<ProtectedRoute allowedRoles={['DONOR']}><DonorPostFood /></ProtectedRoute>} />
      <Route path="/donor/donations" element={<ProtectedRoute allowedRoles={['DONOR']}><DonorMyDonations /></ProtectedRoute>} />
      <Route path="/donor/donations/:id" element={<ProtectedRoute allowedRoles={['DONOR']}><DonorDonationDetails /></ProtectedRoute>} />
      <Route path="/donor/requests" element={<ProtectedRoute allowedRoles={['DONOR']}><DonorRequests /></ProtectedRoute>} />
      <Route path="/donor/tracking" element={<ProtectedRoute allowedRoles={['DONOR']}><DonorTracking /></ProtectedRoute>} />
      <Route path="/donor/notifications" element={<ProtectedRoute allowedRoles={['DONOR']}><DonorNotifications /></ProtectedRoute>} />
      <Route path="/donor/history" element={<ProtectedRoute allowedRoles={['DONOR']}><DonorHistory /></ProtectedRoute>} />

      {/* NGO Protected Routes */}
      <Route path="/ngo/dashboard" element={<ProtectedRoute allowedRoles={['NGO']}><NGODashboard /></ProtectedRoute>} />
      <Route path="/ngo/donations" element={<ProtectedRoute allowedRoles={['NGO']}><NGOAvailableFood /></ProtectedRoute>} />
      <Route path="/ngo/requests" element={<ProtectedRoute allowedRoles={['NGO']}><NGORequests /></ProtectedRoute>} />
      <Route path="/ngo/requests/:id" element={<ProtectedRoute allowedRoles={['NGO']}><NGORequestDetails /></ProtectedRoute>} />
      <Route path="/ngo/tracking" element={<ProtectedRoute allowedRoles={['NGO']}><NGOTracking /></ProtectedRoute>} />
      <Route path="/ngo/deliveries" element={<ProtectedRoute allowedRoles={['NGO']}><NGODeliveries /></ProtectedRoute>} />
      <Route path="/ngo/beneficiaries" element={<ProtectedRoute allowedRoles={['NGO']}><NGOBeneficiaries /></ProtectedRoute>} />
      <Route path="/ngo/food-verification" element={<ProtectedRoute allowedRoles={['NGO']}><NGOAvailableFood /></ProtectedRoute>} />
      <Route path="/ngo/notifications" element={<ProtectedRoute allowedRoles={['NGO']}><NGONotifications /></ProtectedRoute>} />
      <Route path="/ngo/history" element={<ProtectedRoute allowedRoles={['NGO']}><NGOHistory /></ProtectedRoute>} />

      {/* Volunteer Protected Routes */}
      <Route path="/volunteer/dashboard" element={<ProtectedRoute allowedRoles={['VOLUNTEER']}><VolunteerDashboard /></ProtectedRoute>} />
      <Route path="/volunteer/assignments" element={<ProtectedRoute allowedRoles={['VOLUNTEER']}><VolunteerMyAssignments /></ProtectedRoute>} />
      <Route path="/volunteer/assignments/:id" element={<ProtectedRoute allowedRoles={['VOLUNTEER']}><VolunteerAssignmentDetails /></ProtectedRoute>} />
      <Route path="/volunteer/tracking" element={<ProtectedRoute allowedRoles={['VOLUNTEER']}><VolunteerTracking /></ProtectedRoute>} />
      <Route path="/volunteer/notifications" element={<ProtectedRoute allowedRoles={['VOLUNTEER']}><VolunteerNotifications /></ProtectedRoute>} />
      <Route path="/volunteer/history" element={<ProtectedRoute allowedRoles={['VOLUNTEER']}><VolunteerHistory /></ProtectedRoute>} />

      {/* Fallback Catch-all Route */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

export default AppRoutes;

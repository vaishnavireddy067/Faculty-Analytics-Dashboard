import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from './components/DashboardLayout';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import FacultyProfile from './pages/FacultyProfile';
import DataEntry from './pages/DataEntry';
import Verification from './pages/Verification';
import Settings from './pages/Settings';
import Reports from './pages/Reports';
import AdminDashboard from './pages/AdminDashboard';
import Analytics from './pages/Analytics';
import AICopilot from './pages/AICopilot';
import Repository from './pages/Repository';
import AccreditationPredictor from './pages/AccreditationPredictor';
import GrantMatcher from './pages/GrantMatcher';
import Leaderboard from './pages/Leaderboard';
import MentorshipBridge from './pages/MentorshipBridge';
import RolesManagement from './pages/RolesManagement';
import CertificatesManagement from './pages/CertificatesManagement';
import CVGenerator from './pages/CVGenerator';
import PBASAppraisal from './pages/PBASAppraisal';
import DepartmentComparison from './pages/DepartmentComparison';
import CollaborationGraph from './pages/CollaborationGraph';
import AuditLogs from './pages/AuditLogs';
import BulkDataManagement from './pages/BulkDataManagement';

// A simple Protected Route wrapper
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('access_token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          
          {/* Protected Routes (Wrapped in Layout) */}
          <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/profile" element={<FacultyProfile />} />
            <Route path="/cv-generator" element={<CVGenerator />} />
            <Route path="/pbas-appraisal" element={<PBASAppraisal />} />
            <Route path="/department-comparison" element={<DepartmentComparison />} />
            <Route path="/collaboration-network" element={<CollaborationGraph />} />
            <Route path="/audit-logs" element={<AuditLogs />} />
            <Route path="/bulk-data" element={<BulkDataManagement />} />
            <Route path="/roles" element={<RolesManagement />} />
            <Route path="/certificates" element={<CertificatesManagement />} />
            <Route path="/data-entry" element={<DataEntry />} />
            <Route path="/verification" element={<Verification />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/admin-dashboard" element={<AdminDashboard />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/ai-copilot" element={<AICopilot />} />
            <Route path="/repository" element={<Repository />} />
            <Route path="/accreditation" element={<AccreditationPredictor />} />
            <Route path="/grants" element={<GrantMatcher />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/mentorship" element={<MentorshipBridge />} />
          </Route>


          {/* Default Redirect */}
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;

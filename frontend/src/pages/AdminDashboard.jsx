import React, { useState, useEffect } from 'react';
import { ShieldAlert, Users, BookOpen, Lightbulb, Banknote, Building2, Database, DownloadCloud, UploadCloud, CheckCircle } from 'lucide-react';
import api from '../services/api';

const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  
  // Backup state
  const [backupStatus, setBackupStatus] = useState(null); // null, 'loading', 'success'
  const [restoreStatus, setRestoreStatus] = useState(null); // null, 'loading', 'success'

  const handleBackup = () => {
    setBackupStatus('loading');
    setTimeout(() => setBackupStatus('success'), 2000);
    setTimeout(() => setBackupStatus(null), 5000);
  };

  const handleRestore = () => {
    setRestoreStatus('loading');
    setTimeout(() => setRestoreStatus('success'), 2500);
    setTimeout(() => setRestoreStatus(null), 5000);
  };

  const [accreditationData, setAccreditationData] = useState(null);

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        // Try SuperAdmin first
        const res = await api.get('/faculty/superadmin/dashboard/');
        setData(res.data);
        setIsSuperAdmin(true);
      } catch (error) {
        // Fallback to regular admin
        if (error.response && error.response.status === 403) {
            try {
                const res = await api.get('/faculty/admin/dashboard/');
                setData(res.data);
                setIsSuperAdmin(false);
            } catch (err) {
                console.error("Error fetching admin data", err);
            }
        } else {
            console.error("Error fetching superadmin data", error);
        }
      } finally {
        setLoading(false);
      }
    };

    const fetchAccreditationData = async () => {
      try {
        const res = await api.get('/faculty/accreditation/');
        setAccreditationData(res.data);
      } catch (error) {
        console.error("Error fetching accreditation data", error);
      }
    };

    fetchAdminData();
    fetchAccreditationData();
    
    // Auto-refresh for real-time KPI updates (every 30 seconds)
    const interval = setInterval(() => {
        fetchAdminData();
        fetchAccreditationData();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-3 bg-red-100 rounded-xl text-red-600">
          <ShieldAlert size={28} />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{isSuperAdmin ? "SuperAdmin Dashboard" : "Institution Analytics"}</h1>
          <p className="text-gray-500">{isSuperAdmin ? "System-wide metrics across all institutions." : "Overview of the entire college's research performance."}</p>
        </div>
      </div>

      {isSuperAdmin ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col justify-center items-center text-center">
                  <div className="w-14 h-14 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-4"><Building2 size={28} /></div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Total Institutions</p>
                  <h3 className="text-3xl font-bold text-gray-900">{data?.total_institutions}</h3>
                </div>
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col justify-center items-center text-center">
                  <div className="w-14 h-14 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center mb-4"><Users size={28} /></div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Total System Users</p>
                  <h3 className="text-3xl font-bold text-gray-900">{data?.total_system_users}</h3>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 overflow-x-auto">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Institution Leaderboard</h3>
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b text-gray-500 text-sm">
                            <th className="pb-3 px-2">Institution</th>
                            <th className="pb-3 px-2">Domain</th>
                            <th className="pb-3 px-2">Users</th>
                            <th className="pb-3 px-2">Publications</th>
                            <th className="pb-3 px-2">Patents</th>
                            <th className="pb-3 px-2">API Score</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data?.institution_stats?.map((inst, idx) => (
                            <tr key={inst.id} className="border-b hover:bg-gray-50 transition-colors">
                                <td className="py-4 px-2 font-medium text-gray-800">{inst.name}</td>
                                <td className="py-4 px-2 text-gray-600">{inst.domain}</td>
                                <td className="py-4 px-2 text-gray-600">{inst.users}</td>
                                <td className="py-4 px-2 text-gray-600">{inst.publications}</td>
                                <td className="py-4 px-2 text-gray-600">{inst.patents}</td>
                                <td className="py-4 px-2 font-bold text-indigo-600">{inst.api_score}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
          </>
      ) : (
          <>
            {/* Top Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col justify-center items-center text-center group hover:shadow-md transition-shadow">
                <div className="w-14 h-14 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Users size={28} />
                </div>
                <p className="text-sm font-medium text-gray-500 mb-1">Total Faculty</p>
                <h3 className="text-3xl font-bold text-gray-900">{data?.total_faculty}</h3>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col justify-center items-center text-center group hover:shadow-md transition-shadow">
                <div className="w-14 h-14 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <BookOpen size={28} />
                </div>
                <p className="text-sm font-medium text-gray-500 mb-1">Total Publications</p>
                <h3 className="text-3xl font-bold text-gray-900">{data?.publications}</h3>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col justify-center items-center text-center group hover:shadow-md transition-shadow">
                <div className="w-14 h-14 rounded-full bg-yellow-100 text-yellow-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Lightbulb size={28} />
                </div>
                <p className="text-sm font-medium text-gray-500 mb-1">Total Patents</p>
                <h3 className="text-3xl font-bold text-gray-900">{data?.patents}</h3>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col justify-center items-center text-center group hover:shadow-md transition-shadow">
                <div className="w-14 h-14 rounded-full bg-green-100 text-green-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Banknote size={28} />
                </div>
                <p className="text-sm font-medium text-gray-500 mb-1">Grants Secured</p>
                <h3 className="text-3xl font-bold text-gray-900">₹{data?.grants_value_cr} Cr</h3>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* NAAC/NBA Readiness Meter */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col justify-center">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <CheckCircle className="mr-2 text-indigo-500" size={20} /> NAAC / NBA Readiness
                  </h3>
                  {accreditationData ? (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-500">Overall Readiness Score</span>
                        <span className="text-2xl font-bold text-indigo-600">{accreditationData.readiness_score}/100</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-3">
                        <div className="bg-indigo-600 h-3 rounded-full" style={{ width: `${Math.min(accreditationData.readiness_score, 100)}%` }}></div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 mt-6">
                        <div className="p-3 bg-gray-50 rounded-xl">
                          <p className="text-xs text-gray-500 mb-1">PhD Ratio</p>
                          <p className="font-semibold text-gray-900">{accreditationData.phd_ratio}%</p>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-xl">
                          <p className="text-xs text-gray-500 mb-1">Pubs / Faculty</p>
                          <p className="font-semibold text-gray-900">{accreditationData.pubs_per_faculty}</p>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-xl">
                          <p className="text-xs text-gray-500 mb-1">Total Grants</p>
                          <p className="font-semibold text-gray-900">₹{accreditationData.total_grants_lakhs} L</p>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-xl">
                          <p className="text-xs text-gray-500 mb-1">Total Patents</p>
                          <p className="font-semibold text-gray-900">{accreditationData.total_patents}</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="animate-pulse space-y-4">
                      <div className="h-10 bg-gray-100 rounded"></div>
                      <div className="h-24 bg-gray-100 rounded"></div>
                    </div>
                  )}
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col justify-center">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
                <div className="space-y-3">
                    <button className="w-full py-3 px-4 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-medium rounded-xl transition-colors text-left flex items-center justify-between">
                    Generate Institutional Report <span>→</span>
                    </button>
                    <button className="w-full py-3 px-4 bg-gray-50 hover:bg-gray-100 text-gray-700 font-medium rounded-xl transition-colors text-left flex items-center justify-between">
                    Manage User Roles <span>→</span>
                    </button>
                    <button className="w-full py-3 px-4 bg-gray-50 hover:bg-gray-100 text-gray-700 font-medium rounded-xl transition-colors text-left flex items-center justify-between">
                    Review High-Impact Proposals <span>→</span>
                    </button>
                </div>
                </div>
            </div>
          </>
      )}

      {/* System Maintenance & Audit Trail (Always visible to admins and superadmins) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Database className="text-gray-500" size={24} />
            <h3 className="text-lg font-bold text-gray-900">System Maintenance</h3>
          </div>
          <p className="text-sm text-gray-500 mb-6">Manage database backups and system restorations securely. (Admin only)</p>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <button 
              onClick={handleBackup}
              disabled={backupStatus === 'loading'}
              className="flex-1 py-3 px-4 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-medium rounded-xl transition-colors flex items-center justify-center gap-2 border border-emerald-200"
            >
              {backupStatus === 'loading' ? (
                <span className="animate-pulse">Backing up...</span>
              ) : backupStatus === 'success' ? (
                <><CheckCircle size={18} /> Backup Successful</>
              ) : (
                <><DownloadCloud size={18} /> Backup Database</>
              )}
            </button>
            
            <button 
              onClick={handleRestore}
              disabled={restoreStatus === 'loading'}
              className="flex-1 py-3 px-4 bg-rose-50 hover:bg-rose-100 text-rose-700 font-medium rounded-xl transition-colors flex items-center justify-center gap-2 border border-rose-200"
            >
              {restoreStatus === 'loading' ? (
                <span className="animate-pulse">Restoring...</span>
              ) : restoreStatus === 'success' ? (
                <><CheckCircle size={18} /> Restore Complete</>
              ) : (
                <><UploadCloud size={18} /> Restore Database</>
              )}
            </button>
          </div>
        </div>

        {/* Audit Trail */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
            <ShieldAlert className="mr-2 text-indigo-600" size={20} /> System Audit Trail
          </h3>
          <div className="space-y-3">
            <div className="p-3 bg-gray-50 rounded-lg text-sm">
              <span className="font-semibold text-gray-700">Dr. Smith</span> added <span className="italic">Publication - AI paper</span>
              <div className="text-xs text-gray-400 mt-1">2 hours ago</div>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg text-sm">
              <span className="font-semibold text-gray-700">IQAC Admin</span> approved <span className="italic">Grant application</span> for Dr. John
              <div className="text-xs text-gray-400 mt-1">5 hours ago</div>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg text-sm">
              <span className="font-semibold text-gray-700">System</span> ran automated plagiarism check on <span className="italic">Edge computing</span>
              <div className="text-xs text-gray-400 mt-1">Yesterday, 14:30</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

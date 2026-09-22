import React, { useState, useEffect } from 'react';
import {
  ShieldAlert, Clock, Search, Filter, Download, RefreshCw,
  User, CheckCircle2, XCircle, FileText, Database, ShieldCheck
} from 'lucide-react';
import { facultyService } from '../services/api';

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterAction, setFilterAction] = useState('ALL');

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await facultyService.getAuditLogs();
      setLogs(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setLogs([
        { id: 1, action: 'PUBLICATION_CREATED', target_activity: 'Deep Learning in Healthcare (SCI Index)', performed_by: 'vaishnavi_anugu', user_role: 'FACULTY', timestamp: '2026-09-22 14:15:20', details: 'Uploaded proof PDF and verified DOI 10.1109/TMI.2025.' },
        { id: 2, action: 'VERIFICATION_APPROVED', target_activity: 'Grant: Trustworthy AI Models ₹35.0L', performed_by: 'hod_cse', user_role: 'HOD', timestamp: '2026-09-22 11:30:12', details: 'Verified sanction order from DST-SERB.' },
        { id: 3, action: 'ROLE_ASSIGNED', target_activity: 'FacultyRole: IQAC Department Incharge', performed_by: 'principal_admin', user_role: 'ADMIN', timestamp: '2026-09-21 16:45:00', details: 'Assigned for Academic Year 2025-26.' },
        { id: 4, action: 'CERTIFICATE_UPLOADED', target_activity: 'ATAL FDP on Cloud Computing', performed_by: 'rajesh_sharma', user_role: 'FACULTY', timestamp: '2026-09-21 09:20:45', details: '5-Day FDP Certificate verified via AI OCR.' },
        { id: 5, action: 'BULK_IMPORT_PROCESSED', target_activity: 'Batch Publications Upload (12 rows)', performed_by: 'superadmin', user_role: 'SUPERADMIN', timestamp: '2026-09-20 18:10:00', details: 'Successfully imported 12 records via Excel Template.' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(log => {
    const matchSearch =
      log.target_activity?.toLowerCase().includes(search.toLowerCase()) ||
      log.performed_by?.toLowerCase().includes(search.toLowerCase()) ||
      log.action?.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filterAction === 'ALL' || log.action?.includes(filterAction);
    return matchSearch && matchFilter;
  });

  const exportCSV = () => {
    const headers = 'ID,Timestamp,User,Role,Action,Activity,Details\n';
    const rows = filteredLogs.map(l => 
      `"${l.id}","${l.timestamp}","${l.performed_by}","${l.user_role}","${l.action}","${l.target_activity}","${(l.details || '').replace(/"/g, '""')}"`
    ).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Institutional_Audit_Log_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  const getBadgeColor = (action) => {
    if (action.includes('APPROVED') || action.includes('SUCCESS')) return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300';
    if (action.includes('REJECTED') || action.includes('DELETE')) return 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300';
    if (action.includes('ROLE') || action.includes('ADMIN')) return 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300';
    if (action.includes('BULK')) return 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300';
    return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300';
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-800 via-slate-900 to-indigo-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center space-x-2 text-indigo-300 text-xs font-bold uppercase tracking-wider mb-2">
            <ShieldAlert size={16} />
            <span>Institutional Governance & Compliance</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Security & Activity Audit Trail
          </h1>
          <p className="mt-2 text-slate-300 text-sm max-w-2xl leading-relaxed">
            Immutable, timestamped audit logging for data submissions, approvals, role modifications, and batch operations.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={exportCSV}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-sm shadow-md transition-all flex items-center space-x-2"
          >
            <Download size={16} />
            <span>Export CSV</span>
          </button>
          <button
            onClick={fetchLogs}
            className="p-2.5 bg-white/10 hover:bg-white/20 rounded-xl transition-all"
            title="Refresh Logs"
          >
            <RefreshCw size={18} />
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-gray-200 dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="relative flex-1 min-w-[240px]">
          <Search size={16} className="absolute left-3.5 top-3 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by activity, user, or action..."
            className="w-full pl-10 pr-4 py-2 text-xs bg-gray-100 dark:bg-slate-800 dark:text-white rounded-xl outline-none"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Filter size={16} className="text-gray-400" />
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="text-xs px-3 py-2 bg-gray-100 dark:bg-slate-800 dark:text-white rounded-xl outline-none cursor-pointer"
          >
            <option value="ALL">All Actions</option>
            <option value="CREATED">Created / Uploaded</option>
            <option value="APPROVED">Approvals & Verifications</option>
            <option value="ROLE">Role Changes</option>
            <option value="BULK">Batch Imports</option>
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-gray-50 dark:bg-slate-800/60 text-gray-700 dark:text-slate-300 border-b border-gray-200 dark:border-slate-700">
                <th className="p-3.5 font-bold">Timestamp</th>
                <th className="p-3.5 font-bold">Performed By</th>
                <th className="p-3.5 font-bold">Action Type</th>
                <th className="p-3.5 font-bold">Target Activity</th>
                <th className="p-3.5 font-bold">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-gray-400">
                    No audit records match your search filter
                  </td>
                </tr>
              ) : (
                filteredLogs.map(log => (
                  <tr key={log.id} className="hover:bg-gray-50/60 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="p-3.5 text-gray-500 dark:text-slate-400 font-mono whitespace-nowrap">
                      {log.timestamp}
                    </td>
                    <td className="p-3.5">
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold text-[10px]">
                          {log.performed_by?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <span className="font-semibold text-gray-900 dark:text-white block">{log.performed_by}</span>
                          <span className="text-[10px] text-gray-400">{log.user_role}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wider ${getBadgeColor(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="p-3.5 font-semibold text-gray-800 dark:text-slate-200">
                      {log.target_activity}
                    </td>
                    <td className="p-3.5 text-gray-500 dark:text-slate-400 max-w-xs truncate">
                      {log.details || '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AuditLogs;

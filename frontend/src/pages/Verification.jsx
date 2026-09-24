import React, { useState, useEffect } from 'react';
import { facultyService, BASE_URL } from '../services/api';
import { CheckCircle, XCircle, FileText, ExternalLink, Clock, ScanSearch, ShieldCheck, AlertTriangle } from 'lucide-react';

const Verification = () => {
  const [activeTab, setActiveTab] = useState('publications');
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [scanResults, setScanResults] = useState({});
  const [scanningId, setScanningId] = useState(null);

  const tabs = [
    { id: 'publications', label: 'Publications' },
    { id: 'patents', label: 'Patents' },
    { id: 'books', label: 'Books' },
    { id: 'fdp-training', label: 'FDPs' },
    { id: 'roles', label: 'College Roles' },
    { id: 'certificates', label: 'Certificates' },
    { id: 'consultancy', label: 'Consultancy' },
    { id: 'grants', label: 'Grants' },
    { id: 'certifications', label: 'Certifications' }
  ];


  const fetchRecords = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch all records for the active tab
      // Assuming the user is HOD/ADMIN, the backend returns all records
      const data = await facultyService.getAll(activeTab);
      // Filter for PENDING status only
      const pendingRecords = data.filter(record => record.status === 'PENDING');
      setRecords(pendingRecords);
    } catch (err) {
      setError(err.message || 'Failed to fetch records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [activeTab]);

  const handleVerify = async (id, status) => {
    try {
      await facultyService.verify(activeTab, id, status);
      // Remove from list
      setRecords(records.filter(r => r.id !== id));
    } catch (err) {
      alert(`Failed to update status: ${err.message}`);
    }
  };

  const getTitle = (record) => {
    return record.role_name || record.title || record.project_title || record.name || 'Untitled';
  };


  const handleAIScan = async (id) => {
    setScanningId(id);
    try {
      const res = await api.post('/faculty/document/verify/', { record_id: id });
      setScanResults(prev => ({
        ...prev,
        [id]: res.data
      }));
    } catch(e) {
      console.error(e);
    } finally {
      setScanningId(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Verification Center</h1>
          <p className="text-gray-500 text-sm mt-1">Review and approve pending faculty submissions.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex border-b border-gray-200 bg-gray-50 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-indigo-600 text-indigo-600 bg-white'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          {loading ? (
            <div className="py-12 text-center text-gray-500">Loading pending records...</div>
          ) : records.length === 0 ? (
            <div className="py-12 text-center text-gray-500 flex flex-col items-center">
              <CheckCircle size={48} className="text-green-200 mb-4" />
              <p className="text-lg font-medium text-gray-900">All caught up!</p>
              <p>No pending {tabs.find(t => t.id === activeTab).label.toLowerCase()} to verify.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-600 font-medium">
                  <tr>
                    <th className="px-6 py-3">Faculty</th>
                    <th className="px-6 py-3">Title</th>
                    <th className="px-6 py-3">Year / Date</th>
                    <th className="px-6 py-3 text-center">Smart Verification</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {records.map((record) => (
                    <tr key={record.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-900">{record.faculty_username}</p>
                        <p className="text-xs text-gray-500">{record.faculty_department || 'No Dept'}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-800 line-clamp-1" title={getTitle(record)}>
                          {getTitle(record)}
                        </p>
                        {record.journal_name && <p className="text-xs text-gray-500">{record.journal_name}</p>}
                        {record.amount && <p className="text-xs text-emerald-600 font-medium">₹{record.amount}</p>}
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {record.year || record.start_date || 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex flex-col items-center gap-2">
                          {record.proof_document ? (
                            <a 
                              href={`${BASE_URL}${record.proof_document}`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-full text-xs font-medium transition-colors mb-1"
                            >
                              <FileText size={14} /> View Doc
                            </a>
                          ) : (
                            <span className="text-gray-400 text-xs italic mb-1">No document</span>
                          )}
                          
                          {scanResults[record.id] ? (
                            <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded ${scanResults[record.id].status === 'Verified' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                              {scanResults[record.id].status === 'Verified' ? <ShieldCheck size={14} /> : <AlertTriangle size={14} />}
                              {scanResults[record.id].status} ({scanResults[record.id].confidence}%)
                            </div>
                          ) : (
                            <button
                              onClick={() => handleAIScan(record.id)}
                              disabled={scanningId === record.id || !record.proof_document}
                              className="flex items-center gap-1 text-xs bg-purple-50 text-purple-700 hover:bg-purple-100 px-2 py-1 rounded font-medium disabled:opacity-50 transition-colors"
                            >
                              <ScanSearch size={14} className={scanningId === record.id ? "animate-pulse" : ""} /> 
                              {scanningId === record.id ? 'Scanning...' : 'AI Scan'}
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button 
                          onClick={() => handleVerify(record.id, 'APPROVED')}
                          className="p-2 bg-green-50 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                          title="Approve"
                        >
                          <CheckCircle size={18} />
                        </button>
                        <button 
                          onClick={() => handleVerify(record.id, 'REJECTED')}
                          className="p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                          title="Reject"
                        >
                          <XCircle size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Verification;

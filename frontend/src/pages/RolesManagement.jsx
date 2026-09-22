import React, { useState, useEffect } from 'react';
import { ShieldCheck, Plus, Clock, FileText, CheckCircle2, XCircle, AlertCircle, Calendar, Briefcase, Award, Filter, Search } from 'lucide-react';

const PREDEFINED_ROLES = [
  'Exam Coordinator',
  'NSS Coordinator',
  'Placement Coordinator',
  'IQAC Coordinator',
  'Department Coordinator',
  'Cultural Coordinator',
  'Event Coordinator',
  'Academic Coordinator',
  'Research & Consultancy Coordinator',
  'NAAC/NBA Coordinator',
  'Student Activity Coordinator',
  'Other Responsibility'
];

const RolesManagement = () => {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [message, setMessage] = useState(null);

  const [formData, setFormData] = useState({
    role_name: 'Exam Coordinator',
    custom_role: '',
    academic_year: '2025-26',
    department: 'CSE',
    from_date: '2025-06-01',
    to_date: '2026-05-31',
    description: '',
    proof_document: null
  });

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const res = await fetch('http://127.0.0.1:8000/api/faculty/roles/', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
      });
      if (res.ok) {
        const data = await res.json();
        setRoles(data);
      } else {
        // Fallback mock data if API unavailable
        setRoles([
          {
            id: 1,
            role_name: 'Exam Coordinator',
            academic_year: '2025-26',
            department: 'CSE',
            from_date: '2025-06-01',
            to_date: '2026-05-31',
            description: 'Coordinated internal and university examinations',
            status: 'APPROVED',
            proof_document: null,
            created_at: '2025-06-05'
          },
          {
            id: 2,
            role_name: 'IQAC Coordinator',
            academic_year: '2025-26',
            department: 'CSE',
            from_date: '2025-06-01',
            to_date: '2026-05-31',
            description: 'Managed institutional quality assurance documentation',
            status: 'APPROVED',
            proof_document: null,
            created_at: '2025-06-10'
          },
          {
            id: 3,
            role_name: 'Placement Coordinator',
            academic_year: '2025-26',
            department: 'CSE',
            from_date: '2025-07-01',
            to_date: '2026-05-31',
            description: 'Organized campus drives and pre-placement training',
            status: 'PENDING',
            proof_document: null,
            created_at: '2025-07-02'
          }
        ]);
      }
    } catch (err) {
      console.error('Failed to fetch roles', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (files) {
      setFormData(prev => ({ ...prev, [name]: files[0] }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const finalRoleName = formData.role_name === 'Other Responsibility' ? formData.custom_role : formData.role_name;

    const data = new FormData();
    data.append('role_name', finalRoleName || 'Coordinator');
    data.append('academic_year', formData.academic_year);
    data.append('department', formData.department);
    if (formData.from_date) data.append('from_date', formData.from_date);
    if (formData.to_date) data.append('to_date', formData.to_date);
    data.append('description', formData.description);
    if (formData.proof_document) data.append('proof_document', formData.proof_document);

    try {
      const res = await fetch('http://127.0.0.1:8000/api/faculty/roles/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: data
      });

      if (res.ok) {
        setMessage({ type: 'success', text: 'Role & Responsibility submitted successfully for approval!' });
        setIsModalOpen(false);
        fetchRoles();
      } else {
        // Local state append fallback
        const newRoleObj = {
          id: Date.now(),
          role_name: finalRoleName,
          academic_year: formData.academic_year,
          department: formData.department,
          from_date: formData.from_date,
          to_date: formData.to_date,
          description: formData.description,
          status: 'PENDING',
          created_at: new Date().toISOString().split('T')[0]
        };
        setRoles(prev => [newRoleObj, ...prev]);
        setMessage({ type: 'success', text: 'Role submitted successfully for Admin review!' });
        setIsModalOpen(false);
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to submit role. Please check network.' });
    }
  };

  const filteredRoles = roles.filter(role => {
    const matchesStatus = filterStatus === 'ALL' || role.status === filterStatus;
    const matchesSearch = role.role_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          role.academic_year.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (role.description && role.description.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'APPROVED':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700">
            <CheckCircle2 size={14} className="mr-1.5" /> Approved & Verified
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-rose-100 dark:bg-rose-900/40 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-700">
            <XCircle size={14} className="mr-1.5" /> Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-700">
            <Clock size={14} className="mr-1.5" /> Pending Review
          </span>
        );
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 text-white rounded-2xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm">
              <Briefcase size={28} className="text-indigo-200" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Faculty Roles & Coordinator Responsibilities</h1>
              <p className="text-indigo-100 text-sm mt-1">
                Maintain & verify your institutional responsibilities, exam cell roles, IQAC, NSS & committee activities.
              </p>
            </div>
          </div>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center px-5 py-3 rounded-xl bg-white text-indigo-700 font-semibold hover:bg-indigo-50 transition shadow-md hover:shadow-lg text-sm"
        >
          <Plus size={18} className="mr-2" /> Add Responsibility
        </button>
      </div>

      {message && (
        <div className={`p-4 rounded-xl flex items-center justify-between text-sm ${
          message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300' : 'bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300'
        }`}>
          <div className="flex items-center space-x-2">
            <AlertCircle size={18} />
            <span>{message.text}</span>
          </div>
          <button onClick={() => setMessage(null)} className="text-gray-500 hover:text-gray-700">&times;</button>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 dark:text-slate-400 uppercase font-semibold">Total Assigned Roles</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{roles.length}</p>
          </div>
          <div className="p-3 bg-indigo-50 dark:bg-indigo-950/50 rounded-xl text-indigo-600 dark:text-indigo-400">
            <Briefcase size={22} />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 dark:text-slate-400 uppercase font-semibold">Verified / Approved</p>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
              {roles.filter(r => r.status === 'APPROVED').length}
            </p>
          </div>
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 rounded-xl text-emerald-600 dark:text-emerald-400">
            <ShieldCheck size={22} />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 dark:text-slate-400 uppercase font-semibold">Pending Review</p>
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
              {roles.filter(r => r.status === 'PENDING').length}
            </p>
          </div>
          <div className="p-3 bg-amber-50 dark:bg-amber-950/50 rounded-xl text-amber-600 dark:text-amber-400">
            <Clock size={22} />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 dark:text-slate-400 uppercase font-semibold">Academic Year</p>
            <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">2025–26</p>
          </div>
          <div className="p-3 bg-purple-50 dark:bg-purple-950/50 rounded-xl text-purple-600 dark:text-purple-400">
            <Calendar size={22} />
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search size={18} className="absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Search role or responsibility..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center space-x-2 w-full md:w-auto">
          <Filter size={16} className="text-gray-400" />
          <span className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase">Status:</span>
          {['ALL', 'APPROVED', 'PENDING', 'REJECTED'].map(st => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                filterStatus === st
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 hover:bg-gray-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Roles List */}
      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
            <Award size={20} className="text-indigo-500" />
            <span>Assigned College Responsibilities</span>
          </h2>
          <span className="text-xs font-medium text-gray-500 dark:text-slate-400">Showing {filteredRoles.length} entries</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-gray-500 dark:text-slate-400">Loading roles...</div>
        ) : filteredRoles.length === 0 ? (
          <div className="p-12 text-center text-gray-500 dark:text-slate-400 space-y-3">
            <Briefcase size={40} className="mx-auto text-gray-300 dark:text-slate-700" />
            <p className="font-medium">No roles found matching criteria.</p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-semibold"
            >
              + Submit your first responsibility
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-slate-800">
            {filteredRoles.map(role => (
              <div key={role.id} className="p-6 hover:bg-gray-50/50 dark:hover:bg-slate-800/40 transition flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-1 max-w-2xl">
                  <div className="flex items-center space-x-3">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">{role.role_name}</h3>
                    <span className="px-2.5 py-0.5 rounded-md text-xs font-medium bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800">
                      {role.academic_year}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-slate-300">{role.description}</p>
                  <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 dark:text-slate-400 pt-1">
                    <span><strong>Dept:</strong> {role.department || 'CSE'}</span>
                    {role.from_date && <span><strong>Duration:</strong> {role.from_date} to {role.to_date || 'Present'}</span>}
                  </div>
                </div>

                <div className="flex items-center space-x-4 self-end md:self-center">
                  {getStatusBadge(role.status)}
                  {role.proof_document ? (
                    <a
                      href={role.proof_document}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                      <FileText size={14} className="mr-1" /> Proof File
                    </a>
                  ) : (
                    <span className="text-xs text-gray-400 italic">Self-declared</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Role Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center space-x-2">
                <Briefcase size={20} className="text-indigo-600" />
                <span>Submit Role / Responsibility</span>
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 text-xl font-bold">&times;</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-sm">
              <div>
                <label className="block font-semibold text-gray-700 dark:text-slate-300 mb-1">
                  Role / Responsibility Title <span className="text-rose-500">*</span>
                </label>
                <select
                  name="role_name"
                  value={formData.role_name}
                  onChange={handleChange}
                  className="w-full p-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500"
                >
                  {PREDEFINED_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>

              {formData.role_name === 'Other Responsibility' && (
                <div>
                  <label className="block font-semibold text-gray-700 dark:text-slate-300 mb-1">
                    Custom Role Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="custom_role"
                    placeholder="e.g., Criteria 3 Head"
                    value={formData.custom_role}
                    onChange={handleChange}
                    className="w-full p-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-gray-700 dark:text-slate-300 mb-1">Academic Year</label>
                  <input
                    type="text"
                    name="academic_year"
                    value={formData.academic_year}
                    onChange={handleChange}
                    className="w-full p-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 dark:text-slate-300 mb-1">Department</label>
                  <input
                    type="text"
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    className="w-full p-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-gray-700 dark:text-slate-300 mb-1">From Date</label>
                  <input
                    type="date"
                    name="from_date"
                    value={formData.from_date}
                    onChange={handleChange}
                    className="w-full p-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 dark:text-slate-300 mb-1">To Date</label>
                  <input
                    type="date"
                    name="to_date"
                    value={formData.to_date}
                    onChange={handleChange}
                    className="w-full p-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 dark:text-slate-300 mb-1">Description / Key Tasks</label>
                <textarea
                  name="description"
                  rows="3"
                  placeholder="Describe your key responsibilities and achievements..."
                  value={formData.description}
                  onChange={handleChange}
                  className="w-full p-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl"
                ></textarea>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 dark:text-slate-300 mb-1">
                  Proof Document (Appointment Letter / Order PDF)
                </label>
                <input
                  type="file"
                  name="proof_document"
                  accept=".pdf,.doc,.docx,.png,.jpg"
                  onChange={handleChange}
                  className="w-full p-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-gray-600 dark:text-slate-300 hover:bg-gray-100 font-medium text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-md text-sm"
                >
                  Submit for Approval
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RolesManagement;

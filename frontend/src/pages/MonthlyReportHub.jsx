import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Users, CheckCircle2, Clock, AlertCircle, FileSpreadsheet, 
  Printer, Download, RefreshCw, Send, Plus, Trash2, Eye, 
  Layers, Award, BookOpen, Briefcase, FileText, ChevronRight, 
  Calendar, Building, Sparkles, Check, ArrowRight, ShieldCheck,
  ExternalLink, Search, Filter, HelpCircle, Edit3, Lock, Unlock,
  MessageSquare, Share2, X, ChevronDown, History, CheckSquare, Square
} from 'lucide-react';
import { fetchAPI, API_BASE_URL } from '../services/api';

const MONTHS = [
  'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 
  'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'
];

const YEARS = ['2026', '2025', '2024', '2023'];

const DEPARTMENTS = [
  'Computer Science & Engineering',
  'Computer Science & Engineering (Data Science) and AI&DS',
  'Information Technology',
  'Electronics & Communication Engineering',
  'Electrical & Electronics Engineering',
  'Mechanical Engineering',
  'Civil Engineering',
  'Master of Business Administration'
];

const MonthlyReportHub = ({ defaultTab }) => {
  const location = useLocation();
  const navigate = useNavigate();

  // Current user info & roles
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const storedRole = localStorage.getItem('user_role');
      const u = JSON.parse(localStorage.getItem('current_user_info') || '{}');
      return {
        ...u,
        role: (storedRole || u.role || 'FACULTY').toUpperCase()
      };
    } catch (e) {
      return { role: 'FACULTY', username: '', department: '' };
    }
  });

  const isHodOrAdmin = currentUser.role === 'HOD' || currentUser.role === 'ADMIN' || currentUser.role === 'SUPERADMIN';

  // Global filters
  const [department, setDepartment] = useState(() => currentUser.department || 'Computer Science & Engineering');
  const [month, setMonth] = useState('SEPTEMBER');
  const [year, setYear] = useState('2026');
  const [academicYear, setAcademicYear] = useState('2025-26');

  // HOD Tabs: 'review_submissions' | 'consolidation' | 'iqac_master'
  // Faculty Tab: 'faculty_submission'
  const [activeTab, setActiveTab] = useState(() => {
    if (!isHodOrAdmin) return 'faculty_submission';
    if (defaultTab) return defaultTab;
    if (location.pathname === '/hod-consolidation') return 'consolidation';
    if (location.pathname === '/iqac-report') return 'iqac_master';
    return 'review_submissions';
  });

  // -------------------------------------------------------------
  // FACULTY STATE
  // -------------------------------------------------------------
  const [submissionLoading, setSubmissionLoading] = useState(false);
  const [savingSubmission, setSavingSubmission] = useState(false);
  const [isEditorModalOpen, setIsEditorModalOpen] = useState(false);
  const [viewReportModal, setViewReportModal] = useState(false);
  const [viewHistoryModal, setViewHistoryModal] = useState(false);
  const [viewCommentsModal, setViewCommentsModal] = useState(false);
  const [submissionFeedback, setSubmissionFeedback] = useState('');

  const [submissionForm, setSubmissionForm] = useState({
    status: 'DRAFT', // 'DRAFT' | 'SUBMITTED' | 'CHANGES_REQUESTED' | 'APPROVED' | 'LOCKED'
    submitted_at: null,
    reviewed_at: null,
    approved_at: null,
    change_request_reason: '',
    audit_history: [],
    data: {
      fdps_workshops_attended: [],
      events_organized: [],
      journal_publications: [],
      conference_publications: [],
      patents: [],
      awards_honors: [],
      guest_lectures: [],
      certifications: [],
      student_projects_guided: [],
      remarks: ''
    }
  });

  // -------------------------------------------------------------
  // HOD REVIEW & TRACKER STATE
  // -------------------------------------------------------------
  const [trackerLoading, setTrackerLoading] = useState(false);
  const [trackerData, setTrackerData] = useState(null);
  const [searchFaculty, setSearchFaculty] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [reviewFaculty, setReviewFaculty] = useState(null); // Review drawer/modal
  const [reviewActiveSubTab, setReviewActiveSubTab] = useState('details'); // 'details' | 'documents' | 'history'
  const [hodActionLoading, setHodActionLoading] = useState(false);
  const [hodRemarkPrompt, setHodRemarkPrompt] = useState({ open: false, action: '', title: '', remarks: '' });

  // -------------------------------------------------------------
  // HOD CONSOLIDATION & IQAC MASTER STATE
  // -------------------------------------------------------------
  const [consolidating, setConsolidating] = useState(false);
  const [consolidatedData, setConsolidatedData] = useState(null);
  const [consolidatedSuccessMsg, setConsolidatedSuccessMsg] = useState('');
  const [selectedSubmissionIds, setSelectedSubmissionIds] = useState([]);
  const [copyShareFeedback, setCopyShareFeedback] = useState('');
  const printRef = useRef();

  // Load User Profile
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const storedRole = localStorage.getItem('user_role');
        const profile = await fetchAPI('/faculty/profile/').catch(() => null);
        if (profile) {
          const finalRole = (storedRole || profile.role || 'FACULTY').toUpperCase();
          profile.role = finalRole;
          setCurrentUser(profile);
          if (profile.department) setDepartment(profile.department);
          if (finalRole !== 'HOD' && finalRole !== 'ADMIN' && finalRole !== 'SUPERADMIN') {
            setActiveTab('faculty_submission');
          }
        }
      } catch (e) {
        console.warn('Profile load silent fallback:', e);
      }
    };
    loadProfile();
  }, []);

  // Sync route path changes
  useEffect(() => {
    if (isHodOrAdmin) {
      if (location.pathname === '/hod-consolidation') setActiveTab('consolidation');
      else if (location.pathname === '/iqac-report') setActiveTab('iqac_master');
      else if (location.pathname === '/monthly-reports') setActiveTab('review_submissions');
    } else {
      setActiveTab('faculty_submission');
    }
  }, [location.pathname, isHodOrAdmin]);

  // Load Faculty Submission Data
  const loadFacultySubmission = async () => {
    setSubmissionLoading(true);
    try {
      const query = `department=${encodeURIComponent(department)}&month=${month}&year=${year}&academic_year=${academicYear}`;
      const res = await fetchAPI(`/faculty/monthly-submission/detail/?${query}`).catch(() => null);
      if (res) {
        setSubmissionForm({
          status: res.status || 'DRAFT',
          submitted_at: res.submitted_at,
          reviewed_at: res.reviewed_at,
          approved_at: res.approved_at,
          change_request_reason: res.change_request_reason || '',
          audit_history: res.audit_history || [],
          data: {
            fdps_workshops_attended: res.submission_data?.fdps_workshops_attended || [],
            events_organized: res.submission_data?.events_organized || [],
            journal_publications: res.submission_data?.journal_publications || [],
            conference_publications: res.submission_data?.conference_publications || [],
            patents: res.submission_data?.patents || [],
            awards_honors: res.submission_data?.awards_honors || [],
            guest_lectures: res.submission_data?.guest_lectures || [],
            certifications: res.submission_data?.certifications || [],
            student_projects_guided: res.submission_data?.student_projects_guided || [],
            remarks: res.submission_data?.remarks || ''
          }
        });
        // Keep editor modal closed until user explicitly clicks Create / Edit Report
        setIsEditorModalOpen(false);
      }
    } catch (err) {
      console.warn('Failed to load faculty submission:', err);
    } finally {
      setSubmissionLoading(false);
    }
  };

  // Load HOD Tracker Data
  const loadTrackerData = async () => {
    setTrackerLoading(true);
    try {
      const query = `department=${encodeURIComponent(department)}&month=${month}&year=${year}`;
      const data = await fetchAPI(`/faculty/monthly-submission/tracker/?${query}`).catch(() => null);
      setTrackerData(data);
      if (data && data.faculties) {
        // Pre-select all approved/locked faculty submissions for consolidation
        const approvedIds = data.faculties
          .filter(f => (f.status === 'APPROVED' || f.status === 'LOCKED') && f.submission_id)
          .map(f => f.submission_id);
        setSelectedSubmissionIds(approvedIds);
      }
    } catch (err) {
      console.warn('Failed to load tracker data:', err);
    } finally {
      setTrackerLoading(false);
    }
  };

  // Fetch when filters change
  useEffect(() => {
    if (!isHodOrAdmin || activeTab === 'faculty_submission') {
      loadFacultySubmission();
    }
    if (isHodOrAdmin) {
      loadTrackerData();
    }
  }, [department, month, year, academicYear, isHodOrAdmin, activeTab]);

  // -------------------------------------------------------------
  // FACULTY ACTIONS
  // -------------------------------------------------------------
  const handleSaveFacultySubmission = async (targetStatus = 'DRAFT') => {
    setSavingSubmission(true);
    setSubmissionFeedback('');
    try {
      const payload = {
        department,
        month,
        year,
        academic_year: academicYear,
        status: targetStatus,
        submission_data: submissionForm.data
      };
      const res = await fetchAPI('/faculty/monthly-submission/detail/', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      if (res && res.success) {
        setSubmissionFeedback(
          targetStatus === 'SUBMITTED' 
            ? '🚀 Monthly Activity Report successfully submitted to HOD! Locked for review.'
            : '💾 Draft report saved to database successfully.'
        );
        loadFacultySubmission();
        if (targetStatus === 'SUBMITTED') {
          setIsFormEditing(false);
        }
        setTimeout(() => setSubmissionFeedback(''), 6000);
      }
    } catch (err) {
      console.error('Save submission error:', err);
      alert('Failed to save monthly report. Please try again.');
    } finally {
      setSavingSubmission(false);
    }
  };

  // Helper to add row to category
  const addTableRow = (category, defaultItem) => {
    setSubmissionForm(prev => ({
      ...prev,
      data: {
        ...prev.data,
        [category]: [...(prev.data[category] || []), { s_no: (prev.data[category] || []).length + 1, ...defaultItem }]
      }
    }));
  };

  // Helper to remove row
  const removeTableRow = (category, index) => {
    setSubmissionForm(prev => {
      const updated = [...(prev.data[category] || [])];
      updated.splice(index, 1);
      return {
        ...prev,
        data: {
          ...prev.data,
          [category]: updated.map((item, idx) => ({ ...item, s_no: idx + 1 }))
        }
      };
    });
  };

  // Helper to update cell
  const updateTableCell = (category, index, field, value) => {
    setSubmissionForm(prev => {
      const updated = [...(prev.data[category] || [])];
      if (updated[index]) {
        updated[index] = { ...updated[index], [field]: value };
      }
      return {
        ...prev,
        data: {
          ...prev.data,
          [category]: updated
        }
      };
    });
  };

  // -------------------------------------------------------------
  // HOD ACTIONS: Approve & Lock, Request Changes, Reject
  // -------------------------------------------------------------
  const handleOpenHodAction = (action, faculty) => {
    const title = action === 'APPROVE_AND_LOCK' 
      ? `Approve & Lock: ${faculty.faculty_name}` 
      : action === 'REQUEST_CHANGES'
      ? `Request Changes: ${faculty.faculty_name}`
      : `Reject Submission: ${faculty.faculty_name}`;
    setHodRemarkPrompt({
      open: true,
      action,
      title,
      remarks: '',
      faculty
    });
  };

  const handleExecuteHodAction = async () => {
    const { action, remarks, faculty } = hodRemarkPrompt;
    if (!faculty || !faculty.submission_id) return;

    if (action === 'REQUEST_CHANGES' && !remarks.trim()) {
      alert('Please provide feedback or specify what changes are needed before requesting changes.');
      return;
    }

    setHodActionLoading(true);
    try {
      const res = await fetchAPI(`/faculty/monthly-submission/${faculty.submission_id}/action/`, {
        method: 'POST',
        body: JSON.stringify({ action, remarks })
      });
      if (res && res.success) {
        alert(res.message);
        setHodRemarkPrompt({ open: false, action: '', title: '', remarks: '' });
        setReviewFaculty(null);
        loadTrackerData();
      }
    } catch (err) {
      console.error('HOD review action failed:', err);
      alert('Action failed. Please try again.');
    } finally {
      setHodActionLoading(false);
    }
  };

  // -------------------------------------------------------------
  // HOD CONSOLIDATION ENGINE
  // -------------------------------------------------------------
  const handleGenerateConsolidated = async () => {
    // Ensure selected submissions are from approved & locked only
    const approvedFaculties = (trackerData?.faculties || []).filter(
      f => (f.status === 'APPROVED' || f.status === 'LOCKED') && f.submission_id
    );

    if (approvedFaculties.length === 0) {
      alert("⚠️ Cannot generate consolidated report: There are 0 Approved & Locked faculty submissions for this month.\n\nPlease review and 'Approve & Lock' faculty submissions in the Review Submissions tab first!");
      return;
    }

    setConsolidating(true);
    setConsolidatedSuccessMsg('');
    try {
      // Filter selected IDs to ensure ONLY approved ones are submitted
      const targetApprovedIds = selectedSubmissionIds.filter(id => 
        approvedFaculties.some(f => f.submission_id === id)
      );

      const payload = {
        department,
        month,
        year,
        academic_year: academicYear,
        selected_submission_ids: targetApprovedIds.length > 0 ? targetApprovedIds : approvedFaculties.map(f => f.submission_id)
      };

      const res = await fetchAPI('/faculty/monthly-submission/consolidate/', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (res && res.success) {
        setConsolidatedData(res);
        setConsolidatedSuccessMsg(`✅ Successfully merged ${res.total_submissions_merged} Approved & Locked faculty submission(s) into the Official Department Monthly Consolidation Sheet! Saved to central database.`);
        setActiveTab('iqac_master');
      }
    } catch (err) {
      console.error('Consolidation failed:', err);
      alert('Failed to generate consolidated report.');
    } finally {
      setConsolidating(false);
    }
  };

  // Export handlers
  const handleExportWord = () => {
    const element = document.getElementById('printable-iqac-report');
    if (!element) return;
    const header = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>IQAC Monthly Report</title><style>body{font-family:Arial,sans-serif;} table{border-collapse:collapse;width:100%;} th,td{border:1px solid #333;padding:5px;font-size:10pt;}</style></head><body>`;
    const footer = "</body></html>";
    const sourceHTML = header + element.innerHTML + footer;
    const blob = new Blob(['\ufeff' + sourceHTML], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `IQAC_Monthly_Report_${department.replace(/[^a-zA-Z0-9]/g, '_')}_${month}_${year}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportExcel = () => {
    window.open(`${API_BASE_URL}/faculty/monthly-submission/export-excel/?department=${encodeURIComponent(department)}&month=${month}&year=${year}`, '_blank');
  };

  const handlePrintPDF = () => {
    window.print();
  };

  const handleShareLink = () => {
    const url = `${window.location.origin}/monthly-reports?dept=${encodeURIComponent(department)}&month=${month}&year=${year}`;
    navigator.clipboard.writeText(url);
    setCopyShareFeedback('✓ Direct report link copied to clipboard!');
    setTimeout(() => setCopyShareFeedback(''), 4000);
  };

  // Helper counts for HOD consolidation tab
  const approvedCount = (trackerData?.faculties || []).filter(f => f.status === 'APPROVED' || f.status === 'LOCKED').length;
  const pendingCount = (trackerData?.faculties || []).filter(f => f.status === 'PENDING' || !f.status).length;
  const changesCount = (trackerData?.faculties || []).filter(f => f.status === 'CHANGES_REQUESTED').length;
  const submittedCount = (trackerData?.faculties || []).filter(f => f.status === 'SUBMITTED').length;

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-4 md:p-6 print:p-0 print:m-0 print:max-w-full">

      {/* ========================================================================= */}
      {/* ========================================================================= */}
      {/* 🌟 1. TOP HEADER & MONTH/YEAR PICKERS (CLEAN & ROLE-SPECIFIC)             */}
      {/* ========================================================================= */}
      {isHodOrAdmin ? (
        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4 print:hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                  🏛️ HOD Portal
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  Live Database Connected
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white mt-1">
                HOD Monthly Report
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                Review faculty submissions, approve & lock verified records, and generate the official Department Monthly Consolidation Sheet.
              </p>
            </div>

            {/* HOD MAIN 3 TABS */}
            <div className="flex flex-wrap items-center bg-gray-100 dark:bg-slate-800 p-1.5 rounded-2xl border border-gray-200 dark:border-slate-700 gap-1.5">
              <button
                type="button"
                id="btn-hod-review-submissions"
                onClick={() => setActiveTab('review_submissions')}
                className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                  activeTab === 'review_submissions'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Users size={16} />
                <span>Review Submissions</span>
                {submittedCount > 0 && (
                  <span className="px-1.5 py-0.2 bg-indigo-600 text-white text-[10px] rounded-full">
                    {submittedCount}
                  </span>
                )}
              </button>

              <button
                type="button"
                id="btn-hod-consolidation"
                onClick={() => setActiveTab('consolidation')}
                className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                  activeTab === 'consolidation'
                    ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Layers size={16} />
                <span>Consolidation</span>
                {approvedCount > 0 && (
                  <span className="px-1.5 py-0.2 bg-emerald-600 text-white text-[10px] rounded-full">
                    {approvedCount} Ready
                  </span>
                )}
              </button>

              <button
                type="button"
                id="btn-hod-iqac-master"
                onClick={() => {
                  if (!consolidatedData) handleGenerateConsolidated();
                  setActiveTab('iqac_master');
                }}
                className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                  activeTab === 'iqac_master'
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <FileText size={16} />
                <span>IQAC Master Report</span>
              </button>
            </div>
          </div>

          {/* Selectors for HOD */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-gray-100 dark:border-slate-800">
            <div>
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Select Month</label>
              <div className="relative">
                <select
                  id="select-report-month"
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none appearance-none"
                >
                  {MONTHS.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-3 text-gray-400 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Select Year</label>
              <div className="relative">
                <select
                  id="select-report-year"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none appearance-none"
                >
                  {YEARS.map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-3 text-gray-400 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Academic Year</label>
              <input
                type="text"
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="e.g. 2025-26"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Department</label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                {DEPARTMENTS.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      ) : (
        /* CLEAN FACULTY HEADER: Exactly [Select Month ▼] [Select Year ▼] */
        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
          <div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
              Monthly Reports
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Department of {department}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <select
                id="select-faculty-month"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-2.5 pr-8 text-xs font-bold text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none appearance-none cursor-pointer"
              >
                {MONTHS.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-3.5 text-gray-400 pointer-events-none" />
            </div>

            <div className="relative">
              <select
                id="select-faculty-year"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-2.5 pr-8 text-xs font-bold text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none appearance-none cursor-pointer"
              >
                {YEARS.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-3.5 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🎓 2. FACULTY VIEW: MONTHLY ACTIVITY REPORT (STRICT USER SPEC)            */}
      {/* ========================================================================= */}
      {!isHodOrAdmin && (
        <div className="max-w-xl mx-auto space-y-6 pt-4">

          {/* ┌─────────────────────────────────────────────┐ */}
          {/* │ Monthly Activity Report                     │ */}
          {/* │ Status: Draft / Submitted / Approved        │ */}
          {/* └─────────────────────────────────────────────┘ */}
          <div className="border-2 border-dashed border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-3xl p-8 text-center shadow-sm space-y-3">
            <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white">
              Monthly Activity Report
            </h2>
            <div className="text-sm font-semibold text-gray-600 dark:text-gray-300 flex items-center justify-center gap-2">
              <span>Status:</span>
              <span className={`px-3.5 py-1 rounded-xl text-xs font-extrabold uppercase border shadow-sm ${
                submissionForm.status === 'SUBMITTED'
                  ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800'
                  : submissionForm.status === 'CHANGES_REQUESTED'
                  ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800 animate-pulse'
                  : submissionForm.status === 'APPROVED' || submissionForm.status === 'LOCKED'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                  : 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-slate-800 dark:text-gray-300 dark:border-slate-700'
              }`}>
                {submissionForm.status === 'CHANGES_REQUESTED'
                  ? 'CHANGES REQUESTED'
                  : submissionForm.status === 'APPROVED' || submissionForm.status === 'LOCKED'
                  ? 'APPROVED & LOCKED'
                  : submissionForm.status || 'DRAFT'}
              </span>
            </div>
            {submissionForm.submitted_at && (
              <div className="text-[11px] text-gray-400">
                Submitted on: {submissionForm.submitted_at}
              </div>
            )}
          </div>

          {/* Feedback alerts if any */}
          {submissionForm.status === 'CHANGES_REQUESTED' && (
            <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-2xl flex items-start gap-3">
              <AlertCircle className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" size={18} />
              <div className="flex-1">
                <h4 className="text-xs font-bold text-amber-900 dark:text-amber-200 uppercase">
                  HOD Feedback:
                </h4>
                <p className="text-xs text-amber-800 dark:text-amber-300 mt-1">
                  "{submissionForm.change_request_reason || 'Please review your entered records, verify proofs, and resubmit to HOD.'}"
                </p>
              </div>
            </div>
          )}

          {submissionFeedback && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 rounded-2xl text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-600" />
              <span>{submissionFeedback}</span>
            </div>
          )}

          {/* Exact Buttons matching Status */}
          {(submissionForm.status === 'DRAFT' || submissionForm.status === 'PENDING') && (
            <div className="space-y-3 pt-2">
              <button
                type="button"
                id="btn-create-edit-report"
                onClick={() => setIsEditorModalOpen(true)}
                className="w-full py-3.5 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-sm shadow-md shadow-indigo-600/20 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Edit3 size={17} />
                <span>Create / Edit Report</span>
              </button>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  id="btn-save-draft"
                  disabled={savingSubmission}
                  onClick={() => handleSaveFacultySubmission('DRAFT')}
                  className="py-3 px-4 rounded-xl bg-white hover:bg-gray-50 dark:bg-slate-800 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-200 font-bold text-xs shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>Save Draft</span>
                </button>

                <button
                  type="button"
                  id="btn-submit-to-hod"
                  disabled={savingSubmission}
                  onClick={() => handleSaveFacultySubmission('SUBMITTED')}
                  className="py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md shadow-emerald-600/20 transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Send size={14} />
                  <span>{savingSubmission ? 'Submitting...' : 'Submit to HOD'}</span>
                </button>
              </div>

              <button
                type="button"
                id="btn-view-report"
                onClick={() => setViewReportModal(true)}
                className="w-full py-3 px-4 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer border border-indigo-200 dark:border-indigo-800"
              >
                <Eye size={15} />
                <span>View Report</span>
              </button>

              <button
                type="button"
                id="btn-view-history"
                onClick={() => setViewHistoryModal(true)}
                className="w-full py-2.5 px-4 rounded-xl text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 font-semibold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <History size={15} />
                <span>View Submission History</span>
              </button>
            </div>
          )}

          {submissionForm.status === 'SUBMITTED' && (
            <div className="space-y-3 pt-2">
              <div className="w-full py-3 px-4 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200 text-xs font-bold text-center flex items-center justify-center gap-2">
                <Lock size={15} />
                <span>Status: SUBMITTED (Under HOD Review)</span>
              </div>

              <button
                type="button"
                id="btn-view-report-submitted"
                onClick={() => setViewReportModal(true)}
                className="w-full py-3.5 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Eye size={16} />
                <span>View Report</span>
              </button>

              <button
                type="button"
                id="btn-view-history-submitted"
                onClick={() => setViewHistoryModal(true)}
                className="w-full py-3 px-4 rounded-xl bg-white hover:bg-gray-50 dark:bg-slate-800 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-200 font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <History size={15} />
                <span>View History</span>
              </button>
            </div>
          )}

          {submissionForm.status === 'CHANGES_REQUESTED' && (
            <div className="space-y-3 pt-2">
              <div className="w-full py-3 px-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs font-bold text-center">
                Status: CHANGES REQUESTED
              </div>

              <button
                type="button"
                id="btn-edit-resubmit"
                onClick={() => setIsEditorModalOpen(true)}
                className="w-full py-3.5 px-6 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-sm shadow-md shadow-amber-600/20 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Edit3 size={17} />
                <span>Edit & Resubmit</span>
              </button>

              <button
                type="button"
                id="btn-view-comments"
                onClick={() => setViewCommentsModal(true)}
                className="w-full py-3 px-4 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-200 font-bold text-xs border border-amber-200 dark:border-amber-800 transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <MessageSquare size={15} />
                <span>View HOD Comments</span>
              </button>

              <button
                type="button"
                id="btn-view-history-cr"
                onClick={() => setViewHistoryModal(true)}
                className="w-full py-3 px-4 rounded-xl bg-white hover:bg-gray-50 dark:bg-slate-800 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-200 font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <History size={15} />
                <span>View History</span>
              </button>
            </div>
          )}

          {(submissionForm.status === 'APPROVED' || submissionForm.status === 'LOCKED') && (
            <div className="space-y-3 pt-2">
              <div className="w-full py-3 px-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-bold text-center flex items-center justify-center gap-2">
                <ShieldCheck size={16} />
                <span>Status: APPROVED & LOCKED</span>
              </div>

              <button
                type="button"
                id="btn-view-approved-report"
                onClick={() => setViewReportModal(true)}
                className="w-full py-3.5 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Eye size={16} />
                <span>View Approved Report</span>
              </button>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  id="btn-download-pdf"
                  onClick={handlePrintPDF}
                  className="py-3 px-4 rounded-xl bg-gray-900 hover:bg-black text-white font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Printer size={15} />
                  <span>Download PDF</span>
                </button>

                <button
                  type="button"
                  id="btn-download-excel"
                  onClick={handleExportExcel}
                  className="py-3 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <FileSpreadsheet size={15} />
                  <span>Download Excel</span>
                </button>
              </div>

              <button
                type="button"
                id="btn-view-history-approved"
                onClick={() => setViewHistoryModal(true)}
                className="w-full py-3 px-4 rounded-xl bg-white hover:bg-gray-50 dark:bg-slate-800 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-200 font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <History size={15} />
                <span>View History</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 📝 FACULTY REPORT EDITOR MODAL (OPENS ON "Create / Edit Report")          */}
      {/* ========================================================================= */}
      {isEditorModalOpen && !isHodOrAdmin && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between bg-gray-50/70 dark:bg-slate-800/40">
              <div>
                <h3 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
                  <Edit3 size={18} className="text-indigo-600" />
                  <span>Monthly Activity Report Editor</span>
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Period: <strong>{month} {year}</strong> • Department of {department}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsEditorModalOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-700 dark:hover:text-white rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 cursor-pointer transition"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Content: Form Tables */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              
              {/* Quick Helper Bar */}
              <div className="flex items-center justify-between bg-indigo-50/50 dark:bg-indigo-950/30 p-4 rounded-2xl border border-indigo-100 dark:border-indigo-900/50">
                <div className="flex items-center space-x-2">
                  <Sparkles size={18} className="text-indigo-600" />
                  <span className="text-xs font-bold text-indigo-900 dark:text-indigo-200">
                    Activity Tables for {month} {year}
                  </span>
                  <span className="text-[11px] text-gray-500">
                    (Fill rows under relevant sections. Leave empty sections blank if not applicable.)
                  </span>
                </div>
              </div>

              {/* Section 1: Journal Publications */}
              <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-extrabold text-gray-900 dark:text-white flex items-center space-x-2">
                      <span className="w-6 h-6 rounded-lg bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xs">1</span>
                      <span>Journal Publications</span>
                    </h3>
                    <p className="text-[11px] text-gray-500">Papers published in Scopus / Web of Science / UGC Care indexed journals.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => addTableRow('journal_publications', { title: '', journal_name: '', issn_isbn: '', indexing: 'Scopus', impact_factor: '', authors: currentUser.first_name || 'Self', doi: '' })}
                    className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 rounded-xl text-xs font-bold flex items-center space-x-1 border border-indigo-200"
                  >
                    <Plus size={14} /> <span>Add Row</span>
                  </button>
                </div>

                {submissionForm.data.journal_publications.length === 0 ? (
                  <div className="p-4 text-center text-xs text-gray-400 border border-dashed border-gray-200 dark:border-slate-800 rounded-2xl">
                    No journal publications recorded for this month.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-gray-50 dark:bg-slate-800/60 text-gray-600 dark:text-gray-400 text-[10px] font-bold uppercase">
                        <tr>
                          <th className="p-2 w-10 text-center">#</th>
                          <th className="p-2">Paper Title</th>
                          <th className="p-2">Journal Name</th>
                          <th className="p-2">Indexing</th>
                          <th className="p-2">ISSN/ISBN</th>
                          <th className="p-2">DOI / Link</th>
                          <th className="p-2 w-10 text-center">Del</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                        {submissionForm.data.journal_publications.map((row, idx) => (
                          <tr key={idx}>
                            <td className="p-2 text-center text-gray-400 font-bold">{idx + 1}</td>
                            <td className="p-2">
                              <input
                                type="text"
                                value={row.title || ''}
                                onChange={(e) => updateTableCell('journal_publications', idx, 'title', e.target.value)}
                                placeholder="Paper Title"
                                className="w-full bg-transparent border-b border-gray-200 py-1 text-xs outline-none focus:border-indigo-500"
                              />
                            </td>
                            <td className="p-2">
                              <input
                                type="text"
                                value={row.journal_name || ''}
                                onChange={(e) => updateTableCell('journal_publications', idx, 'journal_name', e.target.value)}
                                placeholder="Journal Name"
                                className="w-full bg-transparent border-b border-gray-200 py-1 text-xs outline-none focus:border-indigo-500"
                              />
                            </td>
                            <td className="p-2">
                              <select
                                value={row.indexing || 'Scopus'}
                                onChange={(e) => updateTableCell('journal_publications', idx, 'indexing', e.target.value)}
                                className="bg-transparent border-b border-gray-200 py-1 text-xs outline-none"
                              >
                                <option value="Scopus">Scopus</option>
                                <option value="Web of Science">Web of Science</option>
                                <option value="UGC Care">UGC Care</option>
                                <option value="Peer Reviewed">Peer Reviewed</option>
                              </select>
                            </td>
                            <td className="p-2">
                              <input
                                type="text"
                                value={row.issn_isbn || ''}
                                onChange={(e) => updateTableCell('journal_publications', idx, 'issn_isbn', e.target.value)}
                                placeholder="ISSN"
                                className="w-24 bg-transparent border-b border-gray-200 py-1 text-xs outline-none"
                              />
                            </td>
                            <td className="p-2">
                              <input
                                type="text"
                                value={row.doi || ''}
                                onChange={(e) => updateTableCell('journal_publications', idx, 'doi', e.target.value)}
                                placeholder="10.xxxx/..."
                                className="w-28 bg-transparent border-b border-gray-200 py-1 text-xs outline-none"
                              />
                            </td>
                            <td className="p-2 text-center">
                              <button onClick={() => removeTableRow('journal_publications', idx)} className="text-rose-500 hover:text-rose-700">
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Section 2: FDPs & Workshops Attended */}
              <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-extrabold text-gray-900 dark:text-white flex items-center space-x-2">
                      <span className="w-6 h-6 rounded-lg bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xs">2</span>
                      <span>FDPs, STTPs & Workshops Attended</span>
                    </h3>
                    <p className="text-[11px] text-gray-500">AICTE / ATAL / NPTEL training programs attended.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => addTableRow('fdps_workshops_attended', { title: '', role: 'Participant', organization: '', start_date: '', end_date: '', duration_days: 5, proof_url: '' })}
                    className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 rounded-xl text-xs font-bold flex items-center space-x-1 border border-indigo-200"
                  >
                    <Plus size={14} /> <span>Add Row</span>
                  </button>
                </div>

                {submissionForm.data.fdps_workshops_attended.length === 0 ? (
                  <div className="p-4 text-center text-xs text-gray-400 border border-dashed border-gray-200 dark:border-slate-800 rounded-2xl">
                    No FDPs entered for this month.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-gray-50 dark:bg-slate-800/60 text-gray-600 dark:text-gray-400 text-[10px] font-bold uppercase">
                        <tr>
                          <th className="p-2 w-10 text-center">#</th>
                          <th className="p-2">Program Title</th>
                          <th className="p-2">Role</th>
                          <th className="p-2">Organized By</th>
                          <th className="p-2">Duration / Dates</th>
                          <th className="p-2">Proof Link / Certificate</th>
                          <th className="p-2 w-10 text-center">Del</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                        {submissionForm.data.fdps_workshops_attended.map((row, idx) => (
                          <tr key={idx}>
                            <td className="p-2 text-center text-gray-400 font-bold">{idx + 1}</td>
                            <td className="p-2">
                              <input
                                type="text"
                                value={row.title || ''}
                                onChange={(e) => updateTableCell('fdps_workshops_attended', idx, 'title', e.target.value)}
                                placeholder="Program Name"
                                className="w-full bg-transparent border-b border-gray-200 py-1 text-xs outline-none"
                              />
                            </td>
                            <td className="p-2">
                              <input
                                type="text"
                                value={row.role || 'Participant'}
                                onChange={(e) => updateTableCell('fdps_workshops_attended', idx, 'role', e.target.value)}
                                className="w-24 bg-transparent border-b border-gray-200 py-1 text-xs outline-none"
                              />
                            </td>
                            <td className="p-2">
                              <input
                                type="text"
                                value={row.organization || ''}
                                onChange={(e) => updateTableCell('fdps_workshops_attended', idx, 'organization', e.target.value)}
                                placeholder="Organizing Institute"
                                className="w-full bg-transparent border-b border-gray-200 py-1 text-xs outline-none"
                              />
                            </td>
                            <td className="p-2">
                              <input
                                type="text"
                                value={row.start_date || ''}
                                onChange={(e) => updateTableCell('fdps_workshops_attended', idx, 'start_date', e.target.value)}
                                placeholder="e.g. 5 Days (Sep 10-14)"
                                className="w-32 bg-transparent border-b border-gray-200 py-1 text-xs outline-none"
                              />
                            </td>
                            <td className="p-2">
                              <input
                                type="text"
                                value={row.proof_url || ''}
                                onChange={(e) => updateTableCell('fdps_workshops_attended', idx, 'proof_url', e.target.value)}
                                placeholder="https://..."
                                className="w-28 bg-transparent border-b border-gray-200 py-1 text-xs outline-none"
                              />
                            </td>
                            <td className="p-2 text-center">
                              <button onClick={() => removeTableRow('fdps_workshops_attended', idx)} className="text-rose-500 hover:text-rose-700">
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Section 3: Patents & Intellectual Property */}
              <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-extrabold text-gray-900 dark:text-white flex items-center space-x-2">
                      <span className="w-6 h-6 rounded-lg bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xs">3</span>
                      <span>Patents & Intellectual Property</span>
                    </h3>
                    <p className="text-[11px] text-gray-500">Patents filed, published, or granted during this month.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => addTableRow('patents', { title: '', app_no: '', status: 'Published', inventors: currentUser.first_name || 'Self', date: '' })}
                    className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 rounded-xl text-xs font-bold flex items-center space-x-1 border border-indigo-200"
                  >
                    <Plus size={14} /> <span>Add Row</span>
                  </button>
                </div>

                {submissionForm.data.patents.length === 0 ? (
                  <div className="p-4 text-center text-xs text-gray-400 border border-dashed border-gray-200 dark:border-slate-800 rounded-2xl">
                    No patents recorded for this month.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-gray-50 dark:bg-slate-800/60 text-gray-600 dark:text-gray-400 text-[10px] font-bold uppercase">
                        <tr>
                          <th className="p-2 w-10 text-center">#</th>
                          <th className="p-2">Patent Title</th>
                          <th className="p-2">Application No</th>
                          <th className="p-2">Status</th>
                          <th className="p-2">Date</th>
                          <th className="p-2 w-10 text-center">Del</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                        {submissionForm.data.patents.map((row, idx) => (
                          <tr key={idx}>
                            <td className="p-2 text-center text-gray-400 font-bold">{idx + 1}</td>
                            <td className="p-2">
                              <input
                                type="text"
                                value={row.title || ''}
                                onChange={(e) => updateTableCell('patents', idx, 'title', e.target.value)}
                                placeholder="Patent Title"
                                className="w-full bg-transparent border-b border-gray-200 py-1 text-xs outline-none"
                              />
                            </td>
                            <td className="p-2">
                              <input
                                type="text"
                                value={row.app_no || ''}
                                onChange={(e) => updateTableCell('patents', idx, 'app_no', e.target.value)}
                                placeholder="e.g. 202641012345"
                                className="w-32 bg-transparent border-b border-gray-200 py-1 text-xs outline-none"
                              />
                            </td>
                            <td className="p-2">
                              <select
                                value={row.status || 'Published'}
                                onChange={(e) => updateTableCell('patents', idx, 'status', e.target.value)}
                                className="bg-transparent border-b border-gray-200 py-1 text-xs outline-none"
                              >
                                <option value="Filed">Filed</option>
                                <option value="Published">Published</option>
                                <option value="Granted">Granted</option>
                              </select>
                            </td>
                            <td className="p-2">
                              <input
                                type="date"
                                value={row.date || ''}
                                onChange={(e) => updateTableCell('patents', idx, 'date', e.target.value)}
                                className="bg-transparent border-b border-gray-200 py-1 text-xs outline-none"
                              />
                            </td>
                            <td className="p-2 text-center">
                              <button onClick={() => removeTableRow('patents', idx)} className="text-rose-500 hover:text-rose-700">
                                <Trash2 size={14} />
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

            {/* Modal Footer: Save Draft & Submit to HOD */}
            <div className="px-6 py-4 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between bg-gray-50/70 dark:bg-slate-800/40">
              <button
                type="button"
                onClick={() => setIsEditorModalOpen(false)}
                className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-200 text-xs font-bold rounded-xl cursor-pointer"
              >
                Close
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={savingSubmission}
                  onClick={() => handleSaveFacultySubmission('DRAFT')}
                  className="px-5 py-2.5 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-200 text-xs font-bold rounded-xl cursor-pointer shadow-sm"
                >
                  {savingSubmission ? 'Saving...' : 'Save Draft'}
                </button>
                <button
                  type="button"
                  disabled={savingSubmission}
                  onClick={async () => {
                    await handleSaveFacultySubmission('SUBMITTED');
                    setIsEditorModalOpen(false);
                  }}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  <Send size={14} />
                  <span>{savingSubmission ? 'Submitting...' : 'Submit to HOD'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🏛️ 3. HOD TAB 1: REVIEW SUBMISSIONS (STRICT USER SPEC)                     */}
      {/* ========================================================================= */}
      {isHodOrAdmin && activeTab === 'review_submissions' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-black text-gray-900 dark:text-white">
                  Faculty Monthly Submissions Tracker
                </h2>
                <p className="text-xs text-gray-500">
                  Department: <strong className="text-indigo-600">{department}</strong> | Period: <strong>{month} {year}</strong>
                </p>
              </div>

              {/* Status Filters */}
              <div className="flex flex-wrap items-center gap-1.5 bg-gray-50 dark:bg-slate-800/80 p-1.5 rounded-2xl border border-gray-200 dark:border-slate-700">
                {['ALL', 'SUBMITTED', 'APPROVED', 'CHANGES_REQUESTED', 'PENDING'].map(st => (
                  <button
                    key={st}
                    onClick={() => setFilterStatus(st)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                      filterStatus === st 
                        ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-sm' 
                        : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    {st.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            {/* Submissions Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-gray-50 dark:bg-slate-800/60 text-gray-500 uppercase text-[10px] font-bold">
                  <tr>
                    <th className="p-3">Faculty Name</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Last Modified</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                  {trackerLoading ? (
                    <tr>
                      <td colSpan="4" className="p-8 text-center text-gray-400">Loading submissions...</td>
                    </tr>
                  ) : (trackerData?.faculties || []).length === 0 ? (
                    <tr>
                      <td colSpan="4" className="p-8 text-center text-gray-400">
                        No faculty registered in {department}.
                      </td>
                    </tr>
                  ) : (
                    (trackerData?.faculties || [])
                      .filter(f => filterStatus === 'ALL' || f.status === filterStatus || (filterStatus === 'PENDING' && !f.status))
                      .map((fac) => (
                        <tr key={fac.faculty_id} className="hover:bg-gray-50/60 dark:hover:bg-slate-800/40">
                          <td className="p-3">
                            <div className="font-extrabold text-gray-900 dark:text-white text-xs">
                              {fac.faculty_name}
                            </div>
                            <div className="text-[11px] text-gray-400">{fac.email}</div>
                          </td>
                          <td className="p-3">
                            {fac.status === 'SUBMITTED' ? (
                              <span className="px-2.5 py-1 rounded-lg text-xs font-extrabold bg-blue-100 text-blue-800 border border-blue-200">
                                Submitted
                              </span>
                            ) : fac.status === 'APPROVED' || fac.status === 'LOCKED' ? (
                              <span className="px-2.5 py-1 rounded-lg text-xs font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                Approved & Locked
                              </span>
                            ) : fac.status === 'CHANGES_REQUESTED' ? (
                              <span className="px-2.5 py-1 rounded-lg text-xs font-extrabold bg-amber-100 text-amber-800 border border-amber-200">
                                Changes Requested
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-gray-100 text-gray-600">
                                Pending
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-gray-500">
                            {fac.submitted_at || fac.last_modified || 'Not submitted yet'}
                          </td>
                          <td className="p-3 text-right">
                            {fac.status === 'SUBMITTED' || fac.status === 'CHANGES_REQUESTED' ? (
                              <button
                                type="button"
                                onClick={() => {
                                  setReviewFaculty(fac);
                                  setReviewActiveSubTab('details');
                                }}
                                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition"
                              >
                                Review
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  setReviewFaculty(fac);
                                  setReviewActiveSubTab('details');
                                }}
                                className="px-3.5 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-semibold transition"
                              >
                                View
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🏛️ 4. HOD TAB 2: CONSOLIDATION (STRICT USER SPEC)                         */}
      {/* ========================================================================= */}
      {isHodOrAdmin && activeTab === 'consolidation' && (
        <div className="space-y-6">
          
          {/* Summary KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 rounded-3xl p-5">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                Approved & Locked Faculty
              </span>
              <div className="text-3xl font-black text-emerald-900 dark:text-emerald-100 mt-1">
                {approvedCount}
              </div>
              <p className="text-[11px] text-emerald-600 mt-1">
                Eligible to be included in consolidation
              </p>
            </div>

            <div className="bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded-3xl p-5">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300">
                Pending Submissions
              </span>
              <div className="text-3xl font-black text-amber-900 dark:text-amber-100 mt-1">
                {pendingCount + submittedCount}
              </div>
              <p className="text-[11px] text-amber-600 mt-1">
                {submittedCount} submitted awaiting review, {pendingCount} unsubmitted
              </p>
            </div>

            <div className="bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/60 rounded-3xl p-5">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-700 dark:text-rose-300">
                Changes Requested
              </span>
              <div className="text-3xl font-black text-rose-900 dark:text-rose-100 mt-1">
                {changesCount}
              </div>
              <p className="text-[11px] text-rose-600 mt-1">
                Sent back to faculty for corrections
              </p>
            </div>
          </div>

          {/* Consolidation Action Card */}
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-black text-gray-900 dark:text-white">
                  Selective & Departmental Auto-Merge
                </h3>
                <p className="text-xs text-gray-500">
                  Select which faculty records to merge into one consolidated monthly report sheet.
                  <span className="text-rose-600 font-bold ml-1">
                    * Strictly APPROVED + LOCKED submissions only will be merged.
                  </span>
                </p>
              </div>

              <button
                type="button"
                id="btn-generate-consolidated"
                disabled={consolidating || approvedCount === 0}
                onClick={handleGenerateConsolidated}
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 text-white text-xs font-extrabold shadow-lg shadow-purple-600/20 transition flex items-center gap-2 cursor-pointer"
              >
                <Sparkles size={16} />
                <span>{consolidating ? 'Merging Records...' : 'Generate Consolidated Report'}</span>
              </button>
            </div>

            {consolidatedSuccessMsg && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 rounded-2xl text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                <span>{consolidatedSuccessMsg}</span>
              </div>
            )}

            {/* Selection Checklist */}
            <div className="overflow-x-auto border border-gray-100 dark:border-slate-800 rounded-2xl">
              <table className="w-full text-xs text-left">
                <thead className="bg-gray-50 dark:bg-slate-800 text-gray-500 uppercase text-[10px] font-bold">
                  <tr>
                    <th className="p-3 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={selectedSubmissionIds.length > 0 && selectedSubmissionIds.length === approvedCount}
                        onChange={(e) => {
                          if (e.target.checked) {
                            const approvedIds = (trackerData?.faculties || [])
                              .filter(f => (f.status === 'APPROVED' || f.status === 'LOCKED') && f.submission_id)
                              .map(f => f.submission_id);
                            setSelectedSubmissionIds(approvedIds);
                          } else {
                            setSelectedSubmissionIds([]);
                          }
                        }}
                        className="rounded text-indigo-600"
                      />
                    </th>
                    <th className="p-3">Faculty Name</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Submitted At</th>
                    <th className="p-3">Consolidation Eligibility</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                  {(trackerData?.faculties || []).map((fac) => {
                    const isApproved = fac.status === 'APPROVED' || fac.status === 'LOCKED';
                    const isSelected = selectedSubmissionIds.includes(fac.submission_id);
                    return (
                      <tr key={fac.faculty_id} className={isApproved ? 'hover:bg-indigo-50/30' : 'opacity-60 bg-gray-50/50'}>
                        <td className="p-3 text-center">
                          <input
                            type="checkbox"
                            disabled={!isApproved}
                            checked={isSelected}
                            onChange={(e) => {
                              if (!fac.submission_id) return;
                              if (e.target.checked) {
                                setSelectedSubmissionIds(prev => [...prev, fac.submission_id]);
                              } else {
                                setSelectedSubmissionIds(prev => prev.filter(id => id !== fac.submission_id));
                              }
                            }}
                            className="rounded text-indigo-600"
                          />
                        </td>
                        <td className="p-3">
                          <div className="font-bold text-gray-900 dark:text-white">{fac.faculty_name}</div>
                          <div className="text-[11px] text-gray-400">{fac.email}</div>
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            isApproved ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-600'
                          }`}>
                            {fac.status || 'PENDING'}
                          </span>
                        </td>
                        <td className="p-3 text-gray-500">
                          {fac.submitted_at || '-'}
                        </td>
                        <td className="p-3">
                          {isApproved ? (
                            <span className="text-emerald-600 font-bold text-xs flex items-center gap-1">
                              <CheckCircle2 size={13} /> Eligible for Consolidation
                            </span>
                          ) : (
                            <span className="text-gray-400 text-xs">
                              Must be Approved & Locked first
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🏛️ 5. HOD TAB 3: IQAC MASTER REPORT (STRICT USER SPEC)                     */}
      {/* ========================================================================= */}
      {isHodOrAdmin && activeTab === 'iqac_master' && (
        <div className="space-y-6">

          {/* Action Bar: View Report, Download Word, Excel, PDF, Print, Share */}
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm flex flex-wrap items-center justify-between gap-3 print:hidden">
            <div>
              <h2 className="text-base font-extrabold text-gray-900 dark:text-white">
                Official Departmental IQAC Master Report
              </h2>
              <p className="text-xs text-gray-500">
                Department: {department} | Period: {month} {year}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handlePrintPDF}
                className="px-3.5 py-2 bg-gray-900 hover:bg-black text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5"
              >
                <Printer size={15} />
                <span>PDF / Print</span>
              </button>

              <button
                type="button"
                onClick={handleExportWord}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5"
              >
                <FileText size={15} />
                <span>Word (.doc)</span>
              </button>

              <button
                type="button"
                onClick={handleExportExcel}
                className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5"
              >
                <FileSpreadsheet size={15} />
                <span>Excel (.xlsx)</span>
              </button>

              <button
                type="button"
                onClick={handleShareLink}
                className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-indigo-200"
              >
                <Share2 size={15} />
                <span>Share Link</span>
              </button>
            </div>
          </div>

          {copyShareFeedback && (
            <div className="p-3 bg-indigo-50 text-indigo-800 rounded-2xl text-xs font-bold print:hidden">
              {copyShareFeedback}
            </div>
          )}

          {/* Printable Official IQAC Sheet */}
          <div id="printable-iqac-report" ref={printRef} className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl p-8 shadow-sm space-y-8 font-sans">
            
            {/* Institutional Header */}
            <div className="text-center border-b pb-6 space-y-1">
              <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">
                AVN INSTITUTE OF ENGINEERING & TECHNOLOGY
              </h2>
              <p className="text-xs text-gray-500 font-semibold">
                An Autonomous Institute | Accredited by NAAC with 'A+' Grade & NBA | Affiliated to JNTUH
              </p>
              <h3 className="text-sm font-extrabold text-indigo-700 dark:text-indigo-400 uppercase mt-2">
                DEPARTMENT OF {department.toUpperCase()}
              </h3>
              <p className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">
                INTERNAL QUALITY ASSURANCE CELL (IQAC) MONTHLY REPORT - {month} {year}
              </p>
            </div>

            {/* Matrix & Tables */}
            <div className="space-y-6">
              
              {/* Publications Table */}
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-gray-800 dark:text-gray-200 mb-2">
                  1. Faculty Research Publications (Journals & Conferences)
                </h4>
                <table className="w-full text-xs text-left border border-gray-300 dark:border-slate-700 border-collapse">
                  <thead className="bg-gray-100 dark:bg-slate-800 text-[10px] font-bold uppercase">
                    <tr>
                      <th className="border p-2 w-10 text-center">S.No</th>
                      <th className="border p-2">Authors / Faculty</th>
                      <th className="border p-2">Paper Title</th>
                      <th className="border p-2">Journal / Conference</th>
                      <th className="border p-2">Indexing</th>
                      <th className="border p-2">ISSN/ISBN</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(consolidatedData?.sections?.['5_journal_publications'] || []).length === 0 ? (
                      <tr>
                        <td colSpan="6" className="border p-3 text-center text-gray-400">
                          No publications merged in this report.
                        </td>
                      </tr>
                    ) : (
                      (consolidatedData?.sections?.['5_journal_publications'] || []).map((p, idx) => (
                        <tr key={idx}>
                          <td className="border p-2 text-center">{idx + 1}</td>
                          <td className="border p-2 font-bold">{p.authors || '-'}</td>
                          <td className="border p-2">{p.title || '-'}</td>
                          <td className="border p-2">{p.journal || '-'}</td>
                          <td className="border p-2">{p.indexing || 'Scopus'}</td>
                          <td className="border p-2">{p.issn_isbn || '-'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Patents Table */}
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-gray-800 dark:text-gray-200 mb-2">
                  2. Patents & Intellectual Property
                </h4>
                <table className="w-full text-xs text-left border border-gray-300 dark:border-slate-700 border-collapse">
                  <thead className="bg-gray-100 dark:bg-slate-800 text-[10px] font-bold uppercase">
                    <tr>
                      <th className="border p-2 w-10 text-center">S.No</th>
                      <th className="border p-2">Inventors</th>
                      <th className="border p-2">Patent Title</th>
                      <th className="border p-2">Application No</th>
                      <th className="border p-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(consolidatedData?.sections?.['7_patents'] || []).length === 0 ? (
                      <tr>
                        <td colSpan="5" className="border p-3 text-center text-gray-400">
                          No patents merged in this report.
                        </td>
                      </tr>
                    ) : (
                      (consolidatedData?.sections?.['7_patents'] || []).map((pat, idx) => (
                        <tr key={idx}>
                          <td className="border p-2 text-center">{idx + 1}</td>
                          <td className="border p-2 font-bold">{pat.inventors || '-'}</td>
                          <td className="border p-2">{pat.title || '-'}</td>
                          <td className="border p-2">{pat.app_no || '-'}</td>
                          <td className="border p-2">{pat.status || 'Published'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* FDPs Table */}
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-gray-800 dark:text-gray-200 mb-2">
                  3. Faculty Professional Development (FDPs / STTPs Attended)
                </h4>
                <table className="w-full text-xs text-left border border-gray-300 dark:border-slate-700 border-collapse">
                  <thead className="bg-gray-100 dark:bg-slate-800 text-[10px] font-bold uppercase">
                    <tr>
                      <th className="border p-2 w-10 text-center">S.No</th>
                      <th className="border p-2">Faculty Name</th>
                      <th className="border p-2">Program Title</th>
                      <th className="border p-2">Organizing Institute</th>
                      <th className="border p-2">Duration</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(consolidatedData?.sections?.['9_fdp_attended'] || []).length === 0 ? (
                      <tr>
                        <td colSpan="5" className="border p-3 text-center text-gray-400">
                          No FDP entries merged in this report.
                        </td>
                      </tr>
                    ) : (
                      (consolidatedData?.sections?.['9_fdp_attended'] || []).map((f, idx) => (
                        <tr key={idx}>
                          <td className="border p-2 text-center">{idx + 1}</td>
                          <td className="border p-2 font-bold">{f.faculty_name || '-'}</td>
                          <td className="border p-2">{f.fdp_name || '-'}</td>
                          <td className="border p-2">{f.organization || '-'}</td>
                          <td className="border p-2">{f.duration || f.dates || '-'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Signatures Footer */}
              <div className="pt-12 flex justify-between items-center text-xs font-bold text-gray-800 dark:text-gray-300">
                <div className="text-center">
                  <div className="border-t border-gray-400 pt-1 w-44">Department IQAC Coordinator</div>
                </div>
                <div className="text-center">
                  <div className="border-t border-gray-400 pt-1 w-44">Head of Department (HOD)</div>
                </div>
                <div className="text-center">
                  <div className="border-t border-gray-400 pt-1 w-44">Principal / Director</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🔍 HOD REVIEW SCREEN / MODAL (View Details, Documents, Approve, Reject)    */}
      {/* ========================================================================= */}
      {reviewFaculty && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            
            {/* Header */}
            <div className="p-6 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block">
                  HOD Faculty Review Panel
                </span>
                <h3 className="text-lg font-black text-gray-900 dark:text-white">
                  {reviewFaculty.faculty_name} ({reviewFaculty.department || department})
                </h3>
                <p className="text-xs text-gray-400">
                  Status: <strong>{reviewFaculty.status || 'PENDING'}</strong> | Last Modified: {reviewFaculty.submitted_at || reviewFaculty.last_modified || '-'}
                </p>
              </div>

              <button
                onClick={() => setReviewFaculty(null)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 flex items-center justify-center text-gray-500"
              >
                <X size={18} />
              </button>
            </div>

            {/* Sub-tabs: View Details | View Documents | Audit Trail */}
            <div className="flex border-b border-gray-100 dark:border-slate-800 px-6 gap-4 text-xs font-bold">
              <button
                onClick={() => setReviewActiveSubTab('details')}
                className={`py-3 border-b-2 transition ${reviewActiveSubTab === 'details' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-400'}`}
              >
                View Details
              </button>
              <button
                onClick={() => setReviewActiveSubTab('documents')}
                className={`py-3 border-b-2 transition ${reviewActiveSubTab === 'documents' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-400'}`}
              >
                View Documents / Proofs
              </button>
              <button
                onClick={() => setReviewActiveSubTab('history')}
                className={`py-3 border-b-2 transition ${reviewActiveSubTab === 'history' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-400'}`}
              >
                Submission Audit History
              </button>
            </div>

            {/* Content Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-4 text-xs">
              {reviewActiveSubTab === 'details' && (
                <div className="space-y-4">
                  <div className="bg-gray-50 dark:bg-slate-800/50 p-4 rounded-2xl">
                    <h4 className="font-extrabold text-gray-900 dark:text-white mb-2">Submitted Academic Records:</h4>
                    <p className="text-gray-600 dark:text-gray-300">
                      Total items submitted: <strong>{(reviewFaculty.submission_data ? Object.values(reviewFaculty.submission_data).flat().length : 0)}</strong> records.
                    </p>
                  </div>

                  {/* Publications */}
                  <div className="border rounded-2xl p-4 space-y-2">
                    <h5 className="font-bold text-gray-900 dark:text-white">Publications:</h5>
                    {(reviewFaculty.submission_data?.journal_publications || []).length === 0 ? (
                      <p className="text-gray-400">None submitted</p>
                    ) : (
                      (reviewFaculty.submission_data?.journal_publications || []).map((item, idx) => (
                        <div key={idx} className="p-2 bg-gray-50 dark:bg-slate-800 rounded-lg">
                          <strong>{item.title}</strong> - {item.journal_name} ({item.indexing})
                        </div>
                      ))
                    )}
                  </div>

                  {/* FDPs */}
                  <div className="border rounded-2xl p-4 space-y-2">
                    <h5 className="font-bold text-gray-900 dark:text-white">FDPs Attended:</h5>
                    {(reviewFaculty.submission_data?.fdps_workshops_attended || []).length === 0 ? (
                      <p className="text-gray-400">None submitted</p>
                    ) : (
                      (reviewFaculty.submission_data?.fdps_workshops_attended || []).map((item, idx) => (
                        <div key={idx} className="p-2 bg-gray-50 dark:bg-slate-800 rounded-lg">
                          <strong>{item.title}</strong> - {item.organization} ({item.start_date || 'N/A'})
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {reviewActiveSubTab === 'documents' && (
                <div className="space-y-3">
                  <h4 className="font-bold text-gray-900 dark:text-white">Attached Document Proofs:</h4>
                  {reviewFaculty.submission_data?.fdps_workshops_attended?.some(f => f.proof_url) ? (
                    (reviewFaculty.submission_data?.fdps_workshops_attended || []).filter(f => f.proof_url).map((f, i) => (
                      <div key={i} className="flex items-center justify-between p-3 border rounded-xl">
                        <span>{f.title}</span>
                        <a href={f.proof_url} target="_blank" rel="noreferrer" className="text-indigo-600 font-bold underline flex items-center gap-1">
                          View Proof <ExternalLink size={12} />
                        </a>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-400">No external documents or URLs attached.</p>
                  )}
                </div>
              )}

              {reviewActiveSubTab === 'history' && (
                <div className="space-y-3">
                  <h4 className="font-bold text-gray-900 dark:text-white">Audit History & Time Tracking:</h4>
                  {(reviewFaculty.audit_history || []).length === 0 ? (
                    <p className="text-gray-400">No revision history recorded.</p>
                  ) : (
                    (reviewFaculty.audit_history || []).map((log, idx) => (
                      <div key={idx} className="p-3 bg-gray-50 dark:bg-slate-800 rounded-xl border-l-4 border-indigo-600">
                        <div className="flex justify-between font-bold">
                          <span>{log.action}</span>
                          <span className="text-gray-400 font-normal">{log.timestamp}</span>
                        </div>
                        <p className="text-gray-600 dark:text-gray-300 mt-1">{log.details || log.reason}</p>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Decision Footer */}
            <div className="p-4 bg-gray-50 dark:bg-slate-800/60 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-[11px] text-gray-500 font-medium">
                HOD Decision Options:
              </span>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => handleOpenHodAction('REQUEST_CHANGES', reviewFaculty)}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold shadow-sm transition"
                >
                  Request Changes
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenHodAction('REJECT', reviewFaculty)}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-sm transition"
                >
                  Reject
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenHodAction('APPROVE_AND_LOCK', reviewFaculty)}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold shadow-md transition flex items-center gap-1.5"
                >
                  <ShieldCheck size={15} />
                  <span>Approve & Lock</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Remarks Modal for HOD Action (Request Changes / Reject / Approve) */}
      {hodRemarkPrompt.open && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-extrabold text-gray-900 dark:text-white">
              {hodRemarkPrompt.title}
            </h3>
            <p className="text-xs text-gray-500">
              {hodRemarkPrompt.action === 'REQUEST_CHANGES'
                ? 'Enter the specific feedback or corrections needed by the faculty:'
                : 'Enter remarks or confirmation notes for this action:'}
            </p>
            <textarea
              rows={3}
              value={hodRemarkPrompt.remarks}
              onChange={(e) => setHodRemarkPrompt(prev => ({ ...prev, remarks: e.target.value }))}
              placeholder="e.g. Please update Scopus journal ISSN and verify FDP duration dates."
              className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl p-3 text-xs outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setHodRemarkPrompt({ open: false, action: '', title: '', remarks: '' })}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={hodActionLoading}
                onClick={handleExecuteHodAction}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md"
              >
                {hodActionLoading ? 'Processing...' : 'Confirm Action'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Faculty Modal: View Submission History */}
      {viewHistoryModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
                <History size={18} className="text-indigo-600" /> Submission Audit History
              </h3>
              <button onClick={() => setViewHistoryModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>
            <div className="max-h-80 overflow-y-auto space-y-3 text-xs">
              {(submissionForm.audit_history || []).length === 0 ? (
                <p className="text-center py-6 text-gray-400">No submission history yet.</p>
              ) : (
                (submissionForm.audit_history || []).map((item, idx) => (
                  <div key={idx} className="p-3 bg-gray-50 dark:bg-slate-800 rounded-xl border-l-4 border-indigo-500">
                    <div className="flex justify-between font-bold text-gray-900 dark:text-white">
                      <span>{item.action || item.new_status}</span>
                      <span className="text-[10px] text-gray-400 font-normal">{item.timestamp}</span>
                    </div>
                    <p className="text-gray-600 dark:text-gray-300 mt-1">{item.details || item.reason}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Faculty Modal: View Report Preview */}
      {viewReportModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl max-w-3xl w-full p-6 max-h-[85vh] overflow-y-auto space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-base font-extrabold text-gray-900 dark:text-white">
                  My Monthly Report: {month} {year}
                </h3>
                <span className="text-xs text-gray-400">Department: {department}</span>
              </div>
              <button onClick={() => setViewReportModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="border rounded-2xl p-4">
                <h4 className="font-bold mb-2">1. Journal Publications ({submissionForm.data.journal_publications.length})</h4>
                {submissionForm.data.journal_publications.map((p, i) => (
                  <div key={i} className="py-1">{i + 1}. {p.title} - {p.journal_name} ({p.indexing})</div>
                ))}
              </div>

              <div className="border rounded-2xl p-4">
                <h4 className="font-bold mb-2">2. FDPs Attended ({submissionForm.data.fdps_workshops_attended.length})</h4>
                {submissionForm.data.fdps_workshops_attended.map((f, i) => (
                  <div key={i} className="py-1">{i + 1}. {f.title} - {f.organization}</div>
                ))}
              </div>

              <div className="border rounded-2xl p-4">
                <h4 className="font-bold mb-2">3. Patents ({submissionForm.data.patents.length})</h4>
                {submissionForm.data.patents.map((pat, i) => (
                  <div key={i} className="py-1">{i + 1}. {pat.title} - App No: {pat.app_no} ({pat.status})</div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t">
              <button
                type="button"
                onClick={() => setViewReportModal(false)}
                className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Faculty Modal: View HOD Comments */}
      {viewCommentsModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-extrabold text-amber-700 flex items-center gap-2">
                <MessageSquare size={18} /> HOD Review Comments
              </h3>
              <button onClick={() => setViewCommentsModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>
            <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 rounded-2xl text-xs text-amber-900 dark:text-amber-200">
              "{submissionForm.change_request_reason || 'Please review and resubmit your monthly activity return.'}"
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => {
                  setViewCommentsModal(false);
                  setIsFormEditing(true);
                }}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold"
              >
                Proceed to Edit
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default MonthlyReportHub;

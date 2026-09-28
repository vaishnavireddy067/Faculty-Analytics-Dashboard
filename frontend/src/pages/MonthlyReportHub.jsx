import React, { useState, useEffect, useRef } from 'react';
import { 
  Users, CheckCircle2, Clock, AlertCircle, FileSpreadsheet, 
  Printer, Download, RefreshCw, Send, Plus, Trash2, Eye, 
  Layers, Award, BookOpen, Briefcase, FileText, ChevronRight, 
  Calendar, Building, Sparkles, Check, ArrowRight, ShieldCheck,
  ExternalLink, Search, Filter, HelpCircle
} from 'lucide-react';
import { fetchAPI, API_BASE_URL } from '../services/api';

const MonthlyReportHub = () => {
  // Current user info & roles
  const [currentUser, setCurrentUser] = useState({ role: 'FACULTY', username: '', department: '' });
  const [activeTab, setActiveTab] = useState('hod_tracker'); // 'hod_tracker' | 'faculty_submission' | 'consolidated_view'

  // Global filters
  const [department, setDepartment] = useState('Computer Science & Engineering');
  const [month, setMonth] = useState('SEPTEMBER');
  const [year, setYear] = useState('2026');
  const [academicYear, setAcademicYear] = useState('2025-26');

  // HOD Tracker State
  const [trackerLoading, setTrackerLoading] = useState(false);
  const [trackerData, setTrackerData] = useState(null);
  const [searchFaculty, setSearchFaculty] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [selectedPreviewFaculty, setSelectedPreviewFaculty] = useState(null);

  // Faculty Submission Form State
  const [submissionLoading, setSubmissionLoading] = useState(false);
  const [savingSubmission, setSavingSubmission] = useState(false);
  const [submissionSuccessMsg, setSubmissionSuccessMsg] = useState('');
  const [submissionForm, setSubmissionForm] = useState({
    status: 'PENDING',
    submitted_at: null,
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

  // Consolidated View State
  const [consolidating, setConsolidating] = useState(false);
  const [consolidatedData, setConsolidatedData] = useState(null);
  const [consolidatedSuccessMsg, setConsolidatedSuccessMsg] = useState('');
  const printRef = useRef();

  // Load User Profile on mount
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const userInfoStr = localStorage.getItem('current_user_info');
        if (userInfoStr) {
          const parsed = JSON.parse(userInfoStr);
          setCurrentUser(parsed);
          if (parsed.department) setDepartment(parsed.department);
          if (parsed.role === 'FACULTY') {
            setActiveTab('faculty_submission');
          } else {
            setActiveTab('hod_tracker');
          }
        }
        const profile = await fetchAPI('/faculty/profile/');
        if (profile) {
          setCurrentUser(profile);
          if (profile.department) setDepartment(profile.department);
          if (profile.role === 'FACULTY') {
            setActiveTab('faculty_submission');
          } else {
            setActiveTab('hod_tracker');
          }
        }
      } catch (err) {
        console.warn("Using stored profile fallback", err);
      }
    };
    loadProfile();
  }, []);

  // Fetch HOD Tracker Data
  const loadTrackerData = async () => {
    setTrackerLoading(true);
    try {
      const query = `department=${encodeURIComponent(department)}&month=${month}&year=${year}`;
      const data = await fetchAPI(`/faculty/monthly-submission/tracker/?${query}`);
      setTrackerData(data);
    } catch (err) {
      console.warn("Failed to load tracker data", err);
    } finally {
      setTrackerLoading(false);
    }
  };

  // Fetch Current Faculty's Monthly Submission
  const loadFacultySubmission = async () => {
    setSubmissionLoading(true);
    setSubmissionSuccessMsg('');
    try {
      const query = `department=${encodeURIComponent(department)}&month=${month}&year=${year}&academic_year=${academicYear}`;
      const res = await fetchAPI(`/faculty/monthly-submission/detail/?${query}`);
      if (res) {
        setSubmissionForm({
          status: res.status || 'PENDING',
          submitted_at: res.submitted_at,
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
      }
    } catch (err) {
      console.warn("Failed to load faculty submission", err);
    } finally {
      setSubmissionLoading(false);
    }
  };

  // Fetch or trigger 1-Click Auto-Consolidation (ONLY APPROVED SUBMISSIONS)
  const handleAutoConsolidate = async () => {
    setConsolidating(true);
    setConsolidatedSuccessMsg('');
    try {
      const payload = {
        department,
        month,
        year,
        academic_year: academicYear
      };
      const res = await fetchAPI('/faculty/monthly-submission/consolidate/', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      if (res && res.success) {
        setConsolidatedData(res);
        if (res.total_submissions_merged > 0) {
          setConsolidatedSuccessMsg(`✅ Successfully merged ${res.total_submissions_merged} APPROVED & LOCKED faculty submissions into the Consolidated Master Report!`);
        } else {
          setConsolidatedSuccessMsg(`⚠️ Note: 0 Approved submissions merged. Please review and approve faculty submissions in the HOD Review Tracker first!`);
        }
        setActiveTab('consolidated_view');
        // Refresh tracker to show updated counts
        loadTrackerData();
      }
    } catch (err) {
      console.error("Auto consolidation error:", err);
    } finally {
      setConsolidating(false);
    }
  };

  // Faculty Delete / Withdraw Submission
  const handleDeleteSubmission = async () => {
    if (!window.confirm(`Are you sure you want to permanently delete/withdraw your monthly report submission for ${month} ${year}? All entered data for this month will be cleared.`)) {
      return;
    }
    try {
      setSavingSubmission(true);
      const query = `month=${encodeURIComponent(month)}&year=${encodeURIComponent(year)}`;
      const res = await fetchAPI(`/faculty/monthly-submission/delete/?${query}`, {
        method: 'DELETE'
      });
      if (res && res.success) {
        setSubmissionSuccessMsg('🗑️ Your monthly submission has been deleted successfully.');
        setSubmissionForm({
          status: 'PENDING',
          submitted_at: null,
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
        setTimeout(() => setSubmissionSuccessMsg(''), 6000);
      } else {
        alert(res?.message || 'Failed to delete submission');
      }
    } catch (err) {
      console.error("Failed to delete submission", err);
      alert("Error deleting submission. Please try again.");
    } finally {
      setSavingSubmission(false);
    }
  };

  // HOD Action: Delete / Discard Submission
  const handleDeleteSubmissionByHOD = async (submissionId) => {
    if (!submissionId) return;
    if (!window.confirm("Are you sure you want to permanently delete/discard this faculty monthly submission record?")) {
      return;
    }
    try {
      const res = await fetchAPI(`/faculty/monthly-submission/${submissionId}/delete/`, {
        method: 'DELETE'
      });
      if (res && res.success) {
        alert("Faculty monthly submission deleted successfully.");
        setSelectedPreviewFaculty(null);
        loadTrackerData();
      } else {
        alert(res?.message || 'Failed to delete submission');
      }
    } catch (err) {
      console.error("HOD delete submission failed:", err);
      alert("Failed to delete submission.");
    }
  };

  // HOD Action: Approve or Request Revision
  const handleHODAction = async (submissionId, action, remarks = '') => {
    if (!submissionId) return;
    try {
      const res = await fetchAPI(`/faculty/monthly-submission/${submissionId}/action/`, {
        method: 'POST',
        body: JSON.stringify({ action, remarks })
      });
      if (res && res.success) {
        if (selectedPreviewFaculty && selectedPreviewFaculty.submission_id === submissionId) {
          setSelectedPreviewFaculty(prev => ({ ...prev, status: res.status }));
        }
        loadTrackerData();
      }
    } catch (err) {
      console.error("HOD action failed:", err);
    }
  };

  useEffect(() => {
    if (activeTab === 'hod_tracker') {
      loadTrackerData();
    } else if (activeTab === 'faculty_submission') {
      loadFacultySubmission();
    }
  }, [department, month, year, academicYear, activeTab]);

  // Handle Faculty Submit / Save
  const handleSaveSubmission = async (submitStatus = 'SUBMITTED') => {
    setSavingSubmission(true);
    setSubmissionSuccessMsg('');
    try {
      const payload = {
        department,
        month,
        year,
        academic_year: academicYear,
        status: submitStatus,
        submission_data: submissionForm.data
      };
      const res = await fetchAPI('/faculty/monthly-submission/detail/', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      if (res && res.success) {
        setSubmissionSuccessMsg(submitStatus === 'SUBMITTED' ? '🎉 Your monthly report has been submitted to the HOD successfully!' : 'Draft saved successfully!');
        setSubmissionForm(prev => ({
          ...prev,
          status: submitStatus,
          submitted_at: res.submitted_at || new Date().toLocaleString()
        }));
        setTimeout(() => setSubmissionSuccessMsg(''), 5000);
      }
    } catch (err) {
      console.error("Failed to save submission", err);
    } finally {
      setSavingSubmission(false);
    }
  };

  // Helper to add row in faculty submission form
  const addTableRow = (category, defaultObj) => {
    setSubmissionForm(prev => {
      const currentList = prev.data[category] || [];
      return {
        ...prev,
        data: {
          ...prev.data,
          [category]: [...currentList, { ...defaultObj, s_no: currentList.length + 1 }]
        }
      };
    });
  };

  // Helper to remove row
  const removeTableRow = (category, index) => {
    setSubmissionForm(prev => {
      const currentList = [...(prev.data[category] || [])];
      currentList.splice(index, 1);
      const reindexed = currentList.map((r, i) => ({ ...r, s_no: i + 1 }));
      return {
        ...prev,
        data: {
          ...prev.data,
          [category]: reindexed
        }
      };
    });
  };

  // Helper to update specific row cell
  const updateTableRowCell = (category, index, key, value) => {
    setSubmissionForm(prev => {
      const currentList = [...(prev.data[category] || [])];
      currentList[index] = { ...currentList[index], [key]: value };
      return {
        ...prev,
        data: {
          ...prev.data,
          [category]: currentList
        }
      };
    });
  };

  // Auto-Fill Samples for quick demonstration / testing
  const handleAutoFillSampleData = () => {
    setSubmissionForm(prev => ({
      ...prev,
      data: {
        ...prev.data,
        fdps_workshops_attended: [
          { s_no: 1, title: 'AI & Generative Deep Learning in Engineering', role: 'Participant', organization: 'IIT Hyderabad & AICTE', start_date: '2026-09-05', end_date: '2026-09-09', duration_days: 5, proof_url: 'https://proofs.aiet.edu/fdp1.pdf' },
          { s_no: 2, title: 'Emerging Cloud Architecture & Kubernetes', role: 'Participant', organization: 'AWS Academy & TASK', start_date: '2026-09-18', end_date: '2026-09-20', duration_days: 3, proof_url: '' }
        ],
        events_organized: [
          { s_no: 1, title: 'National Hackathon: Smart Vision 2026', event_type: 'STUDENT HACKATHON', date: '2026-09-15', participants_count: 140, resource_person: 'Dr. R. K. Verma, Principal Scientist', outcome: 'Selected top 3 innovative startup projects' }
        ],
        journal_publications: [
          { s_no: 1, title: 'Optimized Real-time Edge Vision for Automated Campus Surveillance', authors: `${currentUser.username || 'Faculty'}, Dr. Ramesh`, journal: 'IEEE Transactions on Industrial Informatics', volume_issue: 'Vol. 20, Issue 9, pp. 110-118, 2026', indexing: 'SCI', doi: '10.1109/TII.2026.89201' }
        ],
        conference_publications: [
          { s_no: 1, title: 'Deep Residual Learning for Micro-crack Detection', authors: `${currentUser.username || 'Faculty'} et al.`, conference_name: 'IEEE International Conference on Smart Computing (ICSC 2026)', date: '2026-09-22', indexing: 'Scopus Indexed' }
        ],
        patents: [
          { s_no: 1, title: 'Smart IoT Autonomous Drone Surveillance System for Farmland', status: 'PUBLISHED', app_no: '202641038910', year: '2026' }
        ],
        awards_honors: [
          { s_no: 1, award_name: 'Outstanding Faculty Researcher Award 2026', awarding_agency: 'State Council of Higher Education', date: '2026-09-05', details: 'Recognized for top citations in AI' }
        ],
        guest_lectures: [
          { s_no: 1, topic: 'Transformative Generative AI in Healthcare', host_org: 'VNR Vignana Jyothi Institute', date: '2026-09-12', target_audience: 'B.Tech & M.Tech Students' }
        ],
        certifications: [
          { s_no: 1, cert_name: 'Deep Learning Specialization', platform: 'Coursera / DeepLearning.AI', completion_date: '2026-09-10' }
        ],
        student_projects_guided: [
          { s_no: 1, project_title: 'AI Multi-Agent Traffic Controller', student_names: 'V. Sai, K. Rohan, P. Sneha', outcome: 'Best Project Award & Patent Filed' }
        ],
        remarks: 'All lab activities and academic deliverables completed on schedule.'
      }
    }));
  };

  // Filter faculties in HOD Tracker
  const filteredFaculties = (trackerData?.faculties || []).filter(fac => {
    const matchesSearch = fac.faculty_name?.toLowerCase().includes(searchFaculty.toLowerCase()) ||
                          fac.email?.toLowerCase().includes(searchFaculty.toLowerCase());
    if (filterStatus === 'ALL') return matchesSearch;
    return matchesSearch && fac.status === filterStatus;
  });

  const isHodOrAdmin = (currentUser?.role || '').toUpperCase() === 'HOD' || (currentUser?.role || '').toUpperCase() === 'ADMIN' || (currentUser?.role || '').toUpperCase() === 'SUPERADMIN';

  // Ensure faculty stays on faculty_submission
  useEffect(() => {
    if (!isHodOrAdmin && activeTab !== 'faculty_submission') {
      setActiveTab('faculty_submission');
    }
  }, [isHodOrAdmin, activeTab]);

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-4 md:p-6 print:p-0 print:m-0 print:max-w-full">
      
      {/* 🌟 Top Header & Workflow Mode Switcher */}
      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                {isHodOrAdmin ? 'HOD Department Console' : 'Faculty Activity Portal'}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                Direct Submission & Tracking
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white mt-1">
              {isHodOrAdmin ? 'HOD Review, Tracking & Consolidation Hub' : 'Faculty Monthly Activity Submission'}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {isHodOrAdmin 
                ? 'Monitor monthly faculty submissions, review record evidence, and compile the official 1-click consolidated institutional report.' 
                : 'Submit your monthly academic, research publications, FDPs, student mentorship, and departmental records directly to the Head of Department (HOD).'}
            </p>
          </div>

          {/* Tab Navigation (Visible strictly to HOD / Admin) */}
          {isHodOrAdmin && (
            <div className="flex flex-wrap items-center bg-gray-100 dark:bg-slate-800 p-1.5 rounded-2xl border border-gray-200 dark:border-slate-700 gap-1">
              <button
                onClick={() => setActiveTab('hod_tracker')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'hod_tracker'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Users size={15} />
                <span>1. HOD Tracker & Review</span>
              </button>

              <button
                onClick={() => {
                  if (!consolidatedData) handleAutoConsolidate();
                  setActiveTab('consolidated_view');
                }}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'consolidated_view'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Sparkles size={15} />
                <span>2. Consolidated Master Sheet</span>
              </button>

              <button
                onClick={() => setActiveTab('faculty_submission')}
                className={`flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'faculty_submission'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-800'
                }`}
              >
                <Send size={14} />
                <span>My Own Submission</span>
              </button>
            </div>
          )}
        </div>

        {/* Global Selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-gray-100 dark:border-slate-800">
          <div>
            <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Department</label>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-medium text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value="Computer Science & Engineering">Computer Science & Engineering</option>
              <option value="Computer Science & Engineering (Data Science) and AI&DS">CSE (Data Science) & AI&DS</option>
              <option value="Information Technology">Information Technology</option>
              <option value="Electronics & Communication Engineering">ECE</option>
              <option value="Electrical & Electronics Engineering">EEE</option>
              <option value="Mechanical Engineering">Mechanical Engineering</option>
              <option value="Civil Engineering">Civil Engineering</option>
              <option value="Master of Business Administration">MBA</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Month</label>
            <select
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-medium text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              {['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'].map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Year</label>
            <select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-medium text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value="2026">2026</option>
              <option value="2025">2025</option>
              <option value="2024">2024</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Academic Year</label>
            <input
              type="text"
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
              className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-medium text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="e.g. 2025-26"
            />
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 🚀 TAB 1: FACULTY MONTHLY SUBMISSION FORM */}
      {/* ========================================================================= */}
      {activeTab === 'faculty_submission' && (
        <div className="space-y-6">
          {/* Status Bar */}
          <div className="bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-transparent border border-indigo-200 dark:border-indigo-900/60 rounded-3xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-xl ${
                submissionForm.status === 'SUBMITTED' 
                  ? 'bg-emerald-500 text-white shadow-emerald-500/30 shadow-lg' 
                  : 'bg-amber-500 text-white shadow-amber-500/30 shadow-lg'
              }`}>
                {submissionForm.status === 'SUBMITTED' ? <CheckCircle2 size={24} /> : <Clock size={24} />}
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    submissionForm.status === 'SUBMITTED' 
                      ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300' 
                      : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-300'
                  }`}>
                    {submissionForm.status === 'SUBMITTED' ? 'SUBMITTED TO HOD' : 'PENDING SUBMISSION'}
                  </span>
                  {submissionForm.submitted_at && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      Last Updated: {submissionForm.submitted_at}
                    </span>
                  )}
                </div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mt-0.5">
                  Monthly Activity Return: {month} {year}
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Fill in your academic activities for {month} {year}. Click submit when ready — the HOD will receive and auto-merge it into the department report.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleAutoFillSampleData}
                className="px-3 py-2 bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 text-purple-700 dark:text-purple-300 rounded-xl text-xs font-bold border border-purple-200 dark:border-purple-800 transition-all flex items-center space-x-1.5"
              >
                <Sparkles size={14} />
                <span>⚡ Auto-fill Sample Data</span>
              </button>

              {submissionForm.status !== 'PENDING' && (
                <button
                  type="button"
                  disabled={savingSubmission}
                  onClick={handleDeleteSubmission}
                  className="px-3.5 py-2 bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 text-rose-700 dark:text-rose-300 rounded-xl text-xs font-bold border border-rose-200 dark:border-rose-800 transition-all flex items-center space-x-1"
                  title="Delete/Withdraw your submitted monthly report"
                >
                  <Trash2 size={14} />
                  <span>Withdraw / Delete Return</span>
                </button>
              )}

              <button
                type="button"
                disabled={savingSubmission}
                onClick={() => handleSaveSubmission('DRAFT')}
                className="px-4 py-2 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-bold border border-gray-200 dark:border-slate-700 transition-all"
              >
                Save as Draft
              </button>

              <button
                type="button"
                disabled={savingSubmission}
                onClick={() => handleSaveSubmission('SUBMITTED')}
                className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl text-xs font-extrabold shadow-md shadow-indigo-500/20 transition-all flex items-center space-x-1.5"
              >
                <Send size={15} />
                <span>{savingSubmission ? 'Submitting...' : 'Submit Monthly Report to HOD'}</span>
              </button>
            </div>
          </div>

          {submissionSuccessMsg && (
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 rounded-2xl text-emerald-800 dark:text-emerald-200 text-sm font-semibold flex items-center space-x-2">
              <CheckCircle2 size={18} className="text-emerald-500" />
              <span>{submissionSuccessMsg}</span>
            </div>
          )}

          {/* Form Sections */}
          <div className="space-y-6">
            
            {/* Section 1: FDPs Attended */}
            <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-extrabold text-gray-900 dark:text-white flex items-center space-x-2">
                    <span className="w-6 h-6 rounded-lg bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xs">1</span>
                    <span>FDPs, STTPs & Workshops Attended</span>
                  </h3>
                  <p className="text-xs text-gray-500">List all professional development programs you attended during this month.</p>
                </div>
                <button
                  type="button"
                  onClick={() => addTableRow('fdps_workshops_attended', { title: '', role: 'Participant', organization: '', start_date: '', end_date: '', duration_days: 1, proof_url: '' })}
                  className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 rounded-xl text-xs font-bold flex items-center space-x-1 transition-all border border-indigo-200 dark:border-indigo-800"
                >
                  <Plus size={14} />
                  <span>Add Row</span>
                </button>
              </div>

              {submissionForm.data.fdps_workshops_attended.length === 0 ? (
                <div className="p-6 text-center text-xs text-gray-400 border border-dashed border-gray-200 dark:border-slate-800 rounded-2xl">
                  No FDPs entered for this month yet. Click "+ Add Row" above or use Auto-fill.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-gray-50 dark:bg-slate-800/60 text-gray-600 dark:text-gray-400 uppercase text-[10px] font-bold">
                      <tr>
                        <th className="p-2.5 w-12 text-center">S.No</th>
                        <th className="p-2.5">Program Title</th>
                        <th className="p-2.5">Role</th>
                        <th className="p-2.5">Organized By</th>
                        <th className="p-2.5">Dates (Start - End)</th>
                        <th className="p-2.5 w-20">Days</th>
                        <th className="p-2.5 w-10 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                      {submissionForm.data.fdps_workshops_attended.map((row, idx) => (
                        <tr key={idx} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/40">
                          <td className="p-2.5 text-center font-bold text-gray-400">{row.s_no || idx + 1}</td>
                          <td className="p-2.5">
                            <input
                              type="text"
                              value={row.title || ''}
                              onChange={(e) => updateTableRowCell('fdps_workshops_attended', idx, 'title', e.target.value)}
                              placeholder="e.g. AICTE 5-Day FDP on Deep Learning"
                              className="w-full bg-transparent border-b border-gray-200 dark:border-slate-700 py-1 focus:border-indigo-500 outline-none text-xs"
                            />
                          </td>
                          <td className="p-2.5">
                            <select
                              value={row.role || 'Participant'}
                              onChange={(e) => updateTableRowCell('fdps_workshops_attended', idx, 'role', e.target.value)}
                              className="bg-transparent border-b border-gray-200 dark:border-slate-700 py-1 focus:border-indigo-500 outline-none text-xs"
                            >
                              <option value="Participant">Participant</option>
                              <option value="Resource Person">Resource Person</option>
                              <option value="Coordinator">Coordinator</option>
                            </select>
                          </td>
                          <td className="p-2.5">
                            <input
                              type="text"
                              value={row.organization || ''}
                              onChange={(e) => updateTableRowCell('fdps_workshops_attended', idx, 'organization', e.target.value)}
                              placeholder="e.g. IIT Hyderabad"
                              className="w-full bg-transparent border-b border-gray-200 dark:border-slate-700 py-1 focus:border-indigo-500 outline-none text-xs"
                            />
                          </td>
                          <td className="p-2.5 flex items-center space-x-1">
                            <input
                              type="date"
                              value={row.start_date || ''}
                              onChange={(e) => updateTableRowCell('fdps_workshops_attended', idx, 'start_date', e.target.value)}
                              className="bg-transparent border-b border-gray-200 dark:border-slate-700 py-1 focus:border-indigo-500 outline-none text-xs"
                            />
                            <span className="text-gray-400">to</span>
                            <input
                              type="date"
                              value={row.end_date || ''}
                              onChange={(e) => updateTableRowCell('fdps_workshops_attended', idx, 'end_date', e.target.value)}
                              className="bg-transparent border-b border-gray-200 dark:border-slate-700 py-1 focus:border-indigo-500 outline-none text-xs"
                            />
                          </td>
                          <td className="p-2.5">
                            <input
                              type="number"
                              value={row.duration_days || 1}
                              onChange={(e) => updateTableRowCell('fdps_workshops_attended', idx, 'duration_days', parseInt(e.target.value) || 1)}
                              className="w-16 bg-transparent border-b border-gray-200 dark:border-slate-700 py-1 focus:border-indigo-500 outline-none text-xs text-center"
                            />
                          </td>
                          <td className="p-2.5 text-center">
                            <button
                              type="button"
                              onClick={() => removeTableRow('fdps_workshops_attended', idx)}
                              className="text-rose-500 hover:text-rose-700 p-1 rounded-lg"
                            >
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

            {/* Section 2: Events Organized */}
            <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-extrabold text-gray-900 dark:text-white flex items-center space-x-2">
                    <span className="w-6 h-6 rounded-lg bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xs">2</span>
                    <span>Events, Workshops & Guest Lectures Organized</span>
                  </h3>
                  <p className="text-xs text-gray-500">List seminars, workshops, hackathons, or expert talks organized by you.</p>
                </div>
                <button
                  type="button"
                  onClick={() => addTableRow('events_organized', { title: '', event_type: 'WORKSHOP', date: '', participants_count: 50, resource_person: '', outcome: '' })}
                  className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 rounded-xl text-xs font-bold flex items-center space-x-1 transition-all border border-indigo-200 dark:border-indigo-800"
                >
                  <Plus size={14} />
                  <span>Add Row</span>
                </button>
              </div>

              {submissionForm.data.events_organized.length === 0 ? (
                <div className="p-6 text-center text-xs text-gray-400 border border-dashed border-gray-200 dark:border-slate-800 rounded-2xl">
                  No events organized entered. Click "+ Add Row" above.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-gray-50 dark:bg-slate-800/60 text-gray-600 dark:text-gray-400 uppercase text-[10px] font-bold">
                      <tr>
                        <th className="p-2.5 w-12 text-center">S.No</th>
                        <th className="p-2.5">Event Name</th>
                        <th className="p-2.5">Type</th>
                        <th className="p-2.5">Date</th>
                        <th className="p-2.5">Participants</th>
                        <th className="p-2.5">Resource Person</th>
                        <th className="p-2.5">Outcome / Summary</th>
                        <th className="p-2.5 w-10 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                      {submissionForm.data.events_organized.map((row, idx) => (
                        <tr key={idx} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/40">
                          <td className="p-2.5 text-center font-bold text-gray-400">{row.s_no || idx + 1}</td>
                          <td className="p-2.5">
                            <input
                              type="text"
                              value={row.title || ''}
                              onChange={(e) => updateTableRowCell('events_organized', idx, 'title', e.target.value)}
                              placeholder="e.g. AI & Cloud Hands-on Bootcamp"
                              className="w-full bg-transparent border-b border-gray-200 dark:border-slate-700 py-1 focus:border-indigo-500 outline-none text-xs"
                            />
                          </td>
                          <td className="p-2.5">
                            <select
                              value={row.event_type || 'WORKSHOP'}
                              onChange={(e) => updateTableRowCell('events_organized', idx, 'event_type', e.target.value)}
                              className="bg-transparent border-b border-gray-200 dark:border-slate-700 py-1 focus:border-indigo-500 outline-none text-xs"
                            >
                              <option value="WORKSHOP">Workshop</option>
                              <option value="STUDENT EVENT">Student Event</option>
                              <option value="SEMINAR">Seminar</option>
                              <option value="GUEST LECTURE">Guest Lecture</option>
                              <option value="HACKATHON">Hackathon</option>
                            </select>
                          </td>
                          <td className="p-2.5">
                            <input
                              type="date"
                              value={row.date || ''}
                              onChange={(e) => updateTableRowCell('events_organized', idx, 'date', e.target.value)}
                              className="bg-transparent border-b border-gray-200 dark:border-slate-700 py-1 focus:border-indigo-500 outline-none text-xs"
                            />
                          </td>
                          <td className="p-2.5">
                            <input
                              type="number"
                              value={row.participants_count || 50}
                              onChange={(e) => updateTableRowCell('events_organized', idx, 'participants_count', parseInt(e.target.value) || 0)}
                              className="w-20 bg-transparent border-b border-gray-200 dark:border-slate-700 py-1 focus:border-indigo-500 outline-none text-xs"
                            />
                          </td>
                          <td className="p-2.5">
                            <input
                              type="text"
                              value={row.resource_person || ''}
                              onChange={(e) => updateTableRowCell('events_organized', idx, 'resource_person', e.target.value)}
                              placeholder="e.g. Industry Expert"
                              className="w-full bg-transparent border-b border-gray-200 dark:border-slate-700 py-1 focus:border-indigo-500 outline-none text-xs"
                            />
                          </td>
                          <td className="p-2.5">
                            <input
                              type="text"
                              value={row.outcome || ''}
                              onChange={(e) => updateTableRowCell('events_organized', idx, 'outcome', e.target.value)}
                              placeholder="e.g. 50 students certified"
                              className="w-full bg-transparent border-b border-gray-200 dark:border-slate-700 py-1 focus:border-indigo-500 outline-none text-xs"
                            />
                          </td>
                          <td className="p-2.5 text-center">
                            <button
                              type="button"
                              onClick={() => removeTableRow('events_organized', idx)}
                              className="text-rose-500 hover:text-rose-700 p-1 rounded-lg"
                            >
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

            {/* Section 3: Publications */}
            <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-extrabold text-gray-900 dark:text-white flex items-center space-x-2">
                    <span className="w-6 h-6 rounded-lg bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xs">3</span>
                    <span>Research Publications (Journals & Conferences)</span>
                  </h3>
                  <p className="text-xs text-gray-500">Papers published or presented during this month.</p>
                </div>
                <button
                  type="button"
                  onClick={() => addTableRow('journal_publications', { title: '', authors: currentUser.username, journal: '', volume_issue: '', indexing: 'SCOPUS', doi: '' })}
                  className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 rounded-xl text-xs font-bold flex items-center space-x-1 transition-all border border-indigo-200 dark:border-indigo-800"
                >
                  <Plus size={14} />
                  <span>Add Journal</span>
                </button>
              </div>

              {submissionForm.data.journal_publications.length === 0 ? (
                <div className="p-6 text-center text-xs text-gray-400 border border-dashed border-gray-200 dark:border-slate-800 rounded-2xl">
                  No publications recorded. Click "+ Add Journal" above.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-gray-50 dark:bg-slate-800/60 text-gray-600 dark:text-gray-400 uppercase text-[10px] font-bold">
                      <tr>
                        <th className="p-2.5 w-12 text-center">S.No</th>
                        <th className="p-2.5">Paper Title</th>
                        <th className="p-2.5">Authors</th>
                        <th className="p-2.5">Journal Name</th>
                        <th className="p-2.5">Vol / Issue / Pages</th>
                        <th className="p-2.5">Indexing</th>
                        <th className="p-2.5 w-10 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                      {submissionForm.data.journal_publications.map((row, idx) => (
                        <tr key={idx} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/40">
                          <td className="p-2.5 text-center font-bold text-gray-400">{row.s_no || idx + 1}</td>
                          <td className="p-2.5">
                            <input
                              type="text"
                              value={row.title || ''}
                              onChange={(e) => updateTableRowCell('journal_publications', idx, 'title', e.target.value)}
                              placeholder="Paper Title"
                              className="w-full bg-transparent border-b border-gray-200 dark:border-slate-700 py-1 focus:border-indigo-500 outline-none text-xs"
                            />
                          </td>
                          <td className="p-2.5">
                            <input
                              type="text"
                              value={row.authors || ''}
                              onChange={(e) => updateTableRowCell('journal_publications', idx, 'authors', e.target.value)}
                              placeholder="Authors"
                              className="w-full bg-transparent border-b border-gray-200 dark:border-slate-700 py-1 focus:border-indigo-500 outline-none text-xs"
                            />
                          </td>
                          <td className="p-2.5">
                            <input
                              type="text"
                              value={row.journal || ''}
                              onChange={(e) => updateTableRowCell('journal_publications', idx, 'journal', e.target.value)}
                              placeholder="Journal Name"
                              className="w-full bg-transparent border-b border-gray-200 dark:border-slate-700 py-1 focus:border-indigo-500 outline-none text-xs"
                            />
                          </td>
                          <td className="p-2.5">
                            <input
                              type="text"
                              value={row.volume_issue || ''}
                              onChange={(e) => updateTableRowCell('journal_publications', idx, 'volume_issue', e.target.value)}
                              placeholder="Vol. 12, pp. 1-10"
                              className="w-full bg-transparent border-b border-gray-200 dark:border-slate-700 py-1 focus:border-indigo-500 outline-none text-xs"
                            />
                          </td>
                          <td className="p-2.5">
                            <select
                              value={row.indexing || 'SCOPUS'}
                              onChange={(e) => updateTableRowCell('journal_publications', idx, 'indexing', e.target.value)}
                              className="bg-transparent border-b border-gray-200 dark:border-slate-700 py-1 focus:border-indigo-500 outline-none text-xs"
                            >
                              <option value="SCI">SCI</option>
                              <option value="SCOPUS">SCOPUS</option>
                              <option value="WOS">Web of Science</option>
                              <option value="UGC_CARE">UGC CARE</option>
                              <option value="OTHER">Other</option>
                            </select>
                          </td>
                          <td className="p-2.5 text-center">
                            <button
                              type="button"
                              onClick={() => removeTableRow('journal_publications', idx)}
                              className="text-rose-500 hover:text-rose-700 p-1 rounded-lg"
                            >
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

            {/* Section 4: Patents, Awards, Guest Lectures & Projects */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Patents */}
              <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-extrabold text-gray-900 dark:text-white flex items-center space-x-2">
                    <span className="w-6 h-6 rounded-lg bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xs">4</span>
                    <span>Patents Filed / Published</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => addTableRow('patents', { title: '', status: 'FILED', app_no: '', year: year })}
                    className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 rounded-xl text-xs font-bold flex items-center space-x-1"
                  >
                    <Plus size={13} />
                    <span>Add Patent</span>
                  </button>
                </div>

                {submissionForm.data.patents.map((p, idx) => (
                  <div key={idx} className="p-3 bg-gray-50 dark:bg-slate-800/50 rounded-2xl space-y-2 text-xs relative">
                    <button
                      type="button"
                      onClick={() => removeTableRow('patents', idx)}
                      className="absolute top-2 right-2 text-rose-500 hover:text-rose-700"
                    >
                      <Trash2 size={14} />
                    </button>
                    <input
                      type="text"
                      value={p.title || ''}
                      onChange={(e) => updateTableRowCell('patents', idx, 'title', e.target.value)}
                      placeholder="Patent Title"
                      className="w-full bg-transparent border-b border-gray-200 dark:border-slate-700 py-1 font-bold text-gray-800 dark:text-gray-200 outline-none text-xs"
                    />
                    <div className="flex items-center space-x-2">
                      <select
                        value={p.status || 'FILED'}
                        onChange={(e) => updateTableRowCell('patents', idx, 'status', e.target.value)}
                        className="bg-transparent border-b border-gray-200 dark:border-slate-700 py-1 outline-none text-xs"
                      >
                        <option value="FILED">Filed</option>
                        <option value="PUBLISHED">Published</option>
                        <option value="GRANTED">Granted</option>
                      </select>
                      <input
                        type="text"
                        value={p.app_no || ''}
                        onChange={(e) => updateTableRowCell('patents', idx, 'app_no', e.target.value)}
                        placeholder="Application No."
                        className="w-full bg-transparent border-b border-gray-200 dark:border-slate-700 py-1 outline-none text-xs"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Awards & Honors */}
              <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-extrabold text-gray-900 dark:text-white flex items-center space-x-2">
                    <span className="w-6 h-6 rounded-lg bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xs">5</span>
                    <span>Awards & Honors</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => addTableRow('awards_honors', { award_name: '', awarding_agency: '', date: '', details: '' })}
                    className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 rounded-xl text-xs font-bold flex items-center space-x-1"
                  >
                    <Plus size={13} />
                    <span>Add Award</span>
                  </button>
                </div>

                {submissionForm.data.awards_honors.map((a, idx) => (
                  <div key={idx} className="p-3 bg-gray-50 dark:bg-slate-800/50 rounded-2xl space-y-2 text-xs relative">
                    <button
                      type="button"
                      onClick={() => removeTableRow('awards_honors', idx)}
                      className="absolute top-2 right-2 text-rose-500 hover:text-rose-700"
                    >
                      <Trash2 size={14} />
                    </button>
                    <input
                      type="text"
                      value={a.award_name || ''}
                      onChange={(e) => updateTableRowCell('awards_honors', idx, 'award_name', e.target.value)}
                      placeholder="Award Name"
                      className="w-full bg-transparent border-b border-gray-200 dark:border-slate-700 py-1 font-bold text-gray-800 dark:text-gray-200 outline-none text-xs"
                    />
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={a.awarding_agency || ''}
                        onChange={(e) => updateTableRowCell('awards_honors', idx, 'awarding_agency', e.target.value)}
                        placeholder="Agency / Organization"
                        className="w-full bg-transparent border-b border-gray-200 dark:border-slate-700 py-1 outline-none text-xs"
                      />
                      <input
                        type="date"
                        value={a.date || ''}
                        onChange={(e) => updateTableRowCell('awards_honors', idx, 'date', e.target.value)}
                        className="bg-transparent border-b border-gray-200 dark:border-slate-700 py-1 outline-none text-xs"
                      />
                    </div>
                  </div>
                ))}
              </div>

            </div>

            {/* Additional Remarks */}
            <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-2">
              <label className="block text-sm font-bold text-gray-900 dark:text-white">
                Additional Comments / Departmental Highlights for {month}
              </label>
              <textarea
                rows="3"
                value={submissionForm.data.remarks || ''}
                onChange={(e) => setSubmissionForm(prev => ({ ...prev, data: { ...prev.data, remarks: e.target.value } }))}
                placeholder="Mention any additional duties, mentor-mentee meetings, lab upgrades, student counseling, etc."
                className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl p-3 text-xs focus:ring-2 focus:ring-indigo-500 outline-none text-gray-800 dark:text-gray-200"
              />
            </div>

            {/* Bottom Submit Action */}
            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-slate-800">
              <button
                type="button"
                disabled={savingSubmission}
                onClick={() => handleSaveSubmission('DRAFT')}
                className="px-5 py-2.5 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 text-gray-700 dark:text-gray-300 rounded-2xl text-xs font-bold transition-all"
              >
                Save as Draft
              </button>

              <button
                type="button"
                disabled={savingSubmission}
                onClick={() => handleSaveSubmission('SUBMITTED')}
                className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-2xl text-xs font-extrabold shadow-lg shadow-indigo-500/20 transition-all flex items-center space-x-2"
              >
                <Send size={16} />
                <span>{savingSubmission ? 'Submitting to HOD...' : 'Submit Monthly Report to HOD'}</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 📊 TAB 2: HOD TRACKER & INDIVIDUAL REVIEW */}
      {/* ========================================================================= */}
      {activeTab === 'hod_tracker' && (
        <div className="space-y-6">
          
          {/* Metrics Overview Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Department Faculty</span>
              <div className="flex items-baseline space-x-2 mt-1">
                <span className="text-3xl font-extrabold text-gray-900 dark:text-white">
                  {trackerData?.total_faculty || 0}
                </span>
                <span className="text-xs text-gray-500">Registered</span>
              </div>
            </div>

            <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-3xl p-5 shadow-sm">
              <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block">Submitted Reports</span>
              <div className="flex items-baseline space-x-2 mt-1">
                <span className="text-3xl font-extrabold text-emerald-700 dark:text-emerald-300">
                  {trackerData?.submitted_count || 0}
                </span>
                <span className="text-xs font-bold text-emerald-600">
                  ({trackerData?.completion_rate || 0}%)
                </span>
              </div>
            </div>

            <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-3xl p-5 shadow-sm">
              <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider block">Pending Submissions</span>
              <div className="flex items-baseline space-x-2 mt-1">
                <span className="text-3xl font-extrabold text-amber-700 dark:text-amber-300">
                  {trackerData?.pending_count || 0}
                </span>
                <span className="text-xs text-amber-600">Awaiting faculty</span>
              </div>
            </div>

            <div className="bg-gradient-to-tr from-indigo-600 to-purple-600 text-white rounded-3xl p-5 shadow-md flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-200">1-Click Consolidation</span>
                <h3 className="text-sm font-bold mt-0.5">Auto-Merge Approved Submissions</h3>
              </div>
              <button
                disabled={consolidating}
                onClick={handleAutoConsolidate}
                className="mt-3 w-full bg-white text-indigo-700 hover:bg-indigo-50 font-extrabold text-xs py-2 px-3 rounded-xl shadow transition-all flex items-center justify-center space-x-1 cursor-pointer"
              >
                <Sparkles size={14} className="text-purple-600" />
                <span>{consolidating ? 'Compiling Master...' : '⚡ Auto-Merge ONLY Approved'}</span>
              </button>
            </div>
          </div>

          {/* Submission Tracker Table */}
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-extrabold text-gray-900 dark:text-white flex items-center space-x-2">
                  <span>Faculty Monthly Submissions Tracker</span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                    {month} {year}
                  </span>
                </h2>
                <p className="text-xs text-gray-500">Monitor which faculties submitted and inspect individual activity details before generating the master report.</p>
              </div>

              {/* Filters */}
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-2.5 text-gray-400" />
                  <input
                    type="text"
                    value={searchFaculty}
                    onChange={(e) => setSearchFaculty(e.target.value)}
                    placeholder="Search faculty..."
                    className="pl-8 pr-3 py-1.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-1.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs outline-none"
                >
                  <option value="ALL">All Status</option>
                  <option value="SUBMITTED">Submitted</option>
                  <option value="PENDING">Pending</option>
                  <option value="DRAFT">Draft</option>
                </select>

                <button
                  onClick={loadTrackerData}
                  className="p-1.5 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 rounded-xl text-gray-600 dark:text-gray-300"
                  title="Refresh status"
                >
                  <RefreshCw size={14} />
                </button>
              </div>
            </div>

            {/* Tracker Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-gray-50 dark:bg-slate-800/60 text-gray-600 dark:text-gray-400 uppercase text-[10px] font-bold">
                  <tr>
                    <th className="p-3">Faculty Name & Designation</th>
                    <th className="p-3">Department</th>
                    <th className="p-3 text-center">Status</th>
                    <th className="p-3">Activities Breakdown</th>
                    <th className="p-3">Submission Timestamp</th>
                    <th className="p-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                  {filteredFaculties.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="p-8 text-center text-gray-400 text-xs">
                        No faculty members match the filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredFaculties.map((fac, idx) => (
                      <tr key={idx} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/40">
                        <td className="p-3">
                          <div className="font-bold text-gray-900 dark:text-white text-xs">{fac.faculty_name}</div>
                          <div className="text-[10px] text-gray-400">{fac.email} • {fac.designation}</div>
                        </td>
                        <td className="p-3 text-gray-600 dark:text-gray-300">{fac.department}</td>
                        <td className="p-3 text-center">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                            fac.status === 'APPROVED'
                              ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300'
                              : fac.status === 'SUBMITTED'
                              ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-300'
                              : fac.status === 'REJECTED'
                              ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-300'
                              : fac.status === 'DRAFT'
                              ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-300'
                              : 'bg-gray-100 dark:bg-slate-800 text-gray-500 border border-gray-300'
                          }`}>
                            {fac.status === 'APPROVED' ? '✅ APPROVED' : fac.status === 'SUBMITTED' ? '📩 SUBMITTED' : fac.status === 'REJECTED' ? '⚠️ REVISION' : fac.status}
                          </span>
                        </td>
                        <td className="p-3">
                          {fac.status === 'SUBMITTED' || fac.status === 'DRAFT' ? (
                            <div className="flex flex-wrap gap-1">
                              {fac.counts.fdps > 0 && <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 rounded text-[10px] font-bold">{fac.counts.fdps} FDPs</span>}
                              {fac.counts.events > 0 && <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 rounded text-[10px] font-bold">{fac.counts.events} Events</span>}
                              {fac.counts.publications > 0 && <span className="px-1.5 py-0.5 bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300 rounded text-[10px] font-bold">{fac.counts.publications} Pubs</span>}
                              {fac.counts.patents > 0 && <span className="px-1.5 py-0.5 bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 rounded text-[10px] font-bold">{fac.counts.patents} Patents</span>}
                              {fac.counts.awards > 0 && <span className="px-1.5 py-0.5 bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300 rounded text-[10px] font-bold">{fac.counts.awards} Awards</span>}
                            </div>
                          ) : (
                            <span className="text-gray-400 italic text-[11px]">No return submitted</span>
                          )}
                        </td>
                        <td className="p-3 text-gray-500 text-xs">
                          {fac.submitted_at || '—'}
                        </td>
                        <td className="p-3 text-center">
                          {fac.submission_data ? (
                            <button
                              type="button"
                              onClick={() => setSelectedPreviewFaculty(fac)}
                              className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 rounded-xl text-xs font-bold transition-all flex items-center space-x-1 mx-auto"
                            >
                              <Eye size={13} />
                              <span>View Details</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => alert(`Reminder notification sent to ${fac.faculty_name} (${fac.email})`)}
                              className="px-2.5 py-1 bg-gray-100 dark:bg-slate-800 text-gray-500 hover:bg-gray-200 rounded-xl text-[11px] font-semibold"
                            >
                              Send Reminder
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Bottom Actions Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-gray-100 dark:border-slate-800">
              <div className="text-xs text-gray-500">
                Showing {filteredFaculties.length} faculties. Ready to compile into a single institutional report?
              </div>

              <button
                disabled={consolidating}
                onClick={handleAutoConsolidate}
                className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl text-xs font-extrabold shadow-md shadow-indigo-500/20 transition-all flex items-center justify-center space-x-2"
              >
                <Sparkles size={15} />
                <span>{consolidating ? 'Compiling all submissions...' : '⚡ Generate 1-Click Consolidated Report'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 📄 TAB 3: CONSOLIDATED MASTER REPORT VIEWER & EXPORT */}
      {/* ========================================================================= */}
      {activeTab === 'consolidated_view' && (
        <div className="space-y-6">
          
          {/* Action Header */}
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
            <div>
              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300">
                  Consolidated & Merged
                </span>
                <span className="text-xs text-gray-500">
                  {consolidatedData?.total_submissions_merged || 0} Faculty Reports Auto-Compiled
                </span>
              </div>
              <h2 className="text-xl font-extrabold text-gray-900 dark:text-white mt-1">
                Consolidated Institutional Report: {month} {year}
              </h2>
              <p className="text-xs text-gray-500">
                All individual faculty submissions are compiled below in official 12-section IQAC format with faculty names attributed.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => {
                  if (!printRef.current) return;
                  const header = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
                  <head><meta charset='utf-8'><title>Monthly Consolidated IQAC Report</title>
                  <style>
                    body { font-family: 'Calibri', 'Arial', sans-serif; font-size: 11pt; color: #000; }
                    table { border-collapse: collapse; width: 100%; margin-bottom: 20px; }
                    th, td { border: 1px solid #000; padding: 6px 8px; font-size: 10pt; text-align: left; }
                    th { background-color: #f2f2f2; font-weight: bold; }
                    .header-title { text-align: center; font-weight: bold; font-size: 14pt; }
                    .sub-title { text-align: center; font-size: 10pt; margin-bottom: 15px; }
                    .section-heading { font-weight: bold; font-size: 11pt; margin-top: 15px; margin-bottom: 5px; }
                  </style></head><body>`;
                  const footer = `</body></html>`;
                  const sourceHTML = header + printRef.current.innerHTML + footer;
                  const source = 'data:application/vnd.ms-word;charset=utf-8,' + encodeURIComponent(sourceHTML);
                  const fileDownload = document.createElement("a");
                  document.body.appendChild(fileDownload);
                  fileDownload.href = source;
                  fileDownload.download = `Consolidated_IQAC_Report_${month}_${year}_${department.slice(0, 15)}.doc`;
                  fileDownload.click();
                  document.body.removeChild(fileDownload);
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 shadow-sm"
              >
                <FileText size={15} />
                <span>📝 Word (.doc)</span>
              </button>

              <button
                onClick={() => window.open(`${API_BASE_URL}/faculty/monthly-submission/export-excel/?department=${encodeURIComponent(department)}&month=${month}&year=${year}`, '_blank')}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 shadow-sm"
              >
                <FileSpreadsheet size={15} />
                <span>📥 Excel (.xlsx)</span>
              </button>

              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 shadow-sm"
              >
                <Printer size={15} />
                <span>🖨️ PDF / Print</span>
              </button>

              <a
                href={`/iqac-report?department=${encodeURIComponent(department)}&month=${month}&year=${year}`}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 shadow-sm"
              >
                <ExternalLink size={15} />
                <span>Open in 12-Section IQAC Editor</span>
              </a>

              <button
                onClick={handleAutoConsolidate}
                className="p-2 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 rounded-xl text-gray-700 dark:text-gray-300"
                title="Re-run Auto Consolidation"
              >
                <RefreshCw size={15} />
              </button>
            </div>

          </div>

          {consolidatedSuccessMsg && (
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 rounded-2xl text-emerald-800 dark:text-emerald-200 text-sm font-semibold flex items-center space-x-2 print:hidden">
              <CheckCircle2 size={18} className="text-emerald-500" />
              <span>{consolidatedSuccessMsg}</span>
            </div>
          )}

          {/* Institutional Printable Paper Sheet */}
          <div ref={printRef} className="bg-white text-gray-900 border border-gray-200 dark:border-slate-800 rounded-3xl p-8 sm:p-12 shadow-sm space-y-8 font-serif print:p-0 print:border-none print:shadow-none print:m-0">
            
            {/* Official Institutional Header */}
            <div className="text-center border-b-2 border-gray-800 pb-4 space-y-1">
              <h1 className="text-xl sm:text-2xl font-black tracking-wide uppercase text-gray-900 font-sans">
                AVN INSTITUTE OF ENGINEERING & TECHNOLOGY
              </h1>
              <p className="text-xs text-gray-600 font-sans font-medium">
                Accredited by NAAC & NBA | An Autonomous Institute Affiliated to JNTU Hyderabad
              </p>
              <div className="inline-block bg-gray-900 text-white px-4 py-1 rounded-md text-xs font-bold uppercase tracking-wider font-sans mt-2">
                CONSOLIDATED MONTHLY REPORT - DEPARTMENT OF {department.toUpperCase()} ({month.toUpperCase()} {year})
              </div>
            </div>

            {/* Contributing Faculty Summary */}
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl font-sans text-xs flex flex-col md:flex-row md:items-center justify-between gap-2">
              <div>
                <span className="font-bold text-gray-800">Faculty Submissions Compiled:</span>{' '}
                <span className="text-gray-600">
                  {(consolidatedData?.submitting_faculties || []).map(f => f.name).join(', ') || 'Department Faculty Submissions'}
                </span>
              </div>
              <div className="text-gray-500 font-semibold text-right">
                Academic Year: {academicYear}
              </div>
            </div>

            {/* ★ MASTER CONSOLIDATED FACULTY MATRIX TABLE */}
            <div className="space-y-3">
              <div className="flex items-center justify-between bg-gray-900 text-white p-2.5 rounded-t-lg font-sans">
                <h2 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider flex items-center space-x-2">
                  <span>★ MASTER FACULTY CONSOLIDATED MONTHLY ACTIVITY MATRIX</span>
                </h2>
                <span className="text-[10px] font-bold bg-indigo-600 px-2.5 py-0.5 rounded">
                  {month} {year}
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse border border-gray-300 font-sans">
                  <thead>
                    <tr className="bg-gray-100 text-gray-800 font-bold">
                      <th className="border border-gray-300 p-2 w-10 text-center">S.No</th>
                      <th className="border border-gray-300 p-2 w-36">Faculty Name</th>
                      <th className="border border-gray-300 p-2">Classes Conducted</th>
                      <th className="border border-gray-300 p-2">Student Guidance</th>
                      <th className="border border-gray-300 p-2">Research & Pubs</th>
                      <th className="border border-gray-300 p-2">FDP / Workshops</th>
                      <th className="border border-gray-300 p-2">Other Responsibilities</th>
                      <th className="border border-gray-300 p-2 text-center w-24">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(consolidatedData?.faculty_matrix || []).length === 0 ? (
                      <tr>
                        <td colSpan="8" className="border border-gray-300 p-4 text-center text-gray-400 italic">
                          Click "⚡ Generate 1-Click Consolidated Report" to compile all faculty matrix data.
                        </td>
                      </tr>
                    ) : (
                      consolidatedData.faculty_matrix.map((row, idx) => (
                        <tr key={idx} className={row.status === 'Submitted' ? 'hover:bg-gray-50' : 'bg-rose-50/20'}>
                          <td className="border border-gray-300 p-2 text-center font-bold text-gray-500">{row.s_no || idx + 1}</td>
                          <td className="border border-gray-300 p-2 font-bold text-gray-900">
                            <div>{row.faculty_name}</div>
                            <div className="text-[10px] text-gray-500 font-normal">{row.designation}</div>
                          </td>
                          <td className="border border-gray-300 p-2 text-gray-700">{row.classes_conducted}</td>
                          <td className="border border-gray-300 p-2 text-gray-700">{row.student_guidance}</td>
                          <td className="border border-gray-300 p-2 font-medium text-purple-900">{row.research}</td>
                          <td className="border border-gray-300 p-2 font-medium text-blue-900">{row.fdp_workshops}</td>
                          <td className="border border-gray-300 p-2 text-gray-700">{row.other_responsibilities}</td>
                          <td className="border border-gray-300 p-2 text-center">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              row.status === 'Submitted' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                            }`}>
                              {row.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Section 1: Student Technical & Co-Curricular Events */}
            <div className="space-y-3">
              <h2 className="text-sm font-bold uppercase tracking-wider bg-gray-100 p-2 border-l-4 border-indigo-600 font-sans">
                1. Student Technical & Co-Curricular Events Organized
              </h2>

              <table className="w-full text-xs border-collapse border border-gray-300 font-sans">
                <thead>
                  <tr className="bg-gray-100 text-gray-700">
                    <th className="border border-gray-300 p-2 w-10 text-center">S.No</th>
                    <th className="border border-gray-300 p-2">Event / Activity Name</th>
                    <th className="border border-gray-300 p-2">Faculty In-charge</th>
                    <th className="border border-gray-300 p-2">Target Audience / Participants</th>
                    <th className="border border-gray-300 p-2">Resource Person</th>
                    <th className="border border-gray-300 p-2">Date</th>
                    <th className="border border-gray-300 p-2">Outcome</th>
                  </tr>
                </thead>
                <tbody>
                  {(consolidatedData?.sections?.['1_student_events'] || []).length === 0 ? (
                    <tr>
                      <td colSpan="7" className="border border-gray-300 p-4 text-center text-gray-400 italic">
                        Nil activities reported for this month.
                      </td>
                    </tr>
                  ) : (
                    consolidatedData.sections['1_student_events'].map((row, idx) => (
                      <tr key={idx}>
                        <td className="border border-gray-300 p-2 text-center">{row.s_no || idx + 1}</td>
                        <td className="border border-gray-300 p-2 font-semibold">{row.activity_name}</td>
                        <td className="border border-gray-300 p-2 text-indigo-700 font-medium">{row.faculty_incharge}</td>
                        <td className="border border-gray-300 p-2">{row.target_audience}</td>
                        <td className="border border-gray-300 p-2">{row.resource_person}</td>
                        <td className="border border-gray-300 p-2">{row.date}</td>
                        <td className="border border-gray-300 p-2">{row.outcome}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Section 2: Faculty Events Organized */}
            <div className="space-y-3">
              <h2 className="text-sm font-bold uppercase tracking-wider bg-gray-100 p-2 border-l-4 border-indigo-600 font-sans">
                2. Faculty Development Programs / Workshops Organized
              </h2>
              <table className="w-full text-xs border-collapse border border-gray-300 font-sans">
                <thead>
                  <tr className="bg-gray-100 text-gray-700">
                    <th className="border border-gray-300 p-2 w-10 text-center">S.No</th>
                    <th className="border border-gray-300 p-2">Program Title</th>
                    <th className="border border-gray-300 p-2">Coordinator</th>
                    <th className="border border-gray-300 p-2">Target Audience</th>
                    <th className="border border-gray-300 p-2">Resource Person</th>
                    <th className="border border-gray-300 p-2">Date</th>
                    <th className="border border-gray-300 p-2">Outcome</th>
                  </tr>
                </thead>
                <tbody>
                  {(consolidatedData?.sections?.['2_faculty_events'] || []).length === 0 ? (
                    <tr>
                      <td colSpan="7" className="border border-gray-300 p-4 text-center text-gray-400 italic">
                        Nil activities reported for this month.
                      </td>
                    </tr>
                  ) : (
                    consolidatedData.sections['2_faculty_events'].map((row, idx) => (
                      <tr key={idx}>
                        <td className="border border-gray-300 p-2 text-center">{row.s_no || idx + 1}</td>
                        <td className="border border-gray-300 p-2 font-semibold">{row.activity_name}</td>
                        <td className="border border-gray-300 p-2 text-indigo-700 font-medium">{row.faculty_incharge}</td>
                        <td className="border border-gray-300 p-2">{row.target_audience}</td>
                        <td className="border border-gray-300 p-2">{row.resource_person}</td>
                        <td className="border border-gray-300 p-2">{row.date}</td>
                        <td className="border border-gray-300 p-2">{row.outcome}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Section 3: FDPs Attended by Faculty */}
            <div className="space-y-3">
              <h2 className="text-sm font-bold uppercase tracking-wider bg-gray-100 p-2 border-l-4 border-indigo-600 font-sans">
                3. FDPs, STTPs, Conferences & Workshops Attended by Faculty
              </h2>
              <table className="w-full text-xs border-collapse border border-gray-300 font-sans">
                <thead>
                  <tr className="bg-gray-100 text-gray-700">
                    <th className="border border-gray-300 p-2 w-10 text-center">S.No</th>
                    <th className="border border-gray-300 p-2">Faculty Name</th>
                    <th className="border border-gray-300 p-2">Program Title</th>
                    <th className="border border-gray-300 p-2">Role</th>
                    <th className="border border-gray-300 p-2">Organizing Institution</th>
                    <th className="border border-gray-300 p-2">Duration & Dates</th>
                    <th className="border border-gray-300 p-2 text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {(consolidatedData?.sections?.['6_faculty_achievements']?.['g_workshops_attended'] || []).length === 0 ? (
                    <tr>
                      <td colSpan="7" className="border border-gray-300 p-4 text-center text-gray-400 italic">
                        Nil activities reported for this month.
                      </td>
                    </tr>
                  ) : (
                    consolidatedData.sections['6_faculty_achievements']['g_workshops_attended'].map((row, idx) => (
                      <tr key={idx}>
                        <td className="border border-gray-300 p-2 text-center">{row.s_no || idx + 1}</td>
                        <td className="border border-gray-300 p-2 text-indigo-700 font-bold">{row.faculty_name}</td>
                        <td className="border border-gray-300 p-2 font-semibold">{row.program_title}</td>
                        <td className="border border-gray-300 p-2">{row.type_role}</td>
                        <td className="border border-gray-300 p-2">{row.organized_by}</td>
                        <td className="border border-gray-300 p-2">{row.dates_duration}</td>
                        <td className="border border-gray-300 p-2 text-center text-emerald-700 font-semibold">{row.status_proof}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Section 4: Journal Publications */}
            <div className="space-y-3">
              <h2 className="text-sm font-bold uppercase tracking-wider bg-gray-100 p-2 border-l-4 border-indigo-600 font-sans">
                4. Research Journal Publications
              </h2>
              <table className="w-full text-xs border-collapse border border-gray-300 font-sans">
                <thead>
                  <tr className="bg-gray-100 text-gray-700">
                    <th className="border border-gray-300 p-2 w-10 text-center">S.No</th>
                    <th className="border border-gray-300 p-2">Authors</th>
                    <th className="border border-gray-300 p-2">Paper Title</th>
                    <th className="border border-gray-300 p-2">Journal Name</th>
                    <th className="border border-gray-300 p-2">Vol / Issue / Pages</th>
                    <th className="border border-gray-300 p-2 text-center">Indexing</th>
                  </tr>
                </thead>
                <tbody>
                  {(consolidatedData?.sections?.['6_faculty_achievements']?.['a_journal_publications'] || []).length === 0 ? (
                    <tr>
                      <td colSpan="6" className="border border-gray-300 p-4 text-center text-gray-400 italic">
                        Nil publications reported for this month.
                      </td>
                    </tr>
                  ) : (
                    consolidatedData.sections['6_faculty_achievements']['a_journal_publications'].map((row, idx) => (
                      <tr key={idx}>
                        <td className="border border-gray-300 p-2 text-center">{row.s_no || idx + 1}</td>
                        <td className="border border-gray-300 p-2 font-semibold text-indigo-700">{row.authors}</td>
                        <td className="border border-gray-300 p-2 font-bold">{row.title}</td>
                        <td className="border border-gray-300 p-2 italic">{row.journal}</td>
                        <td className="border border-gray-300 p-2">{row.volume_issue}</td>
                        <td className="border border-gray-300 p-2 text-center font-bold text-purple-700">{row.indexing}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Section 5: Patents */}
            <div className="space-y-3">
              <h2 className="text-sm font-bold uppercase tracking-wider bg-gray-100 p-2 border-l-4 border-indigo-600 font-sans">
                5. Patents Filed / Published / Granted
              </h2>
              <table className="w-full text-xs border-collapse border border-gray-300 font-sans">
                <thead>
                  <tr className="bg-gray-100 text-gray-700">
                    <th className="border border-gray-300 p-2 w-10 text-center">S.No</th>
                    <th className="border border-gray-300 p-2">Inventors</th>
                    <th className="border border-gray-300 p-2">Patent Title</th>
                    <th className="border border-gray-300 p-2">Filing Agency</th>
                    <th className="border border-gray-300 p-2">Application No & Year</th>
                    <th className="border border-gray-300 p-2 text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {(consolidatedData?.sections?.['6_faculty_achievements']?.['c_patents'] || []).length === 0 ? (
                    <tr>
                      <td colSpan="6" className="border border-gray-300 p-4 text-center text-gray-400 italic">
                        Nil patents reported for this month.
                      </td>
                    </tr>
                  ) : (
                    consolidatedData.sections['6_faculty_achievements']['c_patents'].map((row, idx) => (
                      <tr key={idx}>
                        <td className="border border-gray-300 p-2 text-center">{row.s_no || idx + 1}</td>
                        <td className="border border-gray-300 p-2 text-indigo-700 font-bold">{row.authors}</td>
                        <td className="border border-gray-300 p-2 font-semibold">{row.title}</td>
                        <td className="border border-gray-300 p-2">{row.agency}</td>
                        <td className="border border-gray-300 p-2">{row.filing_no_year}</td>
                        <td className="border border-gray-300 p-2 text-center font-bold text-amber-700">{row.status}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Section 6: Honors & Awards */}
            <div className="space-y-3">
              <h2 className="text-sm font-bold uppercase tracking-wider bg-gray-100 p-2 border-l-4 border-indigo-600 font-sans">
                6. Faculty Honors & Recognitions
              </h2>
              <table className="w-full text-xs border-collapse border border-gray-300 font-sans">
                <thead>
                  <tr className="bg-gray-100 text-gray-700">
                    <th className="border border-gray-300 p-2 w-10 text-center">S.No</th>
                    <th className="border border-gray-300 p-2">Faculty Name</th>
                    <th className="border border-gray-300 p-2">Award / Honor Title</th>
                    <th className="border border-gray-300 p-2">Awarding Agency</th>
                    <th className="border border-gray-300 p-2">Date</th>
                    <th className="border border-gray-300 p-2">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {(consolidatedData?.sections?.['6_faculty_achievements']?.['k_awards'] || []).length === 0 ? (
                    <tr>
                      <td colSpan="6" className="border border-gray-300 p-4 text-center text-gray-400 italic">
                        Nil awards reported for this month.
                      </td>
                    </tr>
                  ) : (
                    consolidatedData.sections['6_faculty_achievements']['k_awards'].map((row, idx) => (
                      <tr key={idx}>
                        <td className="border border-gray-300 p-2 text-center">{row.s_no || idx + 1}</td>
                        <td className="border border-gray-300 p-2 text-indigo-700 font-bold">{row.faculty_name}</td>
                        <td className="border border-gray-300 p-2 font-semibold">{row.award_name}</td>
                        <td className="border border-gray-300 p-2">{row.awarding_agency}</td>
                        <td className="border border-gray-300 p-2">{row.date}</td>
                        <td className="border border-gray-300 p-2">{row.details}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Official Signatures Block */}
            <div className="pt-16 grid grid-cols-2 gap-8 text-center font-sans font-bold text-xs">
              <div>
                <div className="border-t border-gray-800 w-48 mx-auto pt-2">
                  DEPARTMENT IQAC COORDINATOR
                </div>
              </div>
              <div>
                <div className="border-t border-gray-800 w-48 mx-auto pt-2">
                  HEAD OF THE DEPARTMENT (HOD)
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 👁️ INDIVIDUAL FACULTY PREVIEW & AUDIT INSPECTION MODAL (FOR HOD) */}
      {/* ========================================================================= */}
      {selectedPreviewFaculty && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-5 shadow-2xl animate-in fade-in">
            
            {/* Header */}
            <div className="flex items-start justify-between border-b border-gray-100 dark:border-slate-800 pb-4">
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 uppercase tracking-wider">
                  Verified Faculty Record & Audit Inspector
                </span>
                <h3 className="text-lg sm:text-xl font-black text-gray-900 dark:text-white mt-1">
                  {selectedPreviewFaculty.faculty_name}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {selectedPreviewFaculty.email} • {selectedPreviewFaculty.designation || 'Faculty'}
                </p>
              </div>
              <button
                onClick={() => setSelectedPreviewFaculty(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-white text-xs font-bold px-3 py-1.5 bg-gray-100 dark:bg-slate-800 rounded-xl cursor-pointer"
              >
                ✕ Close
              </button>
            </div>

            {/* 📋 Comprehensive Audit & Metadata Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-gray-50 dark:bg-slate-800/60 p-4 rounded-2xl text-[11px] border border-gray-200 dark:border-slate-700">
              <div>
                <span className="text-gray-400 uppercase font-bold text-[9px] block">Current Status</span>
                <span className={`inline-block mt-0.5 px-2 py-0.5 rounded-md font-black text-[10px] ${
                  selectedPreviewFaculty.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' :
                  selectedPreviewFaculty.status === 'SUBMITTED' ? 'bg-blue-100 text-blue-800' :
                  selectedPreviewFaculty.status === 'REJECTED' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {selectedPreviewFaculty.status}
                </span>
              </div>
              <div>
                <span className="text-gray-400 uppercase font-bold text-[9px] block">Department</span>
                <span className="font-bold text-gray-800 dark:text-gray-200 mt-0.5 block truncate">
                  {selectedPreviewFaculty.department}
                </span>
              </div>
              <div>
                <span className="text-gray-400 uppercase font-bold text-[9px] block">Created Date & Time</span>
                <span className="font-semibold text-gray-700 dark:text-gray-300 mt-0.5 block font-mono">
                  {selectedPreviewFaculty.created_at || selectedPreviewFaculty.submitted_at || '—'}
                </span>
              </div>
              <div>
                <span className="text-gray-400 uppercase font-bold text-[9px] block">Last Modified / Submitted</span>
                <span className="font-semibold text-gray-700 dark:text-gray-300 mt-0.5 block font-mono">
                  {selectedPreviewFaculty.submitted_at || '—'}
                </span>
              </div>
            </div>

            {/* Detailed Record Data */}
            <div className="space-y-4 text-xs">
              
              {/* 1. FDPs / Workshops */}
              <div className="border border-gray-100 dark:border-slate-800 rounded-2xl p-3.5 bg-white dark:bg-slate-900 shadow-xs space-y-2">
                <div className="flex items-center justify-between font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-slate-800 pb-1.5">
                  <span className="flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-md bg-blue-100 dark:bg-blue-950 text-blue-600 flex items-center justify-center text-[10px]">1</span>
                    <span>Workshops, FDPs & STTPs Attended ({selectedPreviewFaculty.counts?.fdps || 0})</span>
                  </span>
                </div>
                {(selectedPreviewFaculty.submission_data?.fdps_workshops_attended || []).length === 0 ? (
                  <p className="text-gray-400 italic text-[11px]">No FDP records submitted for this month.</p>
                ) : (
                  <div className="space-y-2">
                    {selectedPreviewFaculty.submission_data.fdps_workshops_attended.map((f, i) => (
                      <div key={i} className="p-2.5 bg-blue-50/50 dark:bg-blue-950/20 rounded-xl border border-blue-100 dark:border-blue-900/40 text-[11px] space-y-1">
                        <div className="font-bold text-blue-900 dark:text-blue-300">{f.title || f.program_name || 'FDP Title'}</div>
                        <div className="text-gray-600 dark:text-gray-400 flex flex-wrap gap-2 text-[10px]">
                          <span>🏢 Organized by: <b>{f.organization || f.organized_by || '-'}</b></span>
                          <span>⏱️ Duration: <b>{f.duration || f.start_date || '-'}</b></span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 2. Events Organized */}
              <div className="border border-gray-100 dark:border-slate-800 rounded-2xl p-3.5 bg-white dark:bg-slate-900 shadow-xs space-y-2">
                <div className="flex items-center justify-between font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-slate-800 pb-1.5">
                  <span className="flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-md bg-indigo-100 dark:bg-indigo-950 text-indigo-600 flex items-center justify-center text-[10px]">2</span>
                    <span>Programmes & Events Organized ({selectedPreviewFaculty.counts?.events || 0})</span>
                  </span>
                </div>
                {(selectedPreviewFaculty.submission_data?.events_organized || []).length === 0 ? (
                  <p className="text-gray-400 italic text-[11px]">No event records submitted for this month.</p>
                ) : (
                  <div className="space-y-2">
                    {selectedPreviewFaculty.submission_data.events_organized.map((e, i) => (
                      <div key={i} className="p-2.5 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-xl border border-indigo-100 dark:border-indigo-900/40 text-[11px] space-y-1">
                        <div className="font-bold text-indigo-900 dark:text-indigo-300">{e.title || e.name || 'Event Title'}</div>
                        <div className="text-gray-600 dark:text-gray-400 flex flex-wrap gap-2 text-[10px]">
                          <span>🏷️ Type: <b>{e.event_type || e.level || 'Department'}</b></span>
                          <span>📅 Date: <b>{e.date || e.duration || '-'}</b></span>
                          <span>👥 Participants: <b>{e.participants || e.target_students || '-'}</b></span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 3. Publications & Patents */}
              <div className="border border-gray-100 dark:border-slate-800 rounded-2xl p-3.5 bg-white dark:bg-slate-900 shadow-xs space-y-2">
                <div className="flex items-center justify-between font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-slate-800 pb-1.5">
                  <span className="flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-md bg-purple-100 dark:bg-purple-950 text-purple-600 flex items-center justify-center text-[10px]">3</span>
                    <span>Research Publications & Patents ({selectedPreviewFaculty.counts?.publications || 0} Pubs, {selectedPreviewFaculty.counts?.patents || 0} Patents)</span>
                  </span>
                </div>
                {((selectedPreviewFaculty.submission_data?.journal_publications || []).length === 0 && 
                  (selectedPreviewFaculty.submission_data?.conference_publications || []).length === 0 && 
                  (selectedPreviewFaculty.submission_data?.patents || []).length === 0) ? (
                  <p className="text-gray-400 italic text-[11px]">No research publications or patent records submitted.</p>
                ) : (
                  <div className="space-y-2">
                    {(selectedPreviewFaculty.submission_data?.journal_publications || []).map((pub, i) => (
                      <div key={`pub-${i}`} className="p-2.5 bg-purple-50/50 dark:bg-purple-950/20 rounded-xl border border-purple-100 dark:border-purple-900/40 text-[11px]">
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-200 text-purple-800 mr-2">JOURNAL</span>
                        <span className="font-bold text-gray-900 dark:text-white">{pub.title}</span>
                        <div className="text-[10px] text-gray-500 mt-1">
                          Journal: <b>{pub.journal}</b> • Indexing: <b>{pub.indexing || 'Scopus'}</b> • Vol/Issue: {pub.volume_issue || '-'}
                        </div>
                      </div>
                    ))}
                    {(selectedPreviewFaculty.submission_data?.patents || []).map((pat, i) => (
                      <div key={`pat-${i}`} className="p-2.5 bg-amber-50/50 dark:bg-amber-950/20 rounded-xl border border-amber-100 dark:border-amber-900/40 text-[11px]">
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-200 text-amber-800 mr-2">PATENT</span>
                        <span className="font-bold text-gray-900 dark:text-white">{pat.title}</span>
                        <div className="text-[10px] text-gray-500 mt-1">
                          Agency: <b>{pat.agency || 'Indian Patent Office'}</b> • App No: <b>{pat.filing_no_year || pat.app_no || '-'}</b> • Status: <b className="text-amber-700">{pat.status || 'Published'}</b>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 4. Remarks & Verification Notes */}
              {selectedPreviewFaculty.submission_data?.remarks && (
                <div className="p-3.5 bg-gray-50 dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700">
                  <span className="font-bold text-gray-800 dark:text-gray-200 block mb-1 text-[11px]">
                    📝 Faculty Submission Comments / Notes:
                  </span>
                  <p className="text-gray-600 dark:text-gray-300 text-xs leading-relaxed">
                    {selectedPreviewFaculty.submission_data.remarks}
                  </p>
                </div>
              )}
            </div>

            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-gray-100 dark:border-slate-800">
              <div className="flex items-center space-x-2 w-full sm:w-auto">
                {selectedPreviewFaculty.submission_id && (
                  <>
                    <button
                      onClick={() => handleHODAction(selectedPreviewFaculty.submission_id, 'APPROVE')}
                      className="flex-1 sm:flex-none px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center space-x-1.5 cursor-pointer"
                    >
                      <CheckCircle2 size={14} />
                      <span>Approve & Lock</span>
                    </button>
                    <button
                      onClick={() => {
                        const reason = window.prompt("Enter revision instructions for faculty:", "Please double check paper indexing and update student count.");
                        if (reason !== null) {
                          handleHODAction(selectedPreviewFaculty.submission_id, 'REJECT', reason);
                        }
                      }}
                      className="flex-1 sm:flex-none px-3.5 py-2 bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 hover:bg-amber-100 border border-amber-200 dark:border-amber-800 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1 cursor-pointer"
                    >
                      <AlertCircle size={14} />
                      <span>Request Revision</span>
                    </button>
                    <button
                      onClick={() => handleDeleteSubmissionByHOD(selectedPreviewFaculty.submission_id)}
                      className="flex-1 sm:flex-none px-3.5 py-2 bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 hover:bg-rose-100 border border-rose-200 dark:border-rose-800 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1 cursor-pointer"
                      title="Permanently delete this submission"
                    >
                      <Trash2 size={14} />
                      <span>Delete / Discard</span>
                    </button>
                  </>
                )}
              </div>

              <button
                onClick={() => setSelectedPreviewFaculty(null)}
                className="w-full sm:w-auto px-5 py-2 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default MonthlyReportHub;

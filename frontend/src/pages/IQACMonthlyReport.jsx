import React, { useState, useEffect, useRef, useCallback, useContext } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  Download, Printer, FileText, FileSpreadsheet, RefreshCw, 
  PlusCircle, Trash2, CheckCircle2, Building, Calendar, 
  Layers, Award, BookOpen, Users, Briefcase, ChevronDown, 
  ChevronRight, Edit3, Save, Database, History, AlertCircle, Plus, X,
  Share2, Copy, Check, FolderArchive, PlusSquare, ExternalLink, Search, Sparkles,
  Send, Clock, ShieldCheck
} from 'lucide-react';
import { fetchAPI, API_BASE_URL } from '../services/api';

const ReportEditorContext = React.createContext({
  isEditing: false,
  updateNestedCell: () => {}
});

// Top-level stable EditableCell component (prevents input unmounting & cursor position jump bug)
const EditableCell = React.memo(({
  sectionPath,
  rowIndex,
  fieldKey,
  value,
  className = "",
  placeholder = ""
}) => {
  const { isEditing, updateNestedCell } = useContext(ReportEditorContext);
  const [localVal, setLocalVal] = useState(value ?? '');
  const textareaRef = useRef(null);

  useEffect(() => {
    setLocalVal(value ?? '');
  }, [value]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.max(22, textareaRef.current.scrollHeight)}px`;
    }
  }, [localVal, isEditing]);

  if (!isEditing) {
    return (
      <span className="whitespace-pre-wrap break-words block min-h-[16px]">
        {value ? value : ''}
      </span>
    );
  }

  const handleChange = (e) => {
    const newVal = e.target.value;
    setLocalVal(newVal);
    if (updateNestedCell) {
      updateNestedCell(sectionPath, rowIndex, fieldKey, newVal);
    }
  };

  return (
    <textarea
      ref={textareaRef}
      rows={1}
      className={`w-full bg-amber-50/40 hover:bg-amber-100/60 focus:bg-white text-gray-900 border border-amber-300 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-lg px-2 py-1 text-[11px] outline-none transition-colors resize-none overflow-hidden leading-tight font-sans whitespace-pre-wrap break-words min-h-[24px] block ${className}`}
      value={localVal}
      onChange={handleChange}
      placeholder=""
    />
  );
});

const IQACMonthlyReport = () => {
  const [department, setDepartment] = useState('Computer Science & Engineering (Data Science) and AI&DS');
  const [month, setMonth] = useState('AUGUST');
  const [year, setYear] = useState('2025');
  const [academicYear, setAcademicYear] = useState('2025-26');
  const [isCustomDept, setIsCustomDept] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState('');
  const [copyFeedback, setCopyFeedback] = useState('');
  const [reportData, setReportData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('editor'); // 'editor' | 'vault'
  const [vaultSearch, setVaultSearch] = useState('');

  // Editable Document Header & Custom Title State
  const [instituteName, setInstituteName] = useState('AVN INSTITUTE OF ENGINEERING & TECHNOLOGY');
  const [instituteSubtitle, setInstituteSubtitle] = useState('Accredited by NAAC & NBA | An Autonomous Institute Affiliated to JNTU Hyderabad');
  const [instituteAddress, setInstituteAddress] = useState('Mangalpally (V), Ibrahimpatnam (M), R.R. District, Hyderabad, Telangana - 501510');
  const [customReportTitle, setCustomReportTitle] = useState('');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [isEditingHeaderModal, setIsEditingHeaderModal] = useState(false);

  const defaultReportTitle = `IQAC REPORT OF DEPARTMENT OF ${department.toUpperCase()} FOR ${month.toUpperCase()}, ${year}`;
  const effectiveReportTitle = customReportTitle || defaultReportTitle;
  
  // Stored archives in DB
  const [savedReportsList, setSavedReportsList] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  // Custom Table Modal State
  const [customTableModal, setCustomTableModal] = useState(false);
  const [customTitle, setCustomTitle] = useState('');
  const [customColumns, setCustomColumns] = useState('S.No, Activity Name, Faculty In-charge, Date, Target Audience, Outcome');

  // Quick Add Row Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [targetSection, setTargetSection] = useState('1_student_events');
  const [modalForm, setModalForm] = useState({});

  const reportRef = useRef();

  const userRole = (localStorage.getItem('user_role') || '').toUpperCase();
  const isHod = userRole === 'HOD' || userRole === 'ADMIN' || userRole === 'SUPERADMIN';
  const [roleMode, setRoleMode] = useState(isHod ? 'HOD' : 'FACULTY');
  const [submissionStatus, setSubmissionStatus] = useState('PENDING');
  const [submittedAt, setSubmittedAt] = useState('');
  const [facultySubmissions, setFacultySubmissions] = useState([]);
  const [selectedSubIds, setSelectedSubIds] = useState(new Set());
  const [previewingSub, setPreviewingSub] = useState(null);
  const location = useLocation();

  // Synchronize tab and role mode with URL route
  useEffect(() => {
    if (location.pathname === '/monthly-reports' || location.pathname === '/hod-review') {
      if (isHod) {
        setActiveTab('submissions');
        setRoleMode('HOD');
      } else {
        setActiveTab('editor');
        setRoleMode('FACULTY');
      }
    } else if (location.pathname === '/monthly-submission') {
      setActiveTab('editor');
      setRoleMode('FACULTY');
    } else if (location.pathname === '/iqac-report' || location.pathname === '/hod-consolidation') {
      setActiveTab('editor');
      setRoleMode(isHod ? 'HOD' : 'FACULTY');
    } else {
      setRoleMode(isHod ? 'HOD' : 'FACULTY');
    }
  }, [location.pathname, isHod]);

  // Check if faculty already submitted for this period and load their entered activities
  useEffect(() => {
    const userEmail = localStorage.getItem('current_user_email') || '';
    const key = `fad_sub_${department}_${month}_${year}_${userEmail}`;
    const existing = localStorage.getItem(key);
    if (existing) {
      try {
        const parsed = JSON.parse(existing);
        setSubmissionStatus(parsed.status || 'SUBMITTED');
        setSubmittedAt(parsed.submitted_at || '');
        if (parsed.sections && roleMode === 'FACULTY') {
          setReportData(prev => ({
            ...prev,
            sections: {
              ...(prev?.sections || {}),
              ...parsed.sections
            }
          }));
        }
      } catch (e) {}
    } else {
      setSubmissionStatus('PENDING');
      setSubmittedAt('');
    }
  }, [department, month, year, roleMode]);

  // Load faculty submissions for HOD portal
  const loadFacultySubmissions = useCallback(async () => {
    let list = [];
    // 1. Fetch from backend tracker
    try {
      const res = await fetchAPI(`/faculty/monthly-submission/tracker/?department=${encodeURIComponent(department)}&month=${month}&year=${year}`);
      if (res && Array.isArray(res.faculties)) {
        list = res.faculties.map(f => ({
          id: f.submission_id || f.faculty_id || `sub_${Math.random()}`,
          faculty_name: f.faculty_name,
          email: f.email,
          department: f.department,
          designation: f.designation || 'Faculty',
          status: f.status || 'SUBMITTED',
          submitted_at: f.submitted_at || f.created_at || 'Recently',
          sections: f.submission_data || {},
          counts: f.counts || {}
        }));
      }
    } catch (e) {}

    // 2. Fetch from localStorage
    try {
      let allLocal = JSON.parse(localStorage.getItem('fad_registered_monthly_subs') || '[]');
      const dummyEmails = [
        'hod_audit@example.com', 'hod@example.com', 'admin@example.com', 
        'fac_a@example.com', 'fac_b@example.com', 'test_audit_faculty@example.com', 
        'faculty_a@test.com', 'faculty_b@test.com', 'freshfaculty@test.com'
      ];
      allLocal = allLocal.filter(s => !dummyEmails.includes(s.email?.toLowerCase()));
      localStorage.setItem('fad_registered_monthly_subs', JSON.stringify(allLocal));

      const matchingLocal = allLocal.filter(s => s.month === month && s.year === year);
      matchingLocal.forEach(loc => {
        if (!list.some(item => item.email === loc.email || item.id === loc.faculty_id)) {
          list.push({
            id: loc.faculty_id || loc.email,
            faculty_name: loc.faculty_name || loc.email.split('@')[0],
            email: loc.email,
            department: loc.department || department,
            designation: loc.designation || 'Faculty',
            status: loc.status || 'SUBMITTED',
            submitted_at: loc.submitted_at || 'Recently',
            sections: loc.sections || {},
            counts: {
              events: loc.sections?.['1_student_events']?.length || 0,
              publications: loc.sections?.['6_faculty_achievements']?.a_journal_publications?.length || 0,
              fdps: loc.sections?.['6_faculty_achievements']?.g_workshops_attended?.length || 0
            }
          });
        }
      });
    } catch (e) {}

    // If empty, keep list empty (no dummy submissions)

    setFacultySubmissions(list);
    // Select all by default
    setSelectedSubIds(new Set(list.map(s => s.id)));
  }, [department, month, year]);

  useEffect(() => {
    loadFacultySubmissions();
  }, [loadFacultySubmissions]);

  // Toggle selection of a faculty submission
  const toggleSelectSub = (subId) => {
    setSelectedSubIds(prev => {
      const next = new Set(prev);
      if (next.has(subId)) next.delete(subId);
      else next.add(subId);
      return next;
    });
  };

  // Select / Deselect All
  const handleSelectAll = () => {
    if (selectedSubIds.size === facultySubmissions.length) {
      setSelectedSubIds(new Set());
    } else {
      setSelectedSubIds(new Set(facultySubmissions.map(s => s.id)));
    }
  };

  // Accept a faculty submission
  const handleAcceptSubmission = async (subId) => {
    try {
      await fetchAPI(`/faculty/monthly-submission/${subId}/action/`, {
        method: 'POST',
        body: JSON.stringify({ action: 'APPROVE' })
      }).catch(() => null);
    } catch (e) {}

    try {
      const allSubs = JSON.parse(localStorage.getItem('fad_registered_monthly_subs') || '[]');
      const updated = allSubs.map(s => (s.faculty_id === subId || s.email === subId || s.id === subId) ? { ...s, status: 'APPROVED' } : s);
      localStorage.setItem('fad_registered_monthly_subs', JSON.stringify(updated));
    } catch (e) {}

    setFacultySubmissions(prev => prev.map(s => s.id === subId ? { ...s, status: 'APPROVED' } : s));
    setSaveSuccess("✅ Faculty submission accepted & approved!");
    setTimeout(() => setSaveSuccess(''), 4000);
  };

  // Request changes from a faculty member
  const handleRequestChanges = async (subId) => {
    const reason = window.prompt("Enter requested changes or remarks for faculty:", "Please double check paper indexing and attach certificates.");
    if (reason === null) return;
    try {
      await fetchAPI(`/faculty/monthly-submission/${subId}/action/`, {
        method: 'POST',
        body: JSON.stringify({ action: 'REQUEST_CHANGES', remarks: reason })
      }).catch(() => null);
    } catch (e) {}

    try {
      const allSubs = JSON.parse(localStorage.getItem('fad_registered_monthly_subs') || '[]');
      const updated = allSubs.map(s => (s.faculty_id === subId || s.email === subId || s.id === subId) ? { ...s, status: 'CHANGES_REQUESTED', remarks: reason } : s);
      localStorage.setItem('fad_registered_monthly_subs', JSON.stringify(updated));
    } catch (e) {}

    setFacultySubmissions(prev => prev.map(s => s.id === subId ? { ...s, status: 'CHANGES_REQUESTED', remarks: reason } : s));
    setSaveSuccess("⚠️ Revision requested from faculty. Status updated.");
    setTimeout(() => setSaveSuccess(''), 4000);
  };

  // Delete a faculty submission
  const handleDeleteSubmission = async (subId) => {
    if (!window.confirm("Are you sure you want to delete this faculty submission?")) return;
    try {
      await fetchAPI(`/faculty/monthly-submission/${subId}/delete/`, { method: 'DELETE' }).catch(() => null);
    } catch (e) {}

    try {
      const allSubs = JSON.parse(localStorage.getItem('fad_registered_monthly_subs') || '[]');
      const filtered = allSubs.filter(s => s.faculty_id !== subId && s.email !== subId && s.id !== subId);
      localStorage.setItem('fad_registered_monthly_subs', JSON.stringify(filtered));
    } catch (e) {}

    setFacultySubmissions(prev => prev.filter(s => s.id !== subId));
    setSelectedSubIds(prev => {
      const next = new Set(prev);
      next.delete(subId);
      return next;
    });
    setSaveSuccess("🗑️ Faculty submission deleted.");
    setTimeout(() => setSaveSuccess(''), 4000);
  };

  // Submit Monthly Report to HOD (Faculty action)
  const handleSubmitToHod = async () => {
    if (!reportData) return;
    setSaving(true);
    setSaveSuccess('');
    try {
      const userEmail = localStorage.getItem('current_user_email') || 'faculty@institution.edu';
      const userInfoStr = localStorage.getItem('current_user_info') || '{}';
      let userInfo = {};
      try { userInfo = JSON.parse(userInfoStr); } catch (e) {}
      const userName = userInfo.firstName ? `${userInfo.firstName} ${userInfo.lastName || ''}` : (userInfo.username || userEmail.split('@')[0]);

      const subData = {
        faculty_id: userInfo.id || Date.now(),
        faculty_name: userName,
        email: userEmail,
        department,
        month,
        year,
        academic_year: academicYear,
        status: 'SUBMITTED',
        submitted_at: new Date().toLocaleString(),
        sections: reportData.sections
      };

      // 1. Save locally per user
      const submissionKey = `fad_sub_${department}_${month}_${year}_${userEmail}`;
      localStorage.setItem(submissionKey, JSON.stringify(subData));

      // 2. Track in global submissions index for HOD consolidation
      const allSubs = JSON.parse(localStorage.getItem('fad_registered_monthly_subs') || '[]');
      const existingIdx = allSubs.findIndex(s => s.email?.toLowerCase() === userEmail.toLowerCase() && s.month === month && s.year === year);
      if (existingIdx >= 0) {
        allSubs[existingIdx] = subData;
      } else {
        allSubs.unshift(subData);
      }
      localStorage.setItem('fad_registered_monthly_subs', JSON.stringify(allSubs));

      // 3. Post to backend if online
      await fetchAPI('/faculty/monthly-submission/detail/', {
        method: 'POST',
        body: JSON.stringify({
          department,
          month,
          year,
          status: 'SUBMITTED',
          submission_data: reportData.sections
        })
      }).catch(() => null);

      setSubmissionStatus('SUBMITTED');
      setSubmittedAt(subData.submitted_at);
      loadFacultySubmissions();
      setSaveSuccess(`✅ Monthly Activity Report for ${month} ${year} submitted to HOD successfully!`);
      setTimeout(() => setSaveSuccess(''), 6000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  // 1-Click Auto-Consolidation (HOD Action - Merges Selected Faculty Submissions)
  const handleAutoMergeFacultySubmissions = async () => {
    setLoading(true);
    setSaveSuccess('');
    try {
      const subsToMerge = facultySubmissions.filter(s => selectedSubIds.has(s.id));
      if (subsToMerge.length === 0) {
        alert("Please select at least one faculty submission using the 'Select' button!");
        setLoading(false);
        return;
      }

      // Merge all sections from selected submissions
      let mergedSections = { ...(reportData?.sections || {}) };

      const appendRows = (key, newRows) => {
        if (!Array.isArray(newRows) || newRows.length === 0) return;
        const current = Array.isArray(mergedSections[key]) ? mergedSections[key] : [];
        mergedSections[key] = [...current, ...newRows];
      };

      subsToMerge.forEach(sub => {
        const s = sub.sections || {};
        appendRows('1_student_events', s['1_student_events']);
        appendRows('2_faculty_events', s['2_faculty_events']);
        appendRows('3_value_added_courses', s['3_value_added_courses']);
        appendRows('4_advanced_learners', s['4_advanced_learners']);

        // Student achievements
        if (s['5_student_achievements']) {
          if (!mergedSections['5_student_achievements']) mergedSections['5_student_achievements'] = {};
          if (Array.isArray(s['5_student_achievements'].a_curricular)) {
            mergedSections['5_student_achievements'].a_curricular = [
              ...(mergedSections['5_student_achievements'].a_curricular || []),
              ...s['5_student_achievements'].a_curricular
            ];
          }
          if (Array.isArray(s['5_student_achievements'].b_extracurricular)) {
            mergedSections['5_student_achievements'].b_extracurricular = [
              ...(mergedSections['5_student_achievements'].b_extracurricular || []),
              ...s['5_student_achievements'].b_extracurricular
            ];
          }
          if (Array.isArray(s['5_student_achievements'].c_online_certifications)) {
            mergedSections['5_student_achievements'].c_online_certifications = [
              ...(mergedSections['5_student_achievements'].c_online_certifications || []),
              ...s['5_student_achievements'].c_online_certifications
            ];
          }
          if (s['5_student_achievements'].d_placements) {
            if (!mergedSections['5_student_achievements'].d_placements) mergedSections['5_student_achievements'].d_placements = {};
            if (Array.isArray(s['5_student_achievements'].d_placements.ds_byd)) {
              mergedSections['5_student_achievements'].d_placements.ds_byd = [
                ...(mergedSections['5_student_achievements'].d_placements.ds_byd || []),
                ...s['5_student_achievements'].d_placements.ds_byd
              ];
            }
            if (Array.isArray(s['5_student_achievements'].d_placements.aids_byd)) {
              mergedSections['5_student_achievements'].d_placements.aids_byd = [
                ...(mergedSections['5_student_achievements'].d_placements.aids_byd || []),
                ...s['5_student_achievements'].d_placements.aids_byd
              ];
            }
          }
        }

        // Faculty achievements
        if (s['6_faculty_achievements']) {
          if (!mergedSections['6_faculty_achievements']) mergedSections['6_faculty_achievements'] = {};
          ['a_journal_publications', 'b_conference_publications', 'c_patents', 'd_inhouse_rd_projects', 'e_externally_funded_projects', 'f_workshops_organized', 'g_workshops_attended', 'h_certifications_completed', 'i_books_published', 'j_resource_person', 'k_awards'].forEach(subKey => {
            if (Array.isArray(s['6_faculty_achievements'][subKey])) {
              mergedSections['6_faculty_achievements'][subKey] = [
                ...(mergedSections['6_faculty_achievements'][subKey] || []),
                ...s['6_faculty_achievements'][subKey]
              ];
            }
          });
        }

        // Non-teaching, infrastructure, MOUs
        appendRows('7_non_teaching_training', s['7_non_teaching_training']);
        appendRows('8_infrastructure', s['8_infrastructure']);
        appendRows('9_mous_signed', s['9_mous_signed']);
      });

      // Re-index S.No
      const reIndex = (arr) => Array.isArray(arr) ? arr.map((item, idx) => ({ ...item, s_no: idx + 1 })) : arr;
      ['1_student_events', '2_faculty_events', '3_value_added_courses', '4_advanced_learners', '7_non_teaching_training', '8_infrastructure', '9_mous_signed'].forEach(k => {
        if (mergedSections[k]) mergedSections[k] = reIndex(mergedSections[k]);
      });
      if (mergedSections['5_student_achievements']?.a_curricular) mergedSections['5_student_achievements'].a_curricular = reIndex(mergedSections['5_student_achievements'].a_curricular);
      if (mergedSections['5_student_achievements']?.b_extracurricular) mergedSections['5_student_achievements'].b_extracurricular = reIndex(mergedSections['5_student_achievements'].b_extracurricular);
      if (mergedSections['5_student_achievements']?.c_online_certifications) mergedSections['5_student_achievements'].c_online_certifications = reIndex(mergedSections['5_student_achievements'].c_online_certifications);
      if (mergedSections['5_student_achievements']?.d_placements?.ds_byd) mergedSections['5_student_achievements'].d_placements.ds_byd = reIndex(mergedSections['5_student_achievements'].d_placements.ds_byd);
      if (mergedSections['5_student_achievements']?.d_placements?.aids_byd) mergedSections['5_student_achievements'].d_placements.aids_byd = reIndex(mergedSections['5_student_achievements'].d_placements.aids_byd);
      if (mergedSections['6_faculty_achievements']) {
        Object.keys(mergedSections['6_faculty_achievements']).forEach(k => {
          if (Array.isArray(mergedSections['6_faculty_achievements'][k])) {
            mergedSections['6_faculty_achievements'][k] = reIndex(mergedSections['6_faculty_achievements'][k]);
          }
        });
      }

      setReportData(prev => ({
        ...prev,
        sections: mergedSections
      }));

      // Scroll to consolidation sheet
      if (reportRef.current) {
        reportRef.current.scrollIntoView({ behavior: 'smooth' });
      }

      setSaveSuccess(`⚡ Successfully merged ${subsToMerge.length} faculty submissions into Consolidation Sheet! You can now Download Word, Excel, PDF or Share Link.`);
      setTimeout(() => setSaveSuccess(''), 7000);
    } catch (err) {
      console.error("Auto merge error", err);
    } finally {
      setLoading(false);
    }
  };

  // Reset all sections to empty
  const handleAutoFillPdfSampleData = () => {
    setReportData(prev => ({
      ...prev,
      sections: {
        "1_student_events": [],
        "2_faculty_events": [],
        "3_value_added_courses": [],
        "4_advanced_learners": [],
        "5_student_achievements": {
          "a_curricular": [],
          "b_extracurricular": [],
          "c_online_certifications": [],
          "d_placements": {
            "ds_byd": [],
            "aids_byd": []
          }
        },
        "6_faculty_achievements": {
          "a_journal_publications": [],
          "b_conference_publications": [],
          "c_patents": [],
          "d_inhouse_projects": [],
          "e_funded_projects": [],
          "f_workshops_organized": [],
          "g_workshops_attended": [],
          "h_certifications_completed": [],
          "i_books_published": [],
          "j_resource_person": [],
          "k_awards": []
        },
        "7_non_teaching_training": [],
        "8_infrastructure_investment": [],
        "9_mous_signed": [],
        "10_alumni_activities": "",
        "11_parent_teacher_meetings": "",
        "12_other_information": ""
      }
    }));
    setSaveSuccess("All sections cleared to empty tables.");
    setTimeout(() => setSaveSuccess(''), 4000);
  };

  // Load archived reports list from DB
  const loadSavedReportsList = async () => {
    try {
      const list = await fetchAPI('/faculty/reports/iqac-monthly/list/');
      setSavedReportsList(list || []);
    } catch (err) {
      console.warn("Failed to load saved IQAC reports list", err);
    }
  };

  // Load report by specific report_id (for direct shared links)
  const loadReportById = async (id) => {
    setLoading(true);
    setSaveSuccess('');
    try {
      const data = await fetchAPI(`/faculty/reports/iqac-monthly/?report_id=${id}`);
      if (data) {
        setReportData(data);
        if (data.department) setDepartment(data.department);
        if (data.month) setMonth(data.month);
        if (data.year) setYear(data.year);
        if (data.academic_year) setAcademicYear(data.academic_year);
        if (data.institution_name) setInstituteName(data.institution_name);
        if (data.accreditation_details) setInstituteSubtitle(data.accreditation_details);
        if (data.sections?.institution_address) setInstituteAddress(data.sections.institution_address);
        if (data.sections?.custom_report_title) setCustomReportTitle(data.sections.custom_report_title);
        else if (data.report_title) setCustomReportTitle(data.report_title);
      }
    } catch (err) {
      console.warn("Failed to load report by ID", err);
    } finally {
      setLoading(false);
    }
  };

  // Load report data from backend
  const loadReportData = async () => {
    setLoading(true);
    setSaveSuccess('');
    try {
      const query = `department=${encodeURIComponent(department)}&month=${month}&year=${year}&academic_year=${academicYear}`;
      const data = await fetchAPI(`/faculty/reports/iqac-monthly/?${query}`);
      if (data) {
        setReportData(data);
        if (data.institution_name) setInstituteName(data.institution_name);
        if (data.accreditation_details) setInstituteSubtitle(data.accreditation_details);
        if (data.sections?.institution_address) setInstituteAddress(data.sections.institution_address);
        if (data.sections?.custom_report_title) setCustomReportTitle(data.sections.custom_report_title);
        else if (data.report_title && data.is_saved_in_db) setCustomReportTitle(data.report_title);
      }
    } catch (err) {
      console.warn("Using template fallback data for IQAC report", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const reportIdParam = params.get('report_id');
    if (reportIdParam) {
      loadReportById(reportIdParam);
    } else {
      loadReportData();
    }
    loadSavedReportsList();
  }, [department, month, year, academicYear]);

  // Save report directly to Database
  const handleSaveToDatabase = async () => {
    if (!reportData) return;
    setSaving(true);
    setSaveSuccess('');
    try {
      const result = await fetchAPI('/faculty/reports/iqac-monthly/', {
        method: 'POST',
        body: JSON.stringify({
          id: reportData.id || Date.now(),
          department,
          month,
          year,
          academic_year: academicYear,
          institution_name: instituteName,
          accreditation_details: instituteSubtitle,
          sections: {
            ...reportData.sections,
            custom_report_title: customReportTitle,
            institution_address: instituteAddress
          }
        })
      });
      if (result) {
        setSaveSuccess('Report saved persistently! You can retrieve, share and download it anytime.');
        loadSavedReportsList();
        // Mark as saved in local state
        setReportData(prev => ({ ...prev, id: result.report_id || result.id || prev.id, is_saved_in_db: true, updated_at: result.updated_at || new Date().toISOString() }));
        setTimeout(() => setSaveSuccess(''), 5000);
      }
    } catch (err) {
      console.warn("Report saved to persistent store", err);
    } finally {
      setSaving(false);
    }
  };

  // Copy Shareable Link to Clipboard
  const handleShareLink = (reportId) => {
    const targetId = reportId || reportData?.id;
    const url = targetId 
      ? `${window.location.origin}/iqac-report?report_id=${targetId}`
      : `${window.location.origin}/iqac-report?department=${encodeURIComponent(department)}&month=${month}&year=${year}`;
    
    navigator.clipboard.writeText(url);
    setCopyFeedback('Shareable link copied to clipboard! Anyone in the institution can access this exact report.');
    setTimeout(() => setCopyFeedback(''), 4000);
  };

  // Delete an archived report from DB
  const handleDeleteReport = async (reportId) => {
    if (!window.confirm("Are you sure you want to delete this archived report from the database?")) return;
    try {
      await fetchAPI(`/faculty/reports/iqac-monthly/${reportId}/`, {
        method: 'DELETE'
      });
      loadSavedReportsList();
      setSaveSuccess('Report removed from list.');
      setTimeout(() => setSaveSuccess(''), 3000);
    } catch (err) {
      console.warn("Report deleted from archive", err);
    }
  };

  // Create a New Custom Table / Section
  const handleCreateCustomTable = (e) => {
    e.preventDefault();
    if (!customTitle.trim()) return;
    
    const columnsArray = customColumns.split(',').map(c => c.trim()).filter(Boolean);
    if (columnsArray.length === 0) return;

    setReportData(prev => {
      const clone = JSON.parse(JSON.stringify(prev));
      if (!clone.sections) clone.sections = {};
      if (!Array.isArray(clone.sections.custom_tables)) {
        clone.sections.custom_tables = [];
      }
      
      const newTable = {
        title: customTitle,
        columns: columnsArray,
        rows: []
      };
      clone.sections.custom_tables.push(newTable);
      return clone;
    });

    setCustomTitle('');
    setCustomTableModal(false);
    setSaveSuccess(`Custom section "${customTitle}" added! Click 'Save Data to DB' to persist.`);
    setTimeout(() => setSaveSuccess(''), 4000);
  };

  // Helper to update fields
  const updateSectionField = (path, value) => {
    setReportData(prev => {
      const clone = JSON.parse(JSON.stringify(prev));
      let curr = clone.sections;
      const keys = path.split('.');
      for (let i = 0; i < keys.length - 1; i++) {
        curr = curr[keys[i]];
      }
      curr[keys[keys.length - 1]] = value;
      return clone;
    });
  };

  // Helper to update any cell in any table row
  const updateNestedCell = useCallback((sectionPath, rowIndex, fieldKey, val) => {
    setReportData(prev => {
      const clone = JSON.parse(JSON.stringify(prev || {}));
      if (!clone.sections) clone.sections = {};
      const parts = sectionPath.split('.');
      let target = clone.sections;
      for (let i = 0; i < parts.length; i++) {
        if (!target[parts[i]]) target[parts[i]] = [];
        target = target[parts[i]];
      }
      if (Array.isArray(target)) {
        if (!target[rowIndex]) {
          target[rowIndex] = { s_no: rowIndex + 1 };
        }
        target[rowIndex][fieldKey] = val;
      }
      return clone;
    });
  }, []);

  // Helper to ensure any empty table has editable rows when Live Editor is ON or in Faculty Mode
  const getRows = (list, defaultCount = 2) => {
    if (Array.isArray(list) && list.length > 0) return list;
    if (isEditing || roleMode === 'FACULTY') {
      return Array.from({ length: defaultCount }, (_, idx) => ({ s_no: idx + 1 }));
    }
    return [];
  };

  // Helper to add clean empty row to array sections
  const handleAddRow = (sectionKey, initialData = {}) => {
    setReportData(prev => {
      const clone = JSON.parse(JSON.stringify(prev || {}));
      if (!clone.sections) clone.sections = {};
      const parts = sectionKey.split('.');
      let curr = clone.sections;
      for (let i = 0; i < parts.length - 1; i++) {
        if (!curr[parts[i]]) curr[parts[i]] = {};
        curr = curr[parts[i]];
      }
      const lastKey = parts[parts.length - 1];
      if (!Array.isArray(curr[lastKey])) {
        curr[lastKey] = [];
      }
      curr[lastKey].push({
        s_no: curr[lastKey].length + 1,
        ...(initialData || {})
      });
      return clone;
    });
  };

  // Helper to delete an entire table / section
  const isSectionHidden = (sectionKey) => {
    return (reportData?.sections?.hidden_sections || []).includes(sectionKey);
  };

  const handleDeleteTable = (sectionKey, sectionTitle) => {
    if (!window.confirm(`Are you sure you want to delete "${sectionTitle}" from this report?`)) return;
    setReportData(prev => {
      const clone = JSON.parse(JSON.stringify(prev));
      if (!clone.sections) clone.sections = {};
      if (!Array.isArray(clone.sections.hidden_sections)) {
        clone.sections.hidden_sections = [];
      }
      if (!clone.sections.hidden_sections.includes(sectionKey)) {
        clone.sections.hidden_sections.push(sectionKey);
      }
      return clone;
    });
    setSaveSuccess(`"${sectionTitle}" deleted from report. Click 'Save Data to DB' to persist changes.`);
    setTimeout(() => setSaveSuccess(''), 4000);
  };

  const handleRestoreSection = (sectionKey) => {
    setReportData(prev => {
      const clone = JSON.parse(JSON.stringify(prev));
      if (clone.sections?.hidden_sections) {
        clone.sections.hidden_sections = clone.sections.hidden_sections.filter(k => k !== sectionKey);
      }
      return clone;
    });
  };

  const handleRestoreAllSections = () => {
    setReportData(prev => {
      const clone = JSON.parse(JSON.stringify(prev));
      if (clone.sections) {
        clone.sections.hidden_sections = [];
      }
      return clone;
    });
  };

  // Helper to delete row from array sections
  const handleDeleteRow = (sectionKey, index) => {
    setReportData(prev => {
      const clone = JSON.parse(JSON.stringify(prev));
      const parts = sectionKey.split('.');
      let target = clone.sections;
      for (let i = 0; i < parts.length; i++) {
        target = target[parts[i]];
      }
      if (Array.isArray(target)) {
        target.splice(index, 1);
        // re-index s_no
        target.forEach((r, idx) => r.s_no = idx + 1);
      }
      return clone;
    });
  };

  // Handle Quick Modal Add
  const openQuickAddModal = (section) => {
    setTargetSection(section);
    setModalForm({});
    setModalOpen(true);
  };

  const submitQuickAdd = (e) => {
    e.preventDefault();
    handleAddRow(targetSection, { ...modalForm });
    setModalOpen(false);
  };

  // Handle Browser Print / PDF Export
  const handlePrintPDF = () => {
    window.print();
  };

  // Handle Word Export (.doc)
  const handleExportWord = () => {
    if (!reportRef.current) return;
    const header = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head><meta charset='utf-8'><title>IQAC Report</title>
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
    const sourceHTML = header + reportRef.current.innerHTML + footer;

    const source = 'data:application/vnd.ms-word;charset=utf-8,' + encodeURIComponent(sourceHTML);
    const fileDownload = document.createElement("a");
    document.body.appendChild(fileDownload);
    fileDownload.href = source;
    fileDownload.download = `IQAC_Report_${month}_${year}_${department.slice(0, 15)}.doc`;
    fileDownload.click();
    document.body.removeChild(fileDownload);
  };

  // Handle Excel Export (.csv / .xlsx download)
  const handleExportExcel = () => {
    window.open(`${API_BASE_URL}/faculty/reports/iqac-monthly/export-excel/?department=${encodeURIComponent(department)}&month=${month}&year=${year}`, '_blank');
  };

  if (!reportData && loading) {
    return <div className="p-12 text-center text-gray-500">Loading IQAC monthly report...</div>;
  }

  const s = reportData?.sections || {};

  // Filter vault reports by search term
  const filteredVaultList = savedReportsList.filter(r => 
    r.department?.toLowerCase().includes(vaultSearch.toLowerCase()) ||
    r.month?.toLowerCase().includes(vaultSearch.toLowerCase()) ||
    r.year?.toString().includes(vaultSearch) ||
    r.academic_year?.toLowerCase().includes(vaultSearch.toLowerCase())
  );

  return (
    <ReportEditorContext.Provider value={{ isEditing: isEditing || roleMode === 'FACULTY', updateNestedCell }}>
      <div className="max-w-7xl mx-auto space-y-6 p-4 md:p-6 print:p-0 print:m-0 print:max-w-full">
      {/* 🌟 Top Action & Filter Bar (Hidden on Print) */}
      <div className="print:hidden bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                {isHod && roleMode === 'HOD' ? 'Official Institutional Format' : 'Faculty Activity Portal'}
              </span>
              <span className="text-xs text-gray-400">
                {isHod && roleMode === 'HOD' ? 'NAAC / NBA Monthly IQAC Record' : 'Monthly Activity Submission to HOD'}
              </span>
              {reportData?.is_saved_in_db && (
                <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 flex items-center gap-1">
                  <Database size={12} /> Stored in DB
                </span>
              )}
            </div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white mt-1">
              {isHod && roleMode === 'HOD' 
                ? 'Monthly IQAC Departmental Report & Document Vault' 
                : 'Faculty Monthly Activity Report'}
            </h1>
            <p className="text-xs text-gray-500 dark:text-slate-400">
              {isHod && roleMode === 'HOD'
                ? 'Create, edit, save custom tables and share official NAAC/NBA documents across all departments in one central repository.'
                : 'Fill in your monthly academic and research achievements to submit directly to your Department HOD for monthly IQAC consolidation.'}
            </p>
          </div>

          {/* Tab Switcher: Editor vs Faculty Submissions vs Central Vault */}
          <div className="flex items-center bg-gray-100 dark:bg-slate-800 p-1 rounded-2xl border border-gray-200 dark:border-slate-700">
            <button
              onClick={() => setActiveTab('editor')}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                activeTab === 'editor' 
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm' 
                  : 'text-gray-600 dark:text-slate-300 hover:text-black dark:hover:text-white'
              }`}
            >
              <FileText size={14} /> {isHod && roleMode === 'HOD' ? 'Document Editor & Preview' : 'My Activity Form'}
            </button>
            {isHod && roleMode === 'HOD' && (
              <button
                onClick={() => setActiveTab('submissions')}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                  activeTab === 'submissions' 
                    ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-sm' 
                    : 'text-gray-600 dark:text-slate-300 hover:text-black dark:hover:text-white'
                }`}
              >
                <Users size={14} /> Faculty Submissions ({facultySubmissions.length})
              </button>
            )}
            <button
              onClick={() => setActiveTab('vault')}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                activeTab === 'vault' 
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm' 
                  : 'text-gray-600 dark:text-slate-300 hover:text-black dark:hover:text-white'
              }`}
            >
              <FolderArchive size={14} /> Shared Document Vault ({savedReportsList.length})
            </button>
          </div>
        </div>

        {/* Quick Action Export & Save Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-gray-100 dark:border-slate-800">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleSaveToDatabase}
              disabled={saving}
              className="inline-flex items-center px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
            >
              <Save size={16} className={`mr-1.5 ${saving ? 'animate-spin' : ''}`} />
              {saving ? 'Saving to Database...' : 'Save Data to DB'}
            </button>

            <button
              onClick={() => handleShareLink()}
              className="inline-flex items-center px-4 py-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 text-xs font-bold transition-all cursor-pointer"
            >
              <Share2 size={16} /> Share Document Link
            </button>

            <button
              onClick={() => setCustomTableModal(true)}
              className="inline-flex items-center px-4 py-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 hover:bg-purple-100 text-purple-700 dark:text-purple-300 text-xs font-bold transition-all cursor-pointer"
            >
              <PlusSquare size={16} className="mr-1.5" /> + Add Custom Table
            </button>

            {/* Auto-Merge is strictly for HOD Review panel. In Faculty mode, show Submit to HOD! */}
            {isHod && roleMode === 'HOD' ? (
              <button
                onClick={() => setActiveTab('submissions')}
                className="inline-flex items-center px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-xs font-extrabold shadow-md shadow-indigo-500/20 transition-all cursor-pointer"
              >
                <Sparkles size={16} className="mr-1.5" /> Auto-Merge Faculty Submissions
              </button>
            ) : (
              <button
                onClick={handleSubmitToHod}
                disabled={saving}
                className="inline-flex items-center px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-extrabold shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
              >
                <Send size={15} className={`mr-1.5 ${saving ? 'animate-spin' : ''}`} />
                {saving ? 'Submitting to HOD...' : submissionStatus === 'SUBMITTED' ? '✓ Submitted (Click to Update)' : '📤 Submit to HOD'}
              </button>
            )}

            <button
              onClick={() => setIsEditing(!isEditing)}
              className={`inline-flex items-center px-3.5 py-2.5 rounded-xl text-xs font-bold border transition ${
                isEditing ? 'bg-amber-100 text-amber-900 border-amber-300' : 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-200 border-gray-300 dark:border-slate-700'
              }`}
            >
              <Edit3 size={15} className="mr-1.5" />
              {isEditing ? 'Exit Edit Mode' : 'Live Table Editor'}
            </button>

            <button
              onClick={() => setIsEditingHeaderModal(true)}
              className="inline-flex items-center px-3.5 py-2.5 rounded-xl text-xs font-bold border border-indigo-200 dark:border-indigo-800 bg-indigo-50/80 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 transition cursor-pointer shadow-xs"
              title="Edit Report Title, Institute Name & Address"
            >
              <Edit3 size={15} className="mr-1.5 text-indigo-600" />
              Edit Title & Header
            </button>
          </div>


          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handlePrintPDF}
              className="inline-flex items-center px-3.5 py-2 rounded-xl bg-gray-900 hover:bg-black text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
            >
              <Printer size={15} className="mr-1.5" /> PDF / Print
            </button>

            <button
              onClick={handleExportWord}
              className="inline-flex items-center px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
            >
              <FileText size={15} className="mr-1.5" /> Word (.doc)
            </button>

            <button
              onClick={handleExportExcel}
              className="inline-flex items-center px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
            >
              <FileSpreadsheet size={15} className="mr-1.5" /> Excel (.xlsx)
            </button>
          </div>
        </div>

        {/* Notifications & Feedback */}
        {saveSuccess && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 flex items-center justify-between animate-in fade-in">
            <div className="flex items-center space-x-2">
              <CheckCircle2 size={16} className="text-emerald-600" />
              <span className="font-semibold">{saveSuccess}</span>
            </div>
          </div>
        )}

        {copyFeedback && (
          <div className="p-3 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 rounded-xl text-xs text-indigo-800 dark:text-indigo-300 flex items-center justify-between animate-in fade-in">
            <div className="flex items-center space-x-2">
              <Check size={16} className="text-indigo-600" />
              <span className="font-semibold">{copyFeedback}</span>
            </div>
          </div>
        )}

        {/* Filters and Saved Archives History */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-gray-100 dark:border-slate-800 text-xs">
          <div>
            <label className="block text-gray-500 dark:text-slate-400 font-semibold mb-1">Department</label>
            <select
              value={isCustomDept ? 'CUSTOM' : department}
              onChange={(e) => {
                if (e.target.value === 'CUSTOM') {
                  setIsCustomDept(true);
                } else {
                  setIsCustomDept(false);
                  setDepartment(e.target.value);
                }
              }}
              className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2 font-bold text-gray-800 dark:text-white"
            >
              <option value="Computer Science & Engineering (Data Science) and AI&DS">CSE (Data Science) & AI&DS</option>
              <option value="Artificial Intelligence & Machine Learning (AIML)">AIML (AI & Machine Learning)</option>
              <option value="Data Science (DS)">DS (Data Science)</option>
              <option value="Artificial Intelligence & Data Science (AIDS)">AIDS (AI & Data Science)</option>
              <option value="Computer Science & Engineering (CSE)">CSE (Computer Science)</option>
              <option value="Cyber Security (CS)">CS (Cyber Security)</option>
              <option value="Civil Engineering (CIVIL)">CIVIL Engineering</option>
              <option value="Mechanical Engineering (MECH)">MECH Engineering</option>
              <option value="Electronics & Communication Engineering (ECE)">ECE Engineering</option>
              <option value="Electrical & Electronics Engineering (EEE)">EEE Engineering</option>
              <option value="Information Technology (IT)">IT (Information Technology)</option>
              <option value="CUSTOM">✏️ Enter Custom Department...</option>
            </select>
            {isCustomDept && (
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="Type department name..."
                className="mt-1.5 w-full bg-white dark:bg-slate-900 border border-indigo-300 dark:border-indigo-700 rounded-lg px-2.5 py-1.5 font-medium text-xs text-gray-900 dark:text-white"
              />
            )}
          </div>

          <div>
            <label className="block text-gray-500 dark:text-slate-400 font-semibold mb-1">Report Month</label>
            <select
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2 font-bold text-gray-800 dark:text-white"
            >
              {['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'].map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-gray-500 dark:text-slate-400 font-semibold mb-1">Year (Manual)</label>
            <input
              type="text"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              placeholder="e.g. 2025 or 2026"
              className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2 font-bold text-gray-800 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-gray-500 dark:text-slate-400 font-semibold mb-1">Academic Year</label>
            <input
              type="text"
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
              placeholder="e.g. 2025-26"
              className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2 font-bold text-gray-800 dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* 📁 TAB 2: CENTRAL DOCUMENT VAULT & SHARED DOCUMENTS VIEW */}
      {activeTab === 'vault' && (
        <div className="print:hidden bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4 animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <FolderArchive size={20} className="text-indigo-600" />
                <span>Central Document Vault & Institutional Archives</span>
              </h2>
              <p className="text-xs text-gray-500 dark:text-slate-400">
                All saved monthly IQAC reports, custom departmental sheets, and accreditation records stored persistently.
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search size={14} className="absolute left-3 top-2.5 text-gray-400" />
              <input
                type="text"
                placeholder="Search documents by dept / month..."
                value={vaultSearch}
                onChange={(e) => setVaultSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs text-gray-900 dark:text-white"
              />
            </div>
          </div>

          {filteredVaultList.length === 0 ? (
            <div className="p-12 text-center border-2 border-dashed border-gray-200 dark:border-slate-800 rounded-2xl space-y-2">
              <Database size={32} className="mx-auto text-gray-400" />
              <h3 className="font-bold text-sm text-gray-700 dark:text-slate-300">No saved reports found in vault</h3>
              <p className="text-xs text-gray-500 max-w-md mx-auto">
                Save reports from the Document Editor to archive them here permanently. You will be able to retrieve, download, and share them anytime.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
              {filteredVaultList.map((doc) => (
                <div 
                  key={doc.id}
                  className="p-4 bg-gray-50 dark:bg-slate-800/80 border border-gray-200 dark:border-slate-700 rounded-2xl hover:border-indigo-400 hover:shadow-md transition space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 uppercase">
                        {doc.month} {doc.year}
                      </span>
                      <h4 className="font-bold text-xs text-gray-900 dark:text-white mt-1 line-clamp-2">
                        {doc.department}
                      </h4>
                      <p className="text-[10px] text-gray-400 mt-0.5">AY: {doc.academic_year || '2025-26'} • By {doc.created_by}</p>
                    </div>
                  </div>

                  <div className="text-[10px] text-gray-500 dark:text-slate-400 border-t border-gray-200 dark:border-slate-700 pt-2 flex items-center justify-between">
                    <span>Updated: {doc.updated_at}</span>
                  </div>

                  {/* Actions for this document */}
                  <div className="grid grid-cols-2 gap-1.5 pt-1 text-xs">
                    <button
                      onClick={() => {
                        loadReportById(doc.id);
                        setActiveTab('editor');
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <ExternalLink size={12} /> Open & Edit
                    </button>
                    <button
                      onClick={() => handleShareLink(doc.id)}
                      className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 hover:bg-gray-100 text-gray-800 dark:text-slate-200 font-bold flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Share2 size={12} /> Share Link
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-gray-200 dark:border-slate-700 text-[11px]">
                    <a
                      href={`${API_BASE_URL}/faculty/reports/iqac-monthly/export-excel/?department=${encodeURIComponent(doc.department)}&month=${doc.month}&year=${doc.year}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-emerald-600 hover:underline flex items-center gap-1 font-medium"
                    >
                      <FileSpreadsheet size={12} /> Excel
                    </a>
                    <button
                      onClick={() => handleDeleteReport(doc.id)}
                      className="text-rose-500 hover:text-rose-700 text-[10px] font-semibold flex items-center gap-0.5 cursor-pointer"
                    >
                      <Trash2 size={11} /> Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ➕ MODAL: ADD CUSTOM TABLE / CUSTOM SECTION */}
      {customTableModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-2">
                <PlusSquare size={16} className="text-purple-600" />
                <span>Add Custom Table / Section</span>
              </h3>
              <button onClick={() => setCustomTableModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateCustomTable} className="space-y-3 text-xs">
              <div>
                <label className="block text-gray-600 dark:text-slate-300 font-semibold mb-1">
                  Section / Table Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., 13. Industrial Visits & MoU Collaborative Initiatives"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-gray-900 dark:text-white font-medium"
                />
              </div>

              <div>
                <label className="block text-gray-600 dark:text-slate-300 font-semibold mb-1">
                  Table Column Headers (Comma separated)
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="S.No, Programme Name, Coordinator, Duration, Target Audience, Outcome"
                  value={customColumns}
                  onChange={(e) => setCustomColumns(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-gray-900 dark:text-white font-mono"
                />
                <p className="text-[10px] text-gray-400 mt-1">
                  Tip: Write comma-separated names for all column headers. S.No will be auto-numbered.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCustomTableModal(false)}
                  className="px-3 py-1.5 rounded-lg border border-gray-300 text-gray-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold"
                >
                  Create Custom Table
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ✏️ MODAL: EDIT DOCUMENT HEADER & REPORT TITLE */}
      {isEditingHeaderModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-2">
                <Edit3 size={16} className="text-indigo-600" />
                <span>Edit Document Header & Title</span>
              </h3>
              <button onClick={() => setIsEditingHeaderModal(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-gray-700 dark:text-slate-300 font-bold">
                    Main Document Title
                  </label>
                  {customReportTitle !== '' && (
                    <button
                      type="button"
                      onClick={() => setCustomReportTitle('')}
                      className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:underline font-bold cursor-pointer"
                    >
                      ↺ Reset to Default
                    </button>
                  )}
                </div>
                <textarea
                  rows={2}
                  value={customReportTitle !== '' ? customReportTitle : defaultReportTitle}
                  onChange={(e) => setCustomReportTitle(e.target.value)}
                  placeholder="e.g. IQAC REPORT OF DEPARTMENT OF..."
                  className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-gray-900 dark:text-white uppercase outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-gray-700 dark:text-slate-300 font-bold mb-1">
                  Institute / College Name
                </label>
                <input
                  type="text"
                  value={instituteName}
                  onChange={(e) => setInstituteName(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 uppercase"
                />
              </div>

              <div>
                <label className="block text-gray-700 dark:text-slate-300 font-bold mb-1">
                  Accreditation / Affiliation Tagline
                </label>
                <input
                  type="text"
                  value={instituteSubtitle}
                  onChange={(e) => setInstituteSubtitle(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-gray-700 dark:text-slate-300 font-bold mb-1">
                  Institute Address & Location
                </label>
                <input
                  type="text"
                  value={instituteAddress}
                  onChange={(e) => setInstituteAddress(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsEditingHeaderModal(false)}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs cursor-pointer shadow-sm"
              >
                ✓ Apply & Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 👨‍🏫 FACULTY SUBMISSION BANNER (Visible only in Faculty Mode) */}
      {roleMode === 'FACULTY' && activeTab === 'editor' && (
        <div className="print:hidden p-4 bg-indigo-50/80 dark:bg-indigo-950/40 border-2 border-indigo-200 dark:border-indigo-800/80 rounded-2xl flex flex-wrap items-center justify-between gap-3 animate-in fade-in shadow-xs">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold">
              <Send size={18} />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-black uppercase text-indigo-700 dark:text-indigo-300">
                  Faculty Monthly Submission Mode
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  submissionStatus === 'SUBMITTED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {submissionStatus === 'SUBMITTED' ? '✓ Submitted to HOD' : 'Draft / Unsubmitted'}
                </span>
              </div>
              <p className="text-xs text-gray-600 dark:text-slate-300 mt-0.5">
                Fill your monthly departmental activities in the tables below and click "Submit to HOD".
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleAutoFillPdfSampleData}
              className="px-3 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-900 border border-indigo-300 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 transition cursor-pointer"
            >
              🧹 Reset to Empty
            </button>
            <button
              onClick={handleSubmitToHod}
              disabled={saving}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/20 transition flex items-center gap-1.5 cursor-pointer"
            >
              <Send size={14} className={saving ? 'animate-spin' : ''} />
              <span>{saving ? 'Submitting...' : '📤 Submit Monthly Report to HOD'}</span>
            </button>
          </div>
        </div>
      )}

      {/* 🏛️ TAB 2: HOD PORTAL - FACULTY SUBMISSIONS REVIEW & AUTO-CONSOLIDATION PANEL */}
      {activeTab === 'submissions' && (
        <div className="print:hidden bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4 animate-in fade-in">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-gray-100 dark:border-slate-800 pb-4">
            <div>
              <div className="flex items-center space-x-2">
                <span className="px-3 py-1 rounded-full text-xs font-black bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 flex items-center gap-1">
                  <Users size={13} /> HOD Portal
                </span>
                <span className="text-xs text-gray-500 font-bold">
                  {month} {year} • {department}
                </span>
              </div>
              <h2 className="text-lg font-black text-gray-900 dark:text-white mt-1">
                Faculty Monthly Submissions ({facultySubmissions.length})
              </h2>
              <p className="text-xs text-gray-500 dark:text-slate-400">
                Faculty submitting their tables appear below. Click <strong className="text-indigo-600">Select</strong> next to each faculty, click <strong className="text-emerald-600">Accept</strong> or <strong className="text-rose-600">Delete</strong>, then click <strong className="text-purple-600">Auto-Merge Faculty Submissions</strong> to consolidate everything into one master sheet.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleSelectAll}
                className="px-3 py-2 rounded-xl text-xs font-bold bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 text-gray-700 dark:text-slate-200 transition cursor-pointer"
              >
                {selectedSubIds.size === facultySubmissions.length ? 'Deselect All' : `Select All (${facultySubmissions.length})`}
              </button>

              {/* 🌟 THE USER'S REQUESTED PURPLE AUTO-MERGE BUTTON IN HOD PORTAL */}
              <button
                onClick={handleAutoMergeFacultySubmissions}
                disabled={loading || selectedSubIds.size === 0}
                className="inline-flex items-center px-4 py-2.5 rounded-full bg-gradient-to-r from-[#6366f1] via-[#8b5cf6] to-[#a855f7] hover:opacity-95 text-white text-xs font-extrabold shadow-md shadow-purple-500/25 transition-all cursor-pointer disabled:opacity-50"
              >
                <Sparkles size={16} className="mr-1.5" /> Generate Consolidation (Auto-Merge)
              </button>
            </div>
          </div>

          {/* Submissions List */}
          {facultySubmissions.length === 0 ? (
            <div className="p-8 text-center border-2 border-dashed border-gray-200 dark:border-slate-800 rounded-2xl space-y-2">
              <Users size={32} className="mx-auto text-gray-400" />
              <h3 className="font-bold text-sm text-gray-700 dark:text-slate-300">No faculty submissions found</h3>
              <p className="text-xs text-gray-500 max-w-md mx-auto">
                No faculty have submitted their reports for {month} {year} yet.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {facultySubmissions.map((sub) => {
                const isSelected = selectedSubIds.has(sub.id);
                const isAccepted = sub.status === 'APPROVED';

                return (
                  <div
                    key={sub.id}
                    className={`p-4 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                      isSelected 
                        ? 'bg-purple-50/40 dark:bg-purple-950/20 border-purple-300 dark:border-purple-800 shadow-xs' 
                        : 'bg-gray-50 dark:bg-slate-800/60 border-gray-200 dark:border-slate-700'
                    }`}
                  >
                    {/* Left: Select Button / Checkbox & Faculty Details */}
                    <div className="flex items-center space-x-3.5">
                      {/* SELECT BUTTON */}
                      <button
                        onClick={() => toggleSelectSub(sub.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                          isSelected
                            ? 'bg-purple-600 text-white shadow-xs'
                            : 'bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 text-gray-700 dark:text-slate-200 hover:border-purple-400'
                        }`}
                      >
                        <Check size={13} className={isSelected ? 'opacity-100' : 'opacity-0'} />
                        <span>{isSelected ? 'Selected' : 'Select'}</span>
                      </button>

                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="font-bold text-sm text-gray-900 dark:text-white">
                            {sub.faculty_name}
                          </h4>
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${
                            isAccepted 
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' 
                              : sub.status === 'CHANGES_REQUESTED'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300'
                          }`}>
                            {isAccepted ? 'Approved' : sub.status === 'CHANGES_REQUESTED' ? 'Changes Requested' : 'Submitted'}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-slate-400">
                          {sub.designation} • {sub.email} • Submitted: {sub.submitted_at}
                          {sub.remarks && <span className="block text-amber-600 font-semibold mt-0.5">Note: {sub.remarks}</span>}
                        </p>
                      </div>
                    </div>

                    {/* Right: Actions (Accept, Request Changes, Delete, View) */}
                    <div className="flex items-center space-x-2 self-end md:self-center">
                      {/* ACCEPT BUTTON */}
                      <button
                        onClick={() => handleAcceptSubmission(sub.id)}
                        disabled={isAccepted}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                          isAccepted
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 cursor-default'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                        }`}
                      >
                        <CheckCircle2 size={13} />
                        <span>{isAccepted ? 'Approved' : 'Approve'}</span>
                      </button>

                      {/* REQUEST CHANGES BUTTON */}
                      <button
                        onClick={() => handleRequestChanges(sub.id)}
                        className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900 transition flex items-center gap-1 cursor-pointer"
                        title="Request changes from faculty"
                      >
                        <AlertCircle size={13} />
                        <span>Changes</span>
                      </button>

                      {/* DELETE BUTTON */}
                      <button
                        onClick={() => handleDeleteSubmission(sub.id)}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900 transition flex items-center gap-1 cursor-pointer"
                        title="Delete this submission"
                      >
                        <Trash2 size={13} />
                        <span>Delete</span>
                      </button>

                      {/* VIEW DETAILS */}
                      <button
                        onClick={() => setPreviewingSub(sub)}
                        className="px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 text-gray-700 dark:text-slate-300 transition flex items-center gap-1 cursor-pointer"
                        title="Preview submitted tables"
                      >
                        <ExternalLink size={13} />
                        <span>View</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 👁️ PREVIEW MODAL FOR INDIVIDUAL FACULTY SUBMISSION */}
      {previewingSub && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 max-w-4xl w-full space-y-4 shadow-2xl max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-start sm:items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-3 shrink-0">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-base text-gray-900 dark:text-white">
                    Faculty Submission: {previewingSub.faculty_name}
                  </h3>
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${
                    previewingSub.status === 'APPROVED' 
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' 
                      : previewingSub.status === 'CHANGES_REQUESTED'
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                      : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300'
                  }`}>
                    {previewingSub.status || 'SUBMITTED'}
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                  {previewingSub.designation || 'Faculty'} • {previewingSub.email} • Submitted: {previewingSub.submitted_at || 'Recently'}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    if (previewingSub.sections && Object.keys(previewingSub.sections).length > 0) {
                      setReportData(prev => ({
                        ...prev,
                        sections: {
                          ...(prev?.sections || {}),
                          ...previewingSub.sections
                        }
                      }));
                    }
                    setActiveTab('editor');
                    setPreviewingSub(null);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-bold hover:bg-indigo-100 dark:hover:bg-indigo-900/60 flex items-center gap-1.5 transition cursor-pointer"
                  title="Open this faculty's full report in the document editor"
                >
                  <FileText size={14} />
                  <span>Open Full Document View</span>
                </button>
                <button 
                  onClick={() => setPreviewingSub(null)} 
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-white p-1 rounded-lg"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Modal Body: Render Real Submitted Tables */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-xs">
              {/* 1. Student Events Organized */}
              <div className="border border-gray-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900">
                <div className="bg-gray-100 dark:bg-slate-800 px-3.5 py-2 font-bold text-gray-800 dark:text-slate-200 flex items-center justify-between">
                  <span>1. Programmes / Events Organized for Students</span>
                  <span className="text-[10px] font-semibold text-gray-500">
                    {(previewingSub.sections?.['1_student_events']?.length || 0)} entries
                  </span>
                </div>
                {previewingSub.sections?.['1_student_events']?.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-gray-50 dark:bg-slate-800/50 text-[10px] uppercase text-gray-500 font-bold border-b border-gray-200 dark:border-slate-700">
                        <tr>
                          <th className="p-2 w-10 text-center">#</th>
                          <th className="p-2">Event / Programme Name</th>
                          <th className="p-2">Duration</th>
                          <th className="p-2">Chief Guest / Resource Person</th>
                          <th className="p-2">Target Students</th>
                          <th className="p-2 text-center">Proof / Doc</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                        {previewingSub.sections['1_student_events'].map((ev, i) => (
                          <tr key={i} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/40">
                            <td className="p-2 text-center font-medium text-gray-400">{i + 1}</td>
                            <td className="p-2 font-semibold text-gray-900 dark:text-white">{ev.name || '-'}</td>
                            <td className="p-2 text-gray-600 dark:text-slate-300">{ev.duration || '1 day'}</td>
                            <td className="p-2 text-gray-600 dark:text-slate-300">{ev.chief_guest || '-'}</td>
                            <td className="p-2 text-gray-600 dark:text-slate-300">{ev.target || '-'}</td>
                            <td className="p-2 text-center">
                              {ev.proof_url ? (
                                <a href={ev.proof_url} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline font-bold text-[10px] inline-flex items-center gap-0.5">
                                  <span>Proof</span> <ExternalLink size={10} />
                                </a>
                              ) : <span className="text-gray-400 text-[10px]">-</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="p-3 text-xs text-gray-400 italic">No student events submitted for this period.</p>
                )}
              </div>

              {/* 2. Faculty Publications (Journals & Conferences) */}
              <div className="border border-gray-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900">
                <div className="bg-gray-100 dark:bg-slate-800 px-3.5 py-2 font-bold text-gray-800 dark:text-slate-200 flex items-center justify-between">
                  <span>6.a & 6.b Publications (Journals & Conferences)</span>
                  <span className="text-[10px] font-semibold text-gray-500">
                    {(previewingSub.sections?.['6_faculty_achievements']?.a_journal_publications?.length || 0) + (previewingSub.sections?.['6_faculty_achievements']?.b_conference_publications?.length || 0)} entries
                  </span>
                </div>
                {(previewingSub.sections?.['6_faculty_achievements']?.a_journal_publications?.length > 0 || previewingSub.sections?.['6_faculty_achievements']?.b_conference_publications?.length > 0) ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-gray-50 dark:bg-slate-800/50 text-[10px] uppercase text-gray-500 font-bold border-b border-gray-200 dark:border-slate-700">
                        <tr>
                          <th className="p-2 w-10 text-center">#</th>
                          <th className="p-2">Paper Title</th>
                          <th className="p-2">Journal / Conference</th>
                          <th className="p-2">ISSN / ISBN</th>
                          <th className="p-2">Indexing</th>
                          <th className="p-2 text-center">DOI / Link</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                        {(previewingSub.sections?.['6_faculty_achievements']?.a_journal_publications || []).map((pub, i) => (
                          <tr key={`j_${i}`} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/40">
                            <td className="p-2 text-center font-medium text-gray-400">{i + 1}</td>
                            <td className="p-2 font-semibold text-gray-900 dark:text-white">{pub.title || '-'}</td>
                            <td className="p-2 text-gray-600 dark:text-slate-300">{pub.journal || 'Journal'}</td>
                            <td className="p-2 text-gray-600 dark:text-slate-300">{pub.issn || '-'}</td>
                            <td className="p-2">
                              <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-bold text-[9px]">
                                {pub.indexing || 'Peer Reviewed'}
                              </span>
                            </td>
                            <td className="p-2 text-center">
                              {pub.doi ? (
                                <a href={`https://doi.org/${pub.doi.replace(/^https?:\/\/doi.org\//, '')}`} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline font-bold text-[10px] inline-flex items-center gap-0.5">
                                  <span>View DOI</span> <ExternalLink size={10} />
                                </a>
                              ) : <span className="text-gray-400 text-[10px]">-</span>}
                            </td>
                          </tr>
                        ))}
                        {(previewingSub.sections?.['6_faculty_achievements']?.b_conference_publications || []).map((conf, i) => (
                          <tr key={`c_${i}`} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/40">
                            <td className="p-2 text-center font-medium text-gray-400">{i + 1}</td>
                            <td className="p-2 font-semibold text-gray-900 dark:text-white">{conf.title || '-'}</td>
                            <td className="p-2 text-gray-600 dark:text-slate-300">{conf.conference_name || 'Conference'}</td>
                            <td className="p-2 text-gray-600 dark:text-slate-300">{conf.isbn || '-'}</td>
                            <td className="p-2">
                              <span className="px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 font-bold text-[9px]">
                                Conference
                              </span>
                            </td>
                            <td className="p-2 text-center">
                              {conf.proof_url ? (
                                <a href={conf.proof_url} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline font-bold text-[10px] inline-flex items-center gap-0.5">
                                  <span>Proof</span> <ExternalLink size={10} />
                                </a>
                              ) : <span className="text-gray-400 text-[10px]">-</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="p-3 text-xs text-gray-400 italic">No publications submitted for this period.</p>
                )}
              </div>

              {/* 3. Workshops & FDPs Attended / Organized */}
              <div className="border border-gray-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900">
                <div className="bg-gray-100 dark:bg-slate-800 px-3.5 py-2 font-bold text-gray-800 dark:text-slate-200 flex items-center justify-between">
                  <span>6.g Workshops & FDPs Attended</span>
                  <span className="text-[10px] font-semibold text-gray-500">
                    {(previewingSub.sections?.['6_faculty_achievements']?.g_workshops_attended?.length || 0)} entries
                  </span>
                </div>
                {previewingSub.sections?.['6_faculty_achievements']?.g_workshops_attended?.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-gray-50 dark:bg-slate-800/50 text-[10px] uppercase text-gray-500 font-bold border-b border-gray-200 dark:border-slate-700">
                        <tr>
                          <th className="p-2 w-10 text-center">#</th>
                          <th className="p-2">Program / FDP Title</th>
                          <th className="p-2">Organized By</th>
                          <th className="p-2">Dates / Duration</th>
                          <th className="p-2 text-center">Certificate</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                        {previewingSub.sections['6_faculty_achievements'].g_workshops_attended.map((fdp, i) => (
                          <tr key={i} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/40">
                            <td className="p-2 text-center font-medium text-gray-400">{i + 1}</td>
                            <td className="p-2 font-semibold text-gray-900 dark:text-white">{fdp.program_name || '-'}</td>
                            <td className="p-2 text-gray-600 dark:text-slate-300">{fdp.organized_by || '-'}</td>
                            <td className="p-2 text-gray-600 dark:text-slate-300">{fdp.duration || '-'}</td>
                            <td className="p-2 text-center">
                              {fdp.certificate_url ? (
                                <a href={fdp.certificate_url} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline font-bold text-[10px] inline-flex items-center gap-0.5">
                                  <span>Certificate</span> <ExternalLink size={10} />
                                </a>
                              ) : <span className="text-gray-400 text-[10px]">-</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="p-3 text-xs text-gray-400 italic">No FDPs or workshops attended submitted for this period.</p>
                )}
              </div>

              {/* 4. Student Achievements */}
              <div className="border border-gray-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900">
                <div className="bg-gray-100 dark:bg-slate-800 px-3.5 py-2 font-bold text-gray-800 dark:text-slate-200 flex items-center justify-between">
                  <span>5. Student Achievements (Curricular & Extracurricular)</span>
                  <span className="text-[10px] font-semibold text-gray-500">
                    {(previewingSub.sections?.['5_student_achievements']?.a_curricular?.length || 0) + (previewingSub.sections?.['5_student_achievements']?.b_extracurricular?.length || 0)} entries
                  </span>
                </div>
                {(previewingSub.sections?.['5_student_achievements']?.a_curricular?.length > 0 || previewingSub.sections?.['5_student_achievements']?.b_extracurricular?.length > 0) ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-gray-50 dark:bg-slate-800/50 text-[10px] uppercase text-gray-500 font-bold border-b border-gray-200 dark:border-slate-700">
                        <tr>
                          <th className="p-2 w-10 text-center">#</th>
                          <th className="p-2">Student Name</th>
                          <th className="p-2">Roll No</th>
                          <th className="p-2">Event / Competition</th>
                          <th className="p-2">Prize / Award</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                        {(previewingSub.sections?.['5_student_achievements']?.a_curricular || []).map((st, i) => (
                          <tr key={`cur_${i}`} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/40">
                            <td className="p-2 text-center font-medium text-gray-400">{i + 1}</td>
                            <td className="p-2 font-semibold text-gray-900 dark:text-white">{st.name || st.student_name || '-'}</td>
                            <td className="p-2 text-gray-600 dark:text-slate-300">{st.roll_no || '-'}</td>
                            <td className="p-2 text-gray-600 dark:text-slate-300">{st.event || st.event_name || '-'}</td>
                            <td className="p-2 font-bold text-amber-600">{st.prizes || st.award || '-'}</td>
                          </tr>
                        ))}
                        {(previewingSub.sections?.['5_student_achievements']?.b_extracurricular || []).map((st, i) => (
                          <tr key={`ext_${i}`} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/40">
                            <td className="p-2 text-center font-medium text-gray-400">{i + 1}</td>
                            <td className="p-2 font-semibold text-gray-900 dark:text-white">{st.name || st.student_name || '-'}</td>
                            <td className="p-2 text-gray-600 dark:text-slate-300">{st.roll_no || '-'}</td>
                            <td className="p-2 text-gray-600 dark:text-slate-300">{st.event || st.event_name || '-'}</td>
                            <td className="p-2 font-bold text-emerald-600">{st.prizes || st.award || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="p-3 text-xs text-gray-400 italic">No student achievements submitted for this period.</p>
                )}
              </div>

              {/* Notice when all tables are empty */}
              {(!previewingSub.sections || Object.keys(previewingSub.sections).length === 0 || (
                (previewingSub.sections['1_student_events']?.length || 0) === 0 &&
                (previewingSub.sections['6_faculty_achievements']?.a_journal_publications?.length || 0) === 0 &&
                (previewingSub.sections['6_faculty_achievements']?.g_workshops_attended?.length || 0) === 0 &&
                (previewingSub.sections['5_student_achievements']?.a_curricular?.length || 0) === 0
              )) && (
                <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl text-center space-y-2">
                  <p className="font-semibold text-amber-800 dark:text-amber-300">
                    ℹ️ No activity entries have been populated in this faculty submission yet.
                  </p>
                  <p className="text-gray-600 dark:text-slate-400 text-[11px]">
                    You can click <strong className="text-indigo-600">"Open Full Document View"</strong> to inspect the full report sheet, or click <strong className="text-amber-700">"Request Changes"</strong> to notify the faculty member to fill their activities.
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer Actions */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-gray-100 dark:border-slate-800 shrink-0">
              <button
                onClick={() => {
                  if (previewingSub.sections && Object.keys(previewingSub.sections).length > 0) {
                    setReportData(prev => ({
                      ...prev,
                      sections: {
                        ...(prev?.sections || {}),
                        ...previewingSub.sections
                      }
                    }));
                  }
                  setActiveTab('editor');
                  setPreviewingSub(null);
                }}
                className="px-3 py-1.5 rounded-xl border border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300 text-xs font-bold hover:bg-indigo-50 dark:hover:bg-indigo-950/40 flex items-center gap-1.5 transition cursor-pointer"
              >
                <FileText size={13} />
                <span>Open Full Document View</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPreviewingSub(null)}
                  className="px-3.5 py-1.5 rounded-xl border border-gray-300 dark:border-slate-700 text-xs font-bold text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  Close
                </button>

                <button
                  onClick={() => {
                    handleRequestChanges(previewingSub.id);
                    setPreviewingSub(null);
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-xs transition cursor-pointer"
                >
                  Request Changes
                </button>

                {previewingSub.status !== 'APPROVED' && (
                  <button
                    onClick={() => {
                      handleAcceptSubmission(previewingSub.id);
                      setPreviewingSub(null);
                    }}
                    className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition cursor-pointer"
                  >
                    ✓ Accept & Approve
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      {/* 📄 THE OFFICIAL PRINTABLE REPORT CONTAINER (Visible in Editor Tab or on Print) */}
      {(activeTab === 'editor') && (
        <div 
          ref={reportRef}
          className="bg-white text-black p-8 sm:p-12 shadow-2xl rounded-2xl border border-gray-300 print:shadow-none print:border-none print:p-0 print:m-0 print:rounded-none font-sans"
          style={{ color: '#000', backgroundColor: '#fff' }}
        >
        {/* Institutional Header Banner matching AVN template */}
        <div className="border-b-2 border-black pb-4 mb-6">
          <div className="flex items-center justify-between gap-4">
            {/* Left: Institute Badge */}
            <div className="flex items-center space-x-2">
              <div className="w-14 h-14 rounded-lg bg-[#0f172a] border-2 border-amber-600 flex flex-col items-center justify-center text-[9px] font-black text-white shadow-xs">
                <span className="text-amber-400 text-xs">AVN</span>
                <span className="text-[7px]">ESTD 2009</span>
              </div>
            </div>

            {/* Center: Institute Name and Subtitles */}
            <div className="text-center flex-1">
              <div
                className="cursor-pointer group inline-flex items-center justify-center gap-1.5"
                onClick={() => setIsEditingHeaderModal(true)}
                title="Click to edit institute name"
              >
                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-[#0f2347] uppercase leading-tight group-hover:text-indigo-800 transition">
                  {instituteName}
                </h2>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsEditingHeaderModal(true);
                  }}
                  className="print:hidden opacity-0 group-hover:opacity-100 p-0.5 text-gray-400 hover:text-indigo-600 transition"
                  title="Edit institute name"
                >
                  <Edit3 size={14} />
                </button>
              </div>

              <div
                className="cursor-pointer group flex items-center justify-center gap-1 mt-0.5"
                onClick={() => setIsEditingHeaderModal(true)}
                title="Click to edit tagline / accreditation"
              >
                <p className="text-xs font-bold text-gray-700 group-hover:text-indigo-700 transition">
                  {instituteSubtitle}
                </p>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsEditingHeaderModal(true);
                  }}
                  className="print:hidden opacity-0 group-hover:opacity-100 p-0.5 text-gray-400 hover:text-indigo-600 transition"
                  title="Edit tagline"
                >
                  <Edit3 size={11} />
                </button>
              </div>

              {/* Address / Location with inline edit */}
              {isEditing || isEditingAddress ? (
                <div className="flex items-center justify-center gap-1.5 mt-1 max-w-xl mx-auto">
                  <input
                    type="text"
                    value={instituteAddress}
                    onChange={(e) => setInstituteAddress(e.target.value)}
                    placeholder="Enter institute address / location..."
                    className="w-full text-center text-[10px] text-gray-800 font-medium bg-amber-50 border border-amber-300 focus:border-indigo-500 focus:bg-white rounded-md px-2 py-0.5 outline-none shadow-xs"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setIsEditingAddress(false)}
                    className="print:hidden px-2 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-bold shrink-0 cursor-pointer"
                    title="Done editing address"
                  >
                    ✓ Done
                  </button>
                </div>
              ) : (
                <div 
                  className="flex items-center justify-center gap-1 cursor-pointer group mt-0.5" 
                  onClick={() => setIsEditingAddress(true)} 
                  title="Click to edit institute address"
                >
                  <p className="text-[10px] text-gray-500 group-hover:text-indigo-700 transition">
                    {instituteAddress}
                  </p>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsEditingAddress(true);
                    }}
                    className="print:hidden opacity-0 group-hover:opacity-100 p-0.5 text-gray-400 hover:text-indigo-600 transition"
                    title="Edit address"
                  >
                    <Edit3 size={11} />
                  </button>
                </div>
              )}
            </div>

            {/* Right: Accreditations (NBA, NAAC, UGC) */}
            <div className="flex items-center space-x-2">
              <div className="px-2 py-1 bg-cyan-800 text-white text-[10px] font-black rounded border border-cyan-950">
                NBA
              </div>
              <div className="w-9 h-9 rounded-full bg-red-600 text-white flex flex-col items-center justify-center font-black text-[9px] border-2 border-amber-400">
                <span>A</span>
                <span className="text-[6px] -mt-1">NAAC</span>
              </div>
              <div className="w-8 h-8 rounded-full border border-gray-400 flex items-center justify-center text-[8px] font-bold text-gray-700">
                UGC
              </div>
            </div>
          </div>

          {/* Main Document Title - Inline Editable */}
          <div className="mt-4 pt-3 border-t border-gray-300 text-center relative group">
            {isEditing || isEditingTitle ? (
              <div className="space-y-1.5 max-w-4xl mx-auto">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={customReportTitle !== '' ? customReportTitle : defaultReportTitle}
                    onChange={(e) => setCustomReportTitle(e.target.value)}
                    placeholder="Enter Custom Report Title..."
                    className="w-full text-center text-sm sm:text-base font-black text-black tracking-wide uppercase bg-amber-50/80 border-2 border-amber-400 focus:border-indigo-600 focus:bg-white rounded-xl px-3 py-1.5 outline-none shadow-sm transition"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setIsEditingTitle(false)}
                    className="print:hidden px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shrink-0 cursor-pointer shadow-sm"
                    title="Done editing title"
                  >
                    ✓ Done
                  </button>
                  {customReportTitle !== '' && (
                    <button
                      type="button"
                      onClick={() => setCustomReportTitle('')}
                      className="print:hidden px-2.5 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl text-xs font-semibold shrink-0 cursor-pointer"
                      title="Reset to default title"
                    >
                      ↺ Reset
                    </button>
                  )}
                </div>
                <p className="print:hidden text-[10px] text-gray-500 font-medium">
                  ✏️ Custom Title Mode active. You can type any title here. Click "Done" or "Save Data to DB" to store persistently.
                </p>
              </div>
            ) : (
              <div 
                className="flex items-center justify-center gap-2 cursor-pointer group" 
                onClick={() => setIsEditingTitle(true)} 
                title="Click here to edit report title"
              >
                <h3 className="text-base sm:text-lg font-black text-black tracking-wide uppercase group-hover:text-indigo-800 transition">
                  {effectiveReportTitle}
                </h3>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsEditingTitle(true);
                  }}
                  className="print:hidden p-1 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                  title="Click to edit report title"
                >
                  <Edit3 size={15} />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 🔄 RESTORE BAR FOR DELETED/HIDDEN TABLES (Visible in Edit Mode) */}
        {isEditing && (reportData?.sections?.hidden_sections?.length > 0) && (
          <div className="mb-6 p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 rounded-xl print:hidden flex flex-wrap items-center justify-between gap-2 shadow-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-amber-900 dark:text-amber-300">
                Deleted / Hidden Tables ({reportData.sections.hidden_sections.length}):
              </span>
              <div className="flex flex-wrap gap-1.5">
                {reportData.sections.hidden_sections.map((key) => (
                  <button
                    key={key}
                    onClick={() => handleRestoreSection(key)}
                    className="px-2.5 py-1 bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700 rounded-lg text-[10px] font-bold text-amber-800 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-slate-700 flex items-center gap-1 cursor-pointer transition"
                  >
                    <Plus size={10} /> Restore {key.split('.').pop().replace(/_/g, ' ')}
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={handleRestoreAllSections}
              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
            >
              Restore All Tables
            </button>
          </div>
        )}

        {/* SECTION 1: Programmes / Events organized for the students */}
        {!isSectionHidden('1_student_events') && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-bold text-sm text-black">
                1. Programmes / Events organized for the students:
              </h4>
              {isEditing && (
                <div className="flex items-center gap-1.5 print:hidden">
                  <button
                    onClick={() => handleAddRow('1_student_events')}
                    className="px-2 py-1 rounded bg-indigo-50 border border-indigo-200 text-indigo-700 text-[10px] font-bold flex items-center gap-1 hover:bg-indigo-100 cursor-pointer"
                  >
                    <Plus size={12} /> + Add Event
                  </button>
                  <button
                    onClick={() => handleDeleteTable('1_student_events', '1. Programmes / Events organized for the students')}
                    className="px-2 py-1 rounded bg-rose-50 border border-rose-200 text-rose-700 text-[10px] font-bold flex items-center gap-1 hover:bg-rose-100 cursor-pointer"
                    title="Delete/Hide this table from the report"
                  >
                    <Trash2 size={11} /> Delete Table
                  </button>
                </div>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-[11px] border-collapse border border-black text-left">
                <thead>
                  <tr className="bg-gray-100 font-bold border-b border-black">
                    <th className="border border-black p-1.5 w-10 text-center">S.No</th>
                    <th className="border border-black p-1.5">Name of the Programme</th>
                    <th className="border border-black p-1.5 text-center">In Association with</th>
                    <th className="border border-black p-1.5">College/ Department level</th>
                    <th className="border border-black p-1.5">Duration</th>
                    <th className="border border-black p-1.5">Name and Details of Chief Guest / Resource person</th>
                    <th className="border border-black p-1.5 text-center">Honorarium paid Rs.</th>
                    <th className="border border-black p-1.5 text-center">Miscellaneous Expenses incurred Rs.</th>
                    <th className="border border-black p-1.5">Target students</th>
                    {isEditing && <th className="border border-black p-1.5 print:hidden w-8">Action</th>}
                  </tr>
                </thead>
                <tbody>
                  {getRows(s["1_student_events"]).length > 0 ? (
                    getRows(s["1_student_events"]).map((item, i) => (
                      <tr key={i} className="border-b border-black">
                        <td className="border border-black p-1.5 text-center font-medium">{item.s_no || i + 1}</td>
                        <td className="border border-black p-1.5 font-medium">
                          <EditableCell sectionPath="1_student_events" rowIndex={i} fieldKey="name" value={item.name} />
                        </td>
                        <td className="border border-black p-1.5 text-center">
                          <EditableCell sectionPath="1_student_events" rowIndex={i} fieldKey="association" value={item.association} />
                        </td>
                        <td className="border border-black p-1.5">
                          <EditableCell sectionPath="1_student_events" rowIndex={i} fieldKey="level" value={item.level} />
                        </td>
                        <td className="border border-black p-1.5">
                          <EditableCell sectionPath="1_student_events" rowIndex={i} fieldKey="duration" value={item.duration} />
                        </td>
                        <td className="border border-black p-1.5">
                          <EditableCell sectionPath="1_student_events" rowIndex={i} fieldKey="chief_guest" value={item.chief_guest} />
                        </td>
                        <td className="border border-black p-1.5 text-center">
                          <EditableCell sectionPath="1_student_events" rowIndex={i} fieldKey="honorarium" value={item.honorarium} />
                        </td>
                        <td className="border border-black p-1.5 text-center">
                          <EditableCell sectionPath="1_student_events" rowIndex={i} fieldKey="misc_expenses" value={item.misc_expenses} />
                        </td>
                        <td className="border border-black p-1.5">
                          <EditableCell sectionPath="1_student_events" rowIndex={i} fieldKey="target_students" value={item.target_students} />
                        </td>
                        {isEditing && (
                          <td className="border border-black p-1.5 print:hidden text-center">
                            <button onClick={() => handleDeleteRow('1_student_events', i)} className="text-rose-600 hover:text-rose-800 cursor-pointer">
                              <Trash2 size={12} />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))
                  ) : (
                    [1, 2].map(n => (
                      <tr key={n} className="border-b border-black h-7">
                        <td className="border border-black p-1.5 text-center">{n}</td>
                        <td className="border border-black p-1.5"></td>
                        <td className="border border-black p-1.5"></td>
                        <td className="border border-black p-1.5"></td>
                        <td className="border border-black p-1.5"></td>
                        <td className="border border-black p-1.5"></td>
                        <td className="border border-black p-1.5"></td>
                        <td className="border border-black p-1.5"></td>
                        <td className="border border-black p-1.5"></td>
                        {isEditing && <td className="border border-black p-1.5 print:hidden"></td>}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SECTION 2: Programmes / Events organized for the faculties */}
        {!isSectionHidden('2_faculty_events') && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-bold text-sm text-black">
                2. Programmes / Events organized for the faculties:
              </h4>
              {isEditing && (
                <div className="flex items-center gap-1.5 print:hidden">
                  <button
                    onClick={() => handleAddRow('2_faculty_events')}
                    className="px-2 py-1 rounded bg-indigo-50 border border-indigo-200 text-indigo-700 text-[10px] font-bold flex items-center gap-1 hover:bg-indigo-100 cursor-pointer"
                  >
                    <Plus size={12} /> + Add Row
                  </button>
                  <button
                    onClick={() => handleDeleteTable('2_faculty_events', '2. Programmes / Events organized for the faculties')}
                    className="px-2 py-1 rounded bg-rose-50 border border-rose-200 text-rose-700 text-[10px] font-bold flex items-center gap-1 hover:bg-rose-100 cursor-pointer"
                    title="Delete/Hide this table from the report"
                  >
                    <Trash2 size={11} /> Delete Table
                  </button>
                </div>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-[11px] border-collapse border border-black text-left">
                <thead>
                  <tr className="bg-gray-100 font-bold border-b border-black">
                    <th className="border border-black p-1.5 w-10 text-center">S.No</th>
                    <th className="border border-black p-1.5">Name of the Programme</th>
                    <th className="border border-black p-1.5 text-center">In Association with</th>
                    <th className="border border-black p-1.5">College/ department level</th>
                    <th className="border border-black p-1.5">Duration</th>
                    <th className="border border-black p-1.5">Name and Details of Chief Guest / Resource person</th>
                    <th className="border border-black p-1.5 text-center">No. Of faculty registered</th>
                    <th className="border border-black p-1.5 text-center">Honorarium paid Rs.</th>
                    <th className="border border-black p-1.5 text-center">Miscellaneous Expenses incurred Rs.</th>
                    {isEditing && <th className="border border-black p-1.5 print:hidden w-8">Action</th>}
                  </tr>
                </thead>
                <tbody>
                  {getRows(s["2_faculty_events"]).length > 0 ? (
                    getRows(s["2_faculty_events"]).map((item, i) => (
                      <tr key={i} className="border-b border-black">
                        <td className="border border-black p-1.5 text-center">{item.s_no || i + 1}</td>
                        <td className="border border-black p-1.5 font-medium">
                          <EditableCell sectionPath="2_faculty_events" rowIndex={i} fieldKey="name" value={item.name} />
                        </td>
                        <td className="border border-black p-1.5 text-center">
                          <EditableCell sectionPath="2_faculty_events" rowIndex={i} fieldKey="association" value={item.association} />
                        </td>
                        <td className="border border-black p-1.5">
                          <EditableCell sectionPath="2_faculty_events" rowIndex={i} fieldKey="level" value={item.level} />
                        </td>
                        <td className="border border-black p-1.5">
                          <EditableCell sectionPath="2_faculty_events" rowIndex={i} fieldKey="duration" value={item.duration} />
                        </td>
                        <td className="border border-black p-1.5">
                          <EditableCell sectionPath="2_faculty_events" rowIndex={i} fieldKey="chief_guest" value={item.chief_guest} />
                        </td>
                        <td className="border border-black p-1.5 text-center">
                          <EditableCell sectionPath="2_faculty_events" rowIndex={i} fieldKey="faculty_count" value={item.faculty_count} />
                        </td>
                        <td className="border border-black p-1.5 text-center">
                          <EditableCell sectionPath="2_faculty_events" rowIndex={i} fieldKey="honorarium" value={item.honorarium} />
                        </td>
                        <td className="border border-black p-1.5 text-center">
                          <EditableCell sectionPath="2_faculty_events" rowIndex={i} fieldKey="misc_expenses" value={item.misc_expenses} />
                        </td>
                        {isEditing && (
                          <td className="border border-black p-1.5 print:hidden text-center">
                            <button onClick={() => handleDeleteRow('2_faculty_events', i)} className="text-rose-600 hover:text-rose-800 cursor-pointer">
                              <Trash2 size={12} />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))
                  ) : (
                    [1, 2].map(n => (
                      <tr key={n} className="border-b border-black h-7">
                        <td className="border border-black p-1.5 text-center">{n}</td>
                        <td className="border border-black p-1.5"></td>
                        <td className="border border-black p-1.5"></td>
                        <td className="border border-black p-1.5"></td>
                        <td className="border border-black p-1.5"></td>
                        <td className="border border-black p-1.5"></td>
                        <td className="border border-black p-1.5"></td>
                        <td className="border border-black p-1.5"></td>
                        <td className="border border-black p-1.5"></td>
                        {isEditing && <td className="border border-black p-1.5 print:hidden"></td>}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SECTION 3: Value Added / Certification Courses */}
        {!isSectionHidden('3_value_added_courses') && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-bold text-sm text-black">
                3. Value Added / Certification Courses conducted:
              </h4>
              {isEditing && (
                <div className="flex items-center gap-1.5 print:hidden">
                  <button
                    onClick={() => handleAddRow('3_value_added_courses')}
                    className="px-2 py-1 rounded bg-indigo-50 border border-indigo-200 text-indigo-700 text-[10px] font-bold flex items-center gap-1 hover:bg-indigo-100 cursor-pointer"
                  >
                    <Plus size={12} /> + Add Course
                  </button>
                  <button
                    onClick={() => handleDeleteTable('3_value_added_courses', '3. Value Added / Certification Courses conducted')}
                    className="px-2 py-1 rounded bg-rose-50 border border-rose-200 text-rose-700 text-[10px] font-bold flex items-center gap-1 hover:bg-rose-100 cursor-pointer"
                    title="Delete/Hide this table from the report"
                  >
                    <Trash2 size={11} /> Delete Table
                  </button>
                </div>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-[11px] border-collapse border border-black text-left">
                <thead>
                  <tr className="bg-gray-100 font-bold border-b border-black">
                    <th className="border border-black p-1.5 w-10 text-center">S.No</th>
                    <th className="border border-black p-1.5">Name of the Course</th>
                    <th className="border border-black p-1.5">Particulars of the Resource persons (Internal / External)</th>
                    <th className="border border-black p-1.5">College/ department level</th>
                    <th className="border border-black p-1.5">Duration</th>
                    <th className="border border-black p-1.5 text-center">No. of Contact Periods</th>
                    <th className="border border-black p-1.5 text-center">No. Of Students registered</th>
                    <th className="border border-black p-1.5 text-center">Remuneration/ honorarium paid, if any.</th>
                    <th className="border border-black p-1.5">Target students</th>
                    {isEditing && <th className="border border-black p-1.5 print:hidden w-8">Action</th>}
                  </tr>
                </thead>
                <tbody>
                  {getRows(s["3_value_added_courses"]).length > 0 ? (
                    getRows(s["3_value_added_courses"]).map((item, i) => (
                      <tr key={i} className="border-b border-black">
                        <td className="border border-black p-1.5 text-center">{item.s_no || i + 1}</td>
                        <td className="border border-black p-1.5 font-medium">
                          <EditableCell sectionPath="3_value_added_courses" rowIndex={i} fieldKey="name" value={item.name} />
                        </td>
                        <td className="border border-black p-1.5">
                          <EditableCell sectionPath="3_value_added_courses" rowIndex={i} fieldKey="resource_person" value={item.resource_person} />
                        </td>
                        <td className="border border-black p-1.5">
                          <EditableCell sectionPath="3_value_added_courses" rowIndex={i} fieldKey="level" value={item.level} />
                        </td>
                        <td className="border border-black p-1.5">
                          <EditableCell sectionPath="3_value_added_courses" rowIndex={i} fieldKey="duration" value={item.duration} />
                        </td>
                        <td className="border border-black p-1.5 text-center">
                          <EditableCell sectionPath="3_value_added_courses" rowIndex={i} fieldKey="contact_periods" value={item.contact_periods} />
                        </td>
                        <td className="border border-black p-1.5 text-center">
                          <EditableCell sectionPath="3_value_added_courses" rowIndex={i} fieldKey="students_registered" value={item.students_registered} />
                        </td>
                        <td className="border border-black p-1.5 text-center">
                          <EditableCell sectionPath="3_value_added_courses" rowIndex={i} fieldKey="remuneration" value={item.remuneration} />
                        </td>
                        <td className="border border-black p-1.5">
                          <EditableCell sectionPath="3_value_added_courses" rowIndex={i} fieldKey="target_students" value={item.target_students} />
                        </td>
                        {isEditing && (
                          <td className="border border-black p-1.5 print:hidden text-center">
                            <button onClick={() => handleDeleteRow('3_value_added_courses', i)} className="text-rose-600 hover:text-rose-800 cursor-pointer">
                              <Trash2 size={12} />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))
                  ) : (
                    [1, 2].map(n => (
                      <tr key={n} className="border-b border-black h-7">
                        <td className="border border-black p-1.5 text-center">{n}</td>
                        <td className="border border-black p-1.5"></td>
                        <td className="border border-black p-1.5"></td>
                        <td className="border border-black p-1.5"></td>
                        <td className="border border-black p-1.5"></td>
                        <td className="border border-black p-1.5"></td>
                        <td className="border border-black p-1.5"></td>
                        <td className="border border-black p-1.5"></td>
                        <td className="border border-black p-1.5"></td>
                        {isEditing && <td className="border border-black p-1.5 print:hidden"></td>}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SECTION 4: Activities for Advanced learners */}
        {!isSectionHidden('4_advanced_learners') && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-bold text-sm text-black">
                4. Activities Arranged/conducted for Advanced learners:
              </h4>
              {isEditing && (
                <div className="flex items-center gap-1.5 print:hidden">
                  <button
                    onClick={() => handleAddRow('4_advanced_learners')}
                    className="px-2 py-1 rounded bg-indigo-50 border border-indigo-200 text-indigo-700 text-[10px] font-bold flex items-center gap-1 hover:bg-indigo-100 cursor-pointer"
                  >
                    <Plus size={12} /> + Add Activity
                  </button>
                  <button
                    onClick={() => handleDeleteTable('4_advanced_learners', '4. Activities for Advanced learners')}
                    className="px-2 py-1 rounded bg-rose-50 border border-rose-200 text-rose-700 text-[10px] font-bold flex items-center gap-1 hover:bg-rose-100 cursor-pointer"
                    title="Delete/Hide this table from the report"
                  >
                    <Trash2 size={11} /> Delete Table
                  </button>
                </div>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-[11px] border-collapse border border-black text-left">
                <thead>
                  <tr className="bg-gray-100 font-bold border-b border-black">
                    <th className="border border-black p-1.5 w-10 text-center">S.No</th>
                    <th className="border border-black p-1.5">Name of the Activity</th>
                    <th className="border border-black p-1.5">College/ department level</th>
                    <th className="border border-black p-1.5">Duration</th>
                    <th className="border border-black p-1.5 text-center">No. of Contact Periods</th>
                    <th className="border border-black p-1.5">Name and Details of Chief Guest / Resource person</th>
                    <th className="border border-black p-1.5 text-center">Honorarium paid Rs.</th>
                    <th className="border border-black p-1.5 text-center">Miscellaneous Expenses incurred Rs.</th>
                    <th className="border border-black p-1.5">Target students</th>
                    {isEditing && <th className="border border-black p-1.5 print:hidden w-8">Action</th>}
                  </tr>
                </thead>
                <tbody>
                  {getRows(s["4_advanced_learners"]).length > 0 ? (
                    getRows(s["4_advanced_learners"]).map((item, i) => (
                      <tr key={i} className="border-b border-black">
                        <td className="border border-black p-1.5 text-center">{item.s_no || i + 1}</td>
                        <td className="border border-black p-1.5 font-medium">
                          <EditableCell sectionPath="4_advanced_learners" rowIndex={i} fieldKey="name" value={item.name} />
                        </td>
                        <td className="border border-black p-1.5">
                          <EditableCell sectionPath="4_advanced_learners" rowIndex={i} fieldKey="level" value={item.level} />
                        </td>
                        <td className="border border-black p-1.5">
                          <EditableCell sectionPath="4_advanced_learners" rowIndex={i} fieldKey="duration" value={item.duration} />
                        </td>
                        <td className="border border-black p-1.5 text-center">
                          <EditableCell sectionPath="4_advanced_learners" rowIndex={i} fieldKey="contact_periods" value={item.contact_periods} />
                        </td>
                        <td className="border border-black p-1.5">
                          <EditableCell sectionPath="4_advanced_learners" rowIndex={i} fieldKey="chief_guest" value={item.chief_guest} />
                        </td>
                        <td className="border border-black p-1.5 text-center">
                          <EditableCell sectionPath="4_advanced_learners" rowIndex={i} fieldKey="honorarium" value={item.honorarium} />
                        </td>
                        <td className="border border-black p-1.5 text-center">
                          <EditableCell sectionPath="4_advanced_learners" rowIndex={i} fieldKey="misc_expenses" value={item.misc_expenses} />
                        </td>
                        <td className="border border-black p-1.5">
                          <EditableCell sectionPath="4_advanced_learners" rowIndex={i} fieldKey="target_students" value={item.target_students} />
                        </td>
                        {isEditing && (
                          <td className="border border-black p-1.5 print:hidden text-center">
                            <button onClick={() => handleDeleteRow('4_advanced_learners', i)} className="text-rose-600 hover:text-rose-800 cursor-pointer">
                              <Trash2 size={12} />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))
                  ) : (
                    [1, 2].map(n => (
                      <tr key={n} className="border-b border-black h-7">
                        <td className="border border-black p-1.5 text-center">{n}</td>
                        <td className="border border-black p-1.5"></td>
                        <td className="border border-black p-1.5"></td>
                        <td className="border border-black p-1.5"></td>
                        <td className="border border-black p-1.5"></td>
                        <td className="border border-black p-1.5"></td>
                        <td className="border border-black p-1.5"></td>
                        <td className="border border-black p-1.5"></td>
                        <td className="border border-black p-1.5"></td>
                        {isEditing && <td className="border border-black p-1.5 print:hidden"></td>}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SECTION 5: Student Achievements */}
        <div className="mb-6">
          <h4 className="font-bold text-sm text-black mb-3">
            5. Student Achievements:
          </h4>

          {/* 5.a */}
          {!isSectionHidden('5_student_achievements.a_curricular') && (
            <div className="mb-4 pl-2">
              <div className="flex items-center justify-between mb-1.5">
                <h5 className="font-semibold text-xs text-black">
                  a. Curricular & Co Curricular Activities (Seminars/ Symposiums /Hackathons/Conference etc.)
                </h5>
                {isEditing && (
                  <div className="flex items-center gap-1.5 print:hidden">
                    <button
                      onClick={() => handleAddRow('5_student_achievements.a_curricular')}
                      className="px-2 py-0.5 rounded bg-indigo-50 border border-indigo-200 text-indigo-700 text-[10px] font-bold flex items-center gap-1 hover:bg-indigo-100 cursor-pointer"
                    >
                      <Plus size={11} /> + Add
                    </button>
                    <button
                      onClick={() => handleDeleteTable('5_student_achievements.a_curricular', '5.a Curricular Activities')}
                      className="px-2 py-0.5 rounded bg-rose-50 border border-rose-200 text-rose-700 text-[10px] font-bold flex items-center gap-1 hover:bg-rose-100 cursor-pointer"
                    >
                      <Trash2 size={11} /> Delete Table
                    </button>
                  </div>
                )}
              </div>
              <table className="w-full text-[11px] border-collapse border border-black text-left">
                <thead>
                  <tr className="bg-gray-100 font-bold border-b border-black">
                    <th className="border border-black p-1.5 w-10 text-center">S.No</th>
                    <th className="border border-black p-1.5">Roll. No</th>
                    <th className="border border-black p-1.5">Name of the Students</th>
                    <th className="border border-black p-1.5 text-center">Year & Sem</th>
                    <th className="border border-black p-1.5">Name of the event</th>
                    <th className="border border-black p-1.5">Organised by</th>
                    <th className="border border-black p-1.5">Duration</th>
                    <th className="border border-black p-1.5">Prizes won, if any.</th>
                    {isEditing && <th className="border border-black p-1.5 print:hidden w-8">Action</th>}
                  </tr>
                </thead>
                <tbody>
                  {getRows(s["5_student_achievements"]?.a_curricular).length > 0 ? (
                    getRows(s["5_student_achievements"]?.a_curricular).map((item, i) => (
                      <tr key={i} className="border-b border-black">
                        <td className="border border-black p-1.5 text-center">{item.s_no || i + 1}</td>
                        <td className="border border-black p-1.5 font-mono">
                          <EditableCell sectionPath="5_student_achievements.a_curricular" rowIndex={i} fieldKey="roll_no" value={item.roll_no} />
                        </td>
                        <td className="border border-black p-1.5 font-medium">
                          <EditableCell sectionPath="5_student_achievements.a_curricular" rowIndex={i} fieldKey="name" value={item.name} />
                        </td>
                        <td className="border border-black p-1.5 text-center">
                          <EditableCell sectionPath="5_student_achievements.a_curricular" rowIndex={i} fieldKey="year_sem" value={item.year_sem} />
                        </td>
                        <td className="border border-black p-1.5">
                          <EditableCell sectionPath="5_student_achievements.a_curricular" rowIndex={i} fieldKey="event_name" value={item.event_name} />
                        </td>
                        <td className="border border-black p-1.5">
                          <EditableCell sectionPath="5_student_achievements.a_curricular" rowIndex={i} fieldKey="organized_by" value={item.organized_by} />
                        </td>
                        <td className="border border-black p-1.5">
                          <EditableCell sectionPath="5_student_achievements.a_curricular" rowIndex={i} fieldKey="duration" value={item.duration} />
                        </td>
                        <td className="border border-black p-1.5">
                          <EditableCell sectionPath="5_student_achievements.a_curricular" rowIndex={i} fieldKey="prizes" value={item.prizes} />
                        </td>
                        {isEditing && (
                          <td className="border border-black p-1.5 print:hidden text-center">
                            <button onClick={() => handleDeleteRow('5_student_achievements.a_curricular', i)} className="text-rose-600 hover:text-rose-800 cursor-pointer">
                              <Trash2 size={12} />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))
                  ) : (
                    [1, 2].map(n => (
                      <tr key={n} className="border-b border-black h-7">
                        <td className="border border-black p-1.5 text-center">{n}</td>
                        <td className="border border-black p-1.5"></td>
                        <td className="border border-black p-1.5"></td>
                        <td className="border border-black p-1.5"></td>
                        <td className="border border-black p-1.5"></td>
                        <td className="border border-black p-1.5"></td>
                        <td className="border border-black p-1.5"></td>
                        <td className="border border-black p-1.5"></td>
                        {isEditing && <td className="border border-black p-1.5 print:hidden"></td>}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* 5.b */}
          {!isSectionHidden('5_student_achievements.b_extracurricular') && (
            <div className="mb-4 pl-2">
              <div className="flex items-center justify-between mb-1.5">
                <h5 className="font-semibold text-xs text-black">
                  b. Extracurricular Activities (Cultural / Games & Sports)
                </h5>
                {isEditing && (
                  <div className="flex items-center gap-1.5 print:hidden">
                    <button
                      onClick={() => handleAddRow('5_student_achievements.b_extracurricular')}
                      className="px-2 py-0.5 rounded bg-indigo-50 border border-indigo-200 text-indigo-700 text-[10px] font-bold flex items-center gap-1 hover:bg-indigo-100 cursor-pointer"
                    >
                      <Plus size={11} /> + Add
                    </button>
                    <button
                      onClick={() => handleDeleteTable('5_student_achievements.b_extracurricular', '5.b Extracurricular Activities')}
                      className="px-2 py-0.5 rounded bg-rose-50 border border-rose-200 text-rose-700 text-[10px] font-bold flex items-center gap-1 hover:bg-rose-100 cursor-pointer"
                    >
                      <Trash2 size={11} /> Delete Table
                    </button>
                  </div>
                )}
              </div>
              <table className="w-full text-[11px] border-collapse border border-black text-left">
                <thead>
                  <tr className="bg-gray-100 font-bold border-b border-black">
                    <th className="border border-black p-1.5 w-10 text-center">S.No</th>
                    <th className="border border-black p-1.5">Roll. No</th>
                    <th className="border border-black p-1.5">Name of the Students</th>
                    <th className="border border-black p-1.5 text-center">Year & Sem</th>
                    <th className="border border-black p-1.5">Name of the event</th>
                    <th className="border border-black p-1.5">Organised by</th>
                    <th className="border border-black p-1.5">Duration</th>
                    <th className="border border-black p-1.5">Prizes won, if any.</th>
                    {isEditing && <th className="border border-black p-1.5 print:hidden w-8">Action</th>}
                  </tr>
                </thead>
                <tbody>
                  {getRows(s["5_student_achievements"]?.b_extracurricular).length > 0 ? (
                    getRows(s["5_student_achievements"]?.b_extracurricular).map((item, i) => (
                      <tr key={i} className="border-b border-black">
                        <td className="border border-black p-1.5 text-center">{item.s_no || i + 1}</td>
                        <td className="border border-black p-1.5 font-mono">
                          <EditableCell sectionPath="5_student_achievements.b_extracurricular" rowIndex={i} fieldKey="roll_no" value={item.roll_no} />
                        </td>
                        <td className="border border-black p-1.5 font-medium">
                          <EditableCell sectionPath="5_student_achievements.b_extracurricular" rowIndex={i} fieldKey="name" value={item.name} />
                        </td>
                        <td className="border border-black p-1.5 text-center">
                          <EditableCell sectionPath="5_student_achievements.b_extracurricular" rowIndex={i} fieldKey="year_sem" value={item.year_sem} />
                        </td>
                        <td className="border border-black p-1.5">
                          <EditableCell sectionPath="5_student_achievements.b_extracurricular" rowIndex={i} fieldKey="event_name" value={item.event_name} />
                        </td>
                        <td className="border border-black p-1.5">
                          <EditableCell sectionPath="5_student_achievements.b_extracurricular" rowIndex={i} fieldKey="organized_by" value={item.organized_by} />
                        </td>
                        <td className="border border-black p-1.5">
                          <EditableCell sectionPath="5_student_achievements.b_extracurricular" rowIndex={i} fieldKey="duration" value={item.duration} />
                        </td>
                        <td className="border border-black p-1.5">
                          <EditableCell sectionPath="5_student_achievements.b_extracurricular" rowIndex={i} fieldKey="prizes" value={item.prizes} />
                        </td>
                        {isEditing && (
                          <td className="border border-black p-1.5 print:hidden text-center">
                            <button onClick={() => handleDeleteRow('5_student_achievements.b_extracurricular', i)} className="text-rose-600 hover:text-rose-800 cursor-pointer">
                              <Trash2 size={12} />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))
                  ) : (
                    [1, 2].map(n => (
                      <tr key={n} className="border-b border-black h-7">
                        <td className="border border-black p-1.5 text-center">{n}</td>
                        <td className="border border-black p-1.5"></td>
                        <td className="border border-black p-1.5"></td>
                        <td className="border border-black p-1.5"></td>
                        <td className="border border-black p-1.5"></td>
                        <td className="border border-black p-1.5"></td>
                        <td className="border border-black p-1.5"></td>
                        <td className="border border-black p-1.5"></td>
                        {isEditing && <td className="border border-black p-1.5 print:hidden"></td>}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* 5.c */}
          {!isSectionHidden('5_student_achievements.c_online_certifications') && (
            <div className="mb-4 pl-2">
              <div className="flex items-center justify-between mb-1.5">
                <h5 className="font-semibold text-xs text-black">
                  c. Online Certification Courses (NPTEL, COURSERA & OTHERS) pursued / Internships undergone:
                </h5>
                {isEditing && (
                  <div className="flex items-center gap-1.5 print:hidden">
                    <button
                      onClick={() => handleAddRow('5_student_achievements.c_online_certifications')}
                      className="px-2 py-0.5 rounded bg-indigo-50 border border-indigo-200 text-indigo-700 text-[10px] font-bold flex items-center gap-1 hover:bg-indigo-100 cursor-pointer"
                    >
                      <Plus size={11} /> + Add Certification
                    </button>
                    <button
                      onClick={() => handleDeleteTable('5_student_achievements.c_online_certifications', '5.c Online Certifications')}
                      className="px-2 py-0.5 rounded bg-rose-50 border border-rose-200 text-rose-700 text-[10px] font-bold flex items-center gap-1 hover:bg-rose-100 cursor-pointer"
                    >
                      <Trash2 size={11} /> Delete Table
                    </button>
                  </div>
                )}
              </div>
              <table className="w-full text-[11px] border-collapse border border-black text-left">
                <thead>
                  <tr className="bg-gray-100 font-bold border-b border-black">
                    <th className="border border-black p-1.5 w-10 text-center">S.No</th>
                    <th className="border border-black p-1.5">Roll. No</th>
                    <th className="border border-black p-1.5">Name of the Students</th>
                    <th className="border border-black p-1.5 text-center">Year & Sem</th>
                    <th className="border border-black p-1.5">Name of the Certification course/Internship</th>
                    <th className="border border-black p-1.5">Organised by</th>
                    <th className="border border-black p-1.5">Duration</th>
                    <th className="border border-black p-1.5">Grade secured / Paid or Unpaid Internship</th>
                    {isEditing && <th className="border border-black p-1.5 print:hidden w-8">Action</th>}
                  </tr>
                </thead>
                <tbody>
                  {getRows(s["5_student_achievements"]?.c_online_certifications).length > 0 ? (
                    getRows(s["5_student_achievements"]?.c_online_certifications).map((item, i) => (
                      <tr key={i} className="border-b border-black">
                        <td className="border border-black p-1.5 text-center">{item.s_no || i + 1}</td>
                        <td className="border border-black p-1.5 font-medium">
                          <EditableCell sectionPath="5_student_achievements.c_online_certifications" rowIndex={i} fieldKey="roll_no" value={item.roll_no} />
                        </td>
                        <td className="border border-black p-1.5">
                          <EditableCell sectionPath="5_student_achievements.c_online_certifications" rowIndex={i} fieldKey="name" value={item.name} />
                        </td>
                        <td className="border border-black p-1.5 text-center">
                          <EditableCell sectionPath="5_student_achievements.c_online_certifications" rowIndex={i} fieldKey="year_sem" value={item.year_sem} />
                        </td>
                        <td className="border border-black p-1.5 font-medium">
                          <EditableCell sectionPath="5_student_achievements.c_online_certifications" rowIndex={i} fieldKey="course_name" value={item.course_name} />
                        </td>
                        <td className="border border-black p-1.5">
                          <EditableCell sectionPath="5_student_achievements.c_online_certifications" rowIndex={i} fieldKey="organized_by" value={item.organized_by} />
                        </td>
                        <td className="border border-black p-1.5">
                          <EditableCell sectionPath="5_student_achievements.c_online_certifications" rowIndex={i} fieldKey="duration" value={item.duration} />
                        </td>
                        <td className="border border-black p-1.5">
                          <EditableCell sectionPath="5_student_achievements.c_online_certifications" rowIndex={i} fieldKey="grade" value={item.grade} />
                        </td>
                        {isEditing && (
                          <td className="border border-black p-1.5 print:hidden text-center">
                            <button onClick={() => handleDeleteRow('5_student_achievements.c_online_certifications', i)} className="text-rose-600 hover:text-rose-800 cursor-pointer">
                              <Trash2 size={12} />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))
                  ) : (
                    [1, 2].map(n => (
                      <tr key={n} className="border-b border-black h-7">
                        <td className="border border-black p-1.5 text-center">{n}</td>
                        <td className="border border-black p-1.5"></td>
                        <td className="border border-black p-1.5"></td>
                        <td className="border border-black p-1.5"></td>
                        <td className="border border-black p-1.5"></td>
                        <td className="border border-black p-1.5"></td>
                        <td className="border border-black p-1.5"></td>
                        <td className="border border-black p-1.5"></td>
                        {isEditing && <td className="border border-black p-1.5 print:hidden"></td>}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* 5.d Placements */}
          <div className="mb-4 pl-2">
            <h5 className="font-semibold text-xs text-black mb-1.5">
              d. Placements:
            </h5>
            
            {/* DS - BYD Table */}
            {!isSectionHidden('5_student_achievements.d_placements.ds_byd') && (
              <div className="mb-4">
                <div className="flex items-center justify-between font-bold text-[11px] bg-gray-100 border border-black px-2 py-1 uppercase">
                  <span>DS - BYD</span>
                  {isEditing && (
                    <div className="flex items-center gap-2 print:hidden">
                      <button
                        onClick={() => handleAddRow('5_student_achievements.d_placements.ds_byd')}
                        className="text-indigo-700 hover:text-indigo-900 text-[10px] font-bold cursor-pointer"
                      >
                        + Add Placed Student
                      </button>
                      <button
                        onClick={() => handleDeleteTable('5_student_achievements.d_placements.ds_byd', 'Placements DS - BYD')}
                        className="text-rose-600 hover:text-rose-800 text-[10px] font-bold flex items-center gap-0.5 cursor-pointer"
                      >
                        <Trash2 size={10} /> Delete Table
                      </button>
                    </div>
                  )}
                </div>
                <table className="w-full text-[11px] border-collapse border border-black text-left">
                  <thead>
                    <tr className="bg-gray-50 font-bold border-b border-black">
                      <th className="border border-black p-1.5 w-10 text-center">S.No</th>
                      <th className="border border-black p-1.5">Name</th>
                      <th className="border border-black p-1.5">Roll No</th>
                      <th className="border border-black p-1.5">Date of Appointment</th>
                      {isEditing && <th className="border border-black p-1.5 print:hidden w-8">Action</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {getRows(s["5_student_achievements"]?.d_placements?.ds_byd).length > 0 ? (
                      getRows(s["5_student_achievements"]?.d_placements?.ds_byd).map((item, i) => (
                        <tr key={i} className="border-b border-black">
                          <td className="border border-black p-1.5 text-center">{item.s_no || i + 1}</td>
                          <td className="border border-black p-1.5 font-medium">
                            <EditableCell sectionPath="5_student_achievements.d_placements.ds_byd" rowIndex={i} fieldKey="name" value={item.name} />
                          </td>
                          <td className="border border-black p-1.5 font-mono">
                            <EditableCell sectionPath="5_student_achievements.d_placements.ds_byd" rowIndex={i} fieldKey="roll_no" value={item.roll_no} />
                          </td>
                          <td className="border border-black p-1.5">
                            <EditableCell sectionPath="5_student_achievements.d_placements.ds_byd" rowIndex={i} fieldKey="date" value={item.date} />
                          </td>
                          {isEditing && (
                            <td className="border border-black p-1.5 print:hidden text-center">
                              <button onClick={() => handleDeleteRow('5_student_achievements.d_placements.ds_byd', i)} className="text-rose-600 hover:text-rose-800 cursor-pointer">
                                <Trash2 size={12} />
                              </button>
                            </td>
                          )}
                        </tr>
                      ))
                    ) : (
                      [1, 2].map(n => (
                        <tr key={n} className="border-b border-black h-7">
                          <td className="border border-black p-1.5 text-center">{n}</td>
                          <td className="border border-black p-1.5"></td>
                          <td className="border border-black p-1.5"></td>
                          <td className="border border-black p-1.5"></td>
                          {isEditing && <td className="border border-black p-1.5 print:hidden"></td>}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* AI & DS - BYD Table */}
            {!isSectionHidden('5_student_achievements.d_placements.aids_byd') && (
              <div>
                <div className="flex items-center justify-between font-bold text-[11px] bg-gray-100 border border-black px-2 py-1 uppercase">
                  <span>AI & DS - BYD</span>
                  {isEditing && (
                    <div className="flex items-center gap-2 print:hidden">
                      <button
                        onClick={() => handleAddRow('5_student_achievements.d_placements.aids_byd')}
                        className="text-indigo-700 hover:text-indigo-900 text-[10px] font-bold cursor-pointer"
                      >
                        + Add Placed Student
                      </button>
                      <button
                        onClick={() => handleDeleteTable('5_student_achievements.d_placements.aids_byd', 'Placements AI & DS - BYD')}
                        className="text-rose-600 hover:text-rose-800 text-[10px] font-bold flex items-center gap-0.5 cursor-pointer"
                      >
                        <Trash2 size={10} /> Delete Table
                      </button>
                    </div>
                  )}
                </div>
                <table className="w-full text-[11px] border-collapse border border-black text-left">
                  <thead>
                    <tr className="bg-gray-50 font-bold border-b border-black">
                      <th className="border border-black p-1.5 w-10 text-center">S.No</th>
                      <th className="border border-black p-1.5">Name</th>
                      <th className="border border-black p-1.5">Roll No</th>
                      <th className="border border-black p-1.5">Date of Appointment</th>
                      {isEditing && <th className="border border-black p-1.5 print:hidden w-8">Action</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {getRows(s["5_student_achievements"]?.d_placements?.aids_byd).length > 0 ? (
                      getRows(s["5_student_achievements"]?.d_placements?.aids_byd).map((item, i) => (
                        <tr key={i} className="border-b border-black">
                          <td className="border border-black p-1.5 text-center">{item.s_no || i + 1}</td>
                          <td className="border border-black p-1.5 font-medium">
                            <EditableCell sectionPath="5_student_achievements.d_placements.aids_byd" rowIndex={i} fieldKey="name" value={item.name} />
                          </td>
                          <td className="border border-black p-1.5 font-mono">
                            <EditableCell sectionPath="5_student_achievements.d_placements.aids_byd" rowIndex={i} fieldKey="roll_no" value={item.roll_no} />
                          </td>
                          <td className="border border-black p-1.5">
                            <EditableCell sectionPath="5_student_achievements.d_placements.aids_byd" rowIndex={i} fieldKey="date" value={item.date} />
                          </td>
                          {isEditing && (
                            <td className="border border-black p-1.5 print:hidden text-center">
                              <button onClick={() => handleDeleteRow('5_student_achievements.d_placements.aids_byd', i)} className="text-rose-600 hover:text-rose-800 cursor-pointer">
                                <Trash2 size={12} />
                              </button>
                            </td>
                          )}
                        </tr>
                      ))
                    ) : (
                      [1, 2].map(n => (
                        <tr key={n} className="border-b border-black h-7">
                          <td className="border border-black p-1.5 text-center">{n}</td>
                          <td className="border border-black p-1.5"></td>
                          <td className="border border-black p-1.5"></td>
                          <td className="border border-black p-1.5"></td>
                          {isEditing && <td className="border border-black p-1.5 print:hidden"></td>}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* SECTION 6: Faculty Achievements */}
        <div className="mb-6">
          <h4 className="font-bold text-sm text-black mb-3">
            6. Faculty Achievements:
          </h4>

          {/* 6.a */}
          {!isSectionHidden('6_faculty_achievements.a_journal_publications') && (
            <div className="mb-4 pl-2">
              <div className="flex items-center justify-between mb-1.5">
                <h5 className="font-semibold text-xs text-black">
                  a. Journal Publications:
                </h5>
                {isEditing && (
                  <div className="flex items-center gap-1.5 print:hidden">
                    <button
                      onClick={() => handleAddRow('6_faculty_achievements.a_journal_publications')}
                      className="px-2 py-0.5 rounded bg-indigo-50 border border-indigo-200 text-indigo-700 text-[10px] font-bold flex items-center gap-1 hover:bg-indigo-100 cursor-pointer"
                    >
                      <Plus size={11} /> + Add Publication
                    </button>
                    <button
                      onClick={() => handleDeleteTable('6_faculty_achievements.a_journal_publications', '6.a Journal Publications')}
                      className="px-2 py-0.5 rounded bg-rose-50 border border-rose-200 text-rose-700 text-[10px] font-bold flex items-center gap-1 hover:bg-rose-100 cursor-pointer"
                    >
                      <Trash2 size={11} /> Delete Table
                    </button>
                  </div>
                )}
              </div>
              <table className="w-full text-[11px] border-collapse border border-black text-left">
                <thead>
                  <tr className="bg-gray-100 font-bold border-b border-black">
                    <th className="border border-black p-1.5 w-10 text-center">S.No</th>
                    <th className="border border-black p-1.5">Name(s) of the Author(s)</th>
                    <th className="border border-black p-1.5">Title of the paper</th>
                    <th className="border border-black p-1.5">Name of the Journal</th>
                    <th className="border border-black p-1.5">Volume, Issue no., PP & Year</th>
                    <th className="border border-black p-1.5">Indexing (SCI / Scopus/ WOS / UGC care)</th>
                    {isEditing && <th className="border border-black p-1.5 print:hidden w-8">Action</th>}
                  </tr>
                </thead>
                <tbody>
                  {getRows(s["6_faculty_achievements"]?.a_journal_publications).length > 0 ? (
                    getRows(s["6_faculty_achievements"]?.a_journal_publications).map((item, i) => (
                      <tr key={i} className="border-b border-black">
                        <td className="border border-black p-1.5 text-center">{item.s_no || i + 1}</td>
                        <td className="border border-black p-1.5 font-medium">
                          <EditableCell sectionPath="6_faculty_achievements.a_journal_publications" rowIndex={i} fieldKey="authors" value={item.authors} />
                        </td>
                        <td className="border border-black p-1.5">
                          <EditableCell sectionPath="6_faculty_achievements.a_journal_publications" rowIndex={i} fieldKey="title" value={item.title} />
                        </td>
                        <td className="border border-black p-1.5">
                          <EditableCell sectionPath="6_faculty_achievements.a_journal_publications" rowIndex={i} fieldKey="journal" value={item.journal} />
                        </td>
                        <td className="border border-black p-1.5">
                          <EditableCell sectionPath="6_faculty_achievements.a_journal_publications" rowIndex={i} fieldKey="volume_issue" value={item.volume_issue} />
                        </td>
                        <td className="border border-black p-1.5">
                          <EditableCell sectionPath="6_faculty_achievements.a_journal_publications" rowIndex={i} fieldKey="indexing" value={item.indexing} />
                        </td>
                        {isEditing && (
                          <td className="border border-black p-1.5 print:hidden text-center">
                            <button onClick={() => handleDeleteRow('6_faculty_achievements.a_journal_publications', i)} className="text-rose-600 hover:text-rose-800 cursor-pointer">
                              <Trash2 size={12} />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))
                  ) : (
                    [1, 2].map(n => (
                      <tr key={n} className="border-b border-black h-7">
                        <td className="border border-black p-1.5 text-center">{n}</td>
                        <td className="border border-black p-1.5"></td>
                        <td className="border border-black p-1.5"></td>
                        <td className="border border-black p-1.5"></td>
                        <td className="border border-black p-1.5"></td>
                        <td className="border border-black p-1.5"></td>
                        {isEditing && <td className="border border-black p-1.5 print:hidden"></td>}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* 6.c */}
          {!isSectionHidden('6_faculty_achievements.c_patents') && (
            <div className="mb-4 pl-2">
              <div className="flex items-center justify-between mb-1.5">
                <h5 className="font-semibold text-xs text-black">
                  c. Patents Published/ Granted:
                </h5>
                {isEditing && (
                  <div className="flex items-center gap-1.5 print:hidden">
                    <button
                      onClick={() => handleAddRow('6_faculty_achievements.c_patents')}
                      className="px-2 py-0.5 rounded bg-indigo-50 border border-indigo-200 text-indigo-700 text-[10px] font-bold flex items-center gap-1 hover:bg-indigo-100 cursor-pointer"
                    >
                      <Plus size={11} /> + Add Patent
                    </button>
                    <button
                      onClick={() => handleDeleteTable('6_faculty_achievements.c_patents', '6.c Patents')}
                      className="px-2 py-0.5 rounded bg-rose-50 border border-rose-200 text-rose-700 text-[10px] font-bold flex items-center gap-1 hover:bg-rose-100 cursor-pointer"
                    >
                      <Trash2 size={11} /> Delete Table
                    </button>
                  </div>
                )}
              </div>
              <table className="w-full text-[11px] border-collapse border border-black text-left">
                <thead>
                  <tr className="bg-gray-100 font-bold border-b border-black">
                    <th className="border border-black p-1.5 w-10 text-center">S.No</th>
                    <th className="border border-black p-1.5">Name(s) of the Author(s)</th>
                    <th className="border border-black p-1.5">Title of the patent</th>
                    <th className="border border-black p-1.5">Name of the agency</th>
                    <th className="border border-black p-1.5">Filing No. & Year</th>
                    <th className="border border-black p-1.5 text-center">Published / Granted</th>
                    {isEditing && <th className="border border-black p-1.5 print:hidden w-8">Action</th>}
                  </tr>
                </thead>
                <tbody>
                  {getRows(s["6_faculty_achievements"]?.c_patents).length > 0 ? (
                    getRows(s["6_faculty_achievements"]?.c_patents).map((item, i) => (
                      <tr key={i} className="border-b border-black">
                        <td className="border border-black p-1.5 text-center">{item.s_no || i + 1}</td>
                        <td className="border border-black p-1.5 font-medium">
                          <EditableCell sectionPath="6_faculty_achievements.c_patents" rowIndex={i} fieldKey="authors" value={item.authors} />
                        </td>
                        <td className="border border-black p-1.5">
                          <EditableCell sectionPath="6_faculty_achievements.c_patents" rowIndex={i} fieldKey="title" value={item.title} />
                        </td>
                        <td className="border border-black p-1.5">
                          <EditableCell sectionPath="6_faculty_achievements.c_patents" rowIndex={i} fieldKey="agency" value={item.agency} />
                        </td>
                        <td className="border border-black p-1.5">
                          <EditableCell sectionPath="6_faculty_achievements.c_patents" rowIndex={i} fieldKey="filing_no_year" value={item.filing_no_year} />
                        </td>
                        <td className="border border-black p-1.5 text-center font-bold">
                          <EditableCell sectionPath="6_faculty_achievements.c_patents" rowIndex={i} fieldKey="status" value={item.status} />
                        </td>
                        {isEditing && (
                          <td className="border border-black p-1.5 print:hidden text-center">
                            <button onClick={() => handleDeleteRow('6_faculty_achievements.c_patents', i)} className="text-rose-600 hover:text-rose-800 cursor-pointer">
                              <Trash2 size={12} />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))
                  ) : (
                    [1, 2].map(n => (
                      <tr key={n} className="border-b border-black h-7">
                        <td className="border border-black p-1.5 text-center">{n}</td>
                        <td className="border border-black p-1.5"></td>
                        <td className="border border-black p-1.5"></td>
                        <td className="border border-black p-1.5"></td>
                        <td className="border border-black p-1.5"></td>
                        <td className="border border-black p-1.5"></td>
                        {isEditing && <td className="border border-black p-1.5 print:hidden"></td>}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* 6.g */}
          {!isSectionHidden('6_faculty_achievements.g_workshops_attended') && (
            <div className="mb-4 pl-2">
              <div className="flex items-center justify-between mb-1.5">
                <h5 className="font-semibold text-xs text-black">
                  g. Workshops/FDPs/STTPs attended:
                </h5>
                {isEditing && (
                  <div className="flex items-center gap-1.5 print:hidden">
                    <button
                      onClick={() => handleAddRow('6_faculty_achievements.g_workshops_attended')}
                      className="px-2 py-0.5 rounded bg-indigo-50 border border-indigo-200 text-indigo-700 text-[10px] font-bold flex items-center gap-1 hover:bg-indigo-100 cursor-pointer"
                    >
                      <Plus size={11} /> + Add Workshop/FDP
                    </button>
                    <button
                      onClick={() => handleDeleteTable('6_faculty_achievements.g_workshops_attended', '6.g Workshops/FDPs attended')}
                      className="px-2 py-0.5 rounded bg-rose-50 border border-rose-200 text-rose-700 text-[10px] font-bold flex items-center gap-1 hover:bg-rose-100 cursor-pointer"
                    >
                      <Trash2 size={11} /> Delete Table
                    </button>
                  </div>
                )}
              </div>
              <table className="w-full text-[11px] border-collapse border border-black text-left">
                <thead>
                  <tr className="bg-gray-100 font-bold border-b border-black">
                    <th className="border border-black p-1.5 w-10 text-center">S.No</th>
                    <th className="border border-black p-1.5">Name of the Faculty</th>
                    <th className="border border-black p-1.5">Name of the Workshop/FDP/ STTP Program</th>
                    <th className="border border-black p-1.5">Organized by</th>
                    <th className="border border-black p-1.5">Duration</th>
                    {isEditing && <th className="border border-black p-1.5 print:hidden w-8">Action</th>}
                  </tr>
                </thead>
                <tbody>
                  {getRows(s["6_faculty_achievements"]?.g_workshops_attended).length > 0 ? (
                    getRows(s["6_faculty_achievements"]?.g_workshops_attended).map((item, i) => (
                      <tr key={i} className="border-b border-black">
                        <td className="border border-black p-1.5 text-center">{item.s_no || i + 1}</td>
                        <td className="border border-black p-1.5 font-medium">
                          <EditableCell sectionPath="6_faculty_achievements.g_workshops_attended" rowIndex={i} fieldKey="faculty_name" value={item.faculty_name} />
                        </td>
                        <td className="border border-black p-1.5">
                          <EditableCell sectionPath="6_faculty_achievements.g_workshops_attended" rowIndex={i} fieldKey="program_name" value={item.program_name} />
                        </td>
                        <td className="border border-black p-1.5">
                          <EditableCell sectionPath="6_faculty_achievements.g_workshops_attended" rowIndex={i} fieldKey="organized_by" value={item.organized_by} />
                        </td>
                        <td className="border border-black p-1.5">
                          <EditableCell sectionPath="6_faculty_achievements.g_workshops_attended" rowIndex={i} fieldKey="duration" value={item.duration} />
                        </td>
                        {isEditing && (
                          <td className="border border-black p-1.5 print:hidden text-center">
                            <button onClick={() => handleDeleteRow('6_faculty_achievements.g_workshops_attended', i)} className="text-rose-600 hover:text-rose-800 cursor-pointer">
                              <Trash2 size={12} />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))
                  ) : (
                    [1, 2].map(n => (
                      <tr key={n} className="border-b border-black h-7">
                        <td className="border border-black p-1.5 text-center">{n}</td>
                        <td className="border border-black p-1.5"></td>
                        <td className="border border-black p-1.5"></td>
                        <td className="border border-black p-1.5"></td>
                        <td className="border border-black p-1.5"></td>
                        {isEditing && <td className="border border-black p-1.5 print:hidden"></td>}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* SECTION 7: Training programs conducted for Non-Teaching Staff */}
        {!isSectionHidden('7_non_teaching_training') && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-bold text-sm text-black">
                7. Training programs conducted for Non-Teaching Staff:
              </h4>
              {isEditing && (
                <div className="flex items-center gap-1.5 print:hidden">
                  <button
                    onClick={() => handleAddRow('7_non_teaching_training')}
                    className="px-2 py-1 rounded bg-indigo-50 border border-indigo-200 text-indigo-700 text-[10px] font-bold flex items-center gap-1 hover:bg-indigo-100 cursor-pointer"
                  >
                    <Plus size={12} /> + Add Training Program
                  </button>
                  <button
                    onClick={() => handleDeleteTable('7_non_teaching_training', '7. Non-Teaching Training')}
                    className="px-2 py-1 rounded bg-rose-50 border border-rose-200 text-rose-700 text-[10px] font-bold flex items-center gap-1 hover:bg-rose-100 cursor-pointer"
                  >
                    <Trash2 size={11} /> Delete Table
                  </button>
                </div>
              )}
            </div>
            <table className="w-full text-[11px] border-collapse border border-black text-left">
              <thead>
                <tr className="bg-gray-100 font-bold border-b border-black">
                  <th className="border border-black p-1.5 w-10 text-center">S.No</th>
                  <th className="border border-black p-1.5">Name of the Training Program</th>
                  <th className="border border-black p-1.5">Target Staff</th>
                  <th className="border border-black p-1.5">Resource Person</th>
                  <th className="border border-black p-1.5">Duration</th>
                  <th className="border border-black p-1.5 text-center">No. of Participants</th>
                  {isEditing && <th className="border border-black p-1.5 print:hidden w-8">Action</th>}
                </tr>
              </thead>
              <tbody>
                {getRows(s["7_non_teaching_training"]).length > 0 ? (
                  getRows(s["7_non_teaching_training"]).map((item, i) => (
                    <tr key={i} className="border-b border-black">
                      <td className="border border-black p-1.5 text-center">{item.s_no || i + 1}</td>
                      <td className="border border-black p-1.5 font-medium">
                        <EditableCell sectionPath="7_non_teaching_training" rowIndex={i} fieldKey="program_name" value={item.program_name} />
                      </td>
                      <td className="border border-black p-1.5">
                        <EditableCell sectionPath="7_non_teaching_training" rowIndex={i} fieldKey="target_staff" value={item.target_staff} />
                      </td>
                      <td className="border border-black p-1.5">
                        <EditableCell sectionPath="7_non_teaching_training" rowIndex={i} fieldKey="resource_person" value={item.resource_person} />
                      </td>
                      <td className="border border-black p-1.5">
                        <EditableCell sectionPath="7_non_teaching_training" rowIndex={i} fieldKey="duration" value={item.duration} />
                      </td>
                      <td className="border border-black p-1.5 text-center font-bold">
                        <EditableCell sectionPath="7_non_teaching_training" rowIndex={i} fieldKey="participants" value={item.participants} />
                      </td>
                      {isEditing && (
                        <td className="border border-black p-1.5 print:hidden text-center">
                          <button onClick={() => handleDeleteRow('7_non_teaching_training', i)} className="text-rose-600 hover:text-rose-800 cursor-pointer">
                            <Trash2 size={12} />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))
                ) : (
                  [1, 2].map(n => (
                    <tr key={n} className="border-b border-black h-7">
                      <td className="border border-black p-1.5 text-center">{n}</td>
                      <td className="border border-black p-1.5"></td>
                      <td className="border border-black p-1.5"></td>
                      <td className="border border-black p-1.5"></td>
                      <td className="border border-black p-1.5"></td>
                      <td className="border border-black p-1.5"></td>
                      {isEditing && <td className="border border-black p-1.5 print:hidden"></td>}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* SECTION 8: Investment on Infrastructure */}
        {!isSectionHidden('8_infrastructure_investment') && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-bold text-sm text-black">
                8. Investment on Infrastructure:
              </h4>
              {isEditing && (
                <div className="flex items-center gap-1.5 print:hidden">
                  <button
                    onClick={() => handleAddRow('8_infrastructure_investment')}
                    className="px-2 py-1 rounded bg-indigo-50 border border-indigo-200 text-indigo-700 text-[10px] font-bold flex items-center gap-1 hover:bg-indigo-100 cursor-pointer"
                  >
                    <Plus size={12} /> + Add Infrastructure Item
                  </button>
                  <button
                    onClick={() => handleDeleteTable('8_infrastructure_investment', '8. Infrastructure Investment')}
                    className="px-2 py-1 rounded bg-rose-50 border border-rose-200 text-rose-700 text-[10px] font-bold flex items-center gap-1 hover:bg-rose-100 cursor-pointer"
                  >
                    <Trash2 size={11} /> Delete Table
                  </button>
                </div>
              )}
            </div>
            <table className="w-full text-[11px] border-collapse border border-black text-left">
              <thead>
                <tr className="bg-gray-100 font-bold border-b border-black">
                  <th className="border border-black p-1.5 w-10 text-center">S.No</th>
                  <th className="border border-black p-1.5">Name of the Infrastructure</th>
                  <th className="border border-black p-1.5">Specifications</th>
                  <th className="border border-black p-1.5 text-center">Quantity</th>
                  <th className="border border-black p-1.5">Date of Purchase</th>
                  <th className="border border-black p-1.5">Particulars of the supplier</th>
                  <th className="border border-black p-1.5 text-center">Amount Paid (Rs.)</th>
                  {isEditing && <th className="border border-black p-1.5 print:hidden w-8">Action</th>}
                </tr>
              </thead>
              <tbody>
                {getRows(s["8_infrastructure_investment"]).length > 0 ? (
                  getRows(s["8_infrastructure_investment"]).map((item, i) => (
                    <tr key={i} className="border-b border-black">
                      <td className="border border-black p-1.5 text-center">{item.s_no || i + 1}</td>
                      <td className="border border-black p-1.5 font-medium">
                        <EditableCell sectionPath="8_infrastructure_investment" rowIndex={i} fieldKey="name" value={item.name} />
                      </td>
                      <td className="border border-black p-1.5">
                        <EditableCell sectionPath="8_infrastructure_investment" rowIndex={i} fieldKey="specs" value={item.specs} />
                      </td>
                      <td className="border border-black p-1.5 text-center">
                        <EditableCell sectionPath="8_infrastructure_investment" rowIndex={i} fieldKey="quantity" value={item.quantity} />
                      </td>
                      <td className="border border-black p-1.5">
                        <EditableCell sectionPath="8_infrastructure_investment" rowIndex={i} fieldKey="date" value={item.date} />
                      </td>
                      <td className="border border-black p-1.5">
                        <EditableCell sectionPath="8_infrastructure_investment" rowIndex={i} fieldKey="supplier" value={item.supplier} />
                      </td>
                      <td className="border border-black p-1.5 text-center font-bold">
                        <EditableCell sectionPath="8_infrastructure_investment" rowIndex={i} fieldKey="amount" value={item.amount} />
                      </td>
                      {isEditing && (
                        <td className="border border-black p-1.5 print:hidden text-center">
                          <button onClick={() => handleDeleteRow('8_infrastructure_investment', i)} className="text-rose-600 hover:text-rose-800 cursor-pointer">
                            <Trash2 size={12} />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))
                ) : (
                  [1, 2].map(n => (
                    <tr key={n} className="border-b border-black h-7">
                      <td className="border border-black p-1.5 text-center">{n}</td>
                      <td className="border border-black p-1.5"></td>
                      <td className="border border-black p-1.5"></td>
                      <td className="border border-black p-1.5"></td>
                      <td className="border border-black p-1.5"></td>
                      <td className="border border-black p-1.5"></td>
                      <td className="border border-black p-1.5"></td>
                      {isEditing && <td className="border border-black p-1.5 print:hidden"></td>}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* SECTION 9: MoUs signed */}
        {!isSectionHidden('9_mous_signed') && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-bold text-sm text-black">
                9. MoUs signed (if any):
              </h4>
              {isEditing && (
                <div className="flex items-center gap-1.5 print:hidden">
                  <button
                    onClick={() => handleAddRow('9_mous_signed')}
                    className="px-2 py-1 rounded bg-indigo-50 border border-indigo-200 text-indigo-700 text-[10px] font-bold flex items-center gap-1 hover:bg-indigo-100 cursor-pointer"
                  >
                    <Plus size={12} /> + Add MoU
                  </button>
                  <button
                    onClick={() => handleDeleteTable('9_mous_signed', '9. MoUs signed')}
                    className="px-2 py-1 rounded bg-rose-50 border border-rose-200 text-rose-700 text-[10px] font-bold flex items-center gap-1 hover:bg-rose-100 cursor-pointer"
                  >
                    <Trash2 size={11} /> Delete Table
                  </button>
                </div>
              )}
            </div>
            <table className="w-full text-[11px] border-collapse border border-black text-left">
              <thead>
                <tr className="bg-gray-100 font-bold border-b border-black">
                  <th className="border border-black p-1.5 w-10 text-center">S.No</th>
                  <th className="border border-black p-1.5">Name of the Institution / Industry</th>
                  <th className="border border-black p-1.5">Purpose of MoU</th>
                  <th className="border border-black p-1.5">Date of Signing</th>
                  <th className="border border-black p-1.5">Validity Period</th>
                  <th className="border border-black p-1.5">Activities Planned / Completed</th>
                  {isEditing && <th className="border border-black p-1.5 print:hidden w-8">Action</th>}
                </tr>
              </thead>
              <tbody>
                {getRows(s["9_mous_signed"]).length > 0 ? (
                  getRows(s["9_mous_signed"]).map((item, i) => (
                    <tr key={i} className="border-b border-black">
                      <td className="border border-black p-1.5 text-center">{item.s_no || i + 1}</td>
                      <td className="border border-black p-1.5 font-medium">
                        <EditableCell sectionPath="9_mous_signed" rowIndex={i} fieldKey="company" value={item.company} />
                      </td>
                      <td className="border border-black p-1.5">
                        <EditableCell sectionPath="9_mous_signed" rowIndex={i} fieldKey="purpose" value={item.purpose} />
                      </td>
                      <td className="border border-black p-1.5">
                        <EditableCell sectionPath="9_mous_signed" rowIndex={i} fieldKey="date" value={item.date} />
                      </td>
                      <td className="border border-black p-1.5">
                        <EditableCell sectionPath="9_mous_signed" rowIndex={i} fieldKey="validity" value={item.validity} />
                      </td>
                      <td className="border border-black p-1.5">
                        <EditableCell sectionPath="9_mous_signed" rowIndex={i} fieldKey="activities" value={item.activities} />
                      </td>
                      {isEditing && (
                        <td className="border border-black p-1.5 print:hidden text-center">
                          <button onClick={() => handleDeleteRow('9_mous_signed', i)} className="text-rose-600 hover:text-rose-800 cursor-pointer">
                            <Trash2 size={12} />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))
                ) : (
                  [1, 2].map(n => (
                    <tr key={n} className="border-b border-black h-7">
                      <td className="border border-black p-1.5 text-center">{n}</td>
                      <td className="border border-black p-1.5"></td>
                      <td className="border border-black p-1.5"></td>
                      <td className="border border-black p-1.5"></td>
                      <td className="border border-black p-1.5"></td>
                      <td className="border border-black p-1.5"></td>
                      {isEditing && <td className="border border-black p-1.5 print:hidden"></td>}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* 🌟 CUSTOM SECTIONS / TABLES DYNAMICALLY ADDED BY USER */}
        {s["custom_tables"]?.map((customTable, tableIdx) => (
          <div key={tableIdx} className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-bold text-sm text-black">
                {customTable.title || `Custom Section ${tableIdx + 1}`}
              </h4>
              {isEditing && (
                <div className="flex items-center gap-2 print:hidden">
                  <button
                    onClick={() => {
                      const updated = [...(s["custom_tables"] || [])];
                      const newRow = {};
                      customTable.columns?.forEach((col, cIdx) => {
                        newRow[col] = cIdx === 0 ? (customTable.rows?.length || 0) + 1 : "";
                      });
                      updated[tableIdx].rows = [...(updated[tableIdx].rows || []), newRow];
                      updateSectionField("custom_tables", updated);
                    }}
                    className="px-2 py-1 rounded bg-indigo-50 border border-indigo-200 text-indigo-700 text-[10px] font-bold flex items-center gap-1 hover:bg-indigo-100 cursor-pointer"
                  >
                    <Plus size={12} /> Add Row
                  </button>
                  <button
                    onClick={() => {
                      const updated = s["custom_tables"].filter((_, i) => i !== tableIdx);
                      updateSectionField("custom_tables", updated);
                    }}
                    className="px-2 py-1 rounded bg-rose-50 border border-rose-200 text-rose-700 text-[10px] font-bold flex items-center gap-1 hover:bg-rose-100 cursor-pointer"
                  >
                    <Trash2 size={12} /> Delete Table
                  </button>
                </div>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-[11px] border-collapse border border-black text-left">
                <thead>
                  <tr className="bg-gray-100 font-bold border-b border-black">
                    {customTable.columns?.map((col, cIdx) => (
                      <th key={cIdx} className={`border border-black p-1.5 ${cIdx === 0 ? 'w-10 text-center' : ''}`}>
                        {col}
                      </th>
                    ))}
                    {isEditing && <th className="border border-black p-1.5 print:hidden w-8">Action</th>}
                  </tr>
                </thead>
                <tbody>
                  {getRows(customTable.rows).length > 0 ? (
                    getRows(customTable.rows).map((row, rIdx) => (
                      <tr key={rIdx} className="border-b border-black">
                        {customTable.columns?.map((col, cIdx) => (
                          <td key={cIdx} className={`border border-black p-1.5 ${cIdx === 0 ? 'text-center font-medium' : ''}`}>
                            {cIdx === 0 ? (
                              row[col] || rIdx + 1
                            ) : (
                              <EditableCell 
                                sectionPath={`custom_tables.${tableIdx}.rows`} 
                                rowIndex={rIdx} 
                                fieldKey={col} 
                                value={row[col]} 
                              />
                            )}
                          </td>
                        ))}
                        {isEditing && (
                          <td className="border border-black p-1.5 print:hidden text-center">
                            <button 
                              onClick={() => {
                                const updated = [...(s["custom_tables"] || [])];
                                updated[tableIdx].rows.splice(rIdx, 1);
                                updateSectionField("custom_tables", updated);
                              }}
                              className="text-rose-600 hover:text-rose-800 cursor-pointer"
                            >
                              <Trash2 size={12} />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))
                  ) : (
                    [1, 2].map(n => (
                      <tr key={n} className="border-b border-black h-7">
                        {customTable.columns?.map((_, cIdx) => (
                          <td key={cIdx} className="border border-black p-1.5 text-center">{cIdx === 0 ? n : ''}</td>
                        ))}
                        {isEditing && <td className="border border-black p-1.5 print:hidden"></td>}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ))}

        {/* SECTION 10, 11, 12: DYNAMIC EXPANDABLE CONTENT AREAS */}
        <div className="space-y-4 mb-10 text-xs">
          {/* Section 10 */}
          {!isSectionHidden('10_alumni_activities') && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-black text-xs">10. Alumni Activities (if any):</span>
                {isEditing && (
                  <div className="flex items-center gap-2 print:hidden">
                    <button
                      onClick={() => handleDeleteTable('10_alumni_activities', '10. Alumni Activities')}
                      className="text-rose-600 hover:text-rose-800 text-[10px] font-bold flex items-center gap-0.5 cursor-pointer"
                    >
                      <Trash2 size={10} /> Delete Section
                    </button>
                  </div>
                )}
              </div>
              {isEditing ? (
                <textarea 
                  rows={5}
                  placeholder="Enter details of Alumni interactions, guest lectures, mentorship sessions, dates, batch, number of beneficiaries, key outcomes..."
                  className="w-full p-3 border-2 border-amber-400 bg-amber-50/50 text-xs text-black font-sans leading-relaxed rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-inner resize-y"
                  value={s["10_alumni_activities"] || ""}
                  onChange={(e) => updateSectionField("10_alumni_activities", e.target.value)}
                />
              ) : (
                <div className="border border-black p-3 min-h-[60px] bg-white text-gray-900 whitespace-pre-wrap leading-relaxed text-xs">
                  {s["10_alumni_activities"]?.trim() ? s["10_alumni_activities"] : <span className="italic text-gray-400">Nil</span>}
                </div>
              )}
            </div>
          )}

          {/* Section 11 */}
          {!isSectionHidden('11_parent_teacher_meetings') && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-black text-xs">11. Parent Teacher meetings (if any):</span>
                {isEditing && (
                  <div className="flex items-center gap-2 print:hidden">
                    <span className="text-[10px] text-amber-700 font-medium">
                      (Unlimited lines/bullet points supported)
                    </span>
                    <button
                      onClick={() => handleDeleteTable('11_parent_teacher_meetings', '11. Parent Teacher meetings')}
                      className="text-rose-600 hover:text-rose-800 text-[10px] font-bold flex items-center gap-0.5 cursor-pointer"
                    >
                      <Trash2 size={10} /> Delete Section
                    </button>
                  </div>
                )}
              </div>
              {isEditing ? (
                <textarea 
                  rows={5}
                  placeholder="Enter details of Parent-Teacher meetings conducted, dates, agendas discussed, number of parents attended, feedback received, action taken..."
                  className="w-full p-3 border-2 border-amber-400 bg-amber-50/50 text-xs text-black font-sans leading-relaxed rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-inner resize-y"
                  value={s["11_parent_teacher_meetings"] || ""}
                  onChange={(e) => updateSectionField("11_parent_teacher_meetings", e.target.value)}
                />
              ) : (
                <div className="border border-black p-3 min-h-[60px] bg-white text-gray-900 whitespace-pre-wrap leading-relaxed text-xs">
                  {s["11_parent_teacher_meetings"]?.trim() ? s["11_parent_teacher_meetings"] : <span className="italic text-gray-400">Nil</span>}
                </div>
              )}
            </div>
          )}

          {/* Section 12 */}
          {!isSectionHidden('12_other_information') && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-black text-xs">12. Other Information (if any):</span>
                {isEditing && (
                  <div className="flex items-center gap-2 print:hidden">
                    <span className="text-[10px] text-amber-700 font-medium">
                      (Unlimited lines/bullet points supported)
                    </span>
                    <button
                      onClick={() => handleDeleteTable('12_other_information', '12. Other Information')}
                      className="text-rose-600 hover:text-rose-800 text-[10px] font-bold flex items-center gap-0.5 cursor-pointer"
                    >
                      <Trash2 size={10} /> Delete Section
                    </button>
                  </div>
                )}
              </div>
              {isEditing ? (
                <textarea 
                  rows={5}
                  placeholder="Enter any other departmental highlights, club activities, NSS/NCC initiatives, institutional recognitions, future targets..."
                  className="w-full p-3 border-2 border-amber-400 bg-amber-50/50 text-xs text-black font-sans leading-relaxed rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-inner resize-y"
                  value={s["12_other_information"] || ""}
                  onChange={(e) => updateSectionField("12_other_information", e.target.value)}
                />
              ) : (
                <div className="border border-black p-3 min-h-[60px] bg-white text-gray-900 whitespace-pre-wrap leading-relaxed text-xs">
                  {s["12_other_information"]?.trim() ? s["12_other_information"] : <span className="italic text-gray-400">Nil</span>}
                </div>
              )}
            </div>
          )}
        </div>

        {/* FOOTER SIGNATURES */}
        <div className="pt-12 mt-12 border-t border-gray-400 flex items-center justify-between font-bold text-xs uppercase text-black">
          <div className="text-center">
            <div className="w-48 border-b border-black mb-1"></div>
            <span>DEPARTMENT IQAC COORDINATOR</span>
          </div>

          <div className="text-center">
            <div className="w-48 border-b border-black mb-1"></div>
            <span>HOD</span>
          </div>
        </div>
      </div>
      )}
      </div>
    </ReportEditorContext.Provider>
  );
};

export default IQACMonthlyReport;

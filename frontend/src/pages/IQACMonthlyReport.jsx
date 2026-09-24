import React, { useState, useEffect, useRef } from 'react';
import { 
  Download, Printer, FileText, FileSpreadsheet, RefreshCw, 
  PlusCircle, Trash2, CheckCircle2, Building, Calendar, 
  Layers, Award, BookOpen, Users, Briefcase, ChevronDown, 
  ChevronRight, Edit3, Save, Database, History, AlertCircle, Plus, X,
  Share2, Copy, Check, FolderArchive, PlusSquare, ExternalLink, Search
} from 'lucide-react';
import { fetchAPI, API_BASE_URL } from '../services/api';

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
      setReportData(data);
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
      const res = await fetch(`${API_BASE_URL}/faculty/reports/iqac-monthly/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({
          department,
          month,
          year,
          academic_year: academicYear,
          institution_name: reportData.institution_name,
          accreditation_details: reportData.accreditation_details,
          sections: reportData.sections
        })
      });
      const result = await res.json();
      if (res.ok) {
        setSaveSuccess('Report saved persistently in database! You can retrieve, share and download it anytime.');
        loadSavedReportsList();
        // Mark as saved in local state
        setReportData(prev => ({ ...prev, id: result.report_id, is_saved_in_db: true, updated_at: result.updated_at }));
        setTimeout(() => setSaveSuccess(''), 5000);
      }
    } catch (err) {
      console.error("Failed to save report to database", err);
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
      const res = await fetch(`${API_BASE_URL}/faculty/reports/iqac-monthly/${reportId}/delete/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      if (res.ok) {
        loadSavedReportsList();
        setSaveSuccess('Report removed from database.');
        setTimeout(() => setSaveSuccess(''), 3000);
      }
    } catch (err) {
      console.error("Failed to delete report", err);
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

  // Helper to add row to array sections
  const handleAddRow = (sectionKey, defaultRow) => {
    setReportData(prev => {
      const clone = JSON.parse(JSON.stringify(prev));
      const parts = sectionKey.split('.');
      let target = clone.sections;
      for (let i = 0; i < parts.length; i++) {
        target = target[parts[i]];
      }
      if (Array.isArray(target)) {
        defaultRow.s_no = target.length + 1;
        target.push(defaultRow);
      }
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
    <div className="max-w-7xl mx-auto space-y-6 p-4 md:p-6 print:p-0 print:m-0 print:max-w-full">
      {/* 🌟 Top Action & Filter Bar (Hidden on Print) */}
      <div className="print:hidden bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                Official Institutional Format
              </span>
              <span className="text-xs text-gray-400">NAAC / NBA Monthly IQAC Record</span>
              {reportData?.is_saved_in_db && (
                <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 flex items-center gap-1">
                  <Database size={12} /> Stored in DB
                </span>
              )}
            </div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white mt-1">
              Monthly IQAC Departmental Report & Document Vault
            </h1>
            <p className="text-xs text-gray-500 dark:text-slate-400">
              Create, edit, save custom tables and share official NAAC/NBA documents across all departments in one central repository.
            </p>
          </div>

          {/* Tab Switcher: Editor vs Central Vault */}
          <div className="flex items-center bg-gray-100 dark:bg-slate-800 p-1 rounded-2xl border border-gray-200 dark:border-slate-700">
            <button
              onClick={() => setActiveTab('editor')}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                activeTab === 'editor' 
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm' 
                  : 'text-gray-600 dark:text-slate-300 hover:text-black dark:hover:text-white'
              }`}
            >
              <FileText size={14} /> Document Editor & Preview
            </button>
            <button
              onClick={() => setActiveTab('vault')}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
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
              <Share2 size={16} className="mr-1.5" /> Share Document Link
            </button>

            <button
              onClick={() => setCustomTableModal(true)}
              className="inline-flex items-center px-4 py-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 hover:bg-purple-100 text-purple-700 dark:text-purple-300 text-xs font-bold transition-all cursor-pointer"
            >
              <PlusSquare size={16} className="mr-1.5" /> + Add Custom Table
            </button>

            <button
              onClick={() => setIsEditing(!isEditing)}
              className={`inline-flex items-center px-3.5 py-2.5 rounded-xl text-xs font-bold border transition ${
                isEditing ? 'bg-amber-100 text-amber-900 border-amber-300' : 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-200 border-gray-300 dark:border-slate-700'
              }`}
            >
              <Edit3 size={15} className="mr-1.5" />
              {isEditing ? 'Exit Edit Mode' : 'Live Table Editor'}
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

      {/* 📄 THE OFFICIAL PRINTABLE REPORT CONTAINER */}
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
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-[#0f2347] uppercase leading-tight">
                AVN INSTITUTE OF ENGINEERING & TECHNOLOGY
              </h2>
              <p className="text-xs font-bold text-gray-700 mt-0.5">
                Accredited by NAAC & NBA | An Autonomous Institute Affiliated to JNTU Hyderabad
              </p>
              <p className="text-[10px] text-gray-500">
                Mangalpally (V), Ibrahimpatnam (M), R.R. District, Hyderabad, Telangana - 501510
              </p>
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

          {/* Main Document Title */}
          <div className="mt-4 pt-3 border-t border-gray-300 text-center">
            <h3 className="text-base sm:text-lg font-black text-black tracking-wide uppercase">
              IQAC REPORT OF DEPARTMENT OF {department.toUpperCase()} FOR {month.toUpperCase()}, {year}
            </h3>
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
                    onClick={() => handleAddRow('1_student_events', { name: "New Event", association: "-", level: "Department level", duration: "1 day", chief_guest: "Resource Person", honorarium: "-", misc_expenses: "-", target_students: "All Students" })}
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
                  {s["1_student_events"]?.length > 0 ? (
                    s["1_student_events"].map((item, i) => (
                      <tr key={i} className="border-b border-black">
                        <td className="border border-black p-1.5 text-center font-medium">{item.s_no || i + 1}</td>
                        <td className="border border-black p-1.5 font-medium">
                          {isEditing ? (
                            <input className="w-full bg-amber-50/60 p-0.5 border border-amber-300 text-xs" value={item.name} onChange={(e) => {
                              const updated = [...s["1_student_events"]];
                              updated[i].name = e.target.value;
                              updateSectionField('1_student_events', updated);
                            }} />
                          ) : item.name}
                        </td>
                        <td className="border border-black p-1.5 text-center">{item.association || '-'}</td>
                        <td className="border border-black p-1.5">{item.level}</td>
                        <td className="border border-black p-1.5">{item.duration}</td>
                        <td className="border border-black p-1.5">{item.chief_guest}</td>
                        <td className="border border-black p-1.5 text-center">{item.honorarium || '-'}</td>
                        <td className="border border-black p-1.5 text-center">{item.misc_expenses || '-'}</td>
                        <td className="border border-black p-1.5">{item.target_students}</td>
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
                    onClick={() => handleAddRow('2_faculty_events', { name: "Faculty FDP/Workshop", association: "CSI", level: "Department level", duration: "2 days", chief_guest: "Speaker", faculty_count: "20", honorarium: "-", misc_expenses: "-" })}
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
                  {s["2_faculty_events"]?.length > 0 ? (
                    s["2_faculty_events"].map((item, i) => (
                      <tr key={i} className="border-b border-black">
                        <td className="border border-black p-1.5 text-center">{item.s_no || i + 1}</td>
                        <td className="border border-black p-1.5 font-medium">{item.name}</td>
                        <td className="border border-black p-1.5 text-center">{item.association || '-'}</td>
                        <td className="border border-black p-1.5">{item.level}</td>
                        <td className="border border-black p-1.5">{item.duration}</td>
                        <td className="border border-black p-1.5">{item.chief_guest}</td>
                        <td className="border border-black p-1.5 text-center">{item.faculty_count || '-'}</td>
                        <td className="border border-black p-1.5 text-center">{item.honorarium || '-'}</td>
                        <td className="border border-black p-1.5 text-center">{item.misc_expenses || '-'}</td>
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
                    onClick={() => handleAddRow('3_value_added_courses', { name: "Course Name", resource_person: "Trainer", level: "Dept level", duration: "30h", contact_periods: "30", students_registered: "50", remuneration: "-", target_students: "UG" })}
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
                  {s["3_value_added_courses"]?.length > 0 ? (
                    s["3_value_added_courses"].map((item, i) => (
                      <tr key={i} className="border-b border-black">
                        <td className="border border-black p-1.5 text-center">{item.s_no || i + 1}</td>
                        <td className="border border-black p-1.5 font-medium">{item.name}</td>
                        <td className="border border-black p-1.5">{item.resource_person}</td>
                        <td className="border border-black p-1.5">{item.level}</td>
                        <td className="border border-black p-1.5">{item.duration}</td>
                        <td className="border border-black p-1.5 text-center">{item.contact_periods}</td>
                        <td className="border border-black p-1.5 text-center">{item.students_registered}</td>
                        <td className="border border-black p-1.5 text-center">{item.remuneration || '-'}</td>
                        <td className="border border-black p-1.5">{item.target_students}</td>
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
                    onClick={() => handleAddRow('4_advanced_learners', { name: "Advanced Learner Workshop", level: "Department level", duration: "1 Day", contact_periods: "6 Hours", chief_guest: "Domain Expert", honorarium: "-", misc_expenses: "-", target_students: "Top Merit Students" })}
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
                  {s["4_advanced_learners"]?.length > 0 ? (
                    s["4_advanced_learners"].map((item, i) => (
                      <tr key={i} className="border-b border-black">
                        <td className="border border-black p-1.5 text-center">{item.s_no || i + 1}</td>
                        <td className="border border-black p-1.5 font-medium">
                          {isEditing ? (
                            <input className="w-full bg-amber-50/60 p-0.5 border border-amber-300 text-xs" value={item.name} onChange={(e) => {
                              const updated = [...s["4_advanced_learners"]];
                              updated[i].name = e.target.value;
                              updateSectionField('4_advanced_learners', updated);
                            }} />
                          ) : item.name}
                        </td>
                        <td className="border border-black p-1.5">{item.level}</td>
                        <td className="border border-black p-1.5">{item.duration}</td>
                        <td className="border border-black p-1.5 text-center">{item.contact_periods}</td>
                        <td className="border border-black p-1.5">{item.chief_guest}</td>
                        <td className="border border-black p-1.5 text-center">{item.honorarium || '-'}</td>
                        <td className="border border-black p-1.5 text-center">{item.misc_expenses || '-'}</td>
                        <td className="border border-black p-1.5">{item.target_students}</td>
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
                      onClick={() => handleAddRow('5_student_achievements.a_curricular', { roll_no: "245U1A6700", name: "Student Name", year_sem: "III/I", event_name: "National Hackathon", organized_by: "University", duration: "2 days", prizes: "First Prize" })}
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
                  {s["5_student_achievements"]?.a_curricular?.map((item, i) => (
                    <tr key={i} className="border-b border-black">
                      <td className="border border-black p-1.5 text-center">{item.s_no || i + 1}</td>
                      <td className="border border-black p-1.5 font-mono">{item.roll_no}</td>
                      <td className="border border-black p-1.5 font-medium">{item.name}</td>
                      <td className="border border-black p-1.5 text-center">{item.year_sem}</td>
                      <td className="border border-black p-1.5">{item.event_name}</td>
                      <td className="border border-black p-1.5">{item.organized_by}</td>
                      <td className="border border-black p-1.5">{item.duration}</td>
                      <td className="border border-black p-1.5">{item.prizes || '-'}</td>
                      {isEditing && (
                        <td className="border border-black p-1.5 print:hidden text-center">
                          <button onClick={() => handleDeleteRow('5_student_achievements.a_curricular', i)} className="text-rose-600 hover:text-rose-800 cursor-pointer">
                            <Trash2 size={12} />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
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
                      onClick={() => handleAddRow('5_student_achievements.b_extracurricular', { roll_no: "245U1A6712", name: "Student Name", year_sem: "III/I", event_name: "Sports Event", organized_by: "Sports Board", duration: "1 day", prizes: "Gold Medal" })}
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
                  {s["5_student_achievements"]?.b_extracurricular?.length > 0 ? (
                    s["5_student_achievements"].b_extracurricular.map((item, i) => (
                      <tr key={i} className="border-b border-black">
                        <td className="border border-black p-1.5 text-center">{item.s_no || i + 1}</td>
                        <td className="border border-black p-1.5 font-mono">{item.roll_no}</td>
                        <td className="border border-black p-1.5 font-medium">{item.name}</td>
                        <td className="border border-black p-1.5 text-center">{item.year_sem}</td>
                        <td className="border border-black p-1.5">{item.event_name}</td>
                        <td className="border border-black p-1.5">{item.organized_by}</td>
                        <td className="border border-black p-1.5">{item.duration}</td>
                        <td className="border border-black p-1.5">{item.prizes || '-'}</td>
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
                      onClick={() => handleAddRow('5_student_achievements.c_online_certifications', { roll_no: "All Students", name: "-", year_sem: "III/I", course_name: "Machine Learning", organized_by: "NPTEL", duration: "12 Weeks", grade: "Elite" })}
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
                  {s["5_student_achievements"]?.c_online_certifications?.map((item, i) => (
                    <tr key={i} className="border-b border-black">
                      <td className="border border-black p-1.5 text-center">{item.s_no || i + 1}</td>
                      <td className="border border-black p-1.5 font-medium">{item.roll_no}</td>
                      <td className="border border-black p-1.5">{item.name || '-'}</td>
                      <td className="border border-black p-1.5 text-center">{item.year_sem}</td>
                      <td className="border border-black p-1.5 font-medium">{item.course_name}</td>
                      <td className="border border-black p-1.5">{item.organized_by}</td>
                      <td className="border border-black p-1.5">{item.duration}</td>
                      <td className="border border-black p-1.5">{item.grade}</td>
                      {isEditing && (
                        <td className="border border-black p-1.5 print:hidden text-center">
                          <button onClick={() => handleDeleteRow('5_student_achievements.c_online_certifications', i)} className="text-rose-600 hover:text-rose-800 cursor-pointer">
                            <Trash2 size={12} />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
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
                        onClick={() => handleAddRow('5_student_achievements.d_placements.ds_byd', { name: "NEW PLACEMENT", roll_no: "235U1A6700", date: "17-08-2026", company: "BYD", package: "6.5 LPA" })}
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
                    {s["5_student_achievements"]?.d_placements?.ds_byd?.map((item, i) => (
                      <tr key={i} className="border-b border-black">
                        <td className="border border-black p-1.5 text-center">{item.s_no || i + 1}</td>
                        <td className="border border-black p-1.5 font-medium">{item.name}</td>
                        <td className="border border-black p-1.5 font-mono">{item.roll_no}</td>
                        <td className="border border-black p-1.5">{item.date}</td>
                        {isEditing && (
                          <td className="border border-black p-1.5 print:hidden text-center">
                            <button onClick={() => handleDeleteRow('5_student_achievements.d_placements.ds_byd', i)} className="text-rose-600 hover:text-rose-800 cursor-pointer">
                              <Trash2 size={12} />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
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
                        onClick={() => handleAddRow('5_student_achievements.d_placements.aids_byd', { name: "NEW PLACEMENT", roll_no: "235U1A7200", date: "17-08-2026", company: "BYD", package: "6.5 LPA" })}
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
                    {s["5_student_achievements"]?.d_placements?.aids_byd?.map((item, i) => (
                      <tr key={i} className="border-b border-black">
                        <td className="border border-black p-1.5 text-center">{item.s_no || i + 1}</td>
                        <td className="border border-black p-1.5 font-medium">{item.name}</td>
                        <td className="border border-black p-1.5 font-mono">{item.roll_no}</td>
                        <td className="border border-black p-1.5">{item.date}</td>
                        {isEditing && (
                          <td className="border border-black p-1.5 print:hidden text-center">
                            <button onClick={() => handleDeleteRow('5_student_achievements.d_placements.aids_byd', i)} className="text-rose-600 hover:text-rose-800 cursor-pointer">
                              <Trash2 size={12} />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
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
                      onClick={() => handleAddRow('6_faculty_achievements.a_journal_publications', { authors: "Dr. Faculty Name", title: "Research Paper Title", journal: "International Journal of Engineering", volume_issue: "Vol. 12, Issue 4, 2026", indexing: "Scopus / SCI" })}
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
                  {s["6_faculty_achievements"]?.a_journal_publications?.length > 0 ? (
                    s["6_faculty_achievements"].a_journal_publications.map((item, i) => (
                      <tr key={i} className="border-b border-black">
                        <td className="border border-black p-1.5 text-center">{item.s_no || i + 1}</td>
                        <td className="border border-black p-1.5 font-medium">
                          {isEditing ? (
                            <input className="w-full bg-amber-50/60 p-0.5 border border-amber-300 text-xs" value={item.authors || ''} onChange={(e) => {
                              const updated = [...s["6_faculty_achievements"].a_journal_publications];
                              updated[i].authors = e.target.value;
                              updateSectionField('6_faculty_achievements.a_journal_publications', updated);
                            }} />
                          ) : item.authors}
                        </td>
                        <td className="border border-black p-1.5">
                          {isEditing ? (
                            <input className="w-full bg-amber-50/60 p-0.5 border border-amber-300 text-xs" value={item.title || ''} onChange={(e) => {
                              const updated = [...s["6_faculty_achievements"].a_journal_publications];
                              updated[i].title = e.target.value;
                              updateSectionField('6_faculty_achievements.a_journal_publications', updated);
                            }} />
                          ) : item.title}
                        </td>
                        <td className="border border-black p-1.5">
                          {isEditing ? (
                            <input className="w-full bg-amber-50/60 p-0.5 border border-amber-300 text-xs" value={item.journal || ''} onChange={(e) => {
                              const updated = [...s["6_faculty_achievements"].a_journal_publications];
                              updated[i].journal = e.target.value;
                              updateSectionField('6_faculty_achievements.a_journal_publications', updated);
                            }} />
                          ) : item.journal}
                        </td>
                        <td className="border border-black p-1.5">
                          {isEditing ? (
                            <input className="w-full bg-amber-50/60 p-0.5 border border-amber-300 text-xs" value={item.volume_issue || ''} onChange={(e) => {
                              const updated = [...s["6_faculty_achievements"].a_journal_publications];
                              updated[i].volume_issue = e.target.value;
                              updateSectionField('6_faculty_achievements.a_journal_publications', updated);
                            }} />
                          ) : item.volume_issue}
                        </td>
                        <td className="border border-black p-1.5">
                          {isEditing ? (
                            <input className="w-full bg-amber-50/60 p-0.5 border border-amber-300 text-xs" value={item.indexing || ''} onChange={(e) => {
                              const updated = [...s["6_faculty_achievements"].a_journal_publications];
                              updated[i].indexing = e.target.value;
                              updateSectionField('6_faculty_achievements.a_journal_publications', updated);
                            }} />
                          ) : item.indexing}
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
                      onClick={() => handleAddRow('6_faculty_achievements.c_patents', { authors: "Faculty Name", title: "Patent Invention Title", agency: "Indian Patent Office", filing_no_year: "202641012345, 2026", status: "Published" })}
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
                  {s["6_faculty_achievements"]?.c_patents?.length > 0 ? (
                    s["6_faculty_achievements"].c_patents.map((item, i) => (
                      <tr key={i} className="border-b border-black">
                        <td className="border border-black p-1.5 text-center">{item.s_no || i + 1}</td>
                        <td className="border border-black p-1.5 font-medium">
                          {isEditing ? (
                            <input className="w-full bg-amber-50/60 p-0.5 border border-amber-300 text-xs" value={item.authors || ''} onChange={(e) => {
                              const updated = [...s["6_faculty_achievements"].c_patents];
                              updated[i].authors = e.target.value;
                              updateSectionField('6_faculty_achievements.c_patents', updated);
                            }} />
                          ) : item.authors}
                        </td>
                        <td className="border border-black p-1.5">
                          {isEditing ? (
                            <input className="w-full bg-amber-50/60 p-0.5 border border-amber-300 text-xs" value={item.title || ''} onChange={(e) => {
                              const updated = [...s["6_faculty_achievements"].c_patents];
                              updated[i].title = e.target.value;
                              updateSectionField('6_faculty_achievements.c_patents', updated);
                            }} />
                          ) : item.title}
                        </td>
                        <td className="border border-black p-1.5">
                          {isEditing ? (
                            <input className="w-full bg-amber-50/60 p-0.5 border border-amber-300 text-xs" value={item.agency || ''} onChange={(e) => {
                              const updated = [...s["6_faculty_achievements"].c_patents];
                              updated[i].agency = e.target.value;
                              updateSectionField('6_faculty_achievements.c_patents', updated);
                            }} />
                          ) : item.agency}
                        </td>
                        <td className="border border-black p-1.5">
                          {isEditing ? (
                            <input className="w-full bg-amber-50/60 p-0.5 border border-amber-300 text-xs" value={item.filing_no_year || ''} onChange={(e) => {
                              const updated = [...s["6_faculty_achievements"].c_patents];
                              updated[i].filing_no_year = e.target.value;
                              updateSectionField('6_faculty_achievements.c_patents', updated);
                            }} />
                          ) : item.filing_no_year}
                        </td>
                        <td className="border border-black p-1.5 text-center font-bold">
                          {isEditing ? (
                            <select className="bg-amber-50/60 p-0.5 border border-amber-300 text-xs" value={item.status || 'Published'} onChange={(e) => {
                              const updated = [...s["6_faculty_achievements"].c_patents];
                              updated[i].status = e.target.value;
                              updateSectionField('6_faculty_achievements.c_patents', updated);
                            }}>
                              <option value="Published">Published</option>
                              <option value="Granted">Granted</option>
                              <option value="Filed">Filed</option>
                            </select>
                          ) : item.status}
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
                      onClick={() => handleAddRow('6_faculty_achievements.g_workshops_attended', { faculty_name: "Faculty Name", program_name: "AI & Machine Learning FDP", organized_by: "IIT Hyderabad / JNTUH", duration: "5 Days" })}
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
                  {s["6_faculty_achievements"]?.g_workshops_attended?.length > 0 ? (
                    s["6_faculty_achievements"].g_workshops_attended.map((item, i) => (
                      <tr key={i} className="border-b border-black">
                        <td className="border border-black p-1.5 text-center">{item.s_no || i + 1}</td>
                        <td className="border border-black p-1.5 font-medium">
                          {isEditing ? (
                            <input className="w-full bg-amber-50/60 p-0.5 border border-amber-300 text-xs" value={item.faculty_name || ''} onChange={(e) => {
                              const updated = [...s["6_faculty_achievements"].g_workshops_attended];
                              updated[i].faculty_name = e.target.value;
                              updateSectionField('6_faculty_achievements.g_workshops_attended', updated);
                            }} />
                          ) : item.faculty_name}
                        </td>
                        <td className="border border-black p-1.5">
                          {isEditing ? (
                            <input className="w-full bg-amber-50/60 p-0.5 border border-amber-300 text-xs" value={item.program_name || ''} onChange={(e) => {
                              const updated = [...s["6_faculty_achievements"].g_workshops_attended];
                              updated[i].program_name = e.target.value;
                              updateSectionField('6_faculty_achievements.g_workshops_attended', updated);
                            }} />
                          ) : item.program_name}
                        </td>
                        <td className="border border-black p-1.5">
                          {isEditing ? (
                            <input className="w-full bg-amber-50/60 p-0.5 border border-amber-300 text-xs" value={item.organized_by || ''} onChange={(e) => {
                              const updated = [...s["6_faculty_achievements"].g_workshops_attended];
                              updated[i].organized_by = e.target.value;
                              updateSectionField('6_faculty_achievements.g_workshops_attended', updated);
                            }} />
                          ) : item.organized_by}
                        </td>
                        <td className="border border-black p-1.5">
                          {isEditing ? (
                            <input className="w-full bg-amber-50/60 p-0.5 border border-amber-300 text-xs" value={item.duration || ''} onChange={(e) => {
                              const updated = [...s["6_faculty_achievements"].g_workshops_attended];
                              updated[i].duration = e.target.value;
                              updateSectionField('6_faculty_achievements.g_workshops_attended', updated);
                            }} />
                          ) : item.duration}
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
                    onClick={() => handleAddRow('7_non_teaching_training', { program_name: "Lab Equipment Handling & Safety", target_staff: "Technical & Lab Staff", resource_person: "Senior Instructor", duration: "1 Day", participants: "12" })}
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
                {s["7_non_teaching_training"]?.length > 0 ? (
                  s["7_non_teaching_training"].map((item, i) => (
                    <tr key={i} className="border-b border-black">
                      <td className="border border-black p-1.5 text-center">{item.s_no || i + 1}</td>
                      <td className="border border-black p-1.5 font-medium">
                        {isEditing ? (
                          <input className="w-full bg-amber-50/60 p-0.5 border border-amber-300 text-xs" value={item.program_name || ''} onChange={(e) => {
                            const updated = [...(s["7_non_teaching_training"] || [])];
                            updated[i].program_name = e.target.value;
                            updateSectionField('7_non_teaching_training', updated);
                          }} />
                        ) : item.program_name}
                      </td>
                      <td className="border border-black p-1.5">
                        {isEditing ? (
                          <input className="w-full bg-amber-50/60 p-0.5 border border-amber-300 text-xs" value={item.target_staff || ''} onChange={(e) => {
                            const updated = [...(s["7_non_teaching_training"] || [])];
                            updated[i].target_staff = e.target.value;
                            updateSectionField('7_non_teaching_training', updated);
                          }} />
                        ) : item.target_staff}
                      </td>
                      <td className="border border-black p-1.5">
                        {isEditing ? (
                          <input className="w-full bg-amber-50/60 p-0.5 border border-amber-300 text-xs" value={item.resource_person || ''} onChange={(e) => {
                            const updated = [...(s["7_non_teaching_training"] || [])];
                            updated[i].resource_person = e.target.value;
                            updateSectionField('7_non_teaching_training', updated);
                          }} />
                        ) : item.resource_person}
                      </td>
                      <td className="border border-black p-1.5">
                        {isEditing ? (
                          <input className="w-full bg-amber-50/60 p-0.5 border border-amber-300 text-xs" value={item.duration || ''} onChange={(e) => {
                            const updated = [...(s["7_non_teaching_training"] || [])];
                            updated[i].duration = e.target.value;
                            updateSectionField('7_non_teaching_training', updated);
                          }} />
                        ) : item.duration}
                      </td>
                      <td className="border border-black p-1.5 text-center font-bold">
                        {isEditing ? (
                          <input className="w-full bg-amber-50/60 p-0.5 border border-amber-300 text-xs text-center" value={item.participants || ''} onChange={(e) => {
                            const updated = [...(s["7_non_teaching_training"] || [])];
                            updated[i].participants = e.target.value;
                            updateSectionField('7_non_teaching_training', updated);
                          }} />
                        ) : item.participants}
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
                    onClick={() => handleAddRow('8_infrastructure_investment', { name: "Laboratory Computers / Equipment", specs: "Core i7, 16GB RAM", quantity: "20", date: "15-08-2026", supplier: "Tech Systems", amount: "10,00,000" })}
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
                {s["8_infrastructure_investment"]?.length > 0 ? (
                  s["8_infrastructure_investment"].map((item, i) => (
                    <tr key={i} className="border-b border-black">
                      <td className="border border-black p-1.5 text-center">{item.s_no || i + 1}</td>
                      <td className="border border-black p-1.5 font-medium">
                        {isEditing ? (
                          <input className="w-full bg-amber-50/60 p-0.5 border border-amber-300 text-xs" value={item.name || ''} onChange={(e) => {
                            const updated = [...s["8_infrastructure_investment"]];
                            updated[i].name = e.target.value;
                            updateSectionField('8_infrastructure_investment', updated);
                          }} />
                        ) : item.name}
                      </td>
                      <td className="border border-black p-1.5">
                        {isEditing ? (
                          <input className="w-full bg-amber-50/60 p-0.5 border border-amber-300 text-xs" value={item.specs || ''} onChange={(e) => {
                            const updated = [...s["8_infrastructure_investment"]];
                            updated[i].specs = e.target.value;
                            updateSectionField('8_infrastructure_investment', updated);
                          }} />
                        ) : item.specs}
                      </td>
                      <td className="border border-black p-1.5 text-center">
                        {isEditing ? (
                          <input className="w-full bg-amber-50/60 p-0.5 border border-amber-300 text-xs text-center" value={item.quantity || ''} onChange={(e) => {
                            const updated = [...s["8_infrastructure_investment"]];
                            updated[i].quantity = e.target.value;
                            updateSectionField('8_infrastructure_investment', updated);
                          }} />
                        ) : item.quantity}
                      </td>
                      <td className="border border-black p-1.5">
                        {isEditing ? (
                          <input className="w-full bg-amber-50/60 p-0.5 border border-amber-300 text-xs" value={item.date || ''} onChange={(e) => {
                            const updated = [...s["8_infrastructure_investment"]];
                            updated[i].date = e.target.value;
                            updateSectionField('8_infrastructure_investment', updated);
                          }} />
                        ) : item.date}
                      </td>
                      <td className="border border-black p-1.5">
                        {isEditing ? (
                          <input className="w-full bg-amber-50/60 p-0.5 border border-amber-300 text-xs" value={item.supplier || ''} onChange={(e) => {
                            const updated = [...s["8_infrastructure_investment"]];
                            updated[i].supplier = e.target.value;
                            updateSectionField('8_infrastructure_investment', updated);
                          }} />
                        ) : item.supplier}
                      </td>
                      <td className="border border-black p-1.5 text-center font-bold">
                        {isEditing ? (
                          <input className="w-full bg-amber-50/60 p-0.5 border border-amber-300 text-xs text-center font-bold" value={item.amount || ''} onChange={(e) => {
                            const updated = [...s["8_infrastructure_investment"]];
                            updated[i].amount = e.target.value;
                            updateSectionField('8_infrastructure_investment', updated);
                          }} />
                        ) : item.amount}
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
                    onClick={() => handleAddRow('9_mous_signed', { company: "Industry / Organization Name", purpose: "Collaborative Training & Placements", date: "20-08-2026", validity: "3 Years", activities: "Workshops & Internships" })}
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
                {s["9_mous_signed"]?.length > 0 ? (
                  s["9_mous_signed"].map((item, i) => (
                    <tr key={i} className="border-b border-black">
                      <td className="border border-black p-1.5 text-center">{item.s_no || i + 1}</td>
                      <td className="border border-black p-1.5 font-medium">
                        {isEditing ? (
                          <input className="w-full bg-amber-50/60 p-0.5 border border-amber-300 text-xs" value={item.company || ''} onChange={(e) => {
                            const updated = [...(s["9_mous_signed"] || [])];
                            updated[i].company = e.target.value;
                            updateSectionField('9_mous_signed', updated);
                          }} />
                        ) : item.company}
                      </td>
                      <td className="border border-black p-1.5">
                        {isEditing ? (
                          <input className="w-full bg-amber-50/60 p-0.5 border border-amber-300 text-xs" value={item.purpose || ''} onChange={(e) => {
                            const updated = [...(s["9_mous_signed"] || [])];
                            updated[i].purpose = e.target.value;
                            updateSectionField('9_mous_signed', updated);
                          }} />
                        ) : item.purpose}
                      </td>
                      <td className="border border-black p-1.5">
                        {isEditing ? (
                          <input className="w-full bg-amber-50/60 p-0.5 border border-amber-300 text-xs" value={item.date || ''} onChange={(e) => {
                            const updated = [...(s["9_mous_signed"] || [])];
                            updated[i].date = e.target.value;
                            updateSectionField('9_mous_signed', updated);
                          }} />
                        ) : item.date}
                      </td>
                      <td className="border border-black p-1.5">
                        {isEditing ? (
                          <input className="w-full bg-amber-50/60 p-0.5 border border-amber-300 text-xs" value={item.validity || ''} onChange={(e) => {
                            const updated = [...(s["9_mous_signed"] || [])];
                            updated[i].validity = e.target.value;
                            updateSectionField('9_mous_signed', updated);
                          }} />
                        ) : item.validity}
                      </td>
                      <td className="border border-black p-1.5">
                        {isEditing ? (
                          <input className="w-full bg-amber-50/60 p-0.5 border border-amber-300 text-xs" value={item.activities || ''} onChange={(e) => {
                            const updated = [...(s["9_mous_signed"] || [])];
                            updated[i].activities = e.target.value;
                            updateSectionField('9_mous_signed', updated);
                          }} />
                        ) : item.activities}
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
                  {customTable.rows?.length > 0 ? (
                    customTable.rows.map((row, rIdx) => (
                      <tr key={rIdx} className="border-b border-black">
                        {customTable.columns?.map((col, cIdx) => (
                          <td key={cIdx} className={`border border-black p-1.5 ${cIdx === 0 ? 'text-center font-medium' : ''}`}>
                            {isEditing && cIdx !== 0 ? (
                              <input 
                                className="w-full bg-amber-50/60 p-0.5 border border-amber-300 text-xs" 
                                value={row[col] || ''} 
                                onChange={(e) => {
                                  const updated = [...(s["custom_tables"] || [])];
                                  updated[tableIdx].rows[rIdx][col] = e.target.value;
                                  updateSectionField("custom_tables", updated);
                                }} 
                              />
                            ) : (
                              row[col] || (cIdx === 0 ? rIdx + 1 : '-')
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
                    <span className="text-[10px] text-amber-700 font-medium">
                      (Unlimited lines/bullet points supported)
                    </span>
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
    </div>
  );
};

export default IQACMonthlyReport;

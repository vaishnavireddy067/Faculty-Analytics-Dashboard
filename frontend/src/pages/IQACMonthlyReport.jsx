import React, { useState, useEffect, useRef } from 'react';
import { 
  Download, Printer, FileText, FileSpreadsheet, RefreshCw, 
  PlusCircle, Trash2, CheckCircle2, Building, Calendar, 
  Layers, Award, BookOpen, Users, Briefcase, ChevronDown, 
  ChevronRight, Edit3, Save, Database, History, AlertCircle, Plus, X
} from 'lucide-react';
import { fetchAPI } from '../services/api';

const IQACMonthlyReport = () => {
  const [department, setDepartment] = useState('Computer Science & Engineering (Data Science) and AI&DS');
  const [month, setMonth] = useState('AUGUST');
  const [year, setYear] = useState('2025');
  const [academicYear, setAcademicYear] = useState('2025-26');
  const [isCustomDept, setIsCustomDept] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState('');
  const [reportData, setReportData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  
  // Stored archives in DB
  const [savedReportsList, setSavedReportsList] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

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
    loadReportData();
    loadSavedReportsList();
  }, [department, month, year, academicYear]);

  // Save report directly to Database
  const handleSaveToDatabase = async () => {
    if (!reportData) return;
    setSaving(true);
    setSaveSuccess('');
    try {
      const res = await fetch('http://127.0.0.1:8000/api/faculty/reports/iqac-monthly/', {
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
        setSaveSuccess('Report saved persistently in database! You can retrieve and download it anytime.');
        loadSavedReportsList();
        // Mark as saved in local state
        setReportData(prev => ({ ...prev, is_saved_in_db: true, updated_at: result.updated_at }));
        setTimeout(() => setSaveSuccess(''), 5000);
      }
    } catch (err) {
      console.error("Failed to save report to database", err);
    } finally {
      setSaving(false);
    }
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
    window.open(`http://127.0.0.1:8000/api/faculty/reports/iqac-monthly/export-excel/?department=${encodeURIComponent(department)}&month=${month}&year=${year}`, '_blank');
  };

  if (!reportData && loading) {
    return <div className="p-12 text-center text-gray-500">Loading IQAC monthly report...</div>;
  }

  const s = reportData?.sections || {};

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
              Monthly IQAC Departmental Report
            </h1>
            <p className="text-xs text-gray-500 dark:text-slate-400">
              Manual entries are stored persistently in the database so you can pull, update, and download official NAAC/NBA documents anytime.
            </p>
          </div>

          {/* Quick Action Export Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleSaveToDatabase}
              disabled={saving}
              className="inline-flex items-center px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
            >
              <Save size={16} className={`mr-1.5 ${saving ? 'animate-spin' : ''}`} />
              {saving ? 'Saving to Database...' : 'Save Data to DB'}
            </button>

            <button
              onClick={handlePrintPDF}
              className="inline-flex items-center px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-500/20 transition-all cursor-pointer"
            >
              <Printer size={16} className="mr-1.5" /> Download / Print PDF
            </button>

            <button
              onClick={handleExportWord}
              className="inline-flex items-center px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
            >
              <FileText size={16} className="mr-1.5" /> Export Word (.doc)
            </button>

            <button
              onClick={handleExportExcel}
              className="inline-flex items-center px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
            >
              <FileSpreadsheet size={16} className="mr-1.5" /> Export Excel
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
        </div>

        {/* Save success banner */}
        {saveSuccess && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 flex items-center justify-between animate-in fade-in">
            <div className="flex items-center space-x-2">
              <CheckCircle2 size={16} className="text-emerald-600" />
              <span className="font-semibold">{saveSuccess}</span>
            </div>
          </div>
        )}

        {/* Filters and Saved Archives History */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 pt-3 border-t border-gray-100 dark:border-slate-800 text-xs">
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

          <div>
            <label className="block text-gray-500 dark:text-slate-400 font-semibold mb-1">Saved Reports in DB</label>
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="w-full bg-indigo-50 dark:bg-slate-800 border border-indigo-200 dark:border-slate-700 rounded-xl px-3 py-2 font-bold text-indigo-700 dark:text-indigo-300 flex items-center justify-between"
            >
              <span className="flex items-center gap-1.5 truncate">
                <History size={14} />
                <span>{savedReportsList.length} Stored in DB</span>
              </span>
              <ChevronDown size={14} />
            </button>
          </div>
        </div>

        {/* Saved Reports Drawer / Dropdown */}
        {showHistory && (
          <div className="mt-3 p-4 bg-gray-50 dark:bg-slate-800/80 rounded-2xl border border-gray-200 dark:border-slate-700 space-y-2">
            <h4 className="font-bold text-xs text-gray-700 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <Database size={14} className="text-indigo-600" />
              <span>Saved IQAC Reports Archive (Click to Load & Download)</span>
            </h4>
            {savedReportsList.length === 0 ? (
              <p className="text-xs text-gray-400 italic">No custom reports saved yet. Click "Save Data to DB" to archive the current month's report.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-1">
                {savedReportsList.map((r) => (
                  <div 
                    key={r.id}
                    onClick={() => {
                      setDepartment(r.department);
                      setMonth(r.month);
                      setYear(r.year);
                      setAcademicYear(r.academic_year || '2025-26');
                      setShowHistory(false);
                    }}
                    className="p-3 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl cursor-pointer hover:border-indigo-500 hover:shadow-sm transition text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between font-bold text-gray-900 dark:text-white">
                      <span>{r.month} {r.year}</span>
                      <span className="px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950 text-[10px] text-indigo-700 dark:text-indigo-300">Open</span>
                    </div>
                    <p className="text-[11px] text-gray-500 dark:text-slate-400 truncate">{r.department}</p>
                    <p className="text-[10px] text-gray-400">Updated: {r.updated_at}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

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

        {/* SECTION 1: Programmes / Events organized for the students */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-bold text-sm text-black">
              1. Programmes / Events organized for the students:
            </h4>
            {isEditing && (
              <button
                onClick={() => handleAddRow('1_student_events', { name: "New Event", association: "-", level: "Department level", duration: "1 day", chief_guest: "Resource Person", honorarium: "-", misc_expenses: "-", target_students: "All Students" })}
                className="print:hidden px-2 py-1 rounded bg-indigo-50 border border-indigo-200 text-indigo-700 text-[10px] font-bold flex items-center gap-1 hover:bg-indigo-100"
              >
                <Plus size={12} /> Add Event
              </button>
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
                {s["1_student_events"]?.map((item, i) => (
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
                        <button onClick={() => handleDeleteRow('1_student_events', i)} className="text-rose-600 hover:text-rose-800">
                          <Trash2 size={12} />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* SECTION 2: Programmes / Events organized for the faculties */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-bold text-sm text-black">
              2. Programmes / Events organized for the faculties:
            </h4>
            {isEditing && (
              <button
                onClick={() => handleAddRow('2_faculty_events', { name: "Faculty FDP/Workshop", association: "CSI", level: "Department level", duration: "2 days", chief_guest: "Speaker", faculty_count: "20", honorarium: "-", misc_expenses: "-" })}
                className="print:hidden px-2 py-1 rounded bg-indigo-50 border border-indigo-200 text-indigo-700 text-[10px] font-bold flex items-center gap-1 hover:bg-indigo-100"
              >
                <Plus size={12} /> Add Row
              </button>
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
                          <button onClick={() => handleDeleteRow('2_faculty_events', i)} className="text-rose-600">
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

        {/* SECTION 3: Value Added / Certification Courses */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-bold text-sm text-black">
              3. Value Added / Certification Courses conducted:
            </h4>
            {isEditing && (
              <button
                onClick={() => handleAddRow('3_value_added_courses', { name: "Course Name", resource_person: "Trainer", level: "Dept level", duration: "30h", contact_periods: "30", students_registered: "50", remuneration: "-", target_students: "UG" })}
                className="print:hidden px-2 py-1 rounded bg-indigo-50 border border-indigo-200 text-indigo-700 text-[10px] font-bold flex items-center gap-1 hover:bg-indigo-100"
              >
                <Plus size={12} /> Add Course
              </button>
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
                          <button onClick={() => handleDeleteRow('3_value_added_courses', i)} className="text-rose-600">
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

        {/* SECTION 4: Activities for Advanced learners */}
        <div className="mb-6">
          <h4 className="font-bold text-sm text-black mb-2">
            4. Activities Arranged/conducted for Advanced learners:
          </h4>
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
                </tr>
              </thead>
              <tbody>
                {s["4_advanced_learners"]?.length > 0 ? (
                  s["4_advanced_learners"].map((item, i) => (
                    <tr key={i} className="border-b border-black">
                      <td className="border border-black p-1.5 text-center">{item.s_no || i + 1}</td>
                      <td className="border border-black p-1.5 font-medium">{item.name}</td>
                      <td className="border border-black p-1.5">{item.level}</td>
                      <td className="border border-black p-1.5">{item.duration}</td>
                      <td className="border border-black p-1.5 text-center">{item.contact_periods}</td>
                      <td className="border border-black p-1.5">{item.chief_guest}</td>
                      <td className="border border-black p-1.5 text-center">{item.honorarium || '-'}</td>
                      <td className="border border-black p-1.5 text-center">{item.misc_expenses || '-'}</td>
                      <td className="border border-black p-1.5">{item.target_students}</td>
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
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* SECTION 5: Student Achievements */}
        <div className="mb-6">
          <h4 className="font-bold text-sm text-black mb-3">
            5. Student Achievements:
          </h4>

          {/* 5.a */}
          <div className="mb-4 pl-2">
            <div className="flex items-center justify-between mb-1.5">
              <h5 className="font-semibold text-xs text-black">
                a. Curricular & Co Curricular Activities (Seminars/ Symposiums /Hackathons/Conference etc.)
              </h5>
              {isEditing && (
                <button
                  onClick={() => handleAddRow('5_student_achievements.a_curricular', { roll_no: "245U1A6700", name: "Student Name", year_sem: "III/I", event_name: "National Hackathon", organized_by: "University", duration: "2 days", prizes: "First Prize" })}
                  className="print:hidden px-2 py-0.5 rounded bg-indigo-50 border border-indigo-200 text-indigo-700 text-[10px] font-bold flex items-center gap-1 hover:bg-indigo-100"
                >
                  <Plus size={11} /> Add Achievement
                </button>
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
                        <button onClick={() => handleDeleteRow('5_student_achievements.a_curricular', i)} className="text-rose-600">
                          <Trash2 size={12} />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 5.b */}
          <div className="mb-4 pl-2">
            <div className="flex items-center justify-between mb-1.5">
              <h5 className="font-semibold text-xs text-black">
                b. Extracurricular Activities (Cultural / Games & Sports)
              </h5>
              {isEditing && (
                <button
                  onClick={() => handleAddRow('5_student_achievements.b_extracurricular', { roll_no: "245U1A6712", name: "Student Name", year_sem: "III/I", event_name: "Sports Event", organized_by: "Sports Board", duration: "1 day", prizes: "Gold Medal" })}
                  className="print:hidden px-2 py-0.5 rounded bg-indigo-50 border border-indigo-200 text-indigo-700 text-[10px] font-bold flex items-center gap-1 hover:bg-indigo-100"
                >
                  <Plus size={11} /> Add Sport/Cultural
                </button>
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
                          <button onClick={() => handleDeleteRow('5_student_achievements.b_extracurricular', i)} className="text-rose-600">
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

          {/* 5.c */}
          <div className="mb-4 pl-2">
            <div className="flex items-center justify-between mb-1.5">
              <h5 className="font-semibold text-xs text-black">
                c. Online Certification Courses (NPTEL, COURSERA & OTHERS) pursued / Internships undergone:
              </h5>
              {isEditing && (
                <button
                  onClick={() => handleAddRow('5_student_achievements.c_online_certifications', { roll_no: "All Students", name: "-", year_sem: "III/I", course_name: "Machine Learning", organized_by: "NPTEL", duration: "12 Weeks", grade: "Elite" })}
                  className="print:hidden px-2 py-0.5 rounded bg-indigo-50 border border-indigo-200 text-indigo-700 text-[10px] font-bold flex items-center gap-1 hover:bg-indigo-100"
                >
                  <Plus size={11} /> Add Certification
                </button>
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
                        <button onClick={() => handleDeleteRow('5_student_achievements.c_online_certifications', i)} className="text-rose-600">
                          <Trash2 size={12} />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 5.d Placements */}
          <div className="mb-4 pl-2">
            <h5 className="font-semibold text-xs text-black mb-1.5">
              d. Placements:
            </h5>
            
            {/* DS - BYD Table */}
            <div className="mb-4">
              <div className="flex items-center justify-between font-bold text-[11px] bg-gray-100 border border-black px-2 py-1 uppercase">
                <span>DS - BYD</span>
                {isEditing && (
                  <button
                    onClick={() => handleAddRow('5_student_achievements.d_placements.ds_byd', { name: "NEW PLACEMENT", roll_no: "235U1A6700", date: "17-08-2026", company: "BYD", package: "6.5 LPA" })}
                    className="print:hidden text-indigo-700 hover:text-indigo-900 text-[10px] font-bold"
                  >
                    + Add Placed Student
                  </button>
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
                          <button onClick={() => handleDeleteRow('5_student_achievements.d_placements.ds_byd', i)} className="text-rose-600">
                            <Trash2 size={12} />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* AI & DS - BYD Table */}
            <div>
              <div className="flex items-center justify-between font-bold text-[11px] bg-gray-100 border border-black px-2 py-1 uppercase">
                <span>AI & DS - BYD</span>
                {isEditing && (
                  <button
                    onClick={() => handleAddRow('5_student_achievements.d_placements.aids_byd', { name: "NEW PLACEMENT", roll_no: "235U1A7200", date: "17-08-2026", company: "BYD", package: "6.5 LPA" })}
                    className="print:hidden text-indigo-700 hover:text-indigo-900 text-[10px] font-bold"
                  >
                    + Add Placed Student
                  </button>
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
                          <button onClick={() => handleDeleteRow('5_student_achievements.d_placements.aids_byd', i)} className="text-rose-600">
                            <Trash2 size={12} />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* SECTION 6: Faculty Achievements */}
        <div className="mb-6">
          <h4 className="font-bold text-sm text-black mb-3">
            6. Faculty Achievements:
          </h4>

          {/* 6.a */}
          <div className="mb-4 pl-2">
            <h5 className="font-semibold text-xs text-black mb-1.5">
              a. Journal Publications:
            </h5>
            <table className="w-full text-[11px] border-collapse border border-black text-left">
              <thead>
                <tr className="bg-gray-100 font-bold border-b border-black">
                  <th className="border border-black p-1.5 w-10 text-center">S.No</th>
                  <th className="border border-black p-1.5">Name(s) of the Author(s)</th>
                  <th className="border border-black p-1.5">Title of the paper</th>
                  <th className="border border-black p-1.5">Name of the Journal</th>
                  <th className="border border-black p-1.5">Volume, Issue no., PP & Year</th>
                  <th className="border border-black p-1.5">Indexing (SCI / Scopus/ WOS / UGC care)</th>
                </tr>
              </thead>
              <tbody>
                {s["6_faculty_achievements"]?.a_journal_publications?.length > 0 ? (
                  s["6_faculty_achievements"].a_journal_publications.map((item, i) => (
                    <tr key={i} className="border-b border-black">
                      <td className="border border-black p-1.5 text-center">{item.s_no || i + 1}</td>
                      <td className="border border-black p-1.5 font-medium">{item.authors}</td>
                      <td className="border border-black p-1.5">{item.title}</td>
                      <td className="border border-black p-1.5">{item.journal}</td>
                      <td className="border border-black p-1.5">{item.volume_issue}</td>
                      <td className="border border-black p-1.5">{item.indexing}</td>
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
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* 6.c */}
          <div className="mb-4 pl-2">
            <h5 className="font-semibold text-xs text-black mb-1.5">
              c. Patents Published/ Granted:
            </h5>
            <table className="w-full text-[11px] border-collapse border border-black text-left">
              <thead>
                <tr className="bg-gray-100 font-bold border-b border-black">
                  <th className="border border-black p-1.5 w-10 text-center">S.No</th>
                  <th className="border border-black p-1.5">Name(s) of the Author(s)</th>
                  <th className="border border-black p-1.5">Title of the patent</th>
                  <th className="border border-black p-1.5">Name of the agency</th>
                  <th className="border border-black p-1.5">Filing No. & Year</th>
                  <th className="border border-black p-1.5 text-center">Published / Granted</th>
                </tr>
              </thead>
              <tbody>
                {s["6_faculty_achievements"]?.c_patents?.length > 0 ? (
                  s["6_faculty_achievements"].c_patents.map((item, i) => (
                    <tr key={i} className="border-b border-black">
                      <td className="border border-black p-1.5 text-center">{item.s_no || i + 1}</td>
                      <td className="border border-black p-1.5 font-medium">{item.authors}</td>
                      <td className="border border-black p-1.5">{item.title}</td>
                      <td className="border border-black p-1.5">{item.agency}</td>
                      <td className="border border-black p-1.5">{item.filing_no_year}</td>
                      <td className="border border-black p-1.5 text-center font-bold">{item.status}</td>
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
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* 6.g */}
          <div className="mb-4 pl-2">
            <h5 className="font-semibold text-xs text-black mb-1.5">
              g. Workshops/FDPs/STTPs attended:
            </h5>
            <table className="w-full text-[11px] border-collapse border border-black text-left">
              <thead>
                <tr className="bg-gray-100 font-bold border-b border-black">
                  <th className="border border-black p-1.5 w-10 text-center">S.No</th>
                  <th className="border border-black p-1.5">Name of the Faculty</th>
                  <th className="border border-black p-1.5">Name of the Workshop/FDP/ STTP Program</th>
                  <th className="border border-black p-1.5">Organized by</th>
                  <th className="border border-black p-1.5">Duration</th>
                </tr>
              </thead>
              <tbody>
                {s["6_faculty_achievements"]?.g_workshops_attended?.map((item, i) => (
                  <tr key={i} className="border-b border-black">
                    <td className="border border-black p-1.5 text-center">{item.s_no || i + 1}</td>
                    <td className="border border-black p-1.5 font-medium">{item.faculty_name}</td>
                    <td className="border border-black p-1.5">{item.program_name}</td>
                    <td className="border border-black p-1.5">{item.organized_by}</td>
                    <td className="border border-black p-1.5">{item.duration}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* SECTION 7, 8, 9 */}
        <div className="mb-6">
          <h4 className="font-bold text-sm text-black mb-2">
            8. Investment on Infrastructure:
          </h4>
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
              </tr>
            </thead>
            <tbody>
              {s["8_infrastructure_investment"]?.map((item, i) => (
                <tr key={i} className="border-b border-black">
                  <td className="border border-black p-1.5 text-center">{item.s_no || i + 1}</td>
                  <td className="border border-black p-1.5 font-medium">{item.name}</td>
                  <td className="border border-black p-1.5">{item.specs}</td>
                  <td className="border border-black p-1.5 text-center">{item.quantity}</td>
                  <td className="border border-black p-1.5">{item.date}</td>
                  <td className="border border-black p-1.5">{item.supplier}</td>
                  <td className="border border-black p-1.5 text-center font-bold">{item.amount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* SECTION 10, 11, 12 */}
        <div className="space-y-3 mb-10 text-xs">
          <div>
            <span className="font-bold">10. Alumni Activities (if any):</span>
            {isEditing ? (
              <textarea 
                className="w-full mt-1 p-2 border border-amber-300 bg-amber-50/50 text-xs rounded"
                value={s["10_alumni_activities"] || ""}
                onChange={(e) => updateSectionField("10_alumni_activities", e.target.value)}
              />
            ) : (
              <p className="mt-1 pl-4 text-gray-800 italic">{s["10_alumni_activities"] || "Nil"}</p>
            )}
          </div>

          <div>
            <span className="font-bold">11. Parent Teacher meetings (if any):</span>
            {isEditing ? (
              <textarea 
                className="w-full mt-1 p-2 border border-amber-300 bg-amber-50/50 text-xs rounded"
                value={s["11_parent_teacher_meetings"] || ""}
                onChange={(e) => updateSectionField("11_parent_teacher_meetings", e.target.value)}
              />
            ) : (
              <p className="mt-1 pl-4 text-gray-800 italic">{s["11_parent_teacher_meetings"] || "Nil"}</p>
            )}
          </div>

          <div>
            <span className="font-bold">12. Other Information (if any):</span>
            {isEditing ? (
              <textarea 
                className="w-full mt-1 p-2 border border-amber-300 bg-amber-50/50 text-xs rounded"
                value={s["12_other_information"] || ""}
                onChange={(e) => updateSectionField("12_other_information", e.target.value)}
              />
            ) : (
              <p className="mt-1 pl-4 text-gray-800 italic">{s["12_other_information"] || "Nil"}</p>
            )}
          </div>
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

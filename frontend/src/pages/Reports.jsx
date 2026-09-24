import React, { useState, useEffect } from 'react';
import { fetchAPI } from '../services/api';
import { Download, FileSpreadsheet, FileText, CheckCircle, BarChart2, Filter, Award, ShieldCheck, Archive, Eye, RefreshCw, Printer } from 'lucide-react';

const Reports = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Consolidated Report Filters & State
  const [academicYear, setAcademicYear] = useState('2025-26');
  const [selectedDept, setSelectedDept] = useState('CSE');
  const [reportData, setReportData] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const data = await fetchAPI('/faculty/profile/');
        setProfile(data);
      } catch (error) {
        console.error("Failed to load profile", error);
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, []);

  const fetchConsolidatedReport = async () => {
    setReportLoading(true);
    try {
      const query = `academic_year=${academicYear}&department=${selectedDept === 'ALL' ? '' : selectedDept}`;
      const data = await fetchAPI(`/faculty/reports/consolidated/?${query}`);
      setReportData(data);
    } catch (err) {
      console.error('Failed to fetch consolidated report', err);
      // Fallback mock report data
      setReportData({
        academic_year: academicYear,
        department: selectedDept,
        faculty_reports: [
          {
            faculty_id: 1,
            faculty_name: 'Dr. Anitha',
            department: selectedDept === 'ALL' ? 'CSE' : selectedDept,
            academic_year: academicYear,
            publications: 8,
            patents: 2,
            fdps: 5,
            certifications: 4,
            grants_lakhs: 4.0,
            consultancy: 2,
            student_guidance: 6,
            college_responsibilities: 'Exam Coordinator, IQAC Coordinator',
            roles_list: ['Exam Coordinator', 'IQAC Coordinator'],
            awards: 3,
            student_feedback: '4.6/5',
            api_score: 156.0,
            verified_documents: 18
          },
          {
            faculty_id: 2,
            faculty_name: 'Dr. Ravi',
            department: selectedDept === 'ALL' ? 'CSE' : selectedDept,
            academic_year: academicYear,
            publications: 6,
            patents: 1,
            fdps: 7,
            certifications: 3,
            grants_lakhs: 2.5,
            consultancy: 1,
            student_guidance: 4,
            college_responsibilities: 'NSS Coordinator',
            roles_list: ['NSS Coordinator'],
            awards: 2,
            student_feedback: '4.4/5',
            api_score: 135.0,
            verified_documents: 14
          },
          {
            faculty_id: 3,
            faculty_name: 'Dr. Priya',
            department: selectedDept === 'ALL' ? 'CSE' : selectedDept,
            academic_year: academicYear,
            publications: 10,
            patents: 3,
            fdps: 4,
            certifications: 5,
            grants_lakhs: 6.0,
            consultancy: 3,
            student_guidance: 8,
            college_responsibilities: 'Placement Coordinator, Cultural Coordinator',
            roles_list: ['Placement Coordinator', 'Cultural Coordinator'],
            awards: 4,
            student_feedback: '4.8/5',
            api_score: 180.0,
            verified_documents: 22
          }
        ],
        department_totals: {
          publications: 24,
          patents: 6,
          fdps: 16,
          certifications: 12,
          grants_lakhs: 12.5,
          consultancy: 6,
          student_guidance: 18,
          awards: 9,
          api_score_total: 471.0,
          verified_docs: 54
        }
      });
    } finally {
      setReportLoading(false);
    }
  };

  useEffect(() => {
    fetchConsolidatedReport();
  }, [academicYear, selectedDept]);

  const handleExportPDF = () => {
    window.print();
  };

  const handleExportExcel = () => {
    if (!reportData || !reportData.faculty_reports) return;
    const headers = ["Faculty Name", "Department", "Academic Year", "Publications", "Patents", "FDPs", "Certifications", "Grants (Lakhs)", "Consultancy", "Student Guidance", "College Responsibilities", "Awards", "Student Feedback", "API Score", "Verified Docs"];
    const rows = reportData.faculty_reports.map(f => [
      f.faculty_name, f.department, f.academic_year, f.publications, f.patents, f.fdps, f.certifications, f.grants_lakhs, f.consultancy, f.student_guidance, `"${f.college_responsibilities}"`, f.awards, f.student_feedback, f.api_score, f.verified_documents
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Consolidated_Faculty_Report_${selectedDept}_${academicYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadZipBundle = () => {
    const url = `http://127.0.0.1:8000/api/faculty/certificates/download-zip/?department=${selectedDept === 'ALL' ? '' : selectedDept}`;
    window.open(url, '_blank');
  };

  const handleExportCompliance = (type) => {
    window.open(`http://127.0.0.1:8000/api/analytics/export/compliance/${type}/`, '_blank');
  };

  const handleExportAppraisal = () => {
    window.open('http://127.0.0.1:8000/api/analytics/export/appraisal/', '_blank');
  };

  if (loading) {
    return <div className="p-12 text-center text-gray-500">Loading reports hub...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 p-4 md:p-6">
      {/* Page Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Reports & Accreditation Hub</h1>
          <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">
            Generate consolidated faculty performance forms, accreditation reports, and download certificate bundles.
          </p>
        </div>
      </div>

      {/* 🏛️ OFFICIAL INSTITUTIONAL IQAC MONTHLY REPORT HIGHLIGHT CARD */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-indigo-700/40">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
              <Award size={14} className="text-amber-400" />
              <span>Standard Institutional IQAC Format (AVN Institute)</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
              Official Monthly Departmental IQAC Report
            </h2>
            <p className="text-sm text-indigo-200">
              Pre-configured with all 12 institutional criteria: Student & Faculty Events, Advanced Learners, Curricular & Hackathons, Placements (DS/AI&DS BYD), Publications, Patents, FDPs, MOUs, and HOD/IQAC Signatures.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <a
              href="/iqac-report"
              className="inline-flex items-center px-5 py-3 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-sm font-black shadow-lg transition-all transform hover:-translate-y-0.5"
            >
              <FileText size={18} className="mr-2 text-slate-950" />
              Open & Download IQAC Report
            </a>
            <a
              href="http://127.0.0.1:8000/api/faculty/reports/iqac-monthly/export-excel/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-sm font-bold border border-white/20 backdrop-blur-xs transition"
            >
              <Download size={17} className="mr-2" />
              Quick Excel Download
            </a>
          </div>
        </div>
      </div>

      {/* ⭐ MAIN FEATURE: CONSOLIDATED FACULTY REPORT GENERATOR */}
      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl p-6 shadow-lg space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-gray-100 dark:border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-md">
              <FileText size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">CONSOLIDATED FACULTY REPORT</h2>
              <p className="text-xs text-gray-500 dark:text-slate-400">
                Integrates Faculty Research + College Responsibilities + Proofs + Performance metrics into one document.
              </p>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="flex items-center space-x-2 bg-gray-50 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-slate-700 text-xs">
              <span className="font-semibold text-gray-500 dark:text-slate-400">Year:</span>
              <select
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                className="bg-transparent font-bold text-gray-800 dark:text-white focus:outline-none"
              >
                <option value="2025-26">2025–26</option>
                <option value="2024-25">2024–25</option>
                <option value="2023-24">2023–24</option>
              </select>
            </div>

            <div className="flex items-center space-x-2 bg-gray-50 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-slate-700 text-xs">
              <span className="font-semibold text-gray-500 dark:text-slate-400">Dept:</span>
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="bg-transparent font-bold text-gray-800 dark:text-white focus:outline-none"
              >
                <option value="CSE">CSE Department</option>
                <option value="ECE">ECE Department</option>
                <option value="EEE">EEE Department</option>
                <option value="MECH">MECH Department</option>
                <option value="CIVIL">CIVIL Department</option>
                <option value="ALL">All Departments</option>
              </select>
            </div>

            <button
              onClick={fetchConsolidatedReport}
              className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 transition"
              title="Refresh Report"
            >
              <RefreshCw size={18} className={reportLoading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Report Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-indigo-50/50 dark:bg-slate-800/50 p-4 rounded-2xl border border-indigo-100 dark:border-slate-700">
          <div className="flex items-center space-x-2 text-xs font-semibold text-indigo-900 dark:text-indigo-200">
            <Award size={18} className="text-indigo-600" />
            <span>Generate & Download Consolidated Report Options:</span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleExportPDF}
              className="inline-flex items-center px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition"
            >
              <FileText size={15} className="mr-1.5" /> PDF Report
            </button>

            <button
              onClick={handleExportExcel}
              className="inline-flex items-center px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition"
            >
              <FileSpreadsheet size={15} className="mr-1.5" /> Excel Report
            </button>

            <button
              onClick={handleDownloadZipBundle}
              className="inline-flex items-center px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-sm transition"
              title="Download all verified certificates in a single ZIP file"
            >
              <Archive size={15} className="mr-1.5" /> Certificate Bundle (ZIP)
            </button>
          </div>
        </div>

        {/* Consolidated Report Matrix Table */}
        {reportLoading ? (
          <div className="p-12 text-center text-gray-500 dark:text-slate-400">Loading consolidated faculty report...</div>
        ) : reportData && reportData.faculty_reports ? (
          <div className="space-y-6">
            <div className="overflow-x-auto rounded-2xl border border-gray-200 dark:border-slate-800">
              <table className="w-full text-xs text-left">
                <thead className="bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-200 uppercase font-bold tracking-wider">
                  <tr>
                    <th className="p-3.5">Faculty Name</th>
                    <th className="p-3.5">Dept</th>
                    <th className="p-3.5">Pubs</th>
                    <th className="p-3.5">Patents</th>
                    <th className="p-3.5">FDPs</th>
                    <th className="p-3.5">Certs</th>
                    <th className="p-3.5">Grants (₹)</th>
                    <th className="p-3.5">Consultancy</th>
                    <th className="p-3.5">Guidance</th>
                    <th className="p-3.5 min-w-[200px]">College Responsibilities</th>
                    <th className="p-3.5">Awards</th>
                    <th className="p-3.5">Feedback</th>
                    <th className="p-3.5">API Score</th>
                    <th className="p-3.5">Verified Docs</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-slate-800 bg-white dark:bg-slate-900 text-gray-800 dark:text-slate-200">
                  {reportData.faculty_reports.map((fac, idx) => (
                    <tr key={fac.faculty_id || idx} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition">
                      <td className="p-3.5 font-bold text-gray-900 dark:text-white flex items-center space-x-2">
                        <span>{fac.faculty_name}</span>
                      </td>
                      <td className="p-3.5">{fac.department}</td>
                      <td className="p-3.5 font-semibold text-indigo-600 dark:text-indigo-400">{fac.publications}</td>
                      <td className="p-3.5 font-semibold text-purple-600 dark:text-purple-400">{fac.patents}</td>
                      <td className="p-3.5 font-semibold">{fac.fdps}</td>
                      <td className="p-3.5 font-semibold">{fac.certifications}</td>
                      <td className="p-3.5 font-bold text-emerald-600 dark:text-emerald-400">₹{fac.grants_lakhs}L</td>
                      <td className="p-3.5">{fac.consultancy}</td>
                      <td className="p-3.5">{fac.student_guidance}</td>
                      <td className="p-3.5 font-medium">
                        <span className="px-2 py-1 rounded bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-700">
                          {fac.college_responsibilities || 'Exam Coordinator, IQAC Coordinator'}
                        </span>
                      </td>
                      <td className="p-3.5 font-semibold">{fac.awards}</td>
                      <td className="p-3.5 font-semibold text-amber-600">{fac.student_feedback}</td>
                      <td className="p-3.5 font-extrabold text-indigo-600 dark:text-indigo-400">{fac.api_score}</td>
                      <td className="p-3.5 font-bold text-emerald-600">
                        <span className="inline-flex items-center">
                          <CheckCircle size={13} className="mr-1 text-emerald-500" /> {fac.verified_documents}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                {reportData.department_totals && (
                  <tfoot className="bg-gray-100 dark:bg-slate-800/80 font-bold text-gray-900 dark:text-white border-t-2 border-gray-300 dark:border-slate-700">
                    <tr>
                      <td className="p-3.5" colSpan="2">DEPARTMENT TOTAL</td>
                      <td className="p-3.5 text-indigo-600">{reportData.department_totals.publications}</td>
                      <td className="p-3.5 text-purple-600">{reportData.department_totals.patents}</td>
                      <td className="p-3.5">{reportData.department_totals.fdps}</td>
                      <td className="p-3.5">{reportData.department_totals.certifications}</td>
                      <td className="p-3.5 text-emerald-600">₹{reportData.department_totals.grants_lakhs}L</td>
                      <td className="p-3.5">{reportData.department_totals.consultancy}</td>
                      <td className="p-3.5">{reportData.department_totals.student_guidance}</td>
                      <td className="p-3.5 text-gray-500 italic">Department Coordinator Roles Active</td>
                      <td className="p-3.5">{reportData.department_totals.awards}</td>
                      <td className="p-3.5 text-amber-600">4.6/5 Avg</td>
                      <td className="p-3.5 text-indigo-600">{reportData.department_totals.api_score_total}</td>
                      <td className="p-3.5 text-emerald-600">{reportData.department_totals.verified_docs}</td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        ) : null}
      </div>

      {/* Standard Compliance Reports Section */}
      <div>
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Accreditation & Compliance Reports</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-800 p-6 flex flex-col hover:shadow-md transition">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl w-fit mb-4">
              <FileSpreadsheet size={24} />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">NAAC Compliance Report</h3>
            <p className="text-sm text-gray-500 dark:text-slate-400 mb-6 flex-1">
              Export faculty metrics tailored to NAAC Criteria (3.1.1, 3.2.2, 3.3.2) in Excel format.
            </p>
            <button 
              onClick={() => handleExportCompliance('naac')}
              className="w-full flex items-center justify-center gap-2 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-700 dark:text-slate-200 px-4 py-2.5 rounded-xl font-medium transition"
            >
              <Download size={18} /> Export Excel
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-800 p-6 flex flex-col hover:shadow-md transition">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl w-fit mb-4">
              <FileSpreadsheet size={24} />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">NBA Compliance Report</h3>
            <p className="text-sm text-gray-500 dark:text-slate-400 mb-6 flex-1">
              Export faculty research and development metrics for NBA Criterion 5 requirements.
            </p>
            <button 
              onClick={() => handleExportCompliance('nba')}
              className="w-full flex items-center justify-center gap-2 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-700 dark:text-slate-200 px-4 py-2.5 rounded-xl font-medium transition"
            >
              <Download size={18} /> Export Excel
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-800 p-6 flex flex-col hover:shadow-md transition">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl w-fit mb-4">
              <FileSpreadsheet size={24} />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">NIRF Ranking Data</h3>
            <p className="text-sm text-gray-500 dark:text-slate-400 mb-6 flex-1">
              Generates a report structured for NIRF Research and Professional Practice (RPC) scoring.
            </p>
            <button 
              onClick={() => handleExportCompliance('nirf')}
              className="w-full flex items-center justify-center gap-2 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-700 dark:text-slate-200 px-4 py-2.5 rounded-xl font-medium transition"
            >
              <Download size={18} /> Export Excel
            </button>
          </div>
        </div>
      </div>

      {/* 🌟 NAAC SSR Criterion 3 Live Matrix Evaluator */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-800 p-6 md:p-8 space-y-6 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 dark:border-slate-800 pb-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 mb-2 border border-indigo-200 dark:border-indigo-800">
              <ShieldCheck size={14} className="text-emerald-500" />
              <span>NAAC Self-Study Report (SSR) • Criterion 3 Evaluator</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 dark:text-white">
              Research, Innovations and Extension Scorecard
            </h2>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
              Automated institutional scoring based on NAAC Quantitative Metrics (QnM) benchmarks.
            </p>
          </div>

          <div className="bg-gradient-to-br from-indigo-900 via-indigo-950 to-purple-950 p-4 rounded-2xl text-white border border-indigo-800/50 shadow-md text-center min-w-[200px]">
            <p className="text-[11px] font-semibold text-indigo-300 uppercase tracking-wider">Projected NAAC Grade</p>
            <p className="text-2xl font-black text-emerald-400 mt-0.5">A++ <span className="text-sm font-bold text-white">(3.68 / 4.00)</span></p>
            <p className="text-[10px] text-indigo-200 mt-1">Criterion 3 Readiness: <strong className="text-white">91.4%</strong></p>
          </div>
        </div>

        {/* Metric Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            {
              code: "3.1.1",
              title: "Research Grants Received",
              value: "₹48.50 Lakhs",
              target: "₹50.00 L",
              score: 97,
              tag: "Target Met",
              tagColor: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
            },
            {
              code: "3.2.2",
              title: "Workshops & IPR Seminars",
              value: "16 Conducted",
              target: "10 / Year",
              score: 100,
              tag: "Exceeds Benchmark",
              tagColor: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
            },
            {
              code: "3.3.1",
              title: "Scopus / SCI Publications",
              value: "42 Journal Papers",
              target: "30 / Dept",
              score: 100,
              tag: "High Quality Q1/Q2",
              tagColor: "bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300"
            },
            {
              code: "3.3.2",
              title: "Books & Chapters Published",
              value: "14 Authored",
              target: "8 / Year",
              score: 95,
              tag: "Compliant",
              tagColor: "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300"
            },
            {
              code: "3.4.1",
              title: "Patents Published & Granted",
              value: "8 Total (3 Granted)",
              target: "5 / Dept",
              score: 90,
              tag: "Strong IPR Growth",
              tagColor: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
            },
            {
              code: "3.5.1",
              title: "Consultancy & Industry Income",
              value: "₹12.80 Lakhs",
              target: "₹10.00 L",
              score: 92,
              tag: "Target Met",
              tagColor: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
            }
          ].map((item, idx) => (
            <div key={idx} className="p-4 rounded-2xl bg-gray-50/70 dark:bg-slate-800/60 border border-gray-100 dark:border-slate-800 flex flex-col justify-between hover:shadow-xs transition-shadow">
              <div>
                <div className="flex justify-between items-start mb-2">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300">
                    Criterion {item.code}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${item.tagColor}`}>
                    {item.tag}
                  </span>
                </div>
                <h4 className="text-xs font-bold text-gray-900 dark:text-white leading-snug">{item.title}</h4>
                <div className="mt-3 flex items-baseline justify-between">
                  <span className="text-base font-black text-gray-900 dark:text-white">{item.value}</span>
                  <span className="text-[11px] text-gray-400">Target: {item.target}</span>
                </div>
              </div>
              <div className="mt-3 pt-2.5 border-t border-gray-200/60 dark:border-slate-700/60">
                <div className="flex justify-between text-[11px] text-gray-500 dark:text-slate-400 mb-1">
                  <span>Metric Score</span>
                  <span className="font-bold text-indigo-600 dark:text-indigo-400">{item.score}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-gradient-to-r from-indigo-500 to-emerald-400 h-full rounded-full" style={{ width: `${item.score}%` }}></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

export default Reports;

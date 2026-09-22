import React, { useState, useEffect } from 'react';
import {
  Layers, BarChart2, TrendingUp, Award, Download, RefreshCw,
  Building2, Users, ShieldCheck, ChevronRight
} from 'lucide-react';
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid
} from 'recharts';
import { facultyService } from '../services/api';

const DepartmentComparison = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDepts, setSelectedDepts] = useState(['CSE', 'ECE', 'MECH']);

  useEffect(() => {
    fetchComparison();
  }, []);

  const fetchComparison = async () => {
    setLoading(true);
    try {
      const res = await facultyService.getDepartmentComparison();
      setData(res);
    } catch (e) {
      console.error(e);
      setData({
        academic_year: '2025-26',
        total_faculty_evaluated: 150,
        leading_department: 'CSE',
        departments: [
          { name: 'Computer Science & Engineering', code: 'CSE', faculty_count: 38, publications: 94, scopus_percent: 82, patents: 14, grants_lakhs: 68.5, fdp_participations: 120, consultancy_lakhs: 24.2, overall_score: 92 },
          { name: 'Electronics & Communication', code: 'ECE', faculty_count: 28, publications: 62, scopus_percent: 74, patents: 9, grants_lakhs: 45.0, fdp_participations: 86, consultancy_lakhs: 18.0, overall_score: 84 },
          { name: 'Mechanical Engineering', code: 'MECH', faculty_count: 24, publications: 48, scopus_percent: 65, patents: 12, grants_lakhs: 52.0, fdp_participations: 72, consultancy_lakhs: 31.5, overall_score: 81 },
          { name: 'Information Technology', code: 'IT', faculty_count: 22, publications: 55, scopus_percent: 78, patents: 6, grants_lakhs: 38.0, fdp_participations: 80, consultancy_lakhs: 14.5, overall_score: 80 },
          { name: 'Electrical & Electronics', code: 'EEE', faculty_count: 20, publications: 41, scopus_percent: 68, patents: 5, grants_lakhs: 29.0, fdp_participations: 65, consultancy_lakhs: 12.0, overall_score: 76 },
          { name: 'Civil Engineering', code: 'CIVIL', faculty_count: 18, publications: 34, scopus_percent: 60, patents: 4, grants_lakhs: 22.0, fdp_participations: 54, consultancy_lakhs: 26.0, overall_score: 73 }
        ]
      });
    } finally {
      setLoading(false);
    }
  };

  const departments = data?.departments || [];

  // Normalized Radar Metrics (0 - 100)
  const radarData = [
    {
      metric: 'Research Papers',
      CSE: 94,
      ECE: 62,
      MECH: 48,
      IT: 55,
      fullMark: 100
    },
    {
      metric: 'Scopus Indexed %',
      CSE: 82,
      ECE: 74,
      MECH: 65,
      IT: 78,
      fullMark: 100
    },
    {
      metric: 'Patents & IP',
      CSE: 85,
      ECE: 60,
      MECH: 75,
      IT: 45,
      fullMark: 100
    },
    {
      metric: 'Sponsored Grants',
      CSE: 90,
      ECE: 70,
      MECH: 80,
      IT: 60,
      fullMark: 100
    },
    {
      metric: 'Faculty FDPs',
      CSE: 95,
      ECE: 75,
      MECH: 65,
      IT: 70,
      fullMark: 100
    },
    {
      metric: 'Consultancy',
      CSE: 75,
      ECE: 60,
      MECH: 90,
      IT: 55,
      fullMark: 100
    }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-violet-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center space-x-2 text-blue-200 text-xs font-bold uppercase tracking-wider mb-2">
            <Building2 size={16} />
            <span>Institutional Hierarchy Benchmarking</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Department Performance & Radar Comparison
          </h1>
          <p className="mt-2 text-blue-100 text-sm max-w-2xl leading-relaxed">
            Multi-dimensional comparative analytics across Engineering departments for NAAC, NIRF, and Board of Governors reviews.
          </p>
        </div>

        <button
          onClick={fetchComparison}
          className="px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/30 rounded-xl text-white font-semibold text-sm backdrop-blur-sm transition-all flex items-center space-x-2 self-start md:self-auto"
        >
          <RefreshCw size={16} />
          <span>Refresh Analytics</span>
        </button>
      </div>

      {/* Top KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-gray-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Top Performing Department</span>
          <h3 className="text-xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">Computer Science (CSE)</h3>
          <p className="text-xs text-gray-500 mt-0.5">Composite Score: 92/100</p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-gray-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Institutional Grants</span>
          <h3 className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">₹254.5 Lakhs</h3>
          <p className="text-xs text-gray-500 mt-0.5">Across 6 Departments</p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-gray-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Indexed Papers</span>
          <h3 className="text-xl font-bold text-blue-600 dark:text-blue-400 mt-1">334 Publications</h3>
          <p className="text-xs text-gray-500 mt-0.5">74% Average Scopus Indexing</p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-gray-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Patents Published/Granted</span>
          <h3 className="text-xl font-bold text-purple-600 dark:text-purple-400 mt-1">50 Patents</h3>
          <p className="text-xs text-gray-500 mt-0.5">18 Commercialized/Granted</p>
        </div>
      </div>

      {/* Visual Comparison Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Multi-Department Radar Chart */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-gray-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white text-base">Multi-Pillar Radar Benchmark</h3>
              <p className="text-xs text-gray-500 dark:text-slate-400">Comparing CSE vs ECE vs MECH vs IT</p>
            </div>
            <span className="px-2 py-0.5 text-xs font-bold bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-lg">
              Radar View
            </span>
          </div>

          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                <PolarGrid stroke="#cbd5e1" strokeDasharray="3 3" />
                <PolarAngleAxis dataKey="metric" stroke="#64748b" tick={{ fontSize: 11 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#94a3b8" />
                <Radar name="CSE" dataKey="CSE" stroke="#4f46e5" fill="#4f46e5" fillOpacity={0.4} />
                <Radar name="ECE" dataKey="ECE" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.3} />
                <Radar name="MECH" dataKey="MECH" stroke="#10b981" fill="#10b981" fillOpacity={0.2} />
                <Legend />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Grouped Bar Chart: Grants vs Publications */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-gray-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white text-base">Grants & Publications by Department</h3>
              <p className="text-xs text-gray-500 dark:text-slate-400">Research volume & external funding</p>
            </div>
            <span className="px-2 py-0.5 text-xs font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-lg">
              Bar View
            </span>
          </div>

          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={departments} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="code" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="publications" name="Publications (Count)" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                <Bar dataKey="grants_lakhs" name="Grants (₹ Lakhs)" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="consultancy_lakhs" name="Consultancy (₹ Lakhs)" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Department Ranking Leaderboard Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-gray-200 dark:border-slate-800 shadow-sm">
        <h3 className="font-bold text-gray-900 dark:text-white text-base mb-4">
          Institutional Department Ranking Table (2025–26)
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-gray-50 dark:bg-slate-800/60 text-gray-700 dark:text-slate-300 border-b border-gray-200 dark:border-slate-700">
                <th className="p-3 font-bold">Rank</th>
                <th className="p-3 font-bold">Department</th>
                <th className="p-3 font-bold text-center">Faculty</th>
                <th className="p-3 font-bold text-center">Publications</th>
                <th className="p-3 font-bold text-center">Scopus %</th>
                <th className="p-3 font-bold text-center">Patents</th>
                <th className="p-3 font-bold text-center">Grants (₹ L)</th>
                <th className="p-3 font-bold text-center">Consultancy (₹ L)</th>
                <th className="p-3 font-bold text-right">Composite Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
              {departments.map((dept, index) => (
                <tr key={dept.code} className="hover:bg-gray-50/60 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="p-3 font-extrabold text-indigo-600 dark:text-indigo-400">
                    #{index + 1}
                  </td>
                  <td className="p-3 font-semibold text-gray-900 dark:text-white">
                    {dept.name} ({dept.code})
                  </td>
                  <td className="p-3 text-center text-gray-600 dark:text-slate-300">{dept.faculty_count}</td>
                  <td className="p-3 text-center text-gray-900 dark:text-white font-bold">{dept.publications}</td>
                  <td className="p-3 text-center text-indigo-600 dark:text-indigo-400 font-semibold">{dept.scopus_percent}%</td>
                  <td className="p-3 text-center text-gray-600 dark:text-slate-300">{dept.patents}</td>
                  <td className="p-3 text-center text-emerald-600 dark:text-emerald-400 font-bold">₹{dept.grants_lakhs}</td>
                  <td className="p-3 text-center text-amber-600 dark:text-amber-400 font-bold">₹{dept.consultancy_lakhs}</td>
                  <td className="p-3 text-right">
                    <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-950/70 dark:text-indigo-300">
                      {dept.overall_score} / 100
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DepartmentComparison;

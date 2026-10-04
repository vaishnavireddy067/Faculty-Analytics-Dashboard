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
        total_faculty_evaluated: 0,
        leading_department: 'Pending Department Submissions',
        departments: [
          { name: 'Computer Science & Engineering', code: 'CSE', faculty_count: 0, publications: 0, scopus_percent: 0, patents: 0, grants_lakhs: 0.0, fdp_participations: 0, consultancy_lakhs: 0.0, overall_score: 0 },
          { name: 'Electronics & Communication', code: 'ECE', faculty_count: 0, publications: 0, scopus_percent: 0, patents: 0, grants_lakhs: 0.0, fdp_participations: 0, consultancy_lakhs: 0.0, overall_score: 0 },
          { name: 'Mechanical Engineering', code: 'MECH', faculty_count: 0, publications: 0, scopus_percent: 0, patents: 0, grants_lakhs: 0.0, fdp_participations: 0, consultancy_lakhs: 0.0, overall_score: 0 },
          { name: 'Information Technology', code: 'IT', faculty_count: 0, publications: 0, scopus_percent: 0, patents: 0, grants_lakhs: 0.0, fdp_participations: 0, consultancy_lakhs: 0.0, overall_score: 0 },
          { name: 'Electrical & Electronics', code: 'EEE', faculty_count: 0, publications: 0, scopus_percent: 0, patents: 0, grants_lakhs: 0.0, fdp_participations: 0, consultancy_lakhs: 0.0, overall_score: 0 },
          { name: 'Civil Engineering', code: 'CIVIL', faculty_count: 0, publications: 0, scopus_percent: 0, patents: 0, grants_lakhs: 0.0, fdp_participations: 0, consultancy_lakhs: 0.0, overall_score: 0 }
        ]
      });
    } finally {
      setLoading(false);
    }
  };

  const departments = data?.departments || [];

  // Dynamically compute KPIs from real data
  const totalGrants = departments.reduce((acc, d) => acc + (Number(d.grants_lakhs) || 0), 0);
  const totalPubs = departments.reduce((acc, d) => acc + (Number(d.publications) || 0), 0);
  const totalPatents = departments.reduce((acc, d) => acc + (Number(d.patents) || 0), 0);
  const avgScopus = totalPubs > 0
    ? Math.round(departments.reduce((acc, d) => acc + ((d.publications || 0) * (d.scopus_percent || 0)), 0) / totalPubs)
    : 0;

  const topDept = [...departments].sort((a, b) => (b.overall_score || 0) - (a.overall_score || 0))[0];

  // Dynamic Radar metrics from live data
  const radarData = [
    {
      metric: 'Research Papers',
      ...departments.reduce((acc, d) => ({ ...acc, [d.code]: d.publications || 0 }), {}),
      fullMark: Math.max(...departments.map(d => d.publications || 0), 10)
    },
    {
      metric: 'Scopus Indexed %',
      ...departments.reduce((acc, d) => ({ ...acc, [d.code]: d.scopus_percent || 0 }), {}),
      fullMark: 100
    },
    {
      metric: 'Patents & IP',
      ...departments.reduce((acc, d) => ({ ...acc, [d.code]: d.patents || 0 }), {}),
      fullMark: Math.max(...departments.map(d => d.patents || 0), 5)
    },
    {
      metric: 'Sponsored Grants',
      ...departments.reduce((acc, d) => ({ ...acc, [d.code]: d.grants_lakhs || 0 }), {}),
      fullMark: Math.max(...departments.map(d => d.grants_lakhs || 0), 10)
    },
    {
      metric: 'Faculty FDPs',
      ...departments.reduce((acc, d) => ({ ...acc, [d.code]: d.fdp_participations || 0 }), {}),
      fullMark: Math.max(...departments.map(d => d.fdp_participations || 0), 10)
    },
    {
      metric: 'Consultancy',
      ...departments.reduce((acc, d) => ({ ...acc, [d.code]: d.consultancy_lakhs || 0 }), {}),
      fullMark: Math.max(...departments.map(d => d.consultancy_lakhs || 0), 10)
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
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Leading Department</span>
          <h3 className="text-xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">
            {topDept && topDept.overall_score > 0 ? `${topDept.name} (${topDept.code})` : 'Pending Submissions'}
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {topDept && topDept.overall_score > 0 ? `Composite Score: ${topDept.overall_score}/100` : 'No verified submissions yet'}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-gray-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Institutional Grants</span>
          <h3 className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">₹{totalGrants.toFixed(2)} Lakhs</h3>
          <p className="text-xs text-gray-500 mt-0.5">Across {departments.length} Departments</p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-gray-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Indexed Papers</span>
          <h3 className="text-xl font-bold text-blue-600 dark:text-blue-400 mt-1">{totalPubs} Publications</h3>
          <p className="text-xs text-gray-500 mt-0.5">{avgScopus}% Average Scopus Indexing</p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-gray-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Patents Published/Granted</span>
          <h3 className="text-xl font-bold text-purple-600 dark:text-purple-400 mt-1">{totalPatents} Patents</h3>
          <p className="text-xs text-gray-500 mt-0.5">Live database count</p>
        </div>
      </div>

      {/* Visual Comparison Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Multi-Department Radar Chart */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-gray-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white text-base">Multi-Pillar Radar Benchmark</h3>
              <p className="text-xs text-gray-500 dark:text-slate-400">Comparing live department metrics</p>
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
                <PolarRadiusAxis angle={30} domain={[0, 'auto']} stroke="#94a3b8" />
                <Radar name="CSE" dataKey="CSE" stroke="#4f46e5" fill="#4f46e5" fillOpacity={0.3} />
                <Radar name="ECE" dataKey="ECE" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.25} />
                <Radar name="MECH" dataKey="MECH" stroke="#10b981" fill="#10b981" fillOpacity={0.2} />
                <Radar name="IT" dataKey="IT" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.2} />
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

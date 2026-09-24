import React, { useState, useEffect } from 'react';
import { fetchAPI, API_BASE_URL } from '../services/api';
import { Users, FileText, Award, IndianRupee, TrendingUp, TrendingDown, Download, FileSpreadsheet, Brain, Star } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Target, Medal, MessageSquareText, CalendarDays, Clock } from 'lucide-react';

const COLORS = ['#4f46e5', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const StatCard = ({ title, value, icon, trend, trendValue, colorClass }) => (
  <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 flex flex-col h-full hover:shadow-md transition-shadow">
    <div className="flex justify-between items-start mb-4">
      <div>
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{title}</p>
        <h3 className="text-3xl font-bold text-gray-900 dark:text-white">{value}</h3>
      </div>
      <div className={`p-3 rounded-xl ${colorClass}`}>
        {icon}
      </div>
    </div>
    <div className="mt-auto flex items-center text-sm">
      {trend === 'up' ? (
        <TrendingUp size={16} className="text-emerald-500 mr-1" />
      ) : (
        <TrendingDown size={16} className="text-rose-500 mr-1" />
      )}
      <span className={trend === 'up' ? 'text-emerald-600 font-medium' : 'text-rose-600 font-medium'}>
        {trendValue}
      </span>
      <span className="text-gray-400 ml-2">vs last month</span>
    </div>
  </div>
);

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [aiData, setAiData] = useState(null);
  const [fundingData, setFundingData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardStats = async () => {
      try {
        const stats = await fetchAPI('/analytics/stats/');
        setData(stats);
        if (stats.role === 'FACULTY') {
            const ai = await fetchAPI('/analytics/ai-insights/');
            setAiData(ai);
            const funding = await fetchAPI('/faculty/funding-finder/');
            setFundingData(funding);
        }
      } catch (error) {
        console.error("Failed to load dashboard stats", error);
      } finally {
        setLoading(false);
      }
    };
    loadDashboardStats();

    // Auto-refresh for real-time KPI updates (every 30 seconds)
    const interval = setInterval(() => {
        loadDashboardStats();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const handleExportPDF = () => {
    window.open(`${API_BASE_URL}/analytics/export/pdf/`, '_blank');
  };

  const handleExportExcel = () => {
    window.open(`${API_BASE_URL}/analytics/export/excel/`, '_blank');
  };

  const handleExportCompliance = (type) => {
    window.open(`${API_BASE_URL}/analytics/export/compliance/${type}/`, '_blank');
  };

  const handleExportAppraisal = () => {
    window.open(`${API_BASE_URL}/analytics/export/appraisal/`, '_blank');
  };

  if (loading) {
    return <div className="flex h-full items-center justify-center p-12 text-gray-500">Loading Analytics...</div>;
  }

  const currentYear = new Date().getFullYear();
  const role = data?.role || 'FACULTY';
  const kpis = data?.kpis || {
    total_faculty: 1,
    total_publications: 0,
    total_patents: 0,
    total_grants_amount: 0
  };
  const trend_data = data?.trend_data || [
    { name: String(currentYear - 2), publications: 0 },
    { name: String(currentYear - 1), publications: 0 },
    { name: String(currentYear), publications: 0 }
  ];
  const dept_data = data?.dept_data || [
    { name: 'CSE', value: 0 }
  ];
  const recent_activities = data?.recent_activities || [];
  const isFaculty = role === 'FACULTY';

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isFaculty ? 'My Performance Overview' : 'Dashboard Overview'}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {role === 'ADMIN' ? 'College-wide analytics and faculty performance.' : 
             role === 'HOD' ? 'Department analytics.' : 'Your recent activities and stats.'}
          </p>
        </div>
        
        <div className="flex gap-2 flex-wrap justify-end">
          {isFaculty && (
            <button onClick={handleExportAppraisal} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors shadow-sm">
              <Download size={16} /> Annual Appraisal
            </button>
          )}
          {!isFaculty && (
            <>
              <button onClick={() => handleExportCompliance('naac')} className="flex items-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-3 py-2 rounded-lg font-medium text-sm transition-colors shadow-sm">
                <FileSpreadsheet size={16} /> NAAC
              </button>
              <button onClick={() => handleExportCompliance('nba')} className="flex items-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-3 py-2 rounded-lg font-medium text-sm transition-colors shadow-sm">
                <FileSpreadsheet size={16} /> NBA
              </button>
              <button onClick={() => handleExportCompliance('nirf')} className="flex items-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-3 py-2 rounded-lg font-medium text-sm transition-colors shadow-sm">
                <FileSpreadsheet size={16} /> NIRF
              </button>
              <button onClick={handleExportPDF} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors shadow-sm">
                <Download size={16} /> Full PDF
              </button>
            </>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {!isFaculty && (
          <StatCard 
            title="Total Faculty" 
            value={kpis.total_faculty} 
            icon={<Users size={24} className="text-indigo-600" />} 
            trend="up" 
            trendValue="+12%" 
            colorClass="bg-indigo-50"
          />
        )}
        <StatCard 
          title={isFaculty ? 'My Publications' : 'Total Publications'}
          value={kpis.total_publications} 
          icon={<FileText size={24} className="text-sky-600" />} 
          trend="up" 
          trendValue="+18%" 
          colorClass="bg-sky-50"
        />
        <StatCard 
          title={isFaculty ? 'My Patents' : 'Total Patents'}
          value={kpis.total_patents} 
          icon={<Award size={24} className="text-emerald-600" />} 
          trend="up" 
          trendValue="+2" 
          colorClass="bg-emerald-50"
        />
        <StatCard 
          title={isFaculty ? 'My Grants' : 'Total Grants'} 
          value={`₹${(kpis.total_grants_amount || 0).toLocaleString()}`} 
          icon={<IndianRupee size={24} className="text-amber-600" />} 
          trend="up" 
          trendValue="+5%" 
          colorClass="bg-amber-50"
        />
      </div>

      {/* Charts Section */}
      {isFaculty && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-indigo-900 to-purple-800 rounded-2xl shadow-lg p-6 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl"></div>
            <h3 className="text-lg font-bold mb-4 flex items-center relative z-10">
              <Target className="mr-2" size={24} /> Automated API Score
            </h3>
            <div className="relative z-10 space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-indigo-200">Research Score</span>
                <span className="font-semibold">40/50</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-indigo-200">Teaching Score</span>
                <span className="font-semibold">35/40</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-indigo-200">Service Score</span>
                <span className="font-semibold">15/20</span>
              </div>
              <div className="pt-4 mt-4 border-t border-white/20">
                <div className="flex justify-between items-center">
                  <span className="text-lg text-indigo-100">Total Score</span>
                  <span className="text-3xl font-extrabold text-white">90<span className="text-xl text-indigo-300">/110</span></span>
                </div>
              </div>
            </div>
          </div>
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-800 p-6 flex flex-col transition-colors">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
              <Medal className="mr-2 text-yellow-500" size={24} /> Achievement Badges
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-2">
              <div className="flex flex-col items-center p-4 bg-yellow-50/70 dark:bg-yellow-950/30 border border-yellow-100 dark:border-yellow-900/40 rounded-2xl text-center group hover:bg-yellow-100/70 transition-colors cursor-default">
                <span className="text-4xl mb-2 group-hover:scale-110 transition-transform">🏆</span>
                <span className="text-xs font-bold text-yellow-800 dark:text-yellow-300">Research Champion</span>
              </div>
              <div className="flex flex-col items-center p-4 bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40 rounded-2xl text-center group hover:bg-emerald-100/70 transition-colors cursor-default">
                <span className="text-4xl mb-2 group-hover:scale-110 transition-transform">🥇</span>
                <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">Patent Creator</span>
              </div>
              <div className="flex flex-col items-center p-4 bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 rounded-2xl text-center group hover:bg-indigo-100/70 transition-colors cursor-default">
                <span className="text-4xl mb-2 group-hover:scale-110 transition-transform">📚</span>
                <span className="text-xs font-bold text-indigo-800 dark:text-indigo-300">Publication Leader</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className={`grid grid-cols-1 ${!isFaculty ? 'lg:grid-cols-3' : ''} gap-6`}>
        {/* Main Chart */}
        <div className={`bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-800 transition-colors ${!isFaculty ? 'lg:col-span-2' : ''}`}>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Publication Trend (Last 5 Years)</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend_data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorPub" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Area type="monotone" dataKey="publications" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorPub)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Secondary Chart (Only for Admins/HoD) */}
        {!isFaculty && dept_data && dept_data.length > 0 && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-6">Faculty by Department</h3>
            <div className="h-64 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dept_data}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {dept_data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}/>
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* AI Insights Section */}
      {isFaculty && aiData && (
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-2xl shadow-sm border border-indigo-100">
          <div className="flex items-center gap-2 mb-4">
            <Brain className="text-indigo-600" size={24} />
            <h3 className="text-xl font-bold text-indigo-900">AI Co-Pilot Insights</h3>
          </div>
          <p className="text-sm text-indigo-800 mb-6 font-medium">{aiData.summary}</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-sm border border-transparent dark:border-slate-700">
              <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><Star size={18} className="text-amber-500"/> Recommended Journals</h4>
              <ul className="space-y-3">
                {aiData.journal_recommendations.map((j, i) => (
                  <li key={i} className="flex justify-between items-center text-sm border-b border-gray-50 pb-3 last:border-0 last:pb-0">
                    <span className="font-medium text-gray-800">{j.name}</span>
                    <span className="text-xs bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full font-medium">IF: {j.impact_factor}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-sm border border-transparent dark:border-slate-700">
              <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><TrendingUp size={18} className="text-emerald-500"/> Accreditation Gap Analysis</h4>
              <ul className="space-y-3 text-sm text-gray-700 list-disc pl-5">
                {aiData.gap_analysis.map((gap, i) => (
                  <li key={i}>{gap}</li>
                ))}
              </ul>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            {fundingData && (
              <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-sm border border-transparent dark:border-slate-700 md:col-span-2">
                <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><IndianRupee size={18} className="text-amber-500"/> Recommended Grants for You</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {fundingData.recommended_grants.map((grant, i) => (
                    <div key={i} className="border border-gray-100 dark:border-slate-700 rounded-lg p-4 bg-gray-50 dark:bg-slate-900 flex flex-col justify-between">
                      <div>
                        <h5 className="font-bold text-gray-800 dark:text-gray-200 text-sm mb-2">{grant.title}</h5>
                        <p className="text-xs text-gray-500 mb-1"><strong>Amount:</strong> {grant.amount}</p>
                        <p className="text-xs text-gray-500 mb-1"><strong>Deadline:</strong> {grant.deadline}</p>
                      </div>
                      <div className="mt-3 flex justify-between items-center">
                        <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">Match: {grant.match}</span>
                        <button className="text-xs text-indigo-600 font-medium hover:underline">View Details</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Student Feedback System */}
      {isFaculty && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 p-6">
          <div className="flex flex-col md:flex-row justify-between md:items-center mb-6 gap-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
              <MessageSquareText className="mr-2 text-indigo-500" size={24} /> Student Feedback & Ratings
            </h3>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1.5 rounded-lg">
                <span className="text-lg font-bold text-indigo-700 dark:text-indigo-400">4.8</span>
                <span className="text-sm text-indigo-500 font-medium">/ 5.0</span>
              </div>
            </div>
          </div>
          
          <div className="mb-6 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-xl p-4 border border-emerald-100 dark:border-emerald-800/30 flex gap-4">
            <div className="h-10 w-10 bg-emerald-100 dark:bg-emerald-800/50 rounded-full flex items-center justify-center flex-shrink-0 text-emerald-600 dark:text-emerald-400">
              <Brain size={20} />
            </div>
            <div>
              <h4 className="font-bold text-gray-900 dark:text-emerald-100 text-sm mb-1">AI Sentiment Analysis</h4>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                <strong>Sentiment:</strong> 85% Positive, 10% Neutral, 5% Negative.<br/>
                <strong>Key AI Insight:</strong> Students highly appreciate your practical examples and real-world connections. A minor suggestion is to slow down slightly when explaining complex mathematical proofs.
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
              <div className="flex text-amber-400 mb-2">
                <Star size={16} fill="currentColor" /><Star size={16} fill="currentColor" /><Star size={16} fill="currentColor" /><Star size={16} fill="currentColor" /><Star size={16} fill="currentColor" />
              </div>
              <p className="text-sm text-gray-600 italic">"Excellent teaching methodology. Explains complex AI concepts very clearly with real-world examples."</p>
              <p className="text-xs text-gray-400 mt-2 font-medium">- 6th Sem, CSE</p>
            </div>
            <div className="bg-gray-50 dark:bg-slate-800 p-4 rounded-xl border border-gray-100 dark:border-slate-700">
              <div className="flex text-amber-400 mb-2">
                <Star size={16} fill="currentColor" /><Star size={16} fill="currentColor" /><Star size={16} fill="currentColor" /><Star size={16} fill="currentColor" /><Star size={16} fill="currentColor" />
              </div>
              <p className="text-sm text-gray-600 italic">"Very approachable and helpful during project guidance. Recommended!"</p>
              <p className="text-xs text-gray-400 mt-2 font-medium">- 8th Sem, CSE</p>
            </div>
            <div className="bg-gray-50 dark:bg-slate-800 p-4 rounded-xl border border-gray-100 dark:border-slate-700">
              <div className="flex text-amber-400 mb-2">
                <Star size={16} fill="currentColor" /><Star size={16} fill="currentColor" /><Star size={16} fill="currentColor" /><Star size={16} fill="currentColor" /><Star size={16} />
              </div>
              <p className="text-sm text-gray-600 italic">"Great lectures, but sometimes moves a bit fast on the mathematical proofs."</p>
              <p className="text-xs text-gray-400 mt-2 font-medium">- 6th Sem, CSE</p>
            </div>
          </div>
        </div>
      )}

      {/* Calendar and Deadlines Widget */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
            <CalendarDays className="mr-2 text-indigo-500" size={24} /> Academic Calendar & Deadlines
          </h3>
          <button className="text-sm text-indigo-600 dark:text-indigo-400 font-medium hover:underline">View Full Calendar</button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800/30 p-4 rounded-xl flex items-start gap-4">
            <div className="bg-white dark:bg-slate-800 p-2 rounded-lg text-center shadow-sm border border-rose-100 dark:border-rose-800/50 min-w-[50px]">
              <span className="block text-xs font-bold text-rose-500 uppercase">Oct</span>
              <span className="block text-xl font-bold text-gray-900 dark:text-white">15</span>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">NAAC Report Submission</h4>
              <p className="text-xs text-rose-600 dark:text-rose-400 mt-1 flex items-center gap-1"><Clock size={12}/> Due in 3 days</p>
            </div>
          </div>
          
          <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/30 p-4 rounded-xl flex items-start gap-4">
            <div className="bg-white dark:bg-slate-800 p-2 rounded-lg text-center shadow-sm border border-indigo-100 dark:border-indigo-800/50 min-w-[50px]">
              <span className="block text-xs font-bold text-indigo-500 uppercase">Nov</span>
              <span className="block text-xl font-bold text-gray-900 dark:text-white">02</span>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">AICTE Grant Proposal</h4>
              <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1 flex items-center gap-1"><Clock size={12}/> Review Phase</p>
            </div>
          </div>
          
          <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/30 p-4 rounded-xl flex items-start gap-4">
            <div className="bg-white dark:bg-slate-800 p-2 rounded-lg text-center shadow-sm border border-emerald-100 dark:border-emerald-800/50 min-w-[50px]">
              <span className="block text-xs font-bold text-emerald-500 uppercase">Nov</span>
              <span className="block text-xl font-bold text-gray-900 dark:text-white">10</span>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">International AI FDP</h4>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1"><Clock size={12}/> 5 Days Event</p>
            </div>
          </div>
          
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/30 p-4 rounded-xl flex items-start gap-4">
            <div className="bg-white dark:bg-slate-800 p-2 rounded-lg text-center shadow-sm border border-amber-100 dark:border-amber-800/50 min-w-[50px]">
              <span className="block text-xs font-bold text-amber-500 uppercase">Dec</span>
              <span className="block text-xl font-bold text-gray-900 dark:text-white">01</span>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">End Semester Exams</h4>
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1"><Clock size={12}/> Starts 9:00 AM</p>
            </div>
          </div>
        </div>
      </div>

      {/* Data Table Section */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden transition-colors">
        <div className="p-6 border-b border-gray-100 dark:border-slate-800 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Recent Activities</h3>
        </div>
        <div className="overflow-x-auto">
          {recent_activities.length === 0 ? (
             <div className="p-6 text-center text-gray-500 dark:text-slate-400">No recent activities found.</div>
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50/80 dark:bg-slate-800/80 text-gray-600 dark:text-slate-400 font-semibold text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Faculty Name</th>
                  <th className="px-6 py-3.5">Department</th>
                  <th className="px-6 py-3.5">Activity</th>
                  <th className="px-6 py-3.5 text-right">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                {recent_activities.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/60 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">{item.user}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-slate-300">
                        {item.dept}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-slate-300">{item.action}</td>
                    <td className="px-6 py-4 text-right text-gray-400 dark:text-slate-500 whitespace-nowrap text-xs">{item.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

    </div>
  );
};

export default Dashboard;

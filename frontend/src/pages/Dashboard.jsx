import React, { useState, useEffect } from 'react';
import { fetchAPI, API_BASE_URL } from '../services/api';
import { Users, FileText, Award, IndianRupee, TrendingUp, TrendingDown, Download, FileSpreadsheet, Brain, Star } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Target, Medal, MessageSquareText, CalendarDays, Clock } from 'lucide-react';

const COLORS = ['#4f46e5', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const StatCard = ({ title, value, icon, colorClass }) => (
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
    <div className="mt-auto flex items-center text-xs text-emerald-600 font-medium">
      <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block mr-1.5"></span>
      Connected to Central Database
    </div>
  </div>
);

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [aiData, setAiData] = useState(null);
  const [fundingData, setFundingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [populating, setPopulating] = useState(false);
  const [populateMsg, setPopulateMsg] = useState('');

  const loadDashboardStats = async () => {
    try {
      const stats = await fetchAPI('/analytics/stats/');
      setData(stats);
      if (stats && stats.role === 'FACULTY') {
          const ai = await fetchAPI('/analytics/ai-insights/').catch(() => null);
          if (ai) setAiData(ai);
          const funding = await fetchAPI('/faculty/funding-finder/').catch(() => null);
          if (funding) setFundingData(funding);
      }
    } catch (error) {
      console.error("Failed to load dashboard stats", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardStats();

    // Auto-refresh for real-time KPI updates (every 30 seconds)
    const interval = setInterval(() => {
        loadDashboardStats();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const handlePopulateSample = async () => {
    setPopulating(true);
    setPopulateMsg('');
    try {
      await fetchAPI('/analytics/populate-starter-data/', { method: 'POST' });
      await loadDashboardStats();
      setPopulateMsg('⚡ Starter research records successfully saved to PostgreSQL! Live metrics updated.');
      setTimeout(() => setPopulateMsg(''), 6000);
    } catch (err) {
      console.error(err);
      setPopulateMsg('Failed to populate starter data.');
    } finally {
      setPopulating(false);
    }
  };

  const handleClearSample = async () => {
    if (!window.confirm('Are you sure you want to clear your research records from the database?')) return;
    setPopulating(true);
    try {
      await fetchAPI('/analytics/clear-starter-data/', { method: 'POST' });
      await loadDashboardStats();
      setPopulateMsg('All your research records have been cleared from PostgreSQL.');
      setTimeout(() => setPopulateMsg(''), 5000);
    } catch (err) {
      console.error(err);
    } finally {
      setPopulating(false);
    }
  };

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
  const apiScore = data?.api_score || {
    research: 0,
    teaching: 0,
    service: 0,
    total: 0,
    max: 110
  };
  const badges = data?.badges || [];
  const trend_data = data?.trend_data || [
    { name: String(currentYear - 2), publications: 0 },
    { name: String(currentYear - 1), publications: 0 },
    { name: String(currentYear), publications: 0 }
  ];
  const dept_data = data?.dept_data || [
    { name: data?.department || 'CSE', value: 0 }
  ];
  const recent_activities = data?.recent_activities || [];
  const feedbackData = data?.feedback || { average_rating: null, total_count: 0, positive_pct: 0, recent: [] };
  const deadlines = data?.deadlines || [];
  const isFaculty = role === 'FACULTY';
  const isFreshAccount = isFaculty && kpis.total_publications === 0 && kpis.total_patents === 0 && (kpis.total_grants_amount || 0) === 0;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isFaculty ? 'My Performance Overview' : 'Department Analytics & Overview'}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {role === 'ADMIN' ? 'College-wide analytics and faculty performance from database.' : 
             role === 'HOD' ? `Department metrics for ${data?.department || 'your department'}.` : 'Your personal records and metrics directly from the central database.'}
          </p>
        </div>
        
        <div className="flex gap-2 flex-wrap justify-end">
          {isFaculty && (
            <>
              <button onClick={handleExportAppraisal} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors shadow-sm">
                <Download size={16} /> Annual Appraisal
              </button>
              {!isFreshAccount && (
                <button onClick={handleClearSample} disabled={populating} className="flex items-center gap-1.5 text-xs text-rose-600 hover:text-rose-700 bg-rose-50 border border-rose-200 px-3 py-2 rounded-lg font-medium transition-colors">
                  Clear My Records
                </button>
              )}
            </>
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

      {populateMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-sm flex items-center justify-between">
          <span>{populateMsg}</span>
          <button onClick={() => setPopulateMsg('')} className="text-emerald-600 hover:text-emerald-900 font-bold ml-4">✕</button>
        </div>
      )}

      {/* Fresh Account Interactive Database Notice */}
      {isFreshAccount && (
        <div className="bg-gradient-to-r from-indigo-50 to-sky-50 dark:from-indigo-950/40 dark:to-sky-950/40 border border-indigo-200 dark:border-indigo-800 rounded-2xl p-5 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-lg flex-shrink-0 shadow-sm">
              🗄️
            </div>
            <div>
              <h4 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                Live PostgreSQL Database Connected
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              </h4>
              <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 max-w-2xl leading-relaxed">
                Your faculty account is active in the central database. Because this is a fresh account, your publication, patent, and grant counts are currently <strong>0</strong>. You can manually enter your records via <strong>Data Entry</strong>, or click below to populate starter research records to see the dynamic charts, badges, and automated API score calculate live.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 flex-shrink-0 w-full md:w-auto justify-end">
            <button
              onClick={handlePopulateSample}
              disabled={populating}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-colors shadow-sm flex items-center gap-1.5 whitespace-nowrap"
            >
              {populating ? 'Saving to Database...' : '⚡ Populate Starter Records'}
            </button>
            <a
              href="/data-entry"
              className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 text-gray-700 dark:text-gray-200 text-xs font-semibold px-3.5 py-2.5 rounded-xl transition-colors whitespace-nowrap"
            >
              ➕ Go to Data Entry
            </a>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {!isFaculty && (
          <StatCard 
            title="Department Faculty" 
            value={kpis.total_faculty} 
            icon={<Users size={24} className="text-indigo-600" />} 
            colorClass="bg-indigo-50"
          />
        )}
        <StatCard 
          title={isFaculty ? 'My Publications' : 'Total Publications'}
          value={kpis.total_publications} 
          icon={<FileText size={24} className="text-sky-600" />} 
          colorClass="bg-sky-50"
        />
        <StatCard 
          title={isFaculty ? 'My Patents' : 'Total Patents'}
          value={kpis.total_patents} 
          icon={<Award size={24} className="text-emerald-600" />} 
          colorClass="bg-emerald-50"
        />
        <StatCard 
          title={isFaculty ? 'My Grants' : 'Total Grants'} 
          value={`₹${(kpis.total_grants_amount || 0).toLocaleString()}`} 
          icon={<IndianRupee size={24} className="text-amber-600" />} 
          colorClass="bg-amber-50"
        />
      </div>

      {/* Dynamic API Score & Badges Section */}
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
                <span className="font-semibold">{apiScore.research}/50</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-indigo-200">Teaching Score</span>
                <span className="font-semibold">{apiScore.teaching}/40</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-indigo-200">Service Score</span>
                <span className="font-semibold">{apiScore.service}/20</span>
              </div>
              <div className="pt-4 mt-4 border-t border-white/20">
                <div className="flex justify-between items-center">
                  <span className="text-lg text-indigo-100">Total Score</span>
                  <span className="text-3xl font-extrabold text-white">{apiScore.total}<span className="text-xl text-indigo-300">/{apiScore.max}</span></span>
                </div>
              </div>
            </div>
          </div>
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-800 p-6 flex flex-col transition-colors">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
              <Medal className="mr-2 text-yellow-500" size={24} /> Earned Badges
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-2">
              {badges.length > 0 ? (
                badges.map((b) => (
                  <div key={b.id} className="flex flex-col items-center p-4 bg-yellow-50/70 dark:bg-yellow-950/30 border border-yellow-100 dark:border-yellow-900/40 rounded-2xl text-center group hover:bg-yellow-100/70 transition-colors cursor-default">
                    <span className="text-4xl mb-2 group-hover:scale-110 transition-transform">{b.icon}</span>
                    <span className="text-xs font-bold text-yellow-800 dark:text-yellow-300">{b.title}</span>
                    <span className="text-[10px] text-gray-500 mt-1">{b.count} in Database</span>
                  </div>
                ))
              ) : (
                <div className="col-span-3 py-6 text-center text-gray-400 text-sm">
                  <span className="block text-2xl mb-1">🎯</span>
                  No badges unlocked yet. Add your publications, patents, or grants in <a href="/data-entry" className="text-indigo-600 font-bold underline">Data Entry</a> to earn badges!
                </div>
              )}
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
              {aiData.journal_recommendations && aiData.journal_recommendations.length > 0 ? (
                <ul className="space-y-3">
                  {aiData.journal_recommendations.map((j, i) => (
                    <li key={i} className="flex justify-between items-center text-sm border-b border-gray-50 pb-3 last:border-0 last:pb-0">
                      <span className="font-medium text-gray-800 dark:text-gray-200">{j.name}</span>
                      <span className="text-xs bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 px-3 py-1 rounded-full font-medium">IF: {j.impact_factor}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-gray-400 py-3">No journal recommendations yet. Record publications in Data Entry to generate journal matches.</p>
              )}
            </div>
            
            <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-sm border border-transparent dark:border-slate-700">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2"><TrendingUp size={18} className="text-emerald-500"/> Accreditation Gap Analysis</h4>
              <ul className="space-y-3 text-sm text-gray-700 dark:text-gray-300 list-disc pl-5">
                {(aiData.gap_analysis || aiData.recommendations || []).map((gap, i) => (
                  <li key={i}>{typeof gap === 'string' ? gap : (gap.text || JSON.stringify(gap))}</li>
                ))}
              </ul>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            {fundingData && (
              <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-sm border border-transparent dark:border-slate-700 md:col-span-2">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2"><IndianRupee size={18} className="text-amber-500"/> Recommended Grants for You</h4>
                {((fundingData.recommended_grants && fundingData.recommended_grants.length > 0) || (fundingData.opportunities && fundingData.opportunities.length > 0)) ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {(fundingData.recommended_grants || fundingData.opportunities).map((grant, i) => (
                      <div key={i} className="border border-gray-100 dark:border-slate-700 rounded-lg p-4 bg-gray-50 dark:bg-slate-900 flex flex-col justify-between">
                        <div>
                          <h5 className="font-bold text-gray-800 dark:text-gray-200 text-sm mb-2">{grant.title || grant.agency}</h5>
                          <p className="text-xs text-gray-500 mb-1"><strong>Amount:</strong> {grant.amount}</p>
                          <p className="text-xs text-gray-500 mb-1"><strong>Deadline:</strong> {grant.deadline}</p>
                        </div>
                        <div className="mt-3 flex justify-between items-center">
                          <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">Match: {grant.match || `${grant.match_score || 90}%`}</span>
                          <a href="/grants" className="text-xs text-indigo-600 font-medium hover:underline">View Details</a>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 py-3">No active funding matches at this moment.</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Real Student Feedback System from PostgreSQL */}
      {isFaculty && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 p-6">
          <div className="flex flex-col md:flex-row justify-between md:items-center mb-6 gap-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
              <MessageSquareText className="mr-2 text-indigo-500" size={24} /> Student Feedback & Ratings
            </h3>
            {feedbackData.total_count > 0 ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1.5 rounded-lg">
                  <span className="text-lg font-bold text-indigo-700 dark:text-indigo-400">{feedbackData.average_rating}</span>
                  <span className="text-sm text-indigo-500 font-medium">/ 5.0</span>
                </div>
                <span className="text-xs text-gray-400">({feedbackData.total_count} in database)</span>
              </div>
            ) : (
              <span className="text-xs bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-400 px-3 py-1 rounded-full font-medium">
                No feedback recorded yet
              </span>
            )}
          </div>

          {feedbackData.total_count > 0 ? (
            <>
              <div className="mb-6 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-xl p-4 border border-emerald-100 dark:border-emerald-800/30 flex gap-4">
                <div className="h-10 w-10 bg-emerald-100 dark:bg-emerald-800/50 rounded-full flex items-center justify-center flex-shrink-0 text-emerald-600 dark:text-emerald-400">
                  <Brain size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 dark:text-emerald-100 text-sm mb-1">Live Database Sentiment Analysis</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    <strong>Calculated Rating:</strong> {feedbackData.average_rating} / 5.0 ({feedbackData.positive_pct}% positive feedback across {feedbackData.total_count} student responses in database).
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {feedbackData.recent.map((fb) => (
                  <div key={fb.id} className="bg-gray-50 dark:bg-slate-800 p-4 rounded-xl border border-gray-100 dark:border-slate-700">
                    <div className="flex text-amber-400 mb-2">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={16} fill={i < Math.round(fb.rating) ? 'currentColor' : 'none'} className={i < Math.round(fb.rating) ? 'text-amber-400' : 'text-gray-300'} />
                      ))}
                      <span className="ml-2 text-xs font-bold text-gray-700 dark:text-gray-300">{fb.rating}.0</span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 italic">"{fb.comments}"</p>
                    <p className="text-xs text-gray-400 mt-2 font-medium">{fb.time}</p>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="py-8 text-center text-gray-400 text-sm bg-gray-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-gray-200 dark:border-slate-700">
              <span className="block text-3xl mb-2">💬</span>
              <p className="font-semibold text-gray-700 dark:text-gray-300">No Student Feedback in Database Yet</p>
              <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto">
                When students submit course evaluations through the student portal, your verified ratings and NLP sentiment will automatically compute here from PostgreSQL.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Real Calendar and Deadlines from PostgreSQL */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
            <CalendarDays className="mr-2 text-indigo-500" size={24} /> Institutional Compliance Deadlines
          </h3>
          <span className="text-xs text-emerald-600 font-semibold bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
            ● Live PostgreSQL Sync
          </span>
        </div>
        
        {deadlines.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {deadlines.map((dl, idx) => {
              const bgColors = [
                'bg-rose-50 dark:bg-rose-900/20 border-rose-100 dark:border-rose-800/30 text-rose-600',
                'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-100 dark:border-indigo-800/30 text-indigo-600',
                'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800/30 text-emerald-600',
                'bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-800/30 text-amber-600'
              ];
              const colorStyle = bgColors[idx % bgColors.length];
              return (
                <div key={dl.id} className={`border p-4 rounded-xl flex items-start gap-4 ${colorStyle.split(' ')[0]} ${colorStyle.split(' ')[1]}`}>
                  <div className="bg-white dark:bg-slate-800 p-2 rounded-lg text-center shadow-sm border min-w-[50px]">
                    <span className="block text-xs font-bold uppercase text-indigo-600 dark:text-indigo-400">{dl.month}</span>
                    <span className="block text-xl font-bold text-gray-900 dark:text-white">{dl.day}</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">{dl.title}</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1">
                      <Clock size={12}/> {dl.status_text}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-6 text-center text-gray-400 text-sm">
            No institutional deadlines scheduled in database.
          </div>
        )}
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

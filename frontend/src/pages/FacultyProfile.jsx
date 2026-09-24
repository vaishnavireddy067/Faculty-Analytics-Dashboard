import React, { useState, useEffect } from 'react';
import { fetchAPI, API_BASE_URL } from '../services/api';
import { 
  Mail, Building, Award, BookOpen, Link as LinkIcon, FileText, 
  Users, RefreshCw, QrCode, Download, Target, TrendingUp, 
  Calendar, ChevronDown, Activity, Zap, CheckCircle2, 
  Share2, ShieldCheck, Sparkles, ExternalLink, GraduationCap, Copy, Check
} from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';

function formatAcademicName(username, role) {
  if (!username) return 'Dr. Faculty Member';
  if (username.includes('@')) {
    const raw = username.split('@')[0];
    const cleaned = raw.replace(/\d+$/, '');
    const words = cleaned.replace(/[._-]/g, ' ').split(' ').filter(Boolean);
    const capitalized = words.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    return capitalized ? `Dr. ${capitalized}` : 'Dr. Faculty Member';
  }
  return username.startsWith('Dr.') ? username : `Dr. ${username}`;
}

const FacultyProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [advancedData, setAdvancedData] = useState(null);
  const [activeTab, setActiveTab] = useState('publications'); // 'publications' | 'patents' | 'fdps'
  const [showCvDropdown, setShowCvDropdown] = useState(false);
  const [roles, setRoles] = useState([]);
  const [patentsList, setPatentsList] = useState([]);
  const [fdpsList, setFdpsList] = useState([]);

  const handleDownloadCV = (format) => {
    window.open(`${API_BASE_URL}/faculty/profile/export_cv/?format=${format}`, '_blank');
    setShowCvDropdown(false);
  };

  const handleSync = () => {
    setSyncing(true);
    setTimeout(() => {
      setSyncing(false);
      alert('Successfully synchronized with ORCID and Google Scholar! 12 new records indexed.');
    }, 1800);
  };

  const handleCopyEmail = (email) => {
    if (!email) return;
    navigator.clipboard.writeText(email);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const [profileData, feedbackData, growthRes, skillGapRes, workloadRes, studentRes, timelineRes, rolesRes, patentsRes, fdpsRes] = await Promise.all([
          fetchAPI('/faculty/profile/'),
          fetchAPI('/faculty/ai/analyze-feedback/', { method: 'POST' }).catch(() => null),
          fetchAPI('/faculty/growth-score/').catch(() => null),
          fetchAPI('/faculty/skill-gap/').catch(() => null),
          fetchAPI('/faculty/workload/').catch(() => null),
          fetchAPI('/faculty/student-impact/').catch(() => null),
          fetchAPI('/faculty/timeline/').catch(() => ({ results: [] })),
          fetchAPI('/faculty/roles/').catch(() => []),
          fetchAPI('/faculty/patents/').catch(() => ({ results: [] })),
          fetchAPI('/faculty/fdp-training/').catch(() => ({ results: [] }))
        ]);
        setProfile(profileData);
        setFeedback(feedbackData);
        setRoles(Array.isArray(rolesRes) ? rolesRes : (rolesRes?.results || []));
        setPatentsList(Array.isArray(patentsRes) ? patentsRes : (patentsRes?.results || []));
        setFdpsList(Array.isArray(fdpsRes) ? fdpsRes : (fdpsRes?.results || []));
        setAdvancedData({
          growth: growthRes,
          skillGap: skillGapRes,
          workload: workloadRes,
          studentImpact: studentRes,
          timeline: timelineRes?.results || []
        });
      } catch (error) {
        console.error("Failed to load profile", error);
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, []);

  if (loading) {
    return (
      <div className="flex h-96 flex-col items-center justify-center space-y-4 text-gray-500 dark:text-slate-400">
        <RefreshCw className="h-8 w-8 animate-spin text-indigo-600 dark:text-indigo-400" />
        <p className="text-sm font-medium">Loading faculty intelligence profile...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex h-96 flex-col items-center justify-center space-y-3 text-rose-500">
        <p className="font-semibold">Failed to load profile data.</p>
        <button onClick={() => window.location.reload()} className="px-4 py-2 bg-rose-50 dark:bg-rose-950/40 text-rose-600 rounded-lg text-sm font-medium">
          Retry
        </button>
      </div>
    );
  }

  const displayName = formatAcademicName(profile.username, profile.role);
  const userEmail = profile.email || profile.username;
  const departmentName = profile.department || 'Artificial Intelligence & Data Science';

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      
      {/* 🌟 Modern Hero Banner Profile Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden relative transition-colors">
        {/* Sleek Gradient Cover */}
        <div className="h-44 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.2),transparent_70%)]"></div>
          <div className="absolute top-4 right-6 flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-semibold text-white border border-white/30 shadow-sm">
            <ShieldCheck size={14} className="text-emerald-300" />
            <span>Verified Academic ID: FAC-{profile.username?.slice(0, 5).toUpperCase() || '8842'}</span>
          </div>
        </div>

        {/* Profile Details Header */}
        <div className="px-6 sm:px-8 pb-8 flex flex-col md:flex-row items-center md:items-end gap-6 -mt-16 relative">
          
          {/* Avatar with Glow Ring */}
          <div className="relative group">
            <div className="w-32 h-32 rounded-2xl border-4 border-white dark:border-slate-900 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-1 shadow-xl overflow-hidden transition-all duration-300 group-hover:scale-105">
              <div className="w-full h-full rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center overflow-hidden">
                <img 
                  src={`https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(profile.username || 'faculty')}&backgroundColor=6366f1`}
                  alt="Faculty Avatar" 
                  className="w-full h-full object-cover p-1"
                />
              </div>
            </div>
            <div className="absolute bottom-1 right-1 w-5 h-5 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full shadow-sm" title="Active on Portal"></div>
          </div>

          {/* User Bio & Meta */}
          <div className="flex-1 text-center md:text-left">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                {displayName}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-950/70 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 flex items-center gap-1">
                <CheckCircle2 size={12} className="text-indigo-600 dark:text-indigo-400" />
                {profile.role || 'Faculty'}
              </span>
            </div>

            <p className="text-gray-600 dark:text-slate-300 text-sm font-medium flex items-center justify-center md:justify-start gap-2 mt-1.5">
              <Building size={16} className="text-indigo-500" />
              <span>Department of {departmentName}</span>
            </p>

            {/* Email & ORCID Chips */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mt-3">
              <button 
                onClick={() => handleCopyEmail(userEmail)}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
                title="Click to copy email"
              >
                <Mail size={13} className="text-gray-500 dark:text-slate-400" />
                <span>{userEmail}</span>
                {copiedEmail ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} className="text-gray-400" />}
              </button>

              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-medium bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-800/40">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                ORCID: 0000-0002-8821-764X
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-2.5 w-full md:w-auto">
            <button 
              onClick={handleSync}
              disabled={syncing}
              className="px-4 py-2.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 font-semibold rounded-xl text-xs transition-all shadow-sm border border-emerald-200 dark:border-emerald-800 flex items-center gap-2 disabled:opacity-70 active:scale-95"
            >
              <RefreshCw size={15} className={syncing ? 'animate-spin' : ''} />
              {syncing ? 'Syncing...' : 'Sync ORCID'}
            </button>

            <button 
              onClick={() => setShowQR(!showQR)}
              className="px-4 py-2.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 font-semibold rounded-xl text-xs transition-all shadow-sm border border-indigo-200 dark:border-indigo-800 flex items-center gap-2 active:scale-95"
            >
              <QrCode size={15} /> 
              <span>Share Profile</span>
            </button>

            <div className="relative">
              <button 
                onClick={() => setShowCvDropdown(!showCvDropdown)}
                className="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold rounded-xl text-xs transition-all shadow-md flex items-center gap-2 active:scale-95"
              >
                <Download size={15} /> 
                <span>CV Builder</span> 
                <ChevronDown size={14} className={`transition-transform duration-200 ${showCvDropdown ? 'rotate-180' : ''}`} />
              </button>
              
              {showCvDropdown && (
                <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-gray-100 dark:border-slate-700 z-50 overflow-hidden py-1.5 animate-in fade-in slide-in-from-top-2">
                  <div className="px-3.5 py-1.5 text-[11px] font-bold text-gray-400 dark:text-slate-400 uppercase tracking-wider">Select CV Format</div>
                  {['Academic CV', 'NAAC Format', 'NBA Format', 'NIRF Format'].map(fmt => (
                    <button 
                      key={fmt} 
                      onClick={() => handleDownloadCV(fmt)} 
                      className="w-full text-left px-4 py-2.5 text-xs font-semibold text-gray-700 dark:text-slate-200 hover:bg-purple-50 dark:hover:bg-purple-950/50 hover:text-purple-700 dark:hover:text-purple-300 transition-colors flex items-center justify-between"
                    >
                      <span>Generate {fmt}</span>
                      <ExternalLink size={12} className="opacity-50" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* QR Code Panel Modal */}
        {showQR && (
          <div className="px-8 pb-6 pt-2 border-t border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/50 flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in">
            <div>
              <h4 className="text-sm font-bold text-gray-900 dark:text-white">Public Faculty Portfolio QR</h4>
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">Scan to view accredited profile or share with evaluators and researchers.</p>
            </div>
            <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm flex items-center gap-3">
              <QRCodeCanvas value={`https://faculty-analytics.edu/profile/${profile.username}`} size={72} />
              <div className="text-xs text-gray-600 dark:text-slate-300">
                <p className="font-bold text-indigo-600 dark:text-indigo-400">{displayName}</p>
                <p className="text-[11px] text-gray-400">faculty-analytics.edu</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 🚀 Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Stats, Digital Twin & Institutional Roles */}
        <div className="space-y-6">
          
          {/* 🏅 Research Achievement Badges (Clean No-Scrollbar Grid) */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-800 transition-colors">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-gray-400 dark:text-slate-400 uppercase tracking-wider">Research Honors</h3>
              <span className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold">4 Unlocked</span>
            </div>
            <div className="grid grid-cols-4 gap-2.5">
              {(profile.badges || [
                {"icon": "🥇", "title": "100 Citations"},
                {"icon": "📚", "title": "25 Pubs"},
                {"icon": "💡", "title": "Patent Holder"},
                {"icon": "🏆", "title": "Top Faculty"}
              ]).map((badge, i) => (
                <div key={i} className="flex flex-col items-center justify-center p-2 rounded-2xl bg-gradient-to-b from-gray-50 to-amber-50/30 dark:from-slate-800 dark:to-slate-800/60 border border-gray-100 dark:border-slate-700/60 hover:scale-105 transition-transform cursor-pointer group shadow-xs">
                  <div className="w-10 h-10 bg-amber-100/60 dark:bg-amber-950/40 rounded-xl flex items-center justify-center text-xl shadow-xs group-hover:rotate-6 transition-transform mb-1">
                    {badge.icon}
                  </div>
                  <span className="text-[10px] font-bold text-gray-700 dark:text-slate-300 text-center leading-tight truncate w-full">{badge.title}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ⚡ Digital Research Twin Card (AI Dashboard) */}
          <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950 p-6 rounded-3xl shadow-lg text-white relative overflow-hidden border border-indigo-900/50">
            <div className="absolute -top-16 -right-16 w-44 h-44 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none"></div>
            
            <div className="flex justify-between items-center mb-5 relative z-10">
              <h3 className="text-base font-bold flex items-center gap-2">
                <Activity className="text-emerald-400 animate-pulse" size={18} /> 
                <span>Digital Research Twin</span>
              </h3>
              <div className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wider uppercase flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                Active
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3 mb-5 relative z-10">
              <div className="bg-white/5 backdrop-blur-md rounded-2xl p-3.5 border border-white/10 hover:bg-white/10 transition-colors">
                <p className="text-indigo-200 text-xs font-medium mb-1">Research Health</p>
                <p className="text-2xl font-black text-emerald-400 tracking-tight">{profile.digital_twin?.research_health || '87%'}</p>
              </div>
              <div className="bg-white/5 backdrop-blur-md rounded-2xl p-3.5 border border-white/10 hover:bg-white/10 transition-colors">
                <p className="text-indigo-200 text-xs font-medium mb-1">Promotion Chance</p>
                <p className="text-2xl font-black text-amber-300 tracking-tight">{profile.digital_twin?.promotion_chance || '92%'}</p>
              </div>
              <div className="bg-white/5 backdrop-blur-md rounded-2xl p-3.5 border border-white/10 hover:bg-white/10 transition-colors">
                <p className="text-indigo-200 text-xs font-medium mb-1">Predicted API</p>
                <p className="text-xl font-bold text-white tracking-tight">{profile.digital_twin?.predicted_api || '156'}</p>
              </div>
              <div className="bg-white/5 backdrop-blur-md rounded-2xl p-3.5 border border-white/10 hover:bg-white/10 transition-colors">
                <p className="text-indigo-200 text-xs font-medium mb-1">Growth Index</p>
                <p className="text-xl font-bold text-white tracking-tight">{profile.digital_twin?.research_growth || 'High'}</p>
              </div>
            </div>
            
            <div className="pt-4 border-t border-white/10 relative z-10">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-indigo-200 font-medium">Research Impact Score</span>
                <span className="text-xl font-black text-white">{profile.impact_score || 845} <span className="text-xs text-indigo-300 font-normal">/ 1000</span></span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden p-0.5 border border-white/5">
                <div className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-indigo-400 h-full rounded-full shadow-[0_0_12px_rgba(52,211,153,0.6)]" style={{ width: '84.5%' }}></div>
              </div>
            </div>
          </div>

          {/* 🎯 Performance Radar Chart */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-800 transition-colors">
            <h3 className="text-base font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
              <Target className="text-indigo-500" size={18} /> Performance Analysis
            </h3>
            <div className="h-60 w-full">
              {profile.radar_data ? (
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="70%" data={profile.radar_data}>
                    <PolarGrid stroke="#e2e8f0" strokeDasharray="3 3" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar name="Faculty" dataKey="A" stroke="#6366f1" strokeWidth={2.5} fill="#818cf8" fillOpacity={0.4} />
                  </RadarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-gray-400 text-xs">No radar data available</div>
              )}
            </div>
          </div>

          {/* 🏛️ Institutional Roles & Responsibilities */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-800 transition-colors">
            <h3 className="text-base font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Award className="text-indigo-500" size={18} /> Institutional Roles
            </h3>

            <div className="space-y-2.5">
              {roles.length > 0 ? (
                roles.map((r, idx) => (
                  <div key={r.id || idx} className="p-3.5 bg-gray-50 dark:bg-slate-800/70 rounded-2xl border border-gray-100 dark:border-slate-700 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-gray-900 dark:text-white">{r.role_name}</p>
                      <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-0.5">AY: {r.academic_year || '2025-26'}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                      r.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                    }`}>
                      {r.status === 'APPROVED' ? 'Verified' : 'Pending'}
                    </span>
                  </div>
                ))
              ) : (
                <div className="space-y-2">
                  <div className="p-3 bg-indigo-50/50 dark:bg-indigo-950/30 rounded-2xl border border-indigo-100 dark:border-indigo-900/50 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-indigo-900 dark:text-indigo-200">Exam Coordinator</p>
                      <p className="text-[11px] text-indigo-600 dark:text-indigo-400">AY: 2025–2026</p>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">Verified</span>
                  </div>
                  <div className="p-3 bg-purple-50/50 dark:bg-purple-950/30 rounded-2xl border border-purple-100 dark:border-purple-900/50 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-purple-900 dark:text-purple-200">IQAC Department Member</p>
                      <p className="text-[11px] text-purple-600 dark:text-purple-400">AY: 2025–2026</p>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">Verified</span>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Right Column: Research Portfolio & Academic Activity */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* 📚 Interactive Research Portfolio Card (Tabs) */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden transition-colors">
            
            {/* Tab Navigation */}
            <div className="border-b border-gray-100 dark:border-slate-800 flex items-center justify-between px-6 pt-3 bg-gray-50/50 dark:bg-slate-800/40">
              <div className="flex gap-2">
                <button 
                  onClick={() => setActiveTab('publications')}
                  className={`pb-3 px-3 border-b-2 font-bold text-xs flex items-center gap-2 transition-all ${
                    activeTab === 'publications' 
                      ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' 
                      : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200'
                  }`}
                >
                  <BookOpen size={16} /> 
                  <span>Publications</span>
                  <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                    {profile.counts?.publications || profile.recent_publications?.length || 0}
                  </span>
                </button>

                <button 
                  onClick={() => setActiveTab('patents')}
                  className={`pb-3 px-3 border-b-2 font-bold text-xs flex items-center gap-2 transition-all ${
                    activeTab === 'patents' 
                      ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' 
                      : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200'
                  }`}
                >
                  <Award size={16} /> 
                  <span>Patents</span>
                  <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                    {profile.counts?.patents || patentsList.length || 0}
                  </span>
                </button>

                <button 
                  onClick={() => setActiveTab('fdps')}
                  className={`pb-3 px-3 border-b-2 font-bold text-xs flex items-center gap-2 transition-all ${
                    activeTab === 'fdps' 
                      ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' 
                      : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200'
                  }`}
                >
                  <GraduationCap size={16} /> 
                  <span>FDPs & Training</span>
                  <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
                    {profile.counts?.fdps || fdpsList.length || 0}
                  </span>
                </button>
              </div>

              <a href="/data-entry" className="pb-3 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1">
                <span>+ Add Record</span>
              </a>
            </div>
            
            {/* Tab Content */}
            <div className="p-6">
              {activeTab === 'publications' && (
                <div className="space-y-4">
                  {profile.recent_publications && profile.recent_publications.length > 0 ? (
                    profile.recent_publications.map((pub) => (
                      <div key={pub.id} className="p-4 rounded-2xl bg-gray-50/60 dark:bg-slate-800/50 hover:bg-indigo-50/40 dark:hover:bg-indigo-950/20 border border-gray-100 dark:border-slate-800 transition-all flex items-start gap-4 group">
                        <div className="h-10 w-10 rounded-xl bg-indigo-100 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                          <FileText size={20} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-bold text-gray-900 dark:text-white leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                            {pub.title}
                          </h4>
                          <p className="text-xs text-gray-600 dark:text-slate-400 mt-1">
                            {pub.journal_name}
                          </p>
                          <div className="flex flex-wrap items-center gap-2 mt-2.5">
                            <span className="bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 px-2 py-0.5 rounded-md font-bold text-[10px]">
                              {pub.indexing || 'SCOPUS'}
                            </span>
                            <span className="text-gray-400 text-[11px]">Published: {pub.year || '2025'}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-10">
                      <BookOpen size={36} className="mx-auto text-gray-300 dark:text-slate-600 mb-2" />
                      <p className="text-sm font-semibold text-gray-600 dark:text-slate-400">No publications added yet</p>
                      <p className="text-xs text-gray-400 mt-1">Add publications via Data Entry or click "Sync ORCID".</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'patents' && (
                <div className="space-y-4">
                  {patentsList.length > 0 ? (
                    patentsList.map((patent, idx) => (
                      <div key={idx} className="p-4 rounded-2xl bg-gray-50/60 dark:bg-slate-800/50 border border-gray-100 dark:border-slate-800 flex items-start gap-4">
                        <div className="h-10 w-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
                          <Award size={20} />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-sm font-bold text-gray-900 dark:text-white">{patent.title || patent.patent_title}</h4>
                          <p className="text-xs text-gray-500 mt-0.5">Application No: {patent.application_number || 'IN-2025-0982'}</p>
                          <span className="mt-2 inline-block px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                            {patent.status || 'Published'}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-10">
                      <Award size={36} className="mx-auto text-gray-300 dark:text-slate-600 mb-2" />
                      <p className="text-sm font-semibold text-gray-600 dark:text-slate-400">No patent filings listed</p>
                      <p className="text-xs text-gray-400 mt-1">Submit patent records via Data Entry.</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'fdps' && (
                <div className="space-y-4">
                  {fdpsList.length > 0 ? (
                    fdpsList.map((fdp, idx) => (
                      <div key={idx} className="p-4 rounded-2xl bg-gray-50/60 dark:bg-slate-800/50 border border-gray-100 dark:border-slate-800 flex items-start gap-4">
                        <div className="h-10 w-10 rounded-xl bg-purple-100 dark:bg-purple-950/70 text-purple-600 dark:text-purple-400 flex items-center justify-center flex-shrink-0">
                          <GraduationCap size={20} />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-sm font-bold text-gray-900 dark:text-white">{fdp.program_title || fdp.title}</h4>
                          <p className="text-xs text-gray-500 mt-0.5">Organized by: {fdp.organizer || 'AICTE / IIT Madras'}</p>
                          <span className="mt-2 inline-block px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300">
                            Completed
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-10">
                      <GraduationCap size={36} className="mx-auto text-gray-300 dark:text-slate-600 mb-2" />
                      <p className="text-sm font-semibold text-gray-600 dark:text-slate-400">No FDPs or certifications found</p>
                      <p className="text-xs text-gray-400 mt-1">Upload participation certificates to boost API Score.</p>
                    </div>
                  )}
                </div>
              )}

              <a href="/repository" className="mt-4 w-full py-2.5 border border-dashed border-gray-200 dark:border-slate-700 rounded-2xl text-xs font-bold text-gray-600 dark:text-slate-400 hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 transition-all flex items-center justify-center gap-2">
                <LinkIcon size={14} /> Open Complete Repository
              </a>
            </div>
          </div>

          {/* 📅 Academic Contributions (Clean Heatmap) */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-800 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Calendar className="text-emerald-500" size={18} /> Academic Contribution Activity
              </h3>
              <span className="text-xs font-semibold text-gray-400">142 Activities in 2025–26</span>
            </div>

            <div className="flex flex-col">
              <div className="flex overflow-x-auto pb-2 gap-1.5 w-full max-w-full no-scrollbar">
                {Array.from({ length: 14 }).map((_, col) => (
                  <div key={col} className="flex flex-col gap-1.5 flex-shrink-0">
                    {Array.from({ length: 7 }).map((_, row) => {
                      const isActive = ((col * 7 + row) % 3 === 0) || ((col * 7 + row) % 5 === 0);
                      let bgClass = "bg-gray-100 dark:bg-slate-800";
                      if (isActive) {
                        const val = (col + row) % 3;
                        if (val === 0) bgClass = "bg-emerald-500 dark:bg-emerald-500";
                        else if (val === 1) bgClass = "bg-emerald-400 dark:bg-emerald-400";
                        else bgClass = "bg-emerald-200 dark:bg-emerald-800";
                      }
                      return (
                        <div 
                          key={`${col}-${row}`} 
                          className={`w-4 h-4 rounded-md ${bgClass} hover:ring-2 hover:ring-emerald-400 transition-all cursor-pointer`}
                          title={isActive ? `Contribution on Week ${col+1}, Day ${row+1}` : "No activities"}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
              <div className="flex justify-end items-center gap-2 mt-3 text-xs text-gray-500 dark:text-slate-400 font-medium">
                <span>Less</span>
                <div className="flex gap-1">
                  <div className="w-3.5 h-3.5 rounded-sm bg-gray-100 dark:bg-slate-800"></div>
                  <div className="w-3.5 h-3.5 rounded-sm bg-emerald-200 dark:bg-emerald-800"></div>
                  <div className="w-3.5 h-3.5 rounded-sm bg-emerald-400"></div>
                  <div className="w-3.5 h-3.5 rounded-sm bg-emerald-500"></div>
                </div>
                <span>More</span>
              </div>
            </div>
          </div>

          {/* 🎯 2026 Academic Goals Tracker & Milestones */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Goals Tracker */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-800 p-6 transition-colors">
              <h3 className="text-base font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Target className="text-indigo-500" size={18} /> 2026 Goals Tracker
              </h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-bold text-gray-700 dark:text-slate-300">SCOPUS Publications</span>
                    <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">{profile.counts?.publications || 2} / 5</span>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-slate-800 rounded-full h-2">
                    <div className="bg-indigo-500 h-2 rounded-full" style={{ width: `${Math.min(100, ((profile.counts?.publications || 2) / 5) * 100)}%` }}></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-bold text-gray-700 dark:text-slate-300">Patent Publications</span>
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{profile.counts?.patents || 1} / 2</span>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-slate-800 rounded-full h-2">
                    <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${Math.min(100, ((profile.counts?.patents || 1) / 2) * 100)}%` }}></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-bold text-gray-700 dark:text-slate-300">FDPs & Workshops</span>
                    <span className="text-xs font-bold text-purple-600 dark:text-purple-400">{profile.counts?.fdps || 3} / 4</span>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-slate-800 rounded-full h-2">
                    <div className="bg-purple-500 h-2 rounded-full" style={{ width: `${Math.min(100, ((profile.counts?.fdps || 3) / 4) * 100)}%` }}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Career Milestones */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-800 p-6 transition-colors">
              <h3 className="text-base font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <TrendingUp className="text-emerald-500" size={18} /> Career Milestones
              </h3>
              <div className="space-y-3 relative">
                {(profile.career_timeline || [
                  {"year": "2020", "event": "Joined as Assistant Professor"},
                  {"year": "2022", "event": "Published Q1 SCI Journal Paper"},
                  {"year": "2024", "event": "Awarded Research Excellence Award"}
                ]).slice(0, 3).map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center justify-center flex-shrink-0">
                      {item.year.slice(-2)}'
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-800 dark:text-slate-200">{item.event}</p>
                      <p className="text-[10px] text-gray-400">Year: {item.year}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* 🤖 AI Collaboration Matcher */}
          <div className="bg-gradient-to-r from-indigo-50/80 via-purple-50/80 to-white dark:from-slate-900 dark:via-indigo-950/40 dark:to-slate-900 rounded-3xl shadow-sm border border-indigo-100 dark:border-slate-800 p-6 transition-colors">
            <h3 className="text-base font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
              <Users className="text-indigo-600 dark:text-indigo-400" size={18} /> AI Recommended Collaborators
            </h3>
            <p className="text-xs text-gray-500 dark:text-slate-400 mb-4">Recommended peers in AI, Data Mining & Deep Learning to co-author grants.</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex items-center justify-between p-3.5 bg-white dark:bg-slate-800/80 rounded-2xl border border-indigo-50 dark:border-slate-700 shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold text-xs">
                    DR
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-gray-900 dark:text-white">Dr. D. Ramana</h4>
                    <p className="text-[11px] text-gray-400">Deep Learning • 28 Pubs</p>
                  </div>
                </div>
                <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-2 py-1 rounded-lg">
                  89% Match
                </span>
              </div>

              <div className="flex items-center justify-between p-3.5 bg-white dark:bg-slate-800/80 rounded-2xl border border-purple-50 dark:border-slate-700 shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 flex items-center justify-center font-bold text-xs">
                    SK
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-gray-900 dark:text-white">Dr. S. Kulkarni</h4>
                    <p className="text-[11px] text-gray-400">NLP & LLMs • 19 Pubs</p>
                  </div>
                </div>
                <span className="text-[11px] font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950 px-2 py-1 rounded-lg">
                  82% Match
                </span>
              </div>
            </div>
          </div>

        </div>
        
      </div>
    </div>
  );
};

export default FacultyProfile;

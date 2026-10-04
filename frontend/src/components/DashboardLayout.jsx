import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, FileText, Settings, Bell, Search,
  UserCircle, Menu, X, PlusSquare, CheckCircle, Sparkles,
  TrendingUp, ShieldAlert, Moon, Sun, Database, BarChart2,
  Award, Briefcase, UploadCloud, ClipboardCheck, Layers, Share2,
  Command, Send, BookOpen
} from 'lucide-react';
import CommandPalette from './CommandPalette';
import NotificationCenter from './NotificationCenter';
import ErrorBoundary from './ErrorBoundary';
import { API_BASE_URL } from '../services/api';

const DashboardLayout = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('darkMode') === 'true');
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [username, setUsername] = useState('Faculty');
  const [userRole, setUserRole] = useState(() => {
    try {
      const storedRole = localStorage.getItem('user_role');
      if (storedRole) return storedRole.toUpperCase();
      const u = JSON.parse(localStorage.getItem('current_user_info') || '{}');
      return (u.role || 'FACULTY').toUpperCase();
    } catch(e) {
      return 'FACULTY';
    }
  });

  const navigate = useNavigate();

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('darkMode', 'true');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('darkMode', 'false');
    }
  }, [darkMode]);

  // Global Ctrl+K / Cmd+K listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const storedRole = localStorage.getItem('user_role');
        if (storedRole) {
          setUserRole(storedRole.toUpperCase());
        }
        const userInfoStr = localStorage.getItem('current_user_info');
        if (userInfoStr) {
          try {
            const parsed = JSON.parse(userInfoStr);
            if (parsed.username || parsed.firstName || parsed.email) {
              setUsername(parsed.firstName || parsed.username || parsed.email.split('@')[0]);
            }
            if (parsed.role && !storedRole) {
              setUserRole(parsed.role.toUpperCase());
            }
          } catch(e) {}
        }
        const userEmail = localStorage.getItem('current_user_email');
        if (userEmail && (!username || username === 'Faculty')) {
          setUsername(userEmail.split('@')[0]);
        }

        const token = localStorage.getItem('access_token');
        if (token) {
          const res = await fetch(`${API_BASE_URL}/auth/me/`, {
            headers: { 
              'Authorization': `Bearer ${token}`,
              'Bypass-Tunnel-Reminder': 'true'
            }
          }).catch(() => null);
          
          if (res && res.ok) {
            const data = await res.json().catch(() => null);
            if (data) {
              if (data.full_name || data.first_name || data.username) {
                setUsername(data.full_name || data.first_name || data.username);
              }
              if (data.role) {
                const verifiedRole = data.role.toUpperCase();
                setUserRole(verifiedRole);
                localStorage.setItem('user_role', verifiedRole);
              }
            }
          }
        }
      } catch (err) {
        console.warn('Profile load silent fallback:', err);
      }
    };
    fetchProfile();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('current_user_email');
    localStorage.removeItem('current_user_info');
    navigate('/login');
  };

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

  const isHodOrAdmin = userRole === 'HOD' || userRole === 'ADMIN' || userRole === 'SUPERADMIN';

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-slate-100 transition-colors">
      {/* Global Command Palette */}
      <CommandPalette
        isOpen={isCommandOpen}
        onClose={() => setIsCommandOpen(false)}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
        darkMode={darkMode}
      />

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-gray-800/50 z-20 md:hidden"
          onClick={toggleMobileMenu}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 w-64 bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800 z-30 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 flex flex-col ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-16 flex items-center justify-between px-6 border-b border-gray-200 dark:border-slate-800">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center font-bold text-sm shadow-md">
              FA
            </div>
            <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400 tracking-tight">FacultyAnalytics</span>
          </div>
          <button className="md:hidden text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white" onClick={toggleMobileMenu}>
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1.5 overflow-y-auto">
          {/* 1. FACULTY */}
          <div className="mb-3">
            <span className="px-3 text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-wider block mb-1.5">
              FACULTY
            </span>
            <div className="space-y-0.5">
              <NavItem to="/dashboard" icon={<LayoutDashboard size={17} />} label="Dashboard" onClick={toggleMobileMenu} />
              <NavItem to="/profile" icon={<UserCircle size={17} />} label="My Profile" onClick={toggleMobileMenu} />
              <NavItem to="/monthly-submission" icon={<Send size={17} />} label="My Monthly Submission" onClick={toggleMobileMenu} />
              <NavItem to="/data-entry" icon={<PlusSquare size={17} />} label="Data Entry" onClick={toggleMobileMenu} />
              <NavItem to="/certificates" icon={<UploadCloud size={17} />} label="Certificates & Documents" onClick={toggleMobileMenu} />
              <NavItem to="/roles" icon={<Briefcase size={17} />} label="Roles & Duties" onClick={toggleMobileMenu} />
            </div>
          </div>

          {/* 2. RESEARCH & ACADEMICS */}
          <div className="pt-2.5 mb-3 border-t border-gray-100 dark:border-slate-800">
            <span className="px-3 text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-wider block mb-1.5">
              RESEARCH & ACADEMICS
            </span>
            <div className="space-y-0.5">
              <NavItem to="/publications" icon={<BookOpen size={17} />} label="Publications & Research" onClick={toggleMobileMenu} />
              <NavItem to="/grants" icon={<Search size={17} />} label="Grants & Consultancy" onClick={toggleMobileMenu} />
              <NavItem to="/pbas-appraisal" icon={<ClipboardCheck size={17} />} label="PBAS / CAS Appraisal" onClick={toggleMobileMenu} />
              <NavItem to="/cv-generator" icon={<FileText size={17} />} label="CV Generator" onClick={toggleMobileMenu} />
            </div>
          </div>

          {/* 3. AI & INSIGHTS */}
          <div className="pt-2.5 mb-3 border-t border-gray-100 dark:border-slate-800">
            <span className="px-3 text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-wider block mb-1.5">
              AI & INSIGHTS
            </span>
            <div className="space-y-0.5">
              <NavItem to="/ai-copilot" icon={<Sparkles size={17} />} label="AI Co-Pilot" onClick={toggleMobileMenu} badge="AI" />
              <NavItem to="/analytics" icon={<TrendingUp size={17} />} label="Analytics & Ranking" onClick={toggleMobileMenu} />
              <NavItem to="/collaboration-network" icon={<Share2 size={17} />} label="Research Network" onClick={toggleMobileMenu} />
              <NavItem to="/accreditation" icon={<BarChart2 size={17} />} label="NAAC / NBA Predictor" onClick={toggleMobileMenu} />
            </div>
          </div>

          {/* 4. REPORTS & VERIFICATION */}
          <div className="pt-2.5 mb-3 border-t border-gray-100 dark:border-slate-800">
            <span className="px-3 text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-wider block mb-1.5">
              REPORTS & VERIFICATION
            </span>
            <div className="space-y-0.5">
              <NavItem to="/reports" icon={<Layers size={17} />} label="Reports Hub" onClick={toggleMobileMenu} />
              <NavItem to="/verification" icon={<CheckCircle size={17} />} label="Verification Status" onClick={toggleMobileMenu} />
              <NavItem to="/audit-logs" icon={<ShieldAlert size={17} />} label="Audit Trail" onClick={toggleMobileMenu} />
            </div>
          </div>

          {/* 5. COLLABORATION */}
          <div className="pt-2.5 mb-3 border-t border-gray-100 dark:border-slate-800">
            <span className="px-3 text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-wider block mb-1.5">
              COLLABORATION
            </span>
            <div className="space-y-0.5">
              <NavItem to="/mentorship" icon={<Users size={17} />} label="Mentorship Bridge" onClick={toggleMobileMenu} />
              <NavItem to="/leaderboard" icon={<Award size={17} />} label="Leaderboard" onClick={toggleMobileMenu} />
            </div>
          </div>

          {/* 6. ADMIN / DATA */}
          <div className="pt-2.5 mb-3 border-t border-gray-100 dark:border-slate-800">
            <span className="px-3 text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-wider block mb-1.5">
              ADMIN / DATA
            </span>
            <div className="space-y-0.5">
              <NavItem to="/bulk-data" icon={<Database size={17} />} label="Batch CSV / Excel" onClick={toggleMobileMenu} />
            </div>
          </div>
        </nav>

        <div className="p-3 border-t border-gray-200 dark:border-slate-800">
          <NavItem to="/settings" icon={<Settings size={17} />} label="Settings" onClick={toggleMobileMenu} />
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden w-full">
        {/* Top Header */}
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between px-4 sm:px-6 z-10">
          <div className="flex items-center flex-1 max-w-xl">
            <button className="md:hidden p-2 mr-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white" onClick={toggleMobileMenu}>
              <Menu size={24} />
            </button>

            {/* Clickable Global Command Search Trigger */}
            <button
              onClick={() => setIsCommandOpen(true)}
              className="w-full hidden sm:flex items-center justify-between py-2 px-3.5 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200/70 dark:hover:bg-slate-700/60 text-gray-400 dark:text-slate-400 rounded-xl transition-all text-xs border border-transparent hover:border-indigo-300 dark:hover:border-slate-600"
            >
              <span className="flex items-center">
                <Search size={16} className="mr-2 text-gray-400 dark:text-slate-500" />
                <span>Search modules, faculty, publications, PBAS...</span>
              </span>
              <span className="flex items-center space-x-1 px-2 py-0.5 bg-white dark:bg-slate-900 rounded-md border border-gray-200 dark:border-slate-700 text-[10px] font-mono font-bold text-gray-500 dark:text-slate-400">
                <span>Ctrl</span>
                <span>+</span>
                <span>K</span>
              </span>
            </button>
          </div>

          <div className="flex items-center space-x-3">
            {/* Quick Cmd Button for mobile */}
            <button
              onClick={() => setIsCommandOpen(true)}
              className="sm:hidden p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl"
            >
              <Search size={20} />
            </button>

            {/* Dark Mode Toggle */}
            <button 
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            {/* Notification Center Trigger */}
            <div className="relative">
              <button 
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                className="p-2 relative text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-xl transition-colors"
              >
                <Bell size={20} />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full animate-pulse"></span>
              </button>
              
              <NotificationCenter
                isOpen={isNotifOpen}
                onClose={() => setIsNotifOpen(false)}
              />
            </div>

            {/* User Profile Avatar */}
            <div className="relative">
              <div 
                className="flex items-center space-x-2.5 cursor-pointer py-1.5 px-2 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors border border-transparent hover:border-gray-200 dark:hover:border-slate-700" 
                onClick={() => setIsProfileOpen(!isProfileOpen)}
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center font-bold text-xs shadow-sm ring-2 ring-white dark:ring-slate-900">
                  {username ? (username.charAt(0).toUpperCase() === 'A' ? 'AV' : username.slice(0, 2).toUpperCase()) : 'FA'}
                </div>
                <div className="hidden sm:block text-left">
                  <span className="text-xs font-bold text-gray-800 dark:text-slate-100 block leading-tight truncate max-w-[110px]">
                    {username?.includes('@') 
                      ? username.split('@')[0].replace(/\d+$/, '').replace(/[._-]/g, ' ').split(' ').filter(Boolean).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') || username
                      : username}
                  </span>
                  <span className="text-[10px] text-gray-400 dark:text-slate-400 block leading-none mt-0.5">Faculty / Lead</span>
                </div>
              </div>

              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-gray-100 dark:border-slate-800 py-2 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="px-4 py-2.5 border-b border-gray-100 dark:border-slate-800">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Signed in as</p>
                    <p className="text-sm font-bold text-gray-900 dark:text-white truncate mt-0.5">{username}</p>
                  </div>
                  <div className="py-1 text-xs">
                    <NavLink to="/profile" onClick={() => setIsProfileOpen(false)} className="flex items-center px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                      <UserCircle size={16} className="mr-2" /> My Profile
                    </NavLink>
                    <NavLink to="/cv-generator" onClick={() => setIsProfileOpen(false)} className="flex items-center px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                      <FileText size={16} className="mr-2" /> Academic CV Builder
                    </NavLink>
                    <NavLink to="/pbas-appraisal" onClick={() => setIsProfileOpen(false)} className="flex items-center px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                      <ClipboardCheck size={16} className="mr-2" /> Annual PBAS Score
                    </NavLink>
                    <NavLink to="/settings" onClick={() => setIsProfileOpen(false)} className="flex items-center px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                      <Settings size={16} className="mr-2" /> Settings & 2FA
                    </NavLink>
                  </div>
                  <div className="border-t border-gray-100 dark:border-slate-800 pt-1">
                    <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors flex items-center">
                      Log out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50/50 dark:bg-slate-950 p-4 sm:p-6 transition-colors">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
};

const NavItem = ({ to, icon, label, onClick, badge }) => {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        `flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all ${
          isActive
            ? 'bg-indigo-600 text-white font-bold shadow-sm shadow-indigo-500/20'
            : 'text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-slate-100 font-medium'
        }`
      }
    >
      <div className="flex items-center space-x-2.5">
        {icon}
        <span>{label}</span>
      </div>
      {badge && (
        <span className="px-1.5 py-0.5 text-[9px] font-bold rounded-md bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300">
          {badge}
        </span>
      )}
    </NavLink>
  );
};

export default DashboardLayout;

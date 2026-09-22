import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, LayoutDashboard, FileText, Sparkles, TrendingUp,
  UserCircle, Briefcase, UploadCloud, CheckCircle, Database,
  BarChart2, ShieldAlert, Award, Users, BookOpen, FileCheck,
  Zap, ArrowRight, X, Moon, Sun, Layers, Share2, ClipboardCheck
} from 'lucide-react';

const CommandPalette = ({ isOpen, onClose, onToggleDarkMode, darkMode }) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  const commands = [
    { id: 'dash', title: 'Dashboard Overview', category: 'Navigation', icon: LayoutDashboard, route: '/dashboard' },
    { id: 'copilot', title: 'AI Research Co-Pilot', category: 'AI & Smart Tools', icon: Sparkles, route: '/ai-copilot', badge: 'AI' },
    { id: 'analytics', title: 'Analytics & Ranking', category: 'Analytics', icon: TrendingUp, route: '/analytics' },
    { id: 'cv-gen', title: 'AICTE / UGC Academic CV Generator', category: 'Academic Tools', icon: FileText, route: '/cv-generator', badge: 'New' },
    { id: 'pbas', title: 'Annual Performance Appraisal (PBAS / CAS)', category: 'Accreditation', icon: ClipboardCheck, route: '/pbas-appraisal', badge: 'UGC' },
    { id: 'dept-comp', title: 'Department Hierarchy & Radar Benchmarks', category: 'Accreditation', icon: Layers, route: '/department-comparison', badge: 'Radar' },
    { id: 'network', title: 'Research Collaboration Network Graph', category: 'Analytics', icon: Share2, route: '/collaboration-network', badge: 'Graph' },
    { id: 'bulk', title: 'Batch Excel / CSV Import & Export', category: 'Data Tools', icon: Database, route: '/bulk-data', badge: 'Batch' },
    { id: 'audit', title: 'Governance & Activity Audit Trail', category: 'Governance', icon: ShieldAlert, route: '/audit-logs', badge: 'Audit' },
    { id: 'naac', title: 'NAAC / NBA Accreditation Predictor', category: 'Accreditation', icon: BarChart2, route: '/accreditation' },
    { id: 'data-entry', title: 'Add Publication / Patent / Grant', category: 'Quick Action', icon: BookOpen, route: '/data-entry' },
    { id: 'certificates', title: 'Certificates & Smart OCR Proofs', category: 'Academic Tools', icon: UploadCloud, route: '/certificates' },
    { id: 'roles', title: 'Faculty Roles & Responsibilities', category: 'Academic Tools', icon: Briefcase, route: '/roles' },
    { id: 'verification', title: 'Verification Hub & Approvals', category: 'Administration', icon: CheckCircle, route: '/verification' },
    { id: 'reports', title: 'Consolidated Reports Hub', category: 'Reports', icon: FileCheck, route: '/reports' },
    { id: 'grants', title: 'Government Grant Matcher', category: 'AI & Smart Tools', icon: Zap, route: '/grants' },
    { id: 'mentorship', title: 'Student Mentorship Bridge', category: 'Collaboration', icon: Users, route: '/mentorship' },
    { id: 'leaderboard', title: 'Faculty Impact Leaderboard', category: 'Collaboration', icon: Award, route: '/leaderboard' },
    { id: 'profile', title: 'My Faculty Profile', category: 'Navigation', icon: UserCircle, route: '/profile' }
  ];

  const filtered = commands.filter(item =>
    item.title.toLowerCase().includes(query.toLowerCase()) ||
    item.category.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % (filtered.length || 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + filtered.length) % (filtered.length || 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filtered[selectedIndex]) {
          navigate(filtered[selectedIndex].route);
          onClose();
        }
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filtered, selectedIndex, navigate, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[80vh] transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="relative flex items-center px-4 py-3.5 border-b border-gray-200 dark:border-slate-800">
          <Search size={20} className="text-indigo-600 dark:text-indigo-400 mr-3 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0); }}
            placeholder="Type a command or search modules (e.g. CV, NAAC, PBAS, DOI, Radar)..."
            className="w-full bg-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 outline-none text-base"
          />
          {query && (
            <button onClick={() => setQuery('')} className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-white mr-2">
              <X size={16} />
            </button>
          )}
          <span className="hidden sm:inline-block px-2 py-0.5 text-xs font-semibold tracking-wider text-gray-500 dark:text-slate-400 bg-gray-100 dark:bg-slate-800 rounded border border-gray-200 dark:border-slate-700">
            ESC to close
          </span>
        </div>

        {/* Command List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-gray-500 dark:text-slate-400">
              <p className="text-base font-medium">No commands found for "{query}"</p>
              <p className="text-xs mt-1 text-gray-400 dark:text-slate-500">Try searching for CV, PBAS, NAAC, Radar, Audit, or Network</p>
            </div>
          ) : (
            filtered.map((item, index) => {
              const Icon = item.icon;
              const isSelected = index === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={() => {
                    navigate(item.route);
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20 translate-x-1'
                      : 'text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className={`p-2 rounded-lg ${isSelected ? 'bg-white/20 text-white' : 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400'}`}>
                      <Icon size={18} />
                    </div>
                    <div className="truncate">
                      <p className="text-sm font-semibold truncate leading-tight">{item.title}</p>
                      <p className={`text-xs ${isSelected ? 'text-indigo-100' : 'text-gray-400 dark:text-slate-400'}`}>
                        {item.category}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    {item.badge && (
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wider ${
                        isSelected ? 'bg-white text-indigo-700' : 'bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                    <ArrowRight size={16} className={`transition-opacity ${isSelected ? 'opacity-100' : 'opacity-0'}`} />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Quick Controls */}
        <div className="px-4 py-2.5 bg-gray-50 dark:bg-slate-900/90 border-t border-gray-200 dark:border-slate-800 flex items-center justify-between text-xs text-gray-500 dark:text-slate-400">
          <div className="flex items-center space-x-4">
            <span className="flex items-center"><kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-slate-800 rounded font-mono text-[10px] mr-1">↑</kbd><kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-slate-800 rounded font-mono text-[10px] mr-1">↓</kbd> Navigate</span>
            <span className="flex items-center"><kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-slate-800 rounded font-mono text-[10px] mr-1">↵</kbd> Select</span>
          </div>
          <button
            onClick={onToggleDarkMode}
            className="flex items-center space-x-1.5 text-indigo-600 dark:text-indigo-400 font-medium hover:underline"
          >
            {darkMode ? <Sun size={14} /> : <Moon size={14} />}
            <span>{darkMode ? 'Switch to Light' : 'Switch to Dark'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;

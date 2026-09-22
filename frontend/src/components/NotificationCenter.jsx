import React, { useState } from 'react';
import { Bell, Check, CheckCheck, Clock, ShieldCheck, AlertCircle, Award, FileText, Trash2, X } from 'lucide-react';

const NotificationCenter = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('all');
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: 'Publication Verified by HOD',
      description: 'Your research paper "Deep Learning in Healthcare (SCI Index)" has been approved and credited with 30.0 API points.',
      type: 'approval',
      category: 'Publications',
      time: '12 mins ago',
      read: false
    },
    {
      id: 2,
      title: 'NAAC SSR Cycle 2 Upload Deadline',
      description: 'Criterion 3.3.1 publication dataset submission closes in 48 hours. Please review pending uploads.',
      type: 'deadline',
      category: 'Accreditation',
      time: '2 hours ago',
      read: false
    },
    {
      id: 3,
      title: 'DST-SERB Core Research Grant Match',
      description: 'AI Grant Matcher identified a 94% relevance funding call for your research in Edge Computing.',
      type: 'grant',
      category: 'Grants',
      time: '1 day ago',
      read: false
    },
    {
      id: 4,
      title: 'PBAS / CAS Stage 2 Benchmark Reached',
      description: 'Your annual PBAS score for 2025-26 reached 192.0 points, fulfilling eligibility for Senior Scale promotion.',
      type: 'achievement',
      category: 'Appraisal',
      time: '2 days ago',
      read: true
    },
    {
      id: 5,
      title: 'FDP Certificate Ingested via OCR',
      description: 'AICTE ATAL 5-Day Online FDP Certificate verified and added to your portfolio.',
      type: 'approval',
      category: 'Certificates',
      time: '3 days ago',
      read: true
    }
  ]);

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const markAsRead = (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const deleteNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const filtered = notifications.filter(n => {
    if (activeTab === 'unread') return !n.read;
    if (activeTab === 'approvals') return n.type === 'approval';
    if (activeTab === 'deadlines') return n.type === 'deadline';
    return true;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  if (!isOpen) return null;

  return (
    <div className="absolute right-0 top-12 mt-2 w-96 max-w-[90vw] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-slate-800 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
      {/* Header */}
      <div className="p-4 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-lg">
            <Bell size={18} />
          </div>
          <h3 className="font-bold text-gray-900 dark:text-white text-base">Notifications</h3>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 text-xs font-bold bg-rose-500 text-white rounded-full">
              {unreadCount} new
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              title="Mark all as read"
              className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline flex items-center"
            >
              <CheckCheck size={14} className="mr-1" /> Mark all read
            </button>
          )}
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-white">
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex px-3 pt-2 bg-gray-50/50 dark:bg-slate-900/50 border-b border-gray-100 dark:border-slate-800 space-x-1">
        {[
          { id: 'all', label: 'All' },
          { id: 'unread', label: `Unread (${unreadCount})` },
          { id: 'approvals', label: 'Approvals' },
          { id: 'deadlines', label: 'Deadlines' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === tab.id
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Notification List */}
      <div className="max-h-[380px] overflow-y-auto divide-y divide-gray-100 dark:divide-slate-800/60">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-gray-400 dark:text-slate-500">
            <Bell size={28} className="mx-auto mb-2 opacity-40" />
            <p className="text-sm font-medium">No notifications in this tab</p>
          </div>
        ) : (
          filtered.map(item => {
            const getIcon = () => {
              if (item.type === 'approval') return <ShieldCheck size={16} className="text-emerald-500" />;
              if (item.type === 'deadline') return <AlertCircle size={16} className="text-amber-500" />;
              if (item.type === 'grant') return <FileText size={16} className="text-blue-500" />;
              return <Award size={16} className="text-purple-500" />;
            };

            return (
              <div
                key={item.id}
                onClick={() => markAsRead(item.id)}
                className={`p-3.5 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer relative group ${
                  !item.read ? 'bg-indigo-50/40 dark:bg-indigo-950/20' : ''
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div className="p-2 rounded-xl bg-gray-100 dark:bg-slate-800 shrink-0 mt-0.5">
                    {getIcon()}
                  </div>
                  <div className="flex-1 min-w-0 pr-6">
                    <div className="flex items-center justify-between">
                      <p className={`text-xs font-semibold ${!item.read ? 'text-indigo-900 dark:text-indigo-200' : 'text-gray-800 dark:text-slate-200'}`}>
                        {item.title}
                      </p>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>
                    <div className="flex items-center space-x-2 mt-2">
                      <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 rounded font-medium">
                        {item.category}
                      </span>
                      <span className="text-[11px] text-gray-400 dark:text-slate-500 flex items-center">
                        <Clock size={10} className="mr-1" /> {item.time}
                      </span>
                    </div>
                  </div>

                  {/* Actions on hover */}
                  <div className="absolute top-3.5 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-1">
                    {!item.read && (
                      <button
                        onClick={(e) => { e.stopPropagation(); markAsRead(item.id); }}
                        title="Mark as read"
                        className="p-1 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 rounded text-indigo-600 dark:text-indigo-400"
                      >
                        <Check size={14} />
                      </button>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteNotification(item.id); }}
                      title="Dismiss"
                      className="p-1 hover:bg-rose-100 dark:hover:bg-rose-900/40 rounded text-rose-500"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="p-2.5 bg-gray-50 dark:bg-slate-900/90 border-t border-gray-100 dark:border-slate-800 text-center">
        <span className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
          Automated Alerts Synchronized with Institutional ERP
        </span>
      </div>
    </div>
  );
};

export default NotificationCenter;

import React, { useState, useEffect } from 'react';
import { fetchAPI } from '../services/api';
import { User, Mail, Building, Key, Save, CheckCircle, RefreshCw, Link as LinkIcon } from 'lucide-react';
import api from '../services/api';

const Settings = () => {
  const [formData, setFormData] = useState({
    email: '',
    department: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const loadProfileData = async () => {
      try {
        const data = await fetchAPI('/faculty/profile/');
        setFormData(prev => ({
          ...prev,
          email: data.email || '',
          department: data.department || ''
        }));
      } catch (err) {
        setError('Failed to load user data.');
      } finally {
        setLoading(false);
      }
    };
    loadProfileData();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    
    if (formData.password && formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        email: formData.email,
        department: formData.department,
      };
      if (formData.password) {
        payload.password = formData.password;
      }
      
      await fetchAPI('/faculty/settings/', {
        method: 'PATCH',
        body: JSON.stringify(payload)
      });
      
      setMessage('Settings updated successfully!');
      setFormData(prev => ({ ...prev, password: '', confirmPassword: '' }));
    } catch (err) {
      setError(err.message || 'Failed to update settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    setMessage('');
    setError('');
    try {
      const res = await api.post('/faculty/profile/sync-external/');
      setMessage(`${res.data.message} (${res.data.imported_publications} publications added).`);
    } catch (err) {
      setError('Failed to sync with external profiles.');
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-gray-500">Loading settings...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Account Settings</h1>
      
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-8">
          
          {message && (
            <div className="mb-6 p-4 bg-green-50 text-green-700 rounded-lg flex items-center gap-2">
              <CheckCircle size={20} />
              {message}
            </div>
          )}
          
          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">Profile Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail size={18} className="text-gray-400" />
                  </div>
                  <input 
                    type="email" 
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all" 
                    placeholder="your.email@university.edu"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Building size={18} className="text-gray-400" />
                  </div>
                  <input 
                    type="text" 
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all" 
                    placeholder="e.g., Computer Science"
                  />
                </div>
              </div>
            </div>

            <h3 className="text-lg font-bold text-gray-900 mb-4 mt-8 border-b pb-2">External Integrations</h3>
            <div className="bg-indigo-50 border border-indigo-100 p-6 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <h4 className="font-bold text-indigo-900 text-lg flex items-center gap-2">
                  <LinkIcon size={20} /> ORCID & Google Scholar Sync
                </h4>
                <p className="text-sm text-indigo-700 mt-1">
                  Automatically fetch and import your latest publications, citations, and h-index.
                </p>
              </div>
              <button
                type="button"
                onClick={handleSync}
                disabled={syncing}
                className="flex items-center gap-2 px-6 py-3 bg-white text-indigo-600 border border-indigo-200 rounded-xl font-medium shadow-sm hover:bg-indigo-50 transition-colors whitespace-nowrap disabled:opacity-50"
              >
                <RefreshCw size={18} className={syncing ? 'animate-spin' : ''} />
                {syncing ? 'Syncing Data...' : 'Sync Now'}
              </button>
            </div>

            <h3 className="text-lg font-bold text-gray-900 mb-4 mt-8 border-b pb-2">Change Password</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">New Password (optional)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Key size={18} className="text-gray-400" />
                  </div>
                  <input 
                    type="password" 
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all" 
                    placeholder="••••••••"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Key size={18} className="text-gray-400" />
                  </div>
                  <input 
                    type="password" 
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all" 
                    placeholder="••••••••"
                  />
                </div>
              </div>
            </div>

            <div className="pt-6 flex justify-end">
              <button 
                type="submit" 
                disabled={saving}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-medium transition-colors shadow-sm disabled:opacity-50"
              >
                <Save size={20} /> {saving ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </form>
          
        </div>
      </div>
    </div>
  );
};

export default Settings;

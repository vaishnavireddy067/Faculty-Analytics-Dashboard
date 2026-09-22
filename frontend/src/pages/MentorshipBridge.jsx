import React, { useState, useEffect } from 'react';
import { Briefcase, GraduationCap, Building2, Handshake, Mail, Search, Users } from 'lucide-react';
import api from '../services/api';

const MentorshipBridge = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await api.get('/faculty/mentorship/projects/');
        setProjects(res.data.projects || []);
      } catch (err) {
        console.error("Failed to fetch mentorship projects", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, []);

  const handleSponsor = (id) => {
    alert(`Thank you for your interest! An email has been drafted to the guiding faculty for project ID: ${id}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="bg-indigo-900 rounded-3xl p-8 sm:p-12 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 opacity-20">
          <Building2 size={250} />
        </div>
        <div className="relative z-10 max-w-2xl">
          <span className="inline-block py-1 px-3 rounded-full bg-indigo-800 text-indigo-200 text-sm font-semibold mb-4 border border-indigo-700">
            Industry & Alumni Connect
          </span>
          <h1 className="text-4xl font-black mb-4">Mentorship Bridge</h1>
          <p className="text-indigo-200 text-lg">
            Empower the next generation. Browse innovative student research projects and connect with guiding faculty to offer industry sponsorship, internships, or technical mentorship.
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text" 
            placeholder="Search by domain (e.g., AI, Cyber)..." 
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-sm font-medium text-gray-500">I am an:</span>
          <select className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500 text-gray-700">
            <option>Industry Partner</option>
            <option>Alumni</option>
            <option>External Researcher</option>
          </select>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((proj) => (
          <div key={proj.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col hover:shadow-md transition-shadow">
            <div className="p-6 flex-grow border-b border-gray-50">
              <div className="flex justify-between items-start mb-4">
                <span className="inline-block px-2.5 py-1 bg-indigo-50 text-indigo-600 text-xs font-bold rounded-full">
                  {proj.domain}
                </span>
                <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
                  {proj.status}
                </span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3 leading-snug">{proj.title}</h3>
              
              <div className="space-y-2 mt-4 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <GraduationCap size={16} className="text-gray-400" />
                  <span>Guided by <strong className="text-gray-900">{proj.faculty}</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <Users size={16} className="text-gray-400" />
                  <span>Team: {proj.students}</span>
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-gray-50 flex gap-2">
              <button 
                onClick={() => handleSponsor(proj.id)}
                className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 text-white font-medium py-2.5 rounded-xl hover:bg-indigo-700 transition-colors"
              >
                <Handshake size={18} /> Connect
              </button>
              <button className="flex items-center justify-center p-2.5 bg-white border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-100 transition-colors">
                <Mail size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>
      
      {projects.length === 0 && (
        <div className="text-center p-12 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <Briefcase className="mx-auto h-12 w-12 text-gray-300 mb-4" />
          <h3 className="text-lg font-bold text-gray-900">No Projects Found</h3>
          <p className="text-gray-500">Currently, there are no student projects seeking external mentorship.</p>
        </div>
      )}
    </div>
  );
};

export default MentorshipBridge;

import React, { useState, useEffect } from 'react';
import { Trophy, Medal, Star, Shield, Award } from 'lucide-react';
import api from '../services/api';

const Leaderboard = () => {
  const [faculty, setFaculty] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const res = await api.get('/faculty/analytics/leaderboard/');
        setFaculty(res.data.top_faculty || []);
      } catch (err) {
        console.error("Failed to fetch leaderboard", err);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const getRankIcon = (index) => {
    switch(index) {
      case 0: return <Trophy className="text-yellow-400 fill-yellow-400 h-8 w-8" />;
      case 1: return <Medal className="text-gray-400 fill-gray-400 h-8 w-8" />;
      case 2: return <Medal className="text-amber-600 fill-amber-600 h-8 w-8" />;
      default: return <span className="text-gray-400 font-bold text-lg w-8 text-center">{index + 1}</span>;
    }
  };

  const getBadgeIcon = (badge) => {
    if(badge.includes('Innovator')) return <Shield size={14} className="text-purple-600" />;
    if(badge.includes('Publisher')) return <Star size={14} className="text-yellow-600" />;
    if(badge.includes('Winner')) return <Award size={14} className="text-emerald-600" />;
    return <Award size={14} className="text-indigo-600" />;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center py-8">
        <div className="inline-flex items-center justify-center p-4 bg-yellow-50 rounded-full mb-4">
          <Trophy size={48} className="text-yellow-500" />
        </div>
        <h1 className="text-3xl font-black text-gray-900 mb-2">Institute Leaderboard</h1>
        <p className="text-gray-500">Celebrating top research performance and excellence this academic year.</p>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50/50">
          <h2 className="font-bold text-gray-900">Top Faculty (API Scores)</h2>
          <select className="bg-white border border-gray-200 text-sm text-gray-600 rounded-lg px-3 py-1.5 focus:outline-none focus:border-indigo-500">
            <option>This Year</option>
            <option>All Time</option>
          </select>
        </div>
        
        <div className="p-2">
          {faculty.map((member, index) => (
            <div 
              key={index} 
              className="flex items-center p-4 hover:bg-gray-50 rounded-2xl transition-colors group"
            >
              <div className="flex items-center justify-center w-12 h-12 flex-shrink-0">
                {getRankIcon(index)}
              </div>
              
              <div className="flex-grow ml-4">
                <h3 className="text-lg font-bold text-gray-900">{member.name}</h3>
                <p className="text-sm text-gray-500">{member.department} Department</p>
              </div>

              <div className="flex items-center gap-2 mr-6 hidden md:flex">
                {member.badges.map((badge, bIdx) => (
                  <div key={bIdx} className="flex items-center gap-1.5 px-3 py-1 bg-gray-100 rounded-full text-xs font-medium text-gray-700 border border-gray-200 group-hover:bg-white transition-colors">
                    {getBadgeIcon(badge)}
                    {badge}
                  </div>
                ))}
              </div>

              <div className="text-right flex-shrink-0">
                <p className="text-2xl font-black text-indigo-600">{member.score}</p>
                <p className="text-xs text-indigo-400 font-semibold uppercase tracking-wider">API Points</p>
              </div>
            </div>
          ))}
          {faculty.length === 0 && (
            <div className="p-8 text-center text-gray-500">No leaderboard data available.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;

import React, { useState, useEffect } from 'react';
import { TrendingUp, Award, BarChart2, Users } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import api from '../services/api';

const NetworkGraph = ({ data }) => {
  if (!data || !data.nodes || data.nodes.length === 0) return <div className="text-gray-400 text-sm">No network data</div>;

  const width = 400;
  const height = 250;
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = 90;

  // Position nodes in a circle
  const nodes = data.nodes.map((node, i) => {
    const angle = (i / data.nodes.length) * 2 * Math.PI;
    return {
      ...node,
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle)
    };
  });

  // Create a map for quick node lookup
  const nodeMap = nodes.reduce((acc, n) => {
    acc[n.id] = n;
    return acc;
  }, {});

  const getGroupColor = (group) => {
    const colors = {
      'CSE': '#4f46e5',
      'ECE': '#06b6d4',
      'MECH': '#f59e0b',
      'CIVIL': '#10b981',
      'IT': '#8b5cf6'
    };
    return colors[group] || '#94a3b8';
  };

  return (
    <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet">
      {/* Draw Edges */}
      {data.edges.map((edge, i) => {
        const source = nodeMap[edge.from];
        const target = nodeMap[edge.to];
        if (!source || !target) return null;
        return (
          <line
            key={`edge-${i}`}
            x1={source.x}
            y1={source.y}
            x2={target.x}
            y2={target.y}
            stroke="#e2e8f0"
            strokeWidth={edge.value || 1}
            strokeOpacity={0.6}
          />
        );
      })}
      {/* Draw Nodes */}
      {nodes.map((node, i) => (
        <g key={`node-${node.id}`} className="hover:opacity-80 cursor-pointer transition-opacity">
          <circle
            cx={node.x}
            cy={node.y}
            r={8}
            fill={getGroupColor(node.group)}
            stroke="#ffffff"
            strokeWidth={2}
          >
            <title>{node.label} ({node.group})</title>
          </circle>
          <text
            x={node.x}
            y={node.y - 12}
            fontSize="10"
            fill="#475569"
            textAnchor="middle"
            className="pointer-events-none select-none"
          >
            {node.label}
          </text>
        </g>
      ))}
    </svg>
  );
};

const Heatmap = ({ data }) => {
  if (!data || data.length === 0) return <div className="text-gray-400 text-sm">No heatmap data</div>;
  
  const departments = [...new Set(data.map(d => d.department))];
  const years = [...new Set(data.map(d => d.year))].sort();

  const getHeatmapColor = (value) => {
    // Determine color based on value intensity
    if (value > 40) return 'bg-indigo-900 text-white';
    if (value > 30) return 'bg-indigo-700 text-indigo-50';
    if (value > 20) return 'bg-indigo-500 text-indigo-50';
    if (value > 10) return 'bg-indigo-300 text-indigo-900';
    if (value > 0) return 'bg-indigo-100 text-indigo-900';
    return 'bg-gray-50 text-gray-400';
  };

  return (
    <div className="w-full overflow-x-auto">
      <div className="min-w-max">
        {/* Header row (Years) */}
        <div className="flex">
          <div className="w-24 shrink-0"></div>
          {years.map(year => (
            <div key={year} className="w-16 text-center text-xs font-semibold text-gray-500 pb-2">{year}</div>
          ))}
        </div>
        
        {/* Data rows (Departments) */}
        <div className="space-y-1">
          {departments.map(dept => (
            <div key={dept} className="flex items-center">
              <div className="w-24 shrink-0 text-sm font-medium text-gray-700 truncate pr-2">{dept}</div>
              {years.map(year => {
                const cell = data.find(d => d.department === dept && d.year === year);
                const value = cell ? cell.value : 0;
                return (
                  <div key={`${dept}-${year}`} className="w-16 px-1">
                    <div 
                      className={`h-8 w-full rounded flex items-center justify-center text-xs font-medium transition-colors cursor-help hover:opacity-80 ${getHeatmapColor(value)}`}
                      title={`${dept} in ${year}: ${value} publications`}
                    >
                      {value}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const Analytics = () => {
  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [citationData, setCitationData] = useState([
    { year: '2022', citations: 0 },
    { year: '2023', citations: 0 },
    { year: '2024', citations: 0 },
    { year: '2025', citations: 0 },
    { year: '2026', citations: 0 },
  ]);

  const [publicationData, setPublicationData] = useState([
    { name: 'Scopus', value: 0 },
    { name: 'SCI', value: 0 },
    { name: 'WOS', value: 0 },
    { name: 'UGC-CARE', value: 0 },
  ]);

  const [networkData, setNetworkData] = useState({ nodes: [], edges: [] });
  const [heatmapData, setHeatmapData] = useState([]);

  useEffect(() => {
    const fetchRankings = async () => {
      try {
        const res = await api.get('/faculty/analytics/ranking/');
        const rList = res?.data?.rankings || res?.rankings || res?.data || res || [];
        setRankings(Array.isArray(rList) ? rList : []);
      } catch (error) {
        console.error("Error fetching rankings", error);
        setRankings([]);
      } finally {
        setLoading(false);
      }
    };
    
    const fetchNetwork = async () => {
      try {
        const res = await api.get('/faculty/analytics/network/');
        const net = res?.data || res;
        if (net && net.nodes) {
          setNetworkData(net);
        }
      } catch (error) {
        console.error("Error fetching network", error);
      }
    };

    const fetchHeatmap = async () => {
      try {
        const res = await api.get('/faculty/department-heatmap/');
        const hm = res?.data?.heatmap || res?.heatmap || res?.data || res || [];
        setHeatmapData(Array.isArray(hm) ? hm : []);
      } catch (error) {
        console.error("Error fetching heatmap", error);
      }
    };

    const fetchPublicationsStats = async () => {
      try {
        const res = await api.get('/faculty/publications/');
        const pubs = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
        if (pubs.length > 0) {
          const scopus = pubs.filter(p => p.indexing === 'SCOPUS').length;
          const sci = pubs.filter(p => p.indexing === 'SCI').length;
          const wos = pubs.filter(p => p.indexing === 'WOS').length;
          const ugc = pubs.filter(p => p.indexing === 'UGC_CARE' || p.indexing === 'PEER_REVIEWED').length;
          setPublicationData([
            { name: 'Scopus', value: scopus },
            { name: 'SCI', value: sci },
            { name: 'WOS', value: wos },
            { name: 'UGC-CARE', value: ugc },
          ]);

          const yearCounts = { '2022': 0, '2023': 0, '2024': 0, '2025': 0, '2026': 0 };
          pubs.forEach(p => {
            const yr = String(p.year || '');
            if (yearCounts[yr] !== undefined) {
              yearCounts[yr] += (p.citations || 1);
            }
          });
          setCitationData(Object.keys(yearCounts).map(y => ({ year: y, citations: yearCounts[y] })));
        }
      } catch (e) {
        console.error("Error fetching publications for analytics", e);
      }
    };

    fetchRankings();
    fetchNetwork();
    fetchHeatmap();
    fetchPublicationsStats();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-3 bg-indigo-100 rounded-xl text-indigo-600">
          <TrendingUp size={28} />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics & Ranking</h1>
          <p className="text-gray-500">Department-wide research impact and performance rankings.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Rankings Leaderboard */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
            <Award className="mr-2 text-yellow-500" size={24} /> Faculty Leaderboard
          </h2>
          
          {loading ? (
            <div className="animate-pulse space-y-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-16 bg-gray-100 rounded-xl"></div>
              ))}
            </div>
          ) : rankings.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Award size={32} className="mx-auto mb-2 opacity-40 text-yellow-500" />
              <p className="text-sm font-semibold text-gray-600">No faculty rankings yet</p>
              <p className="text-xs text-gray-400 mt-1">Faculty with verified API scores will appear on the leaderboard.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {rankings.map((faculty, index) => (
                <div key={index} className={`flex items-center p-4 rounded-xl border ${index === 0 ? 'bg-yellow-50 border-yellow-200' : index === 1 ? 'bg-gray-50 border-gray-200' : index === 2 ? 'bg-orange-50 border-orange-200' : 'border-gray-100'}`}>
                  <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center font-bold text-lg mr-4">
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : <span className="text-gray-400">#{faculty.rank}</span>}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{faculty.name}</h3>
                    <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                      <div className="bg-indigo-600 h-1.5 rounded-full" style={{ width: `${faculty.score}%` }}></div>
                    </div>
                  </div>
                  <div className="ml-4 font-bold text-indigo-600 flex items-center">
                    {faculty.score} <span className="text-xs text-gray-500 ml-1">pts</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Graphs */}
        <div className="lg:col-span-2 space-y-6">
          {/* Citation Growth Chart */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 h-[350px] flex flex-col">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <TrendingUp className="mr-2 text-indigo-500" size={20} /> Citation Growth Over Time
            </h2>
            <div className="flex-1 w-full min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={citationData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCitations" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="year" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Area type="monotone" dataKey="citations" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorCitations)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Publication Quality Chart */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 h-[350px] flex flex-col">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <BarChart2 className="mr-2 text-indigo-500" size={20} /> Publication Quality Matrix
            </h2>
            <div className="flex-1 w-full min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={publicationData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }} barSize={40}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="name" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip cursor={{fill: '#f3f4f6'}} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 h-[300px] flex flex-col justify-center items-center text-center">
            <h2 className="text-lg font-semibold text-gray-800 mb-2 flex items-center justify-center">
              <Users className="mr-2 text-indigo-500" size={20} /> Collaboration Network
            </h2>
            <p className="text-sm text-gray-500 mb-4">Visualizing inter-departmental research collaborations.</p>
            <div className="flex-1 w-full relative">
                <NetworkGraph data={networkData} />
            </div>
          </div>
          
          {/* Department Research Heatmap */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col justify-center items-center">
            <h2 className="text-lg font-semibold text-gray-800 mb-2 flex items-center justify-center">
              <BarChart2 className="mr-2 text-indigo-500" size={20} /> Department Research Heatmap
            </h2>
            <p className="text-sm text-gray-500 mb-6">Publications volume across departments over the last 5 years.</p>
            <div className="w-full">
                <Heatmap data={heatmapData} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;

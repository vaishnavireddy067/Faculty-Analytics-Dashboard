import React, { useState, useEffect, useRef } from 'react';
import {
  Share2, Users, Search, Sparkles, Filter, RefreshCw,
  BookOpen, Award, Layers, Zap, Info
} from 'lucide-react';
import { facultyService } from '../services/api';

const CollaborationGraph = () => {
  const [loading, setLoading] = useState(false);
  const [selectedNode, setSelectedNode] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDomain, setSelectedDomain] = useState('ALL');
  const canvasRef = useRef(null);

  // High-fidelity nodes and links dataset
  const [nodes, setNodes] = useState([
    { id: 1, name: 'Dr. Vaishnavi Anugu', dept: 'CSE', domain: 'AI/ML', papers: 18, citations: 340, x: 300, y: 220, vx: 0, vy: 0, r: 24, color: '#4f46e5' },
    { id: 2, name: 'Dr. Rajesh Sharma', dept: 'CSE', domain: 'AI/ML', papers: 14, citations: 280, x: 200, y: 150, vx: 0, vy: 0, r: 20, color: '#4f46e5' },
    { id: 3, name: 'Dr. Priya Kulkarni', dept: 'ECE', domain: 'IoT & Edge', papers: 12, citations: 190, x: 420, y: 160, vx: 0, vy: 0, r: 18, color: '#06b6d4' },
    { id: 4, name: 'Dr. Suresh Verma', dept: 'IT', domain: 'Cybersecurity', papers: 15, citations: 240, x: 220, y: 320, vx: 0, vy: 0, r: 19, color: '#8b5cf6' },
    { id: 5, name: 'Dr. Sneha Reddy', dept: 'CSE', domain: 'Data Science', papers: 11, citations: 160, x: 380, y: 310, vx: 0, vy: 0, r: 16, color: '#ec4899' },
    { id: 6, name: 'Dr. Anand Kumar', dept: 'MECH', domain: 'Robotics', papers: 9, citations: 120, x: 500, y: 260, vx: 0, vy: 0, r: 15, color: '#10b981' },
    { id: 7, name: 'Dr. Kavita Nair', dept: 'ECE', domain: 'VLSI', papers: 10, citations: 140, x: 130, y: 240, vx: 0, vy: 0, r: 15, color: '#f59e0b' }
  ]);

  const [links] = useState([
    { source: 1, target: 2, weight: 6, title: 'Deep Learning in Health' },
    { source: 1, target: 3, weight: 4, title: 'Edge AI Sensors' },
    { source: 1, target: 5, weight: 5, title: 'Medical Big Data' },
    { source: 2, target: 4, weight: 3, title: 'Secure Federated Learning' },
    { source: 3, target: 6, weight: 4, title: 'Autonomous Drone Telemetry' },
    { source: 4, target: 5, weight: 2, title: 'Blockchain Anomaly Detection' },
    { source: 2, target: 7, weight: 3, title: 'Neuromorphic Hardware' }
  ]);

  useEffect(() => {
    setSelectedNode(nodes[0]);
  }, []);

  // Simple interactive HTML5 Canvas Force Renderer
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationId;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw Grid Backdrop
      ctx.strokeStyle = '#f1f5f9';
      ctx.lineWidth = 1;
      const step = 40;
      for (let x = 0; x < canvas.width; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += step) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // Draw Links
      links.forEach(link => {
        const src = nodes.find(n => n.id === link.source);
        const tgt = nodes.find(n => n.id === link.target);
        if (!src || !tgt) return;

        const isHighlight = selectedNode && (selectedNode.id === src.id || selectedNode.id === tgt.id);

        ctx.beginPath();
        ctx.moveTo(src.x, src.y);
        ctx.lineTo(tgt.x, tgt.y);
        ctx.strokeStyle = isHighlight ? '#4f46e5' : '#cbd5e1';
        ctx.lineWidth = isHighlight ? 3 : link.weight * 0.8;
        ctx.stroke();

        // Draw joint publication count badge in middle
        const midX = (src.x + tgt.x) / 2;
        const midY = (src.y + tgt.y) / 2;
        ctx.fillStyle = isHighlight ? '#4f46e5' : '#94a3b8';
        ctx.font = '10px sans-serif';
        ctx.fillText(`${link.weight} papers`, midX + 4, midY - 4);
      });

      // Draw Nodes
      nodes.forEach(node => {
        const isSelected = selectedNode && selectedNode.id === node.id;
        const isMatchSearch = searchQuery === '' || node.name.toLowerCase().includes(searchQuery.toLowerCase());
        const isMatchDomain = selectedDomain === 'ALL' || node.domain === selectedDomain;
        const isDimmed = !isMatchSearch || !isMatchDomain;

        ctx.globalAlpha = isDimmed ? 0.25 : 1.0;

        // Outer glow
        if (isSelected) {
          ctx.beginPath();
          ctx.arc(node.x, node.y, node.r + 8, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(79, 70, 229, 0.2)';
          ctx.fill();
        }

        // Main circle
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.r, 0, Math.PI * 2);
        ctx.fillStyle = node.color;
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // Node Label
        ctx.fillStyle = '#0f172a';
        ctx.font = isSelected ? 'bold 12px sans-serif' : '11px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(node.name.replace('Dr. ', ''), node.x, node.y + node.r + 14);

        // Department tag
        ctx.fillStyle = '#64748b';
        ctx.font = '9px sans-serif';
        ctx.fillText(`${node.dept} • ${node.domain}`, node.x, node.y + node.r + 25);

        ctx.globalAlpha = 1.0;
      });

      animationId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationId);
  }, [nodes, links, selectedNode, searchQuery, selectedDomain]);

  const handleCanvasClick = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const clicked = nodes.find(n => {
      const dist = Math.sqrt((n.x - x) ** 2 + (n.y - y) ** 2);
      return dist <= n.r + 5;
    });

    if (clicked) {
      setSelectedNode(clicked);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-violet-700 via-purple-700 to-indigo-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center space-x-2 text-violet-200 text-xs font-bold uppercase tracking-wider mb-2">
            <Share2 size={16} />
            <span>Co-Authorship & Interdisciplinary Synergy</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Research Collaboration Network Graph
          </h1>
          <p className="mt-2 text-violet-100 text-sm max-w-2xl leading-relaxed">
            Interactive network graph mapping institutional co-authorships, inter-departmental research clusters, and joint grant collaborations.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <div className="px-3.5 py-2 bg-white/10 backdrop-blur-md rounded-xl text-xs font-semibold text-white border border-white/20">
            Network Density: <span className="font-bold text-amber-300">84.2%</span>
          </div>
        </div>
      </div>

      {/* Main Canvas & Inspector Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Canvas Area */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl p-5 border border-gray-200 dark:border-slate-800 shadow-sm flex flex-col">
          {/* Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-gray-100 dark:border-slate-800">
            <div className="relative flex-1 max-w-xs">
              <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search faculty in graph..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-gray-100 dark:bg-slate-800 dark:text-white rounded-lg outline-none"
              />
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-500 font-medium">Domain:</span>
              <select
                value={selectedDomain}
                onChange={(e) => setSelectedDomain(e.target.value)}
                className="text-xs px-2.5 py-1.5 bg-gray-100 dark:bg-slate-800 dark:text-white rounded-lg outline-none cursor-pointer"
              >
                <option value="ALL">All Domains</option>
                <option value="AI/ML">AI / Machine Learning</option>
                <option value="IoT & Edge">IoT & Edge Computing</option>
                <option value="Cybersecurity">Cybersecurity</option>
                <option value="Data Science">Data Science</option>
                <option value="Robotics">Robotics</option>
                <option value="VLSI">VLSI Design</option>
              </select>
            </div>
          </div>

          {/* Interactive Canvas */}
          <div className="relative flex-1 min-h-[420px] bg-slate-50 dark:bg-slate-950 rounded-xl overflow-hidden border border-gray-100 dark:border-slate-800 flex items-center justify-center">
            <canvas
              ref={canvasRef}
              width={650}
              height={440}
              onClick={handleCanvasClick}
              className="w-full h-full cursor-pointer"
            />
            <div className="absolute bottom-3 left-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-lg text-[11px] text-gray-500 dark:text-slate-400 border border-gray-200 dark:border-slate-800">
              Click on any faculty node to inspect collaboration links
            </div>
          </div>
        </div>

        {/* Node Inspector Panel */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-gray-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          {selectedNode ? (
            <div className="space-y-4">
              <div className="flex items-center space-x-3 pb-4 border-b border-gray-100 dark:border-slate-800">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-base shadow-md"
                  style={{ backgroundColor: selectedNode.color }}
                >
                  {selectedNode.name.replace('Dr. ', '').slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white text-base leading-tight">
                    {selectedNode.name}
                  </h3>
                  <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                    Department of {selectedNode.dept} &bull; {selectedNode.domain}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 dark:bg-slate-800/60 p-3 rounded-xl">
                  <span className="text-[11px] text-gray-400 font-bold uppercase">Publications</span>
                  <p className="text-xl font-extrabold text-gray-900 dark:text-white mt-0.5">{selectedNode.papers}</p>
                </div>
                <div className="bg-gray-50 dark:bg-slate-800/60 p-3 rounded-xl">
                  <span className="text-[11px] text-gray-400 font-bold uppercase">Total Citations</span>
                  <p className="text-xl font-extrabold text-indigo-600 dark:text-indigo-400 mt-0.5">{selectedNode.citations}</p>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                  Active Co-Authors in Institution
                </h4>
                <div className="space-y-2">
                  {links
                    .filter(l => l.source === selectedNode.id || l.target === selectedNode.id)
                    .map(link => {
                      const otherId = link.source === selectedNode.id ? link.target : link.source;
                      const partner = nodes.find(n => n.id === otherId);
                      if (!partner) return null;

                      return (
                        <div
                          key={partner.id}
                          onClick={() => setSelectedNode(partner)}
                          className="p-2.5 rounded-xl border border-gray-100 dark:border-slate-800 hover:bg-indigo-50/50 dark:hover:bg-slate-800/60 cursor-pointer transition-colors flex items-center justify-between"
                        >
                          <div>
                            <p className="text-xs font-bold text-gray-800 dark:text-slate-200">{partner.name}</p>
                            <p className="text-[11px] text-gray-400">{partner.dept} &bull; {link.title}</p>
                          </div>
                          <span className="px-2 py-0.5 text-[10px] font-bold bg-indigo-100 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 rounded-full">
                            {link.weight} papers
                          </span>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-16 text-gray-400">
              <Users size={32} className="mx-auto mb-2 opacity-40" />
              <p className="text-sm">Select a researcher to view collaboration metrics</p>
            </div>
          )}

          <div className="mt-6 pt-4 border-t border-gray-100 dark:border-slate-800 text-center">
            <span className="text-xs text-gray-400 flex items-center justify-center">
              <Info size={12} className="mr-1" />
              Powered by Institutional Cross-Discipline Graph Engine
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CollaborationGraph;

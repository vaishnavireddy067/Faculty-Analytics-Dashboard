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
  const [hoveredNode, setHoveredNode] = useState(null);
  const canvasRef = useRef(null);

  // High-fidelity nodes with generous spacing
  const [nodes, setNodes] = useState([
    { id: 1, name: 'Dr. Vaishnavi Anugu', dept: 'CSE', domain: 'AI/ML', papers: 18, citations: 340, x: 380, y: 220, r: 28, color: '#4f46e5' },
    { id: 2, name: 'Dr. Rajesh Sharma', dept: 'CSE', domain: 'AI/ML', papers: 14, citations: 280, x: 180, y: 130, r: 24, color: '#6366f1' },
    { id: 3, name: 'Dr. Priya Kulkarni', dept: 'ECE', domain: 'IoT & Edge', papers: 12, citations: 190, x: 580, y: 140, r: 22, color: '#06b6d4' },
    { id: 4, name: 'Dr. Suresh Verma', dept: 'IT', domain: 'Cybersecurity', papers: 15, citations: 240, x: 170, y: 350, r: 23, color: '#8b5cf6' },
    { id: 5, name: 'Dr. Sneha Reddy', dept: 'CSE', domain: 'Data Science', papers: 11, citations: 160, x: 440, y: 370, r: 22, color: '#ec4899' },
    { id: 6, name: 'Dr. Anand Kumar', dept: 'MECH', domain: 'Robotics', papers: 9, citations: 120, x: 670, y: 300, r: 20, color: '#10b981' },
    { id: 7, name: 'Dr. Kavita Nair', dept: 'ECE', domain: 'VLSI', papers: 10, citations: 140, x: 70, y: 230, r: 20, color: '#f59e0b' }
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

  const draggingNodeRef = useRef(null);
  const dragOffsetRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    setSelectedNode(nodes[0]);
  }, []);

  const resetLayout = () => {
    setNodes([
      { id: 1, name: 'Dr. Vaishnavi Anugu', dept: 'CSE', domain: 'AI/ML', papers: 18, citations: 340, x: 380, y: 220, r: 28, color: '#4f46e5' },
      { id: 2, name: 'Dr. Rajesh Sharma', dept: 'CSE', domain: 'AI/ML', papers: 14, citations: 280, x: 180, y: 130, r: 24, color: '#6366f1' },
      { id: 3, name: 'Dr. Priya Kulkarni', dept: 'ECE', domain: 'IoT & Edge', papers: 12, citations: 190, x: 580, y: 140, r: 22, color: '#06b6d4' },
      { id: 4, name: 'Dr. Suresh Verma', dept: 'IT', domain: 'Cybersecurity', papers: 15, citations: 240, x: 170, y: 350, r: 23, color: '#8b5cf6' },
      { id: 5, name: 'Dr. Sneha Reddy', dept: 'CSE', domain: 'Data Science', papers: 11, citations: 160, x: 440, y: 370, r: 22, color: '#ec4899' },
      { id: 6, name: 'Dr. Anand Kumar', dept: 'MECH', domain: 'Robotics', papers: 9, citations: 120, x: 670, y: 300, r: 20, color: '#10b981' },
      { id: 7, name: 'Dr. Kavita Nair', dept: 'ECE', domain: 'VLSI', papers: 10, citations: 140, x: 70, y: 230, r: 20, color: '#f59e0b' }
    ]);
  };

  // Canvas Renderer with Crisp DPI, Drag & Drop, and Clean Non-Overlapping Badges
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    
    // Set actual size in memory
    const width = rect.width || 760;
    const height = 480;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const roundRect = (ctx, x, y, w, h, r) => {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y + x + w, y, r); // safety
      ctx.closePath();
    };

    const drawCardPill = (ctx, x, y, w, h, r) => {
      ctx.beginPath();
      ctx.roundRect ? ctx.roundRect(x, y, w, h, r) : roundRect(ctx, x, y, w, h, r);
    };

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // 1. Subtle Dot Grid Background
      ctx.fillStyle = '#e2e8f0';
      const step = 32;
      for (let x = 16; x < width; x += step) {
        for (let y = 16; y < height; y += step) {
          ctx.beginPath();
          ctx.arc(x, y, 1.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // 2. Draw Links
      links.forEach(link => {
        const src = nodes.find(n => n.id === link.source);
        const tgt = nodes.find(n => n.id === link.target);
        if (!src || !tgt) return;

        const isHighlight = selectedNode && (selectedNode.id === src.id || selectedNode.id === tgt.id);
        const isHovered = hoveredNode && (hoveredNode.id === src.id || hoveredNode.id === tgt.id);

        // Draw Line
        ctx.beginPath();
        ctx.moveTo(src.x, src.y);
        ctx.lineTo(tgt.x, tgt.y);

        if (isHighlight || isHovered) {
          ctx.strokeStyle = '#4f46e5';
          ctx.lineWidth = 3.5;
        } else {
          ctx.strokeStyle = '#cbd5e1';
          ctx.lineWidth = Math.max(2, link.weight * 0.7);
        }
        ctx.stroke();

        // 3. Draw Clean Badge for Link Publication Count (with white pill backdrop)
        const midX = (src.x + tgt.x) / 2;
        const midY = (src.y + tgt.y) / 2;
        const badgeText = `${link.weight} papers`;
        
        ctx.font = 'bold 10px Inter, system-ui, sans-serif';
        const textWidth = ctx.measureText(badgeText).width;
        const pillW = textWidth + 16;
        const pillH = 20;

        ctx.save();
        ctx.shadowColor = 'rgba(0, 0, 0, 0.08)';
        ctx.shadowBlur = 6;
        ctx.shadowOffsetY = 2;

        drawCardPill(ctx, midX - pillW / 2, midY - pillH / 2, pillW, pillH, 10);
        ctx.fillStyle = isHighlight ? '#4f46e5' : '#ffffff';
        ctx.fill();
        ctx.strokeStyle = isHighlight ? '#4338ca' : '#e2e8f0';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();

        ctx.fillStyle = isHighlight ? '#ffffff' : '#475569';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(badgeText, midX, midY);
      });

      // 4. Draw Nodes & Cards
      nodes.forEach(node => {
        const isSelected = selectedNode && selectedNode.id === node.id;
        const isHovered = hoveredNode && hoveredNode.id === node.id;
        const isMatchSearch = searchQuery === '' || node.name.toLowerCase().includes(searchQuery.toLowerCase());
        const isMatchDomain = selectedDomain === 'ALL' || node.domain === selectedDomain;
        const isDimmed = !isMatchSearch || !isMatchDomain;

        ctx.save();
        ctx.globalAlpha = isDimmed ? 0.2 : 1.0;

        // Glowing outer halo for selected/hovered node
        if (isSelected || isHovered) {
          ctx.beginPath();
          ctx.arc(node.x, node.y, node.r + 8, 0, Math.PI * 2);
          ctx.fillStyle = isSelected ? 'rgba(79, 70, 229, 0.22)' : 'rgba(99, 102, 241, 0.15)';
          ctx.fill();
        }

        // Drop shadow for circles
        ctx.shadowColor = 'rgba(15, 23, 42, 0.18)';
        ctx.shadowBlur = isSelected ? 12 : 6;
        ctx.shadowOffsetY = 3;

        // Main Node Circle
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.r, 0, Math.PI * 2);
        ctx.fillStyle = node.color;
        ctx.fill();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = isSelected ? 3.5 : 2.5;
        ctx.stroke();
        ctx.restore();

        // Node Initials inside Circle
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.font = `bold ${Math.round(node.r * 0.68)}px Inter, system-ui, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const cleanName = node.name.replace('Dr. ', '');
        const initials = cleanName.split(' ').map(p => p[0]).join('').slice(0, 2);
        ctx.fillText(initials, node.x, node.y + 1);
        ctx.restore();

        // 5. Clean Label Card (Rounded Card underneath Node)
        const nameText = cleanName;
        const subText = `${node.dept} • ${node.domain}`;

        ctx.save();
        ctx.font = isSelected ? 'bold 11.5px Inter, system-ui, sans-serif' : '600 11px Inter, system-ui, sans-serif';
        const nameW = ctx.measureText(nameText).width;
        ctx.font = '500 9.5px Inter, system-ui, sans-serif';
        const subW = ctx.measureText(subText).width;

        const cardW = Math.max(nameW, subW) + 20;
        const cardH = 36;
        const cardX = node.x - cardW / 2;
        const cardY = node.y + node.r + 8;

        // Card Shadow & Pill
        ctx.shadowColor = 'rgba(0, 0, 0, 0.08)';
        ctx.shadowBlur = 8;
        ctx.shadowOffsetY = 2;

        drawCardPill(ctx, cardX, cardY, cardW, cardH, 8);
        ctx.fillStyle = isSelected ? '#1e1b4b' : '#ffffff';
        ctx.fill();

        ctx.strokeStyle = isSelected ? '#6366f1' : '#e2e8f0';
        ctx.lineWidth = isSelected ? 1.5 : 1;
        ctx.stroke();
        ctx.restore();

        // Card Name
        ctx.save();
        ctx.fillStyle = isSelected ? '#ffffff' : '#0f172a';
        ctx.font = isSelected ? 'bold 11.5px Inter, system-ui, sans-serif' : '600 11px Inter, system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(nameText, node.x, cardY + 15);

        // Card Dept / Domain
        ctx.fillStyle = isSelected ? '#a5b4fc' : '#64748b';
        ctx.font = '500 9.5px Inter, system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(subText, node.x, cardY + 28);
        ctx.restore();
      });
    };

    render();
  }, [nodes, links, selectedNode, hoveredNode, searchQuery, selectedDomain]);

  // Mouse Interactivity: Drag & Drop + Click
  const getCanvasCoords = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const handleMouseDown = (e) => {
    const { x, y } = getCanvasCoords(e);
    const clicked = nodes.find(n => {
      const dist = Math.sqrt((n.x - x) ** 2 + (n.y - y) ** 2);
      return dist <= n.r + 14;
    });

    if (clicked) {
      draggingNodeRef.current = clicked;
      dragOffsetRef.current = { x: clicked.x - x, y: clicked.y - y };
      setSelectedNode(clicked);
    }
  };

  const handleMouseMove = (e) => {
    const { x, y } = getCanvasCoords(e);

    if (draggingNodeRef.current) {
      const draggedId = draggingNodeRef.current.id;
      const newX = Math.max(40, Math.min(740, x + dragOffsetRef.current.x));
      const newY = Math.max(40, Math.min(440, y + dragOffsetRef.current.y));

      setNodes(prev => prev.map(n => n.id === draggedId ? { ...n, x: newX, y: newY } : n));
    } else {
      const hovered = nodes.find(n => {
        const dist = Math.sqrt((n.x - x) ** 2 + (n.y - y) ** 2);
        return dist <= n.r + 10;
      });
      setHoveredNode(hovered || null);
    }
  };

  const handleMouseUp = () => {
    draggingNodeRef.current = null;
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
            Interactive, draggable network graph mapping institutional co-authorships, inter-departmental research clusters, and joint grant collaborations.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={resetLayout}
            className="px-3.5 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-xl text-xs font-semibold text-white border border-white/20 flex items-center space-x-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw size={14} />
            <span>Reset Layout</span>
          </button>
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

          {/* Interactive Draggable Canvas */}
          <div className="relative flex-1 min-h-[480px] bg-slate-50/70 dark:bg-slate-950 rounded-xl overflow-hidden border border-gray-200/80 dark:border-slate-800 flex items-center justify-center">
            <canvas
              ref={canvasRef}
              style={{ width: '100%', height: '480px' }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              className={`w-full h-[480px] ${draggingNodeRef.current ? 'cursor-grabbing' : 'cursor-grab'}`}
            />
            <div className="absolute bottom-3 left-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-3 py-1.5 rounded-lg text-[11px] text-gray-600 dark:text-slate-400 border border-gray-200 dark:border-slate-800 shadow-sm flex items-center space-x-2">
              <Sparkles size={13} className="text-indigo-600" />
              <span>Drag any circle to move freely &bull; Click node to inspect details</span>
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
                  {selectedNode.name.replace('Dr. ', '').split(' ').map(p => p[0]).join('').slice(0, 2)}
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

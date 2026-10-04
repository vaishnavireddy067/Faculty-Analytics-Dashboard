import React, { useState, useEffect } from 'react';
import { Sparkles, Send, TrendingUp, Lightbulb, Target, FileText, CheckCircle, Save, Calculator, AlertCircle, ArrowUpRight } from 'lucide-react';
import api from '../services/api';

const AICopilot = () => {
  const [prediction, setPrediction] = useState(null);
  const [trends, setTrends] = useState([]);
  const [copilotInput, setCopilotInput] = useState('');
  const [copilotResponse, setCopilotResponse] = useState(null);
  const [loadingPrediction, setLoadingPrediction] = useState(true);
  const [loadingCopilot, setLoadingCopilot] = useState(false);

  const [activeTab, setActiveTab] = useState('assistant'); // 'assistant', 'grant', 'minutes', 'predictor'
  
  // Planned Activities for API & Gap Prediction
  const [planForm, setPlanForm] = useState({
    sci_pubs: 1,
    scopus_pubs: 2,
    patents: 1,
    grant_lakhs: 4,
    consultancy_lakhs: 2,
    fdp_days: 5
  });

  // Grant Generator State
  const [grantForm, setGrantForm] = useState({ title: '', abstract: '', agency: 'AICTE' });
  const [generatingGrant, setGeneratingGrant] = useState(false);
  const [generatedProposal, setGeneratedProposal] = useState(null);

  // Meeting Minutes State
  const [meetingInput, setMeetingInput] = useState('');
  const [generatingMinutes, setGeneratingMinutes] = useState(false);
  const [generatedMinutes, setGeneratedMinutes] = useState(null);

  useEffect(() => {
    const fetchAIData = async () => {
      try {
        const [predRes, trendsRes] = await Promise.all([
          api.post('/faculty/ai/predict/'),
          api.get('/faculty/ai/trends/')
        ]);
        setPrediction(predRes.data);
        setTrends(trendsRes.data.trends);
      } catch (error) {
        console.error("Error fetching AI data", error);
      } finally {
        setLoadingPrediction(false);
      }
    };
    fetchAIData();
  }, []);

  const handleCopilotSubmit = async (e) => {
    e.preventDefault();
    if (!copilotInput.trim()) return;
    setLoadingCopilot(true);
    try {
      const res = await api.post('/faculty/ai/copilot/', { topic: copilotInput });
      setCopilotResponse(res.data);
    } catch (error) {
      console.error("Error with copilot", error);
    } finally {
      setLoadingCopilot(false);
    }
  };

  const handleGrantGenerate = (e) => {
    e.preventDefault();
    if (!grantForm.title || !grantForm.abstract) return;
    setGeneratingGrant(true);
    setGeneratedProposal(null);
    
    // Simulate AI Generation
    setTimeout(() => {
      setGeneratingGrant(false);
      setGeneratedProposal(`
# Grant Proposal: ${grantForm.title}
**Funding Agency:** ${grantForm.agency}

## 1. Executive Summary
This project aims to address critical gaps in ${grantForm.title.toLowerCase()} by leveraging advanced methodologies. The proposed research will significantly impact the field by providing scalable solutions.

## 2. Objectives
- To design and develop a novel framework for ${grantForm.title.toLowerCase()}.
- To evaluate the performance metrics against existing baseline models.
- To deploy a real-time prototype suitable for industry adoption.

## 3. Methodology
The research will employ a mixed-methods approach. Initial phases will involve extensive data collection followed by the application of machine learning algorithms to identify core patterns.

## 4. Budget Justification
- **Equipment & Infrastructure:** ₹ 4,50,000
- **Consumables:** ₹ 1,20,000
- **Travel & Contingency:** ₹ 80,000
**Total Requested Budget:** ₹ 6,50,000
      `);
    }, 3500);
  };

  const handleMinutesGenerate = async (e) => {
    e.preventDefault();
    if (!meetingInput.trim()) return;
    setGeneratingMinutes(true);
    setGeneratedMinutes(null);
    try {
        const res = await api.post('/faculty/ai/voice-parse/', { text: meetingInput });
        setGeneratedMinutes(res.data);
    } catch (error) {
        console.error("Error generating minutes", error);
    } finally {
        setGeneratingMinutes(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-3 bg-indigo-100 rounded-xl text-indigo-600">
          <Sparkles size={28} />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">AI Co-Pilot</h1>
          <p className="text-gray-500">Your intelligent research and performance assistant.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Copilot & Generator */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 p-6 flex flex-col h-[700px] transition-colors">
          <div className="flex border-b border-gray-100 dark:border-slate-800 mb-4 overflow-x-auto whitespace-nowrap">
            <button 
              onClick={() => setActiveTab('assistant')}
              className={`pb-3 px-4 font-semibold text-sm flex items-center transition-colors ${activeTab === 'assistant' ? 'border-b-2 border-indigo-600 text-indigo-700 dark:text-indigo-400' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
            >
              <Lightbulb className="mr-2" size={18} /> Research Assistant
            </button>
            <button 
              onClick={() => setActiveTab('grant')}
              className={`pb-3 px-4 font-semibold text-sm flex items-center transition-colors ${activeTab === 'grant' ? 'border-b-2 border-indigo-600 text-indigo-700 dark:text-indigo-400' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
            >
              <FileText className="mr-2" size={18} /> Grant Generator ✨
            </button>
            <button 
              onClick={() => setActiveTab('minutes')}
              className={`pb-3 px-4 font-semibold text-sm flex items-center transition-colors ${activeTab === 'minutes' ? 'border-b-2 border-indigo-600 text-indigo-700 dark:text-indigo-400' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
            >
              <CheckCircle className="mr-2" size={18} /> Meeting Minutes
            </button>
            <button 
              onClick={() => setActiveTab('predictor')}
              className={`pb-3 px-4 font-semibold text-sm flex items-center transition-colors ${activeTab === 'predictor' ? 'border-b-2 border-indigo-600 text-indigo-700 dark:text-indigo-400' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
            >
              <Target className="mr-2" size={18} /> API & Gap Predictor ✨
            </button>
          </div>
          
          {activeTab === 'assistant' ? (
            <>
              <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-slate-950 rounded-xl p-4 mb-4 border border-gray-100 dark:border-slate-800 space-y-4">
                <div className="flex space-x-3">
              <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white flex-shrink-0">
                <Sparkles size={16} />
              </div>
              <div className="bg-white p-3 rounded-2xl rounded-tl-none shadow-sm text-sm text-gray-700 border border-gray-100">
                Hello! I can help you find suitable journals, identify research gaps, or discover funding opportunities. What is your research topic?
              </div>
            </div>

            {copilotResponse && (
              <>
                <div className="flex space-x-3 justify-end">
                  <div className="bg-indigo-600 text-white p-3 rounded-2xl rounded-tr-none shadow-sm text-sm">
                    {copilotResponse.topic}
                  </div>
                </div>
                <div className="flex space-x-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white flex-shrink-0">
                    <Sparkles size={16} />
                  </div>
                  <div className="bg-white p-4 rounded-2xl rounded-tl-none shadow-sm text-sm text-gray-700 border border-gray-100 space-y-3 w-full max-w-lg">
                    <div>
                      <strong className="text-indigo-700 block mb-1">Research Gap Analysis:</strong>
                      <ul className="list-disc pl-5 space-y-1">
                        {copilotResponse.gap_analysis && copilotResponse.gap_analysis.map((g, i) => <li key={i}>{g}</li>)}
                      </ul>
                    </div>
                    <div>
                      <strong className="text-indigo-700 block mb-1">AI Research Roadmap:</strong>
                      <ul className="list-disc pl-5 space-y-1">
                        {copilotResponse.research_roadmap && copilotResponse.research_roadmap.map((r, i) => (
                            <li key={i}><strong>{r.phase}:</strong> {r.action}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <strong className="text-indigo-700 block mb-1">Recommended Journals:</strong>
                      <ul className="list-disc pl-5 space-y-1">
                        {copilotResponse.journal_recommendations && copilotResponse.journal_recommendations.map((j, i) => (
                            <li key={i}>{j.name} (IF: {j.impact_factor})</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </>
            )}
            
            {loadingCopilot && (
              <div className="flex items-center space-x-2 text-gray-400">
                <Sparkles className="animate-spin" size={16} />
                <span className="text-sm">Analyzing vast research databases...</span>
              </div>
            )}
          </div>

          <form onSubmit={handleCopilotSubmit} className="relative">
            <input
              type="text"
              value={copilotInput}
              onChange={(e) => setCopilotInput(e.target.value)}
              placeholder="E.g., AI in Healthcare..."
              className="w-full py-3 pl-4 pr-12 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all shadow-sm"
            />
            <button
              type="submit"
              disabled={loadingCopilot}
              className="absolute right-2 top-2 p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              <Send size={18} />
            </button>
          </form>
            </>
          ) : activeTab === 'grant' ? (
            <div className="flex-1 flex flex-col overflow-hidden">
              {!generatedProposal ? (
                <form onSubmit={handleGrantGenerate} className="space-y-4 flex-1 overflow-y-auto pr-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Project Title</label>
                    <input 
                      type="text" 
                      required
                      value={grantForm.title}
                      onChange={(e) => setGrantForm({...grantForm, title: e.target.value})}
                      className="w-full p-3 border border-gray-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                      placeholder="Enter your proposed research title"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Funding Agency</label>
                    <select 
                      value={grantForm.agency}
                      onChange={(e) => setGrantForm({...grantForm, agency: e.target.value})}
                      className="w-full p-3 border border-gray-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                      <option>AICTE</option>
                      <option>DST (Department of Science & Technology)</option>
                      <option>UGC</option>
                      <option>SERB</option>
                      <option>CSIR</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Brief Abstract / Core Idea</label>
                    <textarea 
                      required
                      value={grantForm.abstract}
                      onChange={(e) => setGrantForm({...grantForm, abstract: e.target.value})}
                      className="w-full p-3 border border-gray-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl h-32 resize-none focus:ring-2 focus:ring-indigo-500 outline-none"
                      placeholder="Briefly describe the problem statement and your proposed solution..."
                    ></textarea>
                  </div>
                  
                  <button 
                    type="submit" 
                    disabled={generatingGrant}
                    className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-bold transition-all shadow-md flex justify-center items-center gap-2 disabled:opacity-70"
                  >
                    {generatingGrant ? (
                      <><Sparkles className="animate-spin" size={20} /> AI is writing your proposal...</>
                    ) : (
                      <><Sparkles size={20} /> Generate Grant Proposal</>
                    )}
                  </button>
                </form>
              ) : (
                <div className="flex-1 flex flex-col h-full">
                  <div className="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 p-3 rounded-lg mb-4 flex items-center font-medium border border-emerald-100 dark:border-emerald-800/50">
                    <CheckCircle className="mr-2" size={18} /> Proposal generated successfully!
                  </div>
                  <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-slate-950 p-6 rounded-xl border border-gray-100 dark:border-slate-800 font-mono text-sm whitespace-pre-wrap dark:text-gray-300 shadow-inner">
                    {generatedProposal}
                  </div>
                  <div className="mt-4 flex gap-3">
                    <button className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors flex justify-center items-center gap-2">
                      <Save size={18} /> Export as PDF
                    </button>
                    <button 
                      onClick={() => setGeneratedProposal(null)}
                      className="flex-1 py-3 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium transition-colors"
                    >
                      Write Another
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : activeTab === 'minutes' ? (
            <div className="flex-1 flex flex-col overflow-hidden">
               <form onSubmit={handleMinutesGenerate} className="space-y-4 flex-1 overflow-y-auto pr-2">
                 <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Meeting Transcript or Audio Summary</label>
                    <textarea 
                      required
                      value={meetingInput}
                      onChange={(e) => setMeetingInput(e.target.value)}
                      className="w-full p-3 border border-gray-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl h-48 resize-none focus:ring-2 focus:ring-indigo-500 outline-none"
                      placeholder="Paste your meeting transcript here, or type raw notes to generate formal minutes and action items..."
                    ></textarea>
                 </div>
                 <button 
                    type="submit" 
                    disabled={generatingMinutes}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-md flex justify-center items-center gap-2 disabled:opacity-70"
                  >
                    {generatingMinutes ? (
                      <><Sparkles className="animate-spin" size={20} /> Generating Minutes...</>
                    ) : (
                      <><Sparkles size={20} /> Generate Meeting Minutes</>
                    )}
                  </button>
                  
                  {generatedMinutes && (
                      <div className="mt-4 bg-gray-50 dark:bg-slate-950 p-4 rounded-xl border border-gray-100 dark:border-slate-800 space-y-4">
                          <div>
                              <h4 className="font-bold text-gray-900 dark:text-white mb-2">Meeting Minutes</h4>
                              <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{generatedMinutes.minutes}</p>
                          </div>
                          <div>
                              <h4 className="font-bold text-gray-900 dark:text-white mb-2">Action Items</h4>
                              <ul className="list-disc pl-5 text-sm text-gray-700 dark:text-gray-300 space-y-1">
                                  {generatedMinutes.action_items.map((item, idx) => (
                                      <li key={idx}>{item}</li>
                                  ))}
                              </ul>
                          </div>
                          <div className="bg-emerald-50 text-emerald-800 p-2 rounded text-sm font-medium border border-emerald-100">
                              Sentiment: {generatedMinutes.sentiment}
                          </div>
                      </div>
                  )}
               </form>
             </div>
          ) : activeTab === 'predictor' ? (
            <div className="flex-1 flex flex-col overflow-y-auto space-y-6 pr-2">
              <div className="bg-indigo-50/60 dark:bg-indigo-950/30 p-4 rounded-xl border border-indigo-100 dark:border-indigo-900/50">
                <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 text-base">
                  <Calculator size={18} className="text-indigo-600" /> Planned Activity Simulator & API Score Prediction
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  Simulate your target academic achievements to forecast next year's API score, PBAS points, and uncover NAAC/NBA accreditation gaps.
                </p>
              </div>

              {/* Input Form for Planned Activities */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">SCI Journals (30 pts each)</label>
                  <input 
                    type="number" 
                    min="0"
                    value={planForm.sci_pubs}
                    onChange={(e) => setPlanForm({ ...planForm, sci_pubs: parseInt(e.target.value) || 0 })}
                    className="w-full p-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm font-bold text-gray-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Scopus Journals (20 pts each)</label>
                  <input 
                    type="number" 
                    min="0"
                    value={planForm.scopus_pubs}
                    onChange={(e) => setPlanForm({ ...planForm, scopus_pubs: parseInt(e.target.value) || 0 })}
                    className="w-full p-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm font-bold text-gray-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Patents Filed/Granted (25 pts)</label>
                  <input 
                    type="number" 
                    min="0"
                    value={planForm.patents}
                    onChange={(e) => setPlanForm({ ...planForm, patents: parseInt(e.target.value) || 0 })}
                    className="w-full p-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm font-bold text-gray-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Research Grants (₹ Lakhs, 5 pts/Lakh)</label>
                  <input 
                    type="number" 
                    min="0"
                    value={planForm.grant_lakhs}
                    onChange={(e) => setPlanForm({ ...planForm, grant_lakhs: parseInt(e.target.value) || 0 })}
                    className="w-full p-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm font-bold text-gray-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Consultancy (₹ Lakhs, 5 pts/Lakh)</label>
                  <input 
                    type="number" 
                    min="0"
                    value={planForm.consultancy_lakhs}
                    onChange={(e) => setPlanForm({ ...planForm, consultancy_lakhs: parseInt(e.target.value) || 0 })}
                    className="w-full p-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm font-bold text-gray-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">FDP / STTP Days</label>
                  <input 
                    type="number" 
                    min="0"
                    value={planForm.fdp_days}
                    onChange={(e) => setPlanForm({ ...planForm, fdp_days: parseInt(e.target.value) || 0 })}
                    className="w-full p-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm font-bold text-gray-800 dark:text-white"
                  />
                </div>
              </div>

              {/* Prediction Result Summary */}
              <div className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl p-5 flex flex-col sm:flex-row justify-between items-center gap-4">
                <div>
                  <span className="text-xs uppercase font-bold text-emerald-100">Forecasted Academic API Score</span>
                  <div className="text-3xl font-extrabold mt-1">
                    {(planForm.sci_pubs * 30) + (planForm.scopus_pubs * 20) + (planForm.patents * 25) + (planForm.grant_lakhs * 5) + (planForm.consultancy_lakhs * 5) + (planForm.fdp_days >= 5 ? 10 : 5)} Points
                  </div>
                  <p className="text-xs text-emerald-100 mt-1">
                    Qualifies for UGC Career Advancement Scheme (CAS) Level 12 → Level 13A
                  </p>
                </div>
                <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl text-right">
                  <span className="text-xs block text-emerald-100 font-semibold">Annual Forecast</span>
                  <strong className="text-lg font-bold">+{(planForm.sci_pubs * 30) + (planForm.scopus_pubs * 20) + (planForm.patents * 25) + (planForm.grant_lakhs * 5)} Boost</strong>
                </div>
              </div>

              {/* NAAC & NBA Accreditation Gap Identification */}
              <div>
                <h4 className="font-bold text-gray-800 dark:text-white text-sm mb-3 flex items-center gap-1.5">
                  <AlertCircle size={16} className="text-indigo-600" />
                  Accreditation Gap Identification & Actionable Recommendations
                </h4>
                <div className="space-y-3">
                  <div className={`p-4 rounded-xl border ${planForm.sci_pubs + planForm.scopus_pubs >= 2 ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900' : 'bg-amber-50/60 border-amber-200 text-amber-900'}`}>
                    <div className="flex justify-between items-center font-bold text-xs mb-1">
                      <span>NAAC Criterion 3.4.2 — Research Papers in UGC-CARE / Scopus / WoS</span>
                      <span className={`px-2 py-0.5 rounded text-[11px] ${planForm.sci_pubs + planForm.scopus_pubs >= 2 ? 'bg-emerald-200 text-emerald-800' : 'bg-amber-200 text-amber-800'}`}>
                        {planForm.sci_pubs + planForm.scopus_pubs >= 2 ? 'Target Met ✅' : 'Gap Identified ⚠️'}
                      </span>
                    </div>
                    <p className="text-xs opacity-90">
                      {planForm.sci_pubs + planForm.scopus_pubs >= 2 
                        ? 'Planned publications satisfy the benchmark of ≥ 2 indexed papers per faculty per year.'
                        : 'Current plan is below target. Action: Co-author 1 additional Scopus or SCI paper before March to prevent Criterion 3 score deduction.'}
                    </p>
                  </div>

                  <div className={`p-4 rounded-xl border ${planForm.grant_lakhs >= 3 ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900' : 'bg-amber-50/60 border-amber-200 text-amber-900'}`}>
                    <div className="flex justify-between items-center font-bold text-xs mb-1">
                      <span>NAAC Criterion 3.1.1 & NBA Criterion 5.4 — Extramural Research Grants</span>
                      <span className={`px-2 py-0.5 rounded text-[11px] ${planForm.grant_lakhs >= 3 ? 'bg-emerald-200 text-emerald-800' : 'bg-amber-200 text-amber-800'}`}>
                        {planForm.grant_lakhs >= 3 ? 'Target Met ✅' : 'Gap Identified ⚠️'}
                      </span>
                    </div>
                    <p className="text-xs opacity-90">
                      {planForm.grant_lakhs >= 3 
                        ? 'Projected funding of ₹' + planForm.grant_lakhs + ' Lakhs exceeds NBA Tier-1 research funding criteria.'
                        : 'Department research budget requires minimum ₹3 Lakhs/faculty. Action: Submit proposals to AICTE Research Promotion Scheme (RPS) or DST-SERB.'}
                    </p>
                  </div>

                  <div className={`p-4 rounded-xl border ${planForm.patents >= 1 ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900' : 'bg-amber-50/60 border-amber-200 text-amber-900'}`}>
                    <div className="flex justify-between items-center font-bold text-xs mb-1">
                      <span>NBA Criterion 5.4 — Intellectual Property Rights & Patents</span>
                      <span className={`px-2 py-0.5 rounded text-[11px] ${planForm.patents >= 1 ? 'bg-emerald-200 text-emerald-800' : 'bg-amber-200 text-amber-800'}`}>
                        {planForm.patents >= 1 ? 'Target Met ✅' : 'Gap Identified ⚠️'}
                      </span>
                    </div>
                    <p className="text-xs opacity-90">
                      {planForm.patents >= 1 
                        ? 'Patent filing planned. Ensure publication in the Indian Patent Office (IPO) Journal.'
                        : 'Zero patents planned. Action: Convert final-year student project or lab prototype into a published utility patent.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* Right Column: Prediction & Trends */}
        <div className="space-y-6">
          {/* Performance Prediction Widget */}
          <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl shadow-lg p-6 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white opacity-10 rounded-full blur-xl"></div>
            <h2 className="text-lg font-semibold mb-2 flex items-center relative z-10">
              <Target className="mr-2" size={20} /> Performance Prediction
            </h2>
            
            {loadingPrediction ? (
              <div className="animate-pulse space-y-3 mt-4">
                <div className="h-10 bg-white/20 rounded w-1/3"></div>
                <div className="h-16 bg-white/20 rounded w-full"></div>
              </div>
            ) : prediction ? (
              <div className="relative z-10 mt-4">
                <p className="text-indigo-100 text-sm mb-1">Next Year Expected Score</p>
                <div className="text-4xl font-bold mb-4">{prediction.expected_next_year_score}/100</div>
                <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3 text-sm">
                  <strong>AI Suggestion:</strong> {prediction.suggestion}
                </div>
              </div>
            ) : null}
          </div>

          {/* Research Trends */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <TrendingUp className="mr-2 text-indigo-500" size={20} /> Trending Topics 2026
            </h2>
            <div className="space-y-4">
              {trends.map((trend, idx) => (
                <div key={idx} className="border-b border-gray-50 pb-3 last:border-0 last:pb-0">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-medium text-gray-800">{trend.topic}</span>
                    <div className="flex text-yellow-400">
                      {[...Array(trend.rating)].map((_, i) => (
                        <Sparkles key={i} size={14} fill="currentColor" />
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">{trend.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AICopilot;

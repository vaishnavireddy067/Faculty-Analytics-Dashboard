import React, { useState, useEffect } from 'react';
import { DollarSign, FileText, Send, Clock, Calendar, CheckCircle, Sparkles } from 'lucide-react';
import api from '../services/api';

const GrantMatcher = () => {
  const [grants, setGrants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [draftingId, setDraftingId] = useState(null);
  const [proposals, setProposals] = useState({});

  useEffect(() => {
    const fetchGrants = async () => {
      try {
        const res = await api.get('/faculty/funding-finder/');
        setGrants(res.data.opportunities || []);
      } catch (err) {
        console.error("Failed to fetch grants", err);
      } finally {
        setLoading(false);
      }
    };
    fetchGrants();
  }, []);

  const handleDraftProposal = async (grant) => {
    setDraftingId(grant.agency);
    try {
      const res = await api.post('/faculty/ai/generate-proposal/', { topic: grant.agency });
      setProposals(prev => ({ ...prev, [grant.agency]: res.data }));
    } catch (err) {
      console.error("Failed to draft proposal", err);
    } finally {
      setDraftingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">AI Grant Matcher</h1>
          <p className="text-gray-500">Discover funding opportunities matching your research profile and auto-draft proposals.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Matched Opportunities</h2>
          {grants.map((grant, idx) => (
            <div key={idx} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{grant.agency}</h3>
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                    <span className="flex items-center gap-1 text-emerald-600 font-semibold bg-emerald-50 px-2 py-1 rounded">
                      <DollarSign size={16} /> {grant.amount}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar size={16} /> {grant.deadline}
                    </span>
                  </div>
                </div>
                <div className="bg-indigo-50 text-indigo-700 font-bold px-3 py-1 rounded-full text-sm flex items-center gap-1">
                  <Sparkles size={14} /> AI Match
                </div>
              </div>
              
              <button 
                onClick={() => handleDraftProposal(grant)}
                disabled={draftingId === grant.agency || proposals[grant.agency]}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                {draftingId === grant.agency ? (
                  <><Clock size={18} className="animate-spin" /> Drafting Proposal...</>
                ) : proposals[grant.agency] ? (
                  <><CheckCircle size={18} className="text-emerald-400" /> Proposal Drafted</>
                ) : (
                  <><FileText size={18} /> Draft Preliminary Proposal</>
                )}
              </button>
            </div>
          ))}
          {grants.length === 0 && (
            <div className="bg-white p-8 rounded-2xl text-center border border-gray-100">
              <p className="text-gray-500">No matched grants found at this moment.</p>
            </div>
          )}
        </div>

        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Proposal Workspace</h2>
          {Object.keys(proposals).length === 0 ? (
            <div className="bg-gray-50 p-8 rounded-2xl text-center border border-gray-200 border-dashed h-[calc(100%-3rem)] flex flex-col items-center justify-center">
              <Sparkles className="h-12 w-12 text-gray-300 mb-4" />
              <p className="text-gray-500">Click "Draft Preliminary Proposal" to generate an AI-assisted project draft here.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(proposals).map(([agency, proposal]) => (
                <div key={agency} className="bg-white p-6 rounded-2xl shadow-sm border border-indigo-100">
                  <div className="flex items-center justify-between mb-4 border-b pb-4">
                    <h3 className="font-bold text-indigo-900">Draft for {agency}</h3>
                    <button className="text-sm flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-medium">
                      <Send size={16} /> Export to Word
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-1">Abstract</h4>
                      <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 p-3 rounded-lg">{proposal.abstract || "AI generated abstract placeholder."}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-1">Methodology</h4>
                      <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 p-3 rounded-lg">{proposal.methodology || "AI generated methodology placeholder."}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GrantMatcher;

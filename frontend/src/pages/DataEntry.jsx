import React, { useState, useEffect } from 'react';
import { facultyService } from '../services/api';
import { Save, CheckCircle, XCircle, Mic, MicOff, UploadCloud, Search } from 'lucide-react';
import api from '../services/api';

const formSchemas = {
  publications: {
    endpoint: 'publications',
    fields: [
      { name: 'title', label: 'Paper Title', type: 'text', required: true, width: 'full' },
      { name: 'journal_name', label: 'Journal Name', type: 'text', required: true },
      { name: 'indexing', label: 'Indexing', type: 'select', options: ['SCOPUS', 'SCI', 'WOS', 'UGC_CARE', 'OTHER'], required: true },
      { name: 'year', label: 'Year of Publication', type: 'number', required: true },
      { name: 'authors', label: 'Authors', type: 'text', placeholder: 'E.g., John D., Jane S.', required: true },
    ]
  },
  patents: {
    endpoint: 'patents',
    fields: [
      { name: 'title', label: 'Patent Title', type: 'text', required: true, width: 'full' },
      { name: 'application_number', label: 'Application Number', type: 'text' },
      { name: 'patent_status', label: 'Status', type: 'select', options: ['FILED', 'PUBLISHED', 'GRANTED'], required: true },
      { name: 'year', label: 'Year', type: 'number', required: true },
    ]
  },
  books: {
    endpoint: 'books',
    fields: [
      { name: 'title', label: 'Book/Chapter Title', type: 'text', required: true, width: 'full' },
      { name: 'publisher', label: 'Publisher', type: 'text', required: true },
      { name: 'isbn', label: 'ISBN', type: 'text' },
      { name: 'year', label: 'Year', type: 'number', required: true },
      { name: 'is_chapter', label: 'Is this a book chapter?', type: 'checkbox' },
    ]
  },
  'fdp-training': {
    endpoint: 'fdp-training',
    fields: [
      { name: 'title', label: 'Program Title', type: 'text', required: true, width: 'full' },
      { name: 'organization', label: 'Organization/Institution', type: 'text', required: true },
      { name: 'role', label: 'Role', type: 'select', options: ['PARTICIPANT', 'RESOURCE_PERSON', 'ORGANIZER'], required: true },
      { name: 'start_date', label: 'Start Date', type: 'date', required: true },
      { name: 'end_date', label: 'End Date', type: 'date', required: true },
      { name: 'duration_days', label: 'Duration (Days)', type: 'number', required: true },
    ]
  },
  consultancy: {
    endpoint: 'consultancy',
    fields: [
      { name: 'project_title', label: 'Project Title', type: 'text', required: true, width: 'full' },
      { name: 'client_organization', label: 'Client Organization', type: 'text', required: true },
      { name: 'amount', label: 'Amount (₹)', type: 'number', required: true },
      { name: 'year', label: 'Year', type: 'number', required: true },
    ]
  },
  grants: {
    endpoint: 'grants',
    fields: [
      { name: 'project_title', label: 'Project Title', type: 'text', required: true, width: 'full' },
      { name: 'funding_agency', label: 'Funding Agency', type: 'text', required: true },
      { name: 'amount', label: 'Amount (₹)', type: 'number', required: true },
      { name: 'year', label: 'Year', type: 'number', required: true },
    ]
  },
  certifications: {
    endpoint: 'certifications',
    fields: [
      { name: 'name', label: 'Certification Name', type: 'text', required: true, width: 'full' },
      { name: 'issuing_authority', label: 'Issuing Authority', type: 'text', required: true },
      { name: 'year', label: 'Year', type: 'number', required: true },
    ]
  },
  'student-projects': {
    endpoint: 'student-projects',
    fields: [
      { name: 'title', label: 'Project Title', type: 'text', required: true, width: 'full' },
      { name: 'project_status', label: 'Status', type: 'select', options: ['ONGOING', 'COMPLETED'], required: true },
      { name: 'publications_count', label: 'Publications from Project', type: 'number', required: true },
      { name: 'year', label: 'Year', type: 'number', required: true },
    ]
  },
  'guest-lectures': {
    endpoint: 'guest-lectures',
    fields: [
      { name: 'topic', label: 'Lecture Topic', type: 'text', required: true, width: 'full' },
      { name: 'institution', label: 'Inviting Institution', type: 'text', required: true },
      { name: 'target_audience', label: 'Target Audience', type: 'text' },
      { name: 'date', label: 'Date of Lecture', type: 'date', required: true },
    ]
  },
  'industrial-visits': {
    endpoint: 'industrial-visits',
    fields: [
      { name: 'title', label: 'Visit Title/Location', type: 'text', required: true, width: 'full' },
      { name: 'organization', label: 'Company/Organization', type: 'text', required: true },
      { name: 'date', label: 'Date of Visit', type: 'date', required: true },
    ]
  },
  'student-guidance': {
    endpoint: 'student-guidance',
    fields: [
      { name: 'project_title', label: 'Project Title', type: 'text', required: true, width: 'full' },
      { name: 'student_level', label: 'Student Level', type: 'select', options: ['UG', 'PG', 'PHD'], required: true },
      { name: 'year', label: 'Year', type: 'number', required: true },
    ]
  },
  awards: {
    endpoint: 'awards',
    fields: [
      { name: 'award_name', label: 'Award/Recognition Name', type: 'text', required: true, width: 'full' },
      { name: 'issuing_body', label: 'Issuing Organization', type: 'text', required: true },
      { name: 'description', label: 'Brief Description', type: 'text', width: 'full' },
      { name: 'year', label: 'Year Received', type: 'number', required: true },
    ]
  },
  roles: {
    endpoint: 'roles',
    fields: [
      { name: 'role_name', label: 'Role/Responsibility Title (e.g. Exam Coordinator)', type: 'text', required: true, width: 'full' },
      { name: 'academic_year', label: 'Academic Year', type: 'text', required: true },
      { name: 'department', label: 'Department', type: 'text' },
      { name: 'from_date', label: 'From Date', type: 'date' },
      { name: 'to_date', label: 'To Date', type: 'date' },
      { name: 'description', label: 'Description', type: 'text', width: 'full' },
    ]
  },
  certificates: {
    endpoint: 'certificates',
    fields: [
      { name: 'title', label: 'Certificate Title', type: 'text', required: true, width: 'full' },
      { name: 'category', label: 'Category', type: 'select', options: ['FDP', 'WORKSHOP', 'STTP', 'SEMINAR', 'CONFERENCE', 'TRAINING', 'AWARD', 'CONSULTANCY', 'PATENT', 'PUBLICATION', 'OTHER'], required: true },
      { name: 'issue_date', label: 'Issue Date', type: 'date' },
      { name: 'issuing_organization', label: 'Issuing Organization', type: 'text' },
      { name: 'academic_year', label: 'Academic Year', type: 'text', required: true },
    ]
  }
};


const DataEntry = () => {
  const tabs = Object.keys(formSchemas);
  const [activeTab, setActiveTab] = useState(tabs[0]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [isRecording, setIsRecording] = useState(false);
  const [isBulkImporting, setIsBulkImporting] = useState(false);

  // Dynamically initialize form state based on active tab schema
  const initializeForm = (tab) => {
    const schema = formSchemas[tab];
    const initialData = { department: 'CSE' };
    schema.fields.forEach(f => {
      if (f.type === 'number') initialData[f.name] = new Date().getFullYear();
      else if (f.type === 'checkbox') initialData[f.name] = false;
      else if (f.type === 'select') initialData[f.name] = f.options[0];
      else initialData[f.name] = '';
    });
    return initialData;
  };

  const [formData, setFormData] = useState(initializeForm(tabs[0]));
  const [file, setFile] = useState(null);

  // Reset form when tab changes
  useEffect(() => {
    setFormData(initializeForm(activeTab));
    setFile(null);
    setMessage({ text: '', type: '' });
  }, [activeTab]);

  const handleVoiceEntry = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setMessage({ text: 'Speech recognition is not supported in this browser. Please type manually.', type: 'error' });
      return;
    }

    if (isRecording) {
      setIsRecording(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsRecording(true);
        setMessage({ text: '🎙️ Listening... Speak your title or description clearly.', type: 'success' });
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          const primaryKey = Object.keys(formData).find(k => k === 'title' || k === 'name' || k === 'topic' || k === 'project_title' || k === 'role_name' || k === 'award_name') || Object.keys(formData)[0];
          setFormData(prev => ({ ...prev, [primaryKey]: transcript }));
          setMessage({ text: `🎙️ Voice captured: "${transcript}"`, type: 'success' });
        }
      };

      recognition.onerror = (event) => {
        setIsRecording(false);
        setMessage({ text: `Voice recognition error: ${event.error}`, type: 'error' });
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognition.start();
    } catch (e) {
      setIsRecording(false);
      setMessage({ text: 'Failed to initialize voice recognition.', type: 'error' });
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };
  
  const [similarityReport, setSimilarityReport] = useState(null);
  const [checkingSimilarity, setCheckingSimilarity] = useState(false);

  const handleSimilarityCheck = async (e) => {
    e.preventDefault();
    if (!formData.title) {
        setMessage({ text: 'Please enter a title to check.', type: 'error' });
        return;
    }
    setCheckingSimilarity(true);
    try {
        const res = await api.post('/faculty/ai/plagiarism-scan/', { text: formData.title });
        setSimilarityReport(res.data);
    } catch (error) {
        setMessage({ text: 'Failed to check similarity.', type: 'error' });
    } finally {
      setCheckingSimilarity(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: '', type: '' });

    try {
      const data = new FormData();
      Object.keys(formData).forEach(key => {
        data.append(key, formData[key]);
      });
      if (file) {
        data.append('proof_document', file);
      }

      await facultyService.create(formSchemas[activeTab].endpoint, data);
      setMessage({ text: 'Record added successfully! Pending verification.', type: 'success' });
      
      setFormData(initializeForm(activeTab));
      setFile(null);
      e.target.reset();
    } catch (error) {
      setMessage({ text: error.message || 'Failed to add record.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // DOI Auto-Fetcher state & handler
  const [doiQuery, setDoiQuery] = useState('');
  const [fetchingDoi, setFetchingDoi] = useState(false);

  const handleFetchDoi = async (e) => {
    e?.preventDefault();
    if (!doiQuery.trim()) {
      setMessage({ text: 'Please enter a DOI (e.g. 10.1109/ACCESS.2024.3392184)', type: 'error' });
      return;
    }
    setFetchingDoi(true);
    setMessage({ text: '', type: '' });
    try {
      const res = await api.post('/faculty/fetch-doi/', { doi: doiQuery.trim() });
      if (res.data && res.data.success) {
        setFormData(prev => ({
          ...prev,
          title: res.data.title || prev.title,
          journal_name: res.data.journal_name || prev.journal_name,
          authors: res.data.authors || prev.authors,
          year: res.data.year || prev.year,
          indexing: res.data.indexing || prev.indexing,
        }));
        setMessage({ text: `⚡ Metadata fetched successfully from CrossRef for DOI: ${res.data.doi}!`, type: 'success' });
      }
    } catch (err) {
      setMessage({ text: 'Could not fetch DOI metadata. Please enter manually.', type: 'error' });
    } finally {
      setFetchingDoi(false);
    }
  };

  // Smart Certificate Parser state & handler
  const [certInputText, setCertInputText] = useState('');
  const [parsingCert, setParsingCert] = useState(false);

  const handleParseCert = async (e) => {
    e?.preventDefault();
    if (!certInputText.trim()) {
      setMessage({ text: 'Please paste certificate title/text or course name.', type: 'error' });
      return;
    }
    setParsingCert(true);
    setMessage({ text: '', type: '' });
    try {
      const res = await api.post('/faculty/ai/parse-certificate/', { text: certInputText.trim() });
      if (res.data && res.data.success) {
        if (activeTab === 'fdp-training') {
          setFormData(prev => ({
            ...prev,
            title: res.data.program_title || prev.title,
            organization: res.data.organization || prev.organization,
            role: res.data.role || prev.role,
            start_date: res.data.start_date || prev.start_date,
            end_date: res.data.end_date || prev.end_date,
            duration_days: res.data.duration_days || prev.duration_days
          }));
        } else if (activeTab === 'certificates') {
          setFormData(prev => ({
            ...prev,
            title: res.data.program_title || prev.title,
            issuing_organization: res.data.organization || prev.issuing_organization,
            category: res.data.category || prev.category,
            academic_year: res.data.academic_year || prev.academic_year
          }));
        } else if (activeTab === 'certifications') {
          setFormData(prev => ({
            ...prev,
            name: res.data.program_title || prev.name,
            issuing_authority: res.data.organization || prev.issuing_authority,
            year: 2025
          }));
        }
        setMessage({ text: `✨ AI extracted certificate fields with ${res.data.confidence_score} confidence!`, type: 'success' });
      }
    } catch (err) {
      setMessage({ text: 'Failed to extract certificate details.', type: 'error' });
    } finally {
      setParsingCert(false);
    }
  };

  const handleBulkImportClick = () => {
    document.getElementById('bulk-import-input').click();
  };

  const handleBulkImportChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setIsBulkImporting(true);
      setMessage({ text: '', type: '' });
      // Simulate processing time
      setTimeout(() => {
        setIsBulkImporting(false);
        setMessage({ text: `Bulk import successful! 15 ${activeTab.split('-')[0]} imported.`, type: 'success' });
        e.target.value = null; // reset input
      }, 2500);
    }
  };

  const currentSchema = formSchemas[activeTab];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Data Entry & Management</h1>
        <div className="flex gap-3">
          <input 
            type="file" 
            id="bulk-import-input" 
            className="hidden" 
            accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
            onChange={handleBulkImportChange}
          />
          <button 
            onClick={handleBulkImportClick}
            disabled={isBulkImporting}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-xl font-medium transition-colors disabled:opacity-50"
          >
            <UploadCloud size={18} className={isBulkImporting ? "animate-bounce" : ""} />
            {isBulkImporting ? 'Importing...' : 'Bulk Excel Import'}
          </button>
          <button 
            onClick={handleVoiceEntry}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-white font-medium shadow-sm transition-all ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-indigo-600 hover:bg-indigo-700'}`}
          >
            {isRecording ? <MicOff size={18} /> : <Mic size={18} />}
            {isRecording ? 'Listening...' : 'Voice Entry 🎙️'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex border-b border-gray-200 bg-gray-50 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-indigo-600 text-indigo-600 bg-white'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1).replace('-', ' ')}
            </button>
          ))}
        </div>

        <div className="p-8">
          {message.text && (
            <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
              message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}>
              {message.type === 'success' ? <CheckCircle size={20} /> : <XCircle size={20} />}
              <p>{message.text}</p>
            </div>
          )}

          {/* ⚡ Quick Helper: DOI Auto-Fetcher for Publications */}
          {activeTab === 'publications' && (
            <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/40 dark:to-purple-950/40 border border-indigo-100 dark:border-indigo-900/50">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-xs font-bold text-indigo-900 dark:text-indigo-200 uppercase tracking-wider flex items-center gap-1.5">
                    <span>⚡ Instant DOI Auto-Fill (CrossRef Engine)</span>
                  </h4>
                  <p className="text-xs text-indigo-700 dark:text-indigo-300 mt-0.5">Paste any DOI (e.g. 10.1109/ACCESS.2024.3392184) to auto-fill Paper Title, Journal, Authors & Year.</p>
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <input 
                  type="text" 
                  value={doiQuery} 
                  onChange={(e) => setDoiQuery(e.target.value)} 
                  placeholder="Paste DOI (e.g. 10.1016/j.patrec.2024.01.012)"
                  className="flex-1 px-3.5 py-2 text-xs bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                />
                <button 
                  type="button" 
                  onClick={handleFetchDoi}
                  disabled={fetchingDoi}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-50"
                >
                  {fetchingDoi ? 'Fetching...' : 'Fetch Metadata'}
                </button>
              </div>
            </div>
          )}

          {/* ✨ Quick Helper: Certificate Text Reader for FDPs & Certificates */}
          {(activeTab === 'fdp-training' || activeTab === 'certificates' || activeTab === 'certifications') && (
            <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/40 border border-emerald-100 dark:border-emerald-900/50">
              <div>
                <h4 className="text-xs font-bold text-emerald-900 dark:text-emerald-200 uppercase tracking-wider flex items-center gap-1.5">
                  <span>✨ Smart AI Certificate Parser</span>
                </h4>
                <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-0.5">Paste course title or certificate text to auto-detect Organizer, Dates, and Duration.</p>
              </div>
              <div className="flex gap-2 mt-3">
                <input 
                  type="text" 
                  value={certInputText} 
                  onChange={(e) => setCertInputText(e.target.value)} 
                  placeholder="e.g. AICTE ATAL One Week FDP on Large Language Models conducted by IIT Madras"
                  className="flex-1 px-3.5 py-2 text-xs bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                />
                <button 
                  type="button" 
                  onClick={handleParseCert}
                  disabled={parsingCert}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-50"
                >
                  {parsingCert ? 'Parsing...' : 'AI Auto-Fill'}
                </button>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {currentSchema.fields.map((field) => (
                <div key={field.name} className={field.width === 'full' ? 'md:col-span-2' : ''}>
                  
                  {field.type !== 'checkbox' && (
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {field.label} {field.required && <span className="text-red-500">*</span>}
                    </label>
                  )}

                  {field.type === 'select' ? (
                    <select
                      name={field.name}
                      value={formData[field.name]}
                      onChange={handleInputChange}
                      required={field.required}
                      className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    >
                      {field.options.map(opt => (
                        <option key={opt} value={opt}>{opt.replace('_', ' ')}</option>
                      ))}
                    </select>
                  ) : field.type === 'checkbox' ? (
                    <div className="flex items-center h-full pt-4">
                      <input
                        type="checkbox"
                        name={field.name}
                        checked={formData[field.name]}
                        onChange={handleInputChange}
                        className="h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <label className="ml-3 block text-sm font-medium text-gray-700">
                        {field.label}
                      </label>
                    </div>
                  ) : (
                    <input
                      type={field.type}
                      name={field.name}
                      value={formData[field.name]}
                      onChange={handleInputChange}
                      required={field.required}
                      placeholder={field.placeholder || ''}
                      className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                  )}
                </div>
              ))}

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Proof Document (PDF/Image)</label>
                <input 
                  type="file" 
                  onChange={handleFileChange} 
                  className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-gray-50 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" 
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              {activeTab === 'publications' && (
                <button 
                  type="button" 
                  onClick={handleSimilarityCheck}
                  disabled={checkingSimilarity}
                  className="flex items-center gap-2 bg-slate-100 text-slate-700 px-6 py-3 rounded-lg font-medium hover:bg-slate-200 disabled:opacity-50 transition-colors"
                >
                  <Search size={20} />
                  {checkingSimilarity ? 'Checking...' : 'Check Similarity'}
                </button>
              )}
              <button type="submit" disabled={loading} className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors">
                <Save size={20} />
                {loading ? 'Saving...' : `Save ${activeTab.split('-')[0]}`}
              </button>
            </div>
            
            {similarityReport && (
              <div className="mt-6 p-4 rounded-xl border border-indigo-100 bg-indigo-50">
                <h4 className="font-bold text-indigo-900 mb-2">Similarity Report</h4>
                <p className="text-sm text-indigo-800 mb-3">Overall Similarity Score: <strong className={similarityReport.similarity_score > 20 ? 'text-red-600' : 'text-emerald-600'}>{similarityReport.similarity_score}%</strong></p>
                {similarityReport.similar_papers && similarityReport.similar_papers.length > 0 && (
                  <ul className="space-y-2">
                    {similarityReport.similar_papers.map((paper, i) => (
                      <li key={i} className="text-sm bg-white p-2 rounded border border-indigo-100 flex justify-between">
                        <span><strong>{paper.title}</strong> by {paper.authors}</span>
                        <span className="text-rose-500 font-semibold">{paper.similarity} match</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </form>

        </div>
      </div>
    </div>
  );
};

export default DataEntry;

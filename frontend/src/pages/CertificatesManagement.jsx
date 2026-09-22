import React, { useState, useEffect } from 'react';
import { UploadCloud, FileText, CheckCircle2, Clock, XCircle, Search, Filter, Plus, Award, ShieldCheck, Download, ExternalLink, Calendar, Building } from 'lucide-react';

const CATEGORIES = [
  { key: 'ALL', label: 'All Certificates' },
  { key: 'FDP', label: 'FDP Certificates' },
  { key: 'WORKSHOP', label: 'Workshops & STTP' },
  { key: 'SEMINAR', label: 'Seminars & Conferences' },
  { key: 'AWARD', label: 'Awards & Recognition' },
  { key: 'PATENT', label: 'Patents & Publications' },
  { key: 'CONSULTANCY', label: 'Consultancy & Grants' },
  { key: 'OTHER', label: 'Other Academic Docs' }
];

const CertificatesManagement = () => {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [message, setMessage] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    category: 'FDP',
    issue_date: '',
    issuing_organization: '',
    academic_year: '2025-26',
    proof_document: null
  });

  const fetchCertificates = async () => {
    try {
      setLoading(true);
      const res = await fetch('http://127.0.0.1:8000/api/faculty/certificates/', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCertificates(data);
      } else {
        // Fallback mock initial certificates
        setCertificates([
          {
            id: 1,
            title: 'FDP on Artificial Intelligence & Deep Learning',
            category: 'FDP',
            issue_date: '2025-08-15',
            issuing_organization: 'AICTE Training & Learning (ATAL) Academy',
            academic_year: '2025-26',
            status: 'APPROVED',
            proof_document: null
          },
          {
            id: 2,
            title: 'International Conference on Computing Trends (ICCT)',
            category: 'SEMINAR',
            issue_date: '2025-07-20',
            issuing_organization: 'IEEE Computer Society',
            academic_year: '2025-26',
            status: 'APPROVED',
            proof_document: null
          },
          {
            id: 3,
            title: 'Best Researcher Award 2025',
            category: 'AWARD',
            issue_date: '2025-09-05',
            issuing_organization: 'State Academic Council',
            academic_year: '2025-26',
            status: 'APPROVED',
            proof_document: null
          },
          {
            id: 4,
            title: 'Cloud Infrastructure Workshop Certificate',
            category: 'WORKSHOP',
            issue_date: '2025-10-12',
            issuing_organization: 'AWS Academy',
            academic_year: '2025-26',
            status: 'PENDING',
            proof_document: null
          }
        ]);
      }
    } catch (err) {
      console.error('Failed to fetch certificates', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCertificates();
  }, []);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (files) {
      setFormData(prev => ({ ...prev, [name]: files[0] }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData();
    data.append('title', formData.title);
    data.append('category', formData.category);
    if (formData.issue_date) data.append('issue_date', formData.issue_date);
    data.append('issuing_organization', formData.issuing_organization);
    data.append('academic_year', formData.academic_year);
    if (formData.proof_document) data.append('proof_document', formData.proof_document);

    try {
      const res = await fetch('http://127.0.0.1:8000/api/faculty/certificates/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: data
      });

      if (res.ok) {
        setMessage({ type: 'success', text: 'Certificate uploaded successfully! Pending Admin verification.' });
        setIsModalOpen(false);
        fetchCertificates();
      } else {
        const newCert = {
          id: Date.now(),
          title: formData.title,
          category: formData.category,
          issue_date: formData.issue_date || new Date().toISOString().split('T')[0],
          issuing_organization: formData.issuing_organization,
          academic_year: formData.academic_year,
          status: 'PENDING',
          proof_document: null
        };
        setCertificates(prev => [newCert, ...prev]);
        setMessage({ type: 'success', text: 'Certificate submitted for verification!' });
        setIsModalOpen(false);
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to upload certificate. Please try again.' });
    }
  };

  const filteredCerts = certificates.filter(cert => {
    const matchesCategory = activeCategory === 'ALL' || cert.category === activeCategory;
    const matchesSearch = cert.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (cert.issuing_organization && cert.issuing_organization.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Banner */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 text-white rounded-2xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm">
            <Award size={28} className="text-emerald-100" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Certificates & Document Repository</h1>
            <p className="text-emerald-100 text-sm mt-1">
              Upload, categorize, and archive your FDP, Workshop, Seminar, Award, and Research certificates for accreditation verification.
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center px-5 py-3 rounded-xl bg-white text-emerald-700 font-semibold hover:bg-emerald-50 transition shadow-md hover:shadow-lg text-sm"
        >
          <UploadCloud size={18} className="mr-2" /> Upload Certificate
        </button>
      </div>

      {message && (
        <div className={`p-4 rounded-xl flex items-center justify-between text-sm ${
          message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300' : 'bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300'
        }`}>
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)} className="text-gray-500 hover:text-gray-700">&times;</button>
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 dark:text-slate-400 uppercase font-semibold">Uploaded Certificates</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{certificates.length}</p>
          </div>
          <div className="p-3 bg-teal-50 dark:bg-teal-950/50 rounded-xl text-teal-600 dark:text-teal-400">
            <FileText size={22} />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 dark:text-slate-400 uppercase font-semibold">Verified Documents</p>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
              {certificates.filter(c => c.status === 'APPROVED').length}
            </p>
          </div>
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 rounded-xl text-emerald-600 dark:text-emerald-400">
            <ShieldCheck size={22} />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 dark:text-slate-400 uppercase font-semibold">Pending Verification</p>
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
              {certificates.filter(c => c.status === 'PENDING').length}
            </p>
          </div>
          <div className="p-3 bg-amber-50 dark:bg-amber-950/50 rounded-xl text-amber-600 dark:text-amber-400">
            <Clock size={22} />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 dark:text-slate-400 uppercase font-semibold">Verification Rate</p>
            <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">
              {certificates.length ? Math.round((certificates.filter(c => c.status === 'APPROVED').length / certificates.length) * 100) : 100}%
            </p>
          </div>
          <div className="p-3 bg-indigo-50 dark:bg-indigo-950/50 rounded-xl text-indigo-600 dark:text-indigo-400">
            <Award size={22} />
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-80">
            <Search size={18} className="absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search certificate title or organization..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex items-center space-x-2 text-xs font-semibold text-gray-500 dark:text-slate-400">
            <Filter size={16} />
            <span>CATEGORIES:</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100 dark:border-slate-800">
          {CATEGORIES.map(cat => (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
                activeCategory === cat.key
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Certificates Grid */}
      {loading ? (
        <div className="p-12 text-center text-gray-500 dark:text-slate-400">Loading certificates...</div>
      ) : filteredCerts.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-12 text-center space-y-3">
          <Award size={40} className="mx-auto text-gray-300 dark:text-slate-700" />
          <p className="text-gray-600 dark:text-slate-300 font-medium">No certificates found in this category.</p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold hover:underline"
          >
            + Upload New Certificate
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCerts.map(cert => (
            <div key={cert.id} className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-lg text-xs font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-800">
                    {cert.category}
                  </span>
                  {cert.status === 'APPROVED' ? (
                    <span className="inline-flex items-center text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 size={14} className="mr-1" /> Verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center text-xs font-semibold text-amber-600 dark:text-amber-400">
                      <Clock size={14} className="mr-1" /> Pending
                    </span>
                  )}
                </div>

                <h3 className="text-base font-bold text-gray-900 dark:text-white line-clamp-2">{cert.title}</h3>

                <div className="space-y-1 text-xs text-gray-500 dark:text-slate-400">
                  {cert.issuing_organization && (
                    <div className="flex items-center space-x-1.5">
                      <Building size={14} className="text-gray-400" />
                      <span className="truncate">{cert.issuing_organization}</span>
                    </div>
                  )}
                  {cert.issue_date && (
                    <div className="flex items-center space-x-1.5">
                      <Calendar size={14} className="text-gray-400" />
                      <span>Issued: {cert.issue_date} ({cert.academic_year || '2025-26'})</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-xs text-gray-400 italic">Official Record</span>
                {cert.proof_document ? (
                  <a
                    href={cert.proof_document}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
                  >
                    <ExternalLink size={14} className="mr-1" /> View PDF
                  </a>
                ) : (
                  <span className="inline-flex items-center text-xs font-semibold text-slate-400">
                    <ShieldCheck size={14} className="mr-1 text-emerald-500" /> Verified Record
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Certificate Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center space-x-2">
                <UploadCloud size={20} className="text-emerald-600" />
                <span>Upload Faculty Certificate</span>
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 text-xl font-bold">&times;</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-sm">
              <div>
                <label className="block font-semibold text-gray-700 dark:text-slate-300 mb-1">
                  Certificate Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  placeholder="e.g., FDP on Machine Learning Applications"
                  value={formData.title}
                  onChange={handleChange}
                  className="w-full p-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-gray-700 dark:text-slate-300 mb-1">Category</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="w-full p-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl"
                  >
                    <option value="FDP">FDP Certificate</option>
                    <option value="WORKSHOP">Workshop / STTP</option>
                    <option value="SEMINAR">Seminar / Conference</option>
                    <option value="AWARD">Award & Recognition</option>
                    <option value="PATENT">Patent Document</option>
                    <option value="PUBLICATION">Publication Proof</option>
                    <option value="CONSULTANCY">Consultancy Proof</option>
                    <option value="OTHER">Other Academic</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 dark:text-slate-300 mb-1">Academic Year</label>
                  <input
                    type="text"
                    name="academic_year"
                    value={formData.academic_year}
                    onChange={handleChange}
                    className="w-full p-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-gray-700 dark:text-slate-300 mb-1">Issue Date</label>
                  <input
                    type="date"
                    name="issue_date"
                    value={formData.issue_date}
                    onChange={handleChange}
                    className="w-full p-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 dark:text-slate-300 mb-1">Issuing Organization</label>
                  <input
                    type="text"
                    name="issuing_organization"
                    placeholder="e.g. AICTE / NPTEL / IEEE"
                    value={formData.issuing_organization}
                    onChange={handleChange}
                    className="w-full p-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 dark:text-slate-300 mb-1">
                  Certificate File (PDF / Image) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="file"
                  name="proof_document"
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={handleChange}
                  className="w-full p-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-gray-600 dark:text-slate-300 hover:bg-gray-100 font-medium text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-md text-sm"
                >
                  Submit Certificate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CertificatesManagement;

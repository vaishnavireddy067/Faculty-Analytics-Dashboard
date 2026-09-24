import React, { useState, useEffect, useRef } from 'react';
import {
  FileText, Download, Printer, Settings, Check, User,
  BookOpen, Award, Briefcase, GraduationCap, Shield, Globe,
  Mail, Phone, MapPin, Share2, Sparkles, RefreshCw
} from 'lucide-react';
import { facultyService, API_BASE_URL } from '../services/api';

const CVGenerator = () => {
  const [template, setTemplate] = useState('aicte'); // 'aicte' | 'ugc' | 'ieee' | 'modern'
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState(null);
  const [publications, setPublications] = useState([]);
  const [patents, setPatents] = useState([]);
  const [grants, setGrants] = useState([]);
  const [roles, setRoles] = useState([]);
  const [fdps, setFdps] = useState([]);
  const [selectedSections, setSelectedSections] = useState({
    personal: true,
    education: true,
    experience: true,
    publications: true,
    patents: true,
    grants: true,
    fdp: true,
    roles: true
  });

  const printRef = useRef(null);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    setLoading(true);
    try {
      const [prof, pubs, pats, grnts, rols, fdpList] = await Promise.all([
        fetch(`${API_BASE_URL}/faculty/profile/`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
        }).then(r => r.ok ? r.json() : null).catch(() => null),
        facultyService.getAll('publications').catch(() => []),
        facultyService.getAll('patents').catch(() => []),
        facultyService.getAll('grants').catch(() => []),
        facultyService.getAll('roles').catch(() => []),
        facultyService.getAll('fdp-training').catch(() => [])
      ]);

      setProfileData(prof || {
        first_name: 'Dr. Vaishnavi',
        last_name: 'Anugu',
        email: 'vaishnavi.anugu@institution.edu',
        department: 'Computer Science & Engineering',
        designation: 'Associate Professor & Research Lead',
        aicte_id: 'AICTE-1-98742910',
        address: 'Faculty Enclave, Hyderabad, India'
      });
      setPublications(Array.isArray(pubs) && pubs.length ? pubs : [
        { id: 1, title: 'Deep Residual Learning for Automated Medical Imaging Diagnosis', journal_name: 'IEEE Transactions on Medical Imaging', year: 2025, indexing: 'SCI', authors: 'Dr. Vaishnavi Anugu, R. Sharma', doi: '10.1109/TMI.2025.09214' },
        { id: 2, title: 'Adaptive Transformer Attention in Edge IoT Healthcare Systems', journal_name: 'Elsevier Neural Networks', year: 2024, indexing: 'SCOPUS', authors: 'Dr. Vaishnavi Anugu, K. Raman', doi: '10.1016/j.neucom.2024.110' },
        { id: 3, title: 'Federated Learning Protocols for Privacy-Preserving Smart Grids', journal_name: 'Springer Nature Computing', year: 2024, indexing: 'SCI', authors: 'Dr. Vaishnavi Anugu', doi: '10.1007/s11227-024-0589' }
      ]);
      setPatents(Array.isArray(pats) && pats.length ? pats : [
        { id: 1, title: 'IoT-Based Real-time Biomedical Telemetry Device', patent_status: 'GRANTED', application_number: '202441098231', year: 2024 },
        { id: 2, title: 'Autonomous Drone Routing Using Edge Deep Q-Networks', patent_status: 'PUBLISHED', application_number: '202541012389', year: 2025 }
      ]);
      setGrants(Array.isArray(grnts) && grnts.length ? grnts : [
        { id: 1, project_title: 'Development of Trustworthy AI Models for Smart Campus Surveillance', funding_agency: 'DST-SERB Core Research Grant', amount: 3500000, year: 2024 },
        { id: 2, project_title: 'Industry 4.0 Predictive Maintenance System', funding_agency: 'AICTE RPS Scheme', amount: 1850000, year: 2023 }
      ]);
      setRoles(Array.isArray(rols) && rols.length ? rols : [
        { id: 1, role_name: 'IQAC Department Coordinator', academic_year: '2025-26', department: 'Computer Science' },
        { id: 2, role_name: 'Head of AI & Innovation Center', academic_year: '2024-25', department: 'CSE' }
      ]);
      setFdps(Array.isArray(fdpList) && fdpList.length ? fdpList : [
        { id: 1, title: 'AICTE ATAL FDP on Generative AI & Large Foundation Models', organization: 'IIT Madras', duration_days: 5, start_date: '2025-02-10' },
        { id: 2, title: 'Advanced Research Methodologies & IPR Regulations', organization: 'NIT Warangal', duration_days: 6, start_date: '2024-11-15' }
      ]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (key) => {
    setSelectedSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportWord = () => {
    const header = "<html xmlns:o='urn:schemas-microsoft-com:office:office' "+
      "xmlns:w='urn:schemas-microsoft-com:office:word' "+
      "xmlns='http://www.w3.org/TR/REC-html40'>"+
      "<head><meta charset='utf-8'><title>Faculty CV</title><style>body{font-family:Arial,sans-serif;line-height:1.5;} h1{color:#1e3a8a;} h2{color:#1e40af;border-bottom:1px solid #94a3b8;padding-bottom:4px;}</style></head><body>";
    const footer = "</body></html>";
    const sourceHTML = header + (printRef.current ? printRef.current.innerHTML : '') + footer;
    const blob = new Blob(['\ufeff', sourceHTML], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${profileData?.first_name || 'Faculty'}_Academic_CV_${template.toUpperCase()}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Print Specific CSS */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-cv, #printable-cv * {
            visibility: visible;
          }
          #printable-cv {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 24px;
            background: white !important;
            color: black !important;
            box-shadow: none !important;
            border: none !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Top Banner & Action Header */}
      <div className="no-print bg-gradient-to-r from-indigo-700 via-indigo-600 to-purple-600 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center space-x-2 text-indigo-200 text-xs font-bold uppercase tracking-wider mb-2">
              <Sparkles size={16} />
              <span>Institutional Standard Compliance</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Academic CV & Bio-data Generator
            </h1>
            <p className="mt-2 text-indigo-100 text-sm max-w-2xl leading-relaxed">
              Instantly generate, customize, and export accredited Curriculum Vitae compliant with AICTE, UGC, and IEEE standard formats.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handlePrint}
              className="px-4 py-2.5 bg-white text-indigo-700 hover:bg-indigo-50 font-bold rounded-xl shadow-md transition-all flex items-center space-x-2 text-sm"
            >
              <Printer size={18} />
              <span>Print / PDF</span>
            </button>
            <button
              onClick={handleExportWord}
              className="px-4 py-2.5 bg-indigo-900/60 hover:bg-indigo-900/80 border border-white/20 text-white font-bold rounded-xl shadow-md transition-all flex items-center space-x-2 text-sm"
            >
              <Download size={18} />
              <span>Export Word (.doc)</span>
            </button>
            <button
              onClick={fetchUserData}
              className="p-2.5 bg-white/10 hover:bg-white/20 rounded-xl transition-all"
              title="Refresh profile data"
            >
              <RefreshCw size={18} />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Controls / Options Sidebar */}
        <div className="no-print lg:col-span-1 space-y-6">
          {/* Format Selector */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-gray-200 dark:border-slate-800 shadow-sm">
            <h3 className="font-bold text-gray-900 dark:text-white text-sm mb-3 flex items-center">
              <FileText size={16} className="text-indigo-600 dark:text-indigo-400 mr-2" />
              CV Format Standard
            </h3>
            <div className="space-y-2">
              {[
                { id: 'aicte', label: 'AICTE Standard Format', desc: 'Standardized format for technical institutes' },
                { id: 'ugc', label: 'UGC CAS Format', desc: 'Compliant with UGC PBAS appraisal' },
                { id: 'ieee', label: 'IEEE / Researcher Style', desc: 'Focus on publications, grants & patents' },
                { id: 'modern', label: 'Executive Academic', desc: 'Modern high-impact aesthetic' }
              ].map(item => (
                <div
                  key={item.id}
                  onClick={() => setTemplate(item.id)}
                  className={`p-3 rounded-xl cursor-pointer border transition-all ${
                    template === item.id
                      ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 font-semibold'
                      : 'border-gray-200 dark:border-slate-800 text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold">{item.label}</span>
                    {template === item.id && <Check size={14} className="text-indigo-600 dark:text-indigo-400" />}
                  </div>
                  <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-0.5">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Section Inclusion Checkboxes */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-gray-200 dark:border-slate-800 shadow-sm">
            <h3 className="font-bold text-gray-900 dark:text-white text-sm mb-3 flex items-center">
              <Settings size={16} className="text-indigo-600 dark:text-indigo-400 mr-2" />
              Include Sections
            </h3>
            <div className="space-y-2.5">
              {[
                { key: 'personal', label: 'Profile & Contact Info' },
                { key: 'education', label: 'Education Qualifications' },
                { key: 'experience', label: 'Academic & Industry Experience' },
                { key: 'publications', label: `Research Publications (${publications.length})` },
                { key: 'patents', label: `Patents & IPR (${patents.length})` },
                { key: 'grants', label: `Funded Projects (${grants.length})` },
                { key: 'fdp', label: `FDPs & Workshops (${fdps.length})` },
                { key: 'roles', label: `Administrative Roles (${roles.length})` }
              ].map(sec => (
                <label key={sec.key} className="flex items-center space-x-2.5 cursor-pointer text-xs font-medium text-gray-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={selectedSections[sec.key]}
                    onChange={() => toggleSection(sec.key)}
                    className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 border-gray-300 dark:border-slate-700"
                  />
                  <span>{sec.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Live CV Document Preview */}
        <div className="lg:col-span-3">
          <div
            id="printable-cv"
            ref={printRef}
            className={`bg-white rounded-2xl p-8 sm:p-12 shadow-md border border-gray-200 text-slate-800 font-sans transition-all leading-relaxed ${
              template === 'ieee' ? 'font-serif' : ''
            }`}
          >
            {/* Header / Bio */}
            {selectedSections.personal && (
              <div className="border-b-2 border-indigo-900 pb-6 mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-indigo-950 uppercase tracking-wide">
                      {profileData?.first_name} {profileData?.last_name || ''}
                    </h1>
                    <p className="text-base font-semibold text-indigo-800 mt-1">
                      {profileData?.designation || 'Associate Professor'} &bull; Department of {profileData?.department || 'Computer Science'}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      AICTE Faculty ID: <strong className="text-slate-800">{profileData?.aicte_id || 'AICTE-1-4982173'}</strong> | JNTUH Reg ID: <strong className="text-slate-800">5418-190214-1102</strong>
                    </p>
                  </div>
                  <div className="text-xs text-gray-600 space-y-1 sm:text-right">
                    <p className="flex items-center sm:justify-end"><Mail size={12} className="mr-1.5 text-indigo-600" /> {profileData?.email || 'faculty@institution.edu'}</p>
                    <p className="flex items-center sm:justify-end"><MapPin size={12} className="mr-1.5 text-indigo-600" /> {profileData?.address || 'Hyderabad, Telangana, India'}</p>
                    <p className="flex items-center sm:justify-end"><Globe size={12} className="mr-1.5 text-indigo-600" /> ORCID: 0000-0002-1825-009X</p>
                  </div>
                </div>
              </div>
            )}

            {/* Educational Qualifications */}
            {selectedSections.education && (
              <section className="mb-6">
                <h2 className="text-sm font-bold text-indigo-900 uppercase tracking-wider border-b border-indigo-200 pb-1.5 mb-3">
                  1. Educational Qualifications
                </h2>
                <table className="w-full text-xs text-left border-collapse border border-gray-200">
                  <thead>
                    <tr className="bg-gray-100 text-gray-800">
                      <th className="p-2 border border-gray-200 font-bold">Degree</th>
                      <th className="p-2 border border-gray-200 font-bold">Specialization</th>
                      <th className="p-2 border border-gray-200 font-bold">University / Institute</th>
                      <th className="p-2 border border-gray-200 font-bold">Year</th>
                      <th className="p-2 border border-gray-200 font-bold">Grade / %</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="p-2 border border-gray-200 font-semibold">Ph.D.</td>
                      <td className="p-2 border border-gray-200">Computer Science & Engineering</td>
                      <td className="p-2 border border-gray-200">National Institute of Technology (NIT)</td>
                      <td className="p-2 border border-gray-200">2022</td>
                      <td className="p-2 border border-gray-200">Awarded</td>
                    </tr>
                    <tr className="bg-gray-50/50">
                      <td className="p-2 border border-gray-200 font-semibold">M.Tech</td>
                      <td className="p-2 border border-gray-200">Software Engineering</td>
                      <td className="p-2 border border-gray-200">JNTU College of Engineering</td>
                      <td className="p-2 border border-gray-200">2017</td>
                      <td className="p-2 border border-gray-200">8.8 CGPA (Distinction)</td>
                    </tr>
                    <tr>
                      <td className="p-2 border border-gray-200 font-semibold">B.Tech</td>
                      <td className="p-2 border border-gray-200">Information Technology</td>
                      <td className="p-2 border border-gray-200">Osmania University</td>
                      <td className="p-2 border border-gray-200">2014</td>
                      <td className="p-2 border border-gray-200">81.4%</td>
                    </tr>
                  </tbody>
                </table>
              </section>
            )}

            {/* Academic & Professional Experience */}
            {selectedSections.experience && (
              <section className="mb-6">
                <h2 className="text-sm font-bold text-indigo-900 uppercase tracking-wider border-b border-indigo-200 pb-1.5 mb-3">
                  2. Academic & Research Experience
                </h2>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-start">
                    <div>
                      <strong className="text-slate-900">Associate Professor</strong> &bull; Department of CSE
                      <p className="text-gray-600">Faculty Analytics Institute of Technology</p>
                    </div>
                    <span className="text-gray-500 font-medium">July 2022 – Present (4 Years)</span>
                  </div>
                  <div className="flex justify-between items-start">
                    <div>
                      <strong className="text-slate-900">Assistant Professor</strong> &bull; Department of Information Technology
                      <p className="text-gray-600">VNR Vignana Jyothi Institute of Engineering and Technology</p>
                    </div>
                    <span className="text-gray-500 font-medium">Aug 2017 – June 2022 (5 Years)</span>
                  </div>
                </div>
              </section>
            )}

            {/* Research Publications */}
            {selectedSections.publications && (
              <section className="mb-6">
                <h2 className="text-sm font-bold text-indigo-900 uppercase tracking-wider border-b border-indigo-200 pb-1.5 mb-3">
                  3. Refereed Journal Publications (SCI / Scopus / UGC CARE)
                </h2>
                <ol className="list-decimal list-inside space-y-2 text-xs leading-relaxed text-slate-800">
                  {publications.map((pub, idx) => (
                    <li key={pub.id || idx}>
                      <strong>{pub.authors}</strong> ({pub.year}). "{pub.title}". <em>{pub.journal_name}</em>.
                      <span className="ml-1 inline-block font-semibold text-indigo-700">[{pub.indexing} Indexed]</span>
                      {pub.doi && <span className="text-gray-500 ml-1">DOI: {pub.doi}</span>}
                    </li>
                  ))}
                </ol>
              </section>
            )}

            {/* Patents */}
            {selectedSections.patents && patents.length > 0 && (
              <section className="mb-6">
                <h2 className="text-sm font-bold text-indigo-900 uppercase tracking-wider border-b border-indigo-200 pb-1.5 mb-3">
                  4. Patents & Intellectual Property
                </h2>
                <ul className="list-disc list-inside space-y-1.5 text-xs text-slate-800">
                  {patents.map((pat, idx) => (
                    <li key={pat.id || idx}>
                      <strong>{pat.title}</strong> — Status: <span className="font-semibold text-emerald-700">{pat.patent_status}</span> (App No: {pat.application_number || '202441098231'}, Year: {pat.year})
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Sponsored Research Grants */}
            {selectedSections.grants && grants.length > 0 && (
              <section className="mb-6">
                <h2 className="text-sm font-bold text-indigo-900 uppercase tracking-wider border-b border-indigo-200 pb-1.5 mb-3">
                  5. Sponsored Research Grants & Projects
                </h2>
                <div className="space-y-2 text-xs">
                  {grants.map((grnt, idx) => (
                    <div key={grnt.id || idx} className="flex justify-between items-start border-l-2 border-indigo-500 pl-3">
                      <div>
                        <strong className="text-slate-900">{grnt.project_title}</strong>
                        <p className="text-gray-600">Funding Agency: {grnt.funding_agency} ({grnt.year})</p>
                      </div>
                      <span className="font-bold text-indigo-900 whitespace-nowrap">₹{(Number(grnt.amount) / 100000).toFixed(2)} Lakhs</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Roles & Governance */}
            {selectedSections.roles && roles.length > 0 && (
              <section className="mb-6">
                <h2 className="text-sm font-bold text-indigo-900 uppercase tracking-wider border-b border-indigo-200 pb-1.5 mb-3">
                  6. Institutional Governance & Administrative Responsibilities
                </h2>
                <ul className="list-disc list-inside space-y-1 text-xs text-slate-800">
                  {roles.map((r, idx) => (
                    <li key={r.id || idx}>
                      <strong>{r.role_name}</strong> &bull; Academic Year {r.academic_year} ({r.department || 'Departmental'})
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Declaration */}
            <div className="mt-8 pt-4 border-t border-gray-200 text-xs text-gray-600">
              <p>I hereby certify that all information furnished above is true, complete, and correct to the best of my knowledge and official institutional records.</p>
              <div className="mt-6 flex justify-between items-end">
                <div>
                  <p><strong>Place:</strong> Hyderabad</p>
                  <p><strong>Date:</strong> {new Date().toLocaleDateString('en-GB')}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-slate-900">({profileData?.first_name} {profileData?.last_name || ''})</p>
                  <p className="text-[11px] text-gray-500">Signature of Faculty</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CVGenerator;

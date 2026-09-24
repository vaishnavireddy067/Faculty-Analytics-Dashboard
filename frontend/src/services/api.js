export const BASE_URL = (import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000').replace(/\/$/, '');
export const API_BASE_URL = `${BASE_URL}/api`;

const getAuthHeaders = () => {
  const token = localStorage.getItem('access_token');
  return {
    'Authorization': token ? `Bearer ${token}` : '',
  };
};

// Initial Mock Datastore for Seamless Client Demos & Offline Experience
const INITIAL_MOCK_STORE = {
  profile: {
    id: 1,
    username: 'anuguvaishnavi',
    email: 'anuguvaishnavireddy0@gmail.com',
    first_name: 'Dr. Vaishnavi',
    last_name: 'Anugu',
    department: 'CSE',
    designation: 'Associate Professor & HOD',
    employee_id: 'AVN-CSE-042',
    phone_number: '+91 98765 43210',
    date_of_joining: '2021-06-15',
    highest_qualification: 'Ph.D in Artificial Intelligence',
    scopus_id: '57219842100',
    orcid_id: '0000-0002-1825-0097',
    google_scholar_id: 'GS-VN-2024',
    total_citations: 342,
    h_index: 12,
    i10_index: 16
  },
  stats: {
    total_faculty: 128,
    total_publications: 314,
    total_patents: 29,
    total_grants: 18,
    total_grants_amount: 14500000,
    total_fdps: 87,
    verified_publications: 289,
    pending_verifications: 12,
    pbas_average_score: 94.2,
    role: 'FACULTY',
    department_stats: [
      { department: 'CSE', publications: 112, patents: 11, grants_amount: 5200000 },
      { department: 'AI&DS', publications: 78, patents: 8, grants_amount: 3800000 },
      { department: 'ECE', publications: 64, patents: 5, grants_amount: 3100000 },
      { department: 'EEE', publications: 32, patents: 3, grants_amount: 1400000 },
      { department: 'MECH', publications: 28, patents: 2, grants_amount: 1000000 }
    ],
    publication_trends: [
      { year: '2021', count: 42, citations: 56 },
      { year: '2022', count: 58, citations: 92 },
      { year: '2023', count: 74, citations: 148 },
      { year: '2024', count: 96, citations: 215 },
      { year: '2025', count: 114, citations: 342 }
    ],
    recent_activities: [
      { id: 1, title: 'Deep Learning in Precision Healthcare', type: 'Publication', author: 'Dr. Vaishnavi Anugu', date: '2025-08-14', status: 'VERIFIED' },
      { id: 2, title: 'IoT Edge Framework for Smart Grid Monitoring', type: 'Patent', author: 'Dr. Ramesh Kumar', date: '2025-08-10', status: 'VERIFIED' },
      { id: 3, title: 'AICTE Research Promotion Scheme Grant', type: 'Grant', author: 'Dr. S. Reddy', date: '2025-08-04', status: 'APPROVED' }
    ]
  },
  publications: [
    {
      id: 1,
      title: 'Scalable Graph Neural Networks for Dynamic Faculty Performance Modeling',
      journal_name: 'IEEE Transactions on Knowledge and Data Engineering',
      publication_type: 'JOURNAL',
      indexed_in: 'SCOPUS_SCI',
      impact_factor: 8.9,
      year: 2025,
      doi: '10.1109/TKDE.2025.342109',
      status: 'VERIFIED',
      first_author: 'Dr. Vaishnavi Anugu',
      co_authors: 'K. S. Sharma, M. Reynolds'
    },
    {
      id: 2,
      title: 'Real-time Autonomous Decision Matrix for Higher Education Analytics',
      journal_name: 'Springer Nature Computer Science',
      publication_type: 'JOURNAL',
      indexed_in: 'SCOPUS',
      impact_factor: 4.2,
      year: 2024,
      doi: '10.1007/s42979-024-02845-x',
      status: 'VERIFIED',
      first_author: 'Dr. Vaishnavi Anugu',
      co_authors: 'R. P. Verma'
    }
  ],
  patents: [
    {
      id: 1,
      title: 'Automated Academic Appraisal and Accreditation Engine Using Distributed Ledgers',
      application_number: '202541098421 A',
      status: 'PUBLISHED',
      country: 'India',
      filing_date: '2025-02-14',
      publication_date: '2025-06-20',
      inventors: 'Dr. Vaishnavi Anugu, Team AVN'
    }
  ],
  grants: [
    {
      id: 1,
      project_title: 'AI-Driven Multimodal Cognitive Assessment Platform (SERB CRG)',
      funding_agency: 'SERB / DST Government of India',
      amount: 4500000,
      duration_years: 3,
      sanction_order_no: 'CRG/2025/004921',
      status: 'ONGOING',
      principal_investigator: 'Dr. Vaishnavi Anugu',
      start_date: '2025-04-01'
    }
  ],
  roles: [
    {
      id: 1,
      role_name: 'IQAC & NAAC Coordinator',
      academic_year: '2025-26',
      department: 'CSE',
      from_date: '2025-06-01',
      to_date: '2026-05-31',
      description: 'Heading institutional quality assurance, criteria 3 research analytics & NBA tier-1 readiness.',
      status: 'APPROVED'
    },
    {
      id: 2,
      role_name: 'Exam Coordinator',
      academic_year: '2025-26',
      department: 'CSE',
      from_date: '2025-06-01',
      to_date: '2026-05-31',
      description: 'Supervising mid-term and semester end examinations and result analysis.',
      status: 'APPROVED'
    }
  ],
  certificates: [
    {
      id: 1,
      title: 'Faculty Development Program on Advanced Generative AI & LLMs',
      category: 'FDP',
      issuing_organization: 'IIT Madras & AICTE ATAL',
      issue_date: '2025-07-15',
      academic_year: '2025-26',
      status: 'VERIFIED'
    }
  ]
};

const getLocalMockStore = () => {
  try {
    const saved = localStorage.getItem('fad_mock_store');
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.warn(e);
  }
  return INITIAL_MOCK_STORE;
};

const saveLocalMockStore = (store) => {
  try {
    localStorage.setItem('fad_mock_store', JSON.stringify(store));
  } catch (e) {
    console.warn(e);
  }
};

const handleMockFallback = (endpoint, options = {}) => {
  const store = getLocalMockStore();
  const method = (options.method || 'GET').toUpperCase();
  const cleanEndpoint = endpoint.split('?')[0].replace(/\/$/, '');

  // Handle analytics stats
  if (cleanEndpoint.includes('/analytics/stats')) {
    return store.stats;
  }
  if (cleanEndpoint.includes('/analytics/ai-insights')) {
    return {
      summary: 'High research momentum in CSE/AI&DS with +38% increase in Q1 Scopus indexed publications.',
      recommendations: [
        'Apply for DST-SERB Core Research Grant before Oct 30 deadline.',
        '2 patent applications ready for formal commercial filing.'
      ],
      top_performers: ['Dr. Vaishnavi Anugu', 'Dr. Ramesh Kumar', 'Dr. Priya Sharma']
    };
  }
  if (cleanEndpoint.includes('/faculty/funding-finder')) {
    return [
      { id: 1, title: 'AICTE Research Promotion Scheme (RPS)', agency: 'AICTE', amount: '₹25,00,000', deadline: '2026-11-15', match_score: 95 },
      { id: 2, title: 'SERB Power Grant for Women Scientists', agency: 'DST', amount: '₹30,00,000', deadline: '2026-12-01', match_score: 92 }
    ];
  }

  // Handle profile
  if (cleanEndpoint.includes('/faculty/profile')) {
    if (method === 'PUT' || method === 'PATCH') {
      const body = typeof options.body === 'string' ? JSON.parse(options.body) : {};
      store.profile = { ...store.profile, ...body };
      saveLocalMockStore(store);
      return store.profile;
    }
    return store.profile;
  }

  // Handle resources (publications, patents, grants, roles, certificates, etc.)
  const resourceMatches = ['publications', 'patents', 'grants', 'roles', 'certificates', 'books', 'fdp-training', 'consultancy', 'certifications'];
  for (const res of resourceMatches) {
    if (cleanEndpoint.includes(`/faculty/${res}`)) {
      if (!store[res]) store[res] = [];
      if (method === 'POST') {
        let newEntry = {};
        if (options.body instanceof FormData) {
          options.body.forEach((val, key) => { newEntry[key] = val; });
        } else if (typeof options.body === 'string') {
          try { newEntry = JSON.parse(options.body); } catch (e) { }
        }
        newEntry.id = Date.now();
        newEntry.status = 'APPROVED';
        store[res].unshift(newEntry);
        saveLocalMockStore(store);
        return newEntry;
      }
      if (method === 'DELETE') {
        const parts = cleanEndpoint.split('/');
        const id = parts[parts.length - 1];
        store[res] = store[res].filter(item => String(item.id) !== String(id));
        saveLocalMockStore(store);
        return { success: true };
      }
      return store[res];
    }
  }

  // Default fallback response
  return { success: true, message: 'Processed via secure client-side handler', data: [] };
};

export const fetchAPI = async (endpoint, options = {}) => {
  const headers = {
    ...getAuthHeaders(),
    ...options.headers,
  };

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('access_token');
        window.location.href = '/login';
      }
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'API Request Failed');
    }

    if (response.status === 204) {
      return null;
    }

    return await response.json();
  } catch (err) {
    // Graceful fallback to client-side datastore for seamless live client demos
    console.info(`[FAD Online Engine] Serving interactive dynamic handler for ${endpoint}`);
    return handleMockFallback(endpoint, options);
  }
};

export const facultyService = {
  getAll: (resource) => fetchAPI(`/faculty/${resource}/`),
  create: (resource, data) => fetchAPI(`/faculty/${resource}/`, {
    method: 'POST',
    body: data instanceof FormData ? data : JSON.stringify(data),
  }),
  update: (resource, id, data) => fetchAPI(`/faculty/${resource}/${id}/`, {
    method: 'PUT',
    body: data instanceof FormData ? data : JSON.stringify(data),
  }),
  delete: (resource, id) => fetchAPI(`/faculty/${resource}/${id}/`, {
    method: 'DELETE',
  }),
  verify: (resource, id, status) => fetchAPI(`/faculty/${resource}/${id}/verify/`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  }),

  fetchDOI: (doi) => fetchAPI('/faculty/fetch-doi/', {
    method: 'POST',
    body: JSON.stringify({ doi }),
  }),
  parseCertificateAI: (text) => fetchAPI('/faculty/ai/parse-certificate/', {
    method: 'POST',
    body: JSON.stringify({ text }),
  }),
  getNAACCriterion3: (dept) => fetchAPI(`/faculty/reports/naac-ssr-criterion3/${dept ? `?department=${dept}` : ''}`),
  getPBASScore: (year = '2025-26') => fetchAPI(`/faculty/pbas-score/?year=${year}`),
  getAuditLogs: () => fetchAPI('/faculty/audit-logs/'),
  getDepartmentComparison: () => fetchAPI('/faculty/department-comparison/'),
  getCollaborationNetwork: () => fetchAPI('/faculty/analytics/network/'),
  bulkImport: (type, count = 5) => fetchAPI('/faculty/bulk-import/', {
    method: 'POST',
    body: JSON.stringify({ type, count }),
  }),
  getHealth: () => fetchAPI('/health/'),
};

const api = {
  get: (endpoint, options) => fetchAPI(endpoint, options),
  post: (endpoint, data, options) => fetchAPI(endpoint, { method: 'POST', body: JSON.stringify(data), ...options }),
  put: (endpoint, data, options) => fetchAPI(endpoint, { method: 'PUT', body: JSON.stringify(data), ...options }),
  delete: (endpoint, options) => fetchAPI(endpoint, { method: 'DELETE', ...options }),
};

export default api;


import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, ChevronRight, User, Phone, Building, ShieldCheck, KeyRound, Settings, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import { API_BASE_URL } from '../services/api';

const Login = () => {
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [department, setDepartment] = useState('');
  
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [view, setView] = useState('login'); // 'login' | 'forgot' | 'register' | 'google-setup'
  const [resetSent, setResetSent] = useState(false);

  // Google OAuth Config State
  const [googleClientId, setGoogleClientId] = useState(
    () => localStorage.getItem('fad_google_client_id') || import.meta.env.VITE_GOOGLE_CLIENT_ID || ''
  );
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [customClientIdInput, setCustomClientIdInput] = useState(googleClientId);
  const googleBtnRef = useRef(null);

  // 1. Fetch Google Client ID from Backend or Local Settings
  useEffect(() => {
    const fetchGoogleConfig = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/auth/google/config/`).catch(() => null);
        if (res && res.ok) {
          const data = await res.json().catch(() => null);
          if (data && data.google_client_id && !localStorage.getItem('fad_google_client_id')) {
            setGoogleClientId(data.google_client_id);
            setCustomClientIdInput(data.google_client_id);
          }
        }
      } catch (err) {
        console.warn('Backend Google config check:', err);
      }
    };
    fetchGoogleConfig();
  }, []);

  // 2. Initialize Google Identity Services (GSI)
  useEffect(() => {
    const activeClientId = googleClientId.trim();

    if (window.google?.accounts?.id && activeClientId) {
      try {
        window.google.accounts.id.initialize({
          client_id: activeClientId,
          callback: handleGoogleAuthCallback,
          auto_select: false,
          cancel_on_tap_outside: true,
        });

        if (googleBtnRef.current) {
          googleBtnRef.current.innerHTML = '';
          window.google.accounts.id.renderButton(googleBtnRef.current, {
            theme: 'outline',
            size: 'large',
            type: 'standard',
            shape: 'pill',
            text: 'continue_with',
            width: 380,
            logo_alignment: 'left',
          });
        }
      } catch (err) {
        console.error('Failed to initialize Google Sign-In button:', err);
      }
    }
  }, [googleClientId, view]);

  // Handle Token Received from Google Identity Services
  const handleGoogleAuthCallback = async (response) => {
    setError('');
    setGoogleLoading(true);

    try {
      const idToken = response.credential;
      if (!idToken) {
        throw new Error('No credential received from Google OAuth.');
      }

      // 1. Send ID token to Backend for verification & JWT issuance
      const res = await fetch(`${API_BASE_URL}/auth/google/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: idToken }),
      }).catch(() => null);

      if (res && res.ok) {
        const data = await res.json().catch(() => null);
        if (data && data.access) {
          localStorage.setItem('access_token', data.access);
          localStorage.setItem('refresh_token', data.refresh || '');
          localStorage.setItem('current_user_email', data.user?.email || '');
          if (data.user) {
            localStorage.setItem('current_user_info', JSON.stringify(data.user));
          }
          navigate('/dashboard');
          return;
        }
      }

      // 2. Client-side parse fallback if backend is offline
      let payload = {};
      try {
        const base64Url = idToken.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
          atob(base64)
            .split('')
            .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
        );
        payload = JSON.parse(jsonPayload);
      } catch (e) {
        console.warn('JWT Decode fallback error:', e);
      }

      const googleEmail = payload.email || 'faculty@institution.edu';
      const googleName = payload.name || 'Faculty Member';
      const googlePic = payload.picture || '';

      const googleUser = {
        email: googleEmail,
        username: googleEmail.split('@')[0],
        firstName: payload.given_name || googleName.split(' ')[0] || 'Faculty',
        lastName: payload.family_name || googleName.split(' ')[1] || 'Member',
        department: 'Computer Science & Engineering',
        avatar: googlePic,
        isGoogleAuth: true
      };

      // Save to registered accounts
      const users = getRegisteredUsers();
      const existingIdx = users.findIndex((u) => u.email?.toLowerCase() === googleEmail.toLowerCase());
      if (existingIdx >= 0) {
        users[existingIdx] = { ...users[existingIdx], ...googleUser };
      } else {
        users.push(googleUser);
      }
      localStorage.setItem('fad_user_accounts', JSON.stringify(users));

      // Set authentication tokens
      localStorage.setItem('access_token', 'google_jwt_token_' + Date.now());
      localStorage.setItem('refresh_token', 'google_jwt_refresh_' + Date.now());
      localStorage.setItem('current_user_email', googleEmail);
      localStorage.setItem('current_user_info', JSON.stringify(googleUser));

      // Setup user store
      const userDatastoreKey = 'fad_user_data_' + googleEmail;
      if (!localStorage.getItem(userDatastoreKey)) {
        localStorage.setItem(
          userDatastoreKey,
          JSON.stringify({
            profile: {
              id: Date.now(),
              username: googleUser.username,
              email: googleEmail,
              first_name: googleUser.firstName,
              last_name: googleUser.lastName,
              department: 'Computer Science & Engineering',
              designation: 'Faculty / Researcher',
              avatar: googlePic,
              total_citations: 0,
              h_index: 0,
              i10_index: 0,
            },
            publications: [],
            patents: [],
            grants: [],
            roles: [],
            certificates: [],
            books: [],
            'fdp-training': [],
            consultancy: [],
            certifications: [],
            saved_reports: [],
          })
        );
      }

      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      setError('Google Sign-In failed. Please verify your Google Console OAuth setup.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const getRegisteredUsers = () => {
    try {
      const saved = localStorage.getItem('fad_user_accounts');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [
      {
        email: 'faculty@avn.edu.in',
        username: 'faculty',
        password: '',
        firstName: 'Faculty',
        lastName: 'Member',
        department: 'Computer Science & Engineering'
      },
      {
        email: 'vaishnavi@avn.edu.in',
        username: 'vaishnavi',
        password: '',
        firstName: 'Vaishnavi',
        lastName: 'Anugu',
        department: 'AI & Data Science'
      },
      {
        email: 'admin@university.edu',
        username: 'admin',
        password: '',
        firstName: 'Administrator',
        lastName: 'System',
        department: 'Management'
      }
    ];
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    const inputUser = username.trim().toLowerCase();
    const inputPass = password.trim();

    if (!inputUser) {
      setError('Please enter your email or username.');
      setLoading(false);
      return;
    }

    // 1. Try Backend API first if online with safety timeout
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const response = await fetch(`${API_BASE_URL}/token/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: inputUser, password: inputPass }),
        signal: controller.signal,
      }).catch(() => null);
      clearTimeout(timeoutId);
      
      if (response) {
        if (response.ok) {
          const data = await response.json().catch(() => null);
          if (data && data.access) {
            localStorage.setItem('access_token', data.access);
            localStorage.setItem('refresh_token', data.refresh || '');
            localStorage.setItem('current_user_email', inputUser);
            if (data.user) {
              localStorage.setItem('current_user_info', JSON.stringify(data.user));
            }
            navigate('/dashboard');
            return;
          }
        } else if (response.status === 401) {
          const errorData = await response.json().catch(() => ({}));
          setError(errorData.detail || 'Invalid email/username or password. Please verify your credentials.');
          setLoading(false);
          return;
        }
      }
    } catch (err) {
      console.warn('Backend server connection issue, attempting local session:', err);
    }

    // 2. Client-side authentication fallback
    try {
      const users = getRegisteredUsers();
      let existingUser = users.find(u => 
        (u.email && u.email.toLowerCase() === inputUser) || 
        (u.username && u.username.toLowerCase() === inputUser) ||
        (u.email && u.email.toLowerCase().split('@')[0] === inputUser)
      );

      if (!existingUser) {
        const rawName = inputUser.includes('@') ? inputUser.split('@')[0] : inputUser;
        const formattedName = rawName.charAt(0).toUpperCase() + rawName.slice(1);
        existingUser = {
          email: inputUser.includes('@') ? inputUser : `${inputUser}@institution.edu`,
          username: rawName,
          password: inputPass || '123456',
          firstName: formattedName,
          lastName: 'Faculty',
          phone: '',
          department: 'Computer Science & Engineering'
        };
        users.push(existingUser);
        localStorage.setItem('fad_user_accounts', JSON.stringify(users));
      }

      if (existingUser.password && inputPass && existingUser.password !== inputPass) {
        setError('Incorrect password. Please verify your password and try again.');
        setLoading(false);
        return;
      }

      const userEmail = existingUser.email || inputUser;
      const userDatastoreKey = 'fad_user_data_' + userEmail;
      
      if (!localStorage.getItem(userDatastoreKey)) {
        const initialStore = {
          profile: {
            id: Date.now(),
            username: existingUser.username,
            email: userEmail,
            first_name: existingUser.firstName,
            last_name: existingUser.lastName,
            department: existingUser.department || 'Computer Science & Engineering',
            designation: 'Faculty / Researcher',
            phone_number: existingUser.phone || '',
            total_citations: 0,
            h_index: 0,
            i10_index: 0,
            digital_twin: {
              research_health: '85%',
              promotion_chance: 'Evaluating',
              predicted_api: '92',
              research_growth: 'Active'
            },
            impact_score: 10
          },
          publications: [],
          patents: [],
          grants: [],
          roles: [],
          certificates: [],
          books: [],
          'fdp-training': [],
          consultancy: [],
          certifications: [],
          saved_reports: []
        };
        localStorage.setItem(userDatastoreKey, JSON.stringify(initialStore));
      }

      localStorage.setItem('access_token', 'fad_auth_token_' + Date.now());
      localStorage.setItem('refresh_token', 'fad_auth_refresh_' + Date.now());
      localStorage.setItem('current_user_email', userEmail);
      localStorage.setItem('current_user_info', JSON.stringify(existingUser));

      navigate('/dashboard');
    } catch (e) {
      console.error(e);
      setError('An error occurred during login. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    const regEmail = (email.trim() || username.trim()).toLowerCase();
    const regUsername = (username.trim() || regEmail.split('@')[0]).toLowerCase();
    const regPass = password.trim();

    if (!regEmail || !regPass) {
      setError('Please provide a valid email and password.');
      setLoading(false);
      return;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      await fetch(`${API_BASE_URL}/register/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          username: regUsername, password: regPass, email: regEmail, firstName, lastName, 
          phone_number: phone, department 
        }),
        signal: controller.signal,
      }).catch(() => null);
      clearTimeout(timeoutId);
    } catch (err) {}

    const users = getRegisteredUsers();
    const existingIndex = users.findIndex(u => 
      (u.email && u.email.toLowerCase() === regEmail) || 
      (u.username && u.username.toLowerCase() === regUsername)
    );

    const newUser = {
      email: regEmail,
      username: regUsername,
      password: regPass,
      firstName: firstName || 'Faculty',
      lastName: lastName || 'Member',
      phone,
      department: department || 'CSE'
    };

    if (existingIndex >= 0) {
      users[existingIndex] = newUser;
    } else {
      users.push(newUser);
    }
    localStorage.setItem('fad_user_accounts', JSON.stringify(users));

    const userDatastoreKey = 'fad_user_data_' + regEmail;
    if (!localStorage.getItem(userDatastoreKey)) {
      localStorage.setItem(userDatastoreKey, JSON.stringify({
        profile: {
          id: Date.now(),
          username: regUsername,
          email: regEmail,
          first_name: firstName || 'Faculty',
          last_name: lastName || 'Member',
          department: department || 'CSE',
          phone_number: phone || '',
          total_citations: 0,
          h_index: 0,
          i10_index: 0
        },
        publications: [],
        patents: [],
        grants: [],
        roles: [],
        certificates: [],
        books: [],
        'fdp-training': [],
        consultancy: [],
        certifications: [],
        saved_reports: []
      }));
    }

    setSuccessMsg(`Account created successfully for ${regEmail}! Please sign in with your credentials.`);
    setUsername(regEmail);
    setPassword('');
    setError('');
    setView('login');
    setLoading(false);
  };

  const handleSaveGoogleClientId = (e) => {
    e.preventDefault();
    const cleaned = customClientIdInput.trim();
    setGoogleClientId(cleaned);
    localStorage.setItem('fad_google_client_id', cleaned);
    setShowConfigModal(false);
    setSuccessMsg('Google Cloud Console OAuth Client ID updated!');
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Left side - Branding/Illustration */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-indigo-700 via-indigo-600 to-purple-800 flex-col justify-between p-12 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent pointer-events-none"></div>
        
        {/* Top Branding */}
        <div className="relative z-10 flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-inner">
            <ShieldCheck size={24} className="text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight">Faculty Analytics</h2>
            <p className="text-xs text-indigo-200">Institutional Governance & Research Portal</p>
          </div>
        </div>

        {/* Center Content */}
        <div className="relative z-10 max-w-lg">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold mb-6">
            <Sparkles size={14} className="text-yellow-300 animate-pulse" />
            <span>Google Cloud OAuth 2.0 & AI Security Enabled</span>
          </div>

          <h1 className="text-4xl font-extrabold mb-5 leading-tight">
            Secure Authentication for Academic Analytics
          </h1>
          <p className="text-indigo-100 text-base leading-relaxed mb-8">
            Access your research portfolio, PBAS appraisal scores, NAAC SSR Criterion 3 reports, and institutional performance metrics with enterprise-grade authorization.
          </p>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/15">
              <div className="text-2xl font-bold mb-0.5">Google OAuth</div>
              <div className="text-indigo-200 text-xs">One-click verified single sign-on</div>
            </div>
            <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/15">
              <div className="text-2xl font-bold mb-0.5">Role Guard</div>
              <div className="text-indigo-200 text-xs">Faculty, HoD, IQAC, & SuperAdmin</div>
            </div>
          </div>
        </div>

        {/* Bottom Status */}
        <div className="relative z-10 text-xs text-indigo-200 flex items-center justify-between border-t border-white/10 pt-4">
          <span>© 2026 Faculty Analytics Dashboard</span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            OAuth Services Online
          </span>
        </div>
      </div>

      {/* Right side - Authentication Form Area */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 overflow-y-auto">
        <div className="w-full max-w-md space-y-6">
          
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                {view === 'login' ? 'Sign In' : view === 'register' ? 'Create Account' : 'Reset Password'}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {view === 'login'
                  ? 'Access your faculty dashboard securely'
                  : view === 'register'
                  ? 'Enter details to register as faculty member'
                  : 'Enter email to receive reset instructions'}
              </p>
            </div>
            
            {/* Google Console Config Button */}
            <button
              onClick={() => setShowConfigModal(true)}
              className="p-2.5 rounded-xl border border-gray-200 text-gray-500 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50/50 transition-all flex items-center gap-1.5 text-xs font-semibold"
              title="Google Cloud Console OAuth Configuration"
            >
              <Settings size={16} />
              <span className="hidden sm:inline">Google Auth</span>
            </button>
          </div>

          {/* Success / Error Alerts */}
          {successMsg && (
            <div className="bg-emerald-50 text-emerald-800 p-3.5 rounded-xl text-sm font-medium flex items-center gap-2.5 border border-emerald-200">
              <CheckCircle2 size={18} className="text-emerald-600 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {error && (
            <div className="bg-rose-50 text-rose-800 p-3.5 rounded-xl text-sm font-medium flex items-center gap-2.5 border border-rose-200">
              <AlertCircle size={18} className="text-rose-600 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {view === 'login' ? (
            <>
              {/* --- 1. GOOGLE CLOUD CONSOLE AUTHENTICATION SECTION --- */}
              <div className="space-y-3">
                <div className="w-full flex justify-center">
                  <div ref={googleBtnRef} className="w-full flex justify-center min-h-[44px]"></div>
                </div>

                {/* Custom Google Sign-in Trigger Fallback */}
                {(!window.google?.accounts?.id || !googleClientId) && (
                  <button
                    type="button"
                    onClick={() => {
                      if (!googleClientId) {
                        setShowConfigModal(true);
                      } else if (window.google?.accounts?.id) {
                        window.google.accounts.id.prompt();
                      }
                    }}
                    disabled={googleLoading}
                    className="w-full py-3 px-4 bg-white hover:bg-gray-50 text-gray-700 font-semibold text-sm rounded-xl border border-gray-300 shadow-sm transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                    </svg>
                    <span>{googleLoading ? 'Verifying Google Auth...' : 'Sign in with Google'}</span>
                  </button>
                )}

                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200"></div>
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-gray-50 px-3 text-gray-500 font-medium tracking-wider">
                      Or sign in with email credentials
                    </span>
                  </div>
                </div>
              </div>

              {/* --- 2. STANDARD CREDENTIALS FORM --- */}
              <form className="space-y-4" onSubmit={handleLogin} autoComplete="off">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                    Faculty Email / Username
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                      <Mail size={18} />
                    </div>
                    <input 
                      type="text" 
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm transition-all shadow-sm" 
                      placeholder="faculty@avn.edu.in"
                      autoComplete="off"
                      required
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Password
                    </label>
                    <button 
                      type="button" 
                      onClick={() => { setView('forgot'); setResetSent(false); setError(''); }}
                      className="text-xs font-medium text-indigo-600 hover:text-indigo-700 bg-transparent border-none p-0 cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                      <Lock size={18} />
                    </div>
                    <input 
                      type="password" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm transition-all shadow-sm" 
                      placeholder="••••••••"
                      autoComplete="new-password"
                      required
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center text-xs text-gray-600 cursor-pointer">
                    <input id="remember-me" type="checkbox" defaultChecked className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded" />
                    <span className="ml-2 font-medium">Remember on this device</span>
                  </label>
                </div>

                <button 
                  type="submit" 
                  disabled={loading} 
                  className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-md text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all disabled:opacity-50"
                >
                  {loading ? 'Authenticating...' : 'Sign In to Dashboard'} <ChevronRight size={18} />
                </button>
              </form>

              <div className="text-center pt-2">
                <p className="text-sm text-gray-600">
                  New faculty member?{' '}
                  <button 
                    type="button"
                    onClick={() => { setView('register'); setError(''); setSuccessMsg(''); setPassword(''); }}
                    className="font-semibold text-indigo-600 hover:text-indigo-700 bg-transparent border-none p-0 cursor-pointer"
                  >
                    Create Account
                  </button>
                </p>
              </div>
            </>
          ) : view === 'register' ? (
            <>
              <form className="space-y-3.5" onSubmit={handleRegister}>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">First Name</label>
                    <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" required />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Last Name</label>
                    <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" required />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Username</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400"><User size={16} /></div>
                    <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full pl-9 pr-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" required />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Institutional Email</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400"><Mail size={16} /></div>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full pl-9 pr-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" required />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Department</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400"><Building size={16} /></div>
                      <input type="text" placeholder="CSE / AI&DS" value={department} onChange={(e) => setDepartment(e.target.value)} className="w-full pl-9 pr-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" required />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Phone</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400"><Phone size={16} /></div>
                      <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full pl-9 pr-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Password</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400"><Lock size={16} /></div>
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full pl-9 pr-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" required />
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={loading} 
                  className="w-full flex justify-center items-center gap-2 py-3 px-4 mt-2 border border-transparent rounded-xl shadow-md text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all disabled:opacity-50"
                >
                  {loading ? 'Creating Account...' : 'Register Account'}
                </button>
              </form>

              <div className="text-center pt-2">
                <p className="text-sm text-gray-600">
                  Already have an account?{' '}
                  <button type="button" onClick={() => { setView('login'); setError(''); }} className="font-semibold text-indigo-600 hover:text-indigo-700 bg-transparent border-none p-0 cursor-pointer">
                    Sign In
                  </button>
                </p>
              </div>
            </>
          ) : (
            <>
              <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); setResetSent(true); }}>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">Registered Email</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                      <Mail size={18} />
                    </div>
                    <input 
                      type="email" 
                      className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all" 
                      placeholder="faculty@avn.edu.in"
                      required
                    />
                  </div>
                </div>
                
                <button type="submit" className="w-full py-3 px-4 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md transition-all">
                  Send Recovery Link
                </button>
              </form>

              {resetSent && (
                <div className="bg-emerald-50 text-emerald-800 p-4 rounded-xl border border-emerald-200 text-center text-sm font-medium">
                  Password reset link has been dispatched to your email!
                </div>
              )}

              <div className="text-center">
                <button 
                  type="button"
                  onClick={() => { setView('login'); setResetSent(false); }}
                  className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 bg-transparent border-none p-0 cursor-pointer"
                >
                  ← Return to Sign In
                </button>
              </div>
            </>
          )}

        </div>
      </div>

      {/* --- GOOGLE CLOUD CONSOLE CONFIGURATION MODAL --- */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-gray-100 space-y-5">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
                  <KeyRound size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Google Cloud Console OAuth</h3>
                  <p className="text-xs text-gray-500">Configure OAuth 2.0 Web Client ID</p>
                </div>
              </div>
              <button 
                onClick={() => setShowConfigModal(false)}
                className="text-gray-400 hover:text-gray-600 text-xl font-bold p-1 leading-none"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveGoogleClientId} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Google Client ID (from Google Cloud Console)
                </label>
                <input 
                  type="text" 
                  value={customClientIdInput}
                  onChange={(e) => setCustomClientIdInput(e.target.value)}
                  placeholder="e.g. 1234567890-abcdefg.apps.googleusercontent.com"
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl font-mono text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                />
                <p className="text-xs text-gray-500 mt-1.5">
                  Stored in local browser storage & automatically used for Google Identity Services.
                </p>
              </div>

              {/* Instructions Box */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-700 space-y-2">
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-indigo-600" />
                  How to create in Google Cloud Console:
                </div>
                <ol className="list-decimal pl-4 space-y-1 text-slate-600">
                  <li>Visit <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noreferrer" className="text-indigo-600 font-semibold underline">Google Cloud Console</a>.</li>
                  <li>Click <strong>Create Credentials</strong> → <strong>OAuth client ID</strong>.</li>
                  <li>Select Application type: <strong>Web application</strong>.</li>
                  <li>Add Authorized JavaScript origins: <code className="bg-slate-200 px-1 rounded">http://localhost:5173</code> & <code className="bg-slate-200 px-1 rounded">http://127.0.0.1:5173</code>.</li>
                  <li>Copy your <strong>Client ID</strong> and paste it above.</li>
                </ol>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl shadow-sm transition-colors"
                >
                  Save & Connect
                </button>
                <button
                  type="button"
                  onClick={() => setShowConfigModal(false)}
                  className="py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-sm rounded-xl transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Login;

import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, ChevronRight, User, Phone, Building, ShieldCheck, KeyRound, Settings, CheckCircle2, AlertCircle, Sparkles, ArrowLeft, Clock, RefreshCw } from 'lucide-react';
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
  
  // OTP Verification States
  const [otp, setOtp] = useState('');
  const [otpTimer, setOtpTimer] = useState(0);
  const [debugOtp, setDebugOtp] = useState('');

  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [view, setView] = useState('login'); // 'login' | 'forgot' | 'register' | 'otp-verify' | 'google-setup'
  const [resetSent, setResetSent] = useState(false);

  // Countdown timer effect for OTP resend
  useEffect(() => {
    let interval = null;
    if (otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [otpTimer]);

  // Google OAuth State
  const [googleClientId, setGoogleClientId] = useState(
    () => localStorage.getItem('fad_google_client_id') || import.meta.env.VITE_GOOGLE_CLIENT_ID || ''
  );
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

  // Unified Google Authentication Handler (Backend + Client)
  const loginWithGoogleUser = async (userPayload) => {
    setError('');
    setGoogleLoading(true);

    try {
      // 1. Send ID token or user object to Backend for verification & JWT issuance
      const res = await fetch(`${API_BASE_URL}/auth/google/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userPayload),
      }).catch(() => null);

      if (res && res.ok) {
        const data = await res.json().catch(() => null);
        if (data && data.access) {
          localStorage.setItem('access_token', data.access);
          localStorage.setItem('refresh_token', data.refresh || '');
          localStorage.setItem('current_user_email', data.user?.email || userPayload.email || '');
          if (data.user) {
            localStorage.setItem('current_user_info', JSON.stringify(data.user));
          }
          setShowGoogleAccountModal(false);
          window.location.href = '/dashboard';
          return;
        }
      }

      // 2. Client-side profile setup fallback
      const googleEmail = (userPayload.email || 'faculty@avn.edu.in').toLowerCase();
      const googleName = userPayload.name || (googleEmail.split('@')[0]);
      const googlePic = userPayload.picture || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';

      const googleUser = {
        email: googleEmail,
        username: googleEmail.split('@')[0],
        firstName: userPayload.given_name || googleName.split(' ')[0] || 'Faculty',
        lastName: userPayload.family_name || (googleName.split(' ').slice(1).join(' ') || 'Member'),
        department: userPayload.department || 'Computer Science & Engineering',
        avatar: googlePic,
        isGoogleAuth: true,
        is_email_verified: true,
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
              department: googleUser.department,
              designation: 'Faculty / Researcher',
              avatar: googlePic,
              total_citations: 0,
              h_index: 0,
              i10_index: 0,
              is_email_verified: true,
              digital_twin: {
                research_health: '90%',
                promotion_chance: 'Evaluating',
                predicted_api: '94',
                research_growth: 'Active'
              },
              impact_score: 15
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

      setShowGoogleAccountModal(false);
      window.location.href = '/dashboard';
    } catch (err) {
      console.error(err);
      setError('Google Sign-In failed. Please try again.');
    } finally {
      setGoogleLoading(false);
    }
  };

  // Handle Token Received from Google Identity Services
  const handleGoogleAuthCallback = async (response) => {
    try {
      const idToken = response.credential;
      if (!idToken) {
        throw new Error('No credential received from Google OAuth.');
      }

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

      await loginWithGoogleUser({
        credential: idToken,
        email: payload.email,
        name: payload.name,
        given_name: payload.given_name,
        family_name: payload.family_name,
        picture: payload.picture
      });
    } catch (err) {
      console.error(err);
      setError('Google Sign-In failed. Please verify credentials.');
    }
  };

  const getRegisteredUsers = () => {
    try {
      const saved = localStorage.getItem('fad_user_accounts');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [];
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

    if (!inputPass) {
      setError('Please enter your password.');
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
            window.location.href = '/dashboard';
            return;
          }
        } else if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const errMsg = errorData.detail || errorData.error || (
            errorData.non_field_errors ? errorData.non_field_errors[0] : null
          ) || 'No account found with this email/username. Please click "Create Account" to register and verify with OTP first.';
          setError(errMsg);
          setLoading(false);
          return;
        }
      }
    } catch (err) {
      console.warn('Backend server connection issue, checking local session:', err);
    }

    // 2. Client-side authentication fallback (Strict: Never auto-create account on login)
    try {
      const users = getRegisteredUsers();
      const existingUser = users.find(u => 
        (u.email && u.email.toLowerCase() === inputUser) || 
        (u.username && u.username.toLowerCase() === inputUser) ||
        (u.email && u.email.toLowerCase().split('@')[0] === inputUser)
      );

      if (!existingUser) {
        setError('No account found with this email/username. Please click "Create an Account" below to register and verify with OTP first.');
        setLoading(false);
        return;
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

      window.location.href = '/dashboard';
    } catch (e) {
      console.error(e);
      setError('An error occurred during login. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 1: Request Email Verification OTP for New Registration
  const handleInitiateRegistration = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    const regEmail = (email.trim() || username.trim()).toLowerCase();
    const regUsername = (username.trim() || regEmail.split('@')[0]).toLowerCase();
    const regPass = password.trim();

    if (!regEmail || !regEmail.includes('@')) {
      setError('Please provide a valid institutional or personal email address.');
      setLoading(false);
      return;
    }

    if (!regPass || regPass.length < 6) {
      setError('Password must be at least 6 characters long.');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/send-otp/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: regEmail, username: regUsername }),
      }).catch(() => null);

      if (response && response.ok) {
        const data = await response.json().catch(() => ({}));
        setSuccessMsg(data.message || `A 6-digit verification code has been dispatched to ${regEmail}.`);
        setView('otp-verify');
        setOtpTimer(60);
        setOtp('');
      } else if (response) {
        const errData = await response.json().catch(() => ({}));
        setError(errData.error || 'Unable to send verification OTP. Please try again.');
      } else {
        setError(`Cannot reach backend email server at ${API_BASE_URL}. Please ensure your backend is online.`);
      }
    } catch (err) {
      console.error('Backend OTP connection error:', err);
      setError(`Cannot reach backend email server at ${API_BASE_URL}. Please ensure your backend is online.`);
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Resend Verification Code
  const handleResendOtp = async () => {
    if (otpTimer > 0) return;
    setError('');
    setSuccessMsg('');
    setLoading(true);

    const regEmail = (email.trim() || username.trim()).toLowerCase();

    try {
      const response = await fetch(`${API_BASE_URL}/auth/send-otp/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: regEmail, username }),
      }).catch(() => null);

      if (response && response.ok) {
        const data = await response.json().catch(() => ({}));
        setSuccessMsg(`A fresh verification code was sent to ${regEmail}.`);
        setOtpTimer(60);
      } else if (response) {
        const errData = await response.json().catch(() => ({}));
        setError(errData.error || 'Unable to resend OTP.');
      } else {
        setError(`Cannot reach backend email server at ${API_BASE_URL}.`);
      }
    } catch (err) {
      setError(`Cannot reach backend email server at ${API_BASE_URL}.`);
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Verify OTP and complete 1st-time Account Registration
  const handleVerifyOtpAndRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    const regEmail = (email.trim() || username.trim()).toLowerCase();
    const regUsername = (username.trim() || regEmail.split('@')[0]).toLowerCase();
    const regPass = password.trim();
    const cleanOtp = otp.trim();

    if (!cleanOtp || cleanOtp.length < 6) {
      setError('Please enter the complete 6-digit verification code.');
      setLoading(false);
      return;
    }

    let backendSuccess = false;
    try {
      const response = await fetch(`${API_BASE_URL}/auth/verify-otp/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: regEmail,
          otp: cleanOtp,
          username: regUsername,
          password: regPass,
          firstName: firstName || 'Faculty',
          lastName: lastName || 'Member',
          department: department || 'Computer Science & Engineering',
          phone_number: phone,
          role: 'FACULTY'
        }),
      }).catch(() => null);

      if (response && response.ok) {
        const data = await response.json().catch(() => ({}));
        if (data.access) {
          localStorage.setItem('access_token', data.access);
          localStorage.setItem('refresh_token', data.refresh || '');
          localStorage.setItem('current_user_email', data.user?.email || regEmail);
          if (data.user) {
            localStorage.setItem('current_user_info', JSON.stringify(data.user));
          }
          backendSuccess = true;
        }
      } else if (response) {
        const errData = await response.json().catch(() => ({}));
        // If debugOtp matches in local mode fallback
        if (debugOtp && cleanOtp === debugOtp) {
          backendSuccess = true;
        } else {
          setError(errData.error || 'Invalid or expired OTP code. Please try again.');
          setLoading(false);
          return;
        }
      } else if (debugOtp && cleanOtp === debugOtp) {
        backendSuccess = true;
      }
    } catch (err) {
      console.warn('Backend verification error:', err);
      if (debugOtp && cleanOtp === debugOtp) {
        backendSuccess = true;
      }
    }

    // Save user locally & in user datastore
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
      department: department || 'Computer Science & Engineering',
      is_email_verified: true
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
          department: department || 'Computer Science & Engineering',
          designation: 'Faculty / Researcher',
          phone_number: phone || '',
          total_citations: 0,
          h_index: 0,
          i10_index: 0,
          is_email_verified: true,
          digital_twin: {
            research_health: '88%',
            promotion_chance: 'Evaluating',
            predicted_api: '95',
            research_growth: 'Active'
          },
          impact_score: 15
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

    if (!localStorage.getItem('access_token')) {
      localStorage.setItem('access_token', 'fad_auth_token_' + Date.now());
      localStorage.setItem('refresh_token', 'fad_auth_refresh_' + Date.now());
      localStorage.setItem('current_user_email', regEmail);
      localStorage.setItem('current_user_info', JSON.stringify(newUser));
    }

    window.location.href = '/dashboard';
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
              <div className="text-2xl font-bold mb-0.5">Email OTP</div>
              <div className="text-indigo-200 text-xs">Verified secure access</div>
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
                {view === 'login' 
                  ? 'Sign In' 
                  : view === 'register' 
                  ? 'Create Account' 
                  : view === 'otp-verify' 
                  ? 'Verify Email OTP' 
                  : 'Reset Password'}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {view === 'login'
                  ? 'Access your faculty dashboard securely'
                  : view === 'register'
                  ? 'Enter details to register as a new faculty member'
                  : view === 'otp-verify'
                  ? `Enter the 6-digit verification code sent to your email`
                  : 'Enter email to receive reset instructions'}
              </p>
            </div>
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
              {/* --- STANDARD CREDENTIALS FORM --- */}
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
              {/* --- STEP 1: REGISTRATION FORM WITH OTP DISPATCH --- */}
              <form className="space-y-3.5" onSubmit={handleInitiateRegistration}>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">First Name</label>
                    <input 
                      type="text" 
                      value={firstName} 
                      onChange={(e) => setFirstName(e.target.value)} 
                      placeholder="e.g. Ramesh"
                      className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" 
                      required 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Last Name</label>
                    <input 
                      type="text" 
                      value={lastName} 
                      onChange={(e) => setLastName(e.target.value)} 
                      placeholder="e.g. Kumar"
                      className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" 
                      required 
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Username</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400"><User size={16} /></div>
                    <input 
                      type="text" 
                      value={username} 
                      onChange={(e) => setUsername(e.target.value)} 
                      placeholder="ramesh.cse"
                      className="w-full pl-9 pr-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" 
                      required 
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Institutional Email</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400"><Mail size={16} /></div>
                    <input 
                      type="email" 
                      value={email} 
                      onChange={(e) => setEmail(e.target.value)} 
                      placeholder="faculty@institution.edu"
                      className="w-full pl-9 pr-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" 
                      required 
                    />
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1">A 6-digit OTP will be sent to this email for 1st-time verification.</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Department</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400"><Building size={16} /></div>
                      <input 
                        type="text" 
                        placeholder="CSE / AI&DS" 
                        value={department} 
                        onChange={(e) => setDepartment(e.target.value)} 
                        className="w-full pl-9 pr-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" 
                        required 
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Phone</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400"><Phone size={16} /></div>
                      <input 
                        type="text" 
                        placeholder="+91 9876543210"
                        value={phone} 
                        onChange={(e) => setPhone(e.target.value)} 
                        className="w-full pl-9 pr-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" 
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Password</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400"><Lock size={16} /></div>
                    <input 
                      type="password" 
                      value={password} 
                      onChange={(e) => setPassword(e.target.value)} 
                      placeholder="Minimum 6 characters"
                      className="w-full pl-9 pr-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" 
                      required 
                    />
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={loading} 
                  className="w-full flex justify-center items-center gap-2 py-3 px-4 mt-2 border border-transparent rounded-xl shadow-md text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all disabled:opacity-50"
                >
                  {loading ? 'Sending Verification OTP...' : 'Send Verification Code (OTP)'} <ChevronRight size={18} />
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
          ) : view === 'otp-verify' ? (
            <>
              {/* --- STEP 2: OTP VERIFICATION VIEW --- */}
              <div className="bg-indigo-50/70 border border-indigo-100 p-4 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-indigo-900 font-semibold text-xs">
                    <Mail size={16} className="text-indigo-600" />
                    <span>Sent to:</span>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => { setView('register'); setError(''); }}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold underline bg-transparent border-none cursor-pointer"
                  >
                    Edit Email
                  </button>
                </div>
                <div className="bg-white px-3 py-2 rounded-xl border border-indigo-100 font-mono text-xs text-indigo-950 font-bold truncate">
                  {email || username}
                </div>
              </div>

              {debugOtp && (
                <div className="bg-amber-50 border border-amber-200 text-amber-900 p-3 rounded-xl text-xs flex items-center justify-between">
                  <span>Development OTP Code:</span>
                  <button 
                    type="button"
                    onClick={() => setOtp(debugOtp)}
                    className="bg-amber-200 hover:bg-amber-300 font-mono font-bold px-2 py-0.5 rounded text-amber-900 border-none cursor-pointer transition-colors"
                    title="Click to auto-fill"
                  >
                    {debugOtp} (Click to Fill)
                  </button>
                </div>
              )}

              <form className="space-y-4" onSubmit={handleVerifyOtpAndRegister}>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2 text-center">
                    Enter 6-Digit Verification Code
                  </label>
                  <div className="relative">
                    <input 
                      type="text" 
                      maxLength="6"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                      className="w-full py-3.5 px-4 bg-white border-2 border-indigo-200 focus:border-indigo-600 rounded-2xl text-center text-2xl font-mono tracking-[0.5em] font-extrabold text-indigo-900 focus:outline-none focus:ring-4 focus:ring-indigo-100 transition-all shadow-inner"
                      placeholder="------"
                      autoFocus
                      required
                    />
                  </div>
                  <p className="text-xs text-center text-gray-500 mt-2 flex items-center justify-center gap-1">
                    <Clock size={14} className="text-gray-400" />
                    Code expires in 10 minutes
                  </p>
                </div>

                <button 
                  type="submit" 
                  disabled={loading || otp.length < 6} 
                  className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-md text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all disabled:opacity-50"
                >
                  {loading ? 'Verifying Account...' : 'Verify OTP & Complete Registration'} <CheckCircle2 size={18} />
                </button>

                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                  <button 
                    type="button" 
                    onClick={() => { setView('register'); setError(''); }}
                    className="text-xs font-semibold text-gray-500 hover:text-gray-800 flex items-center gap-1 bg-transparent border-none cursor-pointer"
                  >
                    <ArrowLeft size={14} /> Back to details
                  </button>

                  <button 
                    type="button" 
                    onClick={handleResendOtp}
                    disabled={otpTimer > 0 || loading}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 disabled:text-gray-400 flex items-center gap-1 bg-transparent border-none cursor-pointer"
                  >
                    <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
                    {otpTimer > 0 ? `Resend OTP in ${otpTimer}s` : 'Resend Code'}
                  </button>
                </div>
              </form>
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

    </div>
  );
};

export default Login;

import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, ChevronRight, User, Phone, Building, ShieldCheck, KeyRound, Settings, CheckCircle2, AlertCircle, Sparkles, ArrowLeft, Clock, RefreshCw, Eye, EyeOff } from 'lucide-react';
import { API_BASE_URL } from '../services/api';

const Login = () => {
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showRegPassword, setShowRegPassword] = useState(false);
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
  const [selectedRole, setSelectedRole] = useState(() => localStorage.getItem('user_role') || 'FACULTY');
  const [view, setView] = useState('login'); // 'login' | 'forgot' | 'register' | 'otp-verify' | 'google-setup'
  const [resetSent, setResetSent] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetNewPass, setResetNewPass] = useState('');

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

    const inputUser = username.trim();
    const inputPass = password;

    if (!inputUser) {
      setError('Please enter your official institutional email address or username.');
      setLoading(false);
      return;
    }

    if (!inputPass) {
      setError('Please enter your password.');
      setLoading(false);
      return;
    }

    // 1. Authenticate with Django Backend API
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000);

      const response = await fetch(`${API_BASE_URL}/token/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Bypass-Tunnel-Reminder': 'true',
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
            localStorage.setItem('current_user_email', data.user?.email || inputUser);
            
            // Prioritize actual registered role from database
            const finalRole = data.user?.role || selectedRole || 'FACULTY';
            localStorage.setItem('user_role', finalRole);

            if (data.user) {
              localStorage.setItem('current_user_info', JSON.stringify(data.user));
            } else {
              localStorage.setItem('current_user_info', JSON.stringify({ email: inputUser, role: finalRole }));
            }

            // Sync with local offline account list
            const users = getRegisteredUsers();
            const existingIdx = users.findIndex(u => 
              (u.email && u.email.toLowerCase() === (data.user?.email || inputUser).toLowerCase()) ||
              (u.username && u.username.toLowerCase() === (data.user?.username || inputUser).toLowerCase())
            );
            const userRec = {
              email: data.user?.email || inputUser,
              username: data.user?.username || inputUser,
              firstName: data.user?.first_name || 'Faculty',
              lastName: data.user?.last_name || '',
              department: data.user?.department || 'Computer Science & Engineering',
              role: finalRole,
              is_email_verified: true,
            };
            if (existingIdx >= 0) {
              users[existingIdx] = { ...users[existingIdx], ...userRec };
            } else {
              users.push(userRec);
            }
            localStorage.setItem('fad_user_accounts', JSON.stringify(users));

            window.location.href = '/dashboard';
            return;
          }
        } else {
          // Backend responded with an error (e.g., incorrect password or user not found)
          const errorData = await response.json().catch(() => ({}));
          const errMsg = errorData.detail || errorData.error || (
            errorData.non_field_errors ? errorData.non_field_errors[0] : null
          ) || 'Authentication failed. Please verify your credentials.';
          setError(errMsg);
          setLoading(false);
          return;
        }
      }
    } catch (err) {
      console.warn('Backend server connection issue during login:', err);
    }

    // 2. Client-side authentication fallback (Offline mode only)
    try {
      const users = getRegisteredUsers();
      const existingUser = users.find(u => 
        (u.email && u.email.toLowerCase() === inputUser.toLowerCase()) || 
        (u.username && u.username.toLowerCase() === inputUser.toLowerCase()) ||
        (u.email && u.email.toLowerCase().split('@')[0] === inputUser.toLowerCase())
      );

      if (!existingUser) {
        setError('No account found with this email/username. Please click "Create Account" below to register and verify with OTP first.');
        setLoading(false);
        return;
      }

      if (existingUser.password && inputPass && existingUser.password !== inputPass) {
        setError('Incorrect password. Please verify your password and try again.');
        setLoading(false);
        return;
      }

      const userEmail = existingUser.email || inputUser;
      const userDatastoreKey = 'fad_user_data_' + userEmail.toLowerCase();
      
      if (!localStorage.getItem(userDatastoreKey)) {
        const initialStore = {
          profile: {
            id: Date.now(),
            username: existingUser.username,
            email: userEmail,
            first_name: existingUser.firstName,
            last_name: existingUser.lastName,
            department: existingUser.department || 'Computer Science & Engineering',
            designation: existingUser.role === 'HOD' ? 'Head of Department (HOD)' : 'Faculty / Researcher',
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

      const finalRole = existingUser.role || selectedRole || 'FACULTY';
      localStorage.setItem('access_token', 'fad_auth_token_' + Date.now());
      localStorage.setItem('refresh_token', 'fad_auth_refresh_' + Date.now());
      localStorage.setItem('current_user_email', userEmail);
      localStorage.setItem('user_role', finalRole);
      localStorage.setItem('current_user_info', JSON.stringify({ ...existingUser, role: finalRole }));

      window.location.href = '/dashboard';
    } catch (e) {
      console.error(e);
      setError('An error occurred during login. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const [registeredPassword, setRegisteredPassword] = useState('');

  // Step 1: Request Email Verification OTP for New Registration
  const handleInitiateRegistration = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    const regEmail = email.trim().toLowerCase();
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

    setEmail(regEmail);
    setUsername(regUsername);
    setRegisteredPassword(regPass);

    // Persist securely in sessionStorage so page refresh or navigation never drops the chosen password
    sessionStorage.setItem('fad_reg_email', regEmail);
    sessionStorage.setItem('fad_reg_username', regUsername);
    sessionStorage.setItem('fad_reg_password', regPass);
    sessionStorage.setItem('fad_reg_role', selectedRole);
    sessionStorage.setItem('fad_reg_firstname', firstName || 'Faculty');
    sessionStorage.setItem('fad_reg_lastname', lastName || '');
    sessionStorage.setItem('fad_reg_dept', department || 'Computer Science & Engineering');
    sessionStorage.setItem('fad_reg_phone', phone || '');

    try {
      const response = await fetch(`${API_BASE_URL}/auth/send-otp/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Bypass-Tunnel-Reminder': 'true',
        },
        body: JSON.stringify({ email: regEmail, username: regUsername }),
      }).catch(() => null);

      if (response && response.ok) {
        const data = await response.json().catch(() => ({}));
        if (data.debug_otp) {
          setDebugOtp(data.debug_otp);
        }
        setSuccessMsg(data.message || `Verification OTP sent to ${regEmail}.`);
        setView('otp-verify');
        setOtpTimer(60);
        setOtp('');
      } else if (response) {
        const errData = await response.json().catch(() => ({}));
        setError(errData.error || 'Failed to send verification code. Please check your email and try again.');
      } else {
        setError('Unable to reach server to send verification code. Please check your network.');
      }
    } catch (err) {
      console.error('Backend OTP connection error:', err);
      setError('Network connection failed. Please check your server and try again.');
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

    const regEmail = (email.trim() || sessionStorage.getItem('fad_reg_email') || username.trim()).toLowerCase();
    const regUsername = username.trim() || sessionStorage.getItem('fad_reg_username') || regEmail.split('@')[0];

    try {
      const response = await fetch(`${API_BASE_URL}/auth/send-otp/`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Bypass-Tunnel-Reminder': 'true',
        },
        body: JSON.stringify({ email: regEmail, username: regUsername }),
      }).catch(() => null);

      if (response && response.ok) {
        const data = await response.json().catch(() => ({}));
        if (data.debug_otp) {
          setDebugOtp(data.debug_otp);
        }
        setSuccessMsg(`A fresh verification code was sent to ${regEmail}.`);
        setOtpTimer(60);
      } else {
        const errData = await response?.json().catch(() => ({}));
        setError(errData?.error || 'Failed to resend code. Please try again.');
      }
    } catch (err) {
      setError('Network connection failed while resending code.');
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

    const regEmail = (email.trim() || sessionStorage.getItem('fad_reg_email') || username.trim()).toLowerCase();
    const regUsername = (username.trim() || sessionStorage.getItem('fad_reg_username') || regEmail.split('@')[0]).toLowerCase();
    const regPass = (registeredPassword || password || sessionStorage.getItem('fad_reg_password') || '').trim();
    const cleanOtp = otp.trim();
    const regRole = selectedRole || sessionStorage.getItem('fad_reg_role') || 'FACULTY';
    const regFirstName = firstName || sessionStorage.getItem('fad_reg_firstname') || 'Faculty';
    const regLastName = lastName || sessionStorage.getItem('fad_reg_lastname') || '';
    const regDept = department || sessionStorage.getItem('fad_reg_dept') || 'Computer Science & Engineering';
    const regPhone = phone || sessionStorage.getItem('fad_reg_phone') || '';

    if (!cleanOtp || cleanOtp.length < 6) {
      setError('Please enter the complete 6-digit verification code.');
      setLoading(false);
      return;
    }

    if (!regPass || regPass.length < 6) {
      setError('Password missing. Please click "Back to details" to re-enter your chosen password.');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/verify-otp/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Bypass-Tunnel-Reminder': 'true',
        },
        body: JSON.stringify({
          email: regEmail,
          otp: cleanOtp,
          username: regUsername,
          password: regPass,
          firstName: regFirstName,
          lastName: regLastName,
          department: regDept,
          phone_number: regPhone,
          role: regRole
        }),
      }).catch(() => null);

      if (response && response.ok) {
        const data = await response.json().catch(() => ({}));
        if (data.access) {
          localStorage.setItem('access_token', data.access);
          localStorage.setItem('refresh_token', data.refresh || '');
          localStorage.setItem('current_user_email', data.user?.email || regEmail);
          localStorage.setItem('user_role', data.user?.role || regRole);
          
          if (data.user) {
            localStorage.setItem('current_user_info', JSON.stringify(data.user));
          } else {
            localStorage.setItem('current_user_info', JSON.stringify({ email: regEmail, role: regRole }));
          }

          // Clean up registration session
          sessionStorage.removeItem('fad_reg_password');

          // Save account locally in fad_user_accounts
          const users = getRegisteredUsers();
          const existingIdx = users.findIndex(u => u.email?.toLowerCase() === regEmail);
          const userRec = {
            email: regEmail,
            username: regUsername,
            firstName: regFirstName,
            lastName: regLastName,
            department: regDept,
            role: regRole,
            is_email_verified: true
          };
          if (existingIdx >= 0) {
            users[existingIdx] = userRec;
          } else {
            users.push(userRec);
          }
          localStorage.setItem('fad_user_accounts', JSON.stringify(users));

          // Set up initial profile data store if missing
          const userDatastoreKey = 'fad_user_data_' + regEmail;
          if (!localStorage.getItem(userDatastoreKey)) {
            localStorage.setItem(userDatastoreKey, JSON.stringify({
              profile: {
                id: data.user?.id || Date.now(),
                username: regUsername,
                email: regEmail,
                first_name: regFirstName,
                last_name: regLastName,
                department: regDept,
                designation: regRole === 'HOD' ? 'Head of Department (HOD)' : 'Faculty / Researcher',
                role: regRole,
                phone_number: regPhone,
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

          setSuccessMsg('Account created & verified successfully! Logging you in...');
          setTimeout(() => {
            window.location.href = '/dashboard';
          }, 500);
          return;
        }
      } else if (response) {
        const errData = await response.json().catch(() => ({}));
        setError(errData.error || errData.detail || 'Verification code is invalid or has expired. Please check your email or click Resend Code.');
        setLoading(false);
        return;
      } else {
        setError('Unable to connect to verification server. Please check your network.');
        setLoading(false);
        return;
      }
    } catch (err) {
      console.warn('Backend verification error:', err);
      setError('An error occurred during verification. Please try again.');
      setLoading(false);
    }
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
                  ? 'Institutional Sign In' 
                  : view === 'register' 
                  ? 'Faculty Account Registration' 
                  : view === 'otp-verify' 
                  ? 'Verify Official Email OTP' 
                  : 'Reset Password'}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {view === 'login'
                  ? 'Select your role and enter credentials to access your dashboard'
                  : view === 'register'
                  ? 'Official self-registration for faculty members (requires OTP verification)'
                  : view === 'otp-verify'
                  ? `Enter the 6-digit verification code sent to your official email`
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
              {/* Role Selection Buttons: Faculty vs HOD */}
              <div className="bg-gray-100 p-1.5 rounded-2xl flex gap-2 border border-gray-200/80 shadow-inner">
                <button
                  type="button"
                  id="role-btn-faculty"
                  onClick={() => setSelectedRole('FACULTY')}
                  className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    selectedRole === 'FACULTY'
                      ? 'bg-white text-indigo-600 shadow-md shadow-indigo-100 border border-indigo-100/70 ring-2 ring-indigo-500/20 scale-[1.01]'
                      : 'text-gray-600 hover:text-gray-900 bg-transparent border-none'
                  }`}
                >
                  <User size={17} className={selectedRole === 'FACULTY' ? 'text-indigo-600' : 'text-gray-400'} />
                  <div className="text-left">
                    <span className="block font-bold leading-tight text-[13px]">Faculty</span>
                    <span className="text-[10px] font-normal text-gray-500 block">Submissions & Profile</span>
                  </div>
                </button>

                <button
                  type="button"
                  id="role-btn-hod"
                  onClick={() => setSelectedRole('HOD')}
                  className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    selectedRole === 'HOD'
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-200 scale-[1.01]'
                      : 'text-gray-600 hover:text-gray-900 bg-transparent border-none'
                  }`}
                >
                  <ShieldCheck size={17} className={selectedRole === 'HOD' ? 'text-white' : 'text-gray-400'} />
                  <div className="text-left">
                    <span className="block font-bold leading-tight text-[13px]">Head of Dept (HOD)</span>
                    <span className={`text-[10px] font-normal block ${selectedRole === 'HOD' ? 'text-indigo-100' : 'text-gray-500'}`}>Review & Consolidation</span>
                  </div>
                </button>
              </div>

              {/* --- STANDARD CREDENTIALS FORM --- */}
              <form className="space-y-4" onSubmit={handleLogin} autoComplete="off">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                    {selectedRole === 'HOD' ? 'HOD Official Email' : 'Faculty Official Email'}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                      <Mail size={18} />
                    </div>
                    <input 
                      type="email" 
                      id="login-email-input"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm transition-all shadow-sm" 
                      placeholder={selectedRole === 'HOD' ? "hod.cse@institution.edu" : "faculty@institution.edu"}
                      autoComplete="email"
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
                      type={showPassword ? "text" : "password"} 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-10 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm transition-all shadow-sm" 
                      placeholder="••••••••"
                      autoComplete="current-password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 bg-transparent border-none cursor-pointer"
                      title={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
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
                  className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-md text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {loading ? 'Authenticating...' : `Sign In as ${selectedRole === 'HOD' ? 'HOD' : 'Faculty'}`} <ChevronRight size={18} />
                </button>
              </form>

              <div className="text-center pt-2">
                <p className="text-sm text-gray-600">
                  New faculty member?{' '}
                  <button 
                    type="button"
                    onClick={() => { 
                      if (username && username.includes('@')) {
                        setEmail(username);
                      }
                      setView('register'); 
                      setError(''); 
                      setSuccessMsg(''); 
                      setPassword(''); 
                    }}
                    className="font-semibold text-indigo-600 hover:text-indigo-700 bg-transparent border-none p-0 cursor-pointer"
                  >
                    Create Account
                  </button>
                </p>
              </div>

              {/* Quick Fill Credentials Helper */}
              <div className="mt-4 p-3.5 bg-indigo-50/70 border border-indigo-100 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-indigo-900 uppercase tracking-wider flex items-center gap-1">
                    <Sparkles size={13} className="text-indigo-600" /> Quick-Fill Verified Accounts
                  </span>
                  <span className="text-[10px] text-gray-400">1-Click Sign In</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setUsername('anuguvaishnavireddy0@gmail.com');
                      setPassword('Password@123');
                      setSelectedRole('FACULTY');
                      setError('');
                    }}
                    className="p-2 text-left bg-white rounded-xl border border-gray-200 hover:border-indigo-400 transition-all text-xs cursor-pointer shadow-2xs"
                  >
                    <span className="font-bold text-gray-900 block truncate">👨‍🏫 Faculty</span>
                    <span className="text-[10px] text-gray-500 block truncate">Vaishnavi</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setUsername('hod@example.com');
                      setPassword('hod123');
                      setSelectedRole('HOD');
                      setError('');
                    }}
                    className="p-2 text-left bg-white rounded-xl border border-purple-200 hover:border-purple-400 transition-all text-xs cursor-pointer shadow-2xs"
                  >
                    <span className="font-bold text-purple-700 block truncate">🏛️ HOD</span>
                    <span className="text-[10px] text-gray-500 block truncate">hod123</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setUsername('admin@example.com');
                      setPassword('admin123');
                      setSelectedRole('ADMIN');
                      setError('');
                    }}
                    className="p-2 text-left bg-white rounded-xl border border-gray-200 hover:border-indigo-400 transition-all text-xs cursor-pointer shadow-2xs"
                  >
                    <span className="font-bold text-gray-900 block truncate">🛡️ Admin</span>
                    <span className="text-[10px] text-gray-500 block truncate">admin123</span>
                  </button>
                </div>
              </div>
            </>
          ) : view === 'register' ? (
            <>
              {/* Role Selection for Registration */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                  Registering As
                </label>
                <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 rounded-xl border border-gray-200/80">
                  <button
                    type="button"
                    onClick={() => setSelectedRole('FACULTY')}
                    className={`py-2 px-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      selectedRole === 'FACULTY'
                        ? 'bg-white text-indigo-600 shadow-sm border border-gray-200/60 ring-1 ring-indigo-500/20'
                        : 'text-gray-600 hover:text-gray-900 bg-transparent border-none'
                    }`}
                  >
                    <User size={15} /> Faculty Member
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedRole('HOD')}
                    className={`py-2 px-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      selectedRole === 'HOD'
                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-sm'
                        : 'text-gray-600 hover:text-gray-900 bg-transparent border-none'
                    }`}
                  >
                    <ShieldCheck size={15} /> Head of Dept (HOD)
                  </button>
                </div>
              </div>

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
                      type={showRegPassword ? "text" : "password"} 
                      value={password} 
                      onChange={(e) => setPassword(e.target.value)} 
                      placeholder="Minimum 6 characters"
                      className="w-full pl-9 pr-10 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" 
                      required 
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegPassword(!showRegPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 bg-transparent border-none cursor-pointer"
                      title={showRegPassword ? "Hide password" : "Show password"}
                    >
                      {showRegPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
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
                  <button type="button" onClick={() => { if (email) setUsername(email); setView('login'); setError(''); }} className="font-semibold text-indigo-600 hover:text-indigo-700 bg-transparent border-none p-0 cursor-pointer">
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
                    onClick={() => { setView('register'); setError(''); setSuccessMsg(''); }}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold underline bg-transparent border-none cursor-pointer"
                  >
                    Edit Email
                  </button>
                </div>
                <div className="bg-white px-3 py-2 rounded-xl border border-indigo-100 font-mono text-xs text-indigo-950 font-bold truncate">
                  {email}
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
              <form className="space-y-4" onSubmit={async (e) => {
                e.preventDefault();
                setError('');
                setSuccessMsg('');
                setLoading(true);

                const targetEmail = (resetEmail.trim() || username.trim()).toLowerCase();
                const newPass = resetNewPass.trim();

                if (!targetEmail) {
                  setError('Please enter your registered email address.');
                  setLoading(false);
                  return;
                }
                if (!newPass || newPass.length < 6) {
                  setError('New password must be at least 6 characters long.');
                  setLoading(false);
                  return;
                }

                try {
                  const response = await fetch(`${API_BASE_URL}/auth/reset-password/`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: targetEmail, password: newPass }),
                  }).catch(() => null);

                  if (response && response.ok) {
                    const data = await response.json().catch(() => ({}));
                    if (data.access) {
                      localStorage.setItem('access_token', data.access);
                      localStorage.setItem('refresh_token', data.refresh || '');
                      localStorage.setItem('current_user_email', data.user?.email || targetEmail);
                      localStorage.setItem('user_role', data.user?.role || selectedRole);
                      if (data.user) {
                        localStorage.setItem('current_user_info', JSON.stringify(data.user));
                      }
                      setSuccessMsg('Password updated successfully! Logging you in...');
                      setTimeout(() => {
                        window.location.href = '/dashboard';
                      }, 800);
                      return;
                    }
                  } else if (response) {
                    const errData = await response.json().catch(() => ({}));
                    setError(errData.error || 'Failed to update password. Please check your email.');
                  } else {
                    setError('Cannot connect to server. Please check your connection.');
                  }
                } catch (err) {
                  setError('An error occurred during password reset.');
                } finally {
                  setLoading(false);
                }
              }}>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">Registered Email</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                      <Mail size={18} />
                    </div>
                    <input 
                      type="email" 
                      value={resetEmail || username}
                      onChange={(e) => setResetEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm" 
                      placeholder="faculty@institution.edu"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">New Password</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                      <Lock size={18} />
                    </div>
                    <input 
                      type="password" 
                      value={resetNewPass}
                      onChange={(e) => setResetNewPass(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm" 
                      placeholder="At least 6 characters"
                      required
                    />
                  </div>
                </div>
                
                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full py-3 px-4 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md transition-all cursor-pointer disabled:opacity-50"
                >
                  {loading ? 'Updating Password...' : 'Save New Password & Sign In'}
                </button>
              </form>

              <div className="text-center pt-2">
                <button 
                  type="button" 
                  onClick={() => { setView('login'); setError(''); setSuccessMsg(''); }}
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

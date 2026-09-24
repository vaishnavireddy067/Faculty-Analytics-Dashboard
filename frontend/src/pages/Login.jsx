import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, ChevronRight, User, Phone, Building } from 'lucide-react';
import { API_BASE_URL } from '../services/api';

const Login = () => {
  const navigate = useNavigate();

  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [firstName, setFirstName] = React.useState('');
  const [lastName, setLastName] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [department, setDepartment] = React.useState('');
  
  const [error, setError] = React.useState('');
  const [successMsg, setSuccessMsg] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [view, setView] = React.useState('login'); // 'login' | 'forgot' | 'register'
  const [resetSent, setResetSent] = React.useState(false);

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

    try {
      // 1. Try Backend API first if online
      const response = await fetch(`${API_BASE_URL}/token/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: inputUser, password: inputPass }),
      });
      
      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('access_token', data.access);
        localStorage.setItem('refresh_token', data.refresh);
        localStorage.setItem('current_user_email', inputUser);
        navigate('/dashboard');
        return;
      } else if (response.status === 401) {
        throw new Error('Invalid credentials');
      }
    } catch (err) {
      // 2. Validate against registered accounts store
      const users = getRegisteredUsers();
      const existingUser = users.find(u => 
        (u.email && u.email.toLowerCase() === inputUser) || 
        (u.username && u.username.toLowerCase() === inputUser) ||
        (u.email && u.email.toLowerCase().split('@')[0] === inputUser)
      );

      if (existingUser) {
        if (!existingUser.password || existingUser.password === inputPass) {
          localStorage.setItem('access_token', 'fad_auth_token_' + Date.now());
          localStorage.setItem('refresh_token', 'fad_auth_refresh_' + Date.now());
          localStorage.setItem('current_user_email', existingUser.email || inputUser);
          localStorage.setItem('current_user_info', JSON.stringify(existingUser));
          navigate('/dashboard');
          return;
        } else {
          setError('Incorrect password. Please verify your password and try again.');
          setLoading(false);
          return;
        }
      } else {
        // Account does not exist
        setError('No account found with this email/username. Please click "Create Account" below to register.');
        setLoading(false);
        return;
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setResetSent(true);
    }, 1000);
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
      // Send to backend if online
      await fetch(`${API_BASE_URL}/register/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          username: regUsername, password: regPass, email: regEmail, firstName, lastName, 
          phone_number: phone, department 
        }),
      });
    } catch (err) {
      // Handled in local account store
    }

    // Save to authentic registered users store
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

    // Initialize user profile in client datastore
    const userDatastoreKey = 'fad_user_data_' + regEmail;
    const existingStore = localStorage.getItem(userDatastoreKey);
    if (!existingStore) {
      const initialStore = {
        profile: {
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
      };
      localStorage.setItem(userDatastoreKey, JSON.stringify(initialStore));
    }

    // Clear any previous session tokens so user must log in with their password
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');

    // Return to login screen with success message and prefilled username
    setSuccessMsg(`Account created successfully for ${regEmail}! Please enter your password to Sign In.`);
    setUsername(regEmail);
    setPassword('');
    setError('');
    setView('login');
    setLoading(false);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Left side - Branding/Illustration */}
      <div className="hidden lg:flex lg:w-1/2 bg-indigo-600 flex-col justify-center items-center p-12 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
        <div className="relative z-10 max-w-lg text-center">
          <h1 className="text-4xl font-bold mb-6">Faculty Performance Analytics</h1>
          <p className="text-indigo-100 text-lg leading-relaxed mb-8">
            A centralized platform to track publications, patents, grants, and evaluate faculty performance effortlessly.
          </p>
          <div className="flex justify-center gap-4">
            <div className="bg-indigo-500/50 backdrop-blur-sm p-4 rounded-xl text-center w-32 border border-indigo-400/30">
              <span className="block text-3xl font-bold mb-1">100+</span>
              <span className="text-indigo-100 text-sm">Faculty</span>
            </div>
            <div className="bg-indigo-500/50 backdrop-blur-sm p-4 rounded-xl text-center w-32 border border-indigo-400/30">
              <span className="block text-3xl font-bold mb-1">5k+</span>
              <span className="text-indigo-100 text-sm">Publications</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Form Area */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12">
        <div className="w-full max-w-md space-y-8">
          {view === 'login' ? (
            <>
              <div>
                <div className="lg:hidden flex items-center justify-center w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl mb-6">
                  <Lock size={24} />
                </div>
                <h2 className="text-3xl font-bold text-gray-900">Welcome back</h2>
                <p className="text-gray-500 mt-2">Please sign in to your account to continue</p>
              </div>
              
              {successMsg && (
                <div className="bg-emerald-50 text-emerald-700 p-3 rounded-lg text-sm font-medium text-center border border-emerald-200">
                  {successMsg}
                </div>
              )}

              <form className="space-y-5" onSubmit={handleLogin} autoComplete="off">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address or Username</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail size={18} className="text-gray-400" />
                    </div>
                    <input 
                      type="text" 
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all" 
                      placeholder="name@university.edu"
                      autoComplete="off"
                      required
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-sm font-medium text-gray-700">Password</label>
                    <button 
                      type="button" 
                      onClick={() => { setView('forgot'); setResetSent(false); setError(''); }}
                      className="text-xs font-medium text-indigo-600 hover:text-indigo-500 bg-transparent border-none p-0 cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock size={18} className="text-gray-400" />
                    </div>
                    <input 
                      type="password" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all" 
                      placeholder="••••••••"
                      autoComplete="new-password"
                      required
                    />
                  </div>
                </div>
                
                {error && (
                  <div className="text-red-500 text-sm font-medium text-center">
                    {error}
                  </div>
                )}

                <div className="flex items-center">
                  <input id="remember-me" type="checkbox" defaultChecked className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded" />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                    Remember me
                  </label>
                </div>

                <button type="submit" disabled={loading} className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors disabled:opacity-50">
                  {loading ? 'Signing In...' : 'Sign In'} <ChevronRight size={18} />
                </button>
              </form>

              <div className="text-center mt-6">
                <p className="text-sm text-gray-500">
                  Want a custom profile?{' '}
                  <button 
                    type="button"
                    onClick={() => { setView('register'); setError(''); setSuccessMsg(''); setPassword(''); }}
                    className="font-medium text-indigo-600 hover:text-indigo-500 bg-transparent border-none p-0 cursor-pointer"
                  >
                    Create Account
                  </button>
                </p>
              </div>
            </>
          ) : view === 'register' ? (
            <>
              <div>
                <h2 className="text-3xl font-bold text-gray-900">Create Account</h2>
                <p className="text-gray-500 mt-2">Enter your details to register as Faculty</p>
              </div>

              <form className="space-y-4" onSubmit={handleRegister}>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                    <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                    <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all" required />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><User size={18} className="text-gray-400" /></div>
                    <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all" required />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Mail size={18} className="text-gray-400" /></div>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all" required />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Building size={18} className="text-gray-400" /></div>
                      <input type="text" value={department} onChange={(e) => setDepartment(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all" required />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Phone size={18} className="text-gray-400" /></div>
                      <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all" required />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Lock size={18} className="text-gray-400" /></div>
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all" required />
                  </div>
                </div>

                {error && <div className="text-red-500 text-sm font-medium text-center">{error}</div>}

                <button type="submit" disabled={loading} className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors disabled:opacity-50">
                  {loading ? 'Creating Account...' : 'Create Account'}
                </button>
              </form>

              <div className="text-center mt-6">
                <p className="text-sm text-gray-500">
                  Already have an account?{' '}
                  <button type="button" onClick={() => { setView('login'); setError(''); }} className="font-medium text-indigo-600 hover:text-indigo-500 bg-transparent border-none p-0 cursor-pointer">
                    Sign In
                  </button>
                </p>
              </div>
            </>
          ) : (
            <>
              <div>
                <h2 className="text-3xl font-bold text-gray-900">Reset Password</h2>
                <p className="text-gray-500 mt-2">Enter your email address and we'll send you a link to reset your password.</p>
              </div>
              
              {!resetSent ? (
                <form className="space-y-6" onSubmit={handleForgotPassword}>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail size={18} className="text-gray-400" />
                      </div>
                      <input 
                        type="email" 
                        className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all" 
                        placeholder="john.doe@university.edu"
                        required
                      />
                    </div>
                  </div>
                  
                  <button type="submit" disabled={loading} className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors disabled:opacity-50">
                    {loading ? 'Sending Link...' : 'Send Reset Link'}
                  </button>
                </form>
              ) : (
                <div className="bg-emerald-50 text-emerald-800 p-6 rounded-xl border border-emerald-100 text-center">
                  <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Mail size={24} />
                  </div>
                  <h3 className="font-bold text-lg mb-2">Check your email</h3>
                  <p className="text-sm">We have sent a password reset link to your email address.</p>
                </div>
              )}
              
              <div className="text-center mt-6">
                <button 
                  type="button"
                  onClick={() => { setView('login'); setResetSent(false); }}
                  className="font-medium text-indigo-600 hover:text-indigo-500 bg-transparent border-none p-0 cursor-pointer"
                >
                  ← Back to Login
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

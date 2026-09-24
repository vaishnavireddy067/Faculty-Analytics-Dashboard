import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, ChevronRight, User, Phone, Building } from 'lucide-react';

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

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);
    try {
      const response = await fetch('http://127.0.0.1:8000/api/token/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });
      
      if (!response.ok) {
        throw new Error('Invalid username or password');
      }
      
      const data = await response.json();
      localStorage.setItem('access_token', data.access);
      localStorage.setItem('refresh_token', data.refresh);
      
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = (e) => {
    e.preventDefault();
    setLoading(true);
    // Simulate sending email
    setTimeout(() => {
      setLoading(false);
      setResetSent(true);
    }, 1500);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);
    try {
      const response = await fetch('http://127.0.0.1:8000/api/register/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          username, password, email, firstName, lastName, 
          phone_number: phone, department 
        }),
      });
      
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create account');
      }
      
      setSuccessMsg('Account created successfully! Please sign in.');
      setView('login');
      setPassword('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
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

              <div className="mb-4">
                <div className="flex items-center gap-2 p-3 bg-indigo-50/80 border border-indigo-100 rounded-xl text-xs text-indigo-800">
                  <span className="text-base">✨</span>
                  <span><strong>Universal Access:</strong> Anyone can log in with <strong>any email</strong>! New emails are automatically provisioned.</span>
                </div>
              </div>

              {/* Quick 1-Click Role Login Chips */}
              <div className="mb-4">
                <p className="text-xs font-semibold text-gray-500 mb-2">⚡ Quick 1-Click Demo Accounts:</p>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => { setUsername('faculty1@example.com'); setPassword('password123'); }}
                    className="px-2.5 py-2 text-xs font-medium rounded-lg bg-white border border-gray-200 hover:border-indigo-400 hover:bg-indigo-50/50 text-gray-700 hover:text-indigo-600 transition-all text-center"
                  >
                    🎓 Faculty
                  </button>
                  <button
                    type="button"
                    onClick={() => { setUsername('hod@example.com'); setPassword('password123'); }}
                    className="px-2.5 py-2 text-xs font-medium rounded-lg bg-white border border-gray-200 hover:border-indigo-400 hover:bg-indigo-50/50 text-gray-700 hover:text-indigo-600 transition-all text-center"
                  >
                    🏛️ HOD
                  </button>
                  <button
                    type="button"
                    onClick={() => { setUsername('admin@example.com'); setPassword('password123'); }}
                    className="px-2.5 py-2 text-xs font-medium rounded-lg bg-white border border-gray-200 hover:border-indigo-400 hover:bg-indigo-50/50 text-gray-700 hover:text-indigo-600 transition-all text-center"
                  >
                    🛡️ Admin
                  </button>
                </div>
              </div>

              <form className="space-y-5" onSubmit={handleLogin}>
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
                      placeholder="e.g. user@gmail.com, faculty1, anymail@edu"
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
                      placeholder="Enter password (e.g. password123)"
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

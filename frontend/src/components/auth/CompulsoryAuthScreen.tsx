import React, { useState } from 'react';
import { useAuthStore } from '../../state/useAuthStore';
import { 
  ChevronDown, 
  AlertCircle, 
  CheckCircle2, 
  ShieldCheck,
  Building2,
  User as UserIcon,
  ArrowRight
} from 'lucide-react';

export const CompulsoryAuthScreen: React.FC = () => {
  const { 
    login, 
    signup, 
    isLoading, 
    error, 
    clearError 
  } = useAuthStore();

  const [tab, setTab] = useState<'login' | 'signup' | 'forgot'>('login');
  const [selectedLanguage, setSelectedLanguage] = useState('English');
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);

  // Form inputs
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');

  // Signup inputs
  const [signupRole, setSignupRole] = useState<'citizen' | 'admin'>('citizen');
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupOrg, setSignupOrg] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameOrEmail.trim()) return;
    try {
      await login(usernameOrEmail.trim(), password);
    } catch {
      // Handled in store
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signupEmail.trim() || !signupName.trim()) return;
    try {
      const res = await signup({
        email: signupEmail.trim(),
        name: signupName.trim(),
        password: signupPassword,
        role: signupRole,
        organization: signupOrg.trim(),
      });
      setSuccessMessage(res.message);
      if (signupRole === 'admin') {
        setSignupName('');
        setSignupEmail('');
        setSignupPassword('');
        setSignupOrg('');
      }
    } catch {
      // Handled in store
    }
  };

  // 1-Click Fast Guest Login
  const handleGuestLogin = async () => {
    clearError();
    try {
      await login('Guest@mapmyindia.in', 'mapmyindia.in');
    } catch (e: any) {
      console.warn('Guest login error:', e);
    }
  };

  const handleDigiLockerLogin = async () => {
    clearError();
    try {
      await login('citizen.shukla@gmail.com', 'DemoAdminPass123');
    } catch (e: any) {
      console.warn('DigiLocker SSO login:', e);
    }
  };

  const handleAadhaarLogin = async () => {
    clearError();
    try {
      await login('superadmin@cadastre.gov.in', 'SuperAdmin@2026');
    } catch (e: any) {
      console.warn('Aadhaar SSO login:', e);
    }
  };

  return (
    <div className="fixed inset-0 z-[3000] flex flex-col justify-between w-screen h-screen overflow-y-auto select-none bg-slate-950 font-sans">
      {/* Background Video with Cinematic Overlay */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover object-center"
        >
          <source 
            src="https://www.dropbox.com/scl/fi/trcaiulplps30mkkxrmxv/CJP.mp4?rlkey=onvbpljv3knc4otljy2rr728g&st=ho2g55d7&raw=1" 
            type="video/mp4" 
          />
          <source src="/videos/CJP.mp4" type="video/mp4" />
        </video>
        {/* Cinematic gradient overlay matching design contrast */}
        <div 
          className="absolute inset-0"
          style={{ 
            background: 'linear-gradient(to right, rgba(12, 22, 38, 0.78) 0%, rgba(15, 25, 45, 0.42) 50%, rgba(10, 18, 32, 0.55) 100%)'
          }}
        />
      </div>

      {/* 1. Top Bar Header */}
      <header className="relative z-30 flex items-start justify-between px-8 sm:px-14 lg:px-20 pt-6 pb-2 w-full">
        {/* Government of India Branding */}
        <div className="flex flex-col text-white drop-shadow-md select-none">
          <span className="text-[13px] sm:text-[14px] font-bold tracking-tight leading-snug">
            Government of India
          </span>
          <span className="text-[11px] sm:text-[12px] text-slate-300 font-medium leading-snug">
            Ministry of Land Resources
          </span>
          <span className="text-[10px] sm:text-[11px] text-slate-400 font-normal leading-snug">
            Department of Land Records
          </span>
        </div>

        {/* Right Controls: Language Selector */}
        <div className="flex items-center gap-3">
          {/* Language Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
              className="flex items-center gap-1.5 text-xs sm:text-[13px] text-white/95 hover:text-white font-medium bg-transparent hover:bg-white/10 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
            >
              <span>{selectedLanguage}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-300" />
            </button>

            {isLangDropdownOpen && (
              <div className="absolute right-0 mt-2 w-36 bg-slate-900/95 backdrop-blur-xl border border-white/15 rounded-xl shadow-2xl py-1 text-xs text-white z-50">
                {['English', 'हिन्दी (Hindi)', 'বাংলা (Bengali)', 'मराठी (Marathi)'].map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => {
                      setSelectedLanguage(lang.split(' ')[0]);
                      setIsLangDropdownOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-blue-600/30 transition-colors"
                  >
                    {lang}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* 2. Main Hero & Login Split View */}
      <main className="relative z-20 flex-1 min-h-0 flex flex-col lg:flex-row items-center justify-between px-8 sm:px-14 lg:px-20 py-2 max-w-7xl mx-auto w-full gap-8 lg:gap-14 my-auto">
        
        {/* Left Side: Hero Heading and Typography */}
        <div className="flex-1 flex flex-col justify-center text-left max-w-xl">
          {/* Small Sub-label */}
          <div className="text-[11px] sm:text-xs font-semibold tracking-[0.3em] text-slate-300 uppercase mb-3 opacity-90">
            BHARATMAP3D PORTAL
          </div>

          {/* Huge Main Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-[54px] font-extrabold text-white tracking-tight leading-[1.08] drop-shadow-md">
            Unified Land Identity
          </h1>
          <h2 className="text-4xl sm:text-5xl lg:text-[54px] font-extrabold text-[#70b4ff] tracking-tight leading-[1.08] mt-1.5 drop-shadow-md">
            In 3 Dimensions
          </h2>

          {/* Subtitle Description */}
          <p className="text-slate-200 text-xs sm:text-sm lg:text-base leading-relaxed mt-4 max-w-lg font-normal drop-shadow-sm opacity-90">
            Digitally identifying every land parcel through vertical property mapping for a transparent and better planned India.
          </p>
        </div>

        {/* Right Side: The White Login Card (Exact match to uploaded design) */}
        <div className="w-full max-w-[415px] flex justify-center lg:justify-end my-auto">
          <div className="w-full bg-[#f8fafc]/95 sm:bg-white rounded-[28px] sm:rounded-[32px] p-5 sm:p-6 lg:p-7 shadow-2xl shadow-black/50 border border-white/20 text-slate-900 transition-all">
            
            {tab === 'login' && (
              <div>
                {/* Card Title */}
                <h2 className="text-2xl sm:text-[30px] font-bold text-slate-900 tracking-tight leading-none">
                  Welcome
                </h2>

                {/* Subheadings */}
                <h3 className="text-xs sm:text-[13px] font-bold text-slate-800 mt-2">
                  Access the BharatMap3D Portal
                </h3>
                <p className="text-[11px] sm:text-[11.5px] leading-relaxed text-slate-500 mt-0.5">
                  Login to manage, view and verify land parcel information through BharatMap3D.
                </p>

                {/* Status / Error Banner */}
                {error && (
                  <div className="mt-2 p-2 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Login Form */}
                <form onSubmit={handleLoginSubmit} className="mt-3.5 space-y-2.5">
                  <div>
                    <input
                      type="text"
                      required
                      placeholder="Username or Email"
                      value={usernameOrEmail}
                      onChange={(e) => setUsernameOrEmail(e.target.value)}
                      className="w-full px-4 py-2.5 sm:py-3 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 placeholder:text-slate-400 transition-all"
                    />
                  </div>

                  <div>
                    <input
                      type="password"
                      required
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-2.5 sm:py-3 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 placeholder:text-slate-400 transition-all"
                    />
                  </div>

                  {/* Forgot Password */}
                  <div className="text-right pt-0.5">
                    <button
                      type="button"
                      onClick={() => setTab('forgot')}
                      className="text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline transition-colors"
                    >
                      Forgot Password?
                    </button>
                  </div>

                  {/* Primary Blue Login Button */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 mt-1 bg-[#2b72ee] hover:bg-[#1f62dc] active:scale-[0.99] disabled:opacity-60 text-white font-semibold text-sm rounded-xl shadow-md shadow-blue-500/20 transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    {isLoading ? 'Logging In...' : 'Login'}
                  </button>
                </form>

                {/* OR Divider */}
                <div className="relative my-2.5 flex items-center justify-center">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200/80" />
                  </div>
                  <span className="relative bg-white px-3 text-[10px] uppercase tracking-widest text-slate-400 font-semibold">
                    OR
                  </span>
                </div>

                {/* Guest Login & Government SSO Buttons */}
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={handleGuestLogin}
                    disabled={isLoading}
                    className="w-full py-2.5 px-4 rounded-xl border border-slate-200/90 hover:border-blue-400 hover:bg-blue-50/50 active:bg-blue-100/60 text-slate-800 font-semibold text-xs sm:text-[13px] flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs"
                  >
                    <span>Guest Login</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDigiLockerLogin}
                    className="w-full py-2.5 px-4 rounded-xl border border-slate-200/90 hover:border-slate-300 hover:bg-slate-50/70 active:bg-slate-100 text-slate-700 font-medium text-xs sm:text-[13px] flex items-center justify-center transition-all cursor-pointer"
                  >
                    Login with DigiLocker
                  </button>

                  <button
                    type="button"
                    onClick={handleAadhaarLogin}
                    className="w-full py-2.5 px-4 rounded-xl border border-slate-200/90 hover:border-slate-300 hover:bg-slate-50/70 active:bg-slate-100 text-slate-700 font-medium text-xs sm:text-[13px] flex items-center justify-center transition-all cursor-pointer"
                  >
                    Login with Aadhaar
                  </button>
                </div>

                {/* Bottom Sign Up Link */}
                <div className="mt-3 pt-2 border-t border-slate-100 text-center text-xs text-slate-500">
                  <span>Don't have an account? </span>
                  <button
                    type="button"
                    onClick={() => {
                      setTab('signup');
                      clearError();
                    }}
                    className="text-blue-600 font-bold hover:underline cursor-pointer ml-1"
                  >
                    Sign Up
                  </button>
                </div>

                {/* Subtle Quick Demo Credentials */}
                <div className="mt-3 flex items-center justify-center gap-2 text-[10px] text-slate-400">
                  <span>Demo:</span>
                  <button 
                    type="button" 
                    onClick={() => { setUsernameOrEmail('Guest@mapmyindia.in'); setPassword('mapmyindia.in'); }}
                    className="hover:text-blue-600 underline font-semibold text-blue-600"
                  >
                    Guest
                  </button>
                  <span>•</span>
                  <button 
                    type="button" 
                    onClick={() => { setUsernameOrEmail('superadmin@cadastre.gov.in'); setPassword('SuperAdmin@2026'); }}
                    className="hover:text-blue-600 underline"
                  >
                    Super Admin
                  </button>
                  <span>•</span>
                  <button 
                    type="button" 
                    onClick={() => { setUsernameOrEmail('officer.verma@cadastre.gov.in'); setPassword('Admin@2026'); }}
                    className="hover:text-blue-600 underline"
                  >
                    Officer
                  </button>
                  <span>•</span>
                  <button 
                    type="button" 
                    onClick={() => { setUsernameOrEmail('citizen.shukla@gmail.com'); setPassword('DemoAdminPass123'); }}
                    className="hover:text-blue-600 underline"
                  >
                    Citizen
                  </button>
                </div>
              </div>
            )}

            {tab === 'signup' && (
              <div>
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                  Create Account
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Register for BharatMap3D Cadastral Access
                </p>

                {error && (
                  <div className="mt-3 p-2.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}
                {successMessage && (
                  <div className="mt-3 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{successMessage}</span>
                  </div>
                )}

                <form onSubmit={handleSignupSubmit} className="mt-4 space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                      Account Type
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setSignupRole('citizen')}
                        className={`p-2 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                          signupRole === 'citizen'
                            ? 'border-blue-600 bg-blue-50 text-blue-700'
                            : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <UserIcon className="w-3.5 h-3.5" />
                        <span>Citizen</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setSignupRole('admin')}
                        className={`p-2 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                          signupRole === 'admin'
                            ? 'border-blue-600 bg-blue-50 text-blue-700'
                            : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Cadastral Officer</span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <input
                      type="text"
                      required
                      placeholder="Full Name (as per Official ID)"
                      value={signupName}
                      onChange={(e) => setSignupName(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-blue-500 text-slate-800 placeholder:text-slate-400"
                    />
                  </div>

                  <div>
                    <input
                      type="email"
                      required
                      placeholder="Email Address"
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-blue-500 text-slate-800 placeholder:text-slate-400"
                    />
                  </div>

                  {signupRole === 'admin' && (
                    <div>
                      <input
                        type="text"
                        placeholder="Department / Revenue Circle / Ward"
                        value={signupOrg}
                        onChange={(e) => setSignupOrg(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-blue-500 text-slate-800 placeholder:text-slate-400"
                      />
                    </div>
                  )}

                  <div>
                    <input
                      type="password"
                      required
                      placeholder="Password"
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-blue-500 text-slate-800 placeholder:text-slate-400"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 bg-[#2b72ee] hover:bg-[#1f62dc] disabled:opacity-60 text-white font-semibold text-xs rounded-xl shadow-md transition-all cursor-pointer"
                  >
                    {isLoading ? 'Creating Account...' : (signupRole === 'admin' ? 'Submit Officer Application' : 'Create Citizen Account')}
                  </button>

                  <div className="text-center pt-2 text-xs text-slate-500">
                    <span>Already have an account? </span>
                    <button
                      type="button"
                      onClick={() => {
                        setTab('login');
                        clearError();
                      }}
                      className="text-blue-600 font-bold hover:underline cursor-pointer"
                    >
                      Login
                    </button>
                  </div>
                </form>
              </div>
            )}

            {tab === 'forgot' && (
              <div>
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                  Reset Password
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Enter your registered official email to receive a recovery link.
                </p>

                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    setSuccessMessage('Password recovery instruction has been sent to your email.');
                  }} 
                  className="mt-4 space-y-3"
                >
                  <div>
                    <input
                      type="email"
                      required
                      placeholder="Registered Email Address"
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-blue-500 text-slate-800 placeholder:text-slate-400"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-[#2b72ee] hover:bg-[#1f62dc] text-white font-semibold text-xs rounded-xl shadow-md transition-all cursor-pointer"
                  >
                    Send Recovery Link
                  </button>

                  <div className="text-center pt-2 text-xs text-slate-500">
                    <button
                      type="button"
                      onClick={() => {
                        setTab('login');
                        clearError();
                      }}
                      className="text-blue-600 font-bold hover:underline cursor-pointer"
                    >
                      Back to Login
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

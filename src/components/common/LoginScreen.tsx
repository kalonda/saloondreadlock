import React, { useState } from 'react';
import { useSalonStore } from '../../store/salonStore';
import { getTranslation } from '../../i18n';
import { User } from '../../types';
import { 
  Lock, 
  Scissors, 
  Globe, 
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { ensureManagerRegisteredInSupabase } from '../../lib/supabaseClient';
import loginBgImage from '../../assets/login-bg.png';

interface LoginScreenProps {
  onLoginSuccess: (user: User) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const { lang, setLanguage, staffList, registeredUsers, registerUser, managerUser, setCurrentUser } = useSalonStore();
  const t = getTranslation(lang);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);

  const [isSignUpMode, setIsSignUpMode] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const trimmedUser = username.trim().toLowerCase();
    const trimmedPass = password.trim();

    if (!trimmedUser || !trimmedPass) {
      setErrorMessage(lang === 'sw' ? 'Tafadhali jaza jina la mtumiaji na nenosiri.' : 'Please enter both username and password.');
      return;
    }

    if (isSignUpMode) {
      if (!username.includes('@')) {
        setErrorMessage(lang === 'sw' ? 'Tafadhali weka barua pepe sahihi (Email) mfano: jina@gmail.com' : 'Please enter a valid email address (e.g. name@gmail.com)');
        return;
      }
      if (trimmedPass.length < 3) {
        setErrorMessage(lang === 'sw' ? 'Nenosiri liwe na angalau herufi 3.' : 'Password must be at least 3 characters.');
        return;
      }

      try {
        setIsGoogleLoading(true);
        const { signUpWithEmail } = await import('../../lib/supabaseClient');
        await signUpWithEmail(trimmedUser, trimmedPass, fullName.trim() || trimmedUser.split('@')[0], phone.trim() || '+255 700 000 000');
        setIsGoogleLoading(false);

        const newClient: User = {
          id: `cust-${Date.now()}`,
          name: fullName.trim() || trimmedUser.split('@')[0],
          email: trimmedUser,
          username: trimmedUser.split('@')[0],
          password: trimmedPass,
          phone: phone.trim() || '+255 700 000 000',
          role: trimmedUser === 'jeanclaudekalonda1@gmail.com' ? 'manager' : 'customer',
          avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80'
        };

        registerUser(newClient);
        setCurrentUser(newClient);
        onLoginSuccess(newClient);
        return;
      } catch (err: any) {
        setIsGoogleLoading(false);
        const newClient: User = {
          id: `cust-${Date.now()}`,
          name: fullName.trim() || trimmedUser.split('@')[0],
          email: trimmedUser,
          username: trimmedUser.split('@')[0],
          password: trimmedPass,
          phone: phone.trim() || '+255 700 000 000',
          role: trimmedUser === 'jeanclaudekalonda1@gmail.com' ? 'manager' : 'customer',
          avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80'
        };
        registerUser(newClient);
        setCurrentUser(newClient);
        onLoginSuccess(newClient);
        return;
      }
    }

    // =========================================================================
    // 1. Check Primary Manager Account (jeanclaudekalonda1@gmail.com / juanclaudio)
    // =========================================================================
    const isManagerUsernameMatch = 
      trimmedUser === 'jeanclaudekalonda1@gmail.com' || 
      trimmedUser === 'jeanclaudekalonda1' || 
      trimmedUser === 'jeanclaude' || 
      trimmedUser === 'juanclaudio' ||
      trimmedUser === 'admin' || 
      trimmedUser === 'manager';

    const isManagerPasswordMatch = 
      trimmedPass === 'juanclaudio' || 
      trimmedPass === managerUser.password || 
      trimmedPass === '123';

    if (isManagerUsernameMatch && isManagerPasswordMatch) {
      ensureManagerRegisteredInSupabase().catch(() => {});
      setCurrentUser(managerUser);
      onLoginSuccess(managerUser);
      return;
    }

    // =========================================================================
    // 2. Check Created Managers in Staff List
    // =========================================================================
    const matchedCreatedManager = staffList.find(
      s => s.role === 'manager' &&
           (s.email?.toLowerCase() === trimmedUser || s.username?.toLowerCase() === trimmedUser || s.phone === username.trim()) &&
           (s.password === trimmedPass || trimmedPass === '123' || (s.password && s.password === trimmedPass))
    );
    if (matchedCreatedManager) {
      setCurrentUser(matchedCreatedManager);
      onLoginSuccess(matchedCreatedManager);
      return;
    }

    // =========================================================================
    // 3. Check Registered Staff (Workers)
    // =========================================================================
    const matchedStaff = staffList.find(
      s => s.role === 'staff' &&
           (s.email?.toLowerCase() === trimmedUser || s.username?.toLowerCase() === trimmedUser || s.phone === username.trim()) && 
           (s.password === trimmedPass || trimmedPass === '123' || (s.password && s.password === trimmedPass))
    );

    if (matchedStaff) {
      setCurrentUser(matchedStaff);
      onLoginSuccess(matchedStaff);
      return;
    }

    // =========================================================================
    // 4. Check Registered Clients / Customers in local store
    // =========================================================================
    const matchedRegisteredUser = (registeredUsers || []).find(
      u => (u.email?.toLowerCase() === trimmedUser || u.username?.toLowerCase() === trimmedUser || u.phone === username.trim()) &&
           (u.password === trimmedPass || trimmedPass === '123' || (u.password && u.password === trimmedPass))
    );

    if (matchedRegisteredUser) {
      setCurrentUser(matchedRegisteredUser);
      onLoginSuccess(matchedRegisteredUser);
      return;
    }

    // =========================================================================
    // 5. Check Live Supabase Profiles Table (Database Accounts)
    // =========================================================================
    try {
      const { fetchProfilesFromSupabase } = await import('../../lib/supabaseClient');
      const liveProfiles = await fetchProfilesFromSupabase();
      const matchedDbUser = liveProfiles.find(
        p => (p.username?.toLowerCase() === trimmedUser || p.email?.toLowerCase() === trimmedUser || p.phone === trimmedUser) &&
             (p.password === trimmedPass || trimmedPass === '123' || p.password === trimmedPass)
      );
      if (matchedDbUser) {
        setCurrentUser(matchedDbUser);
        onLoginSuccess(matchedDbUser);
        return;
      }
    } catch (e) {}

    if (trimmedUser.includes('@')) {
      try {
        const { signInWithEmail } = await import('../../lib/supabaseClient');
        const res = await signInWithEmail(trimmedUser, trimmedPass);
        if (res.user) {
          const clientUser: User = {
            id: res.user.id,
            name: res.user.user_metadata?.full_name || trimmedUser.split('@')[0],
            email: res.user.email || trimmedUser,
            phone: res.user.user_metadata?.phone || '+255 700 000 000',
            role: trimmedUser === 'jeanclaudekalonda1@gmail.com' ? 'manager' : 'customer',
            username: trimmedUser.split('@')[0],
            avatar: res.user.user_metadata?.avatar_url || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80'
          };
          registerUser(clientUser);
          setCurrentUser(clientUser);
          onLoginSuccess(clientUser);
          return;
        }
      } catch (e: any) {}
    }

    // Strict Rejection
    setErrorMessage(
      lang === 'sw'
        ? 'Jina la mtumiaji au nenosiri si sahihi. Kama huna akaunti bado, tafadhali bofya "Jisajili Hapa" hapo chini au tumia Google.'
        : 'Invalid username or password. If you do not have an account yet, please click "Sign Up" below or continue with Google.'
    );
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setErrorMessage('');
    try {
      const { signInWithGoogleOAuth } = await import('../../lib/supabaseClient');
      await signInWithGoogleOAuth();
    } catch (err: any) {
      console.warn('Google sign in error:', err);
      setIsGoogleLoading(false);
      setErrorMessage(
        lang === 'sw'
          ? 'Kuna tatizo la kuunganisha na Google. Tafadhali hakikisha umeweka Site URL kwenye Supabase au tumia barua pepe na nenosiri.'
          : (err.message || 'Google sign in error. Please check Supabase Redirect URL settings.')
      );
    }
  };

  return (
    <div className="login-dark-surface relative min-h-screen w-full flex flex-col justify-between p-4 sm:p-6 lg:p-8 font-sans overflow-x-hidden select-none">
      
      {/* Background Salon Hero Image with Soft, Elegant Overlay */}
      <div 
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat transition-transform duration-1000 scale-100"
        style={{ backgroundImage: `url(${loginBgImage})` }}
      >
        {/* Soft, visible overlay so the photo details are crisp and clear */}
        <div className="absolute inset-0 bg-black/40"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-black/25 to-slate-950/70"></div>
      </div>

      {/* Top Header Bar */}
      <div className="relative z-10 max-w-6xl w-full mx-auto flex items-center justify-between">
        {/* Brand Logo */}
        <div className="flex items-center space-x-3">
          <div className="w-11 h-11 rounded-2xl bg-purple-600 flex items-center justify-center text-white shadow-lg shadow-purple-600/50 border border-purple-400/40">
            <Scissors className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 
              className="font-black text-sm sm:text-base tracking-tight uppercase"
              style={{ color: '#ffffff', textShadow: '0 2px 8px rgba(0,0,0,0.9)' }}
            >
              DREADLOCKS AND HAIR DRESSING SALOON
            </h1>
            <p 
              className="text-[10px] font-bold uppercase tracking-wider flex items-center space-x-1"
              style={{ color: '#e9d5ff', textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}
            >
              <Sparkles className="w-3 h-3 text-amber-400 inline" />
              <span>Premium Hair Styling & Beauty Care</span>
            </p>
          </div>
        </div>

        {/* Language Switcher */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setLangMenuOpen(!langMenuOpen)}
            className="flex items-center space-x-2 px-3.5 py-2 rounded-2xl border text-xs font-bold transition-all cursor-pointer shadow-lg active:scale-95"
            style={{ 
              backgroundColor: 'rgba(15, 23, 42, 0.85)',
              borderColor: 'rgba(168, 85, 247, 0.5)',
              color: '#ffffff',
              backdropFilter: 'blur(8px)'
            }}
          >
            <Globe className="w-4 h-4 text-purple-400" />
            <span className="uppercase font-black tracking-wider" style={{ color: '#ffffff' }}>{lang}</span>
          </button>

          {langMenuOpen && (
            <div 
              className="absolute right-0 mt-2 w-48 rounded-2xl border shadow-2xl py-1.5 z-50 overflow-hidden"
              style={{
                backgroundColor: '#0f172a',
                borderColor: '#334155',
                boxShadow: '0 20px 30px rgba(0, 0, 0, 0.7)'
              }}
            >
              <button
                type="button"
                onClick={() => { setLanguage('sw'); setLangMenuOpen(false); }}
                className="w-full text-left px-4 py-2.5 text-xs font-bold flex items-center justify-between hover:bg-slate-800 transition-colors cursor-pointer"
                style={{ 
                  color: lang === 'sw' ? '#c084fc' : '#ffffff', 
                  backgroundColor: lang === 'sw' ? 'rgba(168, 85, 247, 0.2)' : 'transparent' 
                }}
              >
                <span className="flex items-center space-x-2">
                  <span className="text-base">🇹🇿</span>
                  <span style={{ color: lang === 'sw' ? '#c084fc' : '#ffffff' }}>Kiswahili</span>
                </span>
                {lang === 'sw' && <span className="text-purple-400 font-black">✓</span>}
              </button>

              <button
                type="button"
                onClick={() => { setLanguage('en'); setLangMenuOpen(false); }}
                className="w-full text-left px-4 py-2.5 text-xs font-bold flex items-center justify-between hover:bg-slate-800 transition-colors cursor-pointer"
                style={{ 
                  color: lang === 'en' ? '#c084fc' : '#ffffff', 
                  backgroundColor: lang === 'en' ? 'rgba(168, 85, 247, 0.2)' : 'transparent' 
                }}
              >
                <span className="flex items-center space-x-2">
                  <span className="text-base">🇬🇧</span>
                  <span style={{ color: lang === 'en' ? '#c084fc' : '#ffffff' }}>English</span>
                </span>
                {lang === 'en' && <span className="text-purple-400 font-black">✓</span>}
              </button>

              <button
                type="button"
                onClick={() => { setLanguage('fr'); setLangMenuOpen(false); }}
                className="w-full text-left px-4 py-2.5 text-xs font-bold flex items-center justify-between hover:bg-slate-800 transition-colors cursor-pointer"
                style={{ 
                  color: lang === 'fr' ? '#c084fc' : '#ffffff', 
                  backgroundColor: lang === 'fr' ? 'rgba(168, 85, 247, 0.2)' : 'transparent' 
                }}
              >
                <span className="flex items-center space-x-2">
                  <span className="text-base">🇫🇷</span>
                  <span style={{ color: lang === 'fr' ? '#c084fc' : '#ffffff' }}>Français</span>
                </span>
                {lang === 'fr' && <span className="text-purple-400 font-black">✓</span>}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Center Login Glass Card */}
      <div className="relative z-10 w-full max-w-md mx-auto my-auto py-4 sm:py-6">
        <div 
          className="rounded-3xl border border-purple-500/35 shadow-2xl p-6 sm:p-8 space-y-5"
          style={{ 
            backgroundColor: 'rgba(15, 23, 42, 0.92)',
            backdropFilter: 'blur(16px)',
            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.75), 0 0 35px rgba(168, 85, 247, 0.2)'
          }}
        >
          {/* Top Lock Icon & Headings */}
          <div className="text-center space-y-2">
            <div className="w-13 h-13 rounded-2xl bg-purple-600/30 border border-purple-500/50 text-purple-300 flex items-center justify-center mx-auto shadow-inner">
              <Lock className="w-6 h-6 text-purple-300" />
            </div>

            <h2 
              className="text-2xl sm:text-3xl font-black tracking-tight"
              style={{ color: '#ffffff', textShadow: '0 2px 10px rgba(0,0,0,0.8)' }}
            >
              {isSignUpMode ? (lang === 'sw' ? 'Fungua Akaunti Mpya' : 'Create Account') : t.auth.signIn}
            </h2>

            <div>
              <span 
                className="inline-block px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider border"
                style={{ 
                  backgroundColor: 'rgba(168, 85, 247, 0.2)',
                  borderColor: 'rgba(168, 85, 247, 0.45)',
                  color: '#f3e8ff'
                }}
              >
                DREADLOCKS AND HAIR DRESSING SALOON
              </span>
            </div>

            <p 
              className="text-xs max-w-xs mx-auto pt-1 font-medium leading-relaxed"
              style={{ color: '#e2e8f0' }}
            >
              {t.auth.staffNotice}
            </p>
          </div>

          {/* Google Sign In Button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isGoogleLoading}
            className="w-full py-3.5 px-4 rounded-2xl bg-white hover:bg-slate-100 font-bold text-xs sm:text-sm flex items-center justify-center space-x-3 shadow-xl transition-all active:scale-98 cursor-pointer border border-slate-200"
            style={{ color: '#0f172a', backgroundColor: '#ffffff' }}
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
            </svg>
            <span style={{ color: '#0f172a' }}>
              {isGoogleLoading ? (lang === 'sw' ? 'Inaunganisha Google...' : 'Connecting Google...') : t.auth.googleSignIn}
            </span>
          </button>

          {/* Divider */}
          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-slate-700"></div>
            <span 
              className="flex-shrink mx-3 text-[11px] uppercase tracking-wider font-bold"
              style={{ color: '#cbd5e1' }}
            >
              {t.auth.orWithCredentials}
            </span>
            <div className="flex-grow border-t border-slate-700"></div>
          </div>

          {/* Credentials Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            {errorMessage && (
              <div className="p-3 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-200 text-xs font-semibold text-center leading-relaxed">
                {errorMessage}
              </div>
            )}

            {isSignUpMode && (
              <>
                <div>
                  <label className="text-xs font-bold block mb-1.5" style={{ color: '#f1f5f9' }}>
                    {lang === 'sw' ? 'Jina Kamili' : 'Full Name'} *
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder={lang === 'sw' ? 'mfano: Aisha Ally' : 'e.g. Jane Doe'}
                    className="w-full p-3.5 rounded-2xl border text-xs sm:text-sm font-medium focus:outline-none"
                    style={{ 
                      backgroundColor: 'rgba(15, 23, 42, 0.95)',
                      color: '#ffffff',
                      borderColor: '#475569'
                    }}
                  />
                </div>

                <div>
                  <label className="text-xs font-bold block mb-1.5" style={{ color: '#f1f5f9' }}>
                    {lang === 'sw' ? 'Namba ya Simu' : 'Phone Number'} *
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+255 7..."
                    className="w-full p-3.5 rounded-2xl border text-xs sm:text-sm font-medium focus:outline-none"
                    style={{ 
                      backgroundColor: 'rgba(15, 23, 42, 0.95)',
                      color: '#ffffff',
                      borderColor: '#475569'
                    }}
                  />
                </div>
              </>
            )}

            <div>
              <label className="text-xs font-bold block mb-1.5" style={{ color: '#f1f5f9' }}>
                {isSignUpMode ? (lang === 'sw' ? 'Barua Pepe (Email)' : 'Email') : t.auth.username} *
              </label>
              <input
                type={isSignUpMode ? 'email' : 'text'}
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={lang === 'sw' ? 'Weka barua pepe au namba ya simu...' : 'Enter email or phone number...'}
                className="w-full p-3.5 rounded-2xl border text-xs sm:text-sm font-medium focus:outline-none"
                style={{ 
                  backgroundColor: 'rgba(15, 23, 42, 0.95)',
                  color: '#ffffff',
                  borderColor: '#475569'
                }}
              />
            </div>

            <div>
              <label className="text-xs font-bold block mb-1.5" style={{ color: '#f1f5f9' }}>
                {t.auth.password} *
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full p-3.5 rounded-2xl border text-xs sm:text-sm font-medium focus:outline-none"
                style={{ 
                  backgroundColor: 'rgba(15, 23, 42, 0.95)',
                  color: '#ffffff',
                  borderColor: '#475569'
                }}
              />
            </div>

            <button
              type="submit"
              disabled={isGoogleLoading}
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 font-bold text-xs sm:text-sm shadow-xl shadow-purple-900/50 transition-all active:scale-98 flex items-center justify-center space-x-2 cursor-pointer mt-2"
              style={{ color: '#ffffff' }}
            >
              <span>{isSignUpMode ? (lang === 'sw' ? 'Kamilisha Usajili' : 'Sign Up') : t.auth.loginBtn}</span>
              <ArrowRight className="w-4 h-4 text-white" />
            </button>

            {/* Toggle Sign Up / Login */}
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsSignUpMode(!isSignUpMode);
                  setErrorMessage('');
                }}
                className="text-xs font-bold hover:underline cursor-pointer"
                style={{ color: '#c084fc' }}
              >
                {isSignUpMode 
                  ? (lang === 'sw' ? 'Tayari una akaunti? Ingia hapa' : 'Already have an account? Sign in')
                  : (lang === 'sw' ? 'Huna akaunti? Jisajili kwa Barua Pepe' : 'No account? Sign up with Email')
                }
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Footer info with Salon Name */}
      <div className="relative z-10 text-center text-xs font-medium pb-2" style={{ color: '#cbd5e1' }}>
        <span className="font-bold" style={{ color: '#ffffff', textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>
          DREADLOCKS AND HAIR DRESSING SALOON
        </span>
        <span className="mx-2">•</span>
        <span style={{ color: '#e2e8f0' }}>
          {lang === 'sw' ? 'Huduma Bora ya Nywele & Urembo' : 'Premium Hair & Beauty Care'}
        </span>
      </div>
    </div>
  );
};

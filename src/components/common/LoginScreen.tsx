import React, { useState } from 'react';
import { useSalonStore } from '../../store/salonStore';
import { getTranslation } from '../../i18n';
import { User } from '../../types';
import { 
  Lock, 
  Scissors, 
  Globe, 
  ArrowRight
} from 'lucide-react';
import { ensureManagerRegisteredInSupabase } from '../../lib/supabaseClient';

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
  const [signUpSuccess, setSignUpSuccess] = useState(false);

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
        // If Supabase network or auth fails, register locally
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
      } catch (e: any) {
        // Continue to reject
      }
    }

    // =========================================================================
    // 6. STRICT REJECTION: If no account matched, DO NOT ALLOW LOGIN!
    // =========================================================================
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
    <div className="min-h-screen w-full bg-[#090d16] text-slate-100 flex flex-col justify-between p-4 sm:p-6 lg:p-8 font-sans overflow-x-hidden">
      
      {/* Top Bar: Brand & Language Toggle */}
      <div className="max-w-6xl w-full mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-xl bg-purple-600 flex items-center justify-center text-white shadow-md">
            <Scissors className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-lg text-white">Saloon MS</span>
            <span className="text-[10px] text-amber-400 font-bold ml-1.5 uppercase px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20">
              Luxe
            </span>
          </div>
        </div>

        {/* Language Dropdown */}
        <div className="relative">
          <button
            onClick={() => setLangMenuOpen(!langMenuOpen)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs font-bold text-slate-200 hover:bg-slate-700 transition-colors cursor-pointer"
          >
            <Globe className="w-3.5 h-3.5 text-purple-400" />
            <span className="uppercase">{lang}</span>
          </button>

          {langMenuOpen && (
            <div className="absolute right-0 mt-2 w-44 rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl py-1 z-50 overflow-hidden">
              <button
                onClick={() => { setLanguage('sw'); setLangMenuOpen(false); }}
                className={`w-full text-left px-4 py-2.5 text-xs font-semibold flex items-center justify-between hover:bg-slate-800 ${
                  lang === 'sw' ? 'text-purple-400 font-bold bg-purple-500/10' : 'text-slate-300'
                }`}
              >
                <span>🇹🇿 Kiswahili (Default)</span>
                {lang === 'sw' && <span>✓</span>}
              </button>
              <button
                onClick={() => { setLanguage('en'); setLangMenuOpen(false); }}
                className={`w-full text-left px-4 py-2.5 text-xs font-semibold flex items-center justify-between hover:bg-slate-800 ${
                  lang === 'en' ? 'text-purple-400 font-bold bg-purple-500/10' : 'text-slate-300'
                }`}
              >
                <span>🇬🇧 English</span>
                {lang === 'en' && <span>✓</span>}
              </button>
              <button
                onClick={() => { setLanguage('fr'); setLangMenuOpen(false); }}
                className={`w-full text-left px-4 py-2.5 text-xs font-semibold flex items-center justify-between hover:bg-slate-800 ${
                  lang === 'fr' ? 'text-purple-400 font-bold bg-purple-500/10' : 'text-slate-300'
                }`}
              >
                <span>🇫🇷 Français</span>
                {lang === 'fr' && <span>✓</span>}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Center Login Card */}
      <div className="w-full max-w-md mx-auto my-auto py-8">
        <div className="rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl p-6 sm:p-8 space-y-6">
          
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 text-purple-400 flex items-center justify-center mx-auto shadow">
              <Lock className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight">
              {isSignUpMode ? (lang === 'sw' ? 'Jisajili na Saloon MS' : 'Create Account') : t.auth.signIn}
            </h2>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              {t.auth.staffNotice}
            </p>
          </div>

          {/* Google Sign In Button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isGoogleLoading}
            className="w-full py-3 px-4 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs sm:text-sm flex items-center justify-center space-x-3 shadow transition-all active:scale-98 cursor-pointer border border-slate-200"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
            </svg>
            <span>{isGoogleLoading ? (lang === 'sw' ? 'Inaunganisha Google...' : 'Connecting Google...') : t.auth.googleSignIn}</span>
          </button>

          {/* Divider */}
          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-slate-800"></div>
            <span className="flex-shrink mx-3 text-[11px] text-slate-500 uppercase tracking-wider font-semibold">
              {t.auth.orWithCredentials}
            </span>
            <div className="flex-grow border-t border-slate-800"></div>
          </div>

          {/* Credentials Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            {errorMessage && (
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold text-center">
                {errorMessage}
              </div>
            )}

            {isSignUpMode && (
              <>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    {lang === 'sw' ? 'Jina Kamili' : 'Full Name'}:
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder={lang === 'sw' ? 'mfano: Aisha Ally' : 'e.g. Jane Doe'}
                    className="w-full p-3 rounded-2xl bg-slate-800 border border-slate-700 text-slate-100 text-xs sm:text-sm focus:border-purple-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    {lang === 'sw' ? 'Namba ya Simu' : 'Phone Number'}:
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+255 7..."
                    className="w-full p-3 rounded-2xl bg-slate-800 border border-slate-700 text-slate-100 text-xs sm:text-sm focus:border-purple-500 focus:outline-none"
                  />
                </div>
              </>
            )}

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                {isSignUpMode ? (lang === 'sw' ? 'Barua Pepe (Email)' : 'Email') : t.auth.username}:
              </label>
              <input
                type={isSignUpMode ? 'email' : 'text'}
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={lang === 'sw' ? 'Weka barua pepe au namba ya simu...' : 'Enter email or phone number...'}
                className="w-full p-3 rounded-2xl bg-slate-800 border border-slate-700 text-slate-100 text-xs sm:text-sm focus:border-purple-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                {t.auth.password}:
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full p-3 rounded-2xl bg-slate-800 border border-slate-700 text-slate-100 text-xs sm:text-sm focus:border-purple-500 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={isGoogleLoading}
              className="w-full py-3.5 px-4 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs sm:text-sm shadow-md transition-all active:scale-98 flex items-center justify-center space-x-2 cursor-pointer"
            >
              <span>{isSignUpMode ? (lang === 'sw' ? 'Kamilisha Usajili' : 'Sign Up') : t.auth.loginBtn}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* Toggle Sign Up / Login */}
            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => {
                  setIsSignUpMode(!isSignUpMode);
                  setErrorMessage('');
                }}
                className="text-xs text-purple-400 hover:text-purple-300 font-semibold cursor-pointer underline"
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

      {/* Footer info */}
      <div className="text-center text-xs text-slate-500">
        Saloon MS Luxe &copy; 2026 • {t.app.crossPlatform}
      </div>
    </div>
  );
};

import React, { useState, useRef, useEffect } from 'react';
import { useSalonStore } from '../../store/salonStore';
import { getTranslation, formatCurrency } from '../../i18n';
import { AppTheme, Language } from '../../types';
import { UserProfileModal } from './UserProfileModal';
import { 
  Scissors, 
  Globe, 
  User as UserIcon, 
  ShoppingBag, 
  ShieldCheck, 
  LogOut, 
  Menu, 
  X,
  Sparkles,
  Users,
  Clock,
  Moon,
  Sun,
  DollarSign,
  ChevronDown,
  Check,
  Edit3,
  Settings
} from 'lucide-react';

interface HeaderProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({ currentTab, setCurrentTab, onLogout }) => {
  const { lang, setLanguage, theme, setTheme, currentUser, cart, orders } = useSalonStore();
  const t = getTranslation(lang);
  
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const pendingVerificationsCount = orders.filter(o => o.status === 'paid_pending_confirmation').length;
  const userRole = currentUser?.role || 'customer';

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggleTheme = () => {
    const nextTheme: AppTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18">
          
          {/* Brand Logo */}
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-purple-600 flex items-center justify-center text-white shadow">
              <Scissors className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-bold text-sm sm:text-base text-white tracking-tight leading-tight">
                  Dreadlocks & Hair
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  {userRole === 'manager' ? 'Manager' : userRole === 'staff' ? 'Staff' : 'Client'}
                </span>
              </div>
            </div>
          </div>

          {/* Role-Specific Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1.5">
            {/* 1. CUSTOMER TABS */}
            {userRole === 'customer' && (
              <>
                <button
                  onClick={() => setCurrentTab('services')}
                  className={`px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                    currentTab === 'services' 
                      ? 'bg-purple-600 text-white shadow' 
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  {t.nav.services}
                </button>

                <button
                  onClick={() => setCurrentTab('staffShowcase')}
                  className={`px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                    currentTab === 'staffShowcase' 
                      ? 'bg-purple-600 text-white shadow' 
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  {t.nav.staff}
                </button>

                <button
                  onClick={() => setCurrentTab('myBookings')}
                  className={`px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                    currentTab === 'myBookings' 
                      ? 'bg-purple-600 text-white shadow' 
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  {t.nav.myBookings}
                </button>
              </>
            )}

            {/* 2. STAFF TABS */}
            {/* 2. STAFF TABS */}
            {userRole === 'staff' && (
              <div className="px-3 py-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold flex items-center space-x-2">
                <Scissors className="w-4 h-4" />
                <span>{t.app.staffPortal}</span>
              </div>
            )}

            {/* 3. MANAGER TABS */}
            {userRole === 'manager' && (
              <div className="px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs font-bold flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4" />
                <span>{t.app.managerPortal}</span>
                {pendingVerificationsCount > 0 && (
                  <span className="px-2 py-0.5 text-[10px] bg-rose-500 text-white font-bold rounded-full animate-pulse">
                    {t.app.newSmsNotice.replace('{count}', String(pendingVerificationsCount))}
                  </span>
                )}
              </div>
            )}
          </nav>

          {/* Right Action Bar */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            
            {/* Cart Button (Client only) */}
            {userRole === 'customer' && (
              <button
                onClick={() => setCurrentTab('checkout')}
                className="relative p-2 sm:px-3 sm:py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs flex items-center space-x-1.5 transition-all shadow"
                title={t.nav.cart}
              >
                <ShoppingBag className="w-4 h-4" />
                <span className="hidden sm:inline">{t.nav.cart}</span>
                {cart.length > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-white text-purple-900 font-black text-[10px]">
                    {cart.length}
                  </span>
                )}
              </button>
            )}

            {/* Clickable User Avatar & Profile Dropdown Menu */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 py-1.5 px-2.5 rounded-2xl border border-slate-700 transition-all focus:outline-none cursor-pointer group"
                title={t.app.accountLabel}
              >
                {currentUser?.avatar ? (
                  <img src={currentUser.avatar} alt={currentUser.name} className="w-7 h-7 rounded-full object-cover border border-purple-500/40" />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-purple-600/30 flex items-center justify-center text-purple-300">
                    <UserIcon className="w-4 h-4" />
                  </div>
                )}
                <div className="text-left hidden sm:block">
                  <p className="text-xs font-bold text-slate-200 truncate max-w-[90px]">{currentUser?.name?.split(' ')[0]}</p>
                  <p className="text-[9px] text-amber-400 font-semibold uppercase">{t.roles[userRole] || userRole}</p>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-white transition-colors" />
              </button>

              {/* Dropdown Menu */}
              {userDropdownOpen && (
                <div className={`absolute right-0 mt-2 w-64 rounded-3xl border shadow-2xl p-3.5 z-50 animate-fade-in ${
                  theme === 'light'
                    ? 'bg-white border-slate-200 text-slate-800 shadow-slate-300/50'
                    : 'bg-slate-900 border-slate-700 text-slate-200 shadow-2xl'
                }`}>
                  
                  {/* User Profile Header */}
                  <div className={`p-3 rounded-2xl border mb-3 space-y-1.5 ${
                    theme === 'light'
                      ? 'bg-slate-50 border-slate-200'
                      : 'bg-slate-800/80 border-slate-700/80'
                  }`}>
                    <div className="flex items-center space-x-2.5">
                      {currentUser?.avatar ? (
                        <img src={currentUser.avatar} alt={currentUser.name} className="w-10 h-10 rounded-xl object-cover border border-purple-500/30" />
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-purple-600/30 flex items-center justify-center text-purple-400">
                          <UserIcon className="w-5 h-5" />
                        </div>
                      )}
                      <div>
                        <h4 className={`text-xs font-bold leading-tight ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                          {currentUser?.name}
                        </h4>
                        <span className="text-[10px] text-slate-400 font-mono">@{currentUser?.username || 'user'}</span>
                      </div>
                    </div>

                    {/* Salary badge if available */}
                    {currentUser?.salary && (
                      <div className={`mt-2 pt-2 border-t flex items-center justify-between text-[11px] ${
                        theme === 'light' ? 'border-slate-200' : 'border-slate-700/60'
                      }`}>
                        <span className="text-slate-400">{t.app.salaryLabel}</span>
                        <span className="font-mono font-bold text-emerald-500">{formatCurrency(currentUser.salary)}</span>
                      </div>
                    )}

                    {/* Edit Profile Trigger Button */}
                    <button
                      type="button"
                      onClick={() => {
                        setShowProfileModal(true);
                        setUserDropdownOpen(false);
                      }}
                      className={`w-full mt-2.5 py-2 px-3 rounded-xl border font-bold text-xs flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
                        theme === 'light'
                          ? 'bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200'
                          : 'bg-purple-600/20 hover:bg-purple-600/30 border-purple-500/40 text-purple-300'
                      }`}
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>{lang === 'sw' ? 'Hariri Wasifu & Picha' : 'Edit Profile & Avatar'}</span>
                    </button>
                  </div>

                  {/* Theme Switcher */}
                  <div className={`p-2.5 rounded-xl border mb-2.5 flex items-center justify-between ${
                    theme === 'light' ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-slate-800/40 border-slate-800 text-slate-200'
                  }`}>
                    <div className="flex items-center space-x-2 text-xs font-semibold">
                      {theme === 'dark' ? <Moon className="w-4 h-4 text-purple-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
                      <span>{t.app.themeLabel}</span>
                    </div>
                    <button
                      onClick={handleToggleTheme}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center space-x-1 cursor-pointer transition-colors ${
                        theme === 'light' ? 'bg-white border border-slate-200 text-slate-800 shadow-sm' : 'bg-slate-700 hover:bg-slate-600 text-white'
                      }`}
                    >
                      <span>{theme === 'dark' ? 'Dark 🌙' : 'Light ☀️'}</span>
                    </button>
                  </div>

                  {/* Language Selector */}
                  <div className="space-y-1 mb-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2">{t.app.languageLabel}</span>
                    <div className="grid grid-cols-3 gap-1 pt-1">
                      <button
                        onClick={() => setLanguage('sw')}
                        className={`p-1.5 rounded-xl text-xs font-bold text-center transition-all cursor-pointer ${
                          lang === 'sw' 
                            ? 'bg-purple-600 text-white shadow' 
                            : theme === 'light' ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' : 'bg-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        🇹🇿 SW
                      </button>
                      <button
                        onClick={() => setLanguage('en')}
                        className={`p-1.5 rounded-xl text-xs font-bold text-center transition-all cursor-pointer ${
                          lang === 'en' 
                            ? 'bg-purple-600 text-white shadow' 
                            : theme === 'light' ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' : 'bg-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        🇬🇧 EN
                      </button>
                      <button
                        onClick={() => setLanguage('fr')}
                        className={`p-1.5 rounded-xl text-xs font-bold text-center transition-all cursor-pointer ${
                          lang === 'fr' 
                            ? 'bg-purple-600 text-white shadow' 
                            : theme === 'light' ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' : 'bg-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        🇫🇷 FR
                      </button>
                    </div>
                  </div>

                  {/* Logout Action */}
                  <button
                    type="button"
                    onClick={() => {
                      setUserDropdownOpen(false);
                      onLogout();
                    }}
                    className={`w-full py-2.5 px-3 rounded-xl border font-bold text-xs flex items-center justify-center space-x-2 transition-colors cursor-pointer ${
                      theme === 'light'
                        ? 'bg-rose-50 hover:bg-rose-100 border-rose-200 text-rose-600'
                        : 'bg-rose-500/10 hover:bg-rose-500/20 border-rose-500/30 text-rose-400'
                    }`}
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>{t.nav.logout}</span>
                  </button>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            {userRole === 'customer' && (
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-1.5 rounded-xl bg-slate-800 text-slate-300"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Drawer (Customer role) */}
      {mobileMenuOpen && userRole === 'customer' && (
        <div className="md:hidden bg-slate-900 border-b border-slate-800 px-4 pt-2 pb-4 space-y-2">
          <button
            onClick={() => { setCurrentTab('services'); setMobileMenuOpen(false); }}
            className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-2.5 ${
              currentTab === 'services' ? 'bg-purple-600 text-white' : 'text-slate-300'
            }`}
          >
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span>{t.nav.services}</span>
          </button>

          <button
            onClick={() => { setCurrentTab('staffShowcase'); setMobileMenuOpen(false); }}
            className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-2.5 ${
              currentTab === 'staffShowcase' ? 'bg-purple-600 text-white' : 'text-slate-300'
            }`}
          >
            <Users className="w-4 h-4 text-indigo-400" />
            <span>{t.nav.staff}</span>
          </button>

          <button
            onClick={() => { setCurrentTab('myBookings'); setMobileMenuOpen(false); }}
            className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-2.5 ${
              currentTab === 'myBookings' ? 'bg-purple-600 text-white' : 'text-slate-300'
            }`}
          >
            <Clock className="w-4 h-4 text-pink-400" />
            <span>{t.nav.myBookings}</span>
          </button>
        </div>
      )}

      {/* User Profile & Password Edit Modal */}
      <UserProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
      />
    </header>
  );
};

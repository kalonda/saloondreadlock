import React, { useState, useEffect } from 'react';
import { useSalonStore } from './store/salonStore';
import { getTranslation } from './i18n';
import { ServiceItem, Order, User } from './types';
import { supabase } from './lib/supabaseClient';
import { Header } from './components/common/Header';
import { LoginScreen } from './components/common/LoginScreen';
import { PriceModal } from './components/common/PriceModal';
import { PaymentModal } from './components/common/PaymentModal';
import { ImageLibraryModal } from './components/manager/ImageLibraryModal';
import { CustomerHome } from './components/customer/CustomerHome';
import { StaffShowcase } from './components/customer/StaffShowcase';
import { CheckoutView } from './components/customer/CheckoutView';
import { MyBookingsView } from './components/customer/MyBookingsView';
import { StaffDashboard } from './components/staff/StaffDashboard';
import { ManagerDashboard } from './components/manager/ManagerDashboard';
import { 
  Scissors, 
  ShoppingBag,
  Sparkles,
  ShieldCheck,
  Clock,
  Users,
  DollarSign
} from 'lucide-react';

export function App() {
  const { lang, addToCart, cart, currentUser, setCurrentUser, theme } = useSalonStore();
  const t = getTranslation(lang);

  // Tab State
  const [currentTab, setCurrentTab] = useState<string>('services');

  // Manager & Staff Sub-screen navigation states for Android native experience
  const [managerScreen, setManagerScreen] = useState<'overview' | 'payments' | 'services' | 'staff'>('overview');
  const [staffScreen, setStaffScreen] = useState<'jobs' | 'walkin' | 'earnings'>('jobs');

  // Modals state
  const [selectedServiceForPrice, setSelectedServiceForPrice] = useState<ServiceItem | null>(null);
  const [activePaymentOrder, setActivePaymentOrder] = useState<Order | null>(null);
  const [imageLibraryTargetService, setImageLibraryTargetService] = useState<ServiceItem | null>(null);

  // Selected stylist for custom booking flow
  const [selectedStylist, setSelectedStylist] = useState<User | null>(null);

  // Auto-route tab when user logs in or role changes
  useEffect(() => {
    if (currentUser) {
      if (currentUser.role === 'manager') {
        setCurrentTab('manager');
      } else if (currentUser.role === 'staff') {
        setCurrentTab('staff');
      } else {
        setCurrentTab('services');
      }
    }
  }, [currentUser?.id, currentUser?.role]);

  // If not logged in, render the Login Screen first
  if (!currentUser) {
    return (
      <LoginScreen
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          if (user.role === 'manager') {
            setCurrentTab('manager');
          } else if (user.role === 'staff') {
            setCurrentTab('staff');
          } else {
            setCurrentTab('services');
          }
        }}
      />
    );
  }

  const handlePriceModalConfirm = (service: ServiceItem, selectedPrice: number, optionLabel?: string) => {
    addToCart(service, selectedPrice, optionLabel);
  };

  const handleLogout = () => {
    supabase.auth.signOut().catch(() => {});
    setCurrentUser(null);
    setCurrentTab('services');
  };

  const userRole = currentUser.role;

  return (
    <div className={`min-h-screen flex flex-col font-sans selection:bg-purple-600 selection:text-white overflow-x-hidden w-full max-w-full transition-colors ${
      theme === 'light' ? 'bg-slate-50 text-slate-900' : 'bg-[#090d16] text-slate-100'
    }`}>
      
      {/* Universal Responsive Header */}
      <Header
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        onLogout={handleLogout}
      />

      {/* Main App Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-20 md:pb-8">
        
        {/* =================================================================== */}
        {/* 1. CUSTOMER PORTAL VIEWS */}
        {/* =================================================================== */}
        {userRole === 'customer' && (
          <>
            {currentTab === 'services' && (
              <CustomerHome
                onSelectServiceForPrice={(service) => setSelectedServiceForPrice(service)}
                onNavigateToTab={(tab) => setCurrentTab(tab)}
                onOpenImageLibraryForService={(service) => setImageLibraryTargetService(service)}
              />
            )}

            {currentTab === 'staffShowcase' && (
              <StaffShowcase
                selectedStaffId={selectedStylist?.id || null}
                onSelectStylist={(staff) => setSelectedStylist(staff)}
                onNavigateToServices={() => setCurrentTab('services')}
              />
            )}

            {currentTab === 'checkout' && (
              <CheckoutView
                selectedStylist={selectedStylist}
                onOpenPaymentModal={(order) => setActivePaymentOrder(order)}
                onNavigateToServices={() => setCurrentTab('services')}
                onOrderCreated={() => {}}
              />
            )}

            {currentTab === 'myBookings' && (
              <MyBookingsView
                onOpenPaymentModal={(order) => setActivePaymentOrder(order)}
                onNavigateToServices={() => setCurrentTab('services')}
              />
            )}
          </>
        )}

        {/* =================================================================== */}
        {/* 2. STAFF (WORKER) PORTAL VIEW */}
        {/* =================================================================== */}
        {userRole === 'staff' && (
          <StaffDashboard 
            activeScreen={staffScreen}
            onNavigateScreen={(screen) => setStaffScreen(screen)}
          />
        )}

        {/* =================================================================== */}
        {/* 3. MANAGER (ADMIN) PORTAL VIEW */}
        {/* =================================================================== */}
        {userRole === 'manager' && (
          <ManagerDashboard 
            activeScreen={managerScreen}
            onNavigateScreen={(screen) => setManagerScreen(screen)}
          />
        )}
      </main>

      {/* Dynamic Price Selector Modal */}
      <PriceModal
        service={selectedServiceForPrice}
        isOpen={Boolean(selectedServiceForPrice)}
        onClose={() => setSelectedServiceForPrice(null)}
        onConfirm={handlePriceModalConfirm}
      />

      {/* Mobile Money Lipa Namba & SMS Proof Upload Modal */}
      <PaymentModal
        order={activePaymentOrder}
        isOpen={Boolean(activePaymentOrder)}
        onClose={() => setActivePaymentOrder(null)}
        onPaymentSubmitted={() => {
          if (userRole === 'customer') {
            setCurrentTab('myBookings');
          }
        }}
      />

      {/* Image Library Modal */}
      <ImageLibraryModal
        isOpen={Boolean(imageLibraryTargetService)}
        onClose={() => setImageLibraryTargetService(null)}
        targetService={imageLibraryTargetService}
      />

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-slate-900 py-5 px-4 mt-8 text-slate-400 text-xs hidden md:block">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <div className="w-5 h-5 rounded-md bg-purple-600 flex items-center justify-center text-white">
              <Scissors className="w-3 h-3" />
            </div>
            <span className="font-bold text-slate-200">DREADLOCKS AND HAIR DRESSING SALOON</span>
            <span>— Akaunti ya {userRole === 'manager' ? 'Meneja' : userRole === 'staff' ? 'Mhudumu' : 'Mteja'}</span>
          </div>

          <div className="flex items-center space-x-3 text-[11px] text-slate-400">
            <span>Dreadlocks & Hair Styling</span>
            <span>•</span>
            <span>Swahili (TZ) | English | Français</span>
          </div>
        </div>
      </footer>

      {/* Mobile Bottom Navigation Bar (Tailored to Role) */}
      {/* 1. CUSTOMER BOTTOM MENU */}
      {userRole === 'customer' && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-md border-t border-slate-800 px-3 py-2 flex items-center justify-around shadow-2xl">
          <button
            type="button"
            onClick={() => setCurrentTab('services')}
            className={`flex flex-col items-center p-1 rounded-xl text-[10px] font-bold cursor-pointer ${
              currentTab === 'services' ? 'text-purple-400' : 'text-slate-400'
            }`}
          >
            <Sparkles className="w-4 h-4 mb-0.5" />
            <span>{lang === 'sw' ? 'Huduma' : 'Services'}</span>
          </button>

          <button
            type="button"
            onClick={() => setCurrentTab('staffShowcase')}
            className={`flex flex-col items-center p-1 rounded-xl text-[10px] font-bold cursor-pointer ${
              currentTab === 'staffShowcase' ? 'text-purple-400' : 'text-slate-400'
            }`}
          >
            <Users className="w-4 h-4 mb-0.5" />
            <span>{lang === 'sw' ? 'Wahudumu' : 'Stylists'}</span>
          </button>

          <button
            type="button"
            onClick={() => setCurrentTab('checkout')}
            className={`relative flex flex-col items-center p-1 rounded-xl text-[10px] font-bold cursor-pointer ${
              currentTab === 'checkout' ? 'text-purple-400' : 'text-slate-400'
            }`}
          >
            <ShoppingBag className="w-4 h-4 mb-0.5" />
            <span>{lang === 'sw' ? `Oda (${cart.length})` : `Cart (${cart.length})`}</span>
            {cart.length > 0 && (
              <span className="absolute top-0 right-1 w-2 h-2 bg-rose-500 rounded-full" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setCurrentTab('myBookings')}
            className={`flex flex-col items-center p-1 rounded-xl text-[10px] font-bold cursor-pointer ${
              currentTab === 'myBookings' ? 'text-purple-400' : 'text-slate-400'
            }`}
          >
            <Clock className="w-4 h-4 mb-0.5" />
            <span>{lang === 'sw' ? 'Miadi' : 'Bookings'}</span>
          </button>
        </div>
      )}

      {/* 2. STAFF BOTTOM MENU */}
      {userRole === 'staff' && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-md border-t border-slate-800 px-4 py-2 flex items-center justify-around shadow-2xl">
          <button
            type="button"
            onClick={() => setStaffScreen('jobs')}
            className={`flex flex-col items-center p-1 rounded-xl text-[10px] font-bold cursor-pointer ${
              staffScreen === 'jobs' ? 'text-purple-400' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Scissors className="w-4 h-4 mb-0.5" />
            <span>{lang === 'sw' ? 'Kazi Zangu' : 'My Jobs'}</span>
          </button>

          <button
            type="button"
            onClick={() => setStaffScreen('walkin')}
            className={`flex flex-col items-center p-1.5 px-3.5 rounded-2xl text-[10px] font-bold shadow-lg cursor-pointer -mt-4 active:scale-95 transition-all ${
              staffScreen === 'walkin' ? 'bg-purple-500 text-white ring-2 ring-purple-300' : 'bg-purple-600 hover:bg-purple-500 text-white'
            }`}
          >
            <Sparkles className="w-4 h-4 mb-0.5" />
            <span>+ Walk-in</span>
          </button>

          <button
            type="button"
            onClick={() => setStaffScreen('earnings')}
            className={`flex flex-col items-center p-1 rounded-xl text-[10px] font-bold cursor-pointer ${
              staffScreen === 'earnings' ? 'text-purple-400' : 'text-slate-400 hover:text-white'
            }`}
          >
            <DollarSign className="w-4 h-4 mb-0.5" />
            <span>{lang === 'sw' ? 'Mapato' : 'Earnings'}</span>
          </button>
        </div>
      )}

      {/* 3. MANAGER BOTTOM MENU */}
      {userRole === 'manager' && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-md border-t border-slate-800 px-3 py-2 flex items-center justify-around shadow-2xl">
          <button
            type="button"
            onClick={() => setManagerScreen('overview')}
            className={`flex flex-col items-center p-1 rounded-xl text-[10px] font-bold cursor-pointer ${
              managerScreen === 'overview' ? 'text-purple-400' : 'text-slate-400 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-4 h-4 mb-0.5" />
            <span>{lang === 'sw' ? 'Muhtasari' : 'Overview'}</span>
          </button>

          <button
            type="button"
            onClick={() => setManagerScreen('payments')}
            className={`flex flex-col items-center p-1 rounded-xl text-[10px] font-bold cursor-pointer ${
              managerScreen === 'payments' ? 'text-purple-400' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Clock className="w-4 h-4 mb-0.5" />
            <span>{lang === 'sw' ? 'Malipo' : 'Payments'}</span>
          </button>

          <button
            type="button"
            onClick={() => setManagerScreen('services')}
            className={`flex flex-col items-center p-1 rounded-xl text-[10px] font-bold cursor-pointer ${
              managerScreen === 'services' ? 'text-purple-400' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Scissors className="w-4 h-4 mb-0.5" />
            <span>{lang === 'sw' ? 'Huduma' : 'Services'}</span>
          </button>

          <button
            type="button"
            onClick={() => setManagerScreen('staff')}
            className={`flex flex-col items-center p-1 rounded-xl text-[10px] font-bold cursor-pointer ${
              managerScreen === 'staff' ? 'text-purple-400' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4 mb-0.5" />
            <span>{lang === 'sw' ? 'Wafanyakazi' : 'Staff'}</span>
          </button>
        </div>
      )}
    </div>
  );
}

export default App;

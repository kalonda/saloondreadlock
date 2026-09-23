import React, { useState } from 'react';
import { useSalonStore } from '../../store/salonStore';
import { getTranslation, formatCurrency } from '../../i18n';
import { Order, ServiceItem } from '../../types';
import { 
  Scissors, 
  DollarSign, 
  CheckCircle2, 
  Clock, 
  Play, 
  Check, 
  Filter,
  Plus,
  X,
  Smartphone,
  Banknote,
  Sparkles,
  Calendar,
  ArrowLeft,
  Download,
  Printer,
  FileSpreadsheet
} from 'lucide-react';
import { AndroidSuccessModal } from '../common/AndroidSuccessModal';
import { exportToCsv, printPdfReport } from '../../utils/reportGenerator';

export interface StaffDashboardProps {
  activeScreen?: 'jobs' | 'walkin' | 'earnings';
  onNavigateScreen?: (screen: 'jobs' | 'walkin' | 'earnings') => void;
}

export const StaffDashboard: React.FC<StaffDashboardProps> = ({
  activeScreen: externalScreen,
  onNavigateScreen
}) => {
  const { lang, staffList, currentUser, orders, updateOrderStatus, services, createOnsiteJob } = useSalonStore();
  const t = getTranslation(lang);

  const [internalScreen, setInternalScreen] = useState<'jobs' | 'walkin' | 'earnings'>('jobs');
  const activeScreen = externalScreen || internalScreen;

  const setScreen = (s: 'jobs' | 'walkin' | 'earnings') => {
    if (onNavigateScreen) {
      onNavigateScreen(s);
    } else {
      setInternalScreen(s);
    }
  };

  // Date Filtering State for Staff
  const [presetPeriod, setPresetPeriod] = useState<'today' | 'yesterday' | 'week' | 'month' | 'custom' | 'all'>('today');
  const [rangeFromDate, setRangeFromDate] = useState<string>(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  const [rangeToDate, setRangeToDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // Onsite / Walk-in Job Form State
  const [selectedServiceId, setSelectedServiceId] = useState<string>(services[0]?.id || '');
  const [onsitePrice, setOnsitePrice] = useState<number>(services[0]?.defaultPrice || 15000);
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [onsitePaymentMethod, setOnsitePaymentMethod] = useState<'cash' | 'mobile_money'>('cash');
  const [onsiteSuccessMessage, setOnsiteSuccessMessage] = useState<string | null>(null);

  // Android Success Modal State
  const [successModal, setSuccessModal] = useState<{ isOpen: boolean; title: string; message: string }>({
    isOpen: false,
    title: '',
    message: ''
  });

  const activeStaff = (currentUser?.role === 'staff' ? currentUser : null) || 
    staffList.find(s => s.id === currentUser?.id || s.username === currentUser?.username) ||
    staffList[0] || {
      id: currentUser?.id || 'staff-me',
      name: currentUser?.name || 'Stylist',
      avatar: currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      role: 'staff' as const,
      salary: 500000,
      specialization: 'Dreadlocks & Braids'
    };

  // Filter orders by active staff
  const staffOrders = orders.filter(
    o => o.assignedStaffId === activeStaff.id || (!o.assignedStaffId && o.status === 'confirmed')
  );

  // Filter orders based on the selected date filter
  const filteredStaffOrders = staffOrders.filter(ord => {
    const ordDate = new Date(ord.createdAt);
    const ordTime = ordDate.getTime();

    if (presetPeriod === 'custom') {
      const start = new Date(rangeFromDate).setHours(0, 0, 0, 0);
      const end = new Date(rangeToDate).setHours(23, 59, 59, 999);
      return ordTime >= start && ordTime <= end;
    }

    // Preset filtering
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startOfYesterday = startOfToday - 24 * 60 * 60 * 1000;
    const startOfWeek = startOfToday - now.getDay() * 24 * 60 * 60 * 1000;
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    if (presetPeriod === 'today') return ordTime >= startOfToday;
    if (presetPeriod === 'yesterday') return ordTime >= startOfYesterday && ordTime < startOfToday;
    if (presetPeriod === 'week') return ordTime >= startOfWeek;
    if (presetPeriod === 'month') return ordTime >= startOfMonth;
    return true; // 'all'
  });

  const activeQueue = staffOrders.filter(
    o => o.status === 'assigned' || o.status === 'confirmed' || o.status === 'in_progress'
  );

  const completedHistory = filteredStaffOrders.filter(
    o => o.status === 'completed'
  );

  const totalPeriodEarned = completedHistory.reduce((sum, ord) => sum + ord.totalAmount, 0);

  const handleStartService = (orderId: string) => {
    updateOrderStatus(orderId, 'in_progress');
  };

  const handleCompleteService = (orderId: string, bookingCode?: string) => {
    updateOrderStatus(orderId, 'completed');
    setSuccessModal({
      isOpen: true,
      title: lang === 'sw' ? 'Kazi Imekamilika!' : 'Service Completed!',
      message: lang === 'sw'
        ? `Kazi ya oda ${bookingCode ? '#' + bookingCode : ''} imekamilika kikamilifu na kuingizwa kwenye ripoti ya mapato.`
        : `Order ${bookingCode ? '#' + bookingCode : ''} has been completed and recorded to earnings.`
    });
  };

  const handleServiceChange = (srvId: string) => {
    setSelectedServiceId(srvId);
    const found = services.find(s => s.id === srvId);
    if (found) {
      setOnsitePrice(found.defaultPrice);
    }
  };

  const handleStartOnsiteJob = (e: React.FormEvent) => {
    e.preventDefault();
    const srv = services.find(s => s.id === selectedServiceId) || services[0];
    if (!srv) return;

    createOnsiteJob({
      staffId: activeStaff.id,
      staffName: activeStaff.name,
      staffAvatar: activeStaff.avatar,
      service: srv,
      price: onsitePrice || srv.defaultPrice,
      clientName: clientName.trim() || undefined,
      clientPhone: clientPhone.trim() || undefined,
      paymentMethod: onsitePaymentMethod
    });

    const srvName = lang === 'sw' ? srv.nameSw : srv.nameEn;
    setClientName('');
    setClientPhone('');
    setOnsiteSuccessMessage(null);

    setSuccessModal({
      isOpen: true,
      title: lang === 'sw' ? 'Kazi ya Walk-in Imeanza!' : 'Walk-in Job Started!',
      message: lang === 'sw' 
        ? `Huduma ya "${srvName}" imeanzishwa kikamilifu kwa mhudumu ${activeStaff.name}.`
        : `Service "${srvName}" has started for stylist ${activeStaff.name}.`
    });

    setScreen('jobs');
  };

  const handleExportMyReport = (format: 'pdf' | 'csv' = 'pdf') => {
    const periodLabelMap: Record<string, string> = {
      today: 'Leo',
      yesterday: 'Jana',
      week: 'Wiki Hii',
      month: 'Mwezi Huu',
      custom: `${rangeFromDate} hadi ${rangeToDate}`,
      all: 'Muda Wote'
    };
    const periodLabel = periodLabelMap[presetPeriod] || 'Leo';

    if (format === 'csv') {
      const headers = ['Msimbo wa Oda', 'Tarehe', 'Mteja', 'Huduma', 'Kiasi (TZS)'];
      const rows = completedHistory.map(o => [
        `#${o.bookingCode}`,
        new Date(o.createdAt).toLocaleDateString('sw-TZ'),
        o.customerName,
        o.items.map(i => i.nameSw).join(', '),
        o.totalAmount
      ]);
      exportToCsv(`Ripoti_Yangu_${activeStaff.name.replace(/[^a-zA-Z0-9]/g, '_')}_${periodLabel}`, headers, rows);
    } else {
      const rows = completedHistory.map(o => [
        `#${o.bookingCode}`,
        new Date(o.createdAt).toLocaleDateString('sw-TZ'),
        o.customerName,
        o.items.map(i => i.nameSw).join(', '),
        formatCurrency(o.totalAmount)
      ]);

      printPdfReport({
        title: `Ripoti Binafsi ya Kazi: ${activeStaff.name}`,
        subtitle: `Kazi na mapato yaliyozalishwa katika kipindi cha ${periodLabel}`,
        managerOrStaffName: activeStaff.name,
        periodLabel,
        stats: [
          { label: 'Kazi Zilizokamilika', value: completedHistory.length },
          { label: 'Mapato ya Kipindi', value: formatCurrency(totalPeriodEarned) },
          { label: 'Mshahara wa Mwezi', value: formatCurrency(activeStaff.salary || 450000) }
        ],
        headers: ['Oda', 'Tarehe', 'Mteja', 'Huduma', 'Kiasi'],
        rows,
        footerNote: 'DREADLOCKS AND HAIR DRESSING SALOON • Ripoti ya Mhudumu'
      });
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-5 sm:space-y-7 pb-20 w-full max-w-full overflow-x-hidden">
      
      {/* Android-style Segmented Screen Tabs */}
      <div className="flex items-center space-x-1.5 p-1.5 bg-slate-900 border border-slate-800 rounded-2xl overflow-x-auto shadow">
        <button
          type="button"
          onClick={() => setScreen('jobs')}
          className={`flex-1 min-w-[120px] py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition-all cursor-pointer ${
            activeScreen === 'jobs'
              ? 'bg-purple-600 text-white shadow-lg'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Scissors className="w-4 h-4" />
          <span>{lang === 'sw' ? 'Kazi Zangu' : 'My Jobs'}</span>
          {activeQueue.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-emerald-500 text-white text-[10px]">
              {activeQueue.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setScreen('walkin')}
          className={`flex-1 min-w-[140px] py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition-all cursor-pointer ${
            activeScreen === 'walkin'
              ? 'bg-purple-600 text-white shadow-lg'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>{lang === 'sw' ? '+ Sajili Walk-in' : '+ Walk-in Job'}</span>
        </button>

        <button
          type="button"
          onClick={() => setScreen('earnings')}
          className={`flex-1 min-w-[130px] py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition-all cursor-pointer ${
            activeScreen === 'earnings'
              ? 'bg-purple-600 text-white shadow-lg'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>{lang === 'sw' ? 'Mshahara & Ripoti' : 'Salary & Earnings'}</span>
        </button>
      </div>

      {/* SCREEN 1: JOBS QUEUE & HISTORY SCREEN */}
      {activeScreen === 'jobs' && (
        <div className="space-y-6">
          {/* Staff Header Box */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl">
            <div className="flex items-center space-x-3.5">
              <img
                src={activeStaff.avatar}
                alt={activeStaff.name}
                className="w-14 h-14 rounded-2xl object-cover border border-purple-500/40 shadow"
              />
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-purple-400">
                    {t.app.staffPortal}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20">
                    {t.app.accountVerified}
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">{activeStaff.name}</h2>
                <p className="text-xs text-slate-400">{activeStaff.specialization || 'Professional Hair Stylist'}</p>
              </div>
            </div>

            <button
              id="walkin-btn"
              type="button"
              onClick={() => setScreen('walkin')}
              className="px-4 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs sm:text-sm flex items-center space-x-1.5 shadow-lg shadow-purple-900/30 transition-all cursor-pointer self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>{t.app.startOnsiteJob}</span>
            </button>
          </div>

          {/* Active Work Queue */}
          <div className="space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">{t.staffDashboard.activeQueue}</h3>
                <span className="px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 text-xs font-bold border border-purple-500/20">
                  {activeQueue.length}
                </span>
              </div>
            </div>

            {activeQueue.length === 0 ? (
              <div className="text-center p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow space-y-2">
                <Clock className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-xs font-semibold text-slate-300">{t.staffDashboard.noActiveTasks}</p>
                <p className="text-[11px] text-slate-500">Meneja akipanga oda au mteja wa saluni akija, unaweza kuanzisha kazi kwa kubofya "+ Sajili Walk-in".</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeQueue.map((ord) => (
                  <div
                    key={ord.id}
                    className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-3.5 flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-1 rounded-xl bg-slate-800 text-purple-300 font-mono font-bold text-xs border border-slate-700">
                          {ord.bookingCode}
                        </span>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          ord.status === 'in_progress' ? 'bg-purple-600 text-white' : 'bg-emerald-600 text-white'
                        }`}>
                          {ord.status === 'in_progress' ? t.staffDashboard.inProgress : t.staffDashboard.confirmed}
                        </span>
                      </div>

                      <div>
                        <span className="text-[11px] text-slate-400 block">{t.staffDashboard.customerName}</span>
                        <h4 className="text-sm font-bold text-white">{ord.customerName}</h4>
                        <p className="text-xs text-slate-400 font-mono">{ord.customerPhone}</p>
                      </div>

                      <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/80 space-y-1">
                        <span className="text-[10px] text-slate-400 uppercase font-bold">{t.staffDashboard.services}</span>
                        {ord.items.map((it, idx) => (
                          <div key={idx} className="flex justify-between text-xs">
                            <span className="text-slate-200 font-medium">
                              {lang === 'en' ? it.nameEn : (lang === 'fr' ? it.nameFr : it.nameSw)} {it.selectedOptionLabel ? `(${it.selectedOptionLabel})` : ''}
                            </span>
                            <span className="text-amber-400 font-mono font-bold">{formatCurrency(it.selectedPrice)}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-800">
                      {ord.status !== 'in_progress' ? (
                        <button
                          type="button"
                          onClick={() => handleStartService(ord.id)}
                          className="w-full py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center justify-center space-x-1.5 shadow transition-all cursor-pointer"
                        >
                          <Play className="w-3.5 h-3.5 fill-white" />
                          <span>{t.staffDashboard.actionStart}</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleCompleteService(ord.id, ord.bookingCode)}
                          className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center space-x-1.5 shadow transition-all cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                          <span>{t.staffDashboard.actionComplete}</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SCREEN 2: WALK-IN / ONSITE SERVICE REGISTRATION (WITH CLOSE & CANCEL BUTTONS) */}
      {activeScreen === 'walkin' && (
        <div className="p-5 sm:p-7 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-5 max-w-2xl mx-auto">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">{t.app.onsiteJobModalTitle}</h3>
                <p className="text-xs text-slate-400 mt-0.5">{t.app.onsiteJobSubtitle}</p>
              </div>
            </div>

            {/* Top Right Close Button */}
            <button
              type="button"
              onClick={() => setScreen('jobs')}
              className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
              aria-label="Funga fomu ya walk-in"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {onsiteSuccessMessage && (
            <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{onsiteSuccessMessage}</span>
            </div>
          )}

          <form onSubmit={handleStartOnsiteJob} className="space-y-4">
            {/* Service Picker */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                {t.app.selectServiceLabel} *
              </label>
              <select
                value={selectedServiceId}
                onChange={(e) => handleServiceChange(e.target.value)}
                className="w-full p-3 rounded-2xl bg-slate-800 border border-slate-700 text-xs text-white focus:border-purple-500 focus:outline-none"
              >
                {services.map(s => (
                  <option key={s.id} value={s.id}>
                    {lang === 'en' ? s.nameEn : (lang === 'fr' ? s.nameFr : s.nameSw)} — ({formatCurrency(s.defaultPrice)})
                  </option>
                ))}
              </select>
            </div>

            {/* Price Verification */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                {t.app.priceLabel} (TZS) *
              </label>
              <input
                type="number"
                required
                value={onsitePrice}
                onChange={(e) => setOnsitePrice(parseInt(e.target.value, 10) || 0)}
                className="w-full p-3 rounded-2xl bg-slate-800 border border-slate-700 text-sm font-mono font-bold text-amber-400 focus:border-purple-500 focus:outline-none"
              />
            </div>

            {/* Client Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  {t.customer.enterName} ({t.app.clientWalkinDefault})
                </label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Mteja wa Saluni (Walk-in)"
                  className="w-full p-3 rounded-2xl bg-slate-800 border border-slate-700 text-xs text-white focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  {t.customer.enterPhone} (Hiari)
                </label>
                <input
                  type="tel"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  placeholder="+255 7XX XXX XXX"
                  className="w-full p-3 rounded-2xl bg-slate-800 border border-slate-700 text-xs text-white focus:border-purple-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Payment Method */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                {t.checkout.paymentMethod}:
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setOnsitePaymentMethod('cash')}
                  className={`p-3 rounded-2xl border text-xs font-semibold flex items-center justify-center space-x-2 cursor-pointer transition-all ${
                    onsitePaymentMethod === 'cash'
                      ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300 ring-2 ring-emerald-500/50'
                      : 'bg-slate-800 border-slate-700 text-slate-400'
                  }`}
                >
                  <Banknote className="w-4 h-4" />
                  <span>{t.checkout.cash}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setOnsitePaymentMethod('mobile_money')}
                  className={`p-3 rounded-2xl border text-xs font-semibold flex items-center justify-center space-x-2 cursor-pointer transition-all ${
                    onsitePaymentMethod === 'mobile_money'
                      ? 'bg-purple-600/20 border-purple-500 text-purple-300 ring-2 ring-purple-500/50'
                      : 'bg-slate-800 border-slate-700 text-slate-400'
                  }`}
                >
                  <Smartphone className="w-4 h-4" />
                  <span>{t.checkout.mobileMoney}</span>
                </button>
              </div>
            </div>

            {/* Form Footer Action Buttons */}
            <div className="pt-4 flex items-center space-x-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setScreen('jobs')}
                className="flex-1 py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs sm:text-sm cursor-pointer transition-colors"
              >
                Ghairi / Funga
              </button>

              <button
                type="submit"
                className="flex-[2] py-3 px-4 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs sm:text-sm shadow-xl flex items-center justify-center space-x-2 cursor-pointer transition-all"
              >
                <Sparkles className="w-4 h-4" />
                <span>{t.app.startJobNow}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* SCREEN 3: SALARY & EARNINGS REPORTS (WITH CUSTOM DATE FILTER) */}
      {activeScreen === 'earnings' && (
        <div className="space-y-6">
          {/* Earnings Summary Header */}
          <div className="p-5 sm:p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  {lang === 'sw' ? 'Mshahara & Ripoti ya Mapato' : 'Salary & Earnings Report'}
                </h3>
                <p className="text-xs text-slate-400">
                  {lang === 'sw' ? `Ripoti ya mapato ya ${activeStaff.name} kulingana na kazi alizofanya` : `Performance and earnings for ${activeStaff.name}`}
                </p>
              </div>

              {/* Date Filter Tabs */}
              <div className="flex flex-wrap items-center gap-1 p-1 rounded-2xl bg-slate-800 border border-slate-700">
                <button
                  type="button"
                  onClick={() => setPresetPeriod('today')}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    presetPeriod === 'today' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {t.app.periodDaily}
                </button>
                <button
                  type="button"
                  onClick={() => setPresetPeriod('yesterday')}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    presetPeriod === 'yesterday' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {t.managerDashboard.filterYesterday}
                </button>
                <button
                  type="button"
                  onClick={() => setPresetPeriod('week')}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    presetPeriod === 'week' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {t.app.periodWeekly}
                </button>
                <button
                  type="button"
                  onClick={() => setPresetPeriod('month')}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    presetPeriod === 'month' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {t.app.periodMonthly}
                </button>
                <button
                  type="button"
                  onClick={() => setPresetPeriod('custom')}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    presetPeriod === 'custom' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {lang === 'sw' ? 'Maalum (Custom)' : 'Custom'}
                </button>
                <button
                  type="button"
                  onClick={() => setPresetPeriod('all')}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    presetPeriod === 'all' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {t.managerDashboard.filterAll}
                </button>
              </div>

              {/* Action Export Buttons */}
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => handleExportMyReport('pdf')}
                  className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center space-x-1 shadow cursor-pointer transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Pakua PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleExportMyReport('csv')}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/30 text-xs font-bold flex items-center space-x-1 cursor-pointer transition-colors"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Pakua CSV</span>
                </button>
              </div>
            </div>

            {/* Custom Date Pickers for Staff Earnings */}
            {presetPeriod === 'custom' && (
              <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center gap-3 animate-fade-in">
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-slate-400">Kuanzia tarehe:</span>
                  <input
                    type="date"
                    value={rangeFromDate}
                    onChange={(e) => setRangeFromDate(e.target.value)}
                    className="p-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:border-purple-500 focus:outline-none"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-slate-400">Hadi tarehe:</span>
                  <input
                    type="date"
                    value={rangeToDate}
                    onChange={(e) => setRangeToDate(e.target.value)}
                    className="p-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:border-purple-500 focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* Key Summary Cards for Staff */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-1">
                <span className="text-xs text-slate-400 block font-semibold">{t.app.earnedInPeriod}</span>
                <p className="text-xl sm:text-2xl font-black text-amber-400 font-mono">
                  {formatCurrency(totalPeriodEarned)}
                </p>
                <p className="text-[11px] text-slate-400">{completedHistory.length} kazi zilizokamilika</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-1">
                <span className="text-xs text-slate-400 block font-semibold">{t.staffDashboard.salaryRate}</span>
                <p className="text-xl sm:text-2xl font-black text-emerald-400 font-mono">
                  {formatCurrency(activeStaff.salary || 450000)}
                </p>
                <p className="text-[11px] text-slate-400">Kiwango rasmi cha mwezi</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-1">
                <span className="text-xs text-slate-400 block font-semibold">Utaalamu & Huduma</span>
                <p className="text-sm font-bold text-white truncate">
                  {activeStaff.specialization || 'All Salon Services'}
                </p>
                <p className="text-[11px] text-purple-400">Akaunti imethibitishwa</p>
              </div>
            </div>
          </div>

          {/* Completed Work History */}
          <div className="p-5 sm:p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
            <h3 className="text-base font-bold text-white tracking-tight">{t.staffDashboard.orderHistory}</h3>
            
            {completedHistory.length === 0 ? (
              <p className="text-xs text-slate-500 py-3 text-center">Hakuna kazi zilizokamilika katika kipindi hiki.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-800/80 text-slate-400 uppercase font-semibold">
                    <tr>
                      <th className="p-2.5 rounded-l-xl">Oda / Msimbo</th>
                      <th className="p-2.5">Tarehe</th>
                      <th className="p-2.5">Mteja</th>
                      <th className="p-2.5">Huduma</th>
                      <th className="p-2.5 rounded-r-xl">Kiasi Kilicholipwa</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {completedHistory.map((ord) => (
                      <tr key={ord.id} className="hover:bg-slate-800/40">
                        <td className="p-2.5 font-mono text-purple-300 font-bold">{ord.bookingCode}</td>
                        <td className="p-2.5 text-slate-400">{new Date(ord.createdAt).toLocaleDateString('en-GB')}</td>
                        <td className="p-2.5 font-medium text-white">{ord.customerName}</td>
                        <td className="p-2.5">{ord.items.map(i => lang === 'en' ? i.nameEn : (lang === 'fr' ? i.nameFr : i.nameSw)).join(', ')}</td>
                        <td className="p-2.5 font-mono font-bold text-amber-400">{formatCurrency(ord.totalAmount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ANDROID SUCCESS CONFIRMATION MODAL */}
      <AndroidSuccessModal
        isOpen={successModal.isOpen}
        title={successModal.title}
        message={successModal.message}
        onClose={() => setSuccessModal({ isOpen: false, title: '', message: '' })}
      />
    </div>
  );
};

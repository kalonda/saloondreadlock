import React, { useState, useEffect } from 'react';
import { useSalonStore } from '../../store/salonStore';
import { getTranslation, formatCurrency } from '../../i18n';
import { ServiceItem, Order, User } from '../../types';
import { 
  ShieldCheck, 
  Users, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  UserPlus, 
  Scissors, 
  DollarSign, 
  Check, 
  X, 
  Smartphone, 
  Filter, 
  BarChart3, 
  Plus, 
  Image as ImageIcon, 
  Edit3,
  Banknote,
  Search,
  Trash2,
  Download,
  Printer,
  FileSpreadsheet,
  FileText
} from 'lucide-react';
import { ServiceCrudModal } from './ServiceCrudModal';
import { ImageLibraryModal } from './ImageLibraryModal';
import { StaffCrudModal } from './StaffCrudModal';
import { OrderCrudModal } from './OrderCrudModal';
import { PaymentSettingsModal } from './PaymentSettingsModal';
import { AndroidSuccessModal } from '../common/AndroidSuccessModal';
import { exportToCsv, printPdfReport } from '../../utils/reportGenerator';

export interface ManagerDashboardProps {
  activeScreen?: 'overview' | 'payments' | 'services' | 'staff';
  onNavigateScreen?: (screen: 'overview' | 'payments' | 'services' | 'staff') => void;
}

export const ManagerDashboard: React.FC<ManagerDashboardProps> = ({ 
  activeScreen: externalScreen, 
  onNavigateScreen 
}) => {
  const [internalScreen, setInternalScreen] = useState<'overview' | 'payments' | 'services' | 'staff'>('overview');
  const activeScreen = externalScreen || internalScreen;

  const setScreen = (s: 'overview' | 'payments' | 'services' | 'staff') => {
    setInternalScreen(s);
    if (onNavigateScreen) {
      onNavigateScreen(s);
    }
  };

  const { 
    lang, 
    currentUser,
    orders, 
    services, 
    staffList, 
    confirmPayment, 
    rejectPayment, 
    assignStaff, 
    updateOrder,
    deleteOrder,
    getMetrics,
    getStaffPeriodStats,
    managerUser 
  } = useSalonStore();
  const t = getTranslation(lang);

  const activeManager = (currentUser?.role === 'manager' ? currentUser : null) || managerUser;

  // Mobile Payment Settings Modal State
  const [showPaymentSettingsModal, setShowPaymentSettingsModal] = useState(false);

  // Order CRUD Modal State
  const [showOrderCrudModal, setShowOrderCrudModal] = useState(false);
  const [selectedOrderForEdit, setSelectedOrderForEdit] = useState<Order | null>(null);

  // Overview Date Filter
  const [dateFilter, setDateFilter] = useState<'today' | 'yesterday' | 'week' | 'month' | 'custom' | 'all'>('today');
  const [overviewStartDate, setOverviewStartDate] = useState<string>(
    new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [overviewEndDate, setOverviewEndDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  // Staff Performance Period Filter
  const [staffPeriodFilter, setStaffPeriodFilter] = useState<'today' | 'yesterday' | 'week' | 'month' | 'custom' | 'all'>('today');
  const [staffStartDate, setStaffStartDate] = useState<string>(
    new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [staffEndDate, setStaffEndDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  // Staff & Manager CRUD Modal State
  const [showStaffCrudModal, setShowStaffCrudModal] = useState(false);
  const [selectedStaffForEdit, setSelectedStaffForEdit] = useState<User | null>(null);

  // Order assignment modal
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedOrderToAssign, setSelectedOrderToAssign] = useState<Order | null>(null);

  // Service CRUD & Image modals
  const [showServiceCrudModal, setShowServiceCrudModal] = useState(false);
  const [editingService, setEditingService] = useState<ServiceItem | null>(null);
  const [showImageLibraryModal, setShowImageLibraryModal] = useState(false);
  const [targetServiceForImage, setTargetServiceForImage] = useState<ServiceItem | null>(null);

  // Service Catalog Search & Pagination state
  const [serviceSearch, setServiceSearch] = useState('');
  const [serviceCategory, setServiceCategory] = useState('all');
  const [showAllServices, setShowAllServices] = useState(false);

  // Android Success Modal State
  const [successModal, setSuccessModal] = useState<{ isOpen: boolean; title: string; message: string }>({
    isOpen: false,
    title: '',
    message: ''
  });

  const metrics = getMetrics(dateFilter, overviewStartDate, overviewEndDate);

  const pendingVerifications = orders.filter(o => o.status === 'paid_pending_confirmation');
  const unassignedOrders = orders.filter(
    o => !o.assignedStaffId && (o.status === 'pending_assignment' || o.status === 'confirmed' || o.status === 'pending_payment')
  );

  // Export Staff Performance Report (Individual or Entire Team)
  const handleExportStaffReport = (targetStaffId?: string, format: 'pdf' | 'csv' = 'pdf') => {
    const isSingle = targetStaffId && targetStaffId !== 'all';
    const targetStaff = isSingle ? staffList.find(s => s.id === targetStaffId) : null;
    const personnelToReport = isSingle && targetStaff ? [targetStaff] : staffList;

    const periodLabelMap: Record<string, string> = {
      today: 'Leo',
      yesterday: 'Jana',
      week: 'Wiki Hii',
      month: 'Mwezi Huu',
      custom: `${staffStartDate} hadi ${staffEndDate}`,
      all: 'Muda Wote'
    };

    const currentPeriodLabel = periodLabelMap[staffPeriodFilter] || 'Leo';

    if (format === 'csv') {
      const headers = ['Jina la Fundi', 'Cheo / Utaalamu', 'Kipindi', 'Mapato (TZS)', 'Idadi ya Kazi', 'Mshahara wa Mwezi (TZS)'];
      const rows = personnelToReport.map(s => {
        const stats = getStaffPeriodStats(s.id, staffPeriodFilter, staffStartDate, staffEndDate);
        return [
          s.name,
          s.specialization || (s.role === 'manager' ? 'Meneja' : 'Fundi'),
          currentPeriodLabel,
          stats.periodRevenue,
          stats.periodCount,
          s.salary || 450000
        ];
      });
      exportToCsv(`Ripoti_Wafanyakazi_${currentPeriodLabel.replace(/[^a-zA-Z0-9]/g, '_')}`, headers, rows);
    } else {
      // PDF Printable
      let totalRevenue = 0;
      let totalTasks = 0;
      const rows = personnelToReport.map(s => {
        const stats = getStaffPeriodStats(s.id, staffPeriodFilter, staffStartDate, staffEndDate);
        totalRevenue += stats.periodRevenue;
        totalTasks += stats.periodCount;
        return [
          s.name,
          s.specialization || (s.role === 'manager' ? 'Meneja' : 'Fundi'),
          `${stats.periodCount} kazi`,
          formatCurrency(stats.periodRevenue),
          formatCurrency(s.salary || 450000)
        ];
      });

      printPdfReport({
        title: isSingle && targetStaff ? `Ripoti ya Kazi: ${targetStaff.name}` : 'Ripoti ya Utendaji wa Kundi la Wafanyakazi',
        subtitle: `Uchambuzi wa kazi na mapato ya wahudumu wa saluni`,
        managerOrStaffName: activeManager.name,
        periodLabel: currentPeriodLabel,
        stats: [
          { label: 'Jumla ya Wafanyakazi', value: personnelToReport.length },
          { label: 'Jumla ya Kazi Zilizofanyika', value: totalTasks },
          { label: 'Jumla ya Mapato', value: formatCurrency(totalRevenue) }
        ],
        headers: ['Jina la Fundi', 'Utaalamu', 'Kazi Zilizokamilika', 'Mapato Katika Kipindi', 'Mshahara'],
        rows,
        footerNote: 'Ripoti hii imezalishwa na Mfumo wa DREADLOCKS AND HAIR DRESSING SALOON'
      });
    }
  };

  // Export Salon Orders / Revenue Report
  const handleExportOrdersReport = (format: 'pdf' | 'csv' = 'pdf') => {
    const periodLabelMap: Record<string, string> = {
      today: 'Leo',
      yesterday: 'Jana',
      week: 'Wiki Hii',
      month: 'Mwezi Huu',
      custom: `${overviewStartDate} hadi ${overviewEndDate}`,
      all: 'Muda Wote'
    };

    const currentPeriodLabel = periodLabelMap[dateFilter] || 'Leo';

    if (format === 'csv') {
      const headers = ['Namba ya Oda', 'Mteja', 'Simu', 'Huduma', 'Bei (TZS)', 'Hali ya Oda', 'Mhudumu Aliyepewa', 'Njia ya Malipo', 'Tarehe'];
      const rows = orders.map(o => [
        `#${o.bookingCode}`,
        o.customerName,
        o.customerPhone,
        o.items.map(i => i.nameSw).join(' + '),
        o.totalAmount,
        o.status,
        o.assignedStaffName || 'Haijapangiwa',
        o.paymentMethod || 'cash',
        new Date(o.createdAt).toLocaleString('sw-TZ')
      ]);
      exportToCsv(`Ripoti_Oda_Saluni_${currentPeriodLabel.replace(/[^a-zA-Z0-9]/g, '_')}`, headers, rows);
    } else {
      const totalAmount = orders.reduce((acc, curr) => acc + curr.totalAmount, 0);
      const completedCount = orders.filter(o => o.status === 'completed' || o.status === 'confirmed').length;

      const rows = orders.slice(0, 100).map(o => [
        `#${o.bookingCode}`,
        o.customerName,
        o.items.map(i => i.nameSw).join(', '),
        formatCurrency(o.totalAmount),
        o.assignedStaffName || '-',
        o.status.toUpperCase(),
        new Date(o.createdAt).toLocaleDateString('sw-TZ')
      ]);

      printPdfReport({
        title: 'Ripoti Rasmi ya Mauzo na Historia ya Oda',
        subtitle: `Orodha ya oda zilizowekwa saluni`,
        managerOrStaffName: activeManager.name,
        periodLabel: currentPeriodLabel,
        stats: [
          { label: 'Jumla ya Oda', value: orders.length },
          { label: 'Zilizokamilika/Thibitishwa', value: completedCount },
          { label: 'Jumla ya Thamani ya Mauzo', value: formatCurrency(totalAmount) }
        ],
        headers: ['Namba', 'Mteja', 'Huduma', 'Kiasi', 'Fundi', 'Hali', 'Tarehe'],
        rows,
        footerNote: 'DREADLOCKS AND HAIR DRESSING SALOON • Ripoti ya Mauzo'
      });
    }
  };

  // Staff Work History Filter States
  const [staffHistoryFilterStaff, setStaffHistoryFilterStaff] = useState<string>('all');
  const [staffHistoryFilterStatus, setStaffHistoryFilterStatus] = useState<string>('all');

  // Real-time Staff Job Start / Completion Alerts for Manager
  const [liveAlerts, setLiveAlerts] = useState<Array<{ id: string; message: string; type: 'start' | 'complete'; time: string }>>([]);
  const prevOrdersRef = React.useRef<Record<string, string>>({});

  useEffect(() => {
    const prev = prevOrdersRef.current;
    orders.forEach(ord => {
      const prevStatus = prev[ord.id];
      if (prevStatus && prevStatus !== ord.status) {
        if (ord.status === 'in_progress') {
          const staffName = ord.assignedStaffName || 'Mfanyakazi';
          const srvName = ord.items[0]?.nameSw || 'Huduma';
          const alertItem = {
            id: `${ord.id}-${Date.now()}`,
            message: lang === 'sw' 
              ? `Fundi ${staffName} ameanza kazi ya "${srvName}" kwa mteja ${ord.customerName} (#${ord.bookingCode})`
              : `Stylist ${staffName} started "${srvName}" for client ${ord.customerName} (#${ord.bookingCode})`,
            type: 'start' as const,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          };
          setLiveAlerts(curr => [alertItem, ...curr.filter(a => a.id !== alertItem.id).slice(0, 4)]);
        } else if (ord.status === 'completed') {
          const staffName = ord.assignedStaffName || 'Mfanyakazi';
          const srvName = ord.items[0]?.nameSw || 'Huduma';
          const alertItem = {
            id: `${ord.id}-${Date.now()}`,
            message: lang === 'sw'
              ? `Fundi ${staffName} amekamilisha kazi ya "${srvName}" kwa mteja ${ord.customerName} (#${ord.bookingCode})`
              : `Stylist ${staffName} completed "${srvName}" for client ${ord.customerName} (#${ord.bookingCode})`,
            type: 'complete' as const,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          };
          setLiveAlerts(curr => [alertItem, ...curr.filter(a => a.id !== alertItem.id).slice(0, 4)]);
        }
      }
      prev[ord.id] = ord.status;
    });
    prevOrdersRef.current = { ...prev };
  }, [orders, lang]);

  const handleConfirmAssignment = (staffId: string) => {
    if (selectedOrderToAssign) {
      assignStaff(selectedOrderToAssign.id, staffId);
      const code = selectedOrderToAssign.bookingCode;
      setShowAssignModal(false);
      setSelectedOrderToAssign(null);

      setSuccessModal({
        isOpen: true,
        title: lang === 'sw' ? 'Mhudumu Amepangiwa!' : 'Staff Assigned!',
        message: lang === 'sw' 
          ? `Oda #${code} imepangiwa mhudumu kikamilifu.`
          : `Order #${code} has been successfully assigned to staff.`
      });
    }
  };

  const handleConfirmPaymentWithNotice = (orderId: string, bookingCode: string) => {
    confirmPayment(orderId);
    setSuccessModal({
      isOpen: true,
      title: lang === 'sw' ? 'Malipo Yamethibitishwa!' : 'Payment Verified!',
      message: lang === 'sw'
        ? `Malipo ya oda #${bookingCode} yamethibitishwa na kuingizwa kwenye ripoti.`
        : `Payment for order #${bookingCode} has been verified and recorded.`
    });
  };

  // All personnel (Manager + Staff)
  const allPersonnel: User[] = [
    managerUser,
    ...staffList.filter(s => s.id !== managerUser.id && s.email !== managerUser.email && s.username !== managerUser.username)
  ];

  // Filtered Services for Catalog
  const filteredServices = services.filter(srv => {
    const matchesCategory = serviceCategory === 'all' || srv.category === serviceCategory;
    const q = serviceSearch.toLowerCase().trim();
    if (!q) return matchesCategory;
    return matchesCategory && (
      srv.nameSw.toLowerCase().includes(q) ||
      srv.nameEn.toLowerCase().includes(q) ||
      srv.nameFr.toLowerCase().includes(q)
    );
  });

  const displayedServices = (serviceSearch.trim() || showAllServices)
    ? filteredServices
    : filteredServices.slice(0, 3);

  return (
    <div className="max-w-7xl mx-auto space-y-5 sm:space-y-7 pb-20 w-full max-w-full overflow-x-hidden">
      
      {/* Real-time Android-style Live Activity & Job Notifications Banner */}
      {liveAlerts.length > 0 && (
        <div className="space-y-2 animate-fade-in">
          {liveAlerts.map(alert => (
            <div 
              key={alert.id}
              className={`p-3.5 sm:p-4 rounded-2xl border flex items-center justify-between gap-3 shadow-xl ${
                alert.type === 'start'
                  ? 'bg-gradient-to-r from-amber-950/70 to-slate-900 border-amber-500/40 text-amber-200'
                  : 'bg-gradient-to-r from-emerald-950/70 to-slate-900 border-emerald-500/40 text-emerald-200'
              }`}
            >
              <div className="flex items-center space-x-3">
                <span className="text-xl shrink-0">
                  {alert.type === 'start' ? '🔔' : '✅'}
                </span>
                <div>
                  <p className="text-xs sm:text-sm font-bold text-white tracking-tight">
                    {alert.message}
                  </p>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {alert.time} • Live Salon Update
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setLiveAlerts(curr => curr.filter(a => a.id !== alert.id))}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Android-style Segmented Screen Navigation Tabs */}
      <div className="flex items-center space-x-1.5 p-1.5 bg-slate-900 border border-slate-800 rounded-2xl overflow-x-auto shadow">
        <button
          type="button"
          onClick={() => setScreen('overview')}
          className={`flex-1 min-w-[120px] py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition-all cursor-pointer ${
            activeScreen === 'overview'
              ? 'bg-purple-600 text-white shadow-lg'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>{lang === 'sw' ? 'Muhtasari' : 'Overview'}</span>
        </button>

        <button
          type="button"
          onClick={() => setScreen('payments')}
          className={`flex-1 min-w-[140px] py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition-all cursor-pointer ${
            activeScreen === 'payments'
              ? 'bg-purple-600 text-white shadow-lg'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>{lang === 'sw' ? 'Malipo & Oda' : 'Payments & Orders'}</span>
          {pendingVerifications.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px]">
              {pendingVerifications.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setScreen('services')}
          className={`flex-1 min-w-[120px] py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition-all cursor-pointer ${
            activeScreen === 'services'
              ? 'bg-purple-600 text-white shadow-lg'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Scissors className="w-4 h-4" />
          <span>{lang === 'sw' ? 'Huduma' : 'Services'}</span>
        </button>

        <button
          type="button"
          onClick={() => setScreen('staff')}
          className={`flex-1 min-w-[130px] py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition-all cursor-pointer ${
            activeScreen === 'staff'
              ? 'bg-purple-600 text-white shadow-lg'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>{lang === 'sw' ? 'Wafanyakazi' : 'Staff'}</span>
        </button>
      </div>

      {/* SCREEN 1: OVERVIEW SCREEN */}
      {activeScreen === 'overview' && (
        <div className="space-y-6">
          {/* Overview Contextual Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              {activeManager.avatar ? (
                <img 
                  src={activeManager.avatar} 
                  alt={activeManager.name}
                  className="w-14 h-14 rounded-2xl object-cover border-2 border-purple-500/60 shadow-lg shadow-purple-900/30 shrink-0" 
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    const parent = e.currentTarget.parentElement;
                    if (parent) {
                      const fallback = parent.querySelector('.avatar-fallback');
                      if (fallback) fallback.classList.remove('hidden');
                    }
                  }}
                />
              ) : null}
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-700 to-indigo-600 border-2 border-purple-500/60 shadow-lg shadow-purple-900/30 flex items-center justify-center text-white font-black text-lg shrink-0 ${activeManager.avatar ? 'avatar-fallback hidden' : ''}`}>
                {activeManager.name ? activeManager.name.substring(0, 2).toUpperCase() : 'M'}
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-base sm:text-lg font-black text-white tracking-tight">
                    {activeManager.name}
                  </span>
                  <span className="px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    {lang === 'sw' ? 'Meneja' : 'Manager'}
                  </span>
                </div>
                <div className="flex items-center space-x-2 text-xs text-slate-400 mt-0.5">
                  <span>@{activeManager.username || (activeManager.email ? activeManager.email.split('@')[0] : 'admin')}</span>
                  <span>•</span>
                  <span>{activeManager.phone || '+255 754 111 222'}</span>
                </div>
                <p className="text-xs text-purple-300/80 font-medium mt-1">
                  {t.managerDashboard.title}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setShowPaymentSettingsModal(true)}
                className="px-3.5 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 text-xs font-bold flex items-center space-x-2 shadow transition-all cursor-pointer"
              >
                <Smartphone className="w-4 h-4 text-amber-400" />
                <span>{lang === 'sw' ? 'Lipa Namba' : 'Payment Settings'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedStaffForEdit(null);
                  setShowStaffCrudModal(true);
                }}
                className="px-4 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center space-x-2 shadow-lg shadow-purple-900/30 transition-all cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>{t.managerDashboard.manageStaffBtn}</span>
              </button>
            </div>
          </div>

          {/* Date Filter Bar with Custom Interval Support */}
          <div className="p-4 sm:p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-purple-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  {t.managerDashboard.dateFilter}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-1 p-1 rounded-2xl bg-slate-800 border border-slate-700">
                <button
                  type="button"
                  onClick={() => setDateFilter('today')}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    dateFilter === 'today' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {t.managerDashboard.filterToday}
                </button>
                <button
                  type="button"
                  onClick={() => setDateFilter('yesterday')}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    dateFilter === 'yesterday' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {t.managerDashboard.filterYesterday}
                </button>
                <button
                  type="button"
                  onClick={() => setDateFilter('week')}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    dateFilter === 'week' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {t.managerDashboard.filterWeek}
                </button>
                <button
                  type="button"
                  onClick={() => setDateFilter('month')}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    dateFilter === 'month' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {t.managerDashboard.filterMonth}
                </button>
                <button
                  type="button"
                  onClick={() => setDateFilter('custom')}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    dateFilter === 'custom' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {lang === 'sw' ? 'Maalum (Custom)' : 'Custom'}
                </button>
                <button
                  type="button"
                  onClick={() => setDateFilter('all')}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    dateFilter === 'all' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {t.managerDashboard.filterAll}
                </button>
              </div>
            </div>

            {/* Custom Date Pickers */}
            {dateFilter === 'custom' && (
              <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center gap-3 animate-fade-in">
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-slate-400">Kuanzia:</span>
                  <input
                    type="date"
                    value={overviewStartDate}
                    onChange={(e) => setOverviewStartDate(e.target.value)}
                    className="p-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:border-purple-500 focus:outline-none"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-slate-400">Hadi:</span>
                  <input
                    type="date"
                    value={overviewEndDate}
                    onChange={(e) => setOverviewEndDate(e.target.value)}
                    className="p-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:border-purple-500 focus:outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Top 4 Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 sm:p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-2">
              <div className="flex items-center justify-between text-amber-400">
                <span className="text-xs font-bold uppercase tracking-wider">{t.managerDashboard.totalRevenue}</span>
                <DollarSign className="w-4 h-4" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-amber-300 font-mono">
                {formatCurrency(metrics.totalRevenue)}
              </div>
              <p className="text-[11px] text-emerald-400 font-medium">Mapato yaliyothibitishwa</p>
            </div>

            <div className="p-5 sm:p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-2">
              <div className="flex items-center justify-between text-purple-400">
                <span className="text-xs font-bold uppercase tracking-wider">{t.managerDashboard.customerVolume}</span>
                <Users className="w-4 h-4" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-white font-mono">
                {metrics.completedOrdersCount} <span className="text-xs font-normal text-slate-400">wateja</span>
              </div>
              <p className="text-[11px] text-slate-400">Oda zilizokamilika</p>
            </div>

            <div className="p-5 sm:p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-2">
              <div className="flex items-center justify-between text-rose-400">
                <span className="text-xs font-bold uppercase tracking-wider">{t.managerDashboard.pendingVerifications}</span>
                <Clock className="w-4 h-4" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-rose-400 font-mono">
                {metrics.pendingConfirmationCount} <span className="text-xs font-normal text-slate-400">SMS</span>
              </div>
              <p className="text-[11px] text-slate-400">Zinasubiri uhakiki wako</p>
            </div>

            <div className="p-5 sm:p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-2">
              <div className="flex items-center justify-between text-indigo-400">
                <span className="text-xs font-bold uppercase tracking-wider">{t.managerDashboard.activeStaffMembers}</span>
                <Scissors className="w-4 h-4" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-white font-mono">
                {metrics.activeStaffCount} <span className="text-xs font-normal text-slate-400">wahudumu</span>
              </div>
              <p className="text-[11px] text-slate-400">Wafanyakazi waliosajiliwa</p>
            </div>
          </div>
        </div>
      )}

      {/* SCREEN 2: PAYMENTS & ORDERS SCREEN */}
      {activeScreen === 'payments' && (
        <div className="space-y-6">
          {/* Top Actions & Report Export Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 sm:p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl">
            <div>
              <h3 className="text-base sm:text-lg font-black text-white">Usimamizi wa Oda & Malipo</h3>
              <p className="text-xs text-slate-400">CRUD ya oda zote, kuhakiki miamala, kupanga mafundi na kupakua ripoti</p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedOrderForEdit(null);
                  setShowOrderCrudModal(true);
                }}
                className="px-3.5 py-2 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center space-x-1.5 shadow-lg transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Weka Oda Mpya</span>
              </button>

              <button
                type="button"
                onClick={() => handleExportOrdersReport('pdf')}
                className="px-3 py-2 rounded-2xl bg-slate-800 hover:bg-slate-700 text-purple-300 border border-purple-500/30 text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer"
                title="Chapisha au Hifadhi kama PDF"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Ripoti ya PDF</span>
              </button>

              <button
                type="button"
                onClick={() => handleExportOrdersReport('csv')}
                className="px-3 py-2 rounded-2xl bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/30 text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer"
                title="Pakua faili la Excel/CSV"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Pakua CSV</span>
              </button>
            </div>
          </div>

          {/* SECTION 1: Pending Payment Verifications */}
          <div id="orders-verification" className="p-5 sm:p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                    {t.managerDashboard.verificationQueueTitle}
                  </h3>
                  <p className="text-xs text-slate-400">Uhakiki wa miamala ya Lipa Namba (M-Pesa, Mix by Yas, Airtel, Halopesa)</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setShowPaymentSettingsModal(true)}
                  className="px-3.5 py-2 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                  <span>Hariri Taarifa za Lipa Namba</span>
                </button>
                {pendingVerifications.length > 0 && (
                  <span className="px-3 py-1 rounded-full bg-rose-500 text-white font-bold text-xs">
                    {pendingVerifications.length} Zinasubiri
                  </span>
                )}
              </div>
            </div>

            {pendingVerifications.length === 0 ? (
              <div className="p-6 text-center rounded-2xl bg-slate-800/40 border border-slate-800 text-slate-400 text-xs sm:text-sm">
                <CheckCircle2 className="w-6 h-6 text-emerald-500/80 mx-auto mb-1.5" />
                {t.managerDashboard.noPendingVerifications}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pendingVerifications.map((ord) => (
                  <div
                    key={ord.id}
                    className="p-4 sm:p-5 rounded-2xl bg-slate-800/90 border border-slate-700 shadow-xl space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-purple-300 px-2 py-0.5 rounded bg-slate-900">
                        {ord.bookingCode}
                      </span>
                      <div className="flex items-center space-x-2">
                        <span className="text-base font-black text-amber-400 font-mono">
                          {formatCurrency(ord.totalAmount)}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedOrderForEdit(ord);
                            setShowOrderCrudModal(true);
                          }}
                          className="p-1 rounded-lg bg-slate-700 hover:bg-purple-600 text-slate-300 hover:text-white transition-colors"
                          title="Hariri Oda"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(lang === 'sw' ? `Una uhakika unataka kufuta oda #${ord.bookingCode}?` : `Delete order #${ord.bookingCode}?`)) {
                              deleteOrder(ord.id);
                            }
                          }}
                          className="p-1 rounded-lg bg-slate-700 hover:bg-rose-600 text-slate-300 hover:text-white transition-colors"
                          title="Futa Oda"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="text-xs space-y-1 text-slate-300">
                      <p><strong className="text-slate-400">Mteja:</strong> {ord.customerName} ({ord.customerPhone})</p>
                      <p><strong className="text-slate-400">Huduma:</strong> {ord.items.map(i => i.nameSw).join(', ')}</p>
                      <p><strong className="text-slate-400">Mtandao:</strong> <span className="uppercase font-bold text-sky-400">{ord.paymentProvider || 'M-Pesa'}</span></p>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px] text-emerald-300 leading-relaxed">
                      <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Ujumbe Rasmi wa SMS / Risiti:</span>
                      {ord.paymentProof?.smsText || `Muamala: ${ord.paymentProof?.transactionRef}`}
                      {ord.paymentProof?.screenshotUrl && (
                        <a 
                          href={ord.paymentProof.screenshotUrl} 
                          target="_blank" 
                          rel="noreferrer"
                          className="block mt-1 text-xs text-purple-400 underline font-sans font-semibold"
                        >
                          🖼️ Tazama Picha ya Risiti (Screenshot)
                        </a>
                      )}
                    </div>

                    <div className="pt-2 flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => rejectPayment(ord.id)}
                        className="flex-1 py-2.5 px-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-300 font-bold text-xs cursor-pointer transition-colors"
                      >
                        Kataa
                      </button>

                      <button
                        type="button"
                        onClick={() => handleConfirmPaymentWithNotice(ord.id, ord.bookingCode)}
                        className="flex-[2] py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center space-x-1.5 shadow cursor-pointer transition-colors"
                      >
                        <Check className="w-4 h-4 stroke-[3]" />
                        <span>Thibitisha Malipo</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SECTION 2: Walk-In / Unassigned Orders */}
          {unassignedOrders.length > 0 && (
            <div className="p-5 sm:p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <Scissors className="w-5 h-5 text-purple-400" />
                  <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">Oda Zinazohitaji Kupangiwa Fundi</h3>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-lg bg-purple-500/10 text-purple-300 font-bold">
                  {unassignedOrders.length} oda
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {unassignedOrders.map((ord) => (
                  <div key={ord.id} className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-3">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-mono font-bold text-purple-300">{ord.bookingCode}</span>
                      <div className="flex items-center space-x-1.5">
                        <span className="text-amber-400 font-bold font-mono">{formatCurrency(ord.totalAmount)}</span>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedOrderForEdit(ord);
                            setShowOrderCrudModal(true);
                          }}
                          className="p-1 rounded bg-slate-700 hover:bg-purple-600 text-slate-300 hover:text-white"
                          title="Hariri Oda"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(lang === 'sw' ? `Futa oda #${ord.bookingCode}?` : `Delete order #${ord.bookingCode}?`)) {
                              deleteOrder(ord.id);
                            }
                          }}
                          className="p-1 rounded bg-slate-700 hover:bg-rose-600 text-slate-300 hover:text-white"
                          title="Futa Oda"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">{ord.customerName}</h4>
                      <p className="text-xs text-slate-400">{ord.items.map(i => i.nameSw).join(', ')}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedOrderToAssign(ord);
                        setShowAssignModal(true);
                      }}
                      className="w-full py-2 px-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow cursor-pointer transition-colors"
                    >
                      Panga Mhudumu Sasa
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SECTION 3: Historia ya Kazi za Wafanyakazi & Majukumu */}
          <div className="p-5 sm:p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  <Scissors className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                    {lang === 'sw' ? 'Historia ya Kazi za Wafanyakazi (CRUD)' : 'Staff Assigned Jobs & History'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {lang === 'sw' 
                      ? 'Ufuatiliaji, kuhariri, na kufuta kazi zilizotolewa, zinazoendelea, au zilizokamilika' 
                      : 'Live tracking, editing, and management of stylist tasks'}
                  </p>
                </div>
              </div>

              {/* Filters & Export Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Filter by Staff */}
                <select
                  value={staffHistoryFilterStaff}
                  onChange={(e) => setStaffHistoryFilterStaff(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs font-semibold text-white focus:outline-none cursor-pointer"
                >
                  <option value="all">{lang === 'sw' ? 'Wafanyakazi Wote' : 'All Staff'}</option>
                  {staffList.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.specialization || 'Fundi'})</option>
                  ))}
                </select>

                {/* Filter by Status */}
                <select
                  value={staffHistoryFilterStatus}
                  onChange={(e) => setStaffHistoryFilterStatus(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs font-semibold text-white focus:outline-none cursor-pointer"
                >
                  <option value="all">{lang === 'sw' ? 'Hali Zote' : 'All Statuses'}</option>
                  <option value="in_progress">{lang === 'sw' ? 'Kazi Inaendelea 🟡' : 'In Progress 🟡'}</option>
                  <option value="completed">{lang === 'sw' ? 'Imekamilika 🟢' : 'Completed 🟢'}</option>
                  <option value="assigned">{lang === 'sw' ? 'Amepangiwa 🟣' : 'Assigned 🟣'}</option>
                  <option value="confirmed">{lang === 'sw' ? 'Imethibitishwa 🔵' : 'Confirmed 🔵'}</option>
                  <option value="pending_payment">{lang === 'sw' ? 'Inasubiri Malipo ⚪' : 'Pending Payment ⚪'}</option>
                </select>

                {/* Export Buttons */}
                <button
                  type="button"
                  onClick={() => handleExportStaffReport(staffHistoryFilterStaff, 'pdf')}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-purple-300 border border-purple-500/30 text-xs font-semibold flex items-center space-x-1"
                  title="Pakua Ripoti ya PDF ya Kazi"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>PDF</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleExportStaffReport(staffHistoryFilterStaff, 'csv')}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/30 text-xs font-semibold flex items-center space-x-1"
                  title="Pakua CSV ya Kazi"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>CSV</span>
                </button>
              </div>
            </div>

            {/* List of Assigned Jobs */}
            {(() => {
              const assignedJobs = orders.filter(
                o => o.assignedStaffId || o.status === 'in_progress' || o.status === 'completed' || o.status === 'assigned' || o.status === 'confirmed' || o.status === 'pending_payment'
              ).filter(ord => {
                if (staffHistoryFilterStaff !== 'all' && ord.assignedStaffId !== staffHistoryFilterStaff) {
                  return false;
                }
                if (staffHistoryFilterStatus !== 'all' && ord.status !== staffHistoryFilterStatus) {
                  return false;
                }
                return true;
              });

              if (assignedJobs.length === 0) {
                return (
                  <div className="p-6 text-center rounded-2xl bg-slate-800/40 border border-slate-800 text-slate-400 text-xs sm:text-sm">
                    <CheckCircle2 className="w-6 h-6 text-slate-500 mx-auto mb-1.5" />
                    {lang === 'sw' ? 'Hakuna historia ya kazi kulingana na vichujio ulivyochagua.' : 'No staff job history matching the selected filters.'}
                  </div>
                );
              }

              return (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {assignedJobs.map((ord) => {
                    const assignedStaff = staffList.find(s => s.id === ord.assignedStaffId);
                    const staffAvatar = ord.assignedStaffAvatar || assignedStaff?.avatar || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80';
                    const staffName = ord.assignedStaffName || assignedStaff?.name || 'Haijapangiwa';

                    return (
                      <div
                        key={ord.id}
                        className="p-4 rounded-2xl bg-slate-800/90 border border-slate-700 shadow-lg space-y-3"
                      >
                        {/* Header: Staff Info & Status */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2.5">
                            <img 
                              src={staffAvatar} 
                              alt={staffName} 
                              className="w-9 h-9 rounded-xl object-cover border border-purple-500/40 shrink-0" 
                            />
                            <div>
                              <span className="text-xs font-bold text-white block leading-tight">
                                {staffName}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                {assignedStaff?.specialization || 'Fundi wa Saluni'}
                              </span>
                            </div>
                          </div>

                          {/* Status Badge */}
                          {ord.status === 'in_progress' && (
                            <span className="px-2 py-0.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold animate-pulse flex items-center space-x-1">
                              <span>●</span>
                              <span>{lang === 'sw' ? 'Inaendelea' : 'In Progress'}</span>
                            </span>
                          )}
                          {ord.status === 'completed' && (
                            <span className="px-2 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold flex items-center space-x-1">
                              <span>✓</span>
                              <span>{lang === 'sw' ? 'Imekamilika' : 'Completed'}</span>
                            </span>
                          )}
                          {(ord.status === 'assigned' || ord.status === 'confirmed') && (
                            <span className="px-2 py-0.5 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-bold">
                              {lang === 'sw' ? 'Amepangiwa' : 'Assigned'}
                            </span>
                          )}
                          {ord.status === 'paid_pending_confirmation' && (
                            <span className="px-2 py-0.5 rounded-lg bg-sky-500/20 text-sky-300 border border-sky-500/30 text-[10px] font-bold">
                              {lang === 'sw' ? 'Inasubiri Uhakiki' : 'Pending Verification'}
                            </span>
                          )}
                          {ord.status === 'pending_payment' && (
                            <span className="px-2 py-0.5 rounded-lg bg-slate-700 text-slate-300 text-[10px] font-bold">
                              {lang === 'sw' ? 'Inasubiri Malipo' : 'Pending'}
                            </span>
                          )}
                        </div>

                        {/* Order & Client Details */}
                        <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs space-y-1">
                          <div className="flex justify-between items-center text-[11px] font-mono">
                            <span className="text-purple-300 font-bold">#{ord.bookingCode}</span>
                            <span className="text-amber-400 font-bold">{formatCurrency(ord.totalAmount)}</span>
                          </div>
                          <p className="text-slate-300 text-xs">
                            <strong className="text-slate-400">Mteja:</strong> {ord.customerName} ({ord.customerPhone})
                          </p>
                          <p className="text-slate-300 text-xs">
                            <strong className="text-slate-400">Huduma:</strong> {ord.items.map(i => i.nameSw).join(', ')}
                          </p>
                        </div>

                        {/* CRUD Buttons & Timing Footer */}
                        <div className="pt-1 flex items-center justify-between border-t border-slate-700/60">
                          <span className="text-[10px] text-slate-400">
                            {new Date(ord.createdAt).toLocaleDateString([], { day: '2-digit', month: 'short' })} {new Date(ord.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>

                          <div className="flex items-center space-x-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedOrderForEdit(ord);
                                setShowOrderCrudModal(true);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-slate-700 hover:bg-purple-600 text-slate-200 hover:text-white text-[11px] font-bold flex items-center space-x-1 transition-colors"
                            >
                              <Edit3 className="w-3 h-3" />
                              <span>Hariri</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (confirm(lang === 'sw' ? `Una uhakika unataka kufuta oda #${ord.bookingCode}?` : `Delete order #${ord.bookingCode}?`)) {
                                  deleteOrder(ord.id);
                                }
                              }}
                              className="p-1.5 rounded-lg bg-slate-700 hover:bg-rose-600 text-slate-300 hover:text-white transition-colors"
                              title="Futa Oda"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* SCREEN 3: SERVICES MANAGEMENT SCREEN */}
      {activeScreen === 'services' && (
        <div id="services-catalog" className="p-5 sm:p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center space-x-2">
                <BarChart3 className="w-5 h-5 text-purple-400" />
                <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  {t.app.serviceCrudTitle}
                </h3>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">{t.app.serviceCrudSubtitle}</p>
            </div>

            <button
              type="button"
              onClick={() => {
                setEditingService(null);
                setShowServiceCrudModal(true);
              }}
              className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center space-x-1.5 shadow self-start sm:self-auto cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{t.app.newServiceBtn}</span>
            </button>
          </div>

          {/* Search & Category Filter for Services */}
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between pt-1">
            <div className="relative w-full sm:w-72">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={serviceSearch}
                onChange={(e) => setServiceSearch(e.target.value)}
                placeholder={t.app.searchServicesPlaceholder}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-400 focus:border-purple-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center space-x-1.5 overflow-x-auto w-full sm:w-auto pb-1 scrollbar-none">
              {[
                { id: 'all', label: t.customer.allCategories },
                { id: 'braids', label: t.customer.categoryBraids },
                { id: 'hair', label: t.customer.categoryHair },
                { id: 'makeup', label: t.customer.categoryMakeup },
                { id: 'dreads', label: t.customer.categoryDreads },
                { id: 'treatments', label: t.customer.categoryTreatments },
                { id: 'styling', label: t.customer.categoryStyling },
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setServiceCategory(cat.id)}
                  className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    serviceCategory === cat.id
                      ? 'bg-purple-600 text-white shadow'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Services Grid (Compact / Paginated) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {displayedServices.map((srv, idx) => {
              const count = metrics.totalServiceVolume[srv.id] || 0;
              return (
                <div 
                  key={srv.id}
                  className="rounded-2xl bg-slate-800/70 border border-slate-700/80 overflow-hidden flex flex-col justify-between hover:border-purple-500/50 transition-colors"
                >
                  <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-900">
                    <img src={srv.image} alt={srv.nameSw} className="w-full h-full object-cover" />
                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-slate-900/80 text-[10px] font-mono text-slate-300">
                      #{idx + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setTargetServiceForImage(srv);
                        setShowImageLibraryModal(true);
                      }}
                      className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-slate-900/90 text-purple-300 text-[10px] font-semibold flex items-center space-x-1 hover:bg-purple-600 hover:text-white transition-colors cursor-pointer border border-purple-500/30"
                    >
                      <ImageIcon className="w-3 h-3" />
                      <span>{t.app.changeImage}</span>
                    </button>
                  </div>

                  <div className="p-3.5 space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-xs font-bold text-white line-clamp-1">{srv.nameSw}</h4>
                        <span className="text-[10px] text-slate-400 capitalize">{srv.category}</span>
                      </div>
                      <span className="text-xs font-black text-amber-400 font-mono">
                        {srv.priceType === 'range' 
                          ? `${srv.minPrice.toLocaleString()} - ${srv.maxPrice.toLocaleString()}`
                          : `${srv.defaultPrice.toLocaleString()}`
                        } TZS
                      </span>
                    </div>

                    <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between">
                      <span className="text-[10px] text-slate-400">{t.app.paidOrdersCount.replace('{count}', String(count))}</span>
                      
                      <button
                        type="button"
                        onClick={() => {
                          setEditingService(srv);
                          setShowServiceCrudModal(true);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-bold flex items-center space-x-1 cursor-pointer transition-colors"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>Hariri</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Show More / Show Less Toggle to minimize scrolling */}
          {!serviceSearch.trim() && filteredServices.length > 3 && (
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setShowAllServices(!showAllServices)}
                className="px-5 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-purple-300 font-bold text-xs shadow transition-all cursor-pointer"
              >
                {showAllServices
                  ? t.app.showLessServices
                  : t.app.showMoreServices.replace('{count}', String(filteredServices.length - 3))
                }
              </button>
            </div>
          )}
        </div>
      )}

      {/* SCREEN 4: STAFF & SALARIES SCREEN (FULL CRUD) */}
      {activeScreen === 'staff' && (
        <div id="staff-management" className="p-5 sm:p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                {t.managerDashboard.staffPerformance}
              </h3>
              <p className="text-xs text-slate-400">
                Mapato ya kila mfanyakazi kulingana na kazi alizofanya (Daily, Weekly, Monthly, Custom)
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedStaffForEdit(null);
                  setShowStaffCrudModal(true);
                }}
                className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center space-x-1.5 shadow cursor-pointer transition-all"
              >
                <UserPlus className="w-4 h-4" />
                <span>+ Sajili Mfanyakazi / Meneja</span>
              </button>
            </div>
          </div>

          {/* Period Tabs for Staff Performance */}
          <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-2.5">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-xs font-semibold text-slate-300">Kipindi cha Utendaji:</span>
              <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-900 rounded-xl border border-slate-700">
                <button
                  type="button"
                  onClick={() => setStaffPeriodFilter('today')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    staffPeriodFilter === 'today' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {t.app.periodDaily}
                </button>
                <button
                  type="button"
                  onClick={() => setStaffPeriodFilter('week')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    staffPeriodFilter === 'week' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {t.app.periodWeekly}
                </button>
                <button
                  type="button"
                  onClick={() => setStaffPeriodFilter('month')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    staffPeriodFilter === 'month' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {t.app.periodMonthly}
                </button>
                <button
                  type="button"
                  onClick={() => setStaffPeriodFilter('custom')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    staffPeriodFilter === 'custom' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {lang === 'sw' ? 'Maalum (Custom)' : 'Custom'}
                </button>
                <button
                  type="button"
                  onClick={() => setStaffPeriodFilter('all')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    staffPeriodFilter === 'all' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {t.managerDashboard.filterAll}
                </button>
              </div>
            </div>

            {/* Custom Date Pickers for Staff Filter */}
            {staffPeriodFilter === 'custom' && (
              <div className="pt-2 border-t border-slate-700/60 flex flex-wrap items-center gap-3 animate-fade-in">
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-slate-400">Kuanzia tarehe:</span>
                  <input
                    type="date"
                    value={staffStartDate}
                    onChange={(e) => setStaffStartDate(e.target.value)}
                    className="p-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:border-purple-500 focus:outline-none"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-slate-400">Hadi tarehe:</span>
                  <input
                    type="date"
                    value={staffEndDate}
                    onChange={(e) => setStaffEndDate(e.target.value)}
                    className="p-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:border-purple-500 focus:outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          {allPersonnel.length === 0 ? (
            <div className="text-center py-10 px-4 rounded-2xl bg-slate-800/40 border border-slate-800 space-y-3">
              <Users className="w-10 h-10 text-slate-500 mx-auto" />
              <div className="space-y-1">
                <p className="text-sm font-bold text-white">Hakuna Wafanyakazi Waliosajiliwa Bado</p>
                <p className="text-xs text-slate-400">Bofya kitufe cha "+ Sajili Mfanyakazi / Meneja" hapo juu kuongeza mfanyakazi au meneja mpya.</p>
              </div>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-800/80 text-slate-400 uppercase font-semibold">
                    <tr>
                      <th className="p-3 rounded-l-2xl">{t.managerDashboard.staffName}</th>
                      <th className="p-3">{t.managerDashboard.specialization}</th>
                      <th className="p-3 text-amber-400">{t.app.earnedInPeriod}</th>
                      <th className="p-3">{t.managerDashboard.completedCount}</th>
                      <th className="p-3 text-emerald-400">{t.managerDashboard.staffSalary}</th>
                      <th className="p-3 rounded-r-2xl text-right">{t.managerDashboard.actions}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {allPersonnel.map((staff) => {
                      const stats = getStaffPeriodStats(staff.id, staffPeriodFilter, staffStartDate, staffEndDate);
                      return (
                        <tr key={staff.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="p-3 flex items-center space-x-3">
                            <img src={staff.avatar} alt={staff.name} className="w-9 h-9 rounded-xl object-cover border border-purple-500/30" />
                            <div>
                              <div className="flex items-center space-x-1.5">
                                <span className="font-bold text-white text-xs">{staff.name}</span>
                                <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                                  staff.role === 'manager' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-purple-500/20 text-purple-300'
                                }`}>
                                  {staff.role === 'manager' ? 'Manager' : 'Staff'}
                                </span>
                              </div>
                              <span className="text-[10px] text-slate-400 font-mono">@{staff.username || 'staff'}</span>
                            </div>
                          </td>
                          <td className="p-3 text-slate-300 max-w-xs">{staff.specialization || 'General Stylist'}</td>
                          <td className="p-3 font-mono font-bold text-amber-400">
                            {formatCurrency(stats.periodRevenue)}
                          </td>
                          <td className="p-3 font-mono font-bold text-white">
                            {stats.periodCount} kazi
                          </td>
                          <td className="p-3 font-bold text-emerald-400 font-mono">{formatCurrency(staff.salary || 450000)}</td>
                          <td className="p-3 text-right">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedStaffForEdit(staff);
                                setShowStaffCrudModal(true);
                              }}
                              className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold inline-flex items-center space-x-1 shadow transition-colors cursor-pointer"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>Hariri & CRUD</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile / Tablet Responsive Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 md:hidden">
                {allPersonnel.map((staff) => {
                  const stats = getStaffPeriodStats(staff.id, staffPeriodFilter, staffStartDate, staffEndDate);
                  return (
                    <div 
                      key={staff.id} 
                      className="rounded-2xl bg-slate-800/70 border border-slate-700/80 p-4 space-y-3 shadow-md"
                    >
                      <div className="flex items-center space-x-3">
                        <img src={staff.avatar} alt={staff.name} className="w-10 h-10 rounded-xl object-cover border border-purple-500/30" />
                        <div>
                          <div className="flex items-center space-x-1.5">
                            <span className="font-bold text-white text-xs">{staff.name}</span>
                            <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                              staff.role === 'manager' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-purple-500/20 text-purple-300'
                            }`}>
                              {staff.role === 'manager' ? 'Manager' : 'Staff'}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono">@{staff.username || 'staff'}</span>
                        </div>
                      </div>

                      <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Utaalamu:</span>
                          <span className="text-slate-200 font-medium truncate max-w-[140px]">{staff.specialization || 'General Stylist'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">{t.app.earnedInPeriod}:</span>
                          <span className="text-amber-400 font-mono font-bold">{formatCurrency(stats.periodRevenue)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">{t.managerDashboard.completedCount}:</span>
                          <span className="text-white font-mono font-bold">{stats.periodCount} kazi</span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] text-slate-400 block">{t.managerDashboard.staffSalary}:</span>
                          <span className="text-xs font-bold text-emerald-400 font-mono">
                            {formatCurrency(staff.salary || 450000)}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedStaffForEdit(staff);
                            setShowStaffCrudModal(true);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center space-x-1.5 shadow transition-colors cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Hariri & CRUD</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* STAFF & MANAGER CRUD MODAL */}
      <StaffCrudModal
        isOpen={showStaffCrudModal}
        onClose={() => {
          setShowStaffCrudModal(false);
          setSelectedStaffForEdit(null);
        }}
        editingStaff={selectedStaffForEdit}
        onSuccess={(msg) => {
          setSuccessModal({
            isOpen: true,
            title: lang === 'sw' ? 'Mafanikio!' : 'Success!',
            message: msg
          });
        }}
      />

      {/* ASSIGN STAFF MODAL */}
      {showAssignModal && selectedOrderToAssign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div 
            className="relative w-full max-w-md max-h-[90vh] flex flex-col rounded-3xl bg-slate-900 border border-slate-700 shadow-2xl text-slate-100 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b border-slate-800 flex justify-between items-center shrink-0">
              <div>
                <h3 className="text-base font-bold text-white">Panga Mhudumu wa Oda</h3>
                <p className="text-xs text-slate-400">Oda: <strong className="text-purple-300 font-mono">{selectedOrderToAssign.bookingCode}</strong> ({selectedOrderToAssign.customerName})</p>
              </div>
              <button 
                onClick={() => { setShowAssignModal(false); setSelectedOrderToAssign(null); }} 
                className="p-1 text-slate-400 hover:text-white cursor-pointer"
                aria-label="Funga"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-2.5">
              {staffList.map((staff) => (
                <button
                  key={staff.id}
                  type="button"
                  onClick={() => handleConfirmAssignment(staff.id)}
                  className="w-full p-3 rounded-2xl bg-slate-800/80 hover:bg-purple-600/20 hover:border-purple-500 border border-slate-700 flex items-center justify-between text-left transition-all cursor-pointer"
                >
                  <div className="flex items-center space-x-3">
                    <img src={staff.avatar} alt={staff.name} className="w-10 h-10 rounded-xl object-cover" />
                    <div>
                      <span className="text-sm font-bold text-white block">{staff.name}</span>
                      <span className="text-[11px] text-slate-400">{staff.specialization}</span>
                    </div>
                  </div>
                  <span className="text-xs text-purple-400 font-bold px-2.5 py-1 bg-purple-500/10 rounded-lg">
                    Chagua
                  </span>
                </button>
              ))}
            </div>

            <div className="p-4 border-t border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => { setShowAssignModal(false); setSelectedOrderToAssign(null); }}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold cursor-pointer"
              >
                Funga
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SERVICE CRUD MODAL */}
      <ServiceCrudModal
        isOpen={showServiceCrudModal}
        onClose={() => setShowServiceCrudModal(false)}
        editingService={editingService}
        onOpenImageLibrary={(service) => {
          setTargetServiceForImage(service);
          setShowImageLibraryModal(true);
        }}
      />

      {/* IMAGE LIBRARY MODAL */}
      <ImageLibraryModal
        isOpen={showImageLibraryModal}
        onClose={() => {
          setShowImageLibraryModal(false);
          setTargetServiceForImage(null);
        }}
        targetService={targetServiceForImage}
        onSelectImageForService={(srvId, imgUrl) => {
          if (editingService) {
            setEditingService({ ...editingService, image: imgUrl });
          }
        }}
      />

      {/* PAYMENT SETTINGS MODAL */}
      <PaymentSettingsModal
        isOpen={showPaymentSettingsModal}
        onClose={() => setShowPaymentSettingsModal(false)}
        onSuccess={(msg) => {
          setSuccessModal({
            isOpen: true,
            title: lang === 'sw' ? 'Malipo Yamehifadhiwa!' : 'Payment Details Saved!',
            message: msg
          });
        }}
      />

      {/* ORDER CRUD MODAL */}
      <OrderCrudModal
        isOpen={showOrderCrudModal}
        orderToEdit={selectedOrderForEdit}
        onClose={() => {
          setShowOrderCrudModal(false);
          setSelectedOrderForEdit(null);
        }}
        onSuccess={(msg) => {
          setSuccessModal({
            isOpen: true,
            title: lang === 'sw' ? 'Oda Imesasishwa!' : 'Order Saved!',
            message: msg
          });
        }}
      />

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

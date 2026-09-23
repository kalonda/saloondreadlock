import React from 'react';
import { useSalonStore } from '../../store/salonStore';
import { getTranslation, formatCurrency } from '../../i18n';
import { Order } from '../../types';
import { 
  ShoppingBag, 
  Clock, 
  CheckCircle2, 
  Scissors, 
  Smartphone, 
  ShieldCheck, 
  CreditCard,
  FileText,
  AlertTriangle,
  Printer
} from 'lucide-react';
import { printCustomerReceipt } from '../../utils/reportGenerator';

interface MyBookingsViewProps {
  onOpenPaymentModal: (order: Order) => void;
  onNavigateToServices: () => void;
}

export const MyBookingsView: React.FC<MyBookingsViewProps> = ({
  onOpenPaymentModal,
  onNavigateToServices
}) => {
  const { lang, orders, currentUser, tillDetails } = useSalonStore();
  const t = getTranslation(lang);

  // Filter orders for current user or show recent device orders
  const displayOrders = currentUser && currentUser.role === 'customer'
    ? orders.filter(o => o.customerId === currentUser.id || o.customerPhone === currentUser.phone)
    : orders;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid_pending_confirmation':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-400 text-slate-950 flex items-center space-x-1.5 animate-pulse">
            <Clock className="w-3.5 h-3.5" />
            <span>{t.statusBadges.paid_pending_confirmation}</span>
          </span>
        );
      case 'confirmed':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-500 text-slate-950 flex items-center space-x-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{t.statusBadges.confirmed}</span>
          </span>
        );
      case 'in_progress':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-black bg-purple-500 text-white flex items-center space-x-1.5">
            <Scissors className="w-3.5 h-3.5" />
            <span>{t.statusBadges.in_progress}</span>
          </span>
        );
      case 'completed':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-black bg-blue-500 text-white flex items-center space-x-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{t.statusBadges.completed}</span>
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 rounded-full text-xs font-black bg-slate-700 text-slate-200">
            {t.statusBadges[status as keyof typeof t.statusBadges] || status}
          </span>
        );
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">{t.nav.myBookings}</h2>
          <p className="text-xs text-slate-400 mt-0.5">Fuatilia hali ya malipo na maandalizi ya miadi yako moja kwa moja</p>
        </div>
        <button
          type="button"
          onClick={onNavigateToServices}
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700"
        >
          + Weka Miadi Mpya
        </button>
      </div>

      {/* Orders List */}
      {displayOrders.length === 0 ? (
        <div className="text-center p-12 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <ShoppingBag className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-lg font-bold text-white">Huna miadi iliyohifadhiwa</h3>
          <p className="text-xs text-slate-400">Huduma utakazohifadhi na kulipia zitaonekana hapa kwa ufuatiliaji.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {displayOrders.map((ord) => (
            <div
              key={ord.id}
              className="p-5 sm:p-6 rounded-3xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-all shadow-xl space-y-4"
            >
              {/* Top Row: Code, Date & Status Badge */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                <div className="flex items-center space-x-2">
                  <span className="px-2.5 py-1 rounded-xl bg-slate-800 text-purple-300 font-mono font-bold text-xs border border-slate-700">
                    {ord.bookingCode}
                  </span>
                  <span className="text-xs text-slate-400">
                    {new Date(ord.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div>{getStatusBadge(ord.status)}</div>
              </div>

              {/* Middle Row: Items & Assigned Staff */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Huduma Zilizochaguliwa:</span>
                  <div className="space-y-1.5">
                    {ord.items.map((item, i) => (
                      <div key={i} className="flex items-center justify-between text-xs">
                        <span className="text-slate-200 font-medium">{item.nameSw} {item.selectedOptionLabel ? `(${item.selectedOptionLabel})` : ''}</span>
                        <span className="text-amber-400 font-mono font-bold">{formatCurrency(item.selectedPrice)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-800/50 border border-slate-800 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Mteja:</span>
                    <span className="font-semibold text-slate-200">{ord.customerName} ({ord.customerPhone})</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Mhudumu:</span>
                    <span className="font-semibold text-purple-300">{ord.assignedStaffName || 'Atapangiwa na Meneja'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Njia ya Malipo:</span>
                    <span className="font-semibold text-slate-200 uppercase">{ord.paymentMethod === 'mobile_money' ? 'Mobile Money' : 'Cash'}</span>
                  </div>
                </div>
              </div>

              {/* Bottom Row: Total & Action Buttons */}
              <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-slate-400">Jumla ya Malipo:</span>
                  <span className="text-lg font-black text-amber-400 font-mono">
                    {formatCurrency(ord.totalAmount)}
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => printCustomerReceipt(ord, tillDetails)}
                    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer"
                    title="Chapisha au Hifadhi Risiti kama PDF"
                  >
                    <Printer className="w-3.5 h-3.5 text-purple-400" />
                    <span>Risiti (PDF)</span>
                  </button>

                  {ord.paymentMethod === 'mobile_money' && ord.status === 'pending_payment' && (
                    <button
                      type="button"
                      onClick={() => onOpenPaymentModal(ord)}
                      className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md flex items-center space-x-1.5 cursor-pointer"
                    >
                      <Smartphone className="w-3.5 h-3.5" />
                      <span>Lipa / Thibitisha SMS</span>
                    </button>
                  )}

                  {ord.status === 'paid_pending_confirmation' && (
                    <button
                      type="button"
                      onClick={() => onOpenPaymentModal(ord)}
                      className="px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold text-xs hover:bg-amber-500/20 cursor-pointer"
                    >
                      Tazama Ushahidi wa SMS
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

import React, { useState } from 'react';
import { useSalonStore } from '../../store/salonStore';
import { getTranslation, formatCurrency } from '../../i18n';
import { User, Order, PaymentMethod } from '../../types';
import { 
  ShoppingBag, 
  Trash2, 
  Tag, 
  CreditCard, 
  Smartphone, 
  Banknote, 
  ArrowRight, 
  UserCheck, 
  Sparkles,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';

interface CheckoutViewProps {
  selectedStylist: User | null;
  onOpenPaymentModal: (order: Order) => void;
  onNavigateToServices: () => void;
  onOrderCreated: (order: Order) => void;
}

export const CheckoutView: React.FC<CheckoutViewProps> = ({
  selectedStylist,
  onOpenPaymentModal,
  onNavigateToServices,
  onOrderCreated
}) => {
  const { lang, cart, removeFromCart, clearCart, createOrder, currentUser } = useSalonStore();
  const t = getTranslation(lang);

  const [customerName, setCustomerName] = useState(currentUser?.name || '');
  const [customerPhone, setCustomerPhone] = useState(currentUser?.phone || '');
  const [discountInput, setDiscountInput] = useState<string>('');
  const [appliedDiscount, setAppliedDiscount] = useState<number>(0);
  const [discountError, setDiscountError] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('mobile_money');

  const subtotal = cart.reduce((acc, curr) => acc + curr.selectedPrice * curr.count, 0);
  const totalAmount = Math.max(0, subtotal - appliedDiscount);

  const handleApplyDiscount = (e: React.FormEvent) => {
    e.preventDefault();
    setDiscountError('');
    const val = parseInt(discountInput, 10);
    if (isNaN(val) || val < 0) {
      setDiscountError('Tafadhali weka namba sahihi ya punguzo');
      return;
    }
    if (val > subtotal) {
      setDiscountError('Punguzo haliwezi kuzidi jumla ya huduma');
      return;
    }
    setAppliedDiscount(val);
  };

  const handleCreateOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;

    if (!customerName.trim()) {
      alert(lang === 'sw' ? 'Tafadhali weka jina lako' : 'Please enter your name');
      return;
    }
    if (!customerPhone.trim()) {
      alert(lang === 'sw' ? 'Tafadhali weka namba yako ya simu' : 'Please enter your phone number');
      return;
    }

    const order = createOrder({
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      customerType: currentUser ? 'registered' : 'guest',
      customerId: currentUser?.id,
      items: [...cart],
      subtotal,
      discount: appliedDiscount,
      totalAmount,
      assignedStaffId: selectedStylist?.id,
      assignedStaffName: selectedStylist?.name,
      assignedStaffAvatar: selectedStylist?.avatar,
      paymentMethod,
      notes: notes.trim() || undefined,
      bookingSource: 'remote_web',
      status: paymentMethod === 'cash' ? 'pending_payment' : 'pending_payment'
    });

    onOrderCreated(order);

    if (paymentMethod === 'mobile_money') {
      onOpenPaymentModal(order);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="max-w-xl mx-auto my-12 text-center p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-5">
        <div className="w-16 h-16 rounded-full bg-purple-600/10 border border-purple-500/20 text-purple-400 flex items-center justify-center mx-auto">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h3 className="text-2xl font-bold text-white tracking-tight">{t.checkout.emptyCartTitle}</h3>
        <p className="text-xs text-slate-400 max-w-sm mx-auto">
          {t.checkout.emptyCartDesc}
        </p>
        <button
          type="button"
          onClick={onNavigateToServices}
          className="px-6 py-3.5 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm shadow transition-all cursor-pointer"
        >
          {t.checkout.browseServices}
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      
      {/* View Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">{t.checkout.title}</h2>
          <p className="text-xs text-slate-400 mt-0.5">{t.checkout.bookingSummary}</p>
        </div>
        <button
          type="button"
          onClick={clearCart}
          className="text-xs text-rose-400 hover:text-rose-300 font-semibold underline cursor-pointer"
        >
          {t.app.delete}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Cart Items & Stylist Info */}
        <div className="lg:col-span-7 space-y-5">
          
          {/* Stylist Selected Badge (If Any) */}
          {selectedStylist && (
            <div className="p-4 rounded-2xl bg-purple-950/30 border border-purple-800/40 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {selectedStylist.avatar ? (
                  <img 
                    src={selectedStylist.avatar} 
                    alt={selectedStylist.name} 
                    className="w-12 h-12 rounded-xl object-cover border border-purple-500/30 shrink-0"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      const fallback = e.currentTarget.parentElement?.querySelector('.checkout-stylist-fallback');
                      if (fallback) fallback.classList.remove('hidden');
                    }}
                  />
                ) : null}
                <div className={`w-12 h-12 rounded-xl bg-purple-600/30 border border-purple-500/30 flex items-center justify-center text-purple-300 font-bold text-sm shrink-0 ${selectedStylist.avatar ? 'checkout-stylist-fallback hidden' : ''}`}>
                  {selectedStylist.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <span className="text-[10px] text-purple-300 uppercase font-bold tracking-wider block">Mhudumu Uliyemchagua:</span>
                  <span className="text-sm font-bold text-white">{selectedStylist.name}</span>
                  <span className="text-xs text-slate-400 block">{selectedStylist.specialization}</span>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/20">
                Tayari
              </span>
            </div>
          )}

          {/* Cart Item List */}
          <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">{t.checkout.bookingSummary}</h3>
            
            <div className="divide-y divide-slate-800/80">
              {cart.map((item) => (
                <div key={item.serviceId} className="py-3.5 flex items-center justify-between">
                  <div className="flex items-center space-x-3.5">
                    <img 
                      src={item.image} 
                      alt={item.nameSw} 
                      className="w-14 h-14 rounded-2xl object-cover border border-slate-700"
                    />
                    <div>
                      <h4 className="text-sm font-bold text-white">
                        {lang === 'en' ? item.nameEn : (lang === 'fr' ? item.nameFr : item.nameSw)}
                      </h4>
                      {item.selectedOptionLabel && (
                        <span className="text-xs text-purple-300 block font-medium">
                          {item.selectedOptionLabel}
                        </span>
                      )}
                      <span className="text-xs font-bold text-amber-400 font-mono">
                        {formatCurrency(item.selectedPrice)}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeFromCart(item.serviceId)}
                    className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-rose-400 hover:bg-slate-700 transition-colors"
                    title="Ondoa"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Optional Discount Input */}
          <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
            <div className="flex items-center space-x-2 text-slate-200 text-sm font-bold">
              <Tag className="w-4 h-4 text-purple-400" />
              <span>{t.checkout.discount}</span>
            </div>

            <form onSubmit={handleApplyDiscount} className="flex gap-2">
              <input
                type="number"
                value={discountInput}
                onChange={(e) => setDiscountInput(e.target.value)}
                placeholder={t.checkout.discountPlaceholder}
                className="flex-1 p-3 rounded-2xl bg-slate-800 border border-slate-700 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500"
              />
              <button
                type="submit"
                className="px-4 py-3 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs sm:text-sm shadow-md transition-colors"
              >
                {t.checkout.applyDiscount}
              </button>
            </form>

            {discountError && (
              <p className="text-xs text-rose-400 font-semibold">{discountError}</p>
            )}

            {appliedDiscount > 0 && (
              <div className="flex items-center justify-between text-xs text-emerald-400 font-semibold bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/20">
                <span>Punguzo Limewekwa:</span>
                <span>-{formatCurrency(appliedDiscount)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Customer Details, Payment Selector & Checkout Action */}
        <div className="lg:col-span-5 space-y-5">
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-5">
            
            {/* Customer Details Form */}
            <div className="space-y-3.5">
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Taarifa za Mteja</h3>
              
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">{t.customer.enterName} *</label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="mfano: Halima Saidi"
                  className="w-full p-3 rounded-2xl bg-slate-800 border border-slate-700 text-xs sm:text-sm text-slate-100 focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">{t.customer.enterPhone} *</label>
                <input
                  type="tel"
                  required
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="+255 7XX XXX XXX"
                  className="w-full p-3 rounded-2xl bg-slate-800 border border-slate-700 text-xs sm:text-sm text-slate-100 focus:border-purple-500 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">{t.customer.notes}</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Mfano: Naomba fundi awe Neema, nina nywele fupi..."
                  className="w-full p-2.5 rounded-2xl bg-slate-800 border border-slate-700 text-xs text-slate-100 focus:border-purple-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-2.5 pt-2">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                {t.checkout.paymentMethod}
              </label>

              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('mobile_money')}
                  className={`p-3 rounded-2xl border text-left flex items-center space-x-2.5 transition-all ${
                    paymentMethod === 'mobile_money'
                      ? 'bg-purple-600/20 border-purple-500 text-white font-bold ring-2 ring-purple-500/50'
                      : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  <Smartphone className="w-4 h-4 text-purple-400" />
                  <span className="text-xs">{t.checkout.mobileMoney}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('cash')}
                  className={`p-3 rounded-2xl border text-left flex items-center space-x-2.5 transition-all ${
                    paymentMethod === 'cash'
                      ? 'bg-emerald-600/20 border-emerald-500 text-white font-bold ring-2 ring-emerald-500/50'
                      : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  <Banknote className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs">{t.checkout.cash}</span>
                </button>
              </div>
            </div>

            {/* Breakdown & Totals */}
            <div className="pt-4 border-t border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>{t.checkout.subtotal}:</span>
                <span className="font-mono">{formatCurrency(subtotal)}</span>
              </div>
              {appliedDiscount > 0 && (
                <div className="flex justify-between text-emerald-400">
                  <span>{t.checkout.discount}:</span>
                  <span className="font-mono">-{formatCurrency(appliedDiscount)}</span>
                </div>
              )}
              <div className="flex justify-between text-base sm:text-lg font-black text-white pt-2 border-t border-slate-800">
                <span>{t.checkout.totalToPay}:</span>
                <span className="text-amber-400 font-mono">{formatCurrency(totalAmount)}</span>
              </div>
            </div>

            {/* Submit Checkout Button */}
            <button
              type="button"
              onClick={handleCreateOrder}
              className="w-full py-4 px-4 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-sm sm:text-base shadow-xl shadow-purple-600/30 flex items-center justify-center space-x-2 transition-all active:scale-98"
            >
              {paymentMethod === 'mobile_money' ? (
                <>
                  <Smartphone className="w-5 h-5" />
                  <span>{t.checkout.payNow}</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  <span>{t.checkout.confirmCashOrder}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

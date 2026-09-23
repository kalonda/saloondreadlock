import React, { useState } from 'react';
import { Order, MobileMoneyProvider } from '../../types';
import { useSalonStore } from '../../store/salonStore';
import { getTranslation, formatCurrency } from '../../i18n';
import { uploadPaymentProofToSupabase } from '../../lib/supabaseClient';
import { 
  X, 
  Copy, 
  Check, 
  Smartphone, 
  Upload, 
  Clock, 
  CheckCircle2, 
  ShieldCheck,
  Loader2
} from 'lucide-react';

interface PaymentModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onPaymentSubmitted?: (order: Order) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({ 
  order, 
  isOpen, 
  onClose,
  onPaymentSubmitted 
}) => {
  const { lang, submitPaymentProof, orders, tillDetails } = useSalonStore();
  const t = getTranslation(lang);

  const [selectedProvider, setSelectedProvider] = useState<MobileMoneyProvider>('mpesa');
  const [copiedTill, setCopiedTill] = useState(false);
  const [smsText, setSmsText] = useState('');
  const [transactionRef, setTransactionRef] = useState('');
  const [senderName, setSenderName] = useState('');
  const [senderPhone, setSenderPhone] = useState('');
  const [mockUploadedFile, setMockUploadedFile] = useState<string | null>(null);
  const [isUploadingProof, setIsUploadingProof] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const liveOrder = order ? orders.find(o => o.id === order.id) || order : null;

  if (!isOpen || !liveOrder) return null;

  const currentTillInfo = tillDetails.find(item => item.provider === selectedProvider) || tillDetails[0];

  const handleCopyTill = () => {
    navigator.clipboard.writeText(currentTillInfo.tillNumber);
    setCopiedTill(true);
    setTimeout(() => setCopiedTill(false), 2000);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      try {
        setIsUploadingProof(true);
        const uploadedUrl = await uploadPaymentProofToSupabase(file);
        setMockUploadedFile(uploadedUrl);
      } catch (err) {
        console.warn('Screenshot upload fallback:', err);
        setMockUploadedFile(URL.createObjectURL(file));
      } finally {
        setIsUploadingProof(false);
      }
    }
  };

  const handleSubmitProof = (e: React.FormEvent) => {
    e.preventDefault();
    if (!smsText.trim() && !transactionRef.trim() && !mockUploadedFile) {
      alert(lang === 'sw' ? 'Tafadhali weka ujumbe wa SMS au Namba ya Muamala' : 'Please provide SMS proof or Transaction Ref');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      const generatedRef = transactionRef.trim() || `REF-${Math.floor(100000 + Math.random() * 900000)}`;
      submitPaymentProof(liveOrder.id, {
        smsText: smsText.trim(),
        transactionRef: generatedRef,
        senderName: senderName.trim() || liveOrder.customerName,
        senderPhone: senderPhone.trim() || liveOrder.customerPhone,
        screenshotUrl: mockUploadedFile || undefined,
        submittedAt: new Date().toISOString()
      }, selectedProvider);

      setIsSubmitting(false);
      if (onPaymentSubmitted) {
        onPaymentSubmitted(liveOrder);
      }
    }, 500);
  };

  const getInstructions = () => {
    if (lang === 'en') return currentTillInfo.instructionsEn;
    if (lang === 'fr') return currentTillInfo.instructionsFr;
    return currentTillInfo.instructionsSw;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div 
        className="relative w-full max-w-xl max-h-[90vh] flex flex-col rounded-3xl bg-slate-900 border border-slate-700 shadow-2xl overflow-hidden text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between shrink-0 bg-slate-900">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-purple-600/20 text-purple-400 border border-purple-500/30">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">{t.checkout.title}</h3>
              <p className="text-xs text-slate-400 font-mono font-semibold">
                {liveOrder.bookingCode} • {liveOrder.customerName}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          
          {/* Status Tracker Banner */}
          {liveOrder.status === 'paid_pending_confirmation' && (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 flex items-start space-x-3">
              <Clock className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="px-2 py-0.5 text-xs font-black rounded bg-amber-400 text-slate-950 uppercase inline-block mb-1">
                  {t.checkout.instantNotificationBadge}
                </span>
                <p className="text-xs text-amber-200/90 leading-relaxed font-medium">
                  {t.checkout.instantNotificationDesc}
                </p>
              </div>
            </div>
          )}

          {liveOrder.status === 'confirmed' && (
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 flex items-start space-x-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="px-2 py-0.5 text-xs font-black rounded bg-emerald-400 text-slate-950 uppercase inline-block mb-1">
                  {t.checkout.orderConfirmedBadge}
                </span>
                <p className="text-xs text-emerald-200/90 leading-relaxed font-medium">
                  {t.checkout.orderConfirmedDesc}
                </p>
              </div>
            </div>
          )}

          {/* Amount to Pay Summary */}
          <div className="p-4 rounded-2xl bg-slate-800/90 border border-slate-700 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{t.checkout.totalToPay}</span>
              <div className="text-2xl font-black text-amber-400 font-mono mt-0.5">
                {formatCurrency(liveOrder.totalAmount)}
              </div>
            </div>
            <div className="text-right text-xs text-slate-400">
              <span>{liveOrder.items.length} Huduma</span>
            </div>
          </div>

          {/* Mobile Money Provider Selector Pills */}
          <div>
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2">
              Chagua Mtandao wa Malipo:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {tillDetails.map((prov) => {
                const isSelected = selectedProvider === prov.provider;
                return (
                  <button
                    key={prov.provider}
                    type="button"
                    onClick={() => setSelectedProvider(prov.provider)}
                    className={`p-2.5 rounded-xl border text-center transition-all ${
                      isSelected
                        ? 'border-purple-500 bg-purple-600/20 text-white font-bold'
                        : 'border-slate-700 bg-slate-800/50 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    <span className="text-xs block font-semibold">{prov.name.split(' ')[0]}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{prov.tillNumber}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 1: Merchant / Till Details */}
          <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="w-5 h-5 rounded-full bg-purple-600 text-white text-xs font-bold flex items-center justify-center">1</span>
                <span className="text-xs sm:text-sm font-bold text-slate-200">{t.checkout.step1Title}</span>
              </div>
              <span className="text-[11px] px-2 py-0.5 rounded bg-slate-700 text-slate-300 font-mono font-bold">
                {currentTillInfo.name}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">{t.checkout.tillNumber}</span>
                  <span className="text-base font-black text-amber-300 font-mono">{currentTillInfo.tillNumber}</span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyTill}
                  className="px-2.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center space-x-1"
                >
                  {copiedTill ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedTill ? t.checkout.copied : t.checkout.copyTill}</span>
                </button>
              </div>

              <div className="p-3 rounded-xl bg-slate-900 border border-slate-700">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">{t.checkout.accountName}</span>
                <span className="text-xs font-bold text-slate-200">{currentTillInfo.accountName}</span>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-slate-300 leading-relaxed">
              <span className="font-bold text-purple-300 block mb-0.5">{t.checkout.ussdGuide}</span>
              {getInstructions()}
            </div>
          </div>

          {/* Step 2: Upload or Paste SMS Proof */}
          <form id="payment-proof-form" onSubmit={handleSubmitProof} className="space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="w-5 h-5 rounded-full bg-purple-600 text-white text-xs font-bold flex items-center justify-center">2</span>
                <span className="text-xs sm:text-sm font-bold text-slate-200">{t.checkout.step2Title}</span>
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-300 font-medium block mb-1">
                {t.checkout.smsProofLabel}
              </label>
              <textarea
                rows={2}
                value={smsText}
                onChange={(e) => setSmsText(e.target.value)}
                placeholder={t.checkout.smsProofPlaceholder}
                className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-100 placeholder-slate-500 focus:border-purple-500 focus:outline-none font-mono"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Namba ya Muamala (Ref):</label>
                <input
                  type="text"
                  value={transactionRef}
                  onChange={(e) => setTransactionRef(e.target.value)}
                  placeholder="mfano: QC8921KL90"
                  className="w-full p-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-100 font-mono uppercase focus:border-purple-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Jina la Mtumaji:</label>
                <input
                  type="text"
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  placeholder={liveOrder.customerName}
                  className="w-full p-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-100 focus:border-purple-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Screenshot Upload */}
            <div className="p-3 rounded-xl bg-slate-800/40 border border-dashed border-slate-700">
              <label className="flex items-center justify-between cursor-pointer">
                <div className="flex items-center space-x-2">
                  <Upload className="w-4 h-4 text-purple-400" />
                  <span className="text-xs text-slate-300">{t.checkout.uploadScreenshot}</span>
                </div>
                <span className="text-[11px] px-2.5 py-1 rounded bg-slate-700 text-slate-300 font-semibold hover:bg-slate-600 transition-colors flex items-center space-x-1">
                  {isUploadingProof ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-400" />
                      <span>Inapakia...</span>
                    </>
                  ) : (
                    <span>Chagua Picha</span>
                  )}
                </span>
                <input 
                  type="file" 
                  accept="image/*" 
                  disabled={isUploadingProof} 
                  onChange={handleFileUpload} 
                  className="hidden" 
                />
              </label>
              {mockUploadedFile && (
                <div className="mt-2 text-xs text-emerald-400 font-semibold flex items-center space-x-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Picha ya SMS imepakiwa kikamilifu!</span>
                </div>
              )}
            </div>
          </form>
        </div>

        {/* Sticky Action Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900 flex items-center space-x-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs sm:text-sm"
          >
            Funga
          </button>
          <button
            type="submit"
            form="payment-proof-form"
            disabled={isSubmitting || liveOrder.status === 'confirmed'}
            className={`flex-[2] py-3 px-4 rounded-2xl font-bold text-xs sm:text-sm text-white flex items-center justify-center space-x-2 shadow transition-all ${
              liveOrder.status === 'confirmed'
                ? 'bg-emerald-600'
                : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 active:scale-95'
            }`}
          >
            {isSubmitting ? (
              <span>Inawasilisha...</span>
            ) : liveOrder.status === 'confirmed' ? (
              <span>Imethibitishwa na Meneja</span>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>{t.checkout.submitPaymentProof}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

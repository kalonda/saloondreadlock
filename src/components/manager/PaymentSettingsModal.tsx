import React, { useState } from 'react';
import { useSalonStore } from '../../store/salonStore';
import { getTranslation } from '../../i18n';
import { SalonTillInfo, MobileMoneyProvider } from '../../types';
import { 
  X, 
  Smartphone, 
  Check, 
  Edit3, 
  Save, 
  Sparkles,
  DollarSign
} from 'lucide-react';

interface PaymentSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

export const PaymentSettingsModal: React.FC<PaymentSettingsModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { lang, tillDetails, updateTillDetails } = useSalonStore();
  const t = getTranslation(lang);

  const [selectedProvider, setSelectedProvider] = useState<MobileMoneyProvider>('mpesa');

  const currentTill = tillDetails.find(td => td.provider === selectedProvider) || tillDetails[0];

  const [tillNumber, setTillNumber] = useState(currentTill?.tillNumber || '');
  const [accountName, setAccountName] = useState(currentTill?.accountName || '');
  const [ussdCode, setUssdCode] = useState(currentTill?.ussdCode || '');
  const [instructionsSw, setInstructionsSw] = useState(currentTill?.instructionsSw || '');
  const [instructionsEn, setInstructionsEn] = useState(currentTill?.instructionsEn || '');

  // When changing selected provider tab, populate form
  const handleSelectProvider = (prov: MobileMoneyProvider) => {
    setSelectedProvider(prov);
    const found = tillDetails.find(td => td.provider === prov);
    if (found) {
      setTillNumber(found.tillNumber);
      setAccountName(found.accountName);
      setUssdCode(found.ussdCode);
      setInstructionsSw(found.instructionsSw);
      setInstructionsEn(found.instructionsEn);
    }
  };

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentTill) return;

    updateTillDetails(selectedProvider, {
      tillNumber: tillNumber.trim(),
      accountName: accountName.trim(),
      ussdCode: ussdCode.trim(),
      instructionsSw: instructionsSw.trim(),
      instructionsEn: instructionsEn.trim()
    });

    onSuccess(
      lang === 'sw'
        ? `Taarifa za malipo ya ${currentTill.name} zimehifadhiwa kikamilifu.`
        : `Payment details for ${currentTill.name} updated successfully.`
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div 
        className="relative w-full max-w-lg max-h-[92vh] flex flex-col rounded-3xl bg-slate-900 border border-slate-700 shadow-2xl text-slate-100 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex justify-between items-center shrink-0 bg-slate-900/90">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                {lang === 'sw' ? 'Hariri Maelezo ya Malipo (Lipa Namba)' : 'Edit Mobile Payment Settings'}
              </h3>
              <p className="text-xs text-slate-400">
                {lang === 'sw' ? 'Badilisha Lipa Namba, Jina la Akaunti, na maelekezo ya USSD' : 'Configure merchant till numbers and USSD instructions'}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
            aria-label="Funga"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Network Picker Tabs */}
        <div className="p-3 border-b border-slate-800 bg-slate-950 flex items-center space-x-2 overflow-x-auto">
          {tillDetails.map((td) => (
            <button
              key={td.provider}
              type="button"
              onClick={() => handleSelectProvider(td.provider)}
              className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap flex items-center space-x-1.5 transition-all cursor-pointer ${
                selectedProvider === td.provider
                  ? 'bg-purple-600 text-white shadow-lg'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <span>{td.name.split(' ')[0]}</span>
            </button>
          ))}
        </div>

        {/* Form Body */}
        <form id="payment-settings-form" onSubmit={handleSave} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          <div className="p-3 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-xs text-purple-300 font-semibold flex items-center justify-between">
            <span>Mtandao Uliochaguliwa:</span>
            <span className="font-bold text-white uppercase">{currentTill?.name}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Lipa Namba / Till Number *
              </label>
              <input
                type="text"
                required
                value={tillNumber}
                onChange={(e) => setTillNumber(e.target.value)}
                placeholder="5521990"
                className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm font-mono font-bold text-amber-400 focus:border-purple-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Jina la Akaunti (Account Name) *
              </label>
              <input
                type="text"
                required
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                placeholder="DREADLOCKS AND HAIR DRESSING SALOON"
                className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs font-bold text-white focus:border-purple-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Namba ya USSD (USSD Dial Code)
            </label>
            <input
              type="text"
              value={ussdCode}
              onChange={(e) => setUssdCode(e.target.value)}
              placeholder="*150*00#"
              className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs font-mono text-slate-200 focus:border-purple-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Mwongozo wa Malipo kwa Kiswahili:
            </label>
            <textarea
              rows={3}
              value={instructionsSw}
              onChange={(e) => setInstructionsSw(e.target.value)}
              placeholder="Piga *150*00# -> Chagua Lipa kwa Simu -> Weka Lipa Namba..."
              className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:border-purple-500 focus:outline-none resize-none leading-relaxed"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Payment Instructions (English):
            </label>
            <textarea
              rows={3}
              value={instructionsEn}
              onChange={(e) => setInstructionsEn(e.target.value)}
              placeholder="Dial *150*00# -> Select Pay Merchant -> Enter Till Number..."
              className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:border-purple-500 focus:outline-none resize-none leading-relaxed"
            />
          </div>
        </form>

        {/* Modal Footer Controls */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-end space-x-2 shrink-0 bg-slate-900/90">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors cursor-pointer"
          >
            {t.app.cancel}
          </button>
          <button
            type="submit"
            form="payment-settings-form"
            className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-900/30 transition-all cursor-pointer flex items-center space-x-1.5"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{lang === 'sw' ? 'Hifadhi Mabadiliko' : 'Save Changes'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

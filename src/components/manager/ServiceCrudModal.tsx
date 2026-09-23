import React, { useState, useEffect } from 'react';
import { useSalonStore } from '../../store/salonStore';
import { getTranslation } from '../../i18n';
import { ServiceItem, ServiceCategory } from '../../types';
import { 
  X, 
  Scissors, 
  Trash2, 
  Save, 
  Image as ImageIcon
} from 'lucide-react';
import { AndroidSuccessModal } from '../common/AndroidSuccessModal';

interface ServiceCrudModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingService?: ServiceItem | null;
  onOpenImageLibrary: (service: ServiceItem) => void;
}

export const ServiceCrudModal: React.FC<ServiceCrudModalProps> = ({
  isOpen,
  onClose,
  editingService,
  onOpenImageLibrary
}) => {
  const { lang, addService, updateService, deleteService } = useSalonStore();
  const t = getTranslation(lang);

  const [nameSw, setNameSw] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [nameFr, setNameFr] = useState('');
  const [category, setCategory] = useState<ServiceCategory>('braids');
  const [priceType, setPriceType] = useState<'fixed' | 'range'>('fixed');
  const [minPrice, setMinPrice] = useState<number>(10000);
  const [maxPrice, setMaxPrice] = useState<number>(10000);
  const [defaultPrice, setDefaultPrice] = useState<number>(10000);
  const [durationMinutes, setDurationMinutes] = useState<number>(60);
  const [imageUrl, setImageUrl] = useState<string>('https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=800&q=80');
  const [descSw, setDescSw] = useState('');
  const [descEn, setDescEn] = useState('');

  // Android Success state
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successTitle, setSuccessTitle] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (editingService) {
      setNameSw(editingService.nameSw);
      setNameEn(editingService.nameEn);
      setNameFr(editingService.nameFr);
      setCategory(editingService.category);
      setPriceType(editingService.priceType);
      setMinPrice(editingService.minPrice);
      setMaxPrice(editingService.maxPrice);
      setDefaultPrice(editingService.defaultPrice);
      setDurationMinutes(editingService.durationMinutes);
      setImageUrl(editingService.image);
      setDescSw(editingService.descriptionSw);
      setDescEn(editingService.descriptionEn);
    } else {
      setNameSw('');
      setNameEn('');
      setNameFr('');
      setCategory('braids');
      setPriceType('fixed');
      setMinPrice(10000);
      setMaxPrice(10000);
      setDefaultPrice(10000);
      setDurationMinutes(60);
      setImageUrl('https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=800&q=80');
      setDescSw('');
      setDescEn('');
    }
  }, [editingService, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameSw.trim()) return;

    const payload = {
      nameSw: nameSw.trim(),
      nameEn: nameEn.trim() || nameSw.trim(),
      nameFr: nameFr.trim() || nameSw.trim(),
      category,
      priceType,
      minPrice: priceType === 'fixed' ? defaultPrice : minPrice,
      maxPrice: priceType === 'fixed' ? defaultPrice : maxPrice,
      defaultPrice,
      durationMinutes: durationMinutes || 45,
      image: imageUrl,
      descriptionSw: descSw.trim() || 'Huduma ya kitaalamu ya DREADLOCKS AND HAIR DRESSING SALOON.',
      descriptionEn: descEn.trim() || 'Professional styling service at DREADLOCKS AND HAIR DRESSING SALOON.',
      descriptionFr: 'Service professionnel de coiffure et beauté haut de gamme.'
    };

    if (editingService) {
      updateService(editingService.id, payload);
    } else {
      addService(payload);
    }

    setSuccessTitle(lang === 'sw' ? 'Huduma Imehifadhiwa!' : 'Service Saved!');
    setSuccessMessage(
      lang === 'sw'
        ? `Huduma ya "${payload.nameSw}" imehifadhiwa kikamilifu kwenye orodha ya saluni.`
        : `Service "${payload.nameEn}" has been successfully saved to catalog.`
    );
    setShowSuccessModal(true);
  };

  const handleSuccessClose = () => {
    setShowSuccessModal(false);
    onClose();
  };

  const handleDelete = () => {
    if (editingService && confirm(`Je, una uhakika unataka kufuta huduma ya "${editingService.nameSw}"?`)) {
      deleteService(editingService.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div 
        className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl bg-slate-900 border border-slate-700 shadow-2xl overflow-hidden text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between shrink-0 bg-slate-900">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-purple-600/20 text-purple-400 border border-purple-500/30">
              <Scissors className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                {editingService ? `${t.app.serviceCrudTitle}: ${editingService.nameSw}` : t.managerDashboard.manageStaffBtn}
              </h3>
              <p className="text-xs text-slate-400">
                {t.app.serviceCrudSubtitle}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form id="service-crud-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          
          {/* Image Selection & Preview Bar */}
          <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <img src={imageUrl} alt="Service Preview" className="w-14 h-14 rounded-xl object-cover border border-purple-500/40 shadow" />
              <div>
                <span className="text-xs font-bold text-white block">{t.app.servicePhoto}</span>
                <span className="text-[11px] text-slate-400">{t.app.servicePhotoSubtitle}</span>
              </div>
            </div>

            {/* Compact select image button */}
            <button
              type="button"
              onClick={() => {
                if (editingService) {
                  onOpenImageLibrary(editingService);
                } else {
                  onOpenImageLibrary({ id: 'temp', nameSw, image: imageUrl } as any);
                }
              }}
              className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center space-x-1.5 shadow cursor-pointer transition-colors"
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>{t.app.chooseFromLibrary}</span>
            </button>
          </div>

          {/* Names in 3 Languages */}
          <div className="space-y-2.5">
            <label className="text-xs font-bold uppercase tracking-wider text-purple-300 block">
              Localization (3 Languages):
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Kiswahili *</label>
                <input
                  type="text"
                  required
                  value={nameSw}
                  onChange={(e) => setNameSw(e.target.value)}
                  placeholder="mfano: Kusuka Knotless"
                  className="w-full p-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">English</label>
                <input
                  type="text"
                  value={nameEn}
                  onChange={(e) => setNameEn(e.target.value)}
                  placeholder="Knotless Braids"
                  className="w-full p-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Français</label>
                <input
                  type="text"
                  value={nameFr}
                  onChange={(e) => setNameFr(e.target.value)}
                  placeholder="Tresses Knotless"
                  className="w-full p-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:border-purple-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Category & Duration */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Category *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ServiceCategory)}
                className="w-full p-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:border-purple-500 focus:outline-none"
              >
                <option value="braids">{t.customer.categoryBraids}</option>
                <option value="hair">{t.customer.categoryHair}</option>
                <option value="dreads">{t.customer.categoryDreads}</option>
                <option value="styling">{t.customer.categoryStyling}</option>
                <option value="treatments">{t.customer.categoryTreatments}</option>
                <option value="makeup">{t.customer.categoryMakeup}</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Duration ({t.app.minutes}):</label>
              <input
                type="number"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(parseInt(e.target.value, 10) || 30)}
                className="w-full p-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:border-purple-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Pricing Structure: Fixed vs Range */}
          <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">{t.app.priceLabel}</span>
              <div className="flex items-center space-x-1.5">
                <button
                  type="button"
                  onClick={() => setPriceType('fixed')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    priceType === 'fixed' ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-slate-300'
                  }`}
                >
                  {t.app.fixedPriceBadge}
                </button>
                <button
                  type="button"
                  onClick={() => setPriceType('range')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    priceType === 'range' ? 'bg-amber-600 text-white' : 'bg-slate-700 text-slate-300'
                  }`}
                >
                  {t.app.rangePriceBadge}
                </button>
              </div>
            </div>

            {priceType === 'fixed' ? (
              <div>
                <label className="text-xs text-slate-300 block mb-1">{t.app.priceLabel} (TZS) *</label>
                <input
                  type="number"
                  value={defaultPrice}
                  onChange={(e) => setDefaultPrice(parseInt(e.target.value, 10) || 0)}
                  placeholder="10000"
                  className="w-full p-2 rounded-xl bg-slate-900 border border-slate-700 text-sm font-mono font-bold text-amber-400 focus:border-purple-500 focus:outline-none"
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Min (TZS) *</label>
                  <input
                    type="number"
                    value={minPrice}
                    onChange={(e) => setMinPrice(parseInt(e.target.value, 10) || 0)}
                    placeholder="15000"
                    className="w-full p-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono text-white focus:border-purple-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Max (TZS) *</label>
                  <input
                    type="number"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(parseInt(e.target.value, 10) || 0)}
                    placeholder="65000"
                    className="w-full p-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono text-white focus:border-purple-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Default (TZS)</label>
                  <input
                    type="number"
                    value={defaultPrice}
                    onChange={(e) => setDefaultPrice(parseInt(e.target.value, 10) || 0)}
                    placeholder="35000"
                    className="w-full p-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono text-amber-400 focus:border-purple-500 focus:outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Descriptions */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">{t.app.serviceDetails}:</label>
            <textarea
              rows={2}
              value={descSw}
              onChange={(e) => setDescSw(e.target.value)}
              placeholder="Description..."
              className="w-full p-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:border-purple-500 focus:outline-none"
            />
          </div>
        </form>

        {/* Sticky Action Footer */}
        <div className="p-3.5 border-t border-slate-800 bg-slate-900 flex items-center justify-between shrink-0">
          <div>
            {editingService && (
              <button
                type="button"
                onClick={handleDelete}
                className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-bold flex items-center space-x-1.5 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{t.app.delete}</span>
              </button>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer"
            >
              {t.app.cancel}
            </button>
            <button
              type="submit"
              form="service-crud-form"
              className="px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center space-x-1.5 shadow cursor-pointer transition-colors"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{editingService ? t.app.save : t.app.save}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ANDROID SUCCESS CONFIRMATION MODAL */}
      <AndroidSuccessModal
        isOpen={showSuccessModal}
        title={successTitle}
        message={successMessage}
        onClose={handleSuccessClose}
      />
    </div>
  );
};

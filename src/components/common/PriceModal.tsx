import React, { useState, useEffect } from 'react';
import { ServiceItem } from '../../types';
import { useSalonStore } from '../../store/salonStore';
import { getTranslation, formatCurrency } from '../../i18n';
import { X, Sparkles, Check, Sliders, DollarSign } from 'lucide-react';

interface PriceModalProps {
  service: ServiceItem | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (service: ServiceItem, selectedPrice: number, optionLabel?: string) => void;
}

export const PriceModal: React.FC<PriceModalProps> = ({ service, isOpen, onClose, onConfirm }) => {
  const { lang } = useSalonStore();
  const t = getTranslation(lang);

  const [currentPrice, setCurrentPrice] = useState<number>(0);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);

  useEffect(() => {
    if (service) {
      if (service.options && service.options.length > 0) {
        setSelectedOptionId(service.options[0].id);
        setCurrentPrice(service.options[0].price);
      } else {
        setSelectedOptionId(null);
        setCurrentPrice(service.defaultPrice || service.minPrice);
      }
    }
  }, [service]);

  if (!isOpen || !service) return null;

  const getServiceName = () => {
    if (lang === 'en') return service.nameEn;
    if (lang === 'fr') return service.nameFr;
    return service.nameSw;
  };

  const getServiceDesc = () => {
    if (lang === 'en') return service.descriptionEn;
    if (lang === 'fr') return service.descriptionFr;
    return service.descriptionSw;
  };

  const handleOptionSelect = (optId: string, price: number) => {
    setSelectedOptionId(optId);
    setCurrentPrice(price);
  };

  const handleCustomSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    setCurrentPrice(val);
    setSelectedOptionId(null);
  };

  const handleConfirm = () => {
    let optionLabel: string | undefined;
    if (service.options && selectedOptionId) {
      const opt = service.options.find(o => o.id === selectedOptionId);
      if (opt) {
        optionLabel = lang === 'en' ? opt.labelEn : (lang === 'fr' ? opt.labelFr : opt.labelSw);
      }
    }
    onConfirm(service, currentPrice, optionLabel);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div 
        className="relative w-full max-w-lg max-h-[90vh] flex flex-col rounded-3xl bg-slate-900 border border-slate-700 shadow-2xl overflow-hidden text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between shrink-0 bg-slate-900">
          <div className="flex items-center space-x-3">
            <img 
              src={service.image} 
              alt={getServiceName()} 
              className="w-12 h-12 rounded-xl object-cover border border-slate-700 shadow"
            />
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">{getServiceName()}</h3>
              <p className="text-xs text-slate-400">
                {service.priceType === 'range' ? 'Chagua kiasi kulingana na urefu/mtindo' : 'Bei Maalum'}
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
          
          {/* Price Range Notice */}
          <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-between">
            <span className="text-xs sm:text-sm text-slate-300 font-medium">
              {t.pricingModal.priceRangeNotice
                .replace('{min}', service.minPrice.toLocaleString())
                .replace('{max}', service.maxPrice.toLocaleString())}
            </span>
            <span className="text-xs font-bold text-amber-400 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20">
              {service.durationMinutes} min
            </span>
          </div>

          {/* Preset Style Options */}
          {service.options && service.options.length > 0 && (
            <div className="space-y-2.5">
              <label className="text-xs font-bold text-purple-300 uppercase tracking-wider block">
                {t.pricingModal.subtitle}
              </label>
              <div className="space-y-2">
                {service.options.map((opt) => {
                  const isSelected = selectedOptionId === opt.id;
                  const optLabel = lang === 'en' ? opt.labelEn : (lang === 'fr' ? opt.labelFr : opt.labelSw);
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleOptionSelect(opt.id, opt.price)}
                      className={`w-full p-3 rounded-2xl border text-left flex items-center justify-between transition-all ${
                        isSelected
                          ? 'bg-purple-600/20 border-purple-500 text-white shadow'
                          : 'bg-slate-800/40 border-slate-700/70 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center border ${
                          isSelected ? 'border-purple-400 bg-purple-500 text-white' : 'border-slate-600'
                        }`}>
                          {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                        <span className="text-sm font-semibold">{optLabel}</span>
                      </div>
                      <span className="text-sm font-bold text-amber-400 font-mono">
                        {formatCurrency(opt.price)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Dynamic Slider */}
          {service.priceType === 'range' && (
            <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-200 flex items-center space-x-1.5">
                  <Sliders className="w-4 h-4 text-purple-400" />
                  <span>{t.pricingModal.sliderLabel}</span>
                </label>
                <span className="text-base font-black text-amber-300 font-mono">
                  {formatCurrency(currentPrice)}
                </span>
              </div>

              <input
                type="range"
                min={service.minPrice}
                max={service.maxPrice}
                step={1000}
                value={currentPrice}
                onChange={handleCustomSliderChange}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
              />
              <div className="flex justify-between text-[11px] text-slate-400 mt-1.5 font-medium">
                <span>{formatCurrency(service.minPrice)}</span>
                <span>{formatCurrency(service.maxPrice)}</span>
              </div>
            </div>
          )}

          {/* Selected Amount Card */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-800 border border-slate-700">
            <span className="text-xs text-slate-300 font-semibold">Kiasi Kitakachowekwa Kwenye Oda:</span>
            <span className="text-xl font-black text-white font-mono">
              {formatCurrency(currentPrice)}
            </span>
          </div>
        </div>

        {/* Sticky Action Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900 flex items-center space-x-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs sm:text-sm"
          >
            {t.pricingModal.cancel}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="flex-[2] py-3 px-4 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs sm:text-sm shadow-md transition-all active:scale-95"
          >
            {t.pricingModal.confirmSelection}
          </button>
        </div>
      </div>
    </div>
  );
};

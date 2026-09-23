import React, { useState, useMemo } from 'react';
import { useSalonStore } from '../../store/salonStore';
import { getTranslation } from '../../i18n';
import { ServiceItem } from '../../types';
import { 
  Sparkles, 
  Search, 
  Clock, 
  Plus, 
  Trash2, 
  Sliders, 
  Check, 
  ArrowRight, 
  Users,
  Image as ImageIcon
} from 'lucide-react';

interface CustomerHomeProps {
  onSelectServiceForPrice: (service: ServiceItem) => void;
  onNavigateToTab: (tab: string) => void;
  onOpenImageLibraryForService?: (service: ServiceItem) => void;
}

export const CustomerHome: React.FC<CustomerHomeProps> = ({ 
  onSelectServiceForPrice, 
  onNavigateToTab,
  onOpenImageLibraryForService 
}) => {
  const { lang, cart, addToCart, removeFromCart, services, currentUser } = useSalonStore();
  const t = getTranslation(lang);

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAllServices, setShowAllServices] = useState(false);

  const isManagerOrStaff = currentUser?.role === 'manager' || currentUser?.role === 'staff';

  const categories = [
    { id: 'all', label: t.customer.allCategories },
    { id: 'braids', label: t.customer.categoryBraids },
    { id: 'hair', label: t.customer.categoryHair },
    { id: 'makeup', label: t.customer.categoryMakeup },
    { id: 'dreads', label: t.customer.categoryDreads },
    { id: 'treatments', label: t.customer.categoryTreatments },
    { id: 'styling', label: t.customer.categoryStyling },
  ];

  const filteredServices = useMemo(() => {
    return services.filter(service => {
      const matchesCategory = selectedCategory === 'all' || service.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      if (!q) return matchesCategory;

      const nameMatch = 
        service.nameSw.toLowerCase().includes(q) ||
        service.nameEn.toLowerCase().includes(q) ||
        service.nameFr.toLowerCase().includes(q) ||
        service.descriptionSw.toLowerCase().includes(q);

      return matchesCategory && nameMatch;
    });
  }, [services, selectedCategory, searchQuery]);

  const displayedServices = useMemo(() => {
    if (searchQuery.trim() || showAllServices) {
      return filteredServices;
    }
    return filteredServices.slice(0, 3);
  }, [filteredServices, searchQuery, showAllServices]);

  const getServiceName = (s: ServiceItem) => {
    if (lang === 'en') return s.nameEn;
    if (lang === 'fr') return s.nameFr;
    return s.nameSw;
  };

  const getServiceDesc = (s: ServiceItem) => {
    if (lang === 'en') return s.descriptionEn;
    if (lang === 'fr') return s.descriptionFr;
    return s.descriptionSw;
  };

  // Toggle Cart action: Add or Remove on click
  const handleToggleCart = (service: ServiceItem) => {
    const inCart = cart.some(item => item.serviceId === service.id);
    if (inCart) {
      removeFromCart(service.id);
    } else {
      if (service.priceType === 'range') {
        onSelectServiceForPrice(service);
      } else {
        addToCart(service, service.defaultPrice);
      }
    }
  };

  const isServiceInCart = (serviceId: string) => {
    return cart.some(item => item.serviceId === serviceId);
  };

  return (
    <div className="space-y-6 sm:space-y-8 pb-16 w-full max-w-full overflow-x-hidden">
      
      {/* Clean Hero Banner */}
      <div className="relative rounded-3xl overflow-hidden bg-slate-900 border border-slate-800 p-5 sm:p-8 shadow-xl">
        <div className="max-w-3xl space-y-3.5 text-left">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>{t.app.officialSubtitle}</span>
          </div>

          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-[1.15]">
            {t.customer.heroTitle}
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 font-normal leading-relaxed max-w-2xl">
            {t.customer.heroSubtitle}
          </p>

          <div className="flex flex-wrap items-center gap-2.5 pt-1">
            <button
              onClick={() => {
                const catalogueEl = document.getElementById('services-grid');
                catalogueEl?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-5 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs sm:text-sm shadow flex items-center space-x-2 transition-all active:scale-95 cursor-pointer"
            >
              <span>{t.customer.viewCatalogue}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => onNavigateToTab('staffShowcase')}
              className="px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-xs sm:text-sm flex items-center space-x-2 transition-colors cursor-pointer"
            >
              <Users className="w-4 h-4 text-purple-400" />
              <span>{t.customer.selectStylist}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Search & Category Filter Bar */}
      <div id="services-grid" className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.customer.searchService}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-900 border border-slate-800 text-xs sm:text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>

          <div className="flex items-center space-x-2 text-xs text-slate-400 font-medium">
            <span>{t.app.showing}</span>
            <span className="px-2 py-0.5 rounded-lg bg-slate-800 text-slate-200 font-bold border border-slate-700">
              {t.app.servicesCount.replace('{count}', String(filteredServices.length))}
            </span>
          </div>
        </div>

        {/* Responsive Category Pills (Wrapped, No Horizontal Scrollbar) */}
        <div className="flex flex-wrap gap-2 pt-1">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-purple-600 text-white shadow'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
        {displayedServices.map((service, idx) => {
          const inCart = isServiceInCart(service.id);

          return (
            <div
              key={service.id}
              className={`rounded-3xl bg-slate-900 border overflow-hidden flex flex-col justify-between transition-all duration-200 shadow-md ${
                inCart ? 'border-emerald-500/70 ring-1 ring-emerald-500/30' : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              {/* Card Image */}
              <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-800">
                <img
                  src={service.image}
                  alt={getServiceName(service)}
                  loading="lazy"
                  className="w-full h-full object-cover"
                />

                <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded bg-slate-900/90 text-[10px] font-mono font-bold text-slate-300 border border-slate-700">
                  #{idx + 1}
                </span>

                <span className={`absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                  service.priceType === 'range' ? 'bg-amber-500 text-slate-950' : 'bg-emerald-500 text-slate-950'
                }`}>
                  {service.priceType === 'range' ? t.app.rangePriceBadge : t.app.fixedPriceBadge}
                </span>

                <div className="absolute bottom-2.5 left-2.5 flex items-center space-x-1 px-2 py-0.5 rounded bg-slate-900/90 text-[11px] font-semibold text-slate-200 border border-slate-700">
                  <Clock className="w-3 h-3 text-purple-400" />
                  <span>{service.durationMinutes} {t.app.minutes}</span>
                </div>

                {isManagerOrStaff && onOpenImageLibraryForService && (
                  <button
                    type="button"
                    onClick={() => onOpenImageLibraryForService(service)}
                    className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-md bg-slate-900/90 text-purple-300 text-[10px] font-semibold flex items-center space-x-1 hover:bg-purple-600 hover:text-white transition-colors cursor-pointer border border-purple-500/30"
                  >
                    <ImageIcon className="w-3 h-3" />
                    <span>{t.app.changeImage}</span>
                  </button>
                )}
              </div>

              {/* Content Body */}
              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
                    {getServiceName(service)}
                  </h3>
                  
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                    {getServiceDesc(service)}
                  </p>
                </div>

                <div className="pt-3 mt-3 border-t border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                      {service.priceType === 'range' ? t.app.rangeLabel : t.app.priceLabel}
                    </span>
                    <span className="text-xs sm:text-sm font-black text-amber-400 font-mono">
                      {service.priceType === 'range' 
                        ? `${service.minPrice.toLocaleString()} - ${service.maxPrice.toLocaleString()} TZS`
                        : `${service.defaultPrice.toLocaleString()} TZS`
                      }
                    </span>
                  </div>

                  {/* 1-Click Add / Remove Cart Button */}
                  <button
                    type="button"
                    onClick={() => handleToggleCart(service)}
                    className={`py-1.5 px-3 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all active:scale-95 cursor-pointer ${
                      inCart
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500 hover:text-white'
                        : service.priceType === 'range'
                        ? 'bg-purple-600 hover:bg-purple-500 text-white shadow'
                        : 'bg-slate-800 hover:bg-slate-700 text-purple-300 border border-slate-700'
                    }`}
                  >
                    {inCart ? (
                      <>
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>{t.app.removeFromCart}</span>
                      </>
                    ) : service.priceType === 'range' ? (
                      <>
                        <Sliders className="w-3.5 h-3.5" />
                        <span>{t.app.selectPrice}</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5" />
                        <span>{t.app.addToCart}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Show More / Show Less Toggle to minimize scrolling */}
      {!searchQuery.trim() && filteredServices.length > 3 && (
        <div className="text-center pt-2">
          <button
            type="button"
            onClick={() => setShowAllServices(!showAllServices)}
            className="px-6 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-purple-300 font-bold text-xs shadow transition-all cursor-pointer"
          >
            {showAllServices
              ? t.app.showLessServices
              : t.app.showMoreServices.replace('{count}', String(filteredServices.length - 3))
            }
          </button>
        </div>
      )}
    </div>
  );
};

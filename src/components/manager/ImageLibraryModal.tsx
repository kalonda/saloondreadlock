import React, { useState } from 'react';
import { useSalonStore } from '../../store/salonStore';
import { getTranslation } from '../../i18n';
import { ServiceItem } from '../../types';
import { uploadSalonImageToSupabase } from '../../lib/supabaseClient';
import { 
  X, 
  Image as ImageIcon, 
  Upload, 
  Check, 
  Search, 
  Plus, 
  Trash2, 
  Loader2
} from 'lucide-react';
import { useBackButton } from '../../hooks/useBackButton';

interface ImageLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetService?: ServiceItem | null;
  onSelectImageForService?: (serviceId: string, imageUrl: string) => void;
}

export const ImageLibraryModal: React.FC<ImageLibraryModalProps> = ({
  isOpen,
  onClose,
  targetService,
  onSelectImageForService
}) => {
  const { lang, gallery, addImageToGallery, deleteGalleryImage, updateServiceImage } = useSalonStore();
  const t = getTranslation(lang);
  useBackButton(isOpen, onClose);

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [customTitle, setCustomTitle] = useState('');
  const [customUrl, setCustomUrl] = useState('');
  const [customCategory, setCustomCategory] = useState<'braids' | 'hair' | 'makeup' | 'dreads' | 'treatments' | 'styling' | 'barber'>('braids');
  const [isUploading, setIsUploading] = useState(false);

  if (!isOpen) return null;

  const categories = [
    { id: 'all', label: t.app.allImages },
    { id: 'braids', label: t.customer.categoryBraids },
    { id: 'dreads', label: t.customer.categoryDreads },
    { id: 'hair', label: t.customer.categoryHair },
    { id: 'styling', label: t.customer.categoryStyling },
    { id: 'treatments', label: t.customer.categoryTreatments },
    { id: 'makeup', label: t.customer.categoryMakeup }
  ];

  const filteredImages = gallery.filter(img => {
    const matchesCat = selectedCategory === 'all' || img.category === selectedCategory;
    const q = searchQuery.toLowerCase().trim();
    if (!q) return matchesCat;
    return matchesCat && (img.title.toLowerCase().includes(q) || img.tag.toLowerCase().includes(q));
  });

  const handleApplyImage = (url: string) => {
    if (targetService) {
      updateServiceImage(targetService.id, url);
      if (onSelectImageForService) {
        onSelectImageForService(targetService.id, url);
      }
      onClose();
    }
  };

  const handleAddNewImage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customUrl.trim() || !customTitle.trim()) return;

    addImageToGallery({
      title: customTitle.trim(),
      category: customCategory,
      url: customUrl.trim(),
      tag: customTitle.trim()
    });

    setCustomTitle('');
    setCustomUrl('');
    setShowAddForm(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setIsUploading(true);
      try {
        const publicUrl = await uploadSalonImageToSupabase(file);
        setCustomUrl(publicUrl);
        if (!customTitle) {
          setCustomTitle(file.name.replace(/\.[^/.]+$/, ""));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsUploading(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div 
        className="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-3xl bg-slate-900 border border-slate-700 shadow-2xl overflow-hidden text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between shrink-0 bg-slate-900">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-purple-600/20 text-purple-400 border border-purple-500/30">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                {targetService ? `${t.app.changeImage}: ${targetService.nameSw}` : t.app.imageLibrary}
              </h3>
              <p className="text-xs text-slate-400">
                {t.app.imageLibrarySubtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Compact Add Image Button */}
            <button
              type="button"
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs flex items-center space-x-1.5 transition-colors shadow cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t.app.addImage}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          
          {/* Add Image Form */}
          {showAddForm && (
            <form onSubmit={handleAddNewImage} className="p-4 rounded-2xl bg-slate-800/80 border border-purple-500/40 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-purple-300">{t.app.addImage}</span>
                <button type="button" onClick={() => setShowAddForm(false)} className="text-xs text-slate-400 hover:text-white cursor-pointer">{t.app.close}</button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-300 font-semibold block mb-1">Title / Tag:</label>
                  <input
                    type="text"
                    required
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    placeholder="e.g. Knotless Braids Golden Brown"
                    className="w-full p-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:border-purple-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-300 font-semibold block mb-1">Category:</label>
                  <select
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value as any)}
                    className="w-full p-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:border-purple-500 focus:outline-none"
                  >
                    <option value="braids">{t.customer.categoryBraids}</option>
                    <option value="dreads">{t.customer.categoryDreads}</option>
                    <option value="hair">{t.customer.categoryHair}</option>
                    <option value="styling">{t.customer.categoryStyling}</option>
                    <option value="treatments">{t.customer.categoryTreatments}</option>
                    <option value="makeup">{t.customer.categoryMakeup}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-300 font-semibold block mb-1">Image URL or File Upload:</label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={customUrl}
                    onChange={(e) => setCustomUrl(e.target.value)}
                    placeholder="https://... or upload image"
                    className="flex-1 p-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:border-purple-500 focus:outline-none"
                  />
                  <label className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center space-x-1.5 cursor-pointer shadow">
                    {isUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                    <span>{isUploading ? t.app.uploading : t.app.uploadToSupabase}</span>
                    <input type="file" accept="image/*" disabled={isUploading} onChange={handleFileUpload} className="hidden" />
                  </label>
                </div>
              </div>

              {customUrl && (
                <div className="flex items-center space-x-3 p-2 bg-slate-900 rounded-xl border border-slate-700">
                  <img src={customUrl} alt="Preview" className="w-10 h-10 rounded-lg object-cover" />
                  <span className="text-xs text-emerald-400 font-semibold">Image Ready</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow transition-all cursor-pointer"
              >
                {t.app.saveToLibrary}
              </button>
            </form>
          )}

          {/* Search & Category Filter Pills */}
          <div className="flex flex-col sm:flex-row gap-2.5 items-center justify-between">
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t.app.searchImagePlaceholder}
                className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-400 focus:border-purple-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center space-x-1.5 overflow-x-auto w-full sm:w-auto pb-1 scrollbar-none">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    selectedCategory === cat.id
                      ? 'bg-purple-600 text-white shadow'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Images Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
            {filteredImages.map((item) => {
              const isCurrentForTarget = targetService?.image === item.url;
              return (
                <div
                  key={item.id}
                  className={`group relative rounded-2xl overflow-hidden bg-slate-800 border transition-all ${
                    isCurrentForTarget
                      ? 'border-emerald-500 ring-2 ring-emerald-500/50'
                      : 'border-slate-700 hover:border-purple-500/60'
                  }`}
                >
                  <div className="aspect-square w-full overflow-hidden bg-slate-900">
                    <img
                      src={item.url}
                      alt={item.title}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>

                  <div className="p-2.5 bg-slate-900 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] text-purple-400 font-mono font-bold uppercase block">{item.tag}</span>
                      <h4 className="text-xs font-semibold text-white truncate">{item.title}</h4>
                    </div>

                    <div className="pt-2 mt-1 flex items-center justify-between">
                      {targetService ? (
                        <button
                          type="button"
                          onClick={() => handleApplyImage(item.url)}
                          className={`w-full py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center space-x-1 transition-all cursor-pointer ${
                            isCurrentForTarget
                              ? 'bg-emerald-600 text-white'
                              : 'bg-purple-600 hover:bg-purple-500 text-white'
                          }`}
                        >
                          {isCurrentForTarget ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>{t.app.accountVerified}</span>
                            </>
                          ) : (
                            <>
                              <span>{t.app.useThisImage}</span>
                            </>
                          )}
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => deleteGalleryImage(item.id)}
                          className="text-slate-500 hover:text-rose-400 p-1 transition-colors cursor-pointer"
                          title={t.app.delete}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sticky Footer */}
        <div className="p-3.5 border-t border-slate-800 bg-slate-900 flex items-center justify-between shrink-0">
          <span className="text-xs text-slate-400">
            {t.app.servicesCount.replace('{count}', String(filteredImages.length))}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold cursor-pointer"
          >
            {t.app.close}
          </button>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { useSalonStore } from '../../store/salonStore';
import { getTranslation, formatCurrency } from '../../i18n';
import { User } from '../../types';
import { Star, Scissors, CheckCircle, Award, Phone, ShieldCheck, Heart } from 'lucide-react';

interface StaffShowcaseProps {
  selectedStaffId: string | null;
  onSelectStylist: (staff: User) => void;
  onNavigateToServices: () => void;
}

export const StaffShowcase: React.FC<StaffShowcaseProps> = ({ 
  selectedStaffId, 
  onSelectStylist,
  onNavigateToServices 
}) => {
  const { lang, staffList } = useSalonStore();
  const t = getTranslation(lang);

  return (
    <div className="space-y-8 pb-16">
      
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-semibold">
          <Award className="w-4 h-4 text-amber-400" />
          <span>{t.app.stylistTeamHeading}</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
          {t.nav.staff}
        </h2>
        <p className="text-sm text-slate-300 leading-relaxed">
          {t.app.stylistTeamSubtitle}
        </p>
      </div>

      {/* Staff Grid */}
      {staffList.length === 0 ? (
        <div className="text-center py-12 px-4 rounded-3xl bg-slate-900 border border-slate-800 max-w-lg mx-auto space-y-3">
          <Scissors className="w-12 h-12 text-purple-400 mx-auto" />
          <h3 className="text-base font-bold text-white">
            {lang === 'sw' ? 'Hakuna Wahudumu Waliosajiliwa Bado' : lang === 'fr' ? 'Aucun styliste enregistré pour le moment' : 'No Specialists Registered Yet'}
          </h3>
          <p className="text-xs text-slate-400">
            {lang === 'sw' 
              ? 'Meneja atasajili wahudumu hivi karibuni. Unaweza kuendelea kuweka oda ya huduma unayoitaka!' 
              : lang === 'fr'
              ? 'Le directeur ajoutera des spécialistes bientôt. Vous pouvez déjà commander vos services !'
              : 'The manager will register salon specialists soon. You can continue booking your favorite services!'}
          </p>
          <button
            type="button"
            onClick={onNavigateToServices}
            className="px-5 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow cursor-pointer transition-colors"
          >
            {t.checkout.browseServices}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {staffList.map((staff) => {
          const isSelected = selectedStaffId === staff.id;
          return (
            <div
              key={staff.id}
              className={`rounded-3xl bg-slate-900 border p-6 flex flex-col justify-between transition-all duration-300 shadow-xl ${
                isSelected
                  ? 'border-purple-500 ring-2 ring-purple-500/50 bg-purple-950/20'
                  : 'border-slate-800 hover:border-purple-500/40'
              }`}
            >
              <div>
                {/* Avatar & Rating */}
                <div className="flex items-start justify-between mb-4">
                  <div className="relative">
                    <img
                      src={staff.avatar}
                      alt={staff.name}
                      className="w-20 h-20 rounded-2xl object-cover border-2 border-purple-500/40 shadow-lg"
                    />
                    <span className="absolute -bottom-1.5 -right-1.5 w-4 h-4 rounded-full bg-emerald-500 border-2 border-slate-900" title={t.app.activeOnDuty} />
                  </div>

                  <div className="flex items-center space-x-1 px-2.5 py-1 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold">
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    <span>{staff.rating || 4.9}</span>
                    <span className="text-slate-500 text-[10px]">({staff.reviewCount || 90}+)</span>
                  </div>
                </div>

                {/* Staff Name & Specialty */}
                <h3 className="text-lg font-bold text-white tracking-tight">{staff.name}</h3>
                <div className="inline-flex items-center space-x-1.5 text-xs text-purple-300 font-semibold mt-1">
                  <Scissors className="w-3.5 h-3.5" />
                  <span>{staff.specialization}</span>
                </div>

                {/* Bio */}
                <p className="text-xs text-slate-400 mt-3 leading-relaxed">
                  {staff.bio || 'Professional styling and beauty specialist.'}
                </p>

                {/* Completed Tasks Badge */}
                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                  <span>{t.app.clientsServed}</span>
                  <span className="font-bold text-slate-200">{staff.totalTasksCompleted || 30}+</span>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-5 mt-4">
                <button
                  type="button"
                  onClick={() => {
                    onSelectStylist(staff);
                    onNavigateToServices();
                  }}
                  className={`w-full py-3 px-4 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center space-x-2 transition-all active:scale-95 cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-600 text-white'
                      : 'bg-purple-600 hover:bg-purple-500 text-white shadow-lg'
                  }`}
                >
                  {isSelected ? (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      <span>{t.app.accountVerified}</span>
                    </>
                  ) : (
                    <>
                      <Scissors className="w-4 h-4" />
                      <span>{t.app.bookWithStylist}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
        </div>
      )}
    </div>
  );
};

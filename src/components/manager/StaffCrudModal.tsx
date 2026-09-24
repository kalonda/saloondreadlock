import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../../types';
import { useSalonStore } from '../../store/salonStore';
import { getTranslation, formatCurrency } from '../../i18n';
import { X, UserPlus, Edit3, Trash2, ShieldCheck, Check, Sparkles, Upload, Loader2 } from 'lucide-react';
import { uploadSalonImageToSupabase } from '../../lib/supabaseClient';
import { useBackButton } from '../../hooks/useBackButton';

interface StaffCrudModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingStaff: User | null;
  onSuccess: (message: string) => void;
}

export const StaffCrudModal: React.FC<StaffCrudModalProps> = ({
  isOpen,
  onClose,
  editingStaff,
  onSuccess
}) => {
  const { lang, createStaff, updateStaff, deleteStaff } = useSalonStore();
  const t = getTranslation(lang);
  useBackButton(isOpen, onClose);
  const [isUploading, setIsUploading] = useState(false);

  const [role, setRole] = useState<UserRole>('staff');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('123');
  const [specialization, setSpecialization] = useState('');
  const [salary, setSalary] = useState('450000');
  const [avatar, setAvatar] = useState<string>('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const prevIsOpenRef = React.useRef(false);

  useEffect(() => {
    if (isOpen && !prevIsOpenRef.current) {
      if (editingStaff) {
        setRole(editingStaff.role || 'staff');
        setName(editingStaff.name || '');
        setPhone(editingStaff.phone || '');
        setUsername(editingStaff.username || '');
        setPassword(editingStaff.password || '123');
        setSpecialization(editingStaff.specialization || '');
        setSalary(String(editingStaff.salary || (editingStaff.role === 'manager' ? 850000 : 450000)));
        setAvatar((editingStaff.avatar && !editingStaff.avatar.includes('unsplash.com')) ? editingStaff.avatar : '');
        setShowDeleteConfirm(false);
      } else {
        setRole('staff');
        setName('');
        setPhone('');
        setUsername('');
        setPassword('123');
        setSpecialization('Knotless Braids, Weaving & Styling');
        setSalary('450000');
        setAvatar('');
        setShowDeleteConfirm(false);
      }
    }
    prevIsOpenRef.current = isOpen;
  }, [editingStaff, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !username.trim()) return;

    const salaryNum = parseInt(salary, 10) || (role === 'manager' ? 850000 : 450000);
    const spec = role === 'manager' ? 'General Management & Salon Operations' : (specialization.trim() || 'All Hair Services');

    if (editingStaff) {
      updateStaff(editingStaff.id, {
        name: name.trim(),
        phone: phone.trim() || '+255 700 000 000',
        role,
        username: username.trim().toLowerCase(),
        password: password.trim() || '123',
        specialization: spec,
        salary: salaryNum,
        avatar
      });
      onSuccess(
        lang === 'sw'
          ? `Taarifa za "${name}" zimesasishwa kikamilifu.`
          : `Staff details for "${name}" updated successfully.`
      );
    } else {
      createStaff({
        name: name.trim(),
        phone: phone.trim() || '+255 700 000 000',
        role,
        username: username.trim().toLowerCase(),
        password: password.trim() || '123',
        specialization: spec,
        salary: salaryNum,
        avatar
      });
      onSuccess(
        lang === 'sw'
          ? `${role === 'manager' ? 'Meneja' : 'Mfanyakazi'} mpya amesajiliwa kikamilifu.`
          : `New ${role === 'manager' ? 'Manager' : 'Staff'} registered successfully.`
      );
    }
    onClose();
  };

  const handleDelete = () => {
    if (!editingStaff) return;
    const deletedName = editingStaff.name;
    deleteStaff(editingStaff.id);
    setShowDeleteConfirm(false);
    onClose();
    onSuccess(
      lang === 'sw'
        ? `Akaunti ya "${deletedName}" imefutwa kwenye mfumo.`
        : `Account for "${deletedName}" has been deleted.`
    );
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
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              {editingStaff ? <Edit3 className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                {editingStaff 
                  ? (lang === 'sw' ? 'Hariri Mfanyakazi / Meneja' : 'Edit Personnel Profile')
                  : t.app.createManagerOrStaffModalTitle
                }
              </h3>
              <p className="text-xs text-slate-400">
                {editingStaff 
                  ? (lang === 'sw' ? 'Badilisha majina, nafasi, mshahara au nenosiri' : 'Update credentials, salary and permissions')
                  : t.managerDashboard.createStaffNotice
                }
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

        {/* Form Body */}
        <form id="staff-crud-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {/* Role Choice */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">
              {t.app.userRoleLabel} *
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setRole('staff')}
                className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
                  role === 'staff'
                    ? 'bg-purple-600 border-purple-500 text-white shadow'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                }`}
              >
                <span>{t.app.roleStaff}</span>
              </button>
              <button
                type="button"
                onClick={() => setRole('manager')}
                className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
                  role === 'manager'
                    ? 'bg-amber-600 border-amber-500 text-white shadow'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{t.app.roleManager}</span>
              </button>
            </div>
          </div>

          {/* Full Name & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                {t.managerDashboard.staffFullName} *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="mfano: Hadija Salim"
                className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:border-purple-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                {t.managerDashboard.staffPhone}
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+255 7XX XXX XXX"
                className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:border-purple-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Username & Password */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                {t.managerDashboard.staffUsername} *
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="hadija"
                className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:border-purple-500 focus:outline-none lowercase"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                {t.managerDashboard.staffPassword}
              </label>
              <input
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="123"
                className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:border-purple-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Specialization & Salary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                {t.managerDashboard.specialization}
              </label>
              <input
                type="text"
                value={specialization}
                onChange={(e) => setSpecialization(e.target.value)}
                placeholder={role === 'manager' ? 'Executive Management' : 'Dreadlocks & Braids'}
                className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:border-purple-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                {t.managerDashboard.staffSalaryInput} (TZS):
              </label>
              <input
                type="number"
                value={salary}
                onChange={(e) => setSalary(e.target.value)}
                placeholder={role === 'manager' ? '850000' : '450000'}
                className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs font-mono font-bold text-emerald-400 focus:border-purple-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Avatar / Photo Upload */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">
              Picha ya Profaili:
            </label>
            <div className="flex items-center space-x-3">
              {avatar ? (
                <img src={avatar} alt="Preview" className="w-12 h-12 rounded-xl object-cover border-2 border-purple-500/50 shadow" />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-slate-800 border border-dashed border-slate-700 flex items-center justify-center text-slate-500 text-xs font-bold">
                  Picha
                </div>
              )}

              <div className="flex-1 space-y-1">
                <label className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold inline-flex items-center space-x-1.5 cursor-pointer shadow transition-all">
                  {isUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                  <span>{isUploading ? 'Inapakia...' : 'Chagua / Pakia Picha'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    disabled={isUploading}
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setIsUploading(true);
                        try {
                          const url = await uploadSalonImageToSupabase(file);
                          setAvatar(url);
                        } catch (err) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            if (typeof reader.result === 'string') setAvatar(reader.result);
                          };
                          reader.readAsDataURL(file);
                        } finally {
                          setIsUploading(false);
                        }
                      }
                    }}
                    className="hidden"
                  />
                </label>
                <p className="text-[10px] text-slate-400">Picha itahifadhiwa kwenye Supabase Storage.</p>
              </div>
            </div>
          </div>

          {/* Delete Confirmation Warning */}
          {showDeleteConfirm && editingStaff && (
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-xs space-y-2">
              <p className="font-bold text-rose-400">
                Una uhakika unataka kumfuta "{editingStaff.name}"?
              </p>
              <p className="text-slate-400 text-[11px]">
                Hatua hii itaondoa akaunti yake kwenye mfumo na Supabase profiles.
              </p>
              <div className="flex space-x-2 pt-1">
                <button
                  type="button"
                  onClick={handleDelete}
                  className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs cursor-pointer shadow"
                >
                  Ndio, Futa Kabisa
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs cursor-pointer"
                >
                  Ghairi
                </button>
              </div>
            </div>
          )}
        </form>

        {/* Modal Footer Controls */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-between shrink-0 bg-slate-900/90">
          <div>
            {editingStaff && !showDeleteConfirm && (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-bold text-xs flex items-center space-x-1.5 border border-rose-500/20 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Futa</span>
              </button>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors cursor-pointer"
            >
              {t.app.cancel}
            </button>
            <button
              type="submit"
              form="staff-crud-form"
              className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-900/30 transition-all cursor-pointer flex items-center space-x-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{editingStaff ? t.app.saveSalary : t.managerDashboard.saveStaffBtn}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { useSalonStore } from '../../store/salonStore';
import { Order, OrderStatus, PaymentMethod, ServiceItem, User } from '../../types';
import { getTranslation, formatCurrency } from '../../i18n';
import { 
  X, 
  Trash2, 
  Save, 
  Plus, 
  Scissors, 
  User as UserIcon, 
  Phone, 
  DollarSign, 
  CheckCircle2, 
  Clock, 
  AlertTriangle 
} from 'lucide-react';

interface OrderCrudModalProps {
  isOpen: boolean;
  orderToEdit: Order | null;
  onClose: () => void;
  onSuccess?: (message: string) => void;
}

export const OrderCrudModal: React.FC<OrderCrudModalProps> = ({
  isOpen,
  orderToEdit,
  onClose,
  onSuccess
}) => {
  const { lang, services, staffList, addOrder, updateOrder, deleteOrder } = useSalonStore();
  const t = getTranslation(lang);

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [customPrice, setCustomPrice] = useState<number>(15000);
  const [assignedStaffId, setAssignedStaffId] = useState('');
  const [status, setStatus] = useState<OrderStatus>('pending_assignment');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [notes, setNotes] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const prevIsOpenRef = React.useRef(false);

  useEffect(() => {
    if (isOpen && !prevIsOpenRef.current) {
      if (orderToEdit) {
        setCustomerName(orderToEdit.customerName || '');
        setCustomerPhone(orderToEdit.customerPhone || '');
        setSelectedServiceId(orderToEdit.items[0]?.serviceId || services[0]?.id || '');
        setCustomPrice(orderToEdit.totalAmount || 15000);
        setAssignedStaffId(orderToEdit.assignedStaffId || '');
        setStatus(orderToEdit.status || 'confirmed');
        setPaymentMethod(orderToEdit.paymentMethod || 'cash');
        setNotes(orderToEdit.notes || '');
        setShowDeleteConfirm(false);
      } else {
        setCustomerName('');
        setCustomerPhone('');
        const defaultSrv = services[0];
        setSelectedServiceId(defaultSrv?.id || '');
        setCustomPrice(defaultSrv?.defaultPrice || 15000);
        setAssignedStaffId('');
        setStatus('in_progress');
        setPaymentMethod('cash');
        setNotes('');
        setShowDeleteConfirm(false);
      }
    }
    prevIsOpenRef.current = isOpen;
  }, [orderToEdit, services, isOpen]);

  if (!isOpen) return null;

  const handleServiceChange = (serviceId: string) => {
    setSelectedServiceId(serviceId);
    const srv = services.find(s => s.id === serviceId);
    if (srv) {
      setCustomPrice(srv.defaultPrice);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerName.trim()) {
      alert(lang === 'sw' ? 'Tafadhali weka jina la mteja' : 'Please enter customer name');
      return;
    }

    const assignedStaff = staffList.find(s => s.id === assignedStaffId);
    const selectedService = services.find(s => s.id === selectedServiceId) || services[0];

    if (orderToEdit) {
      // Update existing order
      updateOrder(orderToEdit.id, {
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim() || '+255 700 000 000',
        totalAmount: Number(customPrice),
        subtotal: Number(customPrice),
        items: [{
          serviceId: selectedService.id,
          nameSw: selectedService.nameSw,
          nameEn: selectedService.nameEn,
          nameFr: selectedService.nameFr,
          selectedPrice: Number(customPrice),
          count: 1,
          image: selectedService.image
        }],
        assignedStaffId: assignedStaff?.id || undefined,
        assignedStaffName: assignedStaff?.name || undefined,
        assignedStaffAvatar: assignedStaff?.avatar || undefined,
        status,
        paymentMethod,
        notes: notes.trim() || undefined
      });

      if (onSuccess) {
        onSuccess(lang === 'sw' ? 'Oda imehaririwa na kuhifadhiwa kikamilifu!' : 'Order updated successfully!');
      }
    } else {
      // Create new order
      const newBookingCode = `MGR-${Math.floor(1000 + Math.random() * 9000)}`;
      addOrder({
        id: `ord-${Date.now()}`,
        bookingCode: newBookingCode,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim() || '+255 700 000 000',
        customerType: 'guest',
        items: [{
          serviceId: selectedService.id,
          nameSw: selectedService.nameSw,
          nameEn: selectedService.nameEn,
          nameFr: selectedService.nameFr,
          selectedPrice: Number(customPrice),
          count: 1,
          image: selectedService.image
        }],
        subtotal: Number(customPrice),
        discount: 0,
        totalAmount: Number(customPrice),
        assignedStaffId: assignedStaff?.id || undefined,
        assignedStaffName: assignedStaff?.name || undefined,
        assignedStaffAvatar: assignedStaff?.avatar || undefined,
        status,
        paymentMethod,
        notes: notes.trim() || undefined,
        createdAt: new Date().toISOString(),
        bookingSource: 'manager_manual'
      });

      if (onSuccess) {
        onSuccess(lang === 'sw' ? 'Oda mpya imeundwa kikamilifu!' : 'New order created successfully!');
      }
    }

    onClose();
  };

  const handleDelete = () => {
    if (!orderToEdit) return;
    deleteOrder(orderToEdit.id);
    if (onSuccess) {
      onSuccess(lang === 'sw' ? `Oda #${orderToEdit.bookingCode} imefutwa kikamilifu!` : `Order #${orderToEdit.bookingCode} deleted!`);
    }
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
            <div className="p-2.5 rounded-2xl bg-purple-600/20 text-purple-400 border border-purple-500/30">
              <Scissors className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                {orderToEdit 
                  ? (lang === 'sw' ? `Hariri Oda #${orderToEdit.bookingCode}` : `Edit Order #${orderToEdit.bookingCode}`)
                  : (lang === 'sw' ? 'Weka Oda Mpya (Manager)' : 'Add New Order')}
              </h3>
              <p className="text-xs text-slate-400">
                {lang === 'sw' ? 'Usimamizi kamili wa maelezo, huduma, bei, na hali ya kazi' : 'Complete CRUD control for salon bookings and tasks'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form id="order-crud-form" onSubmit={handleSave} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
          
          {/* Customer Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Jina la Mteja: *
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Mfano: Amina Juma"
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Namba ya Simu:
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="+255 700 000 000"
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Service Selection & Price */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Chagua Huduma:
              </label>
              <select
                value={selectedServiceId}
                onChange={(e) => handleServiceChange(e.target.value)}
                className="w-full p-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:border-purple-500 focus:outline-none cursor-pointer"
              >
                {services.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.nameSw} ({formatCurrency(s.defaultPrice)})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Bei ya Huduma (TZS):
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step="1000"
                  required
                  value={customPrice}
                  onChange={(e) => setCustomPrice(Number(e.target.value))}
                  className="w-full p-2 rounded-xl bg-slate-800 border border-slate-700 text-xs font-mono font-bold text-amber-400 focus:border-purple-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Assigned Staff & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Mhudumu / Fundi Aliyepewa:
              </label>
              <select
                value={assignedStaffId}
                onChange={(e) => setAssignedStaffId(e.target.value)}
                className="w-full p-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:border-purple-500 focus:outline-none cursor-pointer"
              >
                <option value="">-- Hakuna (Haijapangiwa) --</option>
                {staffList.map(st => (
                  <option key={st.id} value={st.id}>
                    {st.name} ({st.specialization || 'Fundi'})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Hali ya Oda (Status):
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as OrderStatus)}
                className="w-full p-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:border-purple-500 focus:outline-none cursor-pointer font-bold"
              >
                <option value="pending_payment">Inasubiri Malipo (pending_payment)</option>
                <option value="paid_pending_confirmation">Inasubiri Uhakiki (paid_pending)</option>
                <option value="confirmed">Imethibitishwa (confirmed)</option>
                <option value="assigned">Amepangiwa Fundi (assigned)</option>
                <option value="in_progress">Kazi Inaendelea (in_progress)</option>
                <option value="completed">Imekamilika (completed)</option>
                <option value="cancelled">Imeghairiwa (cancelled)</option>
              </select>
            </div>
          </div>

          {/* Payment Method & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Njia ya Malipo:
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full p-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:border-purple-500 focus:outline-none cursor-pointer"
              >
                <option value="cash">Pesa Taslimu (Cash)</option>
                <option value="mobile_money">Lipa Namba (Mobile Money)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Maelezo ya Ziada (Notes):
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Mfano: Mteja anataka mikate mirefu"
                className="w-full p-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Delete Danger Zone if Editing */}
          {orderToEdit && (
            <div className="pt-3 border-t border-slate-800">
              {showDeleteConfirm ? (
                <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 space-y-2">
                  <div className="flex items-center space-x-2 text-rose-400 text-xs font-bold">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>Una uhakika unataka kufuta oda hii kabisa?</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Kitendo hiki kitafuta oda kwenye mfumo na kwenye database ya Supabase.
                  </p>
                  <div className="flex items-center space-x-2 pt-1">
                    <button
                      type="button"
                      onClick={handleDelete}
                      className="py-1.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs"
                    >
                      Ndiyo, Futa Kabisa
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(false)}
                      className="py-1.5 px-3 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs"
                    >
                      Ghairi
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="text-xs text-rose-400 hover:text-rose-300 font-semibold flex items-center space-x-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Futa Oda Hii (Kufuta Oda Zilizokosewa / Zilizojirudia)</span>
                </button>
              )}
            </div>
          )}
        </form>

        {/* Sticky Action Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900 flex items-center space-x-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
          >
            Ghairi
          </button>
          <button
            type="submit"
            form="order-crud-form"
            className="flex-[2] py-2.5 px-4 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center justify-center space-x-2 shadow transition-all active:scale-95"
          >
            <Save className="w-4 h-4" />
            <span>{orderToEdit ? 'Hifadhi Mabadiliko' : 'Unda Oda Sasa'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export type Language = 'sw' | 'en' | 'fr';

export type UserRole = 'manager' | 'staff' | 'customer';

export type AppTheme = 'dark' | 'light';

export interface User {
  id: string;
  name: string;
  phone: string;
  email?: string;
  role: UserRole;
  avatar?: string;
  specialization?: string;
  bio?: string;
  rating?: number;
  reviewCount?: number;
  salary?: number; // Base / Monthly Salary in TZS
  dailyEarnings?: number;
  totalEarnings?: number;
  totalTasksCompleted?: number;
  active?: boolean;
  username?: string;
  password?: string;
}

export interface ServiceOption {
  id: string;
  labelSw: string;
  labelEn: string;
  labelFr: string;
  price: number;
  badge?: string;
}

export type ServiceCategory = 'braids' | 'hair' | 'makeup' | 'dreads' | 'treatments' | 'styling';

export interface ServiceItem {
  id: string;
  nameSw: string;
  nameEn: string;
  nameFr: string;
  category: ServiceCategory;
  priceType: 'fixed' | 'range';
  minPrice: number;
  maxPrice: number;
  defaultPrice: number;
  durationMinutes: number;
  image: string;
  descriptionSw: string;
  descriptionEn: string;
  descriptionFr: string;
  popular?: boolean;
  options?: ServiceOption[];
}

export interface SelectedServiceItem {
  serviceId: string;
  nameSw: string;
  nameEn: string;
  nameFr: string;
  selectedPrice: number;
  selectedOptionLabel?: string;
  count: number;
  image: string;
}

export type OrderStatus = 
  | 'pending_assignment'
  | 'assigned'
  | 'in_progress'
  | 'pending_payment'
  | 'paid_pending_confirmation'
  | 'confirmed'
  | 'completed'
  | 'cancelled';

export type PaymentMethod = 'cash' | 'mobile_money';

export type MobileMoneyProvider = 'mpesa' | 'yas' | 'tigopesa' | 'airtel' | 'halopesa';

export interface PaymentProof {
  smsText?: string;
  transactionRef: string;
  senderName?: string;
  senderPhone?: string;
  screenshotUrl?: string;
  submittedAt: string;
}

export interface Order {
  id: string;
  bookingCode: string;
  customerName: string;
  customerPhone: string;
  customerType: 'guest' | 'registered';
  customerId?: string;
  items: SelectedServiceItem[];
  subtotal: number;
  discount: number;
  totalAmount: number;
  assignedStaffId?: string;
  assignedStaffName?: string;
  assignedStaffAvatar?: string;
  status: OrderStatus;
  paymentMethod?: PaymentMethod;
  paymentProvider?: MobileMoneyProvider;
  paymentProof?: PaymentProof;
  confirmedAt?: string;
  completedAt?: string;
  createdAt: string;
  notes?: string;
  bookingSource: 'remote_web' | 'remote_mobile' | 'salon_tablet' | 'walk_in';
}

export interface SalonTillInfo {
  provider: MobileMoneyProvider;
  name: string;
  tillNumber: string;
  accountName: string;
  ussdCode: string;
  instructionsSw: string;
  instructionsEn: string;
  instructionsFr: string;
  color: string;
  bgColor: string;
  iconName: string;
}

export interface DashboardMetrics {
  totalRevenue: number;
  todayRevenue: number;
  totalOrders: number;
  todayOrders: number;
  completedOrdersCount: number;
  pendingPaymentCount: number;
  pendingConfirmationCount: number;
  activeStaffCount: number;
  totalServiceVolume: Record<string, number>;
}

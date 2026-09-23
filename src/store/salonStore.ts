import { useState, useEffect } from 'react';
import { 
  User, 
  Order, 
  SelectedServiceItem, 
  ServiceItem, 
  Language, 
  AppTheme,
  PaymentProof, 
  MobileMoneyProvider, 
  OrderStatus,
  DashboardMetrics,
  SalonTillInfo 
} from '../types';
import { INITIAL_STAFF, MANAGER_USER, INITIAL_SAMPLE_ORDERS, SALON_TILL_DETAILS } from '../data/mockData';
import { SALON_SERVICES } from '../data/services';
import { INITIAL_GALLERY_IMAGES, GalleryImage } from '../data/imageGallery';
import { 
  supabase, 
  syncProfileToSupabase, 
  syncOrderToSupabase, 
  deleteOrderFromSupabase,
  fetchProfilesFromSupabase, 
  ensureManagerRegisteredInSupabase, 
  deleteProfileFromSupabase,
  fetchOrdersFromSupabase,
  syncServiceToSupabase,
  fetchServicesFromSupabase,
  deleteServiceFromSupabase,
  syncGalleryImageToSupabase,
  fetchGalleryFromSupabase,
  deleteGalleryImageFromSupabase
} from '../lib/supabaseClient';
import confetti from 'canvas-confetti';

const STORAGE_KEYS = {
  LANG: 'saloon_ms_lang',
  THEME: 'saloon_ms_theme',
  USER: 'saloon_ms_user',
  STAFF: 'saloon_ms_staff',
  ORDERS: 'saloon_ms_orders',
  CART: 'saloon_ms_cart',
  SERVICES: 'saloon_ms_services',
  GALLERY: 'saloon_ms_gallery',
  REGISTERED_USERS: 'saloon_ms_registered_users',
  TILL_DETAILS: 'saloon_till_details'
};

// Global Store State
let globalLanguage: Language = (localStorage.getItem(STORAGE_KEYS.LANG) as Language) || 'sw';
let globalTheme: AppTheme = (localStorage.getItem(STORAGE_KEYS.THEME) as AppTheme) || 'dark';
let globalUser: User | null = JSON.parse(localStorage.getItem(STORAGE_KEYS.USER) || 'null') || null;

let globalRegisteredUsers: User[] = (() => {
  const saved = localStorage.getItem(STORAGE_KEYS.REGISTERED_USERS);
  if (saved) {
    try { return JSON.parse(saved); } catch (e) { console.error(e); }
  }
  return [];
})();

let globalServices: ServiceItem[] = (() => {
  const saved = localStorage.getItem(STORAGE_KEYS.SERVICES);
  if (saved) {
    try { return JSON.parse(saved); } catch (e) { console.error(e); }
  }
  return SALON_SERVICES;
})();

let globalGallery: GalleryImage[] = (() => {
  const saved = localStorage.getItem(STORAGE_KEYS.GALLERY);
  if (saved) {
    try { return JSON.parse(saved); } catch (e) { console.error(e); }
  }
  return INITIAL_GALLERY_IMAGES;
})();

let globalStaff: User[] = (() => {
  const saved = localStorage.getItem(STORAGE_KEYS.STAFF);
  if (saved) {
    try { 
      const parsed: User[] = JSON.parse(saved); 
      return parsed.filter(s => !['staff-1', 'staff-2', 'staff-3', 'staff-4', 'staff-5'].includes(s.id));
    } catch (e) { console.error(e); }
  }
  return INITIAL_STAFF;
})();

let globalOrders: Order[] = (() => {
  const saved = localStorage.getItem(STORAGE_KEYS.ORDERS);
  if (saved) {
    try { 
      const parsed: Order[] = JSON.parse(saved); 
      return parsed.filter(o => o.id !== 'ord-101');
    } catch (e) { console.error(e); }
  }
  return INITIAL_SAMPLE_ORDERS;
})();

let globalCart: SelectedServiceItem[] = (() => {
  const saved = localStorage.getItem(STORAGE_KEYS.CART);
  if (saved) {
    try { return JSON.parse(saved); } catch (e) { console.error(e); }
  }
  return [];
})();

let globalTillDetails: SalonTillInfo[] = (() => {
  const saved = localStorage.getItem(STORAGE_KEYS.TILL_DETAILS);
  if (saved) {
    try { return JSON.parse(saved); } catch (e) { console.error(e); }
  }
  return SALON_TILL_DETAILS;
})();

const listeners = new Set<() => void>();

const notify = () => {
  listeners.forEach(fn => fn());
};

const saveToLocalStorage = () => {
  localStorage.setItem(STORAGE_KEYS.LANG, globalLanguage);
  localStorage.setItem(STORAGE_KEYS.THEME, globalTheme);
  localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(globalUser));
  localStorage.setItem(STORAGE_KEYS.STAFF, JSON.stringify(globalStaff));
  localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(globalOrders));
  localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(globalCart));
  localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(globalServices));
  localStorage.setItem(STORAGE_KEYS.GALLERY, JSON.stringify(globalGallery));
  localStorage.setItem(STORAGE_KEYS.REGISTERED_USERS, JSON.stringify(globalRegisteredUsers));
  localStorage.setItem(STORAGE_KEYS.TILL_DETAILS, JSON.stringify(globalTillDetails));
};

// Apply theme to document
export const applyAppTheme = (theme: AppTheme) => {
  if (typeof document !== 'undefined') {
    if (theme === 'light') {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
      document.documentElement.classList.add('dark');
    }
  }
};

// Initialize theme immediately
applyAppTheme(globalTheme);

// Bootstrap manager profile into Supabase
ensureManagerRegisteredInSupabase().catch(() => {});

// Comprehensive Real-time Cross-Device Synchronization
export const refreshAllFromSupabase = async () => {
  try {
    const [remoteProfiles, remoteOrders, remoteServices, remoteGallery] = await Promise.all([
      fetchProfilesFromSupabase(),
      fetchOrdersFromSupabase(),
      fetchServicesFromSupabase(),
      fetchGalleryFromSupabase()
    ]);

    let changed = false;

    if (remoteProfiles && remoteProfiles.length > 0) {
      const staffProfiles = remoteProfiles.filter(p => p.role === 'staff' || p.role === 'manager');
      const customerProfiles = remoteProfiles.filter(p => p.role === 'customer');
      if (staffProfiles.length > 0) {
        globalStaff = staffProfiles;
        changed = true;
      }
      if (customerProfiles.length > 0) {
        globalRegisteredUsers = customerProfiles;
        changed = true;
      }

      // Live sync currently logged-in user profile across devices
      if (globalUser) {
        const matched = remoteProfiles.find(
          p => (p.id && p.id === globalUser?.id) ||
               (p.username && p.username.toLowerCase() === globalUser?.username?.toLowerCase()) ||
               (p.email && p.email.toLowerCase() === globalUser?.email?.toLowerCase())
        );
        if (matched) {
          const effectiveAvatar = matched.avatar !== undefined ? matched.avatar : globalUser.avatar;
          if (
            matched.avatar !== globalUser.avatar ||
            matched.name !== globalUser.name ||
            matched.phone !== globalUser.phone ||
            matched.role !== globalUser.role ||
            matched.salary !== globalUser.salary ||
            matched.specialization !== globalUser.specialization
          ) {
            globalUser = {
              ...globalUser,
              ...matched,
              avatar: effectiveAvatar
            };
            changed = true;
          }
        }
      }

      // Live sync manager user profile
      const matchedManager = remoteProfiles.find(
        p => p.role === 'manager' && (
          p.email === MANAGER_USER.email || 
          p.username === MANAGER_USER.username ||
          p.id === MANAGER_USER.id
        )
      );
      if (matchedManager) {
        Object.assign(MANAGER_USER, matchedManager);
      }
    }

    if (remoteOrders && Array.isArray(remoteOrders)) {
      // Direct remote source of truth for orders
      globalOrders = remoteOrders.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      changed = true;
    }

    if (remoteServices && remoteServices.length > 0) {
      const serviceMap = new Map<string, ServiceItem>();
      // Keep all default services
      SALON_SERVICES.forEach(s => serviceMap.set(s.id, s));
      // Overwrite/add with updated remote services from Supabase
      remoteServices.forEach(s => serviceMap.set(s.id, s));
      globalServices = Array.from(serviceMap.values());
      changed = true;
    }

    if (remoteGallery && remoteGallery.length > 0) {
      const galleryMap = new Map<string, GalleryImage>();
      INITIAL_GALLERY_IMAGES.forEach(g => galleryMap.set(g.id, g));
      remoteGallery.forEach(g => galleryMap.set(g.id, g));
      globalGallery = Array.from(galleryMap.values());
      changed = true;
    }

    if (changed) {
      saveToLocalStorage();
      notify();
    }
  } catch (err) {
    console.warn('Cross-device sync error:', err);
  }
};

// Initialize background sync & realtime listeners across devices
if (typeof window !== 'undefined') {
  refreshAllFromSupabase().catch(() => {});

  // Frequent polling for instantaneous cross-device consistency
  setInterval(() => {
    refreshAllFromSupabase().catch(() => {});
  }, 3500);

  // Sync on tab focus or visibility change
  window.addEventListener('focus', () => {
    refreshAllFromSupabase().catch(() => {});
  });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      refreshAllFromSupabase().catch(() => {});
    }
  });

  // Supabase Realtime channel subscription
  try {
    supabase
      .channel('public:salon-cross-device-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        refreshAllFromSupabase();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        refreshAllFromSupabase();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'services' }, () => {
        refreshAllFromSupabase();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'gallery_images' }, () => {
        refreshAllFromSupabase();
      })
      .subscribe();
  } catch (e) {
    console.warn('Realtime subscription warning:', e);
  }

  supabase.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_IN' && session?.user) {
      const email = session.user.email || '';
      const isManager = email.toLowerCase() === 'jeanclaudekalonda1@gmail.com';
      const authenticatedUser: User = {
        id: session.user.id,
        email: email,
        name: session.user.user_metadata?.full_name || email.split('@')[0],
        phone: session.user.user_metadata?.phone || '+255 700 000 000',
        role: isManager ? 'manager' : 'customer',
        avatar: session.user.user_metadata?.avatar_url || undefined
      };
      globalUser = authenticatedUser;
      saveToLocalStorage();
      await syncProfileToSupabase(authenticatedUser);
      notify();
    } else if (event === 'SIGNED_OUT') {
      globalUser = null;
      saveToLocalStorage();
      notify();
    }
  });
}

export const salonStore = {
  getLanguage: () => globalLanguage,
  setLanguage: (lang: Language) => {
    globalLanguage = lang;
    saveToLocalStorage();
    notify();
  },

  getTheme: () => globalTheme,
  setTheme: (theme: AppTheme) => {
    globalTheme = theme;
    applyAppTheme(theme);
    saveToLocalStorage();
    notify();
  },

  getUser: () => globalUser,
  setUser: (user: User | null) => {
    globalUser = user;
    saveToLocalStorage();
    if (user) {
      syncProfileToSupabase(user);
    }
    notify();
  },

  getServices: () => globalServices,
  getGallery: () => globalGallery,
  getStaff: () => globalStaff,
  getOrders: () => globalOrders,
  getCart: () => globalCart,

  // --- SERVICE CRUD OPERATIONS (Synced to Supabase) ---
  addService: (newService: Omit<ServiceItem, 'id'>) => {
    const service: ServiceItem = {
      ...newService,
      id: `srv-${Date.now()}`
    };
    globalServices = [service, ...globalServices];
    saveToLocalStorage();
    syncServiceToSupabase(service);
    notify();
    return service;
  },

  updateService: (serviceId: string, updatedData: Partial<ServiceItem>) => {
    let targetService: ServiceItem | null = null;
    globalServices = globalServices.map(s => {
      if (s.id === serviceId) {
        targetService = { ...s, ...updatedData };
        return targetService;
      }
      return s;
    });
    saveToLocalStorage();
    if (targetService) {
      syncServiceToSupabase(targetService);
    }
    notify();
  },

  deleteService: (serviceId: string) => {
    globalServices = globalServices.filter(s => s.id !== serviceId);
    saveToLocalStorage();
    deleteServiceFromSupabase(serviceId);
    notify();
  },

  updateServiceImage: (serviceId: string, imageUrl: string) => {
    let targetService: ServiceItem | null = null;
    globalServices = globalServices.map(s => {
      if (s.id === serviceId) {
        targetService = { ...s, image: imageUrl };
        return targetService;
      }
      return s;
    });
    saveToLocalStorage();
    if (targetService) {
      syncServiceToSupabase(targetService);
    }
    notify();
  },

  // --- IMAGE GALLERY OPERATIONS (Synced to Supabase) ---
  addImageToGallery: (image: Omit<GalleryImage, 'id'>) => {
    const newImg: GalleryImage = {
      ...image,
      id: `img-${Date.now()}`
    };
    globalGallery = [newImg, ...globalGallery];
    saveToLocalStorage();
    syncGalleryImageToSupabase(newImg);
    notify();
    return newImg;
  },

  deleteGalleryImage: (imageId: string) => {
    globalGallery = globalGallery.filter(i => i.id !== imageId);
    saveToLocalStorage();
    deleteGalleryImageFromSupabase(imageId);
    notify();
  },

  // --- CART OPERATIONS ---
  addToCart: (service: ServiceItem, selectedPrice: number, optionLabel?: string) => {
    const existingIndex = globalCart.findIndex(i => i.serviceId === service.id);
    if (existingIndex > -1) {
      globalCart[existingIndex].selectedPrice = selectedPrice;
      globalCart[existingIndex].selectedOptionLabel = optionLabel;
      globalCart[existingIndex].count = 1;
    } else {
      globalCart.push({
        serviceId: service.id,
        nameSw: service.nameSw,
        nameEn: service.nameEn,
        nameFr: service.nameFr,
        selectedPrice,
        selectedOptionLabel: optionLabel,
        count: 1,
        image: service.image
      });
    }
    saveToLocalStorage();
    notify();
  },

  removeFromCart: (serviceId: string) => {
    globalCart = globalCart.filter(i => i.serviceId !== serviceId);
    saveToLocalStorage();
    notify();
  },

  clearCart: () => {
    globalCart = [];
    saveToLocalStorage();
    notify();
  },

  // --- ORDER OPERATIONS ---
  createOrder: (orderData: Partial<Order>): Order => {
    const bookingCode = `SLN-${Math.floor(1000 + Math.random() * 9000)}`;
    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      bookingCode,
      customerName: orderData.customerName || 'Mteja Mgeni',
      customerPhone: orderData.customerPhone || '+255 700 000 000',
      customerType: orderData.customerType || 'registered',
      customerId: orderData.customerId,
      items: orderData.items || [...globalCart],
      subtotal: orderData.subtotal || 0,
      discount: orderData.discount || 0,
      totalAmount: Math.max(0, (orderData.subtotal || 0) - (orderData.discount || 0)),
      assignedStaffId: orderData.assignedStaffId,
      assignedStaffName: orderData.assignedStaffName,
      assignedStaffAvatar: orderData.assignedStaffAvatar,
      status: orderData.status || 'pending_payment',
      paymentMethod: orderData.paymentMethod || 'mobile_money',
      createdAt: new Date().toISOString(),
      bookingSource: orderData.bookingSource || 'remote_web',
      notes: orderData.notes
    };

    globalOrders = [newOrder, ...globalOrders];
    globalCart = [];
    saveToLocalStorage();
    syncOrderToSupabase(newOrder);
    notify();
    return newOrder;
  },

  submitPaymentProof: (orderId: string, proof: PaymentProof, provider: MobileMoneyProvider) => {
    let updatedOrder: Order | null = null;
    globalOrders = globalOrders.map(ord => {
      if (ord.id === orderId) {
        updatedOrder = {
          ...ord,
          status: 'paid_pending_confirmation',
          paymentMethod: 'mobile_money',
          paymentProvider: provider,
          paymentProof: proof
        };
        return updatedOrder;
      }
      return ord;
    });
    saveToLocalStorage();
    if (updatedOrder) {
      syncOrderToSupabase(updatedOrder);
    }
    notify();
  },

  confirmPayment: (orderId: string) => {
    let confirmedOrder: Order | undefined;
    globalOrders = globalOrders.map(ord => {
      if (ord.id === orderId) {
        confirmedOrder = {
          ...ord,
          status: 'confirmed',
          confirmedAt: new Date().toISOString()
        };
        return confirmedOrder;
      }
      return ord;
    });

    // Update staff completed task count
    if (confirmedOrder && confirmedOrder.assignedStaffId) {
      const staffId = confirmedOrder.assignedStaffId;
      globalStaff = globalStaff.map(st => {
        if (st.id === staffId) {
          const updatedStaff = {
            ...st,
            totalTasksCompleted: (st.totalTasksCompleted || 0) + 1
          };
          syncProfileToSupabase(updatedStaff);
          return updatedStaff;
        }
        return st;
      });
    }

    saveToLocalStorage();
    if (confirmedOrder) {
      syncOrderToSupabase(confirmedOrder);
    }
    confetti({
      particleCount: 70,
      spread: 60,
      origin: { y: 0.6 }
    });
    notify();
  },

  rejectPayment: (orderId: string) => {
    let rejectedOrder: Order | null = null;
    globalOrders = globalOrders.map(ord => {
      if (ord.id === orderId) {
        rejectedOrder = {
          ...ord,
          status: 'pending_payment',
          notes: (ord.notes ? ord.notes + ' | ' : '') + 'Malipo hayakuthibitishwa na Meneja.'
        };
        return rejectedOrder;
      }
      return ord;
    });
    saveToLocalStorage();
    if (rejectedOrder) {
      syncOrderToSupabase(rejectedOrder);
    }
    notify();
  },

  updateOrderStatus: (orderId: string, status: OrderStatus) => {
    let updatedOrder: Order | null = null;
    globalOrders = globalOrders.map(ord => {
      if (ord.id === orderId) {
        updatedOrder = {
          ...ord,
          status,
          completedAt: status === 'completed' ? new Date().toISOString() : ord.completedAt
        };
        return updatedOrder;
      }
      return ord;
    });
    saveToLocalStorage();
    if (updatedOrder) {
      syncOrderToSupabase(updatedOrder);
    }
    notify();
  },

  assignStaff: (orderId: string, staffId: string) => {
    const staff = globalStaff.find(s => s.id === staffId);
    if (!staff) return;

    let assignedOrder: Order | null = null;
    globalOrders = globalOrders.map(ord => {
      if (ord.id === orderId) {
        assignedOrder = {
          ...ord,
          assignedStaffId: staff.id,
          assignedStaffName: staff.name,
          assignedStaffAvatar: staff.avatar,
          status: ord.status === 'pending_assignment' ? 'assigned' : ord.status
        };
        return assignedOrder;
      }
      return ord;
    });
    saveToLocalStorage();
    if (assignedOrder) {
      syncOrderToSupabase(assignedOrder);
    }
    notify();
  },

  addOrder: (order: Order) => {
    globalOrders = [order, ...globalOrders];
    saveToLocalStorage();
    syncOrderToSupabase(order);
    notify();
    return order;
  },

  updateOrder: (orderId: string, updates: Partial<Order>) => {
    let updatedOrder: Order | null = null;
    globalOrders = globalOrders.map(ord => {
      if (ord.id === orderId) {
        updatedOrder = { ...ord, ...updates };
        return updatedOrder;
      }
      return ord;
    });
    saveToLocalStorage();
    if (updatedOrder) {
      syncOrderToSupabase(updatedOrder);
    }
    notify();
    return updatedOrder;
  },

  deleteOrder: (orderId: string) => {
    globalOrders = globalOrders.filter(ord => ord.id !== orderId);
    saveToLocalStorage();
    deleteOrderFromSupabase(orderId);
    notify();
  },

  createStaff: (staffData: Omit<User, 'id'>) => {
    const isManager = staffData.role === 'manager';
    const newStaff: User = {
      ...staffData,
      id: `${isManager ? 'mgr' : 'staff'}-${Date.now()}`,
      role: staffData.role || 'staff',
      salary: staffData.salary || (isManager ? 850000 : 450000),
      dailyEarnings: 0,
      totalEarnings: 0,
      totalTasksCompleted: 0,
      rating: 5.0,
      reviewCount: 0,
      active: true,
      avatar: staffData.avatar || undefined
    };
    globalStaff = [...globalStaff, newStaff];
    saveToLocalStorage();
    syncProfileToSupabase(newStaff);
    notify();
    return newStaff;
  },

  createOnsiteJob: ({
    staffId,
    staffName,
    staffAvatar,
    service,
    price,
    clientName,
    clientPhone,
    paymentMethod = 'cash'
  }: {
    staffId: string;
    staffName: string;
    staffAvatar?: string;
    service: ServiceItem;
    price: number;
    clientName?: string;
    clientPhone?: string;
    paymentMethod?: any;
  }): Order => {
    const bookingCode = `WK-${Math.floor(1000 + Math.random() * 9000)}`;
    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      bookingCode,
      customerName: clientName?.trim() || 'Mteja wa Saluni (Walk-in)',
      customerPhone: clientPhone?.trim() || '+255 700 000 000',
      customerType: 'guest',
      items: [{
        serviceId: service.id,
        nameSw: service.nameSw,
        nameEn: service.nameEn,
        nameFr: service.nameFr,
        selectedPrice: price,
        count: 1,
        image: service.image
      }],
      subtotal: price,
      discount: 0,
      totalAmount: price,
      assignedStaffId: staffId,
      assignedStaffName: staffName,
      assignedStaffAvatar: staffAvatar,
      status: 'in_progress',
      paymentMethod,
      createdAt: new Date().toISOString(),
      bookingSource: 'walk_in'
    };
    globalOrders = [newOrder, ...globalOrders];
    saveToLocalStorage();
    syncOrderToSupabase(newOrder);
    notify();
    return newOrder;
  },

  getStaffPeriodStats: (
    staffId: string, 
    filterPeriod: 'today' | 'yesterday' | 'week' | 'month' | 'custom' | 'all' = 'today',
    customStartDate?: string,
    customEndDate?: string
  ) => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startOfYesterday = startOfToday - 24 * 60 * 60 * 1000;
    const startOfWeek = startOfToday - now.getDay() * 24 * 60 * 60 * 1000;
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    const staffOrders = globalOrders.filter(o => 
      o.assignedStaffId === staffId && 
      (o.status === 'confirmed' || o.status === 'completed')
    );

    const filtered = staffOrders.filter(ord => {
      const ordTime = new Date(ord.createdAt).getTime();
      if (filterPeriod === 'custom' && customStartDate && customEndDate) {
        const start = new Date(customStartDate).setHours(0, 0, 0, 0);
        const end = new Date(customEndDate).setHours(23, 59, 59, 999);
        return ordTime >= start && ordTime <= end;
      }
      if (filterPeriod === 'today') return ordTime >= startOfToday;
      if (filterPeriod === 'yesterday') return ordTime >= startOfYesterday && ordTime < startOfToday;
      if (filterPeriod === 'week') return ordTime >= startOfWeek;
      if (filterPeriod === 'month') return ordTime >= startOfMonth;
      return true;
    });

    const periodRevenue = filtered.reduce((acc, curr) => acc + curr.totalAmount, 0);
    const periodCount = filtered.length;

    return {
      periodRevenue,
      periodCount
    };
  },

  updateStaff: (staffId: string, updates: Partial<User>) => {
    let updatedStaffMember: User | null = null;
    globalStaff = globalStaff.map(st => {
      if (st.id === staffId || st.email === staffId || st.username === staffId) {
        updatedStaffMember = { ...st, ...updates };
        return updatedStaffMember;
      }
      return st;
    });

    if (staffId === MANAGER_USER.id || staffId === 'mgr-1' || staffId === MANAGER_USER.email || staffId === MANAGER_USER.username) {
      Object.assign(MANAGER_USER, updates);
      if (globalUser && globalUser.role === 'manager') {
        globalUser = { ...globalUser, ...updates };
      }
      updatedStaffMember = { ...MANAGER_USER, ...updates };
    }

    saveToLocalStorage();
    if (updatedStaffMember) {
      syncProfileToSupabase(updatedStaffMember);
    }
    notify();
    return updatedStaffMember;
  },

  deleteStaff: (staffId: string) => {
    const target = globalStaff.find(s => s.id === staffId || s.email === staffId || s.username === staffId);
    if (target) {
      deleteProfileFromSupabase(target);
    }
    globalStaff = globalStaff.filter(st => st.id !== staffId && st.email !== staffId && st.username !== staffId);
    saveToLocalStorage();
    notify();
  },

  updateStaffSalary: (staffId: string, newSalary: number) => {
    let updatedStaffMember: User | null = null;
    globalStaff = globalStaff.map(st => {
      if (st.id === staffId || st.email === staffId) {
        updatedStaffMember = { ...st, salary: newSalary };
        return updatedStaffMember;
      }
      return st;
    });

    if (staffId === MANAGER_USER.id || staffId === 'mgr-1' || staffId === MANAGER_USER.email) {
      MANAGER_USER.salary = newSalary;
      if (globalUser && globalUser.role === 'manager') {
        globalUser = { ...globalUser, salary: newSalary };
      }
      updatedStaffMember = { ...MANAGER_USER, salary: newSalary };
    }

    saveToLocalStorage();
    if (updatedStaffMember) {
      syncProfileToSupabase(updatedStaffMember);
    }
    notify();
  },

  updateUserProfile: (updates: Partial<User>) => {
    if (!globalUser) return;
    const updatedUser: User = {
      ...globalUser,
      ...updates
    };
    globalUser = updatedUser;

    // If the user is in staff list or manager, update staff list as well
    globalStaff = globalStaff.map(s => {
      if (s.id === updatedUser.id || s.email === updatedUser.email || s.username === updatedUser.username) {
        return { ...s, ...updates };
      }
      return s;
    });

    // If user is in registered users list, update them as well
    globalRegisteredUsers = globalRegisteredUsers.map(u => {
      if (u.id === updatedUser.id || u.email === updatedUser.email || u.username === updatedUser.username) {
        return { ...u, ...updates };
      }
      return u;
    });

    if (globalUser.role === 'manager' || globalUser.email === MANAGER_USER.email) {
      Object.assign(MANAGER_USER, updates);
    }

    saveToLocalStorage();
    syncProfileToSupabase(updatedUser);
    notify();
    return updatedUser;
  },

  registerUser: (newUser: User) => {
    const existing = globalRegisteredUsers.find(
      u => (u.email && u.email.toLowerCase() === newUser.email?.toLowerCase()) ||
           (u.username && u.username.toLowerCase() === newUser.username?.toLowerCase())
    );

    if (existing) {
      globalRegisteredUsers = globalRegisteredUsers.map(u => 
        u.id === existing.id ? { ...u, ...newUser } : u
      );
    } else {
      globalRegisteredUsers = [newUser, ...globalRegisteredUsers];
    }

    saveToLocalStorage();
    syncProfileToSupabase(newUser);
    notify();
    return newUser;
  },

  getRegisteredUsers: () => globalRegisteredUsers,

  getTillDetails: () => globalTillDetails,

  updateTillDetails: (provider: MobileMoneyProvider, updates: Partial<SalonTillInfo>) => {
    globalTillDetails = globalTillDetails.map(item => {
      if (item.provider === provider) {
        return { ...item, ...updates };
      }
      return item;
    });
    saveToLocalStorage();
    notify();
  },

  getMetrics: (
    filterPeriod: 'today' | 'yesterday' | 'week' | 'month' | 'custom' | 'all' = 'today',
    customStartDate?: string,
    customEndDate?: string
  ): DashboardMetrics => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startOfYesterday = startOfToday - 24 * 60 * 60 * 1000;
    const startOfWeek = startOfToday - now.getDay() * 24 * 60 * 60 * 1000;
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    const filteredOrders = globalOrders.filter(ord => {
      const ordTime = new Date(ord.createdAt).getTime();
      if (filterPeriod === 'custom' && customStartDate && customEndDate) {
        const start = new Date(customStartDate).setHours(0, 0, 0, 0);
        const end = new Date(customEndDate).setHours(23, 59, 59, 999);
        return ordTime >= start && ordTime <= end;
      }
      if (filterPeriod === 'today') return ordTime >= startOfToday;
      if (filterPeriod === 'yesterday') return ordTime >= startOfYesterday && ordTime < startOfToday;
      if (filterPeriod === 'week') return ordTime >= startOfWeek;
      if (filterPeriod === 'month') return ordTime >= startOfMonth;
      return true;
    });

    const confirmedOrCompleted = filteredOrders.filter(o => o.status === 'confirmed' || o.status === 'completed');
    const totalRevenue = confirmedOrCompleted.reduce((acc, curr) => acc + curr.totalAmount, 0);
    
    const totalServiceVolume: Record<string, number> = {};
    globalServices.forEach(s => {
      totalServiceVolume[s.id] = 0;
    });

    confirmedOrCompleted.forEach(ord => {
      ord.items.forEach(item => {
        totalServiceVolume[item.serviceId] = (totalServiceVolume[item.serviceId] || 0) + (item.count || 1);
      });
    });

    const todayOrders = globalOrders.filter(o => new Date(o.createdAt).getTime() >= startOfToday);
    const todayConfirmed = todayOrders.filter(o => o.status === 'confirmed' || o.status === 'completed');
    const todayRevenue = todayConfirmed.reduce((acc, curr) => acc + curr.totalAmount, 0);

    return {
      totalRevenue,
      todayRevenue,
      totalOrders: filteredOrders.length,
      todayOrders: todayOrders.length,
      completedOrdersCount: confirmedOrCompleted.length,
      pendingPaymentCount: filteredOrders.filter(o => o.status === 'pending_payment').length,
      pendingConfirmationCount: globalOrders.filter(o => o.status === 'paid_pending_confirmation').length,
      activeStaffCount: globalStaff.filter(s => s.active).length,
      totalServiceVolume
    };
  }
};

export const useSalonStore = () => {
  const [, setTick] = useState(0);

  useEffect(() => {
    const handleUpdate = () => setTick(t => t + 1);
    listeners.add(handleUpdate);
    return () => {
      listeners.delete(handleUpdate);
    };
  }, []);

  return {
    lang: salonStore.getLanguage(),
    setLanguage: salonStore.setLanguage,
    theme: salonStore.getTheme(),
    setTheme: salonStore.setTheme,
    currentUser: salonStore.getUser(),
    setCurrentUser: salonStore.setUser,
    services: salonStore.getServices(),
    gallery: salonStore.getGallery(),
    staffList: salonStore.getStaff(),
    registeredUsers: salonStore.getRegisteredUsers(),
    orders: salonStore.getOrders(),
    cart: salonStore.getCart(),
    addService: salonStore.addService,
    updateService: salonStore.updateService,
    deleteService: salonStore.deleteService,
    updateServiceImage: salonStore.updateServiceImage,
    addImageToGallery: salonStore.addImageToGallery,
    deleteGalleryImage: salonStore.deleteGalleryImage,
    addToCart: salonStore.addToCart,
    removeFromCart: salonStore.removeFromCart,
    clearCart: salonStore.clearCart,
    createOrder: salonStore.createOrder,
    addOrder: salonStore.addOrder,
    updateOrder: salonStore.updateOrder,
    deleteOrder: salonStore.deleteOrder,
    createOnsiteJob: salonStore.createOnsiteJob,
    getStaffPeriodStats: salonStore.getStaffPeriodStats,
    submitPaymentProof: salonStore.submitPaymentProof,
    confirmPayment: salonStore.confirmPayment,
    rejectPayment: salonStore.rejectPayment,
    updateOrderStatus: salonStore.updateOrderStatus,
    assignStaff: salonStore.assignStaff,
    createStaff: salonStore.createStaff,
    updateStaff: salonStore.updateStaff,
    deleteStaff: salonStore.deleteStaff,
    updateStaffSalary: salonStore.updateStaffSalary,
    updateUserProfile: salonStore.updateUserProfile,
    registerUser: salonStore.registerUser,
    getMetrics: salonStore.getMetrics,
    tillDetails: salonStore.getTillDetails(),
    updateTillDetails: salonStore.updateTillDetails,
    managerUser: MANAGER_USER
  };
};

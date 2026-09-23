import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { User, Order, ServiceItem } from '../types';
import { GalleryImage } from '../data/imageGallery';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://upvlnmvqozjvzoelyovs.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVwdmxubXZxb3pqdnpvZWx5b3ZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAwODkxNzcsImV4cCI6MjEwNTY2NTE3N30.4ee_JVTyvp3xJR3MzlrR08bYNI9XMT5cVJVwOt5IQAE';

export const isSupabaseConfigured = true;

export const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  }
});

/**
 * Trigger Real Google OAuth with Supabase
 * Redirects to Google consent screen on mobile/desktop browser
 */
export const signInWithGoogleOAuth = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  });
  if (error) {
    console.error('Google OAuth error:', error.message);
    throw error;
  }
  return data;
};

/**
 * Sign up with Email and Password via Supabase Auth
 */
export const signUpWithEmail = async (email: string, password: string, name?: string, phone?: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: name,
        phone: phone,
      }
    }
  });
  if (error) throw error;
  
  if (data.user) {
    const role = email.toLowerCase() === 'jeanclaudekalonda1@gmail.com' ? 'manager' : 'customer';
    await syncProfileToSupabase({
      id: data.user.id,
      email: data.user.email || email,
      name: name || email.split('@')[0],
      phone: phone || '+255 700 000 000',
      role,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'
    });
  }
  return data;
};

/**
 * Sign in with Email and Password via Supabase Auth
 */
export const signInWithEmail = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data;
};

const isUUID = (str?: string): boolean => {
  if (!str) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
};

/**
 * Ensure Manager Account exists in Supabase Profiles table without overwriting customized avatars/names
 */
export const ensureManagerRegisteredInSupabase = async (): Promise<User | null> => {
  const managerEmail = 'jeanclaudekalonda1@gmail.com';
  const managerUsername = 'jeanclaudekalonda1@gmail.com';
  const managerPass = 'juanclaudio';
  const defaultManagerName = 'Jean Claude Kalonda';
  const defaultManagerPhone = '+255 754 000 111';

  try {
    // Check if manager already exists
    const { data: existingManager } = await supabase
      .from('profiles')
      .select('*')
      .or(`email.eq.${managerEmail},username.eq.${managerUsername}`)
      .limit(1)
      .maybeSingle();

    if (existingManager) {
      return {
        id: existingManager.id || 'mgr-1',
        name: existingManager.name || existingManager.full_name || defaultManagerName,
        email: existingManager.email || managerEmail,
        phone: existingManager.phone || defaultManagerPhone,
        role: 'manager',
        username: existingManager.username || managerUsername,
        password: existingManager.password || managerPass,
        salary: existingManager.salary ? Number(existingManager.salary) : 1500000,
        avatar: existingManager.avatar || existingManager.avatar_url || undefined
      };
    }

    // Only insert if no manager profile exists at all
    const profilePayload: any = {
      username: managerUsername,
      name: defaultManagerName,
      full_name: defaultManagerName,
      email: managerEmail,
      password: managerPass,
      phone: defaultManagerPhone,
      role: 'manager',
      specialization: 'General Salon Management & Executive Oversight',
      salary: 1500000
    };

    await supabase
      .from('profiles')
      .upsert(profilePayload, { onConflict: 'username' });

    return {
      id: 'mgr-1',
      name: defaultManagerName,
      email: managerEmail,
      phone: defaultManagerPhone,
      role: 'manager',
      username: managerUsername,
      password: managerPass,
      salary: 1500000,
      avatar: undefined
    };
  } catch (err) {
    console.warn('Supabase manager profile sync check:', err);
    return null;
  }
};

/**
 * Sync / Upsert a user profile directly to Supabase `profiles` table
 */
export const syncProfileToSupabase = async (user: User) => {
  try {
    const userEmail = user.email || (user.username?.includes('@') ? user.username : `${user.username || user.id}@saloon.co.tz`);
    const userUsername = user.username || userEmail.split('@')[0] || user.id;

    const payload: any = {
      username: userUsername,
      name: user.name,
      full_name: user.name,
      role: user.role,
      phone: user.phone || null,
      email: userEmail,
      salary: user.salary ? Number(user.salary) : null,
      specialization: user.specialization || null,
      avatar: user.avatar || null,
      avatar_url: user.avatar || null,
      updated_at: new Date().toISOString()
    };

    if (user.password) {
      payload.password = user.password;
    }

    if (user.id && isUUID(user.id)) {
      payload.id = user.id;
    }

    const { error } = await supabase
      .from('profiles')
      .upsert(payload, { onConflict: 'username' });

    if (error) {
      const { error: fallbackError } = await supabase
        .from('profiles')
        .upsert(payload);
      if (fallbackError) {
        console.warn('Supabase profiles upsert warning:', fallbackError.message);
      }
    }
  } catch (err) {
    console.warn('Supabase profile sync error:', err);
  }
};

/**
 * Delete a profile from Supabase profiles table
 */
export const deleteProfileFromSupabase = async (user: User) => {
  try {
    if (user.id && isUUID(user.id)) {
      await supabase.from('profiles').delete().eq('id', user.id);
    } else if (user.username) {
      await supabase.from('profiles').delete().eq('username', user.username);
    } else if (user.email) {
      await supabase.from('profiles').delete().eq('email', user.email);
    }
  } catch (err) {
    console.warn('Supabase profile deletion warning:', err);
  }
};

/**
 * Fetch all profiles from Supabase
 */
export const fetchProfilesFromSupabase = async (): Promise<User[]> => {
  try {
    const { data, error } = await supabase.from('profiles').select('*');
    if (error || !data) {
      if (error) console.warn('Supabase fetchProfiles notice:', error.message);
      return [];
    }
    return data.map((p: any) => ({
      id: p.id || `profile-${p.username}`,
      name: p.name || p.full_name || 'User',
      email: p.email || (p.username?.includes('@') ? p.username : `${p.username}@saloon.co.tz`),
      username: p.username || (p.email ? p.email.split('@')[0] : 'user'),
      password: p.password || '123',
      phone: p.phone || '+255 700 000 000',
      role: (p.role === 'manager' || p.role === 'staff' || p.role === 'customer') ? p.role : 'customer',
      avatar: p.avatar || p.avatar_url || undefined,
      specialization: p.specialization || undefined,
      salary: p.salary ? Number(p.salary) : undefined,
      active: true
    }));
  } catch (e) {
    console.warn('Could not fetch profiles:', e);
    return [];
  }
};

/**
 * Sync order to Supabase `orders` table
 */
export const syncOrderToSupabase = async (order: Order) => {
  try {
    const payload: any = {
      id: order.id,
      booking_code: order.bookingCode,
      customer_name: order.customerName,
      customer_phone: order.customerPhone,
      customer_type: order.customerType,
      customer_id: order.customerId || null,
      items: order.items,
      subtotal: order.subtotal,
      discount: order.discount || 0,
      total_amount: order.totalAmount,
      assigned_staff_id: order.assignedStaffId || null,
      assigned_staff_name: order.assignedStaffName || null,
      assigned_staff_avatar: order.assignedStaffAvatar || null,
      status: order.status,
      payment_method: order.paymentMethod || null,
      payment_provider: order.paymentProvider || null,
      payment_proof: order.paymentProof || null,
      booking_source: order.bookingSource || 'remote_mobile',
      notes: order.notes || null,
      confirmed_at: order.confirmedAt || null,
      completed_at: order.completedAt || null,
      created_at: order.createdAt
    };

    const { error } = await supabase.from('orders').upsert(payload, { onConflict: 'id' });
    if (error) {
      console.warn('Supabase order sync error:', error.message);
    }
  } catch (e) {
    console.warn('Supabase order sync exception:', e);
  }
};

/**
 * Fetch all orders from Supabase `orders` table
 */
export const fetchOrdersFromSupabase = async (): Promise<Order[]> => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data) {
      if (error) console.warn('Supabase fetchOrders notice:', error.message);
      return [];
    }

    return data.map((o: any) => ({
      id: o.id,
      bookingCode: o.booking_code || o.bookingCode || `BK-${o.id.substring(0, 4)}`,
      customerName: o.customer_name || o.customerName || 'Mteja',
      customerPhone: o.customer_phone || o.customerPhone || '+255 700 000 000',
      customerType: (o.customer_type === 'registered' ? 'registered' : 'guest'),
      customerId: o.customer_id || o.customerId,
      items: Array.isArray(o.items) ? o.items : [],
      subtotal: Number(o.subtotal || o.total_amount || 0),
      discount: Number(o.discount || 0),
      totalAmount: Number(o.total_amount || o.totalAmount || 0),
      assignedStaffId: o.assigned_staff_id || o.assignedStaffId || undefined,
      assignedStaffName: o.assigned_staff_name || o.assignedStaffName || undefined,
      assignedStaffAvatar: o.assigned_staff_avatar || o.assignedStaffAvatar || undefined,
      status: o.status || 'pending_payment',
      paymentMethod: o.payment_method || o.paymentMethod || 'mobile_money',
      paymentProvider: o.payment_provider || o.paymentProvider || undefined,
      paymentProof: o.payment_proof || o.paymentProof || undefined,
      confirmedAt: o.confirmed_at || o.confirmedAt || undefined,
      completedAt: o.completed_at || o.completedAt || undefined,
      createdAt: o.created_at || o.createdAt || new Date().toISOString(),
      notes: o.notes || undefined,
      bookingSource: o.booking_source || o.bookingSource || 'remote_mobile'
    }));
  } catch (e) {
    console.warn('Could not fetch orders:', e);
    return [];
  }
};

/**
 * Delete order from Supabase
 */
export const deleteOrderFromSupabase = async (orderId: string) => {
  try {
    await supabase.from('orders').delete().eq('id', orderId);
  } catch (e) {
    console.warn('Error deleting order from Supabase:', e);
  }
};

/**
 * Sync service to Supabase `services` table
 */
export const syncServiceToSupabase = async (service: ServiceItem) => {
  try {
    const payload = {
      id: service.id,
      name_sw: service.nameSw,
      name_en: service.nameEn,
      name_fr: service.nameFr,
      category: service.category,
      price_type: service.priceType,
      min_price: service.minPrice,
      max_price: service.maxPrice,
      default_price: service.defaultPrice,
      duration_minutes: service.durationMinutes,
      image: service.image,
      description_sw: service.descriptionSw,
      description_en: service.descriptionEn,
      description_fr: service.descriptionFr,
      popular: !!service.popular,
      options: service.options || []
    };
    const { error } = await supabase.from('services').upsert(payload, { onConflict: 'id' });
    if (error) console.warn('Supabase service sync notice:', error.message);
  } catch (e) {
    console.warn('Supabase service sync exception:', e);
  }
};

/**
 * Fetch all services from Supabase
 */
export const fetchServicesFromSupabase = async (): Promise<ServiceItem[]> => {
  try {
    const { data, error } = await supabase.from('services').select('*');
    if (error || !data || data.length === 0) return [];
    return data.map((s: any) => ({
      id: s.id,
      nameSw: s.name_sw || s.nameSw || 'Huduma',
      nameEn: s.name_en || s.nameEn || s.name_sw || 'Service',
      nameFr: s.name_fr || s.nameFr || s.name_sw || 'Service',
      category: s.category || 'braids',
      priceType: s.price_type || s.priceType || 'fixed',
      minPrice: Number(s.min_price || s.minPrice || s.default_price || 10000),
      maxPrice: Number(s.max_price || s.maxPrice || s.default_price || 10000),
      defaultPrice: Number(s.default_price || s.defaultPrice || 10000),
      durationMinutes: Number(s.duration_minutes || s.durationMinutes || 45),
      image: s.image || 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=800&q=80',
      descriptionSw: s.description_sw || s.descriptionSw || '',
      descriptionEn: s.description_en || s.descriptionEn || '',
      descriptionFr: s.description_fr || s.descriptionFr || '',
      popular: !!s.popular,
      options: Array.isArray(s.options) ? s.options : []
    }));
  } catch (e) {
    return [];
  }
};

/**
 * Delete service from Supabase
 */
export const deleteServiceFromSupabase = async (serviceId: string) => {
  try {
    await supabase.from('services').delete().eq('id', serviceId);
  } catch (e) {}
};

/**
 * Sync gallery image to Supabase `gallery_images` table
 */
export const syncGalleryImageToSupabase = async (image: GalleryImage) => {
  try {
    const payload = {
      id: image.id,
      title: image.title,
      category: image.category,
      url: image.url,
      tag: image.tag
    };
    await supabase.from('gallery_images').upsert(payload, { onConflict: 'id' });
  } catch (e) {}
};

/**
 * Fetch gallery images from Supabase
 */
export const fetchGalleryFromSupabase = async (): Promise<GalleryImage[]> => {
  try {
    const { data, error } = await supabase.from('gallery_images').select('*');
    if (error || !data || data.length === 0) return [];
    return data.map((g: any) => ({
      id: g.id,
      title: g.title,
      category: g.category,
      url: g.url,
      tag: g.tag
    }));
  } catch (e) {
    return [];
  }
};

/**
 * Delete gallery image from Supabase
 */
export const deleteGalleryImageFromSupabase = async (imageId: string) => {
  try {
    await supabase.from('gallery_images').delete().eq('id', imageId);
  } catch (e) {}
};

/**
 * Upload an image to Supabase Storage 'salon-images' bucket
 */
export const uploadSalonImageToSupabase = async (file: File): Promise<string> => {
  try {
    const fileExt = (file.name.split('.').pop() || 'png').toLowerCase().replace(/[^a-z0-9]/g, '');
    const cleanExt = ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(fileExt) ? fileExt : 'png';
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${cleanExt}`;
    const filePath = `styles/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('salon-images')
      .upload(filePath, file, {
        contentType: file.type || `image/${cleanExt === 'jpg' ? 'jpeg' : cleanExt}`,
        cacheControl: '3600',
        upsert: true
      });

    if (uploadError) {
      console.warn('Supabase image upload warning, falling back to base64 reader:', uploadError.message);
      return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
    }

    const { data } = supabase.storage.from('salon-images').getPublicUrl(filePath);
    return data.publicUrl;
  } catch (err) {
    console.warn('Upload error, using fallback:', err);
    return new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });
  }
};

/**
 * Upload a payment proof screenshot to Supabase Storage 'payment-proofs' bucket
 */
export const uploadPaymentProofToSupabase = async (file: File): Promise<string> => {
  try {
    const fileExt = (file.name.split('.').pop() || 'png').toLowerCase().replace(/[^a-z0-9]/g, '');
    const cleanExt = ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(fileExt) ? fileExt : 'png';
    const fileName = `proof_${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${cleanExt}`;
    const filePath = `receipts/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('payment-proofs')
      .upload(filePath, file, {
        contentType: file.type || `image/${cleanExt === 'jpg' ? 'jpeg' : cleanExt}`,
        cacheControl: '3600',
        upsert: true
      });

    if (uploadError) {
      console.warn('Supabase proof upload warning, falling back to base64 reader:', uploadError.message);
      return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
    }

    const { data } = supabase.storage.from('payment-proofs').getPublicUrl(filePath);
    return data.publicUrl;
  } catch (err) {
    console.warn('Upload error, using fallback:', err);
    return new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });
  }
};

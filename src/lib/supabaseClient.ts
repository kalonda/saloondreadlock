import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { User, Order, ServiceItem } from '../types';

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
 * Ensure Manager Account exists in Supabase Profiles table
 */
export const ensureManagerRegisteredInSupabase = async (): Promise<User | null> => {
  const managerEmail = 'jeanclaudekalonda1@gmail.com';
  const managerUsername = 'jeanclaudekalonda1@gmail.com';
  const managerPass = 'juanclaudio';
  const managerName = 'Jean Claude Kalonda';
  const managerPhone = '+255 754 000 111';
  const avatar = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80';

  try {
    const profilePayload: any = {
      username: managerUsername,
      name: managerName,
      email: managerEmail,
      password: managerPass,
      phone: managerPhone,
      role: 'manager',
      avatar: avatar,
      specialization: 'General Salon Management & Executive Oversight',
      salary: 1500000
    };

    const { error: profileError } = await supabase
      .from('profiles')
      .upsert(profilePayload, { onConflict: 'username' });

    if (!profileError) {
      console.log('Manager profile verified & synced to Supabase profiles table.');
    }

    return {
      id: 'mgr-1',
      name: managerName,
      email: managerEmail,
      phone: managerPhone,
      role: 'manager',
      username: managerUsername,
      password: managerPass,
      salary: 1500000,
      avatar: avatar
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
    const avatar = user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80';

    const payload: any = {
      username: userUsername,
      name: user.name,
      role: user.role,
      phone: user.phone || null,
      email: userEmail,
      salary: user.salary ? Number(user.salary) : null,
      specialization: user.specialization || null,
      avatar: avatar
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
      // Fallback: attempt insert/update without onConflict parameter if table uses primary key id
      const { error: fallbackError } = await supabase
        .from('profiles')
        .upsert(payload);
      if (fallbackError) {
        console.warn('Supabase profiles upsert warning:', fallbackError.message);
      } else {
        console.log('Successfully synced profile to Supabase (fallback):', userUsername);
      }
    } else {
      console.log('Successfully synced profile to Supabase:', userUsername);
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
    console.log('Successfully deleted profile from Supabase:', user.username || user.name);
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
      avatar: p.avatar || p.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
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
    const { error } = await supabase.from('orders').upsert({
      id: order.id,
      booking_code: order.bookingCode,
      customer_name: order.customerName,
      customer_phone: order.customerPhone,
      customer_type: order.customerType,
      customer_id: order.customerId,
      items: order.items,
      subtotal: order.subtotal,
      discount: order.discount,
      total_amount: order.totalAmount,
      assigned_staff_id: order.assignedStaffId,
      assigned_staff_name: order.assignedStaffName,
      status: order.status,
      payment_method: order.paymentMethod,
      payment_provider: order.paymentProvider,
      payment_proof: order.paymentProof,
      booking_source: order.bookingSource,
      notes: order.notes,
      created_at: order.createdAt
    });
    if (error) console.warn('Supabase order sync warning:', error.message);
  } catch (e) {
    console.warn('Supabase order sync error:', e);
  }
};

/**
 * Upload an image to Supabase Storage 'salon-images' bucket
 */
export const uploadSalonImageToSupabase = async (file: File): Promise<string> => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
    const filePath = `styles/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('salon-images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.warn('Supabase image upload warning, falling back to local URL:', uploadError.message);
      return URL.createObjectURL(file);
    }

    const { data } = supabase.storage.from('salon-images').getPublicUrl(filePath);
    return data.publicUrl;
  } catch (err) {
    console.warn('Upload error, using fallback:', err);
    return URL.createObjectURL(file);
  }
};

/**
 * Upload a payment proof screenshot to Supabase Storage 'payment-proofs' bucket
 */
export const uploadPaymentProofToSupabase = async (file: File): Promise<string> => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `proof_${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
    const filePath = `receipts/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('payment-proofs')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.warn('Supabase proof upload warning, falling back to local URL:', uploadError.message);
      return URL.createObjectURL(file);
    }

    const { data } = supabase.storage.from('payment-proofs').getPublicUrl(filePath);
    return data.publicUrl;
  } catch (err) {
    console.warn('Upload error, using fallback:', err);
    return URL.createObjectURL(file);
  }
};

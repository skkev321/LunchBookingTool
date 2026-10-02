/**
 * supabase.js
 *
 * When VITE_DEMO_MODE=true  → all exports come from the in-memory mock layer.
 * Otherwise                 → all exports come from the real Supabase client.
 */
import { createClient } from '@supabase/supabase-js'

const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true'

// ── Mock imports (tree-shaken away in production) ────────────────────────────
import {
  supabase as _mockSupabase,
  authService as _mockAuth,
  userService as _mockUser,
  bookingService as _mockBooking,
  menuService as _mockMenu,
  scanService as _mockScan,
  vendorService as _mockVendor,
} from './mockSupabase.js'

// ── Real Supabase client ─────────────────────────────────────────────────────
let _realClient = null
if (!isDemoMode) {
  const url = import.meta.env.VITE_SUPABASE_URL
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY
  if (!url || !key) throw new Error('Missing Supabase environment variables')
  _realClient = createClient(url, key)
}

// ── Exports ──────────────────────────────────────────────────────────────────
export const supabase = isDemoMode ? _mockSupabase : _realClient

export const authService = isDemoMode ? _mockAuth : {
  signUp: async (email, password) => {
    const { data, error } = await supabase.auth.signUp({ email, password })
    return { data, error }
  },
  signIn: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    return { data, error }
  },
  signOut: async () => {
    const { error } = await supabase.auth.signOut()
    return { error }
  },
  getCurrentUser: async () => {
    const { data: { user }, error } = await supabase.auth.getUser()
    return { user, error }
  },
  resetPassword: async (email) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email)
    return { data, error }
  },
}

export const userService = isDemoMode ? _mockUser : {
  getUserProfile: async (userId) => {
    const { data, error } = await supabase.from('users').select('*').eq('id', userId).single()
    return { data, error }
  },
  getUserByEmail: async (email) => {
    const { data, error } = await supabase.from('users').select('*').eq('email', email).single()
    return { data, error }
  },
  createUserProfile: async (id, email, name, role) => {
    const { data, error } = await supabase.from('users').insert([{ id, email, name, role }])
    return { data, error }
  },
}

export const bookingService = isDemoMode ? _mockBooking : {
  createBooking: async (userId, date, protein) => {
    const { data, error } = await supabase
      .from('bookings')
      .insert([{ user_id: userId, date, protein, status: 'booked' }])
    return { data, error }
  },
  getBookingsByUser: async (userId) => {
    const { data, error } = await supabase
      .from('bookings').select('*').eq('user_id', userId).order('date', { ascending: true })
    return { data, error }
  },
  getBookingsByDate: async (date) => {
    const { data, error } = await supabase
      .from('bookings').select('*, users(name, email)').eq('date', date).eq('status', 'booked')
      .order('created_at', { ascending: true })
    return { data, error }
  },
  getBookingsForWeek: async (startDate, endDate) => {
    const { data, error } = await supabase
      .from('bookings').select('*, users(name, email)').gte('date', startDate).lte('date', endDate)
      .order('date', { ascending: true })
    return { data, error }
  },
  cancelBooking: async (bookingId) => {
    const { data, error } = await supabase
      .from('bookings').update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
      .eq('id', bookingId)
    return { data, error }
  },
  getBookingByUserAndDate: async (userId, date) => {
    const { data, error } = await supabase
      .from('bookings').select('*').eq('user_id', userId).eq('date', date).single()
    return { data, error }
  },
}

export const vendorService = isDemoMode ? _mockVendor : {
  getVendors: async () => {
    const { data, error } = await supabase.from('vendors').select('*').order('name', { ascending: true })
    return { data, error }
  },
  addVendor: async (name, email) => {
    // TODO: this only creates the vendor record — it does not create a login.
    // Replace with Supabase's invite-by-email (admin API, needs a server-side
    // function) so the vendor sets their own password, then insert into `users`
    // with role 'provider' once the invite is accepted.
    const { data, error } = await supabase.from('vendors').insert([{ name, email }]).select().single()
    return { data, error }
  },
  removeVendor: async (vendorId) => {
    const { data, error } = await supabase.from('vendors').delete().eq('id', vendorId)
    return { data, error }
  },
}

export const menuService = isDemoMode ? _mockMenu : {
  addMenu: async (date, content, vendorId = null) => {
    const { data, error } = await supabase.from('menus').upsert([{ date, content, vendor_id: vendorId }])
    return { data, error }
  },
  getMenuByDate: async (date) => {
    const { data, error } = await supabase.from('menus').select('*').eq('date', date).single()
    return { data, error }
  },
  getMenusForWeek: async (startDate, endDate) => {
    const { data, error } = await supabase.from('menus').select('*').gte('date', startDate).lte('date', endDate)
    return { data, error }
  },
  deleteMenu: async (date) => {
    const { data, error } = await supabase.from('menus').delete().eq('date', date)
    return { data, error }
  },
}

export const scanService = isDemoMode ? _mockScan : {
  recordScan: async (email, bookingId, outcome, notes = null) => {
    const { data, error } = await supabase
      .from('scans')
      .insert([{ email, booking_id: bookingId, outcome, notes, timestamp: new Date().toISOString() }])
    return { data, error }
  },
  getScansByDate: async (date) => {
    const { data, error } = await supabase
      .from('scans').select('*, bookings(user_id, protein, date)').eq('date_scanned', date)
      .order('timestamp', { ascending: false })
    return { data, error }
  },
  getScanLog: async (startDate, endDate) => {
    const { data, error } = await supabase
      .from('scans').select('*, bookings(user_id, protein, date), users(name)')
      .gte('timestamp', startDate).lte('timestamp', endDate)
      .order('timestamp', { ascending: false })
    return { data, error }
  },
  getScansByBooking: async (bookingId) => {
    const { data, error } = await supabase
      .from('scans').select('*').eq('booking_id', bookingId)
      .order('timestamp', { ascending: false })
    return { data, error }
  },
}

export const facilityTeamService = isDemoMode ? {
  getAllEmployees: async () => ({ data: [], error: null }),
  getTeamMembers: async () => ({ data: [], error: null }),
  addTeamMember: async (employeeId) => ({ data: null, error: null }),
  removeTeamMember: async (employeeId) => ({ data: null, error: null }),
} : {
  getAllEmployees: async () => {
    const { data, error } = await supabase
      .from('users').select('id, name, email').eq('role', 'employee').order('name', { ascending: true })
    return { data, error }
  },
  getTeamMembers: async () => {
    const { data, error } = await supabase
      .from('facility_team_members').select('*, users(id, name, email)').order('created_at', { ascending: false })
    return { data, error }
  },
  addTeamMember: async (employeeId) => {
    const { data, error } = await supabase
      .from('facility_team_members').insert([{ user_id: employeeId }])
    return { data, error }
  },
  removeTeamMember: async (employeeId) => {
    const { data, error } = await supabase
      .from('facility_team_members').delete().eq('user_id', employeeId)
    return { data, error }
  },
}

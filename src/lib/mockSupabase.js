/**
 * mockSupabase.js
 * A drop-in replacement for supabase.js that uses in-memory mock data.
 * All service calls return the same { data, error } shape as the real Supabase client.
 */
import {
  MOCK_USERS, MOCK_BOOKINGS, MOCK_MENUS, MOCK_SCANS,
  DEMO_CREDENTIALS
} from './mockData'

// Mutable references so mutations persist within the session
import * as _store from './mockData'

const delay = (ms = 200) => new Promise(r => setTimeout(r, ms))
const ok  = (data)  => ({ data, error: null })
const err = (msg)   => ({ data: null, error: { message: msg, code: 'MOCK_ERR' } })

// Demo-only stand-in for a real invite flow (no email sending in this mock layer).
// A real backend should replace this with Supabase's invite-by-email, so the vendor
// sets their own password instead of facilities generating and relaying one.
const generateTempPassword = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'
  let pwd = ''
  for (let i = 0; i < 10; i++) pwd += chars[Math.floor(Math.random() * chars.length)]
  return pwd
}

// ── Auth ─────────────────────────────────────────────────────────────────────
let _currentUserId = null

export const authService = {
  signIn: async (email, password) => {
    await delay()
    const cred = _store.DEMO_CREDENTIALS[email.toLowerCase()]
    if (!cred || cred.password !== password) return err('Invalid login credentials')
    _currentUserId = cred.userId
    return ok({ user: { id: cred.userId, email } })
  },
  signOut: async () => {
    await delay(100)
    _currentUserId = null
    return { error: null }
  },
  getCurrentUser: async () => {
    await delay(50)
    if (!_currentUserId) return { user: null, error: null }
    const user = _store.MOCK_USERS.find(u => u.id === _currentUserId)
    return { user: user ? { id: user.id, email: user.email } : null, error: null }
  },
}

// ── User service ──────────────────────────────────────────────────────────────
export const userService = {
  getUserProfile: async (userId) => {
    await delay()
    const user = _store.MOCK_USERS.find(u => u.id === userId)
    return user ? ok(user) : err('User not found')
  },
  getUserByEmail: async (email) => {
    await delay()
    const user = _store.MOCK_USERS.find(u => u.email === email.toLowerCase())
    return user ? ok(user) : err('User not found')
  },
  createUserProfile: async (id, email, name, role) => {
    await delay()
    _store.MOCK_USERS.push({ id, email, name, role })
    return ok({ id, email, name, role })
  },
}

// ── Booking service ───────────────────────────────────────────────────────────
export const bookingService = {
  createBooking: async (userId, date, protein) => {
    await delay()
    // Prevent duplicates
    const exists = _store.MOCK_BOOKINGS.find(
      b => b.user_id === userId && b.date === date && b.status !== 'cancelled'
    )
    if (exists) return err('You already have a booking for this date')
    const user = _store.MOCK_USERS.find(u => u.id === userId)
    const newBooking = {
      id: `b${Date.now()}`,
      user_id: userId,
      date,
      protein,
      status: 'booked',
      created_at: new Date().toISOString(),
      users: { name: user?.name || '', email: user?.email || '' },
    }
    _store.MOCK_BOOKINGS.push(newBooking)
    return ok(newBooking)
  },

  getBookingsByUser: async (userId) => {
    await delay()
    const data = _store.MOCK_BOOKINGS
      .filter(b => b.user_id === userId)
      .sort((a, b) => a.date.localeCompare(b.date))
    return ok(data)
  },

  getBookingsByDate: async (date) => {
    await delay()
    const data = _store.MOCK_BOOKINGS
      .filter(b => b.date === date && b.status === 'booked')
      .sort((a, b) => a.created_at.localeCompare(b.created_at))
    return ok(data)
  },

  getBookingsForWeek: async (startDate, endDate) => {
    await delay()
    const data = _store.MOCK_BOOKINGS
      .filter(b => b.date >= startDate && b.date <= endDate)
      .sort((a, b) => a.date.localeCompare(b.date))
    return ok(data)
  },

  cancelBooking: async (bookingId) => {
    await delay()
    const idx = _store.MOCK_BOOKINGS.findIndex(b => b.id === bookingId)
    if (idx === -1) return err('Booking not found')
    _store.MOCK_BOOKINGS[idx] = {
      ..._store.MOCK_BOOKINGS[idx],
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
    }
    return ok(_store.MOCK_BOOKINGS[idx])
  },

  getBookingByUserAndDate: async (userId, date) => {
    await delay()
    const booking = _store.MOCK_BOOKINGS.find(
      b => b.user_id === userId && b.date === date && b.status !== 'cancelled'
    )
    if (!booking) return err('Not found')
    return ok(booking)
  },
}

// ── Vendor service ────────────────────────────────────────────────────────────
let _vendorUserSeq = 1000

export const vendorService = {
  getVendors: async () => {
    await delay()
    return ok([..._store.MOCK_VENDORS])
  },

  addVendor: async (name, email) => {
    await delay()
    const normalizedEmail = email.toLowerCase()
    if (_store.MOCK_USERS.some(u => u.email === normalizedEmail)) {
      return err('A user with this email already exists')
    }
    const vendorId = `v${Date.now()}`
    const userId = `vu${_vendorUserSeq++}`
    const tempPassword = generateTempPassword()
    const vendor = { id: vendorId, name, email: normalizedEmail }
    _store.MOCK_VENDORS.push(vendor)
    _store.MOCK_USERS.push({ id: userId, email: normalizedEmail, name, role: 'provider', vendor_id: vendorId })
    _store.DEMO_CREDENTIALS[normalizedEmail] = { password: tempPassword, userId }
    // tempPassword is only ever returned here, on creation — like a real invite link, it isn't stored anywhere retrievable afterward.
    return ok({ ...vendor, tempPassword })
  },

  removeVendor: async (vendorId) => {
    await delay()
    const idx = _store.MOCK_VENDORS.findIndex(v => v.id === vendorId)
    if (idx === -1) return err('Vendor not found')
    const [vendor] = _store.MOCK_VENDORS.splice(idx, 1)
    const userIdx = _store.MOCK_USERS.findIndex(u => u.vendor_id === vendorId)
    if (userIdx !== -1) {
      const [removedUser] = _store.MOCK_USERS.splice(userIdx, 1)
      delete _store.DEMO_CREDENTIALS[removedUser.email]
    }
    return ok(vendor)
  },
}

// ── Menu service ──────────────────────────────────────────────────────────────
export const menuService = {
  addMenu: async (date, content, vendorId = null) => {
    await delay()
    _store.MOCK_MENUS[date] = { date, content, vendor_id: vendorId }
    return ok(_store.MOCK_MENUS[date])
  },

  getMenuByDate: async (date) => {
    await delay()
    const menu = _store.MOCK_MENUS[date]
    return menu ? ok(menu) : ok(null)
  },

  getMenusForWeek: async (startDate, endDate) => {
    await delay()
    const data = Object.values(_store.MOCK_MENUS).filter(
      m => m.date >= startDate && m.date <= endDate
    )
    return ok(data)
  },

  deleteMenu: async (date) => {
    await delay()
    delete _store.MOCK_MENUS[date]
    return ok(null)
  },
}

// ── Scan service ──────────────────────────────────────────────────────────────
export const scanService = {
  recordScan: async (email, bookingId, outcome, notes = null) => {
    await delay()
    const user = _store.MOCK_USERS.find(u => u.email === email)
    const booking = bookingId ? _store.MOCK_BOOKINGS.find(b => b.id === bookingId) : null
    const scan = {
      id: `s${Date.now()}`,
      email,
      booking_id: bookingId,
      outcome,
      notes,
      timestamp: new Date().toISOString(),
      bookings: booking ? { user_id: booking.user_id, protein: booking.protein, date: booking.date } : null,
      users: { name: user?.name || email },
    }
    _store.MOCK_SCANS.push(scan)

    // If fulfilled, mark booking as scanned
    if (outcome === 'fulfilled' && bookingId) {
      const idx = _store.MOCK_BOOKINGS.findIndex(b => b.id === bookingId)
      if (idx !== -1) _store.MOCK_BOOKINGS[idx].status = 'scanned'
    }

    return ok(scan)
  },

  getScansByDate: async (date) => {
    await delay()
    const data = _store.MOCK_SCANS
      .filter(s => s.timestamp.startsWith(date))
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
    return ok(data)
  },

  getScanLog: async (startDate, endDate) => {
    await delay()
    const data = _store.MOCK_SCANS
      .filter(s => s.timestamp >= startDate && s.timestamp <= endDate)
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
    return ok(data)
  },

  getScansByBooking: async (bookingId) => {
    await delay()
    const data = _store.MOCK_SCANS
      .filter(s => s.booking_id === bookingId)
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
    return ok(data)
  },
}

// ── Stub for supabase client (only used directly in App.jsx auth listener) ────
export const supabase = {
  from: () => ({ select: () => ({ eq: () => ({ single: async () => ok(null) }) }) }),
  auth: {
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
  },
}

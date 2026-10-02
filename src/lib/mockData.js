import { addDays, format, startOfDay } from 'date-fns'

// ── helpers ─────────────────────────────────────────────────────────────────
const today   = format(new Date(), 'yyyy-MM-dd')
const d = (n) => format(addDays(startOfDay(new Date()), n), 'yyyy-MM-dd')

// ── Mock users ───────────────────────────────────────────────────────────────
export const MOCK_USERS = [
  { id: 'u1', email: 'alice@ifs.com',        name: 'Alice Johnson',   role: 'employee'   },
  { id: 'u2', email: 'bob@ifs.com',          name: 'Bob Smith',       role: 'employee'   },
  { id: 'u3', email: 'carol@ifs.com',        name: 'Carol Williams',  role: 'employee'   },
  { id: 'u4', email: 'dave@ifs.com',         name: 'Dave Brown',      role: 'employee'   },
  { id: 'u5', email: 'facilities@ifs.com',   name: 'Facilities Team', role: 'facilities' },
  { id: 'u6', email: 'provider@ifs.com',     name: 'Spice Route Catering', role: 'provider', vendor_id: 'v1' },
]

// ── Mock vendors ─────────────────────────────────────────────────────────────
export const MOCK_VENDORS = [
  { id: 'v1', name: 'Spice Route Catering', email: 'provider@ifs.com' },
]

// Demo credentials (what the login form accepts)
export const DEMO_CREDENTIALS = {
  'employee@demo.com':   { password: 'demo', userId: 'u1' },
  'alice@ifs.com':       { password: 'demo', userId: 'u1' },
  'bob@ifs.com':         { password: 'demo', userId: 'u2' },
  'facilities@ifs.com':  { password: 'demo', userId: 'u5' },
  'provider@ifs.com':    { password: 'demo', userId: 'u6' },
}

// ── Mock bookings ────────────────────────────────────────────────────────────
let _nextId = 100
const mkId = () => `b${_nextId++}`

export let MOCK_BOOKINGS = [
  { id: mkId(), user_id: 'u1', date: d(1),  protein: 'Chicken', status: 'booked',    created_at: new Date().toISOString(), users: { name: 'Alice Johnson',  email: 'alice@ifs.com'  } },
  { id: mkId(), user_id: 'u1', date: d(2),  protein: 'Fish',    status: 'booked',    created_at: new Date().toISOString(), users: { name: 'Alice Johnson',  email: 'alice@ifs.com'  } },
  { id: mkId(), user_id: 'u2', date: d(1),  protein: 'Egg',     status: 'booked',    created_at: new Date().toISOString(), users: { name: 'Bob Smith',      email: 'bob@ifs.com'    } },
  { id: mkId(), user_id: 'u2', date: d(3),  protein: 'Veg',     status: 'booked',    created_at: new Date().toISOString(), users: { name: 'Bob Smith',      email: 'bob@ifs.com'    } },
  { id: mkId(), user_id: 'u3', date: today, protein: 'Chicken', status: 'scanned',   created_at: new Date().toISOString(), users: { name: 'Carol Williams', email: 'carol@ifs.com'  } },
  { id: mkId(), user_id: 'u4', date: today, protein: 'Fish',    status: 'booked',    created_at: new Date().toISOString(), users: { name: 'Dave Brown',     email: 'dave@ifs.com'   } },
  { id: mkId(), user_id: 'u1', date: today, protein: 'Chicken', status: 'scanned',   created_at: new Date().toISOString(), users: { name: 'Alice Johnson',  email: 'alice@ifs.com'  } },
]

// ── Mock menus ───────────────────────────────────────────────────────────────
export let MOCK_MENUS = {
  [today]: { date: today, content: 'Grilled chicken with steamed rice, lentil soup, and garden salad', vendor_id: 'v1' },
  [d(1)]:  { date: d(1),  content: 'Fish curry with basmati rice, raita, and naan bread', vendor_id: 'v1' },
  [d(2)]:  { date: d(2),  content: 'Egg fried rice with mixed vegetable stir-fry and papad', vendor_id: 'v1' },
}

// ── Mock scans ───────────────────────────────────────────────────────────────
export let MOCK_SCANS = [
  {
    id: 's1', email: 'carol@ifs.com', booking_id: 'b104',
    outcome: 'fulfilled', notes: null,
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    bookings: { user_id: 'u3', protein: 'Chicken', date: today },
    users: { name: 'Carol Williams' }
  },
  {
    id: 's2', email: 'alice@ifs.com', booking_id: 'b106',
    outcome: 'fulfilled', notes: null,
    timestamp: new Date(Date.now() - 1800000).toISOString(),
    bookings: { user_id: 'u1', protein: 'Chicken', date: today },
    users: { name: 'Alice Johnson' }
  },
]

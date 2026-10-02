# Lunch Booking System

A role-based lunch booking application built with React, Vite, and Supabase. Supports three user roles: **Employee**, **Facilities Manager**, and **Lunch Provider**.

## Features

### 👨‍💼 Employee
- Book lunch for multiple weekdays in advance
- Cutoff time: 6pm previous day
- Select protein preference (Chicken, Fish, Egg, Veg)
- View menu if available
- Cancel bookings
- Display personal QR code for provider verification

### 🏢 Facilities Manager
- View all bookings for the week
- Add/edit/delete daily menus
- Track fulfillment with scan log
- Export bookings and scan data to CSV
- Monitor no-shows and duplicate scans

### 📦 Lunch Provider
- Scan employee QR codes to verify orders
- Manual email entry fallback
- Record lunch fulfillment
- Automatic duplicate scan detection

## Tech Stack

- **Frontend**: React 18 + Vite
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **QR Code**: qrcode.react + html5-qrcode
- **Icons**: lucide-react
- **Date Handling**: date-fns

## Quick Start

### 1. Prerequisites

- Node.js 16+
- npm or yarn
- Supabase account (free tier works)

### 2. Clone & Install

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env.local
```

### 3. Supabase Setup

#### a. Create a Supabase Project
1. Go to https://supabase.com
2. Create a new project
3. Wait for it to initialize

#### b. Get Your Credentials
1. In Supabase, go to **Settings → API**
2. Copy `Project URL` → paste in `VITE_SUPABASE_URL`
3. Copy `anon public` key → paste in `VITE_SUPABASE_ANON_KEY`

#### c. Create Database Tables
In Supabase, go to **SQL Editor** and run this script:

```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255),
  role VARCHAR(50) NOT NULL CHECK (role IN ('employee', 'facilities', 'provider')),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Bookings table
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  date DATE NOT NULL,
  protein VARCHAR(50) NOT NULL CHECK (protein IN ('Chicken', 'Fish', 'Egg', 'Veg')),
  status VARCHAR(50) DEFAULT 'booked' CHECK (status IN ('booked', 'scanned', 'cancelled', 'no-show')),
  created_at TIMESTAMP DEFAULT NOW(),
  cancelled_at TIMESTAMP,
  UNIQUE(user_id, date)
);

-- Menus table
CREATE TABLE menus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL UNIQUE,
  content TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Scans table
CREATE TABLE scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL,
  booking_id UUID REFERENCES bookings(id),
  outcome VARCHAR(50) NOT NULL CHECK (outcome IN ('fulfilled', 'not-requested', 'duplicate')),
  notes TEXT,
  timestamp TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_bookings_user_date ON bookings(user_id, date);
CREATE INDEX idx_bookings_date ON bookings(date);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_scans_timestamp ON scans(timestamp);
CREATE INDEX idx_scans_email ON scans(email);
CREATE INDEX idx_menus_date ON menus(date);

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE scans ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view their own profile" ON users
  FOR SELECT USING (auth.uid() = id);

-- RLS Policies for bookings table
CREATE POLICY "Employees can see own bookings" ON bookings
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Employees can create bookings" ON bookings
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Employees can update own bookings" ON bookings
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Facilities can view all bookings" ON bookings
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'facilities')
  );

-- RLS Policies for menus table
CREATE POLICY "Anyone can view menus" ON menus
  FOR SELECT USING (true);

CREATE POLICY "Facilities can manage menus" ON menus
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'facilities')
  );

-- RLS Policies for scans table
CREATE POLICY "Provider can create scans" ON scans
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'provider')
  );

CREATE POLICY "Facilities can view scans" ON scans
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'facilities')
  );
```

#### d. Create Test Users
In **Supabase Auth**, create users with these emails:

- `employee@example.com` (password: any)
- `facilities@example.com` (password: any)
- `provider@example.com` (password: any)

Then in the **users** table, insert:

```sql
INSERT INTO users (id, email, name, role) VALUES
  ('USER_ID_1', 'employee@example.com', 'John Doe', 'employee'),
  ('USER_ID_2', 'facilities@example.com', 'Jane Smith', 'facilities'),
  ('USER_ID_3', 'provider@example.com', 'Bob Johnson', 'provider');
```

Replace `USER_ID_1`, `USER_ID_2`, `USER_ID_3` with the actual UUIDs from the auth users.

### 4. Run Locally

```bash
npm run dev
```

Opens at `http://localhost:3000`

## Deployment

### Deploy to Netlify

```bash
# Build
npm run build

# Push to GitHub, connect repo to Netlify
# Auto-deploys from main branch
```

Or drag the `dist/` folder into Netlify.

### Deploy to Azure Static Web Apps

1. Push code to GitHub
2. In Azure Portal, create **Static Web App**
3. Connect GitHub repo, select build folder: `dist/`
4. Add environment variables in Azure:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

## User Flows

### Employee Booking Flow
1. Login with email
2. **Book Lunch** tab
3. Select dates (cutoff: 6pm previous day)
4. Choose protein per date
5. See menu if available
6. Submit booking
7. View in **My Bookings** tab
8. Share QR from **My QR Code** tab

### Facilities Management Flow
1. Login with email
2. **Bookings** tab: see daily totals & employee list
3. **Menu Manager** tab: add menus for upcoming days
4. **Scan Log** tab: monitor fulfillment, export data

### Provider Scanning Flow
1. Login with email
2. Point camera at employee's QR code
3. System shows:
   - ✓ **Lunch Requested - [Protein]** if booking exists
   - ✗ **Lunch Not Requested** if no booking
   - ⚠ **Duplicate Scan** if scanned recently
4. Continue scanning

## Cutoff Logic

**Rule:** Cutoff for day X is 6pm on day X-1.

**Examples:**
- Today Mon 3pm → Can book for Tue (cutoff not reached)
- Today Mon 7pm → Cannot book for Tue (cutoff passed)
- Today Fri 5pm → Can book for Mon next week
- Today Fri 7pm → Cannot book for Mon next week

Weekends are excluded. Only weekdays (Mon–Fri) available.

## Database Schema

### users
- `id` (UUID, PK)
- `email` (VARCHAR, unique)
- `name` (VARCHAR)
- `role` (VARCHAR: 'employee', 'facilities', 'provider')
- `created_at` (TIMESTAMP)

### bookings
- `id` (UUID, PK)
- `user_id` (FK → users)
- `date` (DATE)
- `protein` (VARCHAR: 'Chicken', 'Fish', 'Egg', 'Veg')
- `status` (VARCHAR: 'booked', 'scanned', 'cancelled', 'no-show')
- `created_at`, `cancelled_at` (TIMESTAMP)
- Unique constraint: (user_id, date)

### menus
- `id` (UUID, PK)
- `date` (DATE, unique)
- `content` (TEXT)
- `created_at`, `updated_at` (TIMESTAMP)

### scans
- `id` (UUID, PK)
- `email` (VARCHAR)
- `booking_id` (FK → bookings, nullable)
- `outcome` (VARCHAR: 'fulfilled', 'not-requested', 'duplicate')
- `notes` (TEXT, optional)
- `timestamp` (TIMESTAMP)

## Troubleshooting

### QR Scanner Not Working
- Allow camera permissions in browser
- Use HTTPS in production (QR scan requires secure context)
- Use fallback email entry if camera unavailable

### Bookings Not Showing
- Check RLS policies in Supabase
- Ensure user role is set correctly in `users` table
- Check network tab for API errors

### Environment Variables Not Loading
- Restart dev server after updating `.env.local`
- Use `VITE_` prefix for client-side variables
- Check Supabase credentials are correct

## Future Enhancements

- Email notifications (booking confirmed, reminder)
- Dietary restrictions beyond protein
- Standing/recurring bookings
- SMS reminders for no-shows
- Analytics dashboard
- Multi-location support
- Cost tracking and reimbursement

## Support

For issues, check:
1. Browser console for errors
2. Supabase logs in dashboard
3. Network requests in DevTools
4. RLS policies are configured correctly

---

Built with ❤️ for IFS Colombo

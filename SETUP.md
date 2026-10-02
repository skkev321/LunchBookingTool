# Setup Guide - Lunch Booking System

## 5-Minute Setup

### Step 1: Create Supabase Project
1. Go to https://supabase.com → Sign up (free)
2. Create new project
3. Wait 2-3 minutes for initialization

### Step 2: Get API Keys
In Supabase Dashboard:
- Click **Settings** (bottom left)
- Go to **API** tab
- Copy **Project URL** and **anon public** key

### Step 3: Setup Environment
```bash
cp .env.example .env.local
```

Edit `.env.local`:
```
VITE_SUPABASE_URL=paste_your_project_url_here
VITE_SUPABASE_ANON_KEY=paste_your_anon_key_here
```

### Step 4: Create Database Tables
In Supabase:
1. Go to **SQL Editor**
2. Click **New Query**
3. Paste the entire SQL script from README.md (section "Create Database Tables")
4. Click **Run**

### Step 5: Create Test Users
In Supabase:
1. Go to **Authentication → Users**
2. Click **Add user**
3. Create 3 test users:
   - `employee@example.com` / password: `test123`
   - `facilities@example.com` / password: `test123`
   - `provider@example.com` / password: `test123`

### Step 6: Link Users to Database
In Supabase:
1. Go to **SQL Editor**
2. Run this query to get user IDs:
```sql
SELECT id, email FROM auth.users;
```

3. Copy the UUIDs and insert into users table:
```sql
INSERT INTO users (id, email, name, role) VALUES
  ('COPY_UUID_1_HERE', 'employee@example.com', 'Employee Test', 'employee'),
  ('COPY_UUID_2_HERE', 'facilities@example.com', 'Facilities Test', 'facilities'),
  ('COPY_UUID_3_HERE', 'provider@example.com', 'Provider Test', 'provider');
```

### Step 7: Run App
```bash
npm install
npm run dev
```

Opens at `http://localhost:3000`

## Test the App

### Employee Flow
1. Login with `employee@example.com`
2. Go to **Book Lunch**
3. Select dates for next week (before 6pm cutoff)
4. Pick protein preferences
5. Submit booking
6. See bookings in **My Bookings**
7. Copy/share QR code from **My QR Code** tab

### Facilities Flow
1. Login with `facilities@example.com`
2. Go to **Bookings** → see employee bookings
3. Go to **Menu Manager** → add menu for tomorrow
4. Go to **Scan Log** → empty (no scans yet)

### Provider Flow
1. Login with `provider@example.com`
2. Scan QR code with camera OR
3. Type employee email in fallback field
4. See "Lunch Requested - [Protein]"
5. Scan shows up in Facilities → **Scan Log**

## Deploy to GitHub

```bash
# Initialize git (if not already)
git init
git add .
git commit -m "Initial commit: lunch booking app"

# Add remote (create empty repo on GitHub first)
git remote add origin https://github.com/yourusername/lunch-booking.git
git branch -M main
git push -u origin main
```

## Deploy to Netlify

```bash
npm run build
```

Then drag `dist/` folder into Netlify, or connect GitHub for auto-deploy.

Set environment variables in Netlify:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## Troubleshooting

### "VITE_SUPABASE_URL is not defined"
- Check `.env.local` has correct keys
- Restart dev server: `npm run dev`

### "Table does not exist"
- Run SQL script again in Supabase SQL Editor
- Check for syntax errors

### QR Camera Not Working
- Allow camera permissions in browser
- Use HTTPS (localhost works in dev)
- Use fallback email entry

### Can't Login
- Verify user exists in **Authentication → Users**
- Check user is linked in `users` table with correct role
- Check role value is exactly: 'employee', 'facilities', or 'provider'

---

Questions? Check README.md for full documentation.

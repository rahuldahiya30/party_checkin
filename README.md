# Party Check-In System — Full Build & Deployment Guide

A QR code guest check-in system built for 200-person events. Guests receive a unique QR code ticket; a door attendant scans it on their phone to mark attendance instantly.

**Live URLs**
- Frontend: `https://partycheckin.netlify.app`
- Backend API: `https://party-checkin.vercel.app`

---

## What It Does

| Feature | Description |
|---------|-------------|
| Guest management | Add guests one-by-one or bulk import via CSV |
| QR ticket generation | Each guest gets a unique UUID-based QR code |
| QR download | Download ticket as PNG image (named `Firstname_ticket.png`) |
| Door scanner | Phone camera scans QR codes and marks attendance |
| Real-time stats | Live count of checked-in vs pending guests |
| Duplicate prevention | Same ticket cannot check in twice (atomic DB update) |
| Admin login | Username: `admin` / Password: `admin` |
| Delete guests | Remove guests from the list with confirmation |

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend framework | React 18 + Vite 5 | UI and build tool |
| Routing | React Router 6 | Multi-page navigation |
| Animations | Framer Motion 11 | Page transitions, micro-animations |
| Styling | Tailwind CSS 3 | Utility-first styling |
| QR scanning | html5-qrcode | Camera-based QR reader |
| QR generation | qrcode (npm) | Generates QR code canvas |
| Confetti | canvas-confetti | Success animation on check-in |
| Backend | Node.js serverless functions | API layer (Vercel format) |
| Database | Supabase (PostgreSQL) | Guest data + check-in state |
| Frontend hosting | Netlify | Serves the React app |
| Backend hosting | Vercel | Runs the serverless API functions |

---

## Project Structure

```
Testing/
├── frontend-react/          ← React app (deployed to Netlify)
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Home.jsx     ← Landing page with bento layout
│   │   │   ├── Admin.jsx    ← Guest management dashboard
│   │   │   ├── Scanner.jsx  ← QR code scanner
│   │   │   └── Login.jsx    ← Admin login gate
│   │   ├── components/
│   │   │   ├── Navbar.jsx   ← Shared navigation bar
│   │   │   ├── QRModal.jsx  ← QR code view + download modal
│   │   │   └── Toast.jsx    ← Toast notification component
│   │   └── utils/
│   │       ├── api.js       ← All fetch calls to the backend
│   │       ├── auth.js      ← localStorage-based login state
│   │       └── avatar.js    ← Guest initials + avatar colour
│   ├── netlify.toml         ← Netlify build config + redirect rules
│   ├── tailwind.config.js   ← Custom brand colours
│   └── vite.config.js       ← Vite build config
│
├── backend/                 ← Serverless API (deployed to Vercel)
│   ├── api/
│   │   ├── guests.js        ← GET / POST / DELETE guests
│   │   ├── scan.js          ← POST scan ticket (atomic check-in)
│   │   └── import.js        ← POST bulk import from CSV
│   └── lib/
│       └── supabase.js      ← Supabase client initialisation
│
└── database/
    └── setup.sql            ← Run once in Supabase SQL editor
```

---

## Environment Variables

### Vercel (backend)
| Variable | Value | Where to find |
|----------|-------|--------------|
| `SUPABASE_URL` | `https://xxxxxx.supabase.co` | Supabase → Settings → API → Project URL |
| `SUPABASE_SERVICE_KEY` | `eyJ...` (long key) | Supabase → Settings → API → Legacy tab → service_role key |

### Netlify (frontend)
| Variable | Value | Notes |
|----------|-------|-------|
| `VITE_API_URL` | `https://party-checkin.vercel.app` | Your Vercel project domain (no trailing slash) |
| `VITE_EVENT_NAME` | `My Party` | Shown in the app header |

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/guests` | List all guests |
| POST | `/api/guests` | Add a single guest `{ name, phone }` |
| DELETE | `/api/guests?id=uuid` | Delete a guest by ID |
| POST | `/api/import` | Bulk import `{ guests: [{name, phone}] }` |
| POST | `/api/scan` | Scan ticket `{ ticket_id: "uuid" }` |

**Scan response types:**
- `{ success: true, guest: {...} }` → valid, first scan
- `{ success: false, error: "already_checked_in", message: "..." }` → duplicate
- `{ success: false, error: "not_found" }` → invalid QR

---

## Step-by-Step: How to Rebuild From Scratch

### Step 1 — Set up Supabase (database)

1. Go to [supabase.com](https://supabase.com) → create a free account
2. Click **New Project** → name it, set a password, choose a region → **Create project** (takes ~1 min)
3. Once ready, go to **SQL Editor** (left sidebar) → **New Query**
4. Paste the entire contents of `database/setup.sql` → click **Run**
5. You should see `COUNT: 0` — the `guests` table is now created
6. Go to **Project Settings** → **API** → click **"Legacy anon, service_role API keys"** tab
7. Save these two values (you need them for Vercel):
   - **Project URL**: `https://xxxxxx.supabase.co`
   - **service_role key**: the long `eyJ...` secret key (NOT the anon key)

> **Important:** Always use the `service_role` key on the backend. It bypasses Row Level Security (RLS) which is required for the serverless functions to read and write data.

---

### Step 2 — Push code to GitHub

1. Create a new repository on [github.com](https://github.com) (leave README/gitignore unchecked)
2. Copy the repo URL (e.g. `https://github.com/username/party-checkin.git`)
3. Run these commands in your project root:

```bash
git init
git add .
git commit -m "feat: party check-in app"
git branch -M main
git remote add origin https://github.com/username/party-checkin.git
git push -u origin main
```

4. Authenticate via browser popup when prompted

---

### Step 3 — Deploy backend to Vercel

1. Go to [vercel.com](https://vercel.com) → sign up with GitHub
2. Click **Add New → Project** → import your GitHub repo
3. Set **Root Directory** to `backend`
4. Expand **Environment Variables** and add:
   - Key: `SUPABASE_URL` → Value: your Supabase Project URL
   - Key: `SUPABASE_SERVICE_KEY` → Value: your service_role key
5. Click **Deploy**
6. Once deployed, go to the project overview and copy the **Domains** URL (e.g. `https://party-checkin.vercel.app`) — this is your `VITE_API_URL` for Netlify

> **Common mistake:** Do not paste the Vercel dashboard URL (`vercel.com/...`) as `SUPABASE_URL`. The Supabase URL must be the `.supabase.co` domain.

---

### Step 4 — Deploy frontend to Netlify

1. Go to [netlify.com](https://netlify.com) → sign up with GitHub
2. Click **Add new site → Import an existing project → GitHub**
3. Select your repo
4. Set build settings:
   - **Base directory**: `frontend-react`
   - **Build command**: `npm install && node ./node_modules/vite/bin/vite.js build`
   - **Publish directory**: `frontend-react/dist`
5. Add environment variables:
   - Key: `VITE_API_URL` → Value: your Vercel URL (e.g. `https://party-checkin.vercel.app`)
   - Key: `VITE_EVENT_NAME` → Value: your event name (e.g. `My Party`)
6. Click **Deploy site**

> **Note:** The build command uses `node ./node_modules/vite/bin/vite.js build` instead of `npm run build` to bypass a Linux file permission issue with the vite binary on Netlify.

> **Note:** Environment variable changes in Netlify require a new deploy to take effect. Always trigger a redeploy after updating env vars.

---

### Step 5 — Verify everything works

1. Open your Netlify URL → home page should load with gradient background
2. Click **Admin** → should redirect to login page
3. Log in with `admin` / `admin` → Admin dashboard loads
4. Add a test guest → stats should update and guest appears in the list
5. Click **View QR** on the guest → QR code modal appears
6. Open **Scanner** on a phone → tap **Start Camera** → scan the QR code
7. Green screen = success ✓

---

## How to Use on Party Day

### Before the party (Admin setup)
1. Open `partycheckin.netlify.app/admin` on your computer
2. Add guests one-by-one using the form, OR import a CSV file:
   ```csv
   name,phone
   Priya Sharma,+919876543210
   Rohan Mehta,+919876543211
   Ananya Patel,
   ```
3. For each guest, click the QR icon → **Download** → save the PNG
4. Send the PNG to the guest via WhatsApp

### At the door (check-in)
1. Open `partycheckin.netlify.app/scanner` on your phone (Chrome on Android works best)
2. Tap **Start Camera** → allow camera permission once
3. Point at a guest's QR ticket
4. Result overlay appears:
   - **Green** → First scan, guest marked present → tap **Scan Next →**
   - **Orange** → Already checked in earlier
   - **Red** → Invalid or fake ticket
5. Camera stays active between scans — no reload or re-permission needed

---

## Database Schema

```sql
CREATE TABLE guests (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id     UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
  name          VARCHAR(255) NOT NULL,
  phone         VARCHAR(30),
  checked_in    BOOLEAN DEFAULT FALSE,
  checked_in_at TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
```

- `id` — internal record ID
- `ticket_id` — the UUID encoded in the QR code (different from `id` for security)
- `checked_in` — toggled to `true` atomically on first scan
- `checked_in_at` — timestamp of when they scanned in

The check-in uses an atomic `UPDATE WHERE checked_in = false` query to prevent race conditions if two scanners scan the same ticket simultaneously.

---

## Key Design Decisions

| Decision | Reason |
|----------|--------|
| Separate `ticket_id` from `id` | Prevents guests from guessing other guest IDs |
| Atomic UPDATE for check-in | Prevents double check-in under concurrent scans |
| service_role key on backend only | Never exposed to browser; anon key would be blocked by RLS |
| localStorage for admin auth | No server session needed for a single-admin app |
| `pause(false)` not `pause(true)` | Keeps camera stream alive so no re-permission needed between scans |
| `requestAnimationFrame` before Html5Qrcode init | AnimatePresence defers DOM mount; polling ensures element exists |
| Fixed gradient in App.jsx | Single background shared across all pages via `-z-10 fixed` div |

---

## Platforms Summary

| Platform | Free Tier | Used For |
|----------|-----------|---------|
| [GitHub](https://github.com) | Unlimited public repos | Source code hosting + auto-deploy trigger |
| [Vercel](https://vercel.com) | 100GB bandwidth/mo | Serverless API functions (Node.js) |
| [Netlify](https://netlify.com) | 100GB bandwidth/mo | React frontend static hosting |
| [Supabase](https://supabase.com) | 500MB database, 2 projects | PostgreSQL database |

All four platforms have free tiers sufficient for a 200-person event with no cost.

---

*Built with ♥ by Rahul Dahiya*

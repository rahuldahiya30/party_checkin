# Party Check-In System

QR code attendance tracker for 200 guests. Scan once per ticket — duplicates are rejected.

---

## Project Structure

```
frontend/    → Deploy to Netlify
backend/     → Deploy to Vercel
database/    → SQL setup for Supabase
```

---

## Step 1 — Supabase (Database)

1. Go to https://supabase.com → create a free account → New Project
2. Wait for the project to be ready (~1 minute)
3. Go to **SQL Editor** → **New Query**
4. Paste the contents of `database/setup.sql` → click **Run**
5. Go to **Project Settings** → **API**
6. Copy these two values — you'll need them in Step 2:
   - `Project URL`  (looks like `https://abcdef.supabase.co`)
   - `service_role` key under **Project API keys** (the secret one, NOT the anon key)

---

## Step 2 — Backend (Vercel)

1. Go to https://vercel.com → create a free account
2. Click **Add New Project** → **Import** your GitHub repo
   - (If no GitHub repo yet: drag-drop the `backend/` folder into Vercel, or use `vercel` CLI)
3. In the project settings → **Environment Variables**, add:
   - `SUPABASE_URL`         → paste your Project URL from Step 1
   - `SUPABASE_SERVICE_KEY` → paste your service_role key from Step 1
4. Deploy. Vercel gives you a URL like `https://your-app.vercel.app`
5. **Copy that URL** — you'll use it in Step 3

---

## Step 3 — Frontend (update API URL)

Open both files and update `API_BASE` at the top:

- `frontend/js/admin.js`   → change `API_BASE` to your Vercel URL
- `frontend/js/scanner.js` → change `API_BASE` to your Vercel URL

Also update `EVENT_NAME` in `frontend/js/admin.js` to your party name.

---

## Step 4 — Frontend (Netlify)

1. Go to https://netlify.com → create a free account
2. Click **Add new site** → **Deploy manually**
3. Drag-drop the `frontend/` folder
4. Netlify gives you a URL like `https://your-site.netlify.app`
5. Share the URLs with your team:
   - **Admin panel**: `https://your-site.netlify.app/admin.html`
   - **Scanner**: `https://your-site.netlify.app/scanner.html`

---

## How to Use

### Adding guests (before the party)
1. Open `admin.html` on your computer
2. Either:
   - Add guests one by one using the form, OR
   - Import a CSV file with columns: `name,phone`
3. After adding a guest, click **View QR** → **Download Ticket Image**
4. Save the PNG and send it via WhatsApp to the guest

### At the party (door check-in)
1. Open `scanner.html` on your Samsung phone (Chrome browser)
2. Tap **Start Camera** — allow camera permission
3. Point the camera at a guest's QR code ticket
4. The screen will show:
   - **Green** → Welcome! Guest marked as present
   - **Orange** → Already checked in (shows when they checked in)
   - **Red** → Invalid ticket

### CSV Import Format

```csv
name,phone
Priya Sharma,+919876543210
Rohan Mehta,+919876543211
Ananya Patel,
```

- `phone` column is optional
- First row must be the header row
- UTF-8 encoding

---

## Tech Stack

| Layer    | Technology                  |
|----------|-----------------------------|
| Frontend | Vanilla HTML/CSS/JS         |
| Scanner  | html5-qrcode (CDN)          |
| QR Gen   | qrcodejs (CDN)              |
| Backend  | Node.js — Vercel Serverless |
| Database | Supabase (PostgreSQL)       |
| Hosting  | Netlify + Vercel (both free)|

---

## API Endpoints

| Method | Path          | Description                     |
|--------|---------------|---------------------------------|
| GET    | /api/guests   | List all guests                 |
| POST   | /api/guests   | Add a single guest              |
| POST   | /api/import   | Bulk import array of guests     |
| POST   | /api/scan     | Validate ticket & mark attended |

### POST /api/scan body
```json
{ "ticket_id": "uuid-here" }
```

### POST /api/guests body
```json
{ "name": "Priya Sharma", "phone": "+919876543210" }
```

### POST /api/import body
```json
{ "guests": [{ "name": "...", "phone": "..." }] }
```

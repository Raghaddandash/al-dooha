# Al Dooha — React + Supabase

Cafe ordering site: menu, cart, order customization, WhatsApp checkout,
and an admin panel backed by a real database (Supabase) so orders and
menu changes are shared with everyone, live.

## 1. Create a Supabase project
1. Go to supabase.com → sign up (free) → "New project".
2. Pick any name/password/region. Wait ~2 minutes while it provisions.

## 2. Create the database tables
1. In your project, open **SQL Editor** → **New query**.
2. Paste the entire contents of `supabase-setup.sql` from this folder.
3. Click **Run**. This creates the tables, security rules, and seeds the menu.

## 3. Get your API keys
1. Go to **Project Settings → API**.
2. Copy the **Project URL** and the **anon public** key.

## 4. Configure the project
1. In this folder, copy `.env.example` to a new file named `.env`.
2. Paste in your URL and anon key:
   ```
   VITE_SUPABASE_URL=https://xxxxxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=xxxxxxxx
   ```

## 5. Create your admin login
1. In Supabase, go to **Authentication → Users → Add user**.
2. Enter an email and password for yourself — this is what you'll use
   to log into `/#admin` on the site.

## 6. Run it locally
```
npm install
npm run dev
```
Open the printed localhost link. Add `#admin` to the URL to reach the
admin login (e.g. `http://localhost:5173/#admin`).

## 7. Deploy for free
1. Push this folder to a GitHub repo.
2. Go to vercel.com → New Project → import the repo.
3. Under **Environment Variables**, add the same two keys from your `.env`.
4. Deploy. Your site gets a free `.vercel.app` link.
5. To reach admin on the live site: `https://your-site.vercel.app/#admin`.

## How orders work
- A customer's order is saved to the `orders` table AND opens WhatsApp
  with a message summary, so you get both a record and an instant ping.
- The admin Orders tab updates live (no refresh needed) using Supabase
  realtime, and lets you mark orders as `new` / `preparing` / `done`.

## Notes
- Change the WhatsApp number in `src/MenuPage.jsx` (the `PHONE` constant).
- Menu items, prices, and translations are edited from the Admin → Menu
  tab, or directly in the `menu_items` table in Supabase.

<p align="center">
  <img src="client/public/logo_transperent.png" width="120" />
</p>

<h1 align="center">Aseelfemme</h1>

<p align="center">
  Organic handcrafted soap — marketing site + admin panel.<br/>
  Built for my sister's small business as a side project.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/-React-61DAFB?style=flat-square&logo=react&logoColor=black" />
  <img src="https://img.shields.io/badge/-Vite-646CFF?style=flat-square&logo=vite&logoColor=white" />
  <img src="https://img.shields.io/badge/-Supabase-3FCF8E?style=flat-square&logo=supabase&logoColor=white" />
  <img src="https://img.shields.io/badge/-Tailwind-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white" />
</p>

---

## What it is

A marketing website and admin dashboard for **Aseelfemme**, an organic handcrafted soap brand. The public site showcases products with a clean, elegant design. The admin panel lets my sister manage products, ingredients, categories, and content — all backed by Supabase.

**Features:**
- Product catalog with detail pages
- Ingredient transparency pages
- Admin panel with full CRUD (products, ingredients, categories)
- Multilingual — English, Arabic (RTL), German
- Image storage via Supabase Storage
- Contact form via EmailJS
- Cookie consent management
- SEO with react-helmet-async

## Structure

```
client/              # Vite + React app (public site + admin)
  src/
    pages/           # Public pages + admin pages
    components/      # Shared UI components
    lib/             # Supabase client, i18n, API helpers
  public/            # Static assets, logos
data/                # Seed data (JSON) for products, ingredients, categories
supabase/
  migrations/        # SQL migrations (schema, RLS, storage, seed)
```

## Setup

### 1. Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Run the migrations in order in the SQL Editor:
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_row_level_security.sql`
   - `supabase/migrations/003_storage_bucket.sql`
   - `supabase/migrations/004_seed_data.sql` (optional)
3. Create an admin user in Authentication → Users

### 2. Environment

```bash
cp client/.env.local.example client/.env
```

Fill in your Supabase URL and anon key (Settings → API).

### 3. Run

```bash
cd client
npm install
npm run dev
```

Visit `http://localhost:5173`. Admin at `/admin/login`.

## Tech

- **Frontend:** React, Vite, Tailwind CSS, Framer Motion
- **Backend:** Supabase (PostgreSQL, Auth, Storage)
- **i18n:** English, Arabic (RTL), German
- **SEO:** react-helmet-async
- **Contact:** EmailJS
- **Deploy:** Netlify / Docker (nginx config included)

## License

MIT

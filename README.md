# EL-Gaafar Store — متجر الجعفر

A bilingual **English / Arabic** e-commerce storefront for a plumbing and sanitary supply shop.  
Built with React 19 + Vite 8, backed entirely by **Supabase** (PostgreSQL, Auth, Storage).

---

## Tech Stack

| Layer | Technology |
|---|---|
| UI | React 19 (JSX, hooks, context) |
| Build | Vite 8 |
| Backend / DB | Supabase (BaaS) |
| Styling | Vanilla CSS with custom design system |
| i18n | Custom `LocalizationProvider` (EN / AR, RTL) |
| Auth | Supabase email + password, role-based via `profiles` table |

---

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/Abood207040/EL-Gaafar-Store.git
cd EL-Gaafar-Store
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

```bash
cp .env.example .env
```

Open `.env` and fill in your Supabase project values:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

> Find these in **Supabase → Project Settings → API**.

### 4. Start the dev server

```bash
npm run dev
```

Visit `http://localhost:5173` (or the port shown in terminal).

---

## Available Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start Vite dev server with HMR |
| `npm run build` | Build for production (outputs to `dist/`) |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint across the codebase |

---

## Supabase Setup

The app reads from and writes to the following Supabase tables.  
Create them in your project via the Supabase Table Editor or SQL Editor.

### Tables

| Table | Key Columns |
|---|---|
| `profiles` | `id` (FK → `auth.users`), `role` (`'admin'` or other) |
| `categories` | `id`, `name_en`, `name_ar`, `slug`, `is_active` |
| `brands` | `id`, `name_en`, `name_ar`, `slug`, `is_active` |
| `products` | `id`, `category_id`, `name_en`, `name_ar`, `sku`, `brand`, `price`, `stock`, `stock_status`, `image_url`, `description_en`, `description_ar`, `size`, `material`, `usage`, `color`, `pressure_rating`, `warranty`, `is_active`, `is_featured` |
| `customers` | `id`, `full_name`, `phone`, `email`, `city`, `area`, `address` |
| `orders` | `id`, `customer_id`, `order_number`, `customer_name`, `customer_phone`, `customer_email`, `fulfillment_type`, `status`, `city`, `area`, `street_address`, `notes`, `subtotal`, `logistics_fee`, `tax`, `total`, `payment_method` |
| `order_items` | `id`, `order_id`, `product_id`, `product_name`, `sku`, `qty`, `unit_price`, `line_total` |

### Storage

Create a public bucket named **`product-images`** in Supabase Storage.  
Grant authenticated admin users upload access via an RLS policy.

### Admin Access

1. Create a user via Supabase Auth (email + password).
2. Insert a row in `profiles` with `id` = that user's UUID and `role = 'admin'`.
3. Sign in at the Admin Panel (`/` → click **Admin Panel** in the navbar).

---

## Project Structure

```
src/
├── App.jsx               Central router (state-based) + cart logic + admin guard
├── main.jsx              App bootstrap — mounts providers
├── components/
│   ├── layout/           Navbar, Footer, AdminLayout
│   ├── admin/            AdminHeader, AdminSidebar
│   ├── products/         ProductCard
│   └── ui/               Badge, Button, Card, Input, Select, StatusBadge…
├── pages/
│   ├── ShopPage.jsx
│   ├── ProductDetailsPage.jsx
│   ├── CartPage.jsx
│   ├── CheckoutPage.jsx
│   ├── OrderSuccessPage.jsx
│   ├── MyOrdersPage.jsx
│   ├── OrderDetailsPage.jsx
│   └── admin/            Dashboard, Products, ProductForm, Catalog, Orders,
│                         Inventory, Customers, Login, AccessDenied
├── services/
│   ├── authService.js    Supabase client + Auth wrappers
│   ├── productsService.js
│   ├── ordersService.js
│   ├── adminOrdersService.js
│   ├── adminCustomersService.js
│   ├── storageService.js
│   └── orderUtils.js     Shared helpers (baseOrderSelect, withAdminRlsError)
├── hooks/
│   ├── useAuth.jsx       Auth context — session, user, isAdmin, sign in/out
│   └── useCatalogOptions.js  Categories & brands — fetch + CRUD
├── i18n/
│   └── Localization.jsx  Full EN / AR translation context + RTL toggling
├── constants/
│   ├── domain.js         ORDER_STATUSES, STOCK_STATUSES, FULFILLMENT, PAYMENT_METHODS
│   └── store.js          STORE_INFO (name, address, phone, WhatsApp)
└── styles/
    └── globals.css       CSS design system (variables, layout, utilities)
```

---

## Features

### Customer Storefront
- Browse products with search, category/brand filters, price range, availability filters, and sorting
- Product detail page with specs, description, related products
- Add to cart (persisted in `localStorage`)
- Multi-step checkout: customer info → delivery / pickup → Cash on Delivery confirmation
- Order tracking by phone or email

### Admin Panel
- **Dashboard** — sales overview, pending orders, low-stock alerts
- **Products** — full CRUD with image upload to Supabase Storage
- **Catalog** — manage product categories and brands
- **Orders** — list all orders, update status
- **Inventory** — stock levels and restock alerts
- **Customers** — customer list with order history and stats
- Seamless switch between Admin Panel ↔ Customer Storefront without re-login

---

## License

Private — all rights reserved.

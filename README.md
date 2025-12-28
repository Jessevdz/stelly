# Stelly (Bestel Hier!)

**The White-Label, Multi-Tenant Food Ordering Platform.**

> **Vision:** "Your brand, your platform, your profits."
> Stelly is a high-performance Micro-SaaS designed to give independent hospitality businesses digital sovereignty. It bridges the gap between expensive custom agency development and generic SaaS templates by providing a specialized, schema-isolated ordering system with a unified codebase.

---

## 🚀 Key Features

### 🏢 Architecture & Multi-Tenancy

* **Schema-per-Tenant Isolation:** Data privacy is enforced at the database level. Every restaurant gets its own PostgreSQL schema (`tenant_pizza`, `tenant_burger`, etc.), preventing data leaks and simplifying GDPR compliance.
* **Dynamic Routing:** The application middleware resolves the Tenant Context based on the `Host` header (e.g., `pizza.localhost` vs `burger.localhost`).
* **Ephemeral Demo Engine:** A specialized logic flow allows users to generate instant, temporary "Sandbox" environments (`demo_xyz`) to test the platform without registration.

### 🏪 Storefront

* **"Chameleon" Theme Engine:** A sophisticated design system where fonts, colors, border radii, and layout density morph to match the brand vibe (`Mono Luxe`, `Fresh Market`, `Tech Ocean`) dynamically.
* **Frictionless Cart:** A persistent cart drawer and floating action button designed for high-conversion mobile use.
* **No-Login Checkout:** Optimized for guest checkout to reduce abandonment.

### 👨‍🍳 Kitchen Display System (KDS)

* **Real-Time Sync:** WebSockets push orders immediately from the Storefront to the Kitchen.
* **Lane Management:** Drag-and-drop style workflow (Pending → Queued → Preparing → Ready).
* **Wake Lock & Audio:** Optimized for always-on tablet devices in hot, noisy kitchens.

### ⚙️ Admin & Management

* **Menu Builder:** CRUD operations for Categories, Items, and Modifier Groups (e.g., "Extra Cheese").
* **Live Preview:** Mobile-view preview within the admin panel to see changes in real-time.

---

## 🛠 Tech Stack

### Backend (`apps/api`)

* **Framework:** Python / FastAPI
* **Database:** PostgreSQL (with SQLAlchemy & Alembic)
* **Caching/Rate Limiting:** Redis
* **Storage:** MinIO (S3 Compatible)
* **Security:** Local JWT implementation with "Magic Token" support for demo sessions.

### Frontend (`apps/web`)

* **Framework:** React 19 / Vite
* **Styling:** Tailwind CSS 4.0
* **State:** Context API (Auth, Cart)
* **Icons:** Lucide React

### Infrastructure (`infra`)

* **Reverse Proxy:** Nginx (Handles routing between API and Web based on subdomains).
* **Containerization:** Docker & Docker Compose.

---

## ⚡️ Getting Started

### Prerequisites

* Docker & Docker Compose
* Node.js (optional, for local frontend dev outside Docker)

### 1. Local DNS Setup

To simulate multi-tenancy locally, add the following to your hosts file (`/etc/hosts` on macOS/Linux or `C:\Windows\System32\drivers\etc\hosts` on Windows):

```text
127.0.0.1   stelly.localhost
127.0.0.1   demo.stelly.localhost
127.0.0.1   admin.stelly.localhost
127.0.0.1   pizza.localhost
127.0.0.1   burger.localhost

```

### 2. Launch the Stack

Run the entire platform with Docker Compose:

```bash
docker-compose up --build

```

* **Database Init:** The `api` container will wait for Postgres, run migrations, and seed initial tenants (`Pizza Hut`, `Burger King`) and the Demo environment automatically via `prestart.sh`.
* **MinIO Init:** The S3 bucket `stelly-assets` is automatically provisioned.

### 3. Access the Platform

| Service | URL | Context |
| --- | --- | --- |
| **Landing Page** | `http://stelly.localhost` | The marketing homepage. |
| **Interactive Demo** | `http://demo.stelly.localhost` | The "Split View" experience (Store + KDS). |
| **Pizza Tenant** | `http://pizza.localhost` | A seeded tenant example. |
| **Burger Tenant** | `http://burger.localhost` | A seeded tenant example. |
| **API Docs** | `http://api.stelly.localhost/docs` | Swagger UI (mapped via Nginx). |
| **MinIO Console** | `http://localhost:9001` | Object storage admin (User/Pass: `minioadmin`). |

---

## 🧪 The "Split View" Demo

The project includes a unique **Split View** designed to demonstrate the real-time capabilities of the platform during sales calls or portfolio reviews.

1. Navigate to **`http://demo.stelly.localhost`**.
2. Click **"Start Demo"**. This generates a temporary, unique schema (`demo_<uuid>`) in the database.
3. You will land on the **Split View**:
* **Left Side:** The Customer Storefront.
* **Right Side:** The Kitchen Display System (KDS).


4. **Action:** Place an order on the left. Watch it appear instantly on the right via WebSockets.
5. **Theming:** Use the floating "Vibe" button to instantly swap the entire UI branding between presets.

---

## 📂 Project Structure

```plaintext
.
├── apps
│   ├── api                 # FastAPI Backend
│   │   ├── app
│   │   │   ├── api         # Endpoints (v1)
│   │   │   ├── core        # Config, Security, Middleware
│   │   │   ├── db          # Models & Session
│   │   │   └── schemas     # Pydantic Models
│   │   └── alembic         # DB Migrations
│   └── web                 # React Frontend
│       ├── src
│       │   ├── components  # Reusable UI & Business Logic
│       │   ├── context     # Global State
│       │   ├── layouts     # Layout wrappers (Store, Tenant, Demo)
│       │   ├── pages       # Route Views
│       │   └── utils       # Helpers (Theming, Analytics)
├── infra                   # Infrastructure Configs
│   ├── nginx               # Reverse Proxy Configuration
│   └── postgres            # Init SQL scripts
└── docker-compose.yml      # Orchestration

```

---

## 🛡 Security & Design Decisions

1. **Context Middleware (`TenantMiddleware`):**
The API intercepts every request, reads the `Host` header, looks up the tenant in the `public.tenants` table, and sets the PostgreSQL `search_path` to that tenant's schema. This ensures strict data isolation at runtime.
2. **NullPool Database Connections:**
SQLAlchemy is configured with `NullPool` to prevent connection bleeding between requests. Each request creates a fresh connection context to guarantee the correct schema is active.
3. **Authentication:**
* **Standard:** OAuth2 flow (ready for integration with Authentik/Keycloak).
* **Demo Mode:** Uses custom "Magic Tokens" (HS256) containing a specific `target_schema` claim, allowing the API to route requests to ephemeral demo schemas without permanent user records.
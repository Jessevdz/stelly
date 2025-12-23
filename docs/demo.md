# The Omni-View Demo Experience

## 1. Overview

The **Omni-View Demo** is a specialized architectural mode designed to demonstrate the full capabilities of the OmniOrder platform in a single, frictionless session. 

Instead of requiring users to log in as different users (Customer, Manager, Kitchen Staff) across different subdomains, the Demo Mode creates a **Unified Shell** that renders these contexts side-by-side or allows instant toggling between them.

**Access URL:** `http://demo.omniorder.localhost/demo/split`

---

## 2. Key Features

### A. The "Magic" Authentication
The demo environment bypasses the standard Authentik SSO flow. 
* **Mechanism:** When the frontend loads, it requests a "Magic Token" from `POST /api/v1/sys/demo-login` using a hardcoded internal access code (`OMNI2025`).
* **Result:** The user is instantly logged in as `demo_admin`, granting full access to the backend without credential entry.

### B. Split-Screen View
The centerpiece of the demo is the **Split View**.
* **Left Pane:** Renders the **Public Storefront** (Mobile Context).
* **Right Pane:** Renders the **Kitchen Display System** (Tablet Context).
* **Interaction:** Placing an order on the left immediately triggers a WebSocket event on the right, providing instant visual confirmation of the real-time architecture.

### C. Live Theme Injection
A floating **Paintbrush Widget** allows users to hot-swap the tenant's branding configuration.
* **Function:** Sends a `PUT` request to update `tenant_demo` settings and instantly re-applies CSS tokens (`--color-primary`, `--radius-lg`, etc.).
* **Presets:**
    * **Mono Luxe:** High-end steakhouse vibe (Black/White, Sharp corners).
    * **Fresh Market:** Salad bar vibe (Green/Orange, Round corners).
    * **Tech Ocean:** Ghost kitchen vibe (Dark Mode, Blue accents).

### D. The Reset Switch
A **Reset Button** (Rotate Icon) in the bottom navigation bar restores the environment to its initial state:
1. Truncates the `orders` table for the demo tenant.
2. Resets the Theme Config to "Mono Luxe".
3. Resets the Onboarding Tour state.

---

## 3. How to Use the Demo

### Prerequisites
Ensure your local environment is running and `demo.omniorder.localhost` points to `127.0.0.1`.

### The Narrative Flow

1. **Enter the Shell:** Navigate to `http://demo.omniorder.localhost/demo/split`.
2. **The Tour:** A "Glass Modal" overlay will guide you.
    * *Step 1:* Highlights the Storefront (Customer View).
    * *Step 2:* Highlights the KDS (Kitchen View).
3. **Place an Order:**
    * Use the **"Quick Add"** banner on the menu to instantly add a full meal bundle.
    * Open the Cart Drawer and click "Confirm Order".
4. **Watch the Reaction:**
    * Observe the KDS on the right immediately display the new ticket with a "Ding" sound.
5. **Change the Vibe:**
    * Click the **Paintbrush** icon in the top right.
    * Select **"Fresh Market"**.
    * Observe how fonts, colors, and border radii change instantly without a page reload.

---

## 4. Technical Architecture

### Backend Overrides (`TenantMiddleware`)
Usually, the API resolves the tenant based on the subdomain (e.g., `pizza` -> `tenant_pizzahut`). 
In Demo Mode, if the host is `demo.omniorder.localhost`, the middleware **forces** the database search path to `tenant_demo`, regardless of other contexts.

### Frontend Shell (`DemoLayout`)
The `DemoLayout` wrapper handles the persistence of the session. It includes the `PersonaSwitcher` component, which uses React Router to swap views (`/demo/store`, `/demo/kitchen`, `/demo/admin`) while keeping the layout state (like the Magic Token) alive.

### Data Seeding
The demo tenant relies on specific seed data found in `apps/api/app/core/seed_internal.py`. This includes high-fidelity images and descriptions specifically chosen to look good across all three theme presets.
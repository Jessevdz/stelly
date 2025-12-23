# OmniOrder Demo Implementation Master Plan

This document outlines the strategic implementation plan to transform the multi-tenant SaaS architecture into a cohesive, narrative-driven sales demonstration accessible via a single URL.

## 1. Vision & Goal

**The "Omni-View" Experience.**

The objective is to collapse the fragmented multi-tenant experience (separate subdomains, separate logins, separate devices) into a **Unified Demo Shell**. This shell enables a frictionless sales narrative by allowing the user to toggle between personas instantly or view them side-by-side.

**The Narrative Bridge:**
A demo without a narrative is just a sandbox. Upon entering the demo, users will be greeted by a **"Glass Modal" Welcome Screen** that orients them within the application. It creates a guided story arc:

1. **The Trigger:** "You are the Customer" (Place an Order).
2. **The Reaction:** "You are the Kitchen" (See the Order).
3. **The Control:** "You are the Manager" (Change the Brand).

---

## 2. Architecture Strategy: "The Single Tenant Override"

We will implement a **Default Fallback Strategy** to bypass subdomain routing and standard authentication.

1. **The Demo Tenant:** Provision a single, permanent schema (`tenant_demo`) with rich seed data.
2. **Middleware Bypass:** Modify `TenantMiddleware` to detect the generic demo domain (e.g., `demo.omniorder.com`) and force the context to `tenant_demo`.
3. **Auth Bypass:** Implement a "Magic Token" flow to bypass OIDC/SSO restrictions.

---

## 3. Work Inventory & Phased Execution

### Phase 1: Backend Adaptation (The "Demo Mode")

*Objective: Make the API permissive enough to handle the demo without breaking production security.*

* **A. Tenant Middleware Refactor:**
* Update logic to detect `settings.DEMO_DOMAIN`.
* If detected, force database `search_path` to `tenant_demo` regardless of the subdomain.


* **B. "Magic Login" Endpoint:**
* Create route `POST /api/v1/sys/demo-login`.
* Accepts a simple access code (e.g., "OMNI2025").
* Returns a valid JWT for the pre-seeded `demo_admin` user, bypassing Authentik.


* **C. The Reset Switch:**
* Create route `POST /api/v1/sys/reset-demo`.
* Logic: Truncates `orders` table in `tenant_demo`, resets menu items to default state, and resets Theme Config to "Mono Luxe".



### Phase 2: Frontend "Omni-Shell"

*Objective: Build the navigation hub that contains the different apps (Store, KDS, Admin).*

* **A. The `DemoLayout` Wrapper:**
* Create a master layout that wraps the entire application logic.
* Include a **Persona Switcher** (global floating nav) to switch routes without reloading.


* **B. Split-Screen Layout (The "Aha!" Moment):**
* Create a specific page view rendering the **Storefront** (mobile width) on the left and the **KDS** on the right.
* **Spotlight Support:** Ensure these panes accept `isDimmed` or `isHighlighted` props to support the onboarding tour in Phase 3.


* **C. Theme Toggler Widget:**
* Inject a floating widget in the Storefront view.
* Buttons: "Fine Dining Mode", "Burger Joint Mode".
* Action: Rapid `PUT` to settings + CSS variable hot-reload.



### Phase 3: The Narrative Layer (Welcome & Onboarding)

*Objective: Implement the "Glass Modal" tour to guide the user through the story.*

* **A. `WelcomeOverlay` Component:**
* Develop a multi-step modal with a heavy blur backdrop (`backdrop-blur-xl`).
* **Step 0 (Hook):** Welcome message & "Start Tour" CTA.
* **Step 1 (Customer):** Visual spotlight on the Left Pane (Store). Copy explains the branding engine.
* **Step 2 (Kitchen):** Visual spotlight on the Right Pane (KDS). Copy explains real-time WebSockets.
* **Step 3 (Mission):** Center screen. Instructions to place an order and watch the reaction.


* **B. Spotlight Logic:**
* Implement CSS/State logic in `DemoLayout` to dim specific sections based on the current step of the `WelcomeOverlay`.


* **C. State Persistence:**
* Use `sessionStorage` to ensure the tour runs once per session, but re-runs if the user clicks "Reset Demo".



### Phase 4: User Journey Polish

*Objective: Remove friction from the interactive flows.*

* **A. Ordering Friction:**
* Add a "Quick Add" button to the menu (adds Burger + Fries + Shake instantly).
* Ensure checkout requires no credit card or complex validation.


* **B. Admin Friction:**
* Ensure "Live Preview" in Menu Builder is synced.
* Add "Read-Only Guards" to prevent the user from deleting essential data (like the last category).



### Phase 5: Data Seeding & Content

*Objective: High-fidelity content to sell the "Agency Quality" promise.*

* **A. Assets:**
* Source high-res, appetizing food photography.
* Write compelling, descriptive menu copy.


* **B. Seed Script:**
* Update `seed_internal.py` to include a specific `tenant_demo` configuration richer than standard dev seeds.


---

## 4. Execution Checklist

**Week 1: Core Logic & Backend**

1. [ ] Create `tenant_demo` schema via enhanced seed script.
2. [ ] Update `TenantMiddleware` for single-domain override.
3. [ ] Implement `POST /demo-login` (Magic Token).
4. [ ] Implement `POST /reset-demo` (Database cleaner).

**Week 2: Frontend Shell & Onboarding**

5. [ ] Build `DemoLayout` with Persona Switcher.
6. [ ] Build "Split View" page with `isDimmed` prop support.
7. [ ] Build `WelcomeOverlay` wizard component.
8. [ ] Implement Spotlight/Highlight logic between Overlay and Layout.
9. [ ] Implement Floating Theme Switcher.

**Week 3: Content & Polish**

10. [ ] Source and upload high-res food images.
11. [ ] Connect "Reset" button to both API and Onboarding state reset.
12. [ ] Refine KDS sound alerts for Split View context.
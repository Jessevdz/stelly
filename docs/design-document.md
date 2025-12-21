# Design Specification

## 1. Executive Overview

This document outlines the UI architecture for OmniOrder. The system is designed to be tenant-agnostic. The layout focuses on high-efficiency order processing, featuring a split-view interface: a **Menu Catalog** (left) for browsing items and an **Order Management Panel** (right) for processing incoming tickets.

## 2. Layout & Grid Architecture

The interface uses a fluid container with a fixed top navigation bar.

* **Grid System:** 12-column fluid grid.
* **Split Ratio:**
* **Catalog Area (Left):** 65% width (Columns 1-8).
* **Order Panel (Right):** 35% width (Columns 9-12).


* **Responsiveness:**
* **Desktop:** Split view (as shown in reference).
* **Tablet:** Split view with condensed padding, or collapsible right panel.
* **Mobile:** Stacked view. Navigation converts to hamburger menu; Order Panel becomes a slide-up bottom sheet or toggleable overlay.



---

## 3. Structural Components (The Skeleton)

These components are structurally defined but visually undefined until a theme is applied.

### A. Global Navigation (Top Bar)

* **Container:** Full width, fixed height (approx. 80px).
* **Elements:**
1. **Brand Area:** Left-aligned. Contains `Brand Logo` and `Brand Name`.
2. **Main Navigation:** Center or Left-aligned (next to logo). Contains pills/links for `Dashboard`, `Menu`, `History`, `Messages`, `Stats`.
3. **Utility Cluster:** Right-aligned. Contains `Notification Bell`, `Settings Gear`, `Logout/Exit`.



### B. Catalog Zone (Left Panel)

* **Header Section:**
* **Greeting:** H1/H2 Typography (e.g., "Welcome, [User]").
* **Date Display:** Subtext.
* **Primary Action:** A prominent CTA button (e.g., "Today's Tasks" or "Create Order").


* **Filter Bar:** Horizontal scrolling list or flex-wrap row of category chips (Signature, Chicken, Beef, etc.).
* **Product Grid:** 3-column grid (desktop).
* **Product Card Component:**
* **Media:** Square or 4:3 aspect ratio image.
* **Content:** Title (H3), Description (truncate after 2 lines), Price (Bold), Rating (Star icons + count).
* **Interaction:** Entire card is clickable to add to order/view details.



### C. Order Management Zone (Right Panel)

* **Task Queue Strip:** A horizontal scrolling strip at the top showing active order tickets (e.g., #206, #207, #208). The active ticket is visually highlighted.
* **Order Meta Header:**
* Order ID (Large Text).
* Timestamp.
* Communication Actions: Button group (Chat icon, Phone icon).


* **Logistics Module:**
* 3-column info row: `Prep Time`, `Address/Table #`, `Customer Info`.


* **Line Item List:** Vertical scrollable list.
* **Row layout:** Thumbnail (left) + Details (middle) + Price/Qty (right).


* **Action Footer:** Sticky to bottom of panel.
* **Secondary Action:** "Print Bill" (Icon + Text).
* **Primary Action:** "Completed Order" (Full width or prominent button).



---

## 4. Theming System (Design Tokens)

To make this white-label, we do not use hardcoded hex codes. We use semantic variable names.

### Color Tokens

* `--color-primary`: Main brand color (Buttons, active states, highlights).
* `--color-primary-contrast`: Text color on top of primary (usually white or black).
* `--color-secondary`: Accent color for tags or secondary buttons.
* `--color-bg-app`: The background of the browser window.
* `--color-bg-surface`: The background of cards, the top bar, and the right panel.
* `--color-text-main`: Headings and primary data.
* `--color-text-muted`: Descriptions, dates, inactive icons.
* `--color-border`: Subtle separation lines.

### Shape & Typography Tokens

* `--radius-sm`: Small elements (checkboxes, tags).
* `--radius-md`: Cards, input fields.
* `--radius-lg`: Large containers, modal windows.
* `--font-heading`: Font family for headers.
* `--font-body`: Font family for reading text.
* `--shadow-depth`: Elevation style (flat, soft drop, or hard outlines).

---

## 5. Theme Specifications

Here are three distinct themes applied to the structure above.

### Theme A: "Mono Luxe" (Minimalistic Black & White)

*Best for: High-end steakhouses, sushi bars, modern bistros.*

* **Visual Style:** Stark, high contrast, flat, sophisticated.
* **Token Mapping:**
* `--color-primary`: **#000000** (Pure Black)
* `--color-primary-contrast`: **#FFFFFF** (White)
* `--color-bg-app`: **#F5F5F5** (Light Grey)
* `--color-bg-surface`: **#FFFFFF** (White)
* `--color-text-main`: **#111111** (Off-Black)
* `--radius-md`: **0px** (Sharp corners everywhere)
* `--shadow-depth`: **None** (Use 1px borders instead: `1px solid #E5E5E5`)


* **Specifics:**
* Top Nav: White background with black text.
* Active Tab: Underlined with a thick black bar (no pill shape).
* Buttons: Solid black rectangles with white text.



### Theme B: "Fresh Market" (Vibrant Green)

*Best for: Salad bars, vegan cafes, juice shops, health food.*

* **Visual Style:** Organic, soft, rounded, friendly.
* **Token Mapping:**
* `--color-primary`: **#4CAF50** (Vibrant Leaf Green)
* `--color-secondary`: **#FF9800** (Orange - for notifications/alerts)
* `--color-bg-app`: **#F1F8E9** (Very pale green tint)
* `--color-bg-surface`: **#FFFFFF** (White)
* `--color-text-main`: **#2E3B2F** (Dark Forest Green)
* `--radius-md`: **16px** (Highly rounded cards)
* `--radius-lg`: **24px** (Pill-shaped buttons)
* `--shadow-depth`: **0px 4px 15px rgba(76, 175, 80, 0.15)** (Soft, colored glow)


* **Specifics:**
* Top Nav: Transparent or white with green icons.
* Active Tab: Filled green pill with rounded edges.
* Buttons: Gradient green to light green.



### Theme C: "Tech Ocean" (Modern Blue)

*Best for: Seafood, corporate catering, fast-casual chains.*

* **Visual Style:** Trustworthy, clean, standard SaaS look, cool tones.
* **Token Mapping:**
* `--color-primary`: **#2563EB** (Royal Blue)
* `--color-bg-app`: **#0F172A** (Dark Navy - *Dark Mode implementation*)
* `--color-bg-surface`: **#1E293B** (Slate Blue/Grey)
* `--color-text-main`: **#F8FAFC** (Off-White)
* `--color-text-muted`: **#94A3B8** (Blue-Grey)
* `--radius-md`: **8px** (Standard rounding)
* `--shadow-depth`: **0px 1px 3px rgba(0,0,0,0.3)** (Subtle depth)


* **Specifics:**
* Top Nav: Dark Navy background (blends with app bg).
* Product Cards: Dark card background with white text.
* Active State: Blue glowing border or inset shadow.

---

## 6. Public Storefront Specification (Customer Facing)

*Context: Accessed via `http://pizza.localhost` or custom domains. This view prioritizes mobile responsiveness, appetite appeal, and friction-free checkout.*

### A. Layout Architecture

* **Container:** Single-column fluid layout (Mobile/Tablet), constrained max-width center column (Desktop).
* **Navigation:** Minimalist.
* **Scroll Behavior:** Hide on scroll down, show on scroll up.
* **Elements:** Brand Logo (Center), Hamburger Menu (Left), Cart Icon with counter badge (Right).

### B. Hero & Menu Components

* **Hero Section:**
* **Background:** Full-width cover image (configured in Tenant settings).
* **Overlay:** Gradient fade from bottom.
* **Content:** Restaurant Name (H1), Tagline, and "Open/Closed" status indicator.


* **Category Navigation:** Sticky sub-header. Horizontal scrolling pills (e.g., "Starters", "Mains", "Drinks"). Active state uses `--color-primary`.
* **Menu Item Card (List View):**
* **Layout:** Flex row. Text (Left, 70%) + Image (Right, 30%).
* **Typography:** Title (Bold), Price (Accent color), Description (Grey, small).
* **Interaction:** Tapping opens the "Item Details/Modifiers" modal.

### C. Cart & Checkout (Floating Action)

* **Sticky Footer:** A floating bar anchored to the bottom of the viewport.
* **Visibility:** Only appears when items > 0.
* **Content:** "View Order" text + Total Price.
* **Style:** Full width, solid background color (`--color-primary`), white text.

---

## 7. Kitchen Display System (KDS) Specification

*Context: Accessed via `http://tenant.localhost/kitchen`. This view is designed for wall-mounted tablets or large monitors in a messy environment. High contrast and legibility are paramount.*

### A. Layout & Grid

* **Background:** Always Dark Mode (`#121212` or similar) to reduce eye strain and screen glare.
* **Grid System:** "Masonry" or Flex-wrap layout. Tickets arrange themselves left-to-right, then wrap to the next row.
* **Density:** Variable based on screen size (4 tickets per row on 1080p screens).

### B. Ticket Component (The "Chit")

* **Container:** High contrast card with a solid border.
* **Header Strip:**
* **Color Logic:** Changes based on ticket age.
* *0-10 mins:* Green (Fresh).
* *10-20 mins:* Yellow (Warning).
* *20+ mins:* Red (Late/Critical).


* **Data:** Order ID (#204), Timer (MM:SS), Table/Type (Dine-in/Takeout).


* **Body:**
* **List:** Large font size (18px+).
* **Modifiers:** Indented and italicized (e.g., *No Onions* in red text).
* **Grouping:** Items grouped by category (e.g., "Hot", "Cold").


* **Footer Action:**
* **Primary Button:** "Bump" (Mark Complete). Double-tap protection enabled to prevent accidental closures.



### C. Alerts & Overlay

* **New Order Alert:** Visual flash on the screen border + Audio chime (configurable).
* **Connection Status:** Small indicator in the top right (Green dot = WebSocket Active, Red dot = Offline).

---

## 8. Super Admin Portal Specification

*Context: Accessed via `http://admin.localhost`. This is the "God View" for the platform owner to manage the SaaS business.*

### A. Layout Architecture

* **Pattern:** Classic Dashboard (Sidebar Navigation + Main Content Area).
* **Sidebar:** Fixed width (250px). Dark theme.
* **Links:** Tenants, billing, Platform Health, Settings.


* **Header:** Breadcrumbs and Global Search (Search by Tenant ID or Domain).

### B. Tenant Management View

* **Action Bar:** "Provision New Tenant" (Primary Button).
* **Data Table:**
* **Columns:** Status (Active/Suspended), Tenant Name, Domain, Plan Type, Created At.
* **Status Indicators:**
* *Green Dot:* Database schema active & healthy.
* *Red Dot:* Provisioning failed or payment delinquent.




* **Provisioning Modal:**
* **Step 1:** Basic Info (Name, Owner Email).
* **Step 2:** Subdomain selection (`.omniorder.com`).
* **Step 3:** Theme Preset Selection (Mono Luxe, Fresh Market, Tech Ocean).



### C. Platform Health Monitor

* **Metric Cards:** Row of 4 cards at the top.
* Total Active Tenants.
* Total Orders (Last 24h).
* API Latency (Avg).
* Error Rate.
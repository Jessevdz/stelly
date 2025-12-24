# Design Document: OmniOrder Landing Page (v2)

## 1. Design Philosophy

The new landing page serves as the "clean room" entry point to the OmniOrder platform. Unlike the tenant pages which are heavily themed (Luxe, Market, Tech), the Platform Landing page must feel **neutral, architectural, and precise**.

* **Theme:** "Paper & Light."
* **Vibe:** SaaS Enterprise, Modern, Airy.
* **Interaction:** Subtle fade-ins, smooth hover lifts, zero clutter.

## 2. Color Palette

A "Swiss Design Light" for v2.

| Usage | Color Name | Hex / Tailwind | Description |
| --- | --- | --- | --- |
| **Canvas** | White | `#FFFFFF` / `bg-white` | The primary background. |
| **Surface** | Slate 50 | `#F8FAFC` / `bg-slate-50` | Subtle section differentiation. |
| **Primary** | Electric Blue | `#2563EB` / `text-blue-600` | The core brand action color. Used for CTAs and key icons. |
| **Text (Main)** | Slate 900 | `#0F172A` / `text-slate-900` | High contrast for headings. |
| **Text (Muted)** | Slate 500 | `#64748B` / `text-slate-500` | Readable gray for body copy. |
| **Borders** | Slate 100 | `#F1F5F9` / `border-slate-100` | Barely-there dividers. |

## 3. Typography & Layout Strategy

* **Font:** `Inter` (Variable).
* **Spacing:** Extreme use of whitespace (`py-24`, `py-32`). Content width restricted to `max-w-5xl` for readability.
* **Grid:** A subtle, faint background grid (`bg-[url(...)]`) will be used to denote "Infrastructure" without adding visual weight.

## 4. Component Breakdown

**A. Navigation (Sticky)**

* **Background:** White with a high blur (`backdrop-blur-md`, `bg-white/80`).
* **Logo:** OmniOrder (Black text) with the Hexagon icon in Electric Blue.
* **Actions:** A simple "Login" link (Ghost) and "Launch Demo" (Primary Small).

**B. Hero Section**

* **Alignment:** Centered.
* **Headline:** Massive, tracking-tight. "The Chameleon Engine."
* **Subhead:** A clear statement about the architecture (Multi-tenant, Single deployment).
* **Visual:** Instead of a screenshot, a schematic representation or code snippet showing the separation of "Data" vs "Brand".
* **CTA:** A large, pill-shaped Electric Blue button with a drop shadow (`shadow-blue-500/20`).

**C. The "Three Pillars" (Features)**

* Instead of boxed cards, we use **floating icons**.
* **Layout:** 3-Column Grid.
* **Iconography:** `lucide-react` icons (Smartphone, Server, ChefHat) inside subtle blue circles (`bg-blue-50 text-blue-600`).
* **Interaction:** Hovering over a column slightly lifts the text (`-translate-y-1`).

**D. Footer**

* Minimal text. Links to GitHub (if applicable) or documentation.

## 5. Implementation Plan (Tailwind)

We will replace the contents of `LandingPage.tsx` entirely.

**Key Tailwind Classes to leverage:**

* **Gradients:** `bg-gradient-to-b from-blue-50 to-white` (Subtle top fade).
* **Text Gradients:** `text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600` (For the main headline).
* **Buttons:** `rounded-full`, `font-medium`, `transition-all`, `active:scale-95`.

## 6. New content

The main advantages of using this platform:
- It provides a website to small and medium sized businesses, where they might not already have a website or any online presence.
- They only pay when people are using the platform, at the lowest fee on the market: 1% transaction fee. No other upfront costs, no risks.
- They can customize their own storefront and update it any time
- It provides insight and analytics into their sales, for free, out of the box
- Flexible enough to use in any setup, on any device.
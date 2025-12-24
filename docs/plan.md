Here is the comprehensive implementation plan to transition the Demo Mode from a shared, static environment to a dynamic, lead-generation-focused experience with isolated sandboxes.

### Core Concept

Instead of all demo users sharing the `tenant_demo` schema, every user will provide their contact details to trigger the provisioning of an ephemeral (temporary) PostgreSQL schema (e.g., `demo_session_<uuid>`).

The authentication token issued to the user will contain a claim pointing specifically to this schema. The Backend Dependency Injection system will prioritize this claim over the standard Host Header resolution when running on the demo domain.

---

### Implementation Plan

#### 1. Database Architecture Changes

We need to track these ephemeral sessions separately from actual paying tenants to keep the system clean.

* **New Table: `public.leads**`
* Stores lead information (Name, Email, Timestamp).
* Tracks the assigned `schema_name` and `session_id`.
* Used for the Super Admin to view who is testing the platform.


* **Schema Provisioning Strategy**
* **Mechanism:** On login, the system will execute raw SQL to `CREATE SCHEMA demo_<uuid>`.
* **Seeding:** Immediately apply the `Base.metadata.create_all` and run the `seed_internal` logic for that specific schema using the "Omni Demo Bistro" data set.



#### 2. Backend Logic (`apps/api`)

* **Modify `POST /sys/demo-login` (Rename to `/sys/generate-demo-session`)**
* **Input:** Accepts `name` and `email` instead of a code.
* **Action 1 (Persist):** Save data to `public.leads`.
* **Action 2 (Provision):** Generate a unique schema name (e.g., `demo_123abc`). Clone the standard demo seed data into this new schema.
* **Action 3 (Token):** Generate a JWT. Crucially, add a custom claim: `{"target_schema": "demo_123abc"}`.
* **Output:** Return the JWT and the user profile.


* **Update Context Resolution (`deps.py` & `admin.py`)**
* Update the `get_current_user` dependency.
* **Current Logic:** Look at `Host` header  Query `public.tenants`.
* **New Logic:**
1. Check `Host` header.
2. If `Host` == `demo.stelly.localhost`:
3. Inspect the JWT. If it contains `target_schema`, force the database search path to that schema.
4. If no JWT/Schema claim, fallback to the generic `tenant_demo` (read-only mode).




* **Background Cleanup (Housekeeping)**
* Since we are generating real schemas, we need a mechanism to clean them up.
* Implement a scheduled task (or a simple script) that drops schemas starting with `demo_` that are older than 24 hours.



#### 3. Frontend Experience (`apps/web`)

* **Revamp `DemoLogin.tsx**`
* Replace the "Access Code" input with a proper Lead Generation form (Name, Email).
* Add validation and a "Setting up your personal sandbox..." loading state, as provisioning might take 1-2 seconds.


* **Update `AuthContext.tsx**`
* Ensure the "User" object in the context includes the lead's name so we can personalize the UI (e.g., "Welcome, Jesse's Bistro").


* **Session Persistence**
* Ensure the token is stored in `sessionStorage` (not `localStorage`) so that closing the tab effectively "ends" the session from the user's perspective.



#### 4. Super Admin Visibility

* **Update `PlatformDashboard**`
* Add a section for "Recent Leads" to display data from the `public.leads` table.
* This transforms the demo from a tech showcase into a sales tool.



---

### User Flow Diagram

1. **Landing:** User arrives at `demo.stelly.localhost`.
2. **Gate:** User clicks "Start Demo". Sees a form: "Enter your name & email to launch your private environment."
3. **Submission:** User submits form.
4. **Processing:**
* API creates `public.leads` record.
* API creates schema `demo_xyz`.
* API seeds tables (Menu, Items, Modifiers).
* API issues JWT with `schema: demo_xyz`.


5. **Redirect:** User is sent to `/demo/split`.
6. **Interaction:**
* User changes the Theme Color.
* API updates `demo_xyz.tenants` config.
* *Result:* Only this user sees the color change. Other demo users are unaffected.



---

### Risks & Mitigations

* **Performance:** Creating schemas is relatively cheap in Postgres, but seeding data takes time.
* *Mitigation:* Keep the demo seed data lightweight (max 10 items).

* **Security:** Raw SQL schema creation.
* *Mitigation:* Strictly validate and sanitize the generated UUIDs used for schema names. Never use user input for schema names.
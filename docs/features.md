# features

### **Part 1: Storefront (End-User Experience)**

#### **Tier 1: Vital (Cannot Launch Without)**

1. **Server-Side Price & Total Calculation**
* **Why:** You cannot trust the client's `total_amount`. A user (or bug) could send a $0 total for a $50 order, messing up your revenue reporting and cashier expectations.
* **Feature:** Refactor `POST /orders` to ignore the client's price. The backend must fetch the item prices + modifier costs from the DB and calculate the `total_amount` authoritatively before saving.

2. **Human-Readable Order IDs ("Ticket Numbers")**
* **Why:** A customer cannot walk up to the counter and say "I'm Order UUID `a1b2-c3d4...`".
* **Feature:** Implement a daily auto-incrementing counter (e.g., `#001`, `#002`) scoped to the Tenant. This number must be prominent on the "Order Success" screen and the KDS.

3. **Fulfillment Details (Name/Table #)**
* **Why:** The kitchen and cashier need to know *who* this is for.
* **Feature:** A mandatory "Guest Details" step before checkout:
* **Name:** Required for Pickup.

#### **Tier 2: User Confidence**

4. **Order Status Polling/WebSocket**
* **Why:** Since they haven't paid, customers are anxious. "Did they actually get it?"
* **Feature:** A persistent "Live Status" bar at the top of the browser session showing: *Sent → Kitchen Preparing → Ready for Pickup*.

5. **Spam Protection (Rate Limiting)**
* **Why:** Without a payment gate, a malicious actor (or a bored kid) can write a script to order 5,000 burgers and flood the KDS.
* **Feature:** Strict Redis-based rate limiting on `POST /orders` (e.g., max 3 orders per 10 minutes per IP/Device Fingerprint).

---

### **Part 2: Tenant Admin (Restaurant Operations)**

#### **Tier 1: Operational Control**

1. **"Cashier Mode" (POS View)**
* **Why:** The KDS is for cooking; it doesn't handle money. You need a screen for the front-of-house staff to settle the bill.
* **Feature:** A new view in the Admin Dashboard showing "Active Unpaid Orders."
* Actions: `Mark Paid` (Cash/Card Terminal), `Void/Cancel`.
* This status change should sync to the KDS (optionally removing it or marking it "Paid").

2. **"Quick 86" (Inventory Toggle)**
* **Why:** Running out of ingredients happens fast.
* **Feature:** A mobile-friendly toggle list for Managers to instantly disable Items or Modifier Options (e.g., "No Avocados") so users can't order them.

3. **KDS Audio & Wake Lock**
* **Why:** Tablets go to sleep, and kitchens are loud.
* **Feature:** A "Start Shift" button on the KDS that triggers the Browser Wake Lock API (keeps screen on) and initializes the Audio Context for the "New Order" ding.
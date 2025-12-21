import requests
import json
import sys
import random
import time

# Configuration
API_URL = "http://localhost:8000/api/v1"

# Define the tenants we want to seed
SEEDS = [
    {
        "name": "Pizza Hut",
        "domain": "pizza.localhost",
        "primary_color": "#e11d48",  # Red
        "font_family": "Oswald",
        "seed_data": True,
    },
    {
        "name": "Burger King",
        "domain": "burger.localhost",
        "primary_color": "#2563eb",  # Blue
        "font_family": "Inter",
        "seed_data": True,
    },
]

# Define Modifiers to attach to specific items
# Matches item names created in apps/api/app/api/v1/sys.py
MODIFIER_Kv = {
    "The OmniBurger": [
        {
            "name": "Cook Temperature",
            "min_selection": 1,
            "max_selection": 1,
            "options": [
                {"name": "Rare", "price_adjustment": 0},
                {"name": "Medium Rare", "price_adjustment": 0},
                {"name": "Medium", "price_adjustment": 0},
                {"name": "Well Done", "price_adjustment": 0},
            ],
        },
        {
            "name": "Add-ons",
            "min_selection": 0,
            "max_selection": 5,
            "options": [
                {"name": "Extra Cheese", "price_adjustment": 100},
                {"name": "Bacon Strip", "price_adjustment": 200},
                {"name": "Caramelized Onions", "price_adjustment": 50},
            ],
        },
    ],
    "Truffle Fries": [
        {
            "name": "Size",
            "min_selection": 1,
            "max_selection": 1,
            "options": [
                {"name": "Regular", "price_adjustment": 0},
                {"name": "Large", "price_adjustment": 250},
            ],
        },
        {
            "name": "Dipping Sauce",
            "min_selection": 0,
            "max_selection": 2,
            "options": [
                {"name": "Garlic Aioli", "price_adjustment": 50},
                {"name": "Spicy Mayo", "price_adjustment": 50},
            ],
        },
    ],
    "Vanilla Shake": [
        {
            "name": "Toppings",
            "min_selection": 0,
            "max_selection": 3,
            "options": [
                {"name": "Whipped Cream", "price_adjustment": 0},
                {"name": "Cherry", "price_adjustment": 0},
                {"name": "Chocolate Syrup", "price_adjustment": 50},
            ],
        }
    ],
}


def log(msg, type="info"):
    icons = {"info": "🔹", "success": "✅", "error": "❌", "warn": "⚠️"}
    print(f"{icons.get(type, '')} {msg}")


def get_admin_token(domain):
    """Log in as the tenant admin to perform write operations."""
    try:
        # Note: In deps.py, we resolve tenant by Host header,
        # then validate user exists in that tenant.
        headers = {"Host": domain}
        payload = {"username": f"admin@{domain}", "password": "password"}
        res = requests.post(f"{API_URL}/auth/login", data=payload, headers=headers)
        if res.status_code == 200:
            return res.json()["access_token"]
        return None
    except Exception:
        return None


def provision_tenant(payload):
    """Call the API to create the schema, tables, and default data."""
    log(f"Provisioning Tenant: {payload['name']}...", "info")

    try:
        res = requests.post(f"{API_URL}/sys/provision", json=payload)

        if res.status_code == 200:
            data = res.json()
            log(f"Created Schema: {data['schema_name']}", "success")
            return True
        elif res.status_code == 400:
            log(
                f"Tenant '{payload['name']}' already exists. Skipping provision.",
                "warn",
            )
            return True
        else:
            log(f"Provision failed: {res.text}", "error")
            return False
    except Exception as e:
        log(f"Connection failed: {e}", "error")
        return False


def seed_modifiers(tenant):
    """
    1. Login as Admin.
    2. Fetch Items.
    3. Add Modifier Groups/Options based on MODIFIER_Kv.
    """
    domain = tenant["domain"]
    token = get_admin_token(domain)

    if not token:
        log(f"Could not login as admin@{domain} to seed modifiers.", "error")
        return

    headers = {"Host": domain, "Authorization": f"Bearer {token}"}

    # 1. Fetch Items to find IDs
    res = requests.get(f"{API_URL}/admin/items", headers=headers)
    if res.status_code != 200:
        log("Failed to fetch items for modifier seeding.", "error")
        return

    items = res.json()

    count = 0
    for item in items:
        if item["name"] in MODIFIER_Kv:
            # Check if already has modifiers (simple check)
            if item.get("modifier_groups") and len(item["modifier_groups"]) > 0:
                continue

            configs = MODIFIER_Kv[item["name"]]

            for group_def in configs:
                # 2. POST /items/{id}/modifiers
                payload = {
                    "name": group_def["name"],
                    "min_selection": group_def["min_selection"],
                    "max_selection": group_def["max_selection"],
                    "options": group_def["options"],
                }

                m_res = requests.post(
                    f"{API_URL}/admin/items/{item['id']}/modifiers",
                    json=payload,
                    headers=headers,
                )
                if m_res.status_code == 200:
                    count += 1

    if count > 0:
        log(f"Seeded {count} modifier groups for {domain}.", "success")
    else:
        log(f"Modifiers already seeded or no matching items for {domain}.", "info")


def generate_traffic(tenant):
    """Fetch the menu and place random orders with modifiers."""
    domain = tenant["domain"]
    headers = {"Host": domain}

    log(f"Generating traffic for {domain}...", "info")

    try:
        # 1. Fetch Menu (Public Store Endpoint) - Now returns nested modifiers
        res = requests.get(f"{API_URL}/store/menu", headers=headers)
        if res.status_code != 200:
            log("Could not fetch menu.", "error")
            return

        categories = res.json()
        all_items = []
        for cat in categories:
            all_items.extend(cat["items"])

        if not all_items:
            log("No menu items found. Cannot seed orders.", "error")
            return

        # 2. Place Random Orders
        order_count = 5

        for i in range(order_count):
            # Pick 1-2 random items
            cart_selection = random.sample(all_items, k=random.randint(1, 2))

            final_items_payload = []
            total_order_amount = 0

            for item in cart_selection:
                item_price = item["price"]
                item_modifiers = []

                # Logic to pick random modifiers if they exist
                if "modifier_groups" in item:
                    for group in item["modifier_groups"]:
                        # If required (min > 0) or random chance, pick an option
                        if group["min_selection"] > 0 or random.choice([True, False]):
                            if not group["options"]:
                                continue

                            # Pick 1 option for now for simplicity
                            choice = random.choice(group["options"])

                            item_modifiers.append(
                                {
                                    "groupId": group["id"],
                                    "groupName": group["name"],
                                    "optionId": choice["id"],
                                    "optionName": choice["name"],
                                    "price": choice["price_adjustment"],
                                }
                            )
                            item_price += choice["price_adjustment"]

                total_order_amount += item_price

                final_items_payload.append(
                    {
                        "id": item["id"],
                        "qty": 1,
                        "name": item["name"],
                        "price": item["price"],
                        "modifiers": item_modifiers,
                    }
                )

            # Construct payload
            order_payload = {
                "customer_name": f"Guest {random.randint(10, 99)}",
                "total_amount": total_order_amount,
                "items": final_items_payload,
            }

            # Send Order
            ord_res = requests.post(
                f"{API_URL}/store/orders", json=order_payload, headers=headers
            )

            if ord_res.status_code == 201:
                sys.stdout.write(".")
                sys.stdout.flush()
            else:
                sys.stdout.write("x")

        print("")  # New line
        log(f"Placed {order_count} orders with modifiers.", "success")

    except Exception as e:
        log(f"Error generating traffic: {e}", "error")


def main():
    print("========================================")
    print("   OMNIORDER: DATABASE SEEDER v2")
    print("========================================")

    # 1. Provision Tenants
    for tenant in SEEDS:
        if provision_tenant(tenant):
            # 2. Seed Modifiers (New Step)
            seed_modifiers(tenant)

            # 3. Generate Data
            generate_traffic(tenant)
            print("-" * 40)

    print("\n========================================")
    print("   SEEDING COMPLETE")
    print("========================================")
    print("Login Credentials for all tenants:")
    for t in SEEDS:
        print(f"Domain: {t['domain']}")
        print(f"User:   admin@{t['domain']}")
        print(f"Pass:   password")
        print("-" * 20)


if __name__ == "__main__":
    main()

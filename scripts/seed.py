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


def log(msg, type="info"):
    icons = {"info": "🔹", "success": "✅", "error": "❌", "warn": "⚠️"}
    print(f"{icons.get(type, '')} {msg}")


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


def generate_traffic(tenant):
    """Fetch the menu and place random orders to populate KDS/Dashboard."""
    domain = tenant["domain"]
    headers = {"Host": domain}

    log(f"Generating traffic for {domain}...", "info")

    # 1. Fetch Menu to get Item IDs
    try:
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
        log(f"Placing {order_count} random orders...", "info")

        for i in range(order_count):
            # Pick 1-3 random items
            cart_items = random.sample(all_items, k=random.randint(1, 3))

            # Construct payload
            order_payload = {
                "customer_name": f"Customer {random.randint(100, 999)}",
                "total_amount": sum(item["price"] for item in cart_items),
                "items": [
                    {"id": item["id"], "qty": 1, "name": item["name"]}
                    for item in cart_items
                ],
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
        log("Traffic generation complete.", "success")

    except Exception as e:
        log(f"Error generating traffic: {e}", "error")


def main():
    print("========================================")
    print("   OMNIORDER: DATABASE SEEDER")
    print("========================================")

    # 1. Provision Tenants
    for tenant in SEEDS:
        if provision_tenant(tenant):
            # 2. If provision successful (or exists), generate data
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

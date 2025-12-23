import uuid
import logging
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.db.models import Tenant, Category, MenuItem, ModifierGroup, ModifierOption
from app.db.base import Base
from app.core.config import settings

logger = logging.getLogger(__name__)

SEEDS = [
    {
        "name": "Omni Demo Bistro",
        "domain": settings.DEMO_DOMAIN,
        "schema_name": settings.DEMO_SCHEMA,
        "theme_config": {
            "preset": "mono-luxe",
            "primary_color": "#000000",
            "font_family": "Inter",
            "address": "101 Demo Lane, Tech City",
            "operating_hours": [{"label": "Mon-Sun", "time": "24 Hours"}],
        },
        "categories": ["Chef's Specials", "Appetizers", "Cocktails"],
        "items": [
            {
                "name": "Wagyu Smash Burger",
                "desc": "A5 Wagyu blend, brioche bun, aged cheddar, truffle aioli.",
                "price": 1800,
                "img": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80",
                "cat_idx": 0,
                "modifiers": [
                    {
                        "name": "Doneness",
                        "min": 1,
                        "max": 1,
                        "opts": [
                            {"name": "Medium Rare", "price": 0},
                            {"name": "Medium", "price": 0},
                            {"name": "Well Done", "price": 0},
                        ],
                    }
                ],
            },
            {
                "name": "Lobster Mac & Cheese",
                "desc": "Maine lobster, gruyere, herb crumb.",
                "price": 2400,
                "img": "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=800&q=80",
                "cat_idx": 0,
            },
            {
                "name": "Crispy Calamari",
                "desc": "Served with spicy marinara and lemon wedge.",
                "price": 1200,
                "img": "https://images.unsplash.com/photo-1604909052743-94e838986d24?auto=format&fit=crop&w=800&q=80",
                "cat_idx": 1,
            },
            {
                "name": "Smoked Old Fashioned",
                "desc": "Bourbon, bitters, orange peel, hickory smoke.",
                "price": 1600,
                "img": "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=800&q=80",
                "cat_idx": 2,
            },
        ],
    },
    {
        "name": "Pizza Hut",
        "domain": "pizza.localhost",
        "schema_name": "tenant_pizza",
        "theme_config": {
            "preset": "mono-luxe",
            "primary_color": "#e11d48",
            "font_family": "Oswald",
        },
        "categories": ["Signatures", "Sides", "Drinks"],
        "items": [
            {
                "name": "The OmniBurger",
                "desc": "Double patty, brioche bun, secret sauce.",
                "price": 1400,
                "img": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=500&q=60",
                "cat_idx": 0,
                "modifiers": [
                    {
                        "name": "Cook Temp",
                        "min": 1,
                        "max": 1,
                        "opts": [
                            {"name": "Medium", "price": 0},
                            {"name": "Well Done", "price": 0},
                        ],
                    }
                ],
            },
            {
                "name": "Truffle Fries",
                "desc": "Crispy fries topped with parmesan and truffle oil.",
                "price": 600,
                "img": "https://images.unsplash.com/photo-1576107232684-1279f390859f?auto=format&fit=crop&w=500&q=60",
                "cat_idx": 1,
            },
            {
                "name": "Vanilla Shake",
                "desc": "Classic hand-spun milkshake.",
                "price": 500,
                "img": "https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=500&q=60",
                "cat_idx": 2,
            },
        ],
    },
    {
        "name": "Burger King",
        "domain": "burger.localhost",
        "schema_name": "tenant_burger",
        "theme_config": {
            "preset": "fresh-market",
            "primary_color": "#2563eb",
            "font_family": "Inter",
        },
        "categories": ["Burgers", "Snacks", "Beverages"],
        "items": [
            {
                "name": "Whopper",
                "desc": "Flame grilled beef patty.",
                "price": 850,
                "img": "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=500&q=60",
                "cat_idx": 0,
            }
        ],
    },
]


def provision_tenant_internal(db: Session, seed_data: dict, engine):
    """
    Directly provisions a tenant, schema, tables, and data without API calls.
    """
    # 1. Check/Create Tenant Record in Public Schema
    db.execute(text("SET search_path TO public"))

    existing = db.query(Tenant).filter(Tenant.domain == seed_data["domain"]).first()
    if existing:
        logger.info(f"Tenant {seed_data['name']} already exists. Skipping.")
        return

    logger.info(f"Creating Tenant: {seed_data['name']}")

    new_tenant = Tenant(
        name=seed_data["name"],
        domain=seed_data["domain"],
        schema_name=seed_data["schema_name"],
        theme_config=seed_data["theme_config"],
    )
    db.add(new_tenant)
    db.commit()

    # 2. Create Schema
    schema = seed_data["schema_name"]
    try:
        db.execute(text(f"CREATE SCHEMA IF NOT EXISTS {schema}"))
        db.commit()
    except Exception as e:
        logger.error(f"Failed to create schema {schema}: {e}")
        return

    # 3. Create Tables
    # We must use the engine to create tables bound to the schema
    with engine.begin() as connection:
        connection.execute(text(f"SET search_path TO {schema}"))
        # Filter tables that are NOT public
        tenant_tables = [t for t in Base.metadata.sorted_tables if t.schema != "public"]
        Base.metadata.create_all(bind=connection, tables=tenant_tables)

    # 4. Seed Data (Menu)
    # Re-bind session to new schema
    db.execute(text(f"SET search_path TO {schema}"))

    # Create Categories
    cat_objs = []
    for i, cat_name in enumerate(seed_data["categories"]):
        c = Category(id=uuid.uuid4(), name=cat_name, rank=i)
        db.add(c)
        cat_objs.append(c)
    db.flush()

    # Create Items
    for item_data in seed_data["items"]:
        cat = cat_objs[item_data["cat_idx"]]
        item = MenuItem(
            id=uuid.uuid4(),
            name=item_data["name"],
            description=item_data.get("desc"),
            price=item_data["price"],
            image_url=item_data.get("img"),
            category_id=cat.id,
        )
        db.add(item)
        db.flush()

        # Create Modifiers
        if "modifiers" in item_data:
            for mod_grp in item_data["modifiers"]:
                grp = ModifierGroup(
                    item_id=item.id,
                    name=mod_grp["name"],
                    min_selection=mod_grp["min"],
                    max_selection=mod_grp["max"],
                )
                db.add(grp)
                db.flush()
                for opt in mod_grp["opts"]:
                    db.add(
                        ModifierOption(
                            group_id=grp.id,
                            name=opt["name"],
                            price_adjustment=opt["price"],
                        )
                    )

    db.commit()
    logger.info(f"Seeding complete for {schema}")


def init_db(db: Session, engine):
    for seed in SEEDS:
        try:
            provision_tenant_internal(db, seed, engine)
        except Exception as e:
            logger.error(f"Error seeding {seed['name']}: {e}")
            db.rollback()

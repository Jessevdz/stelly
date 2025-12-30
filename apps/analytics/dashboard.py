import streamlit as st
import pandas as pd
from sqlalchemy import create_engine
import plotly.express as px
import os

# --- CONFIG ---
st.set_page_config(page_title="Stelly Analytics", page_icon="📊", layout="wide")

# Read connection details from Environment Variables
# Defaults allow it to work locally if env vars are missing,
# but Docker values will take precedence.
POSTGRES_USER = os.getenv("POSTGRES_USER", "postgres")
POSTGRES_PASSWORD = os.getenv("POSTGRES_PASSWORD", "postgres")
POSTGRES_HOST = os.getenv("POSTGRES_HOST", "db")
POSTGRES_PORT = os.getenv("POSTGRES_PORT", "5432")
POSTGRES_DB = os.getenv("POSTGRES_DB", "stelly")

DB_URL = f"postgresql://{POSTGRES_USER}:{POSTGRES_PASSWORD}@{POSTGRES_HOST}:{POSTGRES_PORT}/{POSTGRES_DB}"


@st.cache_resource
def get_engine():
    return create_engine(DB_URL)


def load_data():
    engine = get_engine()
    with engine.connect() as conn:
        # Fetch Leads (Demo Users)
        leads_df = pd.read_sql(
            "SELECT * FROM public.leads ORDER BY created_at DESC", conn
        )

        # Fetch Contact Requests (Partner Inquiries)
        contacts_df = pd.read_sql(
            "SELECT * FROM public.contact_requests ORDER BY created_at DESC", conn
        )

        # Fetch Provisioned Tenants (including ephemeral demo ones)
        tenants_df = pd.read_sql("SELECT * FROM public.tenants ORDER BY id", conn)

    return leads_df, contacts_df, tenants_df


# --- UI ---
st.title("📊 Stelly Growth Dashboard")
st.markdown(
    f"Real-time overview. Connected to: `{POSTGRES_HOST}:{POSTGRES_PORT}/{POSTGRES_DB}`"
)

if st.button("🔄 Refresh Data"):
    st.cache_data.clear()

try:
    leads, contacts, tenants = load_data()

    # --- TOP KPIS ---
    col1, col2, col3, col4 = st.columns(4)

    with col1:
        st.metric(
            label="Total Active Demos", value=len(leads), delta=f"{len(leads)} All Time"
        )

    with col2:
        st.metric(label="Inbound Inquiries", value=len(contacts), delta="High Intent")

    with col3:
        # Calculate conversion (Simple mock logic)
        conversion = (len(contacts) / len(leads) * 100) if len(leads) > 0 else 0
        st.metric(label="Demo-to-Contact %", value=f"{conversion:.1f}%")

    with col4:
        st.metric(label="Total DB Tenants", value=len(tenants))

    st.divider()

    # --- TABS LAYOUT ---
    tab1, tab2, tab3 = st.tabs(
        ["🧪 Demo Sessions (Leads)", "📬 Contact Requests", "📈 Activity Charts"]
    )

    with tab1:
        st.subheader("Recent Demo Sessions")
        st.info(
            "Users who clicked 'Start Demo' and generated an ephemeral environment."
        )

        if not leads.empty:
            # Clean up display
            display_leads = leads.copy()
            display_leads["created_at"] = pd.to_datetime(display_leads["created_at"])
            st.dataframe(
                display_leads[["name", "email", "assigned_schema", "created_at"]],
                use_container_width=True,
                hide_index=True,
            )
        else:
            st.warning("No demo sessions recorded yet.")

    with tab2:
        st.subheader("Partner Inquiries")
        st.success("High value leads from the bottom of the landing page.")

        if not contacts.empty:
            display_contacts = contacts.copy()
            display_contacts["created_at"] = pd.to_datetime(
                display_contacts["created_at"]
            )
            st.dataframe(
                display_contacts[["name", "email", "business_name", "created_at"]],
                use_container_width=True,
                hide_index=True,
            )
        else:
            st.warning("No contact requests yet.")

    with tab3:
        st.subheader("Growth Over Time")

        if not leads.empty:
            leads["date"] = pd.to_datetime(leads["created_at"]).dt.date
            daily_leads = leads.groupby("date").size().reset_index(name="count")

            fig = px.bar(
                daily_leads, x="date", y="count", title="Daily Demo Generations"
            )
            st.plotly_chart(fig, use_container_width=True)
        else:
            st.text("Not enough data for charts.")

except Exception as e:
    st.error(f"Could not connect to database. Ensure the stack is running.\nError: {e}")

# Footer
st.markdown("---")

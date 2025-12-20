# Middleware Logic: Tenant Schema Switching
# 1. Read Host header.
# 2. Lookup public.tenants.
# 3. Execute 'SET search_path TO tenant_x'

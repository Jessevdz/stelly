-- Create the main database (if not exists logic handled by docker image mostly)
-- Initialize Public Schema Structure

CREATE TABLE IF NOT EXISTS public.tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    schema_name VARCHAR(63) UNIQUE NOT NULL,
    domain VARCHAR(255) UNIQUE NOT NULL,
    theme_config JSONB DEFAULT '{}'
);

-- Create separate database for Authentik Identity Provider
CREATE DATABASE authentik;
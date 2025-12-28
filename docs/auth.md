# Authentication & Identity Architecture

## 1. Executive Summary

Stelly uses **OpenID Connect (OIDC)** via **Authentik** for all identity management. 

Instead of managing passwords locally, we federate identity. The backend (FastAPI) is stateless, verifying JWT signatures via JWKS. The frontend (React) uses the Authorization Code flow with PKCE.

Crucially, **Multi-Tenancy** is enforced via **Group Membership claims** injected into the JWT.

---

## 2. Architecture Diagram

```mermaid
sequenceDiagram
    participant User
    participant Frontend as React (Vite)
    participant Auth as Authentik (IdP)
    participant API as FastAPI
    participant DB as Postgres

    Note over User, Auth: Login Phase
    User->>Frontend: Clicks "Login"
    Frontend->>Auth: Redirect to auth.localhost
    User->>Auth: Enters Credentials
    Auth-->>Frontend: Redirects back with Auth Code
    Frontend->>Auth: Exchange Code for Access Token (JWT)
    
    Note over Auth: JWT contains custom claim:<br/>"groups": ["Pizza Hut Staff"]

    Note over User, DB: Data Access Phase
    User->>Frontend: View Dashboard
    Frontend->>API: GET /api/v1/orders (Bearer JWT)
    
    par Context Resolution
        API->>API: Extract Host (pizza.localhost) -> tenant_pizza
        API->>API: Verify JWT Signature (JWKS)
        API->>API: Verify User belongs to "Pizza Hut Staff"
    end

    API->>DB: SET search_path TO tenant_pizza
    API->>DB: Execute Query
    DB-->>API: Data
```
The codebase  is already set up with a highly effective "Local Cloud" simulation strategy. To fully align it with the Azure architecture described in `docs/cloud-architecture.md`, you essentially need to treat **Nginx as Azure Front Door** and **MinIO as Azure Blob Storage**.

Here is the best way to simulate that cloud setup locally, mapping each Azure component to its Docker equivalent and configuration.

### 1. Mapping the Components

| Cloud Component (Azure) | Local Simulator (Docker) | Why/How it works |
| --- | --- | --- |
| **Azure Front Door** | **Nginx** | Both act as Layer 7 Load Balancers/Reverse Proxies. They handle the routing rules (`/api` vs `/*`) and pass the Host header. |
| **Azure Container Apps** | **`api` Container** | Runs the stateless Python application. |
| **Static Web Apps** | **`web` Container** | Serves the React assets (locally via Vite dev server, but behind Nginx). |
| **Postgres Flexible** | **`db` Container** | Standard PostgreSQL container matches the managed service engine. |
| **Azure Blob Storage** | **MinIO** | MinIO is S3-compatible. While Azure Blob has its own API, MinIO perfectly simulates the architecture of "offloading files to a remote URL." |

---

### 2. The Critical Piece: Simulating "Front Door" Routing

In Azure, Front Door sits in front of everything. Locally, **Nginx** plays this role. The configuration in `infra/nginx/nginx.conf` is already 95% correct, but to strictly simulate the behavior of Azure Front Door (specifically how it preserves headers for multi-tenancy), ensure your Nginx config emphasizes the `Host` header.

**Verification:**
Your `infra/nginx/nginx.conf` correctly has:

```nginx
proxy_set_header Host $host;

```

This is the most important line. It ensures that when you visit `pizza.localhost`, the API receives `pizza.localhost` (allowing the tenant middleware to work) rather than `api:8000` (internal docker name).

### 3. Simulating DNS (The "Wildcard" Domain)

Azure Front Door usually manages a wildcard CNAME (`*.omniorder.com`). Locally, you cannot easily create true wildcard DNS without extra tools (like `dnsmasq`).

**The "Best Way" for Devs:**
Stick to the hosts file method described in your `README.md`. It is robust and requires no extra software.

**`127.0.0.1  pizza.localhost burger.localhost admin.localhost`**

* **Why `.localhost`?** Most modern browsers (Chrome/Firefox) automatically resolve `*.localhost` subdomains to `127.0.0.1` without even needing hosts file entries in some OS configurations, making it the closest thing to a "Cloud Wildcard" you can get locally.

### 4. Simulating Azure Blob Storage (MinIO vs Azurite)

Your `docs/cloud-architecture.md` mentions replacing MinIO with Azure Blob Storage. You have two choices for local simulation:

**Option A: The Pragmatic Choice (Keep MinIO)**

* **Why:** Your code currently uses `boto3` (AWS SDK). Azure Blob Storage is not natively S3 compatible, but MinIO is.
* **Strategy:** Keep using MinIO. It simulates the *architectural pattern* (Pre-signed URLs / Public URLs) perfectly. When you deploy to Azure, you can use a "Gateway" pattern or simply refactor `storage.py` to use `azure-storage-blob` SDK.

**Option B: The "Strict" Azure Choice (Use Azurite)**
If you want to code against the actual Azure SDK locally, replace `minio` in `docker-compose.yml` with **Azurite** (Microsoft's official emulator).

1. **Update Docker Compose:**
```yaml
azure-storage:
  image: mcr.microsoft.com/azure-storage/azurite
  ports:
    - "10000:10000"

```


2. **Update `storage.py`:** You would need to rewrite this file to use `azure-storage-blob` instead of `boto3`.

*Recommendation:* **Stick with Option A (MinIO)** for the MVP. It allows you to keep using generic S3 logic which is cleaner, and switching to Azure Blob SDK is a minor refactor of just `apps/api/app/core/storage.py` later.

### 5. Advanced Simulation: HTTPS (SSL Termination)

Azure Front Door forces HTTPS. Your local setup uses HTTP. This often causes "Mixed Content" bugs when you finally deploy.

**To verify this locally:**

1. Use [mkcert](https://github.com/FiloSottile/mkcert) to generate locally trusted certificates.
2. Mount them into the Nginx container.
3. Update `nginx.conf` to listen on 443 and terminate SSL.

**Update `docker-compose.yml`:**

```yaml
  nginx:
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./certs:/etc/nginx/certs # Mount mkcert certificates

```

**Update `infra/nginx/nginx.conf`:**

```nginx
server {
    listen 443 ssl;
    server_name *.localhost;
    ssl_certificate /etc/nginx/certs/localhost.pem;
    ssl_certificate_key /etc/nginx/certs/localhost-key.pem;
    
    # ... location blocks ...
}

```

### 6. Validation Checklist

To ensure your local Docker environment truly matches the `cloud-architecture.md`:

1. [x] **Routing:** Can you access `http://pizza.localhost/api/v1/store/menu` and get a JSON response specific to Pizza Hut? (Verifies Nginx Host forwarding).
2. [x] **Isolation:** If you query the DB directly (`docker exec -it <db_id> psql...`), do you see schemas named `tenant_pizzahut`? (Verifies Postgres Schema logic).
3. [x] **Assets:** When you upload an image, does the URL returned start with `http://localhost:9000/...`? (Verifies MinIO/Blob simulation).
4. [x] **Frontend:** Does the frontend load at `http://pizza.localhost` without pathing issues? (Verifies Static Web App path routing).

### Summary of Actions

1. **Do nothing to `nginx.conf` or `docker-compose.yml` immediately.** The provided setup is excellent.
2. **Strictly use `*.localhost` domains** to simulate the wildcard DNS of Azure Front Door.
3. **Keep MinIO** as your Blob Storage proxy.
4. (Optional but Recommended) **Implement HTTPS locally** using `mkcert` to catch SSL-related bugs before deployment.
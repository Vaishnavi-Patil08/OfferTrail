# OfferTrail - Job Application Tracker

A full-stack, containerized web application designed to streamline the job search process. It allows users to track application statuses, manage multiple resume PDFs, and keep interview notes organized in one secure platform.

### Tech Stack & Architecture
* **Frontend:** Next.js (App Router), React, Tailwind CSS, TypeScript
* **Backend:** Next.js Server Actions, Next.js Middleware, Node.js
* **Database:** PostgreSQL (hosted on Supabase)
* **ORM:** Prisma
* **Storage:** Supabase Storage (for secure PDF resume management)
* **Authentication:** Custom JWT-based Auth with HTTP-only cookies
* **Cloud Infrastructure:** AWS EC2 (Ubuntu Linux), AWS ECR (Elastic Container Registry)
* **DevOps & CI/CD:** Docker, GitHub Actions
* **Networking & Security:** Nginx (Reverse Proxy), Certbot / Let's Encrypt (SSL/HTTPS), PgBouncer (Connection Pooling)

### Key Features
* **Secure Authentication:** Custom-built login and session management using JSON Web Tokens (JWT) and Next.js Edge Middleware to protect private routes. In production, secure cookies (`Secure: true`) are enforced via an Nginx reverse proxy and Let's Encrypt SSL certificates.
* **Relational Data Modeling:** Strict database schemas linking users, job applications, and specific resume versions using Prisma.
* **Document Management:** Upload, delete, and manage PDF resumes using Supabase Storage with strict Row Level Security (RLS).
* **Containerized Environment:** Fully dockerized for consistent local development and production deployment, handling native dependencies and IPv4/IPv6 networking constraints seamlessly.
* **Automated CI/CD Pipeline:** Automated build, cross-compilation, and deployment workflows via GitHub Actions, ensuring zero-downtime updates to the AWS EC2 production server.

## Local Development (Docker)

To run this application locally, you must have [Docker](https://www.docker.com/) installed. The application is entirely containerized, meaning you do not need Node.js or PostgreSQL installed on your host machine.

### 1. Environment Variables
Create a `.env` file in the root directory (this file is ignored by Git). You will need your Supabase keys and a secret for your tokens:

```env
# Database (Use the Supabase Transaction Pooler URL - Port 6543)
DATABASE_URL="postgres://postgres.[YOUR-ID]:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true"

# Authentication
JWT_SECRET="your_secure_random_string"

# Storage
NEXT_PUBLIC_SUPABASE_URL="https://[YOUR-ID].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your_anon_key"
SUPABASE_SERVICE_ROLE_KEY="your_service_role_key"
SUPABASE_BUCKET_NAME="resumes"

### Production Deployment & CI/CD


This application is deployed on a raw AWS EC2 (Ubuntu) instance using a modern, automated DevOps pipeline.

#### Architecture Highlights:
1. **Container Registry:** Production images are built and pushed to a private AWS Elastic Container Registry (ECR).
2. **Reverse Proxy & SSL:** The Next.js Docker container runs internally on Port 3000. An **Nginx** web server is configured as a reverse proxy on Ports 80/443 to intercept public internet traffic, secured by an auto-renewing **Let's Encrypt SSL certificate**. This ensures the strict application of secure, HTTP-only JWT cookies.
3. **Continuous Deployment:** Every push to the `main` branch triggers a **GitHub Actions** workflow that:
   * Authenticates securely with AWS using IAM credentials stored in GitHub Secrets.
   * Injects public environment variables (`NEXT_PUBLIC_*`) as build arguments at compile time.
   * Builds and pushes the new Docker image to AWS ECR.
   * Connects via SSH to the EC2 instance, pulls the latest image, and gracefully restarts the container.

#### Managing Production Secrets
For security, production environment variables are never hardcoded or committed. They are managed entirely via **GitHub Secrets** and injected into the Docker container at runtime during the CI/CD execution.
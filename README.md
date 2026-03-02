# OfferTrail - Job Application Tracker

A full-stack, containerized web application designed to streamline the job search process. It allows users to track application statuses, manage multiple resume PDFs, and keep interview notes organized in one secure platform.

## 🛠️ Tech Stack & Architecture

* **Frontend:** Next.js (App Router), React, Tailwind CSS, TypeScript
* **Backend:** Next.js Server Actions, Next.js Middleware, Node.js
* **Database:** PostgreSQL (hosted on Supabase)
* **ORM:** Prisma
* **Storage:** Supabase Storage (for secure PDF resume management)
* **Authentication:** Custom JWT-based Auth with HTTP-only cookies
* **DevOps:** Docker, PgBouncer (Connection Pooling)

## ✨ Key Features

* **Secure Authentication:** Custom-built login and session management using JSON Web Tokens (JWT) and Next.js Edge Middleware to protect private routes.
* **Relational Data Modeling:** Strict database schemas linking users, job applications, and specific resume versions using Prisma.
* **Document Management:** Upload, delete, and manage PDF resumes using Supabase Storage with strict Row Level Security (RLS).
* **Containerized Environment:** Fully dockerized for consistent local development and production deployment, handling native dependencies and IPv4/IPv6 networking constraints seamlessly.

## 🚀 Local Development (Docker)

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
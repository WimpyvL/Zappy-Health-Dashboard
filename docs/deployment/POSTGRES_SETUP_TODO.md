# Managed PostgreSQL Setup & Integration TODO List

This document outlines the steps required to set up a managed PostgreSQL database and integrate it with the application backend and frontend.

## Phase 1: Database Setup & Schema Design

1.  **Choose a Managed PostgreSQL Provider:**
    *   [x] **Decision:** Supabase (Provides managed Postgres + API/Auth)

2.  **Create Database Instance (Supabase Project):**
    *   [ ] Sign up/log in to the chosen provider's console.
    *   [ ] Provision a new PostgreSQL database instance.
        *   Choose instance size/tier (start small for development/staging).
        *   Select region.
        *   Configure initial settings (database name, primary user, password).
        *   Set up network access rules (e.g., allow connections from specific IPs or VPCs for production, potentially allow local access for development if needed).
    *   [ ] Securely store the database connection credentials (host, port, user, password, database name).

3.  **Initial Schema Design:**
    *   [ ] Identify core entities based on the application's features (e.g., `users`, `patients`, `providers`, `consultations`, `sessions`, `orders`, `products`, `services`, `tags`, `notes`, `forms`, `form_submissions`, `audit_logs`, etc.).
    *   [ ] Define columns for each table, including data types (e.g., `VARCHAR`, `INT`, `TEXT`, `TIMESTAMP`, `BOOLEAN`, `JSONB`).
    *   [ ] Define primary keys (e.g., `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`).
    *   [ ] Define relationships between tables using foreign keys (e.g., `patient_id` in `orders` table referencing `patients` table).
    *   [ ] Define constraints (e.g., `NOT NULL`, `UNIQUE`).
    *   [ ] Define indexes for frequently queried columns (e.g., on foreign keys, status columns, email addresses).
    *   [ ] Document the initial schema (e.g., using a diagramming tool or markdown).

## Phase 2: Backend Implementation

4.  **Choose Backend Language/Framework (If not decided):**
    *   [ ] e.g., Node.js (with Express/NestJS), Python (with Django/Flask), Ruby (on Rails), Go (with Gin/Echo), etc.
    *   [ ] **Decision:** Select language/framework.

5.  **Set Up Backend Project:**
    *   [ ] Initialize project structure.
    *   [ ] Install necessary dependencies.

6.  **Choose and Set Up ORM/Query Builder:**
    *   [ ] Research options compatible with the chosen language/framework (e.g., Prisma, TypeORM, Sequelize for Node.js; SQLAlchemy for Python; ActiveRecord for Ruby; GORM for Go).
    *   [ ] **Decision:** Select ORM/Query Builder.
    *   [ ] Install and configure the ORM to connect to the database (using environment variables for credentials).

7.  **Implement Database Migrations:**
    *   [ ] Choose a migration tool (often built into the ORM, like Prisma Migrate, TypeORM migrations, Alembic for SQLAlchemy, Rails migrations).
    *   [ ] Create the initial migration based on the schema design.
    *   [ ] Apply the initial migration to the development and production databases.
    *   [ ] Establish a process for creating and applying future schema changes via migrations.

8.  **Develop Core API Endpoints:**
    *   [ ] Implement authentication endpoints (`/admin/sign_in`, potentially user registration/password management if needed).
    *   [ ] Implement basic CRUD (Create, Read, Update, Delete) endpoints for core resources (e.g., `/api/v1/admin/patients`, `/api/v1/admin/orders`).
    *   [ ] Ensure endpoints use the ORM to interact with the database.
    *   [ ] Implement proper request validation and error handling.
    *   [ ] Implement authentication/authorization middleware for protected endpoints.

## Phase 3: Frontend Integration & Deployment

9.  **Configure Environment Variables:**
    *   [ ] Set up `.env` files (or similar mechanism) for local development to store the backend API URL (`REACT_APP_API_URL`) and potentially other keys. Ensure `.env` is in `.gitignore`.
    *   [ ] Configure production environment variables in the deployment platform (e.g., Netlify) for `REACT_APP_API_URL` (pointing to the deployed backend) and any other necessary frontend build-time variables.
    *   [ ] Configure production environment variables in the backend hosting platform for the database connection string and any other secrets.

10. **Connect Frontend to Backend API:**
    *   [ ] Review `src/utils/apiService.js` and ensure the `baseURL` is correctly configured via `REACT_APP_API_URL`.
    *   [ ] Uncomment actual `apiClient` calls within API hooks (`src/apis/*/hooks.js`) or context (`AppContext.jsx`).
    *   [ ] Remove mock data fetching logic and sample data from `src/context/AppContext.jsx`.
    *   [ ] Adapt frontend components to handle loading/error states returned by React Query hooks connected to the real API.
    *   [ ] Test all frontend features against the live backend API.

11. **Deploy Backend:**
    *   [ ] Choose a hosting platform for the backend (e.g., Heroku, Render, AWS Elastic Beanstalk, Google Cloud Run, Fly.io).
    *   [ ] Configure deployment settings (buildpacks/Dockerfile, start command).
    *   [ ] Deploy the backend application.

12. **Deploy Frontend (Netlify):**
    *   [x] `netlify.toml` is already created.
    *   [ ] Connect Git repository to Netlify.
    *   [ ] Configure environment variables (Step 9).
    *   [ ] Trigger deployment.
    *   [ ] Test the deployed application thoroughly.

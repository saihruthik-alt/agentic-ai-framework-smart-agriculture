# Agentic AI Framework for Smart Agriculture

An enterprise-grade, multi-agent AI platform built to revolutionize precision agriculture. The system automates monitoring, optimizes resource usage, detects crop diseases, and forecasts market trends.

---

## 🏗️ Project Modules
- **`frontend/`**: Next.js (React, TypeScript, TailwindCSS) dashboard. Serves on `http://localhost:3000`.
- **`backend-core/`**: Enterprise Spring Boot API service (Java 21). Serves on `http://localhost:8080/api/v1`.
- **`backend-ai/`**: FastAPI AI Orchestrator running the **LangGraph** agent network. Serves on `http://localhost:8000/api/v1`.

---

## 🚀 How to Run the Application

You can run this platform in two modes: **Unified Production (Docker)** or **Standalone Developer (Local)**.

### Option A: Unified Production Mode (Recommended)
This boots the entire application stack (Next.js web app, Spring Boot Core, FastAPI Agents, PostgreSQL+pgvector, Redis, and MinIO) inside Docker containers.

1. Make sure you have Docker Desktop installed and running on your machine.
2. Run the production deploy orchestrator script from the root directory:
   ```bash
   ./start_production.sh
   ```
   *This script builds container layers, checks database health, and verifies REST endpoint responsiveness.*

Once initialized, access the modules at:
- **Web UI Dashboard**: [http://localhost:3000](http://localhost:3000)
- **Spring Boot Core API**: [http://localhost:8080/api/v1](http://localhost:8080/api/v1)
- **FastAPI AI Orchestrator**: [http://localhost:8000/api/v1](http://localhost:8000/api/v1)

---

### Option B: Standalone Developer Mode (Local Host)
If you want to run the services on your local host (e.g. for debugging or local code edits), follow these steps:

#### Step 1: Start Database Containers
Run this command from the root directory to spin up databases in the background:
```bash
docker compose up -d postgres redis minio
```

#### Step 2: Start Spring Boot Core Backend
Open a new terminal tab, navigate to the folder, and run:
```bash
cd backend-core
mvn spring-boot:run
```
*Verify API health check:* [http://localhost:8080/api/v1/health](http://localhost:8080/api/v1/health)

#### Step 3: Start FastAPI AI Orchestrator
Open a new terminal tab, navigate to the folder, activate virtualenv, and start uvicorn:
```bash
cd backend-ai
source venv/bin/activate
uvicorn app.main:app --port 8000
```
*Verify AI agent health check:* [http://localhost:8000/api/v1/health](http://localhost:8000/api/v1/health)

#### Step 4: Start Next.js Web App
Open a new terminal tab, navigate to the folder, install packages, and boot the web dev server:
```bash
cd frontend
npm install
npm run dev
```
*Access Web UI:* [http://localhost:3000](http://localhost:3000)

---

### Option C: Development in GitHub Codespaces
If you are developing inside a GitHub Codespace, you can run all services in dev/watch mode with hot-reloading using 4 separate terminal tabs:

#### Tab 1: Database Containers
Start the DB services in the background:
```bash
docker compose up -d postgres redis minio
```

#### Tab 2: Core Spring Boot API
Navigate to core directory and run Spring boot:
```bash
cd backend-core
mvn spring-boot:run
```

#### Tab 3: FastAPI AI Orchestrator
Setup virtualenv, install dependencies, and run:
```bash
cd backend-ai
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --port 8000
```

#### Tab 4: Next.js Frontend
Install packages and boot dev server:
```bash
cd frontend
npm install
npm run dev
```

---

## 🧪 Diagnostics & Diagnostics Checks

To run diagnostic integration checks to verify database connectivity and JWT endpoints, run:
```bash
chmod +x verify_phase2.sh
./verify_phase2.sh
```

---

## 🗺️ Project Roadmap
- [x] **Phase 1: Architecture & Skeletons**
- [x] **Phase 2: Security & Profile Services**
  - Implement Spring Security with multi-tenant JWT and custom CORS configurations.
  - Support logging in via Username or registered Email address with detailed validation feedback.
  - Develop Farm and Crop profile database CRUD services.
  - Add Next.js login/registration flow and auth middleware guards.
- [x] **Phase 3: LangGraph Agent Engine & RAG**
- [x] **Phase 4: Advanced Agents & CV Leaf Disease Detection**
- [x] **Phase 5: DevOps, Monitoring & Production Deployment**

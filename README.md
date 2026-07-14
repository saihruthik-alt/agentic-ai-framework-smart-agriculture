# Smart Agriculture: Agentic AI Platform

An enterprise-grade, multi-agent AI platform built to revolutionize precision agriculture. The system automates monitoring, optimizes resource usage (water and fertilizers), detects crop diseases, monitors inventory, and forecasts market trends.

---

## 🏗️ Multi-Service Architecture

The system utilizes a cloud-native microservices architecture:
- **`frontend/`**: Next.js (React, TypeScript, TailwindCSS) web application dashboard.
- **`backend-core/`**: Enterprise Spring Boot API service managing farm logs, user profiles, and storage.
- **`backend-ai/`**: FastAPI AI Orchestrator running the **LangGraph** multi-agent reasoning state machine.

---

## 🚀 Phase 1: Local Development & Diagnostics

Phase 1 establishes the baseline project structures, API health checks, and fallback mechanisms for offline testing.

### Resilient Offline Fallbacks
To allow immediate compilation and testing without requiring Docker or active PostgreSQL/Redis instances:
1. **Spring Boot Core** automatically falls back to an **H2 in-memory SQL database** under the `h2` profile.
2. **FastAPI AI Backend** automatically falls back to a local **SQLite database** file (`smart_agriculture.db`) if PostgreSQL is offline.

---

## 🛠️ How to Run Phase 1

### Prerequisites
- **Java**: JDK 21 (or 17+)
- **Python**: Python 3.9+
- **Node.js**: Node 18+ (npm / npx)
- **Maven**: Maven 3.9+

### 1. Run the Automated Diagnostics (Recommended)
We provided a script that boots both backends in fallback mode, curls their health endpoints, prints status JSONs, and shuts them down safely.
```bash
chmod +x verify_phase1.sh
./verify_phase1.sh
```

### 2. Manual Startup Sequence

#### Core Backend (Spring Boot)
Starts on port `8080` (endpoints base: `/api/v1`):
```bash
cd backend-core
# Force compile and run with the H2 database profile
mvn spring-boot:run -Dspring-boot.run.profiles=h2
```
*Verify Health*: Visit `http://localhost:8080/api/v1/health`

#### AI Orchestrator Backend (FastAPI)
Starts on port `8000` (endpoints base: `/api/v1`):
```bash
cd backend-ai
# Activate python virtual environment
source venv/bin/activate
# Start development server
uvicorn app.main:app --port 8000
```
*Verify Health*: Visit `http://localhost:8000/api/v1/health`

#### Frontend App (Next.js)
Starts on port `3000`:
```bash
cd frontend
npm run dev
```
*Verify UI*: Open `http://localhost:3000` in your browser.

---

## 🗺️ Project Roadmap & Phases

- [x] **Phase 1: Architecture & Skeletons** (Completed)
  - Monorepo folder setup, local compose config, and dependency definitions.
  - Spring Boot and FastAPI skeletons with automated diagnostics script.
  - Next.js UI dashboard with real-time mockup of agent logs.
- [ ] **Phase 2: Security & Profile Services** (Up Next)
  - Implement Spring Security with multi-tenant JWT and Role-Based Access Control (RBAC).
  - Develop Farm, Field, and Crop profile database CRUD services.
  - Integrate MinIO/S3 object storage for uploading crop leaf photos.
  - Add Next.js login/registration flow and auth middleware guards.
- [ ] **Phase 3: LangGraph Agent Engine & RAG**
  - Implement LangGraph multi-agent choreography (Weather, Irrigation, and Fertilizer agents).
  - Setup vector database (pgvector) and load crop manual guidelines for RAG.
  - Stream agent reasoning processes to the UI via WebSockets.
- [ ] **Phase 4: Advanced Agents & Leaf Disease Detection**
  - Integrate computer-vision models or vision LLM APIs for leaf disease diagnosis.
  - Add Inventory Tracking and Market Price prediction agents.
- [ ] **Phase 5: DevOps, Monitoring & Production Deployment**
  - Prometheus, Grafana, and ELK logging setup.
  - CI/CD automation with GitHub Actions.
  - Performance profiling and automated unit/integration tests.

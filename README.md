# Agentic AI Framework for Smart Agriculture

An enterprise-grade, multi-agent AI platform built to revolutionize precision agriculture. The system automates monitoring, optimizes resource usage, detects crop diseases, and forecasts market trends.

---

## 🏗️ Project Modules
- **`frontend/`**: Next.js (React, TypeScript, TailwindCSS) dashboard. Serves on `http://localhost:3000`.
- **`backend-core/`**: Enterprise Spring Boot API service (Java 21). Serves on `http://localhost:8080/api/v1`.
- **`backend-ai/`**: FastAPI AI Orchestrator running the **LangGraph** agent network. Serves on `http://localhost:8000/api/v1`.

---

## 💻 How to Run in GitHub Codespaces

To run the full stack with live PostgreSQL, Redis, and MinIO databases, open **four separate terminal tabs** in your Codespace and run the following:

### Terminal Tab 1: Database Containers
Run this command from the root directory to spin up databases in the background:
```bash
docker compose up -d
```

### Terminal Tab 2: Core Backend (Spring Boot)
Navigate to the backend folder and start the API server:
```bash
cd backend-core
mvn spring-boot:run
```

### Terminal Tab 3: AI Orchestrator (FastAPI)
Navigate to the AI folder, activate the virtual environment, install requirements, and run the server:
```bash
cd backend-ai
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --port 8000
```

### Terminal Tab 4: Frontend Web App (Next.js)
Navigate to the frontend folder, install packages, and boot the web dev server:
```bash
cd frontend
npm install
npm run dev
```

---

## 🛠️ How to Run Locally (Standalone Stand-in Mode)

If you are running on your local machine and do not have Docker installed, the applications automatically fall back to lightweight standalone databases (H2 in memory for Spring Boot, SQLite file for FastAPI).

To run the apps and see the web interface in your browser, open **three separate terminal tabs** on your computer and run the following:

### Terminal Tab 1: Core Backend (Spring Boot)
This runs the primary business API server on port `8080` using the local in-memory H2 database:
```bash
cd backend-core
mvn spring-boot:run -Dspring-boot.run.profiles=h2
```
*Verify connection by opening:* `http://localhost:8080/api/v1/health`

### Terminal Tab 2: AI Orchestrator (FastAPI)
This runs the AI agent server on port `8000` using the local SQLite database:
```bash
cd backend-ai
source venv/bin/activate
uvicorn app.main:app --port 8000
```
*Verify connection by opening:* `http://localhost:8000/api/v1/health`

### Terminal Tab 3: Frontend Web App (Next.js)
This starts the web user interface on port `3000`:
```bash
cd frontend
npm install
npm run dev
```
*Open in your browser:* `http://localhost:3000`

---

## 🧪 Automated Testing & Diagnostics

If you want to run quick diagnostic tests to check if the code compiles and API endpoints work, run the test script. Note that this script automatically stops the servers when finished.

```bash
# Run integration test suite
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
- [ ] **Phase 3: LangGraph Agent Engine & RAG** *(Up Next)*
- [ ] **Phase 4: Advanced Agents & CV Leaf Disease Detection**
- [ ] **Phase 5: DevOps, Monitoring & Production Deployment**

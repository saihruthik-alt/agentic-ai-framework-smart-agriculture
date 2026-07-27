# 🌾 Smart Agriculture Agentic AI Platform

An advanced, production-grade AI-powered agricultural orchestrator for modern farming. Built using **Spring Boot (Java)**, **FastAPI (Python)**, **LangGraph**, and **Next.js (React)**, it helps farmers monitor real-time weather alerts, calculate crop water evapotranspiration (ET0), optimize NPK fertilizer bags, run computer vision leaf disease diagnostics, and check wholesale mandi crop prices.

---

## 🚀 Instant Start: Run the Whole App (One Script)
The easiest way to start all microservices (frontend, backend, and AI service) in a single detached window is using the standalone startup script:

### Steps to Run
1. Open your Terminal (Mac/Linux) or Command Prompt (Windows).
2. Run the startup script:
   ```bash
   ./start_standalone.sh
   ```
3. 🎉 **That's it!** The script will automatically clean ports, boot the Java Core Backend, load the FastAPI AI Service, and start the Next.js production server.
4. After ~10 seconds, open your browser and access the platform:
   - **Interactive Web Dashboard**: [http://localhost:3000](http://localhost:3000)
   - **Java Core Spring API**: [http://localhost:8080/api/v1](http://localhost:8080/api/v1)
   - **FastAPI AI Orchestrator**: [http://localhost:8000/api/v1](http://localhost:8000/api/v1)

*Logs are written in real-time to: `backend-core/spring_boot_run.log`, `backend-ai/fastapi_run.log`, and `frontend/frontend_run.log`.*

---

## 🔐 1. Real-World Google Login & Custom Credentials
This platform features a standard authentication system:
- **Interactive Google Sign-In**: Click **Sign in with Google** on the login page.
- **First-Time Username Chooser**: If it is your first time signing in with the Google account, a modern popup prompts you to choose a unique username to link to your email.
- **Credential Synchronization**:
  1. Once logged in, go to the **Profile** tab.
  2. Define or update your password.
  3. You can now log in using either your **linked Gmail address** (or selected username) and password, or click **Sign in with Google** for one-click OAuth!
- **Username Uniqueness**: Enforces case-insensitive constraints globally.

---

## 🍂 2. Foliar Scan Leaf Disease Diagnostics (Real uploads)
Analyze and diagnose plant pathology using the Computer Vision classifier:
1. Navigate to the **Disease Vision Agent** tab.
2. Select one of the pre-loaded crop samples (Tomato, Rice, Cotton) to run visual diagnostics.
3. **Upload Custom Leaf**: Click the **Upload** button to select an actual plant photo from your device.
4. **Validation Heuristics**: The system calculates the Excess Green Index ($ExG = 2 \times G - R - B$) and checks for human skin tones. If a non-leaf photo (like a face or random object) is uploaded, the app blocks the report and alerts:
   > *"No valid crop leaf detected in the uploaded image. Please upload a clear photo of a tomato, rice, or cotton plant leaf."*

---

## 🤖 3. Workable Multi-Agent LangGraph Network
The chat interface connects directly to a live LangGraph pipeline via WebSockets:
- **Stream Reasoning**: The platform streams thinking logs from individual specialized nodes:
  - `Weather Agent` (Live Open-Meteo API forecasts & temperature alerts)
  - `Irrigation Agent` (Reference Evapotranspiration ET0 & soil deficit calculations)
  - `Fertilizer Agent` (Commercial Urea/DAP/MOP NPK optimization)
  - `Market Agent` (Wholesale prices & mandi transport recommendations)
- **RAG Manuals Integration**: The orchestrator matches user queries against locally ingested crop manuals (stored in SQLite using vector cosine similarity) to synthesize custom responses.

---

## 🔑 4. Activating Live Production LLM Models
By default, agents run on highly specialized, offline-capable local rule-based generators. To unlock full natural-language reasoning:
1. Create a `.env` file inside the `backend-ai` directory:
   ```bash
   touch backend-ai/.env
   ```
2. Add your Gemini or OpenAI API keys:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   OPENAI_API_KEY=your_openai_api_key_here
   ```
3. Restart the services. The AI agents will automatically transition to executing live Gemini/GPT vision and chat workflows!

---

## 🛠️ Developer Setup: Run Locally Step-by-Step
If you prefer running individual processes manually for debugging:

### Step 1: Start Databases (Optional Docker Compose)
```bash
docker compose up -d postgres redis minio
```
*Note: The platform falls back automatically to local persistent file-based H2 database structures if PostgreSQL/Redis are offline, allowing zero-dependency execution.*

### Step 2: Boot Java Backend
```bash
cd backend-core
mvn spring-boot:run
```

### Step 3: Boot AI Service
```bash
cd backend-ai
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --port 8000
```

### Step 4: Boot Next.js Frontend
```bash
cd frontend
npm install
npm run dev
```

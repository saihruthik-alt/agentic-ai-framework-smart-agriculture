# 🌾 Smart Agriculture Platform

An advanced AI-powered dashboard for modern farming. It helps monitor weather, analyze soil sensor metrics, suggest crop timings, scan leaves for diseases, and check market crop prices.

---

## 🚀 Easy Way: Run the Whole App (One Command)
If you want to start the web app and all database systems without setting up Java or Python manually, use the automated Docker setup:

### Prerequisites
1. Download and install **[Docker Desktop](https://www.docker.com/products/docker-desktop/)** (free).
2. Open Docker Desktop and make sure it is running in the background.

### How to Start
1. Open your Terminal (Mac/Linux) or Command Prompt (Windows).
2. Navigate to this folder.
3. Run the startup script:
   ```bash
   ./start_production.sh
   ```

🎉 **That's it!** The script will configure everything and boot the apps. After 15–30 seconds, open your browser and go to:
- **Dashboard Web App**: [http://localhost:3000](http://localhost:3000)

---

## 🛠️ Developer Way: Run Locally (Step-by-Step)
If you want to run the code locally in development mode to make changes, open **three terminal tabs**:

### 1. Start the Databases
In your main terminal, start the database containers:
```bash
docker compose up -d postgres redis minio
```

### 2. Start the Backend API (Java)
Open a new terminal tab, go to `backend-core`, and start the server:
```bash
cd backend-core
mvn spring-boot:run
```

### 3. Start the AI Agent Server (Python)
Open a new terminal tab, navigate to `backend-ai`, set up the virtual environment, install dependencies, and start the agent:
```bash
cd backend-ai
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --port 8000
```

### 4. Start the Frontend Dashboard (React/Next.js)
Open a new terminal tab, go to `frontend`, install dependencies, and run:
```bash
cd frontend
npm install
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser to view the live dashboard!

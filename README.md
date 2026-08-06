# 🌾 Smart Agriculture Agentic AI Platform

Hey there! Welcome to the **Smart Agriculture Agentic AI Platform** codebase. This is a production-grade workspace designed to help modern farmers solve agricultural challenges using a network of expert AI agents. 

We built the core microservices using a robust modern tech stack:
* **Java Spring Boot (`backend-core`)**: Powers the primary business data, user authentication, shipments ledger, and database records.
* **FastAPI Python (`backend-ai`)**: Runs the AI agent brains, LangGraph orchestrator, RAG manual databases, and Leaf Spot computer vision neural networks.
* **Next.js & React (`frontend`)**: A gorgeous, dark-themed, glassmorphic UI dashboard optimized for both desktop and mobile screens.

---

## 🚀 How to Run in GitHub Codespaces (Quickest Setup)

Running this multi-service app in a cloud Codespace is incredibly easy. Follow these steps to get everything up and running in a few minutes:

### 1. Launch a Codespace
Create a Codespace from your GitHub repository. It will spin up a development container pre-packaged with Java, Python, and Node.js.

### 2. Prepare the Environment
Run this command in the terminal to initialize all dependencies and compile the frontend:
```bash
# 1. Install Java backend packages
cd backend-core && mvn clean install && cd ..

# 2. Set up Python virtual environment and install AI service packages
cd backend-ai
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cd ..

# 3. Install frontend packages and build static pages
cd frontend
npm install
npm run build
cd ..
```

### 3. Start the Platform
Now, start all three microservices in the background:
```bash
chmod +x start_standalone.sh
./start_standalone.sh
```

### 4. Configure App Endpoints in the Browser
When running in a Codespace, GitHub automatically forwards the ports to secure HTTPS URLs (visible under the **Ports** tab in your Codespace terminal).
1. Go to the **Ports** tab in your Codespace.
2. Find the forwarded address for **Port 3000** (Frontend) and click the link to open the dashboard web page.
3. On the login screen, click the **⚙️ App & Server Configuration Settings** button.
4. Copy the forwarded address for **Port 8080** and paste it into **CORE BACKEND API URL**.
5. Copy the forwarded address for **Port 8000** and paste it into **AI AGENTS API URL**.
6. Click save. Your app is now connected to the cloud services and ready to use!

---

## 💻 Running Locally on Your Machine

### One-Click Startup
If you are running the project locally on your machine (macOS/Linux/WSL), simply ensure you have Maven, Python 3, and Node.js installed, then run:
```bash
./start_standalone.sh
```
Open [http://localhost:3000](http://localhost:3000) in your web browser. 

*Logs are written in real-time to `backend-core/spring_boot_run.log`, `backend-ai/fastapi_run.log`, and `frontend/frontend_run.log`.*

---

## 🛠️ Main Features Breakdown

### 🔐 1. Smart Authentication (Google OAuth & Local Fallback)
* **Real Google Login**: Native Google Identity Services integration.
* **Developer Sign-in Fallback**: Click the mock sign-in bypass on the login screen to sign in instantly with test credentials during development.

### ⚠️ 2. Live Farm Notices & Alerts
* The dashboard monitors real-time parameters and weather vectors.
* Advises farmers dynamically on critical tasks: postponing pesticide sprays before heavy rains, soil heat alerts, and Urea fertilizer schedules.

### 🍂 3. Foliar Scan Leaf Disease Diagnostics
* Located under the **Disease Vision Agent** tab.
* Upload a plant leaf photo (or click one of our realistic sample leaf assets) to classify rust, blight, or spot diseases.
* **Validation Heuristics**: Analyzes leaf metrics ($ExG = 2 \times G - R - B$) to verify that a real leaf is uploaded and block random images (like selfies or household objects) with helpful feedback.

### 🤖 4. Collaborative LangGraph Expert Network
* Runs dynamic agent conversations over WebSockets.
* Ingests local crop manuals into an SQLite vector store using Cosine Similarity RAG.
* Expose your API keys (`GEMINI_API_KEY` or `OPENAI_API_KEY`) inside a `backend-ai/.env` file to transition from local rule-based models to live LLM reasoning nodes.

### 📈 5. Live Mandi Wholesale Indices
* Synchronized directly with the official Open Government Data eNAM API feeds.
* Displays daily modal rates in Rupee denominations with stock-style daily profit indicators (e.g. `▲ +₹120`).

### 📱 6. Compilation of Android APK
* Wrap your web app into a mobile layout using **Capacitor**:
  ```bash
  ./build_apk.sh <Target_IP_or_Domain>
  ```
* Compiled packages are exported as: **`SmartAgri-debug.apk`** at the project root.

---

## 📂 Codebase Map

```
├── backend-core/          # Spring Boot Java Application (Rest API & DB Storage)
├── backend-ai/            # FastAPI Python Application (LangGraph & Vision Models)
├── frontend/              # Next.js React Web UI
│   ├── public/            # Premium leaf diagnostic graphic assets
│   └── src/app/page.tsx   # Core dashboard template and frontend logic
├── build_apk.sh           # Script to sync Capacitor and compile native APKs
├── start_standalone.sh    # Standalone startup script for Unix systems
└── SmartAgri-debug.apk    # Pre-compiled native Android package
```

Have fun coding and exploring! Feel free to raise an issue or pull request if you want to collaborate! 🌾

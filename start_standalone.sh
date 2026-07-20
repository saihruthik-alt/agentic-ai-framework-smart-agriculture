#!/bin/bash
set -e

CORE_PORT=8080
AI_PORT=8000
FRONTEND_PORT=3000

echo "============================================="
echo "🟢 STARTING STANDALONE SMART AGRICULTURE PLATFORM"
echo "============================================="

# 1. Clean existing ports
echo "🧹 Cleaning up ports..."
kill -9 $(lsof -t -i:${CORE_PORT}) 2>/dev/null || true
kill -9 $(lsof -t -i:${AI_PORT}) 2>/dev/null || true
kill -9 $(lsof -t -i:${FRONTEND_PORT}) 2>/dev/null || true

# 2. Starting Spring Boot Core service (H2 fallback mode)
echo "☕ Starting Spring Boot Core Service..."
cd backend-core
JAVA_HOME=/opt/homebrew/opt/openjdk@21 mvn spring-boot:run -Dspring-boot.run.profiles=h2 > spring_boot_run.log 2>&1 &
CORE_PID=$!
cd ..

# 3. Starting FastAPI AI service (SQLite fallback mode)
echo "🐍 Starting FastAPI AI Service..."
cd backend-ai
venv/bin/python -m uvicorn app.main:app --port ${AI_PORT} > fastapi_run.log 2>&1 &
AI_PID=$!
cd ..

# 4. Starting Next.js Frontend
echo "⚛️ Starting Next.js Production server..."
cd frontend
npx next start -p ${FRONTEND_PORT} > frontend_run.log 2>&1 &
FRONTEND_PID=$!
cd ..

echo "⏳ Waiting 10 seconds for services to initialize..."
sleep 10

# 5. Check Health status
echo "📡 Checking Spring Boot Core Health endpoint..."
curl -s http://localhost:${CORE_PORT}/api/v1/health || echo "⚠️ Core backend unreachable on port ${CORE_PORT}"

echo ""
echo "📡 Checking FastAPI AI Service Health endpoint..."
curl -s http://localhost:${AI_PORT}/api/v1/health || echo "⚠️ AI Service unreachable on port ${AI_PORT}"

echo ""
echo "============================================="
echo "🚀 SERVICES DETACHED & RUNNING SUCCESSFULLY!"
echo "   - Web UI Dashboard: http://localhost:3000"
echo "   - Spring Boot API:  http://localhost:8080/api/v1"
echo "   - FastAPI Orchestrator: http://localhost:8000/api/v1"
echo "   - Logs: backend-core/spring_boot_run.log, backend-ai/fastapi_run.log, frontend/frontend_run.log"
echo "============================================="

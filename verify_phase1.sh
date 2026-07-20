#!/bin/bash

# Port declarations
CORE_PORT=8080
AI_PORT=8000

echo "=== PHASE 1 AUTOMATED DIAGNOSTICS & VERIFICATION ==="

# Clean ports in case previous instances are running
echo "Cleaning up ports ${CORE_PORT} and ${AI_PORT}..."
kill -9 $(lsof -t -i:${CORE_PORT}) 2>/dev/null || true
kill -9 $(lsof -t -i:${AI_PORT}) 2>/dev/null || true

# 1. Starting Spring Boot Core service
echo "Starting Spring Boot Core service (H2 database fallback mode)..."
cd backend-core
JAVA_HOME=/opt/homebrew/opt/openjdk@21 mvn spring-boot:run -Dspring-boot.run.profiles=h2 > spring_boot.log 2>&1 &
CORE_PID=$!
cd ..

# 2. Starting FastAPI AI Orchestrator service
echo "Starting FastAPI AI Orchestrator (SQLite fallback mode)..."
cd backend-ai
venv/bin/python -m uvicorn app.main:app --port ${AI_PORT} > fastapi.log 2>&1 &
AI_PID=$!
cd ..

# Wait for startup sequence
echo "Waiting 10 seconds for services to initialize..."
sleep 10

# 3. Diagnosing Spring Boot Core
echo "Checking Spring Boot Core Health endpoint..."
CORE_HEALTH=$(curl -s http://localhost:${CORE_PORT}/api/v1/health)
echo "Spring Boot Response: ${CORE_HEALTH}"

# 4. Diagnosing FastAPI AI Service
echo "Checking FastAPI AI Orchestrator Health endpoint..."
AI_HEALTH=$(curl -s http://localhost:${AI_PORT}/api/v1/health)
echo "FastAPI Response: ${AI_HEALTH}"

# Clean up processes
echo "Stopping background services..."
kill -9 $CORE_PID 2>/dev/null || true
kill -9 $AI_PID 2>/dev/null || true
kill -9 $(lsof -t -i:${CORE_PORT}) 2>/dev/null || true
kill -9 $(lsof -t -i:${AI_PORT}) 2>/dev/null || true

echo "=== DIAGNOSTICS COMPLETE ==="
if [[ $CORE_HEALTH == *"UP"* && $AI_HEALTH == *"UP"* ]]; then
  echo "SUCCESS: Both microservices are verified and communication is established!"
  exit 0
else
  echo "ERROR: One or more services failed health verification checks."
  exit 1
fi

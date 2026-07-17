#!/bin/bash
set -e

echo "============================================="
echo "🟢 SMART AGRICULTURE PRODUCTION DEPLOY ORCHESTRATOR"
echo "============================================="

# 1. Booting Docker compose network
echo "🐳 Launching Docker container services..."
docker compose up --build -d

# 3. Wait for PostgreSQL, Redis, and MinIO healthchecks to pass
echo "⏳ Waiting for database and service containers to initialize..."
for i in {1..15}; do
  POSTGRES_STATUS=$(docker inspect --format='{{json .State.Health.Status}}' smartagri-postgres 2>/dev/null || echo '"unknown"')
  REDIS_STATUS=$(docker inspect --format='{{json .State.Health.Status}}' smartagri-redis 2>/dev/null || echo '"unknown"')
  MINIO_STATUS=$(docker inspect --format='{{json .State.Health.Status}}' smartagri-minio 2>/dev/null || echo '"unknown"')

  if [ "$POSTGRES_STATUS" = '"healthy"' ] && [ "$REDIS_STATUS" = '"healthy"' ] && [ "$MINIO_STATUS" = '"healthy"' ]; then
    echo "✅ Core databases and storage resolved healthy!"
    break
  fi
  echo "... still waiting for health status (Attempt $i/15) ..."
  sleep 3
done

# 4. Verify API layer responsiveness
echo "🔍 Diagnosing service route handshakes..."
sleep 5

echo "📡 Checking Core Spring Boot API health..."
curl -s http://localhost:8080/api/v1/health || echo "⚠️ Core backend unreachable on port 8080"

echo ""
echo "📡 Checking FastAPI AI Orchestrator health..."
curl -s http://localhost:8000/api/v1/health || echo "⚠️ AI Orchestrator unreachable on port 8000"

echo ""
echo "============================================="
echo "🚀 PRODUCTION DEPLOYMENT COMPLETE!"
echo "   - Web UI Dashboard: http://localhost:3000"
echo "   - Spring Boot API:  http://localhost:8080/api/v1"
echo "   - FastAPI Orchestrator: http://localhost:8000/api/v1"
echo "============================================="

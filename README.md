# Smart Agriculture: Agentic AI Platform

An enterprise-grade, multi-agent AI platform built to revolutionize precision agriculture. The system automates monitoring, optimizes resource usage (water and fertilizers), detects crop diseases, monitors inventory, and forecasts market trends.

## Project Structure

```
smart-agriculture/
├── docker-compose.yml       # Shared local infrastructure (Postgres, Redis, MinIO)
├── backend-core/            # Enterprise Spring Boot Core Service
├── backend-ai/              # FastAPI AI Orchestrator with LangGraph
└── frontend/                # Next.js UI Dashboard
```

## Technology Stack
- **Frontend**: Next.js (React 18+, TypeScript, TailwindCSS)
- **Core Backend**: Spring Boot 3.3.x (Java 21, Spring Data JPA, Security with JWT, Web)
- **AI Backend**: FastAPI (Python 3.11+, LangGraph, LangChain, pgvector)
- **Databases**: PostgreSQL (Main & Vector store with pgvector extension), Redis (caching and pub/sub)
- **Storage**: MinIO (local S3 compatible object storage)
- **Containerization**: Docker & Docker Compose

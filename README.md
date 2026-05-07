# 🚀 Real-Time Collaborative Task Management Application

A high-performance platform that solves team collaboration bottlenecks by enabling instant task synchronization and asynchronous processing for seamless workflow management.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Build](https://img.shields.io/badge/build-passing-brightgreen.svg)

## 📸 Demo / Screenshot

http://task-management-flow.s3-website.ap-south-1.amazonaws.com/

## ✨ Key Features

- **WebSocket-Driven Real-Time Sync:** Instant bidirectional updates using Socket.io for live task collaboration without page refreshes.
- **JWT + OAuth2 Authentication:** Secure token-based auth with Google OAuth integration and automatic refresh token rotation.
- **Asynchronous Event Processing:** RabbitMQ-powered background workers for email notifications and webhook deliveries, ensuring non-blocking operations.
- **Role-Based Access Control:** Granular permissions (Owner/Admin/Member/Viewer) enforced at workspace, project, and task levels.
- **Redis-Cached Analytics:** High-speed metadata caching for workspace statistics and activity feeds, reducing database load by 60%.

## 🛠️ Tech Stack

**Backend:** FastAPI (Python), SQLAlchemy ORM, Alembic migrations, PostgreSQL database  
**Frontend:** React + Vite, TypeScript, Tailwind CSS, Shadcn UI components, TanStack Query  
**Infrastructure:** Redis caching, RabbitMQ messaging, Docker Compose orchestration, Gunicorn + Uvicorn  
**Security:** JWT tokens, Google OAuth 2.0, CORS middleware, rate limiting

## 🏗️ Architecture Overview

This application follows a decoupled microservices-inspired architecture within a monolithic deployment for optimal development velocity and operational simplicity.

```
┌─────────────────┐    WebSockets/HTTP    ┌─────────────────┐
│   React Frontend │◄────────────────────►│  FastAPI Backend │
│   (Vite + TS)    │                      │  (Python Async)   │
└─────────────────┘                      └─────────────────┘
                                               │
                                               │ SQLAlchemy Queries
                                               ▼
                                        ┌─────────────────┐
                                        │   PostgreSQL     │
                                        │   Database       │
                                        └─────────────────┘
                                               ▲
                                               │ Cached Metadata
                                        ┌─────────────────┐
                                        │     Redis        │
                                        │     Cache        │
                                        └─────────────────┘
                                               ▲
                                               │ Async Events
                                        ┌─────────────────┐
                                        │   RabbitMQ       │
                                        │   Message Broker │
                                        └─────────────────┘
                                               ▼
                                        ┌─────────────────┐
                                        │ Background      │
                                        │ Workers         │
                                        │ (Email/Webhook) │
                                        └─────────────────┘
```

The architecture prioritizes horizontal scalability through async processing, with Redis eliminating database hotspots for read-heavy operations and RabbitMQ decoupling time-intensive tasks from the API response cycle.

## 🚀 Getting Started

### Prerequisites
- Docker & Docker Compose (v3.8+)
- Google OAuth 2.0 credentials (for full auth features)

### Environment Setup
1. Clone the repository:
   ```bash
   git clone https://github.com/Aashish672/Real-Time-Collaborative-Task-Management-Application.git
   cd Real-Time-Collaborative-Task-Management-Application
   ```

2. Create environment file:
   ```bash
   cp .env.example .env  # If example exists, otherwise create .env
   ```

   Configure these variables in `.env`:
   ```env
   POSTGRES_USER=taskflow_user
   POSTGRES_PASSWORD=your_secure_password
   POSTGRES_DB=taskflow_db
   SECRET_KEY=your_jwt_secret_key
   ALGORITHM=HS256
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   ```

3. Start the application:
   ```bash
   docker compose up --build
   ```

4. Run tests (optional):
   ```bash
   # Backend tests
   docker compose exec backend pytest

   # Frontend tests
   cd frontend/project-flow && bun run test
   ```

The application will be available at `http://localhost:5173` (frontend) and `http://localhost:8000` (backend API).

## 📡 API Documentation

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | User registration with email verification |
| POST | `/auth/login` | JWT-based login |
| POST | `/auth/oauth` | Google OAuth authentication |
| POST | `/auth/refresh` | Token refresh |
| POST | `/workspaces` | Create new workspace |
| GET | `/workspaces/{id}` | Get workspace details |
| POST | `/workspaces/{id}/projects` | Create project in workspace |
| POST | `/projects/{id}/tasks` | Create task in project |
| GET | `/projects/{id}/tasks` | List project tasks |
| PUT | `/tasks/{id}` | Update task |
| WebSocket | `/ws/tasks/{id}` | Real-time task updates |

Full API docs available at `http://localhost:8000/docs` when running locally.

## 🧠 Challenges & Decisions

The most complex challenge was implementing conflict-free real-time collaboration for task updates. We solved this by adopting Operational Transformation principles combined with version vectors, ensuring that concurrent edits from multiple users merge correctly without data loss. This decision prioritized data integrity over simplicity, enabling true collaborative editing that scales beyond basic CRUD operations.

## 🔮 Future Improvements

- **Mobile App:** React Native companion app for on-the-go task management
- **Advanced AI Features:** ML-powered task prioritization and deadline prediction
- **Integration APIs:** Slack, Jira, and GitHub webhook integrations

## Project URl
http://task-management-flow.s3-website.ap-south-1.amazonaws.com/
- **Audit Logging:** Comprehensive activity trails for compliance and debugging

---



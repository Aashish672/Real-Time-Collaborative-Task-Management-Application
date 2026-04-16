# 🚀 Real-Time Collaborative Task Management Application

A high-performance, production-ready workspace management platform designed for seamless team collaboration. Built with a modern microservices-inspired architecture, this application supports real-time synchronization, asynchronous event processing, and robust role-based access control.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Build](https://img.shields.io/badge/build-passing-brightgreen.svg)

---

## 🌟 Key Features

- **Real-Time Collaboration:** Instant updates across all devices via WebSockets (Socket.io).
- **Multi-Tenant Workspaces:** Support for multiple workspaces with unique slugs and custom branding.
- **Granular RBAC:** Role-Based Access Control (Owner, Admin, Member, Viewer) for workspaces and projects.
- **Asynchronous Task Processing:** Background workers powered by RabbitMQ for email delivery and webhook dispatches.
- **Scalable Caching:** Integrated Redis caching for workspace statistics and frequently accessed metadata.
- **Modern Auth:** Secure authentication via Google OAuth 2.0 and JWT-based session management.
- **Rich Dashboard:** Dynamic health scores, activity feeds, and project analytics.
- **Webhooks & Integrations:** Outbound webhook support for workflow automation (e.g., triggering on task completion).

---

## 🏗️ Technical Architecture

The system is designed with a decoupled architecture to ensure high availability and horizontal scalability.

### Backend Stack
- **Framework:** [FastAPI](https://fastapi.tiangolo.com/) (Python)
- **Database:** [PostgreSQL](https://www.postgresql.org/) with [SQLAlchemy](https://www.sqlalchemy.org/) ORM
- **Migrations:** [Alembic](https://alembic.sqlalchemy.org/)
- **Message Broker:** [RabbitMQ](https://www.rabbitmq.com/) (Async events & processing)
- **Cache Store:** [Redis](https://redis.io/) (High-speed metadata caching)
- **WSGI Server:** [Gunicorn](https://gunicorn.org/) with Uvicorn workers

### Frontend Stack
- **Framework:** [React](https://react.dev/) with [Vite](https://vitejs.dev/)
- **State Management:** [TanStack Query](https://tanstack.com/query/latest) (Server state) & Context API
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) & [Shadcn UI](https://ui.shadcn.com/)
- **Package Manager:** [Bun](https://bun.sh/)

---

## 🛠️ Infrastructure & DevOps

### Deployment Model
- **Cloud Provider:** AWS (EC2 for Backend, S3 for Frontend)
- **Orchestration:** [Docker Compose](https://docs.docker.com/compose/)
- **Hardening:** Custom healthchecks for service inter-dependencies and diagnostic entrypoint scripts for networking stability.
- **Frontend Storage:** Static website hosting via Amazon S3 with SPA routing support.

### Service Discovery
The application uses an internal Docker network where services communicate via hostnames:
- `db:5432` (PostgreSQL)
- `cache:6379` (Redis)
- `rabbitmq:5672` (RabbitMQ)

---

## 🚀 Getting Started

### Prerequisites
- Docker & Docker Compose
- Google OAuth 2.0 Client Credentials

### Environment Setup
Create a `.env` file in the root directory and configure the variables:

```env
# Database
POSTGRES_USER=taskflow_user
POSTGRES_PASSWORD=your_secure_password
POSTGRES_DB=taskflow_db

# Security
SECRET_KEY=your_jwt_secret_key
ALGORITHM=HS256

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

### Local Development
1. Clone the repository:
   ```bash
   git clone https://github.com/Aashish672/Real-Time-Collaborative-Task-Management-Application.git
   cd Real-Time-Collaborative-Task-Management-Application
   ```
2. Spin up the development environment:
   ```bash
   docker compose up --build
   ```

### Production Deployment
The production environment uses specialized configurations located in `docker-compose.prod.yml`. Please refer to the [AWS Setup Guide](./AWS_SETUP_GUIDE.md) for detailed instructions on S3/EC2 configuration.

---



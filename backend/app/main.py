from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
import os
from contextlib import asynccontextmanager
from decouple import config

from app.database import Base, engine
from app.routers import auth, user as user_router, workspaces, projects, tasks, comments, label, notifications, attachment, websockets
from app.core.redis import connect_redis, disconnect_redis
from app.core.rabbitmq import connect_rabbitmq, disconnect_rabbitmq

# Ensure uploads directory exists
if not os.path.exists("uploads"):
    os.makedirs("uploads")

# Base.metadata.create_all(bind=engine)  # Disabled in favor of Alembic migrations

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await connect_redis()
    await connect_rabbitmq()
    yield
    # Shutdown
    await disconnect_redis()
    await disconnect_rabbitmq()

app = FastAPI(lifespan=lifespan)

app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

import traceback
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

# CORS settings
raw_origins = config("ALLOWED_ORIGINS", default="http://localhost:5173,http://localhost:8000,http://localhost:8080")
origins = [origin.strip() for origin in raw_origins.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    print(f"Unhandled Exception in request: {request.method} {request.url}")
    traceback.print_exc()
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal Server Error", "error": str(exc)},
        # Injecting CORS header so the browser doesn't hide the 500 error
        headers={"Access-Control-Allow-Origin": request.headers.get("origin", "*")}
    )

app.include_router(auth.auth_routes)
app.include_router(user_router.user_routes)
app.include_router(workspaces.router)
app.include_router(projects.project_router)
app.include_router(tasks.router)
app.include_router(comments.router)
app.include_router(label.router)
app.include_router(notifications.router)
app.include_router(attachment.router)
app.include_router(websockets.router)

from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI

from app.database import Base, engine
from app.routers import auth, user as user_router, workspaces, projects, tasks, comments, label, notifications, attachment

Base.metadata.create_all(bind=engine)

app = FastAPI()

origins=[
    "http://localhost:5173",
    "http://localhost:8000",
    "http://localhost:8080",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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
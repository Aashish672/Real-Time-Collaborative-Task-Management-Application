from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI

from app.database import Base, engine
from app.routers import auth, user as user_router, workspaces, projects, tasks, comments, label, notifications, attachment

Base.metadata.create_all(bind=engine)

app = FastAPI()

import traceback
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

origins=[
    "http://localhost:5173",
    "http://localhost:8000",
    "http://localhost:8080",
    "http://localhost:8081",
]

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

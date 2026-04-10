from app.database import engine, Base
from app.models import (
    Attachment,
    Comment,
    Label,
    TaskLabel,
    Notification,
    Project,
    Task,
    User,
    Workspace,
    WorkspaceMember,
    Subtask,
    TaskAssignee,
)

Base.metadata.create_all(bind=engine)
print("Tables created successfully!")
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

try:
    from database import Base
    from models.user import User
    from models.workspace import Workspace, WorkspaceMember
    from models.project import Project
    from models.task import Task, Subtask, TaskAssignee
    from models.comment import Comment
    from models.attachment import Attachment
    from models.notification import Notification
    from models.label import Label, TaskLabel

    print("✅ All models imported successfully.")
    
    # Try creating tables (in memory SQLite to just test mappings)
    from sqlalchemy import create_engine
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    print("✅ All SQLAlchemy tables successfully mapped and created.")
except Exception as e:
    print(f"❌ Error during model verification: {e}")
    sys.exit(1)

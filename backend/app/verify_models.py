import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

try:
    from database import Base
    from models import (
        User, Workspace, WorkspaceMember, Project, 
        Task, Subtask, TaskAssignee, Comment, 
        Attachment, Notification, Label, TaskLabel
    )


    print("[SUCCESS] All models imported successfully.")
    
    # Try creating tables (in memory SQLite to just test mappings)
    from sqlalchemy import create_engine
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    print("[SUCCESS] All SQLAlchemy tables successfully mapped and created.")
except Exception as e:
    print(f"[ERROR] Error during model verification: {e}")
    sys.exit(1)


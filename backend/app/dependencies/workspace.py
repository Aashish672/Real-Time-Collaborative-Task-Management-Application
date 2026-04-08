from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session
import uuid
from app.database import get_db
from app import models


def get_workspace_member(db: Session, workspace_id: uuid.UUID, user_id: uuid.UUID):
    return db.query(models.WorkspaceMember).filter(
        models.WorkspaceMember.workspace_id == workspace_id,
        models.WorkspaceMember.user_id == user_id
    ).first()


def get_workspace_by_id(db: Session, workspace_id: uuid.UUID):
    return db.query(models.Workspace).filter(models.Workspace.id == workspace_id).first()


def check_workspace_member(db: Session, workspace_id: uuid.UUID, user_id: uuid.UUID):
    member = get_workspace_member(db, workspace_id, user_id)
    if not member:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a member of this workspace"
        )
    return member


def check_workspace_admin(db: Session, workspace_id: uuid.UUID, user_id: uuid.UUID):
    member = get_workspace_member(db, workspace_id, user_id)
    if not member:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a member of this workspace"
        )
    if member.role not in [models.WorkspaceRole.owner, models.WorkspaceRole.admin]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You must be an owner or admin to perform this action"
        )
    return member


def check_workspace_owner(db: Session, workspace_id: uuid.UUID, user_id: uuid.UUID):
    member = get_workspace_member(db, workspace_id, user_id)
    if not member:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a member of this workspace"
        )
    if member.role != models.WorkspaceRole.owner:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You must be the owner to perform this action"
        )
    return member
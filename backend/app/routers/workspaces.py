from fastapi import APIRouter, Depends, HTTPException, status
from datetime import datetime

from sqlalchemy.orm import Session
import uuid
from typing import List


from app import schemas, models, crud
from app.database import get_db
from app.dependencies import get_current_user
from app.dependencies.workspace import (
    check_workspace_member,
    check_workspace_admin,
    check_workspace_owner
)
from app.services.activity_service import ActivityService


router = APIRouter(prefix="/workspaces", tags=["Workspaces"])


@router.post("/", response_model=schemas.WorkspaceResponse, status_code=status.HTTP_201_CREATED)
def create_workspace(body: schemas.WorkspaceCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    workspace = crud.create_workspace(db=db, body=body, user_id=current_user.id)
    return workspace


@router.get("/{workspace_id}", response_model=schemas.WorkspaceResponse, status_code=status.HTTP_200_OK)
def get_workspace(workspace_id: uuid.UUID, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    workspace = crud.get_workspace(db=db, workspace_id=workspace_id)
    if not workspace:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found")
    
    check_workspace_member(db, workspace_id, current_user.id)
    
    return workspace


@router.get("/", response_model=List[schemas.WorkspaceResponse], status_code=status.HTTP_200_OK)
def list_user_workspaces(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    workspaces = crud.list_user_workspaces(db=db, user_id=current_user.id)
    return workspaces


@router.get("/{workspace_id}/members", response_model=List[schemas.WorkspaceMemberResponse], status_code=status.HTTP_200_OK)
def get_workspace_members(workspace_id: uuid.UUID, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    workspace = crud.get_workspace(db=db, workspace_id=workspace_id)
    if not workspace:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found")
    
    check_workspace_member(db, workspace_id, current_user.id)
    
    members = crud.get_workspaces_members(db=db, workspace_id=workspace_id)
    return members


@router.get("/slug/{slug}", response_model=schemas.WorkspaceResponse, status_code=status.HTTP_200_OK)
def get_workspaces_slug(slug: str, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    workspace = crud.get_workspaces_slug(db=db, slug=slug)
    if not workspace:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found")
    
    # SECURITY CHECK: Ensure the user actually belongs to the workspace they just looked up
    check_workspace_member(db, workspace.id, current_user.id)
    
    return workspace


@router.get("/{workspace_id}/statistics", response_model=schemas.WorkspaceStatisticsResponse, status_code=status.HTTP_200_OK)
async def workspace_statistics(workspace_id: uuid.UUID, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    workspace = crud.get_workspace(db=db, workspace_id=workspace_id)
    if not workspace:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found")
    
    check_workspace_member(db, workspace_id, current_user.id)
    
    # Try cache first
    from app.services.cache import get_cached, set_cached
    cache_key = f"ws_stats:{workspace_id}"
    cached_stats = await get_cached(cache_key)
    if cached_stats:
        return cached_stats

    stats = crud.workspace_statistics(db=db, workspace_id=workspace_id)
    
    # Store in cache for 60 seconds
    await set_cached(cache_key, stats, ttl=60)
    
    return stats


@router.put("/{workspace_id}", response_model=schemas.WorkspaceResponse, status_code=status.HTTP_200_OK)
def update_workspace(workspace_id: uuid.UUID, body: schemas.WorkspaceUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    workspace = crud.get_workspace(db=db, workspace_id=workspace_id)
    if not workspace:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found")
    
    check_workspace_admin(db, workspace_id, current_user.id)
    
    workspace = crud.update_workspace(db=db, workspace_id=workspace_id, body=body)
    return workspace


@router.put("/{workspace_id}/slug", response_model=schemas.WorkspaceResponse, status_code=status.HTTP_200_OK)
def change_workspace_slug(workspace_id: uuid.UUID, body: schemas.WorkspaceSlugUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    # 1. Authorize
    check_workspace_admin(db, workspace_id, current_user.id)
    
    # 2. Try/Except for the ValueError
    try:
        workspace = crud.change_workspace_slug(db=db, workspace_id=workspace_id, new_slug=body.slug)
        if not workspace:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found")
        return workspace
    except ValueError as e:
        # Converts the Python error into a clean HTTP error for the frontend
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.put("/{workspace_id}/members/{user_id}", response_model=schemas.WorkspaceMemberResponse, status_code=status.HTTP_200_OK)
def update_member_role(workspace_id: uuid.UUID, user_id: uuid.UUID, role: schemas.WorkspaceRole, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    workspace = crud.get_workspace(db=db, workspace_id=workspace_id)
    if not workspace:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found")
    
    check_workspace_admin(db, workspace_id, current_user.id)
    
    member = crud.update_member_role(db=db, workspace_id=workspace_id, user_id=user_id, role=role)
    if not member:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Member not found")
    return member


@router.delete("/{workspace_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_workspace(workspace_id: uuid.UUID, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    workspace = crud.get_workspace(db=db, workspace_id=workspace_id)
    if not workspace:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found")
    
    check_workspace_owner(db, workspace_id, current_user.id)
    
    crud.delete_workspace(db=db, workspace_id=workspace_id)
    return None


# --- Invitation Routes ---

@router.post("/{workspace_id}/invitations", response_model=schemas.InvitationResponse, status_code=status.HTTP_201_CREATED)
async def create_invitation(
    workspace_id: uuid.UUID, 
    body: schemas.InvitationCreate, 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(get_current_user)
):
    check_workspace_admin(db, workspace_id, current_user.id)
    invitation = crud.create_invitation(db=db, workspace_id=workspace_id, invited_by_id=current_user.id, body=body)
    
    # Queue invitation email via RabbitMQ
    try:
        from app.services.email_service import publish_invitation_email
        from app.core.rabbitmq import get_channel
        workspace = crud.get_workspace(db=db, workspace_id=workspace_id)
        channel = await get_channel()
        await publish_invitation_email(
            channel=channel,
            email=body.email,
            workspace_name=workspace.name,
            inviter_name=current_user.full_name,
            invite_token=invitation.token,
        )
    except Exception as e:
        import logging
        logging.getLogger(__name__).warning(f"Failed to queue invitation email: {e}")
        # Fallback: log the link so it's not lost
        print(f"INVITATION LINK: http://localhost:5173/join/{invitation.token}")
    # Log Activity for Webhook/Notification
    await ActivityService.log_activity(
        db=db,
        workspace_id=workspace_id,
        user_id=current_user.id,
        action=models.ActivityAction.created,
        entity_type="invitation",
        entity_id=invitation.id,
        payload={"email": body.email, "role": body.role}
    )
    
    return invitation


@router.get("/{workspace_id}/invitations", response_model=List[schemas.InvitationResponse])
def list_invitations(
    workspace_id: uuid.UUID, 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(get_current_user)
):
    check_workspace_admin(db, workspace_id, current_user.id)
    return crud.list_workspace_invitations(db=db, workspace_id=workspace_id)


@router.delete("/invitations/{invitation_id}", status_code=status.HTTP_204_NO_CONTENT)
def revoke_invitation(
    invitation_id: uuid.UUID, 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(get_current_user)
):
    # We need to find the workspace first to check admin rights
    invitation = db.query(models.Invitation).filter(models.Invitation.id == invitation_id).first()
    if not invitation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invitation not found")
    
    check_workspace_admin(db, invitation.workspace_id, current_user.id)
    crud.revoke_invitation(db=db, invitation_id=invitation_id)
    return None


@router.get("/invitations/info/{token}", response_model=schemas.InvitationInfo)
def get_invitation_info(token: str, db: Session = Depends(get_db)):
    invitation = crud.get_invitation_by_token(db=db, token=token)
    if not invitation or invitation.status != models.InvitationStatus.pending:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invalid or expired invitation link")
    
    workspace = crud.get_workspace(db=db, workspace_id=invitation.workspace_id)
    inviter = db.query(models.User).filter(models.User.id == invitation.invited_by_id).first()
    
    return {
        "workspace_name": workspace.name,
        "inviter_name": inviter.full_name if inviter else "Someone",
        "email": invitation.email,
        "expires_at": invitation.expires_at,
        "is_expired": invitation.expires_at < datetime.now()
    }


@router.post("/invitations/accept/{token}", response_model=schemas.WorkspaceResponse)
def accept_invitation(
    token: str, 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(get_current_user)
):
    invitation = crud.accept_invitation(db=db, token=token, user=current_user)
    if not invitation:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Could not accept invitation. Link might be expired or already used.")
    
    workspace = crud.get_workspace(db=db, workspace_id=invitation.workspace_id)
    return workspace


@router.get("/{workspace_id}/search", response_model=schemas.GlobalSearchResponse)
def search(
    workspace_id: uuid.UUID,
    q: str = "",
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # Ensure user is member
    check_workspace_member(db, workspace_id, current_user.id)
    
    if not q or len(q) < 2:
        return {"projects": [], "tasks": []}
        
    return crud.search_workspace(db=db, workspace_id=workspace_id, query=q)


@router.get("/{workspace_id}/activity", response_model=List[schemas.ActivityResponse])
def get_workspace_activity(
    workspace_id: uuid.UUID,
    limit: int = 50,
    skip: int = 0,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # Ensure user is member
    check_workspace_member(db, workspace_id, current_user.id)
    return crud.list_workspace_activity(db=db, workspace_id=workspace_id, limit=limit, skip=skip)


@router.delete("/{workspace_id}/members/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_member(workspace_id: uuid.UUID, user_id: uuid.UUID, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    workspace = crud.get_workspace(db=db, workspace_id=workspace_id)
    if not workspace:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found")
    
    check_workspace_admin(db, workspace_id, current_user.id)
    
    member = crud.remove_member(db=db, workspace_id=workspace_id, user_id=user_id)
    if not member:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Member not found")
    return None


# --- Webhook Routes ---

@router.post("/{workspace_id}/webhooks", response_model=schemas.WebhookResponse, status_code=status.HTTP_201_CREATED)
def create_webhook(
    workspace_id: uuid.UUID,
    body: schemas.WebhookCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    check_workspace_admin(db, workspace_id, current_user.id)
    return crud.create_webhook(db=db, workspace_id=workspace_id, body=body)


@router.get("/{workspace_id}/webhooks", response_model=List[schemas.WebhookResponse])
def list_webhooks(
    workspace_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    check_workspace_member(db, workspace_id, current_user.id)
    return crud.list_workspaces_webhooks(db=db, workspace_id=workspace_id)


@router.delete("/webhooks/{webhook_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_webhook(
    webhook_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # Need to check admin for the workspace this webhook belongs to
    webhook = db.query(models.Webhook).filter(models.Webhook.id == webhook_id).first()
    if not webhook:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Webhook not found")
    
    check_workspace_admin(db, webhook.workspace_id, current_user.id)
    crud.delete_webhook(db=db, webhook_id=webhook_id)
    return None


@router.patch("/webhooks/{webhook_id}/toggle", response_model=schemas.WebhookResponse)
def toggle_webhook(
    webhook_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    webhook = db.query(models.Webhook).filter(models.Webhook.id == webhook_id).first()
    if not webhook:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Webhook not found")
    
    check_workspace_admin(db, webhook.workspace_id, current_user.id)
    return crud.toggle_webhook(db=db, webhook_id=webhook_id)


@router.post("/webhooks/{webhook_id}/test", status_code=status.HTTP_200_OK)
def test_webhook(
    webhook_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    webhook = db.query(models.Webhook).filter(models.Webhook.id == webhook_id).first()
    if not webhook:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Webhook not found")
    
    check_workspace_admin(db, webhook.workspace_id, current_user.id)
    
    from app.services.webhooks import dispatch_webhook
    # Send a ping/test payload
    dispatch_webhook(
        url=webhook.url,
        event_type="webhook.test",
        payload={
            "message": "This is a test notification from your Task Management app.",
            "webhook_id": str(webhook_id),
            "timestamp": datetime.now().isoformat()
        }
    )
    return {"status": "dispatched"}
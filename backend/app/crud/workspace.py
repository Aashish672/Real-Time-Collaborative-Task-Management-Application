from sqlalchemy.orm import Session
from app import models,schemas
import uuid,string,secrets
import re
from datetime import datetime, timedelta

def generate_slug(name:str):
    slug=re.sub(r'[^a-zA-Z0-9]+', '-', name.lower()).strip('-')
    return re.sub(r'-+', '-', slug)


def create_workspace(db:Session,body:schemas.WorkspaceCreate,user_id:uuid.UUID):
    slug=body.slug if body.slug else generate_slug(body.name)
    final_slug=slug

    counter=1
    while(db.query(models.Workspace).filter(models.Workspace.slug==final_slug).first()):
        final_slug=f"{slug}-{counter}"
        counter+=1
    

    new_workspace=models.Workspace(
        name=body.name,
        slug=final_slug,
        logo_url=body.logo_url,
        owner_id=user_id
    )
    db.add(new_workspace)
    db.flush()
    

    workspace_member=models.WorkspaceMember(
        workspace_id=new_workspace.id,
        user_id=user_id,
        role=models.WorkspaceRole.owner
    )

    db.add(workspace_member)
    db.commit()
    db.refresh(new_workspace)
    return new_workspace



def get_workspace(db:Session,workspace_id=uuid.UUID):
    return db.query(models.Workspace).filter(models.Workspace.id==workspace_id).first()
    


def list_user_workspaces(db:Session,user_id:uuid.UUID):
    return db.query(models.Workspace).join(models.WorkspaceMember).filter(
        models.WorkspaceMember.user_id == user_id
    ).all()


def get_workspaces_members(db:Session,workspace_id:uuid.UUID):
    return db.query(models.WorkspaceMember).filter(models.WorkspaceMember.workspace_id==workspace_id).all()


def get_workspaces_slug(db:Session,slug:str):
    return db.query(models.Workspace).filter(models.Workspace.slug==slug).first()
    


def workspace_statistics(db:Session,workspace_id:uuid.UUID):
    total_members = db.query(models.WorkspaceMember).filter(models.WorkspaceMember.workspace_id == workspace_id).count()
    
    total_projects = db.query(models.Project).filter(models.Project.workspace_id == workspace_id).count()
    
    # Total tasks across all projects in the workspace
    total_tasks = db.query(models.Task).join(models.Project).filter(models.Project.workspace_id == workspace_id).count()
    
    # Active tasks (status != 'done')
    active_tasks = db.query(models.Task).join(models.Project).filter(
        models.Project.workspace_id == workspace_id,
        models.Task.status != "done"
    ).count()
    
    completion_rate = 0.0
    if total_tasks > 0:
        done_tasks = total_tasks - active_tasks
        completion_rate = (done_tasks / total_tasks) * 100
        
    return {
        "total_members": total_members,
        "total_projects": total_projects,
        "total_tasks": total_tasks,
        "active_tasks": active_tasks,
        "completion_rate": round(completion_rate, 1)
    }


def update_workspace(db:Session,workspace_id:uuid.UUID,body:schemas.WorkspaceUpdate):
    workspace=db.query(models.Workspace).filter(models.Workspace.id==workspace_id).first()
    if not workspace:
        return None
    for key,value in body.model_dump(exclude_unset=True).items():
        setattr(workspace,key,value)
    db.commit()
    db.refresh(workspace)
    return workspace


def change_workspace(db:Session,workspace_id:uuid.UUID,user_id:uuid.UUID):
    workspace=db.query(models.Workspace).filter(models.Workspace.id==workspace_id).first()
    if not workspace:
        return None
    workspace.owner_id=user_id
    db.commit()
    db.refresh(workspace)
    return workspace


def change_workspace_slug(db:Session,workspace_id:uuid.UUID,new_slug:str):
    workspace=db.query(models.Workspace).filter(models.Workspace.id==workspace_id).first()
    if not workspace:
        return None
    
    existing = db.query(models.Workspace).filter(models.Workspace.slug == new_slug).first()
    if existing and existing.id != workspace_id:
        raise ValueError("Slug already exists")
    
    workspace.slug = new_slug
    db.commit()
    db.refresh(workspace)
    return workspace




def update_member_role(db:Session,workspace_id:uuid.UUID,user_id:uuid.UUID,role:schemas.WorkspaceRole):
    member=db.query(models.WorkspaceMember).filter(
        models.WorkspaceMember.workspace_id==workspace_id,
        models.WorkspaceMember.user_id==user_id
    ).first()
    if not member:
        return None
    
    member.role=models.WorkspaceRole(role.value)
    db.commit()
    db.refresh(member)
    return member




def delete_workspace(db:Session,workspace_id:uuid.UUID):
    workspace=db.query(models.Workspace).filter(models.Workspace.id==workspace_id).first()
    if not workspace:
        return None
    db.delete(workspace)
    db.commit()
    return workspace


def remove_member(db:Session,workspace_id:uuid.UUID,user_id:uuid.UUID):
    member=db.query(models.WorkspaceMember).filter(
        models.WorkspaceMember.workspace_id==workspace_id,
        models.WorkspaceMember.user_id==user_id
    ).first()
    if not member:
        return None
    db.delete(member)
    db.commit()
    return member

def create_invitation(db: Session, workspace_id: uuid.UUID, invited_by_id: uuid.UUID, body: schemas.InvitationCreate):
    # PATH A: Check if user already exists
    existing_user = db.query(models.User).filter(models.User.email == body.email).first()
    if existing_user:
        # Check if already a member
        is_member = db.query(models.WorkspaceMember).filter(
            models.WorkspaceMember.workspace_id == workspace_id,
            models.WorkspaceMember.user_id == existing_user.id
        ).first()
        
        if not is_member:
            new_member = models.WorkspaceMember(
                workspace_id=workspace_id,
                user_id=existing_user.id,
                role=models.WorkspaceRole(body.role.value)
            )
            db.add(new_member)
            
            # Create Notification
            inviter = db.query(models.User).filter(models.User.id == invited_by_id).first()
            workspace = db.query(models.Workspace).filter(models.Workspace.id == workspace_id).first()
            
            from app.crud.notification import create_notification
            create_notification(
                db=db,
                user_id=existing_user.id,
                notification_type=models.NotificationType.workspace_joined,
                payload={
                    "message": f"You've been added to {workspace.name} by {inviter.full_name}",
                    "workspace_id": str(workspace_id),
                    "workspace_name": workspace.name,
                    "actor_name": inviter.full_name
                }
            )
            db.commit()
            
        # Return a mock invitation that looks "accepted" or just enough to satisfy the schema
        # Actually, it's better to return a placeholder or update the schema.
        # For now, let's create a "ghost" invitation that is already accepted.
        invitation = models.Invitation(
            email=body.email,
            workspace_id=workspace_id,
            invited_by_id=invited_by_id,
            role=models.WorkspaceRole(body.role.value),
            token=f"direct-{uuid.uuid4()}",
            expires_at=datetime.now(),
            status=models.InvitationStatus.accepted
        )
        db.add(invitation)
        db.commit()
        db.refresh(invitation)
        return invitation

    # PATH B: Traditional Invitation
    # Check if a pending invitation already exists for this email and workspace
    existing = db.query(models.Invitation).filter(
        models.Invitation.workspace_id == workspace_id,
        models.Invitation.email == body.email,
        models.Invitation.status == models.InvitationStatus.pending,
        models.Invitation.expires_at > datetime.now()
    ).first()
    
    if existing:
        return existing
        
    token = secrets.token_urlsafe(32)
    expires_at = datetime.now() + timedelta(days=7)
    
    new_invitation = models.Invitation(
        email=body.email,
        workspace_id=workspace_id,
        invited_by_id=invited_by_id,
        role=models.WorkspaceRole(body.role.value),
        token=token,
        expires_at=expires_at,
        status=models.InvitationStatus.pending
    )
    
    db.add(new_invitation)
    db.commit()
    db.refresh(new_invitation)
    return new_invitation

def get_invitation_by_token(db: Session, token: str):
    return db.query(models.Invitation).filter(models.Invitation.token == token).first()

def accept_invitation(db: Session, token: str, user: models.User):
    invitation = get_invitation_by_token(db, token)
    if not invitation or invitation.status != models.InvitationStatus.pending or invitation.expires_at < datetime.now():
        return None
    
    # 1. Add user to workspace
    # check if already a member
    existing_member = db.query(models.WorkspaceMember).filter(
        models.WorkspaceMember.workspace_id == invitation.workspace_id,
        models.WorkspaceMember.user_id == user.id
    ).first()
    
    if not existing_member:
        new_member = models.WorkspaceMember(
            workspace_id=invitation.workspace_id,
            user_id=user.id,
            role=invitation.role
        )
        db.add(new_member)
    
    # 2. Mark invitation as accepted
    invitation.status = models.InvitationStatus.accepted
    db.commit()
    return invitation

def revoke_invitation(db: Session, invitation_id: uuid.UUID):
    invitation = db.query(models.Invitation).filter(models.Invitation.id == invitation_id).first()
    if invitation:
        invitation.status = models.InvitationStatus.revoked
        db.commit()
        return True
    return False

def list_workspace_invitations(db: Session, workspace_id: uuid.UUID):
    return db.query(models.Invitation).filter(
        models.Invitation.workspace_id == workspace_id,
        models.Invitation.status == models.InvitationStatus.pending
    ).all()


def search_workspace(db: Session, workspace_id: uuid.UUID, query: str):
    # Search Projects
    projects = db.query(models.Project).filter(
        models.Project.workspace_id == workspace_id,
        models.Project.name.ilike(f"%{query}%")
    ).limit(10).all()

    # Search Tasks (joined with Project to filter by workspace)
    tasks = db.query(models.Task).join(models.Project).filter(
        models.Project.workspace_id == workspace_id,
        (models.Task.title.ilike(f"%{query}%")) | (models.Task.description.ilike(f"%{query}%"))
    ).limit(20).all()

    return {
        "projects": projects,
        "tasks": tasks
    }


def list_workspace_activity(db: Session, workspace_id: uuid.UUID, limit: int = 50, skip: int = 0):
    return db.query(models.Activity).filter(
        models.Activity.workspace_id == workspace_id
    ).order_by(models.Activity.created_at.desc()).offset(skip).limit(limit).all()


# --- Webhook CRUD ---

def create_webhook(db: Session, workspace_id: uuid.UUID, body: schemas.WebhookCreate):
    new_webhook = models.Webhook(
        workspace_id=workspace_id,
        url=body.url,
        event_type=body.event_type
    )
    db.add(new_webhook)
    db.commit()
    db.refresh(new_webhook)
    return new_webhook


def list_workspaces_webhooks(db: Session, workspace_id: uuid.UUID):
    return db.query(models.Webhook).filter(models.Webhook.workspace_id == workspace_id).all()


def delete_webhook(db: Session, webhook_id: uuid.UUID):
    webhook = db.query(models.Webhook).filter(models.Webhook.id == webhook_id).first()
    if webhook:
        db.delete(webhook)
        db.commit()
        return True
    return False


def toggle_webhook(db: Session, webhook_id: uuid.UUID):
    webhook = db.query(models.Webhook).filter(models.Webhook.id == webhook_id).first()
    if webhook:
        webhook.is_active = not webhook.is_active
        db.commit()
        db.refresh(webhook)
        return webhook
    return None

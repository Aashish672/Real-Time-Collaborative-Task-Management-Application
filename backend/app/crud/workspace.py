from sqlalchemy.orm import Session
from app import models,schemas
import uuid,string,secrets
import re

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
    

    new_workspace=models.Workspace(name=body.name,slug=final_slug,owner_id=user_id)
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
    total_members=db.query(models.WorkspaceMember).filter(models.WorkspaceMember.workspace_id==workspace_id).count()
    return {"total_members": total_members}


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

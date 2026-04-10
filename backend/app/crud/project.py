import uuid

from sqlalchemy.orm import Session 
from fastapi import HTTPException,status
from app import models,schemas
from app.models.project import ProjectStatus
from app.models.task import TaskStatus

def create_project(db:Session,body:schemas.ProjectCreate,workspace_id:uuid.UUID):
    new_project=models.Project(
        name=body.name,
        description=body.description,
        workspace_id=workspace_id,
        owner_id=body.owner_id,
        deadline=body.deadline
    )

    db.add(new_project)
    db.commit()
    db.refresh(new_project)
    return new_project


def get_project(db:Session,project_id:uuid.UUID):
    return db.query(models.Project).filter(models.Project.id==project_id).first()


def get_project_or_404(db:Session,project_id:uuid.UUID):
    project=db.query(models.Project).filter(models.Project.id==project_id).first()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,detail="Project not found")
    return project


def list_workspace_projects(db:Session,workspace_id:uuid.UUID):
    return db.query(models.Project).filter(models.Project.workspace_id==workspace_id).all()


def project_statistics(db:Session,project_id:uuid.UUID):
    project=db.query(models.Project).filter(models.Project.id==project_id).first()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,detail="Project not found")
    
    total_tasks=db.query(models.Task).filter(models.Task.project_id==project_id).count()

    completed_tasks = db.query(models.Task).filter(
        models.Task.project_id == project_id, 
        models.Task.status == models.TaskStatus.done 
    ).count()
    
    pending_tasks = db.query(models.Task).filter(
        models.Task.project_id == project_id, 
        models.Task.status == models.TaskStatus.todo 
    ).count()
    return{
        "total_tasks":total_tasks,
        "completed_tasks":completed_tasks,
        "pending_tasks":pending_tasks
    }


def update_project(db:Session,project_id:uuid.UUID,body:schemas.ProjectUpdate):
    project=get_project_or_404(db=db,project_id=project_id)
    
    for key, value in body.model_dump(exclude_unset=True).items():
        setattr(project, key, value)

    db.commit()
    db.refresh(project)
    return project


def change_project_status(db:Session,project_id:uuid.UUID,new_status:str):
    project=get_project_or_404(db=db,project_id=project_id)
    
    try:
        status_enum=ProjectStatus(new_status)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,detail="Invalid status value")
    
    project.status=status_enum
    db.commit()
    db.refresh(project)
    return project



def delete_project(db:Session,project_id:uuid.UUID):
    project=get_project_or_404(db=db,project_id=project_id)
    
    db.delete(project)
    db.commit()
    return True
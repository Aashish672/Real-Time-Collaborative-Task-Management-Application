import uuid

from sqlalchemy.orm import Session
from sqlalchemy import asc
from app import models,schemas


def create_task(db: Session, project_id: uuid.UUID, creator_id: uuid.UUID, body: schemas.TaskCreate): 
    new_task = models.Task(
        project_id=project_id,
        created_by=creator_id,
        title=body.title,
        description=body.description,
        status=body.status,
        priority=body.priority,
        due_date=body.due_date
    )
    db.add(new_task)
    db.flush()  # Generate ID for relationships

    # Add assignees if provided
    if body.assignee_ids:
        for user_id in body.assignee_ids:
            assignee = models.TaskAssignee(task_id=new_task.id, user_id=user_id)
            db.add(assignee)

    # Add labels if provided
    if body.label_ids:
        for label_id in body.label_ids:
            task_label = models.TaskLabel(task_id=new_task.id, label_id=label_id)
            db.add(task_label)

    db.commit()
    db.refresh(new_task)
    return new_task


def create_subtask(db:Session,task_id:uuid.UUID,body:schemas.SubtaskCreate):
    new_subtask=models.Subtask(
        task_id=task_id,
        title=body.title,
        is_done=body.is_done if body.is_done is not None else False
    )

    db.add(new_subtask)
    db.commit()
    db.refresh(new_subtask)
    return new_subtask

def assign_user_to_task(db:Session,task_id:uuid.UUID,user_id:uuid.UUID):
    existing=db.query(models.TaskAssignee).filter_by(task_id=task_id,user_id=user_id).first()
    if existing:
        return existing
    
    assignee=models.TaskAssignee(task_id=task_id,user_id=user_id)
    db.add(assignee)
    db.commit()
    db.refresh(assignee)
    return assignee

def get_task(db: Session, task_id: uuid.UUID):
    return db.query(models.Task).filter(models.Task.id==task_id).first()


def list_project_tasks(db:Session, project_id: uuid.UUID):
    return db.query(models.Task).filter(models.Task.project_id==project_id).all()


def filter_tasks(db:Session,project_id:uuid.UUID,status:str=None,priority:str=None):
    query=db.query(models.Task).filter(models.Task.project_id==project_id)

    if status:
        query=query.filter(models.Task.status==models.TaskStatus(status))
    if priority:
        query=query.filter(models.Task.priority==models.TaskPriority(priority))

    return query.all()


def get_user_assigned_tasks(db:Session,user_id:uuid.UUID):
    return db.query(models.Task).join(models.TaskAssignee).filter(
        models.TaskAssignee.user_id==user_id
    ).all()


def get_subtasks(db:Session,task_id:uuid.UUID):
    return db.query(models.Subtask).filter(models.Subtask.task_id==task_id).all()


def task_statistics(db:Session,project_id:uuid.UUID):
    total = db.query(models.Task).filter(models.Task.project_id == project_id).count()
    done = db.query(models.Task).filter(
        models.Task.project_id == project_id, 
        models.Task.status == models.TaskStatus.done
    ).count()
    
    # Calculate progress percentage safely
    progress = round((done / total * 100), 2) if total > 0 else 0.0
    
    return {
        "total": total,
        "completed": done,
        "progress_percentage": progress
    }


def update_task(db:Session,task_id:uuid.UUID,body:schemas.TaskUpdate):
    task=get_task(db,task_id)
    if not task:
        return None
    
    for key,value in body.model_dump(exclude_unset=True).items():
        setattr(task,key,value)


    db.commit()
    db.refresh(task)
        
    return task


def update_task_status(db:Session,task_id:uuid.UUID,status:str):
    task=get_task(db,task_id)
    if not task:
        return None
    
    task.status=status
    db.commit()
    db.refresh(task)

    return task


def update_task_priority(db:Session,task_id:uuid.UUID,priority:str):
    task=get_task(db,task_id)
    if not task:
        return None
    task.priority=priority
    db.commit()
    db.refresh(task)
    return task


def update_subtask(db:Session,subtask_id:uuid.UUID,title:str):
    subtask=db.query(models.Subtask).filter(models.Subtask.id==subtask_id).first()
    if not subtask:
        return None
    subtask.title=title
    db.commit()
    db.refresh(subtask)
    return subtask


def toggle_subtask_done(db:Session,subtask_id:uuid.UUID):
    subtask=db.query(models.Subtask).filter(models.Subtask.id==subtask_id).first()
    if not subtask:
        return None
    current_value = subtask.is_done
    subtask.is_done = not current_value
    db.commit()
    db.refresh(subtask)
    return subtask


def add_label_to_task(db:Session,task_id:uuid.UUID,label_id:uuid.UUID):
    existing = db.query(models.TaskLabel).filter_by(task_id=task_id, label_id=label_id).first()
    if existing:
        return existing
    
    task_label=models.TaskLabel(task_id=task_id,label_id=label_id)
    db.add(task_label)
    db.commit()
    db.refresh(task_label)
    return task_label


def reorder_tasks(db:Session,project_id:uuid.UUID,task_ids_in_order:list):
    for index, t_id in enumerate(task_ids_in_order):
        task=db.query(models.Task).filter(models.Task.id==t_id,models.Task.project_id==project_id).first()
        if task:
            task.position=index
    db.commit()
    return True


def delete_task(db:Session,task_id:uuid.UUID):
    task=get_task(db,task_id)
    if not task:
        return False
    db.delete(task)
    db.commit()
    return True


def delete_subtask(db:Session,subtask_id:uuid.UUID):
    subtask=db.query(models.Subtask).filter(models.Subtask.id==subtask_id).first()
    if not subtask:
        return None
    db.delete(subtask)
    db.commit()
    return True

def remove_task_label(db:Session,task_id:uuid.UUID,label_id:uuid.UUID):
    task_label=db.query(models.TaskLabel).filter_by(task_id=task_id,label_id=label_id).first()
    if not task_label:
        return False
    db.delete(task_label)
    db.commit()
    return True


def remove_assignee(db:Session,task_id:uuid.UUID,user_id:uuid.UUID):
    assignee = db.query(models.TaskAssignee).filter_by(task_id=task_id, user_id=user_id).first()
    if not assignee:
        return False
    db.delete(assignee)
    db.commit()
    return True
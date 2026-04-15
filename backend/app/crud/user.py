import uuid

from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app import models,schemas

from pwdlib import PasswordHash
from pwdlib.hashers.bcrypt import BcryptHasher

import string,secrets
from app.crud.security import create_access_token, create_refresh_token
from google.oauth2 import id_token
from google.auth.transport import requests
from decouple import config

GOOGLE_CLIENT_ID = config("GOOGLE_CLIENT_ID", default="YOUR_GOOGLE_CLIENT_ID")

pwd_context = PasswordHash((BcryptHasher(),))

def get_password_hash(password:str):
    return pwd_context.hash(password)


def generate_random_password(length:int=32):
    alphabet = string.ascii_letters + string.digits + string.punctuation
    return ''.join(secrets.choice(alphabet) for i in range(length))


def verify_password(plain_password:str,hashed_password:str):
    return pwd_context.verify(plain_password,hashed_password)


def verify_google_token(token: str):
    try:
        # Verify the ID token using Google's verification library
        idinfo = id_token.verify_oauth2_token(token, requests.Request(), GOOGLE_CLIENT_ID)
        
        # ID token is valid. Get the user's Google ID from the decoded token.
        return {
            "email": idinfo['email'],
            "full_name": idinfo.get('name'),
            "avatar_url": idinfo.get('picture'),
            "email_verified": idinfo.get('email_verified')
        }
    except ValueError:
        # Invalid token
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Google token"
        )


from app.crud.workspace import create_workspace, accept_invitation

def register(db:Session,body:schemas.UserRegistration):
    is_user=db.query(models.User).filter(models.User.email==body.email).first()

    if is_user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,detail="Email already registered")
    
    hashed_password=get_password_hash(body.password)
    new_user=models.User(email=body.email,hashed_password=hashed_password,full_name=body.full_name)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Create default workspace
    create_workspace(
        db=db, 
        body=schemas.WorkspaceCreate(name=f"{new_user.full_name}'s Workspace"), 
        user_id=new_user.id
    )

    # PATH B: Handle Invitation
    if body.invite_token:
        accept_invitation(db=db, token=body.invite_token, user=new_user)

    return new_user


def oauth_register(db:Session,body:schemas.UserOAuth):
    # PATH A: Verify Token
    google_data = verify_google_token(body.credential)
    email = google_data["email"]
    full_name = google_data["full_name"]
    avatar_url = google_data["avatar_url"]

    is_user = db.query(models.User).filter(models.User.email == email).first()

    if is_user:
        # Update avatar if missing
        if avatar_url and not is_user.avatar_url:
            is_user.avatar_url = avatar_url
            db.commit()
            db.refresh(is_user)
        return is_user
    
    random_password = generate_random_password()
    hashed_password = get_password_hash(random_password)

    new_user = models.User(
        email=email,
        hashed_password=hashed_password,
        full_name=full_name,
        avatar_url=avatar_url,
        is_verified=True
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Create default workspace
    create_workspace(
        db=db, 
        body=schemas.WorkspaceCreate(name=f"{new_user.full_name}'s Workspace"), 
        user_id=new_user.id
    )

    # PATH B: Handle Invitation
    if body.invite_token:
        accept_invitation(db=db, token=body.invite_token, user=new_user)

    return new_user



def login_user(body:schemas.UserLogin,db:Session):
    is_user=db.query(models.User).filter(models.User.email==body.email).first()

    if not is_user or not verify_password(body.password, is_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"}, # Standard OAuth2 header for 401s
        )
    
    token = create_access_token({"sub": str(is_user.id)})
    refresh_token = create_refresh_token({"sub": str(is_user.id)})
    
    return {
        "access_token": token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }


def get_user_by_id(user_id:uuid.UUID,db:Session):
    return db.query(models.User).filter(models.User.id==user_id).first()


def search_users(db:Session,search_term:str,limit:int=20):
    return db.query(models.User).filter(
        models.User.full_name.ilike(f"%{search_term}%") | 
        models.User.email.ilike(f"%{search_term}%")
    ).limit(limit).all()
    

def get_workspace_users(db:Session,workspace_id:uuid.UUID):
    return db.query(models.User).join(models.WorkspaceMember).filter(models.WorkspaceMember.workspace_id==workspace_id).all()


def update_profile(db:Session,user_id:uuid.UUID,body:schemas.UserUpdate):
    user=get_user_by_id(user_id=user_id,db=db)
    if user:
        for key, value in body.model_dump(exclude_unset=True).items():
            setattr(user, key, value)
        db.commit()
        db.refresh(user)
    return user

def change_password(db:Session,user_id:uuid.UUID,hashed_password:str):
    user=get_user_by_id(user_id=user_id,db=db)
    if user:
        user.hashed_password=hashed_password
        db.commit()
        db.refresh(user)
    return user

def update_avatar(db:Session,user_id:uuid.UUID,body:schemas.UserUpdate):
    user=get_user_by_id(user_id=user_id,db=db)
    if user:
        user.avatar_url=body.avatar_url
        db.commit()
        db.refresh(user)
    return user

def delete_account(db:Session,user_id:uuid.UUID):
    user=get_user_by_id(user_id=user_id,db=db)
    if user:
        db.delete(user)
        db.commit()
        return True
    return False

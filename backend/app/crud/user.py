import uuid

from sqlalchemy.orm import Session
from app import models,schemas

from pwdlib import PasswordHash
from pwdlib.hashers.bcrypt import BcryptHasher

import string,secrets
from app.crud.security import create_access_token, create_refresh_token

pwd_context = PasswordHash((BcryptHasher(),))

def get_password_hash(password:str):
    return pwd_context.hash(password)


def generate_random_password(length:int=32):
    alphabet = string.ascii_letters + string.digits + string.punctuation
    return ''.join(secrets.choice(alphabet) for i in range(length))


def verify_password(plain_password:str,hashed_password:str):
    return pwd_context.verify(plain_password,hashed_password)


def register(db:Session,body:schemas.UserRegistration):
    is_user=db.query(models.User).filter(models.User.email==body.email).first()

    if is_user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,detail="Email already registered")
    
    hashed_password=get_password_hash(body.password)
    new_user=models.User(email=body.email,hashed_password=hashed_password,full_name=body.full_name)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


def oauth_register(db:Session,body:schemas.UserOAuth):
    is_user=db.query(models.User).filter(models.User.email==body.email).first()

    if is_user:
        if body.avatar_url and not is_user.avatar_url:
            is_user.avatar_url=body.avatar_url
            db.commit()
            db.refresh(is_user)
        return is_user
    
    random_password=generate_random_password()
    hashed_password=get_password_hash(random_password)


    new_user=models.User(email=body.email,
                         hashed_password=hashed_password,
                         full_name=body.full_name,
                         avatar_url=body.avatar_url,
                         is_verified=True)
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)


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
        user.full_name=body.full_name 
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
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import uuid

from app import schemas,models,crud
from app.database import get_db
from app.dependencies.auth import get_current_user

auth_routes=APIRouter(prefix="/auth",tags=["Authentication"])

@auth_routes.post("/register",response_model=schemas.UserPublic,status_code=status.HTTP_201_CREATED)
def register(body:schemas.UserRegistration,db:Session=Depends(get_db)):
    user=crud.register(db=db,body=body)
    return user


@auth_routes.post("/oauth",response_model=schemas.UserPublic,status_code=status.HTTP_200_OK)
def oauth_register(body:schemas.UserOAuth,db:Session=Depends(get_db)):
    user=crud.oauth_register(db=db,body=body)
    return user


@auth_routes.post("/login",response_model=schemas.TokenResponse,status_code=status.HTTP_200_OK)
def login(body:schemas.UserLogin,db:Session=Depends(get_db)):
    return crud.login_user(db=db,body=body)


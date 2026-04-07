from sqlalchemy.orm import Session
from fastapi import APIRouter,Depends,HTTPException,status
import uuid


from app import schemas,models,crud
from app.database import get_db
from app.dependencies.auth import get_current_user


user_routes=APIRouter(prefix="/users",tags=["Users"])


@user_routes.get("/me", response_model=schemas.UserMe)
def get_current_user(current_user:models.User=Depends(get_current_user)):
    return current_user


@user_routes.put("/me", response_model=schemas.UserMe)
def update_profile(body:schemas.UserUpdate, db:Session=Depends(get_db), current_user:models.User=Depends(get_current_user)):
    user = crud.update_profile(db=db, user_id=current_user.id, body=body)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user


@user_routes.patch("/me/password", response_model=dict)
def change_password(body:schemas.ChangePassword, db:Session=Depends(get_db), current_user:models.User=Depends(get_current_user)):
    if not crud.verify_password(body.current_password, current_user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Current password is incorrect")
    
    hashed_password = crud.get_password_hash(body.new_password)
    crud.change_password(db=db, user_id=current_user.id, hashed_password=hashed_password)
    return {"message": "Password updated successfully"}


@user_routes.put("/me/avatar", response_model=schemas.UserMe)
def update_avatar(body:schemas.UserUpdate, db:Session=Depends(get_db), current_user:models.User=Depends(get_current_user)):
    user = crud.update_avatar(db=db, user_id=current_user.id, body=body)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user


@user_routes.delete("/me", response_model=dict)
def delete_account(db:Session=Depends(get_db), current_user:models.User=Depends(get_current_user)):
    success = crud.delete_account(db=db, user_id=current_user.id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return {"message": "Account deleted successfully"}


@user_routes.get("/search", response_model=list[schemas.UserPublic])
def search_users(q: str, limit: int = 20, db:Session=Depends(get_db)):
    if len(q) < 2:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Search query must be at least 2 characters")
    return crud.search_users(db=db, search_term=q, limit=limit)



from typing import Optional

from pydantic import BaseModel,EmailStr,ConfigDict,field_validator

import uuid
from datetime import datetime

# Authentication Schema
class UserRegistration(BaseModel):
    email:EmailStr
    password:str
    full_name:str
    invite_token: str | None = None


    @field_validator("password")
    @classmethod
    def password_strength(cls,password):

        if(len(password)<8):
            raise ValueError("Password must be at least 8 characters long")
        

        if(not any(char.isupper() for char in password)):
            raise ValueError("Password must contain at least one uppercase letter")
        

        if(not any(char.islower() for char in password)):
            raise ValueError("Password must contain at least one Lowercase letter")
        

        if(not any(char.isdigit() for char in password)):
            raise ValueError("Password must contain at least one digit")
        

        if (not any(char in "!@#$%^&*()_+-=[]{}|;':,.<>?/" for char in password)):
            raise ValueError("Password must contain at least one special character")
        
        return password
    

class UserLogin(BaseModel):
    email:EmailStr
    password:str


class TokenResponse(BaseModel):
    access_token:str
    refresh_token:str
    token_type:str="bearer"


class RefreshTokenRequest(BaseModel):
    refresh_token:str


# User Schema

class UserBase(BaseModel):
    email:EmailStr
    full_name:str
    avatar_url:str|None=None
    headline:str|None=None
    profile_visibility:str="public"


class UserPublic(UserBase):
    model_config=ConfigDict(extra="forbid",from_attributes=True)


    id:uuid.UUID
    is_active:bool
    created_at:datetime


class UserMe(UserPublic):
    is_verified:bool


class UserUpdate(BaseModel):
    full_name:str|None=None
    avatar_url:str|None=None
    headline:str|None=None
    profile_visibility:str|None=None


class UserOAuth(BaseModel):
    credential: str
    invite_token: Optional[str] = None

class ChangePassword(BaseModel):
    current_password: str
    new_password: str

    @field_validator("new_password")
    @classmethod
    def password_strength(cls, new_password):
        if len(new_password) < 8:
            raise ValueError("Password must be at least 8 characters long")

        if not any(char.isupper() for char in new_password):
            raise ValueError("Password must contain at least one uppercase letter")

        if not any(char.islower() for char in new_password):
            raise ValueError("Password must contain at least one lowercase letter")

        if not any(char.isdigit() for char in new_password):
            raise ValueError("Password must contain at least one digit")

        if not any(char in "!@#$%^&*()_+-=[]{}|;':,.<>?/" for char in new_password):
            raise ValueError("Password must contain at least one special character")

        return new_password

from pydantic import BaseModel,EmailStr,ConfigDict,field_validator

import uuid
from datetime import datetime

# Authentication Schema
class UserRegistration(BaseModel):
    email:EmailStr
    password:str
    full_name:str


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
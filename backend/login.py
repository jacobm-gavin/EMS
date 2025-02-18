from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel
import jwt
from databasetools import verify_user, add_user, get_user_role, get_db_connection, get_db_cursor
import os

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

loginrouter = APIRouter()

class LoginRequest(BaseModel):
    username: str
    password: str

class RoleResponse(BaseModel):
    isManager: bool

class UserResponse(BaseModel):
    id: int
    username: str
    manager: bool

class CreateUserRequest(BaseModel):
    username: str
    password: str
    manager: bool

class UpdateUserRequest(BaseModel):
    manager: bool

SECRET_KEY = os.getenv("SECRET_KEY")

def verify_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

@loginrouter.post("/login/")
def login(request: LoginRequest):
    token = verify_user(request.username, request.password)
    if token:
        decoded_token = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        payload = {
            'user_id': decoded_token['user_id'],
            'username': request.username
        }
        jwt_token = jwt.encode(payload, SECRET_KEY, algorithm="HS256")
        return {"token": jwt_token}
    raise HTTPException(status_code=401, detail="Invalid username or password")

@loginrouter.get("/user/role", response_model=RoleResponse)
def get_role(token: str = Depends(oauth2_scheme)):
    payload = verify_token(token)
    user_id = payload.get("user_id")
    if user_id is None:
        raise HTTPException(status_code=401, detail="Invalid token")
    role = get_user_role(user_id)
    return {"isManager": role}

@loginrouter.get("/users", response_model=list[UserResponse])
def get_users(token: str = Depends(oauth2_scheme)):
    payload = verify_token(token)
    user_id = payload.get("user_id")
    if user_id is None or not get_user_role(user_id):
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    with get_db_connection() as conn:
        with get_db_cursor(conn) as cur:
            cur.execute("SELECT id, username, manager FROM users")
            users = cur.fetchall()
            return [{"id": user[0], "username": user[1], "manager": user[2]} for user in users]

@loginrouter.post("/users", response_model=UserResponse)
def create_user(request: CreateUserRequest, token: str = Depends(oauth2_scheme)):
    payload = verify_token(token)
    user_id = payload.get("user_id")
    if user_id is None or not get_user_role(user_id):
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    with get_db_connection() as conn:
        with get_db_cursor(conn) as cur:
            add_user(request.username, request.password, request.manager)
            cur.execute("SELECT id FROM users WHERE username = %s", (request.username,))
            new_user_id = cur.fetchone()[0]
    
    return {"id": new_user_id, "username": request.username, "manager": request.manager}

@loginrouter.delete("/users/{user_id}", response_model=dict)
def delete_user(user_id: int, token: str = Depends(oauth2_scheme)):
    payload = verify_token(token)
    current_user_id = payload.get("user_id")
    if current_user_id is None or not get_user_role(current_user_id):
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    with get_db_connection() as conn:
        with get_db_cursor(conn) as cur:
            cur.execute("DELETE FROM users WHERE id = %s", (user_id,))
            conn.commit()
            if cur.rowcount == 0:
                raise HTTPException(status_code=404, detail="User not found")
            return {"message": "User deleted successfully"}

@loginrouter.put("/users/{user_id}/manager", response_model=UserResponse)
def update_user_manager_status(user_id: int, request: UpdateUserRequest, token: str = Depends(oauth2_scheme)):
    payload = verify_token(token)
    current_user_id = payload.get("user_id")
    if current_user_id is None or not get_user_role(current_user_id):
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    with get_db_connection() as conn:
        with get_db_cursor(conn) as cur:
            cur.execute("UPDATE users SET manager = %s WHERE id = %s", (request.manager, user_id))
            conn.commit()
            if cur.rowcount == 0:
                raise HTTPException(status_code=404, detail="User not found")
            cur.execute("SELECT id, username, manager FROM users WHERE id = %s", (user_id,))
            user = cur.fetchone()
            if user is None:
                raise HTTPException(status_code=404, detail="User not found")
            return {"id": user[0], "username": user[1], "manager": user[2]}
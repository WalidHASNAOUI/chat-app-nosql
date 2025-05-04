# app/routes/user.py
from fastapi import APIRouter
from backend.services.redis_service import add_connected_user, remove_connected_user, get_connected_users
from backend.models.user import User

router = APIRouter()

@router.post("/connect")
def connect_user(user: User):
    add_connected_user(user.username)
    return {"status": "connected"}

@router.post("/disconnect")
def disconnect_user(user: User):
    remove_connected_user(user.username)
    return {"status": "disconnected"}

@router.get("/users")
def users():
    return get_connected_users()

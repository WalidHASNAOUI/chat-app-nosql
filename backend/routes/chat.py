# app/routes/chat.py
from fastapi import APIRouter
from backend.services.mongo_service import save_message, get_messages
from backend.models.message import Message

router = APIRouter()

@router.post("/send")
def send_message(msg: Message):
    save_message(msg.sender, msg.content)
    return {"status": "Message sent"}

@router.get("/messages")
def fetch_messages():
    return get_messages()

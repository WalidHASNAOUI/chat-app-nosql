# app/services/mongo_service.py
from backend.init.config import mongo_db
from backend.models.message import Message
from datetime import datetime

def save_message(sender: str, content: str):
    message = {
        "sender": sender,
        "content": content,
        "timestamp": datetime.utcnow()
    }
    mongo_db.messages.insert_one(message)

def get_messages():
    return list(mongo_db.messages.find({}, {"_id": 0}))

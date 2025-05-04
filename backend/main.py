# app/main.py
from fastapi import FastAPI
from backend.routes import chat, user

app = FastAPI()

app.include_router(chat.router, prefix="/chat")
app.include_router(user.router, prefix="/user")

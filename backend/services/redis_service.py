# app/services/redis_service.py
from backend.init.config import redis_client

def add_connected_user(username: str):
    redis_client.sadd("connected_users", username)

def remove_connected_user(username: str):
    redis_client.srem("connected_users", username)

def get_connected_users():
    return list(redis_client.smembers("connected_users"))

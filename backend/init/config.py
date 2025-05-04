# app/config.py
from pymongo import MongoClient
import redis
import os

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
REDIS_PORT = int(os.getenv("REDIS_PORT", 6379))

mongo_client = MongoClient(MONGO_URI)
mongo_db = mongo_client["chat_app"]

redis_client = redis.Redis(host=REDIS_HOST, port=REDIS_PORT, decode_responses=True)

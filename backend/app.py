from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
import redis
from datetime import datetime

app = Flask(__name__)
CORS(app)

# on se connecte au conteneur mongo via son nom de service Docker
mongo_client = MongoClient("mongodb://mongo:27017/?replicaSet=rs0", serverSelectionTimeoutMS=5000)

db = mongo_client["chat_app"]
messages_collection = db["messages"]

# Redis connection
# on se connecte au conteneur redis via son nom de service Docker
redis_client = redis.Redis(host='redis', port=6379, db=0)


@app.route('/send', methods=['POST'])
def send_message():
    data = request.get_json()
    sender = data['sender']
    receiver = data['receiver']
    message = data['message']
    
    messages_collection.insert_one({
        "sender": sender,
        "receiver": receiver,
        "message": message,
        "timestamp": datetime.utcnow()
    })

    # Log sender as connected
    redis_client.set(sender, datetime.utcnow().isoformat())

    return jsonify({"status": "Message sent"}), 201

@app.route('/messages/<username>', methods=['GET'])
def get_messages(username):
    messages = list(messages_collection.find({
        "$or": [{"sender": username}, {"receiver": username}]
    }))
    for msg in messages:
        msg['_id'] = str(msg['_id'])  # Convert ObjectId to string
    return jsonify(messages)

@app.route('/connected-users', methods=['GET'])
def get_connected_users():
    keys = redis_client.keys('*')
    users = [key.decode('utf-8') for key in keys]
    return jsonify(users)

if __name__ == '__main__':
    app.run(host='0.0.0.0', debug=True)
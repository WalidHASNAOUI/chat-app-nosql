from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
import redis
from datetime import datetime
from collections import Counter
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
from functools import wraps
import os

app = Flask(__name__)
CORS(app)

# Clé secrète JWT
SECRET_KEY = os.getenv('JWT_SECRET', 'dev-secret-key')

# Connexion MongoDB
mongo_client = MongoClient("mongodb://localhost:27017/?replicaSet=rs0", serverSelectionTimeoutMS=5000)
try:
    repl_status = mongo_client.admin.command("replSetGetStatus")
    print("✅ ReplicaSet status:", repl_status["myState"])
except Exception as e:
    print("❌ ReplicaSet not available:", e)

db = mongo_client["chat_app"]
messages_collection = db["messages"]
users_collection = db["users"]

# Connexion Redis
redis_client = redis.Redis(host='localhost', port=6379, db=0)

# Décorateur pour vérifier le token
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            if auth_header.startswith("Bearer "):
                token = auth_header.split(" ")[1]

        if not token:
            return jsonify({'error': 'Token is missing'}), 401

        try:
            data = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
            current_user = data['username']
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Invalid token'}), 401

        return f(current_user, *args, **kwargs)
    return decorated

@app.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({"error": "Username and password are required"}), 400

    if users_collection.find_one({"username": username}):
        return jsonify({"error": "Username already exists"}), 409

    hashed_pw = generate_password_hash(password)
    users_collection.insert_one({
        "username": username,
        "password": hashed_pw,
        "created_at": datetime.utcnow()
    })

    return jsonify({"status": "User registered successfully"}), 201

@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    user = users_collection.find_one({"username": username})
    if not user or not check_password_hash(user['password'], password):
        return jsonify({"error": "Invalid credentials"}), 401

    token = jwt.encode({
        'username': username,
        'exp': datetime.utcnow().timestamp() + 86400  # Token valide 1h
    }, SECRET_KEY, algorithm="HS256")

    redis_client.set(username, datetime.utcnow().isoformat())

    return jsonify({"token": token}), 200

@app.route('/logout', methods=['POST'])
@token_required
def logout(current_user):
    redis_client.delete(current_user)
    return jsonify({"status": "Logged out"}), 200

@app.route('/send', methods=['POST'])
@token_required
def send_message(current_user):
    data = request.get_json()
    receiver = data.get('receiver')
    message = data.get('message')

    if not receiver or not message:
        return jsonify({"error": "Receiver and message are required"}), 400

    messages_collection.insert_one({
        "sender": current_user,
        "receiver": receiver,
        "message": message,
        "timestamp": datetime.utcnow()
    })

    redis_client.set(current_user, datetime.utcnow().isoformat())

    return jsonify({"status": "Message sent"}), 201

@app.route('/messages', methods=['GET'])
@token_required
def get_user_messages(current_user):
    messages = list(messages_collection.find({
        "$or": [{"sender": current_user}, {"receiver": current_user}]
    }))
    for msg in messages:
        msg['_id'] = str(msg['_id'])
    return jsonify(messages)

@app.route('/conversation/<user2>', methods=['GET'])
@token_required
def get_conversation(current_user, user2):
    messages = list(messages_collection.find({
        "$or": [
            {"sender": current_user, "receiver": user2},
            {"sender": user2, "receiver": current_user}
        ]
    }).sort("timestamp", 1))

    for msg in messages:
        msg['_id'] = str(msg['_id'])
    return jsonify(messages)

@app.route('/connected-users', methods=['GET'])
def get_connected_users():
    keys = redis_client.keys('*')
    users = [key.decode('utf-8') for key in keys]
    return jsonify(users)

@app.route('/stats', methods=['GET'])
def get_stats():
    messages = list(messages_collection.find())
    sender_counts = Counter(msg["sender"] for msg in messages)
    receiver_counts = Counter(msg["receiver"] for msg in messages)

    most_active_sender = sender_counts.most_common(1)[0] if sender_counts else ("N/A", 0)
    most_requested_user = receiver_counts.most_common(1)[0] if receiver_counts else ("N/A", 0)

    return jsonify({
        "most_active_sender": {
            "username": most_active_sender[0],
            "messages_sent": most_active_sender[1]
        },
        "most_requested_user": {
            "username": most_requested_user[0],
            "messages_received": most_requested_user[1]
        }
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', debug=True)

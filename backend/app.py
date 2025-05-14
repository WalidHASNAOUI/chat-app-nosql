from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient, errors
import redis
from datetime import datetime, timedelta
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
mongo_client = MongoClient(
    "mongodb://localhost:27017/?replicaSet=rs0",
    serverSelectionTimeoutMS=5000
)
try:
    repl_status = mongo_client.admin.command("replSetGetStatus")
    print("✅ ReplicaSet status:", repl_status["myState"])
except Exception as e:
    print("❌ ReplicaSet not available:", e)

# Base et collections
db = mongo_client["chat_app"]
messages_collection = db["messages"]
users_collection = db["users"]

# Ensure unique index to prevent duplicate messages
messages_collection.create_index(
    [("sender", 1), ("receiver", 1), ("timestamp", 1)],
    unique=True
)

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
        'exp': datetime.utcnow() + timedelta(hours=24)
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

    try:
        messages_collection.insert_one({
            "sender": current_user,
            "receiver": receiver,
            "message": message,
            "timestamp": datetime.utcnow()
        })
    except errors.DuplicateKeyError:
        pass  # ignore exact duplicate

    redis_client.set(current_user, datetime.utcnow().isoformat())
    return jsonify({"status": "Message sent"}), 201

@app.route('/conversation/<user2>', methods=['GET'])
@token_required
def get_conversation(current_user, user2):
    msgs = list(messages_collection.find({
        "$or": [
            {"sender": current_user, "receiver": user2},
            {"sender": user2, "receiver": current_user}
        ]
    }).sort("timestamp", 1))
    for msg in msgs:
        msg['_id'] = str(msg['_id'])
    return jsonify(msgs)

@app.route('/connected-users', methods=['GET'])
@token_required
def get_connected_users(current_user):
    keys = redis_client.keys('*')
    users = []
    for raw in keys:
        key = raw.decode('utf-8')
        if key.startswith('typing:') or key.startswith('history:'):
            continue
        users.append(key)
    return jsonify(users)

@app.route('/stats', methods=['GET'])
def get_stats():
    msgs = list(messages_collection.find())
    sender_counts = Counter(m["sender"] for m in msgs)
    receiver_counts = Counter(m["receiver"] for m in msgs)

    a = sender_counts.most_common(1)[0] if sender_counts else ("N/A", 0)
    b = receiver_counts.most_common(1)[0] if receiver_counts else ("N/A", 0)

    return jsonify({
        "most_active_sender": {"username": a[0], "messages_sent": a[1]},
        "most_requested_user": {"username": b[0], "messages_received": b[1]}
    })

@app.route('/typing', methods=['POST'])
@token_required
def typing(current_user):
    data = request.get_json()
    receiver = data.get('receiver')
    if not receiver:
        return jsonify({"error": "Receiver is required"}), 400

    key = f"typing:{current_user}:{receiver}"
    redis_client.setex(key, 5, '1')
    return jsonify({"status": "typing recorded"}), 200

@app.route('/typing/<peer>', methods=['GET'])
@token_required
def is_typing(current_user, peer):
    key = f"typing:{peer}:{current_user}"
    return jsonify({"typing": redis_client.exists(key) == 1}), 200

@app.route('/broadcast', methods=['POST'])
@token_required
def broadcast(current_user):
    data = request.get_json()
    message = data.get('message')
    if not message:
        return jsonify({'error': 'Message is required'}), 400

    all_users = [u['username'] for u in users_collection.find()]
    sent = 0
    for recv in all_users:
        if recv == current_user:
            continue
        try:
            messages_collection.insert_one({
                "sender": current_user,
                "receiver": recv,
                "message": message,
                "timestamp": datetime.utcnow()
            })
        except errors.DuplicateKeyError:
            continue
        redis_client.rpush(f"history:{current_user}:{recv}", message)
        sent += 1

    redis_client.set(current_user, datetime.utcnow().isoformat())
    return jsonify({'status': 'Broadcast sent', 'broadcast_to': sent}), 201

if __name__ == '__main__':
    app.run(host='0.0.0.0', debug=True)
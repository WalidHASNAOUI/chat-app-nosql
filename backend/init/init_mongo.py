from pymongo import MongoClient

# Connexion MongoDB locale
client = MongoClient("mongodb://localhost:27017/")
db = client["chat_app"]

# Création des collections + insertion de données de test
users = db["users"]
users.insert_many([
    {"username": "ibtissam", "email": "ibtissam@example.com"},
    {"username": "ayoub", "email": "ayoub@example.com"}
])

messages = db["messages"]
messages.insert_many([
    {
        "sender": "ibtissam",
        "receiver": "ayoub",
        "message": "Salut Ayoub !",
        "timestamp": "2025-04-17T10:00:00"
    },
    {
        "sender": "ayoub",
        "receiver": "ibtissam",
        "message": "Salut ! Ça va ?",
        "timestamp": "2025-04-17T10:01:00"
    }
])

conversations = db["conversations"]
conversations.insert_one({
    "participants": ["ibtissam", "ayoub"],
    "messages": [
        {"sender": "ibtissam", "text": "Salut Ayoub !"},
        {"sender": "ayoub", "text": "Salut ! Ça va ?"}
    ]
})

print("✅ Données MongoDB insérées avec succès.")

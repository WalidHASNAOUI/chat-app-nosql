import redis
import time

# Connexion Redis locale
r = redis.Redis(host='localhost', port=6379, db=0)

# Simuler une connexion utilisateur
user_id = "ibtissam"
timestamp = int(time.time())

# Stocker avec expiration de 5 minutes (300s)
r.setex(f"user:{user_id}", 300, timestamp)

# Afficher les utilisateurs connectés
print("👥 Utilisateurs connectés :")
connected_users = r.keys("user:*")
for key in connected_users:
    username = key.decode().split(":")[1]
    print(f"🔹 {username}")
